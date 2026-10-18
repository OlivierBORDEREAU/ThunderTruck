# Asphalt → ThunderTruck — steal / leave

Against `sketch.js` MVP v3.5. Not a clone brief. Ubi Soft 1987 is the feel source; XOR trainer is not.

## Already stolen (do not reopen)

- Horizontal autoroute, truck faces +X, **Y is the only truck axis**. Same as Asphalt (centre truck, lateral on the road). You did not rotate the playfield.
- Truck X locked at `logicalWidth/2`. No steering, no throttle, no corners.
- Turret is a separate control from lane position.
- Heavy truck: `truckSpeed = 2.8` toward a target, not a snap. Keep this. CPC Asphalt was lighter; yours should stay a truck.
- Lane clamp `230–370` inside a `200–400` road. Keep a physical road width.

## Broken vs that design (fix before content)

Two-finger Asphalt is the whole game. Current input cannot do it:

- `touchEnded` / `mouseReleased` clear **both** `truckControl` and `turretJoystick`. Second finger up kills the first.
- `moveTruckSmoothly` no-ops unless `truckControl.active`. Keyboard sets `truckTargetY` then nothing moves.

Fix: per-pointer ownership (left strip vs stick), release only that pointer. Keyboard should move without the flag, or set it.

## Steal — in this order

Do not build the 1987 kit in one pass. Asphalt is not “three weapons”. Asphalt is **you cannot drive, so every decision is where the hull is, where the gun points, and which tool you spend**.

### v4 — the game exists

1. **World scroll, truck stays.** Dash lines and verge grass move −X. Speed is a constant (maybe a tiny gear later, not a player control). This is the “autoroute 14” lie: motion without driving.
2. **Turret fires along `turretAngle`.** Hold stick past the existing `0.08` deadzone = aim; fire is a separate button (right-side, above/below the stick) or stick-magnitude threshold. Prefer an explicit fire button on mobile. CPC used fire + stick; you already split lane/aim, so split fire too.
3. **One enemy** that enters from the right (ahead) and tries to occupy your hull. Collision = you take a hit. You can kill it with the gun.
4. **Fail state.** 3 hull hits or a single “cargo” hit. No HUD art yet, just a number.

Without 1–4 this is a truck toy, not Asphalt.

### v5 — ammunition is the brain

Asphalt’s French reviews and the XOR +2 both treat **munitions as scarce**. Ignore Moby’s “unlimited MG”.

| Tool | Steal | Do not steal |
|---|---|---|
| **M16 turret** | Aimed. Your analog stick is better than CPC left/right. Primary. Generous but **not** infinite — a big pool that refills from pickups. | Automatic 360 spray with no cost. |
| **Flamethrowers** | **Fixed to the hull, left/right sides**, not aimed with the turret. Short cone. Expensive. For enemies sitting in your lane beside the trailer. | A second turret weapon. |
| **Mines** | Dropped **behind** (−X). Trap chase vehicles. Tiny stock. | Homing, or dropped toward aim. |
| **Cycle** | One control cycles MG / flame / mine. CPC: space. You: a third button or a stick-tap while not aiming. | Three simultaneous analog weapons. |

Pickups: ammo crate, repair. Same as Asphalt. That is the resource loop.

### v6 — the TV damage inset (this is the identity)

Asphalt’s HUD trick: a **diagram of the truck with parts flashing when hit**. You do not have a generic HP bar. You have:

- cab / engine
- trailer / cargo (this is the run — if cargo dies, delivery fails)
- tires (lane change gets drunk)
- maybe tank (flame becomes suicide)

Enemies shoot a **part**, not “the truck”. Player job is to **yaw the hull** (Y) so the already-wounded part is not facing the threat, while the turret looks somewhere else. That double-attention is the game. Your left-strip + right-stick split is the correct modern mapping of that.

## Leave

- CPC one-stick multiplex (lane + turret on the same axis). You already beat 1987 here.
- XOR trainer menu, pokes, crack credits.
- Ubi art, palette-as-constraint, “Hutch Verminson / bande à Nobo / Detroit” unless you later want pulp flavour. Mechanics first. The look brief for that later pass is `CPC-EXPERIMENTS.md`. It does not unpark this.
- Corners, braking, nitro, wanted-stars, *Asphalt 9*. Wrong family.
- Vertical-only *Spy Hunter* camera. Your road is already the autoroute.
- Score-as-win. Asphalt is survive the delivery. Distance or a destination bar beats a number in the corner.
- Pasting CPC sprites. Silhouette language (long tractor + tank/trailer, fat turret, small bikes vs cars) is fair; bitmaps are not.

## Mapping onto v3.5 code

| Asphalt | You now | Next hook |
|---|---|---|
| Lateral joystick | left strip → `truckTargetY` | keep + fix pointer ownership |
| L/R turret | analog `turretAngle` | keep analog; add fire |
| Space = weapon | nothing | cycle button |
| Autoroute scroll | static `rect` + dashes at y=300 | move dashes / spawn verge |
| Enemies | none | one collider from +X |
| Munitions | none | pool on MG, tiny on flame/mine |
| TV damage | blue rounded rect | part hits after a working gun |
| Fire button | none | must exist before enemies |

## What “feels like Asphalt” in one sentence

The road drives itself. You only choose **lane, aim, and which expensive tool to spend**, while the thing you are protecting is a **cargo box that can be hit from a different angle than you are shooting**.

If a feature does not serve that sentence, it is not v4.
