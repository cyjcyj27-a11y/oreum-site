// 스도쿠 — 모눈 공책에 오려 붙인 신문 스도쿠를 연필로 푼다
(function () {
  'use strict';
  var PZ = window.SDK_PUZZLES, N = PZ.length;
  var QS = location.search;
  var EN = /[?&]lang=en(&|$)/.test(QS), SHOT = /[?&]shot=1/.test(QS);
  function qp(k) { var m = new RegExp('[?&]' + k + '=([^&]*)').exec(QS); return m ? decodeURIComponent(m[1]) : null; }
  var TIER_KO = window.SDK_TIERS, TIER_EN = ['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT', 'MASTER'];
  function T(ko, en) { return EN ? en : ko; }
  var tierOf = PZ.map(function (p) { return p[2]; });
  var tierFirst = [], tierCount = [], numIn = [];
  tierOf.forEach(function (t, i) {
    if (tierFirst[t] == null) { tierFirst[t] = i; tierCount[t] = 0; }
    tierCount[t]++; numIn[i] = i - tierFirst[t] + 1;
  });
  function tierName(t) { return T(TIER_KO[t], TIER_EN[t]); }
  function label(i) { return tierName(tierOf[i]) + ' ' + numIn[i]; }
  function fmt(s) { s = Math.max(0, s | 0); var h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0, x = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : (m < 10 ? '0' : '')) + m + ':' + (x < 10 ? '0' : '') + x; }

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function lsj(k, d) { try { var s = ls(k); return s ? JSON.parse(s) : d; } catch (e) { return d; } }
  var LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname); // 시험용 갈고리는 내 컴퓨터에서만
  if (!LOCAL) qp = function () { return null; };
  if (qp('reset')) { ls('sudoku.done', null); ls('sudoku.save', null); ls('sudoku.pick', null); }
  if (qp('solved')) { var sd = {}; for (var z = 0; z < +qp('solved'); z++) sd[z] = 240 + z * 13; ls('sudoku.done', JSON.stringify(sd)); } // 시험용
  var done = lsj('sudoku.done', {});   // 판 번호 -> 최고 기록(초)
  var saves = lsj('sudoku.save', {});  // 판 번호 -> {v, m, t}
  function saveAll() { ls('sudoku.done', JSON.stringify(done)); ls('sudoku.save', JSON.stringify(saves)); }
  function unlocked(i) { return i === tierFirst[tierOf[i]] || done[i - 1] != null || done[i] != null; }
  function doneCount() { var n = 0; for (var i = 0; i < N; i++) if (done[i] != null) n++; return n; }
  var pick = parseInt(ls('sudoku.pick'), 10); if (!(pick >= 0 && pick < N) || !unlocked(pick)) pick = 0;

  // ---------- 판 구조 ----------
  var ROWS = [], COLS = [], BOXES = [], UNITS, PEERS = [], UNITS_OF = [];
  for (var r = 0; r < 9; r++) { ROWS.push([]); COLS.push([]); BOXES.push([]); }
  for (var i = 0; i < 81; i++) { var rr = (i / 9) | 0, cc = i % 9; ROWS[rr].push(i); COLS[cc].push(i); BOXES[((rr / 3) | 0) * 3 + ((cc / 3) | 0)].push(i); }
  UNITS = ROWS.concat(COLS, BOXES);
  for (i = 0; i < 81; i++) {
    var s = {}, uo = [];
    UNITS.forEach(function (u, ui) { if (u.indexOf(i) >= 0) { uo.push(ui); u.forEach(function (p) { s[p] = 1; }); } });
    delete s[i]; PEERS.push(Object.keys(s).map(Number)); UNITS_OF.push(uo);
  }

  // ---------- 상태 ----------
  var G = { st: 0, giv: [], v: [], m: [], sol: [], t: 0, sel: 40, memo: false, undo: [], scene: 'title', paused: false, cleared: false };
  var fx = { write: {}, shake: {}, sweeps: [], crumbs: [], pop: 0 };
  var dirty = true;

  function loadStage(i) {
    var p = PZ[i];
    G.st = i; G.giv = []; G.v = []; G.m = []; G.sol = [];
    for (var k = 0; k < 81; k++) { var d = +p[0][k]; G.giv.push(d > 0); G.v.push(d); G.m.push(0); G.sol.push(+p[1][k]); }
    G.t = 0; G.undo = []; G.cleared = false; G.paused = false;
    var sv = saves[i];
    if (sv && sv.v && sv.v.length === 81) {
      for (k = 0; k < 81; k++) if (!G.giv[k]) { G.v[k] = +sv.v[k]; G.m[k] = (sv.m && sv.m[k]) | 0; }
      G.t = sv.t | 0;
    }
    G.sel = -1;
    for (k = 0; k < 81; k++) if (!G.giv[k] && !G.v[k]) { G.sel = k; break; }
    if (G.sel < 0) G.sel = 40;
    fx.write = {}; fx.shake = {}; fx.sweeps = []; fx.crumbs = []; fx.pop = 0;
    dirty = true;
  }
  function saveCur() {
    if (G.scene !== 'play' || G.cleared) return;
    var any = false;
    for (var k = 0; k < 81; k++) if (!G.giv[k] && (G.v[k] || G.m[k])) { any = true; break; }
    if (!any && G.t < 3) { delete saves[G.st]; } else saves[G.st] = { v: G.v.join(''), m: G.m.slice(), t: G.t | 0 };
    saveAll();
  }
  function conflicts() {
    var c = new Array(81);
    for (var k = 0; k < 81; k++) {
      if (!G.v[k]) continue;
      var pe = PEERS[k];
      for (var j = 0; j < pe.length; j++) if (G.v[pe[j]] === G.v[k]) { c[k] = true; break; }
    }
    return c;
  }
  function unitDone(u) {
    var seen = 0;
    for (var j = 0; j < 9; j++) { var d = G.v[u[j]]; if (!d) return false; var b = 1 << d; if (seen & b) return false; seen |= b; }
    return true;
  }
  function digitCount(d) { var n = 0; for (var k = 0; k < 81; k++) if (G.v[k] === d) n++; return n; }
  function snap() { G.undo.push({ v: G.v.slice(), m: G.m.slice(), sel: G.sel }); if (G.undo.length > 400) G.undo.shift(); }

  // ---------- 조작 ----------
  function canEdit() { return G.scene === 'play' && !G.paused && !G.cleared && G.sel >= 0; }
  function input(d) {
    if (!canEdit() || G.giv[G.sel]) { if (canEdit()) AU.play('bad'); return; }
    var k = G.sel, now = performance.now();
    if (G.memo) {
      if (G.v[k]) return;
      snap();
      G.m[k] ^= (1 << d);
      AU.play('memo');
      dirty = true; saveCur(); return;
    }
    snap();
    if (G.v[k] === d) { G.v[k] = 0; AU.play('erase'); addCrumbs(k); dirty = true; updatePad(); saveCur(); return; }
    G.v[k] = d; G.m[k] = 0;
    PEERS[k].forEach(function (p) { G.m[p] &= ~(1 << d); });
    if (!fx.still) fx.write[k] = now;
    var c = conflicts();
    if (c[k]) { fx.shake[k] = now; AU.play('bad'); }
    else {
      AU.play('write');
      var nDone = 0;
      UNITS_OF[k].forEach(function (ui) { if (unitDone(UNITS[ui])) { if (!fx.still) fx.sweeps.push({ u: ui, t: now + nDone * 90 }); nDone++; } });
      if (nDone) setTimeout(function () { AU.play('sweep', nDone - 1); }, 120);
    }
    dirty = true; updatePad();
    if (checkWin()) return;
    saveCur();
  }
  function erase() {
    if (!canEdit()) return;
    var k = G.sel;
    if (G.giv[k] || (!G.v[k] && !G.m[k])) return;
    snap(); G.v[k] = 0; G.m[k] = 0;
    AU.play('erase'); addCrumbs(k);
    dirty = true; updatePad(); saveCur();
  }
  function undo() {
    if (!canEdit() || !G.undo.length) return;
    var u = G.undo.pop(); G.v = u.v; G.m = u.m; G.sel = u.sel;
    AU.play('tap'); dirty = true; updatePad(); saveCur();
  }
  function setMemo(on) {
    G.memo = on; document.body.classList.toggle('memo', on);
    $('memoSt').textContent = on ? 'ON' : 'OFF';
  }
  function moveSel(dx, dy) {
    if (G.scene !== 'play' || G.paused || G.cleared) return;
    if (G.sel < 0) G.sel = 40;
    var r = (G.sel / 9) | 0, c = G.sel % 9;
    r = (r + dy + 9) % 9; c = (c + dx + 9) % 9;
    G.sel = r * 9 + c; AU.play('pick'); dirty = true;
  }
  function checkWin() {
    for (var k = 0; k < 81; k++) if (!G.v[k]) return false;
    var c = conflicts();
    for (k = 0; k < 81; k++) if (c[k]) return false;
    for (k = 0; k < 81; k++) if (G.v[k] !== G.sol[k]) return false; // 해는 하나뿐이라 여기 오면 같다
    win(); return true;
  }

  // ---------- 그리기 준비 ----------
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('c'), ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, L = {};
  var bgCache = null, paperPat = null, graphite = null, redPencil = null;
  function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function makeTextures() {
    // 신문 종이 결
    var pc = mkCanvas(256, 256), p = pc.getContext('2d'), R = rng(7);
    p.fillStyle = '#efe9d9'; p.fillRect(0, 0, 256, 256);
    for (var k = 0; k < 2600; k++) { var a = R(); p.fillStyle = a < 0.5 ? 'rgba(120,100,60,' + (0.03 + R() * 0.05) + ')' : 'rgba(255,255,250,' + (0.05 + R() * 0.08) + ')'; p.fillRect(R() * 256, R() * 256, 1 + R() * 1.6, 1 + R() * 1.6); }
    for (k = 0; k < 40; k++) { p.strokeStyle = 'rgba(140,120,80,' + (0.03 + R() * 0.04) + ')'; p.lineWidth = 0.6; p.beginPath(); var x = R() * 256, y = R() * 256; p.moveTo(x, y); p.lineTo(x + (R() - 0.5) * 20, y + (R() - 0.5) * 6); p.stroke(); }
    paperPat = ctx.createPattern(pc, 'repeat');
    // 흑연 결: 회색 바탕에 밝고 어두운 낱알
    function lead(base, dark, light, seed) {
      var gc = mkCanvas(96, 96), g = gc.getContext('2d'), Rg = rng(seed);
      g.fillStyle = base; g.fillRect(0, 0, 96, 96);
      for (var j = 0; j < 1500; j++) { g.fillStyle = Rg() < 0.55 ? dark : light; g.globalAlpha = 0.25 + Rg() * 0.5; g.fillRect(Rg() * 96, Rg() * 96, 1 + Rg(), 1 + Rg()); }
      for (j = 0; j < 60; j++) { g.globalAlpha = 0.18; g.strokeStyle = light; g.lineWidth = 0.7; g.beginPath(); var xx = Rg() * 96, yy = Rg() * 96; g.moveTo(xx, yy); g.lineTo(xx + 6 + Rg() * 8, yy - 3 - Rg() * 5); g.stroke(); }
      return ctx.createPattern(gc, 'repeat');
    }
    graphite = lead('#4c4f5b', '#2f313a', '#8a8d99', 11);
    redPencil = lead('#c43a33', '#9c2520', '#e8857c', 13);
  }

  function makeBg() {
    bgCache = mkCanvas(Math.max(1, W * DPR | 0), Math.max(1, H * DPR | 0));
    var b = bgCache.getContext('2d'); b.scale(DPR, DPR);
    b.fillStyle = '#f4efe2'; b.fillRect(0, 0, W, H);
    // 모눈: 6mm 칸, 5칸마다 진하게
    var g = 22, ox = (W / 2) % g, oy = (H / 2) % g, n = 0;
    for (var x = ox, ix = Math.round(-(W / 2) / g); x < W; x += g, ix++) { b.fillStyle = ((ix % 5) + 5) % 5 === 0 ? 'rgba(80,135,200,.30)' : 'rgba(80,135,200,.16)'; b.fillRect(Math.round(x), 0, 1, H); }
    for (var y = oy, iy = Math.round(-(H / 2) / g); y < H; y += g, iy++) { b.fillStyle = ((iy % 5) + 5) % 5 === 0 ? 'rgba(80,135,200,.30)' : 'rgba(80,135,200,.16)'; b.fillRect(0, Math.round(y), W, 1); }
    // 종이 낱알과 얼룩
    var R = rng(3);
    for (n = 0; n < W * H / 260; n++) { b.fillStyle = R() < 0.6 ? 'rgba(130,110,70,.05)' : 'rgba(255,255,255,.12)'; b.fillRect(R() * W, R() * H, 1.2, 1.2); }
    for (n = 0; n < 5; n++) { var gx = R() * W, gy = R() * H, gr = 60 + R() * 160, gg = b.createRadialGradient(gx, gy, 0, gx, gy, gr); gg.addColorStop(0, 'rgba(190,160,100,.06)'); gg.addColorStop(1, 'rgba(190,160,100,0)'); b.fillStyle = gg; b.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); }
    // 가장자리 어둡게
    var v = b.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    v.addColorStop(0, 'rgba(60,45,20,0)'); v.addColorStop(1, 'rgba(60,45,20,.16)');
    b.fillStyle = v; b.fillRect(0, 0, W, H);
  }

  // ---------- 화면 배치 ----------
  function topH() { var tb = $('topbar'); return tb ? tb.getBoundingClientRect().height : 50; }
  function layout() {
    W = innerWidth; H = innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = W * DPR | 0; cv.height = H * DPR | 0;
    var top = topH() + 6, port = W < H * 0.9;
    L.port = port;
    var KX = 1.07, KY = 1.125; // 판 크기 S 에 대한 오려 붙인 종이 크기
    var pad = $('pad'), tools = $('tools');
    if (port) {
      var gap = 5, kw = Math.min(58, (W - 16 - gap * 8) / 9), kh = Math.min(78, Math.max(48, kw * 1.75), (H - top) * 0.1);
      var toolsH = 52, bottom = 14;
      var availH = H - top - toolsH - kh - bottom - 24;
      var S = Math.min((W - 12) / KX, availH / KY, 640);
      var groupH = S * KY + 12 + toolsH + 10 + kh;
      var y0 = top + Math.max(0, (H - top - bottom - groupH) * 0.42);
      L.S = S; L.bx = (W - S) / 2; L.by = y0 + S * 0.085;
      var ty = y0 + S * KY + 12;
      tools.style.cssText = 'left:0;width:' + W + 'px;top:' + ty + 'px;height:' + toolsH + 'px;grid-template-columns:auto auto auto;justify-content:center;';
      pad.style.cssText = 'left:' + ((W - (kw * 9 + gap * 8)) / 2) + 'px;top:' + (ty + toolsH + 10) + 'px;grid-template-columns:repeat(9,' + kw + 'px);grid-auto-rows:' + kh + 'px;gap:' + gap + 'px;';
      L.kfont = Math.min(34, kw * 0.82);
    } else {
      var PW = Math.min(460, Math.max(270, W * 0.33)), g2 = Math.max(8, PW * 0.03), tsc = Math.min(1.45, Math.max(1, PW / 320)), toolsH2 = 54 * tsc;
      var availH2 = H - top - 12;
      var S2 = Math.min(availH2 / KY, (W - 44 - PW) / KX, 660);
      var kh2 = Math.min(130, (Math.min(availH2, S2 * KY) - toolsH2 - 14 - g2 * 2) / 3);
      var groupW = S2 * KX + 30 + PW, x0 = (W - groupW) / 2;
      if (S2 * KY > H - top - 52) x0 = Math.max(x0, Math.min(96, W - groupW - 8)); // 왼쪽 아래 전체화면 알약 피하기
      L.S = S2; L.bx = x0 + S2 * 0.035; L.by = top + (availH2 - S2 * KY) / 2 + S2 * 0.085;
      var px = x0 + S2 * KX + 30, panelH = toolsH2 + 14 + kh2 * 3 + g2 * 2;
      var py = L.by - S2 * 0.085 + (S2 * KY - panelH) / 2;
      tools.style.cssText = 'left:' + (px + PW / 2 - PW / tsc / 2) + 'px;width:' + (PW / tsc) + 'px;top:' + py + 'px;height:54px;grid-template-columns:auto auto auto;justify-content:center;transform:scale(' + tsc + ');transform-origin:50% 0;';
      pad.style.cssText = 'left:' + px + 'px;top:' + (py + toolsH2 + 14) + 'px;grid-template-columns:repeat(3,' + ((PW - g2 * 2) / 3) + 'px);grid-auto-rows:' + kh2 + 'px;gap:' + g2 + 'px;';
      L.kfont = Math.min(52, kh2 * 0.55);
    }
    // 타이틀 배치: 세로 = 판 위·글 아래, 가로 = 판 왼쪽·글 오른쪽
    var tt = $('title');
    if (port) {
      var St = Math.min(W * 0.88, (H - top - 300) / 1.13, 560);
      L.tS = St; L.tbx = (W - St) / 2; L.tby = top + 6 + St * 0.085;
      var ty0 = L.tby + St * 1.04 + 8;
      tt.style.cssText = 'left:0;width:' + W + 'px;top:' + ty0 + 'px;height:' + (H - ty0) + 'px;padding-bottom:46px;';
      $('title').querySelector('h1').style.fontSize = Math.min(W * (EN ? 0.15 : 0.24), (H - ty0 - 46) * 0.34, 170) + 'px';
    } else {
      var St2 = Math.min((H - top - 50) / KY, W * 0.5, 600);
      var rightW = Math.min(W - St2 * KX - 60, 560);
      var gx0 = (W - (St2 * KX + 40 + rightW)) / 2;
      if (SHOT) { St2 = Math.min(St2, W * 0.37); rightW = W * 0.4; gx0 = (W - (St2 * KX + 40 + rightW)) / 2; } // 표지: 카드가 양옆을 잘라도 판·제목이 안 잘리게
      L.tS = St2; L.tbx = gx0 + St2 * 0.035; L.tby = top + (H - top - 50 - St2 * KY) / 2 + St2 * 0.085;
      var rx = gx0 + St2 * KX + 40;
      tt.style.cssText = 'left:' + rx + 'px;width:' + rightW + 'px;top:' + top + 'px;height:' + (H - top) + 'px;padding-bottom:' + Math.max(8, H * 0.03) + 'px;';
      $('title').querySelector('h1').style.fontSize = Math.min(rightW * (EN ? (SHOT ? 0.2 : 0.19) : 0.3), H * (SHOT ? 0.26 : 0.22), SHOT ? 230 : 170) + 'px';
    }
    Array.prototype.forEach.call(pad.children, function (c) { c.querySelector('.k').style.fontSize = L.kfont + 'px'; });
    makeBg(); dirty = true;
  }

  // ---------- 그리기 ----------
  function tape(cx, cy, w, h, ang, seed) {
    var R = rng(seed);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
    ctx.lineTo(w / 2, -h / 2);
    for (var k = 1; k <= 6; k++) ctx.lineTo(w / 2 + (k % 2 ? -1 : 1) * (1 + R() * 2.5), -h / 2 + h * k / 6);
    ctx.lineTo(-w / 2, h / 2);
    for (k = 5; k >= 0; k--) ctx.lineTo(-w / 2 + (k % 2 ? 1 : -1) * (1 + R() * 2.5), -h / 2 + h * k / 6);
    ctx.closePath();
    ctx.shadowColor = 'rgba(60,40,10,.15)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
    ctx.fillStyle = 'rgba(234,218,174,.78)'; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 0.18; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    for (k = 0; k < 7; k++) { ctx.beginPath(); var yy = -h / 2 + h * (k + 0.5) / 7; ctx.moveTo(-w / 2 + 3, yy); ctx.lineTo(w / 2 - 3, yy); ctx.stroke(); }
    ctx.restore();
  }
  function hl(x, y, w, h, col, a, seed, over) {
    var R = rng(seed);
    ctx.save(); ctx.globalCompositeOperation = over ? 'source-over' : 'multiply'; ctx.fillStyle = col;
    for (var p = 0; p < 2; p++) {
      ctx.globalAlpha = a * (p ? 0.45 : 1);
      var j = Math.min(w, h) * 0.05;
      ctx.beginPath();
      ctx.moveTo(x - j + R() * j, y + R() * j * 1.5);
      ctx.lineTo(x + w + R() * j, y - j * 0.5 + R() * j);
      ctx.lineTo(x + w + j - R() * j, y + h - R() * j * 1.5);
      ctx.lineTo(x - R() * j, y + h + j * 0.5 - R() * j);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function circleMark(cx, cy, r, seed) {
    var R = rng(seed);
    ctx.save(); ctx.strokeStyle = redPencil || '#c43a33'; ctx.lineWidth = Math.max(1.4, r * 0.09); ctx.lineCap = 'round'; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    var a0 = R() * 6.28, turns = 1.12;
    for (var k = 0; k <= 40; k++) {
      var a = a0 + k / 40 * Math.PI * 2 * turns, rr = r * (1 + (R() - 0.5) * 0.06 + k / 40 * 0.06);
      var px = cx + Math.cos(a) * rr * 1.05, py = cy + Math.sin(a) * rr * 0.92;
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke(); ctx.restore();
  }
  function addCrumbs(k) {
    var cs = L.S / 9, cx = L.bx + (k % 9) * cs + cs / 2, cy = L.by + ((k / 9) | 0) * cs + cs / 2, now = performance.now();
    for (var j = 0; j < 14; j++) {
      fx.crumbs.push({ x: cx + (Math.random() - 0.5) * cs * 0.5, y: cy + (Math.random() - 0.5) * cs * 0.3, vx: (Math.random() - 0.5) * cs * 3, vy: -cs * (0.6 + Math.random() * 1.6), t0: now,
        r: Math.max(1.2, cs * (0.025 + Math.random() * 0.03)), col: Math.random() < 0.6 ? '#ec9aa6' : '#8d8f99', rot: Math.random() * 3, spin: (Math.random() - 0.5) * 12 });
    }
  }
  // 타이틀: 푼 판에는 빨간 도장
  function miniStamp(cx, cy, r) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.21); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#d2342a'; ctx.fillStyle = '#d2342a';
    ctx.lineWidth = Math.max(2, r * 0.09); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = Math.max(1, r * 0.04); ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = (r * (EN ? 0.36 : 0.42)) + 'px Allim';
    ctx.fillText(EN ? 'GREAT' : '참 잘', 0, -r * 0.22); ctx.fillText(EN ? 'JOB' : '했어요', 0, r * 0.26);
    ctx.restore();
  }
  function titleData() {
    var p = PZ[pick], sv = saves[pick], D = { stage: pick, giv: [], v: [], m: [], sel: -1, showSel: false };
    for (var k = 0; k < 81; k++) { var d = +p[0][k]; D.giv.push(d > 0); D.v.push(d || (sv && sv.v ? +sv.v[k] : 0)); D.m.push(0); }
    if (done[pick] != null) for (k = 0; k < 81; k++) D.v[k] = +p[1][k];
    return D;
  }
  function render(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (bgCache) ctx.drawImage(bgCache, 0, 0, W, H);
    if (G.scene === 'title') { drawPuzzle(L.tbx, L.tby, L.tS, titleData(), now); if (done[pick] != null) miniStamp(L.tbx + L.tS * 0.8, L.tby + L.tS * 0.2, L.tS * 0.15); }
    else drawPuzzle(L.bx, L.by, L.S, { stage: G.st, giv: G.giv, v: G.v, m: G.m, sel: G.sel, showSel: !G.cleared && !G.paused, conf: conflicts(), paused: G.paused }, now);
  }

  function drawPuzzle(bx, by, S, D, now) {
    var cs = S / 9, pad = S * 0.035, hdr = S * 0.085;
    var x0 = bx - pad, y0 = by - hdr, w = S + pad * 2, h = S + hdr + pad;
    var R = rng(500 + D.stage * 7), k;
    // 오려 낸 종이(가위 자국으로 가장자리가 조금 삐뚤다)
    ctx.save();
    ctx.shadowColor = 'rgba(60,40,10,.30)'; ctx.shadowBlur = Math.max(6, S * 0.025); ctx.shadowOffsetY = Math.max(2, S * 0.008);
    ctx.beginPath(); ctx.moveTo(x0, y0);
    var n = 14;
    for (k = 1; k <= n; k++) ctx.lineTo(x0 + w * k / n, y0 + (R() - 0.5) * 2.2);
    for (k = 1; k <= n; k++) ctx.lineTo(x0 + w + (R() - 0.5) * 2.2, y0 + h * k / n);
    for (k = 1; k <= n; k++) ctx.lineTo(x0 + w - w * k / n, y0 + h + (R() - 0.5) * 2.2);
    for (k = 1; k < n; k++) ctx.lineTo(x0 + (R() - 0.5) * 2.2, y0 + h - h * k / n);
    ctx.closePath(); ctx.fillStyle = paperPat || '#efe9d9'; ctx.fill();
    ctx.restore();
    // 머리글(인쇄)
    var hf = Math.max(10, hdr * 0.46);
    ctx.fillStyle = '#26262d'; ctx.textBaseline = 'middle';
    ctx.font = hf + 'px Allim'; ctx.textAlign = 'left';
    ctx.fillText(T('스도쿠', 'SUDOKU'), bx, by - hdr * 0.5);
    ctx.font = (hf * 0.82) + 'px Allim'; ctx.textAlign = 'right';
    ctx.fillText(label(D.stage) + '   No.' + (D.stage + 1), bx + S, by - hdr * 0.5);
    ctx.fillRect(bx, by - hdr * 0.14, S, Math.max(1, S / 700));
    // 칸 강조(형광펜)
    var sel = D.sel, conf = D.conf || [];
    if (D.showSel && sel >= 0) {
      var sr = (sel / 9) | 0, sc = sel % 9, sb = ((sr / 3) | 0) * 27 + ((sc / 3) | 0) * 3;
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(70,80,110,.075)';
      ctx.fillRect(bx, by + sr * cs, S, cs); ctx.fillRect(bx + sc * cs, by, cs, S);
      ctx.fillRect(bx + (sb % 9) * cs, by + ((sb / 9) | 0) * cs, cs * 3, cs * 3);
      ctx.restore();
      var sv = D.v[sel];
      if (sv) for (k = 0; k < 81; k++) if (k !== sel && D.v[k] === sv) hl(bx + (k % 9) * cs + cs * 0.08, by + ((k / 9) | 0) * cs + cs * 0.12, cs * 0.84, cs * 0.76, '#fff27a', 0.5, k + 3);
      hl(bx + sc * cs + cs * 0.04, by + sr * cs + cs * 0.06, cs * 0.92, cs * 0.88, '#ffe94d', 0.75, sel + 1, true);
    }
    // 한 줄·한 칸을 다 채우면 연두 형광펜이 지나간다
    fx.sweeps.forEach(function (sw) {
      var e = now - sw.t; if (e < 0) return;
      var p = Math.min(1, e / 330), a = e < 330 ? 0.5 : 0.5 * Math.max(0, 1 - (e - 330) / 650);
      var u = sw.u, rx, ry, rw, rh;
      if (u < 9) { rx = bx; ry = by + u * cs; rw = S * p; rh = cs; }
      else if (u < 18) { rx = bx + (u - 9) * cs; ry = by; rw = cs; rh = S * p; }
      else { var bi = u - 18; rx = bx + (bi % 3) * 3 * cs; ry = by + ((bi / 3) | 0) * 3 * cs; rw = cs * 3 * p; rh = cs * 3; }
      hl(rx + 1, ry + cs * 0.08, Math.max(1, rw - 2), rh - cs * 0.16, '#a9e05a', a, u + 40);
    });
    fx.sweeps = fx.sweeps.filter(function (sw) { return now - sw.t < 1000; });
    // 칸 줄(인쇄)
    ctx.fillStyle = 'rgba(28,28,36,.5)';
    var lw = Math.max(1, S / 430);
    for (k = 1; k < 9; k++) if (k % 3) { ctx.fillRect(bx + k * cs - lw / 2, by, lw, S); ctx.fillRect(bx, by + k * cs - lw / 2, S, lw); }
    ctx.fillStyle = 'rgba(24,24,30,.92)';
    var bw = Math.max(2, S / 165);
    for (k = 1; k < 3; k++) { ctx.fillRect(bx + k * 3 * cs - bw / 2, by, bw, S); ctx.fillRect(bx, by + k * 3 * cs - bw / 2, S, bw); }
    ctx.lineWidth = Math.max(2.5, S / 125); ctx.strokeStyle = 'rgba(24,24,30,.95)'; ctx.strokeRect(bx, by, S, S);
    if (!D.paused) drawDigits(bx, by, S, D, now, conf);
    // 지우개 가루
    var cr = fx.crumbs;
    for (k = cr.length - 1; k >= 0; k--) {
      var c = cr[k], e2 = (now - c.t0) / 1000;
      if (e2 > 0.75) { cr.splice(k, 1); continue; }
      var px = c.x + c.vx * e2, py = c.y + c.vy * e2 + 260 * e2 * e2;
      ctx.globalAlpha = Math.max(0, 1 - e2 / 0.75); ctx.fillStyle = c.col;
      ctx.save(); ctx.translate(px, py); ctx.rotate(c.rot + e2 * c.spin); ctx.fillRect(-c.r, -c.r * 0.6, c.r * 2, c.r * 1.2); ctx.restore();
    }
    ctx.globalAlpha = 1;
    // 테이프는 맨 위에
    tape(x0 + w * 0.5, y0 + 1, Math.max(50, w * 0.24), Math.max(16, hdr * 0.6), -0.04, 21 + D.stage);
    tape(x0 + w - 4, y0 + h - 4, Math.max(36, w * 0.13), Math.max(14, hdr * 0.5), -0.75, 37 + D.stage);
  }

  function drawDigits(bx, by, S, D, now, conf) {
    var cs = S / 9, k;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var popT = fx.pop ? now - fx.pop : -1;
    for (k = 0; k < 81; k++) {
      var r0 = (k / 9) | 0, c0 = k % 9, cx = bx + c0 * cs + cs / 2, cy = by + r0 * cs + cs / 2;
      var d = D.v[k], sc2 = 1;
      if (popT >= 0) { var dd = Math.hypot(r0 - 4, c0 - 4), q = (popT - dd * 45) / 260; if (q > 0 && q < 1) sc2 = 1 + 0.22 * Math.sin(q * Math.PI); }
      if (d && D.giv[k]) {
        ctx.save(); ctx.translate(cx, cy + cs * 0.03); ctx.scale(sc2, sc2);
        ctx.font = (cs * 0.6) + 'px Allim'; ctx.fillStyle = '#1b1b22'; ctx.fillText(d, 0, 0);
        ctx.restore();
        if (conf[k]) circleMark(cx, cy, cs * 0.36, k + 9);
      } else if (d) {
        var sh = fx.shake[k], ox = 0;
        if (sh) { var se = now - sh; if (se < 320) ox = Math.sin(se * 0.07) * cs * 0.06 * (1 - se / 320); else delete fx.shake[k]; }
        var Rr = rng(k * 31 + d);
        ctx.save(); ctx.translate(cx + ox + (Rr() - 0.5) * cs * 0.05, cy + cs * 0.02 + (Rr() - 0.5) * cs * 0.04);
        ctx.rotate((Rr() - 0.5) * 0.09); ctx.scale(sc2, sc2);
        var wt = fx.write[k];
        if (wt) {
          var we = (now - wt) / 170;
          if (we < 1) { ctx.beginPath(); ctx.rect(-cs / 2, -cs / 2, cs * we, cs); ctx.clip(); }
          else delete fx.write[k];
        }
        ctx.font = (cs * 0.72) + 'px Kku';
        ctx.fillStyle = conf[k] ? redPencil : graphite;
        ctx.fillText(d, 0, 0);
        ctx.restore();
        if (conf[k]) circleMark(cx, cy, cs * 0.38, k + 9);
      } else if (D.m[k]) {
        ctx.font = (cs * 0.27) + 'px Nadeuri'; ctx.fillStyle = '#5a5d6c';
        for (var md = 1; md <= 9; md++) if (D.m[k] & (1 << md)) {
          var mr = ((md - 1) / 3) | 0, mc = (md - 1) % 3;
          ctx.fillText(md, bx + c0 * cs + cs * (0.2 + mc * 0.3), by + r0 * cs + cs * (0.22 + mr * 0.29));
        }
      }
    }
  }

  // ---------- 화면 전환 ----------
  var openSheet = null;
  function show(id) { if (openSheet) $(openSheet).classList.remove('show'); openSheet = id; document.body.classList.toggle('sheeton', !!id); if (id) { $(id).classList.add('show'); AU.play('page'); } }
  function hideSheet() { if (openSheet) $(openSheet).classList.remove('show'); openSheet = null; document.body.classList.remove('sheeton'); }
  function setScene(s) {
    G.scene = s;
    document.body.classList.toggle('playing', s === 'play');
    $('title').classList.toggle('hide', s !== 'title');
    $('tgPause').classList.toggle('hide', s !== 'play');
    $('tTime').classList.toggle('hide', s !== 'play');
    $('stamp').className = '';
    updateTop(); dirty = true;
  }
  function updateTop() {
    if (G.scene === 'title') $('tStage').textContent = T('푼 판 ', 'SOLVED ') + doneCount() + ' / ' + N;
    else $('tStage').textContent = label(G.st);
    $('tTimeV').textContent = fmt(G.t);
  }
  function refreshTitle() {
    $('lvBtn').textContent = label(pick);
    var sv = saves[pick], b = done[pick];
    $('btnStartT').textContent = sv ? T('이어하기', 'CONTINUE') : T('시작', 'START');
    $('btnNew').classList.toggle('hide', !sv);
    $('best').textContent = b != null ? T('최고 ', 'BEST ') + fmt(b) : '';
    $('lvDn').style.visibility = prevUnlocked(pick) < 0 ? 'hidden' : 'visible';
    $('lvUp').style.visibility = nextUnlocked(pick) < 0 ? 'hidden' : 'visible';
    updateTop(); dirty = true;
  }
  function prevUnlocked(i) { for (var j = i - 1; j >= 0; j--) if (unlocked(j)) return j; return -1; }
  function nextUnlocked(i) { for (var j = i + 1; j < N; j++) if (unlocked(j)) return j; return -1; }
  function setPick(i) { pick = i; ls('sudoku.pick', String(i)); refreshTitle(); }
  function toTitle() { saveCur(); hideSheet(); setScene('title'); refreshTitle(); }
  function start(i, fresh) {
    if (fresh) delete saves[i];
    setPick(i); loadStage(i); hideSheet(); setMemo(false);
    setScene('play'); updatePad(); saveAll();
    try { if (window.OG) OG.start(); } catch (e) {}
  }
  function buildPad() {
    var pad = $('pad'); pad.innerHTML = '';
    for (var d = 1; d <= 9; d++) (function (d) {
      var c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<span class="k">' + d + '</span>';
      c.addEventListener('pointerdown', function (e) { e.preventDefault(); AU.init(); input(d); });
      pad.appendChild(c);
    })(d);
  }
  function updatePad() {
    var cards = $('pad').children;
    for (var d = 1; d <= 9; d++) cards[d - 1].classList.toggle('done', digitCount(d) >= 9);
  }
  function buildPick() {
    var box = $('tiers'); box.innerHTML = '';
    for (var t = 0; t < TIER_KO.length; t++) {
      var row = document.createElement('div'); row.className = 'tierrow';
      var nd = 0; for (var j = 0; j < tierCount[t]; j++) if (done[tierFirst[t] + j] != null) nd++;
      row.innerHTML = '<div class="tn">' + tierName(t) + '<small>' + nd + ' / ' + tierCount[t] + '</small></div><div class="cells"></div>';
      var cells = row.querySelector('.cells');
      for (j = 0; j < tierCount[t]; j++) (function (i) {
        var c = document.createElement('div');
        c.className = 'card cl' + (unlocked(i) ? '' : ' lock') + (done[i] != null ? ' ok' : '') + (i === pick ? ' on' : '');
        c.innerHTML = '<span class="k">' + numIn[i] + '</span>';
        c.addEventListener('click', function () { if (!unlocked(i)) { AU.play('bad'); return; } AU.play('pick'); setPick(i); hideSheet(); });
        cells.appendChild(c);
      })(tierFirst[t] + j);
      box.appendChild(row);
    }
  }
  function win() {
    G.cleared = true;
    try { if (window.OG) OG.over({ result: 'CLEAR', score: G.st + 1 }); } catch (e) {}
    var first = done[G.st] == null, before = doneCount();
    done[G.st] = first ? (G.t | 0) : Math.min(done[G.st], G.t | 0);
    delete saves[G.st]; saveAll();
    var allNow = doneCount() === N && before < N;
    if (!fx.still) fx.pop = performance.now(); dirty = true;
    var st = $('stamp');
    st.style.left = (L.bx + L.S / 2) + 'px'; st.style.top = (L.by + L.S / 2) + 'px';
    var sz = Math.min(L.S * 0.62, 240); st.style.width = st.style.height = sz + 'px'; st.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
    st.style.fontSize = (sz * (EN ? 0.15 : 0.19)) + 'px';
    setTimeout(function () { st.className = 'show' + (allNow ? ' gold' : ''); AU.play('stamp'); }, fx.still ? 0 : 650);
    setTimeout(function () {
      $('cStage').textContent = label(G.st);
      $('cTime').textContent = fmt(G.t);
      $('cBest').textContent = first ? '' : T('최고 ', 'BEST ') + fmt(done[G.st]);
      var nx = G.st + 1;
      $('btnNextT').textContent = (allNow || nx >= N) ? 'THE END' : 'NEXT';
      $('btnNext').dataset.end = (allNow || nx >= N) ? '1' : '';
      placeClear(); show('wClear');
    }, fx.still ? 10 : 1900);
  }
  // 도장이 보이게: 세로는 판 아래, 가로는 오른쪽 숫자판 자리에 작은 창
  function placeClear() {
    var w = $('wClear'), sh = w.querySelector('.sheet');
    w.style.left = ''; w.style.top = '';
    var hh = sh.offsetHeight;
    if (L.port) {
      var top = Math.max(L.by + L.S * 0.8 + hh / 2, H - hh / 2 - 46);
      w.style.top = top + 'px'; w.style.left = '50%';
    } else {
      var pr = $('pad').getBoundingClientRect(), tr = $('tools').getBoundingClientRect();
      w.style.left = ((pr.left + pr.right) / 2) + 'px'; w.style.top = ((tr.top + pr.bottom) / 2) + 'px';
      sh.style.width = Math.min(430, Math.max(300, pr.width + 60)) + 'px';
    }
  }
  function showEnd() {
    var tot = 0; for (var i = 0; i < N; i++) tot += done[i] || 0;
    $('eCount').textContent = doneCount() + ' / ' + N;
    $('eTime').textContent = T('모두 합쳐 ', 'TOTAL ') + fmt(tot);
    show('wEnd');
  }
  function pause(on) {
    if (G.scene !== 'play' || G.cleared) return;
    G.paused = on; dirty = true;
    if (on) { saveCur(); show('wPause'); } else hideSheet();
  }

  // ---------- 입력 연결 ----------
  function tap(id, fn) { $(id).addEventListener('click', function (e) { AU.init(); fn(e); }); }
  tap('btnStart', function () { start(pick, false); });
  tap('btnNew', function () { G.confirmFrom = 'title'; show('wConfirm'); });
  tap('lvDn', function () { var j = prevUnlocked(pick); if (j >= 0) { AU.play('pick'); setPick(j); } });
  tap('lvUp', function () { var j = nextUnlocked(pick); if (j >= 0) { AU.play('pick'); setPick(j); } });
  tap('lvBtn', function () { buildPick(); show('wPick'); });
  tap('btnPickX', function () { hideSheet(); });
  tap('tgPause', function () { pause(!G.paused); });
  tap('btnResume', function () { pause(false); });
  tap('btnRestart', function () { G.confirmFrom = 'pause'; show('wConfirm'); });
  tap('btnTitle', function () { G.paused = false; toTitle(); });
  tap('btnNo', function () { if (G.confirmFrom === 'pause') show('wPause'); else hideSheet(); });
  tap('btnYes', function () { var i = G.confirmFrom === 'pause' ? G.st : pick; start(i, true); });
  tap('btnNext', function () {
    if ($('btnNext').dataset.end) { showEnd(); return; }
    var nx = G.st + 1; if (nx < N) start(nx, false); else showEnd();
  });
  tap('btnTitle2', function () { toTitle(); });
  tap('btnTitle3', function () { toTitle(); });
  tap('btnUndo', undo);
  tap('btnErase', erase);
  tap('btnMemo', function () { setMemo(!G.memo); AU.play('tap'); });
  function syncTogs() { $('tgSnd').classList.toggle('off', !AU.snd()); $('tgBgm').classList.toggle('off', !AU.bgm()); }
  tap('tgSnd', function () { AU.snd(!AU.snd()); syncTogs(); });
  tap('tgBgm', function () { AU.bgm(!AU.bgm()); syncTogs(); });
  document.querySelectorAll('.sheetw').forEach(function (w) {
    w.addEventListener('click', function (e) { if (e.target === w && w.id === 'wPick') hideSheet(); });
  });
  $('dim').addEventListener('click', function () { if (openSheet === 'wPick') hideSheet(); });

  cv.addEventListener('pointerdown', function (e) {
    AU.init();
    if (G.scene !== 'play' || G.paused || G.cleared) return;
    var cs = L.S / 9, c = Math.floor((e.clientX - L.bx) / cs), r = Math.floor((e.clientY - L.by) / cs);
    if (c < 0 || c > 8 || r < 0 || r > 8) return;
    var k = r * 9 + c;
    if (k !== G.sel) AU.play('pick');
    G.sel = k; dirty = true;
  });
  window.addEventListener('touchstart', function () { document.body.classList.add('touch'); }, { passive: true, once: true });

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'm' || k === 'M') { AU.init(); AU.bgm(!AU.bgm()); syncTogs(); return; }
    if (k === 'k' || k === 'K') { AU.init(); AU.snd(!AU.snd()); syncTogs(); return; }
    if (openSheet) {
      if (k === 'Escape') { if (openSheet === 'wPause') pause(false); else if (openSheet === 'wPick' || openSheet === 'wConfirm') $('btnNo').click(); }
      if (k === 'Enter') { var map = { wPause: 'btnResume', wConfirm: 'btnYes', wClear: 'btnNext', wEnd: 'btnTitle3' }; if (map[openSheet]) $(map[openSheet]).click(); }
      return;
    }
    if (G.scene === 'title') {
      if (k === 'Enter' || k === ' ') { AU.init(); start(pick, false); e.preventDefault(); }
      else if (k === 'ArrowLeft') $('lvDn').click(); else if (k === 'ArrowRight') $('lvUp').click();
      return;
    }
    if (G.scene !== 'play') return;
    AU.init();
    if (k === 'Escape' || k === 'p' || k === 'P') { pause(!G.paused); return; }
    if (G.paused || G.cleared) return;
    if (/^[1-9]$/.test(k)) { input(+k); e.preventDefault(); return; }
    var code = e.code || '';
    if (/^Numpad[1-9]$/.test(code)) { input(+code.slice(6)); e.preventDefault(); return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { moveSel(-1, 0); e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { moveSel(1, 0); e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { moveSel(0, -1); e.preventDefault(); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { moveSel(0, 1); e.preventDefault(); }
    else if (k === 'Backspace' || k === 'Delete' || k === '0') { erase(); e.preventDefault(); }
    else if (k === 'n' || k === 'N' || k === ' ') { setMemo(!G.memo); AU.play('tap'); e.preventDefault(); }
    else if (k === 'z' || k === 'Z' || k === 'u' || k === 'U') { undo(); e.preventDefault(); }
  });
  window.addEventListener('resize', function () { layout(); });
  window.addEventListener('pagehide', saveCur);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveCur(); last = performance.now(); });

  // ---------- 흐름 ----------
  // 시계는 화면 그리기와 따로 돈다(창이 가려져 그리기가 멈춰도 시계·저장은 맞게)
  var last = performance.now(), lastSec = -1, lastSave = 0;
  function clock() {
    var now = performance.now(), dt = Math.min(1, Math.max(0, (now - last) / 1000)); last = now;
    if (G.scene === 'play' && !G.paused && !G.cleared && !document.hidden && !openSheet) {
      G.t += dt;
      if ((G.t | 0) !== lastSec) { lastSec = G.t | 0; $('tTimeV').textContent = fmt(G.t); }
      if (now - lastSave > 5000) { lastSave = now; saveCur(); }
    }
  }
  setInterval(clock, 250);
  function step(now) {
    var anim = fx.sweeps.length || fx.crumbs.length || Object.keys(fx.write).length || Object.keys(fx.shake).length || (fx.pop && now - fx.pop < 1200);
    if (dirty || anim) { render(now); dirty = false; }
  }
  function frame() { step(performance.now()); requestAnimationFrame(frame); }

  // ---------- 영문 ----------
  if (EN) {
    document.body.classList.add('en'); document.documentElement.lang = 'en'; document.title = 'SUDOKU';
    document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); });
    $('stampT').innerHTML = 'GREAT<br>JOB';
  }

  // ---------- 시작 ----------
  makeTextures(); buildPad(); layout(); syncTogs(); setScene('title'); refreshTitle();
  var fontsReady = document.fonts ? Promise.all(['40px Kku', '40px Allim', '20px Nadeuri'].map(function (f) { return document.fonts.load(f, '스도쿠123'); })) : Promise.resolve();
  fontsReady.then(function () { layout(); }, function () {});
  requestAnimationFrame(frame);

  // ---------- 시험용 갈고리 ----------
  window.__sdk = {
    G: G, L: L, start: start, input: input, erase: erase, undo: undo, setMemo: setMemo, show: show, showEnd: showEnd, pause: pause,
    sel: function (k) { G.sel = k; dirty = true; },
    tick: function (ms) { last = performance.now() - (ms || 16); clock(); step(performance.now()); },
    render: function (ms) { dirty = true; render(performance.now() + (ms || 0)); },
    fill: function (n) { var c = 0; for (var k = 0; k < 81 && c < n; k++) if (!G.v[k]) { G.sel = k; input(G.sol[k]); c++; } },
    solveAll: function () { for (var k = 0; k < 81; k++) if (!G.v[k]) { G.sel = k; input(G.sol[k]); } },
    done: function () { return done; }, saves: function () { return saves; }, unlocked: unlocked, label: label, conflicts: conflicts, PZ: PZ
  };
  var view = qp('view'), stq = qp('stage');
  if (qp('shot')) document.body.classList.add('shot');
  if (qp('still')) { document.body.classList.add('still'); fx.still = true; }
  if (stq != null) { pick = Math.max(0, Math.min(N - 1, +stq)); refreshTitle(); }
  if (view === 'play' || view === 'clear' || view === 'pause') {
    start(pick, true);
    window.__sdk.fill(qp('fill') ? +qp('fill') : 20);
    if (view === 'clear') window.__sdk.solveAll();
    if (view === 'pause') pause(true);
  }
  if (view === 'demo') { // 보여 주기용: 연필 숫자·메모·형광펜
    start(pick, true); window.__sdk.fill(+qp('fill') || 26);
    var em = []; for (var z = 0; z < 81; z++) if (!G.v[z]) em.push(z);
    setMemo(true); [em[2], em[5], em[9]].forEach(function (k, j) { G.sel = k; [G.sol[k], (G.sol[k] % 9) + 1, ((G.sol[k] + 3) % 9) + 1].slice(0, 2 + (j % 2)).forEach(function (d) { input(d); }); }); setMemo(false);
    for (z = 0; z < 81; z++) if (!G.giv[z] && G.v[z]) { G.sel = z; break; }
    G.t = 254; updateTop(); dirty = true;
  }
  if (qp('box')) setTimeout(function () { var b = document.querySelector('#title h1').getBoundingClientRect(); document.body.setAttribute('data-box', [b.left / W, b.top / H, b.right / W, b.bottom / H].map(function (v) { return v.toFixed(3); }).join(',')); }, 800);
  if (view === 'pick') { buildPick(); show('wPick'); }
  if (view === 'end') showEnd();
})();
