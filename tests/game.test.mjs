import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,walk,canWalk,candidate,startConversation,nextLine,serialize,PEOPLE} from '../dist/game.js';
test('the full street is freely walkable in both directions without meeting anyone',()=>{
 const s=createState();s.started=true;s.conversations=false;
 for(let i=0;i<390;i++)walk(s,1,0,.1);
 assert.ok(s.player.z<-86);assert.equal(s.met.size,0);assert.equal(s.conversation,null);
 for(let i=0;i<390;i++)walk(s,-1,0,.1);
 assert.ok(s.player.z>6);assert.equal('found' in serialize(s),false);assert.equal('ended' in serialize(s),false);
});
test('encounters require proximity and facing and can be completely disabled',()=>{
 const s=createState();s.started=true;s.player={x:0,z:-5.4,yaw:.4,pitch:0};
 assert.equal(candidate(s).id,'nagi');s.player.yaw=Math.PI;assert.equal(candidate(s),null);
 s.player.yaw=.4;s.conversations=false;assert.equal(candidate(s),null);assert.equal(startConversation(s,'nagi'),false);
});
test('a conversation advances, returns to walking and never repeats',()=>{
 const s=createState();s.started=true;
 assert.equal(startConversation(s,'nagi'),true);assert.equal(walk(s,1,0,.1),false);
 nextLine(s);assert.equal(s.conversation.line,1);nextLine(s);nextLine(s);
 assert.equal(s.conversation,null);assert.equal(walk(s,1,0,.1),true);assert.equal(startConversation(s,'nagi'),false);
});
test('skipped scenes and settings survive reload; interrupted scenes do not trap the player',()=>{
 const s=createState();s.started=true;startConversation(s,'ren');s.conversations=false;
 const copy=createState(serialize(s));assert.equal(copy.conversation,null);assert.equal(copy.conversations,false);assert.ok(copy.met.has('ren'));assert.ok(walk(copy,1,0,.1));
});
test('walls and people are solid, movement is camera-relative, pause works',()=>{
 assert.equal(canWalk(4,0),false);assert.equal(canWalk(PEOPLE[0].x,PEOPLE[0].z),false);
 const s=createState();s.started=true;s.player.yaw=Math.PI/2;const x=s.player.x;walk(s,1,0,.1);assert.ok(s.player.x<x);
 s.paused=true;const old={...s.player};walk(s,1,0,.1);assert.deepEqual(s.player,old);
});
test('corrupt saves are sanitized without reintroducing collectible objectives',()=>{
 const s=createState({player:{x:999,z:NaN,yaw:Infinity,pitch:9},met:['fake','aya','aya'],elapsed:-99});
 assert.deepEqual(s.player,{x:.1,z:7,yaw:0,pitch:0});assert.equal(s.met.size,1);assert.equal(s.elapsed,0);
});
