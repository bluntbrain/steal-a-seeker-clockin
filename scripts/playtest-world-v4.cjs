const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
fs.mkdirSync('verification/world-v4',{recursive:true});const levels=JSON.parse(fs.readFileSync('design/visual-v2/levels.json')),routes=JSON.parse(fs.readFileSync('verification/campaign-routes.json')).routes,errors=[],checks=[];
// All progress is seeded ONLY in an isolated visual-test profile, never a user's save.
const missions=Object.fromEntries(routes.map(r=>[r.mission,{stars:1,seconds:r.seconds,score:r.score,battery:50,completions:1}]));
const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(missions=>{localStorage.setItem('seeker.browser-playtest.v1',JSON.stringify({version:1,balance:200,owned:['campaign'],equipment:{},receipts:[],entry:null,daily:null,results:[]}));localStorage.setItem('seeker.campaign.devnet.browser-playtest.v1',JSON.stringify({version:1,missions}));},missions);
const click=n=>p.getByRole('button',{name:n,exact:true}).click();await p.goto('http://127.0.0.1:8787/?build=districts-v4');
for(const l of levels){
 if(l.number>1)await click('Open missions');
 await click(`Mission ${l.number}: ${l.title}`);await p.waitForTimeout(450);
 await p.screenshot({path:`verification/world-v4/briefing-${l.number}.png`});
 await click(`Start ${l.title}`);await p.waitForFunction(id=>window.__SEEKER_MVP__?.snapshot().mission===id,l.id);await p.waitForTimeout(350);
 const board=await p.getByTestId('game-board').boundingBox();assert(board.width>300&&board.height>600);await p.screenshot({path:`verification/world-v4/mission-${l.number}.png`});
 checks.push({number:l.number,mission:l.id,title:l.title,board,loadedDistrictAssets:await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/rooftop-floor|powerworks-floor/.test(n)).map(n=>n.split('/').pop()))});
}
for(const [width,height] of [[320,568],[430,932]]){await p.setViewportSize({width,height});await click('Open missions');await click('Mission 9: Power Trade');await p.waitForTimeout(200);const out=await p.getByRole('button').evaluateAll(es=>es.filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&(r.x<0||r.y<0||r.right>innerWidth+.5||r.bottom>innerHeight+.5)}).map(e=>e.getAttribute('aria-label')));assert.deepEqual(out,[]);await p.screenshot({path:`verification/world-v4/briefing-9-${width}.png`});await click('Start Power Trade');}
assert.deepEqual(errors,[]);fs.writeFileSync('verification/world-v4/checks.json',JSON.stringify({passed:true,scope:'All 12 actual game scenes and mission previews; isolated seeded unlocks; visual checks, not completion runs',checks,errors},null,2));console.log('12 district scenes and compact briefings passed');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
