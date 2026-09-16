import test from 'node:test';
import assert from 'node:assert/strict';
import {CARD_WIDTH,CARD_HEIGHT,cardLayout,cardSvg,cardTime,cardWeek,cardFileName,type CourierCardData} from '../src/league/card';
const record:CourierCardData={week:'2026-09-14',rank:34,participants:58,points:18820,cleared:2,ticks:4035,domain:'courier.skr',wallet:'GyftsRcgrvFWHGhhTvVTQMDGVU565UmmPvbhuZ3nYwgE',local:false,final:false,earned:false};
const text=(d:CourierCardData,key:string)=>cardLayout(d).find(b=>b.key===key)!.text;
test('card shows actual weekly totals, participant count and live status',()=>{
 assert.equal(text(record,'rank'),'#34');assert.equal(text(record,'participants'),'of 58 ranked couriers');assert.equal(text(record,'stat-0'),'18,820');assert.equal(text(record,'stat-1'),'2 / 3');assert.equal(text(record,'stat-2'),'02:14.50');assert.equal(text(record,'week'),'14–20 SEP 2026 · UTC');assert.equal(text(record,'qualifier'),'Live snapshot · rank can change');
 assert(!cardSvg(record).includes('Devnet test season'));assert(!cardSvg(record).includes('CONTRACTS'));
});
test('local and unranked cards cannot imply a live rank or earned status',()=>{
 const local={...record,local:true,rank:1};assert.equal(text(local,'rank'),'TEST');assert.equal(text(local,'status'),'LOCAL TEST');assert(!text(local,'identity').includes('linked'));
 const empty={...record,rank:null,cleared:0,points:0,ticks:0,earned:true};assert.equal(text(empty,'rank'),'—');assert.equal(text(empty,'stat-2'),'—');assert.equal(text(empty,'record'),'COURIER RECORD');
 const final={...record,final:true,earned:true,cleared:3};assert.equal(text(final,'record'),'GHOST COURIER');assert.equal(text(final,'qualifier'),'Final weekly result');
});
test('dates cross month and year boundaries in UTC, and timing rounds across minutes',()=>{
 assert.equal(cardWeek('2026-09-28'),'28 SEP – 4 OCT 2026 · UTC');assert.equal(cardWeek('2026-12-28'),'28 DEC 2026 – 3 JAN 2027 · UTC');assert.equal(cardWeek('2026-02-31'),'WEEK UNAVAILABLE');assert.equal(cardTime(1800),'01:00.00');assert.equal(cardTime(1),'00:00.03');
});
test('export is self-contained, safely escapes identity and retains all layout data',()=>{
 const d={...record,domain:'<script>alert("x")</script>.skr'},svg=cardSvg(d);assert(svg.includes('data:image/webp;base64,'));assert(!svg.includes('<script>'));assert(svg.includes('&lt;script&gt;'));assert(svg.includes(`width="${CARD_WIDTH}" height="${CARD_HEIGHT}"`));
 for(const b of cardLayout(record)){assert(b.x>=0&&b.x+b.width<=CARD_WIDTH);assert(b.y+b.size*1.18<CARD_HEIGHT);assert(cardSvg(record).includes(b.text));}
 assert.equal(cardFileName({...record,week:'../../private'}),'seeker-weekly.png');
});
