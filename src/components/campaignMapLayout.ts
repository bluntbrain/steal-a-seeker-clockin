import type {CampaignEntry} from '../campaign/levels';
import type {CampaignZone} from '../../shared/campaign-levels';

export type MapNode={entry:CampaignEntry;index:number;x:number;y:number};
export type MapScene={key:string;zone:CampaignZone;previousZone:CampaignZone|null;offset:number;height:number;imageHeight:number;fade:number;nodes:MapNode[]};
// Normalized road centres traced from the actual illustrations; keep nodes off faces.
const roads:Record<CampaignZone,readonly (readonly [number,number])[]>={
 warehouse:[[0,.55],[.08,.68],[.2,.55],[.3,.45],[.4,.52],[.5,.67],[.6,.67],[.7,.6],[.8,.68],[.9,.52],[1,.43]],
 rooftops:[[0,.54],[.1,.6],[.2,.58],[.3,.63],[.4,.53],[.5,.55],[.6,.50],[.68,.49],[.76,.55],[.85,.50],[.95,.52],[1,.45]],
 powerworks:[[0,.56],[.1,.59],[.2,.62],[.3,.52],[.4,.63],[.48,.50],[.55,.53],[.62,.67],[.7,.56],[.78,.42],[.87,.42],[.95,.63],[1,.65]],
};
function roadX(zone:CampaignZone,fraction:number,width:number){
 const points=roads[zone],upper=points.findIndex(p=>p[0]>=fraction);
 if(upper<=0)return points[0]![1]*width;
 const a=points[upper-1]!,b=points[upper]!,t=(fraction-a[0])/(b[0]-a[0]);
 return (a[1]+(b[1]-a[1])*t)*width;
}

/** Decorative worlds hold ten missions each. Combat district/entry data is untouched. */
export function campaignMapLayout(entries:readonly CampaignEntry[],width:number){
 const scenes:MapScene[]=[],imageHeight=width*3,fade=imageHeight*.075;
 const zones:CampaignZone[]=['warehouse','rooftops','powerworks'];
 let offset=0;
 for(let block=Math.ceil(entries.length/10)-1;block>=0;block--){
  const first=block*10,last=Math.min(first+9,entries.length-1),zone=zones[block%3]!;
  const nodes:MapNode[]=[];
  for(let i=last;i>=first;i--){
   // Retain ten road slots in a partial future block, so publishing more missions
   // does not squeeze nodes or distort art. At phone widths targets remain distinct.
   const fraction=.075+(first+9-i)*.085;
   nodes.push({entry:entries[i]!,index:i,x:roadX(zone,fraction,width),y:imageHeight*fraction});
  }
  const height=block===0?imageHeight:imageHeight-fade;
  scenes.push({key:`world-${block}`,zone,previousZone:scenes.at(-1)?.zone??null,offset,height,imageHeight,fade,nodes});
  offset+=height;
 }
 return {scenes};
}
