import type {GameAudioPlayer} from './safePlayer';
/** One start point for sound and glow. Ignore seeks completed after pause/restart. */
export async function playImpact(player:GameAudioPlayer,isCurrent:()=>boolean,onStart:()=>void){
 try{await player.seekTo(0);}catch{/* A failed audio device must not suppress visual feedback. */}
 if(!isCurrent())return;
 try{player.play();}finally{onStart();}
}
