const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
 fs.mkdirSync('verification/world-v3',{recursive:true});const errors=[],checks=[],levels=JSON.parse(fs.readFileSync('design/visual-v2/levels.json'));
 const waitImages=async p=>{await p.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));await p.waitForTimeout(300);};
 const fits=async(p,label)=>{const bad=await (await p.locator('[aria-modal=true]').count()?p.locator('[aria-modal=true]').last():p).getByRole('button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5);}).map(e=>e.getAttribute('aria-label')||e.innerText));assert.deepEqual(bad,[],label+' buttons fit');checks.push(label);};
 for(const [width,height] of [[320,568],[390,844],[430,932]]){
  const p=await browser.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8787/?build=world-v3');await p.getByRole('button',{name:'Buy campaign · 50 playtest credits',exact:true}).click();await waitImages(p);assert.equal(await p.getByRole('button',{name:/Collection .*: not recovered/}).count(),12);await fits(p,'rack '+width);await p.screenshot({path:`verification/world-v3/rack-empty-${width}.png`});
  await p.getByRole('button',{name:'Mission map',exact:true}).click();await waitImages(p);assert.equal(await p.getByRole('button',{name:/Mission \d+:/}).count(),12);await fits(p,'map '+width);await p.screenshot({path:`verification/world-v3/map-${width}.png`});
  await p.getByRole('button',{name:'Mission 2: Cone Lesson. Locked',exact:true}).click();await p.getByRole('button',{name:'Start Cone Lesson',exact:true}).isDisabled().then(v=>assert(v));await fits(p,'locked briefing '+width);
  await p.getByRole('button',{name:'Back to district map',exact:true}).click();await p.getByRole('button',{name:'Mission 1: Quiet Pickup',exact:true}).click();await waitImages(p);await fits(p,'briefing '+width);await p.screenshot({path:`verification/world-v3/briefing-${width}.png`});await p.getByRole('button',{name:'Start Quiet Pickup',exact:true}).click();await p.waitForTimeout(400);await fits(p,'game '+width);await p.screenshot({path:`verification/world-v3/game-${width}.png`});await p.close();
 }
 const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
 // Separate gallery profile: restore previously verified, actual-input campaign wins.
 const verified=JSON.parse(fs.readFileSync('verification/security-campaign-web-playtest.json'));assert.equal(verified.status,'passed');assert.equal(verified.results.length,12);
 const missions=Object.fromEntries(verified.results.map(({mission,result:s})=>[mission,{stars:1+Number(s.battery>=40)+Number(!s.spotted&&s.elapsed<=levels.find(l=>l.id===mission).targetSeconds),seconds:s.elapsed,score:s.score,battery:s.battery,completions:1}]));
 await p.addInitScript(missions=>{localStorage.setItem('seeker.browser-playtest.v1',JSON.stringify({version:1,balance:200,owned:['campaign'],equipment:{},receipts:[],entry:null,daily:null,results:[]}));localStorage.setItem('seeker.campaign.devnet.browser-playtest.v1',JSON.stringify({version:1,missions}));},missions);
 await p.goto('http://127.0.0.1:8787');await waitImages(p);assert.equal(await p.getByRole('button',{name:/Collection .*: recovered/}).count(),12);await p.screenshot({path:'verification/world-v3/rack-full.png'});
 for(const l of levels){
  if(l.number>1)await p.getByRole('button',{name:'Open hideout',exact:true}).click();
  await p.getByRole('button',{name:'Mission map',exact:true}).click();await waitImages(p);
  if(l.number===1)await p.screenshot({path:'verification/world-v3/map-full.png'});
  await p.getByRole('button',{name:`Mission ${l.number}: ${l.title}`,exact:true}).click();await waitImages(p);await p.screenshot({path:`verification/world-v3/briefing-${l.id}.png`});
  await p.getByRole('button',{name:`Start ${l.title}`,exact:true}).click();await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>window.__SEEKER_MVP__.snapshot().mission),l.id);await p.screenshot({path:`verification/world-v3/level-${l.id}.png`});
 }
 await p.reload();await p.getByRole('button',{name:'Collection Frost: recovered',exact:true}).waitFor();assert.equal(await p.getByRole('button',{name:/Collection .*: recovered/}).count(),12);checks.push('12 earned collection slots restored from existing save','all 12 briefings and playable levels render','all mission nodes select their correct level','locks preserved');assert.deepEqual(errors,[]);
 fs.writeFileSync('verification/world-v3/checks.json',JSON.stringify({passed:true,scope:'Chrome web; 320×568, 390×844, 430×932. Full rack gallery uses previous verified campaign wins in isolated profile. Android deferred.',checks},null,2));console.log('World v3 checks passed');await p.close();
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
