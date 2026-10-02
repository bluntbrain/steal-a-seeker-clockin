// Keep the local design gallery available alongside every exported browser build.
const fs=require('node:fs'),path=require('node:path');
const from=path.resolve(__dirname,'../design/visual-v2'),to=path.resolve(__dirname,'../dist/design');
if(fs.existsSync(path.join(from,'index.html')))fs.cpSync(from,to,{recursive:true,dereference:true});

require('./build-music-preview.cjs');

const solana=path.resolve(__dirname,'../design/solana-store'),solanaOut=path.resolve(__dirname,'../dist/design/solana-store');
fs.cpSync(solana,solanaOut,{recursive:true});
for(const name of ['toly','mert','chase','lily','vibhu','akshay','beeman'])for(const suffix of ['.webp','-atlas.webp'])fs.copyFileSync(path.resolve(__dirname,'../assets/solana-skins',name+suffix),path.join(solanaOut,name+suffix));

require('./build-melee-preview.cjs');
