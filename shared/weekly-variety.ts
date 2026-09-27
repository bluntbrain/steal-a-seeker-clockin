import type {Contract} from './contracts';
import type {Box,GuardSpec,LevelDefinition,MissionId,Point} from '../src/game/level';
import {walkableSegment,findPath} from '../src/game/navigation';
import {weekWindow} from './weekly';
import {WEEKLY_LAYOUTS} from './weekly-layouts';
export const WEEKLY_VARIETY_START='2026-09-28';
export const WEEKLY_GENERATOR_VERSION=3;
const WEEK=604800000,EPOCH=Date.parse(WEEKLY_VARIETY_START);
// Hash the full key before seeding: adjacent slots must not share the correlated
// first draws of a linear seed increment. No Math.random or wall-clock input.
export function weeklyRandom(key:string){let seed=2166136261;for(let i=0;i<key.length;i++)seed=Math.imul(seed^key.charCodeAt(i),16777619);return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function shuffled<T>(items:readonly T[],next:()=>number){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[a[i],a[j]]=[a[j]!,a[i]!];}return a;}
export function weeklyLayoutIds(date:Date){
 const week=weekWindow(date).week,index=Math.floor((Date.parse(week)-EPOCH)/WEEK);if(index<0)throw Error('Weekly variety starts on '+WEEKLY_VARIETY_START);
 const history:string[][]=[];let selected:string[]=[];
 for(let n=0;n<=index;n++){const recent=new Set(history.slice(-4).flat()),available=WEEKLY_LAYOUTS.map(t=>t.id).filter(id=>!recent.has(id));selected=shuffled(available,weeklyRandom(`weekly-v3:layouts:${n}`)).slice(0,3);history.push(selected);}
 return selected;
}
export function wallSignature(level:LevelDefinition){return JSON.stringify(level.blockers.map(b=>[b.x,b.y,b.w,b.h]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));}
export function makeVariedContracts(date:Date):Contract[]{
 const week=weekWindow(date).week,ids=weeklyLayoutIds(date),modifiers=shuffled(['Blackout','Double haul','Exit window'],weeklyRandom(`weekly-v3:rules:${week}`));
 return ids.map((id,slot)=>{
  const template=WEEKLY_LAYOUTS.find(t=>t.id===id)!,next=weeklyRandom(`weekly-v3:${week}:${slot}:${id}`),mirror=next()>.5,flip=next()>.5;
  const point=(p:Point):Point=>({x:mirror?12-p.x:p.x,y:flip?20-p.y:p.y});
  const box=(b:Box):Box=>({...b,x:mirror?12-b.x-b.w:b.x,y:flip?20-b.y-b.h:b.y});
  const modifier=modifiers[slot]!,phone=point({x:[2,6,10][Math.floor(next()*3)]!,y:2}),spawn=point({x:2,y:18}),exitP=point({x:modifier==='Double haul'?2:10,y:18});
  const boundary:Box[]=[{x:0,y:0,w:12,h:.7,kind:'wall'},{x:0,y:19.3,w:12,h:.7,kind:'wall'},{x:0,y:0,w:.7,h:20,kind:'wall'},{x:11.3,y:0,w:.7,h:20,kind:'wall'}];
  const objective=modifier==='Blackout'?'Shorter guard sight. Stop the reporting drones, take the Seeker and escape.':modifier==='Double haul'?'Extract both phones, one at a time. The alarm stays active between deliveries.':'Steal the Seeker, then reach extraction during its 4-second opening every 8 seconds.';
  const level:LevelDefinition={id:`weekly-v3:${week}:${slot}`,mission:(['practice','sweep-window','power-trade'] as MissionId[])[slot]!,title:template.name,number:[2,6,10][slot]!,width:12,height:20,spawn,phone,exit:{x:exitP.x-.7,y:exitP.y-.65,w:1.4,h:1.3},blockers:[...boundary,...template.cover.map(box)],patrols:[],combat:{version:2,revision:13},decoys:0,targetSeconds:modifier==='Double haul'?160:105,hardLimitSeconds:modifier==='Double haul'?240:180,briefing:objective+' '+template.question,floorColor:['#253A37','#253649','#343D40'][slot]!,...(modifier==='Double haul'?{targets:[phone,point({x:phone.x===point({x:2,y:2}).x?10:2,y:2})]}:{}),...(modifier==='Exit window'?{exitWindow:{period:8,openSeconds:4,phase:Math.floor(next()*4)}}:{})};
  const nodes:Point[]=[];for(let y=4;y<=14;y+=1)for(let x=1.5;x<=10.5;x+=1){const p=point({x,y});if(walkableSegment(p,p,level)&&Math.hypot(p.x-spawn.x,p.y-spawn.y)>=6)nodes.push(p);}
  let spots=shuffled(nodes,next),occupied:Point[]=[];
  const count=3+slot+Math.floor(next()*2)-(slot>0&&modifier==='Double haul'?1:0),drones=slot===0||modifier==='Double haul'?1:1+Math.floor(next()*2),heavies=slot===0?0:slot===1||modifier==='Double haul'?1:1+Math.floor(next()*2);
  // Double haul already requires four traversals under a persistent alarm.
  // Cap initial armor at one there; do not stack extra armor at extraction.
  const roles:NonNullable<GuardSpec['combatRole']>[]=[...Array(drones).fill('drone'),...Array(heavies).fill('heavy')];while(roles.length<count)roles.push(next()>.45?'sentry':'scout');
  level.patrols=shuffled(roles,next).map(role=>{
   const at=spots.find(p=>occupied.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=2.6));if(!at)throw Error(`No safe enemy position: ${id}`);occupied.push(at);spots=spots.filter(p=>p!==at);
   const roam=shuffled(nodes.filter(p=>Math.hypot(p.x-at.x,p.y-at.y)>.8&&Math.hypot(p.x-at.x,p.y-at.y)<=2.8&&walkableSegment(at,p,level)),next).slice(0,3);
   if(!roam.length)throw Error(`No patrol lane: ${id}`);
   return {combatRole:role,route:[at,roam[0]!],roam:[at,...roam],speed:role==='heavy'?.65:role==='drone'?.85:.8+next()*.2,pursuitSpeed:role==='heavy'?2.3:2.75,range:(role==='drone'?6:role==='heavy'?2.8:3.7)*(modifier==='Blackout'?.8:1),halfAngle:role==='drone'?Math.PI/3:role==='heavy'?Math.PI/4:Math.PI/3.2,spotSeconds:.3,pauseSeconds:.45+next()*.4,investigates:true};
  });
  const reserves=slot===2?2:1;for(let i=0;i<reserves;i++){const at=point({x:i===0?10:2,y:18}),end=point({x:i===0?9:3,y:18});level.patrols.push({combatRole:i===1?'sentry':'scout',route:[at,end],roam:[at,end],speed:.85,pursuitSpeed:2.7,range:3.4,halfAngle:Math.PI/3.2,spotSeconds:.3,pauseSeconds:.5,investigates:true,reserveAfter:0,pickupWave:1});}
  const end={x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2};for(const target of level.targets??[phone])if(!findPath(spawn,target,level).length||!findPath(target,end,level).length)throw Error(`Unreachable weekly objective: ${id}`);
  return {id:`${week}:${slot}:variety-v3`,week,slot,name:template.name,district:['Warehouse','Rooftops','Powerworks'][slot]!,modifier,objective:level.briefing,level,generation:{version:WEEKLY_GENERATOR_VERSION,template:id,activeEnemies:count,drones,heavies,reinforcements:reserves}};
 });
}
