import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyMission,dailyResetLabel,rivalGap} from '../shared/daily';
import {CAMPAIGN_IDS} from '../src/game/level';
import {coachText} from '../src/onboarding/coach';
import {initialState} from '../src/game/simulation';
import {appendRun,emptyLog,summarize,type PlaytestRun} from '../src/telemetry/model';
test('daily changes at midnight UTC and cycles across every campaign mission',()=>{
 const start=new Date('2026-09-13T00:00:00Z'),missions=Array.from({length:12},(_,i)=>dailyMission(new Date(+start+i*86400000)));
 assert.deepEqual([...missions].sort(),[...CAMPAIGN_IDS].sort());assert.equal(dailyMission(new Date(+start+86400000-1)),missions[0]);assert.equal(dailyMission(new Date(+start+86400000)),missions[1]);assert.equal(dailyMission(new Date(+start+12*86400000)),missions[0]);assert.throws(()=>dailyMission(new Date(NaN)));
 assert.equal(dailyResetLabel('2026-09-14T00:00:00Z',+start),'Resets in 24h 0m · 00:00 UTC');assert.equal(dailyResetLabel(start.toISOString(),+start),'New daily available · refresh');
});
test('coach follows movement, pickup and escape without changing simulation state',()=>{
 const s=initialState(),before=JSON.stringify(s);assert.match(coachText(s),/RIGHT stick/);assert.equal(JSON.stringify(s),before);s.x=8.9;s.y=5.8;assert.match(coachText(s),/Hold TAKE/);s.carrying=true;assert.match(coachText(s),/Phone tracked/);s.status='won';assert.equal(coachText(s),'');assert.equal(coachText(initialState('silent-circuit')),'');
});
test('playtest recording defaults off, is bounded, deduplicates results and reports real retry counts',()=>{
 const run:PlaytestRun={id:'a',at:'2026-09-13T00:00:00Z',mission:'practice',mode:'campaign',outcome:'caught',seconds:30,score:0,dashes:1,decoysUsed:1,pickedUp:true,spotted:true,cell:{x:2,y:3},fps:60,p95:17};
 const off=emptyLog();assert.equal(appendRun(off,run),off);let log={...off,enabled:true};for(let i=0;i<105;i++)log=appendRun(log,{...run,id:String(i)});assert.equal(log.runs.length,100);assert.equal(log.runs[0]!.id,'5');assert.equal(appendRun(log,{...run,id:'104'}),log);assert.equal(summarize(log.runs).retries,99);assert.equal(summarize(log.runs).wins,0);assert.equal(summarize([]).escapeRate,0);
});
test('rival gap distinguishes score, time and a shared first place',()=>{
 const me={wallet:'me',rank:62,score:100,ticks:600,seconds:20,frame:null};assert.match(rivalGap(me,{...me,rank:61,score:110}),/10 points/);assert.match(rivalGap(me,{...me,rank:61,ticks:570}),/1.00s faster/);assert.match(rivalGap({...me,rank:1},null),/share the top rank/);
});
