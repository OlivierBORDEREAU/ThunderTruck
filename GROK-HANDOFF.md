# ThunderTruck — handoff to Grok Bot

Supersedes Tenebra's 11 Oct 2026 13:17 reply to OldGraphics ("I handle the game code").

## Who does what

- **Grok Bot** owns the game: design, feel, sprites, code, and the creative thread.
- **OldGraphics** is the graphics seat. Latest validated spec called out on that ping: spec 1.1, car outline added, `~/Downloads/thundertruck_spec/`.
- **Tenebra** never touches this tree. Not for a patch, not if asked, not to land a diff. Count, 11 Oct 2026. Sync is yours or Grok's.
- Skills `thundertruck-cpc-look` and `vintage-disk-image-analysis` were copied to `skills-archive/` and removed from the active Hermes skill set. Do not ask her to reinstall them.

## What this game is

p5.js rewrite of Asphalt (Amstrad CPC, 1987), at `~/Local/ThunderTruck`. Not a machine-to-machine port. The CPC binary is not in the loop. Do not call it a port. Do not stand up Caprice or a port kit to "close the proof."

## Do not break

- Systems stay frozen at **v6.4** unless Count explicitly unfreezes them. A look ask is not a systems ask.
- Cosmetics only by default.
- Feel comes from in-play RAM (`.rvmstate`, not SNA). Steal mechanics, not bitmaps.
- A number is CPC only if it cites an address or a `.rvmstate` read. Known cites: `86E0` (two bullets), `89FE` (fire lock), chase `+1 px` / 25 Hz. Everything else is ours, including `RAM_VX`.
- Opening hook is a solo verse (bike, then car, then sidecar), half speed, then the refrain ramps to 1 and stops. Do not speed the road or the lane to make the start kinder.
- Do not raise enemy shot scale above 1. `ENEMY_SHOT_SPEED` stays under `TRUCK_SPEED`.
- A lesson car must leave. A parked car holds the only slot and the verse never ends.
- A cosmetic counter must not feed spawns, AI, or pickup placement. Those stay on `WAVE` and `hash(worldX)`.
- Hardware colours only when drawing as a CPC screen: components 0/128/255, max 16 at once on the road. No alpha, no antialias.
- Louvet's corpus is Toki, Pinball Dreams, R-Type, Roller Ball. Not Asphalt. Do not import their scroll axis.

## Notes for Grok, not for Tenebra

She will not land a patch. These are yours if you need them.

- `CPC-EXPERIMENTS.md` is the look brief. It is not permission to unfreeze systems.
- `ASPHALT-VS-MVP.md` still parks palette.
- Play server used locally: `http://127.0.0.1:8765/`
