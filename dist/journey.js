import { ARENAS, SWORD_POS, TETHERS, createQuest, canEnterPortal } from './combat.js';

export const WORLDS = [
  { id: 'prism', name: 'The Glass Tide', z: 4, color: 0x57e1ed, sky: 0x182947, ground: 0x365b78, kind: 'align', labels: ['First prism', 'Second prism', 'Third prism'], clue: 'Three beams enter the tide. The first bends once. The next bends twice. The last bends three times. Align each prism; four turns return it to zero.', fragment: 'The street did not disappear. I folded it away when every familiar doorway began to hurt.' },
  { id: 'dunes', name: 'The Inverted Hour', z: -5, color: 0xffbb69, sky: 0x673762, ground: 0xd29a69, kind: 'sequence', labels: ['Dawn', 'Noon', 'Dusk'], clue: 'The buried inscription reads: "Begin where the day ends. Find its beginning. Rest at its brightest hour." A wrong bell clears the sequence.', fragment: 'I called this place a refuge. Then I made the night repeat, so nothing else could change.' },
  { id: 'isles', name: 'The Unmoored Sky', z: -20, color: 0xa8a2ff, sky: 0x171a41, ground: 0x7275ba, kind: 'lights', labels: ['West circuit', 'Center circuit', 'East circuit'], clue: 'Light all three beacons. Each switch flips its own beacon and its immediate neighbors. The ends do not wrap around.', fragment: 'Someone kept the car waiting. They never asked me to be ready. They only asked whether I wanted company.' },
  { id: 'mycelium', name: 'The Listening Wood', z: -27, color: 0xe875ca, sky: 0x102b38, ground: 0x325957, kind: 'memory', labels: ['Root', 'Rain', 'Moon'], clue: 'A voice beneath the caps repeats: "Root remembers Moon. Rain remembers Root." Play the four named notes in that order. A wrong note starts the echo again.', fragment: 'The things I lost were not asking me to stay lost with them. That was a promise I had made alone.' },
  { id: 'clock', name: 'The Borrowed Tomorrow', z: -32, color: 0xe7cd7d, sky: 0x324453, ground: 0x7c7967, kind: 'balance', labels: ['Add two hours', 'Add three hours', 'Release one hour'], clue: 'The clock has no hands. Its inscription says: "Tomorrow begins at seven. Borrow two, borrow three, or let one go." Balance the counter at seven.', fragment: 'Morning is not a cure. It is simply another place to begin. I can carry what happened without living inside it.' }
];

export const LINKS = [{ id: 'meadow', z: -2 }, { id: 'blossom', z: -12 }, ...WORLDS, { id: 'arena1', z: -16 }];
export const REALM_IDS = new Set([...LINKS.map((l) => l.id), ...ARENAS.map((a) => a.id)]);

export const initialPuzzle = (id) => ({ values: [0, 0, 0], step: 0, total: 0, solved: false, miss: false });

export function restoreJourney(saved) {
  const puzzles = {};
  for (const w of WORLDS) {
    const p = saved?.puzzles?.[w.id];
    puzzles[w.id] = {
      values: [0, 1, 2].map((i) => (Number.isInteger(p?.values?.[i]) ? Math.max(0, Math.min(3, p.values[i])) : 0)),
      step: Number.isInteger(p?.step) ? Math.max(0, Math.min(4, p.step)) : 0,
      total: Number.isInteger(p?.total) ? Math.max(-20, Math.min(20, p.total)) : 0,
      solved: p?.solved === true,
      miss: false
    };
  }
  const quest = createQuest(saved?.puzzles?._quest || saved?.quest);
  return { puzzles, quest, ending: saved?.ending === true && WORLDS.every((w) => puzzles[w.id].solved) };
}

export function countFragments(s) {
  return WORLDS.filter((w) => s.puzzles[w.id].solved).length;
}

export function act(s, id, index) {
  const w = WORLDS.find((world) => world.id === id);
  const p = s.puzzles[id];
  if (!w || !p || p.solved || ![0, 1, 2].includes(index)) return false;
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

export const MIRRORS = [
  { id: 'mirror-street', x: -3.25, y: 1.38, z: -3.5, side: -1, nx: 1, nz: 0, w: 1.35, h: 2.35 },
  { id: 'mirror-tea', x: -9.35, y: 1.38, z: -13, side: -1, nx: 1, nz: 0, w: 1.45, h: 2.35 },
  { id: 'mirror-garden', x: 9.35, y: 1.38, z: -19.5, side: 1, nx: -1, nz: 0, w: 1.45, h: 2.35 }
];

export function nearby(s) {
  if (!s.started || s.ride) return null;
  const p = s.player;
  if (s.realm === 'street') {
    if (!s.quest?.sword && Math.hypot(p.x - SWORD_POS.x, p.z - SWORD_POS.z) < 2.25) return 'sword';
    if (Math.hypot(p.x, p.z + 35) < 3) return 'shrine';
    if (MIRRORS.some((m) => Math.hypot(p.x - m.x, p.z - m.z) < 2.35)) return 'mirror';
    if (!s.quest?.sword && p.x > 1.7 && Math.abs(p.z + 16) < 1.8) return 'crucible-locked';
  }
  if (s.quest?.sword) {
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
  if (countFragments(s) !== 5) return false;
  s.ending = true;
  return true;
}
