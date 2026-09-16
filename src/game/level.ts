export type Box = { x: number; y: number; w: number; h: number; kind: 'wall' | 'crate' | 'rack' };
export type MissionId = 'practice' | 'cone-lesson' | 'battery-dash' | 'crossing-signals' | 'sweep-window' | 'narrow-crossing' | 'false-footsteps' | 'warden-gate' | 'power-trade' | 'two-targets' | 'silent-circuit' | 'last-vault' | 'night-shift';
export type Point = {x:number;y:number};
export type GuardSpec = {combatRole?:import('./combat-levels').EnemyRole;reserveAfter?:number;route:Point[];speed:number;range:number;halfAngle:number;spotSeconds:number;pauseSeconds:number;kind?:'scanner'|'warden';investigates?:boolean;hearing?:number;activePower?:0|1;alertAfterDelivery?:boolean;sweep?:{angle:number;amplitude:number;period:number}};
export type GateSpec={box:Box;period:number;openSeconds:number;phase:number;mode?:'power'|'relay';power?:0|1;relay?:number};
export type SwitchSpec=Point & {kind:'power'|'relay';channel?:number;duration?:number};
export type LevelDefinition = {combat?:{version:2;revision?:3|4};id:string;mission:MissionId;title:string;number:number;briefing:string;width:number;height:number;spawn:Point;phone:Point;exit:Point & {w:number;h:number};targetSeconds:number;hardLimitSeconds:number;blockers:Box[];patrols:GuardSpec[];floorColor:string;gates?:GateSpec[];decoys?:number;switches?:SwitchSpec[];targets?:Point[];exitWindow?:{period:number;openSeconds:number;phase:number}};
export const PATROLS = [
  [{x:3.7,y:10.5},{x:6.6,y:10.5},{x:6.6,y:7.6},{x:4.3,y:7.6},{x:4.3,y:10.5}],
  [{x:7.3,y:4.2},{x:10.5,y:4.2},{x:10.5,y:7.1},{x:7.3,y:7.1}],
];
export const SECURITY={alarmBaseSpeed:2.2,alarmMaxSpeed:2.8,alarmRampSeconds:20,reportSeconds:4,chaseRepathSeconds:.45,decoySeconds:6,decoyHearing:9,decoyRange:4.4};
export function alarmSpeed(seconds:number){'worklet';return seconds<0?1:SECURITY.alarmBaseSpeed+(SECURITY.alarmMaxSpeed-SECURITY.alarmBaseSpeed)*Math.min(1,seconds/SECURITY.alarmRampSeconds);}
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
 practice:{...original,mission:'practice',title:'Quiet Pickup',number:1,briefing:'Find the phone, stop and hold TAKE. Carry it to the mint exit. One guard watches the pickup lane. Taking the phone raises the alarm. Use a decoy, then dash to the exit.',patrols:[{...patrol([{x:7,y:7.5},{x:10.5,y:7.5}],.75,2.8),spotSeconds:1.1}],floorColor:'#263938'},
 'cone-lesson':{
  id:'cone-lesson-v1',mission:'cone-lesson',title:'Cone Lesson',number:2,width:12,height:20,
  spawn:{x:2,y:17.6},phone:{x:9.3,y:4.1},exit:{x:1.2,y:1.2,w:2.5,h:1.8},targetSeconds:90,hardLimitSeconds:180,
  briefing:'Two robots cover the central rack and the lower lane. Its amber cone stops at cover. Wait for it to turn, then cross the open lane.',floorColor:'#2d3c42',
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
 'sweep-window':{
  id:'sweep-window-v1',mission:'sweep-window',title:'Sweep Window',number:5,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.4,y:2.5},exit:{x:1.2,y:1.15,w:2.5,h:1.8},targetSeconds:150,hardLimitSeconds:300,
  briefing:'The tower scanner sweeps across the roof. Wait behind a shelter, then move while its beam turns away. The beam cannot see through cover.',floorColor:'#26394b',
  blockers:[...boundary,crate(1.5,13.4,2.1,1.5),crate(5.2,14.8,2.2,1.6),rack(4.6,9.1,1.5,2.5),crate(8.6,10.8,1.9,1.5),crate(7.8,5.9,2.6,1.5),rack(3.5,3.8,1.5,2.5)],
  patrols:[{...patrol([{x:6.6,y:6.4},{x:6.6,y:6.4}],0,7.5),kind:'scanner',halfAngle:Math.PI/13,spotSeconds:1.1,sweep:{angle:Math.PI/2,amplitude:1.25,period:8}}]
 },
 'narrow-crossing':{
  id:'narrow-crossing-v1',mission:'narrow-crossing',title:'Narrow Crossing',number:6,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.4,y:2.5},exit:{x:8.2,y:16.8,w:2.5,h:1.8},targetSeconds:180,hardLimitSeconds:360,
  briefing:'Two gates alternate across the middle of the roof. Mint means open; amber means wait. The gates wait for you to clear the doorway before closing.',floorColor:'#263b40',
  blockers:[...boundary,rack(.7,9.4,1.1,1.2),rack(4,9.4,4,1.2),rack(10.2,9.4,1.1,1.2),crate(4.5,13.8,2.8,2),crate(4.4,5,2.4,2.3),crate(1.3,4.4,1.6,2.2)],
  gates:[{box:{x:1.8,y:9.4,w:2.2,h:1.2,kind:'wall'},period:8,openSeconds:3.8,phase:0},{box:{x:8,y:9.4,w:2.2,h:1.2,kind:'wall'},period:8,openSeconds:3.8,phase:4}],
  patrols:[patrol([{x:7.4,y:7.5},{x:10.6,y:7.5},{x:10.6,y:4},{x:7.4,y:4}],.85,3)]
 },
 'false-footsteps':{
  id:'false-footsteps-v1',mission:'false-footsteps',title:'False Footsteps',number:7,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.5,y:3},exit:{x:1.2,y:1.1,w:2.5,h:1.8},targetSeconds:180,hardLimitSeconds:360,decoys:2,
  briefing:'Throw a decoy in the direction you face. Nearby robots investigate the sound, search there, then return. Use the opening or take the long route behind cover.',floorColor:'#283c48',
  blockers:[...boundary,rack(4.3,12.8,2,3.7),crate(7.8,13.4,2.5,1.6),rack(4.3,7.2,2,3.4),crate(8.1,6.1,2.2,1.7),crate(1.4,5.4,2,2.3),rack(4.3,2.8,1.7,2.5)],
  patrols:[{...patrol([{x:7.2,y:12},{x:10.6,y:12},{x:10.6,y:9},{x:7.2,y:9}],1.1,4),investigates:true,hearing:6.5}]
 },
 'warden-gate':{
  id:'warden-gate-v1',mission:'warden-gate',title:'Warden Gate',number:8,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.3,y:4.4},exit:{x:1.2,y:1.1,w:2.5,h:1.8},targetSeconds:210,hardLimitSeconds:420,decoys:2,
  briefing:'The Warden is slow, with a longer view. Lure it away from the exit. A dash also makes noise, so save it for the escape.',floorColor:'#343944',
  blockers:[...boundary,crate(1.4,12.9,2.2,2),rack(5.1,12.6,1.7,3.5),crate(8.3,10.1,2.1,2),rack(4.7,6.2,1.8,3),crate(7.7,6.2,2.7,1.5),rack(4.8,2,1.4,1.9)],
  patrols:[{...patrol([{x:3.8,y:4.5},{x:7,y:4.5},{x:7,y:1.2},{x:3.8,y:1.2}],.65,4.7),kind:'warden',spotSeconds:1.1,investigates:true,hearing:8}]
 },
 'power-trade':{
  id:'power-trade-v1',mission:'power-trade',title:'Power Trade',number:9,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.3,y:2.4},exit:{x:1.2,y:16.8,w:2.5,h:1.8},targetSeconds:180,hardLimitSeconds:360,
  briefing:'Power A opens the west door. Power B opens the east door and turns on its scanner. Stop on a switch and press ACT to change circuits. There is a switch on each side.',floorColor:'#333d40',
  blockers:[...boundary,rack(.7,9.4,1.1,1.2),rack(4.2,9.4,3.8,1.2),rack(10.2,9.4,1.1,1.2),crate(4.8,14.6,2.4,1.6),rack(4.5,3.8,1.5,3.8),crate(8.2,4.8,2.1,1.5),crate(1.3,6.4,1.7,1.6)],
  gates:[{box:{x:1.8,y:9.4,w:2.4,h:1.2,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'power',power:0},{box:{x:8,y:9.4,w:2.2,h:1.2,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'power',power:1}],
  switches:[{x:8.8,y:12.3,kind:'power'},{x:8.8,y:7.5,kind:'power'}],
  patrols:[{...patrol([{x:6.9,y:5.6},{x:6.9,y:5.6}],0,6.8),kind:'scanner',activePower:1,halfAngle:Math.PI/14,spotSeconds:1.1,sweep:{angle:0,amplitude:1.3,period:8}}]
 },
 'two-targets':{
  id:'two-targets-v1',mission:'two-targets',title:'Two Targets',number:10,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:2.2,y:2.5},targets:[{x:2.2,y:2.5},{x:9.5,y:3}],exit:{x:7.2,y:16.8,w:2.5,h:1.8},targetSeconds:240,hardLimitSeconds:480,decoys:2,
  briefing:'Recover two phones, one at a time. Deliver the first before collecting the second. The alarm starts on the first pickup and stays on between deliveries. Each phone has its own charge.',floorColor:'#30374a',
  blockers:[...boundary,rack(4.7,9.2,2,4.1),crate(1.4,12.1,1.8,2),crate(8.5,11.8,1.9,2),rack(4.5,2.3,1.6,2.5),crate(1.5,6.5,1.8,1.7),crate(8.6,6.8,1.8,1.7)],
  patrols:[{...patrol([{x:3.8,y:7.8},{x:7.9,y:7.8},{x:7.9,y:5.6},{x:3.8,y:5.6}],.95,3.6),investigates:true,alertAfterDelivery:true}]
 },
 'silent-circuit':{
  id:'silent-circuit-v1',mission:'silent-circuit',title:'Silent Circuit',number:11,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.3,y:2.3},exit:{x:1.2,y:16.8,w:2.5,h:1.8},targetSeconds:210,hardLimitSeconds:420,decoys:2,
  briefing:'Relay pads open their nearby door for nine seconds. Use the pads on both sides for the return trip. A clean run is optional: use a decoy if the investigating patrol blocks your crossing.',floorColor:'#293e43',
  blockers:[...boundary,rack(.7,11.8,1.8,1.1),rack(4.8,11.8,6.5,1.1),rack(.7,6.6,6.8,1.1),rack(9.8,6.6,1.5,1.1),crate(4.8,8.3,1.5,1.5),crate(4.9,2.9,1.7,2),crate(6.4,15.2,2.3,1.6)],
  gates:[{box:{x:2.5,y:11.8,w:2.3,h:1.1,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'relay',relay:0},{box:{x:7.5,y:6.6,w:2.3,h:1.1,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'relay',relay:1}],
  switches:[{x:3.6,y:14,kind:'relay',channel:0,duration:9},{x:3.6,y:10.1,kind:'relay',channel:0,duration:9},{x:8.6,y:8.5,kind:'relay',channel:1,duration:9},{x:8.6,y:4.9,kind:'relay',channel:1,duration:9}],
  patrols:[{...patrol([{x:6.9,y:10.5},{x:10.6,y:10.5},{x:10.6,y:8.5},{x:6.9,y:8.5}],.85,3),investigates:true}]
 },
 'last-vault':{
  id:'last-vault-v1',mission:'last-vault',title:'The Last Vault',number:12,width:12,height:20,
  spawn:{x:2,y:17.5},phone:{x:9.5,y:2.2},targets:[{x:9.5,y:2.2},{x:2.6,y:2.5}],exit:{x:8.2,y:16.8,w:2.5,h:1.8},targetSeconds:240,hardLimitSeconds:480,decoys:2,
  briefing:'Two deliveries finish the job. Switch circuits to choose a crossing, watch the scanner, then use the relay to open the inner vault. The Warden hears decoys and dashes.',floorColor:'#363a40',
  blockers:[...boundary,rack(.7,11,1.1,1.1),rack(4.2,11,3.8,1.1),rack(10.2,11,1.1,1.1),rack(5.5,.7,.8,6.5),rack(.7,5.8,1.1,1.1),rack(4.2,5.8,1.3,1.1),crate(7.7,6.8,2.7,1.4),crate(8.5,3.9,1.8,1.5),crate(1.3,15,1.6,1.5),crate(3.1,15,.8,3),crate(9.2,13.6,1.2,1.3)],
  gates:[{box:{x:1.8,y:11,w:2.4,h:1.1,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'power',power:0},{box:{x:8,y:11,w:2.2,h:1.1,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'power',power:1},{box:{x:1.8,y:5.8,w:2.4,h:1.1,kind:'wall'},period:1,openSeconds:0,phase:0,mode:'relay',relay:0}],
  switches:[{x:8.3,y:14,kind:'power'},{x:8.9,y:9.5,kind:'power'},{x:3,y:8.3,kind:'relay',channel:0,duration:9},{x:3,y:4.5,kind:'relay',channel:0,duration:9}],
  patrols:[{...patrol([{x:7,y:5.6},{x:7,y:5.6}],0,6),kind:'scanner',activePower:1,halfAngle:Math.PI/14,spotSeconds:1.2,sweep:{angle:0,amplitude:1.4,period:9}},{...patrol([{x:4.5,y:14},{x:7.2,y:14},{x:7.2,y:18},{x:4.5,y:18}],.65,3.8),kind:'warden',investigates:true,hearing:7,alertAfterDelivery:true}]
 },
 'night-shift':{...original,id:'legacy-night-shift-v1',mission:'night-shift',title:'Night Shift',number:0,briefing:'Original two-patrol test room. This is a separate practice room, outside campaign progression.',patrols:PATROLS.map(route=>patrol(route)),floorColor:'#263938'},
};
export const CAMPAIGN_IDS:MissionId[]=['practice','cone-lesson','battery-dash','crossing-signals','sweep-window','narrow-crossing','false-footsteps','warden-gate','power-trade','two-targets','silent-circuit','last-vault'];
// Authored reinforcements keep clear of the initial spawn and existing cover.
// The lower sweep pressures the return trip; upper sweeps protect later objectives.
for(const id of CAMPAIGN_IDS){
 const l=LEVELS[id];l.id=l.id+'-security-v3';
 l.decoys=l.number===12?6:l.number>=8?3:2;
 for(const guard of l.patrols){if(guard.kind!=='scanner'){guard.investigates=true;guard.hearing=SECURITY.decoyHearing;}guard.alertAfterDelivery=false;}
 if(l.number>=2)l.patrols.push({...patrol(l.number<=5?[{x:10.85,y:3},{x:10.85,y:17.5}]:[{x:2,y:18.6},{x:10.6,y:18.6}],.95,3.2),spotSeconds:1,investigates:true,hearing:SECURITY.decoyHearing});
 if(l.number>=6)l.patrols.push({...patrol(l.mission==='last-vault'?[{x:7,y:1.25},{x:10.6,y:1.25}]:[{x:1.2,y:1.25},{x:10.6,y:1.25}],.85,3),spotSeconds:1,investigates:true,hearing:SECURITY.decoyHearing});
 l.briefing+=' Alarm: guards move 120% faster after pickup, rising to 180% faster after 20 seconds. The stolen phone broadcasts your location every four seconds; guards pursue sightings and search the last reported position. Decoys beep for six seconds; mobile guards within nine tiles investigate.';
}
export const MISSIONS=CAMPAIGN_IDS.map(id=>({id,title:LEVELS[id].title,label:`${String(LEVELS[id].number).padStart(2,'0')} · ${LEVELS[id].title}`}));
// Retained for original regression fixtures. Gameplay resolves its own mission.
export const LEVEL=LEVELS.practice;
export function getLevel(id:MissionId):LevelDefinition{'worklet';return LEVELS[id];}
