import type {LevelDefinition,Box,GuardSpec,MissionId} from '../src/game/level';
import {weekWindow} from './weekly';
export type Contract={id:string;week:string;slot:number;name:string;district:string;modifier:string;objective:string;level:LevelDefinition};
export const CONTRACT_ATTEMPTS=5;
export function makeContracts(date=new Date()):Contract[]{
 const week=weekWindow(date).week,weekNumber=Math.floor(Date.parse(week)/604800000);
 return [0,1,2].map(slot=>{
  const variant=(slot+((weekNumber-Math.floor(Date.parse('2026-09-14')/604800000))%3+3)%3)%3;
  const modifier=['Blackout','Double haul','Exit window'][variant]!;
  let seed=(weekNumber*2654435761+slot*7919)>>>0;
  const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const mirror=next()>.5,flip=next()>.5,shift=Math.floor(next()*3)*.4;
  const point=(x:number,y:number)=>({x:mirror?12-x:x,y:flip?20-y:y});
  const box=(x:number,y:number,w:number,h:number,kind:Box['kind']='crate'):Box=>({x:mirror?12-x-w:x,y:flip?20-y-h:y,w,h,kind});
  const boundary:Box[]=[{x:0,y:0,w:12,h:.7,kind:'wall'},{x:0,y:19.3,w:12,h:.7,kind:'wall'},{x:0,y:0,w:.7,h:20,kind:'wall'},{x:11.3,y:0,w:.7,h:20,kind:'wall'}];
  const cover=[box(4.3+shift,5,2,2.8,'rack'),box(4.3-shift,11.5,2,3,'rack'),box(1.2,8.5,1.8,1.4),box(8.8,9+shift,1.7,1.5),box(7.4,15.8,2,1.2),box(1.5,3.5,1.5,1.1)];
  const py=1.8+Math.floor(next()*4)*.3,phone=point(9.6,py),exitP=point(variant===1?2:9.4,17.6),spawn=point(2,17.5);
  const patrol=(y:number,x:number,speed:number):GuardSpec=>({route:[point(x,y),point(10.4,y),point(10.4,y-1.2),point(x,y-1.2)],speed,range:2.6,halfAngle:Math.PI/6,spotSeconds:1.1,pauseSeconds:.4,investigates:true});
  const patrolY=7.4+Math.floor(next()*3)*.25;
  const mission=(['practice','sweep-window','power-trade'] as MissionId[])[slot]!;
  const name=['Ghost Freight','Skyline Relay','Pulse Vault'][slot]!,district=['Warehouse','Rooftops','Powerworks'][slot]!;
  const objective=variant===0?'Take one phone back to extraction. No decoys on this contract.':variant===1?'Extract both phones, one at a time. The alarm stays on between trips.':'Take the phone to extraction. The exit opens for 4 seconds every 8 seconds.';
  const id=`${week}:${slot}`,level:LevelDefinition={id:`contract-v1:${id}`,mission,title:name,number:slot*4+1,width:12,height:20,spawn,phone,exit:{x:exitP.x-.8,y:exitP.y-.7,w:1.6,h:1.4},blockers:[...boundary,...cover],patrols:[patrol(patrolY,7.6,.8+next()*.1),{...patrol(4.4,6.9,.7+next()*.1),route:[point(6.9,4.4),point(10.4,4.4)]}],decoys:variant===0?0:3,targetSeconds:variant===1?150:90,hardLimitSeconds:variant===1?300:180,briefing:objective,floorColor:['#253A37','#253649','#343D40'][slot]!,...(variant===1?{targets:[phone,point(2.1,2.0+shift)]}:{}),...(variant===2?{exitWindow:{period:8,openSeconds:4,phase:(weekNumber%4)*.5}}:{})};
  return {id,week,slot,name,district,modifier,objective,level};
 });
}
export function contractPoints(result:{status:string;score:number;ticks:number;battery?:number},level:LevelDefinition){
 if(result.status!=='won')return 0;
 // Each contract has the same 10,000 point ceiling, regardless of target count.
 return Math.max(1,Math.min(10000,5000+Math.round(Math.max(0,1-result.ticks/(level.hardLimitSeconds*30))*4000)+Math.round((result.battery??0)*10)));
}
