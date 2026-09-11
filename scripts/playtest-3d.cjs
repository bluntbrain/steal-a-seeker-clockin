const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
 const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.MVP_URL||'http://127.0.0.1:8787');await page.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>5);
 const snapshot=()=>page.evaluate(()=>window.__SEEKER_MVP__.snapshot());
 assert(await page.getByRole('button',{name:'Switch to 2D view',exact:true}).isVisible());
 await page.screenshot({path:'verification/3d-entry-web.png'});
 await page.keyboard.press('Escape');await page.waitForTimeout(180);const paused=await snapshot();await page.waitForTimeout(350);assert.equal((await snapshot()).ticks,paused.ticks);await page.getByRole('button',{name:'Resume run',exact:true}).click();
 const stick=await page.getByTestId('joystick').boundingBox();const before=await snapshot();await page.mouse.move(stick.x+54,stick.y+54);await page.mouse.down();await page.mouse.move(stick.x+88,stick.y+54);await page.waitForTimeout(550);await page.mouse.up();await page.waitForTimeout(150);const after=await snapshot();assert(after.x>before.x+.7&&after.y<before.y-.3,'Screen-right joystick must map to angled world axes');await page.keyboard.press('r');await page.waitForTimeout(150);
 async function go(x,y){
  const began=Date.now(),heading=Math.atan2(6,11),j=await page.getByTestId('joystick').boundingBox();
  await page.mouse.move(j.x+54,j.y+54);await page.mouse.down();
  while(Date.now()-began<18000){const state=await snapshot();const dx=x-state.x,dy=y-state.y;if(Math.hypot(dx,dy)<.16)break;
   const sx=dx*Math.cos(heading)-dy*Math.sin(heading),sy=dx*Math.sin(heading)+dy*Math.cos(heading),d=Math.hypot(sx,sy),r=Math.min(36,d*30);
   await page.mouse.move(j.x+54+sx/d*r,j.y+54+sy/d*r);await page.waitForTimeout(45);
  }
  await page.mouse.up();await page.waitForTimeout(120);const state=await snapshot();assert(Math.hypot(x-state.x,y-state.y)<.42,`Blocked: ${state.x},${state.y} -> ${x},${y}`);
 }

 for(const p of [[3.7,17.6],[3.7,10.65],[6.6,10.65],[6.6,7],[8.9,7],[8.9,6.45]])await go(...p);
 const take=await page.getByTestId('take-button').boundingBox();await page.mouse.move(take.x+take.width/2,take.y+take.height/2);await page.mouse.down();await page.waitForTimeout(600);await page.mouse.up();await page.waitForTimeout(150);assert((await snapshot()).carrying);await page.screenshot({path:'verification/3d-carrying-web.png'});
 await go(9.4,3.5);await go(9.4,2.1);await page.waitForFunction(()=>window.__SEEKER_MVP__.snapshot().status==='won');const result=await snapshot();await page.screenshot({path:'verification/3d-extracted-web.png'});
 await page.getByRole('button',{name:'Retry level',exact:true}).click();assert.equal((await snapshot()).carrying,false);
 await page.getByRole('button',{name:'Play night shift mission',exact:true}).click();await page.waitForTimeout(400);assert.equal((await snapshot()).guards.length,2);await page.screenshot({path:'verification/3d-guards-web.png'});
 for(const viewport of [{width:360,height:740},{width:1440,height:1000}]){await page.setViewportSize(viewport);await page.waitForTimeout(300);const footer=await page.getByText('WASD / arrows  ·  E hold to take  ·  Space dash  ·  R reset',{exact:true}).boundingBox();assert(footer.y+footer.height<=viewport.height+1);}
 assert.deepEqual(errors,[]);const report={status:'passed',sourceHashes:Object.fromEntries(['src/GameScreen.tsx','src/three/HeistScene.tsx','src/three/camera.ts','src/components/GameCanvas3D.tsx'].map(f=>[f,require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),environment:'Headless Chrome, not a physical Android performance test',checks:['3D scene selected','pause freezes ticks','pointer joystick screen-relative','actual-input route','pointer pickup','extraction','retry','patrol scene','small/desktop fit','no page errors'],result};fs.writeFileSync('verification/3d-web-playtest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
