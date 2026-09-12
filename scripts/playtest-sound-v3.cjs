const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.__audio=new Set();const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__audio.add(this);return play.call(this);};});
const click=n=>p.getByRole('button',{name:n,exact:true}).click(),snap=()=>p.evaluate(()=>window.__SEEKER_MVP__.snapshot()),audio=()=>p.evaluate(()=>[...window.__audio].map(a=>({src:a.currentSrc,loop:a.loop,paused:a.paused,volume:a.volume,time:a.currentTime,duration:a.duration,error:a.error?.code})));
await p.goto('http://127.0.0.1:8787/?build=sound-chase-v3');await click('Buy campaign · 100 playtest credits');await click('Confirm campaign · 100 test credits');await click('Continue · Quiet Pickup');await p.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>5);
assert((await audio()).some(a=>a.src.includes('stealth')&&!a.paused&&a.time>0),'Stealth bed plays');
const go=async pt=>{const j=await p.getByTestId('joystick').boundingBox(),start=Date.now();await p.mouse.move(j.x+54,j.y+54);await p.mouse.down();while(Date.now()-start<14000){const s=await snap(),dx=pt.x-s.x,dy=pt.y-s.y,d=Math.hypot(dx,dy);if(s.status!=='playing'||d<.12)break;const r=Math.min(36,d*100);await p.mouse.move(j.x+54+dx/d*r,j.y+54+dy/d*r);await p.waitForTimeout(30);}await p.mouse.up();await p.waitForTimeout(100);};
const route=JSON.parse(fs.readFileSync('verification/campaign-routes.json')).routes[0],attempts=[];
for(let attempt=0;attempt<5;attempt++){
 await p.keyboard.press('r');await p.waitForTimeout(130+attempt*550);
 const leg=route.legs[0];if(leg.decoyDirection>=0){const key=['ArrowDown','ArrowLeft','ArrowUp','ArrowRight'][leg.decoyDirection];await p.keyboard.down(key);await p.keyboard.press('q');await p.waitForTimeout(34);await p.keyboard.up(key);await p.waitForTimeout(134);}
 for(const pt of leg.points)await go(pt);
 await p.keyboard.down('e');await p.waitForTimeout(570);await p.keyboard.up('e');await p.waitForTimeout(100);
 const s=await snap();attempts.push({attempt:attempt+1,status:s.status,carrying:s.carrying});if(s.status==='playing'&&s.carrying)break;
}
const picked=await snap();assert(picked.carrying&&picked.status==='playing','Pickup reached through actual input');assert(picked.securityAlarm);
await p.waitForTimeout(120);const live=await audio();for(const name of ['pickup','alarm','chase'])assert(live.some(a=>a.src.includes(name)&&a.time>0&&!a.error),`${name} decodes and advances`);
assert(live.some(a=>a.src.includes('chase')&&!a.paused&&a.volume>0));assert(live.some(a=>a.src.includes('alarm')&&!a.paused&&a.volume>0));assert(live.filter(a=>a.src.includes('stealth')).every(a=>a.volume===0||a.paused));
assert(await p.getByTestId('alarm-border').evaluate(e=>+getComputedStyle(e).opacity>0));await p.screenshot({path:'verification/sound-v3-chase.png'});
await click('Pause game');await p.waitForTimeout(150);assert((await audio()).filter(a=>a.loop).every(a=>a.paused));
await click('Open settings');await p.getByRole('switch',{name:'Game sound',exact:true}).click();await click('Close settings');await click('Resume run');await p.waitForTimeout(150);assert((await audio()).every(a=>a.paused||a.volume===0));
await click('Pause game');await click('Open settings');await p.getByRole('switch',{name:'Game sound',exact:true}).click();await click('Close settings');await click('Resume run');await p.waitForTimeout(150);assert((await audio()).some(a=>a.src.includes('chase')&&!a.paused&&a.volume>0));
await p.waitForFunction(()=>window.__SEEKER_MVP__.snapshot().status!=='playing',{},{timeout:20000});await p.waitForTimeout(200);const end=await snap();assert.equal(end.status,'caught');assert((await audio()).filter(a=>a.loop).every(a=>a.paused));assert((await audio()).some(a=>a.src.includes('caught')&&a.time>0));
assert.deepEqual(errors,[]);fs.writeFileSync('verification/sound-v3-ui.json',JSON.stringify({passed:true,scope:'Actual browser joystick/key input; isolated 390×844 profile; no game state mutation',attempts,rulesHash:await p.evaluate(()=>window.__SEEKER_MVP__.rulesHash),checks:['stealth bed decoded and playing','actual phone pickup','pickup, alarm and chase decoded and advanced','stealth silenced after theft','red alarm border visible','pause stops loops','mute silences every layer','resume restores chase','standing still is caught by pursuing guard','capture stops loops and plays failure cue','no runtime errors'],audio:live.map(({src,...a})=>({file:src.split('/').pop(),...a})),terminalStatus:end.status},null,2));console.log('Sound-v3 browser checks passed');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
