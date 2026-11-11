# Solace State

A quiet, original browser game rendered entirely with ASCII characters. Wander a rainy valley, discover five small comforts, and rest by the stream until sunrise.

Use WASD or arrow keys to move, E to interact, Space to breathe, and Esc to pause. Click or tap the landscape or a golden spark to walk there. Progress is saved locally in the browser. Optional original ambient sound is synthesized with Web Audio; the game has no required external assets or runtime dependencies. Google Fonts is optional, with local font fallbacks.

## Run locally

From this folder, run `python -m http.server 4173 --directory dist`, then visit `http://localhost:4173`.

## Verify

Run `node --test tests/game.test.mjs`. The tests check a complete playable route, bridge collision, ending requirements, revisiting, pause, and saved progress.

The deployable static files are in `dist/`.
