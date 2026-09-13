import {useMemo} from 'react';
import {useMobileWallet,useAuthorization,transact,type KitMobileWallet} from '@wallet-ui/react-native-kit';
import {signInWithFallback} from './signInFallback';
import {walletLog,walletStep} from './diagnostics';

// Keep Wallet UI's account store, cached authorization and invalid-token retry.
// Instrument the actual local MWA session, rather than guessing from app focus.
export function useLoggedWallet(){
 const mobile=useMobileWallet(),auth=useAuthorization(mobile);
 return useMemo(()=>{
  function observed(wallet:KitMobileWallet):KitMobileWallet{
   return new Proxy(wallet,{get(target,key){
    if(key==='authorize')return async(params:Parameters<KitMobileWallet['authorize']>[0])=>{
     walletLog('mwa.authorize.request',{cached:!!params.auth_token});
     const result=await walletStep('mwa.authorize',()=>target.authorize(params));
     walletLog('mwa.authorize.response',{accounts:result.accounts.length,signInResult:!!result.sign_in_result});
     if(!result.accounts.length)throw new Error('No accounts returned by wallet.');
     return result;
    };
    return Reflect.get(target,key);
   }});
  }
  async function session<T>(stage:string,run:(wallet:KitMobileWallet)=>Promise<T>):Promise<T>{
   return walletStep(stage,()=>transact(async wallet=>{
    walletLog(`${stage}.transport-ready`);
    return run(observed(wallet));
   }));
  }
  const connect:typeof mobile.connect=()=>session('mwa.connect',wallet=>auth.authorizeSession(wallet));
  const signIn:typeof mobile.signIn=payload=>session('mwa.sign-in',wallet=>signInWithFallback(payload,()=>auth.authorizeSessionWithSignIn(wallet,payload),()=>mobile.store.$selectedAccount.get(),(account,message)=>walletStep('mwa.sign-message',()=>wallet.signMessages({addresses:[account.addressBase64],payloads:[message]})),()=>walletLog('mwa.sign-in.message-fallback')));
  const signAndSendTransactions:typeof mobile.signAndSendTransactions=async(transaction,minContextSlot)=>session('mwa.payment',async wallet=>{
   const selected=await auth.authorizeSession(wallet);
   if(selected.address!==mobile.account?.address)throw new Error('Wallet changed. Restore purchases before paying again.');
   const signatures=await walletStep('mwa.sign-and-send',()=>wallet.signAndSendTransactions({transactions:Array.isArray(transaction)?transaction:[transaction],minContextSlot:Number(minContextSlot)}));
   if(!signatures.length)throw new Error('Wallet returned no transaction signature. Restore purchases before paying again.');
   return (Array.isArray(transaction)?signatures:signatures[0]) as Awaited<ReturnType<typeof mobile.signAndSendTransactions<typeof transaction>>>;
  });
  return {...mobile,connect,signIn,signAndSendTransactions,disconnect:()=>walletStep('mwa.disconnect',mobile.disconnect)};
 },[mobile,auth]);
}
