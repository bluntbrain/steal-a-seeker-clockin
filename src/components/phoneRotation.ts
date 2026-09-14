export function turntableFrame(start:number,dragPixels:number){
 const frame=start+Math.round(dragPixels/14);
 return ((frame%16)+16)%16;
}
