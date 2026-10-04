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
