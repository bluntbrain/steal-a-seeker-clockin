import {costumeFor} from '../../shared/costumes';
const portraits={
 'default':require('../../assets/costumes-v4/default.png'),
 'frost-runner':require('../../assets/costumes-v4/frost-runner.png'),
 'night-courier':require('../../assets/costumes-v4/night-courier.png'),
 'circuit-scout':require('../../assets/costumes-v4/circuit-scout.png'),
 'archive-keeper':require('../../assets/costumes-v4/archive-keeper.png'),
 'ghost-signal':require('../../assets/costumes-v4/ghost-signal.png'),
};
const atlases={
 'default':require('../../assets/costumes-v4/default-atlas.png'),
 'frost-runner':require('../../assets/costumes-v4/frost-runner-atlas.png'),
 'night-courier':require('../../assets/costumes-v4/night-courier-atlas.png'),
 'circuit-scout':require('../../assets/costumes-v4/circuit-scout-atlas.png'),
 'archive-keeper':require('../../assets/costumes-v4/archive-keeper-atlas.png'),
 'ghost-signal':require('../../assets/costumes-v4/ghost-signal-atlas.png'),
};
export const costumePortrait=(id?:string)=>portraits[costumeFor(id).asset];
export const costumeAtlas=(id?:string)=>atlases[costumeFor(id).asset];
