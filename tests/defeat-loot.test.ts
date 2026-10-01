import test from 'node:test';
import assert from 'node:assert/strict';
import {addLoot,emptyLoot,newDefeats,lootCoin,LOOT_DURATION,LOOT_SLOTS,COINS_PER_DEFEAT} from '../src/components/defeat-loot';
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
  const burst=lootCoin(b,i,.27,10,10);assert(Math.hypot(burst.x-3,burst.y-3.82)>.2);assert(burst.scale>0);
  const a=lootCoin(b,i,.9,10,10),moving=lootCoin(b,i,.9,12,11);assert(moving.x>a.x);assert(moving.y>a.y);
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
