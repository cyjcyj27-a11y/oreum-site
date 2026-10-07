/* 피아노 연습 — 곡 악보 그리기(큰보표 SVG). 곡 데이터 [시작박, 길이, [미디]] 를 오선지로 찍는다. 외부 악보 없음 */
(function () {
  var LG = 10, HALF = 5, W = 760;   // W 는 svg() 안에서 opt.width 로 바꿀 수 있다(폰은 420)
  var NAMES_K = ['도', '도♯', '레', '레♯', '미', '파', '파♯', '솔', '솔♯', '라', '라♯', '시'];
  var NAMES_E = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  var FLAT_K = ['도', '레♭', '레', '미♭', '미', '파', '솔♭', '솔', '라♭', '라', '시♭', '시'];
  var FLAT_E = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  var STD = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.375, 0.25, 0.125];   // 온·점2분·2분·점4분·4분·점8분·8분·점16분·16분·32분
  function eq(a, b) { return Math.abs(a - b) < 1e-6; }
  function stepOf(m, flat, clef) {
    var k = m % 12, o = Math.floor(m / 12) - 1;
    var letter = (flat ? [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6] : [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6])[k];
    var acc = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0][k] ? (flat ? '♭' : '♯') : '';
    var base = clef === 'treble' ? (4 * 7 + 2) : (2 * 7 + 4);
    return { s: o * 7 + letter - base, acc: acc };
  }
  /* 길이를 표준 음표 길이들로 쪼갠다(붙임줄로 잇는다) */
  function splitDur(d) {
    var out = [], left = d, guard = 0;
    while (left > 1e-6 && guard++ < 20) {
      var pick = 0.125;
      for (var i = 0; i < STD.length; i++) if (STD[i] <= left + 1e-6) { pick = STD[i]; break; }
      out.push(pick); left -= pick;
    }
    return out;
  }
  /* 마디 경계 */
  function bars(song) {
    var b = [0], t = song.pick > 0 ? song.pick : song.ts;
    while (t < song.beats - 1e-6) { b.push(+t.toFixed(4)); t += song.ts; }
    b.push(song.beats);
    return b;
  }
  /* 한 손의 음을 마디별 사건(음표·쉼표)으로. 마디를 넘는 음은 쪼개고 붙임줄 */
  function handEvents(list, B) {
    var evs = [];
    list.forEach(function (n) {
      var t = n[0], d = n[1], ms = n[2].slice().sort(function (a, b) { return a - b; });
      var first = true;
      while (d > 1e-6) {
        var bi = 0; while (bi < B.length - 2 && t >= B[bi + 1] - 1e-6) bi++;
        var room = B[bi + 1] - t, take = Math.min(d, room);
        var parts = splitDur(take), tt = t;
        parts.forEach(function (pd, j) {
          var last = (j === parts.length - 1) && (d - take < 1e-6);
          evs.push({ t: tt, d: pd, ms: ms, bar: bi, tieIn: !first || j > 0, tieOut: !last });
          tt += pd;
        });
        first = false; t += take; d -= take;
      }
    });
    evs.sort(function (a, b) { return a.t - b.t; });
    /* 쉼표 채우기 */
    var out = [], cur = 0;
    for (var bi = 0; bi < B.length - 1; bi++) {
      cur = B[bi];
      var inBar = evs.filter(function (e) { return e.bar === bi; });
      inBar.forEach(function (e) {
        if (e.t > cur + 1e-6) restFill(out, cur, e.t - cur, bi, B);
        out.push(e); cur = Math.max(cur, e.t + e.d);
      });
      if (B[bi + 1] > cur + 1e-6) restFill(out, cur, B[bi + 1] - cur, bi, B);
    }
    return out;
  }
  function restFill(out, t, d, bi, B) {
    if (eq(d, B[bi + 1] - B[bi])) { out.push({ t: t, d: d, rest: 1, whole: 1, bar: bi }); return; }   // 마디 전체 쉼표 = 온쉼표
    splitDur(d).forEach(function (pd) { out.push({ t: t, d: pd, rest: 1, bar: bi }); t += pd; });
  }

  /* 그리기 조각 */
  function head(x, y, d, up) {
    var open = d >= 2;
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="5.6" ry="3.9" transform="rotate(-22 ' + x + ' ' + y + ')" fill="' + (open ? 'none' : '#17161b') + '" stroke="#17161b" stroke-width="' + (open ? 1.8 : 1) + '"/>';
  }
  function flag(x, y, up, n) {
    var h = '', dir = up ? 1 : -1;
    for (var i = 0; i < n; i++) {
      var yy = y + dir * i * 6;
      h += '<path d="M' + x + ' ' + yy + ' c 0 ' + (dir * 7) + ' 9 ' + (dir * 9) + ' 8 ' + (dir * 20) + ' c 2 ' + (-dir * 8) + ' -2 ' + (-dir * 12) + ' -8 ' + (-dir * 14) + ' z" fill="#17161b"/>';
    }
    return h;
  }
  function rest(x, top, d, whole) {
    var mid = top + 2 * LG;
    if (whole || d >= 4) return '<rect x="' + (x - 6) + '" y="' + (top + LG) + '" width="12" height="4.5" fill="#17161b"/>';
    if (d >= 2) return '<rect x="' + (x - 6) + '" y="' + (mid - 4.5) + '" width="12" height="4.5" fill="#17161b"/>' + (d === 3 ? '<circle cx="' + (x + 10) + '" cy="' + (mid - 3) + '" r="1.6" fill="#17161b"/>' : '');
    if (d >= 1) return '<path d="M' + (x - 3) + ' ' + (mid - 11) + ' l6 7 l-5 6 l6 8 c-6 -3 -9 1 -5 6 c-6 -3 -6 -9 -2 -10 l-5 -6 l5 -6 z" fill="#17161b"/>' + (d === 1.5 ? '<circle cx="' + (x + 9) + '" cy="' + (mid + 1) + '" r="1.6" fill="#17161b"/>' : '');
    var hooks = d >= 0.5 ? 1 : d >= 0.25 ? 2 : 3, h = '';
    for (var i = 0; i < hooks; i++) h += '<circle cx="' + (x - 3) + '" cy="' + (mid - 4 + i * 6) + '" r="2.3" fill="#17161b"/><path d="M' + (x - 1) + ' ' + (mid - 3 + i * 6) + ' q4 2 7 -2" fill="none" stroke="#17161b" stroke-width="1.6"/>';
    h += '<line x1="' + (x + 6) + '" y1="' + (mid - 5) + '" x2="' + (x + 1) + '" y2="' + (mid + 10) + '" stroke="#17161b" stroke-width="1.6"/>';
    if (d === 0.75) h += '<circle cx="' + (x + 11) + '" cy="' + (mid + 1) + '" r="1.6" fill="#17161b"/>';
    return h;
  }
  function tie(x1, x2, y, up) {
    var dir = up ? 1 : -1;   // 기둥이 위면 줄은 아래로 굽는다
    return '<path d="M' + (x1 + 4) + ' ' + (y + dir * 5) + ' Q ' + ((x1 + x2) / 2) + ' ' + (y + dir * 14) + ' ' + (x2 - 4) + ' ' + (y + dir * 5) + '" fill="none" stroke="#17161b" stroke-width="1.6"/>';
  }
  function clefPath(CLEF, type, top) {
    var c = CLEF && CLEF[type]; if (!c) return '';
    var h = type === 'treble' ? 7.3 * LG : 3.3 * LG, sc = h / c.h;
    var y = type === 'treble' ? (top + 3 * LG - 0.615 * h) : (top - 0.02 * LG);
    return '<path d="' + c.d + '" transform="translate(4,' + y.toFixed(1) + ') scale(' + sc.toFixed(5) + ')" fill="#17161b"/>';
  }
  function nameOf(m, flat, mode) {
    var k = m % 12;
    return mode === 'eng' ? (flat ? FLAT_E : NAMES_E)[k] : (flat ? FLAT_K : NAMES_K)[k];
  }
  /* 한 사건(음표 묶음)을 그린다. 돌려주는 값: 머리 y 들 */
  function drawEvent(ev, x, top, clef, flat, names, out, tiesFrom) {
    var h = '';
    if (ev.rest) { out.h += rest(x, top, ev.d, ev.whole); return; }
    var bottom = top + 4 * LG, steps = ev.ms.map(function (m) { return stepOf(m, flat, clef); });
    var avg = steps.reduce(function (a, s) { return a + s.s; }, 0) / steps.length, up = avg < 6;
    var ys = steps.map(function (s) { return bottom - s.s * HALF; });
    steps.forEach(function (s, i) {
      var y = ys[i], k;
      for (k = -2; k >= s.s; k -= 2) h += '<line x1="' + (x - 9) + '" x2="' + (x + 9) + '" y1="' + (bottom - k * HALF) + '" y2="' + (bottom - k * HALF) + '" stroke="#17161b" stroke-width="1.2"/>';
      for (k = 10; k <= s.s; k += 2) h += '<line x1="' + (x - 9) + '" x2="' + (x + 9) + '" y1="' + (bottom - k * HALF) + '" y2="' + (bottom - k * HALF) + '" stroke="#17161b" stroke-width="1.2"/>';
      h += head(x, y, ev.d, up);
      if (s.acc) h += '<text x="' + (x - 8) + '" y="' + (y + 5) + '" text-anchor="end" font-size="15" font-weight="700" fill="#17161b">' + s.acc + '</text>';
      if (ev.d === 3 || ev.d === 1.5 || ev.d === 0.75 || ev.d === 0.375) h += '<circle cx="' + (x + 9) + '" cy="' + (s.s % 2 === 0 ? y - 3 : y) + '" r="1.7" fill="#17161b"/>';
      if (names) h += '<text x="' + x + '" y="' + (clef === 'treble' ? top - 14 - i * 12 : bottom + 20 + i * 12) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#8a6a22">' + nameOf(ev.ms[i], flat, names) + '</text>';
    });
    if (ev.d < 4) {
      var sx = up ? x + 5.2 : x - 5.2, yFrom = up ? Math.max.apply(null, ys) : Math.min.apply(null, ys), yTo = (up ? Math.min.apply(null, ys) - 3.3 * LG : Math.max.apply(null, ys) + 3.3 * LG);
      h += '<line x1="' + sx + '" y1="' + yFrom + '" x2="' + sx + '" y2="' + yTo + '" stroke="#17161b" stroke-width="1.4"/>';
      if (ev.d < 1) h += flag(sx, yTo, up, ev.d < 0.25 ? 3 : ev.d < 0.5 ? 2 : 1);
    }
    out.h += h;
    if (ev.tieIn && tiesFrom && tiesFrom.x !== undefined) ys.forEach(function (y) { out.h += tie(tiesFrom.x, x, y, up); });
    return { x: x, ys: ys, up: up };
  }

  /* 곡 전체 악보 SVG. opt: { names: 'kor'|'eng'|null, en: bool } */
  function svg(song, opt) {
    opt = opt || {};
    var W = opt.width || 760;
    var CLEF = window.PIANO_CLEF, B = bars(song), i, j;
    var all = song.R.concat(song.L), hasFlat = false, hasSharp = false;
    all.forEach(function (n) { n[2].forEach(function (m) { if (m % 12 === 10) hasFlat = true; if (m % 12 === 6 || m % 12 === 1 || m % 12 === 8 || m % 12 === 3) hasSharp = true; }); });
    var flat = (song.flat !== undefined) ? !!song.flat : (hasFlat && !hasSharp);
    var R = handEvents(song.R, B), L = handEvents(song.L, B), nb = B.length - 1, mw = [], slots = [];
    for (i = 0; i < nb; i++) {
      var ts = {}, hasNote = false;
      R.concat(L).forEach(function (e) { if (e.bar === i) { ts[+e.t.toFixed(4)] = 1; if (!e.rest) hasNote = true; } });
      var arr = Object.keys(ts).map(Number).sort(function (a, b) { return a - b; }); arr.push(B[i + 1]);
      var w = 18, xs = {};
      for (j = 0; j < arr.length - 1; j++) { xs[arr[j]] = w; w += 10 + 21 * Math.sqrt(arr[j + 1] - arr[j]); }
      if (!hasNote) { w = 46; xs = {}; xs[arr[0]] = 23; }
      mw.push(w + 6); slots.push(xs);
    }
    var left = 58, avail = W - left - 6, lines = [], cur = [], cw = 0;
    for (i = 0; i < nb; i++) {
      if (cur.length && cw + mw[i] > avail) { lines.push(cur); cur = []; cw = 0; }
      cur.push(i); cw += mw[i];
    }
    if (cur.length) lines.push(cur);
    var names = opt.names === 'none' ? null : (opt.names || null);
    var maxR = 1, maxL = 1;   // 화음이면 계이름이 위로 쌓이니 그만큼 띄운다
    song.R.forEach(function (n) { if (n[2].length > maxR) maxR = n[2].length; });
    song.L.forEach(function (n) { if (n[2].length > maxL) maxL = n[2].length; });
    var nameGap = names ? 6 + 12 * maxR : 0, nameGapB = names ? 6 + 12 * maxL : 0;
    var top0 = 78, gapTB = 44, sysH = 8 * LG + gapTB + 54 + nameGap + nameGapB;
    var H = top0 + lines.length * sysH - 30;
    var out = { h: '' };
    var tt = opt.en ? song.en : song.ko, tsz = W < 600 ? (tt.length > 14 ? 15 : 18) : (tt.length > 22 ? 20 : 26);   // 폰·긴 제목은 작게
    out.h += '<text x="' + (W / 2) + '" y="36" text-anchor="middle" font-size="' + tsz + '" font-weight="700" font-family="Pretendard, sans-serif" fill="#17161b">' + esc(tt) + '</text>';
    out.h += '<text x="' + (W - 4) + '" y="60" text-anchor="end" font-size="13" font-weight="700" fill="#5b5443">♩ = ' + song.bpm + '</text>';
    out.h += '<text x="4" y="60" font-size="12" font-weight="700" fill="#8a8270">' + (opt.en ? 'Oreum Games · Piano Practice' : '오름게임즈 · 피아노 연습') + '</text>';
    var num = song.sig ? song.sig.split('/') : song.ts === 1.5 ? ['3', '8'] : [String(song.ts), '4'];
    var prevR = null, prevL = null;
    lines.forEach(function (line, li) {
      var y = top0 + li * sysH + nameGap, tT = y, tB = y + 4 * LG + gapTB, k;
      for (k = 0; k < 5; k++) {
        out.h += '<line x1="0" x2="' + W + '" y1="' + (tT + k * LG) + '" y2="' + (tT + k * LG) + '" stroke="#17161b" stroke-width="1"/>';
        out.h += '<line x1="0" x2="' + W + '" y1="' + (tB + k * LG) + '" y2="' + (tB + k * LG) + '" stroke="#17161b" stroke-width="1"/>';
      }
      out.h += '<line x1="0.5" x2="0.5" y1="' + tT + '" y2="' + (tB + 4 * LG) + '" stroke="#17161b" stroke-width="1.4"/>';
      out.h += clefPath(CLEF, 'treble', tT) + clefPath(CLEF, 'bass', tB);
      if (li === 0) {
        out.h += '<text x="46" y="' + (tT + 2 * LG - 1) + '" text-anchor="middle" font-size="19" font-weight="800" font-family="GraceSerif, serif" fill="#17161b">' + num[0] + '</text><text x="46" y="' + (tT + 4 * LG - 1) + '" text-anchor="middle" font-size="19" font-weight="800" font-family="GraceSerif, serif" fill="#17161b">' + num[1] + '</text>';
        out.h += '<text x="46" y="' + (tB + 2 * LG - 1) + '" text-anchor="middle" font-size="19" font-weight="800" font-family="GraceSerif, serif" fill="#17161b">' + num[0] + '</text><text x="46" y="' + (tB + 4 * LG - 1) + '" text-anchor="middle" font-size="19" font-weight="800" font-family="GraceSerif, serif" fill="#17161b">' + num[1] + '</text>';
      }
      var sum = 0; line.forEach(function (bi) { sum += mw[bi]; });
      var scale = (li < lines.length - 1 || sum > avail * 0.8) ? avail / sum : 1, x = left;
      line.forEach(function (bi, idx) {
        var w = mw[bi] * scale;
        R.forEach(function (e) {
          if (e.bar !== bi) return;
          var ex = x + slots[bi][+e.t.toFixed(4)] * scale;
          var r = drawEvent(e, ex, tT, 'treble', flat, names, out, (e.tieIn && prevR && prevR.line === li) ? prevR : null);
          if (r) prevR = { x: r.x, line: li };
        });
        L.forEach(function (e) {
          if (e.bar !== bi) return;
          var ex = x + slots[bi][+e.t.toFixed(4)] * scale;
          var r = drawEvent(e, ex, tB, 'bass', flat, names, out, (e.tieIn && prevL && prevL.line === li) ? prevL : null);
          if (r) prevL = { x: r.x, line: li };
        });
        x += w;
        var last = (li === lines.length - 1 && idx === line.length - 1);
        if (last) out.h += '<line x1="' + (x - 4) + '" x2="' + (x - 4) + '" y1="' + tT + '" y2="' + (tB + 4 * LG) + '" stroke="#17161b" stroke-width="1"/><rect x="' + (x - 1) + '" y="' + tT + '" width="3" height="' + (tB + 4 * LG - tT) + '" fill="#17161b"/>';
        else out.h += '<line x1="' + x + '" x2="' + x + '" y1="' + tT + '" y2="' + (tB + 4 * LG) + '" stroke="#17161b" stroke-width="1"/>';
      });
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" class="score">' + out.h + '</svg>';
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  window.PianoScore = { svg: svg, bars: bars, events: handEvents };
})();
