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
 assert.equal(new Set(COSTUMES.map(c=>cardPortrait({...d,outfit:c.id}))).size,6,'equipped outfit remains distinct in the finale');
 assert.deepEqual(cardLayout({...d,outfit:'night-courier'}),cardLayout(d),'outfit cannot alter earned stats');
});
