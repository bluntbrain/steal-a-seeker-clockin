import {TransactionMessage,VersionedTransaction,type TransactionInstruction} from '@solana/web3.js';

// Compare payment meaning rather than compiled account-index ordering. Wallets
// can recompile an equivalent message without changing what the user approved.
export function validatePayment(original:VersionedTransaction,signed:VersionedTransaction,log:(stage:string)=>void=()=>{}){
 const differences:string[]=[];
 function reject(reason:string){log(`payment.web3.changed.${reason}`);differences.push(reason);}
 function fail():never{throw new Error(`Wallet changed the payment (${differences.join(', ')}). Nothing was submitted.`);}
 if(signed.message.addressTableLookups.length){reject('lookup-tables');fail();}
 if(original.message.recentBlockhash!==signed.message.recentBlockhash)reject('blockhash');
 if(!original.message.staticAccountKeys[0]!.equals(signed.message.staticAccountKeys[0]!))reject('fee-payer');
 if(signed.message.header.numRequiredSignatures!==1)reject('signers');
 const before=TransactionMessage.decompile(original.message),after=TransactionMessage.decompile(signed.message);
 const shape=(i:TransactionInstruction)=>({program:i.programId.toBase58(),data:Array.from(i.data),keys:i.keys.map(k=>({key:k.pubkey.toBase58(),signer:k.isSigner,writable:k.isWritable}))});
 if(before.instructions.length!==after.instructions.length)reject('instruction-count');
 for(let i=0;i<Math.min(before.instructions.length,after.instructions.length);i++){
  const a=shape(before.instructions[i]!),b=shape(after.instructions[i]!);
  if(a.program!==b.program)reject(`program-${i}`);
  if(JSON.stringify(a.keys)!==JSON.stringify(b.keys))reject(`accounts-${i}`);
  if(JSON.stringify(a.data)!==JSON.stringify(b.data))reject(`data-${i}`);
 }
 if(differences.length)fail();
 log('payment.web3.instructions-verified');
}
