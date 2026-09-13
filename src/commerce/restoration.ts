import type {AccountState,Order} from '../../shared/commerce';
export function needsReconciliation(order:Order,now=Date.now()){
 return order.status==='verifying'||order.status==='needs_review'||order.status==='quoted'&&(!!order.payment||!!order.signature||new Date(order.expiresAt).getTime()>now);
}
export function restoredCheckout(account:AccountState,orders:Order[],saved?:string|null,now=Date.now()){
 const active=orders.filter(o=>!account.entitlements.includes(o.sku)&&needsReconciliation(o,now));
 const order=active.find(o=>o.id===saved)??active[0];
 const message=account.entitlements.includes('campaign')?'Campaign unlocked. You can play now.':order?.status==='needs_review'?'This payment needs review. Do not pay again.':order?.signature?'Your payment is still being confirmed. Campaign access will unlock after verification.':order?.payment?'The earlier approval is unfinished. Resume it or check again after it expires.':account.entitlements.length?'Your purchased items are restored.':"No completed campaign purchase was found. You haven’t unlocked the campaign yet.";
 return {order,message};
}
