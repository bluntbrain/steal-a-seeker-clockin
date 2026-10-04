// Packing only: preserve generated alpha, retain complete equal cells and transparent gutters.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto');
(async()=>{
 const root=path.resolve(__dirname,'../assets/defeats-v2'),names=['robots','toly','mert','chase','lily','vibhu','akshay','beeman'],manifest={provider:'OpenAI image generation',frameSize:256,atlases:[]};
 for(const name of names){const source=path.join(root,'source',name+'.png'),m=await sharp(source).metadata(),cols=name==='robots'?4:2,rows=name==='robots'?3:2,parts=[];
 if(!m.hasAlpha)throw Error(name+' must have transparent alpha');
 for(let i=0;i<cols*rows;i++){
 const left=Math.round(i%cols*m.width/cols),top=Math.round(Math.floor(i/cols)*m.height/rows),right=Math.round((i%cols+1)*m.width/cols),bottom=Math.round((Math.floor(i/cols)+1)*m.height/rows);
 let cell=sharp(source).extract({left,top,width:right-left,height:bottom-top});
 // Boss recoil was generated looking north; runtime uses +X forward.
 if(name!=='robots'&&i===0)cell=cell.rotate(90);
 const input=await cell.resize(240,240,{fit:'contain',background:'#00000000'}).extend({top:8,bottom:8,left:8,right:8,background:'#00000000'}).png().toBuffer();
 parts.push({input,left:i%cols*256,top:Math.floor(i/cols)*256});
 }
 const file=name+'.webp';await sharp({create:{width:cols*256,height:rows*256,channels:4,background:'#00000000'}}).composite(parts).webp({lossless:true}).toFile(path.join(root,file));
 manifest.atlases.push({file,cols,rows,source:'source/'+name+'.png',bytes:fs.statSync(path.join(root,file)).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')});
 }
 fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(manifest.atlases.map(a=>({file:a.file,bytes:a.bytes})));
})();
