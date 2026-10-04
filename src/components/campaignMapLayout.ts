import type {CampaignEntry} from '../campaign/levels';
import type {CampaignZone} from '../../shared/campaign-levels';
import {campaignRoadPoint,campaignSlotFraction,MAP_ASPECT} from './campaignRoad';
export type MapNode={entry:CampaignEntry;index:number;x:number;y:number};
export type MapScene={key:string;zone:CampaignZone;offset:number;height:number;imageHeight:number;nodes:MapNode[]};
/** Decorative worlds hold ten missions each. Combat district/entry data is untouched. */
export function campaignMapLayout(entries:readonly CampaignEntry[],width:number){
 const scenes:MapScene[]=[],imageHeight=width*MAP_ASPECT;
 const zones:CampaignZone[]=['warehouse','rooftops','powerworks'];
 let offset=0;
 for(let block=Math.ceil(entries.length/10)-1;block>=0;block--){
  const first=block*10,last=Math.min(first+9,entries.length-1),zone=zones[block%3]!;
  const nodes:MapNode[]=[];
  for(let i=last;i>=first;i--){
   // Partial future blocks keep their ten fixed slots when new missions are published.
   const point=campaignRoadPoint(campaignSlotFraction(first+9-i),width);
   nodes.push({entry:entries[i]!,index:i,...point});
  }
  scenes.push({key:`world-${block}`,zone,offset,height:imageHeight,imageHeight,nodes});
  offset+=imageHeight;
 }
 return {scenes};
}
