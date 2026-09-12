// Test fixture only. Uses genuine simulation replays; never imports into a player's save.
import {CAMPAIGN_IDS} from '../src/game/level';
import {fixtureReplay} from '../tests/fixtures/replay';
const runs=CAMPAIGN_IDS.map(mission=>{const {state,replay}=fixtureReplay(mission);if(state.status!=='won')throw new Error('Fixture no longer wins: '+mission);return {mission,score:state.score,ticks:replay.chunks.reduce((n,c)=>n+c.ticks,0),battery:state.battery,spotted:state.spotted};});
console.log(JSON.stringify(runs));
