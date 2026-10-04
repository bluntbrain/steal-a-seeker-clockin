/** Cosmetic only. No wallet, score, replay or game-state writes. */
export const LOOT_SLOTS=8,COINS_PER_DEFEAT=10,LOOT_DURATION=.78;
export type LootBurst={started:number;x:number;y:number;seed:number};
export const emptyLoot=():LootBurst[]=>{
 'worklet';return Array.from({length:LOOT_SLOTS},()=>({started:-100,x:0,y:0,seed:0}));
};
export function newDefeats(before:number[]|undefined,after:number[],oldTick:number,tick:number){
 'worklet';const found:number[]=[];if(!before||tick<=oldTick)return found;
 for(let i=0;i<after.length;i++)if((before[i]??0)>0&&after[i]!<=0)found.push(i);return found;
}
export function addLoot(pool:LootBurst[],burst:LootBurst){
 'worklet';let oldest=0;for(let i=1;i<pool.length;i++)if(pool[i]!.started<pool[oldest]!.started)oldest=i;pool[oldest]=burst;
}
export function lootArrival(index:number){'worklet';return .18+index*.012+.36;}
export function lootCoin(b:LootBurst,index:number,time:number,courierX:number,courierY:number,reduced=false){
 'worklet';const age=time-b.started,blank={x:0,y:0,scale:0,angle:0,frame:0,flight:0};
 if(age<0||age>=LOOT_DURATION||reduced&&(index>=2||age>=.28))return blank;
 if(reduced)return {...blank,x:courierX+(index?-.17:.17),y:courierY-.18,scale:.23*(1-age/.28)};
 const angle=index*Math.PI*2/COINS_PER_DEFEAT+b.seed*.73,radius=1.55+(index%4)*.25;
 const ex=b.x+Math.cos(angle)*radius,ey=b.y+Math.sin(angle)*radius*.8;
 const expand=Math.min(1,age/.14),out=1-Math.pow(1-expand,3),start=.18+index*.012;
 const flight=Math.max(0,Math.min(1,(age-start)/.36)),u=flight*flight*(3-2*flight);
 let x=b.x+(ex-b.x)*out,y=b.y+(ey-b.y)*out-Math.sin(expand*Math.PI)*.35;
 // Quadratic arc has the scatter endpoint as its exact start and the live courier as its end.
 if(age>=start){const bend=(index%2?1:-1)*.7,cx=(ex+courierX)*.5-Math.sin(angle)*bend,cy=(ey+courierY-.18)*.5+Math.cos(angle)*bend;
  x=(1-u)*(1-u)*ex+2*(1-u)*u*cx+u*u*courierX;y=(1-u)*(1-u)*ey+2*(1-u)*u*cy+u*u*(courierY-.18);}
 const pop=Math.min(1,age/.025)*(1+.12*Math.sin(expand*Math.PI)),shrink=1-Math.pow(flight,7);
 return {x,y,scale:(.36+(index%3)*.025)*pop*shrink,angle:Math.sin(age*8+index)*.2,frame:Math.floor(age*22+index)%6,flight};
}
/** The glow starts on arrival, not on a timer unrelated to the coin paths. */
export function lootPulse(pool:LootBurst[],time:number,reduced=false){
 'worklet';let opacity=0,radius=.3;if(reduced)return {opacity,radius};
 for(const b of pool)for(const i of [0,4,9]){const t=(time-b.started-lootArrival(i))/.12;if(t<0||t>=1)continue;
 const strength=Math.sin(Math.PI*t)*.55;if(strength>opacity){opacity=strength;radius=.18+.34*t;}}
 return {opacity,radius};
}
/** Five bounded audio phases: scatter, zip and three collection groups. */
export function lootAudioMask(age:number){
 'worklet';if(age<0||age>=LOOT_DURATION)return 0;
 return 1|(age>=.18?2:0)|(age>=lootArrival(0)?4:0)|(age>=lootArrival(4)?8:0)|(age>=lootArrival(9)?16:0);
}
