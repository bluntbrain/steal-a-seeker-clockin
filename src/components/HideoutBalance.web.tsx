import React from 'react';import {Text} from 'react-native';import {usePlaytest} from '../playtest/store';
export default function HideoutBalance(){const state=usePlaytest();return <Text testID="hideout-balance" style={{color:'#CFE6E4',fontSize:12,fontWeight:'700'}}>◈ {state.balance} credits</Text>;}
