import test from 'node:test';
import assert from 'node:assert/strict';
import {PublicKey} from '@solana/web3.js';
import {NameRecordHeader} from '@onsol/tldparser';
import {WalletNames,lookupSkrNames} from './wallet-names';
import {isSkrName,leaderboardName} from '../shared/wallet-name';
import {createApp} from './app';
import type {CommerceService} from './service';
import type {CampaignBoard} from '../shared/economy';
const wallet=(n:number)=>new PublicKey(new Uint8Array(32).fill(n)).toBase58();
const a=wallet(1),b=wallet(2),c=wallet(3);
test('installed SDK decodes binary name accounts with its required Borsh version',()=>{
 // Fixed on-chain layout: discriminator, parent, owner, class, dates, flags, padding.
 // This exercises the real SDK decoder; a mocked parser missed an incompatible Borsh 0.7 install.
 const data=Buffer.alloc(200);Buffer.from([68,72,88,44,15,167,103,243]).copy(data);
 new PublicKey(a).toBuffer().copy(data,40);
 const record=NameRecordHeader.fromAccountInfo({data,owner:PublicKey.default,lamports:1,executable:false,rentEpoch:0});
 assert.equal(record.owner?.toBase58(),a);assert.equal(record.isValid,true);
});
const board=(wallets=[a]):CampaignBoard=>({board:wallets.map((wallet,i)=>({wallet,rank:i+1,score:1500-i,cleared:1,ticks:100,clean:1,battery:90})),personal:{wallet:a,rank:1,score:1500,cleared:1,ticks:100,clean:1,battery:90},participants:wallets.length});
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const parser=(overrides:Partial<Parameters<typeof lookupSkrNames>[0]>={})=>({getMainDomains:async(ws:string[])=>ws.map(()=>null),getParsedAllUserDomainsFromTld:async()=>[] as {domain:string}[],getOwnerFromDomainTld:async()=>undefined,...overrides});
test('primary .skr is forward checked; missing/other-TLD primary falls back and names include suffix only once',async()=>{
 const owners:Record<string,string>={'alice.skr':a,'bob.skr':b,'zed.skr':b};const queried:string[]=[];
 const result=await lookupSkrNames(parser({getMainDomains:async()=>['alice.skr','bob.sol',null],getParsedAllUserDomainsFromTld:async(w,tld)=>{assert.equal(tld,'skr');queried.push(w);return w===b?[{domain:'zed.skr'},{domain:'bob.skr'}]:[];},getOwnerFromDomainTld:async name=>owners[name]}),[a,b,c],new AbortController().signal);
 assert.deepEqual([...result].sort(),[[a,'alice.skr'],[b,'bob.skr'],[c,null]].sort());assert.ok(!queried.includes(a));
});
test('transferred, invalid and expired domains are rejected; owner API supports wrapped names',async()=>{
 const result=await lookupSkrNames(parser({getMainDomains:async()=>['old.skr'],getParsedAllUserDomainsFromTld:async()=>[{domain:'expired.skr'},{domain:'wrapped.skr'}],getOwnerFromDomainTld:async name=>name==='old.skr'?b:name==='wrapped.skr'?new PublicKey(a):undefined}),[a],new AbortController().signal);
 assert.equal(result.get(a),'wrapped.skr');
});
test('RPC errors are not represented as a confirmed absence; failed primary read can recover through owned lookup',async()=>{
 const p=parser({getMainDomains:async()=>{throw Error('RPC');},getParsedAllUserDomainsFromTld:async w=>{if(w===b)throw Error('429');return [{domain:'alice.skr'}];},getOwnerFromDomainTld:async()=>a});
 const result=await lookupSkrNames(p,[a,b],new AbortController().signal);assert.equal(result.get(a),'alice.skr');assert.equal(result.has(b),false);
});
test('cache never blocks scores, deduplicates concurrent requests, decorates own row and keeps ranks unchanged',async()=>{
 let calls=0,release!:(r:Map<string,string|null>)=>void;
 const names=new WalletNames(async()=>{calls++;return new Promise(resolve=>{release=resolve;});});
 const original=board([a,b]);for(let i=0;i<5;i++){const pending=names.enrich(original);assert.equal(pending.namesPending,true);assert.equal(pending.board[0]!.score,1500);}
 await tick();assert.equal(calls,1);release(new Map([[a,'alice.skr'],[b,null]]));await tick();
 const named=names.enrich(original);assert.equal(named.personal?.displayName,'alice.skr');assert.equal(named.board[0]?.displayName,'alice.skr');assert.equal(named.namesPending,false);assert.equal(named.board[1]?.displayName,undefined);assert.equal(original.personal?.displayName,undefined);assert.equal(calls,1);names.close();
});
test('expiry rechecks ownership, negative TTL is shorter, failures retry without retaining expired labels',async()=>{
 let now=0,calls=0;const names=new WalletNames(async()=>{calls++;if(calls===1)return new Map([[a,'alice.skr'],[b,null]]);throw Error('offline');},{now:()=>now,positiveMs:100,negativeMs:20,retryMs:5});
 names.enrich(board([a,b]));await tick();now=21;names.enrich(board([a,b]));await tick();assert.equal(calls,2);assert.equal(names.enrich(board([a])).personal?.displayName,'alice.skr');
 now=101;assert.equal(names.enrich(board([a])).personal?.displayName,undefined);await tick();assert.equal(names.enrich(board([a])).namesPending,false);now=107;assert.equal(names.enrich(board([a])).namesPending,true);await tick();names.close();
});
test('timeout aborts RPC work, preserves completed results and releases pending state',async()=>{
 let signal:AbortSignal|undefined;const names=new WalletNames(async(_ws,s,onResult)=>{signal=s;onResult?.(a,'alice.skr');return new Promise(()=>{});},{timeoutMs:10});
 names.enrich(board([a,b]));await new Promise(r=>setTimeout(r,25));assert.equal(signal?.aborted,true);const result=names.enrich(board([a,b]));assert.equal(result.namesPending,false);assert.equal(result.personal?.displayName,'alice.skr');names.close();
});
test('invalid wallets and queue/cache limits bound work',async()=>{
 const batches:string[][]=[];const names=new WalletNames(async ws=>{batches.push(ws);return new Map(ws.map(w=>[w,'ok.skr']));},{maxPending:2,maxEntries:1});
 names.enrich({...board([a,b,c]),personal:null});await tick();assert.deepEqual(batches,[[a,b]]);
 const result=names.enrich({...board(['invalid']),personal:null});assert.equal(result.namesPending,false);names.close();
});
test('display rejects control/bidi names, preserves valid unicode, shows names for self and falls back',()=>{
 assert.equal(isSkrName('alice.skr'),true);assert.equal(isSkrName('नमस्ते.skr'),true);for(const value of ['a.skr.skr','evil\u202E.skr','a b.skr','.skr','a.sol','a'.repeat(65)+'.skr'])assert.equal(isSkrName(value),false,value);
 assert.equal(leaderboardName({wallet:a,displayName:'alice.skr'},a),'alice.skr');assert.equal(leaderboardName({wallet:a},a),'You');assert.equal(leaderboardName({wallet:a,displayName:'evil\u202E.skr'}),`${a.slice(0,5)}…${a.slice(-5)}`);
});
test('HTTP campaign board returns cached names without changing rankings and works while lookup fails',async()=>{
 const row={...board().board[0]!,participants:1};const service={pool:{query:async()=>({rows:[row]})},config:{}} as unknown as CommerceService;
 const names=new WalletNames(async()=>new Map([[a,'alice.skr']]));const app=await createApp(service,names);
 try{const first=await app.inject({url:'/campaign/leaderboard'});assert.equal(first.statusCode,200);await tick();const response=await app.inject({url:'/campaign/leaderboard'});assert.equal(response.statusCode,200);assert.equal(response.json().board[0].displayName,'alice.skr');assert.equal(response.json().board[0].score,1500);assert.equal(response.json().personal,null);}finally{await app.close();}
 const unavailable=await createApp(service,new WalletNames(async()=>{throw Error('RPC offline');}));try{const response=await unavailable.inject({url:'/campaign/leaderboard'});assert.equal(response.statusCode,200);assert.equal(response.json().board[0].wallet,a);}finally{await unavailable.close();}
});
