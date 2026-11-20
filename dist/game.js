import { LINKS, REALM_IDS, CHAINS, restoreJourney, fieldAllowed } from './journey.js';
import { ARENAS, canEnterPortal, serializeQuest } from './combat.js';

import { FOREST, forestAllowed, restoreForest } from './forest.js';

export const START = { x: 0.1, z: 7, yaw: 0, pitch: 0 };

export function canWalk(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || z > 10 || z < -37.3) return false;
  const plaza = (x < -3.22 && x > -9.85 && z < -9.2 && z > -16.8) || (x > 3.22 && x < 9.85 && z < -18.2 && z > -25.8);
  if (Math.abs(x) > 3.22 && !plaza) return false;
  if (Math.hypot(x + 7, z + 13) < 0.6 || Math.hypot(x - 7, z + 22) < 2.2) return false;
  if ((x > -7.2 && x < -4.8 && z > -10.5 && z < -9.5) || (x > -9.2 && x < -6.8 && z > -16.2 && z < -15.2) || (x > 5.8 && x < 8.2 && z > -25.7 && z < -24.7)) return false;
  if (x > 2.65 && z > -8.8 && z < -6.3) return false;
  if (x < -2.85 && z > -34 && z < -32) return false;
  // The parked car is solid; its passenger door is reached from the street side.
  if (x > -2.75 && x < -1.25 && z > -11.55 && z < -8.45) return false;
  return true;
}

export function createState(saved) {
  const forest = restoreForest(saved?.forest);
  const field = REALM_IDS.has(saved?.realm);
  // A save from a place that no longer exists wakes up at the start of the street.
  const lost = typeof saved?.realm === 'string' && saved.realm !== 'street' && !field;
  const p = saved?.player && !lost ? {
    ...saved.player,
    z: Math.max(field ? -118 : -37, Math.min(field ? -82.1 : 10, saved.player.z)),
    x: Math.max(field ? -19 : -9.8, Math.min(field ? 19 : 9.8, saved.player.x))
  } : null;
  const valid = p && (saved.realm === FOREST.id ? forestAllowed(p.x, p.z, forest)
    : field ? fieldAllowed(saved.realm, p.x, p.z) : canWalk(p.x, p.z)) && Number.isFinite(p.yaw) && Number.isFinite(p.pitch);
  return {
    player: valid ? { x: p.x, z: p.z, yaw: p.yaw, pitch: Math.max(-1.2, Math.min(0.7, p.pitch)) } : field ? { x: 0, z: -87, yaw: 0, pitch: 0 } : { ...START },
    realm: field ? saved.realm : 'street',
    ...restoreJourney(saved),
    forest,
    started: !!saved?.started,
    paused: false,
    distance: 0,
    moving: false,
    elapsed: Number.isFinite(saved?.elapsed) ? Math.max(0, Math.min(1800, saved.elapsed)) : 0
  };
}

// Far gates: battle rooms chain north, and some calm places open onto another place.
export function nextRealm(realm) {
  const arena = ARENAS.find((a) => a.id === realm);
  return arena ? arena.next : CHAINS.find((c) => c.from === realm)?.to ?? null;
}
export function prevRealm(realm) {
  const arena = ARENAS.find((a) => a.id === realm);
  return arena ? arena.prev : CHAINS.find((c) => c.to === realm)?.from ?? 'street';
}

export function walk(s, f, r, dt) {
  if (!s.started || s.paused || s.ride || !Number.isFinite(dt) || dt <= 0) return false;
  const p = s.player;
  const l = Math.max(1, Math.hypot(f, r));
  const v = (s.sprinting ? 5.1 : 2.8) * Math.min(dt, 0.1);
  const dx = (-Math.sin(p.yaw) * f + Math.cos(p.yaw) * r) / l * v;
  const dz = (-Math.cos(p.yaw) * f - Math.sin(p.yaw) * r) / l * v;

  const startX = p.x;
  const startZ = p.z;
  const arena = ARENAS.find((a) => a.id === s.realm);
  // Test the doorway where the movement segment intersects its plane.
  if (s.realm === 'street' && dx > 0 && startX <= 3.12 && startX + dx > 3.12) {
    const crossingZ = startZ + dz * (3.12 - startX) / dx;
    const entry = LINKS.find((w) => Math.abs(crossingZ - w.z) < 1.02 && canEnterPortal(s, w.id));
    if (entry) {
      p.x = startZ + dz - entry.z;
      p.z = -85 - (startX + dx - 3.12);
      p.yaw += Math.PI / 2;
      s.realm = entry.id;
      s.distance += Math.hypot(dx, dz);
      return true;
    }
  }
  const allowed = (x, z) => {
    if (arena) {
      if (Math.abs(x) >= 11.4 || z <= -114.6 || z >= -82) return false;
      if (z <= -113) {
        return !!arena.next && Math.abs(x) < 1.02 && canEnterPortal(s, arena.next);
      }
      return true;
    }
    if (s.realm === FOREST.id) return forestAllowed(x, z, s.forest);
    if (s.realm !== 'street') return fieldAllowed(s.realm, x, z);
    // Keep the player on the street side if a diagonal step misses the opening.
    if (startX <= 3.12 && x > 3.12 && LINKS.some((w) => Math.abs(startZ - w.z) < 1.2)) return false;
    return canWalk(x, z);
  };

  let moved = false;
  if (allowed(p.x + dx, p.z)) { p.x += dx; moved ||= dx !== 0; }
  if (allowed(p.x, p.z + dz)) { p.z += dz; moved ||= dz !== 0; }

  const center = LINKS.find((w) => w.id === s.realm)?.z ?? -2;
  const next = nextRealm(s.realm), prev = prevRealm(s.realm);
  if (next && startZ >= -113 && p.z < -113 && Math.abs(p.x) < 1.02 && canEnterPortal(s, next)) {
    p.z += 28;
    s.realm = next;
  } else if (s.realm !== 'street' && startZ <= -85 && p.z > -85 && Math.abs(p.x) < 1.02) {
    if (prev === 'street') {
      const x = p.x;
      p.x = 3.12 - (p.z + 85);
      p.z = x + (arena ? arena.z : center);
      p.yaw -= Math.PI / 2;
      s.realm = 'street';
    } else {
      p.z -= 28;
      s.realm = prev;
    }
  }

  if (moved) s.distance += Math.hypot(dx, dz);
  return moved;
}

export function serialize(s) {
  const puzzles = { ...s.puzzles };
  if (s.quest) puzzles._quest = serializeQuest(s.quest);
  if (s.canvas && Object.keys(s.canvas).length) puzzles._canvas = s.canvas;
  return {
    player: { ...(s.ride ? s.ride.returnPlayer : s.player) },
    started: s.started,
    elapsed: s.elapsed,
    realm: s.realm,
    puzzles,
    ...(s.realm === FOREST.id || s.forest.stage || s.forest.hooded ? { forest: s.forest } : {}),
    ending: s.ending
  };
}

export function startRide(s) {
  if (!s.started || s.paused || s.ride || s.realm !== 'street' || s.carCooldown) return false;
  if (Math.hypot(s.player.x + 1, s.player.z + 10) > 1.15) return false;
  s.ride = { time: 0, returnPlayer: { ...s.player } };
  s.player.yaw = 0;
  s.player.pitch = 0;
  return true;
}

export function endRide(s) {
  if (!s.ride) return;
  s.player = { ...s.ride.returnPlayer, x: 0, z: -8 };
  s.ride = null;
  s.carCooldown = true;
}

export function updateRide(s, dt) {
  if (s.paused) return;
  if (s.ride) {
    s.ride.time += dt;
    if (s.ride.time >= 50) endRide(s);
  } else if (s.carCooldown && Math.hypot(s.player.x + 1, s.player.z + 10) > 3) {
    s.carCooldown = false;
  }
}
