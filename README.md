# Solace State

A first-person ASCII walk through a rain-soaked Japanese street. The walking view is only the street: no HUD, labels, hands, player body, people, conversations, objectives, or collection prompts. The night gradually lightens into morning.

The start/pause menu uses almost-clear glass (7% background tint, 3px blur) without a dark backdrop. Sound, text density, and restart live inside this menu. The menu is shown on first entry; subsequent visits resume the saved walk with no overlays.

## Controls

- WASD: walk and sidestep. Up/down arrows also walk.
- Left/right arrows, dragging, or captured mouse: look around.
- Escape: open/close the menu.
- Touch: drag the left half to walk, the right half to look. Tap with two fingers to open the menu. No visible controls cover the street.

Position and elapsed time use the existing `solace-dream-v3` localStorage key. Older saves retain the walk position while discarded conversation data can no longer interrupt walking or create invisible collisions.

## Run and verify

`python -m http.server 4173 --directory dist`

`node --test tests/game.test.mjs`

Movement tests cover the full street, physical boundaries, camera-relative movement, pause, and older saved-state recovery. Browser QA checks the empty walking UI, transparent menu, desktop/touch navigation, settings, and resume behavior.

Three.js r170 and its MIT license are included in dist/vendor. No external runtime requests or build step are required.
