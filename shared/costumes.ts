// Stable inventory IDs retain earlier purchases; display names follow 02-costumes.jpg.
export const COSTUMES = [
 {id:'default',asset:'default',name:'Default',description:'Off-white hood. Mint backpack.',unlock:'free'},
 {id:'signal-runner',asset:'frost-runner',name:'Frost Runner',description:'Snowflake hood. Mint winter trim.',unlock:'credits'},
 {id:'night-courier',asset:'night-courier',name:'Night Courier',description:'Charcoal hood and dark backpack.',unlock:'credits'},
 {id:'circuit-scout',asset:'circuit-scout',name:'Circuit Scout',description:'Mint circuit stripes on charcoal.',unlock:'credits'},
 {id:'archive-keeper',asset:'archive-keeper',name:'Archive Keeper',description:'Cream jacket. Tan satchel straps.',unlock:'credits'},
 {id:'ghost-courier',asset:'ghost-signal',name:'Ghost Signal',description:'Glass-grey hood. Glowing mint pack.',unlock:'weekly'},
] as const;
export type CostumeId=typeof COSTUMES[number]['id'];
export const costumeFor=(id?:string)=>COSTUMES.find(c=>c.id===id)??COSTUMES[0];
/** Logical headings: north, west, south, east. Sheet: front, left, back, right. */
export function costumeFrame(facing:number,walking:boolean){'worklet';return ([2,1,0,3][facing]??0)+(walking?4:0);}
