const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='verification/mission-polish';fs.mkdirSync(out,{recursive:true});
const ids=['practice','cone-lesson','battery-dash','crossing-signals','sweep-window','narrow-crossing','false-footsteps','warden-gate','power-trade','two-targets','silent-circuit','last-vault'];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Explicit completion-layout fixture: eleven recorded wins, then play the
 // missing tutorial with pointer inputs. Not evidence of twelve human wins.
 await page.addInitScript(ids=>{localStorage.setItem('seeker.campaign.progress.v1',JSON.stringify({version:1,missions:Object.fromEntries(ids.slice(1).map(id=>[id,{stars:2,seconds:60,score:5000,battery:70,completions:1}]))}));},ids);
 await page.goto('http://127.0.0.1:8787/?build=mission-polish');await page.getByRole('button',{name:/Continue ·/}).click();await page.getByTestId('tutorial-instruction').waitFor();await page.waitForTimeout(350);
 const coords=[[2.1,15.3],[2.1,12.2],[3,11],[6.8,10.7],[6.8,14.9],[9,10],[9.8,3.4],[9.8,18.1]];
 for(let i=0;i<coords.length;i++){const instruction=await page.getByTestId('tutorial-instruction').innerText(),box=await page.getByTestId('game-board').boundingBox();console.log('TUTORIAL',i,instruction);let [x,y]=coords[i];if(i===2||i===5){const g=await page.evaluate(i=>window.__SEEKER_MVP__.snapshot().guards[i],i===2?0:1);x=g.x;y=g.y;}await page.mouse.click(box.x+1+x/12*(box.width-2),box.y+1+y/20*(box.height-2));if(i<7)await page.waitForFunction(t=>document.querySelector('[data-testid="tutorial-instruction"]')?.textContent!==t,instruction,{timeout:20000}).catch(async error=>{await page.screenshot({path:out+'/tutorial-stall.png'});console.log('STALL',JSON.stringify(await page.evaluate(()=>window.__SEEKER_MVP__.snapshot())));throw error;});else await page.getByText('Every Seeker. Secured.',{exact:true}).waitFor({timeout:20000});}
 await page.waitForTimeout(500);assert.equal(await page.getByRole('button',{name:'View next mission',exact:true}).count(),0);
 const share=page.getByRole('button',{name:'Share campaign completion card on X',exact:true}),replay=page.getByRole('button',{name:'Retry level',exact:true});await share.waitFor();await page.waitForFunction(()=>!document.querySelector('[aria-label="Share campaign completion card on X"]')?.getAttribute('aria-disabled'));
 const a=await share.boundingBox(),b=await replay.boundingBox();assert(a.x>b.x);assert(a.y+a.height<=844);await page.screenshot({path:out+'/campaign-complete.png'});
 const download=page.waitForEvent('download');await share.click();await(await download).saveAs(out+'/campaign-card.png');await page.getByRole('button',{name:'Open X with campaign completion post',exact:true}).waitFor();assert((await page.locator('body').innerText()).includes('Card saved.'));await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.getByText('Every Seeker. Secured.',{exact:true}).waitFor();
 await page.setViewportSize({width:360,height:640});await page.screenshot({path:out+'/campaign-complete-small.png'});const sheet=await page.getByTestId('result-sheet').boundingBox();assert(sheet.y>=0);assert(sheet.y+sheet.height<=641);
 // Recover a normal campaign run and use only real pointer taps for cover.
 await page.getByRole('button',{name:'Back to missions',exact:true}).click();await page.setViewportSize({width:390,height:844});
 fs.writeFileSync(out+'/home-buttons.json',JSON.stringify(await page.getByRole('button').allTextContents()));
 console.log('BUTTONS',await page.getByRole('button').allTextContents());
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser-report.json',JSON.stringify({passed:true,scope:'11 saved-win fixtures plus actual pointer tutorial completion; responsive finale and PNG export',errors,checks:['no next mission when campaign complete','replay left / share right','390x844 and 360x640 finale fits','real PNG download','X compose entry without automatic posting']},null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
