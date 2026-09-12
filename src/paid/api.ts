import {api} from '../commerce/client';
import type {PaidChallenge,PaidEntry} from '../../shared/paid';
import type {Replay} from '../../shared/replay';
export const paidApi={
 challenge:()=>api<PaidChallenge>('/paid/challenge'),
 entries:(token:string)=>api<PaidEntry[]>('/paid/entries',{token}),
 entry:(token:string,id:string)=>api<PaidEntry>(`/paid/entries/${id}`,{token}),
 quote:(token:string,requestKey:string,termsVersion:string)=>api<PaidEntry>('/paid/entries',{token,body:{requestKey,termsVersion}}),
 prepare:(token:string,id:string)=>api<PaidEntry>(`/paid/entries/${id}/prepare`,{token,body:{}}),
 attach:(token:string,id:string,signature:string)=>api<PaidEntry>(`/paid/entries/${id}/transaction`,{token,body:{signature}}),
 reconcile:(token:string,id:string)=>api<PaidEntry>(`/paid/entries/${id}/reconcile`,{token,body:{}}),
 start:(token:string,id:string,rulesHash:string,startKey:string)=>api<PaidEntry>(`/paid/entries/${id}/start`,{token,body:{rulesHash,startKey}}),
 cancel:(token:string,id:string)=>api<PaidEntry>(`/paid/entries/${id}/cancel`,{token,body:{}}),
 finish:(token:string,entry:PaidEntry,replay:Replay)=>api<PaidEntry>(`/paid/entries/${entry.id}/finish`,{token,body:{runId:entry.run?.id,rulesHash:entry.manifest.rulesHash,replay}}),
};
