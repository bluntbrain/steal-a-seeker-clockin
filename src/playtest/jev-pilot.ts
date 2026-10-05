// jev pilot for the web build (?pilot=jev on a local host). every decision interval it turns the live game
// state into a public observation, offers the legal moves a finger could make, asks the local bridge
// (which asks jev, or a stand in when no key is set), and applies the chosen move as a normal tap.
// nothing here reads guard brains, hidden positions or random state, and nothing moves the courier directly.
import type {GameState} from '../game/simulation';
import type {LevelDefinition,Point} from '../game/level';
import {walkableSegment,findPath} from '../game/navigation';
import {sightDistance} from '../game/guards';
export type Observation={level:{number:number;title:string;boss:string|null;width:number;height:number;walls:number[][];phone:number[];exit:number[]};courier:{x:number;y:number;hp:number;carrying:boolean;spotted:boolean};guards:{id:number;role:string;x:number;y:number;facing_deg:number;cone_range:number;cone_half_deg:number;mode:string;sees_me:boolean;hp:number;distance:number;boss:string|null}[];last_move:{option:string;result:string}|null;recent_moves:string[];clock:{elapsed_s:number;target_s:number;remaining_s:number}};
export type MoveOption={key:string;text:string;tap:Point|null;meta:{dist_to_goal:number;exposed:boolean}};
export type Decision={choice:string;probabilities:Record<string,number>;confidence:number;mode:'jev'|'mock';ms:number};
const STEP=2,DIRS:[string,number,number][]=[['north',0,-1],['north_east',1,-1],['east',1,0],['south_east',1,1],['south',0,1],['south_west',-1,1],['west',-1,0],['north_west',-1,-1]];
const r1=(n:number)=>Math.round(n*10)/10;
const deg=(a:number)=>Math.round(((a*180/Math.PI)%360+360)%360);
const wrap=(a:number)=>{const d=Math.abs(a)%(Math.PI*2);return Math.min(d,Math.PI*2-d);};
/** a point is exposed when it sits inside a guard's cone by range and angle with a clear line from the guard;
 * walls block sight exactly as in the game (sightDistance against the current blockers) */
export function exposed(p:Point,s:GameState,level?:LevelDefinition){
 const sight=level?{...level,blockers:s.blockers}:undefined;
 for(const g of s.guards){if(!g.active||!g.spawned||g.hp<=0)continue;const d=Math.hypot(p.x-g.x,p.y-g.y);if(d>g.range)continue;
  if(d>1e-6&&wrap(Math.atan2(p.y-g.y,p.x-g.x)-g.angle)>g.halfAngle)continue;
  if(sight&&d>1e-6&&sightDistance(g.x,g.y,(p.x-g.x)/d,(p.y-g.y)/d,d,sight)<d-1e-6)continue;
  return true;}
 return false;
}
/** points every half tile along a route, up to a distance; used to look ahead for cones on the way */
function along(from:Point,route:Point[],limit:number){const out:Point[]=[];let prev=from,walked=0;for(const p of route){const d=Math.hypot(p.x-prev.x,p.y-prev.y);for(let t=.5;t<=d&&walked+t<=limit;t+=.5)out.push({x:prev.x+(p.x-prev.x)*t/d,y:prev.y+(p.y-prev.y)*t/d});walked+=d;prev=p;if(walked>=limit)break;}return out;}
/** public look ahead: which guards could see the next stretch of a route right now, and which stand in sight range of it */
function threats(points:Point[],s:GameState,level:LevelDefinition){
 const sight={...level,blockers:s.blockers},seenBy:number[]=[],near:number[]=[];
 s.guards.forEach((g,i)=>{if(!g.active||!g.spawned||g.hp<=0)return;let inRange=false,inSight=false;
  for(const p of points){const d=Math.hypot(p.x-g.x,p.y-g.y);if(d>g.range)continue;if(d>1e-6&&sightDistance(g.x,g.y,(p.x-g.x)/d,(p.y-g.y)/d,d,sight)<d-1e-6)continue;inRange=true;if(d<1e-6||wrap(Math.atan2(p.y-g.y,p.x-g.x)-g.angle)<=g.halfAngle){inSight=true;break;}}
  if(inSight)seenBy.push(i);else if(inRange)near.push(i);});
 return {seenBy,near};
}
const routeLength=(a:Point,b:Point,level:LevelDefinition)=>{const r=findPath(a,b,level);if(!r.length)return Infinity;let len=0,prev=a;for(const p of r){len+=Math.hypot(p.x-prev.x,p.y-prev.y);prev=p;}return len;};
/** the game's rules as they are in the code (revision 17 knife combat), sent with every decision */
export const RULES=[
 'Goal: take the phone, then reach the exit. Running out of time (clock.remaining_s reaches 0) or reaching 0 health loses the level.',
 'A guard sees you only inside its cone (cone_range tiles, cone_half_deg either side of facing_deg) and only with a clear line; walls block sight.',
 'A guard needs about half a second of continuous sight to spot you. Leaving the cone quickly, or putting a wall between you, prevents it.',
 'Guards hear footsteps within 1.6 tiles, even from behind. Standing still is silent.',
 'A spotted courier is shot and chased. Guards keep chasing for about 2.5 seconds after losing sight, then search where they last saw you.',
 'Tapping a guard walks to it and slashes. From behind on a guard that has not noticed you: instant kill. Unarmoured from the side or front: 35 damage.',
 'Heavies, wardens and bosses are armoured: a front hit does nothing, a side hit 20, a rear hit 75. Drones have 25 health and do not fight, they report.',
 'Health by role: drone 25, scout 50, sentry 75, heavy 150, warden 200. Killed guards leave bodies that other guards notice.',
 'Taking the phone can call extra guards near the exit. Expect company on the way out.',
 'A route whose next stretch is in a guard cone gets you spotted. Prefer a detour, wait for the cone to turn, or kill that guard from behind.',
 'Good play: follow the corridor route whenever its leg is not exposed; kill a guard from behind when it blocks the route; wait only to let a nearby cone sweep past; never walk back and forth.',
];
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
export function options(s:GameState,level:LevelDefinition,previous?:Point|null):MoveOption[]{
 const from={x:s.x,y:s.y},goal=s.carrying?{x:level.exit.x+level.exit.w/2,y:level.exit.y+level.exit.h/2}:level.phone,spotted=s.guards.some(g=>g.seesPlayer);
 const what=s.carrying?'exit':'phone',now=routeLength(from,goal,level),seen=(p:Point)=>exposed(p,s,level);
 const back=(p:Point)=>!!previous&&Math.hypot(p.x-previous.x,p.y-previous.y)<.8;
 const nearestCone=(p:Point)=>Math.min(...s.guards.filter(g=>g.active&&g.spawned&&g.hp>0).map(g=>Math.max(0,Math.hypot(p.x-g.x,p.y-g.y)-g.range)),99);
 const out:MoveOption[]=[];
 for(const [name,dx,dy] of DIRS){
  const n=Math.hypot(dx,dy);let dest:Point|null=null;
  for(const step of [STEP,1]){const p={x:Math.min(11.1,Math.max(.9,from.x+dx/n*step)),y:Math.min(19.1,Math.max(.9,from.y+dy/n*step))};if(Math.hypot(p.x-from.x,p.y-from.y)>=.6&&walkableSegment(from,p,level)){dest=p;break;}}
  if(!dest)continue;
  const d=Math.hypot(dest.x-from.x,dest.y-from.y),ex=seen(dest),toGoal=routeLength(dest,goal,level),cone=nearestCone(dest);
  if(spotted&&ex)continue;
  const delta=Number.isFinite(toGoal)&&Number.isFinite(now)?now-toGoal:0;
  out.push({key:`walk_${name}_${d>=1.5?2:1}`,text:`Walk ${d>=1.5?2:1} tile${d>=1.5?'s':''} ${name.replace('_',' ')}. ${ex?'A guard can see that spot right now.':cone>0?`Out of sight; nearest cone edge ${r1(cone)} tiles.`:'Out of sight but at a cone edge.'} ${delta>=.5?`${r1(delta)} tiles closer to the ${what} along the corridors`:delta<=-.5?`${r1(-delta)} tiles further from the ${what}`:`no progress toward the ${what}`}.${back(dest)?' Goes back where you just were.':''}`,tap:dest,meta:{dist_to_goal:Number.isFinite(toGoal)?toGoal:99,exposed:ex}});
 }
 const goalDist=Math.hypot(goal.x-from.x,goal.y-from.y),route=findPath(from,goal,level);
 // the first two tiles of the real corridor route, so progress is always one of the choices
 if(route.length){let leg=route[route.length-1]!,walked=0,prev=from;for(const p of route){const d=Math.hypot(p.x-prev.x,p.y-prev.y);if(walked+d>=STEP){const t=(STEP-walked)/d;leg={x:prev.x+(p.x-prev.x)*t,y:prev.y+(p.y-prev.y)*t};break;}walked+=d;prev=p;leg=p;}
  const ex=seen(leg),cone=nearestCone(leg),routeLen=route.reduce((a,p,i)=>a+(i?Math.hypot(p.x-route[i-1]!.x,p.y-route[i-1]!.y):Math.hypot(p.x-from.x,p.y-from.y)),0);
  const ahead=threats(along(from,route,6),s,level),legSeen=threats(along(from,route,STEP),s,level).seenBy.length>0||ex;
  const name=(i:number)=>`guard ${i} (${s.guards[i]!.combatRole})`;
  const warn=ahead.seenBy.length?` The next 6 tiles run through the cone of ${ahead.seenBy.map(name).join(' and ')} right now.`:ahead.near.length?` The next 6 tiles pass within sight range of ${ahead.near.map(name).join(' and ')}, which ${ahead.near.length>1?'face':'faces'} away for now.`:' The next 6 tiles are clear of every guard.';
  if(!(spotted&&legSeen)&&Math.hypot(leg.x-from.x,leg.y-from.y)>=.4)out.push({key:'follow_route',text:`Follow the shortest corridor route to the ${what}: 2 tiles of real progress, ${r1(routeLen)} tiles left. ${legSeen?'A guard can see this leg right now.':cone>0?`This leg is out of sight; nearest cone edge ${r1(cone)} tiles.`:'This leg is out of sight but touches a cone edge.'}${warn}`,tap:leg,meta:{dist_to_goal:Math.max(0,routeLen-STEP),exposed:legSeen}});
  // a detour treats each threatening guard's surroundings as a wall and finds another way, if there is one
  for(const gi of [...ahead.seenBy,...ahead.near].slice(0,2)){
   const g=s.guards[gi]!,pad=Math.min(2.4,Math.max(1.4,Math.hypot(g.x-from.x,g.y-from.y)-.8));
   const avoid={...level,blockers:[...level.blockers,{x:g.x-pad,y:g.y-pad,w:pad*2,h:pad*2,kind:'wall' as const}]};
   const alt=findPath(from,goal,avoid);if(!alt.length)continue;
   let altLeg=alt[alt.length-1]!,w=0,pv=from;for(const p of alt){const d=Math.hypot(p.x-pv.x,p.y-pv.y);if(w+d>=STEP){const t=(STEP-w)/d;altLeg={x:pv.x+(p.x-pv.x)*t,y:pv.y+(p.y-pv.y)*t};break;}w+=d;pv=p;altLeg=p;}
   const altLen=alt.reduce((a,p,i)=>a+(i?Math.hypot(p.x-alt[i-1]!.x,p.y-alt[i-1]!.y):Math.hypot(p.x-from.x,p.y-from.y)),0),altSeen=threats(along(from,alt,6),s,level).seenBy;
   if(Math.hypot(altLeg.x-leg.x,altLeg.y-leg.y)<.6||(spotted&&seen(altLeg)))continue;
   out.push({key:`detour_around_guard_${gi}`,text:`Take another corridor that keeps ${r1(pad)} tiles away from ${name(gi)}: ${r1(altLen)} tiles to the ${what}, ${r1(altLen-routeLen)} tiles longer.${altSeen.length?` Its next 6 tiles are in the cone of ${altSeen.map(name).join(' and ')} right now.`:' Its next 6 tiles are out of every cone right now.'}`,tap:altLeg,meta:{dist_to_goal:altLen,exposed:altSeen.length>0}});
  }
 }
 if(goalDist<=3.5&&walkableSegment(from,goal,level)&&!(spotted&&seen(goal)))out.push({key:s.carrying?'go_to_exit':'go_to_phone',text:`${s.carrying?'Run for the exit and win':'Grab the phone'}: ${r1(goalDist)} tiles in a straight line. ${seen(goal)?'A guard can see it right now.':'No guard can see it.'}`,tap:goal,meta:{dist_to_goal:0,exposed:seen(goal)}});
 s.guards.forEach((g,id)=>{
  if(!g.active||!g.spawned||g.hp<=0||g.combatRole==='drone')return;const d=Math.hypot(g.x-from.x,g.y-from.y);if(d>4||!findPath(from,{x:g.x,y:g.y},level).length)return;
  const off=wrap(Math.atan2(from.y-g.y,from.x-g.x)-g.angle),behind=off>Math.PI*.62,front=off<Math.PI*.33,armor=g.combatRole==='heavy'||g.combatRole==='warden',aware=g.seesPlayer||g.mode!=='patrol';
  const outcome=armor?(behind?'rear hit, 75 damage':front?'front hit on armour, no damage':'side hit, 20 damage'):behind&&!aware?'instant kill from behind':`${35} damage`;
  out.push({key:`attack_guard_${id}`,text:`Attack guard ${id} (${g.combatRole}${level.patrols[id]?.boss?', boss '+level.patrols[id]!.boss:''}, ${g.hp} health), ${r1(d)} tiles away. You are ${behind?'behind it':front?'in front of it':'beside it'}${aware?' and it is alert':''}: ${outcome}.`,tap:{x:g.x,y:g.y},meta:{dist_to_goal:goalDist,exposed:!behind}});
 });
 const guardNear=s.guards.some(g=>g.active&&g.spawned&&g.hp>0&&Math.hypot(g.x-from.x,g.y-from.y)<=4);
 if(!spotted&&guardNear)out.push({key:'wait',text:`Stand still for half a second, silent, and let the nearby patrol pass. ${seen(from)?'A guard can see you where you stand.':'You are out of sight here.'} Costs time.`,tap:from,meta:{dist_to_goal:goalDist,exposed:seen(from)}});
 return out;
}
type Mvp={snapshot:()=>GameState;level:LevelDefinition;camera:{x:number;y:number;zoom:number};suspended?:boolean;tap:(x:number,y:number)=>boolean};
export type PilotStats={decisions:number;mode:string;last:Decision|null;lastOption:string;errors:number;running:boolean};
/** polls the game, asks the bridge, taps. exposed on window.__JEV_PILOT__ for the overlay and the runner */
export function startJevPilot(bridge='http://127.0.0.1:8791',intervalMs=500){
 const stats:PilotStats={decisions:0,mode:'idle',last:null,lastOption:'',errors:0,running:true};
 (window as unknown as {__JEV_PILOT__:PilotStats}).__JEV_PILOT__=stats;
 let busy=false,last:Observation['last_move']=null,lastTap:Point|null=null,lastFrom:Point|null=null;const recent:string[]=[];
 const timer=setInterval(()=>{
  const mvp=(window as unknown as {__SEEKER_MVP__?:Mvp}).__SEEKER_MVP__;if(!mvp||busy)return;
  if(mvp.suspended)return; // paused or loading: no decision, no tokens
  const s=mvp.snapshot();if(s.status!=='playing'||!s.combat)return;
  const level=mvp.level,moves=options(s,level,lastFrom);if(!moves.length)return;
  if(lastTap)last={option:stats.lastOption,result:Math.hypot(lastTap.x-s.x,lastTap.y-s.y)<.5?'arrived':s.guards.some(g=>g.seesPlayer)?'spotted':'walking'};
  const observation=observe(s,level,mvp.camera,last,recent);
  const criteria:Record<string,string>={},meta:Record<string,MoveOption['meta']>={};for(const m of moves){criteria[m.key]=m.text;meta[m.key]=m.meta;}
  busy=true;
  void fetch(`${bridge}/decide`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:{...observation,rules:RULES},instructions:`You are the courier in a stealth heist. Follow the rules in \`rules\`. Pick the move that best gets the ${s.carrying?'phone to the exit':'phone'} without being seen.${observation.clock.remaining_s<level.hardLimitSeconds*.4?' Time is running out: take real progress unless a guard can see the destination.':''}`,criteria,meta})})
   .then(async r=>{const d=await r.json() as Decision;const move=moves.find(m=>m.key===d.choice)??moves[0]!;stats.decisions++;stats.last=d;stats.mode=d.mode;stats.lastOption=move.key;recent.push(move.key);if(recent.length>8)recent.shift();if(move.tap){lastFrom={x:s.x,y:s.y};mvp.tap(move.tap.x,move.tap.y);lastTap=move.tap;}})
   .catch(()=>{stats.errors++;stats.mode='bridge down';})
   .finally(()=>{busy=false;});
 },intervalMs);
 return ()=>{clearInterval(timer);stats.running=false;};
}
