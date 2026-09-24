import fs from 'node:fs';
import {GUIDE_STEPS,guideCommand,guideDone,guideTarget} from '../../src/onboarding/combat-guide';
import {combatLevel} from '../../src/game/combat-levels';
import {combatTap} from '../../src/game/combat';
import {initialState,idleInput} from '../../src/game/simulation';
import {recordStep} from '../../src/game/recording';
import type {ReplayChunk} from '../../shared/replay';
const initial=initialState('practice',combatLevel('practice')),s=structuredClone(initial),chunks:ReplayChunk[]=[];
for(let stage=0;stage<GUIDE_STEPS.length;stage++){
 const point=guideTarget(stage,s)!;
 const command=guideCommand(stage,combatTap(s,point.x,point.y,s.combat!.commandSeen+1));
 if(!command)throw Error('Invalid teaching input');
 let ticks=0;do{recordStep(s,{...idleInput(),command:ticks===0?command:undefined},chunks);ticks++;}
 while((ticks%4!==0||!guideDone(stage,s))&&s.status==='playing'&&ticks<700);
 if(!guideDone(stage,s))throw Error('Teaching step stalled');
}
fs.writeFileSync('verification/filament-crash/tutorial-fixture.json',JSON.stringify({initial,chunks,expected:{status:s.status,ticks:s.ticks,score:s.score,hp:s.combat!.hp}}));
