import {CAMPAIGN_IDS,type MissionId} from '../game/level';
import {phoneEdition} from '../game/collection';
import type {Contract} from '../../shared/contracts';
import type {Mechanic} from './mechanic-demo';
export type MissionLesson={weapon?:'knife'|'ranged';id:string;kicker:string;title:string;body:string;cue:string;edition:number;collection:boolean;footer:string;tip?:string;playLabel?:string;demo?:Mechanic};
const lessons=[
 ['Your first clean getaway','Tap the floor to move. Tap a guard to approach and attack with your knife. Take the phone, then reach the exit.','MOVE → TAKE → ESCAPE'],
 ['Stop the scout drone','Drones do not shoot. Their radio reveals your location. Cut them down up close or break sight before the amber ring fills. Each win adds a phone to Hideout → Phones.','SCAN → REPORT → INTERRUPT'],
 ['Watch the laser crossings','Crossing a laser flashes an alarm for 1.5 seconds. Nearby guards investigate that spot once. Keep moving into cover; if they see you, the full chase starts.','CROSS → ALARM → BREAK SIGHT'],
 ['Plan the way back','Taking the phone raises the alarm. Know your route through the central pillars before reinforcements arrive. Side-lane lasers briefly alert nearby guards.','PHONE → COVER → EXIT'],
 ['Make the walls work for you','The twin walls stop shots. Choose the exposed center corridor or move between crates along an outer lane. The left laser briefly alerts nearby guards.','COVER → MOVE → COVER'],
 ['Find the Heavy’s weak point','The gold front plate blocks knife strikes. Use the staggered cargo islands to circle behind a Heavy and strike its mint rear panel. The offset upper openings lead to the Seeker.','FRONT = ARMOR · REAR = WEAK POINT'],
 ['A shortcut is a choice','Watch the patrols before you cross. A longer route behind cover can be safer than the shortest path.','WATCH → CHOOSE → MOVE'],
 ['Two phones. Two trips.','Recover and extract each phone. The first pickup brings a response, so save health and use the middle pocket before your second trip.','TAKE → EXTRACT → REPEAT'],
 ['Switch first. Quiet feet.','Follow the cable to open the vault gate. Striped metal grates make noise and draw guards; the covered detour stays quiet.','SWITCH → CHOOSE YOUR ROUTE → PHONE'],
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
export function weeklyLesson(c:Contract):MissionLesson{
 return {weapon:(c.level.combat?.revision??0)>=15?'knife':'ranged',id:c.id,kicker:`WEEKLY MISSION · ${c.modifier.toUpperCase()}`,title:c.name,body:c.objective,cue:'FASTER ESCAPE + MORE HEALTH = MORE POINTS',edition:Math.min(11,c.slot*4),collection:false,footer:'One ranked chance is used only when you start. Best complete run counts.'};
}
