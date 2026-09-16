import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS,type LevelDefinition,type Point} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {intersectsBox} from '../src/game/geometry';
import {initialState} from '../src/game/simulation';
const levels=CAMPAIGN_IDS.map(combatLevel),before:LevelDefinition[]=JSON.parse(readFileSync('verification/corridors/before-levels.json','utf8'));
const area=(l:LevelDefinition)=>{let blocked=0,total=0;for(let y=1;y<19;y+=.25)for(let x=1;x<11;x+=.25){total++;if(l.blockers.slice(4).some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h))blocked++;}return Math.round(blocked/total*1000)/10;};
const length=(from:Point,to:Point,l:LevelDefinition)=>{let p=from,d=0;const path=findPath(from,to,l);assert(path.length,`${l.title}: unreachable ${JSON.stringify(to)}`);for(const next of path){d+=Math.hypot(p.x-next.x,p.y-next.y);p=next;}return Math.round(d*10)/10;};
const results=levels.map((l,i)=>{
 assert(l.blockers.every(b=>b.x>=0&&b.y>=0&&b.x+b.w<=12.001&&b.y+b.h<=20.001));
 const e={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};
 for(const p of [l.spawn,e,...(l.targets??[l.phone]),...(l.switches??[])])assert(!l.blockers.some(b=>intersectsBox(p.x,p.y,b,.32)),`${l.title}: objective inside cover`);
 for(const g of l.patrols)for(let j=0;j<g.route.length;j++){assert(walkableSegment(g.route[j]!,g.route[(j+1)%g.route.length]!,l),`${l.title}: patrol crosses a wall`);length(l.spawn,g.route[j]!,l);}
 const routes=(l.targets??[l.phone]).map(p=>({out:length(l.spawn,p,l),back:length(p,e,l)}));
 if(l.switches?.length){const closed={...l,blockers:initialState(l.mission,l).blockers};length(l.spawn,l.switches[0]!,closed);assert.equal(findPath(l.spawn,l.phone,closed).length,0,'Vault must actually be sealed until the switch opens it');}
 const result={mission:l.mission,title:l.title,beforeBlockedPercent:area(before[i]!),blockedPercent:area(l),solidPieces:l.blockers.length-4,routes};
 if(i>0)assert(result.blockedPercent>=25,`${l.title}: density regressed`);
 console.log(result.title,result.blockedPercent+'%',JSON.stringify(routes));return result;
});
assert.equal(new Set(levels.map(l=>JSON.stringify(l.blockers))).size,12);
mkdirSync('verification/corridors',{recursive:true});writeFileSync('verification/corridors/geometry.json',JSON.stringify(results,null,2)+'\n');writeFileSync('verification/corridors/levels.json',JSON.stringify(levels));
