/** Slowed, presentation-only lessons. No game state, network calls or rewards. */
export type Mechanic='drone'|'flank'|'reinforcements'|'cover'|'armor'|'routes'|'relay'|'switch'|'timed-exit'|'pursuit'|'finale';
export const MECHANIC_DURATION=15;
export type DemoPoint={x:number;y:number};
export type DemoBox=DemoPoint&{width:number;height:number};
export type DemoActor=DemoPoint&{kind:'guard'|'heavy'|'drone';visible:boolean;hp:number};
export const MECHANIC_STEPS:Record<Mechanic,readonly {label:string;caption:string;badge:string}[]>={
 drone:[{label:'Scan',caption:'Scout drones do not shoot. They scan and charge a radio report.',badge:'SCOUT DRONE · NO GUN'},{label:'Report',caption:'If the amber ring fills, it shares your location. Other enemies join the hunt.',badge:'LOCATION SENT'},{label:'Interrupt',caption:'Instead, cut it down up close before it reports—or break sight. A sent alert stays active.',badge:'INSTEAD · STOP IT EARLY'}],
 flank:[{label:'Watch',caption:'Two guards cover one island. Rushing between them exposes you to both.',badge:'TWO GUARDS · ONE ISLAND'},{label:'Wait',caption:'Wait behind cover until the guards separate.',badge:'WAIT FOR A GAP'},{label:'Flank',caption:'Move around the island and attack one guard at a time.',badge:'ONE TARGET AT A TIME'}],
 reinforcements:[{label:'Plan',caption:'Plan your way back before you take the phone.',badge:'FIND YOUR ESCAPE ROUTE'},{label:'Response',caption:'The pickup triggers a warning at the marked security entrance. A guard arrives.',badge:'PICKUP CALLS SECURITY'},{label:'Escape',caption:'Move toward the exit through cover as the response arrives.',badge:'TAKE THE COVERED WAY OUT'}],
 cover:[{label:'Block',caption:'Solid walls block bullets. Stand behind cover to stop incoming shots.',badge:'WALLS STOP BULLETS'},{label:'Move',caption:'Tap the next safe pocket. Go around the wall, not through the firing lane.',badge:'MOVE BETWEEN POCKETS'},{label:'Shelter',caption:'Use the next wall to break sight. Alerted guards will keep searching.',badge:'COVER BUYS TIME'}],
 armor:[{label:'Front',caption:'The Heavy’s gold front armor blocks knife strikes. A frontal knife strike is blocked.',badge:'GOLD FRONT · PROTECTED'},{label:'Circle',caption:'Circle around cover to get behind the Heavy.',badge:'FLANK THE ARMOR'},{label:'Rear',caption:'Strike the mint panel on its back for much more damage.',badge:'MINT REAR · WEAK POINT'}],
 routes:[{label:'Compare',caption:'The short route crosses a firing lane. The covered route takes longer.',badge:'TWO ROUTES · ONE PHONE'},{label:'Risk',caption:'Patrols watch the short corridor. Check where they are facing.',badge:'SHORT DOES NOT MEAN SAFE'},{label:'Detour',caption:'Use the longer route around the cover island when the direct lane is watched.',badge:'TAKE THE COVERED DETOUR'}],
 relay:[{label:'First',caption:'Collect the first phone. You can carry one at a time.',badge:'FIRST PHONE'},{label:'Deliver',caption:'Take it to the exit before starting the second trip.',badge:'ONE PHONE EXTRACTED'},{label:'Return',caption:'Return for the second phone, then extract again to finish.',badge:'TWO PHONES · TWO TRIPS'}],
 switch:[{label:'Open',caption:'Tap the switch. Follow its cable to the gate it opens.',badge:'SWITCH OPENS THE GATE'},{label:'Noise',caption:'Walking over a striped metal grate makes noise that nearby guards investigate.',badge:'METAL GRATES MAKE NOISE'},{label:'Detour',caption:'The gate is open. Take the quiet route around the grate to reach the phone.',badge:'CHOOSE THE QUIET ROUTE'}],
 'timed-exit':[{label:'Closed',caption:'The extraction light cycles. You cannot leave while the exit is closed.',badge:'AMBER · WAIT'},{label:'Wait',caption:'Wait behind cover beside the exit. Keep the phone with you.',badge:'WAIT IN THE SAFE POCKET'},{label:'Go',caption:'When the exit turns mint, tap it and cross while it is open.',badge:'MINT · GO NOW'}],
 pursuit:[{label:'Spotted',caption:'A confirmed sighting sends the whole team toward your location.',badge:'THE TEAM IS ALERTED'},{label:'Break sight',caption:'Move around a wall to break sight. They head to where they last saw you.',badge:'BREAK LINE OF SIGHT'},{label:'Relocate',caption:'They keep searching around that last sighting. Change rooms; do not wait there.',badge:'THE HUNT DOES NOT RESET'}],
 finale:[{label:'Warden',caption:'Flank the Warden and strike its mint rear panel.',badge:'FLANK THE WARDEN'},{label:'Drone',caption:'Stop the scout drone before its radio report brings everyone after you.',badge:'STOP THE RADIO'},{label:'Extract',caption:'The final pickup calls both security entrances. Take your escape route.',badge:'BOTH ENTRANCES RESPOND'}],
};
export const MECHANIC_COVER:Record<Mechanic,DemoBox[]>={
 drone:[{x:54,y:240,width:58,height:36}],flank:[{x:130,y:145,width:60,height:65}],reinforcements:[{x:130,y:190,width:60,height:45}],cover:[{x:140,y:110,width:40,height:95},{x:200,y:190,width:65,height:32}],armor:[{x:145,y:190,width:50,height:50}],routes:[{x:140,y:135,width:55,height:75}],relay:[{x:140,y:170,width:45,height:50}],switch:[{x:206,y:55,width:12,height:55},{x:206,y:222,width:12,height:78}],'timed-exit':[{x:200,y:190,width:65,height:32}],pursuit:[{x:150,y:130,width:45,height:80}],finale:[{x:145,y:190,width:50,height:50}],
};
const clamp=(t:number)=>{'worklet';return Math.max(0,Math.min(1,t));};
const point=(x:number,y:number)=>{'worklet';return {x,y};};
function travel(points:DemoPoint[],progress:number){
 'worklet';let total=0;for(let i=1;i<points.length;i++)total+=Math.hypot(points[i]!.x-points[i-1]!.x,points[i]!.y-points[i-1]!.y);
 let remaining=clamp(progress)*total;
 for(let i=1;i<points.length;i++){const a=points[i-1]!,b=points[i]!,d=Math.hypot(b.x-a.x,b.y-a.y);if(remaining<=d||i===points.length-1){const n=d?remaining/d:0;return {x:a.x+(b.x-a.x)*n,y:a.y+(b.y-a.y)*n,face:Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?b.x>a.x?3:1:b.y>a.y?0:2};}remaining-=d;}
 return {...points[0]!,face:0};
}
export function mechanicFrame(kind:Mechanic,seconds:number){
 'worklet';const t=Math.max(0,Math.min(MECHANIC_DURATION,seconds)),step=Math.min(2,Math.floor(t/5)),phase=t-step*5;
 const actor=(x:number,y:number,role:DemoActor['kind']='guard',visible=true):DemoActor=>({x,y,kind:role,visible,hp:1});
 const f={step,x:70,y:245,face:2,walking:false,frame:2,actors:[actor(250,120),actor(45,90,'guard',false),actor(280,240,'guard',false)],phone:point(250,155),secondPhone:point(250,115),phoneVisible:false,secondVisible:false,carried:false,delivered:0,exit:point(270,260),exitVisible:false,exitOpen:true,extracted:false,charge:0,radio:false,stopped:false,noise:false,gateOpen:false,entry:false,secondEntry:false,shot:{visible:false,x:0,y:0,angle:0,enemy:false},tap:point(0,0),tapVisible:false};
 const move=(points:DemoPoint[],start:number,end:number)=>{const p=travel(points,(t-start)/(end-start));f.x=p.x;f.y=p.y;f.face=p.face;f.walking=t>start&&t<end;};
 const shoot=(from:DemoPoint,to:DemoPoint,start:number,enemy=false)=>{
  const p=(t-start)/.38,angle=Math.atan2(to.y-from.y,to.x-from.x);
  if(enemy){if(p>=0&&p<=1)f.shot={visible:true,x:from.x+(to.x-from.x)*p,y:from.y+(to.y-from.y)*p,angle,enemy};return;}
  // Contact choreography: approach before the slash; never emit a courier bullet.
  if(t>=start-.9){const q=clamp((t-start+.9)/.9),end={x:to.x-Math.cos(angle)*28,y:to.y-Math.sin(angle)*28};
   f.x=f.x+(end.x-f.x)*q;f.y=f.y+(end.y-f.y)*q;f.walking=q<1;f.face=Math.cos(angle)>.5?3:Math.cos(angle)<-.5?1:Math.sin(angle)>0?0:2;
   if(p>=0&&p<=1)f.shot={visible:true,x:f.x,y:f.y-14,angle:angle-.7+p*1.8,enemy:false};}
 };
 if(kind==='drone'){
  f.x=110;f.y=202;f.face=3;f.actors=[actor(210,132,'drone'),actor(45,95),actor(282,222)];
  f.charge=step===0?clamp((phase-1)/4):step===1?1:phase<1.75?clamp(phase/3):0;
  if(step===1){f.radio=true;for(const [i,end] of [[1,point(75,160)],[2,point(166,202)]] as const){const a=f.actors[i]!;Object.assign(a,travel([a,end],phase/4));}}
  if(step===2){shoot(point(128,182),point(210,132),11.3);f.actors[0]!.visible=t<11.75;f.stopped=t>=11.75;f.tap=point(210,132);f.tapVisible=phase<1.4;}
 }else if(kind==='armor'||kind==='finale'){
  f.actors=[actor(220,150,'heavy'),actor(210,80,'drone',kind==='finale'),actor(45,80,'guard',false)];
  if(kind==='armor'){
   if(step===0){f.x=90;f.y=150;f.face=3;shoot(point(108,140),point(205,150),1.6);f.actors[0]!.hp=1;}
   if(step===1)move([point(90,150),point(90,260),point(280,260),point(280,150)],5.3,9.7);
   if(step===2){f.x=280;f.y=150;f.face=1;shoot(point(264,139),point(235,150),11.3);f.actors[0]!.hp=t>11.7?.35:1;f.tap=point(220,150);f.tapVisible=phase<1.2;}
  }else{
   f.x=280;f.y=150;f.face=1;f.phone=point(72,110);f.phoneVisible=t<11.8;
   shoot(point(264,139),point(235,150),1.3);f.actors[0]!.visible=t<1.75;
   shoot(point(264,139),point(210,80),6.3);f.actors[1]!.visible=t<6.75;f.charge=t>=5&&t<6.75?clamp((t-5)/3):0;
   if(step===2){f.exitVisible=true;f.entry=t>=11.8;f.secondEntry=f.entry;f.actors[2]!.visible=t>=12.6;f.actors.push(actor(285,240,'guard',t>=12.6));f.carried=t>=11.8&&t<14.6;f.extracted=t>=14.6;if(t<11.8)move([point(280,150),point(72,110)],10.2,11.8);else move([point(72,110),point(80,265),point(270,265)],12,14.6);}
  }
 }else if(kind==='flank'){
  f.actors=[actor(95,125),actor(240,185),actor(0,0,'guard',false)];f.x=65;f.y=250;
  if(step>=1){Object.assign(f.actors[0]!,travel([point(95,125),point(70,90)],(t-5)/3));Object.assign(f.actors[1]!,travel([point(240,185),point(250,130)],(t-5)/3));}
  if(step===2){move([point(65,250),point(75,145)],10.3,12);shoot(point(80,126),point(70,90),12.8);f.actors[0]!.visible=t<13.2;}
 }else if(kind==='reinforcements'){
  f.phone=point(235,145);f.phoneVisible=t<3.2;f.carried=t>=3.2&&t<14.4;f.exit=point(60,270);f.exitVisible=true;
  f.actors=[actor(282,85,'guard',t>=6.2),actor(0,0,'guard',false),actor(0,0,'guard',false)];f.entry=t>=3.2;
  if(t<3.2)move([point(85,245),point(85,145),point(235,145)],.6,3.2);else{f.x=235;f.y=145;}
  if(t>=6.2)Object.assign(f.actors[0]!,travel([point(282,85),point(225,120)],(t-6.2)/5));
  if(step===2)move([point(235,145),point(95,155),point(70,250),point(60,270)],10.3,14.4);
  f.extracted=t>=14.4;
 }else if(kind==='cover'){
  f.actors=[actor(250,135),actor(0,0,'guard',false),actor(0,0,'guard',false)];f.x=80;f.y=150;
  if(step===0){shoot(point(234,130),point(182,130),1,true);shoot(point(234,130),point(182,130),2.3,true);shoot(point(234,130),point(182,130),3.6,true);}
  if(step>=1)move([point(80,150),point(80,250),point(238,250)],5.4,9.4);
  if(step===2){shoot(point(250,153),point(246,188),11,true);shoot(point(250,153),point(246,188),12.4,true);}
 }else if(kind==='routes'){
  f.phone=point(255,95);f.phoneVisible=t<14.5;f.actors=[actor(275,163),actor(0,0,'guard',false),actor(0,0,'guard',false)];f.x=60;f.y=260;
  if(step===2)move([point(60,260),point(35,260),point(35,75),point(255,75),point(255,95)],10.3,14.5);
  f.carried=t>=14.5;
 }else if(kind==='relay'){
  f.phone=point(70,115);f.secondPhone=point(250,115);f.phoneVisible=t<2.8;f.secondVisible=t<12.1;f.exit=point(60,265);f.exitVisible=true;
  f.actors.forEach(a=>a.visible=false);
  if(t<5)move([point(60,265),point(70,115)],.6,2.8);
  else if(t<10)move([point(70,115),point(60,265)],5.2,7.8);
  else if(t<12.1)move([point(60,265),point(250,250),point(250,115)],10.1,12.1);
  else move([point(250,115),point(250,250),point(60,265)],12.3,14.7);
  f.carried=t>=2.8&&t<7.8||t>=12.1&&t<14.7;f.delivered=t<7.8?0:t<14.7?1:2;f.extracted=t>=14.7;
 }else if(kind==='switch'){
  f.phone=point(267,155);f.phoneVisible=t<14.5;f.actors=[actor(270,82),actor(0,0,'guard',false),actor(0,0,'guard',false)];f.x=70;f.y=220;f.gateOpen=t>=2;
  if(step===0){f.tap=point(70,220);f.tapVisible=t<1.5;}
  if(step===1){move([point(70,220),point(160,192)],5.2,6.8);f.noise=t>=6.5;Object.assign(f.actors[0]!,travel([point(270,82),point(248,119)],(t-7)/2));}
  if(step===2){move([point(70,220),point(70,130),point(180,130),point(267,155)],10.4,14.5);f.carried=t>=14.5;}
 }else if(kind==='timed-exit'){
  f.actors=[actor(275,100),actor(0,0,'guard',false),actor(0,0,'guard',false)];f.carried=t<12.2;f.exitVisible=true;f.exitOpen=t>=10;f.exit=point(280,263);
  if(t<10)move([point(90,245),point(227,247)],.5,3.8);else move([point(227,247),point(280,263)],10.6,12.2);
  f.extracted=t>=12.2;
 }else if(kind==='pursuit'){
  f.x=100;f.y=175;f.actors=[actor(50,110),actor(280,95),actor(0,0,'guard',false)];f.radio=step===0&&t>2;
  if(t>=2)Object.assign(f.actors[0]!,travel([point(50,110),point(100,160)],(t-2)/6));
  if(t>=2)Object.assign(f.actors[1]!,travel([point(280,95),point(115,95)],(t-2)/7));
  if(step>=1)move([point(100,175),point(100,243),point(265,260)],5.3,9.5);
  if(step===2){Object.assign(f.actors[0]!,travel([point(100,160),point(122,145),point(90,145)],phase/5));Object.assign(f.actors[1]!,travel([point(115,95),point(110,124)],phase/5));}
 }
 f.frame=f.face+(f.walking&&Math.floor(t*7)%2===1?4:0);
 return f;
}
export type MechanicFrame=ReturnType<typeof mechanicFrame>;
