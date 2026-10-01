/** Presentation follows simulation ticks; it never schedules damage or timers. */
export const MELEE_CELL=192;
export const MELEE_FRAMES=Array.from({length:20},(_,i)=>({x:i%4*MELEE_CELL,y:Math.floor(i/4)*MELEE_CELL,width:MELEE_CELL,height:MELEE_CELL}));
export function attackFacing(angle:number){
 'worklet';const x=Math.cos(angle),y=Math.sin(angle);
 return Math.abs(x)>Math.abs(y)?x<0?1:3:y<0?2:0;
}
export function attackPose(age:number){
 'worklet';return age<0||age>=11?-1:age<4?0:age<7?1:2;
}
export function meleeFrame(age:number,angle:number){
 'worklet';const pose=attackPose(age);return pose<0?-1:8+pose*4+attackFacing(angle);
}
