/** Audio is optional: a released native player must never take down the game. */
export type GameAudioPlayer={volume:number;loop:boolean;pause():void;play():void;seekTo(seconds:number):Promise<void>};
export function protectAudioPlayer(player:GameAudioPlayer,onError:(operation:string,error:unknown)=>void){
 let active=true,reported=false;
 const fail=(operation:string,error:unknown)=>{active=false;if(!reported){reported=true;onError(operation,error);}};
 const run=(operation:string,action:()=>unknown)=>{if(!active)return;try{const result=action();if(result&&typeof (result as Promise<unknown>).then==='function')void Promise.resolve(result).catch(error=>fail(operation,error));}catch(error){fail(operation,error);}};
 return {
  activate(){active=true;},deactivate(){active=false;},
  get volume(){try{return active?player.volume:0;}catch(error){fail('volume',error);return 0;}},
  set volume(value:number){run('volume',()=>{player.volume=value;});},
  get loop(){try{return active?player.loop:false;}catch(error){fail('loop',error);return false;}},
  set loop(value:boolean){run('loop',()=>{player.loop=value;});},
  pause(){run('pause',()=>player.pause());},play(){run('play',()=>player.play());},
  async seekTo(seconds:number){if(!active)return;try{await player.seekTo(seconds);}catch(error){fail('seek',error);}},
 };
}
