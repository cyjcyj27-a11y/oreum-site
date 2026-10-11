/* 다중지능 테스트 — 시간표 → 교시 표지 → 문제 → 채점 → 결과 → 답 확인 / 프로필 */
(function () {
'use strict';
const TS = window.TESTS, LANG = TS.EN ? 'en' : 'ko';
const EN = {
  '다중지능 테스트': 'MULTIPLE INTELLIGENCES', '8교시 시간표': '8-Period Timetable', '프로필': 'PROFILE', '시간표': 'TIMETABLE',
  '문항': ' items', '분': ' min', '과제': ' tasks', '교시': 'PERIOD', '시작': 'START', '이어서': 'CONTINUE', '지난 결과': 'LAST RESULT',
  '답안지': 'SHEET', '◀ 이전': '◀ PREV', '다음 ▶': 'NEXT ▶', '제출': 'SUBMIT', '취소': 'CANCEL', '제출할까요?': 'Submit now?',
  '정답': 'Correct', '오답': 'Wrong', '미응답': 'Blank', '시간': 'Time', '답 확인': 'REVIEW', '공유': 'SHARE', '결과': 'RESULT',
  '최고 기록': 'BEST', '시간 종료': "TIME'S UP", '복사했습니다': 'Copied', '채점': 'GRADING', '푼 문제': 'Answered', '최고 기록': 'BEST',
  '재미로 보는 테스트이며 공인 IQ 검사가 아닙니다': 'Just for fun. Not an official IQ test.',
  '재미로 보는 테스트이며 공인 검사가 아닙니다': 'Just for fun. Not an official test.',
  '다중지능 프로필': 'MI PROFILE', '가장 강한 지능': 'Strongest', '듣기': 'LISTEN', '기다려': 'WAIT', '지금!': 'NOW!', '너무 빨라요': 'TOO SOON',
  '반응 속도': 'Reaction', '선에 멈추기': 'Stop on the line', '1부터 순서대로': '1 → 12 in order', '반응': 'React', '정확도': 'Accuracy', '순서': 'Order',
  '탭': 'TAP', '점': ' pts', '미만': ' or less', '이상': '+', '범위 밖': 'Out of range', '범위': 'range', '부분 점수': 'Partial', '감정 읽기': 'Reading', '감정 이해': 'Understanding', '자기 관리': 'Self', '관계 관리': 'Relations', '도형': 'Figure', '수': 'Number', '낱말': 'Verbal', '공간': 'Space', '기억': 'Memory', '설렘': 'excited', '불안': 'anxious', '서운함': 'hurt', '상위': 'Top', '지수': '',
};
const T = s => (LANG === 'en' && EN[s] !== undefined) ? EN[s] : s;
const $ = id => document.getElementById(id);
const body = document.body;

function load(k, d) {
  let v; try { v = localStorage.getItem('iqtest.' + k); v = v == null ? d : JSON.parse(v); } catch (e) { return d; }
  if (v && k.indexOf('res.') === 0 && v.tid !== 'iq' && !v.pts) {
    if (v.m) v.iq = motorPts(v.m.react, +v.m.acc, +v.m.order); else if (v.n) v.iq = Math.round(v.raw / v.n * 100);
    v.pts = 1;
  }
  /* IQ(35문항)·EQ(글 28문항)는 10/10 에 문항을 새로 짜서, 그 전 기록은 맞출 수 없어 버린다 */
  if (v && /^(res|cur|best)\.(iq|eq)$/.test(k) && !v.v3) return d;
  /* 옛 최고 기록(지수)은 버리고 지난 결과의 점수로 */
  if (v && k.indexOf('best.') === 0 && k !== 'best.iq' && !v.pts) { const r = load('res.' + k.slice(5), null); v = r ? { iq: r.iq, pts: 1 } : d; }
  return v;
}
function save(k, v) { try { localStorage.setItem('iqtest.' + k, JSON.stringify(v)); } catch (e) {} }
function drop(k) { try { localStorage.removeItem('iqtest.' + k); } catch (e) {} }

const S = { scr: 'home', t: null, Q: [], idx: 0, ans: [], el: 0, res: null, seed: 0, tms: [], seen: [] };
const ITEMS = {};
const items = (t, seed) => { const k = t.id + ':' + (seed || 0); return ITEMS[k] || (ITEMS[k] = t.build(seed || 0)); };
const limit = () => S.t.min * 60 * 1000;
const N = () => S.Q.length;

/* ---------------- 소리 ---------------- */
let AC = null, bus = null, mbus = null, noiseBuf = null, sndOn = load('snd', 1) !== 0;
function ctx() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
      const comp = AC.createDynamicsCompressor();
      lp.connect(comp); comp.connect(AC.destination);
      bus = AC.createGain(); bus.gain.value = 0.55; bus.connect(lp);
      mbus = AC.createGain(); mbus.gain.value = 0.7; mbus.connect(lp);
    } catch (e) { AC = null; return null; }
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
const ac = () => sndOn ? ctx() : null;
function tone(f, t0, dur, vol, type, out) {
  const a = out ? ctx() : ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + (t0 || 0);
  o.type = type || 'sine'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g); g.connect(out || bus); o.start(t); o.stop(t + dur + 0.05);
}
function bell(f, t0, vol) { tone(f, t0, 1.7, vol, 'sine'); tone(f * 2, t0, 0.7, vol * 0.22, 'sine'); tone(f * 3, t0, 0.25, vol * 0.06, 'sine'); }
function noise(t0, dur, freq, q, vol, to, out) {
  const a = out ? ctx() : ac(); if (!a) return;
  if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + (t0 || 0);
  s.buffer = noiseBuf; f.type = 'bandpass'; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t); if (to) f.frequency.linearRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  s.connect(f); f.connect(g); g.connect(out || bus); s.start(t); s.stop(t + dur + 0.05);
}
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
const SFX = {
  mark() { noise(0, 0.09, 1000, 1.3, 0.55, 650); noise(0.06, 0.08, 850, 1.3, 0.4, 560); tone(196, 0, 0.07, 0.1, 'triangle'); },
  page() { noise(0, 0.17, 480, 0.7, 0.3, 1300); },
  tap() { tone(392, 0, 0.08, 0.13, 'triangle'); },
  tick() { tone(784, 0, 0.05, 0.06, 'sine'); },
  open() { noise(0, 0.24, 380, 0.6, 0.32, 1100); },
  startBell() { [659.25, 523.25, 587.33, 392].forEach((f, i) => bell(f, i * 0.45, 0.2)); },
  endBell() { [392, 587.33, 659.25, 523.25].forEach((f, i) => bell(f, i * 0.45, 0.2)); },
  ok(k) { tone(PENTA[Math.min(k, 5)], 0, 0.16, 0.13, 'triangle'); tone(PENTA[Math.min(k, 5)] / 2, 0, 0.12, 0.05, 'sine'); },
  no() { tone(174.6, 0, 0.12, 0.13, 'triangle'); },
  count(v) { tone(330 + v * 4, 0, 0.035, 0.04, 'triangle'); },
  reveal(hi) {
    const ch = hi ? [523.25, 659.25, 783.99, 1046.5] : [392, 493.88, 587.33, 783.99];
    ch.forEach((f, i) => { tone(f, i * 0.09, 1.4, 0.11, 'triangle'); tone(f / 2, i * 0.09, 1.2, 0.05, 'sine'); });
  },
  stamp() { tone(110, 0, 0.18, 0.25, 'sine'); noise(0, 0.08, 300, 0.8, 0.35); },
};

/* ---------------- 음악 문항 재생(효과음을 꺼도 들린다) ---------------- */
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function note(m, t0, dur) { if (!ctx()) return; tone(mf(m), t0, dur, 0.24, 'triangle', mbus); tone(mf(m) * 2, t0, dur * 0.5, 0.05, 'sine', mbus); tone(mf(m) / 2, t0, dur * 0.8, 0.05, 'sine', mbus); }
function click(t0, acc) { tone(acc ? 880 : 700, t0, 0.07, acc ? 0.24 : 0.18, 'sine', mbus); noise(t0, 0.03, 1100, 1.5, 0.18, 0, mbus); }
let playT = [];
function stopMusic() { playT.forEach(clearTimeout); playT = []; document.querySelectorAll('#stem .lights span.lit').forEach(e => e.classList.remove('lit')); }
function playMusic(m) {
  stopMusic(); if (!ctx()) return;
  const L = $('stem').querySelectorAll('.lights span');
  const at = (ms, i, on) => playT.push(setTimeout(() => { if (L[i]) L[i].classList.toggle('lit', on); }, ms));
  if (m.mk === 'high') m.tones.forEach((n, i) => { note(n, i * 0.8, 0.65); at(i * 800, i, 1); at(i * 800 + 600, i, 0); });
  else if (m.mk === 'diff') [m.mel, m.mel2].forEach((mel, p) => mel.forEach((n, i) => { const t = p * 2.9 + i * 0.45; note(n, t, 0.42); at(t * 1000, i, 1); at(t * 1000 + 380, i, 0); }));
  else for (let b = 0; b < 2; b++) for (let s = 0; s < 8; s++) {
    const t = b * 2.9 + s * 0.3;
    if ((m.pat >> s) & 1) click(t, s === 0);
    if (s % 2 === 0) tone(196, t, 0.05, 0.05, 'sine', mbus);
    at(t * 1000, s, 1); at(t * 1000 + 240, s, 0);
  }
}

/* ---------------- 화면 크기 ---------------- */
function fit() {
  const W = innerWidth, H = innerHeight, land = W / H > 1.1, low = land && H <= 480, big = W >= 1000 && H >= 600;
  const bar = low ? 46 : (big ? 66 : 56), pad = low ? 6 : 10, g = W < 420 || low ? 7 : 10, navH = low ? 52 : 60;
  const r = document.documentElement.style, set = (k, v) => r.setProperty(k, Math.floor(v) + 'px');
  set('--g', g);
  const it = S.Q[S.idx], lay = it ? it.lay : 'mat';
  if (lay === 'mat') {
    let M, O;
    if (land) {
      const aH = H - bar - pad * 2;
      M = Math.min(aH, W * 0.5, 660, (W - pad * 2 - 3 * g - 31) / 2.2);
      const rW = W - M - pad * 2 - 24;
      O = Math.min((rW - 3 * g - 7) / 4, (aH - navH - g * 2 - 7) / 2, 200);
    } else {
      const aW = W - pad * 2, aH = H - bar - pad * 2 - navH - g * 2;
      O = Math.min((aW - 3 * g - 7) / 4, 150);
      M = Math.min(aW, aH - 2 * O - g, 640);
      if (M < aW * 0.72) { M = Math.min(aW, aH * 0.56); O = Math.min(O, (aH - M - g) / 2); }
    }
    set('--M', M); set('--O', O); set('--NW', O * 4 + g * 3 + 7);
  } else if (lay === 'pic') {
    if (land) {
      const aH = H - bar - pad * 2, SW = Math.min(aH, W * 0.46, 620), rW = W - SW - pad * 2 - 24;
      set('--SW', SW); set('--SH', SW); const O = Math.min((rW - g - 7) / 2, (aH - navH - g * 2 - 7) / 2, 240); set('--O', O); set('--NW', O * 2 + g + 7); r.setProperty('--cols', 2);
    } else {
      /* 폰 세로: 보기 2×2 를 크게, 문제 칸은 남는 만큼 */
      const aW = W - pad * 2, aH = H - bar - pad * 2 - navH - g * 2, O = Math.min((aW - g - 7) / 2, (aH * 0.62 - g) / 2, 220);
      set('--SW', aW); set('--SH', Math.min(aW, aH - 2 * O - g - 7)); set('--O', O); set('--NW', O * 2 + g + 7); r.setProperty('--cols', 2);
    }
  } else {
    const n = it.opts.length, grid = it.ol === 'grid' || it.ol === 'one', rows = it.ol === 'one' ? 1 : grid ? Math.ceil(n / 2) : n;
    r.setProperty('--n', n);
    let oh;
    if (land) {
      const aH = H - bar - pad * 2, SW = Math.min(aH * 1.15, W * 0.46), OW = Math.min(W - SW - pad * 2 - 24, 640);
      oh = Math.max(34, Math.min((aH - navH - g - (rows - 1) * g) / rows, grid ? (big ? 170 : 120) : (big ? 112 : 86), it.ol === 'one' ? (big ? 150 : 110) : 999));
      set('--SW', SW); set('--SH', aH); set('--OW', OW);
    } else {
      const aW = W - pad * 2, aH = H - bar - pad * 2 - navH - g * 2;
      oh = Math.max(44, Math.min((aH * 0.54 - (rows - 1) * g) / rows, grid ? 100 : 78));
      set('--SW', aW); set('--SH', aH - rows * oh - (rows - 1) * g - g); set('--OW', aW);
    }
    r.setProperty('--NW', 'var(--OW)');
    set('--oh', oh); set('--ofs', Math.max(15, Math.min(oh * 0.3, big ? 30 : 24)));
  }
  if (S.scr === 'test' || S.scr === 'review') fitText();
  if (S.scr === 'result') { drawCurve(S.shownIq || 100); drawRing(); }
  if (S.scr === 'profile') drawRadar();
  for (const id of ['logo', 'hTitle']) {
    const lg = $(id); lg.style.fontSize = '';
    const w = lg.scrollWidth, max = W * 0.94;
    if (w > max) lg.style.fontSize = (parseFloat(getComputedStyle(lg).fontSize) * max / w).toFixed(1) + 'px';
  }
}
addEventListener('resize', fit);

/* 넘치면 넘친 만큼 글자를 줄인다 */
function shrink(el, box, start, min) {
  let f = start; el.style.fontSize = f + 'px';
  for (let k = 0; k < 60 && f > min && (box.scrollHeight > box.clientHeight + 1 || box.scrollWidth > box.clientWidth + 1); k++) { f -= 1; el.style.fontSize = f + 'px'; }
}
function fitText() {
  const st = $('stem'); if (!st.classList.contains('box')) return;
  const h = st.clientHeight, w = st.clientWidth;
  const cap = st.querySelector('.cap'); if (cap) cap.style.fontSize = Math.max(17, Math.min(h * 0.1, w * 0.068, 32)) + 'px';
  const tx = st.querySelector('.txt'); if (tx) { const short = tx.textContent.length < 22; shrink(tx, st, Math.min(h * (short ? 0.2 : 0.13), w * (short ? 0.13 : 0.08), short ? 64 : 44), 14); }
  const sq = st.querySelector('.seq'); if (sq) shrink(sq, st, Math.min(h * 0.24, w * 0.1, 64), 16);
  const eq = st.querySelector('.eqs'); if (eq) shrink(eq, st, Math.min(h * 0.12, w * 0.085, 48), 14);
  const li = st.querySelector('.lights'); if (li) st.style.setProperty('--lw', Math.max(18, Math.min(w / (li.children.length * 1.5), h * 0.16, 64)) + 'px');
  for (const o of document.querySelectorAll('#opts .opt.t .tt')) { const b = o.parentElement; shrink(o, b, parseFloat(getComputedStyle(b).fontSize), 12); }
}

/* ---------------- 문제 그리기 ---------------- */
const RING = '<svg class="rv" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M52 6C80 5 96 24 95 50 94 78 76 95 49 94 22 93 5 76 6 49 7 24 24 8 58 9" fill="none" stroke="#d8404d" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>';
const SLASH = '<svg class="rv" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M88 10 12 90" fill="none" stroke="#d8404d" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke-width:5px"/></svg>';
const TRI = '<svg class="rv" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 8 94 92 6 92Z" fill="none" stroke="#d8404d" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>';
const SPK = '<svg viewBox="0 0 24 24"><path d="M3 9h4l5-4.5v15L7 15H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

function stemHTML(it, shown) {
  const st = it.stem;
  if (st.t === 'mat') {
    let h = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) h += '<div class="c q' + (shown >= 0 ? ' has' : '') + '" id="qc">' + (shown >= 0 ? it.opts[shown].svg : '<b>?</b>') + '</div>';
      else h += '<div class="c">' + IQ.svg(st.q.mat[r][c]) + '</div>';
    }
    return h;
  }
  const cap = st.cap ? '<div class="cap">' + st.cap + '</div>' : '';
  if (st.t === 'text') return '<div class="txt">' + st.html + '</div>';
  if (st.t === 'pic') return cap + '<div class="pic">' + st.svg + '</div>';
  if (st.t === 'mem') return '<div class="cap">' + st.cap + '</div><div class="seq mem">' + st.digits.split('').map(x => '<b>' + x + '</b>').join('') + '</div><div class="memBar"><i></i></div>';
  if (st.t === 'html') return cap + st.html;
  const m = st.m, k = m.mk === 'high' ? 3 : m.mk === 'diff' ? 5 : 8;
  let sp = ''; for (let i = 0; i < k; i++) sp += '<span>' + (m.mk === 'rhy' ? '' : i + 1) + '</span>';
  return cap + '<div class="play"><button class="omr listen" id="bListen">' + SPK + T('듣기') + '</button><div class="lights' + (m.mk === 'rhy' ? ' steps' : '') + '">' + sp + '</div></div>';
}

function renderQ(dir) {
  stopMusic(); clearTimeout(memT); $('opts').style.visibility = '';
  const it = S.Q[S.idx], rev = S.scr === 'review', my = S.ans[S.idx];
  const stem = $('stem');
  stem.className = it.lay === 'mat' ? 'mat' : 'box';
  stem.innerHTML = stemHTML(it, rev ? it.ans : my);
  const op = $('opts');
  op.className = it.lay === 'mat' ? '' : it.lay === 'pic' ? 'pic' : 'txt ' + (it.ol || 'list') + (it.kind === 'mem' ? ' mem' : '');
  op.innerHTML = it.opts.map((o, i) => {
    const mk = rev && i === it.ans ? RING : rev && i === my ? (o.w === 1 ? TRI : SLASH) : '';
    const cls = 'opt' + (o.svg ? (o.wide ? ' t w' : '') : ' t') + (my === i ? ' on' : '');
    return '<button class="' + cls + '" data-i="' + i + '"><span class="no">' + (i + 1) + '</span>' + (o.svg || '<span class="tt">' + o.t + '</span>') + mk + '</button>';
  }).join('');
  $('qn').innerHTML = (S.idx + 1) + '<small>/' + N() + '</small>';
  $('verdict').textContent = rev ? T(my < 0 ? '미응답' : my === it.ans ? '정답' : it.opts[my].w === 1 ? '부분 점수' : '오답') + (S.tms[S.idx] ? ' · ' + Math.max(1, Math.round(S.tms[S.idx] / 1000)) + (LANG === 'en' ? 's' : '초') : '') : '';
  $('verdict').style.color = rev && my === it.ans ? '#141414' : '';
  $('bPrev').style.opacity = S.idx === 0 ? .4 : 1;
  $('bNext').textContent = S.idx === N() - 1 ? T(rev ? '결과' : '제출') : T('다음 ▶');
  fit();
  if (it.stem.t === 'mem') memShow(it, rev);
  const bl = $('bListen');
  if (bl) { bl.onclick = () => playMusic(it.stem.m); if (!rev) playT.push(setTimeout(() => playMusic(it.stem.m), 400)); }
  if (dir) for (const id of ['stem', 'opts']) {
    const el = $(id); el.classList.remove('flip', 'flipb'); void el.offsetWidth; el.classList.add(dir > 0 ? 'flip' : 'flipb');
  }
}

/* 숫자는 처음 볼 때 한 번만 보여 주고 가린다(돌아와도 다시 안 보여 줌). 보는 동안 보기는 숨긴다 */
let memT = 0;
function memShow(it, rev) {
  clearTimeout(memT);
  const st = $('stem'), seq = st.querySelector('.seq'), bar = st.querySelector('.memBar i'), cap = st.querySelector('.cap'), op = $('opts');
  const hide = () => { seq.innerHTML = it.stem.digits.split('').map(() => '<b class="qm">?</b>').join(''); st.querySelector('.memBar').style.visibility = 'hidden'; cap.style.visibility = ''; op.style.visibility = ''; fitText(); };
  if (rev) { st.querySelector('.memBar').style.visibility = 'hidden'; return; }
  if (S.seen[S.idx]) return hide();
  S.seen[S.idx] = 1; persist();
  const ms = 1500 + it.stem.digits.length * 600;
  cap.style.visibility = 'hidden'; op.style.visibility = 'hidden';
  bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
  bar.style.transition = 'width ' + ms + 'ms linear'; bar.style.width = '0%';
  memT = setTimeout(() => { hide(); SFX.page(); }, ms);
}
let advT = 0;
function choose(i) {
  if (S.scr !== 'test' || !(i >= 0 && i < S.Q[S.idx].opts.length)) return;
  const first = S.ans[S.idx] < 0;
  S.ans[S.idx] = i;
  SFX.mark();
  for (const b of $('opts').children) b.classList.toggle('on', +b.dataset.i === i);
  const qc = $('qc');
  if (qc) { qc.className = 'c q has'; qc.innerHTML = S.Q[S.idx].opts[i].svg; }
  persist();
  clearTimeout(advT);
  if (first) advT = setTimeout(() => { if (S.scr !== 'test') return; if (S.idx < N() - 1) go(S.idx + 1); else openSheet(); }, 430);
}
function go(i) {
  if (i < 0 || i >= N() || i === S.idx) return;
  clearTimeout(memT); $('opts').style.visibility = '';
  clearTimeout(advT);
  const dir = i > S.idx ? 1 : -1;
  S.idx = i; SFX.page(); renderQ(dir); persist();
}
function next() {
  if (S.idx < N() - 1) return go(S.idx + 1);
  if (S.scr === 'review') return showResult(S.res, false);
  askSubmit();
}

/* ---------------- 시간: 화면을 보고 있을 때만 흐른다 ---------------- */
let lastT = performance.now(), lastSec = -1, saveT = 0;
function fmt(ms) { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function tickTimer() {
  const now = performance.now(), dt = Math.min(now - lastT, 1000); lastT = now;
  if (S.scr !== 'test' || document.hidden) return;
  S.el += dt; S.tms[S.idx] = (S.tms[S.idx] || 0) + dt;
  const rem = Math.max(0, limit() - S.el), sec = Math.ceil(rem / 1000);
  const tm = $('tm'); tm.textContent = fmt(rem); tm.classList.toggle('warn', rem < 60000);
  if (sec !== lastSec) { if (sec <= 10 && sec > 0) SFX.tick(); lastSec = sec; }
  if ((saveT += dt) > 2000) { saveT = 0; persist(); }
  if (rem <= 0) { toast(T('시간 종료')); submit(); }
}
setInterval(tickTimer, 200);
function persist() { if (S.scr === 'test') save('cur.' + S.t.id, { v3: 1, seed: S.seed, ans: S.ans, el: S.el, idx: S.idx, tms: S.tms, seen: S.seen }); }
addEventListener('pagehide', persist);
document.addEventListener('visibilitychange', () => { lastT = performance.now(); if (document.hidden) { persist(); stopMusic(); } });

/* ---------------- OMR 답안지 ---------------- */
const GR_OK = '<svg class="g" viewBox="0 0 40 40"><path d="M21 4C32 4 37 12 36 21 35 31 27 36 19 36 10 35 4 28 4 20 5 11 12 5 25 6" fill="none" stroke="#d8404d" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur=".22s" fill="freeze"/></path></svg>';
const GR_MID = '<svg class="g" viewBox="0 0 40 40"><path d="M20 5 36 34 4 34Z" fill="none" stroke="#d8404d" stroke-width="3" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur=".2s" fill="freeze"/></path></svg>';
const GR_NO = '<svg class="g" viewBox="0 0 40 40"><path d="M34 6 7 35" fill="none" stroke="#d8404d" stroke-width="3.4" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"><animate attributeName="stroke-dashoffset" from="1" to="0" dur=".14s" fill="freeze"/></path></svg>';
let sheetMode = 'test';
function buildRows(marks) {
  const n = N(), per = Math.ceil(n / (innerWidth / innerHeight > 1.1 && innerHeight <= 480 ? 3 : 2));
  $('rows').style.gridTemplateRows = 'repeat(' + per + ',auto)';
  let h = '';
  for (let i = 0; i < n; i++) {
    h += '<div class="row' + (i === S.idx && sheetMode !== 'grade' ? ' cur' : '') + '" data-i="' + i + '"><span class="n" style="position:relative">' + (i + 1) + (marks && marks[i] ? marks[i] : '') + '</span>';
    for (let k = 0; k < S.Q[i].opts.length; k++) h += '<span class="b' + (S.ans[i] === k ? ' on' : '') + '">' + (k + 1) + '</span>';
    h += '</div>';
  }
  $('rows').innerHTML = h;
}
function openSheet() {
  stopMusic();
  sheetMode = S.scr === 'review' ? 'review' : 'test';
  if (sheetMode === 'review') {
    buildRows(S.Q.map((q, i) => (S.ans[i] === q.ans ? GR_OK : S.ans[i] >= 0 && q.opts[S.ans[i]].w === 1 ? GR_MID : GR_NO).replace(/dur="[^"]+"/, 'dur=".01s"')));
    $('sCnt').textContent = T('정답') + ' ' + S.res.raw + '/' + N();
    $('sFt').innerHTML = '<button class="omr" id="bToRes">' + T('결과') + '</button>';
    $('bToRes').onclick = () => { closeSheet(); showResult(S.res, false); };
  } else {
    buildRows(null);
    $('sCnt').textContent = T('푼 문제') + ' ' + S.ans.filter(a => a >= 0).length + '/' + N();
    $('sFt').innerHTML = '<button class="omr" id="bToHome">' + T('시간표') + '</button><button class="pen" id="bSubmit">' + T('제출') + '</button>';
    $('bSubmit').onclick = askSubmit;
    $('bToHome').onclick = () => { persist(); closeSheet(); showHome(); };
  }
  $('sX').style.display = '';
  $('sheetO').classList.add('show');
  SFX.open();
  const cur = $('rows').children[S.idx]; if (cur) cur.scrollIntoView({ block: 'nearest' });
}
function closeSheet() { $('sheetO').classList.remove('show'); }
$('rows').addEventListener('click', e => {
  if (sheetMode === 'grade') return;
  const r = e.target.closest('.row'); if (!r) return;
  closeSheet(); go(+r.dataset.i);
});
$('sX').onclick = () => { if (sheetMode !== 'grade') { closeSheet(); SFX.tap(); } };
$('sheetO').addEventListener('click', e => { if (e.target.id === 'sheetO' && sheetMode !== 'grade') closeSheet(); });

/* ---------------- 제출·채점 ---------------- */
function askSubmit() {
  const u = S.ans.filter(a => a < 0).length;
  $('askP').textContent = T('제출할까요?');
  $('askS').textContent = u ? (LANG === 'en' ? u + ' unanswered' : '안 푼 문제 ' + u + '개') : '';
  $('askO').classList.add('show'); SFX.tap();
}
$('askN').onclick = () => { $('askO').classList.remove('show'); SFX.tap(); };
$('askY').onclick = () => { $('askO').classList.remove('show'); submit(); };
$('askO').addEventListener('click', e => { if (e.target.id === 'askO') $('askO').classList.remove('show'); });

function phi(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
/* 평균 위면 "상위 n%", 아래면 "하위 n%" */
function rank(v) {
  const p = (1 - phi((v - 100) / 15)) * 100, top = p <= 50, x = top ? p : 100 - p;
  return { top, n: x >= 10 ? String(Math.round(x)) : x >= 1 ? x.toFixed(1) : x.toFixed(2) };
}
function rankHTML(v) { const r = rank(v); return (LANG === 'en' ? (r.top ? 'Top ' : 'Bottom ') : (r.top ? '상위 ' : '하위 ')) + '<b>' + r.n + '</b>%'; }
function rankText(v) { return rankHTML(v).replace(/<\/?b>/g, ''); }

function finishRes(res) {
  const best = load('best.' + res.tid, null);
  /* 도장은 앞 기록을 넘었을 때만(첫 판은 기록만 남긴다) */
  res.best = !!best && res.iq > best.iq;
  if (!best || res.iq > best.iq) save('best.' + res.tid, { iq: res.iq, pts: 1, v2: 1, v3: 1 });
  save('res.' + res.tid, res); drop('cur.' + res.tid);
  S.res = res;
}
function submit() {
  if (S.scr !== 'test') return;
  clearTimeout(advT); stopMusic();
  const t = S.t, ok = S.Q.map((q, i) => S.ans[i] === q.ans);
  const raw = ok.filter(Boolean).length;
  const res = { v3: 1, v2: 1, pts: 1, tid: t.id, seed: S.seed, ans: S.ans.slice(), tms: S.tms.map(Math.round), raw, n: N(), iq: t.id === 'iq' ? TS.idx(raw, N(), t.mu, t.sd) : Math.round(raw / N() * 100), el: Math.min(S.el, limit()), at: Date.now() };
  if (t.weighted) {
    const w = i => S.ans[i] >= 0 ? S.Q[i].opts[S.ans[i]].w : 0;
    const part = sb => { const ix = S.Q.map((q, i) => i).filter(i => !sb || S.Q[i].sub === sb); return Math.round(ix.reduce((a, i) => a + w(i), 0) / (2 * ix.length) * 100); };
    res.iq = part(null);
    res.sub = { read: part('read'), know: part('know'), self: part('self'), rel: part('rel') };
    res.sub.inter = Math.round((res.sub.read + res.sub.rel) / 2); res.sub.intra = Math.round((res.sub.know + res.sub.self) / 2);
  }
  if (t.id === 'iq') {
    const part = kd => { const ix = S.Q.map((q, i) => i).filter(i => S.Q[i].kind === kd); return ix.filter(i => ok[i]).length + '/' + ix.length; };
    res.kinds = { mat: part('mat'), num: part('num'), verb: part('verb'), space: part('space'), mem: part('mem') };
  }
  finishRes(res);
  S.scr = 'grade';
  SFX.endBell();
  grade(res);
}
function grade(res) {
  sheetMode = 'grade';
  buildRows(null);
  $('sCnt').textContent = T('채점');
  $('sFt').innerHTML = '';
  $('sX').style.display = 'none';
  $('sheetO').classList.add('show');
  const rows = $('rows').children, n = N();
  let i = 0, ok = 0;
  const step = () => {
    if (i >= n) {
      $('sCnt').innerHTML = '<b style="color:#d8404d;font-size:26px">' + res.raw + '</b> / ' + n;
      SFX.stamp();
      setTimeout(() => { closeSheet(); showResult(res, true); }, 1100);
      return;
    }
    const good = res.ans[i] === S.Q[i].ans, half = !good && res.ans[i] >= 0 && S.Q[i].opts[res.ans[i]].w === 1;
    rows[i].querySelector('.n').insertAdjacentHTML('beforeend', good ? GR_OK : half ? GR_MID : GR_NO);
    rows[i].scrollIntoView({ block: 'nearest' });
    if (good) SFX.ok(ok++ % 6); else SFX.no();
    i++; setTimeout(step, 1600 / n + 40);
  };
  setTimeout(step, 700);
}

/* ---------------- 결과 ---------------- */
function drawCurve(v) {
  if (S.t && S.t.id !== 'iq') return drawScore(v);
  const X = x => 20 + (x - 55) / 90 * 480, BASE = 140, AMP = 118;
  const Y = x => BASE - AMP * Math.exp(-Math.pow((x - 100) / 15, 2) / 2);
  let d = '', fill = 'M' + X(55) + ' ' + BASE;
  for (let x = 55; x <= 145; x += 1) { d += (x === 55 ? 'M' : 'L') + X(x).toFixed(1) + ' ' + Y(x).toFixed(1); if (x <= v) fill += 'L' + X(x).toFixed(1) + ' ' + Y(x).toFixed(1); }
  fill += 'L' + X(v).toFixed(1) + ' ' + Y(v).toFixed(1) + 'L' + X(v).toFixed(1) + ' ' + BASE + 'Z';
  let s = '<path d="' + fill + '" fill="#fbe3e5"/><path d="' + d + '" fill="none" stroke="#141414" stroke-width="3"/>';
  s += '<line x1="12" y1="' + BASE + '" x2="508" y2="' + BASE + '" stroke="#141414" stroke-width="2"/>';
  for (const x of [70, 85, 100, 115, 130, 145]) {
    s += '<line x1="' + X(x) + '" y1="' + BASE + '" x2="' + X(x) + '" y2="' + (BASE + 6) + '" stroke="#141414" stroke-width="2"/>';
    s += '<text x="' + X(x) + '" y="' + (BASE + 26) + '" text-anchor="middle" font-size="19" font-weight="800" fill="#8a857a" font-family="SUIT,sans-serif">' + x + '</text>';
  }
  s += '<line x1="' + X(v) + '" y1="' + BASE + '" x2="' + X(v) + '" y2="' + (Y(v) - 14) + '" stroke="#d8404d" stroke-width="4"/><circle cx="' + X(v) + '" cy="' + (Y(v) - 14) + '" r="8" fill="#d8404d"/>';
  $('curve').innerHTML = s;
}
function drawRing() {
  const box = $('iq'), w = box.offsetWidth * 1.28, h = box.offsetHeight * 1.22;
  if (!w) return;
  const P = (x, y) => (x * w / 100).toFixed(1) + ' ' + (y * h / 100).toFixed(1);
  $('ring').setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h.toFixed(1));
  $('ringp').setAttribute('d', 'M' + P(50, 4) + 'C' + P(82, 3) + ' ' + P(98, 22) + ' ' + P(97, 50) + 'C' + P(96, 80) + ' ' + P(76, 97) + ' ' + P(48, 96) +
    'C' + P(20, 95) + ' ' + P(3, 78) + ' ' + P(4, 50) + 'C' + P(5, 24) + ' ' + P(22, 6) + ' ' + P(58, 7));
}
const EQSUB = { read: '감정 읽기', know: '감정 이해', self: '자기 관리', rel: '관계 관리' };
const IQKIND = { mat: '도형', num: '수', verb: '낱말', space: '공간', mem: '기억' };
/* IQ 는 점수 하나 대신 범위로(±5), 85 아래·145 위는 재지 않는다 */
function iqShow(v) {
  if (v < 85) { $('iqn').textContent = 85; $('iqu').textContent = T('미만'); $('pct').innerHTML = T('범위 밖'); return; }
  if (v >= 145) { $('iqn').textContent = 145; $('iqu').textContent = T('이상'); $('pct').innerHTML = rankHTML(145); return; }
  $('iqn').textContent = v; $('iqu').textContent = '';
  $('pct').innerHTML = rankHTML(v) + '<span class="rng"> · ' + T('범위') + ' ' + Math.max(85, v - 5) + '~' + Math.min(145, v + 5) + '</span>';
}
const stat = (k, v, u) => '<span class="stat"><small>' + k + '</small><span>' + v + '</span>' + (u ? '<small>' + u + '</small>' : '') + '</span>';
const periodName = t => LANG === 'en' ? 'PERIOD ' + t.no + ' · ' + t.name : t.no + '교시 ' + t.name;
/* 100점 만점 눈금자: 시험지 자처럼 0~100, 맞힌 만큼 분홍으로 칠한다 */
function drawScore(v) {
  const X = x => 20 + x / 100 * 480, Y0 = 70, H = 46;
  let s = '<rect x="20" y="' + Y0 + '" width="480" height="' + H + '" fill="#fff" stroke="#141414" stroke-width="3"/>';
  s += '<rect x="21.5" y="' + (Y0 + 1.5) + '" width="' + Math.max(0, X(v) - 21.5).toFixed(1) + '" height="' + (H - 3) + '" fill="#fbe3e5"/>';
  for (let x = 0; x <= 100; x += 5) s += '<line x1="' + X(x) + '" y1="' + (Y0 + H) + '" x2="' + X(x) + '" y2="' + (Y0 + H - (x % 10 ? 9 : 17)) + '" stroke="#141414" stroke-width="2"/>';
  for (let x = 0; x <= 100; x += 20) s += '<text x="' + X(x) + '" y="' + (Y0 + H + 30) + '" text-anchor="middle" font-size="21" font-weight="800" fill="#8a857a" font-family="SUIT,sans-serif">' + x + '</text>';
  s += '<line x1="' + X(v) + '" y1="' + (Y0 - 18) + '" x2="' + X(v) + '" y2="' + (Y0 + H) + '" stroke="#d8404d" stroke-width="5"/><circle cx="' + X(v) + '" cy="' + (Y0 - 20) + '" r="9" fill="#d8404d"/>';
  $('curve').innerHTML = s;
}
let countT = 0;
function showResult(res, anim) {
  closeSheet(); stopMusic();
  const t = TS.byId(res.tid);
  S.t = t; S.scr = 'result'; S.res = res;
  if (!t.motor) { S.Q = items(t, res.seed); S.ans = res.ans.slice(); }
  setScreen();
  $('rName').textContent = periodName(t);
  $('rTag').textContent = t.tag;
  $('fine').textContent = T(t.id === 'iq' ? '재미로 보는 테스트이며 공인 IQ 검사가 아닙니다' : '재미로 보는 테스트이며 공인 검사가 아닙니다');
  const mini = (k, v) => '<span class="stat mini"><small>' + k + '</small><span>' + v + '</span></span>';
  $('stats').innerHTML = t.motor
    ? stat(T('반응'), res.m.react, 'ms') + stat(T('정확도'), '±' + res.m.acc, '%') + stat(T('순서'), res.m.order, LANG === 'en' ? 's' : '초')
    : t.weighted && res.sub
    ? ['read', 'know', 'self', 'rel'].map(k => mini(T(EQSUB[k]), res.sub[k])).join('') + stat(T('시간'), fmt(res.el))
    : stat(T('정답'), res.raw, '/' + res.n) + stat(T('시간'), fmt(res.el)) +
      (res.kinds ? '<span class="br"></span>' + ['mat', 'num', 'verb', 'space', 'mem'].map(k => mini(T(IQKIND[k]), res.kinds[k])).join('') : '');
  $('bReview').style.display = t.motor ? 'none' : '';
  $('newbest').classList.remove('show');
  const ring = $('ringp'), pm = t.id !== 'iq';
  $('pct').style.display = pm ? 'none' : '';
  $('iqu').textContent = pm ? T('점') : '';
  clearInterval(countT);
  const end = () => {
    S.shownIq = res.iq;
    $('iqn').textContent = res.iq; $('pct').innerHTML = rankHTML(res.iq); if (!pm) iqShow(res.iq); drawCurve(res.iq); drawRing();
    ring.style.transition = anim ? 'stroke-dashoffset .5s ease-out' : 'none';
    ring.style.strokeDashoffset = '0';
    if (anim) { SFX.reveal(res.iq >= (pm ? 60 : 100)); if (res.best) setTimeout(() => { $('newbest').classList.add('show'); SFX.stamp(); }, 650); }
  };
  ring.style.strokeDasharray = '1'; ring.style.transition = 'none'; ring.style.strokeDashoffset = '1';
  if (!anim) return end();
  const from = pm ? 0 : 55;
  let v = from; const t0 = performance.now(), dur = 1500;
  countT = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    const nv = Math.round(from + (res.iq - from) * e);
    if (nv !== v) { v = nv; SFX.count((v - from) * (pm ? .75 : 1)); }
    S.shownIq = v; $('iqn').textContent = v; $('pct').innerHTML = rankHTML(v); drawCurve(v);
    if (k >= 1) { clearInterval(countT); end(); }
  }, 40);
}

/* ---------------- 다중지능 프로필 (8각 그래프) ---------------- */
function profileVals() {
  const r = id => load('res.' + id, null), eq = r('eq'), out = {};
  for (const k of ['lang', 'logic', 'space', 'music', 'body', 'nature']) { const x = r(k); out[k] = x ? x.iq : null; }
  out.inter = eq && eq.sub ? eq.sub.inter : null;
  out.intra = eq && eq.sub ? eq.sub.intra : null;
  return out;
}
function drawRadar() {
  const V = profileVals(), A = TS.AXES, C = 200, Rr = 132;
  const pt = (i, f) => { const a = -Math.PI / 2 + i * Math.PI * 2 / A.length; return [C + Math.cos(a) * Rr * f, C + Math.sin(a) * Rr * f]; };
  const f = v => Math.max(0.06, Math.min(1, v / 100));
  const poly = fn => A.map((a, i) => pt(i, fn(a)).map(n => n.toFixed(1)).join(',')).join(' ');
  let s = '';
  for (const lv of [1, 0.75, 0.5, 0.25]) s += '<polygon points="' + poly(() => lv) + '" fill="' + (lv === 1 ? '#fff' : 'none') + '" stroke="' + (lv === 1 ? '#141414' : '#d6d1c4') + '" stroke-width="' + (lv === 1 ? 2.5 : 1.5) + '"/>';
  A.forEach((_, i) => { const [x, y] = pt(i, 1); s += '<line x1="' + C + '" y1="' + C + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#d6d1c4" stroke-width="1.5"/>'; });
  const has = A.filter(a => V[a.k] != null);
  if (has.length) {
    s += '<polygon points="' + poly(a => V[a.k] == null ? 0.06 : f(V[a.k])) + '" fill="rgba(216,64,77,.18)" stroke="#d8404d" stroke-width="3.5" stroke-linejoin="round"/>';
    A.forEach((a, i) => { if (V[a.k] != null) { const [x, y] = pt(i, f(V[a.k])); s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6" fill="#d8404d"/>'; } });
  }
  A.forEach((a, i) => {
    const [x, y] = pt(i, 1.17), anc = Math.abs(x - C) < 10 ? 'middle' : x < C ? 'end' : 'start';
    s += '<text x="' + x.toFixed(1) + '" y="' + (y - 2).toFixed(1) + '" text-anchor="' + anc + '" font-size="22" font-weight="900" fill="#141414" font-family="SUIT,sans-serif">' + a.name + '</text>';
    s += '<text x="' + x.toFixed(1) + '" y="' + (y + 24).toFixed(1) + '" text-anchor="' + anc + '" font-size="24" fill="' + (V[a.k] == null ? '#b9b3a3' : '#d8404d') + '" font-family="A2Z,SUIT,sans-serif">' + (V[a.k] == null ? '?' : V[a.k]) + '</text>';
  });
  $('radar').setAttribute('viewBox', '-80 -40 560 480');
  $('radar').innerHTML = s;
  const top = has.slice().sort((a, b) => V[b.k] - V[a.k])[0];
  $('pTop').innerHTML = top ? T('가장 강한 지능') + ' <b>' + top.name + '</b>' : '';
  const iq = load('res.iq', null), eqr = load('res.eq', null);
  $('pIQ').innerHTML = stat('IQ', iq ? iq.iq : '?') + stat('EQ', eqr ? eqr.iq + T('점') : '?');
}
function showProfile() { stopMusic(); S.scr = 'profile'; setScreen(); drawRadar(); SFX.page(); }

/* ---------------- 시간표·교시 표지 ---------------- */
function setScreen() {
  body.className = 's-' + (S.scr === 'grade' ? 'result' : S.scr);
  $('tm').style.display = S.scr === 'review' ? 'none' : '';
  fit();
}
const metaOf = t => t.motor ? (LANG === 'en' ? '3 tasks · 3 min' : '과제 3개 · 3분') : items(t).length + T('문항') + ' · ' + t.min + T('분');
const redFirst = s => { const i = s.indexOf(' '); return i < 0 ? '<span class="q">' + s + '</span>' : '<span class="q">' + s.slice(0, i) + '</span>' + s.slice(i); };
function showHome() {
  stopMusic(); closeSheet();
  S.scr = 'home'; S.Q = []; S.idx = 0;
  $('cards').innerHTML = TS.list.map(t => {
    const r = load('res.' + t.id, null);
    return '<button class="card" data-id="' + t.id + '"><span class="no"><b>' + t.no + '</b>' + T('교시') + '</span><span><span class="nm">' + t.name + '</span><span class="mt" style="display:block">' + metaOf(t) + '</span></span>' +
      (r ? '<span class="sc">' + r.iq + (t.id === 'iq' ? '' : T('점')) + '</span>' : '') + '</button>';
  }).join('');
  setScreen();
}
function teaser(t) {
  const box = h => '<div>' + h + '</div>', q = '<div><b>?</b></div>', tx = s => box('<span class="tx">' + s + '</span>');
  const A = (ty, c) => IQ.svg({ f: 'A', comps: [{ k: 'center', type: ty, size: 3, color: c, pos: 1 }] });
  const L = TS.L;
  switch (t.id) {
    case 'iq': { const sp = GEN.space()[2]; return box(A(1, 2)) + tx('2·4·8') + tx(L('새 : 둥지', 'Bird : Nest')) + box(sp.stemSvg) + q; }
    case 'eq': return [L('설렘', 'excited'), L('불안', 'anxious'), L('서운함', 'hurt')].map(tx).join('') + q;
    case 'lang': return [L('의사', 'Doctor'), L('병원', 'Hospital'), L('교사', 'Teacher')].map(tx).join('') + q;
    case 'logic': return ['2', '4', '8'].map(tx).join('') + q;
    case 'space': { const it = GEN.space()[1]; return box(it.stemSvg) + box(it.optSvg[it.ans]) + box(it.optSvg[(it.ans + 1) % 4]) + q; }
    case 'music': return [62, 38, 50].map(y => box('<svg viewBox="0 0 100 100"><path d="M20 30H80M20 42H80M20 54H80M20 66H80M20 78H80" stroke="#c9c4b6" stroke-width="2"/><ellipse cx="44" cy="' + y + '" rx="11" ry="8" transform="rotate(-20 44 ' + y + ')" fill="#141414"/><path d="M54 ' + (y - 2) + 'V' + (y - 40) + '" stroke="#141414" stroke-width="4"/></svg>')).join('') + q;
    case 'body': return ['1', '2', '3'].map(tx).join('') + q;
    default: return [L('개미', 'ant'), L('벌', 'bee'), L('나비', 'butterfly')].map(tx).join('') + q;
  }
}
function showCover(t) {
  stopMusic();
  S.t = t; S.scr = 'title'; S.Q = t.motor ? [] : items(t);
  $('tPeriod').textContent = LANG === 'en' ? 'PERIOD ' + t.no : '제 ' + t.no + ' 교시';
  $('logo').innerHTML = redFirst(t.name);
  $('tArea').textContent = t.area;
  $('teaser').innerHTML = teaser(t);
  $('tN').textContent = t.motor ? 3 : S.Q.length; $('tNu').textContent = t.motor ? T('과제') : T('문항');
  $('tMin').textContent = t.min; $('tMu').textContent = T('분');
  const cur = load('cur.' + t.id, null), last = load('res.' + t.id, null), best = load('best.' + t.id, null);
  $('bResume').style.display = cur && !t.motor ? '' : 'none';
  $('bLast').style.display = last && !cur ? '' : 'none';
  $('best').innerHTML = best ? T('최고 기록') + ' ' + t.tag + ' <b>' + best.iq + '</b>' + (t.id === 'iq' ? '' : T('점')) : '';
  setScreen(); SFX.page();
}
function startTest(resume) {
  const t = S.t;
  if (t.motor) return startMotor();
  const cur = resume ? load('cur.' + t.id, null) : null;
  S.seed = cur ? cur.seed || 0 : t.seeded ? 1 + Math.floor(Math.random() * 9999) : 0;
  S.Q = items(t, S.seed);
  S.ans = cur ? cur.ans : new Array(S.Q.length).fill(-1);
  S.tms = cur && cur.tms ? cur.tms : new Array(S.Q.length).fill(0);
  S.seen = cur && cur.seen ? cur.seen : [];
  S.el = cur ? cur.el : 0; S.idx = cur ? cur.idx : 0;
  S.scr = 'test'; lastT = performance.now(); lastSec = -1;
  $('tm').textContent = fmt(limit() - S.el); $('tm').classList.remove('warn');
  setScreen(); renderQ(0);
  if (!resume) SFX.startBell(); else SFX.page();
  persist();
}
function startReview() {
  S.scr = 'review'; S.Q = items(S.t, S.res.seed); S.ans = S.res.ans.slice(); S.tms = S.res.tms || []; S.idx = 0;
  setScreen(); renderQ(0); SFX.page();
}

/* ---------------- 신체운동: 반응 속도 · 선에 멈추기 · 1부터 순서대로 ---------------- */
let MO = null, mRaf = 0, mTimer = 0;
function mDots(n, k) { $('mDots').innerHTML = Array.from({ length: n }, (_, i) => '<span' + (i < k ? ' class="on"' : '') + '></span>').join(''); }
function stopMotor() { clearTimeout(mTimer); cancelAnimationFrame(mRaf); $('mArea').onpointerdown = null; }
function startMotor() {
  stopMusic(); stopMotor();
  S.scr = 'motor'; setScreen();
  MO = { react: [], acc: [], order: 0, miss: 0 };
  $('mArea').className = ''; $('mArea').innerHTML = ''; $('mName').textContent = ''; mDots(0, 0);
  SFX.startBell(); mTimer = setTimeout(taskReact, 1500);
}
function taskReact() {
  $('mName').textContent = '1. ' + T('반응 속도');
  const A = $('mArea'), tries = 5; let state = 'wait', t0 = 0, k = 0;
  const arm = () => {
    state = 'wait'; A.className = ''; A.innerHTML = '<div class="big">' + T('기다려') + '</div>'; mDots(tries, k);
    mTimer = setTimeout(() => { state = 'go'; A.className = 'go'; A.innerHTML = '<div class="big">' + T('지금!') + '</div>'; t0 = performance.now(); tone(523.25, 0, 0.14, 0.16, 'triangle'); }, 1200 + Math.random() * 2200);
  };
  A.onpointerdown = e => {
    e.preventDefault();
    if (state === 'wait') { clearTimeout(mTimer); state = 'pause'; A.innerHTML = '<div class="big">' + T('너무 빨라요') + '</div>'; SFX.no(); mTimer = setTimeout(arm, 1100); }
    else if (state === 'go') {
      const ms = Math.round(performance.now() - t0); MO.react.push(ms); k++; state = 'pause';
      A.className = ''; A.innerHTML = '<div class="big">' + ms + '<span class="small">ms</span></div>'; SFX.mark(); mDots(tries, k);
      mTimer = setTimeout(k >= tries ? taskStop : arm, 900);
    }
  };
  arm();
}
function taskStop() {
  $('mName').textContent = '2. ' + T('선에 멈추기');
  const A = $('mArea'), tries = 5; let k = 0, run = false, sp = 0, tgt = 0.5, t0 = 0;
  /* 위치는 흐른 시간으로 정한다(화면이 늦게 그려져도 누른 순간의 자리가 맞게) */
  const posAt = now => { const u = ((now - t0) / 1000 * sp) % 2; return u < 1 ? u : 2 - u; };
  A.className = '';
  A.innerHTML = '<div class="ruler"><div class="tgt"></div><div class="mk"></div></div><div class="big" id="mMsg" style="position:absolute;bottom:10%;left:0;right:0;font-size:clamp(24px,7vw,46px)"></div>';
  const tg = A.querySelector('.tgt'), mk = A.querySelector('.mk'), msg = $('mMsg');
  const loop = () => {
    if (!run) return;
    mk.style.left = (posAt(performance.now()) * 100) + '%'; mRaf = requestAnimationFrame(loop);
  };
  const arm = () => { tgt = 0.2 + Math.random() * 0.6; tg.style.left = (tgt * 100) + '%'; sp = 0.5 + k * 0.13; run = true; t0 = performance.now(); msg.textContent = ''; mDots(tries, k); loop(); };
  A.onpointerdown = e => {
    e.preventDefault(); if (!run) return;
    run = false; cancelAnimationFrame(mRaf);
    const x = posAt(performance.now()); mk.style.left = (x * 100) + '%';
    const err = Math.abs(x - tgt) * 100; MO.acc.push(err); k++;
    msg.textContent = '±' + err.toFixed(1) + '%'; if (err < 2) SFX.ok(4); else SFX.mark(); mDots(tries, k);
    mTimer = setTimeout(k >= tries ? taskOrder : arm, 900);
  };
  arm();
}
function taskOrder() {
  $('mName').textContent = '3. ' + T('1부터 순서대로'); $('mDots').innerHTML = '';
  const A = $('mArea'), n = 12; A.className = ''; A.innerHTML = '';
  const w = A.clientWidth, h = A.clientHeight, bw = Math.max(40, Math.min(72, Math.min(w, h) / 5.5));
  A.style.setProperty('--bw', bw + 'px');
  const pts = [];
  for (let i = 0; i < n; i++) {
    let p, t = 0;
    do { p = [bw * 0.7 + Math.random() * (w - bw * 1.4), bw * 0.8 + Math.random() * (h - bw * 1.6)]; t++; }
    while (t < 400 && pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < bw * 1.3));
    pts.push(p);
  }
  A.innerHTML = pts.map((p, i) => '<span class="bub" data-n="' + (i + 1) + '" style="left:' + p[0].toFixed(0) + 'px;top:' + p[1].toFixed(0) + 'px">' + (i + 1) + '</span>').join('');
  let nx = 1, t0 = 0;
  A.onpointerdown = e => {
    const b = e.target.closest('.bub'); if (!b || b.classList.contains('done')) return;
    if (+b.dataset.n === nx) {
      if (nx === 1) t0 = performance.now();
      b.classList.add('done'); SFX.ok(Math.min(5, Math.floor(nx / 2))); nx++;
      if (nx > n) { MO.order = (performance.now() - t0) / 1000; A.onpointerdown = null; mTimer = setTimeout(motorDone, 500); }
    } else { MO.miss++; b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); SFX.no(); }
  };
}
/* 신체운동 100점: 반응 200ms·오차 0%·순서 6초면 만점, 500ms·20%·26초면 0점 */
function motorPts(r, a, o) {
  const c = x => Math.max(0, Math.min(100, x));
  return Math.round((c((500 - r) / 3) + c(100 - a * 5) + c((26 - o) * 5)) / 3);
}
function motorDone() {
  const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
  const r = avg(MO.react), a = avg(MO.acc), o = MO.order + MO.miss;
  const res = { pts: 1, tid: 'body', iq: motorPts(r, a, o), m: { react: Math.round(r), acc: a.toFixed(1), order: o.toFixed(1) }, at: Date.now() };
  finishRes(res); SFX.endBell();
  mTimer = setTimeout(() => showResult(res, true), 400);
}

/* ---------------- 공유·단추·건반 ---------------- */
function toast(s) { const t = $('toast'); t.textContent = s; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1600); }
function shareText(text) {
  const url = location.origin + location.pathname + (LANG === 'en' ? '?lang=en' : '');
  SFX.tap();
  if (navigator.share) { navigator.share({ title: T('다중지능 테스트'), text, url }).catch(() => {}); return; }
  if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(() => toast(T('복사했습니다')), () => {});
}
function shareRes() {
  const r = S.res, t = S.t;
  if (t.id !== 'iq') return shareText(LANG === 'en' ? t.name + ' · ' + r.iq + ' / 100' : t.name + ' 결과 ' + r.iq + '점');
  shareText(LANG === 'en' ? t.name + ' · ' + t.tag + ' ' + r.iq + ' (' + rankText(r.iq) + ')' : t.name + ' 결과 ' + t.tag + ' ' + r.iq + ' (' + rankText(r.iq) + ')');
}
function shareProfile() {
  const V = profileVals(), has = TS.AXES.filter(a => V[a.k] != null).sort((a, b) => V[b.k] - V[a.k]);
  const top = has[0], iq = load('res.iq', null), eq = load('res.eq', null);
  const bits = [];
  if (top) bits.push(T('가장 강한 지능') + ' ' + top.name);
  if (iq) bits.push('IQ ' + iq.iq);
  if (eq) bits.push('EQ ' + eq.iq + T('점'));
  shareText(T('다중지능 프로필') + ' · ' + bits.join(' · '));
}

$('cards').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) { SFX.tap(); showCover(TS.byId(c.dataset.id)); } });
$('bProfile').onclick = showProfile;
$('bHomeT').onclick = () => { SFX.tap(); showHome(); };
$('bStart').onclick = () => startTest(false);
$('bResume').onclick = () => startTest(true);
$('bLast').onclick = () => { const r = load('res.' + S.t.id, null); if (r) showResult(r, false); };
$('bPrev').onclick = () => go(S.idx - 1);
$('bNext').onclick = next;
$('bSheet').onclick = openSheet;
$('bReview').onclick = startReview;
$('bShare').onclick = shareRes;
$('bRetry').onclick = () => startTest(false);
$('bHomeR').onclick = () => { SFX.tap(); showHome(); };
$('bProfR').onclick = showProfile;
$('bHomeP').onclick = () => { SFX.tap(); showHome(); };
$('bShareP').onclick = shareProfile;
$('opts').addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) choose(+b.dataset.i); });
/* 신체운동 중에 시간표로 */
(() => { const b = document.createElement('button'); b.className = 'omr sm'; b.id = 'bHomeM'; b.textContent = T('시간표');
  b.onclick = () => { stopMotor(); SFX.tap(); showHome(); }; $('mHead').appendChild(b); })();
const tog = $('tSnd');
function syncSnd() { tog.classList.toggle('off', !sndOn); }
tog.onclick = () => { sndOn = !sndOn; save('snd', sndOn ? 1 : 0); syncSnd(); SFX.tap(); };
syncSnd();
addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('askO').classList.remove('show'); if (sheetMode !== 'grade') closeSheet(); return; }
  if ($('askO').classList.contains('show')) { if (e.key === 'Enter') $('askY').click(); return; }
  if (S.scr !== 'test' && S.scr !== 'review') return;
  if ($('sheetO').classList.contains('show')) return;
  if (e.key >= '1' && e.key <= '8') choose(+e.key - 1);
  else if (e.key === 'ArrowLeft') go(S.idx - 1);
  else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
  else if (e.key === ' ' && $('bListen')) { e.preventDefault(); $('bListen').click(); }
});

/* ---------------- 영어 ---------------- */
if (LANG === 'en') {
  document.documentElement.lang = 'en'; document.title = 'MULTIPLE INTELLIGENCES TEST';
  document.querySelectorAll('#hTitle,#hSub,#bProfile,#bHomeT,#bStart,#bResume,#bLast,#bSheet,#bPrev,#bNext,#bReview,#bShare,#bHomeR,#bProfR,#bHomeP,#bShareP,#askN,#askY,#sTitle,#pTitle,#fineP,#newbest')
    .forEach(el => { el.textContent = T(el.textContent.trim()); });
} else document.title = '다중지능 테스트 · IQ · EQ';
$('hTitle').innerHTML = LANG === 'en' ? '<span class="q">MI</span> TEST' : '<span class="q">다중지능</span> 테스트';

/* 검사용 손잡이: ?shot=home|cover:id|q:id:n|rev:id:n|sheet:id|res:id|profile|motor:1~3 (&fake=1 이면 가짜 기록) */
function shot(sp) {
  const st = document.createElement('style'); st.textContent = '*{animation:none!important;transition:none!important}'; document.head.appendChild(st);
  sndOn = false;
  if (new URLSearchParams(location.search).get('fake')) {
    const V = { iq: 118, eq: 75, lang: 80, logic: 67, space: 87, music: 58, body: 63, nature: 73 };
    TS.list.forEach(t => {
      const Q = t.motor ? [] : items(t), ans = Q.map((q, i) => i % 4 === 3 ? (q.ans + 1) % q.opts.length : q.ans);
      const r = { tid: t.id, ans, raw: ans.filter((a, i) => a === Q[i].ans).length, n: Q.length, iq: V[t.id], el: 371000, at: Date.now() };
      if (t.id === 'eq') r.sub = { read: 81, know: 75, self: 67, rel: 75, inter: 78, intra: 71 };
      r.v3 = 1; r.seed = 0; if (t.id === 'iq') r.kinds = { mat: '11/15', num: '5/7', verb: '4/5', space: '3/5', mem: '2/3' };
      if (t.motor) r.m = { react: 287, acc: '3.4', order: '10.6' };
      save('res.' + t.id, r);
    });
  }
  const [a, b, c] = sp.split(':'), t = b && TS.byId(b);
  if (a === 'cover') showCover(t);
  if (a === 'q' || a === 'sheet') { showCover(t); startTest(false); if (c) { S.idx = +c; renderQ(0); } if (a === 'sheet') openSheet(); }
  if (a === 'rev') { showResult(load('res.' + b, null), false); startReview(); if (c) { S.idx = +c; renderQ(0); } }
  if (a === 'res') showResult(load('res.' + b, null), false);
  if (a === 'profile') showProfile();
  if (a === 'motor') { S.t = TS.byId('body'); startMotor(); clearTimeout(mTimer); [taskReact, taskStop, taskOrder][(+b || 1) - 1](); }
}
window.__iq = { S, TS, items, showHome, showCover, startTest, submit, choose, go, showResult, openSheet, fit, showProfile, startMotor, motorDone, MO: () => MO };
showHome();
const SHOT = new URLSearchParams(location.search).get('shot');
if (SHOT) shot(SHOT);
})();
