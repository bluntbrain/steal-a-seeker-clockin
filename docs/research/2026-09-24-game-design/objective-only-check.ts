/**
 * Research probe, not a human difficulty or device-performance test.
 * Run from seeker-game: npx tsx docs/research/2026-09-24-game-design/objective-only-check.ts
 * Uses normal taps and pathfinding, with advance knowledge of objective locations.
 * Does not modify health, positions, guards, simulation speed or game rules.
 */
import {CAMPAIGN_IDS} from '../../../src/game/level';
import {combatLevel} from '../../../src/game/combat-levels';
import {initialState, idleInput, step} from '../../../src/game/simulation';
import {combatTap} from '../../../src/game/combat';
import {writeFileSync} from 'node:fs';
import {URL} from 'node:url';

// Optional interval in simulation ticks; 30 means at most one tap per second.
const tapInterval = Math.max(1, Math.floor(Number(process.argv[2] ?? 1)));
if (!Number.isFinite(tapInterval)) throw new Error('Expected a positive tap interval in ticks');
const results = CAMPAIGN_IDS.map(id => {
  const level = combatLevel(id);
  const state = initialState(id, level);
  let sequence = 0;
  const commands: Record<string, number> = {};
  for (let tick = 0; tick < level.hardLimitSeconds * 30 && state.status === 'playing'; tick++) {
    let command;
    if (!state.combat!.order && tick % tapInterval === 0) {
      const target = level.switches?.length && !state.power ? level.switches[0]!
        : state.carrying ? {x: level.exit.x + level.exit.w / 2, y: level.exit.y + level.exit.h / 2}
        : level.targets?.[state.delivered] ?? level.phone;
      command = combatTap(state, target.x, target.y, ++sequence);
      commands[command.kind] = (commands[command.kind] ?? 0) + 1;
    }
    step(state, {...idleInput(), command});
  }
  return {
    mission: level.number, title: level.title, revision: level.combat?.revision, tapIntervalTicks: tapInterval,
    status: state.status, hp: state.combat!.hp,
    seconds: Math.round(state.ticks / 3) / 10,
    kills: state.combat!.kills, shots: state.combat!.shots,
    enemyShots: state.combat!.enemyShots, damage: state.combat!.damageTaken,
    commands,
  };
});

const resultName = tapInterval === 1 ? './objective-only-results.json' : `./objective-only-${tapInterval}ticks-results.json`;
writeFileSync(new URL(resultName, import.meta.url), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
