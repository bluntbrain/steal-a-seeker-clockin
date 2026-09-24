const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../assets/skin-ui');
(async()=>{
 for(const file of fs.readdirSync(root).filter(name=>name.endsWith('.svg'))){
  const size=file.includes('glow')?640:192;
  await sharp(path.join(root,file)).resize({width:size}).png().toFile(path.join(root,file.replace('.svg','.png')));
 }
 await sharp(path.resolve(root,'../navigation/missions.svg')).resize(96,96).png().toFile(path.resolve(root,'../navigation/missions.png'));
})().catch(error=>{console.error(error);process.exit(1);});
