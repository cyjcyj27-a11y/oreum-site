// 요괴 축제(가칭) — 도트 미소녀 8명 + 축제 밤 요괴 뱀서라이크
(function () {
'use strict';
const $ = s => document.querySelector(s);
const LANG = /[?&]lang=en/.test(location.search) ? 'en' : 'ko';
const DICT = {
  ko: { start: '시작', levelup: 'LEVEL UP', pause: 'PAUSE', resume: '계속', home: '처음으로', time: 'TIME', level: 'LEVEL', kills: 'KILL', unlock: 'NEW', t1: '요괴', t2: '라이크', dawn: '새벽', over: 'GAME OVER', evo: '진화', max: 'MAX', newW: '새 무기', newP: '새 아이템', locked: '잠김', heal: '회복', hint: 'WASD / ←↑↓→ 이동 · SPACE 불꽃 · Esc 일시정지' },
  en: { start: 'START', levelup: 'LEVEL UP', pause: 'PAUSE', resume: 'RESUME', home: 'HOME', time: 'TIME', level: 'LEVEL', kills: 'KILL', unlock: 'NEW', t1: 'YOKAI', t2: 'LIKE', dawn: 'DAWN', over: 'GAME OVER', evo: 'EVOLVE', max: 'MAX', newW: 'NEW WEAPON', newP: 'NEW ITEM', locked: 'LOCKED', heal: 'HEAL', hint: 'WASD / Arrows move · SPACE firework · Esc pause' },
};
const L = k => DICT[LANG][k];
document.querySelectorAll('[data-l]').forEach(e => { const v = L(e.dataset.l); if (typeof v === 'string') e.textContent = v; });
document.title = LANG === 'en' ? 'Yokai Like' : '요괴라이크';
const GIRLS = [
  { ko: '아야메', en: 'Ayame', w: 'shinai' }, { ko: '히마리', en: 'Himari', w: 'goldfish' }, { ko: '미코토', en: 'Mikoto', w: 'ofuda' }, { ko: '사쿠야', en: 'Sakuya', w: 'tray' },
  { ko: '나츠키', en: 'Natsuki', w: 'ball' }, { ko: '루리카', en: 'Rurika', w: 'parasol' }, { ko: '시오리', en: 'Shiori', w: 'book' }, { ko: '모모', en: 'Momo', w: 'paw' }];
// 무기: type 별 동작은 fireWeapon. dmg 는 1레벨 값, 레벨마다 +25%, 쿨다운 -8%, 개수는 2레벨마다 +1
const WEAPONS = {
  shinai: { ko: '죽도', en: 'Shinai', evo: ['불꽃 죽도', 'Flame Shinai'], icon: 'i_shinai', cd: 1.0, dmg: 24, type: 'slash', r: 95 },
  goldfish: { ko: '금붕어', en: 'Goldfish', evo: ['금붕어 떼', 'Goldfish Swarm'], icon: 'i_goldfish', cd: 1.5, dmg: 11, type: 'bounce', n: 1, speed: 280, life: 3.2, r: 22 },
  ofuda: { ko: '부적', en: 'Ofuda', evo: ['여우불 부적', 'Foxfire Ofuda'], icon: 'i_ofuda', cd: 0.9, dmg: 15, type: 'homing', n: 1, speed: 430, life: 2.5, r: 18 },
  tray: { ko: '쟁반', en: 'Tray', evo: ['뜨거운 쟁반', 'Hot Tray'], icon: 'i_tray', cd: 1.7, dmg: 17, type: 'boomerang', n: 1, speed: 400, life: 1.5, r: 26 },
  ball: { ko: '고무공', en: 'Ball', evo: ['왕 고무공', 'Giant Ball'], icon: 'i_ball', cd: 1.4, dmg: 15, type: 'bounce', n: 1, speed: 330, life: 4, r: 26 },
  parasol: { ko: '양산', en: 'Parasol', evo: ['등롱 양산', 'Lantern Parasol'], icon: 'i_parasol', cd: 4.2, dmg: 12, type: 'orbit', n: 2, life: 2.8, r: 30, orbit: 92 },
  book: { ko: '책', en: 'Book', evo: ['주문서', 'Grimoire'], icon: 'i_book', cd: 1.25, dmg: 9, type: 'fan', n: 3, speed: 470, life: 1.4, r: 18 },
  paw: { ko: '고양이 펀치', en: 'Cat Paw', evo: ['네코마타 펀치', 'Nekomata Paw'], icon: 'i_paw', cd: 0.42, dmg: 9, type: 'punch', r: 80 },
  firework: { ko: '불꽃', en: 'Firework', evo: ['큰 불꽃', 'Grand Firework'], icon: 'i_firework', cd: 2.6, dmg: 34, type: 'strike', n: 1, r: 80 },
  lantern: { ko: '등롱', en: 'Lantern', evo: ['큰 등롱', 'Great Lantern'], icon: 'i_lantern', cd: 0.5, dmg: 5, type: 'aura', r: 95 },
  mask: { ko: '여우 가면', en: 'Fox Mask', evo: ['가면 행렬', 'Mask Parade'], icon: 'i_mask', cd: 1.6, dmg: 9, type: 'slowshot', n: 1, speed: 300, life: 2.2, r: 20 },
  takoyaki: { ko: '타코야키', en: 'Takoyaki', evo: ['왕 타코야키', 'King Takoyaki'], icon: 'i_takoyaki', cd: 1.6, dmg: 22, type: 'lob', n: 1, speed: 260, life: 0.9, r: 64 },
};
const PASSIVES = {
  candyapple: { ko: '사과사탕', en: 'Candy Apple', icon: 'i_candyapple', d: ['공격 +12%', 'DAMAGE +12%'] },
  chocobanana: { ko: '초코바나나', en: 'Choco Banana', icon: 'i_chocobanana', d: ['최대 체력 +25', 'MAX HP +25'] },
  ramune: { ko: '라무네', en: 'Ramune', icon: 'i_ramune', d: ['이동 속도 +8%', 'SPEED +8%'] },
};
const WDESC = { slash: ['앞뒤 베기', 'Slash front and back'], bounce: ['튀어 다님', 'Bounces around'], homing: ['가까운 요괴를 쫓음', 'Homes in'], boomerang: ['던졌다 돌아옴', 'Returns'], orbit: ['주위를 돎', 'Orbits'], fan: ['부채꼴 발사', 'Fan shot'], punch: ['가까운 요괴 연타', 'Rapid punches'], strike: ['하늘에서 떨어짐', 'Falls from the sky'], aura: ['주위 지속 피해', 'Burns around you'], slowshot: ['맞으면 느려짐', 'Slows enemies'], lob: ['터지는 타코야키', 'Explodes'] };
const ENEMIES = {
  kasa: { hp: 22, sp: 68, dmg: 5, r: 20, xp: 1, h: 86, hop: 1 }, hitotsume: { hp: 15, sp: 92, dmg: 4, r: 17, xp: 1, h: 80 }, kappa: { hp: 40, sp: 60, dmg: 7, r: 20, xp: 2, h: 82, heal: 1 },
  hitodama: { hp: 9, sp: 125, dmg: 3, r: 15, xp: 1, h: 54, float: 1 }, kitsune: { hp: 55, sp: 78, dmg: 8, r: 21, xp: 3, h: 88 }, noppera: { hp: 32, sp: 88, dmg: 6, r: 19, xp: 2, h: 76, float: 1 },
  nekomata: { hp: 48, sp: 135, dmg: 7, r: 20, xp: 3, h: 82 }, oni: { hp: 120, sp: 56, dmg: 12, r: 25, xp: 5, h: 76 },
  tanuki: { hp: 1600, sp: 58, dmg: 16, r: 46, xp: 60, h: 160, boss: 1 }, tengu: { hp: 2800, sp: 112, dmg: 18, r: 42, xp: 90, h: 160, boss: 1, dash: 1 }, bigkasa: { hp: 4200, sp: 52, dmg: 20, r: 50, xp: 140, h: 180, boss: 1, summon: 1 },
};
const WAVES = [['kasa', 'hitotsume', 'hitodama'], ['kasa', 'hitotsume', 'hitodama', 'kappa', 'noppera'], ['hitotsume', 'kappa', 'noppera', 'kitsune', 'nekomata'], ['kappa', 'kitsune', 'nekomata', 'oni', 'noppera'], ['kitsune', 'nekomata', 'oni', 'oni', 'kasa']];
const BOSS_AT = [[180, 'tanuki'], [360, 'tengu'], [540, 'bigkasa'], [660, 'tanuki'], [690, 'tengu']];
const NIGHT = 720; // 12분
const PROPS = ['p_sakura1', 'p_sakura2', 'p_sakura3', 'p_sakura4', 'p_takoyaki_stall', 'p_sakura1', 'p_goldfish_stall', 'p_sakura2', 'p_mask_stall', 'p_sakura3', 'p_torii', 'p_sakura4', 'p_yagura', 'p_sakura1', 'p_stonelantern', 'p_sakura2', 'p_lanternpole', 'p_sakura3', 'p_tree', 'p_sakura4', 'p_sakura5', 'p_sakura5'];

// ---------- 그림 ----------
const AT = window.YOKAI_ATLAS, atlas = new Image(), bg = new Image();
let ready = 0; atlas.onload = bg.onload = () => { ready++; if (ready >= 2 && G.phase === 'title') buildTitle(); };
atlas.src = 'img/atlas.webp'; bg.src = 'img/bg.webp';
const BGW = 1376, BGH = 768;
const cell = n => AT.cells[n];
const cv = $('#cv'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1, ZOOM = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ZOOM = Math.max(0.62, Math.min(1, Math.min(W, H * 1.4) / 920)); }
addEventListener('resize', resize); resize();
const TOUCH = 'ontouchstart' in window; if (TOUCH) document.body.classList.add('touch');

// ---------- 저장 ----------
const SAVE = { unlock: 1, best: {} };
try { const s = JSON.parse(localStorage.getItem('yokailike.save') || 'null'); if (s) Object.assign(SAVE, s); } catch (e) {}
function save() { try { localStorage.setItem('yokailike.save', JSON.stringify(SAVE)); } catch (e) {} }

// ---------- 상태 ----------
const G = { phase: 'title', sel: 0, t: 0, time: 0, P: null, E: [], B: [], GEM: [], FX: [], DN: [], AURA: [], kills: 0, spawnT: 0, bossI: 0, cam: { x: 0, y: 0 }, keys: {}, pad: { x: 0, y: 0 }, shake: 0, flash: 0, dawn: 0, lu: null, paused: false, run: 0 };
window.__yk = { G, SAVE };
function rnd(a, b) { return a + Math.random() * (b - a); }
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; }
function dist2(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }
function nearestEnemy(x, y, maxD) { let best = null, bd = (maxD || 1e9) * (maxD || 1e9); for (const e of G.E) { const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } } return best; }
// ---------- 주인공·무기 ----------
function newPlayer(gi) {
  const g = GIRLS[gi];
  return { gi, g, x: 0, y: 0, hp: 100, maxhp: 100, speed: 165, lv: 1, xp: 0, need: 12, inv: 0, face: 1, moving: 0, walkT: 0, dmgMul: 1, spMul: 1, weapons: [{ k: g.w, lv: 1, cd: 0 }], passives: {}, magnet: 80, hurtT: 0, gas: 40, charge: 0, charging: false, held: false, capT: 0 };
}
function wstat(w) { const d = WEAPONS[w.k]; const evo = w.lv >= 6; const L = Math.min(w.lv, 5) - 1; return { dmg: d.dmg * (1 + 0.25 * L) * (evo ? 2 : 1) * G.P.dmgMul, cd: d.cd * Math.pow(0.92, L) * (evo ? 0.85 : 1), n: (d.n || 1) + Math.floor(L / 2) + (evo ? 1 : 0), r: (d.r || 0) * (1 + 0.1 * L) * (evo ? 1.3 : 1), speed: d.speed || 0, life: d.life || 0, evo, d }; }
function proj(o) { o.hits = new Map(); o.age = 0; G.B.push(o); return o; }
function fireWeapon(w) {
  const P = G.P, s = wstat(w), d = s.d, t = d.type; const col = s.evo ? '#ffb347' : '#fff';
  if (t === 'slash') { const dirs = [P.face, -P.face]; for (let i = 0; i < Math.min(s.n, 2); i++) { const dir = dirs[i]; G.AURA.push({ x: P.x + dir * 20, y: P.y - 30, r: s.r, life: 0.22, max: 0.22, kind: 'slash', dir, icon: d.icon, dmg: s.dmg, hits: new Set(), follow: true, ox: dir * 20, evo: s.evo }); } SND.slash(); return; }
  if (t === 'punch') { const e = nearestEnemy(P.x, P.y, s.r + 40); if (!e) { w.cd = 0.12; w.burst = 0; return; } hurtEnemy(e, s.dmg, P.x, 180); G.FX.push({ x: e.x + rnd(-10, 10), y: e.y - 40, icon: 'i_paw', life: 0.18, max: 0.18, sc: s.evo ? 0.5 : 0.36, kind: 'icon' }); if (!w.burst) w.burst = s.n - 1; else w.burst--; if (w.burst > 0) w.cd = -0.09 + 0.0001; return; }
  if (t === 'aura') { let any = false; for (const e of G.E) if (dist2(e, { x: P.x, y: P.y - 20 }) < s.r * s.r) { hurtEnemy(e, s.dmg, P.x, 20, true); any = true; } w.auraR = s.r; w.auraEvo = s.evo; return; }
  if (t === 'strike') { for (let i = 0; i < s.n; i++) { const e = G.E.length ? G.E[Math.floor(Math.random() * G.E.length)] : null; const tx = e ? e.x : P.x + rnd(-200, 200), ty = e ? e.y : P.y + rnd(-200, 200); G.FX.push({ x: tx, y: ty, kind: 'bomb', life: 0.55, max: 0.55, r: s.r, dmg: s.dmg, evo: s.evo, delay: i * 0.15 }); } return; }
  if (t === 'orbit') { for (let i = 0; i < s.n; i++) proj({ kind: 'orbit', k: w.k, icon: d.icon, a: (Math.PI * 2 / s.n) * i, orbit: d.orbit * (s.evo ? 1.3 : 1), dmg: s.dmg, r: s.r, life: s.life, x: P.x, y: P.y, spin: 0, evo: s.evo, multi: 0.3 }); return; }
  const tgt = nearestEnemy(P.x, P.y, 900);
  for (let i = 0; i < s.n; i++) {
    let ang; if (tgt) ang = Math.atan2(tgt.y - (P.y - 30), tgt.x - P.x); else ang = P.face > 0 ? 0 : Math.PI;
    if (t === 'fan') ang += (i - (s.n - 1) / 2) * 0.28; else if (t === 'bounce') ang = tgt ? ang + rnd(-0.5, 0.5) : rnd(0, Math.PI * 2); else ang += (i - (s.n - 1) / 2) * 0.22;
    const sp = s.speed * (s.evo ? 1.15 : 1);
    proj({ kind: t, k: w.k, icon: d.icon, x: P.x, y: P.y - 30, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, dmg: s.dmg, r: s.r, life: s.life + (t === 'lob' ? 0 : 0), ox: P.x, oy: P.y - 30, evo: s.evo, spin: 0, tgt: tgt, multi: t === 'bounce' || t === 'boomerang' ? 0.35 : 0, bounces: 0 });
    if (t === 'lob') { const b = G.B[G.B.length - 1]; b.tx = tgt ? tgt.x : P.x + Math.cos(ang) * 220; b.ty = tgt ? tgt.y : P.y + Math.sin(ang) * 220; b.sx = b.x; b.sy = b.y; b.life = 0.8; }
  }
  SND.shoot();
}
function hurtEnemy(e, dmg, fromX, kb, quiet) {
  e.hp -= dmg; e.flash = 0.12; if (kb && !e.boss) { const dx = e.x - fromX; e.kx = (dx >= 0 ? 1 : -1) * kb; } else if (kb && e.boss) { e.kx = (e.x >= fromX ? 1 : -1) * kb * 0.1; }
  G.DN.push({ x: e.x + rnd(-8, 8), y: e.y - e.h * 0.9, v: Math.round(dmg), life: 0.7, max: 0.7, big: dmg >= 40 });
  if (!quiet) SND.hit();
  if (e.hp <= 0 && !e.dead) killEnemy(e);
}
function killEnemy(e) {
  e.dead = true; G.kills++; $('#hKill').textContent = G.kills;
  for (let i = 0; i < (e.boss ? 14 : 1); i++) G.GEM.push({ x: e.x + rnd(-14, 14), y: e.y + rnd(-10, 10), v: e.boss ? Math.ceil(e.xp / 14) : e.xp, t: rnd(0, 6) });
  if (e.def.heal && Math.random() < 0.08) G.GEM.push({ x: e.x, y: e.y, heal: 30, t: 0 });
  G.FX.push({ x: e.x, y: e.y - e.h * 0.4, kind: 'poof', life: 0.35, max: 0.35, r: e.r * 1.6 });
  if (e.boss) { G.shake = 0.6; SND.boom(); G.FX.push({ x: e.x, y: e.y - 40, kind: 'bomb', life: 0.01, max: 0.01, r: 0, dmg: 0, evo: true, delay: 0, done: true }); }
}
function updateWeapons(dt) {
  const P = G.P; for (const w of P.weapons) { w.cd -= dt; if (w.cd <= 0) { const before = w.cd; fireWeapon(w); if (w.burst > 0 && w.cd < 0) { w.cd = 0.09; } else { w.cd = before + wstat(w).cd; if (w.cd < 0.05) w.cd = 0.05; } } }
}
function updateProjectiles(dt) {
  const P = G.P;
  for (const b of G.B) {
    b.age += dt; b.spin += dt * 9;
    if (b.kind === 'orbit') { b.a += dt * 2.6; b.x = P.x + Math.cos(b.a) * b.orbit; b.y = P.y - 28 + Math.sin(b.a) * b.orbit * 0.6; }
    else if (b.kind === 'homing') { if (!b.tgt || b.tgt.dead) b.tgt = nearestEnemy(b.x, b.y, 700); if (b.tgt) { const ang = Math.atan2(b.tgt.y - 20 - b.y, b.tgt.x - b.x), cur = Math.atan2(b.vy, b.vx); let da = ang - cur; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; const na = cur + Math.max(-4 * dt, Math.min(4 * dt, da)); const sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp; } b.x += b.vx * dt; b.y += b.vy * dt; }
    else if (b.kind === 'boomerang') { const half = b.life / 2; if (b.age > half) { const ang = Math.atan2(P.y - 30 - b.y, P.x - b.x); const sp = Math.hypot(b.vx, b.vy) * 1.1; b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp; if (b.age > half + 0.15) b.hits.clear(); } b.x += b.vx * dt; b.y += b.vy * dt; }
    else if (b.kind === 'rocket') { b.y += b.vy * dt; b.vy *= Math.pow(0.4, dt); if (b.age > b.life) { b.dead = true; explode(b.tx, b.ty, b.rr, b.dd, true); G.FX.push({ x: b.x, y: b.y, kind: 'burst', life: 0.5, max: 0.5, r: b.rr * 0.6, evo: true }); G.shake = Math.max(G.shake, b.perfect ? 0.6 : 0.35); if (b.perfect) toast('PERFECT'); } }
    else if (b.kind === 'lob') { const t = Math.min(1, b.age / b.life); b.x = b.sx + (b.tx - b.sx) * t; b.y = b.sy + (b.ty - b.sy) * t - Math.sin(t * Math.PI) * 120; if (t >= 1 && !b.done) { b.done = true; explode(b.tx, b.ty, b.r, b.dmg, b.evo); } }
    else { b.x += b.vx * dt; b.y += b.vy * dt; if (b.kind === 'bounce') { const vw = W / ZOOM / 2, vh = H / ZOOM / 2; if (b.x < G.cam.x - vw + 20 && b.vx < 0 || b.x > G.cam.x + vw - 20 && b.vx > 0) { b.vx *= -1; b.hits.clear(); b.bounces++; } if (b.y < G.cam.y - vh + 20 && b.vy < 0 || b.y > G.cam.y + vh - 20 && b.vy > 0) { b.vy *= -1; b.hits.clear(); b.bounces++; } } }
    if (b.kind !== 'lob' && b.kind !== 'rocket') for (const e of G.E) { if (b.hits.has(e)) { if ((b.kind === 'orbit' || b.evo) && b.age - b.hits.get(e) > 0.45) b.hits.delete(e); else continue; } const rr = (b.r + e.r); if ((e.x - b.x) ** 2 + (e.y - 20 - b.y) ** 2 < rr * rr) { b.hits.set(e, b.age); hurtEnemy(e, b.dmg, b.x, b.kind === 'homing' ? 60 : 120); if (b.kind === 'slowshot') e.slow = 2.5; if (b.multi) { if (Math.random() > b.multi) { /* 계속 관통 */ } } else if (b.kind !== 'orbit' && b.kind !== 'boomerang' && b.kind !== 'fan' && !b.evo) { b.dead = true; break; } else if (b.kind === 'fan' && !b.evo) { b.pierce = (b.pierce || 0) + 1; if (b.pierce >= 2) { b.dead = true; break; } } } }
    if (b.age > b.life) b.dead = true;
  }
  G.B = G.B.filter(b => !b.dead);
}
function hanabi(pwr, perfect) {
  const P = G.P; const r = (90 + pwr * 170) * (perfect ? 1.5 : 1), dmg = (30 + pwr * 110) * (perfect ? 2 : 1) * P.dmgMul;
  G.B.push({ kind: 'rocket', icon: 'i_firework', x: P.x, y: P.y - 40, vx: 0, vy: -520, life: 0.42, age: 0, hits: new Map(), r: 0, dmg: 0, spin: 0, tx: P.x, ty: P.y - 20, rr: r, dd: dmg, perfect });
  SND.shoot();
}
function explode(x, y, r, dmg, evo) { for (const e of G.E) if ((e.x - x) ** 2 + (e.y - y) ** 2 < r * r) hurtEnemy(e, dmg, x, evo ? 320 : 200, true); G.FX.push({ x, y, kind: 'burst', life: 0.4, max: 0.4, r, evo }); G.shake = Math.max(G.shake, evo ? 0.3 : 0.15); SND.boom(); }
// ---------- 요괴 ----------
function spawnEnemy(key, x, y) {
  const d = ENEMIES[key]; const min = G.time / 60; const mul = 1 + min * 0.13;
  if (x == null) { const vw = W / ZOOM / 2 + 80, vh = H / ZOOM / 2 + 80; const side = Math.floor(Math.random() * 4); x = G.cam.x + (side === 0 ? -vw : side === 1 ? vw : rnd(-vw, vw)); y = G.cam.y + (side === 2 ? -vh : side === 3 ? vh : rnd(-vh, vh)); }
  const e = { key, def: d, x, y, hp: d.hp * mul, maxhp: d.hp * mul, sp: d.sp * (1 + min * 0.015), dmg: d.dmg, r: d.r, xp: d.xp, h: d.h, boss: !!d.boss, flash: 0, kx: 0, slow: 0, hitCd: 0, face: 1, ft: rnd(0, 2), dashT: rnd(2, 4), sumT: 3 };
  G.E.push(e); if (e.boss) { SND.roar(); G.shake = 0.4; toast(LANG === 'en' ? 'BOSS' : '보스'); } return e;
}
function updateEnemies(dt) {
  const P = G.P; const min = G.time / 60;
  // 나오기
  G.spawnT -= dt; if (G.spawnT <= 0 && G.E.length < 230) { const pool = WAVES[Math.min(WAVES.length - 1, Math.floor(min / 2.2))]; const n = 1 + Math.floor(min / 2.5); for (let i = 0; i < n; i++) spawnEnemy(pool[Math.floor(Math.random() * pool.length)]); G.spawnT = Math.max(0.22, 1.0 - min * 0.07); }
  while (G.bossI < BOSS_AT.length && G.time >= BOSS_AT[G.bossI][0]) { spawnEnemy(BOSS_AT[G.bossI][1]); G.bossI++; }
  // 움직임 + 간단한 밀어내기(격자)
  const grid = new Map(); const CS = 48;
  for (const e of G.E) { const k = ((e.x / CS) | 0) + ',' + ((e.y / CS) | 0); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  for (const e of G.E) {
    e.flash -= dt; e.hitCd -= dt; e.ft += dt; if (e.slow > 0) e.slow -= dt;
    let sp = e.sp * (e.slow > 0 ? 0.45 : 1); const dx = P.x - e.x, dy = (P.y - 10) - e.y; const d = Math.hypot(dx, dy) || 1;
    if (e.def.dash) { e.dashT -= dt; if (e.dashT < 0) { e.dashing = 0.5; e.dashT = rnd(3, 5); e.dvx = dx / d * 520; e.dvy = dy / d * 520; } if (e.dashing > 0) { e.dashing -= dt; e.x += e.dvx * dt; e.y += e.dvy * dt; sp = 0; } }
    if (e.def.summon) { e.sumT -= dt; if (e.sumT < 0) { e.sumT = 4; for (let i = 0; i < 3; i++) spawnEnemy('kasa', e.x + rnd(-60, 60), e.y + rnd(-40, 40)); } }
    if (e.def.hop) sp *= (Math.sin(e.ft * 7) > 0 ? 1.6 : 0.3);
    e.x += dx / d * sp * dt; e.y += dy / d * sp * dt; e.face = dx > 0 ? -1 : 1; // 그림이 왼쪽을 보니 오른쪽 갈 땐 뒤집기
    if (e.kx) { e.x += e.kx * dt; e.kx *= Math.pow(0.001, dt); if (Math.abs(e.kx) < 2) e.kx = 0; }
    const gx = (e.x / CS) | 0, gy = (e.y / CS) | 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) { const arr = grid.get((gx + ox) + ',' + (gy + oy)); if (!arr) continue; for (const o of arr) { if (o === e) continue; const ddx = e.x - o.x, ddy = e.y - o.y, dd = ddx * ddx + ddy * ddy, mr = (e.r + o.r) * 0.9; if (dd < mr * mr && dd > 0.01) { const l = Math.sqrt(dd), push = (mr - l) * 0.5 * (o.boss ? 1 : 0.5); e.x += ddx / l * push; e.y += ddy / l * push; } } }
    // 주인공 접촉
    if (e.hitCd <= 0 && P.inv <= 0) { const rr = e.r + 16; if (dx * dx + (dy) * (dy) < rr * rr) { hurtPlayer(e.dmg); e.hitCd = 0.8; } }
  }
  G.E = G.E.filter(e => !e.dead);
}
function hurtPlayer(d) { const P = G.P; P.hp -= d; P.inv = 0.5; P.hurtT = 0.3; G.flash = 0.25; SND.hurt(); if (P.hp <= 0) { P.hp = 0; gameOver(false); } }

// ---------- 주인공 움직임·경험치 ----------
function updatePlayer(dt) {
  const P = G.P; let mx = 0, my = 0; const K = G.keys;
  if (K.ArrowLeft || K.a || K.A) mx -= 1; if (K.ArrowRight || K.d || K.D) mx += 1; if (K.ArrowUp || K.w || K.W) my -= 1; if (K.ArrowDown || K.s || K.S) my += 1;
  if (G.pad.x || G.pad.y) { mx = G.pad.x; my = G.pad.y; }
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  P.moving = l > 0.05; if (P.moving) { P.x += mx * P.speed * P.spMul * dt; P.y += my * P.speed * P.spMul * dt; P.walkT += dt; if (Math.abs(mx) > 0.3) P.face = mx > 0 ? 1 : -1; P.horiz = Math.abs(mx) > Math.abs(my) * 0.8; }
  P.inv -= dt; P.hurtT -= dt;
  // 폭죽: 스페이스(폰은 오른쪽 아래 단추)를 누르고 있으면 모으고, 떼면 터진다. 게이지는 저절로 찬다
  if (!P.charging) {
    P.gas = Math.min(100, P.gas + 9 * dt);
    if (G.sp && !P.held) { P.held = true; if (P.gas >= 15) { P.charging = true; P.charge = 0; P.capT = 0; } }
  } else {
    P.charge = Math.min(P.gas, P.charge + 70 * dt); const capped = P.charge >= P.gas - 0.01; if (capped) P.capT += dt;
    if (Math.random() < 0.5) G.FX.push({ x: P.x + rnd(-14, 14), y: P.y - 40 - rnd(0, 50), kind: 'spark', life: 0.35, max: 0.35, r: 3 });
    if (!G.sp || P.capT > 1.5) { P.charging = false; const pwr = P.charge / 100, perfect = capped && P.gas >= 99 && P.capT < 0.5; P.gas -= P.charge; P.charge = 0; hanabi(pwr, perfect); }
  }
  if (!G.sp) P.held = false;
  // 영혼불 줍기
  for (const g of G.GEM) { g.t += dt; const dx = P.x - g.x, dy = P.y - 20 - g.y, d = Math.hypot(dx, dy); if (d < P.magnet) { const sp = 320 + (P.magnet - d) * 6; g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; } if (d < 22) { g.dead = true; if (g.heal) { P.hp = Math.min(P.maxhp, P.hp + g.heal); toast('+' + g.heal); } else { P.xp += g.v; SND.gem(); } } }
  G.GEM = G.GEM.filter(g => !g.dead); if (G.GEM.length > 400) G.GEM.splice(0, G.GEM.length - 400);
  if (P.xp >= P.need) { P.xp -= P.need; P.lv++; P.hp = Math.min(P.maxhp, P.hp + 15); P.need = Math.round(10 + P.lv * 7 + P.lv * P.lv * 1.3); $('#hLv').textContent = P.lv; openLevelUp(); }
  $('#xpfill').style.width = Math.min(100, P.xp / P.need * 100) + '%';
}
// ---------- 레벨업 카드 ----------
function cardPool() {
  const P = G.P, pool = [];
  for (const w of P.weapons) { if (w.lv < 5) pool.push({ kind: 'w', k: w.k, lv: w.lv + 1 }); else if (w.lv === 5 && Object.values(P.passives).some(v => v >= 3)) pool.push({ kind: 'w', k: w.k, lv: 6, evo: true }); }
  if (P.weapons.length < 5) for (const k of Object.keys(WEAPONS)) if (!P.weapons.some(w => w.k === k) && !GIRLS.some((g, i) => g.w === k && i !== P.gi)) pool.push({ kind: 'w', k, lv: 1 });
  for (const k of Object.keys(PASSIVES)) if ((P.passives[k] || 0) < 5) pool.push({ kind: 'p', k, lv: (P.passives[k] || 0) + 1 });
  if (!pool.length) pool.push({ kind: 'heal' });
  return pool;
}
function openLevelUp() {
  G.phase = 'levelup'; SND.levelup(); SND.duck(true); const pool = cardPool(); const picks = [];
  const evo = pool.find(c => c.evo); if (evo) picks.push(evo);
  while (picks.length < 3 && pool.length) { const i = Math.floor(Math.random() * pool.length); const c = pool.splice(i, 1)[0]; if (!picks.includes(c)) picks.push(c); }
  const box = $('#cards'); box.innerHTML = ''; $('#luLv').textContent = 'LV ' + G.P.lv;
  for (const c of picks) {
    const el = document.createElement('div'); el.className = 'card' + (c.evo ? ' evo' : '');
    const def = c.kind === 'w' ? WEAPONS[c.k] : c.kind === 'p' ? PASSIVES[c.k] : null;
    const ic = document.createElement('canvas'); ic.width = ic.height = 112; drawIcon(ic, def ? def.icon : 'i_takoyaki'); el.appendChild(ic);
    const t = document.createElement('div'); t.className = 't';
    const name = c.kind === 'heal' ? L('heal') : c.evo ? def.evo[LANG === 'en' ? 1 : 0] : def[LANG];
    const desc = c.kind === 'heal' ? (LANG === 'en' ? 'HP +50' : '체력 +50') : c.kind === 'p' ? def.d[LANG === 'en' ? 1 : 0] : c.lv === 1 ? WDESC[def.type][LANG === 'en' ? 1 : 0] : c.evo ? (LANG === 'en' ? 'DAMAGE x2' : '피해 2배') : (LANG === 'en' ? 'DAMAGE +25%' : '피해 +25%');
    const tag = c.kind === 'heal' ? '' : c.evo ? L('evo') : c.lv === 1 ? (c.kind === 'w' ? L('newW') : L('newP')) : 'LV ' + c.lv;
    t.innerHTML = '<div class="n">' + name + '</div><div class="d">' + desc + '</div>'; const lv = document.createElement('div'); lv.className = 'lv'; lv.textContent = tag;
    el.append(t, lv); el.onclick = () => { applyCard(c); $('#levelup').hidden = true; G.phase = 'play'; SND.duck(false); SND.blip(); }; box.appendChild(el);
  }
  $('#levelup').hidden = false;
}
function applyCard(c) {
  const P = G.P;
  if (c.kind === 'heal') { P.hp = Math.min(P.maxhp, P.hp + 50); return; }
  if (c.kind === 'w') { const w = P.weapons.find(x => x.k === c.k); if (w) w.lv = c.lv; else P.weapons.push({ k: c.k, lv: 1, cd: 0 }); return; }
  P.passives[c.k] = c.lv;
  if (c.k === 'candyapple') P.dmgMul = 1 + 0.12 * c.lv; if (c.k === 'chocobanana') { P.maxhp = 100 + 25 * c.lv; P.hp = Math.min(P.maxhp, P.hp + 25); } if (c.k === 'ramune') P.spMul = 1 + 0.08 * c.lv;
}
function drawIcon(c, icon) { const x = c.getContext('2d'); const cl = cell(icon); if (!cl) return; const sc = Math.min((c.width - 12) / cl[2], (c.height - 12) / cl[3]); const w = cl[2] * sc, h = cl[3] * sc; x.imageSmoothingEnabled = true; x.drawImage(atlas, cl[0], cl[1], cl[2], cl[3], (c.width - w) / 2, (c.height - h) / 2, w, h); }
// ---------- 그리기 ----------
function sx(x) { return (x - G.cam.x) * ZOOM + W / 2; }
function sy(y) { return (y - G.cam.y) * ZOOM + H / 2; }
function spr(name, x, y, h, flip, alpha) { const c = cell(name); if (!c) return; const sc = h / c[3], w = c[2] * sc; ctx.save(); if (alpha != null) ctx.globalAlpha = alpha; ctx.translate(x, y); if (flip) ctx.scale(-1, 1); ctx.drawImage(atlas, c[0], c[1], c[2], c[3], -w / 2, -h, w, h); ctx.restore(); }
function sprC(name, x, y, h, rot, alpha) { const c = cell(name); if (!c) return; const sc = h / c[3], w = c[2] * sc; ctx.save(); if (alpha != null) ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot || 0); ctx.drawImage(atlas, c[0], c[1], c[2], c[3], -w / 2, -h / 2, w, h); ctx.restore(); }
function drawGround() {
  const bandY = 0.84 * BGH, bandH = BGH - bandY; const tw = BGW * ZOOM * 0.5, th = bandH * ZOOM * 0.5; // 자갈 띠를 반 크기로 타일
  const x0 = Math.floor((G.cam.x * ZOOM - W / 2) / tw) - 1, x1 = Math.ceil((G.cam.x * ZOOM + W / 2) / tw) + 1, y0 = Math.floor((G.cam.y * ZOOM - H / 2) / th) - 1, y1 = Math.ceil((G.cam.y * ZOOM + H / 2) / th) + 1;
  ctx.fillStyle = '#1c1a22'; ctx.fillRect(0, 0, W, H);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const px = i * tw - G.cam.x * ZOOM + W / 2 + ((j & 1) ? tw / 2 : 0), py = j * th - G.cam.y * ZOOM + H / 2; ctx.drawImage(bg, 0, bandY, BGW, bandH, px, py, tw + 1, th + 1); }
}
const PETAL_COL = ['#f08cb0', '#f6a2c0', '#e97aa3', '#fbb8cf'];
function drawPetal(x, y, k, s) {
  // 도트 꽃잎 5~6칸: 끝이 갈라진 벚꽃잎, 한 칸만 밝게
  const c = PETAL_COL[k & 3]; const u = Math.max(2, Math.round(3 * s)); ctx.fillStyle = c;
  if (k & 4) { ctx.fillRect(x, y, u * 3, u); ctx.fillRect(x + u, y - u, u, u); ctx.fillRect(x + u * 3, y - u, u, u); ctx.fillRect(x, y + u, u, u); }
  else { ctx.fillRect(x, y, u, u * 3); ctx.fillRect(x - u, y + u, u, u); ctx.fillRect(x - u, y + u * 3, u, u); ctx.fillRect(x + u, y, u, u); }
  ctx.fillStyle = '#ffd6e4'; ctx.fillRect(x + (k & 4 ? u : 0), y + (k & 4 ? 0 : u), u, u);
}
function drawPetals() {
  const CS = 80; const vw = W / ZOOM / 2 + 40, vh = H / ZOOM / 2 + 40;
  const gx0 = Math.floor((G.cam.x - vw) / CS), gx1 = Math.floor((G.cam.x + vw) / CS), gy0 = Math.floor((G.cam.y - vh) / CS), gy1 = Math.floor((G.cam.y + vh) / CS);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) {
    const h = hash(gx * 3 + 11, gy * 5 + 7); let n = h < 0.45 ? 0 : h < 0.82 ? 1 : h < 0.95 ? 2 : 7; // 6 = 꽃잎 더미
    const px0 = gx * CS + hash(gx + 1, gy + 2) * CS, py0 = gy * CS + hash(gx + 5, gy + 3) * CS;
    for (let i = 0; i < n; i++) { const pile = n === 7; const sp = pile ? 16 : CS; const px = pile ? px0 + (hash(gx + i * 13, gy) - 0.5) * sp * 2.4 : gx * CS + hash(gx + i * 13, gy + 2) * CS, py = pile ? py0 + (hash(gx, gy + i * 17) - 0.5) * sp : gy * CS + hash(gx + 5, gy + i * 17) * CS; drawPetal(Math.round(sx(px)), Math.round(sy(py)), Math.floor(hash(gx + i, gy + i * 3) * 8), ZOOM); }
  }
  if (!G.fly) { G.fly = []; for (let i = 0; i < 18; i++) G.fly.push({ x: Math.random(), y: Math.random(), vx: -0.025 - Math.random() * 0.03, vy: 0.035 + Math.random() * 0.04, ph: Math.random() * 6, k: Math.floor(Math.random() * 8), s: 0.8 + Math.random() * 0.6 }); }
  for (const f of G.fly) { f.x += f.vx * G.dtLast + Math.sin(G.t * 1.5 + f.ph) * 0.0006; f.y += f.vy * G.dtLast; if (f.y > 1.05) { f.y = -0.05; f.x = Math.random() * 1.2; } if (f.x < -0.05) f.x = 1.05; drawPetal(Math.round(f.x * W), Math.round(f.y * H), f.k, ZOOM * f.s); }
}
function propsNear() {
  const out = []; const CS = 520; const vw = W / ZOOM / 2 + 300, vh = H / ZOOM / 2 + 420;
  const gx0 = Math.floor((G.cam.x - vw) / CS), gx1 = Math.floor((G.cam.x + vw) / CS), gy0 = Math.floor((G.cam.y - vh) / CS), gy1 = Math.floor((G.cam.y + vh) / CS);
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { const h = hash(gx, gy); if (h < 0.12) continue; if (Math.abs(gx) + Math.abs(gy) <= 0) continue; const name = PROPS[Math.floor(hash(gx + 7, gy + 3) * PROPS.length)]; out.push({ prop: name, x: gx * CS + hash(gx + 1, gy) * CS * 0.7 + CS * 0.15, y: gy * CS + hash(gx, gy + 1) * CS * 0.7 + CS * 0.15 }); }
  const SC = 360; const SAK = ['p_sakura1', 'p_sakura2', 'p_sakura3', 'p_sakura4', 'p_sakura5', 'p_sakura2', 'p_sakura4'];
  const sx0 = Math.floor((G.cam.x - vw) / SC), sx1 = Math.floor((G.cam.x + vw) / SC), sy0 = Math.floor((G.cam.y - vh) / SC), sy1 = Math.floor((G.cam.y + vh) / SC);
  for (let gy = sy0; gy <= sy1; gy++) for (let gx = sx0; gx <= sx1; gx++) { const h = hash(gx * 7 + 101, gy * 11 + 59); if (h < 0.55) continue; if (gx === 0 && gy === 0) continue; out.push({ prop: SAK[Math.floor(hash(gx + 3, gy + 9) * SAK.length)], x: gx * SC + hash(gx + 2, gy) * SC * 0.8 + SC * 0.1, y: gy * SC + hash(gx, gy + 4) * SC * 0.8 + SC * 0.1 }); }
  return out;
}
function drawWorld() {
  const P = G.P; drawGround(); drawPetals();
  // 등롱 빛(바닥)
  for (const w of P.weapons) if (w.auraR) { const r = w.auraR * ZOOM; const g = ctx.createRadialGradient(sx(P.x), sy(P.y - 20), r * 0.2, sx(P.x), sy(P.y - 20), r); g.addColorStop(0, w.auraEvo ? 'rgba(255,170,60,.45)' : 'rgba(255,200,90,.32)'); g.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx(P.x), sy(P.y - 20), r, 0, Math.PI * 2); ctx.fill(); }
  // 영혼불
  for (const g of G.GEM) { const x = sx(g.x), y = sy(g.y) + Math.sin(g.t * 5) * 3 * ZOOM; const s = (g.heal ? 10 : 6) * ZOOM; if (g.heal) { spr('i_takoyaki', x, y + s, s * 2.4, false); } else { ctx.fillStyle = '#6fe3ff'; ctx.fillRect(x - s / 2, y - s, s, s * 1.3); ctx.fillStyle = '#d8f7ff'; ctx.fillRect(x - s / 4, y - s * 0.7, s / 2, s * 0.7); } }
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  for (const e of G.E) { ctx.beginPath(); ctx.ellipse(sx(e.x), sy(e.y) + 2, e.r * 1.1 * ZOOM, e.r * 0.35 * ZOOM, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(sx(P.x), sy(P.y) + 2, 20 * ZOOM, 7 * ZOOM, 0, 0, Math.PI * 2); ctx.fill();
  // 깊이 정렬: 소품 + 요괴 + 주인공
  const items = propsNear().map(p => ({ y: p.y, draw: () => { const c = cell(p.prop); spr(p.prop, sx(p.x), sy(p.y), c[3] * 0.75 * ZOOM, false, 0.95); } }));
  for (const e of G.E) items.push({ y: e.y, draw: () => drawEnemy(e) });
  items.push({ y: P.y, draw: drawPlayer });
  items.sort((a, b) => a.y - b.y); for (const it of items) it.draw();
  // 투사체
  for (const b of G.B) { const h = (b.kind === 'orbit' ? 54 : b.kind === 'lob' ? 36 : 40) * ZOOM * (b.evo ? 1.3 : 1); const rot = b.kind === 'rocket' ? -Math.PI / 2 : b.kind === 'orbit' ? b.a + Math.PI / 2 : (b.kind === 'homing' || b.kind === 'fan' || b.kind === 'slowshot') ? Math.atan2(b.vy, b.vx) : b.spin; if (b.evo) { ctx.save(); ctx.shadowColor = '#ff9a3c'; ctx.shadowBlur = 12; sprC(b.icon, sx(b.x), sy(b.y), h, rot); ctx.restore(); } else sprC(b.icon, sx(b.x), sy(b.y), h, rot); }
  // 베기·효과
  for (const a of G.AURA) { const t = a.life / a.max; const x = sx(a.follow ? P.x + a.ox : a.x), y = sy(a.follow ? P.y - 30 : a.y); ctx.save(); ctx.globalAlpha = Math.min(1, t * 1.6); ctx.strokeStyle = a.evo ? '#ffb347' : '#fff'; ctx.lineWidth = 6 * ZOOM; ctx.beginPath(); const r = a.r * ZOOM * (1.1 - t * 0.3); const a0 = a.dir > 0 ? -1.1 : Math.PI - 1.1; ctx.arc(x, y, r, a0, a0 + 2.2); ctx.stroke(); sprC(a.icon, x + a.dir * r * 0.55, y - r * 0.2, 60 * ZOOM, a.dir > 0 ? 0.8 - (1 - t) * 1.6 : -0.8 + (1 - t) * 1.6 + Math.PI); ctx.restore(); }
  for (const f of G.FX) {
    const t = Math.max(0, f.life / f.max);
    if (f.kind === 'icon') sprC(f.icon, sx(f.x), sy(f.y), 70 * f.sc * ZOOM * (1.4 - t * 0.4), 0, t);
    else if (f.kind === 'spark') { ctx.fillStyle = t > 0.5 ? '#fff0a0' : '#ffb347'; const u = 3 * ZOOM; ctx.fillRect(sx(f.x) - u / 2, sy(f.y) - (1 - t) * 30 * ZOOM, u, u); }
    else if (f.kind === 'poof') { ctx.globalAlpha = t; ctx.fillStyle = '#cfd8ff'; const r = f.r * ZOOM * (1.3 - t * 0.6); for (let i = 0; i < 6; i++) { const ang = i * 1.05 + (1 - t) * 2; ctx.fillRect(sx(f.x) + Math.cos(ang) * r - 3, sy(f.y) + Math.sin(ang) * r * 0.6 - 3, 6 * ZOOM, 6 * ZOOM); } ctx.globalAlpha = 1; }
    else if (f.kind === 'bomb') { if (f.delay > 0) continue; const r = f.r * ZOOM; ctx.globalAlpha = 0.5 + 0.5 * (1 - t); ctx.strokeStyle = '#ffdd66'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx(f.x), sy(f.y), r * (1 - t) + 4, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; sprC('i_firework', sx(f.x), sy(f.y) - 500 * t * ZOOM, 50 * ZOOM, (1 - t) * 6); }
    else if (f.kind === 'burst') { const r = f.r * ZOOM * (1.2 - t * 0.5); const cx0 = sx(f.x), cy0 = sy(f.y); ctx.globalAlpha = t * 0.35; ctx.fillStyle = f.evo ? '#ffb347' : '#ffe27a'; ctx.beginPath(); ctx.arc(cx0, cy0, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = Math.min(1, t * 1.5); ctx.strokeStyle = '#fff3c0'; ctx.lineWidth = 3 * ZOOM; ctx.beginPath(); ctx.arc(cx0, cy0, r * (1.4 - t * 0.4), 0, Math.PI * 2); ctx.stroke();
      // 폭죽 살: 16방향으로 점이 줄지어 퍼진다(배경 불꽃과 같은 모양)
      const cols = ['#ffe27a', '#f27a6c', '#7ad1ff', '#b8ff8a', '#fff', '#ffb347']; const u = Math.max(2, 4 * ZOOM); const spread = (1 - t);
      for (let i = 0; i < 16; i++) { const ang = i * Math.PI / 8 + (f.evo ? 0.2 : 0); ctx.fillStyle = cols[i % cols.length]; for (let k = 1; k <= 5; k++) { const d = r * (0.25 + 0.95 * spread) * (k / 5); const g = (1 - spread) * 40 * ZOOM * (k / 5) * (k / 5); ctx.fillRect(cx0 + Math.cos(ang) * d - u / 2, cy0 + Math.sin(ang) * d * 0.9 + g - u / 2, u, u); } }
      ctx.globalAlpha = 1; }
  }
  // 피해 숫자
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const d of G.DN) { const t = d.life / d.max; const fs = (d.big ? 20 : 15) * ZOOM; ctx.font = fs + 'px Galmuri, NeoDGM, monospace'; ctx.globalAlpha = Math.min(1, t * 2); const x = sx(d.x), y = sy(d.y) - (1 - t) * 34 * ZOOM; ctx.fillStyle = '#15131a'; ctx.fillText(d.v, x + 1, y + 1); ctx.fillStyle = d.big ? '#ffd24a' : '#fff'; ctx.fillText(d.v, x, y); }
  ctx.globalAlpha = 1;
  // 머리 위 막대(주인공 체력)
  const bx = sx(P.x), by = sy(P.y) - 126 * ZOOM; const bw = 54 * ZOOM, bh = 7 * ZOOM; ctx.fillStyle = '#15131a'; ctx.fillRect(bx - bw / 2 - 2, by - 2, bw + 4, bh + 4); ctx.fillStyle = '#4a2a30'; ctx.fillRect(bx - bw / 2, by, bw, bh); ctx.fillStyle = P.hp / P.maxhp > 0.35 ? '#5ad66a' : '#e0453a'; ctx.fillRect(bx - bw / 2, by, bw * Math.max(0, P.hp / P.maxhp), bh);
  { const gy = by + bh + 3 * ZOOM, gh = 5 * ZOOM; ctx.fillStyle = '#15131a'; ctx.fillRect(bx - bw / 2 - 2, gy - 2, bw + 4, gh + 4); ctx.fillStyle = '#3a2a10'; ctx.fillRect(bx - bw / 2, gy, bw, gh); ctx.fillStyle = P.gas >= 99 ? '#fff0a0' : '#ffb347'; ctx.fillRect(bx - bw / 2, gy, bw * P.gas / 100, gh); if (P.charging) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(bx - bw / 2, gy, bw * P.charge / 100, gh); const rr = (90 + P.charge / 100 * 170) * ZOOM; ctx.strokeStyle = P.charge >= P.gas - 0.01 && P.gas >= 99 ? '#fff0a0' : 'rgba(255,179,71,.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(sx(P.x), sy(P.y - 20), rr, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); } }
  for (const e of G.E) if (e.boss) { const x = sx(e.x), y = sy(e.y) - (e.h * 1.6 + 14) * ZOOM, w = 90 * ZOOM, h = 8 * ZOOM; ctx.fillStyle = '#15131a'; ctx.fillRect(x - w / 2 - 2, y - 2, w + 4, h + 4); ctx.fillStyle = '#3a1a3a'; ctx.fillRect(x - w / 2, y, w, h); ctx.fillStyle = '#c45cff'; ctx.fillRect(x - w / 2, y, w * Math.max(0, e.hp / e.maxhp), h); }
  // 비네트·피격·새벽
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(5,8,30,0)'); vg.addColorStop(1, 'rgba(5,8,30,.75)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  if (G.flash > 0) { ctx.fillStyle = 'rgba(224,69,58,' + (G.flash * 1.4) + ')'; ctx.fillRect(0, 0, W, H); }
  if (G.dawn > 0) { ctx.fillStyle = 'rgba(255,214,150,' + Math.min(0.85, G.dawn * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }
}
function drawEnemy(e) {
  const x = sx(e.x), y = sy(e.y) + (e.def.float ? Math.sin(e.ft * 4) * 6 * ZOOM : 0); const frame = (Math.floor(e.ft * 6) % 2) ? '_b' : '_a'; const name = e.boss ? 'b_' + e.key : 'y_' + e.key + frame;
  const h = e.h * ZOOM * (e.boss ? 1.6 : 1); if (e.flash > 0) { ctx.save(); ctx.filter = 'brightness(3)'; spr(name, x, y, h, e.face < 0); ctx.restore(); } else spr(name, x, y, h, e.face < 0);
  if (e.slow > 0) { ctx.fillStyle = 'rgba(120,180,255,.35)'; ctx.fillRect(x - 10 * ZOOM, y - h, 20 * ZOOM, h); }
}
function drawPlayer() {
  const P = G.P; const x = sx(P.x), y = sy(P.y); const h = 100 * ZOOM; let pose = 'stand', flip = false;
  if (P.moving) { const f = Math.floor(P.walkT * 7) % 2; if (P.horiz) { pose = f ? 'sideA' : 'sideB'; flip = P.face < 0; } else pose = f ? 'walk' : 'stand'; }
  const name = 'p_g' + (P.gi + 1) + '_' + pose; if (P.inv > 0 && Math.floor(P.inv * 20) % 2) ctx.globalAlpha = 0.45; spr(name, x, y, h, flip); ctx.globalAlpha = 1;
  for (const b of G.B) if (b.kind === 'orbit') { /* 양산은 투사체에서 */ }
}
// ---------- 흐름 ----------
function show(id, on) { $(id).hidden = !on; }
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('show'); clearTimeout(toast.tm); toast.tm = setTimeout(() => e.classList.remove('show'), 1400); }
function fmt(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
function buildTitle() {
  const box = $('#girls'); box.innerHTML = '';
  GIRLS.forEach((g, i) => { const d = document.createElement('div'); const locked = !(SAVE.unlock & (1 << i)); d.className = 'girl' + (i === G.sel ? ' on' : '') + (locked ? ' lock' : ''); const c = document.createElement('canvas'); c.width = 124; c.height = 152; const cl = cell('p_g' + (i + 1) + '_stand'); const x = c.getContext('2d'); const sc = Math.min(110 / cl[2], 140 / cl[3]); x.drawImage(atlas, cl[0], cl[1], cl[2], cl[3], (124 - cl[2] * sc) / 2, 148 - cl[3] * sc, cl[2] * sc, cl[3] * sc); d.appendChild(c); d.onclick = () => { if (locked) { SND.back(); toast(L('locked')); return; } G.sel = i; SND.blip(); buildTitle(); }; box.appendChild(d); });
  const g = GIRLS[G.sel]; const w = WEAPONS[g.w]; const best = SAVE.best[G.sel]; $('#gname').textContent = g[LANG] + ' · ' + w[LANG] + (best ? ' · BEST ' + fmt(best) : '');
}
function toTitle() { G.phase = 'title'; document.body.classList.remove('playing'); show('#title', true); show('#over', false); show('#pause', false); show('#levelup', false); buildTitle(); G.titleT = 0; }
function startGame() {
  G.phase = 'play'; document.body.classList.add('playing'); show('#title', false); show('#over', false); show('#pause', false);
  G.P = newPlayer(G.sel); G.E = []; G.B = []; G.GEM = []; G.FX = []; G.DN = []; G.AURA = []; G.kills = 0; G.time = 0; G.spawnT = 0.6; G.bossI = 0; G.cam = { x: 0, y: 0 }; G.shake = 0; G.flash = 0; G.dawn = 0; G.run++;
  $('#hKill').textContent = 0; $('#hLv').textContent = 1; $('#hTime').textContent = fmt(NIGHT); $('#xpfill').style.width = '0%';
  SND.bgm(true);
}
function gameOver(cleared) {
  if (G.phase === 'over') return; G.phase = 'over'; SND.duck(true);
  const P = G.P; $('#ovTitle').textContent = cleared ? L('dawn') : L('over'); $('#ovTime').textContent = fmt(G.time); $('#ovLv').textContent = P.lv; $('#ovKill').textContent = G.kills;
  const prev = SAVE.best[G.sel] || 0; if (G.time > prev) SAVE.best[G.sel] = Math.floor(G.time);
  let unlockName = '';
  if (cleared) { const nx = G.sel + 1; if (nx < 8 && !(SAVE.unlock & (1 << nx))) { SAVE.unlock |= (1 << nx); unlockName = GIRLS[nx][LANG]; } SND.bell(); setTimeout(() => SND.cheer(), 400); }
  else SND.fail();
  save(); $('#ovUnlockRow').hidden = !unlockName; $('#ovUnlock').textContent = unlockName;
  setTimeout(() => { show('#over', true); }, cleared ? 2200 : 900);
}
$('#bStart').onclick = () => { SND.unlock(); SND.blip(); startGame(); };
$('#bRetry').onclick = () => { SND.blip(); startGame(); };
$('#bHome').onclick = () => { SND.back(); SND.bgm(false); toTitle(); };
$('#bQuit').onclick = () => { SND.back(); SND.bgm(false); G.paused = false; toTitle(); };
$('#bResume').onclick = () => { SND.blip(); G.paused = false; show('#pause', false); G.phase = 'play'; };
function pause() { if (G.phase !== 'play') return; G.phase = 'pause'; show('#pause', true); SND.blip(); }
$('#tPause').onclick = pause;
$('#tBgm').onclick = () => { SND.unlock(); $('#tBgm').classList.toggle('off', !SND.toggleBgm()); };
$('#tSfx').onclick = () => { SND.unlock(); $('#tSfx').classList.toggle('off', !SND.toggleSfx()); };
$('#tBgm').classList.toggle('off', !SND.bgmOn); $('#tSfx').classList.toggle('off', !SND.on);
addEventListener('keydown', e => {
  G.keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); if (e.key === ' ' && G.phase === 'play') G.sp = true;
  if (e.key === 'Enter') { if (G.phase === 'title') $('#bStart').click(); else if (G.phase === 'over' && !$('#over').hidden) $('#bRetry').click(); else if (G.phase === 'pause') $('#bResume').click(); }
  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (G.phase === 'play') pause(); else if (G.phase === 'pause') $('#bResume').click(); }
  if (G.phase === 'title' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { let i = G.sel; for (let k = 0; k < 8; k++) { i = (i + (e.key === 'ArrowRight' ? 1 : 7)) % 8; if (SAVE.unlock & (1 << i)) break; } G.sel = i; buildTitle(); SND.blip(); }
});
addEventListener('keyup', e => { G.keys[e.key] = false; if (e.key === ' ') G.sp = false; });
addEventListener('blur', () => { G.keys = {}; G.pad.x = G.pad.y = 0; G.sp = false; });
const actB = $('#act'); if (actB) { actB.addEventListener('pointerdown', e => { e.preventDefault(); SND.unlock(); G.sp = true; try { actB.setPointerCapture(e.pointerId); } catch (x) {} }); const aEnd = () => { G.sp = false; }; actB.addEventListener('pointerup', aEnd); actB.addEventListener('pointercancel', aEnd); }
// 폰 패드
const pad = $('#pad'), knob = $('#knob'); let padId = null;
function padMove(e) { const r = pad.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = r.width / 2; const l = Math.hypot(dx, dy); if (l > m) { dx = dx / l * m; dy = dy / l * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; const dz = 0.1; G.pad.x = Math.abs(dx / m) > dz ? dx / m : 0; G.pad.y = Math.abs(dy / m) > dz ? dy / m : 0; }
pad.addEventListener('pointerdown', e => { padId = e.pointerId; pad.setPointerCapture(padId); padMove(e); });
pad.addEventListener('pointermove', e => { if (e.pointerId === padId) padMove(e); });
const padEnd = e => { if (e.pointerId === padId) { padId = null; G.pad.x = G.pad.y = 0; knob.style.transform = ''; } };
pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
// 폰: 패드 밖 아무 데나 끌어도 움직이게(떠다니는 패드)
let freeId = null, freeX = 0, freeY = 0;
cv.addEventListener('pointerdown', e => { if (!TOUCH || G.phase !== 'play') return; freeId = e.pointerId; freeX = e.clientX; freeY = e.clientY; cv.setPointerCapture(freeId); });
cv.addEventListener('pointermove', e => { if (e.pointerId !== freeId) return; let dx = e.clientX - freeX, dy = e.clientY - freeY; const m = 60, l = Math.hypot(dx, dy); if (l > m) { dx = dx / l * m; dy = dy / l * m; } G.pad.x = Math.abs(dx / m) > 0.12 ? dx / m : 0; G.pad.y = Math.abs(dy / m) > 0.12 ? dy / m : 0; });
const freeEnd = e => { if (e.pointerId === freeId) { freeId = null; G.pad.x = G.pad.y = 0; } };
cv.addEventListener('pointerup', freeEnd); cv.addEventListener('pointercancel', freeEnd);

// ---------- 타이틀 그림 ----------
function drawTitle(dt) {
  G.titleT = (G.titleT || 0) + dt;
  const s = Math.max(W / BGW, H / BGH); const bw = BGW * s, bh = BGH * s; const ox = (W - bw) / 2, oy = Math.min(0, (H - bh) / 2);
  ctx.fillStyle = '#0b1030'; ctx.fillRect(0, 0, W, H); ctx.drawImage(bg, ox, oy, bw, bh);
  if (oy + bh < H) { const bandY = 0.84 * BGH, bandH = BGH - bandY; let y = oy + bh - 1; while (y < H) { ctx.drawImage(bg, 0, bandY, BGW, bandH, ox, y, bw, bandH * s + 1); y += bandH * s; } }
  // 고른 소녀가 가운데 서 있고 요괴들이 지나간다
  const gy = Math.min(H * 0.58, oy + bh * 0.88); const hgt = Math.min(H * 0.26, 190);
  if (!G.tw) { G.tw = []; const ks = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss); for (let i = 0; i < 7; i++) G.tw.push({ k: ks[i % ks.length], x: W + i * 160 + 80, sp: 40 + i * 6, ft: i }); }
  for (const t of G.tw) { t.x -= t.sp * dt; t.ft += dt; if (t.x < -120) { t.x = Math.max(W + 100, Math.max(...G.tw.map(q => q.x)) + 150 + Math.random() * 80); } spr('y_' + t.k + (Math.floor(t.ft * 6) % 2 ? '_b' : '_a'), t.x, gy + 8, hgt * 0.8, false, 0.9); }
  spr('p_g' + (G.sel + 1) + '_stand', W / 2, gy + Math.sin(G.titleT * 2) * 2, hgt, false);
}

// ---------- 루프 ----------
let lastT = 0;
function frame(now) { requestAnimationFrame(frame); tick(now); }
function tick(now) {
  const dt = Math.max(0, Math.min(0.05, (now - lastT) / 1000 || 0.016)); lastT = now; G.t += dt; G.dtLast = dt;
  if (ready < 2) return;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.imageSmoothingEnabled = true;
  if (G.phase === 'title') { drawTitle(dt); return; }
  if (G.phase === 'play') {
    G.time += dt; $('#hTime').textContent = fmt(NIGHT - G.time);
    updatePlayer(dt); if (G.phase !== 'play') { /* 레벨업 창 */ }
    updateWeapons(dt); updateProjectiles(dt); updateEnemies(dt);
    for (const a of G.AURA) { a.life -= dt; if (a.kind === 'slash') { const P = G.P; const cx = P.x + a.ox, cy = P.y - 30; for (const e of G.E) { if (a.hits.has(e)) continue; const dx = e.x - cx; if ((a.dir > 0 ? dx > -20 : dx < 20) && dx * dx + (e.y - 20 - cy) ** 2 < a.r * a.r) { a.hits.add(e); hurtEnemy(e, a.dmg, cx, 160); } } } }
    G.AURA = G.AURA.filter(a => a.life > 0);
    for (const f of G.FX) { if (f.delay > 0) { f.delay -= dt; continue; } f.life -= dt; if (f.kind === 'bomb' && !f.done && f.life <= 0) { f.done = true; explode(f.x, f.y, f.r, f.dmg, f.evo); } }
    G.FX = G.FX.filter(f => f.life > 0 || f.delay > 0);
    for (const d of G.DN) d.life -= dt; G.DN = G.DN.filter(d => d.life > 0);
    if (G.time >= NIGHT && G.phase === 'play') { G.dawn = 0.01; gameOver(true); }
  }
  if (G.phase === 'over' && G.dawn > 0) G.dawn = Math.min(2, G.dawn + dt * 0.6);
  G.flash = Math.max(0, G.flash - dt); G.shake = Math.max(0, G.shake - dt);
  const P = G.P; const k = 1 - Math.pow(0.002, dt); G.cam.x += (P.x - G.cam.x) * k; G.cam.y += (P.y - 30 - G.cam.y) * k;
  if (G.shake > 0) { G.cam.x += rnd(-1, 1) * G.shake * 12; G.cam.y += rnd(-1, 1) * G.shake * 12; }
  drawWorld();
}
requestAnimationFrame(frame);
toTitle();
// 시험용(로컬만): ?auto=1&girl=N&frames=N → 바로 시작하고 N 프레임 돌림. __yk.tick(n)
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
const qa = new URLSearchParams(location.search);
window.__yk.tick = (n, ms) => { for (let i = 0; i < (n || 1); i++) tick((lastT || performance.now()) + (ms || 16)); };
window.__yk.start = i => { if (i != null) G.sel = i; startGame(); }; window.__yk.lu = openLevelUp; window.__yk.spawn = spawnEnemy; window.__yk.over = gameOver;
if (LOCAL && qa.get('dbg')) window.onerror = (m, src, l, c) => { document.title = 'ERR ' + m + ' @' + l + ':' + c; };
if (LOCAL && qa.get('auto')) { const w = () => { if (ready < 2) return setTimeout(w, 60); SAVE.unlock = 255; G.sel = +(qa.get('girl') || 0); startGame(); if (qa.get('t')) G.time = +qa.get('t'); const fr = +qa.get('frames') || 0; if (qa.get('key')) G.keys[qa.get('key')] = true; for (let i = 0; i < fr; i++) { if (qa.get('sp')) { if (i === 200) G.sp = true; if (i === 262) G.sp = false; } tick((lastT || performance.now()) + 16); } if (qa.get('dbg')) document.title = JSON.stringify({ kills: G.kills, lv: G.P.lv, xp: G.P.xp, need: G.P.need, gems: G.GEM.length, E: G.E.length, B: G.B.length, hp: Math.round(G.P.hp), phase: G.phase, w: G.P.weapons.map(w => w.k + w.lv), x: Math.round(G.P.x) }); }; w(); }
})();