/** Art-only scale shared by gameplay and lessons. Never used by collision or scoring. */
export const ENEMY_ART_SCALE={drone:.70,guard:.88,heavy:1.28} as const;
export const GUARD_SPRITES={guard:require('../../assets/guards-v2/patrol.webp'),heavy:require('../../assets/guards-v2/heavy.webp')} as const;
// top-down boss sprites facing +x, 512 pixels; a boss without a sheet yet falls back to the heavy sprite
export const BOSS_SPRITES:Partial<Record<string,number>>={toly:require('../../assets/boss-motion-v3/idle/toly.webp'),mert:require('../../assets/boss-motion-v3/idle/mert.webp'),chase:require('../../assets/boss-motion-v3/idle/chase.webp'),lily:require('../../assets/boss-motion-v3/idle/lily.webp'),vibhu:require('../../assets/boss-motion-v3/idle/vibhu.webp'),akshay:require('../../assets/boss-motion-v3/idle/akshay.webp'),beeman:require('../../assets/boss-motion-v3/idle/beeman.webp')};

export const DEFEAT_SPRITES={robots:require('../../assets/defeats-v2/robots.webp'),toly:require('../../assets/defeats-v2/toly.webp'),mert:require('../../assets/defeats-v2/mert.webp'),chase:require('../../assets/defeats-v2/chase.webp'),lily:require('../../assets/defeats-v2/lily.webp'),vibhu:require('../../assets/defeats-v2/vibhu.webp'),akshay:require('../../assets/defeats-v2/akshay.webp'),beeman:require('../../assets/defeats-v2/beeman.webp')};
