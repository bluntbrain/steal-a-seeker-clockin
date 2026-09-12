import test from 'node:test';import assert from 'node:assert/strict';
import {CAMPAIGN_IDS,getLevel,alarmSpeed,SECURITY} from '../src/game/level';
import {initialState,idleInput,step,decoyLanding} from '../src/game/simulation';
import {makeGuards,updateGuards} from '../src/game/guards';
import {decoyMessage} from '../src/game/feedback';
test('real pickup triggers alarm immediately and delivery does not reset it',()=>{
 const s=initialState('two-targets'),l=getLevel(s.mission);s.guards=[];Object.assign(s,{x:l.phone.x,y:l.phone.y});for(let i=0;i<12;i++)step(s,{...idleInput(),interact:true});assert(s.carrying);assert(s.securityAlarm);assert.equal(s.thefts,1);assert.equal(alarmSpeed(s.alarmSeconds),1.4);
 Object.assign(s,{x:l.exit.x+1,y:l.exit.y+.7});for(let i=0;i<31;i++)step(s,idleInput());assert.equal(s.delivered,1);assert(!s.carrying);assert(s.securityAlarm);assert(s.alarmSeconds>=1);assert.equal(initialState(s.mission).securityAlarm,false);
});
test('alarm increases actual patrol travel immediately and caps the escalation',()=>{
 const l=getLevel('cone-lesson'),normal=makeGuards(l.mission),fast=makeGuards(l.mission),start=normal[0]!.x;
 updateGuards(normal,-100,-100,.5,l);updateGuards(fast,-100,-100,.5,l,undefined,{power:0,delivered:0,alarmSeconds:0});assert(Math.abs((fast[0]!.x-start)/(normal[0]!.x-start)-1.4)<1e-6);assert.equal(alarmSpeed(30),1.8);assert.equal(alarmSpeed(600),1.8);
 const scanner=getLevel('sweep-window'),a=makeGuards(scanner.mission),b=makeGuards(scanner.mission);updateGuards(a,-100,-100,.5,scanner);updateGuards(b,-100,-100,.5,scanner,undefined,{power:0,delivered:0,alarmSeconds:30});assert(b[0]!.clock>a[0]!.clock);assert.notEqual(b[0]!.angle,a[0]!.angle);
});
test('all twelve missions have reinforcements and noise lures',()=>{
 const expected=[1,2,2,3,2,3,3,3,3,3,3,4];for(const [i,id]of CAMPAIGN_IDS.entries()){const l=getLevel(id);assert.equal(l.patrols.length,expected[i]);assert((l.decoys??0)>=2);assert(l.patrols.filter(g=>g.kind!=='scanner').every(g=>g.investigates));}
});
test('a persistent beacon attracts a guard that enters range later, then holds its search',()=>{
 const l={...getLevel('cone-lesson'),blockers:[]},gs=makeGuards(l.mission),g=gs[0]!;Object.assign(g,{x:1,y:2,wait:10});const noise={x:10.2,y:2,kind:'decoy' as const,id:1,ttl:6};updateGuards(gs,-100,-100,1/30,l,noise);assert.equal(g.lureId,0);
 g.x=1.5;updateGuards(gs,-100,-100,1/30,l,noise);assert.equal(g.lureId,1);assert.equal(g.mode,'investigate');const oldX=g.x;for(let i=0;i<30;i++)updateGuards(gs,-100,-100,1/30,l,{...noise,ttl:5});assert(g.x>oldX+.5);
 Object.assign(g,{x:10.2,y:2,pathIndex:g.path.length,mode:'investigate'});updateGuards(gs,-100,-100,1/30,l,{...noise,ttl:3});assert.equal(g.mode,'search');for(let i=0;i<60;i++)updateGuards(gs,-100,-100,1/30,l,{...noise,ttl:3-i/30});assert.equal(g.mode,'search');
});
test('guards seeing the courier and fixed scanners ignore a noise lure',()=>{
 const l=getLevel('cone-lesson'),gs=makeGuards(l.mission),g=gs[0]!;g.wait=10;updateGuards(gs,g.x+1,g.y,1/30,l,{x:3.7,y:15,kind:'decoy',id:1,ttl:6});assert(g.seesPlayer);assert.equal(g.lureId,0);
 const scan=getLevel('sweep-window'),ss=makeGuards(scan.mission);updateGuards(ss,-100,-100,1/30,scan,{x:6.6,y:8,kind:'decoy',id:1,ttl:6});assert.equal(ss[0]!.lureId,0);
});
test('blocked throws are explained and the landing preview matches the real beacon',()=>{
 const s=initialState('false-footsteps');Object.assign(s,{x:4,y:14,facing:3});const before=s.decoysLeft;step(s,{...idleInput(),tool:1});assert.equal(s.decoysLeft,before);assert.equal(s.decoyFeedback,'blocked');assert.match(decoyMessage(s),/no decoy was spent/);
 const a=initialState('cone-lesson'),landing=decoyLanding(a,idleInput());step(a,{...idleInput(),tool:1});assert.equal(a.decoy.x,landing.x);assert.equal(a.decoy.y,landing.y);assert.equal(a.decoy.ttl,SECURITY.decoySeconds);assert.equal(a.decoysLeft,1);
});
test('a guard on a valid narrow patrol lane can path to a decoy beside cover',()=>{
 const l=getLevel('crossing-signals'),guards=makeGuards(l.mission),g=guards[0]!;
 // x=1.1 is clear for the authored .26 body but rejected by the old .37 navigator.
 assert.equal(g.x,1.1);updateGuards(guards,-100,-100,1/30,l,{x:3.8,y:11.9,kind:'decoy',id:1,ttl:6});assert.equal(g.lureId,1);assert.equal(g.mode,'investigate');
 const old={x:g.x,y:g.y};for(let i=0;i<30;i++)updateGuards(guards,-100,-100,1/30,l,{x:3.8,y:11.9,kind:'decoy',id:1,ttl:5});assert(Math.hypot(g.x-old.x,g.y-old.y)>.5);
});
