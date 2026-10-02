import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';

test('level six connects the lower room, cargo yard and offset upper openings',()=>{
 const l=combatLevel('narrow-crossing');
 for(const [a,b] of [[{x:5.6,y:15.8},{x:5.6,y:13.7}],[{x:7.45,y:6.7},{x:7.45,y:4.25}],[{x:2.35,y:4.1},{x:2.35,y:1.25}]])assert(walkableSegment(a!,b!,l),JSON.stringify([a,b]));
 for(const p of [l.phone,{x:1.45,y:18.5},{x:10.65,y:12.55},{x:7.3,y:1.65},...l.encounter!.pockets])assert(findPath(l.spawn,p,l).length,`Unreachable: ${JSON.stringify(p)}`);
 assert(findPath(l.phone,l.spawn,l).length);
 assert(!walkableSegment({x:5,y:18.7},{x:5,y:15.6},l),'Lower barrier forces a flank');
});
test('level six provides connected flanks around both heavies and eight total enemies',()=>{
 const l=combatLevel('narrow-crossing');assert.equal(l.patrols.length,8);
 assert.equal(l.patrols.filter(g=>g.combatRole==='heavy').length,2);
 assert.equal(l.patrols.filter(g=>g.combatRole==='drone').length,1);
 assert.equal(l.patrols.filter(g=>g.reserveAfter!==undefined).length,1);
 for(const g of l.patrols)for(const p of g.roam??g.route)assert(findPath(l.spawn,p,l).length);
 for(const p of [{x:6.7,y:10.2},{x:8.5,y:8.6},{x:5.9,y:4.4},{x:7.4,y:4.4}])assert(findPath(l.spawn,p,l).length);
});
test('level six opening gives the player time to read the room',()=>{
 const l=combatLevel('narrow-crossing'),s=initialState(l.mission,l);
 for(let i=0;i<150;i++)step(s,idleInput());
 assert.equal(s.status,'playing');assert.equal(s.combat!.hp,100);
});
