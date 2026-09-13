import {createSignInMessage} from '@solana/wallet-standard-util';
import type {SolanaSignInInput} from '@solana/wallet-standard-features';

// MWA sign_messages returns the message followed by its 64-byte signature.
export function unpackSignedMessage(message:Uint8Array,signed:Uint8Array|undefined){
 if(!signed||signed.length!==message.length+64||message.some((value,index)=>value!==signed[index]))throw new Error('Wallet returned an invalid signed message.');
 return {signedMessage:message,signature:signed.slice(message.length)};
}
export async function signInWithFallback<T extends {address:string;addressBase64:string}>(
 payload:SolanaSignInInput,
 authorize:()=>Promise<{account:T;signedMessage:Uint8Array;signature:Uint8Array}>,
 getAccount:()=>T|undefined,
 signMessages:(account:T,message:Uint8Array)=>Promise<Uint8Array[]>,
 onFallback:()=>void,
){
 try{return await authorize();}catch(error){
  // Never open a second approval following a decline, transport failure or timeout.
  if(!(error instanceof Error)||error.message!=='Sign in result not retrieved.')throw error;
  const account=getAccount();
  if(!account||!payload.domain||payload.address!==account.address)throw new Error('Wallet changed. Sign in again.');
  onFallback();
  const message=createSignInMessage({...payload,domain:payload.domain,address:account.address});
  const signed=await signMessages(account,message);
  return {account,...unpackSignedMessage(message,signed[0])};
 }
}
