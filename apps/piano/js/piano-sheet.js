/* 피아노 악보 페이지 — 곡 목록(piano-index.js)과 곡 하나(js/songs/<id>.js)로 돈다.
   로컬 sheet.html: 목록에서 고르면 곡 파일을 그때 읽어 한 페이지에서 보여 준다.
   사이트: 목록 페이지(/apps/piano-sheet/)는 카드가 곡 페이지 링크, 곡 페이지(/apps/piano-sheet/<id>/)는 그 곡 파일이 함께 실린다 */
(function () {
  var INDEX = window.PIANO_INDEX, SC = window.PianoScore;
  if (!INDEX || !SC) return;
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  function tr(ko, en) { return EN ? en : ko; }
  var root = document.getElementById('psheet');
  var $ = function (id) { return document.getElementById(id); };
  var qa = function (sel, el) { return [].slice.call((el || root).querySelectorAll(sel)); };
  var SITE = root.getAttribute('data-site') || '';            // 사이트면 곡 페이지들의 바탕 주소(/apps/piano-sheet/), 로컬이면 ''
  var PRACTICE = root.getAttribute('data-practice') || (EN ? 'index-en.html' : 'index.html');
  var SONGDIR = root.getAttribute('data-songs') || 'js/songs/';
  if (EN) { qa('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); }); }
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('piano.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('piano.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var label = LS.get('label', EN ? 'eng' : 'kor'), cur = -1;
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function songOf(i) { return (window.PIANO_SONG_DATA || {})[INDEX[i].id]; }

  /* 곡 목록 카드 */
  var list = $('shList');
  if (list) {
    var h = '';
    INDEX.forEach(function (s, i) {
      var inner = '<span class="n">' + (i + 1) + ' · ' + tr('난이도', 'Level') + ' ' + s.lv + '</span><span class="t">' + esc(EN ? s.en : s.ko) + '</span><span class="st">' + (s.ts === 1.5 ? '3/8' : s.ts + '/4') + ' · ♩' + s.bpm + '</span>';
      h += SITE ? '<a class="songcard ivory" href="' + SITE + s.id + '/">' + inner + '</a>'
                : '<button type="button" class="songcard ivory" data-i="' + i + '">' + inner + '</button>';
    });
    list.innerHTML = h;
    if (!SITE) qa('.songcard', list).forEach(function (b) { b.addEventListener('click', function () { open(+b.dataset.i); }); });
  }

  function labelTxt() { var b = $('shLabel'); if (b) b.textContent = label === 'kor' ? '도레미' : label === 'eng' ? 'CDE' : tr('계이름 끔', 'No names'); }
  function draw() {
    var s = songOf(cur); if (!s) return;
    if ($('shTitle')) $('shTitle').textContent = EN ? s.en : s.ko;
    if ($('shLv')) $('shLv').textContent = tr('난이도', 'Level') + ' ' + s.lv + ' · ♩ ' + s.bpm;
    $('shScore').innerHTML = SC.svg(s, { names: label, en: EN });
    if ($('shPrev')) $('shPrev').disabled = cur === 0;
    if ($('shNext')) $('shNext').disabled = cur === INDEX.length - 1;
    if ($('shPlay')) $('shPlay').href = PRACTICE + '#song=' + s.id;
    if (!SITE) { document.title = (EN ? s.en : s.ko) + ' — ' + tr('피아노 악보', 'Piano Sheet Music'); try { history.replaceState(null, '', '#' + s.id); } catch (e) {} }
  }
  function loadSong(i, fn) {
    if (songOf(i)) { fn(); return; }
    var sc = document.createElement('script');
    sc.src = SONGDIR + INDEX[i].id + '.js' + (window.PIANO_V ? '?v=' + window.PIANO_V : '');
    sc.onload = fn; document.head.appendChild(sc);
  }
  function open(i) {
    if (SITE) { location.href = SITE + INDEX[i].id + '/'; return; }
    cur = i;
    loadSong(i, function () {
      if ($('shHome')) $('shHome').hidden = true;
      $('shView').hidden = false; draw();
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    });
  }
  function home() {
    $('shView').hidden = true; if ($('shHome')) $('shHome').hidden = false; cur = -1;
    document.title = tr('피아노 악보', 'Piano Sheet Music');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  if ($('shBack') && !SITE) $('shBack').addEventListener('click', home);
  if ($('shPrev')) $('shPrev').addEventListener('click', function () { if (cur > 0) open(cur - 1); });
  if ($('shNext')) $('shNext').addEventListener('click', function () { if (cur < INDEX.length - 1) open(cur + 1); });
  if ($('shLabel')) $('shLabel').addEventListener('click', function () { label = label === 'kor' ? 'eng' : label === 'eng' ? 'none' : 'kor'; LS.set('label', label); labelTxt(); draw(); });
  if ($('shPrint')) $('shPrint').addEventListener('click', function () { window.print(); });
  labelTxt();

  /* 처음 열 곡: 사이트 곡 페이지는 data-song, 로컬은 주소의 #id */
  var first = root.getAttribute('data-song') || (location.hash || '').slice(1), idx = -1;
  INDEX.forEach(function (s, i) { if (s.id === first) idx = i; });
  if (idx >= 0) { cur = idx; if (SITE) { $('shView').hidden = false; draw(); } else open(idx); }
  window.__ps = { open: open, home: home, songs: INDEX, svg: SC.svg, song: songOf };
})();
