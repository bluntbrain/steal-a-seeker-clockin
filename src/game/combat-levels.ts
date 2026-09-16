import {getLevel,type LevelDefinition,type MissionId,type GuardSpec,type Box} from './level';
export type EnemyRole='drone'|'scout'|'sentry'|'heavy'|'warden';
const names=['First Pickup','Blind Corner','Crossfire','Loading Lockdown','Skybridge','Heavy Watch','Split Route','Twin Relay','Dark Circuit','Vault Window','Security Grid','Last Seeker'];
const lessons=['Tap to move. Tap a robot to shoot. Take the Seeker and escape.','Use cover to take the guards one at a time.','Two firing lanes. Break one before crossing.','Plan your return before the lockdown.','Move between shots across the roof.','Go around the Heavy instead of trading hits.','Choose the safe route or risk the shorter lane.','Bring both phones back. Your health must last.','Tap the switch to open the vault gate.','The exit opens for four seconds. Watch its light.','Break the crossfire before taking the phone.','Disable the Warden or find a way past. Then get out.'];
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
 return level;
}
