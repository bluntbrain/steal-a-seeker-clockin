import type {Box} from '../src/game/level';
export type WeeklyLayout={id:string;name:string;question:string;cover:Box[]};
const room=(id:string,name:string,question:string,rects:number[][]):WeeklyLayout=>({id,name,question,cover:rects.map(([x,y,w,h],i)=>({x:x!,y:y!,w:w!,h:h!,kind:i%3===0?'crate':'rack'}))});
// Authored collision geometry, not campaign maps or procedural noise. Outer lanes
// and cross-links remain open so every island can be approached from either side.
export const WEEKLY_LAYOUTS:readonly WeeklyLayout[]=[
 room('split-spines','Split Spines','Cross between the spines or take the outer lane.',[[4,4,1.3,4],[6.8,10,1.3,5],[2,11,1.6,2],[8.8,5,1.5,2],[3,15,2,1]]),
 room('cargo-court','Cargo Court','Wait behind the cargo, then flank the central pair.',[[4.2,7,3.6,5],[1.5,4,2,1.5],[8.5,4,2,1.5],[1.5,13,2,1.5],[8.5,13,2,1.5]]),
 room('offset-gates','Offset Gates','Choose a short exposed crossing or a longer covered turn.',[[2,5,5,1.4],[5,10,5,1.4],[2,14,4,1.4],[8.8,3.6,1.2,2.8],[2,8.5,1.3,2]]),
 room('twin-courts','Twin Courts','Clear one courtyard before entering the next.',[[3.4,4,1.4,4],[7.2,4,1.4,4],[3.4,11,1.4,4],[7.2,11,1.4,4],[5.4,9,1.2,1.2]]),
 room('loading-hooks','Loading Hooks','Use the hooked cover to break the crossfire.',[[2,4,4,1.3],[4.7,5.3,1.3,2],[6,11,4,1.3],[6,12.3,1.3,2.7],[1.8,10,1.6,3],[8.5,5,1.6,3]]),
 room('broken-cross','Broken Cross','Pass the center quickly or circle the four arms.',[[5.2,3.7,1.6,3.2],[5.2,12.3,1.6,3],[2,8.7,2.8,1.6],[7.2,8.7,2.8,1.6]]),
 room('staircase','Staircase','Climb the staggered cover without exposing both sides.',[[2,4,2,2],[4.5,7,2,2],[7,10,2,2],[3,13,2,2],[8.5,4,1.5,2],[1.8,9,1.4,2]]),
 room('long-divide','Long Divide','Use the cross-link or commit to the far side of the divider.',[[5.2,4,1.6,6],[5.2,12,1.6,3.5],[1.8,6,1.5,2.5],[8.7,11,1.5,2.5]]),
 room('three-cargo','Three Cargo','Isolate the enemies around each cargo island.',[[3.8,4,3.6,2],[4.5,8.5,3.6,2],[3.2,13,3.6,2],[1.6,9,1.3,1.5],[9,5.5,1.3,2]]),
 room('switchback','Switchback','Thread the staggered lanes or risk the open edge.',[[2,4,6.3,1.4],[4,8.5,6,1.4],[2,13,6.3,1.4],[2,7.5,1.2,2.2],[8.8,12,1.2,2.4]]),
 room('four-posts','Four Posts','Circle the posts to stay behind the heavy.',[[3,5,1.8,2.8],[7.2,5,1.8,2.8],[3,11.7,1.8,2.8],[7.2,11.7,1.8,2.8],[5.2,9.1,1.6,1.2]]),
 room('freight-fork','Freight Fork','Split around the long rack and rejoin at the phone.',[[4.5,5,3,7],[1.8,4,1.2,2],[9,4,1.2,2],[1.8,10.5,1.2,2],[9,10.5,1.2,2],[4,14.5,4,1.2]]),
 room('vault-teeth','Vault Teeth','Cross one firing lane at a time between the teeth.',[[2,4,1.4,3],[5.3,4,1.4,3],[8.6,4,1.4,3],[3.6,10,1.4,3.5],[7,10,1.4,3.5],[2,15,2,1.1]]),
 room('diagonal-vault','Diagonal Vault','Flank along the diagonal islands before the alarm.',[[2,4,2.4,3],[4.8,8.6,2.4,3],[7.6,13,2.4,2.5],[8.5,5,1.5,2],[1.8,12,1.5,2]]),
 room('relay-court','Relay Court','Pick a route around the center; do not get surrounded.',[[4.4,7.8,3.2,3.2],[1.8,4,3,1.2],[7.2,4,3,1.2],[1.8,14.2,3,1.2],[7.2,14.2,3,1.2],[1.8,8.5,1.2,2],[9,8.5,1.2,2]]),
 room('narrow-islands','Narrow Islands','Take the direct middle gap or weave along the edge.',[[3.5,4,1.4,3],[7.1,7,1.4,3],[3.5,10,1.4,3],[7.1,13,1.4,2.5],[9,4,1.2,1.2],[1.8,14,1.2,1.2]]),
 room('double-bend','Double Bend','Change sides through the two bends to lose a firing lane.',[[2,5,3.8,1.4],[4.4,6.4,1.4,2],[6.2,10.5,3.8,1.4],[6.2,11.9,1.4,2],[2,12,1.3,3],[8.7,3.8,1.3,3]]),
 room('vault-wings','Vault Wings','Approach through a wing, then escape across the open center.',[[2,4,3,2],[7,4,3,2],[2,9,2,3],[8,9,2,3],[4.8,7.5,2.4,1.3],[4.8,14,2.4,1.3]]),
];
