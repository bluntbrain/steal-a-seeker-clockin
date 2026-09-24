// Static gradient and vector layers give Android and web the same soft lighting.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'../assets/leaderboard-v3');
fs.mkdirSync(root,{recursive:true});
const svg=(w,h,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const layers={
 'card-mint':svg(900,240,'<defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="#153A2D"/><stop offset=".52" stop-color="#0A1712"/><stop offset="1" stop-color="#16382E"/></linearGradient><radialGradient id="g"><stop stop-color="#85F1CC" stop-opacity=".16"/><stop offset="1" stop-color="#85F1CC" stop-opacity="0"/></radialGradient></defs><path fill="url(#b)" d="M0 0h900v240H0z"/><ellipse cx="140" cy="120" rx="300" ry="190" fill="url(#g)"/>'),
 'row-dark':svg(900,180,'<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#15291F"/><stop offset=".5" stop-color="#0B1612"/><stop offset="1" stop-color="#13251D"/></linearGradient></defs><path fill="url(#g)" d="M0 0h900v180H0z"/>'),
 'row-gold':svg(900,180,'<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#292B17"/><stop offset=".55" stop-color="#131A12"/><stop offset="1" stop-color="#242817"/></linearGradient></defs><path fill="url(#g)" d="M0 0h900v180H0z"/>'),
 'button-mint':svg(900,160,'<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#C7F7E8"/><stop offset=".5" stop-color="#A8EAD4"/><stop offset="1" stop-color="#BDF5E3"/></linearGradient></defs><path fill="url(#g)" d="M0 0h900v160H0z"/>'),
 'header-glow':svg(720,720,'<defs><radialGradient id="g"><stop stop-color="#7DDFB7" stop-opacity=".26"/><stop offset=".42" stop-color="#6DC99F" stop-opacity=".13"/><stop offset="1" stop-color="#4EB784" stop-opacity="0"/></radialGradient></defs><circle cx="360" cy="360" r="360" fill="url(#g)"/>'),
 'crown':svg(96,96,'<defs><linearGradient id="g" x2=".5" y2="1"><stop stop-color="#FFE6A1"/><stop offset="1" stop-color="#D4A951"/></linearGradient></defs><path fill="url(#g)" d="m10 25 20 14 18-27 18 27 20-14-8 45H18z"/><rect x="19" y="77" width="58" height="9" rx="3" fill="#DFBB67"/>'),
};
for(const [name,colors] of Object.entries({silver:['#EBF2F1','#81948D'],bronze:['#EBC4A1','#A5724B']}))layers[name]=svg(96,112,`<defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><path fill="${colors[1]}" d="M16 5h23l9 29L58 5h23L64 47H32z"/><circle cx="48" cy="66" r="35" fill="url(#g)"/><circle cx="48" cy="66" r="26" fill="none" stroke="${colors[1]}" stroke-width="4"/>`);
(async()=>{
 for(const [name,source] of Object.entries(layers)){fs.writeFileSync(path.join(root,name+'.svg'),source);await sharp(Buffer.from(source)).png().toFile(path.join(root,name+'.png'));}
 const hero=path.join(root,'courier-wave.png');
 if(fs.existsSync(hero)){
  const {width:w,height:h}=await sharp(hero).metadata();
  const mask=svg(w,h,`<defs><linearGradient id="m" x2="0" y2="1"><stop offset="0" stop-color="white"/><stop offset=".68" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient></defs><path fill="url(#m)" d="M0 0h${w}v${h}H0z"/>`);
  await sharp(hero).composite([{input:Buffer.from(mask),blend:'dest-in'}]).png().toFile(path.join(root,'courier-wave-header.png'));
 }
 const bars=svg(96,96,'<path fill="#B8F3DF" d="M9 48h18v36H9zm30-24h18v60H39zm30-18h18v78H69z"/>');
 fs.writeFileSync(path.resolve(root,'../navigation/leaderboard.svg'),bars);
 await sharp(Buffer.from(bars)).png().toFile(path.resolve(root,'../navigation/leaderboard.png'));
 console.log('Built '+Object.keys(layers).length+' league UI layers.');
})().catch(e=>{console.error(e);process.exit(1)});
