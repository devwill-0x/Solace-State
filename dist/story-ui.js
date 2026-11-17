import { WORLDS, nearby, countFragments, act, initialPuzzle, finish } from './journey.js';
import { ARENAS, TETHERS, TETHER_GOAL, claimSword, cutTether } from './combat.js';

export function createStory({ getState, pause, save, onSwordClaimed, onTetherCut }) {
  const $ = (id) => document.getElementById(id);
  const dialog = $('story');
  const prompt = $('interact');
  let current = null;

  const close = () => {
    if (dialog.open) dialog.close();
    current = null;
    pause(false);
    save();
  };

  const render = () => {
    const s = getState();
    const w = WORLDS.find((world) => world.id === current);
    $('story-actions').replaceChildren();
    $('story-hint').hidden = true;
    $('story-reset').hidden = true;

    const button = (label, fn) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = fn;
      $('story-actions').append(b);
    };

    if (current === 'journal') {
      $('story-title').textContent = 'The street that forgot morning';
      $('story-text').textContent = 'You built a night behind an ASCII mesh. Find the Lightbreaker Sword in the western Tea Courtyard to tear open the veil, sever Bad Tethers across the street and Battle Portals, and unlock the Heavenly Light switch.';
      $('story-status').textContent = `${countFragments(s)} / 5 memories  |  ${s.quest?.tethers?.length || 0} / ${TETHER_GOAL} Bad Tethers severed`;
      for (const world of WORLDS) {
        const p = document.createElement('p');
        p.className = 'journal-entry';
        p.textContent = world.name + ' - ' + (s.puzzles[world.id].solved ? world.fragment : 'Unrecovered. Look for its named doorway on the right side of the street.');
        $('story-actions').append(p);
      }
      return;
    }

    if (current === 'mirror') {
      $('story-title').textContent = 'A figure of spun glass';
      $('story-status').textContent = 'Reflection in the rain';
      $('story-text').textContent = 'In the rain-streaked glass, you are not made of heavy bone and wet wool. You are a transparent silhouette of refracted liquid glass—cyan, violet, rose, and solar gold—letting the living street shimmer straight through you.';
      return;
    }

    if (current === 'crucible-locked') {
      $('story-title').textContent = 'Sealed doorway — The Crucible';
      $('story-status').textContent = 'Locked by Bad Tethers';
      $('story-text').textContent = 'Crimson shadow chains bar this Battle Room portal. Explore the western Tea Courtyard across the street to claim the Lightbreaker Sword first.';
      return;
    }

    if (current === 'arena-next-locked') {
      const arena = ARENAS.find((a) => a.id === s.realm);
      $('story-title').textContent = 'Progressive Portal Sealed';
      $('story-status').textContent = `${arena?.name || 'Battle Room'} incomplete`;
      $('story-text').textContent = 'Defeat every sentinel in this Battle Room and sever both crimson Bad Tethers with your Sword ([Click] or [F]) to unseal the next Progressive Portal.';
      return;
    }

    if (current === 'shrine') {
      $('story-title').textContent = s.ending ? 'A place to begin' : 'The last lantern';
      $('story-status').textContent = countFragments(s) + ' / 5 memories';
      $('story-text').textContent = s.ending
        ? 'The lantern warms beneath your hand. Somewhere, a train begins moving. The street is still here. So are you. Morning arrives. You can keep exploring.'
        : countFragments(s) < 5
          ? 'Five empty sockets circle the lantern. Bring back the memories from the five named worlds.'
          : 'Every socket holds a memory. For the first time, the lantern has something to burn.';
      if (!s.ending && countFragments(s) === 5) {
        button('Let morning in', () => { finish(s); save(); render(); });
      }
      return;
    }

    if (!w) return;
    const p = s.puzzles[w.id];
    $('story-title').textContent = w.name;
    $('story-text').textContent = p.solved ? w.fragment : 'The altar seems to recognize you. Three stones wait beneath its arch. Restore their pattern to recover a memory.';
    $('story-status').textContent = p.solved
      ? 'Memory recovered - ' + countFragments(s) + ' / 5'
      : w.kind === 'align'
        ? 'Prism turns: ' + p.values.join(' / ')
        : w.kind === 'lights'
          ? 'Beacons: ' + p.values.map((v) => (v ? 'lit' : 'dark')).join(' / ')
          : w.kind === 'balance'
            ? 'Borrowed hours: ' + p.total
            : (p.miss ? 'The echo breaks. Try again. ' : '') + 'Notes remembered: ' + p.step + ' / ' + (w.kind === 'memory' ? 4 : 3);
    if (!p.solved) {
      $('story-hint').hidden = false;
      $('clue').textContent = w.clue;
      $('story-reset').hidden = false;
      w.labels.forEach((label, i) => button(label, () => { act(s, w.id, i); save(); render(); }));
    }
  };

  const open = (id = nearby(getState())) => {
    if (!id) return;
    const s = getState();
    if (id === 'sword') {
      if (claimSword(s)) {
        if (s.runtime) {
          s.runtime.banner = 'Lightbreaker Sword claimed! Click or press [F] to break the mesh';
          s.runtime.bannerTimer = 4.2;
        }
        onSwordClaimed?.();
        save();
      }
      return;
    }
    if (id.startsWith('tether:')) {
      const tid = id.slice(7);
      const res = cutTether(s, tid);
      if (res.cut) {
        onTetherCut?.(res);
        save();
      }
      return;
    }
    if (id === 'street-return') {
      s.realm = 'street';
      s.player.x = 2.25;
      s.player.z = -16;
      s.player.yaw = Math.PI / 2;
      if (s.runtime) {
        s.runtime.banner = 'Returned to the street';
        s.runtime.bannerTimer = 2.4;
      }
      save();
      return;
    }
    current = id;
    $('story-hint').open = false;
    pause(true);
    render();
    if (!dialog.open) dialog.showModal();
    prompt.hidden = true;
  };

  $('story-close').onclick = close;
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  $('story-reset').onclick = () => { getState().puzzles[current] = initialPuzzle(current); save(); render(); };
  prompt.onclick = () => open();
  $('journal').onclick = () => { document.getElementById('menu').close(); open('journal'); };

  return {
    open,
    close,
    isOpen: () => dialog.open,
    update: () => {
      const s = getState();
      const id = nearby(s);
      prompt.hidden = !id || s.paused || dialog.open;
      if (id) {
        if (id === 'sword') prompt.textContent = 'E - Claim the Lightbreaker Sword';
        else if (id.startsWith('tether:')) prompt.textContent = 'E / Click - Sever Bad Tether';
        else if (id === 'crucible-locked') prompt.textContent = 'E - Sealed Portal (Find Sword in West Courtyard)';
        else if (id === 'arena-next-locked') prompt.textContent = 'E - Progressive Portal Sealed (Clear Wave & Tethers)';
        else if (id === 'street-return') prompt.textContent = 'E - Return to the Street';
        else if (id === 'shrine') prompt.textContent = 'E - Touch the shrine';
        else if (id === 'mirror') prompt.textContent = 'E - Gaze into the mirror';
        else prompt.textContent = 'E - Read the memory altar';
      }
      $('journey-progress').textContent = s.ending
        ? 'Morning has returned.'
        : `${countFragments(s)} / 5 memories  |  ${s.quest?.tethers?.length || 0} / ${TETHER_GOAL} Bad Tethers`;
    }
  };
}
