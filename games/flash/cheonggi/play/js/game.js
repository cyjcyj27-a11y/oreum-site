// 청기백기 — 게임 규칙
// 선생님이 부르는 대로 청기(W·S)·백기(↑·↓)를 올리고 내린다. "올리지 마"에 속으면 땡.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  // 세로 전용: 게임은 #app 세로 틀 안에서 돈다(PC 는 가운데 기둥). 크기는 창이 아니라 틀에서 잰다
  const APP = document.getElementById('app');
  const appW = () => (APP ? APP.clientWidth : innerWidth), appH = () => (APP ? APP.clientHeight : innerHeight);
  const K = 'cheonggi.';
  const AU = window.CGAudio, ART = window.CGArt, VD = window.CG_VOICE || {};
  const LAST = 30;                                   // 30스테이지 통과 = 엔딩(THE END), 게임 끝

  // ---------------------------------------------------------------- 저장
  let prog = { stage: 1, best: 0, stars: {}, ended: false };
  try { const p = JSON.parse(localStorage.getItem(K + 'prog') || 'null'); if (p && p.stage) prog = Object.assign(prog, p); } catch (e) {}
  prog.stage = Math.min(prog.stage, LAST);
  function save() { try { localStorage.setItem(K + 'prog', JSON.stringify(prog)); } catch (e) {} }
  const starSum = () => Object.values(prog.stars).reduce((a, b) => a + b, 0);

  // ---------------------------------------------------------------- 상태
  const S = {
    mode: 'title', clock: 0, paused: false,
    stage: 1, hearts: 3, idx: 0, N: 10, score: 0, combo: 0,
    up: { b: false, w: false }, ang: { b: 0, w: 0 }, vel: { b: 0, w: 0 },
    cmd: null, res: null, resT: 0,
    mood: 'idle', moodT: 0, teacher: '', teacherT: 0, hop: 0, hopV: 0, cheer: 0, confetti: [],
  };

  // ---------------------------------------------------------------- 명령 만들기
  const FN = { b: '청기', w: '백기' };
  const END = { u: '올려', d: '내려', nu: '올리지 마', nd: '내리지 마' };
  const MID = { u: '올리고', d: '내리고', nu: '올리지 말고', nd: '내리지 말고' };
  // 목소리 빨리 감기: 스테이지마다 빨라지고, 한 스테이지 안에서도 명령마다 조금씩 더 빨라진다
  // 난이도 곡선: 30스테이지 안에 끝까지 오른다(옛 50스테이지 곡선을 30에 눌러 담고 조금 더 가파르게)
  const rate = (s, i, n) => Math.min(2.3, 1 + (s - 1) * 0.036 + (n ? i / n : 0) * 0.15);
  const windowOf = s => Math.max(0.45, 1.35 - (s - 1) * 0.031);
  const countOf = s => Math.min(20, 8 + Math.floor(s * 0.42));

  function pickVerb(f, up, pNeg) {
    if (Math.random() < pNeg) return up[f] ? 'nd' : 'nu';          // 함정: 지금 상태를 건드리면 땡
    if (Math.random() < 0.78) return up[f] ? 'd' : 'u';            // 대부분은 움직이게
    return up[f] ? 'u' : 'd';                                      // 이미 그 상태 — 가만히 있어야 함
  }
  function makeCmd(s, up, prevKey) {
    const pCombo = Math.min(0.66, 0.08 + (s - 1) * 0.036);
    const pNeg = Math.min(0.42, 0.05 + (s - 1) * 0.024);
    const pAll = s >= 3 ? 0.07 : 0;
    for (let tries = 0; tries < 20; tries++) {
      let key, text, tgt = { b: up.b, w: up.w };
      const r = Math.random();
      if (r < pAll) {
        const u = !(up.b && up.w) && (Math.random() < 0.6 || (!up.b && !up.w));
        key = u ? 'allu' : 'alld'; text = '청기 백기 다 ' + (u ? '올려' : '내려') + '!';
        tgt = { b: u, w: u };
      } else if (r < pAll + pCombo) {
        const f1 = Math.random() < 0.5 ? 'b' : 'w', f2 = f1 === 'b' ? 'w' : 'b';
        const v1 = pickVerb(f1, up, pNeg * 1.2);
        const v2 = pickVerb(f2, up, v1[0] === 'n' ? 0 : pNeg * 0.6);
        key = f1 + v1 + '_' + f2 + v2; text = FN[f1] + ' ' + MID[v1] + ', ' + FN[f2] + ' ' + END[v2] + '!';
        tgt[f1] = v1 === 'u' ? true : v1 === 'd' ? false : up[f1];
        tgt[f2] = v2 === 'u' ? true : v2 === 'd' ? false : up[f2];
      } else {
        const f = Math.random() < 0.5 ? 'b' : 'w', v = pickVerb(f, up, pNeg);
        key = f + v; text = FN[f] + ' ' + END[v] + '!';
        tgt[f] = v === 'u' ? true : v === 'd' ? false : up[f];
      }
      if (key === prevKey || !VD[key]) continue;
      const change = tgt.b !== up.b || tgt.w !== up.w;
      if (!change && s <= 2 && tries < 10) continue;               // 처음엔 가만히 있는 명령을 적게
      return { key, text, tgt, change };
    }
    return { key: 'bu', text: '청기 올려!', tgt: { b: true, w: up.w }, change: !up.b };
  }

  // ---------------------------------------------------------------- 화면 글
  const bubble = $('bubble'), btxt = $('btxt');
  function showBubble(text) {
    btxt.innerHTML = '';
    for (const ch of text) {
      const sp = document.createElement('span'); sp.textContent = ch; btxt.appendChild(sp);
      if (ch === ',') { const br = document.createElement('br'); br.className = 'pbr'; btxt.appendChild(br); }
    }
    // 줄바꿈 표시(br)는 글자 수 셈에서 빼려고 span 만 모은다
    // 청기·백기 글자에 색
    const spans = btxt.querySelectorAll('span'), str = text;
    for (let i = 0; i < str.length - 1; i++) {
      const two = str[i] + str[i + 1];
      if (two === '청기') { spans[i].className = spans[i + 1].className = 'cb'; }
      if (two === '백기') { spans[i].className = spans[i + 1].className = 'cw'; }
    }
    bubble.classList.add('on');
  }
  function revealBubble(k) {
    const sp = btxt.querySelectorAll('span'), n = Math.ceil(sp.length * Math.min(1, k));
    for (let i = 0; i < sp.length; i++) sp[i].classList.toggle('hid', i >= n);
  }
  function hideBubble() { bubble.classList.remove('on'); }

  function pop(text, cls, x, y) {
    const d = document.createElement('div');
    d.className = 'pop ' + (cls || ''); d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    $('pops').appendChild(d); setTimeout(() => d.remove(), 1300);
  }
  // 말풍선을 메뉴 바로 아래에 둔다 — 좁은 폰에서 메뉴가 여러 줄로 접혀도 겹치지 않게
  let tbBottom = 0;
  function placeBubble() {
    let b = 0;
    for (const el of document.querySelectorAll('#topbar > *')) { const r = el.getBoundingClientRect(); if (r.height) b = Math.max(b, r.bottom); }
    if (b) { tbBottom = Math.round(b); document.documentElement.style.setProperty('--tb', tbBottom + 'px'); }
  }
  addEventListener('resize', placeBubble);
  function hud() {
    $('stg').textContent = 'STAGE ' + S.stage;
    $('hearts').innerHTML = [0, 1, 2].map(i => '<span class="' + (i < S.hearts ? '' : 'lost') + '">❤</span>').join('');
    $('pbar').firstElementChild.style.width = (100 * S.idx / S.N) + '%';
    $('score').textContent = S.score.toLocaleString();
    placeBubble();
  }
  function panel(id) {
    for (const p of document.querySelectorAll('.panel')) p.classList.toggle('on', p.id === id);
  }

  // ---------------------------------------------------------------- 흐름
  let L = null;
  function kidHead() { return L ? [L.cx, L.fy - (L.u * 128)] : [appW() / 2, appH() / 3]; }

  function startStage(s) {
    S.stage = s; S.hearts = 3; S.idx = 0; S.N = countOf(s); S.combo = 0;
    S.up = { b: false, w: false };
    S.cmd = null; S.res = null;
    S.mode = 'intro'; S.introT = 1.3;
    $('stageT').textContent = 'STAGE ' + s;
    panel('stage'); hideBubble(); hud();
    AU.SFX.whistle();
    try { window.OG && OG.start({ stage: s }); } catch (e) {}          // 사이트 지표(game-events.js)
    AU.warmUp(Object.keys(VD));
    AU.startBgm();
  }
  function nextCmd() {
    S.cmd = makeCmd(S.stage, S.up, S.cmd && S.cmd.key);
    const c = S.cmd, r = rate(S.stage, S.idx, S.N);
    c.rate = r;
    c.t0 = S.clock; c.vs = -1; c.dur = (VD[c.key] || 1.5) / r; c.win = windowOf(S.stage);
    c.last = -1; c.from = { b: S.up.b, w: S.up.w };
    c.gap = Math.max(0.28, 0.6 - S.stage * 0.011);
    S.mode = 'cmd'; S.mood = 'focus';
    hideBubble();
  }
  function sayNow() {
    const c = S.cmd; c.said = true;
    showBubble(c.text); revealBubble(0);
    AU.say(c.key, c.rate, () => { if (S.cmd === c && c.vs < 0) c.vs = S.clock; });
  }

  function press(f, upDir) {
    if (S.paused) return;
    if (S.mode === 'title' || S.mode === 'over' || S.mode === 'clear' || S.mode === 'ending') {
      // 판 밖에선 깃발만 흔들어 볼 수 있다
      if (S.up[f] !== upDir) { S.up[f] = upDir; S.vel[f] += upDir ? 6 : -6; upDir ? AU.SFX.swishUp() : AU.SFX.swishDown(); }
      return;
    }
    if (S.mode !== 'cmd' && S.mode !== 'res') return;
    const c = S.cmd;
    // 틀린 쪽 단추는 깃발이 이미 그 자리라 안 움직여도 틀린 것이다.
    // 맞힌 직후(res 0.5초)에 다른 깃발을 잘못 건드려도 틀린 것으로 되돌린다.
    const judging = c && (S.mode === 'cmd' || (S.res === 'ok' && !c.revoked));
    const wrong = judging && upDir !== c.tgt[f];
    if (S.up[f] === upDir) { S.vel[f] += upDir ? 2 : -2; AU.SFX.flap(); }  // 이미 그 상태 — 살짝 흔들기만
    else {
      S.up[f] = upDir; S.vel[f] += upDir ? 7 : -7;
      upDir ? AU.SFX.swishUp() : AU.SFX.swishDown();
      if (S.mode === 'cmd') c.last = S.clock;
    }
    if (!wrong) return;
    if (S.mode === 'res') revoke();
    fail(f);
  }
  // 맞힘을 취소하고 명령 중으로 되돌린다(바로 fail 이 이어진다)
  function revoke() {
    const c = S.cmd;
    c.revoked = true; c.done = false;
    S.score -= c.add || 0; S.idx--;
    const g = document.querySelector('#pops .grade:not(.miss):last-child'); if (g) g.remove();
    S.mode = 'cmd';
  }

  function success(grade) {
    const c = S.cmd;
    S.combo++;
    const base = { PERFECT: 300, GREAT: 200, NICE: 100 }[grade];
    const add = Math.round(base * (1 + Math.min(S.combo, 20) * 0.05) / 10) * 10;
    S.score += add; c.add = add;
    S.idx++;
    S.mode = 'res'; S.resT = 0.5; S.res = 'ok';
    S.mood = 'happy'; S.moodT = 0.5; S.hopV = 26; S.cheer = 1;
    const [hx, hy] = kidHead();
    pop(grade, 'grade ' + grade.toLowerCase(), hx, hy - 30);
    if (S.combo >= 5 && S.combo % 5 === 0) pop(S.combo + ' COMBO', 'combo', hx, hy + 30);
    grade === 'PERFECT' ? AU.SFX.perfect(S.combo) : AU.SFX.good(S.combo);
    hud(); hideBubbleSoon();
    c.done = true;
  }
  function fail(f) {
    const c = S.cmd;
    if (c.done) return;
    c.done = true;
    S.combo = 0; S.hearts--; S.idx++;
    S.mode = 'res'; S.resT = 1.25; S.res = 'ng';
    S.mood = 'oops'; S.moodT = 1; S.teacher = 'laugh'; S.teacherT = 1.3;
    AU.stopVoice(); AU.SFX.wrong(); AU.say('ttaeng', 1, null); AU.SFX.heart();
    const [hx, hy] = kidHead();
    pop('MISS', 'grade miss', hx, hy - 30);
    document.body.classList.add('hit'); setTimeout(() => document.body.classList.remove('hit'), 350);
    hud();
  }
  let hbT = null;
  function hideBubbleSoon() { clearTimeout(hbT); hbT = setTimeout(() => { if (S.mode !== 'cmd') hideBubble(); }, 350); }

  function afterRes() {
    if (S.hearts <= 0) return gameOver();
    if (S.idx >= S.N) return stageClear();
    nextCmd();
  }
  function stageClear() {
    hideBubble();
    const st = S.hearts;
    prog.stars[S.stage] = Math.max(prog.stars[S.stage] || 0, st);
    prog.best = Math.max(prog.best, S.score);
    const first = S.stage >= LAST;                   // 마지막 스테이지는 통과할 때마다 엔딩
    prog.stage = Math.min(LAST, Math.max(prog.stage, S.stage + 1));
    if (first) prog.ended = true;
    save();
    S.mode = first ? 'ending' : 'clear';
    try { window.OG && OG.over({ result: first ? 'END' : 'CLEAR', stage: S.stage, score: S.score }); } catch (e) {}
    S.mood = 'happy'; S.moodT = 99; S.cheer = 2;
    S.up = { b: true, w: true }; S.vel.b += 6; S.vel.w += 6;
    burst(first ? 260 : 120);
    AU.stopVoice(); AU.say('clear', 1, null); AU.SFX.clear();
    if (first) {
      setTimeout(() => AU.SFX.fanfare(), 700);
      $('endN').textContent = '⭐ ' + S.score.toLocaleString();
      panel('ending');
    } else {
      $('clearStars').innerHTML = [0, 1, 2].map(i => '<span class="' + (i < st ? '' : 'off') + '">★</span>').join('');
      $('clearN').textContent = '⭐ ' + S.score.toLocaleString();
      panel('clear');
    }
  }
  function gameOver() {
    S.mode = 'over'; hideBubble();
    try { window.OG && OG.over({ result: 'LOSE', stage: S.stage, score: S.score }); } catch (e) {}
    prog.best = Math.max(prog.best, S.score); save();
    S.mood = 'oops'; S.moodT = 0.3; S.teacher = 'laugh'; S.teacherT = 2;
    AU.SFX.over();
    $('overN').textContent = 'STAGE ' + S.stage + ' · ⭐ ' + S.score.toLocaleString();
    panel('over');
  }
  function toTitle() {
    S.mode = 'title'; S.mood = 'idle'; S.cheer = 0; hideBubble();
    const cont = prog.stage > 1;
    $('start').textContent = cont ? 'START · STAGE ' + prog.stage : 'START';
    $('newgame').hidden = !cont;
    const ss = starSum();
    $('best').textContent = ss ? '★ ' + ss + ' / ' + (LAST * 3) + (prog.best ? '   ·   BEST ' + prog.best.toLocaleString() : '') : '';
    panel('title');
  }

  function burst(n) {
    const W = appW();
    for (let i = 0; i < n; i++) {
      S.confetti.push({
        x: Math.random() * W, y: -20 - Math.random() * appH() * 0.5, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 120,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, f: Math.random() * 6, s: 4 + Math.random() * 4,
        c: ART.FLAGC[i % ART.FLAGC.length],
      });
    }
  }

  // ---------------------------------------------------------------- 매 프레임
  function step(dt) {
    if (S.paused) return;
    S.clock += dt;
    const now = S.clock;
    // 깃발 팔 스프링
    for (const f of ['b', 'w']) {
      const tgt = S.up[f] ? 1 : 0;
      S.vel[f] += ((tgt - S.ang[f]) * 330 - S.vel[f] * 21) * dt;
      S.ang[f] += S.vel[f] * dt;
    }
    S.hopV -= 160 * dt; S.hop = Math.max(0, S.hop + S.hopV * dt); if (S.hop === 0 && S.hopV < 0) S.hopV = 0;
    if (S.moodT > 0) { S.moodT -= dt; if (S.moodT <= 0 && S.mode !== 'title') S.mood = S.mode === 'cmd' ? 'focus' : 'idle'; }
    if (S.teacherT > 0) { S.teacherT -= dt; if (S.teacherT <= 0) S.teacher = ''; }
    S.cheer = Math.max(0, S.cheer - dt * 0.9);
    for (const p of S.confetti) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.f += dt * 9; }
    S.confetti = S.confetti.filter(p => p.y < appH() + 30);

    if (S.mode === 'intro') {
      S.introT -= dt;
      if (S.introT <= 0.35 && !S.introSaid) { S.introSaid = true; AU.say('start', 1, null); }
      if (S.introT <= 0) { S.introSaid = false; panel(''); nextCmd(); }
    } else if (S.mode === 'cmd') {
      const c = S.cmd;
      if (!c.said && now - c.t0 >= c.gap) sayNow();
      if (c.said && c.vs < 0 && now - c.t0 > c.gap + 0.8) c.vs = now;   // 소리가 안 나도 진행
      if (c.vs >= 0) {
        const k = (now - c.vs) / c.dur;
        revealBubble(k * 1.08 + 0.05);
        S.talk = k < 1 ? Math.abs(Math.sin(now * 21)) : 0;
        const vEnd = c.vs + c.dur, dl = vEnd + c.win;
        const ok = S.up.b === c.tgt.b && S.up.w === c.tgt.w;
        if (!c.done) {
          if (c.change && ok && now >= vEnd - 0.05) {
            const react = Math.max(0, c.last - vEnd);
            success(react < 0.3 ? 'PERFECT' : react < 0.65 ? 'GREAT' : 'NICE');
          } else if (now >= dl) {
            if (ok) success('NICE'); else fail(null);
          }
        }
      } else S.talk = 0;
    } else if (S.mode === 'res') {
      S.talk = 0;
      S.resT -= dt;
      if (S.resT <= 0) afterRes();
    }
  }

  const cv = $('cv'), g = cv.getContext('2d');
  let dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(appW() * dpr); cv.height = Math.round(appH() * dpr);
  }
  addEventListener('resize', resize); resize();
  function render() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    L = ART.draw(g, appW(), appH(), S.clock, {
      aB: S.ang.b, aW: S.ang.w, mood: S.mood, moodT: S.moodT, hop: S.hop,
      teacher: S.teacher, talk: S.talk || 0, cheer: S.cheer,
      confetti: S.confetti.length ? S.confetti : null, touch: document.body.classList.contains('touch'),
      top: tbBottom ? tbBottom + 10 + Math.min(110, appW() * 0.27) : 0,   // 세로: 말풍선(두 줄) 아래부터 아이를 그린다
    }, dpr);
    placeFlagButtons();
    fitTitle();
  }
  // 첫 화면 제목 묶음(제목·START·NEW GAME·별)이 아이 머리를 덮지 않게, 넘치면 묶음을 통째로 줄인다(사장님 9/19)
  // 폰 글자 크기 설정으로 글자가 커져도 버틴다
  let fitKey = '';
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitKey = ''; });
  function fitTitle() {
    const P = $('title');
    if (!L || !P.classList.contains('on')) { fitKey = ''; return; }
    const kidTop = L.fy - L.u * 112 - 6;
    // 글자 크기·글꼴이 늦게 바뀌어도 따라가게 0.3초마다 다시 잰다
    const key = Math.round(kidTop) + ',' + appW() + ',' + Math.floor(S.clock * 3);
    if (key === fitKey) return;
    fitKey = key;
    P.style.transform = '';
    let top = Infinity, bot = 0;
    for (const el of P.children) { if (el.hidden) continue; const r = el.getBoundingClientRect(); if (!r.height) continue; top = Math.min(top, r.top); bot = Math.max(bot, r.bottom); }
    if (L.portrait && bot > kidTop && bot > top) {
      const pt = P.getBoundingClientRect().top + parseFloat(getComputedStyle(P).paddingTop);
      const k = Math.max(0.45, (kidTop - pt) / (bot - pt));
      P.style.transformOrigin = '50% ' + Math.round(pt - P.getBoundingClientRect().top) + 'px';
      P.style.transform = 'scale(' + k.toFixed(3) + ')';
    }
  }
  // 가로(PC) 화면: 깃발 단추를 화면 양 끝이 아니라 아이 양옆, 내린 깃발 끝 바로 바깥에 붙인다(사장님 9/19 "가리지만 않게")
  let fbKey = '';
  function placeFlagButtons() {
    const B = $('fbB'), Wb = $('fbW'), bw = B.offsetWidth || 62;
    const key = L ? Math.round(L.cx) + ',' + L.u.toFixed(3) + ',' + bw : '';
    if (!L || key === fbKey) return;
    fbKey = key;
    // 원래 단추(한쪽에 ▲▼ 두 개)를 가운데로 모아 아이 다리 바로 옆에(사장님 9/19). 신발 바깥 끝이 15u
    const gap = L.u * 15 + 8, W = appW();
    B.style.right = 'auto'; B.style.left = Math.max(8, L.cx - gap - bw) + 'px';
    Wb.style.right = 'auto'; Wb.style.left = Math.min(W - 8 - bw, L.cx + gap) + 'px';
  }
  let lastT = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    step(dt); render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // 시험용 손잡이(미리보기 창은 rAF 가 안 돈다)
  window.__cg = { S, prog, tick(n) { for (let i = 0; i < (n || 1); i++) step(1 / 60); render(); return S.mode; }, press, makeCmd };

  // ---------------------------------------------------------------- 입력
  const KEYS = { KeyW: ['b', true], KeyS: ['b', false], ArrowUp: ['w', true], ArrowDown: ['w', false] };
  addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = KEYS[e.code];
    if (k) { e.preventDefault(); AU.unlock(); press(k[0], k[1]); return; }
    if (e.code === 'Space' || e.code === 'Enter') {
      const b = document.querySelector('.panel.on .btn:not([hidden])');
      if (b) { e.preventDefault(); b.click(); }
    }
    if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  });
  for (const [id, f, u] of [['bU', 'b', true], ['bD', 'b', false], ['wU', 'w', true], ['wD', 'w', false]]) {
    const el = $(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); AU.unlock(); el.classList.add('on'); press(f, u); });
    const off = () => el.classList.remove('on');
    el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  }
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') document.body.classList.add('touch'); }, { capture: true });
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

  $('start').onclick = () => { AU.unlock(); AU.SFX.click(); S.score = 0; startStage(prog.stage); };
  $('newgame').onclick = () => { AU.unlock(); AU.SFX.click(); prog.stage = 1; save(); S.score = 0; startStage(1); };
  $('next').onclick = () => { AU.SFX.click(); S.confetti = []; startStage(S.stage + 1); };
  $('endNext').onclick = () => { AU.SFX.click(); S.confetti = []; toTitle(); };
  $('retry').onclick = () => { AU.unlock(); AU.SFX.click(); S.score = 0; startStage(S.stage); };
  $('home2').onclick = () => { AU.SFX.click(); toTitle(); };

  // 일시정지·소리 토글
  function togglePause() {
    if (S.mode === 'title') return;
    S.paused = !S.paused;
    if (S.paused) {
      AU.stopVoice(); panel('pause');
    } else {
      panel(''); lastT = performance.now();
      if (S.mode === 'cmd') { S.up = { b: S.cmd.from.b, w: S.cmd.from.w }; S.cmd = Object.assign(S.cmd, { t0: S.clock, vs: -1, said: false, last: -1 }); hideBubble(); }
      if (S.mode === 'intro') panel('stage');
      if (S.mode === 'clear') panel('clear');
      if (S.mode === 'over') panel('over');
      if (S.mode === 'ending') panel('ending');
    }
  }
  $('tPause').onclick = togglePause;
  $('resume').onclick = togglePause;
  const tS = $('tSnd'), tB = $('tBgm');
  function syncTogs() { tS.classList.toggle('off', !AU.A.snd); tB.classList.toggle('off', !AU.A.bgm); }
  tS.onclick = () => { AU.unlock(); AU.setSnd(!AU.A.snd); syncTogs(); };
  tB.onclick = () => { AU.unlock(); AU.setBgm(!AU.A.bgm); syncTogs(); };
  syncTogs();
  document.addEventListener('visibilitychange', () => { if (document.hidden && !S.paused && S.mode !== 'title') togglePause(); });

  toTitle(); hud();
})();
