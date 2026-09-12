const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),checks=[];try{
 for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[1280,800]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const mode of ['local','devnet'])for(const state of ['offer','review','cancelled','used','error','busy']){
   const params=new URLSearchParams({mode,stage:['used'].includes(state)?'cancelled':['error','busy'].includes(state)?'offer':state});if(['used','error','busy'].includes(state))params.set(state,'1');
   await page.goto('http://127.0.0.1:8787/design/economy/paywall/index.html?'+params);await page.getByRole('button').first().waitFor();await page.waitForTimeout(60);
   for(const button of await page.getByRole('button').all()){const box=await button.boundingBox();assert(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,JSON.stringify({width,height,mode,state,box}));assert(box.height>=44);}
   const overflow=await page.evaluate(()=>[...document.querySelectorAll('div')].filter(el=>el.scrollHeight>el.clientHeight+2&&['scroll','auto'].includes(getComputedStyle(el).overflowY)).length);assert.equal(overflow,0,`scrolling ${width} ${mode} ${state}`);
   if(width===390&&mode==='local'&&['review','cancelled'].includes(state)){await page.waitForTimeout(300);await page.screenshot({path:`verification/paywall-v3-${state}.png`});}
   if(width===320&&mode==='devnet'&&state==='error'){await page.waitForTimeout(300);await page.screenshot({path:'verification/paywall-v3-devnet-small.png'});}
   if(state==='busy')assert(await page.getByRole('button').first().isDisabled());checks.push({width,height,mode,state,fit:true});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 fs.writeFileSync('verification/paywall-v3-layout.json',JSON.stringify({passed:true,cases:checks},null,2));console.log(`${checks.length} paywall layouts passed`);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
