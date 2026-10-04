import test from 'node:test';
import assert from 'node:assert/strict';
import {addLoot,emptyLoot,newDefeats,lootCoin,lootPulse,lootArrival,lootAudioMask,LOOT_DURATION,LOOT_SLOTS,COINS_PER_DEFEAT} from '../src/components/defeat-loot';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {initialState} from '../src/game/simulation';

test('defeat detection works for every guard slot in all twelve campaign maps',()=>{
 assert.equal(CAMPAIGN_IDS.length,12);
 for(const mission of CAMPAIGN_IDS){const s=initialState(mission,combatLevel(mission)),hp=s.guards.map(g=>g.hp);
  for(let i=0;i<hp.length;i++){const after=[...hp];after[i]=0;assert.deepEqual(newDefeats(hp,after,10,11),[i],`${mission}/${i}`);assert.deepEqual(newDefeats(after,after,11,12),[]);}
 }
});
test('restoring corpses, nonfatal damage, pausing and restarting do not replay loot',()=>{
 assert.deepEqual(newDefeats(undefined,[0,20],0,100),[]);assert.deepEqual(newDefeats([50],[20],10,11),[]);
 assert.deepEqual(newDefeats([50],[0],10,10),[]);assert.deepEqual(newDefeats([50],[0],10,0),[]);
 assert.deepEqual(newDefeats([0],[0,0],10,11),[]);
});
test('coins burst then converge into the current courier position and expire',()=>{
 const b={started:0,x:3,y:4,seed:2};
 for(let i=0;i<COINS_PER_DEFEAT;i++){
  const burst=lootCoin(b,i,.13,10,10);assert(Math.hypot(burst.x-3,burst.y-3.82)>.65);assert(burst.scale>0);
  const a=lootCoin(b,i,.43,10,10),moving=lootCoin(b,i,.43,12,11);assert(moving.x>a.x);assert(moving.y>a.y);
  const end=lootCoin(b,i,LOOT_DURATION,12,11);assert.equal(end.scale,0);
  assert.equal(lootCoin(b,i,-1,0,0).scale,0);
 }
});
test('rapid defeats have a fixed pool and reduced effects avoid scattering',()=>{
 const pool=emptyLoot();for(let i=0;i<100;i++)addLoot(pool,{started:i,x:i,y:0,seed:i});
 assert.equal(pool.length,LOOT_SLOTS);assert.equal(Math.min(...pool.map(b=>b.started)),100-LOOT_SLOTS);
 const b={started:0,x:0,y:0,seed:0};assert.equal(lootCoin(b,2,.1,8,6,true).scale,0);
 const reduced=lootCoin(b,0,.1,8,6,true);assert(Math.abs(reduced.x-8)<.2);assert.equal(lootCoin(b,0,.3,8,6,true).scale,0);
});

test('fast pickup has wide spread, continuous launch and staggered arrival pulse',()=>{
 const b={started:0,x:3,y:4,seed:2};
 for(let i=0;i<COINS_PER_DEFEAT;i++){
  const launch=.18+i*.012;
  const before=lootCoin(b,i,launch-.00001,8,8),after=lootCoin(b,i,launch+.00001,8,8);
  assert(Math.hypot(after.x-before.x,after.y-before.y)<.001);
  const end=lootCoin(b,i,lootArrival(i)+.001,8,8);assert.equal(end.scale,0);assert.equal(end.x,8);assert.equal(end.y,7.82);
 }
 assert(lootPulse([b],.60).opacity>0);assert.equal(lootPulse([b],.8).opacity,0);
 assert.equal(lootPulse([b],.60,true).opacity,0);
 assert(lootPulse(Array(8).fill(b),.60).opacity<=.75);
});

test('spin uses six frames and arrival sounds coincide with visible collection',()=>{
 const b={started:0,x:0,y:0,seed:2},frames=new Set<number>();
 for(let t=0;t<.5;t+=.01){const p=lootCoin(b,0,t,3,3);frames.add(p.frame);assert(p.frame>=0&&p.frame<6);}
 assert.equal(frames.size,6);
 for(const [index,bit] of [[0,4],[4,8],[9,16]]){
  const at=lootArrival(index!);assert.equal(lootAudioMask(at-.001)&bit!,0);assert(lootAudioMask(at+.001)&bit!);
  assert(lootCoin(b,index!,at-.001,3,3).scale>0);assert.equal(lootCoin(b,index!,at+.001,3,3).scale,0);
 }
 assert.equal(lootAudioMask(-1),0);assert.equal(lootAudioMask(LOOT_DURATION),0);
});
test('scatter is broad and no flight teleports at its launch boundary',()=>{
 const b={started:10,x:5,y:7,seed:0};
 for(let i=0;i<10;i++){
  const p=lootCoin(b,i,10.16,5,7);assert(Math.hypot(p.x-5,p.y-7)>=1.2);
  const t=10+.18+i*.012,a=lootCoin(b,i,t-.000001,9,1),z=lootCoin(b,i,t+.000001,9,1);assert(Math.hypot(a.x-z.x,a.y-z.y)<.001);
 }
});
