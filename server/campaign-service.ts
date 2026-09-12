import {createHash,randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {CAMPAIGN_IDS,type MissionId} from '../src/game/level';
import {compareRun,type CampaignPerformance,type CampaignSummary,type CampaignRank} from '../shared/economy';
import {ServiceError} from './service';
import {ReturnService} from './returns';
import {transaction} from './db';
import {replayInput} from './replay';
import {verifyReplayInWorker} from './replay-runner';
import rules from '../shared/rules-manifest.json';
export class CampaignService{
 constructor(public pool:Pool,public returns:ReturnService){}
 async owned(wallet:string){if(!(await this.pool.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[wallet])).rowCount)throw new ServiceError(403,'Campaign pass required.');}
 async submit(wallet:string,mission:MissionId,rulesHash:string,input:unknown){
  await this.owned(wallet);if(!CAMPAIGN_IDS.includes(mission))throw new ServiceError(409,'Update the game before recording a campaign reward run.');
  const replay=replayInput.parse(input),hash=createHash('sha256').update(JSON.stringify(replay)).digest('hex');
  const prior=await this.pool.query('SELECT id FROM campaign_runs WHERE wallet=$1 AND mission=$2 AND rules_hash=$3 AND replay_hash=$4',[wallet,mission,rulesHash,hash]);
  if(prior.rowCount)return this.summary(wallet);
  const result=await verifyReplayInWorker(mission,replay,{rulesHash});
  if(result.status!=='won')throw new ServiceError(400,'A completed extraction is required. This run does not earn campaign credit.');
  await this.pool.query('INSERT INTO campaign_runs(id,wallet,mission,rules_hash,replay_hash,replay,result) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING',[randomUUID(),wallet,mission,rulesHash,hash,replay,result]);
  return this.summary(wallet);
 }
 async performances(wallet:string):Promise<CampaignPerformance[]>{const rows=await this.pool.query('SELECT mission,result FROM campaign_runs WHERE wallet=$1',[wallet]);const best=new Map<string,CampaignPerformance>();for(const row of rows.rows){const run={mission:row.mission,...row.result} as CampaignPerformance,old=best.get(run.mission);if(!old||compareRun(run,old)<0)best.set(run.mission,run);}return [...best.values()];}
 async summary(wallet:string):Promise<CampaignSummary>{
  const [runs,rows]=await Promise.all([this.performances(wallet),this.pool.query("SELECT c.terms,a.id,a.state,a.receipt FROM campaign_rebates c JOIN entitlements e ON e.wallet=c.wallet AND e.sku='campaign' JOIN orders o ON o.id=e.order_id LEFT JOIN return_allocations a ON a.reservation_id=c.reservation_id WHERE c.wallet=$1 AND o.campaign_terms IS NOT NULL",[wallet])]);
  const row=rows.rows[0];return {runs,rebate:row?.terms.rebate??0,state:row?.state??(row?(CAMPAIGN_IDS.every(id=>runs.some(r=>r.mission===id))?'ready':'locked'):'legacy'),...(row?.id?{returnId:row.id}:{}),...(row?.receipt?.signature?{signature:row.receipt.signature}:{})};
 }
 async claim(wallet:string){
  await this.owned(wallet);
  await transaction(this.pool,async db=>{
   const row=await db.query("SELECT c.*,o.campaign_terms FROM campaign_rebates c JOIN entitlements e ON e.wallet=c.wallet AND e.sku='campaign' JOIN orders o ON o.id=e.order_id WHERE c.wallet=$1 FOR UPDATE OF c",[wallet]);
   if(!row.rowCount||!row.rows[0].campaign_terms)throw new ServiceError(409,'This purchase does not include a reserved completion rebate.');
   const wins=await db.query('SELECT DISTINCT mission FROM campaign_runs WHERE wallet=$1',[wallet]);
   if(!CAMPAIGN_IDS.every(id=>wins.rows.some(r=>r.mission===id)))throw new ServiceError(409,'All 12 missions must be verified before claiming.');
   await this.returns.allocateInTransaction(db,row.rows[0].reservation_id,'success');
  });return this.summary(wallet);
 }
 async leaderboard():Promise<CampaignRank[]>{
  // Aggregate in SQL before transferring results. Rank uses a single best replay
  // for each mission; exact performance ties share the same displayed rank.
  const rows=await this.pool.query(`WITH best AS (
    SELECT DISTINCT ON(wallet,mission) wallet,mission,result FROM campaign_runs WHERE rules_hash=$1
    ORDER BY wallet,mission,(result->>'score')::int DESC,(result->>'ticks')::int ASC,(result->>'spotted')::boolean ASC,(result->>'battery')::int DESC,id
   ), totals AS (SELECT wallet,count(*)::int AS cleared,sum((result->>'score')::int)::int AS score,sum((result->>'ticks')::int)::int AS ticks,sum(CASE WHEN (result->>'spotted')::boolean THEN 0 ELSE 1 END)::int AS clean,sum((result->>'battery')::int)::int AS battery FROM best GROUP BY wallet)
   SELECT *,rank() OVER(ORDER BY cleared DESC,score DESC,ticks ASC,clean DESC,battery DESC)::int AS rank FROM totals ORDER BY cleared DESC,score DESC,ticks ASC,clean DESC,battery DESC,wallet LIMIT 50`,[rules.rulesHash]);
  return rows.rows;
 }
}
