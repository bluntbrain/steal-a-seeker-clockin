// Presentation only. Camera coordinates never enter game state or recorded replays.
export type Camera={x:number;y:number;zoom:number};
export const OVERVIEW:Camera={x:0,y:0,zoom:1};
export function cameraConfig(enabled?:string,zoom?:string){
 const n=Number(zoom);
 return {enabled:enabled!=='0'&&enabled!=='false',zoom:Number.isFinite(n)&&n>=1?Math.min(1.6,n):1.3};
}
export function frameCourier(x:number,y:number,zoom:number,viewportHeight=20):Camera{
 'worklet';
 zoom=Math.max(zoom,viewportHeight/20);
 return {x:Math.max(0,Math.min(12-12/zoom,x-6/zoom)),y:Math.max(0,Math.min(20-viewportHeight/zoom,y-.5-viewportHeight/2/zoom)),zoom};
}
export function followCamera(current:Camera,target:Camera,dt:number):Camera{
 'worklet';
 if(current.zoom!==target.zoom)return target;
 const dx=target.x-current.x,dy=target.y-current.y;
 // below a millionth of a tile the camera is still; the same object lets renderers skip the frame
 if(Math.abs(dx)<1e-6&&Math.abs(dy)<1e-6)return current;
 const t=1-Math.exp(-Math.max(0,Math.min(dt,.1))*10);
 return {x:current.x+dx*t,y:current.y+dy*t,zoom:target.zoom};
}
export function screenToWorld(x:number,y:number,size:number,c:Camera){
 'worklet';return {x:c.x+x*12/size/c.zoom,y:c.y+y*12/size/c.zoom};
}
export function worldToScreen(x:number,y:number,size:number,c:Camera){
 'worklet';return {x:(x-c.x)*size/12*c.zoom,y:(y-c.y)*size/12*c.zoom};
}
// A marker on the edge points towards an off-screen target, never moves it.
export function edgeMarker(x:number,y:number,size:number,c:Camera,height=size*20/12){
 'worklet';const p=worldToScreen(x,y,size,c),h=height,m=15;
 if(c.zoom===1||(p.x>=0&&p.x<=size&&p.y>=0&&p.y<=h))return null;
 const dx=p.x-size/2,dy=p.y-h/2,t=Math.min((size/2-m)/Math.max(.001,Math.abs(dx)),(h/2-m)/Math.max(.001,Math.abs(dy)));
 return {x:size/2+dx*t,y:h/2+dy*t,angle:Math.atan2(dy,dx)};
}
