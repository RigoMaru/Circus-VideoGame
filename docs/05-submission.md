# Stage 05 — Validation and competition submission

## Delivery checklist
- Playable desktop and touch controls, title screen, help, pause and results.
- Three acts, three modes, Chill option, local bests, score copying.
- Real original Blender meshes, editable project, reproducible generator and render.
- Original synthesized music, act variations and effects.
- Local typefaces and assets; no runtime third-party requests.
- Automated tests and a reproducible static production build.

## Verification performed
Thirteen Node tests cover deterministic seeds, UTC daily dates, jump arcs, no double jumping, single scoring, damage/invulnerability, pause, the 90-second win, act transitions, clearance windows, buffered input and correct damage event routing. A simulated timed player completes all three acts without damage at 30, 60 and 144 FPS. A five-minute Encore simulation confirms bounded hazard lists.

The production bundle was opened in the browser and inspected at desktop and phone dimensions. Browser checks covered model loading, visible title UI, game start, touch jump, five-heart Chill mode, settings, pause and loss/results. No renderer errors were reported in the inspected console. Automated simulation tests do not replace human difficulty tuning; a final human playthrough and music listen on the recording device are recommended before submitting.

## Competition post draft
**CIRQUE — One More Show 🎪**

I brought the joy of retro circus games into a little 3D big top. Ride a toy lion through fire hoops, balance across rolling barrels, and land a somersault for extra applause.

Three acts. One-button jumping. A daily challenge. An endless encore. And an original carnival soundtrack that changes with the show.

All the characters and scenery were built in Blender, with the editable file and step-by-step process included in the repo. Built with AI, Three.js, Blender and Web Audio.

**Play:** https://rigomaru.github.io/Circus-VideoGame/

**Code + Blender source:** https://github.com/RigoMaru/Circus-VideoGame

Space to jump. X for a little extra showmanship. Can you earn a standing ovation?

## Suggested 60-second Loom
0–8s: Title screen. “This is CIRQUE, a modern 3D love letter to retro circus games.”
8–30s: Start playing. Jump through a hoop, collect stars, add an X trick, show the growing score.
30–43s: Show the ball/barrel act and explain three acts plus Encore and Daily Ticket.
43–52s: Briefly show the editable Blender scene and the original music source.
52–60s: Return to the game. “No downloads, no account. Step right up and beat my score.”

Deadline supplied by the user: **September 30, 2026**. Post under **September Comp**. The recording and competition post are left for the owner; neither is submitted automatically.

## Practical limits
WebGL is required. Mobile landscape is recommended for a larger stage. Browser-local records are not an online leaderboard. The game has three implemented act types; it does not claim to reproduce every Circus Charlie minigame. Music is procedural synthesis. There is no gamepad support or installable native executable in this version.
