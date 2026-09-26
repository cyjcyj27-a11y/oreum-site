/* 방귀라이크 — 수치표. 음식(강화)·합체·적·보스·스테이지·상점
 * window.DATA
 */
(function () {
  'use strict';
  var D = {};

  // ── 음식: 레벨업 때 셋 중 하나를 먹는다. lv 는 1~max
  D.FOODS = [
    { id: 'goguma', name: '고구마', max: 5, stat: function (l) { return '가스 충전 +22%'; } },
    { id: 'cabbage', name: '양배추', max: 5, stat: function (l) { return '뿡 연사 +12% · 피해 +4'; } },
    { id: 'chung', name: '청국장', max: 5, stat: function (l) { return '구름 지속 +35% · 크기 +10%'; } },
    { id: 'cola', name: '콜라', max: 5, stat: function (l) { return l === 1 ? '방귀 대시' : '대시 거리 +30 · 피해 +20%'; } },
    { id: 'milk', name: '우유', max: 5, stat: function (l) { return '큰 방귀 피해 +25%'; } },
    { id: 'buldak', name: '불닭', max: 5, stat: function (l) { return '이동 속도 +5% · 가스 충전 +8%'; } },
    { id: 'egg', name: '계란', max: 5, stat: function (l) { return '독 냄새 +6/초'; } },
    { id: 'beondegi', name: '번데기', max: 5, stat: function (l) { return '최대 체력 +15 · 회복 +0.3/초'; } },
    { id: 'kimchi', name: '김치', max: 5, stat: function (l) { return '밀쳐내기 +30% · 범위 +6%'; } },
    { id: 'garlic', name: '마늘', max: 5, stat: function (l) { return l === 1 ? '마늘 오라' : '오라 피해 +5 · 범위 +8'; } },
    { id: 'soda', name: '탄산수', max: 5, stat: function (l) { return '모으기 속도 +22%'; } },
    { id: 'mentos', name: '멘토스', max: 5, stat: function (l) { return '연쇄 폭발 +1'; } },
    { id: 'cereal', name: '시리얼', max: 5, stat: function (l) { return '줍기 범위 +30%'; } },
    { id: 'lighter', name: '라이터', max: 1, stat: function (l) { return '뿡에 불씨'; } }
  ];
  D.FOOD = {}; D.FOODS.forEach(function (f) { D.FOOD[f.id] = f; });

  // ── 합체(진화): 음식 Lv5 + 짝 → 도시락·레벨업에서 금빛 카드로 나온다
  D.EVOS = [
    { id: 'rocket', name: '로켓 방귀', a: 'cola', b: 'mentos', stat: '방귀 로켓 돌진' },
    { id: 'fire', name: '불방귀', a: 'buldak', b: 'lighter', stat: '불꽃 고리 · 불 뿡' },
    { id: 'cerealbomb', name: '시리얼 폭탄', a: 'milk', b: 'cereal', stat: '시리얼 파편 12발' },
    { id: 'hellcloud', name: '지옥 구름', a: 'chung', b: 'egg', stat: '따라가는 독구름' },
    { id: 'spicyaura', name: '매운 오라', a: 'garlic', b: 'kimchi', stat: '오라 1.6배 · 밀쳐내기' },
    { id: 'machinegun', name: '연발 방귀', a: 'cabbage', b: 'goguma', stat: '뿡 3연발 조준' }
  ];
  D.EVO = {}; D.EVOS.forEach(function (e) { D.EVO[e.id] = e; });
  D.SLOTS = 8;

  // ── 적. hp·dmg 는 스테이지 1 첫 분 기준
  // beh: chase 쫓기 · swarm 지그재그 떼 · dash 돌진 · tank 느리고 단단 · roll 굴러 튕기기 · float 풍선 · ranged 물총 · spray 방향제
  D.ENEMIES = {
    mosquito: { name: '모기', hp: 5, spd: 92, dmg: 3, xp: 1, r: 10, sc: 1, beh: 'swarm', kb: 1.3, fly: 1 },
    pigeon: { name: '비둘기', hp: 14, spd: 56, dmg: 5, xp: 2, r: 14, sc: 1, beh: 'chase', kb: 1 },
    puppy: { name: '강아지', hp: 22, spd: 66, dmg: 6, xp: 3, r: 13, sc: 1, beh: 'dash', kb: 1 },
    ajumma: { name: '잔소리 아줌마', hp: 70, spd: 36, dmg: 10, xp: 6, r: 18, sc: 1, beh: 'tank', kb: 0.5 },
    janitor: { name: '방독면 청소부', hp: 42, spd: 48, dmg: 8, xp: 5, r: 16, sc: 1, beh: 'chase', kb: 0.8, immune: 1, blastMul: 1.7 },
    sheep: { name: '양머리 아저씨', hp: 55, spd: 42, dmg: 8, xp: 5, r: 18, sc: 1, beh: 'chase', kb: 0.6 },
    egg: { name: '맥반석 계란', hp: 16, spd: 96, dmg: 5, xp: 2, r: 11, sc: 1, beh: 'roll', kb: 1.2 },
    balloon: { name: '풍선', hp: 15, spd: 52, dmg: 5, xp: 2, r: 13, sc: 1, beh: 'float', kb: 1.4, fly: 1, split: 1 },
    gunkid: { name: '물총 소년', hp: 30, spd: 54, dmg: 5, xp: 4, r: 13, sc: 1, beh: 'ranged', kb: 1 },
    mascot: { name: '곰돌이 인형탈', hp: 120, spd: 33, dmg: 11, xp: 12, r: 24, sc: 1, beh: 'tank', kb: 0.35 },
    robot: { name: '방향제 로봇', hp: 60, spd: 45, dmg: 9, xp: 7, r: 16, sc: 1, beh: 'spray', kb: 0.7 },
    skunk: { name: '새끼 스컹크', hp: 26, spd: 78, dmg: 6, xp: 3, r: 13, sc: 1, beh: 'chase', kb: 1, stinky: 1 }
  };
  D.ENEMY_ORDER = ['mosquito', 'pigeon', 'puppy', 'ajumma', 'janitor', 'sheep', 'egg', 'balloon', 'gunkid', 'mascot', 'robot', 'skunk'];

  D.BOSSES = {
    kingpigeon: { name: '왕비둘기', hp: 2000, spd: 52, dmg: 14, r: 42, xp: 60 },
    maskboss: { name: '방독면 반장', hp: 3000, spd: 50, dmg: 16, r: 40, xp: 80, immune: 1, blastMul: 1.5 },
    kingegg: { name: '맥반석 왕계란', hp: 4600, spd: 170, dmg: 16, r: 48, xp: 100 },
    bearboss: { name: '곰돌이 대장', hp: 7000, spd: 36, dmg: 20, r: 52, xp: 130 },
    skunkking: { name: '스컹크 대왕', hp: 11000, spd: 60, dmg: 22, r: 50, xp: 200 }
  };
  D.BOSS_ORDER = ['kingpigeon', 'maskboss', 'kingegg', 'bearboss', 'skunkking'];

  // ── 스테이지: 분(0~8) 마다 나오는 적 무리. rate = 초당 몇 마리, max = 한 화면 최대
  // bands[i] = 그 분에 [적, 가중치] 목록
  D.BOSS_T = 480;           // 8:00 에 보스
  D.STAGES = [
    { id: 'school', name: '학교 운동장', boss: 'kingpigeon', hp: 1, dmg: 1,
      rate: [0.8, 1.15, 1.45, 1.75, 2.05, 2.35, 2.65, 2.95, 1.2], max: [45, 65, 85, 105, 125, 145, 165, 185, 90],
      bands: [[['mosquito', 3], ['pigeon', 1]], [['mosquito', 2], ['pigeon', 2]], [['mosquito', 2], ['pigeon', 2], ['puppy', 1]], [['mosquito', 2], ['pigeon', 2], ['puppy', 2]],
        [['mosquito', 2], ['pigeon', 3], ['puppy', 2]], [['mosquito', 3], ['pigeon', 2], ['puppy', 3]], [['mosquito', 3], ['pigeon', 3], ['puppy', 3]], [['mosquito', 3], ['pigeon', 3], ['puppy', 4]], [['pigeon', 2], ['mosquito', 2]]],
      events: [[90, 'swarm', 'mosquito', 22], [150, 'elite', 'puppy'], [210, 'ring', 'pigeon', 20], [300, 'swarm', 'mosquito', 30], [330, 'elite', 'pigeon'], [390, 'ring', 'puppy', 22]] },
    { id: 'subway', name: '지하철', boss: 'maskboss', hp: 1.25, dmg: 1.1,
      rate: [1.0, 1.4, 1.8, 2.2, 2.6, 3.0, 3.3, 3.6, 1.4], max: [50, 70, 90, 110, 130, 150, 170, 190, 90],
      bands: [[['mosquito', 3], ['pigeon', 2]], [['pigeon', 2], ['ajumma', 1], ['mosquito', 2]], [['pigeon', 2], ['ajumma', 1], ['janitor', 1]], [['ajumma', 2], ['janitor', 2], ['mosquito', 2]],
        [['janitor', 2], ['ajumma', 2], ['pigeon', 2]], [['janitor', 3], ['ajumma', 2], ['mosquito', 3]], [['janitor', 3], ['ajumma', 3], ['pigeon', 2]], [['janitor', 3], ['ajumma', 3], ['mosquito', 3]], [['janitor', 2], ['mosquito', 2]]],
      events: [[80, 'swarm', 'mosquito', 26], [150, 'elite', 'ajumma'], [220, 'ring', 'janitor', 16], [300, 'swarm', 'pigeon', 24], [330, 'elite', 'janitor'], [400, 'ring', 'ajumma', 18]] },
    { id: 'sauna', name: '찜질방', boss: 'kingegg', hp: 1.45, dmg: 1.15,
      rate: [1.0, 1.45, 1.9, 2.3, 2.7, 3.1, 3.5, 3.9, 1.5], max: [55, 75, 95, 115, 135, 155, 175, 195, 95],
      bands: [[['egg', 3], ['sheep', 1]], [['egg', 3], ['sheep', 2]], [['egg', 2], ['sheep', 2], ['ajumma', 1]], [['sheep', 2], ['ajumma', 2], ['egg', 3]],
        [['sheep', 3], ['egg', 3], ['mosquito', 2]], [['sheep', 3], ['ajumma', 2], ['egg', 3]], [['sheep', 3], ['ajumma', 3], ['egg', 4]], [['sheep', 3], ['ajumma', 3], ['egg', 4], ['janitor', 1]], [['egg', 3], ['sheep', 1]]],
      events: [[80, 'swarm', 'egg', 24], [150, 'elite', 'sheep'], [220, 'ring', 'sheep', 18], [300, 'swarm', 'egg', 34], [330, 'elite', 'ajumma'], [400, 'ring', 'egg', 26]] },
    { id: 'park', name: '놀이공원', boss: 'bearboss', hp: 1.7, dmg: 1.25,
      rate: [1.1, 1.5, 2.0, 2.4, 2.8, 3.2, 3.6, 4.0, 1.6], max: [60, 80, 100, 120, 140, 160, 180, 200, 100],
      bands: [[['balloon', 3], ['puppy', 1]], [['balloon', 3], ['gunkid', 1], ['puppy', 1]], [['balloon', 3], ['gunkid', 2], ['puppy', 2]], [['balloon', 3], ['gunkid', 2], ['mascot', 1], ['puppy', 2]],
        [['balloon', 3], ['gunkid', 2], ['mascot', 2]], [['balloon', 3], ['gunkid', 3], ['mascot', 2], ['pigeon', 2]], [['balloon', 4], ['gunkid', 3], ['mascot', 2], ['puppy', 2]], [['balloon', 4], ['gunkid', 3], ['mascot', 3]], [['balloon', 3], ['gunkid', 1]]],
      events: [[80, 'swarm', 'balloon', 24], [150, 'elite', 'mascot'], [220, 'ring', 'puppy', 24], [300, 'swarm', 'balloon', 34], [330, 'elite', 'gunkid'], [400, 'ring', 'mascot', 12]] },
    { id: 'lab', name: '방향제 공장', boss: 'skunkking', hp: 2.0, dmg: 1.35,
      rate: [1.1, 1.6, 2.1, 2.6, 3.0, 3.4, 3.9, 4.3, 1.8], max: [65, 85, 105, 130, 150, 175, 200, 220, 110],
      bands: [[['skunk', 2], ['mosquito', 2]], [['skunk', 3], ['robot', 1], ['mosquito', 2]], [['skunk', 2], ['robot', 2], ['janitor', 2]], [['skunk', 3], ['robot', 2], ['janitor', 2]],
        [['skunk', 3], ['robot', 2], ['janitor', 2], ['mascot', 1]], [['skunk', 3], ['robot', 3], ['mascot', 2], ['gunkid', 2]], [['skunk', 4], ['robot', 3], ['janitor', 3], ['mascot', 2]], [['skunk', 4], ['robot', 4], ['janitor', 3], ['mascot', 2]], [['skunk', 3], ['robot', 1]]],
      events: [[80, 'swarm', 'skunk', 24], [150, 'elite', 'robot'], [220, 'ring', 'janitor', 20], [300, 'swarm', 'mosquito', 40], [330, 'elite', 'mascot'], [400, 'ring', 'skunk', 28]] }
  ];

  // ── 상점 (영구 강화). cost[lv] = 다음 레벨 값
  D.SHOP = [
    { id: 'hp', name: '체력', icon: 'hp', max: 5, cost: [60, 110, 180, 280, 420], stat: '최대 체력 +12' },
    { id: 'belly', name: '배짱', icon: 'belly', max: 5, cost: [70, 130, 210, 320, 480], stat: '가스 충전 +10%' },
    { id: 'power', name: '힘', icon: 'power', max: 5, cost: [80, 150, 240, 360, 540], stat: '모든 피해 +10%' },
    { id: 'shoe', name: '신발', icon: 'shoe', max: 5, cost: [50, 100, 170, 260, 400], stat: '이동 속도 +6%' },
    { id: 'magnet', name: '자석', icon: 'magnet', max: 3, cost: [60, 140, 260], stat: '줍기 범위 +25%' },
    { id: 'armor', name: '방어', icon: 'armor', max: 3, cost: [120, 260, 480], stat: '받는 피해 -1' },
    { id: 'luck', name: '행운', icon: 'luck', max: 5, cost: [60, 120, 200, 300, 450], stat: '코인 +15%' },
    { id: 'reroll', name: '새로고침', icon: 'reroll', max: 3, cost: [100, 220, 400], stat: '카드 새로고침 +1' },
    { id: 'revive', name: '부활', icon: 'revive', max: 2, cost: [300, 900], stat: '부활 +1' }
  ];
  D.SHOPI = {}; D.SHOP.forEach(function (s) { D.SHOPI[s.id] = s; });

  // 경험치 표
  D.need = function (lv) { return Math.floor(4 + lv * 2.6 + lv * lv * 0.1); };

  window.DATA = D;
})();
