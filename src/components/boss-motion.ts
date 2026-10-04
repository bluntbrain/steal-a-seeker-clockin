/** Frames follow distance travelled, not wall time. Stopped bosses hold their stance. */
export function bossWalkFrame(distance:number,moving:boolean){'worklet';return moving?Math.floor(distance/.18)%4:1;}
export function bossEntryPose(t:number,reduced=false){
 'worklet';if(reduced)return {frame:7,x:0,y:0,scale:1,face:1,top:0,ring:0};
 const jump=Math.min(1,t/.62),land=Math.max(0,Math.min(1,(t-.62)/.22)),turn=Math.max(0,Math.min(1,(t-1)/.35));
 return {frame:t<.12?4:t<.62?5:t<.86?6:7,x:-180*(1-jump),y:-90*(1-jump)-Math.sin(jump*Math.PI)*130,scale:(.7+.3*jump)*(1-.7*turn),face:1-turn,top:turn,ring:land>0&&land<1?Math.sin(land*Math.PI):0};
}
