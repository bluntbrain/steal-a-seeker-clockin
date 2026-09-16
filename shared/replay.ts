export type ReplayChunk={command?:import('../src/game/combat').CombatCommand;x:number;y:number;buttons:number;ticks:number};
export type Replay={version:1|2;chunks:ReplayChunk[]};
export const REPLAY_FLAGS={interact:1,dash:2,decoy:4} as const;
export function quantizeAxis(value:number){'worklet';return Math.round(Math.max(-1,Math.min(1,value))*127);}
export function appendReplay(chunks:ReplayChunk[],x:number,y:number,buttons:number){
 'worklet';
 const previous=chunks[chunks.length-1];
 // Edge-triggered actions remain one tick even when two presses are adjacent.
 if(previous&&previous.x===x&&previous.y===y&&previous.buttons===buttons&&(buttons&6)===0&&previous.ticks<65535)previous.ticks++;
 else chunks.push({x,y,buttons,ticks:1});
}
