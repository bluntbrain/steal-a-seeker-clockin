import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const require=createRequire(import.meta.url),babel=require('@babel/core');
const code=babel.transformFileSync('node_modules/react-native-filament/src/hooks/useDisposableResource.ts',{
 caller:{name:'metro',platform:'android',isDev:false,supportsStaticESM:true,supportsReactServer:false},
 plugins:['@babel/plugin-transform-modules-commonjs'],
}).code;
function hook(initialize:()=>unknown){
 let effect:()=>()=>void=()=>()=>{};
 const updates:unknown[][]=[];
 const react={useEffect:(f:typeof effect)=>{effect=f;},useState:()=>{const state:unknown[]=[];updates.push(state);return [undefined,(v:unknown)=>state.push(v)];}};
 const context={exports:{} as any,require:(id:string)=>id==='react'?react:id==='../utilities/withCleanupScope'?{withCleanupScope:(fn:()=>void)=>fn}:require(id)};
 vm.runInNewContext(code,context);
 context.exports.useDisposableResource(initialize);
 return {mount:()=>effect(),updates};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('Filament accepts a native thenable without a chained catch and releases late resources',async()=>{
 let resolve:(value:unknown)=>void=()=>{},released=0;
 // The native result supports then, but its chained result has no catch method.
 const native={then:(fulfilled:typeof resolve)=>{resolve=fulfilled;return {};}};
 const h=hook(()=>native),cleanup=h.mount();
 await flush();
 cleanup();resolve({release:()=>released++});await flush();
 assert.equal(released,1);
 assert.ok(h.updates[0]!.every(v=>v===undefined),'Unmounted hook never adopts a late resource');
});

test('Filament initializer failures reach recovery state instead of unhandled rejection',async()=>{
 const h=hook(()=>{throw new Error('test resource failure');});
 const cleanup=h.mount();await flush();
 assert.ok(h.updates[1]!.some((e:any)=>e?.message.includes('test resource failure')));
 cleanup();
});
