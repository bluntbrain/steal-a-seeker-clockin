import {CAMPAIGN_IDS,type MissionId} from './level';
export const PHONE_EDITIONS=[
 {name:'Frost',shell:'#F2F4E9',screen:'#BEE9DF',motif:'diagonal'},
 {name:'Graphite',shell:'#3D444A',screen:'#88C9BC',motif:'ring'},
 {name:'Tide',shell:'#AEDACE',screen:'#D2F3E9',motif:'wave'},
 {name:'Static',shell:'#ECEFE8',screen:'#9AE3D0',motif:'pixel'},
 {name:'Mist',shell:'#E2E8E3',screen:'#C7DED4',motif:'moon'},
 {name:'Orbit',shell:'#353E46',screen:'#92D3C5',motif:'orbit'},
 {name:'Pearl',shell:'#F2ECDD',screen:'#D3E8DF',motif:'pearl'},
 {name:'Circuit',shell:'#343D42',screen:'#ACECDC',motif:'circuit'},
 {name:'Relic',shell:'#DEDCCE',screen:'#B4DCD0',motif:'rings'},
 {name:'Flux',shell:'#BCEADD',screen:'#DBFFF3',motif:'ribbon'},
 {name:'Archive',shell:'#3B3549',screen:'#B79ADA',motif:'archive'},
 {name:'Ghost',shell:'#F2F4EA',screen:'#EDFFF9',motif:'star'}
] as const;
export function editionIndex(mission:MissionId){'worklet';return Math.max(0,CAMPAIGN_IDS.indexOf(mission));}
export function phoneEdition(mission:MissionId){return PHONE_EDITIONS[editionIndex(mission)]!;}
