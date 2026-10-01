import {costumeFor} from '../../shared/costumes';
// Exactly one atlas is decoded per equipped outfit. Idle, walk and attack share it.
export const MELEE_ASSETS={
 default:require('../../assets/melee-v2/default-atlas.png'),
 'frost-runner':require('../../assets/melee-v2/frost-runner-atlas.png'),
 'night-courier':require('../../assets/melee-v2/night-courier-atlas.png'),
 'circuit-scout':require('../../assets/melee-v2/circuit-scout-atlas.png'),
 'archive-keeper':require('../../assets/melee-v2/archive-keeper-atlas.png'),
 'ghost-signal':require('../../assets/melee-v2/ghost-signal-atlas.png'),
 'solana-toly':require('../../assets/melee-v2/toly-atlas.png'),
 'solana-mert':require('../../assets/melee-v2/mert-atlas.png'),
 'solana-chase':require('../../assets/melee-v2/chase-atlas.png'),
 'solana-lily':require('../../assets/melee-v2/lily-atlas.png'),
 'solana-vibhu':require('../../assets/melee-v2/vibhu-atlas.png'),
 'solana-akshay':require('../../assets/melee-v2/akshay-atlas.png'),
 'solana-beeman':require('../../assets/melee-v2/beeman-atlas.png'),
};
export const meleeAtlas=(id?:string)=>MELEE_ASSETS[costumeFor(id).asset];
