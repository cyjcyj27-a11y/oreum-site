/* 핑거킥 — 리그전. 나 + 함성 녹음이 들어 있는 8개 나라, 한 시즌 = 모두와 한 번씩(8경기).
 * 상태·저장·순위표·다른 경기 결과·상대 나라의 함성 목록을 맡는다. 물리·CPU 는 game.js 그대로(사이트판과 같은 세기). */
(function () {
  'use strict';
  var KEY = 'fingerkick.league';
  var EN = /[?&]lang=en/i.test(location.search);

  // 나라만 쓴다. 팀·구단 이름은 쓰지 않는다. ring = 테두리, body = 몸통. 내 말(대한민국: 빨강 테두리 + 파랑 몸통)과 겹치지 않게.
  // crowd: 그 나라에서 녹음한 함성(assets/SOUNDS.md). str: 다른 경기 결과를 낼 때 쓰는 강도(서열).
  var TEAMS = [
    { ko: '아일랜드', en: 'Ireland', iso: 'IRL', ring: '#ff883e', body: '#169b62', gk: '#0d5e3b', str: 0.8, crowd: ['crowd-ie'] },
    { ko: '네덜란드', en: 'Netherlands', iso: 'NED', ring: '#21468b', body: '#ff7f00', gk: '#a85200', str: 0.95, crowd: ['crowd-nl', 'crowd-esnl'] },
    { ko: '벨기에', en: 'Belgium', iso: 'BEL', ring: '#fdda24', body: '#111111', gk: '#3a3a3a', str: 1.1, crowd: ['crowd-be'] },
    { ko: '잉글랜드', en: 'England', iso: 'ENG', ring: '#cf142b', body: '#f4f4f4', gk: '#9a9a9a', str: 1.1, crowd: ['crowd-en', 'crowd-wh'] },
    { ko: '독일', en: 'Germany', iso: 'GER', ring: '#111111', body: '#f4f4f4', gk: '#8a8a8a', str: 1.3, crowd: ['crowd-de'] },
    { ko: '프랑스', en: 'France', iso: 'FRA', ring: '#002395', body: '#f4f4f4', gk: '#9a9a9a', str: 1.3, crowd: ['crowd-fr'] },
    { ko: '아르헨티나', en: 'Argentina', iso: 'ARG', ring: '#ffffff', body: '#74acdf', gk: '#3f7fb5', str: 1.35, crowd: ['crowd-ar'] },
    { ko: '브라질', en: 'Brazil', iso: 'BRA', ring: '#009c3b', body: '#ffdf00', gk: '#b89e00', str: 1.35, crowd: ['crowd-br'] }
  ];
  var N = TEAMS.length;            // 상대 수 (8)
  var ROUNDS = N + 1;              // 9팀 돌려막기 = 9라운드, 라운드마다 한 팀이 쉰다. 내가 쉬는 라운드는 마지막(아래 fixtures)
  var GAMES = N;                   // 내 경기 수
  var ME = { ko: 'YOU', en: 'YOU', iso: 'YOU', ring: '#cd2e3a', body: '#0047a0', gk: '#002a60' };   // 대한민국 색

  function fresh(season, stars) {
    var t = [{ id: -1, w: 0, d: 0, l: 0, gf: 0, ga: 0 }], i;
    for (i = 0; i < N; i++) t.push({ id: i, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
    return { day: 0, season: season, table: t, stars: stars, streak: 0, best: 0, last: null };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.table && s.table.length === N + 1 && typeof s.day === 'number' && !('div' in s)) return s;
    } catch (e) {}
    return fresh(1, 0);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  var S = load();

  function team(id) { return id < 0 ? ME : TEAMS[id]; }
  function name(id) { var t = team(id); return EN ? t.en : t.ko; }
  function pts(r) { return r.w * 3 + r.d; }
  function sorted() {
    return S.table.slice().sort(function (a, b) {
      return pts(b) - pts(a) || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || (a.id < 0 ? -1 : b.id < 0 ? 1 : a.id - b.id);
    });
  }
  function placeOf(id) { var o = sorted(), i; for (i = 0; i < o.length; i++) if (o[i].id === id) return i + 1; return N + 1; }

  // 돌려막기(원형법). 자리 0 = 나(고정), 나머지 자리에 상대 0..N-1 과 '쉼'(null)이 돈다.
  // 내 상대 = R[round] 이므로 0..N-1 라운드에 상대를 차례로 만나고, 마지막 라운드가 내 쉬는 날이다.
  function fixtures(round) {
    var R = [], i, rot = [], pairs = [];
    for (i = 0; i < N; i++) R.push(i);
    R.push(null);                                        // 쉼
    var M = R.length;                                    // N+1 (홀수·짝수 상관없이 나까지 M+1 팀)
    for (i = 0; i < M; i++) rot.push(R[(i + round + 1) % M]);
    pairs.push([-1, rot[M - 1]]);
    for (i = 0; i < (M - 1) / 2; i++) pairs.push([rot[i], rot[M - 2 - i]]);
    return pairs;                                        // [a, b] 에 null 이 있으면 그 팀은 쉰다
  }
  function myOpp(round) { return fixtures(round)[0][1]; }

  // 다른 경기 결과. 강도 차이로 골 기대값을 만들고 0~4골.
  function simGoals(str, oppStr) {
    var mean = 1.1 + (str - oppStr) * 1.6, g = 0, k;
    for (k = 0; k < 4; k++) if (Math.random() < Math.max(0.08, Math.min(0.7, mean / 4))) g++;
    return g;
  }
  function apply(a, b, ga, gb) {
    a.gf += ga; a.ga += gb; b.gf += gb; b.ga += ga;
    if (ga > gb) { a.w++; b.l++; } else if (ga < gb) { a.l++; b.w++; } else { a.d++; b.d++; }
  }
  function row(id) { var i; for (i = 0; i < S.table.length; i++) if (S.table[i].id === id) return S.table[i]; }
  function simOthers(round) {
    var fx = fixtures(round), i;
    for (i = 1; i < fx.length; i++) {
      if (fx[i][0] === null || fx[i][1] === null) continue;
      var a = row(fx[i][0]), b = row(fx[i][1]), ta = team(a.id), tb = team(b.id);
      apply(a, b, simGoals(ta.str, tb.str), simGoals(tb.str, ta.str));
    }
  }
  function played() { var r = row(-1); return r.w + r.d + r.l; }

  var L = {
    get state() { return S; },
    GAMES: GAMES,
    opponent: function () { return TEAMS[myOpp(S.day)]; },
    season: function () { return S.season; },
    dayText: function () { return EN ? 'SEASON ' + S.season + ' · DAY ' + (played() + 1) + '/' + GAMES : '시즌 ' + S.season + ' · ' + (played() + 1) + '일차'; },
    seasonText: function () { return EN ? 'SEASON ' + S.season : '시즌 ' + S.season; },
    playedText: function () { return (EN ? 'SEASON ' + S.season : '시즌 ' + S.season) + ' · ' + played() + '/' + GAMES; },
    stars: function () { var s = '', i; for (i = 0; i < Math.min(S.stars, 10); i++) s += '★'; return s; },
    rows: function () {
      return sorted().map(function (r) { var t = team(r.id); return { id: r.id, name: name(r.id), ring: t.ring, body: t.body, w: r.w, d: r.d, l: r.l, gd: r.gf - r.ga, pts: pts(r), me: r.id < 0 }; });
    },
    placeMe: function () { return placeOf(-1); },
    // 내 경기 끝. 순위표 갱신 + 같은 라운드의 다른 경기. 다음이 내가 쉬는 라운드면 그것도 바로 돌린다.
    record: function (h, c) {
      var before = placeOf(-1), me = row(-1), opp = row(myOpp(S.day));
      apply(me, opp, h, c);
      simOthers(S.day);
      if (h > c) { S.streak++; if (S.streak > S.best) S.best = S.streak; } else S.streak = 0;
      S.day++;
      while (S.day < ROUNDS && myOpp(S.day) === null) { simOthers(S.day); S.day++; }
      var over = S.day >= ROUNDS, place = placeOf(-1), outcome = null;
      if (over) outcome = place === 1 ? 'champions' : 'stay';
      S.last = { before: before, after: place, over: over, outcome: outcome };
      save();
      return S.last;
    },
    // 시즌 끝난 뒤 다음 시즌으로.
    nextSeason: function () {
      var o = S.last && S.last.outcome, stars = S.stars + (o === 'champions' ? 1 : 0);
      var n = fresh(S.season + 1, stars); n.best = S.best; S = n; save();
    },
    seasonOver: function () { return S.day >= ROUNDS; },
    reset: function () { S = fresh(1, 0); save(); },
    _set: function (day, stars) { S = fresh(S.season, stars || 0); S.day = day || 0; save(); },   // 시험용
    _fixtures: fixtures,
    TEAMS: TEAMS
  };
  window.FKLeague = L;
})();
