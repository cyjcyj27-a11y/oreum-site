/* 타닥타닥 달리기 — 낱말을 칠 때마다 내 선수가 달린다. 코스 12곳, 코스마다 동물 선수 셋과 경주.
   1등 하면 금메달과 그 코스 대장이 내 선수 목록에 들어온다. 12곳 모두 금메달이면 엔딩.
   캔버스 2D + 글자판(DOM). 모듈 없음(file:// 로 열어도 돈다). */
(function () {
  'use strict';
  var A = window.TJAudio, ART = window.TJArt, HG = window.HG;
  var $ = function (id) { return document.getElementById(id); };
  var EN = /[?&]lang=en/i.test(location.search), LANG = EN ? 'en' : 'ko';
  function L(ko, en) { return EN ? en : ko; }
  if (EN) {
    document.documentElement.lang = 'en'; document.body.classList.add('en'); document.title = 'Typing Race';
    Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.textContent = el.getAttribute('data-en'); });
    $('uCpm').textContent = 'WPM'; $('rUnit').textContent = 'WPM';
  }

  // ── 코스 ──
  var BOSS = ['turtle', 'duck', 'penguin', 'pig', 'bear', 'panda', 'cat', 'squirrel', 'monkey', 'rabbit', 'tiger', 'cheetah'];
  var ALL = ['dog'].concat(BOSS);
  // 스테이지 60 = 코스 12곳 × 5판. 코스마다 5번째 판에 그 코스 대장이 나온다
  var NCOURSE = 12, PER = 5, NS = NCOURSE * PER, SCENE_H = 600, START_X = 150;
  // 가장 빠른 상대의 빠르기(1분에 몇 타). 1스테이지 40타 → 60스테이지 460타. 영어는 글자 수 기준이라 조금 낮다
  var LO = EN ? 32 : 40, HI = EN ? 350 : 460;
  function stageSpd(si) { return Math.round(LO + (HI - LO) * Math.pow(si / (NS - 1), 1.1)); }
  function courseOf(si) { return Math.floor(si / PER); }
  function isBoss(si) { return si % PER === PER - 1; }
  // 코스마다 [글 묶음, 비중]. 코스 안에서 판이 올라갈수록 뒤쪽(어려운) 묶음 비중이 커진다
  // words.js 묶음: 0~4 낱말, 5 두 낱말, 6 짧은 문장, 7 조금 긴 문장, 8 짧은 속담, 9 긴 속담, 10 긴 문장, 11 챔피언, 12 숫자, 13 문장부호, 14 숫자·기호
  var MIX = [
    [[0, 1], [5, 0.4]], [[1, 1], [6, 0.5]], [[2, 1], [6, 0.6], [12, 0.15]], [[3, 1], [7, 0.7], [12, 0.3]],
    [[4, 1], [7, 0.8], [12, 0.3], [13, 0.15]], [[7, 1], [8, 0.8], [12, 0.35], [13, 0.35]], [[8, 1], [7, 0.6], [13, 0.45], [12, 0.35], [14, 0.1]],
    [[8, 0.8], [9, 1], [12, 0.3], [13, 0.4], [14, 0.25]], [[9, 1], [10, 1], [13, 0.3], [14, 0.45]], [[10, 1], [9, 0.7], [13, 0.4], [14, 0.6]],
    [[10, 1], [11, 0.7], [14, 0.8]], [[11, 1], [10, 1], [14, 1.1]]
  ];

  // ── 저장 ──
  var P = (function () {
    var o = null; try { o = JSON.parse(localStorage.getItem('taja.prog') || 'null'); } catch (e) {}
    if (!o || o.v !== 2) o = {};
    function arr(a) { var r = []; for (var i = 0; i < NS; i++) r.push(a && a[i] ? a[i] : 0); return r; }
    return { v: 2, medal: arr(o.medal), best: arr(o.best), top: o.top || 0, runner: ALL.indexOf(o.runner) >= 0 ? o.runner : 'dog', last: o.last || 0, ending: o.ending || 0, races: o.races || 0 };
  })();
  function persist() { try { localStorage.setItem('taja.prog', JSON.stringify(P)); } catch (e) {} }
  function unlocked(i) { return i === 0 || P.medal[i - 1] >= 1; }
  function owned(k) { return k === 'dog' || P.medal[BOSS.indexOf(k) * PER + PER - 1] === 3; }
  if (!owned(P.runner)) P.runner = 'dog';
  function speedLabel(cpm) { return EN ? String(Math.round(cpm / 5)) : String(Math.round(cpm)); }
  function unitLabel() { return EN ? ' WPM' : '타'; }

  // ── 화면 ──
  var cv = $('c'), ctx = cv.getContext('2d'), inp = $('inp'), panel = $('panel');
  var V = { w: 0, h: 0, dpr: 1, s: 1, oy: 0, LW: 0, sceneB: 0 };
  var isTouch = false;
  function layout() {
    var vv = window.visualViewport, w = innerWidth || 1280, h = innerHeight || 720, vh = vv && vv.height ? vv.height : h, vtop = vv ? vv.offsetTop : 0;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    V.w = w; V.h = h; V.dpr = dpr;
    var showPanel = document.body.classList.contains('racing') || document.body.classList.contains('counting');
    var bottom = vtop + vh;
    panel.style.bottom = Math.max(0, h - bottom) + 'px';
    var ph = showPanel ? panel.offsetHeight : 0;
    V.sceneB = Math.max(160, bottom - ph);
    V.s = Math.max(0.05, Math.min(V.sceneB / SCENE_H, w / 620));
    V.oy = V.sceneB - SCENE_H * V.s;
    V.LW = w / V.s;
  }
  window.addEventListener('resize', layout);
  if (window.visualViewport) { visualViewport.addEventListener('resize', layout); visualViewport.addEventListener('scroll', layout); }

  // ── 상태 ──
  var S = { mode: 'title', theme: P.last, cam: 0, T: 0 };
  var R = null;             // 지금 경주
  var puffs = [], portraits = {};
  function face(k, size, mood) { var id = k + size + (mood || ''); return portraits[id] || (portraits[id] = ART.portrait(k, size, mood)); }

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function makeRace(si) {
    var ci = courseOf(si), k = si % PER, mix = MIX[ci], W = window.TJ_WORDS[LANG], boss = stageSpd(si);
    var weights = mix.map(function (e, j) { return e[1] * (j ? 1 + k * 0.2 : 1); }), wsum = weights.reduce(function (a, b) { return a + b; }, 0);
    var pools = mix.map(function (e) { return { list: shuffle(W[e[0]].slice()), at: 0 }; });
    var want = Math.max(40, Math.round(boss * 0.75)), words = [], total = -1, guard = 0;
    while (total < want && guard++ < 500) {
      var r = Math.random() * wsum, j = 0; while (j < weights.length - 1 && r > weights[j]) { r -= weights[j]; j++; }
      var pl = pools[j]; if (pl.at >= pl.list.length) { pl.list = shuffle(pl.list); pl.at = 0; }
      var w = pl.list[pl.at++];
      if (w === words[words.length - 1]) continue;
      words.push(w); total += HG.count(w) + 1;
    }
    // 상대 셋: 5번째 판은 코스 대장이 가장 빠르다
    var others = ALL.filter(function (s) { return s !== P.runner && s !== BOSS[ci]; });
    var o1 = others[(si * 5 + 2) % others.length], o2 = others[(si * 7 + 5) % others.length], o3 = others[(si * 3 + 9) % others.length];
    if (o2 === o1) o2 = others[(si * 7 + 6) % others.length];
    if (o3 === o1 || o3 === o2) o3 = others[(si * 3 + 10) % others.length];
    if (o3 === o1 || o3 === o2) o3 = others[(si * 3 + 11) % others.length];
    var top = isBoss(si) ? BOSS[ci] : o3;
    var lanes = shuffle([0, 1, 2]);
    var rv = [[o1, boss * 0.55], [o2, boss * 0.78], [top, boss]].map(function (a, i) {
      return { key: a[0], lane: lanes[i], spd: a[1] / 60, pos: 0, disp: 0, ph: Math.random() * 6, run: 0, phase: Math.random() * 6, delay: 0.25 + Math.random() * 0.45, trip: 0, mood: 'focus', moodT: 0, done: -1, boss: i === 2, num: lanes[i] + 1, v: 0 };
    });
    var me = { key: P.runner, lane: 3, you: true, pos: 0, disp: 0, ph: 0, run: 0, trip: 0, mood: 'focus', moodT: 0, done: -1, num: 4, v: 0 };
    return {
      si: si, ci: ci, words: words, wi: 0, total: total, committed: 0, cur: 0, lastWrong: 0, lastM: null, wrongSince: -1, wrong: 0, perfect: true, combo: 0,
      t: 0, cd: 3.6, cdShown: 4, started: false, me: me, rivals: rv, all: rv.concat([me]), finished: 0, rank: 0, endT: 0,
      pxk: Math.max(22, 2900 / total), slow: 1, slowT: 0, bot: 0, botAcc: 0, confT: -99, passT: 0
    };
  }

  // ── 글자판 ──
  var wordEnds = [];
  function setWord() {
    var w = R.words[R.wi], el = $('word'), html = '';
    var kk = HG.keys(w); wordEnds = kk.ends;
    for (var i = 0; i < w.length; i++) html += w[i] === ' ' ? '<span class="sp"> </span>' : '<span>' + w[i] + '</span>';
    el.innerHTML = html;
    // 글자 크기: 판 너비에 맞춘다
    el.style.fontSize = '';
    var base = parseFloat(getComputedStyle(el).fontSize), maxW = panel.clientWidth - 32;
    el.style.fontSize = base + 'px';
    if (el.scrollWidth > maxW) el.style.fontSize = Math.max(18, base * maxW / el.scrollWidth) + 'px';
    var nx = R.words[R.wi + 1];
    $('next').textContent = nx ? nx : '🏁';
    paintWord({ ok: 0, wrong: 0 });
  }
  function paintWord(m) {
    var spans = $('word').children, curSet = false;
    for (var i = 0; i < spans.length; i++) {
      var st = i ? wordEnds[i - 1] : 0, en = wordEnds[i], cls = spans[i].className.indexOf('sp') >= 0 ? 'sp' : '';
      if (en <= m.ok) cls += ' d';
      else if (!curSet) { cls += ' c' + (m.wrong ? ' x' : ''); curSet = true; }
      spans[i].className = cls.trim();
    }
  }

  function flash(text, cls, ms) {
    var f = $('flash'); f.textContent = text; f.className = cls || ''; void f.offsetWidth; f.className = (cls || '') + ' show';
    clearTimeout(flash.t); flash.t = setTimeout(function () { f.className = cls || ''; }, ms || 700);
  }

  // ── 입력 ──
  function onInput() {
    if (!R || S.mode !== 'race' || R.me.done >= 0) return;
    var v = inp.value, w = R.words[R.wi], last = R.wi === R.words.length - 1;
    // 낱말 + 띄어쓰기면 넘긴다. 한꺼번에 여러 글자가 들어와도(폰 자판 자동 입력) 뒤에 남은 글은 다음 낱말로 넘긴다
    while (!last && v.length > w.length && v.slice(0, w.length + 1) === w + ' ') {
      if (R.cur < HG.count(w)) { R.cur = HG.count(w); A.key(); }
      v = v.slice(w.length + 1); submit(v); w = R.words[R.wi]; last = R.wi === R.words.length - 1;
      if (!v) return;
    }
    var m = HG.match(w, v);
    if (m.ok > R.cur) { R.cur = m.ok; A.key(); }
    // 틀린 타는 0.35초 기다렸다 매긴다 — 폰 천지인 자판은 '니'를 거쳐 '나'가 되기 때문
    R.lastM = m;
    if (!m.wrong) { R.wrongSince = -1; R.lastWrong = 0; inp.classList.remove('bad'); }
    else { if (R.wrongSince < 0) R.wrongSince = R.t; if (m.wrong < R.lastWrong) R.lastWrong = m.wrong; }
    paintWord({ ok: m.ok, wrong: R.lastWrong ? m.wrong : 0 });
    if (last && v === w) finishMe();
  }
  function judgeWrong() {
    var m = R.lastM;
    if (!m || !m.wrong || m.wrong <= R.lastWrong || R.wrongSince < 0 || R.t - R.wrongSince < 0.35) return;
    R.wrong += m.wrong - R.lastWrong; R.lastWrong = m.wrong; R.perfect = false; R.combo = 0;
    A.bad(); R.me.trip = Math.max(R.me.trip, 0.18);
    inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad');
    paintWord(m);
  }
  function submit(rest) {
    var w = R.words[R.wi];
    R.committed += HG.count(w) + 1; R.cur = 0; R.lastWrong = 0; R.lastM = null; R.wrongSince = -1; R.wi++;
    inp.value = rest || ''; inp.classList.remove('bad');
    if (R.perfect) {
      R.combo++;
      var pr = { 3: L('좋아!', 'NICE'), 6: L('멋져!', 'GREAT'), 10: L('최고!', 'AWESOME') }[R.combo] || (R.combo > 10 && R.combo % 5 === 0 ? L('최고!', 'AWESOME') : '');
      if (pr) { flash(pr, 'small', 650); A.combo(Math.min(3, Math.floor(R.combo / 3))); } else A.word(true);
    } else A.word(false);
    R.perfect = true;
    setWord();
  }
  inp.addEventListener('input', onInput);
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      setTimeout(function () {
        if (!R || S.mode !== 'race' || R.me.done >= 0) return;
        var v = inp.value.replace(/\s+$/, ''), w = R.words[R.wi];
        if (v === w) { if (R.wi === R.words.length - 1) finishMe(); else submit(); }
        else if (v.length) { inp.classList.remove('bad'); void inp.offsetWidth; inp.classList.add('bad'); A.bad(); }
      }, 0);
    }
  });
  inp.addEventListener('paste', function (e) { e.preventDefault(); });
  inp.addEventListener('drop', function (e) { e.preventDefault(); });
  cv.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') { isTouch = true; document.body.classList.add('touch'); } if (S.mode === 'race' || S.mode === 'count') inp.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (S.mode === 'race' || S.mode === 'pause')) { togglePause(); return; }
    if ((S.mode === 'race' || S.mode === 'count') && document.activeElement !== inp && !e.ctrlKey && !e.metaKey) inp.focus();
    var go2 = e.key === 'Enter' || e.key === ' ';
    if (!go2) return;
    if (S.mode === 'title') { e.preventDefault(); if (hasSave()) startRace(nowStage()); else goSelect(); }
    else if (S.mode === 'select') { e.preventDefault(); startRace(nowStage()); }
    else if (S.mode === 'result' && S.T - S.resT > 0.8) { e.preventDefault(); var nb = $('btnNext'); if (nb.style.display !== 'none') nb.onclick(); else startRace(R.si); }
    else if (S.mode === 'ending' && S.endT > 3.5) { e.preventDefault(); goSelect(); }
  });
  // 스페이스로 바로 할 판: 열린 판 중 금메달 아직인 첫 판, 다 땄으면 마지막 판
  function nowStage() { for (var i = 0; i < NS; i++) if (unlocked(i) && P.medal[i] < 3) return i; return NS - 1; }

  function curKeys() { return R.committed + R.cur; }
  function liveCpm() { return R.t > 1.5 ? curKeys() / (R.t / 60) : 0; }
  function liveAcc() { var c = curKeys(); return c + R.wrong ? Math.round(100 * c / (c + R.wrong)) : 100; }

  // ── 흐름 ──
  function show(id) { ['title', 'select', 'result', 'pause', 'ending'].forEach(function (s) { $(s).classList.toggle('show', s === id); }); }
  function setBody(cls) { document.body.classList.toggle('racing', cls === 'racing'); document.body.classList.toggle('counting', cls === 'counting'); layout(); }

  function goTitle() { S.mode = 'title'; R = null; show('title'); setBody(''); showRec(); A.music(true, false); }
  function showRec() {
    $('rec').textContent = P.top ? L('최고 기록 ', 'BEST ') + speedLabel(P.top) + unitLabel() : '';
  }
  function hasSave() { return P.races > 0 || P.medal.some(function (m) { return m > 0; }); }

  function goSelect() {
    A.init(); A.click(); S.mode = 'select'; R = null; show('select'); setBody(''); inp.blur();
    buildSelect(); A.music(true, false);
    // 기록이 있으면 이어하기(금메달 아직인 첫 판) · 처음부터 하기
    var has = hasSave();
    $('btnCont').hidden = !has; $('btnNew').hidden = !has; newArmed(false);
    if (has) $('btnCont').textContent = L('이어하기 · ' + (nowStage() + 1) + '판', 'CONTINUE · STAGE ' + (nowStage() + 1));
  }
  // 처음부터 하기: 한 번 누르면 빨갛게 바뀌고, 3초 안에 또 누르면 달리기 기록을 지운다
  var newT = 0;
  function newArmed(on) { var b = $('btnNew'); clearTimeout(newT); b.classList.toggle('warn', on); b.textContent = on ? L('정말 처음부터 하기', 'REALLY START OVER') : L('처음부터 하기', 'NEW GAME'); if (on) newT = setTimeout(function () { newArmed(false); }, 3000); }
  function resetRace() {
    for (var i = 0; i < NS; i++) { P.medal[i] = 0; P.best[i] = 0; }
    P.top = 0; P.races = 0; P.runner = 'dog'; P.last = 0; P.ending = 0; persist();
  }
  var thumbs = [];
  function thumb(i) {
    if (thumbs[i]) return thumbs[i];
    var c = document.createElement('canvas'), W = 360, H = 236, d = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * d; c.height = H * d; c.className = 'bg';
    var x = c.getContext('2d'), th = ART.TH[i], s = H / 420, LW = W / s, cam = 300;
    x.scale(d * s, d * s); x.translate(0, -150);
    ART.sky(x, th, LW, SCENE_H, 2); ART.clouds(x, th, LW, cam, 2); ART.far(x, th, LW, cam, 2); ART.mid(x, th, LW, cam, 2);
    ART.track(x, th, LW, SCENE_H, cam, 22, 400, 0); ART.foreground(x, th, LW, SCENE_H, cam, 2); ART.grade(x, th, LW, SCENE_H);
    return (thumbs[i] = c);
  }
  function buildSelect() {
    var g = $('grid'); g.innerHTML = '';
    var now = nowStage();
    for (var ci = 0; ci < NCOURSE; ci++) {
      var s0 = ci * PER, card = document.createElement('div'), ul = unlocked(s0);
      card.className = 'card' + (ul ? '' : ' lock') + (courseOf(now) === ci ? ' now' : '');
      card.appendChild(thumb(ci));
      var chips = document.createElement('div'); chips.className = 'chips';
      for (var k = 0; k < PER; k++) {
        var si = s0 + k, ch = document.createElement('div'), open = unlocked(si);
        ch.className = 'chip m' + P.medal[si] + (open ? '' : ' off') + (si === now ? ' cur' : '') + (isBoss(si) ? ' bs' : '');
        if (isBoss(si)) { var im = document.createElement('img'); im.src = face(BOSS[ci], 44, 'normal').toDataURL(); ch.appendChild(im); }
        var nb = document.createElement('b'); nb.textContent = si + 1; ch.appendChild(nb);
        (function (si, open) { ch.addEventListener('click', function (e) { e.stopPropagation(); if (!open) { A.bad(); return; } startRace(si); }); })(si, open);
        chips.appendChild(ch);
      }
      card.appendChild(chips);
      (function (ci, ok) { card.addEventListener('click', function () {
        if (!ok) { A.bad(); return; }
        for (var k = 0; k < PER; k++) { var si = ci * PER + k; if (unlocked(si) && P.medal[si] < 3) { startRace(si); return; } }
        startRace(ci * PER + PER - 1);
      }); })(ci, ul);
      g.appendChild(card);
    }
    var ro = $('roster'); ro.innerHTML = '';
    ALL.forEach(function (k) {
      var d = document.createElement('div'); d.className = 'rp' + (k === P.runner ? ' on' : '') + (owned(k) ? '' : ' lock');
      var c = face(k, 56, k === P.runner ? 'happy' : 'normal'), cl = document.createElement('canvas'); cl.width = c.width; cl.height = c.height; cl.getContext('2d').drawImage(c, 0, 0); d.appendChild(cl);
      d.addEventListener('click', function () { if (!owned(k)) { A.bad(); return; } P.runner = k; persist(); A.click(); buildSelect(); });
      ro.appendChild(d);
    });
  }

  function startRace(si) {
    A.init(); A.click();
    R = makeRace(si); S.theme = courseOf(si); P.last = S.theme; persist();
    S.mode = 'count'; S.cam = 0; puffs = [];
    show(''); setBody('counting');
    $('vCourse').textContent = si + 1;
    inp.value = ''; inp.disabled = false; inp.classList.remove('bad');
    setWord(); layout();
    inp.focus();
    A.music(true, true);
  }
  function go() {
    S.mode = 'race'; R.started = true; setBody('racing'); inp.value = ''; inp.focus();
    flash('GO!', 'go', 600); A.beep(true);
    if (window.OG) OG.start({ stage: R.si + 1 });
  }
  function finishMe() {
    var me = R.me; if (me.done >= 0) return;
    R.committed = R.total; R.cur = 0;
    me.done = R.t; me.pos = R.total;
    var ahead = R.rivals.filter(function (r) { return r.done >= 0; }).length;
    R.rank = ahead + 1; inp.disabled = true; inp.blur();
    // 한 끗 차이면 느린 화면
    var close = R.rivals.some(function (r) { return (r.done >= 0 && R.t - r.done < 0.45) || (r.done < 0 && R.total - r.pos < r.spd * 0.45); });
    if (close) { R.slow = 0.3; R.slowT = 1.2; }
    A.cheer(R.rank === 1); if (R.rank === 1) { R.confT = S.T; A.win(); } else if (R.rank === 4) A.lose();
    me.mood = R.rank === 1 ? 'cheer' : R.rank === 4 ? 'sad' : 'happy';
    flash(EN ? ['1ST', '2ND', '3RD', '4TH'][R.rank - 1] : R.rank + '등', R.rank === 1 ? 'go' : '', 1400);
    S.mode = 'finish'; R.endT = 0;
    $('panel').style.opacity = '.5';
  }
  function showResult() {
    S.mode = 'result'; S.resT = S.T; setBody(''); $('panel').style.opacity = '';
    var si = R.si, ci = R.ci, cpm = R.total / (R.me.done / 60), acc = liveAcc(), rank = R.rank;
    var medal = rank <= 3 ? 4 - rank : 0, prev = P.medal[si], newBest = cpm > P.best[si];
    P.races++;
    if (medal > prev) P.medal[si] = medal;
    if (newBest) P.best[si] = Math.round(cpm);
    var topNew = cpm > P.top; if (topNew) P.top = Math.round(cpm);
    persist();
    var rr = $('rRank'); rr.textContent = EN ? ['1ST', '2ND', '3RD', '4TH'][rank - 1] : rank + '등'; rr.className = 'r' + rank;
    $('rCpm').textContent = speedLabel(cpm); $('rAcc').textContent = acc;
    $('rNew').textContent = topNew && P.races > 1 ? L('최고 기록!', 'NEW RECORD') : '';
    var un = $('rUnlock'); un.innerHTML = '';
    if (medal === 3 && prev < 3 && isBoss(si)) { var c = face(BOSS[ci], 72, 'happy'), cl = document.createElement('canvas'); cl.width = c.width; cl.height = c.height; cl.getContext('2d').drawImage(c, 0, 0); un.appendChild(cl); A.medal(); }
    var allGold = P.medal.every(function (m) { return m === 3; });
    var nb = $('btnNext');
    if (allGold && !P.ending) { nb.textContent = '🏆'; nb.style.display = ''; nb.onclick = startEnding; }
    else if (si < NS - 1 && unlocked(si + 1)) { nb.textContent = L('다음 판', 'NEXT'); nb.style.display = ''; nb.onclick = function () { startRace(si + 1); }; }
    else nb.style.display = 'none';
    show('result');
    if (window.OG) OG.over({ result: ['1ST', '2ND', '3RD', '4TH'][rank - 1], score: Math.round(cpm), stage: si + 1 });
    A.music(true, false);
  }
  $('btnRetry').onclick = function () { startRace(R ? R.si : 0); };
  $('btnCourses').onclick = goSelect;
  $('btnStart').onclick = goSelect;
  $('btnCont').onclick = function () { startRace(nowStage()); };
  $('btnNew').onclick = function () {
    if (!$('btnNew').classList.contains('warn')) { A.click(); newArmed(true); return; }
    newArmed(false); resetRace(); A.click(); startRace(0);
  };
  $('btnPrac').onclick = function () { A.init(); A.click(); S.mode = 'practice'; R = null; show(''); setBody(''); A.music(true, false); window.TJPractice.open(); };
  window.TJGame = { title: goTitle };
  $('selBack').onclick = function () { A.click(); goTitle(); };
  $('btnQuit').onclick = function () { goSelect(); };
  $('btnResume').onclick = togglePause;
  $('btnEndOk').onclick = goSelect;

  function togglePause() {
    if (S.mode === 'race') { S.mode = 'pause'; show('pause'); inp.blur(); A.music(false); }
    else if (S.mode === 'pause') { S.mode = 'race'; show(''); inp.focus(); A.music(true, true); }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && S.mode === 'race') togglePause(); });

  // ── 토글 ──
  function syncTogs() { $('tgSnd').classList.toggle('off', !A.snd); $('tgBgm').classList.toggle('off', !A.bgm); }
  $('tgSnd').onclick = function () { A.init(); A.toggleSnd(); syncTogs(); };
  $('tgBgm').onclick = function () { A.init(); A.toggleBgm(); syncTogs(); };
  $('tgPause').onclick = togglePause;
  syncTogs();

  // ── 엔딩 ──
  function startEnding() {
    S.mode = 'ending'; S.endT = 0; S.theme = 11; P.ending = 1; persist();
    show('ending'); $('ending').classList.remove('ready'); setBody('');
    A.cheer(true); A.win(); A.music(true, false);
    if (window.OG) OG.over({ result: 'ENDING', score: P.top, stage: NS });
  }

  // ── 움직임 ──
  function update(dt) {
    S.T += dt;
    if (S.mode === 'title' || S.mode === 'select' || S.mode === 'result' || S.mode === 'ending' || S.mode === 'pause' || S.mode === 'practice') {
      if (S.mode === 'ending') { S.endT += dt; if (S.endT > 3.5) $('ending').classList.add('ready'); if (Math.random() < dt * 1.2) A.cheer(false); }
      if (S.mode !== 'pause' && S.mode !== 'result') S.cam += dt * 70;
      if (S.mode === 'result' && R) stepRace(dt * 0.6, true);
      return;
    }
    if (!R) return;
    if (S.mode === 'count') {
      R.cd -= dt;
      var n = Math.ceil(R.cd - 0.6);
      if (n < R.cdShown && n >= 1) { R.cdShown = n; flash(String(n), '', 500); A.beep(false); }
      if (R.cd <= 0.6) go();
      stepRace(0, false);
      return;
    }
    var sdt = dt * R.slow;
    if (R.slowT > 0) { R.slowT -= dt; if (R.slowT <= 0) R.slow = 1; }
    stepRace(sdt, false);
    if (S.mode === 'finish') { R.endT += dt; if (R.endT > 2.6) showResult(); }
  }

  function stepRace(dt, idle) {
    var me = R.me;
    if (dt > 0) R.t += dt;
    if (S.mode === 'race' && me.done < 0) judgeWrong();
    // 연습 봇(시험용)
    if (R.bot && S.mode === 'race' && me.done < 0) {
      R.botAcc += dt * R.bot / 60;
      while (R.botAcc >= 1 && me.done < 0) {
        R.botAcc -= 1; var w = R.words[R.wi], cnt = HG.count(w);
        if (R.cur < cnt) { R.cur++; if (R.cur === cnt && R.wi === R.words.length - 1) finishMe(); }
        else submit();
      }
    }
    if (me.done < 0) me.pos = curKeys();
    else me.pos = Math.min(R.total + 7, me.pos + dt * 6 * Math.max(0, 1 - (me.pos - R.total) / 7));
    var prevMe = me.disp;
    me.disp += (me.pos - me.disp) * Math.min(1, dt * 9);
    R.rivals.forEach(function (r) {
      var before = r.pos;
      if (R.started && R.t > r.delay) {
        if (r.trip > 0) { r.trip -= dt; if (r.trip <= 0) r.mood = 'focus'; }
        else if (r.done < 0) {
          var mod = 1 + 0.14 * Math.sin(R.t * 0.9 + r.phase) + 0.06 * Math.sin(R.t * 2.3 + r.phase * 2);
          r.pos += r.spd * mod * dt;
          // 가끔 넘어진다(대장은 드물게)
          if (!idle && R.t > 3 && r.pos < R.total * 0.9 && Math.random() < dt * (r.boss ? 0.004 : 0.012)) { r.trip = 1.0; r.mood = 'dizzy'; A.trip(); }
          if (r.pos >= R.total) { r.pos = R.total; r.done = R.t; r.mood = 'cheer'; if (me.done < 0) A.cheer(false); }
        } else r.pos = Math.min(R.total + 7, r.pos + dt * 5 * Math.max(0, 1 - (r.pos - R.total) / 7));
        // 나를 앞지르면 약 올린다
        if (me.done < 0 && before < me.pos && r.pos >= me.pos && me.pos > 3 && R.t - R.passT > 1.5) { r.mood = 'tease'; r.moodT = 1.4; R.passT = R.t; A.whoosh(); setTimeout(function () { A.tease(); }, 250); }
      }
      if (r.moodT > 0) { r.moodT -= dt; if (r.moodT <= 0 && r.mood === 'tease') r.mood = 'focus'; }
      var pd = r.disp; r.disp = r.pos;
      r.v += ((dt > 0 ? (r.disp - pd) / dt : 0) - r.v) * Math.min(1, dt * 6);
    });
    me.v += ((dt > 0 ? (me.disp - prevMe) / dt : 0) - me.v) * Math.min(1, dt * 5);
    if (me.trip > 0) me.trip -= dt;
    R.all.forEach(function (r) {
      var kps = Math.max(0, r.v), target = r.done >= 0 && r.pos >= R.total + 6.9 ? 0 : Math.min(1, kps / 2.2 + (kps > 0.05 ? 0.35 : 0));
      if (r.trip > 0 && !r.you) target = 0;
      r.run += (target - r.run) * Math.min(1, dt * 5);
      var oldPh = r.ph;
      r.ph += dt * (4 + Math.min(9, kps * 2.2)) * (r.run > 0.05 ? 1 : 0);
      if (Math.floor(oldPh / Math.PI) !== Math.floor(r.ph / Math.PI) && r.run > 0.4) puffs.push({ x: START_X + r.disp * R.pxk - 8, lane: r.lane, life: 0.45, s: 0.6 + Math.random() * 0.5 });
    });
    for (var i = puffs.length - 1; i >= 0; i--) { puffs[i].life -= dt; puffs[i].x -= dt * 20; if (puffs[i].life <= 0) puffs.splice(i, 1); }
    var tx = START_X + me.disp * R.pxk - V.LW * 0.4;
    S.cam += (Math.max(0, tx) - S.cam) * Math.min(1, dt * 6 + (dt === 0 ? 1 : 0));
    // 위 막대 숫자
    if (S.mode === 'race') { $('vCpm').textContent = speedLabel(liveCpm()); $('vAcc').textContent = liveAcc(); }
  }

  // ── 그리기 ──
  function draw() {
    var th = ART.TH[S.theme] || ART.TH[0];
    if (!(V.LW > 0) || !isFinite(V.LW)) { layout(); if (!(V.LW > 0) || !isFinite(V.LW)) return; }
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
    ctx.fillStyle = th.sky[0]; ctx.fillRect(0, 0, V.w, V.h);
    if (V.oy > 0) { var sg = ctx.createLinearGradient(0, 0, 0, V.oy); sg.addColorStop(0, ART.shade(th.sky[0], -0.25)); sg.addColorStop(1, th.sky[0]); ctx.fillStyle = sg; ctx.fillRect(0, 0, V.w, V.oy + 1); }
    ctx.save(); ctx.translate(0, V.oy); ctx.scale(V.s, V.s);
    var LW = V.LW, cam = S.cam, t = S.T;
    ART.sky(ctx, th, LW, SCENE_H, t); ART.clouds(ctx, th, LW, cam, t); ART.far(ctx, th, LW, cam, t); ART.mid(ctx, th, LW, cam, t);
    if (R && S.mode !== 'ending') {
      var fx = ART.track(ctx, th, LW, SCENE_H, cam, R.pxk, R.total, START_X);
      for (var lane = 0; lane < 4; lane++) {
        puffs.forEach(function (p) { if (p.lane !== lane) return; var a = p.life / 0.45; ART.ell(ctx, p.x - cam, ART.laneY(lane) - 3, 10 * p.s * (2 - a), 5 * p.s * (2 - a), 0, 'rgba(255,255,255,' + (0.35 * a) + ')'); });
        R.all.forEach(function (r) {
          if (r.lane !== lane) return;
          var x = START_X + r.disp * R.pxk - cam, y = ART.laneY(lane), sc = 1.22 + lane * 0.07;
          var trip = r.you ? Math.max(0, r.trip) * 0.8 : (r.trip > 0 ? Math.min(1, (1 - r.trip) * 4) * 0.9 : 0);
          var mood = r.mood; if (!R.started) mood = 'focus';
          ART.runner(ctx, r.key, x, y, sc, { run: r.run, ph: r.ph, num: r.num, mood: mood, trip: trip, cheer: r.mood === 'cheer', t: t, blink: (t * 0.7 + r.num) % 3.2 < 0.12 });
          if (r.you) { // 내 선수 표시
            var ay = y - 118 * sc + Math.sin(t * 5) * 3;
            ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#1d2a44'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(x - 10, ay - 12); ctx.lineTo(x + 10, ay - 12); ctx.lineTo(x, ay); ctx.closePath(); ctx.stroke(); ctx.fill();
          }
          if (r.mood === 'dizzy' && r.trip > 0) { for (var k = 0; k < 3; k++) { var a2 = t * 6 + k * 2.1; ctx.fillStyle = '#ffd84a'; ctx.font = 'bold 16px Arial'; ctx.fillText('★', x + 18 + Math.cos(a2) * 16, y - 120 * sc + Math.sin(a2) * 6); } }
        });
      }
      ART.finishArch(ctx, fx, t);
      ART.foreground(ctx, th, LW, SCENE_H, cam, t); ART.particles(ctx, th, LW, SCENE_H, cam, t);
      ART.confetti(ctx, LW, SCENE_H, t, R.confT);
    } else if (S.mode === 'ending') {
      drawEnding(th, LW, t);
    } else {
      // 타이틀·코스 고르기 배경: 네 선수가 제자리에서 달린다
      ART.track(ctx, th, LW, SCENE_H, cam, 22, 100000, -99999);
      var keys = [P.runner === 'dog' ? 'rabbit' : 'dog', 'turtle', 'cheetah', P.runner];
      keys.forEach(function (k, i) {
        var x = LW * (0.28 + i * 0.13) + Math.sin(t * 0.6 + i * 1.7) * 30;
        ART.runner(ctx, k, x, ART.laneY(i), 1.22 + i * 0.07, { run: 0.85, ph: t * (9 + i * 0.7) + i, num: i + 1, mood: i === 3 ? 'happy' : 'focus', t: t, blink: (t * 0.7 + i) % 3.2 < 0.12 });
      });
      ART.foreground(ctx, th, LW, SCENE_H, cam, t); ART.particles(ctx, th, LW, SCENE_H, cam, t);
    }
    ART.grade(ctx, th, LW, SCENE_H);
    ctx.restore();
    if (R && (S.mode === 'race' || S.mode === 'count' || S.mode === 'finish')) drawProgress();
  }

  // 위쪽 진행 막대: 결승까지 누가 어디쯤인지
  function drawProgress() {
    var top = ($('topbar').offsetHeight || 46) + 12, x0 = Math.max(24, V.w * 0.12), x1 = V.w - Math.max(40, V.w * 0.12), y = top + 14;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)'; roundRect(x0 - 10, y - 5, x1 - x0 + 34, 10, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; roundRect(x0, y - 2, (x1 - x0) * Math.min(1, R.me.pos / R.total), 4, 2); ctx.fill();
    // 결승 깃발
    ctx.fillStyle = '#fff'; ctx.fillRect(x1 + 10, y - 16, 2, 22);
    for (var q = 0; q < 3; q++) for (var p = 0; p < 2; p++) { ctx.fillStyle = (q + p) % 2 ? '#111' : '#fff'; ctx.fillRect(x1 + 12 + q * 5, y - 16 + p * 5, 5, 5); }
    var order = R.all.slice().sort(function (a, b) { return (a.you ? 1 : 0) - (b.you ? 1 : 0); });
    order.forEach(function (r) {
      var sz = r.you ? 34 : 26, px = x0 + (x1 - x0) * Math.min(1, r.pos / R.total), im = face(r.key, sz, r.you ? 'happy' : 'normal');
      ctx.save(); ctx.beginPath(); ctx.arc(px, y, sz / 2 + 2.5, 0, 7); ctx.fillStyle = r.you ? '#ffd84a' : '#fff'; ctx.fill();
      ctx.drawImage(im, px - sz / 2, y - sz / 2, sz, sz); ctx.restore();
    });
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function drawEnding(th, LW, t) {
    ART.track(ctx, th, LW, SCENE_H, S.cam * 0, 22, 100000, -99999);
    var e = S.endT, cx = LW / 2, baseY = ART.laneY(2) + 10;
    // 시상대
    var steps = [[cx - 120, 60, '#c0c8d6', '2'], [cx, 95, '#ffd84a', '1'], [cx + 120, 40, '#e0a070', '3']];
    steps.forEach(function (s) {
      var h = s[1] * Math.min(1, e * 1.5), g = ctx.createLinearGradient(s[0] - 55, 0, s[0] + 55, 0);
      g.addColorStop(0, ART.shade(s[2], 0.25)); g.addColorStop(1, ART.shade(s[2], -0.2));
      ctx.fillStyle = g; ctx.fillRect(s[0] - 55, baseY - h, 110, h);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(s[0] - 55, baseY - h, 110, 6);
      if (h > 30) { ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s[3], s[0], baseY - h / 2 + 4); }
    });
    var hop = function (k) { return -Math.abs(Math.sin(t * 6 + k)) * 10; };
    // 뒤에 줄 선 동물들
    var crowd = ALL.filter(function (k) { return k !== 'rabbit' && k !== 'cheetah' && k !== P.runner; });
    crowd.forEach(function (k, i) {
      var side = i % 2 ? 1 : -1, n = Math.floor(i / 2), x = cx + side * (220 + n * 70);
      if (x < -40 || x > LW + 40) return;
      ART.runner(ctx, k, x, ART.laneY(1) + hop(i) * 0.4, 1.0, { run: 0, ph: 0, num: i + 1, mood: 'cheer', cheer: true, t: t + i * 0.3 });
    });
    ART.runner(ctx, 'rabbit', cx - 120, baseY - 60 + hop(1) * 0.3, 1.1, { run: 0, ph: 0, num: 2, mood: 'happy', cheer: true, t: t + 1 });
    ART.runner(ctx, 'cheetah', cx + 120, baseY - 40 + hop(2) * 0.3, 1.1, { run: 0, ph: 0, num: 3, mood: 'happy', cheer: true, t: t + 2 });
    ART.runner(ctx, P.runner, cx, baseY - 95 * Math.min(1, e * 1.5) + hop(0) * 0.5, 1.3, { run: 0, ph: 0, num: 1, mood: 'cheer', cheer: true, t: t });
    // 트로피
    if (e > 1.2) {
      var ty = baseY - 95 - 190 + Math.sin(t * 3) * 4, k2 = Math.min(1, (e - 1.2) * 2);
      ctx.save(); ctx.translate(cx + 40, ty); ctx.scale(k2, k2);
      var tg = ctx.createLinearGradient(-20, 0, 20, 0); tg.addColorStop(0, '#fff2a0'); tg.addColorStop(0.5, '#f2c230'); tg.addColorStop(1, '#b8860b');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-18, -20); ctx.lineTo(18, -20); ctx.quadraticCurveTo(18, 12, 0, 14); ctx.quadraticCurveTo(-18, 12, -18, -20); ctx.fill();
      ctx.fillRect(-4, 12, 8, 12); ctx.fillRect(-12, 24, 24, 6);
      ctx.strokeStyle = '#d8a020'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-18, -8, 8, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(18, -8, 8, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
      ctx.restore();
    }
    ART.foreground(ctx, th, LW, SCENE_H, 0, t);
    ART.confetti(ctx, LW, SCENE_H, (e % 6), 0);
    // 제목
    if (e > 2) {
      var a = Math.min(1, (e - 2) * 1.5);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '84px Poor, Ria, sans-serif'; ctx.lineWidth = 14; ctx.strokeStyle = '#1d2a44'; ctx.lineJoin = 'round';
      var title = L('챔피언', 'CHAMPION');
      ctx.strokeText(title, cx, 95); ctx.fillStyle = '#ffd84a'; ctx.fillText(title, cx, 95);
      ctx.restore();
    }
  }

  // ── 돌리기 ──
  var lastT = 0;
  function frame(now) {
    var dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60; lastT = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  layout();
  goTitle();
  requestAnimationFrame(frame);
  document.addEventListener('pointerdown', function () { A.init(); if (S.mode === 'title' || S.mode === 'select') A.music(true, false); }, { once: true });

  // 시험 손잡이
  window.__tj = {
    tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); draw(); },
    start: startRace, select: goSelect, title: goTitle, ending: startEnding,
    type: function (s) { inp.value = s; onInput(); },
    enter: function () { inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); },
    bot: function (cpm) { if (R) R.bot = cpm; },
    S: function () { return S; }, R: function () { return R; }, P: function () { return P; },
    state: function () { return R ? { mode: S.mode, ci: R.ci, wi: R.wi, words: R.words.length, total: R.total, me: R.me.pos, rivals: R.rivals.map(function (r) { return [r.key, Math.round(r.pos), r.done]; }), rank: R.rank, cpm: Math.round(liveCpm()), acc: liveAcc() } : { mode: S.mode }; },
    save: persist, layout: layout
  };
})();
