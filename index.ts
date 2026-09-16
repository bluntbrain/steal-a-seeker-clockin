import './src/wallet/polyfill';
import { registerRootComponent } from 'expo';
import App from './App';
const Root=process.env.EXPO_PUBLIC_NATIVE_WEEKLY==='1'?require('./src/NativeWeeklyProbe').default:App;
import React from 'react';
import RecoveryBoundary from './src/components/RecoveryBoundary';
function RecoverableApp(){return React.createElement(RecoveryBoundary,{scope:'app',children:React.createElement(Root)});}
registerRootComponent(RecoverableApp);
