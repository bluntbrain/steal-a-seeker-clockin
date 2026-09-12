import {initialState,idleInput} from '../../src/game/simulation';
import {recordStep} from '../../src/game/recording';
import type {MissionId} from '../../src/game/level';
import type {Replay,ReplayChunk} from '../../shared/replay';
import routes from '../../verification/campaign-routes.json';
export function fixtureReplay(mission:MissionId='practice'){
 const state=initialState(mission),chunks:ReplayChunk[]=[],route=routes.routes.find(r=>r.mission===mission)!;
 const tick=(x=0,y=0,interact=false,tool=state.toolSeen)=>recordStep(state,{...idleInput(),x,y,interact,tool,dash:state.dashSeen},chunks);
 for(let n=0;n<route.delayTicks;n++)tick();
 for(const leg of route.legs){for(let n=0;n<leg.waitTicks;n++)tick();if(leg.decoyDirection>=0){const [x,y]=[[0,1],[-1,0],[0,-1],[1,0]][leg.decoyDirection]!;tick(x!,y!,false,state.toolSeen+1);for(let n=0;n<4;n++)tick();}for(const p of leg.points){let n=0;while(Math.hypot(p.x-state.x,p.y-state.y)>.08&&state.status==='playing'&&n++<600){const dx=p.x-state.x,dy=p.y-state.y,d=Math.hypot(dx,dy);tick(dx/d*Math.min(1,d*4),dy/d*Math.min(1,d*4));}for(let j=0;j<4;j++)tick();}for(let n=0;n<(leg.action==='deliver'?35:16);n++)tick(0,0,leg.action!=='deliver');if(leg.action!=='deliver')for(let n=0;n<4;n++)tick();}
 return {state,replay:{version:1,chunks} as Replay};
}
