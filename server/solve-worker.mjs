// runs the level solver off the api event loop; one worker per level, started by campaign-publisher.ts.
// plain javascript so the worker can start without loader flags; the typescript solver is loaded through tsx
import {parentPort,workerData} from 'node:worker_threads';
import {tsImport} from 'tsx/esm/api';
const {solveCombat}=await tsImport('../scripts/qa-combat.ts',import.meta.url);
const win=solveCombat(workerData.definition);
parentPort.postMessage(win?{ok:true,win:{replay:win.replay,score:win.score,ticks:win.ticks,strategy:win.strategy}}:{ok:true,win:null});
