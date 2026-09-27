import {wallStyle} from './wall-depth';
export function currentWallStyle(){return wallStyle(process.env.EXPO_PUBLIC_WALL_DEPTH);}
