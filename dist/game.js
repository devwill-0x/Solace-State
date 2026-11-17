import { LINKS, REALM_IDS, restoreJourney } from './journey.js';
import { ARENAS, canEnterPortal, serializeQuest } from './combat.js';

export const START = { x: 0.1, z: 7, yaw: 0, pitch: 0 };

export function canWalk(x, z) {
  if (!Number.isFinite(x) || !Number.isFinite(z) || z > 10 || z < -37.3) return false;
  const plaza = (x < -3.22 && x > -9.85 && z < -9.2 && z > -16.8) || (x > 3.22 && x < 9.85 && z < -18.2 && z > -25.8);
  if (Math.abs(x) > 3.22 && !plaza) return false;
  if (Math.hypot(x + 7, z + 13) < 0.6 || Math.hypot(x - 7, z + 22) < 2.2) return false;
  if ((x > -7.2 && x < -4.8 && z > -10.5 && z < -9.5) || (x > -9.2 && x < -6.8 && z > -16.2 && z < -15.2) || (x > 5.8 && x < 8.2 && z > -25.7 && z < -24.7)) return false;
  if (x > 2.65 && z > -8.8 && z < -6.3) return false;
  if (x < -2.85 && z > -34 && z < -32) return false;
  return true;
}

export function createState(saved) {
  const field = REALM_IDS.has(saved?.realm);
  const p = saved?.player ? {
    ...saved.player,
    z: Math.max(field ? -118 : -37, Math.min(field ? -82.1 : 10, saved.player.z)),
    x: Math.max(field ? -19 : -9.8, Math.min(field ? 19 : 9.8, saved.player.x))
  } : null;
  const valid = p && (field ? (Math.abs(p.x) < 20 && p.z > -119 && p.z < -82) : canWalk(p.x, p.z)) && Number.isFinite(p.yaw) && Number.isFinite(p.pitch);
  return {
    player: valid ? { x: p.x, z: p.z, yaw: p.yaw, pitch: Math.max(-1.2, Math.min(0.7, p.pitch)) } : field ? { x: 0, z: -87, yaw: 0, pitch: 0 } : { ...START },
    realm: field ? saved.realm : 'street',
    ...restoreJourney(saved),
    started: !!saved?.started,
    paused: false,
    distance: 0,
    moving: false,
    elapsed: Number.isFinite(saved?.elapsed) ? Math.max(0, Math.min(1800, saved.elapsed)) : 0
  };
}

export function walk(s, f, r, dt) {
  if (!s.started || s.paused || s.ride || !Number.isFinite(dt) || dt <= 0) return false;
  const p = s.player;
  const l = Math.max(1, Math.hypot(f, r));
  const v = (s.sprinting ? 5.1 : 2.8) * Math.min(dt, 0.1);
  const dx = (-Math.sin(p.yaw) * f + Math.cos(p.yaw) * r) / l * v;
  const dz = (-Math.cos(p.yaw) * f - Math.sin(p.yaw) * r) / l * v;

  const arena = ARENAS.find((a) => a.id === s.realm);
  const allowed = (x, z) => {
    if (arena) {
      if (Math.abs(x) >= 11.4 || z <= -114.6 || z >= -82) return false;
      if (z <= -113) {
        return !!arena.next && Math.abs(x) < 1.35 && canEnterPortal(s, arena.next);
      }
      return true;
    }
    if (s.realm !== 'street') return Math.abs(x) < 20 && z > -119 && z < -82;
    return canWalk(x, z) || (x < 3.4 && x > 3 && LINKS.some((w) => Math.abs(z - w.z) < 1.02 && canEnterPortal(s, w.id)));
  };

  let moved = false;
  if (allowed(p.x + dx, p.z)) { p.x += dx; moved ||= dx !== 0; }
  if (allowed(p.x, p.z + dz)) { p.z += dz; moved ||= dz !== 0; }

  const center = LINKS.find((w) => w.id === s.realm)?.z ?? -2;
  if (s.realm === 'street' && p.x >= 3.12 && p.x - dx < 3.12) {
    const entry = LINKS.find((w) => Math.abs(p.z - w.z) < 1.02 && canEnterPortal(s, w.id));
    if (entry) {
      const x = p.x;
      p.x = p.z - entry.z;
      p.z = -85 - (x - 3.12);
      p.yaw += Math.PI / 2;
      s.realm = entry.id;
    }
  } else if (arena && arena.next && p.z <= -113 && p.z - dz > -113 && Math.abs(p.x) < 1.35 && canEnterPortal(s, arena.next)) {
    const overshoot = -113 - p.z;
    p.z = -85.6 - overshoot;
    s.realm = arena.next;
  } else if (arena && p.z >= -85 && p.z - dz < -85 && Math.abs(p.x) < 1.35) {
    if (arena.prev === 'street') {
      const x = p.x;
      p.x = 3.12 - (p.z + 85);
      p.z = x + -16;
      p.yaw -= Math.PI / 2;
      s.realm = 'street';
    } else {
      const overshoot = p.z + 85;
      p.z = -112.4 + overshoot;
      s.realm = arena.prev;
    }
  } else if (!arena && s.realm !== 'street' && p.z >= -85 && p.z - dz < -85 && Math.abs(p.x) < 1.02) {
    const x = p.x;
    p.x = 3.12 - (p.z + 85);
    p.z = x + center;
    p.yaw -= Math.PI / 2;
    s.realm = 'street';
  }

  if (moved) s.distance += Math.hypot(dx, dz);
  return moved;
}

export function serialize(s) {
  const puzzles = { ...s.puzzles };
  if (s.quest) puzzles._quest = serializeQuest(s.quest);
  return {
    player: { ...(s.ride ? s.ride.returnPlayer : s.player) },
    started: s.started,
    elapsed: s.elapsed,
    realm: s.realm,
    puzzles,
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
