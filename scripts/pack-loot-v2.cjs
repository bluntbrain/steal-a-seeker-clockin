const sharp=require('sharp'),fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'../assets/loot-v2');
(async()=>{
 const manifest={status:'coin-spin integrated into gameplay; impact-absorb retained as an unused concept',provider:'OpenAI image generation',atlases:[]};
 for(const [name,cols,rows,size] of [['coin-spin',3,2,128],['impact-absorb',4,2,192]]){
  const source=path.join(root,'source',name+'.png'),m=await sharp(source).metadata(),parts=[],frames=[];
  for(let i=0;i<cols*rows;i++){
   const x=Math.round(i%cols*m.width/cols),y=Math.round(Math.floor(i/cols)*m.height/rows),right=Math.round((i%cols+1)*m.width/cols),bottom=Math.round((Math.floor(i/cols)+1)*m.height/rows);
   parts.push({input:await sharp(source).extract({left:x,top:y,width:right-x,height:bottom-y}).resize(size,size,{fit:'contain',background:'#00000000'}).png().toBuffer(),left:i%cols*size,top:Math.floor(i/cols)*size});
   frames.push({x:i%cols*size,y:Math.floor(i/cols)*size,width:size,height:size});
  }
  const dest=path.join(root,name+'.png');await sharp({create:{width:cols*size,height:rows*size,channels:4,background:'#00000000'}}).composite(parts).png({compressionLevel:9}).toFile(dest);
  manifest.atlases.push({file:name+'.png',frames,bytes:fs.statSync(dest).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')});
 }
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(manifest.atlases.map(x=>({file:x.file,bytes:x.bytes})));
})();
