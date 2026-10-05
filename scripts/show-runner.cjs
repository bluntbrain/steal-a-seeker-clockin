// drives the web build through the campaign while the jev pilot plays each level. the runner only presses
// the buttons a player presses (level node, start, play, next mission, retry) and records the outcome.
// usage: node scripts/show-runner.cjs [--from 1] [--to 100] [--headless] [--retries 5] [--eval] [--stage]
//   --stage opens the 1920 by 1080 stage page from the bridge and drives the game inside its iframe
//   --eval unlocks every level up front so any range can be measured; without it progress is earned
// env: MVP_URL (default http://127.0.0.1:8787), BRIDGE (default http://127.0.0.1:8791), PLAYWRIGHT_MODULE
const fs=require('fs'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||path.join(process.env.HOME,'.claude/skills/gstack/node_modules/playwright'));
const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>=0?process.argv[i+1]:d;},flag=n=>process.argv.includes(`--${n}`);
const from=Number(arg('from',1)),to=Number(arg('to',100)),evalMode=flag('eval'),headless=flag('headless'),stage=flag('stage');
// a show retries until jev wins so every unlock is earned; an evaluation moves on after a few tries
const retries=arg('retries')?Number(arg('retries')):evalMode?3:Infinity;
const base=process.env.MVP_URL||'http://127.0.0.1:8787',bridge=process.env.BRIDGE||'http://127.0.0.1:8791';
const url=`${base}/?build=free-campaign-store&pilot=jev&bridge=${encodeURIComponent(bridge)}`;
const AUTHORED=['practice','cone-lesson','battery-dash','crossing-signals','sweep-window','narrow-crossing','false-footsteps','warden-gate','power-trade','two-targets','silent-circuit','last-vault'];
const keyOf=n=>n<=12?AUTHORED[n-1]:`campaign:${n}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 // one persistent profile: progress, unlocked levels and the tutorial flag survive restarts
 const browser=await chromium.launchPersistentContext(path.resolve(evalMode?'.jev-profile-eval':'.jev-profile'),{headless,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:[stage?'--window-size=1920,1080':'--window-size=430,900','--autoplay-policy=no-user-gesture-required'],viewport:stage?{width:1920,height:1080}:{width:390,height:844}});
 const page=browser.pages()[0]||await browser.newPage();
 if(stage)await page.goto(`${bridge}/stage`);
 // in stage mode every game action targets the iframe; the frame is found by its url after each navigation
 const game=()=>stage?page.frames().find(f=>f.url().startsWith(base))??page.mainFrame():page;
 const gotoGame=async()=>{if(stage){await page.evaluate(u=>{document.getElementById('game').src=u;},url);await sleep(2500);}else await page.goto(url);};
 const log=[],outDir='verification/jev';fs.mkdirSync(outDir,{recursive:true});
 const outFile=path.join(outDir,`${evalMode?'eval':'show'}-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.json`);
 const save=()=>fs.writeFileSync(outFile,JSON.stringify({url,from,to,evalMode,levels:log},null,1));
 const state=()=>game().evaluate(()=>{const m=window.__SEEKER_MVP__,p=window.__JEV_PILOT__;const s=m&&m.snapshot();return s?{status:s.status,x:s.x,y:s.y,ticks:s.ticks,suspended:!!m.suspended,hp:s.combat?s.combat.hp:null,elapsed:s.elapsed,score:s.score,kills:s.combat?s.combat.kills:0,decisions:p?p.decisions:0,mode:p?p.mode:'none',errors:p?p.errors:0}:null;}).catch(()=>null);
 const clickIf=async(sel,ms=1500)=>{try{const el=game().locator(sel).first();await el.waitFor({state:'visible',timeout:ms});await el.click();return true;}catch{return false;}};
 const seed=async upto=>{const keys=[];for(let n=1;n<=upto;n++)keys.push(keyOf(n));await game().evaluate(k=>{localStorage.setItem('seeker.campaign.progress.v1',JSON.stringify({version:1,missions:Object.fromEntries(k.map(x=>[x,{stars:3,seconds:60,score:900,battery:80,completions:1}]))}));},keys);};
 await gotoGame();await sleep(1500);
 await game().evaluate(()=>{Object.keys(localStorage).filter(k=>/tutorial|guide/i.test(k)).forEach(k=>localStorage.removeItem(k));});
 if(evalMode)await seed(to);
 const cleared=async()=>game().evaluate(k=>{try{const p=JSON.parse(localStorage.getItem('seeker.campaign.progress.v1')||'{}').missions||{};let top=0;for(const key of k){if(p[key])top++;else break;}return top;}catch{return 0;}},Array.from({length:to},(_,i)=>keyOf(i+1))).catch(()=>0);
 let n=from;
 if(!evalMode){const top=await cleared();if(n>top+1){console.log(`level ${n} is locked; jev has cleared ${top}, starting at ${top+1}`);n=top+1;}}
 for(;n<=to;n++){
  let outcome='skipped',deaths=0;
  for(let attempt=0;attempt<retries;attempt++){
   await gotoGame();await sleep(1800);
   await game().evaluate(()=>{const b=document.querySelector('[aria-label="Skip Game Pass and play free"]');b&&b.click();});await sleep(1200);
   await game().evaluate(k=>{const el=document.querySelector(`[data-testid=mission-node-${k}]`);el&&el.scrollIntoView();},n);await sleep(400);
   if(!await clickIf(`[data-testid=mission-node-${n}]`,3000)){console.log(`level ${n}: node not on the map`);break;}
   await sleep(900);await game().evaluate(()=>{const b=[...document.querySelectorAll('[role=button]')].find(e=>/^Start /.test(e.getAttribute('aria-label')||''));b&&b.click();});
   await sleep(1500);await game().evaluate(()=>{const b=document.querySelector('[data-testid=mission-intro-start]');b&&b.click();});
   await sleep(3500);await game().evaluate(()=>{const b=document.querySelector('[aria-label="Skip combat tutorial"]');b&&b.click();});
   // the level has started only when the simulation is unsuspended and ticking; otherwise press the buttons again
   let running=false;for(let k=0;k<6&&!running;k++){const a=await state();await sleep(1500);const b=await state();running=!!(a&&b&&!b.suspended&&b.status==='playing'&&b.ticks>a.ticks);
    if(!running){await game().evaluate(()=>{for(const sel of ['[data-testid=mission-intro-start]','[aria-label="Skip combat tutorial"]','[aria-label="Resume run"]']){const b=document.querySelector(sel);if(b){b.click();return;}}const start=[...document.querySelectorAll('[role=button]')].find(e=>/^Start /.test(e.getAttribute('aria-label')||''));start&&start.click();});await sleep(2500);}}
   if(!running)console.log(`level ${n} attempt ${attempt+1}: could not start the level (menu stuck)`);
   const started=Date.now();let s=await state(),last=null,beat=Date.now();
   while(running&&Date.now()-started<240000){s=await state();if(s&&s.status!=='playing')break;if(Date.now()-beat>30000){beat=Date.now();console.log(`  level ${n} running: tick ${s&&s.ticks}, at (${s&&s.x.toFixed(1)}, ${s&&s.y.toFixed(1)}), hp ${s&&s.hp}, decisions ${s&&s.decisions}`);}await sleep(1000);}
   last=s||{status:'unknown'};
   console.log(`level ${n} attempt ${attempt+1}: ${last.status} in ${((Date.now()-started)/1000).toFixed(0)}s, ${last.decisions} decisions (${last.mode}), hp ${last.hp}, kills ${last.kills}`);
   try{await fetch(`${bridge}/outcome`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:n,outcome:last.status})});}catch{}
   if(last.status==='won'){outcome='won';log.push({level:n,outcome,attempts:attempt+1,deaths,seconds:+((Date.now()-started)/1000).toFixed(1),decisions:last.decisions,mode:last.mode,score:last.score,kills:last.kills,hp:last.hp});break;}
   deaths++;if(attempt===retries-1){log.push({level:n,outcome:'skipped',attempts:retries,deaths,mode:last.mode});}
  }
  save();
 }
 const won=log.filter(l=>l.outcome==='won').length;console.log(`done: ${won} of ${log.length} levels won, receipt ${outFile}`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
