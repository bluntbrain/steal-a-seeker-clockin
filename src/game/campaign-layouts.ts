import type {Box,GuardSpec,LevelDefinition,Point} from './level';
import type {EnemyRole} from './combat-levels';
import {walkableSegment} from './navigation';

type Rect=readonly [number,number,number,number];
// Large connected wall forms establish loops; smaller islands provide a place
// to break sight. These are authored for shooting and phone extraction.
const FORMS:readonly (readonly Rect[])[]=[
 [],
 [[3,10,1.2,5],[3,10,4.4,1.2],[6.2,10,1.2,2.8],[3,5,2.4,2],[7.2,3.8,1.3,3.2],[8.8,12.8,1.2,2],[4.7,16,2,.7]],
 [[3.2,11.8,1.2,4],[6.5,8.8,1.2,4.2],[3.2,7.4,1.2,2.6],[3.2,7.4,2.8,1.2],[7,3.2,2,2],[2,3.4,2,1.2],[8.8,15,1.2,1.2]],
 [[3,12,5.2,1.1],[3,12,1.1,3],[7.1,14.5,1.1,1.6],[3,6.6,1.1,3.4],[3,6.6,4.6,1.1],[6.5,4,1.1,3.7],[8.9,8.8,1,1.7],[2,2.7,2,1.3]],
 [[3.3,12.7,1.2,3.4],[7.5,12.7,1.2,3.4],[3.3,6.3,1.2,3.8],[7.5,6.3,1.2,3.8],[5.5,10.4,1,1.2],[5.5,3.2,1,2],[1,9.8,1,1.2],[10,9.8,1,1.2]],
 [[4.3,7.4,3.3,5.8],[1.9,14.3,2,1.4],[8.3,14.3,1.8,1.4],[2,4,1.8,1.5],[8.2,4,1.8,1.5],[5,2.2,2,1.1],[1,9,1.1,1.8],[9.9,9,1.1,1.8]],
 [[3.2,11.4,1.2,5],[7.6,11.4,1.2,5],[4.4,11.4,1,1.2],[6.6,11.4,1,1.2],[3.2,5,1.2,3.8],[7.6,5,1.2,3.8],[4.4,7.6,1,1.2],[6.6,5,1,1.2],[5.5,2.4,1,1.2]],
 [[3,12.4,1.1,3.4],[3,12.4,3.8,1.1],[7.9,12.4,1.1,3.4],[5.2,15,1.5,1.1],[3,5.4,1.1,3.6],[3,5.4,3.8,1.1],[7.9,5.4,1.1,3.6],[5.2,8,1.5,1.1],[1,10.3,2.5,.9],[8.5,10.3,2.5,.9]],
 [[3.8,12,1.1,3.7],[3.8,12,3.4,1.1],[7.3,8.2,1.1,2.5],[3.3,7.2,2.5,1.1],[1,10,1.2,1.3],[8.6,14.4,1.4,1.1],[3,3.1,2.2,1.5],[8.2,.65,.8,4.8]],
 [[3,12,1.1,4.5],[7.9,12,1.1,4.5],[5,15.5,2,1],[3,6,1.1,3.5],[7.9,6,1.1,3.5],[4.1,6,2.5,1.1],[5.2,9,1.4,1.2],[2,2.4,2,1.2],[8,2.4,2,1.2]],
 [[3,13,2.4,2],[7.2,12.4,1.3,3.7],[1,10.5,2.5,1.1],[5.2,10.5,2.5,1.1],[9.2,10.5,1.8,1.1],[3.4,5,1.1,3.5],[3.4,7.4,3.8,1.1],[7.8,3,1.2,3.5],[1.8,2.5,2,1.1]],
 [[3,13,4.2,1.2],[6,10.5,1.2,2.5],[4.2,9.3,3,1.2],[4.2,6.8,1.2,2.5],[2.5,5.6,2.9,1.2],[8.7,12.8,1.2,2.6],[1.2,9.3,1.2,2.3],[8,4.7,2,1.3],[3,2.2,1.6,1.2]],
];
function positions(l:LevelDefinition,x:number,y:number):Point[]{
 'worklet';const points:Point[]=[];
 // Nearest valid points in a small home zone; never move an anchor into a wall.
 for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){
  const p={x:Math.max(1.3,Math.min(10.7,x+xx*.7)),y:Math.max(1.3,Math.min(16.4,y+yy*.7))};
  if(walkableSegment(p,p,l))points.push(p);
 }
 points.sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||a.y-b.y||a.x-b.x);
 const selected:Point[]=[];for(const p of points)if(selected.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>.75)){selected.push(p);if(selected.length===5)break;}
 if(!selected.length)throw Error(`No patrol pocket in mission ${l.number}`);if(selected.length===1)selected.push({...selected[0]!});return selected;
}
export function applyCampaignLayout(l:LevelDefinition):LevelDefinition{
 'worklet';const n=l.number;
 if(n===1){
  // Keep teaching targets and scripted dodge positions. The large left wall
  // now has a lower alcove and a cross-link without touching tutorial taps.
  l.blockers=l.blockers.filter(b=>!(b.x===.65&&b.y===.65&&b.w===3.3));
  l.blockers.push({x:.65,y:.65,w:3.3,h:4.8,kind:'wall'},{x:.65,y:7,w:3.3,h:1.35,kind:'wall'});
  return l;
 }
 l.blockers=[...l.blockers.slice(0,4),...FORMS[n-1]!.map(([x,y,w,h]):Box=>({x,y,w,h,kind:'wall'}))];
 l.spawn={x:6,y:18};l.phone={x:10.2,y:2};l.exit={x:5.25,y:17.9,w:1.5,h:1.1};l.targets=undefined;l.gates=undefined;l.switches=undefined;l.exitWindow=undefined;
 l.combat={version:2,revision:9};
 const specs:readonly [EnemyRole,number,number][]=n===2?[['scout',8.8,13.4],['drone',2,11.2],['scout',6,3]]:
  n===3?[['scout',2,12],['drone',9.4,10],['scout',5.4,5.2],['scout',9.5,2]]:
  n===4?[['scout',9.4,14],['drone',2,10],['scout',5.3,4],['scout',9.5,3]]:
  n===5?[['drone',6,13.2],['scout',1.7,12],['scout',10.2,6],['scout',5.8,2]]:
  n===6?[['scout',2,12],['drone',10,11.5],['heavy',6,5],['scout',9.5,2]]:
  n===7?[['scout',2,14],['scout',10,12],['sentry',6,9.5],['scout',2,3.2],['scout',9.8,2.5]]:
  n===8?[['scout',2,13.3],['scout',10,12],['scout',6,10],['sentry',2,4],['scout',9.6,3]]:
  n===9?[['scout',2,13],['scout',9.5,12],['sentry',6.4,9],['scout',2,3],['scout',10.4,3.5]]:
  n===10?[['scout',2,13],['scout',10,14],['scout',6,11.2],['sentry',2,5],['scout',9.6,4.7],['sentry',6,2.8]]:
  n===11?[['scout',2,15],['scout',9.9,13.5],['scout',4.8,9],['sentry',9.4,8],['scout',2,4.5],['sentry',6,2.6]]:
  [['scout',2,14.6],['scout',9.6,10.5],['sentry',2,8],['scout',7.3,7],['scout',2,3.8],['warden',6.8,2.5]];
 l.patrols=specs.map(([role,x,y],index):GuardSpec=>{
  const roam=positions(l,x,y);return {combatRole:role,route:[roam[0]!,roam[1]!],roam,speed:role==='heavy'||role==='warden'?.58:n<=4?.68:n<=8?.8:.9,range:role==='drone'?2.8:n<=4?2.9:n<=8?3.2:3.5,halfAngle:Math.PI/3.5,spotSeconds:role==='drone'?.7:.3,pauseSeconds:.5+(index%2)*.2,investigates:true,...(role==='drone'?{kind:'scanner'}:role==='warden'?{kind:'warden'}:{})};
 });
 if(n>=4&&n<=6){const [x,y]=n===4?[9.7,6]:n===5?[1.8,5]:[1.8,7];const roam=positions(l,x!,y!);l.patrols.push({route:[roam[0]!,roam[1]!],roam,speed:.75,range:2.7,halfAngle:Math.PI/3.5,spotSeconds:.7,pauseSeconds:.65,combatRole:'drone',kind:'scanner',investigates:true});}
 if(n===4||n===5||n===7){const at={x:1.5,y:18.5};l.patrols.push({route:[at,{x:3,y:18.5}],roam:[at,{x:3,y:18.5}],speed:.78,range:3,halfAngle:Math.PI/3.5,spotSeconds:.4,pauseSeconds:.7,combatRole:'scout',reserveAfter:n===5||n===7?15:13,investigates:true});}
 if(n===8)l.targets=[{x:2,y:2},l.phone];
 if(n===9){l.switches=[{x:2.9,y:10.4,kind:'power'}];l.gates=[{box:{x:9,y:4.65,w:2.35,h:.8,kind:'wall'},mode:'power',power:1,period:10,openSeconds:5,phase:0}];}
 if(n===10)l.exitWindow={period:8,openSeconds:5,phase:0};
 l.targetSeconds=n<=4?75:n===8?125:n>=10?100:90;l.hardLimitSeconds=n<=4?210:n===8?270:240;
 const tips=['','Use the loop to escape the drone. Guards search where they last saw you.','Break one firing lane, then cross behind cover.','Scout the return loop before taking the phone.','Cross at a safe gap. Reinforcements arrive after the pickup alarm.','Flank the Heavy while its weapon recovers.','The outside loop is safer. The middle route is shorter.','Two phones. Clear a route you can use twice.','Tap the switch, pass the open gate, then collect the phone.','Wait in cover for the exit to turn mint.','Break contact between rooms. Nearby guards share sightings.','Use the bends for cover. Flank the Warden and take the last Seeker.'];
 l.briefing=tips[n-1]!;return l;
}
