import test from 'node:test';import assert from 'node:assert/strict';
import bundle from '../src/campaign/published-levels.json';
import {buildCampaignLevel,type CampaignRecipe} from '../shared/campaign-levels';
import {CAMPAIGN_STEALTH_LAYOUTS} from '../shared/campaign-stealth-layouts';
import {findPath,walkableSegment} from '../src/game/navigation';
import type {LevelDefinition} from '../src/game/level';
test('all 88 denser campaign levels regenerate and keep reachable extraction routes and patrols',()=>{
 assert.equal(bundle.levels.length,88);const used=new Set<string>();
 for(const row of bundle.levels){const l=row.definition as LevelDefinition;used.add(row.recipe.template);assert.deepEqual(buildCampaignLevel(row.recipe as CampaignRecipe),l);assert(l.blockers.length>=16);
 const exit={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};
 for(const p of l.targets??[l.phone]){assert(findPath(l.spawn,p,l).length,row.title);assert(findPath(p,exit,l).length,row.title);}
 for(const g of l.patrols)for(const p of g.roam??g.route)assert(walkableSegment(p,p,l),`${row.number}: patrol inside a wall`);
 }
 assert.equal(used.size,CAMPAIGN_STEALTH_LAYOUTS.length);
});
import {makeCampaignRecipe,makeCampaignRecipes} from '../shared/campaign-levels';
import {carveMaze} from '../shared/campaign-maze';
import {BOSS_ARENAS} from '../shared/campaign-arenas';
test('version 3 maze rooms are deterministic, dense, short sighted and reachable',()=>{
 const params={braid:.3,pockets:3,yards:1,maxRun:4};
 assert.deepEqual(carveMaze('campaign-v3:101:0',params),carveMaze('campaign-v3:101:0',params));
 assert.notDeepEqual(carveMaze('campaign-v3:101:0',params).cover,carveMaze('campaign-v3:102:0',params).cover);
 for(let n=101;n<=124;n++){
  if(!makeCampaignRecipe(n).maze)continue;
  let built:LevelDefinition|undefined;for(let salt=0;salt<12&&!built;salt++){try{built=buildCampaignLevel(makeCampaignRecipe(n,salt));}catch{}}
  assert(built,`level ${n} builds within twelve salts`);const l=built;
  const r=makeCampaignRecipe(n),m=carveMaze(r.seed,r.maze!).metrics;
  assert(m.coverage>=.28&&m.coverage<=.45,`${n}: coverage ${m.coverage}`);
  assert(m.longestRun<=5,`${n}: straight run ${m.longestRun}`);
  assert(m.corners>=40,`${n}: corners ${m.corners}`);
  assert(l.blockers.some(b=>b.kind==='crate'),`${n}: a yard crate exists`);
  const exit={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};
  for(const p of l.targets??[l.phone]){assert(findPath(l.spawn,p,l).length,`${n}: phone reachable`);assert(findPath(p,exit,l).length,`${n}: exit reachable`);}
  for(const g of l.patrols){for(const p of g.roam??g.route)assert(walkableSegment(p,p,l),`${n}: patrol inside a wall`);assert(findPath(l.spawn,g.route[0]!,l).length,`${n}: guard at ${g.route[0]!.x},${g.route[0]!.y} is reachable`);}
 }
});
test('boss levels use every arena, hold the boss at the anchor and reach the Seeker through the arena band',()=>{
 const used=new Set<string>();
 for(const r of makeCampaignRecipes(101,160).filter(r=>r.boss)){
  // the salt that builds decides the arena, mirror and flip, so everything is read from that recipe
  let l:LevelDefinition|undefined,built=r;for(let salt=0;salt<12&&!l;salt++){try{built=makeCampaignRecipe(r.number,salt);l=buildCampaignLevel(built);}catch{}}
  assert(l,`${r.number} builds`);const boss=l.patrols.find(g=>g.boss)!;assert(boss,`${r.number}: has a boss`);
  used.add(built.template);const arena=BOSS_ARENAS.find(a=>a.id===built.template)!;assert(arena,`${r.number}: ${built.template} is an arena`);
  const anchor={x:built.mirror?12-arena.anchor.x:arena.anchor.x,y:built.flip?20-arena.anchor.y:arena.anchor.y};
  assert(Math.hypot(boss.route[0]!.x-anchor.x,boss.route[0]!.y-anchor.y)<=2.3,`${r.number}: boss within reach of the anchor`);
  const exit={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};
  assert(findPath(l.spawn,l.phone,l).length&&findPath(l.phone,exit,l).length,`${r.number}: objectives reachable`);
  for(const g of l.patrols)assert(findPath(l.spawn,g.route[0]!,l).length,`${r.number}: guard at ${g.route[0]!.x},${g.route[0]!.y} is reachable`);
 }
 assert.equal(used.size,BOSS_ARENAS.length);
});
