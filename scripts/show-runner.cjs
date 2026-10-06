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
 // stage mode uses the real window size (the stage scales itself) and hides chrome's automation and sandbox bars
 const browser=await chromium.launchPersistentContext(path.resolve(evalMode?'.jev-profile-eval':'.jev-profile'),{headless,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',ignoreDefaultArgs:['--enable-automation','--no-sandbox'],args:[stage?'--window-size=1920,1080':'--window-size=430,900','--autoplay-policy=no-user-gesture-required'],viewport:stage?null:{width:390,height:844}});
 const page=browser.pages()[0]||await browser.newPage();
 process.on('SIGTERM',async()=>{try{await browser.close();}catch{}process.exit(0);});process.on('SIGINT',async()=>{try{await browser.close();}catch{}process.exit(0);});
 const winsFile=path.join('verification/jev','wins.json');const wins=new Set(fs.existsSync(winsFile)?JSON.parse(fs.readFileSync(winsFile,'utf8')):[]);
 const recordWin=n=>{wins.add(n);fs.mkdirSync('verification/jev',{recursive:true});fs.writeFileSync(winsFile,JSON.stringify([...wins].sort((a,b)=>a-b)));};
 if(stage)await page.goto(`${bridge}/stage`);
 // in stage mode every game action targets the iframe; the frame is found by its url after each navigation
 const game=()=>stage?page.frames().find(f=>f.url().startsWith(base))??page.mainFrame():page;
 // the game frame is ready when it carries the scripting hook; localStorage and buttons live in that origin
 const gameReady=async()=>{for(let i=0;i<40;i++){const ok=await game().evaluate(()=>!!window.__SEEKER_MVP__).catch(()=>false);if(ok&&(!stage||game()!==page.mainFrame()))return true;await sleep(250);}return false;};
 const gotoGame=async()=>{if(stage){await page.evaluate(u=>{document.getElementById('game').src=u;},url);}else await page.goto(url);await gameReady();};
 const log=[],outDir='verification/jev';fs.mkdirSync(outDir,{recursive:true});
 const outFile=path.join(outDir,`${evalMode?'eval':'show'}-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'-')}.json`);
 const save=()=>fs.writeFileSync(outFile,JSON.stringify({url,from,to,evalMode,levels:log},null,1));
 const state=()=>game().evaluate(()=>{const m=window.__SEEKER_MVP__,p=window.__JEV_PILOT__;const s=m&&m.snapshot();return s?{status:s.status,x:s.x,y:s.y,ticks:s.ticks,suspended:!!m.suspended,hp:s.combat?s.combat.hp:null,elapsed:s.elapsed,score:s.score,kills:s.combat?s.combat.kills:0,decisions:p?p.decisions:0,mode:p?p.mode:'none',errors:p?p.errors:0}:null;}).catch(()=>null);
 const clickIf=async(sel,ms=1500)=>{try{const el=game().locator(sel).first();await el.waitFor({state:'visible',timeout:ms});await el.click();return true;}catch{return false;}};
 const seed=async upto=>{const keys=[];for(let n=1;n<=upto;n++)keys.push(keyOf(n));await game().evaluate(k=>{localStorage.setItem('seeker.campaign.progress.v1',JSON.stringify({version:1,missions:Object.fromEntries(k.map(x=>[x,{stars:3,seconds:60,score:900,battery:80,completions:1}]))}));},keys);};
 await gotoGame();await sleep(1500);
 await game().evaluate(()=>{Object.keys(localStorage).filter(k=>/tutorial|guide/i.test(k)).forEach(k=>localStorage.removeItem(k));});
 if(evalMode)await seed(to);
 // the preview plays as the browser-playtest wallet, so the game saves under seeker.campaign.<network>.<wallet>.v1;
 // the guest key is merged in on load. read every campaign save and take the union
 const cleared=async()=>game().evaluate(k=>{try{const p={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!/^seeker\.campaign\.(progress|[a-z]+\.[^.]+)\.v1$/.test(key||''))continue;try{Object.assign(p,JSON.parse(localStorage.getItem(key)||'{}').missions||{});}catch{}}let top=0;for(const key of k){if(p[key])top++;else break;}return top;}catch{return 0;}},Array.from({length:to},(_,i)=>keyOf(i+1))).catch(()=>0);
 let n=from;
 // a show continues from the first locked level, never replays cleared ones and never skips ahead of an unlock
 if(!evalMode&&wins.size){let top=0;while(wins.has(top+1))top++;const have=await cleared();if(top>have){await seed(top);console.log(`restored jev's own ${top} earned unlocks into the profile`);}}
 if(!evalMode){const top=await cleared();console.log(`jev has cleared ${top} level${top===1?'':'s'} in this profile; starting at ${Math.max(from,top+1)}`);n=Math.max(from,Math.min(n,top+1),top+1);}
 while(n<=to){
  let outcome='skipped',deaths=0,back=false;
  for(let attempt=0;attempt<retries;attempt++){
   await gotoGame();await sleep(1800);
   await game().evaluate(()=>{const b=document.querySelector('[aria-label="Skip Game Pass and play free"]');b&&b.click();});await sleep(1200);
   await game().evaluate(k=>{const el=document.querySelector(`[data-testid=mission-node-${k}]`);el&&el.scrollIntoView();},n);await sleep(400);
   // never move on because a button failed: a missing node is retried, a locked node sends the run back to the first locked level
   const label=await game().evaluate(k=>{const el=document.querySelector(`[data-testid=mission-node-${k}]`);return el?el.getAttribute('aria-label')||'':'';},n).catch(()=>'');
   if(!label){console.log(`level ${n}: node not on the map yet, retrying`);await sleep(3000);attempt--;continue;}
   if(/locked/i.test(label)){const top=await cleared();console.log(`level ${n} is locked, jev has cleared ${top}; going back to ${top+1}`);n=top+1;back=true;break;}
   if(!await clickIf(`[data-testid=mission-node-${n}]`,3000)){console.log(`level ${n}: node did not open, retrying`);attempt--;continue;}
   await sleep(900);await game().evaluate(()=>{const b=[...document.querySelectorAll('[role=button]')].find(e=>/^Start /.test(e.getAttribute('aria-label')||''));b&&b.click();});
   await sleep(1500);await game().evaluate(()=>{const b=document.querySelector('[data-testid=mission-intro-start]');b&&b.click();});
   await sleep(3500);await game().evaluate(()=>{const b=document.querySelector('[aria-label="Skip combat tutorial"]');b&&b.click();});
   // the level has started only when the simulation is unsuspended and ticking; otherwise press the buttons again
   let running=false;for(let k=0;k<6&&!running;k++){const a=await state();await sleep(1500);const b=await state();running=!!(a&&b&&!b.suspended&&b.status==='playing'&&b.ticks>a.ticks);
    if(!running){await game().evaluate(()=>{for(const sel of ['[data-testid=mission-intro-start]','[aria-label="Skip combat tutorial"]','[aria-label="Resume run"]']){const b=document.querySelector(sel);if(b){b.click();return;}}const start=[...document.querySelectorAll('[role=button]')].find(e=>/^Start /.test(e.getAttribute('aria-label')||''));start&&start.click();});await sleep(2500);}}
   if(!running)console.log(`level ${n} attempt ${attempt+1}: could not start the level (menu stuck)`);
   const started=Date.now();let s=await state(),last=null,beat=Date.now();
   while(running&&Date.now()-started<240000){s=await state();if(s&&s.status!=='playing')break;if(Date.now()-beat>30000){beat=Date.now();console.log(`  level ${n} running: tick ${s&&s.ticks}, at (${s&&s.x.toFixed(1)}, ${s&&s.y.toFixed(1)}), hp ${s&&s.hp}, decisions ${s&&s.decisions}`);}await sleep(1000);}
   last=running?(s||{status:'unknown'}):{status:'not started',decisions:0,mode:'idle',hp:null,kills:0};
   console.log(`level ${n} attempt ${attempt+1}: ${last.status} in ${((Date.now()-started)/1000).toFixed(0)}s, ${last.decisions} decisions (${last.mode}), hp ${last.hp}, kills ${last.kills}`);
   try{await fetch(`${bridge}/outcome`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:n,outcome:last.status})});}catch{}
   // the game writes the win to its save a moment after the status flips, so wait for it rather than checking once
   let saved=evalMode;for(let k=0;k<32&&!saved&&last.status==='won';k++){saved=(await cleared())>=n;if(!saved)await sleep(250);}
   if(last.status==='won'&&!saved)console.log(`level ${n}: the game showed a win but its save did not confirm it, replaying`);
   if(last.status==='won'&&saved){outcome='won';if(!evalMode)recordWin(n);log.push({level:n,outcome,attempts:attempt+1,deaths,seconds:+((Date.now()-started)/1000).toFixed(1),decisions:last.decisions,mode:last.mode,score:last.score,kills:last.kills,hp:last.hp});break;}
   deaths++;if(attempt===retries-1){log.push({level:n,outcome:'skipped',attempts:retries,deaths,mode:last.mode});}
  }
  save();
  if(back)continue;
  if(outcome==='won'||evalMode)n++; // a show never leaves a level unsolved
 }
 const won=log.filter(l=>l.outcome==='won').length;console.log(`done: ${won} of ${log.length} levels won, receipt ${outFile}`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
