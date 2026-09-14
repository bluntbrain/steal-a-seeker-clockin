import test from 'node:test';
import assert from 'node:assert/strict';
import {weekWindow,weeklyResetLabel} from '../shared/weekly';
test('weekly rollover uses Monday UTC across year boundaries',()=>{
 assert.equal(weekWindow(new Date('2026-01-04T23:59:59Z')).week,'2025-12-29');
 assert.equal(weekWindow(new Date('2026-01-05T00:00:00Z')).week,'2026-01-05');
 assert.equal(weekWindow(new Date('2026-09-14T05:30:00+05:30')).endsAt,'2026-09-21T00:00:00.000Z');
 assert.equal(weeklyResetLabel('2026-09-21T00:00:00Z',Date.parse('2026-09-21T00:00:00Z')),'New week · refresh');
});
