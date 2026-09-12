const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),checks=[];try{
 for(const [width,height] of [[320,568],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const click=name=>page.getByRole('button',{name,exact:true}).click();
  await page.goto('http://127.0.0.1:8787/?build=missions-first');await click('Buy campaign · 100 playtest credits');await click('Confirm campaign · 100 test credits');
  await page.getByRole('heading',{name:'Missions',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Mission \d+:/}).count(),12);assert.equal(await page.getByTestId('hideout-room').count(),0);
  const fit=async label=>{for(const el of await page.getByRole('dialog').getByRole('button').all()){if(!await el.isVisible())continue;const b=await el.boundingBox();assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,JSON.stringify({label,width,height,b,name:await el.getAttribute('aria-label')}));}};
  await fit('missions');await page.waitForTimeout(400);await page.screenshot({path:`verification/missions-home-${width}.png`});
  await click('View hideout rack');await page.getByTestId('hideout-room').waitFor();assert.equal(await page.getByRole('button',{name:/Mission \d+:/}).count(),0);await fit('hideout');await page.waitForTimeout(300);await page.screenshot({path:`verification/hideout-separate-${width}.png`});
  await click('Inspect Frost in 3D');await click('Close phone viewer');await click('Return to missions');await page.getByRole('heading',{name:'Missions',exact:true}).waitFor();
  await click('Mission 2: Cone Lesson. Locked');assert(await page.getByRole('button',{name:'Start Cone Lesson',exact:true}).isDisabled());await click('Back to district map');
  await click('Mission 1: Quiet Pickup');await fit('briefing');await click('Start Quiet Pickup');await page.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>5);
  await click('Open missions');await page.getByRole('heading',{name:'Missions',exact:true}).waitFor();const ticks=await page.evaluate(()=>window.__SEEKER_MVP__.snapshot().ticks);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__SEEKER_MVP__.snapshot().ticks),ticks);
  await page.reload();await page.getByRole('heading',{name:'Missions',exact:true}).waitFor();assert.equal(await page.getByTestId('hideout-room').count(),0);assert.deepEqual(errors,[]);checks.push({width,height,passed:true});await page.close();
 }
 fs.writeFileSync('verification/mission-navigation.json',JSON.stringify({passed:true,checks,coverage:['Missions on first paid entry and reload','Twelve map nodes','Hideout only through explicit entry','Phone inspector retained','Back to missions','Locked missions remain locked','Briefing starts gameplay','Gameplay returns to missions and pauses']},null,2));console.log('Mission navigation checks passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
