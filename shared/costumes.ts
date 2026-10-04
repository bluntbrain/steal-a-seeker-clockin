// Stable inventory IDs retain earlier purchases; display names follow 02-costumes.jpg.
export const COSTUMES = [
 {id:'default',asset:'default',name:'Default',description:'Off-white hood. Mint backpack.',unlock:'free'},
 {id:'signal-runner',asset:'frost-runner',name:'Frost Runner',description:'Snowflake hood. Mint winter trim.',unlock:'credits'},
 {id:'night-courier',asset:'night-courier',name:'Night Courier',description:'Charcoal hood and dark backpack.',unlock:'credits'},
 {id:'circuit-scout',asset:'circuit-scout',name:'Circuit Scout',description:'Mint circuit stripes on charcoal.',unlock:'credits'},
 {id:'archive-keeper',asset:'archive-keeper',name:'Archive Keeper',description:'Cream jacket. Tan satchel straps.',unlock:'credits'},
 {id:'ghost-courier',asset:'ghost-signal',name:'Ghost Signal',description:'Glass-grey hood. Glowing mint pack.',unlock:'pass'},
 {id:'solana-toly',asset:'solana-toly',name:'Toly',description:'Short hair, mint pack. Ready for extraction.',unlock:'credits'},
 {id:'solana-mert',asset:'solana-mert',name:'Mert',description:'Black beard. Black suit. Quiet escape.',unlock:'credits'},
 {id:'solana-chase',asset:'solana-chase',name:'Chase',description:'Wavy hair and mint-trimmed field gear.',unlock:'credits'},
 {id:'solana-lily',asset:'solana-lily',name:'Lily',description:'Long dark hair. Mint-trimmed field gear.',unlock:'credits'},
 {id:'solana-vibhu',asset:'solana-vibhu',name:'Vibhu',description:'Dark hair and a mint-lined field jacket.',unlock:'credits'},
 {id:'solana-akshay',asset:'solana-akshay',name:'Akshay Rajan',description:'Swept black hair, a bright smile and a mint courier pack.',unlock:'credits'},
 {id:'solana-beeman',asset:'solana-beeman',name:'Beeman',description:'Black shades, a silver beard and a mint courier pack.',unlock:'credits'},
] as const;
export type CostumeId=typeof COSTUMES[number]['id'];
export const costumeFor=(id?:string)=>COSTUMES.find(c=>c.id===id)??COSTUMES[0];
/** Simulation: south=0, west=1, north=2, east=3. Sheet: front, left, back, right. */
export function costumeFrame(facing:number,walking:boolean){'worklet';return ([0,1,2,3][facing]??2)+(walking?4:0);}

export const isSolanaCostume=(id?:string)=>!!id&&id.startsWith('solana-')&&COSTUMES.some(c=>c.id===id);
