/* manse.js — 만세력 화면. 넣은 생년월일은 어디에도 저장하지 않는다(사주 앱으로 넘길 때만 한 번 쓰고 지우는 sessionStorage). */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var root = $('#ms'); if (!root) return;
  var WEEK = ['일','월','화','수','목','금','토'];
  var POS = { hour: '시주', day: '일주', month: '월주', year: '연주' };
  var EL_HAN = { '목':'木', '화':'火', '토':'土', '금':'金', '수':'水' };
  var st = { cal: 'solar', gender: '', last: null, calY: 0, calM: 0, sel: null };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function koNow() { var t = new Date(Date.now() + 9 * 3600000); return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function wd(y, m, d) { return WEEK[(MC.jdn(y, m, d) + 1) % 7]; }
  function chip(stem, br, isBr) {
    var el = isBr ? MC.BR_EL[br] : MC.STEM_EL[stem];
    var h = isBr ? MC.BR_H[br] : MC.STEM_H[stem], k = isBr ? MC.BR[br] : MC.STEM[stem];
    var yy = (isBr ? MC.mainHidden(br) : stem) % 2 ? '음' : '양';   // 지지 음양은 정기 기준
    return '<div class="chip e-' + el + '"><span class="h">' + h + '</span><span class="k">' + k + ' · ' + yy + el + '</span></div>';
  }
  function lunarText(l) { return l ? '음력 ' + l.y + '년 ' + (l.leap ? '윤' : '') + l.m + '월 ' + l.d + '일' : ''; }
  function termLocal(ms) { var l = MC.utcToLocal(ms); return l.m + '월 ' + l.d + '일 ' + pad(l.h) + ':' + pad(l.mi); }

  /* ── 탭 ── */
  function tab(name) {
    root.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === name); });
    $('#msSaju').hidden = name !== 'saju';
    $('#msCalTab').hidden = name !== 'cal';
    if (name === 'cal' && !st.calY) { var n = koNow(); calGo(n.y, n.m); }
  }
  root.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { tab(b.dataset.tab); }); });

  /* ── 입력 칸 ── */
  function segInit(id, key, cb) {
    var box = $(id);
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        box.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
        st[key] = b.dataset.v; if (cb) cb();
      });
    });
  }
  function segSet(id, key, v) { $(id).querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x.dataset.v === v); }); st[key] = v; }
  segInit('#msCal', 'cal', function () { $('#msLeapRow').hidden = st.cal !== 'lunar'; $('#msDateHint').textContent = st.cal === 'lunar' ? '음력 날짜를 넣으면 양력으로 바꿔 계산합니다.' : '출생신고에 적힌 양력 날짜입니다.'; });
  segInit('#msG', 'gender');
  (function fillTime() {
    var h = $('#msH'), o = '<option value="">모름</option>';
    for (var i = 0; i < 24; i++) o += '<option value="' + i + '">' + (i < 12 ? '오전 ' : '오후 ') + (i % 12 === 0 ? 12 : i % 12) + '시 (' + pad(i) + '시)</option>';
    h.innerHTML = o;
    var mm = $('#msMi'), o2 = '';
    for (var j = 0; j < 60; j++) o2 += '<option value="' + j + '">' + pad(j) + '분</option>';
    mm.innerHTML = o2;
    h.addEventListener('change', function () { mm.disabled = h.value === ''; });
    mm.disabled = true;
  })();

  /* ── 계산 ── */
  function readForm() {
    var err = $('#msErr'); err.textContent = '';
    var y = parseInt($('#msY').value, 10), m = parseInt($('#msM').value, 10), d = parseInt($('#msD').value, 10);
    if (!y || y < 1900 || y > 2100) return fail('연도는 1900~2100 사이로 넣어 주세요.', '#msY');
    if (!m || m < 1 || m > 12) return fail('월은 1~12 사이입니다.', '#msM');
    if (!d || d < 1 || d > 31) return fail('일은 1~31 사이입니다.', '#msD');
    var sy = y, sm = m, sd = d, lunarIn = null;
    if (st.cal === 'lunar') {
      var leap = $('#msLeap').checked, r = MC.lunarToSolar(y, m, d, leap);
      if (r.err === 'leap') { var lm = MC.leapMonthOf(y); return fail(y + '년에는 윤' + m + '월이 없습니다.' + (lm ? ' 그해 윤달은 윤' + lm + '월입니다.' : ' 그해에는 윤달이 없습니다.'), '#msM'); }
      if (r.err === 'day') return fail('음력 ' + y + '년 ' + (leap ? '윤' : '') + m + '월은 ' + r.days + '일까지 있습니다.', '#msD');
      if (r.err) return fail('그 음력 날짜를 찾지 못했습니다.', '#msY');
      if (r.y > 2100) return fail('2100년이 넘는 날짜는 계산할 수 없습니다.', '#msY');
      sy = r.y; sm = r.m; sd = r.d; lunarIn = { y: y, m: m, d: d, leap: leap };
    } else {
      var chk = new Date(Date.UTC(y, m - 1, d));
      if (chk.getUTCMonth() !== m - 1) return fail(y + '년 ' + m + '월에는 ' + d + '일이 없습니다.', '#msD');
    }
    var hv = $('#msH').value;
    return { y: sy, m: sm, d: sd, time: hv !== '', h: hv === '' ? 0 : +hv, mi: hv === '' ? 0 : +$('#msMi').value,
             gender: st.gender, lon: parseFloat($('#msLon').value) || 127.5, yaja: $('#msYaja').checked, lunarIn: lunarIn };
    function fail(msg, focus) { err.textContent = msg; if (focus) $(focus).focus(); return null; }
  }
  $('#msForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = readForm(); if (!inp) return;
    var box = $('#msRes'); box.hidden = false;
    var r = MC.calc(inp); st.last = r; render(r);
    setTimeout(function () { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  });

  /* ── 결과 그리기 ── */
  function render(r) {
    var i = r.inp, P = r.P, h = [];
    var SX = MX.stars(r), RL = MX.relations(r), RT = MX.ratios(r), SG = MX.strength(r);
    var n = koNow();
    var gtxt = i.gender === 'm' ? '남자' : i.gender === 'f' ? '여자' : '';
    var yb = P.year.b;
    h.push('<div class="sum"><b>양력 ' + i.y + '년 ' + i.m + '월 ' + i.d + '일 (' + wd(i.y, i.m, i.d) + ')' +
      (i.time ? ' ' + pad(i.h) + ':' + pad(i.mi) : ' · 시간 모름') + (gtxt ? ' · ' + gtxt : '') + '</b>' +
      '<div class="l2">' + lunarText(r.lunar) + (r.lunar && r.lunar.leap ? '(윤달)' : '') + ' · ' + MC.gzText(P.year.i) + '년 ' + MC.ANIMAL[yb] + '띠</div></div>');
    if (r.notes.length) h.push('<ul class="notes">' + r.notes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>');

    h.push('<h2 class="sec">사주팔자 <small>' + ['year','month','day','hour'].map(function (k) { return P[k] ? MC.gzText(P[k].i) : ''; }).filter(Boolean).join(' ') + '</small></h2>');
    h.push('<div class="pillars">');
    ['hour', 'day', 'month', 'year'].forEach(function (k) {
      var p = P[k];
      if (!p) { h.push('<div class="pcol none"><div class="ph">' + POS[k] + '</div><div class="god">&nbsp;</div><div class="chip"><span class="h">?</span></div><div class="chip"><span class="h">?</span></div><div class="god">시간 모름</div></div>'); return; }
      h.push('<div class="pcol' + (k === 'day' ? ' day' : '') + '"><div class="ph">' + POS[k] + '</div>' +
        '<div class="god">' + p.godS + '</div>' + chip(p.s, 0, false) + chip(0, p.b, true) +
        '<div class="god">' + p.godB + '</div>' +
        '<div class="hid">' + p.hidden.map(function (s) { return MC.STEM_H[s]; }).join(' ') + '</div>' +
        '<div class="un">' + p.un + '</div><div class="sal">' + SX[k].sal + '</div></div>');
    });
    h.push('</div><p class="hint">기둥마다 위에서부터 천간 십성, 천간, 지지, 지지 십성, 지장간, 십이운성, 12신살입니다. 십성과 십이운성은 일간 기준, 12신살은 연지 기준(연주는 일지 기준)입니다. 지지의 음양은 정기를 따릅니다.</p>');

    h.push('<h2 class="sec">오행 <small>여덟 글자 중 몇 개인지</small></h2><div class="ohaeng">');
    ['목','화','토','금','수'].forEach(function (e) { h.push('<div class="e-' + e + (r.el[e] ? '' : ' zero') + '"><em>' + e + '(' + EL_HAN[e] + ')</em><span>' + r.el[e] + '</span></div>'); });
    h.push('</div><div class="facts"><span>일간<b>' + MC.STEM[r.dayStem] + MC.STEM_EL[r.dayStem] + '(' + MC.STEM_H[r.dayStem] + EL_HAN[MC.STEM_EL[r.dayStem]] + ')</b></span>' +
      '<span>공망<b>' + r.gm.map(function (b) { return MC.BR[b] + '(' + MC.BR_H[b] + ')'; }).join(' ') + '</b></span>' +
      '<span>띠<b>' + MC.ANIMAL[yb] + '띠</b></span>' +
      (r.dae ? '<span>대운수<b>' + r.dae.num + ' (' + (r.dae.fwd ? '순행' : '역행') + ')</b></span>' : '') + '</div>');
    h.push(moreSections(r, SX, RL, RT, SG));

    /* 대운 */
    h.push('<h2 class="sec">대운 <small>10년마다 바뀌는 큰 흐름</small></h2>');
    if (r.dae) {
      var ageNow = n.y - i.y - ((n.m < i.m || (n.m === i.m && n.d < i.d)) ? 1 : 0), cur = -1;
      r.dae.list.forEach(function (x, k) { if (x.age <= ageNow) cur = k; });
      h.push('<div class="runs">' + r.dae.list.map(function (x, k) {
        return '<div class="run' + (k === cur ? ' now' : '') + '"><div class="a">' + x.age + '세</div><div class="y">' + x.year + '년~</div>' +
          '<div class="g">' + x.godS + '</div>' + chip(x.s, 0, false) + chip(0, x.b, true) + '<div class="g">' + x.godB + '</div><div class="u">' + x.un + '</div></div>';
      }).join('') + '</div>');
      h.push('<p class="hint">' + (r.dae.jeol ? (r.dae.fwd ? '다음' : '지난') + ' 절기 ' + r.dae.jeol.name + '(' + termLocal(r.dae.jeol.ms) + ')까지 ' + r.dae.days.toFixed(1) + '일, 3일을 1년으로 쳐서 대운수 ' + r.dae.num + '입니다. ' : '') + '나이는 만 나이, 테두리 친 칸이 지금 대운입니다.</p>');
    } else {
      h.push('<div class="needg">성별을 고르면 대운이 나옵니다. 대운은 남녀에 따라 도는 방향이 다릅니다.</div>');
    }

    /* 세운 */
    h.push('<h2 class="sec">세운 <small>해마다의 운, ' + n.y + '년부터</small></h2><div class="runs">');
    for (var Y = n.y; Y < n.y + 10; Y++) {
      var g = MC.gz(MC.yearGz(Y));
      h.push('<div class="run' + (Y === n.y ? ' now' : '') + '"><div class="a">' + Y + '</div><div class="y">' + MC.gzText(g.i) + '년</div>' +
        '<div class="g">' + MC.tenGod(r.dayStem, g.s) + '</div>' + chip(g.s, 0, false) + chip(0, g.b, true) +
        '<div class="g">' + MC.tenGod(r.dayStem, MC.mainHidden(g.b)) + '</div><div class="u">' + MC.unseong(r.dayStem, g.b) + '</div></div>');
    }
    h.push('</div>');

    /* 월운 */
    var curMs = Date.now(), mo = MC.monthsOfYear(n.y), cy = n.y;
    if (curMs < MC.terms(n.y)[2]) { cy = n.y - 1; mo = MC.monthsOfYear(cy); }
    h.push('<h2 class="sec">월운 <small>' + MC.gzText(MC.yearGz(cy)) + '년 열두 달, 절입일부터</small></h2><div class="runs">');
    mo.forEach(function (x, k) {
      var nx = mo[k + 1], on = x.start <= curMs && (!nx || curMs < nx.start);
      var l = MC.utcToLocal(x.start);
      h.push('<div class="run' + (on ? ' now' : '') + '"><div class="a">' + l.m + '/' + l.d + '</div><div class="y">' + x.name + '</div>' +
        '<div class="g">' + MC.tenGod(r.dayStem, x.s) + '</div>' + chip(x.s, 0, false) + chip(0, x.b, true) +
        '<div class="g">' + MC.tenGod(r.dayStem, MC.mainHidden(x.b)) + '</div><div class="u">' + MC.unseong(r.dayStem, x.b) + '</div></div>');
    });
    h.push('</div>');

    h.push('<button type="button" class="to-saju" id="msToSaju">이 사주로 풀이 보기<small>MBTI사주에서 성격 풀이와 토정비결까지</small></button>');
    $('#msResIn').innerHTML = h.join('');
    $('#msToSaju').addEventListener('click', toSaju);
    /* 가로로 긴 줄은 지금 칸이 보이게 */
    $('#msResIn').querySelectorAll('.runs').forEach(function (row) { var now = row.querySelector('.now'); if (now) row.scrollLeft = Math.max(0, now.offsetLeft - row.offsetLeft - 8); });
  }

  /* 사주 앱으로 넘기기 — 받는 쪽이 읽자마자 지운다 */
  function toSaju() {
    var r = st.last; if (!r) return;
    var e = r.effDate, hi = r.P.hour ? r.P.hour.b : -1;
    if (r.inp.yaja && r.late) e = { y: r.inp.y, m: r.inp.m, d: r.inp.d };
    try { sessionStorage.setItem('oreum_to_saju', JSON.stringify({ y: e.y, m: e.m, d: e.d, h: hi, g: r.inp.gender || '' })); } catch (x) {}
    location.href = '/apps/saju/';
  }

  /* ── 만세력 달력 ── */
  (function navInit() {
    var ys = $('#msCY'), o = '';
    for (var y = 1900; y <= 2100; y++) o += '<option value="' + y + '">' + y + '년</option>';
    ys.innerHTML = o;
    var ms = $('#msCM'), o2 = '';
    for (var m = 1; m <= 12; m++) o2 += '<option value="' + m + '">' + m + '월</option>';
    ms.innerHTML = o2;
    ys.addEventListener('change', function () { calGo(+ys.value, st.calM); });
    ms.addEventListener('change', function () { calGo(st.calY, +ms.value); });
    $('#msPrev').addEventListener('click', function () { calGo(st.calM === 1 ? st.calY - 1 : st.calY, st.calM === 1 ? 12 : st.calM - 1); });
    $('#msNext').addEventListener('click', function () { calGo(st.calM === 12 ? st.calY + 1 : st.calY, st.calM === 12 ? 1 : st.calM + 1); });
    $('#msToday').addEventListener('click', function () { var n = koNow(); st.sel = n.d; calGo(n.y, n.m); });
  })();

  function calGo(y, m) {
    if (y < 1900 || y > 2100) return;
    st.calY = y; st.calM = m;
    $('#msCY').value = y; $('#msCM').value = m;
    $('#msPrev').disabled = (y === 1900 && m === 1); $('#msNext').disabled = (y === 2100 && m === 12);
    var T = MC.terms(y), tmap = {};
    for (var k = 0; k < 24; k++) { var l = MC.utcToLocal(T[k]); if (l.y === y && l.m === m) tmap[l.d] = { k: k, ms: T[k], l: l }; }
    /* 머리글: 해와 달의 간지 (입춘·절입 기준) */
    var ipchun = T[2], ygNow = MC.gzText(MC.yearGz(y)), head = '';
    head += '<div class="yg">' + y + '년 ' + m + '월 · ' + ygNow + '년(' + MC.gzText(MC.yearGz(y), 1) + ') ' + MC.ANIMAL[MC.gz(MC.yearGz(y)).b] + '띠</div>';
    var jk = 2 * (m - 1), jl = MC.utcToLocal(T[jk]);
    var msBefore = Date.UTC(y, m - 1, 1) - 9 * 3600000, sy0 = msBefore >= ipchun ? y : y - 1;
    var br0 = (jk / 2) % 12;   // 절 전은 앞 달: 소한 전 자월, 입춘 전 축월 …
    var s0 = MC.monthStemOf(((sy0 - 4) % 10 + 10) % 10, br0);
    var br1 = (jk / 2 + 1) % 12, sy1 = jk === 2 ? y : sy0, s1 = MC.monthStemOf(((sy1 - 4) % 10 + 10) % 10, br1);
    head += '<div class="mg">' + jl.d + '일 ' + M_TERM_NAMES[jk] + ' ' + pad(jl.h) + ':' + pad(jl.mi) + ' 전 <b>' + MC.STEM[s0] + MC.BR[br0] + '월</b>, 뒤 <b>' + MC.STEM[s1] + MC.BR[br1] + '월</b>' +
      (m <= 2 ? ' · 입춘 전은 ' + MC.gzText(MC.yearGz(y - 1)) + '년' : '') + '</div>';
    $('#msCalHead').innerHTML = head;

    var first = (MC.jdn(y, m, 1) + 1) % 7, days = new Date(Date.UTC(y, m, 0)).getUTCDate(), n = koNow(), g = [];
    WEEK.forEach(function (w, k) { g.push('<div class="wd' + (k === 0 ? ' sun' : k === 6 ? ' sat' : '') + '">' + w + '</div>'); });
    for (var b = 0; b < first; b++) g.push('<div class="cd blank"></div>');
    for (var d = 1; d <= days; d++) {
      var j = MC.jdn(y, m, d), gi = MC.dayGz(j), lu = MC.solarToLunar(y, m, d), wk = (j + 1) % 7, tm = tmap[d];
      var isToday = n.y === y && n.m === m && n.d === d;
      g.push('<button type="button" class="cd' + (isToday ? ' today' : '') + (st.sel === d ? ' sel' : '') + '" data-d="' + d + '">' +
        '<span class="n' + (wk === 0 ? ' sun' : wk === 6 ? ' sat' : '') + '">' + d + '</span>' +
        '<span class="gz">' + MC.gzText(gi) + '<i> ' + MC.gzText(gi, 1) + '</i></span>' +
        (lu ? '<span class="lu' + (lu.d === 1 ? ' first' : '') + '">' + (lu.d === 1 ? (lu.leap ? '윤' : '') + lu.m + '월 1일' : (lu.leap ? '윤' : '') + lu.m + '.' + lu.d) + '</span>' : '') +
        (tm ? '<span class="tm">' + M_TERM_NAMES[tm.k] + '</span>' : '') + '</button>');
    }
    $('#msGrid').innerHTML = g.join('');
    $('#msGrid').querySelectorAll('.cd[data-d]').forEach(function (el) { el.addEventListener('click', function () { st.sel = +el.dataset.d; calGo(st.calY, st.calM); }); });
    /* 그달 절기 목록 */
    var tl = Object.keys(tmap).map(function (d) { var t = tmap[d]; return '<div><span>' + M_TERM_NAMES[t.k] + '</span><b>' + m + '/' + t.l.d + ' ' + pad(t.l.h) + ':' + pad(t.l.mi) + '</b></div>'; });
    $('#msTerms').innerHTML = tl.join('');
    dayBox(y, m, st.sel && st.sel <= days ? st.sel : null, tmap);
  }

  function dayBox(y, m, d, tmap) {
    var box = $('#msDay');
    if (!d) { box.hidden = true; return; }
    var j = MC.jdn(y, m, d), lu = MC.solarToLunar(y, m, d), tm = tmap[d];
    var noon = MC.localToUtcMs(y, m, d, 12, 0).ms, sy = MC.yearOfMs(noon, y), ysn = ((sy - 4) % 10 + 10) % 10;
    var mb = monthBrNoon(noon, y), msn = MC.monthStemOf(ysn, mb);
    box.innerHTML = '<div class="d1">' + y + '년 ' + m + '월 ' + d + '일 ' + wd(y, m, d) + '요일</div>' +
      '<div class="d2">' + lunarText(lu) + (lu && lu.leap ? '(윤달)' : '') + ' · 일진 <b>' + MC.gzText(MC.dayGz(j)) + '(' + MC.gzText(MC.dayGz(j), 1) + ')</b>일</div>' +
      '<div class="d3">' + MC.gzText(MC.yearGz(sy)) + '년 ' + MC.STEM[msn] + MC.BR[mb] + '월 ' + MC.gzText(MC.dayGz(j)) + '일' +
      (tm ? ' · ' + M_TERM_NAMES[tm.k] + ' ' + pad(tm.l.h) + ':' + pad(tm.l.mi) + (tm.k % 2 === 0 ? ' (이 시각부터 달이 바뀜)' : '') : '') + '</div>' +
      '<button type="button" class="pick" id="msPick">이 날짜로 사주 보기</button>';
    box.hidden = false;
    $('#msPick').addEventListener('click', function () {
      segSet('#msCal', 'cal', 'solar'); $('#msLeapRow').hidden = true;
      $('#msY').value = y; $('#msM').value = m; $('#msD').value = d;
      tab('saju'); $('#msH').focus();
    });
  }
  function monthBrNoon(ms, y) {
    var br = 0;
    [y - 1, y].forEach(function (yy) { var t = MC.terms(yy); if (!t) return; for (var k = 0; k < 24; k += 2) if (t[k] <= ms) br = (k / 2 + 1) % 12; });
    return br;
  }

  /* ── 오행·십성 비율, 신강·신약, 합충형파해, 신살과 길성 ── */
  var GROUP = function (de, e) {
    if (e === de) return '비겁';
    var S = { '목':'화','화':'토','토':'금','금':'수','수':'목' }, K = { '목':'토','토':'수','수':'화','화':'금','금':'목' };
    if (S[de] === e) return '식상'; if (K[de] === e) return '재성'; if (K[e] === de) return '관성'; return '인성';
  };
  var HAN_EL = { '목':'木', '화':'火', '토':'土', '금':'金', '수':'水' };
  var EL_COL = { '목':'#3f8f5c', '화':'#d4473c', '토':'#d9a52b', '금':'#c9ced6', '수':'#1f2a3d' };
  function ohSvg(RT, de) {
    var ORDER = ['목','화','토','금','수'], cx = 150, cy = 158, R = 96, pos = {}, g = [];
    ORDER.forEach(function (e, k) { var a = (-90 + k * 72) * Math.PI / 180; pos[e] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), r: Math.min(46, 24 + RT.el[e] * .45) }; });
    function arrow(a, b, col, dash) {
      var A = pos[a], B = pos[b], dx = B.x - A.x, dy = B.y - A.y, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
      var x1 = A.x + ux * (A.r + 4), y1 = A.y + uy * (A.r + 4), x2 = B.x - ux * (B.r + 7), y2 = B.y - uy * (B.r + 7);
      return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + col + '" stroke-width="2"' + (dash ? ' stroke-dasharray="5 4"' : '') + ' marker-end="url(#ah' + (dash ? 'k' : 's') + ')"/>';
    }
    g.push('<svg class="ohsvg" viewBox="0 0 300 312" role="img" aria-label="오행 비율과 생극 관계"><defs>' +
      '<marker id="ahs" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#3b6fd8"/></marker>' +
      '<marker id="ahk" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#d4473c"/></marker></defs>');
    ORDER.forEach(function (e, k) { g.push(arrow(e, ORDER[(k + 2) % 5], '#d4473c', true)); });
    ORDER.forEach(function (e, k) { g.push(arrow(e, ORDER[(k + 1) % 5], '#3b6fd8', false)); });
    ORDER.forEach(function (e) {
      var p = pos[e], light = e === '금' || e === '토', tc = light ? '#2a2f38' : '#fff', zero = RT.el[e] === 0;
      g.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + p.r.toFixed(1) + '" fill="' + EL_COL[e] + '"' + (zero ? ' fill-opacity=".28"' : '') +
        (e === de ? ' stroke="#c23b32" stroke-width="3.5"' : '') + '/>');
      g.push('<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 2).toFixed(1) + '" text-anchor="middle" font-size="22" font-weight="800" font-family="Noto Serif KR,Batang,serif" fill="' + (zero ? '#5d6575' : tc) + '">' + HAN_EL[e] + '</text>');
      g.push('<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 19).toFixed(1) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="' + (zero ? '#5d6575' : tc) + '">' + (Math.round(RT.el[e] * 10) / 10) + '%</text>');
      var ly = p.y + (p.y > cy ? p.r + 16 : -p.r - 7);
      g.push('<text x="' + p.x.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#5d6575">' + e + ' · ' + GROUP(de, e) + '</text>');
    });
    g.push('</svg>');
    return g.join('');
  }

  var GIL = ['천을귀인','문창귀인','학당귀인','태극귀인','정록'], HYUNG = ['양인살','홍염살','현침살','괴강살','백호살'];
  var STAR_MEAN = {
    '천을귀인': '어려울 때 도와주는 사람이 나타나는 귀인', '문창귀인': '글과 공부에 밝은 기운', '학당귀인': '배우고 익히는 데 힘이 되는 기운',
    '태극귀인': '조상의 덕과 큰 복', '정록': '일간이 뿌리내린 자리, 스스로 먹고사는 힘', '양인살': '세고 날카로운 추진력',
    '홍염살': '사람을 끄는 매력', '도화살': '인기와 이성의 관심', '역마살': '이동과 변화, 바깥으로 도는 기운',
    '화개살': '예술과 종교, 혼자 깊이 파고드는 기운', '현침살': '날카로운 말솜씨와 손재주', '괴강살': '강한 기세와 결단',
    '백호살': '거센 기운, 다툼과 사고를 조심'
  };
  var STAR_ORDER = ['천을귀인','문창귀인','학당귀인','태극귀인','정록','홍염살','도화살','역마살','화개살','양인살','현침살','괴강살','백호살'];
  var GROUP_SPLIT = [['비겁','비견','겁재'],['식상','식신','상관'],['재성','편재','정재'],['관성','편관','정관'],['인성','편인','정인']];
  function moreSections(r, SX, RL, RT, SG) {
    var h = [], de = MC.STEM_EL[r.dayStem], P = r.P;
    /* 오행 분포 + 십성 다섯 묶음 막대 */
    h.push('<h2 class="sec">오행 분포 <small>파란 화살표는 생, 빨간 점선은 극</small></h2><div class="ohwrap">' + ohSvg(RT, de) + '<div class="gbars">');
    GROUP_SPLIT.forEach(function (g) {
      var a = RT.god[g[1]], b = RT.god[g[2]], t = a + b;
      h.push('<div class="gb"><div class="gh"><b>' + g[0] + '</b><span>' + (Math.round(t * 10) / 10) + '%</span></div>' +
        '<div class="gt"><i class="g1" style="width:' + a + '%"></i><i class="g2" style="width:' + b + '%"></i></div>' +
        '<div class="gs">' + g[1] + ' ' + (Math.round(a * 10) / 10) + '% · ' + g[2] + ' ' + (Math.round(b * 10) / 10) + '%</div></div>');
    });
    h.push('</div></div>');
    /* 신강·신약 — 점수 눈금자 + 점검표 */
    var sc = Math.round(SG.score);
    h.push('<h2 class="sec">일간의 힘 <small>신강과 신약</small></h2><div class="gauge"><div class="track">' +
      [[0,12.5],[12.5,27.5],[27.5,42.5],[42.5,52.5],[52.5,62.5],[62.5,77.5],[77.5,100]].map(function (z, k) {
        return '<span class="z' + (k === SG.level ? ' on' : '') + '" style="left:' + z[0] + '%;width:' + (z[1] - z[0]) + '%"><em>' + MX.LEVELS[k] + '</em></span>';
      }).join('') + '<b class="pin" style="left:' + sc + '%"><i>' + sc + '점</i></b></div>' +
      '<div class="ticks"><span>0</span><span>50</span><span>100</span></div></div>');
    h.push('<p class="strtxt"><b>' + sc + '점, ' + (SG.level === 3 ? '어느 쪽으로도 치우치지 않은 중화' : SG.name) + '</b>입니다. 일간을 돕는 글자(비겁과 인성)가 앉은 자리에 점수를 줘서, 태어난 달 30점, 태어난 날과 시 15점씩, 나머지 자리 10점씩으로 셉니다.' + (SG.hasHour ? '' : ' 시간을 모르면 시주를 빼고 비율로 셉니다.') + '</p>');
    h.push('<ul class="check">' +
      ck(SG.deukryeong, '득령', '태어난 달(월지)이 일간을 돕는다') + ck(SG.deukji, '득지', '태어난 날의 지지(일지)가 일간을 돕는다') +
      (SG.hasHour ? ck(SG.deuksi, '득시', '태어난 시의 지지(시지)가 일간을 돕는다') : '') + ck(SG.deukse, '득세', '나머지 글자 가운데 둘 이상이 일간을 돕는다') + '</ul>');
    /* 합충형파해 */
    var GOOD = ['천간합','지지육합','지지삼합','지지방합'];
    h.push('<h2 class="sec">합충형파해 <small>원국 글자끼리의 관계</small></h2>');
    h.push(RL.length ? '<div class="rels">' + RL.map(function (x) { return '<span class="' + (GOOD.indexOf(x.type) >= 0 ? 'good' : 'bad') + '"><b>' + x.type + '</b>' + x.text + '</span>'; }).join('') + '</div>'
      : '<div class="needg">원국 안에 합이나 충, 형, 파, 해, 원진이 없습니다.</div>');
    /* 귀인과 신살 — 별마다 자리와 뜻 */
    var where = {};
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var st = SX[k]; if (!st) return;
      st.s.forEach(function (x) { (where[x] = where[x] || []).push(POS[k].charAt(0) + '간 ' + MC.STEM_H[P[k].s]); });
      st.b.forEach(function (x) { (where[x] = where[x] || []).push(POS[k].charAt(0) + '지 ' + MC.BR_H[P[k].b]); });
    });
    var names = STAR_ORDER.filter(function (x) { return where[x]; });
    h.push('<h2 class="sec">귀인과 신살 <small>파랑은 귀인, 빨강은 조심할 살</small></h2>');
    h.push(names.length ? '<ul class="starl">' + names.map(function (x) {
      return '<li class="' + (GIL.indexOf(x) >= 0 ? 'gil' : HYUNG.indexOf(x) >= 0 ? 'hyung' : '') + '"><b>' + x + '</b><span class="w">' + where[x].join(', ') + '</span><span class="m">' + STAR_MEAN[x] + '</span></li>';
    }).join('') + '</ul>' : '<div class="needg">원국에 해당하는 귀인이나 신살이 없습니다.</div>');
    return h.join('');
  }
  function ck(on, t, d) { return '<li class="' + (on ? 'on' : '') + '"><span class="mk">' + (on ? '○' : '×') + '</span><b>' + t + '</b> ' + d + '</li>'; }

  /* ── 태어난 곳 찾기 ── */
  (function cityInit() {
    var inp = $('#msCity'), list = $('#msCityList'), lon = $('#msLon'), hint = $('#msCityHint'), act = -1, items = [];
    var base = hint.textContent;
    function norm(t) { return t.replace(/\s/g, '').replace(/(특별시|광역시|특별자치시|시|군)$/, ''); }
    function pick(c) {
      inp.value = c.n; lon.value = String(c.lon); list.hidden = true;
      var m = Math.round((c.lon - 135) * 4);
      hint.textContent = c.n + ' 동경 ' + c.lon.toFixed(2) + '도. 지금 한국 시계보다 ' + Math.abs(m) + '분 ' + (m < 0 ? '늦게' : '빠르게') + ' 보고 계산합니다.';
    }
    function show() {
      var q = norm(inp.value); act = -1;
      if (!q) { list.hidden = true; lon.value = '127.5'; hint.textContent = base; return; }
      var hit = M_CITY.filter(function (c) { return norm(c.n).indexOf(q) >= 0; });
      items = hit.filter(function (c) { return norm(c.n).indexOf(q) === 0; }).concat(hit.filter(function (c) { return norm(c.n).indexOf(q) > 0; })).slice(0, 8);
      var exact = M_CITY.filter(function (c) { return norm(c.n) === q; })[0];
      if (exact) { lon.value = String(exact.lon); } else { lon.value = '127.5'; hint.textContent = '목록에서 고르면 그곳 경도로 보정합니다. 고르지 않으면 동경 127.5도로 계산합니다.'; }
      list.innerHTML = items.map(function (c, k) { return '<li role="option" data-k="' + k + '">' + c.n + '<small>동경 ' + c.lon.toFixed(2) + '</small></li>'; }).join('');
      list.hidden = !items.length;
    }
    inp.addEventListener('input', show);
    inp.addEventListener('focus', function () { if (inp.value) show(); });
    inp.addEventListener('blur', function () { setTimeout(function () { list.hidden = true; var e = M_CITY.filter(function (c) { return norm(c.n) === norm(inp.value); })[0]; if (e) pick(e); }, 150); });
    list.addEventListener('mousedown', function (e) { var li = e.target.closest('li'); if (li) { e.preventDefault(); pick(items[+li.dataset.k]); } });
    inp.addEventListener('keydown', function (e) {
      if (list.hidden) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        list.querySelectorAll('li').forEach(function (li, k) { li.classList.toggle('act', k === act); }); }
      if (e.key === 'Enter' && act >= 0) { e.preventDefault(); pick(items[act]); }
    });
  })();

  /* ── 12간지 시간표 ── */
  (function ttInit() {
    var rows = MC.BR.map(function (b, k) {
      var s = (k * 2 + 23) % 24, e = (k * 2 + 1) % 24;
      return '<tr><td>' + b + '시(' + MC.BR_H[k] + ')</td><td>' + MC.ANIMAL[k] + '</td><td>' + pad(s) + ':30 ~ ' + pad(e) + ':29</td></tr>';
    });
    $('#msTT').innerHTML = '<table>' + rows.join('') + '</table><p class="hint">지금 한국 시계(동경 135도)를 동경 127.5도에 맞춰 30분 늦춘 시간표입니다. 서머타임 기간이나 옛 표준시 때 태어났다면 시계 시각을 그대로 넣으면 이 만세력이 알아서 고칩니다.</p>';
  })();

  /* 사주 앱에서 넘어온 값 — 읽자마자 지운다 */
  (function fromSaju() {
    var raw = null;
    try { raw = sessionStorage.getItem('oreum_to_manse'); sessionStorage.removeItem('oreum_to_manse'); } catch (x) {}
    if (!raw) return;
    try {
      var v = JSON.parse(raw);
      $('#msY').value = v.y; $('#msM').value = v.m; $('#msD').value = v.d;
      if (typeof v.h === 'number' && v.h >= 0) { $('#msH').value = String((v.h * 2) % 24); $('#msMi').disabled = false; $('#msMi').value = '30'; }
      if (v.g === 'm' || v.g === 'f') segSet('#msG', 'gender', v.g);
      $('#msForm').requestSubmit ? $('#msForm').requestSubmit() : $('#msGo').click();
    } catch (x) {}
  })();
  if (/^#(cal|calendar|dal)$/.test(location.hash)) tab('cal');
})();
