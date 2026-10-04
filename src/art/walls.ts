import {ClipOp,FilterMode,MipmapMode,Skia,type SkCanvas,type SkImage} from '@shopify/react-native-skia';
import type {Box} from '../game/level';

// Record textured wall tops into the static level picture. No image work per frame.
// One nine-slice per wall: the corners keep a fixed world size, the edges and the
// centre tile at the corner scale, so a long wall reads as one continuous slab
// instead of a row of framed modules.
const FRAME=.10;
export function drawWallPanels(canvas:SkCanvas,image:SkImage,box:Box){
 const paint=Skia.Paint();paint.setAntiAlias(true);paint.setColor(Skia.Color('#FFFFFF'));
 const left=box.x+.025,top=box.y+.025,width=box.w-.05,height=box.h-.19;
 const iw=image.width(),ih=image.height();
 const edge=Math.min(.2,width*.25,height*.25),tile=edge*(1-2*FRAME)/FRAME;
 const sx=[0,iw*FRAME,iw*(1-FRAME),iw],sy=[0,ih*FRAME,ih*(1-FRAME),ih];
 const dx=[left,left+edge,left+width-edge,left+width],dy=[top,top+edge,top+height-edge,top+height];
 canvas.save();
 canvas.clipRRect(Skia.RRectXY(Skia.XYWHRect(left,top,width,height),.06,.06),ClipOp.Intersect,true);
 for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++){
  const w=dx[xx+1]!-dx[xx]!,h=dy[yy+1]!-dy[yy]!;if(w<=0||h<=0)continue;
  const src=Skia.XYWHRect(sx[xx]!,sy[yy]!,sx[xx+1]!-sx[xx]!,sy[yy+1]!-sy[yy]!);
  const tw=xx===1?tile:w,th=yy===1?tile:h,cols=Math.ceil(w/tw-1e-6),rows=Math.ceil(h/th-1e-6);
  canvas.save();canvas.clipRect(Skia.XYWHRect(dx[xx]!,dy[yy]!,w,h),ClipOp.Intersect,true);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)
   canvas.drawImageRectOptions(image,src,Skia.XYWHRect(dx[xx]!+c*tw,dy[yy]!+r*th,tw,th),FilterMode.Linear,MipmapMode.None,paint);
  canvas.restore();
 }
 canvas.restore();
}
