import {costumeFor} from '../../shared/costumes';
const portraits={
 'solana-toly':require('../../assets/solana-skins/toly.png'),
 'solana-mert':require('../../assets/solana-skins/mert.png'),
 'solana-chase':require('../../assets/solana-skins/chase.png'),
 'solana-lily':require('../../assets/solana-skins/lily.png'),
 'solana-vibhu':require('../../assets/solana-skins/vibhu.png'),
 'solana-akshay':require('../../assets/solana-skins/akshay.png'),
 'solana-beeman':require('../../assets/solana-skins/beeman.png'),

 'default':require('../../assets/costumes-v4/default.png'),
 'frost-runner':require('../../assets/costumes-v4/frost-runner.png'),
 'night-courier':require('../../assets/costumes-v4/night-courier.png'),
 'circuit-scout':require('../../assets/costumes-v4/circuit-scout.png'),
 'archive-keeper':require('../../assets/costumes-v4/archive-keeper.png'),
 'ghost-signal':require('../../assets/costumes-v4/ghost-signal.png'),
};
const atlases={
 'solana-toly':require('../../assets/solana-skins/toly-atlas.png'),
 'solana-mert':require('../../assets/solana-skins/mert-atlas.png'),
 'solana-chase':require('../../assets/solana-skins/chase-atlas.png'),
 'solana-lily':require('../../assets/solana-skins/lily-atlas.png'),
 'solana-vibhu':require('../../assets/solana-skins/vibhu-atlas.png'),
 'solana-akshay':require('../../assets/solana-skins/akshay-atlas.png'),
 'solana-beeman':require('../../assets/solana-skins/beeman-atlas.png'),

 'default':require('../../assets/costumes-v4/default-atlas.png'),
 'frost-runner':require('../../assets/costumes-v4/frost-runner-atlas.png'),
 'night-courier':require('../../assets/costumes-v4/night-courier-atlas.png'),
 'circuit-scout':require('../../assets/costumes-v4/circuit-scout-atlas.png'),
 'archive-keeper':require('../../assets/costumes-v4/archive-keeper-atlas.png'),
 'ghost-signal':require('../../assets/costumes-v4/ghost-signal-atlas.png'),
};
export const costumePortrait=(id?:string)=>portraits[costumeFor(id).asset];
export const costumeAtlas=(id?:string)=>atlases[costumeFor(id).asset];
