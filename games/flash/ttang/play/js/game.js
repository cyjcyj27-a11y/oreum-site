/* 땅따먹기 — 마당에 그린 네모 판. 내 집에서 사금파리를 세 번 튕겨 집으로 돌아오면, 지나간 자리가 내 땅이 된다.
   캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var A = window.TTAudio;

  // ── 논리 좌표: 700×700 판. 땅 주인은 350×350 칸(한 칸 2) 에 적는다 ──
  var LW = 700, LH = 700, GN = 350, CELL = LW / GN, HOME_R = 150, SR = 16, DMAX = 300, ROUNDS = 10, FLICKS = 3;
  var COL = [
    { tint: '63,143,214', edge: '#1c4d7e', path: '#18446f', hi: '#8fd0f5', lo: '#2a6aa6' },
    { tint: '224,87,63', edge: '#8a2616', path: '#7a2012', hi: '#ffb08c', lo: '#b2442b' }
  ];
  var HOME_PT = [{ x: 44, y: LH - 44 }, { x: LW - 44, y: 44 }];

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var own = new Uint8Array(GN * GN);
  var G = { mode: 'title', p2: false, stage: 1, turn: 0, taken: [0, 0], stones: [], T: null, mv: null, anim: null, slide: null, aiTimer: 0, aiPlan: null, pause: 0, result: -1, floats: [] };
  var drag = null, glow = 0, isTouch = false;
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'Land Grab'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }

  // ── 기록 — 가장 멀리 간 스테이지 ──
  function loadBest() { try { return Math.max(1, parseInt(localStorage.getItem('ttang.best') || '1', 10) || 1); } catch (e) { return 1; } }
  function saveBest(n) { try { localStorage.setItem('ttang.best', String(n)); } catch (e) {} }
  function showRec() { var b = loadBest(); $('rec').textContent = b > 1 ? 'BEST STAGE ' + b : ''; }

  // ── 화면 맞추기 ──
  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var top = ($('topbar').offsetHeight || 46) + 2, bottom = isTouch ? 8 : 26;
    var availW = w - 8, availH = h - top - bottom;
    var s = Math.max(0.05, Math.min(availW / (LW + 40), availH / (LH + 40)));
    view.s = s; view.ox = (w - LW * s) / 2; view.oy = top + (availH - LH * s) / 2;
    draw();
  }
  function applyView() { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s); }
  function toLogical(px, py) { return { x: (px - view.ox) / view.s, y: (py - view.oy) / view.s }; }

  // ── 땅 ──
  function inBoard(x, y) { return x >= 0 && y >= 0 && x < LW && y < LH; }
  function ownerAt(x, y) { if (!inBoard(x, y)) return 255; return own[((y / CELL) | 0) * GN + ((x / CELL) | 0)]; }
  var mc = document.createElement('canvas'); mc.width = GN; mc.height = GN;
  var mctx = mc.getContext('2d', { willReadFrequently: true });
  function fillMask(pathFn) {
    mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.clearRect(0, 0, GN, GN);
    mctx.setTransform(GN / LW, 0, 0, GN / LW, 0, 0); mctx.fillStyle = '#000';
    mctx.beginPath(); pathFn(mctx); mctx.fill();
    return mctx.getImageData(0, 0, GN, GN).data;
  }
  function polyPath(poly) { return function (c) { c.moveTo(poly[0].x, poly[0].y); for (var i = 1; i < poly.length; i++) c.lineTo(poly[i].x, poly[i].y); c.closePath(); }; }
  function commit(pathFn, p) {
    var d = fillMask(pathFn), n = 0, i, v = p + 1;
    for (i = 0; i < GN * GN; i++) if (d[i * 4 + 3] >= 128 && own[i] === 0) { own[i] = v; n++; }
    return n;
  }
  function shares() { var c = [0, 0], i; for (i = 0; i < GN * GN; i++) { if (own[i] === 1) c[0]++; else if (own[i] === 2) c[1]++; } return [c[0] / (GN * GN), c[1] / (GN * GN)]; }
  function resetLand() {
    own.fill(0);
    commit(function (c) { c.moveTo(0, LH); c.arc(0, LH, HOME_R, -Math.PI / 2, 0); c.closePath(); }, 0);
    commit(function (c) { c.moveTo(LW, 0); c.arc(LW, 0, HOME_R, Math.PI / 2, Math.PI); c.closePath(); }, 1);
  }

  // ── 땅 그림: 칸 가면을 부드럽게 늘려, 분필 빗금 칠 + 진한 테두리 ──
  var LS = 1050, layers = [], hatch = [], ec = document.createElement('canvas'); ec.width = GN; ec.height = GN;
  var ectx = ec.getContext('2d'), mk = document.createElement('canvas'); mk.width = GN; mk.height = GN;
  var mkctx = mk.getContext('2d');
  function rnd(a, b) { return a + Math.random() * (b - a); }
  (function mkHatch() {
    for (var p = 0; p < 2; p++) {
      var h = document.createElement('canvas'); h.width = LS; h.height = LS; var c = h.getContext('2d'), k, x;
      c.fillStyle = 'rgba(' + COL[p].tint + ',.34)'; c.fillRect(0, 0, LS, LS);
      c.strokeStyle = 'rgba(' + COL[p].tint + ',.5)'; c.lineCap = 'round';
      for (k = -LS; k < LS * 2; k += 19) {
        c.lineWidth = rnd(2, 4); c.beginPath();
        for (x = 0; x <= LS + 40; x += 40) { var y = (p === 0 ? k - x : k + x - LS) + rnd(-3, 3); if (x === 0) c.moveTo(x, y); else c.lineTo(x, y); }
        c.stroke();
      }
      hatch.push(h);
      var l = document.createElement('canvas'); l.width = LS; l.height = LS; layers.push(l);
    }
  })();
  function rebuild() {
    for (var p = 0; p < 2; p++) {
      var v = p + 1, md = mkctx.createImageData(GN, GN), ed = ectx.createImageData(GN, GN), m = md.data, e = ed.data, x, y, i;
      var er = parseInt(COL[p].edge.substr(1, 2), 16), eg = parseInt(COL[p].edge.substr(3, 2), 16), eb = parseInt(COL[p].edge.substr(5, 2), 16);
      for (y = 0; y < GN; y++) for (x = 0; x < GN; x++) {
        i = y * GN + x; if (own[i] !== v) continue;
        m[i * 4 + 3] = 255;
        var edge = x < 2 || y < 2 || x >= GN - 2 || y >= GN - 2 ? false : (own[i - 1] !== v || own[i + 1] !== v || own[i - GN] !== v || own[i + GN] !== v || own[i - 2] !== v || own[i + 2] !== v || own[i - 2 * GN] !== v || own[i + 2 * GN] !== v);
        if (edge) { e[i * 4] = er; e[i * 4 + 1] = eg; e[i * 4 + 2] = eb; e[i * 4 + 3] = 235; }
      }
      mkctx.putImageData(md, 0, 0); ectx.putImageData(ed, 0, 0);
      var c = layers[p].getContext('2d');
      c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, LS, LS); c.drawImage(hatch[p], 0, 0);
      c.imageSmoothingEnabled = true; c.globalCompositeOperation = 'destination-in'; c.drawImage(mk, 0, 0, LS, LS);
      c.globalCompositeOperation = 'source-over'; c.drawImage(ec, 0, 0, LS, LS);
    }
  }

  // ── 마당 흙바닥 (한 번 그려 무늬로 깐다) ──
  var groundPat = null, border = [];
  (function mkGround() {
    var g = document.createElement('canvas'), S = 420, c, i; g.width = S; g.height = S; c = g.getContext('2d');
    c.fillStyle = '#a07a55'; c.fillRect(0, 0, S, S);
    for (i = 0; i < 2600; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(70,45,25,' + rnd(0.08, 0.25) + ')' : 'rgba(235,205,160,' + rnd(0.06, 0.2) + ')'; c.fillRect(Math.random() * S, Math.random() * S, rnd(1, 3), rnd(1, 3)); }
    for (i = 0; i < 26; i++) {
      var x = Math.random() * S, y = Math.random() * S, r = rnd(2, 6);
      c.fillStyle = 'rgba(40,25,12,.25)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, r, r * 0.7, 0, 0, 7); c.fill();
      c.fillStyle = 'rgb(' + (150 + rnd(-20, 30) | 0) + ',' + (130 + rnd(-20, 20) | 0) + ',' + (110 + rnd(-20, 20) | 0) + ')'; c.beginPath(); c.ellipse(x, y, r, r * 0.7, rnd(0, 3), 0, 7); c.fill();
    }
    groundPat = ctx.createPattern(g, 'repeat');
    // 나뭇가지로 그은 판 테두리 — 두 번 그은 삐뚤한 줄
    for (var k = 0; k < 2; k++) {
      var pts = [], corners = [[0, 0], [LW, 0], [LW, LH], [0, LH], [0, 0]], j, t;
      for (j = 0; j < 4; j++) for (t = 0; t < 1; t += 0.05) pts.push({ x: corners[j][0] + (corners[j + 1][0] - corners[j][0]) * t + rnd(-2.5, 2.5), y: corners[j][1] + (corners[j + 1][1] - corners[j][1]) * t + rnd(-2.5, 2.5) });
      pts.push(pts[0]); border.push(pts);
    }
  })();

  // ── 사금파리 모양 ──
  function mkShard() { var v = [], n = 7, k; for (k = 0; k < n; k++) { var a = k / n * Math.PI * 2 + rnd(-0.25, 0.25); v.push({ a: a, r: SR * rnd(0.78, 1.18) }); } return v; }
  function stoneAt(p) { return { x: HOME_PT[p].x, y: HOME_PT[p].y, rot: rnd(0, 6), shape: mkShard(), alpha: 1 }; }

  // ── 차례 ──
  function humanTurn() { return G.p2 || G.turn === 0; }
  function beginTurn() {
    var st = G.stones[G.turn];
    G.T = { S: { x: st.x, y: st.y }, stops: [], fn: 0, phase: 'aim', why: '' };
    G.aiPlan = null;
    if (!humanTurn()) G.aiTimer = 1.0 + Math.random() * 0.4;
    updHud();
  }
  function flickStone(ang, dist) {
    var st = G.stones[G.turn], dur = 0.35 + 0.55 * dist / DMAX;
    G.mv = { x0: st.x, y0: st.y, ux: Math.cos(ang), uy: Math.sin(ang), dist: dist, dur: dur, t: 0, out: false };
    G.T.phase = 'move'; st.alpha = 1;
    A.flick(dist / DMAX, dur);
  }
  function onStop() {
    var T = G.T, st = G.stones[G.turn], me = G.turn + 1, o = ownerAt(st.x, st.y);
    A.stop();
    if (o === me) {
      if (T.fn === 0) { T.S = { x: st.x, y: st.y }; T.phase = 'aim'; afterFlick(); return; }   // 아직 집 안 — 자리만 옮긴 셈
      grab(); return;
    }
    if (o !== 0) { fail('MISS'); return; }
    T.fn++; T.stops.push({ x: st.x, y: st.y });
    if (T.fn >= FLICKS) { fail('MISS'); return; }
    T.phase = 'aim'; afterFlick();
  }
  function afterFlick() { if (!humanTurn()) G.aiTimer = 1.0 + Math.random() * 0.4; updHud(); }
  function grab() {
    var T = G.T, st = G.stones[G.turn], poly = [T.S].concat(T.stops, [{ x: st.x, y: st.y }]);
    var n = commit(polyPath(poly), G.turn), pct = n / (GN * GN) * 100, cx = 0, cy = 0, i;
    for (i = 0; i < poly.length; i++) { cx += poly[i].x; cy += poly[i].y; }
    T.phase = 'grab'; G.anim = { t: 0, dur: 0.7, poly: poly };
    var label = '+' + (pct < 1 ? pct.toFixed(1) : Math.round(pct)) + '%';
    G.floats.push({ x: cx / poly.length, y: cy / poly.length, txt: label, col: G.turn, t: 0 });
    var tier = pct >= 9 ? 3 : pct >= 5 ? 2 : 1;
    A.grab(tier);
    if (humanTurn() && pct >= 1.5) flash(tier === 3 ? 'PERFECT' : tier === 2 ? 'GREAT' : 'NICE', false);
    updHud();
  }
  function fail(why) {
    var T = G.T, st = G.stones[G.turn];
    T.phase = 'fail'; T.why = why;
    G.anim = { t: 0, dur: 1.0, fx: Math.max(SR, Math.min(LW - SR, st.x)), fy: Math.max(SR, Math.min(LH - SR, st.y)) };
    if (humanTurn()) { flash(why, true); if (why === 'MISS') A.miss(); }
    else { G.floats.push({ x: G.anim.fx, y: G.anim.fy, txt: why, col: -1, t: 0 }); if (!G.p2) A.tease(); }
  }
  function endTurn() {
    G.taken[G.turn]++;
    var sh = shares();
    if (sh[0] > 0.5 || sh[1] > 0.5 || (G.taken[0] >= ROUNDS && G.taken[1] >= ROUNDS) || sh[0] + sh[1] > 0.995) { finish(sh); return; }
    G.turn = 1 - G.turn; A.turn();
    beginTurn();
  }
  var flashT = 0;
  function flash(txt, bad) { var el = $('flash'); el.textContent = txt; el.classList.toggle('bad', !!bad); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 900); }

  // ── 상대: 튕길 곳을 수백 가지 굴려 보고 "먹을 땅 × 돌아올 확률" 이 큰 쪽을 고른다. 스테이지가 오를수록 손이 정확해진다 ──
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) * 2; }
  // 낮은 스테이지: 손이 떨리고(sa·sp), 돌아올 확률을 얕잡아 본다(risk 가 작을수록 무리한 수를 둔다)
  function noise() { var dec = Math.pow(0.84, G.stage - 1); return { sa: Math.max(0.015, 0.21 * dec), sp: Math.max(0.02, 0.25 * dec), spread: 0.7 * dec, risk: Math.min(1, 0.45 + 0.08 * (G.stage - 1)) }; }
  function pip(poly, x, y) {
    var c = false, i, j;
    for (i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var a = poly[i], b = poly[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c;
    }
    return c;
  }
  function estGain(poly) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i, j, n = 0, K = 10;
    for (i = 0; i < poly.length; i++) { x0 = Math.min(x0, poly[i].x); x1 = Math.max(x1, poly[i].x); y0 = Math.min(y0, poly[i].y); y1 = Math.max(y1, poly[i].y); }
    var w = x1 - x0, h = y1 - y0; if (w < 2 || h < 2) return 0;
    for (i = 0; i < K; i++) for (j = 0; j < K; j++) {
      var x = x0 + (i + Math.random()) / K * w, y = y0 + (j + Math.random()) / K * h;
      if (ownerAt(x, y) === 0 && pip(poly, x, y)) n++;
    }
    return n / (K * K) * w * h / (LW * LH);
  }
  function aiPlan() {
    var me = G.turn + 1, nz = noise(), st = G.stones[G.turn], T = G.T, x, y, k;
    function noisyEnd(P, ang, d) { var a = ang + gauss() * nz.sa, dd = Math.min(DMAX, d * (1 + gauss() * nz.sp)); return { x: P.x + Math.cos(a) * dd, y: P.y + Math.sin(a) * dd }; }
    function pLand(P, ang, d) { var c = 0; for (var i = 0; i < 6; i++) { var q = noisyEnd(P, ang, d); if (ownerAt(q.x, q.y) === me) c++; } return c / 6; }
    function pStop(P, ang, d) { var c = 0; for (var i = 0; i < 6; i++) { var q = noisyEnd(P, ang, d); if (ownerAt(q.x, q.y) === 0) c++; } return Math.pow(c / 6, nz.risk); }
    // 돌아올 자리 — 내 땅 안쪽 점들
    var homes = [], fronts = [];
    for (y = 7; y < LH; y += 14) for (x = 7; x < LW; x += 14) {
      if (ownerAt(x, y) !== me) continue;
      if (ownerAt(x - 8, y) === me && ownerAt(x + 8, y) === me && ownerAt(x, y - 8) === me && ownerAt(x, y + 8) === me) homes.push({ x: x, y: y });
      if (ownerAt(x + 35, y) === 0 || ownerAt(x - 35, y) === 0 || ownerAt(x, y + 35) === 0 || ownerAt(x, y - 35) === 0) fronts.push({ x: x, y: y });
    }
    function bestReturn(prefix, P) {
      var cand = [], i, best = null;
      for (i = 0; i < homes.length; i++) { var d = Math.hypot(homes[i].x - P.x, homes[i].y - P.y); if (d > 20 && d < DMAX * 0.98) cand.push(homes[i]); }
      for (i = cand.length - 1; i > 0; i--) { var r = Math.random() * (i + 1) | 0, t = cand[i]; cand[i] = cand[r]; cand[r] = t; }
      cand.length = Math.min(cand.length, 8);
      for (i = 0; i < cand.length; i++) {
        var Tg = cand[i], ang = Math.atan2(Tg.y - P.y, Tg.x - P.x), d2 = Math.hypot(Tg.x - P.x, Tg.y - P.y), p = pLand(P, ang, d2);
        if (p <= 0) continue;
        var ev = estGain(prefix.concat([Tg])) * Math.pow(p, nz.risk) + p * 0.0015;
        if (!best || ev > best.ev) best = { ev: ev, ang: ang, d: d2 };
      }
      return best;
    }
    function randFlick(P) { return { ang: Math.random() * Math.PI * 2, d: rnd(50, DMAX) }; }
    var opts = [], i, j;
    if (T.fn >= 1) {
      var P = { x: st.x, y: st.y }, prefix = [T.S].concat(T.stops), r0 = bestReturn(prefix, P);
      if (r0) opts.push({ ev: r0.ev, ang: r0.ang, d: r0.d });
      if (T.fn < FLICKS - 1) {
        for (i = 0; i < 16; i++) {
          var f = randFlick(P), q = { x: P.x + Math.cos(f.ang) * f.d, y: P.y + Math.sin(f.ang) * f.d };
          if (ownerAt(q.x, q.y) !== 0) continue;
          var ps = pStop(P, f.ang, f.d); if (ps < 0.34) continue;
          var r = bestReturn(prefix.concat([q]), q); if (r) opts.push({ ev: r.ev * ps * 0.95, ang: f.ang, d: f.d });
        }
      }
      if (!opts.length) {   // 돌아갈 길이 없다 — 제일 가까운 내 땅 쪽으로라도
        var nb = null, nd = 1e9;
        for (i = 0; i < fronts.length; i++) { var dd = Math.hypot(fronts[i].x - P.x, fronts[i].y - P.y); if (dd < nd) { nd = dd; nb = fronts[i]; } }
        if (!nb) nb = HOME_PT[G.turn];
        return { ang: Math.atan2(nb.y - P.y, nb.x - P.x), d: Math.min(DMAX, nd + 10) };
      }
    } else {
      var starts = [{ x: st.x, y: st.y }];
      for (i = fronts.length - 1; i > 0; i--) { var rr = Math.random() * (i + 1) | 0, tt = fronts[i]; fronts[i] = fronts[rr]; fronts[rr] = tt; }
      for (i = 0; i < fronts.length && starts.length < 6; i++) if (fronts[i].x > SR && fronts[i].y > SR && fronts[i].x < LW - SR && fronts[i].y < LH - SR) starts.push(fronts[i]);
      for (k = 0; k < starts.length; k++) {
        var S = starts[k];
        for (i = 0; i < 18; i++) {
          var f1 = randFlick(S), q1 = { x: S.x + Math.cos(f1.ang) * f1.d, y: S.y + Math.sin(f1.ang) * f1.d };
          if (ownerAt(q1.x, q1.y) !== 0) continue;
          var p1 = pStop(S, f1.ang, f1.d); if (p1 < 0.34) continue;
          var best = 0, ra = bestReturn([S, q1], q1); if (ra) best = ra.ev;
          for (j = 0; j < 8; j++) {
            var f2 = randFlick(q1), q2 = { x: q1.x + Math.cos(f2.ang) * f2.d, y: q1.y + Math.sin(f2.ang) * f2.d };
            if (ownerAt(q2.x, q2.y) !== 0) continue;
            var p2 = pStop(q1, f2.ang, f2.d); if (p2 < 0.34) continue;
            var rb = bestReturn([S, q1, q2], q2); if (rb && rb.ev * p2 * 0.9 > best) best = rb.ev * p2 * 0.9;
          }
          if (best > 0) opts.push({ ev: best * p1, ang: f1.ang, d: f1.d, S: S });
        }
      }
      if (!opts.length) return { S: starts[0], ang: Math.random() * 6.28, d: 60 };
    }
    var top = 0; for (i = 0; i < opts.length; i++) top = Math.max(top, opts[i].ev);
    var pick = null, ps2 = -1e9;
    for (i = 0; i < opts.length; i++) { var sc = opts[i].ev + gauss() * top * nz.spread * 0.5; if (sc > ps2) { ps2 = sc; pick = opts[i]; } }
    return pick;
  }
  function aiAct() {
    var st = G.stones[G.turn], plan = G.aiPlan; G.aiPlan = null;
    if (!plan) {
      plan = aiPlan();
      if (plan.S && Math.hypot(plan.S.x - st.x, plan.S.y - st.y) > 4) {
        G.aiPlan = plan; G.slide = { x0: st.x, y0: st.y, x1: plan.S.x, y1: plan.S.y, t: 0, dur: 0.45 }; G.T.phase = 'slide'; A.place(); return;
      }
    }
    var nz = noise();
    flickStone(plan.ang + gauss() * nz.sa, Math.max(12, Math.min(DMAX, plan.d * (1 + gauss() * nz.sp))));
  }

  // ── 진행 ──
  function start(stage) {
    G.stage = stage; resetLand(); rebuild();
    G.stones = [stoneAt(0), stoneAt(1)]; G.taken = [0, 0]; G.turn = (G.p2 || stage % 2) ? 0 : 1;
    G.mv = null; G.anim = null; G.slide = null; G.floats = []; G.result = -1;
    G.mode = 'play'; $('title').classList.add('hide'); $('over').classList.remove('show'); document.body.classList.add('playing');
    beginTurn(); A.place();
    if (window.OG) OG.start();
  }
  function finish(sh) { G.mode = 'end'; G.pause = 1.1; G.result = sh[0] > sh[1] + 1e-9 ? 0 : sh[1] > sh[0] + 1e-9 ? 1 : -1; G.final = sh; updHud(); }
  function pctTxt(v) { return Math.round(v * 100) + '%'; }
  function showOver() {
    G.mode = 'over'; document.body.classList.remove('playing'); $('flash').classList.remove('show');
    var w = G.result, h2 = $('oh'), rec = $('orec'), btn = $('btnRetry'), big = $('ores');
    rec.textContent = ''; $('op0').textContent = pctTxt(G.final[0]); $('op1').textContent = pctTxt(G.final[1]);
    if (G.p2) {
      big.textContent = w === 0 ? '1P WIN' : w === 1 ? '2P WIN' : 'DRAW'; big.className = 'res win'; h2.textContent = 'WINNER'; btn.textContent = 'RETRY'; A.win();
    } else if (w === 0) {
      var nb = G.stage + 1, best = loadBest();
      big.textContent = 'CLEAR'; big.className = 'res win'; h2.textContent = 'STAGE ' + G.stage; btn.textContent = 'NEXT'; A.win();
      if (nb > best) { saveBest(nb); if (best > 1) rec.textContent = 'NEW BEST'; }
    } else {
      big.textContent = w === 1 ? 'GAME OVER' : 'DRAW'; big.className = 'res lose'; h2.textContent = 'STAGE ' + G.stage; btn.textContent = 'RETRY'; A.lose();
    }
    $('over').classList.add('show');
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === 0 ? 'clear' : 'lose'), stage: G.stage });
  }

  var last = 0;
  function update(dt) {
    glow += dt;
    var i;
    for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t > 1.4) G.floats.splice(i, 1); }
    if (G.mode === 'end') { G.pause -= dt; if (G.pause <= 0) showOver(); return; }
    if (G.mode !== 'play' || !G.T) return;
    var T = G.T, st = G.stones[G.turn];
    if (T.phase === 'move') {
      var m = G.mv; m.t += dt;
      var u = Math.min(1, m.t / m.dur), s = m.dist * (1 - (1 - u) * (1 - u));
      st.x = m.x0 + m.ux * s; st.y = m.y0 + m.uy * s;
      if (!m.out && !inBoard(st.x, st.y)) { m.out = true; A.out(); }
      if (m.out) st.alpha = Math.max(0, st.alpha - dt * 2.5);
      if (u >= 1) { G.mv = null; if (m.out) fail('OUT'); else onStop(); }
    } else if (T.phase === 'slide') {
      var sl = G.slide; sl.t += dt; var k = Math.min(1, sl.t / sl.dur), e = k * k * (3 - 2 * k);
      st.x = sl.x0 + (sl.x1 - sl.x0) * e; st.y = sl.y0 + (sl.y1 - sl.y0) * e;
      if (k >= 1) { G.slide = null; T.S = { x: st.x, y: st.y }; T.phase = 'aim'; G.aiTimer = 0.55; }
    } else if (T.phase === 'aim') {
      if (!humanTurn()) { G.aiTimer -= dt; if (G.aiTimer <= 0) aiAct(); }
    } else if (T.phase === 'grab') {
      G.anim.t += dt; if (G.anim.t >= G.anim.dur) { G.anim = null; rebuild(); endTurn(); }
    } else if (T.phase === 'fail') {
      var an = G.anim; an.t += dt;
      if (an.t > 0.55) { var q = Math.min(1, (an.t - 0.55) / 0.4), qe = q * q * (3 - 2 * q); st.alpha = Math.min(1, q * 2); st.x = an.fx + (T.S.x - an.fx) * qe; st.y = an.fy + (T.S.y - an.fy) * qe; }
      if (an.t >= an.dur) { G.anim = null; st.x = T.S.x; st.y = T.S.y; st.alpha = 1; endTurn(); }
    }
  }
  function loop(ts) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    update(dt); draw();
  }

  // ── HUD ──
  function updHud() {
    var sh = G.final && G.mode !== 'play' ? G.final : shares();
    $('s0').textContent = pctTxt(sh[0]); $('s1').textContent = pctTxt(sh[1]);
    $('tm0').classList.toggle('on', G.turn === 0); $('tm1').classList.toggle('on', G.turn === 1);
    $('lb0').textContent = G.p2 ? '1P' : 'YOU'; $('lb1').textContent = G.p2 ? '2P' : '';
    $('round').textContent = Math.min(ROUNDS, Math.floor((G.taken[0] + G.taken[1]) / 2) + 1) + '/' + ROUNDS;
    $('stage').textContent = 'STAGE ' + G.stage; $('stage').style.display = G.p2 ? 'none' : '';
  }
  function syncTog() { $('tgSnd').classList.toggle('off', !A.snd); }

  // ── 그리기 ──
  function draw() {
    var W = view.w, H = view.h, i, T = G.T;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    applyView();
    // 마당
    ctx.fillStyle = groundPat; ctx.fillRect(-view.ox / view.s - 10, -view.oy / view.s - 10, W / view.s + 20, H / view.s + 20);
    var vg = ctx.createRadialGradient(LW / 2, LH / 2, LW * 0.3, LW / 2, LH / 2, Math.max(W, H) / view.s);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,15,5,.55)');
    ctx.fillStyle = vg; ctx.fillRect(-view.ox / view.s - 10, -view.oy / view.s - 10, W / view.s + 20, H / view.s + 20);
    // 판 안쪽은 다져진 흙
    ctx.fillStyle = 'rgba(255,235,200,.1)'; ctx.fillRect(0, 0, LW, LH);
    // 땅
    ctx.drawImage(layers[0], 0, 0, LW, LH); ctx.drawImage(layers[1], 0, 0, LW, LH);
    // 판 테두리
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (i = 0; i < border.length; i++) { ctx.strokeStyle = i ? 'rgba(255,240,215,.25)' : 'rgba(55,32,14,.75)'; ctx.lineWidth = i ? 2 : 4; poly(border[i], false); ctx.stroke(); }

    if (G.mode === 'play' || G.mode === 'end') {
      var col = COL[G.turn], st = G.stones[G.turn];
      // 먹는 중 — 선 안을 칠한다
      if (T && T.phase === 'grab' && G.anim) {
        var a = Math.min(1, G.anim.t / 0.35);
        ctx.fillStyle = 'rgba(' + col.tint + ',' + (0.55 * a) + ')'; poly(G.anim.poly, true); ctx.fill();
        ctx.strokeStyle = col.edge; ctx.lineWidth = 4; ctx.stroke();
      }
      // 지나온 길
      if (T && (T.stops.length || T.phase === 'move' || T.phase === 'fail') && T.phase !== 'grab') {
        var pts = [T.S].concat(T.stops), fa = T.phase === 'fail' ? Math.max(0, 1 - G.anim.t / 0.55) : 1;
        if (T.phase !== 'fail') pts.push({ x: st.x, y: st.y });
        ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = T.phase === 'fail' ? '#3a2410' : col.path; ctx.lineWidth = 3.5; ctx.setLineDash([12, 8]);
        poly(pts, false); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = col.path;
        for (i = 0; i < T.stops.length; i++) { cross(T.stops[i].x, T.stops[i].y); }
        ctx.restore();
      }
    }
    // 조준
    if (drag && G.mode === 'play') {
      var d = G.stones[G.turn], v = aimVec();
      if (v.pow > 0) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
        line(drag.x0, drag.y0, drag.x, drag.y);
        var len = 34 + v.pow * 110, ex = d.x + Math.cos(v.ang) * len, ey = d.y + Math.sin(v.ang) * len;
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.setLineDash([9, 8]); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4;
        line(d.x, d.y, ex, ey); ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.moveTo(ex + Math.cos(v.ang) * 14, ey + Math.sin(v.ang) * 14);
        ctx.lineTo(ex + Math.cos(v.ang + 2.5) * 12, ey + Math.sin(v.ang + 2.5) * 12);
        ctx.lineTo(ex + Math.cos(v.ang - 2.5) * 12, ey + Math.sin(v.ang - 2.5) * 12);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
    // 돌 — 쉬는 쪽 먼저
    if (G.stones.length) {
      var cur = G.mode === 'play' || G.mode === 'end' ? G.turn : -1;
      for (i = 0; i < 2; i++) if (i !== cur) drawStone(G.stones[i], i, 0);
      if (cur >= 0) {
        var canAim = G.mode === 'play' && T && T.phase === 'aim' && humanTurn() && !drag;
        drawStone(G.stones[cur], cur, canAim ? 0.35 + 0.3 * Math.sin(glow * 5) : 0);
        // 튕긴 횟수 — 돌 위 점 세 개
        if (G.mode === 'play' && T && T.phase !== 'grab') {
          var sk = stoneK(), sx = G.stones[cur].x, sy = G.stones[cur].y - (SR + 16) * sk, used = Math.min(FLICKS, T.fn + (T.phase === 'fail' ? FLICKS : 0));
          if (sy < 10) sy = G.stones[cur].y + (SR + 18) * sk;
          ctx.save(); ctx.globalAlpha = G.stones[cur].alpha;
          for (i = 0; i < FLICKS; i++) {
            var dx = sx + (i - 1) * 16 * sk;
            ctx.beginPath(); ctx.arc(dx, sy, 5.5 * sk, 0, 7);
            ctx.fillStyle = i < used ? 'rgba(40,22,8,.35)' : '#fff'; ctx.fill();
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(40,22,8,.7)'; ctx.stroke();
          }
          ctx.restore();
        }
      }
    }
    // 떠오르는 글자
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (i = 0; i < G.floats.length; i++) {
      var f = G.floats[i], k = f.t / 1.4;
      ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 2.2);
      ctx.font = '900 ' + (f.col < 0 ? 30 : 46) + 'px Ria, Arial, sans-serif';
      ctx.lineWidth = 7; ctx.strokeStyle = '#2a1808'; ctx.fillStyle = f.col < 0 ? '#e9e1d3' : f.col === 0 ? '#bfe6ff' : '#ffc2a8';
      var fy = f.y - 40 * k; ctx.strokeText(f.txt, f.x, fy); ctx.fillText(f.txt, f.x, fy);
      ctx.restore();
    }
  }
  function poly(p, close) { ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); for (var i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y); if (close) ctx.closePath(); }
  function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  function cross(x, y) { ctx.save(); ctx.setLineDash([]); ctx.lineWidth = 3; ctx.strokeStyle = ctx.fillStyle; line(x - 6, y - 6, x + 6, y + 6); line(x + 6, y - 6, x - 6, y + 6); ctx.restore(); }
  function stoneK() { return Math.max(1, Math.min(1.7, 0.8 / view.s)); }
  function drawStone(s, p, glowA) {
    if (s.alpha <= 0) return;
    var c = COL[p], k, v;
    ctx.save(); ctx.globalAlpha = s.alpha; ctx.translate(s.x, s.y); ctx.scale(stoneK(), stoneK());   // 폰에선 돌을 크게 그린다
    if (glowA > 0) { ctx.strokeStyle = 'rgba(255,255,255,' + glowA + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, SR + 10, 0, 7); ctx.stroke(); }
    ctx.rotate(s.rot);
    function shape(ox, oy) { ctx.beginPath(); for (k = 0; k < s.shape.length; k++) { v = s.shape[k]; var x = Math.cos(v.a) * v.r + ox, y = Math.sin(v.a) * v.r + oy; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.closePath(); }
    ctx.fillStyle = 'rgba(30,15,5,.45)'; shape(2.5, 4); ctx.fill();
    var g = ctx.createLinearGradient(-SR, -SR, SR, SR); g.addColorStop(0, c.hi); g.addColorStop(1, c.lo);
    ctx.fillStyle = g; shape(0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-SR * 0.3, -SR * 0.3, SR * 0.35, SR * 0.16, -0.7, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ── 입력: 아무 데나 누르고 뒤로 당겼다 놓으면 튕긴다. 첫 튕기기 전엔 내 땅을 톡 눌러 돌을 옮긴다 ──
  function maxDrag() { return Math.max(140, Math.min(300, 150 / view.s)); }
  function aimVec() {
    var dx = drag.x0 - drag.x, dy = drag.y0 - drag.y, len = Math.hypot(dx, dy), th = 10 / view.s;
    if (len < th) return { pow: 0, ang: 0 };
    return { pow: Math.min(len - th, maxDrag()) / maxDrag(), ang: Math.atan2(dy, dx) };
  }
  function canInput() { return G.mode === 'play' && G.T && G.T.phase === 'aim' && humanTurn(); }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch' && !isTouch) { isTouch = true; document.body.classList.add('touch'); }
    if (!canInput()) return;
    A.init();
    var p = toLogical(e.clientX, e.clientY), st = G.stones[G.turn];
    drag = { x0: p.x, y0: p.y, x: p.x, y: p.y, near: Math.hypot(p.x - st.x, p.y - st.y) < SR * stoneK() + 12 / view.s };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; var p = toLogical(e.clientX, e.clientY); drag.x = p.x; drag.y = p.y; });
  function release() {
    if (!drag) return;
    var v = aimVec(), dg = drag; drag = null;
    if (!canInput()) return;
    if (v.pow < 0.04) {
      // 톡 — 첫 튕기기 전이면 내 땅 안으로 돌을 옮긴다
      var T = G.T, st = G.stones[G.turn], x = Math.max(SR, Math.min(LW - SR, dg.x0)), y = Math.max(SR, Math.min(LH - SR, dg.y0));
      if (T.fn === 0 && !dg.near && ownerAt(x, y) === G.turn + 1) { st.x = x; st.y = y; T.S = { x: x, y: y }; A.place(); }
      return;
    }
    flickStone(v.ang, Math.max(12, v.pow * DMAX));
  }
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', function () { drag = null; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function toTitle() {
    G.mode = 'title'; G.T = null; resetLand();
    // 타이틀 판 — 몇 판 먹은 모습
    commit(polyPath([{ x: 60, y: 600 }, { x: 250, y: 520 }, { x: 300, y: 690 }]), 0);
    commit(polyPath([{ x: 120, y: 560 }, { x: 170, y: 380 }, { x: 60, y: 520 }]), 0);
    commit(polyPath([{ x: 640, y: 60 }, { x: 470, y: 150 }, { x: 420, y: 30 }]), 1);
    commit(polyPath([{ x: 600, y: 120 }, { x: 560, y: 320 }, { x: 680, y: 170 }]), 1);
    rebuild(); G.stones = [stoneAt(0), stoneAt(1)]; G.stones[0].x = 70; G.stones[0].y = 640; G.stones[1].x = 560; G.stones[1].y = 110;
    $('over').classList.remove('show'); $('title').classList.remove('hide'); showRec(); updHud();
  }
  $('btnStart').addEventListener('click', function () { A.init(); G.p2 = false; start(1); });
  $('btn2p').addEventListener('click', function () { A.init(); G.p2 = true; start(1); });
  $('btnRetry').addEventListener('click', function () { A.init(); if (G.p2) start(1); else start(G.result === 0 ? G.stage + 1 : G.stage); });
  $('btnHome').addEventListener('click', toTitle);
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  addEventListener('keydown', function (e) { if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); } });
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }
  addEventListener('resize', resize);

  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');
  toTitle(); syncTog(); resize();
  requestAnimationFrame(loop);
  // 시험용 손잡이 — 미리보기 창에선 rAF 가 안 도니 프레임을 손으로 돌린다
  window.__tt = { G: G, view: view, own: own, shares: shares, ownerAt: ownerAt, aiPlan: aiPlan, flickStone: flickStone, start: start, noise: noise, A: A,
    toScreen: function (x, y) { return { x: view.ox + x * view.s, y: view.oy + y * view.s }; },
    tick: function (n) { for (var k = 0; k < (n || 1); k++) { last += 16.7; update(0.0167); } draw(); },
    step: function (n) { for (var k = 0; k < (n || 1); k++) update(0.0167); } };
})();
