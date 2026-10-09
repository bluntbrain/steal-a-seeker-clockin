import test from 'node:test';
import assert from 'node:assert/strict';
import {meleeState} from '../src/game/melee';
import {combatLevel} from '../src/game/combat-levels';
import {initialState} from '../src/game/simulation';
import {courierTopFrame,courierMoving,courierNeedsPhone,courierPhoneHand} from '../src/components/courier-locomotion';

test('picking up the phone preserves all walking poses and actual travel cadence',()=>{
 const state=initialState('practice');
 const cycle=(carrying:boolean)=>[0,.36,.72,1.08,1.44].map(walked=>courierTopFrame({...state,carrying,x:2,px:1.9,walked}));
 assert.deepEqual(cycle(false),[1,2,3,2,1]);
 assert.deepEqual(cycle(true),cycle(false));
 for(const walked of [.05,.28,.67,4.2])assert.equal(courierTopFrame({...state,carrying:true,x:2,px:1.9,walked}),courierTopFrame({...state,x:2,px:1.9,walked}));
});

test('idle and blocked travel settle, carrying has exactly one visible phone',()=>{
 const state=initialState('practice');
 assert.equal(courierMoving({...state,vx:4} as typeof state),false);
 assert.equal(courierTopFrame({...state,carrying:false}),0);
 assert.equal(courierTopFrame({...state,carrying:true}),7);
 assert.equal(courierNeedsPhone(true,7),false);
 for(let frame=0;frame<7;frame++){
  assert.equal(courierNeedsPhone(true,frame),true);
  assert.equal(courierNeedsPhone(false,frame),false);
  assert(Number.isFinite(courierPhoneHand(frame).x));
 }
});

test('knife attacks keep priority over the walk cycle while carrying',()=>{
 const state=initialState('practice',combatLevel('practice'));assert(state.combat);
 const melee={...meleeState(state),started:10,angle:0,target:0};
 const attacking={...state,carrying:true,ticks:10,x:2,px:1.9,combat:{...state.combat,melee}};
 assert.equal(courierTopFrame(attacking),4);
 assert.equal(courierNeedsPhone(true,courierTopFrame(attacking)),true);
});


test('new default carrying sheet uses dedicated gait and attack poses without a phone overlay',()=>{
 const state=initialState('practice',combatLevel('practice'));assert(state.combat);
 const carrying={...state,carrying:true,x:2,px:1.9};
 assert.deepEqual([0,.36,.72,1.08,1.44].map(walked=>courierTopFrame({...carrying,walked},true)),[9,10,11,10,9]);
 assert.equal(courierTopFrame({...carrying,px:2},true),8);
 const melee={...meleeState(state),started:10,angle:0,target:0};
 const attacking={...carrying,ticks:10,combat:{...state.combat,melee}};
 assert.equal(courierTopFrame(attacking,true),12);
 for(let frame=8;frame<16;frame++)assert.equal(courierNeedsPhone(true,frame),false);
 assert.equal(courierTopFrame({...state,x:2,px:1.9,walked:0},true),1);
});
