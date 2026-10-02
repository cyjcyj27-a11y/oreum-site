/* 타코 만들기 — 게임 */
(function () {
'use strict';
var EN = /[?&]lang=en\b/.test(location.search);
if (EN) document.documentElement.lang = 'en';
var A = ART, TAU = Math.PI * 2, $ = function (id) { return document.getElementById(id); };
function L(a) { return a[EN ? 1 : 0]; }
var TX = {
  title: ['VIVA 타코스', 'VIVA TACOS'],
  stops: [['선인장 사막', 'Cactus Desert'], ['오아시스 마을', 'Oasis Village'], ['야자수 해변', 'Palm Beach'], ['등대 항구', 'Lighthouse Harbor'], ['옥수수 밭', 'Corn Field'], ['붉은 협곡', 'Red Canyon'],
    ['분수 광장', 'Fountain Plaza'], ['시장 골목', 'Market Street'], ['화산 기슭', 'Volcano Foothills'], ['정글 유적', 'Jungle Ruins'], ['밤의 도시', 'City Night'], ['타코 축제', 'Taco Fiesta']],
  shop: { fire: ['화력', 'Heat'], burner: ['화구', 'Burner'], parasol: ['파라솔', 'Parasol'], tip: ['팁 통', 'Tip Jar'], pinata: ['피냐타', 'Piñata'], heart: ['하트', 'Heart'] }
};
var FONT = "'Taco','Ria',sans-serif";

/* ---------- 판 구성 ---------- */
var STOPS = [
  { n: 8, max: 1, pat: 46, items: [2, 2], unlock: [] },
  { n: 10, max: 2, pat: 46, items: [2, 3], unlock: ['tomato'] },
  { n: 12, max: 2, pat: 44, items: [2, 3], unlock: ['roja'] },
  { n: 12, max: 2, pat: 42, items: [3, 4], unlock: ['onion'] },
  { n: 14, max: 3, pat: 44, items: [3, 4], unlock: ['chicken'] },
  { n: 14, max: 3, pat: 42, items: [3, 4], unlock: ['avocado'] },
  { n: 16, max: 3, pat: 40, items: [3, 5], unlock: ['cilantro'] },
  { n: 16, max: 3, pat: 40, items: [3, 5], unlock: ['verde'] },
  { n: 18, max: 3, pat: 38, items: [4, 5], unlock: ['corn'] },
  { n: 18, max: 3, pat: 38, items: [4, 6], unlock: ['shrimp'] },
  { n: 20, max: 3, pat: 36, items: [4, 6], unlock: ['jalapeno', 'lime'] },
  { n: 24, max: 3, pat: 36, items: [4, 6], unlock: ['crema'] }
];
var UPS = [
  { id: 'fire', max: 3, price: [100, 300, 700] },
  { id: 'burner', max: 1, price: [250] },
  { id: 'parasol', max: 3, price: [150, 400, 800] },
  { id: 'tip', max: 3, price: [150, 400, 800] },
  { id: 'pinata', max: 3, price: [200, 500, 1000] },
  { id: 'heart', max: 2, price: [300, 800] }
];
var PROT = { beef: 1, chicken: 1, shrimp: 1 };
var ALL = A.BINS.concat(A.SAUCES);
function unlocked(stop) { var u = ['beef', 'lettuce', 'cheese']; for (var i = 1; i <= stop; i++) u = u.concat(STOPS[i].unlock); return u; }

/* ---------- 저장 ---------- */
var KEY = 'taco.save';
function fresh() { return { stop: 0, coins: 0, up: { fire: 0, burner: 0, parasol: 0, tip: 0, pinata: 0, heart: 0 }, stars: [], done: false, total: 0 }; }
function load() { try { var o = JSON.parse(localStorage.getItem(KEY)); if (o && typeof o.stop === 'number' && o.up) return o; } catch (e) {} return null; }
var S = load() || fresh();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* ---------- 화면 맞춤 ---------- */
var cv = $('cv'), c = cv.getContext('2d');
var W = 720, H = 1280, LY = 440, SS = 1, colW = 360, ox = 0, oy = 0, dpr = 1, M0 = 490, P = {}, cache = {};
function resize() {
  var vw = window.innerWidth, vh = window.innerHeight, O = window.TACO_OPT || {};
  if (vw < 8 || vh < 8) return;
  colW = Math.min(vw, Math.floor(vh * 0.5625));
  H = Math.round(Math.min(1600, Math.max(1280, 720 * vh / colW)));
  var cssH = colW * H / 720;
  ox = Math.round((vw - colW) / 2); oy = Math.max(0, Math.round((vh - cssH) / 2));
  dpr = O.dpr || Math.min(window.devicePixelRatio || 1, 2); SS = colW / 720 * dpr;
  cv.width = Math.round(colW * dpr); cv.height = Math.round(cssH * dpr);
  cv.style.left = ox + 'px'; cv.style.top = oy + 'px'; cv.style.width = colW + 'px'; cv.style.height = cssH + 'px';
  var st = document.documentElement.style;
  st.setProperty('--col', colW + 'px'); st.setProperty('--ox', ox + 'px'); st.setProperty('--oy', oy + 'px'); st.setProperty('--u', (colW / 720) + 'px'); st.setProperty('--ch', cssH + 'px');
  st.setProperty('--padl', Math.max(8, 104 - ox) + 'px');
  M0 = 490 + (H - 1280) * 0.4;
  P.slots = [130, 360, 590];
  P.comal = [[100, M0 + 70], [100, M0 + 205]]; P.stack = [100, M0 + 338]; P.tray = [385, M0 + 196]; P.pin = [632, M0 + 92];
  P.sauce = [[578, M0 + 306], [632, M0 + 306], [686, M0 + 306]]; P.trash = [632, M0 + 356]; P.binY = H - 366;
  cache = {};
  if (G && G.mode === 'map') placeMap();
}
function sprite(key, w, h, fn) {
  var s = cache[key];
  if (!s) { s = A.mk(Math.ceil(w * SS), Math.ceil(h * SS)); var x = s.getContext('2d'); x.scale(SS, SS); fn(x); s._w = w; s._h = h; cache[key] = s; }
  return s;
}
function blit(s, x, y) { c.drawImage(s, x, y, s._w, s._h); }
function iconSpr(id) { return sprite('ic_' + id, 64, 64, function (x) { x.translate(32, 32); A.icon(x, id, 25); }); }
function binPos(id) { var k = A.BINS.indexOf(id); return [10 + (k % 4) * 176, P.binY + Math.floor(k / 4) * 120]; }
function srcPos(id) { var k = A.SAUCES.indexOf(id); if (k >= 0) return [P.sauce[k][0], P.sauce[k][1] - 70]; var b = binPos(id); return [b[0] + 86, b[1] + 56]; }
function ease(t) { t = Math.max(0, Math.min(1, t)); return 1 - (1 - t) * (1 - t); }
function back(t) { t = Math.max(0, Math.min(1, t)); var s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; }

/* ---------- 판 상태 ---------- */
var G = null, clock = 0, bag = [];
function newTray(i) { return { i: i || 0, tort: null, items: {}, pcs: [], sauces: [], seed: (Math.random() * 9999) | 0 }; }
/* 접시: 화구가 하나면 큰 접시 하나, 화구를 사면 접시도 둘(위아래) */
function nTray() { return 1 + S.up.burner; }
function trayGeo(i) { return nTray() === 1 ? [P.tray[0], P.tray[1], 128, 1] : [P.tray[0], M0 + (i ? 306 : 108), 84, 0.66]; }
function setTray(i, T) { G.trays[i] = T; if (i === G.ti) G.tray = T; }
function pickTray(i) { G.ti = i; G.tray = G.trays[i]; }
function nComal() { return 1 + S.up.burner; }
function startStop(i, seed) {
  var st = STOPS[i];
  G = { mode: 'play', stop: i, t: 0, cust: [null, null, null], left: st.n, served: 0, lost: 0, starSum: 0, earned: 0, perfect: 0,
    hearts: 3 + S.up.heart, maxHearts: 3 + S.up.heart, spawnT: 1.5, comal: [null, null], trays: [newTray(0), newTray(1)], ti: 0, tray: null, fly: [], parts: [], coins: [], texts: [], serve: [],
    gauge: 0, need: 8 - S.up.pinata, fiesta: 0, pin: null, banner: 2.0, endT: 0, sauceAnim: null, shakeTray: 0, shakeStack: 0, nSpawn: 0, un: unlocked(i),
    R: seed ? A.rng(seed) : Math.random, hint: i === 0 && !S.total };
  G.tray = G.trays[0];
  shown = S.coins; hud(); ui('play'); SND.music(1); SND.fiesta(0);
}
function active() { var n = 0; for (var i = 0; i < 3; i++) if (G.cust[i]) n++; return n; }
function makeOrder() {
  var st = STOPS[G.stop], R = G.R, un = G.un, k = st.items[0] + Math.floor(R() * (st.items[1] - st.items[0] + 1));
  var prots = un.filter(function (id) { return PROT[id]; }), tops = un.filter(function (id) { return !PROT[id] && A.ING[id].kind === 'bin'; }), sauces = un.filter(function (id) { return A.ING[id].kind === 'sauce'; });
  var p = prots[Math.floor(R() * prots.length)], pick = [], nw = G.nSpawn < 2 ? st.unlock : [], i, sauce = null;
  nw.forEach(function (id) { if (PROT[id]) p = id; else if (A.ING[id].kind === 'sauce') sauce = id; else if (pick.length < k - 1) pick.push(id); });
  if (!sauce && sauces.length && R() < 0.55) sauce = sauces[Math.floor(R() * sauces.length)];
  tops = tops.slice(); for (i = tops.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)), tmp = tops[i]; tops[i] = tops[j]; tops[j] = tmp; }
  for (i = 0; i < tops.length && pick.length < k - 1 - (sauce ? 1 : 0); i++) if (pick.indexOf(tops[i]) < 0) pick.push(tops[i]);
  if (sauce && pick.length < k - 1) pick.push(sauce);
  pick.push(p);
  var list = ALL.filter(function (id) { return pick.indexOf(id) >= 0; }), order = {}, n = 0;
  list.sort(function (a, b) { return (PROT[b] || 0) - (PROT[a] || 0); });
  list.forEach(function (id) { order[id] = 1; n++; });
  if (G.stop >= 2 && R() < 0.12 + G.stop * 0.03) { var d = list.filter(function (id) { return A.ING[id].kind === 'bin'; }); d = d[Math.floor(R() * d.length)]; order[d] = 2; n++; }
  return { order: order, list: list, n: n };
}
function spawn(slot) {
  /* 손님은 12명을 섞은 묶음에서 차례로 뽑는다. 지금 창구에 있는 사람과 같은 사람은 건너뛴다 */
  var st = STOPS[G.stop], sp = null, i, k;
  for (k = 0; k < 3 && !sp; k++) {
    if (!bag.length) { bag = A.SPLIST.slice(); for (i = bag.length - 1; i > 0; i--) { var j = Math.floor(G.R() * (i + 1)), tmp = bag[i]; bag[i] = bag[j]; bag[j] = tmp; } }
    for (i = bag.length - 1; i >= 0; i--) { var here = false; for (var q = 0; q < 3; q++) if (G.cust[q] && G.cust[q].sp === bag[i]) here = true; if (!here) { sp = bag.splice(i, 1)[0]; break; } }
    if (!sp) bag = [];
  }
  var o = makeOrder(), a = G.R();
  G.cust[slot] = { no: G.nSpawn, sp: sp, acc: a < 0.3 ? 1 : a < 0.5 ? 2 : 0, seed: G.R() * 10, slot: slot, state: 'in', t: 0, pat: 1, order: o.order, list: o.list, n: o.n,
    patT: (30 + 5.5 * o.n) * (1 - G.stop * 0.02) * (1 + 0.15 * S.up.parasol), mood: 'happy', res: null, bites: 0 };
  G.left--; G.nSpawn++; SND.play('bell');
}

/* ---------- 효과 ---------- */
function part(k, x, y, o) { var p = { k: k, x: x, y: y, vx: 0, vy: 0, life: 0, max: 0.6, s: 6, rot: 0, vr: 0, col: '#fff', g: 0 }; for (var a in o) p[a] = o[a]; G.parts.push(p); }
function burst(x, y, n, o) { for (var i = 0; i < n; i++) { var a = Math.random() * TAU, v = (o.v || 200) * (0.4 + Math.random() * 0.8); part(o.k || 'conf', x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), g: o.g == null ? 700 : o.g, max: (o.max || 0.8) * (0.7 + Math.random() * 0.6), s: (o.s || 8) * (0.6 + Math.random() * 0.8), col: o.cols ? o.cols[i % o.cols.length] : o.col, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, id: o.id }); } }
function text(x, y, s, col, size, max) { G.texts.push({ x: x, y: y, s: s, col: col, size: size || 44, t: 0, max: max || 1.2 }); }
function coinTarget() { var r = $('coinP').getBoundingClientRect(); return [(r.left + 16 - ox) / colW * 720, (r.top + r.height / 2 - oy) / colW * 720]; }
function coinsTo(x, y, total) {
  var n = Math.min(8, Math.max(1, Math.round(total / 12))), each = Math.floor(total / n), rest = total - each * n, tg = coinTarget();
  for (var i = 0; i < n; i++) G.coins.push({ x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 30, x1: tg[0], y1: tg[1], t: -i * 0.06, dur: 0.6, val: each + (i === 0 ? rest : 0) });
}

/* ---------- 조작 ---------- */
function freeComal() { for (var i = 0; i < nComal(); i++) if (!G.comal[i]) return i; return -1; }
function tapStack(i) {
  if (i == null || G.comal[i]) i = freeComal();
  if (i < 0 || i >= nComal()) { G.shakeStack = 0.3; SND.play('nope'); return false; }
  G.comal[i] = { p: 0, seed: 1 + Math.floor(Math.random() * 999), inT: 0, wob: 0, dinged: false }; SND.play('slap'); return true;
}
function tapComal(i) {
  if (i >= nComal()) { SND.play('nope'); return; }
  var tt = G.comal[i]; if (!tt) return tapStack(i);
  if (tt.p < 0.5) { tt.wob = 0.35; SND.play('nope'); return; }
  if (tt.p >= 1.3) { G.comal[i] = null; burst(P.comal[i][0], P.comal[i][1], 8, { k: 'smoke', v: 60, g: -120, max: 0.8, s: 22, col: '#3a2a22' }); SND.play('trash'); return; }
  var to = !G.tray.tort ? G.ti : (nTray() > 1 && !G.trays[1 - G.ti].tort) ? 1 - G.ti : -1;
  if (to < 0) { G.shakeTray = 0.3; SND.play('nope'); return; }
  var NT = newTray(to); NT.tort = { p: tt.p, seed: tt.seed, inT: 0, fx: P.comal[i][0], fy: P.comal[i][1] };
  G.comal[i] = null; setTray(to, NT); pickTray(to); SND.play('plate');
}
function tapItem(id) {
  if (G.un.indexOf(id) < 0) return;
  var T = G.tray, cnt = T.items[id] || 0, sauce = A.ING[id].kind === 'sauce';
  if (!T.tort || cnt >= 3 || (sauce && G.sauceAnim)) { G.shakeTray = 0.3; SND.play('nope'); return; }
  T.items[id] = cnt + 1;
  if (sauce) { var sl = { id: id, k: T.sauces.length, prog: 0 }; T.sauces.push(sl); G.sauceAnim = { id: id, t: 0, line: sl, T: T }; SND.play('squirt'); return; }
  var from = srcPos(id), spots = A.scoopSpots(id, cnt, T.seed);
  spots.forEach(function (s, i) { G.fly.push({ id: id, x0: from[0] + (Math.random() - 0.5) * 60, y0: from[1] + (Math.random() - 0.5) * 30, x1: s.x * 118, y1: s.y * 118, t: -i * 0.022, dur: 0.3, rot: s.rot, v: s.v, T: T }); });
  SND.play('scoop', id); binPop[id] = 0.18;
}
var binPop = {};
function tapTrash() {
  var T = G.tray; if (!T.tort) { SND.play('nope'); return; }
  burst(trayGeo(T.i)[0], trayGeo(T.i)[1], 10, { k: 'crumb', v: 220, up: 120, col: A.tortillaCol(T.tort.p), s: 9 });
  G.fly = G.fly.filter(function (f) { return f.T !== T; }); setTray(T.i, newTray(T.i)); if (G.sauceAnim && G.sauceAnim.T === T) G.sauceAnim = null; SND.play('trash');
  if (nTray() > 1 && G.trays[1 - T.i].tort) pickTray(1 - T.i);
}
function judge(cu, T) {
  var miss = 0, tot = 0, id;
  for (var i = 0; i < ALL.length; i++) { id = ALL[i]; var r = cu.order[id] || 0, m = T.items[id] || 0; miss += Math.abs(r - m); tot += r; }
  var base = Math.max(0, 1 - miss / tot), tq = T.tort.p <= 1.0 ? 1 : 0.85, sc = base * tq;
  var stars = (miss === 0 && tq === 1) ? 5 : sc >= 0.8 ? 4 : sc >= 0.6 ? 3 : sc >= 0.3 ? 2 : 1;
  var price = Math.round((6 + 3 * tot) * (1 + G.stop * 0.07)), pay = Math.round(price * [0, 0.15, 0.4, 0.7, 0.9, 1][stars]);
  var tip = stars >= 4 ? Math.round(price * 0.5 * cu.pat * (1 + 0.3 * S.up.tip)) : 0, mul = G.fiesta > 0 ? 2 : 1;
  return { stars: stars, pay: pay * mul, tip: tip * mul };
}
function serve(cu) {
  /* 접시가 둘이면 이 손님 주문에 더 가까운 접시를 건넨다 */
  var T = G.tray, O2 = nTray() > 1 ? G.trays[1 - G.ti] : null;
  function off(t) { var m = 0; for (var k = 0; k < ALL.length; k++) m += Math.abs((cu.order[ALL[k]] || 0) - (t.items[ALL[k]] || 0)); return m; }
  if (O2 && O2.tort && (!T.tort || off(O2) < off(T))) T = O2;
  if (!T.tort || cu.state !== 'wait') return false;
  cu.res = judge(cu, T); cu.state = 'take'; cu.t = 0;
  G.serve.push({ items: T.items, done: T.tort.p, seed: T.seed, cu: cu, t: 0, from: trayGeo(T.i) });
  G.fly = G.fly.filter(function (f) { return f.T !== T; }); setTray(T.i, newTray(T.i)); if (G.sauceAnim && G.sauceAnim.T === T) G.sauceAnim = null; SND.play('whoosh');
  if (nTray() > 1 && G.trays[1 - T.i].tort) pickTray(1 - T.i); else pickTray(T.i);
  return true;
}
function tapPin() {
  if (G.gauge < G.need) { SND.play('nope'); return; }
  G.gauge = 0; G.pin = { th: 0.5, om: 0, hits: 0, need: 7, t: 0, out: 0, flash: 0 }; SND.play('bell');
}
function hitPin(x) {
  var pn = G.pin; if (!pn || pn.out) return;
  pn.hits++; pn.om += (x < 360 ? 1 : -1) * (3.2 + Math.random()); pn.flash = 0.12;
  var px = 360 + Math.sin(pn.th) * 330, py = H * 0.16 + Math.cos(pn.th) * 330;
  burst(px, py, 14, { k: 'conf', v: 420, up: 150, cols: A.PCOL, s: 12, max: 1.0 }); SND.play('hit');
  if (pn.hits >= pn.need) {
    pn.out = 0.01; SND.play('boom'); burst(px, py, 70, { k: 'conf', v: 700, up: 250, cols: A.PCOL, s: 14, max: 1.6 });
    var val = Math.round(3 * (1 + G.stop * 0.2));
    for (var i = 0; i < 16; i++) { var a = Math.random() * TAU, v = 250 + Math.random() * 450; G.coins.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 350, phys: 1.0 + i * 0.04, t: 0, dur: 0.5, val: val, x1: 0, y1: 0 }); }
  }
}

/* ---------- 다음에 누를 것(첫 판 길잡이, 시험용 자동 플레이) ---------- */
function nextAction(bot) {
  if (!G || G.mode !== 'play') return null;
  if (G.pin) return bot && !G.pin.out ? { t: 'hit' } : null;
  if (bot && G.gauge >= G.need) return { t: 'pin' };
  var cu = null, i, T = G.tray, wait = 0, torts = (G.trays[0].tort ? 1 : 0) + (nTray() > 1 && G.trays[1].tort ? 1 : 0);
  function fits(q) { for (var k = 0; k < ALL.length; k++) if ((T.items[ALL[k]] || 0) > (q.order[ALL[k]] || 0)) return false; return true; }
  for (i = 0; i < 3; i++) { var q = G.cust[i]; if (q && (q.state === 'wait' || q.state === 'in')) { wait++; if (q.state === 'wait' && (!cu || (fits(q) && !fits(cu)) || (fits(q) === fits(cu) && q.pat * q.patT < cu.pat * cu.patT))) cu = q; } }
  for (i = 0; i < nComal(); i++) { if (G.comal[i]) { if (G.comal[i].p >= 1.3) return { t: 'comal', i: i }; torts++; } }
  if (T.tort && cu) {
    var id, need = null, extra = false, rem = 0;
    for (i = 0; i < ALL.length; i++) { id = ALL[i]; var r = cu.order[id] || 0, m = T.items[id] || 0; if (m > r) extra = true; if (m < r) { rem += r - m; if (!need) need = id; } }
    if (extra) return { t: 'trash' };
    if (bot && rem === 1 && freeComal() >= 0 && wait > torts) return { t: 'stack' };
    if (need) return (A.ING[need].kind === 'sauce' && G.sauceAnim) ? null : { t: 'item', id: need };
    return { t: 'cust', i: cu.slot };
  }
  if (!T.tort) for (i = 0; i < nComal(); i++) if (G.comal[i] && G.comal[i].p >= (bot ? 0.56 : 0.5)) return { t: 'comal', i: i };
  if (freeComal() >= 0 && torts === 0) return { t: 'stack' };
  return null;
}
function doAction(a) {
  if (!a) return;
  if (a.t === 'stack') tapStack(); else if (a.t === 'comal') tapComal(a.i); else if (a.t === 'item') tapItem(a.id); else if (a.t === 'trash') tapTrash();
  else if (a.t === 'cust') serve(G.cust[a.i]); else if (a.t === 'pin') tapPin(); else if (a.t === 'hit') hitPin(Math.random() * 720);
}

/* ---------- 진행 ---------- */
function react(cu) {
  var r = cu.res, x = P.slots[cu.slot], s = r.stars;
  cu.state = 'react'; cu.t = 0; cu.taco = null; delete cache['eat' + cu.slot + '_1']; delete cache['eat' + cu.slot + '_2']; delete cache['eat' + cu.slot + '_3']; delete cache['eat' + cu.slot + '_0'];
  cu.mood = s >= 4 ? 'yum' : s === 3 ? 'happy' : s === 2 ? 'meh' : 'yuck';
  G.served++; G.starSum += s; if (s === 5) G.perfect++;
  coinsTo(x, LY - 150, r.pay + r.tip);
  text(x, LY + 30, '+' + (r.pay + r.tip), '#ffd034', 42, 1.1);
  if (s === 5) { text(x, LY - 290, 'PERFECT', '#ffe04a', 46, 1.3); burst(x, LY - 200, 16, { k: 'star', v: 300, up: 120, col: '#ffd034', s: 13, max: 0.9 }); }
  else if (s === 4) { text(x, LY - 290, 'GREAT', '#8af06a', 44, 1.2); burst(x, LY - 200, 8, { k: 'star', v: 240, up: 100, col: '#ffd034', s: 11, max: 0.8 }); }
  else if (s === 3) text(x, LY - 290, 'NICE', '#7fe0f0', 42, 1.1);
  SND.play(s === 5 ? 'perfect' : s === 4 ? 'great' : s === 3 ? 'nice' : s === 2 ? 'meh' : 'yuck');
  var g0 = G.gauge; G.gauge = Math.min(G.need, G.gauge + (s === 5 ? 2 : s === 4 ? 1 : 0));
  if (g0 < G.need && G.gauge >= G.need) SND.play('ready');
}
function step(dt) {
  clock += dt;
  if (!G) return;
  G.t += dt;
  if (G.mode === 'map') { if (G.mapP < S.stop) G.mapP = Math.min(S.stop, G.mapP + dt * 0.6); return; }
  var i, p, st = STOPS[G.stop];
  /* 조각·글자·동전은 늘 움직인다 */
  for (i = G.parts.length - 1; i >= 0; i--) { p = G.parts[i]; p.life += dt; if (p.life >= p.max) { G.parts.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.k === 'smoke') p.s += 30 * dt; }
  for (i = G.texts.length - 1; i >= 0; i--) { p = G.texts[i]; p.t += dt; if (p.t >= p.max) G.texts.splice(i, 1); }
  for (i = G.coins.length - 1; i >= 0; i--) {
    p = G.coins[i];
    if (p.phys > 0) { p.vy += 1700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; var fl = H * 0.8; if (p.y > fl) { p.y = fl; p.vy *= -0.45; p.vx *= 0.7; } if (p.x < 20 || p.x > 700) { p.vx *= -0.6; p.x = Math.max(20, Math.min(700, p.x)); } p.phys -= dt; if (p.phys <= 0) { var tg = coinTarget(); p.x1 = tg[0]; p.y1 = tg[1]; p.sx = p.x; p.sy = p.y; p.t = 0; } continue; }
    p.t += dt; if (p.t < 0) continue; if (p.sx == null) { p.sx = p.x; p.sy = p.y; }
    var u = p.t / p.dur;
    if (u >= 1) { S.coins += p.val; G.earned += p.val; G.coins.splice(i, 1); SND.play('coin'); hud(1); }
    else { p.x = p.sx + (p.x1 - p.sx) * u * u; p.y = p.sy + (p.y1 - p.sy) * u * u - Math.sin(u * Math.PI) * 70; }
  }
  if (G.mode === 'end') { G.endT += dt; if (G.endT > 0.5) { G.endT = 0; burst(80 + Math.random() * 560, 140 + Math.random() * 200, 26, { k: 'conf', v: 380, up: 60, cols: A.PCOL, s: 11, max: 1.5, g: 400 }); } return; }
  if (G.mode !== 'play') return;
  var pn = G.pin;
  if (pn) {
    pn.t += dt; pn.flash = Math.max(0, pn.flash - dt); pn.om += (-9 * Math.sin(pn.th) - 0.9 * pn.om) * dt; pn.th += pn.om * dt;
    if (pn.out) { pn.out += dt; if (pn.out > 2.3 && !G.coins.length) { G.pin = null; G.fiesta = 12; SND.fiesta(1); text(360, LY - 120, 'FIESTA', '#ffd034', 96, 1.8); } }
    SND.sizzle(0); return;
  }
  if (G.banner > 0) G.banner -= dt;
  if (G.fiesta > 0) { G.fiesta -= dt; if (G.fiesta <= 0) SND.fiesta(0); if (Math.random() < dt * 14) part('conf', Math.random() * W, 100, { vy: 160 + Math.random() * 120, vx: (Math.random() - 0.5) * 60, g: 60, max: 2.2, s: 9, col: A.PCOL[(Math.random() * 6) | 0], vr: (Math.random() - 0.5) * 10 }); }
  if (G.shakeTray > 0) G.shakeTray -= dt; if (G.shakeStack > 0) G.shakeStack -= dt;
  for (var b in binPop) if (binPop[b] > 0) binPop[b] -= dt;
  /* 화구 */
  var rate = 0.26 * (1 + 0.22 * S.up.fire), siz = false, tt;
  for (i = 0; i < 2; i++) {
    tt = G.comal[i]; if (!tt) continue; siz = true; tt.inT += dt; tt.wob = Math.max(0, tt.wob - dt);
    var p0 = tt.p; tt.p = Math.min(1.6, tt.p + dt * rate * (tt.p < 0.5 ? 1 : 0.5));
    if (p0 < 0.5 && tt.p >= 0.5) { SND.play('ding'); burst(P.comal[i][0], P.comal[i][1] - 10, 7, { k: 'star', v: 170, up: 60, col: '#fff6b0', s: 9, max: 0.6, g: 200 }); }
    if (p0 < 1.3 && tt.p >= 1.3) SND.play('burn');
    if (tt.p > 1.12 && Math.random() < dt * (tt.p > 1.3 ? 9 : 4)) part('smoke', P.comal[i][0] + (Math.random() - 0.5) * 60, P.comal[i][1] - 10, { vy: -70, vx: (Math.random() - 0.5) * 30, max: 1.0, s: 12, col: tt.p > 1.3 ? '#2a201c' : '#8a7a70' });
  }
  SND.sizzle(siz ? 1 : 0);
  for (var ti = 0; ti < 2; ti++) { var T = G.trays[ti]; if (T.tort) T.tort.inT += dt; for (i = 0; i < T.pcs.length; i++) if (T.pcs[i].pop > 0) T.pcs[i].pop -= dt; }
  var sa = G.sauceAnim; if (sa) { sa.t += dt; sa.line.prog = Math.max(0, Math.min(1, (sa.t - 0.18) / 0.4)); if (sa.t > 0.76) G.sauceAnim = null; }
  for (i = G.fly.length - 1; i >= 0; i--) { p = G.fly[i]; p.t += dt; if (p.t >= p.dur) { p.T.pcs.push({ id: p.id, x: p.x1, y: p.y1, rot: p.rot, v: p.v, pop: 0.14 }); G.fly.splice(i, 1); } }
  for (i = G.serve.length - 1; i >= 0; i--) { p = G.serve[i]; p.t += dt; if (p.t >= 0.32) { p.cu.state = 'eat'; p.cu.t = 0; p.cu.taco = p; p.cu.bites = 0; G.serve.splice(i, 1); } }
  /* 손님: 맨 먼저 온 손님만 제 속도로 지치고, 뒤 손님은 절반 속도 */
  var first = 1e9; for (i = 0; i < 3; i++) if (G.cust[i] && G.cust[i].state === 'wait' && G.cust[i].no < first) first = G.cust[i].no;
  for (i = 0; i < 3; i++) {
    var cu = G.cust[i]; if (!cu) continue; cu.t += dt;
    if (cu.state === 'in') { if (cu.t > 0.45) { cu.state = 'wait'; cu.t = 0; } }
    else if (cu.state === 'wait') {
      if (G.fiesta <= 0) cu.pat -= dt / cu.patT * (cu.no === first ? 1 : 0.5);
      cu.mood = cu.pat > 0.5 ? 'happy' : cu.pat > 0.22 ? 'meh' : 'angry';
      if (cu.pat <= 0) { cu.state = 'leave'; cu.t = 0; cu.mood = 'angry'; G.hearts--; G.lost++; hud(); SND.play('angry'); burst(P.slots[i], LY - 130, 10, { k: 'smoke', v: 90, g: -60, max: 0.7, s: 20, col: '#b9b0b0' }); }
    }
    else if (cu.state === 'take') cu.mood = 'yum';
    else if (cu.state === 'eat') {
      cu.mood = 'eat'; var bt = cu.t > 0.75 ? 3 : cu.t > 0.45 ? 2 : cu.t > 0.15 ? 1 : 0;
      if (bt > cu.bites) { cu.bites = bt; SND.play('crunch'); burst(P.slots[i] + 20, LY - 80, 7, { k: 'crumb', v: 150, up: 80, col: A.tortillaCol(cu.taco.done), s: 6, max: 0.5 }); }
      if (cu.t > 1.05) react(cu);
    }
    else if (cu.state === 'react') { if (cu.t > 1.15) { cu.state = 'out'; cu.t = 0; } }
    else if (cu.state === 'out' || cu.state === 'leave') { if (cu.t > 0.42) G.cust[i] = null; }
  }
  /* 새 손님 */
  G.spawnT -= dt;
  if (G.spawnT <= 0 && G.left > 0 && active() < st.max && G.hearts > 0) {
    var free = []; for (i = 0; i < 3; i++) if (!G.cust[i]) free.push(i);
    var sl = st.max === 1 ? 1 : free[Math.floor(G.R() * free.length)];
    spawn(sl); G.spawnT = active() <= 1 ? 2.2 : active() === 2 ? 5 : 6.5;
  }
  if (G.hearts <= 0) { G.endT += dt; if (G.endT > 1.0) gameOver(); }
  else if (G.left === 0 && active() === 0 && !G.coins.length) { G.endT += dt; if (G.endT > 0.7) clearStop(); }
}
function clearStop() {
  var avg = G.starSum / Math.max(1, G.served), s3 = (G.lost === 0 && avg >= 4.3) ? 3 : (G.lost <= 1 && avg >= 3.3) ? 2 : 1, last = G.stop >= 11;
  S.stars[G.stop] = Math.max(S.stars[G.stop] || 0, s3); S.total += G.served;
  if (last) S.done = true; else S.stop = G.stop + 1; save();
  G.mode = 'clear'; G.s3 = s3; SND.sizzle(0); SND.fiesta(0); SND.play('clear'); showClear(s3, last);
}
function gameOver() { while (G.coins.length) S.coins += G.coins.pop().val; save(); hud(); G.mode = 'over'; SND.sizzle(0); SND.fiesta(0); SND.play('over'); ui('over'); }
function goMap(fromClear) { G = { mode: 'map', t: 0, mapP: fromClear ? Math.max(0, S.stop - 1) : S.stop, parts: [], texts: [], coins: [] }; buildShop(); placeMap(); ui('map'); SND.music(1); if (fromClear) SND.play('truck'); }
function goTitle() { G = { mode: 'title', t: 0, parts: [], texts: [], coins: [] }; titleButtons(); ui('title'); }
function goEnd() {
  startStop(11, 7); G.mode = 'end'; G.banner = 0; G.left = 0; G.endT = 0;
  ['kgirl', 'mexman', 'granny'].forEach(function (sp, i) { G.cust[i] = { sp: sp, acc: 0, seed: i * 3, slot: i, state: 'party', t: 0, pat: 1, order: {}, list: [], mood: 'yum' }; });
  ui('end'); SND.play('clear');
}

/* ---------- 그리기 ---------- */
var bgCv = null, bgKey = '';
function bgSprite(st) {
  var k = st + '|' + SS.toFixed(3) + '|' + (BG.ANIM[st] ? Math.floor(clock * 10) : 0);
  if (k !== bgKey) {
    if (!bgCv || bgCv.width !== Math.ceil(W * SS)) bgCv = A.mk(Math.ceil(W * SS), Math.ceil(480 * SS));
    var x = bgCv.getContext('2d'); x.setTransform(SS, 0, 0, SS, 0, 0); BG.scene(x, st, W, 480, clock); bgCv._w = W; bgCv._h = 480; bgKey = k;
  }
  return bgCv;
}
function workSprite() {
  return sprite('work' + G.stop, W, H - LY + 10, function (x) {
    BG.ledge(x, W, 10); BG.counter(x, W, 58, H - LY + 10);
    A.BINS.forEach(function (id) { var b = binPos(id); x.save(); x.translate(b[0], b[1] - LY + 10); A.bin(x, id, 172, 118, G.un.indexOf(id) < 0); x.restore(); });
  });
}
function otext(s, x, y, size, fill, stroke, lw) { c.font = size + 'px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = stroke || '#4a2412'; c.lineWidth = lw || size * 0.2; c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y); }
function drawBubble(cu) {
  var x = P.slots[cu.slot], n = cu.list.length, cols = Math.min(3, n), rows = Math.ceil(n / 3), cell = 62, bw = Math.max(150, cols * cell + 26), bh = rows * cell + 30, by = 244 - bh, bx = Math.max(5, Math.min(W - 5 - bw, x - bw / 2));
  var k = cu.state === 'in' ? back(cu.t / 0.45) : 1, T = G.tray, i;
  c.save(); c.translate(x, 244); c.scale(k, k); c.translate(-x, -244);
  c.fillStyle = 'rgba(40,20,10,.25)'; A.rr(c, bx + 3, by + 5, bw, bh, 22); c.fill();
  c.beginPath(); c.moveTo(x - 14, by + bh - 2); c.lineTo(x, by + bh + 18); c.lineTo(x + 14, by + bh - 2); c.closePath(); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#4a2412'; c.lineWidth = 3.5; c.lineJoin = 'round'; c.stroke();
  A.rr(c, bx, by, bw, bh, 22); c.fillStyle = '#fffaf0'; c.fill(); c.stroke();
  c.fillStyle = '#fffaf0'; c.fillRect(x - 11, by + bh - 6, 22, 8);
  for (i = 0; i < n; i++) {
    var id = cu.list[i], row = Math.floor(i / 3), inRow = row === rows - 1 ? n - row * 3 : 3, ix = bx + bw / 2 + ((i % 3) - (inRow - 1) / 2) * cell, iy = by + 8 + row * cell + cell / 2, cnt = cu.order[id], have = T.items[id] || 0;
    blit(iconSpr(id), ix - 32, iy - 32);
    if (cnt > 1) { A.ell(c, ix + 20, iy + 18, 14, 14, 0); c.fillStyle = '#e0281e'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); c.fillStyle = '#fff'; c.font = '20px ' + FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('2', ix + 20, iy + 19); }
    if (T.tort && have >= cnt && cu.state === 'wait') { A.ell(c, ix + 20, iy - 18, 13, 13, 0); c.fillStyle = '#3fae3c'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(ix + 14, iy - 18); c.lineTo(ix + 18, iy - 13); c.lineTo(ix + 26, iy - 23); c.stroke(); }
  }
  var pw = bw - 28, pc = Math.max(0, cu.pat);
  A.rr(c, bx + 14, by + bh - 20, pw, 10, 5); c.fillStyle = '#e6d8c0'; c.fill();
  if (pc > 0.02) { A.rr(c, bx + 14, by + bh - 20, pw * pc, 10, 5); c.fillStyle = G.fiesta > 0 ? '#ffb81f' : pc > 0.5 ? '#4fc04a' : pc > 0.22 ? '#f2b01e' : '#e0281e'; c.fill(); }
  c.restore();
}
function eatSpr(cu) {
  var tk = cu.taco, b = cu.bites;
  return sprite('eat' + cu.slot + '_' + b, 130, 110, function (x) {
    x.translate(62, 70); A.tacoFull(x, 44);
    x.globalCompositeOperation = 'destination-out';
    for (var j = 0; j < b; j++) { A.ell(x, 50 - j * 30, -22 + j * 4, 25, 30, 0); x.fill(); A.ell(x, 44 - j * 30, 14, 20, 24, 0); x.fill(); }
  });
}
function drawPlay() {
  var i, st = G.stop, T, tx, ty, ti, tg, shk = G.shakeTray > 0 ? Math.sin(G.shakeTray * 60) * 7 : 0;
  blit(bgSprite(st), 0, 0);
  /* 손님 */
  for (i = 0; i < 3; i++) {
    var cu = G.cust[i]; if (!cu) continue;
    var off = cu.state === 'in' ? (1 - back(cu.t / 0.45)) * 300 : (cu.state === 'out' || cu.state === 'leave') ? ease(cu.t / 0.42) * 300 : 0, hop = cu.state === 'react' && cu.mood === 'yum' ? Math.abs(Math.sin(cu.t * 9)) * 12 * Math.max(0, 1 - cu.t) : cu.state === 'party' ? Math.abs(Math.sin(clock * 5 + i * 1.3)) * 14 : 0;
    c.save(); c.translate(P.slots[i], LY + off - hop + 8); A.customer(c, cu.sp, { mood: cu.mood, t: clock, seed: cu.seed, acc: cu.acc }); c.restore();
    if (cu.state === 'eat' && cu.taco) blit(eatSpr(cu), P.slots[i] - 62 + 6, LY - 62 - 66);
  }
  blit(sprite('awn', W, 112, function (x) { BG.awning(x, W); }), 0, 0);
  if (G.fiesta > 0) { for (i = 0; i < 12; i++) { c.fillStyle = A.PCOL[(i + Math.floor(clock * 6)) % 6]; c.fillRect(i * 60, 100, 60 * Math.min(1, Math.max(0, G.fiesta / 12 * 12 - i)), 9); } }
  blit(workSprite(), 0, LY - 10);
  /* 진행 막대 */
  if (G.mode !== 'end') { var tot = STOPS[st].n, dn = tot - G.left - active(); c.fillStyle = 'rgba(74,36,18,.28)'; A.rr(c, 12, LY + 3, W - 24, 8, 4); c.fill(); if (dn > 0) { c.fillStyle = '#4fc04a'; A.rr(c, 12, LY + 3, (W - 24) * dn / tot, 8, 4); c.fill(); } }
  for (i = 0; i < 3; i++) if (G.cust[i] && (G.cust[i].state === 'wait' || G.cust[i].state === 'in')) drawBubble(G.cust[i]);
  for (i = 0; i < 3; i++) { var q = G.cust[i]; if (q && q.state === 'react' && q.res) for (var s = 0; s < q.res.stars; s++) { var sk = back((q.t - s * 0.07) / 0.25); if (sk > 0) A.star(c, P.slots[i] + (s - (q.res.stars - 1) / 2) * 38, LY - 246, 17 * sk, '#ffd034', '#8a5600'); } }
  /* 화구 */
  for (i = 0; i < 2; i++) {
    var cx = P.comal[i][0], cy = P.comal[i][1], tt = G.comal[i];
    c.save(); c.translate(cx, cy); A.comal(c, 60, !!tt, i >= nComal(), clock);
    if (tt) { var k2 = back(tt.inT / 0.2); c.save(); c.rotate(tt.wob > 0 ? Math.sin(tt.wob * 50) * 0.12 : 0); A.tortilla(c, 55 * k2, tt.p, tt.seed); c.restore();
      var gw = 124, gx = -62, gy = 61; A.rr(c, gx - 3, gy - 3, gw + 6, 17, 8); c.fillStyle = '#4a2412'; c.fill();
      c.fillStyle = '#d8cdbd'; c.fillRect(gx, gy, gw * 0.385, 11); c.fillStyle = '#4fc04a'; c.fillRect(gx + gw * 0.385, gy, gw * 0.385, 11); c.fillStyle = '#f2901e'; c.fillRect(gx + gw * 0.77, gy, gw * 0.23, 11);
      var mx = gx + gw * Math.min(1, tt.p / 1.3); c.fillStyle = '#fff'; c.strokeStyle = '#4a2412'; c.lineWidth = 3; A.rr(c, mx - 5, gy - 6, 10, 23, 4); c.fill(); c.stroke(); }
    c.restore();
  }
  c.save(); c.translate(P.stack[0] + (G.shakeStack > 0 ? Math.sin(G.shakeStack * 60) * 6 : 0), P.stack[1]); blit(sprite('stack', 150, 130, function (x) { x.translate(75, 72); A.stack(x, 58); }), -75, -72); c.restore();
  blit(sprite('trash', 80, 90, function (x) { x.translate(40, 48); A.trash(x, 62); }), P.trash[0] - 40, P.trash[1] - 48);
  /* 접시 */
  for (ti = 0; ti < nTray(); ti++) {
    T = G.trays[ti]; tg = trayGeo(ti); tx = tg[0] + (ti === G.ti ? shk : 0); ty = tg[1];
    var TR = tg[2], tk = tg[3];
    blit(sprite('tray' + TR, 350, 320, function (x) { x.translate(175, 150); A.tray(x, TR); }), tx - 175, ty - 150);
    if (nTray() > 1 && ti === G.ti && G.mode === 'play') { c.lineWidth = 9; c.strokeStyle = 'rgba(74,36,18,.7)'; A.ell(c, tx, ty, TR * 1.36, TR * 1.36 * 0.86, 0); c.stroke(); c.lineWidth = 5; c.strokeStyle = '#fff36a'; c.stroke(); }
    if (T.tort) {
      var u = ease(T.tort.inT / 0.22), ttx = T.tort.fx + (tx - T.tort.fx) * u, tty = T.tort.fy + (ty - T.tort.fy) * u - Math.sin(u * Math.PI) * 50;
      c.save(); c.translate(ttx, tty); c.scale(tk, tk); A.tortilla(c, 55 / tk * (1 - u) + 118 * u, T.tort.p, T.tort.seed);
      for (i = 0; i < T.pcs.length; i++) { var pc = T.pcs[i], ps = 1 + Math.max(0, pc.pop) * 2.2; c.save(); c.translate(pc.x, pc.y); c.rotate(pc.rot); c.scale(ps, ps); A.piece(c, pc.id, A.ING[pc.id].s * 1.4, pc.v); c.restore(); }
      for (i = 0; i < T.sauces.length; i++) if (T.sauces[i].prog > 0) A.sauceLine(c, T.sauces[i].id, 118, T.sauces[i].k, T.sauces[i].prog, 0.86);
      c.restore();
    }
  }
  /* 소스 병 */
  for (i = 0; i < 3; i++) {
    var sid = A.SAUCES[i]; if (G.un.indexOf(sid) < 0) continue;
    var bs = sprite('bot_' + sid, 70, 150, function (x) { x.translate(35, 146); A.bottle(x, sid, 126); }), sa = G.sauceAnim;
    if (sa && sa.id === sid) {
      var a = sa.t, m = a < 0.18 ? ease(a / 0.18) : a < 0.58 ? 1 : 1 - ease((a - 0.58) / 0.18), sw = Math.max(0, Math.min(1, (a - 0.18) / 0.4));
      tg = trayGeo(sa.T.i);
      var bx = P.sauce[i][0] + (tg[0] + (-74 + sw * 148) * tg[3] - P.sauce[i][0]) * m, by = P.sauce[i][1] - 70 + (tg[1] - 96 * tg[3] - (P.sauce[i][1] - 70)) * m;
      c.save(); c.translate(bx, by); c.rotate(m * 2.5); c.drawImage(bs, -35, -76, 70, 150); c.restore();
    } else blit(bs, P.sauce[i][0] - 35, P.sauce[i][1] - 146);
  }
  /* 피냐타 게이지 */
  if (G.mode !== 'end') {
    var full = G.gauge >= G.need, px = P.pin[0], py = P.pin[1];
    c.strokeStyle = '#4a2412'; c.lineWidth = 3; c.beginPath(); c.moveTo(px + 8, LY + 50); c.lineTo(px + 8, py - 20); c.stroke();
    c.save(); c.translate(px, py);
    if (full) { c.fillStyle = A.rg(c, 0, 0, 10, 80, [0, 'rgba(255,230,90,.85)', 1, 'rgba(255,230,90,0)']); c.fillRect(-80, -80, 160, 160); c.rotate(Math.sin(clock * 9) * 0.14); var ks = 1 + Math.sin(clock * 7) * 0.07; c.scale(ks, ks); }
    var gk = G.gauge; blit(sprite('pin' + gk + '_' + G.need, 150, 150, function (x) { x.translate(75, 84); A.pinata(x, 92, gk / G.need); }), -75, -84); c.restore();
  }
  /* 통 누름 반짝 */
  for (var bid in binPop) if (binPop[bid] > 0 && A.BINS.indexOf(bid) >= 0) { var bp = binPos(bid); c.fillStyle = 'rgba(255,255,255,' + (binPop[bid] * 3) + ')'; A.rr(c, bp[0] + 2, bp[1] + 2, 166, 110, 16); c.fill(); }
  /* 날아가는 조각 */
  for (i = 0; i < G.fly.length; i++) { var f = G.fly[i]; if (f.t < 0) continue; var fu = f.t / f.dur; tg = trayGeo(f.T.i); c.save(); c.translate(f.x0 + (tg[0] + f.x1 * tg[3] - f.x0) * fu, f.y0 + (tg[1] + f.y1 * tg[3] - f.y0) * fu - Math.sin(fu * Math.PI) * 130); c.rotate(f.rot + (1 - fu) * 5); c.scale(1.5, 1.5); A.piece(c, f.id, A.ING[f.id].s, f.v); c.restore(); }
  for (i = 0; i < G.serve.length; i++) { var sv = G.serve[i], su = ease(sv.t / 0.32); c.save(); c.translate(sv.from[0] + (P.slots[sv.cu.slot] - sv.from[0]) * su, sv.from[1] + (LY - 70 - sv.from[1]) * su - Math.sin(su * Math.PI) * 60); A.taco(c, 110 - 64 * su, sv.done, sv.items, sv.seed); c.restore(); }
  /* 길잡이 */
  if (G.hint && G.mode === 'play' && !G.pin) { var na = nextAction(false); if (na) { var hp = na.t === 'stack' ? [P.stack[0], P.stack[1], 70] : na.t === 'comal' ? [P.comal[na.i][0], P.comal[na.i][1], 78] : na.t === 'trash' ? [P.trash[0], P.trash[1], 52] : na.t === 'cust' ? [P.slots[na.i], LY - 100, 100] : A.ING[na.id].kind === 'sauce' ? [srcPos(na.id)[0], srcPos(na.id)[1], 70] : [srcPos(na.id)[0], srcPos(na.id)[1], 84];
    var hr = hp[2] + Math.sin(clock * 7) * 7; c.lineWidth = 11; c.strokeStyle = 'rgba(74,36,18,.75)'; A.ell(c, hp[0], hp[1], hr, hr * 0.86, 0); c.stroke(); c.lineWidth = 6; c.strokeStyle = '#fff36a'; c.stroke(); } }
  drawFx();
  if (G.pin) drawPin();
  if (G.banner > 0 && G.mode === 'play') { var bu = G.banner > 1.7 ? back((2 - G.banner) / 0.3) : G.banner < 0.3 ? G.banner / 0.3 : 1; c.save(); c.globalAlpha = Math.min(1, bu); c.translate(360, M0 + 150); c.scale(bu, bu); c.rotate(-0.04);
    A.rr(c, -300, -92, 600, 184, 20); c.fillStyle = A.lg(c, 0, -92, 0, 92, [0, '#fbe6b4', 1, '#e2b46c']); c.fill(); c.strokeStyle = '#4a2412'; c.lineWidth = 6; c.stroke();
    otext('DAY ' + (st + 1), 0, -34, 66, '#ff7a3a', '#4a2412'); otext(L(TX.stops[st]), 0, 40, 50, '#fff6dc', '#4a2412'); c.restore(); }
}
function drawFx() {
  var i, p;
  for (i = 0; i < G.parts.length; i++) { p = G.parts[i]; var k = 1 - p.life / p.max; c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
    if (p.k === 'conf') { c.globalAlpha = Math.min(1, k * 3); c.fillStyle = p.col; c.fillRect(-p.s / 2, -p.s * 0.3, p.s, p.s * 0.6); }
    else if (p.k === 'smoke') { c.globalAlpha = k * 0.5; c.fillStyle = p.col; A.ell(c, 0, 0, p.s, p.s, 0); c.fill(); }
    else if (p.k === 'star') { c.globalAlpha = Math.min(1, k * 2.5); A.star(c, 0, 0, p.s, p.col, '#8a5600'); }
    else { c.globalAlpha = Math.min(1, k * 3); c.fillStyle = p.col; A.ell(c, 0, 0, p.s * 0.5, p.s * 0.4, 0); c.fill(); }
    c.restore(); }
  c.globalAlpha = 1;
  var cs = sprite('coin', 44, 46, function (x) { x.translate(22, 21); A.coin(x, 18); });
  for (i = 0; i < G.coins.length; i++) { p = G.coins[i]; if (p.t < 0) continue; blit(cs, p.x - 22, p.y - 21); }
  for (i = 0; i < G.texts.length; i++) { p = G.texts[i]; var u = p.t / p.max, sc = back(p.t / 0.22); c.save(); c.globalAlpha = u > 0.75 ? (1 - u) * 4 : 1; c.font = p.size + 'px ' + FONT; var tw = c.measureText(p.s).width / 2 + 16; c.translate(Math.max(tw, Math.min(W - tw, p.x)), p.y - u * 46); c.scale(sc, sc); otext(p.s, 0, 0, p.size, p.col); c.restore(); }
}
function drawPin() {
  var pn = G.pin, piv = H * 0.16, Lr = 330;
  c.fillStyle = 'rgba(24,8,32,.6)'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(360, piv); c.rotate(-pn.th);
  c.strokeStyle = '#e8d8b0'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -piv - 20); c.lineTo(0, Lr - 150); c.stroke();
  if (!pn.out) { c.translate(0, Lr); var ks = 1 + pn.flash * 1.6; c.scale(ks, ks); var bs = sprite('pinbig', 460, 460, function (x) { x.translate(230, 250); A.pinata(x, 290, 1); }); c.drawImage(bs, -230, -250, 460, 460); if (pn.flash > 0) { c.globalAlpha = pn.flash * 4; c.fillStyle = '#fff'; A.ell(c, 0, 0, 150, 150, 0); c.fill(); c.globalAlpha = 1; } }
  c.restore();
  if (!pn.out) for (var i = 0; i < pn.need; i++) { A.star(c, 360 + (i - (pn.need - 1) / 2) * 52, H * 0.16 + Lr + 250, 20, i < pn.hits ? '#ffd034' : 'rgba(255,255,255,.25)', i < pn.hits ? '#8a5600' : null); }
  drawFx();
}
function drawTitle() {
  var off = H * 0.5 - 320, ry = off + 430;
  c.fillStyle = '#62c0ee'; c.fillRect(0, 0, W, off + 70);
  c.save(); c.translate(0, off); blit(bgSprite(0), 0, 0); c.restore();
  c.fillStyle = A.lg(c, 0, off + 470, 0, H, [0, '#e2aa62', 1, '#c98a48']); c.fillRect(0, off + 470, W, H - off - 470);
  c.fillStyle = A.lg(c, 0, ry, 0, ry + 130, [0, '#7a6a62', 1, '#5a4c46']); c.fillRect(0, ry, W, 130);
  c.fillStyle = '#f6e2b0'; c.fillRect(0, ry, W, 7); c.fillRect(0, ry + 123, W, 7);
  c.fillStyle = '#ffd86a'; for (var i = 0; i < 8; i++) c.fillRect(((i * 110 - clock * 0) % 880) - 20, ry + 60, 62, 9);
  BG.papel(c, -10, off + 96, W + 10, off + 96, 13, 46, clock);
  c.save(); c.translate(360, ry + 100); BG.truck(c, 540, clock, 0); c.restore();
}
function draw() {
  if (!A.SPR.ok || cv.width < 8) return;
  c.setTransform(SS, 0, 0, SS, 0, 0);
  if (!G || G.mode === 'title') drawTitle();
  else if (G.mode === 'map') BG.map(c, W, H, S.stop, G.mapP, clock, FONT);
  else drawPlay();
}

/* ---------- 화면(DOM) ---------- */
var SCR = ['title', 'mapScr', 'clear', 'over', 'end', 'confirm'], shown = 0;
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
  hc.width = n * 44; hc.height = 44; hc.style.width = n * 22 + 'px';
  for (var i = 0; i < n; i++) { x.save(); x.translate(22 + i * 44, 23); A.heart(x, 17, G && i < G.hearts); x.restore(); }
}
function titleButtons() {
  var has = (S.stop > 0 || S.coins > 0 || S.total > 0) && !S.done;
  $('bStart').hidden = has; $('bCont').hidden = !has; $('bNew').hidden = !has;
}
function showClear(s3, last) {
  var x = $('cstars').getContext('2d'), i; x.clearRect(0, 0, 360, 130);
  for (i = 0; i < 3; i++) A.star(x, 70 + i * 110, 70 - (i === 1 ? 12 : 0), i === 1 ? 54 : 46, i < s3 ? '#ffd034' : '#cdb48c', i < s3 ? '#8a5600' : '#a88a5c');
  $('cearn').textContent = '+' + G.earned;
  var nw = last ? [] : STOPS[G.stop + 1].unlock.slice(), sp = null, box = $('cnew'), cvs = $('cnewC'), y = cvs.getContext('2d');
  box.hidden = !nw.length && !sp;
  if (!box.hidden) {
    var n = nw.length + (sp ? 1 : 0); cvs.width = n * 150; cvs.height = 150; cvs.style.width = 'calc(var(--u) * ' + n * 112 + ')';
    nw.forEach(function (id, k) { y.save(); y.translate(75 + k * 150, 78); A.icon(y, id, 56); y.restore(); });
    if (sp) { y.save(); y.beginPath(); y.rect(nw.length * 150, 0, 150, 146); y.clip(); y.translate(nw.length * 150 + 75, 150); y.scale(0.6, 0.6); A.customer(y, sp, { mood: 'yum', t: 0.3, seed: 1, acc: 0 }); y.restore(); }
  }
  $('bNext').textContent = 'NEXT';
  ui('clear');
}
function buildShop() {
  var box = $('shop'); box.innerHTML = '';
  $('mday').textContent = 'DAY ' + (S.stop + 1); $('mname').textContent = L(TX.stops[S.stop]);
  UPS.forEach(function (u) {
    var lv = S.up[u.id], max = lv >= u.max, price = max ? 0 : u.price[lv], el = document.createElement('button'), pips = '';
    for (var i = 0; i < u.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
    el.className = 'item' + (max ? ' max' : S.coins < price ? ' poor' : '');
    el.innerHTML = '<canvas width="160" height="160"></canvas><span class="nm">' + L(TX.shop[u.id]) + '</span><span class="pips">' + pips + '</span><span class="pr">' + (max ? 'MAX' : '<canvas class="ci" width="44" height="46"></canvas>' + price) + '</span>';
    var x = el.querySelector('canvas').getContext('2d'); x.translate(80, 84); BG.shopIcon(x, u.id, 62);
    if (!max) { var y = el.querySelector('.ci').getContext('2d'); y.translate(22, 21); A.coin(y, 18); }
    el.addEventListener('click', function () {
      SND.unlock();
      if (max || S.coins < price) { SND.play('nope'); el.classList.remove('no'); void el.offsetWidth; el.classList.add('no'); return; }
      S.coins -= price; S.up[u.id]++; save(); SND.play('buy'); buildShop(); hud(1);
    });
    box.appendChild(el);
  });
}
function placeMap() {}

/* ---------- 입력 ---------- */
function near(x, y, p, r) { var dx = x - p[0], dy = y - p[1]; return dx * dx + dy * dy < r * r; }
function tap(x, y) {
  if (!G || G.mode !== 'play') return;
  if (G.pin) { hitPin(x); return; }
  var i;
  if (y > 96 && y < LY + 14) { for (i = 0; i < 3; i++) if (G.cust[i] && Math.abs(x - P.slots[i]) < 114) { if (!serve(G.cust[i]) && G.cust[i].state === 'wait') { G.shakeTray = 0.3; SND.play('nope'); } return; } return; }
  for (i = 0; i < 2; i++) if (near(x, y, P.comal[i], 72)) return tapComal(i);
  if (near(x, y, P.stack, 74)) return tapStack();
  if (near(x, y, [P.pin[0], P.pin[1] - 6], 66)) return tapPin();
  for (i = 0; i < 3; i++) if (Math.abs(x - P.sauce[i][0]) < 27 && y > P.sauce[i][1] - 150 && y < P.sauce[i][1] + 8) return tapItem(A.SAUCES[i]);
  if (Math.abs(x - P.trash[0]) < 44 && Math.abs(y - P.trash[1]) < 46) return tapTrash();
  if (nTray() > 1) for (i = 0; i < 2; i++) { var tg = trayGeo(i); if (Math.abs(x - tg[0]) < tg[2] * 1.3 && Math.abs(y - tg[1]) < tg[2] * 1.15) { pickTray(i); SND.play('btn'); return; } }
  if (y >= P.binY - 4) { var col = Math.floor((x - 10) / 176), row = Math.floor((y - P.binY) / 120); if (col >= 0 && col < 4 && row >= 0 && row < 3) tapItem(A.BINS[row * 4 + col]); }
}
cv.addEventListener('pointerdown', function (e) { e.preventDefault(); SND.unlock(); tap((e.clientX - ox) / colW * 720, (e.clientY - oy) / colW * 720); });
function click(id, fn) { $(id).addEventListener('click', function () { SND.unlock(); SND.play('btn'); fn(); }); }
click('bStart', function () { if (S.done) { S = fresh(); save(); } startStop(0); });
click('bCont', function () { goMap(false); });
click('bNew', function () { $('confirm').hidden = false; });
click('bNo', function () { $('confirm').hidden = true; });
click('bYes', function () { $('confirm').hidden = true; S = fresh(); save(); startStop(0); });
click('bGo', function () { startStop(S.stop); });
click('bNext', function () { if (G.stop >= 11) goEnd(); else goMap(true); });
click('bRetry', function () { startStop(G.stop); });
click('bTitle', function () { goTitle(); });
function tog(id, key, set) {
  var el = $(id), v = localStorage.getItem(key) !== '0';
  function ap() { el.classList.toggle('off', !v); set(v ? 1 : 0); }
  el.addEventListener('click', function () { SND.unlock(); v = !v; try { localStorage.setItem(key, v ? '1' : '0'); } catch (e) {} ap(); }); ap();
}
tog('tBgm', 'taco.bgm', function (v) { SND.bgm(v); }); tog('tSnd', 'taco.snd', function (v) { SND.snd(v); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('confirm').hidden = true; if (e.key === 'Enter' && !$('confirm').hidden) $('bYes').click(); });
document.addEventListener('visibilitychange', function () { SND.hide(document.hidden); lastTs = 0; });
window.addEventListener('resize', resize);

/* ---------- 돌리기 ---------- */
var lastTs = 0;
function frame(ts) { var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0; lastTs = ts; if (!document.hidden) { step(dt); draw(); } requestAnimationFrame(frame); }
$('ttl').innerHTML = '<span class="v">VIVA</span><span class="k">' + (EN ? 'TACOS' : '타코스') + '</span>';
document.title = L(TX.title);
(function () { var a = $('coinI').getContext('2d'); a.translate(22, 21); A.coin(a, 18); var b = $('cearnI').getContext('2d'); b.translate(22, 21); A.coin(b, 18); })();
SND.music(1);
resize(); goTitle(); draw();
if (document.fonts && document.fonts.load) document.fonts.load('40px Taco').then(function () { cache = {}; });
A.SPR.load(function () { cache = {}; bgKey = ''; if (lastTs === 0) draw(); });
requestAnimationFrame(frame);

/* 시험 손잡이 */
window.__tc = {
  tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) step(dt || 1 / 60); draw(); },
  G: function () { return G; }, S: function () { return S; }, P: P, start: startStop, map: goMap, title: goTitle, end: goEnd, tap: tap, next: nextAction, act: doAction, resize: resize,
  set: function (o) { for (var k in o) S[k] = o[k]; save(); hud(); },
  bot: function (sec, every, skill) {
    var t = 0, acc = 0, dt = 1 / 60; every = every || 0.6;
    while (t < sec && G.mode === 'play') { step(dt); t += dt; acc += dt; if (acc >= every) { acc = 0; if (!skill || Math.random() < skill) doAction(nextAction(true)); } }
    draw(); return { mode: G.mode, t: Math.round(t), served: G.served, lost: G.lost, hearts: G.hearts, earned: G.earned, avg: +(G.starSum / Math.max(1, G.served)).toFixed(2), s3: G.s3, coins: S.coins };
  },
  shot: function (name) { return fetch('/save?name=' + name, { method: 'POST', body: cv.toDataURL('image/png') }).then(function (r) { return r.text(); }); }
};
})();
