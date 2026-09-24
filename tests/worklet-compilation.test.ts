import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import fs from 'node:fs';

const require=createRequire(import.meta.url);
const babel=require('@babel/core');
const caller={name:'metro',platform:'android',isDev:false,supportsStaticESM:true,supportsReactServer:false};

test('actual compiled game modules initialize and run without forward worklet captures',()=>{
 const cache=new Map<string,{exports:any}>();
 const load=(filename:string):any=>{
  filename=path.resolve(filename);const old=cache.get(filename);if(old)return old.exports;
  const module={exports:{} as any};cache.set(filename,module);
  const code=babel.transformFileSync(filename,{caller,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
  const localRequire=(id:string)=>{if(!id.startsWith('.'))return require(id);const base=path.resolve(path.dirname(filename),id),resolved=[base,base+'.ts',base+'.json'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());assert(resolved,`${filename}: ${id}`);return resolved.endsWith('.json')?JSON.parse(fs.readFileSync(resolved,'utf8')):load(resolved);};
  vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,global:{Error},__DEV__:false},{filename});return module.exports;
 };
 const {combatLevel}=load('src/game/combat-levels.ts'),{initialState,step,idleInput}=load('src/game/simulation.ts'),{combatTap}=load('src/game/combat.ts');
 const level=combatLevel('cone-lesson'),s=initialState(level.mission,level);
 step(s,{...idleInput(),command:combatTap(s,level.phone.x,level.phone.y,1)});
 assert.equal(s.ticks,1);assert.equal(s.guards[0].heist.role,'patrol');
});

// Exercise the real Expo/Babel pipeline: two installed runtimes must not compile
// each other's callbacks. Expo can silently re-enable Worklets via Reanimated.
for(const filename of ['src/GameScreen.tsx','src/game/combat.ts','src/game/heist-guards.ts','src/components/QuadDrone.tsx','src/components/phone-filament/PhoneFilament.tsx','node_modules/react-native-filament/src/hooks/useModel.ts','node_modules/react-native-worklets-core/src/hooks/useWorklet.ts']){
 test(`one worklet compiler for ${filename}`,()=>{
  const options=babel.loadOptions({filename:path.resolve(filename),caller});
  const compilers=options.plugins.filter((p:{key:string})=>/worklets|reanimated/.test(p.key));
  assert.equal(compilers.length,1,compilers.map((p:{key:string})=>p.key).join(', '));
  const context={global:{Error},result:null};
  const code=babel.transformSync("const answer=42; global.result=()=>{'worklet';return answer;};",{filename:path.resolve(filename),caller}).code;
  vm.runInNewContext(code,context);
  const fn=(context.global as any).result;
  assert.equal(fn(),42);
  assert.equal(typeof fn.__workletHash,'number');
  const core=/filament|worklets-core/.test(filename);
  assert.equal(fn.__pluginVersion,core?undefined:require('react-native-worklets/package.json').version);
 });
}

for(const filename of ['src/game/simulation.ts','src/components/phone-filament/PhoneFilament.tsx']){
 test(`captured defaults execute in an isolated worklet runtime: ${filename}`,()=>{
  const code=babel.transformSync(`
   const TUNING={step:1/30};
   const initial=()=>({x:2});
   global.result=function step(dt=TUNING.step,input=initial()){'worklet';return [dt,input.x];};
  `,{filename:path.resolve(filename),caller}).code;
  const main={global:{Error,result:null as any}};
  vm.runInNewContext(code,main);
  const fn=main.global.result;
  // Native worklets have no module globals. Only the captured closure exists.
  const isolated=vm.runInNewContext('('+fn.__initData.code+')',{});
  assert.deepEqual(Array.from(isolated.call(fn)),[1/30,2]);
  assert.deepEqual(Array.from(isolated.call(fn,.1,{x:7})),[.1,7]);
 });
}

test('Filament host objects retain identity across renders and worklet dependencies',()=>{
 const code=babel.transformSync(`
  const engine=global.engine;
  global.result=()=>{'worklet';engine.setIndirectLight();};
 `,{filename:path.resolve('src/components/phone-filament/PhoneFilament.tsx'),caller}).code;
 const engine={setIndirectLight:()=>{}};
 const render=()=>{const ctx={global:{Error,engine,result:null as any}};vm.runInNewContext(code,ctx);return ctx.global.result;};
 const a=render(),b=render();
 assert.equal(a.__closure.engine,engine);
 assert.equal(a.__closure.engine,b.__closure.engine,'Stable native engine must not recreate/release lighting every render');
});
