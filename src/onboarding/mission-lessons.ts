import {CAMPAIGN_IDS,type MissionId} from '../game/level';
import {phoneEdition} from '../game/collection';
import type {Contract} from '../../shared/contracts';
export type MissionLesson={id:string;kicker:string;title:string;body:string;cue:string;edition:number;collection:boolean;footer:string};
const lessons=[
 ['Your first clean getaway','Tap the floor to move. Tap a guard to shoot. Take the phone, then reach the exit.','MOVE → TAKE → ESCAPE'],
 ['Twelve heists. Twelve phones.','Each win adds a Seeker to Hideout → Phones. This mission adds a scout drone: break sight or shoot it before its amber radio ring fills and every enemy joins the hunt.','BREAK SIGHT → COLLECT → ESCAPE'],
 ['Choose the crossing','Paired guards watch different sides of cover. Wait for separation, take the longer flank, or break the drone’s sight before its radio ring fills.','WATCH → FLANK → CROSS'],
 ['Plan the way back','Taking the phone raises the alarm. Know your route to the exit before reinforcements arrive.','PHONE → COVER → EXIT'],
 ['Make the walls work for you','Walls stop shots. Move from one safe pocket to the next instead of crossing an open firing lane.','COVER → MOVE → COVER'],
 ['Find the Heavy’s weak point','The gold front plate blocks most damage. Circle the cover island and shoot the mint panel on its back while it turns.','FRONT = ARMOR · REAR = WEAK POINT'],
 ['A shortcut is a choice','Watch the patrols before you cross. A longer route behind cover can be safer than the shortest path.','WATCH → CHOOSE → MOVE'],
 ['Two phones. Two trips.','Recover and extract each phone. The first pickup brings a response, so save health and use the middle pocket before your second trip.','TAKE → EXTRACT → REPEAT'],
 ['Switch first. Quiet feet.','Follow the cable to open the vault gate. Striped metal grates make noise and draw guards; the covered detour stays quiet.','SWITCH → CHOOSE YOUR ROUTE → PHONE'],
 ['Watch the exit light','The exit opens and closes on a timer. Wait behind cover, then move when it opens.','COVER → GREEN LIGHT → GO'],
 ['Lose them between rooms','A confirmed sighting sends every guard and drone after you. Walls break vision, but enemies keep searching. Change rooms before they reach your last sighting.','BREAK SIGHT → CHANGE ROUTE'],
 ['One last Seeker','Flank the Warden’s armor and stop the drone report. Both security entrances respond when you take the final phone—plan your way out.','FLANK → TAKE → ESCAPE'],
] as const;
export function campaignLesson(mission:MissionId):MissionLesson{
 const edition=CAMPAIGN_IDS.indexOf(mission),[title,body,cue]=lessons[edition]!;
 return {id:mission,kicker:`MISSION ${String(edition+1).padStart(2,'0')} / 12`,title,body,cue,edition,collection:edition===1,footer:`Recover ${phoneEdition(mission).name} · View it in Hideout → Phones`};
}
export function weeklyLesson(c:Contract):MissionLesson{
 return {id:c.id,kicker:`WEEKLY MISSION · ${c.modifier.toUpperCase()}`,title:c.name,body:c.objective,cue:'FASTER ESCAPE + MORE HEALTH = MORE POINTS',edition:Math.min(11,c.slot*4),collection:false,footer:'One ranked chance is used only when you start. Best complete run counts.'};
}
