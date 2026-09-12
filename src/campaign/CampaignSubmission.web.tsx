import React,{useEffect} from 'react';
import {Text} from 'react-native';
import {changePlaytest,recordCampaign} from '../playtest/store';
import type {GameState} from '../game/simulation';
import type {Replay} from '../../shared/replay';
export default function CampaignSubmission({state,replay}:{state:GameState;replay:Replay}){useEffect(()=>{if(state.status==='won')changePlaytest(s=>recordCampaign(s,{mission:state.mission,score:state.score,ticks:replay.chunks.reduce((n,c)=>n+c.ticks,0),battery:state.battery,spotted:state.spotted}));},[state.status,state.mission,replay]);return <Text style={{color:'#C7EADB',fontSize:10}}>Saved to your local campaign scorecard.</Text>;}
