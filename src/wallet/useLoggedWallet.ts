import {AppState} from 'react-native';
import {exclusiveWalletSession,freshPaymentAuthorization} from './session-guard';
import {useMemo} from 'react';
import type {Transaction,TransactionWithBlockhashLifetime} from '@solana/kit';
import {web3Payment} from './web3Payment';
import {transact as web3Transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {PublicKey} from '@solana/web3.js';
import {Buffer} from 'buffer';
import {CHAIN,IS_MAINNET,APP_IDENTITY} from './config';
import {useMobileWallet,useAuthorization,transact,type KitMobileWallet} from '@wallet-ui/react-native-kit';
import {SolanaMobileWalletAdapterProtocolError} from '@solana-mobile/mobile-wallet-adapter-protocol';
import {decodeSignIn} from './decodeSignIn';
import {normalizeNativeProtocolError} from './protocolError';
import {signInWithFallback} from './signInFallback';
import {walletLog,walletStep} from './diagnostics';

async function waitForForeground(){
 if(AppState.currentState==='active')return;
 await walletStep('mwa.wait-for-foreground',()=>new Promise<void>((resolve,reject)=>{
  const timer=setTimeout(()=>{subscription.remove();reject(new Error('Return to Steal a Seeker, then try again.'));},20000);
  const subscription=AppState.addEventListener('change',state=>{if(state==='active'){clearTimeout(timer);subscription.remove();resolve();}});
 }));
}

// Keep Wallet UI's account store, cached authorization and invalid-token retry.
// Instrument the actual local MWA session, rather than guessing from app focus.
export function useLoggedWallet(){
 const mobile=useMobileWallet(),auth=useAuthorization(mobile);
 return useMemo(()=>{
  type AuthorizationResult=Awaited<ReturnType<KitMobileWallet['authorize']>>;
  function observed(wallet:KitMobileWallet,freshPayment:boolean,onAuthorization?:(result:AuthorizationResult)=>void):KitMobileWallet{
   return new Proxy(wallet,{get(target,key){
    if(key==='authorize')return async(params:Parameters<KitMobileWallet['authorize']>[0])=>{
     const request=freshPayment?freshPaymentAuthorization(params):params;
     walletLog(freshPayment?'mwa.payment.fresh-authorization':'mwa.authorize.request',{cached:!freshPayment&&!!params.auth_token});
     const result=await walletStep('mwa.authorize',async()=>{try{return await target.authorize(request);}catch(error){throw normalizeNativeProtocolError(error,code=>new SolanaMobileWalletAdapterProtocolError(0,code,'Wallet authorization request failed.'));}});
     walletLog('mwa.authorize.response',{accounts:result.accounts.length,signInResult:!!result.sign_in_result});
     if(!result.accounts.length)throw new Error('No accounts returned by wallet.');
     onAuthorization?.(result);
     return result;
    };
    return Reflect.get(target,key);
   }});
  }
  async function session<T>(stage:string,run:(wallet:KitMobileWallet)=>Promise<T>,onAuthorization?:(result:AuthorizationResult)=>void):Promise<T>{
   return exclusiveWalletSession(async()=>{
    await waitForForeground();
    const result=await walletStep(stage,()=>transact(async wallet=>{
    walletLog(`${stage}.transport-ready`);
    return run(observed(wallet,stage==='mwa.payment',onAuthorization));
   }));
    await waitForForeground();
    await walletStep('mwa.android-network-resume',()=>new Promise<void>(resolve=>setTimeout(resolve,1000)));
    return result;
   });
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
   const expectedAccount=mobile.account?.address;
   if(!expectedAccount)throw new Error('Connect your wallet before paying.');
   return walletStep('payment.web3',()=>web3Payment(transaction,{rpcUrl:CHAIN.url,minContextSlot,log:stage=>walletLog(stage),sign:prepared=>exclusiveWalletSession(async()=>{
    await waitForForeground();
    const result=await walletStep('mwa.payment',()=>web3Transact(async wallet=>{
     walletLog('mwa.payment.transport-ready');
     walletLog('mwa.payment.fresh-authorization',{cached:false});
     const authorization=await walletStep('mwa.authorize',()=>wallet.authorize({cluster:IS_MAINNET?'mainnet-beta':'devnet',identity:APP_IDENTITY}));
     walletLog('mwa.authorize.response',{accounts:authorization.accounts.length});
     if(!authorization.accounts.some(account=>new PublicKey(Buffer.from(account.address,'base64')).toBase58()===expectedAccount))throw new Error('Wallet changed. Restore purchases before paying again.');
     const signed=await walletStep('mwa.sign-transactions',()=>wallet.signTransactions({transactions:[prepared]}));
     if(signed.length!==1)throw new Error('Wallet returned no signed payment. Restore purchases before paying again.');
     walletLog('mwa.payment.signed',{accounts:signed.length});
     return signed[0]!;
    }));
    await waitForForeground();
    return result;
   })}));
  };
  return {...mobile,connect,signIn,signAndSendTransactions,disconnect:()=>walletStep('mwa.disconnect',mobile.disconnect)};
 },[mobile,auth]);
}
