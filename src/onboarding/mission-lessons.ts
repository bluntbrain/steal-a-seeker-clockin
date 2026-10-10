import {CAMPAIGN_IDS,type MissionId} from '../game/level';
import {phoneEdition} from '../game/collection';
import type {Mechanic} from './mechanic-demo';
import {BOSS_NAMES} from '../../shared/campaign-levels';
import type {CampaignEntry} from '../campaign/levels';
import jev from '../campaign/jev-runs.json';
export type MissionLesson={weapon?:'knife'|'ranged';id:string;kicker:string;title:string;body:string;cue:string;edition:number;collection:boolean;footer:string;tip?:string;playLabel?:string;demo?:Mechanic};
const lessons=[
 ['Your first clean getaway','Tap the floor to move. Tap a guard to approach and attack with your knife. Take the phone, then reach the exit.','MOVE → TAKE → ESCAPE'],
 ['Stop the scout drone','Drones do not shoot. Their radio reveals your location. Cut them down up close or break sight before the amber ring fills. Each win adds a phone to Hideout → Phones.','SCAN → REPORT → INTERRUPT'],
 ['Watch the laser crossings','Crossing a laser flashes an alarm for 1.5 seconds. Nearby guards investigate that spot once. Keep moving into cover; if they see you, the full chase starts.','CROSS → ALARM → BREAK SIGHT'],
 ['Plan the way back','Taking the phone raises the alarm. Know your route through the central pillars before reinforcements arrive. Side-lane lasers briefly alert nearby guards.','PHONE → COVER → EXIT'],
 ['Make the walls work for you','The twin walls stop shots. Choose the exposed center corridor or move between crates along an outer lane. The left laser briefly alerts nearby guards.','COVER → MOVE → COVER'],
 ['Find the Heavy’s weak point','The gold front plate blocks knife strikes. Use the staggered cargo islands to circle behind a Heavy and strike its mint rear panel. The offset upper openings lead to the Seeker.','FRONT = ARMOR · REAR = WEAK POINT'],
 ['A shortcut is a choice','Cross-walls split the route. Lasers report where you crossed. Take the shorter central lane or a longer flank behind cover. Move before nearby guards arrive.','WATCH → CHOOSE → MOVE'],
 ['Two phones. Two trips.','Recover the central-room phone, then the upper-gallery phone. Bring each to the entrance. Use either side opening; crossing the courtyard laser alerts nearby guards.','TAKE → EXTRACT → REPEAT'],
 ['Switch first. Quiet feet.','Weave around the cargo, then activate the central switch to open the upper vault. Use side passages to flank guards. The striped shortcut makes noise.','SWITCH → CHOOSE YOUR ROUTE → PHONE'],
 ['Watch the exit light','The exit opens and closes on a timer. Wait behind cover, then move when it opens.','COVER → GREEN LIGHT → GO'],
 ['Lose them between rooms','A sighting alerts nearby enemies. Break sight and change rooms. They check your last position, search for five seconds, then return to patrol if they cannot find you.','BREAK SIGHT → CHANGE ROUTE'],
 ['One last Seeker','Flank the Warden’s armor and stop the drone report. Both security entrances respond when you take the final phone—plan your way out.','FLANK → TAKE → ESCAPE'],
] as const;
const mechanics:readonly (Mechanic|undefined)[]=[undefined,'drone','laser','reinforcements','cover','armor','routes','relay','switch','timed-exit','pursuit','finale'];
export function campaignLesson(mission:MissionId):MissionLesson{
 const edition=CAMPAIGN_IDS.indexOf(mission),[title,body,cue]=lessons[edition]!;
 const tip=edition===1?'Drones do not shoot. Take them out first: a full amber ring reports your location. Breaking sight interrupts an unsent report. After a report, hide elsewhere until the nearby search ends.':edition===0?'Tap the floor to move; tap an enemy to approach and slash. Scout drones do not shoot, but report your location. Take them out before the amber ring fills.':body;
 return {id:mission,kicker:`MISSION ${String(edition+1).padStart(2,'0')} / 12`,title,body,cue,edition,collection:edition===1,tip,demo:mechanics[edition],playLabel:`PLAY MISSION ${String(edition+1).padStart(2,'0')}  →`,footer:`Recover ${phoneEdition(mission).name} · Each win adds a phone to Hideout → Phones`};
}
export function publishedLesson(entry:CampaignEntry):MissionLesson{
 const n=String(entry.number).padStart(2,'0'),boss=entry.boss;
 return {weapon:'knife',id:entry.key,kicker:`LEVEL ${n}${boss?' · BOSS':''}`,title:boss?`${BOSS_NAMES[boss]} holds this room`:entry.title,body:entry.definition.briefing,cue:boss?'FLANK THE ARMOR → TAKE → ESCAPE':'BREAK SIGHT → TAKE → ESCAPE',edition:(entry.number-1)%12,collection:false,footer:boss?'Boss levels pay double credits. Take the Seeker and get out.':'Each clear pays credits and opens the next level on the map.',playLabel:`PLAY LEVEL ${n}  →`};
}

// one short line on the loading screen before each mission, read while the level loads. levels 1 to 12 teach the
// mechanic they introduce; later levels rotate general tips, and bosses get their own
const AUTHORED_HINTS=[
 'Tap a guard to target it and attack.',
 'Drones do not shoot. They alert the guards nearby.',
 'Crossing a laser alerts the guards nearby.',
 'Taking the phone raises the alarm. Plan your way out.',
 'Walls stop bullets. Move from cover to cover.',
 'Heavy guards block hits from the front. Strike from behind.',
 'Short routes cross lasers. Long routes stay in cover.',
 'Two phones this time. Bring each one to the exit.',
 'Hit the switch first to open the vault.',
 'The exit opens and closes. Wait for green.',
 'Break sight and change rooms to lose them.',
 'Taking the last phone alerts both entrances.',
] as const;
const GENERAL_HINTS=[
 'Hit an unaware guard from behind for a silent takedown.',
 'Stay out of the flashlight cones.',
 'Guards hear footsteps when you pass close by.',
 'Drones do not shoot. They alert the guards nearby.',
 'Heavy guards block hits from the front. Strike from behind.',
 'Spotted? Break sight. Guards search, then give up.',
 'Finish fast with health left for three stars.',
] as const;
export function missionHint(entry:Pick<CampaignEntry,'number'|'boss'>):string{
 if(entry.number<=AUTHORED_HINTS.length)return AUTHORED_HINTS[entry.number-1]!;
 if(entry.boss)return `${BOSS_NAMES[entry.boss]} is armoured in front. Circle round and strike from behind.`;
 return GENERAL_HINTS[(entry.number-AUTHORED_HINTS.length-1)%GENERAL_HINTS.length]!;
}

// jev ai played the campaign on a livestream; its best winning run per level gives players a score to chase.
// it is jev's own run, not a verified record, so the copy always names jev
const jevRun=(n:number)=>(jev.levels as Record<string,{score:number;tries:number}|undefined>)[String(n)];
export function jevLine(n:number):string|undefined{
 const run=jevRun(n);
 return run&&`Jev AI scored ${run.score.toLocaleString()} ${run.tries>1?`after ${run.tries} tries`:'on its first try'}.`;
}
export function jevResult(n:number,score:number):string|undefined{
 const run=jevRun(n);if(!run)return undefined;
 const gap=score-run.score;
 return gap>0?`You beat Jev AI by ${gap.toLocaleString()} points.`:gap===0?'You tied Jev AI.':`Jev AI scored ${(-gap).toLocaleString()} more here.`;
}
