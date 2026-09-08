/* 고양이용 게임(catmobile) — 고양이·아기용. 화면에서 계속 움직이는 것들을 누르면 뾱 소리가 난다.
 * 시험 손잡이: window.__cm.tick(n) 으로 프레임을 손으로 돌린다(미리보기 창은 rAF 가 안 돈다).
 */
(function () {
  'use strict';

  // ── 말: ?lang=en 이면 영어 ──
  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'Game for Cat';
    document.getElementById('h1').innerHTML = 'GAME<br>FOR CAT';
  }

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  var A = window.CMAudio;
  var objs = [], parts = [], ripples = [];
  var count = 0, started = false, time = 0;
  var cntEl = document.getElementById('cnt');

  function wantCount() { return 1; }   // 단계 없음. 늘 하나, 물체만 계속 바뀐다(2026-09-09 사장님)

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (W < 50 || H < 50) return;                    // 아직 크기가 안 잡힌 창
    var want = wantCount();
    objs = []; bag = [];                                 // 크기가 바뀌면 판을 새로 깐다
    while (objs.length < want) objs.push(spawn(true));
  }
  window.addEventListener('resize', resize);

  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  // ── 종류: 그리는 법 + 움직이는 법 ──
  // 큰 것은 아기용, 작은 것은 고양이용. 전부 쉬지 않고 돌아다닌다
  var KINDS = [
    { name: 'fish',      move: 'swim',    r: [54, 82], colors: ['#42a5f5', '#ff8a3d', '#ffd23f', '#7ed957'] },
    { name: 'butterfly', move: 'flutter', r: [44, 64], colors: ['#ff6fb5', '#b388ff', '#ffb74d', '#4fc3f7'] },
    { name: 'ball',      move: 'bounce',  r: [50, 75], colors: ['#ff5f7e', '#3ad0ff', '#ffd23f'] },
    { name: 'star',      move: 'bounce',  r: [46, 72], colors: ['#ffd23f', '#ff8a3d', '#ff6fb5'] },
    { name: 'heart',     move: 'loop',    r: [44, 64], colors: ['#ff5f7e', '#ff8fb1', '#b388ff'] },
    { name: 'mouse',     move: 'dart',    r: [28, 39], colors: ['#9e9e9e', '#c8a27a', '#f5f5f5'] },
    { name: 'bug',       move: 'dart',    r: [20, 28], colors: ['#ff3d3d', '#ffb300', '#4fc3f7'] },
    { name: 'feather',   move: 'loop',    r: [40, 54], colors: ['#ffffff', '#ffe082', '#b3e5fc'] },
    { name: 'dot',       move: 'laser',   r: [15, 20], colors: ['#ff1744'] },
    { name: 'yarn',      move: 'roll',    r: [40, 57], colors: ['#ff8a3d', '#4fc3f7', '#ff6fb5'] }
  ];

  // 종류가 겹치지 않게 주머니에서 꺼낸다. 큰 것(아기용)은 두 번 넣는다
  var bag = [];
  function nextKind() {
    if (!bag.length) {
      KINDS.forEach(function (k) { bag.push(k); if (k.r[0] >= 40) bag.push(k); });
      for (var i = bag.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
    }
    return bag.pop();
  }

  var TOP = 60, BOT = 44;    // 상단바·전체화면 알약 자리
  function clampIn(o) {
    var r = o.r;
    o.x = Math.max(r, Math.min(W - r, o.x));
    o.y = Math.max(r + TOP, Math.min(H - r - BOT, o.y));
  }

  function spawn(anywhere) {
    var k = nextKind();
    var SC = Math.max(.6, Math.min(1.2, Math.min(W, H) / 600));   // 작은 화면에선 그만큼 줄인다
    var r = rnd(k.r[0], k.r[1]) * SC;
    var o = { k: k, r: r, color: pick(k.colors), x: rnd(r, W - r), y: rnd(r + TOP, H - r - BOT),
              vx: 0, vy: 0, dir: 1, phase: rnd(0, 6.28), t: 0, state: 'live', sq: 1, dead: 0,
              born: anywhere ? 1 : 0, kick: rnd(.3, .9), life: rnd(7, 12) };
    var sp = rnd(320, 480), ang = rnd(0, 6.28);
    switch (k.move) {
      case 'swim':    o.vx = sp * (Math.random() < .5 ? 1 : -1); o.vy = 0; o.amp = rnd(160, 260); break;
      case 'flutter': o.tx = o.x; o.ty = o.y; o.speed = rnd(380, 520); break;
      case 'bounce':  o.vx = Math.cos(ang) * sp; o.vy = Math.sin(ang) * sp; break;
      case 'dart':    o.wait = rnd(.1, .4); o.speed = rnd(600, 820); o.tx = o.x; o.ty = o.y; break;
      case 'loop':    o.cx = o.x; o.cy = o.y; o.ax = rnd(W * .25, W * .45); o.ay = rnd(H * .18, H * .3); o.w = rnd(2.2, 3.2); o.cvx = rnd(-120, 120); o.cvy = rnd(-80, 80); break;
      case 'laser':   o.wait = rnd(.05, .3); o.speed = rnd(900, 1300); o.tx = o.x; o.ty = o.y; break;
      case 'roll':    o.y = H - r - BOT; o.vx = rnd(300, 420) * (Math.random() < .5 ? 1 : -1); o.rot = 0; o.vy = 0; break;
    }
    if (!anywhere) o.born = 0;
    return o;
  }

  // ── 움직임 ──
  function move(o, dt) {
    o.t += dt;
    if (o.born < 1) o.born = Math.min(1, o.born + dt * 3);
    var r = o.r;
    switch (o.k.move) {
      case 'swim':
        // 헤엄: 앞으로 쭉 가다 갑자기 방향을 바꾸고, 위아래로 크게 굽이친다
        o.kick -= dt;
        if (o.kick <= 0) { o.kick = rnd(.4, 1.2); if (Math.random() < .5) o.vx = -o.vx; o.amp = rnd(160, 300); }
        o.x += o.vx * dt;
        o.y += Math.cos(o.t * 3.5 + o.phase) * o.amp * dt;
        if (o.x < r && o.vx < 0) o.vx = -o.vx;
        if (o.x > W - r && o.vx > 0) o.vx = -o.vx;
        clampIn(o);
        o.dir = o.vx > 0 ? 1 : -1;
        break;
      case 'flutter':
        // 팔랑: 목표를 자주 바꾸며 지그재그로 날아간다
        var dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
        o.kick -= dt;
        if (d < 20 || o.kick <= 0) { o.kick = rnd(.3, .8); o.tx = rnd(r, W - r); o.ty = rnd(r + TOP, H - r - BOT); }
        else { o.x += dx / d * o.speed * dt; o.y += dy / d * o.speed * dt + Math.sin(o.t * 18) * 160 * dt; }
        clampIn(o);
        o.dir = dx > 0 ? 1 : -1;
        break;
      case 'bounce':
        // 튕김: 벽에 부딪히고, 가끔 제멋대로 걷어차인다
        o.kick -= dt;
        if (o.kick <= 0) { o.kick = rnd(.4, 1.0); var ka = rnd(0, 6.28), ks = rnd(320, 520); o.vx = Math.cos(ka) * ks; o.vy = Math.sin(ka) * ks; }
        o.x += o.vx * dt; o.y += o.vy * dt;
        if (o.x < r) { o.x = r; o.vx = Math.abs(o.vx); }
        if (o.x > W - r) { o.x = W - r; o.vx = -Math.abs(o.vx); }
        if (o.y < r + TOP) { o.y = r + TOP; o.vy = Math.abs(o.vy); }
        if (o.y > H - r - BOT) { o.y = H - r - BOT; o.vy = -Math.abs(o.vy); }
        break;
      case 'loop':
        // 빙글: 8자를 그리며 돌고, 중심도 떠다닌다
        o.cx += o.cvx * dt; o.cy += o.cvy * dt;
        if (o.cx < W * .3 || o.cx > W * .7) o.cvx = -o.cvx;
        if (o.cy < H * .35 || o.cy > H * .65) o.cvy = -o.cvy;
        var px = o.x;
        o.x = o.cx + Math.sin(o.t * o.w + o.phase) * o.ax;
        o.y = o.cy + Math.sin(o.t * o.w * 2 + o.phase) * o.ay;
        clampIn(o);
        o.dir = o.x > px ? 1 : -1;
        break;
      case 'dart': case 'laser':
        // 쏜살: 잠깐 멈췄다 다른 곳으로 확 달린다
        if (o.wait > 0) { o.wait -= dt; if (o.k.move === 'dart') o.x += Math.sin(o.t * 30) * 0.6; }
        else {
          var ddx = o.tx - o.x, ddy = o.ty - o.y, dd = Math.hypot(ddx, ddy);
          if (dd < 8) {
            o.wait = o.k.move === 'laser' ? rnd(.05, .3) : rnd(.1, .45);
            o.tx = rnd(r, W - r); o.ty = rnd(r + TOP, H - r - BOT);
          } else { o.x += ddx / dd * o.speed * dt; o.y += ddy / dd * o.speed * dt; o.dir = ddx > 0 ? 1 : -1; }
        }
        break;
      case 'roll':
        // 구름: 바닥을 굴러가다 통통 뛰어오르고 방향도 바꾼다
        o.kick -= dt;
        if (o.kick <= 0) { o.kick = rnd(.5, 1.3); o.vy = -rnd(500, 800); if (Math.random() < .4) o.vx = -o.vx; }
        o.vy += 1600 * dt;
        o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vx / r * dt;
        if (o.y > H - r - BOT) { o.y = H - r - BOT; o.vy = 0; }
        if (o.x < r && o.vx < 0) o.vx = -o.vx;
        if (o.x > W - r && o.vx > 0) o.vx = -o.vx;
        break;
    }
  }

  // ── 그리기 ──
  function outline(fn) { ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#4a2f18'; fn(); }
  function eye(x, y, s) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s, 0, 6.29); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x + s * .25, y, s * .55, 0, 6.29); ctx.fill();
  }
  function darker(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + (r * k | 0) + ',' + (g * k | 0) + ',' + (b * k | 0) + ')';
  }

  var DRAW = {
    fish: function (o) {
      var r = o.r; ctx.scale(o.dir, 1);
      ctx.fillStyle = o.color;
      outline(function () {
        ctx.beginPath(); ctx.moveTo(-r * .6, 0); ctx.lineTo(-r * 1.1, -r * .55); ctx.lineTo(-r * 1.1, r * .55); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, r, r * .62, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = darker(o.color, .8); ctx.beginPath(); ctx.ellipse(-r * .2, -r * .15, r * .35, r * .18, -.4, 0, 6.29); ctx.fill();
      eye(r * .45, -r * .15, r * .16);
    },
    butterfly: function (o) {
      var r = o.r, flap = Math.abs(Math.sin(o.t * 12)) * .7 + .3;
      ctx.fillStyle = o.color;
      outline(function () {
        for (var s = -1; s <= 1; s += 2) {
          ctx.save(); ctx.scale(s * flap, 1);
          ctx.beginPath(); ctx.ellipse(r * .55, -r * .35, r * .6, r * .5, .5, 0, 6.29); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(r * .45, r * .4, r * .45, r * .38, -.4, 0, 6.29); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r * .6, -r * .35, r * .18, 0, 6.29); ctx.fill(); ctx.fillStyle = o.color;
          ctx.restore();
        }
        ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.ellipse(0, 0, r * .13, r * .55, 0, 0, 6.29); ctx.fill();
      });
    },
    ball: function (o) {
      var r = o.r; ctx.rotate(o.t * 2);
      ctx.fillStyle = o.color;
      outline(function () { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke(); });
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, 6.29); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r, -0.5, 0.5); ctx.lineTo(0, 0); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI - 0.5, Math.PI + 0.5); ctx.lineTo(0, 0); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-r * .35, -r * .35, r * .22, 0, 6.29); ctx.fill();
    },
    star: function (o) {
      var r = o.r; ctx.rotate(o.t * 3);
      ctx.fillStyle = o.color;
      outline(function () {
        ctx.beginPath();
        for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      eye(-r * .18, r * .05, r * .11); eye(r * .18, r * .05, r * .11);
      ctx.strokeStyle = '#4a2f18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, r * .15, r * .16, .2, Math.PI - .2); ctx.stroke();
    },
    heart: function (o) {
      var r = o.r; ctx.rotate(Math.sin(o.t * 4) * .3); ctx.scale(1 + Math.sin(o.t * 4) * .05, 1 - Math.sin(o.t * 4) * .05);
      ctx.fillStyle = o.color;
      outline(function () {
        ctx.beginPath(); ctx.moveTo(0, r * .95);
        ctx.bezierCurveTo(-r * 1.3, r * .1, -r * .7, -r * .9, 0, -r * .35);
        ctx.bezierCurveTo(r * .7, -r * .9, r * 1.3, r * .1, 0, r * .95);
        ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(-r * .4, -r * .35, r * .18, r * .12, -.6, 0, 6.29); ctx.fill();
    },
    mouse: function (o) {
      var r = o.r; ctx.scale(o.dir, 1);
      ctx.strokeStyle = '#4a2f18'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(-r * 1.8, r * .3 + Math.sin(o.t * 20) * r * .3, -r * 2.4, -r * .2); ctx.stroke();
      ctx.fillStyle = o.color;
      outline(function () {
        ctx.beginPath(); ctx.arc(-r * .3, -r * .6, r * .35, 0, 6.29); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r * .7, 0, 0, 6.29); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#ffb3c6'; ctx.beginPath(); ctx.arc(-r * .3, -r * .6, r * .17, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(r * .5, -r * .15, r * .1, 0, 6.29); ctx.fill();
      ctx.fillStyle = '#ffb3c6'; ctx.beginPath(); ctx.arc(r * 1.15, 0, r * .14, 0, 6.29); ctx.fill();
    },
    bug: function (o) {
      var r = o.r; ctx.scale(o.dir, 1);
      ctx.fillStyle = o.color;
      outline(function () { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke(); });
      ctx.fillStyle = '#4a2f18'; ctx.beginPath(); ctx.arc(r * .7, 0, r * .45, 0, 6.29); ctx.fill();
      ctx.beginPath(); ctx.arc(-r * .3, -r * .4, r * .18, 0, 6.29); ctx.arc(-r * .3, r * .4, r * .18, 0, 6.29); ctx.arc(-r * .75, 0, r * .14, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#4a2f18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * .9, 0); ctx.lineTo(-r * .9, 0); ctx.stroke();
    },
    feather: function (o) {
      var r = o.r; ctx.rotate(Math.sin(o.t * 1.3 + o.phase) * .5 + .4);
      ctx.fillStyle = o.color;
      outline(function () {
        ctx.beginPath(); ctx.moveTo(0, r * 1.4);
        ctx.quadraticCurveTo(-r * .9, r * .2, 0, -r * 1.4);
        ctx.quadraticCurveTo(r * .9, r * .2, 0, r * 1.4);
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, r * 1.4); ctx.lineTo(0, -r * 1.1); ctx.stroke();
      });
    },
    dot: function (o) {
      var r = o.r;
      var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.6);
      gr.addColorStop(0, 'rgba(255,23,68,.55)'); gr.addColorStop(1, 'rgba(255,23,68,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r * 2.6, 0, 6.29); ctx.fill();
      ctx.fillStyle = o.color; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(-r * .3, -r * .3, r * .3, 0, 6.29); ctx.fill();
    },
    yarn: function (o) {
      var r = o.r; ctx.rotate(o.rot);
      ctx.fillStyle = o.color;
      outline(function () { ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fill(); ctx.stroke(); });
      ctx.strokeStyle = darker(o.color, .72); ctx.lineWidth = 2.5;
      for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, 0, r * .95, r * (.25 + i * .18), i * .8, 0, 6.29); ctx.stroke(); }
    }
  };

  function drawObj(o) {
    ctx.save();
    ctx.translate(o.x, o.y);
    var s = o.born < 1 ? o.born * (2 - o.born) : 1;
    if (o.state === 'pop') s *= 1 + Math.sin(o.dead * 26) * .35 * (1 - o.dead * 8);
    if (o.state === 'leave') s *= Math.max(0, 1 - o.dead / 0.35);
    ctx.scale(s * o.sq, s / o.sq);
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
    DRAW[o.k.name](o);
    ctx.restore();
  }

  // ── 터지기 ──
  function pop(o) {
    o.state = 'pop'; o.dead = 0;
    var size = (o.r - 8) / 40;
    A.squeak(Math.max(0, Math.min(1, size)));
    count++; cntEl.textContent = count;
    var n = 8 + Math.round(o.r / 4);
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.28), sp = rnd(90, 260) * (0.6 + o.r / 60);
      parts.push({ x: o.x, y: o.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: rnd(.5, .9), t: 0,
                   c: Math.random() < .5 ? o.color : pick(['#fff', '#ffd23f', '#ff6fb5']), r: rnd(3, 7), shape: Math.random() < .3 ? 'heart' : 'dot' });
    }
    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
  }

  function hit(x, y) {
    var best = null, bd = 1e9;
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i]; if (o.state !== 'live') continue;
      var d = Math.hypot(o.x - x, o.y - y), lim = o.r * 1.5 + 28;   // 손·발바닥이 넉넉히 맞게
      if (d < lim && d < bd) { bd = d; best = o; }
    }
    if (best) pop(best);
    else { A.tap(); }
    ripples.push({ x: x, y: y, t: 0, big: !!best });
  }

  // ── 입력 ──
  function onDown(e) {
    if (!started) return;
    if (e.target !== cv) return;
    e.preventDefault();
    hit(e.clientX, e.clientY);
  }
  cv.addEventListener('pointerdown', onDown, { passive: false });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) { if (e.target === cv) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  // 화면이 꺼지지 않게 (고양이는 단추를 안 누른다)
  var lock = null;
  function wake() {
    if (!started || !navigator.wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) { lock = l; }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });

  document.getElementById('start').addEventListener('click', function () {
    A.unlock();
    started = true;
    document.getElementById('title').classList.add('hide');
    wake();
  });

  var sndTog = document.getElementById('sndTog');
  function syncSnd() { sndTog.classList.toggle('off', !A.on); }
  sndTog.addEventListener('click', function () { A.setOn(!A.on); syncSnd(); if (A.on) { A.unlock(); A.tap(); } });
  syncSnd();

  // ── 배경 ──
  var clouds = [];
  for (var i = 0; i < 7; i++) clouds.push({ x: Math.random(), y: rnd(.05, .9), r: rnd(40, 90), v: rnd(4, 10) });
  function drawBg() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff3c4'); g.addColorStop(1, '#ffd9a1');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i], x = ((c.x * W + time * c.v) % (W + c.r * 4)) - c.r * 2, y = c.y * H;
      ctx.beginPath(); ctx.arc(x, y, c.r, 0, 6.29); ctx.arc(x + c.r * .9, y + c.r * .15, c.r * .8, 0, 6.29); ctx.arc(x - c.r * .8, y + c.r * .2, c.r * .7, 0, 6.29); ctx.fill();
    }
  }

  // ── 프레임 ──
  function step(dt) {
    if (W !== window.innerWidth || H !== window.innerHeight) resize();   // resize 이벤트를 놓쳐도 잡는다
    time += dt;
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i];
      if (o.state === 'live') {
        move(o, dt);
        o.sq += (1 - o.sq) * Math.min(1, dt * 10);
        o.life -= dt;
        if (o.life <= 0) { o.state = 'leave'; o.dead = 0; }
      } else if (o.state === 'leave') {
        move(o, dt); o.dead += dt;                      // 움직이던 채로 줄어들며 사라진다
        if (o.dead > 0.35) { o.state = 'gone'; o.dead = 0; o.re = rnd(.3, .8); }
      } else {
        o.dead += dt;
        if (o.dead > 0.12 && o.state === 'pop') { o.state = 'gone'; o.dead = 0; o.re = rnd(.4, 1.6); }
        if (o.state === 'gone' && o.dead > o.re) objs[i] = spawn(false);
      }
    }
    while (objs.length < wantCount()) objs.push(spawn(false));
    for (var p = parts.length - 1; p >= 0; p--) {
      var q = parts[p]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt; q.vx *= 0.98;
      if (q.t > q.life) parts.splice(p, 1);
    }
    for (var r = ripples.length - 1; r >= 0; r--) { ripples[r].t += dt; if (ripples[r].t > .45) ripples.splice(r, 1); }
  }

  function draw() {
    drawBg();
    for (var r = 0; r < ripples.length; r++) {
      var rp = ripples[r], k = rp.t / .45;
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - k) * .9 + ')'; ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, (rp.big ? 90 : 50) * k + 10, 0, 6.29); ctx.stroke();
    }
    for (var i = 0; i < objs.length; i++) if (objs[i].state !== 'gone') drawObj(objs[i]);
    for (var p = 0; p < parts.length; p++) {
      var q = parts[p], al = 1 - q.t / q.life;
      ctx.globalAlpha = al; ctx.fillStyle = q.c;
      if (q.shape === 'heart') {
        ctx.save(); ctx.translate(q.x, q.y); var s = q.r * 1.4;
        ctx.beginPath(); ctx.moveTo(0, s); ctx.bezierCurveTo(-s * 1.3, 0, -s * .7, -s, 0, -s * .35); ctx.bezierCurveTo(s * .7, -s, s * 1.3, 0, 0, s); ctx.fill();
        ctx.restore();
      } else { ctx.beginPath(); ctx.arc(q.x, q.y, q.r * al + 1, 0, 6.29); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  var last = 0;
  function frame(ts) {
    var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    step(dt); draw();
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);

  // 시험 손잡이
  window.__cm = {
    tick: function (n) { for (var i = 0; i < (n || 1); i++) step(1 / 60); draw(); },
    start: function () { document.getElementById('start').click(); },
    objs: function () { return objs; },
    hit: hit,
    get count() { return count; },
    // 소개 페이지용 그림: 장면 + 제목을 캔버스에 그려 dataURL 로 준다
    snapshot: function (w, h, en) {
      return document.fonts.load('100px Bagel').then(function () {
        var oW = W, oH = H, oObjs = objs, oBag = bag, oCtx = ctx;
        var oc = document.createElement('canvas'); oc.width = w; oc.height = h;
        ctx = oc.getContext('2d'); W = w; H = h; objs = []; bag = [];
        var want = [['fish', .13, .30, 1], ['ball', .86, .34, 1.1], ['butterfly', .22, .80, 1], ['mouse', .80, .84, 1.2], ['dot', .55, .90, 1.3], ['star', .50, .12, .9]];
        want.forEach(function (q) {
          var k = KINDS.filter(function (kk) { return kk.name === q[0]; })[0];
          bag = [k]; var o = spawn(true); o.x = w * q[1]; o.y = h * q[2]; o.r = k.r[1] * q[3] * (h / 600); o.t = 0.131; o.dir = q[1] < .5 ? 1 : -1; objs.push(o);
        });
        draw();
        ctx.save(); ctx.translate(w / 2, h * .44); ctx.rotate(-4 * Math.PI / 180);
        var fs = Math.round(h * .21); ctx.font = fs + 'px Bagel'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        var lines = en ? ['GAME', 'FOR CAT'] : ['고양이용', '게임'];
        lines.forEach(function (ln, i) {
          var y = (i - (lines.length - 1) / 2) * fs * 1.08;
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillText(ln, 0, y + fs * .11);
          ctx.fillStyle = '#5a3a1a'; ctx.fillText(ln, 0, y + fs * .07);
          ctx.lineWidth = fs * .05; ctx.strokeStyle = '#5a3a1a'; ctx.strokeText(ln, 0, y);
          ctx.fillStyle = '#ff8a1f'; ctx.fillText(ln, 0, y);
        });
        ctx.restore();
        var url = oc.toDataURL('image/png');
        ctx = oCtx; W = oW; H = oH; objs = oObjs; bag = oBag;
        return url;
      });
    }
  };
})();
