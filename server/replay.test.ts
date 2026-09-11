import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,step,idleInput} from '../src/game/simulation';
import {appendReplay,quantizeAxis,type ReplayChunk} from '../shared/replay';
import {verifyReplay} from './replay';
import routes from '../verification/campaign-routes.json';
function successfulReplay(){const state=initialState(),chunks:ReplayChunk[]=[];
 const tick=(x=0,y=0,buttons=0)=>{if(state.status!=='playing')return;const qx=quantizeAxis(x),qy=quantizeAxis(y);appendReplay(chunks,qx,qy,buttons);step(state,{...idleInput(),x:qx/127,y:qy/127,interact:!!buttons});};
 const route=routes.routes.find(r=>r.mission==='practice')!;
 for(const leg of route.legs){for(const p of leg.points){let n=0;while(Math.hypot(p.x-state.x,p.y-state.y)>.08&&state.status==='playing'&&n++<600){const dx=p.x-state.x,dy=p.y-state.y,d=Math.hypot(dx,dy);tick(dx/d*Math.min(1,d*4),dy/d*Math.min(1,d*4));}for(let i=0;i<4;i++)tick();}for(let i=0;i<(leg.action==='pickup'?16:35);i++)tick(0,0,leg.action==='pickup'?1:0);}
 assert.equal(state.status,'won');return {state,replay:{version:1,chunks}};
}
test('quantized input replay reproduces completion and computed score without a client score field',()=>{
 const {state,replay}=successfulReplay(),result=verifyReplay('practice',replay);assert.equal(result.status,'won');assert.equal(result.score,state.score);assert.equal(result.ticks,state.ticks);assert.equal(result.battery,state.battery);assert.equal(result.delivered,1);
 assert.throws(()=>verifyReplay('practice',{...replay,score:999999}));
 const altered=structuredClone(replay);for(const c of altered.chunks)c.buttons=0;assert.notEqual(verifyReplay('practice',altered).status,'won');
});
test('verifier rejects impossible inputs, oversized runs, repeated edges and post-completion ticks',()=>{
 const valid={version:1,chunks:[{x:0,y:0,buttons:0,ticks:1}]};assert.equal(verifyReplay('practice',valid).status,'incomplete');
 for(const c of [{x:128,y:0,buttons:0,ticks:1},{x:0,y:0,buttons:8,ticks:1},{x:0,y:0,buttons:2,ticks:2},{x:0,y:0,buttons:0,ticks:14400},{x:NaN,y:0,buttons:0,ticks:1}])assert.throws(()=>verifyReplay('practice',{version:1,chunks:[c]}));
 const {replay}=successfulReplay();replay.chunks.push({x:0,y:0,buttons:0,ticks:1});assert.throws(()=>verifyReplay('practice',replay),/terminal/);
});
