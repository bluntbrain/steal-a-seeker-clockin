import {parentPort,workerData} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {checkRuleBundle} from './rule-bundle-runtime.mjs';
try {
 // Replay bundles are already compiled. Starting a TypeScript transpiler for
 // every claim added latency and could consume the verification time budget.
 const hash=workerData.rulesHash??JSON.parse(await readFile(new URL('../shared/rules-manifest.json',import.meta.url),'utf8')).rulesHash;
 const verifier=await import((await checkRuleBundle(hash)).href);
 try {parentPort.postMessage({ok:true,result:verifier.verifyReplay(workerData.mission,workerData.replay,workerData.definition)});}
 catch {parentPort.postMessage({ok:false,kind:'invalid',error:'The replay does not satisfy the game rules.'});}
} catch (error) {
 console.error(error instanceof Error ? error.message : 'Replay worker failed');
 parentPort.postMessage({ok:false,kind:'unavailable',error:'The pinned replay verifier is unavailable.'});
}
