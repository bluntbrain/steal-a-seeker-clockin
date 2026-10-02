import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {combatTap} from '../src/game/combat';
import type {Point} from '../src/game/level';

test('level nine vault cannot be bypassed, while the central switch remains reachable',()=>{
 const l=combatLevel('power-trade'),s=initialState(l.mission,l),closed={...l,blockers:s.blockers};
 assert(findPath(l.spawn,l.switches![0]!,closed).length);
 assert.equal(findPath(l.spawn,l.phone,closed).length,0,'Side galleries must not bypass the locked vault');
 assert(findPath(l.spawn,l.phone,l).length,'Opening the gate must connect the vault');
 for(const [x1,x2,y] of [[1.1,4,7.3],[1.1,4,10],[7.7,10.75,4.6],[7.7,10.75,15.75]] as const)
  assert(walkableSegment({x:x1,y},{x:x2,y},l),'Side opening must fit the courier');
 const quiet={...l,blockers:[...l.blockers,...l.encounter!.grates]};
 assert(findPath(l.switches![0]!,l.phone,quiet).length);
 assert(findPath(l.phone,l.spawn,quiet).length);
});
test('level nine normal taps activate the switch, recover the phone and extract in an enemy-free objective fixture',()=>{
 const l={...combatLevel('power-trade'),patrols:[]},s=initialState(l.mission,l);let seq=0;
 const travel=(p:Point,done:()=>boolean)=>{
  step(s,{...idleInput(),command:combatTap(s,p.x,p.y,++seq)});
  for(let i=0;i<2400&&!done()&&s.status==='playing';i++)step(s,idleInput());
  assert(done(),'Objective should complete through ordinary movement and interaction');
 };
 travel(l.switches![0]!,()=>s.power===1);assert.equal(s.activations,1);step(s,idleInput());assert.equal(s.closedGates[0],false);
 travel(l.phone,()=>s.carrying);travel(l.spawn,()=>s.status==='won');assert.equal(s.delivered,1);
});
test('level nine lower cover protects the initial five-second observation period',()=>{
 const l=combatLevel('power-trade'),s=initialState(l.mission,l);
 for(let i=0;i<150;i++)step(s,idleInput());
 assert.equal(s.status,'playing');assert.equal(s.combat!.hp,100);
});
