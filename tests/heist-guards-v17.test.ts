import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type LevelDefinition} from '../src/game/level';
import {initialState,idleInput,step,type GameState} from '../src/game/simulation';
import {combatTap} from '../src/game/combat';
import {updateHeistGuardsV17,BOSS_TRAITS,RADIO_RADIUS,SEARCH_TICKS,CHASE_MEMORY_TICKS,HEAR_SECONDS,BODY_SECONDS,type HeistMemoryV17} from '../src/game/heist-guards-v17';

// an open room with a few guards; every spec value is explicit so the test does not depend on pressure bands
function arena():LevelDefinition{
 const l=combatLevel('cone-lesson'),base={...l.patrols[0]!,speed:.7,pursuitSpeed:2.4,range:4,halfAngle:Math.PI*35/180,roam:undefined,spotSeconds:.5,pauseSeconds:.8,reserveAfter:undefined,pickupWave:undefined,boss:undefined,hp:undefined};
 return {...l,id:'combat-v17:test',combat:{version:2,revision:17},number:7,spawn:{x:4,y:8},phone:{x:2,y:3},exit:{x:5.4,y:17.4,w:1.2,h:1.2},blockers:l.blockers.slice(0,4),
  encounter:{junctions:[{x:4,y:10},{x:7,y:9}],pockets:[],islands:[],grates:[],routes:{approach:[],escape:[],fast:[]}},
  patrols:[{...base,combatRole:'scout',kind:undefined,route:[{x:6,y:6},{x:6,y:12}],roam:[{x:6,y:6},{x:6,y:12},{x:9,y:12}]},
   {...base,combatRole:'scout',kind:undefined,route:[{x:2,y:16},{x:2,y:15}]},
   {...base,combatRole:'sentry',kind:undefined,route:[{x:10.5,y:1},{x:10.5,y:1.5}]}]};
}
const mem=(s:GameState,i:number)=>s.guards[i]!.heist as HeistMemoryV17;
function tick(s:GameState,count:number){for(let t=0;t<count;t++)step(s,idleInput());}
function advanceAI(s:GameState,l:LevelDefinition,count:number){for(let t=0;t<count;t++){s.ticks++;updateHeistGuardsV17(s,1/30,l,()=>{});}}
function far(s:GameState){s.x=1;s.y=19;s.px=1;s.py=19;s.vx=0;s.vy=0;}

test('a patrol walks its anchors in a fixed loop, pauses almost a second at each one and looks around',()=>{
 const l=arena(),s=initialState(l.mission,l);far(s);const g=s.guards[0]!;
 const visits:string[]=[];let lastWait=0,maxWait=0;
 for(let t=0;t<30*60;t++){advanceAI(s,l,1);if(g.wait>lastWait){maxWait=Math.max(maxWait,g.wait);visits.push(`${Math.round(g.x)},${Math.round(g.y)}`);}lastWait=g.wait;}
 assert(maxWait>=.8&&maxWait<=1.4,`pause ${maxWait}`);
 assert(visits.length>=4,'several anchor visits in a minute');
 const anchors=['6,6','6,12','9,12'];for(const v of visits)assert(anchors.includes(v),v);
 // ping-pong: 6,6 -> 6,12 -> 9,12 -> 6,12 -> 6,6 ...
 assert.deepEqual(visits.slice(0,4),['6,12','9,12','6,12','6,6']);
 assert(!g.alerted&&!mem(s,0).hunting&&g.mode==='patrol');
});
test('a glimpse makes the guard suspicious: it stops, turns, walks to the spot at a brisk pace, searches and returns unalerted',()=>{
 const l=arena();l.patrols=[l.patrols[0]!];const s=initialState(l.mission,l);const g=s.guards[0]!;
 // stand briefly at the edge of the cone, then hide
 s.x=6;s.y=9.2;s.px=s.x;s.py=s.y;advanceAI(s,l,8);assert(g.seesPlayer&&g.exposure>0&&g.exposure<1,'partial exposure');
 far(s);advanceAI(s,l,1);
 const h=mem(s,0);assert(h.suspicious);assert.equal(g.mode,'investigate');assert(!g.alerted,'suspicion never alerts');assert(!h.hunting);
 const at={x:g.x,y:g.y};advanceAI(s,l,12);assert(Math.hypot(g.x-at.x,g.y-at.y)<.05,'the guard stands and turns during the notice pause');
 advanceAI(s,l,30);assert(Math.hypot(g.x-at.x,g.y-at.y)>.3,'then walks');
 let fastest=0;for(let t=0;t<120&&g.mode==='investigate';t++){const b={x:g.x,y:g.y};advanceAI(s,l,1);fastest=Math.max(fastest,Math.hypot(g.x-b.x,g.y-b.y)*30);}
 assert(fastest<=.7*1.3+1e-6&&fastest>.7*1.1,`brisk patrol pace, not a chase: ${fastest}`);
 for(let t=0;t<600&&(g.mode as string)!=='patrol';t++)advanceAI(s,l,1);
 assert.equal(g.mode,'patrol');assert(!mem(s,0).suspicious);assert(!g.alerted);
});
test('confirmed sight alerts the observer and only makes guards within radio range suspicious; the chase ends 2.5 seconds after sight is lost',()=>{
 const l=arena(),s=initialState(l.mission,l);const g=s.guards[0]!;
 s.x=6;s.y=8.5;s.px=s.x;s.py=s.y;advanceAI(s,l,20);
 assert(g.exposure>=1&&mem(s,0).hunting&&g.alerted,'observer hunts');
 assert.equal(mem(s,2).hunting,undefined);assert(!mem(s,2).suspicious,'far guard untouched');
 assert(Math.hypot(s.guards[1]!.x-g.x,s.guards[1]!.y-g.y)>RADIO_RADIUS||mem(s,1).suspicious);
 far(s);advanceAI(s,l,1);const lostAt=s.ticks;assert.equal(g.brain!.alertUntil,lostAt+CHASE_MEMORY_TICKS);
 for(let t=0;t<CHASE_MEMORY_TICKS+2&&g.mode!=='search';t++)advanceAI(s,l,1);
 assert.equal(g.mode,'search');assert(s.ticks-lostAt<=CHASE_MEMORY_TICKS+2);assert.equal(g.brain!.searchUntil-s.ticks,SEARCH_TICKS);
});
test('footsteps close behind a guard turn it around after half a second; standing still is silent',()=>{
 const l=arena();l.patrols=[{...l.patrols[0]!,roam:undefined,route:[{x:6,y:6},{x:6,y:6.01}]}];const s=initialState(l.mission,l);const g=s.guards[0]!;g.angle=-Math.PI/2;
 s.x=6;s.y=7.2;s.px=6;s.py=7.2;s.vx=0;s.vy=0;advanceAI(s,l,40);assert(!g.seesPlayer&&!mem(s,0).suspicious,'quiet behind the guard');
 s.vx=2;for(let t=0;t<Math.ceil(HEAR_SECONDS*30)+1;t++)advanceAI(s,l,1);
 assert(mem(s,0).suspicious,'moving feet are heard');
});
test('a body in view for half a second is noticed, the finder goes to look and nearby guards hear about it',()=>{
 const l=arena(),s=initialState(l.mission,l);far(s);
 const victim=s.guards[1]!;victim.x=6;victim.y=8;victim.hp=0;
 const g=s.guards[0]!;g.angle=Math.PI/2;
 for(let t=0;t<Math.ceil(BODY_SECONDS*30)+2;t++)advanceAI(s,l,1);
 assert.equal(s.combat!.bodiesFound,1);assert(mem(s,0).suspicious);assert.deepEqual(g.lastSeen,{x:6,y:8});
 assert(mem(s,0).bodySeen!&2,'the same body is not reported twice');
 const before=s.combat!.bodiesFound;advanceAI(s,l,30);assert.equal(s.combat!.bodiesFound,before);
});
test('boss traits apply: toly spots faster and calls farther, vibhu has more health and blocks rear damage harder',()=>{
 const l=arena();l.patrols[0]={...l.patrols[0]!,combatRole:'warden',boss:'toly',hp:BOSS_TRAITS.toly!.hp};
 const s=initialState(l.mission,l);assert.equal(s.guards[0]!.hp,150);assert.equal(s.guards[0]!.maxHp,150);
 s.x=6;s.y=8.5;s.px=s.x;s.py=s.y;const pl={...l,patrols:[{...l.patrols[0]!,combatRole:'scout' as const,boss:undefined,hp:undefined},l.patrols[1]!,l.patrols[2]!]},plain=initialState(l.mission,pl);plain.x=6;plain.y=8.5;plain.px=6;plain.py=8.5;
 advanceAI(s,l,9);advanceAI(plain,pl,9);assert(s.guards[0]!.exposure>plain.guards[0]!.exposure,'toly fills exposure faster');
 assert.equal(BOSS_TRAITS.vibhu!.hp,200);assert.equal(BOSS_TRAITS.vibhu!.rearDamage,50);assert.equal(BOSS_TRAITS.mert!.radio,99);
});
test('revision 17 campaign levels stay deterministic across serialization and every authored level runs the new engine',()=>{
 for(const id of CAMPAIGN_IDS)assert.equal(combatLevel(id).combat?.revision,18,id);
 const l=combatLevel('false-footsteps'),a=initialState(l.mission,l);tick(a,17);const b:GameState=JSON.parse(JSON.stringify(a));
 for(let t=0;t<300;t++){const command=t===0?combatTap(a,l.phone.x,l.phone.y,1):undefined;step(a,{...idleInput(),command});step(b,{...idleInput(),command});}
 assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
});

test('a receiver behind cover keeps walking under sustained radio reports; the notice pause runs once',()=>{
 const l=arena();l.patrols=[l.patrols[0]!,{...l.patrols[1]!,route:[{x:9,y:9},{x:9,y:9.01}]}];
 // a wall hides the courier from the second guard but not from the first
 l.blockers.push({x:7.5,y:7.5,w:.3,h:3,kind:'wall'});
 const s=initialState(l.mission,l);s.x=6;s.y=8.5;s.px=s.x;s.py=s.y;const receiver=s.guards[1]!;
 advanceAI(s,l,24);assert(mem(s,0).hunting,'observer hunts');assert(mem(s,1).suspicious&&!mem(s,1).hunting,'receiver is suspicious');
 const pauseEnd=mem(s,1).noticeUntil!,at={x:receiver.x,y:receiver.y};
 // the receiver walks around the wall while reports keep arriving; once it sees the courier itself it hunts
 let t=0;for(;t<300&&!mem(s,1).hunting;t++){advanceAI(s,l,1);if(!mem(s,1).hunting)assert.equal(mem(s,1).noticeUntil,pauseEnd,'repeated reports never restart the pause');}
 assert(Math.hypot(receiver.x-at.x,receiver.y-at.y)>1,'the receiver moved toward the report');assert(t>30,'it walked for a while before any direct sighting');
});
test('watching two different bodies does not add their time together',()=>{
 const l=arena(),s=initialState(l.mission,l);far(s);const g=s.guards[0]!;g.angle=Math.PI/2;
 const a=s.guards[1]!,b=s.guards[2]!;a.hp=0;b.hp=0;a.x=6;a.y=8;b.x=20;b.y=20;
 advanceAI(s,l,8);assert.equal(s.combat!.bodiesFound??0,0);
 // swap: body a leaves the cone, body b takes its place
 a.x=20;a.y=20;b.x=6;b.y=8;advanceAI(s,l,8);assert.equal(s.combat!.bodiesFound??0,0,'eight ticks on each body is not half a second on one');
 advanceAI(s,l,8);assert.equal(s.combat!.bodiesFound,1);
});
test('a revision 16 definition that names a health value keeps the role table',async()=>{
 const {makeGuards}=await import('../src/game/guards');
 const l=arena(),old={...l,combat:{version:2 as const,revision:16 as const},patrols:[{...l.patrols[0]!,hp:999}]};
 assert.equal(makeGuards(old.mission,old)[0]!.hp,50);assert.equal(makeGuards(l.mission,{...l,patrols:[{...l.patrols[0]!,hp:999}]})[0]!.hp,999);
});

test('a receiver that cannot reach a report keeps one search going under repeated reports and returns to patrol',()=>{
 const l=arena();l.patrols=[l.patrols[0]!,{...l.patrols[1]!,route:[{x:9,y:9},{x:9,y:9.01}]}];
 // a full dividing wall: the receiver can never reach the courier's side
 l.blockers.push({x:7.5,y:.7,w:.3,h:18.6,kind:'wall'});
 const s=initialState(l.mission,l);s.x=6;s.y=8.5;s.px=s.x;s.py=s.y;const receiver=s.guards[1]!;
 advanceAI(s,l,24);assert(mem(s,0).hunting&&mem(s,1).suspicious);
 // the observer keeps reporting every 12 ticks; the receiver gets one pause, fails its path, searches once around the
 // spot, calms down, and only a later report starts a second episode
 let pauses=0,lastPause=mem(s,1).noticeUntil!,searches=0,lastSearch=-1,moved=0,at={x:receiver.x,y:receiver.y};
 for(let t=0;t<420;t++){advanceAI(s,l,1);const pause=mem(s,1).noticeUntil!;if(pause!==lastPause){lastPause=pause;pauses++;}if(receiver.mode==='search'&&receiver.brain!.searchUntil!==lastSearch){lastSearch=receiver.brain!.searchUntil;searches++;}moved+=Math.hypot(receiver.x-at.x,receiver.y-at.y);at={x:receiver.x,y:receiver.y};}
 // 420 ticks hold about two full episodes (pause, failed path, 150-tick search) against some 35 reports
 assert(pauses<=2,`the pause restarted ${pauses} times in two episodes`);assert(searches<=3,`search restarted ${searches} times`);assert(moved>1,'the receiver was never frozen in place');
});
