import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type LevelDefinition} from '../src/game/level';
import {initialState,idleInput,step} from '../src/game/simulation';
import {walkableSegment,findPath} from '../src/game/navigation';
import {updateEncounterGuards} from '../src/game/encounters';
import {sees} from '../src/game/guards';
import campaign9 from './fixtures/campaign-revision9.json';
function arena():LevelDefinition {
 const l=campaign9.levels[1] as LevelDefinition;return {...l,combat:{version:2,revision:9},number:2,spawn:{x:4,y:9},blockers:l.blockers.slice(0,4),patrols:[
  {...l.patrols[0]!,combatRole:'drone',kind:'scanner',route:[{x:4,y:6},{x:4,y:10}],roam:undefined,speed:0,range:3.5,spotSeconds:.7},
  {...l.patrols[0]!,combatRole:'scout',route:[{x:6,y:6},{x:6,y:5}],roam:undefined,speed:.8,range:.1},
  {...l.patrols[0]!,combatRole:'scout',route:[{x:7,y:6},{x:7,y:5}],roam:undefined,speed:.8,range:.1},
  {...l.patrols[0]!,combatRole:'scout',route:[{x:10,y:2},{x:10,y:1}],roam:undefined,speed:.8,range:.1},
 ]};
}
test('sustained scout sight shares a local snapshot with one nearby responder in early missions',()=>{
 const l=arena(),s=initialState(l.mission,l);for(let t=0;t<12;t++)step(s,idleInput());assert.equal(s.guards[1]!.alerted,false);
 for(let t=0;t<12;t++)step(s,idleInput());assert.equal(s.guards[1]!.alerted,true);assert.equal(s.guards[2]!.alerted,false);assert.equal(s.guards[3]!.alerted,false);
 for(let t=0;t<66;t++)step(s,idleInput());assert.equal(s.guards[2]!.alerted,false,'Repeated reports cannot exceed the live support cap');
 assert.deepEqual(s.guards[1]!.lastSeen,{x:4,y:9});assert.equal(s.securityAlarm,false);assert.equal(s.combat!.enemyShots,0);
});

function fightArena(){
 const l=arena();l.patrols=[{...l.patrols[1]!,route:[{x:6,y:6},{x:6,y:9}],speed:0,range:3,halfAngle:Math.PI/3.5,spotSeconds:.3}];l.spawn={x:6,y:7.2};
 const s=initialState(l.mission,l);let shots=0;
 const advance=(ticks:number)=>{for(let t=0;t<ticks;t++){s.ticks++;updateEncounterGuards(s,1/30,l,()=>shots++);}};
 return {l,s,advance,shots:()=>shots};
}
test('engaged guards retain close contact through a sidestep and continue aiming',()=>{
 const {l,s,advance,shots}=fightArena(),g=s.guards[0]!;advance(16);assert.equal(g.gunPhase,'aim');
 s.x=7.2;s.y=6;assert.equal(sees(g,s.x,s.y,l),false,'Move outside the narrow patrol cone');
 advance(1);assert(g.seesPlayer,'An engaged guard must not lose a nearby exposed courier');assert.equal(g.gunPhase,'aim');
 advance(26);assert(shots()>0,'The guard completes its telegraphed shot');
 const savedAngle=g.shotAngle;advance(1);assert.equal(g.shotAngle,savedAngle,'The fired shot does not home after release');
 advance(70);assert(shots()>=2,'Recovery must not return a visible target to patrol/search');
});
test('close tracking does not grant an unaware guard rear vision',()=>{
 const {s,advance}=fightArena(),g=s.guards[0]!;s.y=4.8;advance(20);
 assert.equal(g.seesPlayer,false);assert.equal(g.alerted,false);assert.equal(g.gunPhase,'ready');
});
test('an engaged guard loses actual visibility behind cover and cannot update the hidden position',()=>{
 const {l,s,advance,shots}=fightArena(),g=s.guards[0]!;advance(16);const snapshot={...g.lastSeen};
 l.blockers.push({x:5,y:6.5,w:3,h:.3,kind:'wall'});s.x=6.7;s.y=7.2;
 advance(1);assert.equal(g.seesPlayer,false);assert.notEqual(g.gunPhase,'aim');assert.deepEqual(g.lastSeen,snapshot);
 advance(70);assert.equal(shots(),0);assert.deepEqual(g.lastSeen,snapshot);
 // After contact memory expires, merely being behind the guard does not reacquire.
 l.blockers.pop();g.angle=Math.PI/2;s.x=6;s.y=4.8;advance(1);assert.equal(g.seesPlayer,false);
});
test('breaking contact stops hidden-player tracking, leads to search and then a patrol return',()=>{
 const l=arena(),s=initialState(l.mission,l);for(let t=0;t<24;t++)step(s,idleInput());const g=s.guards[1]!;
 s.x=1.4;s.y=18;s.px=s.x;s.py=s.y;s.carrying=true;s.securityAlarm=true;s.thefts=1;
 let searched=false,returned=false;for(let t=0;t<900;t++){step(s,idleInput());assert.notDeepEqual(g.lastSeen,{x:s.x,y:s.y});searched ||= g.mode==='search';returned ||= searched&&g.mode==='patrol';}
 assert(searched);assert(returned);assert.equal(s.combat!.hp,100);
});
test('walls prevent the initial report and short glimpses do not instantly alert a room',()=>{
 const l=arena();l.blockers.push({x:3,y:7,w:2,h:.5,kind:'wall'});const s=initialState(l.mission,l);
 for(let t=0;t<90;t++)step(s,idleInput());assert(!s.guards.some(g=>g.alerted));
});
test('authored home zones are reachable and the seeded patrol loop is repeatable and visits several anchors',()=>{
 for(const id of CAMPAIGN_IDS.slice(1)){
  const l=combatLevel(id);for(const spec of l.patrols)for(const p of spec.roam??spec.route)assert(findPath(spec.route[0]!,p,l).length,`${id}: disconnected home zone`);
  for(const sw of l.switches??[])assert(findPath(l.spawn,sw,l).length,`${id}: inaccessible switch`);
  // Isolate patrol variation: a live player at spawn can trigger pursuit and
  // finish the run before every patrol anchor is visited on the new maps.
  const patrolOnly={...l,patrols:l.patrols.map(g=>({...g,range:.01}))};
  const a=initialState(id,patrolOnly),b=initialState(id,patrolOnly),visited=new Set<number>();
  // Allow a full minute for the slower patrol pace and seeded anchor choices.
  for(let t=0;t<1800;t++){step(a,idleInput());step(b,idleInput());for(const g of a.guards)assert(walkableSegment(g,g,l),`${id}: guard inside a wall`);visited.add((a.guards[0]!.heist as {pos?:number}|undefined)?.pos??a.guards[0]!.brain?.lastAnchor??0);}
  assert.deepEqual(a,b);assert(visited.size>=3,`${id}: no patrol variation`);
 }
});
