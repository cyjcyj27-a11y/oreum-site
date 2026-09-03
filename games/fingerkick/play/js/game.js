/* 핑거킥 — 말을 튕겨 공을 맞히는 탁상 축구. 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var A = window.FKAudio;

  // ── 논리 좌표 (세로 경기장). 가로 화면이면 90도 돌려 그린다 ──
  var LW = 700, LH = 1100, X0 = 50, X1 = 650, Y0 = 100, Y1 = 1000, CX = 350, CY = 550;
  var GX0 = 270, GX1 = 430, GD = 52, POST = 6;
  var DR = 22, GKR = 26, BR = 11, DM = 15, BM = 1, GKM = 30, DFR = 0.98, BFR = 0.988;   // 골키퍼는 막대에 꽂혀 있는 셈 — 무겁게
  var SUB = 3, REST = 0.86, WALL = 0.62, SPEED = 8.5, MAXD = 170, MAXFLICK = 3, MATCH = 180;
  var HUMAN = 0, CPU = 1;
  var POSTS = [{ x: GX0, y: Y0 }, { x: GX1, y: Y0 }, { x: GX0, y: Y1 }, { x: GX1, y: Y1 }];
  var COL = [{ ring: '#ffffff', body: '#e0343c', gk: '#8f1d22' }, { ring: '#ffd23a', body: '#2a62d6', gk: '#173a86' }];

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, land: false, dpr: 1, w: 0, h: 0 };
  var G = { mode: 'title', B: [], turn: HUMAN, streak: 0, score: [0, 0], clock: MATCH, flick: null, resting: true, goalPause: 0, aiTimer: 0, lastClk: '', conceded: HUMAN };
  var drag = null, glow = 0, isTouch = false;

  // ── 전적 (브라우저에 저장) ──
  function loadRec() { try { var r = JSON.parse(localStorage.getItem('fingerkick.rec') || '{}'); return { w: r.w | 0, d: r.d | 0, l: r.l | 0 }; } catch (e) { return { w: 0, d: 0, l: 0 }; } }
  function saveRec(r) { try { localStorage.setItem('fingerkick.rec', JSON.stringify(r)); } catch (e) {} }
  function recText(r) { return (r.w + r.d + r.l) ? r.w + '승 ' + r.d + '무 ' + r.l + '패' : ''; }
  function showRec() { var t = recText(loadRec()); $('rec').textContent = t; $('rec2').textContent = t; }

  // ── 화면 맞추기 ──
  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var top = ($('topbar').offsetHeight || 46) + 2, bottom = isTouch ? 6 : 26;
    var land = w > h * 1.15; view.land = land;
    var lw = land ? LH : LW, lh = land ? LW : LH;
    var availW = w - 8, availH = h - top - bottom;
    var s = Math.max(0.05, Math.min(availW / lw, availH / lh));
    view.s = s; view.ox = (w - lw * s) / 2; view.oy = top + (availH - lh * s) / 2;
    draw();
  }
  function applyView() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s);
    if (view.land) ctx.transform(0, 1, -1, 0, LH, 0);
  }
  function toLogical(px, py) {
    var lx = (px - view.ox) / view.s, ly = (py - view.oy) / view.s;
    return view.land ? { x: ly, y: LH - lx } : { x: lx, y: ly };
  }

  // ── 말·공 ──
  function body(x, y, r, m, t, gk) { return { x: x, y: y, vx: 0, vy: 0, r: gk ? GKR : r, m: gk ? GKM : m, fr: t < 0 ? BFR : DFR, t: t, gk: !!gk }; }
  function setup(kick) {
    var B = [body(CX + (Math.random() - 0.5) * 8, CY + (Math.random() - 0.5) * 8, BR, BM, -1)];   // 외운 각도가 안 먹게 살짝 흔든다
    var F = [[350, 960, 1], [300, 935], [400, 935], [250, 660], [450, 660]];
    var i, p;
    for (i = 0; i < 5; i++) { p = F[i]; B.push(body(p[0], kick === HUMAN && i === 3 ? p[1] - 60 : p[1], DR, DM, HUMAN, p[2])); }
    if (kick === HUMAN) { B[4].x = CX; }
    for (i = 0; i < 5; i++) { p = F[i]; B.push(body(p[0], LH - (kick === CPU && i === 3 ? p[1] - 60 : p[1]), DR, DM, CPU, p[2])); }
    if (kick === CPU) { B[9].x = CX; }
    return B;
  }

  // ── 물리 ──
  function step(B, ev) {
    var moving = false, i, j, a, b;
    for (i = 0; i < B.length; i++) {
      b = B[i]; b.x += b.vx; b.y += b.vy; b.vx *= b.fr; b.vy *= b.fr;
      var sp2 = b.vx * b.vx + b.vy * b.vy;
      if (b.t >= 0 && sp2 < 6.25) { b.vx *= 0.9; b.vy *= 0.9; }   // 천 위의 말은 느려지면 금방 선다
      if (sp2 < 0.0225) { b.vx = 0; b.vy = 0; } else moving = true;
    }
    for (i = 0; i < B.length; i++) for (j = i + 1; j < B.length; j++) {
      a = B[i]; b = B[j];
      var dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 === 0) continue;
      // 골키퍼는 공에 밀리지 않는다 (막대에 꽂힌 셈). 말끼리는 질량대로
      var ma = a.gk && b.t < 0 ? 1e6 : a.m, mb = b.gk && a.t < 0 ? 1e6 : b.m;
      var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = rr - d, tm = ma + mb;
      a.x -= nx * ov * (mb / tm); a.y -= ny * ov * (mb / tm); b.x += nx * ov * (ma / tm); b.y += ny * ov * (ma / tm);
      var vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vn > 0) continue;
      var J = -(1 + REST) * vn / (1 / ma + 1 / mb);
      a.vx -= J * nx / ma; a.vy -= J * ny / ma; b.vx += J * nx / mb; b.vy += J * ny / mb;
      if (ev) ev.hit(a, b, Math.abs(J));
    }
    for (i = 0; i < B.length; i++) bounds(B[i], ev);
    return moving;
  }
  function bounds(b, ev) {
    var r = b.r, hit = 0, k;
    var inTop = b.y < Y0, inBot = b.y > Y1;
    if (inTop || inBot) {
      if (b.x < GX0 + r) { b.x = GX0 + r; b.vx = Math.abs(b.vx) * WALL; hit = 1; }
      if (b.x > GX1 - r) { b.x = GX1 - r; b.vx = -Math.abs(b.vx) * WALL; hit = 1; }
      if (inTop && b.y < Y0 - GD + r) { b.y = Y0 - GD + r; b.vy = Math.abs(b.vy) * 0.25; hit = 1; }
      if (inBot && b.y > Y1 + GD - r) { b.y = Y1 + GD - r; b.vy = -Math.abs(b.vy) * 0.25; hit = 1; }
    } else {
      if (b.x < X0 + r) { b.x = X0 + r; b.vx = Math.abs(b.vx) * WALL; hit = 1; }
      if (b.x > X1 - r) { b.x = X1 - r; b.vx = -Math.abs(b.vx) * WALL; hit = 1; }
      if (!(b.x > GX0 + r && b.x < GX1 - r)) {
        if (b.y < Y0 + r) { b.y = Y0 + r; b.vy = Math.abs(b.vy) * WALL; hit = 1; }
        if (b.y > Y1 - r) { b.y = Y1 - r; b.vy = -Math.abs(b.vy) * WALL; hit = 1; }
      }
    }
    for (k = 0; k < 4; k++) {
      var p = POSTS[k], dx = b.x - p.x, dy = b.y - p.y, rr = r + POST, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0) {
        var d = Math.sqrt(d2), nx = dx / d, ny = dy / d; b.x = p.x + nx * rr; b.y = p.y + ny * rr;
        var vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + WALL) * vn * nx; b.vy -= (1 + WALL) * vn * ny; hit = 1; }
      }
    }
    if (hit && ev) ev.wall(b);
  }
  function goalOf(ball) { return ball.y < Y0 - BR ? HUMAN : ball.y > Y1 + BR ? CPU : -1; }

  // ── 튕기기 ──
  function flick(i, ang, pow) {
    var d = G.B[i]; d.vx = Math.cos(ang) * pow * SPEED; d.vy = Math.sin(ang) * pow * SPEED;
    G.flick = { i: i, touched: false }; G.streak++; G.resting = false;
    A.flick(pow); updHud();
  }
  var EV = {
    hit: function (a, b, J) {
      if (G.flick && ((a === G.B[G.flick.i] && b === G.B[0]) || (b === G.B[G.flick.i] && a === G.B[0]))) G.flick.touched = true;
      if (J > 0.6) A.hit(J);
    },
    wall: function (b) { var s = Math.hypot(b.vx, b.vy); if (s > 1.2) A.wall(s); }
  };
  function onRest() {
    if (G.flick) {
      if (!(G.flick.touched && G.streak < MAXFLICK)) { G.turn = 1 - G.turn; G.streak = 0; }
      G.flick = null;
    }
    if (G.turn === CPU) G.aiTimer = 0.55 + Math.random() * 0.4;
    updHud();
  }

  // ── CPU ──
  function cloneB(B) { return B.map(function (b) { return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, r: b.r, m: b.m, fr: b.fr, t: b.t, gk: b.gk }; }); }
  function simulate(B, di, ang, pow) {
    var S = cloneB(B), d = S[di], touched = false, goal = -1, n;
    d.vx = Math.cos(ang) * pow * SPEED; d.vy = Math.sin(ang) * pow * SPEED;
    var ev = { hit: function (a, b) { if ((a === d && b === S[0]) || (b === d && a === S[0])) touched = true; }, wall: function () {} };
    for (n = 0; n < 720; n++) {
      var mv = step(S, ev); goal = goalOf(S[0]);
      if (goal >= 0 || !mv) break;
    }
    return { S: S, touched: touched, goal: goal, n: n };
  }
  function evalCPU(r) {
    if (r.goal === CPU) return 10000 - r.n * 0.5;
    if (r.goal === HUMAN) return -10000;
    var S = r.S, ball = S[0], sc = ball.y * 1.5, i;
    sc -= Math.hypot(ball.x - CX, ball.y - Y1) * 0.8;
    var dOwn = Math.hypot(ball.x - CX, ball.y - Y0); if (dOwn < 280) sc -= (280 - dOwn) * 2;
    if (r.touched && G.streak < MAXFLICK - 1) sc += 220;
    var nearH = 1e9, nearC = 1e9;
    for (i = 1; i <= 5; i++) nearH = Math.min(nearH, Math.hypot(S[i].x - ball.x, S[i].y - ball.y));
    for (i = 6; i <= 10; i++) nearC = Math.min(nearC, Math.hypot(S[i].x - ball.x, S[i].y - ball.y));
    sc += Math.min(nearH, 220) * 0.6 - Math.min(nearC, 300) * 0.4;
    if (S[6].y > CY - 80) sc -= 150;   // 골키퍼는 집에
    return sc + Math.random() * 40;
  }
  function aiChoose() {
    var B = G.B, ball = B[0], best = null, bs = -1e12, di, k, t, o, p;
    var targets = [[CX, Y1 + 20], [CX - 70, Y1 + 20], [CX + 70, Y1 + 20]];
    var offs = [-0.1, -0.05, 0, 0.05, 0.1], pows = [0.35, 0.55, 0.78, 1.0];
    function tryOne(i, ang, pow) { var r = simulate(B, i, ang, pow), s = evalCPU(r); if (s > bs) { bs = s; best = { i: i, ang: ang, pow: pow }; } }
    for (di = 6; di <= 10; di++) {
      var d = B[di];
      for (t = 0; t < targets.length; t++) {
        var tx = targets[t][0], ty = targets[t][1], dl = Math.hypot(tx - ball.x, ty - ball.y);
        var ux = (tx - ball.x) / dl, uy = (ty - ball.y) / dl;
        var hx = ball.x - ux * (DR + BR), hy = ball.y - uy * (DR + BR);
        var base = Math.atan2(hy - d.y, hx - d.x);
        for (o = 0; o < offs.length; o++) for (p = 0; p < pows.length; p++) tryOne(di, base + offs[o], pows[p]);
      }
      for (k = 0; k < 12; k++) { tryOne(di, k / 12 * Math.PI * 2, 0.5); tryOne(di, k / 12 * Math.PI * 2 + 0.26, 0.9); }
    }
    if (!best) return;
    flick(best.i, best.ang + (Math.random() - 0.5) * 0.03, best.pow);
  }

  // ── 진행 ──
  function goal(team) {
    G.score[team]++; G.goalPause = 2.0; G.flick = null; G.conceded = 1 - team;
    A.goal(); $('goal').classList.add('show'); updHud();
  }
  function afterGoal() {
    $('goal').classList.remove('show');
    G.B = setup(G.conceded); G.turn = G.conceded; G.streak = 0; G.flick = null; G.resting = true;
    if (G.turn === CPU) G.aiTimer = 0.8; updHud();
  }
  function start() {
    G.score = [0, 0]; G.clock = MATCH; G.B = setup(HUMAN); G.turn = HUMAN; G.streak = 0; G.flick = null; G.resting = true; G.goalPause = 0; G.aiTimer = 0;
    G.mode = 'play'; $('title').classList.add('hide'); $('over').classList.remove('show'); updHud(); A.whistle();
  }
  function fullTime() {
    G.mode = 'over'; A.whistle3();
    var h = G.score[0], c = G.score[1], r = $('res');
    r.textContent = h > c ? 'WIN' : h < c ? 'LOSE' : 'DRAW'; r.className = 'res ' + (h > c ? 'win' : h < c ? 'lose' : 'draw');
    var rec = loadRec(); if (h > c) rec.w++; else if (h < c) rec.l++; else rec.d++; saveRec(rec); showRec();
    $('osc').textContent = h + ' : ' + c;
    $('over').classList.add('show');
  }
  var last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    glow += dt;
    if (G.mode === 'play') {
      if (G.goalPause > 0) {
        G.goalPause -= dt; if (G.goalPause <= 0) afterGoal();
      } else {
        if (G.clock > 0) G.clock = Math.max(0, G.clock - dt);
        var mv = false, k;
        for (k = 0; k < SUB; k++) mv = step(G.B, EV) || mv;
        var gl = goalOf(G.B[0]);
        if (gl >= 0) { goal(gl); }
        else {
          if (!mv && !G.resting) onRest();
          G.resting = !mv;
          if (G.resting) {
            if (G.clock <= 0) fullTime();
            else if (G.turn === CPU && G.aiTimer > 0) { G.aiTimer -= dt; if (G.aiTimer <= 0) aiChoose(); }
          }
        }
      }
      updClock();
    }
    draw();
  }

  // ── HUD ──
  function updHud() {
    $('s0').textContent = G.score[0]; $('s1').textContent = G.score[1];
    $('tmH').classList.toggle('on', G.turn === HUMAN); $('tmC').classList.toggle('on', G.turn === CPU);
    var left = MAXFLICK - G.streak, s = '', i;
    for (i = 0; i < MAXFLICK; i++) s += i < left ? '●' : '○';
    var st = $('streak'); st.textContent = s; st.className = 'stat ' + (G.turn === HUMAN ? 'h' : 'c');
  }
  function updClock() {
    var c = Math.ceil(G.clock), t = Math.floor(c / 60) + ':' + (c % 60 < 10 ? '0' : '') + (c % 60);
    if (t !== G.lastClk) { G.lastClk = t; $('clk').textContent = t; $('clock').classList.toggle('low', c <= 15); }
  }
  function syncTog() {
    $('tgSnd').classList.toggle('off', !A.snd); $('tgBgm').classList.toggle('off', !A.bgm);
  }

  // ── 그리기 ──
  function draw() {
    var W = view.w, H = view.h, i;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    // 탁자
    var wg = ctx.createLinearGradient(0, 0, W, H); wg.addColorStop(0, '#4a3524'); wg.addColorStop(1, '#2c1d12');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    applyView();
    // 천
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(6, 10, LW, LH);
    ctx.fillStyle = '#23662f'; ctx.fillRect(0, 0, LW, LH);
    // 잔디 줄무늬
    var bands = 9, bh = (Y1 - Y0) / bands;
    for (i = 0; i < bands; i++) { ctx.fillStyle = i % 2 ? '#2f8a3f' : '#2a7f39'; ctx.fillRect(X0, Y0 + i * bh, X1 - X0, bh); }
    // 골대 뒤 그물
    drawNet(Y0 - GD, GD); drawNet(Y1, GD);
    // 선
    ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
    line(X0, CY, X1, CY);
    ctx.beginPath(); ctx.arc(CX, CY, 80, 0, Math.PI * 2); ctx.stroke();
    dot(CX, CY, 4);
    ctx.strokeRect(CX - 165, Y0, 330, 140); ctx.strokeRect(CX - 165, Y1 - 140, 330, 140);
    ctx.strokeRect(CX - 90, Y0, 180, 50); ctx.strokeRect(CX - 90, Y1 - 50, 180, 50);
    dot(CX, Y0 + 100, 4); dot(CX, Y1 - 100, 4);
    arc(CX, Y0 + 100, 80, 0.25 * Math.PI, 0.75 * Math.PI); arc(CX, Y1 - 100, 80, 1.25 * Math.PI, 1.75 * Math.PI);
    arc(X0, Y0, 14, 0, 0.5 * Math.PI); arc(X1, Y0, 14, 0.5 * Math.PI, Math.PI); arc(X1, Y1, 14, Math.PI, 1.5 * Math.PI); arc(X0, Y1, 14, 1.5 * Math.PI, 2 * Math.PI);
    // 골대 기둥
    for (i = 0; i < 4; i++) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(POSTS[i].x, POSTS[i].y, POST, 0, Math.PI * 2); ctx.fill(); }
    ctx.lineWidth = 5; ctx.strokeStyle = '#f4f4f4';
    line(GX0, Y0, GX0, Y0 - GD); line(GX1, Y0, GX1, Y0 - GD); line(GX0, Y0 - GD, GX1, Y0 - GD);
    line(GX0, Y1, GX0, Y1 + GD); line(GX1, Y1, GX1, Y1 + GD); line(GX0, Y1 + GD, GX1, Y1 + GD);

    // 조준선
    if (drag) {
      var d = G.B[drag.i], v = aimVec(d);
      if (v.pow > 0) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.setLineDash([]);
        line(d.x, d.y, drag.x, drag.y);
        var len = 60 + v.pow * 240, ex = d.x + Math.cos(v.ang) * len, ey = d.y + Math.sin(v.ang) * len;
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.setLineDash([10, 9]);
        line(d.x, d.y, ex, ey);
        ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.moveTo(ex + Math.cos(v.ang) * 16, ey + Math.sin(v.ang) * 16);
        ctx.lineTo(ex + Math.cos(v.ang + 2.5) * 14, ey + Math.sin(v.ang + 2.5) * 14);
        ctx.lineTo(ex + Math.cos(v.ang - 2.5) * 14, ey + Math.sin(v.ang - 2.5) * 14);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // 말·공
    var B = G.B, canPick = G.mode === 'play' && G.turn === HUMAN && G.resting && G.goalPause <= 0;
    var pulse = 0.45 + 0.35 * Math.sin(glow * 5);
    for (i = 1; i < B.length; i++) drawDisc(B[i], canPick && B[i].t === HUMAN ? pulse : 0, drag && drag.i === i);
    if (B.length) drawBall(B[0]);
  }
  function drawNet(y, h) {
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(GX0, y, GX1 - GX0, h);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; var x, yy;
    ctx.beginPath();
    for (x = GX0; x <= GX1; x += 12) { ctx.moveTo(x, y); ctx.lineTo(x, y + h); }
    for (yy = y; yy <= y + h; yy += 12) { ctx.moveTo(GX0, yy); ctx.lineTo(GX1, yy); }
    ctx.stroke();
  }
  function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  function arc(x, y, r, a0, a1) { ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); }
  function dot(x, y, r) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function drawDisc(b, glowA, held) {
    var c = COL[b.t];
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(b.x + 3, b.y + 5, b.r, 0, Math.PI * 2); ctx.fill();
    if (glowA > 0) { ctx.strokeStyle = 'rgba(255,255,255,' + glowA + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 7, 0, Math.PI * 2); ctx.stroke(); }
    if (held) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 7, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = c.ring; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = b.gk ? c.gk : c.body; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.22, b.y - b.r * 0.28, b.r * 0.32, b.r * 0.2, -0.7, 0, Math.PI * 2); ctx.fill();
  }
  function drawBall(b) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(b.x + 2, b.y + 4, b.r, 0, Math.PI * 2); ctx.fill();
    var g = ctx.createRadialGradient(b.x - 3, b.y - 4, 1, b.x, b.y, b.r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#cfcfcf');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; var k;
    ctx.beginPath(); ctx.arc(b.x, b.y, 2.6, 0, Math.PI * 2); ctx.fill();
    for (k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(b.x + Math.cos(a) * 7, b.y + Math.sin(a) * 7, 1.8, 0, Math.PI * 2); ctx.fill(); }
  }

  // ── 입력 ──
  function aimVec(d) {
    var dx = d.x - drag.x, dy = d.y - drag.y, len = Math.hypot(dx, dy);
    if (len < 14) return { pow: 0, ang: 0 };
    return { pow: Math.min(len - 14, MAXD) / MAXD, ang: Math.atan2(dy, dx) };
  }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { isTouch = true; document.body.classList.add('touch'); }
    if (G.mode !== 'play' || G.turn !== HUMAN || !G.resting || G.goalPause > 0) return;
    var p = toLogical(e.clientX, e.clientY), best = -1, bd = 1e9, i;
    for (i = 1; i <= 5; i++) { var b = G.B[i], d = Math.hypot(b.x - p.x, b.y - p.y); if (d < DR * 1.9 && d < bd) { bd = d; best = i; } }
    if (best < 0) return;
    drag = { i: best, x: p.x, y: p.y };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; var p = toLogical(e.clientX, e.clientY); drag.x = p.x; drag.y = p.y; });
  function release() {
    if (!drag) return;
    var d = G.B[drag.i], v = aimVec(d); var i = drag.i; drag = null;
    if (v.pow < 0.06 || G.turn !== HUMAN || !G.resting) return;
    flick(i, v.ang, v.pow);
  }
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', function () { drag = null; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  $('btnStart').addEventListener('click', function () { A.init(); start(); });
  $('btnRetry').addEventListener('click', function () { A.init(); start(); });
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  $('tgBgm').addEventListener('click', function () { A.init(); A.toggleBgm(); syncTog(); });
  addEventListener('keydown', function (e) {
    if (e.key === 'm' || e.key === 'M') { A.init(); A.toggleBgm(); syncTog(); }
    if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); }
  });
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }
  addEventListener('resize', resize);

  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');   // 스크린샷용 — 상단 바·알약 숨김
  G.B = setup(HUMAN); syncTog(); updHud(); showRec(); resize();
  requestAnimationFrame(loop);
  // 시험용 손잡이 — 화면이 멈춘 곳(숨은 탭)에서 프레임을 손으로 돌린다
  window.__fk = { G: G, view: view, setup: setup, simulate: simulate, aiChoose: aiChoose, toScreen: function (x, y) { var sx = view.land ? LH - y : x, sy = view.land ? x : y; return { x: view.ox + sx * view.s, y: view.oy + sy * view.s }; }, tick: function (n) { for (var k = 0; k < (n || 1); k++) loop(last + 16.7); } };
})();
