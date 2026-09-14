import {parentPort,workerData} from 'node:worker_threads';
import {register} from 'tsx/esm/api';
register();
try {
 const verifier=workerData.rulesHash?await import((await (await import('./rule-bundle.ts')).checkRuleBundle(workerData.rulesHash)).href):await import('./replay.ts');
 try {parentPort.postMessage({ok:true,result:verifier.verifyReplay(workerData.mission,workerData.replay,workerData.definition)});}
 catch {parentPort.postMessage({ok:false,kind:'invalid',error:'The replay does not satisfy the game rules.'});}
} catch (error) {
 console.error(error instanceof Error ? error.message : 'Replay worker failed');
 parentPort.postMessage({ok:false,kind:'unavailable',error:'The pinned replay verifier is unavailable.'});
}
