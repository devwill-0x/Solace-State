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

test('portal changes realms and saved garden positions restore',()=>{const s=createState();s.started=true;s.player.x=3.0;s.player.z=-2;walk(s,0,1,.1);assert.equal(s.realm,'paint');assert.equal(createState(serialize(s)).realm,'paint');s.player.z=-85.1;s.player.yaw=0;walk(s,-1,0,.1);assert.equal(s.realm,'street');});

test('crossing preserves lateral offset, pitch and heading in both directions',()=>{const s=createState();s.started=true;s.player={x:3.1,z:-1.6,yaw:-Math.PI/2,pitch:.2};walk(s,1,0,.02);assert.equal(s.realm,'paint');assert.ok(Math.abs(s.player.x-.4)<1e-8);assert.ok(Math.abs(s.player.yaw)<1e-8);assert.equal(s.player.pitch,.2);walk(s,-1,0,.02);assert.equal(s.realm,'street');assert.ok(Math.abs(s.player.x-3.1)<1e-8);assert.ok(Math.abs(s.player.z+1.6)<1e-8);});

test('blossom portal preserves offset and returns to its own street doorway',()=>{const s=createState();s.started=true;s.player={x:3.1,z:-11.7,yaw:-Math.PI/2,pitch:.1};walk(s,1,0,.02);assert.equal(s.realm,'blossom');assert.equal(createState(serialize(s)).realm,'blossom');assert.ok(Math.abs(s.player.x-.3)<1e-8);walk(s,-1,0,.02);assert.equal(s.realm,'street');assert.ok(Math.abs(s.player.z+11.7)<1e-8);});

test('sprint is faster and a passenger ride pauses, completes, and avoids immediate reentry',()=>{const a=createState(),b=createState();a.started=b.started=true;b.sprinting=true;walk(a,1,0,.1);walk(b,1,0,.1);assert.ok(b.player.z<a.player.z);a.player={x:-1,z:-10,yaw:0,pitch:0};assert.ok(startRide(a));assert.equal(walk(a,1,0,.1),false);a.paused=true;updateRide(a,10);assert.equal(a.ride.time,0);a.paused=false;updateRide(a,51);assert.equal(a.ride,null);assert.equal(startRide(a),false);});

test('side courtyards connect to the main street and respect pond and tree collisions',()=>{assert.equal(canWalk(-5,-12),true);assert.equal(canWalk(5,-20),true);assert.equal(canWalk(-11,-12),false);assert.equal(canWalk(7,-22),false);assert.equal(canWalk(-7,-13),false);const s=createState({started:true,player:{x:-5,z:-12,yaw:0,pitch:0}});assert.equal(s.player.x,-5);});

import {WORLDS,MIRRORS,nearby,act,countFragments,finish,paintObject,addSplat,markCanvas,splatCanvas,PAINT_TARGETS,PAINT_SOLUTION,PAINT_COLORS} from '../dist/journey.js';
test('all five memory portals preserve position and return to their own doorway',()=>{for(const w of WORLDS){const s=createState();s.started=true;s.player={x:3.1,z:w.z+.2,yaw:-Math.PI/2,pitch:.15};walk(s,1,0,.02);assert.equal(s.realm,w.id);assert.equal(createState(serialize(s)).realm,w.id);walk(s,-1,0,.02);assert.equal(s.realm,'street');assert.ok(Math.abs(s.player.z-(w.z+.2))<1e-8);}});
test('five distinct puzzles grant one fragment each and unlock the ending',()=>{const s=createState();assert.equal(finish(s),false);act(s,'dunes',0);assert.equal(s.puzzles.dunes.step,0);const answers={prism:[0,1,1,2,2,2],dunes:[2,0,1],mycelium:[0,2,1,0],clock:[0,0,1]};for(const [id,steps] of Object.entries(answers)){for(const step of steps)act(s,id,step);assert.equal(s.puzzles[id].solved,true);act(s,id,0);}PAINT_TARGETS.forEach((t,i)=>paintObject(s,t,PAINT_SOLUTION[i]));assert.equal(s.puzzles.paint.solved,true);assert.equal(countFragments(s),5);assert.equal(finish(s),true);const restored=createState(serialize(s));assert.equal(restored.ending,true);assert.equal(countFragments(restored),5);});
test('incomplete puzzle progress is retained and false endings are rejected',()=>{const s=createState();act(s,'prism',0);act(s,'mycelium',0);const copy=createState(serialize(s));assert.equal(copy.puzzles.prism.values[0],1);assert.equal(copy.puzzles.mycelium.step,1);assert.equal(createState({ending:true}).ending,false);});
test('mirrors on the street and courtyards offer hallucination reflection prompts without blocking paths',()=>{for(const m of MIRRORS){const s=createState({started:true,player:{x:m.x+m.nx*.9,z:m.z,yaw:0,pitch:-1.1}});assert.equal(nearby(s),'mirror');assert.equal(s.player.pitch,-1.1);}});

import {BRUSH_POS,TETHERS,TETHER_GOAL,claimBrush,cutTether,toggleLightMode,createRuntimeCombat,performStroke,canEnterPortal} from '../dist/combat.js';
test('brush must be claimed before entering The Crucible battle room',()=>{
  const s=createState();s.started=true;
  assert.equal(canEnterPortal(s,'arena1'),false);
  s.player={x:3.1,z:-16,yaw:-Math.PI/2,pitch:0};
  walk(s,1,0,.02);
  assert.equal(s.realm,'street');
  s.player={x:BRUSH_POS.x,z:BRUSH_POS.z+.5,yaw:0,pitch:0};
  assert.equal(nearby(s),'brush');
  assert.equal(claimBrush(s),true);
  assert.equal(s.quest.brush,true);
  assert.equal(canEnterPortal(s,'arena1'),true);
  s.player={x:3.1,z:-16,yaw:-Math.PI/2,pitch:0};
  walk(s,1,0,.02);
  assert.equal(s.realm,'arena1');
});

test('cutting enough bad tethers unlocks the switch and progressive portals advance through battle tiers',()=>{
  const s=createState();s.started=true;
  claimBrush(s);
  const rt=createRuntimeCombat();
  // Enter Battle Room 1
  s.player={x:3.1,z:-16,yaw:-Math.PI/2,pitch:0};walk(s,1,0,.02);
  assert.equal(s.realm,'arena1');
  assert.equal(canEnterPortal(s,'arena2'),false);

  // Defeat enemies & slice both tethers in arena1 via performStroke
  performStroke(s,rt,0);
  rt.swingCooldown=0;
  for(const e of rt.enemies)e.alive=false;
  for(const tid of ['crucible-1','crucible-2']){
    const t=TETHERS.find(x=>x.id===tid);
    s.player={x:t.x,z:t.z+1.2,yaw:0,pitch:0};
    rt.swingCooldown=0;
    performStroke(s,rt,1);
  }
  assert.equal(canEnterPortal(s,'arena2'),true);
  // Step north through Progressive Portal II
  s.player={x:0,z:-112.9,yaw:0,pitch:0};
  walk(s,1,0,.1);
  assert.equal(s.realm,'arena2');
  assert.equal(canEnterPortal(s,'arena3'),false);

  // Sever additional bad tethers to reach TETHER_GOAL (6) and unlock Switch
  for(const tid of ['spire-1','spire-2','street-1','street-2']){
    cutTether(s,tid);
  }
  assert.equal(s.quest.tethers.length,TETHER_GOAL);
  assert.equal(s.quest.lightUnlocked,true);
  assert.equal(s.quest.lightMode,true);
  assert.equal(toggleLightMode(s),false);
  assert.equal(toggleLightMode(s),true);

  const restored=createState(serialize(s));
  assert.equal(restored.quest.brush,true);
  assert.equal(restored.quest.tethers.length,TETHER_GOAL);
  assert.equal(restored.quest.lightUnlocked,true);
  assert.equal(restored.quest.lightMode,true);
  assert.equal(restored.quest.portalTier>=2,true);
});

test('a full sprint step crosses the portal even when its endpoint lies past the street edge',()=>{
  const s=createState();
  s.started=s.sprinting=true;
  s.player={x:3.05,z:-2,yaw:-Math.PI/2,pitch:0};
  walk(s,1,0,.1);
  assert.equal(s.realm,'paint');
  assert.ok(Math.abs(s.player.z+85.44)<1e-8);
});

test('diagonal entry uses the opening at the crossing point',()=>{
  const s=createState();
  s.started=s.sprinting=true;
  s.player={x:3.1,z:-2+.97,yaw:-Math.PI/2,pitch:0};
  walk(s,1,-1,.1);
  assert.equal(s.realm,'paint');

  s.realm='street';
  s.player={x:3.1,z:-2+1.1,yaw:-Math.PI/2,pitch:0};
  walk(s,1,-1,.1);
  assert.equal(s.realm,'street');
  walk(s,1,0,.1);
  assert.equal(s.realm,'paint');
});

test('progressive portal round trips preserve position and view',()=>{
  const s=createState();
  s.started=true;
  claimBrush(s);
  s.quest.portalTier=3;
  for(const [from,to] of [['arena1','arena2'],['arena2','arena3']]){
    s.realm=from;
    s.player={x:.8,z:-112.9,yaw:0,pitch:.15};
    walk(s,1,0,.1);
    assert.equal(s.realm,to);
    assert.ok(Math.abs(s.player.z+85.18)<1e-8);
    assert.equal(s.player.yaw,0);
    assert.equal(s.player.pitch,.15);
    walk(s,-1,0,.1);
    assert.equal(s.realm,from);
    assert.ok(Math.abs(s.player.z+112.9)<1e-8);
  }
});

test('the garden memory returns only when gate, pond and tree wear their remembered colours',()=>{
  const s=createState();
  assert.equal(act(s,'paint',0),false);
  paintObject(s,'gate',1);paintObject(s,'pond',1);paintObject(s,'tree',2);
  assert.equal(s.puzzles.paint.solved,false);
  const r=paintObject(s,'gate',0);
  assert.equal(r.solvedNow,true);assert.equal(s.puzzles.paint.solved,true);
  assert.equal(paintObject(s,'gate',4).solvedNow,false);assert.equal(s.puzzles.paint.solved,true);
  assert.equal(paintObject(s,'lantern-2',3).painted,true);assert.equal(paintObject(s,'pond',99).painted,false);
});
test('painted garden marks and brush splats survive a reload and corrupt paint is dropped',()=>{
  const s=createState();
  paintObject(s,'bush-1',5);paintObject(s,'pond',1);
  for(let i=0;i<450;i++)addSplat(s,{x:i*.01,y:0,z:-90},{x:0,y:1,z:0},i%PAINT_COLORS.length);
  const r=createState(serialize(s));
  assert.equal(r.puzzles.paint.marks['bush-1'],5);assert.equal(r.puzzles.paint.values[1],2);
  assert.equal(r.puzzles.paint.splats.length,400);
  const bad=createState({puzzles:{paint:{marks:{'x':99,'<script>':1},splats:[[1,2],[0,0,0,0,1,0,77]],values:[9,-1,'a']}}});
  assert.deepEqual(bad.puzzles.paint.marks,{});assert.equal(bad.puzzles.paint.splats.length,0);assert.deepEqual(bad.puzzles.paint.values,[PAINT_COLORS.length,0,0]);
});
test('blossom valley opens north onto the black and white last platform and back',()=>{
  const s=createState({started:true,realm:'blossom',player:{x:.4,z:-112.9,yaw:0,pitch:.1}});
  assert.equal(s.realm,'blossom');
  walk(s,1,0,.1);
  assert.equal(s.realm,'platform');assert.ok(Math.abs(s.player.z+85.18)<1e-8);assert.equal(createState(serialize(s)).realm,'platform');
  s.player.x=2.3;walk(s,0,1,.1);assert.ok(s.player.x<2.35&&s.player.x>=2.3);
  s.player={x:.4,z:-85.1,yaw:0,pitch:0};walk(s,-1,0,.1);
  assert.equal(s.realm,'blossom');assert.ok(s.player.z<-112);
  s.player={x:0,z:-90,yaw:0,pitch:0};s.realm='platform';for(let i=0;i<30;i++)walk(s,-1,0,.1);assert.equal(s.realm,'blossom');
});
test('the parked car is solid and only starts a ride when asked',()=>{
  assert.equal(canWalk(-2,-10),false);assert.equal(canWalk(-1,-10),true);
  const s=createState({started:true,player:{x:-1,z:-10,yaw:0,pitch:0}});
  assert.equal(nearby(s),'car');
  for(let i=0;i<20;i++)walk(s,0,-1,.1);
  assert.ok(s.player.x>-1.26);assert.equal(s.ride,undefined);
});
test('older saves inside removed worlds wake up on the street',()=>{
  for(const realm of ['meadow','isles']){const s=createState({started:true,realm,player:{x:0,z:-90,yaw:0,pitch:0}});assert.equal(s.realm,'street');assert.deepEqual(s.player,START);}
  const s=createState({puzzles:{isles:{solved:true}},ending:true});assert.equal(s.ending,false);
});

test('the brush leaves paint on the street that survives a reload, and old sword saves become the brush',()=>{
  const s=createState();s.started=true;
  assert.equal(markCanvas(s,'street','12:40',2),true);assert.equal(markCanvas(s,'street','bad key',2),false);
  splatCanvas(s,'street',{x:1,y:0,z:-4},{x:0,y:1,z:0},3);
  const r=createState(serialize(s));
  assert.equal(r.canvas.street.marks['12:40'],2);assert.equal(r.canvas.street.splats.length,1);
  const junk=createState({puzzles:{_canvas:{street:{marks:{'1:1':99,'x':1},splats:[[0]]},nowhere:{marks:{'1:1':1}}}}});
  assert.deepEqual(junk.canvas,{street:{marks:{},splats:[]}});
  const old=createState({puzzles:{_quest:{sword:true}}});assert.equal(old.quest.brush,true);assert.equal(serialize(old).puzzles._quest.brush,true);
});
