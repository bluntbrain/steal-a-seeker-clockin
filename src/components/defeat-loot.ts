/** Cosmetic only. No wallet, score, replay or game-state writes. */
export const LOOT_SLOTS=8,COINS_PER_DEFEAT=6,LOOT_DURATION=1.12;
export type LootBurst={started:number;x:number;y:number;seed:number};
export const emptyLoot=():LootBurst[]=>{
 'worklet';return Array.from({length:LOOT_SLOTS},()=>({started:-100,x:0,y:0,seed:0}));
};
export function newDefeats(before:number[]|undefined,after:number[],oldTick:number,tick:number){
 'worklet';const found:number[]=[];
 if(!before||tick<=oldTick)return found;
 for(let i=0;i<after.length;i++)if((before[i]??0)>0&&after[i]!<=0)found.push(i);
 return found;
}
export function addLoot(pool:LootBurst[],burst:LootBurst){
 'worklet';let oldest=0;for(let i=1;i<pool.length;i++)if(pool[i]!.started<pool[oldest]!.started)oldest=i;
 pool[oldest]=burst;
}
export function lootCoin(b:LootBurst,index:number,time:number,courierX:number,courierY:number,reduced=false){
 'worklet';const age=time-b.started;
 if(age<0||age>=LOOT_DURATION||reduced&&(index>=2||age>=.28))return {x:0,y:0,scale:0,angle:0};
 if(reduced)return {x:courierX+(index?-.17:.17),y:courierY-.5,scale:.23*(1-age/.28),angle:0};
 const angle=index*Math.PI/3+b.seed*.73,radius=.48+(index%3)*.11;
 const spreadX=b.x+Math.cos(angle)*radius,spreadY=b.y-.18+Math.sin(angle)*radius*.65;
 const expand=Math.min(1,age/.28),out=1-Math.pow(1-expand,3);
 let x=b.x+(spreadX-b.x)*out,y=b.y-.18+(spreadY-b.y+.18)*out-Math.sin(expand*Math.PI)*.38;
 const flight=Math.max(0,Math.min(1,(age-.36-index*.025)/.60)),pull=flight*flight*(3-2*flight);
 x+=(courierX-x)*pull;y+=(courierY-.45-y)*pull-Math.sin(flight*Math.PI)*.22;
 return {x,y,scale:(.33+(index%2)*.04)*Math.min(1,age/.05)*(1-Math.pow(flight,3)),angle:angle+age*(index%2?8:-8)};
}
