/** Render-only timing. Never changes the simulation or ranked replay. */
export function defeatPose(elapsed:number,heavy:boolean,drone:boolean,reduced:boolean){
 'worklet';
 const t=Math.max(0,elapsed),duration=reduced?.22:heavy?.9:.76;
 const fall=Math.min(1,t/(heavy?.34:.24)),ease=1-Math.pow(1-fall,3);
 return {opacity:Math.max(0,Math.min(1,(duration-t)/(reduced?.22:.26))),
  recoil:reduced?0:ease*(heavy?.16:.24),rotation:reduced?0:ease*(drone?2.8:1.35),
  scaleX:reduced?1:1-.12*ease,scaleY:reduced?1:1-(drone?.5:.62)*ease,
  flash:reduced?0:Math.max(0,1-t/.09),burst:reduced?0:Math.max(0,1-t/.38),radius:.18+Math.min(1,t/.38)*.58};
}
