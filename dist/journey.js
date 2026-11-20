import { ARENAS, BRUSH_POS, TETHERS, createQuest, canEnterPortal } from './combat.js';

import { FOREST, forestTarget } from './forest.js';

// Brush colours for The Unpainted Garden. Saturated so the ASCII pass renders them as colour glyphs.
export const PAINT_COLORS = [
  { name: 'Vermilion', hex: 0xff4a2e },
  { name: 'Sky', hex: 0x3fa9ff },
  { name: 'Blossom', hex: 0xff8fc8 },
  { name: 'Leaf', hex: 0x4fd06a },
  { name: 'Gold', hex: 0xffcc33 },
  { name: 'Violet', hex: 0x9a6bff },
  // Prism: the rainbow of the player's glass reflection. Rendered by prism.js, glitched by the ASCII pass.
  { name: 'Prism', hex: 0xffffff, prism: true }
];
export const PRISM = 6;
// Order shown in the HUD and on the number keys: Prism first.
export const PAINT_ORDER = [6, 0, 1, 2, 3, 4, 5];
// Painting these three restores the garden's memory: gate vermilion, pond sky, tree blossom.
export const PAINT_TARGETS = ['gate', 'pond', 'tree'];
export const PAINT_SOLUTION = [0, 1, 2];
export const MAX_SPLATS = 400;
export const MAX_MARKS = 300;

export const WORLDS = [
  { id: 'prism', name: 'The Glass Tide', z: 4, color: 0x57e1ed, sky: 0x182947, ground: 0x365b78, kind: 'align', labels: ['First prism', 'Second prism', 'Third prism'], clue: 'Three beams enter the tide. The first bends once. The next bends twice. The last bends three times. Align each prism; four turns return it to zero.', fragment: 'The street did not disappear. I folded it away when every familiar doorway began to hurt.' },
  { id: 'paint', name: 'The Unpainted Garden', z: -2, color: 0xd8d8d8, mono: true, kind: 'paint', labels: ['Torii gate', 'Moon pond', 'Old tree'], clue: 'The gardener carved three colours into the stone: "The gate burned like a winter sunset. The pond held the whole sky. The old tree remembered spring." Paint each one with the brush. A wrong colour can always be painted over.', fragment: 'I painted everything grey so nothing could clash with how I felt. Colour was never the enemy. It was the part of me still asking to be seen.' },
  { id: 'dunes', name: 'The Inverted Hour', z: -5, color: 0xffbb69, sky: 0x673762, ground: 0xd29a69, kind: 'sequence', labels: ['Dawn', 'Noon', 'Dusk'], clue: 'The buried inscription reads: "Begin where the day ends. Find its beginning. Rest at its brightest hour." A wrong bell clears the sequence.', fragment: 'I called this place a refuge. Then I made the night repeat, so nothing else could change.' },
  { id: 'mycelium', name: 'The Listening Wood', z: -27, color: 0xe875ca, sky: 0x102b38, ground: 0x325957, kind: 'memory', labels: ['Root', 'Rain', 'Moon'], clue: 'A voice beneath the caps repeats: "Root remembers Moon. Rain remembers Root." Play the four named notes in that order. A wrong note starts the echo again.', fragment: 'The things I lost were not asking me to stay lost with them. That was a promise I had made alone.' },
  { id: 'clock', name: 'The Borrowed Tomorrow', z: -32, color: 0xe7cd7d, sky: 0x324453, ground: 0x7c7967, kind: 'balance', labels: ['Add two hours', 'Add three hours', 'Release one hour'], clue: 'The clock has no hands. Its inscription says: "Tomorrow begins at seven. Borrow two, borrow three, or let one go." Balance the counter at seven.', fragment: 'Morning is not a cure. It is simply another place to begin. I can carry what happened without living inside it.' }
];

// Places reached through another place's far gate rather than from the street.
export const CHAINS = [{ from: 'blossom', to: 'platform' }];
export const AREAS = [{ id: 'platform', name: 'The Last Platform', mono: true }];

export const LINKS = [FOREST, { id: 'blossom', z: -12 }, ...WORLDS, { id: 'arena1', z: -16 }];
export const REALM_IDS = new Set([...LINKS.map((l) => l.id), ...ARENAS.map((a) => a.id), ...AREAS.map((a) => a.id)]);

// Solid scenery in the two monochrome places: circles [x, z, r] and boxes [x0, x1, z0, z1].
const COLLIDERS = {
  paint: {
    circles: [[-8, -101.5, 0.95], [-2.5, -105, 0.42], [2.5, -105, 0.42], [0, -96, 1.0],
      [-3.3, -90, 0.55], [3.3, -90, 0.55], [-3.3, -110.5, 0.55], [3.3, -110.5, 0.55], [11.8, -96, 0.55], [-12.5, -109, 0.55],
      [-4.6, -95, 1.05], [4.4, -93.5, 1.05], [-13, -97, 1.05], [12.5, -106, 1.05], [-5.5, -113, 1.05], [6, -114.5, 1.05], [14.5, -90, 1.05], [-15, -89, 1.05],
      [-10.5, -92, 1.45], [10.2, -110, 1.75], [-3, -116, 1.15], [15.5, -101, 1.25], [-16, -104, 1.65]],
    boxes: [[8.3, 13.7, -116.1, -111.9]],
    // The moon pond can only be crossed on its little bridge.
    blocked: (x, z) => ((x - 7.6) / 3.55) ** 2 + ((z + 99.5) / 2.85) ** 2 < 1 && Math.abs(z + 99.5) > 0.6
  },
  platform: {
    circles: [-88, -95, -102, -109, -116].map((z) => [-1.95, z, 0.3]).concat([[-2.6, -106.5, 0.38]]),
    boxes: [[-2.12, -1.38, -102.15, -99.85], [-2.12, -1.38, -113.15, -110.85], [-3.2, -2.05, -92.7, -91.3]]
  }
};

// Walkable area for every realm that is not the street or a battle room.
export function fieldAllowed(realm, x, z) {
  const inside = realm === 'platform' ? x > -2.55 && x < 2.35 && z > -117.5 && z < -82 : Math.abs(x) < 20 && z > -119 && z < -82;
  const solid = COLLIDERS[realm];
  if (!inside || !solid) return inside;
  if (solid.circles.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) return false;
  if (solid.boxes.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) return false;
  return !solid.blocked?.(x, z);
}

export const initialPuzzle = (id) => (id === 'paint'
  ? { values: [0, 0, 0], step: 0, total: 0, solved: false, miss: false, marks: {}, splats: [] }
  : { values: [0, 0, 0], step: 0, total: 0, solved: false, miss: false });

const intIn = (v, lo, hi, fallback = 0) => (Number.isInteger(v) ? Math.max(lo, Math.min(hi, v)) : fallback);

const isColor = (c) => Number.isInteger(c) && c >= 0 && c < PAINT_COLORS.length;
function restoreSplats(list) {
  return Array.isArray(list) ? list.filter((s) => Array.isArray(s) && s.length === 7 && s.every(Number.isFinite) && isColor(s[6])).slice(-MAX_SPLATS) : [];
}

// Paint left on the street and the other places (the garden keeps its own puzzle record).
function restoreCanvas(raw) {
  const canvas = {};
  if (!raw || typeof raw !== 'object') return canvas;
  for (const [realm, c] of Object.entries(raw)) {
    if (realm === 'paint' || (realm !== 'street' && !REALM_IDS.has(realm))) continue;
    const marks = {};
    if (c?.marks && typeof c.marks === 'object') {
      for (const [key, color] of Object.entries(c.marks).slice(-MAX_MARKS)) if (/^\d{1,5}:-?\d{1,6}$/.test(key) && isColor(color)) marks[key] = color;
    }
    canvas[realm] = { marks, splats: restoreSplats(c?.splats) };
  }
  return canvas;
}

export function canvasFor(s, realm) {
  s.canvas ??= {};
  return (s.canvas[realm] ??= { marks: {}, splats: [] });
}

export function markCanvas(s, realm, key, color) {
  if (!isColor(color) || !/^\d{1,5}:-?\d{1,6}$/.test(key)) return false;
  const c = canvasFor(s, realm);
  delete c.marks[key]; c.marks[key] = color;
  const keys = Object.keys(c.marks);
  if (keys.length > MAX_MARKS) delete c.marks[keys[0]];
  return true;
}

function pushSplat(list, point, normal, color) {
  const r = (v) => Math.round(v * 100) / 100;
  list.push([r(point.x), r(point.y), r(point.z), r(normal.x), r(normal.y), r(normal.z), color]);
  if (list.length > MAX_SPLATS) list.splice(0, list.length - MAX_SPLATS);
}

export function splatCanvas(s, realm, point, normal, color) {
  if (!isColor(color)) return;
  pushSplat(canvasFor(s, realm).splats, point, normal, color);
}

function restorePaint(p) {
  const marks = {};
  if (p?.marks && typeof p.marks === 'object') {
    for (const [id, c] of Object.entries(p.marks)) {
      if (/^[a-z0-9-]{1,24}$/.test(id) && Number.isInteger(c) && c >= 0 && c < PAINT_COLORS.length) marks[id] = c;
    }
  }
  const splats = restoreSplats(p?.splats);
  const values = [0, 1, 2].map((i) => intIn(p?.values?.[i], 0, PAINT_COLORS.length));
  return { values, step: 0, total: 0, solved: values.every((v, i) => v === PAINT_SOLUTION[i] + 1), miss: false, marks, splats };
}

export function restoreJourney(saved) {
  const puzzles = {};
  for (const w of WORLDS) {
    const p = saved?.puzzles?.[w.id];
    if (w.kind === 'paint') { puzzles[w.id] = restorePaint(p); continue; }
    puzzles[w.id] = {
      values: [0, 1, 2].map((i) => intIn(p?.values?.[i], 0, 3)),
      step: intIn(p?.step, 0, 4),
      total: intIn(p?.total, -20, 20),
      solved: p?.solved === true,
      miss: false
    };
  }
  const quest = createQuest(saved?.puzzles?._quest || saved?.quest);
  return { puzzles, quest, canvas: restoreCanvas(saved?.puzzles?._canvas), ending: saved?.ending === true && WORLDS.every((w) => puzzles[w.id].solved) };
}

export function countFragments(s) {
  return WORLDS.filter((w) => s.puzzles[w.id].solved).length;
}

export function act(s, id, index) {
  const w = WORLDS.find((world) => world.id === id);
  const p = s.puzzles[id];
  if (!w || !p || p.solved || w.kind === 'paint' || ![0, 1, 2].includes(index)) return false;
  p.miss = false;
  if (w.kind === 'align') {
    p.values[index] = (p.values[index] + 1) % 4;
    p.solved = p.values.every((v, i) => v === i + 1);
  }
  if (w.kind === 'lights') {
    for (let i = Math.max(0, index - 1); i <= Math.min(2, index + 1); i++) p.values[i] = 1 - p.values[i];
    p.solved = p.values.every((v) => v === 1);
  }
  if (w.kind === 'sequence' || w.kind === 'memory') {
    const answer = w.kind === 'sequence' ? [2, 0, 1] : [0, 2, 1, 0];
    if (index === answer[p.step]) p.step++;
    else { p.step = 0; p.miss = true; }
    p.solved = p.step === answer.length;
  }
  if (w.kind === 'balance') {
    p.total = Math.max(-20, Math.min(20, p.total + [2, 3, -1][index]));
    p.solved = p.total === 7;
  }
  return p.solved;
}

// Paint one garden object. Returns {solvedNow} so the caller can celebrate the moment the memory returns.
export function paintObject(s, objectId, color) {
  const p = s.puzzles?.paint;
  if (!p || typeof objectId !== 'string' || !Number.isInteger(color) || color < 0 || color >= PAINT_COLORS.length) return { painted: false, solvedNow: false };
  const was = p.solved;
  const target = PAINT_TARGETS.indexOf(objectId);
  if (target >= 0) p.values[target] = color + 1;
  else p.marks[objectId] = color;
  // Once recovered, the memory stays recovered even if the garden is repainted for fun.
  p.solved = was || p.values.every((v, i) => v === PAINT_SOLUTION[i] + 1);
  return { painted: true, solvedNow: !was && p.solved };
}

export function addSplat(s, point, normal, color) {
  const p = s.puzzles?.paint;
  if (!p) return;
  pushSplat(p.splats, point, normal, color);
}

export const MIRRORS = [
  { id: 'mirror-street', x: -3.25, y: 1.38, z: -3.5, side: -1, nx: 1, nz: 0, w: 1.35, h: 2.35 },
  { id: 'mirror-tea', x: -9.35, y: 1.38, z: -13, side: -1, nx: 1, nz: 0, w: 1.45, h: 2.35 },
  { id: 'mirror-garden', x: 9.35, y: 1.38, z: -19.5, side: 1, nx: -1, nz: 0, w: 1.45, h: 2.35 }
];

export const CAR_SEAT = { x: -1, z: -10 };

export function nearby(s) {
  if (!s.started || s.ride) return null;
  const p = s.player;
  if (s.realm === FOREST.id) return forestTarget(s);
  if (s.realm === 'street') {
    if (!s.quest?.brush && Math.hypot(p.x - BRUSH_POS.x, p.z - BRUSH_POS.z) < 2.25) return 'brush';
    if (Math.hypot(p.x, p.z + 35) < 3) return 'shrine';
    if (MIRRORS.some((m) => Math.hypot(p.x - m.x, p.z - m.z) < 2.35)) return 'mirror';
    if (!s.quest?.brush && p.x > 1.7 && Math.abs(p.z + 16) < 1.8) return 'crucible-locked';
    if (!s.carCooldown && Math.hypot(p.x - CAR_SEAT.x, p.z - CAR_SEAT.z) < 1.15) return 'car';
  }
  if (s.realm === 'platform') {
    if (Math.hypot(p.x + 1.6, p.z + 101) < 1.7) return 'platform-bench';
    if (p.x > 1.2 && Math.abs(p.z + 108) < 2.2) return 'platform-train';
  }
  if (s.quest?.brush) {
    const tether = TETHERS.find(
      (t) => t.realm === s.realm && !s.quest.tethers.includes(t.id) && Math.hypot(p.x - t.x, p.z - t.z) < 2.65
    );
    if (tether) return 'tether:' + tether.id;
  }
  const arena = ARENAS.find((a) => a.id === s.realm);
  if (arena) {
    if (arena.next && p.z < -109.2 && Math.abs(p.x) < 2.4 && !canEnterPortal(s, arena.next)) {
      return 'arena-next-locked';
    }
    if (arena.prev !== 'street' && Math.hypot(p.x + 5.0, p.z + 88.0) < 2.15) {
      return 'street-return';
    }
  }
  const w = WORLDS.find((world) => world.id === s.realm);
  return w && Math.hypot(p.x, p.z + 96) < 3.4 ? w.id : null;
}

export function finish(s) {
  if (countFragments(s) !== WORLDS.length) return false;
  s.ending = true;
  return true;
}
