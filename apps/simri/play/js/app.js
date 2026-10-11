// 심리테스트 본체. 탭 셋(정신연령·연애유형·직업적성).
(function () {
  var D = window.SIMRI, A = window.ART, IDS = ['mbti', 'age', 'love', 'job'];
  var KEY = 'simri.';
  var $main = document.getElementById('main'), $tabs = document.getElementById('tabs');
  var st = {}, cur = 'age', lock = false;

  function get(k) { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch (e) { return null; } }
  function put(k, v) { try { if (v == null) localStorage.removeItem(KEY + k); else localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  IDS.forEach(function (id) {
    var c = get('cur.' + id), r = get('res.' + id);
    st[id] = { mode: 'intro', i: c ? c.i : 0, ans: c ? c.ans : [], res: r };
  });

  // ── 점수 ──
  function scoreAge(ans) {
    var t = D.age, sum = 0;
    ans.forEach(function (k, i) { sum += t.qs[i][1][k][1]; });
    var m = sum / ans.length, age = Math.round(32 + (m - 32) * 1.7);
    age = Math.max(6, Math.min(88, age));
    var band = t.bands.filter(function (b) { return age <= b.to; })[0];
    return { age: age, band: band };
  }
  function scoreLove(ans) {
    var t = D.love, s = { a: 0, v: 0 };
    ans.forEach(function (k, i) { var q = t.qs[i]; s[q[0]] += q[2] ? 4 - k : k; });
    var a = Math.round(s.a / 48 * 100), v = Math.round(s.v / 48 * 100);
    var key = a >= 50 ? (v >= 50 ? 'fearful' : 'anxious') : (v >= 50 ? 'avoidant' : 'secure');
    return { a: a, v: v, key: key, t: t.types[key] };
  }
  function scoreJob(ans) {
    var t = D.job, s = {};
    t.order.forEach(function (k) { s[k] = 0; });
    ans.forEach(function (k, i) { s[t.qs[i][0]] += k; });
    t.order.forEach(function (k) { s[k] = Math.round(s[k] / 16 * 100); });
    var rank = t.order.slice().sort(function (x, y) { return s[y] - s[x] || t.order.indexOf(x) - t.order.indexOf(y); });
    return { s: s, rank: rank, code: rank.slice(0, 3).join('') };
  }
  function scoreMbti(ans) {
    var t = D.mbti, s = { EI: 0, SN: 0, TF: 0, JP: 0 };
    ans.forEach(function (k, i) { var q = t.qs[i]; s[q[0]] += (q[1] === q[0][0] ? 1 : -1) * (k - 2); });
    var code = '', pct = [];
    t.axes.forEach(function (a) {
      var ax = a[0] + a[1], v = s[ax];
      if (v === 0) { // 동점이면 이 축에서 처음으로 한쪽에 기운 답을 따른다
        for (var i = 0; i < ans.length && !v; i++) { var q = t.qs[i]; if (q[0] === ax && ans[i] !== 2) v = (q[1] === a[0] ? 1 : -1) * (ans[i] - 2) > 0 ? 0.01 : -0.01; }
      }
      var p = Math.round(50 + v / 30 * 50); if (p === 50) p = v > 0 ? 51 : 49;
      pct.push(p); code += p > 50 ? a[0] : a[1];
    });
    var mate = (code[0] === 'E' ? 'I' : 'E') + code[1] + code[2] + (code[3] === 'J' ? 'P' : 'J');
    return { code: code, pct: pct, t: t.types[code], mate: mate };
  }
  var SCORE = { mbti: scoreMbti, age: scoreAge, love: scoreLove, job: scoreJob };

  // ── 탭 ──
  function drawTabs() {
    $tabs.innerHTML = IDS.map(function (id) {
      var t = D[id];
      return '<button class="tab' + (id === cur ? ' on' : '') + '" data-id="' + id + '">' + t.tab + '<small>' + t.qs.length + '문항</small></button>';
    }).join('');
  }
  $tabs.addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    go(b.getAttribute('data-id'));
  });
  function go(id) {
    if (IDS.indexOf(id) < 0) id = 'mbti';
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    cur = id; document.body.setAttribute('data-t', id);
    drawTabs(); draw(); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { go(location.hash.slice(1)); });

  function draw() {
    var s = st[cur];
    if (s.mode === 'q') drawQ(); else if (s.mode === 'res') drawRes(); else drawIntro();
  }

  // ── 첫 화면 ──
  function drawIntro() {
    var t = D[cur], s = st[cur], art = cur === 'mbti' ? A.tiles(null) : cur === 'age' ? A.cake(null) : cur === 'love' ? A.letter() : A.badge('???');
    var h = '<section class="card intro pop">' + art + '<h1>' + t.title + '</h1><p class="sub">' + t.sub + '</p>' +
      '<div class="meta"><span>' + t.qs.length + '문항</span><span>약 ' + t.min + '분</span><span>무료</span></div>' +
      (t.note ? '<p class="note">' + t.note + '</p>' : '');
    if (s.ans.length && s.ans.length < t.qs.length) {
      h += '<button class="big" data-act="resume">이어서 하기 (' + s.ans.length + ' / ' + t.qs.length + ')</button>' +
        '<button class="ghost" data-act="restart">처음부터 다시</button>';
    } else {
      h += '<button class="big" data-act="restart">테스트 시작</button>';
    }
    if (s.res) h += '<button class="ghost" data-act="last">지난 결과 보기</button>';
    $main.innerHTML = h + '</section>';
  }

  // ── 문항 ──
  function drawQ(still) {
    var t = D[cur], s = st[cur], i = s.i, q = t.qs[i], sel = s.ans[i];
    var h = '<section class="card' + (still ? '' : ' pop') + '"><div class="top"><button class="back" data-act="back" aria-label="이전">' + A.backIcon + '</button>' +
      '<div class="bar"><i style="width:' + (i / t.qs.length * 100).toFixed(1) + '%"></i></div><span class="num">' + (i + 1) + ' / ' + t.qs.length + '</span></div>';
    if (cur === 'age') {
      h += '<div class="q"><span class="no">Q' + (i + 1) + '</span><h2>' + esc(q[0]) + '</h2></div><div class="opts">' +
        q[1].map(function (o, k) { return '<button class="opt' + (sel === k ? ' sel' : '') + '" data-v="' + k + '"><span class="k">' + 'ABCD'[k] + '</span>' + esc(o[0]) + '</button>'; }).join('') + '</div>';
    } else if (cur === 'love' || cur === 'mbti') {
      h += '<div class="q"><span class="no">Q' + (i + 1) + '</span><h2>' + esc(cur === 'mbti' ? q[2] : q[1]) + '</h2></div>' +
        '<div class="scale">' + [0, 1, 2, 3, 4].map(function (k) { return '<button class="dot' + (sel === k ? ' sel' : '') + '" data-v="' + k + '" aria-label="' + t.scale[k] + '"></button>'; }).join('') + '</div>' +
        '<div class="ends"><span>아니다</span><b>그렇다</b></div><div class="pick">' + (sel != null ? t.scale[sel] : '') + '</div>';
    } else {
      h += '<div class="q"><span class="no">Q' + (i + 1) + '</span><h2>' + esc(q[1]) + '</h2></div><div class="tri">' +
        [0, 1, 2].map(function (k) { return '<button class="opt' + (sel === k ? ' sel' : '') + '" data-v="' + k + '">' + A.face(k) + t.scale[k] + '</button>'; }).join('') + '</div>';
    }
    if (t.note && i === 0) h += '<p class="note" style="text-align:center">' + t.note + '</p>';
    $main.innerHTML = h + '</section>';
  }
  function answer(v) {
    if (lock) return;
    var t = D[cur], s = st[cur], id = cur;
    s.ans[s.i] = v; s.ans.length = Math.max(s.ans.length, s.i + 1);
    lock = true; drawQ(true);
    setTimeout(function () {
      lock = false;
      if (id !== cur) return;
      if (s.i + 1 >= t.qs.length) {
        s.ans = s.ans.slice(0, t.qs.length);
        s.res = { ans: s.ans.slice(), at: Date.now() };
        put('res.' + id, s.res); put('cur.' + id, null);
        s.ans = []; s.i = 0; s.mode = 'res'; draw(); window.scrollTo(0, 0);
      } else {
        s.i++; put('cur.' + id, { i: s.i, ans: s.ans }); drawQ();
      }
    }, cur === 'love' || cur === 'mbti' ? 260 : 200);
  }

  // ── 결과 ──
  function row(title, body) { return '<div class="row"><h3>' + title + '</h3>' + body + '</div>'; }
  function list(a) { return '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
  function tags(a) { return '<div class="tags">' + a.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>'; }
  function meter(items) {
    return '<div class="meter">' + items.map(function (m) {
      return '<div><span>' + m[0] + '</span><span class="tr"><i style="width:' + m[1] + '%;background:' + m[2] + '"></i></span><span>' + m[1] + '%</span></div>';
    }).join('') + '</div>';
  }
  var share = '';
  function drawRes() {
    var s = st[cur], r = SCORE[cur](s.res.ans), h = '<section class="card res pop">', next = IDS[(IDS.indexOf(cur) + 1) % IDS.length];
    if (cur === 'mbti') {
      var M = D.mbti, mt = r.t, ax = M.axes;
      h += '<p class="lead">나의 MBTI는</p>' + A.tiles(r.code, ax.map(function (a, i) { return r.pct[i] > 50 ? a[2] : a[3]; })) +
        '<h1 style="color:' + mt.color + '">' + r.code + '</h1><span class="chip" style="background:' + mt.color + '">' + mt.name + '</span>' +
        '<p class="desc">' + mt.desc + '</p><div class="rows">' +
        row('네 가지 성향', '<div class="axes">' + ax.map(function (a, i) {
          var p = r.pct[i], hi = p > 50;
          return '<div class="ax"><span class="' + (hi ? 'on' : '') + '">' + a[0] + ' ' + a[2] + '</span><span class="tr2"><i style="' + (hi ? 'left:0;width:' + p : 'right:0;width:' + (100 - p)) + '%;background:' + ['#f2994a', '#27ae60', '#2d7fd8', '#9b51e0'][i] + '"></i></span><span class="' + (hi ? '' : 'on') + '">' + a[3] + ' ' + a[1] + '</span><b>' + (hi ? p : 100 - p) + '% ' + (hi ? a[0] : a[1]) + '</b></div>';
        }).join('') + '</div>') +
        row('이런 점이 강해요', list(mt.good)) +
        row('이런 점은 조심', '<p>' + mt.weak + '</p>') +
        row('어울리는 직업', tags(mt.jobs)) +
        row('잘 맞는 유형', '<p><b>' + r.mate + ' ' + M.types[r.mate].name + '</b><br>생각의 결은 비슷하고 생활의 속도는 반대라 서로를 채워 주는 사이입니다.</p>') +
        row('사주로 본 MBTI와 비교', '<p>생년월일로 사주를 풀어 MBTI 성향을 보여 주는 <a href="/saju/" target="_blank" rel="noopener">MBTI사주</a>에서 내 결과와 견줘 보세요.</p>') + '</div>';
      share = '나의 MBTI는 ' + r.code + ', ' + mt.name + '!';
    } else if (cur === 'age') {
      var b = r.band, real = get('real');
      h += '<p class="lead">나의 정신연령은</p>' + A.cake(r.age, b.color) +
        '<h1 style="color:' + b.color + '">' + r.age + '<small>살</small></h1><span class="chip" style="background:' + b.color + '">' + b.name + '</span>' +
        '<p class="desc">' + b.desc + '</p><div class="rows">' +
        row('이런 점이 좋아요', '<p>' + b.good + '</p>') +
        row('이런 점은 조심', '<p>' + b.care + '</p>') +
        row('자주 하는 말', '<span class="bub">' + b.say + '</span>') +
        row('잘 맞는 친구', '<p>' + b.mate + '</p>') +
        row('실제 나이와 비교', '<div class="agein"><input id="real" type="number" inputmode="numeric" min="1" max="120" placeholder="나이" value="' + (real || '') + '"><span>살</span></div><p class="cmp" id="cmp"></p>') +
        '</div>';
      share = '나의 정신연령은 ' + r.age + '살, ' + b.name + '!';
    } else if (cur === 'love') {
      var t = r.t;
      h += '<p class="lead">나의 연애유형은</p>' + A[r.key](t.color) +
        '<h1 style="color:' + t.color + '">' + t.name + '</h1><span class="chip" style="background:' + t.color + '">' + t.kind + '</span>' +
        '<p class="desc"><b>' + t.line + '</b><br>' + t.desc + '</p><div class="rows">' +
        row('나의 애착 점수', meter([['불안', r.a, '#e8892e'], ['회피', r.v, '#5b6bd5']]) + A.map(r.a, r.v, t.color)) +
        row('연애할 때 나는', list(t.love)) +
        row('이런 점은 조심', '<p>' + t.care + '</p>') +
        row('내가 바라는 것', '<p>' + t.want + '</p>') +
        row('잘 맞는 유형', '<p>' + t.match + '</p>') + '</div>';
      share = '나의 연애유형은 ' + t.name + '! ' + t.line;
    } else {
      var T = D.job.types, t1 = T[r.rank[0]], t2 = T[r.rank[1]], t3 = T[r.rank[2]];
      h += '<p class="lead">나에게 맞는 일은</p>' + A.badge(r.code, t1.color) +
        '<h1 style="color:' + t1.color + '">' + t1.name + '</h1><span class="chip" style="background:' + t1.color + '">' + t1.nick + '</span>' +
        '<p class="desc">' + t1.desc + '</p><div class="rows">' +
        row('나의 흥미 육각형', A.hex(r.s, D.job.order, T) + meter(r.rank.map(function (k) { return [T[k].name, r.s[k], T[k].color]; }))) +
        row('어울리는 직업', tags(t1.jobs)) +
        row('어울리는 전공', tags(t1.study)) +
        row('두 번째 · ' + t2.name + ' (' + t2.nick + ')', '<p>' + t2.desc + '</p>' + tags(t2.jobs.slice(0, 5))) +
        row('세 번째 · ' + t3.name + ' (' + t3.nick + ')', tags(t3.jobs.slice(0, 5))) + '</div>';
      share = '나의 직업적성은 ' + t1.name + '(' + r.code + ')! ' + t1.nick;
    }
    h += '<div class="btns"><button class="ghost" data-act="copy">결과 복사</button><button class="ghost" data-act="restart">다시 하기</button></div>' +
      '<button class="big" data-act="next" data-to="' + next + '">' + D[next].title + ' 하러 가기</button>' +
      '<p class="small">' + (cur === 'mbti' ? '공식 MBTI 검사가 아니며, 새로 만든 문항으로 재미로 보는 테스트입니다.' : cur === 'age' ? '재미로 보는 테스트이며 공인된 심리검사가 아닙니다.' : cur === 'love' ? '애착 이론을 바탕으로 새로 만든 문항입니다. 재미로 보는 테스트이며 공인된 심리검사가 아닙니다.' : '홀랜드 흥미 이론을 바탕으로 새로 만든 문항입니다. 재미로 보는 테스트이며 공인된 진로검사가 아닙니다.') + '</p>';
    $main.innerHTML = h + '</section>';
    if (cur === 'age') { var inp = document.getElementById('real'); inp.addEventListener('input', function () { cmp(r.age); }); cmp(r.age); }
  }
  function cmp(age) {
    var v = parseInt(document.getElementById('real').value, 10), el = document.getElementById('cmp');
    if (!(v > 0 && v < 121)) { el.textContent = ''; put('real', null); return; }
    put('real', v);
    var d = age - v;
    el.textContent = d === 0 ? '몸과 마음 나이가 똑같아요!' : d < 0 ? '실제 나이보다 ' + (-d) + '살 젊은 마음이에요' : '실제 나이보다 ' + d + '살 어른스러운 마음이에요';
  }

  // ── 누르기 ──
  $main.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var s = st[cur], act = b.getAttribute('data-act');
    if (b.hasAttribute('data-v')) return answer(+b.getAttribute('data-v'));
    if (act === 'restart') { s.ans = []; s.i = 0; put('cur.' + cur, null); s.mode = 'q'; draw(); }
    else if (act === 'resume') { s.i = Math.min(s.ans.length, D[cur].qs.length - 1); s.mode = 'q'; draw(); }
    else if (act === 'last') { s.mode = 'res'; draw(); }
    else if (act === 'back') { if (s.i > 0) { s.i--; put('cur.' + cur, { i: s.i, ans: s.ans }); drawQ(); } else { s.mode = 'intro'; draw(); } }
    else if (act === 'next') { go(b.getAttribute('data-to')); }
    else if (act === 'copy') { copy(share + ' ' + D[cur].title + ' 해 보기 ' + location.href.split('?')[0].split('#')[0] + '#' + cur); }
  });
  function copy(txt) {
    function ok() { toast('결과를 복사했어요'); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(txt).then(ok, fb); } else fb();
    function fb() { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} ta.remove(); }
  }
  var tt;
  function toast(m) { var el = document.getElementById('toast'); el.textContent = m; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { el.classList.remove('on'); }, 1600); }

  // 검사용: ?fake=1 이면 무작위 답으로 결과를 채운다
  if (/[?&]fake=1/.test(location.search)) {
    IDS.forEach(function (id) {
      var n = id === 'age' ? 4 : id === 'love' || id === 'mbti' ? 5 : 3;
      st[id].res = { ans: D[id].qs.map(function () { return Math.floor(Math.random() * n); }) }; st[id].mode = 'res';
    });
  }
  var m = location.search.match(/[?&]q=(\d+)/);
  go(location.hash.slice(1) || 'mbti');
  if (m) { st[cur].i = +m[1]; st[cur].mode = 'q'; draw(); }
})();
