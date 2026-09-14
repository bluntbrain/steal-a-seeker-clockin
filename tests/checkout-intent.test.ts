import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCheckoutPrice} from '../src/commerce/checkout-intent';
import type {Order} from '../shared/commerce';
import type {PriceSnapshot} from '../shared/pricing';
const price:PriceSnapshot={currency:'SOL',usdCents:1000,rateUsd:'100',quotedAt:new Date().toISOString(),source:'Coinbase spot',amount:'100000000',decimals:9};
const order={sku:'campaign',status:'quoted',currency:'SOL',amount:price.amount,decimals:9,pricing:price,signature:null} as Order;
test('exact displayed price can continue to wallet approval',()=>assert(matchesCheckoutPrice(order,'campaign',price)));
test('changed price, method or product requires another explicit review',()=>{
 for(const change of [{amount:'110000000'},{amount:'90000000'},{currency:'SKR'},{decimals:6},{sku:'night-courier'},{pricing:{...price,usdCents:1100}}]) assert.equal(matchesCheckoutPrice({...order,...change} as Order,'campaign',price),false);
 assert.equal(matchesCheckoutPrice(order,'campaign',undefined),false);
});
test('existing submitted, prepared and fulfilled orders never automatically pay again',()=>{
 for(const change of [{status:'fulfilled'},{status:'verifying'},{status:'needs_review'},{signature:'submitted'},{payment:{id:'prepared'}}]) assert.equal(matchesCheckoutPrice({...order,...change} as Order,'campaign',price),false);
});
