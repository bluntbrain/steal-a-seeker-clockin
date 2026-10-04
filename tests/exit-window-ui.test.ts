import test from 'node:test';
import assert from 'node:assert/strict';
import {exitWindowSeconds} from '../src/controls/exit-window';
test('exit countdown shows time until closing/opening, including a seeded phase',()=>{
 const window={period:8,openSeconds:4,phase:2};
 assert.equal(exitWindowSeconds(window,0),2);
 assert.equal(exitWindowSeconds(window,1.9),1);
 assert.equal(exitWindowSeconds(window,2),4);
 assert.equal(exitWindowSeconds(window,5.9),1);
 assert.equal(exitWindowSeconds(window,6),4);
 assert.equal(exitWindowSeconds({...window,phase:0,openSeconds:3},0),3);
});
