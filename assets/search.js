// 상단 메뉴 SEARCH — 게임·앱 이름으로 찾기 (사장님 2026-09-30 "게임즈 앞에 메뉴로 넣어")
// 목록은 search-index.js (make-search.py 가 목록 페이지 카드에서 만든다). 메뉴를 처음 누를 때 읽는다.
// 이름·다른 언어 이름·분류 글자로 찾고, 한글은 초성(ㅂㄹ → 볼링)으로도 찾는다.
(function () {
  var IDX_V = 16;   // search-index.js 를 새로 만들면 하나 올린다
  var btn = document.querySelector('.nav .navsearch');
  if (!btn) return;
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var T = EN ? { ph: 'Search games', none: 'No results', close: 'Clear' }
             : { ph: '게임 검색', none: '검색 결과가 없습니다', close: '지우기' };
  var list = null, loading = false, panel, input, box, sel = -1, shown = [];

  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s·:!.,&'\-]/g, ''); }
  function cho(s) {
    var o = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i) - 0xAC00;
      o += (c >= 0 && c < 11172) ? CHO[Math.floor(c / 588)] : s[i];
    }
    return o;
  }
  function isCho(q) { return /^[ㄱ-ㅎ]+$/.test(q); }

  function load(cb) {
    if (list) return cb();
    if (loading) return;
    loading = true;
    var s = document.createElement('script');
    s.src = '/assets/search-index.js?v=' + IDX_V;
    s.onload = function () {
      var d = window.OREUM_SEARCH || {};
      list = (EN ? d.en : d.ko) || [];
      list.forEach(function (c) {
        c._n = norm(c.n); c._o = norm(c.o) + ' ' + norm(c.a); c._a = norm(c.a); c._t = norm(c.t);
        c._c = norm(cho(c.n)) + ' ' + norm(cho(c.a || ''));
      });
      cb();
    };
    document.head.appendChild(s);
  }

  function find(q) {
    q = norm(q);
    if (!q) return [];
    var ch = isCho(q), out = [];
    list.forEach(function (c, i) {
      var r = -1;
      if (c._n.indexOf(q) === 0 || c._o.indexOf(q) === 0 || (c._a && c._a.indexOf(q) === 0)) r = 0;
      else if (c._n.indexOf(q) >= 0 || c._o.indexOf(q) >= 0) r = 1;
      else if (ch && c._c.indexOf(q) === 0) r = 2;
      else if (ch && c._c.indexOf(q) > 0) r = 3;
      else if (c._t.indexOf(q) >= 0) r = 4;
      if (r >= 0) out.push({ c: c, r: r, i: i });
    });
    out.sort(function (a, b) { return a.r - b.r || a.i - b.i; });
    return out.slice(0, 20).map(function (x) { return x.c; });
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function render() {
    var q = input.value;
    shown = list ? find(q) : [];
    sel = shown.length ? 0 : -1;
    if (!norm(q)) { box.innerHTML = ''; return; }
    if (!shown.length) { box.innerHTML = '<p class="gs-none">' + T.none + '</p>'; return; }
    box.innerHTML = shown.map(function (c, i) {
      return '<a class="gs-item' + (i === sel ? ' on' : '') + '" href="' + esc(c.u) + '">' +
        '<img src="' + esc(c.i) + '" alt="" width="64" height="40" decoding="async">' +
        '<span><b>' + esc(c.n) + (c.a ? ' <em>' + esc(c.a) + '</em>' : '') + '</b>' + (c.t ? '<i>' + esc(c.t) + '</i>' : '') + '</span></a>';
    }).join('');
  }
  function mark() {
    var a = box.querySelectorAll('.gs-item');
    for (var i = 0; i < a.length; i++) a[i].classList.toggle('on', i === sel);
    if (a[sel]) a[sel].scrollIntoView({ block: 'nearest' });
  }

  function build() {
    panel = document.createElement('div');
    panel.className = 'gsearch';
    panel.setAttribute('role', 'search');
    panel.innerHTML =
      '<div class="gs-row"><svg class="gs-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7d8a76" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' +
      '<input type="search" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="' + T.ph + '" aria-label="' + T.ph + '">' +
      '<button type="button" class="gs-x" aria-label="' + T.close + '">&times;</button></div>' +
      '<div class="gs-list"></div>';
    btn.closest('.header-inner').appendChild(panel);
    input = panel.querySelector('input');
    box = panel.querySelector('.gs-list');
    input.addEventListener('input', function () { load(render); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && shown.length) { sel = (sel + 1) % shown.length; mark(); e.preventDefault(); }
      else if (e.key === 'ArrowUp' && shown.length) { sel = (sel - 1 + shown.length) % shown.length; mark(); e.preventDefault(); }
      else if (e.key === 'Enter' && sel >= 0) { location.href = shown[sel].u; e.preventDefault(); }
      else if (e.key === 'Escape') { close(); btn.focus(); }
    });
    // X 는 입력한 글자를 지운다(글자가 없으면 닫기). 누를 때 입력칸 초점을 뺏지 않아
    // 폰 자판이 내려가며 화면이 밀려 손가락이 빗나가는 일을 막는다 (사장님 2026-09-30 "X눌러도 입력한거 지우기가 안된다")
    var x = panel.querySelector('.gs-x');
    x.addEventListener('mousedown', function (e) { e.preventDefault(); });
    x.addEventListener('touchstart', function (e) { e.preventDefault(); clearOrClose(); }, { passive: false });
    x.addEventListener('click', clearOrClose);
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside, { passive: true });
  }
  function clearOrClose() {
    if (input.value) { input.value = ''; render(); input.focus(); }
    else close();
  }
  function outside(e) {
    if (!panel || panel.hidden) return;
    if (panel.contains(e.target) || btn.contains(e.target)) return;
    close();
  }
  function open() {
    if (!panel) build();
    panel.hidden = false;
    place();
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('on');
    input.focus();
    load(render);
  }
  // 검색칸은 SEARCH 메뉴 바로 아래, 메뉴 왼쪽 끝에 맞춘다. 폰(720px 이하)은 폭 전체(css)
  function place() {
    var host = panel.parentNode;
    if (innerWidth <= 720) { panel.style.left = ''; panel.style.top = ''; return; }
    var h = host.getBoundingClientRect(), b = btn.getBoundingClientRect();
    var left = Math.max(0, Math.min(b.left - h.left, h.width - panel.offsetWidth));
    panel.style.left = left + 'px';
    panel.style.top = (b.bottom - h.top + 8) + 'px';
  }
  function replace() { if (panel && !panel.hidden) place(); }
  addEventListener('resize', replace);
  if (window.ResizeObserver) new ResizeObserver(replace).observe(btn.closest('.header-inner'));
  function close() {
    if (!panel) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('on');
  }

  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    if (panel && !panel.hidden) close(); else open();
  });
})();
