import {ClipOp,PathOp,PaintStyle,Skia,TileMode,type SkCanvas,type SkImage,type SkPath} from '@shopify/react-native-skia';
import type {Box} from '../game/level';
import {drawWallPanels} from './walls';
import {exposedEdges,wallHeight,type WallStyle} from './wall-depth';
export type WallOcclusion={bottoms:number[];clips:SkPath[]};
function union(walls:readonly Box[],lift:number,volume=false){
 const path=Skia.Path.Make();for(const b of walls){const part=Skia.Path.Make();part.addRect(Skia.XYWHRect(b.x,b.y-lift,b.w,b.h+(volume?lift:0)));path.op(part,PathOp.Union);}return path;
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
 const tops=union(walls,lift),body=union(walls,lift,true),base=union(walls,0);
 // Cached hard-edged shadows avoid animated blur filters on Android.
 for(const [dx,dy,color] of [[.10,.16,'#03090D24'],[.06,.09,'#03090D40']] as const){c.save();c.translate(dx,dy);draw(base,color);c.restore();}
 draw(base,'#080E12');draw(body,district==='rooftops'?'#273B47':district==='powerworks'?'#2D303E':'#283438');
 for(const edge of exposedEdges(walls,'bottom')){
  p.setShader(Skia.Shader.MakeLinearGradient({x:0,y:edge.y-lift},{x:0,y:edge.y},[Skia.Color('#58676A'),Skia.Color('#253238'),Skia.Color('#131F25')],[0,.32,1],TileMode.Clamp));
  c.drawRect(Skia.XYWHRect(edge.x,edge.y-lift,edge.width,lift),p);p.setShader(null);
  p.setColor(Skia.Color('#070E14'));c.drawRect(Skia.XYWHRect(edge.x,edge.y-.035,edge.width,.035),p);
  p.setColor(Skia.Color('#101D2380'));for(let x=edge.x+1.2;x<edge.x+edge.width-.15;x+=1.2)c.drawRect(Skia.XYWHRect(x,edge.y-lift+.035,.018,lift-.07),p);
 }
 draw(tops,district==='rooftops'?'#506571':'#3D4D50');
 c.save();c.clipPath(tops,ClipOp.Intersect,true);
 for(const b of walls){c.save();c.translate(0,-lift);drawWallPanels(c,image,b);c.restore();}
 draw(tops,district==='powerworks'?'#87909816':'#B8CBC41C');c.restore();
 p.setColor(Skia.Color('#8AABA56B'));p.setStyle(PaintStyle.Stroke);p.setStrokeWidth(.035);c.drawPath(tops,p);p.setStyle(PaintStyle.Fill);
 p.setColor(Skia.Color('#BCD5CB'));for(const edge of exposedEdges(walls,'top'))c.drawRect(Skia.XYWHRect(edge.x+.025,edge.y-lift+.012,Math.max(.01,edge.width-.05),.032),p);
}
