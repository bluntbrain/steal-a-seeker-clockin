// Pack generated four-row sheets into four-frame transparent strips used by the loader.
const sharp=require('sharp'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/loading-chase-v1');
async function main(){
 for(const [file,names] of [['courier-crew',['courier','toly','mert','lily']],['crew',['chase','vibhu','akshay','beeman']]]){
  const square=await sharp(path.join(root,'source',file+'.png')).resize(1024,1024).png().toBuffer();
  for(let row=0;row<names.length;row++)await sharp(square).extract({left:0,top:row*256,width:1024,height:256}).webp({quality:86,alphaQuality:95}).toFile(path.join(root,names[row]+'.webp'));
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
