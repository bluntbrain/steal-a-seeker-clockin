import {makeCombatContracts,type Contract} from './contracts';
import {weekWindow} from './weekly';
/** Explicit release gate. Existing stored week manifests are never regenerated. */
export function makeReleaseContracts(date:Date,knifeStart?:string):Contract[]{
 const contracts=makeCombatContracts(date),week=weekWindow(date).week;
 if(!knifeStart)return contracts;
 const start=new Date(`${knifeStart}T00:00:00.000Z`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(knifeStart)||!Number.isFinite(+start)||start.toISOString().slice(0,10)!==knifeStart||start.getUTCDay()!==1)throw new Error('KNIFE_WEEKLY_START must be a Monday YYYY-MM-DD');
 if(week<knifeStart)return contracts;
 return contracts.map(c=>({...c,id:`${c.id}:knife-v15`,level:{...c.level,id:`${c.level.id}:knife-v15`,combat:{version:2,revision:15}},generation:c.generation?{...c.generation,version:4}:undefined}));
}
