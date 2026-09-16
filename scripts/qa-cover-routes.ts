import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {CAMPAIGN_IDS,type LevelDefinition,type Point} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {findPath,walkableSegment} from '../src/game/navigation';
import {intersectsBox} from '../src/game/geometry';

const before:LevelDefinition[]=JSON.parse(readFileSync('verification/cover-v5/before-levels.json','utf8'));
const free=(p:Point,l:LevelDefinition)=>!l.blockers.some(b=>intersectsBox(p.x,p.y,b,.3));
const density=(l:LevelDefinition)=>{let blocked=0,total=0;for(let y=1;y<19;y+=.25)for(let x=1;x<11;x+=.25){total++;if(l.blockers.slice(4).some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h))blocked++;}return Math.round(blocked/total*1000)/10;};
const distance=(from:Point,path:Point[])=>{let p=from,n=0;for(const q of path){n+=Math.hypot(q.x-p.x,q.y-p.y);p=q;}return Math.round(n*10)/10;};
const rows=CAMPAIGN_IDS.map((id,i)=>{
 const l=combatLevel(id),points:Point[]=[];
 for(let y=1.5;y<19;y++)for(let x=1.5;x<11;x++)if(free({x,y},l))points.push({x,y});
 for(const p of points)assert(findPath(l.spawn,p,l).length,`${id}: isolated walkable pocket at ${p.x},${p.y}`);
 const targets=l.targets??[l.phone];
 const detours=targets.map(target=>{
  const path=findPath(l.spawn,target,l),candidates:Point[]=[];let p=l.spawn;
  for(const q of path){if(Math.hypot(q.x-p.x,q.y-p.y)>2)candidates.push({x:(p.x+q.x)/2,y:(p.y+q.y)/2});p=q;}
  const alternatives=[];
  for(const at of candidates){
   if(Math.hypot(at.x-target.x,at.y-target.y)<2||Math.hypot(at.x-l.spawn.x,at.y-l.spawn.y)<2)continue;
   const closed={...l,blockers:[...l.blockers,{x:at.x-.65,y:at.y-.65,w:1.3,h:1.3,kind:'wall' as const}]};
   const route=findPath(l.spawn,target,closed);if(!route.length)continue;
   let prev=l.spawn;for(const q of route){assert(walkableSegment(prev,q,closed));prev=q;}
   alternatives.push({blockedCrossing:at,length:distance(l.spawn,route),path:route});
  }
  if(i>0&&i!==8)assert(alternatives.length,`${id}: no alternative around a blocked crossing`);
  return {target,normalLength:distance(l.spawn,path),alternatives};
 });
 const now=density(l),old=density(before[i]!);
 assert(now>old,`${id}: cover did not increase`);
 const r={mission:id,title:l.title,beforeCoverPercent:old,coverPercent:now,beforePieces:before[i]!.blockers.length-4,pieces:l.blockers.length-4,detours};
 console.log(l.title,`${old}% → ${now}%`,`${r.beforePieces} → ${r.pieces} cover pieces`,detours.map(d=>d.alternatives.length));return r;
});
mkdirSync('verification/cover-v5',{recursive:true});writeFileSync('verification/cover-v5/routes.json',JSON.stringify(rows,null,2)+'\n');
