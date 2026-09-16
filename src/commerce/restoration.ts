import type {AccountState,Order} from '../../shared/commerce';
export function needsReconciliation(order:Order,now=Date.now()){
 return order.status==='verifying'||order.status==='needs_review'||order.status==='quoted'&&(!!order.payment||!!order.signature||new Date(order.expiresAt).getTime()>now);
}
export function restoredCheckout(account:AccountState,orders:Order[],saved?:string|null,now=Date.now()){
 const active=orders.filter(o=>!account.entitlements.includes(o.sku)&&needsReconciliation(o,now));
 const order=active.find(o=>o.id===saved)??active[0];
 const message=account.entitlements.includes('campaign')?'Game Pass restored. Ranked weekly play is unlocked.':order?.status==='needs_review'?'This payment needs review. Do not pay again.':order?.signature?'Your payment is still being confirmed. Access or credits will update after verification.':order?.payment?'The wallet request is being checked. Do not pay again until this check finishes.':account.entitlements.length?'Your purchased items are restored.':"No completed Game Pass purchase was found. Campaign and practice are free.";
 return {order,message};
}
