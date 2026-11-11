# Solace State — After the Rain

A first-person walk through a rain-soaked Japanese backstreet. The entire 3D scene is sampled into dense monochrome ASCII characters, including wooden shopfronts, tiled eaves, Japanese signs, lanterns, overhead cables, wet paving and rain. Find four small comforts on the way to the shrine and morning.

WASD walks and sidesteps; left/right arrows or dragging look around; clicking the street captures the mouse for free look. E interacts, Space breathes, Escape pauses/releases the mouse. Mobile has a walking pad and swipe-to-look controls. Original ambient audio is synthesized with Web Audio. Progress is saved in localStorage under a new versioned key.

Three.js r170 and its MIT license are included in `dist/vendor/`. The game is self-contained and needs no CDN, image assets, fonts or build step. All visuals are generated in code.

## Run locally

From this folder, run `python -m http.server 4173 --directory dist`, then visit `http://localhost:4173`.

## Verify

Run `node --test tests/game.test.mjs`. Tests cover the continuous route, collision, perspective-relative movement, diagonal speed, four unique encounters, ending requirements, pause and saved progress.

The deployable static files are in `dist/`.
