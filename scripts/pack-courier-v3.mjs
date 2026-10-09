import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../assets/courier-topdown-v3');
const names=['idle','walkA','walkB','walkC','windup','slash','follow','carry'];
const tiles=[],frames=[];
for(const [sheet,file] of ['default','default-carry'].entries()){
 const input=path.join(root,'source',file+'.png'),m=await sharp(input).metadata();
 if(!m.hasAlpha||Math.abs(m.width/m.height-2)>.02)throw Error('Expected transparent 4x2 sheet: '+file);
 for(let i=0;i<8;i++){
  const col=i%4,row=Math.floor(i/4),left=Math.round(col*m.width/4),top=Math.round(row*m.height/2);
  const width=Math.round((col+1)*m.width/4)-left,height=Math.round((row+1)*m.height/2)-top;
  const data=await sharp(input).extract({left,top,width,height}).resize(256,256,{fit:'contain',background:'#00000000'}).png().toBuffer();
  const x=col*256,y=(row+sheet*2)*256;tiles.push({input:data,left:x,top:y});frames.push({name:(sheet?'loaded-':'')+names[i],x,y,width:256,height:256});
 }
}
await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite(tiles).webp({quality:94,alphaQuality:100,effort:6}).toFile(path.join(root,'default.webp'));
await fs.writeFile(path.join(root,'frames.json'),JSON.stringify(frames,null,2)+'\n');
console.log('Packed sixteen poses: eight standard and eight carrying.');
