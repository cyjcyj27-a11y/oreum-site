// 1호선 빌런 데이터: 객차 지도 7개, 장비 8, 빌런 15 + 보스 7, 70판, 카드 24
(function () {
  'use strict';
  // 지도 20x12. W 위 벽(창), # 벽, S 문(빌런이 타는 곳), E 연결문(빌런이 나가는 곳), B 좌석, O 노약자석, P 기둥, K 짐,
  // . 바닥(설치 가능), , 바닥(설치 불가: 문 앞·연결 통로)
  var TOPW = '#WWSWWWWWSWWWWWSWWW#', SEAT = '#OO,BBBBB,BBBBB,BBO#';
  var TOP2 = '#WWSWWWSWW#WWSWWWWW#', SEAT2 = '#OO,BBB,BO#OB,BBBBB#';
  var MAPS = [
    { name: '소요산~동두천', g: [TOPW, SEAT,
      '#..................#',
      '#..................#',
      '#.....P......P.....#',
      '#..................E',
      '#..................E',
      '#.....P......P.....#',
      '#..................#',
      '#..................#',
      SEAT, TOPW] },
    { name: '의정부~도봉산', g: [TOPW, SEAT,
      '#..................#',
      '#...KK.............#',
      '#.........P.....P..#',
      '#..................E',
      '#..................E',
      '#.........P.....P..#',
      '#..........KK......#',
      '#..................#',
      SEAT, TOPW] },
    { name: '청량리~종로', g: [TOP2, SEAT2,
      '#.........#........#',
      '#.........#........#',
      '#....P....#....P...#',
      '#.........,........E',
      '#.........,........E',
      '#....P....#....P...#',
      '#.........#........#',
      '#.........#........#',
      SEAT2, TOP2] },
    { name: '서울역', g: [TOPW, SEAT,
      '#..................#',
      '#..K.....K.....K...#',
      '#.....P......P.....#',
      '#..................E',
      '#..................E',
      '#.....P......P.....#',
      '#...K.....K.....K..#',
      '#..................#',
      SEAT, TOPW] },
    { name: '구로~영등포', g: [TOP2, SEAT2,
      '#.........,........#',
      '#.........,........#',
      '#...P.....#.....P..#',
      '#.........#........E',
      '#.........#........E',
      '#...P.....#.....P..#',
      '#.........#........#',
      '#.........#........#',
      SEAT2, TOP2] },
    { name: '수원~병점', night: 1, g: [TOPW, SEAT,
      '#..................#',
      '#....P....P....P...#',
      '#..................#',
      '#..P....P....P.....E',
      '#..................E',
      '#....P....P....P...#',
      '#..................#',
      '#.....P.....P......#',
      SEAT, TOPW] },
    { name: '천안~신창', night: 1, g: [TOP2, SEAT2,
      '#.........,........#',
      '#....P....#....K...#',
      '#.........#........#',
      '#..K......#....P...E',
      '#.........#........E',
      '#....P....#........#',
      '#.........,....K...#',
      '#.........,........#',
      SEAT2, TOP2] }
  ];
  var STATIONS = [
    ['소요산', '동두천', '보산', '동두천중앙', '지행', '덕정', '덕계', '양주', '녹양', '가능'],
    ['의정부', '회룡', '망월사', '도봉산', '도봉', '방학', '창동', '녹천', '월계', '광운대'],
    ['석계', '신이문', '외대앞', '회기', '청량리', '제기동', '신설동', '동묘앞', '동대문', '종로5가', '종로3가', '종각'],
    ['시청', '서울역', '남영', '용산', '노량진', '대방', '신길', '영등포'],
    ['신도림', '구로', '가산디지털단지', '독산', '금천구청', '석수', '관악', '안양', '명학', '금정'],
    ['군포', '당정', '의왕', '성균관대', '화서', '수원', '세류', '병점', '세마', '오산'],
    ['진위', '송탄', '서정리', '평택', '성환', '직산', '두정', '천안', '봉명', '쌍용', '아산', '배방', '온양온천', '신창']
  ];

  // 장비. r 사거리(칸), cd 재사용(초), dmg. st = 열리는 판
  var TOWERS = {
    gongik:   { name: '사회복무요원', cost: 30, r: 2.0, cd: 0.9, dmg: 7, up: [40, 70], st: 1, spr: 'g_gongik' },
    staff:    { name: '역무원', cost: 50, r: 2.6, cd: 0.8, dmg: 14, up: [70, 110], st: 1, spr: 'g_staff' },
    fence:    { name: '안전펜스', cost: 12, r: 0, cd: 0, dmg: 0, hp: 3, up: [20, 30], st: 1 },
    announce: { name: '안내방송', cost: 60, r: 2.6, cd: 0, dmg: 0, slow: 0.4, up: [50, 80], st: 3 },
    guard:    { name: '보안관', cost: 110, r: 1.8, cd: 1.0, dmg: 42, up: [100, 150], st: 6, spr: 'g_guard' },
    cctv:     { name: 'CCTV', cost: 55, r: 3.4, cd: 0, dmg: 0, mark: 0.35, up: [50, 80], st: 13 },
    cleaner:  { name: '청소 여사님', cost: 130, r: 2.4, cd: 1.4, dmg: 17, area: 1.3, up: [110, 160], st: 21, spr: 'g_cleaner' },
    police:   { name: '철도경찰', cost: 170, r: 2.4, cd: 1.3, dmg: 66, boss: 2, up: [140, 200], st: 31, spr: 'g_police' }
  };
  var TORDER = ['gongik', 'staff', 'fence', 'announce', 'guard', 'cctv', 'cleaner', 'police'];

  // 빌런. hp 기세, sp 칸/초, pay 붙잡으면 받는 코인
  var ENEMIES = {
    preacher:  { name: '예수천국 전도사', hp: 48, sp: 0.75, pay: 8, spr: 'v_preacher', aura: 'hush', ar: 1.8 },
    vendor:    { name: '잡상인', hp: 40, sp: 1.0, pay: 8, spr: 'v_vendor', stall: 1 },
    hiker:     { name: '등산객', hp: 34, sp: 1.0, pay: 6, spr: 'v_hikers', hiker: 1 },
    drunk:     { name: '등산복 취객', hp: 44, sp: 0.9, pay: 7, spr: 'v_drunk', zig: 1 },
    spread:    { name: '쩍벌남', hp: 110, sp: 0.6, pay: 14, spr: 'v_spread', wall: 1 },
    trot:      { name: '트로트 할아버지', hp: 50, sp: 0.85, pay: 10, spr: 'v_trot', aura: 'haste', ar: 2.0 },
    sleep:     { name: '드러누운 아저씨', hp: 70, sp: 0.8, pay: 10, spr: 'v_sleep', nap: 1 },
    phone:     { name: '스피커폰 아줌마', hp: 42, sp: 1.0, pay: 8, spr: 'v_phone', aura: 'noise', ar: 2.0 },
    pigeon:    { name: '비둘기', hp: 18, sp: 1.45, pay: 4, spr: 'v_pigeon', fly: 1, bird: 1 },
    chicken:   { name: '치킨 청년', hp: 52, sp: 0.9, pay: 9, spr: 'v_chicken', smell: 1 },
    sashimi:   { name: '회에 소주 아저씨', hp: 60, sp: 0.8, pay: 10, spr: 'v_sashimi', eat: 1, smell: 1 },
    lecture:   { name: '훈계 할아버지', hp: 90, sp: 0.7, pay: 12, spr: 'v_lecture', rage: 1 },
    shirtless: { name: '웃통 아저씨', hp: 55, sp: 1.05, pay: 9, spr: 'v_shirtless', slip: 0.35 },
    bar:       { name: '철봉남', hp: 46, sp: 1.35, pay: 9, spr: 'v_bar', fly: 1 },
    trunk:     { name: '트렁크 팬티 아저씨', hp: 64, sp: 0.85, pay: 10, spr: 'v_trunk', faint: 1 },
    dog:       { name: '강아지 승객', hp: 50, sp: 0.95, pay: 9, spr: 'v_dog', poop: 1, side: 1 },
    // 보스(10판째마다). 놓치면 민원 한도만큼(등산 동호회는 한 명당 2)
    b_hiker:   { name: '등산 동호회', hp: 170, sp: 0.7, pay: 40, spr: 'v_hikers', hiker: 1, boss: 1, group: 4, picnic: 1, bw: 2 },
    b_armor:   { name: '황금 갑옷 장군', hp: 600, sp: 0.55, pay: 120, spr: 'b_armor', boss: 1, smash: 1 },
    b_preacher:{ name: '전도대장', hp: 700, sp: 0.6, pay: 120, spr: 'b_preacher', boss: 1, aura: 'hush', ar: 3.0 },
    b_vendor:  { name: '잡상인 왕', hp: 760, sp: 0.65, pay: 130, spr: 'b_vendor', boss: 1, smash: 1, aura: 'haste', ar: 2.5 },
    b_pigeon:  { name: '비둘기 왕', hp: 520, sp: 0.9, pay: 130, spr: 'b_pigeon', boss: 1, fly: 1, bird: 1, summon: 1 },
    b_danso:   { name: '단소살인마', hp: 650, sp: 1.25, pay: 150, spr: 'b_danso', boss: 1, stun: 1 },
    b_demon:   { name: '1호선 대악마', hp: 1700, sp: 0.6, pay: 300, spr: 'b_demon', boss: 1, smash: 1, demon: 1 }
  };
  var VILLAINS = ['vendor', 'preacher', 'hiker', 'drunk', 'spread', 'trot', 'sleep', 'phone', 'pigeon', 'chicken', 'sashimi', 'lecture', 'shirtless', 'bar', 'trunk', 'dog'];
  var BOSSES = ['b_hiker', 'b_armor', 'b_preacher', 'b_vendor', 'b_pigeon', 'b_danso', 'b_demon'];
  var FIRST = { vendor: 1, preacher: 2, hiker: 3, drunk: 5, spread: 8, trot: 12, sleep: 15, phone: 18, pigeon: 22, chicken: 25, sashimi: 28, lecture: 32, shirtless: 36, bar: 42, trunk: 46, dog: 52 };

  var STAGES = 70;
  function zoneOf(s) { return Math.min(6, Math.floor((s - 1) / 10)); }
  // 70판을 교도관24시의 30일 곡선에 얹는다(그쪽은 봇으로 맞춘 값). 시험 뒤 따로 맞춘다
  function eq(s) { return 1 + (s - 1) * 29 / 69; }
  function rnd(seed) { var a = seed >>> 0; return function () { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }

  // 그 판 물결 목록: [[종류, 수, 간격(초)], ...] 묶음 여러 개
  function waves(s) {
    var r = rnd(s * 7919 + 13), out = [], l = (s - 1) % 10 + 1, d = eq(s);
    var n = l <= 3 ? 4 : l <= 7 ? 5 : 6;
    var pool = VILLAINS.filter(function (k) { return FIRST[k] <= s; });
    var light = pool.filter(function (k) { var e = ENEMIES[k]; return e.hp <= 52 && !e.fly && !e.aura && !e.smell && !e.poop; });
    for (var w = 0; w < n; w++) {
      var grp = [], base = 4 + Math.floor(d * 0.3) + Math.floor(w * 0.7);
      var src = light.length ? light : pool, fill = src[(r() * src.length) | 0];
      grp.push([fill, base, 1.05]);
      pool.forEach(function (k) { if (FIRST[k] === s && w >= 1 && k !== fill) grp.push([k, ENEMIES[k].hp > 80 ? 2 : ENEMIES[k].fly ? 3 : 4, k === 'pigeon' ? 0.5 : 1.3]); });
      var extra = pool.filter(function (k) { return k !== fill && FIRST[k] !== s; });
      var picks = Math.min(extra.length, 1 + Math.floor(d / 12));
      for (var i = 0; i < picks && extra.length; i++) {
        var k = extra.splice(Math.floor(r() * extra.length), 1)[0], e = ENEMIES[k];
        var cnt = e.hp > 80 ? 1 + Math.floor(d / 12) : k === 'pigeon' ? Math.min(6, 3 + Math.floor(d / 10)) : 2 + Math.floor(d / 10);
        grp.push([k, cnt, k === 'pigeon' ? 0.4 : 1.2]);
      }
      if (l === 10 && w === n - 1) grp.push([BOSSES[zoneOf(s)], 1, 0]);
      out.push(grp);
    }
    return out;
  }
  var LATE = 0.06, ZONEHP = [1, 1, 1, 1, 1.05, 1.1, 1.15], HPB = 1, BB = 1, EARLY = 0;
  // 판별 기세 배율: 봇 자동 맞춤(tools/bot.js __bot.tune) 결과를 [판, 배율] 점으로 두고 사이는 잇는다
  var HPK = [[1, 1]];
  // 1~9판은 처음 하는 사람용으로 한 번 더 깎음(1판 x0.6 → 9판 x0.96)
  // 2026-10-09 봇 맞춤(tools/bot.js tune·tuneBoss, 목표 f 0.55→0.90)에 사람 보정(1판 x0.6 → 70판 x0.8)을 곱한 값. 일반 판은 같은 구간 앞뒤 판과 가운데값
  // 2026-10-09 사장님 "난이도가 너무 완만해서 지루하다" → 다시 맞춤. 잘 두는 봇이 이기는 최소 코인 비율(mf)을 1판 0.29·2판 0.35 → 구간 기준 0.48/0.65/0.72/0.78/0.83/0.87/0.91, 구간 안에서 앞판 -0.06 ~ 뒤판 +0.06, 보스판 +0.08 로 오르게 판마다 재고 고침(전에는 1판 0.18, 5~14판 0.41~0.5 로 평평)
  // 같은 날 "아직도 너무 쉬움" → 한 번 더: 1판 0.42·2판 0.5, 구간 기준 0.62/0.74/0.80/0.84/0.87/0.90/0.93, 구간 안 ±0.05, 보스판 +0.05. 37·40판은 배율을 조금만 올려도 봇이 못 이기는 벼랑이라 목표보다 낮게 둠
  // 같은 날 RUN 28 "너무 쉬워"(보안관 11명+코인 499) → 봇이 카드 없이 쟀던 것이 원인(28판: 카드 없이 0.96, 그때까지 모을 카드 27장 들고 0.29). 판마다 그 판까지 모았을 카드(시드 고정 뽑기, 좋은 카드 먼저)를 들고 같은 목표로 다시 맞춤. 보스판은 BBZ 도 같은 배율. 48·58·59·62·66·69·70판은 조금만 올려도 못 이기는 벼랑이라 목표보다 낮음
  var HPT = {"1": 4.9, "2": 3.44, "3": 3.16, "4": 4.44, "5": 4.47, "6": 5.52, "7": 3.85, "8": 3.61, "9": 5.39, "10": 5.16, "11": 7.75, "12": 5.8, "13": 9.88, "14": 11.97, "15": 8.1, "16": 12, "17": 12.07, "18": 9.11, "19": 13.19, "20": 11.63, "21": 16.75, "22": 16.87, "23": 18.28, "24": 17.23, "25": 11.86, "26": 17.76, "27": 18.84, "28": 13.34, "29": 16.82, "30": 11.96, "31": 16.55, "32": 12.45, "33": 16.99, "34": 19, "35": 18.15, "36": 12.19, "37": 14.62, "38": 21.25, "39": 16.22, "40": 17.95, "41": 20.72, "42": 14.86, "43": 18.08, "44": 16.55, "45": 23.52, "46": 9.77, "47": 12.48, "48": 5.8, "49": 12.59, "50": 11.22, "51": 15.08, "52": 14.11, "53": 19.54, "54": 15.49, "55": 18, "56": 19.22, "57": 13.14, "58": 9.4, "59": 11.5, "60": 15.4, "61": 13.9, "62": 13.55, "63": 20, "64": 16.82, "65": 16.36, "66": 13.65, "67": 21.51, "68": 16.57, "69": 10.55, "70": 11};
  var BBZ = [0.94, 7.02, 3.64, 3.21, 11.41, 5.54, 3.2];
  function kAt(s) { var k = (window.L1_DATA ? window.L1_DATA.HPK : HPK); if (s <= k[0][0]) return k[0][1]; for (var i = 1; i < k.length; i++) if (s <= k[i][0]) { var a = k[i - 1], b = k[i]; return a[1] + (b[1] - a[1]) * (s - a[0]) / (b[0] - a[0]); } return k[k.length - 1][1]; }
  function hpMul(s) { var d = eq(s), Dd = window.L1_DATA; return (1 + (d - 1) * 0.08 + Math.max(0, d - 15) * (Dd ? Dd.LATE : LATE)) * (Dd ? Dd.ZONEHP : ZONEHP)[zoneOf(s)] * (Dd ? Dd.HPB : HPB) * (1 + (Dd ? Dd.EARLY : EARLY) * Math.max(0, 1 - (s - 1) / 30)) * (Dd && Dd.HPT && Dd.HPT[s] ? Dd.HPT[s] : kAt(s)); }
  var KZ = 0.15;
  function bossMul(s) { return (1 + (eq(s) - 1) * 0.08) * (1 + zoneOf(s) * (window.L1_DATA ? window.L1_DATA.KZ : KZ)) * (window.L1_DATA ? window.L1_DATA.BB * window.L1_DATA.BBZ[zoneOf(s)] : BB); }
  function startCoins(s) { return Math.round(260 + eq(s) * 32); }
  var RANKS = ['순경', '경장', '경사', '경위', '경감', '경정', '총경'];

  // 카드: 판을 깨면 셋 중 하나. g 금테. max 겹치는 수
  var CARDS = [
    { id: 'coin', name: '출근 수당', v: '시작 코인 +40', max: 5 },
    { id: 'staff', name: '호루라기 교체', v: '역무원 +12%', max: 4 },
    { id: 'gongik', name: '공익 간식', v: '사회복무요원 +15%', max: 4 },
    { id: 'guard', name: '무술 단련', v: '보안관 +12%', max: 4 },
    { id: 'fence', name: '튼튼한 펜스', v: '펜스 체력 +1', max: 3 },
    { id: 'range', name: '확성기', v: '사거리 +6%', max: 3 },
    { id: 'rate', name: '믹스커피', v: '공격 속도 +6%', max: 4 },
    { id: 'refund', name: '정산 서류', v: '판매 +10%', max: 2 },
    { id: 'stop', name: '정차 수당', v: '정차 +10 코인', max: 4 },
    { id: 'slow', name: '또렷한 방송', v: '안내방송 감속 +8%', max: 3 },
    { id: 'cctv', name: '고화질 CCTV', v: 'CCTV 표식 +10%', max: 3 },
    { id: 'mop', name: '새 대걸레', v: '청소 범위 +10%', max: 3 },
    { id: 'police', name: '철도경찰 지원', v: '철도경찰 +12%', max: 3 },
    { id: 'upg', name: '예산 절감', v: '업그레이드 -8%', max: 3 },
    { id: 'cheap', name: '공익 충원', v: '사회복무요원 -5 코인', max: 2 },
    { id: 'catch', name: '검거 포상', v: '검거 코인 +10%', max: 3 },
    { id: 'life', name: '민원 담당관', v: '민원 한도 +1', max: 1, g: 1 },
    { id: 'bonus', name: '특별 상여금', v: '시작 코인 +150', max: 2, g: 1 },
    { id: 'boss', name: '보스 전담반', v: '보스에게 +25%', max: 2, g: 1 },
    { id: 'all', name: '사기 충천', v: '모든 공격 +15%', max: 2, g: 1 },
    { id: 'free', name: '펜스 지원', v: '안전펜스 공짜', max: 1, g: 1 },
    { id: 'crit', name: '결정적 한 방', v: '10% 두 배 공격', max: 2, g: 1 },
    { id: 'vet', name: '베테랑', v: '처음 업그레이드 공짜', max: 1, g: 1 },
    { id: 'night', name: '야간 수당', v: '정차 +30 코인', max: 1, g: 1 }
  ];
  var LIVES = 5;
  try { window.L1_LANG = /[?&]lang=en(&|$)/.test(location.search) ? 'en' : 'ko'; } catch (e) { window.L1_LANG = 'ko'; }
  var EN = {
    '1호선 빌런': 'LINE 1 VILLAINS', '가로로 보기': 'LANDSCAPE', '민원': 'Complaint', '검거': 'Caught', '도감': 'BOOK', '노선도': 'ROUTE', '카드': 'CARDS', '빌런': 'VILLAINS',
    '소요산~동두천': 'Soyosan~Dongducheon', '의정부~도봉산': 'Uijeongbu~Dobongsan', '청량리~종로': 'Cheongnyangni~Jongno', '서울역': 'Seoul Station', '구로~영등포': 'Guro~Yeongdeungpo', '수원~병점': 'Suwon~Byeongjeom', '천안~신창': 'Cheonan~Sinchang',
    '사회복무요원': 'Social Worker', '역무원': 'Station Staff', '안전펜스': 'Barrier', '안내방송': 'Announcer', '보안관': 'Security', '청소 여사님': 'Cleaner', '철도경찰': 'Rail Police',
    '예수천국 전도사': 'Street Preacher', '잡상인': 'Peddler', '등산객': 'Hiker', '등산복 취객': 'Drunk Hiker', '쩍벌남': 'Manspreader', '트로트 할아버지': 'Trot Grandpa', '드러누운 아저씨': 'Seat Sleeper', '스피커폰 아줌마': 'Speakerphone Auntie', '비둘기': 'Pigeon', '치킨 청년': 'Chicken Guy', '회에 소주 아저씨': 'Sashimi & Soju', '훈계 할아버지': 'Lecturing Grandpa', '웃통 아저씨': 'Shirtless Uncle', '철봉남': 'Pull-up Guy', '트렁크 팬티 아저씨': 'Boxer Shorts Uncle', '강아지 승객': 'Dog Walker',
    '등산 동호회': 'Hiking Club', '황금 갑옷 장군': 'Golden General', '전도대장': 'Preacher Boss', '잡상인 왕': 'Peddler King', '비둘기 왕': 'Pigeon King', '단소살인마': 'Danso Slayer', '1호선 대악마': 'Line 1 Archfiend',
    '순경': 'Officer', '경장': 'Sr. Officer', '경사': 'Sergeant', '경위': 'Lieutenant', '경감': 'Captain', '경정': 'Major', '총경': 'Chief',
    '출근 수당': 'Commute Pay', '호루라기 교체': 'New Whistle', '공익 간식': 'Snack Run', '무술 단련': 'Martial Arts', '튼튼한 펜스': 'Sturdy Barrier', '확성기': 'Megaphone', '믹스커피': 'Instant Coffee', '정산 서류': 'Paperwork', '정차 수당': 'Stop Pay', '또렷한 방송': 'Clear Voice', '고화질 CCTV': 'HD CCTV', '새 대걸레': 'New Mop', '철도경찰 지원': 'Police Backup', '예산 절감': 'Budget Cut', '공익 충원': 'More Workers', '검거 포상': 'Arrest Bonus', '민원 담당관': 'Complaint Desk', '특별 상여금': 'Special Bonus', '보스 전담반': 'Boss Squad', '사기 충천': 'High Morale', '펜스 지원': 'Free Barriers', '결정적 한 방': 'Critical Hit', '베테랑': 'Veteran', '야간 수당': 'Night Pay',
    '시작 코인 +40': 'Start coins +40', '역무원 +12%': 'Staff +12%', '사회복무요원 +15%': 'Worker +15%', '보안관 +12%': 'Security +12%', '펜스 체력 +1': 'Barrier HP +1', '사거리 +6%': 'Range +6%', '공격 속도 +6%': 'Attack speed +6%', '판매 +10%': 'Sell +10%', '정차 +10 코인': 'Stop +10 coins', '안내방송 감속 +8%': 'Announcer slow +8%', 'CCTV 표식 +10%': 'CCTV mark +10%', '청소 범위 +10%': 'Mop area +10%', '철도경찰 +12%': 'Rail Police +12%', '업그레이드 -8%': 'Upgrade -8%', '사회복무요원 -5 코인': 'Worker -5 coins', '검거 코인 +10%': 'Catch coins +10%', '민원 한도 +1': 'Complaint limit +1', '시작 코인 +150': 'Start coins +150', '보스에게 +25%': 'vs Boss +25%', '모든 공격 +15%': 'All attacks +15%', '안전펜스 공짜': 'Free barriers', '10% 두 배 공격': '10% double hit', '처음 업그레이드 공짜': 'First upgrade free', '정차 +30 코인': 'Stop +30 coins',
    '70판 근무 완료': '70 runs on duty'
  };
  var ENST = { '소요산': 'Soyosan', '동두천': 'Dongducheon', '보산': 'Bosan', '동두천중앙': 'Dongducheon Jungang', '지행': 'Jihaeng', '덕정': 'Deokjeong', '덕계': 'Deokgye', '양주': 'Yangju', '녹양': 'Nogyang', '가능': 'Ganeung', '의정부': 'Uijeongbu', '회룡': 'Hoeryong', '망월사': 'Mangwolsa', '도봉산': 'Dobongsan', '도봉': 'Dobong', '방학': 'Banghak', '창동': 'Chang-dong', '녹천': 'Nokcheon', '월계': 'Wolgye', '광운대': 'Kwangwoon Univ.', '석계': 'Seokgye', '신이문': 'Sinimun', '외대앞': 'HUFS', '회기': 'Hoegi', '청량리': 'Cheongnyangni', '제기동': 'Jegi-dong', '신설동': 'Sinseol-dong', '동묘앞': 'Dongmyo', '동대문': 'Dongdaemun', '종로5가': 'Jongno 5-ga', '종로3가': 'Jongno 3-ga', '종각': 'Jonggak', '시청': 'City Hall', '남영': 'Namyeong', '용산': 'Yongsan', '노량진': 'Noryangjin', '대방': 'Daebang', '신길': 'Singil', '영등포': 'Yeongdeungpo', '신도림': 'Sindorim', '구로': 'Guro', '가산디지털단지': 'Gasan Digital', '독산': 'Doksan', '금천구청': 'Geumcheon-gu Office', '석수': 'Seoksu', '관악': 'Gwanak', '안양': 'Anyang', '명학': 'Myeonghak', '금정': 'Geumjeong', '군포': 'Gunpo', '당정': 'Dangjeong', '의왕': 'Uiwang', '성균관대': 'Sungkyunkwan Univ.', '화서': 'Hwaseo', '수원': 'Suwon', '세류': 'Seryu', '병점': 'Byeongjeom', '세마': 'Sema', '오산': 'Osan', '진위': 'Jinwi', '송탄': 'Songtan', '서정리': 'Seojeong-ri', '평택': 'Pyeongtaek', '성환': 'Seonghwan', '직산': 'Jiksan', '두정': 'Dujeong', '천안': 'Cheonan', '봉명': 'Bongmyeong', '쌍용': 'Ssangyong', '아산': 'Asan', '배방': 'Baebang', '온양온천': 'Onyang Oncheon', '신창': 'Sinchang' };
  function L(s) { return window.L1_LANG === 'en' ? (EN[s] || ENST[s] || s) : s; }
  window.L1_DATA = { LIVES: LIVES, L: L, HPB: HPB, BB: BB, EARLY: EARLY, HPK: HPK, BBZ: BBZ, HPT: HPT, LATE: LATE, ZONEHP: ZONEHP, KZ: KZ, MAPS: MAPS, STATIONS: STATIONS, TOWERS: TOWERS, TORDER: TORDER, ENEMIES: ENEMIES, VILLAINS: VILLAINS, BOSSES: BOSSES, FIRST: FIRST, STAGES: STAGES, CARDS: CARDS, RANKS: RANKS, zoneOf: zoneOf, eq: eq, waves: waves, hpMul: hpMul, bossMul: bossMul, startCoins: startCoins, rnd: rnd };
})();
