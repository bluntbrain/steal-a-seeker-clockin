// Reproducible asset packing. Generated sheets have real alpha and exactly 4 x 2 cells.
// Never crop outside a cell: a fixed-size crop can include pieces of adjacent poses.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..');
const costumes=['default','night-courier','frost-runner','circuit-scout','archive-keeper','ghost-signal'];
const names=['idle','walkA','walkB','walkC','windup','slash','follow','carry'];
const manifest=[];
for(const group of ['courier-topdown-v2','campaign-world-v2']){
 const dir=path.join(root,'assets',group);
 for(const id of group==='courier-topdown-v2'?costumes:['warehouse','rooftops','powerworks']){
  const source=path.join(dir,'source',`${id}.png`),meta=await sharp(source).metadata();
  let output;
  if(group==='courier-topdown-v2'){
   if(!meta.hasAlpha)throw new Error(`${id}: sheet must have transparent alpha`);
   const tiles=[];
   for(let i=0;i<8;i++){
    const col=i%4,row=Math.floor(i/4),left=Math.round(col*meta.width/4),top=Math.round(row*meta.height/2);
    const width=Math.round((col+1)*meta.width/4)-left,height=Math.round((row+1)*meta.height/2)-top;
    tiles.push({input:await sharp(source).extract({left,top,width,height}).resize(256,256,{fit:'contain',background:'#00000000'}).png().toBuffer(),left:col*256,top:row*256});
   }
   output=await sharp({create:{width:1024,height:512,channels:4,background:'#00000000'}}).composite(tiles).webp({quality:92,alphaQuality:100,effort:6}).toBuffer();
  }else{
   // the top 7.5 percent fades to transparent so the zone above shows through; the map layout reserves the same band
   const base=sharp(source).resize({width:768,withoutEnlargement:true}),{width:w,height:h}=await base.clone().png().toBuffer({resolveWithObject:true}).then(r=>r.info);
   const fade=Math.round(h*.075),mask=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${(fade/h).toFixed(4)}" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`);
   output=await base.ensureAlpha().composite([{input:mask,blend:'dest-in'}]).webp({quality:86,alphaQuality:100,effort:6}).toBuffer();
  }
  await fs.writeFile(path.join(dir,`${id}.webp`),output);
  const packed=await sharp(output).metadata();
  manifest.push({group,id,source:`assets/${group}/source/${id}.png`,file:`assets/${group}/${id}.webp`,generator:'OpenAI builtin imagegen',width:packed.width,height:packed.height,bytes:output.length,sha256:crypto.createHash('sha256').update(output).digest('hex')});
  console.log(`${group}/${id}: ${Math.round(output.length/1024)} KB`);
 }
}
await fs.writeFile(path.join(root,'assets/courier-topdown-v2/frames.json'),JSON.stringify(names.map((name,i)=>({name,x:(i%4)*256,y:Math.floor(i/4)*256,width:256,height:256})),null,2)+'\n');
await fs.writeFile(path.join(root,'assets/campaign-world-v2/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
