/* 방귀라이크 — 게임 본체
 * 준비(먹기 → 배에 가스가 참) → 꾹 누르기(모으기) → 떼기(큰 방귀). 너무 오래 참으면 뿌지직.
 * 시험 손잡이: window.__fr = { tick(n), start(stage), state(), bot(on), pick(i), ... }
 */
(function () {
  'use strict';
  var D = window.DATA, A = window.ART, S = window.FA, L = window.L || function (s) { return s; };
  var KEY = 'fartrogue.';
  var PI = Math.PI, TAU = PI * 2;
  var $ = function (id) { return document.getElementById(id); };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmt(t) { t = Math.max(0, Math.floor(t)); var m = Math.floor(t / 60), s = t % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

  // ─────────────── 저장 ───────────────
  function loadJ(k, d) { try { var v = JSON.parse(localStorage.getItem(KEY + k)); return v || d; } catch (e) { return d; } }
  function saveJ(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  function delJ(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} }
  var P = loadJ('prog', null) || {};
  function normProg() {
    P.coins = P.coins || 0; P.shop = P.shop || {}; P.unlocked = P.unlocked || 1; P.cleared = P.cleared || [0, 0, 0, 0, 0];
    P.seenF = P.seenF || {}; P.seenE = P.seenE || {}; P.best = P.best || [0, 0, 0, 0, 0]; P.ended = P.ended || 0; P.kills = P.kills || 0;
    D.SHOP.forEach(function (s) { P.shop[s.id] = P.shop[s.id] || 0; });
  }
  normProg();
  function saveProg() { saveJ('prog', P); }

  // ─────────────── 화면 ───────────────
  var cv = $('cv'), cx = cv.getContext('2d', { alpha: false });
  var W = 0, H = 0, DPR = 1, SC = 1, VW = 800, VH = 500;
  var vign = null;
  function resize() {
    W = window.innerWidth || document.documentElement.clientWidth || 800; H = window.innerHeight || document.documentElement.clientHeight || 450;
    DPR = Math.min(window.devicePixelRatio || 1, G.lowq ? 1 : 1.5);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    // 짧은 변에 세계 500 이 들어오게, 긴 변은 1150 까지
    SC = Math.max(Math.min(W, H) / 500, Math.max(W, H) / 1150);
    VW = W / SC; VH = H / SC;
    vign = A.mk(256, 256); var x = vign.getContext('2d');
    x.fillStyle = A.rad(x, 128, 128, 60, 128, 128, 182, [[0, 'rgba(20,10,30,0)'], [0.7, 'rgba(20,10,30,.1)'], [1, 'rgba(20,10,30,.5)']]); x.fillRect(0, 0, 256, 256);
  }

  // ─────────────── 상태 ───────────────
  var G = { mode: 'title', stage: 0, t: 0, lowq: false };
  var pl = { x: 0, y: 0, r: 14 };
  var ST = {};
  var E = [], GEMS = [], CLOUDS = [], PROJ = [], PARTS = [], RINGS = [], PICKS = [], TEXTS = [], DELAY = [], BOLTS = [];
  var boss = null;
  var cam = { x: 0, y: 0 };
  var input = { x: 0, y: 0, fart: false, keys: {} };

  function calc() {
    var f = G.foods, e = G.evos, sh = P.shop;
    var fl = function (id) { return f[id] || 0; };
    ST.dmgMul = 1 + 0.1 * sh.power;
    ST.maxhp = 120 + 12 * sh.hp + 15 * fl('beondegi');
    ST.regen = 0.3 * fl('beondegi');
    ST.speed = 132 * (1 + 0.06 * sh.shoe + 0.05 * fl('buldak'));
    ST.gasRegen = 11 * (1 + 0.22 * fl('goguma') + 0.08 * fl('buldak') + 0.1 * sh.belly);
    ST.chargeSpd = 115 * (1 + 0.22 * fl('soda'));
    ST.blastDmg = (1 + 0.25 * fl('milk')) * ST.dmgMul;
    ST.blastR = 1 + 0.06 * fl('kimchi');
    ST.knock = 1 + 0.3 * fl('kimchi');
    ST.cloudDur = (1 + 0.35 * fl('chung')) * (e.hellcloud ? 1.6 : 1);
    ST.cloudR = 1 + 0.1 * fl('chung');
    ST.cloudDps = 14 * ST.dmgMul * (e.hellcloud ? 1.6 : 1);
    ST.puffInt = 0.85 * Math.pow(0.88, fl('cabbage')) * (e.machinegun ? 0.6 : 1);
    ST.puffDmg = (10 + 4 * fl('cabbage')) * ST.dmgMul;
    ST.puffR = 52 + 4 * fl('cabbage');
    ST.puffN = e.machinegun ? 3 : 1;
    ST.burn = fl('lighter') ? 0.25 : 0;
    ST.poison = 6 * fl('egg') * ST.dmgMul;
    ST.dash = fl('cola') ? 50 + 30 * fl('cola') : 0;
    ST.dashDmg = fl('cola') ? 0.3 + 0.2 * fl('cola') : 0;
    ST.auraR = fl('garlic') ? (38 + 8 * fl('garlic')) * (e.spicyaura ? 1.6 : 1) : 0;
    ST.auraDps = (5 + 5 * fl('garlic')) * ST.dmgMul * (e.spicyaura ? 1.5 : 1);
    ST.mentos = fl('mentos');
    ST.pickup = 110 * (1 + 0.3 * fl('cereal')) * (1 + 0.25 * sh.magnet);
    ST.armor = sh.armor;
    ST.coinMul = 1 + 0.15 * sh.luck;
    var old = pl.maxhp || ST.maxhp;
    pl.maxhp = ST.maxhp;
    if (pl.hp != null && ST.maxhp > old) pl.hp += ST.maxhp - old;
  }

  // ─────────────── 풀(미리 만들어 다시 쓰기) ───────────────
  function take(arr, max, make) {
    for (var i = 0; i < arr.length; i++) if (!arr[i].on) { arr[i].on = true; return arr[i]; }
    if (arr.length >= max) return null;
    var o = make ? make() : {}; o.on = true; arr.push(o); return o;
  }
  function part(x, y, vx, vy, life, sp, size, grow, alpha, drag) {
    var p = take(PARTS, 700); if (!p) return null;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.t = 0; p.life = life; p.sp = sp; p.size = size; p.grow = grow || 0; p.a = alpha == null ? 1 : alpha; p.drag = drag == null ? 3 : drag;
    p.rot = 0; p.vr = 0; p.img = null; p.face = 1; p.g = 0; p.z = 0; p.vz = 0;
    return p;
  }
  // 불 번개 한 줄기: (x1,y1)→(x2,y2) 로 지그재그로 뻗고 곁가지를 친다. 모양은 매 1/30초 새로 흔들려 지지직거린다
  function bolt(x1, y1, x2, y2, life, w, br) {
    var b = take(BOLTS, 90); if (!b) return;
    b.x1 = x1; b.y1 = y1; b.x2 = x2; b.y2 = y2; b.t = 0; b.life = life || 0.3; b.w = w || 4; b.br = br == null ? 2 : br; b.seed = Math.floor(Math.random() * 1e6);
  }
  function brand(n) { var h = (n * 374761393) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function boltPath(x1, y1, x2, y2, seed, depth) {
    var pts = [x1, y1, x2, y2], len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)), amp = len * 0.28, k = 0;
    for (var d = 0; d < depth; d++) {
      var np = [pts[0], pts[1]];
      for (var i = 2; i < pts.length; i += 2) {
        var ax = pts[i - 2], ay = pts[i - 1], bx = pts[i], by = pts[i + 1], mx = (ax + bx) / 2, my = (ay + by) / 2;
        var dx = bx - ax, dy = by - ay, dl = Math.sqrt(dx * dx + dy * dy) || 1, off = (brand(seed + k++) - 0.5) * 2 * amp;
        np.push(mx - dy / dl * off, my + dx / dl * off, bx, by);
      }
      pts = np; amp *= 0.5;
    }
    return pts;
  }
  function strokePts(pts) { cx.beginPath(); cx.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) cx.lineTo(pts[i], pts[i + 1]); cx.stroke(); }
  // 번개 색: 보라 플라즈마 — 바깥 보라 빛 → 분홍 → 흰 심 (사장님이 5가지 중 고름, 2026-09-26). [색, 굵기배, 투명도]
  var BOLT_LINES = [['#9a2aff', 3.2, 0.45], ['#ff6ad8', 1.5, 0.85], ['#fff0ff', 0.7, 1]];
  function drawBolts() {
    worldT(); cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round'; cx.lineJoin = 'round';
    for (var i = 0; i < BOLTS.length; i++) {
      var b = BOLTS[i]; if (!b.on) continue;
      var u = b.t / b.life, fl = Math.floor(b.t * 30), a = (u < 0.15 ? 1 : 1 - (u - 0.15) / 0.85) * (0.75 + 0.25 * brand(b.seed + fl * 7));
      var main = boltPath(b.x1, b.y1, b.x2, b.y2, b.seed + fl * 131, 5), paths = [main];
      for (var k = 0; k < b.br; k++) {             // 곁가지
        var j = 2 * (2 + Math.floor(brand(b.seed + k * 17 + fl) * (main.length / 2 - 4))), sx = main[j], sy = main[j + 1];
        var ang = Math.atan2(b.y2 - b.y1, b.x2 - b.x1) + (brand(b.seed + k * 29) - 0.5) * 1.6, bl = Math.sqrt((b.x2 - b.x1) * (b.x2 - b.x1) + (b.y2 - b.y1) * (b.y2 - b.y1)) * (0.25 + 0.2 * brand(b.seed + k * 41));
        paths.push(boltPath(sx, sy, sx + Math.cos(ang) * bl, sy + Math.sin(ang) * bl, b.seed + k * 997 + fl * 53, 4));
      }
      for (var q = 0; q < paths.length; q++) {
        var wk = q ? 0.55 : 1;
        for (var li = 0; li < BOLT_LINES.length; li++) { var L_ = BOLT_LINES[li]; cx.globalAlpha = a * L_[2]; cx.strokeStyle = L_[0]; cx.lineWidth = b.w * L_[1] * wk; strokePts(paths[q]); }
      }
    }
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  }
  function ring(x, y, r0, r1, life, col, lw) {
    var r = take(RINGS, 40); if (!r) return;
    r.x = x; r.y = y; r.r0 = r0; r.r1 = r1; r.t = 0; r.life = life; r.col = col; r.lw = lw || 6;
  }
  function text(x, y, s, col, size) {
    var t = take(TEXTS, 50); if (!t) return;
    t.x = x; t.y = y; t.s = s; t.col = col || '#fff'; t.size = size || 18; t.t = 0; t.life = 0.7;
  }

  // ─────────────── 공간 격자 (적 찾기) ───────────────
  var CELL = 64, GN = 40, GRID = new Int32Array(GN * GN), NEXT = new Int32Array(1024), gx0 = 0, gy0 = 0;
  GRID.fill(-1);
  function gridBuild() {
    GRID.fill(-1);
    gx0 = Math.floor(pl.x / CELL) - GN / 2; gy0 = Math.floor(pl.y / CELL) - GN / 2;
    for (var i = 0; i < E.length; i++) {
      var e = E[i]; if (!e.on || e.dead) continue;
      var cxi = Math.floor(e.x / CELL) - gx0, cyi = Math.floor(e.y / CELL) - gy0;
      if (cxi < 0 || cyi < 0 || cxi >= GN || cyi >= GN) continue;
      var c = cyi * GN + cxi; NEXT[i] = GRID[c]; GRID[c] = i;
    }
  }
  var QR = [];
  function query(x, y, r) {
    QR.length = 0;
    var a = Math.floor((x - r) / CELL) - gx0, b = Math.floor((x + r) / CELL) - gx0, c0 = Math.floor((y - r) / CELL) - gy0, c1 = Math.floor((y + r) / CELL) - gy0;
    a = Math.max(0, a); b = Math.min(GN - 1, b); c0 = Math.max(0, c0); c1 = Math.min(GN - 1, c1);
    for (var cy = c0; cy <= c1; cy++) for (var cxx = a; cxx <= b; cxx++) {
      var i = GRID[cy * GN + cxx];
      while (i >= 0) { var e = E[i]; var dx = e.x - x, dy = e.y - y, rr = r + e.r; if (dx * dx + dy * dy < rr * rr) QR.push(e); i = NEXT[i]; }
    }
    if (boss && boss.on && !boss.dead) { var bx = boss.x - x, by = boss.y - y, br = r + boss.r; if (bx * bx + by * by < br * br) QR.push(boss); }
    return QR;
  }

  // ─────────────── 적 ───────────────
  function stageDef() { return D.STAGES[G.stage]; }
  function minute() { return Math.min(8, Math.floor(G.t / 60)); }
  function hpScale() { return stageDef().hp * (1 + 0.1 * G.t / 60); }
  function spawnEnemy(id, x, y, opt) {
    var e = take(E, 1000); if (!e) return null;
    var d = D.ENEMIES[id], sd = stageDef();
    e.id = id; e.def = d; e.x = x; e.y = y; e.kx = 0; e.ky = 0; e.dead = false; e.dieT = 0;
    e.sc = (opt && opt.sc) || 1; e.elite = !!(opt && opt.elite); e.boss = false;
    e.maxhp = e.hp = d.hp * hpScale() * (e.elite ? 14 : 1) * (opt && opt.hpMul || 1);
    e.r = d.r * e.sc; e.spd = d.spd * rnd(0.9, 1.1) * (e.elite ? 0.9 : 1); e.dmg = d.dmg * sd.dmg * (1 + 0.06 * G.t / 60) * (e.elite ? 1.5 : 1);
    e.flash = 0; e.sick = 0; e.fear = 0; e.fx = 0; e.fy = 0; e.poison = 0; e.pdps = 0; e.burn = 0; e.hitCd = 0;
    e.face = 1; e.anim = Math.random() * 10; e.st = 0; e.stT = rnd(1, 3); e.dx = 0; e.dy = 0; e.shoot = rnd(1.5, 3); e.wob = Math.random() * 10;
    e.line = 0; e.cough = 0; e.stink = rnd(1, 2);
    if (opt && opt.vx != null) { e.line = opt.lineT || 7; e.dx = opt.vx; e.dy = opt.vy; }
    if (id === 'egg') { var a = Math.atan2(pl.y - y, pl.x - x) + rnd(-0.3, 0.3); e.dx = Math.cos(a); e.dy = Math.sin(a); }
    if (!P.seenE[id]) { P.seenE[id] = 1; saveProg(); }
    return e;
  }
  function edgePoint(extra) {
    var a = Math.random() * TAU, R = Math.sqrt(VW * VW + VH * VH) / 2 + 40 + (extra || 0);
    return [pl.x + Math.cos(a) * R, pl.y + Math.sin(a) * R, a];
  }
  function pickW(list) {
    var tot = 0, i; for (i = 0; i < list.length; i++) tot += list[i][1];
    var r = Math.random() * tot; for (i = 0; i < list.length; i++) { r -= list[i][1]; if (r <= 0) return list[i][0]; }
    return list[0][0];
  }
  var alive = 0;
  function spawner(dt) {
    var sd = stageDef(), m = minute();
    var frac = (G.t % 60) / 60, rate = m < 8 ? sd.rate[m] + (sd.rate[Math.min(8, m + 1)] - sd.rate[m]) * frac * (m < 7 ? 1 : 0) : sd.rate[8];
    var max = sd.max[m];
    G.spawnAcc += rate * dt;
    while (G.spawnAcc >= 1) {
      G.spawnAcc -= 1;
      if (alive >= max) { G.spawnAcc = 0; break; }
      var p = edgePoint(); spawnEnemy(pickW(sd.bands[m]), p[0], p[1]);
    }
    // 이벤트
    while (G.evI < sd.events.length && G.t >= sd.events[G.evI][0]) { runEvent(sd.events[G.evI]); G.evI++; }
    // 보스
    if (!G.bossWarned && G.t >= D.BOSS_T - 3) { G.bossWarned = true; word('BOSS', 2); S.warn(); }
    if (!G.bossSpawned && G.t >= D.BOSS_T) spawnBoss();
  }
  function runEvent(ev) {
    var type = ev[1], id = ev[2], n = ev[3], i, a;
    if (type === 'swarm') {
      // 한쪽에서 떼로 가로질러 온다
      a = Math.random() * TAU; var R = Math.sqrt(VW * VW + VH * VH) / 2 + 60;
      var ox = pl.x + Math.cos(a) * R, oy = pl.y + Math.sin(a) * R, vx = -Math.cos(a), vy = -Math.sin(a), px = -vy, py = vx;
      for (i = 0; i < n; i++) { var s = (i - n / 2) * 22; spawnEnemy(id, ox + px * s + rnd(-20, 20) - vx * (i % 3) * 30, oy + py * s + rnd(-20, 20) - vy * (i % 3) * 30, { vx: vx, vy: vy, lineT: 8 }); }
    } else if (type === 'ring') {
      var R2 = Math.min(VW, VH) * 0.5 + 60;
      for (i = 0; i < n; i++) { a = i / n * TAU; spawnEnemy(id, pl.x + Math.cos(a) * R2, pl.y + Math.sin(a) * R2); }
    } else if (type === 'elite') {
      var p = edgePoint(); var e = spawnEnemy(id, p[0], p[1], { elite: true, sc: 1.8 });
    }
  }
  function spawnBoss() {
    G.bossSpawned = true;
    var id = stageDef().boss, d = D.BOSSES[id], p = edgePoint(-40);
    var b = { on: true, id: id, def: d, x: p[0], y: p[1], kx: 0, ky: 0, r: d.r, maxhp: d.hp * (1 + 0.04 * G.stage), hp: 0, boss: true, dead: false, dieT: 0,
      flash: 0, sick: 0, fear: 0, poison: 0, pdps: 0, burn: 0, hitCd: 0, face: 1, anim: 0, st: 'walk', stT: 3, dx: 0, dy: 0, dmg: d.dmg * stageDef().dmg, spd: d.spd, sc: 1, cnt: 0, inflate: 0 };
    b.hp = b.maxhp;
    boss = b; G.bossT = 0;
    if (!P.seenE[id]) { P.seenE[id] = 1; saveProg(); }
    $('bossName').textContent = d.name; $('bossbar').hidden = false;
    S.music(5);
  }

  function hurtEnemy(e, dmg, kx, ky, kind) {
    if (e.dead || !e.on) return false;
    if (e.boss && e.id === 'skunkking' && e.st === 'duelstun') dmg *= 2;
    e.hp -= dmg; e.flash = 0.08;
    var kb = e.boss ? 0.12 : (e.def.kb || 1) / (e.elite ? 3 : 1);
    e.kx += kx * kb; e.ky += ky * kb;
    if (kind === 'blast' || kind === 'puff') S.hit();
    if (e.hp <= 0) { killEnemy(e, kind, kx, ky); return true; }
    return false;
  }
  function killEnemy(e, kind, kx, ky) {
    e.dead = true; e.dieT = 0;
    if (e.boss) { bossDown(); return; }
    alive--;
    G.kills++; G.blastKills += kind === 'blast' ? 1 : 0;
    var d = e.def;
    // 경험치 보석
    var xp = d.xp * (e.elite ? 10 : 1);
    dropGem(e.x, e.y, xp);
    if (Math.random() < 0.025 * (e.elite ? 40 : 1)) dropPick('coin', e.x + rnd(-8, 8), e.y + rnd(-8, 8), e.elite ? 25 : 1 + (Math.random() < 0.3 ? 2 : 0));
    if (Math.random() < 0.004 && countPick('snack') < 3) dropPick('snack', e.x, e.y);
    if (Math.random() < 0.0015 && countPick('magnet') < 1) dropPick('magnet', e.x, e.y);
    if (e.elite) dropPick('lunch', e.x, e.y);
    // 풍선은 둘로 갈라진다
    if (d.split && e.sc > 0.7) for (var i = 0; i < 2; i++) { var m = spawnEnemy(e.id, e.x + (i ? 12 : -12), e.y, { sc: 0.6, hpMul: 0.35 }); if (m) { m.kx = (i ? 1 : -1) * 120; alive++; } }
    // 날아가며 사라진다 (세게 맞으면 화면 밖으로)
    var sp2 = kx * kx + ky * ky;
    var fr = A.E[e.id][Math.floor(e.anim * 6) % 2];
    var p = part(e.x, e.y, 0, 0, 0.8, null, e.sc, 0, 1, 0.6);
    if (p) {
      p.img = sp2 > 200 * 200 ? fr.g : fr.n; p.face = e.face;
      var sp = Math.sqrt(sp2) || 1, fly = sp2 > 150 * 150 ? 1.8 : 0.5;
      p.vx = (kx / sp) * (180 + sp * 0.9) * fly + rnd(-40, 40); p.vy = (ky / sp) * (180 + sp * 0.9) * fly + rnd(-40, 40);
      p.vz = sp2 > 150 * 150 ? rnd(260, 420) : rnd(120, 200); p.g = 900; p.vr = rnd(-14, 14) * (sp2 > 150 * 150 ? 1 : 0.4); p.life = sp2 > 150 * 150 ? 0.9 : 0.45; p.drag = 0.3;
    }
    for (var k = 0; k < 3; k++) part(e.x + rnd(-6, 6), e.y - 10 + rnd(-6, 6), rnd(-50, 50), rnd(-60, 10), 0.4, A.P.white, 10, 30, 0.7);
    S.pop();
  }
  function dropGem(x, y, v) {
    var n = 0, i; for (i = 0; i < GEMS.length; i++) if (GEMS[i].on) n++;
    if (n > 300) { // 너무 많으면 제일 먼 보석을 여기로 끌어와 합친다 (경험치를 잃지 않게)
      var far = null, fd = -1;
      for (i = 0; i < GEMS.length; i++) { var g0 = GEMS[i]; if (!g0.on || g0.mag) continue; var d2 = (g0.x - pl.x) * (g0.x - pl.x) + (g0.y - pl.y) * (g0.y - pl.y); if (d2 > fd) { fd = d2; far = g0; } }
      if (far) { far.x = x; far.y = y; far.v += v; far.kind = far.v >= 20 ? 2 : far.v >= 5 ? 1 : 0; far.t = 0; far.vx = rnd(-40, 40); far.vy = rnd(-40, 40); return; }
    }
    var g = take(GEMS, 400); if (!g) return;
    g.x = x; g.y = y; g.v = v; g.kind = v >= 20 ? 2 : v >= 5 ? 1 : 0; g.mag = false; g.vx = rnd(-40, 40); g.vy = rnd(-40, 40); g.t = 0;
  }
  function dropPick(kind, x, y, v) {
    var p = take(PICKS, 40); if (!p) return;
    p.kind = kind; p.x = x; p.y = y; p.v = v || 0; p.mag = false; p.t = 0; p.vx = rnd(-30, 30); p.vy = rnd(-30, 30);
  }
  function countPick(k) { var n = 0; for (var i = 0; i < PICKS.length; i++) if (PICKS[i].on && PICKS[i].kind === k) n++; return n; }

  // ─────────────── 방귀 ───────────────
  function behind() { return [pl.x - pl.face * 17, pl.y - 6]; }
  function cloud(x, y, r, dur, dps, kind, opt) {
    var c = take(CLOUDS, 90); if (!c) return null;
    c.x = x; c.y = y; c.r = r; c.t = 0; c.dur = dur; c.dps = dps; c.kind = kind; c.tick = 0; c.vx = (opt && opt.vx) || 0; c.vy = (opt && opt.vy) || 0; c.follow = !!(opt && opt.follow); c.enemy = !!(opt && opt.enemy); c.rot = Math.random() * TAU; c.slow = (opt && opt.slow) || 0;
    return c;
  }
  function puffAt(x, y, r, dmg, kind) {
    var fire = G.evos.fire;
    var q = query(x, y, r);
    for (var i = 0; i < q.length; i++) {
      var e = q[i]; var dx = e.x - x, dy = e.y - y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      e.sick = Math.max(e.sick, 0.5);
      if (!e.dead && (ST.burn && Math.random() < ST.burn || fire)) e.burn = Math.max(e.burn, 2);
      hurtEnemy(e, dmg, dx / d * 120 * ST.knock, dy / d * 120 * ST.knock, 'puff');
    }
    var sp = fire ? A.P.fire : A.P.green;
    for (var k = 0; k < 5; k++) { var a = Math.random() * TAU; part(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, Math.cos(a) * 60, Math.sin(a) * 60 - 10, 0.55, sp, r * 0.55, r * 0.9, 0.85); }
    ring(x, y, r * 0.3, r, 0.25, fire ? 'rgba(230,120,255,' : 'rgba(190,230,110,', 4);
    if (fire) for (k = 0; k < 3; k++) { var fa = Math.random() * TAU, fl2 = r * rnd(0.9, 1.4); bolt(x, y - 6, x + Math.cos(fa) * fl2, y + Math.sin(fa) * fl2 * 0.75, rnd(0.16, 0.26), 2.6, 1); }
  }
  function autoPuff() {
    var n = ST.puffN;
    if (n > 1) {
      // 연발: 가까운 적 셋을 조준
      var q = query(pl.x, pl.y, 260).slice().sort(function (a, b) { return (a.x - pl.x) * (a.x - pl.x) + (a.y - pl.y) * (a.y - pl.y) - ((b.x - pl.x) * (b.x - pl.x) + (b.y - pl.y) * (b.y - pl.y)); });
      for (var i = 0; i < n; i++) {
        var tg = q[i];
        if (tg) { DELAY.push({ t: i * 0.08, f: (function (e) { return function () { var b = behind(); for (var k = 0; k < 4; k++) { var u = (k + 1) / 5; part(b[0] + (e.x - b[0]) * u, b[1] + (e.y - b[1]) * u, 0, -10, 0.3, G.evos.fire ? A.P.fire : A.P.green, 8, 8, 0.8); } puffAt(e.x, e.y, ST.puffR * 0.8, ST.puffDmg, 'puff'); }; })(tg) }); }
        else { var b0 = behind(); puffAt(b0[0] - pl.face * i * 18, b0[1] + rnd(-10, 10), ST.puffR, ST.puffDmg, 'puff'); }
      }
    } else {
      // 가장 가까운 적 쪽으로 엉덩이를 들이밀어 뿡 (없으면 뒤로)
      var ne = nearestEnemy(pl.x, pl.y - 10, 170), b = behind(), px = b[0] - pl.face * 14, py = b[1] + 4;
      if (ne) { var dx = ne.x - pl.x, dy = ne.y - pl.y, d = Math.sqrt(dx * dx + dy * dy) || 1; px = pl.x + dx / d * 36; py = pl.y - 8 + dy / d * 30; if (Math.abs(dx) > 8 && !pl.moving) pl.face = dx > 0 ? -1 : 1; }
      puffAt(px, py, ST.puffR, ST.puffDmg, 'puff');
    }
    pl.squash = 0.12; pl.puffT = 0.18;
    S.puff();
  }
  function blast(p, perfect, bujijik) {
    var b = behind(), bx = b[0] - pl.face * 8, by = b[1] + 2;
    var R = (60 + 100 * p) * ST.blastR * (perfect ? 1.15 : 1);
    var dmg = (20 + 90 * p) * ST.blastDmg * (perfect ? 1.3 : 1);
    var kb = (240 + 520 * p) * ST.knock;
    G.blastKills = 0;
    var q = query(bx, by, R).slice();
    for (var i = 0; i < q.length; i++) {
      var e = q[i]; var dx = e.x - bx, dy = e.y - by, d = Math.sqrt(dx * dx + dy * dy) || 1;
      var fall = 1 - 0.4 * Math.min(1, d / R);
      e.sick = Math.max(e.sick, 1.2); e.fear = 0.6; e.fx = bx; e.fy = by;
      if (ST.poison) { e.poison = 3; e.pdps = ST.poison; }
      if (G.evos.fire) e.burn = 3;
      if (e.boss && e.id === 'skunkking' && e.st === 'inflate' && p >= 0.6) duelCounter(e);
      hurtEnemy(e, dmg * fall * (e.def.blastMul || 1), dx / d * kb * fall, dy / d * kb * fall, 'blast');
    }
    // 남는 냄새 구름
    var kind = G.evos.hellcloud ? 'poison' : G.evos.fire ? 'fire' : 'stink';
    cloud(bx, by, R * 0.72 * ST.cloudR, (1.0 + 1.5 * p) * ST.cloudDur, ST.cloudDps * (0.6 + 0.8 * p), kind, { follow: !!G.evos.hellcloud });
    if (G.evos.fire) cloud(bx, by, R * 1.05, 3, 26 * ST.dmgMul, 'fire');
    // 연출
    ring(bx, by, 10, R, 0.35 + p * 0.15, kind === 'fire' ? 'rgba(230,120,255,' : kind === 'poison' ? 'rgba(190,120,240,' : 'rgba(200,240,120,', 10 + p * 12);
    ring(bx, by, 5, R * 0.6, 0.25, 'rgba(255,255,255,', 5);
    if (G.evos.fire) { for (var fk = 0; fk < 8 + Math.round(8 * p); fk++) { var fa2 = fk / (8 + Math.round(8 * p)) * TAU + rnd(-0.25, 0.25), fd2 = rnd(0.75, 1.2) * R; bolt(bx + Math.cos(fa2) * 26, by - 10 + Math.sin(fa2) * 20, bx + Math.cos(fa2) * fd2, by + Math.sin(fa2) * fd2 * 0.8, rnd(0.28, 0.42), 4 + 3 * p, 2); } G.flash = Math.max(G.flash, 0.22 + 0.1 * p); }
    var sp = kind === 'fire' ? A.P.fire : kind === 'poison' ? A.P.purple : A.P.green;
    var n = 10 + Math.round(24 * p);
    for (var k = 0; k < n; k++) { var a = Math.random() * TAU, v = rnd(0.4, 1) * R * 2.6; part(bx, by, Math.cos(a) * v - pl.face * 60, Math.sin(a) * v * 0.8, 0.5 + p * 0.3, sp, 14 + p * 16, 30 + p * 40, 0.9, 4); }
    // 뒤로 뿜어지는 기둥
    for (k = 0; k < 6 + p * 8; k++) part(bx, by, -pl.face * rnd(200, 520) * (0.4 + p), rnd(-70, 70), 0.45, sp, 12 + p * 10, 40, 0.9, 5);
    G.shake = Math.max(G.shake, 4 + 13 * p); G.hitstop = 0.025 + 0.05 * p;
    if (p > 0.55) G.flash = 0.18 + 0.12 * p;
    pl.squash = 0.35 * (0.4 + p); pl.expr = bujijik ? 'oops' : 'relief'; pl.exprT = bujijik ? 1.4 : 0.9;
    // 밀려나기: 방귀의 반동으로 앞으로 튄다(콜라면 대시)
    var mvx = input.x || pl.face, mvy = input.y;
    var ml = Math.sqrt(mvx * mvx + mvy * mvy) || 1; mvx /= ml; mvy /= ml;
    if (G.evos.rocket) { pl.dashT = 0.55; pl.dvx = mvx * 560; pl.dvy = mvy * 560; pl.iframe = Math.max(pl.iframe, 0.7); pl.rocket = true; }
    else if (ST.dash) { var dist = ST.dash * (0.5 + p); pl.dashT = 0.2; pl.dvx = mvx * dist / 0.2; pl.dvy = mvy * dist / 0.2; pl.iframe = Math.max(pl.iframe, 0.35); pl.rocket = false; }
    else { pl.kvx += mvx * 120 * p; pl.kvy += mvy * 120 * p; }
    // 멘토스 연쇄 폭발
    for (var m = 0; m < ST.mentos; m++) {
      DELAY.push({ t: 0.14 + m * 0.09, f: (function (m) { return function () {
        var a = Math.random() * TAU, rr = rnd(0.3, 0.9) * R, x = bx + Math.cos(a) * rr, y = by + Math.sin(a) * rr, r2 = 46 + 10 * p;
        var qq = query(x, y, r2).slice();
        for (var j = 0; j < qq.length; j++) { var e = qq[j], dx = e.x - x, dy = e.y - y, dd = Math.sqrt(dx * dx + dy * dy) || 1; hurtEnemy(e, dmg * 0.45, dx / dd * 200, dy / dd * 200, 'blast'); }
        ring(x, y, 4, r2, 0.22, 'rgba(160,220,255,', 6);
        for (var k2 = 0; k2 < 6; k2++) { var a2 = Math.random() * TAU; part(x, y, Math.cos(a2) * 120, Math.sin(a2) * 120, 0.35, A.P.white, 10, 24, 0.9); }
        S.pop();
      }; })(m) });
    }
    // 시리얼 폭탄
    if (G.evos.cerealbomb) for (var c = 0; c < 12; c++) { var ang = c / 12 * TAU; shot(bx, by, Math.cos(ang) * 430, Math.sin(ang) * 430, dmg * 0.35, 'cereal', false, 3); }
    if (bujijik) S.bujijik(); else S.blast(p);
    if (perfect) { word('PERFECT', 2); S.perfect(); }
    if (!bujijik) DELAY.push({ t: 0.12, f: function () {   // 뿌지직일 땐 '뿌지직!' 글자를 그대로 둔다
      var k = G.blastKills;
      if (k >= 35) { word('AWESOME', 2); S.word(2); }
      else if (k >= 18) { word('GREAT', 1); S.word(1); }
      else if (k >= 8) { word('NICE', 0); S.word(0); }
    } });
    G.blasts++;
  }
  function bujijik() {
    pl.stun = 1.3; pl.charging = false; pl.charge = 0; pl.capT = 0;
    word('뿌지직!', 3);
    blast(1.25, false, true);
    pl.belly = 0;
  }

  // ─────────────── 발사체 ───────────────
  function shot(x, y, vx, vy, dmg, kind, enemy, pierce) {
    var s = take(PROJ, 160); if (!s) return;
    s.x = x; s.y = y; s.vx = vx; s.vy = vy; s.dmg = dmg; s.kind = kind; s.enemy = enemy; s.t = 0; s.life = enemy ? 4 : 1.1; s.pierce = pierce || 1; s.hit = null; s.rot = 0; s.r = kind === 'balloon' ? 14 : kind === 'mop' ? 12 : 8;
  }

  // ─────────────── 플레이어 피해 ───────────────
  function hurtPlayer(dmg, fromX, fromY, src) {
    if (pl.iframe > 0 || G.mode !== 'play' || pl.dead) return;
    dmg = Math.max(1, dmg - ST.armor);
    if (G.dlog) G.dlog[src || 'boss'] = (G.dlog[src || 'boss'] || 0) + dmg;
    pl.hp -= dmg; pl.iframe = 0.18; pl.hurtT = 0.2; pl.expr = 'hurt'; pl.exprT = 0.3;
    if (fromX != null) { var dx = pl.x - fromX, dy = pl.y - fromY, d = Math.sqrt(dx * dx + dy * dy) || 1; pl.kvx += dx / d * 90; pl.kvy += dy / d * 90; }
    S.hurt(); G.redT = 0.18;
    if (pl.hp <= 0) die();
  }
  function die() {
    if (G.revives > 0) {
      G.revives--; pl.hp = pl.maxhp; pl.iframe = 2.5; word('REVIVE', 2); S.levelup();
      blast(1.2, true); return;
    }
    pl.dead = true; pl.hp = 0; G.deadT = 0; pl.expr = 'oops'; pl.exprT = 99;
    S.chargeStop();
  }

  // ─────────────── 보스 ───────────────
  function bossUpdate(b, dt) {
    var dx = pl.x - b.x, dy = pl.y - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / d, uy = dy / d;
    // 너무 멀어지면 화면 가장자리로 데려온다
    if (d > 950) { var ep = edgePoint(-60); b.x = ep[0]; b.y = ep[1]; b.st = 'walk'; b.stT = 1.5; return; }
    b.stT -= dt; b.anim += dt; G.bossT += dt;
    var id = b.id, sp = b.spd;
    if (b.sick > 0 && b.def.immune) b.sick = 0;
    if (id === 'kingpigeon') {
      if (b.st === 'walk') { b.x += ux * sp * dt; b.y += uy * sp * dt; if (b.stT <= 0) { b.st = Math.random() < 0.5 ? 'flapW' : 'dashW'; b.stT = 0.8; } }
      else if (b.st === 'flapW') { if (b.stT <= 0) { // 날갯짓: 바람으로 밀고 비둘기 소환
          ring(b.x, b.y - 20, 20, 320, 0.5, 'rgba(255,255,255,', 10);
          if (d < 320) { pl.kvx += ux * 420; pl.kvy += uy * 420; hurtPlayer(6, b.x, b.y); }
          for (var i = 0; i < 5; i++) { var a = i / 5 * TAU; if (spawnEnemy('pigeon', b.x + Math.cos(a) * 60, b.y + Math.sin(a) * 60)) alive++; }
          S.stomp(); G.shake = 8; b.st = 'walk'; b.stT = rnd(3, 4.5); } }
      else if (b.st === 'dashW') { if (b.stT <= 0) { b.st = 'dash'; b.stT = 0.65; b.dx = ux; b.dy = uy; } }
      else if (b.st === 'dash') { b.x += b.dx * 420 * dt; b.y += b.dy * 420 * dt; if (b.stT <= 0) { b.st = 'walk'; b.stT = rnd(2.5, 4); } }
    } else if (id === 'maskboss') {
      if (b.st === 'walk') { b.x += ux * sp * dt; b.y += uy * sp * dt; if (b.stT <= 0) { b.cnt++; b.st = b.cnt % 3 ? 'throwW' : 'dashW'; b.stT = 0.7; } }
      else if (b.st === 'throwW') { if (b.stT <= 0) { var ba = Math.atan2(dy, dx); for (var j = -2; j <= 2; j++) shot(b.x, b.y - 40, Math.cos(ba + j * 0.22) * 240, Math.sin(ba + j * 0.22) * 240, 10 * stageDef().dmg, 'mop', true); b.st = 'walk'; b.stT = rnd(2, 3); } }
      else if (b.st === 'dashW') { if (b.stT <= 0) { b.st = 'dash'; b.stT = 0.8; b.dx = ux; b.dy = uy; } }
      else if (b.st === 'dash') { b.x += b.dx * 400 * dt; b.y += b.dy * 400 * dt; if (Math.random() < 0.5) part(b.x, b.y, rnd(-30, 30), rnd(-30, 30), 0.4, A.P.white, 16, 30, 0.6); if (b.stT <= 0) { b.st = 'walk'; b.stT = rnd(2, 3); } }
    } else if (id === 'kingegg') {
      // 화면 안을 튕겨 다닌다
      if (b.st === 'walk') { b.st = 'roll'; var a0 = Math.atan2(dy, dx) + rnd(-0.5, 0.5); b.dx = Math.cos(a0); b.dy = Math.sin(a0); b.stT = 4; }
      if (b.st === 'roll') {
        b.x += b.dx * sp * dt; b.y += b.dy * sp * dt; b.anim += dt * 2;
        var hx = VW / 2 - b.r, hy = VH / 2 - b.r;
        if (b.x < cam.x - hx && b.dx < 0 || b.x > cam.x + hx && b.dx > 0) { b.dx = -b.dx; G.shake = 5; S.stomp(); }
        if (b.y < cam.y - hy && b.dy < 0 || b.y > cam.y + hy && b.dy > 0) { b.dy = -b.dy; G.shake = 5; S.stomp(); }
        if (b.stT <= 0) { b.st = 'steamW'; b.stT = 0.9; }
      } else if (b.st === 'steamW') { if (b.stT <= 0) {
          ring(b.x, b.y, 20, 240, 0.6, 'rgba(255,255,255,', 14);
          for (var k = 0; k < 14; k++) { var a1 = k / 14 * TAU; part(b.x, b.y - 30, Math.cos(a1) * 300, Math.sin(a1) * 300, 0.6, A.P.white, 20, 50, 0.8); }
          if (d < 240) hurtPlayer(12 * stageDef().dmg, b.x, b.y);
          for (var e2 = 0; e2 < 4; e2++) if (spawnEnemy('egg', b.x + rnd(-40, 40), b.y + rnd(-40, 40))) alive++;
          S.stomp(); b.st = 'walk'; } }
    } else if (id === 'bearboss') {
      if (b.st === 'walk') { b.x += ux * sp * dt; b.y += uy * sp * dt; if (b.stT <= 0) { b.cnt++; b.st = b.cnt % 2 ? 'throwW' : 'stompW'; b.stT = b.cnt % 2 ? 0.6 : 1.1; } }
      else if (b.st === 'throwW') { if (b.stT <= 0) { for (var q2 = 0; q2 < 4; q2++) { var ang = Math.atan2(dy, dx) + rnd(-0.6, 0.6); shot(b.x, b.y - 80, Math.cos(ang) * rnd(150, 230), Math.sin(ang) * rnd(150, 230), 8 * stageDef().dmg, 'balloon', true); } b.st = 'walk'; b.stT = rnd(2, 3); } }
      else if (b.st === 'stompW') { if (b.stT <= 0) {
          ring(b.x, b.y, 30, 280, 0.7, 'rgba(255,90,60,', 16);
          if (d < 280) { hurtPlayer(16 * stageDef().dmg, b.x, b.y); pl.kvx += ux * 300; pl.kvy += uy * 300; }
          for (var m2 = 0; m2 < 3; m2++) if (spawnEnemy('mascot', b.x + rnd(-80, 80), b.y + rnd(-80, 80), { hpMul: 0.5 })) alive++;
          S.stomp(); G.shake = 14; b.st = 'walk'; b.stT = rnd(2.5, 3.5); } }
    } else if (id === 'skunkking') {
      if (b.st === 'walk') {
        b.x += ux * sp * dt; b.y += uy * sp * dt; b.stink = (b.stink || 0) - dt;
        if (b.stink <= 0) { b.stink = 0.8; cloud(b.x, b.y, 60, 5, 7 * stageDef().dmg, 'enemy', { enemy: true, slow: 0.35 }); }
        if (b.stT <= 0) { b.cnt++; b.st = b.cnt % 2 ? 'inflate' : 'spinW'; b.stT = b.cnt % 2 ? 2.2 : 0.6; b.inflate = 0; }
      } else if (b.st === 'inflate') {
        // 방귀 겨루기: 부풀어 오르는 동안 큰 방귀(60% 넘게)를 맞히면 역습
        b.inflate = 1 - b.stT / 2.2;
        if (Math.random() < 0.3) part(b.x + rnd(-40, 40), b.y - rnd(40, 120), 0, -30, 0.5, A.P.purple, 10, 20, 0.7);
        if (b.stT <= 0) {
          b.inflate = 0;
          ring(b.x, b.y, 30, 330, 0.7, 'rgba(160,100,230,', 22);
          for (var k3 = 0; k3 < 22; k3++) { var a3 = k3 / 22 * TAU; part(b.x, b.y, Math.cos(a3) * 420, Math.sin(a3) * 420, 0.7, A.C.enemy ? A.P.purple : A.P.purple, 24, 60, 0.85); }
          if (d < 330) { hurtPlayer(26 * stageDef().dmg, b.x, b.y); pl.kvx += ux * 380; pl.kvy += uy * 380; }
          cloud(b.x, b.y, 200, 4, 9 * stageDef().dmg, 'enemy', { enemy: true, slow: 0.4 });
          S.bujijik(); G.shake = 16; b.st = 'walk'; b.stT = rnd(3, 4);
        }
      } else if (b.st === 'duelstun') { b.inflate = Math.max(0, b.inflate - dt * 2); if (b.stT <= 0) { b.st = 'walk'; b.stT = rnd(2, 3); } }
      else if (b.st === 'spinW') { if (b.stT <= 0) { b.st = 'spin'; b.stT = 1.0; b.dx = ux; b.dy = uy; } }
      else if (b.st === 'spin') { b.x += b.dx * 380 * dt; b.y += b.dy * 380 * dt; b.anim += dt * 6; if (Math.random() < 0.6) part(b.x, b.y, 0, 0, 0.6, A.P.purple, 16, 40, 0.6); if (b.stT <= 0) { b.st = 'walk'; b.stT = rnd(2, 3.5); } }
    }
    b.face = dx > 0 ? 1 : -1;
    // 몸통 박치기
    if (d < b.r + pl.r && b.hitCd <= 0) { hurtPlayer(b.dmg, b.x, b.y); b.hitCd = 0.8; }
    b.hitCd -= dt;
  }
  function duelCounter(b) {
    b.st = 'duelstun'; b.stT = 3; b.inflate = 0;
    word('COUNTER', 2); S.perfect(); G.flash = 0.3; G.shake = 18;
    b.hp -= b.maxhp * 0.06;
    for (var k = 0; k < 20; k++) { var a = Math.random() * TAU; part(b.x, b.y - 60, Math.cos(a) * 300, Math.sin(a) * 300, 0.6, A.P.gold, 14, 30, 1); }
  }
  function bossDown() {
    var b = boss;
    b.dead = true; b.dieT = 0; G.slow = 1.6; G.shake = 22; G.flash = 0.6;
    S.bossDie(); word('CLEAR', 2);
    for (var k = 0; k < 40; k++) { var a = Math.random() * TAU; part(b.x, b.y - 40, Math.cos(a) * rnd(100, 500), Math.sin(a) * rnd(100, 500), 1, [A.P.gold, A.P.green, A.P.white][k % 3], 20, 40, 1, 2); }
    for (var g = 0; g < 16; g++) dropGem(b.x + rnd(-80, 80), b.y + rnd(-80, 80), 10);
    dropPick('coin', b.x, b.y, 100 * (G.stage + 1));
    G.kills++;
    // 적이 모두 날아가 사라진다
    for (var i = 0; i < E.length; i++) { var e = E[i]; if (e.on && !e.dead) { var dx = e.x - b.x, dy = e.y - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1; killEnemy(e, 'blast', dx / d * 700, dy / d * 700); } }
    G.clearT = 0;
    $('bossbar').hidden = true;
  }

  // ─────────────── 한 걸음 ───────────────
  function step(dt) {
    if (G.mode !== 'play') return;
    if (G.hitstop > 0) { G.hitstop -= dt; return; }
    if (G.slow > 0) { G.slow -= dt; dt *= 0.35; }
    G.t += dt; G.saveT += dt;
    if (G.clearT != null) { G.clearT += dt; if (G.clearT > 2.2) { stageClear(); return; } }
    if (pl.dead) { G.deadT += dt; updateParts(dt); if (G.deadT > 1.6) gameOver(); return; }
    if (__bot.on) botThink(dt);
    // ── 주인공
    var ix = input.x, iy = input.y, il = Math.sqrt(ix * ix + iy * iy);
    if (il > 1) { ix /= il; iy /= il; }
    if (pl.stun > 0) { pl.stun -= dt; ix = iy = 0; if (Math.random() < 0.3) part(pl.x + rnd(-10, 10), pl.y - 60, rnd(-30, 30), -40, 0.5, A.P.white, 6, 8, 0.8); }
    var slowF = 1;
    for (var ci = 0; ci < CLOUDS.length; ci++) { var c0 = CLOUDS[ci]; if (c0.on && c0.enemy) { var ddx = pl.x - c0.x, ddy = pl.y - c0.y; if (ddx * ddx + ddy * ddy < c0.r * c0.r) slowF = Math.min(slowF, 1 - c0.slow); } }
    var spd = ST.speed * (pl.charging ? 0.55 : 1) * slowF;
    if (pl.dashT > 0) {
      pl.dashT -= dt; pl.x += pl.dvx * dt; pl.y += pl.dvy * dt;
      if (Math.random() < (pl.rocket ? 1 : 0.5)) { var bh = behind(); part(bh[0], bh[1], -pl.dvx * 0.2 + rnd(-30, 30), -pl.dvy * 0.2 + rnd(-30, 30), 0.5, G.evos.fire ? A.P.fire : A.P.green, pl.rocket ? 16 : 10, 30, 0.9); if (G.evos.fire && Math.random() < 0.5) bolt(bh[0], bh[1], bh[0] - pl.dvx * 0.12 + rnd(-30, 30), bh[1] - pl.dvy * 0.12 + rnd(-30, 30), 0.14, 2.6, 1); }
      // 돌진하며 부딪친 적
      var qd = query(pl.x, pl.y - 10, pl.rocket ? 44 : 30);
      for (var qi = 0; qi < qd.length; qi++) { var ee = qd[qi]; if (ee.dashHit === G.blasts) continue; ee.dashHit = G.blasts; var dl = Math.sqrt(pl.dvx * pl.dvx + pl.dvy * pl.dvy) || 1; hurtEnemy(ee, (pl.rocket ? 70 : 30 * ST.dashDmg * 3) * ST.dmgMul * (1 + G.t / 400), pl.dvx / dl * 500, pl.dvy / dl * 500, 'blast'); }
      if (pl.rocket && pl.dashT <= 0) cloud(pl.x, pl.y, 70, 1.5, ST.cloudDps, 'stink');
    }
    pl.x += (ix * spd + pl.kvx) * dt; pl.y += (iy * spd + pl.kvy) * dt;
    var kd = Math.exp(-7 * dt); pl.kvx *= kd; pl.kvy *= kd;
    if (ix > 0.1) pl.face = 1; else if (ix < -0.1) pl.face = -1;
    pl.moving = il > 0.1 && pl.stun <= 0;
    if (pl.moving) pl.walk += dt * 9;
    pl.iframe -= dt; pl.hurtT -= dt; pl.squash *= Math.exp(-8 * dt); pl.puffT -= dt;
    if (pl.exprT > 0) { pl.exprT -= dt; if (pl.exprT <= 0) pl.expr = 'normal'; }
    pl.hp = Math.min(pl.maxhp, pl.hp + ST.regen * dt);
    // ── 배 가스 → 모으기 → 방귀
    var want = input.fart && pl.stun <= 0;
    if (!pl.charging) {
      pl.belly = Math.min(100, pl.belly + ST.gasRegen * dt);
      if (want && !pl.heldFart) {
        pl.heldFart = true;
        if (pl.belly >= 8) { pl.charging = true; pl.charge = 0; pl.capT = 0; S.chargeStart(); }
      }
      if (pl.belly >= 100) { pl.fullT += dt; if (pl.fullT > 6) { pl.fullT = 0; bujijik(); } } else pl.fullT = 0;
    } else {
      pl.charge = Math.min(pl.belly, pl.charge + ST.chargeSpd * dt);
      var capped = pl.charge >= pl.belly - 0.01;
      if (capped) pl.capT += dt;
      var full = capped && pl.belly >= 99;
      S.chargeSet(pl.charge / 100, full && pl.capT > 0.5);
      pl.expr = 'strain'; pl.exprT = 0.05;
      if (Math.random() < 0.25) part(pl.x + rnd(-18, 18), pl.y - rnd(70, 90), rnd(-20, 20), -30, 0.4, A.P.green, 4, 6, 0.6);
      if (full && pl.capT > 1.3) bujijik();
      else if (!want) {
        pl.charging = false;
        var pwr = pl.charge / 100, perfect = full && pl.capT > 0 && pl.capT < 0.38;
        pl.belly -= pl.charge; pl.charge = 0;
        blast(pwr, perfect);
      }
    }
    if (!input.fart) pl.heldFart = false;
    // 자동 뿡
    pl.puffCd -= dt;
    if (pl.puffCd <= 0 && pl.stun <= 0) { pl.puffCd = ST.puffInt; autoPuff(); }
    // 마늘 오라
    if (ST.auraR) {
      pl.auraCd -= dt;
      if (pl.auraCd <= 0) {
        pl.auraCd = 0.33; pl.auraPulse = (pl.auraPulse || 0) + 1;
        var qa = query(pl.x, pl.y - 10, ST.auraR), push = G.evos.spicyaura && pl.auraPulse % 5 === 0;
        for (var ai = 0; ai < qa.length; ai++) { var ea = qa[ai], adx = ea.x - pl.x, ady = ea.y - pl.y, ad = Math.sqrt(adx * adx + ady * ady) || 1; ea.sick = Math.max(ea.sick, 0.3); hurtEnemy(ea, ST.auraDps * 0.33, adx / ad * (push ? 380 : 40), ady / ad * (push ? 380 : 40), 'aura'); }
        if (push) ring(pl.x, pl.y - 10, 10, ST.auraR, 0.3, 'rgba(255,120,60,', 8);
      }
    }
    // ── 적
    gridBuild();
    spawner(dt);
    var farR = Math.sqrt(VW * VW + VH * VH) / 2 + 260;
    alive = 0;
    for (var i = 0; i < E.length; i++) {
      var e = E[i]; if (!e.on) continue;
      if (e.dead) { e.on = false; continue; }
      alive++;
      updEnemy(e, dt, farR);
    }
    if (boss && boss.on) {
      if (boss.dead) { boss.dieT += dt; if (boss.dieT > 2) boss.on = false; }
      else { bossStatus(boss, dt); bossUpdate(boss, dt); boss.x += boss.kx * dt; boss.y += boss.ky * dt; var bk = Math.exp(-6 * dt); boss.kx *= bk; boss.ky *= bk; }
    }
    // ── 구름
    for (i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i]; if (!c.on) continue;
      c.t += dt; if (c.t >= c.dur) { c.on = false; continue; }
      c.x += c.vx * dt; c.y += c.vy * dt; c.rot += dt * 0.3;
      if (c.kind === 'fire' && !c.enemy) {
        var fn = c.r * c.r * dt / 9000 * (1 - 0.6 * c.t / c.dur);
        while (fn > 0) { if (fn >= 1 || Math.random() < fn) { var fa = Math.random() * TAU, fr = Math.sqrt(Math.random()) * 0.7, ox = c.x + Math.cos(fa) * c.r * fr, oy = c.y + Math.sin(fa) * c.r * 0.7 * fr, fb = Math.random() * TAU, bl3 = c.r * rnd(0.35, 0.6); bolt(ox, oy, ox + Math.cos(fb) * bl3, oy + Math.sin(fb) * bl3 * 0.7, rnd(0.12, 0.2), 2.4, 1); } fn -= 1; }
      }
      if (c.follow) { var tg = nearestEnemy(c.x, c.y, 400); if (tg) { var fx = tg.x - c.x, fy = tg.y - c.y, fd = Math.sqrt(fx * fx + fy * fy) || 1; c.x += fx / fd * 55 * dt; c.y += fy / fd * 55 * dt; } }
      c.tick -= dt;
      if (c.tick <= 0) {
        c.tick = 0.25;
        if (c.enemy) { var pdx = pl.x - c.x, pdy = pl.y - c.y; if (pdx * pdx + pdy * pdy < c.r * c.r) hurtPlayer(c.dps * 0.25 + ST.armor, null, null, 'stinkcloud'); continue; }
        var qc = query(c.x, c.y, c.r);
        for (var j = 0; j < qc.length; j++) {
          var ec = qc[j]; if (ec.def.immune) continue;
          ec.sick = Math.max(ec.sick, 0.6); if (!ec.boss) { ec.fear = Math.max(ec.fear, 0.35); ec.fx = c.x; ec.fy = c.y; }
          if (ST.poison) { ec.poison = 3; ec.pdps = ST.poison; }
          if (c.kind === 'fire') ec.burn = Math.max(ec.burn, 1.5);
          hurtEnemy(ec, c.dps * 0.25, 0, 0, 'cloud');
          if (Math.random() < 0.08) { ec.cough = 0.3; S.cough(); }
        }
      }
    }
    // ── 발사체
    for (i = 0; i < PROJ.length; i++) {
      var s = PROJ[i]; if (!s.on) continue;
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += dt * 8;
      if (s.t > s.life) { s.on = false; if (s.kind === 'balloon') popBalloon(s); continue; }
      if (s.enemy) {
        var sx = pl.x - s.x, sy = pl.y - 20 - s.y;
        if (sx * sx + sy * sy < (s.r + 14) * (s.r + 14)) { hurtPlayer(s.dmg, s.x, s.y, s.kind); s.on = false; if (s.kind === 'water') { S.splash(); for (var w = 0; w < 5; w++) part(s.x, s.y, rnd(-80, 80), rnd(-80, 80), 0.3, A.P.water, 6, 6, 0.9); } if (s.kind === 'balloon') popBalloon(s); }
        if (s.kind === 'balloon') { s.vx *= Math.exp(-1.2 * dt); s.vy *= Math.exp(-1.2 * dt); }
      } else {
        var qs = query(s.x, s.y, s.r);
        for (var k = 0; k < qs.length && s.on; k++) { var es = qs[k]; if (es === s.hit) continue; s.hit = es; hurtEnemy(es, s.dmg, s.vx * 0.4, s.vy * 0.4, 'blast'); s.pierce--; if (s.pierce <= 0) s.on = false; }
      }
    }
    // ── 보석·줍기
    var pr = ST.pickup;
    for (i = 0; i < GEMS.length; i++) {
      var g = GEMS[i]; if (!g.on) continue;
      g.t += dt;
      var gx = pl.x - g.x, gy = pl.y - 20 - g.y, gd2 = gx * gx + gy * gy;
      if (!g.mag && gd2 < pr * pr) g.mag = true;
      if (g.mag) { var gd = Math.sqrt(gd2) || 1, gs = 260 + g.t * 60 + Math.min(600, g.magT = (g.magT || 0) + dt * 900); g.x += gx / gd * gs * dt; g.y += gy / gd * gs * dt; if (gd < 16) { g.on = false; gainXp(g.v); S.gem(); } }
      else { g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= Math.exp(-5 * dt); g.vy *= Math.exp(-5 * dt); }
    }
    for (i = 0; i < PICKS.length; i++) {
      var pk = PICKS[i]; if (!pk.on) continue;
      pk.t += dt;
      var kx = pl.x - pk.x, ky = pl.y - 20 - pk.y, kd2 = kx * kx + ky * ky;
      if (!pk.mag && kd2 < pr * pr * 0.8) pk.mag = true;
      if (pk.mag) { var kd0 = Math.sqrt(kd2) || 1; pk.x += kx / kd0 * 380 * dt; pk.y += ky / kd0 * 380 * dt; if (kd0 < 18) { pk.on = false; collect(pk); } }
      else { pk.x += pk.vx * dt; pk.y += pk.vy * dt; pk.vx *= Math.exp(-4 * dt); pk.vy *= Math.exp(-4 * dt); }
    }
    // ── 미뤄 둔 일
    for (i = DELAY.length - 1; i >= 0; i--) { DELAY[i].t -= dt; if (DELAY[i].t <= 0) { var f = DELAY[i].f; DELAY.splice(i, 1); f(); } }
    updateParts(dt);
    G.shake *= Math.exp(-10 * dt); G.flash -= dt; G.redT -= dt;
    if (G.saveT > 5) { G.saveT = 0; saveRun(); }
    if (G.pendingLv > 0 && G.mode === 'play' && !pl.dead) openLv();
  }
  function nearestEnemy(x, y, r) {
    var q = query(x, y, r), best = null, bd = 1e9;
    for (var i = 0; i < q.length; i++) { var dx = q[i].x - x, dy = q[i].y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = q[i]; } }
    return best;
  }
  function bossStatus(e, dt) {
    e.flash -= dt; e.sick -= dt;
    if (e.poison > 0) { e.poison -= dt; e.pTick = (e.pTick || 0) - dt; if (e.pTick <= 0) { e.pTick = 0.5; hurtEnemy(e, e.pdps * 0.5, 0, 0, 'poison'); } }
    if (e.burn > 0) { e.burn -= dt; e.bTick = (e.bTick || 0) - dt; if (e.bTick <= 0) { e.bTick = 0.5; hurtEnemy(e, 5 * ST.dmgMul, 0, 0, 'burn'); } }
  }
  function updEnemy(e, dt, farR) {
    var d0 = e.def, dx = pl.x - e.x, dy = pl.y - e.y, d = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / d, uy = dy / d;
    // 너무 멀어지면 반대편 가장자리로 옮긴다
    if (d > farR && !e.elite) { var a = Math.atan2(dy, dx) + rnd(-0.6, 0.6), R = farR - 280; e.x = pl.x + Math.cos(a) * R; e.y = pl.y + Math.sin(a) * R; e.line = 0; return; }
    e.anim += dt; e.flash -= dt; e.sick -= dt; e.hitCd -= dt; e.cough -= dt;
    bossStatus(e, dt);
    if (e.dead) return;
    var sp = e.spd * (e.sick > 0 ? 0.75 : 1), vx = 0, vy = 0;
    if (e.fear > 0 && !d0.immune) {
      e.fear -= dt; var fx = e.x - e.fx, fy = e.y - e.fy, fd = Math.sqrt(fx * fx + fy * fy) || 1; vx = fx / fd * sp * 0.9; vy = fy / fd * sp * 0.9;
    } else if (e.line > 0) {
      e.line -= dt; vx = e.dx * sp * 1.6; vy = e.dy * sp * 1.6;
    } else {
      switch (d0.beh) {
        case 'swarm': var wv = Math.sin(e.anim * 4 + e.wob) * 0.7; vx = (ux - uy * wv) * sp; vy = (uy + ux * wv) * sp; break;
        case 'dash':
          e.stT -= dt;
          if (e.st === 0) { vx = ux * sp; vy = uy * sp; if (e.stT <= 0 && d < 320) { e.st = 1; e.stT = 0.45; } }
          else if (e.st === 1) { vx = vy = 0; e.x += rnd(-1, 1); if (e.stT <= 0) { e.st = 2; e.stT = 0.5; e.dx = ux; e.dy = uy; } }
          else { vx = e.dx * sp * 3.4; vy = e.dy * sp * 3.4; if (e.stT <= 0) { e.st = 0; e.stT = rnd(2, 3.5); } }
          break;
        case 'roll':
          vx = e.dx * sp; vy = e.dy * sp;
          if (d > 420 && (e.dx * ux + e.dy * uy) < 0) { var a2 = Math.atan2(dy, dx) + rnd(-0.25, 0.25); e.dx = Math.cos(a2); e.dy = Math.sin(a2); }
          break;
        case 'float': vx = ux * sp; vy = uy * sp + Math.sin(e.anim * 2 + e.wob) * 20; break;
        case 'ranged':
          if (d > 230) { vx = ux * sp; vy = uy * sp; } else if (d < 160) { vx = -ux * sp; vy = -uy * sp; } else { vx = -uy * sp * 0.6; vy = ux * sp * 0.6; }
          e.shoot -= dt; if (e.shoot <= 0 && d < 380) { e.shoot = rnd(2.8, 3.6); shot(e.x + e.face * 20, e.y - 32, ux * 200, uy * 200, 6 * stageDef().dmg, 'water', true); }
          break;
        case 'spray':
          vx = ux * sp; vy = uy * sp;
          e.shoot -= dt;
          if (e.shoot <= 0 && d < 360) {
            e.shoot = rnd(3, 4.2);
            // 방향제: 주변 방귀 구름을 지우고 향기 덩어리를 쏜다
            for (var ci = 0; ci < CLOUDS.length; ci++) { var c = CLOUDS[ci]; if (c.on && !c.enemy) { var cdx = c.x - e.x, cdy = c.y - e.y; if (cdx * cdx + cdy * cdy < 110 * 110) c.t = Math.max(c.t, c.dur - 0.3); } }
            for (var k = 0; k < 8; k++) { var a3 = Math.random() * TAU; part(e.x, e.y - 60, Math.cos(a3) * 90, Math.sin(a3) * 90 - 30, 0.7, A.P.pink, 10, 40, 0.8); }
            shot(e.x, e.y - 50, ux * 160, uy * 160, 6 * stageDef().dmg, 'mist', true);
          }
          break;
        default: vx = ux * sp; vy = uy * sp;
      }
    }
    if (d0.stinky) { e.stink -= dt; if (e.stink <= 0) { e.stink = rnd(3.5, 5); cloud(e.x, e.y, 34, 2.5, 3 * stageDef().dmg, 'enemy', { enemy: true, slow: 0.2 }); } }
    // 밀림
    e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
    var kd = Math.exp(-5 * dt); e.kx *= kd; e.ky *= kd;
    // 서로 겹치지 않게 살짝 민다 (같은 칸만)
    var cxi = Math.floor(e.x / CELL) - gx0, cyi = Math.floor(e.y / CELL) - gy0;
    if (cxi >= 0 && cyi >= 0 && cxi < GN && cyi < GN) {
      var j = GRID[cyi * GN + cxi], n = 0;
      while (j >= 0 && n < 6) {
        var o = E[j];
        if (o !== e && !o.dead) { var ox = e.x - o.x, oy = e.y - o.y, rr = (e.r + o.r) * 0.8, od2 = ox * ox + oy * oy; if (od2 < rr * rr && od2 > 0.01) { var od = Math.sqrt(od2), pu = (rr - od) * 0.5; e.x += ox / od * pu; e.y += oy / od * pu; } n++; }
        j = NEXT[j];
      }
    }
    if (Math.abs(vx) > 2) e.face = vx > 0 ? 1 : -1;
    // 닿으면 아프다
    if (d < e.r + pl.r + 4 && e.hitCd <= 0 && !pl.dead) { hurtPlayer(e.dmg, e.x, e.y, e.id); e.hitCd = 1; }
  }
  function popBalloon(s) {
    ring(s.x, s.y, 4, 60, 0.25, 'rgba(255,90,90,', 5);
    for (var k = 0; k < 6; k++) part(s.x, s.y, rnd(-120, 120), rnd(-120, 120), 0.3, A.P.pink, 6, 4, 1);
    if (spawnEnemy('balloon', s.x, s.y, { sc: 0.6, hpMul: 0.35 })) alive++;
    S.pop();
  }
  function updateParts(dt) {
    for (var i = 0; i < PARTS.length; i++) {
      var p = PARTS[i]; if (!p.on) continue;
      p.t += dt; if (p.t >= p.life) { p.on = false; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; var dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vy *= dr; p.rot += p.vr * dt;
      if (p.g) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.4; } }
    }
    for (i = 0; i < RINGS.length; i++) { var r = RINGS[i]; if (r.on) { r.t += dt; if (r.t >= r.life) r.on = false; } }
    for (i = 0; i < BOLTS.length; i++) { var bo = BOLTS[i]; if (bo.on) { bo.t += dt; if (bo.t >= bo.life) bo.on = false; } }
    for (i = 0; i < TEXTS.length; i++) { var t = TEXTS[i]; if (t.on) { t.t += dt; t.y -= 40 * dt; if (t.t >= t.life) t.on = false; } }
  }
  function collect(pk) {
    if (pk.kind === 'coin') { var v = Math.round(pk.v * ST.coinMul); G.coins += v; S.coin(); text(pl.x, pl.y - 126, '+' + v, '#ffd23a', 20); }
    else if (pk.kind === 'snack') { pl.hp = Math.min(pl.maxhp, pl.hp + 30); pl.belly = Math.min(100, pl.belly + 50); S.pick(); text(pl.x, pl.y - 126, '+30', '#7dff8a', 22); pl.expr = 'relief'; pl.exprT = 0.8; }
    else if (pk.kind === 'magnet') { for (var i = 0; i < GEMS.length; i++) if (GEMS[i].on) GEMS[i].mag = true; S.levelup(); }
    else if (pk.kind === 'lunch') { S.evo(); openLunch(); }
  }
  function gainXp(v) {
    G.xp += v;
    while (G.xp >= G.need) { G.xp -= G.need; G.lv++; G.need = D.need(G.lv); G.pendingLv++; }
  }

  // ─────────────── 레벨업 카드 ───────────────
  function evoReady() {
    var out = [];
    D.EVOS.forEach(function (ev) { if (!G.evos[ev.id] && (G.foods[ev.a] || 0) >= D.FOOD[ev.a].max && (G.foods[ev.b] || 0) >= 1) out.push(ev); });
    return out;
  }
  function slotsUsed() { var n = 0; for (var k in G.foods) if (G.foods[k] > 0) n++; return n; }
  function rollCards(forceEvo) {
    var cards = [], evs = evoReady();
    evs.forEach(function (ev) { if (cards.length < (forceEvo ? 3 : 1)) cards.push({ evo: ev }); });
    var pool = [];
    D.FOODS.forEach(function (f) {
      var lv = G.foods[f.id] || 0;
      if (lv >= f.max) return;
      if (!lv && slotsUsed() >= D.SLOTS) return;
      pool.push({ food: f, w: lv ? 3 : 2 });
    });
    while (cards.length < 3 && pool.length) {
      var tot = 0, i; for (i = 0; i < pool.length; i++) tot += pool[i].w;
      var r = Math.random() * tot; for (i = 0; i < pool.length; i++) { r -= pool[i].w; if (r <= 0) break; }
      i = Math.min(i, pool.length - 1);
      cards.push({ food: pool[i].food }); pool.splice(i, 1);
    }
    if (cards.length < 3) cards.push({ heal: 1 });
    if (cards.length < 3) cards.push({ coin: 1 });
    return cards;
  }
  var curCards = [], lvSel = 0, lvSource = 'lv';
  function openLv() {
    G.pendingLv--;
    lvSource = 'lv';
    curCards = rollCards(false);
    showCards('LEVEL UP');
    S.levelup();
  }
  function openLunch() {
    lvSource = 'lunch';
    var evs = evoReady();
    if (evs.length) { curCards = rollCards(true); showCards('도시락'); }
    else { G.pendingLv += 1; G.coins += Math.round(20 * ST.coinMul); text(pl.x, pl.y - 126, '+' + Math.round(20 * ST.coinMul), '#ffd23a', 22); }
  }
  function cardHTML(c, i) {
    var icon, name, lv = '', stat, cls = 'card';
    if (c.evo) { icon = c.evo.id; name = c.evo.name; stat = c.evo.stat; cls += ' evo'; lv = 'EVO'; }
    else if (c.food) { var cur = G.foods[c.food.id] || 0; icon = c.food.id; name = c.food.name; stat = c.food.stat(cur + 1); lv = cur ? 'Lv ' + (cur + 1) : 'NEW'; if (!cur) cls += ' new'; }
    else if (c.heal) { icon = 'hp'; name = '간식'; stat = '체력 +40'; }
    else { icon = 'coin'; name = '코인'; stat = '코인 +30'; }
    return '<button class="' + cls + '" data-i="' + i + '"><img src="' + A.url(icon) + '" alt=""><span class="ct"><b class="cn">' + name + '</b><i class="cl">' + lv + '</i><span class="cs">' + stat + '</span></span><span class="ck">' + (i + 1) + '</span></button>';
  }
  function showCards(title) {
    G.mode = 'lvup'; S.suspend(false); S.chargeStop(); pl.charging = false; pl.charge = 0; input.fart = false; pl.heldFart = true;
    $('lvT').textContent = title; $('word').classList.remove('show');
    var box = $('cards'); box.innerHTML = curCards.map(cardHTML).join('');
    Array.prototype.forEach.call(box.querySelectorAll('.card'), function (b) { b.onclick = function () { pickCard(+b.dataset.i); }; b.onmouseenter = function () { lvSel = +b.dataset.i; markSel(); }; });   // 마우스를 올린 카드가 곧 선택 카드 — 두 장이 같이 칠해지던 것(2026-09-25)
    lvSel = 0; markSel();
    $('bReroll').hidden = !(G.rerolls > 0) || lvSource === 'lunch'; $('rerollN').textContent = G.rerolls;
    document.body.classList.add('modal', 'lvon');
    $('lvup').hidden = false; $('lvup').classList.remove('in'); void $('lvup').offsetWidth; $('lvup').classList.add('in');
    G.cardOpenT = performance.now();
  }
  function markSel() { Array.prototype.forEach.call($('cards').querySelectorAll('.card'), function (b, i) { b.classList.toggle('sel', i === lvSel); }); }
  function pickCard(i) {
    if (G.mode !== 'lvup' || performance.now() - G.cardOpenT < 250) return;
    var c = curCards[i]; if (!c) return;
    if (c.evo) { G.evos[c.evo.id] = 1; P.seenF[c.evo.id] = 1; word(c.evo.name, 4); S.evo(); G.flash = 0.35; }
    else if (c.food) { G.foods[c.food.id] = (G.foods[c.food.id] || 0) + 1; P.seenF[c.food.id] = 1; S.pick(); }
    else if (c.heal) { pl.hp = Math.min(pl.maxhp, pl.hp + 40); S.pick(); }
    else { G.coins += 30; S.coin(); }
    saveProg();
    calc();
    $('lvup').hidden = true; document.body.classList.remove('modal', 'lvon');
    G.mode = 'play';
    pl.expr = 'relief'; pl.exprT = 0.7; pl.squash = 0.25;
    for (var k = 0; k < 10; k++) { var a = k / 10 * TAU; part(pl.x, pl.y - 40, Math.cos(a) * 160, Math.sin(a) * 160, 0.45, A.P.gold, 8, 6, 1); }
    renderFoods();
  }
  function reroll() { if (G.rerolls <= 0 || G.mode !== 'lvup') return; G.rerolls--; curCards = rollCards(false); showCards('LEVEL UP'); S.click(); }

  // ─────────────── 한 판 시작·끝 ───────────────
  function resetRun(stage) {
    [E, GEMS, CLOUDS, PROJ, PARTS, RINGS, PICKS, TEXTS, BOLTS].forEach(function (a) { for (var i = 0; i < a.length; i++) a[i].on = false; });
    DELAY.length = 0; boss = null; alive = 0;
    G.stage = stage; G.t = 0; G.lv = 1; G.xp = 0; G.need = D.need(1); G.foods = {}; G.evos = {}; G.kills = 0; G.coins = 0; G.pendingLv = 0;
    G.spawnAcc = 0; G.evI = 0; G.bossWarned = false; G.bossSpawned = false; G.clearT = null; G.slow = 0; G.hitstop = 0; G.shake = 0; G.flash = 0; G.redT = 0; G.blasts = 0; G.blastKills = 0; G.saveT = 0;
    G.rerolls = P.shop.reroll; G.revives = P.shop.revive;
    pl.x = 0; pl.y = 0; pl.kvx = 0; pl.kvy = 0; pl.face = 1; pl.walk = 0; pl.belly = 40; pl.charge = 0; pl.charging = false; pl.capT = 0; pl.fullT = 0; pl.stun = 0; pl.iframe = 0; pl.hurtT = 0; pl.squash = 0;
    pl.expr = 'normal'; pl.exprT = 0; pl.puffCd = 1; pl.auraCd = 0; pl.dashT = 0; pl.dead = false; pl.heldFart = true; pl.maxhp = null; pl.hp = null;
    calc(); pl.hp = pl.maxhp;
    cam.x = 0; cam.y = 0;
    $('bossbar').hidden = true;
  }
  function startStage(stage, snap) {
    S.unlock();
    resetRun(stage);
    if (snap) {
      G.t = snap.t; G.lv = snap.lv; G.xp = snap.xp; G.need = D.need(G.lv); G.foods = snap.foods || {}; G.evos = snap.evos || {}; G.kills = snap.kills; G.coins = snap.coins;
      G.rerolls = snap.rerolls; G.revives = snap.revives; G.pendingLv = snap.pending || 0;   // 레벨업 카드 고르던 중에 나가면 이어할 때 그 카드가 사라지던 것(2026-09-26)
      var sd = stageDef(); while (G.evI < sd.events.length && sd.events[G.evI][0] <= G.t) G.evI++;
      if (G.t >= D.BOSS_T - 3) { G.bossWarned = true; }
      calc(); pl.hp = Math.min(pl.maxhp, snap.hp); pl.belly = snap.belly || 40;
    }
    hideAll(); document.body.classList.add('playing');
    G.mode = 'play';
    // 시작하자마자 손맛: 가까이에 한 무리
    var first = stageDef().bands[Math.min(8, minute())];
    for (var i = 0; i < 10; i++) { var a = i / 10 * TAU + rnd(-0.2, 0.2), R = rnd(230, 320); spawnEnemy(pickW(first), pl.x + Math.cos(a) * R, pl.y + Math.sin(a) * R); alive++; }
    S.music(G.bossSpawned ? 5 : stage);
    renderFoods();
    hud(true);
    saveRun();
  }
  function saveRun() {
    if (G.mode !== 'play' && G.mode !== 'lvup' && G.mode !== 'pause') return;
    if (pl.dead || G.clearT != null) return;
    saveJ('run', { stage: G.stage, t: G.t, lv: G.lv, xp: G.xp, foods: G.foods, evos: G.evos, kills: G.kills, coins: G.coins, hp: pl.hp, belly: pl.belly, rerolls: G.rerolls, revives: G.revives, pending: G.pendingLv + (G.mode === 'lvup' ? 1 : 0) });   // 카드 고르던 중이면 그 한 장도 센다
  }
  function gameOver() {
    G.mode = 'over';
    var earned = G.coins + Math.floor(G.kills / 20);
    P.coins += earned; P.kills += G.kills; P.best[G.stage] = Math.max(P.best[G.stage] || 0, Math.floor(G.t)); saveProg(); delJ('run');
    $('overStat').innerHTML = statLine(earned);
    S.music(-1); S.over();
    document.body.classList.remove('playing');
    showScreen('over');
  }
  function stageClear() {
    var earned = G.coins + Math.floor(G.kills / 20) + 80 * (G.stage + 1);
    P.coins += earned; P.kills += G.kills; P.cleared[G.stage] = 1; P.unlocked = Math.max(P.unlocked, Math.min(5, G.stage + 2)); P.best[G.stage] = Math.max(P.best[G.stage] || 0, Math.floor(G.t));
    delJ('run');
    document.body.classList.remove('playing');
    S.music(-1);
    if (G.stage === 4) { P.ended = 1; saveProg(); G.mode = 'ending'; showEnding(earned); return; }
    saveProg();
    G.mode = 'clear';
    $('clearStat').innerHTML = statLine(earned);
    S.clear();
    showScreen('clear');
  }
  function statLine(earned) {
    return '<span>' + fmt(G.t) + '</span><span>KILL ' + G.kills + '</span><span class="cn"><img src="' + A.url('coin') + '" alt="">+' + earned + '</span>';
  }

  // ─────────────── 그리기 ───────────────
  var DRAW = [];
  function spr(sp, x, y, sc, face, alpha, rot) {
    var b = DPR * SC, s = b * sp.k * sc;
    var sx = DPR * W / 2 + (x - cam.x) * b, sy = DPR * H / 2 + (y - cam.y) * b;
    if (rot) { var c = Math.cos(rot), sn = Math.sin(rot); cx.setTransform(face * s * c, face * s * sn, -s * sn, s * c, sx, sy); }
    else cx.setTransform(face * s, 0, 0, s, sx, sy);
    if (alpha != null && alpha < 1) { cx.globalAlpha = alpha; cx.drawImage(sp.c, -sp.ax, -sp.ay); cx.globalAlpha = 1; }
    else cx.drawImage(sp.c, -sp.ax, -sp.ay);
  }
  function worldT() { var b = DPR * SC; cx.setTransform(b, 0, 0, b, DPR * W / 2 - cam.x * b, DPR * H / 2 - cam.y * b); }
  function vis(x, y, m) { return x > cam.x - VW / 2 - m && x < cam.x + VW / 2 + m && y > cam.y - VH / 2 - m && y < cam.y + VH / 2 + m; }
  function hash(a, b) { var h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function drawGround(stage) {
    var T = A.TILE, tile = A.T[stage];
    worldT();
    var x0 = Math.floor((cam.x - VW / 2) / T), x1 = Math.floor((cam.x + VW / 2) / T), y0 = Math.floor((cam.y - VH / 2) / T), y1 = Math.floor((cam.y + VH / 2) / T);
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) cx.drawImage(tile, tx * T, ty * T, T + 0.5, T + 0.5);
    // 흩어 놓은 장식
    var CH = 360, dec = A.D[stage];
    var c0 = Math.floor((cam.x - VW / 2 - 80) / CH), c1 = Math.floor((cam.x + VW / 2 + 80) / CH), r0 = Math.floor((cam.y - VH / 2 - 60) / CH), r1 = Math.floor((cam.y + VH / 2 + 60) / CH);
    for (var cy2 = r0; cy2 <= r1; cy2++) for (var cx2 = c0; cx2 <= c1; cx2++) {
      for (var k = 0; k < 3; k++) {
        var h = hash(cx2 * 7 + k, cy2 * 13 - k);
        if (h > 0.75) continue;
        var dx = cx2 * CH + hash(cx2 + k * 31, cy2) * CH, dy = cy2 * CH + hash(cx2, cy2 + k * 17) * CH;
        var sp = dec[Math.floor(hash(cx2 - k, cy2 * 3) * dec.length)];
        spr(sp, dx, dy, 1, 1);
      }
    }
  }
  function render() {
    if (!A.ready) return;
    var tnow = performance.now() / 1000;
    // 카메라
    var shx = G.shake > 0.3 ? rnd(-G.shake, G.shake) : 0, shy = G.shake > 0.3 ? rnd(-G.shake, G.shake) : 0;
    cam.x += shx; cam.y += shy;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    var stage = G.mode === 'title' || G.mode === 'menu' ? 0 : G.stage;
    drawGround(stage);
    worldT();
    // 줍는 것
    for (var i = 0; i < GEMS.length; i++) { var g = GEMS[i]; if (g.on && vis(g.x, g.y, 20)) spr(A.gem[g.kind], g.x, g.y + Math.sin(tnow * 5 + i) * 2, g.kind === 2 ? 1.3 : 1, 1); }
    for (i = 0; i < PICKS.length; i++) {
      var pk = PICKS[i]; if (!pk.on || !vis(pk.x, pk.y, 40)) continue;
      var bob = Math.sin(tnow * 4 + i) * 3;
      if (pk.kind === 'coin') spr(A.coinS, pk.x, pk.y + bob, pk.v >= 20 ? 1.8 : 1, 1);
      else if (pk.kind === 'snack') spr(A.snack, pk.x, pk.y + bob, 1, 1);
      else if (pk.kind === 'lunch') { worldT(); cx.globalAlpha = 0.5 + 0.3 * Math.sin(tnow * 6); cx.fillStyle = '#ffe066'; A.circ(cx, pk.x, pk.y - 16, 30); cx.fill(); cx.globalAlpha = 1; spr(A.lunchS, pk.x, pk.y + bob, 1.2, 1); }
      else if (pk.kind === 'magnet') { worldT(); cx.drawImage(A.I.magnet, pk.x - 18, pk.y - 36 + bob, 36, 36); }
    }
    // 적 구름(발밑)
    for (i = 0; i < CLOUDS.length; i++) { var c = CLOUDS[i]; if (c.on && c.enemy && vis(c.x, c.y, c.r)) drawCloud(c); }
    // 마늘 오라
    if (ST.auraR && G.mode !== 'title') {
      worldT(); var ar = ST.auraR * (1 + 0.05 * Math.sin(tnow * 6));
      cx.fillStyle = G.evos.spicyaura ? 'rgba(255,120,60,.14)' : 'rgba(255,240,170,.16)'; A.circ(cx, pl.x, pl.y - 10, ar); cx.fill();
      cx.strokeStyle = G.evos.spicyaura ? 'rgba(255,110,50,.5)' : 'rgba(255,240,170,.45)'; cx.lineWidth = 3; cx.stroke();
    }
    // 적 + 주인공 + 보스를 y 순서로
    DRAW.length = 0;
    for (i = 0; i < E.length; i++) { var e = E[i]; if (e.on && !e.dead && vis(e.x, e.y, 80)) DRAW.push(e); }
    if (boss && boss.on && !boss.dead) DRAW.push(boss);
    DRAW.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < DRAW.length; i++) {
      var o = DRAW[i];
      if (o === pl) drawPlayer(tnow);
      else if (o.boss) drawBoss(o, tnow);
      else drawEnemy(o, tnow);
    }
    // 방귀 구름 (위에 겹쳐 흐리게)
    for (i = 0; i < CLOUDS.length; i++) { c = CLOUDS[i]; if (c.on && !c.enemy && vis(c.x, c.y, c.r)) drawCloud(c); }
    // 발사체
    for (i = 0; i < PROJ.length; i++) {
      var s = PROJ[i]; if (!s.on || !vis(s.x, s.y, 30)) continue;
      if (s.kind === 'water') spr({ c: A.P.water, ax: 24, ay: 24, k: 1 }, s.x, s.y, 0.5, 1);
      else if (s.kind === 'mist') spr({ c: A.P.pink, ax: 24, ay: 24, k: 1 }, s.x, s.y, 0.8, 1);
      else if (s.kind === 'balloon') spr(A.E.balloon[0].n, s.x, s.y + 30, 0.7, 1, 1, Math.sin(s.t * 5) * 0.3);
      else if (s.kind === 'mop') { worldT(); cx.save(); cx.translate(s.x, s.y); cx.rotate(s.rot); cx.fillStyle = '#f4f0e4'; cx.strokeStyle = '#6a6452'; cx.lineWidth = 2; A.ell(cx, 0, 0, 14, 6); cx.fill(); cx.stroke(); cx.fillStyle = '#3a6ad8'; cx.fillRect(-3, -3, 6, 6); cx.restore(); }
      else if (s.kind === 'cereal') { worldT(); cx.fillStyle = '#ffc84a'; cx.strokeStyle = '#8a4a0a'; cx.lineWidth = 1.5; A.ell(cx, s.x, s.y, 6, 4, s.rot); cx.fill(); cx.stroke(); }
    }
    // 조각
    for (i = 0; i < PARTS.length; i++) {
      var p = PARTS[i]; if (!p.on || !vis(p.x, p.y, 100)) continue;
      var u = p.t / p.life;
      if (p.img) { spr(p.img, p.x, p.y - p.z, p.size * (1 + u * 0.4), p.face, 1 - u * u, p.rot); continue; }
      var sz = p.size + p.grow * u, al = p.a * (1 - u);
      worldT(); cx.globalAlpha = al; cx.drawImage(p.sp, p.x - sz, p.y - sz, sz * 2, sz * 2); cx.globalAlpha = 1;
    }
    // 주인공은 늘 맨 위 (자기 방귀 구름·조각에 가리지 않게)
    if (G.mode !== 'menu') drawPlayer(tnow);
    drawBolts();
    // 고리
    worldT();
    for (i = 0; i < RINGS.length; i++) {
      var r = RINGS[i]; if (!r.on) continue;
      var ru = r.t / r.life, rr = r.r0 + (r.r1 - r.r0) * (1 - Math.pow(1 - ru, 3));
      cx.strokeStyle = r.col + (1 - ru) * 0.9 + ')'; cx.lineWidth = r.lw * (1 - ru * 0.7);
      A.ell(cx, r.x, r.y, rr, rr * 0.8); cx.stroke();
    }
    // 숫자
    for (i = 0; i < TEXTS.length; i++) {
      var t = TEXTS[i]; if (!t.on) continue;
      worldT(); cx.globalAlpha = 1 - (t.t / t.life) * (t.t / t.life);
      cx.font = '800 ' + t.size + 'px Cute, sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 5; cx.strokeStyle = '#1b2a5a'; cx.strokeText(t.s, t.x, t.y); cx.fillStyle = t.col; cx.fillText(t.s, t.x, t.y);
      cx.globalAlpha = 1;
    }
    // 보스 방향 화살표
    if (boss && boss.on && !boss.dead && !vis(boss.x, boss.y, -30)) drawArrow(boss.x, boss.y);
    for (i = 0; i < E.length; i++) { var el = E[i]; if (el.on && el.elite && !el.dead && !vis(el.x, el.y, -30)) drawArrow(el.x, el.y, '#ffd23a'); }
    // 화면 덮개
    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (G.flash > 0) { cx.fillStyle = 'rgba(255,255,230,' + Math.min(0.6, G.flash) + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
    if (G.redT > 0) { cx.fillStyle = 'rgba(255,40,60,' + G.redT * 0.9 + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
    if (pl.charging && pl.capT > 0.5 && pl.belly >= 99) { cx.fillStyle = 'rgba(255,80,60,' + (0.08 + 0.08 * Math.sin(tnow * 30)) + ')'; cx.fillRect(0, 0, cv.width, cv.height); }
    if (vign) cx.drawImage(vign, 0, 0, cv.width, cv.height);
    cam.x -= shx; cam.y -= shy;
  }
  function drawArrow(x, y, col) {
    var dx = x - cam.x, dy = y - cam.y, a = Math.atan2(dy, dx);
    var hx = VW / 2 - 30, hy = VH / 2 - 40, k = Math.min(hx / Math.abs(Math.cos(a) || 1e-6), hy / Math.abs(Math.sin(a) || 1e-6));
    var px = cam.x + Math.cos(a) * k, py = cam.y + Math.sin(a) * k;
    worldT(); cx.save(); cx.translate(px, py); cx.rotate(a);
    cx.beginPath(); cx.moveTo(18, 0); cx.lineTo(-10, -13); cx.lineTo(-4, 0); cx.lineTo(-10, 13); cx.closePath();
    cx.fillStyle = col || '#ff4a4a'; cx.fill(); cx.lineWidth = 4; cx.strokeStyle = '#1b2a5a'; cx.stroke();
    cx.restore();
  }
  function drawCloud(c) {
    var u = c.t / c.dur, al = u < 0.1 ? u / 0.1 : 1 - Math.max(0, (u - 0.6) / 0.4);
    var img = A.C[c.kind] || A.C.stink, r = c.r * (0.85 + 0.2 * Math.min(1, u * 4)) * (1 + 0.04 * Math.sin(c.t * 5 + c.rot));
    worldT(); cx.globalAlpha = al * (c.enemy ? 0.6 : 0.42);
    cx.save(); cx.translate(c.x, c.y); cx.rotate(Math.sin(c.rot) * 0.2); cx.drawImage(img, -r, -r * 0.8, r * 2, r * 1.6); cx.restore();
    cx.globalAlpha = 1;
  }
  function drawEnemy(e, tnow) {
    var fr = A.E[e.id][Math.floor(e.anim * (e.def.fly ? 12 : 6)) % 2];
    var sp = e.flash > 0 ? fr.w : e.sick > 0 ? fr.g : fr.n;
    var sc = e.sc, yo = 0;
    if (e.def.beh === 'dash' && e.st === 1) sc *= 1 + Math.sin(tnow * 40) * 0.05;
    if (e.elite) {
      worldT(); cx.globalAlpha = 0.35 + 0.15 * Math.sin(tnow * 6); cx.fillStyle = '#ffd23a'; A.ell(cx, e.x, e.y - 4, e.r * 1.6, e.r * 0.6); cx.fill(); cx.globalAlpha = 1;
    }
    if (e.cough > 0) yo = Math.sin(tnow * 50) * 2;
    spr(sp, e.x, e.y + yo, sc, e.face);
    if (e.burn > 0 && Math.random() < 0.18) { var er = e.r * (e.boss ? 1 : e.sc || 1) * (e.boss ? 2.2 : 1.6), ea = Math.random() * TAU; bolt(e.x + Math.cos(ea) * er * 0.3, e.y - er * 0.8 + Math.sin(ea) * er * 0.3, e.x + Math.cos(ea + 2.4) * er, e.y - er * 0.8 + Math.sin(ea + 2.4) * er * 0.8, 0.12, e.boss ? 3 : 1.8, e.boss ? 1 : 0); }
    if (e.poison > 0 && Math.random() < 0.15) part(e.x + rnd(-8, 8), e.y - rnd(10, 30), 0, -30, 0.4, A.P.purple, 5, 4, 0.8);
    if (e.elite) { // 체력 막대
      var w = 50; worldT(); cx.fillStyle = 'rgba(27,42,90,.85)'; cx.fillRect(e.x - w / 2 - 2, e.y + 8, w + 4, 9); cx.fillStyle = '#ffd23a'; cx.fillRect(e.x - w / 2, e.y + 10, w * Math.max(0, e.hp / e.maxhp), 5);
    }
  }
  function drawBoss(b, tnow) {
    var fr = A.B[b.id][Math.floor(b.anim * 4) % 2];
    var sp = b.flash > 0 ? fr.w : b.sick > 0 ? fr.g : fr.n;
    var sc = 1, rot = 0;
    if (b.st && /W$/.test(b.st)) sc = 1 + Math.sin(tnow * 30) * 0.03;
    if (b.id === 'skunkking' && b.inflate > 0) sc = 1 + b.inflate * 0.35;
    if (b.id === 'kingegg') rot = Math.sin(b.anim * 3) * 0.25;
    if (b.st === 'spin') rot = b.anim * 8;
    if (b.st === 'duelstun') { rot = Math.sin(tnow * 8) * 0.2; }
    // 준비 동작 표시: 발밑 빨간 원
    if (b.st === 'stompW' || b.st === 'steamW' || b.st === 'flapW' || b.st === 'inflate') {
      worldT(); var rr = b.st === 'stompW' ? 280 : b.st === 'steamW' ? 240 : b.st === 'flapW' ? 320 : 330;
      cx.globalAlpha = 0.25 + 0.15 * Math.sin(tnow * 20); cx.strokeStyle = b.st === 'inflate' ? '#b070ff' : '#ff4a4a'; cx.lineWidth = 6; A.ell(cx, b.x, b.y, rr, rr * 0.8); cx.stroke(); cx.globalAlpha = 1;
    }
    if (b.dead) { var u = Math.min(1, b.dieT / 1.2); spr(fr.w, b.x, b.y, 1 + u * 0.5, b.face, 1 - u, u * 6); return; }
    spr(sp, b.x, b.y, sc, b.face, 1, rot);
    if (b.st === 'duelstun') for (var k = 0; k < 3; k++) { var a = tnow * 4 + k * TAU / 3; worldT(); A.star(cx, b.x + Math.cos(a) * 40, b.y - 170 + Math.sin(a) * 10, 9, '#ffe066'); }
  }
  function drawPlayer(tnow) {
    var face = pl.expr || 'normal';
    if (pl.dead) face = 'oops';
    if (face === 'strain' && pl.charge >= 60) face = 'strain2';
    var stepI = pl.moving ? Math.floor(pl.walk) % 4 : 4;
    var sp = A.G[face][stepI];
    if (pl.hurtT > 0 && Math.floor(tnow * 30) % 2) sp = A.GW;
    var sq = pl.squash, sx = 1 + sq, sy = 1 - sq * 0.7;
    var jx = 0, jy = 0;
    if (pl.charging) { var k = pl.charge / 100; jx = rnd(-1, 1) * (1 + k * 3); sy *= 1 - 0.08 * k; sx *= 1 + 0.06 * k; if (pl.capT > 0.5 && pl.belly >= 99) jx *= 2.5; }
    if (pl.stun > 0) jx = Math.sin(tnow * 30) * 2;
    var SZ = G.mode === 'title' ? TITLE_SZ : 0.62;
    var b = DPR * SC, s = b * sp.k * SZ;
    var X = DPR * W / 2 + (pl.x + jx - cam.x) * b, Y = DPR * H / 2 + (pl.y + jy - cam.y) * b;
    if (pl.iframe > 0.2 && !pl.dashT && Math.floor(tnow * 20) % 2) cx.globalAlpha = 0.55;
    cx.setTransform(pl.face * s * sx, 0, 0, s * sy, X, Y);
    cx.drawImage(sp.c, -sp.ax, -sp.ay);
    cx.globalAlpha = 1;
    if (G.mode === 'title') return;
    // 체력(빨강)·가스(초록) 막대: 발밑
    worldT();
    // 머리 위(서 있는 그림의 머리끝보다 조금 위)
    var hs = A.G.normal[4], w = 58, x0 = pl.x - w / 2, y0 = pl.y - hs.ay * hs.k * 0.62 - 24;
    cx.fillStyle = 'rgba(27,42,90,.9)'; rr(x0 - 2, y0 - 2, w + 4, 18, 5); cx.fill();
    cx.fillStyle = '#4a1020'; cx.fillRect(x0, y0, w, 6);
    cx.fillStyle = pl.hp / pl.maxhp < 0.3 ? '#ff4a4a' : '#ff6a7a'; cx.fillRect(x0, y0, w * clamp(pl.hp / pl.maxhp, 0, 1), 6);
    cx.fillStyle = '#20381a'; cx.fillRect(x0, y0 + 8, w, 6);
    var gf = pl.belly / 100, full = pl.belly >= 100;
    cx.fillStyle = full ? (Math.floor(tnow * 8) % 2 ? '#fff27a' : '#b8f05a') : '#8fd84a'; cx.fillRect(x0, y0 + 8, w * gf, 6);
    if (pl.charging) { cx.fillStyle = pl.capT > 0.5 && pl.belly >= 99 ? '#ff4a3a' : '#ffe14a'; cx.fillRect(x0, y0 + 8, w * pl.charge / 100, 6); }
  }
  function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

  // ─────────────── 타이틀 뒤 장면 ───────────────
  var demoT = 0, TITLE_SZ = 1.4;
  function titleScene(dt) {
    demoT += dt;
    // 주인공을 크게: 가로면 왼쪽 아래, 세로면 가운데 아래
    pl.x = 0; pl.y = 0; pl.moving = false;
    if (H > W) { TITLE_SZ = Math.min(2.4, VH * 0.4 / 125); cam.x = 0; cam.y = -VH * 0.44; }
    else { TITLE_SZ = Math.min(1.6, VH * 0.46 / 125); cam.x = VW * 0.31; cam.y = -VH * 0.43; }
    if (!pl.face) pl.face = 1;
    // 둘레를 도는 적 몇
    if (!G.demo) {
      G.demo = true; resetRun(0); G.mode = 'title';
      var ids = ['pigeon', 'mosquito', 'puppy', 'pigeon', 'mosquito', 'pigeon'];
      for (var i = 0; i < ids.length; i++) { var e = spawnEnemy(ids[i], 0, 0); e.demoA = i / ids.length * TAU; e.demoR = 150 + (i % 2) * 60; }
    }
    for (var j = 0; j < E.length; j++) {
      var en = E[j]; if (!en.on) continue;
      en.anim += dt; en.demoA += dt * 0.25;
      var nx = Math.cos(en.demoA) * en.demoR * 2.2 + cam.x * 0.6, ny = Math.sin(en.demoA) * en.demoR * 0.9 + cam.y * 0.5;
      en.face = nx < en.x ? -1 : 1; en.x = nx; en.y = ny; en.flash -= dt; en.sick -= dt;
    }
    // 가끔 뿡
    if (demoT > 2.4) {
      demoT = 0; pl.face = -pl.face;
      var tk = TITLE_SZ / 0.56, b = [pl.x - pl.face * 24 * tk, pl.y - 12 * tk]; pl.expr = 'relief'; pl.exprT = 0.8; pl.squash = 0.2;
      for (var k = 0; k < 10; k++) { var a = Math.random() * TAU; part(b[0], b[1], Math.cos(a) * 80 * tk - pl.face * 90 * tk, Math.sin(a) * 50 * tk, 0.8, A.P.green, 12 * tk, 30 * tk, 0.85); }
      ring(b[0], b[1], 6, 70 * tk, 0.35, 'rgba(200,240,120,', 6 * tk);
      for (j = 0; j < E.length; j++) if (E[j].on) E[j].sick = 1;
    }
    pl.squash *= Math.exp(-8 * dt);
    if (pl.exprT > 0) { pl.exprT -= dt; if (pl.exprT <= 0) pl.expr = 'normal'; }
    updateParts(dt);
  }

  // ─────────────── HUD ───────────────
  var hudT = 0, lastHud = {};
  function setTxt(id, v) { if (lastHud[id] !== v) { lastHud[id] = v; $(id).textContent = v; } }
  function hud(force) {
    hudT += 1;
    if (!force && hudT % 6) return;
    setTxt('tTime', fmt(G.t));
    setTxt('tLv', 'Lv ' + G.lv);
    $('xpFill').style.width = (G.xp / G.need * 100).toFixed(1) + '%';
    setTxt('tCoin', String(G.mode === 'title' || G.mode === 'menu' ? P.coins : G.coins));
    if (boss && boss.on && !boss.dead) $('bossFill').style.width = (Math.max(0, boss.hp / boss.maxhp) * 100).toFixed(1) + '%';
  }
  var fartBtn = null;
  function fartHud() {
    if (!fartBtn) fartBtn = $('bFart');
    var g = Math.round(pl.belly || 0), c = Math.round(pl.charge || 0), full = pl.belly >= 100, danger = pl.charging && pl.capT > 0.5 && pl.belly >= 99;
    var key = g + '|' + c + '|' + full + '|' + danger;
    if (fartBtn._k === key) return; fartBtn._k = key;
    fartBtn.style.setProperty('--g', g + '%'); fartBtn.style.setProperty('--c', c + '%');
    fartBtn.classList.toggle('full', full); fartBtn.classList.toggle('danger', danger); fartBtn.classList.toggle('hold', pl.charging);
  }
  function renderFoods() {
    var html = '';
    Object.keys(G.evos).forEach(function (id) { html += '<span class="fi evo"><img src="' + A.url(id) + '" alt=""></span>'; });
    D.FOODS.forEach(function (f) { var lv = G.foods[f.id]; if (lv) html += '<span class="fi"><img src="' + A.url(f.id) + '" alt=""><b>' + lv + '</b></span>'; });
    $('foods').innerHTML = html;
    $('pFoods').innerHTML = html;
  }
  var wordT = null;
  function word(s, lv) {
    var w = $('word'); w.textContent = L(s); w.className = 'w' + (lv || 0); void w.offsetWidth; w.classList.add('show');
  }

  // ─────────────── 화면 전환 ───────────────
  var SCREENS = ['title', 'stages', 'shop', 'dex', 'lvup', 'pause', 'over', 'clear', 'ending'];
  function hideAll() { SCREENS.forEach(function (s) { $(s).hidden = true; }); document.body.classList.remove('modal', 'sheeton', 'lvon'); }
  function showScreen(id) { hideAll(); $(id).hidden = false; }
  // 타이틀 단추 줄은 늘 제목(방귀라이크 한 줄)보다 좁게
  function fitMenu() {
    var lg = $('logo'), mn = document.querySelector('#title .menu'); if (!lg || !mn || $('title').hidden) return;
    var w = lg.getBoundingClientRect().width; if (w > 0) mn.style.width = Math.round(Math.min(w * 0.85, 520)) + 'px';   // 넓은 PC 에서 단추가 너무 커지지 않게
    Array.prototype.forEach.call(mn.querySelectorAll('.btn'), function (b) {   // 영문 COLLECTION 이 폰 세로 단추 밖으로 넘치던 것(2026-09-26)
      b.style.fontSize = ''; if (b.hidden) return;
      var cs = getComputedStyle(b), room = b.clientWidth - 20;
      var g = document.createRange(); g.selectNodeContents(b); var tw = g.getBoundingClientRect().width;
      if (tw > room && room > 0) b.style.fontSize = Math.floor(parseFloat(cs.fontSize) * room / tw) + 'px';
    });
  }
  function toTitle() {
    S.suspend(false);
    G.mode = 'title'; G.demo = false; document.body.classList.remove('playing');
    $('bossbar').hidden = true;
    $('bCont').hidden = !loadJ('run', null);
    showScreen('title'); hud(true); fitMenu();
    S.music(0);
  }
  function openStages() {
    G.mode = 'menu';
    var html = '';
    D.STAGES.forEach(function (s, i) {
      var lock = i + 1 > P.unlocked, done = P.cleared[i];
      html += '<button class="stg' + (lock ? ' lock' : '') + (done ? ' done' : '') + '" data-i="' + i + '"' + (lock ? ' disabled' : '') + '>' +
        '<canvas width="240" height="150" data-i="' + i + '"></canvas>' +
        '<span class="sn">STAGE ' + (i + 1) + '</span><b>' + s.name + '</b>' + (done ? '<span class="chk">✔</span>' : '') + (lock ? '<span class="lk"></span>' : '') + '</button>';
    });
    $('stgGrid').innerHTML = html;
    Array.prototype.forEach.call($('stgGrid').querySelectorAll('canvas'), function (c) {
      var i = +c.dataset.i, x = c.getContext('2d');
      x.drawImage(A.T[i], 0, 0, 512, 320, 0, 0, 240, 150);
      var bs = A.B[D.STAGES[i].boss][0].n, k = 110 / bs.c.height;
      x.drawImage(bs.c, 120 - bs.ax * k, 142 - bs.ay * k, bs.c.width * k, bs.c.height * k);
      if (i + 1 > P.unlocked) { x.fillStyle = 'rgba(20,30,60,.72)'; x.fillRect(0, 0, 240, 150); }
    });
    Array.prototype.forEach.call($('stgGrid').querySelectorAll('.stg'), function (b) { b.onclick = function () { if (b.disabled) return; S.click(); var i = +b.dataset.i; if (loadJ('run', null)) { ask('새로 시작할까요?', '', function () { delJ('run'); startStage(i); }); } else startStage(i); }; });
    showScreen('stages'); document.body.classList.add('sheeton'); hud(true);
  }
  function openShop() {
    G.mode = 'menu';
    var html = '';
    D.SHOP.forEach(function (s) {
      var lv = P.shop[s.id], maxed = lv >= s.max, cost = maxed ? 0 : s.cost[lv], can = !maxed && P.coins >= cost;
      var pips = ''; for (var i = 0; i < s.max; i++) pips += '<i class="' + (i < lv ? 'on' : '') + '"></i>';
      html += '<div class="shopI"><img src="' + A.url(s.icon) + '" alt=""><span class="ct"><b class="cn">' + s.name + '</b><span class="pips">' + pips + '</span><span class="cs">' + s.stat + '</span></span>' +
        '<button class="btn buy' + (maxed ? ' max' : can ? ' main' : ' no') + '" data-id="' + s.id + '"' + (can ? '' : ' disabled') + '>' + (maxed ? 'MAX' : '<img src="' + A.url('coin') + '" alt="">' + cost) + '</button></div>';
    });
    $('shopGrid').innerHTML = html;
    $('shopCoin').textContent = P.coins;
    Array.prototype.forEach.call($('shopGrid').querySelectorAll('.buy'), function (b) {
      b.onclick = function () {
        var s = D.SHOPI[b.dataset.id], lv = P.shop[s.id]; if (lv >= s.max) return;
        var cost = s.cost[lv]; if (P.coins < cost) return;
        P.coins -= cost; P.shop[s.id]++; saveProg(); S.coin(); openShop();
      };
    });
    showScreen('shop'); document.body.classList.add('sheeton'); hud(true);
  }
  var dexTab = 'f';
  function openDex(tab) {
    G.mode = 'menu'; dexTab = tab || dexTab;
    var html = '';
    if (dexTab === 'f') {
      D.FOODS.forEach(function (f) { var seen = P.seenF[f.id]; html += '<div class="dexI' + (seen ? '' : ' un') + '"><img src="' + A.url(f.id) + '" alt=""><b>' + (seen ? f.name : '???') + '</b></div>'; });
      D.EVOS.forEach(function (ev) { var seen = P.seenF[ev.id]; html += '<div class="dexI evo' + (seen ? '' : ' un') + '"><img src="' + A.url(ev.id) + '" alt=""><b>' + (seen ? ev.name : '???') + '</b>' + (seen ? '<span class="combo"><img src="' + A.url(ev.a) + '" alt=""><img src="' + A.url(ev.b) + '" alt=""></span>' : '') + '</div>'; });
    } else {
      D.ENEMY_ORDER.forEach(function (id) { var seen = P.seenE[id]; html += '<div class="dexI' + (seen ? '' : ' un') + '"><img src="' + enemyURL(id, false) + '" alt=""><b>' + (seen ? D.ENEMIES[id].name : '???') + '</b></div>'; });
      D.BOSS_ORDER.forEach(function (id) { var seen = P.seenE[id]; html += '<div class="dexI boss' + (seen ? '' : ' un') + '"><img src="' + enemyURL(id, true) + '" alt=""><b>' + (seen ? D.BOSSES[id].name : '???') + '</b></div>'; });
    }
    $('dexGrid').innerHTML = html;
    var nF = 0, nE = 0; D.FOODS.concat(D.EVOS).forEach(function (f) { if (P.seenF[f.id]) nF++; }); D.ENEMY_ORDER.concat(D.BOSS_ORDER).forEach(function (id) { if (P.seenE[id]) nE++; });
    $('dexTF').innerHTML = '음식 <b>' + nF + '/' + (D.FOODS.length + D.EVOS.length) + '</b>'; $('dexTE').innerHTML = '적 <b>' + nE + '/' + (D.ENEMY_ORDER.length + D.BOSS_ORDER.length) + '</b>';
    $('dexTF').classList.toggle('on', dexTab === 'f'); $('dexTE').classList.toggle('on', dexTab === 'e');
    showScreen('dex'); document.body.classList.add('sheeton'); hud(true);
  }
  var eURL = {};
  function enemyURL(id, isBoss) {
    if (eURL[id]) return eURL[id];
    var sp = isBoss ? A.B[id][0].n : A.E[id][0].n, c = A.mk(128, 128), x = c.getContext('2d');
    var k = Math.min(120 / sp.c.width, 120 / sp.c.height);
    x.drawImage(sp.c, 64 - sp.c.width * k / 2, 124 - sp.c.height * k, sp.c.width * k, sp.c.height * k);
    try { return (eURL[id] = c.toDataURL()); } catch (e) { return ''; }   // file:// 로 열면 그림 파일 캔버스를 못 읽는다
  }
  function pauseGame() {
    if (G.mode !== 'play') return;
    G.mode = 'pause'; S.suspend(true); saveRun();
    renderFoods();
    showScreen('pause'); document.body.classList.add('modal');
  }
  function resume() { if (G.mode !== 'pause') return; hideAll(); G.mode = 'play'; S.suspend(false); pl.heldFart = true; }
  var askCb = null;
  function ask(t, p, cb) { $('askT').textContent = t; $('askP').textContent = p; $('askP').hidden = !p; askCb = cb; $('ask').hidden = false; }
  function askClose(ok) { $('ask').hidden = true; var f = askCb; askCb = null; if (ok && f) f(); }

  // 엔딩
  function showEnding(earned) {
    showScreen('ending');
    $('endStat').innerHTML = statLine(earned);
    S.clear(); setTimeout(function () { S.evo(); }, 900);
    var c = $('endCv'), x = c.getContext('2d'), t0 = performance.now();
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    function frame() {
      if (G.mode !== 'ending') return;
      var t = (performance.now() - t0) / 1000;
      drawEndScene(x, c.width, c.height, t);
      requestAnimationFrame(frame);
    }
    drawEndScene(x, c.width, c.height, 0);
    requestAnimationFrame(frame);
  }
  function drawEndScene(x, w, h, t) {
    // 노을 하늘 + 방귀 무지개 + 주인공(시원한 얼굴)
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = A.lin(x, 0, 0, 0, h, [[0, '#6ab8ff'], [0.55, '#ffd0a0'], [1, '#ff9a7a']]); x.fillRect(0, 0, w, h);
    var cols = ['#ff5a6a', '#ffae2e', '#ffe066', '#8ef06a', '#5ab0ff', '#b070ff'];
    for (var i = 0; i < 6; i++) { x.beginPath(); x.arc(w / 2, h * 0.95, w * (0.46 - i * 0.035), PI, TAU); x.strokeStyle = cols[i]; x.globalAlpha = 0.75; x.lineWidth = w * 0.035; x.stroke(); }
    x.globalAlpha = 1;
    for (i = 0; i < 7; i++) { var cxp = ((i * 173 + t * 30) % (w + 200)) - 100, cyp = h * (0.12 + (i % 3) * 0.08); x.drawImage(A.C.stink, cxp, cyp, 120, 90); }
    x.fillStyle = A.lin(x, 0, h * 0.78, 0, h, [[0, '#8ad05a'], [1, '#4a9a2a']]); x.fillRect(0, h * 0.8, w, h * 0.2);
    // 가로: 주인공은 왼쪽, 글은 오른쪽 / 세로: 주인공은 아래, 글은 위
    var port = h > w, sp = A.G.relief[Math.floor(t * 6) % 4], k = h * (port ? 0.46 : 0.66) / 140;
    var jump = Math.abs(Math.sin(t * 3)) * h * 0.04;
    x.setTransform(k / 2.4, 0, 0, k / 2.4, port ? w / 2 : w * 0.27, h * 0.93 - jump); x.drawImage(sp.c, -sp.ax, -sp.ay);
    x.setTransform(1, 0, 0, 1, 0, 0);
    for (i = 0; i < 14; i++) { var a = t * 0.6 + i; A.star(x, (Math.sin(a * 1.3 + i) * 0.5 + 0.5) * w, (Math.cos(a * 0.9 + i * 2) * 0.3 + 0.35) * h, 6 + (i % 3) * 3, i % 2 ? '#fff6a8' : '#ffffff'); }
  }

  // ─────────────── 입력 ───────────────
  var KEYMAP = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  function keyVec() {
    var k = input.keys; input.kx = (k.r ? 1 : 0) - (k.l ? 1 : 0); input.ky = (k.d ? 1 : 0) - (k.u ? 1 : 0);
    if (!padOn) { input.x = input.kx; input.y = input.ky; }
  }
  addEventListener('keydown', function (e) {
    if (e.repeat && e.code !== 'Space') { if (KEYMAP[e.code] || e.code === 'Space') e.preventDefault(); return; }
    S.unlock();
    if (!$('ask').hidden) { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); askClose(true); } else if (e.code === 'Escape') askClose(false); return; }
    if (KEYMAP[e.code]) { input.keys[KEYMAP[e.code]] = true; keyVec(); e.preventDefault(); }
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) input.spaceDown = true; input.fart = true; }
    if (G.mode === 'lvup') {
      if (e.code === 'Digit1' || e.code === 'Numpad1') pickCard(0);
      if (e.code === 'Digit2' || e.code === 'Numpad2') pickCard(1);
      if (e.code === 'Digit3' || e.code === 'Numpad3') pickCard(2);
      var n = curCards.length;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowUp' || e.code === 'KeyW') { lvSel = (lvSel + n - 1) % n; markSel(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'ArrowDown' || e.code === 'KeyS') { lvSel = (lvSel + 1) % n; markSel(); }
      if ((e.code === 'Enter' || (e.code === 'Space' && !e.repeat))) pickCard(lvSel);
      if (e.code === 'KeyR') reroll();
      return;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') { if (G.mode === 'play') pauseGame(); else if (G.mode === 'pause') resume(); else if (G.mode === 'menu') { S.click(); toTitle(); } }
    if (e.code === 'KeyM') togBgm();
    if (e.code === 'KeyK') togSfx();
    if (e.code === 'Enter') {
      if (G.mode === 'title') { $('bCont').hidden ? $('bStart').click() : $('bCont').click(); }
      else if (G.mode === 'over') $('bRetry').click();
      else if (G.mode === 'clear') $('bNext').click();
      else if (G.mode === 'pause') resume();
      else if (G.mode === 'ending') $('bEndHome').click();
    }
  });
  addEventListener('keyup', function (e) {
    if (KEYMAP[e.code]) { input.keys[KEYMAP[e.code]] = false; keyVec(); }
    if (e.code === 'Space') { input.fart = false; }
  });
  addEventListener('blur', function () { input.keys = {}; keyVec(); input.fart = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (G.mode === 'play') pauseGame(); saveRun(); } });
  addEventListener('pagehide', saveRun);

  // 폰: 왼쪽 패드, 오른쪽 방귀 단추
  var padOn = false, padId = null, pad = $('pad'), knob = $('knob');
  function padMove(e) {
    var r = pad.getBoundingClientRect(), R = r.width / 2, dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R), d = Math.sqrt(dx * dx + dy * dy);
    var m = Math.min(d, R * 0.62); var ux = d ? dx / d : 0, uy = d ? dy / d : 0;
    knob.style.transform = 'translate(' + ux * m + 'px,' + uy * m + 'px)';
    var mag = d < R * 0.08 ? 0 : Math.min(1, d / (R * 0.55));
    input.x = ux * mag; input.y = uy * mag;
  }
  pad.addEventListener('pointerdown', function (e) { e.preventDefault(); S.unlock(); padOn = true; padId = e.pointerId; try { pad.setPointerCapture(e.pointerId); } catch (x) {} padMove(e); });
  pad.addEventListener('pointermove', function (e) { if (padOn && e.pointerId === padId) padMove(e); });
  function padEnd(e) { if (e.pointerId !== padId) return; padOn = false; padId = null; input.x = input.kx || 0; input.y = input.ky || 0; knob.style.transform = ''; }
  pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
  var fb = $('bFart');
  fb.addEventListener('pointerdown', function (e) { e.preventDefault(); S.unlock(); input.fart = true; try { fb.setPointerCapture(e.pointerId); } catch (x) {} });
  function fEnd() { input.fart = false; }
  fb.addEventListener('pointerup', fEnd); fb.addEventListener('pointercancel', fEnd); fb.addEventListener('lostpointercapture', fEnd);
  fb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  function markTouch() { document.body.classList.add('touch'); }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) markTouch();
  addEventListener('touchstart', markTouch, { passive: true });

  // 단추
  function togBgm() { S.setBgm(!S.bgm); $('tBgm').classList.toggle('off', !S.bgm); }
  function togSfx() { S.setSnd(!S.snd); $('tSfx').classList.toggle('off', !S.snd); }
  function bind(id, f) { $(id).addEventListener('click', function (e) { S.unlock(); f(e); }); }
  bind('tBgm', togBgm); bind('tSfx', togSfx);
  bind('tPause', function () { if (G.mode === 'play') pauseGame(); else if (G.mode === 'pause') resume(); });
  bind('bStart', function () { S.click(); openStages(); });
  bind('bCont', function () { S.click(); var r = loadJ('run', null); if (r) startStage(r.stage, r); });
  bind('bShop', function () { S.click(); openShop(); });
  bind('bDex', function () { S.click(); openDex('f'); });
  bind('dexTF', function () { S.click(); openDex('f'); });
  bind('dexTE', function () { S.click(); openDex('e'); });
  ['xStages', 'xShop', 'xDex'].forEach(function (id) { bind(id, function () { S.click(); toTitle(); }); });
  bind('bResume', function () { S.click(); resume(); });
  bind('bQuit', function () { S.click(); saveRun(); toTitle(); });
  bind('bRetry', function () { S.click(); startStage(G.stage); });
  bind('bOverHome', function () { S.click(); toTitle(); });
  bind('bNext', function () { S.click(); openStages(); });
  bind('bClearHome', function () { S.click(); toTitle(); });
  bind('bEndHome', function () { S.click(); toTitle(); });
  bind('bReroll', function () { reroll(); });
  bind('askOk', function () { askClose(true); });
  bind('askNo', function () { askClose(false); });
  $('ask').addEventListener('click', function (e) { if (e.target === $('ask')) askClose(false); });

  // ─────────────── 시험용 로봇 (평균 사용자 흉내) ───────────────
  var __bot = { on: false, think: 0, mx: 0, my: 0, hold: false, relAt: 0, pri: ['milk', 'goguma', 'garlic', 'cabbage', 'soda', 'chung', 'beondegi', 'kimchi', 'cola', 'mentos', 'egg', 'cereal', 'buldak', 'lighter'], react: 0.25, skill: 1 };
  function botThink(dt) {
    var b = __bot;
    b.think -= dt;
    if (b.think <= 0) {
      b.think = b.react * rnd(0.8, 1.3);
      var tx = 0, ty = 0, near = 0;
      var q = query(pl.x, pl.y, 190);
      for (var i = 0; i < q.length; i++) { var e = q[i], dx = pl.x - e.x, dy = pl.y - e.y, d2 = dx * dx + dy * dy + 100; var w = (e.boss ? 6 : 1) / d2; tx += dx * w; ty += dy * w; if (d2 < 130 * 130) near++; }
      for (i = 0; i < PROJ.length; i++) { var s = PROJ[i]; if (s.on && s.enemy) { var sx = pl.x - s.x, sy = pl.y - s.y, s2 = sx * sx + sy * sy + 100; if (s2 < 160 * 160) { tx += sx * 3 / s2; ty += sy * 3 / s2; } } }
      var tl = Math.sqrt(tx * tx + ty * ty);
      // 가까운 보석 쪽으로
      // 보석: 값 / 거리 가 제일 좋은 쪽 (사람도 보석 무더기 쪽으로 간다)
      var gx = 0, gy = 0, gb = 1e9, gs = 0;
      for (i = 0; i < GEMS.length; i++) { var g = GEMS[i]; if (!g.on || g.mag) continue; var ddx = g.x - pl.x, ddy = g.y - pl.y, dd = Math.sqrt(ddx * ddx + ddy * ddy); if (dd > 600) continue; var sc = (g.v + 1) / (dd + 60); if (sc > gs) { gs = sc; gb = dd * dd; gx = ddx; gy = ddy; } }
      for (i = 0; i < PICKS.length; i++) { var pk = PICKS[i]; if (!pk.on) continue; var pdx = pk.x - pl.x, pdy = pk.y - pl.y, pdd = pdx * pdx + pdy * pdy; if (pdd < 700 * 700) { gb = pdd; gx = pdx; gy = pdy; break; } }
      var gl = Math.sqrt(gx * gx + gy * gy) || 1;
      var mx = 0, my = 0;
      if (tl > 0.0002) { mx = tx / tl; my = ty / tl; }
      var gw = tl > 0.02 ? 0.3 : tl > 0.008 ? 0.7 : 1.2;
      if (gb < 1e9) { mx += gx / gl * gw; my += gy / gl * gw; }
      // 가끔 딴짓 (보통 사람)
      if (Math.random() < 0.08) { mx += rnd(-1, 1); my += rnd(-1, 1); }
      // 원점에서 너무 멀면 돌아오기(맵 한가운데 머물기) — 영향 작게
      var ml = Math.sqrt(mx * mx + my * my);
      b.mx = ml > 0.05 ? mx / ml : 0; b.my = ml > 0.05 ? my / ml : 0;
      b.near = near;
      // 방귀: 배가 찼고 적이 모였으면 꾹
      var bossNear = boss && boss.on && !boss.dead && ((boss.x - pl.x) * (boss.x - pl.x) + (boss.y - pl.y) * (boss.y - pl.y) < 220 * 220);
      if (!b.hold && pl.belly >= 90 && (near >= 5 || bossNear || pl.belly >= 100)) { b.hold = true; b.relAt = rnd(0.05, 0.6); b.capT0 = 0; }
    }
    if (b.hold && pl.charging && pl.charge >= pl.belly - 0.5) { b.capT0 += dt; if (b.capT0 >= b.relAt) b.hold = false; }
    if (b.hold && !pl.charging && pl.belly < 8) b.hold = false;
    input.fart = b.hold;
    input.x = b.mx; input.y = b.my;
    if (G.pendingLv > 0 || G.mode === 'lvup') { /* 카드는 아래에서 */ }
  }
  function botPick() {
    var best = 0, bs = -1;
    curCards.forEach(function (c, i) {
      var s = 0;
      if (c.evo) s = 100;
      else if (c.food) { var k = __bot.pri.indexOf(c.food.id); s = 50 - k * 2 + (G.foods[c.food.id] ? 8 : 0); }
      else s = 1;
      if (s > bs) { bs = s; best = i; }
    });
    G.cardOpenT = 0; pickCard(best);
  }

  // ─────────────── 돌리기 ───────────────
  var acc = 0, lastT = 0, DT = 1 / 60;
  function frame(dt) {
    if (G.mode === 'play') {
      step(dt);
      var ck = 1 - Math.exp(-12 * dt); cam.x += (pl.x - cam.x) * ck; cam.y += (pl.y - 30 - cam.y) * ck;
      if (__bot.on && G.mode === 'lvup') botPick();
    } else if (G.mode === 'title' || G.mode === 'menu') titleScene(dt);
    else if (G.mode === 'over' || G.mode === 'clear' || G.mode === 'pause' || G.mode === 'lvup') { if (G.mode !== 'pause' && G.mode !== 'lvup') updateParts(dt); }
  }
  function loop(ts) {
    requestAnimationFrame(loop);
    if (window.__fr.frozen) return;
    var t = ts / 1000; if (!lastT) lastT = t;
    var el = Math.min(0.1, t - lastT); lastT = t;
    acc += el; var n = 0;
    while (acc >= DT && n < 5) { frame(DT); acc -= DT; n++; }
    if (acc > DT) acc = 0;
    render(); hud(); if (G.mode === 'play') fartHud();
  }

  // ─────────────── 시작 ───────────────
  function boot() {
    A.init();
    resize();
    addEventListener('resize', function () { resize(); fitMenu(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMenu);
    $('tBgm').classList.toggle('off', !S.bgm); $('tSfx').classList.toggle('off', !S.snd);
    $('coinIco').src = A.url('coin'); $('shopCoinIco').src = A.url('coin');
    toTitle();
    requestAnimationFrame(loop);
    $('loading').hidden = true;
  }

  window.__fr = {
    G: G, pl: pl, ST: ST, P: P, E: E, GEMS: GEMS, PICKS: PICKS, frozen: false, bot: __bot,
    get boss() { return boss; },
    tick: function (n, render_) { for (var i = 0; i < (n || 1); i++) { frame(DT); if (__bot.on && G.mode === 'lvup') botPick(); } if (render_ !== false) { render(); hud(true); fartHud(); } return G.mode; },
    start: function (s, snap) { startStage(s || 0, snap); return G.mode; },
    render: function () { render(); hud(true); },
    pick: pickCard, openStages: openStages, openShop: openShop, openDex: openDex, toTitle: toTitle, pause: pauseGame, resume: resume,
    alive: function () { var n = 0; for (var i = 0; i < E.length; i++) if (E[i].on && !E[i].dead) n++; return n; },
    state: function () { return { mode: G.mode, stage: G.stage, t: +G.t.toFixed(1), lv: G.lv, hp: Math.round(pl.hp), maxhp: pl.maxhp, belly: Math.round(pl.belly), kills: G.kills, coins: G.coins, alive: window.__fr.alive(), foods: JSON.stringify(G.foods), evos: Object.keys(G.evos).join(','), boss: boss ? Math.round(boss.hp) + '/' + Math.round(boss.maxhp) : '-' }; },
    setProg: function (o) { for (var k in o) P[k] = o[k]; normProg(); saveProg(); },
    resetProg: function () { P = {}; normProg(); window.__fr.P = P; saveProg(); },
    spawn: function (id, x, y, o) { var e = spawnEnemy(id, x, y, o); alive++; return e; },
    word: word, blast: blast, resize: resize, cam: cam, input: input, calc: calc
  };
  function start() { A.load(boot); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start); else start();
})();
