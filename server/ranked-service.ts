import {createHash,randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {CAMPAIGN_IDS,getLevel,type MissionId} from '../src/game/level';
import type {DailyManifest,RunTicket,Leaderboard,LeaderboardEntry} from '../shared/ranked';
import rules from '../shared/rules-manifest.json';
import {transaction} from './db';
import {ServiceError} from './service';
import {replayInput} from './replay';
import {verifyReplayInWorker,ReplayBusyError,ReplayInvalidError} from './replay-runner';
const iso=(date:Date|string)=>new Date(date).toISOString();
function ticket(row:Record<string,any>):RunTicket{return {id:row.id,wallet:row.wallet,status:row.status,manifest:row.manifest,issuedAt:iso(row.issued_at),expiresAt:iso(row.expires_at),result:row.result,detail:row.detail};}
export function dailyMission(date:Date):MissionId{return CAMPAIGN_IDS[Math.floor(date.getTime()/86400000)%CAMPAIGN_IDS.length]!;}
export class RankedService {
 private now:()=>Date;
 constructor(public pool:Pool,options:{now?:()=>Date}={}){this.now=options.now??(()=>new Date());}
 async daily():Promise<DailyManifest>{
  const now=this.now(),day=now.toISOString().slice(0,10),mission=dailyMission(now),level=getLevel(mission),start=new Date(`${day}T00:00:00.000Z`);
  const manifest:DailyManifest={day,mission,rulesHash:rules.rulesHash,levelHash:rules.levelHashes[mission as keyof typeof rules.levelHashes],seed:0,loadout:'standard',startsAt:start.toISOString(),endsAt:new Date(start.getTime()+86400000).toISOString(),hardLimitSeconds:level.hardLimitSeconds};
  await this.pool.query('INSERT INTO daily_manifests(day,manifest) VALUES($1,$2) ON CONFLICT DO NOTHING',[day,manifest]);
  return (await this.pool.query('SELECT manifest FROM daily_manifests WHERE day=$1',[day])).rows[0].manifest;
 }
 async get(wallet:string,id:string){const row=await this.pool.query('SELECT * FROM ranked_runs WHERE id=$1 AND wallet=$2',[id,wallet]);if(!row.rowCount)throw new ServiceError(404,'Run not found.');return ticket(row.rows[0]);}
 async current(wallet:string){const row=await this.pool.query("SELECT * FROM ranked_runs WHERE wallet=$1 AND status IN ('issued','verifying') ORDER BY issued_at DESC LIMIT 1",[wallet]);return row.rowCount?ticket(row.rows[0]):null;}
 async start(wallet:string,input:{day:string;rulesHash:string;requestKey:string}){
  const manifest=await this.daily();if(input.day!==manifest.day||input.rulesHash!==manifest.rulesHash)throw new ServiceError(409,'Daily rules changed. Refresh the challenge before starting.');
  const now=this.now(),expires=new Date(Math.min(now.getTime()+(manifest.hardLimitSeconds+180)*1000,new Date(manifest.endsAt).getTime()+60000));
  return transaction(this.pool,async db=>{
   await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);
   const owned=await db.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[wallet]);if(!owned.rowCount)throw new ServiceError(403,'Campaign access is required to enter the daily challenge.');
   const previous=await db.query('SELECT * FROM ranked_runs WHERE wallet=$1 AND request_key=$2',[wallet,input.requestKey]);if(previous.rowCount)return ticket(previous.rows[0]);
   await db.query("UPDATE ranked_runs SET status='rejected',detail='Ticket expired before submission.' WHERE wallet=$1 AND status='issued' AND expires_at<=$2",[wallet,now]);
   const active=await db.query("SELECT 1 FROM ranked_runs WHERE wallet=$1 AND status IN ('issued','verifying')",[wallet]);if(active.rowCount)throw new ServiceError(409,'Finish or abandon your current daily run before starting another.');
   const row=await db.query("INSERT INTO ranked_runs(id,wallet,day,request_key,manifest,status,issued_at,expires_at) VALUES($1,$2,$3,$4,$5,'issued',$6,$7) RETURNING *",[randomUUID(),wallet,manifest.day,input.requestKey,manifest,now,expires]);return ticket(row.rows[0]);
  });
 }
 async abandon(wallet:string,id:string){const row=await this.pool.query("UPDATE ranked_runs SET status='abandoned',detail='Run abandoned by the player.' WHERE id=$1 AND wallet=$2 AND status='issued' RETURNING *",[id,wallet]);if(row.rowCount)return ticket(row.rows[0]);return this.get(wallet,id);}
 async submit(wallet:string,id:string,input:{rulesHash:string;replay:unknown}){
  const replay=replayInput.parse(input.replay),hash=createHash('sha256').update(JSON.stringify(replay)).digest('hex'),ticks=replay.chunks.reduce((n,c)=>n+c.ticks,0),now=this.now();
  return transaction(this.pool,async db=>{
   const row=await db.query('SELECT * FROM ranked_runs WHERE id=$1 AND wallet=$2 FOR UPDATE',[id,wallet]);if(!row.rowCount)throw new ServiceError(404,'Run not found.');const run=row.rows[0];
   if(input.rulesHash!==run.manifest.rulesHash)throw new ServiceError(409,'Replay rules do not match this ticket.');
   if(run.replay_hash){if(run.replay_hash!==hash)throw new ServiceError(409,'This ticket already contains a different replay.');return ticket(run);}
   if(run.status!=='issued')throw new ServiceError(409,'This ticket is no longer open.');
   if(new Date(run.expires_at).getTime()<=now.getTime())throw new ServiceError(409,'The submission window has expired.');
   if(ticks>run.manifest.hardLimitSeconds*30||ticks/30>(now.getTime()-new Date(run.issued_at).getTime())/1000+2)throw new ServiceError(400,'Replay duration exceeds the ticket allowance.');
   const updated=await db.query("UPDATE ranked_runs SET status='verifying',submitted_at=$2,replay_hash=$3,replay=$4,detail='Checking the recorded run.' WHERE id=$1 RETURNING *",[id,now,hash,replay]);return ticket(updated.rows[0]);
  });
 }
 async process(limit=2){
  const jobs=await transaction(this.pool,async db=>{
   const rows=await db.query("SELECT * FROM ranked_runs WHERE status='verifying' AND verify_after<=now() AND (lease_until IS NULL OR lease_until<now()) ORDER BY submitted_at FOR UPDATE SKIP LOCKED LIMIT $1",[Math.max(1,Math.min(2,limit))]);
   for(const row of rows.rows){row.lease_token=randomUUID();await db.query("UPDATE ranked_runs SET lease_until=now()+interval '30 seconds',lease_token=$2,verify_attempts=verify_attempts+1 WHERE id=$1",[row.id,row.lease_token]);}return rows.rows;
  });
  await Promise.all(jobs.map(async run=>{
   try{
    const result=await verifyReplayInWorker(run.manifest.mission,run.replay,{rulesHash:run.manifest.rulesHash});
    const status=result.status==='incomplete'?'rejected':'verified',detail=status==='rejected'?'The replay ends before the run finishes.':result.status==='won'?'Verified extraction.':'Verified attempt. Extract successfully to place on the leaderboard.';
    await this.pool.query("UPDATE ranked_runs SET status=$2,result=$3,detail=$4,lease_until=NULL WHERE id=$1 AND status='verifying' AND lease_token=$5",[run.id,status,result,detail,run.lease_token]);
   }catch(e){
    // An infrastructure error is not a player loss. Retain the replay and retry
    // a bounded number of times; an error outcome never creates a ranked score.
    const busy=e instanceof ReplayBusyError,invalid=e instanceof ReplayInvalidError,terminal=!busy&&run.verify_attempts>=4;
    await this.pool.query("UPDATE ranked_runs SET status=$2,detail=$3,lease_until=NULL,verify_after=now()+interval '3 seconds',verify_attempts=verify_attempts-$4 WHERE id=$1 AND status='verifying' AND lease_token=$5",[run.id,invalid?'rejected':terminal?'error':'verifying',invalid?'The replay does not satisfy the game rules.':terminal?'Verification could not finish. Your replay is kept for support.':'Verification is waiting to retry.',busy?1:0,run.lease_token]);
   }
  }));return jobs.length;
 }
 async leaderboard(day:string,wallet?:string):Promise<Leaderboard>{
  const exists=await this.pool.query('SELECT 1 FROM daily_manifests WHERE day=$1',[day]);if(!exists.rowCount)throw new ServiceError(404,'Daily challenge not found.');
  const rows=await this.pool.query(`WITH best AS (
   SELECT DISTINCT ON (wallet) wallet,(result->>'score')::integer AS score,(result->>'ticks')::integer AS ticks
   FROM ranked_runs WHERE day=$1 AND status='verified' AND result->>'status'='won'
   ORDER BY wallet,(result->>'score')::integer DESC,(result->>'ticks')::integer ASC,id
  ), ranked AS (SELECT *,rank() OVER(ORDER BY score DESC,ticks ASC) AS rank,row_number() OVER(ORDER BY score DESC,ticks ASC,wallet) AS position FROM best)
  SELECT ranked.*,wallets.equipment->>'frame' AS frame FROM ranked JOIN wallets ON wallets.address=ranked.wallet
  WHERE position<=50 OR wallet=$2 ORDER BY rank,wallet LIMIT 51`,[day,wallet??'']);
  const entry=(r:Record<string,any>):LeaderboardEntry=>({wallet:r.wallet,rank:Number(r.rank),score:r.score,ticks:r.ticks,seconds:r.ticks/30,frame:r.frame==='profile-frame'?r.frame:null});
  return {day,entries:rows.rows.filter(r=>Number(r.position)<=50).map(entry),personal:rows.rows.find(r=>r.wallet===wallet)?entry(rows.rows.find(r=>r.wallet===wallet)):null};
 }
}
