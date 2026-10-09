import {ClipOp,Skia,TileMode,type SkCanvas} from '@shopify/react-native-skia';
import type {Box,LevelDefinition} from '../game/level';
import {wallShadowX,wallShadowY} from './wall-depth';

/** Painted tape lives on the object, never across a traversable lane. */
export function drawHazardBand(c:SkCanvas,x:number,y:number,w:number,h:number){
 if(w<=0||h<=0)return;
 const p=Skia.Paint();p.setAntiAlias(true);p.setColor(Skia.Color('#D9B947'));c.drawRect(Skia.XYWHRect(x,y,w,h),p);
 c.save();c.clipRect(Skia.XYWHRect(x,y,w,h),ClipOp.Intersect,false);p.setColor(Skia.Color('#202B2C'));
 for(let xx=x-h;xx<x+w+h;xx+=.26){const path=Skia.Path.Make();path.moveTo(xx,y);path.lineTo(xx+.13,y);path.lineTo(xx+.13+h*.6,y+h);path.lineTo(xx+h*.6,y+h);path.close();c.drawPath(path,p);}c.restore();
}

/** Deterministic detail on existing cargo colliders, recorded once into the scene. */
export function drawCargo(c:SkCanvas,b:Box,district:string,index:number){
 const p=Skia.Paint();p.setAntiAlias(true);
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{if(w<=0||h<=0)return;p.setShader(null);p.setColor(Skia.Color(color));c.drawRect(Skia.XYWHRect(x,y,w,h),p);};
 const line=(x:number,y:number,xx:number,yy:number,color:string,width=.025)=>{p.setShader(null);p.setColor(Skia.Color(color));p.setStrokeWidth(width);c.drawLine(x,y,xx,yy,p);};
 const round=(x:number,y:number,w:number,h:number,color:string)=>{if(w<=0||h<=0)return;p.setShader(null);p.setColor(Skia.Color(color));c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x,y,w,h),.06,.06),p);};
 const colors=district==='powerworks'?['#BF754B','#71412E','#E3A271']:district==='rooftops'?['#428DA6','#244C62','#8CC3CC']:['#5C9B78','#2C5949','#9AC5A2'];
 const [cap,side,light]=colors as [string,string,string];
 const lift=Math.min(.22,b.h*.2),dx=wallShadowX(b.x+b.w/2);
 round(b.x+dx*.6,b.y+wallShadowY(b.x+b.w/2),b.w,b.h,'#030B1140');round(b.x+dx*.25,b.y+wallShadowY(b.x+b.w/2)*.4,b.w,b.h,'#030B1158');
 round(b.x,b.y,b.w,b.h,'#111F24');rect(b.x+.035,b.y+.08,b.w-.07,b.h-.11,side);
 const inset=.06,top=b.y+inset,left=b.x+inset,w=b.w-inset*2,h=b.h-lift-inset;
 p.setShader(Skia.Shader.MakeLinearGradient({x:left,y:top},{x:left+w,y:top+h},[Skia.Color(light),Skia.Color(cap),Skia.Color(side)],[0,.18,1],TileMode.Clamp));
 c.drawRRect(Skia.RRectXY(Skia.XYWHRect(left,top,w,h),.05,.05),p);p.setShader(null);
 rect(left+.07,top+.07,w-.14,h-.14,cap);
 for(let x=left+.23;x<left+w-.12;x+=.24){line(x,top+.12,x,top+h-.12,side,.022);line(x+.035,top+.12,x+.035,top+h-.12,light+'65',.022);}
 if(w>.55&&h>.55){
  line(left+.12,top+h-.13,left+w-.12,top+.13,side,.14);line(left+.12,top+h-.16,left+w-.12,top+.10,light,.065);
  if(index%3===0){line(left+.12,top+.13,left+w-.12,top+h-.13,side,.13);line(left+.12,top+.1,left+w-.12,top+h-.16,light,.06);}
 }
 line(left+.07,top+.025,left+w-.07,top+.025,light,.035);
 for(let y=b.y+b.h-lift+.06;y<b.y+b.h-.02;y+=.065)line(b.x+.05,y,b.x+b.w-.05,y,'#10292588',.024);
 const faceX=b.x+b.w/2<6?b.x+b.w-.10:b.x+.025;rect(faceX,top+.06,.07,Math.max(.05,h-.05),side);
 for(const x of [left+.06,left+w-.06])for(const y of [top+.07,top+h-.07]){p.setColor(Skia.Color('#172D31'));c.drawCircle(x,y,.045,p);p.setColor(Skia.Color('#D9DBC4'));c.drawCircle(x-.008,y-.008,.019,p);}
 if(w>.65&&h>.55&&index%2===0)drawHazardBand(c,left+.06,top+h*.72,w-.12,Math.min(.16,h*.17));
 if(w>.85&&h>.7){rect(left+w*.36,top+h-.15,w*.28,.07,'#163033');line(left+w*.37,top+h-.16,left+w*.63,top+h-.16,light,.02);}
 for(let k=0;k<4;k++){const x=left+.12+((index*13+k*17)%23)/23*Math.max(.01,w-.3),y=top+.12+((index*7+k*11)%19)/19*Math.max(.01,h-.3);line(x,y,x+.06,y-.015,light+'85',.012);}
}

/** Decorative edge only: no colliders. Leave the side nearest the extraction bay open. */
export function drawRoomRim(c:SkCanvas,level:LevelDefinition,district:string){
 const p=Skia.Paint();p.setAntiAlias(true);const {width:w,height:h,exit:e}=level;
 const rect=(x:number,y:number,ww:number,hh:number,color:string)=>{if(ww<=0||hh<=0)return;p.setColor(Skia.Color(color));c.drawRect(Skia.XYWHRect(x,y,ww,hh),p);};
 const distances=[e.y,h-e.y-e.h,e.x,w-e.x-e.w],nearest=distances.indexOf(Math.min(...distances));
 const rails=[{x:0,y:0,w,h:.18},{x:0,y:h-.18,w,h:.18},{x:0,y:0,w:.18,h},{x:w-.18,y:0,w:.18,h}];
 for(const [i,b] of rails.entries()){
  const horizontal=i<2,start=horizontal?b.x:b.y,end=start+(horizontal?b.w:b.h);
  const gapStart=Math.max(start,(horizontal?e.x:e.y)-.12),gapEnd=Math.min(end,(horizontal?e.x+e.w:e.y+e.h)+.12);
  const spans=i===nearest?[[start,gapStart],[gapEnd,end]]:[[start,end]];
  for(const [a,z] of spans){if(z!<=a!)continue;const x=horizontal?a!:b.x,y=horizontal?b.y:a!,ww=horizontal?z!-a!:b.w,hh=horizontal?b.h:z!-a!;
   rect(x+(i===3?-.12:i===2?.12:0),y+(i===0?.12:i===1?-.12:0),ww,hh,'#03090D40');rect(x,y,ww,hh,'#111E25');
   rect(x+.035,y+.035,Math.max(.02,ww-.07),Math.max(.02,hh-.07),district==='powerworks'?'#646075':'#63766B');
   if(horizontal){for(let xx=x+.4;xx<x+ww;xx+=.6)rect(xx,y,.018,hh,'#17272C');}else for(let yy=y+.4;yy<y+hh;yy+=.6)rect(x,yy,ww,.018,'#17272C');
  }
 }
}
