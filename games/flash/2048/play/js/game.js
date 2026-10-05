// 2048 — 점토 숫자 조각을 커팅 매트 위에서 민다
(function () {
  'use strict';
  var QS = location.search;
  var EN = /[?&]lang=en(&|$)/.test(QS), SHOT = /[?&]shot=1/.test(QS);
  function qp(k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(QS); return m ? decodeURIComponent(m[1]) : null; }
  var LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // 시험 갈고리는 내 컴퓨터에서만
  if (!LOCAL) qp = function () { return null; };
  function $(id) { return document.getElementById(id); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  if (qp('reset')) ['2048.rec', '2048.n', '2048.g3', '2048.g4', '2048.g5', '2048.g6'].forEach(function (k) { ls(k, null); });

  var SIZES = [3, 4, 5, 6], GOAL = { 3: 256, 4: 2048, 5: 4096, 6: 8192 };
  var MOVE = 105, POP = 200;

  // ---------- 기록 ----------
  var REC = {};
  try { REC = JSON.parse(ls('2048.rec') || '{}') || {}; } catch (e) { REC = {}; }
  function rec(n) { if (!REC[n]) REC[n] = { best: 0, max: 0, clr: 0 }; return REC[n]; }
  function saveRec() { ls('2048.rec', JSON.stringify(REC)); }

  // ---------- 판 상태 ----------
  var G = { n: +(ls('2048.n') || 4), cells: [], tiles: [], score: 0, undo: 3, hist: [], over: false, won: false, maxT: 0, id: 1 };
  if (SIZES.indexOf(G.n) < 0) G.n = 4;
  var scene = 'title', animEnd = 0, pending = [], paused = false;

  function newTile(v, r, c, kind) {
    var t = { id: G.id++, v: v, r: r, c: c, fr: r, fc: c, born: now(), kind: kind || 'spawn', vr: (Math.random() * 3) | 0, gone: false };
    G.tiles.push(t); G.cells[r][c] = t; return t;
  }
  function emptyCells() { var out = []; for (var r = 0; r < G.n; r++) for (var c = 0; c < G.n; c++) if (!G.cells[r][c]) out.push([r, c]); return out; }
  function spawn() {
    var e = emptyCells(); if (!e.length) return null;
    var p = e[(Math.random() * e.length) | 0];
    return newTile(Math.random() < 0.9 ? 2 : 4, p[0], p[1], 'spawn');
  }
  function clearBoard() { G.cells = []; for (var r = 0; r < G.n; r++) { G.cells.push([]); for (var c = 0; c < G.n; c++) G.cells[r].push(null); } G.tiles = []; }
  function snapshot() { return { v: G.cells.map(function (row) { return row.map(function (t) { return t ? t.v : 0; }); }), s: G.score }; }
  function restore(sn) {
    clearBoard();
    for (var r = 0; r < G.n; r++) for (var c = 0; c < G.n; c++) if (sn.v[r] && sn.v[r][c]) { var t = newTile(sn.v[r][c], r, c, 'still'); }
    G.score = sn.s; G.maxT = maxTile();
  }
  function maxTile() { var m = 0; G.tiles.forEach(function (t) { if (!t.gone && t.v > m) m = t.v; }); return m; }
  function saveGame() {
    if (G.over || G.won) { ls('2048.g' + G.n, null); return; }
    var sn = snapshot(); sn.u = G.undo; sn.h = G.hist;
    ls('2048.g' + G.n, JSON.stringify(sn));
  }
  function loadGame(n) { try { var o = JSON.parse(ls('2048.g' + n) || 'null'); return o && o.v && o.v.length === n ? o : null; } catch (e) { return null; } }

  function newGame() {
    clearBoard(); G.score = 0; G.undo = 3; G.hist = []; G.over = false; G.won = false;
    spawn(); spawn(); G.maxT = maxTile(); saveGame();
    try { if (window.OG) OG.start(); } catch (e) {}
  }
  function resumeGame(o) {
    restore(o); G.undo = o.u == null ? 3 : o.u; G.hist = o.h || []; G.over = false; G.won = false;
    G.tiles.forEach(function (t) { t.kind = 'spawn'; t.born = now() + Math.random() * 120; });
  }

  // ---------- 밀기 ----------
  var DIRS = { left: [0, -1], right: [0, 1], up: [-1, 0], down: [1, 0] };
  function canMove() {
    if (emptyCells().length) return true;
    for (var r = 0; r < G.n; r++) for (var c = 0; c < G.n; c++) {
      var v = G.cells[r][c].v;
      if (c + 1 < G.n && G.cells[r][c + 1].v === v) return true;
      if (r + 1 < G.n && G.cells[r + 1][c].v === v) return true;
    }
    return false;
  }
  function finishAnim() {
    G.tiles = G.tiles.filter(function (t) { return !t.gone; });
    G.tiles.forEach(function (t) { t.fr = t.r; t.fc = t.c; });
  }
  function move(dir) {
    if (scene !== 'play' || paused || G.over || G.won || sheetOpen()) return false;
    finishAnim();
    var d = DIRS[dir], n = G.n, moved = false, gained = 0, merges = [];
    var before = snapshot();
    var t0 = now();
    G.tiles.forEach(function (t) { t.fr = t.r; t.fc = t.c; if (t.kind !== 'merge' || t0 - t.born > MOVE + POP) t.kind = 'still'; });
    for (var i = 0; i < n; i++) {
      var line = [];
      for (var j = 0; j < n; j++) {
        var k = d[0] + d[1] > 0 ? n - 1 - j : j; // 미는 쪽부터
        var r = d[0] ? k : i, c = d[0] ? i : k;
        if (G.cells[r][c]) line.push(G.cells[r][c]);
        G.cells[r][c] = null;
      }
      var pos = 0, last = null;
      line.forEach(function (t) {
        if (last && last.v === t.v && !last.used) {
          // 둘이 같은 자리로 가서 하나가 된다
          t.r = last.r; t.c = last.c; t.gone = true; last.gone = true; last.used = true;
          var nv = t.v * 2; gained += nv;
          merges.push({ v: nv, r: last.r, c: last.c, a: last, b: t });
          moved = true; last = null; return;
        }
        var k2 = d[0] + d[1] > 0 ? n - 1 - pos : pos;
        var r2 = d[0] ? k2 : i, c2 = d[0] ? i : k2;
        if (t.r !== r2 || t.c !== c2) moved = true;
        t.r = r2; t.c = c2; G.cells[r2][c2] = t; last = t; pos++;
      });
    }
    G.tiles.forEach(function (t) { delete t.used; });
    if (!moved) { bump(dir); return false; }
    G.hist.push(before); if (G.hist.length > 3) G.hist.shift();
    animEnd = t0 + MOVE;
    var top = 0;
    merges.forEach(function (m) {
      var nt = { id: G.id++, v: m.v, r: m.r, c: m.c, fr: m.r, fc: m.c, born: t0 + MOVE, kind: 'merge', vr: (Math.random() * 3) | 0, gone: false };
      G.tiles.push(nt); G.cells[m.r][m.c] = nt;
      if (m.v > top) top = m.v;
      pending.push({ at: t0 + MOVE, fn: (function (mm) { return function () { mergeFx(mm); }; })(m) });
    });
    G.score += gained;
    var st = spawn(); if (st) st.born = t0 + MOVE + 40;
    if (!merges.length) AU.play('slide');
    if (gained) { setScore(true); popScore(gained, merges); }
    var r0 = rec(G.n);
    if (G.score > r0.best) { r0.best = G.score; }
    var mx = maxTile();
    if (mx > r0.max) r0.max = mx;
    if (mx > G.maxT) { G.maxT = mx; }
    saveRec();
    if (mx >= GOAL[G.n]) {
      G.won = true;
      if (!r0.clr) r0.clr = 1; saveRec();
      pending.push({ at: t0 + MOVE + 420, fn: showClear });
    } else if (!canMove()) {
      G.over = true;
      pending.push({ at: t0 + MOVE + 650, fn: showOver });
    }
    saveGame(); setScore(false); syncUndo();
    return true;
  }
  function undo() {
    if (scene !== 'play' || !G.undo || !G.hist.length) { AU.play('bad'); return; }
    finishAnim();
    var sn = G.hist.pop(); G.undo--;
    var oldScore = G.score;
    restore(sn); G.over = false; G.won = false;
    G.tiles.forEach(function (t) { t.kind = 'undo'; t.born = now(); });
    AU.play('tap'); saveGame(); setScore(oldScore !== G.score); syncUndo();
  }

  // ---------- 그림: 점토 색 ----------
  var PAL = { 2: '#efe4cf', 4: '#f6cf68', 8: '#f59842', 16: '#ec6b42', 32: '#dc4444', 64: '#e6578a', 128: '#a462cc', 256: '#5f73da', 512: '#3a9ed6', 1024: '#93c63c', 2048: '#f2bf2c', 4096: '#3a3640', 8192: '#6e2436' };
  function tileColor(v) { return PAL[v] || '#1e4f5a'; }
  function isDark(h) { var p = hex2rgb(h); return (p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11) < 90; }
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(h, to, a) { var p = hex2rgb(h), q = to === 'w' ? [255, 250, 240] : to === 'k' ? [40, 18, 8] : hex2rgb(to); return 'rgb(' + p.map(function (x, i) { return Math.round(x + (q[i] - x) * a); }).join(',') + ')'; }
  function rgba(h, a) { var p = hex2rgb(h); return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // 손으로 빚은 둥근 네모 길(모서리 반지름·변 불룩함이 조금씩 다름)
  function clayPath(g, x, y, w, h, R) {
    var r = [R[0] * w, R[1] * w, R[2] * w, R[3] * w], b = R[4] * w;
    g.beginPath();
    g.moveTo(x + r[0], y);
    g.quadraticCurveTo(x + w / 2, y - b, x + w - r[1], y);
    g.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    g.quadraticCurveTo(x + w + b, y + h / 2, x + w, y + h - r[2]);
    g.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    g.quadraticCurveTo(x + w / 2, y + h + b, x + r[3], y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    g.quadraticCurveTo(x - b, y + h / 2, x, y + r[0]);
    g.quadraticCurveTo(x, y, x + r[0], y);
    g.closePath();
  }
  function digitsFont(txt, s) {
    var k = txt.length, f = k <= 1 ? 0.56 : k === 2 ? 0.48 : k === 3 ? 0.38 : k === 4 ? 0.3 : 0.25;
    return Math.round(s * f);
  }
  // 점토 조각 한 장을 그린다(그림자 포함). s = 조각 한 변(px)
  function drawClay(g, cx, cy, s, base, txt, seed, opt) {
    opt = opt || {};
    var R = rng(seed * 7919 + 13);
    var rad = [0.2 + R() * 0.06, 0.2 + R() * 0.06, 0.2 + R() * 0.06, 0.2 + R() * 0.06, 0.012 + R() * 0.018];
    var x = cx - s / 2, y = cy - s / 2, th = s * 0.06;
    var dark = isDark(base);
    // 매트에 닿는 그림자
    g.save();
    g.shadowColor = 'rgba(10,30,22,.55)'; g.shadowBlur = s * 0.1; g.shadowOffsetY = s * 0.06;
    clayPath(g, x + s * 0.02, y + th, s * 0.96, s * 0.96, rad); g.fillStyle = 'rgba(20,40,30,.6)'; g.fill();
    g.restore();
    // 옆면(두께)
    clayPath(g, x, y + th, s, s, rad); g.fillStyle = mix(base, 'k', dark ? 0.4 : 0.32); g.fill();
    clayPath(g, x, y + th * 0.5, s, s, rad); g.fillStyle = mix(base, 'k', dark ? 0.25 : 0.16); g.fill();
    // 윗면
    clayPath(g, x, y, s, s, rad);
    g.save(); g.clip();
    g.fillStyle = base; g.fillRect(x - 4, y - 4, s + 8, s + 8);
    var lg = g.createRadialGradient(x + s * 0.28, y + s * 0.2, s * 0.05, x + s * 0.4, y + s * 0.4, s * 0.95);
    lg.addColorStop(0, 'rgba(255,250,235,' + (dark ? 0.22 : 0.42) + ')'); lg.addColorStop(0.45, 'rgba(255,250,235,0)'); lg.addColorStop(1, 'rgba(40,15,0,' + (dark ? 0.3 : 0.2) + ')');
    g.fillStyle = lg; g.fillRect(x - 4, y - 4, s + 8, s + 8);
    // 가장자리 안쪽 그늘(아래·오른쪽)과 빛(위·왼쪽)
    g.lineWidth = s * 0.09;
    g.shadowColor = 'rgba(60,20,0,' + (dark ? 0.6 : 0.4) + ')'; g.shadowBlur = s * 0.07; g.shadowOffsetX = -s * 0.03; g.shadowOffsetY = -s * 0.04;
    clayPath(g, x - s * 0.045, y - s * 0.045, s * 1.09, s * 1.09, rad); g.strokeStyle = 'rgba(0,0,0,1)'; g.stroke();
    g.shadowColor = 'rgba(255,250,235,' + (dark ? 0.25 : 0.55) + ')'; g.shadowOffsetX = s * 0.025; g.shadowOffsetY = s * 0.03;
    g.stroke();
    g.shadowColor = 'transparent';
    // 넓고 흐린 반짝임
    var sp = g.createRadialGradient(x + s * 0.3, y + s * 0.22, 0, x + s * 0.3, y + s * 0.22, s * 0.3);
    sp.addColorStop(0, 'rgba(255,255,255,' + (dark ? 0.16 : 0.32) + ')'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp; g.beginPath(); g.ellipse(x + s * 0.3, y + s * 0.22, s * 0.3, s * 0.16, -0.5, 0, 6.3); g.fill();
    // 잔 점(점토 알갱이)
    var nd = Math.round(s * s / 90);
    for (var i = 0; i < nd; i++) {
      var px = x + R() * s, py = y + R() * s, pr = s * (0.004 + R() * 0.008);
      g.fillStyle = R() < 0.55 ? 'rgba(70,30,5,' + (0.06 + R() * 0.08) + ')' : 'rgba(255,250,235,' + (0.08 + R() * 0.12) + ')';
      g.beginPath(); g.arc(px, py, pr, 0, 6.3); g.fill();
    }
    // 지문 결
    if (!opt.noPrint) {
      var fx = x + s * (0.25 + R() * 0.5), fy = y + s * (0.25 + R() * 0.5), fa = R() * 3;
      g.lineWidth = Math.max(0.6, s * 0.007); g.strokeStyle = 'rgba(70,30,5,' + (dark ? 0.12 : 0.07) + ')';
      for (var k = 1; k <= 7; k++) {
        g.beginPath(); g.ellipse(fx, fy, s * 0.028 * k, s * 0.02 * k, fa, 0.3 + R() * 0.5, 2.6 + R() * 2.4); g.stroke();
      }
    }
    // 금 점토 반짝이
    if (opt.glitter) {
      for (var j = 0; j < 26; j++) {
        var gx = x + R() * s, gy = y + R() * s, gr = s * (0.006 + R() * 0.01);
        g.fillStyle = R() < 0.5 ? 'rgba(255,255,230,.85)' : 'rgba(255,220,120,.9)';
        g.beginPath(); g.moveTo(gx, gy - gr * 2); g.lineTo(gx + gr * 0.5, gy); g.lineTo(gx, gy + gr * 2); g.lineTo(gx - gr * 0.5, gy); g.closePath(); g.fill();
        g.fillRect(gx - gr * 1.6, gy - gr * 0.25, gr * 3.2, gr * 0.5);
      }
    }
    g.restore();
    // 도장으로 눌러 판 숫자
    if (txt) {
      var fs = opt.fs || digitsFont(txt, s);
      g.font = fs + 'px Miso, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var ty = cy + fs * 0.06, d = Math.max(1, s * 0.016);
      if (dark) {
        g.fillStyle = 'rgba(0,0,0,.5)'; g.fillText(txt, cx, ty + d);
        g.fillStyle = '#f7ead0'; g.fillText(txt, cx, ty);
      } else {
        g.fillStyle = 'rgba(255,250,235,.7)'; g.fillText(txt, cx, ty + d);
        g.fillStyle = mix(base, 'k', 0.72); g.fillText(txt, cx, ty - d * 0.55);
        g.fillStyle = mix(base, 'k', 0.52); g.fillText(txt, cx, ty);
      }
    }
  }
  var SPR = {};
  function sprite(v, s, vr, txt, color) {
    var key = v + '_' + vr + '_' + Math.round(s) + (txt || '');
    var c = SPR[key]; if (c) return c;
    var pad = Math.ceil(s * 0.2);
    c = document.createElement('canvas'); c.width = Math.ceil(s + pad * 2); c.height = Math.ceil(s + pad * 2);
    c.pad = pad;
    drawClay(c.getContext('2d'), c.width / 2, c.height / 2 - s * 0.03, s, color || tileColor(v), txt != null ? txt : String(v), v * 31 + vr, { glitter: v === 2048 });
    SPR[key] = c; return c;
  }

  // ---------- 화면 ----------
  var cv = $('c'), ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, L = {}, BG = null, MAT = null;
  function now() { return performance.now(); }
  function landscape() { return W > H * 1.08; }
  function layout() {
    W = innerWidth; H = innerHeight;
    DPR = Math.min(qp('dpr') ? +qp('dpr') : (window.devicePixelRatio || 1), 3);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    var top = window.__TOP || 52, land = landscape(), low = H <= 480; // __TOP: 쇼츠 촬영 때 위 자막 자리
    var b = {}, t = {}, tools = {};
    L.panel = null;
    function vfit(areaTop, areaH) { return areaTop + (areaH - b.s * 1.12) / 2 + b.s * 0.06; }
    if (SHOT) { // 표지: 가운데 매트 + 가운데 큰 제목 조각(모바일 가운데 정사각형 자르기·카드 딱지·위 25% 피함)
      b.s = H * 0.86 / 1.12;
      b.x = W / 2 - b.s / 2; b.y = vfit(0, H);
      t.ts = Math.min(H * 0.21, W * 0.11);
      t.cx = W / 2; t.cy = b.y + b.s / 2;
      var half = (t.ts * 4 + t.ts * 0.1 * 3) / 2 + t.ts * 0.12;
      document.body.setAttribute('data-box', [Math.round(t.cx - half), Math.round(t.cy - t.ts * 0.68), Math.round(t.cx + half), Math.round(t.cy + t.ts * 0.72), W, H].join(','));
    } else if (scene === 'title') {
      if (land) {
        var at = low ? 8 : 30;
        b.s = Math.min((H - at - 10) / 1.12, W * 0.44);
        var bcx = Math.max(W * 0.31, b.s * 0.56 + 110);
        b.x = bcx - b.s / 2; b.y = vfit(at, H - at - 6);
        var colX = bcx + b.s * 0.56, colW = W - colX;
        t.ts = Math.min(colW * 0.19, H * (low ? 0.2 : 0.15), 120);
        t.cx = colX + colW / 2; t.cy = H - t.ts * 0.62 - (low ? 10 : 50);
        L.panel = { cx: t.cx, top: low ? top + 8 : H * 0.3, w: colW };
      } else {
        t.ts = Math.min(W * 0.19, H * 0.1, 110);
        var panelH = 176, logoH = t.ts * 1.3 + Math.max(18, H * 0.04);
        b.s = Math.min((W - 22) / 1.12, (H - top - 10 - panelH - logoH) / 1.12, 540);
        b.x = (W - b.s) / 2; b.y = top + 8 + b.s * 0.06 + (H > 820 ? (H - 820) * 0.25 : 0);
        t.cx = W / 2; t.cy = H - t.ts * 0.62 - Math.max(18, H * 0.04);
        L.panel = { cx: W / 2, top: b.y + b.s * 1.06 + 14, w: W };
      }
    } else {
      if (land) {
        b.s = Math.min((H - top - 12) / 1.12, W * 0.6);
        b.x = (W - b.s) / 2 - Math.min(80, W * 0.06); b.y = vfit(top, H - top - 6);
        tools.col = true; tools.x = b.x + b.s * 1.06 + 16; tools.y = b.y + b.s * 0.5;
        if (W - tools.x < 150) { tools.x = b.x - b.s * 0.06 - 16; tools.left = true; }
      } else {
        var room = H - top - 92;
        b.s = Math.min((W - 18) / 1.12, (room - 12) / 1.12, 620);
        b.x = (W - b.s) / 2; b.y = vfit(top, room);
        tools.col = false; tools.x = W / 2; tools.y = b.y + b.s * 1.06 + 16;
      }
    }
    L.b = b; L.t = t; L.tools = tools;
    L.pad = b.s * 0.035;
    L.cell = (b.s - L.pad * 2) / G.n;
    L.tile = L.cell * 0.88;
    BG = null; MAT = null; SPR = {};
    placeDom();
  }
  function placeDom() {
    var tl = $('tools'), tt = L.tools;
    tl.classList.toggle('col', !!tt.col);
    if (tt.col) { tl.style.left = (tt.left ? tt.x - 130 : tt.x) + 'px'; tl.style.top = (tt.y - 60) + 'px'; tl.style.width = '130px'; }
    else { tl.style.left = '0px'; tl.style.width = W + 'px'; tl.style.top = tt.y + 'px'; }
    var p = L.panel, ti = $('title');
    if (p) { ti.style.left = (p.cx - p.w / 2) + 'px'; ti.style.width = p.w + 'px'; ti.style.top = p.top + 'px'; }
  }

  // 원목 탁자(한 번 그려 둔다)
  function drawTable() {
    var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    var g = c.getContext('2d'), w = c.width, h = c.height, R = rng(77);
    g.fillStyle = '#c49660'; g.fillRect(0, 0, w, h);
    var ph = Math.max(110, Math.min(W, H) * 0.22) * DPR, y = -R() * ph;
    var tones = ['#c89a63', '#bf8f58', '#cfa26c', '#c39359', '#cb9d66'];
    for (var i = 0; y < h; i++, y += ph) {
      g.fillStyle = tones[i % tones.length]; g.fillRect(0, y, w, ph);
      for (var k = 0; k < 26; k++) {
        var gy = y + R() * ph, amp = (2 + R() * 7) * DPR, fr = 0.002 + R() * 0.004, ph0 = R() * 6;
        g.strokeStyle = R() < 0.6 ? 'rgba(110,62,20,' + (0.06 + R() * 0.1) + ')' : 'rgba(255,230,190,' + (0.05 + R() * 0.08) + ')';
        g.lineWidth = (0.6 + R() * 1.6) * DPR;
        g.beginPath();
        for (var x = 0; x <= w; x += 14 * DPR) { var yy = gy + Math.sin(x * fr / DPR + ph0) * amp + Math.sin(x * fr * 3.1 / DPR) * amp * 0.3; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
        g.stroke();
      }
      if (R() < 0.6) {
        var kx = R() * w, ky = y + ph * (0.3 + R() * 0.4);
        for (var q = 6; q > 0; q--) { g.strokeStyle = 'rgba(100,55,18,' + (0.08 + q * 0.02) + ')'; g.lineWidth = 1.2 * DPR; g.beginPath(); g.ellipse(kx, ky, q * 6 * DPR, q * 2.6 * DPR, 0, 0, 6.3); g.stroke(); }
      }
      g.fillStyle = 'rgba(70,38,12,.55)'; g.fillRect(0, y, w, 2.2 * DPR);
      g.fillStyle = 'rgba(255,235,200,.22)'; g.fillRect(0, y + 2.2 * DPR, w, 1.2 * DPR);
    }
    var lg = g.createRadialGradient(w * 0.2, h * 0.05, 0, w * 0.35, h * 0.3, Math.max(w, h) * 0.9);
    lg.addColorStop(0, 'rgba(255,240,205,.32)'); lg.addColorStop(0.5, 'rgba(255,240,205,0)'); lg.addColorStop(1, 'rgba(50,25,5,.32)');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    return c;
  }
  // 초록 커팅 매트(칸·자 눈금·45도 선)
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function drawMat() {
    var b = L.b, d = DPR, n = G.n, mp = b.s * 0.06, mw = b.s + mp * 2, ox = 20, oy = 16, R = rng(5);
    var c = document.createElement('canvas'); c.width = Math.ceil((mw + 40) * d); c.height = Math.ceil((mw + 50) * d);
    var g = c.getContext('2d'); g.scale(d, d);
    c.ox = ox + mp; c.oy = oy + mp;
    g.save(); g.shadowColor = 'rgba(40,20,5,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 9;
    rr(g, ox, oy + 4, mw, mw, 16); g.fillStyle = '#1d4a3a'; g.fill(); g.restore();
    rr(g, ox, oy + 4, mw, mw, 16); g.fillStyle = '#1b4536'; g.fill();
    rr(g, ox, oy, mw, mw, 16); g.fillStyle = '#2f6e56'; g.fill();
    g.save(); rr(g, ox, oy, mw, mw, 16); g.clip();
    var lg = g.createLinearGradient(ox, oy, ox + mw, oy + mw);
    lg.addColorStop(0, 'rgba(255,255,230,.14)'); lg.addColorStop(1, 'rgba(0,20,10,.18)');
    g.fillStyle = lg; g.fillRect(ox, oy, mw, mw);
    for (var i = 0; i < 260; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,25,15,.08)' : 'rgba(220,255,230,.05)'; g.beginPath(); g.arc(ox + R() * mw, oy + R() * mw, 0.5 + R() * 1.4, 0, 6.3); g.fill(); }
    var step = b.s / (n * 4);
    g.strokeStyle = 'rgba(210,255,225,.10)'; g.lineWidth = 0.7;
    for (var x = ox + mp; x <= ox + mp + b.s + 0.5; x += step) { g.beginPath(); g.moveTo(x, oy + mp * 0.55); g.lineTo(x, oy + mw - mp * 0.55); g.stroke(); }
    for (var y = oy + mp; y <= oy + mp + b.s + 0.5; y += step) { g.beginPath(); g.moveTo(ox + mp * 0.55, y); g.lineTo(ox + mw - mp * 0.55, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,240,170,.13)'; g.setLineDash([6, 5]);
    g.beginPath(); g.moveTo(ox + mp, oy + mp); g.lineTo(ox + mp + b.s, oy + mp + b.s); g.stroke();
    g.beginPath(); g.moveTo(ox + mp + b.s, oy + mp); g.lineTo(ox + mp, oy + mp + b.s); g.stroke();
    g.setLineDash([]);
    g.strokeStyle = 'rgba(240,250,235,.55)'; g.fillStyle = 'rgba(240,250,235,.6)';
    g.font = Math.max(7, mp * 0.32) + 'px Miso, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var cnt = n * 4;
    for (var k = 0; k <= cnt; k++) {
      var tx = ox + mp + k * step, len = k % 4 === 0 ? mp * 0.42 : k % 2 === 0 ? mp * 0.28 : mp * 0.18;
      g.lineWidth = k % 4 === 0 ? 1.3 : 0.8;
      g.beginPath(); g.moveTo(tx, oy + mp * 0.08); g.lineTo(tx, oy + mp * 0.08 + len); g.stroke();
      g.beginPath(); g.moveTo(ox + mp * 0.08, oy + mp + k * step); g.lineTo(ox + mp * 0.08 + len, oy + mp + k * step); g.stroke();
      if (k % 4 === 0 && k > 0 && k < cnt) g.fillText(String(k), tx, oy + mp * 0.74);
    }
    g.restore();
    for (var r = 0; r < n; r++) for (var cc = 0; cc < n; cc++) {
      var cx = ox + mp + L.pad + cc * L.cell + (L.cell - L.tile) / 2, cy = oy + mp + L.pad + r * L.cell + (L.cell - L.tile) / 2, tr = L.tile * 0.2;
      rr(g, cx, cy, L.tile, L.tile, tr); g.fillStyle = 'rgba(8,35,24,.26)'; g.fill();
      g.save(); rr(g, cx, cy, L.tile, L.tile, tr); g.clip();
      g.lineWidth = 4; g.shadowColor = 'rgba(0,20,10,.5)'; g.shadowBlur = 5; g.shadowOffsetY = 2;
      rr(g, cx - 2, cy - 2, L.tile + 4, L.tile + 4, tr); g.strokeStyle = '#000'; g.stroke(); g.restore();
      g.strokeStyle = 'rgba(220,255,230,.12)'; g.lineWidth = 1; rr(g, cx + 0.5, cy + 1, L.tile - 1, L.tile - 1, tr); g.stroke();
    }
    return c;
  }

  // ---------- 효과 ----------
  var crumbs = [], floats = [], shakeT = 0, shakeA = 0, nudge = { x: 0, y: 0, t: 0 };
  function cellXY(r, c) { return [L.b.x + L.pad + c * L.cell + L.cell / 2, L.b.y + L.pad + r * L.cell + L.cell / 2]; }
  function mergeFx(m) {
    var p = cellXY(m.r, m.c), lv = Math.log2(m.v), col = tileColor(m.v), nn = 6 + Math.min(10, lv);
    for (var i = 0; i < nn; i++) {
      var a = Math.random() * 6.283, sp = L.tile * (1.2 + Math.random() * 2.2) * (lv >= 7 ? 1.4 : 1);
      crumbs.push({ x: p[0] + Math.cos(a) * L.tile * 0.3, y: p[1] + Math.sin(a) * L.tile * 0.3, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - L.tile * 1.2, r: L.tile * (0.035 + Math.random() * 0.05), c: col, t: 0, life: 0.45 + Math.random() * 0.3 });
    }
    AU.play('merge', lv);
    if (lv >= 7) { shakeT = 0.22; shakeA = Math.min(7, 2 + (lv - 7) * 1.2); }
  }
  function popScore(n, merges) {
    var m = merges[merges.length - 1], p = cellXY(m.r, m.c);
    floats.push({ x: p[0], y: p[1] - L.tile * 0.3, txt: '+' + n, t: 0, delay: MOVE / 1000 });
  }
  function bump(dir) { var d = DIRS[dir]; nudge = { x: d[1] * 5, y: d[0] * 5, t: 0.16 }; AU.play('bad'); }
  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
  function easeBack(k) { var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }

  var DEMO = {
    3: [[2, 4, 0], [8, 16, 2], [0, 32, 64]],
    4: [[2, 4, 8, 0], [0, 16, 32, 2], [4, 0, 64, 128], [0, 256, 512, 2048]],
    5: [[2, 0, 4, 8, 0], [0, 16, 0, 2, 4], [32, 64, 128, 0, 0], [0, 2, 256, 512, 4], [1024, 0, 2048, 0, 4096]],
    6: [[2, 0, 4, 0, 8, 0], [0, 16, 0, 2, 0, 4], [32, 0, 64, 128, 0, 0], [0, 2, 0, 256, 512, 0], [4, 1024, 0, 2, 0, 2048], [0, 0, 8, 4096, 8192, 2]]
  };
  function titleBoard() {
    var o = SHOT ? null : loadGame(G.n);
    clearBoard();
    var v = o ? o.v : SHOT ? [[2, 4, 0, 8], [0, 0, 0, 0], [0, 0, 0, 0], [256, 0, 512, 2048]] : DEMO[G.n];
    for (var r = 0; r < G.n; r++) for (var c = 0; c < G.n; c++) if (v[r][c]) newTile(v[r][c], r, c, 'spawn').born = now() + (r + c) * 35;
  }

  // ---------- 그리기 ----------
  var lastT = 0;
  function draw(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
    if (!BG) BG = drawTable();
    if (!MAT) MAT = drawMat();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(BG, 0, 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var sx = 0, sy = 0;
    if (shakeT > 0) { shakeT -= dt; sx = (Math.random() - 0.5) * 2 * shakeA * (shakeT / 0.22); sy = (Math.random() - 0.5) * 2 * shakeA * (shakeT / 0.22); }
    if (nudge.t > 0) { nudge.t -= dt; var nk = Math.max(0, nudge.t / 0.16); sx += nudge.x * Math.sin(nk * Math.PI); sy += nudge.y * Math.sin(nk * Math.PI); }
    ctx.save(); ctx.translate(sx, sy);
    ctx.drawImage(MAT, L.b.x - MAT.ox, L.b.y - MAT.oy, MAT.width / DPR, MAT.height / DPR);
    // 조각: 움직이는 것 → 가만히 있는 것 → 새로 생긴 것 순으로(합쳐진 것이 위에)
    var list = G.tiles.slice().sort(function (a, b) { return (a.kind === 'merge') - (b.kind === 'merge'); });
    var moving = t < animEnd, k0 = 1 - (animEnd - t) / MOVE;
    for (var i = 0; i < list.length; i++) {
      var tt = list[i];
      if (tt.gone && !moving) continue;
      var r = tt.r, c = tt.c, ax = 1, ay = 1;
      if (moving && (tt.fr !== tt.r || tt.fc !== tt.c)) {
        var e = easeOut(Math.max(0, k0));
        r = tt.fr + (tt.r - tt.fr) * e; c = tt.fc + (tt.c - tt.fc) * e;
        var st = Math.sin(Math.max(0, k0) * Math.PI) * 0.1;
        if (tt.fr !== tt.r) { ay = 1 + st; ax = 1 - st * 0.6; } else { ax = 1 + st; ay = 1 - st * 0.6; }
      }
      var age = t - tt.born;
      if (tt.kind === 'spawn' || tt.kind === 'merge' || tt.kind === 'undo') {
        if (age < 0) continue;
        if (tt.kind === 'spawn' && age < 170) { var sc = easeBack(age / 170); ax *= sc; ay *= sc; }
        if (tt.kind === 'merge' && age < POP) { var q = age / POP, p1 = Math.sin(q * Math.PI); ax *= (1 + 0.15 * p1) * (1 + 0.1 * Math.sin(q * Math.PI * 2)); ay *= (1 + 0.15 * p1) * (1 - 0.12 * Math.sin(q * Math.PI * 2)); }
        if (tt.kind === 'undo' && age < 140) { var u = 0.85 + 0.15 * easeOut(age / 140); ax *= u; ay *= u; }
      }
      var x = L.b.x + L.pad + c * L.cell + L.cell / 2, y = L.b.y + L.pad + r * L.cell + L.cell / 2;
      var spr = sprite(tt.v, L.tile * DPR, tt.vr);
      var w = spr.width / DPR, h = spr.height / DPR;
      ctx.save(); ctx.translate(x, y + L.tile * 0.5); ctx.scale(ax, ay); // 아래(매트에 닿는 곳)를 기준으로 눌린다
      ctx.drawImage(spr, -w / 2, -h / 2 - L.tile * 0.5 + L.tile * 0.03, w, h);
      ctx.restore();
    }
    // 부스러기
    for (var j = crumbs.length - 1; j >= 0; j--) {
      var cb = crumbs[j]; cb.t += dt;
      if (cb.t > cb.life) { crumbs.splice(j, 1); continue; }
      cb.vy += L.tile * 9 * dt; cb.x += cb.vx * dt; cb.y += cb.vy * dt; cb.vx *= 0.96;
      var al = 1 - cb.t / cb.life;
      ctx.globalAlpha = Math.min(1, al * 1.6);
      ctx.fillStyle = mix(cb.c, 'k', 0.2); ctx.beginPath(); ctx.arc(cb.x, cb.y + cb.r * 0.3, cb.r, 0, 6.3); ctx.fill();
      ctx.fillStyle = cb.c; ctx.beginPath(); ctx.arc(cb.x, cb.y, cb.r, 0, 6.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,235,.5)'; ctx.beginPath(); ctx.arc(cb.x - cb.r * 0.3, cb.y - cb.r * 0.35, cb.r * 0.35, 0, 6.3); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 점수 떠오름
    for (var f = floats.length - 1; f >= 0; f--) {
      var fl = floats[f]; fl.t += dt;
      var ft = fl.t - fl.delay; if (ft < 0) continue;
      if (ft > 0.8) { floats.splice(f, 1); continue; }
      var fs = Math.max(16, L.tile * 0.32);
      ctx.globalAlpha = ft < 0.6 ? 1 : 1 - (ft - 0.6) / 0.2;
      ctx.font = fs + 'px Miso, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = fs * 0.22; ctx.strokeStyle = '#fff7e6'; ctx.lineJoin = 'round';
      var fy = fl.y - easeOut(Math.min(1, ft / 0.8)) * L.tile * 0.7;
      ctx.strokeText(fl.txt, fl.x, fy); ctx.fillStyle = '#7a3a0e'; ctx.fillText(fl.txt, fl.x, fy);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (scene === 'title' || SHOT) drawLogo(t);
  }
  var LOGO = [['2', '#e04848', -6], ['0', '#f6cf68', 4], ['4', '#3a9ed6', -3], ['8', '#93c63c', 6]];
  function drawLogo(t) {
    var ts = L.t.ts, gap = ts * 0.1, x0 = L.t.cx - (ts * 4 + gap * 3) / 2 + ts / 2;
    for (var i = 0; i < 4; i++) {
      var sp = sprite(0, ts * DPR, i, LOGO[i][0], LOGO[i][1]);
      var x = x0 + i * (ts + gap), y = L.t.cy + Math.sin(t / 700 + i * 1.3) * ts * 0.035;
      ctx.save(); ctx.translate(x, y); ctx.rotate(LOGO[i][2] * Math.PI / 180);
      ctx.drawImage(sp, -sp.width / DPR / 2, -sp.height / DPR / 2, sp.width / DPR, sp.height / DPR);
      ctx.restore();
    }
  }

  // ---------- 화면 글자·창 ----------
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function setScore(bumpIt) {
    $('vScore').textContent = fmt(G.score); $('vBest').textContent = fmt(Math.max(rec(G.n).best, G.score));
    if (bumpIt) { var s = $('sScore'); s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); }
  }
  function syncUndo() {
    var n = G.undo, ok = n > 0 && G.hist.length > 0;
    $('undoN').textContent = n; $('oUndoN').textContent = n;
    $('btnUndo').classList.toggle('dis', !ok);
    $('btnOUndo').style.display = ok ? '' : 'none';
  }
  var SHEETS = ['wOver', 'wClear', 'wEnd', 'wPause', 'wConfirm'];
  function sheetOpen() { return SHEETS.some(function (id) { return $(id).classList.contains('show'); }); }
  function show(id) { SHEETS.forEach(function (s) { $(s).classList.toggle('show', s === id); }); document.body.classList.toggle('sheeton', !!id); }
  function tileCanvas(cvs, v) {
    var g = cvs.getContext('2d'); g.clearRect(0, 0, cvs.width, cvs.height);
    drawClay(g, cvs.width / 2, cvs.height / 2 - cvs.width * 0.04, cvs.width * 0.72, tileColor(v), String(v), v * 31, { glitter: v === 2048 });
  }
  function showOver() {
    var r0 = rec(G.n);
    $('oScore').textContent = fmt(G.score); $('oBest').textContent = 'BEST ' + fmt(r0.best);
    syncUndo(); show('wOver'); AU.play('over');
    try { if (window.OG) OG.over({ result: 'GAME OVER', score: G.score }); } catch (e) {}
  }
  function allClear() { return SIZES.every(function (n) { return rec(n).clr; }); }
  function showClear() {
    var r0 = rec(G.n);
    tileCanvas($('cTile'), GOAL[G.n]);
    $('cScore').textContent = fmt(G.score); $('cBest').textContent = 'BEST ' + fmt(r0.best);
    show('wClear'); AU.play('clear');
    var p = cellXY((G.n - 1) / 2, (G.n - 1) / 2);
    for (var i = 0; i < 40; i++) { var a = Math.random() * 6.283, sp = L.tile * (2 + Math.random() * 4); crumbs.push({ x: p[0], y: p[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - L.tile * 2, r: L.tile * (0.04 + Math.random() * 0.06), c: tileColor(Math.pow(2, 1 + (Math.random() * 11 | 0))), t: 0, life: 0.9 + Math.random() * 0.5 }); }
    try { if (window.OG) OG.over({ result: 'CLEAR', score: G.score }); } catch (e) {}
  }
  function showEnd() {
    var row = $('endRow'); row.innerHTML = '';
    SIZES.forEach(function (n) {
      var w = document.createElement('div'); w.className = 'et';
      var c = document.createElement('canvas'); c.width = c.height = 140; w.appendChild(c); tileCanvas(c, GOAL[n]);
      var s1 = document.createElement('div'); s1.className = 'es'; s1.textContent = n + ' x ' + n; w.appendChild(s1);
      var s2 = document.createElement('div'); s2.className = 'eb'; s2.textContent = fmt(rec(n).best); w.appendChild(s2);
      row.appendChild(w);
    });
    $('eScore').textContent = '';
    show('wEnd'); AU.play('clear');
  }

  // ---------- 장면 ----------
  function setScene(s) {
    scene = s;
    document.body.classList.toggle('ontitle', s === 'title');
    document.body.classList.toggle('playing', s === 'play');
    $('sScore').classList.toggle('hide', s !== 'play'); $('sBest').classList.toggle('hide', s !== 'play');
    $('tgPause').classList.toggle('hide', s !== 'play');
    layout();
  }
  function refreshTitle() {
    var r0 = rec(G.n);
    $('szT').textContent = G.n + ' x ' + G.n;
    $('szG').textContent = r0.clr ? 'CLEAR' : 'GOAL ' + GOAL[G.n];
    $('szLab').classList.toggle('clr', !!r0.clr);
    $('best').textContent = r0.best ? 'BEST ' + fmt(r0.best) : '';
    $('btnStart').textContent = loadGame(G.n) ? (EN ? 'CONTINUE' : '이어하기') : (EN ? 'START' : '시작');
    layout(); titleBoard();
  }
  function goTitle() { show(null); paused = false; AU.pause(false); setScene('title'); refreshTitle(); }
  function startPlay() {
    AU.init();
    ls('2048.n', String(G.n));
    setScene('play');
    var o = loadGame(G.n);
    if (o) resumeGame(o); else newGame();
    setScore(false); syncUndo();
  }
  function pickSize(d) {
    var i = SIZES.indexOf(G.n); i = (i + d + SIZES.length) % SIZES.length; G.n = SIZES[i];
    AU.init(); AU.play('tap'); refreshTitle();
  }
  function pause(v) {
    if (scene !== 'play') return;
    paused = v; AU.pause(v); show(v ? 'wPause' : null);
  }

  // ---------- 입력 ----------
  function tap(id, fn, silent) {
    var el = $(id);
    el.addEventListener('click', function (e) { e.stopPropagation(); AU.init(); if (!silent) AU.play('tap'); fn(e); });
  }
  tap('btnStart', startPlay);
  tap('szDn', function () { pickSize(-1); }, 1); tap('szUp', function () { pickSize(1); }, 1); tap('szLab', function () { pickSize(1); }, 1);
  tap('btnUndo', undo, 1);
  tap('btnOUndo', function () { show(null); undo(); }, 1);
  tap('btnNew', function () { show('wConfirm'); });
  tap('btnPNew', function () { show('wConfirm'); });
  tap('btnNo', function () { show(paused ? 'wPause' : null); });
  tap('btnYes', function () { show(null); paused = false; AU.pause(false); ls('2048.g' + G.n, null); newGame(); setScore(false); syncUndo(); });
  tap('btnRetry', function () { show(null); ls('2048.g' + G.n, null); newGame(); setScore(false); syncUndo(); });
  tap('btnNext', function () {
    if (allClear() && !rec(0).end) { rec(0).end = 1; saveRec(); showEnd(); return; }
    var i = SIZES.indexOf(G.n), nx = G.n;
    for (var k = 1; k <= SIZES.length; k++) { var s = SIZES[(i + k) % SIZES.length]; if (!rec(s).clr) { nx = s; break; } }
    if (nx === G.n) nx = SIZES[(i + 1) % SIZES.length];
    G.n = nx; show(null); startPlay();
  });
  ['btnTitle1', 'btnTitle2', 'btnTitle3', 'btnTitle4'].forEach(function (id) { tap(id, goTitle); });
  tap('btnResume', function () { pause(false); });
  tap('tgPause', function () { pause(true); });
  function syncTog() { $('tgBgm').classList.toggle('off', !AU.bgm()); $('tgSnd').classList.toggle('off', !AU.snd()); }
  tap('tgBgm', function () { AU.bgm(!AU.bgm()); syncTog(); }, 1);
  tap('tgSnd', function () { AU.snd(!AU.snd()); syncTog(); AU.play('tap'); }, 1);
  syncTog();

  var KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'm' || k === 'M') { AU.init(); AU.bgm(!AU.bgm()); syncTog(); return; }
    if (k === 'k' || k === 'K') { AU.init(); AU.snd(!AU.snd()); syncTog(); return; }
    if (scene === 'title') {
      if (k === 'Enter' || k === ' ') { e.preventDefault(); AU.init(); AU.play('tap'); startPlay(); }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') pickSize(-1);
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') pickSize(1);
      return;
    }
    if (k === 'Escape') { if ($('wConfirm').classList.contains('show')) show(paused ? 'wPause' : null); else if (!G.over && !G.won) pause(!paused); return; }
    if (KEYS[k]) { e.preventDefault(); AU.init(); move(KEYS[k]); return; }
    if ((k === 'z' || k === 'Z') && (!sheetOpen() || $('wOver').classList.contains('show'))) { show(null); undo(); }
    if (k === 'Enter' && $('wOver').classList.contains('show')) $('btnRetry').click();
  });
  var sw = null;
  cv.addEventListener('pointerdown', function (e) { sw = { x: e.clientX, y: e.clientY, id: e.pointerId, done: false }; AU.init(); });
  cv.addEventListener('pointermove', function (e) {
    if (!sw || sw.done || e.pointerId !== sw.id) return;
    var dx = e.clientX - sw.x, dy = e.clientY - sw.y, th = Math.max(22, Math.min(W, H) * 0.045);
    if (Math.abs(dx) < th && Math.abs(dy) < th) return;
    sw.done = true;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  window.addEventListener('pointerup', function () { sw = null; });
  window.addEventListener('pointercancel', function () { sw = null; });
  window.addEventListener('touchstart', function () { document.body.classList.add('touch'); }, { passive: true, once: true });
  window.addEventListener('resize', function () { layout(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && scene === 'play' && !sheetOpen()) pause(true); });

  // ---------- 돌리기 ----------
  function step(t) {
    for (var i = pending.length - 1; i >= 0; i--) if (pending[i].at <= t) { var p = pending.splice(i, 1)[0]; p.fn(); }
    draw(t);
  }
  var FREEZE = null;
  function frame() { step(FREEZE != null ? FREEZE : now()); requestAnimationFrame(frame); }

  if (EN) {
    document.body.classList.add('en'); document.documentElement.lang = 'en';
    document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); });
  }
  if (qp('still')) document.body.classList.add('still');
  if (SHOT) document.body.classList.add('shot');
  if (qp('n') && SIZES.indexOf(+qp('n')) >= 0) G.n = +qp('n');
  if (SHOT) G.n = 4;
  goTitle();
  function boot() {
    SPR = {}; MAT = null; requestAnimationFrame(frame);
    if ($('wClear').classList.contains('show')) tileCanvas($('cTile'), GOAL[G.n]);
    if ($('wEnd').classList.contains('show')) showEnd();
  }
  if (document.fonts && document.fonts.load) document.fonts.load('40px Miso').then(boot, boot); else boot();

  // 시험 갈고리(로컬만): ?view=play|over|clear|end|pause|confirm&n=4&fill=demo
  window.__g = {
    G: G, L: function () { return L; }, step: step, move: move, undo: undo, now: now, spawn: spawn,
    set: function (arr, score) { clearBoard(); for (var r = 0; r < G.n; r++) for (var c = 0; c < G.n; c++) if (arr[r][c]) newTile(arr[r][c], r, c, 'still'); G.score = score || 0; G.maxT = maxTile(); setScore(false); syncUndo(); },
    showOver: showOver, showClear: showClear, showEnd: showEnd, rec: rec
  };
  if (LOCAL) {
    var view = qp('view');
    if (view && view !== 'title') {
      startPlay();
      if (qp('fill') === 'demo') window.__g.set(DEMO[G.n], 12345);
      if (view === 'over') { window.__g.set(G.n === 4 ? [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 8, 16], [4, 32, 64, 128]] : DEMO[G.n], 2140); G.over = true; showOver(); }
      if (view === 'clear') { window.__g.set(DEMO[G.n], 20480); showClear(); }
      if (view === 'end') showEnd();
      if (view === 'pause') pause(true);
      if (view === 'confirm') show('wConfirm');
      if (view === 'anim') { // 합치기 순간을 at ms 에 멈춰 보기
        var at = +(qp('at') || 150);
        var go = function () {
          window.__g.set(G.n === 4 ? [[2, 2, 4, 4], [8, 8, 16, 0], [64, 64, 0, 0], [128, 128, 512, 512]] : DEMO[G.n], 500);
          var t0 = now(); move(qp('dir') || 'left');
          for (var tt = t0; tt <= t0 + at; tt += 16) step(tt);
          FREEZE = t0 + at;
        };
        if (document.fonts) document.fonts.load('40px Miso').then(function () { SPR = {}; go(); }); else go();
      }
    }
  }
})();
