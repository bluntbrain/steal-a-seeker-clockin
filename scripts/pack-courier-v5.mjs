import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../assets/courier-topdown-v5');
const input=await sharp(path.join(root,'source/default.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
// Generated near-opaque interiors otherwise let moving arms shimmer through
// the stationary hood. Keep transparent edges; make solid interiors opaque.
for(let i=3;i<input.data.length;i+=4)if(input.data[i]>=240)input.data[i]=255;
const png=await sharp(input.data,{raw:input.info}).png().toBuffer();
const url='data:image/png;base64,'+png.toString('base64');
const upper=[[156,247],[182,215],[199,180],[246,166],[278,185],[311,196],[338,215],[338,244],[320,263],[294,257],[270,235],[249,224],[226,224],[204,238],[184,254]];
const loaded=[[156,247],[181,213],[201,173],[247,143],[281,117],[304,123],[326,176],[338,216],[338,244],[320,263],[294,257],[270,235],[249,224],[226,224],[204,238],[184,254]];
const lower=[[165,302],[191,317],[217,325],[247,318],[270,297],[296,282],[334,281],[392,307],[395,329],[332,338],[310,360],[270,379],[215,378],[181,350]];
const hood=[[170,279],[181,249],[203,230],[227,225],[250,233],[270,254],[283,277],[272,299],[250,318],[225,331],[202,325],[182,305]];
const backpack=[[130,264],[139,245],[161,240],[178,231],[194,233],[187,251],[177,264],[175,289],[185,311],[188,326],[172,332],[151,321],[135,311]];
const boot=[[102,315],[106,304],[116,293],[129,288],[140,296],[148,313],[157,328],[145,340],[127,342],[113,336],[104,326]];
const shape=p=>p.map(x=>x.join(',')).join(' ');
const clips={upper,loaded,lower,hood,backpack,boot};
const definitions=`<defs><image id="source" width="1774" height="887" href="${url}"/>${Object.entries(clips).map(([id,p])=>`<clipPath id="${id}"><polygon points="${shape(p)}"/></clipPath>`).join('')}</defs>`;
const piece=(clip,angle=0,cx=180,cy=250,y=0)=>`<g transform="rotate(${angle} ${cx} ${cy})"><g clip-path="url(#${clip})"><use href="#source" y="${y}"/></g></g>`;
const foot=(progress,y)=>`<g transform="translate(${62*(1-progress)} ${y})"><g clip-path="url(#boot)"><use href="#source" x="-468" y="4"/></g></g>`;
const tiles=[],frames=[];
for(let bank=0;bank<2;bank++)for(let frame=0;frame<36;frame++){
 const walk=frame>=1&&frame<=32,swing=walk?Math.sin((frame-1)/32*Math.PI*2):0;
 const attack=frame>=33?[-22,27,10][frame-33]:0;
 const content=(walk?foot(Math.max(0,swing),0)+foot(Math.max(0,-swing),-79):'')+
  piece(bank?'loaded':'upper',swing*3,181,248,bank?-422:0)+piece('lower',-swing*3+attack,183,309)+piece('backpack')+piece('hood');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 443.5 443.5">${definitions}<g transform="translate(-3.25 -56.25)">${content}</g></svg>`;
 const data=await sharp(Buffer.from(svg)).png().toBuffer();
 const index=bank*36+frame,x=index%8*256,y=Math.floor(index/8)*256;
 tiles.push({input:data,left:x,top:y});
 frames.push({name:(bank?'loaded-':'')+(frame===0?'idle':walk?'walk-'+(frame-1):['windup','slash','follow'][frame-33]),x,y,width:256,height:256});
}
await sharp({create:{width:2048,height:2304,channels:4,background:'#00000000'}}).composite(tiles).webp({lossless:true,effort:6}).toFile(path.join(root,'default.webp'));
await fs.writeFile(path.join(root,'frames.json'),JSON.stringify(frames,null,2)+'\n');
console.log('Packed 72 fixed-head poses: idle, 32 walking, 3 attack poses, each with and without phone.');
