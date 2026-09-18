/* 오대수 — 복도를 밀고 나가는 망치 격투.
 * 월드 높이 540, 오른쪽으로만 나아간다. 15층을 올라가면 엔딩, 그 뒤로는 끝없는 층.
 * 시험 손잡이: window.__od = { tick(n), G, P, go(stage), key(k,down) }
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('cv'), c = cv.getContext('2d');
  var FY = ART.FY, PI = Math.PI;
  var EN = /[?&]lang=en\b/.test(location.search);
  if (EN) {
    $('rotTitle').textContent = 'This game is played in landscape';
    $('rotGo').textContent = 'Rotate to landscape';
    $('rotHelp').textContent = 'If the button does nothing, unlock screen rotation and turn your phone';
    $('rotSkip').textContent = 'Play in portrait anyway';
    $('keys').textContent = '←→ Move · J Hammer (hold) · K Kick · L Grab';
    $('h1').textContent = 'ODAESU GAME'; document.title = 'Odaesu Game'; document.documentElement.lang = 'en';
  }

  // ── 저장 ──
  var save = { stage: 1, best: 0, ko: 0, ended: false };
  try { var sv = JSON.parse(localStorage.getItem('odaesu.prog') || 'null'); if (sv) save = Object.assign(save, sv); } catch (e) {}
  function store() { try { localStorage.setItem('odaesu.prog', JSON.stringify(save)); } catch (e) {} }

  // ── 화면 ──
  var W, H, S, VW, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    S = H / 540; VW = W / S;
    if (VW < 700) { S = W / 700; VW = 700; }        // 세로로 억지로 할 때
    vig = null;
    document.body.classList.toggle('portrait', innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
  }
  var vig = null;
  addEventListener('resize', resize);

  // ── 적 종류 ──
  var KINDS = {
    thug:  { hp: 30, spd: 100, reach: 90, wind: .5, act: .12, rec: .5, dmg: 6, kind: 'punch', cd: [1.1, 2.0], w: 1 },
    track: { hp: 26, spd: 125, reach: 90, wind: .42, act: .12, rec: .45, dmg: 6, kind: 'punch', cd: [0.9, 1.8], w: 1 },
    stick: { hp: 36, spd: 92, reach: 122, wind: .62, act: .14, rec: .6, dmg: 10, kind: 'over', cd: [1.3, 2.3], w: 1.05 },
    knife: { hp: 24, spd: 140, reach: 104, wind: .42, act: .14, rec: .55, dmg: 11, kind: 'stab', cd: [1.2, 2.2], w: .9 },
    fat:   { hp: 90, spd: 72, reach: 94, wind: .7, act: .16, rec: .7, dmg: 12, kind: 'bump', cd: [1.5, 2.6], w: 2.2, armor: 2 },
    boss:  { hp: 200, spd: 96, reach: 112, wind: .6, act: .14, rec: .6, dmg: 12, kind: 'over', cd: [1.0, 1.8], w: 3, armor: 2 }
  };
  var ATK_POSE = { punch: ['punchW', 'punch'], over: ['wind1', 'hit1'], stab: ['stabW', 'stab'], bump: ['bumpW', 'bump'] };

  // ── 주인공의 기술 ──
  var MOVES = {
    a1: { wind: .09, act: .08, rec: .17, dmg: 10, kb: 170, up: 0, range: 96, pw: 'wind1', ph: 'hit1', snd: 1 },
    a2: { wind: .08, act: .08, rec: .17, dmg: 10, kb: 190, up: 0, range: 98, pw: 'wind2', ph: 'hit2', snd: 1 },
    a3: { wind: .15, act: .1, rec: .3, dmg: 18, kb: 430, up: 330, range: 100, pw: 'wind3', ph: 'hit3', snd: 1.3 },
    smash: { wind: .02, act: .12, rec: .4, dmg: 30, kb: 560, up: 380, range: 124, pw: 'charge', ph: 'smash', snd: 2 },
    kick: { wind: .07, act: .1, rec: .22, dmg: 5, kb: 330, up: 0, range: 92, pw: 'idle', ph: 'kick', snd: 0, stun: .5 },
    grab: { wind: .5, act: .08, rec: .3, dmg: 0, kb: 0, up: 0, range: 70, pw: 'throwW', ph: 'throwR', snd: 0 },
    miss: { wind: .07, act: .08, rec: .2, dmg: 0, kb: 0, up: 0, range: 0, pw: 'reach', ph: 'reach', snd: 0 }
  };

  var G, P, ARENA = 700;      // 싸움 구간은 화면보다 이만큼 넓고, 카메라가 그 안에서 주인공을 따라간다
  function newPlayer() {
    return { x: 150, h: 0, vh: 0, vx: 0, face: 1, hp: 100, max: 100, st: ART.styleFor('player', 0), pose: ART.POSES.idle,
      state: 'idle', t: 0, move: null, combo: 0, buf: null, hold: 0, holding: false, inv: 0, knives: 0, blood: 0, walkP: 0,
      hurtT: 0, dead: false, grabbed: null, shake: 0 };
  }

  // ── 스테이지 만들기 ──
  function zoneOf(n) { return Math.floor(((n - 1) % 15) / 5); }
  function buildStage(n) {
    var nw = Math.min(6, 2 + Math.floor(n / 3)), waves = [];
    var pool = ['thug', 'thug', 'track'];
    if (n >= 2) pool.push('stick');
    if (n >= 4) pool.push('knife');
    if (n >= 6) pool.push('fat');
    if (n >= 9) pool.push('knife', 'stick');
    for (var i = 0; i < nw; i++) {
      var cnt = Math.min(14, 3 + Math.floor(n * 0.55) + i), q = [];
      for (var k = 0; k < cnt; k++) q.push(pool[Math.floor(Math.random() * pool.length)]);
      var last = i === nw - 1;
      if (last && n % 5 === 0) { q.push('boss'); }
      waves.push({ x: 520 + i * 560, queue: q, left: n >= 3 ? 0.25 : (n === 2 ? 0.12 : 0), maxOn: Math.min(8, 4 + Math.floor(n / 3)), done: false, started: false });
    }
    var plates = [520 + Math.floor(nw / 2) * 560 - 260];
    if (nw >= 4) plates.push(520 + (nw - 1) * 560 - 260);
    return { n: n, zone: zoneOf(n), waves: waves, len: 520 + nw * 560 + 420, plates: plates };
  }

  function startStage(n) {
    SND.unlock();
    var sd = buildStage(n);
    var keep = P && !P.dead && G && G.stage === n - 1 ? { hp: Math.min(P.max, P.hp + 40) } : null;
    P = newPlayer();
    if (keep) P.hp = keep.hp;
    G = { mode: 'play', stage: n, sd: sd, len: sd.len, zone: sd.zone, cam: 0, lock: null, enemies: [], parts: [], decals: [], pickups: [],
      t: 0, ko: 0, stop: 0, shake: 0, kx: 0, props: [], fin: null, spawnT: 0, wave: -1, elev: 0, exitT: 0, combo: 0, comboT: 0, slow: 1, time: 0, overT: 0, beatT: 0, intro: 1.3 };
    sd.plates.forEach(function (x) { G.pickups.push({ x: x, t: 0 }); });
    save.stage = n; store();
    $('stg').textContent = 'STAGE ' + n;
    $('stageT').textContent = 'STAGE ' + n;
    showPanel('stage');
    document.body.classList.remove('title');
    SND.bgm(true);
    hud();
  }

  // ── 입력 ──
  var keys = {}, pad = { x: 0 }, btn = { ham: false, kick: false, grab: false };
  var KEYMAP = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', KeyJ: 'ham', KeyZ: 'ham', KeyK: 'kick', KeyX: 'kick', KeyL: 'grab', KeyC: 'grab' };
  function press(k, down) {
    if (k === 'ham') { if (down && !btn.ham) hamDown(); if (!down && btn.ham) hamUp(); btn.ham = down; return; }
    if (k === 'kick' && down && !btn.kick) doMove('kick');
    if (k === 'grab' && down && !btn.grab) doMove('grab');
    if (k === 'kick' || k === 'grab') { btn[k] = down; return; }
    keys[k] = down;
  }
  addEventListener('keydown', function (e) {
    if (e.code === 'KeyP' || e.code === 'Escape') { if (!e.repeat) togglePause(); return; }
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) { var b = document.querySelector('.panel.on .btn'); if (b) { b.click(); e.preventDefault(); return; } }
    var k = KEYMAP[e.code]; if (!k) return;
    e.preventDefault(); if (e.repeat) return;
    press(k, true);
  });
  addEventListener('keyup', function (e) { var k = KEYMAP[e.code]; if (k) press(k, false); });
  addEventListener('blur', function () { keys = {}; if (btn.ham) hamUp(); btn = { ham: false, kick: false, grab: false }; });

  function hamDown() { if (!canAct()) { P && (P.buf = 'ham'); return; } P.holding = true; P.hold = 0; }
  function hamUp() {
    if (!P) return;
    var held = P.holding ? P.hold : 0;
    P.holding = false;
    if (held >= 0.55) doMove('smash');
    else doMove('combo');
  }
  function canAct() { return G && G.mode === 'play' && P && !P.dead && G.intro <= 0; }

  // 패드
  var padEl = $('pad'), knob = $('knob'), padId = null;
  function padMove(e) {
    var r = padEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy, R = r.width / 2, d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    var k = dx / R;
    pad.x = Math.abs(k) > 0.22 ? Math.sign(k) : 0;
  }
  padEl.addEventListener('pointerdown', function (e) { padId = e.pointerId; padEl.setPointerCapture(e.pointerId); padMove(e); e.preventDefault(); });
  padEl.addEventListener('pointermove', function (e) { if (e.pointerId === padId) padMove(e); });
  function padEnd(e) { if (e.pointerId !== padId) return; padId = null; pad.x = 0; knob.style.transform = ''; }
  padEl.addEventListener('pointerup', padEnd); padEl.addEventListener('pointercancel', padEnd);
  [['bHam', 'ham'], ['bKick', 'kick'], ['bThrow', 'grab']].forEach(function (b) {
    var el = $(b[0]);
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('on'); SND.unlock(); press(b[1], true); });
    var up = function () { el.classList.remove('on'); press(b[1], false); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });

  // ── 주인공 기술 ──
  function doMove(name) {
    if (!canAct()) return;
    if (P.hurtT > 0) { P.buf = name; return; }
    if (P.move) {
      // 연타: 휘두르는 끝물에 누르면 다음 타로 잇는다
      if (name === 'combo' && P.move.name.charAt(0) === 'a' && P.phase !== 'wind') { P.buf = 'combo'; return; }
      // 잡기는 휘두른 뒤 마무리를 끊고 바로, 휘두르는 중이면 끝나자마자
      if (name === 'grab' && P.move.name !== 'grab') {
        if (P.phase === 'rec') { P.move = null; P.combo = 0; P.comboT = 0; }
        else { P.buf = 'grab'; return; }
      } else {
        if (P.phase === 'rec' && P.t > P.move.rec * 0.5) { P.buf = name; return; }
        return;
      }
    }
    if (name === 'combo') {
      var nm = P.comboT > 0 ? (P.combo === 1 ? 'a2' : P.combo === 2 ? 'a3' : 'a1') : 'a1';
      P.combo = nm === 'a1' ? 1 : nm === 'a2' ? 2 : 3;
      startMove(nm);
    } else startMove(name);
  }
  function startMove(nm) {
    var tgt = null;
    if (nm === 'grab') {
      // 앞에 잡을 놈이 없으면 허공을 움켜쥐는 짧은 동작만
      // 앞 125 안(쓰러진 놈 포함), 없으면 바로 뒤 70 안 — 뒤에 있으면 돌아선다
      var bd = 1e9, back = null, bb = 1e9;
      G.enemies.forEach(function (e) {
        if (e.dead || e.k === 'boss' || e.state === 'air' || e.state === 'grabbed' || e.h > 30) return;
        var d = (e.x - P.x) * P.face;
        if (d > -12 && d < 125 && d < bd) { bd = d; tgt = e; }
        if (d <= -12 && d > -70 && -d < bb) { bb = -d; back = e; }
      });
      if (!tgt && back) { tgt = back; P.face = -P.face; }
      if (!tgt) nm = 'miss';
    }
    var m = MOVES[nm];
    P.move = { name: nm, m: m, hit: [] }; P.move.wind = m.wind; P.move.rec = m.rec;
    P.phase = 'wind'; P.t = 0;
    if (tgt) {
      P.grabbed = tgt; tgt.state = 'grabbed'; tgt.t = 0; tgt.rot0 = tgt.rot || 0; tgt.pose = ART.POSES.hurtGut;
      tgt.g0 = ART.bodyPoint(tgt, 0, 28);          // 처음 움켜잡은 자리(적의 가슴께)
    }
  }
  // 들어 올리기 세 토막: 움켜잡기(0~.22) → 가슴까지 끌어올리기(~.55) → 머리 위로 밀어 올리기(~1)
  function sm(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
  function liftStep(e, k) {
    var f = P.face, G0 = e.g0, G1 = [P.x + f * 36, FY - 150], G2 = [P.x + f * 6, FY - 236];
    var Gp, r, pose;
    if (k < 0.22) { Gp = G0; r = e.rot0; P.pose = ART.mix(ART.POSES.idle, ART.POSES.grabLow, sm(k / 0.12)); e.pose = ART.POSES.hurtGut; }
    else if (k < 0.55) {
      var k2 = sm((k - 0.22) / 0.33);
      Gp = [G0[0] + (G1[0] - G0[0]) * k2, G0[1] + (G1[1] - G0[1]) * k2]; r = e.rot0 + (-1.0 - e.rot0) * k2;
      P.pose = ART.mix(ART.POSES.grabLow, ART.POSES.lift, k2); e.pose = ART.mix(ART.POSES.hurtGut, ART.POSES.air, k2);
    } else {
      var k3 = sm((k - 0.55) / 0.45);
      Gp = [G1[0] + (G2[0] - G1[0]) * k3, G1[1] + (G2[1] - G1[1]) * k3]; r = -1.0 + (-PI / 2 + 1.0) * k3;
      P.pose = ART.mix(ART.POSES.lift, ART.POSES.press, k3); e.pose = ART.POSES.air;
    }
    e.face = -f; e.rot = r;
    // 적의 가슴께가 잡은 자리에 오도록 몸을 옮긴다
    e.h = 0; var tp = ART.bodyPoint(e, 0, 28); e.x += Gp[0] - tp[0]; e.h = tp[1] - Gp[1];
    // 두 손: 앞손은 가슴, 뒷손은 허리띠
    P.ik = { F: ART.bodyPoint(e, 0, 36), B: ART.bodyPoint(e, 0, 6) };
  }
  function releaseGrab() {
    var e = P.grabbed; P.grabbed = null;
    if (!e) return;
    P.ik = null;
    e.state = 'air'; e.vh = 80; e.vx = P.face * 700; e.thrown = true; e.face = -P.face; e.spin = -5; e.hitList = []; e.liftSnd = false;
    hurtEnemy(e, 8, 0, 0, 0, true);
    SND.whoosh(1.4);
  }

  function updatePlayer(dt) {
    P.inv = Math.max(0, P.inv - dt);
    P.blood = Math.max(0, P.blood - dt * 0.05);
    if (P.comboT > 0) { P.comboT -= dt; if (P.comboT <= 0) P.combo = 0; }
    if (!P.grabbed) P.ik = null;
    if (P.dead) { physFall(P, dt); return; }
    if (P.holding) P.hold += dt;
    var dir = (keys.R || pad.x > 0 ? 1 : 0) - (keys.L || pad.x < 0 ? 1 : 0);
    if (G.intro > 0 || G.exitT > 0) dir = 0;
    if (P.hurtT > 0) {
      P.hurtT -= dt; P.x += P.vx * dt; P.vx *= Math.pow(0.02, dt);
      P.pose = ART.POSES.hurt;
      if (P.hurtT <= 0 && P.buf) { var b = P.buf; P.buf = null; if (b === 'ham') { P.holding = btn.ham; P.hold = 0; } else doMove(b); }
    } else if (P.move) {
      var mv = P.move, m = mv.m;
      P.t += dt;
      // 한 걸음 내딛으며 친다
      if (P.phase === 'act' && mv.name !== 'grab' && mv.name !== 'miss') P.x += P.face * (mv.name === 'smash' ? 180 : mv.name === 'kick' ? 90 : 70) * dt;
      var base = ART.POSES.idle, pw = ART.POSES[m.pw], ph = ART.POSES[m.ph];
      if (P.phase === 'wind') {
        P.pose = ART.mix(base, pw, Math.min(1, P.t / Math.max(0.01, m.wind)));
        if (P.t >= m.wind) { P.phase = 'act'; P.t = 0; P.trail = mv.name === 'grab' || mv.name === 'miss' || mv.name === 'kick' ? null : []; if (m.snd) SND.whoosh(m.snd); else if (mv.name === 'kick') SND.whoosh(0.8); }
      } else if (P.phase === 'act') {
        P.pose = ART.mix(pw, ph, Math.min(1, P.t / (m.act * 0.6)));
        if (mv.name === 'grab') { if (P.t >= m.act) releaseGrab(); }
        else if (mv.name === 'miss') { }
        else strike(mv);
        if (P.t >= m.act) { P.phase = 'rec'; P.t = 0; }
      } else {
        P.pose = ART.mix(ph, base, Math.min(1, P.t / m.rec));
        if (P.t >= m.rec) {
          if (mv.name.charAt(0) === 'a') P.comboT = 0.35;
          if (mv.name === 'a3') { P.combo = 0; P.comboT = 0; }
          P.move = null; P.trail = null;
          if (P.buf) { var bb = P.buf; P.buf = null; if (bb === 'ham') { P.holding = btn.ham; P.hold = 0; } else doMove(bb); }
        }
      }
      if (P.grabbed && P.phase === 'wind') liftStep(P.grabbed, Math.min(1, P.t / m.wind));
    } else {
      var spd = (P.holding && P.hold > 0.2 ? 70 : 205) * (P.knives ? 0.9 : 1);
      P.vx = dir * spd;
      if (dir) { P.face = dir; }
      P.x += P.vx * dt;
      if (P.holding && P.hold > 0.2) {
        var k = Math.min(1, (P.hold - 0.2) / 0.35);
        P.pose = ART.mix(ART.POSES.idle, ART.POSES.charge, k);
        P.shake = P.hold >= 0.55 ? 1.6 : 0;
      } else {
        P.shake = 0;
        if (dir) { P.walkP += dt * 10.5; P.pose = ART.walk(P.walkP, ART.POSES.idle); }
        else P.pose = ART.mix(ART.POSES.idle, { lean: .12 + Math.sin(G.t * 2.4) * .02 }, 1);
      }
    }
    if (!P.move || (P.phase === 'rec' && P.t > 0.1)) P.trail = null;
    $('bHam').classList.toggle('charged', P.holding && P.hold >= 0.55);
    // 서 있는 적을 뚫고 지나가지 않는다
    G.enemies.forEach(function (e) {
      if (!standing(e)) return;
      var d = e.x - P.x, min = 40 * (e.st.girth);
      if (Math.abs(d) < min) { var push = (min - Math.abs(d)) * (d > 0 ? 1 : -1); P.x -= push * 0.5; e.x += push * 0.5; }
    });
    var lo = G.cam + 30, hi = Math.min(G.cam + VW - 30, G.len + 20);
    if (G.lock !== null) { lo = G.lock + 80; hi = G.lock + ARENA + VW * 0.72; }
    P.x = Math.max(lo, Math.min(hi, P.x));
    // 군만두
    for (var i = G.pickups.length - 1; i >= 0; i--) {
      var pk = G.pickups[i];
      if (Math.abs(pk.x - P.x) < 34 && P.hp < P.max) {
        var add = Math.min(35, P.max - P.hp); P.hp += add;
        G.pickups.splice(i, 1); SND.eat(); pop('+' + Math.round(add), P.x, FY - 230, 'heal'); hud();
      }
    }
  }

  function strike(mv) {
    var m = mv.m, dmg = m.dmg * (P.knives ? 1 + 0.2 * P.knives : 1), hitAny = false;
    G.enemies.forEach(function (e) {
      if (e.dead && e.state !== 'air') return;
      if (mv.hit.indexOf(e) >= 0 || e.state === 'grabbed') return;
      var d = (e.x - P.x) * P.face;
      if (d < -18 || d > m.range * (e.k === 'fat' || e.k === 'boss' ? 1.12 : 1)) return;
      if (e.h > 150) return;
      if (e.state === 'down' && mv.name !== 'smash') return;
      mv.hit.push(e); hitAny = true;
      var up = m.up;
      if (e.state === 'air') up = Math.max(up, 260);     // 공중에 뜬 놈은 계속 띄운다
      var how = mv.name === 'kick' ? 'gut' : mv.name === 'a2' ? (Math.random() < 0.55 ? 'gut' : 'head') : 'head';
      if (e.state === 'wind' || e.state === 'act') { dmg *= 1.3; }      // 휘두르려던 놈을 끊으면 더 아프다
      hurtEnemy(e, dmg, P.face * m.kb, up, m.stun || 0, false, how);
    });
    if (hitAny) {
      if (m.snd >= 2) SND.smash(); else if (mv.name === 'kick') SND.kick(); else SND.hit(m.snd);
      G.stop = m.snd >= 2 ? 0.12 : mv.name === 'a3' ? 0.08 : 0.05;
      G.shake = Math.max(G.shake, m.snd >= 2 ? 10 : mv.name === 'a3' ? 6 : 3);
      G.kx = P.face * (m.snd >= 2 ? 16 : mv.name === 'a3' ? 10 : mv.name === 'kick' ? 7 : 6);   // 친 쪽으로 화면이 밀린다
      if (mv.name !== 'kick') P.blood = Math.min(1, P.blood + 0.12);
    }
  }

  function standing(e) { return !e.dead && (e.state === 'walk' || e.state === 'wait' || e.state === 'taunt' || e.state === 'wind' || e.state === 'act' || e.state === 'rec' || e.state === 'hurt' || e.state === 'idle'); }

  function hurtEnemy(e, dmg, kb, up, stun, quiet, how) {
    var K = KINDS[e.k];
    e.hp -= dmg; e.hurtT = 0.25;
    if (!quiet) {
      G.combo++; G.comboT = 1.8; comboPop();
      blood(e.x, FY - (e.h || 0) - 150 * e.st.scale, Math.sign(kb) || P.face, dmg);
      spark(e.x - Math.sign(kb || 1) * 12, FY - (e.h || 0) - 140 * e.st.scale);
      SND.grunt(e.k === 'fat' || e.k === 'boss' ? 0.75 : 1);
    }
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; e.deadT = 0;
      G.ko++; save.ko++; hud();
      e.state = 'air'; e.vx = (kb || P.face * 300) * 1.15 / Math.sqrt(K.w); e.vh = Math.max(up, 280); e.h = Math.max(e.h, 4);
      e.spin = -4 - Math.random() * 3; e.hitList = [];
      if (Math.random() < 0.1 && P.hp < P.max * 0.7) G.pickups.push({ x: e.x, t: 0, drop: true });
      e.how = how || 'head';
      var rl = Math.random(); e.lie = rl < 0.55 ? 'back' : rl < 0.85 ? 'prone' : 'slump';
      if (e.lie === 'prone') { e.face = -e.face; e.spin = 4 + Math.random() * 3; }
      if (e.lie === 'slump') e.spin = -1.5;
      dropWeapon(e);
      finisher(e);
      return;
    }
    if (e.dead) { e.vh = Math.max(e.vh, up * 0.8); e.vx = kb * 0.8; return; }
    // 뚱보·보스는 몇 대는 버틴다
    if (e.armor > 0 && up < 300 && Math.abs(kb) < 500) { e.armor--; e.armorT = 3; e.vx = kb * 0.15; e.flinch = 0.12; return; }
    var w = K.w;
    if (up > 0 || Math.abs(kb) / w > 360) {
      e.state = 'air'; e.h = Math.max(e.h, 4); e.vh = Math.max(up, 160) / Math.sqrt(w); e.vx = kb / Math.sqrt(w); e.spin = -3 - Math.random() * 2; e.hitList = [];
    } else {
      if (e.state === 'air') { e.vh = Math.max(e.vh, 200); e.vx = kb / w; return; }
      e.state = 'hurt'; e.t = 0; e.stun = 0.42 + stun; e.vx = kb / w * 1.15; e.how = how || (Math.random() < 0.5 ? 'head' : 'gut');
    }
  }

  // ── 적 ──
  var seedN = 1;
  function spawn(k, fromLeft) {
    var K = KINDS[k], x = fromLeft ? G.cam - 60 : G.cam + VW + 60;
    var e = { k: k, x: x, h: 0, vh: 0, vx: 0, face: fromLeft ? 1 : -1, hp: K.hp, max: K.hp, st: ART.styleFor(k, seedN++ * 1.37), state: 'walk',
      t: 0, cd: 0.5 + Math.random(), walkP: Math.random() * 6, rot: 0, armor: K.armor || 0, armorT: 0, pose: ART.POSES.idle, hurtT: 0, flinch: 0 };
    if (k === 'boss') { e.hp = e.max = K.hp + Math.max(0, Math.floor(G.stage / 5) - 1) * 50; G.boss = e; $('boss').classList.add('on'); }
    G.enemies.push(e);
  }

  function updateEnemies(dt) {
    // 누가 칠 차례인가: 양쪽에서 가까운 순으로 한 명씩(스테이지가 오르면 두 명)
    var sides = { '-1': [], '1': [] };
    G.enemies.forEach(function (e) { if (standing(e) && e.state !== 'hurt') sides[e.x < P.x ? '-1' : '1'].push(e); });
    var nAtk = G.stage >= 4 ? 2 : 1;
    ['-1', '1'].forEach(function (s) {
      sides[s].sort(function (a, b) { return Math.abs(a.x - P.x) - Math.abs(b.x - P.x); });
      sides[s].forEach(function (e, i) { e.rank = i; e.atk = i < nAtk || e.state === 'wind' || e.state === 'act'; });
    });
    for (var i = G.enemies.length - 1; i >= 0; i--) {
      var e = G.enemies[i], K = KINDS[e.k];
      e.hurtT = Math.max(0, e.hurtT - dt);
      if (e.armorT > 0) { e.armorT -= dt; if (e.armorT <= 0) e.armor = K.armor || 0; }
      if (e.flinch > 0) e.flinch -= dt;
      e.t += dt;
      var dx = P.x - e.x, ad = Math.abs(dx);
      switch (e.state) {
        case 'walk': case 'wait': case 'taunt':
          e.face = dx > 0 ? 1 : -1;
          var want = e.atk ? K.reach * 0.8 : K.reach + 70 + e.rank * 58;
          var v = 0;
          if (ad > want + 8) v = K.spd; else if (ad < want - 30 && !e.atk) v = -K.spd * 0.6;
          if (e.flinch > 0) v = 0;
          e.x += e.face * v * dt;
          if (e.hp < e.max * 0.45) v *= 0.75;
          if (v) { e.walkP += dt * Math.abs(v) * 0.09; e.state = 'walk'; e.pose = ART.walk(e.walkP, e.hp < e.max * 0.45 ? ART.POSES.wounded : ART.POSES.idle, v < 0 ? .6 : 1); }
          else {
            if (e.state !== 'taunt' && !e.atk && Math.random() < dt * 0.25) { e.state = 'taunt'; e.t = 0; }
            if (e.state === 'taunt') {
              var tp = ART.mix(ART.POSES.taunt, {}, 0); tp.faF = 2.7 + Math.sin(e.t * 14) * 0.4;
              e.pose = tp; e.h = Math.abs(Math.sin(e.t * 7)) * 5;
              if (e.t > 1.1) { e.state = 'wait'; e.h = 0; }
            } else {
              e.state = 'wait';
              var hurtK = e.hp < e.max * 0.45 ? 1 : 0;      // 많이 맞은 놈은 허리를 굽히고 아파한다
              e.pose = ART.mix(ART.mix(ART.POSES.idle, ART.POSES.wounded, hurtK), { lean: (hurtK ? .3 : .12) + Math.sin(G.t * 3 + e.walkP) * .03 }, 1);
            }
          }
          e.cd -= dt;
          if (e.atk && ad < K.reach && e.cd <= 0 && !P.dead && G.intro <= 0) { e.state = 'wind'; e.t = 0; e.h = 0; e.wind = K.wind * Math.max(0.62, 1 - (G.stage - 1) * 0.03); }
          break;
        case 'wind':
          var ap = ATK_POSE[K.kind];
          e.pose = ART.mix(ART.POSES.idle, ART.POSES[ap[0]], Math.min(1, e.t / e.wind));
          e.shakeX = e.t > e.wind * 0.6 ? 1 : 0;
          if (e.t >= e.wind) { e.state = 'act'; e.t = 0; e.hitDone = false; SND.whoosh(0.7); }
          break;
        case 'act':
          ap = ATK_POSE[K.kind];
          e.pose = ART.mix(ART.POSES[ap[0]], ART.POSES[ap[1]], Math.min(1, e.t / (K.act * 0.6)));
          e.x += e.face * (K.kind === 'stab' ? 200 : 60) * dt;
          if (!e.hitDone && ad < K.reach + 16 && (P.x - e.x) * e.face > -10 && P.h < 40) { e.hitDone = true; hurtPlayer(K.dmg, e.face, K.kind === 'stab', e); }
          if (e.t >= K.act) { e.state = 'rec'; e.t = 0; }
          break;
        case 'rec':
          ap = ATK_POSE[K.kind];
          e.pose = ART.mix(ART.POSES[ap[1]], ART.POSES.idle, Math.min(1, e.t / K.rec));
          if (e.t >= K.rec) { e.state = 'wait'; e.cd = K.cd[0] + Math.random() * (K.cd[1] - K.cd[0]) - Math.min(0.5, G.stage * 0.03); }
          break;
        case 'hurt':
          // 미끄러지지 않고 뒷걸음질로 비틀비틀
          e.x += e.vx * dt; e.vx *= Math.pow(0.03, dt);
          e.walkP -= Math.abs(e.vx) * dt * 0.1;
          var hp0 = ART.POSES[e.how === 'gut' ? 'hurtGut' : 'hurtHead'];
          var hk = Math.min(1, e.t / 0.08);
          e.pose = ART.mix(ART.POSES.idle, Math.abs(e.vx) > 25 ? ART.walk(e.walkP, hp0, 0.75) : hp0, hk);
          if (e.how === 'head') e.pose.tilt = hp0.tilt * (1 - Math.min(1, e.t / e.stun) * 0.5);
          if (e.t >= e.stun) { e.state = 'wait'; e.cd = Math.max(e.cd, 0.35); }
          break;
        case 'air':
          e.vh -= 1500 * dt; e.h += e.vh * dt; e.x += e.vx * dt;
          e.rot = e.spin > 0 ? Math.min(PI / 2 + 0.25, e.rot + e.spin * dt * 0.5) : Math.max(-PI / 2 - 0.25, e.rot + e.spin * dt * 0.5);
          e.pose = ART.POSES.air;
          domino(e);
          if (e.h <= 0) {
            e.h = 0;
            if (e.vh < -420) { e.vh = -e.vh * 0.28; e.vx *= 0.6; if (e.thrown) { SND.slam(); G.shake = Math.max(G.shake, 10); dust(e.x); } else SND.fall(1); dust(e.x); G.shake = Math.max(G.shake, 5); }
            else {
              e.state = 'down'; e.t = 0; e.rot0 = e.rot; SND.fall(e.thrown ? 0.25 : 0.7); dust(e.x); e.thrown = false;
              if (!e.dead) e.rot = -PI / 2;
            }
          }
          break;
        case 'down':
          e.x += e.vx * dt; e.vx *= Math.pow(0.004, dt);
          if (Math.abs(e.vx) > 200) domino(e);
          if (e.dead) {
            e.deadT += dt;
            var lk2 = Math.min(1, e.t / 0.15), r0 = e.rot0 || 0;
            if (e.lie === 'prone') { e.rot = r0 + (PI / 2 - r0) * lk2; e.pose = ART.POSES.prone; }
            else if (e.lie === 'slump') { e.rot = r0 * (1 - lk2); e.pose = ART.mix(ART.POSES.air, ART.POSES.slump, lk2); }
            else { e.rot = r0 + (-PI / 2 - r0) * lk2; e.pose = ART.POSES.down; }
            if (e.t < 1) { e.pose = ART.mix(e.pose, { faF: e.pose.faF + Math.sin(e.t * 30) * 0.25 * (1 - e.t), thF: e.pose.thF + Math.sin(e.t * 23) * 0.12 * (1 - e.t) }, 1); }
            if (e.t > 1.1 && Math.abs(e.vx) < 5 && !e.baked) e.bakeMe = true;
          } else {
            // 산 놈은 바닥에서 꿈틀거린다
            e.rot = -PI / 2;
            e.pose = ART.mix(ART.POSES.down, { faF: 1.2 + Math.sin(e.t * 5) * 0.5, uaF: 1.0 + Math.sin(e.t * 5) * 0.3, thF: .6 + Math.sin(e.t * 3.3) * 0.25, shF: -.3 }, 1);
            if (e.t > 1.3) { e.state = 'getup'; e.t = 0; }
          }
          break;
        case 'getup':
          var gk = Math.min(1, e.t / 0.5);
          e.rot = -PI / 2 * (1 - gk);
          e.pose = gk < 0.6 ? ART.mix(ART.POSES.down, ART.POSES.kneel, gk / 0.6) : ART.mix(ART.POSES.kneel, ART.POSES.idle, (gk - 0.6) / 0.4);
          if (e.t > 0.55) { e.state = 'wait'; e.rot = 0; e.cd = 0.6; }
          break;
        case 'grabbed':
          e.pose = ART.POSES.air;
          if (!P.grabbed || P.grabbed !== e) { e.state = 'air'; e.vh = 0; e.vx = 0; }
          break;
      }
    }
    // 서 있는 적끼리 겹치지 않게
    var st = G.enemies.filter(function (e) { return standing(e) && e.state !== 'act'; }).sort(function (a, b) { return a.x - b.x; });
    for (var j = 1; j < st.length; j++) {
      var a = st[j - 1], b = st[j], min = 26 * (a.st.girth + b.st.girth);
      if (b.x - a.x < min) { var push = (min - (b.x - a.x)) / 2; a.x -= push; b.x += push; }
    }
    // 잠긴 화면 밖으로는 못 나간다(들어오는 놈은 예외)
    if (G.boss && G.boss.dead) { $('boss').classList.remove('on'); }
    if (G.boss) $('boss').querySelector('span').style.width = Math.max(0, G.boss.hp / G.boss.max * 100) + '%';
  }

  function dropWeapon(e) {
    var wk = e.st.weapon;
    if (wk !== 'stick' && wk !== 'knife' && wk !== 'pipe') return;
    e.st.weapon = 'none';
    G.props.push({ kind: wk, x: e.x, vx: e.vx * 0.5 + (Math.random() - 0.5) * 80, h: 90, vh: 220, rot: 0, spin: (Math.random() - 0.5) * 18, settled: false });
  }
  // 마지막 놈을 쓰러뜨리면: 층의 마지막이면 길게, 무리의 마지막이면 짧게 느려지며 카메라가 다가간다
  function finisher(e) {
    var w = G.sd.waves[G.wave];
    if (!w || w.queue.length) return;
    var left = G.enemies.filter(function (o) { return !o.dead; }).length;
    if (left > 0) return;
    var lastFloor = G.wave === G.sd.waves.length - 1;
    G.fin = { t: 0, dur: lastFloor ? 1.5 : 0.7, z: lastFloor ? 1.45 : 1.18, x: (e.x + P.x) / 2, y: FY - 120 };
    G.slowT = G.fin.dur; G.stop = lastFloor ? 0.16 : 0.08;
    if (lastFloor) SND.smash();
  }
  function bakeBodies() {
    var k = S * dpr, dead = 0;
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if (e.bakeMe && (!e.baked || e.baked.k !== k)) { e.baked = ART.bake(e, k); e.bakeMe = false; }
      if (e.dead) dead++;
    }
    // 너무 많이 쌓이면 제일 오래된 것부터 치운다
    if (dead > 45) { var old = G.enemies.find(function (o) { return o.dead && o.baked; }); if (old) G.enemies.splice(G.enemies.indexOf(old), 1); }
  }
  function updateProps(dt) {
    G.props.forEach(function (pr) {
      if (pr.settled) return;
      pr.vh -= 1500 * dt; pr.h += pr.vh * dt; pr.x += pr.vx * dt; pr.rot += pr.spin * dt;
      if (pr.h <= 0) {
        pr.h = 0;
        if (pr.vh < -150) { pr.vh = -pr.vh * 0.35; pr.vx *= 0.6; pr.spin *= 0.5; SND.kick(); }
        else { pr.settled = true; pr.rot = Math.round(pr.rot / PI) * PI + (Math.random() - 0.5) * 0.3; }
      }
    });
  }

  // 날아가는 몸이 서 있는 놈을 쓰러뜨린다
  function domino(e) {
    if (Math.abs(e.vx) < 220 || e.h > 110) return;
    G.enemies.forEach(function (o) {
      if (o === e || !standing(o) || (e.hitList && e.hitList.indexOf(o) >= 0)) return;
      if (Math.abs(o.x - e.x) > 34 * o.st.girth) return;
      if (Math.sign(o.x - e.x) !== Math.sign(e.vx) && Math.abs(o.x - e.x) > 8) return;
      (e.hitList = e.hitList || []).push(o);
      var big = Math.abs(e.vx) > 330;
      hurtEnemy(o, e.thrown ? 14 : 7, e.vx * 0.8, big ? 240 : 0, 0.3);
      e.vx *= 0.65;
      SND.hit(0.9); G.stop = Math.max(G.stop, 0.04); G.shake = Math.max(G.shake, 5);
    });
  }

  function hurtPlayer(dmg, dir, knife, src) {
    if (P.inv > 0 || P.dead) return;
    // 모아치는 중이거나 크게 내려칠 때는 버틴다(대신 조금 더 아프다)
    P.hp -= dmg; P.inv = 0.55; G.shake = Math.max(G.shake, 7);
    blood(P.x, FY - 160, dir, dmg);
    G.combo = 0; G.comboT = 0; comboPop();
    if (knife && P.knives < 3) { P.knives++; SND.stab(); } else SND.hurt();
    if (P.hp <= 0) { P.hp = 0; die(); hud(); return; }
    if (!(P.move && P.move.name === 'smash' && P.phase !== 'rec')) {
      P.hurtT = 0.28; P.vx = dir * 160; P.move = null; P.holding = false; if (P.grabbed) { P.grabbed.state = 'air'; P.grabbed.vh = 0; P.grabbed = null; }
    }
    if (src && src.k === 'fat') P.vx = dir * 420;
    hud();
  }
  function die() {
    P.dead = true; P.state = 'air'; P.h = 2; P.vh = 260; P.vx = -P.face * 200; P.rot = 0; P.spin = -4; P.pose = ART.POSES.air;
    G.slowT = 1.4; G.overT = 2.2; SND.bgm(false); SND.fall(1.2);
  }
  function physFall(f, dt) {
    if (f.h > 0 || f.vh > 0) {
      f.vh -= 1500 * dt; f.h += f.vh * dt; f.x += f.vx * dt; f.rot = Math.max(-PI / 2, (f.rot || 0) + f.spin * dt * 0.5);
      if (f.h <= 0) { f.h = 0; f.vh = 0; f.rot = -PI / 2; f.pose = ART.POSES.down; SND.fall(1); dust(f.x); }
    }
  }

  // ── 효과 ──
  function blood(x, y, dir, dmg) {
    var n = Math.min(8, 2 + dmg * 0.25);
    for (var i = 0; i < n; i++) {
      G.parts.push({ t: 'b', x: x + (Math.random() - .5) * 10, y: y + (Math.random() - .5) * 20, vx: dir * (60 + Math.random() * 260), vy: -80 - Math.random() * 260,
        r: 1.2 + Math.random() * 2.4, life: 1.2 });
    }
  }
  function spark(x, y) {
    for (var i = 0; i < 7; i++) {
      var a = Math.random() * PI * 2, v = 200 + Math.random() * 300;
      G.parts.push({ t: 's', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.14 + Math.random() * 0.08 });
    }
    G.parts.push({ t: 'flash', x: x, y: y, life: 0.09, r: 30 });
  }
  function dust(x) {
    for (var i = 0; i < 8; i++) G.parts.push({ t: 'd', x: x + (Math.random() - .5) * 60, y: FY, vx: (Math.random() - .5) * 120, vy: -20 - Math.random() * 40, r: 6 + Math.random() * 8, life: 0.6 });
  }
  function updateParts(dt) {
    for (var i = G.parts.length - 1; i >= 0; i--) {
      var p = G.parts[i];
      p.life -= dt;
      if (p.t === 'b') {
        p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > FY - 4 + (Math.random() * 30 - 10) && p.vy > 0) {
          if (G.decals.length > 45) G.decals.shift();
          if (Math.random() < 0.5) G.decals.push({ x: p.x, y: Math.min(FY + 20, p.y), r: p.r * (1.2 + Math.random() * 0.6), a: 0.6 });
          p.life = 0;
        }
      } else if (p.t === 's') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.8; p.vy *= 0.8; }
      else if (p.t === 'd') { p.x += p.vx * dt; p.y += p.vy * dt; p.r += 20 * dt; }
      else if (p.t === 'flash') { p.r += 120 * dt; }
      if (p.life <= 0) G.parts.splice(i, 1);
    }
  }

  // ── 흐름: 웨이브 → 잠금 → 다음 ──
  function updateFlow(dt) {
    var sd = G.sd;
    if (G.lock === null) {
      var nx = G.wave + 1;
      if (nx < sd.waves.length && P.x >= sd.waves[nx].x) {
        G.wave = nx; var wv = sd.waves[nx]; wv.started = true;
        G.lock = Math.max(G.cam, wv.x - VW * 0.45); G.spawnT = 0.2;
        $('go').classList.remove('on');
      }
    } else {
      var w = sd.waves[G.wave];
      var ct = Math.max(G.lock, Math.min(G.lock + ARENA, P.x - VW * 0.5));
      G.cam += (ct - G.cam) * Math.min(1, dt * 5);
      var alive = G.enemies.filter(function (e) { return !e.dead; }).length;
      G.spawnT -= dt;
      if (w.queue.length && G.spawnT <= 0 && alive < w.maxOn) {
        var k = w.queue.shift(); spawn(k, k !== 'boss' && Math.random() < w.left);
        G.spawnT = 0.35 + Math.random() * 0.5;
      }
      if (!w.queue.length && alive === 0) {
        w.done = true; G.lock = null; G.boss = null;
        if (G.wave < sd.waves.length - 1) $('go').classList.add('on');
        SND.clear();
      }
    }
    if (G.lock === null) {
      var target = P.x - VW * 0.38;
      G.cam = Math.max(G.cam, Math.min(target, G.len + 260 - VW));
      if (G.wave >= 0 && P.x > sd.waves[Math.min(G.wave + 1, sd.waves.length - 1)].x - 100) $('go').classList.remove('on');
    }
    // 엘리베이터
    var allDone = sd.waves.every(function (w) { return w.done; });
    if (allDone && G.elev < 1 && P.x > G.len - VW * 0.7) { if (G.elev === 0) SND.ding(); G.elev = Math.min(1, G.elev + dt * 1.2); }
    if (allDone && G.elev >= 1 && Math.abs(P.x - G.len) < 30 && G.exitT === 0 && !P.dead) { G.exitT = 0.01; P.move = null; P.holding = false; }
    if (G.exitT > 0) {
      G.exitT += dt;
      if (G.exitT > 0.5) G.elev = Math.max(0, 1 - (G.exitT - 0.5) * 1.5);
      if (G.exitT > 1.5 && G.mode === 'play') stageClear();
    }
  }

  function stageClear() {
    G.mode = 'clear'; SND.clear(); SND.bgm(false);
    save.best = Math.max(save.best, G.stage); save.stage = G.stage + 1; store();
    var mm = Math.floor(G.time / 60), ss = Math.floor(G.time % 60);
    if (G.stage === 15) {       // 15층을 깰 때마다 엔딩
      save.ended = true; store();
      startEnding();
      return;
    }
    $('clearN').textContent = '👊 ' + G.ko + '   ⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    showPanel('clear');
  }

  // ── 엔딩: 엘리베이터 문이 열리면 새벽 옥상 ──
  function startEnding() {
    G.mode = 'endscene'; G.et = 0; G.fin = null; G.kx = 0; G.shake = 0; G.props = []; G.cam = 0;
    showPanel(null); $('boss').classList.remove('on'); comboEl.classList.remove('on'); $('go').classList.remove('on');
    document.body.classList.add('title');
    var st = {}; for (var k in P.st) if (k !== '_t') st[k] = P.st[k];
    P = Object.assign(newPlayer(), { x: 190, face: 1, st: st, knives: P ? P.knives : 1, blood: 1, hp: P ? P.hp : 100 });
    SND.bgm(false); SND.ding();
  }
  function endStep(dt) {
    var t = (G.et += dt);
    var x0 = 190, x1 = VW * 0.55;
    if (t < 0.7) { P.pose = ART.mix(ART.POSES.idle, { lean: .15 }, 1); }
    else if (t < 3.7) { var k = (t - 0.7) / 3; P.x = x0 + (x1 - x0) * k; P.walkP += dt * 7.5; P.pose = ART.walk(P.walkP, ART.POSES.wounded, 0.8); }
    else {
      if (!G.dropped && t > 4.1) {      // 망치를 툭 떨어뜨린다
        G.dropped = true; P.st.weapon = 'none';
        G.props.push({ kind: 'hammer', x: P.x + 26, vx: 20, h: 70, vh: 30, rot: 0.3, spin: 7, settled: false });
      }
      var br = Math.sin(t * 2.2) * 0.02;
      P.pose = ART.mix(ART.POSES.wounded, ART.POSES.victory, Math.min(1, (t - 3.7) / 1.2));
      P.pose = ART.mix(P.pose, { lean: P.pose.lean - 0.1 + br, tilt: -0.25 }, Math.min(1, (t - 4.5) / 2));
    }
    updateProps(dt);
    if (t > 6.8 && !G.endShown) {
      G.endShown = true;
      var mm = Math.floor(G.time / 60), ss = Math.floor(G.time % 60);
      $('endN').innerHTML = '👊 ' + save.ko + '<br>15 / 15';
      // 빨간 THE END 단추를 오대수 머리 위에
      var top = (H - 540 * S) / 2, b = $('endNext');
      b.style.left = (P.x * S) + 'px'; b.style.top = (top + (FY - 262) * S) + 'px';
      showPanel('ending');
    }
  }
  function drawEnding() {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#0c0d0a'; c.fillRect(0, 0, W, H);
    var top = (H - 540 * S) / 2, t = G.et;
    var zk = Math.min(1, t / 8); zk = zk * zk * (3 - 2 * zk);
    var z = 1.45 - 0.45 * zk, fx = P.x * S, fy = top + (FY - 110) * S;
    var a = S * z;
    c.setTransform(dpr * a, 0, 0, dpr * a, dpr * (fx * (1 - z)), dpr * (fy * (1 - z) + top * z));
    ART.rooftop(c, VW, t, Math.min(1, t / 0.8), Math.min(1, t / 10));
    G.props.forEach(function (pr) { c.save(); c.translate(0, -pr.h); ART.floorWeapon(c, pr.kind, pr.x, pr.rot); c.restore(); });
    // 낮게 뜬 해가 오른쪽에 있으니 그림자는 왼쪽으로 길게
    var shg = c.createLinearGradient(P.x, 0, P.x - 260, 0); shg.addColorStop(0, 'rgba(10,5,15,0.55)'); shg.addColorStop(1, 'rgba(10,5,15,0)');
    c.fillStyle = shg; c.beginPath(); c.moveTo(P.x + 10, FY + 3); c.lineTo(P.x - 260, FY - 4); c.lineTo(P.x - 260, FY + 9); c.lineTo(P.x - 6, FY + 8); c.fill();
    ART.person(c, P, t);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 따뜻한 새벽빛 한 겹 + 가장자리 어둡게
    c.fillStyle = 'rgba(255,140,90,0.06)'; c.fillRect(0, 0, W, H);
    if (!vig) { vig = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.62)'); }
    c.fillStyle = vig; c.fillRect(0, 0, W, H);
    if (t < 0.6) { c.fillStyle = 'rgba(0,0,0,' + (1 - t / 0.6) + ')'; c.fillRect(0, 0, W, H); }
  }

  // ── 글·HUD ──
  function hud() {
    if (!P) return;
    $('hbar').firstElementChild.style.width = Math.max(0, P.hp / P.max * 100) + '%';
    $('hstat').classList.toggle('low', P.hp > 0 && P.hp < P.max * 0.3);
    $('ko').textContent = G ? G.ko : 0;
  }
  var comboEl = $('combo');
  function comboPop() {
    if (G.combo >= 3) {
      comboEl.firstElementChild.textContent = G.combo; comboEl.classList.add('on');
      comboEl.classList.remove('pump'); void comboEl.offsetWidth; comboEl.classList.add('pump');
      var praise = { 10: 'NICE', 20: 'GREAT', 30: 'EXCELLENT', 50: 'PERFECT', 80: 'LEGEND' }[G.combo];
      if (praise) pop(praise, P.x, FY - 280, 'big');
    } else comboEl.classList.remove('on');
  }
  function pop(txt, wx, wy, cls) {
    var el = document.createElement('div');
    el.className = 'pop' + (cls ? ' ' + cls : '');
    el.textContent = txt;
    el.style.left = ((wx - G.cam) * S) + 'px'; el.style.top = (wy * S + (H - 540 * S) / 2) + 'px';
    $('pops').appendChild(el);
    setTimeout(function () { el.remove(); }, 1300);
  }
  var panels = ['title', 'stage', 'clear', 'over', 'ending', 'pause'];
  function showPanel(id) { panels.forEach(function (p) { $(p).classList.toggle('on', p === id); }); }

  // ── 버튼 ──
  $('start').onclick = function () { SND.unlock(); startStage(Math.max(1, save.stage)); };
  $('newgame').onclick = function () { SND.unlock(); save.stage = 1; store(); startStage(1); };
  $('next').onclick = function () { startStage(G.stage + 1); };
  $('endNext').onclick = function () { save.stage = 1; store(); P = null; startStage(1); };   // THE END → 처음부터
  $('retry').onclick = function () { P = null; startStage(G.stage); };
  $('resume').onclick = togglePause;
  $('tPause').onclick = togglePause;
  function togglePause() {
    if (!G) return;
    if (G.mode === 'play') { G.mode = 'pause'; showPanel('pause'); SND.bgm(false); }
    else if (G.mode === 'pause') { G.mode = 'play'; showPanel(null); SND.bgm(true); }
  }
  var tSnd = $('tSnd'), tMus = $('tMus');
  function syncT() { tSnd.classList.toggle('off', !SND.on); tMus.classList.toggle('off', !SND.music); }
  tSnd.onclick = function () { SND.setOn(!SND.on); SND.unlock(); syncT(); };
  tMus.onclick = function () { SND.setMusic(!SND.music); SND.unlock(); syncT(); };
  syncT();

  // ── 타이틀 장면 ──
  var titleCast = null;
  function titleScene() {
    G = { mode: 'title', stage: 1, sd: { waves: [] }, len: 3000, zone: 0, cam: 0, lock: null, enemies: [], parts: [], decals: [], pickups: [], props: [], kx: 0, fin: null, t: 0, ko: 0, intro: 0 };
    P = newPlayer(); P.x = 330; P.knives = 1;
    titleCast = ['thug', 'stick', 'track', 'knife', 'thug', 'fat', 'thug'].map(function (k, i) {
      var e = { k: k, x: 560 + i * 78 + (k === 'fat' ? 12 : 0), h: 0, face: -1, st: ART.styleFor(k, i * 3.3 + 1), pose: ART.POSES.idle, rot: 0, walkP: i * 1.3 };
      return e;
    });
    G.enemies = titleCast;
    for (var i = 0; i < 26; i++) G.decals.push({ x: 180 + Math.random() * 700, y: FY - 10 + Math.random() * 36, r: 1.5 + Math.random() * 4, a: 0.6 });
    document.body.classList.add('title');
    if (save.stage > 1) { $('newgame').hidden = false; $('start').textContent = 'STAGE ' + save.stage; }
    $('best').textContent = save.ko ? '👊 ' + save.ko : '';
    showPanel('title');
  }

  // ── 그리기 ──
  function draw() {
    if (G && G.mode === 'endscene') { drawEnding(); return; }
    if (G && G.mode !== 'title') bakeBodies();
    var ox = G.kx || 0, oy = 0;
    if (G.shake > 0.3) { ox += (Math.random() - .5) * G.shake * 0.6; oy = (Math.random() - .5) * G.shake; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#0c0d0a'; c.fillRect(0, 0, W, H);
    var top = (H - 540 * S) / 2;
    // 결정타 클로즈업: 맞은 자리를 중심으로 확대했다가 풀린다
    var z = 1, fx = 0, fy = 0;
    if (G.fin) {
      var ft = G.fin.t, zin = Math.min(1, ft / 0.12), zout = ft > G.fin.dur ? Math.max(0, 1 - (ft - G.fin.dur) / 0.5) : 1;
      var zk = zin * zout; zk = zk * zk * (3 - 2 * zk);
      z = 1 + (G.fin.z - 1) * zk;
      fx = (G.fin.x - G.cam) * S; fy = top + G.fin.y * S;
    }
    var a = S * z, ex = fx * (1 - z) - G.cam * S * z + ox, ey = fy * (1 - z) + top * z + oy;
    c.setTransform(dpr * a, 0, 0, dpr * a, dpr * ex, dpr * ey);
    var vw = VW + 2;
    ART.bg(c, G.cam - 1, vw, G.zone, G.len, G.t, G.stage);
    if (G.mode !== 'title') ART.elevator(c, G.len, G.elev, G.t, G.zone);
    // 바닥 핏자국
    G.decals.forEach(function (d) {
      if (d.x < G.cam - 20 || d.x > G.cam + vw + 20) return;
      c.fillStyle = 'rgba(95,8,8,' + d.a + ')';
      c.beginPath(); c.ellipse(d.x, d.y, d.r * 1.8, d.r * 0.55, 0, 0, 2 * PI); c.fill();
    });
    G.pickups.forEach(function (p) { ART.dumpling(c, p.x, FY + 6, G.t); });
    // 그림자 → 쓰러진 몸 → 선 적 → 주인공
    var list = G.enemies.slice();
    G.props.forEach(function (pr) {
      if (pr.x < G.cam - 80 || pr.x > G.cam + vw + 80) return;
      c.save(); c.translate(0, -pr.h); ART.floorWeapon(c, pr.kind, pr.x, pr.rot); c.restore();
    });
    list.forEach(function (e) { if (!e.baked) ART.shadow(c, e); });
    ART.shadow(c, P);
    list.sort(function (a, b) { return (b.state === 'down' ? 1 : 0) - (a.state === 'down' ? 1 : 0); });
    list.forEach(function (e) {
      if (e === P.grabbed || e.x < G.cam - 200 || e.x > G.cam + vw + 200) return;
      if (e.baked) { c.drawImage(e.baked.cv, e.baked.x, e.baked.y, e.baked.w, e.baked.h); return; }
      e.shake = e.state === 'wind' && e.shakeX ? 1.4 : 0;
      ART.person(c, e, G.t);
    });
    if (!(G.exitT > 0.9)) ART.person(c, P, G.t);
    // 망치가 지나간 자리(흐릿한 궤적)
    if (P.trail && P.trail.length > 2) {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
      var T2 = P.trail;
      for (var ti = 1; ti < T2.length; ti++) {
        c.strokeStyle = 'rgba(255,250,235,' + (0.06 + 0.26 * ti / T2.length) + ')';
        c.lineWidth = dpr * S * (4 + 16 * ti / T2.length); c.lineCap = 'round';
        c.beginPath(); c.moveTo(T2[ti - 1][0], T2[ti - 1][1]); c.lineTo(T2[ti][0], T2[ti][1]); c.stroke();
      }
      c.restore();
    }
    if (P.grabbed) ART.person(c, P.grabbed, G.t);
    // 입자
    G.parts.forEach(function (p) {
      if (p.t === 'b') { c.fillStyle = '#8e0c0c'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill(); }
      else if (p.t === 's') { c.strokeStyle = 'rgba(255,245,220,' + Math.min(1, p.life * 8) + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); }
      else if (p.t === 'd') { c.fillStyle = 'rgba(180,170,150,' + (p.life * 0.4) + ')'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill(); }
      else if (p.t === 'flash') {   // 맞는 순간 번쩍
        var fg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); fg.addColorStop(0, 'rgba(255,250,230,' + Math.min(1, p.life * 11) + ')'); fg.addColorStop(1, 'rgba(255,230,180,0)');
        c.fillStyle = fg; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill();
      }
    });
    // 색 보정·가장자리 어둡게
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!vig) {
      vig = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.62)');
    }
    c.fillStyle = vig; c.fillRect(0, 0, W, H);
    if (P && !P.dead && P.hp < P.max * 0.3 && G.mode === 'play') {
      var k = 0.25 + 0.2 * Math.sin(G.t * 7);
      var rg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
      rg.addColorStop(0, 'rgba(120,0,0,0)'); rg.addColorStop(1, 'rgba(150,0,0,' + k + ')');
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
    }
    if (G.fin) {
      var bk = Math.min(1, G.fin.t / 0.15) * (G.fin.t > G.fin.dur ? Math.max(0, 1 - (G.fin.t - G.fin.dur) / 0.5) : 1);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H * 0.09 * bk); c.fillRect(0, H - H * 0.09 * bk, W, H * 0.09 * bk);
    }
    if (P && P.dead) { c.fillStyle = 'rgba(40,0,0,' + Math.min(0.45, (2.2 - G.overT) * 0.3) + ')'; c.fillRect(0, 0, W, H); }
  }

  // ── 한 틀 ──
  function step(dt) {
    if (!G) return;
    G.t += dt;
    if (G.mode === 'title') {
      titleCast.forEach(function (e, i) {
        e.pose = ART.mix(ART.POSES.idle, { lean: .12 + Math.sin(G.t * 2.2 + i) * .03, faF: 1.9 + Math.sin(G.t * 3 + i) * .1 }, 1);
        if (i === 2) { var tp = ART.mix(ART.POSES.taunt, {}, 0); tp.faF = 2.7 + Math.sin(G.t * 12) * 0.4; e.pose = tp; }
      });
      P.pose = ART.mix(ART.POSES.idle, { lean: .16 + Math.sin(G.t * 1.6) * .02 }, 1); P.blood = 0.8;
      return;
    }
    if (G.mode === 'endscene') { endStep(dt); return; }
    if (G.mode !== 'play') return;
    if (G.intro > 0) { G.intro -= dt; if (G.intro <= 0) showPanel(null); }
    if (G.stop > 0) { G.stop -= dt; G.shake *= 0.9; return; }
    var sdt = dt;
    if (G.slowT > 0) { G.slowT -= dt; sdt = dt * 0.35; }
    G.time += sdt;
    updatePlayer(sdt);
    updateEnemies(sdt);
    updateFlow(sdt);
    updateParts(sdt);
    updateProps(sdt);
    if (G.fin) { G.fin.t += dt; if (G.fin.t > G.fin.dur + 0.5) G.fin = null; }
    if (G.comboT > 0) { G.comboT -= sdt; if (G.comboT <= 0) { G.combo = 0; comboEl.classList.remove('on'); } }
    for (var i = 0; i < G.pickups.length; i++) G.pickups[i].t += sdt;
    G.shake *= Math.pow(0.001, dt); G.kx *= Math.pow(0.0004, dt);
    if (P.hp > 0 && P.hp < P.max * 0.3) { G.beatT -= dt; if (G.beatT <= 0) { SND.beat(); G.beatT = 0.9; } }
    if (P.dead) {
      G.overT -= dt;
      if (G.overT <= 0 && G.mode === 'play') { G.mode = 'over'; $('overN').textContent = 'STAGE ' + G.stage + '   👊 ' + G.ko; showPanel('over'); }
    }
  }

  var last = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    step(dt); draw();
    requestAnimationFrame(frame);
  }

  // ── 폰 ──
  if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');
  $('rotGo').addEventListener('click', function () { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', function (e) { e.preventDefault(); document.body.classList.remove('portrait'); });
  document.addEventListener('visibilitychange', function () { if (document.hidden && G && G.mode === 'play') togglePause(); });

  resize();
  var QS = new URLSearchParams(location.search), qStage = parseInt(QS.get('stage'), 10);
  if (qStage > 0) { save.stage = qStage; }
  titleScene();
  if (QS.get('ending')) {
    $('start').textContent = 'ENDING'; $('newgame').hidden = true;
    $('start').onclick = function () { SND.unlock(); startStage(15); G.time = 0; startEnding(); };
  }
  requestAnimationFrame(frame);

  window.__od = {
    tick: function (n, dt, nodraw) { for (var i = 0; i < (n || 1); i++) step(dt || 1 / 60); if (!nodraw) draw(); },
    get G() { return G; }, get P() { return P; }, go: startStage, key: press, save: save
  };
})();
