import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyInventory,earnCredits,redeemCredits,creditReward,CREDIT_PACKS,STORE_ITEMS,isStoreItemForSale} from '../shared/store';
import {priceProduct} from '../server/pricing';
import {networkConfig} from '../server/network';
test('campaign credits reward first clears and only newly earned stars',()=>{let s=emptyInventory();s=earnCredits(s,'practice',1);assert.equal(s.balance,50);assert.strictEqual(earnCredits(s,'practice',1),s);s=earnCredits(s,'practice',3);assert.equal(s.balance,60);assert.strictEqual(earnCredits(s,'practice',2),s);assert.equal(creditReward(2),55);assert.equal(creditReward(4),0);assert.strictEqual(earnCredits(s,'practice',999),s);for(let n=2;n<=12;n++)s=earnCredits(s,String(n),3);assert.equal(s.balance,720);});
test('first outfit needs five perfect clears or six ordinary clears, without repeat farming',()=>{
 assert(STORE_ITEMS.filter(i=>isStoreItemForSale(i.id)).every(i=>i.price>=300),'No cheaper item bypasses the first-purchase progression');
 for(const stars of [1,2,3]){let s=emptyInventory();for(let n=1;n<=4;n++)s=earnCredits(s,String(n),stars);assert.throws(()=>redeemCredits(s,'night-courier'),/Not enough/);for(let repeat=0;repeat<20;repeat++)s=earnCredits(s,'1',stars);assert(s.balance<300);s=earnCredits(s,'5',stars);if(stars===3)assert.equal(redeemCredits(s,'night-courier').balance,0);else {assert.throws(()=>redeemCredits(s,'night-courier'),/Not enough/);s=earnCredits(s,'6',stars);assert(redeemCredits(s,'night-courier').balance>=0);}}
});
test('reward rebalance preserves old credits and previously purchased outfits',()=>{
 const old={...emptyInventory(),balance:725,stars:{practice:2},owned:['night-courier'] as const,equipment:{outfit:'night-courier'}};
 const inventory={...old,owned:[...old.owned]};assert.strictEqual(earnCredits(inventory,'practice',2),inventory);
 const upgraded=earnCredits(inventory,'practice',3);assert.equal(upgraded.balance,730);assert.deepEqual(upgraded.owned,inventory.owned);assert.equal(upgraded.equipment.outfit,'night-courier');
});
test('local store atomically debits once and equips; insufficient funds are unchanged',()=>{const s=emptyInventory();assert.throws(()=>redeemCredits(s,'night-courier'),/Not enough/);assert.equal(s.balance,0);const funded={...s,balance:500},bought=redeemCredits(funded,'night-courier');assert.equal(bought.balance,200);assert.equal(bought.equipment.outfit,'night-courier');assert.strictEqual(redeemCredits(bought,'night-courier'),bought);assert.throws(()=>redeemCredits(bought,'signal-runner'));});
test('live pass has two distinct choices and testing reduces both',()=>{const now=Date.now(),rates={SKR:'0.02',SOL:'100',at:now};const live=networkConfig({}),testing=networkConfig({TEST_PRICING:'true'});assert.equal(live.passSkr,500);assert.equal(testing.passSkr,1);assert.equal(priceProduct('campaign','SKR',rates,6,now,1,1000,{},live.passSkr).amount,'500000000');assert.equal(priceProduct('campaign','SOL',rates,6,now,1,1000,{},live.passSkr).amount,'100000000');assert.equal(priceProduct('campaign','SKR',rates,6,now,100,10,{},testing.passSkr).amount,'1000000');});
test('credit pack quote uses dollars, never its credited quantity or cosmetic token price',()=>{const now=Date.now(),rates={SKR:'0.02',SOL:'100',at:now};for(const p of CREDIT_PACKS){const sol=priceProduct(p.id,'SOL',rates,6,now);assert.equal(sol.usdCents,p.usdCents);const testPrice=priceProduct(p.id,'SKR',rates,6,now,100);assert(BigInt(testPrice.amount)<BigInt(priceProduct(p.id,'SKR',rates,6,now).amount));}});
