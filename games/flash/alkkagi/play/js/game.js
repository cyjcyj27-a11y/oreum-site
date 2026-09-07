/* 알까기 — 바둑돌을 튕겨 상대 돌을 판 밖으로 떨어뜨린다. 캔버스 2D, 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var A = window.AKAudio;

  // ── 논리 좌표: 700×700 판, 13줄 바둑판(줄 간격 52) ──
  var LW = 700, LH = 700, N = 13, SP = 52, M0 = 38;
  var SR = 24, FR = 0.98, OFR = 0.86, REST = 0.72, SUB = 3, SPEED = 13, MAXD = 170;   // 마찰 세게 — 세기를 재야 떨어진다. 반발 낮게 — 친 돌이 따라간다
  var BLACK = 0, WHITE = 1, HUMAN = 0, CPU = 1;
  // 판 차림 — 흰돌(위) 기준 격자 좌표. 검은돌은 위아래를 뒤집는다. 스테이지마다 돌아가며 쓴다
  var FORMS = [
    [[4, 3], [5, 3], [6, 3], [7, 3], [8, 3]],
    [[4, 2], [5, 3], [6, 4], [7, 3], [8, 2]],
    [[3, 3], [5, 3], [7, 3], [9, 3], [6, 5]],
    [[2, 2], [4, 4], [6, 2], [8, 4], [10, 2]],
    [[2, 3], [4, 3], [6, 3], [8, 3], [10, 3], [6, 5]],
    [[3, 2], [3, 4], [6, 3], [9, 2], [9, 4], [6, 5]]
  ];
  var HOSHI = [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]];

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var $ = function (id) { return document.getElementById(id); };
  var view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0, vx0: -300, vy0: -300, vx1: 1000, vy1: 1000 };
  var G = { mode: 'title', B: [], turn: HUMAN, stage: 1, p2: false, flick: null, resting: true, pause: 0, aiTimer: 0, result: -1 };
  var drag = null, glow = 0, isTouch = false, grain = [];
  // ── 말: ?lang=en 이면 영어. 한국어가 원본이고 영어를 덧씌운다 ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'Alkkagi — free flick stone game'; Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }

  // ── 기록 (브라우저에 저장) — 가장 멀리 간 스테이지 ──
  function loadBest() { try { return Math.max(1, parseInt(localStorage.getItem('alkkagi.best') || '1', 10) || 1); } catch (e) { return 1; } }
  function saveBest(n) { try { localStorage.setItem('alkkagi.best', String(n)); } catch (e) {} }
  function showRec() { var b = loadBest(), t = b > 1 ? 'BEST STAGE ' + b : ''; $('rec').textContent = t; }

  // ── 화면 맞추기 (판이 정사각형이라 가로·세로 다 그대로) ──
  function resize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), w = innerWidth, h = innerHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
    view.dpr = dpr; view.w = w; view.h = h;
    var top = ($('topbar').offsetHeight || 46) + 2, bottom = isTouch ? 6 : 26;
    var availW = w - 8, availH = h - top - bottom;
    var s = Math.max(0.05, Math.min(availW / (LW + 56), availH / (LH + 56)));
    view.s = s; view.ox = (w - LW * s) / 2; view.oy = top + (availH - LH * s) / 2;
    // 탁자에서 보이는 범위 — 떨어진 돌은 이 안에서 멈춘다
    view.vx0 = (4 - view.ox) / s; view.vx1 = (w - 4 - view.ox) / s; view.vy0 = (top - view.oy) / s; view.vy1 = (h - bottom - view.oy) / s;
    draw();
  }
  function applyView() { ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.translate(view.ox, view.oy); ctx.scale(view.s, view.s); }
  function toLogical(px, py) { return { x: (px - view.ox) / view.s, y: (py - view.oy) / view.s }; }

  // ── 돌 ──
  function gp(i) { return M0 + i * SP; }
  function stone(x, y, t) { return { x: x, y: y, vx: 0, vy: 0, t: t, off: false, z: 0 }; }
  function jit() { return (Math.random() - 0.5) * 8; }   // 외운 각도가 안 먹게 살짝 흔든다
  function setup(stage, title) {
    var f = FORMS[(stage - 1) % FORMS.length], B = [], k, p, sh = title ? -2 : 0;   // 타이틀에선 글씨에 안 가리게 가장자리 줄로
    for (k = 0; k < f.length; k++) { p = f[k]; B.push(stone(gp(p[0]) + jit(), gp(N - 1 - Math.max(1, p[1] + sh)) + jit(), BLACK)); }
    for (k = 0; k < f.length; k++) { p = f[k]; B.push(stone(gp(p[0]) + jit(), gp(Math.max(1, p[1] + sh)) + jit(), WHITE)); }
    return B;
  }
  function count(B, t) { var n = 0, i; for (i = 0; i < B.length; i++) if (B[i].t === t && !B[i].off) n++; return n; }

  // ── 물리 ──
  function step(B, ev) {
    var moving = false, i, j, a, b;
    for (i = 0; i < B.length; i++) {
      b = B[i]; b.x += b.vx; b.y += b.vy;
      var fr = b.off ? OFR : FR; b.vx *= fr; b.vy *= fr;
      var sp2 = b.vx * b.vx + b.vy * b.vy;
      if (!b.off && sp2 < 2.25) { b.vx *= 0.93; b.vy *= 0.93; }   // 느려지면 금방 선다
      if (sp2 < 0.02) { b.vx = 0; b.vy = 0; } else moving = true;
      if (!b.off) {
        if (b.x < 0 || b.x > LW || b.y < 0 || b.y > LH) { b.off = true; b.z = 1; if (ev) ev.off(b); }
      } else {
        if (b.z > 0) { b.z = Math.max(0, b.z - 0.07); moving = true; }
        if (b.x < view.vx0 + SR) { b.x = view.vx0 + SR; b.vx = 0; } if (b.x > view.vx1 - SR) { b.x = view.vx1 - SR; b.vx = 0; }
        if (b.y < view.vy0 + SR) { b.y = view.vy0 + SR; b.vy = 0; } if (b.y > view.vy1 - SR) { b.y = view.vy1 - SR; b.vy = 0; }
      }
    }
    for (i = 0; i < B.length; i++) {
      a = B[i]; if (a.off) continue;
      for (j = i + 1; j < B.length; j++) {
        b = B[j]; if (b.off) continue;
        var dx = b.x - a.x, dy = b.y - a.y, rr = SR * 2, d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 === 0) continue;
        var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (rr - d) / 2;
        a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
        var vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vn > 0) continue;
        var J = -(1 + REST) * vn / 2;
        a.vx -= J * nx; a.vy -= J * ny; b.vx += J * nx; b.vy += J * ny;
        if (ev) ev.hit(a, b, Math.abs(J));
      }
    }
    return moving;
  }

  // ── 튕기기 ──
  function flick(i, ang, pow) {
    var d = G.B[i]; d.vx = Math.cos(ang) * pow * SPEED; d.vy = Math.sin(ang) * pow * SPEED;
    G.flick = { i: i, t: d.t, fellEnemy: 0, fellOwn: 0 }; G.resting = false;
    A.flick(pow); updHud();
  }
  var EV = {
    hit: function (a, b, J) { if (J > 0.5) A.clack(J); },
    off: function (b) { A.drop(); if (G.flick) { if (b.t === G.flick.t) G.flick.fellOwn++; else G.flick.fellEnemy++; } }
  };
  function humanTurn() { return G.p2 || G.turn === HUMAN; }
  function onRest() {
    var f = G.flick; G.flick = null;
    if (f) {
      var me = f.t, op = 1 - me;
      if (count(G.B, op) === 0) { finish(me); return; }
      if (count(G.B, me) === 0) { finish(op); return; }
      if (f.fellEnemy > 0 && f.fellOwn === 0 && (G.p2 || me === HUMAN)) { flash(f.fellEnemy >= 3 ? 'TRIPLE' : f.fellEnemy === 2 ? 'DOUBLE' : 'NICE'); A.nice(f.fellEnemy); }
      G.turn = 1 - G.turn;   // 한 번씩 번갈아
    }
    if (!humanTurn()) G.aiTimer = 0.6 + Math.random() * 0.4;
    updHud();
  }
  var flashT = 0;
  function flash(txt) { var el = $('flash'); el.textContent = txt; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); clearTimeout(flashT); flashT = setTimeout(function () { el.classList.remove('show'); }, 900); }

  // ── CPU: 실제 물리로 수백 수를 돌려 보고 고른다. 스테이지가 오를수록 손이 정확해진다 ──
  function cloneB(B) { return B.map(function (b) { return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, t: b.t, off: b.off, z: 0 }; }); }
  function simulate(B, di, ang, pow) {
    var S = cloneB(B), d = S[di], fellE = 0, fellO = 0, n;
    d.vx = Math.cos(ang) * pow * SPEED; d.vy = Math.sin(ang) * pow * SPEED;
    var ev = { hit: function () {}, off: function (b) { if (b.t === d.t) fellO++; else fellE++; } };
    for (n = 0; n < 520; n++) if (!step(S, ev)) break;
    return { S: S, fellE: fellE, fellO: fellO, shooterOff: d.off, n: n };
  }
  function evalShot(r, me) {
    var S = r.S, op = 1 - me, sc = r.fellE * 1000 - r.fellO * 1000, i, b, e;
    if (count(S, op) === 0) sc += 5000;
    if (count(S, me) === 0) sc -= 6000;
    if (r.shooterOff) sc -= 250;
    for (i = 0; i < S.length; i++) {
      b = S[i]; if (b.off) continue;
      e = Math.min(b.x, LW - b.x, b.y, LH - b.y);   // 가장자리까지
      e = 200 - Math.min(e, 200);
      if (b.t === op) sc += e * 1.0; else sc -= e * 0.8;
    }
    return sc;
  }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) * 2; }   // 표준편차 1
  // 상대가 바로 다음에 둘 수 있는 가장 좋은 수의 점수 (정면 조준만, 세기 3가지)
  function bestReply(S, side) {
    var op = 1 - side, bs = -1e12, i, j, p, pows = [0.7, 0.85, 1.0];
    for (i = 0; i < S.length; i++) {
      if (S[i].t !== side || S[i].off) continue;
      for (j = 0; j < S.length; j++) {
        if (S[j].t !== op || S[j].off) continue;
        var ang = Math.atan2(S[j].y - S[i].y, S[j].x - S[i].x);
        for (p = 0; p < pows.length; p++) { var sc = evalShot(simulate(S, i, ang, pows[p]), side); if (sc > bs) bs = sc; }
      }
    }
    return bs > -1e11 ? bs : 0;
  }
  function aiChoose() {
    var B = G.B, me = G.turn, op = 1 - me, cands = [], i, j, o, p, k;
    var fine = G.stage >= 3, offs = fine ? [-0.08, -0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06, 0.08] : [-0.08, -0.04, 0, 0.04, 0.08];
    var pows = [0.42, 0.55, 0.68, 0.8, 0.9, 1.0];
    var nz = Math.max(0.15, 1.0 - G.stage * 0.12);   // 낮은 스테이지는 판단도 조금 흐리다
    function tryOne(di, ang, pow) { var r = simulate(B, di, ang, pow); cands.push({ i: di, ang: ang, pow: pow, S: r.S, sc: evalShot(r, me) + gauss() * 45 * nz }); }
    for (i = 0; i < B.length; i++) {
      if (B[i].t !== me || B[i].off) continue;
      for (j = 0; j < B.length; j++) {
        if (B[j].t !== op || B[j].off) continue;
        var base = Math.atan2(B[j].y - B[i].y, B[j].x - B[i].x);
        for (o = 0; o < offs.length; o++) for (p = 0; p < pows.length; p++) tryOne(i, base + offs[o], pows[p]);
      }
      for (k = 0; k < 8; k++) tryOne(i, k / 8 * Math.PI * 2 + Math.random() * 0.4, 0.5);
    }
    if (!cands.length) return;
    cands.sort(function (a, b) { return b.sc - a.sc; });
    // 상위 몇 수는 상대의 응수까지 본다 — 내 돌을 가장자리에 남기는 수를 피한다
    var top = cands.slice(0, 6), best = null, bs = -1e12;
    for (k = 0; k < top.length; k++) { var c = top[k], sc = c.sc - 0.6 * bestReply(c.S, op); if (sc > bs) { bs = sc; best = c; } }
    var dec = Math.pow(0.87, G.stage - 1), sa = Math.max(0.005, 0.13 * dec), sp = Math.max(0.008, 0.14 * dec);   // 손 떨림 — 1판 7도쯤, 10판 2도
    flick(best.i, best.ang + gauss() * sa, Math.max(0.15, Math.min(1, best.pow + gauss() * sp)));
  }

  // ── 진행 ──
  function start(stage) {
    G.stage = stage; G.B = setup(stage); G.turn = (G.p2 || stage % 2) ? HUMAN : CPU; G.flick = null;   // 짝수 판은 상대가 선공 G.resting = true; G.pause = 0; G.aiTimer = 0; G.result = -1;
    G.mode = 'play'; $('title').classList.add('hide'); $('over').classList.remove('show'); document.body.classList.add('playing');
    if (G.turn === CPU) G.aiTimer = 1.0;
    updHud(); A.place();
    if (window.OG) OG.start();   // 집계: 한 판 시작
  }
  function finish(winner) { G.mode = 'wait'; G.pause = 1.0; G.result = winner; updHud(); }
  function showOver() {
    G.mode = 'over'; document.body.classList.remove('playing');
    var w = G.result, h2 = $('oh'), sub = $('osub'), rec = $('orec'), btn = $('btnRetry'), big = $('ores');
    rec.textContent = ''; sub.textContent = '';
    if (G.p2) {
      big.textContent = w === BLACK ? 'BLACK' : 'WHITE'; big.className = 'res win'; h2.textContent = 'WINNER'; btn.textContent = 'RETRY'; A.win();
    } else if (w === HUMAN) {
      var nb = G.stage + 1, best = loadBest();
      big.textContent = 'CLEAR'; big.className = 'res win'; h2.textContent = 'STAGE ' + G.stage; btn.textContent = 'NEXT'; A.win();
      if (nb > best) { saveBest(nb); if (best > 1) rec.textContent = 'NEW BEST'; }
    } else {
      big.textContent = 'GAME OVER'; big.className = 'res lose'; h2.textContent = 'STAGE ' + G.stage; btn.textContent = 'RETRY'; A.lose();
      var b2 = loadBest(); if (b2 > 1) rec.textContent = 'BEST STAGE ' + b2;
    }
    $('over').classList.add('show');
    if (window.OG) OG.over({ result: G.p2 ? 'p2' : (w === HUMAN ? 'clear' : 'lose'), stage: G.stage });
  }
  var last = 0;
  function loop(ts) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    glow += dt;
    if (G.mode === 'play' || G.mode === 'wait') {
      var mv = false, k;
      for (k = 0; k < SUB; k++) mv = step(G.B, EV) || mv;
      if (G.mode === 'play') {
        if (!mv && !G.resting) onRest();
        G.resting = !mv;
        if (G.resting && !humanTurn() && G.aiTimer > 0) { G.aiTimer -= dt; if (G.aiTimer <= 0) aiChoose(); }
      } else { G.pause -= dt; if (G.pause <= 0 && !mv) showOver(); }
    }
    draw();
  }

  // ── HUD ──
  function updHud() {
    $('s0').textContent = count(G.B, BLACK); $('s1').textContent = count(G.B, WHITE);
    $('tmB').classList.toggle('on', G.turn === BLACK); $('tmW').classList.toggle('on', G.turn === WHITE);
    $('stage').textContent = 'STAGE ' + G.stage; $('stage').style.display = G.p2 ? 'none' : '';
    $('lbB').textContent = G.p2 ? '1P' : 'YOU'; $('lbW').textContent = G.p2 ? '2P' : '';
  }
  function syncTog() { $('tgSnd').classList.toggle('off', !A.snd); }

  // ── 그리기 ──
  (function mkGrain() { var i; for (i = 0; i < 26; i++) grain.push({ y: Math.random() * LH, a: 0.03 + Math.random() * 0.05, w: 1 + Math.random() * 2, k: Math.random() * 6, f: 0.004 + Math.random() * 0.006 }); })();
  function draw() {
    var W = view.w, H = view.h, i, b;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    // 탁자
    var wg = ctx.createLinearGradient(0, 0, W, H); wg.addColorStop(0, '#3d2a1b'); wg.addColorStop(1, '#221509');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    applyView();
    // 판 — 두께·그림자
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-4, 10, LW + 8, LH + 18);
    ctx.fillStyle = '#9c6f36'; ctx.fillRect(0, 0, LW, LH + 14);
    var bg = ctx.createLinearGradient(0, 0, LW, LH); bg.addColorStop(0, '#edc87e'); bg.addColorStop(1, '#d9ad62');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, LW, LH);
    // 나뭇결
    ctx.lineCap = 'round';
    for (i = 0; i < grain.length; i++) { var g = grain[i], x; ctx.strokeStyle = 'rgba(90,50,10,' + g.a + ')'; ctx.lineWidth = g.w; ctx.beginPath(); for (x = 0; x <= LW; x += 20) { var yy = g.y + Math.sin(x * g.f + g.k) * 9; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke(); }
    // 줄
    ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 1.6;
    for (i = 0; i < N; i++) { line(gp(i), gp(0), gp(i), gp(N - 1)); line(gp(0), gp(i), gp(N - 1), gp(i)); }
    ctx.lineWidth = 3; ctx.strokeRect(gp(0), gp(0), SP * (N - 1), SP * (N - 1));
    ctx.fillStyle = '#3a2810'; for (i = 0; i < HOSHI.length; i++) dot(gp(HOSHI[i][0]), gp(HOSHI[i][1]), 4.5);

    // 떨어진 돌(탁자 위) 먼저, 판 위 돌 나중
    var B = G.B;
    for (i = 0; i < B.length; i++) if (B[i].off) drawStone(B[i], 0, false);
    // 조준선
    if (drag) {
      var d = B[drag.i], v = aimVec(d);
      if (v.pow > 0) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.setLineDash([]);
        line(d.x, d.y, drag.x, drag.y);
        var len = 50 + v.pow * 230, ex = d.x + Math.cos(v.ang) * len, ey = d.y + Math.sin(v.ang) * len;
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 4; ctx.setLineDash([10, 9]);
        ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4;
        line(d.x, d.y, ex, ey);
        ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.moveTo(ex + Math.cos(v.ang) * 16, ey + Math.sin(v.ang) * 16);
        ctx.lineTo(ex + Math.cos(v.ang + 2.5) * 14, ey + Math.sin(v.ang + 2.5) * 14);
        ctx.lineTo(ex + Math.cos(v.ang - 2.5) * 14, ey + Math.sin(v.ang - 2.5) * 14);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    var canPick = G.mode === 'play' && humanTurn() && G.resting;
    var pulse = 0.35 + 0.3 * Math.sin(glow * 5);
    for (i = 0; i < B.length; i++) { b = B[i]; if (!b.off) drawStone(b, canPick && b.t === G.turn ? pulse : 0, drag && drag.i === i); }
  }
  function line(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
  function dot(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  function drawStone(b, glowA, held) {
    var r = SR, al = 1;
    if (b.off) { r = SR * (0.86 + 0.14 * b.z); al = 0.6 + 0.4 * b.z; }
    ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(b.x + 3 + (b.off ? b.z * 6 : 0), b.y + 5 + (b.off ? b.z * 8 : 0), r, 0, Math.PI * 2); ctx.fill();
    if (glowA > 0) { ctx.strokeStyle = 'rgba(255,255,255,' + glowA + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(b.x, b.y, r + 7, 0, Math.PI * 2); ctx.stroke(); }
    if (held) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, r + 7, 0, Math.PI * 2); ctx.stroke(); }
    var g = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
    if (b.t === BLACK) { g.addColorStop(0, '#6a6a6a'); g.addColorStop(0.5, '#1c1c1c'); g.addColorStop(1, '#000'); }
    else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, '#f0eee6'); g.addColorStop(1, '#bdb9ac'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = b.t === BLACK ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (b.t === BLACK ? 0.35 : 0.8) + ')'; ctx.beginPath(); ctx.ellipse(b.x - r * 0.3, b.y - r * 0.38, r * 0.28, r * 0.16, -0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ── 입력 ──
  function aimVec(d) {
    var dx = d.x - drag.x, dy = d.y - drag.y, len = Math.hypot(dx, dy);
    if (len < 14) return { pow: 0, ang: 0 };
    return { pow: Math.min(len - 14, MAXD) / MAXD, ang: Math.atan2(dy, dx) };
  }
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { isTouch = true; document.body.classList.add('touch'); }
    if (G.mode !== 'play' || !humanTurn() || !G.resting) return;
    var p = toLogical(e.clientX, e.clientY), best = -1, bd = 1e9, i;
    for (i = 0; i < G.B.length; i++) { var b = G.B[i]; if (b.off || b.t !== G.turn) continue; var d = Math.hypot(b.x - p.x, b.y - p.y); if (d < SR * 2.2 && d < bd) { bd = d; best = i; } }
    if (best < 0) return;
    drag = { i: best, x: p.x, y: p.y };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; var p = toLogical(e.clientX, e.clientY); drag.x = p.x; drag.y = p.y; });
  function release() {
    if (!drag) return;
    var d = G.B[drag.i], v = aimVec(d); var i = drag.i; drag = null;
    if (v.pow < 0.06 || !humanTurn() || !G.resting || G.mode !== 'play') return;
    flick(i, v.ang, v.pow);
  }
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', function () { drag = null; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  $('btnStart').addEventListener('click', function () { A.init(); G.p2 = false; start(1); });
  $('btn2p').addEventListener('click', function () { A.init(); G.p2 = true; start(1); });
  $('btnRetry').addEventListener('click', function () { A.init(); if (G.p2) start(1); else start(G.result === HUMAN ? G.stage + 1 : 1); });
  $('btnHome').addEventListener('click', function () { G.mode = 'title'; G.B = setup(1, true); $('over').classList.remove('show'); $('title').classList.remove('hide'); showRec(); updHud(); });
  $('tgSnd').addEventListener('click', function () { A.init(); A.toggleSnd(); syncTog(); });
  addEventListener('keydown', function (e) { if (e.key === 'k' || e.key === 'K') { A.init(); A.toggleSnd(); syncTog(); } });
  if ('ontouchstart' in window && matchMedia('(pointer: coarse)').matches) { isTouch = true; document.body.classList.add('touch'); }
  addEventListener('resize', resize);

  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');   // 스크린샷용 — 상단 바·알약 숨김
  G.B = setup(1, true); syncTog(); updHud(); showRec(); resize();
  requestAnimationFrame(loop);
  // 시험용 손잡이 — 화면이 멈춘 곳(숨은 탭)에서 프레임을 손으로 돌린다
  window.__ak = { G: G, view: view, setup: setup, simulate: simulate, aiChoose: aiChoose, bestReply: bestReply, flick: flick, start: start, toScreen: function (x, y) { return { x: view.ox + x * view.s, y: view.oy + y * view.s }; }, tick: function (n) { for (var k = 0; k < (n || 1); k++) loop(last + 16.7); } };
})();
