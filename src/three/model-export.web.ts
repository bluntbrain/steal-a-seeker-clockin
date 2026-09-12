import type {Scene} from 'three';
declare global {interface Window {__exportSeekerPhoneModel?:()=>Promise<string>}}
export function installModelExport(scene:Scene){
 if(!new URLSearchParams(window.location.search).has('phoneModelExport'))return;
 window.__exportSeekerPhoneModel=async()=>{
  const {GLTFExporter}=await import('three/examples/jsm/exporters/GLTFExporter.js');
  let model:import('three').Object3D|undefined;
  scene.traverse(o=>{if(o.name.startsWith('Collectible '))model=o;});
  if(!model)throw new Error('Open a phone and wait for its texture before exporting.');
  const buffer=await new GLTFExporter().parseAsync(model,{binary:true});
  if(!(buffer instanceof ArrayBuffer))throw new Error('Binary model export failed.');
  let binary='';const bytes=new Uint8Array(buffer);
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(binary);
 };
}
