/* 바둑 — 13줄 판(알까기 판 그대로). 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var A = window.BDAudio, E = window.BadukEngine;

  // ── 논리 좌표: 700×700 판, 13줄(줄 간격 52) — 알까기와 같다 ──
  var LW = 700, LH = 700, N = 13, SP = 52, M0 = 38, SR = 24;
  var BLACK = E.BLACK, WHITE = E.WHITE, EMPTY = E.EMPTY, PASS = E.PASS, EW = E.W, SZ = E.SZ;
  var KOMI = 6.5, MAXMOVES = 400;
  var HOSHI = [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]];
  // 급수 사다리 — 이기면 한 칸 오르고 지면 그 자리
  var RANKS = [], RANKS_EN = [], r;
  for (r = 18; r >= 1; r--) { RANKS.push(r + '급'); RANKS_EN.push(r + 'K'); }
  RANKS.push('1단'); RANKS_EN.push('1D');
  var TOP = RANKS.length - 1;
  function playouts(L) { return Math.round(120 * Math.pow(1.3, L)); }   // 18급 120 → 1단 약 1만 3천

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
  var G = { mode: 'title', b: new E.Board(), p2: false, level: 0, human: BLACK, owner: null, result: null, gid: 0 };
  var placeT = new Float64Array(SZ), snap = new Uint8Array(SZ), flies = [];
  var aim = null, bad = null, glow = 0, isTouch = false, grain = [], countT = 0, clock = 0;

  // ── 말: ?lang=en 이면 영어 ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'Baduk — Go'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }
  function rankName(L) { return (EN ? RANKS_EN : RANKS)[L]; }

  // ── 기록 — 오른 급수 ──
  function loadBest() { try { return Math.max(0, Math.min(TOP, parseInt(localStorage.getItem('baduk.rank') || '0', 10) || 0)); } catch (e) { return 0; } }
  function saveBest(n) { try { localStorage.setItem('baduk.rank', String(n)); } catch (e) {} }
  function showRec() { $('rec').textContent = rankName(loadBest()); }

  // ── 화면 맞추기 ──
  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var shot = document.body.classList.contains('shot');
    var top = shot ? 8 : ($('topbar').offsetHeight || 46) + 2, bottom = 8;
    var s = Math.min((w - 8) / (LW + 40), (h - top - bottom) / (LH + 40));
    if (!shot && (w - LW * s) / 2 < 110) { bottom = 76; s = Math.min((w - 8) / (LW + 40), (h - top - bottom) / (LH + 40)); }   // 옆에 패스 단추 자리가 없으면 아래를 비운다
    s = Math.max(0.05, s);
    view.s = s; view.ox = (w - LW * s) / 2; view.oy = top + (h - top - bottom - LH * s) / 2;
    draw();
  }
  function applyView() { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s); }
  function toLogical(px, py) { return { x: (px - view.ox) / view.s, y: (py - view.oy) / view.s }; }

  function gp(i) { return M0 + i * SP; }
  function P(x, y) { return (y + 1) * EW + (x + 1); }
  function PX(p) { return p % EW - 1; }
  function PY(p) { return ((p / EW) | 0) - 1; }
  function now() { return performance.now() / 1000; }

  // ── 진행 ──
  function humanTurn() { return G.mode === 'play' && (G.p2 || G.b.turn === G.human); }
  function titleBoard() {
    var b = G.b, mv = [[2, 2], [10, 2], [10, 10], [2, 10], [2, 6], [10, 6], [9, 10], [3, 10], [1, 4], [11, 4], [11, 8], [1, 8]], k;   // 제목 자리는 비운다
    b.reset(); placeT.fill(-9); flies = []; G.owner = null;
    for (k = 0; k < mv.length; k++) b.play(P(mv[k][0], mv[k][1]));
    b.last = -1;
  }
  function start(level) {
    G.gid++; G.level = level; G.b.reset(); placeT.fill(-9); flies = []; G.owner = null; G.result = null; aim = null;
    clearTimeout(countT);
    G.mode = 'play'; $('title').classList.add('hide'); $('over').classList.remove('show'); document.body.classList.add('playing');
    updHud(); A.stone();
    if (window.OG) OG.start();   // 집계: 한 판 시작
  }
  function doMove(p) {
    var b = G.b, col = b.turn, n, x, y, q;
    snap.set(b.c);
    n = b.play(p);
    if (p === PASS) { flash('PASS', true); A.pass(); }
    else {
      placeT[p] = now(); A.stone();
      if (n > 0) {
        for (y = 0; y < N; y++) for (x = 0; x < N; x++) { q = P(x, y); if (snap[q] === 3 - col && b.c[q] === EMPTY) flies.push({ x: gp(x), y: gp(y), t: 3 - col, t0: now() + 0.1, vx: (Math.random() - 0.5) * 60 }); }
        A.capture(n); bump(col === BLACK ? 's0' : 's1');
        if (G.p2 || col === G.human) { flash(n >= 4 ? 'AMAZING' : n >= 2 ? 'GREAT' : 'NICE'); A.nice(n); }
      }
    }
    updHud();
    if (b.passes >= 2 || b.moves >= MAXMOVES) { beginCount(); return; }
    if (!G.p2 && b.turn !== G.human) { G.mode = 'think'; var id = G.gid; setTimeout(function () { if (id === G.gid) aiThink(); }, 260); updHud(); }
  }

  // ── 상대: 수백~수만 판을 끝까지 두어 보고 고른다. 급수가 오를수록 많이 본다 ──
  function aiThink() {
    if (G.mode !== 'think') return;
    var id = G.gid, L = G.level, target = playouts(L), t0 = performance.now(), maxMs = 3500;
    var s = new E.Search(G.b, KOMI);
    (function slice() {
      if (id !== G.gid || G.mode !== 'think') return;
      var t = performance.now();
      while (performance.now() - t < 14 && s.iters < target) s.run(4);
      if (s.iters < target && performance.now() - t0 < maxMs) { setTimeout(slice, 0); return; }
      var wait = Math.max(0, 420 - (performance.now() - t0));   // 너무 빨리 두면 정신없다
      setTimeout(function () { if (id === G.gid) aiDecide(s); }, wait);
    })();
  }
  function aiDecide(s) {
    if (G.mode !== 'think') return;
    var b = G.b, me = b.turn, list = s.ranked(), it = Math.max(1, s.iters), x, y, p, o, unc = 0, est = -KOMI, mine, pick;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) { p = P(x, y); o = s.own[p] / it; if (Math.abs(o) < 0.7) unc++; if (o > 0.3) est++; else if (o < -0.3) est--; }
    mine = me === BLACK ? est : -est;
    G.mode = 'play';
    if (!list.length || list[0].m === PASS) { doMove(PASS); return; }
    if (b.moves > 50 && list[0].wr < 0.08 && it >= 100) { resign(3 - me); return; }
    var oppPassed = b.passes === 1;
    if (unc === 0 || (oppPassed && (mine > 0 || unc <= 3 || b.moves > 260))) { doMove(PASS); return; }
    pick = list[0].m;
    if (G.level < 5 && Math.random() < (5 - G.level) * 0.1) {   // 낮은 급수는 가끔 엉뚱한 곳에 둔다
      var c = list.slice(0, 6).filter(function (e) { return e.n > 0 && e.m !== PASS; });
      if (c.length) pick = c[(Math.random() * c.length) | 0].m;
    }
    doMove(pick);
  }
  function resign(winner) {
    G.mode = 'wait'; G.result = { winner: winner, resign: true };
    flash('RESIGN', true); A.pass(); updHud();
    countT = setTimeout(showOver, 1200);
  }

  // ── 계가 ──
  function beginCount() {
    G.mode = 'count'; aim = null; updHud();
    var own = E.estimate(G.b, 1500, KOMI), owner = new Int8Array(SZ), sb = 0, sw = KOMI, x, y, p;
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      p = P(x, y);
      owner[p] = own[p] > 0.3 ? BLACK : own[p] < -0.3 ? WHITE : 0;
      if (owner[p] === BLACK) sb++; else if (owner[p] === WHITE) sw++;
    }
    G.owner = owner; G.result = { winner: sb > sw ? BLACK : WHITE, sb: sb, sw: sw };
    A.count();
    countT = setTimeout(showOver, 2600);
  }
  function fmt(n) { return n % 1 ? n.toFixed(1) : String(n); }
  function showOver() {
    clearTimeout(countT);
    if (G.mode === 'over' || !G.result) return;
    G.mode = 'over'; document.body.classList.remove('playing'); aim = null;
    var R = G.result, w = R.winner, big = $('ores'), btn = $('btnRetry'), rec = $('orec');
    rec.textContent = '';
    $('ocnt').innerHTML = R.resign ? '' : '<i></i>' + fmt(R.sb) + ' : ' + fmt(R.sw) + '<i class="w"></i>';
    if (G.p2) {
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
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === G.human ? 'clear' : 'lose'), stage: G.level + 1 });
  }

  var flashT = 0;
  function flash(txt, soft) { var el = $('flash'); el.textContent = txt; el.classList.toggle('soft', !!soft); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 900); }
  function bump(id) { var el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  // ── HUD ──
  function updHud() {
    var b = G.b;
    $('s0').textContent = b.cap[BLACK]; $('s1').textContent = b.cap[WHITE];
    var live = G.mode === 'play' || G.mode === 'think';
    $('tmB').classList.toggle('on', live && b.turn === BLACK); $('tmW').classList.toggle('on', live && b.turn === WHITE);
    $('tmW').classList.toggle('think', G.mode === 'think');
    $('rank').textContent = rankName(G.level); $('rank').style.display = G.p2 ? 'none' : '';
    $('lbB').textContent = G.p2 ? '1P' : 'YOU'; $('lbW').textContent = G.p2 ? '2P' : '';
    $('btnPass').disabled = !humanTurn();
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
    // 판 — 알까기 판 그대로
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-4, 10, LW + 8, LH + 18);
    ctx.fillStyle = '#9c6f36'; ctx.fillRect(0, 0, LW, LH + 14);
    var bg = ctx.createLinearGradient(0, 0, LW, LH); bg.addColorStop(0, '#edc87e'); bg.addColorStop(1, '#d9ad62');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, LW, LH);
    ctx.lineCap = 'round';
    for (i = 0; i < grain.length; i++) { var g = grain[i], gx; ctx.strokeStyle = 'rgba(90,50,10,' + g.a + ')'; ctx.lineWidth = g.w; ctx.beginPath(); for (gx = 0; gx <= LW; gx += 20) { var yy = g.y + Math.sin(gx * g.f + g.k) * 9; if (gx === 0) ctx.moveTo(gx, yy); else ctx.lineTo(gx, yy); } ctx.stroke(); }
    ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 1.6;
    for (i = 0; i < N; i++) { line(gp(i), gp(0), gp(i), gp(N - 1)); line(gp(0), gp(i), gp(N - 1), gp(i)); }
    ctx.lineWidth = 3; ctx.strokeRect(gp(0), gp(0), SP * (N - 1), SP * (N - 1));
    ctx.fillStyle = '#3a2810'; for (i = 0; i < HOSHI.length; i++) dot(gp(HOSHI[i][0]), gp(HOSHI[i][1]), 4.5);

    // 손가락 밑 자리 — 가로·세로 줄을 밝혀 손에 가려도 어디인지 보인다
    var my = humanTurn() && aim && aim.p > 0;
    if (my && aim.touch) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
      line(gp(PX(aim.p)), gp(0) - 20, gp(PX(aim.p)), gp(N - 1) + 20); line(gp(0) - 20, gp(PY(aim.p)), gp(N - 1) + 20, gp(PY(aim.p)));
      ctx.restore();
    }

    // 돌
    var cnt = G.mode === 'count' || (G.mode === 'over' && G.owner);
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      p = P(x, y); var c = b.c[p];
      if (c !== BLACK && c !== WHITE) continue;
      var dead = cnt && G.owner && G.owner[p] && G.owner[p] !== c;
      var age = t - placeT[p], sc = age < 0.14 ? 1.35 - 0.35 * (age / 0.14) : 1;
      drawStone(gp(x), gp(y), c, sc, dead ? 0.4 : 1);
    }
    // 단수 — 내 돌이 잡히기 직전이면 붉게 깜빡
    if (humanTurn()) {
      var pulse = 0.35 + 0.35 * Math.sin(glow * 7), me = b.turn;
      ctx.strokeStyle = 'rgba(235,60,40,' + pulse + ')'; ctx.lineWidth = 4;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) { p = P(x, y); if (b.c[p] === me && b.atari(b.hd[p])) { ctx.beginPath(); ctx.arc(gp(x), gp(y), SR + 5, 0, Math.PI * 2); ctx.stroke(); } }
    }
    // 마지막 수
    if (b.last > 0 && b.c[b.last] !== EMPTY && G.mode !== 'title') {
      ctx.fillStyle = '#e2412f'; dot(gp(PX(b.last)), gp(PY(b.last)), 6.5);
    }
    // 계가 — 집 표시
    if (cnt && G.owner) {
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
        p = P(x, y); var ow = G.owner[p];
        if (!ow || b.c[p] === ow) continue;
        ctx.fillStyle = ow === BLACK ? 'rgba(20,20,20,.85)' : 'rgba(250,248,240,.95)';
        ctx.strokeStyle = ow === BLACK ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.5;
        ctx.fillRect(gp(x) - 9, gp(y) - 9, 18, 18); ctx.strokeRect(gp(x) - 9, gp(y) - 9, 18, 18);
      }
    }
    // 둘 자리 미리 보기
    if (my) {
      if (b.legal(aim.p, b.turn)) drawStone(gp(PX(aim.p)), gp(PY(aim.p)), b.turn, 1, 0.5);
    }
    // 둘 수 없는 자리
    if (bad && t - bad.t0 < 0.4) {
      var k = t - bad.t0, sx = Math.sin(k * 60) * 6 * (1 - k / 0.4);
      ctx.save(); ctx.strokeStyle = 'rgba(220,50,40,.9)'; ctx.lineWidth = 5; var bx = gp(PX(bad.p)) + sx, by = gp(PY(bad.p));
      line(bx - 12, by - 12, bx + 12, by + 12); line(bx + 12, by - 12, bx - 12, by + 12); ctx.restore();
    }
    // 따낸 돌 — 튀어 올랐다 사라진다
    for (i = flies.length - 1; i >= 0; i--) {
      var f = flies[i], fa = t - f.t0;
      if (fa > 0.6) { flies.splice(i, 1); continue; }
      if (fa < 0) { drawStone(f.x, f.y, f.t, 1, 1); continue; }
      var e = fa / 0.6;
      drawStone(f.x + f.vx * e, f.y - 90 * e + 140 * e * e * 0.3, f.t, 1 + 0.4 * e, 1 - e);
    }
  }
  function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function drawStone(x, y, t, sc, al) {
    var r = SR * sc, lift = (sc - 1) * 20;
    ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(x + 3 + lift, y + 5 + lift, r, 0, Math.PI * 2); ctx.fill();
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
    if (x < 0 || y < 0 || x >= N || y >= N) return 0;
    if (Math.hypot(q.x - gp(x), q.y - gp(y)) > SP * 0.62) return 0;
    return P(x, y);
  }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { isTouch = true; document.body.classList.add('touch'); }
    A.init();
    if (G.mode === 'count') { showOver(); return; }
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
    if (!p || !humanTurn()) return;
    if (G.b.legal(p, G.b.turn)) doMove(p);
    else { bad = { p: p, t0: now() }; A.bad(); }
  });
  cv.addEventListener('pointercancel', function () { aim = null; });
  cv.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !(aim && aim.down)) aim = null; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function pass() { if (humanTurn()) doMove(PASS); }
  $('btnPass').addEventListener('click', function () { A.init(); pass(); });
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
    if (e.key === 'p' || e.key === 'P') { A.init(); pass(); }
  });
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }
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
  window.__bd = {
    G: G, E: E, P: P, doMove: doMove, start: start, beginCount: beginCount, showOver: showOver, playouts: playouts,
    toScreen: function (x, y) { return { x: view.ox + gp(x) * view.s, y: view.oy + gp(y) * view.s }; },
    tick: function (n) { for (var k = 0; k < (n || 1); k++) loop(last + 16.7); }
  };
})();
