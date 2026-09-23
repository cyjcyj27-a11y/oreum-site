/* 병아리 일이병구하기 (옛 이름 집으로 가는 수탉) — 규칙.
 * 세계 높이 540, 바닥 FY=470. 오른쪽 끝 이정표(🏠▶)에 닿으면 CLEAR. 60판(6구역×10)을 다 가면 집.
 * 병아리 12 를 다 모아야 집 문이 열린다(엔딩). 엔딩 뒤엔 끝, 무한 모드 없음.
 * 시험 손잡이: window.__rt = { tick(n,dt,nodraw), G, P, go(stage), key(k,down), save }
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('cv'), c = cv.getContext('2d');
  var FY = ART.FY, PI = Math.PI, ZONES = ART.ZONES;
  var EN = /[?&]lang=en\b/.test(location.search);
  var T = EN ? { title: 'SAVING 12 CHICKS', map: 'MAP', close: 'CLOSE', keys: '←→ Move · Shift Run · Space Jump (hold to glide) · X Peck', home: 'HOME', end: 'THE END' }
             : { title: '병아리 일이병구하기', map: '지도', close: '닫기', keys: '←→ 이동 · Shift 달리기 · 스페이스 점프(누르면 활강) · X 쪼기', home: '집', end: 'THE END' };
  if (EN) {
    $('rotTitle').textContent = 'This game is played in landscape';
    $('rotGo').textContent = 'Rotate to landscape';
    $('rotHelp').textContent = 'If the button does nothing, unlock screen rotation and turn your phone';
    $('rotSkip').textContent = 'Play in portrait anyway';
    $('h1').textContent = T.title; document.title = 'Saving 12 Chicks'; document.documentElement.lang = 'en';
    $('mapBtn').textContent = T.map; $('mapClose').textContent = T.close; $('mapH').textContent = T.map; $('keys').textContent = T.keys; $('endH').textContent = T.home;
  }
  var LAST = 60, TOTAL = 12, HEART_FOOD = 3;   // 먹이 HEART_FOOD 개 먹으면 하트 1칸 회복

  // ── 저장 ──
  var save = { stage: 1, chicks: [], cleared: 0, ended: false, inf: 0 };
  try { var sv = JSON.parse(localStorage.getItem('rooster.prog') || 'null'); if (sv) save = Object.assign(save, sv); } catch (e) {}
  function store() { try { localStorage.setItem('rooster.prog', JSON.stringify(save)); } catch (e) {} }

  // ── 화면 ──
  var W, H, S, VW, dpr, VH = 540;
  function fitTitle() {
    var el = $('h1'); if (!el) return;
    el.style.fontSize = '';   // CSS clamp 기본값으로 되돌린 뒤 재는다
    var max = innerWidth * 0.92, w = el.scrollWidth;
    if (w > max) { var cur = parseFloat(getComputedStyle(el).fontSize); el.style.fontSize = Math.max(26, cur * max / w) + 'px'; }
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    S = H / VH; VW = W / S;
    if (VW < 640) { S = W / 640; VW = 640; }
    document.body.classList.toggle('portrait', innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
    fitTitle();
  }
  addEventListener('resize', resize);

  // ── 스테이지 만들기 ──
  function zoneOf(n) { return n > LAST ? Math.floor(ART.hash(n * 9.1) * 6) : Math.floor((n - 1) / 10); }
  function rnd(seed) { var s = seed; return function () { s += 1; return ART.hash(s * 1.37 + 0.5); }; }
  function buildStage(n) {
    var R = rnd(n * 101), z = zoneOf(n), d = Math.min(1, (n - 1) / 50) + (n > LAST ? 0.4 : 0);  // 어려움 0~1(.4)
    var len = Math.min(6800, 3200 + n * 60), props = [], enemies = [], items = [], gaps = [], x = 420;
    var pool = ['fence', 'grain', 'hay', 'pumpkin', 'grain', 'crate'];
    if (n >= 2) pool.push('dog'); if (n >= 3) pool.push('gap', 'crow'); if (n >= 5) pool.push('rock', 'log');
    if (n >= 7) pool.push('cat'); if (n >= 11) pool.push('snake', 'gap'); if (n >= 16) pool.push('dog', 'stump');
    if (z === 2) pool.push('flat', 'flat'); if (z === 3) pool.push('gap', 'log'); if (z >= 4) pool.push('cat'); if (z === 5) pool.push('fox');
    if (n > LAST) pool.push('fox', 'gap', 'snake');
    var special = n % 5 === 0 ? 'chick' : null, spAt = 0.35 + R() * 0.4, spDone = false, lastK = '';
    while (x < len - 520) {
      var k = pool[Math.floor(R() * pool.length)];
      if (k === lastK && k !== 'grain') k = 'grain';
      if (!spDone && x > len * spAt) { k = special || k; spDone = true; }
      var w = 200 + R() * 160;
      if (k === 'fence') { var fh = 44 + R() * 14 * d; props.push({ k: 'fence', x: x, w: 34 * (1 + Math.floor(R() * 2)), h: fh, solid: 1, top: 1 }); coinArc(items, x + 20, 130, 5); w = 240; }
      else if (k === 'hay') { props.push({ k: 'hay', x: x, w: 70, h: 52, top: 1, bounce: 1, sq: 0 }); coinArc(items, x + 35, 165, 5, 1); w = 260; }
      else if (k === 'crate') { props.push({ k: 'crate', x: x, w: 56, h: 56, solid: 1, top: 1, push: 1, vx: 0, y: 0 }); w = 240; }
      else if (k === 'rock') { props.push({ k: 'rock', x: x + 30, w: 60, h: 40 + R() * 20, solid: 1, top: 1, cx: 1 }); coinArc(items, x + 30, 120, 4); w = 220; }
      else if (k === 'log') { props.push({ k: 'log', x: x, r: 22, vx: 0, rot: 0, roll: 1 }); w = 220; }
      else if (k === 'stump') { props.push({ k: 'stump', x: x, w: 36, h: 24, top: 1, cx: 1 }); props.push({ k: 'stump', x: x + 90, w: 36, h: 24, top: 1, cx: 1 }); coinArc(items, x + 45, 90, 3); w = 260; }
      else if (k === 'gap') { var gw = 80 + R() * (40 + 40 * d); gaps.push({ x: x, w: gw }); coinArc(items, x + gw / 2, 120, 4); w = gw + 200; }
      else if (k === 'dog') { enemies.push({ k: 'dog', x: x + 60, home: x + 60, state: 'sleep', t: 0, face: -1, walkP: 0, h: 0, w: 64, hh: 44 }); w = 300; }
      else if (k === 'cat') { enemies.push({ k: 'cat', x: x + 80, home: x + 80, state: 'patrol', t: 0, face: -1, walkP: 0, h: 0, w: 50, hh: 50, vy: 0 }); w = 300; }
      else if (k === 'crow') { enemies.push({ k: 'crow', x: x + 100, home: x + 100, state: 'fly', t: 0, face: -1, h: 170, w: 40, hh: 24, vy: 0, vx: 0 }); coinArc(items, x + 60, 60, 3); w = 260; }
      else if (k === 'snake') { enemies.push({ k: 'snake', x: x + 80, home: x + 80, state: 'hide', t: 0, face: -1, h: 0, w: 60, hh: 20 }); w = 260; }
      else if (k === 'fox') { enemies.push({ k: 'fox', x: x + 120, home: x + 120, state: 'patrol', t: 0, face: -1, walkP: 0, h: 0, w: 70, hh: 50 }); w = 340; }
      else if (k === 'pumpkin') { props.push({ k: 'pumpkin', x: x + 20, w: 44, h: 36, peck: 1 }); w = 160; }
      else if (k === 'chick') { props.push({ k: 'basket', x: x + 40, w: 52, h: 34, peck: 1, hid: 'chick', open: save.chicks.indexOf(n) >= 0 ? 2 : 0 }); w = 220; }
      else if (k === 'flat') { coinArc(items, x + 60, 30, 6, 1); w = 260; }
      else { coinArc(items, x + 40, 30 + R() * 40, 4 + Math.floor(R() * 3), 1); if (R() < 0.3) items.push({ k: 'worm', x: x + 120, y: FY - 8 }); w = 200; }
      if (R() < 0.12 + d * 0.1) props.push({ k: 'bush', x: x + w - 40, w: 60, h: 40, peck: 1, hid: R() < 0.4 ? 'worm' : 'grain', open: 0 });
      lastK = k; x += w;
    }
    props.push({ k: 'sign', x: n === LAST ? len - 640 : len - 260, w: 60, h: 130, end: 1 });
    if (n === LAST) props.push({ k: 'home', x: len - 450, w: 260, h: 150, locked: !(save.chicks.length >= TOTAL) });
    var cars = z === 2 ? { t: 3 + R() * 2, every: Math.max(3.2, 6.5 - d * 3) } : null;
    return { n: n, zone: z, len: len, props: props, enemies: enemies, items: items, gaps: gaps, cars: cars, day: 25 + len / 80, seed: n };
  }
  function coinArc(items, x, h, cnt, flat) {
    for (var i = 0; i < cnt; i++) { var u = cnt > 1 ? i / (cnt - 1) : 0.5; items.push({ k: 'grain', x: x + (i - (cnt - 1) / 2) * 34, y: FY - 30 - (flat ? h : h * Math.sin(u * PI)) }); }
  }

  var G = null, P = null, chicks = [], trail = [];
  function newPlayer() { return { x: 160, y: FY, vx: 0, vy: 0, face: 1, hp: 3, food: 0, inv: 0, ground: true, anim: 'idle', fr: 0, at: 0, peckT: 0, hitT: 0, turnT: 0, glide: false, dead: false, walkP: 0, onProp: null, tilt: 0, coyote: 0, jbuf: 0 };
  }
  function startStage(n) {
    SND.unlock();
    var sd = buildStage(n);
    P = newPlayer();
    G = { mode: 'play', stage: n, sd: sd, len: sd.len, zone: sd.zone, cam: 0, props: sd.props, enemies: sd.enemies, items: sd.items, gaps: sd.gaps, parts: [], t: 0, time: 0, day: sd.day, dayMax: sd.day, dark: 0, shake: 0, intro: 1.2, fin: null, overT: 0, cars: sd.cars, found: { chick: false, worm: false }, fox: null, crowT: 0 };
    chicks = []; trail = [];
    for (var i = 0; i < Math.min(TOTAL, save.chicks.length); i++) chicks.push({ x: P.x - 30 - i * 26, y: FY, face: 1, ph: 0, sc: 0, sx: 0 });
    save.stage = n; store();
    $('stg').textContent = 'STAGE ' + n; $('stageT').textContent = 'STAGE ' + n;
    showPanel('stage');
    document.body.classList.remove('title');
    SND.bgm(true); SND.cluck2();
    hud();
  }

  // ── 입력 ──
  var keys = {}, pad = { x: 0, run: false }, btn = { jump: false, peck: false };
  var KEYMAP = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', Space: 'jump', KeyX: 'peck', KeyK: 'peck', ShiftLeft: 'run', ShiftRight: 'run' };
  function press(k, down) {
    if (k === 'jump') { if (down && !btn.jump && P) P.jbuf = 0.12; btn.jump = down; return; }
    if (k === 'peck') { if (down && !btn.peck) doPeck(); btn.peck = down; return; }
    keys[k] = down;
  }
  addEventListener('keydown', function (e) {
    if (e.code === 'KeyP' || e.code === 'Escape') { if (!e.repeat) togglePause(); return; }
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) { var b = document.querySelector('.panel.on .btn'); if (b && !(G && G.mode === 'play' && G.intro <= 0)) { b.click(); e.preventDefault(); return; } }
    var k = KEYMAP[e.code]; if (!k) return;
    e.preventDefault(); if (e.repeat) return;
    press(k, true);
  });
  addEventListener('keyup', function (e) { var k = KEYMAP[e.code]; if (k) press(k, false); });
  addEventListener('blur', function () { keys = {}; btn = { jump: false, peck: false }; });
  var padEl = $('pad'), knob = $('knob'), padId = null;
  function padMove(e) {   // 좌우 스크롤 스틱 — 가로로만 움직인다
    var r = padEl.getBoundingClientRect(), cx = r.left + r.width / 2;
    var R = (r.width - r.height) / 2;                          // 손잡이가 갈 수 있는 좌우 거리
    var dx = Math.max(-R, Math.min(R, e.clientX - cx));
    knob.style.transform = 'translateX(' + dx + 'px)';
    var k = dx / R;
    pad.x = Math.abs(k) > 0.22 ? Math.sign(k) : 0; pad.run = Math.abs(k) > 0.78;
  }
  padEl.addEventListener('pointerdown', function (e) { padId = e.pointerId; padMove(e); try { padEl.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });   // 첫 터치를 먼저 반영하고 캡처(캡처가 막혀도 움직이게)
  padEl.addEventListener('pointermove', function (e) { if (e.pointerId === padId) padMove(e); });
  function padEnd(e) { if (e.pointerId !== padId) return; padId = null; pad.x = 0; pad.run = false; knob.style.transform = ''; }
  padEl.addEventListener('pointerup', padEnd); padEl.addEventListener('pointercancel', padEnd);
  [['bJump', 'jump'], ['bPeck', 'peck']].forEach(function (b) {
    var el = $(b[0]);
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('on'); SND.unlock(); press(b[1], true); });
    var up = function () { el.classList.remove('on'); press(b[1], false); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });

  function canAct() { return G && G.mode === 'play' && P && !P.dead && G.intro <= 0 && !G.fin; }

  // ── 쪼기 ──
  function doPeck() {
    if (!canAct() || P.peckT > 0 || P.hitT > 0) return;
    P.peckT = 0.5; P.pecked = false; P.anim = 'peck'; P.fr = 0;
  }
  function peckHit() {
    SND.peck();
    var px0 = P.x + P.face * 26, px1 = P.x + P.face * 92, lo = Math.min(px0, px1), hi = Math.max(px0, px1), any = false;
    var yb = P.y, yt = P.y - 70;
    G.props.forEach(function (p) {
      if (p.k === 'log' && p.x > lo - 20 && p.x < hi + 20) { p.vx += P.face * 230; SND.thud(1.3); any = true; dust(p.x, FY, 4); }
      else if (p.k === 'pumpkin' && !p.gone && p.x > lo - 20 && p.x < hi + 20) { p.gone = true; SND.pop(); any = true; burst(p.x, FY - 18, 'seed', 14, '#f2c230'); }
      else if ((p.k === 'bush' || p.k === 'basket') && !p.open && p.x > lo - 30 && p.x < hi + 30) {
        p.open = 1; any = true; dust(p.x, FY - 10, 8);
        if (p.hid === 'chick') { foundChick(p.x); }
        else if (p.hid === 'worm') { G.items.push({ k: 'worm', x: p.x, y: FY - 30, vy: -260, vx: P.face * 120 }); SND.pop(); }
        else if (p.hid === 'grain') { for (var i = 0; i < 4; i++) G.items.push({ k: 'grain', x: p.x - 30 + i * 20, y: FY - 30, vy: -220 - i * 30, vx: (i - 1.5) * 60 }); SND.pop(); }
      }
      else if (p.k === 'hay' && p.x + p.w > lo && p.x < hi && p.top) { burst(p.x + p.w / 2, FY - 40, 'seed', 4, '#e0b040'); }
    });
    G.enemies.forEach(function (e) {
      if (e.gone) return;
      var near = e.x > lo - 30 && e.x < hi + 30;
      if (!near) return;
      if (e.k === 'crow' && e.h < 90) { e.state = 'flee'; e.t = 0; SND.caw(); burst(e.x, FY - e.h, 'feather', 5, '#2a2a38'); any = true; }
      else if (e.k === 'snake') { e.state = 'flee'; e.t = 0; SND.hiss(); any = true; }
      else if (e.k === 'cat' && e.state !== 'flee') { e.state = 'flee'; e.t = 0; SND.meow(); burst(e.x, FY - 30, 'feather', 4, '#6a6a78'); any = true; }
      else if (e.k === 'dog' && e.state === 'sleep') { e.state = 'chase'; e.t = 0; e.chaseT = 3; SND.bark(); pop(e.x, FY - 90, '!'); }
    });
    G.items.forEach(function (it) {
      if (it.got || it.vy !== undefined || it.x < lo - 20 || it.x > hi + 20 || it.y < yt) return;   // 날아가는 중엔 못 쪼고, 땅에 내려앉은 뒤에
      if (it.k === 'worm') eatWorm(it);
      else if (it.k === 'grain') { it.got = true; SND.coin(); feedHeart(1); G.parts.push({ k: 'spark', x: it.x, y: it.y, vx: 0, vy: -120, life: 0.4, col: '#ffe066' }); }
    });
    if (!any) dust(P.x + P.face * 50, FY, 2);
  }
  function foundChick(x) {
    if (save.chicks.indexOf(G.stage) < 0) save.chicks.push(G.stage);
    G.found.chick = true; store();
    chicks.push({ x: x, y: FY, face: 1, ph: 0, sc: 0, sx: 0, joy: 1.2 });
    SND.peep(); setTimeout(SND.peep, 180); setTimeout(SND.peep, 360);
    pop(x, FY - 90, '🐥 ' + save.chicks.length + '/' + TOTAL, 'big');
    burst(x, FY - 30, 'spark', 10, '#ffe066'); hud();
  }
  function eatWorm(it) { it.got = true; SND.pop(); feedHeart(1); }
  // 먹이 HEART_FOOD개(3개)를 먹으면 하트 1칸 회복. 하트가 가득이면 게이지가 늘지 않는다.
  function feedHeart(n) {
    if (P.hp < 3) {
      P.food += (n || 1);
      while (P.food >= HEART_FOOD && P.hp < 3) { P.food -= HEART_FOOD; P.hp++; pop(P.x, P.y - 110, '❤', 'heal'); }
    }
    hud();
  }

  // ── 입자·글 ──
  function dust(x, y, n) { for (var i = 0; i < n; i++) G.parts.push({ k: 'dust', x: x + (Math.random() - 0.5) * 20, y: y - 4, vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 50, life: 0.5 + Math.random() * 0.3, r: 4 + Math.random() * 5, a: 0.5 }); }
  function burst(x, y, k, n, col) { for (var i = 0; i < n; i++) { var a = Math.random() * PI * 2, sp = 120 + Math.random() * 200; G.parts.push({ k: k, x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 0.8 + Math.random() * 0.6, rot: Math.random() * PI, col: col, g: k === 'feather' ? 200 : 700 }); } }
  var popsEl = $('pops');
  function pop(wx, wy, txt, cls) {
    var el = document.createElement('div'); el.className = 'pop' + (cls ? ' ' + cls : ''); el.textContent = txt;
    el.style.left = ((wx - G.cam) * S) + 'px'; el.style.top = (wy * S) + 'px';
    popsEl.appendChild(el); setTimeout(function () { el.remove(); }, 1300);
  }

  // ── 한 틀 ──
  function step(dt) {
    if (!G) return;
    G.t += dt;
    if (G.mode === 'title') { titleStep(dt); return; }
    if (G.mode === 'ending') { endStep(dt); return; }
    if (G.mode !== 'play') return;
    if (G.intro > 0) { G.intro -= dt; if (G.intro <= 0) showPanel(null); return; }
    G.time += dt;
    if (!G.fin && !P.dead) { G.day -= dt; if (G.day <= 0 && !G.dark) { G.dark = 1; spawnFox(); } }
    if (G.dark) G.dark = Math.min(1, G.dark + dt * 0.5);
    updatePlayer(dt);
    updateProps(dt);
    updateEnemies(dt);
    updateItems(dt);
    updateChicks(dt);
    updateParts(dt);
    if (G.cars) { G.cars.t -= dt; if (G.cars.t <= 0) { spawnCar(); G.cars.t = G.cars.every * (0.7 + Math.random() * 0.6); } }
    G.shake *= Math.pow(0.001, dt);
    if (G.fin) { G.fin.t += dt; if (G.fin.t > 1.0 && !G.fin.shown) { G.fin.shown = true; showClear(); } }
    if (P.dead) { G.overT -= dt; if (G.overT <= 0) { G.mode = 'over'; $('overN').textContent = 'STAGE ' + G.stage; showPanel('over'); SND.bgm(false); } }
    hudBars();
  }

  var WALK = 170, RUN = 285, JUMP = 610, GRAV = 1650;
  function updatePlayer(dt) {
    if (P.inv > 0) P.inv -= dt;
    if (P.hitT > 0) { P.hitT -= dt; }
    var dir = 0, run = false;
    if (!P.dead && P.hitT <= 0 && !G.fin) { dir = (keys.R ? 1 : 0) - (keys.L ? 1 : 0); if (pad.x) dir = pad.x; run = !!keys.run || pad.run; }
    if (P.peckT > 0 && P.ground) dir = 0;
    var spd = run ? RUN : WALK;
    if (dir) {
      if (dir !== P.face && P.ground && P.turnT <= 0 && P.peckT <= 0) { P.turnT = 0.14; }
      P.face = dir;
      var acc = P.ground ? 2200 : 1100;
      P.vx += Math.max(-acc * dt, Math.min(acc * dt, dir * spd - P.vx));
    } else if (P.hitT <= 0) { P.vx *= Math.pow(P.ground ? 0.0001 : 0.05, dt); if (Math.abs(P.vx) < 4) P.vx = 0; }
    if (P.turnT > 0) P.turnT -= dt;
    // 점프·활강
    if (P.jbuf > 0) P.jbuf -= dt;
    if (P.ground) P.coyote = 0.1; else P.coyote -= dt;
    if (P.jbuf > 0 && P.coyote > 0 && P.hitT <= 0 && !P.dead && !G.fin) {
      P.vy = -JUMP; P.ground = false; P.coyote = 0; P.jbuf = 0; P.onProp = null; SND.hop(); dust(P.x, P.y, 5); P.peckT = 0;
    }
    if (!P.ground && P.vy > 0 && btn.jump && P.hitT <= 0) { P.glide = true; P.vy = Math.min(P.vy + GRAV * dt * 0.35, 95); }
    else { P.glide = false; P.vy += GRAV * dt; }
    if (P.vy > 900) P.vy = 900;
    var ox = P.x, oy = P.y;
    P.x += P.vx * dt; P.y += P.vy * dt;
    if (P.x < 30) { P.x = 30; if (P.vx < 0) P.vx = 0; }
    if (P.x > G.len - 40) P.x = G.len - 40;
    // 바닥·구멍
    var overGap = null;
    G.gaps.forEach(function (g) { if (P.x > g.x + 6 && P.x < g.x + g.w - 6) overGap = g; });
    var landed = false;
    if (!overGap && P.y >= FY && P.vy >= 0) { P.y = FY; landed = true; P.onProp = null; }
    // 소품 위 · 옆
    var bw = 20, bh = 86;
    G.props.forEach(function (p) {
      if (p.gone || (!p.top && !p.solid)) return;
      var px = p.k === 'rock' || p.k === 'stump' ? p.x - p.w / 2 : p.x, pw = p.w, top = FY - p.h - (p.y || 0);
      if (p.k === 'crate' && p.sunk) top = FY - 8;
      if (p.k === 'hay' && p.sq > 0) top += 14;
      if (P.x + bw > px && P.x - bw < px + pw) {
        // 위에서 내려앉기
        if (p.top && P.vy >= 0 && oy <= top + 2 && P.y >= top) {
          P.y = top; landed = true; P.onProp = p;
          if (p.bounce && P.vy > 200) { P.vy = -Math.max(780, P.vy * 1.2); P.ground = false; landed = false; p.sq = 0.25; SND.bounce(); dust(P.x, top, 6); P.onProp = null; }
          return;
        }
        // 옆으로 밀림
        if (p.solid && P.y > top + 6 && P.y - bh < FY - (p.y || 0)) {
          if (ox <= px) { P.x = px - bw; if (p.push && P.ground && dir > 0) p.vx = 90; }
          else if (ox >= px + pw) { P.x = px + pw + bw; if (p.push && P.ground && dir < 0) p.vx = -90; }
          if (!p.push || !P.ground) P.vx = 0;
        }
      }
    });
    if (landed) {
      if (!P.ground) { dust(P.x, P.y, 3); if (P.vy > 500) SND.thud(0.8); }
      P.ground = true; P.vy = 0;
    } else if (P.onProp) { P.ground = false; P.onProp = null; }
    else if (P.y < FY) P.ground = false;
    // 물에 빠짐
    if (overGap && P.y >= FY + 20 && !P.dead) {
      var onCrate = false;
      G.props.forEach(function (p) { if (p.k === 'crate' && p.sunk && Math.abs(p.x + p.w / 2 - P.x) < 40) onCrate = true; });
      if (!onCrate) {
        SND.splash(); for (var i = 0; i < 12; i++) G.parts.push({ k: 'drop', x: P.x, y: FY, vx: (Math.random() - 0.5) * 240, vy: -150 - Math.random() * 250, life: 0.7, g: 900 });
        hurt(overGap.x - 50, 0);
        P.x = overGap.x - 50; P.y = FY; P.vy = 0; P.ground = true;
      }
    }
    if (P.y > 600) { P.y = FY; P.ground = true; }
    // 쪼기
    if (P.peckT > 0) { P.peckT -= dt; if (!P.pecked && P.peckT < 0.32) { P.pecked = true; peckHit(); } }
    // 애니
    var an;
    if (P.dead) an = 'hit';
    else if (P.hitT > 0) an = 'hit';
    else if (P.peckT > 0) an = 'peck';
    else if (!P.ground) an = 'jump';
    else if (P.turnT > 0) an = 'turn';
    else if (Math.abs(P.vx) > 200) an = 'run';
    else if (Math.abs(P.vx) > 10) an = 'walk';
    else an = 'idle';
    if (an !== P.anim) { P.anim = an; P.fr = 0; P.at = 0; }
    var A = SHEET.anims[an];
    if (an === 'jump') { P.fr = P.vy < -300 ? 0 : P.vy < -60 ? 1 : P.vy < 60 ? 2 : P.glide ? 3 : 4; }
    else if (an === 'hit') { P.at += dt; P.fr = Math.min(A.frames - 1, P.at * A.fps); }
    else if (an === 'peck') { P.fr = (0.5 - P.peckT) / 0.5 * A.frames; }
    else { P.at += dt * (an === 'walk' ? Math.abs(P.vx) / WALK : an === 'run' ? Math.abs(P.vx) / RUN : 1); P.fr = (P.at * A.fps) % A.frames; }
    P.tilt = P.glide ? 0.15 * P.face : 0;
    P.walkP = P.at;
    // 줍기
    G.items.forEach(function (it) {
      if (it.got) return;
      if (Math.abs(it.x - P.x) < 34 && it.y > P.y - 100 && it.y < P.y + 12) {
        if (it.k === 'grain') { it.got = true; SND.coin(); feedHeart(1); G.parts.push({ k: 'spark', x: it.x, y: it.y, vx: 0, vy: -120, life: 0.4, col: '#ffe066' }); }
      }
    });
    // 이정표
    if (!G.fin && !P.dead) G.props.forEach(function (p) { if (p.end && P.x > p.x - 10) finish(); });
    // 카메라
    var tx = P.x - VW * 0.38; G.cam = Math.max(0, Math.min(G.len - VW, tx));
    trail.unshift({ x: P.x, y: P.y, f: P.face, g: P.ground }); if (trail.length > 400) trail.pop();
  }
  function hurt(fromX, kb) {
    if (P.inv > 0 || P.dead) return;
    P.hp--; P.inv = 1.6; P.hitT = 0.5; P.peckT = 0;
    var d = P.x >= fromX ? 1 : -1;
    if (kb !== 0) { P.vx = d * (kb || 240); P.vy = -300; P.ground = false; }
    SND.squawk(); burst(P.x, P.y - 60, 'feather', 7, '#f0e8d8'); G.shake = 6;
    chicks.forEach(function (ch) { ch.sc = 1; ch.sx = (Math.random() - 0.5) * 120; });
    if (P.hp <= 0) { P.dead = true; P.hitT = 9; G.overT = 1.4; SND.bgm(false); }
    hud();
  }
  function finish() {
    G.fin = { t: 0 }; P.vx = 0; SND.clear();
    if (G.stage > save.cleared) save.cleared = G.stage;
    store(); hud();
  }
  function showClear() {
    var home = G.stage === LAST, locked = !(save.chicks.length >= TOTAL);
    if (home && !locked && !save.ended) { startEnding(); return; }
    G.mode = 'clear';
    $('clearN').textContent = '';
    $('clearF').innerHTML = '<span>🐥 ' + save.chicks.length + '/' + TOTAL + '</span>';
    $('next').textContent = home && locked ? T.map : 'NEXT';
    showPanel('clear'); SND.bgm(false);
    var stageAtClear = G.stage;   // 자동 진행: CLEAR 를 잠깐 보여준 뒤 누르지 않아도 저절로 다음 판(또는 지도)으로
    setTimeout(function () {
      if (!G || G.mode !== 'clear' || G.stage !== stageAtClear) return;   // 그새 눌렀거나 다른 판으로 넘어갔으면 건너뜀
      if (stageAtClear === LAST && !save.ended) openMap(); else startStage(stageAtClear + 1);
    }, 1300);
  }

  // ── 소품 물리 ──
  function updateProps(dt) {
    G.props.forEach(function (p) {
      if (p.k === 'log') {
        if (p.vx) { p.x += p.vx * dt; p.rot += p.vx / p.r * dt; p.vx *= Math.pow(0.35, dt); if (Math.abs(p.vx) < 8) p.vx = 0;
          G.enemies.forEach(function (e) { if (!e.gone && e.k !== 'car' && e.k !== 'crow' && Math.abs(e.x - p.x) < 44 && e.h < 20 && Math.abs(p.vx) > 80) { e.state = 'flee'; e.t = 0; SND.thud(1.2); burst(e.x, FY - 40, 'dust', 4); } });
          G.gaps.forEach(function (g) { if (p.x > g.x + 10 && p.x < g.x + g.w - 10) { p.vx = 0; p.gone = true; SND.splash(); for (var i = 0; i < 8; i++) G.parts.push({ k: 'drop', x: p.x, y: FY, vx: (Math.random() - 0.5) * 200, vy: -100 - Math.random() * 200, life: 0.6, g: 900 }); } });
        }
      } else if (p.k === 'crate') {
        if (p.vx) { p.x += p.vx * dt; p.vx *= Math.pow(0.02, dt); if (Math.abs(p.vx) < 3) p.vx = 0;
          G.props.forEach(function (q) { if (q !== p && q.solid && !q.gone && q.k !== 'crate' && p.x + p.w > (q.cx ? q.x - q.w / 2 : q.x) && p.x < (q.cx ? q.x + q.w / 2 : q.x + q.w)) { p.x = p.vx > 0 ? (q.cx ? q.x - q.w / 2 : q.x) - p.w : (q.cx ? q.x + q.w / 2 : q.x + q.w); p.vx = 0; } });
          if (!p.sunk) G.gaps.forEach(function (g) { if (p.x + p.w / 2 > g.x + 10 && p.x + p.w / 2 < g.x + g.w - 10) { p.sunk = true; p.x = p.vx > 0 ? g.x - 2 : g.x + g.w - p.w + 2; p.vx = 0; p.y = -48; p.solid = 0; p.push = 0; SND.splash(); pop(p.x + p.w / 2, FY - 70, 'NICE', 'big'); for (var i = 0; i < 10; i++) G.parts.push({ k: 'drop', x: p.x + p.w / 2, y: FY, vx: (Math.random() - 0.5) * 240, vy: -100 - Math.random() * 250, life: 0.6, g: 900 }); } });
        }
      } else if (p.k === 'hay') { if (p.sq > 0) p.sq -= dt; }
    });
  }

  // ── 동물 ──
  function spawnCar() {
    var fromLeft = Math.random() < 0.5, x = fromLeft ? G.cam - 260 : G.cam + VW + 260;
    if (fromLeft && P.x - G.cam < 260) x = G.cam - 560;              // 화면 왼쪽에 있으면 더 멀리서
    else if (!fromLeft && (G.cam + VW) - P.x < 260) x = G.cam + VW + 560;  // 화면 오른쪽에 있으면 더 멀리서(끝 이정표 근처 대비)
    G.enemies.push({ k: 'car', x: x, face: fromLeft ? 1 : -1, vx: (fromLeft ? 1 : -1) * (300 + Math.random() * 120), h: 0, w: 130, hh: 58, col: ['#d9432c', '#2f6fd1', '#f2c230', '#e8e8f0', '#3d8a4a'][Math.floor(Math.random() * 5)], night: ZONES[G.zone].night > 0.4, horn: 0 });
    SND.horn();
  }
  function spawnFox() { G.fox = { k: 'fox', x: Math.max(G.cam - 120, P.x - 500), home: 0, state: 'chase', t: 0, face: 1, walkP: 0, h: 0, w: 70, hh: 50, chaseT: 999, night: true }; G.enemies.push(G.fox); SND.bark(); }
  function updateEnemies(dt) {
    var dx, dist;
    G.enemies.forEach(function (e) {
      if (e.gone) return;
      e.t += dt; dx = P.x - e.x; dist = Math.abs(dx);
      if (e.k === 'dog') {
        if (e.state === 'sleep') { if (dist < 125 && P.y > FY - 60 && !P.dead) { e.state = 'wake'; e.t = 0; e.face = Math.sign(dx) || 1; SND.bark(); pop(e.x, FY - 90, '!'); } }
        else if (e.state === 'wake') { if (e.t > 0.55) { e.state = 'chase'; e.t = 0; e.chaseT = 3.2; } }
        else if (e.state === 'chase') { e.face = Math.sign(dx) || e.face; e.x += e.face * 232 * dt; e.walkP += dt; e.chaseT -= dt; if (e.t % 0.9 < dt) SND.bark(); if (e.chaseT <= 0 || dist > 700) { e.state = 'back'; e.t = 0; SND.bark(); } }
        else if (e.state === 'back') { var hd = e.home - e.x; e.face = Math.sign(hd) || 1; e.x += e.face * 140 * dt; e.walkP += dt; if (Math.abs(hd) < 6) { e.state = 'sleep'; e.face = -1; } }
        else if (e.state === 'flee') { e.x += (dx > 0 ? -1 : 1) * 320 * dt; e.face = dx > 0 ? 1 : -1; e.walkP += dt; if (e.t > 3) e.gone = true; }
      } else if (e.k === 'fox') {
        if (e.state === 'patrol') { if (dist < 240 && !P.dead) { e.state = 'chase'; e.t = 0; e.chaseT = 4.5; SND.bark(); pop(e.x, FY - 90, '!'); } else { e.x += e.face * 60 * dt; e.walkP += dt * 0.5; if (Math.abs(e.x - e.home) > 90) e.face = -e.face; } }
        else if (e.state === 'chase') { e.face = Math.sign(dx) || e.face; e.x += e.face * (e.night ? 235 : 265) * dt; e.walkP += dt; e.chaseT -= dt; if (e.chaseT <= 0) { e.state = 'flee'; e.t = 0; } if (e.night && P.x - e.x > 900) e.x = P.x - 900; }
        else if (e.state === 'pause') { if (e.t > 1.6) { e.state = e.night ? 'chase' : 'flee'; e.t = 0; } }
        else if (e.state === 'flee') { e.x += (dx > 0 ? -1 : 1) * 300 * dt; e.face = dx > 0 ? 1 : -1; e.walkP += dt; if (e.t > 3) e.gone = true; }
      } else if (e.k === 'cat') {
        if (e.state === 'patrol') { e.x += e.face * 80 * dt; e.walkP += dt * 0.7; if (Math.abs(e.x - e.home) > 100) e.face = -e.face; if (dist < 130 && P.y > FY - 40 && Math.sign(dx) === e.face && !P.dead) { e.state = 'pounce'; e.t = 0; e.vy = -420; e.h = 0.1; SND.meow(); } }
        else if (e.state === 'pounce') { e.vy += 1500 * dt; e.h -= e.vy * dt; e.x += e.face * 260 * dt; if (e.h <= 0) { e.h = 0; e.state = 'wait'; e.t = 0; } }
        else if (e.state === 'wait') { if (e.t > 1.0) { e.state = 'patrol'; e.home = e.x; e.face = -e.face; } }
        else if (e.state === 'flee') { e.x += (dx > 0 ? -1 : 1) * 340 * dt; e.face = dx > 0 ? 1 : -1; e.walkP += dt; if (e.t > 2.5) e.gone = true; }
      } else if (e.k === 'crow') {
        if (e.state === 'fly') { e.x = e.home + Math.sin(e.t * 0.9) * 60; e.h = 170 + Math.sin(e.t * 2) * 15; e.face = Math.cos(e.t * 0.9) > 0 ? 1 : -1; if (dist < 260 && !P.dead && e.t > 1) { e.state = 'dive'; e.t = 0; e.tx = P.x; SND.caw(); } }
        else if (e.state === 'dive') { var u = Math.min(1, e.t / 1.15); e.face = Math.sign(e.tx - e.x) || e.face; e.x += (e.tx - e.x) * dt * 3; e.h = 170 - Math.sin(u * PI) * 150; if (u >= 1) { e.state = 'fly'; e.t = 1; e.home = e.x; } }
        else if (e.state === 'flee') { e.h += 260 * dt; e.x += (dx > 0 ? -1 : 1) * 200 * dt; if (e.t > 2.5) e.gone = true; }
      } else if (e.k === 'snake') {
        if (e.state === 'hide') { if (dist < 170 && !P.dead) { e.state = 'crawl'; e.t = 0; SND.hiss(); } }
        else if (e.state === 'crawl') { e.face = Math.sign(dx) || e.face; e.x += e.face * 70 * dt; if (dist > 320) e.state = 'hide'; }
        else if (e.state === 'flee') { e.x += (dx > 0 ? -1 : 1) * 200 * dt; e.face = dx > 0 ? 1 : -1; if (e.t > 2.5) e.gone = true; }
      } else if (e.k === 'car') {
        e.x += e.vx * dt; if (e.x < G.cam - 400 || e.x > G.cam + VW + 400) e.gone = true;
        if (!e.horn && dist < 380) { e.horn = 1; SND.horn(); }
      }
      // 부딪힘
      if (P.inv <= 0 && !P.dead && e.state !== 'flee' && e.state !== 'sleep' && e.state !== 'wake') {
        var ex0 = e.x - e.w / 2, ex1 = e.x + e.w / 2, ey1 = FY - e.h, ey0 = ey1 - e.hh;
        if (e.k === 'crow') { if (e.h > 70) return; ey1 = FY - e.h + 12; ey0 = ey1 - 30; }
        if (P.x + 18 > ex0 && P.x - 18 < ex1 && P.y > ey0 && P.y - 80 < ey1) {
          // 위에서 내려앉으면 밟기: 튕겨 오르고 동물은 도망
          if (e.k !== 'car' && e.k !== 'crow' && P.vy > 0 && P.y < ey0 + 26) {
            P.vy = -430; P.y = ey0; P.ground = false; e.state = 'flee'; e.t = 0; e.face = P.face;
            if (e.k === 'dog' || e.k === 'fox') SND.bark(); else if (e.k === 'cat') SND.meow(); else SND.hiss();
            dust(e.x, FY - e.h, 6); if (e.k === 'cat') { e.h = 0; e.vy = 0; } return;
          }
          if (e.k === 'crow') { e.state = 'flee'; e.t = 0; }
          if (e.k === 'dog' && e.state === 'chase') { e.state = 'back'; e.t = 0; }
          if (e.k === 'fox') { e.state = 'pause'; e.t = 0; }
          if (e.k === 'cat') { e.state = 'wait'; e.t = 0.6; e.h = 0; e.vy = 0; }
          hurt(e.x, e.k === 'car' ? 420 : 240);
        }
      }
    });
    G.enemies = G.enemies.filter(function (e) { return !e.gone; });
  }
  function updateItems(dt) {
    G.items.forEach(function (it) {
      if (it.vy !== undefined && !it.got) { it.vy += 900 * dt; it.y += it.vy * dt; it.x += (it.vx || 0) * dt; var fl = it.k === 'worm' ? FY - 8 : FY - 30; if (it.y > fl) { it.y = fl; it.vy = undefined; } }
    });
  }
  function updateChicks(dt) {
    chicks.forEach(function (ch, i) {
      var tr = trail[Math.min(trail.length - 1, 14 + i * 11)];
      if (!tr) return;
      if (ch.sc > 0) ch.sc -= dt;
      var tx = tr.x + (ch.sc > 0 ? ch.sx : 0), ty = tr.y;
      ch.x += (tx - ch.x) * Math.min(1, dt * 9); ch.y += (ty - ch.y) * Math.min(1, dt * 12);
      ch.face = tx > ch.x + 2 ? 1 : tx < ch.x - 2 ? -1 : ch.face;
      ch.ph += dt * (Math.abs(tx - ch.x) > 4 ? 1 : 0.2);
      if (ch.joy > 0) { ch.joy -= dt; ch.hop = Math.abs(Math.sin(ch.joy * 14)) * 14; } else ch.hop = Math.abs(tx - ch.x) > 40 ? Math.abs(Math.sin(ch.ph * 16)) * 5 : 0;
    });
  }
  function updateParts(dt) {
    for (var i = G.parts.length - 1; i >= 0; i--) {
      var p = G.parts[i]; p.life -= dt; if (p.life <= 0) { G.parts.splice(i, 1); continue; }
      p.vy += (p.g || 300) * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.rot !== undefined) p.rot += dt * 6;
      if (p.k === 'dust') { p.r += dt * 14; p.a = p.life * 0.6; }
      if (p.y > FY + 30 && p.k !== 'drop') { p.y = FY + 30; p.vy = 0; p.vx *= 0.5; }
    }
  }

  // ── 그리기 ──
  var ov = document.createElement('canvas'), oc = ov.getContext('2d');
  function draw() {
    if (!G) return;
    c.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    var z = G.zone, Z = ZONES[z], cam = G.cam, sh = G.shake > 0.3 ? (Math.random() - 0.5) * G.shake : 0;
    ART.sky(c, z, G.t, VW, cam);
    ART.far(c, z, cam, VW);
    ART.mid(c, z, cam, VW, G.sd ? G.sd.seed : 0);
    c.save(); c.translate(-cam + sh, sh);
    ART.ground(c, z, cam, VW, G.len, G.gaps);
    var t = G.t, back = ['bush', 'sign', 'home', 'basket', 'fence', 'stump'];
    G.props.forEach(function (p) { if (!p.gone && back.indexOf(p.k) >= 0 && p.x + 300 > cam && p.x < cam + VW + 100) ART.prop(c, p, t, Z); });
    G.items.forEach(function (it) { if (!it.got && it.x > cam - 60 && it.x < cam + VW + 60) ART.item(c, it, t); });
    G.props.forEach(function (p) { if (!p.gone && back.indexOf(p.k) < 0 && p.x + 300 > cam && p.x < cam + VW + 100) { if (p.k === 'crate') { c.save(); c.translate(0, -(p.y || 0)); ART.prop(c, p, t, Z); c.restore(); } else ART.prop(c, p, t, Z); } });
    G.enemies.forEach(function (e) { if (e.x > cam - 200 && e.x < cam + VW + 200) ART.enemy(c, e, t); });
    if (G.hen) ART.hen(c, G.hen.x, G.hen.y, -1, t, G.end ? G.end.t : 0);
    chicks.forEach(function (ch) { ART.chick(c, ch.x, ch.y, ch.face, t, ch.ph, ch.hop || 0); });
    if (!(P.inv > 0 && P.hitT <= 0 && Math.floor(G.t * 14) % 2 === 0)) ART.rooster(c, P.anim, P.fr, P.x, P.y, P.face, 0.6, P.tilt);
    G.parts.forEach(function (p) { ART.item(c, p, t); });
    c.restore();
    // 밤 어둠 + 수탉 둘레 빛
    var dark = Math.max(Z.night * 0.5, G.dark * 0.6);
    if (dark > 0.05) {
      if (ov.width !== cv.width) { ov.width = cv.width; ov.height = cv.height; }
      oc.setTransform(dpr * S, 0, 0, dpr * S, 0, 0); oc.globalCompositeOperation = 'source-over';
      oc.fillStyle = 'rgba(8,12,40,' + (dark * 0.55) + ')'; oc.fillRect(0, 0, VW, VH);
      oc.globalCompositeOperation = 'destination-out';
      var lx = P.x - cam, ly = P.y - 50, g = oc.createRadialGradient(lx, ly, 20, lx, ly, 260); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      oc.fillStyle = g; oc.fillRect(lx - 260, ly - 260, 520, 520);
      c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(ov, 0, 0); c.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    }
    if (G.dark && z !== 5) { c.fillStyle = 'rgba(60,20,80,' + (G.dark * 0.12) + ')'; c.fillRect(0, 0, VW, VH); }
    ART.vignette(c, VW, VH, 0.3);
  }

  // ── HUD ──
  function hud() {
    $('hearts').textContent = P ? '❤'.repeat(Math.max(0, P.hp)) + '♡'.repeat(Math.max(0, 3 - P.hp)) : '❤❤❤';
    var fp = P && P.hp < 3 ? Math.max(0, Math.min(1, P.food / HEART_FOOD)) : 0;
    $('fbar').firstElementChild.style.width = (fp * 100) + '%';
    $('chk').textContent = save.chicks.length + '/' + TOTAL;
  }
  function hudBars() {
    if (!G || G.mode !== 'play') return;
  }

  // ── 판 ──
  var panels = ['title', 'stage', 'clear', 'over', 'ending', 'pause', 'map'];
  function showPanel(id) { panels.forEach(function (p) { $(p).classList.toggle('on', p === id); }); }
  function togglePause() {
    if (!G || (G.mode !== 'play' && G.mode !== 'pause')) return;
    if (G.mode === 'play') { G.mode = 'pause'; showPanel('pause'); SND.bgm(false); }
    else { G.mode = 'play'; showPanel(G.intro > 0 ? 'stage' : null); SND.bgm(true); }
  }
  $('tPause').addEventListener('click', togglePause);
  $('resume').addEventListener('click', togglePause);
  function setTog(id, on) { $(id).classList.toggle('off', !on); }
  setTog('tMus', SND.music); setTog('tSnd', SND.on);
  $('tMus').addEventListener('click', function () { SND.setMusic(!SND.music); setTog('tMus', SND.music); });
  $('tSnd').addEventListener('click', function () { SND.setOn(!SND.on); setTog('tSnd', SND.on); });
  $('start').addEventListener('click', function () { startStage(Math.max(1, Math.min(save.cleared + 1, LAST))); });
  $('next').addEventListener('click', function () { if (G.stage === LAST && !save.ended) { openMap(); return; } startStage(G.stage + 1); });
  $('retry').addEventListener('click', function () { startStage(G.stage); });
  $('mapBtn').addEventListener('click', openMap);
  $('mapClose').addEventListener('click', function () { if (G && G.mode === 'clear') showPanel('clear'); else showPanel('title'); });
  function openMap() {
    var grid = $('grid'); grid.innerHTML = '';
    var maxN = LAST;
    for (var n = 1; n <= maxN; n++) {
      var el = document.createElement('button'); el.className = 'cell'; el.textContent = n;
      var open = n <= save.cleared + 1;
      if (n <= save.cleared) el.classList.add('done'); if (n === save.cleared + 1) el.classList.add('cur'); if (!open) el.classList.add('lock');
      if (n <= LAST && n % 5 === 0) el.innerHTML += '<em class="' + (save.chicks.indexOf(n) >= 0 ? '' : 'miss') + '">🐥</em>';
      if (open) el.addEventListener('click', (function (k) { return function () { startStage(k); }; })(n));
      grid.appendChild(el);
    }
    showPanel('map');
  }

  // ── 타이틀 장면 ──
  var titleChicks = [];
  function titleScene() {
    G = { mode: 'title', stage: 1, zone: 0, len: 2000, cam: 0, props: [{ k: 'fence', x: 520, w: 102, h: 50 }, { k: 'hay', x: 720, w: 70, h: 52, sq: 0 }, { k: 'bush', x: 880, w: 60, h: 40 }, { k: 'pumpkin', x: 380, w: 44, h: 36 }], enemies: [{ k: 'dog', x: 1000, state: 'sleep', face: -1, h: 0, t: 0 }], items: [], gaps: [], parts: [], t: 0, dark: 0, sd: { seed: 3 } };
    P = newPlayer(); P.x = 240; P.anim = 'idle';
    chicks = []; trail = [];
    titleChicks = [{ x: 170, y: FY, face: 1, ph: 0, hop: 0 }, { x: 300, y: FY, face: -1, ph: 0, hop: 0 }, { x: 330, y: FY, face: 1, ph: 0, hop: 0 }];
    $('best').textContent = save.cleared ? 'STAGE ' + save.cleared + ' · 🐥 ' + save.chicks.length + '/' + TOTAL : '';
    $('start').textContent = save.cleared ? (EN ? 'CONTINUE' : '이어하기') : 'START';
    document.body.classList.add('title'); showPanel('title'); hud();
  }
  function titleStep(dt) {
    var A = SHEET.anims[P.anim]; P.at += dt; P.fr = (P.at * A.fps) % A.frames;
    if (P.anim === 'idle' && P.at > 3) { P.anim = 'peck'; P.at = 0; } else if (P.anim === 'peck' && P.at > 1) { P.anim = 'idle'; P.at = 0; }
    titleChicks.forEach(function (ch, i) { ch.ph += dt; ch.hop = Math.abs(Math.sin(G.t * 5 + i * 2)) * (i === 1 ? 6 : 0); ch.x += Math.sin(G.t * 0.7 + i) * 6 * dt; });
    chicks = titleChicks;
  }

  // ── 엔딩 ──
  function startEnding() {
    G.mode = 'ending'; G.end = { t: 0 }; save.ended = true; store(); SND.bgm(false);
    G.props.forEach(function (p) { if (p.k === 'home') p.locked = false; });
    var home = G.props.filter(function (p) { return p.k === 'home'; })[0];
    G.hen = { x: home.x + 130, y: FY, t: 0 }; G.zone = 6;
    for (var i = 0; i < 4; i++) G.enemies = [];
    setTimeout(SND.cluck2, 600);   // 집에 닿으면 암탉이 반긴다(사장님 2026-09-23)
    $('endN').textContent = '🐥 ' + save.chicks.length + '/' + TOTAL;
    setTimeout(function () { showPanel('ending'); }, 2500);
  }
  function endStep(dt) {
    G.end.t += dt;
    var home = G.props.filter(function (p) { return p.k === 'home'; })[0];
    var tx = home.x + 40;
    if (P.x < tx) { P.x += 120 * dt; P.anim = 'walk'; P.at += dt; P.fr = (P.at * 10) % 6; P.face = 1; }
    else { P.anim = 'idle'; P.at += dt; P.fr = (P.at * 6) % 4; }
    trail.unshift({ x: P.x, y: P.y, f: 1, g: true }); if (trail.length > 400) trail.pop();
    if (G.end.t < 2.5) updateChicks(dt);
    else chicks.forEach(function (ch, i) { var tx = home.x - 150 + (i % 6) * 62 + Math.floor(i / 6) * 30, ty = FY - Math.floor(i / 6) * 4; ch.x += (tx - ch.x) * Math.min(1, dt * 3); ch.y = ty; ch.face = tx > ch.x + 2 ? 1 : tx < ch.x - 2 ? -1 : ch.face; ch.ph += dt; ch.hop = Math.abs(Math.sin(G.end.t * 8 + i)) * 10; });
    G.cam = Math.max(0, Math.min(G.len - VW, home.x + 100 - VW * 0.6));
    updateParts(dt);
    if (Math.floor(G.end.t * 2) !== Math.floor((G.end.t - dt) * 2)) burst(home.x + 60 + Math.random() * 140, FY - 120, 'spark', 4, '#ffe066');
  }
  $('endNext').addEventListener('click', function () { titleScene(); });

  var last = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    step(dt); draw();
    requestAnimationFrame(frame);
  }
  if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');
  $('rotGo').addEventListener('click', function () { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', function (e) { e.preventDefault(); document.body.classList.remove('portrait'); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && G && G.mode === 'play') togglePause(); });

  resize();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);   // 제목 글꼴이 늦게 로딩되면 scrollWidth 를 잘못 재서 안 줄어들 수 있다
  var QS = new URLSearchParams(location.search), qStage = parseInt(QS.get('stage'), 10);
  if (qStage > 0) { save.cleared = Math.max(save.cleared, qStage - 1); }
  titleScene();
  requestAnimationFrame(frame);

  window.__rt = {
    tick: function (n, dt, nodraw) { for (var i = 0; i < (n || 1); i++) step(dt || 1 / 60); if (!nodraw) draw(); },
    get G() { return G; }, get P() { return P; }, get chicks() { return chicks; }, go: startStage, key: press, save: save, draw: draw, build: buildStage
  };
})();
