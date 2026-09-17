import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COSTUMES,costumeFor,costumeFrame} from '../shared/costumes';
import {STORE_ITEMS,emptyInventory,redeemCredits,isStoreItemForSale} from '../shared/store';
import {readAccount} from '../src/commerce/account-model';
import {cardPortrait} from '../src/league/card';
import frames from '../assets/costumes-v4/frames.json';
import manifest from '../assets/costumes-v4/manifest.json';
import {CAMPAIGN_IDS} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap} from '../src/game/combat';
import {initialState,idleInput,step} from '../src/game/simulation';

test('all six costumes have distinct portraits, eight poses and stable old inventory IDs',()=>{
 assert.equal(COSTUMES.length,6);assert.equal(manifest.length,6);assert.equal(frames.length,8);
 for(const c of COSTUMES){assert(manifest.some(m=>m.name===c.asset&&m.frames===8));assert(readFileSync(`assets/costumes-v4/${c.asset}.png`).length>10000);}
 assert.equal(costumeFor('signal-runner').name,'Frost Runner');assert.equal(costumeFor('ghost-courier').name,'Ghost Signal');
 assert.equal(costumeFor('unknown').id,'default');
 const base={week:'2026-09-14',rank:null,points:0,cleared:0,ticks:0,domain:null,wallet:'test',final:false,local:true,earned:false};
 assert.equal(new Set(COSTUMES.map(c=>cardPortrait({...base,outfit:c.id}))).size,6);
});
test('courier art faces its movement direction and every walking frame stays inside its atlas',()=>{
 assert.deepEqual([0,1,2,3].map(i=>costumeFrame(i,false)),[0,1,2,3]);
 assert.deepEqual([0,1,2,3].map(i=>costumeFrame(i,true)),[4,5,6,7]);
 for(const f of frames){assert(f.x>=0&&f.y>=0&&f.x+f.width<=1024&&f.y+f.height<=768);}
});
test('campaign spawn shows the backpack and real movement selects the correct view in both control modes',()=>{
 for(const id of CAMPAIGN_IDS)assert.equal(costumeFrame(initialState(id,combatLevel(id)).facing,false),2,`${id} starts facing away`);
 const views=[{x:0,y:-1,frame:2},{x:0,y:1,frame:0},{x:-1,y:0,frame:1},{x:1,y:0,frame:3}];
 for(const combat of [false,true])for(const view of views){
  const level={...combatLevel('practice'),spawn:{x:6,y:10},phone:{x:10,y:2},blockers:[],patrols:[],combat:combat?combatLevel('practice').combat:undefined};
  const state=initialState('practice',level),target={x:6+view.x*2,y:10+view.y*2};
  for(let i=0;i<5;i++)step(state,combat?{...idleInput(),command:i===0?combatTap(state,target.x,target.y,1):undefined}:{...idleInput(),x:view.x,y:view.y});
  assert((state.x-6)*view.x+(state.y-10)*view.y>0,'Courier actually moved toward the input');
  assert.equal(costumeFrame(state.facing,false),view.frame,`${combat?'tap':'stick'} standing pose`);
  assert.equal(costumeFrame(state.facing,true),view.frame+4,`${combat?'tap':'stick'} walking pose`);
 }
});
test('only implemented outfits and the escape trail are on sale, and wallet inventory restores new outfits',()=>{
 const items=STORE_ITEMS.filter(i=>isStoreItemForSale(i.id));assert.equal(items.length,5);
 for(const id of ['profile-frame','rack-theme'] as const)assert.throws(()=>redeemCredits({...emptyInventory(),balance:10000},id),/no longer/);
 let inventory={...emptyInventory(),balance:1800};
 for(const item of items.filter(i=>i.kind==='outfit'))inventory=redeemCredits(inventory,item.id);
 assert.equal(inventory.balance,0);assert.equal(inventory.equipment.outfit,'archive-keeper');
 const account=readAccount({wallet:'test',credits:0,entitlements:inventory.owned,equipment:inventory.equipment,progress:{}},'test');
 assert.equal(account?.equipment.outfit,'archive-keeper');assert(!account?.entitlements.includes('campaign'));
});
