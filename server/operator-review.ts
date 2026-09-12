import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {Pool,PoolClient} from 'pg';
import type {PaymentChain} from './chain';
import {transaction} from './db';
import {ServiceError} from './service';
import {ReturnService} from './returns';
import {replayInput} from './replay';

export const reviewRequest=z.object({
 id:z.string().uuid(),action:z.enum(['refund-entry','retry-replay','retry-return']),
 targetId:z.string().uuid(),expectedHash:z.string().regex(/^[a-f0-9]{64}$/),
 actor:z.string().trim().min(1).max(120),note:z.string().trim().min(12).max(2000),
}).strict();
export type ReviewRequest=z.infer<typeof reviewRequest>;
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
type Connection=Pool|PoolClient;

/** Local operator tool, deliberately not registered as an HTTP endpoint. */
export class OperatorReview {
 constructor(private pool:Pool,private chain:PaymentChain,private returns:ReturnService){}
 private async entry(db:Connection,id:string,lock=false){
  const r=await db.query(`SELECT e.*,r.state AS reserve_state,r.amount AS reserve_amount,r.wallet AS reserve_wallet,r.mint AS reserve_mint,r.treasury AS reserve_treasury,r.source AS reserve_source,r.decimals AS reserve_decimals,a.state AS allocation_state FROM paid_entries e JOIN return_reservations r ON r.id=e.reservation_id LEFT JOIN return_allocations a ON a.id=e.allocation_id WHERE e.id=$1 ${lock?'FOR UPDATE OF e,r':''}`,[id]);
  if(!r.rowCount)throw new ServiceError(404,'Entry not found.');return r.rows[0];
 }
 private entrySummary(e:Record<string,any>){return {id:e.id,wallet:e.wallet,status:e.status,detail:e.detail,paidSignature:e.paid_signature,reservationId:e.reservation_id,reservationState:e.reserve_state,amount:e.reserve_amount,mint:e.reserve_mint,allocationId:e.allocation_id,allocationState:e.allocation_state,runId:e.run_id,replayHash:e.replay_hash,submittedAt:e.submitted_at,result:e.result};}
 async inspectEntry(id:string){const summary=this.entrySummary(await this.entry(this.pool,id));return {kind:'entry',...summary,expectedHash:hash(summary)};}
 private async allocation(db:Connection,id:string,lock=false){
  const r=await db.query(`SELECT a.*,r.state AS reserve_state,r.wallet,r.mint,r.treasury,r.source,r.decimals,r.amount,(SELECT count(*)::integer FROM return_attempts t WHERE t.allocation_id=a.id) AS attempts FROM return_allocations a JOIN return_reservations r ON r.id=a.reservation_id WHERE a.id=$1 ${lock?'FOR UPDATE OF a,r':''}`,[id]);
  if(!r.rowCount)throw new ServiceError(404,'Return not found.');return r.rows[0];
 }
 private returnSummary(a:Record<string,any>){return {id:a.id,wallet:a.wallet,state:a.state,detail:a.detail,outcome:a.outcome,amount:a.amount,mint:a.mint,reservationState:a.reserve_state,activeAttempt:a.active_attempt,attempts:a.attempts,attemptCeiling:a.attempt_ceiling,receipt:a.receipt};}
 async inspectReturn(id:string){const summary=this.returnSummary(await this.allocation(this.pool,id));return {kind:'return',...summary,expectedHash:hash(summary)};}
 private configMatches(row:{mint:string;treasury:string;source:string;decimals:number}){
  const c=this.returns.config;if(row.mint!==c.mint||row.treasury!==c.treasury||row.source!==c.source||row.decimals!==c.decimals)throw new ServiceError(409,'Restore the original devnet treasury configuration before resolving this record.');
 }
 async apply(input:ReviewRequest){
  const request=reviewRequest.parse(input),requestHash=hash(request);
  return transaction(this.pool,async db=>{
   // Serialize retries of this operator request, including across processes.
   await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,1936024941))',[request.id]);
   const existing=await db.query('SELECT request_hash,result FROM operator_reviews WHERE id=$1',[request.id]);
   if(existing.rowCount){if(existing.rows[0].request_hash!==requestHash)throw new ServiceError(409,'This review request ID was already used with different instructions.');return existing.rows[0].result;}
   let result:Record<string,unknown>;
   if(request.action==='retry-return'){
    const row=await this.allocation(db,request.targetId,true);
    if(hash(this.returnSummary(row))!==request.expectedHash)throw new ServiceError(409,'The return changed. Inspect it again before applying a review.');
    this.configMatches(row);
    if(row.state!=='review'||row.reserve_state!=='held'||row.receipt)throw new ServiceError(409,'Only a held, unresolved return in review can be retried.');
    const ceiling=Math.max(row.attempt_ceiling,row.attempts+8);
    if(ceiling>128)throw new ServiceError(409,'Automatic retry ceiling reached. Reconcile the preserved attempts before further recovery.');
    // Never clear or replace active_attempt. Its original signed bytes must be
    // reconciled before the worker is allowed to create another transaction.
    await db.query("UPDATE return_allocations SET state='pending',attempt_ceiling=$2,lease_token=NULL,lease_until=NULL,process_after=now(),detail='Operator requested reconciliation of the preserved return attempt.' WHERE id=$1",[row.id,ceiling]);
    result={id:row.id,status:'pending',activeAttempt:row.active_attempt,attemptCeiling:ceiling};
   }else{
    const row=await this.entry(db,request.targetId,true);
    if(hash(this.entrySummary(row))!==request.expectedHash)throw new ServiceError(409,'The entry changed. Inspect it again before applying a review.');
    this.configMatches({mint:row.reserve_mint,treasury:row.reserve_treasury,source:row.reserve_source,decimals:row.reserve_decimals});
    if(row.status!=='review'||row.reserve_state!=='held'||row.allocation_id)throw new ServiceError(409,'This action requires an entry in review with its original held reserve and no allocated return.');
    if(!row.paid_signature||row.reserve_wallet!==row.wallet||row.reserve_amount!==row.quote.amount)throw new ServiceError(409,'A verified original entry payment is required. Late or additional payments need separate payment reconciliation.');
    const additional=await db.query("SELECT 1 FROM paid_payment_attempts WHERE entry_id=$1 AND signature<>$2 AND state='review' LIMIT 1",[row.id,row.paid_signature]);
    if(additional.rowCount)throw new ServiceError(409,'An additional payment is unresolved. Reconcile that payment before closing the original entry review.');
    const receipt=await db.query("SELECT instruction_index,slot FROM transfer_receipts WHERE signature=$1 AND source_kind='paid_entry' AND source_id=$2",[row.paid_signature,row.id]);
    if(!receipt.rowCount)throw new ServiceError(409,'The entry has no matching payment receipt.');
    await this.chain.ready();const payment=await this.chain.verify(row.quote,row.paid_signature);
    if(payment.state!=='verified'||payment.instructionIndex!==receipt.rows[0].instruction_index||String(payment.slot)!==String(receipt.rows[0].slot))throw new ServiceError(409,'The original finalized payment could not be reconfirmed. No review action was applied.');
    if(request.action==='refund-entry'){
     const allocation=await this.returns.allocateInTransaction(db,row.reservation_id,'refund');
     await db.query("UPDATE paid_entries SET status='refunding',allocation_id=$2,lease_token=NULL,lease_until=NULL,detail='Operator review approved an entry-token refund. Network fees are excluded.' WHERE id=$1",[row.id,allocation.id]);
     result={id:row.id,status:'refunding',allocationId:allocation.id};
    }else{
     if(!row.replay||!row.replay_hash||!row.run_id||hash(replayInput.parse(row.replay))!==row.replay_hash)throw new ServiceError(409,'No intact, previously submitted replay is available to retry.');
     await db.query("UPDATE paid_entries SET status='verifying_run',lease_token=NULL,lease_until=NULL,verify_attempts=0,verify_after=now(),detail='Operator requested another verification of the original recorded inputs.' WHERE id=$1",[row.id]);
     result={id:row.id,status:'verifying_run',replayHash:row.replay_hash};
    }
   }
   await db.query('INSERT INTO operator_reviews(id,request_hash,action,target_id,actor,note,expected_hash,result) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[request.id,requestHash,request.action,request.targetId,request.actor,request.note,request.expectedHash,result]);
   return result;
  });
 }
}
