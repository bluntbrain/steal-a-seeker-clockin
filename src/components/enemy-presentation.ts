/** Art-only scale shared by gameplay and lessons. Never used by collision or scoring. */
export const ENEMY_ART_SCALE={drone:.70,guard:.88,heavy:1.28} as const;
export const GUARD_SPRITES={guard:require('../../assets/guards-v2/patrol.webp'),heavy:require('../../assets/guards-v2/heavy.webp')} as const;
// top-down boss sprites facing +x, 512 pixels; a boss without a sheet yet falls back to the heavy sprite
export const BOSS_SPRITES:Partial<Record<string,number>>={toly:require('../../assets/bosses-v1/toly.webp'),mert:require('../../assets/bosses-v1/mert.webp')};
