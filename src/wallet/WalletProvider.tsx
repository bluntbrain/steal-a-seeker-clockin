import React, {useEffect,type ReactNode} from 'react';
import {MobileWalletProvider,type WalletAuthorizationCache} from '@wallet-ui/react-native-kit';
import {AppState} from 'react-native';
import {useMobileWallet} from '@wallet-ui/react-native-kit';
import {walletLog,walletStep} from './diagnostics';
import * as SecureStore from 'expo-secure-store';
import {APP_IDENTITY,DEVNET} from './config';
// Authorization is scoped to the app identity. Retain all purchase/progress caches.
const key=`seeker.mwa.devnet.v2.${new URL(APP_IDENTITY.uri).hostname.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
const cache:WalletAuthorizationCache={
 async get(){return walletStep('cache.read',async()=>{const value=await SecureStore.getItemAsync(key);walletLog('cache.restored',{cached:!!value});if(!value)return undefined;try{return JSON.parse(value);}catch{walletLog('cache.invalid');await SecureStore.deleteItemAsync(key);return undefined;}});},
 async set(value){return walletStep('cache.write',async()=>{if(value)await SecureStore.setItemAsync(key,JSON.stringify(value));else await SecureStore.deleteItemAsync(key);});},
 async clear(){await walletStep('cache.clear',()=>SecureStore.deleteItemAsync(key));}
};
function WalletLifecycle(){
 const wallet=useMobileWallet();
 useEffect(()=>{walletLog('app.wallet-diagnostics-ready');const subscription=AppState.addEventListener('change',state=>walletLog(`app.${state}`));return()=>subscription.remove();},[]);
 useEffect(()=>{walletLog('account.selected',{connected:!!wallet.account});},[wallet.account?.address]);
 return null;
}
export default function WalletProvider({children}:{children:ReactNode}){return <MobileWalletProvider cluster={DEVNET} identity={APP_IDENTITY} cache={cache}><WalletLifecycle/>{children}</MobileWalletProvider>;}
