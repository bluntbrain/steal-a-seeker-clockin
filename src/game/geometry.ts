import {TUNING,type Box} from './level';
export function intersectsBox(x:number,y:number,b:Box,radius=TUNING.radius){'worklet';const cx=Math.max(b.x,Math.min(x,b.x+b.w)),cy=Math.max(b.y,Math.min(y,b.y+b.h));return (x-cx)*(x-cx)+(y-cy)*(y-cy)<radius*radius-1e-8;}
export function blockedBy(x:number,y:number,boxes:Box[]){'worklet';for(let i=0;i<boxes.length;i++)if(intersectsBox(x,y,boxes[i]!))return true;return false;}
