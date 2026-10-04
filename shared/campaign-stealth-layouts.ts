import type {WeeklyLayout} from './weekly-layouts';
const room=(id:string,name:string,question:string,rects:number[][]):WeeklyLayout=>({id,name,question,cover:rects.map(([x,y,w,h])=>({x:x!,y:y!,w:w!,h:h!,kind:'wall'}))});
/** Campaign-only geometry. 1.2+ unit passages, open objective aprons at y=2/18,
 * interconnected loops and blind corners. Weekly layouts remain frozen separately. */
export const CAMPAIGN_STEALTH_LAYOUTS:readonly WeeklyLayout[]=[
 room('stealth-twin-u','Twin U Courts','Slip inside a U for cover, then leave through its other side.',[
 [2,4,1,4],[2,4,4,1],[5,4,1,2],[8,4,2,1],[9,5,1,3],[2,10,1,5],[2,14,4,1],[5,12,1,3],[7,10,3,1],[9,10,1,5],[5,8,2,1],[4,16,4,1]]),
 room('stealth-tunnel','Split Tunnel','The center tunnel is short; its side exits let you lose a patrol.',[
 [4,3.5,1,6],[7,3.5,1,6],[4,11,1,5],[7,11,1,5],[2,5,1,2],[9,5,1,2],[1,10,2,1],[9,10,2,1],[2,13,1,2],[9,13,1,2],[5,3.5,2,1],[5,15,2,1],[5.5,8,1,1]]),
 room('stealth-hook-yard','Hook Yard','Linked L-shaped bays hide your approach. Check the next corner.',[
 [2,4,3,1],[2,5,1,3],[7,4,3,1],[9,5,1,3],[4,8,4,1],[4,9,1,2],[2,12,3,1],[2,13,1,3],[7,12,3,1],[9,13,1,3],[6,15,2,1],[6,10,1,1],[1,9.5,1,1]]),
 room('stealth-serpentine','Serpentine Depot','Weave between wall fingers; each bend breaks a sightline.',[
 [2,4,6,1],[7,5,1,2],[4,8,6,1],[4,9,1,2],[2,12,6,1],[7,13,1,2],[4,16,6,1],[2,6,1,2],[9,5.5,1,1],[1,10,2,1],[9,10,1,1],[2,14,1,2],[9,13,1,1]]),
 room('stealth-four-bays','Four Bays','Four sheltered bays surround two crossing lanes.',[
 [2,4,3,1],[2,5,1,3],[4,6,1,2],[7,4,3,1],[9,5,1,3],[7,6,1,2],[2,11,1,4],[2,14,3,1],[4,11,1,2],[9,11,1,4],[7,14,3,1],[7,11,1,2],[5.5,8.5,1,2],[4.5,16,3,1]]),
 room('stealth-staggered-teeth','Staggered Teeth','Cross one narrow lane at a time behind alternating wall teeth.',[
 [2,4,1,4],[3,4,2,1],[6,4,1,4],[7,7,3,1],[9,4,1,2],[2,10,3,1],[4,11,1,4],[7,10,1,5],[8,10,2,1],[2,13,1,2],[9,13,1,3],[2,16,4,1],[7,16,2,1]]),
 room('stealth-offset-courts','Offset Courts','Switch sides through covered courtyards instead of chasing down open lanes.',[
 [2,4,1,4],[3,4,4,1],[6,5,1,2],[9,4,1,4],[4,9,1,4],[5,12,5,1],[9,9,1,3],[2,10,1,2],[2,14,1,3],[3,16,4,1],[6,14,1,2],[9,15,1,2],[5,7,2,1]]),
 room('stealth-broken-spine','Broken Spine','Long walls split the room; use the cross-links to flank.',[
 [5.5,3.5,1,4],[5.5,9,1,3],[5.5,13.5,1,3.5],[2,5,3.5,1],[6.5,10,3.5,1],[2,14.5,3.5,1],[2,6,1,2],[9,11,1,2],[2,11,1,2],[9,5,1,3],[3.5,9,1,1],[7.5,14,1,2],[1,16,2,1]]),
 room('stealth-ring-rooms','Ring Rooms','Circle the broken room walls. Every room has two escape routes.',[
 [3,4,6,1],[3,5,1,2],[8,5,1,2],[3,8,1,2],[8,8,1,2],[3,10,6,1],[5.5,6,1,3],[2,13,3,1],[2,14,1,3],[4,15,1,2],[7,13,3,1],[9,14,1,3],[7,15,1,2],[1,8,1,2],[10,8,1,2]]),
 room('stealth-freight-maze','Freight Maze','Pocket cover connects the two main routes through the depot.',[
 [2,4,3,1],[4,5,1,2],[7,4,1,4],[8,7,2,1],[2,8,3,1],[2,9,1,3],[5,10,3,1],[7,11,1,3],[9,10,1,3],[2,14,3,1],[4,15,1,2],[7,16,3,1],[9,14,1,2],[5.5,4,1,1],[4,12,1,1]])
];
