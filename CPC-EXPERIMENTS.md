# CPC experiments → ThunderTruck look

Future cosmetics only. `sketch.js` systems stay frozen at v6.4 until explicitly asked. This does not unpark `ASPHALT-VS-MVP.md`: palette was left on purpose. When a look pass is asked for, this is the brief.

Source: Michel Louvet, `bfggamepassion/Portage_Opti` (pushed 2026-10-06). Corpus is Pinball Dreams, Toki GGP, R-Type 128K (Easter Egg 2012), R-Type 1988, Roller Ball (his MSX→CPC port), Ghosts'n Goblins. **Not Asphalt.** Do not import their scroll axis. Toki and Pinball are not an autoroute.

## Two different jobs

His work is a machine-to-machine port. The original ROM stays in the loop. A home simulator and a real emulator (Caprice32, VICE, openMSX) are the oracle. Done means game memory matches the original, frame by frame, on scripted play. The disk is not done until that emulator boots it.

ThunderTruck is not that. It is a JavaScript rewrite. The CPC binary is not in the loop. Proof so far is a handful of RAM samples, then design. Do not describe it as a port. Do not import his kits, his emulator harness, or his "0 frames different" bar to make the canvas feel more serious. That would be a second project, and it is not asked for.

What the JS route already got right, by accident of the medium: display, sound, and input are native. That is the half of his method he insists on. The half it does not have is the oracle.

Cited from the machine, in `sketch.js` today:

- `MAX_BULLETS = 2` — `86E0 LD B,2`
- `FIRE_COOLDOWN` — `89FE=3`, then lock until the shots end
- `CHASE_VX` — `+1 px` per 25 Hz tick, scaled `800/160`

Everything else is a ThunderTruck decision, including the heavy hull, the wave table, the weapons, and the comment that claims scenery at 50 Hz. `RAM_VX` is named like a dump and cites no address. CPC-POWER crates are a database, not an emulator trace.

Rule for later adjustments: if a number claims to be CPC, it names the address or the `.rvmstate` read it came from. If it does not, label it as ours. Do not let "more CPC" mean "stand up Caprice and start a port" unless that is the ask.

CRTC timing below is from his summary of Longshot. If a later note repeats it: `Technical information sourced from the "Amstrad CPC CRTC Compendium" by Longshot (CC BY-NC-ND).`

## Already right — do not "fix"

- Truck X locked, world moves −X. That is the result of hardware scroll. Do not also slide the truck.
- Grass tufts are indexed by `worldX`. They stay phase-locked. No time-based wobble on the verge.
- HUD and the TV part diagram are drawn in screen space, after the world. On a CPC that is a rupture: a fixed panel is not inside the scrolling bitmap. Keep it that way.
- Damage flash is an on/off ink, not a gradient. Keep that language.
- The truck stays heavy. CPC Asphalt was lighter. A stable tick is not a license to snap the hull.

## Two clocks (system — do not apply until asked)

The comment on `SCROLL_SPEED` claims scenery ~50 Hz and logic 25 Hz. The code does not do that. `STEP` is 1/60, and a hitch runs a catch-up burst (`while (acc >= STEP)`).

Louvet, from R-Type 1988: one logic step per N frames, then wait. A heavy frame does not replay missed steps. The game keeps its tempo instead of lurching.

When this is unfrozen:

- Logic tick stays the 25 Hz grid already implied by the RAM notes (`CHASE_VX`, fire lock at `89FE`).
- Draw may interpolate. A hitch drops a draw. It does not run three updates.
- Do not speed the truck, the waves, or the shots to "feel smoother". Smoothness is the draw. The tick is the game.

## Scroll quantum

Hardware horizontal scroll steps 2 bytes: 4 px in mode 0, 8 px in mode 1. Nudging CRTC R3's low nibble from 5 to 4 halves that (2 px / 4 px) and still moves the whole width. R-Type 1988 only advances the map every 4 phase steps.

Asphalt's mode is not in his corpus. Confirm it from the disk or in-play RAM before locking 2 vs 4 vs 8. Until then, the safe cosmetic is: integer steps, locked to `worldX`. No subpixel dashes. No `strokeWeight(3)` centre line. No rounded-rect vehicles.

Hardware scroll moves the **entire** width. A fixed column inside the road is impossible without redrawing it every step. Left touch strip and the TV diagram stay overlays. A status band, if one is added, goes above or below the road. Never beside it, inside the scroll.

## Pixels and inks

His image brief (mode 0, the look he actually ships): pixels 2:1 wide, at most 16 of the 27 hardware colours, no antialias, no alpha, no blur, dither instead of gradients.

Do not letterbox the game into 160×200. That emulates the source screen. He measured that approach at 2–4× too slow and it keeps the source machine's defects (Ghosts'n Goblins rebuilt from draw calls: 9 frames/s). Imitate the result on the 800×600 canvas.

R-Type 128K splits the frame: playfield mode 0 (chunky, 16 inks), score band mode 1 (finer text). A mode change applies on the next line, not mid-pixel. A colour change is immediate. So: chunky road and vehicles, sharper KM and weapon labels. Do not pixelate the HUD to match the truck. Do not antialias the truck to match the HUD.

Hardware colours only. Components are 0, 128, or 255. Firmware index, then RGB:

| i | RGB | i | RGB | i | RGB |
|---|---|---|---|---|---|
| 0 | 0,0,0 | 9 | 0,128,0 | 18 | 0,255,0 |
| 1 | 0,0,128 | 10 | 0,128,128 | 19 | 0,255,128 |
| 2 | 0,0,255 | 11 | 0,128,255 | 20 | 0,255,255 |
| 3 | 128,0,0 | 12 | 128,128,0 | 21 | 128,255,0 |
| 4 | 128,0,128 | 13 | 128,128,128 | 22 | 128,255,128 |
| 5 | 128,0,255 | 14 | 128,128,255 | 23 | 128,255,255 |
| 6 | 255,0,0 | 15 | 255,128,0 | 24 | 255,255,0 |
| 7 | 255,0,128 | 16 | 255,128,128 | 25 | 255,255,128 |
| 8 | 255,0,255 | 17 | 255,128,255 | 26 | 255,255,255 |

Current fills (`46,92,42`, grey `58`, alpha flame triangles) are illegal on that pass. Replace them with chosen firmware inks. Do not nearest-neighbour: `fill(58)` is closer to ink 0 (Δ=100.5) than to ink 13 (Δ=121.2), and closer to ink 1 than to grey. Cab `(50,90,140)` snaps to ink 10. All 336 grass-band colours snap to ink 9. Do not invent a 17th "UI green" for the touch strip.

Animation that should be an ink cycle, not new shapes (Toki rotates 3 inks every 3 frames; no pixel is rewritten):

- verge lights, if any
- flame (replace the alpha triangles)
- pickup glint
- the existing part-flash (already an ink swap — keep it)

Index the cycle from the logic tick. Never from `frameCount`.

## What not to port into p5

These buy Z80 time. The canvas already redraws the frame. Copying the mechanism is the failure mode he warns against.

- R12/R13 page flip, stack-tiles, Gray-code line order, `LDIR` bans, NOP budgets
- CRTC type 0–4 differences, raster ruptures, cycle-exact display lists
- Double-buffer flicker. The player never sees the back buffer.
- Sprite mask tables and pre-shifted bytes. The visible rule is enough: colour 0 is transparent, hard edges, mirror by a table not by a second bitmap. No stored "mask sprite".

## Display variables are not juice

Once draw is decoupled from the tick, a flash phase or an ink index is often what the original used as RNG or "every other frame". Spawns, AI, and pickup Y stay on `WAVE` and `hash(worldX)`. A cosmetic counter does not feed them.

## If a look pass stalls

Stop after one or two tries. Offer a concession, do not grind:

1. Chunk the road, leave the HUD sharp.
2. 16 inks on the road. Overlays reuse those 16.
3. Integer scroll on dashes and grass only. Truck Y may stay smooth — the heavy hull is a deliberate departure.
4. Confirm Asphalt's mode from RAM before arguing about 2 px vs 4 px.
