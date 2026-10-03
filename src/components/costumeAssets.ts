import {costumeFor} from '../../shared/costumes';
const portraits={
 'solana-toly':require('../../assets/solana-skins/toly.webp'),
 'solana-mert':require('../../assets/solana-skins/mert.webp'),
 'solana-chase':require('../../assets/solana-skins/chase.webp'),
 'solana-lily':require('../../assets/solana-skins/lily.webp'),
 'solana-vibhu':require('../../assets/solana-skins/vibhu.webp'),
 'solana-akshay':require('../../assets/solana-skins/akshay.webp'),
 'solana-beeman':require('../../assets/solana-skins/beeman.webp'),

 'default':require('../../assets/costumes-v4/default.webp'),
 'frost-runner':require('../../assets/costumes-v4/frost-runner.webp'),
 'night-courier':require('../../assets/costumes-v4/night-courier.webp'),
 'circuit-scout':require('../../assets/costumes-v4/circuit-scout.webp'),
 'archive-keeper':require('../../assets/costumes-v4/archive-keeper.webp'),
 'ghost-signal':require('../../assets/costumes-v4/ghost-signal.webp'),
};
const atlases={
 'solana-toly':require('../../assets/solana-skins/toly-atlas.webp'),
 'solana-mert':require('../../assets/solana-skins/mert-atlas.webp'),
 'solana-chase':require('../../assets/solana-skins/chase-atlas.webp'),
 'solana-lily':require('../../assets/solana-skins/lily-atlas.webp'),
 'solana-vibhu':require('../../assets/solana-skins/vibhu-atlas.webp'),
 'solana-akshay':require('../../assets/solana-skins/akshay-atlas.webp'),
 'solana-beeman':require('../../assets/solana-skins/beeman-atlas.webp'),

 'default':require('../../assets/costumes-v4/default-atlas.webp'),
 'frost-runner':require('../../assets/costumes-v4/frost-runner-atlas.webp'),
 'night-courier':require('../../assets/costumes-v4/night-courier-atlas.webp'),
 'circuit-scout':require('../../assets/costumes-v4/circuit-scout-atlas.webp'),
 'archive-keeper':require('../../assets/costumes-v4/archive-keeper-atlas.webp'),
 'ghost-signal':require('../../assets/costumes-v4/ghost-signal-atlas.webp'),
};
// strict top-down sheets for play; costumes without their own sheet fall back to the default until generated
const topdown:Partial<Record<string,number>>={
 'default':require('../../assets/courier-topdown-v1/default.webp'),
};
export const topdownAtlas=(id?:string)=>topdown[costumeFor(id).asset]??topdown.default!;
export const costumePortrait=(id?:string)=>portraits[costumeFor(id).asset];
export const costumeAtlas=(id?:string)=>atlases[costumeFor(id).asset];
