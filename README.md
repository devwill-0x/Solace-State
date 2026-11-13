# Solace State — A Passing Dream

A first-person ASCII walk through a rain-soaked Japanese street. Wander freely, turn around, or watch the night gradually become morning. There are no notice prompts, collectibles, score counters or completion gates.

Only the player and interface have the translucent rainbow treatment: a thin-film glass shader on the visible hands and body, colored ASCII at their edges, and blurred iridescent interface panels. Look down to see your body or press B to raise your hands. Other people and their close-up faces remain grayscale ASCII.

Three people inhabit the street. Walking close and looking toward someone triggers a short subtitled conversation once per walk. Close-up faces blink and animate their mouths. Enter/Continue advances, Escape/Keep walking skips, and the Street conversations setting disables all encounters for uninterrupted walking. Dialogue is subtitled; audio is ambient rain, not spoken voices.

## Controls

- WASD: walk and sidestep.
- Left/right arrows, dragging, or captured mouse: look around.
- B or the diamond button: raise/lower translucent hands.
- Enter or Continue: reveal/advance a conversation.
- Escape: leave a conversation or pause.
- Mobile: walking pad, swipe to look, and touch buttons.

Progress, encounters and the conversation preference are saved in localStorage under `solace-dream-v3`. An interrupted cutscene returns to walking after reload.

## Run

From this folder: `python -m http.server 4173 --directory dist`, then open http://localhost:4173.

Three.js r170 and its MIT license are included in dist/vendor. The project has no external runtime dependencies, images, font requests or build step. All artwork is procedural.

## Verify

`node --test tests/game.test.mjs` covers a complete unrestricted walk in both directions, collisions, encounter eligibility, conversation progression and exit, disabled encounters and saved-state recovery. Browser QA additionally covers the colored hands, grayscale faces, subtitles, skip controls, settings, audio, density and mobile movement.
