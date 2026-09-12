import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {address,getBase58Decoder} from '@solana/kit';
import {findAssociatedTokenPda} from '@solana-program/token';
import type {Pool,PoolClient} from 'pg';
import type {PaymentQuote} from '../shared/commerce';
import type {PaidChallenge,PaidEntry,PaidManifest} from '../shared/paid';
import rules from '../shared/rules-manifest.json';
import {getLevel} from '../src/game/level';
import {transaction} from './db';
import {TOKEN_PROGRAM,type PaymentChain,type Verification} from './chain';
import {ServiceError,type CommerceConfig} from './service';
import {ReturnService,returnStatus} from './returns';
import {replayInput} from './replay';
import {verifyReplayInWorker,ReplayBusyError,ReplayInvalidError} from './replay-runner';

const ACTIVE=['quoted','verifying_payment','ready','running','verifying_run','won','refunding','review'];
const iso=(date:Date|string)=>new Date(date).toISOString();
export class PaidService {
  private now:()=>Date;
  private verify:typeof verifyReplayInWorker;
  public enabled:boolean;
  constructor(public pool:Pool,private chain:PaymentChain,private config:CommerceConfig,private returns:ReturnService,options:{enabled?:boolean;now?:()=>Date;verify?:typeof verifyReplayInWorker}={}) {
    if(returns.config.mint!==config.mint||returns.config.treasury!==config.recipient||returns.config.source!==config.destination||returns.config.decimals!==config.decimals)throw new Error('Entry and return treasury configurations must match.');
    this.enabled=options.enabled??false;this.now=options.now??(()=>new Date());this.verify=options.verify??verifyReplayInWorker;
  }
  challenge():PaidChallenge {
    const mission='battery-dash',level=getLevel(mission);
    const manifest:PaidManifest={mission,rulesHash:rules.rulesHash,levelHash:rules.levelHashes[mission],seed:0,loadout:'standard',hardLimitSeconds:level.hardLimitSeconds};
    return {enabled:this.enabled,currency:'TEST SKR',entryPrice:10,grossSuccessReturn:10,unstartedHours:24,manifest,termsVersion:'devnet-v1',terms:[
      'A separate devnet challenge. Campaign retries remain unlimited and do not charge this entry.',
      'Entry costs 10 TEST SKR. A server-verified escape returns 10 TEST SKR. Verified capture or timeout returns zero. Network fees are not returned.',
      'After payment finality, choose Start within 24 hours. Cancel before starting, or let that window expire, for a full entry-token refund.',
      'Starting creates one attempt. Its submission deadline keeps counting while paused or offline; reopening does not reset it.',
      'Missing, late, incomplete or invalid run evidence goes to review with funds held. It does not automatically count as a loss or earn a refund.',
      'Accepted replay verification that repeatedly fails because of server infrastructure queues a refund. Return transactions can remain pending during a network outage.',
      'TEST SKR has no monetary value. The devnet treasury is operator-controlled, not trustless escrow.'
    ]};
  }
  private async row(wallet:string,id:string,db:Pool|PoolClient=this.pool) {
    const row=await db.query('SELECT * FROM paid_entries WHERE id=$1 AND wallet=$2',[id,wallet]);if(!row.rowCount)throw new ServiceError(404,'Paid entry not found.');return row.rows[0];
  }
  private payment(row:Record<string,any>):PaymentQuote {return {...row.quote,payment:row.payment_authorization??undefined,signature:row.paid_signature??null,detail:row.detail??null};}
  private async entry(row:Record<string,any>):Promise<PaidEntry> {
    return {id:row.id,wallet:row.wallet,status:row.status,quote:this.payment(row),manifest:row.manifest,readyUntil:row.ready_until?iso(row.ready_until):null,
      run:row.run_id?{id:row.run_id,wallet:row.wallet,startKey:row.start_key,manifest:row.manifest,issuedAt:iso(row.run_started_at),expiresAt:iso(row.run_expires_at),result:row.result}:null,
      detail:row.detail,return:row.allocation_id?await returnStatus(this.pool,row.wallet,row.allocation_id):null};
  }
  private async syncReturns(wallet?:string) {
    await this.pool.query("UPDATE paid_entries e SET status=CASE WHEN e.status='won' THEN 'returned' ELSE 'refunded' END,detail='Return finalized on devnet.' FROM return_allocations a WHERE a.id=e.allocation_id AND a.state='settled' AND e.status IN ('won','refunding') AND ($1::text IS NULL OR e.wallet=$1)",[wallet??null]);
  }
  async get(wallet:string,id:string){await this.syncReturns(wallet);return this.entry(await this.row(wallet,id));}
  async list(wallet:string){await this.syncReturns(wallet);return Promise.all((await this.pool.query('SELECT * FROM paid_entries WHERE wallet=$1 ORDER BY created_at DESC LIMIT 30',[wallet])).rows.map(row=>this.entry(row)));}
  async quote(wallet:string,requestKey:string,termsVersion:string) {
    if(termsVersion!=='devnet-v1')throw new ServiceError(409,'Review the current challenge terms before requesting an entry.');
    const previous=await this.pool.query('SELECT * FROM paid_entries WHERE wallet=$1 AND request_key=$2',[wallet,requestKey]);if(previous.rowCount)return this.entry(previous.rows[0]);
    await this.syncReturns(wallet);
    if(!this.enabled)throw new ServiceError(503,'Paid devnet challenges are not enabled. No payment has been requested.');
    await this.chain.ready();
    const [source]=await findAssociatedTokenPda({owner:address(wallet),mint:address(this.config.mint),tokenProgram:address(TOKEN_PROGRAM)});
    const row=await transaction(this.pool,async db=>{
      await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);
      const owned=await db.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[wallet]);if(!owned.rowCount)throw new ServiceError(403,'Campaign access is required for the paid devnet challenge.');
      const active=await db.query('SELECT * FROM paid_entries WHERE wallet=$1 AND (request_key=$2 OR status=ANY($3)) ORDER BY created_at DESC LIMIT 1',[wallet,requestKey,ACTIVE]);if(active.rowCount)return active.rows[0];
      const id=randomUUID(),now=this.now(),amount=10n*10n**BigInt(this.config.decimals),reserve=await this.returns.reserveInTransaction(db,wallet,`paid-entry:${id}`,amount);
      const quote:PaymentQuote={id,wallet,cluster:'solana:devnet',mint:this.config.mint,tokenProgram:TOKEN_PROGRAM,decimals:this.config.decimals,amount:amount.toString(),recipient:this.config.recipient,source,destination:this.config.destination,reference:getBase58Decoder().decode(randomBytes(32)),memo:`seeker-entry:${id}`,createdAt:now.toISOString(),expiresAt:new Date(now.getTime()+15*60_000).toISOString(),signature:null,detail:null};
      return (await db.query("INSERT INTO paid_entries(id,wallet,request_key,status,terms_version,quote,manifest,reservation_id,created_at,detail) VALUES($1,$2,$3,'quoted','devnet-v1',$4,$5,$6,$7,'Entry quoted. No payment has been requested from your wallet yet.') RETURNING *",[id,wallet,requestKey,quote,this.challenge().manifest,reserve.id,now])).rows[0];
    });return this.entry(row);
  }
  private async checkPayment(observed:Record<string,any>,signature:string,result:Verification) {
    await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 FOR UPDATE',[observed.id])).rows[0];
      await db.query('INSERT INTO paid_payment_attempts(entry_id,signature) VALUES($1,$2) ON CONFLICT DO NOTHING',[row.id,signature]);
      if(result.state==='invalid'){await db.query("UPDATE paid_payment_attempts SET state='invalid',detail=$3 WHERE entry_id=$1 AND signature=$2",[row.id,signature,result.detail]);return;}
      if(result.state==='pending'){if(['quoted','verifying_payment'].includes(row.status))await db.query("UPDATE paid_entries SET status='verifying_payment',detail=$2 WHERE id=$1",[row.id,result.detail]);return;}
      if(row.paid_signature===signature)return;
      if(result.state==='needs_review'||row.paid_signature||!['quoted','verifying_payment'].includes(row.status)){
        const detail=result.state==='needs_review'?result.detail:row.paid_signature?'An additional payment needs review; it does not grant a second attempt.':'Payment arrived after this entry closed; review is required.';
        await db.query("UPDATE paid_entries SET status='review',detail=$2 WHERE id=$1",[row.id,detail]);await db.query("UPDATE paid_payment_attempts SET state='review',detail=$3 WHERE entry_id=$1 AND signature=$2",[row.id,signature,detail]);return;
      }
      if(result.state!=='verified')return;
      const reserve=await db.query('SELECT state FROM return_reservations WHERE id=$1 FOR UPDATE',[row.reservation_id]);
      if(reserve.rows[0]?.state!=='held')throw new ServiceError(409,'The payment needs return-funding review.');
      const receipt=await db.query("INSERT INTO transfer_receipts(signature,instruction_index,source_kind,source_id,slot) VALUES($1,$2,'paid_entry',$3,$4) ON CONFLICT DO NOTHING RETURNING source_id",[signature,result.instructionIndex,row.id,result.slot]);
      if(!receipt.rowCount){await db.query("UPDATE paid_entries SET status='review',detail='This transfer instruction is already assigned to another purchase or entry.' WHERE id=$1",[row.id]);return;}
      await db.query("UPDATE paid_entries SET status='ready',paid_signature=$2,paid_slot=$3,ready_until=$4,detail='Entry payment finalized. Choose Start when ready; your run clock has not started.' WHERE id=$1",[row.id,signature,result.slot,new Date(this.now().getTime()+24*3600_000)]);
      await db.query("UPDATE paid_payment_attempts SET state='verified' WHERE entry_id=$1 AND signature=$2",[row.id,signature]);
    });
  }
  private async scan(row:Record<string,any>,minContextSlot?:number) {
    const attempts=await this.pool.query("SELECT signature FROM paid_payment_attempts WHERE entry_id=$1 AND state='pending'",[row.id]);
    const signatures=new Set<string>(attempts.rows.map(r=>r.signature));for(const sig of await this.chain.find(row.quote.reference,minContextSlot))signatures.add(sig);
    let unresolved=false;
    for(const sig of signatures){const result=await this.chain.verify(this.payment(row),sig);if(result.state==='pending')unresolved=true;await this.checkPayment(row,sig,result);}
    return unresolved;
  }
  async reconcile(wallet:string,id:string) {
    const observed=await this.row(wallet,id);
    if(!['quoted','verifying_payment','expired'].includes(observed.status))return this.get(wallet,id);
    const lifetime=await this.chain.lifetime(),height=await this.chain.height(Number(lifetime.contextSlot));
    const unresolved=await this.scan(observed,Number(lifetime.contextSlot));
    await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!['quoted','verifying_payment'].includes(row.status)||unresolved)return;
      if(row.payment_authorization?.id!==observed.payment_authorization?.id)return;
      if(new Date(row.quote.expiresAt).getTime()>this.now().getTime())return;
      if(row.payment_authorization&&BigInt(height)<=BigInt(row.payment_authorization.lastValidBlockHeight))return;
      await this.returns.releaseInTransaction(db,row.reservation_id,'unpaid-finalized-expiry');
      await db.query("UPDATE paid_entries SET status='expired',detail='Unpaid quote and authorization expired; finalized reconciliation found no entry payment.' WHERE id=$1",[id]);
    });await this.pool.query('UPDATE paid_entries SET checked_at=now() WHERE id=$1',[id]);return this.get(wallet,id);
  }
  async prepare(wallet:string,id:string) {
    await this.reconcile(wallet,id);const observed=await this.row(wallet,id);
    if(!['quoted','verifying_payment'].includes(observed.status))return this.entry(observed);
    if(!this.enabled)throw new ServiceError(503,'New payment approvals are paused. Restore this entry before paying again.');
    await this.chain.ready();const lifetime=await this.chain.lifetime(),height=await this.chain.height(Number(lifetime.contextSlot));
    const unresolved=await this.scan(observed,Number(lifetime.contextSlot));
    const row=await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet])).rows[0];
      if(!['quoted','verifying_payment'].includes(row.status))return row;
      if(unresolved)throw new ServiceError(409,'Payment reconciliation is incomplete. Do not approve another transfer.');
      if(row.payment_authorization?.id!==observed.payment_authorization?.id)return row;
      if(row.payment_authorization&&BigInt(height)<=BigInt(row.payment_authorization.lastValidBlockHeight))return row;
      if(new Date(row.quote.expiresAt).getTime()-this.now().getTime()<180_000)throw new ServiceError(409,'This quote is too close to expiry for a new approval. Reconcile it after expiry.');
      const payment={id:randomUUID(),...lifetime};
      return (await db.query("UPDATE paid_entries SET status='verifying_payment',payment_authorization=$2,detail='Payment approval prepared. Resuming reuses this same transaction.' WHERE id=$1 RETURNING *",[id,payment])).rows[0];
    });return this.entry(row);
  }
  async attach(wallet:string,id:string,signature:string) {
    const row=await this.row(wallet,id);
    const attempts=await this.pool.query('SELECT count(*) FROM paid_payment_attempts WHERE entry_id=$1 AND signature<>$2',[id,signature]);if(Number(attempts.rows[0].count)>=5)throw new ServiceError(409,'This entry needs payment reconciliation before another attempt.');
    await this.checkPayment(row,signature,await this.chain.verify(this.payment(row),signature));return this.get(wallet,id);
  }
  async start(wallet:string,id:string,rulesHash:string,startKey:string) {
    const row=await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet])).rows[0];if(!row)throw new ServiceError(404,'Paid entry not found.');
      if(row.manifest.rulesHash!==rulesHash)throw new ServiceError(409,'Update the app to this entry’s game rules, or cancel before starting for a refund.');
      if(row.run_id){if(row.start_key!==startKey)throw new ServiceError(409,'This attempt was started by another request. Restore its existing saved run; it cannot start again.');return row;}
      if(row.status!=='ready')throw new ServiceError(409,'A finalized entry payment is required before starting.');
      if(!this.enabled)throw new ServiceError(503,'New runs are paused. This unstarted entry can be refunded.');
      const now=this.now();if(new Date(row.ready_until).getTime()<=now.getTime())throw new ServiceError(409,'The start window expired. Reconcile the entry to check its refund.');
      return (await db.query("UPDATE paid_entries SET status='running',run_id=$2,run_started_at=$3,run_expires_at=$4,start_key=$5,detail='Paid attempt started. Its original submission deadline applies after restart.' WHERE id=$1 RETURNING *",[id,randomUUID(),now,new Date(now.getTime()+(row.manifest.hardLimitSeconds+180)*1000),startKey])).rows[0];
    });return this.entry(row);
  }
  private async refund(db:PoolClient,row:Record<string,any>,detail:string) {
    const allocation=await this.returns.allocateInTransaction(db,row.reservation_id,'refund');
    await db.query("UPDATE paid_entries SET status='refunding',allocation_id=$2,detail=$3,lease_until=NULL WHERE id=$1",[row.id,allocation.id,detail]);
  }
  async cancel(wallet:string,id:string) {
    await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet])).rows[0];if(!row)throw new ServiceError(404,'Paid entry not found.');
      if(['refunding','refunded'].includes(row.status))return;
      if(row.status!=='ready'||row.run_id)throw new ServiceError(409,'Only a paid, unstarted entry can be cancelled for an automatic refund.');
      await this.refund(db,row,'Unstarted entry cancelled. The entry-token refund is queued; network fees are excluded.');
    });return this.get(wallet,id);
  }
  async submit(wallet:string,id:string,input:{runId:string;rulesHash:string;replay:unknown}) {
    const replay=replayInput.parse(input.replay),hash=createHash('sha256').update(JSON.stringify(replay)).digest('hex'),ticks=replay.chunks.reduce((n,c)=>n+c.ticks,0),now=this.now();
    const row=await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet])).rows[0];if(!row)throw new ServiceError(404,'Paid entry not found.');
      if(input.runId!==row.run_id||input.rulesHash!==row.manifest.rulesHash)throw new ServiceError(409,'The replay does not belong to this paid attempt.');
      if(row.replay_hash){if(row.replay_hash!==hash)throw new ServiceError(409,'This paid attempt already contains a different replay.');return row;}
      if(row.status!=='running')throw new ServiceError(409,'This paid attempt is no longer accepting a result.');
      if(new Date(row.run_expires_at).getTime()<=now.getTime())return (await db.query("UPDATE paid_entries SET status='review',detail='The result arrived after its deadline. Funds are held for review; no automatic return or loss was assigned.' WHERE id=$1 RETURNING *",[id])).rows[0];
      if(ticks>row.manifest.hardLimitSeconds*30||ticks/30>(now.getTime()-new Date(row.run_started_at).getTime())/1000+2)throw new ServiceError(400,'Replay duration exceeds this paid ticket.');
      return (await db.query("UPDATE paid_entries SET status='verifying_run',replay=$2,replay_hash=$3,submitted_at=$4,detail='Checking the paid attempt before assigning a return.' WHERE id=$1 RETURNING *",[id,replay,hash,now])).rows[0];
    });return this.entry(row);
  }
  async process() {
    const now=this.now();await this.syncReturns();
    // Expired unstarted entries refund; missing started-run evidence stays held.
    const aging=await this.pool.query("SELECT id,wallet FROM paid_entries WHERE (status='ready' AND ready_until<=$1) OR (status='running' AND run_expires_at<=$1) LIMIT 8",[now]);
    for(const item of aging.rows)await transaction(this.pool,async db=>{
      const row=(await db.query('SELECT * FROM paid_entries WHERE id=$1 FOR UPDATE',[item.id])).rows[0];
      if(row.status==='ready'&&new Date(row.ready_until)<=now)await this.refund(db,row,'The 24-hour start window expired. The unstarted entry-token refund is queued.');
      else if(row.status==='running'&&new Date(row.run_expires_at)<=now)await db.query("UPDATE paid_entries SET status='review',detail='The submission window ended without a verifiable result. Funds remain held for review.' WHERE id=$1",[row.id]);
    });
    const job=await transaction(this.pool,async db=>{
      const row=(await db.query("SELECT * FROM paid_entries WHERE status='verifying_run' AND verify_after<=now() AND (lease_until IS NULL OR lease_until<now()) ORDER BY submitted_at FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];if(!row)return null;
      row.lease_token=randomUUID();await db.query("UPDATE paid_entries SET lease_token=$2,lease_until=now()+interval '30 seconds',verify_attempts=verify_attempts+1 WHERE id=$1",[row.id,row.lease_token]);return row;
    });if(!job)return false;
    try {
      const result=await this.verify(job.manifest.mission,job.replay,{rulesHash:job.manifest.rulesHash});
      await transaction(this.pool,async db=>{
        const row=(await db.query("SELECT * FROM paid_entries WHERE id=$1 AND lease_token=$2 AND status='verifying_run' FOR UPDATE",[job.id,job.lease_token])).rows[0];if(!row)return;
        if(result.status==='won'){
          const allocation=await this.returns.allocateInTransaction(db,row.reservation_id,'success');
          await db.query("UPDATE paid_entries SET status='won',result=$2,allocation_id=$3,lease_until=NULL,detail='Escape verified. Your gross entry-token return is queued.' WHERE id=$1",[row.id,result,allocation.id]);
        }else if(result.status==='caught'||result.status==='timeout'){
          await this.returns.releaseInTransaction(db,row.reservation_id,'verified-loss');await db.query("UPDATE paid_entries SET status='lost',result=$2,lease_until=NULL,detail='The replay confirms capture or timeout. This paid attempt returns zero tokens.' WHERE id=$1",[row.id,result]);
        }else await db.query("UPDATE paid_entries SET status='review',result=$2,lease_until=NULL,detail='The replay is incomplete. Funds remain held for review.' WHERE id=$1",[row.id,result]);
      });
    }catch(error){
      await transaction(this.pool,async db=>{
        const row=(await db.query("SELECT * FROM paid_entries WHERE id=$1 AND lease_token=$2 AND status='verifying_run' FOR UPDATE",[job.id,job.lease_token])).rows[0];if(!row)return;
        if(error instanceof ReplayInvalidError)await db.query("UPDATE paid_entries SET status='review',lease_until=NULL,detail='The input replay failed game-rule validation. Funds remain held for review.' WHERE id=$1",[row.id]);
        else if(!(error instanceof ReplayBusyError)&&row.verify_attempts>=5)await this.refund(db,row,'Server verification could not finish after repeated infrastructure failures. An entry-token refund is queued.');
        else await db.query("UPDATE paid_entries SET lease_until=NULL,verify_after=now()+interval '3 seconds',verify_attempts=verify_attempts-$2,detail='Server verification will retry. No loss has been assigned.' WHERE id=$1",[row.id,error instanceof ReplayBusyError?1:0]);
      });
    }return true;
  }
}
