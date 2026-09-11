import {z} from 'zod';
import {CAMPAIGN_IDS,type MissionId} from '../src/game/level';
const best=z.object({stars:z.number().int().min(1).max(3),seconds:z.number().positive().max(3600),score:z.number().int().min(0).max(20000),battery:z.number().min(0).max(100),completions:z.number().int().min(1).max(100000)}).strict();
export const progressInput=z.object({version:z.literal(1),missions:z.partialRecord(z.enum(CAMPAIGN_IDS as [MissionId,...MissionId[]]),best)}).strict();
export type SyncedProgress=z.infer<typeof progressInput>;
// Campaign saves are convenience data. Never use these client-reported records
// to authorize a ranked score, reward, payment or purchase entitlement.
export function mergeProgress(saved:unknown,incoming:SyncedProgress):SyncedProgress{
 const previous=progressInput.safeParse(saved),missions={...(previous.success?previous.data.missions:{})};
 for(const id of CAMPAIGN_IDS){const next=incoming.missions[id];if(!next)continue;const old=missions[id];missions[id]=old?{stars:Math.max(old.stars,next.stars),seconds:Math.min(old.seconds,next.seconds),score:Math.max(old.score,next.score),battery:Math.max(old.battery,next.battery),completions:Math.max(old.completions,next.completions)}:next;}
 return {version:1,missions};
}
