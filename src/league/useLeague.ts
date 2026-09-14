import {NETWORK_NAME} from '../wallet/config';
import {useState,useEffect,useRef} from 'react';
import {useAccount} from '../commerce/account-context';
import {leagueApi} from './api';
import type {LeagueSummary} from '../../shared/league';
import {practiceTicket} from '../../shared/league';
import type {Contract} from '../../shared/contracts';
import rules from '../../shared/rules-manifest.json';
import {readSave,writeSave} from '../progress/storage';
import {rankedApi} from '../ranked/api';
import {readPending,clearPending} from '../ranked/pending';
export function useLeague(active:boolean,week:string){const account=useAccount(),ref=useRef(account);ref.current=account;const [data,setData]=useState<LeagueSummary>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState(false),generation=useRef(0);
 async function refresh(interactive=false){const g=++generation.current;setBusy(true);setError('');try{let token:string|undefined;try{token=(await ref.current.session(interactive)).token;}catch{}const value=await leagueApi.summary(token);if(g===generation.current){setData(value);setPending(!!(ref.current.wallet&&await readPending(ref.current.wallet)));}}catch(e){if(g===generation.current)setError(e instanceof Error?e.message:'League unavailable.');}finally{if(g===generation.current)setBusy(false);}}
 useEffect(()=>{setData(undefined);if(active)void refresh();return()=>{generation.current++;};},[active,week,account.wallet]);
 async function start(c:Contract,practice:boolean){if(!data||data.rulesHash!==rules.rulesHash)throw Error('This week requires a compatible game build. Refresh or update before starting.');if(practice)return practiceTicket(c,data.rulesHash,ref.current.wallet??'practice');
  const session=await ref.current.session();if(await readPending(session.wallet))throw Error('Check your saved result before spending another attempt.');const key=`seeker.league.start.${NETWORK_NAME}.${session.wallet}`,old=await readSave(key);let request=old?JSON.parse(old):null;if(!request||request.contract!==c.id){request={contract:c.id,id:crypto.randomUUID()};await writeSave(key,JSON.stringify(request));}
  const ticket=await leagueApi.start(session.token,c.id,data.rulesHash,request.id);if(ref.current.wallet!==session.wallet)throw Error('Wallet changed. The issued attempt belongs to the previous wallet.');if(ticket.status!=='issued'||Date.parse(ticket.expiresAt)<=Date.now()){await writeSave(key,'');throw Error('Previous request has ended. Refresh to start another attempt.');}await writeSave(key,'');return ticket;
 }
 async function recover(){const s=await ref.current.session(),saved=await readPending(s.wallet);if(saved){let run=await rankedApi.run(s.token,saved.id);if(run.status==='issued'||run.status==='error')run=await rankedApi.finish(s.token,saved.id,saved.rulesHash,saved.replay);if(!['issued','verifying','error'].includes(run.status))await clearPending(s.wallet,saved.id);}await refresh();}
 async function abandon(){const s=await ref.current.session();if(data?.active?.status==='verifying')throw Error('This run is being verified. Check the result instead.');if(data?.active)await rankedApi.abandon(s.token,data.active.id);await refresh();}
 async function identity(domain:string){const s=await ref.current.session();await leagueApi.identity(s.token,domain);await refresh();}
 async function equip(){const s=await ref.current.session();await leagueApi.equip(s.token);await ref.current.refresh(false);}
 return {data,error,busy,pending,refresh:()=>refresh(),signIn:()=>refresh(true),start,recover,abandon,identity,equip,local:false};
}
