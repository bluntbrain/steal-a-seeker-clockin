// publishes campaign levels from the server itself so adding levels is a backend setting, not a laptop command.
// each level is built from its recipe, proven winnable by the solver, re-verified with the pinned bundle and
// inserted once. CAMPAIGN_TARGET_LEVEL drives publishToTarget in the background after the api starts.
import type {Pool} from 'pg';
import {Worker} from 'node:worker_threads';
import {URL} from 'node:url';
import {makeCampaignRecipe,buildCampaignLevel,type CampaignRecipe} from '../shared/campaign-levels';
import {verifyReplayInWorker,ReplayBusyError} from './replay-runner';
import type {LevelDefinition} from '../src/game/level';
import type {ReplayChunk} from '../shared/replay';
import {CampaignLevelStore,type PublishedLevel} from './campaign-levels';
import rules from '../shared/rules-manifest.json';
import engine from '../shared/weekly-engine.json';
type Win={replay:ReplayChunk[];score:number;ticks:number;strategy:number};
/** the solver searches for tens of seconds; a worker keeps the api responsive while it runs */
export function solveInWorker(definition:LevelDefinition):Promise<Win|null>{
 const worker=new Worker(new URL('./solve-worker.mjs',import.meta.url),{workerData:{definition},resourceLimits:{maxOldGenerationSizeMb:256}});
 return new Promise((resolve,reject)=>{
  let settled=false;const finish=(win?:Win|null,error?:Error)=>{if(settled)return;settled=true;clearTimeout(timer);void worker.terminate().then(()=>error?reject(error):resolve(win??null));};
  const timer=setTimeout(()=>finish(undefined,new Error('Level solver exceeded its time budget.')),180000);
  worker.once('message',(m:{ok:boolean;win:Win|null})=>finish(m.win));
  worker.once('error',e=>finish(undefined,e));
  worker.once('exit',()=>{if(!settled)finish(undefined,new Error('Level solver exited without a result.'));});
 });
}
/** replay verification shares two worker slots with player submissions; wait and retry when both are busy */
async function verifyWithRetry(definition:LevelDefinition,win:Win){
 for(let attempt=0;;attempt++){
  try{return await verifyReplayInWorker(definition.mission,win.replay,{rulesHash:rules.rulesHash,definition});}
  catch(e){if(!(e instanceof ReplayBusyError)||attempt>=5)throw e;await new Promise(r=>setTimeout(r,5000*(attempt+1)));}
 }
}
export type Built=Omit<PublishedLevel,'publishedAt'>&{ticks:number;strategy:number;salt:number};
/** finds a salt whose recipe builds and solves; the salt is embedded in the stored recipe seed.
 * the win is re-verified by the pinned bundle for the current rules hash, not by the live source */
export async function buildPublishable(number:number,batch:number):Promise<Built>{
 for(let salt=0;salt<12;salt++){
  let recipe:CampaignRecipe,definition;
  try{recipe=makeCampaignRecipe(number,salt);definition=buildCampaignLevel(recipe);}catch{continue;}
  const win=await solveInWorker(definition);if(!win)continue;
  const check=await verifyWithRetry(definition,win);
  if(check.status!=='won'||check.score!==win.score)throw new Error(`pinned verifier disagrees with the solver on level ${number}`);
  return {number,batch,recipe,definition,rulesHash:rules.rulesHash,engineHash:engine.engineHash,boss:recipe.boss??null,title:recipe.title,zone:recipe.zone,ticks:win.ticks,strategy:win.strategy,salt};
 }
 throw new Error(`level ${number} has no winnable recipe within twelve salts`);
}
export const batchOf=(number:number)=>Math.ceil((number-12)/50);
/** publishes one level at a time from the latest row up to the target, at most `limit` per call.
 * solving takes tens of seconds per level, so this runs after listen and never blocks a request */
export async function publishToTarget(pool:Pool,target:number,log:(message:string)=>void=console.log,limit=40):Promise<number[]>{
 const store=new CampaignLevelStore(pool),published:number[]=[];
 if(!Number.isFinite(target))return published;
 // bounded batches until the target is reached, so one boot can finish a large gap without one giant loop
 for(let batch=0;batch<50;batch++){
  const latest=await store.latest();if(target<=latest)break;
  const to=Math.min(target,latest+limit);
  log(`campaign publisher: ${latest} published, building ${latest+1} to ${to}`);
  for(let n=latest+1;n<=to;n++){
   const started=Date.now(),{ticks:_t,strategy,salt,...row}=await buildPublishable(n,batchOf(n));
   const inserted=await store.publish([row]);
   if(inserted.length)published.push(n);
   log(`campaign publisher: level ${n} ${row.zone}${row.boss?' boss '+row.boss:''} room ${row.recipe.template} ${inserted.length?'published':'already present'} (strategy ${strategy}, salt ${salt}, ${((Date.now()-started)/1000).toFixed(1)}s)`);
  }
 }
 return published;
}
