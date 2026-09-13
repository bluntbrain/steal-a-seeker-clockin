import test from 'node:test';
import assert from 'node:assert/strict';
import {CoinbasePriceFeed,priceProduct,rateUnits} from '../server/pricing';
const rates={SKR:'0.0183675',SOL:'101.305',at:Date.now()};
test('campaign rounds both methods up to at least ten dollars, using integer arithmetic',()=>{
 for(const currency of ['SKR','SOL'] as const){const quote=priceProduct('campaign',currency,rates,6);const scale=10n**BigInt(quote.decimals);assert.ok(BigInt(quote.amount)*rateUnits(quote.rateUsd)>=10n*1_000_000_000n*scale);const step=currency==='SKR'?1_000_000n:100_000n;assert.ok((BigInt(quote.amount)-step)*rateUnits(quote.rateUsd)<10n*1_000_000_000n*scale);assert.ok(quote.usdCents>=1000);}
 assert.equal(priceProduct('campaign','SKR',rates,6).amount,'545000000');
 assert.equal(priceProduct('campaign','SOL',rates,6).amount,'98800000');
});
test('cosmetics preserve SKR price and receive a SOL alternative',()=>{
 assert.equal(priceProduct('night-courier','SKR',rates,6).amount,'20000000');
 const sol=priceProduct('night-courier','SOL',rates,6);assert.ok(sol.usdCents>=37);assert.equal(sol.currency,'SOL');
});
test('invalid, zero, and stale prices fail closed',()=>{
 for(const rate of ['0','-1','NaN','Infinity','1e9','0.1234567891'])assert.throws(()=>rateUnits(rate));
 assert.throws(()=>priceProduct('campaign','SOL',{...rates,at:Date.now()-61000},6),/expired/);
});
test('rate provider caches fresh results, rejects mismatched currency, never serves expired cache after failure',async()=>{
 let now=10000,calls=0,fail=false;
 const feed=new CoinbasePriceFeed((async(url)=>{calls++;if(fail)throw Error('offline');const base=String(url).includes('SKR')?'SKR':'SOL';return new Response(JSON.stringify({data:{base,currency:'USD',amount:rates[base]}}));}) as typeof fetch,()=>now);
 await Promise.all([feed.rates(),feed.rates()]);assert.equal(calls,2);await feed.rates();assert.equal(calls,2);now+=61000;fail=true;await assert.rejects(feed.rates(),/offline/);
 const bad=new CoinbasePriceFeed((async()=>new Response(JSON.stringify({data:{base:'BTC',currency:'USD',amount:'100'}}))) as typeof fetch);await assert.rejects(bad.rates(),/Invalid/);
});
