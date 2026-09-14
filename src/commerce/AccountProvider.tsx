import {CHAIN} from '../wallet/config';
import React,{useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import * as SecureStore from 'expo-secure-store';
import {useLoggedWallet as useMobileWallet} from '../wallet/useLoggedWallet';
import {walletLog,walletStep} from '../wallet/diagnostics';
import {fromUint8Array} from 'js-base64';
import type {AccountState} from '../../shared/commerce';
import {accountKey,sessionKey,readAccount} from './account-model';
import {AccountContext} from './account-context';
import {API_URL,ApiError,commerceApi,type Session} from './client';
export default function AccountProvider({children}:{children:ReactNode}){
 const mobile=useMobileWallet(),wallet=mobile.account?.address;
 const current=useRef<string|undefined>(wallet);current.current=wallet;
 const active=useRef(true),inflight=useRef<{wallet:string;promise:Promise<Session>}|undefined>(undefined);
 const [state,setState]=useState<AccountState>(),[loading,setLoading]=useState(true),[notice,setNotice]=useState('');
 useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const update=useCallback(async(incoming:AccountState)=>{
  const clean=readAccount(incoming,incoming.wallet);if(!clean)throw new Error('Invalid account response.');
  await SecureStore.setItemAsync(accountKey(clean.wallet),JSON.stringify(clean));
  if(active.current&&current.current===clean.wallet)setState(clean);
 },[]);
 useEffect(()=>{
  let cancelled=false;setState(undefined);setNotice('');setLoading(true);
  if(!wallet){setLoading(false);return;}
  void(async()=>{
   try{
    const cached=await SecureStore.getItemAsync(accountKey(wallet));
    if(cached){const clean=readAccount(JSON.parse(cached),wallet);if(!cancelled&&clean)setState(clean);}
   }catch{if(!cancelled)setNotice('Could not restore the saved account. Sign in to restore your purchases.');}
   if(!cancelled)setLoading(false);
   // Restoring an existing session must never open Phantom unexpectedly.
   if(!API_URL)return;
   try{
    const raw=await SecureStore.getItemAsync(sessionKey(wallet));if(!raw)return;
    const s=JSON.parse(raw) as Session;if(s.wallet!==wallet||new Date(s.expiresAt).getTime()<=Date.now())return;
    const account=await commerceApi.me(s.token);if(account.wallet!==wallet)throw new Error('Account mismatch.');
    if(!cancelled)await update(account);
   }catch(e){if(e instanceof ApiError&&e.status===401)await SecureStore.deleteItemAsync(sessionKey(wallet));else if(!cancelled)setNotice('Offline. Your saved purchases are available; sync will retry when you restore.');}
  })();return()=>{cancelled=true;};
 },[wallet,update]);
 const session=useCallback(async(interactive=true):Promise<Session>=>{
  const selected=mobile.account;if(!selected)throw new Error('Connect your wallet first.');
  if(!API_URL)throw new Error('The purchase service is not configured in this build.');
  if(inflight.current?.wallet===selected.address)return inflight.current.promise;
  const promise=(async()=>{
   const raw=await SecureStore.getItemAsync(sessionKey(selected.address));let saved:Session|undefined;
   if(raw){try{saved=JSON.parse(raw);}catch{await SecureStore.deleteItemAsync(sessionKey(selected.address));}}
   if(saved?.wallet===selected.address&&new Date(saved.expiresAt).getTime()>Date.now()){
    try{const a=await commerceApi.me(saved.token);if(a.wallet!==selected.address)throw new Error('Account mismatch.');await update(a);return saved;}
    catch(e){if(!(e instanceof ApiError&&e.status===401))throw e;await SecureStore.deleteItemAsync(sessionKey(selected.address));}
   }
   if(!interactive)throw new Error('Sign in to sync this wallet. Your local progress is saved.');
   walletLog('account.sign-in.required');
   const challenge=await commerceApi.challenge(selected.address);if(challenge.payload.chainId!==CHAIN.id)throw new Error('Sign-in service is on a different network.');const signed=await mobile.signIn(challenge.payload);
   walletLog('account.sign-in.signature-returned',{bytes:signed.signature.length});
   if(signed.account.address!==selected.address||current.current!==selected.address)throw new Error('Wallet changed. Sign in again.');
   const result=await commerceApi.signIn({id:challenge.id,wallet:selected.address,signedMessage:fromUint8Array(signed.signedMessage),signature:fromUint8Array(signed.signature)});
   if(result.account.wallet!==selected.address)throw new Error('Account mismatch.');
   const s={token:result.token,wallet:selected.address,expiresAt:result.expiresAt};
   await SecureStore.setItemAsync(sessionKey(s.wallet),JSON.stringify(s));await update(result.account);return s;
  })();
  inflight.current={wallet:selected.address,promise};
  try{return await walletStep('account.session',()=>promise);}finally{if(inflight.current?.promise===promise)inflight.current=undefined;}
 },[mobile,update]);
 const refresh=useCallback(async(interactive=true)=>{const s=await session(interactive),a=await commerceApi.me(s.token);if(a.wallet!==s.wallet)throw new Error('Account mismatch.');await update(a);return a;},[session,update]);
 // Account state from a previous wallet is never exposed during a render/effect gap.
 return <AccountContext.Provider value={{wallet,account:state?.wallet===wallet?state:undefined,loading,preview:false,notice,session,update,refresh}}>{children}</AccountContext.Provider>;
}
