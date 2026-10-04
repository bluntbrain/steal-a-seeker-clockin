import test from 'node:test';
import assert from 'node:assert/strict';
import {combatLevel} from '../src/game/combat-levels';
import {CAMPAIGN_IDS,type LevelDefinition} from '../src/game/level';
import {initialState,type GameState} from '../src/game/simulation';
import {sees} from '../src/game/guards';
import {updateHeistGuards} from '../src/game/heist-guards';
import {droneReportTicks,guardPressure} from '../src/game/guard-pressure';
import {campaignCreditTarget} from '../server/campaign-credit-versions';

function arena(revision:10|11|12|13=13):LevelDefinition{
 const level=combatLevel('cone-lesson');
 // the arena pins the revision 16 sight values this engine was tuned with; authored levels now run revision 17
 const p=guardPressure({...level,combat:{version:2,revision:16}});
 return {...level,combat:{version:2,revision},spawn:{x:6,y:9},blockers:level.blockers.slice(0,4),patrols:[{...level.patrols[0]!,speed:0,roam:undefined,route:[{x:6,y:6},{x:6,y:7}],range:p.vision*.8,halfAngle:95*Math.PI/360,spotSeconds:p.spot}]};
}
function advance(state:GameState,level:LevelDefinition,count:number,onShot:(damage:number)=>void=()=>{}){
 for(let i=0;i<count;i++){state.ticks++;updateHeistGuards(state,1/30,level,(_s,_p,_a,_owner,damage)=>onShot(damage));}
}
test('normal guard sight matches its shorter and narrower visible cone',()=>{
 const l=arena(),s=initialState(l.mission,l),g=s.guards[0]!;
 assert(sees(g,6,10,l),'A guard still watches the four-tile shooting lane');
 assert(!sees(g,6,10.8,l),'The removed outer range must also stop detecting');
 const pointAt=(angle:number)=>[g.x+Math.cos(g.angle+angle)*3,g.y+Math.sin(g.angle+angle)*3] as const;
 assert(sees(g,...pointAt(46*Math.PI/180),l));
 assert(!sees(g,...pointAt(49*Math.PI/180),l),'Outside the drawn 95-degree cone must be safe before detection');
 l.blockers.push({x:4,y:8,w:4,h:.4,kind:'wall'});
 assert(!sees(g,6,10,l),'Sight never penetrates cover');
});
test('alerted drones close on a phone carrier without overtaking an unloaded sprint',()=>{
 const l=arena();l.spawn.y=10.8;const drone=combatLevel('cone-lesson').patrols.find(g=>g.combatRole==='drone')!;
 l.patrols[0]={...l.patrols[0]!,combatRole:'drone',range:drone.range,halfAngle:drone.halfAngle,pursuitSpeed:drone.pursuitSpeed};
 const s=initialState(l.mission,l);advance(s,l,34);assert(s.guards[0]!.heist!.hunting);
 const before=s.y-s.guards[0]!.y;
 for(let i=0;i<45;i++){s.py=s.y;s.y+=3.15/30;advance(s,l,1);}
 assert(s.y-s.guards[0]!.y<before-.1);assert(s.guards[0]!.seesPlayer);
 assert(l.patrols[0]!.pursuitSpeed!<4.1);
});
test('pressure guards shoot sooner, harder, and keep closing during tracking aim',()=>{
 const current=arena(),old=arena(10);old.patrols[0]!.spotSeconds=.45;
 const a=initialState(current.mission,current),b=initialState(old.mission,old);
 let firstNew=0,firstOld=0,newDamage=0,oldDamage=0,trackingGain=0;
 for(let i=0;i<90;i++){
  advance(a,current,1,d=>{if(!firstNew){firstNew=a.ticks;newDamage=d;}});
  advance(b,old,1,d=>{if(!firstOld){firstOld=b.ticks;oldDamage=d;}});
  if(i===24)trackingGain=a.guards[0]!.y-b.guards[0]!.y;
 }
 assert(firstNew>0&&firstNew<firstOld-8);assert(newDamage>oldDamage);
 assert(trackingGain>.3,'Advance during tracking rather than waiting until the whole burst is over');
});
test('the final aim tell is committed and cover cancels a burst',()=>{
 const l=arena(),s=initialState(l.mission,l);advance(s,l,25);const g=s.guards[0]!;
 g.gunPhase='aim';g.gunTicks=6;g.shotAngle=Math.PI/2;
 const before={x:g.x,y:g.y};s.px=s.x;s.x+=.8;advance(s,l,5);
 assert.equal(g.shotAngle,Math.PI/2);assert.equal(g.x,before.x);assert.equal(g.y,before.y);
 g.gunPhase='fire';g.gunTicks=0;g.burstLeft=2;
 l.blockers.push({x:4,y:(g.y+s.y)/2,w:5,h:.15,kind:'wall'});
 let shots=0;advance(s,l,1,()=>shots++);assert.equal(shots,0);assert.equal(g.burstLeft,0);
});
test('the faster drone report remains interruptible with the same countdown used by its ring',()=>{
 const l=arena();l.patrols[0]!.combatRole='drone';const s=initialState(l.mission,l),g=s.guards[0]!;
 for(let i=0;i<30&&!(g.heist?.charge);i++)advance(s,l,1);
 assert(g.heist!.charge>0);assert(g.heist!.charge<droneReportTicks(l));assert(!s.combat!.hunt);
 l.blockers.push({x:4,y:(g.y+s.y)/2,w:4,h:.2,kind:'wall'});advance(s,l,droneReportTicks(l)+3);
 assert.equal(g.heist!.charge,0);assert(!s.combat!.hunt);
});
test('campaign pursuit is grounded while alertness and opening pickup responses remain',()=>{
 for(const id of CAMPAIGN_IDS){const l=combatLevel(id);assert.equal(l.combat?.revision,17);
  for(const g of l.patrols)assert(g.pursuitSpeed!>=2.4&&g.pursuitSpeed!<=3.65,'Pursuit stays within a believable pace');
  const current=guardPressure(l),previous=guardPressure({...l,combat:{version:2,revision:11}});
  assert(current.pursuit<previous.pursuit*.72);
  assert.deepEqual({...current,pursuit:previous.pursuit,aim:previous.aim,recover:previous.recover,report:previous.report},previous,'Keep visibility, detection and damage pressure');
  assert.equal(current.aim,previous.aim+10);assert.equal(current.recover,previous.recover+8);assert.equal(current.report,l.number<=3?36:30);
  if(l.number<=3)assert(l.patrols.some(g=>g.reserveAfter!==undefined&&g.pickupWave===1));
 }
});
test('all campaign enemies, including pickup reinforcements, use their role sight profile',()=>{
 for(const id of CAMPAIGN_IDS){const l=combatLevel(id),base=guardPressure(l).vision;
  for(const g of l.patrols){
   const drone=g.combatRole==='drone',heavy=g.combatRole==='heavy'||g.combatRole==='warden';
   // revision 17: longer, narrower cones with a slow spot time
   assert.equal(g.range,base*(drone?1.1:heavy?.75:1));
   assert.equal(g.halfAngle,drone?Math.PI*110/360:(heavy?60:70)*Math.PI/360);
   assert(g.spotSeconds>=.449&&g.spotSeconds<=.6);
  }
 }
});
test('Heavy has a readable front cone and a blind flank before it is alerted',()=>{
 const level=combatLevel('narrow-crossing'),heavy=level.patrols.find(g=>g.combatRole==='heavy')!;
 const l={...level,blockers:[],patrols:[{...heavy,route:[{x:6,y:6},{x:7,y:6}]}]},g=initialState(l.mission,l).guards[0]!;
 assert(sees(g,6+g.range-.01,6,l));assert(!sees(g,6+g.range+.01,6,l));
 assert(sees(g,6+Math.cos(.50)*2,6+Math.sin(.50)*2,l));
 assert(!sees(g,6+Math.cos(.55)*2,6+Math.sin(.55)*2,l),'Outside the 60-degree heavy cone is safe');
 assert(!sees(g,5,6,l));
});
test('codes 29–32 keep their campaign reward thresholds after role-specific vision',()=>{
 const hash='07efc6e9b1a109c2af85397b2a0b87633c6378f6236d8533f5a29835068b79fd';
 for(const id of CAMPAIGN_IDS)assert.equal(campaignCreditTarget(hash,id),combatLevel(id).targetSeconds);
});
test('code 27 campaign claims retain the published thresholds after slowing pursuit',()=>{
 const hash='8325f1cc68a4847c185a412c1c95f5ec00d2e8b41d80950024b27307902d1d19';
 for(const id of CAMPAIGN_IDS)assert.equal(campaignCreditTarget(hash,id),combatLevel(id).targetSeconds);
});
test('the shipped campaign still earns its original credits while the harder build rolls out',()=>{
 const hash='f4597c232c4bf00b5c1f2d43be08db491fa37812472b656f3fbfb441ec19db74';
 assert.equal(campaignCreditTarget(hash,'practice'),100);
 assert.equal(campaignCreditTarget(hash,'cone-lesson'),65);
 assert.equal(campaignCreditTarget(hash,'warden-gate'),115);
 assert.equal(campaignCreditTarget(hash,'last-vault'),95);
});
