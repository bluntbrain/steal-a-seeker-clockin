// publishes campaign levels from the server itself so adding levels is a backend setting, not a laptop command.
// each level is built from its recipe, proven winnable by the solver, re-verified with the pinned bundle and
// inserted once. CAMPAIGN_TARGET_LEVEL drives publishToTarget in the background after the api starts.
import type {Pool} from 'pg';
import {makeCampaignRecipe,buildCampaignLevel,type CampaignRecipe} from '../shared/campaign-levels';
import {solveCombat} from '../scripts/qa-combat';
import {verifyReplayInWorker} from './replay-runner';
import {CampaignLevelStore,type PublishedLevel} from './campaign-levels';
import rules from '../shared/rules-manifest.json';
import engine from '../shared/weekly-engine.json';
export type Built=Omit<PublishedLevel,'publishedAt'>&{ticks:number;strategy:number;salt:number};
/** finds a salt whose recipe builds and solves; the salt is embedded in the stored recipe seed.
 * the win is re-verified by the pinned bundle for the current rules hash, not by the live source */
export async function buildPublishable(number:number,batch:number):Promise<Built>{
 for(let salt=0;salt<12;salt++){
  let recipe:CampaignRecipe,definition;
  try{recipe=makeCampaignRecipe(number,salt);definition=buildCampaignLevel(recipe);}catch{continue;}
  const win=solveCombat(definition);if(!win)continue;
  const check=await verifyReplayInWorker(definition.mission,win.replay,{rulesHash:rules.rulesHash,definition});
  if(check.status!=='won'||check.score!==win.score)throw new Error(`pinned verifier disagrees with the solver on level ${number}`);
  return {number,batch,recipe,definition,rulesHash:rules.rulesHash,engineHash:engine.engineHash,boss:recipe.boss??null,title:recipe.title,zone:recipe.zone,ticks:win.ticks,strategy:win.strategy,salt};
 }
 throw new Error(`level ${number} has no winnable recipe within twelve salts`);
}
export const batchOf=(number:number)=>Math.ceil((number-12)/50);
/** publishes one level at a time from the latest row up to the target, at most `limit` per call.
 * solving takes tens of seconds per level, so this runs after listen and never blocks a request */
export async function publishToTarget(pool:Pool,target:number,log:(message:string)=>void=console.log,limit=40):Promise<number[]>{
 const store=new CampaignLevelStore(pool),latest=await store.latest(),published:number[]=[];
 if(!Number.isFinite(target)||target<=latest)return published;
 const to=Math.min(target,latest+limit);
 log(`campaign publisher: ${latest} published, building ${latest+1} to ${to}`);
 for(let n=latest+1;n<=to;n++){
  const started=Date.now(),{ticks:_t,strategy,salt,...row}=await buildPublishable(n,batchOf(n));
  const inserted=await store.publish([row]);
  if(inserted.length)published.push(n);
  log(`campaign publisher: level ${n} ${row.zone}${row.boss?' boss '+row.boss:''} room ${row.recipe.template} ${inserted.length?'published':'already present'} (strategy ${strategy}, salt ${salt}, ${((Date.now()-started)/1000).toFixed(1)}s)`);
 }
 return published;
}
