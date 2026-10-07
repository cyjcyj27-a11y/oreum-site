// 교도관24시 데이터: 구역 지도 5개, 장비, 수감자, 하루 일정
(function () {
  'use strict';
  // 지도 20x12. # 벽, b 철창(벽), T 막힌 물건(식탁·기계·화단), . 바닥(설치 가능), , 바닥(설치 불가), S 감방 문(나오는 곳), E 담 틈(나가는 곳)
  var MAPS = [
    { name: '1동 감방', theme: 0, g: [
      '####################',
      '#bSbbSbbSbbSb......#',
      '#..................#',
      '#..................#',
      '#........##........#',
      '#........##........E',
      '#........##........E',
      '#........##........#',
      '#..................#',
      '#..................#',
      '#bSbbSbbSbbSb......#',
      '####################'] },
    { name: '식당', theme: 1, g: [
      '####################',
      '#S.................#',
      '#..TTTT....TTTT....#',
      '#..................#',
      '#..TTTT....TTTT....#',
      'S..................E',
      'S..................E',
      '#..TTTT....TTTT....#',
      '#..................#',
      '#..TTTT....TTTT....#',
      '#S.................#',
      '####################'] },
    { name: '운동장', theme: 2, g: [
      '####SS##############',
      '#..................#',
      '#...T..........T...#',
      '#..................#',
      '#.......####.......#',
      '#.......#,,#.......E',
      '#.......#,,#.......E',
      '#.......####.......#',
      '#..................#',
      '#...T..........T...#',
      '#..................#',
      '##########EE########'] },
    { name: '작업장', theme: 3, g: [
      '####################',
      'S..TT....TT....TT..#',
      'S..TT....TT....TT..#',
      '#..................#',
      '#......TTTTTT......#',
      '#..................E',
      '#..................E',
      '#......TTTTTT......#',
      '#..................#',
      'S..TT....TT....TT..#',
      'S..TT....TT....TT..#',
      '####################'] },
    { name: '정문', theme: 4, g: [
      '###SS###############',
      '#..................#',
      '#..##........##....#',
      '#..##........##....#',
      'S..................#',
      'S..........##......E',
      'S..........##......E',
      'S..................#',
      '#..##........##....#',
      '#..##........##....#',
      '#..................#',
      '###SS###############'] }
  ];

  // 장비. r 사거리(칸), cd 재사용(초), dmg, lv 별 값은 배수로
  var TOWERS = {
    guard: { name: '교도관', cost: 50, r: 2.6, cd: 0.75, dmg: 14, up: [70, 110], day: 1 },
    door:  { name: '철문', cost: 12, r: 0, cd: 0, dmg: 0, hp: 3, up: [20, 30], day: 1 },
    dog:   { name: '경비견', cost: 85, r: 3.0, cd: 1.15, dmg: 7, slow: 0.45, up: [80, 120], day: 2 },
    cctv:  { name: 'CCTV', cost: 55, r: 3.6, cd: 0, dmg: 0, up: [50, 80], day: 3 },
    light: { name: '탐조등', cost: 60, r: 3.6, cd: 0, dmg: 0, up: [50, 80], day: 4 },
    riot:  { name: '진압조', cost: 140, r: 2.5, cd: 1.7, dmg: 13, area: 1.2, up: [120, 170], day: 7 }
  };
  var TORDER = ['guard', 'door', 'dog', 'cctv', 'light', 'riot'];

  // 수감자. hp 기세, sp 칸/초, pay 붙잡으면 받는 코인
  var ENEMIES = {
    normal: { hp: 34, sp: 1.0, pay: 6, spr: 'p_normal' },
    fast:   { hp: 22, sp: 1.6, pay: 6, spr: 'p_fast' },
    big:    { hp: 105, sp: 0.62, pay: 14, spr: 'p_big', smash: 1 },
    tunnel: { hp: 46, sp: 0.85, pay: 9, spr: 'p_tunnel', under: 1 },
    spy:    { hp: 40, sp: 1.05, pay: 9, spr: 'p_spy', hidden: 1 },
    riot:   { hp: 42, sp: 1.1, pay: 6, spr: 'p_riot' },
    king:   { hp: 520, sp: 0.72, pay: 120, spr: 'p_king', smash: 1, boss: 1 }
  };
  var FIRST = { normal: 1, fast: 2, big: 3, tunnel: 4, spy: 5, king: 6, riot: 8 };

  // 하루 시간대. 3일째까지는 주간 근무(22시 없음)
  var SLOTS = ['06:00', '09:00', '12:00', '15:00', '18:00', '22:00'];

  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // 그날 물결 목록: [[종류, 수, 간격(초)], ...] 묶음 여러 개
  function waves(day) {
    var r = rnd(day * 7919 + 13), out = [], n = day <= 3 ? 5 : 6;
    var pool = Object.keys(FIRST).filter(function (k) { return k !== 'king' && FIRST[k] <= day; });
    for (var w = 0; w < n; w++) {
      var grp = [], base = 4 + Math.floor(day * 0.3) + Math.floor(w * 0.7);
      grp.push(['normal', base, 1.05]);
      var extra = pool.filter(function (k) { return k !== 'normal'; });
      // 처음 나오는 날엔 그 녀석이 꼭 나온다
      extra.forEach(function (k) {
        if (FIRST[k] === day && w >= 1) grp.push([k, k === 'big' ? 2 : 4, 1.3]);
      });
      var picks = Math.min(extra.length, 1 + Math.floor(day / 12));
      var bag = extra.slice();
      for (var i = 0; i < picks && bag.length; i++) {
        var k = bag.splice(Math.floor(r() * bag.length), 1)[0];
        // 폭동꾼은 0.45초 간격 떼라 6명부터는 교도관 수갑으로 못 막는다(24일 아침 벽, 2026-10-07) → 5명까지
        var cnt = k === 'big' ? 1 + Math.floor(day / 12) : k === 'riot' ? Math.min(5, 3 + Math.floor(day / 8)) : 2 + Math.floor(day / 10);
        grp.push([k, cnt, k === 'riot' ? 0.45 : 1.2]);
      }
      if (n === 6 && w === 5 && day % 6 === 0) grp.push(['king', 1, 0]);
      out.push(grp);
    }
    return out;
  }
  // 수감자 기세. 15일까지 하루 8%, 16일부터 LATE 만큼 더(2026-10-07 사장님 "18일 깨고 나니 그다음부터 급속도로 쉬워졌어" → 후반 기울기 손잡이)
  var LATE = 0.06;   // 0.035 → 0.06 (2026-10-07): 16일부터 하루 +14%. 수감자가 늘면 잡는 코인도 늘어 상쇄되므로 수가 아니라 기세로 올린다
  // 구역별 보정: 정문(25~30일)은 문 여섯이 출구 하나로 모여 길목 하나로 다 막혀 쉬웠다 → 기세 가산
  var ZONEHP = [1, 1, 1, 1, 1.15];
  function hpMul(day) { var z = Math.min(4, Math.floor((day - 1) / 6)), Dd = window.GY_DATA; return (1 + (day - 1) * 0.08 + Math.max(0, day - 15) * (Dd ? Dd.LATE : LATE)) * (Dd ? Dd.ZONEHP : ZONEHP)[z]; }
  // 탈옥왕 기세 배수(2026-10-07). 전엔 hpMul × (1+구역×0.25) 라 6일마다 1.5배씩 뛰어 18일부터 벽이 됐다(코인은 1.2배씩만 는다).
  // 하루 8% 는 수감자와 같이 가고, 구역 가산만 KZ 로 줄였다. 6일 728 은 그대로.
  var KZ = 0.15, KSMOKE = 1.2;   // 연막 도주도 2.4초→1.2초(18일 벽)
  function kingMul(day) { var z = Math.min(4, Math.floor((day - 1) / 6)); return (1 + (day - 1) * 0.08) * (1 + z * (window.GY_DATA ? window.GY_DATA.KZ : KZ)); }
  var RANKS = ['교도', '교사', '교위', '교감', '교정'];

  var LIVES = 5;
  // 영문판: 주소에 ?lang=en 일 때만(기억·폰 언어 안 봄)
  try { window.GY_LANG = /[?&]lang=en(&|$)/.test(location.search) ? 'en' : 'ko'; } catch (e) { window.GY_LANG = 'ko'; }
  var EN = {
    '1동 감방': 'Cell Block 1', '식당': 'Mess Hall', '운동장': 'Yard', '작업장': 'Workshop', '정문': 'Main Gate',
    '교도관': 'Guard', '철문': 'Iron Door', '경비견': 'K9 Dog', 'CCTV': 'CCTV', '탐조등': 'Searchlight', '진압조': 'Riot Squad',
    '교도': 'Officer', '교사': 'Sr. Officer', '교위': 'Sergeant', '교감': 'Lieutenant', '교정': 'Captain',
    '수감자': 'Inmate', '날쌘돌이': 'Sprinter', '덩치': 'Brute', '땅굴꾼': 'Digger', '변장범': 'Impostor', '폭동꾼': 'Rioter', '탈옥왕': 'Escape King',
    '근무표': 'ROSTER', '검거': 'Caught', '탈옥': 'Escaped', '30일 근무 완료': '30 days on duty', '교도관24시': 'PRISON GUARD 24', '가로로 보기': 'LANDSCAPE'
  };
  function L(s) { return window.GY_LANG === 'en' ? (EN[s] || s) : s; }
  window.GY_DATA = { LIVES: LIVES, L: L, LATE: LATE, ZONEHP: ZONEHP, kingMul: kingMul, KZ: KZ, KSMOKE: KSMOKE, MAPS: MAPS, TOWERS: TOWERS, TORDER: TORDER, ENEMIES: ENEMIES, FIRST: FIRST, SLOTS: SLOTS, waves: waves, hpMul: hpMul, RANKS: RANKS, DAYS: 30 };
})();