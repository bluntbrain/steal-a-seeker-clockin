import test from 'node:test';
import assert from 'node:assert/strict';
import {leagueLeaders,leagueRows,leagueStandings,rivalLabel} from '../src/league/presentation';
import type {LeagueBoard,LeagueEntry} from '../shared/league';
const entry=(wallet:string,rank:number,position:number,points=100,ticks=300):LeagueEntry=>({wallet,rank,position,points,ticks,cleared:3,best:[]});
const board=(entries:LeagueEntry[]):LeagueBoard=>({week:'2026-09-14',endsAt:'2026-09-21T00:00:00Z',entries,nearby:[],personal:null,rival:null,participants:entries.length,final:false});
test('podium preserves shared ranks and server order without mutating the board',()=>{
 const a=entry('a',1,1),b=entry('b',1,2),c=entry('c',3,3),d=entry('d',4,4),v=board([d,b,a,c]),before=JSON.stringify(v);
 assert.deepEqual(leagueLeaders(v),[a,b,c]);assert.deepEqual(leagueLeaders(v).map(x=>x.rank),[1,1,3]);assert.deepEqual(leagueRows(v),[d]);assert.equal(JSON.stringify(v),before);
});
test('empty and partial leaderboards do not fabricate winners or duplicate podium rows',()=>{
 assert.deepEqual(leagueLeaders(board([])),[]);assert.deepEqual(leagueRows(board([])),[]);
 const a=entry('a',1,1);assert.deepEqual(leagueLeaders(board([a])),[a]);assert.deepEqual(leagueRows(board([a])),[]);
});
test('rival prompt distinguishes points from time and never promises a rank gain',()=>{
 assert.equal(rivalLabel(null,null),null);assert.equal(rivalLabel(entry('you',34,34,100),entry('rival',30,30,280)),'180 pts to match #30');
 assert.equal(rivalLabel(entry('you',2,2,100,360),entry('rival',1,1,100,300)),'2.00s faster to match #1');
});
test('list standings include leaders, preserve ties and append an off-page personal score once',()=>{
 const first=entry('a',1,1),tied=entry('b',1,2),you=entry('you',7,7),v=board([tied,first]);
 v.personal=you;v.nearby=[entry('six',6,6),you];const before=JSON.stringify(v);
 assert.deepEqual(leagueStandings(v),[first,tied,you]);
 assert.deepEqual(leagueStandings(v,true),v.nearby);
 assert.equal(JSON.stringify(v),before);
 v.entries.push(you);assert.equal(leagueStandings(v).filter(p=>p.wallet==='you').length,1);
 assert.deepEqual(leagueStandings(board([])),[]);
});
