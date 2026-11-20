import { WORLDS, nearby, countFragments, act, initialPuzzle, finish, PAINT_COLORS, PAINT_TARGETS } from './journey.js';
import { ARENAS, TETHERS, TETHER_GOAL, claimBrush, cutTether } from './combat.js';

import { activateForestStation } from './forest.js';

const forestPrompts = {
  'forest-hood': 'E - Hood the lamp',
  'forest-focus': 'E - Find the viewpoint',
  'forest-align': 'E - Align the symbol'
};

export function createStory({ getState, pause, save, onBrushClaimed, onTetherCut, onRide }) {
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
      $('story-text').textContent = 'You built a night out of grey characters. Find the Colour Brush in the western Tea Courtyard, wash the Bad Tethers across the street and the Battle Portals in colour, and unlock the Heavenly Light switch.';
      $('story-status').textContent = `${countFragments(s)} / ${WORLDS.length} memories  |  ${s.quest?.tethers?.length || 0} / ${TETHER_GOAL} Bad Tethers washed`;
      for (const world of WORLDS) {
        const p = document.createElement('p');
        p.className = 'journal-entry' + (s.puzzles[world.id].solved ? ' found' : '');
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

    if (current === 'platform-bench') {
      $('story-title').textContent = 'The Last Platform';
      $('story-status').textContent = 'A bench under the canopy';
      $('story-text').textContent = 'You sit. The bench is cold, then a little less cold. The departure board has said DELAYED UNTIL MORNING for as long as anyone here remembers. Nobody on this platform is in a hurry. For once, neither are you.';
      return;
    }

    if (current === 'platform-train') {
      $('story-title').textContent = 'The waiting train';
      $('story-status').textContent = s.ending ? 'The doors chime softly' : 'The doors stay open';
      $('story-text').textContent = s.ending
        ? 'Morning light fills the empty carriage. Every seat faces forward. You do not have to board yet. The train will wait, the way it always has.'
        : 'The carriage is warm and empty, every seat facing the same way: forward. A handwritten note is taped inside the door. It says: When you are ready. Not before.';
      return;
    }

    if (current === 'crucible-locked') {
      $('story-title').textContent = 'Sealed doorway — The Crucible';
      $('story-status').textContent = 'Locked by Bad Tethers';
      $('story-text').textContent = 'Crimson shadow chains bar this Battle Room portal. Explore the western Tea Courtyard across the street to find the Colour Brush first.';
      return;
    }

    if (current === 'arena-next-locked') {
      const arena = ARENAS.find((a) => a.id === s.realm);
      $('story-title').textContent = 'Progressive Portal Sealed';
      $('story-status').textContent = `${arena?.name || 'Battle Room'} incomplete`;
      $('story-text').textContent = 'Splash every sentinel in this Battle Room with paint and wash both crimson Bad Tethers in colour with your brush ([Click] or [F]) to unseal the next Progressive Portal.';
      return;
    }

    if (current === 'shrine') {
      $('story-title').textContent = s.ending ? 'A place to begin' : 'The last lantern';
      $('story-status').textContent = countFragments(s) + ' / ' + WORLDS.length + ' memories';
      $('story-text').textContent = s.ending
        ? 'The lantern warms beneath your hand. Somewhere, a train begins moving. The street is still here. So are you. Morning arrives. You can keep exploring.'
        : countFragments(s) < WORLDS.length
          ? 'Five empty sockets circle the lantern. Bring back the memories from the five named worlds.'
          : 'Every socket holds a memory. For the first time, the lantern has something to burn.';
      if (!s.ending && countFragments(s) === WORLDS.length) {
        button('Let morning in', () => { finish(s); save(); render(); });
      }
      return;
    }

    if (!w) return;
    const p = s.puzzles[w.id];
    $('story-title').textContent = w.name;
    if (w.kind === 'paint') {
      $('story-text').textContent = p.solved ? w.fragment : 'The altar is carved from the same grey stone as everything else. Three runes wait above it, each one waiting for a colour. Your brush is already wet.';
      $('story-status').textContent = p.solved
        ? 'Memory recovered - ' + countFragments(s) + ' / ' + WORLDS.length
        : PAINT_TARGETS.map((_, i) => w.labels[i] + ': ' + (p.values[i] ? PAINT_COLORS[p.values[i] - 1].name : 'unpainted')).join('  |  ');
      if (!p.solved) {
        $('story-hint').hidden = false;
        $('clue').textContent = w.clue + ' Hold the mouse button (or F / Space) to paint; scroll, press 1-6 or C to change colour.';
      }
      return;
    }
    $('story-text').textContent = p.solved ? w.fragment : 'The altar seems to recognize you. Three stones wait beneath its arch. Restore their pattern to recover a memory.';
    $('story-status').textContent = p.solved
      ? 'Memory recovered - ' + countFragments(s) + ' / ' + WORLDS.length
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
    if (Object.hasOwn(forestPrompts,id)) {
      const message=activateForestStation(s);
      if(message&&s.runtime){
        s.runtime.banner=message;
        s.runtime.bannerTimer=4.5;
        save();
      }
      return;
    }
    if (id === 'brush') {
      if (claimBrush(s)) {
        if (s.runtime) {
          s.runtime.banner = 'Colour Brush found! Hold Click or [F] to paint the night';
          s.runtime.bannerTimer = 4.2;
        }
        onBrushClaimed?.();
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
    if (id === 'car') {
      onRide?.();
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
        if (Object.hasOwn(forestPrompts,id)) prompt.textContent = forestPrompts[id];
        else if (id === 'brush') prompt.textContent = 'E - Take the Colour Brush';
        else if (id.startsWith('tether:')) prompt.textContent = 'E / Paint - Wash the Bad Tether in colour';
        else if (id === 'crucible-locked') prompt.textContent = 'E - Sealed Portal (Find the Brush in the West Courtyard)';
        else if (id === 'arena-next-locked') prompt.textContent = 'E - Progressive Portal Sealed (Clear Wave & Tethers)';
        else if (id === 'street-return') prompt.textContent = 'E - Return to the Street';
        else if (id === 'shrine') prompt.textContent = 'E - Touch the shrine';
        else if (id === 'mirror') prompt.textContent = 'E - Gaze into the mirror';
        else if (id === 'car') prompt.textContent = 'E - Ride along in the waiting car';
        else if (id === 'platform-bench') prompt.textContent = 'E - Sit on the bench';
        else if (id === 'platform-train') prompt.textContent = 'E - Look inside the open train';
        else if (id === 'paint') prompt.textContent = 'E - Read the garden altar';
        else prompt.textContent = 'E - Read the memory altar';
      }
      $('journey-progress').textContent = s.ending
        ? 'Morning has returned.'
        : `${countFragments(s)} / ${WORLDS.length} memories  |  ${s.quest?.tethers?.length || 0} / ${TETHER_GOAL} Bad Tethers`;
    }
  };
}
