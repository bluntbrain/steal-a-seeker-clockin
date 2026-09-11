import {writeFileSync} from 'node:fs';
import {CAMPAIGN_IDS,getLevel,type MissionId,type Point} from '../src/game/level';
import {blocked,idleInput,initialState,step,type GameState} from '../src/game/simulation';
function route(id:MissionId,start:Point,end:Point):Point[]{
 const level=getLevel(id),queue=[{x:Math.round(start.x*2),y:Math.round(start.y*2)}],key=(p:Point)=>p.x+','+p.y,previous=new Map<string,Point|null>([[key(queue[0]!),null]]);let found:Point|undefined;
 for(let index=0;index<queue.length;index++){const p=queue[index]!;if(Math.hypot(p.x/2-end.x,p.y/2-end.y)<.36){found=p;break;}
  for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]]){const q={x:p.x+dx!,y:p.y+dy!};if(q.x<1||q.x>23||q.y<1||q.y>39||previous.has(key(q))||blocked(q.x/2,q.y/2,level))continue;previous.set(key(q),p);queue.push(q);}
 }
 if(!found)throw new Error('No path '+id);const points:Point[]=[];let p:Point|null=found;while(p){points.unshift({x:p.x/2,y:p.y/2});p=previous.get(key(p))!;}
 const turns=points.filter((p,i)=>i===0||i===points.length-1||(points[i+1]!.x-p.x)!==(p.x-points[i-1]!.x)||(points[i+1]!.y-p.y)!==(p.y-points[i-1]!.y));turns.push(end);return turns;
}
export function follow(s:GameState,points:Point[]){for(const p of points){let n=0;while(s.status==='playing'&&Math.hypot(p.x-s.x,p.y-s.y)>.08&&n++<600){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);step(s,{...idleInput(),x:dx/d*Math.min(1,d*4),y:dy/d*Math.min(1,d*4)});}for(let j=0;j<4;j++)step(s,idleInput());if(n>=600||s.status!=='playing')return;}}
const reports=[];
for(const id of CAMPAIGN_IDS){const level=getLevel(id),phone=route(id,level.spawn,level.phone),exitPoint={x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2},exit=route(id,level.phone,exitPoint);let result;
 for(let delay=0;delay<1500;delay+=15){const s=initialState(id);for(let n=0;n<delay;n++)step(s,idleInput());follow(s,phone);for(let j=0;j<16;j++)step(s,{...idleInput(),interact:true});follow(s,exit);for(let j=0;j<35;j++)step(s,idleInput());if(s.status==='won'){result={mission:id,delayTicks:delay,phone,exit,seconds:s.elapsed,score:s.score};break;}}
 if(!result){console.log(JSON.stringify({mission:id,failed:true,phone,exit}));process.exitCode=1;}else{reports.push(result);console.log(id,result.seconds.toFixed(2),'delay',result.delayTicks);}
}
if(!process.exitCode)writeFileSync('verification/campaign-routes.json',JSON.stringify({note:'Deterministic simulation routes, not yet touchscreen verification',routes:reports},null,2));
