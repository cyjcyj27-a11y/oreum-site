// 두뇌풀가동 — 게임 규칙
// 칠판에 뜬 사칙연산 문제를 시간 안에 고른다. 60스테이지 + ∞. 정답이 이어지면 ⚡ 게이지가 차고, 다 차면 풀가동(점수 3배).
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const K = 'fullbrain.';
  const AU = window.FBAudio, ART = window.FBArt;
  const LAST = 60;
  // 영문판: ?lang=en 이면 화면 글자를 영어로 덧씌운다(한국어가 원본)
  const EN = new URLSearchParams(location.search).get('lang') === 'en';
  if (EN) {
    document.documentElement.lang = 'en'; document.title = 'FULL BRAIN';
    document.querySelectorAll('[data-en]').forEach(el => { el.innerHTML = el.getAttribute('data-en'); });
    const t = document.getElementById('ttl'); if (t) t.innerHTML = '<span class="t1">FULL</span><span class="t2"> BRAIN</span>';
  }
  const L = (ko, en) => EN ? en : ko;

  // ---------------------------------------------------------------- 저장
  let prog = { stage: 1, stars: {}, ended: false, bestInf: 0, bestScore: 0 };
  try { const p = JSON.parse(localStorage.getItem(K + 'prog') || 'null'); if (p && p.stage) prog = Object.assign(prog, p); } catch (e) {}
  prog.stage = Math.min(prog.stage, LAST);
  function save() { try { localStorage.setItem(K + 'prog', JSON.stringify(prog)); } catch (e) {} }
  const starSum = () => Object.values(prog.stars).reduce((a, b) => a + b, 0);

  // ---------------------------------------------------------------- 상태
  const S = {
    mode: 'title', clock: 0, paused: false, inf: false,
    stage: 1, hearts: 3, idx: 0, N: 10, score: 0, combo: 0, miss: 0,
    gauge: 0, fullLeft: 0, q: null, tLeft: 0, tMax: 1, lock: 0, tickT: 0,
    mood: 'idle', moodT: 0, brain: null,
  };

  // ---------------------------------------------------------------- 문제 만들기
  const ri = (a, b) => { a = Math.round(a); b = Math.round(b); return a + Math.floor(Math.random() * (b - a + 1)); };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const OPS = { '+': (a, b) => a + b, '-': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };
  const SYM = { '+': '+', '-': '−', '×': '×', '÷': '÷' };

  // 스테이지 → 문제 종류. 60스테이지를 12칸으로: 덧셈→뺄셈→가감→곱셈→나눗셈→사칙→빈칸→세 수→큰 수→○×→섞기→끝판
  const BANDS = [
    [1, 4, 'add'], [5, 8, 'sub'], [9, 12, 'addsub'], [13, 18, 'mul'], [19, 23, 'div'], [24, 28, 'mix'],
    [29, 33, 'blank'], [34, 38, 'three'], [39, 43, 'big'], [44, 48, 'ox'], [49, 53, 'all'], [54, 60, 'hard'],
  ];
  const ALLK = ['add', 'sub', 'mul', 'div', 'blank', 'three', 'big', 'ox'];
  function bandOf(s) { for (const b of BANDS) if (s >= b[0] && s <= b[1]) return { kind: b[2], d: (s - b[0]) / Math.max(1, b[1] - b[0]) }; return { kind: 'hard', d: 1 }; }
  function kindOf(s) {
    if (s > LAST) return { kind: pick(ALLK.concat(['three', 'big', 'div2'])), d: Math.min(1, (s - LAST) / 30) };
    const b = bandOf(s);
    if (b.kind === 'addsub') return { kind: pick(['add', 'sub']), d: b.d };
    if (b.kind === 'mix') return { kind: pick(['add', 'sub', 'mul', 'div']), d: b.d };
    if (b.kind === 'all') return { kind: pick(ALLK), d: b.d };
    if (b.kind === 'hard') return { kind: pick(['three', 'big', 'div2', 'blank', 'ox']), d: b.d };
    return b;
  }
  const bandSyms = s => { const k = s > LAST ? 'all' : bandOf(s).kind; return { add: '+', sub: '−', addsub: '+ −', mul: '×', div: '÷', mix: '+ − × ÷', blank: '□', three: '+ ×', big: '× −', ox: '○ ×', all: '+ − × ÷', hard: '⚡' }[k]; };

  // 기본 연산 하나. 숫자는 그 판 최대치의 55~100% 띠 안에서만 뽑는다 — "1부터 최대까지"로 뽑으면 한 판 안에서 27−17 다음에 8−3 이 나온다(사장님 9/21)
  function basic(kind, s, d) {
    const g = Math.pow(Math.min(1.6, (s - 1) / 59), 0.7);
    const hi = 9 + Math.round(g * 120), lo = Math.max(1, Math.round(hi * 0.55));     // 1판 5~9 → 6판 17~30 → 10판 23~41 → 30판 45~82 → 60판 71~129
    let a, b, op;
    if (kind === 'add') { a = ri(lo, hi); b = ri(lo, hi); op = '+'; }
    else if (kind === 'sub') { a = ri(Math.max(lo + 2, Math.round(hi * 0.75)), hi); b = ri(Math.round(hi * 0.3), a - Math.max(2, Math.round(hi * 0.25))); op = '-'; }   // 차이가 최대의 25% 아래로 안 떨어지게
    else if (kind === 'mul') { const mh = 9 + Math.round(g * 15), bh = g > 0.55 ? 12 : 9; a = ri(Math.max(2, Math.round(mh * 0.6)), mh); b = ri(Math.max(2, Math.round(bh * 0.5)), bh); op = '×'; }
    else if (kind === 'div') { const qh = 9 + Math.round(g * 15), bh = g > 0.55 ? 12 : 9; b = ri(Math.max(2, Math.round(bh * 0.5)), bh); const q = ri(Math.max(2, Math.round(qh * 0.6)), qh); a = b * q; op = '÷'; }
    else if (kind === 'div2') { b = ri(6, 12); const q = ri(15, 25 + Math.round(g * 20)); a = b * q; op = '÷'; }
    return { a, b, op, ans: OPS[op](a, b) };
  }
  function makeQ(s, u) {
    s = s + (u || 0) * 0.8;                                   // 한 판 안에서 문제 순서대로 0.8판만큼 미끄러져 오른다(뒤로 갈수록 조금씩 어렵게)
    const { kind, d } = kindOf(Math.floor(s));
    let q;
    if (kind === 'blank') {
      const k = pick(['add', 'sub', 'mul', 'div']), e = basic(k, s, d), hide = Math.random() < 0.5 ? 'a' : 'b';
      const ans = hide === 'a' ? e.a : e.b;
      q = { kind, ans, html: n(hide === 'a' ? '□' : e.a, hide === 'a') + op(e.op) + n(hide === 'b' ? '□' : e.b, hide === 'b') + eq() + n(e.ans),
            near: [e.ans, e.a, e.b] };
    } else if (kind === 'three') {
      const g = Math.pow(Math.min(1.6, (s - 1) / 59), 0.7), f = pick(['a+b×c', 'a×b+c', 'a×b−c', 'a+b−c', 'a−b+c']), hi = 4 + Math.round(g * 8);
      let a, b, c, ans, l2r;
      if (f === 'a+b×c') { a = ri(5 + Math.floor(g * 20), 9 + g * 40); b = ri(Math.max(2, Math.round(hi * 0.5)), hi); c = ri(Math.max(2, Math.round(hi * 0.5)), hi); ans = a + b * c; l2r = (a + b) * c; q = { html: n(a) + op('+') + n(b) + op('×') + n(c) }; }
      else if (f === 'a×b+c') { a = ri(Math.max(2, Math.round(hi * 0.5)), hi); b = ri(Math.max(2, Math.round(hi * 0.5)), hi); c = ri(5 + Math.floor(g * 20), 9 + g * 40); ans = a * b + c; l2r = ans; q = { html: n(a) + op('×') + n(b) + op('+') + n(c) }; }
      else if (f === 'a×b−c') { a = ri(Math.max(2, Math.round(hi * 0.5)), hi); b = ri(Math.max(2, Math.round(hi * 0.5)), hi); c = ri(Math.round(a * b * 0.2), Math.round(a * b * 0.7)); ans = a * b - c; l2r = ans; q = { html: n(a) + op('×') + n(b) + op('-') + n(c) }; }
      else if (f === 'a+b−c') { a = ri(10 + Math.floor(g * 30), 20 + g * 60); b = ri(10 + Math.floor(g * 30), 20 + g * 60); c = ri(Math.round((a + b) * 0.25), Math.round((a + b) * 0.75)); ans = a + b - c; l2r = ans; q = { html: n(a) + op('+') + n(b) + op('-') + n(c) }; }
      else { a = ri(10 + Math.floor(g * 30), 30 + g * 60); b = ri(1 + Math.floor(g * 10), a - 1); c = ri(1 + Math.floor(g * 10), 20 + g * 40); ans = a - b + c; l2r = a - (b + c); q = { html: n(a) + op('-') + n(b) + op('+') + n(c) }; }
      q.kind = kind; q.ans = ans; q.html += eq() + n('?', true); q.near = [l2r];
    } else if (kind === 'big') {
      const g = Math.pow(Math.min(1.6, (s - 1) / 59), 0.7), f = pick(['mul', 'add3', 'sub3']);
      if (f === 'mul') { const a = ri(12 + Math.round(g * 20), 20 + Math.round(g * 40)), b = ri(g > 0.75 ? 6 : 4, g > 0.75 ? 12 : 9); q = { kind, ans: a * b, html: n(a) + op('×') + n(b) + eq() + n('?', true), near: [a * (b + 1), a * (b - 1), a * b + 10, a * b - 10] }; }
      else if (f === 'add3') { const a = ri(200 + g * 300, 400 + g * 600), b = ri(200 + g * 300, 400 + g * 600); q = { kind, ans: a + b, html: n(a) + op('+') + n(b) + eq() + n('?', true), near: [a + b + 100, a + b - 100, a + b + 10, a + b - 10] }; }
      else { const a = ri(400 + g * 300, 500 + g * 600), b = ri(Math.round(a * 0.3), a - 120); q = { kind, ans: a - b, html: n(a) + op('-') + n(b) + eq() + n('?', true), near: [a - b + 100, a - b - 100, a - b + 10, a - b - 10] }; }
    } else if (kind === 'ox') {
      const k = pick(['add', 'sub', 'mul', 'div']), e = basic(k, s, d), truth = Math.random() < 0.5;
      let shown = e.ans;
      if (!truth) { const cand = distract(e.ans, [e.a, e.b, e.op], 1)[0]; shown = cand; }
      q = { kind, ox: true, ans: truth ? 0 : 1, html: n(e.a) + op(e.op) + n(e.b) + eq() + n(shown), choices: ['○', '×'] };
    } else {
      const e = basic(kind, s, d);
      q = { kind, ans: e.ans, html: n(e.a) + op(e.op) + n(e.b) + eq() + n('?', true), near: [e.a, e.b, e.op] };
    }
    if (!q.ox) {
      const ds = distract(q.ans, q.near || [], 3);
      const ch = ds.concat([q.ans]); shuffle(ch);
      q.choices = ch; q.ansIdx = ch.indexOf(q.ans);
    } else q.ansIdx = q.ans;
    return q;
  }
  // 오답 후보: 정답 근처·흔한 실수(더하기를 곱하기로 등)·자릿수 뒤바꿈. 음수·중복 없이
  function distract(ans, near, n) {
    const set = new Set([ans]), out = [];
    const cand = [];
    const push = v => { if (Number.isInteger(v) && v >= 0 && v !== ans && !set.has(v)) { set.add(v); cand.push(v); } };
    const [a, b, o] = near;
    if (typeof a === 'number' && typeof b === 'number') {
      if (o === '×') { push(a + b); push(a * (b + 1)); push(a * (b - 1)); push((a + 1) * b); }
      if (o === '+') { push(a * b); push(a - b); push(a + b + 10); push(a + b - 10); }
      if (o === '-') { push(a + b); push(b - a); push(a - b + 10); push(a - b - 10); }
      if (o === '÷') { push(a - b); push(a / b + 1); push(a / b - 1); push(a - b * 2); }
    }
    for (const v of near) if (typeof v === 'number') push(v);
    push(ans + 1); push(ans - 1); push(ans + 2); push(ans - 2); push(ans + 10); push(ans - 10); push(ans + 3); push(ans - 3);
    const s = String(ans); if (s.length === 2) push(parseInt(s[1] + s[0], 10));
    push(ans * 2); push(Math.floor(ans / 2)); push(ans + 20); push(ans - 20); push(ans + 100); push(ans - 100);
    shuffle(cand);
    cand.sort((x, y) => (Math.abs(x - ans) < 4 ? 0 : 1) - (Math.abs(y - ans) < 4 ? 0 : 1) + (Math.random() - 0.5) * 1.2);   // 가까운 것을 더 자주
    while (out.length < n && cand.length) out.push(cand.shift());
    let guard = 0;
    while (out.length < n && guard++ < 50) push(ans + ri(-15, 15)), cand.length && out.push(cand.shift());
    return out;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const n = (v, box) => '<span class="' + (box ? 'bx' : 'nm') + '">' + v + '</span>';
  const op = o => '<span class="op">' + SYM[o] + '</span>';
  const eq = () => '<span class="eq">=</span>';

  // 시간: 스테이지가 오를수록 짧게, 종류마다 배수
  const TM = { add: 1, sub: 1.05, mul: 1.15, div: 1.25, div2: 1.6, blank: 1.35, three: 1.7, big: 1.6, ox: 0.85 };
  function timeFor(s, q) {
    const base = Math.max(3.6, 8.5 - (s - 1) * 0.09);
    const k = s > LAST ? Math.max(3.0, 3.6 - (s - LAST) * 0.02) : base;
    return k * (TM[q.kind] || 1);
  }
  const countOf = s => s > LAST ? 1e9 : s >= 31 ? 12 : 10;

  // ---------------------------------------------------------------- 화면 요소
  const stg = $('stg'), hearts = $('hearts'), tbar = $('tbar'), gbar = $('gbar'), scoreEl = $('score');
  const qEl = $('q'), qt = $('qt'), ansEl = $('ans'), abs = Array.from(ansEl.querySelectorAll('.ab'));
  const panels = { title: $('title'), stage: $('stage'), clear: $('clear'), over: $('over'), ending: $('ending'), pause: $('pause') };
  function showPanel(name) { for (const k in panels) panels[k].classList.toggle('on', k === name); }

  function hud() {
    stg.textContent = S.inf ? '∞ ' + S.idx : 'STAGE ' + S.stage;
    hearts.innerHTML = [0, 1, 2].map(i => '<span class="' + (i < S.hearts ? '' : 'lost') + '">♥</span>').join('');
    scoreEl.textContent = S.score;
    tbar.firstElementChild.style.width = (S.tMax ? Math.max(0, S.tLeft / S.tMax) * 100 : 100) + '%';
    tbar.classList.toggle('low', S.tLeft / S.tMax < 0.3 && S.mode === 'play' && !S.lock);
    gbar.firstElementChild.style.width = (S.fullLeft ? 100 : S.gauge / 5 * 100) + '%';
    gbar.classList.toggle('full', S.fullLeft > 0);
  }
  function pop(txt, cls, x, y) {
    const e = document.createElement('div'); e.className = 'pop ' + (cls || ''); e.textContent = txt;
    const r = qEl.getBoundingClientRect();
    e.style.left = (x != null ? x : r.left + r.width / 2) + 'px'; e.style.top = (y != null ? y : r.top - 10) + 'px';
    $('pops').appendChild(e); setTimeout(() => e.remove(), 1100);
  }

  // ---------------------------------------------------------------- 흐름
  function toTitle() {
    S.mode = 'title'; S.q = null; ansEl.classList.add('hid'); qt.innerHTML = ''; S.mood = 'idle';
    $('best').textContent = '★ ' + starSum() + (prog.bestInf ? '   ∞ ' + prog.bestInf : '');
    $('newgame').hidden = !(prog.stage > 1 || prog.ended);
    $('inf').hidden = !prog.ended;
    $('start').textContent = prog.ended ? 'STAGE ' + Math.min(prog.stage, LAST) : (prog.stage > 1 ? 'STAGE ' + prog.stage : 'START');
    showPanel('title'); hud(); AU.bgmStop(); AU.setTempo(1);
    document.documentElement.style.setProperty('--tb', $('topbar').getBoundingClientRect().bottom + 'px');   // 상단바가 몇 줄로 접혔든 제목은 그 아래
  }
  function startStage(s, inf) {
    S.inf = !!inf; S.stage = s; S.hearts = 3; S.idx = 0; S.N = countOf(inf ? LAST + 1 : s); S.score = 0; S.combo = 0; S.miss = 0;
    S.gauge = 0; S.fullLeft = 0; S.lock = 0; S.q = null; qt.innerHTML = ''; ansEl.classList.add('hid');
    S.mode = 'stage'; S.mood = 'idle';
    $('stageT').textContent = inf ? '∞' : 'STAGE ' + s; $('stageS').textContent = inf ? '' : bandSyms(s);
    showPanel('stage'); hud();
    try { window.OG && OG.start({ stage: inf ? 'inf' : s }); } catch (e) {}
    AU.bgmStart(); AU.setTempo(S.inf ? 1.15 : 1 + Math.min(0.3, (s - 1) * 0.005));
    S.lock = 1.1;                                                   // 1.1초 뒤 첫 문제
  }
  function nextQ() {
    const s = (S.inf ? LAST + 1 + Math.floor(S.idx / 4) : S.stage) + (S.fullLeft ? 6 : 0);   // 풀가동 중엔 여섯 판 앞선 문제
    S.q = makeQ(s, S.inf ? 0 : S.idx / S.N); S.tMax = S.tLeft = timeFor(s, S.q); S.lock = 0; S.mode = 'play';
    S.mood = S.fullLeft ? 'full' : 'think'; S.moodT = 0; S.tickT = 0;
    qt.innerHTML = S.q.html; qEl.classList.remove('qp'); void qEl.offsetWidth; qEl.classList.add('qp');
    qEl.classList.toggle('full', S.fullLeft > 0);
    ansEl.classList.remove('hid'); ansEl.classList.toggle('ox', !!S.q.ox);
    abs.forEach((b, i) => {
      const on = i < S.q.choices.length; b.style.display = on ? '' : 'none';
      b.className = 'ab'; b.lastElementChild.textContent = on ? S.q.choices[i] : '';
    });
    showPanel(null); hud();
  }
  function answer(i) {
    if (S.mode !== 'play' || S.lock > 0 || !S.q) return;
    const q = S.q, ok = i === q.ansIdx, b = S.brain || { cx: innerWidth / 2, cy: innerHeight / 2, r: 60 };
    abs[i].classList.add('on');
    if (ok) {
      const frac = S.tLeft / S.tMax, mult = S.fullLeft ? 3 : 1;
      const gain = (100 + Math.round(frac * 100) + Math.min(10, S.combo) * 10) * mult;
      S.score += gain; S.combo++; S.idx++;
      abs[i].classList.add('ok'); AU.sfx.ok(S.combo); S.mood = 'happy'; S.moodT = 0;
      pop('+' + gain, 'score', undefined, qEl.getBoundingClientRect().bottom + 6);
      if (S.combo === 3) { pop('NICE', 'nice'); } else if (S.combo === 5) { pop('GREAT', 'great'); AU.sfx.great(); } else if (S.combo >= 8 && (S.combo - 8) % 4 === 0) { pop('PERFECT', ''); AU.sfx.great(); }
      ART.burst('spark', b.cx, b.cy - b.r * 0.3, 10);
      if (S.fullLeft) { S.fullLeft--; ART.burst('ember', b.cx, b.cy - b.r * 0.8, 8); if (!S.fullLeft) { S.gauge = 0; } }
      else { S.gauge++; if (S.gauge >= 5) { S.fullLeft = 5; pop(L('풀가동!', 'FULL POWER!'), 'full'); AU.sfx.full(); ART.burst('ember', b.cx, b.cy - b.r, 26); } }
      S.lock = 0.5;
    } else {
      wrong(i);
    }
    hud();
  }
  function wrong(i, timeup) {
    const b = S.brain || { cx: innerWidth / 2, cy: innerHeight / 2, r: 60 };
    S.hearts--; S.combo = 0; S.miss++; S.gauge = 0; S.fullLeft = 0; qEl.classList.remove('full'); S.timeup = !!timeup;
    if (i != null) abs[i].classList.add('ng');
    abs[S.q.ansIdx].classList.add('ok');                          // 정답 카드는 초록으로 — 글 없이 보여 준다
    abs.forEach((x, j) => { if (j !== S.q.ansIdx && j !== i) x.classList.add('dim'); });
    document.body.classList.remove('hit'); void document.body.offsetWidth; document.body.classList.add('hit');
    pop(timeup ? 'TIME UP' : 'MISS', 'miss');
    if (timeup) AU.sfx.timeup(); else AU.sfx.miss();
    AU.sfx.heart();
    S.mood = 'dizzy'; S.moodT = 0; ART.burst('star', b.cx, b.cy - b.r, 6);
    S.idx++; S.lock = 1.1;
    if (S.hearts <= 0) { S.lock = 1.2; S.dead = true; }
  }
  function afterLock() {
    if (S.mode === 'stage') { nextQ(); return; }
    if (S.mode !== 'play') return;
    if (S.dead) { S.dead = false; gameOver(); return; }
    if (S.idx >= S.N) { stageClear(); return; }
    nextQ();
  }
  function stageClear() {
    S.mode = 'clear'; ansEl.classList.add('hid'); qt.innerHTML = ''; S.mood = 'happy'; S.moodT = 0;
    const stars = Math.max(1, S.hearts);
    prog.stars[S.stage] = Math.max(prog.stars[S.stage] || 0, stars);
    if (S.score > prog.bestScore) prog.bestScore = S.score;
    const last = S.stage >= LAST;
    if (!last) prog.stage = Math.max(prog.stage, S.stage + 1);
    save();
    $('clearStars').innerHTML = [1, 2, 3].map(i => '<span class="' + (i <= stars ? '' : 'off') + '">★</span>').join('');
    $('clearN').textContent = '⭐ ' + S.score + (S.miss === 0 ? '   PERFECT' : '');
    AU.sfx.clear(); AU.bgmStop();
    const b = S.brain; if (b) ART.burst('spark', b.cx, b.cy - b.r, 30);
    try { window.OG && OG.over({ result: last ? 'END' : 'CLEAR', stage: S.stage, score: S.score }); } catch (e) {}
    if (last) { prog.ended = true; save(); const tok = ++endTok; setTimeout(() => { if (tok === endTok && S.mode === 'clear') ending(); }, 900); return; }
    showPanel('clear'); hud();
  }
  let endTok = 0;
  function ending() {
    S.mode = 'ending'; $('endN').textContent = '★ ' + starSum(); showPanel('ending'); AU.sfx.ending();
    const b = S.brain; if (b) ART.burst('spark', b.cx, b.cy - b.r, 40);
  }
  function gameOver() {
    S.mode = 'over'; ansEl.classList.add('hid'); qt.innerHTML = ''; S.mood = 'dizzy'; S.moodT = 0;
    if (S.inf) { if (S.idx - S.miss > prog.bestInf) prog.bestInf = S.idx - S.miss; save(); }
    $('overN').textContent = (S.inf ? '∞ ' + (S.idx - S.miss) + '   ' : '') + '⭐ ' + S.score;
    AU.sfx.over(); AU.bgmStop();
    try { window.OG && OG.over({ result: 'LOSE', stage: S.inf ? 'inf' : S.stage, score: S.score }); } catch (e) {}
    showPanel('over'); hud();
  }

  // ---------------------------------------------------------------- 시간
  function step(dt) {
    S.clock += dt; S.moodT += dt;
    if (S.paused) return;
    if (S.lock > 0) { S.lock -= dt; if (S.lock <= 0) { S.lock = 0; afterLock(); } return; }
    if (S.mode === 'play' && S.q) {
      S.tLeft -= dt;
      const frac = S.tLeft / S.tMax;
      if (frac < 0.3 && S.mood !== 'full') { S.mood = 'sweat'; }
      if (frac < 0.3) { S.tickT -= dt; if (S.tickT <= 0) { S.tickT = frac < 0.15 ? 0.25 : 0.5; AU.sfx.tick(); } }
      if (S.tLeft <= 0) { S.tLeft = 0; wrong(null, true); }
      hud();
    }
    if (S.mood === 'happy' && S.moodT > 0.9 && S.mode === 'play') { S.mood = S.fullLeft ? 'full' : 'think'; }
  }

  // ---------------------------------------------------------------- 그리기
  const cv = $('cv'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    if (W <= 0 || H <= 0) return;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const tb = $('topbar').getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--tb', tb + 'px');
  }
  addEventListener('resize', resize);
  function mascotRect() {
    const tb = $('topbar').getBoundingClientRect().bottom, portrait = H > W;
    if (portrait) {
      if (S.mode === 'title' || S.mode === 'ending') return { x: 0, y: H * 0.48, w: W, h: H * 0.42 };   // 제목·START 아래에 선다
      const qr = qEl.getBoundingClientRect(); return { x: 0, y: tb - 6, w: W, h: Math.max(80, qr.top - tb + 6) };
    }
    if (S.mode === 'title' || S.mode === 'ending') return { x: 0, y: tb, w: W * 0.42, h: H - tb - 20 };
    return { x: 0, y: tb - 10, w: W * 0.36, h: H - tb - 30 };
  }
  function render() {
    if (W <= 0 || H <= 0) return;
    S.portrait = H > W; S.W = W; S.H = H;
    S.brain = ART.draw(ctx, W, H, S, mascotRect(), S.clock);
  }

  // ---------------------------------------------------------------- 입력
  const touch = matchMedia('(pointer:coarse)').matches; if (touch) document.body.classList.add('touch');
  abs.forEach((b, i) => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); AU.unlock(); AU.sfx.tap(); answer(i); });
    b.addEventListener('click', e => e.preventDefault());
  });
  addEventListener('keydown', e => {
    if (e.repeat) return;
    const k = e.key;
    if (S.mode === 'play') {
      if (k >= '1' && k <= '4') answer(+k - 1);
      else if (S.q && S.q.ox && (k === 'o' || k === 'O' || k === 'ArrowLeft')) answer(0);
      else if (S.q && S.q.ox && (k === 'x' || k === 'X' || k === 'ArrowRight')) answer(1);
    }
    if (k === 'Enter' || k === ' ') {
      if (S.mode === 'title') $('start').click(); else if (S.mode === 'clear') $('next').click(); else if (S.mode === 'over') $('retry').click(); else if (S.mode === 'ending') $('endNext').click();
    }
    if (k === 'Escape' || k === 'p' || k === 'P') togglePause();
  });
  $('start').onclick = () => { AU.unlock(); startStage(prog.ended ? Math.min(prog.stage, LAST) : prog.stage); };
  $('inf').onclick = () => { AU.unlock(); startStage(1, true); };
  $('newgame').onclick = () => { prog = { stage: 1, stars: {}, ended: false, bestInf: prog.bestInf, bestScore: prog.bestScore }; save(); toTitle(); };
  $('next').onclick = () => { AU.unlock(); startStage(S.stage + 1); };
  $('retry').onclick = () => { AU.unlock(); startStage(S.stage, S.inf); };
  $('home2').onclick = toTitle; $('endNext').onclick = toTitle;
  function togglePause() {
    if (S.mode !== 'play' && S.mode !== 'stage') return;
    S.paused = !S.paused; panels.pause.classList.toggle('on', S.paused);
    if (S.paused) AU.bgmStop(); else AU.bgmStart();
  }
  $('tPause').onclick = togglePause; $('resume').onclick = togglePause;
  const tB = $('tBgm'), tS = $('tSnd');
  const syncTog = () => { tB.classList.toggle('off', !AU.bgm); tS.classList.toggle('off', !AU.snd); };
  tB.onclick = () => { AU.unlock(); AU.bgm = !AU.bgm; syncTog(); };
  tS.onclick = () => { AU.unlock(); AU.snd = !AU.snd; syncTog(); };
  syncTog();
  document.addEventListener('visibilitychange', () => { if (document.hidden && (S.mode === 'play' || S.mode === 'stage') && !S.paused) togglePause(); });

  // ---------------------------------------------------------------- 루프
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
    if (W !== innerWidth || H !== innerHeight) resize();
    step(dt); render();
    requestAnimationFrame(frame);
  }
  resize(); toTitle(); requestAnimationFrame(frame);

  // 시험 손잡이: 미리보기 창에서는 rAF 가 안 돌므로 tick 으로 프레임을 손으로 돌린다
  window.__fb = { S, get prog() { return prog; }, tick(n) { for (let i = 0; i < (n || 1); i++) step(1 / 60); render(); return S.mode; }, answer, makeQ, kindOf, timeFor, startStage, toTitle, resize, art: ART, snd: AU };
})();
