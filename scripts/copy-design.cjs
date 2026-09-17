// Keep the local design gallery available alongside every exported browser build.
const fs=require('node:fs'),path=require('node:path');
const from=path.resolve(__dirname,'../design/visual-v2'),to=path.resolve(__dirname,'../dist/design');
if(fs.existsSync(path.join(from,'index.html')))fs.cpSync(from,to,{recursive:true,dereference:true});

require('./build-music-preview.cjs');
