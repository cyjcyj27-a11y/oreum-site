/* 문장 학습 — 듣고 뜻 고르기 · 읽고 뜻 고르기 · 낱말 순서 맞추기 · 빈칸 채우기 */
(function () {
  var A = window.KANA_APP, D = window.KANA_SENT;
  if (!A || !D) return;

  var $ = function (id) { return document.getElementById(id); };
  var qa = function (sel, el) { return [].slice.call((el || document).querySelectorAll(sel)); };

  var SPK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var cur = { g: 0, list: [], i: 0, miss: 0, wrong: [], lock: false, picked: [] };

  /* ------------------------------------------------- 진도 */
  function stars(i) { return ((A.LS.get('sprog', {}) || {}).all || [])[i] || 0; }
  function setStars(i, s) {
    var all = A.LS.get('sprog', {}) || {}, a = all.all || [];
    if (s > (a[i] || 0)) { a[i] = s; all.all = a; A.LS.set('sprog', all); }
  }

  /* ------------------------------------------------- 후리가나 */
  function ruby(parts, hide) {
    var box = document.createElement('div');
    box.className = 'ksent';
    parts.forEach(function (p, i) {
      if (hide === i) {
        var b = document.createElement('span');
        b.className = 'kblank';
        b.textContent = '○○';
        box.appendChild(b);
        return;
      }
      if (p[1]) {
        var r = document.createElement('ruby');
        r.appendChild(document.createTextNode(p[0]));
        var rt = document.createElement('rt');
        rt.textContent = p[1];
        r.appendChild(rt);
        box.appendChild(r);
      } else {
        box.appendChild(document.createTextNode(p[0]));
      }
    });
    return box;
  }

  /* 조각 하나를 <ruby> 로 — 카드·보기에도 읽는 법을 단다 */
  function chip(p, el) {
    el.textContent = '';
    if (p[1]) {
      var r = document.createElement('ruby');
      r.appendChild(document.createTextNode(p[0]));
      var rt = document.createElement('rt');
      rt.textContent = p[1];
      r.appendChild(rt);
      el.appendChild(r);
    } else {
      el.appendChild(document.createTextNode(p[0]));
    }
    el.dataset.w = p[0];
    return el;
  }

  function play(it) { return A.play(it.id, it.kana); }

  /* ------------------------------------------------- 단계 목록 */
  function drawRows() {
    var box = $('kSentList'); box.innerHTML = '';
    var done = 0;
    D.groups.forEach(function (g, i) {
      var s = stars(i), open = i === 0 || stars(i - 1) > 0;
      if (s > 0) done++;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kstage' + (s > 0 ? ' clear' : '') + (open ? '' : ' lock');
      b.innerHTML = '<span class="n"></span><span class="t"></span><span class="st">' +
        (s ? '★★★'.slice(0, s) : (open ? '' : '🔒')) + '</span>';
      b.querySelector('.n').textContent = (i + 1);
      b.querySelector('.t').textContent = A.EN ? (g.nameEn || g.name) : g.name;
      if (open) b.addEventListener('click', function () { start(i); });
      box.appendChild(b);
    });
    $('kSentProg').textContent = done + ' / ' + D.groups.length;
  }

  /* ------------------------------------------------- 문제 만들기 */
  function makeQ(it) {
    var kinds = A.state.snd ? ['read', 'hear'] : ['read'];
    if (it.p.length >= 3) kinds.push('order', 'blank');
    else if (it.p.length === 2) kinds.push('blank');
    return { it: it, kind: A.pick(kinds) };
  }

  function start(g) {
    g = Math.max(0, Math.min(g, D.groups.length - 1));
    var list = A.shuffle(D.groups[g].list);
    cur = { g: g, list: list.map(makeQ), i: 0, miss: 0, wrong: [], lock: false, picked: [] };
    $('kSentName').textContent = A.EN ? (D.groups[g].nameEn || D.groups[g].name) : D.groups[g].name;
    A.show('kSent');
    draw();
  }

  function others(it, n) {
    var pool = D.all().filter(function (x) { return x.m !== it.m; });
    return A.shuffle(pool).slice(0, n);
  }

  function draw() {
    if (cur.i >= cur.list.length) { finish(); return; }
    var q = cur.list[cur.i], it = q.it;
    $('kSentNum').textContent = (cur.i + 1) + ' / ' + cur.list.length;
    $('kSentBar').style.width = (cur.i / cur.list.length * 100) + '%';
    var ask = $('kSentAsk'), opts = $('kSentOpts');
    ask.innerHTML = ''; opts.innerHTML = '';
    cur.lock = false;
    cur.picked = [];

    if (q.kind === 'hear') {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'spk';
      b.innerHTML = SPK_SVG;
      b.setAttribute('aria-label', '다시 듣기');
      b.addEventListener('click', function () { play(it); });
      ask.appendChild(b);
      var lab = document.createElement('div');
      lab.className = 'spklabel'; lab.textContent = '다시 듣기';
      ask.appendChild(lab);
      play(it);
      meaningOptions(q, it);

    } else if (q.kind === 'read') {
      ask.appendChild(ruby(it.p));
      var s = document.createElement('div');
      s.className = 'sub'; s.textContent = A.EN ? it.kana : it.s;
      ask.appendChild(s);
      ask.onclick = function () { play(it); };
      play(it);
      meaningOptions(q, it);

    } else if (q.kind === 'blank') {
      var hide = 1 + Math.floor(Math.random() * (it.p.length - 1));
      q.hide = hide;
      ask.appendChild(ruby(it.p, hide));
      var m = document.createElement('div');
      m.className = 'sub'; m.textContent = A.mean(it);
      ask.appendChild(m);
      var right = it.p[hide];
      // 정답이 한자 조각이면 오답도 한자 조각에서 고른다 — 안 그러면 너무 쉽다
      var wantKanji = !!right[1], wrongs = [], any = [];
      D.all().forEach(function (x) {
        if (x.id === it.id) return;
        x.p.forEach(function (p) {
          if (p[0] === right[0]) return;
          any.push(p);
          if (!!p[1] === wantKanji) wrongs.push(p);
        });
      });
      if (wrongs.length < 3) wrongs = wrongs.concat(any);
      var seen = {}, pick = [];
      A.shuffle(wrongs).forEach(function (p) {
        if (pick.length < 3 && !seen[p[0]]) { seen[p[0]] = 1; pick.push(p); }
      });
      A.shuffle(pick.concat([right])).forEach(function (p) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'kopt jp sent';
        chip(p, btn);
        btn.addEventListener('click', function () { answer(btn, p[0] === right[0], it, opts); });
        opts.appendChild(btn);
      });

    } else {   // order — 낱말 순서 맞추기
      var line = document.createElement('div');
      line.className = 'ksent kbuild'; line.id = 'kBuild';
      ask.appendChild(line);
      var m2 = document.createElement('div');
      m2.className = 'sub'; m2.textContent = A.mean(it);
      ask.appendChild(m2);
      var cards = A.shuffle(it.p.map(function (p, idx) { return { p: p, idx: idx }; }));
      cards.forEach(function (c) {
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'kopt jp card';
        chip(c.p, btn);
        btn.dataset.idx = c.idx;
        btn.addEventListener('click', function () {
          if (cur.lock || btn.classList.contains('used')) return;
          btn.classList.add('used');
          cur.picked.push(c.idx);
          paintBuild(it);
          if (cur.picked.length === it.p.length) {
            var ok = cur.picked.every(function (v, i2) { return v === i2; });
            answer(null, ok, it, opts);
          }
        });
        opts.appendChild(btn);
      });
      var undo = document.createElement('button');
      undo.type = 'button'; undo.className = 'ghost wide'; undo.textContent = A.tr('하나 지우기', 'Undo one');
      undo.addEventListener('click', function () {
        if (cur.lock || !cur.picked.length) return;
        var last = cur.picked.pop();
        qa('.kopt.card', opts).forEach(function (b2) {
          if (+b2.dataset.idx === last) b2.classList.remove('used');
        });
        paintBuild(it);
      });
      opts.appendChild(undo);
    }
  }

  function paintBuild(it) {
    var line = $('kBuild');
    if (!line) return;
    line.innerHTML = '';
    cur.picked.forEach(function (idx) {
      var p = it.p[idx];
      if (p[1]) {
        var r = document.createElement('ruby');
        r.appendChild(document.createTextNode(p[0]));
        var rt = document.createElement('rt'); rt.textContent = p[1];
        r.appendChild(rt);
        line.appendChild(r);
      } else {
        line.appendChild(document.createTextNode(p[0]));
      }
    });
  }

  function meaningOptions(q, it) {
    var opts = $('kSentOpts');
    A.shuffle(others(it, 3).concat([it])).forEach(function (x) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'kopt word';
      btn.textContent = A.mean(x);
      btn.addEventListener('click', function () { answer(btn, x.m === it.m, it, opts); });
      opts.appendChild(btn);
    });
  }

  function answer(btn, ok, it, opts) {
    if (cur.lock) return;
    cur.lock = true;
    if (btn) btn.classList.add(ok ? 'ok' : 'no');
    if (!ok) {
      cur.miss++;
      cur.wrong.push(it);
      qa('.kopt', opts).forEach(function (b) {
        if (btn && b !== btn) b.classList.add('dim');
      });
    }
    // 맞히든 틀리든 문장을 보여 준다 — 글자·발음·뜻을 한 번에 본다
    var ask = $('kSentAsk');
    ask.innerHTML = '';
    var full = ruby(it.p);
    full.classList.add(ok ? 'right' : 'wrongline');
    ask.appendChild(full);
    var s1 = document.createElement('div');
    s1.className = 'sub'; s1.textContent = A.EN ? it.kana : it.s;
    ask.appendChild(s1);
    var s2 = document.createElement('div');
    s2.className = 'sub mean'; s2.textContent = A.mean(it);
    ask.appendChild(s2);
    ask.onclick = function () { play(it); };
    A.beep(ok ? 1 : 0);
    // 문장은 길다 — 말이 끝나고 조금 더 보여 준 다음에 넘어간다
    A.afterSound(play(it), ok ? 900 : 1600, function () { cur.i++; draw(); });
  }

  function finish() {
    var total = cur.list.length, miss = cur.miss, right = total - miss;
    var s = miss === 0 ? 3 : (miss <= 2 ? 2 : 1);
    setStars(cur.g, s);
    var uniq = [], seen = {};
    cur.wrong.forEach(function (w) { if (!seen[w.id]) { seen[w.id] = 1; uniq.push(w.jp); } });
    A.result({
      stars: s, right: right, total: total,
      miss: uniq.join('  ·  '),
      hasNext: cur.g + 1 < D.groups.length,
      again: function () { start(cur.g); },
      next: function () { start(cur.g + 1); },
      back: function () { drawRows(); A.show('kSentRows'); }
    });
    drawRows();
  }

  qa('[data-sentback]').forEach(function (b) {
    b.addEventListener('click', function () { drawRows(); A.show('kSentRows'); });
  });

  window.KanaSent = { open: function () { drawRows(); A.show('kSentRows'); } };
})();
