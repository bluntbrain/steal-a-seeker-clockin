// published campaign levels beyond the twelve authored missions. a recipe is small and deterministic; the server
// freezes the built definition at publish time, so the generator can evolve without touching verified rows.
import type {Box,GuardSpec,LevelDefinition,MissionId,Point} from '../src/game/level';
import {walkableSegment,findPath} from '../src/game/navigation';
import {WEEKLY_LAYOUTS} from './weekly-layouts';
import {weeklyRandom} from './weekly-variety';
export const CAMPAIGN_GENERATOR_VERSION=1;
export const FIRST_PUBLISHED_LEVEL=13;
export const BOSS_EVERY=3;
export const BOSSES=['toly','mert','chase','lily','vibhu','akshay','beeman'] as const;
export type BossId=typeof BOSSES[number];
export const BOSS_NAMES:Record<BossId,string>={toly:'Toly',mert:'Mert',chase:'Chase',lily:'Lily',vibhu:'Vibhu',akshay:'Akshay',beeman:'Beeman'};
export type CampaignZone='warehouse'|'rooftops'|'powerworks';
export type CampaignModifier='none'|'blackout'|'double-haul'|'exit-window';
export type CampaignRecipe={version:1;number:number;template:string;mirror:boolean;flip:boolean;seed:string;modifier:CampaignModifier;band:number;mission:MissionId;zone:CampaignZone;boss?:BossId;roster:{drones:number;scouts:number;sentries:number;heavies:number;warden:number};reinforcements:number;targetSeconds:number;hardLimitSeconds:number;title:string};
export const campaignLevelKey=(n:number)=>`campaign:${n}`;
export const campaignLevelNumber=(key:string)=>{const m=/^campaign:(\d+)$/.exec(key);return m?Number(m[1]):null;};
export const ZONES:readonly CampaignZone[]=['warehouse','rooftops','powerworks'];
// authored levels keep their districts (1 to 4, 5 to 8, 9 to 12); published zones then run ten levels each from 13
export const campaignZone=(n:number):CampaignZone=>n<FIRST_PUBLISHED_LEVEL?(n>=9?'powerworks':n>=5?'rooftops':'warehouse'):ZONES[Math.floor((n-FIRST_PUBLISHED_LEVEL)/10)%3]!;
export const isBossLevel=(n:number)=>n>=FIRST_PUBLISHED_LEVEL&&n%BOSS_EVERY===0;
// the rotation starts with toly on the first boss level and cycles through the seven
export const bossFor=(n:number):BossId|undefined=>isBossLevel(n)?BOSSES[(n/BOSS_EVERY-Math.ceil(FIRST_PUBLISHED_LEVEL/BOSS_EVERY))%BOSSES.length]:undefined;
const ZONE_MISSION:Record<CampaignZone,MissionId>={warehouse:'practice',rooftops:'sweep-window',powerworks:'power-trade'};
const ZONE_FLOOR:Record<CampaignZone,string>={warehouse:'#253A37',rooftops:'#253649',powerworks:'#343D40'};
function shuffled<T>(items:readonly T[],next:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[a[i],a[j]]=[a[j]!,a[i]!];}return a;}
/** recipes for a range, built in order so room choice avoids the previous four levels */
export function makeCampaignRecipes(from:number,to:number,seedSalt=0):CampaignRecipe[]{
 if(from<FIRST_PUBLISHED_LEVEL)throw new Error(`published levels start at ${FIRST_PUBLISHED_LEVEL}`);
 const out:CampaignRecipe[]=[];const history:string[]=[];
 for(let n=FIRST_PUBLISHED_LEVEL;n<=to;n++){
  const next=weeklyRandom(`campaign-v${CAMPAIGN_GENERATOR_VERSION}:${n}:${seedSalt}`);
  const recent=new Set(history.slice(-4)),rooms=WEEKLY_LAYOUTS.map(t=>t.id).filter(id=>!recent.has(id));
  const template=shuffled(rooms,next)[0]!;history.push(template);
  const zone=campaignZone(n),boss=bossFor(n),steps=n-FIRST_PUBLISHED_LEVEL;
  // difficulty rises slowly: the pressure band climbs one step every twelve levels and stops at the authored maximum
  const band=Math.min(12,5+Math.floor(steps/12));
  const modifier:CampaignModifier=boss?'none':steps%5===4?(['blackout','exit-window','double-haul'] as const)[Math.floor(steps/5)%3]!:'none';
  const count=Math.min(8,3+Math.floor(steps/6)),drones=steps>=30?2:1,heavies=steps<8?0:steps<48?1:2;
  const warden=boss?1:0,fill=Math.max(0,count-drones-heavies-warden),sentries=Math.floor(fill*(.35+next()*.3)),scouts=fill-sentries;
  const name=WEEKLY_LAYOUTS.find(t=>t.id===template)!.name;
  out.push({version:1,number:n,template,mirror:next()>.5,flip:next()>.5,seed:`campaign-v${CAMPAIGN_GENERATOR_VERSION}:${n}:${seedSalt}`,modifier,band,mission:ZONE_MISSION[zone],zone,...(boss?{boss}:{}),roster:{drones,scouts,sentries,heavies,warden},reinforcements:steps<18?1:2,targetSeconds:modifier==='double-haul'?160:100+Math.min(30,Math.floor(steps/4)*2),hardLimitSeconds:modifier==='double-haul'?240:210,title:boss?`${BOSS_NAMES[boss]} holds ${name}`:name});
 }
 return out.filter(r=>r.number>=from);
}
export const makeCampaignRecipe=(n:number,seedSalt=0)=>makeCampaignRecipes(n,n,seedSalt)[0]!;
/** builds the frozen level for a recipe. throws when the room cannot host the roster, so the publisher can bump the seed salt */
export function buildCampaignLevel(recipe:CampaignRecipe):LevelDefinition{
 const template=WEEKLY_LAYOUTS.find(t=>t.id===recipe.template);if(!template)throw new Error(`unknown room ${recipe.template}`);
 const next=weeklyRandom(recipe.seed+':build'),{mirror,flip,modifier}=recipe;
 const point=(p:Point):Point=>({x:mirror?12-p.x:p.x,y:flip?20-p.y:p.y});
 const box=(b:Box):Box=>({...b,x:mirror?12-b.x-b.w:b.x,y:flip?20-b.y-b.h:b.y});
 const phone=point({x:[2,6,10][Math.floor(next()*3)]!,y:2}),spawn=point({x:2,y:18}),exitP=point({x:modifier==='double-haul'?2:10,y:18});
 const boundary:Box[]=[{x:0,y:0,w:12,h:.7,kind:'wall'},{x:0,y:19.3,w:12,h:.7,kind:'wall'},{x:0,y:0,w:.7,h:20,kind:'wall'},{x:11.3,y:0,w:.7,h:20,kind:'wall'}];
 const briefing=recipe.boss?`${BOSS_NAMES[recipe.boss]} patrols this room with an escort. Flank the armour, take the Seeker and get out.`:modifier==='blackout'?'Shorter guard sight. Stop the reporting drones, take the Seeker and escape.':modifier==='double-haul'?'Extract both phones, one at a time. The alarm stays active between deliveries.':modifier==='exit-window'?'Steal the Seeker, then reach extraction during its 4-second opening every 8 seconds.':template.question;
 const level:LevelDefinition={id:campaignLevelKey(recipe.number),mission:recipe.mission,title:recipe.title,number:recipe.band,width:12,height:20,spawn,phone,exit:{x:exitP.x-.7,y:exitP.y-.65,w:1.4,h:1.3},blockers:[...boundary,...template.cover.map(box)],patrols:[],combat:{version:2,revision:16},decoys:0,targetSeconds:recipe.targetSeconds,hardLimitSeconds:recipe.hardLimitSeconds,briefing,floorColor:ZONE_FLOOR[recipe.zone],...(modifier==='double-haul'?{targets:[phone,point({x:phone.x===point({x:2,y:2}).x?10:2,y:2})]}:{}),...(modifier==='exit-window'?{exitWindow:{period:8,openSeconds:4,phase:0}}:{})};
 const nodes:Point[]=[];for(let y=4;y<=14;y+=1)for(let x=1.5;x<=10.5;x+=1){const p=point({x,y});if(walkableSegment(p,p,level)&&Math.hypot(p.x-spawn.x,p.y-spawn.y)>=6)nodes.push(p);}
 let spots=shuffled(nodes,next);const occupied:Point[]=[];
 const r=recipe.roster,roles:NonNullable<GuardSpec['combatRole']>[]=[...Array(r.warden).fill('warden'),...Array(r.drones).fill('drone'),...Array(r.heavies).fill('heavy'),...Array(r.sentries).fill('sentry'),...Array(r.scouts).fill('scout')];
 const blackout=modifier==='blackout'?.8:1;
 level.patrols=shuffled(roles,next).map(role=>{
  const at=spots.find(p=>occupied.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=2.6));if(!at)throw new Error(`no safe enemy position in ${recipe.template} for level ${recipe.number}`);occupied.push(at);spots=spots.filter(p=>p!==at);
  const roam=shuffled(nodes.filter(p=>Math.hypot(p.x-at.x,p.y-at.y)>.8&&Math.hypot(p.x-at.x,p.y-at.y)<=2.8&&walkableSegment(at,p,level)),next).slice(0,3);
  if(!roam.length)throw new Error(`no patrol lane in ${recipe.template} for level ${recipe.number}`);
  const armored=role==='heavy'||role==='warden';
  return {combatRole:role,route:[at,roam[0]!],roam:[at,...roam],speed:armored?.65:role==='drone'?.85:.8+next()*.2,pursuitSpeed:armored?2.3:2.75,range:(role==='drone'?6:armored?2.8:3.7)*blackout,halfAngle:role==='drone'?Math.PI/3:armored?Math.PI/4:Math.PI/3.2,spotSeconds:.3,pauseSeconds:.45+next()*.4,investigates:true,...(role==='warden'?{kind:'warden' as const}:{})};
 });
 for(let i=0;i<recipe.reinforcements;i++){const at=point({x:i===0?10:2,y:18}),end=point({x:i===0?9:3,y:18});level.patrols.push({combatRole:i===1?'sentry':'scout',route:[at,end],roam:[at,end],speed:.85,pursuitSpeed:2.7,range:3.4,halfAngle:Math.PI/3.2,spotSeconds:.3,pauseSeconds:.5,investigates:true,reserveAfter:0,pickupWave:1});}
 const end={x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2};
 for(const target of level.targets??[phone])if(!findPath(spawn,target,level).length||!findPath(target,end,level).length)throw new Error(`unreachable objective in ${recipe.template} for level ${recipe.number}`);
 return level;
}
