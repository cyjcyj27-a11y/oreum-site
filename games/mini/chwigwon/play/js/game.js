/* 취권 — 거리를 오른쪽으로 밀고 나가며 취권으로 싸우는 2D 옆보기 격투.
 * 월드 높이 540, 바닥 FY. 8스테이지(보스 8명)를 깨면 엔딩, 그 뒤 9스테이지부터 끝없음(보스 돌려쓰기).
 * 술: L 로 호리병을 마시면 취기(0~100)가 오른다. 취할수록 세지고 비틀거린다. 세 병(취기 100)이면 만취 = 취권 — 가로로 누운 채 공중에 떠서 5초 동안 다가오는 놈을 저절로 친다.
 * 시험 손잡이: window.__cg = { tick(n, dt, nodraw), G, P, go(stage), key(k, down), save }
 */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('cv'), c = cv.getContext('2d');
  var PI = Math.PI, FY = 484, K = 0.6;                 // K: 시트 픽셀 → 월드 배율(주인공 키 400px → 240)
  var EN = /[?&]lang=en\b/.test(location.search);
  var STAGES = [
    { name: '저택 앞', en: 'MANSION GATE', boss: '도적 두목', bossEn: 'BANDIT CHIEF' },
    { name: '저잣거리', en: 'MARKET STREET', boss: '왈패 대장', bossEn: 'MARKET BULLY' },
    { name: '거지 골목', en: 'BEGGAR ALLEY', boss: '거지 왕초', bossEn: 'BEGGAR KING' },
    { name: '도박장', en: 'GAMBLING DEN', boss: '도박장 주인', bossEn: 'DEN MASTER' },
    { name: '나루터', en: 'RIVER DOCK', boss: '뱃사공 거인', bossEn: 'GIANT BOATMAN' },
    { name: '산길', en: 'MOUNTAIN PASS', boss: '산적 두목', bossEn: 'MOUNTAIN BANDIT' },
    { name: '관아', en: 'MAGISTRATE', boss: '장군', bossEn: 'THE GENERAL' },
    { name: '무술대회', en: 'TOURNAMENT', boss: '흑의 고수', bossEn: 'BLACK MASTER' }
  ];
  if (EN) {
    $('rotTitle').textContent = 'This game is played in landscape';
    $('rotGo').textContent = 'Rotate to landscape';
    $('rotHelp').textContent = 'If the button does nothing, unlock screen rotation and turn your phone';
    $('rotSkip').textContent = 'Play in portrait anyway';
    $('keys').textContent = '←→ Move (double-tap: dash) · J Punch (hold: uppercut) · K Kick · J+K Wine Blast · L Drink · S Guard (crouch)';
    $('h1').innerHTML = '<span class="top">DRUNKEN FIST</span>SOCHAN<span class="seal">醉拳</span>'; $('h1').className = 'en'; document.title = 'Drunken Fist: Sochan'; document.documentElement.lang = 'en';
    $('endT').textContent = 'CHAMPION'; $('endT').style.fontFamily = 'Ria';
  }

  // ── 저장 ──
  var save = { stage: 1, best: 0, ko: 0, ended: false };
  try { var sv = JSON.parse(localStorage.getItem('chwigwon.prog') || 'null'); if (sv) save = Object.assign(save, sv); } catch (e) {}
  function store() { try { localStorage.setItem('chwigwon.prog', JSON.stringify(save)); } catch (e) {} }

  // ── 화면 ──
  var W, H, S, VW, dpr, vig = null;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (innerWidth < 50 || innerHeight < 50) { if (!W) { W = 1280; H = 720; } else return; }   // 숨은 탭에서 0 이 들어오면 NaN 이 퍼진다
    else { W = innerWidth; H = innerHeight; }
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    S = H / 540; VW = W / S;
    if (VW < 700) { S = W / 700; VW = 700; }
    vig = null;
    document.body.classList.toggle('portrait', innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
  }
  addEventListener('resize', resize);

  // ── 적 종류 ── (칸: 0 서기 1 걷기 2 공격 3 맞음 4 비웃기/큰 공격)
  var KINDS = {
    g1: { sheet: 'grunt1', hp: 30, spd: 105, reach: 96, wind: .5, act: .2, rec: .5, dmg: 4, cd: [1.1, 2.0], w: 1.2, girth: 1.1 },
    g2: { sheet: 'grunt2', hp: 26, spd: 118, reach: 150, wind: .62, act: .2, rec: .6, dmg: 5, cd: [1.2, 2.2], w: 1, girth: 1 },
    boss: { hp: 240, spd: 92, reach: 130, wind: .5, act: .22, rec: .45, dmg: 13, cd: [0.65, 1.2], w: 3, girth: 1.3, armor: 1 }
  };
  // 보스마다 다른 손맛
  var BOSSES = [
    { reach: 150, dmg: 14, spd: 90, big: { wind: 1.0, dmg: 24, range: 200, kb: 520 } },     // 1 대도
    { reach: 120, dmg: 16, spd: 78, w: 4, girth: 1.6, big: { wind: .9, dmg: 22, range: 170, kb: 620, quake: 1 } },  // 2 뚱보 철퇴
    { reach: 140, dmg: 12, spd: 110, big: { wind: .7, dmg: 18, range: 190, kb: 480 } },      // 3 거지 왕초 지팡이
    { reach: 110, dmg: 11, spd: 120, big: { wind: .55, dmg: 12, range: 380, kb: 300, throw: 1 } },   // 4 던지기
    { reach: 150, dmg: 16, spd: 72, w: 4.5, girth: 1.7, big: { wind: 1.1, dmg: 26, range: 210, kb: 700, quake: 1 } },  // 5 거인 노
    { reach: 130, dmg: 15, spd: 118, big: { wind: .6, dmg: 20, range: 160, kb: 500, twice: 1 } },   // 6 도끼 두 자루
    { reach: 150, dmg: 15, spd: 96, big: { wind: .9, dmg: 24, range: 220, kb: 560 } },       // 7 장창
    { reach: 125, dmg: 17, spd: 135, big: { wind: .5, dmg: 24, range: 170, kb: 520, twice: 1 } }    // 8 고수
  ];

  // ── 주인공의 기술 ── (칸: hero1 0 서기 1 걷기 2 주먹 3 발차기 4 마시기 / hero2 0 취해 젖힘 1 휘두르기 2 맞음 3 막기 4 승리)
  // hero3 0 잽 1 훅 2 팔꿈치 3 돌려차기 4 어퍼컷 / hero4 0 술뿜기 1 물구나무발차기 2 다리후리기 3 날아차기 4 기모으기 / hero5 0 대시 1 날아차기 2 착지 3 구르기 4 도발
  var MOVES = {
    a1: { wind: .05, act: .08, rec: .14, dmg: 8, kb: 150, up: 0, range: 104, sheet: 'hero3', cell: 0, snd: 1, step: 60 },
    a2: { wind: .06, act: .09, rec: .15, dmg: 10, kb: 200, up: 0, range: 108, sheet: 'hero3', cell: 1, snd: 1, step: 70, lean: .1 },
    a3: { wind: .07, act: .09, rec: .16, dmg: 12, kb: 240, up: 0, range: 100, sheet: 'hero3', cell: 2, snd: 1.2, step: 90, lean: .14 },
    a4: { wind: .1, act: .12, rec: .22, dmg: 16, kb: 380, up: 300, range: 130, sheet: 'hero3', cell: 3, snd: 1.4, step: 120, ghost: 1, spin: 1 },
    a5: { wind: .08, act: .16, rec: .34, dmg: 22, kb: 300, up: 620, range: 116, sheet: 'hero3', cell: 4, snd: 2, step: 80, ghost: 1, jump: 150, land: 1 },
    kick: { wind: .08, act: .1, rec: .24, dmg: 6, kb: 340, up: 0, range: 118, sheet: 'hero1', cell: 3, snd: 0, stun: .5, step: 90 },
    hand: { wind: .12, act: .18, rec: .3, dmg: 14, kb: 420, up: 380, range: 140, sheet: 'hero4', cell: 1, snd: 1.6, step: 60, ghost: 1, both: 1 },   // 만취 발차기: 물구나무, 양쪽
    sweep: { wind: .1, act: .14, rec: .3, dmg: 10, kb: 260, up: 260, range: 150, sheet: 'hero4', cell: 2, snd: 1.2, step: 60, ghost: 1, both: 1, low: 1 },
    spray: { wind: .22, act: .5, rec: .4, dmg: 34, kb: 560, up: 300, range: 300, sheet: 'hero4', cell: 0, snd: 0, step: 0, ghost: 1, spray: 1 },   // 술 뿜기(필살기)
    dash: { wind: 0, act: .26, rec: .06, dmg: 0, kb: 0, up: 0, range: 0, sheet: 'hero5', cell: 0, snd: 0, step: 560, ghost: 1, dash: 1 },
    fly: { wind: .06, act: .3, rec: .3, dmg: 20, kb: 520, up: 340, range: 130, sheet: 'hero5', cell: 1, snd: 1.6, step: 380, ghost: 1, jump: 120, land: 1 },   // 대시 중 J: 날아차기
    charge: { wind: .5, act: .01, rec: .01, dmg: 0, kb: 0, up: 0, range: 0, sheet: 'hero4', cell: 4, snd: 0, step: 0 },
    taunt: { wind: .3, act: .9, rec: .3, dmg: 0, kb: 0, up: 0, range: 0, sheet: 'hero5', cell: 4, snd: 0, step: 0 },
    drink: { wind: .18, act: .32, rec: .22, dmg: 0, kb: 0, up: 0, range: 0, sheet: 'hero1', cell: 4, snd: 0, step: 0 }
  };
  var COMBO = ['a1', 'a2', 'a3', 'a4', 'a5'];
  var DMUL = [1, 1.5, 2.2], KBMUL = [1, 1.3, 1.8];   // 취기 단계별 공격력·밀치기

  var G, P, ARENA = 700;
  function newPlayer() {
    return { x: 150, h: 0, vh: 0, vx: 0, face: 1, hp: 100, max: 100, sheet: 'hero1', cell: 0, rot: 0, lean: 0, bob: 0,
      state: 'idle', t: 0, move: null, combo: 0, comboT: 0, buf: null, inv: 0, walkP: 0, hurtT: 0, dead: false, flash: 0,
      drunk: 0, hold: 0, lift: 0, wine: 3, chwi: 0, sway: 0, hicT: 2 };
  }
  function lvl() { return P.drunk >= 65 ? 2 : P.drunk >= 30 ? 1 : 0; }   // 한 병 34 · 두 병 68 · 세 병이면 100(취권)

  // ── 스테이지 만들기 ──
  function stageInfo(n) { return STAGES[(n - 1) % 8]; }
  function bossIdx(n) { return (n - 1) % 8; }
  function buildStage(n) {
    var loop = Math.floor((n - 1) / 8);                       // 9스테이지부터 한 바퀴씩 더 세진다
    var nw = Math.min(6, 3 + Math.floor((n - 1) / 2)), waves = [];
    for (var i = 0; i < nw; i++) {
      var cnt = Math.min(12, 3 + Math.floor(n * 0.6) + i), q = [];
      for (var k = 0; k < cnt; k++) q.push(n >= 2 && Math.random() < 0.4 + Math.min(0.2, n * 0.02) ? 'g2' : 'g1');
      var last = i === nw - 1;
      if (last) q.push('boss');
      waves.push({ x: 560 + i * 600, queue: q, left: n >= 2 ? 0.28 : 0.1, maxOn: Math.min(7, 3 + Math.floor(n / 2)), done: false, started: false });
    }
    var len = 560 + nw * 600 + 380, jars = [], food = [];
    for (var j = 0; j < nw; j++) { if (j % 2 === 0 || j === nw - 1) jars.push(560 + j * 600 + 140 + Math.random() * 200); }   // 9/24 사장님 "술병이 너무 많아 반으로" — 항아리는 파도 하나 걸러 하나 + 마지막 파도(3파도 4→2개, 6파도 9→4개)
    food.push(560 + Math.floor(nw / 2) * 600 - 250);
    if (nw >= 5) food.push(560 + (nw - 1) * 600 - 250);
    return { n: n, loop: loop, waves: waves, len: len, jars: jars, food: food };
  }

  function startStage(n) {
    SND.unlock();
    var sd = buildStage(n);
    var keep = P && !P.dead && G && G.stage === n - 1 ? { hp: Math.max(70, Math.min(P.max, P.hp + 40)), wine: Math.max(P.wine, 2), drunk: P.drunk * 0.5 } : null;
    P = newPlayer();
    if (keep) { P.hp = keep.hp; P.wine = keep.wine; P.drunk = keep.drunk; }
    G = { mode: 'play', stage: n, sd: sd, len: sd.len, cam: 0, lock: null, enemies: [], parts: [], pickups: [], props: [], shards: [],
      t: 0, ko: 0, stop: 0, shake: 0, kx: 0, fin: null, spawnT: 0, wave: -1, exitT: 0, combo: 0, comboT: 0, slowT: 0, time: 0, overT: 0, beatT: 0, intro: 1.4, boss: null, wobble: 0 };
    sd.jars.forEach(function (x) { G.props.push({ kind: 'jar', x: x, hp: 2, broken: false, t: 0, wob: 0 }); });
    sd.food.forEach(function (x) { G.pickups.push({ x: x, t: 0, kind: 'food' }); });
    save.stage = n; store();
    var si = stageInfo(n);
    $('stg').textContent = 'STAGE ' + n;
    $('stageT').textContent = 'STAGE ' + n;
    $('stageN').textContent = EN ? si.en : si.name;
    showPanel('stage');
    document.body.classList.remove('title');
    G.loaded = false; loadStage(n, function () { if (G && G.stage === n) G.loaded = true; });
    SND.bgm(true);
    hud();
  }
  function stageAssets(n) {
    var b = bossIdx(n) + 1, col = ((n - 1) % 8) + 1;
    return ['bg' + b, 'boss' + b, 'boss' + b + 'b', 'boss' + b + 'c', 'grunt1_c' + col, 'grunt2_c' + col, 'grunt1b_c' + col, 'grunt2b_c' + col, 'grunt1c_c' + col, 'grunt2c_c' + col];
  }
  function loadStage(n, cb) { SPR.load(stageAssets(n), cb); SPR.load(stageAssets(n + 1), function () {}); }
  function gruntSheet(k) { return KINDS[k].sheet + '_c' + (((G.stage - 1) % 8) + 1); }

  // ── 입력 ──
  var keys = {}, pad = { x: 0, down: false }, btn = { atk: false, kick: false, drink: false, guard: false };
  var KEYMAP = { ArrowLeft: 'L', KeyA: 'L', ArrowRight: 'R', KeyD: 'R', KeyJ: 'atk', KeyZ: 'atk', KeyK: 'kick', KeyX: 'kick', KeyL: 'drink', KeyC: 'drink', KeyS: 'guard', ArrowDown: 'guard' };
  var tapT = { L: 0, R: 0 }, atkDownT = 0, kickDownT = 0;
  function trySpray() {          // J+K 를 거의 같이 누르면 방금 시작한 잽·발차기를 끊고 술 뿜기
    if (!canAct() || !P.move || P.phase !== 'wind' || P.move.name === 'spray') return false;
    if (P.move.name.charAt(0) === 'a' || P.move.name === 'kick' || P.move.name === 'hand') { P.move = null; P.combo = 0; P.comboT = 0; doMove('spray'); return true; }
    return false;
  }
  function press(k, down) {
    var now = performance.now();
    if (k === 'atk' && down && !btn.atk) { atkDownT = now; btn.atk = true; if (btn.kick || now - kickDownT < 160) { if (!trySpray()) doMove('spray'); return; } doMove('combo'); return; }
    if (k === 'atk' && !down && btn.atk && P && P.move && P.move.name === 'charge') { P.move = null; startMove('a5'); }
    if (k === 'kick' && down && !btn.kick) { kickDownT = now; btn.kick = true; if (btn.atk || now - atkDownT < 160) { if (!trySpray()) doMove('spray'); return; } doMove(P && lvl() === 2 ? 'hand' : 'kick'); return; }
    if ((k === 'L' || k === 'R') && down && !keys[k]) { var now = performance.now(); if (now - tapT[k] < 260) doMove('dash', k === 'R' ? 1 : -1); tapT[k] = now; }
    if (k === 'drink' && down && !btn.drink) doMove('drink');
    if (k === 'atk' || k === 'kick' || k === 'drink' || k === 'guard') { btn[k] = down; return; }
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
  addEventListener('blur', function () { keys = {}; btn = { atk: false, kick: false, drink: false, guard: false }; });
  function canAct() { return G && G.mode === 'play' && P && !P.dead && G.intro <= 0 && P.chwi <= 0; }

  var padEl = $('pad'), knob = $('knob'), padId = null;
  function padMove(e) {
    var r = padEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy, R = r.width / 2, d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    var k = dx / R;
    pad.down = dy / R > 0.45 && dy > Math.abs(dx);              // 패드를 아래로 당기면 앉아서 막기(9/24 사장님 "모바일에서도 아래키로 방어", 방패 단추 뺌)
    pad.x = !pad.down && Math.abs(k) > 0.22 ? Math.sign(k) : 0;
  }
  padEl.addEventListener('pointerdown', function (e) { padId = e.pointerId; padMove(e); try { padEl.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); });
  padEl.addEventListener('pointermove', function (e) { if (e.pointerId === padId) padMove(e); });
  function padEnd(e) { if (e.pointerId !== padId) return; padId = null; pad.x = 0; pad.down = false; knob.style.transform = ''; }
  padEl.addEventListener('pointerup', padEnd); padEl.addEventListener('pointercancel', padEnd);
  [['bAtk', 'atk'], ['bKick', 'kick'], ['bDrink', 'drink']].forEach(function (b) {
    var el = $(b[0]);
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); el.setPointerCapture(e.pointerId); el.classList.add('on'); SND.unlock(); press(b[1], true); });
    var up = function () { el.classList.remove('on'); press(b[1], false); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });

  // ── 주인공 기술 ──
  function doMove(name, dir) {
    if (!canAct()) return;
    if (P.hurtT > 0) { P.buf = name; return; }
    if (P.move) {
      if (name === 'combo' && P.move.name === 'dash') { P.move = null; startMove('fly'); return; }
      if (name === 'combo' && P.move.name.charAt(0) === 'a' && P.phase !== 'wind') { P.buf = 'combo'; return; }
      if (P.phase === 'rec' && P.t > P.move.m.rec * 0.45) { P.buf = name; return; }
      return;
    }
    if (name === 'drink') { if (P.wine <= 0) { SND.hic(); pop('0', P.x, FY - 250, 'wine'); return; } startMove('drink'); return; }
    if (name === 'spray') { if (P.drunk < 30) { SND.hic(); return; } P.drunk -= 30; P.hold = 0; startMove('spray'); return; }
    if (name === 'dash') { if (dir) P.face = dir; startMove('dash'); return; }     // 버퍼에서 올 땐 dir 이 없다 — 보던 쪽으로
    if (name === 'combo' || name === 'kick' || name === 'hand' || name === 'sweep') aimBack();   // 방향키를 안 눌렀으면 뒤에 붙은 놈 쪽으로 돌아선다
    if (name === 'combo') {
      var nm = P.comboT > 0 && P.combo < 5 ? COMBO[P.combo] : 'a1';
      P.combo = COMBO.indexOf(nm) + 1;
      startMove(nm);
    } else startMove(name);
  }
  function aimBack() {
    if (keys.L || keys.R || (pad && pad.x)) return;        // 방향을 누르고 있으면 그 쪽 그대로
    var fwd = 1e9, back = 1e9;
    G.enemies.forEach(function (e) {
      if (e.dead || e.state === 'down' || e.h > 160) return;
      var ad = Math.abs(e.x - P.x);
      if (ad > 200) return;
      if ((e.x - P.x) * P.face >= -18) fwd = Math.min(fwd, ad); else back = Math.min(back, ad);
    });
    if (back < fwd * 0.8) P.face = -P.face;                 // 뒤쪽이 확실히 더 가까울 때만 돌아선다
  }
  function startMove(nm) {
    var m = MOVES[nm];
    P.move = { name: nm, m: m, hit: [] }; P.phase = 'wind'; P.t = 0; P.idleT = 0;
    if (nm.charAt(0) === 'a') P.comboT = 0;          // 기술 중엔 연타 시계를 멈춘다(긴 기술 중에 만료돼 콤보가 끊기지 않게)
    if (nm === 'drink') { SND.whoosh(0.5); }
    if (nm === 'dash') { SND.whoosh(0.9); dust(P.x); }
    if (nm === 'spray') { SND.gulp(); G.flashW = 0.5; }
    if (nm === 'taunt') { SND.hic(); }
  }
  // 잔상: 화려한 기술 중엔 지나간 자리에 옅은 그림자를 남긴다
  function ghost() {
    if (!P.ghosts) P.ghosts = [];
    P.ghosts.push({ x: P.x, h: P.h, lift: P.lift, sheet: P.sheet, cell: P.cell, face: P.face, lean: P.lean, rot: P.rot, life: 0.28 });
    if (P.ghosts.length > 6) P.ghosts.shift();
  }
  function finishDrink() {
    P.wine--; P.drunk = Math.min(100, P.drunk + 34); P.hp = Math.min(P.max, P.hp + 10);   // 한 병 = 그래프 3분의 1, 세 병이면 꽉 차서 취권
    SND.gulp(); pop('🍶', P.x, FY - 260, 'wine');
    for (var i = 0; i < 6; i++) G.parts.push({ t: 'w', x: P.x + P.face * 14, y: FY - 232, vx: (Math.random() - .5) * 140, vy: -60 - Math.random() * 140, r: 2 + Math.random() * 2, life: .6 });
    if (P.drunk >= 100) { P.chwi = 5; P.move = null; P.rot = 0; SND.burp(); SND.gong && SND.gong(); pop(EN ? 'DRUNKEN FIST' : '취권', P.x, FY - 300, 'big'); }   // 3병 = 취권
    else P.hold = 5;                      // 한 모금이면 취기가 5초는 간다 — 취권이 이 게임의 핵심
    hud();
  }

  function updatePlayer(dt) {
    P.inv = Math.max(0, P.inv - dt); P.flash = Math.max(0, P.flash - dt * 6);
    if (P.comboT > 0) { P.comboT -= dt; if (P.comboT <= 0) P.combo = 0; }
    if (P.dead) { physFall(P, dt); if (P.h <= 0 && !P.laid) { P.laid = true; P.sheet = 'hero6'; P.cell = 4; P.rot = 0; P.face = -P.face; } return; }   // 떨어지면 대자로 눕는다(누운 칸은 머리가 오른쪽)
    var L = lvl();
    if (P.hold > 0) P.hold -= dt;         // 취기 유지 시간 동안은 안 깬다
    else P.drunk = Math.max(0, P.drunk - dt * (L === 2 ? 3.2 : 4.5));
    P.sway += dt * (1.6 + L * 0.9);
    var wantLift = (P.chwi > 0 && !P.dead) ? 132 + Math.sin(P.sway * 1.6) * 10 : 0;   // 취권: 가로로 누운 채 공중에 뜬다
    P.lift += (wantLift - P.lift) * Math.min(1, dt * (P.chwi > 0 ? 6 : 3.2));
    if (P.hicT > 0 && L > 0) { P.hicT -= dt; if (P.hicT <= 0) { SND.hic(); P.hicT = 2.5 + Math.random() * 3; P.bob = 10; } }
    var dir = (keys.R || pad.x > 0 ? 1 : 0) - (keys.L || pad.x < 0 ? 1 : 0);
    if (G.intro > 0 || G.exitT > 0) dir = 0;
    P.lean = 0; P.rot = 0; P.guard = false;
    if (P.chwi > 0) {          // 취권: 가로로 누운 채 공중에 떠서, 다가오는 놈을 저절로 친다
      P.chwi -= dt; P.drunk = Math.max(0, P.chwi * 20); P.hold = 0;   // 취기 그래프가 곧 취권 시간 — 다 닳으면 끝난다
      P.sheet = 'hero2'; P.cell = 0; P.rot = -PI / 2 * P.face * 0.92; P.vx = 0;
      G.enemies.forEach(function (e) {
        if (!standing(e) || e.state === 'hurt') return;
        if (Math.abs(e.x - P.x) < 132 && (e.chwiHit || 0) <= 0) {
          e.chwiHit = 0.62; P.face = e.x > P.x ? 1 : -1;
          // 띄우지 않고 비틀거리게만 — 멀리 날리면 5초 안에 못 돌아와 연타가 안 된다
          hurtEnemy(e, 22, P.face * 300, 0, 0.3, false, 'head'); SND.smash(); G.stop = 0.05; G.shake = 7;
        }
      });
      P.zT = (P.zT || 0) - dt;
      if (P.zT <= 0) { P.zT = 0.8; pop('Zzz', P.x + P.face * 30, FY - P.lift - 120, 'wine'); }   // 누워서 코 곤다
      if (P.chwi <= 0) { P.chwi = 0; P.drunk = 0; P.hold = 0; P.rot = 0; P.zT = 0; }
      return;
    }
    if (P.hurtT > 0) {
      P.hurtT -= dt; P.x += P.vx * dt; P.vx *= Math.pow(0.02, dt);
      P.sheet = 'hero6'; P.cell = 3; P.lean = -P.face * 0.06;          // 맞고 뒤로 밀림
      if (P.hurtT <= 0 && P.buf) { var b = P.buf; P.buf = null; doMove(b); }
    } else if (P.move) {
      var mv = P.move, m = mv.m;
      P.t += dt;
      P.sheet = m.sheet; P.cell = m.cell;
      if (P.phase === 'act' && m.step) P.x += P.face * m.step * dt;
      if (m.jump) {                                   // 뛰어오르는 기술: 발이 땅에서 뜬다
        var jk = P.phase === 'wind' ? 0 : P.phase === 'act' ? Math.min(1, P.t / m.act) * 0.5 : 0.5 + Math.min(1, P.t / m.rec) * 0.5;
        P.h = Math.sin(jk * PI) * m.jump;
        if (P.phase === 'rec' && m.land && P.t > m.rec * 0.6) { P.sheet = 'hero5'; P.cell = 2; if (!mv.landed) { mv.landed = true; dust(P.x); SND.fall(0.4); } }
      } else P.h = 0;
      if (m.ghost && P.phase !== 'wind') { mv.gT = (mv.gT || 0) + dt; if (mv.gT > 0.035) { mv.gT = 0; ghost(); } }
      if (m.spin && P.phase === 'act') P.lean = P.face * 0.1 * Math.sin(P.t / m.act * PI);
      if (P.phase === 'wind') {
        var wk = Math.min(1, P.t / Math.max(0.01, m.wind));
        if (mv.name === 'drink') { P.sheet = 'hero1'; P.cell = 4; P.lean = -P.face * 0.05 * wk; }
        else if (mv.name === 'spray' || mv.name === 'charge' || mv.name === 'taunt') { P.lean = -P.face * 0.06 * wk; if (mv.name === 'charge') { P.shake = wk > 0.7 ? 1.5 : 0; } }
        else if (m.jump) { P.sheet = 'hero5'; P.cell = 2; }                  // 웅크렸다가
        else if (mv.name.charAt(0) === 'a' || mv.name === 'kick') { P.sheet = 'hero6'; P.cell = 2; P.lean = -P.face * 0.08 * wk; }   // 주먹을 당겼다가
        else { P.sheet = 'hero1'; P.cell = 0; P.lean = -P.face * 0.12 * wk; }        // 뒤로 살짝 당겼다가
        if (P.t >= m.wind) {
          P.phase = 'act'; P.t = 0;
          if (mv.name === 'charge') { P.move = null; if (btn.atk) { P.move = { name: 'charge', m: m, hit: [] }; P.phase = 'act'; P.t = 0; } else startMove('a5'); }
          else if (m.snd) SND.whoosh(m.snd); else if (mv.name === 'kick') SND.whoosh(0.8);
        }
      } else if (P.phase === 'act') {
        if (mv.name === 'drink') { P.lean = -P.face * 0.08; if (P.t >= m.act && !mv.done) { mv.done = true; finishDrink(); } }
        else if (mv.name === 'charge') { P.lean = 0; P.shake = 1.5; if (!btn.atk) { P.move = null; startMove('a5'); return; } if (P.t > 3) { P.move = null; startMove('a5'); return; } }
        else if (mv.name === 'taunt') { P.lean = P.face * Math.sin(P.t * 12) * 0.05; }
        else if (mv.name === 'dash') { P.lean = P.face * 0.22; }
        else if (mv.name === 'spray') { P.lean = P.face * 0.06; sprayStep(mv, dt); if (P.t > 0.08) strike(mv); }
        else { strike(mv); P.lean = P.face * (m.lean || 0.04); }
        if (P.t >= m.act) { P.phase = 'rec'; P.t = 0; }
      } else {
        var rk = Math.min(1, P.t / m.rec);
        if (!m.land) {                                    // 거두기: 친 자세 → 주먹 거둠 → 싸움 자세
          if (rk > 0.7) { P.sheet = 'hero1'; P.cell = 0; }
          else if (rk > 0.3 && (mv.name.charAt(0) === 'a' || mv.name === 'kick')) { P.sheet = 'hero6'; P.cell = 2; }
        }
        if (P.t >= m.rec) {
          if (mv.name.charAt(0) === 'a') P.comboT = 0.42;
          if (mv.name === 'a5' || mv.name === 'a4' && P.combo >= 5) { P.combo = 0; P.comboT = 0; }
          P.move = null; P.h = 0;
          if (P.buf) { var bb = P.buf; P.buf = null; doMove(bb); }
        }
      }
    } else if ((btn.guard || pad.down) && G.intro <= 0 && G.exitT <= 0) {      // 앉아서 막기: 제자리, 가까운 적 쪽을 본다
      P.guard = true; P.vx = 0; P.h = 0; P.sheet = 'hero5'; P.cell = 2; P.bob = 0; P.lean = 0;
      if (dir) P.face = dir;
      else { var ne = null, nd = 260; G.enemies.forEach(function (e) { if (standing(e) && Math.abs(e.x - P.x) < nd) { nd = Math.abs(e.x - P.x); ne = e; } }); if (ne) P.face = ne.x > P.x ? 1 : -1; }
    } else {
      var spd = 210 * (L === 2 ? 0.85 : 1);
      P.vx = dir * spd;
      if (dir) P.face = dir;
      // 취하면 발이 제멋대로: 살짝 옆으로 흘러간다
      P.x += P.vx * dt; P.h = 0;
      if (btn.atk && performance.now() - atkDownT > 220) { P.combo = 0; P.comboT = 0; startMove('charge'); return; }
      if (dir) {
        P.walkP += dt * (L === 2 ? 7 : 9);
        var hw = HWALK[Math.floor(P.walkP) % 4]; P.sheet = hw[0]; P.cell = hw[1]; P.bob = Math.abs(Math.sin(P.walkP * PI)) * 5;
        P.lean = P.face * 0.05 + (L ? Math.sin(P.sway * 2.2) * 0.06 * L : 0);
      } else {
        if (L === 2) { P.sheet = 'hero2'; P.cell = 0; P.lean = -P.face * (0.02 + Math.sin(P.sway * 1.5) * 0.05); }
        else { P.sheet = 'hero1'; P.cell = 0; P.lean = Math.sin(P.sway * 1.7) * 0.03 * (1 + L); }
        P.bob = Math.sin(G.t * 2.4) * 2;
      }
    }
    // 서 있는 적을 뚫고 지나가지 않는다
    G.enemies.forEach(function (e) {
      if (!standing(e)) return;
      var d = e.x - P.x, min = 44 * e.girth;
      if (Math.abs(d) < min) { var push = (min - Math.abs(d)) * (d > 0 ? 1 : -1); P.x -= push * 0.5; e.x += push * 0.5; }
    });
    var lo = G.cam + 30, hi = Math.min(G.cam + VW - 30, G.len + 20);
    if (G.lock !== null) { lo = G.lock + 80; hi = G.lock + ARENA + VW * 0.72; }
    if (!isFinite(P.x)) P.x = lo + 60;                       // 어떤 경우에도 NaN 이 화면을 통째로 지우지 않게
    P.x = Math.max(lo, Math.min(hi, P.x));
    // 줍기: 만두(체력)·호리병(술)
    for (var i = G.pickups.length - 1; i >= 0; i--) {
      var pk = G.pickups[i];
      if (Math.abs(pk.x - P.x) > 36) continue;
      if (pk.kind === 'food') { if (P.hp >= P.max) continue; var add = Math.min(35, P.max - P.hp); P.hp += add; SND.eat(); pop('+' + Math.round(add), P.x, FY - 240, 'heal'); }
      else { if (P.wine >= 5) continue; P.wine++; SND.ding(); pop('🍶 +1', P.x, FY - 240, 'wine'); }
      G.pickups.splice(i, 1); hud();
    }
  }

  function strike(mv) {
    var m = mv.m, L = lvl(), dmg = m.dmg * DMUL[L], hitAny = false;
    G.enemies.forEach(function (e) {
      if (e.dead && e.state !== 'air') return;
      if (mv.hit.indexOf(e) >= 0) return;
      var d = (e.x - P.x) * P.face, range = m.range * (e.k === 'boss' ? 1.12 : 1);
      if (L === 2 || m.both) { if (Math.abs(e.x - P.x) > range * 0.9 + 20) return; }   // 만취·양쪽 기술: 뒤에 있는 놈도 휘말린다
      else if (d < -18 || d > range) return;
      if (e.h > (m.jump ? 320 : 150)) return;
      if (e.state === 'down' && !(m.low || m.spray)) return;
      mv.hit.push(e); hitAny = true;
      var up = m.up;
      if (e.state === 'air') { up = Math.max(up, 300); dmg *= 1.15; pop('AIR', e.x, FY - e.h - 260, 'big'); }   // 공중 콤보
      var how = mv.name === 'kick' ? 'gut' : 'head';
      if (e.state === 'wind' || e.state === 'act') dmg *= 1.3;
      var kdir = e.x > P.x ? 1 : -1;
      if (has2(e) && (e.state === 'wait' || e.state === 'walk' || e.state === 'guard') && !m.spray && (e.state === 'guard' || Math.random() < (e.k === 'boss' ? 0.35 : 0.15))) {
        if (e.state !== 'guard') { e.state = 'guard'; e.t = 0; e.face = P.x > e.x ? 1 : -1; }
        e.hp -= dmg * 0.2; e.flash = 0.6; e.vx = kdir * 60; SND.kick(); spark(e.x - kdir * 14, FY - 160 * e.scale); pop('GUARD', e.x, FY - 250, 'wine');
        if (e.hp <= 0) hurtEnemy(e, 1, kdir * m.kb, up, 0, false, how);
        return;
      }
      hurtEnemy(e, dmg, kdir * m.kb * KBMUL[L], up, m.stun || 0, false, how);
    });
    // 항아리
    G.props.forEach(function (pr) {
      if (pr.kind !== 'jar' || pr.broken || mv.hit.indexOf(pr) >= 0) return;
      var d = (pr.x - P.x) * P.face;
      if (d < -10 || d > m.range) return;
      mv.hit.push(pr); hitJar(pr, P.face, mv.name === 'a3' ? 2 : 1); hitAny = true;
    });
    if (hitAny) {
      var big = m.up >= 300 || m.snd >= 1.4;
      if (big) SND.smash(); else if (mv.name === 'kick') SND.kick(); else SND.hit(m.snd);
      G.stop = big ? 0.09 : 0.05;
      G.shake = Math.max(G.shake, big ? 9 : 3);
      G.kx = P.face * (big ? 13 : mv.name === 'kick' ? 7 : 5);
      if (big) { impact(P.x + P.face * m.range * 0.7, FY - 150, P.face); if (m.spray) G.flashW = 0.35; }
    }
  }
  function standing(e) { return !e.dead && (e.state === 'walk' || e.state === 'wait' || e.state === 'taunt' || e.state === 'wind' || e.state === 'act' || e.state === 'rec' || e.state === 'hurt' || e.state === 'idle' || e.state === 'big' || e.state === 'guard'); }

  function hurtEnemy(e, dmg, kb, up, stun, quiet, how) {
    var K0 = KINDS[e.k];
    e.hp -= dmg; e.hurtT = 0.25; e.flash = 1;
    if (!quiet) {
      G.combo++; G.comboT = 1.8; comboPop();
      spark(e.x - Math.sign(kb || 1) * 12, FY - (e.h || 0) - 150 * e.scale);
      SND.grunt(e.k === 'boss' ? 0.7 : 1);
    }
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; e.deadT = 0;
      G.ko++; save.ko++; hud();
      e.state = 'air'; e.vx = (kb || P.face * 300) * 1.15 / Math.sqrt(e.w); e.vh = Math.max(up, 280); e.h = Math.max(e.h, 4);
      e.spin = -4 - Math.random() * 3; e.hitList = [];
      var r = Math.random();
      if (r < 0.18 && P.hp < P.max * 0.7) G.pickups.push({ x: e.x, t: 0, kind: 'food', drop: true });
      else if (r < 0.25 && P.wine < 4) G.pickups.push({ x: e.x, t: 0, kind: 'wine', drop: true });   // 졸개가 떨구는 술 14%→7%(9/24 반으로)
      if (e.k === 'boss') { G.pickups.push({ x: e.x + 40, t: 0, kind: 'wine', drop: true }); }
      finisher(e);
      return;
    }
    if (e.dead) { e.vh = Math.max(e.vh, up * 0.8); e.vx = kb * 0.8; return; }
    if (e.k === 'boss') {                 // 두목: 휘두르는 중엔 안 끊기고(슈퍼아머), 세 대 맞으면 큰 기술로 되받아친다
      e.rage = (e.rage || 0) + 1;
      if (e.state === 'wind' || e.state === 'act' || e.state === 'big') {   // 휘두르는 중엔 안 끊기지만 맞은 티는 낸다
        e.flinch = 0.12; e.shakeX = 2.2; e.x -= Math.sign(kb || P.face) * 3; e.vx = (e.vx || 0) - Math.sign(kb || P.face) * 40; return;
      }
      if (e.rage >= 5 && e.big && standing(e)) { e.rage = 0; e.face = P.x > e.x ? 1 : -1; e.state = 'big'; e.t = 0; e.hitDone = false; e.vx = 0; e.twice = 0; e.bigCd = 2.5 + Math.random() * 2; SND.gong(); return; }
      if (up > 0 && up < 600 && e.hp > e.max * 0.5) up = 0;      // 체력이 반 넘게 남았을 땐 어퍼컷 아니면 안 뜬다
    }
    if (e.armor > 0 && up < 300 && Math.abs(kb) < 500) { e.armor--; e.armorT = 3; e.vx = kb * 0.35; e.flinch = 0.22; e.shakeX = 2.2; e.hurtT = 0.25; return; }
    var w = e.w;
    if (up > 0 || Math.abs(kb) / w > 360) {
      e.state = 'air'; e.h = Math.max(e.h, 4); e.vh = Math.max(up, 160) / Math.sqrt(w); e.vx = kb / Math.sqrt(w); e.spin = -3 - Math.random() * 2; e.hitList = [];
    } else {
      if (e.state === 'air') { e.vh = Math.max(e.vh, 200); e.vx = kb / w; return; }
      e.state = 'hurt'; e.t = 0; e.stun = (e.k === 'boss' ? 0.2 : 0.42) + stun; e.vx = kb / w * 1.15;
    }
  }

  // ── 적 ──
  var seedN = 1;
  function spawn(k, fromLeft) {
    var K0 = KINDS[k], x = fromLeft ? G.cam - 60 : G.cam + VW + 60, loop = G.sd.loop;
    var e = { k: k, x: x, h: 0, vh: 0, vx: 0, face: fromLeft ? 1 : -1, hp: K0.hp, max: K0.hp, state: 'walk', cell: 0, flash: 0,
      t: 0, cd: 0.5 + Math.random(), walkP: Math.random() * 6, rot: 0, armor: K0.armor || 0, armorT: 0, hurtT: 0, flinch: 0, w: K0.w, girth: K0.girth, scale: 1,
      reach: K0.reach, dmg: K0.dmg, spd: K0.spd, wind: K0.wind };
    e.sheet = k === 'boss' ? 'boss' + (bossIdx(G.stage) + 1) : gruntSheet(k);
    e.sheet2 = k === 'boss' ? 'boss' + (bossIdx(G.stage) + 1) + 'b' : KINDS[k].sheet + 'b_c' + (((G.stage - 1) % 8) + 1);   // 걷기2·타격·날아감·누움·막기
    e.sheet3 = k === 'boss' ? 'boss' + (bossIdx(G.stage) + 1) + 'c' : KINDS[k].sheet + 'c_c' + (((G.stage - 1) % 8) + 1);   // 걷기 중간·걷기3·거두기·얼굴 맞음·엉덩방아
    e.fs = 0;
    e.atkN = 0;
    if (k === 'boss') {
      var B = BOSSES[bossIdx(G.stage)];
      e.hp = e.max = K0.hp + Math.floor((G.stage - 1) * 22) + loop * 120;
      e.reach = B.reach; e.dmg = Math.round(B.dmg * (G.stage <= 2 ? 0.75 : G.stage <= 5 ? 0.85 : 0.95)) + loop * 4; e.spd = B.spd; e.w = B.w || K0.w; e.girth = B.girth || K0.girth; e.big = B.big; e.bigCd = 3 + Math.random() * 2;
      G.boss = e; $('boss').classList.add('on'); $('bossN').textContent = EN ? stageInfo(G.stage).bossEn : stageInfo(G.stage).boss;
      SND.gong();
    } else { e.hp = e.max = Math.round(K0.hp * (1 + loop * 0.5)); e.dmg = K0.dmg + loop * 3; }
    G.enemies.push(e);
  }

  function updateEnemies(dt) {
    var sides = { '-1': [], '1': [] };
    G.enemies.forEach(function (e) { if (standing(e) && e.state !== 'hurt') sides[e.x < P.x ? '-1' : '1'].push(e); });
    var nAtk = G.stage >= 6 ? 3 : 2;   // 한쪽에서 동시에 덤비는 수 — 서서 구경만 하지 않게(9/23)
    ['-1', '1'].forEach(function (s) {
      sides[s].sort(function (a, b) { return Math.abs(a.x - P.x) - Math.abs(b.x - P.x); });
      sides[s].forEach(function (e, i) { e.rank = i; e.atk = i < nAtk || e.state === 'wind' || e.state === 'act' || e.k === 'boss'; });
    });
    for (var i = G.enemies.length - 1; i >= 0; i--) {
      var e = G.enemies[i], K0 = KINDS[e.k];
      e.hurtT = Math.max(0, e.hurtT - dt); e.flash = Math.max(0, e.flash - dt * 7);
      if (e.armorT > 0) { e.armorT -= dt; if (e.armorT <= 0) e.armor = K0.armor || 0; }
      if (e.flinch > 0) e.flinch -= dt;
      if (e.chwiHit > 0) e.chwiHit -= dt;
      e.t += dt; e.lean = 0;
      var dx = P.x - e.x, ad = Math.abs(dx), heroChwi = P.chwi > 0;
      switch (e.state) {
        case 'walk': case 'wait': case 'taunt':
          e.face = dx > 0 ? 1 : -1;
          var want = e.atk ? e.reach * 0.8 : e.reach + 70 + e.rank * 58;
          if (heroChwi) want = 56;                      // 취권 중엔 겁 없이 바짝 붙는다(자동공격 범위 132 안으로)
          var v = 0;
          if (ad > want + 8) v = e.spd; else if (ad < want - 30 && !e.atk) v = -e.spd * 0.6;
          if (e.flinch > 0) v = 0;
          if (e.hp < e.max * 0.45) v *= 0.8;
          e.x += e.face * v * dt;
          if (v) { e.walkP += dt * Math.abs(v) * 0.06; e.state = 'walk'; var wf = WALK[Math.floor(e.walkP) % 4]; fr(e, wf[0], wf[1]); e.bob = Math.abs(Math.sin(e.walkP * PI)) * 4; e.lean = e.face * 0.04 * Math.sign(v); }
          else {
            if (e.state !== 'taunt' && !e.atk && Math.random() < dt * 0.25) { e.state = 'taunt'; e.t = 0; }
            e.fs = 0;
            if (e.state === 'taunt') { e.cell = 4; e.bob = Math.abs(Math.sin(e.t * 7)) * 5; if (e.t > 1.1) { e.state = 'wait'; e.bob = 0; } }
            else { e.state = 'wait'; e.cell = 0; e.bob = Math.sin(G.t * 3 + e.walkP) * 2; e.lean = e.hp < e.max * 0.45 ? e.face * 0.08 : 0; }
          }
          e.cd -= dt;
          if (e.k === 'boss' && e.big) e.bigCd -= dt;
          if (e.atk && e.cd <= 0 && !P.dead && G.intro <= 0 && !heroChwi) {
            if (e.k === 'boss' && e.bigCd <= 0 && ad < e.big.range) { e.state = 'big'; e.t = 0; e.bigCd = 4 + Math.random() * 3; e.hitDone = false; }
            else if (ad < e.reach) {
              e.state = 'wind'; e.t = 0; e.h = 0; e.windT = e.wind * Math.max(0.62, 1 - (G.stage - 1) * 0.03); e.atkN++;
              e.lunge = ad > e.reach * 0.7;                       // 멀찍이 서 있으면 파고들며 때린다
              e.alt2 = has2(e) && (e.lunge || e.atkN % 2 === 1);
            }
          }
          break;
        case 'wind':
          if (e.t < e.windT * 0.6 && ad > 6) e.face = dx > 0 ? 1 : -1;   // 들어올리는 동안은 주인공 쪽으로 다시 돈다
          var wp = Math.min(1, e.t / e.windT);
          fr(e, 0, 2);                                        // 치켜들기(A2) → 타격(b1) → 거두기(c2)
          e.x -= e.face * 34 * dt * (1 - wp);                  // 한 발 물러섰다가
          e.lean = -e.face * 0.16 * wp; e.shakeX = e.t > e.windT * 0.6 ? 1 : 0;
          if (e.t >= e.windT) { e.state = 'act'; e.t = 0; e.hitDone = false; SND.whoosh(0.7); }
          break;
        case 'act':
          fr(e, 1, 1); e.lean = e.face * 0.05;
          e.x += e.face * (e.lunge ? 230 : 60) * dt;
          if (!e.hitDone && dx * e.face > 0 && ad < e.reach + (e.lunge ? 44 : 16) && P.h < 150) { e.hitDone = true; hurtPlayer(e.dmg, e.face, e); }
          if (e.t >= K0.act) { e.state = 'rec'; e.t = 0; }
          break;
        case 'big':          // 보스 큰 기술: 오래 들었다가 크게
          var B = e.big, wk = Math.min(1, e.t / B.wind);
          if (wk < 0.65 && ad > 6) e.face = dx > 0 ? 1 : -1;
          fr(e, 0, 4); e.lean = -e.face * 0.12 * wk; e.shakeX = wk > 0.5 ? 1.5 : 0; e.flash = Math.max(e.flash, 0.5 * Math.sin(wk * PI));
          if (e.t >= B.wind && !e.hitDone) {
            e.hitDone = true; fr(e, 1, 1); SND.whoosh(1.3); SND.smash(); G.shake = Math.max(G.shake, B.quake ? 12 : 6);
            if (B.quake) dust(e.x + e.face * 60);
            if (B.throw) { G.props.push({ kind: 'dice', x: e.x + e.face * 30, vx: e.face * 620, h: 150, vh: 60, rot: 0, spin: 20, settled: false, hurt: true, dmg: B.dmg }); }
            else if (ad < B.range && dx * e.face > 0) { hurtPlayer(B.dmg, e.face, e, B.kb); }
            if (B.twice) e.twice = 0.3;
          }
          if (e.hitDone && e.t >= B.wind) fr(e, 1, 1);
          if (e.twice > 0) { e.twice -= dt; if (e.twice <= 0) { e.twice = 0; fr(e, 1, 1); SND.whoosh(1.1); if (ad < B.range * 0.8 && dx * e.face > 0) hurtPlayer(Math.round(B.dmg * 0.6), e.face, e, B.kb * 0.7); } }
          if (e.t >= B.wind + 0.55) { e.state = 'rec'; e.t = 0; }
          break;
        case 'rec':
          if (e.t < K0.rec * 0.2) fr(e, 1, 1); else if (e.t < K0.rec * 0.7) fr(e, 2, 2); else fr(e, 0, 0);
          if (e.t >= K0.rec) { e.state = 'wait'; e.cd = K0.cd[0] + Math.random() * (K0.cd[1] - K0.cd[0]) - Math.min(0.5, G.stage * 0.03); }
          break;
        case 'hurt':
          e.x += e.vx * dt; e.vx *= Math.pow(0.03, dt);
          if (e.t <= dt * 1.5 || e.hurtPick == null) e.hurtPick = Math.random() < 0.5;   // 배 맞음(A3) 이나 얼굴 맞고 밀림(c3)
          fr(e, e.hurtPick ? 2 : 0, 3); e.lean = -e.face * 0.05;
          if (e.t >= e.stun) { e.state = 'wait'; e.cd = Math.max(e.cd, 0.35); }
          break;
        case 'guard':
          fr(e, 1, 4); e.lean = -e.face * 0.06; e.x += e.vx * dt; e.vx *= Math.pow(0.05, dt);
          if (e.t >= 0.5) { e.state = 'wait'; e.cd = 0.15; }
          break;
        case 'air':
          e.vh -= 1500 * dt; e.h += e.vh * dt; e.x += e.vx * dt;
          fr(e, 1, 2); var tgt = -0.25 * (e.vx >= 0 ? 1 : -1); e.rot += (tgt - e.rot) * Math.min(1, dt * 6); e.face = e.vx >= 0 ? -1 : 1;
          domino(e); jarHit(e);
          if (e.h <= 0) {
            e.h = 0;
            if (e.vh < -420) { e.vh = -e.vh * 0.28; e.vx *= 0.6; SND.fall(1); dust(e.x); G.shake = Math.max(G.shake, 5); }
            else { e.state = 'down'; e.t = 0; SND.fall(0.7); dust(e.x); e.rot = 0; e.face = e.vx >= 0 ? -1 : 1; }
          }
          break;
        case 'down':
          e.x += e.vx * dt; e.vx *= Math.pow(0.004, dt);
          fr(e, 1, 3); e.rot = 0;
          if (Math.abs(e.vx) > 200) domino(e);
          if (e.dead) { e.deadT += dt; if (e.deadT > 1.2) { e.fade = Math.max(0, 1 - (e.deadT - 1.2) / 0.6); if (e.deadT > 1.85) { G.enemies.splice(i, 1); continue; } } }
          else if (e.t > 1.3) { e.state = 'getup'; e.t = 0; }
          break;
        case 'getup':
          var gk = Math.min(1, e.t / 0.5);
          if (gk < 0.35) fr(e, 1, 3); else if (gk < 0.8) fr(e, 2, 4); else fr(e, 0, 0);   // 누움 → 엉덩방아(몸 일으킴) → 서기
          e.rot = 0; e.lean = gk < 0.8 ? 0 : -e.face * 0.1 * (1 - gk);
          if (e.t > 0.55) { e.state = 'wait'; e.rot = 0; e.cd = 0.6; }
          break;
      }
    }
    var st = G.enemies.filter(function (e) { return standing(e) && e.state !== 'act'; }).sort(function (a, b) { return a.x - b.x; });
    for (var j = 1; j < st.length; j++) {
      var a = st[j - 1], b = st[j], min = 28 * (a.girth + b.girth);
      if (b.x - a.x < min) { var push = (min - (b.x - a.x)) / 2; a.x -= push; b.x += push; }
    }
    if (G.boss && G.boss.dead) { $('boss').classList.remove('on'); }
    if (G.boss) $('boss').querySelector('.bar span').style.width = Math.max(0, G.boss.hp / G.boss.max * 100) + '%';
  }

  // 마지막 놈을 쓰러뜨리면 느려지며 카메라가 다가간다
  function finisher(e) {
    var w = G.sd.waves[G.wave];
    if (!w || w.queue.length) return;
    var left = G.enemies.filter(function (o) { return !o.dead; }).length;
    if (left > 0) return;
    var lastFloor = G.wave === G.sd.waves.length - 1;
    G.fin = { t: 0, dur: lastFloor ? 1.5 : 0.7, z: lastFloor ? 1.45 : 1.18, x: (e.x + P.x) / 2, y: FY - 120 };
    G.slowT = G.fin.dur; G.stop = lastFloor ? 0.16 : 0.08;
    if (lastFloor) SND.gong();
  }

  // ── 항아리·던져진 물건 ──
  function hitJar(pr, dir, power) {
    pr.hp -= power; pr.wob = 1; pr.wobDir = dir; SND.kick();
    if (pr.hp <= 0) breakJar(pr, dir);
  }
  function breakJar(pr, dir) {
    pr.broken = true; SND.slam(); G.shake = Math.max(G.shake, 5);
    for (var i = 0; i < 14; i++) G.shards.push({ x: pr.x + (Math.random() - .5) * 30, y: FY - 20 - Math.random() * 60, vx: dir * (40 + Math.random() * 260) + (Math.random() - .5) * 120, vy: -120 - Math.random() * 300, r: 4 + Math.random() * 7, rot: Math.random() * PI, spin: (Math.random() - .5) * 20, life: 2.5, col: i % 3 ? '#8a5a3a' : '#c99a6a' });
    for (var j = 0; j < 12; j++) G.parts.push({ t: 'w', x: pr.x, y: FY - 50, vx: (Math.random() - .5) * 320, vy: -100 - Math.random() * 260, r: 2 + Math.random() * 3, life: .8 });
    G.pickups.push({ x: pr.x + dir * 30, t: 0, kind: 'wine', drop: true });
  }
  function jarHit(e) {
    if (Math.abs(e.vx) < 200) return;
    G.props.forEach(function (pr) { if (pr.kind === 'jar' && !pr.broken && Math.abs(pr.x - e.x) < 40 && e.h < 90) { breakJar(pr, Math.sign(e.vx)); e.vx *= 0.6; } });
  }
  function updateProps(dt) {
    for (var i = G.props.length - 1; i >= 0; i--) {
      var pr = G.props[i];
      if (pr.kind === 'jar') { if (pr.wob > 0) pr.wob = Math.max(0, pr.wob - dt * 2.2); pr.t += dt; continue; }
      if (pr.settled) { pr.life = (pr.life || 3) - dt; if (pr.life <= 0) G.props.splice(i, 1); continue; }
      pr.vh -= 1500 * dt; pr.h += pr.vh * dt; pr.x += pr.vx * dt; pr.rot += pr.spin * dt;
      if (pr.hurt && !pr.done && Math.abs(pr.x - P.x) < 40 && pr.h < 200) { pr.done = true; hurtPlayer(pr.dmg, Math.sign(pr.vx), null); pr.vx *= -0.3; }
      if (pr.h <= 0) {
        pr.h = 0;
        if (pr.vh < -150) { pr.vh = -pr.vh * 0.35; pr.vx *= 0.6; pr.spin *= 0.5; SND.kick(); }
        else { pr.settled = true; pr.hurt = false; }
      }
    }
    for (var s = G.shards.length - 1; s >= 0; s--) {
      var sh = G.shards[s];
      sh.life -= dt;
      if (sh.y < FY + 6 || sh.vy < 0) { sh.vy += 1400 * dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.rot += sh.spin * dt; if (sh.y >= FY + 6 && sh.vy > 0) { sh.y = FY + 6; if (sh.vy > 120) { sh.vy = -sh.vy * 0.3; sh.vx *= 0.5; } else { sh.vy = 0; sh.vx = 0; sh.spin = 0; } } }
      if (sh.life <= 0) G.shards.splice(s, 1);
    }
  }

  // 날아가는 몸이 서 있는 놈을 쓰러뜨린다
  function domino(e) {
    if (Math.abs(e.vx) < 220 || e.h > 110) return;
    G.enemies.forEach(function (o) {
      if (o === e || !standing(o) || (e.hitList && e.hitList.indexOf(o) >= 0)) return;
      if (Math.abs(o.x - e.x) > 36 * o.girth) return;
      if (Math.sign(o.x - e.x) !== Math.sign(e.vx) && Math.abs(o.x - e.x) > 8) return;
      (e.hitList = e.hitList || []).push(o);
      var big = Math.abs(e.vx) > 330;
      hurtEnemy(o, 8, e.vx * 0.8, big ? 240 : 0, 0.3);
      e.vx *= 0.65;
      SND.hit(0.9); G.stop = Math.max(G.stop, 0.04); G.shake = Math.max(G.shake, 5);
    });
  }

  function hurtPlayer(dmg, dir, src, kb) {
    if (P.inv > 0 || P.dead || P.chwi > 0) return;   // 취권 중엔 안 맞는다
    if (P.guard && P.face === -dir) {                   // 앞에서 온 공격을 막았다: 피해 20%, 경직 없이 살짝 밀린다
      var gd = Math.max(1, Math.round(dmg * 0.2));
      P.hp -= gd; P.inv = 0.3; P.flash = 0.4; P.x += dir * (kb ? 26 : 14); G.shake = Math.max(G.shake, 3);
      spark(P.x - dir * 30, FY - 120); SND.kick(); pop('GUARD', P.x, FY - 230, 'wine');
      if (P.hp <= 0) { P.hp = 0; die(); }
      hud(); return;
    }
    var L = lvl();
    if (L === 2) dmg = Math.round(dmg * 0.65);          // 술기운엔 덜 아프다
    P.hp -= dmg; P.inv = 0.55; P.flash = 1; G.shake = Math.max(G.shake, 7);
    spark(P.x + dir * 10, FY - 160);
    G.combo = 0; G.comboT = 0; comboPop();
    SND.hurt();
    if (P.hp <= 0) { P.hp = 0; die(); hud(); return; }
    if (P.move && P.move.name === 'drink') { P.move = null; SND.hic(); }
    P.hurtT = 0.28; P.vx = dir * (kb ? kb * 0.6 : 160); P.move = null; P.face = -dir;   // 때린 쪽을 본다
    if (src && src.k === 'boss' && !kb) P.vx = dir * 260;
    hud();
  }
  function die() {
    P.dead = true; P.state = 'air'; P.h = 2; P.vh = 260; P.vx = -P.face * 200; P.rot = 0; P.spin = -4 * P.face; P.sheet = 'hero6'; P.cell = 3;
    G.slowT = 1.4; G.overT = 2.2; SND.bgm(false); SND.fall(1.2);
  }
  function physFall(f, dt) {
    if (f.h > 0 || f.vh > 0) {
      f.vh -= 1500 * dt; f.h += f.vh * dt; f.x += f.vx * dt; f.rot = Math.max(-PI / 2, Math.min(PI / 2, (f.rot || 0) + f.spin * dt * 0.5));
      if (f.h <= 0) { f.h = 0; f.vh = 0; f.rot = -PI / 2 * f.face; SND.fall(1); dust(f.x); }
    }
  }

  // ── 효과 ──
  function sprayStep(mv, dt) {          // 입에서 술을 뿜는다: 노란 물방울 + 안개
    for (var i = 0; i < 6; i++) G.parts.push({ t: 'w', x: P.x + P.face * 30, y: FY - 236 + (Math.random() - .5) * 16, vx: P.face * (420 + Math.random() * 380) + (Math.random() - .5) * 60, vy: (Math.random() - .5) * 200 - 40, r: 2.5 + Math.random() * 3.5, life: .5 });
    G.parts.push({ t: 'mist', x: P.x + P.face * (60 + Math.random() * 160), y: FY - 230 + (Math.random() - .5) * 80, vx: P.face * 120, vy: -30, r: 18 + Math.random() * 22, life: .5 });
  }
  function impact(x, y, dir) {          // 결정타: 방사형 타격선 + 큰 섬광
    for (var i = 0; i < 10; i++) { var a = (i / 10) * PI * 2 + Math.random() * 0.3; G.parts.push({ t: 'line', x: x, y: y, a: a, len: 40 + Math.random() * 60, life: 0.16 }); }
    G.parts.push({ t: 'flash', x: x, y: y, life: 0.14, r: 60 });
    G.parts.push({ t: 'ring', x: x, y: y, r: 10, life: 0.22 });
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
      if (p.t === 'w') { p.vy += 1100 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > FY + 4) p.life = 0; }
      else if (p.t === 's') { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.8; p.vy *= 0.8; }
      else if (p.t === 'd') { p.x += p.vx * dt; p.y += p.vy * dt; p.r += 20 * dt; }
      else if (p.t === 'flash') { p.r += 120 * dt; }
      else if (p.t === 'ring') { p.r += 700 * dt; }
      else if (p.t === 'mist') { p.x += p.vx * dt; p.y += p.vy * dt; p.r += 60 * dt; }
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
      if (w.queue.length && G.spawnT <= 0 && (alive < w.maxOn || w.queue[0] === 'boss' && alive === 0)) {
        if (w.queue[0] === 'boss' && alive > 0) { } else {
          var k = w.queue.shift(); spawn(k, k !== 'boss' && Math.random() < w.left); alive++;
          G.spawnT = 0.35 + Math.random() * 0.5;
        }
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
    var allDone = sd.waves.every(function (w) { return w.done; });
    if (allDone && G.exitT === 0 && !P.dead) { G.exitT = 0.01; P.move = null; }
    if (G.exitT > 0) { G.exitT += dt; if (G.exitT > 1.6 && G.mode === 'play') stageClear(); }
  }

  function stageClear() {
    G.mode = 'clear'; SND.clear(); SND.bgm(false);
    save.best = Math.max(save.best, G.stage); save.stage = G.stage + 1; store();
    var mm = Math.floor(G.time / 60), ss = Math.floor(G.time % 60);
    if (G.stage === 8) { save.ended = true; store(); startEnding(); return; }   // 엔딩 뒤 9판부터 이어짐 — 9/24 사장님 "엔딩 후 무한 모드를 그대로 둬"
    $('clearN').textContent = '👊 ' + G.ko + '   ⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    showPanel('clear');
  }

  // ── 엔딩: 무대 위 승리 ──
  function startEnding() {
    G.mode = 'endscene'; G.et = 0; G.fin = null; G.kx = 0; G.shake = 0; G.enemies = []; G.parts = [];
    showPanel(null); $('boss').classList.remove('on'); comboEl.classList.remove('on'); $('go').classList.remove('on');
    document.body.classList.add('title');
    P.move = null; P.hurtT = 0; P.chwi = 0;
    SND.bgm(false); SND.gong();
  }
  function endStep(dt) {
    var t = (G.et += dt);
    P.lean = 0; P.rot = 0;
    if (t < 1.2) { P.sheet = 'hero1'; P.cell = 0; }
    else if (t < 2.4) { P.sheet = 'hero1'; P.cell = 4; }           // 한 모금
    else { P.sheet = 'hero2'; P.cell = 4; P.bob = Math.abs(Math.sin(t * 3)) * 8; if (!G.cheer) { G.cheer = 1; SND.clear(); for (var i = 0; i < 30; i++) G.parts.push({ t: 'w', x: P.x + (Math.random() - .5) * 400, y: FY - 300 - Math.random() * 200, vx: (Math.random() - .5) * 80, vy: -40, r: 3, life: 3 }); } }
    updateParts(dt);
    if (t > 4.5 && !G.endShown) {
      G.endShown = true;
      $('endN').innerHTML = '👊 ' + save.ko + '<br>8 / 8';
      showPanel('ending');
    }
  }

  // ── 글·HUD ──
  function hud() {
    if (!P) return;
    $('hbar').firstElementChild.style.width = Math.max(0, P.hp / P.max * 100) + '%';
    $('hstat').classList.toggle('low', P.hp > 0 && P.hp < P.max * 0.3);
    $('dbar').firstElementChild.style.width = Math.max(0, Math.min(100, P.drunk)) + '%';
    $('dstat').classList.toggle('full', P.drunk >= 65);
    $('wine').textContent = P.wine;
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
  $('endNext').onclick = function () { startStage(9); };   // THE END → 9판부터 끝없이(사장님 9/24 "그대로 둬")
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

  // ── 타이틀 장면: 첫 스테이지 거리, 주인공과 졸개들 ──
  function titleScene() {
    G = { mode: 'title', stage: 1, sd: { waves: [], loop: 0 }, len: 3000, cam: 0, lock: null, enemies: [], parts: [], pickups: [], props: [], shards: [], kx: 0, fin: null, t: 0, ko: 0, intro: 0, shake: 0 };
    P = newPlayer(); P.x = 210; P.drunk = 40;
    ['g1', 'g2', 'g1', 'g2', 'g1'].forEach(function (k, i) {
      G.enemies.push({ k: k, x: 600 + i * 88, h: 0, face: -1, sheet: KINDS[k].sheet + '_c1', cell: i === 2 ? 4 : 0, rot: 0, walkP: i * 1.3, state: 'wait', girth: 1, w: 1, scale: 1, flash: 0, bob: 0, lean: 0, t: i });
    });
    G.props.push({ kind: 'jar', x: 90, hp: 2, broken: false, t: 0, wob: 0 });
    document.body.classList.add('title');
    if (save.stage > 1) { $('newgame').hidden = false; $('start').textContent = 'STAGE ' + save.stage; }
    else { $('newgame').hidden = true; $('start').textContent = 'START'; }
    $('best').textContent = save.ko ? '👊 ' + save.ko : '';
    showPanel('title');
  }

  // ── 그리기 ──
  function drawBG(cam, vw) {
    var n = bossIdx(G.stage) + 1, im = SPR.img('bg' + n);
    if (im) {
      var bw = 540 * im.width / im.height;
      var x0 = Math.floor(cam / bw) * bw;
      for (var x = x0; x < cam + vw; x += bw) {
        var k = Math.round(x / bw);
        if (k % 2) { c.save(); c.translate(x + bw, 0); c.scale(-1, 1); c.drawImage(im, 0, 0, bw, 540); c.restore(); }
        else c.drawImage(im, x, 0, bw, 540);
      }
    } else {
      var g = c.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, '#2b2320'); g.addColorStop(0.75, '#6d5a48'); g.addColorStop(0.76, '#8a7052'); g.addColorStop(1, '#5a4632');
      c.fillStyle = g; c.fillRect(cam - 2, 0, vw + 4, 540);
    }
  }
  function drawJar(pr) {
    var x = pr.x, y = FY + 4, wob = pr.wob ? Math.sin(pr.wob * 14) * 0.12 * pr.wob * (pr.wobDir || 1) : 0;
    c.save(); c.translate(x, y); c.rotate(wob);
    // 접지 그림자
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, 2, 34, 9, 0, 0, 2 * PI); c.fill();
    if (pr.broken) {           // 밑동만 남는다
      c.fillStyle = '#7a4e33'; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-22, -16); c.lineTo(-8, -10); c.lineTo(4, -20); c.lineTo(16, -8); c.lineTo(24, -14); c.lineTo(27, 0); c.closePath(); c.fill();
      c.fillStyle = '#4a2f1f'; c.beginPath(); c.ellipse(0, -2, 22, 5, 0, 0, 2 * PI); c.fill();
      c.restore(); return;
    }
    var g = c.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, '#5e3c26'); g.addColorStop(0.35, '#9c6a44'); g.addColorStop(0.6, '#b58559'); g.addColorStop(1, '#5a3822');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(-22, 0); c.bezierCurveTo(-36, -22, -36, -58, -20, -74); c.lineTo(-14, -84); c.lineTo(14, -84); c.lineTo(20, -74); c.bezierCurveTo(36, -58, 36, -22, 22, 0); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,240,210,.18)'; c.beginPath(); c.ellipse(-12, -44, 5, 22, 0.1, 0, 2 * PI); c.fill();   // 유약 하이라이트
    c.fillStyle = '#3a2416'; c.beginPath(); c.ellipse(0, -84, 15, 4, 0, 0, 2 * PI); c.fill();
    c.strokeStyle = 'rgba(60,30,15,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-31, -40); c.quadraticCurveTo(0, -34, 31, -40); c.stroke();
    c.fillStyle = '#d9c7a0'; c.beginPath(); c.arc(0, -52, 6, 0, 2 * PI); c.fill();   // 술 딱지
    c.fillStyle = '#8a1a1a'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillText('酒', 0, -49);
    c.restore();
  }
  function drawPickup(p) {
    var x = p.x, y = FY + 6, bob = Math.sin(p.t * 4) * 3;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y, 20, 6, 0, 0, 2 * PI); c.fill();
    c.save(); c.translate(x, y - 6 - bob);
    if (p.kind === 'food') {      // 만두 접시
      c.fillStyle = '#e9e4d8'; c.beginPath(); c.ellipse(0, 0, 24, 8, 0, 0, 2 * PI); c.fill();
      var g = c.createRadialGradient(-4, -12, 2, 0, -8, 14); g.addColorStop(0, '#fff3dc'); g.addColorStop(1, '#d9b98a');
      c.fillStyle = g; [-10, 4].forEach(function (dx) { c.beginPath(); c.ellipse(dx, -8, 11, 9, 0, 0, 2 * PI); c.fill(); });
      c.strokeStyle = '#b8945f'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-16, -12); c.quadraticCurveTo(-10, -20, -4, -12); c.moveTo(-2, -12); c.quadraticCurveTo(4, -20, 10, -12); c.stroke();
    } else {                      // 호리병
      var g2 = c.createLinearGradient(-10, 0, 10, 0); g2.addColorStop(0, '#7a4e2a'); g2.addColorStop(0.5, '#d9a05e'); g2.addColorStop(1, '#6b421f');
      c.fillStyle = g2; c.beginPath(); c.arc(0, -8, 11, 0, 2 * PI); c.fill(); c.beginPath(); c.arc(0, -25, 8, 0, 2 * PI); c.fill();
      c.fillStyle = '#c23b2e'; c.beginPath(); c.arc(0, -34, 3.5, 0, 2 * PI); c.fill();
      c.strokeStyle = '#3d2412'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-8, -17); c.lineTo(8, -17); c.stroke();
    }
    c.restore();
  }
  function drawShadow(x, w, a) { c.fillStyle = 'rgba(0,0,0,' + (a || 0.3) + ')'; c.beginPath(); c.ellipse(x, FY + 4, w, w * 0.28, 0, 0, 2 * PI); c.fill(); }
  function drawFighter(f) {
    if (f !== P && !f.dead && (standing(f) || f.state === 'getup') && f.x !== P.x) f.face = P.x > f.x ? 1 : -1;   // 서 있는 적은 늘 주인공을 본다
    var opt = { scale: K * (f.scale || 1), rot: f.rot || 0, lean: f.lean || 0, flash: f.flash ? f.flash * 0.45 : 0 };
    if (f.fade != null) opt.alpha = f.fade;
    if (f.shakeX) opt.lean = (opt.lean || 0) + (Math.random() - .5) * 0.06 * f.shakeX;
    var sh = f.sheet, cell = f.cell;
    if (f.fs) { var s2 = f.fs === 2 ? f.sheet3 : f.sheet2; if (s2 && SPR.have(s2) && SPR.cellH(s2, cell)) sh = s2; else cell = f.fs === 2 && cell >= 3 ? 3 : 0; }
    if (!SPR.cellH(sh, cell)) cell = 0;
    SPR.draw(c, sh, cell, f.x, FY - (f.h || 0) - (f.lift || 0) - (f.bob || 0) * 0.4, f.face, opt);
  }
  function has2(e) { return e.sheet2 && SPR.have(e.sheet2); }
  // 적 걷기 4칸: 오른발(A1) → 걷기 중간(c0) → 왼발(b0) → 걷기3(c1)
  var WALK = [[0, 1], [2, 0], [1, 0], [2, 1]];
  var HWALK = [['hero1', 1], ['hero6', 0], ['hero6', 1], ['hero6', 0]];   // 주인공 걷기 4칸
  function fr(e, fs, cell) { e.fs = fs; e.cell = cell; }
  function draw() {
    if (!G) return;
    var ox = G.kx || 0, oy = 0;
    if (G.shake > 0.3) { ox += (Math.random() - .5) * G.shake * 0.6; oy = (Math.random() - .5) * G.shake; }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#1a1410'; c.fillRect(0, 0, W, H);
    var top = (H - 540 * S) / 2;
    var z = 1, fx = 0, fy = 0;
    if (G.fin) {
      var ft = G.fin.t, zin = Math.min(1, ft / 0.12), zout = ft > G.fin.dur ? Math.max(0, 1 - (ft - G.fin.dur) / 0.5) : 1;
      var zk = zin * zout; zk = zk * zk * (3 - 2 * zk);
      z = 1 + (G.fin.z - 1) * zk;
      fx = (G.fin.x - G.cam) * S; fy = top + G.fin.y * S;
    }
    var a = S * z, ex = fx * (1 - z) - G.cam * S * z + ox, ey = fy * (1 - z) + top * z + oy;
    c.setTransform(dpr * a, 0, 0, dpr * a, dpr * ex, dpr * ey);
    // 만취: 화면이 슬슬 기운다
    var L = P ? lvl() : 0;
    if (L === 2 && G.mode === 'play') { var wob = Math.sin(G.t * 1.9) * 0.018; c.translate(G.cam + VW / 2, 300); c.rotate(wob); c.scale(1.02, 1.02); c.translate(-G.cam - VW / 2, -300); }
    var vw = VW + 2;
    drawBG(G.cam - 1, vw);
    G.props.forEach(function (pr) { if (pr.kind === 'jar' && pr.x > G.cam - 80 && pr.x < G.cam + vw + 80) drawJar(pr); });
    G.shards.forEach(function (sh) { c.save(); c.translate(sh.x, sh.y); c.rotate(sh.rot); c.fillStyle = sh.col; c.globalAlpha = Math.min(1, sh.life); c.beginPath(); c.moveTo(-sh.r, 0); c.lineTo(0, -sh.r * 0.7); c.lineTo(sh.r, 0); c.lineTo(0, sh.r * 0.5); c.closePath(); c.fill(); c.restore(); });
    G.pickups.forEach(drawPickup);
    var list = G.enemies.slice();
    list.forEach(function (e) { if (e.x > G.cam - 200 && e.x < G.cam + vw + 200) drawShadow(e.x, 34 * e.girth, e.state === 'air' ? 0.15 : 0.3); });
    if (P) drawShadow(P.x, 30, P.h > 0 ? 0.15 : 0.3);
    list.sort(function (a, b) { return (b.state === 'down' ? 1 : 0) - (a.state === 'down' ? 1 : 0); });
    list.forEach(function (e) { if (e.x < G.cam - 250 || e.x > G.cam + vw + 250) return; drawFighter(e); });
    if (P && P.ghosts) P.ghosts.forEach(function (g) { SPR.draw(c, g.sheet, g.cell, g.x, FY - g.h - (g.lift || 0), g.face, { scale: K, lean: g.lean, rot: g.rot, alpha: Math.max(0, g.life) * 0.9, tintW: 1 }); });
    if (P) drawFighter(P);
    G.props.forEach(function (pr) {
      if (pr.kind !== 'dice') return;
      c.save(); c.translate(pr.x, FY - pr.h); c.rotate(pr.rot); c.fillStyle = '#f4efe2'; c.fillRect(-9, -9, 18, 18); c.fillStyle = '#b32020'; c.beginPath(); c.arc(0, 0, 3, 0, 2 * PI); c.fill(); c.restore();
    });
    G.parts.forEach(function (p) {
      if (p.t === 'w') { c.fillStyle = 'rgba(255,215,120,.85)'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill(); }
      else if (p.t === 's') { c.strokeStyle = 'rgba(255,245,220,' + Math.min(1, p.life * 8) + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03); c.stroke(); }
      else if (p.t === 'd') { c.fillStyle = 'rgba(190,170,140,' + (p.life * 0.45) + ')'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill(); }
      else if (p.t === 'flash') { var fg = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); fg.addColorStop(0, 'rgba(255,250,230,' + Math.min(1, p.life * 11) + ')'); fg.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = fg; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill(); }
      else if (p.t === 'line') { c.strokeStyle = 'rgba(255,240,200,' + Math.min(1, p.life * 7) + ')'; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x + Math.cos(p.a) * 14, p.y + Math.sin(p.a) * 14); c.lineTo(p.x + Math.cos(p.a) * p.len, p.y + Math.sin(p.a) * p.len); c.stroke(); }
      else if (p.t === 'ring') { c.strokeStyle = 'rgba(255,220,120,' + Math.min(1, p.life * 5) + ')'; c.lineWidth = 4; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.stroke(); }
      else if (p.t === 'mist') { c.fillStyle = 'rgba(255,200,90,' + (p.life * 0.35) + ')'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 2 * PI); c.fill(); }
    });
    if (G.flashW > 0) { c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = 'rgba(255,240,200,' + Math.min(0.5, G.flashW) + ')'; c.fillRect(0, 0, W, H); c.setTransform(dpr * a, 0, 0, dpr * a, dpr * ex, dpr * ey); }
    // 색 보정·가장자리
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!vig) { vig = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.75); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.55)'); }
    c.fillStyle = vig; c.fillRect(0, 0, W, H);
    if (L >= 1 && G.mode === 'play') { c.fillStyle = 'rgba(255,170,60,' + (L === 2 ? 0.1 : 0.05) + ')'; c.fillRect(0, 0, W, H); }
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
      G.enemies.forEach(function (e, i) { e.bob = Math.sin(G.t * 2.2 + i) * 2; e.lean = Math.sin(G.t * 1.5 + i) * 0.02; if (i === 2) e.bob = Math.abs(Math.sin(G.t * 7)) * 5; });
      P.sway += dt * 1.6; P.sheet = 'hero1'; P.cell = 0; P.lean = Math.sin(P.sway * 1.7) * 0.04; P.bob = Math.sin(G.t * 2.4) * 2;
      return;
    }
    if (G.mode === 'endscene') { endStep(dt); return; }
    if (G.mode !== 'play') return;
    if (G.intro > 0) { G.intro -= dt; if (G.intro <= 0 && !G.loaded) G.intro = 0.05; if (G.intro <= 0) showPanel(null); }   // 그림이 다 오기 전엔 시작하지 않는다
    if (G.stop > 0) { G.stop -= dt; G.shake *= 0.9; return; }
    if (BOT && P && !P.dead && G.intro <= 0) {          // ?bot=1: 저절로 걸어가 때리는 시험용
      var nr = G.enemies.filter(function (e) { return !e.dead && Math.abs(e.x - P.x) < 150; });
      keys.R = !nr.length; keys.L = false;
      if (nr.length) { var e0 = nr[0]; if ((e0.x > P.x) !== (P.face > 0)) P.face = e0.x > P.x ? 1 : -1; G.botT = (G.botT || 0) + dt; if (G.botT > 0.18) { G.botT = 0; doMove('combo'); } }
    }
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
    if (G.flashW > 0) G.flashW -= dt * 2.5;
    if (P.ghosts) { for (var gi = P.ghosts.length - 1; gi >= 0; gi--) { P.ghosts[gi].life -= dt; if (P.ghosts[gi].life <= 0) P.ghosts.splice(gi, 1); } }
    if (P.hp > 0 && P.hp < P.max * 0.3) { G.beatT -= dt; if (G.beatT <= 0) { SND.beat(); G.beatT = 0.9; } }
    if (Math.floor(G.t * 4) !== Math.floor((G.t - dt) * 4)) hud();
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
  var QS = new URLSearchParams(location.search), qStage = parseInt(QS.get('stage'), 10), BOT = !!QS.get('bot');
  if (qStage > 0) save.stage = qStage;
  SPR.load(['hero1', 'hero2', 'hero3', 'hero4', 'hero5', 'hero6', 'grunt1_c1', 'grunt2_c1', 'bg1'], function () {
    $('load').classList.add('off');
    titleScene();
    if (BOT) { SND.setOn(false); SND.setMusic(false); startStage(Math.max(1, save.stage)); }
    if (QS.get('ending')) { $('start').textContent = 'ENDING'; $('newgame').hidden = true; $('start').onclick = function () { SND.unlock(); startStage(8); G.time = 0; startEnding(); }; }
    requestAnimationFrame(frame);
  });

  window.__cg = {
    tick: function (n, dt, nodraw) { for (var i = 0; i < (n || 1); i++) step(dt || 1 / 60); if (!nodraw) draw(); },
    get G() { return G; }, get P() { return P; }, go: startStage, key: press, save: save
  };
})();
