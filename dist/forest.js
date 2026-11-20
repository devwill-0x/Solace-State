export const FOREST = {
  id: 'forest', name: 'The Lantern Wood', z: 7, color: 0xffb663
};

export const STATIONS = [
  { name: 'Moon', x: -1.6, z: -90.8, glyphX: -1.6, gate: -95, shape: 'ring' },
  { name: 'Eye', x: 1.8, z: -99.2, glyphX: .45, gate: -104, shape: 'eye' },
  { name: 'Crown', x: -1.6, z: -108.1, glyphX: .05, gate: -113, shape: 'crown' }
];

export const FOREST_VISTA_Z = -115.5;

// The same trunk coordinates drive rendering and collision.
export const TREES = [];
for (let row = 0; row < 12; row++) {
  for (const side of [-1, 1]) {
    for (let column = 0; column < 5; column++) {
      const seed = (row + 1) * 57 + column * 19 + side * 13;
      const ripple = Math.sin(seed * 4.19);
      TREES.push({
        x: side * (4.2 + column * 2.2 + ripple * .7),
        z: -84 - row * 3 + Math.cos(seed * 6.71) * 1.05,
        radius: .21 + .15 * Math.abs(ripple),
        height: 5.4 + 4.2 * Math.abs(Math.sin(seed * 8.1))
      });
    }
  }
}

export function restoreForest(saved) {
  const stage = Number.isInteger(saved?.stage) ? Math.max(0, Math.min(STATIONS.length, saved.stage)) : 0;
  return { stage, hooded: stage < STATIONS.length && saved?.hooded === true };
}

export function forestAllowed(x, z, progress) {
  if (Math.abs(x) >= 6.7 || z <= -118 || z >= -82) return false;
  const station = STATIONS[progress?.stage ?? 0];
  if (station && z <= station.gate + .22) return false;
  return !TREES.some((tree) => Math.hypot(x - tree.x, z - tree.z) < tree.radius + .21);
}

export function forestTarget(state) {
  const station = STATIONS[state.forest.stage];
  if (!station) return null;
  const {x,z,yaw,pitch} = state.player;
  const distance = Math.hypot(x - station.x, z - station.z);
  if (distance > .8) return null;
  if (!state.forest.hooded) return 'forest-hood';
  const direction = Math.atan2(x - station.glyphX, z - station.gate);
  const angle = Math.atan2(Math.sin(yaw - direction), Math.cos(yaw - direction));
  return distance <= .52 && Math.abs(angle) <= .25 && Math.abs(pitch) <= .28 ? 'forest-align' : 'forest-focus';
}

export function activateForestStation(state) {
  if (state.realm !== FOREST.id) return null;
  const target = forestTarget(state);
  const station = STATIONS[state.forest.stage];
  if (target === 'forest-hood') {
    state.forest.hooded = true;
    return 'Stand on the center of the stone. Look ahead until the fragments form a single shape.';
  }
  if (target === 'forest-focus') return 'Move to the center of the stone and face the scattered fragments.';
  if (target === 'forest-align') {
    state.forest.stage++;
    state.forest.hooded = false;
    return state.forest.stage === STATIONS.length
      ? 'The last gate opens. Carry the lamp into the clearing.'
      : station.name + ' aligned. Follow the amber stones to the next gate.';
  }
  return null;
}
