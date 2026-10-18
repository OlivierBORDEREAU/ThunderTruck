// ThunderTruck v6.4 — systems frozen. Sprites from assets/ (spec 1.1).

const LOGICAL_W = 800;
const LOGICAL_H = 600;
const STEP = 1 / 60;

const ROAD_TOP = 200;
const ROAD_BOT = 400;
const LANE_MIN = 230;
const LANE_MAX = 370;

const TRUCK_X = LOGICAL_W / 2;
const TRUCK_HW = 45;
const TRUCK_HH = 22;
const TRUCK_SPEED = 168; // px/s — was 2.8 px/frame
const SCROLL_SPEED = 180; // scenery ~50Hz; logic is 25Hz
const DASH_PERIOD = 50;

const BULLET_SPEED = 560;
const FIRE_COOLDOWN = 0.22; // Asphalt: 89FE=3 then lock until shots end; ~50Hz
const MAX_BULLETS = 2; // RAM: 86E0 LD B,2 — two MG rounds in flight
const TURRET_BARREL = 40;

const ENEMY_SEEK = 80;
const ENEMY_W = 56;
const ENEMY_H = 28;
const SPAWN_DELAY = 0.7;
const MAX_ENEMIES = 2;
const CHASE_VX = 120; // CPC: +1px / 25Hz tick × 800/160
const FLANK_VX = -100;
const FLANK_HOLD = 1.35;
const FLANK_SLOT = 92;
const RAM_VX = 90;
const INVULN_TIME = 1.0;
const PART_MAX = { cargo: 2, cab: 2, tires: 2 };

const WEAPONS = ["mg", "flame", "mine"];
const AMMO_START = { mg: 28, flame: 6, mine: 3 };
const AMMO_PICKUP = { mg: 12, flame: 2, mine: 1 };
const MG_MAG = 8;
const MG_RELOAD = 1.45;
const FLAME_TIME = 0.38;
const FLAME_CD = 0.42;
const MINE_CD = 0.4;
const PICKUP_EVERY = 7.5;
const PICKUP_KINDS = ["mine", "repair", "life", "flame"];
const ENEMY_SHOT_SPEED = 85; // slower than cars — you lane-dodge these
const ENEMY_SHOT_CD = 1.2;
const MAX_ENEMY_SHOTS = 4;

// Seconds from run start. Loops every WAVE_PERIOD, after the intro verse.
// Intro is one kind at a time, half speed. The car leaves. A parked car would
// hold the only slot and the lesson would never end. Shot scale never exceeds 1:
// ENEMY_SHOT_SPEED must stay under TRUCK_SPEED or the lane dodge is a lie.
const INTRO = [
  { kind: "bike" },
  { kind: "car" },
  { kind: "sidecar", dir: -1 },
];
const INTRO_SCALE = 0.5;
const INTRO_GAP = 1.6;
const INTRO_CAR_HOLD = 5.5;
const REFRAIN_RAMP = 36;
const WAVE_PERIOD = 26;
const WAVE = [
  { t: 1.4, kind: "bike" },
  { t: 3.6, kind: "car" },
  { t: 7.0, kind: "sidecar", dir: -1 },
  { t: 8.8, kind: "bike" },
  { t: 10.2, kind: "car" },
  { t: 13.5, kind: "sidecar", dir: 1 },
  { t: 14.0, kind: "bike" },
  { t: 17.2, kind: "car" },
  { t: 17.6, kind: "sidecar", dir: -1 },
  { t: 21.0, kind: "bike" },
  { t: 23.4, kind: "car" },
];

const mod = (n, m) => ((n % m) + m) % m;
const hash = (i) => {
  i = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  i = Math.imul(i ^ (i >>> 13), 0xc2b2ae35);
  return (i ^ (i >>> 16)) >>> 0;
};

let scaleFactor = 1;
let originX = 0;
let originY = 0;
let leftZoneWidth = 0;

let mode = "start"; // start | play | gameover
let acc = 0;
let worldX = 0;
let parts = { cargo: 2, cab: 2, tires: 2 };
let partFlash = { cargo: 0, cab: 0, tires: 0 };
let failReason = "CARGO GONE";
let usingTouch = false;
let invuln = 0;
let shake = 0;
let spawnTimer = 0.4;
let waveTime = 0;
let waveIndex = 0;
let introIndex = 0;
let introWait = 1.4;
let introBusy = false;
let fireCd = 0;
let firing = false;
let weapon = 0; // 0 mg, 1 flame, 2 mine
let ammo = { mg: AMMO_START.mg, flame: AMMO_START.flame, mine: AMMO_START.mine };
let mgClip = MG_MAG;
let mgReload = 0;
let flameT = 0;
let mines = [];
let pickups = [];
let pickupTimer = 4;
let pickupSeq = 0;

let truckY;
let truckTargetY;
let turretAngle = 0;

let bullets = [];
let enemyShots = [];
let enemies = [];

let keys = { up: false, down: false, fire: false };
let pointers = new Map(); // id -> { x, y, role }

let turretJoystick = {
  x: 0,
  y: 0,
  baseRadius: 0,
  knobRadius: 0,
  angle: 0,
  magnitude: 0,
};

let fireBtn = { x: 0, y: 0, r: 0 };
let cycleBtn = { x: 0, y: 0, r: 0 };
let weaponHud = [];

let atlasImg;
let loaderImg;
let atlasMeta;
let extrasImg;
let extrasMeta;
let extras = {};
let sprites = {};
let spriteVariants = {};

const INK = {
  maroon: [128, 0, 0],
  red: [255, 0, 0],
  grey: [128, 128, 128],
  orange: [255, 128, 0],
  salmon: [255, 128, 128],
  white: [255, 255, 255],
};

function preload() {
  atlasImg = loadImage("assets/road_atlas.png");
  loaderImg = loadImage("assets/loader.png");
  atlasMeta = loadJSON("assets/road_atlas.json");
  extrasImg = loadImage("assets/road_extras.png");
  extrasMeta = loadJSON("assets/road_extras.json");
}

function knockOutBlack(src) {
  let img = createImage(src.width, src.height);
  img.copy(src, 0, 0, src.width, src.height, 0, 0, src.width, src.height);
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    if (img.pixels[i] === 0 && img.pixels[i + 1] === 0 && img.pixels[i + 2] === 0) {
      img.pixels[i + 3] = 0;
    } else {
      img.pixels[i + 3] = 255;
    }
  }
  img.updatePixels();
  return img;
}

function sliceFrame(atlas, frame) {
  let img = createImage(frame.w, frame.h);
  img.copy(atlas, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);
  return img;
}

function recolorPrimary(src, from, to) {
  let img = createImage(src.width, src.height);
  img.copy(src, 0, 0, src.width, src.height, 0, 0, src.width, src.height);
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    if (img.pixels[i + 3] === 0) continue;
    if (img.pixels[i] === from[0] && img.pixels[i + 1] === from[1] && img.pixels[i + 2] === from[2]) {
      img.pixels[i] = to[0];
      img.pixels[i + 1] = to[1];
      img.pixels[i + 2] = to[2];
    }
  }
  img.updatePixels();
  return img;
}

function prepareSprites() {
  let atlas = knockOutBlack(atlasImg);
  sprites = {};
  for (let frame of atlasMeta.frames) sprites[frame.name] = sliceFrame(atlas, frame);
  let extraAtlas = knockOutBlack(extrasImg);
  extras = {};
  for (let frame of extrasMeta.frames) extras[frame.name] = sliceFrame(extraAtlas, frame);
  spriteVariants = {
    cargo: {
      ok: sprites.truck_cargo,
      flash: recolorPrimary(sprites.truck_cargo, INK.maroon, INK.white),
      dead: recolorPrimary(sprites.truck_cargo, INK.maroon, INK.grey),
      hurt: recolorPrimary(sprites.truck_cargo, INK.maroon, INK.red),
    },
    cab: {
      ok: sprites.truck_cab,
      flash: recolorPrimary(sprites.truck_cab, INK.salmon, INK.white),
      dead: recolorPrimary(sprites.truck_cab, INK.salmon, INK.maroon),
      hurt: recolorPrimary(sprites.truck_cab, INK.salmon, INK.red),
    },
    tires: {
      ok: sprites.truck_tires,
      flash: recolorPrimary(sprites.truck_tires, INK.grey, INK.white),
      dead: recolorPrimary(sprites.truck_tires, INK.grey, INK.maroon),
      hurt: recolorPrimary(sprites.truck_tires, INK.grey, INK.orange),
    },
  };
}

function layerState(part) {
  let flash =
    mode === "play" &&
    (invuln > 0 || partFlash[part] > 0) &&
    floor((invuln + partFlash[part]) * 12) % 2 === 0;
  if (flash) return "flash";
  if (parts[part] <= 0) return "dead";
  if (parts[part] === 1) return "hurt";
  return "ok";
}

function setup() {
  let c = createCanvas(windowWidth, windowHeight);
  c.style("touch-action", "none");
  c.style("display", "block");
  truckY = LOGICAL_H / 2;
  truckTargetY = truckY;
  updateLayout();
  noStroke();
  noSmooth();
  prepareSprites();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayout();
}

function updateLayout() {
  let sx = windowWidth / LOGICAL_W;
  let sy = windowHeight / LOGICAL_H;
  scaleFactor = min(sx, sy);
  originX = (windowWidth - LOGICAL_W * scaleFactor) / 2;
  originY = (windowHeight - LOGICAL_H * scaleFactor) / 2;
  leftZoneWidth = windowWidth * 0.115;

  turretJoystick.x = windowWidth - 100;
  turretJoystick.y = windowHeight - 96;
  turretJoystick.baseRadius = 50;
  turretJoystick.knobRadius = 22;

  fireBtn.r = 34;
  fireBtn.x = turretJoystick.x;
  fireBtn.y = turretJoystick.y - turretJoystick.baseRadius - fireBtn.r - 14;

  cycleBtn.r = 28;
  cycleBtn.x = fireBtn.x - fireBtn.r - cycleBtn.r - 18;
  cycleBtn.y = fireBtn.y;

  let hx = originX + (LOGICAL_W * scaleFactor) / 2;
  let hy = originY + 10;
  weaponHud = [0, 1, 2].map((i) => ({
    id: i,
    x: hx + (i - 1) * 64,
    y: hy + 18,
    w: 58,
    h: 36,
  }));
}

function resetRun() {
  parts = { cargo: PART_MAX.cargo, cab: PART_MAX.cab, tires: PART_MAX.tires };
  partFlash = { cargo: 0, cab: 0, tires: 0 };
  failReason = "CARGO GONE";
  invuln = 0;
  shake = 0;
  spawnTimer = 0.5;
  waveTime = 0;
  waveIndex = 0;
  introIndex = 0;
  introWait = 1.4;
  introBusy = false;
  fireCd = 0;
  firing = false;
  weapon = 0;
  ammo = { mg: AMMO_START.mg, flame: AMMO_START.flame, mine: AMMO_START.mine };
  mgClip = MG_MAG;
  mgReload = 0;
  flameT = 0;
  mines = [];
  pickups = [];
  pickupTimer = 4;
  pickupSeq = 0;
  bullets = [];
  enemyShots = [];
  enemies = [];
  truckY = LOGICAL_H / 2;
  truckTargetY = truckY;
  acc = 0;
}

function draw() {
  acc += min(deltaTime, 50) / 1000;
  while (acc >= STEP) {
    acc -= STEP;
    update(STEP);
  }
  render();
}

function update(dt) {
  worldX += SCROLL_SPEED * dt;
  if (shake > 0) shake = max(0, shake - dt * 18);

  if (mode !== "play") return;

  if (!usingTouch) aimFromMouse();

  let steer = parts.tires > 0 ? TRUCK_SPEED : TRUCK_SPEED * 0.42;
  if (keys.up) truckTargetY -= steer * dt;
  if (keys.down) truckTargetY += steer * dt;
  if (parts.tires === 0) truckTargetY += sin(worldX * 0.04) * 70 * dt;
  truckTargetY = constrain(truckTargetY, LANE_MIN, LANE_MAX);

  let diff = truckTargetY - truckY;
  if (abs(diff) > 0.4) {
    truckY += constrain(diff, -steer * dt, steer * dt);
  }

  for (let k of ["cargo", "cab", "tires"]) {
    if (partFlash[k] > 0) partFlash[k] = max(0, partFlash[k] - dt);
  }

  fireCd = max(0, fireCd - dt);
  invuln = max(0, invuln - dt);
  if (flameT > 0) flameT = max(0, flameT - dt);
  if (mgReload > 0) {
    mgReload = max(0, mgReload - dt);
    if (mgReload <= 0 && ammo.mg > 0) {
      let n = min(MG_MAG, ammo.mg);
      ammo.mg -= n;
      mgClip = n;
    }
  }

  let wantFire = firing || keys.fire;
  if (wantFire && fireCd <= 0) tryFire();

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -20 || b.x > LOGICAL_W + 20 || b.y < -20 || b.y > LOGICAL_H + 20) {
      bullets.splice(i, 1);
    }
  }

  for (let m of mines) m.x -= SCROLL_SPEED * dt;
  for (let i = mines.length - 1; i >= 0; i--) {
    if (mines[i].x < -30) mines.splice(i, 1);
  }

  pickupTimer -= dt;
  if (pickupTimer <= 0) {
    pickupTimer = PICKUP_EVERY;
    pickups.push({
      x: LOGICAL_W + 30,
      y: LANE_MIN + 30 + (hash(floor(worldX) ^ 0x91) % 1000) / 1000 * (LANE_MAX - LANE_MIN - 60),
      kind: PICKUP_KINDS[pickupSeq % PICKUP_KINDS.length],
    });
    pickupSeq += 1;
  }
  for (let p of pickups) p.x -= SCROLL_SPEED * dt;
  for (let i = pickups.length - 1; i >= 0; i--) {
    let p = pickups[i];
    if (p.x < -30) {
      pickups.splice(i, 1);
      continue;
    }
    if (abs(p.x - TRUCK_X) < 50 && abs(p.y - truckY) < 36) {
      applyPickup(p.kind);
      pickups.splice(i, 1);
    }
  }

  if (tickIntro(dt)) {
    // Lesson verse owns the slot. The refrain clock does not run yet.
  } else {
    waveTime += dt;
    while (enemies.length < MAX_ENEMIES) {
      let loops = floor(waveIndex / WAVE.length);
      let ev = WAVE[waveIndex % WAVE.length];
      let when = ev.t + loops * WAVE_PERIOD;
      if (waveTime < when) break;
      spawnWaveEvent(ev, refrainScale());
      waveIndex += 1;
    }
  }

  for (let e of enemies) updateEnemy(e, dt);

  for (let i = enemyShots.length - 1; i >= 0; i--) {
    let s = enemyShots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.x < -20 || s.x > LOGICAL_W + 20 || s.y < ROAD_TOP - 10 || s.y > ROAD_BOT + 10) {
      enemyShots.splice(i, 1);
      continue;
    }
    if (invuln <= 0 && aabbHit(TRUCK_X, truckY, TRUCK_HW, TRUCK_HH, s.x, s.y, 5, 5)) {
      applyPartHit(partFromHit(s));
      invuln = INVULN_TIME;
      shake = 5;
      enemyShots.splice(i, 1);
      if (parts.cargo <= 0 || parts.cab <= 0) {
        shake = 0;
        mode = "gameover";
        firing = false;
        break;
      }
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    let hit = enemies.findIndex(
      (e) => abs(b.x - e.x) < e.hw + 4 && abs(b.y - e.y) < e.hh + 4
    );
    if (hit >= 0) {
      bullets.splice(i, 1);
      hurtEnemy(hit, 1);
    }
  }

  if (flameT > 0) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      let beside = abs(e.x - TRUCK_X) < 58 && abs(e.y - truckY) > 16 && abs(e.y - truckY) < 72;
      if (beside) {
        enemies.splice(i, 1);
        spawnTimer = min(spawnTimer, SPAWN_DELAY);
      }
    }
  }

  for (let i = mines.length - 1; i >= 0; i--) {
    let m = mines[i];
    let hit = enemies.findIndex(
      (e) => abs(e.x - m.x) < e.hw + 12 && abs(e.y - m.y) < e.hh + 12
    );
    if (hit >= 0) {
      hurtEnemy(hit, 99);
      mines.splice(i, 1);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (invuln <= 0 && aabbHit(TRUCK_X, truckY, TRUCK_HW, TRUCK_HH, e.x, e.y, e.hw, e.hh)) {
      applyPartHit(partFromHit(e));
      invuln = INVULN_TIME;
      shake = 7;
      enemies.splice(i, 1);
      spawnTimer = min(spawnTimer, SPAWN_DELAY);
      if (parts.cargo <= 0 || parts.cab <= 0) {
        shake = 0;
        mode = "gameover";
        firing = false;
        break;
      }
    } else if (e.x < -60 || e.x > LOGICAL_W + 60) {
      enemies.splice(i, 1);
      spawnTimer = min(spawnTimer, SPAWN_DELAY * 0.5);
    }
  }
}

function partFromHit(e) {
  let dx = e.x - TRUCK_X;
  let dy = e.y - truckY;
  if (abs(dy) > abs(dx) * 0.55) return "tires";
  if (dx < 0) return "cargo";
  return "cab";
}

function applyPartHit(part) {
  parts[part] = max(0, parts[part] - 1);
  partFlash[part] = 0.45;
  if (part === "cargo" && parts.cargo <= 0) failReason = "CARGO GONE";
  if (part === "cab" && parts.cab <= 0) failReason = "CAB GONE";
}

function applyPickup(kind) {
  if (kind === "mine") ammo.mine = min(9, ammo.mine + 1);
  else if (kind === "flame") ammo.flame = min(20, ammo.flame + 1);
  else if (kind === "repair") repairWorstPart();
  else if (kind === "life") {
    for (let k of ["cargo", "cab", "tires"]) {
      parts[k] = min(PART_MAX[k], parts[k] + 1);
    }
  }
}

function repairWorstPart() {
  let order = ["cargo", "cab", "tires"];
  order.sort((a, b) => parts[a] - parts[b] || order.indexOf(a) - order.indexOf(b));
  let p = order[0];
  parts[p] = min(PART_MAX[p], parts[p] + 1);
}

function aimFromMouse() {
  let sx = originX + TRUCK_X * scaleFactor;
  let sy = originY + truckY * scaleFactor;
  turretAngle = atan2(mouseY - sy, mouseX - sx);
}

function hitWeaponHud(x, y) {
  for (let slot of weaponHud) {
    if (abs(x - slot.x) < slot.w / 2 && abs(y - slot.y) < slot.h / 2) return slot.id;
  }
  return -1;
}

function cycleWeapon() {
  weapon = (weapon + 1) % 3;
}

function tryFire() {
  let w = WEAPONS[weapon];
  if (w === "mg") {
    if (mgReload > 0 || mgClip <= 0 || bullets.length >= MAX_BULLETS) {
      if (mgClip <= 0 && mgReload <= 0 && ammo.mg > 0) mgReload = MG_RELOAD;
      fireCd = 0.08;
      return;
    }
    mgClip -= 1;
    fireCd = FIRE_COOLDOWN;
    let ca = cos(turretAngle);
    let sa = sin(turretAngle);
    bullets.push({
      x: TRUCK_X + ca * TURRET_BARREL,
      y: truckY + sa * TURRET_BARREL,
      vx: ca * BULLET_SPEED,
      vy: sa * BULLET_SPEED,
    });
    if (mgClip <= 0 && ammo.mg > 0) mgReload = MG_RELOAD;
  } else if (w === "flame") {
    if (ammo.flame <= 0 || flameT > 0) {
      fireCd = 0.08;
      return;
    }
    ammo.flame -= 1;
    flameT = FLAME_TIME;
    fireCd = FLAME_CD;
  } else {
    if (ammo.mine <= 0) {
      fireCd = 0.08;
      return;
    }
    ammo.mine -= 1;
    mines.push({ x: TRUCK_X - 58, y: truckY });
    fireCd = MINE_CD;
  }
}

function hurtEnemy(i, dmg) {
  if (i < 0 || i >= enemies.length) return;
  enemies[i].hp -= dmg;
  if (enemies[i].hp <= 0) {
    enemies.splice(i, 1);
    spawnTimer = min(spawnTimer, SPAWN_DELAY);
  }
}

function spawnLaneOffset() {
  let lane = LANE_MIN + (hash(floor(worldX) ^ 0x51 ^ enemies.length) % 1000) / 1000 * (LANE_MAX - LANE_MIN);
  let avoid = [truckY, ...enemies.map((e) => e.y)];
  for (let y of avoid) {
    if (abs(lane - y) < 36) lane = constrain(y + (lane < y ? -48 : 48), LANE_MIN, LANE_MAX);
  }
  return lane;
}

function hasKind(kind) {
  return enemies.some((e) => e.kind === kind);
}

function refrainScale() {
  return min(1, 0.72 + 0.28 * min(1, waveTime / REFRAIN_RAMP));
}

function tickIntro(dt) {
  if (introIndex >= INTRO.length) return enemies.some((e) => e.lesson);
  if (enemies.length > 0) {
    introBusy = true;
    return true;
  }
  if (introBusy) {
    introBusy = false;
    introWait = INTRO_GAP;
  }
  introWait -= dt;
  if (introWait > 0) return true;
  spawnWaveEvent(INTRO[introIndex], INTRO_SCALE, true);
  introIndex += 1;
  return true;
}

function spawnWaveEvent(ev, scale, lesson) {
  scale = scale == null ? 1 : scale;
  if (ev.kind === "bike") pushBike(scale, lesson);
  else if (ev.kind === "car") pushCar(scale, lesson);
  else pushSidecar(ev.dir == null ? -1 : ev.dir, scale, lesson);
}

function pushBike(scale, lesson) {
  enemies.push({
    kind: "bike",
    phase: "close",
    x: -40,
    y: spawnLaneOffset(),
    vx: CHASE_VX * 1.15 * scale,
    hw: 20,
    hh: 11,
    hp: 2,
    shotT: 99,
    shoots: false,
    speedScale: scale,
    lesson: !!lesson,
  });
}

function pushCar(scale, lesson) {
  enemies.push({
    kind: "car",
    phase: "approach",
    x: LOGICAL_W + 50,
    y: spawnLaneOffset(),
    vx: FLANK_VX * scale,
    hold: FLANK_HOLD,
    holdT: INTRO_CAR_HOLD,
    hw: 28,
    hh: 14,
    hp: 2,
    shotT: 0.9,
    shoots: true,
    speedScale: scale,
    lesson: !!lesson,
  });
}

function pushSidecar(dir, scale, lesson) {
  // dir -1 from behind left, +1 from ahead right. Glued to a verge.
  let edge = (hash(floor(worldX) ^ 0x44) & 1) ? LANE_MIN + 8 : LANE_MAX - 8;
  enemies.push({
    kind: "sidecar",
    phase: dir < 0 ? "close" : "approach",
    x: dir < 0 ? -45 : LOGICAL_W + 45,
    y: edge,
    vx: (dir < 0 ? CHASE_VX * 0.9 : FLANK_VX * 0.9) * scale,
    hold: 99,
    hw: 24,
    hh: 15,
    hp: 1,
    shotT: 1.4,
    shoots: true,
    verge: edge,
    speedScale: scale,
    lesson: !!lesson,
  });
}

function seekY(e, dt, rate) {
  let dy = truckY - e.y;
  e.y += constrain(dy, -rate * dt, rate * dt);
  e.y = constrain(e.y, LANE_MIN, LANE_MAX);
}

function updateEnemy(e, dt) {
  if (e.kind === "bike") {
    seekY(e, dt, ENEMY_SEEK * 0.7 * e.speedScale);
    e.x += e.vx * dt;
  } else if (e.kind === "car") {
    if (e.phase === "approach") {
      e.x += e.vx * dt;
      if (e.x <= TRUCK_X + FLANK_SLOT) {
        e.x = TRUCK_X + FLANK_SLOT;
        e.vx = 0;
        e.phase = "hold";
      }
    } else if (e.phase === "depart") {
      e.x += e.vx * dt;
    } else {
      e.x = TRUCK_X + FLANK_SLOT;
      if (e.lesson) {
        e.holdT -= dt;
        if (e.holdT <= 0) {
          e.phase = "depart";
          e.vx = CHASE_VX * e.speedScale;
        }
      }
    }
  } else if (e.kind === "sidecar") {
    e.y = e.verge;
    e.x += e.vx * dt;
  }
  if (e.shoots) {
    e.shotT -= dt;
    if (e.shotT <= 0) enemyTryShoot(e);
  }
}

function enemyTryShoot(e) {
  if (enemyShots.length >= MAX_ENEMY_SHOTS) {
    e.shotT = 0.2;
    return;
  }
  if (e.x < 50 || e.x > LOGICAL_W - 40) {
    e.shotT = 0.25;
    return;
  }
  let dx = TRUCK_X - e.x;
  let dy = truckY - e.y;
  let d = max(40, sqrt(dx * dx + dy * dy));
  enemyShots.push({
    x: e.x,
    y: e.y,
    vx: (dx / d) * ENEMY_SHOT_SPEED * e.speedScale,
    vy: (dy / d) * ENEMY_SHOT_SPEED * e.speedScale,
  });
  e.shotT = ENEMY_SHOT_CD + (e.kind === "sidecar" ? 0.35 : 0.15);
}

function aabbHit(ax, ay, ahx, ahy, bx, by, bhx, bhy) {
  return abs(ax - bx) < ahx + bhx && abs(ay - by) < ahy + bhy;
}

function render() {
  background(0);

  let shx = 0;
  let shy = 0;
  if (mode === "play" && shake > 0) {
    shx = (hash(floor(worldX * 8)) / 0xffffffff - 0.5) * shake * 2;
    shy = (hash(floor(worldX * 8) + 9) / 0xffffffff - 0.5) * shake * 2;
  }

  push();
  translate(originX + shx, originY + shy);
  scale(scaleFactor);
  drawingContext.imageSmoothingEnabled = false;
  if (mode === "start" && loaderImg) {
    imageMode(CORNER);
    image(loaderImg, 0, 0, LOGICAL_W, LOGICAL_H);
  } else {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, 0, LOGICAL_W, LOGICAL_H);
    drawingContext.clip();
    drawWorld();
    drawingContext.restore();
  }
  pop();

  drawingContext.imageSmoothingEnabled = false;
  drawControls();
  drawHud();
}

function drawWorld() {
  // verges
  fill(46, 92, 42);
  rect(0, 0, LOGICAL_W, ROAD_TOP);
  fill(40, 82, 38);
  rect(0, ROAD_BOT, LOGICAL_W, LOGICAL_H - ROAD_BOT);

  drawGrassBand(0, ROAD_TOP, 1);
  drawGrassBand(ROAD_BOT, LOGICAL_H, 2);

  fill(58);
  rect(0, ROAD_TOP, LOGICAL_W, ROAD_BOT - ROAD_TOP);
  fill(230);
  rect(0, ROAD_TOP - 2, LOGICAL_W, 4);
  rect(0, ROAD_BOT - 2, LOGICAL_W, 4);

  stroke(255);
  strokeWeight(3);
  let phase = mod(worldX, DASH_PERIOD);
  for (let x = -phase; x < LOGICAL_W + DASH_PERIOD; x += DASH_PERIOD) {
    line(x, 300, x + 25, 300);
  }
  noStroke();

  for (let e of enemies) drawEnemy(e);
  for (let s of enemyShots) {
    fill(255, 90, 40);
    ellipse(s.x, s.y, 9, 9);
    fill(255, 200, 80);
    ellipse(s.x, s.y, 4, 4);
  }
  for (let m of mines) {
    let mi = extras[floor(millis() / 350) % 2 === 0 ? "mine_armed" : "mine_blink"];
    imageMode(CENTER);
    image(mi, m.x, m.y);
  }
  for (let p of pickups) {
    let img = sprites["crate_" + p.kind];
    if (!img) continue;
    imageMode(CENTER);
    image(img, p.x, p.y);
  }
  for (let b of bullets) {
    fill(255, 220, 80);
    ellipse(b.x, b.y, 8, 8);
  }
  drawTruck();
}

function drawGrassBand(y0, y1, seed) {
  const period = 46;
  const idxMin = floor((worldX - 40) / period) - 1;
  const idxMax = ceil((worldX + LOGICAL_W + 40) / period) + 1;
  for (let idx = idxMin; idx <= idxMax; idx++) {
    let x = idx * period - worldX;
    let h = hash(idx * 17 + seed);
    let gy = y0 + 8 + (h % max(8, floor(y1 - y0 - 16)));
    let gw = 8 + (h & 7);
    let gh = 5 + ((h >> 4) & 7);
    fill(34 + (h & 15), 78 + ((h >> 8) & 20), 30);
    ellipse(x, gy, gw, gh);
  }
  drawRoadside(y0, y1, seed);
}

// Decor de bord de route : tout est derive de worldX et hash(idx), jamais du temps.
const ROADSIDE_PERIOD = 90;
const ROADSIDE_KINDS = [
  "roadside_tree_1", "roadside_bush_1", "roadside_rock", "roadside_tree_2",
  "roadside_bush_2", "roadside_post", "roadside_sign_km", "roadside_bush_1",
];

function drawRoadside(y0, y1, seed) {
  if (!extras.roadside_tree_1) return;
  const idxMin = floor((worldX - 60) / ROADSIDE_PERIOD) - 1;
  const idxMax = ceil((worldX + LOGICAL_W + 60) / ROADSIDE_PERIOD) + 1;
  imageMode(CENTER);
  for (let idx = idxMin; idx <= idxMax; idx++) {
    let h = hash(idx * 31 + seed * 7919);
    if (h % 3 === 0) continue;
    let img = extras[ROADSIDE_KINDS[(h >>> 3) % ROADSIDE_KINDS.length]];
    let x = idx * ROADSIDE_PERIOD - worldX + ((h >>> 8) % 40);
    let near = y0 === 0 ? ROAD_TOP - 36 : ROAD_BOT + 36;
    let far = y0 === 0 ? y0 + 20 : y1 - 20;
    let t = ((h >>> 12) % 100) / 100;
    if (img === extras.roadside_post || img === extras.roadside_sign_km) t = 0.95;
    let y = lerp(far, near, t);
    image(img, floor(x), floor(y));
  }
  // bande de gravier entre l'herbe et la route
  let g = extras.roadside_gravel;
  let gy = y0 === 0 ? ROAD_TOP - 14 : ROAD_BOT + 2;
  imageMode(CORNER);
  let gp = mod(worldX, 32);
  for (let x = -gp; x < LOGICAL_W + 32; x += 32) image(g, floor(x), gy);
  imageMode(CENTER);
}

function partFill(part, okR, okG, okB) {
  let flash = mode === "play" && (invuln > 0 || partFlash[part] > 0) && floor((invuln + partFlash[part]) * 12) % 2 === 0;
  if (flash) return [220, 220, 220];
  if (parts[part] <= 0) return [40, 20, 20];
  if (parts[part] === 1) return [min(255, okR + 80), okG * 0.45, okB * 0.35];
  return [okR, okG, okB];
}

function drawTruck() {
  if (!spriteVariants.cargo) return;
  push();
  translate(TRUCK_X, truckY);
  imageMode(CENTER);
  image(spriteVariants.tires[layerState("tires")], 0, 0);
  image(spriteVariants.cargo[layerState("cargo")], 0, 0);
  image(spriteVariants.cab[layerState("cab")], 0, 0);

  if (flameT > 0) {
    let fl = extras["flame_" + (1 + (floor(flameT * 16) % 3))];
    imageMode(CORNER);
    push();
    translate(31, -16);
    rotate(-HALF_PI);
    image(fl, 0, -14);
    pop();
    push();
    translate(31, 16);
    rotate(HALF_PI);
    image(fl, 0, -14);
    pop();
    imageMode(CENTER);
  }

  push();
  rotate(turretAngle);
  imageMode(CENTER);
  image(sprites.truck_turret, 0, 0);
  pop();
  pop();
}

function drawEnemy(e) {
  let img = sprites[e.kind];
  if (!img) return;
  push();
  translate(e.x, e.y);
  if (e.vx < 0) scale(-1, 1);
  imageMode(CENTER);
  image(img, 0, 0);
  pop();
}

function drawControls() {
  if (!usingTouch) return;
  fill(0, 255, 100, 22);
  rect(0, 0, leftZoneWidth, windowHeight);
  stroke(0, 255, 100, 55);
  strokeWeight(2);
  line(leftZoneWidth, 0, leftZoneWidth, windowHeight);
  noStroke();

  let fireHeld = pointerHasRole("fire") || keys.fire;
  fill(fireHeld ? 255 : 220, fireHeld ? 70 : 50, fireHeld ? 70 : 50, fireHeld ? 200 : 140);
  ellipse(fireBtn.x, fireBtn.y, fireBtn.r * 2);
  fill(255, 230);
  textAlign(CENTER, CENTER);
  textSize(13);
  text("FIRE", fireBtn.x, fireBtn.y);

  fill(80, 140, 220, 160);
  ellipse(cycleBtn.x, cycleBtn.y, cycleBtn.r * 2);
  fill(255);
  textSize(11);
  text("CYCLE", cycleBtn.x, cycleBtn.y);

  fill(255, 255, 255, 32);
  ellipse(turretJoystick.x, turretJoystick.y, turretJoystick.baseRadius * 2);
  let knobX =
    turretJoystick.x +
    cos(turretJoystick.angle) *
      turretJoystick.magnitude *
      (turretJoystick.baseRadius - turretJoystick.knobRadius);
  let knobY =
    turretJoystick.y +
    sin(turretJoystick.angle) *
      turretJoystick.magnitude *
      (turretJoystick.baseRadius - turretJoystick.knobRadius);
  fill(255, 255, 255, 210);
  ellipse(knobX, knobY, turretJoystick.knobRadius * 2);
}

function drawHud() {
  if (mode === "start") {
    let bandH = max(46, 40 * scaleFactor);
    let y = originY + LOGICAL_H * scaleFactor - bandH;
    noStroke();
    fill(0);
    rect(originX, y, LOGICAL_W * scaleFactor, bandH);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(max(13, min(18, 14 * scaleFactor)));
    let cx = originX + (LOGICAL_W * scaleFactor) / 2;
    text("desk: Z/S lane · mouse aim · click fire · X cycle", cx, y + bandH * 0.35);
    text("phone: left strip · stick · FIRE · CYCLE", cx, y + bandH * 0.72);
    return;
  }

  drawPartDiagram(originX + 14, originY + 12);
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);
  text("KM  " + (worldX / 120).toFixed(1), originX + 12, originY + 58);

  let labels = ["MG", "FLAME", "MINE"];
  let counts = [mgReload > 0 ? ".." : mgClip, ammo.flame, ammo.mine];
  for (let slot of weaponHud) {
    let on = slot.id === weapon;
    fill(on ? 40 : 20, on ? 40 : 20, on ? 40 : 20, 200);
    rect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h, 4);
    stroke(on ? 255 : 120);
    strokeWeight(on ? 2 : 1);
    noFill();
    rect(slot.x - slot.w / 2, slot.y - slot.h / 2, slot.w, slot.h, 4);
    noStroke();
    fill(slot.id === 0 ? (mgClip > 0 && mgReload <= 0 ? 255 : 140) : counts[slot.id] > 0 ? 255 : 140);
    textAlign(CENTER, CENTER);
    textSize(11);
    text(labels[slot.id], slot.x, slot.y - 7);
    textSize(13);
    text(counts[slot.id], slot.x, slot.y + 8);
  }

  textAlign(CENTER, CENTER);
  if (mode === "gameover") {
    fill(0, 0, 0, 160);
    rect(0, 0, windowWidth, windowHeight);
    fill(255);
    textSize(28);
    text(failReason, windowWidth / 2, windowHeight / 2 - 18);
    textSize(16);
    fill(200);
    text("SPACE / TAP  to  roll again", windowWidth / 2, windowHeight / 2 + 16);
  }
}

function drawPartDiagram(x, y) {
  push();
  translate(x, y);
  noStroke();
  fill(0, 0, 0, 140);
  rect(0, 0, 92, 44, 4);
  function col(part, r, g, b) {
    let c = partFill(part, r, g, b);
    fill(c[0], c[1], c[2]);
  }
  col("cargo", 70, 130, 180);
  rect(8, 14, 48, 16, 2);
  col("cab", 50, 90, 140);
  rect(52, 16, 18, 12, 2);
  col("tires", 200, 200, 200);
  ellipse(18, 12, 7, 7);
  ellipse(18, 32, 7, 7);
  ellipse(58, 12, 7, 7);
  ellipse(58, 32, 7, 7);
  fill(220);
  textAlign(LEFT, TOP);
  textSize(9);
  text("CARGO  CAB", 8, 2);
  pop();
}

function pointerHasRole(role) {
  for (let p of pointers.values()) if (p.role === role) return true;
  return false;
}

function assignRole(x, y) {
  if (x < leftZoneWidth) return "lane";
  for (let slot of weaponHud) {
    if (abs(x - slot.x) < slot.w / 2 && abs(y - slot.y) < slot.h / 2) return "hud" + slot.id;
  }
  if (dist(x, y, cycleBtn.x, cycleBtn.y) < cycleBtn.r * 1.25) return "cycle";
  if (dist(x, y, fireBtn.x, fireBtn.y) < fireBtn.r * 1.25) return "fire";
  if (dist(x, y, turretJoystick.x, turretJoystick.y) < turretJoystick.baseRadius * 1.6) return "turret";
  return "tap";
}

function applyPointer(p) {
  if (p.role === "lane") {
    let logicalY = (p.y - originY) / scaleFactor;
    truckTargetY = constrain(map(logicalY, 220, 380, LANE_MIN, LANE_MAX), LANE_MIN, LANE_MAX);
  } else if (p.role === "turret") {
    let dx = p.x - turretJoystick.x;
    let dy = p.y - turretJoystick.y;
    turretJoystick.angle = atan2(dy, dx);
    let d = sqrt(dx * dx + dy * dy);
    turretJoystick.magnitude = constrain(d / turretJoystick.baseRadius, 0, 1);
    if (turretJoystick.magnitude > 0.08) turretAngle = turretJoystick.angle;
  }
}

function refreshFiring() {
  firing = pointerHasRole("fire");
}

function claimPointer(id, x, y) {
  if (pointers.has(id)) return;
  let role = assignRole(x, y);
  if (role === "cycle") cycleWeapon();
  if (role === "hud0" || role === "hud1" || role === "hud2") weapon = int(role.slice(3));
  pointers.set(id, { x, y, role });
  applyPointer(pointers.get(id));
  refreshFiring();
}

function movePointer(id, x, y) {
  let p = pointers.get(id);
  if (!p) {
    claimPointer(id, x, y);
    return;
  }
  p.x = x;
  p.y = y;
  applyPointer(p);
}

function releasePointer(id) {
  let p = pointers.get(id);
  if (!p) return;
  pointers.delete(id);
  if (p.role === "turret" && !pointerHasRole("turret")) {
    turretJoystick.magnitude = 0;
  }
  refreshFiring();
}

function beginRunFromInput() {
  if (mode === "start") {
    resetRun();
    mode = "play";
    return true;
  }
  if (mode === "gameover") {
    resetRun();
    mode = "play";
    return true;
  }
  return false;
}

function liveTouchIds() {
  let s = new Set();
  for (let t of touches) s.add(t.id);
  return s;
}

function touchStarted() {
  usingTouch = true;
  if (touches.length && mode !== "play") beginRunFromInput();
  for (let t of touches) {
    if (!pointers.has(t.id)) claimPointer(t.id, t.x, t.y);
  }
  return false;
}

function touchMoved() {
  for (let t of touches) movePointer(t.id, t.x, t.y);
  return false;
}

function touchEnded() {
  let live = liveTouchIds();
  for (let id of [...pointers.keys()]) {
    if (id === "mouse") continue;
    if (!live.has(id)) releasePointer(id);
  }
  return false;
}

function mousePressed() {
  if (touches.length) return;
  usingTouch = false;
  if (mode !== "play") beginRunFromInput();
  let hud = hitWeaponHud(mouseX, mouseY);
  if (hud >= 0) {
    weapon = hud;
    return;
  }
  keys.fire = true;
}

function mouseDragged() {
  if (touches.length) return;
  usingTouch = false;
}

function mouseReleased() {
  if (touches.length) return;
  keys.fire = false;
}

function mouseMoved() {
  if (touches.length) return;
  usingTouch = false;
}

function keyPressed() {
  if (keyCode === UP_ARROW || key === "z" || key === "Z") keys.up = true;
  if (keyCode === DOWN_ARROW || key === "s" || key === "S") keys.down = true;
  if (key === " " || keyCode === 32) {
    keys.fire = true;
    if (mode !== "play") beginRunFromInput();
    return false;
  }
  if (key === "x" || key === "X") cycleWeapon();
  // AZERTY top row is & é " until Shift. keyCode 49-51 is the physical keys.
  if (key === "1" || key === "&" || keyCode === 49) weapon = 0;
  if (key === "2" || key === "é" || keyCode === 50) weapon = 1;
  if (key === "3" || key === '"' || keyCode === 51) weapon = 2;
  if (key === "r" || key === "R") {
    resetRun();
    mode = "play";
  }
}

function keyReleased() {
  if (keyCode === UP_ARROW || key === "z" || key === "Z") keys.up = false;
  if (keyCode === DOWN_ARROW || key === "s" || key === "S") keys.down = false;
  if (key === " " || keyCode === 32) keys.fire = false;
}
