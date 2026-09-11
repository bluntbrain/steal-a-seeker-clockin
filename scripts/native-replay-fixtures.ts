import {writeFile} from 'node:fs/promises';
import {URL} from 'node:url';
import {CAMPAIGN_IDS} from '../src/game/level';
import {fixtureReplay} from '../tests/fixtures/replay';
import {parityRun} from '../src/game/parity';
import type {Replay} from '../shared/replay';
import rules from '../shared/rules-manifest.json';
async function main(){
 const cases=CAMPAIGN_IDS.map(mission=>{const {replay}=fixtureReplay(mission);return {name:mission,mission,replay,expected:parityRun(mission,replay)};});
 const decoy:Replay={version:1,chunks:[{x:127,y:0,buttons:0,ticks:15},{x:0,y:0,buttons:4,ticks:1},{x:0,y:0,buttons:0,ticks:200}]};
 cases.push({name:'false-footsteps',mission:'false-footsteps',replay:decoy,expected:parityRun('false-footsteps',decoy)});
 const dash=structuredClone(fixtureReplay().replay),pickup=dash.chunks.findIndex(c=>(c.buttons&1)!==0);dash.chunks.splice(pickup+1,0,{x:0,y:127,buttons:2,ticks:1});
 cases.push({name:'practice',mission:'practice',replay:dash,expected:parityRun('practice',dash)});
 await writeFile(new URL('../verification/native-replay-fixtures.json',import.meta.url),JSON.stringify({rulesHash:rules.rulesHash,cases})+'\n');console.log(`${cases.length} native parity fixtures generated.`);
}
void main();
