import {getLevel,type LevelDefinition,type MissionId,type GuardSpec,type Box,type Point} from './level';
export type EnemyRole='drone'|'scout'|'sentry'|'heavy'|'warden';
const names=['First Pickup','Blind Corner','Crossfire','Loading Lockdown','Skybridge','Heavy Watch','Split Route','Twin Relay','Dark Circuit','Vault Window','Security Grid','Last Seeker'];
const lessons=['Tap to move. Tap a robot to shoot. Take the Seeker and escape.','Use cover to take the guards one at a time.','Two firing lanes. Break one before crossing.','Plan your return before the lockdown.','Move between shots across the roof.','Go around the Heavy instead of trading hits.','Choose the safe route or risk the shorter lane.','Bring both phones back. Your health must last.','Tap the switch to open the vault gate.','The exit opens for three seconds. Watch its light.','Break the crossfire before taking the phone.','Disable the Warden or find a way past. Then get out.'];
// Each row is one tile. # = solid wall, C = cargo crate; other markers are
// walkable authored spawn/objective/enemy positions. Corridors are usually two tiles.
const DENSE_ROOMS=[
 // Mission 2 — staggered barriers, cover pockets and cross-links.
 [
  '.........P',
  '.##.##.##.',
  '.##.##.##.',
  '1......##.',
  '.##.##.##.',
  '.##.##.##.',
  '........1.',
  '##..##..##',
  '##..##..##',
  '.##.......',
  '.##.##.##.',
  '.##.##.##.',
  '....1.....',
  '.##.##.##.',
  '.##.##.##.',
  '....##....',
  '..CC..CC..',
  'Sr.......E',
 ],
 // Mission 3 — staggered barriers, cover pockets and cross-links.
 [
  'P.........',
  '##.##.##..',
  '##.##.##..',
  '....##...2',
  '..##.##.##',
  '..##.##.##',
  '.1........',
  '##.##.##..',
  '##.##.##..',
  '....1..##.',
  '..##.##.##',
  '..##.##.##',
  '........2.',
  '.##.##.##.',
  '.##.##.##.',
  '.##.......',
  '.CC....CC.',
  'Sr......rE',
 ],
 // Mission 4 — staggered barriers, cover pockets and cross-links.
 [
  '.....2...P',
  '.###..###.',
  '.###..###.',
  '.##..1....',
  '##..##..##',
  '##..##..##',
  '..........',
  '.##.##.##.',
  '.##.##.##.',
  '...2...##.',
  '##..##..##',
  '##..##..##',
  '.1........',
  '.###..###.',
  '.###..###.',
  '....##....',
  '..CC..CC..',
  'Sr......rE',
 ],
 // Mission 5 — staggered barriers, cover pockets and cross-links.
 [
  '....P.....',
  '.##.##.##.',
  '.##.##.##.',
  '1...##..2.',
  '..##.##.##',
  '..##.##.##',
  '..........',
  '##..##..##',
  '##..##..##',
  '###.1.....',
  '##.##.##..',
  '##.##.##..',
  '.........2',
  '.##.##.##.',
  '.##.##.##.',
  '.......##.',
  '.CC....CC.',
  'Sr......rE',
 ],
 // Mission 6 — staggered barriers, cover pockets and cross-links.
 [
  '.........P',
  '.###..###.',
  '.###..###.',
  '.##..2....',
  '.##.##.##.',
  '.##.##.##.',
  '1....3...1',
  '.###..###.',
  '.###..###.',
  '.......##.',
  '.##.##.##.',
  '.##.##.##.',
  '....2.....',
  '##..##..##',
  '##..##..##',
  '....##....',
  '..CC..CC..',
  'Sr......rE',
 ],
 // Mission 7 — staggered barriers, cover pockets and cross-links.
 [
  'P....t....',
  '##.##.##..',
  '##.##.##..',
  '.2.....##1',
  '##..##..##',
  '##..##..##',
  '..........',
  '..##.##.##',
  '..##.##.##',
  '.1..##....',
  '##..##..##',
  '##..##..##',
  '.........2',
  '.##.##.##.',
  '.##.##.##.',
  '.##.1...##',
  '.CC....CC.',
  'Sr......rE',
 ],
 // Mission 8 — staggered barriers, cover pockets and cross-links.
 [
  'P........P',
  '.##.##.##.',
  '.##.##.##.',
  '.2..##..2.',
  '.##.##.##.',
  '.##.##.##.',
  '....1.....',
  '##..##..##',
  '##..##..##',
  '.##.......',
  '..##.##.##',
  '..##.##.##',
  '.....1....',
  '##.##.##..',
  '##.##.##..',
  '.......##.',
  '..CC..CC..',
  'Sr......rE',
 ],
 // Mission 9 — staggered barriers, cover pockets and cross-links.
 [
  '......##P.',
  '..##..##..',
  '..##..##3.',
  '..##2.##..',
  '......##..',
  '##..####GG',
  '..........',
  'W#.##.##..',
  '##1##.##..',
  '....##....',
  '.##.##.##.',
  '.##.##.##.',
  '.2........',
  '..##.##.##',
  '..##.##.##',
  '.##..1....',
  '.CC....CC.',
  'Sr..t...rE',
 ],
 // Mission 10 — staggered barriers, cover pockets and cross-links.
 [
  '.........P',
  '.###..###.',
  '.###..###.',
  '2...3..##.',
  '.##.##.##.',
  '.##.##.##.',
  '.........2',
  '##..##..##',
  '##..##..##',
  '.##..1....',
  '.##.##.##.',
  '.##.##.##.',
  '........1.',
  '.###..###.',
  '.###..###.',
  '....##....',
  '..CC..CC..',
  'Sr..t...rE',
 ],
 // Mission 11 — staggered barriers, cover pockets and cross-links.
 [
  'P....t....',
  '..##.##.##',
  '..##.##.##',
  '.##.....2.',
  '##.##.##..',
  '##.##.##..',
  '.2........',
  '##..##..##',
  '##..##..##',
  '...1##....',
  '..##.##.##',
  '..##.##.##',
  '....1.....',
  '##.##.##..',
  '##.##.##..',
  '...3...##.',
  '.CC....CC.',
  'Sr..t...rE',
 ],
 // Mission 12 — staggered barriers, cover pockets and cross-links.
 [
  '....P.....',
  '.###..###.',
  '.###..###.',
  '.##.4...2.',
  '##..##..##',
  '##..##..##',
  '.2...1....',
  '..##.##.##',
  '..##.##.##',
  '..3....###',
  '##..##..##',
  '##..##..##',
  '..1....2..',
  '.###..###.',
  '.###..###.',
  '....##....',
  '..CC..CC..',
  'Sr..t...rE',
 ],
];
function applyDenseLayout(l:LevelDefinition,n:number){
 'worklet';
 const rows=DENSE_ROOMS[n-2]!,boxes:Box[]=l.blockers.slice(0,4),phones:Point[]=[],guards:GuardSpec[]=[];
 const open=(x:number,y:number)=>x>=0&&x<10&&y>=0&&y<18&&rows[y]![x]!=='#'&&rows[y]![x]!=='C'&&rows[y]![x]!=='G';
 // Merge matching solid spans vertically. One solid footprint is also one art piece.
 for(let y=0;y<18;y++)for(let x=0;x<10;){const mark=rows[y]![x];if(mark!=='#'&&mark!=='C'){x++;continue;}let end=x+1;while(end<10&&rows[y]![end]===mark)end++;
  const prior=boxes.find(b=>b.x===x+1&&b.w===end-x&&b.y+b.h===y+1&&b.kind===(mark==='C'?'crate':'wall'));
  if(prior)prior.h++;else boxes.push({x:x+1,y:y+1,w:end-x,h:1,kind:mark==='C'?'crate':'wall'});x=end;
 }
 let reserves=0;
 for(let y=0;y<18;y++)for(let x=0;x<10;x++){
  const mark=rows[y]![x]!,at={x:x+1.5,y:y+1.5};
  if(mark==='S')l.spawn=at;
  if(mark==='P')phones.push(at);
  if(mark==='E')l.exit={x:at.x-.55,y:at.y-.5,w:1.1,h:1};
  if(mark==='W')l.switches=[{...at,kind:'power'}];
  if(mark==='G'&&rows[y]![x-1]!=='G'){let width=1;while(rows[y]![x+width]==='G')width++;l.gates=[{box:{x:x+1,y:y+1,w:width,h:1,kind:'wall'},mode:'power',power:1,period:10,openSeconds:5,phase:0}];}
  if(!'1234rt'.includes(mark))continue;
  const reserve=mark==='r'||mark==='t',role:EnemyRole=mark==='4'?'warden':mark==='3'?'heavy':mark==='2'||mark==='t'?'sentry':'scout';
  const directions=[[0,1],[-1,0],[0,-1],[1,0]],rotation=(guards.length+n)%4;
  let target=at,longest=0;
  for(let i=0;i<4;i++){const [dx,dy]=directions[(i+rotation)%4]!;let steps=0;while(steps<3&&open(x+dx!*(steps+1),y+dy!*(steps+1)))steps++;if(steps>longest){longest=steps;target={x:at.x+dx!*steps,y:at.y+dy!*steps};}}
  guards.push({combatRole:role,route:[at,target],speed:role==='heavy'||role==='warden'?1.05:role==='sentry'?1.2:1.45,range:role==='sentry'?5.7:role==='warden'?5.5:4.8,halfAngle:Math.PI/3.5,spotSeconds:.3,pauseSeconds:.3,investigates:true,...(role==='warden'?{kind:'warden' as const}:{}),...(reserve?{reserveAfter:2.2+reserves++*2.2}:{})});
 }
 l.blockers=boxes;l.patrols=guards;l.phone=phones[0]!;l.targets=phones.length>1?phones:undefined;
 // Campaign balance pass: preserve the cover and combat rules. Delayed waves
 // keep their spacing instead of sending multiple reinforcements together.
 const waveTimes=n===3?[3.5,5.7]:n===5?[4,7]:n===7?[4,6.2,8.4]:null;
 if(waveTimes){let wave=0;for(const guard of l.patrols)if(guard.reserveAfter!==undefined)guard.reserveAfter=waveTimes[wave++]!;}
 // Keep the upper sentry off the Heavy's approach crossing.
 if(n===10)l.patrols[0]!.route=[{x:1.5,y:3.5},{x:1.5,y:1.5}];
 // Stop the right sentry one tile before the middle crossing covered by the
 // left sentry and scout. The upper phone aisle remains guarded.
 if(n===11)l.patrols[1]!.route=[{x:9.5,y:4.5},{x:9.5,y:6.5}];
 // The Heavy patrols across the middle aisle instead of sharing the lower
 // vertical lane with the scout in the opposite direction.
 if(n===12)l.patrols[4]!.route=[{x:4.5,y:10.5},{x:6.5,y:10.5}];
 l.exitWindow=n===10?{period:8,openSeconds:3,phase:0}:undefined;
 l.targetSeconds=n===8?100:n>=9?80:65;l.hardLimitSeconds=n===8?180:n>=9?150:120;
}

// Free campaign encounters: approach a pair, use its island, then regroup behind
// the middle baffles. Frozen weekly definitions never pass through this authoring.
export const SCOUT_ENCOUNTER_POCKETS=[{x:1.5,y:11.9},{x:6,y:18}];
function applyScoutEncounters(l:LevelDefinition,n:number){
 'worklet';
 const mirror=n===3||n===5;
 const point=(x:number,y:number):Point=>({x:mirror?12-x:x,y});
 const box=(x:number,y:number,w:number,h:number,kind:Box['kind']='wall'):Box=>({x:mirror?12-x-w:x,y,w,h,kind});
 const upperX=n===4?4.6:4,lowerX=n===5?4.5:4;
 l.blockers=[...l.blockers.slice(0,4),
  box(lowerX,13.2,2.7,2),box(upperX,6,2.7,2),
  box(1,10,3.5,1.2),box(7.5,10,3.5,1.2),box(2.3,11.2,.4,1.9),
  box(4.2,17,3.2,.6),
  box(1,2,2,2),box(8.6,2,2.4,2),box(5,2,1.4,1.8),
  box(1,6,1.3,2),box(9.5,6,1.5,2),box(1,16,1.5,1),
  box(9.2,12,1.8,1.2),box(9.2,16.8,1.6,1,'crate'),
 ];
 if(n===4)l.blockers.push(box(1,4.7,1.2,.6,'crate'));
 if(n===5)l.blockers.push(box(9.6,4.7,1.2,.6,'crate'));
 if(n===6)l.blockers.push(box(1,4.7,1.2,.6,'crate'));
 const enemy=(role:EnemyRole,route:number[][],speed:number):GuardSpec=>({
  combatRole:role,route:route.map(([x,y])=>point(x!,y!)),speed,
  range:role==='drone'?2.8:role==='heavy'?3.1:2.9,halfAngle:Math.PI/3.5,
  spotSeconds:.8,pauseSeconds:role==='drone'?.55:.85,investigates:true,
  ...(role==='drone'?{kind:'scanner' as const}:{}),
 });
 // Each patrol stays in its encounter before an alarm or audible shot.
 const lowerDrone=enemy('drone',[[3.2,12.4],[3.2,15.9],[8,15.9],[8,12.4]],n<=3?.85:1);
 const lowerGuard=enemy('scout',[[8.5,16],[8.5,14]],.70);
 const upperLeft=enemy(n>=4?'drone':'scout',n>=4?[[3.2,5.2],[3.2,8.8],[8.1,8.8],[8.1,5.2]]:[[3.2,8.8],[3.2,6]],n>=4?1:.65);
 const upperRight=enemy(n===6?'heavy':'scout',[[8.4,8.8],[8.4,6]],n===6?.48:.65);
 l.patrols=[lowerDrone,lowerGuard,upperLeft,upperRight];
 if(n===6){
  l.patrols.push(enemy('scout',[[3.8,1.5],[3.8,3.8]],.70),enemy('sentry',[[7.6,3.8],[7.6,1.5]],.60));
 }
 // Replace the old reserve count rather than adding another crowd on top.
 const reserves=n===2?0:n===6?1:2;
 for(let i=0;i<reserves;i++)l.patrols.push({...enemy('scout',[[i?10.5:1.6,18.6],[i?8:3.4,18.6]],.7),reserveAfter:12+i*5});
 l.spawn=point(6,18);l.phone=point(n===4?7.5:4,1.3);
 l.exit={x:(mirror?12-9.8:9.8)-.55,y:18,w:1.1,h:1};
 l.targets=undefined;l.combat={version:2,revision:7};
 l.briefing=n===2?'Clear the pair. Use cover. Take the Seeker and escape.':n===6?'Two patrols, then the Heavy. Use the cover between encounters.':'Clear one patrol pair at a time. Take cover before the next.';
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
 level.combat={version:2,revision:6};
 // The guided room keeps its scripted combat positions; new cover frames that route.
 if(n===1){level.blockers.push(cover(.65,.65,3.3,7.7,'wall'),cover(5,.65,2.5,3.5,'wall'),cover(8.6,15.6,2.75,.9,'crate'),cover(.8,9.1,1,1.5,'wall'),cover(8.8,12.8,2.5,.85,'wall'),cover(4.2,5,1.15,3,'wall'));level.patrols[2]!.route=[{x:4.4,y:2},{x:4.4,y:3}];}
 if(n>1){level.gates=undefined;level.switches=undefined;applyDenseLayout(level,n);}
 // Free campaign pacing: a generous opening, then gradually narrower margins.
 // This changes authored campaign data only. Frozen weekly maps keep their rules.
 if(n>=2){
  let reserve=0;
  for(const guard of level.patrols){
   guard.speed*=n<=4?.52:n<=8?.68:.78;
   guard.range*=n<=5?.60:n<=8?.72:.78;
   guard.pauseSeconds=n<=4?.85:n<=8?.65:.5;
   if(n<=5&&guard.combatRole==='sentry')guard.combatRole='scout';
   if(guard.reserveAfter!==undefined)guard.reserveAfter=(n<=4?12:n<=8?9:7)+(reserve++)*4;
  }
  if(n===4){let sentries=0;for(const guard of level.patrols)if(guard.combatRole==='sentry'&&sentries++>0)guard.combatRole='scout';}
  level.hardLimitSeconds+=n<=4?60:30;
  if(n===10)level.exitWindow={period:8,openSeconds:5,phase:0};
 }
 if(n>=2&&n<=6)applyScoutEncounters(level,n);
 return level;
}
