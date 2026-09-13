import {environmentFor} from '../game/environment';
import {dailyMission,dailyResetLabel} from '../../shared/daily';
import {getLevel} from '../game/level';
import {useDailyClock} from './useDailyClock';
import React,{useState} from 'react';
import {Text} from 'react-native';
import Panel,{Button,ui} from '../playtest/Panel';
import {changePlaytest,usePlaytest} from '../playtest/store';
import {localDaily} from '../playtest/tickets';
import type {RunTicket} from '../../shared/ranked';
export default function DailyPanel({visible,onClose,onStart}:{visible:boolean;onClose:()=>void;onStart:(t:RunTicket)=>void}){const now=useDailyClock(visible),today=new Date(now),level=getLevel(dailyMission(today));const s=usePlaytest(),[error,setError]=useState(''),day=today.toISOString().slice(0,10),results=s.results.filter(r=>r.kind==='daily'&&r.day===day&&r.status==='won').sort((a,b)=>b.score-a.score||a.seconds-b.seconds);return <Panel visible={visible} title="Daily run" onClose={onClose}><Text style={ui.label}>{day} · {level.title.toUpperCase()}</Text><Text style={ui.title}>Same route. Cleaner escape.</Text><Text style={ui.body}>Recover {level.targets?.length??1} virtual phone{(level.targets?.length??1)>1?'s':''}. {environmentFor(level).hook} Free to retry. This board shows only your browser results; online ranks require the Android service.</Text><Text style={ui.label}>{dailyResetLabel(new Date(Date.parse(day)+86400000).toISOString(),now)}</Text><Button label="Start daily practice" onPress={()=>{try{const ticket=localDaily();changePlaytest(old=>({...old,daily:ticket}));onStart(ticket);}catch(e){setError(String(e));}}}/><Text style={ui.label}>YOUR BEST RUNS TODAY</Text>{results.length?results.slice(0,10).map((r,i)=><Text key={r.id} style={ui.body}>{i+1}. You · {r.score} points · {r.seconds.toFixed(1)}s</Text>):<Text style={ui.body}>No escapes recorded yet. Your first one goes here.</Text>}{!!error&&<Text style={ui.body}>{error}</Text>}</Panel>;}
