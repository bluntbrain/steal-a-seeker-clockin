import test from 'node:test';import assert from 'node:assert/strict';
import {CAMPAIGN_IDS,type LevelDefinition} from '../src/game/level';
import {combatLevel} from '../src/game/combat-levels';
import {combatTap,type CombatCommand} from '../src/game/combat';
import {initialState,idleInput,step,type GameState} from '../src/game/simulation';
import {findPath} from '../src/game/navigation';
import {recordStep} from '../src/game/recording';
import {verifyReplay} from '../server/replay';
import type {ReplayChunk} from '../shared/replay';
const tick=(s:GameState,n=1,command?:CombatCommand)=>{for(let i=0;i<n;i++)step(s,{...idleInput(),command:i===0?command:undefined});};
const order=(s:GameState,x:number,y:number,seq:number)=>combatTap(s,x,y,seq);
function arena():LevelDefinition{const l=combatLevel('practice');return {...l,spawn:{x:2,y:10},phone:{x:2,y:7},exit:{x:1.2,y:15,w:1.6,h:1.5},blockers:l.blockers.slice(0,4),patrols:[{...l.patrols[0]!,route:[{x:4,y:10},{x:4,y:10.1}],combatRole:'drone'}]};}
test('all twelve combat maps have reachable phone and exit and valid guard routes',()=>{for(const id of CAMPAIGN_IDS){const l=combatLevel(id);assert.equal(l.combat?.version,2);assert.equal(l.decoys,0);for(const target of [...(l.targets??[l.phone]),{x:l.exit.x+l.exit.w/2,y:l.exit.y+l.exit.h/2}])assert(findPath(l.spawn,target,l).length,`${id} unreachable target`);for(const g of l.patrols)assert(findPath(g.route[0]!,g.route[1]!,l).length,`${id}: blocked patrol ${JSON.stringify(g.route)}`);}});
test('tap selects a guard, shoots, and permanently disables its attacks',()=>{const s=initialState('practice',arena());tick(s,1,order(s,4,10,1));tick(s,20);assert.equal(s.combat!.kills,1);assert.equal(s.guards[0]!.hp,0);assert.equal(s.guards[0]!.active,false);const shots=s.combat!.shots;tick(s,100);assert.equal(s.combat!.shots,shots);});
test('tap movement replaces attack; repeated sequence never produces extra actions',()=>{const l=arena();l.patrols[0]!.combatRole='heavy';const s=initialState('practice',l);const attack=order(s,4,10,1);tick(s,2,attack);tick(s,1,order(s,2,14,2));const shots=s.combat!.shots;tick(s,15,attack);assert.equal(s.combat!.shots,shots);assert(s.y>10);});
test('walls block bullets and rejected attack leaves a valid move intact',()=>{const l=arena();l.blockers.push({x:3,y:8,w:.5,h:4,kind:'wall'});const s=initialState('practice',l);tick(s,1,order(s,2,14,1));tick(s,1,order(s,4,10,2));assert.equal(s.combat!.order?.kind,'move');tick(s,20);assert.equal(s.guards[0]!.hp,25);assert.equal(s.combat!.shots,0);});
test('guards warn before shooting and projectile damage replaces exposure death',()=>{const l=arena();l.patrols[0] = {...l.patrols[0]!,combatRole:'scout',route:[{x:4,y:10},{x:2.1,y:10}],speed:0};const s=initialState('practice',l);tick(s,5);assert.equal(s.guards[0]!.gunPhase,'aim');assert.equal(s.combat!.hp,100);assert.equal(s.status,'playing');tick(s,40);assert(s.combat!.hp<100);assert.equal(s.status,'playing');});
test('phone tap picks up, reserves activate after their countdown, exit completes',()=>{const l=arena();l.patrols=[{...l.patrols[0]!,reserveAfter:2}];const s=initialState('practice',l);tick(s,60,order(s,2,7,1));assert.equal(s.carrying,true);assert.equal(s.securityAlarm,true);assert.equal(s.guards[0]!.active,false);tick(s,65);assert.equal(s.guards[0]!.active,true);tick(s,180,order(s,2,15.6,2));assert.equal(s.status,'won');assert(s.score<=10000);});
test('recorded combat replay verifies exactly and rejects forged inputs',()=>{const l=arena();l.patrols=[];const s=initialState('practice',l),chunks:ReplayChunk[]=[];for(let i=0;i<500&&s.status==='playing';i++){const command=i===0?order(s,2,7,1):i===80?order(s,2,15.6,2):undefined;recordStep(s,{...idleInput(),command},chunks);}const replay={version:2 as const,chunks};const verified=verifyReplay('practice',replay,l);assert.equal(verified.status,'won');assert.equal(verified.score,s.score);assert.equal(verified.hp,s.combat!.hp);assert.equal(verified.ticks,s.ticks);assert.throws(()=>verifyReplay('practice',{...replay,chunks:[{...chunks[0],command:{...chunks[0]!.command,hp:999}}]},l));assert.throws(()=>verifyReplay('practice',{version:1,chunks},l),/version/);assert.throws(()=>verifyReplay('practice',{version:2,chunks:[{x:127,y:0,buttons:0,ticks:1}]},l),/command input/);});

test('full tutorial uses real aim, dodge, shots, two-way navigation and extraction',async()=>{const {GUIDE_STEPS,guideDone}=await import('../src/onboarding/combat-guide');const s=initialState('practice',combatLevel('practice'));for(let i=0;i<GUIDE_STEPS.length;i++){const p=GUIDE_STEPS[i]!;tick(s,1,order(s,p.x,p.y,i+1));let budget=500;while(!guideDone(i,s)&&s.status==='playing'&&budget--)tick(s);assert(guideDone(i,s),`Tutorial stuck at ${i}`);if(i===3)assert.equal(s.guards[1]!.gunPhase,'aim');}assert.equal(s.status,'won');assert(s.combat!.aimEvents>0);assert.equal(s.combat!.kills,2);});
test('all authored combat missions have honest input replays; local restore equals server result',async()=>{const {solveCombat}=await import('../scripts/qa-combat');const {restorePaidState}=await import('../src/paid/recovery');for(const id of CAMPAIGN_IDS){const l=combatLevel(id),win=solveCombat(l);assert(win,`${id} unsolved`);const r=verifyReplay(id,win.replay,l),restored=restorePaidState(id,win.replay,l);assert.equal(r.status,'won');assert.equal(restored.status,r.status);assert.equal(restored.score,r.score);assert.equal(restored.combat!.hp,r.hp);}});
test('52 weekly combat rotations are deterministic, connected and distinguish health from speed',async()=>{const {makeCombatContracts,contractPoints}=await import('../shared/contracts');for(let week=0;week<52;week++){const date=new Date(Date.UTC(2026,8,14+week*7)),cs=makeCombatContracts(date);assert.deepEqual(cs,makeCombatContracts(date));for(const c of cs){assert(c.id.endsWith(':combat-v2'));assert.equal(c.level.combat?.version,2);assert.equal(c.level.decoys,0);for(const target of c.level.targets??[c.level.phone])assert(findPath(c.level.spawn,target,c.level).length);const good={status:'won',score:0,ticks:600,hp:100};assert(contractPoints(good,c.level)>contractPoints({...good,hp:80},c.level));assert(contractPoints(good,c.level)>contractPoints({...good,ticks:630},c.level));}}});

test('tactical guards react to being shot and rear ambush damage is decided when fired',()=>{
 const l=arena();l.id='combat-v2:cone-lesson';l.number=2;l.patrols[0]={...l.patrols[0]!,combatRole:'scout',route:[{x:4,y:10},{x:5,y:10}],speed:0};
 const s=initialState(l.mission,l);tick(s,15,order(s,4,10,1));assert.equal(s.guards[0]!.hp,0,'A clean rear opening drops one scout');assert.equal(s.combat!.shots,1);
 l.patrols[0]!.combatRole='heavy';const h=initialState(l.mission,l);tick(h,10,order(h,4,10,1));assert(h.guards[0]!.hp<150);assert(h.guards[0]!.reactionTicks>0,'Surviving armor pauses before turning');assert.equal(h.combat!.enemyShots,0);tick(h,1,{seq:2,kind:'stop',x:h.x,y:h.y,target:-1});tick(h,90);assert(h.combat!.enemyShots>0,'Surviving armor eventually returns fire');
});
test('tactical alarm doubles pursuit speed while preserving a readable aim window',()=>{
 const l=arena();l.id='combat-v2:cone-lesson';l.number=2;l.patrols[0]={...l.patrols[0]!,combatRole:'scout',route:[{x:8,y:5},{x:8,y:6}],speed:1.45};
 const a=initialState(l.mission,l),b=initialState(l.mission,l);b.securityAlarm=true;tick(a,10);tick(b,10);
 const travel=(s:GameState)=>Math.hypot(s.guards[0]!.x-8,s.guards[0]!.y-5);assert(travel(b)>travel(a)*1.8);assert.equal(b.combat!.hp,100);
});
test('repeated phone taps do not restart the tactical pickup hold',()=>{
 const l=arena();l.id='combat-v2:cone-lesson';l.number=2;l.patrols=[];l.spawn={...l.phone};const s=initialState(l.mission,l);for(let i=1;i<=20;i++)tick(s,1,order(s,l.phone.x,l.phone.y,i));assert(s.carrying);
});

// These cases catch the rear-contact and instant-noise-turn regressions.
test('close rear approach is unseen, while the front cone still detects at the same distance',async()=>{
 const {sees}=await import('../src/game/guards');const l=arena();l.id='combat-v2:rear-test';
 l.patrols[0]={...l.patrols[0]!,combatRole:'scout',route:[{x:4,y:10},{x:5,y:10}],speed:0};
 const s=initialState(l.mission,l),g=s.guards[0]!;
 assert.equal(sees(g,3.6,10,l),false);assert.equal(sees(g,4.4,10,l),true);
 assert.equal(sees(g,3.6,10,{...l,combat:{version:2,revision:3}}),true,'Published old rules retain contact detection');
 s.x=3.6;tick(s,10,order(s,4,10,1));assert.equal(g.hp,0);assert.equal(s.combat!.enemyShots,0);assert.equal(s.combat!.hp,100);
});
test('rear opening defeats a sentry; an armored survivor cannot be stun-locked',()=>{
 const l=arena();l.id='combat-v2:rear-test';l.patrols[0]={...l.patrols[0]!,combatRole:'sentry',route:[{x:4,y:10},{x:5,y:10}],speed:0};
 const s=initialState(l.mission,l);tick(s,25,order(s,4,10,1));assert.equal(s.guards[0]!.hp,0);assert.equal(s.combat!.shots,2);assert.equal(s.combat!.enemyShots,0);
 l.patrols[0]!.combatRole='warden';const a=initialState(l.mission,l);tick(a,10,order(a,4,10,1));assert.equal(a.guards[0]!.hp,150);assert.equal(a.guards[0]!.angle,0,'No instant spin when the shot lands');
 tick(a,12);assert.equal(a.guards[0]!.reactionTicks,0,'Follow-up hits do not restart the stagger');assert(a.guards[0]!.angle>0,'The guard turns gradually after reacting');
});
