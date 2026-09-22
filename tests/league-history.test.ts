import test from 'node:test';
import assert from 'node:assert/strict';
import {leagueRun,practiceTicket} from '../shared/league';
import {makeCombatContracts} from '../shared/contracts';
import {localSummary} from '../src/league/local';
import type {RunResult} from '../shared/ranked';
const contract=makeCombatContracts()[0]!;
const result:RunResult={status:'won',score:123,ticks:900,seconds:30,battery:80,hp:80,delivered:1,spotted:false};
test('current weekly wins appear in recent attempts before weekly history finalizes',()=>{
 const ticket={...practiceTicket(contract,'test','wallet'),practice:false,status:'verified' as const,result};
 const data=localSummary({tickets:[ticket],results:{[ticket.id]:result}});
 assert.equal(data.history.length,0);assert.equal(data.recentRuns?.length,1);
 assert.equal(data.recentRuns![0]!.points,data.board.personal!.points);
 assert.equal(data.recentRuns![0]!.mission,contract.name);
});
test('history does not award points for pending, rejected, lost or practice runs',()=>{
 const ticket={...practiceTicket(contract,'test','wallet'),practice:false,result};
 for(const status of ['issued','verifying','rejected','error','abandoned'] as const){const entry=leagueRun({...ticket,status})!;assert.equal(entry.points,0);assert.equal(entry.ticks,null);}
 assert.equal(leagueRun({...ticket,status:'verified',result:{...result,status:'caught'}})?.points,0);
 assert.equal(leagueRun({...ticket,practice:true,status:'verified'}),null);
});

test('an expired unsubmitted attempt is not presented as still in progress',()=>{
 const ticket={...practiceTicket(contract,'test','wallet'),practice:false,expiresAt:'2026-01-01T00:00:00Z'};
 assert.equal(leagueRun(ticket,Date.parse('2026-01-02'))?.status,'rejected');
});
