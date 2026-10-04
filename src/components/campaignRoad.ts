/** One curve is used by the asset packer and the mission buttons. Units are map widths. */
export const MAP_ASPECT=3;
export const ROAD_TURNS=6;
export function campaignRoadPoint(fraction:number,width:number){
 const u=Math.max(0,Math.min(1,fraction))*ROAD_TURNS;
 const turn=Math.min(ROAD_TURNS-1,Math.floor(u)),t=u-turn,v=1-t;
 const side=turn%2===0?.94:.06;
 return {x:(v*v*v*.5+3*v*v*t*side+3*v*t*t*side+t*t*t*.5)*width,
  y:(turn*.5+(.5*(3*v*t*t+t*t*t)))*width};
}
export function campaignRoadSvgPath(width:number){
 let d=`M ${width*.5} ${-width*.5} C ${width*.06} ${-width*.5} ${width*.06} 0 ${width*.5} 0`;
 for(let i=0;i<ROAD_TURNS;i++){
  const side=(i%2===0?.94:.06)*width,y=i*.5*width,next=(i+1)*.5*width;
  d+=` C ${side} ${y} ${side} ${next} ${width*.5} ${next}`;
 }
 // Overscan both joins so the full road stroke survives image clipping.
 d+=` C ${width*.94} ${width*3} ${width*.94} ${width*3.5} ${width*.5} ${width*3.5}`;
 return d;
}
export function campaignSlotFraction(slotFromTop:number){return .067+slotFromTop*(.866/9);}
