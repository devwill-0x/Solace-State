import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,walk,canWalk,serialize,START,startRide,endRide,updateRide} from '../dist/game.js';
test('the full street can be walked in both directions',()=>{
 const s=createState();s.started=true;
 for(let i=0;i<390;i++)walk(s,1,0,.1);assert.ok(s.player.z<-36);
 for(let i=0;i<500;i++)walk(s,-1,0,.1);assert.ok(s.player.z>6);
});
test('street objects block movement while former character locations are open',()=>{
 assert.equal(canWalk(4,0),false);assert.equal(canWalk(3,-7),false);assert.equal(canWalk(-3,-33),false);
 for(const [x,z] of [[-1.85,-7],[1.85,-36],[-1.9,-27]])assert.equal(canWalk(x,z),true);
 const s=createState();s.started=true;s.player.yaw=Math.PI/2;const x=s.player.x;walk(s,1,0,.1);assert.ok(s.player.x<x);
 s.paused=true;const old={...s.player};walk(s,1,0,.1);assert.deepEqual(s.player,old);
});
test('older saves resume walking without conversation state',()=>{
 const s=createState({started:true,player:{x:-1.85,z:-7,yaw:.4,pitch:0},met:['nagi'],conversations:true,conversation:{id:'nagi',line:1},elapsed:120});
 assert.equal(s.player.x,-1.85);assert.ok(walk(s,1,0,.1));
 assert.deepEqual(Object.keys(serialize(s)).sort(),['elapsed','ending','player','puzzles','realm','started']);assert.equal(s.elapsed,120);
});
test('corrupt saves are sanitized and analog movement preserves low speeds',()=>{
 const s=createState({player:{x:NaN,z:NaN,yaw:Infinity,pitch:9},elapsed:-99});
 assert.deepEqual(s.player,START);assert.equal(s.elapsed,0);s.started=true;
 const before=s.player.z;walk(s,.25,0,.1);assert.ok(before-s.player.z>0&&before-s.player.z<.1);
});

test('portal changes realms and saved meadow positions restore',()=>{const s=createState();s.started=true;s.player.x=3.0;s.player.z=-2;walk(s,0,1,.1);assert.equal(s.realm,'meadow');assert.equal(createState(serialize(s)).realm,'meadow');s.player.z=-85.1;s.player.yaw=0;walk(s,-1,0,.1);assert.equal(s.realm,'street');});

test('crossing preserves lateral offset, pitch and heading in both directions',()=>{const s=createState();s.started=true;s.player={x:3.1,z:-1.6,yaw:-Math.PI/2,pitch:.2};walk(s,1,0,.02);assert.equal(s.realm,'meadow');assert.ok(Math.abs(s.player.x-.4)<1e-8);assert.ok(Math.abs(s.player.yaw)<1e-8);assert.equal(s.player.pitch,.2);walk(s,-1,0,.02);assert.equal(s.realm,'street');assert.ok(Math.abs(s.player.x-3.1)<1e-8);assert.ok(Math.abs(s.player.z+1.6)<1e-8);});

test('blossom portal preserves offset and returns to its own street doorway',()=>{const s=createState();s.started=true;s.player={x:3.1,z:-11.7,yaw:-Math.PI/2,pitch:.1};walk(s,1,0,.02);assert.equal(s.realm,'blossom');assert.equal(createState(serialize(s)).realm,'blossom');assert.ok(Math.abs(s.player.x-.3)<1e-8);walk(s,-1,0,.02);assert.equal(s.realm,'street');assert.ok(Math.abs(s.player.z+11.7)<1e-8);});

test('sprint is faster and a passenger ride pauses, completes, and avoids immediate reentry',()=>{const a=createState(),b=createState();a.started=b.started=true;b.sprinting=true;walk(a,1,0,.1);walk(b,1,0,.1);assert.ok(b.player.z<a.player.z);a.player={x:-1,z:-10,yaw:0,pitch:0};assert.ok(startRide(a));assert.equal(walk(a,1,0,.1),false);a.paused=true;updateRide(a,10);assert.equal(a.ride.time,0);a.paused=false;updateRide(a,51);assert.equal(a.ride,null);assert.equal(startRide(a),false);});

test('side courtyards connect to the main street and respect pond and tree collisions',()=>{assert.equal(canWalk(-5,-12),true);assert.equal(canWalk(5,-20),true);assert.equal(canWalk(-11,-12),false);assert.equal(canWalk(7,-22),false);assert.equal(canWalk(-7,-13),false);const s=createState({started:true,player:{x:-5,z:-12,yaw:0,pitch:0}});assert.equal(s.player.x,-5);});

import {WORLDS,act,countFragments,finish} from '../dist/journey.js';
test('all five new portals preserve position and return to their own doorway',()=>{for(const w of WORLDS){const s=createState();s.started=true;s.player={x:3.1,z:w.z+.2,yaw:-Math.PI/2,pitch:.15};walk(s,1,0,.02);assert.equal(s.realm,w.id);assert.equal(createState(serialize(s)).realm,w.id);walk(s,-1,0,.02);assert.equal(s.realm,'street');assert.ok(Math.abs(s.player.z-(w.z+.2))<1e-8);}});
test('five distinct puzzles grant one fragment each and unlock the ending',()=>{const s=createState();assert.equal(finish(s),false);act(s,'dunes',0);assert.equal(s.puzzles.dunes.step,0);const answers={prism:[0,1,1,2,2,2],dunes:[2,0,1],isles:[1],mycelium:[0,2,1,0],clock:[0,0,1]};for(const [id,steps] of Object.entries(answers)){for(const step of steps)act(s,id,step);assert.equal(s.puzzles[id].solved,true);act(s,id,0);}assert.equal(countFragments(s),5);assert.equal(finish(s),true);const restored=createState(serialize(s));assert.equal(restored.ending,true);assert.equal(countFragments(restored),5);});
test('incomplete puzzle progress is retained and false endings are rejected',()=>{const s=createState();act(s,'prism',0);act(s,'mycelium',0);const copy=createState(serialize(s));assert.equal(copy.puzzles.prism.values[0],1);assert.equal(copy.puzzles.mycelium.step,1);assert.equal(createState({ending:true}).ending,false);});
