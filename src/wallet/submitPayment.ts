import {getBase58Decoder,getBase64EncodedWireTransaction,type Transaction,type TransactionWithBlockhashLifetime} from '@solana/kit';
// Phantom signs; the app submits identical signed bytes to its configured RPC.
// A transport retry never opens the wallet or creates a different payment.
export async function submitPayment(original:Transaction&TransactionWithBlockhashLifetime,signed:Transaction,options:{rpcUrl:string;minContextSlot:bigint;fetcher?:typeof fetch;wait?:(ms:number)=>Promise<void>;log?:(stage:string)=>void}){
 const fetcher=options.fetcher??fetch,wait=options.wait??(ms=>new Promise(r=>setTimeout(r,ms))),log=options.log??(()=>{});
 if(original.messageBytes.length!==signed.messageBytes.length||original.messageBytes.some((b,i)=>b!==signed.messageBytes[i]))throw new Error('Wallet changed the payment. Nothing was submitted.');
 const buyers=Object.keys(original.signatures),bytes=signed.signatures[buyers[0] as keyof typeof signed.signatures];
 if(buyers.length!==1||!bytes||bytes.length!==64||bytes.every(b=>b===0))throw new Error('Wallet did not return a signed payment. Nothing was submitted.');
 const signature=getBase58Decoder().decode(bytes),wire=getBase64EncodedWireTransaction(signed);
 class RpcFailure extends Error{constructor(message:string,public retryable:boolean){super(message);}}
 async function rpc(method:string,params:unknown[]){
  const response=await fetcher(options.rpcUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new RpcFailure('Devnet connection unavailable. Check payment before trying again.',response.status===429||response.status>=500);
  const body=await response.json() as {result:any;error?:{code:number;message?:string;data?:{logs?:string[]}}};
  if(body.error){const e=body.error,detail=[e.message,...(e.data?.logs??[])].join(' ');throw new RpcFailure(/insufficient|insufficientfunds/i.test(detail)?'Not enough devnet funds for this payment and its network fee.':e.code===-32002?'Devnet rejected this transaction during preflight. No purchase has been confirmed.':'Devnet could not accept the payment. Check payment before trying again.',[-32004,-32005,-32016].includes(e.code));}
  return body.result;
 }
 await wait(1000); // Allow the Android network to resume after Phantom closes.
 let accepted=false;
 for(let attempt=0;attempt<3;attempt++){
  log(`payment.rpc.send.${attempt+1}`);
  try{const result=await rpc('sendTransaction',[wire,{encoding:'base64',skipPreflight:false,preflightCommitment:'confirmed',maxRetries:2,minContextSlot:Number(options.minContextSlot)}]);if(result!==signature)throw new RpcFailure('RPC returned a different signature. Check payment before trying again.',false);accepted=true;break;}
  catch(e){if(e instanceof RpcFailure&&!e.retryable){log('payment.rpc.preflight-failed');throw e;}log('payment.rpc.transport-retry');if(attempt<2)await wait(1000);}
 }
 for(let attempt=0;attempt<12;attempt++){
  try{const result=await rpc('getSignatureStatuses',[[signature],{searchTransactionHistory:true}]),status=result.value[0];
   if(status?.err){log('payment.rpc.execution-failed');throw new RpcFailure('The transaction failed on devnet. No campaign purchase was completed.',false);}
   if(status?.confirmationStatus==='confirmed'||status?.confirmationStatus==='finalized'){log('payment.rpc.confirmed');return bytes;}
   const height=await rpc('getBlockHeight',[{commitment:'confirmed',minContextSlot:Number(options.minContextSlot)}]);
   if(BigInt(height)>original.lifetimeConstraint.lastValidBlockHeight){log('payment.rpc.expired');break;}
  }catch(e){if(e instanceof RpcFailure&&!e.retryable)throw e;log('payment.rpc.confirmation-retry');}
  if(attempt<11)await wait(2000);
 }
 // Preserve the locally derived signature even if the send response was lost.
 // The API must still verify finality; a returned signature never grants access.
 log(accepted?'payment.rpc.confirmation-pending':'payment.rpc.submission-uncertain');return bytes;
}
