// packs a generated top-down courier sheet (4 by 2 cells on chroma magenta) into a 1024 by 512 atlas of 256 pixel frames
// usage: node scripts/pack-topdown-courier.mjs <costume-id> [sheet.png]
// frames face up (+Y in art is forward); the renderer rotates them. order: idle, walkA, walkB, walkC, windup, slash, follow, carry
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
// --boss <id>: one top-down boss sprite facing +X, trimmed and squared to 512 pixels, into assets/bosses-v1
const boss=process.argv[2]==='--boss';
const [id,sheetArg]=boss?process.argv.slice(3):process.argv.slice(2);
if(!id)throw new Error('usage: node scripts/pack-topdown-courier.mjs [--boss] <id> [sheet.png]');
const root=path.resolve(import.meta.dirname,'..'),sheet=sheetArg??(boss?path.join(root,'output/imagegen/bosses-v1',`${id}-source.png`):path.join(root,'output/imagegen/courier-topdown-v1',`${id}-sheet.png`));
const outDir=path.join(root,'assets/courier-topdown-v1'),CELL=256,WINDOW=340,COLS=4,ROWS=2;
const FRAMES=['idle','walkA','walkB','walkC','windup','slash','follow','carry'];
const {data,info}=await sharp(sheet).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const w=info.width,h=info.height;
// chroma key: magenta distance drives alpha, with a short ramp so antialiased edges stay soft
for(let i=0;i<w*h;i++){const r=data[i*4],g=data[i*4+1],b=data[i*4+2];const d=Math.hypot(r-255,g,b-255);const alpha=d<40?0:d<110?Math.round((d-40)/70*255):255;if(alpha<data[i*4+3])data[i*4+3]=alpha;if(alpha>0&&alpha<255){data[i*4]=Math.round(r*alpha/255);data[i*4+2]=Math.round(b*alpha/255);}}
const keyed=sharp(data,{raw:{width:w,height:h,channels:4}}).png();
const keyedBuffer=await keyed.toBuffer();
if(boss){
 // trim to the opaque bounds, pad to a square so the sprite centre stays the body centre, then 512 pixels
 let minX=w,minY=h,maxX=0,maxY=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>8){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;}
 const side=Math.max(maxX-minX,maxY-minY)+40,cx=(minX+maxX)/2,cy=(minY+maxY)/2,left=Math.max(0,Math.round(cx-side/2)),top=Math.max(0,Math.round(cy-side/2));
 const sprite=await sharp(keyedBuffer).extract({left,top,width:Math.min(side,w-left),height:Math.min(side,h-top)}).resize(512,512,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90,alphaQuality:100,effort:6}).toBuffer();
 const dir=path.join(root,'assets/bosses-v1');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${id}.webp`);fs.writeFileSync(file,sprite);
 const manifestPath=path.join(dir,'manifest.json'),manifest=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):[];
 const entry={name:id,file:`${id}.webp`,model:'gpt-image-2',source:path.relative(root,sheet),size:512,facing:'+x',sha256:crypto.createHash('sha256').update(sprite).digest('hex')};
 fs.writeFileSync(manifestPath,JSON.stringify(manifest.filter(m=>m.name!==id).concat(entry).sort((a,b)=>a.name.localeCompare(b.name)),null,1));
 console.log(`${id}: ${(sprite.length/1024).toFixed(0)} KB boss sprite -> ${path.relative(root,file)}`);process.exit(0);
}
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
