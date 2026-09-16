import React,{type ReactNode} from 'react';
import {AccountContext} from './account-context';
import {PLAYTEST_WALLET,usePlaytest} from '../playtest/store';
const unavailable=async():Promise<never>=>{throw new Error('Browser playtest only. No wallet session or token payment is created.');};
export default function AccountProvider({children}:{children:ReactNode}){const s=usePlaytest();return <AccountContext.Provider value={{wallet:PLAYTEST_WALLET,account:{wallet:PLAYTEST_WALLET,credits:s.balance,entitlements:s.owned,equipment:s.equipment,progress:{}},loading:false,preview:true,notice:'Local browser playtest · no real tokens',session:unavailable,update:unavailable,refresh:unavailable}}>{children}</AccountContext.Provider>;}
