import assert from 'node:assert/strict';
import {test} from 'node:test';
import {activateForestStation, FOREST, forestAllowed, forestTarget, STATIONS, TREES} from '../dist/forest.js';
import {createState, serialize, walk} from '../dist/game.js';
import {countFragments, nearby} from '../dist/journey.js';

test('the forest door returns to the old street and can be entered again',()=>{
  const state=createState({realm:FOREST.id,started:true});
  assert.equal(state.player.z,-87);
  state.player.z=-85.04;
  walk(state,-1,0,.1);
  assert.equal(state.realm,'street');
  assert.equal(state.player.z,FOREST.z);
  walk(state,1,0,.1);
  assert.equal(state.realm,FOREST.id);
});

test('the lamp and viewpoint open three gates in order and leave the street story intact',()=>{
  let state=createState({realm:FOREST.id,started:true});
  const initialFragments=countFragments(state);
  for(const [index,station] of STATIONS.entries()){
    assert.equal(forestAllowed(0,station.gate-.3,state.forest),false);
    state.player={x:station.x,z:station.z,pitch:0,yaw:Math.PI};
    assert.equal(nearby(state),'forest-hood');
    assert.ok(activateForestStation(state));
    assert.equal(state.forest.hooded,true);
    state=createState(serialize(state));
    assert.equal(state.forest.hooded,true);
    assert.equal(forestTarget(state),'forest-focus');
    activateForestStation(state);
    assert.equal(state.forest.stage,index);

    state.player.yaw=Math.atan2(station.x-station.glyphX,station.z-station.gate);
    assert.equal(nearby(state),'forest-align');
    assert.ok(activateForestStation(state));
    assert.equal(state.forest.stage,index+1);
    assert.equal(state.forest.hooded,false);
    assert.equal(forestAllowed(0,station.gate-.3,state.forest),true);
  }
  assert.equal(createState(serialize(state)).forest.stage,3);
  assert.equal(countFragments(state),initialFragments);
  assert.equal(state.ending,false);
});

test('woodland trunks block movement and invalid saved positions return to the start',()=>{
  const tree=TREES.find(tree=>Math.abs(tree.x)<6 && tree.z > -94);
  assert.equal(forestAllowed(tree.x,tree.z,{stage:0}),false);
  const state=createState({realm:FOREST.id,player:{x:0,z:-112,yaw:0,pitch:0},forest:{stage:-1}});
  assert.equal(state.forest.stage,0);
  assert.equal(state.player.z,-87);
});
