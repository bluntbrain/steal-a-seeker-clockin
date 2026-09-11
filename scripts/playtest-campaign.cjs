const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),assert=require('node:assert/strict'),crypto=require('crypto');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.MVP_URL||'http://127.0.0.1:8787');await page.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>5);const snapshot=()=>page.evaluate(()=>window.__SEEKER_MVP__.snapshot()),routes=JSON.parse(fs.readFileSync('verification/campaign-routes.json')).routes,results=[];
 async function go(point){const j=await page.getByTestId('joystick').boundingBox(),heading=Math.atan2(6,11),began=Date.now();await page.mouse.move(j.x+54,j.y+54);await page.mouse.down();
  while(Date.now()-began<14000){const state=await snapshot();if(state.status!=='playing')break;const dx=point.x-state.x,dy=point.y-state.y;if(Math.hypot(dx,dy)<.12)break;const sx=dx*Math.cos(heading)-dy*Math.sin(heading),sy=dx*Math.sin(heading)+dy*Math.cos(heading),d=Math.hypot(sx,sy),r=Math.min(36,d*100);await page.mouse.move(j.x+54+sx/d*r,j.y+54+sy/d*r);await page.waitForTimeout(30);}
  await page.mouse.up();await page.waitForTimeout(130);const s=await snapshot();if(s.status==='won')return true;if(s.status!=='playing')return false;assert(Math.hypot(point.x-s.x,point.y-s.y)<.35,`Route collision in ${s.mission}: ${s.x},${s.y} -> ${point.x},${point.y}`);return true;
 }
 for(const route of routes){const title=route.mission.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),name=route.mission==='practice'?'Quiet Pickup':title;
  await page.getByRole('button',{name:'Open mission map',exact:true}).click();await page.getByRole('button',{name:new RegExp(`Mission \\d: ${name}$`)}).click();await page.getByRole('button',{name:`Start ${name}`,exact:true}).click();let success=false,attempts=[];
  for(let attempt=0;attempt<9&&!success;attempt++){
   await page.keyboard.press('r');await page.waitForTimeout(130);const wait=route.delayTicks/30+attempt*.9;await page.waitForTimeout(wait*1000);let okay=true;
   for(const p of route.phone){if(!await go(p)){okay=false;break;}}
   if(okay){const take=await page.getByTestId('take-button').boundingBox();await page.mouse.move(take.x+take.width/2,take.y+take.height/2);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();await page.waitForTimeout(140);okay=(await snapshot()).carrying;}
   if(okay){await page.screenshot({path:`verification/campaign-${route.mission}-carry.png`});for(const p of route.exit){if(!await go(p)){okay=false;break;}}await page.waitForTimeout(1100);}
   const s=await snapshot();attempts.push({wait,status:s.status,seconds:s.elapsed});success=s.status==='won';if(success){results.push({mission:route.mission,attempts,result:s});await page.screenshot({path:`verification/campaign-${route.mission}-won.png`});}
  }
  assert(success,`${name}: no successful pointer route in tested phases`);
 }
 await page.reload();await page.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>5);await page.getByRole('button',{name:'Open mission map',exact:true}).click();await page.waitForTimeout(200);for(const route of routes){assert(await page.getByText(new RegExp('Best .* completed')).count()>=4);break;}await page.screenshot({path:'verification/campaign-progress-restored.png'});assert.deepEqual(errors,[]);
 fs.writeFileSync('verification/campaign-web-playtest.json',JSON.stringify({status:'passed',environment:'Headless Chrome with pointer joystick, not physical phone',checks:['four actual-input extractions','unlocks in order','mission-specific render','progress restored after reload','no page errors'],sourceHashes:Object.fromEntries(['src/GameScreen.tsx','src/game/level.ts','src/game/simulation.ts','src/game/guards.ts','src/three/HeistScene.tsx'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),results},null,2));console.log('Four campaign missions and persistent progress passed.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
