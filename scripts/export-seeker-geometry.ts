import fs from 'node:fs/promises';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {createSeekerPhone} from '../src/three/seekerPhone';
import {PHONE_EDITIONS} from '../src/game/collection';
// Node equivalent of the binary-only browser FileReader; no canvas/textures involved.
(globalThis as any).FileReader=class{result:ArrayBuffer|null=null;onloadend?:()=>void;readAsArrayBuffer(blob:Blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}};
async function main(){await fs.mkdir('/tmp/seeker-model-source',{recursive:true});for(let i=0;i<12;i++){const out=await new GLTFExporter().parseAsync(createSeekerPhone(i),{binary:true});await fs.writeFile(`/tmp/seeker-model-source/${i}.glb`,Buffer.from(out as ArrayBuffer));}await fs.writeFile('/tmp/seeker-model-source/editions.json',JSON.stringify(PHONE_EDITIONS));}
main();
