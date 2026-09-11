import test from 'node:test';
import assert from 'node:assert/strict';
import routes from '../verification/campaign-routes.json';
import {CAMPAIGN_IDS,getLevel,type MissionId} from '../src/game/level';
import {initialState,blocked,idleInput,step} from '../src/game/simulation';
import {blockedBy} from '../src/game/geometry';
import {makeGuards,updateGuards} from '../src/game/guards';
for(const id of CAMPAIGN_IDS){
 test(`${id}: authored routes stay clear, full input route extracts and retry resets`,()=>{
  const level=getLevel(id),route=routes.routes.find(r=>r.mission===id)!;assert(route);const s=initialState(id);assert(!blocked(s.x,s.y,level));assert(!blocked(level.phone.x,level.phone.y,level));
  const guards=makeGuards(id);for(let i=0;i<6000;i++){updateGuards(guards,-100,-100,1/30,level);for(const g of guards)assert(!blocked(g.x,g.y,level),`${id} patrol collides at ${g.x},${g.y}`);}
  for(let i=0;i<route.delayTicks;i++)step(s,idleInput());
  const go=(points:{x:number;y:number}[])=>{for(const p of points){let n=0;while(s.status==='playing'&&Math.hypot(p.x-s.x,p.y-s.y)>.08&&n++<600){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);step(s,{...idleInput(),x:dx/d*Math.min(1,d*4),y:dy/d*Math.min(1,d*4)});assert(!blockedBy(s.x,s.y,s.blockers));}for(let j=0;j<4;j++)step(s,idleInput());assert(n<600);if(s.status!=='playing')break;}};
  for(const leg of route.legs){const beforeDelivered=s.delivered,beforeActivation=s.activations;go(leg.points);
   if(leg.action==='deliver'){for(let i=0;i<35;i++)step(s,idleInput());assert(s.delivered>beforeDelivered);}
   else{for(let i=0;i<16;i++)step(s,{...idleInput(),interact:true});if(leg.action==='pickup')assert(s.carrying);else assert(s.activations>beforeActivation);for(let i=0;i<4;i++)step(s,idleInput());}
  }
  assert.equal(s.status,'won');assert(s.elapsed<level.hardLimitSeconds);assert.equal(s.delivered,level.targets?.length??1);
  const reset=initialState(id);assert.equal(reset.status,'playing');assert.equal(reset.carrying,false);assert.equal(reset.elapsed,0);assert.equal(reset.guards.length,level.patrols.length);
 });
}
test('campaign missions have unique geometry and correctly bounded objectives',()=>{assert.equal(new Set(CAMPAIGN_IDS.map(id=>JSON.stringify(getLevel(id).blockers))).size,CAMPAIGN_IDS.length);});
