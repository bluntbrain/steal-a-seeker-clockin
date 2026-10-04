import {CAMPAIGN_IDS} from '../src/game/level';
import {campaignStats,compareCampaign} from '../shared/economy';
import test from 'node:test';
import assert from 'node:assert/strict';
import {freshPlaytest,purchase,equip,claimRebate,recordCampaign} from '../src/playtest/store';
import {PRODUCTS} from '../shared/commerce';
test('local campaign and every cosmetic debit once, equip only owned items',()=>{let s={...freshPlaytest(),balance:950};assert.throws(()=>equip(s,'night-courier'));for(const p of PRODUCTS.filter(p=>p.kind!=='credits')){s=purchase(s,p.id);assert.strictEqual(purchase(s,p.id),s);if(p.kind!=='access')s=equip(s,p.id);}assert.equal(s.balance,45);assert.equal(s.owned.length,15);assert.equal(s.equipment.outfit,'solana-beeman');assert.throws(()=>purchase({...s,owned:[],balance:1},'campaign'));});

test('completion rebate requires all twelve, pays once, keeps access, and never changes old purchase terms',()=>{
 let s:ReturnType<typeof freshPlaytest>={...purchase(freshPlaytest(),'campaign'),offerVersion:'campaign-v2'};assert.equal(s.balance,150);assert.throws(()=>claimRebate(s));
 for(const mission of CAMPAIGN_IDS)s=recordCampaign(s,{mission,score:11000,ticks:600,battery:60,spotted:false});
 const paid=claimRebate(s);assert.equal(paid.balance,175);assert(paid.owned.includes('campaign'));assert.strictEqual(claimRebate(paid),paid);
 assert.throws(()=>claimRebate({...s,offerVersion:undefined}));assert.throws(()=>claimRebate({...s,owned:[]}));
});
test('ranking distinguishes equal completion counts and never combines different attempts',()=>{
 const slow={mission:'practice',score:12000,ticks:900,battery:100,spotted:false},fast={...slow,score:11000,ticks:400,battery:50};
 const stats=campaignStats([slow,fast]);assert.equal(stats.cleared,1);assert.equal(stats.ticks,900);assert.equal(stats.score,12000);
 assert(compareCampaign({...stats,score:12001},stats)<0);assert(compareCampaign({...stats,ticks:899},stats)<0);assert.equal(compareCampaign(stats,{...stats}),0);
});

test("new passes have no completion rebate even after all twelve wins",()=>{let s=purchase(freshPlaytest(),"campaign");for(const mission of CAMPAIGN_IDS)s=recordCampaign(s,{mission,score:100,ticks:600,battery:60,spotted:false});assert.equal(s.offerVersion,"weekly-pass-v1");assert.throws(()=>claimRebate(s));assert.equal(s.balance,150);});
