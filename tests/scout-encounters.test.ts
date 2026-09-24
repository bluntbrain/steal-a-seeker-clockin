import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS,type LevelDefinition} from '../src/game/level';
import {legacyCombatLevel as combatLevel,SCOUT_ENCOUNTER_POCKETS} from '../src/game/combat-levels';
import {initialState,idleInput,step} from '../src/game/simulation';
import {findPath,walkableSegment} from '../src/game/navigation';
import {sees} from '../src/game/guards';
import {combatTap} from '../src/game/combat';
function arena(revision:6|7=7):LevelDefinition{
 const l=combatLevel('cone-lesson');
 return {...l,combat:{version:2,revision},spawn:{x:4,y:9},blockers:l.blockers.slice(0,4),patrols:[
  {...l.patrols[0]!,route:[{x:4,y:6},{x:4,y:10}],speed:.5,pauseSeconds:0,range:3.5},
  {...l.patrols[1]!,route:[{x:6,y:6},{x:6,y:5}],range:.2,speed:0},
  {...l.patrols[1]!,route:[{x:10,y:2},{x:10,y:1}],range:.2,speed:0},
 ]};
}
test('new scout drones move, can be defeated in one shot, and never fire',()=>{
 const l=arena(),s=initialState(l.mission,l);for(let i=0;i<10;i++)step(s,idleInput());
 assert(s.guards[0]!.y>6);assert.equal(s.guards[0]!.hp,25);assert.equal(s.combat!.enemyShots,0);
 const g=s.guards[0]!;step(s,{...idleInput(),command:combatTap(s,g.x,g.y,1)});
 for(let i=0;i<20;i++)step(s,idleInput());assert.equal(g.hp,0);assert.equal(s.combat!.shots,1);
 const old=arena(6),o=initialState(old.mission,old);for(let i=0;i<30;i++)step(o,idleInput());assert.equal(o.guards[0]!.y,6);assert.equal(o.guards[0]!.seesPlayer,false);
});
test('scout reports need sustained sight and only alert nearby guards',()=>{
 const l=arena(),s=initialState(l.mission,l);for(let i=0;i<8;i++)step(s,idleInput());
 assert.equal(s.guards[1]!.alerted,false);
 for(let i=0;i<30;i++)step(s,idleInput());
 assert.equal(s.guards[1]!.alerted,true);assert.equal(s.guards[2]!.alerted,false);assert.equal(s.securityAlarm,false);
 const wall=arena();wall.blockers.push({x:3,y:7,w:2,h:.5,kind:'wall'});const w=initialState(wall.mission,wall);
 for(let i=0;i<60;i++)step(w,idleInput());assert.equal(w.guards[1]!.alerted,false);assert.equal(w.guards[0]!.exposure,0);
});
test('levels 2–6 have moving drones, traversable patrol loops and screened regroup pockets',()=>{
 for(let n=2;n<=6;n++){
  const l=combatLevel(CAMPAIGN_IDS[n-1]!);assert.equal(l.patrols.filter(g=>g.combatRole==='drone').length,n<4?1:2);
  for(const g of l.patrols)for(let i=0;i<g.route.length;i++)assert(walkableSegment(g.route[i]!,g.route[(i+1)%g.route.length]!,l),`Level ${n}: blocked patrol leg ${i}`);
  for(const raw of SCOUT_ENCOUNTER_POCKETS){const p={x:n===3||n===5?12-raw.x:raw.x,y:raw.y};assert(findPath(l.spawn,p,l).length);
   const s=initialState(l.mission,l);s.x=p.x;s.y=p.y;
   for(let t=0;t<900;t++){step(s,idleInput());assert(!s.guards.some(g=>g.active&&sees(g,p.x,p.y,l)),`Level ${n}: pocket exposed at ${t}`);}
  }
 }
});
