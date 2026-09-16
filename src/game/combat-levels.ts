import {getLevel,type LevelDefinition,type MissionId,type GuardSpec,type Box} from './level';
export type EnemyRole='drone'|'scout'|'sentry'|'heavy'|'warden';
const names=['First Pickup','Blind Corner','Crossfire','Loading Lockdown','Skybridge','Heavy Watch','Split Route','Twin Relay','Dark Circuit','Vault Window','Security Grid','Last Seeker'];
const lessons=['Tap to move. Tap a robot to shoot. Take the Seeker and escape.','Use cover to take the guards one at a time.','Two firing lanes. Break one before crossing.','Plan your return before the lockdown.','Move between shots across the roof.','Go around the Heavy instead of trading hits.','Choose the safe route or risk the shorter lane.','Bring both phones back. Your health must last.','Tap the switch to open the vault gate.','The exit opens for three seconds. Watch its light.','Break the crossfire before taking the phone.','Disable the Warden or find a way past. Then get out.'];
function applyTacticalLayout(l:LevelDefinition,n:number){
 'worklet';
 const b=(x:number,y:number,w:number,h:number,kind:Box['kind']='rack'):Box=>({x,y,w,h,kind});
 // Coordinates are intentional: each room has its own navigation problem.
 const layouts:Box[][]=[[],[],
  [b(5,3,.9,10.5),b(.65,13,4.35,.9),b(8,8,1.6,2),b(7,16,1.3,1.2,'crate')],
  [b(3,5,.85,9),b(8.15,5,.85,9),b(4.9,9,2.2,1.3,'crate'),b(1.2,2,2,1,'crate'),b(8.8,16,2,1,'crate')],
  [b(.65,6.5,7.4,1),b(3.9,12.5,7.45,1),b(5,9,1.7,1.2,'crate'),b(2,16,2,1,'crate')],
  [b(3.4,4,.8,11),b(7.8,4,.8,11),b(.65,11,2.75,.8),b(8.6,7,2.75,.8),b(5.2,9,1.5,1,'crate')],
  [b(4.7,8,2.6,4),b(2,4,2.5,1.2,'crate'),b(7.5,14,2.5,1.2,'crate'),b(1.2,10,1.5,2),b(9.3,6,1.4,2)],
  [b(5.5,4,1,11),b(.65,10,2.8,1),b(8.5,7,2.85,1),b(7.8,13,1.6,1.3,'crate'),b(2.3,4,1.4,2.4,'crate')],
  [b(5.4,3,1.2,11),b(2.6,6,1.4,3),b(8,10,1.4,3),b(3.8,16,4.4,.8),b(1.2,12,1.4,1,'crate')],
  [b(3.5,5,3.8,.8),b(.65,10,5.8,.8),b(5.3,14,6.05,.8),b(8.55,.65,.25,4.05,'wall'),b(8,8,2,1.2,'crate')],
  [b(2.4,4,2,2),b(7.6,4,2,2),b(2.4,11,2,2),b(7.6,11,2,2),b(5.5,7,.8,3),b(5.5,15,.8,2)],
  [b(.65,5.5,7.3,.8),b(4,10.5,7.35,.8),b(.65,15.5,7.3,.8),b(2,8,1.6,1,'crate'),b(8.6,13,1.2,1,'crate')],
  [b(3.4,3,.8,5),b(7.8,3,.8,5),b(3.4,11,.8,5),b(7.8,11,.8,5),b(5.25,8.9,1.5,1.5,'crate'),b(.65,9,1.8,1),b(9.55,9,1.8,1)],
 ];
 l.blockers=[...l.blockers.slice(0,4),...layouts[n]!];
 const p=(role:EnemyRole,x:number,y:number,xx:number,yy:number):GuardSpec=>({combatRole:role,route:[{x,y},{x:xx,y:yy}],speed:role==='heavy'||role==='warden'?1.05:role==='sentry'?1.2:1.45,range:role==='sentry'?5.7:role==='warden'?5.5:4.8,halfAngle:Math.PI/3.5,spotSeconds:.3,pauseSeconds:.22,investigates:true,...(role==='warden'?{kind:'warden' as const}:{})});
 const rosters:GuardSpec[][]=[[],[],
  [p('scout',2,5,2,10),p('scout',9.8,6,9.8,3),p('scout',9.8,15,6.5,15)],
  [p('scout',2,7,2,12),p('sentry',10,12,10,6),p('scout',5.5,3,9.8,3),p('scout',7.4,15.5,3,15.5)],
  [p('sentry',9.5,8,9.5,11),p('scout',2,11.5,4,11.5),p('sentry',8,3,3,3),p('scout',7,15,10,15)],
  [p('sentry',6,6,6,8),p('scout',2,8,2,4),p('sentry',10,14,10,9),p('scout',9.8,2.4,6,2.4)],
  [p('heavy',8,8,8,12),p('scout',3.5,12,3.5,7),p('sentry',8,3,5,3),p('scout',6,16,3,16)],
  [p('sentry',4.2,8,4.2,13),p('scout',7.4,11,7.4,4),p('scout',2,8,2,6.8),p('sentry',10,15,7,15),p('scout',8,2,3,2)],
  [p('sentry',4.6,5,4.6,11),p('sentry',7.3,12,7.3,5),p('scout',2,10.5,4,10.5),p('sentry',10,7,10,14),p('scout',7,18,9.5,18)],
  [p('sentry',7.6,11.8,7.6,9.8),p('scout',3,8.5,6,8.5),p('sentry',9.9,6.5,7.8,6.5),p('scout',3,13,3,16),p('heavy',9.9,3,9.9,1.8)],
  [p('heavy',6,13.7,8.5,13.7),p('sentry',6,5,6,2.5),p('scout',1.4,9,1.4,14),p('sentry',10.6,8,10.6,14),p('scout',8,9,8,7)],
  [p('sentry',9.8,7.5,9.8,3),p('sentry',2,12.5,2,9.5),p('heavy',9.5,16.8,9.5,14.8),p('scout',7,8,4.6,8),p('scout',5,13,7.5,13),p('sentry',3,3,6,3)],
  [p('warden',6,5,6,7.8),p('heavy',6,12,6,15),p('sentry',2,7.5,2,3),p('sentry',10,12,10,16),p('scout',4.7,10.8,7.1,10.8),p('scout',9.8,2,5,2)],
 ];
 l.patrols=rosters[n]!;
 l.phone=n===9?{x:9.8,y:3.4}:n===5?{x:6,y:2}:n===7?{x:9.8,y:3}:n===12?{x:6,y:2}:n%2?{x:9.8,y:2}:{x:2,y:2};
 l.exit=n===5?{x:4.9,y:17.5,w:2.2,h:1.2}:n===10?{x:1.1,y:17.5,w:2,h:1.2}:{x:8.9,y:17.5,w:1.8,h:1.2};
 l.targets=n===8?[{x:2,y:2},{x:10,y:2}]:undefined;
 l.switches=n===9?[{x:2,y:7.5,kind:'power'}]:undefined;
 l.gates=n===9?[{box:b(8.55,4.7,2.8,.25,'wall'),mode:'power',power:1,period:10,openSeconds:5,phase:0}]:undefined;
 l.exitWindow=n===10?{period:8,openSeconds:3,phase:0}:undefined;
 l.targetSeconds=n<5?45:n===8?90:n<9?60:75;
 l.hardLimitSeconds=n===8?150:n<5?100:120;
 // Reinforcements enter from marked doors behind or across the return path.
 const reserve=n<4?1:n<9?2:3;
 for(let r=0;r<reserve;r++)l.patrols.push({...p(r===2?'sentry':'scout',r%2?10:2,r===2?2:18,r%2?9:3,r===2?2:18),reserveAfter:1.8+r*2.2});
}

export function combatLevel(mission:MissionId):LevelDefinition{
 'worklet';const old=getLevel(mission),n=Math.max(1,old.number),i=n-1;
 const wall:Box[]=[{x:0,y:0,w:12,h:.65,kind:'wall'},{x:0,y:19.35,w:12,h:.65,kind:'wall'},{x:0,y:0,w:.65,h:20,kind:'wall'},{x:11.35,y:0,w:.65,h:20,kind:'wall'}];
 const cover=(x:number,y:number,w:number,h:number,kind:Box['kind']='crate'):Box=>({'x':x,y,w,h,kind});
 const variants:Box[][]=[
 [cover(4,13,3,1.2,'rack'),cover(2,8.5,2,1.5),cover(7,5,2.5,1.3,'rack')],
 [cover(3.5,14,2,2),cover(6.5,10,3,1.2,'rack'),cover(2,6,3,1.3),cover(7.5,3,1.4,2)],
 [cover(2,13,2.4,1.3),cover(7.5,13,2.4,1.3),cover(4.8,8,2.4,2.8,'rack'),cover(2,4,2.5,1.2),cover(8,5,2,1.3)],
 [cover(3,14,6,1.2,'rack'),cover(2,8,2.5,2),cover(7.2,6,2.5,1.5),cover(4.7,3.4,1.2,2)],
 ];
 const blockers=[...wall,...variants[i%4]!.map(b=>({...b}))];
 const roles:EnemyRole[][]=[['drone','scout'],['scout','scout','scout'],['scout','sentry','scout'],['sentry','sentry','scout'],['scout','sentry','scout'],['heavy','scout','scout'],['sentry','scout','sentry','scout'],['heavy','sentry','sentry'],['sentry','scout','sentry','scout'],['heavy','sentry','scout','sentry'],['heavy','sentry','scout','sentry','scout'],['warden','heavy','sentry','sentry']];
 // All rows lie in authored open lanes. Long vision makes cover important.
 const rows=[11.2,6.7,2,16.7,9.6];
 const patrol=(role:EnemyRole,index:number):GuardSpec=>{const y=rows[index]!;return {route:[{x:index%2?10.5:1.4,y},{x:index%2?10.5:1.4,y:y+.6}],speed:role==='heavy'||role==='warden'?.6:role==='sentry'?.7:1,range:role==='sentry'?5:4.5,halfAngle:Math.PI/3.2,spotSeconds:.3,pauseSeconds:.8,investigates:true,combatRole:role,...(role==='warden'?{kind:'warden' as const}:{})};};
 const patrols=roles[i]!.map(patrol);
 if(n===1){blockers.splice(4,blockers.length-4,cover(4,13,3,1.2,'rack'),cover(7,6,2.7,1.2));patrols[0]={...patrol('drone',0),route:[{x:3,y:11},{x:3,y:11.1}],speed:0};patrols[1]={...patrol('scout',1),route:[{x:9,y:10},{x:8.5,y:10.5}],speed:.45,range:3};}
 const reserves=n===2?0:n===4||n>=11?2:1;
 for(let r=0;r<reserves;r++)patrols.push({...patrol('scout',0),route:[{x:r?10.3:1.7,y:2},{x:r?10.3:1.7,y:3}],reserveAfter:2+r*2});
 // District-specific cover changes preserve an open route but change the firing lanes.
 if(n===5)blockers.push(cover(8.3,14.8,1.2,2.4,'rack'));
 if(n===6)blockers.push(cover(5.1,4,1.2,3,'rack'));
 if(n===7)blockers.push(cover(5.5,15.5,1.1,1.6));
 if(n===8)blockers.push(cover(5.2,10,2.2,1.1,'rack'));
 if(n===9)blockers.push(cover(5,4,1.1,3,'rack'));
 if(n===10)blockers.push(cover(2,10,2,1.1));
 if(n===11)blockers.push(cover(8.5,8.3,1,2));
 if(n===12)blockers.push(cover(5,10.5,1.8,1.2));
 const phone={x:n%2?9.8:2.1,y:3.4},exit={x:8.9,y:17.5,w:1.8,h:1.2};
 const level:LevelDefinition={...old,id:`combat-v2:${mission}`,title:names[i]!,briefing:lessons[i]!,combat:{version:2},spawn:{x:2.1,y:17.6},phone,exit,blockers,patrols,decoys:0,gates:undefined,switches:undefined,targets:undefined,exitWindow:undefined,targetSeconds:n<3?100:150,hardLimitSeconds:n===1?300:n===8?300:240};
 if(n===8)level.targets=[phone,{x:9.8,y:3.4}];
 if(n===9){level.blockers.push(cover(8.55,.65,.25,4.05,'wall'));level.switches=[{x:5.7,y:11,kind:'power'}];level.gates=[{box:cover(8.55,4.7,2.8,.25,'wall'),mode:'power',power:1,period:10,openSeconds:5,phase:0}];}
 if(n===10)level.exitWindow={period:8,openSeconds:4,phase:0};
 level.combat={version:2,revision:3};
 if(n>1)applyTacticalLayout(level,n);
 return level;
}
