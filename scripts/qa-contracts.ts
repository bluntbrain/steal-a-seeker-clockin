import {makeContracts,type Contract} from '../shared/contracts';
import {initialState,idleInput,targetPhone,inExit} from '../src/game/simulation';
import {findPath} from '../src/game/navigation';
import {recordStep} from '../src/game/recording';
import type {ReplayChunk} from '../shared/replay';
import {writeFileSync,mkdirSync} from 'node:fs';
export function solveContract(c:Contract){
 for(let strategy=0;strategy<4;strategy++)for(let delay=0;delay<600;delay+=30){
  const s=initialState(c.level.mission,c.level),chunks:ReplayChunk[]=[];
  const tick=(x=0,y=0,interact=false,dash=s.dashSeen,tool=s.toolSeen)=>recordStep(s,{...idleInput(),x,y,interact,dash,tool},chunks);
  for(let i=0;i<delay&&s.status==='playing';i++)tick();
  function go(goal:{x:number;y:number}){const path=findPath(s,goal,c.level);if(!path.length)return;for(const p of path){let count=0;while(s.status==='playing'&&Math.hypot(s.x-p.x,s.y-p.y)>.10&&count++<900){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy),near=s.guards.some(g=>Math.hypot(g.x-s.x,g.y-s.y)<3);tick(dx/d*Math.min(1,d*3),dy/d*Math.min(1,d*3),false,s.dashSeen+(s.carrying&&near&&s.cooldown<=0&&s.battery>=20?1:0));}for(let n=0;n<6&&s.status==='playing';n++)tick();}}
  for(let delivery=0;delivery<(c.level.targets?.length??1)&&s.status==='playing';delivery++){
   const phone=targetPhone(s);if(strategy){const lane=strategy===1?1.1:10.9;go({x:lane,y:s.y});go({x:lane,y:phone.y});}go(phone);for(let n=0;n<20&&s.status==='playing'&&!s.carrying;n++)tick(0,0,true);
   if(!s.carrying)break;
   const exit={x:c.level.exit.x+c.level.exit.w/2,y:c.level.exit.y+c.level.exit.h/2};if(strategy>=2){const lane=strategy===2?1.1:10.9;go({x:lane,y:s.y});go({x:lane,y:exit.y});}go(exit);for(let n=0;n<300&&s.status==='playing'&&s.carrying&&inExit(s);n++)tick();
  }
  if(s.status==='won')return {contract:c.id,delay,ticks:s.ticks,score:s.score,replay:{version:1 as const,chunks}};
 }
 return null;
}
if(process.argv[1]?.endsWith('qa-contracts.ts')){const results=makeContracts().map(c=>{const win=solveContract(c);console.log(c.name,win?`WON ${win.ticks} ticks`:'NO ROUTE FOUND');return win;});mkdirSync('verification/contracts',{recursive:true});writeFileSync('verification/contracts/current-replays.json',JSON.stringify(results));if(results.some(r=>!r))process.exitCode=1;}
