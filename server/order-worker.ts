import type {CommerceService} from './service';
import {paymentDiagnostic} from './payment-errors';

/** Back off all attempts, including failures. Old quotes must not starve actual payments. */
export async function reconcileOrders(service:CommerceService,warn:(fields:object,message:string)=>void){
 const rows=await service.pool.query(`SELECT id FROM orders
  WHERE status IN ('quoted','verifying') AND created_at>now()-interval '2 days'
  AND (checked_at IS NULL OR checked_at<now()-CASE
    WHEN payment_authorization IS NOT NULL OR signature IS NOT NULL THEN interval '30 seconds'
    ELSE interval '5 minutes' END)
  ORDER BY (payment_authorization IS NOT NULL OR signature IS NOT NULL) DESC,checked_at NULLS FIRST LIMIT 4`);
 for(const row of rows.rows){
  // Reserve the next check before RPC work, so failed requests also back off.
  await service.pool.query('UPDATE orders SET checked_at=now() WHERE id=$1',[row.id]);
  try{await service.reconcile(row.id);}catch(error){warn({orderId:row.id,diagnostic:paymentDiagnostic(error)},'Payment reconciliation will retry.');}
 }
}
