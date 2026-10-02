import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCombatContracts,CONTRACT_ID_MAX} from '../shared/contracts';
import {makeReleaseContracts} from '../shared/weekly-melee';
import {wallSignature,WEEKLY_VARIETY_START} from '../shared/weekly-variety';
import {WEEKLY_LAYOUTS} from '../shared/weekly-layouts';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,idleInput,step} from '../src/game/simulation';
import {previewWeek} from '../src/league/local';
const start=Date.parse(WEEKLY_VARIETY_START),week=(n:number)=>new Date(start+n*604800000);
test('52 weekly packs: real geometry variation, no family repeat for four weeks, deterministic fair packs',()=>{
 const history:string[][]=[],used=new Set<string>(),mixes=new Set<string>(),counts=[new Set<number>(),new Set<number>(),new Set<number>()];
 for(let n=0;n<52;n++){
  const pack=makeCombatContracts(week(n));assert.deepEqual(pack,makeCombatContracts(new Date(+week(n)+604799999)));assert.equal(pack.length,3);assert.equal(new Set(pack.map(c=>wallSignature(c.level))).size,3);
  const ids=pack.map(c=>c.generation!.template),recent=new Set(history.slice(-4).flat());for(const id of ids){assert(!recent.has(id),`${n}: repeated ${id}`);used.add(id);}history.push(ids);
  for(const c of pack){const g=c.generation!;const budget=3+c.slot-(c.slot>0&&c.modifier==='Double haul'?1:0);assert(g.activeEnemies>=budget&&g.activeEnemies<=budget+1);assert(g.drones>=1&&g.drones<=2);assert.equal(g.reinforcements,c.slot===2?2:1);counts[c.slot]!.add(g.activeEnemies);mixes.add([g.activeEnemies,g.drones,g.heavies].join(':'));assert(c.id.length<=32);assert.equal(c.level.combat?.revision,13);assert.equal(c.level.patrols.filter(p=>p.reserveAfter===undefined).length,g.activeEnemies);assert.equal(c.level.patrols.filter(p=>p.combatRole==='drone').length,g.drones);assert.equal(c.level.patrols.filter(p=>p.reserveAfter===undefined&&p.combatRole==='heavy').length,g.heavies);}
 }
 assert.equal(used.size,WEEKLY_LAYOUTS.length);assert(mixes.size>=8);for(const c of counts)assert(c.size>=2);
});
test('52 weeks: reachable objectives, collision-safe patrols, distinct starts and a safe opening',()=>{
 for(let n=0;n<52;n++)for(const c of makeCombatContracts(week(n))){
  const l=c.level,exit={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};
  assert(walkableSegment(l.spawn,l.spawn,l),c.id);for(const target of l.targets??[l.phone]){assert(findPath(l.spawn,target,l).length,c.id+' phone');assert(findPath(target,exit,l).length,c.id+' exit');}
  if(l.targets)assert.notDeepEqual(l.targets[0],l.targets[1]);
  const active=l.patrols.filter(p=>p.reserveAfter===undefined);for(let i=0;i<active.length;i++){const p=active[i]!.route[0]!;assert(Math.hypot(p.x-l.spawn.x,p.y-l.spawn.y)>=6);for(const guard of active.slice(i+1)){const q=guard.route[0]!;assert(Math.hypot(p.x-q.x,p.y-q.y)>=2.6);}}
  for(const guard of l.patrols){for(const p of [...guard.route,...guard.roam??[]]){assert(walkableSegment(p,p,l),c.id+' guard in wall');assert(findPath(l.spawn,p,l).length,c.id+' inaccessible guard');}assert(walkableSegment(guard.route[0]!,guard.route[1]!,l),c.id+' blocked patrol');}
  const s=initialState(l.mission,l);for(let f=0;f<60;f++)step(s,idleInput());assert.equal(s.combat!.hp,100,c.id+' unfair opening');
 }
});
test('cutover leaves historical combat definitions on revision 6',()=>{
 for(const date of ['2026-09-14','2026-09-21','2026-09-27T23:59:59Z'])for(const c of makeCombatContracts(new Date(date))){assert.equal(c.generation,undefined);assert.equal(c.level.combat?.revision,6);}
 assert(makeCombatContracts(week(0)).every(c=>c.generation?.version===3));
});
test('future browser preview is localhost-only and rejects malformed or non-Monday dates',()=>{
 assert.equal(previewWeek('http://127.0.0.1:8788/?weeklyPreview=2026-09-28'),'2026-09-28');assert.equal(previewWeek('http://localhost/?weeklyPreview=2026-09-28'),'2026-09-28');
 for(const url of ['https://example.com/?weeklyPreview=2026-09-28','http://localhost/?weeklyPreview=2026-09-29','http://localhost/?weeklyPreview=2026-02-30','http://localhost/?weeklyPreview=2026-09-21','http://localhost/?weeklyPreview=9999-01-01','http://localhost/'])assert.equal(previewWeek(url),null);
});

test('release contract ids, including knife weeks, fit the league start route limit',()=>{
 const monday=week(60),iso=monday.toISOString().slice(0,10);
 assert.deepEqual(makeReleaseContracts(monday),makeCombatContracts(monday));
 const knife=makeReleaseContracts(monday,iso);
 assert.equal(knife.length,3);
 for(const c of knife){assert.ok(c.id.endsWith(':knife-v16'));assert.ok(c.id.length<=CONTRACT_ID_MAX,`${c.id} is ${c.id.length} characters`);assert.equal(c.level.combat?.revision,16);}
});
