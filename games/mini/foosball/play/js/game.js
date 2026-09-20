// 테이블 축구 — 경기 흐름·입력·점수·저장
(function () {
  const $ = (s) => document.querySelector(s);
  const C = PH.C, S = PH.S;
  const L = window.L;

  // ---------- 자료 ----------
  const LAST = 60;
  // 내 팀 유니폼 (상점)
  const KITS = [
    { n: '파랑', shirt: '#2a62d8', shorts: '#f2f2f2', socks: '#2a62d8', trim: '#ffffff', pw: 1.0, sp: 1.0, $: 0 },
    { n: '빨강', shirt: '#d8322a', shorts: '#ffffff', socks: '#d8322a', trim: '#ffffff', pw: 1.02, sp: 1.03, $: 150 },
    { n: '초록', shirt: '#1f9a4a', shorts: '#ffffff', socks: '#1f9a4a', trim: '#f2d040', pw: 1.03, sp: 1.05, $: 300 },
    { n: '노랑', shirt: '#f2c230', shorts: '#1a3f9a', socks: '#f2c230', trim: '#1a3f9a', pw: 1.05, sp: 1.06, $: 500 },
    { n: '주황', shirt: '#f07a1a', shorts: '#1a1a1a', socks: '#f07a1a', trim: '#1a1a1a', pw: 1.07, sp: 1.08, $: 750 },
    { n: '하늘', shirt: '#6ab8ee', shorts: '#ffffff', socks: '#ffffff', trim: '#ffffff', pw: 1.08, sp: 1.11, $: 1000 },
    { n: '보라', shirt: '#7a3ad0', shorts: '#f2d040', socks: '#7a3ad0', trim: '#f2d040', pw: 1.1, sp: 1.13, $: 1300 },
    { n: '분홍', shirt: '#f06aa8', shorts: '#ffffff', socks: '#f06aa8', trim: '#ffffff', pw: 1.12, sp: 1.15, $: 1700 },
    { n: '흑표범', shirt: '#1c1c1c', shorts: '#1c1c1c', socks: '#1c1c1c', trim: '#d8b040', pw: 1.14, sp: 1.17, $: 2200 },
    { n: '백호', shirt: '#f4f4f4', shorts: '#1a1a1a', socks: '#f4f4f4', trim: '#d8322a', pw: 1.16, sp: 1.2, $: 2800 },
    { n: '황금', shirt: '#d8b040', shorts: '#ffffff', socks: '#d8b040', trim: '#ffffff', pw: 1.19, sp: 1.22, $: 3600 },
    { n: '은하', shirt: '#1a1f5a', shorts: '#1a1f5a', socks: '#6ae0ff', trim: '#6ae0ff', pw: 1.22, sp: 1.25, $: 4500 },
  ];
  // 상대 12나라 (다섯 판씩, 뒤로 갈수록 강하다)
  const TEAMS = [
    { n: '일본', h: ['#1f3a9a', '#ffffff', '#1f3a9a', '#ffffff'], a: ['#ffffff', '#1f3a9a', '#ffffff', '#1f3a9a'] },
    { n: '멕시코', h: ['#1a7a4a', '#ffffff', '#d8322a', '#ffffff'], a: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#d8b040'] },
    { n: '미국', h: ['#ffffff', '#1a2a5a', '#ffffff', '#d8322a'], a: ['#1a2a5a', '#1a2a5a', '#1a2a5a', '#d8322a'] },
    { n: '네덜란드', h: ['#f07a1a', '#f07a1a', '#f07a1a', '#1a1a1a'], a: ['#1a2a5a', '#1a2a5a', '#1a2a5a', '#f07a1a'] },
    { n: '포르투갈', h: ['#8a1a2a', '#1a6a3a', '#8a1a2a', '#d8b040'], a: ['#ffffff', '#ffffff', '#ffffff', '#8a1a2a'] },
    { n: '크로아티아', h: ['#e0302a', '#ffffff', '#1a2a8a', '#ffffff'], a: ['#1a2a5a', '#1a2a5a', '#1a2a5a', '#e0302a'] },
    { n: '이탈리아', h: ['#2a6ad8', '#ffffff', '#2a6ad8', '#ffffff'], a: ['#ffffff', '#ffffff', '#ffffff', '#2a6ad8'] },
    { n: '스페인', h: ['#c8201a', '#1a2a5a', '#1a2a5a', '#f2c230'], a: ['#f2e0a0', '#f2e0a0', '#f2e0a0', '#c8201a'] },
    { n: '독일', h: ['#f4f4f4', '#1a1a1a', '#f4f4f4', '#1a1a1a'], a: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#e0302a'] },
    { n: '프랑스', h: ['#1a2a5a', '#ffffff', '#e0302a', '#ffffff'], a: ['#ffffff', '#1a2a5a', '#ffffff', '#1a2a5a'] },
    { n: '아르헨티나', h: ['#7ec4f0', '#1a1a1a', '#ffffff', '#ffffff'], a: ['#1a2a5a', '#1a2a5a', '#1a2a5a', '#7ec4f0'] },
    { n: '브라질', h: ['#f6d020', '#1a4ab0', '#ffffff', '#1a8a3a'], a: ['#1a4ab0', '#ffffff', '#1a4ab0', '#f6d020'] },
  ];
  const MISSIONS = [
    { id: 'g1', n: '첫 골', $: 50 },
    { id: 'w1', n: '첫 승리', $: 100 },
    { id: 'row3', n: '연속 3골', $: 150 },
    { id: 'df', n: '수비수 골', $: 150 },
    { id: 'fast', n: '5초 골', $: 200 },
    { id: 'bank', n: '벽 맞고 골', $: 200 },
    { id: 'clean', n: '무실점 승리', $: 250 },
    { id: 'gk', n: '골키퍼 골', $: 300 },
    { id: 'back', n: '역전승', $: 300 },
    { id: 'w5', n: '5연승', $: 400 },
    { id: 'g100', n: '100골', $: 500 },
    { id: 's30', n: 'STAGE 30', $: 1000 },
  ];

  // ---------- 저장 ----------
  const KEY = 'foosball.prog';
  const SV = (() => {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    return Object.assign({ stage: 1, coins: 0, owned: [0], kit: 0, ms: {}, goals: 0, wins: 0, streak: 0, ended: false, games: 0 }, d || {});
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e) {} }

  // 스테이지 → 상대·세기·몇 골
  const teamFor = (st) => (st <= LAST ? Math.min(11, Math.floor((st - 1) / 5)) : (st * 7) % 12);
  const goalsFor = (st) => (st <= 12 ? 3 : st <= 36 ? 4 : 5);
  // 평균 기준으로 잘게: 앞쪽은 아주 천천히 오르고(20스테이지 0.14), 60스테이지 0.72, 그 뒤는 잘하는 사람용으로 1까지
  // 9/20 사장님 10연승·"11스테이지 여전히 쉬움" → 더 가파르게: 1스테이지 0.10, 11스테이지 0.24, 20스테이지 0.35, 30스테이지 0.47, 45스테이지 0.64, 60스테이지 0.80
  const levelFor = (st) => (st <= LAST ? 0.1 + 0.7 * Math.pow((st - 1) / (LAST - 1), 0.9) : Math.min(1, 0.8 + (st - LAST) * 0.005));
  const themeFor = (st) => Math.floor((st - 1) / 12) % 5;

  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function dist(a, b) { const x = hex(a), y = hex(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); }
  const kitOf = (arr) => ({ shirt: arr[0], shorts: arr[1], socks: arr[2], trim: arr[3] });
  function oppKit(ti, mine) {
    const t = TEAMS[ti];
    // 위에서 보면 윗옷·바지가 다 보이니 둘 다 내 옷과 멀어야 한다
    const far = (k) => Math.min(dist(k[0], mine.shirt), dist(k[1], mine.shirt), dist(k[0], mine.shorts) + 60) > 140;
    for (const k of [t.h, t.a, ['#1c1c1c', '#1c1c1c', '#1c1c1c', '#ffffff'], ['#e0302a', '#e0302a', '#e0302a', '#ffffff'], ['#f6d020', '#f6d020', '#f6d020', '#1a1a1a']]) {
      if (far(k)) return kitOf(k);
    }
    return kitOf(t.a);
  }

  // ---------- 상태 ----------
  const G = {
    mode: 'title', phase: 'idle', score: [0, 0], t: 0, pt: 0, paused: false,
    T: [0, 0], kHold: [0, 0], act: [null, null], kick: [false, false], ai: [null, null], names: ['나', ''], kits: [null, null],
    flags: {}, target: 3, still: 0, run: 0,
  };
  window.G = G;

  const cv = $('#cv');
  TB.init(cv);
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) document.body.classList.add('touch');
  function orient() {
    document.body.classList.toggle('portrait', innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
  }
  addEventListener('resize', () => { TB.resize(); orient(); });
  orient();

  // ---------- 화면 ----------
  const show = (id, on) => { $(id).hidden = !on; };
  function coinsUI() { $('#coins').textContent = SV.coins.toLocaleString(); }
  function stageUI() {
    $('#stagePill').hidden = G.mode === 'duo';
    $('#stageN').textContent = SV.stage;
    $('#goalN').textContent = G.target;
    $('#tStage').textContent = 'STAGE ' + SV.stage;
    $('#bNew').hidden = SV.stage <= 1; // 처음부터 다시 (사장님 9/20)
  }
  function scoreUI(bump) {
    $('#s0').textContent = G.score[0];
    $('#s1').textContent = G.score[1];
    if (bump != null) { const e = $('#s' + bump); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); }
    $('#n0').textContent = L(G.names[0]);
    $('#n1').textContent = L(G.names[1]);
    $('#c0').style.background = G.kits[0].shirt;
    $('#c1').style.background = G.kits[1].shirt;
    TB.setScore(G.score[0], G.score[1]);
  }
  let wordTimer = 0;
  function word(txt, cls, sub) {
    const w = $('#word');
    w.className = '';
    w.innerHTML = L(txt) + (sub ? '<small>' + L(sub) + '</small>' : '');
    void w.offsetWidth;
    w.className = 'on ' + (cls || '');
    clearTimeout(wordTimer);
    wordTimer = setTimeout(() => { w.className = cls || ''; }, 1500);
  }
  function toast(txt) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = L(txt);
    $('#toasts').appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }
  function keysUI() {
    $('#keys').innerHTML = G.mode === 'duo'
      ? 'P1 &nbsp;W S ' + L('이동') + ' · D ' + L('킥') + '<br>P2 &nbsp;↑ ↓ ' + L('이동') + ' · ← ' + L('킥')
      : '🖱 ↕ · ↑ ↓ &nbsp;' + L('이동') + '<br>🖱 ' + L('클릭') + ' · SPACE &nbsp;' + L('킥');
  }

  // ---------- 경기 ----------
  function setupMatch(mode) {
    G.mode = mode;
    const mine = KITS[SV.kit];
    if (mode === 'duo') {
      const k2 = dist(mine.shirt, KITS[1].shirt) > 150 ? KITS[1] : KITS[0];
      G.kits = [mine, dist(mine.shirt, k2.shirt) > 150 ? k2 : KITS[2]];
      G.names = ['P1', 'P2'];
      G.target = 5;
      G.ai = [null, null];
      TB.setTheme(1);
    } else if (mode === 'tour') {
      const ti = teamFor(SV.stage);
      G.kits = [mine, oppKit(ti, mine)];
      G.names = ['나', TEAMS[ti].n];
      G.target = goalsFor(SV.stage);
      G.ai = [null, PH.makeAI(1, levelFor(SV.stage))];
      TB.setTheme(themeFor(SV.stage));
    } else {
      // 타이틀 구경: 둘 다 두뇌
      G.kits = [KITS[0], kitOf(TEAMS[11].h)];
      G.names = ['', ''];
      G.target = 99;
      G.ai = [PH.makeAI(0, 0.55), PH.makeAI(1, 0.55)];
      TB.setTheme(themeFor(SV.stage));
    }
    TB.setKits(G.kits[0], G.kits[1]);
    PH.reset();
    for (let t = 0; t < 2; t++) {
      if (!G.ai[t]) { S.team[t].pow = t === 0 || mode === 'duo' ? KITS[mode === 'duo' && t === 1 ? 0 : SV.kit].pw : 1; S.team[t].spd = 1.3 * (t === 0 ? KITS[SV.kit].sp : 1); }
    }
    if (mode === 'duo') { S.team[0].pow = S.team[1].pow = 1.05; S.team[0].spd = S.team[1].spd = 1.3; }
    G.score = [0, 0];
    G.T = [0, 0];
    G.kick = [false, false];
    G.flags = { conceded: 0, trailed: false, run: 0 };
    G.still = 0;
    scoreUI();
    stageUI();
    keysUI();
    document.body.classList.toggle('duo', mode === 'duo');
    TB.warm(); // 경기 소개 화면 동안 새 옷·새 방을 미리 그려 둔다
  }

  function startGame(mode) {
    AU.unlock();
    setupMatch(mode);
    document.body.classList.add('playing');
    show('#title', false);
    show('#end', false);
    $('#vsS').textContent = mode === 'duo' ? '2 PLAYERS' : SV.stage === LAST ? 'FINAL' : 'STAGE ' + SV.stage;
    $('#vsN0').textContent = L(G.names[0]);
    $('#vsN1').textContent = L(G.names[1]);
    $('#vsC0').style.background = G.kits[0].shirt;
    $('#vsC1').style.background = G.kits[1].shirt;
    $('#vsC0').style.borderColor = G.kits[0].trim;
    $('#vsC1').style.borderColor = G.kits[1].trim;
    $('#vsG').textContent = '🎯 ' + G.target;
    show('#vs', true);
    G.phase = 'vs';
    G.pt = 0;
  }

  function kickoff() {
    G.phase = 'play';
    G.pt = 0;
    G.serveAt = 0.7;
    G.still = 0;
    S.ball.st = 'wait';
  }

  function onGoal(team) {
    const b = S.ball;
    G.score[team]++;
    scoreUI(team);
    G.phase = 'goal';
    G.pt = 0;
    G.goalTeam = team;
    const human = G.mode === 'tour' ? team === 0 : G.mode === 'duo';
    // 넣은 팀 막대가 빙글빙글
    for (const r of S.rods) if (r.team === team) r.spin = 22 + Math.random() * 6;
    TB.shake(0.012);
    if (G.mode === 'title') return;
    const k = b.kickBy && b.kickBy.team === team ? b.kickBy.k : null;
    let sub = '';
    if (k === 'gk') sub = 'KEEPER GOAL';
    else if (Math.hypot(b.vx, b.vz) > 3.2 || Math.abs(b.vx) > 3.0) sub = 'SUPER SHOT';
    if (G.mode === 'tour' && team === 1) {
      word('GOAL', 'them');
      AU.play('against');
      G.flags.conceded++;
      G.flags.run = 0;
      if (G.score[1] > G.score[0]) G.flags.trailed = true;
      return;
    }
    word('GOAL!', G.mode === 'duo' && team === 1 ? 'them' : '', sub);
    AU.play('goal');
    if (G.mode !== 'tour') return;
    void human;
    // 기록·미션
    SV.goals++;
    addCoins(5);
    G.flags.run++;
    mission('g1');
    if (G.flags.run >= 3) mission('row3');
    if (k === 'gk') mission('gk');
    if (k === 'df') mission('df');
    if (b.serveT != null && b.t - b.serveT < 5) mission('fast');
    if (b.wallAfterKick) mission('bank');
    if (SV.goals >= 100) mission('g100');
    save();
  }

  function endMatch() {
    G.phase = 'over';
    G.pt = 0;
    const [a, c] = G.score;
    let title, win = false, coins = 0;
    if (G.mode === 'duo') {
      title = a > c ? 'P1 WIN' : 'P2 WIN';
      win = true;
      AU.play('win');
    } else {
      SV.games++;
      win = a > c;
      title = win ? 'WIN' : 'GAME OVER';
      if (win) {
        coins = 30 + Math.min(SV.stage, LAST) * 3;
        SV.wins++;
        SV.streak++;
        mission('w1');
        if (G.flags.conceded === 0) mission('clean');
        if (G.flags.trailed) mission('back');
        if (SV.streak >= 5) mission('w5');
        if (SV.stage === LAST && !SV.ended) { SV.ended = true; G.ending = true; }
        SV.stage++;
        if (SV.stage > 30) mission('s30');
      } else {
        SV.streak = 0;
      }
      addCoins(coins);
      AU.play(win ? 'win' : 'lose');
      save();
    }
    $('#eTitle').textContent = L(title);
    $('#eTitle').className = win ? 'win' : 'lose';
    $('#eScore').innerHTML = `<span><span class="chip" style="background:${G.kits[0].shirt}"></span><b>${a}</b></span><i>:</i><span><b>${c}</b><span class="chip" style="background:${G.kits[1].shirt}"></span></span>`;
    $('#eCoins').textContent = coins ? '🪙 +' + coins : '';
    $('#eNext').hidden = !(G.mode === 'tour' && win);
    $('#eRetry').hidden = G.mode === 'tour' && win;
    setTimeout(() => {
      if (G.mode === 'title') return;
      if (G.ending) { G.ending = false; showEnding(); return; }
      show('#end', true);
    }, 1600);
    coinsUI();
    stageUI();
  }

  function mission(id) {
    if (SV.ms[id]) return;
    SV.ms[id] = 1;
    const m = MISSIONS.find((x) => x.id === id);
    addCoins(m.$);
    toast('✔ ' + m.n + '  🪙 +' + m.$);
    setTimeout(() => AU.play('coin'), 500);
    save();
  }
  function addCoins(n) { SV.coins += n; coinsUI(); save(); }

  function showEnding() {
    show('#ending', true);
    const box = $('#confetti');
    box.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = `hsl(${Math.random() * 360},90%,60%)`;
      s.style.animationDelay = Math.random() * 3 + 's';
      s.style.animationDuration = 2.5 + Math.random() * 2 + 's';
      box.appendChild(s);
    }
    AU.play('goal');
  }

  function goTitle() {
    document.body.classList.remove('playing');
    show('#end', false); show('#vs', false); show('#ending', false); show('#pauseCover', false);
    G.paused = false; AU.paused = false;
    setupMatch('title');
    show('#title', true);
    kickoff();
    coinsUI();
    stageUI();
  }

  // ---------- 입력 ----------
  const keys = {};
  const ZL = C.HW - 0.02;
  const clampZ = (z) => Math.max(-ZL, Math.min(ZL, z));
  function press(t, on) {
    if (G.mode === 'title' || G.paused) on = false;
    if (on && !G.kick[t] && !G.ai[t]) S.team[t].tap = true;
    G.kick[t] = on;
    const b = t === 0 ? (G.mode === 'duo' ? $('#k1') : $('#k2')) : $('#k2');
    if (b) b.classList.toggle('on', on);
  }
  // 끌기: 화면 세로 절반을 움직이면 테이블 폭 전체
  const drags = new Map();
  function sideOf(x) {
    if (G.mode === 'duo') return x < innerWidth / 2 ? 0 : 1;
    return x < innerWidth * 0.62 ? 'drag' : 'kick';
  }
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    if (G.mode === 'title' || G.paused) return;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    if (e.pointerType === 'mouse') {
      G.mouse = true;
      press(0, true);
      drags.set(e.pointerId, { mouse: true });
      return;
    }
    const s = sideOf(e.clientX);
    if (s === 'kick') { press(0, true); drags.set(e.pointerId, { kick: 0 }); return; }
    const team = s === 'drag' ? 0 : s;
    drags.set(e.pointerId, { team, y: e.clientY, T: G.T[team] });
  });
  cv.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' && G.mode !== 'title' && !G.paused && G.mode !== 'duo') {
      // 화살표를 쓰는 중이면 손 떨림 정도의 마우스 움직임은 무시한다
      if (!G.mouse) {
        if (!G.mAnchor) { G.mAnchor = [e.clientX, e.clientY]; return; }
        if (Math.hypot(e.clientX - G.mAnchor[0], e.clientY - G.mAnchor[1]) < 30) return;
        G.mouse = true;
      }
      const p = TB.pick(e.clientX, e.clientY);
      if (p) G.T[0] = clampZ(p.z);
      return;
    }
    const d = drags.get(e.pointerId);
    if (!d || d.team == null) return;
    const k = (2 * ZL) / (innerHeight * 0.5);
    G.T[d.team] = clampZ(d.T + (e.clientY - d.y) * k);
    // 끝에 닿으면 기준을 옮겨 되돌릴 때 바로 반응
    if (Math.abs(G.T[d.team]) >= ZL) { d.T = G.T[d.team]; d.y = e.clientY; }
  });
  function endPtr(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    if (d.mouse) press(0, false);
    if (d.kick != null) press(d.kick, false);
  }
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
  // 킥 단추
  const kbtn = (id, team) => {
    const b = $(id);
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); AU.unlock(); try { b.setPointerCapture(e.pointerId); } catch (err) {} press(team(), true); });
    const up = () => press(team(), false);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  };
  kbtn('#k1', () => 0);
  kbtn('#k2', () => (G.mode === 'duo' ? 1 : 0));

  // 키 이름: e.code 가 비어 오는 환경(원격·일부 입력기)과 한글 자판(ㅈ·ㄴ·ㅇ)도 알아듣게
  const KEYMAP = { ' ': 'Space', Spacebar: 'Space', Up: 'ArrowUp', Down: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight',
    w: 'KeyW', W: 'KeyW', 'ㅈ': 'KeyW', s: 'KeyS', S: 'KeyS', 'ㄴ': 'KeyS', d: 'KeyD', D: 'KeyD', 'ㅇ': 'KeyD',
    p: 'KeyP', P: 'KeyP', 'ㅔ': 'KeyP', m: 'KeyM', M: 'KeyM', 'ㅡ': 'KeyM', k: 'KeyK', K: 'KeyK', 'ㅏ': 'KeyK' };
  const kc = (e) => (e.code && e.code !== 'Unidentified' ? e.code : KEYMAP[e.key] || e.key || '');
  addEventListener('keydown', (e) => {
    const code = kc(e);
    if (e.repeat) { if (/Arrow|Space/.test(code)) e.preventDefault(); return; }
    keys[code] = true;
    if (code === 'Escape' || code === 'KeyP') { if (G.mode !== 'title') togglePause(); }
    if (code === 'KeyM') $('#tBgm').click();
    if (code === 'KeyK') $('#tSnd').click();
    if (G.phase === 'vs' && (code === 'Space' || code === 'Enter')) { e.preventDefault(); G.pt = 99; return; }
    if (G.mode === 'duo') {
      if (code === 'KeyD' || code === 'Space') { e.preventDefault(); press(0, true); }
      if (code === 'ArrowLeft' || code === 'Enter' || code === 'Numpad0') { e.preventDefault(); press(1, true); }
    } else if (code === 'Space' || code === 'KeyD' || code === 'ArrowRight') { e.preventDefault(); press(0, true); }
    if (/Arrow/.test(code)) e.preventDefault();
    if (/Arrow|Key[WS]/.test(code)) { G.mouse = false; G.mAnchor = null; }
    // 톡 눌러도 한 칸(4cm) 움직인다 (누르고 있으면 계속)
    if (G.mode !== 'title' && !G.paused) {
      const up = code === 'ArrowUp' || code === 'KeyW', dn = code === 'ArrowDown' || code === 'KeyS';
      const t = G.mode === 'duo' && (code === 'ArrowUp' || code === 'ArrowDown') ? 1 : 0;
      if (up) G.T[t] = clampZ(G.T[t] - 0.004);
      if (dn) G.T[t] = clampZ(G.T[t] + 0.004);
    }
  });
  addEventListener('keyup', (e) => {
    const code = kc(e);
    keys[code] = false;
    if (G.mode === 'duo') {
      if (code === 'KeyD' || code === 'Space') press(0, false);
      if (code === 'ArrowLeft' || code === 'Enter' || code === 'Numpad0') press(1, false);
    } else if (code === 'Space' || code === 'KeyD' || code === 'ArrowRight') press(0, false);
  });

  function togglePause(v) {
    G.paused = v == null ? !G.paused : v;
    AU.paused = G.paused;
    show('#pauseCover', G.paused);
    if (G.paused) { press(0, false); press(1, false); }
  }

  // ---------- 매 프레임 ----------
  let acc = 0, lastT = 0;
  function humanInput(dt) {
    // 키 이동: 누르기 시작하면 천천히(미세조절), 0.35초 넘게 누르면 빨라진다 (사장님 9/20 "미세조절이 안된다")
    const dirs = G.mode === 'duo'
      ? [(keys.KeyW ? -1 : 0) + (keys.KeyS ? 1 : 0), (keys.ArrowUp ? -1 : 0) + (keys.ArrowDown ? 1 : 0)]
      : [(keys.KeyW || keys.ArrowUp ? -1 : 0) + (keys.KeyS || keys.ArrowDown ? 1 : 0), 0];
    for (let t = 0; t < 2; t++) {
      if (!dirs[t]) { G.kHold[t] = 0; continue; }
      G.kHold[t] += dt;
      // 누른 순간 0.15m/s 에서 0.3초 만에 0.85m/s 까지 부드럽게 올라간다 (톡톡은 미세, 길게는 시원하게 — 사장님 9/20)
      const k = Math.min(1, G.kHold[t] / 0.2);
      const sp = 0.15 + (1.0 - 0.15) * k * k; // 0.2초 만에 1.0m/s (9/20 "빨리 움직이고 싶을 때 반응이 느림")
      G.T[t] = clampZ(G.T[t] + dirs[t] * sp * dt);
    }
    // 막대 넷이 한 자리로 같이 움직인다 (사장님 2026-09-20)
    for (let t = 0; t < 2; t++) {
      if (G.ai[t]) continue;
      S.team[t].kick = G.kick[t];
      // 실제 테이블 축구: 막대는 손이 민 만큼만 미끄러진다. 인형을 공에 자동으로 맞추지 않는다 (사장님 2026-09-20)
      // 실제 막대처럼 손이 민 거리 그대로(1:1) 넷이 같은 속도로 미끄러지고, 각자 인형이 벽에 닿는 끝에서 멈춘다 (사장님 9/20)
      for (const r of S.rods) if (r.team === t) {
        r.aimPos = Math.max(-r.tr, Math.min(r.tr, G.T[t]));
        r.spd = S.team[t].spd;
        let bk = 0, bd = 1e9; // 공에 제일 가까운 인형 (뒤로 감기 판정용)
        for (let k = 0; k < r.men.length; k++) { const d = Math.abs(r.men[k] + r.pos - S.ball.z); if (d < bd) { bd = d; bk = k; } }
        r.man = bk;
      }
    }
    // 폰 끌기 자리 표시
    for (let t = 0; t < 2; t++) {
      const el = $('#tr' + (t + 1) + ' i');
      if (el) el.style.top = ((G.T[t] + ZL) / (2 * ZL)) * 100 + '%';
    }
  }

  function physics(dt) {
    acc += dt;
    let n = 0;
    while (acc >= C.DT && n < 40) {
      for (let t = 0; t < 2; t++) if (G.ai[t]) PH.aiStep(G.ai[t], C.DT);
      PH.step();
      acc -= C.DT;
      n++;
    }
    if (acc > C.DT) acc = 0;
    const b = S.ball;
    const quiet = G.mode === 'title';
    for (const e of S.events) {
      if (e.t === 'hit') {
        if (!quiet) AU.hit(e.v, e.kick);
        if (e.kick) b.wallAfterKick = false;
      } else if (e.t === 'wall') {
        if (!quiet) AU.wall(e.v);
        if (b.kickBy) b.wallAfterKick = true;
      } else if (e.t === 'post') {
        if (!quiet) AU.post(e.v);
        TB.shake(0.004);
      } else if (e.t === 'goal') {
        if (G.phase === 'play') onGoal(e.team);
      } else if (e.t === 'serve') {
        b.serveT = b.t;
        b.kickBy = null;
        b.wallAfterKick = false;
        if (!quiet) AU.play('serve');
      }
    }
    S.events.length = 0;
  }

  function update(dt) {
    if (G.paused) return;
    G.t += dt;
    G.pt += dt;
    const b = S.ball;
    humanInput(dt);
    // 카메라
    const [cp, cl] = TB.playCam();
    if (G.mode === 'title') {
      const s = Math.sin(G.t * 0.12);
      TB.camTo([s * 0.5, 0.78 + 0.05 * Math.sin(G.t * 0.2), 0.86 + Math.cos(G.t * 0.12) * 0.08], [s * 0.08, -0.02, 0.02]);
      TB.camStep(dt, 1.5);
    } else if (G.phase === 'goal') {
      // 골 장면: 그대로 골대 쪽으로 옮기며 조금 다가간다 (기울이지 않는다)
      const gx = G.goalTeam === 0 ? C.HL : -C.HL;
      TB.camTo([gx * 0.35, cp[1] * 0.82, cp[2]], [gx * 0.35, 0, 0]);
      TB.camStep(dt, 2);
    } else {
      TB.camTo(cp, cl, G.phase === 'vs' && G.pt < dt * 1.5);
      TB.camStep(dt, 3);
    }
    if (G.phase === 'vs') {
      if (G.pt > 2.4) { show('#vs', false); kickoff(); }
      return;
    }
    if (G.phase === 'play') {
      if (b.st === 'wait' && G.pt > G.serveAt) {
        PH.serve(null, G.serveTeam);
        G.serveTeam = null;
        if (G.mode !== 'title') AU.play('whistle');
      }
      physics(dt);
      // 멈춘 공: 아무도 못 닿는 곳이면 다시 서브
      if (b.st === 'play') {
        const v = Math.hypot(b.vx, b.vz);
        if (v < 0.03) G.still += dt; else G.still = 0;
        const reach = S.rods.some((r) => Math.abs(b.x - r.x) < 0.07);
        if ((G.still > 1.5 && !reach) || G.still > 6) {
          // 규칙: 아무도 못 닿는 곳에 공이 서면 가운데 5인 막대에서 다시 넣는다
          G.still = 0;
          G.serveTeam = b.last ? 1 - b.last.team : Math.random() < 0.5 ? 0 : 1;
          b.st = 'wait';
          G.pt = 0;
          G.serveAt = 0.4;
        }
      }
      return;
    }
    if (G.phase === 'goal') {
      physics(dt);
      if (G.pt > 1.1) for (const r of S.rods) if (r.spin) { r.spin = 0; r.ang = 0; r.st = 'idle'; }
      if (G.pt > 2.1) {
        if (Math.max(G.score[0], G.score[1]) >= G.target) endMatch();
        else kickoff();
      }
      return;
    }
    if (G.phase === 'over') physics(dt);
  }

  function frame(ts) {
    const dt = Math.min(0.05, lastT ? (ts - lastT) / 1000 : 0.016);
    lastT = ts;
    update(dt);
    TB.sync(dt);
    TB.render(dt);
  }
  function loop(ts) {
    frame(ts);
    requestAnimationFrame(loop);
  }

  // ---------- 단추 ----------
  const tap = (id, fn) => $(id).addEventListener('click', (e) => { AU.unlock(); AU.play('tap'); fn(e); });
  tap('#bStart', () => startGame('tour'));
  // NEW GAME: 스테이지만 1로. 코인·유니폼·미션 기록은 남긴다
  tap('#bNew', () => { SV.stage = 1; SV.streak = 0; save(); stageUI(); });
  tap('#bDuo', () => startGame('duo'));
  tap('#bShop', () => openShop());
  tap('#bMis', () => openMissions());
  tap('#vs', () => { if (G.phase === 'vs') G.pt = 99; });
  tap('#eNext', () => { show('#end', false); startGame('tour'); });
  tap('#eRetry', () => { show('#end', false); startGame(G.mode); });
  tap('#eHome', () => goTitle());
  tap('#eShop', () => openShop());
  tap('#endOk', () => { show('#ending', false); show('#end', true); });
  tap('#tPause', () => togglePause());
  tap('#pauseCover', () => togglePause(false));
  tap('#pHome', (e) => { e.stopPropagation(); goTitle(); });
  $('#tBgm').addEventListener('click', () => { AU.unlock(); AU.setBgm(!AU.bgm); togUI(); });
  $('#tSnd').addEventListener('click', () => { AU.unlock(); AU.setSnd(!AU.snd); togUI(); });
  function togUI() {
    $('#tBgm').classList.toggle('off', !AU.bgm);
    $('#tSnd').classList.toggle('off', !AU.snd);
  }
  document.querySelectorAll('.close').forEach((b) => b.addEventListener('click', () => { AU.play('tap'); b.closest('.sheet').hidden = true; }));
  $('#rotGo').addEventListener('click', () => { if (window.OL) OL.go(); });
  $('#rotSkip').addEventListener('click', (e) => { e.preventDefault(); document.body.classList.remove('portrait'); });

  // 상점: 유니폼 그림은 캔버스로
  function kitThumb(k, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const s = size / 100;
    g.scale(s, s);
    const shade = (col, a) => { const [r, gg, b] = hex(col); return `rgba(${Math.round(r * a)},${Math.round(gg * a)},${Math.round(b * a)},1)`; };
    // 윗옷
    g.beginPath();
    g.moveTo(30, 14); g.quadraticCurveTo(50, 24, 70, 14);
    g.lineTo(92, 28); g.lineTo(82, 46); g.lineTo(72, 40);
    g.lineTo(72, 64); g.lineTo(28, 64); g.lineTo(28, 40);
    g.lineTo(18, 46); g.lineTo(8, 28); g.closePath();
    const gr = g.createLinearGradient(20, 10, 80, 64);
    gr.addColorStop(0, shade(k.shirt, 1.12 > 1 ? 1 : 1));
    gr.addColorStop(1, shade(k.shirt, 0.72));
    g.fillStyle = gr;
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = shade(k.shirt, 0.5);
    g.stroke();
    // 깃·띠
    g.strokeStyle = k.trim; g.lineWidth = 4;
    g.beginPath(); g.moveTo(34, 16); g.quadraticCurveTo(50, 28, 66, 16); g.stroke();
    g.fillStyle = k.trim;
    g.fillRect(47, 30, 6, 26);
    // 반바지
    g.beginPath();
    g.moveTo(30, 66); g.lineTo(70, 66); g.lineTo(74, 86); g.lineTo(53, 86); g.lineTo(50, 76); g.lineTo(47, 86); g.lineTo(26, 86); g.closePath();
    g.fillStyle = k.shorts; g.fill();
    g.strokeStyle = shade(k.shorts, 0.55); g.lineWidth = 2; g.stroke();
    // 빛
    g.fillStyle = 'rgba(255,255,255,.18)';
    g.beginPath(); g.ellipse(38, 30, 7, 12, -0.3, 0, 7); g.fill();
    return c.toDataURL();
  }
  function dots(v, lo, hi) {
    const n = Math.max(1, Math.min(5, Math.round(1 + ((v - lo) / (hi - lo)) * 4)));
    return '●'.repeat(n) + '<span>' + '●'.repeat(5 - n) + '</span>';
  }
  const thumbs = {};
  function openShop() {
    const g = $('#shopGrid');
    g.innerHTML = '';
    $('#shopCoins').textContent = SV.coins.toLocaleString();
    KITS.forEach((k, i) => {
      const own = SV.owned.indexOf(i) >= 0;
      const d = document.createElement('div');
      d.className = 'card' + (SV.kit === i ? ' on' : '') + (own ? '' : ' lock');
      const th = thumbs[i] || (thumbs[i] = kitThumb(k, 120));
      d.innerHTML = `<img src="${th}" alt=""><div class="bn">${L(k.n)}</div>
        <div class="st"><em>${L('킥')}</em>${dots(k.pw, 1, 1.22)}</div><div class="st"><em>${L('속도')}</em>${dots(k.sp, 1, 1.25)}</div>
        <button>${SV.kit === i ? L('사용 중') : own ? L('입기') : '🪙 ' + k.$.toLocaleString()}</button>`;
      const btn = d.querySelector('button');
      if (!own && SV.coins < k.$) btn.disabled = true;
      btn.addEventListener('click', () => {
        if (!own) {
          if (SV.coins < k.$) { AU.play('no'); return; }
          SV.coins -= k.$;
          SV.owned.push(i);
          AU.play('buy');
        } else AU.play('tap');
        SV.kit = i;
        save();
        coinsUI();
        if (G.mode === 'title') setupMatchKeepPlay();
        openShop();
      });
      g.appendChild(d);
    });
    show('#shop', true);
  }
  function setupMatchKeepPlay() {
    // 타이틀 구경 경기의 옷만 갈아입힌다
    G.kits[0] = KITS[SV.kit];
    TB.setKits(G.kits[0], G.kits[1]);
  }
  function openMissions() {
    const l = $('#misList');
    l.innerHTML = '';
    let done = 0;
    MISSIONS.forEach((m) => {
      const ok = !!SV.ms[m.id];
      if (ok) done++;
      const d = document.createElement('div');
      d.className = 'mis' + (ok ? ' ok' : '');
      d.innerHTML = `<span class="ck">${ok ? '✔' : ''}</span><span class="mn">${L(m.n)}</span><span class="mr">🪙 ${m.$.toLocaleString()}</span>`;
      l.appendChild(d);
    });
    $('#misCount').textContent = done + ' / ' + MISSIONS.length;
    $('#misGoals').textContent = SV.goals;
    show('#missions', true);
  }

  // ---------- 시작 ----------
  togUI();
  goTitle();
  TB.camTo([0, 0.6, 1.0], [0, 0.02, 0], true);
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode !== 'title' && !G.paused) togglePause(true); });
  setTimeout(() => $('#loading').remove(), 60);

  // 시험용 손잡이
  window.__fs = {
    G, SV, S, PH, TB, KITS, TEAMS, levelFor, goalsFor, teamFor, startGame, goTitle,
    tick(n, dt, noDraw) { for (let i = 0; i < (n || 1); i++) { update(dt || 1 / 60); TB.sync(dt || 1 / 60); } if (!noDraw) TB.render(1 / 60); },
    shot(name) {
      TB.render(0.016);
      const url = cv.toDataURL('image/png');
      return fetch('/save?name=' + (name || 'shot.png'), { method: 'POST', body: url }).then((r) => r.text());
    },
  };
})();
