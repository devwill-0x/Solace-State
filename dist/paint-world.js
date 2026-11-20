import * as THREE from './vendor/three.module.js';
import { PAINT_COLORS, PAINT_TARGETS } from './journey.js';
import { prismMaterial } from './prism.js';
import { createSplatMeshes } from './paint-layer.js';

// The Unpainted Garden: a moonlit garden built only from greys. Every named object can be painted with
// the brush; colour turns into colour glyphs in the ASCII pass while the rest of the garden stays monochrome.
const rnd = (n) => { const v = Math.sin(n * 91.17 + 12.9) * 43758.5453; return v - Math.floor(v); };
const GREYS = [0x9a9a9a, 0x8a8a8a, 0xb4b4b4, 0x7a7a7a, 0xc4c4c4];

function canvasTexture(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildPaintGarden(w) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0b0b);
  scene.fog = new THREE.Fog(0x0b0b0b, 20, 78);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x262626, 1.35));
  const moonLight = new THREE.DirectionalLight(0xffffff, 1.7); moonLight.position.set(-8, 16, -78); scene.add(moonLight);

  // Raked gravel ground: concentric rake lines are drawn into the texture so they survive as ASCII strokes.
  const gravel = canvasTexture(512, 512, (c, W, H) => {
    c.fillStyle = '#3c3c3c'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { const v = 48 + rnd(i) * 40; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(rnd(i + 3) * W, rnd(i + 7) * H, 1.5, 1.5); }
    c.strokeStyle = '#626262'; c.lineWidth = 3;
    for (let y = 8; y < H; y += 22) { c.beginPath(); for (let x = 0; x <= W; x += 16) c.lineTo(x, y + Math.sin(x * 0.03 + y) * 2); c.stroke(); }
  });
  gravel.wrapS = gravel.wrapT = THREE.RepeatWrapping; gravel.repeat.set(9, 7);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 70), new THREE.MeshLambertMaterial({ map: gravel }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -102); scene.add(ground);

  const paintables = new THREE.Group(); scene.add(paintables);
  const objects = new Map(); // id -> {meshes, base, color, target}
  const register = (id, meshes, base) => {
    for (const m of meshes) { m.userData.paintId = id; m.material = m.userData.lambert = new THREE.MeshLambertMaterial({ color: base }); }
    objects.set(id, { meshes, base: new THREE.Color(base), color: new THREE.Color(base), goal: new THREE.Color(base), painted: -1 });
  };
  const mesh = (geo, x, y, z, parent = paintables) => { const m = new THREE.Mesh(geo); m.position.set(x, y, z); parent.add(m); return m; };

  // Stepping stones from the doorway to the altar and on toward the gate.
  const stoneGeo = new THREE.CylinderGeometry(0.62, 0.7, 0.12, 9);
  for (let i = 0; i < 13; i++) {
    const s = mesh(stoneGeo, Math.sin(i * 1.7) * 0.35, 0.06, -86.2 - i * 1.55);
    s.scale.set(1 + rnd(i) * 0.25, 1, 0.85 + rnd(i + 4) * 0.2);
    register('step-' + i, [s], 0xb8b8b8);
  }

  // Torii gate (memory target: vermilion).
  const gate = [];
  for (const x of [-2.5, 2.5]) { const p = mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.7, 14), x, 2.35, -105); gate.push(p); gate.push(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.3, 14), x, 0.15, -105)); }
  const kasagi = mesh(new THREE.BoxGeometry(7.2, 0.34, 0.55), 0, 4.78, -105); gate.push(kasagi);
  for (const s of [-1, 1]) { const tip = mesh(new THREE.BoxGeometry(0.9, 0.3, 0.55), s * 3.85, 4.92, -105); tip.rotation.z = s * 0.22; gate.push(tip); }
  gate.push(mesh(new THREE.BoxGeometry(6, 0.24, 0.3), 0, 3.92, -105));
  gate.push(mesh(new THREE.BoxGeometry(0.75, 0.9, 0.12), 0, 4.32, -104.85));
  register('gate', gate, 0x9e9e9e);

  // Moon pond (memory target: sky) with a ring of rim stones and a small arched bridge.
  const water = mesh(new THREE.CircleGeometry(3.4, 40), 7.6, 0.035, -99.5); water.rotation.x = -Math.PI / 2; water.scale.y = 0.8;
  register('pond', [water], 0x4c4c4c);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, r = mesh(new THREE.IcosahedronGeometry(0.42 + rnd(i) * 0.2, 0), 7.6 + Math.cos(a) * 3.65, 0.2, -99.5 + Math.sin(a) * 2.95);
    r.rotation.set(rnd(i + 1) * 3, rnd(i + 2) * 3, 0); register('rim-' + i, [r], GREYS[i % GREYS.length]);
  }
  const bridge = [];
  for (let i = 0; i < 9; i++) { const t = i / 8, b = mesh(new THREE.BoxGeometry(0.42, 0.1, 1.3), 4.9 + t * 5.4, 0.25 + Math.sin(t * Math.PI) * 0.65, -99.5); b.rotation.z = Math.cos(t * Math.PI) * 0.42; bridge.push(b); }
  register('bridge', bridge, 0x8e8e8e);

  // The old tree (memory target: blossom). Crown and trunk are painted separately.
  const trunk = [mesh(new THREE.CylinderGeometry(0.42, 0.75, 5.2, 10), -8, 2.6, -101.5)];
  for (const [ax, az, len] of [[0.7, 0.2, 2.6], [-0.8, 0.4, 2.3], [0.2, -0.9, 2.1]]) { const br = mesh(new THREE.CylinderGeometry(0.14, 0.28, len, 7), -8 + ax * 0.9, 4.6, -101.5 + az * 0.7); br.rotation.set(az * 0.9, 0, -ax * 0.9); trunk.push(br); }
  register('trunk', trunk, 0x6a6a6a);
  const crown = [];
  for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 1 + (i % 3) * 0.75; crown.push(mesh(new THREE.IcosahedronGeometry(1.35 + rnd(i) * 0.6, 1), -8 + Math.cos(a) * r, 5.6 + (i % 4) * 0.55, -101.5 + Math.sin(a) * r)); }
  register('tree', crown, 0xb2b2b2);

  // Stone lanterns (toro), bushes, boulders, a tea house, hanging paper lanterns, far mountains and the moon.
  const lantern = (id, x, z) => {
    const parts = [mesh(new THREE.BoxGeometry(0.75, 0.25, 0.75), x, 0.12, z), mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.1, 8), x, 0.8, z),
      mesh(new THREE.BoxGeometry(0.62, 0.55, 0.62), x, 1.6, z), mesh(new THREE.ConeGeometry(0.62, 0.5, 4), x, 2.15, z), mesh(new THREE.SphereGeometry(0.11, 8, 6), x, 2.45, z)];
    parts[3].rotation.y = Math.PI / 4; register(id, parts, 0xa8a8a8);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.64), new THREE.MeshBasicMaterial({ color: 0xe2e2e2 })); glow.position.set(x, 1.6, z); scene.add(glow);
  };
  [[-3.3, -90], [3.3, -90], [-3.3, -110.5], [3.3, -110.5], [11.8, -96], [-12.5, -109]].forEach(([x, z], i) => lantern('lantern-' + (i + 1), x, z));
  [[-4.6, -95], [4.4, -93.5], [-13, -97], [12.5, -106], [-5.5, -113], [6, -114.5], [14.5, -90], [-15, -89]].forEach(([x, z], i) => {
    const parts = []; for (let k = 0; k < 4; k++) parts.push(mesh(new THREE.IcosahedronGeometry(0.75 + rnd(i * 4 + k) * 0.4, 1), x + Math.cos(k * 1.9) * 0.7, 0.55 + (k % 2) * 0.3, z + Math.sin(k * 1.9) * 0.6));
    register('bush-' + (i + 1), parts, GREYS[(i + 1) % GREYS.length]);
  });
  [[-10.5, -92, 1.4], [10.2, -110, 1.7], [-3, -116, 1.1], [15.5, -101, 1.2], [-16, -104, 1.6]].forEach(([x, z, s], i) => {
    const r = mesh(new THREE.DodecahedronGeometry(s, 0), x, s * 0.55, z); r.scale.y = 0.7; r.rotation.y = i; register('rock-' + (i + 1), [r], 0x8b8b8b);
    const ring = new THREE.Mesh(new THREE.RingGeometry(s * 1.5, s * 1.62, 40), new THREE.MeshBasicMaterial({ color: 0x9c9c9c }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z); scene.add(ring);
  });
  const houseWall = [mesh(new THREE.BoxGeometry(5.2, 2.6, 4), 11, 1.3, -114), mesh(new THREE.BoxGeometry(0.15, 2.2, 3.4), 8.35, 1.15, -114)];
  register('house', houseWall, 0xa3a3a3);
  const roof = mesh(new THREE.ConeGeometry(4.6, 1.9, 4), 11, 3.55, -114); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.85;
  register('roof', [roof], 0x5e5e5e);
  for (let i = 0; i < 5; i++) {
    const t = i / 4, x = -6.2 + t * 6.8, y = 4.5 - Math.sin(t * Math.PI) * 0.55;
    const pl = mesh(new THREE.SphereGeometry(0.27, 12, 10), x, y - 0.45, -103.2); pl.scale.y = 1.3; register('paper-' + (i + 1), [pl], 0xd0d0d0);
  }
  const wire = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 25 }, (_, i) => { const t = i / 24; return new THREE.Vector3(-7.4 + t * 9.6, 4.6 - Math.sin(t * Math.PI) * 0.55, -103.2); }));
  scene.add(new THREE.Line(wire, new THREE.LineBasicMaterial({ color: 0x9a9a9a })));
  [[-30, -150, 26, 18], [6, -158, 34, 24], [38, -146, 24, 16], [-58, -138, 22, 14]].forEach(([x, z, r, h], i) => {
    const m = mesh(new THREE.ConeGeometry(r, h, 6), x, h / 2 - 1, z); register('mountain-' + (i + 1), [m], [0x5a5a5a, 0x4a4a4a, 0x626262, 0x545454][i]);
  });
  const moon = mesh(new THREE.SphereGeometry(4.2, 24, 16), -22, 30, -150); register('moon', [moon], 0xdedede);

  // The altar matches every other memory world; its three runes wear the colours painted on the targets.
  const altarMat = new THREE.MeshLambertMaterial({ color: 0x8e8e8e });
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.1, 0.35, 8), altarMat); dais.position.set(0, 0.15, -96); scene.add(dais);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.9, 1, 6), altarMat); pillar.position.set(0, 0.7, -96); scene.add(pillar);
  const runes = PAINT_TARGETS.map((_, i) => { const r = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshBasicMaterial({ color: 0x5a5a5a })); r.position.set((i - 1) * 0.9, 1.7, -96); scene.add(r); return r; });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color: 0xcfcfcf })); arch.position.set(0, 2.5, -98); scene.add(arch);

  // Drifting ash-grey petals; they take the colour of the last brush stroke once the memory returns.
  const petalPos = new Float32Array(220 * 3);
  for (let i = 0; i < 220; i++) petalPos.set([(rnd(i) - 0.5) * 36, 0.3 + rnd(i + 9) * 7, -86 - rnd(i + 17) * 32], i * 3);
  const petalGeo = new THREE.BufferGeometry(); petalGeo.setAttribute('position', new THREE.BufferAttribute(petalPos, 3));
  const petals = new THREE.Points(petalGeo, new THREE.PointsMaterial({ color: 0xbdbdbd, size: 0.09 })); scene.add(petals);

  // Brush splats (solid colours and Prism), rebuilt only when the saved splat list changes.
  const syncSplats = createSplatMeshes(scene);
  const tmpColor = new THREE.Color();

  const raycaster = new THREE.Raycaster(), center = new THREE.Vector2(0, 0);
  const hitTargets = [paintables, ground, dais, pillar];
  let lastTime = 0, solved = false;
  scene.userData.paint = {
    // Returns what the centre of the view touches: a paintable object id (or null for bare ground) and the surface point/normal.
    pick(camera) {
      raycaster.setFromCamera(center, camera); raycaster.far = 70;
      const hit = raycaster.intersectObjects(hitTargets, true)[0];
      if (!hit) return null;
      const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
      if (normal.dot(raycaster.ray.direction) > 0) normal.negate();
      return { id: hit.object.userData.paintId || null, point: hit.point, normal, distance: hit.distance };
    }
  };
  scene.userData.update = (time, reduced, puzzle) => {
    const dt = Math.min(0.1, Math.max(0, time - lastTime)); lastTime = time;
    if (puzzle) {
      for (const [id, o] of objects) {
        const t = PAINT_TARGETS.indexOf(id), c = t >= 0 ? puzzle.values[t] - 1 : (puzzle.marks?.[id] ?? -1);
        if (c !== o.painted) {
          o.painted = c;
          // Prism paint swaps in the rainbow material; solid colours fade in on the object's own material.
          const prism = c >= 0 && PAINT_COLORS[c].prism;
          for (const m of o.meshes) m.material = prism ? prismMaterial() : m.userData.lambert;
          if (!prism) o.goal.copy(c >= 0 ? tmpColor.setHex(PAINT_COLORS[c].hex) : o.base);
        }
        if (!o.color.equals(o.goal)) {
          o.color.lerp(o.goal, Math.min(1, dt * 4 + 0.02));
          if (Math.abs(o.color.r - o.goal.r) + Math.abs(o.color.g - o.goal.g) + Math.abs(o.color.b - o.goal.b) < 0.01) o.color.copy(o.goal);
          for (const m of o.meshes) { m.userData.lambert.color.copy(o.color); m.userData.lambert.emissive.copy(o.color).multiplyScalar(o.painted >= 0 ? 0.28 : 0); }
        }
      }
      runes.forEach((r, i) => { const c = puzzle.values[i] - 1; if (c >= 0 && PAINT_COLORS[c].prism) r.material.color.setHSL((time * 0.2 + i * 0.3) % 1, 1, 0.5); else r.material.color.setHex(c >= 0 ? PAINT_COLORS[c].hex : 0x5a5a5a); r.scale.setScalar(puzzle.solved ? 1.35 : 1); if (!reduced) r.rotation.y = time * 0.6 + i; });
      syncSplats(puzzle.splats || [], 0.22, 0.22);
      if (puzzle.solved !== solved) { solved = puzzle.solved; petals.material.color.setHex(solved ? 0xff9fd0 : 0xbdbdbd); petals.material.size = solved ? 0.12 : 0.09; }
    }
    if (!reduced) {
      arch.rotation.y = time * 0.12;
      const pos = petalGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) { let y = pos.getY(i) - dt * (0.25 + (i % 5) * 0.06); if (y < 0.05) y = 7; pos.setY(i, y); pos.setX(i, pos.getX(i) + Math.sin(time * 0.7 + i) * dt * 0.12); }
      pos.needsUpdate = true;
    }
  };
  return scene;
}
