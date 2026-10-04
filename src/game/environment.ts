import type {LevelDefinition,MissionId} from './level';
import {campaignLevelNumber,campaignZone,type CampaignZone} from '../../shared/campaign-levels';

// Presentation only. Collision geometry and replay rules live in level.ts.
export function districtFor(number:number):CampaignZone{return number>=9?'powerworks':number>=5?'rooftops':'warehouse';}
export function zoneFor(level:LevelDefinition):CampaignZone{const n=campaignLevelNumber(level.id);return n===null?districtFor(level.number):campaignZone(n);}
const ZONE_PLACES:Record<CampaignZone,{place:string;tint:string}>={warehouse:{place:'Warehouse district',tint:'#A68B5212'},rooftops:{place:'Rooftop district',tint:'#658EBB10'},powerworks:{place:'Powerworks district',tint:'#79A28716'}};
export const ENVIRONMENTS:Record<MissionId,{place:string;hook:string;tint:string}>={
 practice:{place:'Loading bay',hook:'One pickup lane. Learn to steal and escape.',tint:'#A68B5212'},
 'cone-lesson':{place:'Sorting depot',hook:'Break line of sight around the central rack.',tint:'#789C6512'},
 'battery-dash':{place:'Dispatch lane',hook:'A long return trip. Save charge for the escape.',tint:'#B4934222'},
 'crossing-signals':{place:'Freight junction',hook:'Cross two patrol lanes, one at a time.',tint:'#AF795E1A'},
 'sweep-window':{place:'Scanner roof',hook:'Move between the tower scanner’s sweeps.',tint:'#658EBB10'},
 'narrow-crossing':{place:'Skybridges',hook:'Two bridge gates open on alternating timers.',tint:'#79C6CF16'},
 'false-footsteps':{place:'Antenna terrace',hook:'Lure patrols away from the narrow lanes.',tint:'#466CAA1C'},
 'warden-gate':{place:'Warden landing',hook:'A long-range Warden protects your exit.',tint:'#846BA329'},
 'power-trade':{place:'Switchyard',hook:'Swap circuits to open doors and change scanner power.',tint:'#79A28716'},
 'two-targets':{place:'Twin archive',hook:'Two deliveries. The alarm stays on between them.',tint:'#9D89BF32'},
 'silent-circuit':{place:'Relay chamber',hook:'Each relay opens its door for nine seconds.',tint:'#6BA5AD25'},
 'last-vault':{place:'Inner vault',hook:'Two phones, circuit doors, a relay and a Warden.',tint:'#AA8D6338'},
 'night-shift':{place:'Training depot',hook:'The original practice room.',tint:'#A68B5212'},
};
export function environmentFor(level:LevelDefinition){const n=campaignLevelNumber(level.id);return n===null?ENVIRONMENTS[level.mission]:{...ZONE_PLACES[campaignZone(n)],hook:level.briefing};}
