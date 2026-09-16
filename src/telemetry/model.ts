import type {MissionId} from '../game/level';
export type PlaytestRun={id:string;at:string;mission:MissionId;mode:'campaign'|'daily'|'paid'|'trial';outcome:'won'|'caught'|'timeout'|'abandoned';seconds:number;score:number;dashes:number;decoysUsed:number;pickedUp:boolean;spotted:boolean;cell:{x:number;y:number};fps:number;p95:number;combat?:{hp:number;shots:number;kills:number;damageTaken:number;pathReplans:number}};
export type PlaytestLog={version:1;enabled:boolean;runs:PlaytestRun[]};
export const emptyLog=():PlaytestLog=>({version:1,enabled:false,runs:[]});
export function appendRun(log:PlaytestLog,run:PlaytestRun):PlaytestLog{
 if(!log.enabled||log.runs.some(r=>r.id===run.id))return log;
 return {...log,runs:[...log.runs,run].slice(-100)};
}
export function summarize(runs:PlaytestRun[]){
 const wins=runs.filter(r=>r.outcome==='won').length,retries=runs.slice(1).filter((r,i)=>r.mission===runs[i]!.mission).length;
 return {attempts:runs.length,wins,caught:runs.filter(r=>r.outcome==='caught').length,abandoned:runs.filter(r=>r.outcome==='abandoned').length,retries,escapeRate:runs.length?Math.round(wins/runs.length*100):0};
}
