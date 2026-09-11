const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),assert=require('assert');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const p=await b.newPage({viewport:{width:430,height:932}});let errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.MVP_URL||'http://127.0.0.1:8787');await p.waitForFunction(()=>window.__SEEKER_MVP__?.snapshot().ticks>3);
 await p.getByRole('button',{name:'Switch to 2D view',exact:true}).click();
 const snap=()=>p.evaluate(()=>window.__SEEKER_MVP__.snapshot());
 await p.getByRole('button',{name:'Play night shift mission',exact:true}).click();await p.waitForTimeout(300);
 assert.equal((await snap()).guards.length,2);await p.screenshot({path:'verification/night-shift-start.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(200);const paused=await snap();await p.waitForTimeout(500);assert.deepEqual((await snap()).guards,paused.guards);await p.getByRole('button',{name:'Resume run',exact:true}).click();
 async function go(x,y){let keys=new Set(),start=Date.now();while(Date.now()-start<7000){const s=await snap();if(s.status!=='playing')break;const dx=x-s.x,dy=y-s.y;if(Math.hypot(dx,dy)<.07)break;const want=new Set();if(Math.abs(dx)>.04)want.add(dx>0?'d':'a');if(Math.abs(dy)>.04)want.add(dy>0?'s':'w');for(const k of keys)if(!want.has(k))await p.keyboard.up(k);for(const k of want)if(!keys.has(k))await p.keyboard.down(k);keys=want;await p.waitForTimeout(25);}for(const k of keys)await p.keyboard.up(k);await p.waitForTimeout(140);}
 // Deliberately stand in the lower patrol's route; no simulation mutation.
 await go(3.7,17.6);await go(3.7,10.5);await go(5.3,10.5);
 await p.waitForFunction(()=>window.__SEEKER_MVP__.snapshot().status==='caught',{timeout:20000});
 assert(await p.getByText('They spotted you.',{exact:true}).isVisible());await p.screenshot({path:'verification/night-shift-caught.png'});
 await p.getByRole('button',{name:'Retry level',exact:true}).click();await p.waitForTimeout(150);assert.equal((await snap()).mission,'night-shift');assert.equal((await snap()).alert,0);
 let winner=null,attempts=[];
 for(const wait of [0,1,2,3,4,5,6,7]){
  await p.keyboard.press('r');await p.waitForTimeout(wait*1000);
  for(const [x,y] of [[3.7,17.6],[3.7,15.9],[10.7,15.9],[10.7,6.3],[8.9,6.3]]){await go(x,y);if((await snap()).status!=='playing')break;}
  if((await snap()).status==='playing'){
   await p.keyboard.down('e');await p.waitForTimeout(500);await p.keyboard.up('e');
   if((await snap()).carrying){await p.keyboard.down('w');await p.keyboard.press('Space');await p.waitForTimeout(220);await p.keyboard.up('w');await go(9.4,3.4);await go(9.4,2.1);await p.waitForTimeout(1100);}
  }
  const result=await snap();attempts.push({wait,status:result.status,x:result.x,y:result.y,carrying:result.carrying});console.log(JSON.stringify(attempts.at(-1)),{flush:true});
  if(result.status==='won'){winner=result;break;}
 }
 assert(winner,'No successful actual-input escape: '+JSON.stringify(attempts));await p.screenshot({path:'verification/night-shift-won.png'});
 await p.getByRole('button',{name:'Play practice mission',exact:true}).click();await p.waitForTimeout(200);assert.equal((await snap()).guards.length,0);
 assert.deepEqual(errors,[]);const report={status:'passed',checks:['mission selection','two patrols render','pause freezes guards','actual-input capture','retry keeps mission and clears alert','actual-input guarded extraction','practice mode remains unguarded','no browser errors'],attempts,result:winner,metrics:await p.evaluate(()=>window.__SEEKER_MVP__.metrics())};fs.writeFileSync('verification/night-shift-playtest.json',JSON.stringify(report,null,2));console.log('Night Shift playtest passed');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
