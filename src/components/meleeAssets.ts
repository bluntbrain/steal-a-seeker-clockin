import {costumeFor} from '../../shared/costumes';
// Exactly one atlas is decoded per equipped outfit. Idle, walk and attack share it.
export const MELEE_ASSETS={
 default:require('../../assets/melee-v2/default-atlas.webp'),
 'frost-runner':require('../../assets/melee-v2/frost-runner-atlas.webp'),
 'night-courier':require('../../assets/melee-v2/night-courier-atlas.webp'),
 'circuit-scout':require('../../assets/melee-v2/circuit-scout-atlas.webp'),
 'archive-keeper':require('../../assets/melee-v2/archive-keeper-atlas.webp'),
 'ghost-signal':require('../../assets/melee-v2/ghost-signal-atlas.webp'),
 'solana-toly':require('../../assets/melee-v2/toly-atlas.webp'),
 'solana-mert':require('../../assets/melee-v2/mert-atlas.webp'),
 'solana-chase':require('../../assets/melee-v2/chase-atlas.webp'),
 'solana-lily':require('../../assets/melee-v2/lily-atlas.webp'),
 'solana-vibhu':require('../../assets/melee-v2/vibhu-atlas.webp'),
 'solana-akshay':require('../../assets/melee-v2/akshay-atlas.webp'),
 'solana-beeman':require('../../assets/melee-v2/beeman-atlas.webp'),
};
export const meleeAtlas=(id?:string)=>MELEE_ASSETS[costumeFor(id).asset];
