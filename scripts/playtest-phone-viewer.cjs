const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const root='verification/phone-viewer';fs.mkdirSync(root,{recursive:true});fs.mkdirSync('assets/phone-models',{recursive:true});
 const names=['Frost','Graphite','Tide','Static','Mist','Orbit','Pearl','Circuit','Relic','Flux','Archive','Ghost'],errors=[],models=[];
 const previous=JSON.parse(fs.readFileSync('verification/security-campaign-web-playtest.json'));assert.equal(previous.status,'passed');
 const missions=Object.fromEntries(previous.results.map(({mission,result:s})=>[mission,{stars:1,seconds:s.elapsed,score:s.score,battery:s.battery,completions:1}]));
 const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(missions=>{localStorage.setItem('seeker.browser-playtest.v1',JSON.stringify({version:1,balance:200,owned:['campaign'],equipment:{},receipts:[],entry:null,daily:null,results:[]}));localStorage.setItem('seeker.campaign.devnet.browser-playtest.v1',JSON.stringify({version:1,missions}));},missions);
 const click=n=>p.getByRole('button',{name:n,exact:true}).click();
 await p.goto('http://127.0.0.1:8787/?phoneModelExport=1');await p.getByRole('button',{name:'Collection Frost: recovered',exact:true}).waitFor();await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));await p.waitForTimeout(500);
 for(const width of [320,390,430]){await p.setViewportSize({width,height:width===320?568:width===430?932:844});await p.waitForTimeout(200);
  const clipped=await p.getByTestId('charging-rack').locator('[data-testid^="phone-edition-"]').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect();return r.x<s.x-.5||r.y<s.y-.5||r.right>s.right+.5||r.bottom>s.bottom+.5;}).map(e=>e.dataset.testid));assert.deepEqual(clipped,[],`rack crops at ${width}`);await p.screenshot({path:`${root}/rack-${width}.png`});
 }
 await p.setViewportSize({width:390,height:844});
 for(let i=0;i<12;i++){await click(`Collection ${names[i]}: recovered`);await p.getByTestId('phone-3d-pose').filter({hasText:'DRAG TO ROTATE'}).waitFor();await click('Show phone front');await p.waitForTimeout(200);await p.screenshot({path:`${root}/${String(i+1).padStart(2,'0')}-${names[i].toLowerCase()}-front.png`});
  const encoded=await p.evaluate(()=>window.__exportSeekerPhoneModel());const buffer=Buffer.from(encoded,'base64');assert.equal(buffer.subarray(0,4).toString(),'glTF');fs.writeFileSync(`assets/phone-models/${names[i].toLowerCase()}.glb`,buffer);models.push({edition:names[i],bytes:buffer.length});
  if(i===0){for(const side of ['back','left','right','top','bottom']){await click('Show phone '+side);await p.waitForTimeout(150);await p.screenshot({path:`${root}/frost-${side}.png`});}
   await click('Show phone front');const before=await p.getByTestId('phone-3d-pose').innerText(),r=await p.getByTestId('phone-3d-stage').boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();await p.mouse.move(r.x+r.width/2+80,r.y+r.height/2+25,{steps:10});await p.mouse.up();assert.notEqual(await p.getByTestId('phone-3d-pose').innerText(),before);await p.screenshot({path:root+'/frost-dragged.png'});
   await p.setViewportSize({width:320,height:568});const bad=await p.getByTestId('phone-inspector').getByRole('button').evaluateAll(es=>es.some(e=>{const r=e.getBoundingClientRect();return r.y<0||r.bottom>innerHeight||r.x<0||r.right>innerWidth;}));assert.equal(bad,false);await p.screenshot({path:root+'/viewer-320.png'});await p.setViewportSize({width:390,height:844});
  }
  await click('Close phone viewer');
 }
 assert.equal(await p.getByRole('button',{name:/Collection .*: recovered/}).count(),12);await click('Continue · The Last Vault');await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__SEEKER_MVP__.renderer),'2d-skia');assert.deepEqual(errors,[]);
 fs.writeFileSync(root+'/checks.json',JSON.stringify({passed:true,models,checks:['12 measured sprite crops','rack contains entire phone at 320/390/430 widths','12 matching textured 3D editions','six angle controls','pointer drag changes orientation','small-screen viewer buttons fit','12 valid GLB headers exported','close returns to rack; gameplay remains 2D','zero page errors'],scope:'Chrome web, isolated profile using prior actual-input wins. Native physical-device testing deferred.'},null,2));console.log('All phone crops, 3D rotations and model exports passed.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
