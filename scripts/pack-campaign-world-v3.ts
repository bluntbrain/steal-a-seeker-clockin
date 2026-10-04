import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {campaignRoadSvgPath,MAP_ASPECT} from '../src/components/campaignRoad';
const root=path.resolve('assets/campaign-world-v3'),W=768,H=W*MAP_ASPECT;
const wrap=(body:string)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`);
async function main(){
 const actors:Record<string,Buffer>={};
 for(const [source,names] of [['giants-a',['toly','mert','chase','lily']],['giants-b',['vibhu','akshay','beeman','seeker']]] as const){
  const file=path.join(root,'source',source+'.png'),m=await sharp(file).metadata();
  if(!m.hasAlpha)throw new Error(`${source} must have transparency`);
  for(let i=0;i<4;i++){
   const left=Math.round((i%2)*m.width!/2),top=Math.round(Math.floor(i/2)*m.height!/2);
   const width=Math.round((i%2+1)*m.width!/2)-left,height=Math.round((Math.floor(i/2)+1)*m.height!/2)-top;
   actors[names[i]!]=await sharp(file).extract({left,top,width,height}).resize(336,336,{fit:'contain',background:'#0000'}).png().toBuffer();
  }
 }
 const schemes=[
  {id:'warehouse',characters:['toly','mert','beeman'],brands:['jupiter','bonk','solana'],labels:['JUPITER','BONK','SOLANA']},
  {id:'rooftops',characters:['chase','lily','seeker'],brands:['meteora','wif','skr'],labels:['METEORA','WIF','SKR']},
  {id:'powerworks',characters:['vibhu','akshay','seeker'],brands:['pump','phantom','solana'],labels:['PUMP','PHANTOM','SOLANA']},
 ];
 const manifest=[];
 for(const scheme of schemes){
  // The first and last 80 pixels are identical for every tile. No overlap or masking of the road at joins.
  const ground=wrap(`<defs><radialGradient id="soft"><stop stop-color="#345D4F" stop-opacity=".3"/><stop offset="1" stop-color="#16352F" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="#16352F"/><ellipse cx="${W*.5}" cy="${H*.5}" rx="${W*.8}" ry="${H*.44}" fill="url(#soft)"/>`);
  const layers:sharp.OverlayOptions[]=[];
  for(let n=0;n<3;n++){
   const bay=[0,3,4][n]!,centerX=(bay%2===0?.215:.785)*W,centerY=(bay*.5+.25)*W;
   layers.push({input:actors[scheme.characters[n]!]!,left:Math.round(centerX-168),top:Math.round(centerY-168)});
  }
  for(let n=0;n<3;n++){
   const bay=[1,2,5][n]!,x=(bay%2===0?.21:.79)*W,y=(bay*.5+.25)*W,brand=scheme.brands[n]!;
   // Small, spaced ecosystem landmarks; the official marks retain their original colors and proportions.
   layers.push({input:wrap(`<ellipse cx="${x}" cy="${y+35}" rx="77" ry="20" fill="#102A25"/><ellipse cx="${x}" cy="${y+23}" rx="71" ry="19" fill="#244A3F" stroke="#466D59" stroke-width="2"/><text x="${x}" y="${y+78}" text-anchor="middle" fill="#A5C9B8" font-family="sans-serif" font-size="19" font-weight="600" letter-spacing="2">${scheme.labels[n]}</text>`),left:0,top:0});
   const ext=['bonk','wif'].includes(brand)?'png':'svg';
   layers.push({input:await sharp(path.join(root,'brands',brand+'.'+ext)).resize(96,96,{fit:'contain',background:'#0000'}).png().toBuffer(),left:Math.round(x-48),top:Math.round(y-65)});
  }
  const d=campaignRoadSvgPath(W);
  layers.push({input:wrap(`<g fill="none" stroke-linejoin="round"><path d="${d}" stroke="#102B25" stroke-width="82"/><path d="${d}" stroke="#6A8D79" stroke-width="69"/><path d="${d}" stroke="#2D5144" stroke-width="63"/><path d="${d}" stroke="#8AB19B" stroke-width="3" opacity=".16"/></g>`),left:0,top:0});
  const png=await sharp(ground).composite(layers).png().toBuffer();
  // Lossless keeps seam pixels exact; only three static decoded images are virtualized at runtime.
  const output=await sharp(png).webp({lossless:true,effort:6}).toBuffer();
  await fs.writeFile(path.join(root,scheme.id+'.webp'),output);
  manifest.push({id:scheme.id,width:W,height:H,bytes:output.length,sha256:crypto.createHash('sha256').update(output).digest('hex'),characters:scheme.characters,brands:scheme.brands});
  console.log(`${scheme.id}: ${Math.round(output.length/1024)} KiB`);
 }
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({generator:'Built-in image_gen (character/Seeker dioramas)',packing:'sharp compositing, native road geometry from src/components/campaignRoad.ts',scenes:manifest},null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
