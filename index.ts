import './src/wallet/polyfill';
import { registerRootComponent } from 'expo';
import App from './App';
import React from 'react';
import RecoveryBoundary from './src/components/RecoveryBoundary';
function RecoverableApp(){return React.createElement(RecoveryBoundary,{scope:'app',children:React.createElement(App)});}
registerRootComponent(RecoverableApp);
