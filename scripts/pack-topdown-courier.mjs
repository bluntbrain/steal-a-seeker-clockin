// packs a generated top-down courier sheet (4 by 2 cells on chroma magenta) into a 1024 by 512 atlas of 256 pixel frames
// usage: node scripts/pack-topdown-courier.mjs <costume-id> [sheet.png]
// frames face up (+Y in art is forward); the renderer rotates them. order: idle, walkA, walkB, walkC, windup, slash, follow, carry
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const [id,sheetArg]=process.argv.slice(2);
if(!id)throw new Error('usage: node scripts/pack-topdown-courier.mjs <costume-id> [sheet.png]');
const root=path.resolve(import.meta.dirname,'..'),sheet=sheetArg??path.join(root,'output/imagegen/courier-topdown-v1',`${id}-sheet.png`);
const outDir=path.join(root,'assets/courier-topdown-v1'),CELL=256,WINDOW=340,COLS=4,ROWS=2;
const FRAMES=['idle','walkA','walkB','walkC','windup','slash','follow','carry'];
const {data,info}=await sharp(sheet).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const w=info.width,h=info.height;
// chroma key: magenta distance drives alpha, with a short ramp so antialiased edges stay soft
for(let i=0;i<w*h;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2];const d=Math.hypot(r-255,g,b-255);const alpha=d<40?0:d<110?Math.round((d-40)/70*255):255;if(alpha<data[i*4+3])data[i*4+3]=alpha;if(alpha>0&&alpha<255){data[i*4]=Math.round(r*alpha/255);data[i*4+2]=Math.round(b*alpha/255);}}
const keyed=sharp(data,{raw:{width:w,height:h,channels:4}}).png();
const keyedBuffer=await keyed.toBuffer();
const cellW=w/COLS,cellH=h/ROWS,tiles=[];
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
 const cx=Math.round(c*cellW+cellW/2),cy=Math.round(r*cellH+cellH/2);
 const left=Math.max(0,cx-WINDOW/2),top=Math.max(0,cy-WINDOW/2);
 const tile=await sharp(keyedBuffer).extract({left,top,width:Math.min(WINDOW,w-left),height:Math.min(WINDOW,h-top)}).resize(CELL,CELL,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 tiles.push({input:tile,left:c*CELL,top:r*CELL});
}
const atlas=await sharp({create:{width:COLS*CELL,height:ROWS*CELL,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(tiles).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
fs.mkdirSync(outDir,{recursive:true});
const file=path.join(outDir,`${id}.webp`);fs.writeFileSync(file,atlas);
const framesPath=path.join(outDir,'frames.json');
const frames=FRAMES.map((name,i)=>({name,x:(i%COLS)*CELL,y:Math.floor(i/COLS)*CELL,width:CELL,height:CELL}));
fs.writeFileSync(framesPath,JSON.stringify(frames,null,1));
const manifestPath=path.join(outDir,'manifest.json');
const manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):[];
const entry={name:id,file:`${id}.webp`,model:'gpt-image-2',source:path.relative(root,sheet),frames:FRAMES.length,cell:CELL,sha256:crypto.createHash('sha256').update(atlas).digest('hex')};
const next=manifest.filter(m=>m.name!==id).concat(entry).sort((a,b)=>a.name.localeCompare(b.name));
fs.writeFileSync(manifestPath,JSON.stringify(next,null,1));
console.log(`${id}: ${(atlas.length/1024).toFixed(0)} KB, ${FRAMES.length} frames of ${CELL}px -> ${path.relative(root,file)}`);
