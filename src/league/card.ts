import celebration from '../../assets/campaign-celebration/hero.embedded.json';
import classicPortraits from '../../assets/costumes-v4/portraits.embedded.json';
import solanaPortraits from '../../assets/solana-skins/portraits.embedded.json';
const portraits={...classicPortraits,...solanaPortraits};
import {costumeFor} from '../../shared/costumes';
import background from '../../assets/courier-card-v3/background.embedded.json';
export const CARD_WIDTH=1080,CARD_HEIGHT=1620,CARD_RATIO=CARD_HEIGHT/CARD_WIDTH;
export const CARD_BACKGROUND=background.uri;
export const CARD_PORTRAIT={x:526,y:350,width:478,height:717};
export const cardPortrait=(d:CourierCardData)=>d.campaign&&costumeFor(d.outfit).id==='default'?celebration.uri:portraits[costumeFor(d.outfit).asset];
export const cardHeight=(d:CourierCardData)=>d.campaign?1450:CARD_HEIGHT;
export const cardPortraitRect=(d:CourierCardData)=>d.campaign?{x:40,y:185,width:1000,height:970}:CARD_PORTRAIT;
export type CourierCardData={week:string;rank:number|null;participants?:number;points:number;cleared:number;ticks:number;domain:string|null;wallet:string;final:boolean;local:boolean;earned:boolean;outfit?:string;frame?:string;campaign?:{cleared:number;stars:number;score:number;seconds:number}};
export type CardText={key:string;text:string;x:number;y:number;width:number;size:number;color:string;weight:'400'|'700'|'900';align?:'left'|'center';spacing?:number};
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const natural=(n:number)=>Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
const count=(n:number)=>natural(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');
export const shortWallet=(s:string)=>s==='browser-playtest'?'Browser practice':`${s.slice(0,5)}…${s.slice(-5)}`;
export function cardTime(ticks:number){const h=Math.round(natural(ticks)*100/30),m=Math.floor(h/6000),s=Math.floor(h/100)%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(h%100).padStart(2,'0')}`;}
export function cardWeek(week:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(week))return 'WEEK UNAVAILABLE';
 const start=new Date(week+'T00:00:00Z');if(!Number.isFinite(start.getTime())||start.toISOString().slice(0,10)!==week)return 'WEEK UNAVAILABLE';
 const end=new Date(start.getTime()+6*86400000),month=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
 const a=`${start.getUTCDate()} ${month[start.getUTCMonth()]}`,b=`${end.getUTCDate()} ${month[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
 return start.getUTCFullYear()!==end.getUTCFullYear()?`${a} ${start.getUTCFullYear()} – ${b} · UTC`:start.getUTCMonth()!==end.getUTCMonth()?`${a} – ${b} · UTC`:`${start.getUTCDate()}–${b} · UTC`;
}
export const cardFileName=(d:CourierCardData)=>d.campaign?'seeker-campaign-complete.png':`seeker-${/^\d{4}-\d{2}-\d{2}$/.test(d.week)?d.week:'weekly'}.png`;
/** Shared layout keeps native preview, browser preview and exported PNG values identical. */
export function cardLayout(d:CourierCardData):CardText[]{
 const blocks:CardText[]=[],put=(key:string,text:string,x:number,y:number,width:number,size:number,color='#CFE6E4',weight:CardText['weight']='700',align:CardText['align']='left',spacing=0)=>blocks.push({key,text,x,y,width,size,color,weight,align,spacing});
 if(d.campaign){
  const c=d.campaign;
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
 const name=d.domain||shortWallet(d.wallet),cleared=Math.min(3,natural(d.cleared)),placed=d.rank!==null&&natural(d.rank)>0,rank=d.local?'TEST':placed?'#'+count(d.rank!):'—',earned=d.earned&&cleared===3;
 put('brand','STEAL A SEEKER',76,122,928,26,'#AECAC3','700','left',5);
 put('name',name,76,173,928,Math.max(22,Math.min(62,928/(Math.max(1,name.length)*.62))),'#E2F2EB','900');
 put('identity',d.local?(d.domain?'EXAMPLE NAME · NOT VERIFIED':'BROWSER PRACTICE'):d.domain?shortWallet(d.wallet)+' · .skr linked':'SOLANA WALLET',76,261,452,21,'#9EBEB3','400');
 put('status',d.local?'LOCAL TEST':d.final?'FINAL RESULT':'LIVE STANDING',76,365,435,24,'#B8E5D9','700','left',2);
 put('rank',rank,70,437,440,Math.max(64,Math.min(180,440/(rank.length*.68))),'#C3EAE1','900');
 put('rank-label',d.local?'NOT A LIVE RANK':placed?'WEEKLY RANK':'NOT YET RANKED',80,657,390,26,'#C0E0D5','700','left',2);
 const participants=natural(d.participants??0);put('participants',d.local?'Local results only':placed&&participants>=d.rank!?`of ${count(participants)} ranked couriers`:placed?'Verified scored runs':'Finish a scored mission',80,706,395,22,'#91ADA3','400');
 put('record',earned?(d.local?'GHOST SIGNAL · TEST':'GHOST SIGNAL'):'COURIER RECORD',76,1141,928,29,'#CAE7DE','700','center',4);
 const xs=[76,393,710],width=294,values=[count(d.points),`${cleared} / 3`,cleared?cardTime(d.ticks):'—'],labels=['TOTAL POINTS','MISSIONS CLEARED','TOTAL TIME'];
 values.forEach((v,i)=>{put('stat-'+i,v,xs[i]!,1222,width,Math.min(62,width/(v.length*.62)),'#D6F0E7','900','center');put('label-'+i,labels[i]!,xs[i]!,1300,width,21,'#9EBCB2','700','center',1.5);});
 put('meaning','Best completed run per mission',76,1355,928,21,'#819F94','400','center');
 put('week',cardWeek(d.week),76,1410,928,25,'#C2DCD2','700','center',1);
 put('qualifier',d.local?'Browser test · not a verified league result':d.final?'Final weekly result':placed?'Live snapshot · rank can change':'Complete a scored mission to join this week',76,1453,928,23,'#9BB7AD','400','center');
 put('site','stealaseeker.bluntbrain.com',76,1487,928,21,'#A5C5B9','400','center',2);
 return blocks;
}
export function cardDescription(d:CourierCardData){return cardLayout(d).map(b=>b.text).join('. ')+'. Outfit: '+costumeFor(d.outfit).name;}
export function cardSvg(d:CourierCardData){
 const height=cardHeight(d),p=cardPortraitRect(d);
 const bg=d.campaign?'<rect width="1080" height="1450" fill="#14211E"/><path d="M30 1155 H310 M770 1155 H1050 M360 1200 V1368 M720 1200 V1368" stroke="#40564E" stroke-width="2"/><path d="M180 1198 L187 1214 L205 1216 L191 1228 L195 1246 L180 1237 L165 1246 L169 1228 L155 1216 L173 1214 Z" fill="#C3EAE1"/><g fill="#E7CE8E"><rect x="516" y="1216" width="12" height="28" rx="2"/><rect x="535" y="1198" width="12" height="46" rx="2"/><rect x="554" y="1208" width="12" height="36" rx="2"/></g><g fill="none" stroke="#E7CE8E" stroke-width="5" stroke-linecap="round"><circle cx="900" cy="1224" r="19"/><path d="M900 1211 V1224 H910 M894 1198 H906 M900 1198 V1204"/></g>':`<image href="${CARD_BACKGROUND}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">${bg}<image href="${cardPortrait(d)}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="xMidYMid meet"/>${!d.campaign&&d.frame==='profile-frame'?'<rect x="34" y="34" width="1012" height="1552" rx="28" fill="none" stroke="#CFE6E4" stroke-width="8"/>':''}<g font-family="Arial,sans-serif">${cardLayout(d).map(b=>`<text x="${b.align==='center'?b.x+b.width/2:b.x}" y="${b.y}" dominant-baseline="text-before-edge" text-anchor="${b.align==='center'?'middle':'start'}" font-size="${b.size}" font-weight="${b.weight}" letter-spacing="${b.spacing??0}" fill="${b.color}">${esc(b.text)}</text>`).join('')}</g></svg>`;
}
