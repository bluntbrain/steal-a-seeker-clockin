import React from 'react';
const {createRoot}=require('react-dom/client');
import {SafeAreaProvider} from 'react-native-safe-area-context';
import WalletPanel from '../src/wallet/WalletPanel';
createRoot(document.getElementById('root')!).render(<SafeAreaProvider><div style={{padding:24,color:'#ABC9BD',font:'14px system-ui'}}>Checkout design preview · simulated wallet · no payments</div><WalletPanel visible onClose={()=>{}}/></SafeAreaProvider>);
