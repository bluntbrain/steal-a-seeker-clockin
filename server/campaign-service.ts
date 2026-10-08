import {creditReward,publishedCreditReward} from '../shared/store';
import {CampaignLevelStore} from './campaign-levels';
import {campaignLevelKey} from '../shared/campaign-levels';
import {combatLevel} from '../src/game/combat-levels';
import {campaignCreditTarget} from './campaign-credit-versions';
import {createHash,randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {CAMPAIGN_IDS,type MissionId} from '../src/game/level';
import {compareRun,type CampaignPerformance,type CampaignSummary,type CampaignRank,type CampaignBoard,type CampaignPlayer} from '../shared/economy';
import {address} from '@solana/kit';
import {ServiceError} from './service';
import {ReturnService} from './returns';
import {transaction} from './db';
import {replayInput} from './replay';
import {verifyReplayInWorker} from './replay-runner';
// every wallet's total from its best verified run per level, ranked; exact ties share a rank
const RANKED=`WITH best AS (
    SELECT DISTINCT ON(wallet,mission) wallet,mission,result FROM campaign_runs WHERE result->>'status'='won'
    ORDER BY wallet,mission,(result->>'score')::int DESC,(result->>'ticks')::int ASC,(result->>'spotted')::boolean ASC,(result->>'battery')::int DESC,id
   ), totals AS (SELECT wallet,count(*)::int AS cleared,sum((result->>'score')::int)::int AS score,sum((result->>'ticks')::int)::int AS ticks,sum(CASE WHEN (result->>'spotted')::boolean THEN 0 ELSE 1 END)::int AS clean,sum((result->>'battery')::int)::int AS battery FROM best GROUP BY wallet),
   ranked AS (SELECT *,rank() OVER(ORDER BY score DESC,cleared DESC,ticks ASC,clean DESC,battery DESC)::int AS rank,count(*) OVER()::int AS participants FROM totals)`;
const strip=({participants:_p,...r}:CampaignRank&{participants?:number}):CampaignRank=>r;
const isWallet=(v:string)=>{try{address(v);return true;}catch{return false;}};
export class CampaignService{
 constructor(public pool:Pool,public returns:ReturnService,public levels=new CampaignLevelStore(pool)){}
 async owned(wallet:string){if(!(await this.pool.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[wallet])).rowCount)throw new ServiceError(403,'Campaign pass required.');}
 /** a claim names either one of the twelve authored missions or a published level number */
 async submit(wallet:string,target:{mission:MissionId}|{level:number},rulesHash:string,input:unknown){
  const replay=replayInput.parse(input),hash=createHash('sha256').update(JSON.stringify(replay)).digest('hex');
  let key:string,verify:()=>Promise<Awaited<ReturnType<typeof verifyReplayInWorker>>>,targetFor:()=>number|undefined,reward:(stars:number)=>number,storedHash=rulesHash;
  if('level' in target){
   // published levels verify against the frozen definition and the hash they were published under, never client input
   const row=await this.levels.get(target.level,rulesHash);if(!row)throw new ServiceError(404,'Unknown campaign level. Update the game or wait for the next batch.');
   key=campaignLevelKey(row.number);storedHash=row.rulesHash;verify=()=>verifyReplayInWorker(row.definition.mission,replay,{rulesHash:row.rulesHash,definition:row.definition});targetFor=()=>row.definition.targetSeconds;reward=stars=>publishedCreditReward(stars,!!row.boss);
  }else{
   const mission=target.mission;if(!CAMPAIGN_IDS.includes(mission))throw new ServiceError(409,'Update the game before recording a campaign reward run.');
   key=mission;verify=()=>verifyReplayInWorker(mission,replay,{rulesHash});targetFor=()=>campaignCreditTarget(rulesHash,mission);reward=creditReward;
  }
  const mission=key;
  const prior=await this.pool.query('SELECT result FROM campaign_runs WHERE wallet=$1 AND mission=$2 AND rules_hash=$3 AND replay_hash=$4',[wallet,mission,storedHash,hash]);
  // Even an older verified replay may not have a credit award yet.

  const result=prior.rows[0]?.result??await verify();
  if(result.status!=='won')throw new ServiceError(400,'A completed extraction is required. This run does not earn campaign credit.');
  let awardedCredits=0,creditBalance=0;
  await transaction(this.pool,async db=>{
   const locked=await db.query('SELECT credits FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);creditBalance=Number(locked.rows[0].credits);
   await db.query('INSERT INTO campaign_runs(id,wallet,mission,rules_hash,replay_hash,replay,result) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING',[randomUUID(),wallet,mission,storedHash,hash,replay,result]);
   // Versioned thresholds preserve the previous release during the app rollout.
   const targetSeconds=targetFor();
   if(targetSeconds!==undefined){const stars=1+Number(result.battery>=60)+Number(result.ticks<=targetSeconds*30),old=await db.query('SELECT stars FROM campaign_credit_stars WHERE wallet=$1 AND mission=$2',[wallet,mission]),delta=reward(stars)-reward(old.rows[0]?.stars??0);
    if(delta>0){awardedCredits=delta;creditBalance+=delta;const b=await db.query('UPDATE wallets SET credits=credits+$2 WHERE address=$1 RETURNING credits',[wallet,delta]);await db.query('INSERT INTO campaign_credit_stars(wallet,mission,stars) VALUES($1,$2,$3) ON CONFLICT(wallet,mission) DO UPDATE SET stars=$3',[wallet,mission,stars]);await db.query('INSERT INTO credit_ledger(id,wallet,source,delta,balance_after) VALUES($1,$2,$3,$4,$5)',[randomUUID(),wallet,`mission:${mission}:stars:${stars}`,delta,b.rows[0].credits]);}
   }
  });
  return {...await this.summary(wallet),creditAward:{mission,credits:awardedCredits,balance:creditBalance}};
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
 /** total points across every verified run, one best replay per level, any rules hash. the top fifty plus the
  * caller's own row when it ranks lower; exact ties share a rank */
 async leaderboard(wallet?:string):Promise<CampaignBoard>{
  const rows=await this.pool.query(`${RANKED} SELECT * FROM ranked WHERE rank<=50 OR wallet=$1 ORDER BY rank,wallet`,[wallet??'']);
  const all=rows.rows as (CampaignRank&{participants:number})[],participants=all[0]?.participants??0;
  const personal=wallet?all.find(r=>r.wallet===wallet)??null:null;
  return {board:all.filter(r=>r.rank<=50).map(strip),personal:personal?strip(personal):null,participants};
 }
 /** rank rows for any wallets, ranked against every player */
 async standings(wallets:string[]):Promise<CampaignRank[]>{
  if(!wallets.length)return [];
  return (await this.pool.query(`${RANKED} SELECT * FROM ranked WHERE wallet=ANY($1)`,[wallets])).rows.map(strip);
 }
 /** friend search for the head-to-head card. empty: the top players. a wallet: that wallet. text: .skr names by
  * prefix from our copied directory, players with a verified run first. never calls a third party */
 async players(query:string):Promise<CampaignPlayer[]>{
  const q=query.trim();let picks:{wallet:string;name:string|null}[];
  if(!q)picks=(await this.pool.query(`${RANKED} SELECT r.wallet,(SELECT d.name FROM skr_domains d WHERE d.owner=r.wallet ORDER BY d.rank NULLS LAST,d.name LIMIT 1) AS name FROM ranked r ORDER BY r.rank,r.wallet LIMIT 50`)).rows;
  else if(isWallet(q))picks=[{wallet:q,name:(await this.pool.query('SELECT name FROM skr_domains WHERE owner=$1 ORDER BY rank NULLS LAST,name LIMIT 1',[q])).rows[0]?.name??null}];
  else picks=(await this.pool.query(`SELECT d.owner AS wallet,d.name FROM skr_domains d WHERE lower(d.name) LIKE $1
    ORDER BY EXISTS(SELECT 1 FROM campaign_runs c WHERE c.wallet=d.owner AND c.result->>'status'='won') DESC,length(d.name),d.name LIMIT 20`,[q.toLowerCase().replace(/[\\%_]/g,m=>'\\'+m)+'%'])).rows;
  const standing=new Map((await this.standings([...new Set(picks.map(p=>p.wallet))])).map(r=>[r.wallet,r]));
  return picks.map(p=>({wallet:p.wallet,name:p.name,standing:standing.get(p.wallet)??null}));
 }
}
