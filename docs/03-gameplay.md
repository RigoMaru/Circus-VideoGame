# Stage 03 — The playable game

## Loop
Choose a mode → begin immediately → time jumps → collect stars and land tricks → survive three acts → receive a grade and heart bonus → retry. Regular play has three hearts; Chill has five and 78% movement speed.

Act 1 introduces hoops. Act 2 changes the character to a balancing ball and introduces rolling barrels. Act 3 mixes both at a higher speed. Act transitions clear existing obstacles and create breathing room. The regular show finishes at 90 simulated seconds. Encore repeats the acts, adding speed per full show up to a cap.

## Input and fairness
Jump impulse: 9 units/sec. Gravity: 18 units/sec². No double jump. A 120ms input buffer accepts a jump pressed just before landing. X triggers a somersault only while airborne and rising; each jump permits one trick. Collision uses a forgiving height window at the hazard's crossing of the player plane. This is arcade collision, not rigid-body simulation.

The first hazard spawns after two seconds, then travels onto the screen. Three stars trace the approach arc. A hit costs one heart, resets the streak and gives 2.3 seconds of invulnerability. Pause freezes physics; changing tabs automatically pauses. Large frame stalls are clamped to avoid teleporting through hazards.

## Scoring
- 250 applause for a clear; 400 for a well-timed perfect clear.
- 50 for a collected star.
- 150 for a completed somersault landing.
- Multiplier increases every three consecutive clears, capped at 5×.
- Finish bonus: 1,000 per remaining heart.
- Grades depend on final score; S also requires completing the show.

Daily Ticket uses a seeded PRNG keyed to the UTC date. All players use the same generated obstacle choices and intervals, although input and rendering cadence affect their runs. Classic and Chill records are separate. Records are stored only locally and are not cheat-resistant.

## Architecture
- `src/game.js`: simulation, seeded courses, collision and scoring.
- `src/scene.js`: Blender assets, batching, camera, shadows, particles and animation.
- `src/audio.js`: original music sequencer and sound synthesis.
- `src/main.js`: UI, persistence, controls, settings, modal lifecycle.
- `tests/game.test.js`: simulation regression and complete-course tests.
