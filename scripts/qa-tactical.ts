import {initialState,idleInput,step,type GameState} from '../src/game/simulation';
import {combatTap,type CombatCommand} from '../src/game/combat';
import {recordStep} from '../src/game/recording';
import {findPath} from '../src/game/navigation';
import {sightDistance} from '../src/game/guards';
import type {LevelDefinition,Point} from '../src/game/level';
import type {ReplayChunk} from '../shared/replay';
function goal(s:GameState):Point{const l=s.definition!;return l.switches?.length&&!s.power?l.switches[0]!:s.carrying?{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2}:l.targets?.[s.delivered]??l.phone;}
function distance(s:GameState){const path=findPath(s,goal(s),{...s.definition!,blockers:s.blockers});let d=0,p:Point=s;for(const q of path){d+=Math.hypot(q.x-p.x,q.y-p.y);p=q;}return path.length?d:50;}
function options(s:GameState,seq:number){
 const l={...s.definition!,blockers:s.blockers},out:CombatCommand[]=[];
 const add=(p:Point)=>out.push(combatTap(s,p.x,p.y,seq));add(goal(s));
 const near=s.guards.map((g,i)=>({g,i,d:Math.hypot(g.x-s.x,g.y-s.y)})).filter(({g,d})=>g.active&&g.hp>0&&d<6&&sightDistance(s.x,s.y,(g.x-s.x)/d,(g.y-s.y)/d,d,l)>=d-1e-7).sort((a,b)=>a.d-b.d).slice(0,3);
 for(const {g}of near)add(g);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,p={x:s.x+Math.cos(a)*2.3,y:s.y+Math.sin(a)*2.3};if(findPath(s,p,l).length)add(p);}
 return out;
}
function advance(source:GameState,cmd:CombatCommand,ticks:number){const s=JSON.parse(JSON.stringify(source)) as GameState;for(let f=0;f<ticks&&s.status==='playing';f++)step(s,{...idleInput(),command:f===0?cmd:undefined});return s;}
function value(s:GameState,style=0){const c=s.combat!;return s.status==='won'?1e6:s.status!=='playing'?-1e6:c.hp*([14,22,10,18][style]??14)+c.kills*([90,160,170,55][style]??90)+s.delivered*1300+Number(s.carrying)*800+s.power*650-distance(s)*18-s.elapsed*.6;}
// Receding-horizon tap bot. It only emits legal commands, never edits the simulation.
function attempt(l:LevelDefinition,style:number){
 const s=initialState(l.mission,l),chunks:ReplayChunk[]=[];let seq=0;
 for(let turn=0;turn<l.hardLimitSeconds*2&&s.status==='playing';turn++){
  const candidates=options(s,seq+1).map(cmd=>{const state=advance(s,cmd,15);return {cmd,state,value:value(state,style)};}).sort((a,b)=>b.value-a.value).slice(0,4);
  let best=candidates[0],bestValue=-Infinity;
  for(const candidate of candidates){let future=candidate.value;if(candidate.state.status==='playing')for(const cmd of options(candidate.state,seq+2)){future=Math.max(future,value(advance(candidate.state,cmd,style===1?24:18),style));}const score=future+candidate.value*.25;if(score>bestValue){best=candidate;bestValue=score;}}
  if(!best)break;if(process.env.QA_TRACE&&turn%10===0)console.log(turn,s.x.toFixed(1),s.y.toFixed(1),s.combat!.hp,s.carrying,s.combat!.kills,best.cmd.kind,goal(s));seq++;
  for(let f=0;f<15&&s.status==='playing';f++)recordStep(s,{...idleInput(),command:f===0?best.cmd:undefined},chunks);
 }
 return s.status==='won'?{strategy:10,ticks:s.ticks,hp:s.combat!.hp,kills:s.combat!.kills,score:s.score,replay:{version:2 as const,chunks}}:null;
}
export function solveTactical(l:LevelDefinition){for(let style=0;style<4;style++){const win=attempt(l,style);if(win)return {...win,strategy:10+style};}return null;}
if(process.argv[1]?.endsWith('qa-tactical.ts'))void (async()=>{const {combatLevel}=await import('../src/game/combat-levels');const {CAMPAIGN_IDS}=await import('../src/game/level');for(const id of (process.env.QA_MISSION?[process.env.QA_MISSION as typeof CAMPAIGN_IDS[number]]:CAMPAIGN_IDS)){const w=solveTactical(combatLevel(id));console.log(id,w?{seconds:w.ticks/30,hp:w.hp,kills:w.kills}:'no win');}})();
