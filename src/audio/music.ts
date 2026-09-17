/** Also used by the three server-authored weekly maps (level numbers 1, 5, 9). */
export function musicIndex(levelNumber:number){return Math.max(0,Math.min(11,Math.floor(Number.isFinite(levelNumber)?levelNumber:1)-1));}
