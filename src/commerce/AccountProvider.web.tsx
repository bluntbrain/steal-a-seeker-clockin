import React,{type ReactNode} from 'react';
import {AccountContext} from './account-context';
const unavailable=async():Promise<never>=>{throw new Error('Use the Android APK for wallet purchases.');};
export default function AccountProvider({children}:{children:ReactNode}){return <AccountContext.Provider value={{loading:false,preview:true,notice:'Browser gameplay preview',session:unavailable,update:unavailable,refresh:unavailable}}>{children}</AccountContext.Provider>;}
