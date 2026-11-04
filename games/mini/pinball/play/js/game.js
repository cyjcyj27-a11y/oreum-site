// 규칙·판·입력·화면
(function () {
  const P = window.PHYS, S = window.SCENE, A = window.SND;
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toLocaleString('en-US');

  // ── 저장 ──
  let SAVE = { hi: 0, stage: 1, endings: 0, how: 0 };
  try { Object.assign(SAVE, JSON.parse(localStorage.getItem('pinball.prog') || '{}')); } catch (e) { }
  const store = () => { try { localStorage.setItem('pinball.prog', JSON.stringify(SAVE)); } catch (e) { } };

  // ── 판 목표 ──
  const STAGES = [
    { k: 'm2', ev: { bumper: 15 } },
    { k: 'm1', ev: { allLanes: 1 } },
    { k: 'm3', ev: { dropBank: 1 } },
    { k: 'm4', ev: { ramp: 2 } },
    { k: 'm5', ev: { saucer: 2 } },
    { k: 'm6', ev: { standBank: 1 } },
    { k: 'm7', ev: { orbit: 2, ramp: 2 } },
    { k: 'm8a', ev: { saucer: 3 }, then: { k: 'm8b', ev: { jackpot: 2 } } },
    { k: 'm9', ev: { allLanes: 1, dropBank: 1 } },
    { k: 'm10', ev: { boss: 12 } }
  ];

  const G = {
    mode: 'title', score: 0, balls: 3, stage: 1, phase: 0, prog: {}, mult: 1, lanes: [0, 0, 0], stands: [0, 0, 0],
    saveT: 0, multi: false, charge: 0, charging: false, skill: -1, skillArmed: false, t: 0, playT: 0,
    stats: { bumpers: 0, jackpots: 0 }, bossHP: 8, held: { L: false, R: false }, neonBoost: 0, wait: []
  };

  // ── 화면 글 ──
  function txt() {
    document.querySelectorAll('[data-t]').forEach(e => e.innerHTML = L(e.dataset.t));
    document.title = L('title');
    { const a = document.querySelector('#logo .a'); a.textContent = 'PINBALL'; }   // 크기는 .sign 의 font-size(11/4 간판)
  }

  // ── DMD(도트 점수판) ──
  const dmd = $('dmd'), dg = dmd.getContext('2d'), off = document.createElement('canvas'), og = off.getContext('2d');
  let dmdMsg = null, dmdMsgT = 0, dmdKey = '';
  function dmdSize() {
    const r = dmd.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    dmd.width = Math.round(r.width * dpr); dmd.height = Math.round(r.height * dpr); dmdKey = '';
  }
  // 5x7 점 글꼴(진짜 DMD 처럼 숫자·영문이 또렷하게)
  const FONT = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], 'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'C': ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], 'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], 'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    'G': ['01110', '10001', '10000', '10111', '10001', '10001', '01111'], 'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    'I': ['01110', '00100', '00100', '00100', '00100', '00100', '01110'], 'J': ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
    'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], 'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
    'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], 'N': ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
    'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], 'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
    'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], 'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], 'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
    'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], 'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
    'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'], 'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
    'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], 'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    ',': ['00', '00', '00', '00', '00', '01', '10'], '.': ['0', '0', '0', '0', '0', '0', '1'], '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'],
    '!': ['1', '1', '1', '1', '1', '0', '1'], ' ': ['000', '000', '000', '000', '000', '000', '000']
  };
  function dmdDraw() {
    const text = (dmdMsg || fmt(G.score)).toUpperCase();
    const key = text + '|' + dmd.width + '|' + (dmdMsg ? Math.floor(G.t * 6) % 2 : 0);
    if (key === dmdKey) return; dmdKey = key;
    const glyphs = [...text].map(ch => FONT[ch] || FONT[' ']);
    const need = glyphs.reduce((a, g) => a + g[0].length + 1, -1);
    // 점 크기: 글자 7줄 + 위아래 한 줄씩이 판 높이에 맞게, 넘치면 폭에 맞춰 줄임
    let d = dmd.height / 9.5; if ((need + 2) * d > dmd.width) d = dmd.width / (need + 2);
    const cols = Math.floor(dmd.width / d), rows = Math.floor(dmd.height / d);
    const on = new Uint8Array(cols * rows);
    let x0 = Math.floor((cols - need) / 2); const y0 = Math.floor((rows - 7) / 2);
    glyphs.forEach(g => { const w = g[0].length; for (let y = 0; y < 7; y++) for (let x = 0; x < w; x++) if (g[y][x] === '1') { const cx = x0 + x, cy = y0 + y; if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) on[cy * cols + cx] = 1; } x0 += w + 1; });
    dg.fillStyle = '#0c0603'; dg.fillRect(0, 0, dmd.width, dmd.height);
    const ox = (dmd.width - cols * d) / 2, oy = (dmd.height - rows * d) / 2, rr = d * 0.42;
    const blink = dmdMsg && (Math.floor(G.t * 6) % 2);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      dg.fillStyle = on[y * cols + x] ? (blink ? '#ffe2a0' : '#ffa21e') : '#2a1406';
      dg.beginPath(); dg.arc(ox + x * d + d / 2, oy + y * d + d / 2, rr, 0, 6.283); dg.fill();
    }
  }
  function dmdShow(t, s) { dmdMsg = t; dmdMsgT = s || 1.6; }

  // ── 큰 글자 알림 ──
  const banner = $('banner'); let banQ = [], banT = 0;
  function ban(big, small, col, dur) { banQ.push({ big, small: small || '', col: col || '#ffe14a', dur: dur || 1.6 }); }
  function banStep(dt) {
    if (banT > 0) { banT -= dt; if (banT <= 0) banner.className = ''; return; }
    const b = banQ.shift(); if (!b) return;
    banner.querySelector('b').textContent = b.big; banner.querySelector('i').innerHTML = b.small;
    banner.style.setProperty('--c', b.col); banner.className = ''; void banner.offsetWidth; banner.className = 'on'; banT = b.dur;
  }

  // ── HUD ──
  function hud() {
    $('stg').textContent = G.stage; $('balls').innerHTML = '<i></i>'.repeat(Math.max(0, G.balls));
    const st = STAGES[G.stage - 1], cur = (G.phase && st.then) ? st.then : st;
    let p = '';
    for (const k in cur.ev) {
      let n = G.prog[k] || 0, need = cur.ev[k];
      if (k === 'allLanes' && n < need) { n = G.lanes.reduce((a, b) => a + b, 0); need = 3; }
      else if (k === 'dropBank' && n < need) { n = P.drops.filter(d => !d.on).length; need = 4; }
      else if (k === 'standBank' && n < need) { n = G.stands.reduce((a, b) => a + b, 0); need = 3; }
      else if (k === 'boss') n = 12 - G.bossHP, need = 12;
      p += ` <em>${Math.min(n, need)}/${need}</em>`;
    }
    $('goal').innerHTML = L(cur.k) + p;
    $('mult').textContent = G.mult > 1 ? G.mult + 'x' : '';
  }

  // ── 인서트 불 ──
  function lights() {
    const I = S.ins;
    I.lanes.forEach((o, i) => { o.lit = G.lanes[i]; o.blink = (G.skillArmed && i === G.skill) ? 2.5 : 0; });
    const st = STAGES[G.stage - 1], ev = ((G.phase && st.then) ? st.then : st).ev;
    I.orbit.forEach(o => o.blink = ev.orbit ? 1.6 : 0);
    if (I.rampL) { I.rampL.forEach((o, i) => o.blink = ev.ramp ? 2 : 0); I.rampR.forEach(o => o.blink = ev.ramp ? 2 : 0); }
    I.saucer.forEach(o => o.blink = (ev.saucer || ev.jackpot) ? (G.multi ? 3 : 1.6) : 0);
    I.drops.forEach((o, i) => { o.lit = P.drops[i].on ? 0 : 1; o.blink = ev.dropBank && P.drops[i].on ? 1.2 : 0; });
    I.stands.forEach((o, i) => { o.lit = G.stands[i]; o.blink = ev.standBank && !G.stands[i] ? 1.2 : 0; });
    I.mult.forEach((o, i) => o.lit = G.mult >= i + 2 ? 1 : 0);
    I.stage.forEach((o, i) => { o.lit = i < G.stage - 1 ? 1 : 0; o.blink = i === G.stage - 1 ? 2 : 0; });
    if (I.lock) { const lk = G.stage === 8 && !G.phase ? (G.prog.saucer || 0) : 0; I.lock.forEach((o, i) => { o.lit = i < lk ? 1 : 0; o.blink = G.stage === 8 && !G.phase && i === lk ? 2 : 0; }); I.eb.lit = 0; I.eb.blink = G.stage % 3 === 0 ? 1.2 : 0; }
    I.save.lit = 0; I.save.blink = G.saveT > 0 ? (G.saveT < 3 ? 4 : 1.5) : 0;
  }

  function add(n, x, y, col, big) {
    const v = n * G.mult; G.score += v;
    if (x !== undefined) S.pop(x, y, fmt(v), col, big);
  }
  function later(t, fn) { G.wait.push({ t, fn }); }

  // ── 판 진행 ──
  function setupStage() {
    G.prog = {}; G.phase = 0;
    G.lanes = [0, 0, 0]; G.stands = [0, 0, 0]; P.drops.forEach(d => d.on = true);
    const isBoss = G.stage === 10;
    P.boss.on = isBoss; G.bossHP = 12;
    A.intense(isBoss);
    S.neonColor(isBoss ? 0xff2a1a : 0xff3ab0, isBoss ? 0xffa21a : 0x2ae8ff);
    if (isBoss) { A.bossRoar(); S.shake(1.2); S.flashScreen(0.3, 0xff2a10); }
    ban(L('stageN', { n: G.stage }), L(STAGES[G.stage - 1].k), isBoss ? '#ff4a2a' : '#ffe14a', 2.2);
    hud(); lights();
  }
  function ev(name, n) {
    G.prog[name] = (G.prog[name] || 0) + (n || 1);
    const st = STAGES[G.stage - 1], cur = (G.phase && st.then) ? st.then : st;
    let done = true; for (const k in cur.ev) if ((G.prog[k] || 0) < cur.ev[k]) done = false;
    if (done && cur.ev[name] !== undefined) {
      if (!G.phase && st.then) { G.phase = 1; G.prog = {}; startMulti(); }
      else stageClear();
    }
    hud(); lights();
  }
  function stageClear() {
    if (G.stage === 10) return;
    const bonus = 100000 * G.stage; G.score += bonus;
    A.stageClear(); S.flashScreen(0.6, 0xffe080); S.shake(0.5); G.neonBoost = 2;
    for (let i = 0; i < 6; i++) S.sparks(P.CX + (Math.random() - 0.5) * 12, 10 + Math.random() * 20, 1, [0xffe14a, 0xff2fa8, 0x22e6ff][i % 3], 30, 14);
    ban(L('stageClear'), '+' + fmt(bonus), '#8dff3a', 1.8);
    if (G.stage % 3 === 0) { G.balls++; later(1.9, () => { A.extra(); ban('EXTRA BALL', '', '#22e6ff', 1.4); }); }
    G.stage++; G.phase = 0; G.prog = {}; G.saveT = Math.max(G.saveT, 6);
    if (G.stage > SAVE.stage) { SAVE.stage = G.stage; store(); }
    later(1.9, setupStage);
  }

  // ── 공 ──
  function liveBalls() { return P.balls.filter(b => b.alive).length; }
  function serve() {
    const b = P.newBall(P.LANE_X, P.LANE_Y); b.lane = true; b.held = true;
    G.skill = Math.floor(Math.random() * 3); G.skillArmed = true; G.charge = 0;
    $('plunge').hidden = false; lights(); hud();
  }
  function heldBall() { return P.balls.find(b => b.lane && b.held); }
  function launch() {
    const b = heldBall(); if (!b) return;
    const k = Math.min(1, G.charge);
    b.held = false; b.vy = 47 + k * 19; b.vx = 0;
    A.launch(k); S.sparks(P.LANE_X, 1.5, 0.6, 0xffc23a, 14, 6);
    G.charge = 0; G.charging = false; $('plunge').hidden = true;
  }
  function startMulti() {
    G.multi = true; A.multiball(); A.intense(true); ban('MULTIBALL', L('m8b'), '#ff2fa8', 2.2);
    S.flashScreen(0.5, 0xff2fa8); S.shake(0.6); G.saveT = Math.max(G.saveT, 12);
    later(0.6, () => { const b = P.newBall(P.saucer.x, P.saucer.y); b.cap = 1; P.eject(b); A.eject(); });
    later(1.4, () => { const b = P.newBall(P.LANE_X, 3); b.lane = true; b.vy = 55; A.launch(0.8); });
  }

  // ── 부딪힘 처리 ──
  let lastWall = 0;
  P.setHit(function (tag, o, b, sp, idx) {
    if (G.mode !== 'play') return;
    switch (tag) {
      case 'wall': case 'guide': case 'lanepost': case 'slingside': case 'gate': case 'gate2': case 'rampwall': case 'rampFail':
        if (G.t - lastWall > 0.04 && sp > 3) { lastWall = G.t; A.wall(sp); } break;
      case 'post': if (sp > 3) A.post(sp); break;
      case 'flipper': A.flipHit(sp); break;
      case 'clack': A.clack(sp); break;
      case 'bumper': {
        S.hitBumper(o.i); A.bumper(); S.shake(0.22);
        const col = [0xff2fa8, 0x22e6ff, 0xffc23a][o.i];
        S.sparks(o.x, o.y, 1.2, col, 22, 10); S.lightAt(o.i % 2, o.x, o.y, col, 70);
        add(1000, o.x, o.y + 1.2, ['#ff6ad0', '#6af0ff', '#ffd25a'][o.i]); G.stats.bumpers++; ev('bumper'); break;
      }
      case 'sling': {
        const i = o.side === 'L' ? 0 : 1; S.hitSling(i); A.sling(); S.shake(0.15);
        S.sparks(b.x, b.y, 0.6, 0xffc040, 12, 8); add(100); break;
      }
      case 'drop': {
        if (!o.on) break; o.on = false; A.drop(); S.sparks(o.ax, (o.ay + o.by) / 2, 0.7, 0xffd23a, 16, 8);
        add(3000, o.ax + 1, o.ay + 0.5, '#ffd25a');
        if (P.drops.every(d => !d.on)) {
          add(25000, 4, 17, '#ffe14a', true); A.allLanes(); S.flashScreen(0.25, 0xffd23a); dmdShow('DROP BANK'); ev('dropBank');
          later(1.2, () => { P.drops.forEach(d => d.on = true); lights(); hud(); });
        } else { lights(); hud(); }
        break;
      }
      case 'stand': {
        S.hitStand(o.i); A.stand(); S.sparks(o.ax, (o.ay + o.by) / 2, 0.6, 0xff3a2a, 14, 7);
        add(2000, o.ax - 1.2, o.ay + 0.5, '#ff6a5a');
        G.stands[o.i] = 1;
        if (G.stands.every(v => v)) { add(20000, 15.5, 15, '#ff6a5a', true); A.allLanes(); dmdShow('RED TARGETS'); ev('standBank'); later(0.9, () => { G.stands = [0, 0, 0]; lights(); hud(); }); }
        else { lights(); hud(); }
        break;
      }
      case 'lane': {
        const i = o.i; A.lane(i);
        if (G.skillArmed) {
          G.skillArmed = false;
          if (i === G.skill) { add(100000, P.laneX[i], 34.5, '#22e6ff', true); A.skill(); ban('SKILL SHOT', '', '#22e6ff', 1.3); S.flashScreen(0.3, 0x22e6ff); }
        }
        if (!G.lanes[i]) { G.lanes[i] = 1; add(5000, P.laneX[i], 34, '#ffd25a'); S.sparks(P.laneX[i], 32.4, 0.4, 0xffc23a, 10, 5); }
        if (G.lanes.every(v => v)) {
          G.mult = Math.min(5, G.mult + 1); add(20000, P.CX, 31, '#ffe14a', true); A.allLanes(); dmdShow(G.mult + 'X'); S.flashScreen(0.2, 0xffc23a);
          ev('allLanes'); later(0.8, () => { G.lanes = [0, 0, 0]; lights(); hud(); });
        } else { lights(); hud(); }
        break;
      }
      case 'ramp': {
        const L = o.name === 'L'; A.orbit(); S.flasher && S.flasher(L ? 0 : 1);
        add(30000, o.cx, o.top + 2.5, L ? '#6af0ff' : '#ffd25a', true); S.sparks(o.cx, o.top, 0.6, L ? 0x22e6ff : 0xffc23a, 22, 9);
        if (G.lastRamp && G.lastRamp.side !== o.name && G.t - G.lastRamp.t < 7) { add(75000, P.CX, 26, '#ff6ad0', true); A.jackpot(); ban('COMBO', '', '#ff2fa8', 1.2); S.flashScreen(0.25, 0xff2fa8); }
        else dmdShow('RAMP');
        G.lastRamp = { side: o.name, t: G.t }; ev('ramp'); break;
      }
      case 'rampDone': A.eject(); break;
      case 'orbit': {
        if (b.vy < 6) break;
        A.orbit(); add(25000, 2.5, 26, '#6af0ff', true); S.sparks(1, 24, 0.6, 0x22e6ff, 18, 8); S.lightAt(1, 1, 25, 0x22e6ff, 80);
        dmdShow('ORBIT'); ev('orbit'); break;
      }
      case 'saucer': {
        A.saucer(); S.lightAt(0, P.saucer.x, P.saucer.y, 0x6affd8, 80);
        if (G.multi && G.phase === 1) {
          add(250000, P.saucer.x - 2, 23, '#ff6ad0', true); A.jackpot(); G.stats.jackpots++; ban('JACKPOT', '', '#ff2fa8', 1.5);
          S.flashScreen(0.6, 0xff2fa8); S.shake(0.8); for (let i = 0; i < 4; i++) S.sparks(P.saucer.x, P.saucer.y, 1, 0xff2fa8, 30, 14);
          ev('jackpot');
        } else { add(15000, P.saucer.x - 1.5, 22.5, '#6affd8', true); dmdShow('HOLE'); ev('saucer'); }
        later(1.1, () => { if (b.alive && b.cap) { P.eject(b); A.eject(); S.sparks(P.saucer.x, P.saucer.y, 0.5, 0x6affd8, 20, 9); S.shake(0.2); } });
        break;
      }
      case 'boss': {
        if (!P.boss.on || G.bossHP <= 0) break;
        G.bossHP--; S.hitBoss(); A.boss(); S.shake(0.7); S.flashScreen(0.18, 0xff2a10);
        for (let i = 0; i < 3; i++) S.sparks(P.boss.x, P.boss.y, 1.4, i ? 0xff3a1a : 0xffd23a, 26, 13);
        add(50000, P.boss.x, P.boss.y + 2, '#ff5a3a', true); dmdShow(G.bossHP ? 'HIT ' + (12 - G.bossHP) + '/12' : 'K.O.');
        ev('boss');
        if (G.bossHP <= 0) bossDown();
        break;
      }
      case 'relane': G.charge = 0; $('plunge').hidden = false; break;
      case 'nudge': break;
      case 'launched': if (G.saveT <= 0 || G.saveT > 10) G.saveT = 10; lights(); break;
      case 'drain': drain(b); break;
    }
  });

  function drain(b) {
    const left = liveBalls();     // 빠진 공은 이미 alive=false
    S.sparks(b.x, 0, 0.3, 0x22e6ff, 8, 4);
    if (left > 0) { if (left === 1 && G.multi) { G.multi = false; A.intense(G.stage === 10); } return; }
    if (G.saveT > 0 && G.mode === 'play') {
      A.save(); ban('BALL SAVED', '', '#22e6ff', 1.3); G.saveT = 0;
      later(0.7, () => { const nb = P.newBall(P.LANE_X, 3); nb.lane = true; nb.vy = 50; A.launch(0.7); });
      return;
    }
    G.multi = false; G.balls--; A.drain(); S.shake(0.3); hud();
    if (G.balls <= 0) { later(1.2, gameOver); return; }
    G.ballNo++; ban('BALL ' + G.ballNo, '', '#ffffff', 1.2);
    later(1.3, serve);
  }

  function bossDown() {
    G.mode = 'ending';
    A.bgmStop(); A.ending(); S.flashScreen(1, 0xffffff); S.shake(1.6);
    for (let i = 0; i < 12; i++) later(i * 0.12, () => { S.sparks(P.boss.x + (Math.random() - 0.5) * 3, P.boss.y + (Math.random() - 0.5) * 3, 1.5, [0xffe14a, 0xff2fa8, 0x22e6ff, 0xff3a1a][i % 4], 40, 18); S.shake(0.6); });
    ban(L('bossDown'), '+1,000,000', '#ffe14a', 2.6);
    G.score += 1000000 + G.balls * 200000;
    later(1.2, () => { P.boss.on = false; });
    later(3.2, ending);
  }

  // ── 시작·끝 ──
  function clearBalls() { P.balls.length = 0; S.ballMeshes.forEach(m => m.visible = false); }
  function startGame(stage) {
    A.init(); A.bgmStart();
    clearBalls(); G.wait = []; banQ = []; banT = 0; banner.className = '';
    Object.assign(G, { mode: 'play', score: 0, balls: 3, ballNo: 1, stage: stage || 1, mult: 1, multi: false, saveT: 0, playT: 0, stats: { bumpers: 0, jackpots: 0 } });
    document.body.classList.add('playing'); S.camMode('play');
    ['title', 'over', 'ending', 'pause'].forEach(id => $(id).hidden = true);
    setupStage(); later(0.8, serve);
  }
  function gameOver() {
    G.mode = 'over'; A.over(); A.intense(false);
    if (G.score > SAVE.hi) SAVE.hi = G.score; store();
    $('overScore').textContent = fmt(G.score); $('overStage').textContent = L('stageN', { n: G.stage });
    $('overCont').hidden = G.stage <= 1; $('overCont').querySelector('span').textContent = EN ? 'CONTINUE ' + G.stage : L('cont') + ' ' + L('stageN', { n: G.stage });
    $('over').hidden = false; document.body.classList.remove('playing');
    makeCard(false);
  }
  function ending() {
    SAVE.endings = (SAVE.endings || 0) + 1; if (G.score > SAVE.hi) SAVE.hi = G.score; SAVE.stage = 1; store();
    G.mode = 'end'; $('ending').hidden = false; document.body.classList.remove('playing');
    makeCard(true);
  }
  function rank(s) { return s >= 20e6 ? L('r4') : s >= 10e6 ? L('r3') : s >= 5e6 ? L('r2') : L('r1'); }

  // ── 결과 카드 1080x1350 ──
  let cardURL = '', shareTxt = '';
  function mm(t) { t = Math.round(t); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  function oreumMark(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.translate(-14, -68); g.fillStyle = '#fff';
    g.fill(new Path2D('M32,126 C44,112 62,86 76,78 L116,78 C130,86 144,110 150,126 Z')); g.fill(new Path2D('M20,121 C62,110 124,108 160,116 C126,131 58,134 20,121 Z'));
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(96, 77, 13, 4, 0, 0, 7); g.fill();
    g.lineWidth = 4.5; g.lineCap = 'round'; g.stroke(new Path2D('M32,117 C66,104 112,101 150,108')); g.restore();
  }
  function makeCard(win) {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    // 배경: 지금 판 화면
    S.clearPops(); S.render(0, G.t, G); const src = S.canvas();
    const sc = Math.max(W / src.width, H / src.height); g.drawImage(src, (W - src.width * sc) / 2, (H - src.height * sc) / 2, src.width * sc, src.height * sc);
    let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(10,4,24,.55)'); gr.addColorStop(0.45, 'rgba(10,4,24,.78)'); gr.addColorStop(1, 'rgba(6,2,14,.95)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 크롬 테
    g.lineWidth = 14; g.strokeStyle = '#d8dde8'; g.strokeRect(24, 24, W - 48, H - 48); g.lineWidth = 4; g.strokeStyle = win ? '#ffd23a' : '#ff2fa8'; g.strokeRect(44, 44, W - 88, H - 88);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const T = (s, x, y, size, col, font, stroke) => { g.font = `400 ${size}px ${font || "Ttl, 'Black Han Sans', sans-serif"}`; if (stroke) { g.lineWidth = stroke; g.strokeStyle = '#12021e'; g.lineJoin = 'round'; g.strokeText(s, x, y); } g.fillStyle = col; g.fillText(s, x, y); };
    g.shadowColor = '#ff2fa8'; g.shadowBlur = 30; T('PINBALL', W / 2, 170, 120, '#ffe14a', null, 14); g.shadowBlur = 0;
    if (win) {
      T(L('endName'), W / 2, 310, 76, '#ffffff', null, 10);
      T((SAVE.endings <= 1 ? L('firstEnd') : L('endingN', { n: SAVE.endings })) + ' · ' + L('endLine'), W / 2, 395, 36, '#ffc23a', "'Black Han Sans', sans-serif");
    } else {
      T('GAME OVER', W / 2, 320, 92, '#ff4a6a', null, 12);
    }
    // 점수판(DMD 느낌)
    g.fillStyle = '#0c0603'; g.fillRect(120, 470, W - 240, 190); g.strokeStyle = '#ff9a1a'; g.lineWidth = 4; g.strokeRect(120, 470, W - 240, 190);
    g.shadowColor = '#ff9a1a'; g.shadowBlur = 24; T(fmt(G.score), W / 2, 570, 120, '#ff9a1a'); g.shadowBlur = 0;
    const rows = [[L('stage'), win ? '10 / 10' : G.stage + ' / 10'], [L('time'), mm(G.playT)], [L('bumpers'), fmt(G.stats.bumpers)], [L('jackpots'), String(G.stats.jackpots)]];
    rows.forEach((r, i) => {
      const y = 740 + i * 92; g.textAlign = 'left'; g.font = "400 46px 'Black Han Sans', sans-serif"; g.fillStyle = '#c8b8ff'; g.fillText(r[0], 170, y);
      g.textAlign = 'right'; g.font = "400 56px Ttl, 'Black Han Sans', sans-serif"; g.fillStyle = '#ffffff'; g.fillText(r[1], W - 170, y);
      g.fillStyle = 'rgba(200,184,255,.25)'; g.fillRect(170, y + 40, W - 340, 3);
    });
    g.textAlign = 'center';
    // 칭호
    const rk = win ? rank(G.score) : L('stageN', { n: G.stage });
    g.font = "400 64px Ttl, 'Black Han Sans', sans-serif"; const rw = g.measureText(rk).width + 110;
    g.fillStyle = win ? '#ff2fa8' : '#3a2a6a'; roundRect(g, (W - rw) / 2, 1100, rw, 104, 52); g.fill(); g.lineWidth = 6; g.strokeStyle = '#ffe14a'; g.stroke();
    T(rk, W / 2, 1154, 64, '#ffffff', null, 8);
    oreumMark(g, W / 2 - 215, 1268, 0.42); g.font = "400 38px 'Black Han Sans', sans-serif"; g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('oreumgames.com', W / 2 - 140, 1272);
    try { cardURL = c.toDataURL('image/png'); } catch (e) { cardURL = ''; }
    shareTxt = win ? L('shareText', { s: fmt(G.score), r: rk }) : L('shareOver', { s: fmt(G.score), n: G.stage });
    const img = win ? $('endImg') : $('overImg'); if (img && cardURL) img.src = cardURL;
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function saveCard() { if (!cardURL) return; const a = document.createElement('a'); a.href = cardURL; a.download = 'pinball.png'; document.body.appendChild(a); a.click(); a.remove(); }
  function shareCard() {
    const url = EN ? 'https://oreumgames.com/en/games/mini/pinball/' : 'https://oreumgames.com/games/mini/pinball/';
    if (navigator.share) { navigator.share({ title: L('title'), text: shareTxt, url }).catch(() => { }); return; }
    const s = shareTxt + ' ' + url;
    (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).catch(() => { const t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { } t.remove(); });
    toast(L('copied'));
  }
  function toast(s) { const t = $('toast'); t.textContent = s; t.className = ''; void t.offsetWidth; t.className = 'on'; }

  // ── 입력 ──
  function flip(side, on) {
    const f = P.flippers[side === 'L' ? 0 : 1];
    if (f.held === on) return; f.held = on; G.held[side] = on;
    if (G.mode !== 'play') return;
    if (on) {
      A.flip();
      // 레인 바꾸기
      const l = G.lanes; if (l.some(v => v) && !l.every(v => v)) G.lanes = side === 'L' ? [l[1], l[2], l[0]] : [l[2], l[0], l[1]];
      lights();
    }
  }
  function chargeOn() { if (G.mode === 'play' && heldBall()) { A.init(); G.charging = true; } }
  function chargeOff() { if (G.charging) launch(); G.charging = false; }

  const keyL = ['ArrowLeft', 'KeyZ', 'ShiftLeft', 'KeyA'], keyR = ['ArrowRight', 'Slash', 'ShiftRight', 'KeyL', 'KeyD'], keyP = ['Space', 'ArrowDown', 'Enter', 'KeyS'];
  addEventListener('keydown', e => {
    if (e.repeat) { if (keyL.concat(keyR, keyP).includes(e.code)) e.preventDefault(); return; }
    if (keyL.includes(e.code)) { flip('L', true); e.preventDefault(); }
    else if (keyR.includes(e.code)) { flip('R', true); e.preventDefault(); }
    else if (keyP.includes(e.code)) { e.preventDefault(); if (G.mode === 'title' && !$('how').hidden) return closeHow(); if (G.mode === 'play') chargeOn(); }
    else if (e.code === 'KeyP' || e.code === 'Escape') { if (!$('how').hidden) closeHow(); else togglePause(); }
    else if (e.code === 'KeyM') setBgm(!A.st.bgm);
    else if (e.code === 'KeyK') setSfx(!A.st.sfx);
  });
  addEventListener('keyup', e => {
    if (keyL.includes(e.code)) flip('L', false);
    else if (keyR.includes(e.code)) flip('R', false);
    else if (keyP.includes(e.code)) chargeOff();
  });
  // 손가락: 왼쪽 반·오른쪽 반
  const touches = new Map();
  const pad = $('touch');
  pad.addEventListener('pointerdown', e => {
    if (G.mode !== 'play') return; e.preventDefault(); A.init();
    const side = e.clientX < innerWidth / 2 ? 'L' : 'R';
    if (side === 'R' && heldBall() && liveBalls() === 1) { touches.set(e.pointerId, 'P'); chargeOn(); return; }
    touches.set(e.pointerId, side); flip(side, true);
    try { pad.setPointerCapture(e.pointerId); } catch (er) { }
  });
  const up = e => {
    const s = touches.get(e.pointerId); if (!s) return; touches.delete(e.pointerId);
    if (s === 'P') { chargeOff(); return; }
    if (![...touches.values()].includes(s)) flip(s, false);
  };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up); pad.addEventListener('lostpointercapture', up);
  const pl = $('plunge');
  pl.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); chargeOn(); try { pl.setPointerCapture(e.pointerId); } catch (er) { } });
  pl.addEventListener('pointerup', e => { e.stopPropagation(); chargeOff(); }); pl.addEventListener('pointercancel', chargeOff);

  // ── 단추 ──
  function setBgm(v) { A.setBgm(v); $('tBgm').classList.toggle('off', !v); }
  function setSfx(v) { A.setSfx(v); $('tSfx').classList.toggle('off', !v); }
  function togglePause() {
    if (G.mode === 'play') { G.mode = 'pause'; $('pause').hidden = false; A.bgmStop(); }
    else if (G.mode === 'pause') { G.mode = 'play'; $('pause').hidden = true; A.bgmStart(); }
  }
  function goTitle() {
    clearBalls(); G.mode = 'title'; P.boss.on = false; G.wait = []; A.bgmStop(); A.intense(false);
    ['over', 'ending', 'pause'].forEach(id => $(id).hidden = true); $('title').hidden = false; $('plunge').hidden = true;
    document.body.classList.remove('playing'); S.camMode('title'); titleInfo();
  }
  function titleInfo() {
    $('hiTxt').textContent = SAVE.hi ? L('best') + ' ' + fmt(SAVE.hi) : '';
    $('bCont').hidden = !(SAVE.stage > 1); $('bCont').querySelector('span').textContent = EN ? 'CONTINUE ' + SAVE.stage : L('cont') + ' ' + L('stageN', { n: SAVE.stage });
  }
  const click = (id, fn) => $(id).addEventListener('click', e => { A.init(); A.click(); fn(e); });
  click('bStart', () => { if (!SAVE.how) openHow(() => startGame(1)); else startGame(1); });
  click('bCont', () => startGame(SAVE.stage));
  // ? 단추: 일시정지 창은 띄우지 않고 게임만 멈춘 뒤 설명을 보여 줌
  let howPaused = false;
  click('tHow', () => { if (!$('how').hidden) return; howPaused = G.mode === 'play'; if (howPaused) { G.mode = 'pause'; A.bgmStop(); } openHow(null); });
  click('tPause', () => { if ($('how').hidden) togglePause(); });
  click('bResume', togglePause);
  click('bHome', goTitle); click('bHome2', goTitle); click('bHome3', goTitle);
  click('bRetry', () => startGame(1)); click('overCont', () => startGame(G.stage));
  click('bSave1', saveCard); click('bShare1', shareCard); click('bSave2', saveCard); click('bShare2', shareCard);
  click('tBgm', () => setBgm(!A.st.bgm)); click('tSfx', () => setSfx(!A.st.sfx));
  $('tBgm').classList.toggle('off', !A.st.bgm); $('tSfx').classList.toggle('off', !A.st.sfx);

  // ── HOW TO PLAY ──
  let howNext = null;
  function openHow(next) { howNext = next; $('how').hidden = false; window.HOW && HOW.start(); }
  function closeHow() { $('how').hidden = true; window.HOW && HOW.stop(); SAVE.how = 1; store(); const n = howNext; howNext = null; if (n) n(); else if (howPaused && G.mode === 'pause') { howPaused = false; G.mode = 'play'; A.bgmStart(); } }
  click('bHowOk', closeHow);

  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'play') togglePause(); });

  // ── 돌리기 ──
  function step(dt, nr) {
    G.t += dt;
    if (G.mode === 'play' || G.mode === 'ending') {
      if (G.mode === 'play') G.playT += dt;
      // 대기 일
      for (let i = G.wait.length - 1; i >= 0; i--) { const w = G.wait[i]; w.t -= dt; if (w.t <= 0) { G.wait.splice(i, 1); w.fn(); } }
      if (G.charging) { const before = G.charge; G.charge = Math.min(1, G.charge + dt * 1.1); if (Math.floor(before * 8) !== Math.floor(G.charge * 8)) A.plungeCharge(G.charge); }
      if (G.saveT > 0 && !heldBall()) { G.saveT -= dt; if (G.saveT <= 0 || Math.floor(G.saveT + dt) !== Math.floor(G.saveT)) lights(); }
      if (P.boss.on) { G.bossPh = (G.bossPh || 0) + dt * (0.8 + (12 - G.bossHP) * 0.09); P.boss.x = P.CX + Math.sin(G.bossPh) * 3.6; }
      P.step(dt);
      if (G.mode === 'play' && !P.balls.length && !G.wait.length && G.balls > 0) serve();
    } else if (G.mode === 'title') {
      // 타이틀: 플리퍼가 가끔 움직임
      P.flippers[0].held = Math.sin(G.t * 1.7) > 0.93; P.flippers[1].held = Math.sin(G.t * 1.3 + 1) > 0.93; P.step(dt);
    }
    G.neonBoost = Math.max(0, G.neonBoost - dt * 1.5);
    if (dmdMsgT > 0) { dmdMsgT -= dt; if (dmdMsgT <= 0) dmdMsg = null; }
    banStep(dt);
    $('plungeBar').style.transform = `scaleY(${G.charge})`;
    if (nr) return;
    if (G.mode !== 'title') dmdDraw();
    S.render(dt, G.t, G);
  }

  // ── 시작 ──
  let last = 0;
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; step(dt); requestAnimationFrame(loop); }
  function layout() { S.setTop(document.body.classList.contains('playing') || G.mode !== 'title' ? $('hud').getBoundingClientRect().bottom : $('hud').getBoundingClientRect().bottom); dmdSize(); }
  window.addEventListener('resize', () => setTimeout(layout, 30));
  function boot() {
    txt();
    S.build($('cv'));
    layout(); S.camMode('title'); titleInfo();
    S.compile();
    $('load').hidden = true; $('title').hidden = false;
    requestAnimationFrame(loop);
  }
  const fontsReady = document.fonts && document.fonts.load ? Promise.all([document.fonts.load("400 40px Ttl"), document.fonts.load("400 20px 'Black Han Sans'")]).catch(() => { }) : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]).then(boot);

  window.__pin = { G, P, S, step, startGame, dmdShow, launch: () => { G.charge = 0.7; launch(); }, launchK: k => { G.charge = k; launch(); }, flip, gameOver, bossDown, stageClear, ev };
})();
