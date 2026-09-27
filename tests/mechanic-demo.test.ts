import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MECHANIC_COVER,MECHANIC_DURATION,MECHANIC_STEPS,mechanicFrame,type Mechanic} from '../src/onboarding/mechanic-demo';
import {campaignLesson} from '../src/onboarding/mission-lessons';
import {CAMPAIGN_IDS} from '../src/game/level';

test('every mechanic keeps the courier on floor, clear of walls, and within the stage',()=>{
 for(const kind of Object.keys(MECHANIC_STEPS) as Mechanic[]){
  for(let t=0;t<=MECHANIC_DURATION;t+=.025){
   const f=mechanicFrame(kind,t);
   assert.ok(Number.isFinite(f.x)&&Number.isFinite(f.y));
   assert.ok(f.x>=20&&f.x<=300&&f.y>=60&&f.y<=280,`${kind} bounds ${t}`);
   for(const r of MECHANIC_COVER[kind]){
    const dx=f.x-Math.max(r.x,Math.min(r.x+r.width,f.x)),dy=f.y-Math.max(r.y,Math.min(r.y+r.height,f.y));
    assert.ok(Math.hypot(dx,dy)>=10,`${kind} crossed wall at ${t}`);
   }
   assert.ok(f.actors.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)&&a.hp>=0&&a.hp<=1));
  }
  for(let step=0;step<3;step++)assert.equal(mechanicFrame(kind,step*5+2.8).step,step);
 }
});
test('drone lesson distinguishes charging, successful report and an earlier interrupted report',()=>{
 const scan=mechanicFrame('drone',3),report=mechanicFrame('drone',8),stopped=mechanicFrame('drone',13);
 assert.ok(scan.charge>0&&scan.charge<1);assert.equal(scan.radio,false);
 assert.equal(report.radio,true);
 for(const i of [1,2])assert.ok(Math.hypot(report.actors[i]!.x-report.x,report.actors[i]!.y-report.y)<Math.hypot(scan.actors[i]!.x-scan.x,scan.actors[i]!.y-scan.y));
 assert.equal(stopped.stopped,true);assert.equal(stopped.actors[0]!.visible,false);assert.equal(stopped.radio,false);assert.equal(stopped.charge,0);
 for(let t=0;t<15;t+=.02)assert.equal(mechanicFrame('drone',t).shot.enemy,false);
 assert.match(MECHANIC_STEPS.drone[2]!.caption,/before.*sent alert stays active/);
});
test('pickup warning precedes reinforcements and a carried phone precedes extraction',()=>{
 assert.equal(mechanicFrame('reinforcements',3).entry,false);
 const warning=mechanicFrame('reinforcements',3.3);assert.ok(warning.entry&&warning.carried);assert.equal(warning.actors[0]!.visible,false);
 assert.equal(mechanicFrame('reinforcements',6.3).actors[0]!.visible,true);
 assert.equal(mechanicFrame('reinforcements',14.5).extracted,true);
 assert.equal(mechanicFrame('reinforcements',14.5).carried,false);
});
test('relay delivers two phones separately; exit timing and armor explain real restrictions',()=>{
 assert.equal(mechanicFrame('relay',4).carried,true);assert.equal(mechanicFrame('relay',4).delivered,0);
 assert.equal(mechanicFrame('relay',8).delivered,1);assert.equal(mechanicFrame('relay',8).carried,false);
 assert.equal(mechanicFrame('relay',13).delivered,1);assert.equal(mechanicFrame('relay',13).carried,true);
 assert.equal(mechanicFrame('relay',15).delivered,2);assert.equal(mechanicFrame('relay',15).extracted,true);
 for(let t=0;t<15;t+=.05){const f=mechanicFrame('timed-exit',t);if(f.extracted)assert.equal(f.exitOpen,true);}
 assert.ok(mechanicFrame('armor',12).actors[0]!.hp<mechanicFrame('armor',3).actors[0]!.hp);
 for(let t=0;t<15;t+=.05){const f=mechanicFrame('switch',t);if(f.x>=206)assert.equal(f.gateOpen,true);}
});
test('each campaign introduction after basic controls teaches a distinct mechanic',()=>{
 const lessons=CAMPAIGN_IDS.map(campaignLesson);
 assert.equal(lessons[0]!.demo,undefined);
 assert.match(lessons[0]!.tip!,/drones do not shoot/);
 assert.equal(new Set(lessons.slice(1).map(l=>l.demo)).size,11);
 assert.equal(lessons[1]!.demo,'drone');assert.equal(lessons[5]!.demo,'armor');assert.equal(lessons[7]!.demo,'relay');assert.equal(lessons[8]!.demo,'switch');assert.equal(lessons[9]!.demo,'timed-exit');
});
