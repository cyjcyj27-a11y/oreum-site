/* 쓰기 연습 — 획순을 보여 주고, 그 위를 따라 그리면 획마다 봐 준다.
   획 좌표(kana-stroke.js)는 0~100. 글자 모양이 곧 길잡이라 글꼴에 기대지 않는다. */
(function () {
  var A = window.KANA_APP, K = window.KANA, S = window.KANA_STROKE, M = window.KANA_MARK;
  if (!A || !K || !S) return;

  var $ = function (id) { return document.getElementById(id); };
  var cv = $('kPad'), ctx = cv.getContext('2d');

  var TOL = 0.13;        // 얼마나 벗어나도 봐 주는가 (칸 크기 대비)
  var PASS = 0.78;       // 획을 이만큼 따라 그리면 통과

  /* ----------------------------------------------------- 글자 목록 */
  function rowsFor() {
    var out = [];
    K.seion.concat(K.dakuon).forEach(function (r) {
      var list = r.list.filter(function (it) { return glyphStrokes(it); });
      if (list.length) out.push({ id: r.id, label: r.label, list: list });
    });
    return out;
  }
  var BASE = { 'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
    'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
    'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
    'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
    'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
    'ガ': 'カ', 'ギ': 'キ', 'グ': 'ク', 'ゲ': 'ケ', 'ゴ': 'コ',
    'ザ': 'サ', 'ジ': 'シ', 'ズ': 'ス', 'ゼ': 'セ', 'ゾ': 'ソ',
    'ダ': 'タ', 'ヂ': 'チ', 'ヅ': 'ツ', 'デ': 'テ', 'ド': 'ト',
    'バ': 'ハ', 'ビ': 'ヒ', 'ブ': 'フ', 'ベ': 'ヘ', 'ボ': 'ホ',
    'パ': 'ハ', 'ピ': 'ヒ', 'プ': 'フ', 'ペ': 'ヘ', 'ポ': 'ホ' };
  var HANDAKU = 'ぱぴぷぺぽパピプペポ';

  /* 글자의 획들 — 탁음은 밑글자를 줄이고 오른쪽 위에 점을 붙인다 */
  function glyphStrokes(it) {
    var ch = A.state.set === 'kata' ? it.k : it.h;
    if (S[ch]) return S[ch].map(function (st) { return st.map(function (p) { return [p[0], p[1]]; }); });
    var base = BASE[ch];
    if (!base || !S[base]) return null;
    var out = S[base].map(function (st) {
      return st.map(function (p) { return [p[0] * 0.84, 4 + p[1] * 0.88]; });
    });
    var mark = M[HANDAKU.indexOf(ch) >= 0 ? 'handakuten' : 'dakuten'];
    mark.forEach(function (st) { out.push(st.map(function (p) { return [p[0], p[1]]; })); });
    return out;
  }

  /* ----------------------------------------------------- 칸 좌표 */
  var PADDING = 0.09;
  function size() { return cv.width; }
  function px(p) {
    var n = size(), m = n * PADDING;
    return [m + p[0] / 100 * (n - m * 2), m + p[1] / 100 * (n - m * 2)];
  }

  /* ----------------------------------------------------- 그리기 */
  var cur = { row: null, i: 0, strokes: [], done: 0, trail: [], anim: null, ok: 0 };

  function line(pts, color, w, cap) {
    if (pts.length < 2) {
      if (!pts.length) return;
      pts = [pts[0], [pts[0][0] + 0.4, pts[0][1] + 0.4]];
    }
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.lineCap = cap || 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    var a = px(pts[0]);
    ctx.moveTo(a[0], a[1]);
    for (var i = 1; i < pts.length; i++) { var b = px(pts[i]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
  }

  function paint(partial) {
    var n = size();
    ctx.clearRect(0, 0, n, n);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, n, n);
    // 십자 안내선
    ctx.strokeStyle = '#ececec'; ctx.lineWidth = Math.max(1, n * 0.004);
    ctx.setLineDash([n * 0.03, n * 0.03]);
    ctx.beginPath();
    ctx.moveTo(n / 2, n * 0.04); ctx.lineTo(n / 2, n * 0.96);
    ctx.moveTo(n * 0.04, n / 2); ctx.lineTo(n * 0.96, n / 2);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#e4e4e7'; ctx.lineWidth = Math.max(1, n * 0.006);
    ctx.strokeRect(n * 0.04, n * 0.04, n * 0.92, n * 0.92);

    var w = n * 0.082;
    cur.strokes.forEach(function (st, i) {
      if (i < cur.done) line(st, '#27272a', w);                       // 다 쓴 획
      else if (i === cur.done) line(st, '#f7d9d6', w);                // 지금 쓸 획
      else line(st, '#e9e9ec', w);                                    // 아직
    });
    // 지금 쓸 획의 시작점
    if (cur.done < cur.strokes.length) {
      var st = cur.strokes[cur.done], p = px(st[0]);
      ctx.fillStyle = '#d7261e';
      ctx.beginPath(); ctx.arc(p[0], p[1], n * 0.035, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 ' + (n * 0.042) + 'px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(cur.done + 1), p[0], p[1] + n * 0.002);
    }
    if (partial && partial.length) line(partial, '#b45309', w * 0.55);
    if (cur.trail.length) line(cur.trail, '#2563eb', w * 0.6);
  }

  /* ----------------------------------------------------- 획순 보기 */
  function stop() { if (cur.anim) { clearInterval(cur.anim); cur.anim = null; } }

  function showOrder() {
    stop();
    var i = cur.done, shown = [], t = 0;
    var st = cur.strokes[i];
    if (!st) return;
    var pts = resample(st, 46);
    cur.anim = setInterval(function () {
      t++;
      shown = pts.slice(0, t);
      paint(shown);
      if (t >= pts.length) { stop(); setTimeout(function () { paint(); }, 400); }
    }, 26);
  }

  /* ----------------------------------------------------- 채점 */
  function resample(pts, n) {
    var seg = [], total = 0, i;
    for (i = 1; i < pts.length; i++) {
      var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d); total += d;
    }
    if (!total) return [pts[0], pts[0]];
    var out = [pts[0]], step = total / (n - 1), acc = 0, k = 0, want = step;
    for (i = 1; i < pts.length; i++) {
      var d0 = seg[i - 1];
      while (acc + d0 >= want && out.length < n) {
        var r = (want - acc) / d0;
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r,
                  pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]);
        want += step;
      }
      acc += d0;
    }
    while (out.length < n) out.push(pts[pts.length - 1]);
    return out;
  }

  function judge(user, target) {
    if (user.length < 2) return { ok: false, why: 'short' };
    var u = resample(user, 40), t = resample(target, 40);
    var tol = TOL * 100;
    // 그은 방향이 반대면 되돌려 준다 — 획순 연습이니 방향은 본다
    var head = Math.hypot(u[0][0] - t[0][0], u[0][1] - t[0][1]);
    var tail = Math.hypot(u[0][0] - t[t.length - 1][0], u[0][1] - t[t.length - 1][1]);
    if (tail < head - tol) return { ok: false, why: 'dir' };
    var hit = 0, out = 0;
    t.forEach(function (p) {
      var best = 1e9;
      u.forEach(function (q) {
        var d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (d < best) best = d;
      });
      if (best <= tol) hit++;
    });
    u.forEach(function (q) {
      var best = 1e9;
      t.forEach(function (p) {
        var d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (d < best) best = d;
      });
      if (best > tol * 1.5) out++;
    });
    var cover = hit / t.length, stray = out / u.length;
    return { ok: cover >= PASS && stray <= 0.25, why: cover < PASS ? 'part' : 'stray', cover: cover };
  }

  /* ----------------------------------------------------- 입력 */
  var drawing = false, pts = [];
  function pos(e) {
    var r = cv.getBoundingClientRect();
    var n = size(), m = n * PADDING;
    var x = (e.clientX - r.left) / r.width * n, y = (e.clientY - r.top) / r.height * n;
    return [(x - m) / (n - m * 2) * 100, (y - m) / (n - m * 2) * 100];
  }
  cv.addEventListener('pointerdown', function (e) {
    if (!cur.strokes.length || cur.done >= cur.strokes.length) return;
    stop();
    drawing = true; pts = [pos(e)];
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    pts.push(pos(e));
    cur.trail = pts;
    paint();
    e.preventDefault();
  });
  function finish() {
    if (!drawing) return;
    drawing = false;
    var target = cur.strokes[cur.done];
    var r = judge(pts, target);
    cur.trail = [];
    if (r.ok) {
      cur.done++;
      A.beep(1);
      paint();
      if (cur.done >= cur.strokes.length) setTimeout(clear, 700);
    } else {
      A.beep(0);
      paint();
      cv.classList.add('shake');
      setTimeout(function () { cv.classList.remove('shake'); }, 320);
      if (r.why === 'dir') setTimeout(showOrder, 360);
    }
    pts = [];
  }
  cv.addEventListener('pointerup', finish);
  cv.addEventListener('pointercancel', finish);
  cv.addEventListener('pointerleave', function () { if (drawing) finish(); });

  /* ----------------------------------------------------- 한 글자 끝 */
  function clear() {
    var done = A.LS.get('write', {});
    var key = A.state.set === 'kata' ? 'kata' : 'hira';
    done[key] = done[key] || {};
    done[key][charOf(cur.row.list[cur.i])] = 1;
    A.LS.set('write', done);
    A.fanfare();
    if (cur.i + 1 < cur.row.list.length) { cur.i++; load(); }
    else { drawRows(); A.show('kWriteRows'); }
  }
  function charOf(it) { return A.state.set === 'kata' ? it.k : it.h; }

  function load() {
    var it = cur.row.list[cur.i];
    cur.strokes = glyphStrokes(it) || [];
    cur.done = 0; cur.trail = []; pts = [];
    $('kWriteName').textContent = charOf(it);
    $('kWriteNum').textContent = (cur.i + 1) + ' / ' + cur.row.list.length;
    $('kPadSound').textContent = A.say(it);
    $('kPadRoma').textContent = it.r;
    stop();
    paint();
    A.playKana(it);
    setTimeout(showOrder, 260);
  }

  /* ----------------------------------------------------- 행 목록 */
  function drawRows() {
    var box = $('kWriteList'); box.innerHTML = '';
    var done = (A.LS.get('write', {}) || {})[A.state.set === 'kata' ? 'kata' : 'hira'] || {};
    rowsFor().forEach(function (row) {
      var all = row.list.every(function (it) { return done[charOf(it)]; });
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kstage' + (all ? ' clear' : '');
      b.innerHTML = '<span class="n"></span><span class="t"></span><span class="st">' + (all ? '★' : '') + '</span>';
      b.querySelector('.n').textContent = row.list.map(charOf).join('');
      b.querySelector('.t').textContent = A.EN ? row.label.replace('행', ' row') : row.label;
      b.addEventListener('click', function () {
        cur.row = row; cur.i = 0;
        A.show('kWrite');
        fit();
        load();
      });
      box.appendChild(b);
    });
  }

  /* ----------------------------------------------------- 크기 맞추기 */
  function fit() {
    var w = Math.min(cv.parentNode.clientWidth || 420, 420);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.width = w + 'px'; cv.style.height = w + 'px';
    cv.width = cv.height = Math.round(w * dpr);
    paint();
  }
  window.addEventListener('resize', function () { if (!$('kWrite').hidden) fit(); });

  $('kShow').addEventListener('click', showOrder);
  $('kClear').addEventListener('click', function () {
    cur.done = 0; cur.trail = []; pts = []; stop(); paint();
  });
  [].slice.call(document.querySelectorAll('[data-writeback]')).forEach(function (b) {
    b.addEventListener('click', function () { stop(); drawRows(); A.show('kWriteRows'); });
  });

  window.KanaWrite = {
    open: function () { drawRows(); A.show('kWriteRows'); },
    state: function () { return { done: cur.done, strokes: cur.strokes.length, ch: $('kWriteName').textContent }; },
    judge: judge
  };
})();
