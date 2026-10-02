// converts referenced png sheets to webp (lossy q90, full alpha) and downsizes oversized floors and message art
// usage: node scripts/optimize-assets.mjs            rewrites assets and the require() sites under src
//        node scripts/optimize-assets.mjs --dry-run  reports sizes only
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const dry=process.argv.includes('--dry-run'),root=path.resolve(import.meta.dirname,'..');
// folder: optional max width; sprite sheets keep their pixels, large backgrounds shrink to what phones can show
const plan={'world-v3':{maxWidth:{'floor.png':768}},'world-v4':{maxWidth:{'rooftop-floor.png':768,'powerworks-floor.png':768}},'messages':{maxWidth:{'*':1024}},'melee-v2':{},'solana-skins':{},'costumes-v4':{},'district-map':{},'splash-v3':{},'paywall-v3':{},'leaderboard-v3':{},'store':{},'guards-v2':{},'drones-v2':{}};
const sources=[];
for(const dir of fs.readdirSync(path.join(root,'src'),{recursive:true})){const file=path.join(root,'src',String(dir));if(/\.(ts|tsx)$/.test(file)&&fs.statSync(file).isFile())sources.push(file);}
let before=0,after=0,converted=0;
for(const [folder,options] of Object.entries(plan)){
 const dir=path.join(root,'assets',folder);
 for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.png'))){
  const png=path.join(dir,name),webp=png.replace(/\.png$/,'.webp'),width=options.maxWidth?.[name]??options.maxWidth?.['*'];
  const meta=await sharp(png).metadata();let pipeline=sharp(png);
  if(width&&(meta.width??0)>width)pipeline=pipeline.resize({width,withoutEnlargement:true});
  const buffer=await pipeline.webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
  before+=fs.statSync(png).size;after+=buffer.length;converted++;
  console.log(`${(fs.statSync(png).size/1e6).toFixed(2)} -> ${(buffer.length/1e6).toFixed(2)} MB  ${meta.width}x${meta.height}${width&&(meta.width??0)>width?` -> ${width}w`:''}  assets/${folder}/${name}`);
  if(dry)continue;
  fs.writeFileSync(webp,buffer);fs.unlinkSync(png);
  const needle=`assets/${folder}/${name}'`,replacement=`assets/${folder}/${name.replace(/\.png$/,'.webp')}'`;
  for(const file of sources){const text=fs.readFileSync(file,'utf8');if(text.includes(needle))fs.writeFileSync(file,text.split(needle).join(replacement));}
 }
}
console.log(`${converted} files: ${(before/1e6).toFixed(2)} MB -> ${(after/1e6).toFixed(2)} MB${dry?' (dry run)':''}`);
