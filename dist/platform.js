import * as THREE from './vendor/three.module.js';
import { batchStatic } from './batch.js';

// The Last Platform: a monochrome terminus reached through the far gate of the blossom valley.
// Everything is grey on purpose so it reads as the same black-and-white ASCII as the street.
const rnd = (n) => { const v = Math.sin(n * 57.31 + 4.1) * 43758.5453; return v - Math.floor(v); };
function canvasTexture(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildPlatform() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040404);
  scene.fog = new THREE.FogExp2(0x050505, 0.03);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  scene.add(new THREE.HemisphereLight(0xc9c9c9, 0x262626, 0.95));

  const mats = new Map(), mat = (c, basic = false) => { const k = c + (basic ? 'b' : 'l'); if (!mats.has(k)) mats.set(k, basic ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshLambertMaterial({ color: c })); return mats.get(k); };
  const box = (x, y, z, w, h, d, c, basic = false) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, basic)); m.position.set(x, y, z); scene.add(m); return m; };
  const plane = (x, y, z, w, h, map, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };

  // Platform slab with tiled concrete, tactile strip and the painted edge line.
  const tiles = canvasTexture(256, 256, (c, W, H) => {
    c.fillStyle = '#5c5c5c'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 6000; i++) { const v = 70 + rnd(i) * 50; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(rnd(i + 1) * W, rnd(i + 2) * H, 1.5, 1.5); }
    c.strokeStyle = '#2c2c2c'; c.lineWidth = 3; for (let p = 0; p <= W; p += 64) { c.beginPath(); c.moveTo(p, 0); c.lineTo(p, H); c.stroke(); c.beginPath(); c.moveTo(0, p); c.lineTo(W, p); c.stroke(); }
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(3, 20);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.2, 40), [mat(0x555555), mat(0x555555), new THREE.MeshLambertMaterial({ map: tiles }), mat(0x555555), mat(0x555555), mat(0x555555)]);
  slab.position.set(-0.1, -0.6, -101); scene.add(slab);
  for (let z = -82; z > -121; z -= 0.5) box(2.05, 0.012, z, 0.3, 0.02, 0.3, 0x9d9d9d);
  box(2.62, 0.015, -101, 0.12, 0.02, 40, 0xdcdcdc);

  // Track bed, rails and sleepers below the platform edge.
  box(5.2, -1.15, -101, 5.5, 0.1, 60, 0x2a2a2a);
  for (const x of [4.15, 5.55]) box(x, -0.98, -101, 0.09, 0.14, 60, 0x9a9a9a);
  for (let z = -72; z > -132; z -= 0.9) box(4.85, -1.06, z, 2.3, 0.08, 0.28, 0x434343);

  // The waiting train: lit windows, door frames and one open door.
  const carriage = (z0) => {
    box(4.85, 0.95, z0, 2.9, 3.3, 13.2, 0x8a8a8a);
    box(4.85, 2.72, z0, 2.7, 0.25, 13, 0x6f6f6f);
    box(3.39, -0.55, z0, 0.04, 0.35, 13, 0x444444);
    for (let k = 0; k < 5; k++) { const wz = z0 - 5.2 + k * 2.6; box(3.3, 1.35, wz, 0.04, 0.9, 1.5, 0xe7e7e7, true); box(3.37, 1.35, wz, 0.05, 1.04, 1.64, 0x3a3a3a); }
    box(3.38, 0.55, z0, 0.04, 0.12, 13.1, 0x2e2e2e);
  };
  carriage(-94); carriage(-108);
  box(3.36, 0.6, -101, 0.05, 2.5, 1.6, 0x1e1e1e);
  box(3.3, 0.6, -108.2, 0.05, 2.3, 1.3, 0xf2f2f2, true); // open, lit door
  box(4.85, 3.05, -101, 0.25, 0.5, 0.25, 0x5a5a5a);
  const pant = []; for (let i = 0; i < 2; i++) pant.push(new THREE.Vector3(4.85 + (i ? 0.6 : -0.6), 3.3, -101), new THREE.Vector3(4.85, 4.35, -101));
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pant), new THREE.LineBasicMaterial({ color: 0x9b9b9b })));
  const wires = []; for (const y of [4.4, 4.75]) for (let z = -70; z > -132; z -= 2) wires.push(new THREE.Vector3(4.85, y - Math.sin(((z + 70) / 12) * Math.PI) ** 2 * 0.12, z), new THREE.Vector3(4.85, y - Math.sin(((z - 2 + 70) / 12) * Math.PI) ** 2 * 0.12, z - 2));
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wires), new THREE.LineBasicMaterial({ color: 0x7d7d7d })));

  // Canopy: pillars, roof, hanging lamps that pool light on the tiles.
  for (let z = -88; z >= -116; z -= 7) {
    box(-1.95, 2.1, z, 0.28, 4.2, 0.28, 0x9a9a9a);
    box(-0.2, 4.25, z, 5.8, 0.16, 0.3, 0x7b7b7b);
    const lamp = box(0.2, 3.85, z + 3.5, 0.18, 0.08, 2.2, 0xf4f4f4, true);
    const l = new THREE.PointLight(0xffffff, 7, 9, 2); l.position.set(0.2, 3.6, lamp.position.z); scene.add(l);
  }
  box(-0.2, 4.45, -101, 6.4, 0.18, 38, 0x3e3e3e);

  // Station boards: name sign, departures and a clock stopped before morning.
  const signTex = canvasTexture(512, 160, (c, W, H) => {
    c.fillStyle = '#d6d6d6'; c.fillRect(0, 0, W, H); c.fillStyle = '#141414'; c.textAlign = 'center';
    c.font = 'bold 64px serif'; c.fillText('終点', W / 2, 72); c.font = '26px monospace'; c.fillText('TERMINUS', W / 2, 108);
    c.font = '22px serif'; c.textAlign = 'left'; c.fillText('← 雨のあと', 16, 146); c.textAlign = 'right'; c.fillText('朝 →', W - 16, 146);
  });
  box(0, 3.35, -96, 2.7, 0.92, 0.08, 0x2a2a2a); plane(0, 3.35, -95.95, 2.56, 0.8, signTex); plane(0, 3.35, -96.05, 2.56, 0.8, signTex, Math.PI);
  for (const x of [-1.1, 1.1]) box(x, 3.95, -96, 0.03, 0.55, 0.03, 0x8a8a8a);
  const boardTex = canvasTexture(512, 192, (c, W, H) => {
    c.fillStyle = '#0d0d0d'; c.fillRect(0, 0, W, H); c.fillStyle = '#e8e8e8'; c.font = '26px monospace';
    c.fillText('LAST TRAIN   00:42', 22, 48); c.fillText('FOR          MORNING', 22, 92); c.fillText('STATUS       DELAYED', 22, 136);
    c.fillStyle = '#9a9a9a'; c.font = '18px monospace'; c.fillText('UNTIL YOU ARE READY', 22, 172);
  });
  box(-2.75, 2.6, -104, 0.1, 1.15, 2.9, 0x2b2b2b); plane(-2.69, 2.6, -104, 2.75, 1.03, boardTex, Math.PI / 2);
  const clockTex = canvasTexture(256, 256, (c, W, H) => {
    c.fillStyle = '#e6e6e6'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill(); c.strokeStyle = '#1b1b1b'; c.lineWidth = 8; c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.lineWidth = i % 3 ? 4 : 9; c.beginPath(); c.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); c.lineTo(128 + Math.sin(a) * 110, 128 - Math.cos(a) * 110); c.stroke(); }
    const hand = (a, len, wdt) => { c.lineWidth = wdt; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len); c.stroke(); };
    hand((4 + 44 / 60) / 12 * Math.PI * 2, 58, 10); hand(44 / 60 * Math.PI * 2, 88, 6);
  });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ map: clockTex, side: THREE.DoubleSide })); clock.position.set(0.6, 3.5, -109); scene.add(clock);
  box(0.6, 4.1, -109, 0.04, 0.5, 0.04, 0x8a8a8a);

  // Benches, a vending machine and a rubbish bin along the back wall.
  const bench = (z) => { box(-1.75, 0.46, z, 0.62, 0.1, 2.2, 0xa4a4a4); box(-2.02, 0.82, z, 0.08, 0.6, 2.2, 0x8f8f8f); for (const dz of [-0.85, 0.85]) box(-1.75, 0.22, z + dz, 0.5, 0.44, 0.1, 0x4a4a4a); };
  bench(-101); bench(-112);
  box(-2.55, 1.1, -92, 0.8, 2.2, 1.2, 0x9c9c9c);
  const vend = canvasTexture(128, 224, (c, W, H) => { c.fillStyle = '#e4e4e4'; c.fillRect(0, 0, W, H); c.fillStyle = '#1c1c1c'; c.fillRect(8, 10, 112, 120); for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? '#bbbbbb' : '#f5f5f5'; c.fillRect(16 + x * 26, 18 + y * 38, 16, 26); } c.fillStyle = '#2a2a2a'; c.fillRect(20, 168, 88, 30); });
  plane(-2.14, 1.1, -92, 1.15, 2.1, vend, Math.PI / 2);
  const vl = new THREE.PointLight(0xffffff, 5, 4, 2); vl.position.set(-1.6, 1.3, -92); scene.add(vl);
  box(-2.6, 0.45, -106.5, 0.5, 0.9, 0.5, 0x6b6b6b);

  // Back wall with posters; beyond it, a sleeping city of lit windows.
  box(-3.15, 2.2, -101, 0.2, 4.4, 40, 0x6a6a6a);
  const posterTex = (i) => canvasTexture(128, 180, (c, W, H) => { c.fillStyle = ['#cfcfcf', '#a9a9a9', '#dedede'][i % 3]; c.fillRect(0, 0, W, H); c.fillStyle = '#1e1e1e'; c.font = 'bold 30px serif'; c.textAlign = 'center'; c.fillText(['夜行', '海へ', '朝市'][i % 3], W / 2, 60); c.fillRect(20, 84, 88, 60); c.font = '12px monospace'; c.fillText(['NIGHT LINE', 'TO THE SEA', 'MORNING MARKET'][i % 3], W / 2, 166); });
  [-90, -97.5, -114].forEach((z, i) => plane(-3.03, 1.7, z, 0.95, 1.33, posterTex(i), Math.PI / 2));
  for (let i = 0; i < 26; i++) {
    const h = 6 + rnd(i) * 18, x = -14 - rnd(i + 3) * 18, z = -70 - i * 3.2;
    box(x, h / 2 - 2, z, 4 + rnd(i + 5) * 4, h, 3, 0x1d1d1d);
    for (let k = 0; k < 5; k++) if (rnd(i * 7 + k) > 0.55) box(x + 2.2, 1 + rnd(i + k) * (h - 3), z + (rnd(k + i) - 0.5) * 2, 0.05, 0.35, 0.5, 0xd8d8d8, true);
  }
  for (let i = 0; i < 18; i++) { const h = 8 + rnd(i + 40) * 14; box(18 + rnd(i + 2) * 14, h / 2 - 2, -68 - i * 4, 5, h, 3, 0x191919); }

  // End of the line: buffer stop and a railing.
  box(-0.1, 0.55, -120.4, 6, 1.1, 0.12, 0x8d8d8d);
  for (let x = -2.9; x <= 2.7; x += 0.5) box(x, 0.55, -120.4, 0.06, 1.1, 0.06, 0x5a5a5a);
  box(4.85, -0.4, -125, 2.2, 1.1, 0.6, 0x737373);

  batchStatic(scene);

  // Rain is the only motion here.
  const count = 520, pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) { const x = 2.7 + rnd(i) * 9, y = rnd(i + 4) * 9 - 1, z = -78 - rnd(i + 9) * 50; pos.set([x, y, z, x - 0.02, y - 0.3, z], i * 6); }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x8a8a8a, transparent: true, opacity: 0.5 })));
  let last = 0;
  scene.userData.update = (time, reduced) => {
    const dt = Math.min(0.1, Math.max(0, time - last)); last = time;
    if (reduced) return;
    const p = rainGeo.attributes.position;
    for (let i = 0; i < p.count; i += 2) { let y = p.getY(i) - dt * 7; if (y < -1.1) y = 8; p.setY(i, y); p.setY(i + 1, y - 0.3); }
    p.needsUpdate = true;
  };
  return scene;
}
