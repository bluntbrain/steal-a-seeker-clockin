// Deliberately never serialize SDK errors, URLs, wallet responses or request bodies.
type Details={durationMs?:number;status?:number;code?:number;accounts?:number;cached?:boolean;signInResult?:boolean;connected?:boolean;bytes?:number};
type Entry={at:string;id:number;stage:string;details:Details};
const entries:Entry[]=[];let sequence=0;
export function walletLog(stage:string,details:Details={}){
 const clean:Details={};
 for(const key of ['durationMs','status','code','accounts','bytes'] as const)if(typeof details[key]==='number'&&Number.isFinite(details[key]))clean[key]=details[key];
 for(const key of ['cached','signInResult','connected'] as const)if(typeof details[key]==='boolean')clean[key]=details[key];
 const entry={at:new Date().toISOString(),id:++sequence,stage,details:clean};
 entries.push(entry);if(entries.length>200)entries.shift();
 console.info('[SeekerWallet]',JSON.stringify(entry));return entry.id;
}
export function errorKind(error:unknown){
 const e=error as {code?:unknown;message?:unknown;name?:unknown}|null;
 const message=typeof e?.message==='string'?e.message:'';
 if(e?.code===-3||/declin|cancel|reject.*user/i.test(message))return 'declined';
 if(/sign in result not retrieved/i.test(message))return 'missing-sign-in-result';
 if(e?.name==='AbortError'||/timed? ?out|timeout/i.test(message))return 'timeout';
 if(/network|fetch|connect.*fail|websocket/i.test(message))return 'connection';
 if(/no wallet|wallet.*not found|activity.*not found/i.test(message))return 'wallet-unavailable';
 return 'failed';
}
export function walletFailure(stage:string,error:unknown){
 const e=error as {code?:unknown;status?:unknown}|null;
 walletLog(`${stage}.${errorKind(error)}`,{code:typeof e?.code==='number'?e.code:undefined,status:typeof e?.status==='number'?e.status:undefined});
}
export function walletErrorMessage(error:unknown){
 switch(errorKind(error)){
 case 'declined':return 'The wallet request was declined. You can try again.';
 case 'timeout':return 'The wallet request timed out. Unlock Phantom and try again.';
 case 'connection':return 'Could not complete the connection. Check internet access and try again.';
 case 'wallet-unavailable':return 'No compatible wallet opened. Install and unlock Phantom, then try again.';
 case 'missing-sign-in-result':return 'Phantom connected but did not return a sign-in signature.';
 default:return 'The wallet request failed. Share the diagnostic log so we can check the failed step.';
 }
}
export async function walletStep<T>(stage:string,run:()=>Promise<T>):Promise<T>{
 const id=walletLog(`${stage}.start`),start=Date.now();
 const waiting=setTimeout(()=>walletLog(`${stage}.waiting.${id}`,{durationMs:Date.now()-start}),12000);
 try{const result=await run();walletLog(`${stage}.ok.${id}`,{durationMs:Date.now()-start});return result;}
 catch(e){walletFailure(`${stage}.${id}`,e);throw e;}finally{clearTimeout(waiting);}
}
export function walletReport(){return `Steal a Seeker · devnet wallet diagnostics v1\n${entries.map(e=>JSON.stringify(e)).join('\n')}`;}
