// publishes a batch of generated campaign levels. each level is built from its recipe, proven winnable by the solver,
// re-verified with the pinned verifier and then inserted once. rows never change after publish.
// usage: tsx scripts/publish-campaign-levels.ts --to 100 [--from 13] [--dry] [--bundle shared/campaign-levels.published.json]
import {writeFileSync,mkdirSync} from 'node:fs';
import pg from 'pg';
import {makeCampaignRecipe,buildCampaignLevel,BOSS_NAMES,type CampaignRecipe} from '../shared/campaign-levels';
import {solveCombat} from './qa-combat';
import {verifyReplay} from '../server/replay';
import {CampaignLevelStore,type PublishedLevel} from '../server/campaign-levels';
import rules from '../shared/rules-manifest.json';
import engine from '../shared/weekly-engine.json';
const arg=(name:string)=>{const i=process.argv.indexOf(`--${name}`);return i>=0?process.argv[i+1]:undefined;};
const dry=process.argv.includes('--dry'),to=Number(arg('to')??100),bundle=arg('bundle');
type Built=Omit<PublishedLevel,'publishedAt'>&{ticks:number;strategy:number;salt:number};
/** finds a salt whose recipe builds and solves; the salt is embedded in the stored recipe seed */
export function buildPublishable(number:number,batch:number):Built{
 for(let salt=0;salt<12;salt++){
  let recipe:CampaignRecipe,definition;
  try{recipe=makeCampaignRecipe(number,salt);definition=buildCampaignLevel(recipe);}catch{continue;}
  const win=solveCombat(definition);if(!win)continue;
  const check=verifyReplay(definition.mission,win.replay,definition);
  if(check.status!=='won'||check.score!==win.score)throw new Error(`verifier disagrees with the solver on level ${number}`);
  return {number,batch,recipe,definition,rulesHash:rules.rulesHash,engineHash:engine.engineHash,boss:recipe.boss??null,title:recipe.title,zone:recipe.zone,ticks:win.ticks,strategy:win.strategy,salt};
 }
 throw new Error(`level ${number} has no winnable recipe within twelve salts`);
}
async function main(){
 const database=process.env.DATABASE_URL??'postgresql://localhost/seeker_clockin_devnet';
 const pool=dry?null:new pg.Pool({connectionString:database}),store=pool?new CampaignLevelStore(pool):null;
 const from=Number(arg('from')??((store?await store.latest():12)+1));
 if(from>to){console.log(`nothing to publish: latest is ${from-1}`);await pool?.end();return;}
 const batch=Math.ceil((from-12)/50),built:Built[]=[];
 for(let n=from;n<=to;n++){const b=buildPublishable(n,batch);built.push(b);console.log(`level ${n} ${b.zone}${b.boss?' boss '+BOSS_NAMES[b.recipe.boss!]:''} room ${b.recipe.template} band ${b.recipe.band} solved in ${(b.ticks/30).toFixed(1)}s (strategy ${b.strategy}, salt ${b.salt})`);}
 const inserted=store?await store.publish(built.map(({ticks:_t,strategy:_s,salt:_a,...row})=>row)):[];
 mkdirSync('verification/campaign-levels',{recursive:true});
 const receipt={publishedAt:new Date().toISOString(),rulesHash:rules.rulesHash,engineHash:engine.engineHash,from,to,dry,inserted,levels:built.map(b=>({number:b.number,zone:b.zone,boss:b.boss,template:b.recipe.template,band:b.recipe.band,modifier:b.recipe.modifier,solvedSeconds:+(b.ticks/30).toFixed(2),targetSeconds:b.definition.targetSeconds,salt:b.salt}))};
 writeFileSync(`verification/campaign-levels/levels-${from}-${to}.json`,JSON.stringify(receipt,null,1));
 if(bundle)writeFileSync(bundle,JSON.stringify({rulesHash:rules.rulesHash,engineHash:engine.engineHash,levels:built.map(b=>({number:b.number,title:b.title,zone:b.zone,boss:b.boss,definition:b.definition,rulesHash:b.rulesHash,engineHash:b.engineHash}))}));
 console.log(dry?`dry run: ${built.length} levels built and solved`:`published ${inserted.length} of ${built.length} levels (${built.length-inserted.length} already existed)`);
 await pool?.end();
}
if(process.argv[1]?.endsWith('publish-campaign-levels.ts'))main().catch(e=>{console.error(e);process.exit(1);});
