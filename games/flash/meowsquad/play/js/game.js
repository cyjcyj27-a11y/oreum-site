/* 야옹 편대 — 게임 본체 */
(function () {
  'use strict';
  var ART = window.MSArt, AU = window.MSAudio;
  var KEY = 'meowsquad';
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('c'), ctx = cv.getContext('2d');
  var body = document.body;
  var EN = /[?&]lang=en/.test(location.search);
  if (EN) { body.classList.add('en'); document.documentElement.lang = 'en'; document.title = 'MEOWSQUAD'; [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); }); }
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) body.classList.add('touch');

  ART.init();

  // ── 저장 ──
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(KEY + '.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(KEY + '.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var rec = store.get('rec', { stage: 0, score: 0 });
  var dexAll = store.get('dex', []);

  // ── 화면 크기: 가로 540 고정, 세로는 폰 비율 따라 960~1170 ──
  var W = 540, H = 960, scale = 1, offX = 0, offY = 0, dpr = 1, cw = 0, ch = 0, TOPY = 150;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1); cw = innerWidth || 540; ch = innerHeight || 960;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    var asp = cw / ch;
    H = asp < 540 / 960 ? Math.min(1170, 540 / asp) : 960;
    scale = Math.min(cw / W, ch / H); offX = (cw - W * scale) / 2; offY = (ch - H * scale) / 2;
    if (VIEW.zoom !== 1) { scale *= VIEW.zoom; offY = (ch - H * scale) / 2; }
    if (VIEW.offX !== null) offX = VIEW.offX;
    if (VIEW.offY !== null) offY = VIEW.offY;
    TOPY = Math.max(150, H * 0.16);
  }
  var VIEW = { offX: null, offY: null, cover: false, zoom: 1 };
  resize(); addEventListener('resize', resize);

  // ── 작은 그림 ──
  var pbSpr = ART.mk(22, 44, function (g) {
    var gr = g.createRadialGradient(11, 22, 1, 11, 22, 21); gr.addColorStop(0, 'rgba(200,255,255,1)'); gr.addColorStop(0.45, 'rgba(90,220,255,.55)'); gr.addColorStop(1, 'rgba(60,160,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 22, 44);
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(11, 20, 4, 14, 0, 0, 7); g.fill();
  });
  var wbSpr = ART.mk(12, 28, function (g) {
    var gr = g.createRadialGradient(6, 14, 1, 6, 14, 13); gr.addColorStop(0, 'rgba(190,255,200,.9)'); gr.addColorStop(1, 'rgba(80,255,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 12, 28);
    g.fillStyle = '#f0fff0'; g.beginPath(); g.ellipse(6, 14, 2.5, 9, 0, 0, 7); g.fill();
  });
  var ebSpr = ART.mk(26, 26, function (g) {
    var gr = g.createRadialGradient(13, 13, 1, 13, 13, 13); gr.addColorStop(0, '#fff'); gr.addColorStop(0.3, '#ff9ad8'); gr.addColorStop(0.6, 'rgba(255,60,160,.55)'); gr.addColorStop(1, 'rgba(255,60,160,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 26, 26);
  });
  var powerSpr = ART.mk(56, 56, function (g) {
    var gr = g.createRadialGradient(28, 28, 6, 28, 28, 28); gr.addColorStop(0, 'rgba(255,220,120,.7)'); gr.addColorStop(1, 'rgba(255,160,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 56, 56);
    ART.fishDraw(g, 30, 28, 17, true);
  });

  // 고양이 귀 달린 폭탄
  var bombSpr = ART.mk(56, 62, function (g) {
    var cx = 28, cy = 38, r = 20;
    [-1, 1].forEach(function (s) {                          // 귀
      g.beginPath(); g.moveTo(cx + s * 17, cy - 9); g.lineTo(cx + s * 19, cy - 27); g.lineTo(cx + s * 5, cy - 18); g.closePath();
      g.fillStyle = '#2a2436'; g.fill(); g.strokeStyle = '#0e0b14'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.moveTo(cx + s * 15, cy - 12); g.lineTo(cx + s * 17, cy - 23); g.lineTo(cx + s * 8, cy - 17); g.closePath();
      g.fillStyle = '#ff7aa0'; g.fill();
    });
    var gr = g.createRadialGradient(cx - 7, cy - 8, 2, cx, cy, r * 1.1);
    gr.addColorStop(0, '#7a7090'); gr.addColorStop(0.35, '#3a3348'); gr.addColorStop(1, '#0e0b14');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#0e0b14'; g.lineWidth = 2.2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(cx - 8, cy - 9, 6, 3.5, -0.6, 0, Math.PI * 2); g.fill();
    // 얼굴(노란 눈, 수염)
    g.fillStyle = '#ffd24a'; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(cx + s * 7, cy + 2, 3.2, 4, 0, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#0e0b14'; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(cx + s * 7, cy + 2.5, 1.2, 3, 0, 0, Math.PI * 2); g.fill(); });
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1;
    [-1, 1].forEach(function (s) { for (var k = 0; k < 2; k++) { g.beginPath(); g.moveTo(cx + s * 5, cy + 9 + k * 2); g.lineTo(cx + s * 17, cy + 7 + k * 5); g.stroke(); } });
    // 뚜껑과 심지
    g.fillStyle = '#c9a040'; g.fillRect(cx - 5, cy - r - 4, 10, 6); g.strokeStyle = '#6a4a10'; g.lineWidth = 1.4; g.strokeRect(cx - 5, cy - r - 4, 10, 6);
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx, cy - r - 4); g.quadraticCurveTo(cx + 6, cy - r - 12, cx + 12, cy - r - 13); g.stroke();
    var sp = g.createRadialGradient(cx + 13, cy - r - 14, 0, cx + 13, cy - r - 14, 7);
    sp.addColorStop(0, '#fffbe0'); sp.addColorStop(0.4, '#ffb030'); sp.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = sp; g.fillRect(cx + 5, cy - r - 22, 16, 16);
  });

  // ── 상태 ──
  var G, S, P, GOD = false;
  function newRun() { return { stage: 1, score: 0, coins: 0, lives: 3, up: { rate: 0, spread: 0, shield: 0, magnet: 0, bomb: 0 }, bombs: 0, hp: 3, cats: [], emperorDone: false }; }
  function resetStage() {
    S = { mode: S ? S.mode : 'title', t: S ? S.t : 0, st: 0, scroll: S ? S.scroll : 0, world: 0, shake: 0, kind: 'normal',
      pb: [], eb: [], en: [], drops: [], parts: [], texts: [], spawnQ: [], timers: [], wings: [], puffs: S ? S.puffs : [],
      form: { t: 0 }, diveT: 2.5, ffAcc: 0, boss: null, bonus: null, clearT: 0, overT: 0, combo: 0, comboT: 0, carried: [], vacuum: false, hitFx: 0, spawned: 0, total: 0, bombFx: null };
    P = { x: W / 2, y: H - 150, tx: W / 2, ty: H - 150, inv: 0, shield: 0, fireT: 0, spreadT: 0, alive: true, vx: 0, hp: 3 };   // 맞은 횟수는 스테이지마다 새로 센다(이어지게 했다가 사장님 "좀 아닌듯")
  }
  G = newRun(); resetStage();

  // ── 난이도(평균 사람 기준: 앞 단계는 넉넉히, 뒤로 갈수록 가파르게) ──
  function diff(n) {
    var k = n - 1;
    return {
      count: Math.min(40, 12 + k * 2),
      gsize: Math.min(8, 4 + Math.floor(k / 4)),
      bomber: n >= 2 ? Math.min(0.3, 0.12 + k * 0.015) : 0,
      armor: n >= 4 ? Math.min(0.32, 0.08 + (n - 4) * 0.02) : 0,
      bspd: 150 + Math.min(230, k * 8),
      diveGap: Math.max(0.55, 3.2 - k * 0.1),
      divers: Math.min(7, 1 + Math.floor(k / 3)),
      diveShots: n < 3 ? 1 : n < 9 ? 2 : n < 20 ? 3 : 4,
      formFire: n >= 7 ? Math.min(2.4, 0.12 + (n - 7) * 0.09) : 0,
      hpUp: Math.floor((n - 1) / 8),                                 // 9·17·25… 부터 한 대씩 더 맞아야 한다
      enterFire: n >= 9 ? Math.min(0.6, (n - 8) * 0.04) : 0,        // 날아 들어오면서 쏠 확률
      enterSpd: 270 + Math.min(150, k * 6),
      diveSpd: 240 + Math.min(180, k * 7)
    };
  }
  var D = diff(1);

  var SCORE = { grunt: 100, bomber: 150, armor: 300, cage: 500 };
  var RAD = { grunt: 24, bomber: 25, armor: 28, cage: 34 };
  var HP = { grunt: 1, bomber: 1, armor: 3, cage: 4 };
  var RATE = [0.34, 0.28, 0.23, 0.19, 0.16, 0.13];
  var MAG = [70, 130, 200, 300];
  var BOMB = { cap: [1, 2, 2, 3, 3], dmg: [3, 5, 8, 12, 18], boss: [15, 30, 50, 80, 120], coin: [false, false, true, true, true], inv: [1.2, 1.4, 1.6, 1.8, 2.2] };
  var PAT = [[[0, 0]], [[-8, 0], [8, 0]], [[-10, -0.07], [0, 0], [10, 0.07]], [[-14, -0.12], [-5, -0.04], [5, 0.04], [14, 0.12]], [[-16, -0.2], [-8, -0.1], [0, 0], [8, 0.1], [16, 0.2]]];
  var ITEMS = [
    { id: 'rate', ko: '연사', en: 'RAPID', max: 5, cost: [20, 45, 80, 130, 200] },
    { id: 'spread', ko: '탄', en: 'SPREAD', max: 3, cost: [60, 150, 300] },
    { id: 'shield', ko: '방패', en: 'SHIELD', max: 3, cost: [40, 100, 180] },
    { id: 'magnet', ko: '자석', en: 'MAGNET', max: 3, cost: [25, 60, 110] },
    { id: 'bombs', ko: '폭탄', en: 'BOMB', max: 5, cost: [40] },
    { id: 'bomb', ko: '폭탄 강화', en: 'BOMB UP', max: 4, cost: [50, 120, 220, 350] },
    { id: 'life', ko: '목숨', en: 'LIFE', max: 3, cost: [70] }
  ];

  // ── 곡선 길 ──
  function spline(pts) {
    var out = [], i, k;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (k = 0; k < 12; k++) {
        var t = k / 12, t2 = t * t, t3 = t2 * t, o = [];
        for (var d = 0; d < 2; d++) o[d] = 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3);
        out.push(o);
      }
    }
    out.push(pts[pts.length - 1].slice());
    var L = [0];
    for (i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    return { p: out, L: L, len: L[L.length - 1] };
  }
  function along(sp, d) {
    if (d >= sp.len) return sp.p[sp.p.length - 1];
    var lo = 0, hi = sp.L.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (sp.L[m] < d) lo = m; else hi = m; }
    var f = (d - sp.L[lo]) / Math.max(0.001, sp.L[hi] - sp.L[lo]);
    return [sp.p[lo][0] + (sp.p[hi][0] - sp.p[lo][0]) * f, sp.p[lo][1] + (sp.p[hi][1] - sp.p[lo][1]) * f];
  }
  function slotPos(c, r) {
    var sway = Math.sin(S.form.t * 0.7) * 22, br = 1 + Math.sin(S.form.t * 1.1) * 0.035;
    return { x: W / 2 + (c - 3.5) * 57 * br + sway, y: TOPY + r * 54 + Math.sin(S.form.t * 1.6 + c * 0.6) * 3 };
  }
  function entryPath(kind, m, s) {
    var X = function (x) { return m > 0 ? x : W - x; };
    var P4 = [
      [[X(-50), H * 0.42], [X(120), H * 0.35], [X(260), H * 0.46], [X(210), H * 0.6], [X(90), H * 0.5], [X(150), H * 0.34], [s.x, s.y + 40]],
      [[X(W / 2 - 40), -60], [X(W / 2 - 50), H * 0.3], [X(W / 2 + 120), H * 0.5], [X(W / 2 + 230), H * 0.36], [X(W / 2 + 110), H * 0.22], [s.x, s.y + 40]],
      [[X(-50), H * 0.7], [X(150), H * 0.64], [X(300), H * 0.7], [X(430), H * 0.56], [X(330), H * 0.42], [s.x, s.y + 40]],
      [[X(70), -60], [X(210), H * 0.18], [X(60), H * 0.3], [X(250), H * 0.42], [X(120), H * 0.5], [s.x, s.y + 40]]
    ];
    return spline(P4[kind % 4]);
  }
  function divePath(e) {
    var s = e.x < W / 2 ? -1 : 1, px = P.x;
    var pts;
    if (e.type === 'armor') pts = [[e.x, e.y], [e.x + s * 30, e.y - 34], [e.x + s * 10, e.y + 40], [(e.x + px) / 2, H * 0.5], [px, P.y], [px, H + 80]];
    else if (e.type === 'bomber') pts = [[e.x, e.y], [e.x + s * 40, e.y - 34], [e.x + s * 60, e.y + 30], [W / 2 - s * 190, H * 0.42], [W / 2 + s * 190, H * 0.52], [W / 2 - s * 150, H * 0.64], [W / 2 + s * 240, H + 80]];
    else pts = [[e.x, e.y], [e.x + s * 45, e.y - 40], [e.x + s * 85, e.y + 22], [(e.x + px) / 2, H * 0.45], [px - s * 50, P.y - 170], [px, P.y], [px + s * 30, H + 80]];
    return spline(pts);
  }

  // ── 무대 짜기 ──
  var ORDER_C = [3, 4, 2, 5, 1, 6, 0, 7];
  function nextCageCoat() {
    for (var i = 0; i < 12; i++) if (G.cats.indexOf(i) < 0 && S.carried.indexOf(i) < 0) return i;
    return -1;
  }
  function buildStage(n) {
    var keepMode = S.mode;
    resetStage(); S.mode = keepMode;
    D = diff(n);
    S.world = Math.floor((n - 1) / 5) % 5;
    S.kind = n % 5 === 0 ? 'boss' : n % 5 === 3 ? 'bonus' : 'normal';
    P.shield = G.up.shield; P.inv = 1.2;
    var last = G.cats.slice(-2);
    for (var w = 0; w < last.length; w++) S.wings.push({ coat: last[w], x: W / 2, y: H + 60 });
    if (S.kind === 'bonus') { S.bonus = { t: 0, dur: 12, got: 0, total: 0, spawnT: 1.2, wave: 0 }; return; }
    if (S.kind === 'boss') {
      var emp = G.cats.length >= 12 && !G.emperorDone;
      S.timers.push({ t: 2.4, fn: function () { spawnBoss(emp); } });
      return;
    }
    // 적 목록
    var list = [], cnt = D.count, cage = (nextCageCoat() >= 0 && n >= 2 + G.cats.length * 4) || (G.cats.length >= 12 && n % 3 === 0);   // 고양이는 4스테이지에 한 마리꼴(몇 분 만에 도감이 차서, 2026-09-15)
    if (cage) list.push('cage');
    var nArmor = Math.round(cnt * D.armor), nBomb = Math.round(cnt * D.bomber);
    for (var i = 0; i < nArmor; i++) list.push('armor');
    for (i = 0; i < nBomb; i++) list.push('bomber');
    while (list.length < cnt) list.push('grunt');
    // 자리 배정: 줄마다 가운데부터
    var rowsFor = { cage: [0], armor: [0, 1], bomber: [1, 2], grunt: [2, 3, 4, 1, 0] };
    var used = {}, slots = [];
    list.forEach(function (tp) {
      var rows = rowsFor[tp].concat([0, 1, 2, 3, 4]);
      for (var r = 0; r < rows.length; r++) for (var c = 0; c < 8; c++) {
        var cc = ORDER_C[c], key = rows[r] + ':' + cc;
        if (!used[key] && !(tp === 'cage' && (cc < 3 || cc > 4))) { used[key] = 1; slots.push({ type: tp, c: cc, r: rows[r] }); return; }
      }
    });
    // 무리로 나눠 차례로 날아 들어온다
    slots.sort(function (a, b) { return a.r - b.r || a.c - b.c; });
    var groups = [];
    for (i = 0; i < slots.length; i += D.gsize) groups.push(slots.slice(i, i + D.gsize));
    groups.forEach(function (gr, gi) {
      var kind = gi % 4, m = gi % 2 ? -1 : 1;
      gr.forEach(function (sl, j) { S.spawnQ.push({ at: 1.0 + gi * 2.7 + j * 0.15, sl: sl, kind: kind, m: (sl.c < 4 ? 1 : -1) * (kind === 1 ? m : 1) }); });
    });
    S.total = slots.length;
  }
  function spawnEnemy(q) {
    var sl = q.sl, e = { type: sl.type, hp: HP[sl.type] + D.hpUp * (sl.type === 'armor' ? 2 : 1), r: RAD[sl.type], slot: { c: sl.c, r: sl.r }, state: 'enter', d: 0, x: 0, y: 0, vx: 0, flash: 0, t: Math.random() * 6, shots: 0, fireT: 0, bombT: 0, enterShot: Math.random() < D.enterFire };
    e.path = entryPath(q.kind, q.m, slotPos(sl.c, sl.r));
    var p0 = e.path.p[0]; e.x = p0[0]; e.y = p0[1];
    if (e.type === 'cage') { e.coat = nextCageCoat(); if (e.coat >= 0) S.carried.push(e.coat); }
    S.en.push(e); S.spawned++;
  }
  function spawnBoss(emp) {
    var n = G.stage;
    var bi = Math.max(1, Math.round(n / 5));            // 몇 번째 보스인가(첫 보스는 순하게)
    S.boss = { type: emp ? 'emperor' : 'boss', bi: emp ? 6 : bi, x: W / 2, y: -140, ty: TOPY + (emp ? 90 : 70), hp: Math.round((emp ? 2000 : 100 + (bi - 1) * 140 + Math.max(0, bi - 5) * 80) * 1.5), t: 0, atkT: 2.8, atk: 0, flash: 0, entering: true, dead: false, spiral: 0 };
    S.boss.max = S.boss.hp;
    S.boss.rx = emp ? 165 : 138; S.boss.ry = emp ? 62 : 50;
  }

  // ── 흐름 ──
  function setMode(m) {
    S.mode = m;
    body.classList.toggle('playing', m === 'intro' || m === 'play' || m === 'clear' || m === 'dying' || m === 'pause');
  }
  function show(id, on) { $(id).classList.toggle('show', !!on); }
  function hideAll() { ['title', 'shop', 'over', 'pause', 'dex', 'ending'].forEach(function (id) { show(id, false); }); }

  function saveProgress() { store.set('save', { stage: G.stage, score: G.score, coins: G.coins, lives: G.lives, hp: G.hp, up: G.up, bombs: G.bombs, cats: G.cats, emperorDone: G.emperorDone }); }
  function startStage() {
    hideAll();
    buildStage(G.stage);
    saveProgress();
    setMode('intro'); S.introT = 1.7;
    if (S.kind === 'boss') { flash('WARNING', 'bad', 2.0); AU.warning(); AU.music('boss'); }
    else if (S.kind === 'bonus') { flash('BONUS STAGE', 'cyan', 1.6); AU.music('main'); }
    else { flash('STAGE ' + G.stage, '', 1.4); AU.music('main'); }
    hud();
  }
  function newGame() { AU.init(); G = newRun(); resetStage(); startStage(); if (window.OG) OG.start({ stage: 1 }); }   // 사이트 지표(game-events.js)
  function continueGame() {
    AU.init(); var sv = store.get('save', null); if (!sv) return newGame();
    G = newRun(); for (var k in sv) G[k] = sv[k];
    if (G.up.bomb === undefined) G.up.bomb = 0;
    if (G.bombs === undefined) G.bombs = 0;
    G.lives = Math.max(G.lives, 3);
    resetStage(); startStage();
    if (window.OG) OG.start({ stage: G.stage });
  }
  function toTitle() {
    hideAll(); AU.stopMusic();
    resetStage(); setMode('title'); titleDemo();
    var sv = store.get('save', null);
    $('btnCont').hidden = !sv || sv.stage <= 1;
    $('rec').textContent = rec.stage ? 'BEST  STAGE ' + rec.stage + '  ·  ' + rec.score.toLocaleString() : '';
    show('title', true);
  }
  function titleDemo() {
    S.world = 0; S.en = [];
    var types = ['armor', 'cage', 'armor', 'bomber', 'bomber', 'bomber', 'bomber', 'grunt', 'grunt', 'grunt', 'grunt', 'grunt'];
    var sl = [[2, 0], [3.5, 0], [5, 0], [1.5, 1], [2.5, 1], [4.5, 1], [5.5, 1], [1, 2], [2.5, 2], [3.5, 2], [4.5, 2], [6, 2]];
    var r0 = (H * 0.4 - TOPY) / 54;
    types.forEach(function (tp, i) { S.en.push({ type: tp, hp: 1, r: RAD[tp], slot: { c: sl[i][0], r: sl[i][1] + r0 }, state: 'form', x: 0, y: 0, vx: 0, flash: 0, t: i, coat: tp === 'cage' ? 4 : -1, demo: true }); });
    P.x = W / 2; P.y = H * 0.7;
  }

  function flash(txt, cls, dur) {
    var f = $('flash'); f.textContent = txt; f.className = 'show' + (cls ? ' ' + cls : '');
    clearTimeout(flash.tm); flash.tm = setTimeout(function () { f.className = cls || ''; }, (dur || 1.1) * 1000);
  }
  function hud() {
    var h = ''; if (innerWidth <= 480) h = '♥' + G.lives; else for (var i = 0; i < G.lives; i++) h += '♥';
    $('hpv').textContent = h;
    $('shv').textContent = P.shield ? '🛡' + (P.shield > 1 ? P.shield : '') : '';
    $('bombv').textContent = G.bombs; $('bombN').textContent = G.bombs; $('bombBtn').classList.toggle('empty', !G.bombs);
    $('coinv').textContent = G.coins;
    $('stage').textContent = 'STAGE ' + G.stage;
    $('catv').textContent = G.cats.length + '/12';
    $('scorev').textContent = G.score.toLocaleString();
  }
  function addScore(v, x, y) {
    G.score += v; if (x !== undefined) S.texts.push({ x: x, y: y, s: '' + v, t: 0, col: '#fff' });
    $('scorev').textContent = G.score.toLocaleString();
  }
  function addCoins(v) { G.coins += v; $('coinv').textContent = G.coins; }

  // ── 입자 ──
  function parts(x, y, n, o) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = (o.spd || 200) * (0.3 + Math.random() * 0.9);
      S.parts.push({ k: o.k || 'spark', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (o.vy || 0), life: 0, max: (o.life || 0.5) * (0.6 + Math.random() * 0.7), size: (o.size || 3) * (0.6 + Math.random() * 0.8), col: o.col instanceof Array ? o.col[i % o.col.length] : (o.col || '#ffd27a'), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
    }
  }
  function explode(x, y, big, type) {
    parts(x, y, big ? 40 : 16, { k: 'spark', spd: big ? 420 : 260, life: 0.55, size: 3.2, col: ['#fff4c0', '#ffc050', '#ff7a3a'] });
    parts(x, y, big ? 14 : 6, { k: 'smoke', spd: 60, life: big ? 1.2 : 0.8, size: big ? 26 : 15, col: type === 'bomber' ? '#8a6a4a' : '#5a4a6a' });
    S.parts.push({ k: 'ring', x: x, y: y, life: 0, max: 0.4, size: big ? 110 : 44, col: '#fff' });
    S.parts.push({ k: 'glow', x: x, y: y, life: 0, max: 0.25, size: big ? 150 : 60, col: '#ffcf7a' });
    if (type === 'armor') parts(x, y, 8, { k: 'debris', spd: 240, life: 0.9, size: 5, col: ['#4a7ccc', '#c6dcff', '#1c3066'], vy: 80 });
    else if (type === 'bomber') parts(x, y, 8, { k: 'debris', spd: 220, life: 0.9, size: 5, col: ['#ffe07a', '#e6b43a'], vy: 80 });
    else parts(x, y, 5, { k: 'debris', spd: 200, life: 0.8, size: 4, col: ['#8ea2b6', '#dfe8f0'], vy: 80 });
  }

  // ── 쏘기 ──
  function fire() {
    var lv = Math.min(4, G.up.spread + (P.spreadT > 0 ? 1 : 0)), pat = PAT[lv];
    for (var i = 0; i < pat.length; i++) S.pb.push({ x: P.x + pat[i][0], y: P.y - 40, vx: Math.sin(pat[i][1]) * 900, vy: -Math.cos(pat[i][1]) * 900, w: 0 });
    for (var k = 0; k < S.wings.length; k++) { var wg = S.wings[k]; if (wg.y < H + 20) S.pb.push({ x: wg.x, y: wg.y - 28, vx: 0, vy: -880, w: 1 }); }
    AU.shoot();
  }
  function eShoot(x, y, ang, spd, kind) {
    S.eb.push({ x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, k: kind || 'orb', r: kind === 'cheese' ? 11 : 7, rot: 0 });
  }
  function aim(x, y) { return Math.atan2(P.y - y, P.x - x); }

  function kill(e, diving) {
    e.dead = true;
    var sc = SCORE[e.type] * (diving ? 2 : 1);
    addScore(sc, e.x, e.y - 10);
    explode(e.x, e.y, e.type === 'cage' || e.type === 'armor', e.type);
    AU.boom(e.type === 'armor' || e.type === 'cage'); AU.squeak();
    S.shake = Math.max(S.shake, e.type === 'armor' || e.type === 'cage' ? 0.35 : 0.15);
    // 동전
    var coinN = e.type === 'armor' ? 3 : e.type === 'cage' ? 4 : (Math.random() < (e.type === 'bomber' ? 0.55 : 0.4) ? 1 : 0);
    for (var i = 0; i < coinN; i++) S.drops.push({ k: e.type === 'armor' && i === 0 ? 'big' : 'coin', x: e.x + (Math.random() - 0.5) * 30, y: e.y, vx: (Math.random() - 0.5) * 120, vy: -80 - Math.random() * 90, t: Math.random() * 6 });
    var rnd = Math.random();
    if (rnd < 0.035) S.drops.push({ k: 'power', x: e.x, y: e.y, vx: 0, vy: 40, t: 0 });
    else if (rnd < 0.06) S.drops.push({ k: 'bubble', x: e.x, y: e.y, vx: 0, vy: 40, t: 0 });
    if (e.type === 'cage') {
      if (e.coat >= 0) S.drops.push({ k: 'cage', coat: e.coat, x: e.x, y: e.y + 30, vx: 0, vy: 30, t: 0 });
      else S.drops.push({ k: 'chest', x: e.x, y: e.y + 20, vx: 0, vy: 50, t: 0 });
    }
    // 연속 격추
    S.combo++; S.comboT = 0.9;
    if (S.combo === 5) { flash('NICE'); addCoins(3); AU.coin(); }
    else if (S.combo === 10) { flash('GREAT'); addCoins(8); AU.power(); }
    else if (S.combo === 16) { flash('EXCELLENT'); addCoins(15); AU.fanfare(); }
  }

  function hitDamage() { return G.stage <= 15 ? 1.5 : 3; }   // 1~15: 2번, 16~: 1번 맞으면 목숨 하나
  function hurt(ram) {
    if (P.inv > 0 || !P.alive || S.mode === 'clear' || GOD) return;
    if (P.shield > 0) {
      P.shield--; P.inv = 1.0; AU.block();
      S.parts.push({ k: 'ring', x: P.x, y: P.y, life: 0, max: 0.45, size: 90, col: '#9ff4ff' });
      hud(); return;
    }
    S.shake = 0.5;
    // 호위기는 대신 맞지 않는다(목숨이 너무 안 준다, 2026-09-15). 목숨 하나 = 3칸
    var dmg = ram ? (G.stage <= 5 ? 1.5 : 3) : hitDamage(); // 박치기는 목숨 하나를 통째로(1~5 스테이지는 탄 한 방과 같게)
    P.hp -= dmg; G.hp = P.hp; S.hitFx = 0.4;
    if (P.hp > 0.01) {
      AU.hurt(); P.inv = 1.0; S.shake = 0.35;
      parts(P.x, P.y, 10, { k: 'spark', spd: 220, life: 0.4, size: 3, col: ['#ff8a70', '#ffd27a'] });
      hud(); return;
    }
    P.hp = G.hp = 3;
    while (S.wings.length) {                                // 목숨이 줄면 호위기는 흩어졌다가 다음 스테이지에 다시 붙는다
      var w = S.wings.pop();
      S.parts.push({ k: 'wingaway', x: w.x, y: w.y, vx: (w.x < P.x ? -1 : 1) * 160, vy: -260, life: 0, max: 1.4, size: 1, coat: w.coat, rot: 0, vr: (w.x < P.x ? -1 : 1) * 5 });
    }
    G.lives--; AU.hurt(); explode(P.x, P.y, true); hud();
    if (G.lives <= 0) { P.alive = false; setMode('dying'); S.overT = 1.8; AU.boom(true); }
    else P.inv = 2.4;
  }

  // ── 폭탄: 적 탄을 지우고 화면 안 적·보스에 큰 피해 ──
  function useBomb() {
    if (!(S.mode === 'play' || S.mode === 'intro') || !P.alive || !G.bombs || S.bombFx) return;
    var lv = G.up.bomb || 0;
    G.bombs--;
    S.bombFx = { t: 0, lv: lv, x: P.x, y: P.y };
    var n = 0;
    S.eb.forEach(function (q) {
      parts(q.x, q.y, 3, { k: 'spark', spd: 120, life: 0.35, size: 2.4, col: ['#fff', '#ffe08a'] });
      if (BOMB.coin[lv] && n++ < 24) S.drops.push({ k: 'coin', x: q.x, y: q.y, vx: (Math.random() - 0.5) * 60, vy: -60, t: Math.random() * 6 });
    });
    S.eb.length = 0;
    var dmg = BOMB.dmg[lv];
    S.en.forEach(function (e) {
      if (e.dead || e.y < -20) return;
      e.hp -= dmg; e.flash = 0.2;
      if (e.hp <= 0) kill(e, e.state === 'dive');
    });
    var b = S.boss;
    if (b && !b.dead && !b.entering) { b.hp -= Math.min(BOMB.boss[lv], Math.ceil(b.max * 0.25)); b.flash = 0.3; if (b.hp <= 0) bossDown(); }
    P.inv = Math.max(P.inv, BOMB.inv[lv]);
    S.shake = 0.8 + lv * 0.1;
    S.parts.push({ k: 'glow', x: P.x, y: P.y, life: 0, max: 0.5, size: 300 + lv * 60, col: '#fff' });
    AU.bomb(lv);
    hud();
  }
  function drawBombFx() {
    var f = S.bombFx, t = f.t, lv = f.lv;
    var cols = [['255,240,180', '255,150,60'], ['255,245,200', '255,120,80'], ['230,250,255', '120,200,255'], ['255,230,255', '220,120,255'], ['255,255,255', '255,210,80']][lv];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 번쩍
    if (t < 0.35) { ctx.fillStyle = 'rgba(' + cols[0] + ',' + (0.55 * (1 - t / 0.35)).toFixed(3) + ')'; ctx.fillRect(-400, -400, W + 800, H + 800); }
    // 퍼지는 고리(레벨이 높을수록 겹이 많다)
    for (var k = 0; k <= Math.min(2, lv); k++) {
      var tt = t - k * 0.08; if (tt <= 0) continue;
      var R = tt * (1500 + lv * 200), a = Math.max(0, 1 - tt / 0.7);
      ctx.lineWidth = 26 + lv * 8 - k * 6;
      ctx.strokeStyle = 'rgba(' + cols[1] + ',' + (0.7 * a).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(' + cols[0] + ',' + (0.9 * a).toFixed(3) + ')';
      ctx.stroke();
    }
    ctx.restore();
  }

  function rescue(coat, x, y) {
    if (G.cats.indexOf(coat) < 0) G.cats.push(coat);
    if (dexAll.indexOf(coat) < 0) { dexAll.push(coat); store.set('dex', dexAll); }
    if (S.wings.length < 2) S.wings.push({ coat: coat, x: x, y: y });
    flash('RESCUE', 'cyan', 1.3); AU.rescue();
    addScore(1000, x, y - 20);
    parts(x, y, 18, { k: 'heart', spd: 160, life: 1.0, size: 9, col: ['#ff7aa8', '#ffb0cc'], vy: -60 });
    hud();
  }

  // ── 상점 ──
  var iconCache = {};
  function itemIcon(id) {
    if (iconCache[id]) return iconCache[id];
    var c = ART.mk(64, 64, function (g) {
      if (id === 'rate') { for (var i = 0; i < 4; i++) g.drawImage(pbSpr, 20 + (i % 2) * 14, 44 - i * 13, 14, 30); }
      else if (id === 'spread') { [-0.5, -0.25, 0, 0.25, 0.5].forEach(function (a) { g.save(); g.translate(32, 50); g.rotate(a); g.drawImage(pbSpr, -7, -46, 14, 34); g.restore(); }); }
      else if (id === 'shield') g.drawImage(ART.bubble, 8, 8, 48, 48);
      else if (id === 'magnet') {
        g.lineWidth = 12; g.strokeStyle = '#e84a4a'; g.beginPath(); g.arc(32, 30, 17, Math.PI, 0); g.stroke();
        g.beginPath(); g.moveTo(15, 30); g.lineTo(15, 46); g.moveTo(49, 30); g.lineTo(49, 46); g.stroke();
        g.strokeStyle = '#dfe4ea'; g.beginPath(); g.moveTo(15, 46); g.lineTo(15, 54); g.moveTo(49, 46); g.lineTo(49, 54); g.stroke();
        g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(32, 30, 20, Math.PI * 1.1, Math.PI * 1.4); g.stroke();
        g.drawImage(ART.coin, 24, 2, 16, 16);
      } else if (id === 'bombs') { g.drawImage(bombSpr, 6, 4, 52, 58);
      } else if (id === 'bomb') {
        var bg = g.createRadialGradient(32, 38, 6, 32, 38, 30); bg.addColorStop(0, 'rgba(255,190,80,.8)'); bg.addColorStop(1, 'rgba(255,120,40,0)');
        g.fillStyle = bg; g.fillRect(0, 0, 64, 64); g.drawImage(bombSpr, 10, 10, 44, 49);
        g.fillStyle = '#ffe066'; g.strokeStyle = '#6a3a08'; g.lineWidth = 2;
        [[50, 26], [50, 16]].forEach(function (a) { g.beginPath(); g.moveTo(a[0] - 8, a[1] + 6); g.lineTo(a[0], a[1] - 2); g.lineTo(a[0] + 8, a[1] + 6); g.closePath(); g.fill(); g.stroke(); });
      } else if (id === 'life') {
        var gr = g.createRadialGradient(24, 22, 2, 32, 34, 30); gr.addColorStop(0, '#ffc0cc'); gr.addColorStop(0.4, '#ff4a6a'); gr.addColorStop(1, '#8a1030');
        g.fillStyle = gr; g.beginPath(); g.moveTo(32, 54); g.bezierCurveTo(4, 36, 8, 10, 32, 22); g.bezierCurveTo(56, 10, 60, 36, 32, 54); g.fill();
        g.strokeStyle = '#5a0a1e'; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(22, 24, 6, 4, -0.6, 0, 7); g.fill();
      }
    });
    return (iconCache[id] = c);
  }
  function itemLevel(it) { return it.id === 'life' ? G.lives : it.id === 'bombs' ? G.bombs : G.up[it.id]; }
  function itemCost(it) { var lv = itemLevel(it); return it.id === 'life' || it.id === 'bombs' ? it.cost[0] : it.cost[lv]; }
  function openShop() {
    setMode('shop'); AU.music('main');
    renderShop(); show('shop', true);
  }
  function renderShop() {
    $('shopCoin').textContent = G.coins;
    var box = $('cards'); box.innerHTML = '';
    ITEMS.forEach(function (it) {
      var lv = itemLevel(it), max = lv >= it.max, cost = max ? 0 : itemCost(it);
      var d = document.createElement('div'); d.className = 'card' + (max ? ' max' : '') + (!max && G.coins < cost ? ' no' : '');
      var ic = itemIcon(it.id), cc = document.createElement('canvas'); cc.width = ic.width; cc.height = ic.height; cc.getContext('2d').drawImage(ic, 0, 0);
      d.appendChild(cc);
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = EN ? it.en : it.ko; d.appendChild(nm);
      var lvd = document.createElement('div'); lvd.className = 'lv';
      lvd.textContent = it.id === 'life' ? '♥ ' + lv + '/' + it.max : it.id === 'bombs' ? '💣 ' + lv + '/' + it.max : (max ? 'MAX' : 'LV ' + lv + ' → ' + (lv + 1));
      d.appendChild(lvd);
      var pr = document.createElement('div'); pr.className = 'pr'; pr.textContent = max ? 'MAX' : '🪙 ' + cost; d.appendChild(pr);
      d.addEventListener('click', function () {
        if (max) return;
        if (G.coins < cost) { AU.nope(); return; }
        G.coins -= cost;
        if (it.id === 'life') G.lives++; else if (it.id === 'bombs') G.bombs++; else G.up[it.id]++;
        AU.buy(); renderShop();
        var cards = $('cards').children; var idx = ITEMS.indexOf(it); if (cards[idx]) cards[idx].classList.add('buy');
        hud();
      });
      box.appendChild(d);
    });
  }

  // ── 도감 ──
  function openDex() {
    var grid = $('dexGrid'); grid.innerHTML = '';
    ART.COATS.forEach(function (c, i) {
      var have = dexAll.indexOf(i) >= 0;
      var d = document.createElement('div');
      var cc = document.createElement('canvas'); cc.width = 144; cc.height = 144;
      var g = cc.getContext('2d'); g.scale(2, 2); g.lineJoin = 'round'; g.lineCap = 'round';
      if (have) ART.catHead(g, 36, 40, 22, c);
      else { ART.catHead(g, 36, 40, 22, c); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#1a1030'; g.fillRect(0, 0, 72, 72); }
      d.appendChild(cc);
      var nm = document.createElement('div'); nm.textContent = have ? (EN ? c.en : c.ko) : '???'; d.appendChild(nm);
      grid.appendChild(d);
    });
    $('dexTitle').textContent = '🐱 ' + dexAll.length + '/12';
    show('dex', true);
  }

  // ── 입력 ──
  var keys = {};
  addEventListener('keydown', function (ev) {
    var k = ev.key;
    keys[k.length === 1 ? k.toLowerCase() : k] = true;
    if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
    else if (k === 'm' || k === 'M') tgBgm();
    else if (k === 'k' || k === 'K') tgSnd();
    else if (k === 'b' || k === 'B' || k === 'x' || k === 'X') useBomb();
    else if ((k === 'Enter' || k === ' ') && S.mode === 'title' && !$('dex').classList.contains('show')) newGame();
    else if ((k === 'Enter' || k === ' ') && S.mode === 'shop') { AU.click(); G.stage++; startStage(); }
    if (k.indexOf('Arrow') === 0 || k === ' ') ev.preventDefault();
  });
  addEventListener('keyup', function (ev) { var k = ev.key; keys[k.length === 1 ? k.toLowerCase() : k] = false; });
  var drag = null;
  // 폰·PC 모두 화면 끌기로 움직인다. 패드 코드는 남겨 두되 화면에는 안 띄운다
  var PAD = { x: 0, y: 0, id: null };
  (function () {
    var pad = $('pad'), knob = $('knob');
    var move = function (e) {
      var r = pad.getBoundingClientRect(), R = r.width / 2, max = R - knob.offsetWidth / 2;
      var mx = e.clientX - (r.left + R), my = e.clientY - (r.top + R), d = Math.hypot(mx, my), k = d > max ? max / d : 1;
      var kx = mx * k, ky = my * k; knob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
      var nx = kx / max, ny = ky / max; if (Math.hypot(nx, ny) < 0.08) nx = ny = 0;   // 데드존 8%
      PAD.x = nx; PAD.y = ny;
    };
    var end = function (e) { if (PAD.id !== e.pointerId) return; PAD.id = null; pad.classList.remove('on'); knob.style.transform = ''; PAD.x = PAD.y = 0; };
    pad.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); AU.init(); if (PAD.id !== null) return; PAD.id = e.pointerId; try { pad.setPointerCapture(PAD.id); } catch (_) {} pad.classList.add('on'); move(e); });
    pad.addEventListener('pointermove', function (e) { if (PAD.id !== e.pointerId) return; e.stopPropagation(); move(e); });
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end); pad.addEventListener('lostpointercapture', end);
    addEventListener('touchstart', function () { body.classList.add('touch'); }, { passive: true, once: true });
  })();
  cv.addEventListener('pointerdown', function (ev) {
    AU.init();
    if (!(S.mode === 'play' || S.mode === 'intro' || S.mode === 'clear')) return;
    drag = { id: ev.pointerId, px: ev.clientX, py: ev.clientY, sx: P.tx, sy: P.ty };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  cv.addEventListener('pointermove', function (ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    var k = ev.pointerType === 'mouse' ? 1 : 1.15;
    P.tx = drag.sx + (ev.clientX - drag.px) / scale * k;
    P.ty = drag.sy + (ev.clientY - drag.py) / scale * k;
  });
  var endDrag = function (ev) { if (drag && ev.pointerId === drag.id) drag = null; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

  function togglePause() {
    if (S.mode === 'pause') { show('pause', false); setMode(S.prevMode); }
    else if (S.mode === 'play' || S.mode === 'intro' || S.mode === 'clear') { S.prevMode = S.mode; setMode('pause'); show('pause', true); }
  }
  function tgBgm() { AU.init(); var on = AU.toggleBgm(); $('tgBgm').classList.toggle('off', !on); $('pBgm').classList.toggle('off', !on); }
  function tgSnd() { AU.init(); var on = AU.toggleSnd(); $('tgSnd').classList.toggle('off', !on); $('pSnd').classList.toggle('off', !on); }
  $('tgBgm').classList.toggle('off', !AU.bgm); $('tgSnd').classList.toggle('off', !AU.snd); $('pBgm').classList.toggle('off', !AU.bgm); $('pSnd').classList.toggle('off', !AU.snd);
  $('pBgm').onclick = tgBgm; $('pSnd').onclick = tgSnd;
  $('tgPause').onclick = togglePause; $('tgBgm').onclick = tgBgm; $('tgSnd').onclick = tgSnd;
  (function () {                                            // 폭탄 단추: 아이콘을 그려 넣고 누르는 즉시 터진다
    var btn = $('bombBtn'), c = document.createElement('canvas'); c.width = bombSpr.width; c.height = bombSpr.height;
    c.getContext('2d').drawImage(bombSpr, 0, 0); btn.insertBefore(c, btn.firstChild);
    btn.addEventListener('pointerdown', function (ev) { ev.preventDefault(); ev.stopPropagation(); AU.init(); useBomb(); });
  })();
  $('btnStart').onclick = function () { AU.click(); newGame(); };
  $('btnCont').onclick = function () { AU.click(); continueGame(); };
  $('btnDex').onclick = function () { AU.init(); AU.click(); openDex(); };
  $('btnDexClose').onclick = function () { AU.click(); show('dex', false); };
  $('btnNext').onclick = function () { AU.click(); G.stage++; startStage(); };
  $('btnResume').onclick = togglePause;
  $('btnPauseTitle').onclick = function () { toTitle(); };
  $('btnRetry').onclick = function () { AU.click(); continueGame(); };
  $('btnOverTitle').onclick = function () { toTitle(); };
  $('btnEndNext').onclick = function () { AU.click(); show('ending', false); G.emperorDone = true; openShop(); };
  $('btnEndTitle').onclick = function () { G.emperorDone = true; G.stage++; saveProgress(); toTitle(); };
  document.addEventListener('visibilitychange', function () { if (document.hidden && (S.mode === 'play' || S.mode === 'intro')) togglePause(); });

  // ── 갱신 ──
  function update(dt) {
    S.t += dt;
    var m = S.mode;
    var speedBg = m === 'title' ? 40 : 70;
    S.scroll += dt * speedBg;
    updatePuffs(dt);
    if (m === 'pause') return;
    S.form.t += dt;
    S.shake = Math.max(0, S.shake - dt * 1.6);
    if (S.hitFx > 0) S.hitFx -= dt;

    if (m === 'title') { S.en.forEach(function (e) { var p = slotPos(e.slot.c, e.slot.r); e.x = p.x; e.y = p.y; e.t += dt; }); P.x = W / 2 + Math.sin(S.t * 0.8) * 40; updateParts(dt); return; }
    if (m === 'shop' || m === 'over' || m === 'ending') { updateParts(dt); if (m === 'ending') updateEnding(dt); return; }

    S.st += dt;
    if (m === 'intro') { S.introT -= dt; if (S.introT <= 0) setMode('play'); }
    // 타이머
    for (var ti = S.timers.length - 1; ti >= 0; ti--) { var tm = S.timers[ti]; tm.t -= dt; if (tm.t <= 0) { S.timers.splice(ti, 1); tm.fn(); } }

    updatePlayer(dt);
    if (S.mode === 'play' || S.mode === 'intro') {
      if (S.kind === 'normal') { spawnTick(); diveTick(dt); }
      if (S.kind === 'bonus') bonusTick(dt);
    }
    updateEnemies(dt);
    if (S.boss) updateBoss(dt);
    updateBullets(dt);
    updateDrops(dt);
    updateParts(dt);
    if (S.bombFx) { S.bombFx.t += dt; if (S.bombFx.t < 0.45) S.eb.length = 0; if (S.bombFx.t > 0.8) S.bombFx = null; }
    if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) S.combo = 0; }

    if (S.mode === 'play' && S.kind === 'normal' && S.spawnQ.length === 0 && S.en.length === 0 && !S.drops.some(function (d) { return d.k === 'cage'; })) stageClear();
    if (S.mode === 'clear') {
      S.clearT -= dt;
      if (S.clearT <= 0) {
        if (S.endingNext) startEnding();
        else if ((G.stage + 1) % 5 === 0) openShop();    // 상점은 보스 바로 앞에서만(모은 코인으로 무장하고 들어간다)
        else { G.stage++; startStage(); }
      }
    }
    if (S.mode === 'dying') { S.overT -= dt; if (S.overT <= 0) gameOver(); }
  }

  function stageClear() {
    setMode('clear'); S.clearT = 2.2; S.vacuum = true;
    var bonus = 8 + G.stage * 2; addCoins(bonus);
    flash('STAGE CLEAR', '', 1.6); AU.clear();
    if (G.stage > rec.stage) { rec.stage = G.stage; }
    if (G.score > rec.score) rec.score = G.score;
    store.set('rec', rec);
    S.eb.length = 0;
  }
  function gameOver() {
    setMode('over'); AU.stopMusic(); AU.over();
    if (window.OG) OG.over({ result: 'GAME OVER', score: G.score, stage: G.stage });
    if (G.score > rec.score) rec.score = G.score;
    if (G.stage > rec.stage) rec.stage = G.stage;
    store.set('rec', rec);
    $('oStage').textContent = G.stage; $('oScore').textContent = G.score.toLocaleString();
    $('oRec').textContent = 'BEST  STAGE ' + rec.stage + '  ·  ' + rec.score.toLocaleString();
    show('over', true);
  }

  function updatePlayer(dt) {
    var sp = 420, kx = 0, ky = 0;
    if (keys.ArrowLeft || keys.a) kx -= 1; if (keys.ArrowRight || keys.d) kx += 1;
    if (keys.ArrowUp || keys.w) ky -= 1; if (keys.ArrowDown || keys.s) ky += 1;
    if (kx || ky) { P.tx += kx * sp * dt; P.ty += ky * sp * dt; }
    if (PAD.x || PAD.y) { P.tx += PAD.x * sp * 1.15 * dt; P.ty += PAD.y * sp * dt; }
    var maxY = H - 60;
    P.tx = Math.max(30, Math.min(W - 30, P.tx)); P.ty = Math.max(H * 0.42, Math.min(maxY, P.ty));
    if (S.mode === 'ending') { P.tx = W / 2; P.ty = H * 0.6; }
    var ox = P.x;
    var f = Math.min(1, dt * 18);
    P.x += (P.tx - P.x) * f; P.y += (P.ty - P.y) * f;
    P.vx = (P.x - ox) / Math.max(dt, 0.001);
    if (P.inv > 0) P.inv -= dt;
    if (P.spreadT > 0) P.spreadT -= dt;
    // 호위기
    for (var i = 0; i < S.wings.length; i++) {
      var w = S.wings[i], side = i === 0 ? -1 : 1;
      var tx = P.x + side * 54, ty = P.y + 22, k = Math.min(1, dt * 8);
      w.x += (tx - w.x) * k; w.y += (ty - w.y) * k;
    }
    if (P.alive && (S.mode === 'play' || S.mode === 'intro')) {
      P.fireT -= dt;
      if (P.fireT <= 0) { fire(); P.fireT += RATE[G.up.rate]; if (P.fireT < 0) P.fireT = 0; }
    }
  }

  function spawnTick() {
    while (S.spawnQ.length && S.spawnQ[0].at <= S.st) spawnEnemy(S.spawnQ.shift());
  }
  function diveTick(dt) {
    if (S.mode !== 'play') return;
    var form = S.en.filter(function (e) { return e.state === 'form'; });
    var diving = S.en.filter(function (e) { return e.state === 'dive'; }).length;
    var left = S.en.length + S.spawnQ.length;
    var gap = D.diveGap * (left <= 4 ? 0.45 : 1) * (S.st > 80 ? 0.4 : 1);
    S.diveT -= dt;
    if (S.diveT <= 0 && form.length && diving < D.divers + (left <= 4 ? 2 : 0)) {
      var pool = form.filter(function (e) { return e.type !== 'cage' || Math.random() < 0.15; });
      if (pool.length) {
        var e = pool[Math.floor(Math.random() * pool.length)];
        startDive(e);
        if (G.stage >= 6 && Math.random() < 0.35) {           // 옆자리 호위가 따라 내려온다
          var buddy = form.filter(function (o) { return o !== e && o.slot && Math.abs(o.slot.c - e.slot.c) === 1 && o.slot.r === e.slot.r; })[0];
          if (buddy) { startDive(buddy); }
        }
      }
      S.diveT = gap * (0.6 + Math.random() * 0.6);
    }
    // 대형에서 가끔 쏜다
    if (D.formFire && form.length) {
      S.ffAcc += D.formFire * dt;
      if (S.ffAcc >= 1) {
        S.ffAcc -= 1;
        var sh = form[Math.floor(Math.random() * form.length)];
        eShoot(sh.x, sh.y + 16, aim(sh.x, sh.y) + (Math.random() - 0.5) * 0.04, D.bspd * 0.9);
      }
    }
  }
  function startDive(e) {
    e.state = 'dive'; e.path = divePath(e); e.d = 0; e.shots = e.type === 'cage' ? 0 : D.diveShots; e.fireT = 0.35 + Math.random() * 0.3; e.bombT = 0.5;
    AU.lose();
  }

  function updateEnemies(dt) {
    for (var i = S.en.length - 1; i >= 0; i--) {
      var e = S.en[i];
      if (e.dead) { S.en.splice(i, 1); continue; }
      e.t += dt; if (e.flash > 0) e.flash -= dt;
      var ox = e.x;
      if (e.state === 'enter') {
        e.d += D.enterSpd * dt; var p = along(e.path, e.d); e.x = p[0]; e.y = p[1];
        if (e.enterShot && e.y > H * 0.3 && e.y < H * 0.62 && e.type !== 'cage') { e.enterShot = false; eShoot(e.x, e.y + 16, aim(e.x, e.y), D.bspd); }
        if (e.d >= e.path.len) e.state = 'join';
      } else if (e.state === 'join') {
        var s = slotPos(e.slot.c, e.slot.r), dx = s.x - e.x, dy = s.y - e.y, dist = Math.hypot(dx, dy), v = 320 * dt;
        if (dist <= v + 1) { e.state = 'form'; e.x = s.x; e.y = s.y; } else { e.x += dx / dist * v; e.y += dy / dist * v; }
      } else if (e.state === 'form') {
        var s2 = slotPos(e.slot.c, e.slot.r); e.x = s2.x; e.y = s2.y;
      } else if (e.state === 'dive') {
        e.d += D.diveSpd * (e.type === 'armor' ? 1.25 : 1) * dt;
        var p2 = along(e.path, e.d); e.x = p2[0]; e.y = p2[1];
        if (e.shots > 0 && e.y > H * 0.22 && e.y < H * 0.62) {
          e.fireT -= dt;
          if (e.fireT <= 0) { e.shots--; e.fireT = 0.4; eShoot(e.x, e.y + 16, aim(e.x, e.y) + (Math.random() - 0.5) * 0.04, D.bspd); }
        }
        if (e.type === 'bomber' && e.y > H * 0.3 && e.y < H * 0.7) {
          e.bombT -= dt;
          if (e.bombT <= 0 && (e.bombs === undefined || e.bombs > 0)) { e.bombT = S.kind === 'boss' ? 1.4 : 0.75; if (e.bombs !== undefined) e.bombs--; S.eb.push({ x: e.x, y: e.y + 18, vx: 0, vy: 150 + D.bspd * 0.25, k: 'cheese', r: 11, rot: 0 }); }
        }
        if (e.d >= e.path.len) {
          if (!e.slot) { S.en.splice(i, 1); continue; }
          var s3 = slotPos(e.slot.c, e.slot.r); e.x = s3.x; e.y = -50; e.state = 'join';
        }
      }
      e.vx = (e.x - ox) / Math.max(dt, 0.001);
      // 부딪힘: 날아 들어오는 중·대형·급강하 모두. 무적(깜빡임) 중에는 그냥 지나간다
      if (P.alive && P.inv <= 0 && !GOD && S.mode !== 'clear' && e.y > 0 && Math.hypot(e.x - P.x, e.y - P.y) < e.r + 18) { hurt(true); kill(e, false); }
    }
  }

  function updateBoss(dt) {
    var b = S.boss; b.t += dt; if (b.flash > 0) b.flash -= dt;
    if (b.dead) return;
    var emp = b.type === 'emperor', phase = b.hp < b.max * 0.5 ? 1 : 0;
    if (emp && b.hp < b.max * 0.25) phase = 2;
    if (P.alive && P.inv <= 0 && !GOD && S.mode !== 'clear') {      // 보스 몸체에 박으면 맞고 튕겨 나간다
      var bx = (P.x - b.x) / (b.rx + 14), by = (P.y - b.y) / (b.ry + 26);
      if (bx * bx + by * by < 1) { hurt(true); P.ty = Math.min(H - 60, P.ty + 170); P.y = Math.min(H - 60, P.y + 60); S.shake = 0.7; }
    }
    if (b.entering) { b.y += (b.ty - b.y) * Math.min(1, dt * 1.6); if (Math.abs(b.y - b.ty) < 3) { b.entering = false; b.t = 0; } return; }
    b.x = W / 2 + Math.sin(b.t * (0.45 + phase * 0.15)) * (W * 0.24);
    b.y = b.ty + Math.sin(b.t * 0.9) * 14;
    b.atkT -= dt;
    var cannon = function (s) { return { x: b.x + s * b.rx * 0.72, y: b.y + b.ry * 1.25 }; };
    if (b.spiral > 0) {
      b.spiral -= dt; b.spT = (b.spT || 0) - dt;
      if (b.spT <= 0) { b.spT = emp ? 0.075 : 0.09; b.spA = (b.spA || 0) + 0.42; for (var k = 0; k < 1; k++) eShoot(b.x, b.y + 20, b.spA + k * Math.PI, D.bspd * 0.75); }
    }
    if (b.atkT > 0) return;
    if (S.eb.length > Math.round((emp ? 20 : 8 + b.bi * 2) * 1.5)) { b.atkT = 0.3; return; }     // 화면에 탄이 많으면 쉬었다 쏜다
    // 보스 차례(bi)에 따라 세기를 나눈다: 1번째는 탄 적고 느리게, 뒤로 갈수록 촘촘하게
    var bi = b.bi, lvl = Math.min(1, (bi - 1) / 4);      // 0(첫 보스) ~ 1(다섯 번째부터)
    var bs = D.bspd * (0.7 + 0.3 * lvl);
    var seq = emp ? ['fan', 'aim', 'summon', 'cheese', 'spiral', 'fan', 'aim']
      : bi === 1 ? ['fan', 'summon', 'aim'] : (phase && bi >= 3) ? ['fan', 'aim', 'spiral', 'summon'] : ['fan', 'aim', 'summon'];
    var atk = seq[b.atk++ % seq.length];
    b.atkT = (emp ? 2.0 - phase * 0.3 : (3.2 - lvl * 0.9) - phase * (0.2 + lvl * 0.2)) / 1.5;   // 공격도 1.5배 자주
    if (atk === 'fan') {
      var n = emp ? 8 + phase : Math.round(4 + lvl * 4) + phase;
      var spread = 0.9 + lvl * 0.6;
      [-1, 1].forEach(function (s) { var c = cannon(s), base = Math.max(Math.PI * 0.2, Math.min(Math.PI * 0.8, aim(c.x, c.y))); for (var i = 0; i < n; i++) eShoot(c.x, c.y, base + (i / (n - 1) - 0.5) * spread, bs * 0.85); });
      AU.hit();
    } else if (atk === 'aim') {
      var bursts = emp ? 3 : 1 + Math.round(lvl * 2), fan3 = emp || bi >= 3;
      for (var r = 0; r < bursts; r++) S.timers.push({ t: r * 0.3, fn: function () { if (!S.boss || S.boss.dead) return; [-1, 1].forEach(function (s) { var c = cannon(s); var a = aim(c.x, c.y); for (var j = fan3 ? -1 : 0; j <= (fan3 ? 1 : 0); j++) eShoot(c.x, c.y, a + j * 0.13, bs); }); } });
    } else if (atk === 'summon') {
      var cnt = emp ? 5 + phase : 2 + Math.round(lvl * 2) + (bi >= 3 ? phase : 0);
      for (var q = 0; q < cnt; q++) {
        (function (q) {
          S.timers.push({ t: q * 0.25, fn: function () {
            if (!S.boss || S.boss.dead) return;
            var tp = emp && q % 2 ? 'armor' : (q % 3 === 2 && b.bi >= 3 ? 'bomber' : 'grunt');
            var e = { type: tp, hp: HP[tp], r: RAD[tp], slot: null, state: 'dive', d: 0, x: b.x + (q % 2 ? 1 : -1) * 60, y: b.y + 30, vx: 0, flash: 0, t: 0, shots: 1, fireT: 0.5, bombT: 0.5 };
            e.bombs = 2; e.path = divePath(e); S.en.push(e);
          } });
        })(q);
      }
    } else if (atk === 'spiral') { b.spiral = 2.4; b.spT = 0; }
    else if (atk === 'cheese') { for (var z = 0; z < 5; z++) S.eb.push({ x: 40 + Math.random() * (W - 80), y: -20 - Math.random() * 200, vx: 0, vy: 160 + Math.random() * 60, k: 'cheese', r: 11, rot: 0 }); }
  }
  function bossDown() {
    var b = S.boss; b.dead = true; S.eb.length = 0;
    var emp = b.type === 'emperor';
    S.en.forEach(function (e) { e.dead = true; explode(e.x, e.y, false); });
    for (var i = 0; i < 9; i++) (function (i) {
      S.timers.push({ t: i * 0.16, fn: function () { explode(b.x + (Math.random() - 0.5) * b.rx * 1.6, b.y + (Math.random() - 0.5) * b.ry * 2, true); AU.boom(true); S.shake = 0.6; } });
    })(i);
    S.timers.push({ t: 1.6, fn: function () {
      explode(b.x, b.y, true); S.parts.push({ k: 'glow', x: b.x, y: b.y, life: 0, max: 0.6, size: 420, col: '#fff' });
      for (var c = 0; c < (emp ? 60 : 36); c++) S.drops.push({ k: c % 6 ? 'coin' : 'big', x: b.x + (Math.random() - 0.5) * 120, y: b.y, vx: (Math.random() - 0.5) * 360, vy: -120 - Math.random() * 260, t: Math.random() * 6 });
      addScore(emp ? 30000 : 5000, b.x, b.y);
      S.boss = null;
      S.timers.push({ t: 1.2, fn: function () { if (emp) S.endingNext = true; stageClear(); } });
    } });
  }

  function bonusTick(dt) {
    var bo = S.bonus; if (S.mode !== 'play') return;
    bo.t += dt;
    if (bo.t < bo.dur) {
      bo.spawnT -= dt;
      if (bo.spawnT <= 0) {
        bo.wave++;
        var pat = Math.floor(bo.wave / 10) % 4, x;
        if (pat === 0) x = W / 2 + Math.sin(bo.wave * 0.5) * 190;
        else if (pat === 1) x = 60 + (bo.wave % 9) * 52;
        else if (pat === 2) x = W - 60 - (bo.wave % 9) * 52;
        else x = bo.wave % 2 ? W / 2 - 150 - Math.sin(bo.wave) * 40 : W / 2 + 150 + Math.sin(bo.wave) * 40;
        S.drops.push({ k: 'fish', x: x, y: -30, vx: 0, vy: 230 + Math.min(120, G.stage * 5), t: bo.wave, bonus: 1 });
        bo.total++;
        bo.spawnT = 0.32;
      }
    } else if (!S.drops.some(function (d) { return d.bonus; }) && !bo.done) {
      bo.done = true;
      if (bo.got === bo.total) { flash('PERFECT', 'cyan', 1.5); addCoins(30); AU.fanfare(); }
      else flash('🐟 ' + bo.got + '/' + bo.total, '', 1.4);
      S.timers.push({ t: 1.4, fn: stageClear });
    }
  }

  function updateBullets(dt) {
    var i, j;
    for (i = S.pb.length - 1; i >= 0; i--) {
      var b = S.pb[i]; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -40 || b.x < -40 || b.x > W + 40) { S.pb.splice(i, 1); continue; }
      var hit = false;
      for (j = 0; j < S.en.length; j++) {
        var e = S.en[j]; if (e.dead) continue;
        var dx = b.x - e.x, dy = b.y - e.y;
        if (dx * dx + dy * dy < e.r * e.r) {
          e.hp--; e.flash = 0.07; hit = true;
          parts(b.x, b.y, 3, { k: 'spark', spd: 160, life: 0.25, size: 2.4, col: '#bff' });
          if (e.hp <= 0) kill(e, e.state === 'dive'); else AU.hit();
          break;
        }
      }
      if (!hit) {                                              // 치즈 폭탄은 쏘면 부서진다
        for (j = S.eb.length - 1; j >= 0; j--) {
          var cq = S.eb[j]; if (cq.k !== 'cheese') continue;
          if ((b.x - cq.x) * (b.x - cq.x) + (b.y - cq.y) * (b.y - cq.y) < 20 * 20) {
            S.eb.splice(j, 1); hit = true;
            parts(cq.x, cq.y, 12, { k: 'debris', spd: 200, life: 0.6, size: 4, col: ['#fff2a0', '#f2c030', '#b88010'], vy: 60 });
            parts(cq.x, cq.y, 8, { k: 'spark', spd: 220, life: 0.35, size: 2.6, col: ['#ffcf5a', '#ff7a3a'] });
            S.parts.push({ k: 'ring', x: cq.x, y: cq.y, life: 0, max: 0.3, size: 36, col: '#ffcf5a' });
            addScore(20, cq.x, cq.y - 12); AU.hit();
            break;
          }
        }
      }
      if (!hit && S.bonus) {                                   // 보너스 생선은 쏴도 먹힌다
        for (j = S.drops.length - 1; j >= 0; j--) {
          var fd = S.drops[j]; if (!fd.bonus) continue;
          if ((b.x - fd.x) * (b.x - fd.x) + (b.y - fd.y) * (b.y - fd.y) < 34 * 34) { S.drops.splice(j, 1); catchFish(fd); hit = true; break; }
        }
      }
      if (!hit && S.boss && !S.boss.dead && !S.boss.entering) {
        var bb = S.boss, ex = (b.x - bb.x) / bb.rx, ey = (b.y - bb.y) / bb.ry;
        if (ex * ex + ey * ey < 1) {
          hit = true; bb.hp--; bb.flash = 0.05;
          parts(b.x, b.y, 2, { k: 'spark', spd: 140, life: 0.2, size: 2.4, col: '#bff' });
          if (bb.hp <= 0) bossDown(); else if (Math.random() < 0.3) AU.hit();
        }
      }
      if (hit) S.pb.splice(i, 1);
    }
    for (i = S.eb.length - 1; i >= 0; i--) {
      var q = S.eb[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += dt * 4;
      if (q.y > H + 40 || q.y < -260 || q.x < -40 || q.x > W + 40) { S.eb.splice(i, 1); continue; }
      if (P.alive && S.mode !== 'clear') {
        var r = q.r + 9;
        if ((q.x - P.x) * (q.x - P.x) + (q.y - P.y) * (q.y - P.y) < r * r) { S.eb.splice(i, 1); hurt(); }
      }
    }
  }

  function catchFish(d) {
    addCoins(1); AU.fish(); if (S.bonus) S.bonus.got++;
    parts(d.x, d.y, 10, { k: 'spark', spd: 180, life: 0.4, size: 3, col: ['#bff4ff', '#fff', '#7fd8ff'] });
    S.parts.push({ k: 'ring', x: d.x, y: d.y, life: 0, max: 0.3, size: 40, col: '#bff4ff' });
    S.texts.push({ x: d.x, y: d.y - 14, s: '+1', t: 0, col: '#bff4ff' });
  }
  function updateDrops(dt) {
    var mag = MAG[G.up.magnet];
    for (var i = S.drops.length - 1; i >= 0; i--) {
      var d = S.drops[i]; d.t += dt;
      var dx = P.x - d.x, dy = P.y - d.y, dist = Math.hypot(dx, dy);
      var isCoin = d.k === 'coin' || d.k === 'big' || d.k === 'fish';
      if (isCoin && P.alive && (dist < mag || S.vacuum)) {
        var pull = S.vacuum ? 900 : 700 * (1 - dist / (mag + 1)) + 200;
        d.vx += dx / (dist + 1) * pull * dt * 6; d.vy += dy / (dist + 1) * pull * dt * 6;
        d.vx *= 0.9; d.vy *= 0.9;
      } else if (d.k === 'cage') {
        d.vy = 62; d.vx = Math.sin(d.t * 1.6) * 30;
      } else if (d.k === 'fish') {
        d.vx = Math.sin(d.t * 3) * 20;
      } else {
        d.vy = Math.min(d.k === 'coin' || d.k === 'big' ? 170 : 110, d.vy + 260 * dt); d.vx *= 0.98;
      }
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < 16) { d.x = 16; d.vx = Math.abs(d.vx); } if (d.x > W - 16) { d.x = W - 16; d.vx = -Math.abs(d.vx); }
      var grab = d.k === 'cage' ? 44 : d.k === 'fish' ? 46 : 30;
      if (P.alive && dist < grab) {
        S.drops.splice(i, 1);
        if (d.k === 'coin') { addCoins(1); AU.coin(); }
        else if (d.k === 'big') { addCoins(5); AU.coin(); S.texts.push({ x: d.x, y: d.y - 10, s: '+5', t: 0, col: '#ffe066' }); }
        else if (d.k === 'fish') catchFish(d);
        else if (d.k === 'power') { P.spreadT = 12; AU.power(); flash('POWER UP', 'cyan', 0.9); }
        else if (d.k === 'bubble') { P.shield = Math.min(3, P.shield + 1); AU.shield(); hud(); }
        else if (d.k === 'cage') { var ci = S.carried.indexOf(d.coat); if (ci >= 0) S.carried.splice(ci, 1); rescue(d.coat, d.x, d.y); }
        else if (d.k === 'chest') { addCoins(25); AU.fanfare(); S.texts.push({ x: d.x, y: d.y - 10, s: '+25', t: 0, col: '#ffe066' }); }
        continue;
      }
      if (d.y > H + 60) {
        S.drops.splice(i, 1);
        if (d.k === 'cage') { var cj = S.carried.indexOf(d.coat); if (cj >= 0) S.carried.splice(cj, 1); S.texts.push({ x: d.x, y: H - 40, s: 'MISS', t: 0, col: '#ff8a9a' }); AU.lose(); }
      }
    }
  }

  function updateParts(dt) {
    for (var i = S.parts.length - 1; i >= 0; i--) {
      var p = S.parts[i]; p.life += dt;
      if (p.life >= p.max) { S.parts.splice(i, 1); continue; }
      if (p.vx !== undefined) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.k === 'smoke') { p.vx *= 0.94; p.vy = p.vy * 0.94 - 10 * dt; }
        else if (p.k === 'wingaway') { p.vy += 120 * dt; }
        else { p.vx *= 0.92; p.vy = p.vy * 0.92 + 200 * dt; }
        if (p.vr) p.rot += p.vr * dt;
      }
    }
    for (var j = S.texts.length - 1; j >= 0; j--) { var t = S.texts[j]; t.t += dt; t.y -= 40 * dt; if (t.t > 0.9) S.texts.splice(j, 1); }
  }

  function updatePuffs(dt) {
    var list = ART.worldPuffs(S.world);
    if (!list) { S.puffs.length = 0; return; }
    S.puffNext = (S.puffNext || 0) - dt;
    if (S.puffNext <= 0) {
      S.puffs.push({ i: Math.floor(Math.random() * list.length), x: -100 + Math.random() * (W + 200), y: -140, v: 110 + Math.random() * 80, s: 0.6 + Math.random() * 0.5, a: 0.4 + Math.random() * 0.25 });
      S.puffNext = 2.5 + Math.random() * 3;
    }
    for (var i = S.puffs.length - 1; i >= 0; i--) { var p = S.puffs[i]; p.y += p.v * dt; if (p.y > H + 160) S.puffs.splice(i, 1); }
  }

  // ── 엔딩 ──
  function startEnding() {
    setMode('ending'); AU.music('main'); AU.fanfare();
    if (window.OG) OG.over({ result: 'ALL CLEAR', score: G.score, stage: G.stage });
    S.endingT = 0; S.wings = [];
    S.parade = ART.COATS.map(function (c, i) { var row = Math.floor(i / 2) + 1, side = i % 2 ? 1 : -1; return { coat: i, x: W / 2 + side * 40 * row, y: H + 80 + row * 40, tx: W / 2 + side * 40 * row, ty: H * 0.62 + row * 44 }; });
    if (G.score > rec.score) { rec.score = G.score; store.set('rec', rec); }
    setTimeout(function () { $('eScore').textContent = G.score.toLocaleString(); show('ending', true); }, 2600);
  }
  function updateEnding(dt) {
    S.endingT += dt;
    S.parade.forEach(function (p, i) { var k = Math.min(1, dt * 2); p.x += (p.tx - p.x) * k; p.y += (p.ty + Math.sin(S.t * 2 + i) * 6 - p.y) * k; });
    S.fwT = (S.fwT || 0) - dt;
    if (S.fwT <= 0) { S.fwT = 0.45; var x = 60 + Math.random() * (W - 120), y = TOPY + Math.random() * H * 0.3; parts(x, y, 30, { k: 'spark', spd: 260, life: 1.0, size: 3, col: ['#ff7ab0', '#7ff4ff', '#ffe066', '#b08aff'][Math.floor(Math.random() * 4)] }); AU.boom(false); }
    P.x += (W / 2 - P.x) * Math.min(1, dt * 3); P.y += (H * 0.55 - P.y) * Math.min(1, dt * 3);
  }

  // ── 그리기 ──
  function spr(img, x, y, rot, sc, alpha) {
    var w = img.lw * (sc || 1), h = img.lh * (sc || 1);
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore(); }
    else ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }
  function flame(x, y, s) {
    var len = (16 + Math.random() * 9) * s;
    var gr = ctx.createLinearGradient(x, y, x, y + len);
    gr.addColorStop(0, 'rgba(255,255,230,.95)'); gr.addColorStop(0.3, 'rgba(120,220,255,.8)'); gr.addColorStop(1, 'rgba(60,120,255,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(x, y + len * 0.45, 4.5 * s, len * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawShip(img, x, y, vx, sc, blink) {
    if (blink) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var h = img.lh * sc;
    flame(x - img.lw * sc * 0.16, y + h * 0.45, sc); flame(x + img.lw * sc * 0.16, y + h * 0.45, sc);
    ctx.restore();
    spr(img, x, y, Math.max(-0.25, Math.min(0.25, vx * 0.0005)), sc);
  }
  function drawEnemy(e) {
    var img = ART.enemy[e.type], bob = Math.sin(e.t * 3) * 2.5, rot = Math.max(-0.4, Math.min(0.4, e.vx * 0.0012));
    if (e.type === 'cage' && e.coat >= 0) {
      var cg = ART.cage[e.coat], k = ART.SPR, sw = Math.sin(e.t * 2) * 3;
      ctx.drawImage(cg, 0, 42 * k, 56 * k, 50 * k, e.x - 21 + sw, e.y + 24 + bob, 42, 37.5);
    }
    spr(img, e.x, e.y + bob, rot);
    if (e.flash > 0) spr(ART.enemyFlash[e.type], e.x, e.y + bob, rot, 1, 0.8);
  }
  function render() {
    var sh = S.shake > 0 ? S.shake * 10 : 0;
    var sx = sh ? (Math.random() - 0.5) * sh : 0, sy = sh ? (Math.random() - 0.5) * sh : 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var s = scale * dpr;
    ctx.setTransform(s, 0, 0, s, (offX + sx) * dpr, (offY + sy) * dpr);
    var x0 = -offX / scale - 20, x1 = (cw - offX) / scale + 20, y0 = -offY / scale - 20, y1 = (ch - offY) / scale + 20;
    ctx.save(); ctx.translate(0, y0); ART.drawBg(ctx, S.world, S.t, x0, x1, y1 - y0, S.scroll); ctx.restore();
    var pl = ART.worldPuffs(S.world);
    if (pl) S.puffs.forEach(function (p) { spr(pl[p.i], p.x, p.y, 0, p.s, p.a); });
    // 넓은 화면이면 게임판 밖을 어둡게
    if (x0 < -24 && !VIEW.cover) {
      ctx.fillStyle = 'rgba(6,4,18,.42)'; ctx.fillRect(x0, y0, -x0, y1 - y0); ctx.fillRect(W, y0, x1 - W, y1 - y0);
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-2, y0, 2, y1 - y0); ctx.fillRect(W, y0, 2, y1 - y0);
    }
    var i;
    // 떨어지는 것
    for (i = 0; i < S.drops.length; i++) {
      var d = S.drops[i];
      if (d.k === 'coin') spr(ART.coin, d.x, d.y, 0, 1);
      else if (d.k === 'big') spr(ART.coinBig, d.x, d.y, 0, 1);
      else if (d.k === 'fish') spr(ART.fish, d.x, d.y, Math.sin(d.t * 5) * 0.22, 1 + Math.sin(d.t * 9) * 0.05);
      else if (d.k === 'power') spr(powerSpr, d.x, d.y, Math.sin(d.t * 3) * 0.3, 1 + Math.sin(d.t * 8) * 0.06);
      else if (d.k === 'bubble') spr(ART.bubble, d.x, d.y, 0, 1 + Math.sin(d.t * 6) * 0.06);
      else if (d.k === 'chest') spr(ART.chest, d.x, d.y, Math.sin(d.t * 3) * 0.15, 1);
      else if (d.k === 'cage') {
        spr(ART.cage[d.coat], d.x, d.y, Math.sin(d.t * 1.6) * 0.12, 1);
        ctx.strokeStyle = 'rgba(160,255,255,' + (0.35 + 0.25 * Math.sin(d.t * 6)) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(d.x, d.y + 10, 40 + Math.sin(d.t * 6) * 3, 0, Math.PI * 2); ctx.stroke();
      }
    }
    for (i = 0; i < S.en.length; i++) drawEnemy(S.en[i]);
    if (S.boss) {
      var b = S.boss, bimg = ART.enemy[b.type];
      spr(bimg, b.x, b.y, Math.sin(b.t * 0.45) * 0.03);
      if (b.flash > 0) spr(ART.enemyFlash[b.type], b.x, b.y, Math.sin(b.t * 0.45) * 0.03, 1, 0.55);
    }
    // 내 탄
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < S.pb.length; i++) { var pb = S.pb[i]; spr(pb.w ? wbSpr : pbSpr, pb.x, pb.y, Math.atan2(pb.vx, -pb.vy)); }
    ctx.restore();
    // 호위기·나
    var blink = P.inv > 0 && P.alive && Math.floor(P.inv * 14) % 2 === 0;
    for (i = 0; i < S.wings.length; i++) { var w = S.wings[i]; drawShip(ART.wing[w.coat], w.x, w.y, P.vx, 1, blink); }
    if (S.parade && S.mode === 'ending') S.parade.forEach(function (p) { drawShip(ART.wing[p.coat], p.x, p.y, 0, 0.8, false); });
    if (P.alive && S.mode !== 'over') {
      drawShip(ART.player, P.x, P.y, P.vx, 1, blink);
      if (P.shield > 0) {
        ctx.strokeStyle = 'rgba(150,240,255,' + (0.5 + 0.2 * Math.sin(S.t * 6)) + ')'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(P.x, P.y + 4, 50, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(150,240,255,.08)'; ctx.fill();
      }
      if (P.spreadT > 0) { ctx.strokeStyle = 'rgba(255,200,90,' + (0.3 + 0.2 * Math.sin(S.t * 10)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P.x, P.y + 4, 44, 0, Math.PI * 2); ctx.stroke(); }
    }
    // 적 탄
    for (i = 0; i < S.eb.length; i++) {
      var q = S.eb[i];
      if (q.k === 'cheese') {
        var cr = Math.sin(q.rot * 1.5) * 0.3;
        spr(ART.cheese, q.x, q.y, cr, 1.15);
        // 심지 끝 불꽃
        var fx = q.x + 8 * Math.cos(cr) + 23 * Math.sin(cr), fy = q.y + 8 * Math.sin(cr) - 23 * Math.cos(cr);
        var fs = 6 + Math.random() * 4;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        var fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, fs * 1.8);
        fg.addColorStop(0, 'rgba(255,255,220,1)'); fg.addColorStop(0.35, 'rgba(255,190,60,.9)'); fg.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = fg; ctx.fillRect(fx - fs * 2, fy - fs * 2, fs * 4, fs * 4);
        ctx.restore();
        if (Math.random() < 0.3) S.parts.push({ k: 'spark', x: fx, y: fy, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, life: 0, max: 0.25, size: 1.6, col: '#ffcf5a' });
      }
      else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; spr(ebSpr, q.x, q.y, 0, 1); ctx.restore(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, 7); ctx.fill(); }
    }
    // 입자
    for (i = 0; i < S.parts.length; i++) {
      var p = S.parts[i], k = p.life / p.max;
      if (p.k === 'spark') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = p.col; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k * 0.5), 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      else if (p.k === 'smoke') { ctx.globalAlpha = 0.45 * (1 - k); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + k), 0, 7); ctx.fill(); }
      else if (p.k === 'ring') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.col; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.2 + k * 0.8), 0, 7); ctx.stroke(); }
      else if (p.k === 'glow') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k; var gg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); gg.addColorStop(0, 'rgba(255,240,200,.9)'); gg.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gg; ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2); ctx.globalCompositeOperation = 'source-over'; }
      else if (p.k === 'debris') { ctx.globalAlpha = 1 - k; ctx.fillStyle = p.col; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size); ctx.restore(); }
      else if (p.k === 'heart') { ctx.globalAlpha = 1 - k; ctx.fillStyle = p.col; var hs = p.size; ctx.beginPath(); ctx.moveTo(p.x, p.y + hs * 0.8); ctx.bezierCurveTo(p.x - hs * 1.3, p.y, p.x - hs * 0.6, p.y - hs, p.x, p.y - hs * 0.35); ctx.bezierCurveTo(p.x + hs * 0.6, p.y - hs, p.x + hs * 1.3, p.y, p.x, p.y + hs * 0.8); ctx.fill(); }
      else if (p.k === 'wingaway') { ctx.globalAlpha = 1 - k; spr(ART.wing[p.coat], p.x, p.y, p.rot, 1 - k * 0.4); }
      ctx.globalAlpha = 1;
    }
    // 점수 글자
    ctx.font = '900 18px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,10,40,.8)';
    for (i = 0; i < S.texts.length; i++) { var t = S.texts[i]; ctx.globalAlpha = Math.min(1, (0.9 - t.t) * 3); ctx.strokeText(t.s, t.x, t.y); ctx.fillStyle = t.col; ctx.fillText(t.s, t.x, t.y); }
    ctx.globalAlpha = 1;
    if (S.bombFx) drawBombFx();
    // 보스 체력
    if (S.boss && !S.boss.entering) {
      var bw = W * 0.7, bx = (W - bw) / 2, by = topBelow() + 8;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; roundRect(bx - 3, by - 3, bw + 6, 16, 8); ctx.fill();
      var f = Math.max(0, S.boss.hp / S.boss.max);
      var hg = ctx.createLinearGradient(bx, 0, bx + bw, 0); hg.addColorStop(0, '#ff4a6a'); hg.addColorStop(1, '#ffb04a');
      ctx.fillStyle = hg; roundRect(bx, by, bw * f, 10, 5); ctx.fill();
    }
    // 보너스 시간
    if (S.bonus && S.mode === 'play' && S.bonus.t < S.bonus.dur) {
      var left = Math.ceil(S.bonus.dur - S.bonus.t);
      ctx.font = '900 30px Arial, sans-serif'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,10,40,.8)'; ctx.fillStyle = left <= 5 ? '#ff8a9a' : '#fff';
      var ty = topBelow() + 34; ctx.strokeText(left, W / 2, ty); ctx.fillText(left, W / 2, ty);
      ctx.font = '900 18px Arial, sans-serif'; ctx.fillStyle = '#aef'; ctx.lineWidth = 4; ctx.strokeText('🐟 ' + S.bonus.got, W / 2, ty + 28); ctx.fillText('🐟 ' + S.bonus.got, W / 2, ty + 28);
    }
    if (S.hitFx > 0) {                                     // 맞으면 가장자리가 빨갛게
      var hg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.3, cw / 2, ch / 2, Math.max(cw, ch) * 0.7);
      hg.addColorStop(0, 'rgba(255,40,40,0)'); hg.addColorStop(1, 'rgba(255,40,40,' + (S.hitFx * 1.2).toFixed(3) + ')');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = hg; ctx.fillRect(0, 0, cw, ch);
    }
    // 테두리 어둡게
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,10,.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
  }
  // 상단바(두 줄로 접혀도) 바로 아래의 논리 좌표 y
  var topbarEl = $('topbar');
  function topBelow() { return (topbarEl.getBoundingClientRect().bottom - offY) / scale; }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); r = Math.min(r, w / 2, h / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // ── 루프 ──
  var last = 0;
  function loop(ts) {
    var dt = Math.min(1 / 30, (ts - last) / 1000 || 0); last = ts;
    update(dt); render();
    requestAnimationFrame(loop);
  }
  toTitle();
  render();
  requestAnimationFrame(loop);

  // 시험 손잡이(미리보기 창은 rAF 가 안 돈다)
  window.__ms = {
    get S() { return S; }, get G() { return G; }, get P() { return P; }, ART: ART,
    tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); render(); return S.mode; },
    newGame: newGame, startAt: function (n, extra) { AU.init(); G = newRun(); G.stage = n; if (extra) for (var k in extra) G[k] = extra[k]; resetStage(); startStage(); return S.kind; },
    toTitle: toTitle, openShop: openShop, openDex: openDex, stageClear: stageClear, hurt: hurt, rescue: rescue,
    god: function (on) { GOD = !!on; },
    view: function (o) { VIEW.offX = o && o.offX !== undefined ? o.offX : null; VIEW.cover = !!(o && o.cover); VIEW.zoom = (o && o.zoom) || 1; VIEW.offY = o && o.offY !== undefined ? o.offY : null; resize(); render(); },
    canvas: cv, render: render
  };
})();
