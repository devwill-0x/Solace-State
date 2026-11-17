export const SWORD_POS = { x: -5.2, z: -13.0 };
export const TETHER_GOAL = 6;

export const TETHERS = [
  { id: 'street-1',  realm: 'street', x: -2.1,  z: -18.5, label: 'Mid-street tether' },
  { id: 'street-2',  realm: 'street', x:  2.1,  z: -29.0, label: 'Shrine-approach tether' },
  { id: 'crucible-1', realm: 'arena1', x: -3.6,  z: -98.0, label: 'West Crucible tether' },
  { id: 'crucible-2', realm: 'arena1', x:  3.6,  z: -98.0, label: 'East Crucible tether' },
  { id: 'spire-1',    realm: 'arena2', x: -4.0,  z: -101.0, label: 'West Spire tether' },
  { id: 'spire-2',    realm: 'arena2', x:  4.0,  z: -101.0, label: 'East Spire tether' },
  { id: 'sanctum-1',  realm: 'arena3', x: -4.4,  z: -102.0, label: 'West Sanctum tether' },
  { id: 'sanctum-2',  realm: 'arena3', x:  4.4,  z: -102.0, label: 'East Sanctum tether' }
];

export const ARENAS = [
  {
    id: 'arena1',
    name: 'The Crucible — Tier I',
    z: -16,
    next: 'arena2',
    prev: 'street',
    sky: 0x101324,
    ground: 0x2a2f46,
    color: 0x7df0ff,
    tierRequired: 1,
    nextTier: 2,
    enemies: [
      { id: 'c1', name: 'Void Sentinel', x: -2.6, z: -95.0, hp: 2, speed: 1.85, radius: 0.9, damage: 16, boss: false },
      { id: 'c2', name: 'Void Sentinel', x:  2.6, z: -96.5, hp: 2, speed: 1.95, radius: 0.9, damage: 16, boss: false },
      { id: 'c3', name: 'Shadow Acolyte', x: 0.0, z: -103.5, hp: 3, speed: 2.1, radius: 1.0, damage: 20, boss: false }
    ]
  },
  {
    id: 'arena2',
    name: 'The Prism Spire — Tier II',
    z: -16,
    next: 'arena3',
    prev: 'arena1',
    sky: 0x161435,
    ground: 0x393b63,
    color: 0xd088ff,
    tierRequired: 2,
    nextTier: 3,
    enemies: [
      { id: 's1', name: 'Mirror Stalker', x: -4.2, z: -95.5, hp: 3, speed: 2.35, radius: 0.95, damage: 20, boss: false },
      { id: 's2', name: 'Mirror Stalker', x:  4.2, z: -95.5, hp: 3, speed: 2.35, radius: 0.95, damage: 20, boss: false },
      { id: 's3', name: 'Prism Wraith',   x: -1.8, z: -104.0, hp: 3, speed: 2.5, radius: 1.0, damage: 22, boss: false },
      { id: 's4', name: 'Prism Wraith',   x:  1.8, z: -104.0, hp: 3, speed: 2.5, radius: 1.0, damage: 22, boss: false }
    ]
  },
  {
    id: 'arena3',
    name: 'Heavenly Sanctum — Tier III',
    z: -16,
    next: null,
    prev: 'arena2',
    sky: 0x1c1532,
    ground: 0x4b4668,
    color: 0xffd37d,
    tierRequired: 3,
    nextTier: 3,
    enemies: [
      { id: 'w1', name: 'Herald Shard', x: -3.8, z: -99.0, hp: 2, speed: 2.4, radius: 0.9, damage: 18, boss: false },
      { id: 'w2', name: 'Herald Shard', x:  3.8, z: -99.0, hp: 2, speed: 2.4, radius: 0.9, damage: 18, boss: false },
      { id: 'boss', name: 'The Veil Warden', x: 0.0, z: -105.0, hp: 7, speed: 2.55, radius: 1.35, damage: 26, boss: true }
    ]
  }
];

export function createQuest(saved) {
  const validTethers = new Set(TETHERS.map((t) => t.id));
  const rawTethers = Array.isArray(saved?.tethers) ? saved.tethers.filter((id) => validTethers.has(id)) : [];
  const tethers = [...new Set(rawTethers)];
  const clearedRaw = saved?.battleCleared || {};
  const battleCleared = {
    arena1: clearedRaw.arena1 === true,
    arena2: clearedRaw.arena2 === true,
    arena3: clearedRaw.arena3 === true
  };
  const sword = saved?.sword === true;
  let portalTier = Number.isInteger(saved?.portalTier) ? Math.max(0, Math.min(3, saved.portalTier)) : 0;
  if (sword && portalTier < 1) portalTier = 1;
  if (battleCleared.arena1 && portalTier < 2) portalTier = 2;
  if (battleCleared.arena2 && portalTier < 3) portalTier = 3;
  const lightUnlocked = saved?.lightUnlocked === true || tethers.length >= TETHER_GOAL;
  const lightMode = lightUnlocked && saved?.lightMode === true;
  return { sword, tethers, portalTier, battleCleared, lightUnlocked, lightMode };
}

export function serializeQuest(q) {
  return {
    sword: !!q?.sword,
    tethers: [...(q?.tethers || [])],
    portalTier: q?.portalTier || 0,
    battleCleared: {
      arena1: !!q?.battleCleared?.arena1,
      arena2: !!q?.battleCleared?.arena2,
      arena3: !!q?.battleCleared?.arena3
    },
    lightUnlocked: !!q?.lightUnlocked,
    lightMode: !!q?.lightMode
  };
}

export function claimSword(state) {
  if (!state?.quest || state.quest.sword) return false;
  state.quest.sword = true;
  if (state.quest.portalTier < 1) state.quest.portalTier = 1;
  return true;
}

export function toggleLightMode(state, forceValue) {
  if (!state?.quest?.lightUnlocked) return false;
  state.quest.lightMode = typeof forceValue === 'boolean' ? forceValue : !state.quest.lightMode;
  return state.quest.lightMode;
}

export function cutTether(state, tetherId) {
  if (!state?.quest) return { cut: false, switchJustUnlocked: false };
  if (!TETHERS.some((t) => t.id === tetherId) || state.quest.tethers.includes(tetherId)) {
    return { cut: false, switchJustUnlocked: false };
  }
  state.quest.tethers.push(tetherId);
  let switchJustUnlocked = false;
  if (!state.quest.lightUnlocked && state.quest.tethers.length >= TETHER_GOAL) {
    state.quest.lightUnlocked = true;
    state.quest.lightMode = true;
    switchJustUnlocked = true;
  }
  checkArenaProgression(state);
  return { cut: true, switchJustUnlocked };
}

export function checkArenaProgression(state) {
  if (!state?.quest) return false;
  let unlocked = false;
  const checkOne = (arenaId, nextTier) => {
    const arenaTethersCut = TETHERS.filter((t) => t.realm === arenaId).every((t) => state.quest.tethers.includes(t.id));
    if (state.quest.battleCleared[arenaId] && arenaTethersCut && state.quest.portalTier < nextTier) {
      state.quest.portalTier = nextTier;
      unlocked = true;
    }
  };
  checkOne('arena1', 2);
  checkOne('arena2', 3);
  return unlocked;
}

export function canEnterPortal(state, targetRealm) {
  const arena = ARENAS.find((a) => a.id === targetRealm);
  if (!arena) return true;
  if (!state?.quest?.sword) return false;
  return (state.quest.portalTier || 0) >= arena.tierRequired;
}

export function createRuntimeCombat() {
  return {
    swingTimer: 0,
    swingCooldown: 0,
    swingDir: 1,
    hp: 100,
    maxHp: 100,
    hurtFlash: 0,
    slashFlash: 0,
    banner: '',
    bannerTimer: 0,
    activeRealm: null,
    enemies: [],
    sparks: []
  };
}

export function syncArenaCombat(state, runtime) {
  if (!runtime) return;
  if (runtime.activeRealm === state.realm) return;
  runtime.activeRealm = state.realm;
  const arena = ARENAS.find((a) => a.id === state.realm);
  if (!arena || state.quest?.battleCleared?.[arena.id]) {
    runtime.enemies = [];
    runtime.hp = runtime.maxHp;
    return;
  }
  runtime.hp = runtime.maxHp;
  runtime.enemies = arena.enemies.map((e, idx) => ({
    ...e,
    maxHp: e.hp,
    phase: idx * 1.9,
    attackTimer: 1.6 + idx * 0.45,
    hitFlash: 0,
    alive: true
  }));
}

export function performSlash(state, runtime, time = 0) {
  if (!state?.started || state.paused || state.ride || !state.quest?.sword) return null;
  if (runtime.swingCooldown > 0) return null;
  syncArenaCombat(state, runtime);

  runtime.swingTimer = 0.36;
  runtime.swingCooldown = 0.34;
  runtime.swingDir = -runtime.swingDir;
  runtime.slashFlash = 1.0;

  const p = state.player;
  const fx = -Math.sin(p.yaw);
  const fz = -Math.cos(p.yaw);
  const result = { hitEnemies: [], cutTethers: [], switchJustUnlocked: false, tierUnlocked: false };

  // Check active Bad Tethers in current realm
  for (const t of TETHERS) {
    if (t.realm !== state.realm || state.quest.tethers.includes(t.id)) continue;
    const dx = t.x - p.x;
    const dz = t.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 3.1) {
      const dot = dist > 0.001 ? (dx * fx + dz * fz) / dist : 1;
      if (dot > 0.12 || dist < 1.5) {
        const res = cutTether(state, t.id);
        if (res.cut) {
          result.cutTethers.push(t.id);
          if (res.switchJustUnlocked) result.switchJustUnlocked = true;
        }
      }
    }
  }

  // Check active Battle Room enemies in current realm
  const arena = ARENAS.find((a) => a.id === state.realm);
  if (arena && runtime.enemies.length) {
    for (const enemy of runtime.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x - p.x;
      const dz = enemy.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= 3.35) {
        const dot = dist > 0.001 ? (dx * fx + dz * fz) / dist : 1;
        if (dot > 0.05 || dist < 1.6) {
          enemy.hp -= 1;
          enemy.hitFlash = 0.45;
          // Knock enemy gently back
          if (dist > 0.01) {
            enemy.x += (dx / dist) * 0.9;
            enemy.z += (dz / dist) * 0.9;
          }
          if (enemy.hp <= 0) {
            enemy.alive = false;
          }
          result.hitEnemies.push(enemy.id);
        }
      }
    }
    if (runtime.enemies.every((e) => !e.alive)) {
      if (!state.quest.battleCleared[arena.id]) {
        state.quest.battleCleared[arena.id] = true;
        checkArenaProgression(state);
        result.tierUnlocked = true;
      }
    }
  }

  if (result.cutTethers.length || result.hitEnemies.length) {
    if (checkArenaProgression(state)) result.tierUnlocked = true;
  }

  if (result.switchJustUnlocked) {
    runtime.banner = 'Mesh broken! Heavenly Switch unlocked [T]';
    runtime.bannerTimer = 4.2;
  } else if (result.cutTethers.length) {
    const remaining = Math.max(0, TETHER_GOAL - state.quest.tethers.length);
    runtime.banner = remaining > 0
      ? `Bad Tether severed (${state.quest.tethers.length}/${TETHER_GOAL})`
      : `Extra Tether severed (${state.quest.tethers.length}/${TETHERS.length})`;
    runtime.bannerTimer = 2.6;
  } else if (result.tierUnlocked) {
    runtime.banner = arena.next ? 'Wave cleared! Sever tethers & advance north' : 'The Veil Warden falls! Sanctum purified';
    runtime.bannerTimer = 3.5;
  }

  return result;
}

export function updateCombat(state, runtime, dt, time) {
  if (!runtime) return;
  syncArenaCombat(state, runtime);

  if (runtime.swingTimer > 0) runtime.swingTimer = Math.max(0, runtime.swingTimer - dt);
  if (runtime.swingCooldown > 0) runtime.swingCooldown = Math.max(0, runtime.swingCooldown - dt);
  if (runtime.hurtFlash > 0) runtime.hurtFlash = Math.max(0, runtime.hurtFlash - dt * 2.2);
  if (runtime.slashFlash > 0) runtime.slashFlash = Math.max(0, runtime.slashFlash - dt * 1.9);
  if (runtime.bannerTimer > 0) runtime.bannerTimer = Math.max(0, runtime.bannerTimer - dt);

  if (!state.started || state.paused || state.ride) return;

  const arena = ARENAS.find((a) => a.id === state.realm);
  if (!arena) {
    runtime.hp = Math.min(runtime.maxHp, runtime.hp + dt * 12);
    return;
  }

  // Re-check progression in case tethers were cut before or after wave clear
  checkArenaProgression(state);

  const p = state.player;
  const activeEnemies = runtime.enemies.filter((e) => e.alive);
  if (!activeEnemies.length) {
    runtime.hp = Math.min(runtime.maxHp, runtime.hp + dt * 14);
    return;
  }

  for (const enemy of activeEnemies) {
    if (enemy.hitFlash > 0) enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    const dx = p.x - enemy.x;
    const dz = p.z - enemy.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const desiredDist = enemy.boss ? 2.1 : 1.75;
    const tx = -dz / dist;
    const tz = dx / dist;
    const orbitDir = Math.sin(time * 0.7 + enemy.phase) * 0.85;

    let vx = tx * orbitDir;
    let vz = tz * orbitDir;
    if (dist > desiredDist) {
      vx += (dx / dist) * 0.9;
      vz += (dz / dist) * 0.9;
    } else if (dist < 1.2) {
      vx -= (dx / dist) * 0.6;
      vz -= (dz / dist) * 0.6;
    }
    const vLen = Math.hypot(vx, vz) || 1;
    enemy.x = Math.max(-10.5, Math.min(10.5, enemy.x + (vx / vLen) * enemy.speed * dt));
    enemy.z = Math.max(-111.5, Math.min(-86.5, enemy.z + (vz / vLen) * enemy.speed * dt));

    if (dist < (enemy.boss ? 2.9 : 2.35)) {
      enemy.attackTimer -= dt;
      if (enemy.attackTimer <= 0) {
        enemy.attackTimer = enemy.boss ? 1.55 : 2.1;
        runtime.hp = Math.max(0, runtime.hp - enemy.damage);
        runtime.hurtFlash = 1.0;
        if (runtime.hp <= 0) {
          // Gently reset to arena threshold so player isn't trapped
          p.x = 0;
          p.z = -86.5;
          p.yaw = 0;
          runtime.hp = runtime.maxHp;
          runtime.banner = 'Resolve shattered — reformed at the threshold';
          runtime.bannerTimer = 3.0;
        }
      }
    } else {
      enemy.attackTimer = Math.max(0.55, enemy.attackTimer - dt * 0.25);
    }
  }
}
