// jev pilot for the web build (?pilot=jev on a local host). every decision interval it turns the live game
// state into a public observation, offers the legal moves a finger could make, asks the local bridge
// (which asks jev, or a stand in when no key is set), and applies the chosen move as a normal tap.
// nothing here reads guard brains, hidden positions or random state, and nothing moves the courier directly.
import type {GameState} from '../game/simulation';
import type {LevelDefinition,Point} from '../game/level';
import {walkableSegment,findPath} from '../game/navigation';
export type Observation={level:{number:number;title:string;boss:string|null;width:number;height:number;walls:number[][];phone:number[];exit:number[]};courier:{x:number;y:number;hp:number;carrying:boolean;spotted:boolean};guards:{id:number;role:string;x:number;y:number;facing_deg:number;cone_range:number;cone_half_deg:number;mode:string;sees_me:boolean;hp:number;distance:number;boss:string|null}[];last_move:{option:string;result:string}|null;recent_moves:string[];clock:{elapsed_s:number;target_s:number;remaining_s:number}};
export type MoveOption={key:string;text:string;tap:Point|null;meta:{dist_to_goal:number;exposed:boolean}};
export type Decision={choice:string;probabilities:Record<string,number>;confidence:number;mode:'jev'|'mock';ms:number};
const STEP=2,DIRS:[string,number,number][]=[['north',0,-1],['north_east',1,-1],['east',1,0],['south_east',1,1],['south',0,1],['south_west',-1,1],['west',-1,0],['north_west',-1,-1]];
const r1=(n:number)=>Math.round(n*10)/10;
const deg=(a:number)=>Math.round(((a*180/Math.PI)%360+360)%360);
/** a point is exposed when it sits inside a guard's cone by angle and range; walls are ignored, so this is conservative */
export function exposed(p:Point,s:GameState){
 for(const g of s.guards){if(!g.active||!g.spawned||g.hp<=0)continue;const d=Math.hypot(p.x-g.x,p.y-g.y);if(d>g.range)continue;const a=Math.atan2(p.y-g.y,p.x-g.x);let diff=Math.abs(a-g.angle);diff=Math.min(diff,Math.PI*2-diff);if(diff<=g.halfAngle)return true;}
 return false;
}
/** public facts only: guards on screen or that currently see the courier; no brains, paths or search targets */
export function observe(s:GameState,level:LevelDefinition,camera:{x:number;y:number;zoom:number},last:Observation['last_move'],recent:string[]=[]):Observation{
 const number=Number(/campaign:(\d+)/.exec(level.id)?.[1]??level.number),goal=s.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.phone;
 const inView=(p:Point)=>p.x>=camera.x-.5&&p.x<=camera.x+12/camera.zoom+.5&&p.y>=camera.y-.5&&p.y<=camera.y+20/camera.zoom+.5;
 return {
  level:{number,title:level.title,boss:level.patrols.find(p=>p.boss)?.boss??null,width:level.width,height:level.height,walls:level.blockers.map(b=>[r1(b.x),r1(b.y),r1(b.w),r1(b.h)]),phone:[r1(level.phone.x),r1(level.phone.y)],exit:[r1(goal.x),r1(goal.y)]},
  courier:{x:r1(s.x),y:r1(s.y),hp:s.combat?.hp??100,carrying:s.carrying,spotted:s.guards.some(g=>g.seesPlayer)},
  guards:s.guards.map((g,id)=>({g,id})).filter(({g})=>g.active&&g.spawned&&g.hp>0&&(g.seesPlayer||inView(g))).map(({g,id})=>({id,role:g.combatRole,x:r1(g.x),y:r1(g.y),facing_deg:deg(g.angle),cone_range:r1(g.range),cone_half_deg:deg(g.halfAngle),mode:g.mode,sees_me:g.seesPlayer,hp:g.hp,distance:r1(Math.hypot(g.x-s.x,g.y-s.y)),boss:level.patrols[id]?.boss??null})),
  last_move:last,recent_moves:recent.slice(-4),
  clock:{elapsed_s:r1(s.elapsed),target_s:level.targetSeconds,remaining_s:r1(level.hardLimitSeconds-s.elapsed)},
 };
}
/** the moves a finger could make now: short walks in eight directions, the objective when it is close,
 * a flank on a reachable guard, and waiting. when spotted only moves that leave every cone remain */
export function options(s:GameState,level:LevelDefinition):MoveOption[]{
 const from={x:s.x,y:s.y},goal=s.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.phone,spotted=s.guards.some(g=>g.seesPlayer);
 const nearestCone=(p:Point)=>Math.min(...s.guards.filter(g=>g.active&&g.spawned&&g.hp>0).map(g=>Math.max(0,Math.hypot(p.x-g.x,p.y-g.y)-g.range)),99);
 const out:MoveOption[]=[];
 for(const [name,dx,dy] of DIRS){
  const n=Math.hypot(dx,dy);let dest:Point|null=null;
  for(const step of [STEP,1]){const p={x:Math.min(11.1,Math.max(.9,from.x+dx/n*step)),y:Math.min(19.1,Math.max(.9,from.y+dy/n*step))};if(Math.hypot(p.x-from.x,p.y-from.y)>=.6&&walkableSegment(from,p,level)){dest=p;break;}}
  if(!dest)continue;
  const d=Math.hypot(dest.x-from.x,dest.y-from.y),ex=exposed(dest,s),toGoal=Math.hypot(goal.x-dest.x,goal.y-dest.y),cone=nearestCone(dest);
  if(spotted&&ex)continue;
  out.push({key:`walk_${name}_${d>=1.5?2:1}`,text:`Walk ${d>=1.5?2:1} tile${d>=1.5?'s':''} ${name.replace('_',' ')} to (${r1(dest.x)}, ${r1(dest.y)}). ${ex?'Inside a guard cone right now.':cone>0?`Nearest cone edge ${r1(cone)} tiles away.`:'At the edge of a cone.'} ${r1(toGoal)} tiles from the ${s.carrying?'exit':'phone'}.`,tap:dest,meta:{dist_to_goal:toGoal,exposed:ex}});
 }
 const goalDist=Math.hypot(goal.x-from.x,goal.y-from.y),route=findPath(from,goal,level);
 // the first two tiles of the real corridor route, so progress is always one of the choices
 if(route.length){let leg=route[route.length-1]!,walked=0,prev=from;for(const p of route){const d=Math.hypot(p.x-prev.x,p.y-prev.y);if(walked+d>=STEP){const t=(STEP-walked)/d;leg={x:prev.x+(p.x-prev.x)*t,y:prev.y+(p.y-prev.y)*t};break;}walked+=d;prev=p;leg=p;}
  const ex=exposed(leg,s),cone=nearestCone(leg),routeLen=route.reduce((a,p,i)=>a+(i?Math.hypot(p.x-route[i-1]!.x,p.y-route[i-1]!.y):Math.hypot(p.x-from.x,p.y-from.y)),0);
  if(!(spotted&&ex)&&Math.hypot(leg.x-from.x,leg.y-from.y)>=.4)out.push({key:'follow_route',text:`Follow the corridor route toward the ${s.carrying?'exit':'phone'}: next leg to (${r1(leg.x)}, ${r1(leg.y)}), ${r1(routeLen)} tiles of route left. ${ex?'The leg crosses a guard cone.':cone>0?`Nearest cone edge ${r1(cone)} tiles from the leg.`:'The leg touches a cone edge.'}`,tap:leg,meta:{dist_to_goal:Math.max(0,routeLen-STEP),exposed:ex}});}
 if(goalDist<=3.5&&walkableSegment(from,goal,level)&&!(spotted&&exposed(goal,s)))out.push({key:s.carrying?'go_to_exit':'go_to_phone',text:`${s.carrying?'Run for the exit':'Grab the phone'} at (${r1(goal.x)}, ${r1(goal.y)}), ${r1(goalDist)} tiles away in a straight line. ${exposed(goal,s)?'A cone covers it.':'No cone covers it.'}`,tap:goal,meta:{dist_to_goal:0,exposed:exposed(goal,s)}});
 s.guards.forEach((g,id)=>{
  if(!g.active||!g.spawned||g.hp<=0||g.combatRole==='drone')return;const d=Math.hypot(g.x-from.x,g.y-from.y);if(d>4||!findPath(from,{x:g.x,y:g.y},level).length)return;
  const behind=Math.abs(Math.atan2(from.y-g.y,from.x-g.x)-g.angle)>Math.PI*.6;
  out.push({key:`attack_guard_${id}`,text:`Approach guard ${id} (${g.combatRole}${level.patrols[id]?.boss?', boss '+level.patrols[id]!.boss:''}, ${g.hp} hp) ${r1(d)} tiles away and slash. ${behind?'You are behind it.':'It is facing your way.'} ${g.seesPlayer?'It sees you.':''}`,tap:{x:g.x,y:g.y},meta:{dist_to_goal:goalDist,exposed:!behind}});
 });
 const guardNear=s.guards.some(g=>g.active&&g.spawned&&g.hp>0&&Math.hypot(g.x-from.x,g.y-from.y)<=4);
 if(!spotted&&guardNear)out.push({key:'wait',text:'Stand still for half a second and let the nearby patrol pass. Costs time.',tap:from,meta:{dist_to_goal:goalDist,exposed:exposed(from,s)}});
 return out;
}
type Mvp={snapshot:()=>GameState;level:LevelDefinition;camera:{x:number;y:number;zoom:number};suspended?:boolean;tap:(x:number,y:number)=>boolean};
export type PilotStats={decisions:number;mode:string;last:Decision|null;lastOption:string;errors:number;running:boolean};
/** polls the game, asks the bridge, taps. exposed on window.__JEV_PILOT__ for the overlay and the runner */
export function startJevPilot(bridge='http://127.0.0.1:8791',intervalMs=500){
 const stats:PilotStats={decisions:0,mode:'idle',last:null,lastOption:'',errors:0,running:true};
 (window as unknown as {__JEV_PILOT__:PilotStats}).__JEV_PILOT__=stats;
 let busy=false,last:Observation['last_move']=null,lastTap:Point|null=null;const recent:string[]=[];
 const timer=setInterval(()=>{
  const mvp=(window as unknown as {__SEEKER_MVP__?:Mvp}).__SEEKER_MVP__;if(!mvp||busy)return;
  if(mvp.suspended)return; // paused or loading: no decision, no tokens
  const s=mvp.snapshot();if(s.status!=='playing'||!s.combat)return;
  const level=mvp.level,moves=options(s,level);if(!moves.length)return;
  if(lastTap)last={option:stats.lastOption,result:Math.hypot(lastTap.x-s.x,lastTap.y-s.y)<.5?'arrived':s.guards.some(g=>g.seesPlayer)?'spotted':'walking'};
  const observation=observe(s,level,mvp.camera,last,recent);
  const criteria:Record<string,string>={},meta:Record<string,MoveOption['meta']>={};for(const m of moves){criteria[m.key]=m.text;meta[m.key]=m.meta;}
  busy=true;
  void fetch(`${bridge}/decide`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:observation,instructions:'You are the courier in a stealth heist with a clock. Reach the phone, then the exit, before remaining_s hits zero and without being caught. Guards see inside their cone, hear footsteps within three tiles and search where they last saw you. Progress matters: when no cone threatens the next leg, move toward the objective; wait only to let a nearby patrol pass; do not undo your previous move unless a guard appeared. Pick the next move.',criteria,meta})})
   .then(async r=>{const d=await r.json() as Decision;const move=moves.find(m=>m.key===d.choice)??moves[0]!;stats.decisions++;stats.last=d;stats.mode=d.mode;stats.lastOption=move.key;recent.push(move.key);if(recent.length>8)recent.shift();if(move.tap){mvp.tap(move.tap.x,move.tap.y);lastTap=move.tap;}})
   .catch(()=>{stats.errors++;stats.mode='bridge down';})
   .finally(()=>{busy=false;});
 },intervalMs);
 return ()=>{clearInterval(timer);stats.running=false;};
}
