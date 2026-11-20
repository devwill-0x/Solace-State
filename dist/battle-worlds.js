import * as THREE from './vendor/three.module.js';
import { SWORD_POS, TETHERS } from './combat.js';

export function buildSwordPedestal(scene) {
  const group = new THREE.Group();
  group.position.set(SWORD_POS.x, 0, SWORD_POS.z);

  const dais = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.15, 0.28, 12),
    new THREE.MeshLambertMaterial({ color: 0x8995ab })
  );
  dais.position.y = 0.14;
  group.add(dais);

  const altar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.52, 0.72, 8),
    new THREE.MeshLambertMaterial({ color: 0xaab8d2 })
  );
  altar.position.y = 0.62;
  group.add(altar);

  const swordGroup = new THREE.Group();
  swordGroup.position.y = 1.48;

  const blade = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0xdff8ff })
  );
  blade.scale.set(0.42, 4.8, 0.22);
  blade.position.y = 0.42;
  swordGroup.add(blade);

  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.07, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xffe49c })
  );
  guard.position.y = -0.02;
  swordGroup.add(guard);

  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.04, 0.28, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff3d4 })
  );
  hilt.position.y = -0.18;
  swordGroup.add(hilt);

  const auraRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.025, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0x8ef2ff, transparent: true, opacity: 0.8 })
  );
  auraRing.rotation.x = Math.PI / 2;
  auraRing.position.y = 1.02;
  group.add(auraRing);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.34, 8.0, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x9cf4ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  beam.position.y = 4.2;
  group.add(beam);

  const glow = new THREE.PointLight(0xaef6ff, 12, 7.5, 2);
  glow.position.y = 1.75;
  group.add(glow);

  group.add(swordGroup);
  scene.add(group);

  return {
    group,
    update(time, collected) {
      swordGroup.visible = !collected;
      beam.visible = !collected;
      auraRing.visible = !collected;
      glow.intensity = collected ? 1.5 : 10 + Math.sin(time * 3.1) * 3;
      if (!collected) {
        swordGroup.rotation.y = time * 1.1;
        swordGroup.position.y = 1.48 + Math.sin(time * 2.2) * 0.09;
        auraRing.rotation.z = time * 0.9;
      }
    }
  };
}

export function buildTetherVisual(spec) {
  const group = new THREE.Group();
  group.position.set(spec.x, 0, spec.z);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.65, 0.32, 8),
    new THREE.MeshLambertMaterial({ color: 0x3b2a3c })
  );
  base.position.y = 0.16;
  group.add(base);

  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3b6e });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), coreMat);
  core.scale.set(0.85, 2.1, 0.85);
  core.position.y = 1.35;
  group.add(core);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xe62958,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 16, 8, 1, true), beamMat);
  beam.position.y = 8.2;
  group.add(beam);

  const chainRings = [];
  for (let i = 0; i < 3; i++) {
    const ringMat = new THREE.MeshBasicMaterial({ color: i === 1 ? 0xff759f : 0x5c193a });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.68 + i * 0.12, 0.038, 6, 20), ringMat);
    ring.position.y = 1.35;
    ring.rotation.x = i * 0.85;
    ring.rotation.y = i * 1.1;
    group.add(ring);
    chainRings.push({ ring, mat: ringMat });
  }

  const light = new THREE.PointLight(0xff427a, 10, 6.5, 2);
  light.position.y = 1.6;
  group.add(light);

  return {
    id: spec.id,
    group,
    update(time, isCut) {
      if (isCut) {
        coreMat.color.setHex(0xc8f7ff);
        beamMat.color.setHex(0xffe8b0);
        beamMat.opacity = 0.22;
        beam.scale.set(0.55, 1, 0.55);
        core.scale.set(0.55, 0.9, 0.55);
        core.position.y = 0.72 + Math.sin(time * 2.1) * 0.06;
        core.rotation.y = time * 0.7;
        light.color.setHex(0xfff0c4);
        light.intensity = 6;
        for (const c of chainRings) c.ring.visible = false;
      } else {
        coreMat.color.setHex(0xff3b6e);
        beamMat.color.setHex(0xe62958);
        beamMat.opacity = 0.38 + Math.sin(time * 5.2) * 0.12;
        beam.scale.set(1, 1, 1);
        core.scale.set(0.85, 2.1, 0.85);
        core.position.y = 1.35 + Math.sin(time * 3.5) * 0.1;
        core.rotation.y = -time * 1.9;
        light.color.setHex(0xff427a);
        light.intensity = 9 + Math.sin(time * 6) * 2.5;
        chainRings.forEach((c, idx) => {
          c.ring.visible = true;
          c.ring.rotation.z = time * (1.6 + idx * 0.7) * (idx % 2 ? 1 : -1);
          c.ring.rotation.x = 0.7 + Math.sin(time * 1.4 + idx) * 0.5;
        });
      }
    }
  };
}

function buildEnemyVisual(spec) {
  const root = new THREE.Group();
  const s = spec.boss ? 1.55 : 1.0;

  const bodyMat = new THREE.MeshBasicMaterial({ color: spec.boss ? 0xff407a : 0xc648ff });
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45 * s, 0), bodyMat);
  core.scale.set(0.9, 1.55, 0.9);
  core.position.y = 1.45 * s;
  root.add(core);

  const shellMat = new THREE.MeshBasicMaterial({ color: spec.boss ? 0xff9ec4 : 0xa078ff, wireframe: true });
  const outer = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68 * s, 0), shellMat);
  outer.position.y = 1.45 * s;
  root.add(outer);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff82ae });
  const rings = [];
  for (let i = 0; i < (spec.boss ? 3 : 2); i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry((0.82 + i * 0.2) * s, 0.032 * s, 6, 24), ringMat);
    r.position.y = 1.45 * s;
    r.rotation.x = i * 0.95;
    root.add(r);
    rings.push(r);
  }

  const telegraphMat = new THREE.MeshBasicMaterial({
    color: 0xff305a,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const telegraph = new THREE.Mesh(new THREE.RingGeometry(0.8 * s, 1.25 * s, 28), telegraphMat);
  telegraph.rotation.x = -Math.PI / 2;
  telegraph.position.y = 0.05;
  root.add(telegraph);

  return {
    id: spec.id,
    root,
    update(enemyState, time) {
      if (!enemyState || !enemyState.alive) {
        root.visible = false;
        return;
      }
      root.visible = true;
      root.position.set(enemyState.x, 0, enemyState.z);
      const bob = Math.sin(time * 3.1 + enemyState.phase) * 0.14;
      core.position.y = 1.45 * s + bob;
      outer.position.y = 1.45 * s + bob;
      core.rotation.y = time * 2.2;
      outer.rotation.y = -time * 1.4;
      outer.rotation.z = Math.sin(time + enemyState.phase) * 0.25;
      rings.forEach((r, i) => {
        r.position.y = 1.45 * s + bob;
        r.rotation.y = time * (1.8 + i * 0.8);
        r.rotation.z = time * (1.1 - i * 0.6);
      });

      const flash = enemyState.hitFlash > 0;
      bodyMat.color.setHex(flash ? 0xffffff : spec.boss ? 0xff407a : 0xc648ff);
      ringMat.color.setHex(flash ? 0xaaf8ff : 0xff82ae);
      const windup = Math.max(0, 1 - enemyState.attackTimer / 1.1);
      telegraphMat.opacity = 0.12 + windup * 0.55;
      telegraph.scale.setScalar(0.8 + windup * 0.45);
    }
  };
}

export function buildBattleArena(arena, createPortalFn) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(arena.sky);
  scene.fog = new THREE.Fog(arena.sky, 22, 95);

  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x1b1f34, 2.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe6cc, 1.8);
  key.position.set(-10, 22, -92);
  scene.add(key);

  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(13.5, 14.5, 0.4, 24),
    new THREE.MeshLambertMaterial({ color: arena.ground })
  );
  floor.position.set(0, -0.2, -99);
  scene.add(floor);

  const rimMat = new THREE.MeshBasicMaterial({ color: arena.color });
  for (const rad of [4.2, 8.2, 12.2]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.045, 6, 48), rimMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.04, -99);
    scene.add(ring);
  }

  // Ring of crystalline monolith pillars framing the colosseum
  const pillarCount = arena.id === 'arena3' ? 12 : 10;
  const pillars = [];
  for (let i = 0; i < pillarCount; i++) {
    const a = (i / pillarCount) * Math.PI * 2;
    const x = Math.cos(a) * 11.8;
    const z = -99 + Math.sin(a) * 11.8;
    if (Math.abs(x) < 2.2 && (z > -87.5 || z < -110.5)) continue;
    const h = 4.6 + (i % 3) * 1.1;
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, h, 0.85),
      new THREE.MeshLambertMaterial({ color: 0x3f4769 })
    );
    p.position.set(x, h / 2, z);
    p.rotation.y = -a;
    scene.add(p);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45, 0),
      new THREE.MeshBasicMaterial({ color: arena.color })
    );
    crystal.position.set(x, h + 0.7, z);
    scene.add(crystal);
    pillars.push(crystal);
  }

  // Exit portal (South z = -85)
  const exitPortal = createPortalFn(scene, 0, -85, Math.PI, arena.color);

  // North progressive portal gate (if not final tier)
  let nextPortal = null;
  let sealGroup = null;
  if (arena.next) {
    nextPortal = createPortalFn(scene, 0, -113, 0, arena.next === 'arena2' ? 0xd088ff : 0xffd37d);
    sealGroup = new THREE.Group();
    sealGroup.position.set(0, 1.9, -112.4);
    for (let i = -1; i <= 1; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xff3b6e })
      );
      bar.position.y = i * 0.72;
      bar.rotation.z = i * 0.28;
      sealGroup.add(bar);
    }
    scene.add(sealGroup);
  }

  // Street quick-return pedestal on Tier 2 & 3
  let shortcutOrb = null;
  if (arena.prev !== 'street') {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.85, 0.25, 12),
      new THREE.MeshLambertMaterial({ color: 0x8ea4c9 })
    );
    pad.position.set(-5.0, 0.12, -88.0);
    scene.add(pad);
    shortcutOrb = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshBasicMaterial({ color: 0xa5f5ff })
    );
    shortcutOrb.position.set(-5.0, 1.35, -88.0);
    scene.add(shortcutOrb);
  }

  // Tether anchors inside this battle realm
  const tetherVisuals = TETHERS.filter((t) => t.realm === arena.id).map((t) => {
    const vis = buildTetherVisual(t);
    scene.add(vis.group);
    return vis;
  });

  // Enemy meshes
  const enemyVisuals = arena.enemies.map((spec) => {
    const vis = buildEnemyVisual(spec);
    scene.add(vis.root);
    return vis;
  });

  // Heavenly particles inside arena when revealed in light
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    const a = i * 2.3999;
    const r = 1.5 + (i % 12);
    motePos.set([Math.cos(a) * r, 0.6 + (i % 9) * 0.8, -99 + Math.sin(a) * r], i * 3);
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: 0xffe8b5, size: 0.14 }));
  scene.add(motes);

  let lastHeaven = -1;
  scene.userData.update = (time, reduced, _puzzle, quest, runtime, heaven = 0) => {
    for (let i = 0; i < pillars.length; i++) {
      pillars[i].rotation.y = time * 0.9 + i;
    }
    if (shortcutOrb) {
      shortcutOrb.rotation.y = time * 1.4;
      shortcutOrb.position.y = 1.35 + Math.sin(time * 2.5) * 0.08;
    }
    for (const tv of tetherVisuals) {
      tv.update(time, !!quest?.tethers?.includes(tv.id));
    }
    if (sealGroup && arena.next) {
      const unlocked = (quest?.portalTier || 0) >= arena.nextTier;
      sealGroup.visible = !unlocked;
      if (nextPortal?.userData?.face) {
        nextPortal.userData.face.visible = unlocked;
      }
    }
    if (runtime && runtime.activeRealm === arena.id) {
      for (let i = 0; i < enemyVisuals.length; i++) {
        enemyVisuals[i].update(runtime.enemies[i], time);
      }
    }
    if (Math.abs(heaven - lastHeaven) > 0.02) {
      lastHeaven = heaven;
      const darkSky = new THREE.Color(arena.sky);
      const heavenSky = new THREE.Color(0xbce8ff);
      scene.background.copy(darkSky).lerp(heavenSky, heaven);
      scene.fog.color.copy(scene.background);
      floor.material.color.setHex(arena.ground).lerp(new THREE.Color(0xe6dcc8), heaven * 0.85);
      hemi.intensity = 2.1 + heaven * 1.1;
      key.color.setHex(0xffe6cc).lerp(new THREE.Color(0xfff4d6), heaven);
      key.intensity = 1.8 + heaven * 0.9;
      motes.visible = heaven > 0.05;
    }
    if (motes.visible && !reduced) {
      motes.rotation.y = time * 0.06;
    }
  };

  return { scene, exitPortal, nextPortal };
}
