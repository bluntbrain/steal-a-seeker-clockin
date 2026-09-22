import {RpcError} from './chain';

/** Never log RPC URLs, signed payloads, SQL values or credential-bearing messages. */
export function paymentDiagnostic(error:unknown){
 if(error instanceof RpcError)return {kind:'rpc',method:error.method,code:error.code};
 const code=(error as {code?:unknown})?.code;
 if(typeof code==='string'&&/^[0-9A-Z]{5}$/.test(code))return {kind:'database',code};
 return {kind:'internal',name:error instanceof Error?error.name:'UnknownError'};
}
export function unavailableMessage(route:string){
 if(route.startsWith('/league')||route.startsWith('/runs'))return 'Competition service temporarily unavailable. Keep your saved run and retry.';
 if(route.endsWith('/prepare'))return 'Could not prepare wallet approval. No new payment was requested. Try again shortly. If you approved an earlier payment, use Check payment.';
 if(route.endsWith('/transaction')||route.endsWith('/reconcile'))return 'Payment confirmation is temporarily unavailable. Use Check payment or Restore purchases. Do not send another payment.';
 if(route==='/orders')return 'Could not load or create the order. No new wallet payment was requested. Try again shortly.';
 return 'Service temporarily unavailable. Please try again shortly.';
}
