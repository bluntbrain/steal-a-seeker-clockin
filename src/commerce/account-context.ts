import {createContext,useContext} from 'react';
import type {AccountState} from '../../shared/commerce';
import type {Session} from './client';
export type AccountContextValue={wallet?:string;account?:AccountState;loading:boolean;preview:boolean;notice:string;session:(interactive?:boolean)=>Promise<Session>;update:(state:AccountState)=>Promise<void>;refresh:(interactive?:boolean)=>Promise<AccountState>};
export const AccountContext=createContext<AccountContextValue|undefined>(undefined);
export function useAccount(){const value=useContext(AccountContext);if(!value)throw new Error('AccountProvider missing.');return value;}
