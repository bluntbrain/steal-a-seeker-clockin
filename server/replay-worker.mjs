import {parentPort,workerData} from 'node:worker_threads';
import {register} from 'tsx/esm/api';
register();
try {
 const {verifyReplay}=await import('./replay.ts');
 parentPort.postMessage({ok:true,result:verifyReplay(workerData.mission,workerData.replay)});
} catch (error) {
 console.error(error instanceof Error ? error.message : 'Replay worker failed');
 parentPort.postMessage({ok:false,error:'The replay does not satisfy the game rules.'});
}
