/* 오목 — 15줄 판(바둑 판 그대로 줄만 늘림). 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var A = window.OMAudio, E = window.OmokEngine;

  // ── 논리 좌표: 700×700 판, 15줄(줄 간격 46) ──
  var LW = 700, LH = 700, N = E.N, SP = 46, M0 = (700 - SP * (N - 1)) / 2, SR = 21;
  var BLACK = E.BLACK, WHITE = E.WHITE, EMPTY = E.EMPTY;
  var HOSHI = [[3, 3], [11, 3], [7, 7], [3, 11], [11, 11]];
  // 급수 사다리 — 이기면 한 칸 오르고 지면 그 자리
  var RANKS = [], RANKS_EN = [], r;
  for (r = 10; r >= 1; r--) { RANKS.push(r + '급'); RANKS_EN.push(r + 'K'); }
  RANKS.push('1단'); RANKS_EN.push('1D');
  var TOP = RANKS.length - 1;

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var G = { mode: 'title', b: new E.Board(), p2: false, level: 0, human: BLACK, result: null, gid: 0, winT: 0 };
  var placeT = new Float64Array(N * N);
  var aim = null, bad = null, glow = 0, grain = [], overT = 0;

  // ── 말: ?lang=en 이면 영어 ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'GOMOKU'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }
  function rankName(L) { return (EN ? RANKS_EN : RANKS)[L]; }

  // ── 기록 — 오른 급수 ──
  function loadBest() { try { return Math.max(0, Math.min(TOP, parseInt(localStorage.getItem('omok.rank') || '0', 10) || 0)); } catch (e) { return 0; } }
  function saveBest(n) { try { localStorage.setItem('omok.rank', String(n)); } catch (e) {} }
  function showRec() { $('rec').textContent = rankName(loadBest()); }

  // ── 화면 맞추기 ──
  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var shot = document.body.classList.contains('shot');
    var top = shot ? 8 : ($('topbar').offsetHeight || 46) + 2, bottom = 8;
    var s = Math.min((w - 8) / (LW + 40), (h - top - bottom) / (LH + 40));
    if (!shot && (w - LW * s) / 2 < 70) { bottom = 56; s = Math.min((w - 8) / (LW + 40), (h - top - bottom) / (LH + 40)); }   // 옆에 전체화면 알약 자리가 없으면 아래를 비운다
    s = Math.max(0.05, s);
    view.s = s; view.ox = (w - LW * s) / 2; view.oy = top + (h - top - bottom - LH * s) / 2;
    draw();
  }
  function applyView() { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s); }
  function toLogical(px, py) { return { x: (px - view.ox) / view.s, y: (py - view.oy) / view.s }; }

  function gp(i) { return M0 + i * SP; }
  function P(x, y) { return y * N + x; }
  function PX(p) { return p % N; }
  function PY(p) { return (p / N) | 0; }
  var VT = null;   // 영상 촬영용 가짜 시계
  function now() { return VT != null ? VT : performance.now() / 1000; }

  // ── 진행 ──
  function humanTurn() { return G.mode === 'play' && (G.p2 || G.b.turn === G.human); }
  function titleBoard() {
    var b = G.b, mv = [[1, 1], [2, 2], [13, 2], [12, 3], [1, 12], [2, 12], [3, 13], [13, 12], [12, 13], [13, 13], [1, 7], [13, 7]], k;   // 제목 자리는 비운다
    b.reset(); placeT.fill(-9);
    for (k = 0; k < mv.length; k++) b.play(P(mv[k][0], mv[k][1]));
    b.last = -1; b.win = null;
  }
  function start(level) {
    G.gid++; G.level = level; G.b.reset(); placeT.fill(-9); G.result = null; aim = null;
    clearTimeout(overT);
    G.mode = 'play'; $('title').classList.add('hide'); $('over').classList.remove('show'); document.body.classList.add('playing');
    updHud(); A.stone();
    if (window.OG) OG.start();   // 집계: 한 판 시작
  }
  function doMove(p) {
    var b = G.b, col = b.turn, opp = 3 - col, human = G.p2 || col === G.human;
    var blocked = human && b.fiveCells(opp).indexOf(p) >= 0;   // 상대 넉을 막았다
    var won = b.play(p);
    placeT[p] = now(); A.stone();
    if (won) {
      G.mode = 'wait'; G.winT = now(); aim = null; G.result = { winner: col };
      A.five(); updHud();
      overT = setTimeout(showOver, 1500);
      return;
    }
    if (b.full()) { G.mode = 'wait'; G.result = { winner: 0 }; A.draw(); updHud(); overT = setTimeout(showOver, 900); return; }
    if (human) {
      var threats = b.fiveCells(col).length;
      if (threats >= 2) { flash('GREAT'); A.nice(3); }
      else if (blocked) { flash('NICE'); A.nice(1); }
    }
    updHud();
    if (!G.p2 && b.turn !== G.human) { G.mode = 'think'; var id = G.gid; setTimeout(function () { if (id === G.gid) aiThink(); }, 200); updHud(); }
  }

  // ── 상대: 급수가 오를수록 깊이 읽는다. 한 깊이씩 쪼개 화면이 멈추지 않게 ──
  function aiThink() {
    if (G.mode !== 'think') return;
    var id = G.gid, th = new E.Think(G.b, G.level), t0 = performance.now();
    (function slice() {
      if (id !== G.gid || G.mode !== 'think') return;
      if (!th.step()) { setTimeout(slice, 0); return; }
      var wait = Math.max(0, 380 - (performance.now() - t0));   // 너무 빨리 두면 정신없다
      setTimeout(function () {
        if (id !== G.gid || G.mode !== 'think') return;
        G.mode = 'play';
        if (th.move < 0 || !G.b.legal(th.move, G.b.turn)) { G.mode = 'wait'; G.result = { winner: G.human }; overT = setTimeout(showOver, 600); return; }
        doMove(th.move);
      }, wait);
    })();
  }

  function showOver() {
    clearTimeout(overT);
    if (G.mode === 'over' || !G.result) return;
    G.mode = 'over'; document.body.classList.remove('playing'); aim = null;
    var w = G.result.winner, big = $('ores'), btn = $('btnRetry'), rec = $('orec');
    rec.textContent = '';
    if (w === 0) {
      $('oh').textContent = G.p2 ? '' : rankName(G.level); big.textContent = 'DRAW'; big.className = 'res p2'; btn.textContent = 'RETRY'; A.draw();
    } else if (G.p2) {
      $('oh').textContent = 'WINNER'; big.textContent = w === BLACK ? 'BLACK' : 'WHITE'; big.className = 'res p2'; btn.textContent = 'RETRY'; A.win();
    } else if (w === G.human) {
      $('oh').textContent = rankName(G.level); big.textContent = 'CLEAR'; big.className = 'res win'; A.win();
      if (G.level < TOP) {
        btn.textContent = 'NEXT'; rec.textContent = '▲ ' + rankName(G.level + 1);
        if (G.level + 1 > loadBest()) saveBest(G.level + 1);
      } else btn.textContent = 'RETRY';
    } else {
      $('oh').textContent = rankName(G.level); big.textContent = 'GAME OVER'; big.className = 'res lose'; btn.textContent = 'RETRY'; A.lose();
    }
    $('over').classList.add('show');
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === G.human ? 'clear' : w === 0 ? 'draw' : 'lose'), stage: G.level + 1 });
  }

  var flashT = 0;
  function flash(txt, cls) { var el = $('flash'); el.textContent = txt; el.className = cls || ''; void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 900); }

  // ── HUD ──
  function updHud() {
    var b = G.b, live = G.mode === 'play' || G.mode === 'think';
    $('tmB').classList.toggle('on', live && b.turn === BLACK); $('tmW').classList.toggle('on', live && b.turn === WHITE);
    $('tmW').classList.toggle('think', G.mode === 'think');
    $('rank').textContent = rankName(G.level); $('rank').style.display = G.p2 ? 'none' : '';
    $('lbB').textContent = G.p2 ? '1P' : 'YOU'; $('lbW').textContent = G.p2 ? '2P' : '';
  }
  function syncTog() { $('tgSnd').classList.toggle('off', !A.snd); }

  // ── 그리기 ──
  (function mkGrain() { var i; for (i = 0; i < 26; i++) grain.push({ y: Math.random() * LH, a: 0.03 + Math.random() * 0.05, w: 1 + Math.random() * 2, k: Math.random() * 6, f: 0.004 + Math.random() * 0.006 }); })();
  function draw() {
    var W = view.w, H = view.h, i, x, y, p, b = G.b, t = now();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    var wg = ctx.createLinearGradient(0, 0, W, H); wg.addColorStop(0, '#3d2a1b'); wg.addColorStop(1, '#221509');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    applyView();
    // 판 — 바둑 판 그대로
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-4, 10, LW + 8, LH + 18);
    ctx.fillStyle = '#9c6f36'; ctx.fillRect(0, 0, LW, LH + 14);
    var bg = ctx.createLinearGradient(0, 0, LW, LH); bg.addColorStop(0, '#edc87e'); bg.addColorStop(1, '#d9ad62');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, LW, LH);
    ctx.lineCap = 'round';
    for (i = 0; i < grain.length; i++) { var g = grain[i], gx; ctx.strokeStyle = 'rgba(90,50,10,' + g.a + ')'; ctx.lineWidth = g.w; ctx.beginPath(); for (gx = 0; gx <= LW; gx += 20) { var yy = g.y + Math.sin(gx * g.f + g.k) * 9; if (gx === 0) ctx.moveTo(gx, yy); else ctx.lineTo(gx, yy); } ctx.stroke(); }
    ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 1.5;
    for (i = 0; i < N; i++) { line(gp(i), gp(0), gp(i), gp(N - 1)); line(gp(0), gp(i), gp(N - 1), gp(i)); }
    ctx.lineWidth = 3; ctx.strokeRect(gp(0), gp(0), SP * (N - 1), SP * (N - 1));
    ctx.fillStyle = '#3a2810'; for (i = 0; i < HOSHI.length; i++) dot(gp(HOSHI[i][0]), gp(HOSHI[i][1]), 4.5);

    // 손가락 밑 자리 — 가로·세로 줄을 밝혀 손에 가려도 어디인지 보인다
    var my = humanTurn() && aim && aim.p >= 0;
    if (my && aim.touch) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
      line(gp(PX(aim.p)), gp(0) - 18, gp(PX(aim.p)), gp(N - 1) + 18); line(gp(0) - 18, gp(PY(aim.p)), gp(N - 1) + 18, gp(PY(aim.p)));
      ctx.restore();
    }

    // 돌
    for (p = 0; p < N * N; p++) {
      var c = b.c[p];
      if (c !== BLACK && c !== WHITE) continue;
      var age = t - placeT[p], sc = age < 0.14 ? 1.35 - 0.35 * (age / 0.14) : 1;
      drawStone(gp(PX(p)), gp(PY(p)), c, sc, 1);
    }
    // 마지막 수
    if (b.last >= 0 && b.c[b.last] !== EMPTY && G.mode !== 'title') {
      ctx.fillStyle = '#e2412f'; dot(gp(PX(b.last)), gp(PY(b.last)), 5.5);
    }
    // 다섯 줄 — 금빛 줄이 그어진다
    if (b.win && G.mode !== 'title') {
      var k = Math.min(1, (t - G.winT) / 0.35), ax = gp(PX(b.win.a)), ay = gp(PY(b.win.a)), bx = gp(PX(b.win.b)), by = gp(PY(b.win.b));
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(58,40,16,.8)'; ctx.lineWidth = 14; line(ax, ay, ax + (bx - ax) * k, ay + (by - ay) * k);
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 8; line(ax, ay, ax + (bx - ax) * k, ay + (by - ay) * k);
      ctx.restore();
    }
    // 둘 자리 미리 보기 — 3·3 자리는 붉은 ×
    if (my && b.c[aim.p] === EMPTY) {
      if (b.isDoubleThree(aim.p, b.turn)) { ctx.save(); ctx.strokeStyle = 'rgba(220,50,40,.7)'; ctx.lineWidth = 4; var qx = gp(PX(aim.p)), qy = gp(PY(aim.p)); line(qx - 10, qy - 10, qx + 10, qy + 10); line(qx + 10, qy - 10, qx - 10, qy + 10); ctx.restore(); }
      else drawStone(gp(PX(aim.p)), gp(PY(aim.p)), b.turn, 1, 0.5);
    }
    // 둘 수 없는 자리
    if (bad && t - bad.t0 < 0.4) {
      var kk = t - bad.t0, sx = Math.sin(kk * 60) * 6 * (1 - kk / 0.4);
      ctx.save(); ctx.strokeStyle = 'rgba(220,50,40,.9)'; ctx.lineWidth = 5; var ex = gp(PX(bad.p)) + sx, ey = gp(PY(bad.p));
      line(ex - 12, ey - 12, ex + 12, ey + 12); line(ex + 12, ey - 12, ex - 12, ey + 12); ctx.restore();
    }
  }
  function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function drawStone(x, y, t, sc, al) {
    var r = SR * sc, lift = (sc - 1) * 20;
    ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(x + 3 + lift, y + 4 + lift, r, 0, Math.PI * 2); ctx.fill();
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    if (t === BLACK) { g.addColorStop(0, '#6a6a6a'); g.addColorStop(0.5, '#1c1c1c'); g.addColorStop(1, '#000'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f0eee6'); g.addColorStop(1, '#bdb9ac'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = t === BLACK ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (t === BLACK ? 0.35 : 0.8) + ')'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.38, r * 0.28, r * 0.16, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ── 입력 ──
  function hit(px, py) {
    var q = toLogical(px, py), x = Math.round((q.x - M0) / SP), y = Math.round((q.y - M0) / SP);
    if (x < 0 || y < 0 || x >= N || y >= N) return -1;
    if (Math.hypot(q.x - gp(x), q.y - gp(y)) > SP * 0.62) return -1;
    return P(x, y);
  }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') document.body.classList.add('touch');
    A.init();
    if (G.mode === 'wait' && G.result) { showOver(); return; }
    if (!humanTurn()) return;
    aim = { p: hit(e.clientX, e.clientY), down: true, touch: e.pointerType !== 'mouse' };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (aim && aim.down) { aim.p = hit(e.clientX, e.clientY); return; }
    if (e.pointerType === 'mouse') aim = { p: hit(e.clientX, e.clientY), down: false, touch: false };
  });
  cv.addEventListener('pointerup', function (e) {
    if (!aim || !aim.down) return;
    var p = aim.p;
    aim = e.pointerType === 'mouse' ? { p: p, down: false, touch: false } : null;
    if (p < 0 || !humanTurn() || G.b.c[p] !== EMPTY) return;
    if (G.b.legal(p, G.b.turn)) doMove(p);
    else { bad = { p: p, t0: now() }; A.bad(); flash('3·3', 'bad'); }
  });
  cv.addEventListener('pointercancel', function () { aim = null; });
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !(aim && aim.down)) aim = null; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  $('btnStart').addEventListener('click', function () { A.init(); G.p2 = false; start(loadBest()); });
  $('btn2p').addEventListener('click', function () { A.init(); G.p2 = true; start(G.level); });
  $('btnRetry').addEventListener('click', function () {
    A.init();
    if (G.p2) start(G.level);
    else start(G.result && G.result.winner === G.human ? Math.min(TOP, G.level + 1) : G.level);
  });
  $('btnHome').addEventListener('click', function () {
    G.gid++; G.mode = 'title'; titleBoard(); $('over').classList.remove('show'); $('title').classList.remove('hide');
    document.body.classList.remove('playing'); G.level = loadBest(); showRec(); updHud();
  });
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  addEventListener('keydown', function (e) {
    if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); }
  });
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  addEventListener('resize', resize);

  var last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    glow += dt;
    if (innerWidth !== view.w || innerHeight !== view.h) resize();   // 숨은 탭에서 크기가 0 으로 잡혔다가 돌아올 때
    draw();
  }

  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');
  G.level = loadBest(); titleBoard(); syncTog(); updHud(); showRec(); resize();
  requestAnimationFrame(loop);
  // 시험용 손잡이 — 멈춘 탭에서 프레임을 손으로 돌린다
  window.__om = {
    setClock: function (t) { VT = t; }, updHud: function () { updHud(); }, setGlow: function (g) { glow = g; }, draw: draw, view: view, canvas: cv,
    setAim: function (p, touch) { aim = p >= 0 ? { p: p, down: !!touch, touch: !!touch } : null; },
    G: G, E: E, P: P, doMove: doMove, start: start, showOver: showOver, A: A,
    toScreen: function (x, y) { return { x: view.ox + gp(x) * view.s, y: view.oy + gp(y) * view.s }; },
    tick: function (n) { for (var k = 0; k < (n || 1); k++) loop(last + 16.7); }
  };
})();
