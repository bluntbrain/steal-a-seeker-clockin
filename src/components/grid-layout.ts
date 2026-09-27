/** Fit whole physical pixels inside the measured content box, including gaps. */
export function gridCardWidth(width:number,density:number,columns=3,gap=8){
 const scale=Number.isFinite(density)&&density>0?density:1;
 return Math.max(0,Math.floor(Math.max(0,width-gap*(columns-1))*scale/columns)/scale);
}
