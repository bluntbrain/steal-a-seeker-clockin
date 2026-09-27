import {wallStyle} from './wall-depth';
export function currentWallStyle(){
 const local=typeof window!=='undefined'&&['localhost','127.0.0.1','::1'].includes(window.location.hostname);
 const preview=local?new URLSearchParams(window.location.search).get('wallDepth'):null;
 return wallStyle(preview??process.env.EXPO_PUBLIC_WALL_DEPTH);
}
