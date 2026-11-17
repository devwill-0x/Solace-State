# Solace State: A Memory of Morning

A surreal ASCII exploration and puzzle game. A rain-soaked Japanese neighborhood has forgotten how to reach morning. Five named doorways lead to lost memories; solve their altars and return the fragments to the shrine to complete the story. The ending leaves the worlds open for exploration.

## Worlds and puzzles

- **The Glass Tide**: faceted crystals and a luminous sea; align three prisms.
- **The Inverted Hour**: suspended pyramids above dunes; interpret a three-bell sequence.
- **The Unmoored Sky**: floating islands and orbital rings; connect a three-beacon light circuit.
- **The Listening Wood**: giant luminous mushrooms and drifting motes; reconstruct a four-note echo.
- **The Borrowed Tomorrow**: ruined columns and rotating gears; balance borrowed hours.

The original meadow and cherry-blossom valley remain restful destinations. The compact street includes a tea courtyard, pond garden, shrine and a parked car offering a 50-second passenger ride.

All seven portal pairs use live camera-transformed views and preserve heading and sideways position on crossing. Named plaques identify the five story doors. Puzzle monuments are a short walk beyond each new portal. Each altar provides its own inscription, feedback, reset and recoverable fragment. The journal records the goal and every recovered passage. A new walk clears story progress only after confirmation.

## Controls

WASD to walk; Shift to sprint. Drag, mouse capture or left/right arrows to look. **E** or the nearby touch button opens an altar or the shrine. Escape closes a story panel or opens the menu. Read the journal from the menu.

On touchscreens, drag the left half to move (farther to sprint), the right half to look, and tap with two fingers to open the menu. Walk up to the car on the left to enter the passenger ride; End drive in the menu returns to the street.

Positions, partial puzzles, recovered fragments and the ending are saved in browser localStorage (`solace-dream-v3`). Older saves migrate without removing existing exploration progress. Reloading during a ride returns to its starting position.

## Run

`python -m http.server 4173 --directory dist`

`node --test tests/game.test.mjs`

No runtime dependencies are downloaded. Three.js r170 and its MIT license are included in dist/vendor. All world models are procedural code. Repeated scenery is instanced, colored glyphs are cached, and portal views outside the camera frustum are skipped. Reduced-motion preferences disable world rotation and head bob.

## Validation

Movement and puzzle tests cover every new portal round trip, all five puzzle solutions, incorrect-input handling, partial progress, completion gating and saved endings, as well as the existing ride and map collision behavior. Browser QA plays all five puzzles using their controls, returns through their portals, completes the shrine, reloads the save, and checks the mobile journal.

## Title screen and devwill opening

A dedicated main menu shows ASCII crows on power lines, rain, and a quiet title. Enter/Return to the night starts a nine-second opening: one crow takes flight, touches a live wire with a brief localized spark, then returns as a horned crow above the devwill studio mark. Skip intro or Escape enters the game immediately. The pause menu can replay the sequence. Saved walks are preserved.

The original procedural soundtrack combines a soft suspended drone, sparse piano-like tones and a restrained electrical cue. Browser audio starts only after a click/tap. Title and pause menus offer music controls; music softens during exploration and fades when the tab is hidden. Rain ambience has its own switch. The title renderer replaces world rendering while open, and reduced-motion preferences disable rain movement and the logo fade.

Browser validation covers the complete opening, automatic game entry, music activation/muting, replay, Escape/button skipping, saved-game continuation and mobile layout with reduced motion.
