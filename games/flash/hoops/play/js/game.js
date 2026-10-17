// 판 흐름·조작·화면. 시험 손잡이 window.__H = { G, S, tick, startStage, throwAt, ... }
(function () {
  const P = PHY, $ = (id) => document.getElementById(id);
  const NB = 6;                       // 공 개수
  const G = { phase: 'title', stage: 1, st: null, score: 0, left: 40, tt: 0, streak: 0, fire: false, held: null, grab: 0, lastThrow: 0,
    shots: 0, makes: 0, overT: 0, bonusShown: false, lastSec: 99, demoT: 0, paused: false };
  // 저장: 열린 판, 판별 최고 점수·별, 설명 봤는지, 누적 기록
  const S = { stage: 1, best: [], stars: [], how: 0, shots: 0, makes: 0, bestStreak: 0, tickets: 0, ms: 0, loop: 0 };
  try { Object.assign(S, JSON.parse(localStorage.getItem('hoops.save') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('hoops.save', JSON.stringify(S)); } catch (e) {} };

  // ── 화면 글
  function pop(t, cls, y) {
    const d = document.createElement('div');
    d.className = 'pop ' + (cls || ''); d.textContent = t; d.style.top = (y || 38) + '%';
    $('pops').appendChild(d); setTimeout(() => d.remove(), 1050);
  }
  function show(id, on) { $(id).hidden = !on; }
  function hud() {
    $('hStage').textContent = G.stage;
    $('hScore').textContent = G.score;
    $('hGoal').textContent = G.st ? G.st.goal : 0;
    const tv = Math.max(0, Math.ceil(G.left));
    $('hTime').textContent = String(tv).padStart(2, '0');
    $('hTime').classList.toggle('yl', G.left <= 10);
    $('hScore').classList.toggle('yl', G.st && G.score >= G.st.goal);
    $('fireB').hidden = !G.fire;
    RND.setBoard(G.score, Math.max(0, G.left), G.st ? G.st.goal : 0);
  }
  function setTogs() {
    $('bBgm').classList.toggle('off', !AU.bgm);
    $('bSnd').classList.toggle('off', !AU.snd);
  }

  // ── 판 준비
  function placeHoop() {
    const h = STG.hoopAt(G.st, G.tt, G.left), H = P.hoop;
    H.vx = 0; H.vy = 0; H.vz = 0;
    H.x = h.x; H.y = h.y; H.z = h.z;
  }
  function startStage(n) {
    G.stage = n; G.st = STG.get(n);
    G.score = 0; G.left = STG.TIME; G.tt = 0; G.streak = 0; G.fire = false; G.held = null; G.grab = 0;
    G.shots = 0; G.makes = 0; G.bonusShown = false; G.lastSec = 99; G.overT = 0; G.runStreak = 0; G.paused = false;
    placeHoop();
    P.reset(NB);
    RND.build();
    RND.setMode('play');
    document.body.classList.add('playing');
    ['title', 'map', 'res', 'pause', 'end'].forEach((i) => show(i, false));
    show('hud', true);
    hud();
    G.phase = 'ready'; G.readyT = 2.2;
    show('ready', true); $('ready').textContent = 'STAGE ' + n;
    AU.play('click');
  }
  function toTitle() {
    G.phase = 'title';
    ['map', 'res', 'pause', 'end', 'hud', 'ready'].forEach((i) => show(i, false));
    show('title', true);
    document.body.classList.remove('playing');
    G.st = STG.get(Math.min(S.stage, STG.N)); G.left = 40; G.tt = 0;
    placeHoop(); P.reset(NB); RND.build(); RND.setMode('title'); RND.setBoard(0, 40, G.st.goal);
    $('bStart').firstChild.textContent = S.stage > 1 ? 'CONTINUE' : 'START';
  }

  // ── 공 집기: 통에 굴러온 공을 손 앞으로
  const canThrow = () => G.phase === 'play' || G.phase === 'ready' || G.phase === 'title';
  function grabNext(dt) {
    if (G.held) {
      const b = G.held;
      G.grab = Math.min(1, G.grab + dt / 0.16);
      const k = G.grab * G.grab * (3 - 2 * G.grab);
      const hx = P.REL.x + (drag ? drag.ox : 0), hy = P.REL.y + (drag ? drag.oy : 0) + Math.sin(performance.now() * 0.004) * 0.006, hz = P.REL.z;
      b.p.x = b.g0.x + (hx - b.g0.x) * k; b.p.y = b.g0.y + (hy - b.g0.y) * k; b.p.z = b.g0.z + (hz - b.g0.z) * k;
      b.v.x = b.v.y = b.v.z = 0;
      return;
    }
    if (!canThrow() || G.clock - G.lastThrow < 0.14) return;
    const b = P.pickable();
    if (!b) return;
    b.state = 'held'; b.g0 = { x: b.p.x, y: b.p.y, z: b.p.z }; b.fire = false;
    G.held = b; G.grab = 0;
  }

  // ── 던지기: 튕긴 길이 → 세기, 튕긴 기울기 → 방향. 판마다 손 보정(keep)이 줄어든다.
  function throwBall(L, dxn, demo) {
    const b = G.held; if (!b) return;
    const st0 = G.st || STG.get(1);
    const id = aimFor(st0, G.tt, G.left);
    const vRaw = Math.max(3, Math.min(11.5, 2.4 + 12 * L));
    const yawRaw = Math.atan2(dxn, Math.max(0.02, L)) * 0.42;
    const st = st0;
    const v = id.v + (vRaw - id.v) * st.keepV;
    const yaw = id.yaw + (yawRaw - id.yaw) * st.keepA;
    P.launch(b, v, yaw, 10 + L * 20);
    b.fire = G.fire && !demo; b.bonus = G.left <= 10;
    G.held = null; G.lastThrow = G.clock;
    if (!demo) { G.shots++; AU.play('throw'); }
    G.lastV = { v, yaw, vRaw, yawRaw, iv: id.v, iyaw: id.yaw };
  }

  // 공이 닿을 때 골대가 있을 자리를 노리는 정답(살짝 림 안쪽 깊게). 보정은 이 정답 쪽으로 손가락 실수를 덜어 준다.
  function aimFor(st, tt, left) {
    let h = STG.hoopAt(st, tt, left), id = P.ideal(h.x, h.y, h.z - 0.03);
    for (let i = 0; i < 2; i++) {
      const T = id.X / (id.v * Math.cos(P.ELEV));
      h = STG.hoopAt(st, tt + T, left - T); id = P.ideal(h.x, h.y, h.z - 0.03);
    }
    return id;
  }

  // ── 조작: 공을 위로 튕긴다(손가락·마우스 끌기)
  const cv = $('cv');
  let drag = null;
  // 튕긴 길이의 기준: 화면 긴 변(폰을 세로로 들든 가로로 들든 손가락이 움직인 실제 길이가 같게), PC 는 900px 까지만
  const swipeRef = () => Math.min(Math.max(innerWidth, innerHeight), 900);
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    if (!(G.phase === 'play' || G.phase === 'ready') || G.paused) return;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, ox: 0, oy: 0, t0: performance.now() };
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.x = e.clientX; drag.y = e.clientY;
    const h = swipeRef();
    const L = (drag.y0 - drag.y) / h, dx = (drag.x - drag.x0) / h;
    drag.ox = Math.max(-0.25, Math.min(0.25, dx * 0.5));
    drag.oy = Math.max(-0.08, Math.min(0.22, L * 0.45));
  });
  function endDrag(e) {
    if (!drag) return;
    const d = drag; drag = null;
    if (e && e.clientX != null) { d.x = e.clientX; d.y = e.clientY; }
    const h = swipeRef(), L = (d.y0 - d.y) / h, dx = (d.x - d.x0) / h;
    if (G.phase !== 'play' || !G.held || G.grab < 0.6 || L < 0.06) return;
    throwBall(L, dx);
  }
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', () => { drag = null; });

  // ── 일어난 일 처리(소리·점수)
  function events() {
    for (const e of P.events) {
      const b = e.b;
      switch (e.type) {
        case 'rim': AU.play('rim', e.k / 3); break;
        case 'board': AU.play('board', e.k / 4); break;
        case 'floor': AU.play('floor', e.k / 4); break;
        case 'bb': AU.play('bb', e.k / 3); break;
        case 'net': AU.play('net', e.k / 3); if (b && b.netKick) { b.netKick = 0; RND.netHit(1); } break;
        case 'lip': AU.play('lip', e.k / 3); break;
        case 'score': onScore(b, e.k); break;
        case 'miss': onMiss(b); break;
      }
    }
    P.events.length = 0;
  }
  function onScore(b, touches) {
    const H = P.hoop;
    RND.swish(touches === 0 ? 1 : 0.7);
    AU.play('swish');
    if (G.phase === 'demo' || G.phase === 'title') { RND.flashBoard(0.6); return; }
    if (!(G.phase === 'play' || G.phase === 'over')) return;
    const bonus = G.left <= 10 || b.bonus;
    let pts = bonus ? 3 : 2;
    const sw = touches === 0;
    if (sw) pts += 1;
    if (b.fire) pts *= 2;
    G.score += pts; G.makes++; G.streak++;
    S.bestStreak = Math.max(S.bestStreak, G.streak);
    let txt = sw ? 'SWISH' : 'NICE', cls = sw ? 'cyan' : '';
    if (G.streak === 3 && !G.fire) { G.fire = true; setTimeout(() => { pop('ON FIRE', 'fire', 30); AU.play('fire'); }, 380); }
    if (b.fire) cls = 'fire';
    pop(txt + ' +' + pts, cls, 40);
    AU.play(bonus || b.fire ? 'bonus' : 'score');
    RND.burst(H.x, H.y - 0.1, H.z + 0.1, b.fire || sw);
    RND.flashBoard(1, b.fire ? 0xff6a10 : sw ? 0x2ef2ff : 0xffd23a);
    RND.shake(sw ? 0.012 : 0.006);
    hud();
  }
  function onMiss(b) {
    if (G.phase !== 'play' && G.phase !== 'over') return;
    G.streak = 0;
    if (G.fire) { G.fire = false; hud(); }
  }

  // ── 판 끝
  function finish() {
    G.phase = 'result'; G.fire = false; hud();
    const ok = G.score >= G.st.goal, n = G.stage;
    S.shots += G.shots; S.makes += G.makes;
    const stars = ok ? STG.stars(G.score, G.st.goal) : 0;
    let newBest = false;
    if (ok) {
      if ((S.best[n - 1] || 0) < G.score) { S.best[n - 1] = G.score; newBest = true; }
      S.stars[n - 1] = Math.max(S.stars[n - 1] || 0, stars);
      if (S.stage <= n) S.stage = n + 1;
    }
    const tickets = ok ? Math.round(G.score / 2) + stars * 5 : 0;
    S.tickets += tickets;
    save();
    $('resBig').textContent = ok ? 'CLEAR' : 'GAME OVER';
    $('resBig').className = 'big ' + (ok ? 'ok' : 'ng');
    $('resScore').textContent = G.score + ' / ' + G.st.goal;
    $('resSub').textContent = ok ? (newBest ? 'NEW RECORD' : 'BEST ' + (S.best[n - 1] || 0)) : '';
    const sv = $('stars'); sv.innerHTML = '';
    if (ok) for (let i = 0; i < 3; i++) {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 50 50'); s.setAttribute('class', 'star' + (i < stars ? ' got' : ''));
      s.innerHTML = '<path d="M25 3l6.5 14 15.3 1.7-11.4 10.4 3.2 15.1L25 36.5 11.4 44.2l3.2-15.1L3.2 18.7 18.5 17z"/>';
      sv.appendChild(s);
      setTimeout(() => { s.classList.add('on'); if (i < stars) AU.play('star', i); }, 450 + i * 320);
    }
    const tk = $('ticket'); tk.innerHTML = '';
    const btns = $('resBtns'); btns.innerHTML = '';
    const mk = (t, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.innerHTML = '<span>' + t + '</span>'; b.onclick = () => { AU.play('click'); fn(); }; btns.appendChild(b); return b; };
    if (ok) {
      if (n >= STG.N) mk('NEXT', '', () => openEnd());
      else mk('NEXT', '', () => startStage(n + 1));
      mk('RETRY', 'glass sm', () => startStage(n));
      mk('STAGE', 'glass sm', () => openMap());
      // 표가 기계에서 줄줄
      if (tickets > 0) {
        const d = document.createElement('div'); d.className = 'tk'; tk.appendChild(d);
        let c = 0; const iv = setInterval(() => { c = Math.min(tickets, c + 1); d.textContent = 'TICKET x ' + c; AU.play('ticket'); if (c >= tickets) clearInterval(iv); }, 45);
        d.textContent = 'TICKET x 0';
      }
      AU.play('clear');
    } else {
      mk('RETRY', '', () => startStage(n));
      mk('STAGE', 'glass sm', () => openMap());
      AU.play('fail');
    }
    show('hud', true);
    setTimeout(() => show('res', true), 300);
  }

  // ── 판 고르기
  function openMap() {
    G.phase = G.phase === 'title' ? 'title' : 'map';
    const gd = $('grid'); gd.innerHTML = '';
    for (let i = 1; i <= STG.N; i++) {
      const b = document.createElement('button');
      const open = i <= S.stage, st = S.stars[i - 1] || 0;
      b.className = 'tile' + (open ? '' : ' lock') + (i === S.stage && i <= STG.N ? ' next' : '');
      b.innerHTML = open ? i + '<span class="st">' + '★'.repeat(st) + '☆'.repeat(3 - st) + '</span><span class="sc">' + (S.best[i - 1] ? S.best[i - 1] : '--') + '</span>' : '<i></i>';
      if (open) b.onclick = () => { AU.play('click'); startStage(i); };
      gd.appendChild(b);
    }
    ['res', 'pause'].forEach((i) => show(i, false));
    show('map', true);
  }
  $('mapX').onclick = () => { AU.play('click'); show('map', false); if (G.phase !== 'title') toTitle(); };

  // ── 엔딩
  function openEnd() {
    G.phase = 'end';
    show('res', false); show('hud', false);
    RND.setMode('title');
    RND.setBoard(G.score, 0, G.st ? G.st.goal : 0);
    const tot = S.stars.reduce((a, b) => a + (b || 0), 0);
    const acc = S.shots ? Math.round(S.makes / S.shots * 100) : 0;
    $('endTxt').innerHTML = L('마지막 골대까지 넘겼다<br>오늘부터 이 오락실 1등은 나다<br><br>', 'You beat the last hoop<br>From today, this arcade is yours<br><br>') +
      'STAR ' + tot + ' / ' + STG.N * 3 + '<br>' + L('성공률 ', 'ACCURACY ') + acc + '%<br>' + L('최고 연속 골 ', 'BEST STREAK ') + S.bestStreak + '<br>TICKET ' + S.tickets;
    show('end', true);
    AU.play('champ');
    for (let i = 0; i < 4; i++) setTimeout(() => RND.burst((Math.random() - 0.5) * 0.8, 2.6, P.hoop.z + 0.4, true), i * 350);
    if (window.CARD) CARD.make({ S, tot, acc, cv }).then((url) => { if (url) $('cardImg').src = url; });
  }
  $('endOk').onclick = () => { AU.play('click'); S.loop = (S.loop || 0) + 1; save(); toTitle(); };
  $('cSave').onclick = () => { AU.play('click'); if (window.CARD) CARD.save(); };
  $('cShare').onclick = () => { AU.play('click'); if (window.CARD) CARD.share(); };

  // ── 일시정지·설명·소리
  $('bPause').onclick = () => { if (G.phase !== 'play' && G.phase !== 'ready') return; AU.play('click'); G.paused = true; show('pause', true); };
  $('pResume').onclick = () => { AU.play('click'); G.paused = false; show('pause', false); };
  $('pRetry').onclick = () => { AU.play('click'); startStage(G.stage); };
  $('pStages').onclick = () => { AU.play('click'); G.paused = false; show('pause', false); openMap(); };
  $('bBgm').onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); setTogs(); };
  $('bSnd').onclick = () => { AU.unlock(); AU.setSnd(!AU.snd); setTogs(); AU.play('click'); };
  $('bHow').onclick = () => { AU.play('click'); if (G.phase === 'play' || G.phase === 'ready') G.paused = true; HOW.open(() => { G.paused = false; }); };
  function begin(n) {
    if (!S.how) { HOW.open(() => { S.how = 1; save(); startStage(n); }); return; }
    startStage(n);
  }
  $('bStart').onclick = () => { AU.unlock(); AU.play('click'); begin(Math.min(S.stage, STG.N)); };
  $('bStages').onclick = () => { AU.unlock(); AU.play('click'); openMap(); };

  // ── 한 프레임
  let lastT = 0;
  function tick(dt) {
    dt = Math.min(dt, 1 / 30);
    G.clock = (G.clock || 0) + dt;
    if (!G.paused) {
      // 골대 움직임(속도는 앞뒤 차이로)
      if (G.st && (G.phase === 'play' || G.phase === 'over' || G.phase === 'demo' || G.phase === 'title')) {
        if (G.phase === 'play' || G.phase === 'demo' || G.phase === 'title') G.tt += dt;
        const h = STG.hoopAt(G.st, G.tt, G.phase === 'title' || G.phase === 'demo' ? 40 : G.left), H = P.hoop;
        H.vx = (h.x - H.x) / dt; H.vy = (h.y - H.y) / dt; H.vz = 0;
        H.x = h.x; H.y = h.y; H.z = h.z;
      } else { P.hoop.vx = P.hoop.vy = 0; }
      if (G.phase === 'ready') {
        const before = G.readyT; G.readyT -= dt;
        if (before > 0.9 && G.readyT <= 0.9) { $('ready').textContent = 'GO!'; AU.play('bonus'); }
        if (G.readyT <= 0) { G.phase = 'play'; show('ready', false); }
      } else if (G.phase === 'play') {
        G.left -= dt; S.ms += dt * 1000;
        if (!G.bonusShown && G.left <= 10) { G.bonusShown = true; pop('BONUS TIME', 'fire', 30); AU.play('fire'); RND.flashBoard(1, 0xff3fa4); }
        const sec = Math.ceil(G.left);
        if (sec !== G.lastSec) { G.lastSec = sec; if (sec <= 5 && sec > 0) AU.play('tick'); }
        if (G.left <= 0) {
          G.left = 0; G.phase = 'over'; G.overT = 0; AU.play('end');
          pop('TIME UP', '', 36);
          if (G.held) { G.held.state = 'rest'; G.held = null; }
        }
        hud();
      } else if (G.phase === 'over') {
        G.overT += dt;
        const flying = P.balls.some((b) => b.live);
        if ((!flying && G.overT > 1.2) || G.overT > 3.5) finish();
      } else if (G.phase === 'title') {
        demo(dt);
      }
      grabNext(dt);
      P.step(dt);
      events();
      for (const b of P.balls) if (b.fire && b.state === 'fly') RND.flame(b);
    }
    if (!G.norender) RND.frame(dt);
  }
  // 타이틀: 혼자 던지는 시범(가끔 빗나감)
  function demo(dt) {
    G.demoT -= dt;
    if (G.demoT > 0 || !G.held || G.grab < 1) return;
    G.demoT = 1.0 + Math.random() * 0.5;
    const H = P.hoop, id = P.ideal(H.x, H.y, H.z);
    const miss = Math.random() < 0.3;
    const e = miss ? (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.2) : (Math.random() - 0.5) * 0.08;
    const b = G.held;
    P.launch(b, id.v + e, id.yaw + (Math.random() - 0.5) * 0.02, 18);
    G.held = null; G.lastThrow = G.clock;
  }
  function loop(t) {
    const dt = lastT ? (t - lastT) / 1000 : 1 / 60; lastT = t;
    tick(dt);
    requestAnimationFrame(loop);
  }

  addEventListener('resize', () => RND.resize());
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (G.phase === 'play' || G.phase === 'ready')) $('bPause').onclick();
    if (e.key === 'm' || e.key === 'M') $('bBgm').onclick();
    if (e.key === 'k' || e.key === 'K') $('bSnd').onclick();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && (G.phase === 'play' || G.phase === 'ready') && !G.paused) { G.paused = true; show('pause', true); } });

  // ── 시작
  RND.TITLE = L('오락실 농구', 'ARCADE HOOPS');
  RND.init(cv, NB);
  setTogs();
  toTitle();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Ttl'), document.fonts.load('20px Ui')]).then(() => RND.redrawMarquee()).catch(() => {});
  requestAnimationFrame(loop);

  window.__H = { G, S, P, aimFor, tick, startStage, throwBall, finish, openMap, openEnd, toTitle, save, hud,
    step: (n, dt) => { for (let i = 0; i < (n || 1); i++) tick(dt || 1 / 60); } };
})();
