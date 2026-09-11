const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const page=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.MVP_URL||'http://localhost:8082');
 await page.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>5);
 const snapshot=()=>page.evaluate(()=>window.__SEEKER_MVP__.snapshot());
 await page.screenshot({path:'verification/web-level-01.png'});
 assert(await page.getByText('STEAL A SEEKER',{exact:true}).isVisible());
 const header=await page.getByText('STEAL A SEEKER',{exact:true}).boundingBox();assert(header.y>=0,'Header clipped');
 const footer=await page.getByText('WASD / arrows  ·  E hold to take  ·  Space dash  ·  R reset',{exact:true}).boundingBox();assert(footer.y+footer.height<=933,'Controls overflow screen');
 // Mouse drag exercises the actual shared joystick gesture path.
 const stick=await page.getByTestId('joystick').boundingBox();let s=await snapshot();const startX=s.x;
 await page.mouse.move(stick.x+54,stick.y+54);await page.mouse.down();await page.mouse.move(stick.x+90,stick.y+54);await page.waitForTimeout(650);await page.mouse.up();await page.waitForTimeout(170);
 assert((await snapshot()).x>startX+1,'Joystick did not move');
 await page.keyboard.press('r');await page.waitForTimeout(150);
 await page.keyboard.down('a');await page.waitForTimeout(1500);await page.keyboard.up('a');await page.waitForTimeout(150);s=await snapshot();assert(s.x>=.94 && s.x<=1.08 && s.bumps>0,'Left-wall collision failed');
 await page.keyboard.press('r');await page.waitForTimeout(150);await page.keyboard.press('Escape');await page.waitForTimeout(250);const paused=await snapshot();await page.waitForTimeout(600);assert.equal((await snapshot()).elapsed,paused.elapsed);assert(await page.getByRole('button',{name:'Resume run',exact:true}).isVisible());await page.getByRole('button',{name:'Resume run',exact:true}).click();
 async function go(x,y){
   const began=Date.now();let keys=new Set();
   while(Date.now()-began<10000){s=await snapshot();const dx=x-s.x,dy=y-s.y;if(Math.hypot(dx,dy)<.16)break;
     const wanted=new Set();if(Math.abs(dx)>.10)wanted.add(dx>0?'d':'a');if(Math.abs(dy)>.10)wanted.add(dy>0?'s':'w');
     for(const k of keys)if(!wanted.has(k))await page.keyboard.up(k);for(const k of wanted)if(!keys.has(k))await page.keyboard.down(k);keys=wanted;await page.waitForTimeout(45);
   }
   for(const k of keys)await page.keyboard.up(k);await page.waitForTimeout(170);s=await snapshot();assert(Math.hypot(x-s.x,y-s.y)<.36,`Route blocked at ${s.x},${s.y}, aiming ${x},${y}`);
 }
 await go(3.7,17.6);await go(3.7,10.65);await go(6.6,10.65);await go(6.6,7.0);await go(8.9,7.0);await go(8.9,6.45);
 // Pointer hold verifies the real pickup control, not a state shortcut.
 const take=await page.getByTestId('take-button').boundingBox();await page.mouse.move(take.x+take.width/2,take.y+take.height/2);await page.mouse.down();await page.waitForTimeout(550);await page.mouse.up();await page.waitForTimeout(150);s=await snapshot();assert(s.carrying,'Pickup failed');assert.equal(s.battery,100);await page.screenshot({path:'verification/web-carrying.png'});
 await page.keyboard.down('w');await page.keyboard.press('Space');await page.waitForTimeout(220);await page.keyboard.up('w');await page.waitForTimeout(180);s=await snapshot();assert.equal(s.battery,80);assert.equal(s.dashes,1);
 await go(9.4,3.5);await go(9.4,2.1);await page.waitForFunction(()=>window.__SEEKER_MVP__.snapshot().status==='won');
 const result=await snapshot();const metrics=await page.evaluate(()=>window.__SEEKER_MVP__.metrics());assert(result.score>=11600);assert(await page.getByText('Clean getaway.',{exact:true}).isVisible());await page.screenshot({path:'verification/web-extracted.png'});
 await page.getByRole('button',{name:'Retry level',exact:true}).click();await page.waitForTimeout(180);assert.equal((await snapshot()).carrying,false);
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(600);await page.screenshot({path:'verification/web-desktop.png'});
 await page.setViewportSize({width:360,height:740});await page.waitForTimeout(600);const smallFooter=await page.getByText('WASD / arrows  ·  E hold to take  ·  Space dash  ·  R reset',{exact:true}).boundingBox();assert(smallFooter.y+smallFooter.height<=741);await page.screenshot({path:'verification/web-small-phone.png'});
 assert.deepEqual(errors,[]);const report={status:'passed',url:process.env.MVP_URL||'http://localhost:8082',sourceHashes:Object.fromEntries(['src/GameScreen.tsx','src/game/simulation.ts','src/game/level.ts','src/components/GameCanvas.tsx','src/game/art.ts'].map(f=>[f,require('crypto').createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),environment:'Headless Chrome on local Mac, not a physical phone',viewport:{width:430,height:932},checks:['header and controls fit','pointer joystick','wall collision','pause freezes run','pickup via pointer hold','keyboard movement','dash costs once','complete extraction','retry clears state','desktop and small-phone layout','no uncaught browser errors'],result,metrics};fs.writeFileSync('verification/web-playtest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
