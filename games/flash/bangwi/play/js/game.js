/* 방귀 뀌기(bangwi) — 방귀가 차오른다. 누르고 있으면 몰래 뀐다. 누가 뒤돌아봤을 때 뀌고 있으면 들킨다.
 * 가득 차면 참다 터진다. 시간을 버티면 CLEAR. 3스테이지마다 장소가 바뀐다(교실→도서관→엘리베이터→버스→결혼식).
 * 시험 손잡이: window.__bw.tick(n) — 미리보기 창은 rAF 가 안 돈다.
 */
(function () {
  'use strict';

  var EN = /[?&]lang=en/i.test(location.search);
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'The Fart';
    document.getElementById('h1').textContent = 'THE FART';
    document.getElementById('rotTitle').textContent = 'This game is played in landscape';
    document.getElementById('rotGo').textContent = 'Rotate to landscape';
    document.getElementById('rotHelp').textContent = 'If the button does nothing, unlock screen rotation and turn your phone';
    document.getElementById('rotSkip').textContent = 'Play in portrait anyway';
  }

  var $ = function (id) { return document.getElementById(id); };
  var cv = $('cv'), g = cv.getContext('2d');
  var A = window.BGA, LOCS = ART.LOCS;
  var W = 0, H = 0, DPR = 1, SC = 1, OX = 0, OY = 0;
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  // ── 저장 ──
  var save = { stage: 1, best: 0, score: 0 };
  try { var sv = JSON.parse(localStorage.getItem('bangwi.prog') || 'null'); if (sv) save = Object.assign(save, sv); } catch (e) {}
  function store() { try { localStorage.setItem('bangwi.prog', JSON.stringify(save)); } catch (e) {} }

  // ── 화면 맞추기: 가상 1280×720 중 내용 칸(x 80~1200, y 0~700)이 늘 보이게 ──
  var TOPPX = 44;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    SC = Math.min(W / 1120, (H - TOPPX) / 700);
    OX = (W - 1280 * SC) / 2;
    OY = TOPPX + ((H - TOPPX) - 700 * SC) / 2;
  }
  function toScreen(x, y) { return { x: OX + x * SC, y: OY + y * SC }; }

  // ── 난이도: 평균적인 사람이 첫 몇 스테이지는 넉넉히 깨고, 위로 갈수록 가파르게 ──
  function diff(stage) {
    var d = stage - 1;
    return {
      // 1~3 스테이지는 연습판: 천천히 차고, 오래 돌아보고, 금방 다시 돌아선다(2026-09-14 "첫스테이지가 어려워")
      fill: d < 3 ? [15, 13, 11.5][d] : Math.max(3.8, 10.3 - (d - 3) * 0.42),   // 0→가득 걸리는 초
      drain: 1.25,                                       // 가득→0 뀌는 초
      tell: d < 5 ? 1.7 - d * 0.14 : Math.max(0.34, 1.15 - d * 0.055),   // 고개 돌리기 시작해서 볼 때까지
      look: d < 3 ? [0.7, 1.1] : [Math.max(0.8, 1.2 - d * 0.02), Math.max(1.3, 1.9 - d * 0.03)],
      gap: d < 3 ? [3.2, 5.5] : [Math.max(0.9, 2.6 - d * 0.12), Math.max(1.8, 4.8 - d * 0.2)],
      fake: d < 3 ? 0 : Math.min(0.35, (d - 2) * 0.045),   // 돌리다 마는 척
      overlap: d < 6 ? 0 : Math.min(0.5, (d - 5) * 0.06),  // 두 사람이 겹쳐 돌아봄
      mercy: d < 3 ? 3 : d < 6 ? 1.2 : 0,                // 가득 찼는데 아무도 안 볼 때 기다려 주는 초
      grace: d < 3 ? 0.3 : d < 6 ? 0.18 : 0.08,         // 쳐다보기 시작하고 이만큼은 봐준다
      time: d < 2 ? 20 : 25
    };
  }

  // ── 상태 ──
  var S = {
    phase: 'title',       // title · ready · play · caught · burst · clear · over
    stage: save.stage, score: save.score, stageScore0: save.score,
    loc: null, people: [], act: 0, D: null,
    g: 0.5, time: 0, pt: 0, t: 0,
    holding: false, farting: false, chunk: 0, popAcc: 0,
    gap: 2, forceGap: false, lastW: -1, mercyT: 0,
    beatT: 0, shake: 0, who: null
  };
  var P = { x: 640, y: 750, s: 1.5, g: 0.5, farting: false, state: 'play', shake: 0 };
  var puffs = [], drops = [];

  function locFor(stage) { return LOCS[Math.floor((stage - 1) / 3) % LOCS.length]; }
  function setupStage(stage) {
    var L = locFor(stage), k = (stage - 1) % 3;
    S.loc = L; S.D = diff(stage);
    S.act = L.act[k] + (stage > 15 ? 1 : 0);
    S.people = L.people.map(function (src, i) {
      var p = Object.assign({}, src);
      p.i = i; p.L = 0; p.state = 'idle'; p.st = 0; p.dur = 0; p.fake = false; p.mood = 'look';
      p.dir = p.x < 640 ? 1 : (p.x > 640 ? -1 : (Math.random() < 0.5 ? 1 : -1));
      p.active = i < S.act;
      return p;
    });
    S.g = stage <= 3 ? 0.25 : 0.4;
    S.time = 0; S.chunk = 0; S.popAcc = 0; S.lastW = -1; S.mercyT = 0;
    S.gap = stage <= 3 ? rnd(3, 4) : rnd(1.6, 2.6); S.forceGap = false; S.who = null; S.shake = 0;
    puffs.length = 0; drops.length = 0;
    P.state = 'play'; P.g = S.g;
    $('stg').textContent = 'STAGE ' + stage;
  }

  // ── 입력: 누르고 있는 동안 뀐다 ──
  var pointers = {};
  function anyHold() { for (var k in pointers) return true; return false; }
  function holdChange() {
    S.holding = anyHold() || keyHold;
    $('fart').classList.toggle('on', S.holding);
  }
  var keyHold = false;
  cv.addEventListener('pointerdown', function (e) { A.unlock(); pointers[e.pointerId] = 1; holdChange(); });
  $('fart').addEventListener('pointerdown', function (e) { e.preventDefault(); A.unlock(); pointers[e.pointerId] = 1; holdChange(); });
  ['pointerup', 'pointercancel'].forEach(function (ev) {
    window.addEventListener(ev, function (e) { delete pointers[e.pointerId]; holdChange(); });
  });
  $('fart').addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyZ') {
      e.preventDefault(); if (e.repeat) return; A.unlock(); keyHold = true; holdChange();
    } else if (e.code === 'Enter') {
      if (S.phase === 'title') $('start').click();
      else if (S.phase === 'over') $('retry').click();
      else if (S.phase === 'clear' && $('clear').classList.contains('on')) $('next').click();
    } else if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyZ') { keyHold = false; holdChange(); }
  });
  window.addEventListener('blur', function () { pointers = {}; keyHold = false; holdChange(); });

  // ── 판(패널) ──
  function panel(id) { ['title', 'stage', 'clear', 'over', 'pause'].forEach(function (k) { $(k).classList.toggle('on', k === id); }); }
  function showTitle() {
    S.phase = 'title'; setupStage(save.stage); S.g = 0.3;
    $('best').textContent = save.best ? '⭐ ' + save.best : '';
    $('start').textContent = save.stage > 1 ? 'STAGE ' + save.stage : 'START';
    $('newgame').hidden = save.stage <= 1;
    panel('title');
  }
  function beginStage() {
    setupStage(S.stage);
    S.stageScore0 = S.score;
    $('stageT').textContent = 'STAGE ' + S.stage;
    S.phase = 'ready'; S.pt = 0;
    panel('stage');
    if (window.OG) OG.start({ stage: S.stage });            // 사이트 지표(game-events.js)
  }
  $('start').onclick = function () { A.unlock(); S.stage = save.stage; S.score = save.score; beginStage(); };
  $('retry').onclick = function () { A.unlock(); S.score = S.stageScore0; beginStage(); };
  $('next').onclick = function () { A.unlock(); S.stage++; beginStage(); };
  // 처음부터: 1스테이지·점수 0 (최고 기록은 남긴다)
  function newGame() { A.unlock(); save.stage = 1; save.score = 0; store(); S.stage = 1; S.score = 0; beginStage(); }
  $('newgame').onclick = newGame;
  $('newgame2').onclick = newGame;

  var paused = false;
  function togglePause() {
    if (S.phase !== 'play' && S.phase !== 'ready') return;
    paused = !paused;
    $('pause').classList.toggle('on', paused);
    $('tPause').classList.toggle('off', paused);
    if (paused) A.fartOff();
  }
  $('tPause').onclick = togglePause;
  $('resume').onclick = togglePause;
  document.addEventListener('visibilitychange', function () { if (document.hidden && !paused) togglePause(); });

  var tSnd = $('tSnd');
  function syncSnd() { tSnd.classList.toggle('off', !A.on); }
  tSnd.onclick = function () { A.setOn(!A.on); if (A.on) A.unlock(); else A.fartOff(); syncSnd(); };
  syncSnd();

  // ── 떠오르는 글 ──
  function pop(txt, x, y, big) {
    var s = toScreen(x, y), el = document.createElement('div');
    el.className = 'pop' + (big ? ' big' : '');
    el.textContent = txt; el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
    $('pops').appendChild(el);
    setTimeout(function () { el.remove(); }, big ? 1250 : 950);
  }

  // ── 구름 ──
  var COLS = ['#b6d957', '#c9e26b', '#9fcf4a', '#d7e889'];
  function emit(n, big) {
    for (var i = 0; i < n; i++) {
      var side = Math.random() < 0.5 ? -1 : 1;
      puffs.push({ x: P.x + side * rnd(70, 140), y: rnd(650, 710), vx: side * rnd(40, 160), vy: -rnd(60, 180),
        r: rnd(18, 34) * (big ? 2 : 1), gr: rnd(20, 50) * (big ? 3 : 1), age: 0, life: rnd(0.9, 1.5) * (big ? 1.8 : 1),
        col: COLS[(Math.random() * COLS.length) | 0], big: big });
    }
    if (puffs.length > 260) puffs.splice(0, puffs.length - 260);
  }

  // ── 사람 조종(감독) ──
  function busy() { return S.people.filter(function (p) { return p.state !== 'idle'; }); }
  function startTell() {
    var cand = S.people.filter(function (p) { return p.active && p.state === 'idle' && p.i !== S.lastW; });
    if (!cand.length) cand = S.people.filter(function (p) { return p.active && p.state === 'idle'; });
    if (!cand.length) return false;
    var p = cand[(Math.random() * cand.length) | 0];
    p.state = 'tell'; p.st = 0; p.dur = S.D.tell * rnd(0.9, 1.1); p.fake = Math.random() < S.D.fake;
    p.dir = p.x < 640 ? 1 : (p.x > 640 ? -1 : (Math.random() < 0.5 ? 1 : -1));
    S.lastW = p.i;
    A.hmm();
    return true;
  }
  function director(dt) {
    var b = busy().length;
    if (b === 0 || S.forceGap) {
      // 초반엔 가득 찼는데 아무도 안 볼 때 잠깐 기다려 준다(최대 1.2초)
      if (S.g > (S.D.mercy > 2 ? 0.65 : 0.82) && b === 0 && S.mercyT < S.D.mercy) { S.mercyT += dt; return; }
      S.gap -= dt;
      if (S.gap <= 0) {
        if (startTell()) { S.forceGap = false; S.mercyT = 0; }
        S.gap = rnd(S.D.gap[0], S.D.gap[1]);
      }
    }
  }
  function updPeople(dt) {
    S.people.forEach(function (p) {
      p.st += dt;
      if (p.state === 'tell') {
        var k = Math.min(1, p.st / p.dur);
        p.L = 0.08 + 0.48 * k * k;                         // 끝에 옆얼굴(코가 튀어나옴)까지 돈다
        if (k >= 1) {
          if (p.fake) { p.state = 'back'; p.st = 0; p.dur = 0.35; }
          else {
            p.state = 'look'; p.st = 0; p.dur = rnd(S.D.look[0], S.D.look[1]);
            if (Math.random() < S.D.overlap) { S.forceGap = true; S.gap = rnd(0.3, p.dur * 0.7); }
          }
        }
      } else if (p.state === 'look') {
        p.L = Math.min(1, p.L + dt / 0.2);                // 옆얼굴 → 정면을 0.2초에 걸쳐 돈다
        if (p.st >= p.dur) { p.state = 'back'; p.st = 0; p.dur = 0.4; }
      } else if (p.state === 'back') {
        p.L = Math.max(0, p.L - dt / p.dur * 1.0);
        if (p.st >= p.dur) {
          p.state = 'idle'; p.L = 0;
          if (busy().length === 0) S.gap = rnd(S.D.gap[0], S.D.gap[1]);
        }
      } else if (p.state === 'stare') {          // 들킨 뒤 모두 쳐다봄
        p.L = Math.min(1, p.L + dt / 0.25);
      }
    });
  }

  function stareAll(who) {
    S.people.forEach(function (p) {
      p.dir = p.x < 640 ? 1 : (p.x > 640 ? -1 : p.dir);
      p.state = 'stare'; p.st = 0;
      p.mood = p === who ? 'shock' : 'ew';
    });
  }

  // ── 한 프레임 ──
  function update(dt) {
    S.t += dt;
    if (paused) return;
    S.pt += dt;
    var ph = S.phase;

    if (ph === 'title') {
      S.people.forEach(function (p) { p.L = 0; });
      P.g = 0.3 + 0.08 * Math.sin(S.t * 2); P.farting = false; P.shake = 0;
    }

    if (ph === 'ready') {
      if (S.pt > 1.0) { S.phase = 'play'; S.pt = 0; panel(null); }
    }

    if (ph === 'play') {
      var D = S.D;
      S.time += dt;
      var wasFart = S.farting;
      S.farting = S.holding && S.g > 0.001;
      if (S.farting) {
        var dg = Math.min(S.g, dt / D.drain);
        S.g -= dg;
        var tellNow = S.people.some(function (p) { return p.state === 'tell'; });
        var pts = dg * 100 * (tellNow ? 2 : 1);
        S.score += pts; S.chunk += dg; S.popAcc += pts;
        if (Math.random() < dt * 45) emit(1, false);
        A.fartOn(); A.fartWobble(S.t, Math.min(1, S.g + 0.3));
        if (S.popAcc >= 12) { pop('+' + Math.round(S.popAcc), P.x + rnd(-60, 60), 560); S.popAcc = 0; }
      } else {
        S.g += dt / D.fill;
      }
      if (wasFart && !S.farting) {
        A.fartOff();
        if (S.popAcc >= 1) { pop('+' + Math.round(S.popAcc), P.x + rnd(-60, 60), 560); S.popAcc = 0; }
        // 돌아보기 직전에 딱 멈추면 PERFECT
        var close = S.people.some(function (p) { return p.state === 'tell' && !p.fake && p.dur - p.st < 0.35; });
        if (close) { S.score += 30; pop('PERFECT', 640, 360, true); A.tick(true); }
        else if (S.chunk >= 0.85) { S.score += 15; pop('GREAT', 640, 380, true); A.tick(false); }
        else if (S.chunk >= 0.6) { S.score += 8; pop('NICE', 640, 380, true); A.tick(false); }
        S.chunk = 0;
      }

      director(dt);
      updPeople(dt);

      // 들킴: 쳐다보는 사람이 있는데 뀌고 있다(돌아보는 순간 0.08초는 봐준다)
      var seer = S.farting && S.people.find(function (p) { return p.state === 'look' && p.st > S.D.grace; });
      if (seer) {
        S.phase = 'caught'; S.pt = 0; S.who = seer; S.farting = false;
        stareAll(seer); P.state = 'caught'; A.caught();
        for (var i = 0; i < 16; i++) emit(1, false);
      } else if (S.g >= 1) {
        S.g = 1; S.phase = 'burst'; S.pt = 0; S.farting = false;
        A.burst(); emit(70, true); S.shake = 1;
        P.state = 'caught';
        setTimeout(function () { if (S.phase === 'burst') stareAll(null); }, 350);
      } else if (S.time >= D.time) {
        S.phase = 'clear'; S.pt = 0; S.farting = false; A.clear();
        S.people.forEach(function (p) { if (p.state !== 'idle') { p.state = 'back'; p.st = 0; p.dur = 0.3; } });
        P.state = 'relief';
      }

      // 가득 차면 쿵쿵
      if (S.g > 0.72 && !S.farting) {
        S.beatT -= dt;
        if (S.beatT <= 0) { A.beat(); S.beatT = S.g > 0.9 ? 0.42 : 0.7; }
      } else S.beatT = 0;
      if (S.g > 0.7 && Math.random() < dt * 6 * S.g) {
        drops.push({ x: P.x + (Math.random() < 0.5 ? -1 : 1) * rnd(40, 70), y: 440, vx: rnd(-80, 80), vy: -rnd(80, 200), age: 0 });
      }
      P.g = S.g; P.farting = S.farting;
      P.shake = S.farting ? 1.5 : Math.max(0, (S.g - 0.6) / 0.4) * 6;
    }

    if (ph === 'caught' || ph === 'burst') {
      updPeople(dt);
      if (ph === 'burst') { S.shake = Math.max(0, S.shake - dt * 0.6); if (S.pt < 1.2 && Math.random() < dt * 40) emit(2, true); }
      P.farting = false; P.shake = ph === 'burst' ? 10 * S.shake : 0;
      if (S.pt > 2.0 && !$('over').classList.contains('on')) {
        S.phase = 'over';
        S.score = Math.round(S.score);
        if (S.score > save.best) save.best = S.score;
        save.stage = S.stage; save.score = S.stageScore0; store();
        $('overN').textContent = '⭐ ' + S.score;
        if (window.OG) OG.over({ result: ph === 'burst' ? 'BURST' : 'CAUGHT', score: S.score, stage: S.stage });
        $('newgame2').hidden = S.stage <= 1;
        panel('over');
      }
    }

    if (ph === 'clear') {
      updPeople(dt);
      S.g = Math.max(0, S.g - dt * 0.6); P.g = S.g; P.farting = false; P.shake = 0;
      if (S.pt > 0.7 && !$('clear').classList.contains('on')) {
        S.score = Math.round(S.score);
        if (S.score > save.best) save.best = S.score;
        save.stage = S.stage + 1; save.score = S.score; store();
        $('clearN').textContent = '⭐ ' + S.score;
        if (window.OG) OG.over({ result: 'WIN', score: S.score, stage: S.stage });
        panel('clear');
      }
    }

    // 구름·땀
    puffs.forEach(function (q) { q.age += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.vy *= 0.985; q.r += q.gr * dt; });
    for (var j = puffs.length - 1; j >= 0; j--) if (puffs[j].age > puffs[j].life) puffs.splice(j, 1);
    drops.forEach(function (d) { d.age += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 700 * dt; });
    for (j = drops.length - 1; j >= 0; j--) if (drops[j].age > 0.8) drops.splice(j, 1);

    hud();
  }

  function hud() {
    var gs = $('gbar').firstElementChild;
    gs.style.width = (S.g * 100).toFixed(1) + '%';
    gs.style.background = S.g > 0.8 ? '#ff4d4d' : S.g > 0.6 ? '#ffb020' : '#7ed957';
    $('gstat').classList.toggle('hot', S.phase === 'play' && S.g > 0.85);
    var tl = S.D ? Math.max(0, 1 - S.time / S.D.time) : 1;
    $('tbar').firstElementChild.style.width = (tl * 100).toFixed(1) + '%';
    $('score').textContent = Math.round(S.score);
  }

  // ── 그리기 ──
  function draw() {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    var shx = 0, shy = 0;
    if (S.phase === 'burst' && S.shake > 0) { shx = (Math.random() - 0.5) * 24 * S.shake; shy = (Math.random() - 0.5) * 24 * S.shake; }
    g.setTransform(DPR * SC, 0, 0, DPR * SC, DPR * (OX + shx), DPR * (OY + shy));
    var id = S.loc.id;
    ART.bg(g, id, { t: S.t, prog: S.D ? Math.min(1, S.time / S.D.time) : (S.t * 0.02) % 1 });

    var list = S.people.slice().sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (p) {
      ART.behind(g, id, p);
      ART.person(g, p, S.t);
      ART.front(g, id, p);
    });
    ART.player(g, P, S.t);
    puffs.forEach(function (q) { ART.puff(g, q); });
    g.fillStyle = '#7fd3ff';
    drops.forEach(function (d) { g.globalAlpha = 1 - d.age / 0.8; g.beginPath(); g.ellipse(d.x, d.y, 8, 12, 0, 0, 6.28); g.fill(); });
    g.globalAlpha = 1;

    // 말풍선
    S.people.forEach(function (p) {
      var tp = ART.person.top(p);
      if (p.state === 'tell') ART.bubble(g, tp.x, tp.y, '?', 0.8 + 0.1 * Math.sin(S.t * 20));
      if (S.phase === 'caught' && p === S.who) ART.bubble(g, tp.x, tp.y, '!', Math.min(1.3, 0.5 + S.pt * 3));
    });
    if (S.phase === 'burst') {
      g.globalAlpha = Math.max(0, 0.55 - S.pt * 0.2); g.fillStyle = '#c9e26b'; g.fillRect(-3000, -3000, 7280, 7000); g.globalAlpha = 1;
    }
  }

  // ── 가로 보기 ──
  if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');
  function orient() {
    document.body.classList.toggle('portrait', innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
  }
  $('rotGo').addEventListener('click', function () { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', function (e) { e.preventDefault(); document.body.classList.remove('portrait'); });
  window.addEventListener('resize', function () { resize(); orient(); draw(); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { resize(); orient(); draw(); }, 150); });

  // ── 돌리기 ──
  var last = 0, frozen = false;
  function frame(ts) {
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    if (!frozen) { update(dt); draw(); }
    requestAnimationFrame(frame);
  }
  resize(); orient(); showTitle(); draw();
  requestAnimationFrame(frame);

  window.__bw = {
    S: S, P: P,
    tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); draw(); return S.phase; },
    hold: function (b) { keyHold = !!b; holdChange(); },
    freeze: function (b) { frozen = b !== false; },
    step: function (dt) { update(dt || 1 / 60); },
    go: function (stage) { S.stage = stage; S.score = 0; beginStage(); }
  };
})();
