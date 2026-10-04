import test from 'node:test';import assert from 'node:assert/strict';
import {CAMPAIGN_IDS} from '../src/game/level';import {initialState} from '../src/game/simulation';
import {completedCampaign,campaignSummary,nextCampaignMission} from '../src/campaign/completion';
import {freshProgress,recordWin} from '../src/progress/model';import {cardLayout,cardFileName,type CourierCardData} from '../src/league/card';
import {phoneObjective} from '../src/controls/objective';
test('campaign celebration requires all twelve wins and there is never a next mission after the last',()=>{
 let p=freshProgress();for(const [i,id] of CAMPAIGN_IDS.entries()){const s=initialState(id);s.status='won';s.elapsed=30;s.score=100;s.battery=100;assert.equal(completedCampaign(p,s),i===11);p=recordWin(p,s);}
 const s=initialState('last-vault');s.status='won';s.elapsed=35;s.score=90;s.battery=70;assert(completedCampaign(p,s));assert.equal(campaignSummary(p,s).score,1200);assert.equal(campaignSummary(p,s).seconds,360);assert.equal(campaignSummary(p,s).cleared,12);
 delete p.missions.practice;assert.equal(completedCampaign(p,s),false);assert.equal(nextCampaignMission('last-vault'),undefined);assert.equal(nextCampaignMission('practice'),'cone-lesson');
});
test('campaign export labels real aggregated progress, never a weekly rank or cash prize',()=>{
 const data:CourierCardData={week:'',rank:null,points:0,cleared:0,ticks:0,domain:null,wallet:'browser-playtest',local:true,earned:false,final:true,campaign:{cleared:12,stars:33,score:12345,seconds:360}};
 const text=cardLayout(data).map(t=>t.text).join(' ');assert.match(text,/33 \/ 36/);assert.match(text,/12,345/);assert.match(text,/06:00/);assert.doesNotMatch(text,/WEEKLY RANK|LIVE STANDING|SKR|\$/);assert.equal(cardFileName(data),'seeker-campaign-complete.png');
});
test('two phone instructions explain every pickup and delivery stage',()=>{
 assert.equal(phoneObjective({delivered:0,carrying:false},2),'Take phone 1 of 2');assert.match(phoneObjective({delivered:0,carrying:true},2),/Return phone 1 of 2/);assert.equal(phoneObjective({delivered:1,carrying:false},2),'One secured. Take phone 2 of 2');assert.match(phoneObjective({delivered:1,carrying:true},2),/Return phone 2 of 2/);assert.equal(phoneObjective({delivered:2,carrying:false},2),'All phones secured');
});

test('celebration export fits its own dimensions and preserves equipped outfits',async()=>{
 const {cardHeight,CARD_WIDTH,cardPortrait,cardPortraitRect,cardSvg}=await import('../src/league/card');
 const {COSTUMES}=await import('../shared/costumes');
 const d:CourierCardData={week:'',rank:null,points:0,cleared:0,ticks:0,domain:null,wallet:'browser-playtest',local:true,earned:false,final:true,campaign:{cleared:12,stars:34,score:143845,seconds:330.7333333}};
 const svg=cardSvg(d);assert(svg.includes(`width="1080" height="1450"`));assert(svg.includes('Every Seeker. Secured.'));assert(svg.includes('05:30.73'));assert(!svg.includes('Replay'),'export contains achievement, not UI buttons');
 for(const b of cardLayout(d)){assert(b.x+b.width<=CARD_WIDTH);assert(b.y+b.size*1.18<cardHeight(d));}
 const p=cardPortraitRect(d);assert(p.x+p.width<=CARD_WIDTH);assert(p.y+p.height<cardHeight(d));
 assert.equal(new Set(COSTUMES.map(c=>cardPortrait({...d,outfit:c.id}))).size,13,'equipped outfit remains distinct in the finale');
 assert.deepEqual(cardLayout({...d,outfit:'night-courier'}),cardLayout(d),'outfit cannot alter earned stats');
});

test('replaying earlier missions after campaign completion never opens the finale',()=>{
 let p=freshProgress();for(const id of CAMPAIGN_IDS){const s=initialState(id);s.status='won';p=recordWin(p,s);}
 for(const id of CAMPAIGN_IDS){const s=initialState(id);s.status='won';assert.equal(completedCampaign(p,s),id==='last-vault');s.status='playing';assert.equal(completedCampaign(p,s),false);}
});

test('the level map lists the twelve authored missions then every bundled level without a gap, bosses every third level from 13',async()=>{
 const {campaignEntries,BUNDLED_LEVELS,entryUnlocked,nextEntry,firstOpenEntry,authoredEntry}=await import('../src/campaign/levels');
 const {makeCampaignRecipe,buildCampaignLevel,bossFor}=await import('../shared/campaign-levels');
 const entries=campaignEntries(BUNDLED_LEVELS);
 assert.equal(entries.length,12+BUNDLED_LEVELS.length);entries.forEach((e,i)=>assert.equal(e.number,i+1));
 assert.deepEqual(entries.slice(0,12).map(e=>e.key),CAMPAIGN_IDS);assert.equal(entries[12]!.key,'campaign:13');assert.equal(entries[14]!.boss,'toly');assert.equal(entries[17]!.boss,'mert');
 for(const e of entries.slice(12))assert.equal(e.boss,bossFor(e.number)??null);
 assert(entries.every(e=>e.playable),'bundled levels were published under the current engine');
 // a missing batch stops the map instead of showing unreachable nodes
 assert.equal(campaignEntries(BUNDLED_LEVELS.filter(l=>l.number!==20)).length,12+7);
 // the bundle regenerates bit for bit from its recipes, so the server rows and the app agree
 for(const n of [13,15,47,100]){const row=BUNDLED_LEVELS.find(l=>l.number===n)!;assert.deepEqual(buildCampaignLevel(makeCampaignRecipe(n)),row.definition);}
 let p=freshProgress();assert(entryUnlocked(p,entries,0));assert(!entryUnlocked(p,entries,12));assert.equal(nextEntry(entries,'last-vault')!.key,'campaign:13');assert.equal(nextEntry(entries,entries[entries.length-1]!.key),undefined);
 for(const id of CAMPAIGN_IDS){const s=initialState(id);s.status='won';p=recordWin(p,s);}
 assert(entryUnlocked(p,entries,12));assert.equal(firstOpenEntry(p,entries).key,'campaign:13');assert.equal(authoredEntry('practice').number,1);
 // a published win never opens the twelve-mission finale
 const level=entries[12]!.definition,s=initialState(level.mission,level);s.status='won';assert.equal(completedCampaign(p,s),false);
});
test('the level share card names the current level and never the finale copy',()=>{
 const data:CourierCardData={week:'',rank:null,points:0,cleared:0,ticks:0,domain:null,wallet:'browser-playtest',local:true,earned:false,final:true,campaign:{cleared:36,stars:90,score:45000,seconds:900,level:37,total:100}};
 const text=cardLayout(data).map(t=>t.text).join(' ');assert.match(text,/LEVEL 37 OF 100/);assert.match(text,/90 \/ 300/);assert.match(text,/Still climbing/);assert.doesNotMatch(text,/Every Seeker/);assert.equal(cardFileName(data),'seeker-level-37.png');
 const done=cardLayout({...data,campaign:{...data.campaign!,cleared:100,level:100}}).map(t=>t.text).join(' ');assert.match(done,/ALL 100 LEVELS CLEARED/);
});
