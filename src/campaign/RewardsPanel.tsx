import React,{useEffect,useRef,useState} from 'react';
import RewardsView from './RewardsView';
import {useAccount} from '../commerce/account-context';
import {campaignApi,syncCampaign} from './client';
import type {CampaignSummary,CampaignRank} from '../../shared/economy';
export default function RewardsPanel({visible,onClose,onLegacy}:{visible:boolean;onClose:()=>void;onLegacy?:()=>void}){const account=useAccount(),[summary,setSummary]=useState<CampaignSummary>(),[board,setBoard]=useState<CampaignRank[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),lock=useRef(false),current=useRef(account.wallet);current.current=account.wallet;
 useEffect(()=>{setSummary(undefined);setBoard([]);setMessage('');},[account.wallet]);
 async function sync(claim=false){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{const session=await account.session(true),summary=claim?await campaignApi.claim(session.token):await syncCampaign(session.wallet,session.token);if(current.current!==session.wallet)return;setSummary(summary);setBoard(await campaignApi.board());}catch(e){setMessage(e instanceof Error?e.message:'Could not sync. Your replay is kept.');}finally{lock.current=false;setBusy(false);}}
 useEffect(()=>{if(!visible)return;let alive=true;void account.session(false).then(async session=>{const summary=await campaignApi.summary(session.token),board=await campaignApi.board();if(alive&&current.current===session.wallet){setSummary(summary);setBoard(board);}}).catch(()=>{if(alive)setMessage('Sign in to sync your verified results.');});return()=>{alive=false;};},[visible,account.wallet]);
 return <RewardsView onLegacy={onLegacy} visible={visible} onClose={onClose} local={false} summary={summary} board={board} busy={busy} message={message} onClaim={()=>void sync(true)} onSync={()=>void sync()}/>;
}
