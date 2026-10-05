// boss arenas for published campaign levels (recipe version 3). each arena is a full width band the player
// must cross to reach the Seeker, so the boss cannot be skipped. the anchor is where the boss holds the room,
// the posts are where its escorts stand. coordinates are authored in a 12 by 20 room before mirror and flip.
import type {Box,Point} from '../src/game/level';
export type BossArena={id:string;name:string;question:string;cover:Box[];anchor:Point;posts:Point[]};
const wall=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h,kind:'wall'});
const crate=(x:number,y:number,w=1,h=1):Box=>({x,y,w,h,kind:'crate'});
export const BOSS_ARENAS:readonly BossArena[]=[
 {id:'arena-pillar-court',name:'Pillar Court',question:'Six pillars and two offset gates. Circle the pillars until the boss shows you its back.',
  cover:[
   // the arena band: full width walls with the gates offset so no straight line crosses the court
   wall(.7,6,2.7,.8),wall(4.6,6,6.7,.8),
   wall(.7,13.2,6.7,.8),wall(8.6,13.2,2.7,.8),
   wall(2.4,8.2,1,1),wall(5.5,8.2,1,1),wall(8.6,8.2,1,1),
   wall(2.4,10.8,1,1),wall(5.5,10.8,1,1),wall(8.6,10.8,1,1),
   // approach cover on both aprons
   wall(4.5,3.8,3,.8),crate(1.5,4.2),crate(9.5,4),
   wall(2,15.4,3,.8),crate(8,15.6),
  ],
  anchor:{x:6,y:10},posts:[{x:4,y:5.2},{x:8,y:14.8},{x:1.5,y:10},{x:10.5,y:10}]},
 {id:'arena-long-hall',name:'Long Hall',question:'The boss walks the hall; its escorts hold the side lanes. Slip through a side door behind it.',
  cover:[
   wall(.7,3.8,4.7,.8),wall(6.6,3.8,4.7,.8),
   wall(.7,15.4,2.7,.8),wall(4.6,15.4,6.7,.8),
   // hall walls with staggered side doors
   wall(2.6,4.6,.8,2.6),wall(2.6,8.4,.8,3.8),wall(2.6,13.4,.8,2),
   wall(8.6,4.6,.8,5),wall(8.6,10.8,.8,4.6),
   // pillars break the line from gate to gate
   wall(5.4,7,1.2,1),wall(5.4,12,1.2,1),
   crate(1.1,6,.9,.9),crate(1.1,11,.9,.9),crate(10,8,.9,.9),crate(10,13.5,.9,.9),
  ],
  anchor:{x:6,y:10},posts:[{x:1.6,y:9.5},{x:10.4,y:6},{x:6,y:5.3},{x:6,y:14.7}]},
 {id:'arena-vault-ring',name:'Vault Ring',question:'A ring corridor around the vault. The boss circles it; the side pockets are the only places to wait.',
  cover:[
   wall(4.4,8,3.2,3.6),
   // outer ring walls, the two band walls run to the room edge with one gate each
   wall(.7,5.8,2.9,.8),wall(4.8,5.8,6.5,.8),
   wall(.7,13,6.5,.8),wall(8.4,13,2.9,.8),
   wall(2.2,6.6,.8,2.8),wall(2.2,10.6,.8,2.4),
   wall(9,6.6,.8,2.8),wall(9,10.6,.8,2.4),
   crate(2,4),crate(8.6,4.2),crate(4,15.6),crate(7.5,17),
  ],
  anchor:{x:3.7,y:9},posts:[{x:4.2,y:5},{x:7.8,y:14.6},{x:10.5,y:10},{x:1.5,y:10}]},
];
