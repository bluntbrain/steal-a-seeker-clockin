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

test('backend price profiles validate overrides and keep test and live prices separate',()=>{
 const env={CREDIT_PACK_USD_CENTS_JSON:'{"credits-500":225}',TEST_CREDIT_PACK_USD_CENTS_JSON:'{"credits-500":2.5}',STORE_CREDIT_PRICES_JSON:'{"night-courier":350}'};
 const live=networkConfig(env),cheap=networkConfig({...env,TEST_PRICING:'true'}),now=Date.now(),rates={SKR:'0.02',SOL:'100',at:now};
 assert.equal(live.creditPackPrices['credits-500'],225);assert.equal(cheap.creditPackPrices['credits-500'],2.5);assert.equal(cheap.storeCreditPrices['night-courier'],350);
 assert.equal(priceProduct('credits-500','SOL',rates,6,now,1,1000,{},500,live.creditPackPrices).amount,'22500000');
 assert.equal(priceProduct('credits-500','SOL',rates,6,now,100,10,{},1,cheap.creditPackPrices).amount,'300000');
 for(const bad of ['[]','{"unknown":20}','{"credits-500":0}','{"credits-500":-1}','{"credits-500":"20"}','{"credits-500":1.5}'])assert.throws(()=>networkConfig({CREDIT_PACK_USD_CENTS_JSON:bad}),/Invalid pricing/);
 for(const bad of ['{"night-courier":0}','{"night-courier":2.5}','{"profile-frame":200}','{"campaign":300}'])assert.throws(()=>networkConfig({STORE_CREDIT_PRICES_JSON:bad}),/Invalid pricing/);
 assert.throws(()=>networkConfig({TEST_CREDIT_PACK_USD_CENTS_JSON:'{"credits-500":0.001}'}),/Invalid pricing/);
 // Legacy divisors still use exact rational arithmetic for packs without an override.
 assert(BigInt(priceProduct('credits-500','SOL',rates,6,now,3).amount)>0n);
});
test('guest redemption uses the displayed configured price and remains idempotent',()=>{
 const funded={...emptyInventory(),balance:500};const bought=redeemCredits(funded,'night-courier',350);
 assert.equal(bought.balance,150);assert.strictEqual(redeemCredits(bought,'night-courier',400),bought);
 for(const p of [0,-1,1.5,NaN])assert.throws(()=>redeemCredits(funded,'night-courier',p),/Invalid store price/);
});

test('Solana character skins are retired: not for sale, no credit redemption, owners keep them',()=>{
 const skins=STORE_ITEMS.filter(i=>i.id.startsWith('solana-'));
 assert.equal(skins.length,7);
 for(const skin of skins){assert.equal(isStoreItemForSale(skin.id),false);assert.throws(()=>redeemCredits({...emptyInventory(),balance:10000},skin.id),/no longer/);const owner={...emptyInventory(),owned:[skin.id],equipment:{outfit:skin.id}};assert.strictEqual(redeemCredits(owner,skin.id),owner);}
 assert.equal(isStoreItemForSale('escape-trail'),false);
 const owned={...emptyInventory(),owned:['escape-trail' as const],equipment:{trail:'escape-trail'}};assert.strictEqual(redeemCredits(owned,'escape-trail'),owned);
});
test('direct outfit checkout has configurable SKR and converted SOL prices, independent of credits',()=>{
 const now=Date.now(),rates={SKR:'0.02',SOL:'100',at:now};
 assert.equal(priceProduct('night-courier','SKR',rates,6,now).amount,'20000000');
 assert.equal(priceProduct('night-courier','SOL',rates,6,now).amount,'4000000');
 assert.equal(priceProduct('night-courier','SKR',rates,6,now,1,undefined,{'night-courier':'125'}).amount,'125000000');
 assert.equal(networkConfig({STORE_CREDIT_PRICES_JSON:'{"circuit-scout":3200}'}).storeCreditPrices['circuit-scout'],3200);
});
test('local credits pay the published rate for levels past twelve and double it for bosses',async()=>{
 const {emptyInventory,earnCredits,PUBLISHED_CLEAR_CREDITS,BOSS_CLEAR_CREDITS,CAMPAIGN_STAR_BONUS}=await import('../shared/store');
 let s=earnCredits(emptyInventory(),'campaign:13',1);assert.equal(s.balance,PUBLISHED_CLEAR_CREDITS);
 s=earnCredits(s,'campaign:13',3);assert.equal(s.balance,PUBLISHED_CLEAR_CREDITS+2*CAMPAIGN_STAR_BONUS);
 s=earnCredits(s,'campaign:13',2);assert.equal(s.balance,PUBLISHED_CLEAR_CREDITS+2*CAMPAIGN_STAR_BONUS,'a worse run never pays again');
 s=earnCredits(s,'campaign:15',2,true);assert.equal(s.balance,PUBLISHED_CLEAR_CREDITS+2*CAMPAIGN_STAR_BONUS+BOSS_CLEAR_CREDITS+CAMPAIGN_STAR_BONUS);
});
