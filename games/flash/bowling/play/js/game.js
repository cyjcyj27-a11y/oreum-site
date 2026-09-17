// 와르르 볼링 — 흐름·점수·상대·입력·저장
(function () {
  const $ = (s) => document.querySelector(s);
  const C = PH.C;
  const L = window.L;

  // ---------- 자료 ----------
  const LAST = 60;
  const BALLS = [
    { n: '연습공', lb: 10, pw: 0.94, hk: 0.85, $: 0 },
    { n: '딸기', lb: 11, pw: 0.97, hk: 0.95, $: 100 },
    { n: '민트', lb: 12, pw: 1.0, hk: 1.0, $: 200 },
    { n: '오렌지', lb: 12, pw: 1.0, hk: 1.15, $: 350 },
    { n: '은하수', lb: 13, pw: 1.04, hk: 1.1, $: 500 },
    { n: '용암', lb: 14, pw: 1.09, hk: 1.0, $: 750 },
    { n: '번개', lb: 14, pw: 1.07, hk: 1.3, $: 1000 },
    { n: '바다', lb: 15, pw: 1.11, hk: 1.15, $: 1300 },
    { n: '네온', lb: 15, pw: 1.13, hk: 1.25, $: 1700 },
    { n: '황금', lb: 16, pw: 1.17, hk: 1.2, $: 2200 },
    { n: '무지개', lb: 16, pw: 1.19, hk: 1.35, $: 2800 },
    { n: '우주', lb: 16, pw: 1.24, hk: 1.4, $: 3600 },
  ];
  const MISSIONS = [
    { id: 'x1', n: '첫 STRIKE', $: 50 },
    { id: 's1', n: '첫 SPARE', $: 50 },
    { id: 'x2', n: 'DOUBLE', $: 100 },
    { id: 'x3', n: 'TURKEY', $: 200 },
    { id: 'p100', n: '100점', $: 100 },
    { id: 'p150', n: '150점', $: 200 },
    { id: 'sp', n: '스플릿 처리', $: 300 },
    { id: 'p200', n: '200점', $: 400 },
    { id: 'clean', n: 'CLEAN GAME', $: 600 },
    { id: 'x5', n: '5-BAGGER', $: 600 },
    { id: 'p250', n: '250점', $: 800 },
    { id: 'p300', n: 'PERFECT 300', $: 3000 },
  ];

  // ---------- 저장 ----------
  const KEY = 'bowling.prog';
  const SV = (() => {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    return Object.assign({ stage: 1, coins: 0, owned: [0], ball: 0, ms: {}, best: 0, ended: false, match: null, games: 0 }, d || {});
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e) {} }

  // ---------- 점수 ----------
  function frameInfo(r) {
    let i = 0;
    for (let f = 0; f < 9; f++) {
      if (i >= r.length) return { f, ball: 0, fresh: true, up: 10 };
      if (r[i] === 10) { i++; continue; }
      if (i + 1 >= r.length) return { f, ball: 1, fresh: false, up: 10 - r[i] };
      i += 2;
    }
    const t = r.slice(i), n = t.length;
    if (n === 0) return { f: 9, ball: 0, fresh: true, up: 10 };
    if (n === 1) return t[0] === 10 ? { f: 9, ball: 1, fresh: true, up: 10 } : { f: 9, ball: 1, fresh: false, up: 10 - t[0] };
    if (n === 2) {
      if (t[0] === 10) return t[1] === 10 ? { f: 9, ball: 2, fresh: true, up: 10 } : { f: 9, ball: 2, fresh: false, up: 10 - t[1] };
      if (t[0] + t[1] === 10) return { f: 9, ball: 2, fresh: true, up: 10 };
    }
    return { f: 10, done: true };
  }
  function scoreSheet(r) {
    const out = [];
    let i = 0, cum = 0;
    for (let f = 0; f < 10; f++) {
      const fr = { m: [], c: null };
      out.push(fr);
      if (i >= r.length) continue;
      if (f < 9) {
        if (r[i] === 10) {
          fr.m = ['', 'X'];
          if (i + 2 < r.length) { cum += 10 + r[i + 1] + r[i + 2]; fr.c = cum; }
          i += 1;
        } else {
          const a = r[i], b = r[i + 1];
          fr.m = [a ? String(a) : '-', b == null ? '' : a + b === 10 ? '/' : b ? String(b) : '-'];
          if (b != null) {
            if (a + b === 10) { if (i + 2 < r.length) { cum += 10 + r[i + 2]; fr.c = cum; } }
            else { cum += a + b; fr.c = cum; }
          }
          i += 2;
        }
      } else {
        const t = r.slice(i);
        const mk = (v, prev, freshPrev) => (v === 10 && freshPrev ? 'X' : !freshPrev && prev + v === 10 ? '/' : v ? String(v) : '-');
        const m = [];
        if (t.length > 0) m.push(mk(t[0], 0, true));
        if (t.length > 1) m.push(mk(t[1], t[0], t[0] === 10));
        if (t.length > 2) {
          const fresh2 = (t[0] === 10 && t[1] === 10) || (t[0] !== 10 && t[0] + t[1] === 10);
          m.push(mk(t[2], t[1], fresh2));
        }
        fr.m = m;
        const need = t.length >= 2 && (t[0] === 10 || t[0] + t[1] === 10) ? 3 : 2;
        if (t.length >= need) { cum += t.reduce((s, v) => s + v, 0); fr.c = cum; }
      }
    }
    return out;
  }
  function total(r) {
    // 끝나지 않은 프레임도 지금까지 쓰러뜨린 만큼 더한 값 (진행 중 비교용)
    const sh = scoreSheet(r);
    let last = 0;
    for (const f of sh) if (f.c != null) last = f.c;
    return last;
  }

  // 스플릿: 1번이 쓰러지고 남은 핀이 서로 이어지지 않으면
  function isSplit(left) {
    if (left.length < 2 || left.indexOf(0) >= 0) return false;
    const S = PH.SPOTS, seen = new Set([left[0]]), st = [left[0]];
    while (st.length) {
      const a = st.pop();
      for (const b of left) if (!seen.has(b) && Math.hypot(S[a].x - S[b].x, S[a].z - S[b].z) < C.SP * 1.05) { seen.add(b); st.push(b); }
    }
    return seen.size < left.length;
  }

  // ---------- 상태 ----------
  const G = {
    mode: 'title', phase: 'idle', players: [], cur: 0, t: 0, pt: 0, paused: false,
    speed: 1, before: 10, info: null, streak: [0, 0], flags: {}, hint: 0, split: false,
  };
  window.G = G;

  const cv = $('#cv');
  AL.init(cv);
  addEventListener('resize', () => { AL.resize(); layoutBoard(); });

  // 스테이지 목표 점수: 1스테이지 50점 → 60스테이지 200점, 그 뒤로 조금씩 더
  function targetFor(stage) {
    if (stage > LAST) return Math.min(250, 200 + Math.floor((stage - LAST) / 3) * 5);
    const k = (stage - 1) / (LAST - 1);
    return Math.round((50 + 150 * Math.pow(k, 1.2)) / 5) * 5;
  }
  const themeFor = (stage) => Math.floor((stage - 1) / 12) % 5;

  // ---------- 화면 ----------
  function show(id, on) { $(id).hidden = !on; }
  function coinsUI() {
    $('#coins').textContent = SV.coins.toLocaleString();
  }
  function stageUI() {
    $('#stageN').textContent = G.mode === 'duo' ? G.np + 'P' : SV.stage;
    $('#goalN').textContent = targetFor(SV.stage);
    $('#goal').hidden = G.mode !== 'tour';
    $('#turnPill').hidden = G.mode !== 'duo';
    $('#tStage').textContent = 'STAGE ' + SV.stage;
  }
  let wordTimer = 0;
  function word(txt, cls) {
    const w = $('#word');
    w.className = '';
    w.textContent = L(txt);
    void w.offsetWidth;
    w.className = 'on ' + (cls || '');
    clearTimeout(wordTimer);
    wordTimer = setTimeout(() => { w.className = cls || ''; }, 1300);
  }
  function toast(txt) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = L(txt);
    $('#toasts').appendChild(d);
    setTimeout(() => d.remove(), 2600);
  }

  // 점수표
  function renderBoard() {
    const b = $('#board');
    b.innerHTML = '';
    G.players.forEach((p, pi) => {
      const row = document.createElement('div');
      row.className = 'row' + (pi === G.cur && G.phase !== 'over' ? ' now' : '');
      const sh = scoreSheet(p.rolls), info = frameInfo(p.rolls);
      let h = `<div class="who"><span class="em">${p.em}</span><span class="nm">${L(p.name)}</span></div>`;
      sh.forEach((f, fi) => {
        const cur = pi === G.cur && info.f === fi && !info.done ? ' cur' : '';
        const marks = (fi === 9 ? [0, 1, 2] : [0, 1]).map((k) => {
          const v = f.m[k] || '';
          return `<i class="${v === 'X' ? 'x' : v === '/' ? 's' : ''}">${v}</i>`;
        }).join('');
        h += `<div class="fr${fi === 9 ? ' ten' : ''}${cur}"><div class="mk">${marks}</div><b>${f.c == null ? '' : f.c}</b></div>`;
      });
      h += `<div class="tot">${total(p.rolls)}</div>`;
      row.innerHTML = h;
      b.appendChild(row);
    });
    layoutBoard();
  }
  // 남은 핀 점 (위가 뒷줄 7~10번)
  const PIN_ORDER = [6, 7, 8, 9, 3, 4, 5, 1, 2, 0];
  function pinMapUI() {
    const up = PH.standing();
    const dots = document.querySelectorAll('#pinmap i');
    PIN_ORDER.forEach((pi, k) => dots[k].classList.toggle('up', up.indexOf(pi) >= 0));
  }
  function layoutBoard() {
    const pm = $('#pinmap'), bd = $('#board');
    pm.style.top = bd.offsetTop + bd.offsetHeight + 8 + 'px';
    const b = $('#board');
    const w = Math.min(innerWidth - 12, 620);
    b.style.width = w + 'px';
  }

  // ---------- 경기 ----------
  const PCOL = ['🔴', '🔵', '🟢'];
  function newMatch(mode, np) {
    G.mode = mode;
    if (mode === 'duo') {
      G.np = np || G.np || 2;
      G.players = [];
      for (let i = 0; i < G.np; i++) G.players.push({ name: 'P' + (i + 1), em: PCOL[i], rolls: [], ball: SV.ball });
    } else {
      G.players = [{ name: '나', em: '🙂', rolls: [], ball: SV.ball }];
    }
    G.cur = 0;
    G.streak = G.players.map(() => 0);
    G.flags = { open: false, split: false };
    G.left = null;
    AL.setTheme(mode === 'duo' ? 1 : themeFor(SV.stage));
    stageUI();
  }
  function saveMatch() {
    if (G.mode !== 'tour') return;
    SV.match = { stage: SV.stage, players: G.players.map((p) => ({ rolls: p.rolls })), cur: G.cur, streak: G.streak, flags: G.flags, left: PH.standing() };
    save();
  }

  function startGame(mode, resume, np) {
    AU.unlock();
    newMatch(mode, np);
    if (resume && SV.match && SV.match.stage === SV.stage && SV.match.players.length === G.players.length) {
      const m = SV.match;
      m.players.forEach((p, i) => { G.players[i].rolls = p.rolls.slice(); });
      G.cur = m.cur; G.streak = m.streak || [0, 0]; G.flags = m.flags || {};
      G.left = m.left;
    }
    document.body.classList.add('playing');
    show('#title', false);
    show('#end', false);
    if (mode === 'tour') {
      $('#vsS').textContent = SV.stage === LAST ? 'FINAL' : 'STAGE ' + SV.stage;
      $('#vsT').textContent = targetFor(SV.stage);
      show('#vs', true);
      G.phase = 'vs';
      G.pt = 0;
    } else {
      startTurn(G.left);
      G.left = null;
    }
    renderBoard();
  }

  function startTurn(keep) {
    const p = G.players[G.cur];
    const info = frameInfo(p.rolls);
    G.info = info;
    PH.rack(info.fresh ? null : keep || null);
    G.before = PH.standing().length;
    pinMapUI();
    AL.setBall(p.ball);
    const S = PH.S;
    S.power = BALLS[p.ball].pw;
    S.ballMass = 6.5 * S.power;
    PH.newBall(0);
    G.bx = 0;
    G.phase = 'aim';
    G.pt = 0;
    G.speed = 1;
    G.tPit = -1;
    AL.ballVisible(true);
    renderBoard();
    $('#turn').textContent = p.em + ' ' + L(p.name);
  }

  // ---------- 굴리기 ----------
  function launch(sp, a, h) {
    PH.S.ball.x = G.bx;
    PH.launch(sp, a, h);
    G.phase = 'roll';
    G.pt = 0;
    AU.play('throw');
    $('#hand').hidden = true;
  }

  function afterRoll() {
    const p = G.players[G.cur], pi = G.cur;
    const left = PH.standing();
    pinMapUI();
    const knocked = Math.max(0, G.before - left.length);
    const info = G.info;
    p.rolls.push(knocked);
    const b = PH.S.ball;
    const now = frameInfo(p.rolls);
    const frameOver = now.done || now.f !== info.f;
    let w = '', cls = '';
    const human = true;
    if (info.fresh && knocked === 10) {
      G.streak[pi]++;
      const s = G.streak[pi];
      w = s === 2 ? 'DOUBLE!' : s === 3 ? 'TURKEY!' : s >= 4 ? s + '-BAGGER!' : 'STRIKE!';
      cls = 'strike';
      AU.play('strike');
      AL.shake(0.05);
      if (human) { mission('x1'); if (s >= 2) mission('x2'); if (s >= 3) mission('x3'); if (s >= 5) mission('x5'); }
      if (human && G.mode === 'tour') addCoins(5);
    } else if (!info.fresh && left.length === 0) {
      G.streak[pi] = 0;
      w = 'SPARE!'; cls = 'spare';
      AU.play('spare');
      if (human) { mission('s1'); if (G.split) mission('sp'); }
      if (human && G.mode === 'tour') addCoins(2);
    } else {
      G.streak[pi] = 0;
      if (b.gutter && knocked === 0) { w = 'GUTTER'; cls = 'gutter'; AU.play('aww'); }
      else if (info.fresh && isSplit(left)) { w = 'SPLIT'; cls = 'split'; AU.play('aww'); }
      else if (knocked === 0) { w = 'MISS'; cls = 'gutter'; AU.play('aww'); }
      else { w = String(knocked); AU.play(knocked >= 8 ? 'spare' : 'open'); }
      if (frameOver && human) G.flags.open = true;
    }
    G.split = info.fresh && isSplit(left);
    word(w, cls);
    if (human && G.mode === 'tour' && (p.rolls.length > 0)) {
      const s = total(p.rolls);
      if (now.done) scoreMissions(p.rolls, !G.flags.open);
      void s;
    }
    renderBoard();
    G.phase = 'result';
    G.pt = 0;
    G.frameOver = frameOver;
    G.keep = frameOver || now.fresh ? null : left;
    saveMatch();
  }

  function scoreMissions(r, clean) {
    const s = total(r);
    if (s >= 100) mission('p100');
    if (s >= 150) mission('p150');
    if (s >= 200) mission('p200');
    if (s >= 250) mission('p250');
    if (s >= 300) mission('p300');
    if (clean) mission('clean');
    if (s > SV.best) SV.best = s;
  }
  function mission(id) {
    if (SV.ms[id]) return;
    SV.ms[id] = 1;
    const m = MISSIONS.find((x) => x.id === id);
    addCoins(m.$);
    toast('✔ ' + m.n + '  🪙 +' + m.$);
    AU.play('coin');
    save();
  }
  function addCoins(n) {
    SV.coins += n;
    coinsUI();
    save();
  }

  function nextAfterResult() {
    const p = G.players[G.cur];
    const info = frameInfo(p.rolls);
    if (G.frameOver) {
      // 다음 사람
      const all = G.players.every((q) => frameInfo(q.rolls).done);
      if (all) return endMatch();
      let n = (G.cur + 1) % G.players.length;
      // 한 사람이 먼저 끝났으면 건너뛴다
      for (let k = 0; k < G.players.length && frameInfo(G.players[n].rolls).done; k++) n = (n + 1) % G.players.length;
      G.cur = n;
      G.sweepFresh = true;
    } else {
      G.sweepFresh = info.fresh;
    }
    G.phase = 'sweep';
    G.pt = 0;
    G.sweepKeep = G.sweepFresh ? null : PH.standing();
    AU.play('sweep');
  }

  function endMatch() {
    G.phase = 'over';
    renderBoard();
    const scores = G.players.map((p) => total(p.rolls));
    const a = scores[0];
    const goal = targetFor(SV.stage);
    const card = $('#end');
    let title, sub = '', coins = 0, win = false;
    if (G.mode === 'duo') {
      const top = Math.max(...scores);
      const winners = scores.map((v, i) => (v === top ? i : -1)).filter((i) => i >= 0);
      title = winners.length > 1 ? '무승부' : 'P' + (winners[0] + 1) + ' WIN';
      AU.play('win');
    } else {
      SV.games++;
      win = a >= goal;
      title = win ? 'CLEAR' : 'GAME OVER';
      coins = Math.round(a / 4) + (win ? 40 + Math.min(SV.stage, LAST) * 4 : 0);
      addCoins(coins);
      scoreMissions(G.players[0].rolls, !G.flags.open);
      AU.play(win ? 'win' : 'lose');
      SV.match = null;
      if (win) {
        if (SV.stage === LAST && !SV.ended) { SV.ended = true; G.ending = true; }
        SV.stage++;
      }
      save();
    }
    $('#eTitle').textContent = L(title);
    $('#eTitle').className = win || G.mode === 'duo' ? 'win' : 'lose';
    $('#eScore').innerHTML = G.mode === 'tour'
      ? `<span><b>${a}</b></span><i>/</i><span>🎯 <b>${goal}</b></span>`
      : G.players.map((p) => `<span>${p.em} <b>${total(p.rolls)}</b></span>`).join('<i>:</i>');
    $('#eCoins').textContent = coins ? '🪙 +' + coins : '';
    $('#eNext').hidden = !(G.mode === 'tour' && win);
    $('#eRetry').hidden = G.mode === 'tour' && win;
    setTimeout(() => {
      if (G.ending) { G.ending = false; showEnding(); return; }
      show('#end', true);
    }, 1500);
    coinsUI();
    stageUI();
  }

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
    AU.play('win');
    setTimeout(() => AU.play('strike'), 900);
  }

  function goTitle() {
    G.mode = 'title';
    G.phase = 'idle';
    document.body.classList.remove('playing');
    show('#end', false); show('#vs', false); show('#ending', false); show('#pauseCover', false);
    G.paused = false; AU.paused = false;
    show('#title', true);
    $('#board').innerHTML = '';
    PH.rack();
    PH.newBall(0);
    AL.setTheme(themeFor(SV.stage));
    AL.setBall(SV.ball);
    $('#bContinue').hidden = !(SV.match && SV.match.stage === SV.stage);
    stageUI();
    coinsUI();
  }

  // ---------- 입력 ----------
  let ptr = null;
  function ballScreenX() { return AL.project(G.bx, C.R_B, PH.S.ball.z); }
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    if (G.phase !== 'aim' || G.paused) return;
    ptr = { id: e.pointerId, x0: e.clientX, y0: e.clientY, bx0: G.bx, pts: [{ x: e.clientX, y: e.clientY, t: performance.now() }], flick: -1, low: e.clientY };
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener('pointermove', (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const t = performance.now();
    ptr.pts.push({ x: e.clientX, y: e.clientY, t });
    if (ptr.flick < 0) {
      if (e.clientY > ptr.low) ptr.low = e.clientY;
      if (ptr.low - e.clientY > Math.max(14, innerHeight * 0.02)) {
        // 위로 밀기 시작 → 자리 고정
        let k = ptr.pts.length - 1;
        while (k > 0 && ptr.pts[k - 1].y >= ptr.pts[k].y - 0.5 && ptr.pts[k - 1].y <= ptr.low + 0.5) k--;
        ptr.flick = Math.max(0, k - 1);
      } else {
        // 옆으로 끌어 자리 잡기
        const scale = 1.3 / Math.min(innerWidth, innerHeight * 0.9);
        G.bx = Math.max(-0.44, Math.min(0.44, ptr.bx0 + (e.clientX - ptr.x0) * scale));
        PH.S.ball.x = G.bx;
      }
    }
  });
  function endPtr(e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = ptr;
    ptr = null;
    if (G.phase !== 'aim' || p.flick < 0) return;
    const pts = p.pts.slice(p.flick);
    const last = pts[pts.length - 1];
    // 마지막 0.2초로 속도
    let j = pts.length - 1;
    while (j > 0 && last.t - pts[j - 1].t < 200) j--;
    const q = pts[j];
    const dt = Math.max(16, last.t - q.t);
    let vy = (q.y - last.y) / dt / innerHeight; // 화면 높이/ms
    // 천천히 밀어도 크게 밀었으면 약하게 굴린다
    if (vy < 0.0006) {
      if ((pts[0].y - last.y) / innerHeight < 0.2) return;
      vy = 0.0006;
    }
    const sp = Math.max(5, Math.min(10.5, 4.2 + vy * 1250));
    const f = pts[0];
    const ang = Math.atan2(last.x - f.x, f.y - last.y);
    const a = Math.max(-0.08, Math.min(0.08, ang * 0.08));
    // 휘어 밀면 훅
    const mid = pts[Math.floor(pts.length / 2)];
    const a1 = Math.atan2(mid.x - f.x, f.y - mid.y + 0.001), a2 = Math.atan2(last.x - mid.x, mid.y - last.y + 0.001);
    let bend = a2 - a1;
    if (Math.abs(bend) < 0.07) bend = 0;
    const h = Math.max(-1.3, Math.min(1.3, bend * 2.4)) * BALLS[G.players[G.cur].ball].hk;
    launch(sp, a, h);
  }
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', (e) => { if (ptr && e.pointerId === ptr.id) ptr = null; });

  const keys = {};
  addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Escape' || e.code === 'KeyP') { if (G.mode !== 'title') togglePause(); }
    if (e.code === 'KeyM') $('#tBgm').click();
    if (e.code === 'KeyK') $('#tSnd').click();
    if (G.phase === 'aim' && !G.paused && (e.code === 'Space' || e.code === 'ArrowUp')) {
      e.preventDefault();
      AU.unlock();
      const h = keys.KeyA ? -0.8 : keys.KeyD ? 0.8 : 0;
      launch(8, 0, h * BALLS[G.players[G.cur].ball].hk);
    }
    if (e.code === 'Space' && G.phase === 'vs') { e.preventDefault(); $('#vs').click(); }
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });

  function togglePause(v) {
    G.paused = v == null ? !G.paused : v;
    AU.paused = G.paused;
    show('#pauseCover', G.paused);
    if (G.paused) AU.roll(0);
  }

  // ---------- 매 프레임 ----------
  let acc = 0, lastT = 0;
  const tall = () => innerWidth / innerHeight < 0.75;
  const wide = () => innerWidth / innerHeight >= 1.4;
  const CAM_AIM = () => (tall() ? [G.bx * 0.6, 1.2, 3.35] : wide() ? [G.bx * 0.5, 1.45, 4.6] : [G.bx * 0.5, 1.15, 3.2]);
  const LOOK_AIM = () => (tall() ? [G.bx * 0.3, -0.1, -16] : wide() ? [G.bx * 0.2, -1.05, -14] : [G.bx * 0.2, -0.4, -10]);
  function update(dt) {
    if (G.paused) return;
    G.t += dt;
    G.pt += dt;
    const b = PH.S.ball;
    // 제목 화면: 천천히 도는 카메라
    if (G.mode === 'title') {
      const s = Math.sin(G.t * 0.15);
      if (innerWidth / innerHeight < 0.75) AL.camTo([s * 0.5, 0.42 + 0.05 * Math.sin(G.t * 0.2), -13.6 + s * 0.4], [0, 0.3, -18.4]);
      else AL.camTo([s * 0.9, 0.75 + 0.1 * Math.sin(G.t * 0.2), -12.2 + s * 0.5], [0, 0.25, -18.4]);
      AL.camStep(dt, 2);
      return;
    }
    if (G.phase === 'vs') {
      AL.camTo([0, 0.8, -13.8], [0, 0.2, -18.4], G.pt < dt * 1.5);
      AL.camStep(dt, 2);
      if (G.pt > 2.2) { show('#vs', false); startTurn(G.left); G.left = null; }
      return;
    }
    if (G.phase === 'aim') {
      if (keys.ArrowLeft) G.bx = Math.max(-0.44, G.bx - dt * 0.6);
      if (keys.ArrowRight) G.bx = Math.min(0.44, G.bx + dt * 0.6);
      b.x = G.bx;
      // 처음 몇 번은 손가락 그림으로 밀기를 보여 준다
      const hand = $('#hand');
      const need = SV.games === 0 && (G.hint || 0) < 3 && G.pt > 1.2;
      hand.hidden = !need;
      if (need) { const [x, y] = ballScreenX(); hand.style.left = x + 'px'; hand.style.top = y + 'px'; }
      AL.camTo(CAM_AIM(), LOOK_AIM(), G.pt < dt * 1.5 && G.snapCam);
      G.snapCam = false;
      AL.camStep(dt, 4);
      return;
    }
    if (G.phase === 'roll' || G.phase === 'result') {
      acc += dt * G.speed;
      let n = 0;
      while (acc >= PH.DT && n < 60) { PH.step(); acc -= PH.DT; n++; }
      if (acc > PH.DT) acc = 0;
      // 소리·흔들림
      const ev = PH.S.events;
      for (const e of ev) {
        if (e.t === 'hit') { AU.hit(e.v, e.ball); if (e.ball) AL.shake(Math.min(0.03, e.v * 0.002)); }
        else if (e.t === 'clack') AU.hit(e.v * 0.5);
        else if (e.t === 'gutter') AU.play('gutter');
        else if (e.t === 'wall') AU.play('wall');
        else if (e.t === 'pit') { AU.play('pit'); }
      }
      ev.length = 0;
      const moving = b.st === 'roll' || b.st === 'gutter';
      AU.roll(moving ? Math.hypot(b.vx, b.vz) : 0, b.st === 'gutter');
      if (b.z > -11.5 && moving) {
        AL.camTo([b.x * 0.6, 0.62, b.z + 2.0], [b.x * 0.5, 0.05, b.z - 9], G.pt < 0.02);
        AL.camStep(dt, 6);
      } else {
        AL.camTo([0, 0.95, -14.7], [0, 0.08, -18.7]);
        AL.camStep(dt, 2.4);
      }
      if (G.phase === 'roll') {
        if ((b.st === 'pit' || b.st === 'stop') && G.tPit < 0) G.tPit = G.pt;
        const since = G.tPit < 0 ? 0 : G.pt - G.tPit;
        if ((G.tPit >= 0 && since > 0.9 && PH.calm()) || since > 3.6 || G.pt > 14) afterRoll();
      } else if (G.pt > 1.5) {
        nextAfterResult();
      }
      return;
    }
    if (G.phase === 'sweep') {
      AU.roll(0);
      const t = G.pt, pins = PH.S.pins;
      AL.ballVisible(false);
      // 막대 내려오기 → 쓰러진 핀 치우기 → 막대 올리기 → 새로 세우기
      const barY = t < 0.35 ? 1.3 - (t / 0.35) * 1.16 : t < 0.9 ? 0.14 : t < 1.25 ? 0.14 + ((t - 0.9) / 0.35) * 1.16 : 1.3;
      AL.setSweep(barY);
      const keep = G.sweepKeep;
      if (t < 0.9) {
        for (const p of pins) {
          if (!p.alive) continue;
          const up = keep && keep.indexOf(p.i) >= 0;
          if (up) { p.lift = Math.min(0.55, Math.max(0, (t - 0.1) * 1.4)); p.tx = p.ty = p.tz = 0; p.wx = p.wz = 0; }
          else if (t > 0.35) {
            // 막대에 밀려 뒤로
            if (p.st === 0) PH.topple(p);
            p.cz -= dt * 3.2; p.cx *= 0.98; p.vx = p.vz = 0; p.vy = 0;
            if (p.cz < C.DECK_END - 0.1) p.gone = true;
          }
        }
      }
      if (t > 0.9 && !G.racked) {
        G.racked = true;
        for (const p of pins) p.gone = false;
        PH.rack(keep);
        for (const p of PH.S.pins) p.lift = 0.55;
      }
      if (t > 1.25) {
        const k = Math.min(1, (t - 1.25) / 0.45);
        for (const p of PH.S.pins) p.lift = 0.55 * (1 - k * k);
      }
      AL.camTo([0, 0.95, -14.7], [0, 0.08, -18.7]);
      AL.camStep(dt, 2);
      if (t > 1.8) {
        G.racked = false;
        for (const p of PH.S.pins) p.lift = 0;
        G.hint = (G.hint || 0) + 1;
        G.snapCam = false;
        startTurn(keep);
      }
      return;
    }
    if (G.phase === 'over') {
      AL.camTo([0, 0.95, -14.7], [0, 0.08, -18.7]);
      AL.camStep(dt, 2);
    }
  }

  function frame(ts) {
    const dt = Math.min(0.05, lastT ? (ts - lastT) / 1000 : 0.016);
    lastT = ts;
    update(dt);
    AL.sync(dt);
    AL.render(dt);
  }
  function loop(ts) {
    frame(ts);
    requestAnimationFrame(loop);
  }

  // ---------- 단추 ----------
  const tap = (id, fn) => $(id).addEventListener('click', (e) => { AU.unlock(); AU.play('tap'); fn(e); });
  tap('#bStart', () => { SV.match = null; startGame('tour'); });
  tap('#bContinue', () => startGame('tour', true));
  tap('#bDuo', () => startGame('duo', false, 2));
  tap('#bTrio', () => startGame('duo', false, 3));
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

  // 상점
  function dots(v, lo, hi) {
    const n = Math.max(1, Math.min(5, Math.round(1 + ((v - lo) / (hi - lo)) * 4)));
    return '●'.repeat(n) + '<span>' + '●'.repeat(5 - n) + '</span>';
  }
  const thumbs = {};
  function openShop() {
    const g = $('#shopGrid');
    g.innerHTML = '';
    $('#shopCoins').textContent = SV.coins.toLocaleString();
    BALLS.forEach((b, i) => {
      const own = SV.owned.indexOf(i) >= 0;
      const d = document.createElement('div');
      d.className = 'card' + (SV.ball === i ? ' on' : '') + (own ? '' : ' lock');
      const th = thumbs[i] || (thumbs[i] = AL.ballThumb(i, 128).toDataURL());
      d.innerHTML = `<img src="${th}" alt=""><div class="bn">${L(b.n)}</div><div class="lb">${b.lb} lb</div>
        <div class="st"><em>${L('파워')}</em>${dots(b.pw, 0.94, 1.24)}</div><div class="st"><em>${L('훅')}</em>${dots(b.hk, 0.85, 1.4)}</div>
        <button>${SV.ball === i ? L('사용 중') : own ? L('장착') : '🪙 ' + b.$.toLocaleString()}</button>`;
      const btn = d.querySelector('button');
      if (!own && SV.coins < b.$) btn.disabled = true;
      btn.addEventListener('click', () => {
        if (!own) {
          if (SV.coins < b.$) { AU.play('no'); return; }
          SV.coins -= b.$;
          SV.owned.push(i);
          AU.play('buy');
        } else AU.play('tap');
        SV.ball = i;
        if (G.mode !== 'title') G.players.forEach((p) => { p.ball = i; });
        AL.setBall(i);
        save();
        coinsUI();
        openShop();
      });
      g.appendChild(d);
    });
    show('#shop', true);
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
    $('#misBest').textContent = SV.best;
    show('#missions', true);
  }

  // ---------- 시작 ----------
  togUI();
  goTitle();
  AL.camTo([0, 0.8, -12], [0, 0.25, -18.4], true);
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode !== 'title' && !G.paused) togglePause(true); });
  setTimeout(() => $('#loading').remove(), 50);

  // 시험용 손잡이
  window.__bw = {
    G, SV, PH, AL, targetFor, frameInfo, scoreSheet, total, isSplit,
    tick(n, dt, noDraw) { for (let i = 0; i < (n || 1); i++) { lastT = 0; update(dt || 1 / 60); AL.sync(dt || 1 / 60); } if (!noDraw) AL.render(1 / 60); },
    fling(sp, a, h) { if (G.phase === 'aim') launch(sp, a, h); },
    shot(name) {
      AL.render(0.016);
      const url = cv.toDataURL('image/png');
      return fetch('/save?name=' + (name || 'shot.png'), { method: 'POST', body: url }).then((r) => r.text());
    },
  };
})();
