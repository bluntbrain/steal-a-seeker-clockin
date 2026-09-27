import type {Box} from '../game/level';
export type WallStyle='flat'|'subtle'|'strong';
export function wallStyle(value?:string|null):WallStyle{return value==='flat'||value==='0'?'flat':value==='strong'?'strong':'subtle';}
export function wallHeight(style:WallStyle){return style==='flat'?0:style==='strong'?.48:.30;}
export function interiorWalls(blockers:readonly Box[],width=12,height=20){return blockers.filter(b=>b.kind==='wall'&&b.x>0&&b.y>0&&b.x+b.w<width&&b.y+b.h<height);}
export type WallEdge={x:number;y:number;width:number};
/** Remove shared edges, including partial joins. Only external faces cast a rim. */
export function exposedEdges(walls:readonly Box[],side:'top'|'bottom'):WallEdge[]{
 const out:WallEdge[]=[];const epsilon=.0001;
 for(const b of walls){const y=side==='top'?b.y:b.y+b.h;let spans:[number,number][]=[[b.x,b.x+b.w]];
  for(const other of walls){if(other===b)continue;
   const joins=side==='top'?other.y<y-epsilon&&other.y+other.h>=y-epsilon:other.y<=y+epsilon&&other.y+other.h>y+epsilon;
   if(!joins)continue;
   spans=spans.flatMap(([a,z])=>other.x>=z-epsilon||other.x+other.w<=a+epsilon?[[a,z] as [number,number]]:([[a,Math.min(z,other.x)],[Math.max(a,other.x+other.w),z]] as [number,number][]).filter(([l,r])=>r-l>epsilon));
  }
  for(const [x,end] of spans)out.push({x,y,width:end-x});
 }
 return out;
}
export function depthBandIndex(bottoms:readonly number[],feetY:number){'worklet';let index=0;while(index<bottoms.length&&feetY>=bottoms[index]!)index++;return index;}

// A defined clip is required even for flying actors and legacy walls. An animated
// undefined clip can unbalance Skia's save/restore stack and hide later actors.
const WORLD_CLIP={x:-4,y:-4,width:20,height:28};
export function wallActorClip<T>(occlusion:{bottoms:readonly number[];clips:readonly T[]}|undefined,feetY:number,aboveCover=false){
 'worklet';return !aboveCover&&occlusion?occlusion.clips[depthBandIndex(occlusion.bottoms,feetY)]??WORLD_CLIP:WORLD_CLIP;
}
