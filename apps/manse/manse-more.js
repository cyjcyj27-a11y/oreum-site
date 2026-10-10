/* manse-more.js — 신살·길성, 합충형파해, 오행·십성 비율, 신강·신약 (MC 위에 얹는 계산) */
var MX = (function () {
  var SAL12 = ['겁살','재살','천살','지살','년살','월살','망신살','장성살','반안살','역마살','육해살','화개살'];
  /* 삼합 무리별 겁살 자리: 인오술→해, 신자진→사, 사유축→인, 해묘미→신 */
  function salStart(b) { return [5, 2, 11, 8][b % 4]; }
  function sal12(base, b) { return SAL12[(b - salStart(base) + 12) % 12]; }

  var BR = MC.BR, BH = MC.BR_H, ST = MC.STEM, SH = MC.STEM_H;
  var CHEONEUL = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[2,6],[3,5],[3,5]];
  var MUNCHANG = [5,6,8,9,8,9,11,0,2,3];
  var HAKDANG = [11,6,2,9,2,9,5,0,8,3];
  var TAEGEUK = [[0,6],[0,6],[3,9],[3,9],[4,10,1,7],[4,10,1,7],[2,11],[2,11],[5,8],[5,8]];
  var HONGYEOM = [6,6,2,7,4,4,10,9,0,8];
  var ROK = [2,3,5,6,5,6,8,9,11,0];
  var YANGIN = [3,null,6,null,6,null,9,null,0,null];
  var GOEGANG = ['경진','경술','임진','임술','무술'], BAEKHO = ['갑진','을미','병술','정축','무진','임술','계축'];
  var HYEONCHIM_S = [0, 7], HYEONCHIM_B = [3, 6, 7, 8];

  /* 기둥마다 신살·길성 { s:[], b:[] } */
  function stars(r) {
    var P = r.P, ds = r.dayStem, out = {};
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = P[k]; if (!p) return;
      var s = [], b = [], br = p.b;
      if (CHEONEUL[ds].indexOf(br) >= 0) b.push('천을귀인');
      if (MUNCHANG[ds] === br) b.push('문창귀인');
      if (HAKDANG[ds] === br) b.push('학당귀인');
      if (TAEGEUK[ds].indexOf(br) >= 0) b.push('태극귀인');
      if (ROK[ds] === br) b.push('정록');
      if (YANGIN[ds] === br) b.push('양인살');
      if (HONGYEOM[ds] === br) b.push('홍염살');
      if (br % 3 === 0) b.push('도화살');
      if (br % 3 === 2) b.push('역마살');
      if (br % 3 === 1) b.push('화개살');
      if (HYEONCHIM_B.indexOf(br) >= 0) b.push('현침살');
      if (HYEONCHIM_S.indexOf(p.s) >= 0) s.push('현침살');
      var g = ST[p.s] + BR[br];
      if (GOEGANG.indexOf(g) >= 0) b.push('괴강살');
      if (BAEKHO.indexOf(g) >= 0) b.push('백호살');
      out[k] = { s: s, b: b, sal: k === 'year' ? sal12(P.day.b, br) : sal12(P.year.b, br) };
    });
    return out;
  }

  /* 합충형파해 — 원국 기둥끼리 */
  var POSN = { year: '연', month: '월', day: '일', hour: '시' };
  var EL_OF = { 0:'토', 1:'금', 2:'수', 3:'목', 4:'화' };   // 천간합 화(化)오행: 갑기토 을경금 병신수 정임목 무계화
  var YUKHAP = { '0,1':'토', '2,11':'목', '3,10':'화', '4,9':'금', '5,8':'수', '6,7':'화' };
  var SAMHAP = [[8,0,4,'수'],[11,3,7,'목'],[2,6,10,'화'],[5,9,1,'금']];
  var BANGHAP = [[2,3,4,'목'],[5,6,7,'화'],[8,9,10,'금'],[11,0,1,'수']];
  function key(a, b) { return Math.min(a, b) + ',' + Math.max(a, b); }
  var PA = ['0,9','1,4','2,11','3,6','5,8','7,10'], HAE = ['0,7','1,6','2,5','3,4','8,11','9,10'], WONJIN = ['0,7','1,6','2,9','3,8','4,11','5,10'];

  function relations(r) {
    var P = r.P, ks = ['year', 'month', 'day', 'hour'].filter(function (k) { return P[k]; }), out = [];
    function add(type, text) { out.push({ type: type, text: text }); }
    for (var i = 0; i < ks.length; i++) for (var j = i + 1; j < ks.length; j++) {
      var a = P[ks[i]], b = P[ks[j]], w = '(' + POSN[ks[i]] + POSN[ks[j]] + ')';
      var sd = (b.s - a.s + 10) % 10;
      if (sd === 5) { var lo = Math.min(a.s, b.s); add('천간합', SH[a.s] + SH[b.s] + ' 합 ' + EL_OF[lo] + w); }
      if (sd === 4 || sd === 6) { if ((a.s < 8 && b.s === a.s + 6) || (b.s < 8 && a.s === b.s + 6)) add('천간충', SH[a.s] + SH[b.s] + ' 충' + w); }
      var kk = key(a.b, b.b);
      if (YUKHAP[kk]) add('지지육합', BH[a.b] + BH[b.b] + ' 합 ' + YUKHAP[kk] + w);
      if (Math.abs(a.b - b.b) === 6) add('지지충', BH[a.b] + BH[b.b] + ' 충' + w);
      if (PA.indexOf(kk) >= 0) add('파', BH[a.b] + BH[b.b] + ' 파' + w);
      if (HAE.indexOf(kk) >= 0) add('해', BH[a.b] + BH[b.b] + ' 해' + w);
      if (WONJIN.indexOf(kk) >= 0) add('원진', BH[a.b] + BH[b.b] + ' 원진' + w);
      if (kk === '0,3') add('형', BH[a.b] + BH[b.b] + ' 형' + w);
      if (a.b === b.b && [4, 6, 9, 11].indexOf(a.b) >= 0) add('형', BH[a.b] + BH[b.b] + ' 자형' + w);
    }
    var brs = ks.map(function (k) { return P[k].b; });
    function has(x) { return brs.indexOf(x) >= 0; }
    SAMHAP.forEach(function (g) {
      var n = g.slice(0, 3).filter(has);
      if (n.length === 3) add('지지삼합', g.slice(0, 3).map(function (x) { return BH[x]; }).join('') + ' 삼합 ' + g[3]);
      else if (n.length === 2 && has(g[1])) add('지지삼합', n.map(function (x) { return BH[x]; }).join('') + ' 반합 ' + g[3]);
    });
    BANGHAP.forEach(function (g) {
      var n = g.slice(0, 3).filter(has);
      if (n.length === 3) add('지지방합', g.slice(0, 3).map(function (x) { return BH[x]; }).join('') + ' 방합 ' + g[3]);
    });
    [[2,5,8,'인사신'],[1,10,7,'축술미']].forEach(function (g) {
      var n = g.slice(0, 3).filter(has);
      if (n.length >= 2) add('형', n.map(function (x) { return BH[x]; }).join('') + (n.length === 3 ? ' 삼형' : ' 형'));
    });
    if (r.gm) ks.forEach(function (k) { if (k !== 'day' && r.gm.indexOf(P[k].b) >= 0) add('공망', BH[P[k].b] + ' 공망(' + POSN[k] + '지)'); });
    var ORD = ['천간합','천간충','지지육합','지지삼합','지지방합','지지충','형','파','해','원진','공망'];
    return out.sort(function (x, y) { return ORD.indexOf(x.type) - ORD.indexOf(y.type); });
  }

  /* 오행·십성 비율 — 여덟(시간 모르면 여섯) 글자를 한 자씩. 지지 십성은 정기 기준, 일간은 비견으로 센다 */
  var GODS = ['비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인'];
  function ratios(r) {
    var P = r.P, ds = r.dayStem, n = 0, god = {};
    GODS.forEach(function (g) { god[g] = 0; });
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = P[k]; if (!p) return;
      god[MC.tenGod(ds, p.s)]++; god[MC.tenGod(ds, MC.mainHidden(p.b))]++; n += 2;
    });
    var el = {}; Object.keys(r.el).forEach(function (e) { el[e] = r.el[e] / n * 100; });
    var gp = {}; GODS.forEach(function (g) { gp[g] = god[g] / n * 100; });
    return { el: el, god: gp, n: n };
  }

  /* 신강·신약 — 일간을 돕는 글자(비겁·인성)의 자리 점수. 월지 30, 일지·시지 15, 나머지 10 (시간 모르면 비율로 늘림) */
  var W = { 'year.s': 10, 'month.s': 10, 'hour.s': 10, 'year.b': 10, 'month.b': 30, 'day.b': 15, 'hour.b': 15 };
  var LEVELS = ['극약', '태약', '신약', '중화', '신강', '태강', '극왕'];
  function helps(dayEl, el) { return el === dayEl || ({ '목':'수','화':'목','토':'화','금':'토','수':'금' })[dayEl] === el; }
  function strengthScore(r) {
    var P = r.P, de = MC.STEM_EL[r.dayStem], got = 0, tot = 0, f = {};
    Object.keys(W).forEach(function (k) {
      var pos = k.split('.'), p = P[pos[0]]; if (!p) return;
      var el = pos[1] === 's' ? MC.STEM_EL[p.s] : MC.BR_EL[p.b], ok = helps(de, el);
      tot += W[k]; if (ok) got += W[k]; f[k] = ok;
    });
    var sc = got / tot * 100;
    var lv = sc < 12.5 ? 0 : sc < 27.5 ? 1 : sc < 42.5 ? 2 : sc < 52.5 ? 3 : sc < 62.5 ? 4 : sc < 77.5 ? 5 : 6;
    var se = ['year.s', 'month.s', 'hour.s', 'year.b'].filter(function (k) { return f[k]; }).length;
    return { score: sc, level: lv, name: LEVELS[lv], deukryeong: !!f['month.b'], deukji: !!f['day.b'], deuksi: !!f['hour.b'], deukse: se >= 2, hasHour: !!P.hour };
  }
  return { stars: stars, relations: relations, ratios: ratios, strength: strengthScore, LEVELS: LEVELS, GODS: GODS };
})();
