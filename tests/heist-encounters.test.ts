import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type LevelDefinition,type Point} from '../src/game/level';
import {initialState,idleInput,step,type GameState} from '../src/game/simulation';
import {combatTap} from '../src/game/combat';
import {updateHeistGuards,shareHeistSighting,directionalArmor,DRONE_REPORT_TICKS,ENTRY_WARNING_TICKS,SEARCH_TICKS} from '../src/game/heist-guards';
import {findPath,walkableSegment} from '../src/game/navigation';
import {encounterHint} from '../src/controls/encounterHint';

function arena():LevelDefinition{
 const l=combatLevel('cone-lesson'),base={...l.patrols[0]!,speed:0,pursuitSpeed:2.4,range:3.5,roam:undefined,spotSeconds:.4,pauseSeconds:0};
 return {...l,combat:{version:2,revision:16},number:7,spawn:{x:4,y:8},phone:{x:2,y:3},exit:{x:5.4,y:17.4,w:1.2,h:1.2},blockers:l.blockers.slice(0,4),
  encounter:{junctions:[{x:4,y:10},{x:7,y:9}],pockets:[],islands:[],grates:[],routes:{approach:[],escape:[],fast:[]}},
  patrols:[{...base,combatRole:'drone',kind:'scanner',route:[{x:4,y:6},{x:4,y:7}]},
   {...base,combatRole:'scout',kind:undefined,range:.1,route:[{x:6,y:6},{x:6,y:5}]},
   {...base,combatRole:'scout',kind:undefined,range:.1,route:[{x:7,y:6},{x:7,y:5}]},
   {...base,combatRole:'scout',kind:undefined,range:.1,route:[{x:10,y:2},{x:10,y:1.5}]}]};
}
function tick(s:GameState,count:number){for(let t=0;t<count;t++)step(s,idleInput());}
function advanceAI(s:GameState,l:LevelDefinition,count:number){for(let t=0;t<count;t++){s.ticks++;updateHeistGuards(s,1/30,l,()=>{});}}

test('drone scan and report charge are separate; cover cancels the report before broadcasting',()=>{
 const l=arena(),s=initialState(l.mission,l);tick(s,22);
 assert(s.guards[0]!.heist!.charge>0);assert(s.guards[0]!.heist!.charge<DRONE_REPORT_TICKS);
 assert(!s.guards[1]!.alerted);assert.match(encounterHint(s)!,/CHARGING/);
 l.blockers.push({x:.7,y:7,w:10.6,h:.3,kind:'wall'});s.blockers=[...l.blockers];tick(s,1);
 assert.equal(s.guards[0]!.heist!.charge,0);tick(s,60);assert(!s.guards[1]!.alerted);assert.equal(s.combat!.enemyShots,0);
});
test('defeating a reporting drone cancels it; a completed broadcast alerts only nearby enemies',()=>{
 const l=arena(),dead=initialState(l.mission,l);tick(dead,24);dead.guards[0]!.hp=0;tick(dead,60);
 assert.equal(dead.guards[0]!.heist!.charge,0);assert(!dead.guards[1]!.alerted);
 const s=initialState(l.mission,l);tick(s,42);assert(s.guards[0]!.heist!.broadcastUntil>s.ticks);
 assert(s.guards[1]!.alerted);assert(s.guards[2]!.alerted);assert(!s.guards[3]!.alerted);assert.equal(s.combat!.enemyShots,0);
 assert.match(encounterHint(s)!,/REPORT SENT/);
});
test('confirmed radio reaches nearby deployed enemies without relaying to distant enemies',()=>{
 const l=arena();l.patrols[3]!.combatRole='drone';
 l.patrols.push({...l.patrols[3]!,reserveAfter:0,pickupWave:1});
 const s=initialState(l.mission,l);advanceAI(s,l,1);
 const snapshot={x:4,y:8};s.guards[0]!.lastSeen={...snapshot};assert.equal(shareHeistSighting(s,0,l),2);
 for(const g of s.guards.slice(0,3)){
  assert(g.heist!.hunting);assert.equal(g.heist!.role,'pursuer');assert.equal(g.mode,'investigate');
  assert.deepEqual(g.brain!.goal,snapshot);assert.deepEqual(g.lastSeen,snapshot);
 }
 assert(!s.guards[3]!.heist!.hunting);assert(!s.guards[4]!.spawned);assert(!s.guards[4]!.heist!.hunting);
 s.x=1.2;s.y=18;advanceAI(s,l,60);
 for(const g of s.guards.slice(0,3))assert.deepEqual(g.lastSeen,snapshot,'Radio never reveals hidden movement');
 assert(!s.guards[3]!.heist!.hunting,'Radio recipients cannot relay or consume a global hunt');
});
test('a drone keeps chasing after the broadcast animation and old cooldown finish',()=>{
 const l=arena();l.patrols=l.patrols.slice(0,1);const s=initialState(l.mission,l);advanceAI(s,l,45);
 const g=s.guards[0]!;assert(s.combat!.hunt);s.x=6.5;s.y=8;
 const distance=Math.hypot(g.x-s.x,g.y-s.y);advanceAI(s,l,150);
 assert(g.heist!.hunting);assert.equal(g.mode,'investigate');assert(g.seesPlayer);
 assert(Math.hypot(g.x-s.x,g.y-s.y)<distance-1);assert(g.x>5);
});
test('heavy recovery approaches the visible courier instead of an obsolete retreat waypoint',()=>{
 const l=arena();l.spawn={x:6,y:8.5};l.patrols=[{...l.patrols[1]!,combatRole:'heavy',range:4.3,route:[{x:6,y:6},{x:6,y:2}],speed:.6}];
 const s=initialState(l.mission,l),g=s.guards[0]!;g.angle=Math.PI/2;advanceAI(s,l,65);
 assert(g.heist!.hunting);assert(g.alerted);
 // Reproduce the stale movement path left behind during a firing burst.
 g.path=[{x:6,y:2}];g.pathIndex=0;g.brain!.goal={x:6,y:2};g.brain!.plan=false;g.gunPhase='recover';g.gunTicks=20;
 s.x=g.x+Math.cos(g.angle+.2)*2.5;s.y=g.y+Math.sin(g.angle+.2)*2.5;let previous=Math.hypot(g.x-s.x,g.y-s.y);const before=previous;
 for(let t=0;t<100;t++){advanceAI(s,l,1);const distance=Math.hypot(g.x-s.x,g.y-s.y);assert(distance<=previous+1e-8,'Visible pursuit must not move away between shots');previous=distance;assert(g.seesPlayer);assert.equal(g.mode,'investigate');}
 assert(previous<before-.2);
});
test('loss of sight follows the last position, searches at patrol speed for five seconds, then calms down',()=>{
 const l=arena();l.patrols=[{...l.patrols[0]!,speed:.7}];const s=initialState(l.mission,l);advanceAI(s,l,50);const g=s.guards[0]!,last={...g.lastSeen};
 l.blockers.push({x:.7,y:11,w:10.6,h:.4,kind:'wall'});s.x=9;s.y=17;
 const observedDistance=Math.hypot(g.x-last.x,g.y-last.y);advanceAI(s,l,10);
 assert(Math.hypot(g.x-last.x,g.y-last.y)<observedDistance,'Resume a path to last sight after direct following');
 for(let t=0;t<360&&g.mode!=='search';t++)advanceAI(s,l,1);
 assert.equal(g.mode,'search');const deadline=g.brain!.searchUntil;assert.equal(deadline-s.ticks,SEARCH_TICKS);
 while(s.ticks<deadline-1){
  const before={x:g.x,y:g.y};advanceAI(s,l,1);
  assert(Math.hypot(g.x-before.x,g.y-before.y)<=.7/30+1e-8,'Blind search must use patrol speed');
  assert.equal(g.brain!.searchUntil,deadline,'Checking corners must not extend the deadline');
  assert(g.heist!.hunting);assert.deepEqual(g.lastSeen,last);assert(!g.seesPlayer);
 }
 advanceAI(s,l,1);assert(!g.heist!.hunting);assert(!g.alerted);assert.equal(g.mode,'return');assert(!s.combat!.hunt);
 advanceAI(s,l,300);assert.equal(g.mode,'patrol');assert(!g.alerted);
});
test('reacquisition broadcasts a fresh target and cancels old searches for nearby enemies only',()=>{
 const l=arena();l.patrols[0]!.combatRole='scout';const s=initialState(l.mission,l);advanceAI(s,l,1);s.guards[0]!.lastSeen={x:4,y:8};shareHeistSighting(s,0,l);
 for(const g of s.guards){g.mode='search';g.brain!.goal={x:2,y:2};g.brain!.searchUntil=1000;}
 s.ticks+=13;s.x=4;s.y=8.5;advanceAI(s,l,1);
 for(const g of s.guards.slice(0,3)){assert.equal(g.mode,'investigate');assert.deepEqual(g.lastSeen,{x:4,y:8.5});assert.equal(g.brain!.searchUntil,0);}
 assert.equal(s.guards[3]!.mode,'search');
});
test('distant reinforcements investigate the pickup without inheriting stale global sightings',()=>{
 const l=arena();l.patrols=[l.patrols[0]!,{...l.patrols[3]!,reserveAfter:0,pickupWave:1}];
 const s=initialState(l.mission,l);advanceAI(s,l,45);s.thefts=1;advanceAI(s,l,ENTRY_WARNING_TICKS+1);
 const g=s.guards[1]!;assert(g.spawned);assert(!g.heist!.hunting);assert.deepEqual(g.lastSeen,l.phone);
});
test('a heavy stops its remaining burst when cover blocks actual sight',()=>{
 const l=arena();l.spawn={x:4,y:8};l.patrols=[{...l.patrols[0]!,combatRole:'heavy'}];const s=initialState(l.mission,l);advanceAI(s,l,25);
 const g=s.guards[0]!;g.gunPhase='fire';g.gunTicks=0;g.burstLeft=3;
 l.blockers.push({x:3,y:7,w:2,h:.3,kind:'wall'});let shots=0;s.ticks++;updateHeistGuards(s,1/30,l,()=>shots++);
 assert.equal(shots,0);assert.equal(g.gunPhase,'recover');assert.equal(g.burstLeft,0);assert(g.heist!.hunting);
});
test('an investigating guard travels faster than its readable patrol speed',()=>{
 const l=arena();l.patrols=[{...l.patrols[1]!,speed:.7,pursuitSpeed:2.4,route:[{x:6,y:6},{x:6,y:12}],roam:undefined}];
 const patrol=initialState(l.mission,l),chase=initialState(l.mission,l);advanceAI(patrol,l,1);advanceAI(chase,l,1);
 const g=chase.guards[0]!;g.mode='investigate';g.brain!.goal={x:6,y:12};g.brain!.plan=true;g.brain!.nextPlan=chase.ticks;g.brain!.alertUntil=chase.ticks+360;
 advanceAI(patrol,l,30);advanceAI(chase,l,30);
 assert(chase.guards[0]!.y-6>(patrol.guards[0]!.y-6)*2.5);
});
test('engaged guards retain an in-cone sidestep but cannot see behind cover',()=>{
 const l=arena();l.spawn={x:6,y:7.2};l.patrols=[{...l.patrols[1]!,range:3.5,route:[{x:6,y:6},{x:6,y:9}]}];
 const s=initialState(l.mission,l);advanceAI(s,l,25);const g=s.guards[0]!;assert.equal(g.gunPhase,'aim');
 s.x=6.4;s.y=7.2;advanceAI(s,l,1);assert(g.seesPlayer);assert.equal(g.gunPhase,'aim');
 const last={...g.lastSeen};l.blockers.push({x:6.5,y:5,w:.3,h:3,kind:'wall'});s.x=7.5;advanceAI(s,l,1);
 assert(!g.seesPlayer);assert.deepEqual(g.lastSeen,last);assert.notEqual(g.gunPhase,'aim');
});
test('pickup immediately starts a single warned reinforcement response and an occupied entrance remains safe',()=>{
 const l=arena();l.phone={...l.spawn};l.patrols=[{...l.patrols[1]!,reserveAfter:0,pickupWave:1,route:[{x:8,y:8},{x:8,y:7}]}];
 const s=initialState(l.mission,l);step(s,{...idleInput(),command:combatTap(s,l.phone.x,l.phone.y,1)});
 while(!s.carrying&&s.ticks<60)step(s,idleInput());
 assert(s.carrying);const g=s.guards[0]!;assert.equal(g.spawned,false);assert.equal(g.heist!.arrivalUntil,s.ticks+ENTRY_WARNING_TICKS);
 assert.match(encounterHint(s)!,/RESPONSE INBOUND/);s.x=8;s.y=8;tick(s,60);assert.equal(g.active,false);assert.equal(s.combat!.enemyShots,0);
 s.x=3;s.y=10;tick(s,1);assert.equal(g.active,true);assert(g.reactionTicks>0);const deadline=g.heist!.arrivalUntil;
 s.thefts++;tick(s,30);assert.equal(g.heist!.arrivalUntil,deadline,'Second pickup cannot respawn an existing guard');
});
test('directional armor protects the front, keeps side damage and rewards the rear at impact',()=>{
 const l=arena(),s=initialState(l.mission,l),g=s.guards[1]!;g.angle=0;
 assert(directionalArmor(g,-18,0,25).damage<25);
 assert.equal(directionalArmor(g,0,18,25).damage,25);
 assert.equal(directionalArmor(g,18,0,25).damage,50);
 const shootFrom=(rear:boolean)=>{const a=arena();a.combat={version:2,revision:14};a.spawn={x:4,y:10};a.patrols=[{...a.patrols[1]!,combatRole:'heavy',range:.1,route:[{x:6,y:10},{x:rear?7:5,y:10}]}];const state=initialState(a.mission,a);step(state,{...idleInput(),command:combatTap(state,6,10,1)});tick(state,6);return state;};
 const front=shootFrom(false),rear=shootFrom(true);
 assert(front.guards[0]!.hp>rear.guards[0]!.hp);assert.equal(front.guards[0]!.heist!.armorHit,'front');assert.equal(rear.guards[0]!.heist!.armorHit,'rear');
});
test('a noisy grate reports the crossing position once per cooldown, not the hidden moving player',()=>{
 const l=arena();l.spawn={x:2,y:10};l.encounter!.grates=[{x:3.5,y:9.5,w:1,h:1,kind:'wall'}];l.patrols=[{...l.patrols[1]!,route:[{x:5,y:7},{x:5,y:6}]}];
 const s=initialState(l.mission,l);step(s,{...idleInput(),command:combatTap(s,8,10,1)});tick(s,30);
 assert(s.combat!.grateNoise);assert(s.guards[0]!.alerted);const noise={...s.combat!.grateNoise};assert.equal(noise.id,1);
 assert.deepEqual(s.guards[0]!.lastSeen,{x:noise.x,y:noise.y});tick(s,30);assert.equal(s.combat!.grateNoise!.id,1);assert.notDeepEqual(s.guards[0]!.lastSeen,{x:s.x,y:s.y});
});
test('a hidden guard cannot steal the tap intended for an objective in revision 10',()=>{
 const l=arena();l.combat={version:2,revision:10};l.spawn={x:2,y:10};l.phone={x:6,y:10};l.patrols=[{...l.patrols[1]!,route:[{x:6.2,y:10},{x:6.2,y:11}]}];l.blockers.push({x:3.5,y:8,w:.5,h:4,kind:'wall'});
 const s=initialState(l.mission,l);assert.equal(combatTap(s,6,10,1).kind,'phone');
 l.combat={version:2,revision:9};assert.equal(combatTap(s,6,10,1).kind,'attack','Historic command selection remains unchanged');
});
test('all heist pockets, entrances, route hints and guard anchors are traversable',()=>{
 for(const id of CAMPAIGN_IDS.slice(1)){const l=combatLevel(id);assert.equal(l.combat?.revision,18);
  const points=[l.spawn,...(l.targets??[l.phone]),...(l.encounter?.junctions??[]),...(l.encounter?.pockets??[]),...(l.switches??[]),...l.patrols.flatMap(g=>g.roam??g.route)];
  for(const p of points){assert(walkableSegment(p,p,l),`${id}: point in a wall ${JSON.stringify(p)}`);assert(findPath(l.spawn,p,l).length,`${id}: disconnected point`);}
  const length=(points:Point[])=>{let from=l.spawn,distance=0;for(const target of points)for(const p of findPath(from,target,l)){distance+=Math.hypot(p.x-from.x,p.y-from.y);from=p;}return distance;};
  assert(length([...l.encounter!.routes.approach,l.phone])>length([l.phone])+1,`${id}: covered route must involve a real detour`);
 }
});
test('heist movement, reports and reinforcements survive serialization deterministically',()=>{
 const l=combatLevel('false-footsteps'),a=initialState(l.mission,l);tick(a,17);const b:GameState=JSON.parse(JSON.stringify(a));
 for(let t=0;t<300;t++){const command=t===0?combatTap(a,l.phone.x,l.phone.y,1):undefined;step(a,{...idleInput(),command});step(b,{...idleInput(),command});}assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
});

test('alerted guards and drones cannot see outside the visible cone or beyond its range',()=>{
 for(const role of ['scout','heavy','drone'] as const){
  const l=arena();l.patrols=[{...l.patrols[0]!,combatRole:role,range:3.5}];
  const s=initialState(l.mission,l);advanceAI(s,l,45);const g=s.guards[0]!;assert(g.heist!.hunting);
  const last={...g.lastSeen};g.angle=0;s.x=g.x-.6;s.y=g.y;advanceAI(s,l,1);
  assert(!g.seesPlayer,`${role} must not see behind itself`);assert.deepEqual(g.lastSeen,last);
  g.angle=0;s.x=g.x+3.6;s.y=g.y;advanceAI(s,l,1);assert(!g.seesPlayer,`${role} must respect drawn range`);
 }
});
test('an old hunt cannot bypass a drone report charge or reveal a new hidden position',()=>{
 const l=arena(),s=initialState(l.mission,l);s.combat!.hunt={x:1,y:1,tick:0};
 advanceAI(s,l,22);assert(s.guards[0]!.heist!.charge>0);assert(!s.guards[1]!.alerted);
 l.blockers.push({x:.7,y:7,w:10.6,h:.3,kind:'wall'});advanceAI(s,l,1);
 assert.equal(s.guards[0]!.heist!.charge,0);assert(!s.guards[1]!.alerted);
});
test('new direct contact during a search restarts pursuit; an unreachable report eventually expires',()=>{
 const l=arena();l.patrols=[{...l.patrols[1]!,range:3.5,speed:.7,route:[{x:4,y:6},{x:4,y:7}]}];
 const s=initialState(l.mission,l);advanceAI(s,l,30);const g=s.guards[0]!;
 s.x=9;s.y=18;advanceAI(s,l,120);assert.equal(g.mode,'search');
 s.x=g.x+1;s.y=g.y;g.angle=0;advanceAI(s,l,20);assert(g.seesPlayer);assert(g.heist!.hunting);assert.equal(g.mode,'investigate');
 // A trapped guard still abandons the report rather than running forever.
 s.x=9;s.y=18;g.brain!.plan=true;g.brain!.nextPlan=10000;g.brain!.alertUntil=s.ticks+3;
 advanceAI(s,l,3);assert.equal(g.mode,'search');advanceAI(s,l,SEARCH_TICKS);assert(!g.alerted);assert(!g.heist!.hunting);
});
