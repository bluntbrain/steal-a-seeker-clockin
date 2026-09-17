import portraits from '../../assets/costumes-v4/portraits.embedded.json';
import {costumeFor} from '../../shared/costumes';
import background from '../../assets/courier-card-v3/background.embedded.json';
export const CARD_WIDTH=1080,CARD_HEIGHT=1620,CARD_RATIO=CARD_HEIGHT/CARD_WIDTH;
export const CARD_BACKGROUND=background.uri;
export const CARD_PORTRAIT={x:526,y:350,width:478,height:717};
export const cardPortrait=(d:CourierCardData)=>portraits[costumeFor(d.outfit).asset];
export type CourierCardData={week:string;rank:number|null;participants?:number;points:number;cleared:number;ticks:number;domain:string|null;wallet:string;final:boolean;local:boolean;earned:boolean;outfit?:string;frame?:string};
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
export const cardFileName=(d:CourierCardData)=>`seeker-${/^\d{4}-\d{2}-\d{2}$/.test(d.week)?d.week:'weekly'}.png`;
/** Shared layout keeps native preview, browser preview and exported PNG values identical. */
export function cardLayout(d:CourierCardData):CardText[]{
 const blocks:CardText[]=[],put=(key:string,text:string,x:number,y:number,width:number,size:number,color='#CFE6E4',weight:CardText['weight']='700',align:CardText['align']='left',spacing=0)=>blocks.push({key,text,x,y,width,size,color,weight,align,spacing});
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
export function cardSvg(d:CourierCardData){return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}"><image href="${CARD_BACKGROUND}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}"/><image href="${cardPortrait(d)}" x="${CARD_PORTRAIT.x}" y="${CARD_PORTRAIT.y}" width="${CARD_PORTRAIT.width}" height="${CARD_PORTRAIT.height}"/>${d.frame==='profile-frame'?'<rect x="34" y="34" width="1012" height="1552" rx="28" fill="none" stroke="#CFE6E4" stroke-width="8"/>':''}<g font-family="Arial,sans-serif">${cardLayout(d).map(b=>`<text x="${b.align==='center'?b.x+b.width/2:b.x}" y="${b.y}" dominant-baseline="text-before-edge" text-anchor="${b.align==='center'?'middle':'start'}" font-size="${b.size}" font-weight="${b.weight}" letter-spacing="${b.spacing??0}" fill="${b.color}">${esc(b.text)}</text>`).join('')}</g></svg>`;}
