import test from 'node:test';
import assert from 'node:assert/strict';
import {needsReconciliation,restoredCheckout} from '../src/commerce/restoration';
import type {AccountState,Order} from '../shared/commerce';
const account={wallet:'buyer',entitlements:[],equipment:{},progress:{}} as AccountState;
const order=(extra:Partial<Order>={})=>({id:'old',sku:'campaign',status:'quoted',expiresAt:new Date(0).toISOString(),signature:null,...extra}) as Order;
test('restore never claims ownership when no purchase was completed',()=>{
 const result=restoredCheckout(account,[order()],'old');assert.equal(result.order,undefined);assert.match(result.message,/No completed Game Pass purchase/);assert.equal(needsReconciliation(order()),false);
});
test('restoration recovers a pending order even when its local pointer is missing',()=>{
 const pending=order({id:'new',status:'verifying',signature:'sig'});const result=restoredCheckout(account,[pending,order()],'old');assert.equal(result.order,pending);assert.match(result.message,/still being confirmed/);
});
test('confirmed entitlement wins over stale local pending order',()=>{
 const result=restoredCheckout({...account,entitlements:['campaign']},[order({status:'verifying'})],'old');assert.equal(result.order,undefined);assert.match(result.message,/Game Pass restored/);
});
