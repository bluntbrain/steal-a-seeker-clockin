import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CAMPAIGN_IDS,type LevelDefinition,type Point} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap,type CombatCommand} from '../src/game/combat';
import {initialState,idleInput,type GameState} from '../src/game/simulation';
import {recordStep} from '../src/game/recording';
import {sightDistance} from '../src/game/guards';
import {findPath} from '../src/game/navigation';
import {solveCombat} from './qa-combat';
import {verifyReplay} from '../server/replay';
import {freshProgress,recordWin,unlocked,parseProgress,starsFor} from '../src/progress/model';
import {GUIDE_STEPS,guideDone} from '../src/onboarding/combat-guide';
import type {Replay,ReplayChunk} from '../shared/replay';

// Offline audit only. Runs the shipping simulation with ordinary recorded taps.
// No health edits, enemy edits, game-rule edits, score submissions or payments.
const out='verification/campaign-audit-v5';mkdirSync(out,{recursive:true});
const round=(v:number)=>Math.round(v*100)/100;
const goal=(s:GameState):Point=>{const l=s.definition!;return l.switches?.length&&!s.power?l.switches[0]!:s.carrying?{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2}:l.targets?.[s.delivered]??l.phone;};
const random=(seed:number)=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
type Sample={tick:number;x:number;y:number;hp:number;carrying:boolean;delivered:number;kills:number;guards:{x:number;y:number;hp:number;active:boolean;phase:string;angle:number}[]};
function recorder(l:LevelDefinition,trace=false){
 const s=initialState(l.mission,l),chunks:ReplayChunk[]=[],samples:Sample[]=[],events:any[]=[];let firstDamage:number|null=null,pickup:number|null=null,beforeDamage=0,afterDamage=0,exitWait=0;
 function tick(command?:CombatCommand){
  const hp=s.combat!.hp,carry=s.carrying,delivered=s.delivered,power=s.power,kills=s.combat!.kills;
  recordStep(s,{...idleInput(),command},chunks);
  const damage=hp-s.combat!.hp;if(damage){if(firstDamage===null)firstDamage=s.elapsed;(s.securityAlarm?afterDamage+=damage:beforeDamage+=damage);events.push({type:'damage',tick:s.ticks,x:round(s.x),y:round(s.y),amount:damage,alarm:s.securityAlarm});}
  if(!carry&&s.carrying){pickup??=s.elapsed;events.push({type:'pickup',tick:s.ticks,x:s.x,y:s.y,hp:s.combat!.hp});}
  if(delivered!==s.delivered)events.push({type:'delivery',tick:s.ticks,hp:s.combat!.hp});
  if(power!==s.power)events.push({type:'switch',tick:s.ticks});
  if(kills!==s.combat!.kills)events.push({type:'kill',tick:s.ticks,total:s.combat!.kills});
  const e=l.exit,w=l.exitWindow;if(s.carrying&&w&&s.x>=e.x&&s.x<=e.x+e.w&&s.y>=e.y&&s.y<=e.y+e.h&&(s.elapsed+w.phase)%w.period>=w.openSeconds)exitWait++;
  if(trace&&(s.ticks%3===0||s.status!=='playing'))samples.push({tick:s.ticks,x:round(s.x),y:round(s.y),hp:s.combat!.hp,carrying:s.carrying,delivered:s.delivered,kills:s.combat!.kills,guards:s.guards.map(g=>({x:round(g.x),y:round(g.y),hp:g.hp,active:g.active,phase:g.gunPhase,angle:round(g.angle)}))});
 }
 function finish(){
  const replay:Replay={version:2,chunks},verified=verifyReplay(l.mission,replay,l);
  assert.equal(verified.status,s.status==='playing'?'incomplete':s.status);assert.equal(verified.hp,s.combat!.hp);assert.equal(verified.ticks,s.ticks);assert.equal(verified.score,s.score);
  const c=s.combat!;return {status:s.status,seconds:round(s.elapsed),hp:c.hp,stars:starsFor(s),score:s.score,kills:c.kills,shots:c.shots,enemyShots:c.enemyShots,taps:chunks.filter(c=>c.command).length,damage:c.damageTaken,beforePickupDamage:beforeDamage,afterPickupDamage:afterDamage,firstDamageSeconds:firstDamage===null?null:round(firstDamage),pickupSeconds:pickup===null?null:round(pickup),escapeSeconds:pickup===null?null:round(s.elapsed-pickup),exitWaitSeconds:round(exitWait/30),delivered:s.delivered,caughtBy:s.caughtBy===undefined?null:l.patrols[s.caughtBy]?.combatRole??null,death: s.status==='caught'?{x:round(s.x),y:round(s.y),alarm:s.securityAlarm}:null,verified:true,replay,samples,events,state:s};
 }
 return {s,tick,finish};
}
type Run=ReturnType<ReturnType<typeof recorder>['finish']>;
const compact=(r:Run)=>{const {replay,samples,events,state,...v}=r;return v;};

function exact(l:LevelDefinition,replay:Replay,trace=true){const r=recorder(l,trace);for(const chunk of replay.chunks)for(let n=0;n<chunk.ticks;n++)r.tick(chunk.command);return r.finish();}
function guided(l:LevelDefinition){const r=recorder(l,true);for(let i=0;i<GUIDE_STEPS.length;i++){const g=GUIDE_STEPS[i]!;r.tick(combatTap(r.s,g.x,g.y,i+1));let budget=900;while(r.s.status==='playing'&&!guideDone(i,r.s)&&budget-->0)r.tick();assert(guideDone(i,r.s),`Tutorial step ${i+1} failed`);}return r.finish();}
function reactive(l:LevelDefinition,strategy:number,seed:number,decisionTicks:number,jitter:number,rush=false){
 const r=recorder(l),s=r.s,rng=random(seed);let seq=0,next=Math.floor(rng()*31),phase=-1,at=0,waypoints:Point[]=[];
 while(s.status==='playing'){
  let command:CombatCommand|undefined;
  if(s.ticks>=next){next=s.ticks+decisionTicks+Math.floor(rng()*4);const c=s.combat!,p=goal(s),stage=s.delivered*2+Number(s.carrying)+s.power*10;
   if(stage!==phase){phase=stage;at=0;const lane=strategy%3===1?1.2:10.8;waypoints=strategy%3===0?[p]:[{x:lane,y:s.y},{x:lane,y:p.y},p];}
   // Tap within .5 of the courier is a stop command. Advance close waypoints
   // before issuing one; discard side waypoints inside cover instead of stalling.
   while(at<waypoints.length-1&&(Math.hypot(s.x-waypoints[at]!.x,s.y-waypoints[at]!.y)<.55||!findPath(s,waypoints[at]!,{...l,blockers:s.blockers}).length))at++;
   const enemy=s.guards.map((g,i)=>({g,i,d:Math.hypot(g.x-s.x,g.y-s.y)})).filter(({g,d})=>g.active&&g.hp>0&&g.combatRole!=='drone'&&d<(strategy<3?4:3.1)&&sightDistance(s.x,s.y,(g.x-s.x)/d,(g.y-s.y)/d,d,{...l,blockers:s.blockers})>=d-1e-7).sort((a,b)=>a.d-b.d)[0];
   let target:Point|undefined;
   if(!rush&&enemy){if(c.order?.kind!=='attack'||c.order.target!==enemy.i)target=enemy.g;}
   else if(rush?!c.order:c.order?.kind!=='attack'){
    const g=l.switches?.length&&!s.power?p:rush?p:waypoints[at]!;
    const intent=combatTap(s,g.x,g.y,seq+1);if(!c.order||c.order.kind!==intent.kind||Math.hypot(c.order.x-g.x,c.order.y-g.y)>.1)target=g;
   }
   if(target){command=combatTap(s,Math.max(0,Math.min(12,target.x+(rng()-.5)*2*jitter)),Math.max(0,Math.min(20,target.y+(rng()-.5)*2*jitter)),++seq);}
  }
  r.tick(command);
 }
 return r.finish();
}
function perturbed(l:LevelDefinition,replay:Replay,seed:number,maxDelay:number,jitter:number){
 const rng=random(seed),r=recorder(l);let at=0,drift=Math.floor(rng()*16),index=0,seq=0;
 const schedule=replay.chunks.flatMap(c=>{const t=at;at+=c.ticks;if(!c.command)return [];drift+=Math.floor(rng()*(maxDelay+1));return [{tick:t+drift,cmd:c.command}];});
 while(r.s.status==='playing'){
  let command:CombatCommand|undefined;const item=schedule[index];
  if(item&&r.s.ticks>=item.tick){index++;let p:Point=item.cmd;
   // Retain the intended live target, as a player looking at the screen would.
   if(item.cmd.kind==='attack'){const g=r.s.guards[item.cmd.target];if(g?.active&&g.hp>0)p=g;else{r.tick();continue;}}
   command=combatTap(r.s,Math.max(0,Math.min(12,p.x+(rng()-.5)*jitter*2)),Math.max(0,Math.min(20,p.y+(rng()-.5)*jitter*2)),++seq);
  }
  r.tick(command);
 }
 return r.finish();
}
const summarize=(runs:ReturnType<typeof compact>[])=>{const w=runs.filter(r=>r.status==='won'),median=(v:number[])=>v.length?[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)]!:null;return {runs:runs.length,wins:w.length,winRate:round(w.length/runs.length*100),caught:runs.filter(r=>r.status==='caught').length,timeouts:runs.filter(r=>r.status==='timeout').length,medianWinSeconds:median(w.map(r=>r.seconds)),medianWinHP:median(w.map(r=>r.hp)),deathsAfterPickup:runs.filter(r=>r.death?.alarm).length,medianDamageBeforePickup:median(runs.map(r=>r.beforePickupDamage)),medianDamageAfterPickup:median(runs.map(r=>r.afterPickupDamage))};};
const report:any={generatedAt:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD']).toString().trim(),rules:JSON.parse(readFileSync('shared/rules-manifest.json','utf8')),method:'Offline recorded-input simulation using shipping v5 rules; every attempt independently replay-verified. Trial rates describe controllers, not people. No game balance changes.',profiles:{direct:'12 start delays, objective only, no attacks',reactive:'24 trials: 6 route/range policies × 4 start/tap seeds; 0.4–0.5 s decisions, ±0.12 world-unit tap error; visible nearest guard, no future simulation',slow:'24 trials: same policies/seeds, 0.7–0.8 s decisions, ±0.24 tap error',mild:'24 trials of a known winning command plan; per-command delay 0–0.067 s, initial delay 0–0.5 s, ±0.10 tap error; no replanning',coarse:'24 trials of a known winning command plan; per-command delay 0–0.20 s, initial delay 0–0.5 s, ±0.22 tap error; no replanning'},levels:[],campaign:{}};
let progress=freshProgress();const chain:any[]=[];
for(const [i,id] of CAMPAIGN_IDS.entries()){
 const l=combatLevel(id),solution=solveCombat(l);assert(solution,`${id} needs a winning route`);const win=exact(l,solution.replay),tutorial=i===0?guided(l):null;
 const profiles:Record<string,ReturnType<typeof compact>[]>=Object.fromEntries(['direct','reactive','slow','mild','coarse'].map(p=>[p,[]]));
 for(let seed=0;seed<12;seed++)profiles.direct!.push(compact(reactive(l,0,101+seed,12,0,true)));
 for(let seed=0;seed<24;seed++){
  profiles.reactive!.push(compact(reactive(l,seed%6,1001+seed,12,.12)));
  profiles.slow!.push(compact(reactive(l,seed%6,1001+seed,21,.24)));
  profiles.mild!.push(compact(perturbed(l,solution.replay,2001+seed,2,.10)));
  profiles.coarse!.push(compact(perturbed(l,solution.replay,2001+seed,6,.22)));
 }
 const spawn=recorder(l);while(spawn.s.ticks<240&&spawn.s.status==='playing')spawn.tick();
 assert(unlocked(progress,id));progress=recordWin(progress,(tutorial??win).state);progress=parseProgress(JSON.stringify(progress));assert(progress.missions[id]);chain.push({mission:id,unlockedBeforePlaying:true,completed:true,savedAndReloaded:true,stars:progress.missions[id]!.stars});
 const entry={number:i+1,id,title:l.title,targetSeconds:l.targetSeconds,timeLimit:l.hardLimitSeconds,guards:l.patrols.filter(g=>g.reserveAfter===undefined).map(g=>g.combatRole),reserves:l.patrols.filter(g=>g.reserveAfter!==undefined).map(g=>({role:g.combatRole,after:g.reserveAfter})),objectivePhones:l.targets?.length??1,briefing:l.briefing,solution:{...compact(win),strategy:solution.strategy},tutorial:tutorial?compact(tutorial):null,spawnIdle:compact(spawn.finish()),profiles:Object.fromEntries(Object.entries(profiles).map(([name,runs])=>[name,summarize(runs)])),trials:profiles};
 report.levels.push(entry);writeFileSync(`${out}/${String(i+1).padStart(2,'0')}-${id}.json`,JSON.stringify({level:l,solution:{...compact(win),replay:win.replay,samples:win.samples,events:win.events},tutorial:tutorial?{...compact(tutorial),replay:tutorial.replay,samples:tutorial.samples,events:tutorial.events}:null}));
 console.log(JSON.stringify({level:i+1,title:l.title,win:win.seconds,hp:win.hp,profiles:entry.profiles}));writeFileSync(`${out}/report.json`,JSON.stringify(report));
}
report.campaign={completedMissions:Object.keys(progress.missions).length,chain,progress,stars:Object.values(progress.missions).reduce((n,b)=>n+b!.stars,0),note:'Progress model round-trip in memory; not browser localStorage, live account, payment or device persistence.'};
report.totalTrials=report.levels.reduce((n:number,l:any)=>n+Object.values(l.profiles).reduce((a:number,p:any)=>a+p.runs,0),0);
writeFileSync(`${out}/report.json`,JSON.stringify(report)+'\n');assert.equal(Object.keys(progress.missions).length,12);console.log('COMPLETE',report.totalTrials,'controlled trials; 12/12 campaign progress saves.');
