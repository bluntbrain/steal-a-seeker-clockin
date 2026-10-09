import {ClipOp,PathOp,PaintStyle,Skia,TileMode,type SkCanvas,type SkImage,type SkPath} from '@shopify/react-native-skia';
import type {Box} from '../game/level';
import {drawWallPanels} from './walls';
import {exposedEdges,exposedVerticalEdges,wallHeight,wallTopX,wallTopY,wallShadowX,wallShadowY,type WallStyle} from './wall-depth';
export type WallOcclusion={bottoms:number[];clips:SkPath[]};
function polygon(points:number[][]){const path=Skia.Path.Make();points.forEach(([x,y],i)=>i?path.lineTo(x!,y!):path.moveTo(x!,y!));path.close();return path;}
// The room projection is continuous at the centre, including walls crossing it.
function edge(x:number,y:number,end:number,lift:number){const xs=x<6&&end>6?[x,6,end]:[x,end];return xs.map(xx=>[wallTopX(xx,lift),wallTopY(xx,y,lift)]);}
function union(walls:readonly Box[],lift:number,volume=false){
 const path=Skia.Path.Make();
 for(const b of walls){
  const top=edge(b.x,b.y,b.x+b.w,lift),bottom=edge(b.x,b.y+b.h,b.x+b.w,lift);
  path.op(polygon([...top,...[...bottom].reverse()]),PathOp.Union);
  if(volume){
   const base=Skia.Path.Make();base.addRect(Skia.XYWHRect(b.x,b.y,b.w,b.h));path.op(base,PathOp.Union);
   for(const pts of [[...top,[b.x+b.w,b.y],[b.x,b.y]],[...bottom,[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]],[top[0]!,bottom[0]!,[b.x,b.y+b.h],[b.x,b.y]],[top[top.length-1]!,bottom[bottom.length-1]!,[b.x+b.w,b.y+b.h],[b.x+b.w,b.y]]])path.op(polygon(pts),PathOp.Union);
  }
 }return path;
}
/** Once per scene, never a path boolean operation in the animation loop. */
export function makeWallOcclusion(walls:readonly Box[],style:WallStyle):WallOcclusion|undefined{
 const lift=wallHeight(style);if(!lift||!walls.length)return;
 const bottoms=[...new Set(walls.map(b=>b.y+b.h))].sort((a,b)=>a-b);
 const clips=Array.from({length:bottoms.length+1},(_,i)=>{
  const feet=i===0?-Infinity:bottoms[i-1]!;
  const visible=Skia.Path.Make();visible.addRect(Skia.XYWHRect(-4,-4,20,28));
  visible.op(union(walls.filter(b=>b.y+b.h>feet),lift,true),PathOp.Difference);return visible;
 });return {bottoms,clips};
}
export function drawRaisedWalls(c:SkCanvas,walls:readonly Box[],image:SkImage,style:WallStyle,district:string){
 const lift=wallHeight(style);if(!lift||!walls.length)return;
 const p=Skia.Paint();p.setAntiAlias(true);
 const draw=(path:SkPath,color:string)=>{p.setShader(null);p.setStyle(PaintStyle.Fill);p.setColor(Skia.Color(color));c.drawPath(path,p);};
 const tops=union(walls,lift),body=union(walls,lift,true);
 // Visible inward shadows dominate at the room edges; central walls cast downward.
 for(const [spread,alpha] of [[1,'38'],[.5,'52']] as const){
  const shadow=Skia.Path.Make();for(const b of walls){const cx=b.x+b.w/2,dx=wallShadowX(cx)*spread,dy=wallShadowY(cx)*spread;const q=Skia.Path.Make();q.addRRect(Skia.RRectXY(Skia.XYWHRect(b.x+dx-.025,b.y+dy-.025,b.w+.05,b.h+.05),.06,.06));shadow.op(q,PathOp.Union);}draw(shadow,'#03090D'+alpha);
 }
 draw(body,district==='powerworks'?'#262631':'#27312F');
 for(const side of ['left','right'] as const)for(const e of exposedVerticalEdges(walls,side)){
  if(side==='left'?e.x<6:e.x>6)continue;
  const tx=wallTopX(e.x,lift),ty=wallTopY(e.x,e.y,lift);
  draw(polygon([[tx,ty],[tx,ty+e.height],[e.x,e.y+e.height],[e.x,e.y]]),'#3D4948');
  p.setColor(Skia.Color('#151E21'));p.setStrokeWidth(.025);c.drawLine(e.x,e.y,e.x,e.y+e.height,p);
  for(let y=e.y+.16;y<e.y+e.height;y+=.12){p.setColor(Skia.Color('#17232780'));c.drawLine(tx,wallTopY(e.x,y,lift),e.x,y,p);}
 }
 for(const e of exposedEdges(walls,'bottom')){
  const points=edge(e.x,e.y,e.x+e.width,lift);
  p.setShader(Skia.Shader.MakeLinearGradient({x:0,y:e.y-lift},{x:0,y:e.y},[Skia.Color('#64716A'),Skia.Color('#344340'),Skia.Color('#111E20')],[0,.3,1],TileMode.Clamp));
  c.drawPath(polygon([...points,[e.x+e.width,e.y],[e.x,e.y]]),p);p.setShader(null);
  for(let k=1;k<=3;k++){
   const t=k/4;p.setColor(Skia.Color('#0A141B70'));p.setStrokeWidth(.022);
   const seam=points.map(([x,y])=>{const baseX=6+(x!-6)/(1+lift*.20);return {x:x!+(baseX-x!)*t,y:y!+(e.y-y!)*t};});
   for(let i=1;i<seam.length;i++)c.drawLine(seam[i-1]!.x,seam[i-1]!.y,seam[i]!.x,seam[i]!.y,p);
  }
 }
 draw(tops,'#3B4645');
 c.save();c.clipPath(tops,ClipOp.Intersect,true);
 // Two affine halves share the exact same centre. Texture and occlusion use the same projection.
 for(const sign of [-1,1]){
  c.save();c.clipRect(Skia.XYWHRect(sign<0?-4:6,-4,10,28),ClipOp.Intersect,false);
  const slope=sign*lift*.8/6,sx=1+lift*.20;
  c.concat([sx,0,6*(1-sx),slope,1,-lift-6*slope,0,0,1]);
  for(const b of walls)drawWallPanels(c,image,b,true);
  c.restore();
 }
 c.restore();
 p.setShader(null);p.setColor(Skia.Color('#0A141BCC'));p.setStyle(PaintStyle.Stroke);p.setStrokeWidth(.035);c.drawPath(tops,p);p.setStyle(PaintStyle.Fill);
 p.setColor(Skia.Color('#D9D9BC80'));p.setStrokeWidth(.025);
 for(const e of exposedEdges(walls,'top')){const pts=edge(e.x+.03,e.y+.015,e.x+e.width-.03,lift);for(let i=1;i<pts.length;i++)c.drawLine(pts[i-1]![0]!,pts[i-1]![1]!,pts[i]![0]!,pts[i]![1]!,p);}
}
