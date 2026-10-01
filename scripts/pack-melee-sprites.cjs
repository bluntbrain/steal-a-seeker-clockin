// Packs generated full-body poses. No rendered/rotated substitute knife art.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../assets/melee-v2');
const costumes=new Set(['default','frost-runner','night-courier','circuit-scout','archive-keeper','ghost-signal']);
const names=fs.readdirSync(path.join(root,'source')).filter(n=>n.endsWith('.png'));
const cell=192,baseline=188;
async function pack(name){
 const source=path.join(root,'source',name),meta=await sharp(source).metadata();
 if(!meta.hasAlpha)throw Error(`${name}: transparent source required`);
 const w=400,h=Math.round(meta.height/meta.width*w),sx=meta.width/w,sy=meta.height/h;
 const raw=await sharp(source).resize(w,h).ensureAlpha().raw().toBuffer(),seen=new Uint8Array(w*h),components=[];
 for(let i=0;i<w*h;i++){
  if(seen[i]||raw[i*4+3]<128)continue;
  let queue=[i],count=0,x0=w,y0=h,x1=0,y1=0;seen[i]=1;
  while(queue.length){const p=queue.pop(),x=p%w,y=Math.floor(p/w);count++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(a<0||b<0||a>=w||b>=h)continue;const q=b*w+a;if(!seen[q]&&raw[q*4+3]>=128){seen[q]=1;queue.push(q);}}
  }
  if(count>350)components.push({count,x0,y0,x1,y1});
 }
 if(components.length!==12)throw Error(`${name}: expected 12 separate poses, found ${components.length}`);
 components.sort((a,b)=>(a.y0+a.y1)-(b.y0+b.y1));
 const ordered=[];for(let r=0;r<3;r++)ordered.push(...components.slice(r*4,r*4+4).sort((a,b)=>a.x0-b.x0));
 const boxes=ordered.map(b=>({left:Math.max(0,Math.floor(b.x0*sx)-3),top:Math.max(0,Math.floor(b.y0*sy)-3),right:Math.min(meta.width,Math.ceil((b.x1+1)*sx)+3),bottom:Math.min(meta.height,Math.ceil((b.y1+1)*sy)+3)}));
 // One scale per sheet keeps the head/body size stable through all poses.
 const windupHeights=boxes.slice(0,4).map(b=>b.bottom-b.top).sort((a,b)=>a-b);
 const scale=Math.min(174/((windupHeights[1]+windupHeights[2])/2),182/Math.max(...boxes.map(b=>b.right-b.left)),182/Math.max(...boxes.map(b=>b.bottom-b.top)));
 const layers=[];const anchors=[];
 const id=name.replace('.png',''),original=path.resolve(root,'..',costumes.has(id)?'costumes-v4':'solana-skins',`${id}-atlas.png`);
 for(let i=0;i<8;i++)layers.push({input:await sharp(original).extract({left:i%4*256,top:Math.floor(i/4)*384,width:256,height:384}).resize(128,192).png().toBuffer(),left:i%4*cell+32,top:Math.floor(i/4)*cell});
 for(let i=0;i<12;i++){
  const b=boxes[i],width=b.right-b.left,height=b.bottom-b.top;
  const {data,info}=await sharp(source).extract({left:b.left,top:b.top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Anchor to the middle of the grounded feet, not the outstretched blade.
  let lo=width,hi=0;for(let y=Math.floor(height*.89);y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>160){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  const footX=lo<=hi?(lo+hi)/2:width/2,rw=Math.round(width*scale),rh=Math.round(height*scale);
  const localX=Math.max(2,Math.min(cell-rw-2,Math.round(cell/2-footX*scale)));
  layers.push({input:await sharp(data,{raw:info}).resize(rw,rh).png().toBuffer(),left:i%4*cell+localX,top:(2+Math.floor(i/4))*cell+baseline-rh});
  anchors.push({footX,localX,width:rw,height:rh});
 }
 const out=path.join(root,name.replace('.png','-atlas.png'));
 await sharp({create:{width:cell*4,height:cell*5,channels:4,background:'#00000000'}}).composite(layers).png({compressionLevel:9}).toFile(out);
 return {name:name.replace('.png',''),source:`source/${name}`,cell,baseline,scale,boxes,anchors,bytes:fs.statSync(out).size};
}
(async()=>{const packed=[];for(const name of names){packed.push(await pack(name));console.log('Packed',name);}fs.writeFileSync(path.join(root,'packing.json'),JSON.stringify(packed,null,2)+'\n');})().catch(e=>{console.error(e);process.exit(1);});
