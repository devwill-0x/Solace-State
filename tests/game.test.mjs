import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,walk,canWalk,serialize,START} from '../dist/game.js';
test('the full street can be walked in both directions',()=>{
 const s=createState();s.started=true;
 for(let i=0;i<390;i++)walk(s,1,0,.1);assert.ok(s.player.z<-86);
 for(let i=0;i<390;i++)walk(s,-1,0,.1);assert.ok(s.player.z>6);
});
test('street objects block movement while former character locations are open',()=>{
 assert.equal(canWalk(4,0),false);assert.equal(canWalk(3,-7),false);assert.equal(canWalk(-3,-33),false);
 for(const [x,z] of [[-1.85,-7],[1.85,-36],[-1.9,-67]])assert.equal(canWalk(x,z),true);
 const s=createState();s.started=true;s.player.yaw=Math.PI/2;const x=s.player.x;walk(s,1,0,.1);assert.ok(s.player.x<x);
 s.paused=true;const old={...s.player};walk(s,1,0,.1);assert.deepEqual(s.player,old);
});
test('older saves resume walking without conversation state',()=>{
 const s=createState({started:true,player:{x:-1.85,z:-7,yaw:.4,pitch:0},met:['nagi'],conversations:true,conversation:{id:'nagi',line:1},elapsed:120});
 assert.equal(s.player.x,-1.85);assert.ok(walk(s,1,0,.1));
 assert.deepEqual(Object.keys(serialize(s)).sort(),['elapsed','player','started']);assert.equal(s.elapsed,120);
});
test('corrupt saves are sanitized and analog movement preserves low speeds',()=>{
 const s=createState({player:{x:999,z:NaN,yaw:Infinity,pitch:9},elapsed:-99});
 assert.deepEqual(s.player,START);assert.equal(s.elapsed,0);s.started=true;
 const before=s.player.z;walk(s,.25,0,.1);assert.ok(before-s.player.z>0&&before-s.player.z<.1);
});
