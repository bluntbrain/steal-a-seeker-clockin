import React from 'react';
import {usePlaytest} from '../playtest/store';
import CreditChip from './CreditChip';
export default function HideoutBalance(){const state=usePlaytest();return <CreditChip testID="hideout-balance" balance={state.balance} accessibilityLabel={`${state.balance} demo credits`}/>;}
