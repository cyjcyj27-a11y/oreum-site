// 호떡만들기 게임: 날·주문·상점 표
(function () {
  const D = (window.DATA = {});
  D.DAYS = 14;
  // 반죽: 통 칸마다
  D.DOUGH = {
    plain: { ko: '찹쌀', en: 'Rice', col: '#f2e4c4' },
    green: { ko: '녹차', en: 'Green Tea', col: '#b9cf86' },
    black: { ko: '흑미', en: 'Black Rice', col: '#6a4a5a' },
  };
  D.DOUGH_KEYS = ['plain', 'green', 'black'];
  // 속: want = 알맞은 숟갈 수, burst = 이만큼이면 누를 때 터짐
  D.FILL = {
    sugar: { ko: '흑설탕', en: 'Sugar', want: 2, burst: 3, puddle: 0x2a1206 },
    bean: { ko: '팥', en: 'Red Bean', want: 2, burst: 3, puddle: 0x3a1210 },
    cheese: { ko: '콘치즈', en: 'Corn Cheese', want: 1, burst: 2, puddle: 0xe8c86a },
    japchae: { ko: '잡채', en: 'Japchae', want: 2, burst: 3, puddle: 0x5a3a18 },
  };
  D.FILL_KEYS = ['sugar', 'bean', 'cheese', 'japchae'];
  // 주문 종류: 반죽, 속(null = 빈 속), 씨앗 국자 수
  D.KIND = {
    honey: { ko: '꿀호떡', en: 'Honey', price: 1500, dough: 'plain', fill: 'sugar', seeds: 0 },
    seed: { ko: '씨앗호떡', en: 'Seed', price: 2000, dough: 'plain', fill: 'sugar', seeds: 1 },
    seed2: { ko: '씨앗 듬뿍', en: 'Extra Seed', price: 2500, dough: 'plain', fill: 'sugar', seeds: 2 },
    bean: { ko: '단팥호떡', en: 'Red Bean', price: 2000, dough: 'plain', fill: 'bean', seeds: 0 },
    green: { ko: '녹차호떡', en: 'Green Tea', price: 2000, dough: 'green', fill: 'sugar', seeds: 0 },
    cheese: { ko: '콘치즈호떡', en: 'Corn Cheese', price: 2500, dough: 'plain', fill: 'cheese', seeds: 0 },
    japchae: { ko: '야채호떡', en: 'Japchae', price: 2500, dough: 'plain', fill: 'japchae', seeds: 0 },
    black: { ko: '흑미호떡', en: 'Black Rice', price: 2000, dough: 'black', fill: 'sugar', seeds: 0 },
    gonggal: { ko: '공갈호떡', en: 'Bubble', price: 1500, dough: 'plain', fill: null, seeds: 0 },
  };
  D.KIND_KEYS = ['honey', 'seed', 'seed2', 'bean', 'green', 'cheese', 'japchae', 'black', 'gonggal'];
  // 처음 나오는 날(새 주문 알림·차림표·통 뚜껑 열기)
  D.NEW = { 2: 'seed', 3: 'bean', 4: 'seed2', 5: 'green', 6: 'cheese', 7: 'japchae', 8: 'black', 9: 'crispy', 10: 'gonggal' };
  D.OPEN = { honey: 1, seed: 2, bean: 3, seed2: 4, green: 5, cheese: 6, japchae: 7, black: 8, gonggal: 10 };
  D.isOpen = (k, day) => day >= (D.OPEN[k] || 1);
  // 통 칸이 열리는 날
  D.openDough = (k, day) => k === 'plain' || (k === 'green' && day >= 5) || (k === 'black' && day >= 8);
  D.openFill = (k, day) => k === 'sugar' || (k === 'bean' && day >= 3) || (k === 'cheese' && day >= 6) || (k === 'japchae' && day >= 7);

  // 날마다: 손님 수, 한 명이 사는 개수 최대, 바삭 주문 비율, 인내심(초), 손님 오는 간격(초)
  // 나오는 종류는 그날까지 열린 것 중에서 고른다(새로 열린 것은 더 자주)
  // slots = 한 번에 줄 서는 손님 수(처음 이틀은 한 명씩, 사흘째부터 둘, 엿새째부터 셋), cook = 철판 익는 빠르기(초반은 천천히)
  D.DAY = [
    null,
    { n: 4, slots: 1, max: 1, crispy: 0, pat: 150, gap: 30, cook: 0.8 },
    { n: 5, slots: 1, max: 1, crispy: 0, pat: 140, gap: 28, cook: 0.8 },
    { n: 6, slots: 2, max: 1, crispy: 0, pat: 130, gap: 26, cook: 0.85 },
    { n: 7, slots: 2, max: 1, crispy: 0, pat: 120, gap: 22, cook: 0.85 },
    { n: 8, slots: 2, max: 2, crispy: 0, pat: 115, gap: 20, cook: 0.9 },
    { n: 9, slots: 3, max: 2, crispy: 0, pat: 105, gap: 17, cook: 0.95 },
    { n: 10, slots: 3, max: 2, crispy: 0, pat: 95, gap: 15 },
    { n: 10, slots: 3, max: 3, crispy: 0, pat: 92, gap: 14 },
    { n: 11, slots: 3, max: 2, crispy: 0.3, pat: 90, gap: 13 },
    { n: 11, slots: 3, max: 3, crispy: 0.25, pat: 88, gap: 12 },
    { n: 12, slots: 3, max: 3, crispy: 0.25, pat: 85, gap: 11 },
    { n: 12, slots: 3, max: 3, crispy: 0.25, pat: 82, gap: 10 },
    { n: 13, slots: 3, max: 3, crispy: 0.3, pat: 80, gap: 10 },
    { n: 18, slots: 3, max: 3, crispy: 0.25, pat: 85, gap: 8 },
  ];
  D.weights = function (day) {
    const w = {};
    D.KIND_KEYS.forEach((k) => { if (!D.isOpen(k, day)) return; w[k] = k === 'seed' ? 2 : 1; if (D.OPEN[k] === day) w[k] += 1.5; });
    return w;
  };
  D.ANGRY_LIMIT = 3; // 하루에 이만큼 화나 떠나면 GAME OVER

  // 굽기 기준(한 면): 이 값 사이가 노릇
  D.COOK = { raw: 0.55, good0: 0.72, good1: 1.15, burnt: 1.4, crisp0: 1.1, crisp1: 1.38 };
  D.PRESS = { good0: 0.7, good1: 1.0, burst: 1.06, gonggal: 0.3 };
  D.PERFECT_FOR_HONEY = 5; // PERFECT 다섯 개면 꿀단지 가득

  // 상점: 단계마다 값
  D.SHOP = [
    { id: 'griddle', ko: '철판 넓히기', en: 'Bigger Griddle', dko: '호떡 굽는 칸', den: 'Griddle spots', lv: [3, 4, 5, 6], cost: [0, 8000, 18000, 32000], fmt: (v) => v + L('칸', ' spots') },
    { id: 'fire', ko: '화력', en: 'Burner', dko: '빨리 익음', den: 'Cooks faster', lv: [1, 1.15, 1.3, 1.45], cost: [0, 9000, 18000, 30000], fmt: (v) => '×' + v },
    { id: 'press', ko: '누르개', en: 'Press', dko: '알맞게 누르기 쉬움', den: 'Easier to press right', lv: [0, 0.05, 0.1, 0.15], cost: [0, 6000, 14000, 24000], fmt: (v) => '+' + Math.round(v * 100) + '%' },
    { id: 'oil', ko: '큰 기름병', en: 'Big Oil Bottle', dko: '기름이 덜 줄어듦', den: 'Oil lasts longer', lv: [1, 0.75, 0.55, 0.4], cost: [0, 4000, 9000, 16000], fmt: (v) => Math.round((1 / v) * 100) + '%' },
    { id: 'heater', ko: '난로', en: 'Heater', dko: '손님이 오래 기다림', den: 'Guests wait longer', lv: [1, 1.15, 1.3, 1.45], cost: [0, 6000, 13000, 22000], fmt: (v) => '×' + v },
    { id: 'bulb', ko: '간판 전구', en: 'Sign Bulbs', dko: '팁이 늚', den: 'More tips', lv: [1, 1.25, 1.5, 2], cost: [0, 7000, 15000, 26000], fmt: (v) => '×' + v },
  ];
  D.TIP = 500;
})();
