/* manse-core.js — 만세력 계산 (화면과 떨어진 순수 계산)
   자료는 manse-data.js. 사주 앱(/apps/saju/)과 같은 절기·음력표를 쓴다. */
var MC = (function () {
  var STEM = ['갑','을','병','정','무','기','경','신','임','계'];
  var STEM_H = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var BR = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
  var BR_H = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var ANIMAL = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
  var STEM_EL = ['목','목','화','화','토','토','금','금','수','수'];
  var BR_EL = ['수','토','목','목','토','화','화','토','금','금','토','수'];
  /* 지장간 [천간, 일수] 여기→중기→정기 (사주 앱과 같은 월률분야표) */
  var HIDDEN = [[[8,10],[9,20]],[[9,9],[7,3],[5,18]],[[4,7],[2,7],[0,16]],[[0,10],[1,20]],
    [[1,9],[9,3],[4,18]],[[4,7],[6,7],[2,16]],[[2,10],[5,9],[3,11]],[[3,9],[1,3],[5,18]],
    [[4,7],[8,7],[6,16]],[[6,10],[7,20]],[[7,9],[3,3],[4,18]],[[4,7],[0,7],[8,16]]];
  var SHENG = { '목':'화','화':'토','토':'금','금':'수','수':'목' };
  var KE = { '목':'토','토':'수','수':'화','화':'금','금':'목' };
  var JANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
  var UNSEONG = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];
  var DAY = 86400000;

  function stemYin(s) { return s % 2 === 1; }
  function tenGod(dayStem, otherStem) {
    var a = STEM_EL[dayStem], b = STEM_EL[otherStem], same = stemYin(dayStem) === stemYin(otherStem);
    if (a === b) return same ? '비견' : '겁재';
    if (SHENG[a] === b) return same ? '식신' : '상관';
    if (KE[a] === b) return same ? '편재' : '정재';
    if (KE[b] === a) return same ? '편관' : '정관';
    return same ? '편인' : '정인';
  }
  function mainHidden(br) { var h = HIDDEN[br]; return h[h.length - 1][0]; }
  function unseong(stem, br) {
    var st = JANGSAENG[stem], k = stemYin(stem) ? st - br : br - st;
    return UNSEONG[((k % 12) + 12) % 12];
  }
  function idx60(stem, br) { for (var i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === br) return i; return 0; }
  function gz(i) { i = ((i % 60) + 60) % 60; return { i: i, s: i % 10, b: i % 12 }; }
  function gzText(i, han) { var g = gz(i); return han ? STEM_H[g.s] + BR_H[g.b] : STEM[g.s] + BR[g.b]; }

  /* 율리우스 적일 */
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function fromJdn(j) {
    var a = j + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    var d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * d / 4), m = Math.floor((5 * e + 2) / 153);
    return { y: 100 * b + d - 4800 + Math.floor(m / 10), m: m + 3 - 12 * Math.floor(m / 10), d: e - Math.floor((153 * m + 2) / 5) + 1 };
  }
  function dayGz(j) { return ((j - 11) % 60 + 60) % 60; }

  /* 한국 시계 ↔ UTC (표준시 변경·서머타임 이력은 M_TZ) */
  function tzAt(utcSec) { var o = M_TZ[0][1]; for (var i = 0; i < M_TZ.length; i++) { if (M_TZ[i][0] <= utcSec) o = M_TZ[i][1]; else break; } return o; }
  function localToUtcMs(y, m, d, h, mi) {
    var loc = Date.UTC(y, m - 1, d, h, mi) / 1000, off = tzAt(loc - 32400), u = loc - off;
    var off2 = tzAt(u); if (off2 !== off) u = loc - off2;
    return { ms: u * 1000, off: tzAt(u) };
  }
  function utcToLocal(ms) {
    var o = tzAt(ms / 1000), t = new Date(ms + o * 1000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), off: o };
  }

  /* 절기 — 24절기 UTC 시각(ms) */
  var termCache = {};
  function terms(y) {
    if (termCache[y]) return termCache[y];
    var row = M_TERMS[y - M_TERMS_START]; if (!row) return null;
    var base = Date.UTC(y, 0, 1), list = [];
    for (var k = 0; k < 24; k++) list.push(base + parseInt(row.substr(k * 4, 4), 36) * 60000);
    return (termCache[y] = list);
  }
  /* 12절(節) — 달이 바뀌는 절기. 소한·입춘·경칩…대설 = 24절기의 짝수 번째 */
  function jeolList(y0, y1) {
    var out = [];
    for (var y = y0; y <= y1; y++) {
      var t = terms(y); if (!t) continue;
      for (var k = 0; k < 24; k += 2) out.push({ ms: t[k], name: M_TERM_NAMES[k], br: (k / 2 + 1) % 12, y: y });
    }
    return out;
  }

  /* 음력 */
  function lunarMonths(ly) {
    var row = M_LUNAR[ly - M_LUNAR_START]; if (!row) return null;
    var p = row.split(','), start = +p[0], leap = +p[1], bits = +p[2], cnt = +p[3];
    var list = [], num = 1, cur = start, used = false;
    for (var j = 0; j < cnt; j++) {
      var days = ((bits >> (cnt - 1 - j)) & 1) ? 30 : 29, n = num, lp = false;
      if (leap > 0 && !used && num === leap + 1) { n = leap; lp = true; used = true; } else num++;
      list.push({ m: n, leap: lp, days: days, start: cur }); cur += days;
    }
    return list;
  }
  function solarToLunar(y, m, d) {
    var j = jdn(y, m, d);
    for (var ly = y; ly >= y - 1; ly--) {
      var ms = lunarMonths(ly); if (!ms) continue;
      for (var i = 0; i < ms.length; i++) if (j >= ms[i].start && j < ms[i].start + ms[i].days)
        return { y: ly, m: ms[i].m, d: j - ms[i].start + 1, leap: ms[i].leap, days: ms[i].days };
    }
    return null;
  }
  function lunarToSolar(ly, lm, ld, leap) {
    var ms = lunarMonths(ly); if (!ms) return { err: 'range' };
    for (var i = 0; i < ms.length; i++) if (ms[i].m === lm && ms[i].leap === !!leap) {
      if (ld < 1 || ld > ms[i].days) return { err: 'day', days: ms[i].days };
      return fromJdn(ms[i].start + ld - 1);
    }
    return { err: leap ? 'leap' : 'month' };
  }
  function leapMonthOf(ly) { var ms = lunarMonths(ly); if (!ms) return 0; for (var i = 0; i < ms.length; i++) if (ms[i].leap) return ms[i].m; return 0; }

  function yearOfMs(ms, y) { var t = terms(y); return ms >= t[2] ? y : y - 1; }   // t[2] = 입춘
  function monthBrOfMs(ms, y) {
    var js = jeolList(y - 1, y), br = 0;
    for (var i = 0; i < js.length; i++) if (js[i].ms <= ms) br = js[i].br;
    return br;
  }
  function monthStemOf(yearStem, br) { var mi = (br - 2 + 12) % 12; return ((yearStem % 5) * 2 + 2 + mi) % 10; }

  /* input: { y,m,d (양력), time:true/false, h, mi, gender:'m'|'f'|'', lon(경도, 기본 127.5), yaja(야자시) } */
  function calc(inp) {
    var y = inp.y, m = inp.m, d = inp.d, known = !!inp.time;
    var h = known ? inp.h : 12, mi = known ? inp.mi : 0, lon = inp.lon || 127.5;
    var lu = localToUtcMs(y, m, d, h, mi), ms = lu.ms;
    var notes = [];
    if (known) {
      if (lu.off === 36000 || lu.off === 34200) notes.push('서머타임 기간이라 시계 시각에서 1시간을 빼고 계산했습니다.');
      else if (lu.off === 30600) notes.push('이때 한국 표준시는 동경 127.5도(UTC+8:30)였습니다. 그 시각 그대로 계산했습니다.');
    }
    /* 연주 — 입춘 절입 시각 */
    var sy = yearOfMs(ms, y);
    var ys = ((sy - 4) % 10 + 10) % 10, yb = ((sy - 4) % 12 + 12) % 12;
    /* 월주 — 절입 시각 */
    var mb = monthBrOfMs(ms, y), msn = monthStemOf(ys, mb);
    /* 일주·시주 — 경도 기준 태양시(경도 1도 = 4분) */
    var sol = new Date(ms + lon * 240000);
    var sh = sol.getUTCHours() + sol.getUTCMinutes() / 60;
    var dj = known ? jdn(sol.getUTCFullYear(), sol.getUTCMonth() + 1, sol.getUTCDate()) : jdn(y, m, d);
    var hb = null, hs = null, late = false;
    if (known) {
      hb = Math.floor((sh + 1) / 2) % 12;
      if (sh >= 23) { late = true; if (!inp.yaja) dj += 1; }
    }
    var di = dayGz(dj), ds = di % 10, db = di % 12;
    if (known) { var base = (inp.yaja && late) ? (ds + 1) % 10 : ds; hs = ((base % 5) * 2 + hb) % 10; }
    if (known && late) notes.push(inp.yaja ? '밤 자시라 야자시로 보아 일주는 그날로 두고 시주만 다음 날 기준으로 잡았습니다.' : '밤 자시(자정 전)라 다음 날 일주로 계산했습니다.');
    if (known && Math.abs(lon - 127.5) > 0.01) { var dm = Math.round((lon * 240 - lu.off) / 60); notes.push('태어난 곳 경도(동경 ' + lon + '도)에 맞춰 그때 시계보다 ' + Math.abs(dm) + '분 ' + (dm < 0 ? '늦게' : '빠르게') + ' 보고 계산했습니다.'); }

    var P = { year: { s: ys, b: yb }, month: { s: msn, b: mb }, day: { s: ds, b: db }, hour: known ? { s: hs, b: hb } : null };
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = P[k]; if (!p) return;
      p.i = idx60(p.s, p.b);
      p.godS = k === 'day' ? '일간' : tenGod(ds, p.s);
      p.godB = tenGod(ds, mainHidden(p.b));
      p.hidden = HIDDEN[p.b].map(function (x) { return x[0]; });
      p.un = unseong(ds, p.b);
    });
    /* 오행 개수 */
    var el = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    ['year', 'month', 'day', 'hour'].forEach(function (k) { var p = P[k]; if (!p) return; el[STEM_EL[p.s]]++; el[BR_EL[p.b]]++; });
    /* 공망 — 일주가 속한 순(旬)에서 빠진 두 지지 */
    var xs = di - (di % 10), gm = [(xs + 10) % 12, (xs + 11) % 12];

    /* 대운 — 양남음녀 순행, 음남양녀 역행. 다음(지난) 절까지 3일 = 1년 */
    var dae = null;
    if (inp.gender === 'm' || inp.gender === 'f') {
      var fwd = (ys % 2 === 0) === (inp.gender === 'm');
      var js = jeolList(y - 1, y + 1), tgt = null;
      for (var i = 0; i < js.length; i++) {
        if (fwd && js[i].ms > ms) { tgt = js[i]; break; }
        if (!fwd && js[i].ms <= ms) tgt = js[i];
      }
      var days = tgt ? Math.abs(tgt.ms - ms) / DAY : 0;
      var num = Math.max(1, Math.round(days / 3));
      var list = [];
      for (var k2 = 1; k2 <= 10; k2++) {
        var g = gz(P.month.i + (fwd ? k2 : -k2));
        list.push({ age: num + (k2 - 1) * 10, year: y + num + (k2 - 1) * 10, i: g.i, s: g.s, b: g.b,
                    godS: tenGod(ds, g.s), godB: tenGod(ds, mainHidden(g.b)), un: unseong(ds, g.b) });
      }
      dae = { fwd: fwd, num: num, days: days, jeol: tgt, list: list };
    }
    return { inp: inp, P: P, el: el, gm: gm, dae: dae, lunar: solarToLunar(y, m, d), notes: notes, sy: sy, ms: ms,
             dayStem: ds, effDate: fromJdn(dj), late: late };
  }
  function yearGz(Y) { return ((Y - 4) % 60 + 60) % 60; }
  /* Y년(입춘 기준) 열두 달의 월건과 절입 시각 — 인월부터 축월까지 */
  function monthsOfYear(Y) {
    var ys = ((Y - 4) % 10 + 10) % 10, t = terms(Y), t2 = terms(Y + 1), out = [];
    for (var k = 0; k < 12; k++) {
      var br = (k + 2) % 12, s = monthStemOf(ys, br), ti = 2 + 2 * k;
      out.push({ s: s, b: br, i: idx60(s, br), start: ti < 24 ? t[ti] : (t2 ? t2[ti - 24] : null), name: M_TERM_NAMES[ti % 24] });
    }
    return out;
  }
  return {
    STEM: STEM, STEM_H: STEM_H, BR: BR, BR_H: BR_H, ANIMAL: ANIMAL, STEM_EL: STEM_EL, BR_EL: BR_EL, HIDDEN: HIDDEN,
    jdn: jdn, fromJdn: fromJdn, dayGz: dayGz, gz: gz, gzText: gzText, tenGod: tenGod, mainHidden: mainHidden, unseong: unseong,
    terms: terms, utcToLocal: utcToLocal, localToUtcMs: localToUtcMs, solarToLunar: solarToLunar, lunarToSolar: lunarToSolar,
    leapMonthOf: leapMonthOf, calc: calc, yearGz: yearGz, monthsOfYear: monthsOfYear, monthStemOf: monthStemOf, idx60: idx60, yearOfMs: yearOfMs
  };
})();
