import {useMemo} from 'react';
import type {Transaction,TransactionWithBlockhashLifetime} from '@solana/kit';
import {submitPayment} from './submitPayment';
import {CHAIN} from './config';
import {useMobileWallet,useAuthorization,transact,type KitMobileWallet} from '@wallet-ui/react-native-kit';
import {SolanaMobileWalletAdapterProtocolError} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {decodeSignIn} from './decodeSignIn';
import {normalizeNativeProtocolError} from './protocolError';
import {signInWithFallback} from './signInFallback';
import {walletLog,walletStep} from './diagnostics';

// Keep Wallet UI's account store, cached authorization and invalid-token retry.
// Instrument the actual local MWA session, rather than guessing from app focus.
export function useLoggedWallet(){
 const mobile=useMobileWallet(),auth=useAuthorization(mobile);
 return useMemo(()=>{
  type AuthorizationResult=Awaited<ReturnType<KitMobileWallet['authorize']>>;
  function observed(wallet:KitMobileWallet,onAuthorization?:(result:AuthorizationResult)=>void):KitMobileWallet{
   return new Proxy(wallet,{get(target,key){
    if(key==='authorize')return async(params:Parameters<KitMobileWallet['authorize']>[0])=>{
     walletLog('mwa.authorize.request',{cached:!!params.auth_token});
     const result=await walletStep('mwa.authorize',async()=>{try{return await target.authorize(params);}catch(error){throw normalizeNativeProtocolError(error,code=>new SolanaMobileWalletAdapterProtocolError(0,code,'Wallet authorization request failed.'));}});
     walletLog('mwa.authorize.response',{accounts:result.accounts.length,signInResult:!!result.sign_in_result});
     if(!result.accounts.length)throw new Error('No accounts returned by wallet.');
     onAuthorization?.(result);
     return result;
    };
    return Reflect.get(target,key);
   }});
  }
  async function session<T>(stage:string,run:(wallet:KitMobileWallet)=>Promise<T>,onAuthorization?:(result:AuthorizationResult)=>void):Promise<T>{
   return walletStep(stage,()=>transact(async wallet=>{
    walletLog(`${stage}.transport-ready`);
    return run(observed(wallet,onAuthorization));
   }));
  }
  const connect:typeof mobile.connect=()=>session('mwa.connect',wallet=>auth.authorizeSession(wallet));
  const signIn:typeof mobile.signIn=payload=>{
   let wireResult:AuthorizationResult['sign_in_result'];
   return session('mwa.sign-in',wallet=>signInWithFallback(payload,async()=>{
    const result=await auth.authorizeSessionWithSignIn(wallet,payload);
    if(!wireResult)throw new Error('Sign in result not retrieved.');
    const decoded=decodeSignIn(wireResult,result.account.addressBase64);
    walletLog('mwa.sign-in.decoded',{bytes:decoded.signature.length});
    return {account:result.account,...decoded};
   },()=>mobile.store.$selectedAccount.get(),(account,message)=>walletStep('mwa.sign-message',()=>wallet.signMessages({addresses:[account.addressBase64],payloads:[message]})),()=>walletLog('mwa.sign-in.message-fallback')),result=>{wireResult=result.sign_in_result;});
  };
  const signAndSendTransactions=async(transaction:Transaction&TransactionWithBlockhashLifetime,minContextSlot:bigint)=>{
   const signed=await session('mwa.payment',async wallet=>{
    const selected=await auth.authorizeSession(wallet);
    if(selected.address!==mobile.account?.address)throw new Error('Wallet changed. Restore purchases before paying again.');
    const transactions=await walletStep('mwa.sign-transactions',()=>wallet.signTransactions({transactions:[transaction]}));
    if(transactions.length!==1)throw new Error('Wallet returned no signed payment. Restore purchases before paying again.');
    walletLog('mwa.payment.signed',{accounts:transactions.length});return transactions[0]!;
   });
   return walletStep('payment.submit-and-confirm',()=>submitPayment(transaction,signed,{rpcUrl:CHAIN.url,minContextSlot,log:stage=>walletLog(stage)}));
  };
  return {...mobile,connect,signIn,signAndSendTransactions,disconnect:()=>walletStep('mwa.disconnect',mobile.disconnect)};
 },[mobile,auth]);
}
