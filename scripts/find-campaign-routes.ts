import {writeFileSync} from 'node:fs';
import {CAMPAIGN_IDS,getLevel,type MissionId,type Point} from '../src/game/level';
import {blocked,idleInput,initialState,step,type GameState} from '../src/game/simulation';
function route(id:MissionId,start:Point,end:Point,state:GameState):Point[]{
 const base=getLevel(id),level={...base,blockers:[...base.blockers,...(base.gates??[]).filter((g,i)=>g.mode&&state.closedGates[i]).map(g=>g.box)]},queue=[{x:Math.round(start.x*2),y:Math.round(start.y*2)}],key=(p:Point)=>p.x+','+p.y,previous=new Map<string,Point|null>([[key(queue[0]!),null]]);let found:Point|undefined;
 for(let index=0;index<queue.length;index++){const p=queue[index]!;if(Math.hypot(p.x/2-end.x,p.y/2-end.y)<.36){found=p;break;}
  for(const [dx,dy]of [[0,-1],[-1,0],[1,0],[0,1]]){const q={x:p.x+dx!,y:p.y+dy!};if(q.x<1||q.x>23||q.y<1||q.y>39||previous.has(key(q))||blocked(q.x/2,q.y/2,level))continue;previous.set(key(q),p);queue.push(q);}
 }
 if(!found)throw new Error('No path '+id);const points:Point[]=[];let p:Point|null=found;while(p){points.unshift({x:p.x/2,y:p.y/2});p=previous.get(key(p))!;}
 const turns=points.filter((p,i)=>i===0||i===points.length-1||(points[i+1]!.x-p.x)!==(p.x-points[i-1]!.x)||(points[i+1]!.y-p.y)!==(p.y-points[i-1]!.y));turns.push(end);return turns;
}
const idleFor=(s:GameState)=>({...idleInput(),dash:s.dashSeen,tool:s.toolSeen});
export function follow(s:GameState,points:Point[]){for(const p of points){let n=0;while(s.status==='playing'&&Math.hypot(p.x-s.x,p.y-s.y)>.08&&n++<600){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);step(s,{...idleFor(s),x:dx/d*Math.min(1,d*4),y:dy/d*Math.min(1,d*4)});}for(let j=0;j<4;j++)step(s,idleFor(s));if(n>=600||s.status!=='playing')return;}}
type Action='switch'|'pickup'|'deliver';
type Intent={point:Point;action:Action};
type Leg={action:Action;points:Point[];waitTicks:number;decoyDirection:number};
function perform(state:GameState,intent:Intent,waitTicks=0,decoyDirection=-1):Leg|null{
 for(let n=0;n<waitTicks;n++)step(state,idleFor(state));if(state.status!=='playing')return null;
 if(decoyDirection>=0){const dirs=[[0,1],[-1,0],[0,-1],[1,0]],before=state.decoysLeft;step(state,{...idleFor(state),x:dirs[decoyDirection]![0]!,y:dirs[decoyDirection]![1]!,tool:state.toolSeen+1});for(let i=0;i<4;i++)step(state,idleFor(state));if(state.decoysLeft===before)return null;}
 let points:Point[];try{points=route(state.mission,state,intent.point,state);}catch{return null;}
 const delivered=state.delivered,activated=state.activations;follow(state,points);
 if(intent.action==='deliver'){for(let j=0;j<35;j++)step(state,idleFor(state));if(state.delivered<=delivered)return null;}
 else{for(let j=0;j<16;j++)step(state,{...idleFor(state),interact:true});if(intent.action==='switch'?state.activations<=activated:!state.carrying)return null;for(let j=0;j<4;j++)step(state,idleFor(state));}
 return (state.status as string)==='caught'||(state.status as string)==='timeout'?null:{action:intent.action,points,waitTicks,decoyDirection};
}
const reports=[];
for(const id of CAMPAIGN_IDS){
 const level=getLevel(id),exitPoint={x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2},targets=level.targets??[level.phone];
 const intents:Intent[]=[],add=(point:Point,action:Action)=>intents.push({point,action}),pad=(i:number)=>add(level.switches![i]!,'switch');
 if(id==='power-trade'){pad(0);add(targets[0]!,'pickup');pad(1);add(exitPoint,'deliver');}
 else if(id==='silent-circuit'){pad(0);pad(2);add(targets[0]!,'pickup');pad(3);pad(1);add(exitPoint,'deliver');}
 else if(id==='last-vault'){pad(0);add(targets[0]!,'pickup');add(exitPoint,'deliver');pad(0);pad(2);add(targets[1]!,'pickup');pad(3);add(exitPoint,'deliver');}
 else for(const target of targets){add(target,'pickup');add(exitPoint,'deliver');}
 let chosen:{state:GameState;legs:Leg[];delayTicks:number}|undefined;
 for(let delay=0;delay<1800&&!chosen;delay+=15){
  const state=initialState(id),legs:Leg[]=[];for(let n=0;n<delay;n++)step(state,idleFor(state));
  for(const intent of intents){const leg=perform(state,intent);if(!leg)break;legs.push(leg);}
  if(state.status==='won')chosen={state,legs,delayTicks:delay};
 }
 if(!chosen){
  // Offline bounded beam search over waits and four intentional decoy directions.
  let frontier=[{state:initialState(id),legs:[] as Leg[]}];
  for(const intent of intents){
   const next:typeof frontier=[];
   for(const node of frontier)for(const wait of [0,15,30,45,60,90,120,150,180,240])for(const direction of node.state.decoysLeft>0?[-1,0,1,2,3]:[-1]){
    const state=JSON.parse(JSON.stringify(node.state)) as GameState,leg=perform(state,intent,wait,direction);if(leg)next.push({state,legs:[...node.legs,leg]});
   }
   next.sort((a,b)=>a.state.elapsed-b.state.elapsed);const slots=new Set<string>();frontier=[];
   for(const node of next){const key=Math.floor(node.state.elapsed*2)+':'+node.state.decoysLeft+':'+node.legs.at(-1)!.decoyDirection;if(slots.has(key))continue;slots.add(key);frontier.push(node);if(frontier.length>=(id==='last-vault'||id==='warden-gate'?100:36))break;}
   console.log(id,'tactical stage',intent.action,frontier.length);
   if(!frontier.length)break;
  }
  const won=frontier.find(n=>n.state.status==='won');if(won)chosen={...won,delayTicks:0};
 }
 if(!chosen){console.error(id,'no verified route');process.exitCode=1;continue;}
 const {state,legs,delayTicks}=chosen;reports.push({mission:id,delayTicks,legs,phone:legs.find(l=>l.action==='pickup')!.points,exit:legs.find(l=>l.action==='deliver')!.points,seconds:state.elapsed,score:state.score,deliveries:state.delivered,activations:state.activations});console.log(id,state.elapsed.toFixed(2),'delay',delayTicks,'lures',legs.filter(l=>l.decoyDirection>=0).length);
}
if(!process.exitCode)writeFileSync('verification/campaign-routes.json',JSON.stringify({note:'Deterministic security-v3 routes, including explicit waits and decoy directions. Not touchscreen verification.',routes:reports},null,2));
