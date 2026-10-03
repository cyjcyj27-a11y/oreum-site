/* 장기 — 화면과 진행. 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). 규칙·상대는 engine.js */
(function () {
  'use strict';
  var E = window.JanggiEngine(), A = window.JGAudio;
  var CHO = E.CHO, HAN = E.HAN, PASS = E.PASS;
  var K = E.K, C = E.C, P = E.P, M = E.M, S = E.S, AD = E.A, J = E.J;

  // ── 논리 좌표: 칸 70, 가장자리 52 → 판 664×734 ──
  var CW = 70, MX = 52, MY = 52, LW = 8 * CW + 2 * MX, LH = 9 * CW + 2 * MY;
  var RAD = [0, 33, 29, 29, 29, 29, 24, 24];
  var HANJA = { 1: ['', '楚', '漢'], 2: '車', 3: '包', 4: '馬', 5: '象', 6: '士', 7: ['', '卒', '兵'] };
  var HANGUL = { 1: ['', '초', '한'], 2: '차', 3: '포', 4: '마', 5: '상', 6: '사', 7: '졸' };
  var COL = ['', '#1b6e3a', '#b8281c'], COLD = ['', '#0d3e20', '#6e130c'];
  // 급수 사다리 — 이기면 한 칸 오르고 지면 그 자리(오목·바둑과 같은 27단계)
  var RANKS = [], RANKS_EN = [], r;
  for (r = 18; r >= 1; r--) { RANKS.push(r + '급'); RANKS_EN.push(r + 'K'); }
  for (r = 1; r <= 9; r++) { RANKS.push(r + '단'); RANKS_EN.push(r + 'D'); }
  var TOP = RANKS.length - 1, DAN = 18;

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0, port: true, trayA: null, trayH: null };
  var G = { mode: 'title', g: new E.Game(), p2: false, level: 0, human: CHO, flip: false, sel: -1, legal: [], caps: { 1: [], 2: [] }, anim: null, gid: 0, result: null, check: false, form: [0, 0], setupFor: 0 };
  var hangul = false, overT = 0, dirty = true, boardCache = null, cacheKey = '';
  try { hangul = localStorage.getItem('janggi.hj') === '1'; } catch (e) {}

  // ── 말: ?lang=en 이면 영어(기물 글자는 그대로 한자) ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'JANGGI'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }
  function rankName(L) { return (EN ? RANKS_EN : RANKS)[L]; }
  var TXT = EN ? { check: 'CHECK', esc: 'ESCAPE', bik: 'BIKJANG', pass: 'PASS', cho: 'CHO', han: 'HAN', hj: 'HAN', hjOff: '漢字' } : { check: '장군', esc: '멍군', bik: '빅장', pass: '한수쉼', cho: '초', han: '한', hj: '한글', hjOff: '漢字' };

  function loadBest() { try { return Math.max(0, Math.min(TOP, parseInt(localStorage.getItem('janggi.lv') || '0', 10) || 0)); } catch (e) { return 0; } }
  function saveBest(n) { try { localStorage.setItem('janggi.lv', String(n)); } catch (e) {} }
  function loadPick() { try { var v = localStorage.getItem('janggi.pick'); return v === null ? loadBest() : Math.max(0, Math.min(TOP, parseInt(v, 10) || 0)); } catch (e) { return loadBest(); } }
  function savePick(n) { try { localStorage.setItem('janggi.pick', String(n)); } catch (e) {} }
  function showRec() {
    $('rec').textContent = rankName(G.level);
    var b = loadBest(); $('best').textContent = b > 0 ? (EN ? 'BEST ' : '최고 ') + rankName(b) : '';
    Array.prototype.forEach.call($('rk').children, function (w, i) { w.classList.toggle('on', i === G.level); });
  }
  function setLevel(n) { n = Math.max(0, Math.min(TOP, n)); if (n === G.level) return; G.level = n; savePick(n); showRec(); updHud(); A.pick(); }
  function buildRanks() {
    var box = $('rk'); box.innerHTML = '';
    RANKS.forEach(function (_, i) {
      var w = document.createElement('span'); w.className = 'bw'; var c = document.createElement('span'); c.className = 'rc wood' + (i >= DAN ? ' d' : ''); c.textContent = rankName(i);
      w.appendChild(c); w.addEventListener('click', function () { setLevel(i); $('ranks').classList.remove('show'); }); box.appendChild(w);
    });
  }
  // ◀ ▶ 는 누르고 있으면 계속 넘어간다
  function holdStep(id, d) {
    var el = $(id), t1 = 0, t2 = 0;
    function stop() { clearTimeout(t1); clearInterval(t2); t1 = t2 = 0; }
    el.addEventListener('pointerdown', function (e) { if (G.mode !== 'title') return; e.preventDefault(); A.init(); setLevel(G.level + d); stop(); t1 = setTimeout(function () { t2 = setInterval(function () { setLevel(G.level + d); }, 110); }, 420); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { el.addEventListener(ev, stop); });
  }
  function now() { return performance.now() / 1000; }
  function label(p) { var t = p & 7, v = (hangul ? HANGUL : HANJA)[t]; return typeof v === 'string' ? v : v[p >> 3]; }

  // ── 화면 맞추기: 세로면 판 위아래에 잡은 알 칸, 가로면 판 양옆에 ──
  function resize() {
    var dpr = Math.min(/[?&]hires=1/.test(location.search) ? 3 : 2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var shot = document.body.classList.contains('shot');
    var top = shot ? 8 : ($('topbar').offsetHeight || 48) + 4, s, tray, bx, by;
    view.port = w < h * 0.98;
    if (view.port) {
      tray = Math.max(40, Math.min(58, h * 0.075));
      var bottom = shot ? 8 : 64;                                    // 아래: 한수쉼 단추·전체화면 알약 자리
      s = Math.min((w - 10) / LW, (h - top - bottom - tray * 2 - 8) / LH);
      bx = (w - LW * s) / 2; by = top + tray + 4 + (h - top - bottom - tray * 2 - 8 - LH * s) / 2;
      view.trayA = { x: bx, y: by - tray - 2, w: LW * s, h: tray };
      view.trayH = { x: bx, y: by + LH * s + 2, w: LW * s, h: tray };
    } else {
      s = Math.min((h - top - 10) / LH, (w - 2 * 120) / LW);
      bx = (w - LW * s) / 2; by = top + (h - top - 10 - LH * s) / 2;
      var side = Math.min(bx - 14, 270);
      view.trayA = { x: bx - 6 - side, y: top + 4, w: side, h: h - top - 90 };
      view.trayH = { x: bx + LW * s + 6, y: top + 4, w: side, h: h - top - 90 };
    }
    view.s = Math.max(0.05, s); view.ox = bx; view.oy = by;
    boardCache = null; dirty = true;
  }
  function applyView() { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s); }
  function toLogical(px, py) { return { x: (px - view.ox) / view.s, y: (py - view.oy) / view.s }; }
  function gx(x) { return MX + (G.flip ? 8 - x : x) * CW; }
  function gy(y) { return MY + (G.flip ? 9 - y : y) * CW; }
  function sqX(sq) { return gx(sq % 9); }
  function sqY(sq) { return gy((sq / 9) | 0); }

  // ── 그리기: 판은 한 번 그려 두고(나뭇결·줄), 알만 매번 ──
  var grain = []; (function () { for (var i = 0; i < 34; i++) grain.push({ y: Math.random() * LH, a: 0.05 + Math.random() * 0.07, w: 0.8 + Math.random() * 2.2, k: Math.random() * 6, f: 0.003 + Math.random() * 0.005, amp: 2 + Math.random() * 5 }); })();
  function octo(c, x, y, r) { c.beginPath(); for (var i = 0; i < 8; i++) { var a = Math.PI / 8 + i * Math.PI / 4; c[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); } c.closePath(); }
  function drawBoard() {
    var key = view.w + 'x' + view.h + 'x' + view.dpr;
    if (!boardCache || cacheKey !== key) {
      boardCache = document.createElement('canvas'); boardCache.width = cv.width; boardCache.height = cv.height; cacheKey = key;
      var c = boardCache.getContext('2d'), W = view.w, H = view.h, i, x, y;
      c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      // 방바닥: 짙은 호두나무, 가운데가 조금 밝다
      var wg = c.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, Math.max(W, H) * 0.75); wg.addColorStop(0, '#3a2715'); wg.addColorStop(1, '#170d05');
      c.fillStyle = wg; c.fillRect(0, 0, W, H);
      c.translate(view.ox, view.oy); c.scale(view.s, view.s);
      // 판 두께와 그림자
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-6, 12, LW + 12, LH + 20);
      c.fillStyle = '#8a5f2a'; c.fillRect(0, 0, LW, LH + 16);
      c.fillStyle = '#5a3a14'; c.fillRect(0, LH + 10, LW, 6);
      var bg = c.createLinearGradient(0, 0, LW, LH); bg.addColorStop(0, '#e9c488'); bg.addColorStop(0.5, '#dcb270'); bg.addColorStop(1, '#cfa05a');
      c.fillStyle = bg; c.fillRect(0, 0, LW, LH);
      // 나뭇결
      c.save(); c.beginPath(); c.rect(0, 0, LW, LH); c.clip();
      for (i = 0; i < grain.length; i++) {
        var g = grain[i]; c.beginPath(); c.lineWidth = g.w; c.strokeStyle = 'rgba(110,65,20,' + g.a + ')';
        for (x = 0; x <= LW; x += 8) { y = g.y + Math.sin(x * g.f + g.k) * g.amp + Math.sin(x * 0.02 + g.k * 3) * 1.2; c[x ? 'lineTo' : 'moveTo'](x, y); }
        c.stroke();
      }
      var vg = c.createRadialGradient(LW / 2, LH / 2, LW * 0.3, LW / 2, LH / 2, LW * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,30,0,.22)');
      c.fillStyle = vg; c.fillRect(0, 0, LW, LH);
      c.restore();
      // 줄
      c.strokeStyle = '#3b2612'; c.lineWidth = 2; c.lineCap = 'square';
      for (i = 0; i < 9; i++) { c.beginPath(); c.moveTo(MX + i * CW, MY); c.lineTo(MX + i * CW, MY + 9 * CW); c.stroke(); }
      for (i = 0; i < 10; i++) { c.beginPath(); c.moveTo(MX, MY + i * CW); c.lineTo(MX + 8 * CW, MY + i * CW); c.stroke(); }
      c.lineWidth = 4; c.strokeRect(MX, MY, 8 * CW, 9 * CW);
      c.lineWidth = 2;
      [0, 7].forEach(function (y0) { c.beginPath(); c.moveTo(MX + 3 * CW, MY + y0 * CW); c.lineTo(MX + 5 * CW, MY + (y0 + 2) * CW); c.moveTo(MX + 5 * CW, MY + y0 * CW); c.lineTo(MX + 3 * CW, MY + (y0 + 2) * CW); c.stroke(); });
      // 테두리 띠
      c.strokeStyle = 'rgba(90,58,20,.55)'; c.lineWidth = 3; c.strokeRect(10, 10, LW - 20, LH - 20);
      c.strokeStyle = 'rgba(255,235,190,.35)'; c.lineWidth = 1; c.strokeRect(13, 13, LW - 26, LH - 26);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(boardCache, 0, 0);
  }
  // 알 하나: 팔각 박달나무 + 테 + 음각 글씨. lift 는 들어 올린 정도(0~1)
  function drawPiece(c, x, y, p, r, lift, alpha) {
    var t = p & 7, side = p >> 3, rr = r * (1 + 0.08 * (lift || 0)), fs = (t === K ? 1.32 : 1.3) * rr;
    c.save(); if (alpha != null) c.globalAlpha = alpha;
    c.shadowColor = 'rgba(0,0,0,' + (0.38 + 0.25 * (lift || 0)) + ')'; c.shadowBlur = 5 + 10 * (lift || 0); c.shadowOffsetY = 3 + 9 * (lift || 0);
    octo(c, x, y, rr); c.fillStyle = '#5a3a14'; c.fill();
    c.shadowColor = 'transparent';
    var g = c.createLinearGradient(x - rr, y - rr, x + rr, y + rr); g.addColorStop(0, '#f8e6bc'); g.addColorStop(0.5, '#e6c383'); g.addColorStop(1, '#c9975a');
    octo(c, x, y, rr - 2.2); c.fillStyle = g; c.fill();
    octo(c, x, y, rr - 4.5); c.strokeStyle = 'rgba(255,245,215,.55)'; c.lineWidth = 1.6; c.stroke();
    octo(c, x, y, rr - 2.2); c.strokeStyle = 'rgba(60,35,10,.35)'; c.lineWidth = 1; c.stroke();
    c.font = '900 ' + fs + 'px Pieces, "Noto Serif KR", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var ty = y + rr * 0.07, lb = label(p);
    c.fillStyle = 'rgba(255,245,220,.55)'; c.fillText(lb, x, ty + 1.4);
    c.fillStyle = COLD[side]; c.fillText(lb, x - 0.6, ty - 0.8);
    c.fillStyle = COL[side]; c.fillText(lb, x, ty);
    c.restore();
  }
  // 잡은 알을 담는 알통: 짙은 호두나무 통에 안쪽은 옻칠. 세로면 판 위아래 얕은 통, 가로면 양옆 깊은 통
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawTray(tr, list, who) {
    if (!tr) return;
    var live = G.mode !== 'title' && G.mode !== 'setup';
    if (!live) return;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    var r = Math.min(22, Math.max(12, 26 * view.s)), cw = r * 2.2, pad = 8, i, n = list.length, cols, x, y, dx, dy, dw, dh;
    if (view.port) { dx = tr.x; dw = tr.w; dh = Math.min(tr.h, r * 2 + pad * 2); dy = who === HAN ? tr.y + tr.h - dh : tr.y; }
    else { dw = tr.w; cols = Math.max(1, Math.floor((dw - pad * 2) / cw)); dh = Math.min(tr.h, Math.max(cw * 2, Math.ceil(16 / cols) * cw) + pad * 2); dx = tr.x; dy = who === HAN ? tr.y : tr.y + tr.h - dh; }
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rrect(ctx, dx, dy, dw, dh, 9); ctx.fillStyle = '#3b2510'; ctx.fill();
    ctx.shadowColor = 'transparent';
    var g = ctx.createLinearGradient(dx, dy, dx, dy + dh); g.addColorStop(0, '#4e3015'); g.addColorStop(1, '#6b4420');
    rrect(ctx, dx + 5, dy + 5, dw - 10, dh - 10, 6); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke();
    rrect(ctx, dx + 1.5, dy + 1.5, dw - 3, dh - 3, 8); ctx.strokeStyle = 'rgba(255,220,160,.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    if (!n) return;
    cols = Math.max(1, Math.floor((dw - pad * 2) / cw));
    for (i = 0; i < n; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      if (view.port) { if (row > 0) break; x = dx + pad + r + col * cw; y = dy + dh / 2; }
      else if (who === HAN) { x = dx + pad + r + col * cw; y = dy + pad + r + row * cw; }
      else { x = dx + pad + r + col * cw; y = dy + dh - pad - r - row * cw; }
      drawPiece(ctx, x, y, list[i], r, 0, i === n - 1 && list.pop_t && now() - list.pop_t < 0.3 ? 0.4 + 2 * (now() - list.pop_t) : 1);
    }
  }
  function draw() {
    var g = G.g, b = g.b, i, p, t = now(), an = G.anim;
    drawBoard();
    // 잡은 알: 상대 것은 위(가로면 왼쪽), 내 것은 아래(오른쪽). 2P 면 한이 위
    var topSide = G.flip ? CHO : HAN;
    drawTray(view.trayA, G.caps[topSide], topSide === HAN ? HAN : CHO);
    drawTray(view.trayH, G.caps[3 - topSide], topSide === HAN ? CHO : HAN);
    applyView();
    var live = G.mode === 'play' || G.mode === 'think';
    // 지난 수 자리
    if (live && g.last != null && g.last !== PASS && !an) {
      var f = g.last >> 7, to = g.last & 127;
      ctx.fillStyle = 'rgba(60,35,10,.22)'; ctx.fillRect(sqX(f) - 14, sqY(f) - 14, 28, 28);
    }
    // 둘 수 있는 자리
    if (G.sel >= 0) {
      ctx.fillStyle = 'rgba(40,25,5,.33)';
      for (i = 0; i < G.legal.length; i++) {
        var m = G.legal[i]; if ((m >> 7) !== G.sel) continue;
        var q = m & 127, x = sqX(q), y = sqY(q);
        if (b[q]) { octo(ctx, x, y, RAD[b[q] & 7] + 6); ctx.strokeStyle = 'rgba(200,40,20,.85)'; ctx.lineWidth = 4; ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fill(); }
      }
    }
    for (i = 0; i < 90; i++) {
      p = b[i]; if (!p) continue;
      if (an && i === an.to) continue;
      var lift = i === G.sel ? 1 : 0, px = sqX(i), py = sqY(i);
      if (live && G.check && p === g.turn * 8 + K) {   // 장군 받은 궁
        var pulse = 0.5 + 0.5 * Math.sin(t * 7);
        ctx.beginPath(); ctx.arc(px, py, RAD[K] + 4 + pulse * 4, 0, 6.2832); ctx.strokeStyle = 'rgba(230,50,30,' + (0.45 + 0.4 * pulse) + ')'; ctx.lineWidth = 5; ctx.stroke();
      }
      drawPiece(ctx, px, py, p, RAD[p & 7], lift);
      if (live && g.last != null && g.last !== PASS && i === (g.last & 127) && !an) { octo(ctx, px, py, RAD[p & 7] + 3); ctx.strokeStyle = 'rgba(255,240,180,.75)'; ctx.lineWidth = 2.5; ctx.stroke(); }
    }
    if (an) {
      var k = Math.min(1, (t - an.t0) / an.dur), e = 1 - Math.pow(1 - k, 3), ax = sqX(an.from) + (sqX(an.to) - sqX(an.from)) * e, ay = sqY(an.from) + (sqY(an.to) - sqY(an.from)) * e;
      if (an.cap && k < 0.6) drawPiece(ctx, sqX(an.to), sqY(an.to), an.cap, RAD[an.cap & 7] * (1 - k * 0.8), 0, 1 - k / 0.6);
      drawPiece(ctx, ax, ay, an.p, RAD[an.p & 7], Math.sin(k * Math.PI) * (an.jump ? 1.6 : 0.9));
    }
    dirty = !!(G.anim || (live && G.check) || G.mode === 'think');
  }

  // ── 진행 ──
  function humanTurn() { return G.mode === 'play' && !G.g.result && (G.p2 || G.g.turn === G.human); }
  function setMode(m) { G.mode = m; updHud(); dirty = true; }
  function refreshLegal() { G.legal = G.g.result ? [] : G.g.legal(); }
  function titleBoard() { G.g.reset(0, 0); G.caps = { 1: [], 2: [] }; G.sel = -1; G.anim = null; G.check = false; G.flip = false; G.result = null; dirty = true; }

  // 시작: 차림을 고르고 둔다. 1단부터는 판마다 초·한을 번갈아 잡는다(한은 판을 돌려 보여 준다)
  function begin(level, p2) {
    G.gid++; G.level = level; G.p2 = p2; G.result = null; clearTimeout(overT); if (!p2) savePick(level);
    G.human = CHO;
    if (!p2 && level >= DAN) {
      var side = 0;
      try { side = (parseInt(localStorage.getItem('janggi.side') || '0', 10) || 0) & 1; localStorage.setItem('janggi.side', String(side ^ 1)); } catch (e) { side = G.gid & 1; }
      if (side) G.human = HAN;
    }
    G.flip = !p2 && G.human === HAN;
    G.form = [(Math.random() * 4) | 0, (Math.random() * 4) | 0];
    titleBoard(); G.flip = !p2 && G.human === HAN;
    $('title').classList.add('hide'); $('over').classList.remove('show');
    G.setupFor = p2 ? HAN : G.human;       // 2P 는 한이 먼저 차리고 초가 차린다
    showSetup();
  }
  function showSetup() {
    buildOpts(); var sd = $('setupSide');
    sd.textContent = G.p2 ? (G.setupFor === CHO ? TXT.cho : TXT.han) : ''; sd.className = 'side ' + (G.setupFor === CHO ? 'c' : 'h');
    $('setup').classList.add('show'); setMode('setup');
  }
  function pickForm(k) {
    G.form[G.setupFor === CHO ? 0 : 1] = k; A.init(); A.move();
    if (G.p2 && G.setupFor === HAN) { G.setupFor = CHO; showSetup(); return; }
    $('setup').classList.remove('show'); startGame();
  }
  function startGame() {
    G.g.reset(G.form[0], G.form[1]); G.caps = { 1: [], 2: [] }; G.sel = -1; G.anim = null; G.check = false; G.result = null;
    document.body.classList.add('playing'); refreshLegal(); setMode('play');
    if (window.OG) OG.start();
    nextTurn();
  }
  // 차례 넘김: 상대 차례면 생각하고, 사람인데 둘 수가 하나도 없으면 한수쉼
  function nextTurn() {
    var g = G.g; if (g.result) return;
    refreshLegal(); updHud();
    if (!G.p2 && g.turn !== G.human) { scheduleAI(); return; }
    if (!G.legal.length) { var id = G.gid; setTimeout(function () { if (id === G.gid && !g.result && G.mode === 'play') doPass(); }, 700); }
  }
  function callOut(ev, wasCheck) {
    if (ev.check) { flash(TXT.check, 'red'); A.check(); A.voice('janggun'); }
    else if (ev.bik) { flash(TXT.bik); A.check(); A.voice('bikjang'); }
    else if (wasCheck) { flash(TXT.esc, 'soft'); A.voice('meonggun'); }
  }
  function doMove(m) {
    var g = G.g, from = m >> 7, to = m & 127, p = g.b[from], cap = g.b[to], wasCheck = G.check;
    var ev = g.play(m);
    G.sel = -1; G.legal = [];
    G.anim = { from: from, to: to, p: p, cap: cap, t0: now(), dur: cap ? 0.27 : 0.22, jump: (p & 7) === P || (p & 7) === M || (p & 7) === S, ev: ev, wasCheck: wasCheck };
    setMode('anim');
    G.anim.timer = setTimeout(endAnim, G.anim.dur * 1000 + 20);   // 그리기(rAF)가 멈춰 있어도 진행은 멈추지 않게
  }
  function endAnim() {
    var an = G.anim; if (!an) return; var ev = an.ev; G.anim = null; clearTimeout(an.timer);
    if (an.cap) { var who = an.p >> 3; G.caps[who].push(an.cap); G.caps[who].pop_t = now(); A.capture(); } else A.move();
    G.check = ev.check; setMode('play');
    callOut(ev, an.wasCheck);
    if (ev.end) { finish(ev.end); return; }
    nextTurn();
  }
  function doPass() {
    var g = G.g; if (g.result || !g.canPass()) return;
    var ev = g.play(PASS); G.sel = -1; G.legal = []; G.check = false;
    flash(TXT.pass, 'soft'); A.pass(); setMode('play');
    if (ev.end) { finish(ev.end); return; }
    nextTurn();
  }

  // ── 상대: 일꾼(Worker)에서 읽는다. 일꾼을 못 만들면 그 자리에서 ──
  var worker = null, wid = 0;
  function makeWorker() {
    try {
      var src = 'var E=(' + window.JanggiEngine.toString() + ')();onmessage=function(e){var d=e.data;postMessage({id:d.id,m:E.think(d.st,d.level)});};';
      return new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    } catch (e) { return null; }
  }
  function scheduleAI() {
    var g = G.g, id = G.gid, t0 = performance.now();
    var st = { b: Array.prototype.slice.call(g.b), turn: g.turn, bik: g.bik, moves: G.legal.slice() };
    setMode('think');
    function done(m) {
      if (id !== G.gid || G.mode !== 'think') return;
      var wait = Math.max(0, 700 + Math.random() * 400 - (performance.now() - t0));   // 내 수 놓고 1~1.4초 뒤에 둔다
      setTimeout(function () {
        if (id !== G.gid || G.mode !== 'think') return;
        G.mode = 'play';
        if (m === PASS || !st.moves.length) { doPass(); return; }
        if (st.moves.indexOf(m) < 0) m = st.moves[0];   // 안전망
        doMove(m);
      }, wait);
    }
    setTimeout(function () {
      if (id !== G.gid || G.mode !== 'think') return;
      if (!worker) worker = makeWorker();
      if (worker) {
        var my = ++wid, got = false;
        worker.onmessage = function (e) { if (e.data && e.data.id === my && !got) { got = true; done(e.data.m); } };
        worker.onerror = function () { if (got) return; got = true; worker = null; done(E.think(st, G.level)); };
        worker.postMessage({ id: my, st: st, level: G.level });
        // 지킴이: 일꾼이 답이 없으면(file:// 등) 그 자리에서 읽는다
        setTimeout(function () { if (!got && id === G.gid && G.mode === 'think') { got = true; worker = null; done(E.think(st, G.level)); } }, 5000 + (G.level >= 18 ? 3000 : 0));
      } else done(E.think(st, G.level));
    }, 300);
  }

  function finish(end) {
    G.result = end; G.mode = 'wait'; G.sel = -1; G.legal = []; updHud(); dirty = true;
    clearTimeout(overT); overT = setTimeout(showOver, end.why === 'mate' ? 1500 : 1000);
  }
  function fmt(v) { return (Math.round(v * 10) / 10).toString(); }
  function showOver() {
    clearTimeout(overT);
    if (G.mode === 'over' || !G.result) return;
    G.mode = 'over'; document.body.classList.remove('playing'); updHud();
    var R = G.result, w = R.winner, big = $('ores'), btn = $('btnRetryT'), rec = $('orec'), pts = $('opts2');
    rec.textContent = '';
    pts.textContent = (R.why === 'pass' || R.why === 'limit') ? TXT.cho + ' ' + fmt(R.cho) + '  :  ' + TXT.han + ' ' + fmt(R.han) : '';
    if (w === 0) {
      $('oh').textContent = G.p2 ? '' : rankName(G.level); big.textContent = 'DRAW'; big.className = 'res p2'; btn.textContent = 'RETRY'; A.draw();
    } else if (G.p2) {
      $('oh').textContent = 'WINNER'; big.textContent = w === CHO ? TXT.cho : TXT.han; big.className = 'res p2'; big.style.color = w === CHO ? '#6fd39a' : '#ff8a73'; btn.textContent = 'RETRY'; A.win();
    } else if (w === G.human) {
      $('oh').textContent = rankName(G.level); big.textContent = 'CLEAR'; big.className = 'res win'; A.win();
      if (G.level < TOP) { btn.textContent = 'NEXT'; rec.textContent = '▲ ' + rankName(G.level + 1); if (G.level + 1 > loadBest()) saveBest(G.level + 1); }
      else btn.textContent = 'RETRY';
    } else {
      $('oh').textContent = rankName(G.level); big.textContent = 'GAME OVER'; big.className = 'res lose'; btn.textContent = 'RETRY'; A.lose();
    }
    if (!G.p2) big.style.color = '';
    $('over').classList.add('show');
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === G.human ? 'clear' : w === 0 ? 'draw' : 'lose'), stage: G.level + 1 });
  }

  var flashT = 0;
  function flash(txt, cls) { var el = $('flash'); el.textContent = txt; el.className = cls || ''; void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 1000); }

  // ── HUD ──
  function updHud() {
    var g = G.g, live = G.mode === 'play' || G.mode === 'think' || G.mode === 'anim';
    $('pC').textContent = fmt(g.points(CHO)); $('pH').textContent = fmt(g.points(HAN));
    $('tmC').classList.toggle('on', live && g.turn === CHO); $('tmH').classList.toggle('on', live && g.turn === HAN);
    $('tmC').classList.toggle('think', G.mode === 'think' && g.turn === CHO); $('tmH').classList.toggle('think', G.mode === 'think' && g.turn === HAN);
    $('lbC').textContent = TXT.cho; $('lbH').textContent = TXT.han;
    $('youC').classList.toggle('on', !G.p2 && G.human === CHO && G.mode !== 'title'); $('youH').classList.toggle('on', !G.p2 && G.human === HAN && G.mode !== 'title');
    $('rank').textContent = rankName(G.level); $('rank').style.display = G.p2 ? 'none' : '';
    $('btnPass').style.visibility = humanTurn() && g.canPass() ? 'visible' : 'hidden';
    $('tgHj').textContent = hangul ? TXT.hj : TXT.hjOff;
  }
  function syncTog() { $('tgSnd').classList.toggle('off', !A.snd); }

  // 차림 고르기 단추: 내 쪽에서 본 왼쪽부터 네 알(마·상)
  var iconCache = {};
  function pieceIcon(p) {
    var k = p + (hangul ? 'h' : 'j'); if (iconCache[k]) return iconCache[k];
    var c = document.createElement('canvas'); c.width = c.height = 96; var x = c.getContext('2d'); x.scale(1.5, 1.5);
    drawPiece(x, 32, 30, p, 26, 0); return (iconCache[k] = c.toDataURL());
  }
  function buildOpts() {
    var box = $('opts'); box.innerHTML = '';
    E.FORM.forEach(function (f, k) {
      var w = document.createElement('span'); w.className = 'bw'; var o = document.createElement('span'); o.className = 'opt wood';
      f.forEach(function (t, i) { var im = document.createElement('img'); im.src = pieceIcon(G.setupFor * 8 + t); im.alt = ''; o.appendChild(im); if (i === 1) { var gap = document.createElement('span'); gap.className = 'gap'; o.appendChild(gap); } });
      w.appendChild(o); w.addEventListener('click', function () { pickForm(k); }); box.appendChild(w);
    });
  }

  // ── 입력 ──
  function tap(sq) {
    var g = G.g, p = g.b[sq];
    if (G.sel >= 0) { var m = (G.sel << 7) | sq; if (G.legal.indexOf(m) >= 0) { doMove(m); return; } }
    if (p && (p >> 3) === g.turn) { if (G.sel === sq) G.sel = -1; else { G.sel = sq; A.pick(); } }
    else { if (G.sel >= 0) A.bad(); G.sel = -1; }
    dirty = true;
  }
  cv.addEventListener('pointerdown', function (e) {
    A.init(); if (e.pointerType === 'touch') document.body.classList.add('touch');
    if (!humanTurn()) return;
    var l = toLogical(e.clientX, e.clientY), fx = (l.x - MX) / CW, fy = (l.y - MY) / CW, x = Math.round(fx), y = Math.round(fy);
    if (x < 0 || x > 8 || y < 0 || y > 9 || Math.abs(fx - x) > 0.47 || Math.abs(fy - y) > 0.47) { G.sel = -1; dirty = true; return; }
    if (G.flip) { x = 8 - x; y = 9 - y; }
    tap(y * 9 + x);
  });
  function toggleHj() { hangul = !hangul; try { localStorage.setItem('janggi.hj', hangul ? '1' : '0'); } catch (e) {} iconCache = {}; updHud(); dirty = true; if (G.mode === 'setup') buildOpts(); }
  window.addEventListener('keydown', function (e) {
    if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); }
    else if (e.key === 'h' || e.key === 'H') toggleHj();
    else if ((e.key === 'p' || e.key === 'P') && humanTurn() && G.g.canPass()) doPass();
    else if (e.key === 'Escape') { G.sel = -1; dirty = true; $('ranks').classList.remove('show'); }
    else if (G.mode === 'title' && (e.key === 'ArrowLeft' || e.key === 'ArrowDown')) setLevel(G.level - 1);
    else if (G.mode === 'title' && (e.key === 'ArrowRight' || e.key === 'ArrowUp')) setLevel(G.level + 1);
  });
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  $('tgHj').addEventListener('click', toggleHj);
  $('btnStart').addEventListener('click', function () { A.init(); begin(G.level, false); });
  holdStep('lvDn', -1); holdStep('lvUp', 1);
  $('lvBtn').addEventListener('click', function () { if (G.mode !== 'title') return; A.init(); A.pick(); showRec(); $('ranks').classList.add('show'); });
  document.addEventListener('pointerdown', function (e) { if ($('ranks').classList.contains('show') && !$('ranks').contains(e.target) && !$('lvBtn').contains(e.target)) $('ranks').classList.remove('show'); });
  $('btn2p').addEventListener('click', function () { A.init(); begin(0, true); });
  $('btnPass').addEventListener('click', function () { if (humanTurn() && G.g.canPass()) doPass(); });
  $('btnResign').addEventListener('click', function () { if (G.mode === 'play' || G.mode === 'think') { A.pick(); $('confirm').classList.add('show'); } });
  $('btnNo').addEventListener('click', function () { $('confirm').classList.remove('show'); });
  $('btnYes').addEventListener('click', function () {
    $('confirm').classList.remove('show'); if (G.result || !(G.mode === 'play' || G.mode === 'think' || G.mode === 'anim')) return;
    var side = G.p2 ? G.g.turn : G.human; G.gid++; if (G.anim) clearTimeout(G.anim.timer); G.anim = null; A.move();
    finish(G.g.resign(side));
  });
  $('btnRetry').addEventListener('click', function () {
    if (G.mode !== 'over') return; A.move();
    if (G.p2) begin(0, true);
    else begin(G.result && G.result.winner === G.human && G.level < TOP ? G.level + 1 : G.level, false);
  });
  $('btnHome').addEventListener('click', function () {
    if (G.mode !== 'over') return;
    $('over').classList.remove('show'); titleBoard(); G.mode = 'title'; G.p2 = false; G.level = loadPick(); showRec(); $('title').classList.remove('hide'); updHud();
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) dirty = true; });
  if (document.fonts && document.fonts.load) { document.fonts.load('900 20px Pieces').then(function () { iconCache = {}; dirty = true; if (G.mode === 'setup') buildOpts(); }); }

  // ── 그리기 고리: 바뀐 것이 있을 때만 그린다 ──
  function loop() { if (dirty) draw(); requestAnimationFrame(loop); }
  window.__jg = { tick: function (n) { for (var i = 0; i < (n || 1); i++) draw(); }, G: G, E: E, view: view, begin: begin, pickForm: pickForm, doMove: doMove, doPass: doPass, tap: tap, finish: finish, showOver: showOver, flash: flash };

  // ── 시작 ──
  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');   // 표지 뜨기: HUD·단추 없이 판과 제목만
  buildRanks(); G.level = loadPick(); titleBoard(); showRec(); syncTog(); updHud(); resize();
  requestAnimationFrame(loop);
  // 화면 검사용: ?view=setup|play|check|over|draw 로 바로 그 화면을 띄운다
  var VIEW = (location.search.match(/[?&]view=(\w+)/) || [])[1];
  if (VIEW) setTimeout(function () {
    begin(/[?&]lv=(\d+)/.test(location.search) ? +RegExp.$1 : 0, /[?&]p2=1/.test(location.search));
    if (VIEW === 'setup') return;
    pickForm(0); G.gid++; G.mode = 'play';
    G.caps[1] = [23, 23, 20]; G.caps[2] = [15, 12]; var g = G.g; g.b[6 * 9 + 0] = 0; g.b[6 * 9 + 2] = 0; g.b[4 * 9 + 1] = 0; g.b[3 * 9 + 0] = 0; g.b[0] = 0; g.b[2 * 9 + 1] = 0; g.b[7 * 9 + 1] = 0;
    if (VIEW === 'check') { g.b[5 * 9 + 4] = 0; g.b[6 * 9 + 4] = 0; g.b[3 * 9 + 4] = 0; g.b[5 * 9 + 4] = 18; G.check = true; flash(TXT.check, 'red'); }
    if (VIEW === 'sel') { G.sel = 6 * 9 + 4; }
    refreshLegal(); updHud(); dirty = true;
    if (VIEW === 'over') { finish({ winner: 2, why: 'limit', cho: 40, han: 51.5 }); showOver(); }
    if (VIEW === 'win') { finish({ winner: 1, why: 'mate', cho: 40, han: 11.5 }); showOver(); }
    if (VIEW === 'draw') { finish({ winner: 0, why: 'bikjang', cho: 40, han: 41.5 }); showOver(); }
    if (VIEW === 'resign') { $('confirm').classList.add('show'); }
  }, 150);
})();
