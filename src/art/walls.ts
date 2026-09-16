import {ClipOp,FilterMode,MipmapMode,Skia,type SkCanvas,type SkImage} from '@shopify/react-native-skia';
import type {Box} from '../game/level';

// Record textured modules into the static level picture. No image work per frame.
// Nine slices keep the bolts and beveled corners at a consistent world-space size.
export function drawWallPanels(canvas:SkCanvas,image:SkImage,box:Box){
 const paint=Skia.Paint();paint.setAntiAlias(true);paint.setColor(Skia.Color('#FFFFFF'));
 const left=box.x+.025,top=box.y+.025,width=box.w-.05,height=box.h-.19;
 const columns=Math.max(1,Math.ceil(width/2)),rows=Math.max(1,Math.ceil(height/2));
 const w=width/columns,h=height/rows,iw=image.width(),ih=image.height();
 const sx=[0,iw*.14,iw*.86,iw],sy=[0,ih*.14,ih*.86,ih];
 canvas.save();
 canvas.clipRRect(Skia.RRectXY(Skia.XYWHRect(left,top,width,height),.06,.06),ClipOp.Intersect,true);
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const x=left+col*w,y=top+row*h,edge=Math.min(.18,w*.22,h*.22);
  const dx=[x,x+edge,x+w-edge,x+w],dy=[y,y+edge,y+h-edge,y+h];
  for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++){
   canvas.drawImageRectOptions(image,
    Skia.XYWHRect(sx[xx]!,sy[yy]!,sx[xx+1]!-sx[xx]!,sy[yy+1]!-sy[yy]!),
    Skia.XYWHRect(dx[xx]!,dy[yy]!,dx[xx+1]!-dx[xx]!,dy[yy+1]!-dy[yy]!),
    FilterMode.Linear,MipmapMode.None,paint);
  }
 }
 canvas.restore();
}
