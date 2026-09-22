import {performance} from 'node:perf_hooks';
import {writeFileSync} from 'node:fs';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {initialState} from '../src/game/simulation';
import {assistedCombatTap} from '../src/controls/tapDestination';
const rows=CAMPAIGN_IDS.map(id=>{const s=initialState(id,combatLevel(id)),samples:number[]=[];for(let i=0;i<30;i++){const b=s.blockers[i%s.blockers.length]!;const t=performance.now();assistedCombatTap(s,b.x+b.w/2,b.y+b.h/2,i+1);samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);return {id,mean:samples.reduce((a,b)=>a+b,0)/samples.length,p95:samples[Math.floor(samples.length*.95)],max:samples.at(-1)};});writeFileSync(process.argv[2]!,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
