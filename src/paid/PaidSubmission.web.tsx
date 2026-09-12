import React,{useEffect,useState} from 'react';
import {SubmissionStatus} from '../components/ResultSheet';
import type {PaidEntry} from '../../shared/paid';
import type {Replay} from '../../shared/replay';
import {changePlaytest,finish} from '../playtest/store';
import {restorePaidState} from './recovery';
import {paidStore} from './store';
import {Button} from '../playtest/Panel';
export default function PaidSubmission({entry,replay}:{entry:PaidEntry;replay:Replay}){const [message,setMessage]=useState('Saving local result…'),[failed,setFailed]=useState(false);async function save(){try{await paidStore.checkpoint(entry,replay);const result=restorePaidState(entry.manifest.mission,replay);if(result.status==='playing')throw new Error('The run is not finished.');const expired=Date.now()>new Date(entry.run!.expiresAt).getTime(),status=expired?'deadline passed':result.status;changePlaytest(s=>finish(s,{id:entry.id,kind:'entry',day:new Date().toISOString().slice(0,10),status,score:result.score,seconds:result.elapsed,returned:0}));setFailed(false);setMessage(status==='won'?'Escape saved. 10 local credits returned.':'Result saved. No local credits returned.');}catch(e){setFailed(true);setMessage(String(e));}}useEffect(()=>{void save();},[entry.id]);return <SubmissionStatus state={failed?'error':message.startsWith('Saving')?'pending':'saved'} message={message}>{failed&&<Button label="Retry local result save" onPress={()=>void save()}/>}</SubmissionStatus>;}
