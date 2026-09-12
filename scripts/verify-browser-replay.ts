import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {verifyReplayInWorker} from '../server/replay-runner';
async function main(){
 const twoD=process.argv.includes('--2d-campaign'),web=twoD||process.argv.includes('--web-campaign'),campaign=web||process.argv.includes('--campaign'),file=twoD?'verification/2d-campaign-browser-replays.json':web?'verification/web-first-campaign-browser-replays.json':campaign?'verification/campaign-browser-replays.json':'verification/account-browser-replay.json',raw=JSON.parse(await readFile(file,'utf8')),runs=campaign?raw:[raw],results=[];
 for(const run of runs){const result=await verifyReplayInWorker(run.state.mission,run.replay,{rulesHash:run.rulesHash});for(const key of ['status','ticks','score','battery','delivered','spotted'] as const)assert.equal(result[key],run.state[key],`${run.state.mission}: ${key} differs from browser state`);results.push({mission:run.state.mission,rulesHash:run.rulesHash,status:'passed',result});}
 await writeFile(twoD?'verification/2d-campaign-replay-parity.json':web?'verification/web-first-campaign-replay-parity.json':campaign?'verification/campaign-replay-parity.json':'verification/browser-replay-parity.json',JSON.stringify({scope:'Actual browser input recorder compared with pinned server verifier',results},null,2)+'\n');console.log(`${results.length} actual browser replays match the pinned verifier.`);
}
void main().catch(e=>{console.error(e instanceof Error?e.message:'Parity check failed');process.exitCode=1;});
