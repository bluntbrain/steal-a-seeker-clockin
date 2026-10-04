import selection from '../../assets/music-spy-v2/selection.json';
/** Stable rotation through the new spy score, including published missions past 12. */
export function musicIndex(levelNumber:number){
 const mission=Math.max(1,Math.floor(Number.isFinite(levelNumber)?levelNumber:1));
 return (mission-1)%selection.tracks.length;
}
/** Keep the score underneath the alarm and combat effects. */
export function musicGain(volume:number,alarm:boolean){
 return Math.max(0,Math.min(1,Number.isFinite(volume)?volume:0))*(alarm?.22:.34);
}
