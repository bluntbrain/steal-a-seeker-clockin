export type Box = { x: number; y: number; w: number; h: number; kind: 'wall' | 'crate' | 'rack' };
export type MissionId = 'practice' | 'cone-lesson' | 'battery-dash' | 'crossing-signals' | 'night-shift';
export type Point = {x:number;y:number};
export type GuardSpec = {route:Point[];speed:number;range:number;halfAngle:number;spotSeconds:number;pauseSeconds:number};
export type LevelDefinition = {id:string;mission:MissionId;title:string;number:number;briefing:string;width:number;height:number;spawn:Point;phone:Point;exit:Point & {w:number;h:number};targetSeconds:number;hardLimitSeconds:number;blockers:Box[];patrols:GuardSpec[];floorColor:string};
export const PATROLS = [
  [{x:3.7,y:10.5},{x:6.6,y:10.5},{x:6.6,y:7.6},{x:4.3,y:7.6},{x:4.3,y:10.5}],
  [{x:7.3,y:4.2},{x:10.5,y:4.2},{x:10.5,y:7.1},{x:7.3,y:7.1}],
];
export const GUARD_TUNING = { speed: 1.05, range: 3.7, halfAngle: Math.PI / 5, spotSeconds: .8, forgetSeconds: .55, pauseSeconds: .7 };
// World units are tiles. Art, collision and test routes share this single definition.
const original = {
  id: 'quiet-pickup-v1', width: 12, height: 20,
  spawn: { x: 2.2, y: 17.6 }, phone: { x: 8.9, y: 5.8 },
  exit: { x: 8.3, y: 1.25, w: 2.3, h: 1.6 }, targetSeconds: 60, hardLimitSeconds: 120,
  blockers: [
    { x: 0, y: 0, w: 12, h: .7, kind: 'wall' },
    { x: 0, y: 19.3, w: 12, h: .7, kind: 'wall' },
    { x: 0, y: 0, w: .7, h: 20, kind: 'wall' },
    { x: 11.3, y: 0, w: .7, h: 20, kind: 'wall' },
    { x: 1.3, y: 2.2, w: 2.4, h: 2.0, kind: 'rack' },
    { x: 4.8, y: 3.7, w: 1.5, h: 3.3, kind: 'rack' },
    { x: 1.5, y: 7.2, w: 2.4, h: 2, kind: 'crate' },
    { x: 7.1, y: 8.4, w: 2.6, h: 1.8, kind: 'crate' },
    { x: 4.5, y: 11.0, w: 1.5, h: 3.0, kind: 'rack' },
    { x: 8.2, y: 13.1, w: 2.1, h: 2.3, kind: 'crate' },
    { x: 1.3, y: 12.6, w: 1.7, h: 2.0, kind: 'crate' },
    { x: 5.0, y: 16.2, w: 2.4, h: 1.5, kind: 'crate' },
  ] as Box[],
};
export const TUNING = {
  step: 1 / 30, radius: .26, walkSpeed: 3.2, carrySpeed: 2.6,
  acceleration: 30, friction: 38, dashSpeed: 8, dashDuration: .2,
  dashCooldown: 2, dashCost: 20, pickupRadius: 1.15, pickupHold: .4, extractHold: 1,
};

const boundary = original.blockers.filter(b=>b.kind==='wall');
const crate=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h,kind:'crate'});
const rack=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h,kind:'rack'});
const patrol=(route:Point[],speed=1.05,range=3.7):GuardSpec=>({route,speed,range,halfAngle:Math.PI/5,spotSeconds:.8,pauseSeconds:.7});
export const LEVELS:Record<MissionId,LevelDefinition> = {
 practice:{...original,mission:'practice',title:'Quiet Pickup',number:1,briefing:'Find the phone, stop and hold TAKE. Carry it to the mint exit. No guards in this first room.',patrols:[],floorColor:'#263938'},
 'cone-lesson':{
  id:'cone-lesson-v1',mission:'cone-lesson',title:'Cone Lesson',number:2,width:12,height:20,
  spawn:{x:2,y:17.6},phone:{x:9.3,y:4.1},exit:{x:1.2,y:1.2,w:2.5,h:1.8},targetSeconds:90,hardLimitSeconds:180,
  briefing:'One robot circles the central rack. Its amber cone stops at cover. Wait for it to turn, then cross the open lane.',floorColor:'#2d3c42',
  blockers:[...boundary,rack(4.5,7.8,2.8,4.4),crate(1.6,12.5,1.8,2),crate(8.4,13.7,2,2.3),crate(8.3,6.6,2.1,1.3),rack(4.8,2.7,1.6,2.7)],
  patrols:[patrol([{x:3.7,y:12.9},{x:7.9,y:12.9},{x:7.9,y:8.5},{x:7.9,y:6},{x:3.7,y:6}],.95,3.4)]
 },
 'battery-dash':{
  id:'battery-dash-v1',mission:'battery-dash',title:'Battery Dash',number:3,width:12,height:20,
  spawn:{x:2,y:17.7},phone:{x:9.4,y:3.1},exit:{x:8.1,y:16.8,w:2.5,h:1.8},targetSeconds:120,hardLimitSeconds:240,
  briefing:'Bring the phone back down the east lane. Dash across the exposed stretch, or take the longer route behind the racks. Empty charge still lets you walk.',floorColor:'#344039',
  blockers:[...boundary,rack(4.5,3,1.8,3.8),rack(4.5,8.7,1.8,4),rack(4.5,14.7,1.8,2.9),crate(1.3,7.3,1.8,2.2),crate(1.3,12,1.8,2.2),crate(8.6,5.6,1.8,1.8),crate(8.6,12.6,1.8,1.8)],
  patrols:[patrol([{x:7.3,y:8.4},{x:10.6,y:8.4},{x:10.6,y:11.4},{x:7.3,y:11.4}],1.15,3.8)]
 },
 'crossing-signals':{
  id:'crossing-signals-v1',mission:'crossing-signals',title:'Crossing Signals',number:4,width:12,height:20,
  spawn:{x:2,y:17.7},phone:{x:9.5,y:3},exit:{x:1.25,y:1.1,w:2.4,h:1.8},targetSeconds:150,hardLimitSeconds:300,
  briefing:'Two patrols cover different crossings. The central crates make a waiting pocket. Cross one lane at a time; rushing both is harder.',floorColor:'#29384c',
  blockers:[...boundary,crate(1.6,13.9,2.3,1.5),crate(8.1,14.1,2.3,1.4),rack(4.8,10.2,2.4,2.7),crate(4.8,6.4,2.4,1.8),rack(1.5,4.6,1.6,3.2),rack(8.7,5.5,1.6,2.4)],
  patrols:[patrol([{x:1.1,y:13.4},{x:10.9,y:13.4},{x:10.9,y:16.1},{x:1.1,y:16.1}],1.1,3.3),patrol([{x:3.8,y:4},{x:10.5,y:4},{x:10.5,y:2},{x:3.8,y:2}],1,3.3)]
 },
 'night-shift':{...original,id:'legacy-night-shift-v1',mission:'night-shift',title:'Night Shift',number:0,briefing:'Original two-patrol test room. This is a separate practice room, outside campaign progression.',patrols:PATROLS.map(route=>patrol(route)),floorColor:'#263938'},
};
export const CAMPAIGN_IDS:MissionId[]=['practice','cone-lesson','battery-dash','crossing-signals'];
export const MISSIONS=CAMPAIGN_IDS.map(id=>({id,title:LEVELS[id].title,label:`${String(LEVELS[id].number).padStart(2,'0')} · ${LEVELS[id].title}`}));
// Retained for original regression fixtures. Gameplay resolves its own mission.
export const LEVEL=LEVELS.practice;
export function getLevel(id:MissionId):LevelDefinition{'worklet';return LEVELS[id];}
