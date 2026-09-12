import test from 'node:test';
import assert from 'node:assert/strict';
import {freshPlaytest,purchase,equip,finish} from '../src/playtest/store';
import {localEntry} from '../src/playtest/tickets';
import {PRODUCTS} from '../shared/commerce';
test('local campaign and every cosmetic debit once, equip only owned items',()=>{let s=freshPlaytest();assert.throws(()=>equip(s,'night-courier'));for(const p of PRODUCTS){s=purchase(s,p.id);assert.strictEqual(purchase(s,p.id),s);if(p.kind!=='access')s=equip(s,p.id);}assert.equal(s.balance,135);assert.equal(s.owned.length,6);assert.equal(s.equipment.outfit,'signal-runner');assert.throws(()=>purchase({...s,owned:[],balance:1},'campaign'));});
test('local entry returns only once and never settles another ticket',()=>{const entry=localEntry(),s={...freshPlaytest(),balance:240,entry};const result={id:entry.id,kind:'entry' as const,day:'2026-09-12',status:'won',score:100,seconds:20,returned:10000};const next=finish(s,result);assert.equal(next.balance,250);assert.equal(next.results[0]!.returned,10);assert.equal(next.entry,null);assert.strictEqual(finish(next,result),next);assert.throws(()=>finish(s,{...result,id:'wrong'}));assert.equal(finish(s,{...result,status:'caught'}).balance,240);assert.equal(finish(s,{...result,status:'deadline passed'}).balance,240);});
