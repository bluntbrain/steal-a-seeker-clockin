import test from 'node:test';import assert from 'node:assert/strict';
import {initialState} from '../src/game/simulation';
import {combatLevel} from '../src/game/combat-levels';
import {makeCampaignRecipe,buildCampaignLevel} from '../shared/campaign-levels';
import {observe,options,exposed} from '../src/playtest/jev-pilot';
import {walkableSegment} from '../src/game/navigation';
const camera={x:0,y:0,zoom:1};
test('the observation carries public facts only and the options are moves a finger could make',()=>{
 for(const level of [combatLevel('practice'),buildCampaignLevel(makeCampaignRecipe(101,0))]){
  const s=initialState(level.mission,level),o=observe(s,level,camera,null);
  assert.equal(o.courier.x,Math.round(s.x*10)/10);assert(o.guards.length>0);
  for(const g of o.guards){assert(!('brain' in g)&&!('path' in g)&&!('lastSeen' in g),'hidden guard fields never leave the game');assert(typeof g.facing_deg==='number'&&typeof g.cone_range==='number');}
  const moves=options(s,level);assert(moves.length>=3,'walks, the objective or waiting');
  for(const m of moves){if(m.tap&&m.key.startsWith('walk'))assert(walkableSegment({x:s.x,y:s.y},m.tap,level),`${m.key} is walkable`);assert(m.text.length<240,'one line per option');}
  assert(moves.some(m=>m.key==='follow_route'),'a goal directed leg is always offered when a route exists');
  assert.equal(moves.some(m=>m.key==='wait'),s.guards.some(g=>g.active&&g.spawned&&Math.hypot(g.x-s.x,g.y-s.y)<=4),'waiting is offered only with a patrol nearby');
 }
});
test('a point inside a cone is exposed and spotted play removes exposed walks and waiting',()=>{
 const level=combatLevel('practice'),s=initialState(level.mission,level),g=s.guards[0]!;
 const ahead={x:g.x+Math.cos(g.angle)*Math.min(1,g.range-.1),y:g.y+Math.sin(g.angle)*Math.min(1,g.range-.1)};
 assert.equal(exposed(ahead,s,level),true);assert.equal(exposed({x:g.x-Math.cos(g.angle)*2,y:g.y-Math.sin(g.angle)*2},s,level),false);
 // a wall between the guard and the point blocks sight, exactly as in the game
 const wall={x:Math.min(g.x,ahead.x)-.05,y:Math.min(g.y,ahead.y)-.05,w:Math.abs(ahead.x-g.x)+.1,h:Math.abs(ahead.y-g.y)+.1,kind:'wall' as const};const mid={...s,blockers:[...s.blockers,{...wall,x:(g.x+ahead.x)/2-.1,y:(g.y+ahead.y)/2-.1,w:.2,h:.2}]};assert.equal(exposed(ahead,mid,level),false,'walls block sight');
 g.seesPlayer=true;const moves=options(s,level);
 assert(!moves.some(m=>m.key==='wait'),'no waiting while spotted');
 for(const m of moves)if(m.key.startsWith('walk'))assert.equal(m.meta.exposed,false,`${m.key} leaves every cone`);
});
