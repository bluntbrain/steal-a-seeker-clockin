import {CAMPAIGN_IDS,type MissionId} from '../game/level';
import {phoneEdition} from '../game/collection';
import type {Contract} from '../../shared/contracts';
export type MissionLesson={id:string;kicker:string;title:string;body:string;cue:string;edition:number;collection:boolean;footer:string};
const lessons=[
 ['Your first clean getaway','Tap the floor to move. Tap a guard to shoot. Take the phone, then reach the exit.','MOVE → TAKE → ESCAPE'],
 ['Twelve heists. Twelve phones.','Every campaign mission adds a different Seeker design to your collection. Find them in Hideout → Phones.','WIN → COLLECT → HIDEOUT'],
 ['Don’t let drones report you','Scout drones call nearby guards when they spot you. Get behind cover before their scan locks on.','BREAK THEIR LINE OF SIGHT'],
 ['Plan the way back','Taking the phone raises the alarm. Know your route to the exit before reinforcements arrive.','PHONE → COVER → EXIT'],
 ['Make the walls work for you','Walls stop shots. Move from one safe pocket to the next instead of crossing an open firing lane.','COVER → MOVE → COVER'],
 ['The Heavy takes more hits','A Heavy can outlast a straight shootout. Use corners and cover—or find a route around it.','DON’T TRADE HITS'],
 ['A shortcut is a choice','Watch the patrols before you cross. A longer route behind cover can be safer than the shortest path.','WATCH → CHOOSE → MOVE'],
 ['Two phones. One escape.','Recover both phones in this mission. Save enough health for the second trip.','TAKE BOTH → ESCAPE'],
 ['Switch first. Phone second.','Tap the power switch to open the gate. Then collect the phone and head for the exit.','SWITCH → GATE → PHONE'],
 ['Watch the exit light','The exit opens and closes on a timer. Wait behind cover, then move when it opens.','COVER → GREEN LIGHT → GO'],
 ['Break up the crossfire','Don’t let two guards shoot at you together. Use a corner to face one firing lane at a time.','ONE ENEMY AT A TIME'],
 ['One last Seeker','The Warden stands between you and the final phone. Defeat it or slip past, then complete your collection.','FINAL PHONE → FULL COLLECTION'],
] as const;
export function campaignLesson(mission:MissionId):MissionLesson{
 const edition=CAMPAIGN_IDS.indexOf(mission),[title,body,cue]=lessons[edition]!;
 return {id:mission,kicker:`MISSION ${String(edition+1).padStart(2,'0')} / 12`,title,body,cue,edition,collection:edition===1,footer:`Recover ${phoneEdition(mission).name} · View it in Hideout → Phones`};
}
export function weeklyLesson(c:Contract):MissionLesson{
 return {id:c.id,kicker:`WEEKLY MISSION · ${c.modifier.toUpperCase()}`,title:c.name,body:c.objective,cue:'FASTER ESCAPE + MORE HEALTH = MORE POINTS',edition:Math.min(11,c.slot*4),collection:false,footer:'One ranked chance is used only when you start. Best complete run counts.'};
}
