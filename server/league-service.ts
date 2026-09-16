import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {transaction} from './db';
import {ServiceError} from './service';
import {RankedService} from './ranked-service';
import {makeCombatContracts,CONTRACT_ATTEMPTS,type Contract} from '../shared/contracts';
import {weekWindow} from '../shared/weekly';
import {practiceTicket,type LeagueBoard,type LeagueEntry,type LeagueSummary} from '../shared/league';
import rules from '../shared/rules-manifest.json';
import engine from '../shared/weekly-engine.json';
const rankedSQL=`WITH scored AS (
 SELECT wallet,manifest->'contract'->>'id' AS contract,(result->>'ticks')::integer AS ticks,
 CASE WHEN manifest->'contract'->'level'->'combat'->>'version'='2' THEN
 LEAST(10000,GREATEST(1,5000+floor(GREATEST(0,1-(result->>'ticks')::numeric/((manifest->>'hardLimitSeconds')::numeric*30))*3000)+LEAST(100,GREATEST(0,COALESCE((result->>'hp')::numeric,(result->>'battery')::numeric,0)))*20))
 ELSE LEAST(10000,GREATEST(1,5000+round(GREATEST(0,1-(result->>'ticks')::numeric/((manifest->>'hardLimitSeconds')::numeric*30))*4000)+round((result->>'battery')::numeric*10))) END::integer AS points
 FROM ranked_runs WHERE manifest ? 'contract' AND manifest->'contract'->>'week'=$1 AND status='verified' AND result->>'status'='won'
), best AS (SELECT DISTINCT ON(wallet,contract) * FROM scored ORDER BY wallet,contract,points DESC,ticks ASC),
 totals AS (SELECT wallet,sum(points)::integer AS points,sum(ticks)::integer AS ticks,count(*)::integer AS cleared,jsonb_agg(jsonb_build_object('contract',contract,'points',points,'ticks',ticks) ORDER BY contract) AS best FROM best GROUP BY wallet)
 SELECT *,rank() OVER(ORDER BY points DESC,ticks ASC)::integer AS rank,row_number() OVER(ORDER BY points DESC,ticks ASC,wallet)::integer AS position FROM totals ORDER BY points DESC,ticks ASC,wallet`;
export class LeagueService{
 constructor(public pool:Pool,public ranked:RankedService,private now=()=>new Date()){}
 async manifest(){const window=weekWindow(this.now()),manifest={...window,rulesHash:rules.rulesHash,engineHash:engine.engineHash,contracts:makeCombatContracts(this.now())};await this.pool.query('INSERT INTO league_weeks(week,manifest) VALUES($1,$2) ON CONFLICT DO NOTHING',[window.week,manifest]);return (await this.pool.query('SELECT manifest FROM league_weeks WHERE week=$1',[window.week])).rows[0].manifest as Omit<typeof manifest,'engineHash'>&{engineHash?:string};}
 private async rows(week:string):Promise<LeagueEntry[]>{return (await this.pool.query(rankedSQL,[week])).rows;}
 async board(week:string,wallet?:string,final=false):Promise<LeagueBoard>{
  const rows=final?(await this.pool.query('SELECT entry FROM league_history WHERE week=$1 ORDER BY (entry->>\'position\')::integer',[week])).rows.map(r=>r.entry as LeagueEntry):await this.rows(week),personal=rows.find(r=>r.wallet===wallet)??null;
  const i=personal?rows.findIndex(r=>r.wallet===wallet):-1,rival=personal?[...rows].reverse().find(r=>r.rank<personal.rank)??null:null;
  return {week,endsAt:new Date(Date.parse(week)+7*86400000).toISOString(),participants:rows.length,entries:rows.slice(0,50),nearby:i<0?[]:rows.slice(Math.max(0,i-2),i+3),personal,rival,final};
 }
 async archive(){
  const eligible=await this.pool.query("SELECT week::text FROM league_weeks WHERE finalized_at IS NULL AND week+interval '7 days 15 minutes'<$1",[this.now()]);
  for(const {week} of eligible.rows)await transaction(this.pool,async db=>{
   await db.query('SELECT week FROM league_weeks WHERE week=$1 FOR UPDATE',[week]);
   const busy=await db.query("SELECT 1 FROM ranked_runs WHERE manifest ? 'contract' AND manifest->'contract'->>'week'=$1 AND (status='verifying' OR (status='issued' AND expires_at>$2)) LIMIT 1",[week,this.now()]);if(busy.rowCount)return;
   const rows=(await db.query(rankedSQL,[week])).rows;
   for(const entry of rows){await db.query('INSERT INTO league_history(week,wallet,entry,participants) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[week,entry.wallet,entry,rows.length]);if(entry.cleared===3)await db.query('INSERT INTO league_achievements(wallet,week) VALUES($1,$2) ON CONFLICT DO NOTHING',[entry.wallet,week]);}
   await db.query('UPDATE league_weeks SET finalized_at=$2 WHERE week=$1',[week,this.now()]);
  });
 }
 async summary(wallet?:string):Promise<LeagueSummary>{
  const manifest=await this.manifest();await this.archive();const board=await this.board(manifest.week,wallet);
  if(wallet&&board.personal?.cleared===3)await this.pool.query('INSERT INTO league_achievements(wallet,week) VALUES($1,$2) ON CONFLICT DO NOTHING',[wallet,manifest.week]);
  const attempts:Record<string,number>={};let history:LeagueBoard[]=[],earned=false,domain:string|null=null,active=null;
  if(wallet){const rows=await this.pool.query("SELECT manifest->'contract'->>'id' AS id,count(*)::integer AS n FROM ranked_runs WHERE manifest ? 'contract' AND wallet=$1 AND manifest->'contract'->>'week'=$2 GROUP BY 1",[wallet,manifest.week]);for(const r of rows.rows)attempts[r.id]=r.n;
   const past=await this.pool.query('SELECT week::text FROM league_history WHERE wallet=$1 ORDER BY week DESC LIMIT 20',[wallet]);history=await Promise.all(past.rows.map(r=>this.board(r.week,wallet,true)));
   earned=!!(await this.pool.query('SELECT 1 FROM league_achievements WHERE wallet=$1 LIMIT 1',[wallet])).rowCount;
   // Display only a recently verified owner-selected name; stale names fall back to wallet.
   domain=(await this.pool.query("SELECT domain FROM league_identity WHERE wallet=$1 AND checked_at>now()-interval '1 hour'",[wallet])).rows[0]?.domain??null;
   active=await this.ranked.current(wallet);
  }
  return {...manifest,authenticated:!!wallet,attempts,board,history,earned,domain,active};
 }
 async start(wallet:string,input:{contractId:string;rulesHash:string;requestKey:string}){
  const manifest=await this.manifest(),contract=manifest.contracts.find(c=>c.id===input.contractId);if(!contract||manifest.rulesHash!==input.rulesHash)throw new ServiceError(409,'Contract or rules changed. Refresh the league.');
  return transaction(this.pool,async db=>{
   await db.query('SELECT address FROM wallets WHERE address=$1 FOR UPDATE',[wallet]);
   const lockedWeek=(await db.query('SELECT manifest FROM league_weeks WHERE week=$1 FOR UPDATE',[manifest.week])).rows[0]?.manifest;
   if(lockedWeek?.rulesHash!==manifest.rulesHash||!lockedWeek.contracts.some((c:Contract)=>c.id===contract.id))throw new ServiceError(409,'Weekly missions changed. Refresh before starting.');
   const prior=await db.query('SELECT id,manifest FROM ranked_runs WHERE wallet=$1 AND request_key=$2',[wallet,input.requestKey]);if(prior.rowCount){if(prior.rows[0].manifest.contract?.id!==contract.id)throw new ServiceError(409,'Request key belongs to another contract.');return this.ranked.get(wallet,prior.rows[0].id);}
   if(!(await db.query("SELECT 1 FROM entitlements WHERE wallet=$1 AND sku='campaign'",[wallet])).rowCount)throw new ServiceError(403,'Campaign access is required for ranked contracts.');
   await db.query("UPDATE ranked_runs SET status='rejected',detail='Ranked attempt expired.' WHERE wallet=$1 AND status='issued' AND expires_at<=$2",[wallet,this.now()]);
   if((await db.query("SELECT 1 FROM ranked_runs WHERE wallet=$1 AND status IN ('issued','verifying')",[wallet])).rowCount)throw new ServiceError(409,'Finish or close your previous ranked attempt first.');
   const used=(await db.query("SELECT count(*)::integer AS n FROM ranked_runs WHERE wallet=$1 AND manifest->'contract'->>'id'=$2",[wallet,contract.id])).rows[0].n;if(used>=CONTRACT_ATTEMPTS)throw new ServiceError(409,'All five ranked attempts used. Practice is still unlimited.');
   const finalized=(await db.query('SELECT finalized_at FROM league_weeks WHERE week=$1',[manifest.week])).rows[0]?.finalized_at;const now=this.now();if(finalized||now.getTime()>=Date.parse(manifest.endsAt))throw new ServiceError(409,'This week has ended.');
   const ticket=practiceTicket(contract,manifest.rulesHash,wallet);ticket.practice=false;ticket.id=randomUUID();ticket.issuedAt=now.toISOString();ticket.expiresAt=new Date(Math.min(now.getTime()+(contract.level.hardLimitSeconds+120)*1000,Date.parse(manifest.endsAt))).toISOString();
   await db.query('INSERT INTO daily_manifests(day,manifest) VALUES($1,$2) ON CONFLICT DO NOTHING',[contract.week,ticket.manifest]);
   await db.query("INSERT INTO ranked_runs(id,wallet,day,request_key,manifest,status,issued_at,expires_at) VALUES($1,$2,$3,$4,$5,'issued',$6,$7)",[ticket.id,wallet,contract.week,input.requestKey,ticket.manifest,ticket.issuedAt,ticket.expiresAt]);return ticket;
  });
 }
 async equip(wallet:string){
  await this.summary(wallet);if(!(await this.pool.query('SELECT 1 FROM league_achievements WHERE wallet=$1 LIMIT 1',[wallet])).rowCount)throw new ServiceError(403,'Clear all three ranked contracts in a week to earn Ghost Courier.');
  await this.pool.query("UPDATE wallets SET equipment=jsonb_set(equipment,'{outfit}','\"ghost-courier\"') WHERE address=$1",[wallet]);return {ok:true};
 }
}
