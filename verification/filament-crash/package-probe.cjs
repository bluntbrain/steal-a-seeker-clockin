const fs=require('fs'),cp=require('child_process'),path=require('path');
const dir='verification/filament-crash',r=(cmd,args,options={})=>cp.execFileSync(cmd,args,{stdio:'pipe',...options});
r('node_modules/hermes-compiler/hermesc/osx-bin/hermesc',['-w','-emit-binary','-O','-out',dir+'/tutorial-probe.hbc',dir+'/tutorial-probe.js']);
r('python3',['-c',`from zipfile import ZipFile
from pathlib import Path
root=Path('${dir}')
with ZipFile('releases/steal-a-seeker-mainnet-v0.3.21-code24.apk') as source, ZipFile(root/'tutorial-diagnostic-unsigned.apk','w') as dest:
 for entry in source.infolist():
  if entry.filename.startswith('META-INF/'):continue
  dest.writestr(entry,(root/'tutorial-probe.hbc').read_bytes() if entry.filename=='assets/index.android.bundle' else source.read(entry.filename))
`]);
const sdk='/Users/bluntbrain/Library/Android/sdk/';
r(sdk+'build-tools/36.0.0/zipalign',['-f','-P','16','4',dir+'/tutorial-diagnostic-unsigned.apk',dir+'/tutorial-diagnostic.apk']);
fs.unlinkSync(dir+'/tutorial-diagnostic-unsigned.apk');
const s=JSON.parse(fs.readFileSync('/Users/bluntbrain/.config/steal-a-seeker/release-signing.json','utf8'));
r(sdk+'build-tools/36.0.0/apksigner',['sign','--ks',s.storeFile,'--ks-key-alias',s.keyAlias,'--ks-pass','env:SEEKER_PROBE_STORE_PASS','--key-pass','env:SEEKER_PROBE_KEY_PASS',dir+'/tutorial-diagnostic.apk'],{env:{...process.env,SEEKER_PROBE_STORE_PASS:s.storePassword,SEEKER_PROBE_KEY_PASS:s.keyPassword}});
console.log(r(sdk+'platform-tools/adb',['-s','emulator-5554','install','-r',dir+'/tutorial-diagnostic.apk']).toString());
console.log(r(sdk+'platform-tools/adb',['-s','emulator-5554','shell','am','start','-W','-n','com.bluntbrain.stealaseeker/.MainActivity']).toString());
