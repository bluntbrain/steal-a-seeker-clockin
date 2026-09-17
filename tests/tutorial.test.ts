import test from 'node:test';
import assert from 'node:assert/strict';
import {GUIDE_STEPS,guideCommand,guideDone,guideTarget} from '../src/onboarding/combat-guide';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap} from '../src/game/combat';
import {initialState,idleInput,type GameState} from '../src/game/simulation';
import {recordStep} from '../src/game/recording';
import {verifyReplay} from '../server/replay';
import type {ReplayChunk} from '../shared/replay';

function finishLesson(s:GameState,stage:number,angle:number,chunks:ReplayChunk[]){
 const point=guideTarget(stage,s)!;
 // Fingers land inside the ring, not on the exact authoring coordinate.
 const raw=combatTap(s,point.x+.4*Math.cos(angle),point.y+.4*Math.sin(angle),s.combat!.commandSeen+1);
 const command=guideCommand(stage,raw);assert(command,`Lesson ${stage}: accepted ring tap`);
 let ticks=0;
 do{
  recordStep(s,{...idleInput(),command:ticks===0?command:undefined},chunks);
  ticks++;
  // Match the slower UI observation cadence, rather than checking every frame.
 }while((ticks%4!==0||!guideDone(stage,s))&&s.status==='playing'&&ticks<700);
 assert(guideDone(stage,s),`Lesson ${stage} stalled at ${s.x}, ${s.y}`);
}
test('off-centre teaching taps finish all eight lessons and verify as a real campaign win',()=>{
 for(let direction=0;direction<8;direction++){
  const s=initialState('practice',combatLevel('practice')),chunks:ReplayChunk[]=[];
  for(let stage=0;stage<GUIDE_STEPS.length;stage++)finishLesson(s,stage,direction*Math.PI/4,chunks);
  const verified=verifyReplay('practice',{version:2,chunks},s.definition);
  assert.equal(verified.status,'won');assert.equal(verified.score,s.score);
  assert.equal(s.combat!.kills,2);assert.equal(s.combat!.hp,100);
 }
});
test('every serialized tutorial checkpoint can resume through extraction',()=>{
 const s=initialState('practice',combatLevel('practice'));
 for(let stage=0;stage<GUIDE_STEPS.length;stage++){
  const resumed:GameState=JSON.parse(JSON.stringify(s));
  for(let next=stage;next<GUIDE_STEPS.length;next++)finishLesson(resumed,next,.4,[]);
  assert.equal(resumed.status,'won',`Resume lesson ${stage}`);
  finishLesson(s,stage,.4,[]);
 }
});
test('invalid taps are ignored; a nearby stop tap becomes the intended teaching move',()=>{
 const s=initialState('practice',combatLevel('practice'));
 assert.equal(guideCommand(0,combatTap(s,9,17,1)),null);
 const g=GUIDE_STEPS[0]!;s.x=g.x+.3;s.y=g.y;
 const raw=combatTap(s,g.x+.2,g.y,1);assert.equal(raw.kind,'stop');
 assert.deepEqual(guideCommand(0,raw),{...raw,kind:'move',x:g.x,y:g.y});
 const moving=s.guards[1]!;moving.x=8.6;moving.y=10.4;
 assert.equal(guideTarget(5,s),moving,'Target ring follows the actual guard');
});
