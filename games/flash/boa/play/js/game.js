/* 보아뱀 — 코끼리를 삼키는 보아뱀. 별마다 규칙이 다르다.
 * 평범한 <script> 로 읽힌다(모듈·fetch 없음 → file:// 더블클릭으로도 돈다).
 * 시험 손잡이: window.__boa.tick(n) 으로 프레임을 손으로 돌린다(미리보기 창은 rAF 가 안 돈다).
 */
(function () {
  'use strict';
  var KEY = 'boa';
  var A = window.BoaAudio;
  var $ = function (id) { return document.getElementById(id); };

  // ── 말: ?lang=en 이면 영어. 한국어가 원본이고 영어를 덧씌운다 ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) {
    document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'Boa — snake eats an elephant';
    Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); });
  }

  function load(k) { try { return localStorage.getItem(KEY + '.' + k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(KEY + '.' + k, String(v)); } catch (e) {} }

  // ── 별(스테이지) ──
  var STAGES = [
    { id: 'jungle', ic: '🌿', ko: '정글', en: 'JUNGLE', food: '🐸', quota: 8, eles: 1 },
    { id: 'b612', ic: '🌋', ko: 'B-612', en: 'B-612', food: '🌱', quota: 10, eles: 3, circle: true },
    { id: 'king', ic: '👑', ko: '왕의 별', en: "KING'S STAR", food: '🐀', quota: 8, eles: 1 },
    { id: 'drunk', ic: '🍾', ko: '술꾼의 별', en: "TIPPLER'S STAR", food: '🍾', quota: 8, eles: 1 },
    { id: 'biz', ic: '⭐', ko: '사업가의 별', en: "BUSINESSMAN'S STAR", food: '⭐', quota: 30, eles: 1, timer: 40 },
    { id: 'lamp', ic: '🏮', ko: '점등인의 별', en: "LAMPLIGHTER'S STAR", food: '✨', quota: 10, eles: 1 },
    { id: 'earth', ic: '🌍', ko: '지구', en: 'EARTH', food: '💧', quota: 10, eles: 1 }
  ];
  var KING_FOODS = ['🐀', '🐸', '🍎'];

  // ── 캔버스 ──
  var cv = $('c'), ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, safeTop = 46;
  var bg = document.createElement('canvas'), bgx = bg.getContext('2d');
  var nc = document.createElement('canvas'), ncx = nc.getContext('2d');
  var EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  var INK = '#2b2418';

  // ── 상수 ──
  var SPACING = 9, START_LEN = 12, HEAD_R = 12, BODY_R = 9, TURN = 4.0;
  var PI = Math.PI, TAU = PI * 2;

  // ── 상태 ──
  var state = 'title'; // title | card | play | gulp | clear | over | end
  var si = 0, S = STAGES[0];
  var t = 0, waitT = 0, tt = 0;
  var score = 0, stageScore0 = 0, best = +load('best') || 0, prog = +load('stage') || 0;
  var boa = null, foods = [], eles = [], obs = [], bulges = [], bits = [];
  var ate = 0, elesEaten = 0, combo = 0, comboT = 0;
  var king = { order: 0, T: 0, shake: 0 }, drunkT = 0, bizT = 0, night = false, nightA = 0, lampT = 0, lampP = 4;
  var snake = null, fox = null, trees = 0, crackLines = [], planetBreak = 0, starT = 0, sproutT = 0;
  var dash = 0, dashCd = 0, paused = false, shake = 0, deadEyes = false;
  var aiT = 0, aiPt = null, hatPh = -1, hatOn = false;
  var isTouch = false, keys = {}, mouse = null, padVec = null, padId = null;
  var speedBase = 150;
  var ARENA = { x: 0, y: 0, w: 0, h: 0, cx: 0, cy: 0, r: 0, circle: false };

  // ── 도우미 ──
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, f) { return a + (b - a) * f; }
  function normAng(a) { while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  function emoji(g, ch, x, y, size, alpha) {
    g.save(); if (alpha !== undefined) g.globalAlpha = alpha;
    g.font = size + 'px ' + EMOJI; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y + size * 0.06); g.restore();
  }
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  // ── 판 ──
  function setArena() {
    var tb = $('topbar'); safeTop = tb ? tb.getBoundingClientRect().height : 46;
    ARENA.x = 10; ARENA.y = safeTop + 6; ARENA.w = W - 20; ARENA.h = H - ARENA.y - 10;
    ARENA.cx = ARENA.x + ARENA.w / 2; ARENA.cy = ARENA.y + ARENA.h / 2;
    ARENA.circle = !!S.circle; ARENA.r = Math.min(ARENA.w, ARENA.h) / 2 - 4;
    speedBase = 150 * clamp(Math.min(ARENA.w, ARENA.h) / 640, 0.62, 1);
  }
  function inside(x, y, m) { m = m || 0; if (ARENA.circle) return dist(x, y, ARENA.cx, ARENA.cy) < ARENA.r - m; return x > ARENA.x + m && x < ARENA.x + ARENA.w - m && y > ARENA.y + m && y < ARENA.y + ARENA.h - m; }
  function edgeDist(x, y) { if (ARENA.circle) return ARENA.r - dist(x, y, ARENA.cx, ARENA.cy); return Math.min(x - ARENA.x, ARENA.x + ARENA.w - x, y - ARENA.y, ARENA.y + ARENA.h - y); }
  // 폰 패드·돌진 단추 아래에는 먹이를 놓지 않는다
  function badSpot(x, y) {
    if (!isTouch) return false;
    var ps = H < 460 ? 160 : 186;
    if (x < 14 + ps + 10 && y > H - 60 - ps - 10) return true;
    if (x > W - 16 - 88 - 10 && y > H - 24 - 88 - 10) return true;
    return false;
  }
  function nearObs(x, y, m) { for (var i = 0; i < obs.length; i++) if (dist(x, y, obs[i].x, obs[i].y) < obs[i].r + m) return true; return false; }
  function nearFood(x, y, m) { for (var i = 0; i < foods.length; i++) if (dist(x, y, foods[i].x, foods[i].y) < m) return true; return false; }
  function randPt(m, farHead) {
    for (var k = 0; k < 60; k++) {
      var x, y;
      if (ARENA.circle) { var a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (ARENA.r - m); x = ARENA.cx + Math.cos(a) * r; y = ARENA.cy + Math.sin(a) * r; }
      else { x = ARENA.x + m + Math.random() * (ARENA.w - 2 * m); y = ARENA.y + m + Math.random() * (ARENA.h - 2 * m); }
      if (badSpot(x, y)) continue;
      if (boa && dist(x, y, boa.x, boa.y) < (farHead || 110)) continue;
      if (nearObs(x, y, 44)) continue;
      if (nearFood(x, y, 44)) continue;
      return { x: x, y: y };
    }
    if (farHead === undefined || farHead > 60) return randPt(m, 60);
    var cs = ARENA.circle ? [[ARENA.cx - ARENA.r * 0.6, ARENA.cy], [ARENA.cx + ARENA.r * 0.6, ARENA.cy], [ARENA.cx, ARENA.cy - ARENA.r * 0.6], [ARENA.cx, ARENA.cy + ARENA.r * 0.6]] : [[ARENA.x + 60, ARENA.y + 60], [ARENA.x + ARENA.w - 60, ARENA.y + 60], [ARENA.x + 60, ARENA.y + ARENA.h - 60], [ARENA.x + ARENA.w - 60, ARENA.y + ARENA.h - 60]];
    var bestP = cs[0], bd = -1; cs.forEach(function (c) { var d = boa ? dist(c[0], c[1], boa.x, boa.y) : 0; if (d > bd) { bd = d; bestP = c; } });
    return { x: bestP[0], y: bestP[1] };
  }

  // ── 보아뱀 ──
  function newBoa(len) {
    var sx = ARENA.circle ? ARENA.cx - ARENA.r * 0.45 : ARENA.cx - 60, sy = ARENA.circle ? ARENA.cy + ARENA.r * 0.45 : ARENA.cy;
    boa = { x: sx, y: sy, ang: 0, tgt: 0, len: len || START_LEN, trail: [], segs: [] };
    for (var i = 120; i >= 1; i--) boa.trail.push({ x: sx - i * 2, y: sy });
    bulges = []; computeSegs();
  }
  function segR(i) {
    var n = boa.len, f = i / Math.max(1, n - 1);
    var r = BODY_R * (0.82 + 0.28 * Math.sin(PI * Math.min(1, i / n))) * (f > 0.62 ? lerp(1, 0.3, (f - 0.62) / 0.38) : 1);
    var m = 0, d = i * SPACING;
    for (var k = 0; k < bulges.length; k++) { var b = bulges[k], q = (d - b.d) / b.w; m += b.s * Math.exp(-q * q); }
    return r * (1 + Math.min(m, 1.5));
  }
  function computeSegs() {
    var tr = boa.trail, segs = boa.segs; segs.length = 0;
    segs.push({ x: boa.x, y: boa.y });
    var px = boa.x, py = boa.y, i = tr.length - 1, acc = 0, nextD = SPACING, need = boa.len;
    while (i >= 0 && segs.length < need) {
      var p = tr[i], d = dist(p.x, p.y, px, py);
      if (d > 0) {
        while (acc + d >= nextD && segs.length < need) { var f = (nextD - acc) / d; segs.push({ x: px + (p.x - px) * f, y: py + (p.y - py) * f }); nextD += SPACING; }
        acc += d; px = p.x; py = p.y;
      }
      i--;
    }
    if (i > 8) tr.splice(0, i - 8);
  }
  function boaStep(dt, ai) {
    var sp = speedBase * (dash > 0 ? 1.7 : 1);
    var tgt = boa.tgt;
    if (drunkT > 0 && !ai) tgt = boa.ang - normAng(tgt - boa.ang);
    var d = normAng(tgt - boa.ang), mx = TURN * dt;
    boa.ang += clamp(d, -mx, mx);
    boa.x += Math.cos(boa.ang) * sp * dt; boa.y += Math.sin(boa.ang) * sp * dt;
    var last = boa.trail[boa.trail.length - 1];
    if (!last || dist(last.x, last.y, boa.x, boa.y) >= 2) boa.trail.push({ x: boa.x, y: boa.y });
    for (var k = bulges.length - 1; k >= 0; k--) { bulges[k].d += sp * dt; if (bulges[k].d > boa.len * SPACING + 40) bulges.splice(k, 1); }
    computeSegs();
  }
  // 제목 화면·꿀꺽 장면에서 스스로 돌아다니기
  function aiSteer(dt) {
    aiT -= dt;
    if (!aiPt || aiT <= 0 || dist(aiPt.x, aiPt.y, boa.x, boa.y) < 40) { aiPt = randPt(90, 0); aiT = 2.5; }
    var want = Math.atan2(aiPt.y - boa.y, aiPt.x - boa.x);
    var ed = edgeDist(boa.x, boa.y);
    if (ed < 90) { var toC = Math.atan2(ARENA.cy - boa.y, ARENA.cx - boa.x); want = toC; }
    for (var i = 0; i < obs.length; i++) { var o = obs[i], dd = dist(o.x, o.y, boa.x, boa.y); if (dd < o.r + 70) { want = Math.atan2(boa.y - o.y, boa.x - o.x); } }
    boa.tgt = want;
  }

  // ── 코끼리 ──
  function spawnEles(n, r) {
    eles = [];
    for (var i = 0; i < n; i++) {
      var p = randPt(60, 240);
      eles.push({ x: p.x, y: p.y, ang: Math.random() * TAU, sp: speedBase * 0.6, r: r, ph: Math.random() * 6, wa: 0, wt: 0, eaten: 0, face: 1 });
    }
    A.order();
  }
  function eleStep(e, dt) {
    var dx = e.x - boa.x, dy = e.y - boa.y, d = Math.hypot(dx, dy), want;
    if (d < 240) want = Math.atan2(dy, dx) + Math.sin(t * 2.3) * 0.55;
    else { e.wt -= dt; if (e.wt <= 0) { e.wa = Math.random() * TAU; e.wt = rnd(1.2, 3); } want = e.wa; }
    var ed = edgeDist(e.x, e.y);
    if (ed < 90) { var toC = Math.atan2(ARENA.cy - e.y, ARENA.cx - e.x); want = lerpAng(want, toC, clamp((90 - ed) / 60, 0, 1)); }
    for (var i = 0; i < obs.length; i++) { var o = obs[i], od = dist(o.x, o.y, e.x, e.y); if (od < o.r + e.r + 30) want = Math.atan2(e.y - o.y, e.x - o.x); }
    if (S.id === 'drunk') want += Math.sin(t * 7) * 0.9;
    e.ang += clamp(normAng(want - e.ang), -2.6 * dt, 2.6 * dt);
    e.x += Math.cos(e.ang) * e.sp * dt; e.y += Math.sin(e.ang) * e.sp * dt;
    if (!inside(e.x, e.y, e.r * 0.5)) { e.x = clamp(e.x, ARENA.x + e.r, ARENA.x + ARENA.w - e.r); e.y = clamp(e.y, ARENA.y + e.r, ARENA.y + ARENA.h - e.r); if (ARENA.circle) { var a = Math.atan2(e.y - ARENA.cy, e.x - ARENA.cx), rr = ARENA.r - e.r * 0.5; e.x = ARENA.cx + Math.cos(a) * rr; e.y = ARENA.cy + Math.sin(a) * rr; } }
    e.ph += dt * 7; if (Math.abs(Math.cos(e.ang)) > 0.2) e.face = Math.cos(e.ang) > 0 ? 1 : -1;
  }
  function lerpAng(a, b, f) { return a + normAng(b - a) * f; }
  function drawEle(g, x, y, r, face, ph, alpha) {
    g.save(); g.translate(x, y); g.scale(face, 1); if (alpha !== undefined) g.globalAlpha = alpha;
    g.lineWidth = Math.max(1.5, r * 0.09); g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round';
    var gray = '#a6a6b2', dark = '#8d8d9a';
    // 다리
    var lx = [-0.72, -0.32, 0.18, 0.55];
    for (var i = 0; i < 4; i++) {
      var bob = Math.sin(ph + i * 1.6) * r * 0.08;
      g.fillStyle = i % 2 ? gray : dark;
      rrect(g, lx[i] * r - r * 0.15, r * 0.25 + bob, r * 0.3, r * 0.7 - bob, r * 0.1); g.fill(); g.stroke();
    }
    // 꼬리
    g.beginPath(); g.moveTo(-r * 1.15, -r * 0.2); g.quadraticCurveTo(-r * 1.45, r * 0.05 + Math.sin(ph * 0.7) * r * 0.1, -r * 1.35, r * 0.35); g.stroke();
    // 몸
    g.fillStyle = gray; g.beginPath(); g.ellipse(-r * 0.1, 0, r * 1.15, r * 0.82, 0, 0, TAU); g.fill(); g.stroke();
    // 머리
    g.beginPath(); g.arc(r * 0.92, -r * 0.18, r * 0.56, 0, TAU); g.fill(); g.stroke();
    // 코
    g.lineWidth = r * 0.3; g.strokeStyle = gray;
    g.beginPath(); g.moveTo(r * 1.35, -r * 0.05); g.quadraticCurveTo(r * 1.7 + Math.sin(ph * 0.5) * r * 0.1, r * 0.35, r * 1.4, r * 0.85); g.stroke();
    g.lineWidth = Math.max(1.5, r * 0.09); g.strokeStyle = INK;
    g.beginPath(); g.moveTo(r * 1.22, -r * 0.05); g.quadraticCurveTo(r * 1.55 + Math.sin(ph * 0.5) * r * 0.1, r * 0.35, r * 1.27, r * 0.9); g.stroke();
    g.beginPath(); g.moveTo(r * 1.5, r * 0.0); g.quadraticCurveTo(r * 1.85 + Math.sin(ph * 0.5) * r * 0.1, r * 0.4, r * 1.55, r * 0.85); g.stroke();
    // 상아
    g.strokeStyle = '#fff8e8'; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(r * 1.15, r * 0.12); g.quadraticCurveTo(r * 1.4, r * 0.25, r * 1.5, r * 0.15); g.stroke();
    // 귀
    g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.09); g.fillStyle = dark;
    g.beginPath(); g.ellipse(r * 0.62, -r * 0.22, r * 0.36, r * 0.44, -0.2, 0, TAU); g.fill(); g.stroke();
    // 눈
    g.fillStyle = INK; circle(g, r * 1.12, -r * 0.34, r * 0.07);
    g.restore();
  }

  // ── 노랑 뱀(지구) ──
  function newSnake() {
    var p = randPt(60, 300);
    snake = { x: p.x, y: p.y, ang: Math.random() * TAU, sp: speedBase * 0.72, trail: [], ph: 0 };
  }
  function snakeStep(dt) {
    var s = snake; s.ph += dt * 6;
    var want = Math.atan2(boa.y - s.y, boa.x - s.x) + Math.sin(s.ph) * 0.9;
    var ed = edgeDist(s.x, s.y);
    if (ed < 60) want = Math.atan2(ARENA.cy - s.y, ARENA.cx - s.x);
    s.ang += clamp(normAng(want - s.ang), -3 * dt, 3 * dt);
    s.x += Math.cos(s.ang) * s.sp * dt; s.y += Math.sin(s.ang) * s.sp * dt;
    s.trail.push({ x: s.x, y: s.y }); if (s.trail.length > 30) s.trail.shift();
  }
  function drawSnake(g) {
    if (!snake) return; var tr = snake.trail, n = tr.length;
    g.fillStyle = INK; for (var i = n - 1; i >= 0; i -= 3) circle(g, tr[i].x, tr[i].y, 3 + 4 * (i / n) + 1.8);
    g.fillStyle = '#e9c93a'; for (i = n - 1; i >= 0; i -= 3) circle(g, tr[i].x, tr[i].y, 3 + 4 * (i / n));
    g.fillStyle = INK; circle(g, snake.x + Math.cos(snake.ang + 0.7) * 4, snake.y + Math.sin(snake.ang + 0.7) * 4, 1.4); circle(g, snake.x + Math.cos(snake.ang - 0.7) * 4, snake.y + Math.sin(snake.ang - 0.7) * 4, 1.4);
    if (Math.floor(snake.ph * 1.3) % 5 === 0) { g.strokeStyle = '#d33'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(snake.x + Math.cos(snake.ang) * 7, snake.y + Math.sin(snake.ang) * 7); g.lineTo(snake.x + Math.cos(snake.ang) * 15, snake.y + Math.sin(snake.ang) * 15); g.stroke(); }
  }

  // ── 스테이지 시작 ──
  function startStage(i) {
    si = i; S = STAGES[i]; t = 0; state = 'card'; if (sizeChanged()) resize(); setArena(); buildBg();
    foods = []; eles = []; obs = []; bits = []; ate = 0; elesEaten = 0; combo = 0; comboT = 0;
    drunkT = 0; bizT = S.timer || 0; night = false; nightA = 0; lampT = 0; lampP = 4; snake = null; fox = null; trees = 0; crackLines = []; planetBreak = 0; starT = 0; sproutT = 0;
    dash = 0; dashCd = 0; shake = 0; deadEyes = false; paused = false; hatPh = -1; hatOn = false;
    king = { order: Math.floor(Math.random() * 3), T: 7, shake: 0 };
    stageScore0 = score;
    newBoa();
    if (S.id === 'b612') {
      obs.push({ type: 'rose', x: ARENA.cx, y: ARENA.cy, r: 24 });
      obs.push({ type: 'volcano', x: ARENA.cx - ARENA.r * 0.55, y: ARENA.cy - ARENA.r * 0.35, r: 18 });
      obs.push({ type: 'volcano', x: ARENA.cx + ARENA.r * 0.5, y: ARENA.cy + ARENA.r * 0.45, r: 18 });
      if (ARENA.r > 220) obs.push({ type: 'volcano', x: ARENA.cx + ARENA.r * 0.35, y: ARENA.cy - ARENA.r * 0.6, r: 12 });
    }
    if (S.id === 'king') obs.push({ type: 'king', x: ARENA.cx, y: ARENA.y + 62, r: 38 });
    if (S.id === 'lamp') obs.push({ type: 'lamp', x: ARENA.cx, y: ARENA.cy, r: 14 });
    if (S.id === 'earth') { obs.push({ type: 'well', x: ARENA.cx + ARENA.w * 0.25, y: ARENA.cy + ARENA.h * 0.18, r: 26 }); fox = { x0: ARENA.x + ARENA.w - 46, y0: ARENA.y + 44 }; newSnake(); }
    fillFoods();
    $('cardEm').textContent = S.ic; $('cardNm').textContent = EN ? S.en : S.ko; $('cardNo').textContent = 'STAGE ' + (i + 1);
    $('card').classList.add('show'); $('over').classList.remove('show'); $('title').classList.add('hide');
    document.body.classList.add('play');
    state = 'card'; waitT = 1.6;
    hud(true);
  }
  function fillFoods() {
    var want = { jungle: 3, b612: 0, king: 6, drunk: 3, biz: 0, lamp: 4, earth: 3 }[S.id];
    while (foods.length < want) addFood();
  }
  function addFood(ch, extra) {
    var p = randPt(36), f = { x: p.x, y: p.y, ch: ch || S.food, seed: Math.random() * 6, age: 0 };
    if (S.id === 'king' && !ch) { var counts = [0, 0, 0]; foods.forEach(function (q) { counts[KING_FOODS.indexOf(q.ch)]++; }); var mi = counts.indexOf(Math.min.apply(null, counts)); f.ch = KING_FOODS[mi]; }
    if (S.id === 'jungle') { f.hopT = rnd(1, 3); }
    if (extra) for (var k in extra) f[k] = extra[k];
    foods.push(f); return f;
  }

  // ── 먹기 ──
  function eatFood(idx) {
    var f = foods[idx]; foods.splice(idx, 1);
    var good = true;
    if (S.id === 'king') {
      good = f.ch === KING_FOODS[king.order];
      if (!good) { boa.len = Math.max(START_LEN, boa.len - 3); king.shake = 0.6; A.wrong(); flash('✗', true); combo = 0; addFood(); return; }
      newOrder(); score += 20;
    } else score += 10;
    ate++; combo++; comboT = 1.6;
    boa.len += (S.id === 'biz' || S.id === 'b612') ? 1 : 2;
    bulges.push({ d: 0, s: 0.5, w: 13 });
    A.eat(combo);
    spawnBits(f.x, f.y, S.id === 'biz' ? '#ffd35a' : S.id === 'earth' ? '#5ab0ff' : '#8bc34a');
    if (S.id === 'drunk') { drunkT = 4; A.hic(); }
    if (S.id === 'biz') bizT = Math.min((S.timer || 40), bizT + 0.6);
    if (ate >= S.quota && !eles.length && !elesEaten) spawnEles(S.eles, (S.eles > 1 ? 26 : 34) * (Math.min(ARENA.w, ARENA.h) < 420 ? 0.8 : 1));
    else if (S.id !== 'biz' && S.id !== 'b612') addFood();
    hud();
  }
  function newOrder() { var o; do { o = Math.floor(Math.random() * 3); } while (o === king.order); king.order = o; king.T = 7; A.order(); }
  function eatEle(e) {
    e.eaten = 1; elesEaten++; score += 100; A.gulp(); shake = 0.35;
    bulges.push({ d: -e.r * 0.5, s: 1.35, w: e.r * 1.05 });
    flash('GULP');
    if (elesEaten >= S.eles) { state = 'gulp'; waitT = 1.9; aiPt = null; }
    hud();
  }
  function spawnBits(x, y, col) { for (var i = 0; i < 7; i++) { var a = Math.random() * TAU, s = rnd(60, 160); bits.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.3, 0.6), col: col }); } }

  // ── 죽음·클리어 ──
  var lastWhy = '';
  function die(why) {
    if (state !== 'play') return; lastWhy = why;
    state = 'over'; waitT = 1.0; deadEyes = true; shake = 0.7; A.lose();
    if (why === 'snake') A.hiss(); if (why === 'break') { A.crack(); planetBreak = 1; }
    if (score > best) { best = score; save('best', best); }
  }
  function showOver() {
    $('oh').textContent = 'STAGE ' + (si + 1);
    var r = $('ores'); r.textContent = 'GAME OVER'; r.className = 'res lose';
    $('hat').classList.remove('show'); $('osc').textContent = '⭐ ' + score;
    $('btnRetry').textContent = 'RETRY'; $('over').classList.add('show');
    document.body.classList.remove('play');
  }
  function doClear() {
    state = 'clear'; A.clear();
    score += 200 + (S.id === 'biz' ? Math.round(bizT) * 10 : 0);
    if (si + 1 > prog) { prog = si + 1; save('stage', prog); }
    if (score > best) { best = score; save('best', best); }
    var last = si >= STAGES.length - 1;
    $('oh').textContent = last ? 'BOA' : 'STAGE ' + (si + 1);
    var r = $('ores'); r.textContent = last ? 'THE END' : 'CLEAR'; r.className = 'res win';
    $('hat').classList.add('show'); hatPh = 0; hatOn = true; drawHat(0);
    $('osc').textContent = '⭐ ' + score;
    $('btnRetry').textContent = last ? 'RETRY' : 'NEXT';
    $('over').classList.add('show'); document.body.classList.remove('play');
    if (last) { state = 'end'; prog = 0; save('stage', 0); A.end(); }
    hud();
  }

  // ── 그림 1호 / 그림 2호 ──
  function drawHat(ph) {
    var c2 = $('hat'), g = c2.getContext('2d'), w = c2.width, h = c2.height;
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#f7eed6'; rrect(g, 0, 0, w, h, 14); g.fill();
    g.strokeStyle = 'rgba(58,40,16,.35)'; g.lineWidth = 2; rrect(g, 6, 6, w - 12, h - 12, 10); g.stroke();
    function silhouette() {
      g.beginPath(); g.moveTo(70, 262); g.lineTo(150, 258);
      g.bezierCurveTo(200, 250, 220, 120, 320, 112);
      g.bezierCurveTo(420, 112, 445, 250, 500, 258);
      g.lineTo(580, 262); g.quadraticCurveTo(596, 266, 580, 274); g.lineTo(70, 276); g.quadraticCurveTo(52, 270, 70, 262); g.closePath();
    }
    // 1호: 모자
    g.save(); g.globalAlpha = 1 - ph * 0.55;
    silhouette(); g.fillStyle = '#8a5a2b'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
    g.restore();
    if (ph > 0) {
      // 2호: 속이 보인다
      g.save(); g.globalAlpha = ph;
      silhouette(); g.fillStyle = 'rgba(247,238,214,.55)'; g.fill();
      g.save(); silhouette(); g.clip(); drawEle(g, 322, 205, 62, -1, 0, 1); g.restore();
      silhouette(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      // 뱀 머리·눈·혀
      g.fillStyle = INK; circle(g, 568, 266, 3);
      g.strokeStyle = '#c33'; g.lineWidth = 2; g.beginPath(); g.moveTo(590, 270); g.lineTo(606, 268); g.lineTo(612, 263); g.moveTo(606, 268); g.lineTo(612, 273); g.stroke();
      g.restore();
    }
  }

  // ── 배경 ──
  function buildBg() {
    bg.width = W * DPR; bg.height = H * DPR; bgx.setTransform(DPR, 0, 0, DPR, 0, 0);
    nc.width = W * DPR; nc.height = H * DPR;
    var g = bgx, id = state === 'title' ? 'jungle' : S.id;
    var A2 = ARENA;
    g.fillStyle = '#efe3c4'; g.fillRect(0, 0, W, H);
    // 판 바탕
    var ground = { jungle: '#eef0cf', b612: '#efe0b8', king: '#f5dfd6', drunk: '#f3e6be', biz: '#f8f3e4', lamp: '#d6cbe3', earth: '#f1dc98' }[id];
    g.save();
    if (id === 'b612') {
      g.fillStyle = '#1c1e3d'; g.fillRect(0, 0, W, H);
      for (var i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + rnd(0.3, 0.95) + ')'; circle(g, Math.random() * W, Math.random() * H, rnd(0.5, 1.8)); }
      g.beginPath(); g.arc(A2.cx, A2.cy, A2.r, 0, TAU); g.clip();
    } else { g.beginPath(); g.rect(A2.x, A2.y, A2.w, A2.h); g.clip(); }
    g.fillStyle = ground; g.fillRect(0, 0, W, H);
    // 종이 결
    for (i = 0; i < 2200; i++) { g.fillStyle = 'rgba(80,60,20,' + rnd(0.02, 0.08) + ')'; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
    if (id === 'jungle') {
      for (i = 0; i < 46; i++) {
        var side = i % 4, px, py;
        if (side === 0) { px = rnd(A2.x, A2.x + A2.w); py = A2.y + rnd(-10, 70); } else if (side === 1) { px = rnd(A2.x, A2.x + A2.w); py = A2.y + A2.h - rnd(-10, 70); } else if (side === 2) { px = A2.x + rnd(-10, 70); py = rnd(A2.y, A2.y + A2.h); } else { px = A2.x + A2.w - rnd(-10, 70); py = rnd(A2.y, A2.y + A2.h); }
        leaf(g, px, py, rnd(40, 80), Math.random() * TAU, ['#5f8a3c', '#7aa84a', '#4c7a35'][i % 3], 0.4);
      }
    } else if (id === 'b612') {
      g.fillStyle = 'rgba(120,90,40,.12)'; for (i = 0; i < 14; i++) circle(g, A2.cx + rnd(-1, 1) * A2.r * 0.8, A2.cy + rnd(-1, 1) * A2.r * 0.8, rnd(10, 30));
    } else if (id === 'king') {
      g.fillStyle = '#b6393c'; g.fillRect(A2.cx - 60, A2.y, 120, A2.h); g.fillStyle = '#e0b04a'; g.fillRect(A2.cx - 66, A2.y, 6, A2.h); g.fillRect(A2.cx + 60, A2.y, 6, A2.h);
      g.fillStyle = 'rgba(0,0,0,.06)'; for (i = 0; i < 12; i++) circle(g, rnd(A2.x, A2.x + A2.w), rnd(A2.y, A2.y + A2.h), rnd(8, 18));
    } else if (id === 'drunk') {
      g.lineWidth = 3; for (i = 0; i < 24; i++) { g.strokeStyle = 'rgba(140,30,60,' + rnd(0.08, 0.18) + ')'; var rr2 = rnd(14, 32); g.beginPath(); g.arc(rnd(A2.x, A2.x + A2.w), rnd(A2.y, A2.y + A2.h), rr2, 0, TAU); g.stroke(); }
    } else if (id === 'biz') {
      g.strokeStyle = 'rgba(120,100,70,.35)'; g.lineWidth = 1; for (var y = A2.y + 28; y < A2.y + A2.h; y += 28) { g.beginPath(); g.moveTo(A2.x, y); g.lineTo(A2.x + A2.w, y); g.stroke(); }
      g.strokeStyle = 'rgba(200,60,60,.45)'; g.beginPath(); g.moveTo(A2.x + 70, A2.y); g.lineTo(A2.x + 70, A2.y + A2.h); g.stroke();
      g.fillStyle = 'rgba(60,50,40,.16)'; g.font = '16px Arial'; g.textAlign = 'right';
      for (y = A2.y + 22, i = 0; y < A2.y + A2.h; y += 28, i++) g.fillText(String(Math.floor(rnd(100000, 999999))).replace(/\B(?=(\d{3})+(?!\d))/g, ','), A2.x + A2.w - 30, y);
      emoji(g, '🧐', A2.x + A2.w - 44, A2.y + 64, 42, 0.9);
    } else if (id === 'lamp') {
      var rg = g.createRadialGradient(A2.cx, A2.cy, 20, A2.cx, A2.cy, Math.max(A2.w, A2.h) * 0.6); rg.addColorStop(0, 'rgba(255,240,200,.35)'); rg.addColorStop(1, 'rgba(60,40,90,.35)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
    } else if (id === 'earth') {
      var cols = ['#e9cf7d', '#dcbb60', '#f0dc98', '#e3c36c'];
      for (i = 0; i < 7; i++) {
        var yy = A2.y + (i + 0.5) * A2.h / 7; g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(A2.x, yy);
        for (var x = A2.x; x <= A2.x + A2.w + 40; x += 40) g.lineTo(x, yy + Math.sin(x / 90 + i) * 22);
        g.lineTo(A2.x + A2.w, A2.y + A2.h); g.lineTo(A2.x, A2.y + A2.h); g.closePath(); g.fill();
      }
      g.strokeStyle = 'rgba(120,80,20,.25)'; g.lineWidth = 2; for (i = 0; i < 7; i++) { yy = A2.y + (i + 0.5) * A2.h / 7; g.beginPath(); for (x = A2.x; x <= A2.x + A2.w + 40; x += 40) g.lineTo(x, yy + Math.sin(x / 90 + i) * 22); g.stroke(); }
      // 우물
      var wo = { x: A2.cx + A2.w * 0.25, y: A2.cy + A2.h * 0.18 };
      g.fillStyle = 'rgba(0,0,0,.12)'; circle(g, wo.x + 4, wo.y + 6, 28);
      g.fillStyle = '#b9ae9c'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(wo.x, wo.y, 26, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#3d5b86'; circle(g, wo.x, wo.y, 15);
      g.strokeStyle = '#6b4a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(wo.x - 22, wo.y - 6); g.lineTo(wo.x - 22, wo.y - 40); g.moveTo(wo.x + 22, wo.y - 6); g.lineTo(wo.x + 22, wo.y - 40); g.moveTo(wo.x - 26, wo.y - 40); g.lineTo(wo.x + 26, wo.y - 40); g.stroke();
    }
    g.restore();
    // 테두리(잉크)
    g.strokeStyle = INK; g.lineWidth = 4; g.lineJoin = 'round';
    if (id === 'b612') { g.beginPath(); g.arc(A2.cx, A2.cy, A2.r, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(43,36,24,.35)'; g.lineWidth = 1.5; g.beginPath(); g.arc(A2.cx + 2, A2.cy + 3, A2.r + 5, 0, TAU); g.stroke(); }
    else { g.strokeRect(A2.x, A2.y, A2.w, A2.h); g.strokeStyle = 'rgba(43,36,24,.35)'; g.lineWidth = 1.5; g.strokeRect(A2.x + 4, A2.y + 4, A2.w - 8, A2.h - 8); }
  }
  function leaf(g, x, y, len, ang, col, alpha) {
    g.save(); g.translate(x, y); g.rotate(ang); g.globalAlpha = alpha; g.fillStyle = col;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0); g.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.stroke(); g.restore();
  }

  // ── 진행 ──
  function step(dt) {
    if (paused && state === 'play') return;
    tt += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 1.6);
    if (king.shake > 0) king.shake -= dt;
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }
    if (dash > 0) dash -= dt; if (dashCd > 0) dashCd -= dt;
    for (var i = bits.length - 1; i >= 0; i--) { var b = bits[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.9; b.vy *= 0.9; if (b.life <= 0) bits.splice(i, 1); }
    if (hatOn && hatPh >= 0 && hatPh < 1) { hatPh = Math.min(1, hatPh + dt / 2.2); drawHat(hatPh < 0.3 ? 0 : (hatPh - 0.3) / 0.7); }

    if (state === 'title') { aiSteer(dt); boaStep(dt, true); return; }
    if (state === 'card') { waitT -= dt; if (waitT <= 0) { $('card').classList.remove('show'); state = 'play'; } return; }
    if (state === 'over') { waitT -= dt; if (waitT <= 0 && !$('over').classList.contains('show')) showOver(); return; }
    if (state === 'gulp') {
      t += dt; aiSteer(dt); boaStep(dt, true);
      eles.forEach(function (e) { if (!e.eaten) eleStep(e, dt); });
      waitT -= dt; if (waitT <= 0) doClear(); return;
    }
    if (state !== 'play') return;

    t += dt;
    // 조종
    var kt = keyTgt();
    if (kt !== null) boa.tgt = kt;
    else if (padVec) boa.tgt = Math.atan2(padVec.y, padVec.x);
    else if (mouse && !isTouch) boa.tgt = Math.atan2(mouse.y - boa.y, mouse.x - boa.x);
    if (drunkT > 0) drunkT -= dt;
    boaStep(dt, false);

    // 별마다 다른 규칙
    stageStep(dt);

    // 충돌
    var hx = boa.x, hy = boa.y;
    if (!inside(hx, hy, HEAD_R * 0.5)) return die('wall');
    for (i = 9; i < boa.segs.length; i++) { var s = boa.segs[i]; if (dist(hx, hy, s.x, s.y) < HEAD_R + segR(i) - 4) return die('self'); }
    for (i = 0; i < obs.length; i++) { var o = obs[i]; if (dist(hx, hy, o.x, o.y) < HEAD_R * 0.8 + o.r) return die(o.type); }
    if (snake) { if (dist(hx, hy, snake.x, snake.y) < HEAD_R + 8) return die('snake'); for (i = snake.trail.length - 1; i >= 0; i -= 3) if (dist(hx, hy, snake.trail[i].x, snake.trail[i].y) < HEAD_R + 5) return die('snake'); }
    for (i = foods.length - 1; i >= 0; i--) { var f = foods[i]; if (dist(hx, hy, f.x, f.y) < HEAD_R + 13) { eatFood(i); break; } }
    for (i = 0; i < eles.length; i++) { var e = eles[i]; if (!e.eaten && dist(hx, hy, e.x, e.y) < HEAD_R + e.r * 0.8) { eatEle(e); break; } }
    hud();
  }
  function stageStep(dt) {
    var i, f;
    eles.forEach(function (e) { if (!e.eaten) eleStep(e, dt); });
    if (S.id === 'jungle') {
      for (i = 0; i < foods.length; i++) {
        f = foods[i];
        if (f.hop) { f.hop.p += dt / 0.35; if (f.hop.p >= 1) { f.x = f.hop.x1; f.y = f.hop.y1; f.hop = null; f.hopT = rnd(1.5, 3.5); } else { var p = f.hop.p; f.x = lerp(f.hop.x0, f.hop.x1, p); f.y = lerp(f.hop.y0, f.hop.y1, p) - Math.sin(p * PI) * 26; } }
        else { f.hopT -= dt; if (f.hopT <= 0) { var a = Math.random() * TAU, x1 = f.x + Math.cos(a) * 70, y1 = f.y + Math.sin(a) * 70; if (inside(x1, y1, 36) && !badSpot(x1, y1) && !nearObs(x1, y1, 30)) f.hop = { x0: f.x, y0: f.y, x1: x1, y1: y1, p: 0 }; else f.hopT = 0.5; } }
      }
    } else if (S.id === 'b612') {
      sproutT -= dt;
      if (sproutT <= 0 && foods.length < (ARENA.r > 220 ? 6 : 4) && ate < S.quota) { addFood('🌱'); sproutT = rnd(1.6, 2.6); }
      for (i = foods.length - 1; i >= 0; i--) {
        f = foods[i]; f.age += dt;
        if (f.age > 9) { foods.splice(i, 1); obs.push({ type: 'tree', x: f.x, y: f.y, r: 22, born: t }); trees++; A.crack(); shake = Math.max(shake, 0.3); if (trees === 2) makeCracks(); if (trees >= 4) die('break'); }
      }
    } else if (S.id === 'king') {
      king.T -= dt; if (king.T <= 0) newOrder();
    } else if (S.id === 'biz') {
      starT -= dt;
      if (starT <= 0 && ate < S.quota && foods.length < 14) { var x = rnd(ARENA.x + 30, ARENA.x + ARENA.w - 30); foods.push({ x: x, y: ARENA.y + 10, ch: '⭐', seed: Math.random() * 6, age: 0, vy: rnd(55, 95), sw: rnd(0.6, 1.4) }); starT = rnd(0.35, 0.6); }
      for (i = foods.length - 1; i >= 0; i--) { f = foods[i]; f.age += dt; f.y += f.vy * dt; f.x += Math.sin(f.age * 2 * f.sw + f.seed) * 30 * dt; if (f.y > ARENA.y + ARENA.h - 14) foods.splice(i, 1); }
      if (ate < S.quota) { var before = Math.ceil(bizT); bizT -= dt; if (bizT <= 10 && Math.ceil(bizT) !== before) A.tick(); if (bizT <= 0) { bizT = 0; return die('time'); } }
    } else if (S.id === 'lamp') {
      lampT += dt; if (lampT >= lampP) { lampT = 0; night = !night; lampP = Math.max(1.5, lampP * 0.88); A.lamp(night); }
      nightA = clamp(nightA + (night ? dt * 2.5 : -dt * 2.5), 0, 1);
    } else if (S.id === 'earth') {
      snakeStep(dt);
    }
  }
  function makeCracks() {
    crackLines = [];
    obs.forEach(function (o) { if (o.type !== 'volcano') return; var pts = [{ x: o.x, y: o.y }], a = Math.random() * TAU, x = o.x, y = o.y; for (var k = 0; k < 7; k++) { a += rnd(-0.8, 0.8); x += Math.cos(a) * rnd(20, 40); y += Math.sin(a) * rnd(20, 40); pts.push({ x: x, y: y }); } crackLines.push(pts); });
  }

  // ── HUD ──
  var hudCache = {};
  function setT(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
  function hud(force) {
    if (force) hudCache = {};
    setT('stgIc', S.ic); setT('stgNm', EN ? S.en : S.ko);
    var eleP = ate >= S.quota;
    setT('fdIc', eleP ? '🐘' : S.id === 'king' ? KING_FOODS[king.order] : S.food);
    setT('fdN', String(eleP ? elesEaten : ate)); setT('fdQ', '/' + (eleP ? S.eles : S.quota));
    setT('scN', String(score));
    var tm = $('tm'); tm.classList.toggle('show', S.id === 'biz'); if (S.id === 'biz') { setT('tmN', String(Math.ceil(bizT))); tm.classList.toggle('hot', bizT <= 10 && ate < S.quota); }
    var bd = $('btnDash'); bd.classList.toggle('on', dash > 0); bd.classList.toggle('cd', dash <= 0 && dashCd > 0);
  }
  var flashT = null;
  function flash(txt, bad) { var f = $('flash'); f.textContent = txt; f.className = bad ? 'show bad' : 'show'; clearTimeout(flashT); flashT = setTimeout(function () { f.className = ''; }, 750); }

  // ── 그리기 ──
  function render() {
    if (!W || !H || !bg.width) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake * 16, (Math.random() - 0.5) * shake * 16);
    if (drunkT > 0) { var k = Math.min(1, drunkT); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(tt * 3.1) * 0.07 * k); ctx.scale(1 + 0.04 * k, 1 + 0.04 * k); ctx.translate(-W / 2, -H / 2); }
    ctx.drawImage(bg, 0, 0, W, H);
    if (planetBreak) drawBreak(ctx);
    drawCracks(ctx);
    drawObs(ctx);
    drawFoods(ctx);
    drawFox(ctx);
    drawSnake(ctx);
    for (var i = 0; i < eles.length; i++) { var e = eles[i]; if (!e.eaten) { ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(e.x + 3, e.y + e.r * 0.95, e.r * 1.3, e.r * 0.28, 0, 0, TAU); ctx.fill(); drawEle(ctx, e.x, e.y, e.r, e.face, e.ph); } }
    if (boa) drawBoa(ctx);
    for (i = 0; i < bits.length; i++) { var b = bits[i]; ctx.fillStyle = b.col; ctx.globalAlpha = Math.min(1, b.life * 3); circle(ctx, b.x, b.y, 3); } ctx.globalAlpha = 1;
    if (S.id === 'lamp' && nightA > 0 && state !== 'title') drawNight();
    ctx.restore();
    if (paused && state === 'play') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.font = '900 42px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PAUSE', W / 2, H / 2); }
  }
  function drawBoa(g) {
    var segs = boa.segs, n = segs.length, rs = [], i;
    for (i = 0; i < n; i++) rs[i] = segR(i);
    g.fillStyle = 'rgba(60,40,10,.16)'; for (i = n - 1; i >= 0; i--) circle(g, segs[i].x + 3, segs[i].y + 5, rs[i]);
    g.fillStyle = INK; for (i = n - 1; i >= 0; i--) circle(g, segs[i].x, segs[i].y, rs[i] + 2.2);
    circle(g, boa.x, boa.y, HEAD_R + 2.2);
    g.fillStyle = '#8b9b46'; for (i = n - 1; i >= 0; i--) circle(g, segs[i].x, segs[i].y, rs[i]);
    circle(g, boa.x, boa.y, HEAD_R);
    g.fillStyle = '#5c682a'; for (i = 2; i < n; i += 3) circle(g, segs[i].x, segs[i].y, rs[i] * 0.48);
    g.fillStyle = 'rgba(255,255,220,.25)'; for (i = n - 1; i >= 0; i--) circle(g, segs[i].x - rs[i] * 0.3, segs[i].y - rs[i] * 0.3, rs[i] * 0.35);
    // 돌진 줄
    if (dash > 0) { g.strokeStyle = 'rgba(43,36,24,.35)'; g.lineWidth = 2; for (i = 0; i < 3; i++) { var a = boa.ang + PI + (i - 1) * 0.5, x0 = boa.x + Math.cos(a) * 20, y0 = boa.y + Math.sin(a) * 20; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * 26, y0 + Math.sin(a) * 26); g.stroke(); } }
    // 눈
    var ex = Math.cos(boa.ang), ey = Math.sin(boa.ang), px = -ey, py = ex;
    for (var s = -1; s <= 1; s += 2) {
      var cx = boa.x + ex * HEAD_R * 0.35 + px * s * HEAD_R * 0.55, cy = boa.y + ey * HEAD_R * 0.35 + py * s * HEAD_R * 0.55;
      if (deadEyes) { g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 3, cy - 3); g.lineTo(cx + 3, cy + 3); g.moveTo(cx + 3, cy - 3); g.lineTo(cx - 3, cy + 3); g.stroke(); }
      else { g.fillStyle = '#fff'; circle(g, cx, cy, 3.8); g.fillStyle = INK; circle(g, cx + ex * 1.4, cy + ey * 1.4, 2.1); }
    }
    // 혀
    if (!deadEyes && (tt % 1.9) < 0.22) { g.strokeStyle = '#d33'; g.lineWidth = 2; g.lineCap = 'round'; var mx = boa.x + ex * HEAD_R, my = boa.y + ey * HEAD_R, tx = mx + ex * 12, ty = my + ey * 12; g.beginPath(); g.moveTo(mx, my); g.lineTo(tx, ty); g.lineTo(tx + ex * 5 + px * 4, ty + ey * 5 + py * 4); g.moveTo(tx, ty); g.lineTo(tx + ex * 5 - px * 4, ty + ey * 5 - py * 4); g.stroke(); }
  }
  function drawFoods(g) {
    for (var i = 0; i < foods.length; i++) {
      var f = foods[i], bob = Math.sin(tt * 3 + f.seed) * 2, size = 26;
      if (S.id === 'b612') { size = 18 + f.age * 1.6; if (f.age > 7) bob += Math.sin(tt * 30) * 2; }
      if (S.id === 'lamp' && nightA > 0) { g.fillStyle = 'rgba(255,235,150,' + 0.35 * nightA + ')'; circle(g, f.x, f.y, 16); }
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(f.x + 2, f.y + size * 0.62, size * 0.5, size * 0.16, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.72)'; g.strokeStyle = 'rgba(43,36,24,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(f.x, f.y + bob, size * 0.66, 0, TAU); g.fill(); g.stroke();
      emoji(g, f.ch, f.x, f.y + bob, size);
    }
  }
  function drawObs(g) {
    for (var i = 0; i < obs.length; i++) {
      var o = obs[i];
      if (o.type === 'tree') { var gr = Math.min(1, (t - o.born) / 0.4); g.save(); g.translate(o.x, o.y); g.scale(gr, gr); g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(4, 24, 26, 8, 0, 0, TAU); g.fill(); emoji(g, '🌳', 0, 0, 58); g.restore(); }
      else if (o.type === 'volcano') { g.fillStyle = '#8a6a4a'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(o.x - o.r * 1.3, o.y + o.r * 0.8); g.lineTo(o.x - o.r * 0.4, o.y - o.r * 0.9); g.lineTo(o.x + o.r * 0.4, o.y - o.r * 0.9); g.lineTo(o.x + o.r * 1.3, o.y + o.r * 0.8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#4a3222'; g.beginPath(); g.ellipse(o.x, o.y - o.r * 0.9, o.r * 0.4, o.r * 0.16, 0, 0, TAU); g.fill(); if (o.r > 14) { g.fillStyle = 'rgba(200,200,200,.5)'; circle(g, o.x + Math.sin(tt) * 3, o.y - o.r * 1.5 - (tt * 8 % 14), 5 + (tt * 8 % 14) * 0.4); } }
      else if (o.type === 'rose') { g.strokeStyle = '#4a7a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(o.x, o.y + 20); g.lineTo(o.x, o.y - 4); g.stroke(); emoji(g, '🌹', o.x, o.y - 8, 26); g.fillStyle = 'rgba(170,215,255,.28)'; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.beginPath(); g.ellipse(o.x, o.y, o.r, o.r * 1.15, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(o.x - o.r * 0.45, o.y - o.r * 0.5, o.r * 0.18, o.r * 0.32, 0.5, 0, TAU); g.fill(); }
      else if (o.type === 'king') {
        var kx = o.x + (king.shake > 0 ? Math.sin(tt * 40) * 4 : 0), ky = o.y;
        g.fillStyle = '#6a3b8a'; g.strokeStyle = INK; g.lineWidth = 3; rrect(g, kx - 34, ky - 40, 68, 74, 10); g.fill(); g.stroke(); g.fillStyle = '#e0b04a'; rrect(g, kx - 34, ky - 40, 68, 10, 5); g.fill();
        emoji(g, '🤴', kx, ky + 2, 52);
        // 명령 말풍선
        var bx = kx + 62, by = ky - 30, rem = clamp(king.T / 7, 0, 1);
        g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 2.5; rrect(g, bx - 26, by - 24, 52, 48, 12); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(bx - 26, by + 6); g.lineTo(bx - 38, by + 14); g.lineTo(bx - 26, by + 16); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 26, by + 6); g.lineTo(bx - 26, by + 16); g.stroke();
        emoji(g, king.shake > 0 ? '❗' : KING_FOODS[king.order], bx, by, 30);
        g.strokeStyle = '#e0b04a'; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, 30, -PI / 2, -PI / 2 + TAU * rem); g.stroke();
      }
      else if (o.type === 'lamp') {
        if (nightA > 0) { var rg = g.createRadialGradient(o.x, o.y - 26, 4, o.x, o.y - 26, 90); rg.addColorStop(0, 'rgba(255,220,120,' + 0.55 * nightA + ')'); rg.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = rg; circle(g, o.x, o.y - 26, 90); }
        g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.x, o.y + 10); g.lineTo(o.x, o.y - 22); g.stroke(); g.fillStyle = INK; g.beginPath(); g.ellipse(o.x, o.y + 10, 12, 5, 0, 0, TAU); g.fill();
        g.fillStyle = nightA > 0.5 ? '#ffd35a' : '#8a8a90'; g.strokeStyle = INK; g.lineWidth = 2.5; rrect(g, o.x - 9, o.y - 40, 18, 20, 4); g.fill(); g.stroke(); g.beginPath(); g.moveTo(o.x - 12, o.y - 40); g.lineTo(o.x, o.y - 48); g.lineTo(o.x + 12, o.y - 40); g.closePath(); g.fillStyle = INK; g.fill();
      }
    }
  }
  function drawFox(g) {
    if (!fox) return; var p = clamp(ate / S.quota, 0, 1), well = obs[0];
    var x = lerp(fox.x0, well.x - 60, p * p), y = lerp(fox.y0, well.y - 34, p * p);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(x, y + 16, 14, 5, 0, 0, TAU); g.fill();
    emoji(g, '🦊', x, y, 34);
  }
  function drawCracks(g) {
    if (!crackLines.length) return; g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round';
    crackLines.forEach(function (pts) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke(); });
  }
  function drawBreak(g) { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(ARENA.cx - ARENA.r, ARENA.cy - 20); for (var x = -ARENA.r; x <= ARENA.r; x += 30) g.lineTo(ARENA.cx + x, ARENA.cy + Math.sin(x * 0.2) * 24); g.stroke(); }
  function drawNight() {
    ncx.setTransform(DPR, 0, 0, DPR, 0, 0); ncx.globalCompositeOperation = 'source-over'; ncx.clearRect(0, 0, W, H);
    ncx.fillStyle = 'rgba(12,10,42,' + (0.9 * nightA) + ')'; ncx.fillRect(0, 0, W, H);
    ncx.globalCompositeOperation = 'destination-out';
    function hole(x, y, r) { var rg = ncx.createRadialGradient(x, y, r * 0.3, x, y, r); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); ncx.fillStyle = rg; circle(ncx, x, y, r); }
    hole(boa.x, boa.y, 130);
    obs.forEach(function (o) { if (o.type === 'lamp') hole(o.x, o.y - 26, 120); });
    ctx.drawImage(nc, 0, 0, W, H);
  }

  // ── 입력 ──
  function keyTgt() { var dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); if (!dx && !dy) return null; return Math.atan2(dy, dx); }
  function keyName(e) { var k = e.key; if (k === 'ArrowLeft' || k === 'a' || k === 'A') return 'left'; if (k === 'ArrowRight' || k === 'd' || k === 'D') return 'right'; if (k === 'ArrowUp' || k === 'w' || k === 'W') return 'up'; if (k === 'ArrowDown' || k === 's' || k === 'S') return 'down'; return null; }
  function doDash() { if (state !== 'play' || dashCd > 0) return; dash = 0.9; dashCd = 2.6; A.dash(); }
  window.addEventListener('keydown', function (e) {
    var n = keyName(e); if (n) { keys[n] = true; mouse = null; e.preventDefault(); return; }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (state === 'title') begin(0); else if (state === 'play') doDash(); else if ($('over').classList.contains('show')) retry(); }
    if (e.key === 'p' || e.key === 'P') togglePause();
    if (e.key === 'k' || e.key === 'K') toggleSnd();
  });
  window.addEventListener('keyup', function (e) { var n = keyName(e); if (n) keys[n] = false; });
  window.addEventListener('blur', function () { keys = {}; padVec = null; });
  cv.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') mouse = { x: e.clientX, y: e.clientY }; });
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { if (!isTouch) { isTouch = true; document.body.classList.add('touch'); } return; }
    mouse = { x: e.clientX, y: e.clientY }; if (state === 'play') doDash();
  });
  // 폰 패드
  var pad = $('pad'), knob = $('knob');
  pad.addEventListener('pointerdown', function (e) { padId = e.pointerId; pad.setPointerCapture(padId); padMove(e); e.preventDefault(); });
  pad.addEventListener('pointermove', function (e) { if (e.pointerId === padId) padMove(e); });
  function padEnd(e) { if (e.pointerId !== padId) return; padId = null; padVec = null; knob.style.transform = ''; }
  pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
  function padMove(e) {
    var r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    padVec = d > R * 0.08 ? { x: dx, y: dy } : null;
  }
  $('btnDash').addEventListener('pointerdown', function (e) { e.preventDefault(); doDash(); });

  function togglePause() { if (state !== 'play') return; paused = !paused; $('tgPause').textContent = paused ? '▶' : '❚❚'; $('tgPause').classList.toggle('off', paused); }
  function toggleSnd() { var on = A.toggleSnd(); $('tgSnd').classList.toggle('off', !on); }
  $('tgPause').addEventListener('click', togglePause);
  $('tgSnd').addEventListener('click', toggleSnd);
  $('tgSnd').classList.toggle('off', !A.snd);

  function begin(i) { A.init(); startStage(i); }
  function retry() {
    A.init();
    if (state === 'end') { score = 0; startStage(0); return; }
    if (state === 'clear') { startStage(si + 1); return; }
    score = stageScore0; startStage(si);
  }
  function toTitle() {
    state = 'title'; S = STAGES[0]; setArena(); buildBg(); obs = []; foods = []; eles = []; snake = null; fox = null; newBoa(18); deadEyes = false; nightA = 0; drunkT = 0; shake = 0;
    $('over').classList.remove('show'); $('title').classList.remove('hide'); document.body.classList.remove('play');
    $('rec').textContent = best > 0 ? 'BEST ' + best : '';
    $('btnCont').textContent = prog > 0 && prog < STAGES.length ? 'STAGE ' + (prog + 1) + ' ▶' : '';
    score = 0; hud(true);
  }
  $('btnStart').addEventListener('click', function () { begin(0); });
  $('btnCont').addEventListener('click', function () { if (prog > 0) begin(prog); });
  $('btnRetry').addEventListener('click', retry);
  $('btnHome').addEventListener('click', toTitle);

  // ── 크기 ──
  // 숨겨진 탭에서는 창 크기가 0으로 읽힌다 — 임시로 1280×720 을 쓰고, 다음 프레임에 진짜 크기로 다시 잰다
  function vsize() { return [window.innerWidth || document.documentElement.clientWidth || 1280, window.innerHeight || document.documentElement.clientHeight || 720]; }
  function sizeChanged() { var v = vsize(); return v[0] && v[1] && (v[0] !== W || v[1] !== H); }
  function resize() {
    var v = vsize(); if (!v[0] || !v[1]) return;
    DPR = Math.min(2, window.devicePixelRatio || 1); W = v[0]; H = v[1];
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    setArena(); buildBg();
    if (boa && state === 'title') newBoa(18);
  }
  window.addEventListener('resize', resize);
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }

  // ── 루프 ──
  var last = 0;
  function frame(ts) { requestAnimationFrame(frame); if (sizeChanged()) resize(); var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts; step(dt); render(); }
  resize(); toTitle(); requestAnimationFrame(frame);

  // 시험 손잡이
  window.__boa = {
    tick: function (n, dt) { if (sizeChanged()) resize(); for (var i = 0; i < (n || 1); i++) step(dt || 1 / 60); render(); },
    get: function () { return { why: lastWhy, state: state, si: si, ate: ate, elesEaten: elesEaten, score: score, len: boa && boa.len, foods: foods, eles: eles, obs: obs, boa: boa, arena: ARENA, night: night, drunkT: drunkT, bizT: bizT, trees: trees }; },
    auto: function (n) { keys = {}; mouse = null; for (var i = 0; i < (n || 1); i++) { if (boa) aiSteer(1 / 60); step(1 / 60); } render(); },
    start: begin, retry: retry, die: die, setTgt: function (a) { boa.tgt = a; keys = {}; mouse = null; },
    feed: function () { if (foods.length) { foods[0].x = boa.x; foods[0].y = boa.y; } },
    ele: function () { if (eles.length) { eles[0].x = boa.x; eles[0].y = boa.y; } },
    quota: function () { ate = S.quota - 1; }
  };
})();
