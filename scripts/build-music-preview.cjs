const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),selection=JSON.parse(fs.readFileSync(path.join(root,'assets/music-v1/selection.json'))),tracks=JSON.parse(fs.readFileSync(path.join(root,'assets/music-v1/manifest.json'))).filter(t=>selection.tracks.includes(t.level));
const dest=path.join(root,'dist/design/soundtrack/audio');fs.mkdirSync(dest,{recursive:true});
for(const t of tracks)fs.copyFileSync(path.join(root,'assets/music-v1',t.file),path.join(dest,t.file));
