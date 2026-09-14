const {chromium}=require('playwright'),esbuild=require('esbuild'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
(async()=>{const out=fs.mkdtempSync('/tmp/seeker-recovery-');
 await esbuild.build({stdin:{contents:`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import Boundary from './src/components/RecoveryBoundary';function Failing(){const [broken,setBroken]=useState(false);if(broken)throw new Error('Intentional recovery QA');return <button onClick={()=>setBroken(true)}>Break screen</button>;}createRoot(document.getElementById('root')).render(<Boundary scope="test"><Failing/></Boundary>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,outfile:path.join(out,'bundle.js'),alias:{'react-native':'react-native-web'},define:{'process.env.NODE_ENV':'"production"'}});
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'application/javascript':'text/html');res.end(req.url==='/bundle.js'?fs.readFileSync(path.join(out,'bundle.js')):'<html><body style="margin:0"><div id="root" style="height:100vh"></div><script src="/bundle.js"></script></body></html>');});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const p=await b.newPage({viewport:{width:390,height:844}});await p.goto(`http://127.0.0.1:${server.address().port}`);await p.getByRole('button',{name:'Break screen'}).click();await p.getByTestId('app-recovery').waitFor();await p.screenshot({path:'/tmp/seeker-recovery-screen.png'});await p.getByRole('button',{name:'Reload game'}).click();await p.getByRole('button',{name:'Break screen'}).waitFor();console.log('React render failure recovers on explicit reload.');await p.close();
  const names=['Frost','Graphite','Tide','Static','Mist','Orbit','Pearl','Circuit','Relic','Flux','Archive','Ghost'];
  for(const width of [320,390]){const p=await b.newPage({viewport:{width,height:width===320?568:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>localStorage.setItem('seeker.browser-playtest.v1',JSON.stringify({version:1,balance:200,owned:['campaign'],equipment:{},receipts:[],entry:null,daily:null,results:[]})));
   await p.goto('http://127.0.0.1:8787/?nativePhonePreview');await p.getByTestId('tab-rack').click();
   for(const name of names){await p.getByRole('button',{name:`Collection ${name}: not recovered`,exact:true}).click();await p.getByTestId('phone-turntable').waitFor();assert.equal(await p.getByTestId('phone-inspector').locator('canvas').count(),0);
    await p.getByRole('button',{name:'Show phone back',exact:true}).click();assert.match(await p.getByTestId('phone-turntable-pose').innerText(),/180°/);await p.getByRole('button',{name:'Show phone top',exact:true}).click();assert.equal(await p.getByTestId('phone-turntable-pose').innerText(),'TOP');
    await p.getByRole('button',{name:'Show phone front',exact:true}).click();const r=await p.getByTestId('phone-turntable').boundingBox();await p.mouse.move(r.x+25,r.y+60);await p.mouse.down();await p.mouse.move(r.x+137,r.y+60,{steps:8});await p.mouse.up();assert.match(await p.getByTestId('phone-turntable-pose').innerText(),/180°/);
    await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
    for(const el of await p.getByTestId('phone-inspector').getByRole('button').all()){const r=await el.boundingBox();assert(r&&r.y>=0&&r.y+r.height<=p.viewportSize().height+1,'phone controls fit');}
    if(name==='Frost')await p.screenshot({path:`/tmp/seeker-turntable-${width}.png`});await p.getByRole('button',{name:'Close phone viewer',exact:true}).click();
   }
   await p.getByTestId('tab-map').click();await p.getByRole('button',{name:'Continue · Quiet Pickup',exact:true}).click();await p.getByTestId('decoy-button').waitFor();assert.match(await p.getByTestId('decoy-button').innerText(),/DISTRACT/);await p.screenshot({path:`/tmp/seeker-distract-${width}.png`});assert.deepEqual(errors,[]);console.log(`All 12 phone turntables open, turn, close at ${width}px; gameplay returns with DISTRACT.`);await p.close();
  }
 }finally{await b.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
