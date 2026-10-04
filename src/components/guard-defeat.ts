/** Render-only timing. No body position, AI or replay mutations. */
export function defeatPose(elapsed:number,heavy:boolean,drone:boolean,reduced:boolean){
 'worklet';
 const t=Math.max(0,elapsed),duration=reduced?.22:heavy?.9:.76;
 const fall=Math.min(1,t/(heavy?.32:.25)),ease=1-Math.pow(1-fall,3);
 return {opacity:Math.max(0,Math.min(1,(duration-t)/(reduced?.22:.26))),
  recoil:reduced?0:ease*(heavy?.12:.17),rotation:reduced?0:ease*(drone?.14:.08),
  scaleX:1,scaleY:1,frame:reduced?3:Math.min(3,Math.floor(t/(heavy?.11:.085))),
  flash:reduced?0:Math.max(0,1-t/.07),burst:reduced?0:Math.max(0,1-t/.30),radius:.18+Math.min(1,t/.30)*.58};
}
