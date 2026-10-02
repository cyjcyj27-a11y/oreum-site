/* 치킨집 3D — 게임 */
(function () {
'use strict';
var EN = /[?&]lang=en\b/.test(location.search);
if (EN) document.documentElement.lang = 'en';
var A = ART, TAU = Math.PI * 2, $ = function (id) { return document.getElementById(id); }, L3 = K3.L, NS = K3.NS, TB = K3.TB;
function L(a) { return a[EN ? 1 : 0]; }
var TX = {
  title: ['개발자치킨집', 'DEV CHICKEN SHOP'],
  // 엔딩 글: 한글은 사장님이 준 글자 그대로(2026-10-02), 영문은 옮긴 것
  end: [
    ['나는 인디게임개발자였다', 'I was an indie game developer.'],
    ['공대를 졸업하고 게임회사를 다녔는데 회사 게임이 슈퍼 초대박을 터뜨렸음에도', 'I graduated from engineering school and joined a game company. Its game became a monster hit,'],
    ['인센티브가 제대로 지급되지않아서 회사를 그만두고', 'but the bonuses were never paid properly, so I quit'],
    ['인디게임개발을 시작했다.', 'and started making indie games.'],
    ['7년동안 공들여서 폴리싱을 거듭하고 발표한 게임', 'Seven years of polishing went into the game I released.'],
    ['찜회수 3만2천개', '32,000 wishlists.'],
    ['그러나 최종판매된건 겨우 300장이었다.', 'But in the end it sold only 300 copies.'],
    ['결국 어머니는 홧병으로 돌아가시고', 'My mother fell ill from the heartache and passed away,'],
    ['나는 엄마가 돌아가시며 남긴 보험금으로 치킨집을 차렸다.', 'and with the insurance money she left behind, I opened a chicken shop.'],
    ['어머니...................................................', 'Mom...................................................']
  ],
  shop: { fire: ['화력', 'Heat'], fryer: ['튀김기', 'Fryer'], chair: ['의자', 'Chairs'], tip: ['팁 통', 'Tip Jar'], knife: ['식칼', 'Cleaver'], heart: ['하트', 'Heart'] }
};
var FONT = "'Hanna','Ria',sans-serif";

/* ---------- 판 구성 ---------- */
var DAYS = [
  { n: 4, max: 1, gap: 6, unlock: [] }, { n: 5, max: 2, gap: 30, unlock: [] }, { n: 6, max: 2, gap: 28, unlock: ['yang'] }, { n: 6, max: 2, gap: 26, unlock: [] },
  { n: 7, max: 3, gap: 26, unlock: [] }, { n: 8, max: 3, gap: 25, unlock: ['soy'] }, { n: 8, max: 3, gap: 24, unlock: [] }, { n: 9, max: 3, gap: 23, unlock: ['pa'] },
  { n: 10, max: 3, gap: 22, unlock: [] }, { n: 10, max: 3, gap: 21, unlock: ['cheese'] }, { n: 11, max: 3, gap: 20, unlock: [] }, { n: 12, max: 3, gap: 19, unlock: [] }
];
var UPS = [
  { id: 'fire', max: 3, price: [100, 300, 700] }, { id: 'fryer', max: 1, price: [350] }, { id: 'chair', max: 3, price: [150, 400, 800] },
  { id: 'tip', max: 3, price: [150, 400, 800] }, { id: 'knife', max: 3, price: [200, 500, 1000] }, { id: 'heart', max: 2, price: [300, 800] }
];
var STRIP = ['yang', 'soy', 'pa', 'cheese', 'mu', 'cola', 'trash'];
function unlocked(day) { var u = { trash: 1, mu: 1, cola: 1 };   /* 치킨무·콜라는 첫날부터 */ for (var i = 0; i <= day; i++) DAYS[i].unlock.forEach(function (id) { u[id] = 1; }); return u; }
var CAP = 60, T0 = 13, S0 = 0.11, BXc = L3.board.x, BZc = L3.board.z + 0.05, CUTY = TB + 0.6, FW = L3.FW, FD = L3.FD, CARRY = 1.3;

/* ---------- 저장 ---------- */
var KEY = 'chicken.save';
function fresh() { return { day: 0, coins: 0, up: { fire: 0, fryer: 0, chair: 0, tip: 0, knife: 0, heart: 0 }, stars: [], done: false, total: 0 }; }
function load() { try { var o = JSON.parse(localStorage.getItem(KEY)); if (o && typeof o.day === 'number' && o.up) return o; } catch (e) {} return null; }
var S = load() || fresh();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- 화면 맞춤: 아래는 3D(gl), 위는 2D 덧그림(cv) ---------- */
var gl = $('gl'), cv = $('cv'), c = cv.getContext('2d');
var W = 720, H = 1280, SS = 1, colW = 360, ox = 0, oy = 0, dpr = 1, cache = {}, U = 0.5, WIDE = false;
function resize() {
  var vw = window.innerWidth, vh = window.innerHeight, O = window.CHICKEN_OPT || {};
  var wide = vw / Math.max(1, vh) > 1.2, cssH;
  if (wide) { colW = Math.max(1, vw); cssH = Math.max(1, vh); H = 900; U = cssH / 900; W = colW / U; ox = oy = 0; }   /* 가로 화면: 창 전체를 쓴다 */
  else {
    colW = Math.max(1, Math.min(vw, Math.floor(vh * 0.5625)));
    H = Math.round(Math.min(1600, Math.max(1280, 720 * vh / colW))); W = 720; U = colW / 720;
    cssH = colW * H / 720;
    ox = Math.round((vw - colW) / 2); oy = Math.max(0, Math.round((vh - cssH) / 2));
  }
  if (wide !== WIDE || !resize.done) { WIDE = wide; resize.done = 1; K3.place(wide); sync(); document.documentElement.classList.toggle('wide', wide); }
  dpr = O.dpr || Math.min(window.devicePixelRatio || 1, 2); SS = U * dpr;
  cv.width = Math.round(colW * dpr); cv.height = Math.round(cssH * dpr);
  [cv, gl].forEach(function (e) { e.style.left = ox + 'px'; e.style.top = oy + 'px'; e.style.width = colW + 'px'; e.style.height = cssH + 'px'; });
  K3.resize(colW, cssH, dpr, W, H);
  var st = document.documentElement.style;
  st.setProperty('--col', colW + 'px'); st.setProperty('--ox', ox + 'px'); st.setProperty('--oy', oy + 'px'); st.setProperty('--u', U + 'px'); st.setProperty('--ch', cssH + 'px');
  st.setProperty('--padl', Math.max(8, 104 - ox) + 'px');
  cache = {};
}
function sprite(key, w, h, fn) {
  var s = cache[key];
  if (!s) { s = A.mk(Math.ceil(w * SS), Math.ceil(h * SS)); var x = s.getContext('2d'); x.scale(SS, SS); fn(x); s._w = w; s._h = h; cache[key] = s; }
  return s;
}
function blit(s, x, y) { c.drawImage(s, x, y, s._w, s._h); }
function iconSpr(id) { return sprite('ic_' + id, 64, 64, function (x) { x.translate(32, 32); A.icon(x, id, 25); }); }
function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - (1 - t) * (1 - t); }
function back(t) { t = Math.max(0, Math.min(1, t)); var s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/* ---------- 판 상태 ---------- */
var G = null, clock = 0, shown = 0;
function nFry() { return 1 + S.up.fryer; }
function fryT() { return T0 * [1, 0.87, 0.75, 0.64][S.up.fire]; }
function newBox() {
  var h = K3.makeBox(); h.g.position.set(-7.5, 0, L3.box.z); h.lid.rotation.x = -2.5;
  return { h: h, nugs: [], sauce: null, top: null, topT: 0, mu: 0, cola: 0, closed: false, lid: 0, pour: null, slide: 0 };
}
function dropBox(B) { if (B && B.h) { K3.scene().remove(B.h.g); B.h = null; } }
function clearScene() {
  if (!G) return;
  (G.board || []).forEach(K3.dropPiece);
  if (G.bowl) G.bowl.nugs.forEach(K3.dropPiece);
  (G.fry || []).forEach(function (f) { f.nugs.forEach(K3.dropPiece); });
  if (G.box) { G.box.nugs.forEach(K3.dropPiece); dropBox(G.box); }
  if (G.carry) G.carry.nugs.forEach(K3.dropPiece);
  (G.fly || []).forEach(function (f) { K3.dropPiece(f.o); });
  (G.serve || []).forEach(function (s) { s.box.nugs.forEach(K3.dropPiece); dropBox(s.box); });
  (G.cust || []).forEach(function (q) { if (q && q.h) K3.personDrop(q.h); });
  if (G.drop) K3.dropPiece(G.drop.pc);
  K3.O.skim.visible = K3.O.ladle.visible = K3.O.stream.visible = K3.O.knife.visible = false;
}
function startDay(i, seed) {
  clearScene(); K3.setDay(i, unlocked(i), nFry()); sync();
  G = { mode: 'play', day: i, t: 0, cust: [null, null, null], left: DAYS[i].n, served: 0, lost: 0, starSum: 0, earned: 0, perfect: 0,
    test: !!seed, hearts: 3 + S.up.heart, maxHearts: 3 + S.up.heart, spawnT: 1.2, nSpawn: 0, un: unlocked(i), R: seed ? A.rng(seed) : Math.random,
    board: [], drop: null, bowl: { nugs: [], ang: 0, k: 0, sq: 0 }, fry: [{ nugs: [], ding: 0 }, { nugs: [], ding: 0 }], box: newBox(), carry: null,
    fly: [], coins: [], texts: [], serve: [], slashes: [], trail: [], gauge: 0, need: 6 - S.up.knife, chop: null, banner: 2, endT: 0,
    shake: 0, shakeBox: 0, shakeCrate: 0, shakeBowl: 0, botStir: 0, hint: i === 0 && !S.total, autoT: 0.6, itemPop: {} };
  shown = S.coins; hud(); ui('play'); SND.music(1);
  if (!seed) { S.started = true; save(); }
}
function active() { var n = 0; for (var i = 0; i < 3; i++) if (G.cust[i]) n++; return n; }
function spawn(slot) {
  var st = DAYS[G.day], R = G.R, un = G.un, pool = PEOPLE.LIST.slice(0, Math.min(12, G.day + 3)), sp = pool[Math.floor(R() * pool.length)];
  if (G.nSpawn === 0 && G.day > 0 && G.day + 2 < 12) sp = PEOPLE.LIST[G.day + 2];
  var fl = ['plain']; if (un.yang) fl.push('yang', 'yang'); if (un.soy) fl.push('soy', 'soy');
  var o = { flavor: fl[Math.floor(R() * fl.length)], top: null, mu: 0, cola: 0 }, tops = []; if (un.pa) tops.push('pa'); if (un.cheese) tops.push('cheese');
  if (tops.length && R() < 0.4) o.top = tops[Math.floor(R() * tops.length)];
  if (!(G.day === 0 && G.nSpawn === 0)) { if (un.mu && R() < 0.55) o.mu = 1; if (un.cola && R() < 0.45) o.cola = 1; }   /* 첫 손님만 닭만 */
  if (G.nSpawn < 2) st.unlock.forEach(function (id) { if (id === 'yang' || id === 'soy') o.flavor = id; else if (id === 'pa' || id === 'cheese') o.top = id; else o[id] = 1; });
  var n = 1 + (o.top ? 1 : 0) + o.mu + o.cola, list = [o.flavor]; if (o.top) list.push(o.top); if (o.mu) list.push('mu'); if (o.cola) list.push('cola');
  var h = K3.person(sp); h.g.position.set(L3.slots[slot], 0.2, L3.custZ - 4);
  G.cust[slot] = { no: G.nSpawn, sp: sp, h: h, seed: R() * 10, slot: slot, state: 'in', t: 0, pat: 1, flavor: o.flavor, top: o.top, mu: o.mu, cola: o.cola, list: list,
    patT: (86 + 7 * n) * (1 - G.day * 0.012) * (1 + 0.15 * S.up.chair), mood: 'happy', res: null, chew: 0, eat: null };
  G.left--; G.nSpawn++; SND.play('bell');
}

/* ---------- 효과 ---------- */
function text(x, y, s, col, size, max) { G.texts.push({ x: x, y: y, s: s, col: col, size: size || 44, t: 0, max: max || 1.2 }); }
function coinTarget() { var r = $('coinP').getBoundingClientRect(); return [(r.left + 16 - ox) / U, (r.top + r.height / 2 - oy) / U]; }
function coinsTo(x, y, total) {
  var n = Math.min(8, Math.max(1, Math.round(total / 12))), each = Math.floor(total / n), rest = total - each * n, tg = coinTarget();
  for (var i = 0; i < n; i++) G.coins.push({ x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 30, x1: tg[0], y1: tg[1], t: -i * 0.06, dur: 0.6, val: each + (i === 0 ? rest : 0) });
}
var CONF = ['#e0281e', '#ffd23a', '#fff6e4', '#58c84a', '#58b8f0'];

/* ---------- 생닭·도마 ---------- */
function bpos(p) { return [BXc + p.cx + p.dx, TB + p.cy, BZc + p.cz + p.dz]; }
function takeChicken() {
  if (G.board.length || G.drop || G.chop) { G.shakeCrate = 0.3; SND.play('nope'); return false; }
  var pc = CK.whole(); pc.dx = pc.dz = pc.tx = pc.tz = 0; K3.pieceMesh(pc); pc.mesh.scale.setScalar(0.34);
  G.drop = { t: 0, pc: pc }; SND.play('pick'); return true;
}
function landChicken() {
  var pc = G.drop.pc; pc.whole = true; pc.land = 0; pc.mesh.scale.setScalar(1); pc.mesh.rotation.set(0, 0, 0);
  G.board = [pc]; G.drop = null; G.shake = 0.12; SND.play('plop');
  K3.burst('drop', BXc, TB + 0.1, BZc, 16, { v: 3.2, up: 2.5, col: '#ffffff', s: 0.05, max: 0.45, sp: 2, floor: TB });
}
function applyCut(pc, r) {
  var i = G.board.indexOf(pc); if (i < 0) return;
  var lx = r.line[0], lz = r.line[1];
  r.parts.forEach(function (q) { var s = ((q.cx - lx) * r.nx + (q.cz - lz) * r.nz) > 0 ? 1 : -1; q.dx = pc.dx; q.dz = pc.dz; q.tx = pc.tx + r.nx * s * 0.075; q.tz = pc.tz + r.nz * s * 0.075; K3.pieceMesh(q); var b = bpos(q); q.mesh.position.set(b[0], b[1], b[2]); });
  K3.dropPiece(pc); G.board.splice.apply(G.board, [i, 1].concat(r.parts));
  var a = [BXc + pc.dx + r.line[0], TB + 0.8, BZc + pc.dz + r.line[1]], b2 = [BXc + pc.dx + r.line[2], TB + 0.8, BZc + pc.dz + r.line[3]];
  G.slashes.push({ a: a, b: b2, t: 0 }); G.shake = Math.max(G.shake, 0.07);
  K3.burst('drop', (a[0] + b2[0]) / 2, TB + 0.5, (a[2] + b2[2]) / 2, 9, { v: 2.2, up: 3, col: '#f6b4aa', s: 0.045, max: 0.4, sp: 0.5, floor: TB });
  SND.play('chop');
}
function pieceAt(wx, wz, loose) {
  var best = null, bd = 1e9;
  for (var i = G.board.length - 1; i >= 0; i--) { var p = G.board[i], lx = wx - BXc - p.dx, lz = wz - BZc - p.dz; if (CK.at(p, lx, lz)) return p; if (loose) { var d = Math.hypot(lx - p.cx, lz - p.cz); if (d < bd && d < p.r + 0.3) { bd = d; best = p; } } }
  return best;
}
var K = { entered: false, ax: 0, az: 0, out: 0, lx: 0, lz: 0, dx: 1, dz: 0 };
function strokeStep(x, z) {
  var ins = !!pieceAt(x, z);
  if (!K.entered) { if (ins) { K.entered = true; K.out = 0; } else { K.ax = x; K.az = z; } }
  else if (ins) K.out = 0;
  else {
    if (K.out === 0) {
      var any = false, list = G.board.slice();
      for (var i = 0; i < list.length; i++) { var p = list[i], r = CK.tryCut(p, K.ax - BXc - p.dx, K.az - BZc - p.dz, x - BXc - p.dx, z - BZc - p.dz); if (r) { applyCut(p, r); any = true; } }
      if (any) { K.entered = false; K.ax = x; K.az = z; return; }
    }
    K.out += 0.04; if (K.out > 0.7) { K.entered = false; K.ax = x; K.az = z; }
  }
}
function strokeTo(x, z) {
  var d = Math.hypot(x - K.lx, z - K.lz), n = Math.max(1, Math.ceil(d / 0.04));
  if (d > 0.02) { K.dx = (x - K.lx) / d; K.dz = (z - K.lz) / d; }
  for (var i = 1; i <= n; i++) strokeStep(K.lx + (x - K.lx) * i / n, K.lz + (z - K.lz) * i / n);
  K.lx = x; K.lz = z;
}
function flying(t) { var n = 0; for (var i = 0; i < G.fly.length; i++) if (G.fly[i].to.t === t) n++; return n; }
function hop(pc, delay) {
  if (G.bowl.nugs.length + flying('bowl') >= CAP) { G.shakeBowl = 0.3; SND.play('nope'); return false; }
  var i = G.board.indexOf(pc); if (i < 0) return false; G.board.splice(i, 1);
  var a = Math.random() * TAU, d = Math.random() * 0.45, b = bpos(pc);
  pc.r2 = pc.r * NS; pc.p = { x: 0, y: 0, z: 0 }; pc.v = { x: 0, y: 0, z: 0 }; pc.w = { x: 0, y: 0, z: 0 };
  G.fly.push({ o: pc, x0: b[0], y0: b[1], z0: b[2], x1: L3.bowl.x + Math.cos(a) * d, y1: K3.BATY + 0.5, z1: L3.bowl.z + Math.sin(a) * d, t: -(delay || 0), dur: 0.34, s0: 1, s1: NS, arc: 1.6, to: { t: 'bowl' }, spin: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8] });
  SND.play('pick'); return true;
}

/* 배치가 바뀌면(세로↔가로) 자리 값을 다시 맞춘다 */
function sync() {
  BXc = L3.board.x; BZc = L3.board.z + 0.05; FW = L3.FW;
  if (G && G.board) G.board.forEach(function (p) { if (p.mesh) { var b = bpos(p); p.mesh.position.set(b[0], b[1], b[2]); } });
  if (typeof CT === 'undefined' || !CT) return;
  CT.bowl.x = L3.bowl.x; CT.bowl.z = L3.bowl.z; CT.box.x = L3.box.x; CT.box.z = L3.box.z;
  for (var i = 0; i < 2; i++) { CT.fry[i].x = L3.fry[i].x; CT.fry[i].z = L3.fry[i].z; CT.fry[i].hw = FW / 2 - 0.05; }
}
/* ---------- 그릇 안 물리: 조각을 공으로 치고 떨어뜨리고 띄우고 서로 민다 ---------- */
var CT = { bowl: { x: L3.bowl.x, z: L3.bowl.z, R: L3.bowl.r * 0.82, liquid: K3.BATY, floor: 0.14 },
  fry: [0, 1].map(function (i) { return { x: L3.fry[i].x, z: L3.fry[i].z, hw: FW / 2 - 0.05, hd: FD / 2 - 0.05, liquid: K3.OILY, floor: 0.02 }; }),
  box: { x: L3.box.x, z: L3.box.z, hw: L3.box.w / 2 - 0.1, hd: L3.box.d / 2 - 0.1, floor: 0.08 }, carry: { x: 0, z: 0, y: CARRY, R: 0.68, floor: 0 } };
function contOf(from) { return from === 'bowl' ? G.bowl : G.fry[from]; }
function ctOf(d) { return d.t === 'bowl' ? CT.bowl : d.t === 'fry' ? CT.fry[d.i] : d.t === 'box' ? CT.box : null; }
function phys(ns, C, dt) {
  var i, j, a, b, oy0 = C.y || 0;
  for (i = 0; i < ns.length; i++) {
    a = ns[i]; var r = a.r2, p = a.p, v = a.v, inL = C.liquid != null && p.y < C.liquid + r * 0.9;
    if (inL) { var ty = C.liquid + r * (C === CT.bowl ? 0.0 : a.done > 0.9 ? -0.05 : -0.3); v.y += ((ty - p.y) * 70 - v.y * 9) * dt; var k = Math.exp(-3.5 * dt); v.x *= k; v.z *= k; }
    else v.y -= 28 * dt;
    p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
    var fl = C.floor + r * 0.55; if (p.y < fl) { p.y = fl; if (v.y < 0) v.y *= -0.15; v.x *= 0.8; v.z *= 0.8; a.w.x *= 0.8; a.w.y *= 0.8; a.w.z *= 0.8; }
    if (C.R) { var q = Math.hypot(p.x, p.z), lim = Math.max(0.05, C.R - r * 1.1); if (q > lim) { p.x *= lim / q; p.z *= lim / q; v.x *= 0.5; v.z *= 0.5; } }
    else { var lx = Math.max(0.05, C.hw - r * 1.2), lz = Math.max(0.05, C.hd - r * 1.2); if (p.x < -lx) { p.x = -lx; v.x = Math.abs(v.x) * 0.3; } if (p.x > lx) { p.x = lx; v.x = -Math.abs(v.x) * 0.3; } if (p.z < -lz) { p.z = -lz; v.z = Math.abs(v.z) * 0.3; } if (p.z > lz) { p.z = lz; v.z = -Math.abs(v.z) * 0.3; } }
    var kw = Math.exp(-(inL ? 1.6 : 3.5) * dt); a.w.x *= kw; a.w.y *= kw; a.w.z *= kw;
    a.mesh.rotation.x += a.w.x * dt; a.mesh.rotation.y += a.w.y * dt; a.mesh.rotation.z += a.w.z * dt;
  }
  for (i = 0; i < ns.length; i++) for (j = i + 1; j < ns.length; j++) {
    a = ns[i]; b = ns[j]; var dx = b.p.x - a.p.x, dy = C.liquid != null ? 0 : b.p.y - a.p.y, dz = b.p.z - a.p.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz), m = (a.r2 + b.r2) * (C.liquid != null ? 0.86 : 0.74);
    if (d < m) { if (d < 1e-4) { dx = 0.01; dy = 0.01; dz = 0; d = 0.014; } var f = (m - d) * 0.5 * Math.min(1, dt * 18); dx /= d; dy /= d; dz /= d; a.p.x -= dx * f; a.p.y -= dy * f * 0.6; a.p.z -= dz * f; b.p.x += dx * f; b.p.y += dy * f * 0.6; b.p.z += dz * f; }
  }
  for (i = 0; i < ns.length; i++) { a = ns[i]; a.mesh.position.set(C.x + a.p.x, oy0 + a.p.y, C.z + a.p.z); }
}

/* ---------- 옮기기(건지개) ---------- */
function startCarry(from, x, z) {
  var ct = contOf(from); if (!ct.nugs.length || G.carry) return false;
  G.carry = { from: from, nugs: ct.nugs, x: x, z: z, tx: x, tz: z, t: 0 }; ct.nugs = [];
  G.carry.nugs.forEach(function (n) { n.p.x *= 0.6; n.p.z *= 0.6; n.p.y = n.r2 * 0.6 + Math.random() * 0.2; n.v.x = n.v.y = n.v.z = 0; });
  SND.play(from === 'bowl' ? 'drip' : 'lift'); return true;
}
function inFry(i, x, z) { return Math.abs(x - L3.fry[i].x) < FW / 2 + 0.12 && Math.abs(z - L3.fry[i].z) < FD / 2 + 0.2; }
function inBox(x, z) { return Math.abs(x - L3.box.x) < L3.box.w / 2 + 0.15 && z > L3.box.z - L3.box.d / 2 - 1.0 && z < L3.box.z + L3.box.d / 2 + 0.18; }
function trashPos() { return [K3.stripX(6), L3.stripZ]; }
function destPos(d) {
  var a = Math.random() * TAU, q;
  if (d.t === 'bowl') { q = Math.random() * 0.5; return [L3.bowl.x + Math.cos(a) * q, K3.BATY + 0.5, L3.bowl.z + Math.sin(a) * q]; }
  if (d.t === 'fry') return [L3.fry[d.i].x + (Math.random() - 0.5) * (FW - 0.7), K3.OILY + 0.55, L3.fry[d.i].z + (Math.random() - 0.5) * (FD - 0.8)];
  if (d.t === 'box') return [L3.box.x + (Math.random() - 0.5) * (L3.box.w - 0.9), 0.9, L3.box.z + (Math.random() - 0.5) * (L3.box.d - 0.7)];
  return [trashPos()[0], 0.4, trashPos()[1]];
}
function sendBatch(nugs, dest) {
  nugs.forEach(function (o, k) { var p = destPos(dest), m = o.mesh.position; G.fly.push({ o: o, x0: m.x, y0: m.y, z0: m.z, x1: p[0], y1: p[1], z1: p[2], t: -k * 0.06, dur: 0.26, s0: NS, s1: dest.t === 'trash' ? NS * 0.4 : NS, arc: 0.7, to: dest, spin: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6] }); });
}
function dropCarry(x, z) {
  var C = G.carry, dest = null, i; if (!C) return; G.carry = null; K3.O.skim.visible = false;
  if (C.from === 'bowl') { for (i = 0; i < nFry(); i++) if (inFry(i, x, z) && G.fry[i].nugs.length + C.nugs.length <= CAP + 2) dest = { t: 'fry', i: i }; }
  else if (inBox(x, z) && !G.box.closed && G.box.slide >= 1 && G.box.nugs.length + C.nugs.length <= CAP + 4) dest = { t: 'box' };
  if (!dest && Math.hypot(x - trashPos()[0], z - trashPos()[1]) < 0.62) dest = { t: 'trash' };
  if (!dest) dest = C.from === 'bowl' ? { t: 'bowl' } : { t: 'fry', i: C.from, back: 1 };
  sendBatch(C.nugs, dest);
}
function moveBatch(from, dest) { var ct = contOf(from); if (!ct.nugs.length) return; var ns = ct.nugs; ct.nugs = []; sendBatch(ns, dest); SND.play(from === 'bowl' ? 'drip' : 'lift'); }
function arrive(f) {
  var o = f.o, d = f.to, C = ctOf(d);
  if (!C) { K3.burst('puff', f.x1, 0.4, f.z1, 3, { v: 0.4, up: 1.2, g: -3, col: '#4a4a4a', s: 0.12, max: 0.5 }); K3.dropPiece(o); SND.play('trash'); return; }
  o.p.x = f.x1 - C.x; o.p.y = f.y1; o.p.z = f.z1 - C.z; o.v.x = (Math.random() - 0.5) * 0.6; o.v.y = -3; o.v.z = (Math.random() - 0.5) * 0.6; o.w.x = (Math.random() - 0.5) * 4; o.w.y = (Math.random() - 0.5) * 4; o.w.z = (Math.random() - 0.5) * 4;
  if (d.t === 'bowl') { G.bowl.nugs.push(o); K3.burst('drop', f.x1, K3.BATY + 0.05, f.z1, 7, { v: 1.6, up: 2.6, col: '#f6ebc6', s: 0.06, max: 0.45, floor: K3.BATY }); SND.play('plup'); }
  else if (d.t === 'fry') { G.fry[d.i].nugs.push(o); K3.burst('drop', f.x1, K3.OILY + 0.05, f.z1, d.back ? 3 : 10, { v: 1.9, up: 3.4, col: '#ffd266', s: 0.05, max: 0.5, floor: K3.OILY }); if (!d.back) { SND.play('splash'); for (var i = 0; i < 6; i++) K3.part('bub', f.x1 + (Math.random() - 0.5) * 0.6, K3.OILY + 0.02, f.z1 + (Math.random() - 0.5) * 0.6, { s: 0.07 + Math.random() * 0.08, max: 0.4 + Math.random() * 0.3, col: '#ffe9a8' }); } }
  else { G.box.nugs.push(o); SND.play('box'); }
}

/* ---------- 상자·양념·포장 ---------- */
function tapItem(id) {
  var B = G.box;
  if (!G.un[id]) return;
  if (id === 'trash') { if (!B.nugs.length && !B.mu && !B.cola) { SND.play('nope'); return; } K3.burst('conf', L3.box.x, 0.6, L3.box.z, 12, { v: 2.4, up: 3, col: '#c99a5b', s: 0.1, max: 0.5 }); B.nugs.forEach(K3.dropPiece); dropBox(B); G.box = newBox(); SND.play('trash'); return; }
  G.itemPop[id] = 0.2;
  if (B.closed || B.slide < 1 || B.pour) { G.shakeBox = 0.3; SND.play('nope'); return; }
  if (!B.nugs.length) { G.shakeBox = 0.3; SND.play('nope'); return; }   /* 치킨을 담은 뒤에만 양념·고명·치킨무·콜라 */
  if (id === 'mu' || id === 'cola') { if (B[id]) { G.shakeBox = 0.3; SND.play('nope'); return; } B[id] = 0.001; B.h[id].visible = true; SND.play('pack'); return; }
  if (id === 'yang' || id === 'soy') { if (B.sauce) { G.shakeBox = 0.3; SND.play('nope'); return; } B.sauce = id; B.pour = { id: id, t: 0 }; K3.O.ladleS.color.set(id === 'yang' ? 0xc8220e : 0x6a3410); SND.play('sauce'); return; }
  if (B.top) { G.shakeBox = 0.3; SND.play('nope'); return; }
  B.top = id; B.topT = 0; SND.play('sprinkle');
  var pts = [], n = id === 'pa' ? 46 : 110;
  for (var i = 0; i < n; i++) { var q = B.nugs[i % B.nugs.length]; pts.push([q.p.x + (Math.random() - 0.5) * q.r2 * 1.7, q.p.y + q.r2 * (0.55 + Math.random() * 0.3), q.p.z + (Math.random() - 0.5) * q.r2 * 1.7]); }
  K3.bits(B.h, id, pts);
}
function tapBox() { var B = G.box; if (!B.nugs.length || B.pour || B.slide < 1) { G.shakeBox = 0.3; SND.play('nope'); return; } B.closed = !B.closed; SND.play('lid'); }
function qd(d) { return d < 0.8 ? 0 : d < 1 ? 0.55 : d <= 1.45 ? 1 : d <= 1.75 ? 0.6 : 0; }
function judge(cu, B) {
  var mass = 0, cook = 0, coat = 0;
  B.nugs.forEach(function (n) { mass += n.size; cook += n.size * qd(n.done); coat += n.size * n.coat; });
  cook /= mass; coat /= mass;
  var sc = Math.min(1, mass / 0.8) * (0.6 * cook + 0.25 * coat + 0.15), ok = (B.sauce || 'plain') === cu.flavor;
  if (!ok) sc *= 0.45;
  var miss = (B.top !== cu.top ? 1 : 0) + (!!B.mu !== !!cu.mu ? 1 : 0) + (!!B.cola !== !!cu.cola ? 1 : 0); sc -= 0.13 * miss;
  var stars = sc >= 0.9 ? 5 : sc >= 0.76 ? 4 : sc >= 0.56 ? 3 : sc >= 0.33 ? 2 : 1;
  var price = Math.round((30 + (cu.flavor !== 'plain' ? 6 : 0) + (cu.top ? 5 : 0) + (cu.mu ? 3 : 0) + (cu.cola ? 4 : 0)) * (1 + G.day * 0.06));
  var pay = Math.round(price * [0, 0.15, 0.4, 0.7, 0.9, 1][stars]), tip = stars >= 4 ? Math.round(price * 0.4 * cu.pat * (1 + 0.3 * S.up.tip)) : 0;
  return { stars: stars, pay: pay, tip: tip, sc: sc, cook: cook, coat: coat, mass: mass };
}
function serve(cu) {
  var B = G.box; if (!B.nugs.length || cu.state !== 'wait' || B.pour || B.slide < 1) return false;
  cu.res = judge(cu, B); cu.state = 'take'; cu.t = 0; cu.eat = B.sauce || 'plain';
  if (!B.closed) { B.closed = true; SND.play('lid'); }
  G.serve.push({ box: B, cu: cu, t: 0 }); G.box = newBox(); SND.play('whoosh'); return true;
}

/* ---------- 식칼 한 방(게이지가 차면) ---------- */
function tapCleaver() {
  if (G.gauge < G.need || G.chop) { SND.play('nope'); return false; }
  if (!G.board.length && !G.drop) takeChicken();
  else if (!(G.board.length === 1 && G.board[0].whole) && !G.drop) { SND.play('nope'); return false; }
  G.gauge = 0; G.chop = { t: G.drop ? -0.4 : 0, n: 0, flash: 0 }; SND.play('ready'); return true;
}
function chopStep(dt) {
  var ch = G.chop; ch.t += dt;
  var at = [0.22, 0.44, 0.66];
  while (ch.n < 3 && ch.t >= at[ch.n]) {
    G.board.slice().forEach(function (pc) { var r = CK.halve(pc, 0); if (r) applyCut(pc, r); });
    ch.n++; G.shake = 0.2; SND.play('slam'); ch.flash = 0.12;
  }
  if (ch.n === 3 && ch.t > 0.95 && !ch.sent) { ch.sent = 1; G.board.slice().forEach(function (pc, i) { hop(pc, i * 0.05); }); }
  if (ch.flash > 0) ch.flash -= dt;
  if (ch.t > 1.5) G.chop = null;
}

/* ---------- 다음에 할 일(첫날 길잡이, 시험용 자동 플레이) ---------- */
function avgDone(fr) { var m = 0, d = 0; fr.nugs.forEach(function (n) { m += n.size; d += n.size * n.done; }); return m ? d / m : 0; }
function compat(cu, B) { return (!B.sauce || B.sauce === cu.flavor) && (!B.top || B.top === cu.top) && (!B.mu || cu.mu) && (!B.cola || cu.cola); }
function needOf(cu, B) { if (cu.flavor !== 'plain' && !B.sauce) return cu.flavor; if (cu.top && !B.top) return cu.top; if (cu.mu && !B.mu) return 'mu'; if (cu.cola && !B.cola) return 'cola'; return null; }
function nextAction(bot) {
  if (!G || G.mode !== 'play' || G.chop || G.carry) return null;
  var B = G.box, i, cu = null, present = 0, q;
  for (i = 0; i < 3; i++) { q = G.cust[i]; if (q && (q.state === 'wait' || q.state === 'in')) { present++; if (q.state === 'wait') { if (!cu) cu = q; else { var a = compat(q, B), b = compat(cu, B); if ((a && !b) || (a === b && q.pat * q.patT < cu.pat * cu.patT)) cu = q; } } } }
  if (B.nugs.length && B.slide >= 1 && !B.pour && !flying('box') && cu) {
    if (compat(cu, B)) { var nd = needOf(cu, B); if (nd && !B.closed) return { t: 'item', id: nd }; return { t: 'cust', i: cu.slot }; }
    if (bot) return { t: 'cust', i: cu.slot };
  }
  for (i = 0; i < nFry(); i++) { var fr = G.fry[i]; if (fr.nugs.length) { var av = avgDone(fr); if (av >= 2.0) return { t: 'dump', i: i }; if (av >= (bot ? 1.1 : 1.0) && !B.nugs.length && !B.closed && B.slide >= 1 && !flying('box')) return { t: 'lift', i: i }; } }
  if (bot && G.gauge >= G.need && !G.drop && (!G.board.length || (G.board.length === 1 && G.board[0].whole)) && !G.bowl.nugs.length && present) return { t: 'cleaver' };
  var mc = 1; G.bowl.nugs.forEach(function (n) { mc = Math.min(mc, n.coat); });
  if (G.board.length) {
    var big = null; G.board.forEach(function (p) { if (!big || p.size > big.size) big = p; });
    if (big.land != null && big.land < 1) return null;
    if (big.size > 0.16) return { t: 'cut', pc: big };
    if (!G.bowl.nugs.length || mc < 0.5) return { t: 'hop', pc: G.board[0] };
    return null;
  }
  if (G.bowl.nugs.length && !flying('bowl')) {
    if (mc < 0.97) return { t: 'stir' };
    for (i = 0; i < nFry(); i++) if (!G.fry[i].nugs.length && !flying('fry')) return { t: 'fry', i: i };
    return null;
  }
  var busy = (G.drop ? 1 : 0) + (flying('bowl') ? 1 : 0) + (flying('fry') ? 1 : 0) + (B.nugs.length || flying('box') ? 1 : 0);
  for (i = 0; i < nFry(); i++) if (G.fry[i].nugs.length) busy++;
  if (!G.drop && busy < present) return { t: 'crate' };
  return null;
}
function doAction(a, noise) {
  if (!a) return;
  if (a.t === 'crate') takeChicken();
  else if (a.t === 'cut') { var r = CK.halve(a.pc, noise || 0); if (r) applyCut(a.pc, r); else hop(a.pc); }
  else if (a.t === 'hop') hop(a.pc);
  else if (a.t === 'stir') G.botStir = a.dur || 0.8;
  else if (a.t === 'fry') moveBatch('bowl', { t: 'fry', i: a.i });
  else if (a.t === 'lift') moveBatch(a.i, { t: 'box' });
  else if (a.t === 'dump') moveBatch(a.i, { t: 'trash' });
  else if (a.t === 'item') tapItem(a.id);
  else if (a.t === 'cust') serve(G.cust[a.i]);
  else if (a.t === 'cleaver') tapCleaver();
}
function react(cu) {
  var r = cu.res, s = r.stars, sx = L3.slots[cu.slot], hp = K3.toScreen(sx, 3.3, L3.custZ), cp = K3.toScreen(sx, 0.6, L3.counterZ + 0.3);
  cu.state = 'react'; cu.t = 0; if (s < 3) { cu.eat = null; K3.personEat(cu.h, null); }
  cu.mood = s >= 4 ? 'yum' : s === 3 ? 'happy' : s === 2 ? 'meh' : 'yuck';
  G.served++; G.starSum += s; if (s === 5) G.perfect++;
  coinsTo(cp[0], cp[1] - 60, r.pay + r.tip);
  text(cp[0], cp[1], '+' + (r.pay + r.tip), '#ffd034', 42, 1.1);
  if (s === 5) { text(hp[0], hp[1] - 40, 'PERFECT', '#ffe04a', 46, 1.3); K3.burst('conf', sx, 3.2, L3.custZ + 0.6, 22, { v: 2.6, up: 6, cols: CONF, s: 0.11, max: 1.1, g: 14 }); }
  else if (s === 4) { text(hp[0], hp[1] - 40, 'GREAT', '#8af06a', 44, 1.2); K3.burst('conf', sx, 3.2, L3.custZ + 0.6, 10, { v: 2.2, up: 5, cols: CONF, s: 0.1, max: 0.9, g: 14 }); }
  else if (s === 3) text(hp[0], hp[1] - 40, 'NICE', '#7fe0f0', 42, 1.1);
  SND.play(s === 5 ? 'perfect' : s === 4 ? 'great' : s === 3 ? 'nice' : s === 2 ? 'meh' : 'yuck');
  var g0 = G.gauge; G.gauge = Math.min(G.need, G.gauge + (s === 5 ? 2 : s === 4 ? 1 : 0));
  if (g0 < G.need && G.gauge >= G.need) SND.play('ready');
  G.hint = false;
}

/* ---------- 진행 ---------- */
var PT = { down: false, mode: null, x: 0, y: 0, x0: 0, y0: 0, t0: 0, sp: 0, moved: 0, wx: 0, wz: 0 };
function custPose(cu, dt) {
  var g = cu.h.g, x = L3.slots[cu.slot], z = L3.custZ, y = 0.2, ry = 0, blink = ((clock + cu.seed * 3) % 3.6) < 0.12 ? 1 : 0;
  if (cu.state === 'in') { var u = ease(cu.t / 0.6); z = L3.custZ - 4 * (1 - u); y += Math.abs(Math.sin(cu.t * 13)) * 0.18 * (1 - u); }
  else if (cu.state === 'out' || cu.state === 'gone') { var v = ease(cu.t / 0.6); z = L3.custZ - 4.5 * v; ry = Math.PI * Math.min(1, cu.t / 0.25); y += Math.abs(Math.sin(cu.t * 13)) * 0.15; }
  else y += Math.sin(clock * 2.2 + cu.seed) * 0.04;
  if (cu.mood === 'angry') x += Math.sin(clock * 30) * 0.03;
  g.position.set(x, y, z); g.rotation.y = ry;
  var eating = (cu.state === 'eat' || cu.state === 'react') && cu.eat, cq = eating ? Math.floor(cu.chew * 14) % 10 : 0;
  K3.personFace(cu.h, cu.mood, blink, cq);
  if (eating) { var lift = Math.abs(Math.sin(cu.chew * 4.5)); cu.h.hand.position.set(0.75 - lift * 0.45, 0.55 + lift * 0.55, 0.95 + lift * 0.1); cu.h.hand.rotation.set(-0.5 - lift * 0.5, 0, 0.5 - lift * 0.3); cu.h.head.rotation.z = Math.sin(cu.chew * 9) * 0.05; }
}
function step(dt) {
  clock += dt;
  if (!G) return;
  G.t += dt;
  var i, p, st;
  for (i = G.texts.length - 1; i >= 0; i--) { p = G.texts[i]; p.t += dt; if (p.t >= p.max) G.texts.splice(i, 1); }
  for (i = G.coins.length - 1; i >= 0; i--) {
    p = G.coins[i]; p.t += dt; if (p.t < 0) continue; if (p.sx == null) { p.sx = p.x; p.sy = p.y; }
    var u = p.t / p.dur;
    if (u >= 1) { S.coins += p.val; G.earned += p.val; G.coins.splice(i, 1); SND.play('coin'); hud(1); if (!G.coins.length && !G.test) save(); }
    else { p.x = p.sx + (p.x1 - p.sx) * u * u; p.y = p.sy + (p.y1 - p.sy) * u * u - Math.sin(u * Math.PI) * 70; }
  }
  K3.partsStep(dt); K3.O.oilT.offset.set(Math.sin(clock * 0.31) * 0.06, clock * 0.035);
  if (G.mode === 'end') { SND.fry(0); return; }   /* 엔딩은 색종이 없이 조용히(사장님 10/2) */
  if (G.mode !== 'play') { SND.fry(0); return; }
  st = DAYS[G.day];
  if (G.banner > 0) G.banner -= dt;
  ['shake', 'shakeBox', 'shakeCrate', 'shakeBowl'].forEach(function (k) { if (G[k] > 0) G[k] = Math.max(0, G[k] - dt); });
  for (var id in G.itemPop) if (G.itemPop[id] > 0) G.itemPop[id] -= dt;
  if (G.autoT > 0) { G.autoT -= dt; if (G.autoT <= 0 && !G.board.length && !G.drop) takeChicken(); }
  K3.O.crate.position.x = L3.crate.x + (G.shakeCrate > 0 ? Math.sin(G.shakeCrate * 50) * 0.06 : 0);
  if (G.drop) {
    G.drop.t += dt; var du = Math.min(1, G.drop.t / 0.36), dm = G.drop.pc.mesh;
    dm.position.set(L3.crate.x + (BXc + G.drop.pc.cx - L3.crate.x) * du, 0.9 + (TB + G.drop.pc.cy - 0.9) * du + Math.sin(du * Math.PI) * 2.2, L3.crate.z + (BZc + G.drop.pc.cz - L3.crate.z) * du);
    dm.scale.setScalar(0.34 + 0.66 * du); dm.rotation.set((1 - du) * 2, (1 - du) * 1.5, 0);
    if (du >= 1) landChicken();
  }
  for (i = 0; i < G.board.length; i++) { p = G.board[i]; var e = Math.min(1, dt * 16); p.dx += (p.tx - p.dx) * e; p.dz += (p.tz - p.dz) * e; var b = bpos(p), sq = 1; if (p.land != null && p.land < 1) { p.land = Math.min(1, p.land + dt * 4.5); sq = 1 - Math.sin(p.land * Math.PI) * 0.12 * (1 - p.land); } p.mesh.position.set(b[0], TB + p.cy * sq, b[2]); p.mesh.scale.set(2 - sq, sq, 2 - sq); }
  if (G.chop) chopStep(dt);
  for (i = G.slashes.length - 1; i >= 0; i--) { G.slashes[i].t += dt; if (G.slashes[i].t > 0.28) G.slashes.splice(i, 1); }
  while (G.trail.length && clock - G.trail[0].t > 0.2) G.trail.shift();
  for (i = G.fly.length - 1; i >= 0; i--) {
    p = G.fly[i]; p.t += dt; if (p.t < 0) continue;
    var fu = Math.min(1, p.t / p.dur), fe = ease(fu), m = p.o.mesh;
    m.position.set(p.x0 + (p.x1 - p.x0) * fe, p.y0 + (p.y1 - p.y0) * fe + Math.sin(fu * Math.PI) * p.arc, p.z0 + (p.z1 - p.z0) * fe); m.scale.setScalar(p.s0 + (p.s1 - p.s0) * fe);
    m.rotation.x += p.spin[0] * dt; m.rotation.y += p.spin[1] * dt; m.rotation.z += p.spin[2] * dt;
    if (fu >= 1) { G.fly.splice(i, 1); arrive(p); }
  }
  var C = G.carry;
  if (C) {
    var ce = Math.min(1, dt * 18); C.x += (C.tx - C.x) * ce; C.z += (C.tz - C.z) * ce; C.t += dt; CT.carry.x = C.x; CT.carry.z = C.z; phys(C.nugs, CT.carry, dt);
    K3.O.skim.visible = true; K3.O.skim.position.set(C.x, CARRY - 0.03, C.z);
    if (Math.random() < dt * 16) K3.part('drop', C.x + (Math.random() - 0.5) * 1.1, CARRY - 0.05, C.z + (Math.random() - 0.5) * 1.1, { vy: -1, s: 0.045, max: 0.5, col: C.from === 'bowl' ? '#f6ebc6' : '#f0b030', floor: 0.02 });
  }
  /* 반죽 볼 */
  var Bw = G.bowl, tg = G.botStir > 0 ? 0.85 : PT.down && PT.mode === 'stir' ? clamp(PT.sp / 5, 0, 1) : 0;
  if (G.botStir > 0) G.botStir -= dt; PT.sp *= Math.exp(-6 * dt);
  Bw.k += (tg - Bw.k) * Math.min(1, dt * 8); Bw.ang += Bw.k * dt * 4.5; K3.O.batterT.rotation = -Bw.ang;
  if (Bw.k > 0.06 && Bw.nugs.length) {
    Bw.nugs.forEach(function (n) { if (n.coat < 1) n.coat = Math.min(1, n.coat + Bw.k * 0.66 * dt); n.v.x += n.p.z * Bw.k * dt * 16; n.v.z += -n.p.x * Bw.k * dt * 16; n.w.y += Bw.k * dt * 6; n.w.x += (Math.random() - 0.5) * Bw.k * dt * 30; });
    Bw.sq -= dt * (0.5 + Bw.k); if (Bw.sq <= 0) { Bw.sq = 0.2; SND.play('stir'); var sa = Math.random() * TAU; K3.part('drop', L3.bowl.x + Math.cos(sa) * 0.6, K3.BATY + 0.05, L3.bowl.z + Math.sin(sa) * 0.6, { vx: Math.cos(sa) * 1.2, vz: Math.sin(sa) * 1.2, vy: 2.4, s: 0.06, max: 0.4, col: '#f6ebc6', floor: K3.BATY }); }
  }
  CT.bowl.x = L3.bowl.x + (G.shakeBowl > 0 ? Math.sin(G.shakeBowl * 50) * 0.05 : 0);
  phys(Bw.nugs, CT.bowl, dt); Bw.nugs.forEach(K3.restyle);
  /* 튀김기 */
  var frying = 0, ft = fryT();
  for (i = 0; i < nFry(); i++) {
    var fr = G.fry[i];
    if (Math.random() < dt * 9 * FW / 1.6) K3.part('bub', L3.fry[i].x + (Math.random() - 0.5) * (FW - 0.2), K3.OILY + 0.012, L3.fry[i].z + (Math.random() - 0.5) * (FD - 0.2), { s: 0.025 + Math.random() * 0.03, max: 0.3 + Math.random() * 0.3, col: '#ffe9a8' });
    if (!fr.nugs.length) { fr.ding = 0; fr.burn = 0; continue; }
    fr.nugs.forEach(function (n) {
      n.done += dt / (ft * Math.pow(Math.max(n.size, 0.02) / S0, 0.6)); frying++;
      if (Math.random() < dt * (n.done < 1 ? 12 : n.done < 1.75 ? 5 : 2)) { var ba = Math.random() * TAU; K3.part('bub', CT.fry[i].x + n.p.x + Math.cos(ba) * n.r2 * 1.0, K3.OILY + 0.015, CT.fry[i].z + n.p.z + Math.sin(ba) * n.r2 * 1.0, { s: 0.04 + Math.random() * 0.07, max: 0.3 + Math.random() * 0.3, col: '#ffe9a8' }); }
      if (Math.random() < dt * 2) { n.v.x += (Math.random() - 0.5) * 0.4; n.v.z += (Math.random() - 0.5) * 0.4; n.w.y += (Math.random() - 0.5) * 1.2; n.w.x += (Math.random() - 0.5) * 0.8; }
      if (n.done > 1.75 && Math.random() < dt * 3) K3.part('puff', CT.fry[i].x + n.p.x, K3.OILY + 0.2, CT.fry[i].z + n.p.z, { vy: 1.2, g: -1.5, s: 0.12, max: 0.9, col: '#2a2420' });
    });
    var av = avgDone(fr);
    if (!fr.ding && av >= 1) { fr.ding = 1; SND.play('ding'); var dp = K3.toScreen(L3.fry[i].x, 0.4, L3.fry[i].z + FD / 2 + 0.24); text(dp[0], dp[1] - 30, '!', '#ffd034', 54, 0.7); }
    if (!fr.burn && av >= 1.75) { fr.burn = 1; SND.play('burn'); }
    phys(fr.nugs, CT.fry[i], dt); fr.nugs.forEach(K3.restyle);
  }
  SND.fry(Math.min(1, frying / 8));
  /* 상자 */
  var B = G.box;
  if (B.slide < 1) B.slide = Math.min(1, B.slide + dt * 4);
  B.lid += ((B.closed ? 1 : 0) - B.lid) * Math.min(1, dt * 14);
  CT.box.x = L3.box.x + (L3.wide ? 1 : -1) * (1 - ease(B.slide)) * 5.3 + (G.shakeBox > 0 ? Math.sin(G.shakeBox * 50) * 0.06 : 0);
  B.h.g.position.set(CT.box.x, 0, L3.box.z); B.h.lid.rotation.x = -2.5 * (1 - B.lid);
  if (B.pour) {
    B.pour.t += dt; var pt = B.pour.t, pu = clamp(pt / 0.9, 0, 1), lx = CT.box.x - 0.7 + 1.4 * pu, Lm = K3.O.ladle, Sm = K3.O.stream;
    B.nugs.forEach(function (n, k) { n.sauce = B.pour.id; n.sa = clamp((pt - 0.2 - k * 0.03) / 0.5, 0, 1); });
    Lm.visible = true; Lm.position.set(lx, 1.7, L3.box.z); Lm.rotation.z = 0.55 + 0.2 * Math.sin(pt * 6);
    Sm.visible = pt > 0.12 && pt < 0.85; Sm.position.set(lx - 0.18, 0.95, L3.box.z); Sm.scale.set(1, 1.3, 1);
    if (Sm.visible && Math.random() < dt * 30) K3.part('drop', lx - 0.18 + (Math.random() - 0.5) * 0.3, 0.5, L3.box.z + (Math.random() - 0.5) * 0.3, { vy: 1.5, vx: (Math.random() - 0.5) * 1.5, vz: (Math.random() - 0.5) * 1.5, s: 0.05, max: 0.3, col: B.pour.id === 'yang' ? '#d02a14' : '#7a3c12', floor: 0.1 });
    if (pt > 1.1) { B.pour = null; Lm.visible = false; Sm.visible = false; }
  }
  if (B.top && B.topT < 1) { B.topT = Math.min(1, B.topT + dt * 2.2); if (B.h.bits) B.h.bits.count = Math.floor(B.h.bits.instanceMatrix.count * B.topT); if (Math.random() < dt * 40) K3.part('drop', CT.box.x + (Math.random() - 0.5) * 1.6, 1.6, L3.box.z + (Math.random() - 0.5) * 1, { vy: -2, s: 0.035, max: 0.3, col: B.top === 'pa' ? '#7cc644' : '#ffd23a', floor: 0.3 }); }
  ['mu', 'cola'].forEach(function (k) { if (B[k] > 0 && B[k] < 1) B[k] = Math.min(1, B[k] + dt * 4); if (B[k] > 0) B.h[k].scale.setScalar(back(B[k])); });
  phys(B.nugs, CT.box, dt); B.nugs.forEach(K3.restyle);
  for (i = G.serve.length - 1; i >= 0; i--) {
    p = G.serve[i]; p.t += dt; var sb = p.box; sb.lid += (1 - sb.lid) * Math.min(1, dt * 16); sb.h.lid.rotation.x = -2.5 * (1 - sb.lid);
    if (!p.gone && sb.lid > 0.97) { p.gone = 1; sb.nugs.forEach(K3.dropPiece); if (sb.h.bits) sb.h.bits.visible = false; }
    var su = ease(clamp((p.t - 0.28) / 0.5, 0, 1)), tx = L3.slots[p.cu.slot];
    sb.h.g.position.set(L3.box.x + (tx - L3.box.x) * su, Math.sin(su * Math.PI) * 2.6 + su * 0.7, L3.box.z + (L3.custZ + 1.3 - L3.box.z) * su); sb.h.g.scale.setScalar(1 - su * 0.45);
    if (p.t >= 0.8) { if (!p.gone) sb.nugs.forEach(K3.dropPiece); dropBox(sb); p.cu.state = 'eat'; p.cu.t = 0; p.cu.mood = 'yum'; K3.personEat(p.cu.h, p.cu.eat); G.serve.splice(i, 1); }
  }
  /* 손님 */
  var first = null;
  for (i = 0; i < 3; i++) { p = G.cust[i]; if (p && p.state === 'wait' && (!first || p.no < first.no)) first = p; }
  for (i = 0; i < 3; i++) {
    p = G.cust[i]; if (!p) continue; p.t += dt;
    if (p.state === 'in') { if (p.t > 0.6) { p.state = 'wait'; p.t = 0; } }
    else if (p.state === 'wait') {
      p.pat -= dt / p.patT * (p === first ? 1 : 0.5);
      p.mood = p.pat > 0.5 ? 'happy' : p.pat > 0.22 ? 'meh' : 'angry';
      if (p.pat <= 0) { p.state = 'gone'; p.t = 0; p.mood = 'angry'; G.lost++; G.hearts--; hud(); SND.play('angry'); G.shake = 0.2; }
    }
    else if (p.state === 'eat') {
      var pc0 = p.chew; p.chew += dt;
      if (p.res.stars <= 2) { if (p.t > 0.5) { SND.play('crunch'); react(p); } }
      else { [0.18, 0.86].forEach(function (bt) { if (pc0 < bt && p.chew >= bt) { SND.play('crunch'); K3.burst('drop', L3.slots[p.slot] + 0.2, 2.4, L3.custZ + 1, 6, { v: 1.2, up: 1.5, col: '#e0a23c', s: 0.04, max: 0.4 }); } }); if (p.t > 1.5) react(p); }
    }
    else if (p.state === 'react') { p.chew += dt; if (p.t > 1.3) { p.state = 'out'; p.t = 0; K3.personEat(p.h, null); } }
    else if (p.state === 'out' || p.state === 'gone') { if (p.t > 0.6) { K3.personDrop(p.h); G.cust[i] = null; continue; } }
    custPose(p, dt);
  }
  G.spawnT -= dt;
  if (G.left > 0 && active() === 0) G.spawnT = Math.min(G.spawnT, 1.2);
  if (G.left > 0 && active() < st.max && G.spawnT <= 0) { var free = []; for (i = 0; i < 3; i++) if (!G.cust[i]) free.push(i); spawn(free[Math.floor(G.R() * free.length)]); G.spawnT = st.gap * (0.85 + 0.3 * G.R()); }
  if (G.hearts <= 0) { G.mode = 'over'; SND.play('over'); SND.fry(0); ui('over'); return; }
  if (G.left === 0 && active() === 0 && !G.coins.length) { G.endT += dt; if (G.endT > 0.8) finishDay(); }
}
function finishDay() {
  var avg = G.starSum / Math.max(1, G.served), s3 = (avg >= 4.3 && !G.lost) ? 3 : avg >= 3.2 ? 2 : 1, last = G.day >= DAYS.length - 1;
  G.mode = 'clear'; G.s3 = s3; S.total += G.served; S.stars[G.day] = Math.max(S.stars[G.day] || 0, s3);
  if (last) S.done = true; else S.day = Math.max(S.day, G.day + 1);
  save(); SND.fry(0); SND.play('clear'); showClear(s3, last);
}
function idle(mode) {
  clearScene(); var d = Math.min(11, S.day); K3.setDay(d, unlocked(d), nFry()); sync();
  G = { mode: mode, t: 0, endT: 0, texts: [], coins: [], board: [] };
  var pc = CK.whole(); pc.dx = pc.dz = pc.tx = pc.tz = 0; K3.pieceMesh(pc); var b = bpos(pc); pc.mesh.position.set(b[0], b[1], b[2]); G.board = [pc];
}
function goMap() { idle('map'); buildShop(); ui('map'); SND.music(1); }
function goTitle() { idle('title'); titleButtons(); ui('title'); SND.sad(0); }
function goEnd() {
  var keep = G; G.mode = 'end'; G.endT = 0;
  /* 엔딩 글을 한 줄씩 띄우고, 다 뜬 뒤에 THE END 카드. 화면을 누르면 한꺼번에 다 보인다 */
  $('end').classList.remove('all');
  $('endStory').innerHTML = TX.end.map(function (q, i) { return '<p style="animation-delay:' + (0.6 + i * 2.4).toFixed(1) + 's">' + L(q) + '</p>'; }).join('');
  ui('end'); SND.sad(1);   /* 색종이·클리어 가락 대신 슬픈 가락 */
}

/* ---------- 덧그림(2D): 말풍선, 막대, 글자, 동전, 길잡이 ---------- */
function otext(s, x, y, size, col, lw) { c.font = size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = lw || Math.max(6, size * 0.2); c.strokeStyle = '#4a2412'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); }
function drawBubble(cu) {
  if (cu.state !== 'wait' && cu.state !== 'in' && cu.state !== 'take') return;
  var hp = K3.toScreen(L3.slots[cu.slot], 3.25, cu.h.g.position.z), x = hp[0], n = cu.list.length, st = n > 3 ? 51 : 60, bw = n * st + 22, bh = 74, by = hp[1] - bh - 16, k = cu.state === 'in' ? back(cu.t / 0.6) : 1, bx = clamp(x - bw / 2, 6, W - bw - 6);
  c.save(); c.translate(x, by + bh); c.scale(k, k); c.translate(-x, -(by + bh));
  c.fillStyle = 'rgba(40,16,4,.25)'; A.rr(c, bx + 3, by + 5, bw, bh, 18); c.fill();
  A.rr(c, bx, by, bw, bh, 18); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#4a2412'; c.lineWidth = 4; c.stroke();
  c.beginPath(); c.moveTo(x - 12, by + bh - 2); c.lineTo(x, by + bh + 16); c.lineTo(x + 12, by + bh - 2); c.fillStyle = '#fffaf0'; c.fill(); c.beginPath(); c.moveTo(x - 12, by + bh); c.lineTo(x, by + bh + 16); c.lineTo(x + 12, by + bh); c.stroke();
  for (var i = 0; i < n; i++) { var s = iconSpr(cu.list[i]), isz = n > 3 ? 60 : 68; c.drawImage(s, bx + 11 + i * st + st / 2 - isz / 2, by + 37 - isz / 2, isz, isz); }
  c.restore();
  if (cu.state === 'wait') { var cp = K3.toScreen(L3.slots[cu.slot], 0.55, L3.counterZ + 0.38), w = 150, px = cp[0] - w / 2, py = cp[1] - 6; A.rr(c, px - 3, py - 3, w + 6, 18, 9); c.fillStyle = '#4a2412'; c.fill(); A.rr(c, px, py, w, 12, 6); c.fillStyle = '#e8d8b8'; c.fill(); if (cu.pat > 0.02) { A.rr(c, px, py, Math.max(12, w * cu.pat), 12, 6); c.fillStyle = cu.pat > 0.5 ? '#58c84a' : cu.pat > 0.22 ? '#f2b020' : '#e0281e'; c.fill(); } }
}
function ring(x, y, r) { var k = (clock * 1.4) % 1; c.save(); c.globalAlpha = 1 - k; c.strokeStyle = '#fff'; c.lineWidth = 6; A.ell(c, x, y, r * (0.7 + k * 0.5), r * (0.7 + k * 0.5)); c.stroke(); c.strokeStyle = '#ffd23a'; c.lineWidth = 3; c.stroke(); c.restore(); }
function finger(x0, y0, x1, y1) { var k = (clock * 0.8) % 1, u = ease(Math.min(1, k * 1.4)), x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; c.save(); c.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1; c.setLineDash([10, 9]); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke(); c.setLineDash([]); A.ell(c, x, y, 17, 17); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#ffd23a'; c.lineWidth = 5; c.stroke(); c.restore(); }
function S2(x, y, z) { return K3.toScreen(x, y, z); }
function drawHint() {
  var a = nextAction(false), p, q; if (!a || PT.down) return;
  if (a.t === 'crate') { p = S2(L3.crate.x, 0.6, L3.crate.z); ring(p[0], p[1], 70); }
  else if (a.t === 'cut') { var pc = a.pc, ang = pc.axis + Math.PI / 2, l = pc.rx + 0.5, x = BXc + pc.dx + pc.cx, z = BZc + pc.dz + pc.cz; p = S2(x - Math.cos(ang) * l, CUTY, z - Math.sin(ang) * l); q = S2(x + Math.cos(ang) * l, CUTY, z + Math.sin(ang) * l); if (p[1] > q[1]) { var t = p; p = q; q = t; } finger(p[0], p[1], q[0], q[1]); }
  else if (a.t === 'hop') { p = S2(BXc + a.pc.dx + a.pc.cx, TB + a.pc.cy * 2, BZc + a.pc.dz + a.pc.cz); ring(p[0], p[1], 44); }
  else if (a.t === 'stir') { var tt = clock * 5; p = S2(L3.bowl.x + Math.cos(tt) * 0.5, K3.BATY, L3.bowl.z + Math.sin(tt) * 0.5); c.save(); A.ell(c, p[0], p[1], 17, 17); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#ffd23a'; c.lineWidth = 5; c.stroke(); c.restore(); }
  else if (a.t === 'fry') { p = S2(L3.bowl.x, 0.6, L3.bowl.z); q = S2(L3.fry[a.i].x, 0.5, L3.fry[a.i].z); finger(p[0], p[1], q[0], q[1]); }
  else if (a.t === 'lift') { p = S2(L3.fry[a.i].x, 0.5, L3.fry[a.i].z); q = S2(L3.box.x, 0.4, L3.box.z); finger(p[0], p[1], q[0], q[1]); }
  else if (a.t === 'item') { p = S2(K3.stripX(STRIP.indexOf(a.id)), 0.3, L3.stripZ); ring(p[0], p[1], 50); }
  else if (a.t === 'cust') { p = S2(L3.slots[a.i], 2.0, L3.custZ); ring(p[0], p[1], 84); }
}
function draw2d() {
  var i, p, q;
  c.setTransform(SS, 0, 0, SS, 0, 0); c.clearRect(0, 0, W, H);
  if (G && (G.mode === 'play' || G.mode === 'clear' || G.mode === 'over')) {
    for (i = 0; i < 3; i++) if (G.cust[i]) drawBubble(G.cust[i]);
    for (i = 0; i < nFry(); i++) { p = S2(L3.fry[i].x, 0.36, L3.fry[i].z + FD / 2 + 0.25); c.save(); c.translate(p[0], p[1]); blit(sprite('dbar', 150, 50, function (x) { x.translate(75, 30); A.doneBar(x, 132, 0, 0); }), -75, -30); if (G.fry[i].nugs.length) A.doneNeedle(c, 132, avgDone(G.fry[i])); c.restore(); }
    for (var id in G.itemPop) if (G.itemPop[id] > 0) { p = S2(K3.stripX(STRIP.indexOf(id)), 0.3, L3.stripZ); c.save(); c.globalAlpha = G.itemPop[id] * 3; A.ell(c, p[0], p[1], 50, 44); c.fillStyle = '#fff'; c.fill(); c.restore(); }
    var rdy = G.gauge >= G.need, cr = 40; p = S2(L3.cleaver.x, 0.1, L3.cleaver.z); G.clvS = p;
    blit(sprite('clv' + G.gauge + '_' + G.need, cr * 2 + 20, cr * 2 + 20, function (x) { x.translate(cr + 10, cr + 10); A.cleaver(x, cr, G.gauge / G.need, rdy, 0, 1); }), p[0] - cr - 10, p[1] - cr - 10);
    if (rdy) { c.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(clock * 8)) + ')'; c.lineWidth = 3; A.ell(c, p[0], p[1], cr + 5 + 2 * Math.sin(clock * 8), cr + 5 + 2 * Math.sin(clock * 8)); c.stroke(); }
    for (i = 0; i < G.slashes.length; i++) { var s = G.slashes[i], k = 1 - s.t / 0.28; p = S2(s.a[0], s.a[1], s.a[2]); q = S2(s.b[0], s.b[1], s.b[2]); c.save(); c.globalAlpha = k; c.lineCap = 'round'; c.strokeStyle = '#fff'; c.lineWidth = 3 + 7 * k; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); c.restore(); }
    if (G.trail.length > 1) { c.save(); c.lineCap = 'round'; for (i = 1; i < G.trail.length; i++) { var a = G.trail[i - 1], b = G.trail[i], ag = 1 - (clock - b.t) / 0.2; if (ag <= 0) continue; c.strokeStyle = 'rgba(255,255,255,' + ag * 0.9 + ')'; c.lineWidth = 2 + 9 * ag; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } c.restore(); }
    if (G.chop && G.chop.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + G.chop.flash * 4 + ')'; c.fillRect(0, 0, W, H); }
    if (G.hint && G.mode === 'play') drawHint();
    if (G.banner > 0) { var bk = G.banner > 1.7 ? back((2 - G.banner) / 0.3) : G.banner < 0.3 ? G.banner / 0.3 : 1; c.save(); c.translate(W / 2, H * 0.46); c.scale(bk, bk); otext('DAY ' + (G.day + 1), 0, 0, 120, '#ffd23a', 22); c.restore(); }
  }
  if (!G) return;
  var cs = sprite('coin', 44, 46, function (x) { x.translate(22, 21); A.coin(x, 18); });
  for (i = 0; i < G.coins.length; i++) { p = G.coins[i]; if (p.t < 0) continue; blit(cs, p.x - 22, p.y - 21); }
  for (i = 0; i < G.texts.length; i++) { p = G.texts[i]; var u = p.t / p.max, sc = back(p.t / 0.22); c.save(); c.globalAlpha = u > 0.75 ? (1 - u) * 4 : 1; c.font = p.size + 'px ' + FONT; var tw = c.measureText(p.s).width / 2 + 16; c.translate(Math.max(tw, Math.min(W - tw, p.x)), p.y - u * 46); c.scale(sc, sc); otext(p.s, 0, 0, p.size, p.col); c.restore(); }
}
function draw() {
  var kn = K3.O.knife, sh = G && G.shake > 0 ? G.shake * 40 : 0;
  gl.style.transform = sh ? 'translate(' + ((Math.random() - 0.5) * sh).toFixed(1) + 'px,' + ((Math.random() - 0.5) * sh).toFixed(1) + 'px)' : '';
  if (G && G.mode === 'play' && G.chop && G.chop.t > 0) { var ch = G.chop, ph = (ch.t % 0.22) / 0.22, up = ch.n < 3 ? 1 - ph : 1; kn.visible = ch.t < 1.3; kn.scale.setScalar(2.4); kn.position.set(BXc - 1.2, TB + 0.3 + up * 2.6, BZc + (ch.n % 2 ? 0.4 : -0.3)); kn.rotation.set(0, (ch.n % 2) * 1.3 - 0.2, -up * 0.5); }
  else if (G && G.mode === 'play' && PT.down && PT.mode === 'knife') { kn.visible = true; kn.scale.setScalar(1); kn.position.set(K.lx - K.dx * 0.55, TB + 0.42, K.lz - K.dz * 0.55); kn.rotation.set(0, -Math.atan2(K.dz, K.dx), 0); }
  else kn.visible = false;
  K3.render(); draw2d();
}

/* ---------- 화면(DOM) ---------- */
var SCR = ['title', 'mapScr', 'clear', 'over', 'end', 'confirm'];
function ui(m) {
  var on = { title: 'title', map: 'mapScr', clear: 'clear', over: 'over', end: 'end' }[m];
  SCR.forEach(function (id) { $(id).hidden = id !== on; });
  document.body.className = (m === 'title' ? 'm-title' : m === 'map' ? 'm-map' : m === 'end' ? 'm-end' : 'm-play') + (EN ? ' en' : '');
  hud();
}
function hud(pop) {
  $('coins').textContent = S.coins;
  if (pop) { var e = $('coinP'); e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
  var hc = $('hearts'), n = G && G.maxHearts ? G.maxHearts : 3, x = hc.getContext('2d');
  hc.width = n * 44; hc.height = 44; hc.style.width = n * (n > 3 ? 15 : 20) + 'px';
  for (var i = 0; i < n; i++) { x.save(); x.translate(22 + i * 44, 23); A.heart(x, 15, G && i < G.hearts); x.restore(); }
}
function titleButtons() {
  var has = (S.started || S.day > 0 || S.coins > 0 || S.total > 0) && !S.done;
  $('bStart').hidden = has; $('bCont').hidden = !has; $('bNew').hidden = !has;
}
function showClear(s3, last) {
  var x = $('cstars').getContext('2d'), i; x.clearRect(0, 0, 360, 130);
  for (i = 0; i < 3; i++) A.star(x, 70 + i * 110, 70 - (i === 1 ? 12 : 0), i === 1 ? 54 : 46, i < s3 ? '#ffd034' : '#b89a6a', i < s3 ? '#8a5600' : '#94743e');
  $('cearn').textContent = '+' + G.earned;
  var nw = last ? [] : DAYS[G.day + 1].unlock.slice(), box = $('cnew'), cvs = $('cnewC'), y = cvs.getContext('2d');
  box.hidden = !nw.length;
  if (nw.length) { cvs.width = nw.length * 150; cvs.height = 150; cvs.style.width = 'calc(var(--u) * ' + nw.length * 112 + ')'; nw.forEach(function (id, k) { y.save(); y.translate(75 + k * 150, 78); A.icon(y, id, 56); y.restore(); }); }
  ui('clear');
}
function buildShop() {
  var box = $('shop'); box.innerHTML = '';
  $('mday').textContent = 'DAY ' + (S.day + 1);
  UPS.forEach(function (u) {
    var lv = S.up[u.id], max = lv >= u.max, price = max ? 0 : u.price[lv], el = document.createElement('button'), pips = '';
    for (var i = 0; i < u.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
    el.className = 'item' + (max ? ' max' : S.coins < price ? ' poor' : '');
    el.innerHTML = '<canvas width="160" height="160"></canvas><span class="nm">' + L(TX.shop[u.id]) + '</span><span class="pips">' + pips + '</span><span class="pr">' + (max ? 'MAX' : '<canvas class="ci" width="44" height="46"></canvas>' + price) + '</span>';
    var x = el.querySelector('canvas').getContext('2d'); x.translate(80, 84); A.shopIcon(x, u.id, 56);
    if (!max) { var y = el.querySelector('.ci').getContext('2d'); y.translate(22, 21); A.coin(y, 18); }
    el.addEventListener('click', function () {
      SND.unlock();
      if (max || S.coins < price) { SND.play('nope'); el.classList.remove('no'); void el.offsetWidth; el.classList.add('no'); return; }
      S.coins -= price; S.up[u.id]++; save(); SND.play('buy'); buildShop(); hud(1); K3.setDay(Math.min(11, S.day), unlocked(Math.min(11, S.day)), nFry()); sync();
    });
    box.appendChild(el);
  });
}

/* ---------- 입력 ---------- */
function inBoard(x, z) { return Math.abs(x - L3.board.x) < L3.board.w / 2 && Math.abs(z - L3.board.z) < L3.board.d / 2; }
function onCleaver(x, y) { return G.clvS && Math.hypot(x - G.clvS[0], y - G.clvS[1]) < 52; }
function custAt(x, y) { for (var i = 0; i < 3; i++) if (G.cust[i]) { var p = K3.toScreen(L3.slots[i], 1.9, L3.custZ); if (Math.abs(x - p[0]) < 105 && y > p[1] - 170 && y < p[1] + 110) return G.cust[i]; } return null; }
function tap(x, y) {
  if (!G || G.mode !== 'play' || G.chop) return;
  var cu = custAt(x, y), w = K3.pick(x, y, 0.3), wx = w[0], wz = w[1];
  if (cu && wz < L3.counterZ + 0.8) { if (!serve(cu) && cu.state === 'wait') { G.shakeBox = 0.3; SND.play('nope'); } return; }
  if (onCleaver(x, y)) return tapCleaver();
  if (inBoard(wx, wz) || G.board.length) {
    /* 조각 높이가 제각각이라 높이를 바꿔 가며 찾는다(납작한 작은 조각도 잡히게) */
    var pc = null, hs = [CUTY, TB + 0.35, TB + 0.1], hi;
    for (hi = 0; hi < 3 && !pc; hi++) { var b = K3.pick(x, y, hs[hi]); pc = pieceAt(b[0], b[1], false); }
    for (hi = 0; hi < 3 && !pc; hi++) { var b2 = K3.pick(x, y, hs[hi]); pc = pieceAt(b2[0], b2[1], true); }
    if (pc && !(pc.land != null && pc.land < 1)) { hop(pc); return; }
    if (inBoard(wx, wz)) return;
  }
  if (Math.abs(wx - L3.crate.x) < L3.crate.w / 2 + 0.08 && Math.abs(wz - L3.crate.z) < L3.crate.d / 2 + 0.08) return takeChicken();
  var sk = stripHit(wx, wz); if (sk >= 0) return tapItem(STRIP[sk]);
  if (inBox(wx, wz)) return tapBox();
}
function pos(e) { return [(e.clientX - ox) / U, (e.clientY - oy) / U]; }
function pdown(x, y) {
  PT.down = true; PT.x = PT.x0 = x; PT.y = PT.y0 = y; PT.t0 = performance.now(); PT.moved = 0; PT.sp = 0; PT.lt = PT.t0; PT.mode = 'tap';
  if (!G || G.mode !== 'play' || G.chop) return;
  if (onCleaver(x, y)) return;
  var w = K3.pick(x, y, 0.3), wx = w[0], wz = w[1]; PT.wx = wx; PT.wz = wz;
  var bw = K3.pick(x, y, K3.BATY); if (Math.hypot(bw[0] - L3.bowl.x, bw[1] - L3.bowl.z) < L3.bowl.r + 0.08) { PT.mode = 'stir'; PT.wx = bw[0]; PT.wz = bw[1]; return; }
  for (var i = 0; i < nFry(); i++) if (inFry(i, wx, wz) && G.fry[i].nugs.length && startCarry(i, wx, wz)) { PT.mode = 'carry'; return; }
  /* 도마 둘레(도마 밖 작업대에서 시작한 칼질도 받는다) */
  var onCrate = Math.abs(wx - L3.crate.x) < L3.crate.w / 2 + 0.08 && Math.abs(wz - L3.crate.z) < L3.crate.d / 2 + 0.08;
  if (!onCrate && knifeZone(wx, wz)) knifeStart(x, y);
}
function stripHit(wx, wz) { if (Math.abs(wz - L3.stripZ) >= 0.5) return -1; var k = Math.round((wx - L3.strip0) / 1.017); return k >= 0 && k < 7 && Math.abs(wx - K3.stripX(k)) < 0.5 ? k : -1; }
function knifeZone(wx, wz) { return stripHit(wx, wz) < 0 && (L3.wide || wz > L3.stripZ + 0.5) && Math.abs(wx - L3.board.x) < L3.board.w / 2 + 0.75 && Math.abs(wz - L3.board.z) < L3.board.d / 2 + 0.9 && Math.hypot(wx - L3.bowl.x, wz - L3.bowl.z) > L3.bowl.r + 0.1; }
function knifeStart(x, y) { var b = K3.pick(x, y, CUTY); PT.mode = 'knife'; K.entered = false; K.ax = K.lx = b[0]; K.az = K.lz = b[1]; K.out = 0; strokeStep(b[0], b[1]); G.trail.push({ x: x, y: y, t: clock });
}
function pmove(x, y) {
  if (!PT.down) return;
  var d = Math.hypot(x - PT.x, y - PT.y), now = performance.now(), dtm = Math.max(8, now - PT.lt) / 1000; PT.lt = now; PT.moved += d; PT.x = x; PT.y = y;
  if (!G || G.mode !== 'play') return;
  if (PT.mode === 'tap' && PT.moved > 18 && !G.chop && !onCleaver(PT.x0, PT.y0)) { var kw = K3.pick(x, y, 0.3); if (knifeZone(kw[0], kw[1])) { knifeStart(PT.x0, PT.y0); var kb = K3.pick(x, y, CUTY); strokeTo(kb[0], kb[1]); G.trail.push({ x: x, y: y, t: clock }); } }
  else if (PT.mode === 'knife') { if (!G.chop) { var b = K3.pick(x, y, CUTY); strokeTo(b[0], b[1]); G.trail.push({ x: x, y: y, t: clock }); } }
  else if (PT.mode === 'stir') {
    var w = K3.pick(x, y, K3.BATY), dx = w[0] - PT.wx, dz = w[1] - PT.wz; PT.wx = w[0]; PT.wz = w[1];
    PT.sp = Math.max(PT.sp, Math.hypot(dx, dz) / dtm);
    G.bowl.nugs.forEach(function (n) { var q = Math.hypot(n.p.x - (w[0] - L3.bowl.x), n.p.z - (w[1] - L3.bowl.z)); if (q < 0.6) { n.v.x += dx * 7; n.v.z += dz * 7; } });
    if (Math.hypot(w[0] - L3.bowl.x, w[1] - L3.bowl.z) > L3.bowl.r + 0.3 && G.bowl.nugs.length && startCarry('bowl', w[0], w[1])) PT.mode = 'carry';
  }
  else if (PT.mode === 'carry' && G.carry) { var cw = K3.pick(x, y, CARRY); G.carry.tx = cw[0]; G.carry.tz = cw[1]; }
}
function pup() {
  if (!PT.down) return; PT.down = false;
  if (PT.mode === 'carry') { if (G.carry) dropCarry(G.carry.tx, G.carry.tz); return; }
  if (PT.moved < 16 && performance.now() - PT.t0 < 600) tap(PT.x0, PT.y0);
}
cv.addEventListener('pointerdown', function (e) { e.preventDefault(); SND.unlock(); if (PT.down) return; PT.id = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (er) {} var q = pos(e); pdown(q[0], q[1]); });
cv.addEventListener('pointermove', function (e) { if (e.pointerId !== PT.id) return; var q = pos(e); pmove(q[0], q[1]); });
function pend(e) { if (e.pointerId !== PT.id) return; pup(); }
cv.addEventListener('pointerup', pend); cv.addEventListener('pointercancel', pend);
function click(id, fn) { $(id).addEventListener('click', function () { SND.unlock(); SND.play('btn'); fn(); }); }
click('bStart', function () { if (S.done) { S = fresh(); save(); } startDay(0); });
click('bCont', function () { goMap(); });
click('bNew', function () { $('confirm').hidden = false; });
click('bNo', function () { $('confirm').hidden = true; });
click('bYes', function () { $('confirm').hidden = true; S = fresh(); save(); startDay(0); });
click('bGo', function () { startDay(S.day); });
click('bNext', function () { if (G.day >= DAYS.length - 1) goEnd(); else goMap(); });
click('bRetry', function () { startDay(G.day); });
click('bTitle', function () { goTitle(); });
$('end').addEventListener('click', function (e) { if (e.target.id !== 'bTitle') $('end').classList.add('all'); });
function tog(id, key, set) {
  var el = $(id), v = true; try { v = localStorage.getItem(key) !== '0'; } catch (e) {}
  function ap() { el.classList.toggle('off', !v); set(v ? 1 : 0); }
  el.addEventListener('click', function () { SND.unlock(); v = !v; try { localStorage.setItem(key, v ? '1' : '0'); } catch (e) {} ap(); }); ap();
}
tog('tBgm', 'chicken.bgm', function (v) { SND.bgm(v); }); tog('tSnd', 'chicken.snd', function (v) { SND.snd(v); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('confirm').hidden = true; if (e.key === 'Enter' && !$('confirm').hidden) $('bYes').click(); });
document.addEventListener('visibilitychange', function () { SND.hide(document.hidden); lastTs = 0; });
window.addEventListener('resize', resize);

/* ---------- 돌리기 ---------- */
var lastTs = 0;
function frame(ts) { var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0; lastTs = ts; if (!document.hidden) { step(dt); draw(); } requestAnimationFrame(frame); }
document.title = L(TX.title); $('signT').textContent = EN ? TX.title[1] : '개발자 치킨집';   /* 제목 그림에서는 띄어 쓴다(사장님 10/2) */
(function () { var a = $('coinI').getContext('2d'); a.translate(22, 21); A.coin(a, 18); var b = $('cearnI').getContext('2d'); b.translate(22, 21); A.coin(b, 18); })();
CK.init();
/* 첫 칼질이 끊기지 않게 자르는 셈을 미리 몇 번 돌려 둔다 */
(function () { var w = CK.whole(), r; for (var i = 0; i < 3; i++) { r = CK.tryCut(w, -2.2, 0.1 + i * 0.2, 2.2, 0.1 + i * 0.2); if (r) CK.halve(r.parts[0], 0); } })();
K3.init(gl); resize(); goTitle(); draw();
if (document.fonts && document.fonts.load) document.fonts.load('40px Hanna').then(function () { cache = {}; });
requestAnimationFrame(frame);

/* 시험 손잡이 */
window.__ck = {
  tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) step(dt || 1 / 60); draw(); },
  G: function () { return G; }, S: function () { return S; }, start: startDay, map: goMap, title: goTitle, end: goEnd, tap: tap, next: nextAction, act: doAction, resize: resize,
  down: pdown, move: pmove, up: pup, judge: judge, K: K,
  set: function (o) { for (var k in o) S[k] = o[k]; save(); hud(); },
  /* 작업대 좌표로 긋기 */
  cut: function (x0, z0, x1, z1) { K.entered = false; K.ax = K.lx = x0; K.az = K.lz = z0; K.out = 0; strokeStep(x0, z0); strokeTo(x1, z1); },
  stroke: function (x0, y0, x1, y1) { pdown(x0, y0); for (var i = 1; i <= 12; i++) pmove(x0 + (x1 - x0) * i / 12, y0 + (y1 - y0) * i / 12); PT.moved = 99; pup(); },
  bot: function (sec, every, noise) {
    var t = 0, acc = 0, dt = 1 / 60; every = every || 0.6;
    while (t < sec && G.mode === 'play') { step(dt); t += dt; acc += dt; if (acc >= every) { acc = 0; var a = nextAction(true); if (a && a.t === 'stir') a.dur = every; doAction(a, noise); } }
    draw(); return { mode: G.mode, t: Math.round(t), served: G.served, lost: G.lost, hearts: G.hearts, earned: G.earned, avg: +(G.starSum / Math.max(1, G.served)).toFixed(2), s3: G.s3, coins: S.coins };
  },
  shot: function (name) {
    draw(); var t = A.mk(gl.width, gl.height), x = t.getContext('2d'); x.drawImage(gl, 0, 0); x.drawImage(cv, 0, 0, gl.width, gl.height);
    return fetch('/save?name=' + name, { method: 'POST', body: t.toDataURL('image/png') }).then(function (r) { return r.text(); });
  }
};
})();
