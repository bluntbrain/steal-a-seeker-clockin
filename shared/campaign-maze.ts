// seeded maze rooms for published campaign levels (recipe version 3). the room is a 5 by 7 lattice whose
// corridors are 1.2 wide and centred on the guard node grid (x=1.5+2c, y=4+2r); walls between them are 0.8
// thick. a perfect maze is carved, then braided so loops exist, a few dead ends stay as hiding pockets, and
// one or two 2 by 2 cells open into a yard with a crate in the middle. everything derives from the seed.
import type {Box} from '../src/game/level';
import {seededRandom} from './campaign-levels';
export type MazeParams={braid:number;pockets:number;yards:number;maxRun:number};
export type MazeMetrics={coverage:number;longestRun:number;corners:number;pockets:number;sub:number};
const COLS=5,ROWS=7,PITCH=2,CORRIDOR=1.2,X0=.9,Y0=3.4,TOP_BAND:[number,number]=[2.6,3.4],BOTTOM_BAND:[number,number]=[16.6,17.3];
const cellX=(c:number)=>X0+c*PITCH,cellY=(r:number)=>Y0+r*PITCH;
type Grid={h:boolean[][];v:boolean[][];pillar:boolean[][]};
const grid=():Grid=>({h:Array.from({length:COLS-1},()=>Array(ROWS).fill(false)),v:Array.from({length:COLS},()=>Array(ROWS-1).fill(false)),pillar:Array.from({length:COLS-1},()=>Array(ROWS-1).fill(false))});
function neighbours(c:number,r:number){const out:[number,number][]=[];if(c>0)out.push([c-1,r]);if(c<COLS-1)out.push([c+1,r]);if(r>0)out.push([c,r-1]);if(r<ROWS-1)out.push([c,r+1]);return out;}
function isOpen(g:Grid,a:[number,number],b:[number,number]){const [c,r]=a,[c2,r2]=b;if(r===r2)return g.h[Math.min(c,c2)]![r]!;return g.v[c]![Math.min(r,r2)]!;}
function open(g:Grid,a:[number,number],b:[number,number],value=true){const [c,r]=a,[c2,r2]=b;if(r===r2)g.h[Math.min(c,c2)]![r]=value;else g.v[c]![Math.min(r,r2)]=value;}
function degree(g:Grid,c:number,r:number){return neighbours(c,r).filter(n=>isOpen(g,[c,r],n)).length;}
function shuffle<T>(items:T[],next:()=>number){for(let i=items.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[items[i],items[j]]=[items[j]!,items[i]!];}return items;}
function carve(next:()=>number,p:MazeParams){
 const g=grid(),seen=Array.from({length:COLS},()=>Array(ROWS).fill(false));
 // depth first walk from a seeded start cell gives a perfect maze: every cell reachable, no loops yet
 const stack:[number,number][]=[[Math.floor(next()*COLS),Math.floor(next()*ROWS)]];seen[stack[0]![0]]![stack[0]![1]]=true;
 while(stack.length){const cur=stack[stack.length-1]!;const fresh=shuffle(neighbours(cur[0],cur[1]).filter(([c,r])=>!seen[c]![r]),next);if(!fresh.length){stack.pop();continue;}
  // prefer a turn once a straight corridor would exceed the run limit, so sightlines stay short
  const n=fresh.find(cell=>runIfOpened(g,cur,cell)<=p.maxRun)??fresh[0]!;open(g,cur,n);seen[n[0]]![n[1]]=true;stack.push(n);}
 // yards: a 2 by 2 block loses its inner walls and pillar; the crate placed there is the only cover inside
 const yards:[number,number][]=[];
 for(let tries=0;tries<20&&yards.length<p.yards;tries++){const c=Math.floor(next()*(COLS-1)),r=1+Math.floor(next()*(ROWS-3));if(yards.some(([yc,yr])=>Math.abs(yc-c)<2&&Math.abs(yr-r)<2))continue;yards.push([c,r]);open(g,[c,r],[c+1,r]);open(g,[c,r+1],[c+1,r+1]);open(g,[c,r],[c,r+1]);open(g,[c+1,r],[c+1,r+1]);g.pillar[c]![r]=true;}
 // braid: open a wall at most dead ends so patrol loops and escape routes exist; the rest stay as pockets
 const ends=shuffle([...Array(COLS).keys()].flatMap(c=>[...Array(ROWS).keys()].map(r=>[c,r] as [number,number])).filter(([c,r])=>degree(g,c,r)===1),next);
 const keep=Math.min(ends.length,p.pockets),toOpen=ends.slice(keep).filter(()=>next()<p.braid+.3);
 for(const cell of toOpen){const closed=shuffle(neighbours(cell[0],cell[1]).filter(n=>!isOpen(g,cell,n)&&runIfOpened(g,cell,n)<=p.maxRun),next);if(closed.length)open(g,cell,closed[0]!);}
 return {g,yards};
}
/** cells in the straight corridor that would contain the passage a to b once it is open */
function runIfOpened(g:Grid,a:[number,number],b:[number,number]){
 const dc=Math.sign(b[0]-a[0]),dr=Math.sign(b[1]-a[1]);let n=2;
 for(const [from,dir] of [[a,-1],[b,1]] as const){let cur:[number,number]=from;while(true){const nx:[number,number]=[cur[0]+dc*dir,cur[1]+dr*dir];if(nx[0]<0||nx[0]>=COLS||nx[1]<0||nx[1]>=ROWS||!isOpen(g,cur,nx))break;n++;cur=nx;}}
 return n;
}
function longestRun(g:Grid){let best=1;for(let c=0;c<COLS;c++){let run=1;for(let r=0;r<ROWS-1;r++){run=g.v[c]![r]?run+1:1;best=Math.max(best,run);}}for(let r=0;r<ROWS;r++){let run=1;for(let c=0;c<COLS-1;c++){run=g.h[c]![r]?run+1:1;best=Math.max(best,run);}}return best;}
/** rasterise at 0.1 units and merge into the fewest axis aligned boxes, so long walls read as one slab */
function boxesFrom(solid:(x:number,y:number)=>boolean){
 const W=120,H=200,cells=Array.from({length:H},(_,j)=>Array.from({length:W},(_,i)=>solid((i+.5)/10,(j+.5)/10)));
 const used=cells.map(row=>row.map(()=>false)),out:Box[]=[];
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(!cells[j]![i]||used[j]![i])continue;let w=0;while(i+w<W&&cells[j]![i+w]&&!used[j]![i+w])w++;let h=1;outer:while(j+h<H){for(let k=0;k<w;k++)if(!cells[j+h]![i+k]||used[j+h]![i+k])break outer;h++;}for(let y=0;y<h;y++)for(let x=0;x<w;x++)used[j+y]![i+x]=true;out.push({x:+(i/10).toFixed(1),y:+(j/10).toFixed(1),w:+(w/10).toFixed(1),h:+(h/10).toFixed(1),kind:'wall'});}
 return out;
}
function cornersOf(boxes:readonly Box[]){
 // convex corners of the wall union: 2 by 2 windows of the 0.1 raster with exactly one or three wall cells
 const W=120,H=200,cells=Array.from({length:H+2},()=>Array(W+2).fill(false) as boolean[]);
 for(const b of boxes)for(let j=Math.round(b.y*10);j<Math.round((b.y+b.h)*10);j++)for(let i=Math.round(b.x*10);i<Math.round((b.x+b.w)*10);i++)cells[j+1]![i+1]=true;
 let n=0;for(let j=0;j<=H;j++)for(let i=0;i<=W;i++){const k=+cells[j]![i]!+ +cells[j]![i+1]!+ +cells[j+1]![i]!+ +cells[j+1]![i+1]!;if(k===1||k===3)n++;}return n;
}
/** builds the room; tries twelve sub-seeds and keeps the first that meets the run and pocket limits, else the best */
export function carveMaze(seed:string,p:MazeParams):{cover:Box[];metrics:MazeMetrics}{
 let best:{cover:Box[];metrics:MazeMetrics}|undefined;
 for(let sub=0;sub<12;sub++){
  const next=seededRandom(`${seed}:maze:${sub}`),{g,yards}=carve(next,p);
  const run=longestRun(g),pockets=[...Array(COLS).keys()].flatMap(c=>[...Array(ROWS).keys()].map(r=>degree(g,c,r))).filter(d=>d===1).length;
  const entrances={top:[Math.floor(next()*COLS)],bottom:[Math.floor(next()*COLS)]};
  if(next()<.5)entrances.top.push((entrances.top[0]!+2+Math.floor(next()*2))%COLS);
  if(next()<.5)entrances.bottom.push((entrances.bottom[0]!+2+Math.floor(next()*2))%COLS);
  const inCorridorX=(x:number)=>{for(let c=0;c<COLS;c++)if(x>=cellX(c)&&x<cellX(c)+CORRIDOR)return c;return -1;};
  const inCorridorY=(y:number)=>{for(let r=0;r<ROWS;r++)if(y>=cellY(r)&&y<cellY(r)+CORRIDOR)return r;return -1;};
  const solid=(x:number,y:number)=>{
   if(x<.7||x>=11.3||y<.7||y>=19.3)return false; // the boundary is drawn by the level itself
   if(y>=TOP_BAND[0]&&y<TOP_BAND[1]){const c=inCorridorX(x);return !(c>=0&&entrances.top.includes(c));}
   if(y>=BOTTOM_BAND[0]&&y<BOTTOM_BAND[1]){const c=inCorridorX(x);return !(c>=0&&entrances.bottom.includes(c));}
   if(y<TOP_BAND[0]||y>=BOTTOM_BAND[1])return false; // open aprons for the phone and the spawn
   const c=inCorridorX(x),r=inCorridorY(y);
   if(c>=0&&r>=0)return false;
   if(c>=0){ // between rows r and r+1 in column c: open passage or wall
    const below=inCorridorY(y+CORRIDOR);const r0=inCorridorY(y-PITCH+CORRIDOR);
    const rr=below>=0?below-1:r0;return !(rr>=0&&rr<ROWS-1&&g.v[c]![rr]);
   }
   if(r>=0){const right=inCorridorX(x+CORRIDOR);const c0=inCorridorX(x-PITCH+CORRIDOR);const cc=right>=0?right-1:c0;return !(cc>=0&&cc<COLS-1&&g.h[cc]![r]);}
   // pillar between four cells: removed only inside a yard
   const cc=inCorridorX(x+CORRIDOR)-1,rr=inCorridorY(y+CORRIDOR)-1;return !(cc>=0&&rr>=0&&cc<COLS-1&&rr<ROWS-1&&g.pillar[cc]![rr]);
  };
  const cover=boxesFrom(solid);
  for(const [c,r] of yards)cover.push({x:+(cellX(c)+CORRIDOR+.4-.45).toFixed(2),y:+(cellY(r)+CORRIDOR+.4-.45).toFixed(2),w:.9,h:.9,kind:'crate'});
  const area=cover.reduce((a,b)=>a+b.w*b.h,0),metrics:MazeMetrics={coverage:+(area/(10.6*18.6)).toFixed(3),longestRun:run,corners:cornersOf(cover.filter(b=>b.kind==='wall')),pockets,sub};
  const candidate={cover,metrics};
  if(run<=p.maxRun&&pockets>=Math.min(2,p.pockets)&&pockets<=p.pockets+1)return candidate;
  if(!best||run<best.metrics.longestRun)best=candidate;
 }
 return best!;
}
