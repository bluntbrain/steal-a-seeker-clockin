import {NETWORK_NAME} from '../wallet/config';
import type {Replay} from '../../shared/replay';
import type {RunTicket} from '../../shared/ranked';
import {readSave,writeSave} from '../progress/storage';
export type PendingRun={wallet:string;id:string;rulesHash:string;replay:Replay};
const key=(wallet:string)=>`seeker.ranked.pending.${NETWORK_NAME}.${wallet}`;
export async function savePending(ticket:RunTicket,replay:Replay){await writeSave(key(ticket.wallet),JSON.stringify({wallet:ticket.wallet,id:ticket.id,rulesHash:ticket.manifest.rulesHash,replay} satisfies PendingRun));}
export async function readPending(wallet:string):Promise<PendingRun|null>{
 const raw=await readSave(key(wallet));if(!raw)return null;const p=JSON.parse(raw) as PendingRun;
 if(p.wallet!==wallet||typeof p.id!=='string'||typeof p.rulesHash!=='string'||![1,2].includes(p.replay?.version)||!Array.isArray(p.replay.chunks)||p.replay.chunks.length>14400)throw new Error('Saved daily replay could not be read. It has been kept on this device.');return p;
}
export async function clearPending(wallet:string,id:string){const pending=await readPending(wallet);if(pending?.id===id)await writeSave(key(wallet),'');}
