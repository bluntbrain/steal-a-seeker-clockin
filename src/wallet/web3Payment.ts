import {getTransactionEncoder,type Transaction,type TransactionWithBlockhashLifetime} from '@solana/kit';
import {Connection,VersionedTransaction,SendTransactionError,TransactionExpiredBlockheightExceededError} from '@solana/web3.js';
import {getBase58Decoder} from '@solana/kit';

type PaymentConnection=Pick<Connection,'sendRawTransaction'|'confirmTransaction'>;
type Options={rpcUrl:string;minContextSlot:bigint;sign:(transaction:VersionedTransaction)=>Promise<VersionedTransaction>;connection?:PaymentConnection;wait?:(ms:number)=>Promise<void>;log?:(stage:string)=>void};

// Ported from solscan-react-native feat/animations (41fda56c), useWallet.ts.
// Keep our prepared order's blockhash, payment instructions and receipt recovery.
export async function web3Payment(original:Transaction&TransactionWithBlockhashLifetime,options:Options){
 const log=options.log??(()=>{}),wait=options.wait??(ms=>new Promise<void>(r=>setTimeout(r,ms)));
 log('payment.web3.deserialize');
 const transaction=VersionedTransaction.deserialize(Uint8Array.from(getTransactionEncoder().encode(original)));
 const message=transaction.message.serialize();
 const signed=await options.sign(transaction);
 log('payment.web3.validate');
 const returnedMessage=signed.message.serialize();
 if(message.length!==returnedMessage.length||message.some((b,i)=>b!==returnedMessage[i])){
  log('payment.web3.message-changed');throw new Error('Wallet changed the payment. Nothing was submitted.');
 }
 const bytes=signed.signatures[0];
 if(signed.signatures.length!==1||!bytes||bytes.length!==64||bytes.every(b=>b===0)){
  log('payment.web3.signature-missing');throw new Error('Wallet did not return a signed payment. Nothing was submitted.');
 }
 log('payment.web3.serialize');
 const raw=signed.serialize(),signature=getBase58Decoder().decode(bytes);
 const connection=options.connection??new Connection(options.rpcUrl,{commitment:'confirmed',confirmTransactionInitialTimeout:30000});
 await wait(1000); // Same Android network-resume delay as the reference app.
 let accepted=false;
 for(let attempt=1;attempt<=3;attempt++){
  log(`payment.web3.send.${attempt}`);
  try{
   const returned=await connection.sendRawTransaction(raw,{skipPreflight:false,preflightCommitment:'confirmed',maxRetries:2,minContextSlot:Number(options.minContextSlot)});
   if(returned!==signature){log('payment.web3.signature-mismatch');throw new Error('RPC returned a different signature. Check payment before trying again.');}
   accepted=true;break;
  }catch(error){
   if(error instanceof SendTransactionError){log('payment.web3.preflight-failed');throw new Error(/insufficient|insufficientfunds/i.test(error.message)?'Not enough funds for this payment and its network fee.':'Solana rejected this payment. Tap Check payment before trying again.');}
   if(error instanceof Error&&error.message.startsWith('RPC returned'))throw error;
   log('payment.web3.transport-retry');if(attempt<3)await wait(1000);
  }
 }
 // A lost send response is not proof of failure. Always return the same signed
 // transaction's signature to the API; only its finalized receipt grants access.
 if(!accepted){log('payment.web3.submission-uncertain');return bytes;}
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),30000);
 try{
  log('payment.web3.confirm');
  const confirmation=await connection.confirmTransaction({signature,blockhash:transaction.message.recentBlockhash,lastValidBlockHeight:Number(original.lifetimeConstraint.lastValidBlockHeight),abortSignal:abort.signal},'confirmed');
  if(confirmation.value.err){log('payment.web3.execution-failed');throw new Error('The transaction failed on Solana. No purchase was completed.');}
  log('payment.web3.confirmed');
 }catch(error){
  if(error instanceof Error&&error.message==='The transaction failed on Solana. No purchase was completed.')throw error;
  log(error instanceof TransactionExpiredBlockheightExceededError?'payment.web3.expired':'payment.web3.confirmation-pending');
 }finally{clearTimeout(timer);}
 return bytes;
}
