/** Cosmetic only. No wallet, score, replay or game-state writes. */
export const LOOT_SLOTS=8,COINS_PER_DEFEAT=10,LOOT_DURATION=.68;
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
 // A fast outward pop, then a staggered accelerating return. No long hover.
 const angle=index*Math.PI*2/COINS_PER_DEFEAT+b.seed*.73,radius=.90+(index%4)*.18;
 const spreadX=b.x+Math.cos(angle)*radius,spreadY=b.y-.18+Math.sin(angle)*radius*.8;
 const expand=Math.min(1,age/.12),out=1-Math.pow(1-expand,3);
 let x=b.x+(spreadX-b.x)*out,y=b.y-.18+(spreadY-b.y+.18)*out-Math.sin(expand*Math.PI)*.22;
 const flight=Math.max(0,Math.min(1,(age-.15-index*.007)/.34)),pull=flight*flight;
 // A small tangential bend gives separate paths without orbiting or drifting.
 const bend=Math.sin(flight*Math.PI)*.14*(index%2?1:-1);
 x+=(courierX-x)*pull-Math.sin(angle)*bend;y+=(courierY-.45-y)*pull+Math.cos(angle)*bend;
 const pop=Math.min(1,age/.025)*(1+.16*Math.sin(expand*Math.PI));
 const shrink=1-Math.pow(flight,6);
 return {x,y,scale:(.34+(index%3)*.025)*pop*shrink,angle:angle+age*(index%2?12:-12)};
}
/** One brief, local arrival pulse even when multiple enemies fall together. */
export function lootPulse(pool:LootBurst[],time:number,reduced=false){
 'worklet';let opacity=0,radius=.3;
 if(reduced)return {opacity,radius};
 for(const b of pool){const t=(time-b.started-.43)/.25;
  if(t<0||t>=1)continue;
  const strength=Math.sin(Math.PI*t)*(1-t)*.75;
  if(strength>opacity){opacity=strength;radius=.28+.52*t;}
 }
 return {opacity,radius};
}
