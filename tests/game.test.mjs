import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,comforts,bench,findPath,isWalkable,interact,serialize,move} from '../dist/game.js';
test('every comfort and the ending can be reached on foot, without crossing the stream outside the bridge',()=>{
  const state=createState();state.started=true;
  for(const item of [...comforts,bench]){
    const path=findPath(state.player,{x:item.x,y:item.y+2});assert.ok(path.length,`${item.id} is reachable`);
    for(const step of path){assert.ok(isWalkable(step.x,step.y));assert.ok(Math.hypot(step.x-Math.round(state.player.x),step.y-Math.round(state.player.y))<=1);state.player=step;}
    const result=interact(state);assert.equal(result.id,item.id);
  }
  assert.equal(state.found.size,5);assert.equal(state.ended,true);
});
test('the bench requires all five comforts, and revisiting never duplicates progress',()=>{
  const state=createState();state.started=true;state.player={x:bench.x,y:bench.y};assert.equal(interact(state).locked,true);assert.equal(state.ended,false);
  state.player={x:comforts[0].x,y:comforts[0].y};interact(state);assert.equal(interact(state).revisited,true);assert.equal(state.found.size,1);
});
test('progress roundtrips and corrupt saves cannot create an unearned ending or invalid player',()=>{
  const state=createState();state.started=true;state.found.add('cat');state.player={x:60,y:60};
  assert.deepEqual(serialize(createState(JSON.parse(JSON.stringify(serialize(state))))),serialize(state));
  const bad=createState({found:['invented','cat','cat'],player:{x:null,y:Infinity},ended:true});assert.equal(bad.found.size,1);assert.equal(bad.ended,false);assert.deepEqual(bad.player,{x:43,y:73});
});
test('pause stops walking and the stream requires using the bridge',()=>{
  const state=createState();state.started=true;state.paused=true;assert.equal(move(state,1,0),false);assert.deepEqual(state.player,{x:43,y:73});
  assert.equal(isWalkable(110,73),false);assert.equal(isWalkable(110,62),true);assert.deepEqual(findPath({x:43,y:73},{x:110,y:73}),[]);
});
