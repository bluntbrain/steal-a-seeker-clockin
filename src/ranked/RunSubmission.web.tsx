import {finishLocal} from '../league/local';
import React,{useEffect,useState} from 'react';
import {SubmissionStatus} from '../components/ResultSheet';
import type {RunTicket} from '../../shared/ranked';
import type {Replay} from '../../shared/replay';
import {changePlaytest,finish} from '../playtest/store';
import {restorePaidState} from '../paid/recovery';
import {Button} from '../playtest/Panel';
export default function RunSubmission({ticket,replay,onResolved}:{ticket:RunTicket;replay:Replay;onResolved:()=>void}){const [message,setMessage]=useState('Saving your local run…'),[failed,setFailed]=useState(false);function save(){try{const result=restorePaidState(ticket.manifest.mission,replay,ticket.manifest.contract?.level);if(result.status==='playing')throw new Error('The run is not finished.');if(ticket.manifest.contract){finishLocal(ticket,{status:result.status,score:result.score,ticks:result.ticks,seconds:result.elapsed,battery:result.battery,delivered:result.delivered,spotted:result.spotted});}else changePlaytest(s=>finish(s,{id:ticket.id,kind:'daily',day:ticket.manifest.day,status:result.status,score:result.score,seconds:result.elapsed,returned:0}));onResolved();setFailed(false);setMessage(ticket.practice?'Practice finished. No ranked attempt used.':ticket.manifest.contract?'Saved to your local weekly records.':'Saved to your local daily records.');}catch(e){setFailed(true);setMessage(String(e));}}useEffect(save,[ticket.id]);return <SubmissionStatus state={failed?'error':message.startsWith('Saving')?'pending':'saved'} message={message}>{failed&&<Button label="Retry daily save" onPress={save}/>}</SubmissionStatus>;}
