import {useEffect,useSyncExternalStore} from 'react';
import {readSave,writeSave} from '../progress/storage';
import {appendRun,emptyLog,type PlaytestRun,type PlaytestLog} from './model';
import rules from '../../shared/rules-manifest.json';
import app from '../../app.json';
import {Platform} from 'react-native';
const key='seeker.playtest-report.v1',listeners=new Set<()=>void>();
let value=emptyLog(),loaded=false,ready=false,error='',queue=Promise.resolve();
function notify(){listeners.forEach(f=>f());}
function persist(){const raw=JSON.stringify(value);queue=queue.then(()=>writeSave(key,raw)).then(()=>{error='';notify();}).catch(()=>{error='Report could not be saved on this device.';notify();});}
export async function loadLog(){if(loaded)return;loaded=true;try{const raw=await readSave(key);if(raw){const data=JSON.parse(raw) as PlaytestLog;if(data.version===1&&typeof data.enabled==='boolean'&&Array.isArray(data.runs))value={version:1,enabled:data.enabled,runs:data.runs.filter(r=>r&&typeof r.id==='string'&&typeof r.mission==='string'&&Number.isFinite(r.seconds)).slice(-100)};}}catch{error='Previous report could not be read. New recording is off.';}finally{ready=true;notify();}}
export function recordRun(run:PlaytestRun){const next=appendRun(value,run);if(next===value)return;value=next;persist();notify();}
export function setRecording(enabled:boolean){if(!ready)return;value={...value,enabled};persist();notify();}
export function clearReport(){value=emptyLog();persist();notify();}
export function reportJson(){return JSON.stringify({version:1,appVersion:app.expo.version,rulesHash:rules.rulesHash,platform:Platform.OS,exportedAt:new Date().toISOString(),summary:'Voluntary local playtest. No wallet addresses or input replay.',runs:value.runs},null,2);}
export function usePlaytestLog(){useEffect(()=>{void loadLog();},[]);const log=useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f);};},()=>value,()=>value);const status=useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f);};},()=>`${ready}:${error}`,()=>`${ready}:${error}`);return {log,ready:status.startsWith('true:'),error:status.slice(status.indexOf(':')+1)};}
