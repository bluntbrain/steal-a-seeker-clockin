import celebration from '../../assets/campaign-celebration/hero.embedded.json';
import classicPortraits from '../../assets/costumes-v4/portraits.embedded.json';
import solanaPortraits from '../../assets/solana-skins/portraits.embedded.json';
const portraits={...classicPortraits,...solanaPortraits};
import {costumeFor} from '../../shared/costumes';
export const CARD_WIDTH=1080,CARD_HEIGHT=1450,CARD_RATIO=CARD_HEIGHT/CARD_WIDTH;
export const cardPortrait=(d:CourierCardData)=>costumeFor(d.outfit).id==='default'?celebration.uri:portraits[costumeFor(d.outfit).asset];
export const cardHeight=(_d:CourierCardData)=>CARD_HEIGHT;
export const cardPortraitRect=(_d:CourierCardData)=>({x:40,y:185,width:1000,height:970});
export type CourierCardData={wallet:string;local:boolean;outfit?:string;frame?:string;campaign:{cleared:number;stars:number;score:number;seconds:number;level?:number;total?:number}};
export type CardText={key:string;text:string;x:number;y:number;width:number;size:number;color:string;weight:'400'|'700'|'900';align?:'left'|'center';spacing?:number};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const natural=(n:number)=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
const count=(n:number)=>natural(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
export const shortWallet=(s:string)=>s==='browser-playtest'?'Browser practice':`${s.slice(0,5)}…${s.slice(-5)}`;
export function cardTime(ticks:number){const h=Math.round(natural(ticks)*100/30),m=Math.floor(h/6000),s=Math.floor(h/100)%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(h%100).padStart(2,'0')}`;}
export const cardFileName=(d:CourierCardData)=>d.campaign.level?`seeker-level-${d.campaign.level}.png`:'seeker-campaign-complete.png';
/** Shared layout keeps native preview, browser preview and exported PNG values identical. */
export function cardLayout(d:CourierCardData):CardText[]{
 const blocks:CardText[]=[],put=(key:string,text:string,x:number,y:number,width:number,size:number,color='#CFE6E4',weight:CardText['weight']='700',align:CardText['align']='left',spacing=0)=>blocks.push({key,text,x,y,width,size,color,weight,align,spacing});
  const c=d.campaign,total=c.total??12,level=c.level;
  if(level){
   const done=c.cleared>=total;
   put('status',done?`ALL ${natural(total)} LEVELS CLEARED`:`LEVEL ${natural(level)} OF ${natural(total)}`,40,35,1000,31,'#ACCBC6','700','center',5);
   put('name',done?'Every level. Cleared.':'Still climbing.',25,101,1030,77,'#F6F6F5','900','center');
   put('meaning','Campaign so far',330,1135,420,30,'#94ACA4','700','center');
   [String(natural(c.cleared)),String(natural(c.stars))+' / '+natural(total*3),count(c.score)].forEach((v,i)=>{
    put('stat-'+i,v,[20,380,740][i]!,1255,320,Math.min(68,320/(v.length*.57)),'#E1F2EC','900','center');
    put('label-'+i,['LEVELS CLEARED','STARS','BEST SCORE'][i]!,[20,380,740][i]!,1333,320,27,'#9EBCB2','700','center',1);
   });
   put('qualifier',d.local?'Personal campaign record · Played in browser':'Personal campaign record · Played on Android',30,1400,1020,22,'#8FA99E','400','center');
   return blocks;
  }
  put('status',`${natural(c.cleared)} / 12 HEISTS`,40,35,1000,31,'#ACCBC6','700','center',5);
  put('name','Every Seeker. Secured.',25,101,1030,77,'#F6F6F5','900','center');
  put('meaning','Personal bests',330,1135,420,30,'#94ACA4','700','center');
  [String(natural(c.stars))+' / 36',count(c.score),cardTime(Math.round(c.seconds*30))].forEach((v,i)=>{
   put('stat-'+i,v,[20,380,740][i]!,1255,320,Math.min(68,320/(v.length*.57)),'#E1F2EC','900','center');
   put('label-'+i,['STARS','BEST SCORE','BEST TIME'][i]!,[20,380,740][i]!,1333,320,27,'#9EBCB2','700','center',1);
  });
  put('qualifier',d.local?'Personal campaign record · Played in browser':'Personal campaign record · Played on Android',30,1400,1020,22,'#8FA99E','400','center');
  return blocks;
}
export function cardDescription(d:CourierCardData){return cardLayout(d).map(b=>b.text).join('. ')+'. Outfit: '+costumeFor(d.outfit).name;}
export function cardSvg(d:CourierCardData){
 const height=cardHeight(d),p=cardPortraitRect(d);
 const bg='<rect width="1080" height="1450" fill="#14211E"/><path d="M30 1155 H310 M770 1155 H1050 M360 1200 V1368 M720 1200 V1368" stroke="#40564E" stroke-width="2"/><path d="M180 1198 L187 1214 L205 1216 L191 1228 L195 1246 L180 1237 L165 1246 L169 1228 L155 1216 L173 1214 Z" fill="#C3EAE1"/><g fill="#E7CE8E"><rect x="516" y="1216" width="12" height="28" rx="2"/><rect x="535" y="1198" width="12" height="46" rx="2"/><rect x="554" y="1208" width="12" height="36" rx="2"/></g><g fill="none" stroke="#E7CE8E" stroke-width="5" stroke-linecap="round"><circle cx="900" cy="1224" r="19"/><path d="M900 1211 V1224 H910 M894 1198 H906 M900 1198 V1204"/></g>';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">${bg}<image href="${cardPortrait(d)}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="xMidYMid meet"/><g font-family="Arial,sans-serif">${cardLayout(d).map(b=>`<text x="${b.align==='center'?b.x+b.width/2:b.x}" y="${b.y}" dominant-baseline="text-before-edge" text-anchor="${b.align==='center'?'middle':'start'}" font-size="${b.size}" font-weight="${b.weight}" letter-spacing="${b.spacing??0}" fill="${b.color}">${esc(b.text)}</text>`).join('')}</g></svg>`;
}
