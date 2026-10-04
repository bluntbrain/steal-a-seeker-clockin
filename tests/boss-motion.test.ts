import test from 'node:test';import assert from 'node:assert/strict';
import {bossWalkFrame,bossEntryPose} from '../src/components/boss-motion';
test('boss feet change with travel and hold a stance at rest',()=>{assert.deepEqual([0,.18,.36,.54].map(d=>bossWalkFrame(d+.001,true)),[0,1,2,3]);assert.equal(bossWalkFrame(10,false),1);});
test('boss entrance reveals face before switching fully to overhead',()=>{assert.equal(bossEntryPose(0).frame,4);assert.equal(bossEntryPose(.3).frame,5);assert(bossEntryPose(.3).y<0);assert.equal(bossEntryPose(.7).frame,6);assert(bossEntryPose(.7).ring>0);assert.equal(bossEntryPose(1.4).face,0);assert.equal(bossEntryPose(1.4).top,1);assert.equal(bossEntryPose(0,true).x,0);});
