/* 히라가나·가타카나 연습 — 브라우저 안에서만 돌고 진도는 이 기기에만 남는다 */
(function () {
  var K = window.KANA;
  if (!K) return;

  var me = document.currentScript;
  var SNDBASE = (me && me.getAttribute('data-snd')) || 'snd/';
  var HAVE = window.KANA_SND || {};
  var SNDV = window.KANA_SND_V ? '?v=' + window.KANA_SND_V : '';

  var SPK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  /* 한국어판은 한글 소리, 영문판은 로마자를 크게 보여 준다 */
  function say(it) { return EN ? it.r : it.s; }
  function mean(x) { return EN ? (x.me || x.m) : x.m; }
  function tr(ko, en) { return EN ? en : ko; }
  /* 단계 이름 — 한글이 섞인 것만 바꾼다 */
  function stageName(n) {
    if (!EN) return n;
    return n.replace('행', ' row').replace('섞기', 'Mix').replace('여기까지 Mix', 'Mix so far')
            .replace('청음 전체', 'All basic kana').replace('탁음 전체', 'All voiced kana')
            .replace('요음 전체', 'All small-y kana').replace('모두 Mix', 'Everything mixed');
  }
  var root = document.getElementById('kana');
  var $ = function (id) { return document.getElementById(id); };
  var q = function (sel, el) { return (el || root).querySelector(sel); };
  var qa = function (sel, el) { return [].slice.call((el || root).querySelectorAll(sel)); };

  /* ---------------------------------------------------------- 저장 */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('kana.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('kana.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var state = {
    set: LS.get('set', 'hira'),
    snd: LS.get('snd', 1),
    roma: LS.get('roma', 1),
    prog: LS.get('prog', {})
  };
  function stars(i) { var a = state.prog[state.set] || []; return a[i] || 0; }
  function setStars(i, s) {
    var a = state.prog[state.set] || [];
    if (s > (a[i] || 0)) { a[i] = s; state.prog[state.set] = a; LS.set('prog', state.prog); }
  }

  /* ---------------------------------------------------------- 소리 */
  var actx = null, curAudio = null;
  function beep(ok) {
    if (!state.snd) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var t = actx.currentTime, g = actx.createGain();
      g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.34 : 0.26));
      var o = actx.createOscillator();
      o.type = ok ? 'triangle' : 'square';
      o.connect(g);
      if (ok) { o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(990, t + 0.1); }
      else { o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.24); }
      o.start(t); o.stop(t + 0.4);
    } catch (e) {}
  }
  function fanfare() {
    if (!state.snd) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.13, 0.26, 0.42].forEach(function (d, i) {
        var t = actx.currentTime + d, g = actx.createGain(), o = actx.createOscillator();
        g.connect(actx.destination); o.connect(g); o.type = 'triangle';
        o.frequency.setValueAtTime([523, 659, 784, 1046][i], t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        o.start(t); o.stop(t + 0.35);
      });
    } catch (e) {}
  }
  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'ja-JP'; u.rate = 0.85;
      var v = speechSynthesis.getVoices().filter(function (x) { return /^ja/i.test(x.lang); })[0];
      if (v) u.voice = v;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function play(key, text) {
    if (!state.snd) return null;
    if (HAVE[key]) {
      try {
        if (curAudio) { curAudio.pause(); }
        curAudio = new Audio(SNDBASE + key + '.mp3' + SNDV);
        var a = curAudio, pr = a.play();
        if (pr && pr.catch) pr.catch(function () { a.__failed = 1; speak(text); });
        return a;
      } catch (e) {}
    }
    speak(text);
    return null;
  }

  /* 소리가 끝나고 wait 만큼 더 기다렸다가 다음으로 — 말이 잘리지 않게.
     소리가 아예 안 나가는 자리(자동재생 막힘 등)에서는 길이를 보고 알아서 넘어간다 */
  function afterSound(audio, wait, fn) {
    var went = false;
    function go() { if (went) return; went = true; fn(); }
    if (!audio) { setTimeout(go, wait + 700); return; }
    audio.addEventListener('ended', function () { setTimeout(go, wait); });
    audio.addEventListener('error', function () { setTimeout(go, wait); });
    function arm() {
      var d = audio.duration;
      if (isFinite(d) && d > 0) setTimeout(go, d * 1000 + wait + 400);
      else setTimeout(go, wait + 1500);
    }
    if (audio.readyState >= 1) arm(); else audio.addEventListener('loadedmetadata', arm);
    setTimeout(function () { if (audio.__failed) go(); }, 350);   // 재생이 막혔으면 기다리지 않는다
    setTimeout(go, 9000);
  }
  function playKana(it) { return play(it.r, it.h); }
  function playWord(w) { return play('w_' + w.r, w.w); }

  /* ---------------------------------------------------------- 도구 */
  function glyph(it) {
    if (state.set === 'kata') return it.k;
    if (state.set === 'both') return Math.random() < 0.5 ? it.h : it.k;
    return it.h;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function show(id) {
    ['kHome', 'kLearn', 'kQuiz', 'kDone', 'kTable', 'kWordRows', 'kWord', 'kWriteRows', 'kWrite', 'kSentRows', 'kSent'].forEach(function (s) { $(s).hidden = s !== id; });
    try { root.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { }
  }

  /* ---------------------------------------------------------- 홈 */
  function poolOf(stage) {
    var ids = stage.pool, out = [];
    ids.forEach(function (id) { out = out.concat(K.rows[id].list); });
    return out;
  }
  function learnOf(stage) {
    var out = [];
    stage.learn.forEach(function (id) { out = out.concat(K.rows[id].list); });
    return out;
  }
  function drawHome() {
    qa('.kseg[data-set]').forEach(function (b) { b.classList.toggle('on', b.dataset.set === state.set); });
    var box = $('kLadder'); box.innerHTML = '';
    var done = 0;
    K.ladder.forEach(function (st, i) {
      var s = stars(i), open = i === 0 || stars(i - 1) > 0;
      if (s > 0) done++;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kstage' + (s > 0 ? ' clear' : '') + (open ? '' : ' lock');
      b.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="t"></span><span class="st">' +
        (s ? '★★★'.slice(0, s) : (open ? '' : '🔒')) + '</span>';
      q('.t', b).textContent = stageName(st.name);
      if (open) b.addEventListener('click', function () { startStage(i); });
      box.appendChild(b);
    });
    $('kProg').textContent = done + ' / ' + K.ladder.length;
  }

  /* ---------------------------------------------------------- 배우기 */
  var learn = { list: [], i: 0, stage: 0 };
  function startStage(i) {
    var st = K.ladder[i];
    quiz.stage = i;
    var nw = learnOf(st);
    if (nw.length) {
      learn = { list: nw, i: 0, stage: i };
      $('kLearnName').textContent = stageName(st.name);
      drawLearn();
      show('kLearn');
    } else {
      startQuiz(i);
    }
  }
  function drawLearn() {
    var it = learn.list[learn.i];
    $('kLearnGlyph').textContent = state.set === 'kata' ? it.k : it.h;
    $('kLearnSound').textContent = say(it);
    $('kLearnRoma').textContent = it.r;
    $('kLearnNum').textContent = (learn.i + 1) + ' / ' + learn.list.length;
    $('kLearnNext').textContent = learn.i + 1 >= learn.list.length ? '연습' : '다음';
    if (state.set === 'both') $('kLearnGlyph').textContent = it.h + ' ' + it.k;
    playKana(it);
  }
  $('kLearnPlay').addEventListener('click', function () { playKana(learn.list[learn.i]); });
  $('kLearnNext').addEventListener('click', function () {
    learn.i++;
    if (learn.i >= learn.list.length) startQuiz(learn.stage);
    else drawLearn();
  });
  $('kLearnCard').addEventListener('click', function () { playKana(learn.list[learn.i]); });

  /* ---------------------------------------------------------- 퀴즈 */
  var quiz = { q: [], i: 0, miss: 0, stage: 0, wrong: [], lock: false };
  var doneMode = 'quiz';   // 결과 화면이 연습 것인지 낱말 것인지 (ext = 바깥 화면)
  var extDone = null;
  function makeQ(pool, item) {
    var types = ['k2s', 's2k'];
    if (state.snd) types.push('hear');
    var type = pick(types);
    var wrongs = shuffle(pool.filter(function (x) { return x.s !== item.s; }));
    if (wrongs.length < 3) {
      var extra = shuffle(K.all().filter(function (x) { return x.s !== item.s; }));
      wrongs = wrongs.concat(extra);
    }
    var seen = {}, opts = [];
    wrongs.forEach(function (x) { if (opts.length < 3 && !seen[x.s]) { seen[x.s] = 1; opts.push(x); } });
    opts.push(item);
    var kind = state.set === 'kata' ? 'k' : (state.set === 'both' ? (Math.random() < 0.5 ? 'h' : 'k') : 'h');
    return { item: item, type: type, opts: shuffle(opts), kind: kind, disp: kind === 'k' ? item.k : item.h };
  }
  function startQuiz(i) {
    var st = K.ladder[i], pool = poolOf(st);
    var n = Math.min(12, Math.max(8, pool.length * 2));
    var bag = [];
    while (bag.length < n) bag = bag.concat(shuffle(pool));
    bag = bag.slice(0, n);
    quiz = { q: bag.map(function (it) { return makeQ(pool, it); }), i: 0, miss: 0, stage: i, wrong: [], lock: false, pool: pool };
    $('kQuizName').textContent = stageName(st.name);
    show('kQuiz');
    drawQ();
  }
  function drawQ() {
    var item = quiz.q[quiz.i];
    $('kQuizNum').textContent = (quiz.i + 1) + ' / ' + quiz.q.length;
    $('kQuizBar').style.width = (quiz.i / quiz.q.length * 100) + '%';
    var ask = $('kAsk'); ask.innerHTML = '';
    if (item.type === 'k2s') {
      var g = document.createElement('div'); g.className = 'q'; g.textContent = item.disp; ask.appendChild(g);
    } else if (item.type === 's2k') {
      var s = document.createElement('div'); s.className = 'q ko'; s.textContent = say(item.item); ask.appendChild(s);
    } else {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'spk';
      b.innerHTML = SPK_SVG;
      b.setAttribute('aria-label', '다시 듣기');
      b.addEventListener('click', function () { playKana(item.item); });
      ask.appendChild(b);
      var lab = document.createElement('div');
      lab.className = 'spklabel'; lab.textContent = tr('다시 듣기', 'Play again');
      ask.appendChild(lab);
      playKana(item.item);
    }
    var box = $('kOpts'); box.innerHTML = '';
    item.opts.forEach(function (op) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kopt' + (item.type === 'k2s' ? '' : ' jp');
      btn.textContent = item.type === 'k2s' ? say(op) : (item.kind === 'k' ? op.k : op.h);
      btn.addEventListener('click', function () { answer(btn, op, item); });
      box.appendChild(btn);
    });
    quiz.lock = false;
  }
  function answer(btn, op, item) {
    if (quiz.lock) return;
    quiz.lock = true;
    var ok = op.s === item.item.s, last = null;
    if (ok) {
      btn.classList.add('ok'); beep(1);
      if (item.type !== 'hear') last = playKana(item.item);
    } else {
      btn.classList.add('no'); beep(0);
      quiz.miss++;
      quiz.wrong.push(item.item);
      qa('.kopt', $('kOpts')).forEach(function (b) {
        var t = b.textContent;
        if (t === say(item.item) || t === item.item.h || t === item.item.k) b.classList.add('ok');
        else if (b !== btn) b.classList.add('dim');
      });
      last = playKana(item.item);
    }
    afterSound(last, ok ? 300 : 900, function () {
      quiz.i++;
      if (!ok && quiz.q.length < 15) quiz.q.push(makeQ(quiz.pool, item.item));
      if (quiz.i >= quiz.q.length) finish();
      else drawQ();
    });
  }
  function finish() {
    var total = quiz.q.length, miss = quiz.miss, right = total - miss;
    var s = miss === 0 ? 3 : (miss <= 2 ? 2 : 1);
    setStars(quiz.stage, s);
    doneMode = 'quiz';
    $('kStars').innerHTML = '★★★'.slice(0, s) + '<i>' + '★★★'.slice(0, 3 - s) + '</i>';
    $('kScore').textContent = right + ' / ' + total;
    var uniq = [], seen = {};
    quiz.wrong.forEach(function (w) { if (!seen[w.s]) { seen[w.s] = 1; uniq.push((state.set === 'kata' ? w.k : w.h) + ' ' + say(w)); } });
    $('kMiss').textContent = uniq.length ? uniq.join('  ·  ') : '';
    $('kNextStage').hidden = quiz.stage + 1 >= K.ladder.length;
    if (s === 3) fanfare(); else beep(1);
    show('kDone');
    drawHome();
  }
  $('kAgain').addEventListener('click', function () {
    if (doneMode === 'ext' && extDone) { extDone.again(); return; }
    if (doneMode === 'word') startWord(word.stage); else startStage(quiz.stage);
  });
  $('kNextStage').addEventListener('click', function () {
    if (doneMode === 'ext' && extDone) { extDone.next(); return; }
    if (doneMode === 'word') startWord(word.stage + 1);
    else startStage(Math.min(quiz.stage + 1, K.ladder.length - 1));
  });

  /* ---------------------------------------------------------- 가나표 */
  var tab = 'seion';
  function drawTable() {
    var groups = K[tab], box = $('kTableBody');
    box.innerHTML = '';
    groups.forEach(function (row) {
      var r = document.createElement('div'); r.className = 'krow';
      row.list.forEach(function (it) {
        var c = document.createElement('button');
        c.type = 'button'; c.className = 'kcell';
        c.innerHTML = '<span class="g"></span><span class="s"></span><span class="r"></span>';
        q('.g', c).textContent = state.set === 'kata' ? it.k : (state.set === 'both' ? it.h + it.k : it.h);
        q('.s', c).textContent = say(it);
        q('.r', c).textContent = it.r;
        c.addEventListener('click', function () {
          qa('.kcell.hit', box).forEach(function (x) { x.classList.remove('hit'); });
          c.classList.add('hit');
          playKana(it);
        });
        r.appendChild(c);
      });
      for (var i = row.list.length; i < 5; i++) {
        var e = document.createElement('span'); e.className = 'kcell empty'; r.appendChild(e);
      }
      box.appendChild(r);
    });
  }
  qa('.kseg[data-tab]').forEach(function (b) {
    b.addEventListener('click', function () {
      tab = b.dataset.tab;
      qa('.kseg[data-tab]').forEach(function (x) { x.classList.toggle('on', x === b); });
      drawTable();
    });
  });

  /* ---------------------------------------------------------- 낱말 */
  var WPER = 10;                       // 한 단계에 낱말 10개
  var word = { q: [], i: 0, miss: 0, lock: false, stage: 0, wrong: [], pool: [] };

  function wordPool() {
    if (state.set === 'kata') return K.words.filter(function (w) { return w.kt; });
    if (state.set === 'hira') return K.words.filter(function (w) { return !w.kt; });
    return K.words;
  }
  function wordStages() {
    var pool = wordPool(), out = [];
    for (var i = 0; i < pool.length; i += WPER) out.push(pool.slice(i, i + WPER));
    return out;
  }
  function wstars(i) { var a = (LS.get('wprog', {}) || {})[state.set] || []; return a[i] || 0; }
  function setWstars(i, s) {
    var all = LS.get('wprog', {}) || {}, a = all[state.set] || [];
    if (s > (a[i] || 0)) { a[i] = s; all[state.set] = a; LS.set('wprog', all); }
  }

  function drawWordRows() {
    var box = $('kWordList'); box.innerHTML = '';
    var stages = wordStages(), done = 0;
    stages.forEach(function (list, i) {
      var st = wstars(i), open = i === 0 || wstars(i - 1) > 0;
      if (st > 0) done++;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kstage' + (st > 0 ? ' clear' : '') + (open ? '' : ' lock');
      b.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="t"></span><span class="st">' +
        (st ? '★★★'.slice(0, st) : (open ? '' : '🔒')) + '</span>';
      q('.t', b).textContent = list[0].w + ' ~ ' + list[list.length - 1].w;
      if (open) b.addEventListener('click', function () { startWord(i); });
      box.appendChild(b);
    });
    $('kWordProg').textContent = done + ' / ' + stages.length;
  }

  function startWord(i) {
    var stages = wordStages();
    i = Math.max(0, Math.min(i, stages.length - 1));
    word = { q: shuffle(stages[i]), i: 0, miss: 0, lock: false, stage: i, wrong: [], pool: wordPool() };
    $('kWordName').textContent = tr((i + 1) + '단계', 'Set ' + (i + 1));
    show('kWord');
    drawWord();
  }

  function drawWord() {
    if (word.i >= word.q.length) { finishWord(); return; }
    var w = word.q[word.i];
    $('kWordNum').textContent = (word.i + 1) + ' / ' + word.q.length;
    $('kWordBar').style.width = (word.i / word.q.length * 100) + '%';
    var ask = $('kWordAsk'); ask.innerHTML = '';
    var g = document.createElement('div'); g.className = 'q word'; g.textContent = w.w;
    var sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = '';
    ask.appendChild(g); ask.appendChild(sub);
    ask.onclick = function () { playWord(w); };
    playWord(w);
    var others = shuffle(word.pool.filter(function (x) { return x.m !== w.m; })).slice(0, 3);
    var opts = shuffle(others.concat([w]));
    var box = $('kWordOpts'); box.innerHTML = '';
    opts.forEach(function (op) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'kopt word'; b.textContent = mean(op);
      b.addEventListener('click', function () {
        if (word.lock) return;
        word.lock = true;
        var ok = op.m === w.m;
        b.classList.add(ok ? 'ok' : 'no');
        if (!ok) {
          word.miss++; word.wrong.push(w);
          qa('.kopt', box).forEach(function (x) {
            if (x.textContent === w.m) x.classList.add('ok');
            else if (x !== b) x.classList.add('dim');
          });
        }
        beep(ok ? 1 : 0);
        sub.textContent = EN ? w.r : (w.s + (state.roma ? '  ·  ' + w.r : ''));
        afterSound(playWord(w), ok ? 500 : 1100, function () {
          word.i++; word.lock = false; drawWord();
        });
      });
      box.appendChild(b);
    });
    word.lock = false;
  }

  function finishWord() {
    var total = word.q.length, miss = word.miss, right = total - miss;
    var s = miss === 0 ? 3 : (miss <= 2 ? 2 : 1);
    setWstars(word.stage, s);
    doneMode = 'word';
    $('kStars').innerHTML = '★★★'.slice(0, s) + '<i>' + '★★★'.slice(0, 3 - s) + '</i>';
    $('kScore').textContent = right + ' / ' + total;
    var uniq = [], seen = {};
    word.wrong.forEach(function (w) { if (!seen[w.w]) { seen[w.w] = 1; uniq.push(w.w + ' ' + mean(w)); } });
    $('kMiss').textContent = uniq.length ? uniq.join('  ·  ') : '';
    $('kNextStage').hidden = word.stage + 1 >= wordStages().length;
    if (s === 3) fanfare(); else beep(1);
    show('kDone');
    drawWordRows();
  }

  /* ---------------------------------------------------------- 단추 */
  qa('.kseg[data-set]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.set = b.dataset.set; LS.set('set', state.set);
      drawHome();
    });
  });
  qa('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.go === 'table') { drawTable(); show('kTable'); }
      else if (b.dataset.go === 'write') { if (window.KanaWrite) window.KanaWrite.open(); }
      else if (b.dataset.go === 'sent') { if (window.KanaSent) window.KanaSent.open(); }
      else { drawWordRows(); show('kWordRows'); }
    });
  });
  qa('[data-home]').forEach(function (b) {
    b.addEventListener('click', function () {
      // 결과 화면의 '목록'은 그 모드의 단계 목록으로 돌아간다
      if (!$('kDone').hidden && doneMode === 'ext' && extDone) { extDone.back(); return; }
      if (!$('kDone').hidden && doneMode === 'word') { drawWordRows(); show('kWordRows'); return; }
      drawHome(); show('kHome');
    });
  });
  qa('[data-wordback]').forEach(function (b) {
    b.addEventListener('click', function () { drawWordRows(); show('kWordRows'); });
  });
  $('kReset').addEventListener('click', function () {
    if (!confirm(tr('진도를 지울까요?', 'Clear all progress?'))) return;
    state.prog = {}; LS.set('prog', {}); LS.set('wprog', {}); LS.set('write', {}); LS.set('sprog', {});
    drawHome();
  });
  function paintToggles() {
    $('kSnd').classList.toggle('off', !state.snd);
    $('kRoma').classList.toggle('off', !state.roma);
    root.classList.toggle('noroma', !state.roma);
  }
  $('kSnd').addEventListener('click', function () { state.snd = state.snd ? 0 : 1; LS.set('snd', state.snd); paintToggles(); });
  $('kRoma').addEventListener('click', function () { state.roma = state.roma ? 0 : 1; LS.set('roma', state.roma); paintToggles(); });

  if (window.speechSynthesis && speechSynthesis.getVoices().length === 0) {
    speechSynthesis.onvoiceschanged = function () {};
  }
  paintToggles();
  drawHome();

  /* 쓰기 연습·문장 학습에서 쓰는 것들 */
  window.KANA_APP = {
    state: state, LS: LS, show: show, play: play, playKana: playKana,
    beep: beep, fanfare: fanfare, shuffle: shuffle, pick: pick, afterSound: afterSound,
    EN: EN, say: say, mean: mean, tr: tr,
    home: function () { drawHome(); show('kHome'); },
    /* 결과 화면 빌려 쓰기 — {stars, right, total, miss, hasNext, again, next, back} */
    result: function (o) {
      doneMode = 'ext';
      extDone = o;
      $('kStars').innerHTML = '\u2605\u2605\u2605'.slice(0, o.stars) + '<i>' + '\u2605\u2605\u2605'.slice(0, 3 - o.stars) + '</i>';
      $('kScore').textContent = o.right + ' / ' + o.total;
      $('kMiss').textContent = o.miss || '';
      $('kNextStage').hidden = !o.hasNext;
      if (o.stars === 3) fanfare(); else beep(1);
      show('kDone');
    }
  };
})();
