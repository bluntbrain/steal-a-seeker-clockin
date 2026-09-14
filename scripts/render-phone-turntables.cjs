// Capture the existing WebGL models into a native-safe, draggable image atlas.
// Run with the browser preview serving the live 3D PhoneStage.web implementation.
const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('fs');
const names=['Frost','Graphite','Tide','Static','Mist','Orbit','Pearl','Circuit','Relic','Flux','Archive','Ghost'];
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
 const p=await b.newPage({viewport:{width:430,height:932}});
 await p.addInitScript(()=>localStorage.setItem('seeker.browser-playtest.v1',JSON.stringify({version:1,balance:200,owned:['campaign'],equipment:{},receipts:[],entry:null,daily:null,results:[]})));
 await p.goto('http://127.0.0.1:8787/');await p.getByTestId('tab-rack').click();
 for(const name of names){
  await p.getByRole('button',{name:`Collection ${name}: not recovered`,exact:true}).click();await p.getByTestId('phone-3d-pose').filter({hasText:'DRAG'}).waitFor();
  const stage=p.getByTestId('phone-3d-stage'),box=await stage.boundingBox(),frames=[];
  for(let i=0;i<18;i++){
   await p.getByRole('button',{name:i===16?'Show phone top':i===17?'Show phone bottom':'Show phone front',exact:true}).click();
   if(i>0&&i<16){const dx=i*Math.PI*2/16/.015;await p.mouse.move(box.x+20,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+20+dx,box.y+box.height/2,{steps:4});await p.mouse.up();}
   await p.waitForTimeout(90);
   const pose=await p.getByTestId('phone-3d-pose').innerText();const expected=i<16?Math.round(i*360/16):0;if(Math.abs(Number(pose.match(/· (-?\d+)°/)[1])-expected)>1)throw new Error(`${name} ${i} wrong pose ${pose}`);
   await stage.evaluate(el=>{el.style.borderRadius='0';});await p.getByTestId('phone-3d-pose').evaluate(el=>{el.style.visibility='hidden';});
   const input=await sharp(await stage.locator('canvas').screenshot()).resize(384,472).png().toBuffer();frames.push({input,left:(i%6)*384,top:Math.floor(i/6)*472});
   await p.getByTestId('phone-3d-pose').evaluate(el=>{el.style.visibility='visible';});
  }
  await sharp({create:{width:2304,height:1416,channels:3,background:'#101A21'}}).composite(frames).webp({quality:92}).toFile(`assets/phone-turntables/${name.toLowerCase()}.webp`);
  console.log('Rendered',name);await p.getByRole('button',{name:'Close phone viewer',exact:true}).click();
 }
 fs.writeFileSync('assets/phone-turntables/README.md','# Phone turntables\n\nRendered from our existing CollectiblePhone geometry and phone atlas. No new character art or external model.\n\nEach WebP contains 18 views: 16 yaw angles in 22.5 degree steps, then top and bottom. Six columns × three rows; each frame is 384 × 472 pixels. Native displays one frame at a time, avoiding an Expo GL context. Rebuild with scripts/render-phone-turntables.cjs while the web preview serves PhoneStage.web.tsx.\n');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
