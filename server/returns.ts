import {randomBytes, randomUUID} from 'node:crypto';
import {address, getBase58Decoder} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import type {Pool,PoolClient} from 'pg';
import {transaction} from './db';
import {TOKEN_PROGRAM} from './chain';
import {ServiceError} from './service';
import type {ReturnStatus} from '../shared/returns';

export const RETURN_FEE_RESERVE = 3_000_000n;
export type ReturnConfig = {mint: string; treasury: string; source: string; decimals: number};
export type ReturnBinding = ReturnConfig & {id: string; wallet: string; destination: string; amount: string; reference: string; memo: string};
export type SignedReturn = {signature: string; wire: string; blockhash: string; lastValidHeight: string; contextSlot: string};
export type ReturnInspection = {state: 'settled'; slot: number} | {state: 'pending' | 'expired' | 'failed' | 'review'; detail: string};
export interface ReturnChain {
  available(minContextSlot?: number): Promise<{tokens: bigint; lamports: bigint}>;
  prepare(binding: ReturnBinding): Promise<SignedReturn>; // Must never broadcast.
  inspect(binding: ReturnBinding, attempt: SignedReturn): Promise<ReturnInspection>;
  broadcast(attempt: SignedReturn): Promise<void>;
}
export async function returnStatus(pool: Pool, wallet: string, id: string): Promise<ReturnStatus> {
  const row = await pool.query('SELECT a.id,a.outcome,a.state,a.detail,a.receipt,r.amount,r.wallet,r.mint,r.decimals,r.cluster FROM return_allocations a JOIN return_reservations r ON r.id=a.reservation_id WHERE a.id=$1 AND r.wallet=$2', [id, wallet]);
  if (!row.rowCount) throw new ServiceError(404, 'Return not found.');
  return row.rows[0];
}

/** Internal service only. A verified entry/outcome must authorize allocation;
 * there is deliberately no HTTP allocation or reservation-release endpoint. */
export class ReturnService {
  constructor(public pool: Pool, public chain: ReturnChain | undefined, public config: ReturnConfig) {}

  async reserve(wallet: string, externalKey: string, amount: bigint) {
    return transaction(this.pool, db => this.reserveInTransaction(db, wallet, externalKey, amount));
  }
  async reserveInTransaction(db: PoolClient, wallet: string, externalKey: string, amount: bigint) {
    address(wallet);
    if (amount <= 0n || amount > 18_446_744_073_709_551_615n || !externalKey || externalKey.length > 160) throw new ServiceError(400, 'Invalid return reservation.');
    const [destination] = await findAssociatedTokenPda({owner: address(wallet), mint: address(this.config.mint), tokenProgram: address(TOKEN_PROGRAM)});
    await db.query('SELECT pg_advisory_xact_lock(1936024940)');
    const prior = await db.query('SELECT * FROM return_reservations WHERE external_key=$1', [externalKey]);
    if (prior.rowCount) {
      const row = prior.rows[0];
      if (row.wallet !== wallet || row.amount !== amount.toString() || row.mint !== this.config.mint || row.treasury !== this.config.treasury || row.decimals !== this.config.decimals || row.source !== this.config.source || row.destination !== destination) throw new ServiceError(409, 'Reservation key is already bound to a different return.');
      return row;
    }
    // Read balance while holding the allocation lock, then subtract every
    // outstanding maximum return. Pending broadcasts still consume capacity.
    const settled = (await db.query("SELECT coalesce(max((a.receipt->>'slot')::bigint),0)::text AS slot FROM return_allocations a JOIN return_reservations r ON r.id=a.reservation_id WHERE r.treasury=$1 AND a.state='settled'", [this.config.treasury])).rows[0];
    if (!this.chain) throw new ServiceError(503, 'Devnet return funding is unavailable.');
    const balance = await this.chain.available(Number(settled.slot));
    const held = (await db.query("SELECT coalesce(sum(CASE WHEN mint=$1 THEN amount ELSE 0 END),0)::text AS tokens,coalesce(sum(fee_lamports),0)::text AS fees FROM return_reservations WHERE treasury=$2 AND state='held'", [this.config.mint, this.config.treasury])).rows[0];
    if (balance.tokens < BigInt(held.tokens) + amount || balance.lamports < BigInt(held.fees) + RETURN_FEE_RESERVE) throw new ServiceError(503, 'The devnet treasury cannot reserve this return and its network costs.');
    const row = await db.query("INSERT INTO return_reservations(id,external_key,wallet,cluster,mint,token_program,decimals,treasury,source,destination,amount,fee_lamports) VALUES($1,$2,$3,'solana:devnet',$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *", [randomUUID(), externalKey, wallet, this.config.mint, TOKEN_PROGRAM, this.config.decimals, this.config.treasury, this.config.source, destination, amount.toString(), RETURN_FEE_RESERVE.toString()]);
    return row.rows[0];
  }

  async release(id: string, reason: 'unpaid-finalized-expiry' | 'verified-loss') {
    return transaction(this.pool, db => this.releaseInTransaction(db, id, reason));
  }
  async releaseInTransaction(db: PoolClient, id: string, reason: 'unpaid-finalized-expiry' | 'verified-loss') {
    const row = await db.query('SELECT * FROM return_reservations WHERE id=$1 FOR UPDATE', [id]);
    if (!row.rowCount) throw new ServiceError(404, 'Reservation not found.');
    const allocated = await db.query('SELECT 1 FROM return_allocations WHERE reservation_id=$1', [id]);
    if (allocated.rowCount || row.rows[0].state === 'settled') throw new ServiceError(409, 'An allocated return cannot be released.');
    if (row.rows[0].state === 'released') return;
    await db.query("UPDATE return_reservations SET state='released',release_reason=$2 WHERE id=$1", [id, reason]);
  }

  async allocate(reservationId: string, outcome: 'success' | 'refund') {
    return transaction(this.pool, db => this.allocateInTransaction(db, reservationId, outcome));
  }
  async allocateInTransaction(db: PoolClient, reservationId: string, outcome: 'success' | 'refund') {
    const reserve = await db.query('SELECT * FROM return_reservations WHERE id=$1 FOR UPDATE', [reservationId]);
    if (!reserve.rowCount) throw new ServiceError(404, 'Reservation not found.');
    const prior = await db.query('SELECT * FROM return_allocations WHERE reservation_id=$1', [reservationId]);
    if (prior.rowCount) {
      if (prior.rows[0].outcome !== outcome) throw new ServiceError(409, 'This entry already has a different allocated outcome.');
      return prior.rows[0];
    }
    if (reserve.rows[0].state !== 'held') throw new ServiceError(409, 'Return funds are no longer reserved.');
    const id = randomUUID(), reference = getBase58Decoder().decode(randomBytes(32));
    return (await db.query('INSERT INTO return_allocations(id,reservation_id,outcome,reference,memo) VALUES($1,$2,$3,$4,$5) RETURNING *', [id, reservationId, outcome, reference, `seeker-return:${id}`])).rows[0];
  }

  async status(wallet: string, id: string) {
    return returnStatus(this.pool, wallet, id);
  }

  async process() {
    const chain=this.chain;if(!chain)return false;
    const job = await transaction(this.pool, async db => {
      const found = await db.query("SELECT a.*,r.wallet,r.mint,r.decimals,r.treasury,r.source,r.destination,r.amount FROM return_allocations a JOIN return_reservations r ON r.id=a.reservation_id WHERE a.state IN ('queued','pending') AND a.process_after<=now() AND (a.lease_until IS NULL OR a.lease_until<now()) ORDER BY a.created_at FOR UPDATE OF a SKIP LOCKED LIMIT 1");
      if (!found.rowCount) return null;
      const row = found.rows[0]; row.lease_token = randomUUID();
      await db.query("UPDATE return_allocations SET lease_until=now()+interval '90 seconds',lease_token=$2 WHERE id=$1", [row.id, row.lease_token]);
      return row;
    });
    if (!job) return false;
    const binding: ReturnBinding = {id: job.id, wallet: job.wallet, mint: job.mint, decimals: job.decimals, treasury: job.treasury, source: job.source, destination: job.destination, amount: job.amount, reference: job.reference, memo: job.memo};
    const update = (state: string, detail: string) => this.pool.query("UPDATE return_allocations SET state=$3,detail=$4,lease_until=NULL,process_after=now()+interval '5 seconds' WHERE id=$1 AND lease_token=$2 AND state IN ('queued','pending')", [job.id, job.lease_token, state, detail]);
    try {
      if (job.mint !== this.config.mint || job.treasury !== this.config.treasury || job.source !== this.config.source || job.decimals !== this.config.decimals) {
        await update('review', 'Return configuration changed. Funds remain reserved for review.'); return true;
      }
      const row = await this.pool.query('SELECT * FROM return_attempts WHERE id=$1', [job.active_attempt]);
      let attempt = row.rows[0];
      if (attempt) {
        const signed = signedFromRow(attempt), result = await chain.inspect(binding, signed);
        if (result.state === 'settled') {
          await transaction(this.pool, async db => {
            // A capacity reader may already have a pre-transfer balance. Keep
            // this liability held until that reader finishes its reservation.
            await db.query('SELECT pg_advisory_xact_lock(1936024940)');
            const done = await db.query("UPDATE return_allocations SET state='settled',receipt=$3,detail='Return finalized on devnet.',lease_until=NULL WHERE id=$1 AND lease_token=$2 AND active_attempt=$4 RETURNING reservation_id", [job.id, job.lease_token, {signature: signed.signature, slot: result.slot, cluster: 'solana:devnet'}, attempt.id]);
            if (!done.rowCount) return;
            await db.query("UPDATE return_attempts SET state='settled' WHERE id=$1", [attempt.id]);
            await db.query("UPDATE return_reservations SET state='settled' WHERE id=$1", [job.reservation_id]);
          }); return true;
        }
        if (result.state === 'review') {await update('review', result.detail); return true;}
        if (result.state === 'pending') {
          await chain.broadcast(signed);
          await update('pending', result.detail); return true;
        }
        // Only definitive expiry/non-execution or finalized failure permits a
        // new signature. Keep the old attempt as permanent reconciliation evidence.
        const cleared = await transaction(this.pool, async db => {
          const changed = await db.query('UPDATE return_allocations SET active_attempt=NULL WHERE id=$1 AND lease_token=$2 AND active_attempt=$3 RETURNING id', [job.id, job.lease_token, attempt.id]);
          if (!changed.rowCount) return false;
          await db.query('UPDATE return_attempts SET state=$2 WHERE id=$1', [attempt.id, result.state]); return true;
        });
        if (!cleared) return true;
        attempt = undefined;
      }
      if (!attempt) {
        const count = Number((await this.pool.query('SELECT count(*) FROM return_attempts WHERE allocation_id=$1', [job.id])).rows[0].count);
        if (count >= job.attempt_ceiling) {await update('review', 'The transaction retry budget was exhausted. Funds remain reserved for support.'); return true;}
        const signed = await chain.prepare(binding); // Local sign only.
        const saved = await transaction(this.pool, async db => {
          const current = await db.query('SELECT lease_token,active_attempt,state FROM return_allocations WHERE id=$1 FOR UPDATE', [job.id]);
          if (current.rows[0].lease_token !== job.lease_token || current.rows[0].active_attempt || !['queued','pending'].includes(current.rows[0].state)) return false;
          const id = randomUUID();
          await db.query("INSERT INTO return_attempts(id,allocation_id,sequence,signature,wire,blockhash,last_valid_height,context_slot,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'prepared')", [id, job.id, count + 1, signed.signature, signed.wire, signed.blockhash, signed.lastValidHeight, signed.contextSlot]);
          await db.query("UPDATE return_allocations SET active_attempt=$2,state='pending' WHERE id=$1", [job.id, id]); return true;
        });
        if (!saved) return true; // Never broadcast a discarded/stale signature.
        await chain.broadcast(signed);
        await update('pending', 'Return sent; waiting for finalized verification.');
      }
    } catch {
      // Do not leak signer/RPC payloads. An uncertain send retains its original
      // bytes and liability; it is never converted into another allocation.
      await update('pending', 'Return reconciliation will retry. Funds remain reserved.');
    }
    return true;
  }
}
function signedFromRow(row: Record<string, any>): SignedReturn {
  return {signature: row.signature, wire: row.wire, blockhash: row.blockhash, lastValidHeight: row.last_valid_height, contextSlot: row.context_slot};
}
