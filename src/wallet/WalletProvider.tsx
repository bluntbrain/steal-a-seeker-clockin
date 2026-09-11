import React, {type ReactNode} from 'react';
import {MobileWalletProvider,type WalletAuthorizationCache} from '@wallet-ui/react-native-kit';
import * as SecureStore from 'expo-secure-store';
import {APP_IDENTITY,DEVNET} from './config';
const key='seeker.mwa.devnet.v1';
const cache:WalletAuthorizationCache={
 async get(){const value=await SecureStore.getItemAsync(key);if(!value)return undefined;try{return JSON.parse(value);}catch{await SecureStore.deleteItemAsync(key);return undefined;}},
 async set(value){if(value)await SecureStore.setItemAsync(key,JSON.stringify(value));else await SecureStore.deleteItemAsync(key);},
 async clear(){await SecureStore.deleteItemAsync(key);}
};
export default function WalletProvider({children}:{children:ReactNode}){return <MobileWalletProvider cluster={DEVNET} identity={APP_IDENTITY} cache={cache}>{children}</MobileWalletProvider>;}
