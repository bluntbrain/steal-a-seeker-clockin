import {createContext,useContext} from 'react';
export const TrialContext=createContext<{active:boolean;finish:()=>void}>({active:false,finish:()=>{}});
export const useTrial=()=>useContext(TrialContext);
