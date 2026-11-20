# Solace State: A Memory of Morning

A surreal ASCII exploration and puzzle game. A rain-soaked Japanese neighborhood has forgotten how to reach morning. Five named doorways lead to lost memories; solve their altars and return the fragments to the shrine to complete the story. The ending leaves the worlds open for exploration.

## Worlds and puzzles

The street is black and white. Its doorways open onto coloured worlds, and some of those open onto black-and-white places again, so colour and monochrome alternate as you explore.

- **The Glass Tide** (colour): faceted crystals and a luminous sea; align three prisms.
- **The Unpainted Garden** (black and white): a moonlit garden made only of greys. The garden lends you a big brush. Paint anything: the torii gate, the moon pond, the old tree, lanterns, bushes, rocks, the tea house, the mountains, even the moon. Brush strokes leave paint on any surface and everything you paint is saved. Paint the gate, pond and tree their remembered colours to recover the memory.
- **The Inverted Hour** (colour): suspended pyramids above dunes; interpret a three-bell sequence.
- **The Listening Wood** (colour): giant luminous mushrooms and drifting motes; reconstruct a four-note echo.
- **The Borrowed Tomorrow** (colour): ruined columns and rotating gears; balance borrowed hours.
- **Blossom Valley** (colour, restful): a pale gate at the end of its path leads on to **The Last Platform** (black and white), a night terminus with a waiting train, benches and rain.

## The Colour Brush

There is no sword. The Colour Brush rests on a pedestal in the western Tea Courtyard. Once you take it, it works everywhere: small things you paint take the colour whole, and large surfaces such as walls and the ground get brush splats. Paint shows up as colour characters in the black-and-white ASCII and is saved per place. The brush itself is drawn in characters, like everything else. Its default paint is **Prism**, the rainbow of your glass reflection: Prism surfaces drift through the rainbow and their characters glitch (scrambled glyphs, rows that slip sideways, colour ghosts). The six solid colours are still on keys 2-7 for when a single colour matters, like the garden's gate, pond and tree. Brush strokes also wash the crimson Bad Tethers in colour and splash enemies in the Battle Rooms, so the brush drives the whole tether and battle quest.

The Meadow and The Unmoored Sky were removed. Saves made inside them wake up at the start of the street.

## Controls

WASD to walk; Shift to sprint. Drag, mouse capture or left/right arrows to look. **E** or the nearby touch button opens an altar or the shrine, sits on a bench, or gets into the parked car. Escape closes a story panel or opens the menu. Read the journal from the menu.

With the brush, hold the mouse button, **F** or **Space** to paint. Scroll, press **1-7** (1 is Prism) or **C** to change colour, or click a colour in the HUD. On touchscreens, tap the right half to paint.

On touchscreens, drag the left half to move (farther to sprint), the right half to look, and tap with two fingers to open the menu. Walk up to the car on the left and press **E** to enter the passenger ride; End drive in the menu returns to the street.

Positions, partial puzzles, recovered fragments and the ending are saved in browser localStorage (`solace-dream-v3`). Older saves migrate without removing existing exploration progress. Reloading during a ride returns to its starting position.

## Run

`python -m http.server 4173 --directory dist`

`node --test tests/game.test.mjs`

No runtime dependencies are downloaded. Three.js r170 and its MIT license are included in dist/vendor. All world models are procedural code. Repeated scenery is instanced, colored glyphs are cached, and portal views outside the camera frustum are skipped. Reduced-motion preferences disable world rotation and head bob.

## Validation

Movement and puzzle tests cover every new portal round trip, all five puzzle solutions, incorrect-input handling, partial progress, completion gating and saved endings, as well as the existing ride and map collision behavior. Browser QA plays all five puzzles using their controls, returns through their portals, completes the shrine, reloads the save, and checks the mobile journal.

## Graphics

The ASCII pass picks a density glyph for shading and switches to line glyphs (`| - / \`) along strong silhouettes, so outlines stay crisp. Coloured pixels map onto a 216-colour glyph palette, a faint blurred copy of the scene glows behind the characters in coloured worlds, and a soft vignette frames the view. Black-and-white places stay pure grey.

## Title screen and devwill opening

A dedicated main menu shows ASCII crows on power lines, rain, and a quiet title. Enter/Return to the night starts a nine-second opening: one crow takes flight, touches a live wire with a brief localized spark, then returns as a horned crow above the devwill studio mark. Skip intro or Escape enters the game immediately. The pause menu can replay the sequence. Saved walks are preserved.

The original procedural soundtrack combines a soft suspended drone, sparse piano-like tones and a restrained electrical cue. Browser audio starts only after a click/tap. Title and pause menus offer music controls; music softens during exploration and fades when the tab is hidden. Rain ambience has its own switch. The title renderer replaces world rendering while open, and reduced-motion preferences disable rain movement and the logo fade.

Browser validation covers the complete opening, automatic game entry, music activation/muting, replay, Escape/button skipping, saved-game continuation and mobile layout with reduced motion.

### Gothic rock arrangement

The original score now builds at 96 BPM: exposed piano-like notes and organ lead into bass, stereo distorted power-chord riffs, kick, snare and cymbals. Entering/replaying the intro resets the build; the shock cue releases the full arrangement. The four-chord loop continues at a reduced level during exploration. Every instrument is generated locally with Web Audio; no external audio downloads are required. A compressor and restrained mix preserve headroom. Offline audio QA checks the progression, finite samples, peak level and DC offset; browser QA checks activation, mute, replay, skipping and mobile entry.

### Quiet-view cleanup

Floating overlay orbs and the look-down player aura are removed. The iridescent mirror figure remains. Paused scenes render once, then redraw only for a resize or detail change; active exploration resumes normal rendering. Music mute preferences persist across reloads, both music buttons expose their state to assistive technology, and leaving the journal restores the quieter exploration mix.

### Live portals and map reflections

Portal textures now sample using the actual output viewport while their lower-resolution render targets retain the same aspect ratio. This restores the original seamless view in widescreen and portrait layouts.

Street and courtyard mirrors now render the map from a camera reflected across the mirror plane, clipping out geometry behind the glass. Reflections respond to position, angle, and perspective. The player?s glass model is positioned in the world and rendered only into mirror views; no separate 2D figure or aura is painted over the screen. Only visible mirrors render, with capped resolution and no recursive mirror passes. The same reflected scene is sampled into ASCII or shown directly in Heavenly Light mode.

Reflection tests verify camera geometry; browser checks validate viewport sampling with a four-color test texture, all three mirror render targets, portal round trips, and portrait resizing.

## The Lantern Wood

A fresh walk begins in a dark forest with a lamp in hand. Follow the amber stones to three marked viewpoints. Use **E** or the interaction button to hood the lamp, then line up the scattered fragments from the center of the stone. The Moon, Eye, and Crown open a path to the clearing. Each fragment sits at a different depth, so moving off the viewpoint breaks the shape apart. Forest progress is saved independently of the street's memories.

The portal behind the forest starting point leads to the old street. Return to the forest through the amber doorway near the street's starting point. Existing saves resume in their original world.
