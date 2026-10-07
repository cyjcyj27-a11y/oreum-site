/* 피아노 연습 — 브라우저 안에서만 돌고 진도는 이 기기에만 남는다 */
(function () {
  var Y = window.PianoSynth, SONGS = window.PIANO_SONGS, CLEF = window.PIANO_CLEF;
  if (!Y || !SONGS) return;
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  function tr(ko, en) { return EN ? en : ko; }
  var root = document.getElementById('piano');
  var $ = function (id) { return document.getElementById(id); };
  var qa = function (sel, el) { return [].slice.call((el || root).querySelectorAll(sel)); };
  var HOVER = window.matchMedia && window.matchMedia('(hover:hover)').matches;

  /* 영문판: data-en 글자로 바꾼다 */
  if (EN) { qa('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); }); qa('a[href="sheet.html"]').forEach(function (a) { a.href = 'sheet-en.html'; }); }

  /* ---------------------------------------------------------- 저장 */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem('piano.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('piano.' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var S = {
    snd: LS.get('snd', 1),
    label: LS.get('label', EN ? 'eng' : 'kor'),   // kor | eng | none
    prog: LS.get('prog', { song: {}, ear: [], sheet: [] }),
    rec: LS.get('rec', null),
    bpm: LS.get('bpm', 80)
  };
  if (!S.prog.song) S.prog.song = {};
  if (!S.prog.ear) S.prog.ear = [];
  if (!S.prog.sheet) S.prog.sheet = [];
  function saveProg() { LS.set('prog', S.prog); }
  function songStars(id) { return S.prog.song[id] || [0, 0, 0, 0]; }
  function setSongStar(id, st, n) { var a = songStars(id).slice(); if (n > (a[st] || 0)) { a[st] = n; S.prog.song[id] = a; saveProg(); } }
  function setLvStar(kind, i, n) { var a = S.prog[kind]; if (n > (a[i] || 0)) { a[i] = n; saveProg(); } }
  Y.mute(!S.snd);

  /* ---------------------------------------------------------- 도구 */
  function white(lo, hi) { var a = []; for (var m = lo; m <= hi; m++) if (!Y.isBlack(m)) a.push(m); return a; }
  function chrom(lo, hi) { var a = []; for (var m = lo; m <= hi; m++) a.push(m); return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function starsOf(acc) { return acc >= 0.95 ? 3 : acc >= 0.8 ? 2 : acc >= 0.6 ? 1 : 0; }
  function starTxt(n, max) { var s = ''; for (var i = 0; i < (max || 3); i++) s += i < n ? '★' : '<i>★</i>'; return s; }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var KOR_NAMES = ['도', '도♯', '레', '레♯', '미', '파', '파♯', '솔', '솔♯', '라', '라♯', '시'];
  var ENG_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var KOR_FLAT = ['도', '레♭', '레', '미♭', '미', '파', '솔♭', '솔', '라♭', '라', '시♭', '시'];
  var ENG_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  function nameOf(m, flat) {
    var k = m % 12;
    if (S.label === 'none') return '';
    if (S.label === 'eng') return (flat ? ENG_FLAT : ENG_NAMES)[k];
    return (flat ? KOR_FLAT : KOR_NAMES)[k];
  }
  function fullName(m, flat) {   // 결과 보여 줄 때는 설정과 상관없이
    var k = m % 12, o = Math.floor(m / 12) - 1;
    return (EN ? (flat ? ENG_FLAT : ENG_NAMES) : (flat ? KOR_FLAT : KOR_NAMES))[k] + o;
  }
  function show(id) {
    ['pHome', 'pSong'].forEach(function (s) { $(s).hidden = s !== id; });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  function tapSound() { Y.tap(); }
  qa('button').forEach(function (b) { b.addEventListener('pointerdown', function () { if (!b.classList.contains('nosnd')) tapSound(); }); });

  /* ---------------------------------------------------------- 건반 */
  var KB = { lo: 60, hi: 84, keys: {}, geom: {}, el: $('kb'), pcBase: 60, baseZ: 48, baseQ: 60, down: {}, ptr: {}, whites: [], vis: 15, scroll: 0, anim: 0 };
  /* 보이는 건반 수(흰건반 기준, 사장님 10/7 "옥타브가 아니라 건반숫자"). 저장 piano.keys, 처음엔 화면 폭으로 */
  var KEY_STEPS = [8, 11, 14, 17, 21, 24];
  function keyCount() { var k = LS.get('keys', 0); if (k) return k; var w = window.innerWidth; return w >= 1000 ? 21 : w >= 600 ? 14 : 8; }
  function whiteIndex(m) { var i = KB.whites.indexOf(m); if (i < 0) i = KB.whites.indexOf(m + 1); return i < 0 ? 0 : i; }
  /* 건반을 s 번째 흰건반이 왼쪽 끝에 오게 민다(움직임 .2초) */
  function setScroll(s, instant) {
    var nw = KB.whites.length, vis = Math.min(KB.vis, nw);
    s = Math.max(0, Math.min(nw - vis, s));
    if (KB.anim) cancelAnimationFrame(KB.anim);
    var from = KB.scroll, t0 = performance.now();
    if (instant || Math.abs(s - from) < 0.01) { KB.scroll = s; KB.el.style.transform = 'translateX(' + (-s * 100 / nw) + '%)'; measureKB(); return; }
    function step(ts) {
      var k = Math.min(1, (ts - t0) / 200), e = 1 - (1 - k) * (1 - k);
      KB.scroll = from + (s - from) * e;
      KB.el.style.transform = 'translateX(' + (-KB.scroll * 100 / nw) + '%)'; measureKB();
      if (k < 1) KB.anim = requestAnimationFrame(step); else KB.anim = 0;
    }
    KB.anim = requestAnimationFrame(step);
  }
  /* 보이는 건반 수를 바꾼다(곡이 더 넓게 필요하면 고른 수보다 넓혀서) */
  function setVis(v) {
    var nw = KB.whites.length; KB.vis = Math.max(1, v);
    var vis = Math.min(KB.vis, nw);
    KB.el.style.width = (nw / vis * 100) + '%';
    setScroll(KB.scroll, true);
  }
  /* 이 음들이 보이게 민다(안 보이는 음이 있을 때만, 가운데로) */
  function scrollTo(ms) {
    var nw = KB.whites.length, vis = Math.min(KB.vis, nw); if (nw <= vis || !ms.length) return;
    var lo = 1e9, hi = -1; ms.forEach(function (m) { var i = whiteIndex(m); if (i < lo) lo = i; if (i > hi) hi = i; });
    if (lo >= KB.scroll && hi < KB.scroll + vis) return;
    setScroll((lo + hi + 1) / 2 - vis / 2);
  }
  var LOWER = { KeyZ: 0, KeyS: 1, KeyX: 2, KeyD: 3, KeyC: 4, KeyV: 5, KeyG: 6, KeyB: 7, KeyH: 8, KeyN: 9, KeyJ: 10, KeyM: 11, Comma: 12, KeyL: 13, Period: 14, Semicolon: 15, Slash: 16 };
  var UPPER = { KeyQ: 0, Digit2: 1, KeyW: 2, Digit3: 3, KeyE: 4, KeyR: 5, Digit5: 6, KeyT: 7, Digit6: 8, KeyY: 9, Digit7: 10, KeyU: 11, KeyI: 12, Digit9: 13, KeyO: 14, Digit0: 15, KeyP: 16 };
  var LOWER_LB = {}, UPPER_LB = {};
  Object.keys(LOWER).forEach(function (c) { LOWER_LB[LOWER[c]] = { Comma: ',', KeyL: 'L', Period: '.', Semicolon: ';', Slash: '/' }[c] || c.replace('Key', ''); });
  Object.keys(UPPER).forEach(function (c) { UPPER_LB[UPPER[c]] = c.replace('Key', '').replace('Digit', ''); });
  /* 아랫줄(Z 줄) = 왼손 옥타브 baseZ, 윗줄(Q 줄) = 오른손 옥타브 baseQ. 곡 연습에선 손마다 따로 잡는다(사장님 10/7 "왼손 오른손 한글 키보드 기준으로 나눠줘") */
  function pcMidi(code) { if (LOWER[code] !== undefined) return KB.baseZ + LOWER[code]; if (UPPER[code] !== undefined) return KB.baseQ + UPPER[code]; return null; }
  /* 자판 좌우 반 나누기(사장님 10/7 "좌우 반으로 나누기"): 왼쪽 반 = 왼손, 오른쪽 반 = 오른손.
     각 반쪽 안에서 아랫줄(Z·N 줄) → 가운뎃줄(A·H 줄) → 윗줄(Q·Y 줄) 순서로 흰건반이 올라간다. 검은건반 = Shift + 그 흰건반 글자 */
  var LEFT_W = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'];
  var RIGHT_W = ['KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'];
  var WHITE_OFF = [0, 2, 4, 5, 7, 9, 11];   // 도 레 미 파 솔 라 시
  var KEYCAP = { Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']' };
  function cap(code) { return KEYCAP[code] || code.replace('Key', ''); }
  var LEFT = {}, RIGHT = {};
  LEFT_W.forEach(function (c, i) { LEFT[c] = 12 * Math.floor(i / 7) + WHITE_OFF[i % 7]; });
  RIGHT_W.forEach(function (c, i) { RIGHT[c] = 12 * Math.floor(i / 7) + WHITE_OFF[i % 7]; });
  function pcMidi(code, shift) {
    var m = null;
    if (LEFT[code] !== undefined) m = KB.baseZ + LEFT[code];
    else if (RIGHT[code] !== undefined) m = KB.baseQ + RIGHT[code];
    if (m === null) return null;
    if (shift) { if (m % 12 === 4 || m % 12 === 11) return null; m += 1; }   // 미·시는 샵이 없다
    return m;
  }
  /* 건반에 적을 글자: 그 음을 내는 자판(오른쪽 반 우선) */
  function pcLabel(m) {
    var c, off, i;
    function find(map, base, list) {
      var o = m - base;
      for (i = 0; i < list.length; i++) if (map[list[i]] === o) return cap(list[i]);
      if (Y.isBlack(m)) for (i = 0; i < list.length; i++) if (map[list[i]] === o - 1) return '⇧' + cap(list[i]);
      return '';
    }
    c = find(RIGHT, KB.baseQ, RIGHT_W); if (c) return c;
    return find(LEFT, KB.baseZ, LEFT_W);
  }
  var MODE = null;   // 지금 화면의 손잡이 { onPress, onRelease, tick, stop }

  function buildKB(lo, hi) {
    if (Y.isBlack(lo)) lo--;
    if (Y.isBlack(hi)) hi++;
    KB.lo = lo; KB.hi = hi; KB.keys = {}; KB.down = {};
    var el = KB.el; el.innerHTML = '';
    var whites = white(lo, hi), nw = whites.length, ww = 100 / nw;
    KB.whites = whites; KB.vis = keyCount();
    var vis = Math.min(KB.vis, nw);
    el.style.width = (nw / vis * 100) + '%';   // 보이는 수보다 많으면 건반이 화면 밖으로 이어지고 옆으로 민다
    el.style.transform = 'none'; KB.scroll = 0; if (KB.anim) { cancelAnimationFrame(KB.anim); KB.anim = 0; }
    var m, i, k;
    for (i = 0; i < nw; i++) {
      m = whites[i];
      k = document.createElement('div'); k.className = 'wk'; k.dataset.m = m;
      k.style.left = (i * ww) + '%'; k.style.width = ww + '%';
      k.innerHTML = '<span class="kk"></span><span class="lb"></span>';
      el.appendChild(k); KB.keys[m] = k;
    }
    for (m = lo; m <= hi; m++) {
      if (!Y.isBlack(m)) continue;
      var idx = whites.indexOf(m + 1);   // 오른쪽 흰 건반
      var bw = ww * 0.6, off = [1, 3, 6, 8, 10].indexOf(m % 12);
      var shift = (off === 0 || off === 2) ? -0.08 : (off === 1 || off === 4) ? 0.08 : 0;   // 검은 건반은 둘·셋 묶음으로 살짝 치우친다
      k = document.createElement('div'); k.className = 'bk'; k.dataset.m = m;
      k.style.left = (idx * ww - bw / 2 + shift * ww) + '%'; k.style.width = bw + '%';
      k.innerHTML = '<span class="kk"></span><span class="lb"></span>';
      el.appendChild(k); KB.keys[m] = k;
    }
    KB.pcBase = Math.max(0, Math.floor(lo / 12) * 12);
    if (KB.pcBase < lo) KB.pcBase += 12;
    if (KB.pcBase > hi) KB.pcBase = Math.floor(lo / 12) * 12;
    KB.baseZ = KB.pcBase; KB.baseQ = KB.pcBase + 12;   // 기본: 왼쪽 반은 낮은 옥타브부터, 오른쪽 반은 한 옥타브 위부터
    labelKB();
    el.classList.toggle('nokey', !HOVER);
    measureKB();
  }
  function labelKB() {
    var m;
    for (m in KB.keys) {
      var k = KB.keys[m], mm = +m;
      k.querySelector('.lb').textContent = (S.label === 'none') ? '' : (Y.isBlack(mm) ? nameOf(mm) : nameOf(mm) + (S.label === 'eng' ? (Math.floor(mm / 12) - 1) : (mm % 12 === 0 ? (Math.floor(mm / 12) - 1) : '')));
      k.querySelector('.kk').textContent = pcLabel(mm);
    }
    KB.el.classList.toggle('nolabel', S.label === 'none');
  }
  function measureKB() {
    var base = $('sView').getBoundingClientRect(), m;
    KB.geom = {};
    for (m in KB.keys) { var r = KB.keys[m].getBoundingClientRect(); KB.geom[m] = { x: r.left - base.left, w: r.width, black: Y.isBlack(+m) }; }
    var ww = KB.geom[KB.lo] ? KB.geom[KB.lo].w : 40;
    KB.el.classList.toggle('tiny', ww < 24);
    KB.el.classList.toggle('narrow', ww >= 24 && ww < 34);
    var rot = $('tRot'); if (rot) rot.classList.toggle('show', white(KB.lo, KB.hi).length > 10);
  }
  function press(m, vel) {
    var k = KB.keys[m]; if (!k || KB.down[m]) return;
    KB.down[m] = 1; k.classList.add('on');
    Y.noteOn(m, vel == null ? 0.78 : vel);
    if (MODE && MODE.onPress) MODE.onPress(m);
  }
  function release(m) {
    var k = KB.keys[m]; if (!k || !KB.down[m]) return;
    delete KB.down[m]; k.classList.remove('on');
    Y.noteOff(m);
    if (MODE && MODE.onRelease) MODE.onRelease(m);
  }
  function releaseAll() { Object.keys(KB.down).forEach(function (m) { release(+m); }); }
  function flashBad(m) { var k = KB.keys[m]; if (!k) return; k.classList.add('bad'); setTimeout(function () { k.classList.remove('bad'); }, 260); }
  function clearHints() { qa('.hint, .hintL', KB.el).forEach(function (k) { k.classList.remove('hint'); k.classList.remove('hintL'); }); }
  function hint(m, left) { var k = KB.keys[m]; if (k) k.classList.add(left ? 'hintL' : 'hint'); }

  /* 손가락·마우스: 미끄러뜨리면 글리산도 */
  function keyAt(x, y) { var el = document.elementFromPoint(x, y); if (!el) return null; el = el.closest ? el.closest('.wk, .bk') : null; return el ? +el.dataset.m : null; }
  KB.el.addEventListener('pointerdown', function (e) {
    Y.ready();
    var m = keyAt(e.clientX, e.clientY); if (m === null) return;
    try { KB.el.setPointerCapture(e.pointerId); } catch (x) {}
    KB.ptr[e.pointerId] = m; press(m, 0.72 + Math.random() * 0.12);
    e.preventDefault();
  });
  KB.el.addEventListener('pointermove', function (e) {
    if (KB.ptr[e.pointerId] === undefined) return;
    var m = keyAt(e.clientX, e.clientY), old = KB.ptr[e.pointerId];
    if (m !== null && m !== old) { release(old); KB.ptr[e.pointerId] = m; press(m, 0.7); }
  });
  function ptrUp(e) { var m = KB.ptr[e.pointerId]; if (m === undefined) return; delete KB.ptr[e.pointerId]; release(m); }
  KB.el.addEventListener('pointerup', ptrUp); KB.el.addEventListener('pointercancel', ptrUp);
  KB.el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* PC 자판 */
  var pcDown = {};
  document.addEventListener('keydown', function (e) {
    if ($('stage').hidden || e.repeat) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); setPedal(true, true); return; }
    if (e.code === 'ArrowLeft' || e.code === 'BracketLeft') { shiftPC(-12); return; }
    if (e.code === 'ArrowRight' || e.code === 'BracketRight') { shiftPC(12); return; }
    if (e.code === 'Escape') { if (!$('result').hidden) return; closeStage(); return; }
    var m = pcMidi(e.code, e.shiftKey); if (m === null || !KB.keys[m]) return;
    e.preventDefault(); Y.ready(); pcDown[e.code] = m; press(m, 0.8);
  });
  document.addEventListener('keyup', function (e) {
    if (e.code === 'Space') { setPedal(false, true); return; }
    var m = pcDown[e.code]; if (m === undefined) return; delete pcDown[e.code]; release(m);
  });
  function shiftPC(d) {
    if (KB.baseZ + d < KB.lo - 11 || KB.baseQ + d > KB.hi) return;
    KB.baseZ += d; KB.baseQ += d; labelKB();
  }
  // 왼쪽 반 15음(두 옥타브+도)·오른쪽 반 18음(두 옥타브 반)에 그 손의 음이 들도록 옥타브를 잡는다
  function fitBase(lo, hi, span) { var b = Math.floor(lo / 12) * 12; if (hi - b > span) b = lo; return b; }
  var pedalOn = false, pedalHold = false;
  function setPedal(on, hold) {
    if (hold) pedalHold = on;
    pedalOn = hold ? on : !pedalOn;
    Y.pedal(pedalOn);
    var b = $('tPedal'); if (b) b.classList.toggle('down', pedalOn);
  }
  window.addEventListener('resize', function () { if (!$('stage').hidden) { measureKB(); sizeCanvas(); } });

  /* ---------------------------------------------------------- 홈 목록 */
  var STAGE_DEF = [
    { ko: '오른손 연습', en: 'Right hand · practice', hand: 'R', wait: 1 },
    { ko: '오른손 연주', en: 'Right hand · play', hand: 'R', wait: 0 },
    { ko: '양손 연습', en: 'Both hands · practice', hand: 'LR', wait: 1 },
    { ko: '양손 연주', en: 'Both hands · play', hand: 'LR', wait: 0 }
  ];
  function songOpen(i) { return true; }   // 전부 열어 둔다(사장님 10/7 "다열어놔 막아놓지말고 모든단계")
  function songDone(id) { var a = songStars(id); return a[0] > 0 && a[1] > 0 && a[2] > 0 && a[3] > 0; }
  function allDone() { return SONGS.every(function (s) { return songDone(s.id); }); }
  function renderHome() {
    var h = '', done = 0;
    SONGS.forEach(function (s, i) {
      var st = songStars(s.id), open = songOpen(i), d = songDone(s.id); if (d) done++;
      var marks = ''; for (var k = 0; k < 4; k++) marks += (st[k] || 0) > 0 ? '★' : '<i>★</i>';
      h += '<button type="button" class="songcard ivory' + (open ? '' : ' lock') + (d ? ' done' : '') + '" data-i="' + i + '"' + (open ? '' : ' disabled') + '>' +
        '<span class="n">' + (i + 1) + ' · ' + tr('난이도', 'Level') + ' ' + s.lv + '</span><span class="t">' + esc(EN ? s.en : s.ko) + '</span><span class="st">' + marks + '</span></button>';
    });
    $('pSongList').innerHTML = h;
    $('pSongProg').textContent = done + ' / ' + SONGS.length;
    qa('.songcard', $('pSongList')).forEach(function (b) { b.addEventListener('click', function () { openSong(+b.dataset.i); }); });
    renderLv('ear', EAR, $('pEarList'), $('pEarProg'));
    renderLv('sheet', SHEET, $('pSheetList'), $('pSheetProg'));
    $('pConcert').hidden = !allDone();
  }
  function lvOpen(kind, i) { return true; }
  function renderLv(kind, DEF, box, prog) {
    var h = '', done = 0;
    DEF.forEach(function (d, i) {
      var st = S.prog[kind][i] || 0, open = lvOpen(kind, i); if (st > 0) done++;
      h += '<button type="button" class="lvcard ivory' + (open ? '' : ' lock') + '" data-i="' + i + '"' + (open ? '' : ' disabled') + '>' +
        '<span class="n">' + (i + 1) + '</span><span class="t">' + esc(EN ? d.en : d.ko) + '</span><span class="st">' + starTxt(st) + '</span></button>';
    });
    box.innerHTML = h;
    prog.textContent = done + ' / ' + DEF.length;
    qa('.lvcard', box).forEach(function (b) { b.addEventListener('click', function () { if (kind === 'ear') startEar(+b.dataset.i); else startSheet(+b.dataset.i); }); });
  }
  qa('.mode').forEach(function (b) {
    b.addEventListener('click', function () {
      var go = b.dataset.go;
      if (go === 'keys') startFree();
      else if (go === 'songs') { $('pSongList').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (go === 'ear') { $('pEarList').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (go === 'sheet') { $('pSheetList').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
  $('pReset').addEventListener('click', function () {
    if (!confirmBox(tr('진도를 지웁니다', 'Clear all progress?'))) return;
  });
  /* 확인 창: 오선지 종이 (브라우저 confirm 금지) */
  function confirmBox(msg) {
    var box = document.createElement('div');
    box.id = 'result'; box.style.position = 'fixed'; box.style.zIndex = 60;
    box.innerHTML = '<div class="paper card"><b style="font-size:26px">' + esc(msg) + '</b><div class="acts"><button type="button" class="btn ivory" data-x="0">' + tr('취소', 'CANCEL') + '</button><button type="button" class="btn ebony" data-x="1">OK</button></div></div>';
    root.appendChild(box);
    qa('button', box).forEach(function (b) {
      b.addEventListener('click', function () {
        root.removeChild(box);
        if (b.dataset.x === '1') { S.prog = { song: {}, ear: [], sheet: [] }; saveProg(); renderHome(); }
      });
    });
    return false;
  }

  /* ---------------------------------------------------------- 곡 하나 */
  var curSong = null;
  function openSong(i) {
    curSong = SONGS[i];
    $('pSongTitle').textContent = EN ? curSong.en : curSong.ko;
    $('pSongLv').textContent = tr('난이도', 'Level') + ' ' + curSong.lv + ' · ' + curSong.bpm + ' bpm';
    var st = songStars(curSong.id), h = '';
    STAGE_DEF.forEach(function (d, k) {
      var open = true;
      h += '<button type="button" class="stagebtn ' + (k % 2 ? 'ebony' : 'ivory') + (open ? '' : ' lock') + '" data-k="' + k + '"' + (open ? '' : ' disabled style="opacity:.5"') + '>' +
        '<span class="n">' + tr('단계', 'Stage') + ' ' + (k + 1) + '</span><span class="t">' + (EN ? d.en : d.ko) + '</span><span class="st">' + starTxt(st[k] || 0) + '</span></button>';
    });
    $('pStages').innerHTML = h;
    qa('.stagebtn', $('pStages')).forEach(function (b) { b.addEventListener('click', function () { startSong(curSong, +b.dataset.k); }); });
    show('pSong');
  }
  $('pSongBack').addEventListener('click', function () { renderHome(); show('pHome'); });
  $('pListen').addEventListener('click', function () { startSong(curSong, -1); });

  /* ---------------------------------------------------------- 연주 화면 공통 */
  var cv = $('fall'), cx = cv.getContext('2d'), DPR = 1, CW = 0, CH = 0, rafId = 0, lastTs = 0;
  function sizeCanvas() {
    var r = $('sView').getBoundingClientRect();
    DPR = Math.min(2, window.devicePixelRatio || 1);
    CW = r.width; CH = r.height;
    cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function openStage(name, lo, hi, opt) {
    opt = opt || {};
    $('stage').hidden = false;
    document.body.style.overflow = 'hidden';
    // 폰 세로면 가로 화면이 기본(사장님 10/7 "가로화면 기본으로"): 누른 손가락 안에서 전체화면 → 가로 잠금 → 안 되면 강제 회전
    if (window.OL && window.innerWidth < 700 && window.innerHeight > window.innerWidth) { try { OL.go(); } catch (e) {} setTimeout(function () { measureKB(); sizeCanvas(); }, 900); }
    $('sName').textContent = name;
    $('sBar').style.width = '0%';
    $('sInfo').textContent = '';
    $('sProgWrap').style.visibility = opt.noprog ? 'hidden' : 'visible';
    $('result').hidden = true; $('ending').hidden = true;
    $('fall').hidden = !!opt.nofall; $('staffBox').hidden = !opt.staff; $('earBox').hidden = !opt.ear; $('count').hidden = true;
    $('sView').classList.toggle('paperbg', !!opt.paper);
    $('sTools').innerHTML = '';
    buildKB(lo, hi);
    sizeCanvas(); measureKB();
    clearHints();
    Y.ready();
    lastTs = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }
  function closeStage() {
    if (MODE && MODE.stop) MODE.stop();
    MODE = null;
    releaseAll(); Y.stopAll(); Y.pedal(false); pedalOn = false;
    stopMetro();
    if (rafId) cancelAnimationFrame(rafId); rafId = 0;
    $('stage').hidden = true;
    document.body.style.overflow = '';
    if (window.OL && OL.forced) { try { OL.release(); } catch (e) {} }
    if (document.fullscreenElement && document.exitFullscreen) { try { document.exitFullscreen(); } catch (e) {} }
    renderHome();
    if (curSong && !$('pSong').hidden) openSong(SONGS.indexOf(curSong));
  }
  $('sBack').addEventListener('click', closeStage);
  $('tRot').addEventListener('click', function () { if (window.OL && OL.go) OL.go(); setTimeout(function () { measureKB(); sizeCanvas(); }, 400); });
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    var dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0; lastTs = ts;
    if (MODE && MODE.tick) MODE.tick(dt);
  }
  function tool(html) { var d = document.createElement('div'); d.innerHTML = html; var el = d.firstChild; $('sTools').appendChild(el); return el; }
  function judge(txt, bad) {
    var j = $('judge'); j.textContent = txt; j.classList.toggle('bad', !!bad);
    j.classList.remove('pop'); void j.offsetWidth; j.classList.add('pop');
  }
  /* 소리 단추(페달) */
  function drawSnd() { $('sSnd').classList.toggle('off', !S.snd); }
  $('sSnd').addEventListener('click', function () { S.snd = S.snd ? 0 : 1; LS.set('snd', S.snd); Y.mute(!S.snd); drawSnd(); });
  drawSnd();
  /* 계이름 표시 단추 */
  function labelBtn() {
    var b = tool('<button type="button" class="btn ivory small" id="tLabel"></button>');
    function txt() { b.textContent = S.label === 'kor' ? '도레미' : S.label === 'eng' ? 'CDE' : tr('계이름 끔', 'No names'); }
    b.addEventListener('click', function () { S.label = S.label === 'kor' ? 'eng' : S.label === 'eng' ? 'none' : 'kor'; LS.set('label', S.label); txt(); labelKB(); });
    txt(); return b;
  }
  /* 건반 수 단추: 8 → 11 → 14 → 17 → 21 → 24 */
  function keysBtn(onChange) {
    var b = tool('<button type="button" class="btn ivory small" id="tKeys"></button>');
    function txt() { b.textContent = EN ? keyCount() + ' keys' : '건반 ' + keyCount(); }
    b.addEventListener('click', function () {
      var k = keyCount(), i = KEY_STEPS.indexOf(k); if (i < 0) { i = 0; while (i < KEY_STEPS.length - 1 && KEY_STEPS[i] < k) i++; }
      LS.set('keys', KEY_STEPS[(i + 1) % KEY_STEPS.length]); txt();
      if (onChange) onChange(); else { releaseAll(); var lo = KB.lo, hi = KB.hi; buildKB(lo, hi); }
    });
    txt(); return b;
  }
  /* 결과 창 */
  var afterResult = null;
  function showResult(stars, title, sub, next) {
    $('rStars').innerHTML = starTxt(stars);
    $('rTitle').textContent = title; $('rSub').textContent = sub || '';
    $('rNext').hidden = !next; afterResult = next || null;
    $('result').hidden = false;
    if (stars >= 1) Y.cue(true);
    releaseAll(); clearHints();
  }
  $('rRetry').addEventListener('click', function () { $('result').hidden = true; if (MODE && MODE.retry) MODE.retry(); });
  $('rNext').addEventListener('click', function () { $('result').hidden = true; if (afterResult) afterResult(); });
  $('rList').addEventListener('click', function () { $('result').hidden = true; closeStage(); });
  $('endHome').addEventListener('click', function () { $('ending').hidden = true; closeStage(); show('pHome'); });

  /* 카운트: 한 박씩 3·2·1 */
  function countIn(spb, n, done) {
    var c = $('count'), i = n; c.hidden = false;
    function step() {
      if (i <= 0) { c.hidden = true; done(); return; }
      c.textContent = i; Y.click(i === n); i--; setTimeout(step, spb * 1000);
    }
    step();
  }
  /* 메트로놈 */
  var metro = { on: false, timer: 0, beat: 0 };
  function stopMetro() { metro.on = false; if (metro.timer) clearTimeout(metro.timer); metro.timer = 0; var b = $('tMetro'); if (b) b.classList.remove('down'); }
  function startMetro() {
    metro.on = true; metro.beat = 0; var b = $('tMetro'); if (b) b.classList.add('down');
    var next = Y.time() + 0.05;
    function sched() {
      if (!metro.on) return;
      while (next < Y.time() + 0.25) { Y.click(metro.beat % 4 === 0, next); metro.beat++; next += 60 / S.bpm; }
      metro.timer = setTimeout(sched, 100);
    }
    sched();
  }

  /* ---------------------------------------------------------- 곡 연습: 떨어지는 음표 */
  var COL = { R: '#e6bd5c', L: '#5b9be6', Rhit: '#fff1b8', Lhit: '#c3e0ff', miss: '#4b4952' };
  function startSong(song, k, opt) {
    opt = opt || {};
    curSong = song;
    var def = k >= 0 ? STAGE_DEF[k] : null, notes = [];
    song.R.forEach(function (n) { n[2].forEach(function (m) { notes.push({ t: n[0], d: n[1], m: m, hand: 'R', auto: !def, st: 0, p: 0 }); }); });
    // 오른손 단계엔 왼손을 아예 넣지 않는다(소리도). 보이지 않는 반주가 "다른 음 잔음"으로 들렸다(사장님 10/7)
    if (!def || def.hand === 'LR') song.L.forEach(function (n) { n[2].forEach(function (m) { notes.push({ t: n[0], d: n[1], m: m, hand: 'L', auto: !def, st: 0, p: 0 }); }); });
    notes.sort(function (a, b) { return a.t - b.t || a.m - b.m; });
    var spb = 60 / song.bpm;
    var G = { notes: notes, t: -0.001, spb: spb, wait: def ? !!def.wait : false, k: k, run: false, hits: 0, wrongs: 0, total: 0, end: song.beats, look: Math.max(2.5, 2.4 / spb), done: false };
    notes.forEach(function (n) { if (!n.auto) G.total++; });
    // 오른손 단계는 오른손 음 범위만 보여 준다(건반이 넓어지고 PC 자판 Z·Q 줄 안에 들어온다)
    var lo = song.lo, hi = song.hi;
    if (def && def.hand === 'R') { lo = 127; hi = 0; song.R.forEach(function (n) { n[2].forEach(function (m) { if (m < lo) lo = m; if (m > hi) hi = m; }); }); }
    if (hi - lo < 12) { hi = lo + 12; }
    openStage((EN ? song.en : song.ko) + (def ? ' · ' + (EN ? def.en : def.ko) : ''), lo, hi, {});
    // 자판: 윗줄 Q = 오른손 음의 제일 낮은 도부터, 아랫줄 Z = 왼손 음의 제일 낮은 도부터
    // 한 줄은 17음(Z~/ · Q~P). 그 손의 음이 도부터 시작해 17음 안에 들면 도부터, 안 들면 그 손의 제일 낮은 음부터 잡는다
    var rLo = 127, rHi = 0, lLo = 127, lHi = 0;
    song.R.forEach(function (n) { n[2].forEach(function (m) { if (m < rLo) rLo = m; if (m > rHi) rHi = m; }); });
    song.L.forEach(function (n) { n[2].forEach(function (m) { if (m < lLo) lLo = m; if (m > lHi) lHi = m; }); });
    KB.baseQ = fitBase(rLo, rHi, 29);
    KB.baseZ = (def && def.hand === 'LR' && lLo < 127) ? fitBase(lLo, lHi, 24) : KB.baseQ - 12;
    labelKB();
    /* 고른 건반 수가 이 단계에 모자라면(양손이 멀리 떨어져 같이 나올 때) 1.5박 안에 같이 나오는 음이 다 보이는 수까지 넓힌다 */
    function fitKeys() {
      var need = 1, player = notes.filter(function (n) { return !n.auto; });
      for (var i = 0; i < player.length; i++) {
        var lo = whiteIndex(player[i].m), hi = lo;
        for (var j = i + 1; j < player.length && player[j].t <= player[i].t + 1.5; j++) { var k = whiteIndex(player[j].m); if (k < lo) lo = k; if (k > hi) hi = k; }
        if (hi - lo + 2 > need) need = hi - lo + 2;
      }
      if (need > KB.vis) setVis(need);
    }
    fitKeys();
    $('sInfo').textContent = def ? '0 / ' + G.total : '';
    labelBtn();
    keysBtn(function () { releaseAll(); buildKB(KB.lo, KB.hi); labelKB(); fitKeys(); follow(true); });
    var rb = tool('<button type="button" class="btn ivory small">RETRY</button>');
    rb.addEventListener('click', function () { startSong(song, k, opt); });

    function firstPending() { for (var i = 0; i < notes.length; i++) if (!notes[i].auto && notes[i].st === 0) return notes[i]; return null; }
    /* 다음 2박 안의 칠 음이 보이게 건반을 민다 */
    function follow(instant) {
      var ms = [], lim = G.t + Math.max(2, 1.5 / G.spb);
      for (var i = 0; i < notes.length; i++) { var n = notes[i]; if (n.auto || n.st !== 0) continue; if (n.t > lim) break; ms.push(n.m); }
      if (!ms.length) { var f = firstPending(); if (f) ms.push(f.m); }
      if (instant) { var nw = KB.whites.length, vis = Math.min(KB.vis, nw); if (nw > vis && ms.length) { var lo = 1e9, hi = -1; ms.forEach(function (m) { var k = whiteIndex(m); if (k < lo) lo = k; if (k > hi) hi = k; }); setScroll((lo + hi + 1) / 2 - vis / 2, true); } }
      else scrollTo(ms);
    }
    function finish() {
      if (G.done) return; G.done = true; G.run = false;
      if (k < 0) {
        if (opt.recital) { $('endSub').textContent = tr('오름게임즈 피아노 연습', 'Oreum Games Piano Practice'); $('ending').hidden = false; return; }
        closeStage(); return;
      }
      var acc = G.wait ? (G.hits / Math.max(1, G.hits + G.wrongs)) : (G.hits / Math.max(1, G.total));
      var stars = starsOf(acc);
      setSongStar(song.id, k, stars);
      var next = null, i = SONGS.indexOf(song);
      if (stars > 0) { if (k < 3) next = function () { startSong(song, k + 1); }; else if (i + 1 < SONGS.length) next = function () { startSong(SONGS[i + 1], 0); }; }
      showResult(stars, stars > 0 ? 'CLEAR' : 'MISS', Math.round(acc * 100) + '%', next);
    }
    function draw() {
      cx.clearRect(0, 0, CW, CH);
      var ppb = CH / G.look, yLine = CH - 3, b;
      for (b = Math.floor(G.t); b < G.t + G.look + 1; b++) {
        var y = yLine - (b - G.t) * ppb;
        cx.fillStyle = (b % song.ts === 0) ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,.045)';
        cx.fillRect(0, y, CW, 1);
      }
      notes.forEach(function (n) {
        if (n.auto) return;   // 자동 반주 음은 그리지 않는다(소리만, 사장님 10/7 "파란막대는 없애")
        var g = KB.geom[n.m]; if (!g) return;
        var y1 = yLine - (n.t - G.t) * ppb, y0 = y1 - n.d * ppb + 3;
        if (y1 < -10 || y0 > CH + 10) return;
        var c = n.st === 2 ? COL.miss : n.st === 1 ? COL[n.hand + 'hit'] : COL[n.hand];
        var a = n.auto ? 0.32 : 1;
        if (n.st === 1 && y0 > yLine) a *= Math.max(0, 1 - (y0 - yLine) / 60);
        if (a <= 0) return;
        cx.globalAlpha = a; cx.fillStyle = c;
        var x = g.x + 2, w = Math.max(6, g.w - 4), h = Math.max(6, y1 - y0), r = Math.min(6, w / 2);
        cx.beginPath(); cx.moveTo(x + r, y0); cx.lineTo(x + w - r, y0); cx.quadraticCurveTo(x + w, y0, x + w, y0 + r); cx.lineTo(x + w, y1 - r); cx.quadraticCurveTo(x + w, y1, x + w - r, y1); cx.lineTo(x + r, y1); cx.quadraticCurveTo(x, y1, x, y1 - r); cx.lineTo(x, y0 + r); cx.quadraticCurveTo(x, y0, x + r, y0); cx.fill();
        if (!n.auto && S.label !== 'none' && h > 20 && w > 20) {
          cx.fillStyle = 'rgba(0,0,0,.6)'; cx.font = '800 ' + Math.min(14, w * 0.5) + 'px ' + 'Pretendard, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'bottom';
          cx.fillText(nameOf(n.m), x + w / 2, y1 - 4);
        }
        cx.globalAlpha = 1;
      });
      cx.fillStyle = '#c8a04c'; cx.fillRect(0, yLine - 1, CW, 3);
      $('sBar').style.width = Math.max(0, Math.min(100, G.t / G.end * 100)) + '%';
    }
    function tick(dt) {
      if (!G.run) { draw(); return; }
      var tNew = G.t + dt / G.spb, due = null;
      if (G.wait) {
        due = firstPending();
        if (due && tNew >= due.t) tNew = Math.max(G.t, due.t);
      }
      notes.forEach(function (n) {
        if (n.auto && !n.p && n.t <= tNew) { n.p = 1; if (n.t > G.t - 1) Y.play(n.m, n.d * G.spb * 0.92, 0, n.hand === 'L' ? 0.55 : 0.62); }
        if (!n.auto && !G.wait && n.st === 0 && (tNew - n.t) * G.spb > 0.22) n.st = 2;
      });
      G.t = tNew;
      follow();
      clearHints();
      if (G.wait && due && due.t <= G.t + 0.001) notes.forEach(function (n) { if (!n.auto && n.st === 0 && Math.abs(n.t - due.t) < 1e-6) hint(n.m, n.hand === 'L'); });
      if (G.t > G.end + 1.5) finish();
      draw();
    }
    MODE = {
      G: G,
      tick: tick,
      stop: function () { G.run = false; G.done = true; },
      retry: function () { startSong(song, k, opt); },
      onPress: function (m) {
        if (!G.run || k < 0) return;
        var c = null, bd = 1e9;
        if (G.wait) {
          for (var i = 0; i < notes.length; i++) { var n = notes[i]; if (!n.auto && n.st === 0 && n.m === m && n.t <= G.t + 0.35 / G.spb) { c = n; break; } }
          if (c) { c.st = 1; G.hits++; } else { G.wrongs++; flashBad(m); }
        } else {
          notes.forEach(function (n) { if (!n.auto && n.st === 0 && n.m === m) { var d = Math.abs(n.t - G.t) * G.spb; if (d < bd) { bd = d; c = n; } } });
          if (c && bd <= 0.22) { c.st = 1; G.hits++; judge(bd < 0.09 ? 'PERFECT' : 'GOOD'); } else { G.wrongs++; flashBad(m); }
        }
        $('sInfo').textContent = G.hits + ' / ' + G.total;
      }
    };
    follow(true);
    draw();
    countIn(spb, 3, function () { if (MODE && MODE.tick === tick) G.run = true; });
  }

  /* ---------------------------------------------------------- 오선지 그리기 */
  var LG = 14, HALF = 7;
  function stepOf(m, flat, clef) {
    var k = m % 12, o = Math.floor(m / 12) - 1;
    var letter = (flat ? [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6] : [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6])[k];
    var acc = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][k] ? (flat ? '♭' : '♯') : '';
    var base = clef === 'treble' ? (4 * 7 + 2) : (2 * 7 + 4);   // 높은: 미4 가 맨 아래 줄 · 낮은: 솔2
    return { s: o * 7 + letter - base, acc: acc };
  }
  function clefPath(type, top) {
    var c = CLEF && CLEF[type]; if (!c) return '';
    var h = type === 'treble' ? 7.3 * LG : 3.3 * LG, sc = h / c.h;
    var y = type === 'treble' ? (top + 3 * LG - 0.615 * h) : (top - 0.02 * LG);
    return '<path d="' + c.d + '" transform="translate(22,' + y.toFixed(1) + ') scale(' + sc.toFixed(5) + ')" fill="#17161b"/>';
  }
  function staffPart(top, clef, notes, W) {
    var h = '', i;
    for (i = 0; i < 5; i++) h += '<line x1="12" x2="' + (W - 12) + '" y1="' + (top + i * LG) + '" y2="' + (top + i * LG) + '" stroke="#17161b" stroke-width="1.4"/>';
    h += clefPath(clef, top);
    var bottom = top + 4 * LG, x = 0.56 * W;
    notes.forEach(function (n, j) {
      var st = stepOf(n.m, n.flat, clef), y = bottom - st.s * HALF, nx = x + (notes.length > 1 ? (j - (notes.length - 1) / 2) * 30 : 0);
      var k;
      for (k = -2; k >= st.s; k -= 2) h += '<line x1="' + (nx - 13) + '" x2="' + (nx + 13) + '" y1="' + (bottom - k * HALF) + '" y2="' + (bottom - k * HALF) + '" stroke="#17161b" stroke-width="1.6"/>';
      for (k = 10; k <= st.s; k += 2) h += '<line x1="' + (nx - 13) + '" x2="' + (nx + 13) + '" y1="' + (bottom - k * HALF) + '" y2="' + (bottom - k * HALF) + '" stroke="#17161b" stroke-width="1.6"/>';
      if (st.s < 6) h += '<line x1="' + (nx + 7) + '" x2="' + (nx + 7) + '" y1="' + y + '" y2="' + (y - 3.4 * LG) + '" stroke="#17161b" stroke-width="1.8"/>';
      else h += '<line x1="' + (nx - 7) + '" x2="' + (nx - 7) + '" y1="' + y + '" y2="' + (y + 3.4 * LG) + '" stroke="#17161b" stroke-width="1.8"/>';
      h += '<ellipse cx="' + nx + '" cy="' + y + '" rx="7.8" ry="5.4" transform="rotate(-20 ' + nx + ' ' + y + ')" fill="#17161b"/>';
      if (st.acc) h += '<text x="' + (nx - 15) + '" y="' + (y + 7) + '" text-anchor="end" font-size="24" font-weight="700" fill="#17161b">' + st.acc + '</text>';
    });
    return h;
  }
  /* 한 음(또는 몇 음)을 오선지에: clef = treble | bass | grand */
  function staffSVG(clef, notes, label) {
    var W = 560, top = 56, h = '', H;
    if (clef === 'grand') {
      H = top * 2 + 4 * LG * 2 + 96;
      h += staffPart(top, 'treble', notes.filter(function (n) { return n.m >= 60; }), W);
      h += staffPart(top + 4 * LG + 96, 'bass', notes.filter(function (n) { return n.m < 60; }), W);
      h += '<line x1="12" x2="12" y1="' + top + '" y2="' + (top + 8 * LG + 96) + '" stroke="#17161b" stroke-width="2"/>';
    } else {
      H = top * 2 + 4 * LG + 20;
      h += staffPart(top, clef, notes, W);
    }
    if (label) h += '<text x="' + (W - 16) + '" y="' + (H / 2 + 14) + '" text-anchor="end" font-size="40" font-weight="700" font-family="GraceSerif, Pretendard, serif" fill="#c8323a">' + esc(label) + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + h + '</svg>';
  }

  /* ---------------------------------------------------------- 건반(자유 연주) */
  /* 건반 크기 = 옥타브 수(사장님 10/7 "건반크기 선택하게 해줘"). 저장 piano.oct, 처음엔 화면 폭으로 */
  function hiFor(lo, n) { var m = lo, c = 0; while (c < n) { if (!Y.isBlack(m)) c++; if (c < n) m++; } return m; }   // lo 부터 흰건반 n 개째 음
  function freeRange() { var n = keyCount(), lo = n >= 21 ? 48 : 60; return [lo, hiFor(lo, n)]; }
  var REC = { on: false, t0: 0, ev: [], timers: [] };
  function startFree() {
    var r = freeRange();
    openStage(tr('건반', 'Keyboard'), r[0], r[1], { noprog: true, nofall: true, staff: true, paper: true });
    var bL = tool('<button type="button" class="btn ivory small">◀</button>'), bR = tool('<button type="button" class="btn ivory small">▶</button>');
    keysBtn(function () { var lo = KB.lo, hi = hiFor(lo, keyCount()); if (hi > 108) { lo -= 12; hi = hiFor(lo, keyCount()); } releaseAll(); buildKB(lo, hi); live(); });
    labelBtn();
    var bRec = tool('<button type="button" class="btn ivory small" id="tRec">REC</button>');
    var bPlay = tool('<button type="button" class="btn ivory small" id="tPlay">PLAY</button>');
    var bM = tool('<button type="button" class="btn ivory small">−</button>');
    var bMet = tool('<button type="button" class="pedal txt" id="tMetro">♩</button>');
    var num = tool('<span class="num" id="tBpm"></span>');
    var bP = tool('<button type="button" class="btn ivory small">+</button>');
    var bPed = tool('<button type="button" class="pedal txt" id="tPedal">P</button>');
    num.textContent = S.bpm;
    function shiftOct(d) { var lo = KB.lo + d, hi = KB.hi + d; if (lo < 21 || hi > 108) return; releaseAll(); buildKB(lo, hi); live(); }
    bL.addEventListener('click', function () { shiftOct(-12); });
    bR.addEventListener('click', function () { shiftOct(12); });
    bM.addEventListener('click', function () { S.bpm = Math.max(40, S.bpm - 4); LS.set('bpm', S.bpm); num.textContent = S.bpm; });
    bP.addEventListener('click', function () { S.bpm = Math.min(208, S.bpm + 4); LS.set('bpm', S.bpm); num.textContent = S.bpm; });
    bMet.addEventListener('click', function () { if (metro.on) stopMetro(); else startMetro(); });
    bPed.addEventListener('click', function () { setPedal(!pedalOn, true); });
    bRec.addEventListener('click', function () {
      if (REC.on) { stopRec(); } else { stopPlay(); REC.on = true; REC.t0 = Y.time(); REC.ev = []; bRec.textContent = '■'; bRec.classList.add('ebony'); bRec.classList.remove('ivory'); }
    });
    function stopRec() {
      if (!REC.on) return; REC.on = false; bRec.textContent = 'REC'; bRec.classList.remove('ebony'); bRec.classList.add('ivory');
      if (REC.ev.length) { S.rec = REC.ev; LS.set('rec', S.rec); }
    }
    bPlay.addEventListener('click', function () {
      if (REC.timers.length) { stopPlay(); return; }
      if (!S.rec || !S.rec.length) return;
      stopRec(); Y.ready(); bPlay.textContent = '■';
      S.rec.forEach(function (e) {
        REC.timers.push(setTimeout(function () {
          var k = KB.keys[e[1]];
          if (e[2]) { if (k) k.classList.add('on'); Y.noteOn(e[1], 0.75); } else { if (k) k.classList.remove('on'); Y.noteOff(e[1]); }
          live();
        }, e[0] * 1000));
      });
      REC.timers.push(setTimeout(stopPlay, S.rec[S.rec.length - 1][0] * 1000 + 300));
    });
    function stopPlay() { REC.timers.forEach(clearTimeout); REC.timers = []; bPlay.textContent = 'PLAY'; Y.stopAll(); qa('.on', KB.el).forEach(function (k) { if (!KB.down[k.dataset.m]) k.classList.remove('on'); }); }
    function live() {
      var ms = qa('.on', KB.el).map(function (k) { return +k.dataset.m; }).sort(function (a, b) { return a - b; });
      var lab = ms.map(function (m) { return fullName(m); }).join(' ');
      $('staffBox').innerHTML = staffSVG('grand', ms.map(function (m) { return { m: m }; }), lab);
    }
    MODE = {
      onPress: function (m) { if (REC.on) REC.ev.push([+(Y.time() - REC.t0).toFixed(3), m, 1]); live(); },
      onRelease: function (m) { if (REC.on) REC.ev.push([+(Y.time() - REC.t0).toFixed(3), m, 0]); live(); },
      stop: function () { stopRec(); stopPlay(); }
    };
    live();
  }

  /* ---------------------------------------------------------- 계이름 듣기 */
  var EAR = [
    { ko: '도 레 미', en: 'C D E', set: [60, 62, 64] },
    { ko: '도~솔', en: 'C to G', set: white(60, 67) },
    { ko: '도~높은 도', en: 'C to C', set: white(60, 72) },
    { ko: '낮은 솔~높은 도', en: 'Low G to C', set: white(55, 72) },
    { ko: '도♯ 레♯ 들어옴', en: 'Add C♯ D♯', set: [60, 61, 62, 63, 64, 65, 67] },
    { ko: '검은건반 전부', en: 'All black keys', set: chrom(60, 72) },
    { ko: '두 옥타브', en: 'Two octaves', set: white(60, 84) },
    { ko: '두 옥타브 전부', en: 'Two octaves, all keys', set: chrom(60, 84) },
    { ko: '두 음 차례로', en: 'Two notes in a row', set: white(60, 72), n: 2 },
    { ko: '두 음 전부', en: 'Two notes, all keys', set: chrom(60, 72), n: 2 },
    { ko: '세 음 차례로', en: 'Three notes in a row', set: white(60, 72), n: 3 },
    { ko: '세 음 전부', en: 'Three notes, all keys', set: chrom(60, 72), n: 3 }
  ];
  function lvStars(ok, N) { return ok >= N ? 3 : ok >= N * 0.8 ? 2 : ok >= N * 0.6 ? 1 : 0; }
  function startEar(i) {
    var d = EAR[i], lo = Math.min.apply(null, d.set), hi = Math.max.apply(null, d.set);
    if (hi - lo < 12) hi = lo + 12;
    openStage(tr('계이름 듣기', 'Ear Training') + ' ' + (i + 1), lo, hi, { nofall: true, ear: true });
    var Q = { n: 0, ok: 0, cur: null, pos: 0, busy: true, N: 10, timers: [] };
    function later(fn, ms) { Q.timers.push(setTimeout(fn, ms)); }
    function playQ() {
      Q.busy = true; var t = Y.time() + 0.08;
      // 보통 청음처럼 기준 도를 먼저(사장님 10/7 "보통 기준에 맞춰야지"). 화면에 도 → ? 로 또렷이 보여 준다
      var refName = EN ? 'C' : '도';
      Y.play(60, 0.6, t, 0.6); hint(60);
      $('earQ').innerHTML = '<b>' + refName + '</b><small>' + Q.n + ' / ' + Q.N + '</small>';
      later(function () { clearHints(); $('earQ').innerHTML = '<b>?</b><small>' + Q.n + ' / ' + Q.N + (Q.cur.length > 1 ? ' · ' + tr('차례대로', 'In order') + ' ' + Q.cur.length : '') + '</small>'; }, 950);
      Q.cur.forEach(function (m, j) { Y.play(m, 0.7, t + 1.0 + j * 0.75, 0.85); });
      later(function () { Q.busy = false; }, 1100 + Q.cur.length * 750);
    }
    function ask() {
      Q.n++; $('sBar').style.width = ((Q.n - 1) / Q.N * 100) + '%';
      if (Q.n > Q.N) { finish(); return; }
      Q.cur = []; Q.pos = 0;
      var k = d.n || 1, last = -1;
      while (Q.cur.length < k) { var m = pick(d.set); if (m === last) continue; Q.cur.push(m); last = m; }
      $('sInfo').textContent = Q.ok + ' / ' + (Q.n - 1);
      playQ();
    }
    function finish() {
      var stars = lvStars(Q.ok, Q.N); setLvStar('ear', i, stars);
      showResult(stars, stars > 0 ? 'CLEAR' : 'MISS', Q.ok + ' / ' + Q.N, (stars > 0 && i + 1 < EAR.length) ? function () { startEar(i + 1); } : null);
    }
    $('earReplay').onclick = function () { if (Q.cur && !Q.busy) playQ(); };
    MODE = {
      Q: Q,
      onPress: function (m) {
        if (Q.busy || !Q.cur) return;
        if (m === Q.cur[Q.pos]) {
          Q.pos++;
          if (Q.pos >= Q.cur.length) { Q.ok++; Q.busy = true; judge('GOOD'); later(ask, 600); }
        } else {
          Q.busy = true; judge('MISS', true); flashBad(m);
          var ans = Q.cur[Q.pos]; hint(ans); later(function () { Y.play(ans, 0.6, 0, 0.8); }, 350);
          $('earQ').innerHTML = '<b>' + esc(fullName(ans)) + '</b><small>' + Q.n + ' / ' + Q.N + '</small>';
          later(function () { clearHints(); ask(); }, 1500);
        }
      },
      stop: function () { Q.timers.forEach(clearTimeout); },
      retry: function () { startEar(i); }
    };
    later(ask, 400);
  }

  /* ---------------------------------------------------------- 악보 읽기 */
  var SHEET = [
    { ko: '높은음자리표 도~솔', en: 'Treble C to G', clef: 'treble', set: white(60, 67) },
    { ko: '도~높은 도', en: 'C to C', clef: 'treble', set: white(60, 72) },
    { ko: '높은 레~솔', en: 'High D to G', clef: 'treble', set: white(74, 79) },
    { ko: '도~높은 솔 전체', en: 'C to high G', clef: 'treble', set: white(60, 79) },
    { ko: '아래 덧줄', en: 'Ledger lines below', clef: 'treble', set: white(53, 67) },
    { ko: '위 덧줄', en: 'Ledger lines above', clef: 'treble', set: white(79, 88) },
    { ko: '샵', en: 'Sharps', clef: 'treble', set: chrom(60, 72), acc: '#' },
    { ko: '플랫', en: 'Flats', clef: 'treble', set: chrom(60, 72), acc: 'b' },
    { ko: '낮은음자리표 도~솔', en: 'Bass C to G', clef: 'bass', set: white(48, 55) },
    { ko: '낮은음자리표 파~도', en: 'Bass F to C', clef: 'bass', set: white(41, 60) },
    { ko: '양쪽 섞기', en: 'Both clefs', clef: 'both', set: white(41, 79) },
    { ko: '샵·플랫 양쪽', en: 'Sharps & flats, both clefs', clef: 'both', set: chrom(43, 79), acc: 'mix' }
  ];
  function startSheet(i) {
    var d = SHEET[i], lo = Math.min.apply(null, d.set), hi = Math.max.apply(null, d.set);
    if (hi - lo < 12) hi = lo + 12;
    openStage(tr('악보 읽기', 'Sight Reading') + ' ' + (i + 1), lo, hi, { nofall: true, staff: true, paper: true });
    var Q = { n: 0, ok: 0, cur: null, busy: true, N: 10, timers: [] };
    function later(fn, ms) { Q.timers.push(setTimeout(fn, ms)); }
    function ask() {
      Q.n++; $('sBar').style.width = ((Q.n - 1) / Q.N * 100) + '%';
      if (Q.n > Q.N) { finish(); return; }
      var m = pick(d.set); while (Q.cur && m === Q.cur.m) m = pick(d.set);
      var clef = d.clef === 'both' ? (m < 60 ? 'bass' : 'treble') : d.clef;
      var flat = d.acc === 'b' || (d.acc === 'mix' && Math.random() < 0.5);
      Q.cur = { m: m, clef: clef, flat: flat };
      $('staffBox').innerHTML = staffSVG(clef, [Q.cur], '');
      $('sInfo').textContent = Q.ok + ' / ' + (Q.n - 1);
      Q.busy = false;
    }
    function finish() {
      var stars = lvStars(Q.ok, Q.N); setLvStar('sheet', i, stars);
      showResult(stars, stars > 0 ? 'CLEAR' : 'MISS', Q.ok + ' / ' + Q.N, (stars > 0 && i + 1 < SHEET.length) ? function () { startSheet(i + 1); } : null);
    }
    MODE = {
      Q: Q,
      onPress: function (m) {
        if (Q.busy || !Q.cur) return;
        Q.busy = true;
        if (m === Q.cur.m) { Q.ok++; judge('GOOD'); later(ask, 500); }
        else {
          judge('MISS', true); flashBad(m); hint(Q.cur.m);
          $('staffBox').innerHTML = staffSVG(Q.cur.clef, [Q.cur], fullName(Q.cur.m, Q.cur.flat));
          later(function () { Y.play(Q.cur.m, 0.6, 0, 0.8); }, 300);
          later(function () { clearHints(); ask(); }, 1500);
        }
      },
      stop: function () { Q.timers.forEach(clearTimeout); },
      retry: function () { startSheet(i); }
    };
    later(ask, 250);
  }

  /* ---------------------------------------------------------- 연주회(엔딩) · 시작 */
  $('pConcertBtn').addEventListener('click', function () { startSong(SONGS[20], -1, { recital: true }); });
  window.__pp = { mode: function () { return MODE; }, startSong: startSong, startEar: startEar, startSheet: startSheet, startFree: startFree, S: S, KB: KB, press: press, release: release, close: closeStage, songs: SONGS, staff: staffSVG };
  renderHome(); show('pHome');
  /* 악보 페이지에서 '이 곡 연습하기' → #song=id */
  var hs = /song=([a-z0-9]+)/.exec(location.hash || '');
  if (hs) SONGS.forEach(function (s, i) { if (s.id === hs[1]) openSong(i); });
})();
