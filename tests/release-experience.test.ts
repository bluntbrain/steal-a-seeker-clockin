import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_IDS} from '../src/game/level';
import {coachText} from '../src/onboarding/coach';
import {initialState} from '../src/game/simulation';
import {appendRun,emptyLog,summarize,type PlaytestRun} from '../src/telemetry/model';
test('coach follows movement, pickup and escape without changing simulation state',()=>{
 const s=initialState(),before=JSON.stringify(s);assert.match(coachText(s),/RIGHT stick/);assert.equal(JSON.stringify(s),before);s.x=8.9;s.y=5.8;assert.match(coachText(s),/Hold TAKE/);s.carrying=true;assert.match(coachText(s),/Phone tracked/);s.status='won';assert.equal(coachText(s),'');assert.equal(coachText(initialState('silent-circuit')),'');
});
test('playtest recording defaults off, is bounded, deduplicates results and reports real retry counts',()=>{
 const run:PlaytestRun={id:'a',at:'2026-09-13T00:00:00Z',mission:'practice',mode:'campaign',outcome:'caught',seconds:30,score:0,dashes:1,decoysUsed:1,pickedUp:true,spotted:true,cell:{x:2,y:3},fps:60,p95:17};
 const off=emptyLog();assert.equal(appendRun(off,run),off);let log={...off,enabled:true};for(let i=0;i<105;i++)log=appendRun(log,{...run,id:String(i)});assert.equal(log.runs.length,100);assert.equal(log.runs[0]!.id,'5');assert.equal(appendRun(log,{...run,id:'104'}),log);assert.equal(summarize(log.runs).retries,99);assert.equal(summarize(log.runs).wins,0);assert.equal(summarize([]).escapeRate,0);
});
