import test from 'node:test';import assert from 'node:assert/strict';
import {networkConfig} from '../server/network';
import {MAINNET_SKR_MINT,GENESIS} from '../shared/network';
import {priceProduct} from '../server/pricing';
import {paymentTransaction} from '../src/commerce/payment';
import type {Order} from '../shared/commerce';
test('Mainnet requires explicit enablement and tester allowlist; devnet remains the default',()=>{
 assert.equal(networkConfig({}).cluster,'solana:devnet');
 assert.throws(()=>networkConfig({SOLANA_NETWORK:'mainnet'}),/explicit enablement/);
 assert.throws(()=>networkConfig({SOLANA_NETWORK:'mainnet',MAINNET_TEST_ENABLED:'1'}),/tester wallets/);
 const n=networkConfig({SOLANA_NETWORK:'mainnet',MAINNET_TEST_ENABLED:'1',MAINNET_TEST_WALLETS:'wallet',SHOP_PRICE_DIVISOR:'10',GAME_PASS_USD_CENTS:'100',DEVNET_TEST_MINT:'wrong-mint',DEVNET_SIGNER_JSON:'devnet-key'});
 assert.equal(n.mint,MAINNET_SKR_MINT);assert.equal(n.decimals,6);assert.equal(n.signerJson,undefined);assert.equal(n.priceDivisor,10);assert.equal(n.rpcUrl,'https://api.mainnet-beta.solana.com');assert.notEqual(GENESIS[n.cluster],GENESIS['solana:devnet']);
});
test('Mainnet test pass is one dollar in either token, cosmetics are ten times cheaper',()=>{
 const now=Date.now(),rates={SKR:'0.02',SOL:'100',at:now};
 const skr=priceProduct('campaign','SKR',rates,6,now,10),sol=priceProduct('campaign','SOL',rates,6,now,10);
 assert.equal(skr.amount,'50000000');assert.equal(sol.amount,'10000000');assert.equal(skr.usdCents,100);assert.equal(sol.usdCents,100);
 assert.equal(priceProduct('night-courier','SKR',rates,6,now,10).amount,'2000000');
 assert.equal(priceProduct('escape-trail','SKR',rates,6,now,10).amount,'800000');
 assert.equal(priceProduct('campaign','SKR',rates,6,now).usdCents,1000);
});
test('a devnet client refuses a Mainnet payment before constructing or signing it',()=>{
 assert.throws(()=>paymentTransaction({cluster:'solana:mainnet'} as Order),/different network/);
});

test('prices and rewards use validated environment settings',()=>{const n=networkConfig({GAME_PASS_USD_CENTS:'250',SHOP_PRICE_DIVISOR:'5',CAMPAIGN_REBATE_SKR:'12'});assert.equal(n.campaignUsdCents,250);assert.equal(n.priceDivisor,5);assert.equal(n.rebateSkr,12);for(const value of ['0','-2','NaN','1.5'])assert.throws(()=>networkConfig({GAME_PASS_USD_CENTS:value}),/Invalid pricing/);const now=Date.now();assert.equal(priceProduct('campaign','SOL',{SKR:'0.02',SOL:'100',at:now},6,now,10,250).usdCents,250);});

test('individual shop settings override the general discount',()=>{
 const config=networkConfig({SHOP_PRICES_SKR_JSON:'{"night-courier":"1.5"}'}),now=Date.now();
 assert.equal(priceProduct('night-courier','SKR',{SKR:'0.02',SOL:'100',at:now},6,now,10,100,config.shopPrices).amount,'1500000');
 for(const json of ['{"campaign":1}','{"night-courier":-1}','{"unknown":2}','[]'])assert.throws(()=>networkConfig({SHOP_PRICES_SKR_JSON:json}),/Invalid/);
});
