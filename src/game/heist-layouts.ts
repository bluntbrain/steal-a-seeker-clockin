import type {Box,GuardSpec,LevelDefinition,Point} from './level';
import type {EnemyRole} from './combat-levels';
import {guardPressure} from './guard-pressure';

type XY=readonly [number,number];
type Rect=readonly [number,number,number,number];
type Cast=readonly [EnemyRole,...XY[]];
type Layout={spawn:XY;phone:XY;exit:XY;walls:Rect[];crates?:Rect[];lasers?:Rect[];cast:Cast[];safe:XY[];back:XY[];pockets:XY[];entries?:XY[];grates?:Rect[];second?:XY;tip:string};
const point=([x,y]:XY):Point=>{'worklet';return {x,y};};
const box=([x,y,w,h]:Rect):Box=>{'worklet';return {x,y,w,h,kind:'wall'};};

// Each map has authored observation pockets, a covered approach and watched
// shortcuts. These are distinct encounters rather than repeated wall mazes.
const LAYOUTS:Layout[]=[
 // Mission 2: left service lane, staggered cover and two right-hand rooms.
 // Doorways stay open floor; the reference's light strips are not closed gates.
 {spawn:[2.35,18.55],phone:[2.6,1.8],exit:[2.35,18.55],
  walls:[
   [4,.65,.65,3.4],[.65,3.4,1.25,.65],[3.25,3.4,1.4,.65],
   [5.3,6,5.35,.65],[5.3,6,.65,3.1],[5.3,10.25,.65,1.35],
   [5.3,10.95,3.5,.65],[10,6,.65,3.1],[10,10.25,.65,1.35],
   [5.3,13.3,5.35,.65],[5.3,15.15,.65,2.6],[5.3,17.1,5.35,.65],[10,13.3,.65,2.65]
  ],
  crates:[
   [6.2,1.2,2.5,.85],[6.2,2.15,.95,.95],[8.25,2.15,.95,.95],[7.35,3.2,1.85,.85],
   [1.0,4.95,1.45,1.1],[2.7,6.5,.95,.95],[2.7,8.35,.95,.95],[2.7,10.2,.95,.95],
   [.7,7.1,.85,1.8],[.7,10.4,.85,1.35],
   [6.15,6.95,.85,1.5],[8.85,8.1,.75,1.1],[6.15,10,.85,.75],
   [2.7,12.15,.95,.95],[5.3,12,.95,.95],[8.0,11.65,2.65,1.3],
   [2.7,14.25,.95,.95],[2.7,16.2,.95,.95],[.7,14,.85,2.2],
   [6.1,16,2.6,.85],[9,14.1,.8,.8],[4.2,18.15,2.6,.8]
  ],
  cast:[['scout',[4.35,10],[4.35,7.3],[4.35,5]],
   ['scout',[8.1,9.65],[8.1,7.5],[8.1,7.0]],
   ['drone',[5.35,3],[5.35,4.7],[8.5,4.7]]],
  safe:[[4.45,17.6],[4.45,14.55],[6.5,14.6],[8,15.25],[9.4,15.55],[10.95,16.5],[10.95,9.65],[8,9.65],[4.35,9.65],[4.35,5.9],[4.95,4.75],[3,4.5],[2.55,2.7]],
  back:[[3,4.5],[4.35,5.9],[4.35,11.95],[4.45,14.55],[4.45,17.6],[2.35,18.55]],
  pockets:[[7.8,15],[4.4,12.4],[2.1,17.65]],entries:[[10,4.7]],
  tip:'Use the staggered crates to break sight. The drone reports your position; flank it before crossing the upper yard. Recover the Seeker and return to the service entrance.'},
 // Mission 3: entry yard, twin laser doorways, hooked spine and upper vault.
 {spawn:[6.3,18.7],phone:[9.25,3.6],exit:[6.3,18.7],
  walls:[
   [.7,14.4,3.9,.65],[5.95,14.4,3.25,.65],[10.55,14.4,.75,.65],
   [7.1,10.3,.85,4.1],
   [1.4,1.1,3.25,.8],[3.85,1.1,.8,7.5],[3.85,7.8,4.25,.8],[7.3,7.8,.8,1.9],
   [.9,3.1,2.1,.65],[.9,4.9,2.1,1.55],[.9,7.1,2.1,.65],
   [.9,9.5,2.1,1.7],[.9,12.2,2.1,.7],
   [6,1.1,5.3,.8],[7.05,1.9,.9,.9],[7.05,3.9,.85,1.7],[7.05,4.95,4.25,.65]
  ],
  crates:[
   [1.5,1.95,2.15,.9],[6,3.9,.9,1.7],[10.15,2.05,.9,1.7],
   [4.9,6.65,2.1,.9],[9.25,5.85,1.8,2.5],[10.2,8.35,.85,1.0],
   [4,8.8,2.95,.8],[.7,6.55,1.05,.45],
   [1,11.35,1.85,.65],[3.15,10.65,.8,2.3],
   [6,11.45,.85,2.65],[8.15,10.35,.85,2.5],[10.25,12.1,.85,2.0],
   [1.5,16.15,1.95,1.55],[5,17,.85,1.05],[7.45,16.15,2.1,1.55],[10.35,15.35,.7,1.1]
  ],
  lasers:[[4.6,14.65,1.35,.14],[9.2,14.65,1.35,.14]],
  cast:[['scout',[4.85,12.7],[4.85,10.25],[5.6,10.25]],
   ['scout',[9.65,11.7],[9.65,9.7],[8.7,9.7]],
   ['scout',[3.4,6.6],[3.4,4.3],[1.5,4.3]],
   ['scout',[5.4,5.7],[5.4,2.5],[5.4,1.0]],
   ['drone',[9,3.35],[8.8,4.25],[8.4,3.35]]],
  safe:[[4.5,18.5],[4.9,15.7],[5.25,14.7],[5.1,12.2],[4.9,10.15],[8.65,10],[8.65,6.1],[5.35,6],[5.35,2.8],[8.7,3.35],[9.25,3.6]],
  back:[[8.7,3.35],[5.35,2.8],[5.35,6],[8.65,6.1],[8.65,9.7],[9.8,10],[9.8,14.7],[9.8,18],[6.3,18.7]],
  pockets:[[4.9,15.7],[1.2,8.6],[5.1,10.2]],entries:[[1.2,8.6]],
  tip:'Cross a laser and its alarm flashes for 1.5 seconds. Nearby guards investigate that crossing once. Move behind cover before they arrive; a real sighting starts a full chase.'},
 {spawn:[2,18],phone:[9.5,2.5],exit:[9.5,18],
  walls:[[3.4,12,3,2.4],[6.6,5.8,2.4,3.4],[2,8.2,2,1.3],[9.6,12,1.1,3],[1,3.7,3.2,1.2],[5.5,1.2,1,2.4]],
  cast:[['scout',[2.5,12.8],[2.5,11],[4,11]],['scout',[7.3,13.3],[7.3,11],[8.4,11]],['drone',[5.4,7.8],[5.4,5],[4.8,5]],['scout',[9.9,5],[9.9,3.8],[8,3.8]]],
  safe:[[1.3,11],[4.9,10.5],[5.3,5],[7.4,4.5]],back:[[5.3,4.6],[5.3,10.4],[7.8,10.6],[7.8,17]],pockets:[[2,16.2],[5.2,15.4]],entries:[[10.3,10.3]],
  tip:'Scout the return loop before the theft. Taking the phone calls a guard through the marked entrance.'},
 {spawn:[6,18],phone:[2,2.3],exit:[10,18],
  walls:[[3,12.5,2.5,2],[7.4,8.7,2.7,2],[2,5.1,2,2],[5.8,2.6,1.6,3],[7.4,14.5,2.7,1]],
  cast:[['scout',[6.5,13.5],[6.5,11.8],[4,11.7]],['scout',[2,11.5],[1.2,11.5],[1.2,9.5]],['drone',[6,10],[6,7.5],[7,7.5]],['drone',[4.8,4.5],[4.8,2],[3,2]],['scout',[9.5,6.6],[8.5,6.6],[8.5,4.8]]],
  safe:[[1.3,17],[1.3,10.5],[5.8,10.8],[5,7.7],[4.8,3]],back:[[4.8,3],[4.8,7.7],[6.4,8],[6.4,16.6],[10,16.6]],pockets:[[4.2,15.7],[8.8,11.8]],entries:[[10.4,4.8]],
  tip:'Move from shelter to shelter. Break the drone radio charge, then use the outer loop when the response arrives.'},
 {spawn:[2,18],phone:[6,3.5],exit:[10,18],
  walls:[[4.3,8,3.3,5],[1.3,13.8,2.1,1.2],[8.8,13.8,2,1.2],[1.2,5,2.1,2],[8.7,5,2.1,2],[5.2,15.5,1.6,1]],
  cast:[['scout',[3.4,11],[3.4,8],[3.4,7.6]],['scout',[8.5,11],[8.5,8],[8.5,7.7]],['heavy',[6,6.8],[6,7.5],[7.7,6.8]],['drone',[2,3.4],[4,3.4],[4,2]]],
  safe:[[3.8,16.2],[3.7,13.5],[3.7,7.6],[4,4.1],[4,2],[6,2]],back:[[8,4],[8,7.6],[8.1,13.2],[7.8,16.8]],pockets:[[6,14],[6,18]],
  tip:'The Heavy blocks frontal knife strikes. Circle the island and hit its mint rear weak point while it turns.'},
 {spawn:[6,18],phone:[6,2],exit:[2,18],
  walls:[[3,10.5,2.3,4],[7.4,6.7,2.3,4],[2.5,3.8,2,2],[7,2.8,3,1],[7.5,14,2,2],[1.1,8,1.6,1]],
  cast:[['scout',[2,12.5],[2,10],[1.3,10]],['sentry',[6.2,12.5],[6.2,9.3],[6,8]],['scout',[6.3,5.5],[6.3,4.2],[5.3,4.2]],['scout',[10.5,9],[10.5,6],[9,5.5]],['drone',[2.2,2],[4,2],[4.8,2.5]]],
  safe:[[1.5,16.5],[1.5,10],[3,9.6],[3.1,7],[1.4,6.8],[1.4,2]],back:[[5.5,4],[5.8,7],[6.2,15.5],[2,16]],pockets:[[4,16],[8.5,12]],entries:[[10.5,17.7]],
  tip:'Choose the fast middle lane or covered outer route. A confirmed sighting sends every guard and drone after you.'},
 {spawn:[6,18],phone:[2,3],second:[10,3],exit:[6,18],
  walls:[[4.5,11,3,3.5],[4.5,4.8,3,3.2],[1.2,8.5,2.5,1],[8.5,8.5,2.5,1],[1.5,14.5,1.5,1],[8.6,15.3,1.7,1]],
  cast:[['scout',[3.5,12.5],[3.5,10.2],[2,10.2]],['scout',[8.5,12.5],[8.5,10.2],[9.8,10.2]],['sentry',[3.5,6],[3.5,4],[2,4]],['scout',[8.5,6],[8.5,4],[10,4]],['drone',[6,3],[6,2],[7.8,2]]],
  safe:[[3.6,16],[3.6,10],[4,9.8],[4,4],[4,2],[2,2],[2,3]],back:[[4,4],[4,9.9],[3.6,15.5],[6,16]],pockets:[[6,15.8],[6,9.5]],entries:[[10.4,17.7]],
  tip:'Recover both phones. Use the middle pocket to regroup; the first theft brings a response for the next trip.'},
 {spawn:[2,18],phone:[9.9,3],exit:[10,18],
  walls:[[4.2,10,2.5,4],[3.5,4.5,3.2,2.4],[8.3,.65,.8,6.8],[1.1,8,2,1],[8.5,11.5,2.5,1.2],[2.5,14.8,1.5,1]],
  cast:[['scout',[3.3,11.5],[3.3,10],[2,10]],['scout',[7.6,11],[7.6,9],[8.5,9]],['sentry',[7.5,5.2],[7.5,7.8],[6.2,8]],['scout',[10,5],[10,3.8],[10.6,3.8]]],
  safe:[[1.4,13.5],[3.4,9.7],[3.2,7],[7.3,7.9],[10,8]],back:[[10,8],[7.4,9.5],[7.4,13.7],[7.7,16.6]],pockets:[[5.4,15.5],[5.4,8.1]],grates:[[7.1,10,1.2,1.1]],
  tip:'Follow the cable to open the vault. The striped metal grate makes noise; take the quiet loop to avoid a search.'},
 {spawn:[2,18],phone:[9.4,4],exit:[9.9,17.8],
  walls:[[4,10.5,3.2,3.8],[4,4,2.5,3],[8.5,13.5,1.8,1.8],[1.2,7.7,1.7,1.3],[7.8,1.5,1.2,1.1]],
  cast:[['scout',[3.1,12],[3.1,10],[2,10]],['sentry',[8,12],[8,10],[9.8,10]],['scout',[3.2,5.8],[3.2,3],[5.5,3]],['sentry',[7.6,6.5],[7.6,4],[9,3]],['drone',[10.4,7],[10.4,9],[9,9]]],
  safe:[[1.3,14.8],[3.2,9.7],[3.2,3.1],[7.1,3.1]],back:[[7.5,7.8],[7.6,12.7],[7.7,16.3],[10,16.3]],pockets:[[5.6,15.5],[9.2,16.3]],entries:[[1.5,3]],grates:[[7.5,8.1,1.3,1.1]],
  tip:'Reach the shelter beside extraction, then cross when its mint lights open. The pickup response will pursue you.'},
 {spawn:[10,18],phone:[2,3],exit:[2,18],
  walls:[[6.2,12,3,2.6],[2.8,7.4,3,3],[6.2,2.8,3,3.5],[1,12.5,2,1],[9.5,8.5,1.6,1],[3.5,15.8,2,1]],
  cast:[['scout',[5.2,12.8],[5.2,11.3],[3.8,11.3]],['scout',[10.2,12.8],[10.2,11],[9,10.5]],['sentry',[7.2,8],[7.2,10.2],[8.8,10.2]],['scout',[2,6],[2,4.7],[1.3,4.7]],['drone',[4,3.3],[4,5.5],[5,5.5]],['sentry',[10.3,4],[10.3,2],[9.6,2]]],
  safe:[[5.8,17.5],[3,15],[3.8,11.4],[6.5,11.1],[6.6,7],[5.2,6.5],[5,3]],back:[[2,5.7],[1.6,10.8],[3.6,11.6],[3.6,14.6],[2,16]],pockets:[[7.4,16],[4.3,12.3]],entries:[[10.5,2]],grates:[[6.4,8.8,1.2,1.2]],
  tip:'Break contact between rooms. Every guard and drone joins a confirmed chase. They search your last sighting when you break contact.'},
 {spawn:[6,18],phone:[6,2.4],exit:[10,18],
  walls:[[4.3,9.5,3.3,4],[4.2,4.8,3.6,2.8],[1.2,13.5,1.8,1.2],[8.8,14.5,2.1,1.2],[1.1,5.4,1.8,2.2],[9.1,6.5,1.8,2],[5.3,15.4,1.4,1.1]],
  cast:[['scout',[3.4,11],[3.4,8.4],[2.5,8.4]],['sentry',[8.5,11],[8.5,13.5],[7.9,14]],['warden',[6,8.4],[8.3,8.4],[8.3,4.1],[6,3.7]],['scout',[8.7,3],[8.7,2],[7.4,2]],['drone',[3.3,4],[3.3,2],[4.7,2]]],
  safe:[[3.6,16.5],[3.5,13],[3.5,8],[3.5,4],[3.5,1.2],[6,1.2],[6,2.4]],back:[[8.4,3.9],[8.4,8.9],[8.2,13.8],[7.9,16.5],[10,17]],pockets:[[6,14.4],[6,18]],entries:[[2,2.2],[10.5,17.7]],grates:[[8,11.5,.8,1.3]],
  tip:'Flank the Warden, interrupt the drone and plan your escape. Taking the last Seeker calls both marked entrances.'},
];

function applyPressure(l:LevelDefinition):LevelDefinition{
 'worklet';l.combat={version:2,revision:15};const p=guardPressure(l);
 for(const g of l.patrols){
  const heavy=g.combatRole==='heavy'||g.combatRole==='warden',drone=g.combatRole==='drone';
  g.pursuitSpeed=p.pursuit+(drone?.3:heavy?-.45:0);
  // Authored campaign values drive both the visible cone and actual sight.
  // Frozen weekly definitions keep their own published range and angle.
  g.range=p.vision*(drone?1:heavy?.6:.8);
  g.halfAngle=drone?Math.PI/3:(heavy?75:95)*Math.PI/360;
  g.spotSeconds=p.spot;g.pauseSeconds=.2;
  g.speed=heavy?.75:drone?1.15:.9;
 }
 return l;
}
export function applyHeistLayout(l:LevelDefinition):LevelDefinition{
 'worklet';
 if(l.number<=1){
  // Reconstruct the connected spine / alternating branches visible in the
  // supplied warehouse screenshots. Keep both outer lanes connected.
  const walls:Rect[]=[
   [1.65,2,2.2,3.8],[7.1,2,.85,3.8],[7.1,5,2.3,.8],
   [1.65,8.1,8.7,.8],[1.65,8.1,.85,1.65],
   [5.65,8.1,.9,10.3],
   [1.65,11.3,8.7,.8],[9.5,10,.85,2.1],
   [1.65,14.5,8.7,.8],[1.65,13,.85,2.3],
   [1.65,17.7,8.7,.8],[9.5,16.4,.85,2.1]
  ];
  const crates:Rect[]=[
   [4,3,1.1,1.8],[8.05,3.7,1.25,1.15],[.72,3.1,.75,1.55],
   [2.1,7.05,1.45,.95],[6.65,7.05,1.75,.95],
   [3.25,9,1.15,.95],[6.65,10.05,1.15,1.15],
   [3.4,13.3,1.55,1.1],[6.7,12.2,1.15,1.95],
   [3.5,15.4,1.4,2.15],[6.7,16.45,1.15,1.15]
  ];
  l.spawn={x:3.1,y:6.6};l.phone={x:2.75,y:16.4};l.exit={x:10.05,y:17.9,w:1.15,h:1.15};
  l.blockers=[...l.blockers.slice(0,4),...walls.map(box),...crates.map(v=>({...box(v),kind:'crate' as const}))];
  l.gates=undefined;l.switches=undefined;l.targets=undefined;l.exitWindow=undefined;
  const cast:Cast[]=[
   ['drone',[5.7,2.2],[5.7,1.8]],
   ['scout',[10.55,5.7],[10.55,3],[10,1.4]],
   ['scout',[2.95,10.45],[4.8,10.45]],
   ['scout',[8.6,9.75],[8.6,10.5]],
   ['scout',[2.8,12.85],[4.8,12.85]],
   ['scout',[8.6,15.95],[10.7,15.95]],
   ['scout',[10.75,9.7],[10.75,12.8]]
  ];
  l.patrols=cast.map(([role,...anchors],index)=>({combatRole:role,route:anchors.map(point),
   ...(role==='drone'?{kind:'scanner' as const}:{}),speed:.7,range:3.5,halfAngle:Math.PI/3.6,
   spotSeconds:.3,pauseSeconds:.6,investigates:true,...(index===6?{reserveAfter:0,pickupWave:1}:{})}));
  l.encounter={islands:walls.slice(0,3).map(box),grates:[],pockets:[{x:5.7,y:6.7},{x:1.15,y:16.4}],
   junctions:[{x:1.15,y:6.5},{x:10.75,y:7},{x:1.15,y:10.3},{x:10.75,y:13},{x:1.15,y:16.4}],
   routes:{approach:[{x:1.15,y:6.5},{x:1.15,y:16.4},l.phone],escape:[{x:1.15,y:16.4},{x:1.15,y:19},{x:10.75,y:19}],fast:[l.phone]}};
  l.targetSeconds=100;l.hardLimitSeconds=240;
  l.briefing='Tap a guard to approach and attack with your knife. Use the branching warehouse walls to flank, collect the Seeker and escape along the outer lane.';
  applyPressure(l);l.patrols[0]!.speed=0;
  return l;
 }
 const plan=LAYOUTS[l.number-2]!;l.combat={version:2,revision:10};
 l.spawn=point(plan.spawn);l.phone=point(plan.phone);const exit=point(plan.exit);l.exit={x:exit.x-.65,y:exit.y-.55,w:1.3,h:1.1};
 l.blockers=[...l.blockers.slice(0,4),...plan.walls.map(box),...(plan.crates??[]).map(v=>({...box(v),kind:'crate' as const}))];l.gates=undefined;l.switches=undefined;l.exitWindow=undefined;
 l.targets=plan.second?[l.phone,point(plan.second)]:undefined;
 l.patrols=plan.cast.map(([role,...anchors],index):GuardSpec=>{
  const route=anchors.map(point),heavy=role==='heavy'||role==='warden';
  return {route,roam:route,combatRole:role,...(role==='drone'?{kind:'scanner' as const}:role==='warden'?{kind:'warden' as const}:{}),
   speed:heavy?.62:role==='drone'?.95:.72+(l.number>=7?.1:0),pursuitSpeed:heavy?1.9:l.number<=3?2.05:l.number<=7?2.4:2.7,
   range:role==='drone'?3.6:role==='warden'?4.8:heavy?4.3:l.number<=3?3.5:l.number<=6?4:4.3,
   halfAngle:role==='drone'?Math.PI/4:Math.PI/3.6,spotSeconds:role==='drone'?.45:l.number<=3?.45:.32,pauseSeconds:.45+(index%2)*.25,investigates:true};
 });
 for(const entry of plan.entries??[]){const p=point(entry);l.patrols.push({route:[p,{x:p.x,y:p.y-.5}],roam:[p,{x:p.x,y:p.y-.5}],combatRole:'scout',reserveAfter:0,pickupWave:1,speed:.75,pursuitSpeed:2.6,range:4.1,halfAngle:Math.PI/3.6,spotSeconds:.35,pauseSeconds:.5,investigates:true});}
 l.encounter={islands:plan.walls.slice(0,2).map(box),grates:(plan.grates??[]).map(box),...(plan.lasers?{lasers:plan.lasers.map(box)}:{}),pockets:plan.pockets.map(point),junctions:[...plan.safe,...plan.back,...plan.pockets].map(point),routes:{approach:plan.safe.map(point),escape:plan.back.map(point),fast:[l.phone]}};
 if(l.number===9){l.switches=[{x:2,y:7,kind:'power'}];l.gates=[{box:{x:9.1,y:7,w:2.2,h:.6,kind:'wall'},mode:'power',power:1,period:10,openSeconds:5,phase:0}];}
 if(l.number===10)l.exitWindow={period:8,openSeconds:4,phase:0};
 l.targetSeconds=l.number<=3?65:l.number===8?115:l.number<=7?80:95;l.hardLimitSeconds=l.number===8?240:210;l.briefing=plan.tip;
 return applyPressure(l);
}
