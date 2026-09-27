import selection from '../../assets/music-v1/selection.json';
/** Only the five selected tracks play. Weekly maps reuse their level's choice. */
export function musicIndex(levelNumber:number){
 const mission=Math.max(0,Math.min(11,Math.floor(Number.isFinite(levelNumber)?levelNumber:1)-1));
 return selection.tracks.indexOf(selection.missionTracks[mission]!);
}
