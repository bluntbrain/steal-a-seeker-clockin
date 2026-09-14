// Original vector artwork; export at 3x for crisp 22–24dp Android and web tabs.
const fs=require('node:fs/promises'),path=require('node:path');
const shapes={
 missions:'<rect x="4" y="3" width="16" height="18" rx="4"/><path d="M8 16l3-4 3 2 3-6"/><circle cx="8" cy="16" r="1" fill="white"/>',
 leaderboard:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6"/>',
 hideout:'<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><rect x="9" y="10" width="6" height="8" rx="1.5"/><path d="M11 16h2"/>'
};
async function main(){const {chromium}=require('playwright');const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage();for(const [name,shape] of Object.entries(shapes)){const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;const base=path.resolve(__dirname,'../assets/navigation',name);await fs.writeFile(base+'.svg',svg);const data=await page.evaluate(async svg=>{const im=new Image();im.src='data:image/svg+xml;base64,'+btoa(svg);await im.decode();const c=document.createElement('canvas');c.width=c.height=72;c.getContext('2d').drawImage(im,0,0,72,72);return c.toDataURL().split(',')[1];},svg);await fs.writeFile(base+'.png',Buffer.from(data,'base64'));}await browser.close();}main().catch(e=>{console.error(e);process.exitCode=1;});
