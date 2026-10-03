/* 체스 — 화면과 진행. 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). 규칙·상대는 engine.js */
(function () {
  'use strict';
  var E = window.ChessEngine(), A = window.CHAudio;
  var WHITE = E.WHITE, BLACK = E.BLACK, P = E.P, N = E.N, B = E.B, R = E.R, Q = E.Q, K = E.K;

  // ── 논리 좌표: 칸 80, 테두리 40 → 판 720×720 ──
  var CW = 80, MX = 40, MY = 40, LW = 8 * CW + 2 * MX, LH = LW;
  var GLYPH = ['', '♟', '♞', '♝', '♜', '♛', '♚'];   // 폰 마 비숍 룩 퀸 킹(속이 찬 글자, 색은 코드로)
  var RANKS = [], RANKS_EN = [], r;
  for (r = 18; r >= 1; r--) { RANKS.push(r + '급'); RANKS_EN.push(r + 'K'); }
  for (r = 1; r <= 9; r++) { RANKS.push(r + '단'); RANKS_EN.push(r + 'D'); }
  var TOP = RANKS.length - 1, DAN = 18;

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0, port: true, trayA: null, trayH: null };
  var G = { mode: 'title', g: new E.Game(), p2: false, level: 0, human: WHITE, flip: false, sel: -1, legal: [], caps: { 1: [], 2: [] }, anim: null, gid: 0, result: null, check: false, pending: null };
  var overT = 0, dirty = true, boardCache = null, cacheKey = '';

  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'CHESS'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }
  function rankName(L) { return (EN ? RANKS_EN : RANKS)[L]; }
  var TXT = EN ? { check: 'CHECK', mate: 'CHECKMATE', stale: 'STALEMATE', white: 'WHITE', black: 'BLACK', why: { stalemate: 'STALEMATE', repetition: 'REPETITION', fifty: '50 MOVES', material: 'INSUFFICIENT', mate: 'CHECKMATE', resign: 'RESIGN' } }
                : { check: '체크', mate: '체크메이트', stale: '스테일메이트', white: '백', black: '흑', why: { stalemate: 'STALEMATE', repetition: 'REPETITION', fifty: '50 MOVES', material: 'INSUFFICIENT', mate: 'CHECKMATE', resign: 'RESIGN' } };

  function loadBest() { try { return Math.max(0, Math.min(TOP, parseInt(localStorage.getItem('chess.lv') || '0', 10) || 0)); } catch (e) { return 0; } }
  function saveBest(n) { try { localStorage.setItem('chess.lv', String(n)); } catch (e) {} }
  function showRec() { $('rec').textContent = rankName(loadBest()); }
  function now() { return performance.now() / 1000; }

  // ── 화면 맞추기 ──
  function resize() {
    var dpr = Math.min(/[?&]hires=1/.test(location.search) ? 3 : 2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var shot = document.body.classList.contains('shot');
    var top = shot ? 8 : ($('topbar').offsetHeight || 48) + 4, s, tray, bx, by;
    view.port = w < h * 0.98;
    if (view.port) {
      tray = Math.max(40, Math.min(58, h * 0.075));
      var bottom = shot ? 8 : 64;
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
  function colX(f) { return MX + (G.flip ? 7 - f : f) * CW + CW / 2; }
  function rowY(rk) { return MY + (G.flip ? rk : 7 - rk) * CW + CW / 2; }
  function sqX(sq) { return colX(sq & 7); }
  function sqY(sq) { return rowY(sq >> 4); }

  // ── 그리기: 판(대리석·흑단 테·황동 좌표)은 한 번 그려 두고, 말만 매번 ──
  function lcg(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function marble(c, x, y, w, h, light, rnd) {
    var g = c.createLinearGradient(x, y, x + w, y + h);
    if (light) { g.addColorStop(0, '#f1e6cf'); g.addColorStop(0.55, '#e4d6ba'); g.addColorStop(1, '#d9c9aa'); }
    else { g.addColorStop(0, '#39775a'); g.addColorStop(0.5, '#2c6248'); g.addColorStop(1, '#24533c'); }
    c.fillStyle = g; c.fillRect(x, y, w, h);
    var i, n = 2 + Math.floor(rnd() * 2);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    for (i = 0; i < n; i++) {
      c.beginPath(); c.lineWidth = 0.6 + rnd() * 1.4; c.strokeStyle = light ? 'rgba(120,98,70,' + (0.06 + rnd() * 0.08) + ')' : 'rgba(190,225,200,' + (0.05 + rnd() * 0.07) + ')';
      var x0 = x + rnd() * w, y0 = y - 10 + rnd() * 20, x1 = x + rnd() * w, y1 = y + h + 10 - rnd() * 20;
      c.moveTo(x0, y0); c.bezierCurveTo(x + rnd() * w, y + rnd() * h, x + rnd() * w, y + rnd() * h, x1, y1); c.stroke();
    }
    c.restore();
  }
  function drawBoard() {
    var key = view.w + 'x' + view.h + 'x' + view.dpr + (G.flip ? 'f' : 'n');
    if (!boardCache || cacheKey !== key) {
      boardCache = document.createElement('canvas'); boardCache.width = cv.width; boardCache.height = cv.height; cacheKey = key;
      var c = boardCache.getContext('2d'), W = view.w, H = view.h, f, rk, x, y;
      c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      var wg = c.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, Math.max(W, H) * 0.75); wg.addColorStop(0, '#2a221b'); wg.addColorStop(1, '#0f0c09');
      c.fillStyle = wg; c.fillRect(0, 0, W, H);
      c.translate(view.ox, view.oy); c.scale(view.s, view.s);
      // 흑단 테 + 두께
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(-6, 12, LW + 12, LH + 18);
      var eg = c.createLinearGradient(0, 0, 0, LH); eg.addColorStop(0, '#2b2621'); eg.addColorStop(1, '#17140f');
      c.fillStyle = eg; c.fillRect(0, 0, LW, LH + 14);
      c.fillStyle = '#0d0b09'; c.fillRect(0, LH + 8, LW, 6);
      c.strokeStyle = '#8c6f2a'; c.lineWidth = 2; c.strokeRect(5, 5, LW - 10, LH - 10);
      // 대리석 칸
      for (rk = 0; rk < 8; rk++) for (f = 0; f < 8; f++) {
        x = MX + f * CW; y = MY + rk * CW;
        var light = ((f + rk) & 1) === 0;
        marble(c, x, y, CW, CW, light, lcg(rk * 8 + f + 1));
      }
      c.strokeStyle = '#c9a24a'; c.lineWidth = 2.5; c.strokeRect(MX - 1, MY - 1, 8 * CW + 2, 8 * CW + 2);
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.strokeRect(MX - 3, MY - 3, 8 * CW + 6, 8 * CW + 6);
      // 좌표: 황동 글자
      c.fillStyle = '#c9a24a'; c.font = '700 17px Ria, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (f = 0; f < 8; f++) { var ch = 'abcdefgh'[G.flip ? 7 - f : f]; c.fillText(ch, MX + f * CW + CW / 2, LH - MY / 2 + 1); c.fillText(ch, MX + f * CW + CW / 2, MY / 2 - 1); }
      for (rk = 0; rk < 8; rk++) { var nm = String(G.flip ? rk + 1 : 8 - rk); c.fillText(nm, MX / 2, MY + rk * CW + CW / 2); c.fillText(nm, LW - MX / 2, MY + rk * CW + CW / 2); }
      // 유리 광택
      var gl = c.createLinearGradient(0, MY, LW, MY + 8 * CW); gl.addColorStop(0, 'rgba(255,255,255,.07)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,.08)');
      c.fillStyle = gl; c.fillRect(MX, MY, 8 * CW, 8 * CW);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(boardCache, 0, 0);
  }
  // 말 하나: 상아(백) 또는 흑단(흑) 광택 글자. lift 는 들어 올린 정도
  function drawPiece(c, x, y, p, size, lift, alpha) {
    var t = p & 7, side = p >> 3, fs = size * (1 + 0.08 * (lift || 0)), g;
    c.save(); if (alpha != null) c.globalAlpha = alpha;
    c.font = fs + 'px ChessG, "Segoe UI Symbol", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var ty = y + fs * 0.04;
    c.shadowColor = 'rgba(0,0,0,' + (0.45 + 0.3 * (lift || 0)) + ')'; c.shadowBlur = 4 + 10 * (lift || 0); c.shadowOffsetY = 3 + 8 * (lift || 0);
    c.fillStyle = side === WHITE ? '#2a2118' : '#0a0908'; c.fillText(GLYPH[t], x, ty);
    c.shadowColor = 'transparent';
    g = c.createLinearGradient(x - fs / 2, ty - fs / 2, x + fs / 3, ty + fs / 2);
    if (side === WHITE) { g.addColorStop(0, '#fffaf0'); g.addColorStop(0.5, '#efe4cb'); g.addColorStop(1, '#c9b995'); }
    else { g.addColorStop(0, '#5a544d'); g.addColorStop(0.45, '#25211d'); g.addColorStop(1, '#0d0b0a'); }
    c.fillStyle = g; c.fillText(GLYPH[t], x, ty);
    c.lineWidth = Math.max(1, fs * 0.022); c.strokeStyle = side === WHITE ? 'rgba(60,45,25,.9)' : 'rgba(200,185,150,.75)'; c.strokeText(GLYPH[t], x, ty);
    c.restore();
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  // 잡은 말 받침: 흑단 받침에 황동 테. 옆에 점수 차(+3)
  function drawTray(tr, list, who) {
    if (!tr) return;
    var live = G.mode !== 'title'; if (!live) return;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    var sz = Math.min(34, Math.max(18, 44 * view.s)), cw = sz * 0.78, pad = 8, i, n = list.length, cols, x, y, dx, dy, dw, dh;
    if (view.port) { dx = tr.x; dw = tr.w; dh = Math.min(tr.h, sz + pad * 2); dy = who === BLACK ? tr.y + tr.h - dh : tr.y; }
    else { dw = tr.w; cols = Math.max(1, Math.floor((dw - pad * 2) / cw)); dh = Math.min(tr.h, Math.max(cw * 2, Math.ceil(16 / cols) * sz) + pad * 2); dx = tr.x; dy = who === BLACK ? tr.y : tr.y + tr.h - dh; }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    rrect(ctx, dx, dy, dw, dh, 7); ctx.fillStyle = '#17140f'; ctx.fill(); ctx.shadowColor = 'transparent';
    rrect(ctx, dx + 2, dy + 2, dw - 4, dh - 4, 6); ctx.strokeStyle = '#8c6f2a'; ctx.lineWidth = 2; ctx.stroke();
    var fg = ctx.createLinearGradient(dx, dy, dx, dy + dh); fg.addColorStop(0, '#2d6b3e'); fg.addColorStop(1, '#245630');
    rrect(ctx, dx + 5, dy + 5, dw - 10, dh - 10, 4); ctx.fillStyle = fg; ctx.fill();
    ctx.restore();
    // 점수 차: 이 받침 주인이 앞서면 +n
    var diff = G.g.material(who) - G.g.material(3 - who);
    if (diff > 0) { ctx.fillStyle = '#f3e9c9'; ctx.font = '700 ' + Math.round(sz * 0.5) + 'px Ria, Arial'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('+' + Math.round(diff / 100), dx + dw - pad - 2, view.port ? dy + dh / 2 : dy + dh - pad - sz * 0.4); }
    if (!n) return;
    cols = Math.max(1, Math.floor((dw - pad * 2 - sz) / cw));
    for (i = 0; i < n; i++) {
      var col = i % cols, row = Math.floor(i / cols);
      if (view.port) { if (row > 0) break; x = dx + pad + sz / 2 + col * cw; y = dy + dh / 2; }
      else if (who === BLACK) { x = dx + pad + sz / 2 + col * cw; y = dy + pad + sz / 2 + row * sz; }
      else { x = dx + pad + sz / 2 + col * cw; y = dy + dh - pad - sz / 2 - row * sz; }
      drawPiece(ctx, x, y, list[i], sz, 0, i === n - 1 && list.pop_t && now() - list.pop_t < 0.3 ? 0.4 + 2 * (now() - list.pop_t) : 1);
    }
  }
  function sqFill(sq, color) { ctx.fillStyle = color; ctx.fillRect(sqX(sq) - CW / 2, sqY(sq) - CW / 2, CW, CW); }
  function draw() {
    var g = G.g, st = g.st, b = st.b, i, p, t = now(), an = G.anim;
    if (!cv.width || !cv.height) return;   // 숨은 탭(크기 0)에서는 그리지 않는다
    drawBoard();
    var topSide = G.flip ? WHITE : BLACK;   // 위 받침 = 위에 앉은 쪽이 잡은 말
    drawTray(view.trayA, G.caps[topSide], topSide);
    drawTray(view.trayH, G.caps[3 - topSide], 3 - topSide);
    applyView();
    var live = G.mode === 'play' || G.mode === 'think' || G.mode === 'anim';
    if (live && g.last >= 0) { sqFill(E.mFrom(g.last), 'rgba(255,215,90,.30)'); sqFill(E.mTo(g.last), 'rgba(255,215,90,.30)'); }
    if (G.sel >= 0) sqFill(G.sel, 'rgba(255,200,60,.42)');
    if (live && G.check) {   // 체크 받은 킹: 붉은 빛
      var ks = st.ks[st.turn], pulse = 0.5 + 0.5 * Math.sin(t * 7), rg = ctx.createRadialGradient(sqX(ks), sqY(ks), 6, sqX(ks), sqY(ks), CW * 0.75);
      rg.addColorStop(0, 'rgba(230,50,30,' + (0.55 + 0.3 * pulse) + ')'); rg.addColorStop(1, 'rgba(230,50,30,0)');
      ctx.fillStyle = rg; ctx.fillRect(sqX(ks) - CW / 2, sqY(ks) - CW / 2, CW, CW);
    }
    if (G.sel >= 0) {
      for (i = 0; i < G.legal.length; i++) {
        var m = G.legal[i]; if (E.mFrom(m) !== G.sel) continue;
        var q = E.mTo(m), x = sqX(q), y = sqY(q);
        if (b[q] || (m & E.F_EP)) { ctx.beginPath(); ctx.arc(x, y, CW * 0.44, 0, 6.2832); ctx.strokeStyle = 'rgba(200,40,20,.8)'; ctx.lineWidth = 5; ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.2832); ctx.fillStyle = 'rgba(20,15,5,.38)'; ctx.fill(); }
      }
    }
    for (i = 0; i < 128; i++) {
      if (i & 0x88) { i += 7; continue; }
      p = b[i]; if (!p) continue;
      if (an && (i === an.to || (an.rookTo >= 0 && i === an.rookTo))) continue;
      drawPiece(ctx, sqX(i), sqY(i), p, CW * 0.86, i === G.sel ? 1 : 0);
    }
    if (an) {
      var k = Math.min(1, (t - an.t0) / an.dur), e = 1 - Math.pow(1 - k, 3);
      if (an.cap && k < 0.6) drawPiece(ctx, sqX(an.capSq), sqY(an.capSq), an.cap, CW * 0.86 * (1 - k * 0.6), 0, 1 - k / 0.6);
      if (an.rookTo >= 0) drawPiece(ctx, sqX(an.rookFrom) + (sqX(an.rookTo) - sqX(an.rookFrom)) * e, sqY(an.rookTo), an.rook, CW * 0.86, Math.sin(k * Math.PI) * 0.5);
      drawPiece(ctx, sqX(an.from) + (sqX(an.to) - sqX(an.from)) * e, sqY(an.from) + (sqY(an.to) - sqY(an.from)) * e, an.p, CW * 0.86, Math.sin(k * Math.PI) * ((an.p & 7) === N ? 1.5 : 0.8));
    }
    dirty = !!(G.anim || (live && G.check) || G.mode === 'think');
  }

  // ── 진행 ──
  function humanTurn() { return G.mode === 'play' && !G.g.result && (G.p2 || G.g.st.turn === G.human); }
  function setMode(m) { G.mode = m; updHud(); dirty = true; }
  function refreshLegal() { G.legal = G.g.result ? [] : G.g.legal(); }
  function titleBoard() { G.g.reset(); G.caps = { 1: [], 2: [] }; G.sel = -1; G.anim = null; G.check = false; G.flip = false; G.result = null; boardCache = null; dirty = true; }

  // 시작. 1단부터는 판마다 백·흑을 번갈아(흑이면 판을 돌려 보여 준다)
  function begin(level, p2) {
    G.gid++; G.level = level; G.p2 = p2; G.result = null; clearTimeout(overT);
    G.human = WHITE;
    if (!p2 && level >= DAN) {
      var side = 0;
      try { side = (parseInt(localStorage.getItem('chess.side') || '0', 10) || 0) & 1; localStorage.setItem('chess.side', String(side ^ 1)); } catch (e) { side = G.gid & 1; }
      if (side) G.human = BLACK;
    }
    titleBoard(); G.flip = !p2 && G.human === BLACK; boardCache = null;
    $('title').classList.add('hide'); $('over').classList.remove('show');
    document.body.classList.add('playing'); refreshLegal(); setMode('play'); A.init(); A.move();
    if (window.OG) OG.start();
    nextTurn();
  }
  function nextTurn() {
    var g = G.g; if (g.result) return;
    refreshLegal(); updHud();
    if (!G.p2 && g.st.turn !== G.human) scheduleAI();
  }
  function callOut(ev) {
    if (ev.end && ev.end.why === 'mate') { flash(TXT.mate, 'red'); A.check(); A.voice('mate'); }
    else if (ev.end && ev.end.why === 'stalemate') { flash(TXT.stale, 'soft'); }
    else if (ev.check) { flash(TXT.check, 'red'); A.check(); A.voice('check'); }
  }
  function doMove(m) {
    var g = G.g, st = g.st, from = E.mFrom(m), to = E.mTo(m), p = st.b[from], castle = !!(m & E.F_CASTLE);
    var ev = g.play(m);
    G.sel = -1; G.legal = [];
    G.anim = { from: from, to: to, p: ev.promo ? (p >> 3) * 8 + ev.promo : p, cap: ev.cap, capSq: ev.capSq, t0: now(), dur: ev.cap ? 0.27 : 0.22, ev: ev, rookTo: -1, rookFrom: -1, rook: 0 };
    if (castle) { G.anim.rookFrom = to > from ? to + 1 : to - 2; G.anim.rookTo = to > from ? to - 1 : to + 1; G.anim.rook = st.b[G.anim.rookTo]; }
    setMode('anim');
    G.anim.timer = setTimeout(endAnim, G.anim.dur * 1000 + 20);
  }
  function endAnim() {
    var an = G.anim; if (!an) return; var ev = an.ev; G.anim = null; clearTimeout(an.timer);
    if (an.cap) { var who = an.p >> 3; G.caps[who].push(an.cap); G.caps[who].pop_t = now(); A.capture(); } else if (ev.castle) A.castle(); else A.move();
    if (ev.promo) A.promo();
    G.check = ev.check; setMode('play');
    callOut(ev);
    if (ev.end) { finish(ev.end); return; }
    nextTurn();
  }

  // ── 상대: 일꾼(Worker)에서 읽는다. 일꾼을 못 만들거나 답이 없으면 그 자리에서 ──
  var worker = null, wid = 0;
  function makeWorker() {
    try {
      var src = 'var E=(' + window.ChessEngine.toString() + ')();onmessage=function(e){var d=e.data;postMessage({id:d.id,m:E.think(d.fen,d.moves,d.level)});};';
      return new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
    } catch (e) { return null; }
  }
  function scheduleAI() {
    var g = G.g, id = G.gid, t0 = performance.now(), fen = g.fen(), moves = G.legal.slice();
    setMode('think');
    function done(m) {
      if (id !== G.gid || G.mode !== 'think') return;
      var wait = Math.max(0, 700 + Math.random() * 400 - (performance.now() - t0));   // 내 수 놓고 1~1.4초 뒤에 둔다
      setTimeout(function () {
        if (id !== G.gid || G.mode !== 'think') return;
        G.mode = 'play';
        if (moves.indexOf(m) < 0) m = moves[0];   // 안전망
        doMove(m);
      }, wait);
    }
    setTimeout(function () {
      if (id !== G.gid || G.mode !== 'think') return;
      if (!worker) worker = makeWorker();
      if (worker) {
        var my = ++wid, got = false;
        worker.onmessage = function (e) { if (e.data && e.data.id === my && !got) { got = true; done(e.data.m); } };
        worker.onerror = function () { if (got) return; got = true; worker = null; done(E.think(fen, moves, G.level)); };
        worker.postMessage({ id: my, fen: fen, moves: moves, level: G.level });
        setTimeout(function () { if (!got && id === G.gid && G.mode === 'think') { got = true; worker = null; done(E.think(fen, moves, G.level)); } }, 5000 + (G.level >= 18 ? 3000 : 0));
      } else done(E.think(fen, moves, G.level));
    }, 300);
  }

  function finish(end) {
    G.result = end; G.mode = 'wait'; G.sel = -1; G.legal = []; updHud(); dirty = true;
    clearTimeout(overT); overT = setTimeout(showOver, end.why === 'mate' ? 1600 : 1000);
  }
  function showOver() {
    clearTimeout(overT);
    if (G.mode === 'over' || !G.result) return;
    G.mode = 'over'; document.body.classList.remove('playing'); updHud();
    var Rz = G.result, w = Rz.winner, big = $('ores'), btn = $('btnRetryT'), rec = $('orec'), why = $('owhy');
    rec.textContent = ''; why.textContent = w === 0 ? (TXT.why[Rz.why] || '') : (Rz.why === 'mate' ? TXT.why.mate : Rz.why === 'resign' ? TXT.why.resign : '');
    if (w === 0) { $('oh').textContent = G.p2 ? '' : rankName(G.level); big.textContent = 'DRAW'; big.className = 'res p2'; btn.textContent = 'RETRY'; A.draw(); }
    else if (G.p2) { $('oh').textContent = 'WINNER'; big.textContent = w === WHITE ? TXT.white : TXT.black; big.className = 'res p2'; btn.textContent = 'RETRY'; A.win(); }
    else if (w === G.human) {
      $('oh').textContent = rankName(G.level); big.textContent = 'CLEAR'; big.className = 'res win'; A.win();
      if (G.level < TOP) { btn.textContent = 'NEXT'; rec.textContent = '▲ ' + rankName(G.level + 1); if (G.level + 1 > loadBest()) saveBest(G.level + 1); }
      else btn.textContent = 'RETRY';
    } else { $('oh').textContent = rankName(G.level); big.textContent = 'GAME OVER'; big.className = 'res lose'; btn.textContent = 'RETRY'; A.lose(); }
    $('over').classList.add('show');
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === G.human ? 'clear' : w === 0 ? 'draw' : 'lose'), stage: G.level + 1 });
  }
  var flashT = 0;
  function flash(txt, cls) { var el = $('flash'); el.textContent = txt; el.className = cls || ''; void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 1000); }

  // ── HUD ──
  function updHud() {
    var g = G.g, live = G.mode === 'play' || G.mode === 'think' || G.mode === 'anim', turn = g.st.turn;
    $('tmW').classList.toggle('on', live && turn === WHITE); $('tmB').classList.toggle('on', live && turn === BLACK);
    $('tmW').classList.toggle('think', G.mode === 'think' && turn === WHITE); $('tmB').classList.toggle('think', G.mode === 'think' && turn === BLACK);
    $('lbW').textContent = TXT.white; $('lbB').textContent = TXT.black;
    $('youW').classList.toggle('on', !G.p2 && G.human === WHITE && G.mode !== 'title'); $('youB').classList.toggle('on', !G.p2 && G.human === BLACK && G.mode !== 'title');
    $('rank').textContent = rankName(G.level); $('rank').style.display = G.p2 ? 'none' : '';
  }
  function syncTog() { $('tgSnd').classList.toggle('off', !A.snd); }

  // 승격 고르기: 퀸 룩 비숍 마
  var iconCache = {};
  function pieceIcon(p) {
    if (iconCache[p]) return iconCache[p];
    var c = document.createElement('canvas'); c.width = c.height = 120; var x = c.getContext('2d');
    drawPiece(x, 60, 58, p, 92, 0); return (iconCache[p] = c.toDataURL());
  }
  function askPromo(from, to) {
    var box = $('proOpts'); box.innerHTML = ''; var side = G.g.st.turn;
    [Q, R, B, N].forEach(function (t) {
      var w = document.createElement('span'); w.className = 'bw'; var o = document.createElement('span'); o.className = 'opt ebony';
      var im = document.createElement('img'); im.src = pieceIcon(side * 8 + t); im.alt = ''; o.appendChild(im); w.appendChild(o);
      w.addEventListener('click', function () {
        $('promo').classList.remove('show');
        for (var i = 0; i < G.legal.length; i++) { var m = G.legal[i]; if (E.mFrom(m) === from && E.mTo(m) === to && E.mPromo(m) === t) { doMove(m); return; } }
      });
      box.appendChild(w);
    });
    $('promo').classList.add('show');
  }

  // ── 입력 ──
  function tap(sq) {
    var g = G.g, p = g.st.b[sq], i, m, hit = -1, promo = false;
    if (G.sel >= 0) {
      for (i = 0; i < G.legal.length; i++) { m = G.legal[i]; if (E.mFrom(m) === G.sel && E.mTo(m) === sq) { hit = m; if (E.mPromo(m)) promo = true; } }
      if (hit >= 0) { if (promo) { A.pick(); askPromo(G.sel, sq); return; } doMove(hit); return; }
    }
    if (p && (p >> 3) === g.st.turn) { if (G.sel === sq) G.sel = -1; else { G.sel = sq; A.pick(); } }
    else { if (G.sel >= 0) A.bad(); G.sel = -1; }
    dirty = true;
  }
  cv.addEventListener('pointerdown', function (e) {
    A.init(); if (e.pointerType === 'touch') document.body.classList.add('touch');
    if (!humanTurn() || $('promo').classList.contains('show')) return;
    var l = toLogical(e.clientX, e.clientY), f = Math.floor((l.x - MX) / CW), rr = Math.floor((l.y - MY) / CW);
    if (f < 0 || f > 7 || rr < 0 || rr > 7) { G.sel = -1; dirty = true; return; }
    if (G.flip) { f = 7 - f; } else { rr = 7 - rr; }
    tap(rr * 16 + f);
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); }
    else if (e.key === 'Escape') { G.sel = -1; dirty = true; }
  });
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  $('btnStart').addEventListener('click', function () { A.init(); begin(loadBest(), false); });
  $('btn2p').addEventListener('click', function () { A.init(); begin(0, true); });
  $('btnResign').addEventListener('click', function () { if (G.mode === 'play' || G.mode === 'think') { A.pick(); $('confirm').classList.add('show'); } });
  $('btnNo').addEventListener('click', function () { $('confirm').classList.remove('show'); });
  $('btnYes').addEventListener('click', function () {
    $('confirm').classList.remove('show'); if (G.result || !(G.mode === 'play' || G.mode === 'think' || G.mode === 'anim')) return;
    var side = G.p2 ? G.g.st.turn : G.human; G.gid++; if (G.anim) clearTimeout(G.anim.timer); G.anim = null; A.move();
    finish(G.g.resign(side));
  });
  $('btnRetry').addEventListener('click', function () {
    if (G.mode !== 'over') return; A.move();
    if (G.p2) begin(0, true);
    else begin(G.result && G.result.winner === G.human && G.level < TOP ? G.level + 1 : G.level, false);
  });
  $('btnHome').addEventListener('click', function () {
    if (G.mode !== 'over') return;
    $('over').classList.remove('show'); titleBoard(); G.mode = 'title'; G.p2 = false; G.level = loadBest(); showRec(); $('title').classList.remove('hide'); updHud();
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) dirty = true; });
  if (document.fonts && document.fonts.load) { document.fonts.load('40px ChessG').then(function () { iconCache = {}; dirty = true; }); }

  function loop() { if (dirty) draw(); requestAnimationFrame(loop); }
  window.__ch = { tick: function (n) { for (var i = 0; i < (n || 1); i++) draw(); }, G: G, E: E, view: view, begin: begin, doMove: doMove, tap: tap, finish: finish, showOver: showOver, flash: flash, askPromo: askPromo };

  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');
  G.level = loadBest(); titleBoard(); showRec(); syncTog(); updHud(); resize();
  requestAnimationFrame(loop);
  // 화면 검사용: ?view=sel|check|over|win|draw|promo|resign
  var VIEW = (location.search.match(/[?&]view=(\w+)/) || [])[1];
  if (VIEW) setTimeout(function () {
    begin(/[?&]lv=(\d+)/.test(location.search) ? +RegExp.$1 : 0, /[?&]p2=1/.test(location.search));
    G.gid++; G.mode = 'play';
    var g = G.g; g.reset('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4'); G.caps[1] = [17, 18]; G.caps[2] = [9];
    if (VIEW === 'check') { g.reset('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'); G.check = true; flash(TXT.check, 'red'); }
    if (VIEW === 'sel') G.sel = 6 * 16 + 4;
    refreshLegal(); updHud(); dirty = true;
    if (VIEW === 'over') { finish({ winner: 2, why: 'mate' }); showOver(); }
    if (VIEW === 'win') { finish({ winner: 1, why: 'mate' }); showOver(); }
    if (VIEW === 'draw') { finish({ winner: 0, why: 'stalemate' }); showOver(); }
    if (VIEW === 'promo') askPromo(6 * 16 + 4, 7 * 16 + 4);
    if (VIEW === 'resign') $('confirm').classList.add('show');
  }, 150);
})();
