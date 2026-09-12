import React,{useEffect,useState} from 'react';
import {SubmissionStatus} from '../components/ResultSheet';
import type {RunTicket} from '../../shared/ranked';
import type {Replay} from '../../shared/replay';
import {changePlaytest,finish} from '../playtest/store';
import {restorePaidState} from '../paid/recovery';
import {Button} from '../playtest/Panel';
export default function RunSubmission({ticket,replay,onResolved}:{ticket:RunTicket;replay:Replay;onResolved:()=>void}){const [message,setMessage]=useState('Saving your local run…'),[failed,setFailed]=useState(false);function save(){try{const result=restorePaidState(ticket.manifest.mission,replay);if(result.status==='playing')throw new Error('The run is not finished.');changePlaytest(s=>finish(s,{id:ticket.id,kind:'daily',day:ticket.manifest.day,status:result.status,score:result.score,seconds:result.elapsed,returned:0}));onResolved();setFailed(false);setMessage('Saved to your local daily records.');}catch(e){setFailed(true);setMessage(String(e));}}useEffect(save,[ticket.id]);return <SubmissionStatus state={failed?'error':message.startsWith('Saving')?'pending':'saved'} message={message}>{failed&&<Button label="Retry daily save" onPress={save}/>}</SubmissionStatus>;}
