import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import type {OverlayOptions} from 'sharp';
import {CAMPAIGN_WORLDS} from '../src/components/campaignWorlds';
import {campaignRoadSvgPath,MAP_ASPECT} from '../src/components/campaignRoad';
const root=path.resolve('assets/campaign-world-v4'),W=768,H=W*MAP_ASPECT;
const wrap=(body:string)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${body}</svg>`);
async function main(){
 const actors:Record<string,Buffer>={};
 const prompts=JSON.parse(await fs.readFile(path.join(root,'prompts.json'),'utf8')) as {key:string;cells:string[]}[];
 const sheets=[{file:'../campaign-world-v3/source/giants-a.png',rows:2,cells:['toly','mert','chase','lily']},{file:'../campaign-world-v3/source/giants-b.png',rows:2,cells:['vibhu','akshay','beeman','seeker']},...prompts.map(p=>({file:'source/'+p.key+'.png',rows:3,cells:p.cells}))];
 for(const {file:relative,rows,cells:names} of sheets){
  const file=path.join(root,relative),m=await sharp(file).metadata();
  if(!m.hasAlpha)throw new Error(`${relative} must have transparency`);
  for(let i=0;i<names.length;i++){
   const left=Math.round((i%2)*m.width!/2),top=Math.round(Math.floor(i/2)*m.height!/rows);
   const width=Math.round((i%2+1)*m.width!/2)-left,height=Math.round((Math.floor(i/2)+1)*m.height!/rows)-top;
   // Atlas gutters must not leak an adjacent cell into the map. New scenes also
   // get a 16px safety margin so tall props clear the road and outer image edges.
   const inset=rows===3?16:0,leftInset=names[i]==='lily-net'?32:names[i]==='validator'?48:inset;
   const topInset=names[i]==='meteora-shards'?-28:inset,bottomInset=names[i]==='pump-capsule'?60:inset;
   let actor=sharp(file).extract({left:left+leftInset,top:top+topInset,width:width-leftInset-inset,height:height-topInset-bottomInset});
   actor=actor.resize(rows===3?304:336,rows===3?304:336,{fit:'contain',background:'#0000'});
   if(rows===3)actor=actor.extend({top:16,bottom:16,left:16,right:16,background:'#0000'});
   actors[names[i]!]=await actor.png().toBuffer();
  }
 }
 // Scenes crossing an atlas cell are regenerated as individual sprites, never
 // cropped to hide the defect. Keep the full subject inside a padded footprint.
 const repairs=[...JSON.parse(await fs.readFile(path.join(root,'repair-prompts.json'),'utf8')),...JSON.parse(await fs.readFile(path.join(root,'additional-repair-prompts.json'),'utf8'))] as {key:string}[];
 for(const {key} of repairs){
  const file=path.join(root,'individual',key+'.png');
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x:number,y:number)=>data[(y*info.width+x)*4+3]!;
  for(let x=0;x<info.width;x++)if(alpha(x,0)>128||alpha(x,info.height-1)>128)throw new Error(`Cropped vertical sprite edge: ${key}`);
  for(let y=0;y<info.height;y++)if(alpha(0,y)>128||alpha(info.width-1,y)>128)throw new Error(`Cropped horizontal sprite edge: ${key}`);
  actors[key]=await sharp(file).trim({background:'#0000',threshold:10}).resize(288,288,{fit:'contain',background:'#0000'}).extend({top:24,bottom:24,left:24,right:24,background:'#0000'}).png().toBuffer();
 }
 const schemes=CAMPAIGN_WORLDS;
 const manifest=[];
 for(const scheme of schemes){
  // Matching edge colors and curve tangents avoid masking the road at joins.
  const ground=wrap(`<defs><radialGradient id="soft"><stop stop-color="${scheme.accent}" stop-opacity=".3"/><stop offset="1" stop-color="#16352F" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="#16352F"/><ellipse cx="${W*.5}" cy="${H*.5}" rx="${W*.8}" ry="${H*.44}" fill="url(#soft)"/>`);
  const layers:OverlayOptions[]=[];
  for(let n=0;n<3;n++){
   const bay=[0,3,4][n]!,centerX=(bay%2===0?.215:.785)*W,centerY=(bay*.5+.25)*W;
   layers.push({input:actors[scheme.actors[n]!]!,left:Math.round(centerX-168),top:Math.round(centerY-168)});
  }
  for(let n=0;n<3;n++){
   const bay=[1,2,5][n]!,x=(bay%2===0?.21:.79)*W,y=(bay*.5+.25)*W,brand=scheme.brands[n]!;
   if(n===1&&'extra' in scheme){
    layers.push({input:await sharp(actors[scheme.extra]!).resize(248,248).png().toBuffer(),left:Math.round(x-124),top:Math.round(y-124)});
    continue;
   }
   // Small, spaced ecosystem landmarks; the official marks retain their original colors and proportions.
   layers.push({input:wrap(`<ellipse cx="${x}" cy="${y+35}" rx="77" ry="20" fill="#102A25"/><ellipse cx="${x}" cy="${y+23}" rx="71" ry="19" fill="#244A3F" stroke="#466D59" stroke-width="2"/><text x="${x}" y="${y+78}" text-anchor="middle" fill="#A5C9B8" font-family="sans-serif" font-size="19" font-weight="600" letter-spacing="2">${brand.toUpperCase()}</text>`),left:0,top:0});
   const ext=['bonk','wif'].includes(brand)?'png':'svg';
   layers.push({input:await sharp(path.join(root,'../campaign-world-v3/brands',brand+'.'+ext)).resize(96,96,{fit:'contain',background:'#0000'}).png().toBuffer(),left:Math.round(x-48),top:Math.round(y-65)});
  }
  const d=campaignRoadSvgPath(W);
  layers.push({input:wrap(`<g fill="none" stroke-linejoin="round"><path d="${d}" stroke="#102B25" stroke-width="82"/><path d="${d}" stroke="#6A8D79" stroke-width="69"/><path d="${d}" stroke="#2D5144" stroke-width="63"/><path d="${d}" stroke="#8AB19B" stroke-width="3" opacity=".16"/></g>`),left:0,top:0});
  const png=await sharp(ground).composite(layers).png().toBuffer();
  // Lossless keeps seam pixels exact; static scene rows remain virtualized at runtime.
  const output=await sharp(png).webp({lossless:true,effort:6}).toBuffer();
  await fs.writeFile(path.join(root,scheme.id+'.webp'),output);
  manifest.push({id:scheme.id,width:W,height:H,bytes:output.length,sha256:crypto.createHash('sha256').update(output).digest('hex'),title:scheme.title,illustrations:[...scheme.actors,...('extra' in scheme?[scheme.extra]:[])],brands:scheme.brands.filter((_,i)=>!('extra' in scheme&&i===1))});
  console.log(`${scheme.id}: ${Math.round(output.length/1024)} KiB`);
 }
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({generator:'Built-in image_gen (24 new transparent dioramas plus 8 original character scenes)',packing:'sharp compositing, native road geometry from src/components/campaignRoad.ts',individualSprites:repairs.map(r=>r.key),excludedConcepts:['beeman-break'],scenes:manifest},null,2)+'\n');
 const overview:OverlayOptions[]=[];
 let topEdge:Buffer|undefined,bottomEdge:Buffer|undefined;
 for(let i=0;i<manifest.length;i++){
  const scene=manifest[i]!,file=path.join(root,scene.id+'.webp');
  const top=await sharp(file).extract({left:0,top:0,width:W,height:8}).raw().toBuffer();
  const bottom=await sharp(file).extract({left:0,top:H-8,width:W,height:8}).raw().toBuffer();
  if(topEdge&&(!top.equals(topEdge)||!bottom.equals(bottomEdge!)))throw new Error(`Seam pixels differ: ${scene.id}`);
  topEdge=top;bottomEdge=bottom;
  const left=(i%5)*230,y=Math.floor(i/5)*724;
  overview.push({input:await sharp(file).resize(230,690).png().toBuffer(),left,top:y+34});
  overview.push({input:Buffer.from(`<svg width="230" height="34"><rect width="230" height="34" fill="#10251f"/><text x="12" y="23" fill="#dcf3e7" font-family="sans-serif" font-size="14">${i*10+1}–${i*10+10} · ${scene.title}</text></svg>`),left,top:y});
 }
 await sharp({create:{width:1150,height:1448,channels:4,background:'#16352f'}}).composite(overview).png().toFile(path.join(root,'overview.png'));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
