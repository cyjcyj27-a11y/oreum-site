// ===== 냥냥 검객 대전 =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND_Y = 400;
const SPRITE_SIZE = 190;

const POSE_KEYS = ['idle', 'move', 'hit', 'sleep', 'ultimate', 'swordswing', 'lp', 'hp', 'lk', 'hk', 'jump', 'crouch'];

const CHARACTERS = {
  cat: {
    label: '고양이 루루',
    sources: {
      idle:      { src: 'assets/cat_idle.png' },
      move:      { src: 'assets/cat_move.png' },
      hit:       { src: 'assets/cat_hit.png' },
      sleep:     { src: 'assets/cat_sleep.png' },
      ultimate:  { src: 'assets/cat_ultimate.png' }, // original "스킬" spin-slash art — 필살기 (강손+강발, 게이지 필요)
      swordswing:{ src: 'assets/cat_swordswing.png' }, // 검 휘두르기 — 약손+강손 콤보
      lp: { src: 'assets/lp.png' }, hp: { src: 'assets/hp.png' }, lk: { src: 'assets/lk.png' },
      hk: { src: 'assets/hk.png' }, jump: { src: 'assets/jump.png' }, crouch: { src: 'assets/crouch.png' },
    },
    // the move sheet's source art isn't drawn facing one consistent way — this corrects each pose
    // to the idle/move sheet's rightward convention before p.facing flips it
    baseFacing: { lp: -1, hp: -1, lk: -1, hk: 1, jump: 1, crouch: 1 },
  },
  dog: {
    label: '강아지',
    sources: {
      idle:      { src: 'assets/dog_idle.png' },
      move:      { src: 'assets/dog_move.png' },
      hit:       { src: 'assets/dog_hit.png' },
      sleep:     { src: 'assets/dog_sleep.png' },
      ultimate:  { src: 'assets/dog_ultimate.png' },
      swordswing:{ src: 'assets/dog_swordswing.png' },
      lp: { src: 'assets/dog_lp.png' }, hp: { src: 'assets/dog_hp.png' }, lk: { src: 'assets/dog_lk.png' },
      hk: { src: 'assets/dog_hk.png' }, jump: { src: 'assets/dog_jump.png' }, crouch: { src: 'assets/dog_crouch.png' },
    },
    baseFacing: { lp: -1, hp: 1, lk: 1, hk: 1, jump: -1, crouch: -1 },
  },
};

const imageCache = {};
function getImage(src) {
  if (!imageCache[src]) {
    const im = new Image();
    im.loaded = false;
    im.onload = () => { im.loaded = true; checkAllLoaded(); };
    im.onerror = () => { im.loaded = true; checkAllLoaded(); }; // don't let one bad file hang the loader forever
    im.src = src;
    imageCache[src] = im;
  }
  return imageCache[src];
}
for (const charKey of Object.keys(CHARACTERS)) {
  for (const poseKey of POSE_KEYS) {
    const def = CHARACTERS[charKey].sources[poseKey];
    if (def) getImage(def.src);
  }
}
const totalImageCount = Object.keys(imageCache).length;

function checkAllLoaded() {
  const loadedCount = Object.values(imageCache).filter(im => im.loaded).length;
  const btn = document.getElementById('startBtn');
  if (loadedCount >= totalImageCount) {
    document.getElementById('loading').style.display = 'none';
    btn.disabled = false;
    btn.textContent = '게임 시작';
  } else {
    const pct = Math.round((loadedCount / totalImageCount) * 100);
    document.getElementById('loading').textContent = `이미지 불러오는 중... ${pct}% (${loadedCount}/${totalImageCount})`;
    btn.textContent = `불러오는 중... ${pct}%`;
  }
}
checkAllLoaded();

function spriteSource(p) {
  const charDef = CHARACTERS[p.char];
  const def = charDef.sources[p.state] || charDef.sources.idle;
  const img = getImage(def.src);
  const cell = (def.x !== undefined) ? def : { x: 0, y: 0, w: img.naturalWidth || 512, h: img.naturalHeight || 320 };
  return { img, ready: img.loaded, cell };
}

// ---------- Audio ----------
let actx = null;
function ensureAudio() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
}

const bgm = new Audio('assets/bgm.mp3');
bgm.loop = true;
bgm.volume = 0.35;
function startBgm() {
  bgm.play().catch(() => {});
}

function makeClip(src, volume, clipMs) {
  const base = new Audio(src);
  base.volume = volume;
  return {
    prime: () => base.play().then(() => { base.pause(); base.currentTime = 0; }).catch(() => {}),
    play: (rate) => {
      const s = base.cloneNode();
      s.volume = volume;
      if (rate) s.playbackRate = rate;
      s.play().catch(() => {});
      if (clipMs) setTimeout(() => { s.pause(); }, clipMs);
    },
  };
}
const koClip = makeClip('assets/ko.mp3', 0.8, null);
const dogKoClip = makeClip('assets/dog_ko.mp3', 0.8, null);
const CHAR_KO = { cat: koClip, dog: dogKoClip };
const hitClip = makeClip('assets/hit.wav', 0.7, null);
const lpClip = makeClip('assets/lp.mp3', 0.7, null);
const hpClip = makeClip('assets/hp.mp3', 0.7, null);
const lkClip = makeClip('assets/lk.mp3', 0.7, null);
const hkClip = makeClip('assets/hk.mp3', 0.7, null);
const ultimateClip = makeClip('assets/skill.mp3', 0.8, null);
const dogLpClip = makeClip('assets/dog_lp.mp3', 0.7, null);
const dogHpClip = makeClip('assets/dog_hp.mp3', 0.7, null);
const dogLkClip = makeClip('assets/dog_lk.mp3', 0.7, null);
const dogHkClip = makeClip('assets/dog_hk.mp3', 0.7, null);
const dogUltimateClip = makeClip('assets/dog_ultimate.mp3', 0.8, null);
const CHAR_SOUNDS = {
  cat: { lp: lpClip, hp: hpClip, lk: lkClip, hk: hkClip, ultimate: ultimateClip },
  dog: { lp: dogLpClip, hp: dogHpClip, lk: dogLkClip, hk: dogHkClip, ultimate: dogUltimateClip },
};
function primeSkillSound() {
  koClip.prime(); dogKoClip.prime(); hitClip.prime();
  lpClip.prime(); hpClip.prime(); lkClip.prime(); hkClip.prime(); ultimateClip.prime();
  dogLpClip.prime(); dogHpClip.prime(); dogLkClip.prime(); dogHkClip.prime(); dogUltimateClip.prime();
}
function tone(freq, dur, type, vol, delay, glide) {
  if (!actx) return;
  setTimeout(() => {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, actx.currentTime);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(glide, 40), actx.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.15, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  }, delay || 0);
}
function noiseSwoosh(dur, vol, delay) {
  if (!actx) return;
  setTimeout(() => {
    const bufferSize = Math.floor(actx.sampleRate * dur);
    const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = actx.createBufferSource();
    noise.buffer = buffer;
    const filter = actx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, actx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, actx.currentTime + dur);
    filter.Q.value = 1.1;
    const gain = actx.createGain();
    gain.gain.setValueAtTime(vol, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(actx.destination);
    noise.start(); noise.stop(actx.currentTime + dur);
  }, delay || 0);
}
function swordSwing() {
  noiseSwoosh(0.22, 0.28, 0);
  tone(1800, 0.07, 'triangle', 0.14, 110, 900);
}
const sfx = {
  hit: () => {},
  ko: (char) => { (CHAR_KO[char] || koClip).play(); },
  beep: () => { tone(440, 0.1, 'sine', 0.15, 0); },
  fight: () => { tone(660, 0.2, 'square', 0.18, 0, 1000); },
  sword: () => swordSwing(),
};

// ---------- Particles ----------
let particles = [];
function spawnHitFx(x, y) {
  const icons = ['⭐', '💥', '✨', '💕'];
  for (let i = 0; i < 7; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -2 - Math.random() * 2,
      icon: icons[Math.floor(Math.random() * icons.length)],
      size: 18 + Math.random() * 14,
      life: 1,
    });
  }
}
function spawnBlockFx(x, y) {
  for (let i = 0; i < 3; i++) {
    particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 16,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -1.5 - Math.random() * 1.5,
      icon: '🛡️',
      size: 20 + Math.random() * 10,
      life: 1,
    });
  }
}
function spawnWaveFx(x, y, dir, distance) {
  const steps = 6;
  const travelMs = 260; // how long the wave takes to cross the gap
  for (let i = 0; i < steps; i++) {
    particles.push({
      x: x + dir * (i * (distance / steps)),
      y: y + (Math.random() - 0.5) * 10,
      vx: dir * (distance / (travelMs / 16.7)),
      vy: 0,
      noGravity: true,
      icon: i % 2 === 0 ? '💥' : '⚡',
      size: 24 + Math.random() * 8,
      life: 1,
    });
  }
}
function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    if (!p.noGravity) p.vy += 0.05;
    p.life -= dt / 600;
  }
  particles = particles.filter(p => p.life > 0);
}
function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.font = `${p.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.icon, p.x, p.y);
    ctx.restore();
  }
}

// ---------- Player ----------
function makePlayer(x, tag, color, keys, char) {
  return {
    x, y: GROUND_Y, facing: x < W / 2 ? 1 : -1,
    hp: 200, maxHp: 200,
    state: 'idle', stateTimer: 0,
    cdAttack: 0, cdSkill: 0,
    tag, color, keys, char,
    knockVX: 0,
    airborne: false, jumpY: 0, jumpVY: 0,
    crouching: false,
    gauge: 0, maxGauge: 100,
  };
}
const P1 = makePlayer(220, 'P1', '#4d8cff', {
  left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown',
  lp: 'KeyW', hp: 'KeyA', lk: 'KeyS', hk: 'KeyD',
}, 'cat');
const P2 = makePlayer(680, 'CPU', '#ff5c7a', null, 'dog');

function getHumanInput(p) {
  return {
    left: keysDown.has(p.keys.left),
    right: keysDown.has(p.keys.right),
    up: keysDown.has(p.keys.up),
    down: keysDown.has(p.keys.down),
    lp: keysDown.has(p.keys.lp),
    hp: keysDown.has(p.keys.hp),
    lk: keysDown.has(p.keys.lk),
    hk: keysDown.has(p.keys.hk),
  };
}

function getAIInput(p, other) {
  const dist = Math.abs(p.x - other.x);
  const attackReady = p.cdAttack <= 0;
  const skillReady = p.cdSkill <= 0;
  let left = false, right = false, up = false, down = false;
  let lp = false, hp = false, lk = false, hk = false;

  if (p.gauge >= p.maxGauge && dist <= 140 && Math.random() < 0.035) {
    hp = true; hk = true;
  } else if (attackReady && skillReady && dist <= 125 && Math.random() < 0.025) {
    lp = true; hp = true;
  } else if (skillReady && dist <= 135 && Math.random() < 0.02) {
    hk = true;
  } else if (skillReady && dist <= 115 && Math.random() < 0.015) {
    hp = true;
  } else if (attackReady && dist <= 100 && Math.random() < 0.045) {
    if (Math.random() < 0.5) lp = true; else lk = true;
  } else if (dist > 90 && Math.random() < 0.35) {
    if (p.x < other.x) right = true; else left = true;
    if (Math.random() < 0.004) up = true;
  }
  return { left, right, up, down, lp, hp, lk, hk };
}

const keysDown = new Set();
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
  keysDown.add(e.code);
});
window.addEventListener('keyup', e => keysDown.delete(e.code));

document.querySelectorAll('.padBtn, .atkBtn').forEach(btn => {
  const code = btn.dataset.key;
  const press = e => { e.preventDefault(); keysDown.add(code); };
  const release = e => { e.preventDefault(); keysDown.delete(code); };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('contextmenu', e => e.preventDefault());
});

let gameState = 'menu'; // menu | countdown | fight | over
let countdownVal = 3;
let countdownTimer = 0;
let winner = null;
let aiFreezeTimer = 0;
let shakeTime = 0;

function startRound() {
  P1.x = 220; P2.x = 680;
  P1.hp = P1.maxHp; P2.hp = P2.maxHp;
  P1.state = 'idle'; P2.state = 'idle';
  P1.stateTimer = 0; P2.stateTimer = 0;
  P1.cdAttack = 0; P1.cdSkill = 0; P2.cdAttack = 0; P2.cdSkill = 0;
  P1.airborne = false; P1.jumpY = 0; P1.jumpVY = 0; P1.crouching = false;
  P2.airborne = false; P2.jumpY = 0; P2.jumpVY = 0; P2.crouching = false;
  P1.gauge = 0; P2.gauge = 0;
  particles = [];
  winner = null;
  gameState = 'countdown';
  countdownVal = 3;
  countdownTimer = 0;
  aiFreezeTimer = 1800;
}

let selectedChar = { 1: 'cat', 2: 'dog' };
document.querySelectorAll('.charBtn').forEach(btn => {
  const player = btn.dataset.player;
  if (btn.dataset.char === selectedChar[player]) btn.classList.add('active');
  btn.addEventListener('click', () => {
    selectedChar[player] = btn.dataset.char;
    document.querySelectorAll(`.charBtn[data-player="${player}"]`).forEach(b => b.classList.toggle('active', b === btn));
  });
});

// KakaoTalk's in-app browser blocks Fullscreen/Orientation APIs at the app level —
// no amount of CSS/JS on our side can override that, so just point users at their
// real browser instead of silently failing to go landscape.
if (/KAKAOTALK/i.test(navigator.userAgent)) {
  const warn = document.getElementById('kakaoWarning');
  warn.classList.add('show');
  document.getElementById('openExternalBtn').addEventListener('click', () => {
    location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(location.href);
  });
}

document.getElementById('startBtn').addEventListener('click', () => {
  ensureAudio();
  primeSkillSound();
  startBgm();
  document.getElementById('overlay').classList.add('hidden');
  P1.char = selectedChar[1];
  P2.char = selectedChar[2];
  startRound();
  enterFullscreenLandscape();
});

// ---------- Update ----------
const GRAVITY = 0.62;
const JUMP_VY = -11.5;

// 약손/약발: 빠르고 가볍게. 강손/강발: 느리지만 묵직하게. 필살기(검)는 항상 강손/강발보다 세게.
const MOVES = {
  lp: { pose: 'lp', dmg: 4,  range: 100, cd: 250, knock: 6,  recover: 150, rate: 1.0, tier: 'light', gauge: 12 },
  lk: { pose: 'lk', dmg: 5,  range: 100, cd: 270, knock: 7,  recover: 160, rate: 1.0, tier: 'light', gauge: 14 },
  hp: { pose: 'hp', dmg: 14, range: 112, cd: 900,  knock: 14, recover: 450, rate: 1.0, tier: 'heavy', gauge: 22 },
  hk: { pose: 'hk', dmg: 20, range: 135, cd: 1500, knock: 18, recover: 550, rate: 1.0, tier: 'heavy', gauge: 26 },
};
const HEAVIEST_MOVE_DMG = Math.max(MOVES.hp.dmg, MOVES.hk.dmg);
const ULTIMATE = { pose: 'ultimate', dmgPct: 0.3, range: 145, recover: 550, rate: 1.0 };
// 검 휘두르기: 약손+강손 콤보로 나가는 중간 단계 필살기 (게이지 불필요)
const SWORD_SWING = { pose: 'swordswing', dmg: 24, range: 125, cd: 1100, knock: 16, recover: 480, gauge: 20 };

function doMove(p, other, key) {
  const m = MOVES[key];
  p.state = m.pose;
  p.stateTimer = m.recover;
  if (m.tier === 'light') p.cdAttack = m.cd; else p.cdSkill = m.cd;
  CHAR_SOUNDS[p.char][key].play(m.rate);
  tryHit(p, other, m.range, m.dmg, m.knock, m.gauge);
}

function doSwordSwing(p, other) {
  p.state = SWORD_SWING.pose;
  p.stateTimer = SWORD_SWING.recover;
  p.cdAttack = SWORD_SWING.cd;
  p.cdSkill = SWORD_SWING.cd;
  sfx.sword();
  tryHit(p, other, SWORD_SWING.range, SWORD_SWING.dmg, SWORD_SWING.knock, SWORD_SWING.gauge);
}

function doUltimate(p, other) {
  p.gauge = 0;
  p.state = ULTIMATE.pose;
  p.stateTimer = ULTIMATE.recover;
  CHAR_SOUNDS[p.char].ultimate.play(ULTIMATE.rate);
  sfx.sword();
  const dmg = Math.max(HEAVIEST_MOVE_DMG + 8, Math.round(other.hp * ULTIMATE.dmgPct));
  const reach = Math.max(ULTIMATE.range, Math.abs(other.x - p.x));
  spawnWaveFx(p.x, GROUND_Y - 120, p.facing, reach);
  tryHit(p, other, ULTIMATE.range, dmg, 20, 0, true);
}

function updatePlayer(p, other, dt, input) {
  if (p.cdAttack > 0) p.cdAttack -= dt;
  if (p.cdSkill > 0) p.cdSkill -= dt;
  if (p.knockVX !== 0) {
    p.x += p.knockVX;
    p.knockVX *= 0.8;
    if (Math.abs(p.knockVX) < 0.1) p.knockVX = 0;
  }
  p.x = Math.max(50, Math.min(W - 50, p.x));

  if (p.state !== 'sleep' && p.airborne) {
    const step = dt / 16.67;
    p.jumpVY += GRAVITY * step;
    p.jumpY += p.jumpVY * step;
    if (p.jumpY >= 0) { p.jumpY = 0; p.jumpVY = 0; p.airborne = false; }
  }

  if (p.state === 'sleep') return;

  if (p.stateTimer > 0) {
    p.stateTimer -= dt;
    if (p.stateTimer <= 0) {
      p.state = p.airborne ? 'jump' : (p.crouching ? 'crouch' : 'idle');
    }
    return;
  }

  p.facing = p.x < other.x ? 1 : -1;

  const { left, right, up, down, lp, hp, lk, hk } = input;

  p.crouching = down && !p.airborne;

  if (up && !p.airborne && !p.crouching) {
    p.airborne = true;
    p.jumpVY = JUMP_VY;
    p.jumpY = -0.01;
  }

  if (hp && hk && p.gauge >= p.maxGauge) { doUltimate(p, other); return; }
  if (lp && hp && p.cdAttack <= 0 && p.cdSkill <= 0) { doSwordSwing(p, other); return; }
  if (lp && p.cdAttack <= 0) { doMove(p, other, 'lp'); return; }
  if (lk && p.cdAttack <= 0) { doMove(p, other, 'lk'); return; }
  if (hp && p.cdSkill <= 0) { doMove(p, other, 'hp'); return; }
  if (hk && p.cdSkill <= 0) { doMove(p, other, 'hk'); return; }

  if (p.crouching) {
    p.state = 'crouch';
    return;
  }

  const minDist = 95;
  if (p.airborne) {
    if (left) p.x = Math.max(50, p.x - 1.2);
    if (right) p.x = Math.min(W - 50, p.x + 1.2);
    p.state = 'jump';
  } else if (left || right) {
    const dir = left ? -1 : 1;
    const nx = p.x + dir * 1.7;
    if (Math.abs(nx - other.x) > minDist) p.x = nx;
    p.state = 'move';
  } else {
    p.state = 'idle';
  }
}

const BLOCK_DAMAGE_FACTOR = 0.25; // crouching (앉기) blocks most damage through
const BLOCK_KNOCK_FACTOR = 0.3;

function tryHit(attacker, target, range, dmg, knock, gaugeGain, fullBlock) {
  const dist = Math.abs(attacker.x - target.x);
  const facingRight = attacker.facing === 1 ? target.x > attacker.x : target.x < attacker.x;
  if (dist <= range && facingRight && target.state !== 'sleep') {
    if (gaugeGain) attacker.gauge = Math.min(attacker.maxGauge, attacker.gauge + gaugeGain);

    const blocking = target.crouching && !target.airborne;
    const finalDmg = blocking ? (fullBlock ? 0 : Math.max(1, Math.round(dmg * BLOCK_DAMAGE_FACTOR))) : dmg;
    const finalKnock = blocking ? knock * BLOCK_KNOCK_FACTOR : knock;

    target.hp = Math.max(0, target.hp - finalDmg);
    target.knockVX = attacker.facing * finalKnock;
    const midX = (attacker.x + target.x) / 2;
    if (blocking) {
      spawnBlockFx(midX, GROUND_Y - 130);
      shakeTime = 60;
    } else {
      target.state = 'hit'; target.stateTimer = 240;
      spawnHitFx(midX, GROUND_Y - 150);
      sfx.hit();
      shakeTime = 160;
    }
    if (target.hp <= 0) {
      target.state = 'sleep'; target.stateTimer = 999999;
      winner = attacker.tag;
      gameState = 'over';
      sfx.ko(target.char);
    }
  }
}

let lastTime = performance.now();
function update(now) {
  const dt = Math.min(now - lastTime, 40);
  lastTime = now;

  if (gameState === 'countdown') {
    countdownTimer += dt;
    if (countdownTimer >= 700) {
      countdownTimer = 0;
      countdownVal -= 1;
      if (countdownVal <= 0) {
        gameState = 'fight';
        sfx.fight();
      } else {
        sfx.beep();
      }
    }
    // let P1 move/jump/crouch into position during the countdown; attacks stay locked until FIGHT
    const preInput = getHumanInput(P1);
    preInput.lp = false; preInput.hp = false; preInput.lk = false; preInput.hk = false;
    updatePlayer(P1, P2, dt, preInput);
  } else if (gameState === 'fight') {
    updatePlayer(P1, P2, dt, getHumanInput(P1));
    if (aiFreezeTimer > 0) {
      aiFreezeTimer -= dt;
      updatePlayer(P2, P1, dt, { left: false, right: false, up: false, down: false, lp: false, hp: false, lk: false, hk: false });
    } else {
      updatePlayer(P2, P1, dt, getAIInput(P2, P1));
    }
  } else if (gameState === 'over' || gameState === 'menu') {
    // keep knockback settling
    P1.knockVX *= 0.9; P2.knockVX *= 0.9;
  }

  updateParticles(dt);
  if (shakeTime > 0) shakeTime -= dt;
}

// ---------- Draw ----------
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#bfe7ff');
  sky.addColorStop(1, '#eaf7ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);

  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.8;
  drawCloud(140, 80, 1);
  drawCloud(650, 60, 0.8);
  drawCloud(420, 120, 0.6);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#9fd97a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#8bcf63';
  for (let x = -20; x < W + 20; x += 40) {
    ctx.beginPath();
    ctx.arc(x, GROUND_Y, 22, Math.PI, 0);
    ctx.fill();
  }
}
function drawCloud(x, y, s) {
  ctx.beginPath();
  ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 22 * s, y + 6 * s, 16 * s, 0, Math.PI * 2);
  ctx.arc(x - 22 * s, y + 6 * s, 16 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawSprite(p) {
  const src = spriteSource(p);
  if (!src.ready) return;
  const cell = src.cell;
  const spriteH = SPRITE_SIZE * (cell.h / cell.w);
  const bob = (p.state === 'idle' || p.state === 'move') && !p.airborne ? Math.sin(performance.now() / 260 + p.x) * 4 : 0;
  let squishX = 1, squishY = 1;
  if (p.state === 'hit') { squishX = 1.12; squishY = 0.86; }
  if (['lp', 'lk', 'hp', 'hk'].includes(p.state)) { squishX = 1.05; squishY = 0.97; }
  const baseFacing = CHARACTERS[p.char].baseFacing[p.state] || 1;

  ctx.save();
  ctx.translate(p.x, p.y + bob + p.jumpY);
  ctx.scale(p.facing * baseFacing * squishX, squishY);
  ctx.drawImage(src.img, cell.x, cell.y, cell.w, cell.h, -SPRITE_SIZE / 2, -spriteH, SPRITE_SIZE, spriteH);
  ctx.restore();

  // shadow — shrinks and fades as the character gets higher off the ground
  const heightFrac = p.airborne ? Math.min(1, -p.jumpY / 140) : 0;
  ctx.save();
  ctx.globalAlpha = 0.25 * (1 - heightFrac * 0.6);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 8, 46 * (1 - heightFrac * 0.4), 10 * (1 - heightFrac * 0.4), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHpBar(p, x, alignRight) {
  const w = 260, h = 22;
  ctx.save();
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#5a3d20';
  ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.fillText(p.tag + ' ' + CHARACTERS[p.char].label, alignRight ? x + w : x, 26);

  roundRect(x, 32, w, h, 10);
  ctx.fillStyle = '#3a2c22';
  ctx.fill();

  const pct = Math.max(0, p.hp / p.maxHp);
  const barW = (w - 6) * pct;
  const bx = alignRight ? x + w - 3 - barW : x + 3;
  roundRect(bx, 35, Math.max(barW, 0), h - 6, 7);
  const grad = ctx.createLinearGradient(bx, 0, bx + Math.max(barW, 1), 0);
  grad.addColorStop(0, p.color);
  grad.addColorStop(1, '#fff');
  ctx.fillStyle = pct > 0.3 ? grad : '#ff4d4d';
  ctx.fill();
  ctx.restore();
}

function drawGaugeBar(p, x, alignRight) {
  const w = 260, h = 10, y = 58;
  ctx.save();
  roundRect(x, y, w, h, 5);
  ctx.fillStyle = '#3a2c22';
  ctx.fill();

  const pct = Math.min(1, p.gauge / p.maxGauge);
  const barW = (w - 4) * pct;
  const bx = alignRight ? x + w - 2 - barW : x + 2;
  const full = pct >= 1;
  if (full) { ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 8; }
  roundRect(bx, y + 2, Math.max(barW, 0), h - 4, 3);
  ctx.fillStyle = full ? '#ffd23f' : '#8a5cff';
  ctx.fill();
  ctx.restore();
}

function drawUI() {
  drawHpBar(P1, 30, false);
  drawHpBar(P2, W - 30 - 260, true);
  drawGaugeBar(P1, 30, false);
  drawGaugeBar(P2, W - 30 - 260, true);

  if (gameState === 'countdown') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 6;
    const txt = countdownVal > 0 ? String(countdownVal) : '파이트!';
    ctx.strokeText(txt, W / 2, H / 2);
    ctx.fillText(txt, W / 2, H / 2);
    ctx.restore();
  }

  if (gameState === 'over') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 46px sans-serif';
    const resultText = winner === 'P1' ? 'YOU WIN 🎉' : 'YOU LOSE 💀';
    ctx.fillText(resultText, W / 2, H / 2 - 20);
    ctx.restore();
  }
  restartBtn.classList.toggle('show', gameState === 'over');
}

window.addEventListener('keydown', e => {
  if (gameState === 'over' && e.code === 'KeyR') {
    startRound();
  }
  if (e.code === 'KeyM') {
    toggleMute();
  }
});

const restartBtn = document.getElementById('restartBtn');
restartBtn.addEventListener('click', () => {
  if (gameState === 'over') startRound();
});

const muteBtn = document.getElementById('muteBtn');
function toggleMute() {
  bgm.muted = !bgm.muted;
  if (muteBtn) muteBtn.textContent = bgm.muted ? '🔇' : '🔊';
}
if (muteBtn) muteBtn.addEventListener('click', toggleMute);

const fullscreenBtn = document.getElementById('fullscreenBtn');
const fsEl = document.getElementById('wrap');

// Real Fullscreen + Orientation Lock APIs work on most Android browsers, but iOS Safari
// supports neither reliably — so whenever we're fullscreen but still portrait-shaped
// (lock failed or unsupported), fall back to a CSS rotate trick that fakes a landscape,
// screen-filling layout. Re-checked on every relevant event instead of a single timed
// guess, since fullscreen/orientation timing varies a lot across browsers.
let landscapeWanted = false;

function reconcileLandscapeState() {
  // Deliberately NOT gated on real Fullscreen API success — this CSS trick is the
  // fallback for exactly the browsers where that API doesn't work, so it must be
  // able to apply on its own regardless of whether requestFullscreen succeeded.
  if (!landscapeWanted) {
    fsEl.classList.remove('forceLandscape');
    return;
  }
  if (window.innerHeight > window.innerWidth) {
    fsEl.classList.add('forceLandscape');
  } else {
    fsEl.classList.remove('forceLandscape');
  }
}

function enterFullscreenLandscape() {
  landscapeWanted = true;
  const req = fsEl.requestFullscreen || fsEl.webkitRequestFullscreen;
  const afterFullscreen = () => {
    if (screen.orientation && screen.orientation.lock) {
      Promise.resolve(screen.orientation.lock('landscape')).catch(() => {}).then(reconcileLandscapeState);
    }
    reconcileLandscapeState();
    setTimeout(reconcileLandscapeState, 100);
    setTimeout(reconcileLandscapeState, 400);
    setTimeout(reconcileLandscapeState, 900);
  };
  if (req) {
    Promise.resolve(req.call(fsEl)).then(afterFullscreen).catch(afterFullscreen);
  } else {
    afterFullscreen();
  }
}

function exitFullscreenLandscape() {
  landscapeWanted = false;
  fsEl.classList.remove('forceLandscape');
  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch (e) {}
  }
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) {
    Promise.resolve(exit.call(document)).catch(() => {});
  }
}

document.addEventListener('fullscreenchange', reconcileLandscapeState);
document.addEventListener('webkitfullscreenchange', reconcileLandscapeState);
window.addEventListener('resize', reconcileLandscapeState);
window.addEventListener('orientationchange', reconcileLandscapeState);

if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', () => {
    const isActive = document.fullscreenElement || document.webkitFullscreenElement || fsEl.classList.contains('forceLandscape');
    if (!isActive) enterFullscreenLandscape(); else exitFullscreenLandscape();
  });
}

function render() {
  ctx.save();
  if (shakeTime > 0) {
    const mag = Math.min(shakeTime / 160, 1) * 6;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawBackground();
  const order = P1.x < P2.x ? [P1, P2] : [P2, P1];
  for (const p of order) drawSprite(p);
  drawParticles();
  ctx.restore();
  drawUI();
}

function loop(now) {
  update(now);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
