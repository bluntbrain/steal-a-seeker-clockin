import test from 'node:test';
import assert from 'node:assert/strict';
import {makeContracts,contractPoints} from '../shared/contracts';
import {findPath,walkableSegment} from '../src/game/navigation';
import {initialState,step,exitOpen} from '../src/game/simulation';
import {verifyReplay} from '../server/replay';
import {solveContract} from '../scripts/qa-contracts';
import {decodeSkrOwner} from '../server/skr-identity';
import {getAddressEncoder} from '@solana/kit';
test('52 weeks have three reproducible contracts, clear targets, connected extraction and changing routes',()=>{
 assert.notEqual(makeContracts(new Date('2026-09-14'))[0]!.modifier,makeContracts(new Date('2026-09-21'))[0]!.modifier);
 let previous='';for(let n=0;n<52;n++){const date=new Date(Date.UTC(2026,8,14+n*7)),contracts=makeContracts(date);assert.deepEqual(contracts,makeContracts(date));assert.equal(contracts.length,3);const layout=JSON.stringify(contracts.map(c=>c.level));assert.notEqual(layout,previous);previous=layout;
  for(const c of contracts){const l=c.level,exit={x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2};for(const target of l.targets??[l.phone]){assert(findPath(l.spawn,target,l).length,`${c.id}: unreachable phone`);assert(findPath(target,exit,l).length,`${c.id}: unreachable exit`);}for(const guard of l.patrols)for(let i=0;i<guard.route.length;i++)assert(walkableSegment(guard.route[i]!,guard.route[(i+1)%guard.route.length]!,l),`${c.id}: blocked patrol`);}
 }
});
test('current three contracts have winning full-physics replays and exact server parity',()=>{
 for(const c of makeContracts(new Date('2026-09-14'))){const win=solveContract(c);assert(win,`${c.id} no complete route`);const result=verifyReplay(c.level.mission,win.replay,c.level);assert.equal(result.status,'won');assert.equal(result.ticks,win.ticks);assert(contractPoints(result,c.level)<=10000);assert(contractPoints(result,c.level)>0);}
});
test('exit window prevents extraction while closed; failed runs cannot score',()=>{
 const c=makeContracts(new Date('2026-09-14'))[2]!,s=initialState(c.level.mission,{...c.level,patrols:[]});s.x=c.level.exit.x+.5;s.y=c.level.exit.y+.5;s.carrying=true;s.elapsed=5;s.ticks=150;assert.equal(exitOpen(s),false);step(s,{x:0,y:0,interact:false,dash:0});assert.equal(s.extraction,0);assert.equal(contractPoints({status:'caught',score:999999,ticks:1},c.level),0);
});
test('.skr identity rejects expired, short, and wrong-program data',()=>{
 const data=new Uint8Array(200),wallet='11111111111111111111111111111111',program='ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK';data.set(getAddressEncoder().encode(wallet as any),40);assert.equal(decodeSkrOwner(data,program),wallet);assert.equal(decodeSkrOwner(data,'wrong'),null);assert.equal(decodeSkrOwner(data.subarray(0,20),program),null);new DataView(data.buffer).setBigUint64(104,1n,true);assert.equal(decodeSkrOwner(data,program),null);
});
