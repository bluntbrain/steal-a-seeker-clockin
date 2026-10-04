import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap} from '../src/game/combat';
import {stepMelee,canKnifeHit} from '../src/game/melee';
import {initialState,idleInput,step,type GameState} from '../src/game/simulation';
import {walkableSegment} from '../src/game/navigation';
function arena(){const l=combatLevel('practice');return {...l,spawn:{x:2,y:10},blockers:l.blockers.slice(0,4),patrols:[{...l.patrols[0]!,combatRole:'scout' as const,range:0,route:[{x:8,y:10},{x:8,y:9}],speed:0,roam:undefined}]};}
function tick(s:GameState,n:number){for(let i=0;i<n;i++)step(s,idleInput());}
function contact(role:'scout'|'sentry'|'heavy'|'drone'='scout',front=false){const l=arena(),s=initialState(l.mission,l),g=s.guards[0]!;s.x=7.2;s.y=10;g.combatRole=role;g.angle=front?Math.PI:0;g.hp=g.maxHp=role==='heavy'?150:role==='drone'?25:75;g.range=0;s.combat!.order={seq:1,kind:'attack',target:0,x:g.x,y:g.y};return {s,g,l};}
function swing(s:GameState,l:ReturnType<typeof arena>){stepMelee(s,l);s.ticks+=4;stepMelee(s,l);}
test('one tap approaches to knife reach, defeats an enemy and emits no courier bullets',()=>{
 const l=arena(),s=initialState(l.mission,l);step(s,{...idleInput(),command:combatTap(s,8,10,1)});
 let minimum=99;for(let i=0;i<200&&s.guards[0]!.hp>0;i++){const before={x:s.x,y:s.y};step(s,idleInput());minimum=Math.min(minimum,Math.hypot(s.x-s.guards[0]!.x,s.y-s.guards[0]!.y));assert(walkableSegment(before,s,l));assert(s.combat!.projectiles.every(p=>p.owner>=0));}
 assert.equal(s.guards[0]!.hp,0);assert(minimum>.5&&minimum<.94);assert.equal(s.combat!.shots,0);assert(s.combat!.melee!.hits>0);
});
test('knife contact checks cover and current distance at the impact tick',()=>{
 for(const mode of ['wall','distance']){const {s,g,l}=contact();stepMelee(s,l);if(mode==='wall')l.blockers.push({x:7.5,y:9,w:.15,h:2,kind:'wall'});else g.x=10;s.ticks+=4;stepMelee(s,l);assert.equal(g.hp,75);assert.equal(s.combat!.melee!.hits,0);assert(!canKnifeHit(s,g,l));}
});
test('floor tap cancels a pending hit and repeated attack taps cannot accelerate damage',()=>{
 const a=contact('sentry',true),b=contact('sentry',true);a.g.alerted=b.g.alerted=true;
 for(let i=0;i<25;i++){step(a.s,idleInput());step(b.s,{...idleInput(),command:combatTap(b.s,b.g.x,b.g.y,i+1)});}assert.equal(a.g.hp,b.g.hp);assert.equal(a.s.combat!.melee!.swings,b.s.combat!.melee!.swings);
 const {s,g}=contact();step(s,idleInput());step(s,{...idleInput(),command:{seq:2,kind:'move',target:-1,x:6,y:12}});tick(s,8);assert.equal(g.hp,75);assert.equal(s.combat!.order?.kind,'move');
});
test('unaware rear normal defeat, frontal armor block, rear armor damage and one-hit drone',()=>{
 const rear=contact();swing(rear.s,rear.l);assert.equal(rear.g.hp,0);
 const front=contact('heavy',true);swing(front.s,front.l);assert.equal(front.g.hp,150);assert.equal(front.s.combat!.melee!.blocks,1);assert.equal(front.s.combat!.order,null);
 const heavy=contact('heavy');swing(heavy.s,heavy.l);assert.equal(heavy.g.hp,75);
 const drone=contact('drone');drone.g.heist={role:'patrol',charge:12,broadcastUntil:0,cooldownUntil:0,arrivalUntil:0,heardGrate:0,armorHit:'none'};swing(drone.s,drone.l);assert.equal(drone.g.hp,0);assert.equal(drone.g.heist!.charge,0);
});
test('mid-swing serialization continues identically; revision 14 still fires',()=>{
 const {s}=contact();step(s,idleInput());const copy=JSON.parse(JSON.stringify(s));tick(s,35);tick(copy,35);assert.deepEqual(JSON.parse(JSON.stringify(s)),copy);
 const l=arena();l.combat={version:2,revision:14};const old=initialState(l.mission,l);step(old,{...idleInput(),command:combatTap(old,8,10,1)});tick(old,100);assert(old.combat!.shots>0);assert.equal(old.combat!.melee,undefined);
});

test('repeated taps on an unreachable enemy reuse the failed route cooldown',()=>{
 const l=arena();l.blockers.push({x:5,y:0,w:1,h:20,kind:'wall'});const s=initialState(l.mission,l);
 step(s,{...idleInput(),command:combatTap(s,8,10,1)});const next=s.combat!.attackPlan!.nextTick;
 for(let i=2;i<7;i++){step(s,{...idleInput(),command:combatTap(s,8,10,i)});assert.equal(s.combat!.attackPlan!.nextTick,next);}
 assert.equal(s.combat!.order,null);assert.equal(s.combat!.shots,0);
});

test('optimized contact navigation preserves legacy collision samples across campaign geometry',()=>{
 const l=arena();l.blockers.push({x:4,y:4,w:1,h:9,kind:'wall'},{x:7,y:13,w:3,h:.3,kind:'crate'});const old={...l,combat:{version:2 as const,revision:14 as const}};
 for(let i=0;i<800;i++){const a={x:(i*17%115)/10+.2,y:(i*31%195)/10+.2},b={x:(i*47%115)/10+.2,y:(i*13%195)/10+.2};assert.equal(walkableSegment(a,b,l),walkableSegment(a,b,old));}
});

test('revision 18 catches a moving patrol during the wind-up without teleporting or striking through walls',()=>{
 const l=arena();l.combat={version:2,revision:18};l.patrols[0]!.route=[{x:4,y:10},{x:10,y:10}];l.patrols[0]!.speed=1.6;l.patrols[0]!.pauseSeconds=0;
 const s=initialState(l.mission,l);s.x=s.px=3.12;s.y=s.py=10;s.guards[0]!.angle=0;
 step(s,{...idleInput(),command:combatTap(s,4,10,1)});
 for(let i=0;i<70&&s.guards[0]!.hp>0;i++){const before={x:s.x,y:s.y};step(s,idleInput());assert(Math.hypot(s.x-before.x,s.y-before.y)<=4.1/30+.0001);assert(walkableSegment(before,s,l));}
 assert(s.combat!.melee!.hits>0);assert.equal(s.guards[0]!.hp,0);assert(s.combat!.melee!.swings<=2);
});
