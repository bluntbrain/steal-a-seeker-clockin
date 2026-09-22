import test from 'node:test';
import assert from 'node:assert/strict';
import {updateCleanCombo,type ComboSnapshot} from '../src/feedback/clean-combo';
const snap=(tick:number,kills:number,damage=0,active=true,run='a'):ComboSnapshot=>({run,tick,kills,damage,active});
test('quick clean kills form a chain, not extra score or credits',()=>{
 let c=updateCleanCombo(undefined,snap(0,0));c=updateCleanCombo(c,snap(30,1));assert.equal(c.count,1);
 c=updateCleanCombo(c,snap(90,2));assert.equal(c.count,2);
 c=updateCleanCombo(c,snap(100,2));assert.equal(c.lastKill,90);assert.equal(c.count,2);
 c=updateCleanCombo(c,snap(211,3));assert.equal(c.count,1);
 assert.deepEqual(Object.keys(c).sort(),['count','lastKill','previous']);
});
test('damage on a kill, pauses, restarts and restored kills never award a stale combo',()=>{
 let c=updateCleanCombo(undefined,snap(300,8));assert.equal(c.count,0);
 c=updateCleanCombo(c,snap(320,9));c=updateCleanCombo(c,snap(340,10,20));assert.equal(c.count,0);
 c=updateCleanCombo(c,snap(350,11,20));assert.equal(c.count,1);
 c=updateCleanCombo(c,snap(350,11,20,false));c=updateCleanCombo(c,snap(350,11,20));assert.equal(c.count,0);
 c=updateCleanCombo(c,snap(360,12,20));c=updateCleanCombo(c,snap(0,0));assert.equal(c.count,0);
 c=updateCleanCombo(c,snap(20,1));c=updateCleanCombo(c,snap(30,2,0,true,'b'));assert.equal(c.count,0);
});
