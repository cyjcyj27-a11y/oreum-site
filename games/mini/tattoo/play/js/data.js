// 손님 표·피어싱 종류·상점 표
(function () {
  const D = (window.DATA = {});
  // 피어싱 자리(도감). at = 귀 그림 좌표(cm, x 는 뒤통수 쪽 +, y 는 위 +), gem = 끼우는 장신구
  D.PIERCE = {
    lobe: { ko: '귓불', en: 'Lobe', at: [1.05, -2.45], gem: 'stud', from: 2 },
    lobe2: { ko: '세컨 귓불', en: 'Second Lobe', at: [1.62, -1.95], gem: 'hoop', from: 8 },
    helix: { ko: '헬릭스', en: 'Helix', at: [2.12, 2.62], gem: 'hoop', from: 8 },
    conch: { ko: '콘크', en: 'Conch', at: [1.15, 0.55], gem: 'stud', from: 15 },
    tragus: { ko: '트라거스', en: 'Tragus', at: [-0.1, -0.15], gem: 'stud', from: 15 },
  };
  D.PIERCE_KEYS = Object.keys(D.PIERCE);

  // 손님 25명. tat = 타투 [도안, 폭 cm, 팔 위 자리(팔꿈치 0 → 손목 쪽 +cm), 색 칠하기?], pie = 피어싱 자리
  // 앞 넷은 선만(색 없이), 다섯째부터 색, 셋째에 첫 피어싱, 열여덟째 호랑이·스물하나째 나방·스물둘째 불타는 하트, 마지막은 장미·호랑이·제비 + 피어싱 셋
  const T = (id, w, x, col, s, rot) => ({ id, w, x: x || 0, col: col !== false, s: s || 0, rot: rot || 0 });
  const LIST = [
    { tat: [T('heart', 3.4, 1, false)] },
    { tat: [T('bolt', 3.2, 0, false)] },
    { pie: ['lobe'] },
    { tat: [T('star', 3.8, 0, false)] },
    { tat: [T('cherry', 3.8, 1)] },
    { tat: [T('anchor', 4.6, -1)], pie: ['lobe'] },
    { tat: [T('heart', 4.0, 0)] },
    { tat: [T('dagger', 3.4, 0)] },
    { pie: ['helix', 'lobe2'] },
    { tat: [T('skull', 4.4, -1)] },
    { tat: [T('swallow', 5.2, 0)], pie: ['lobe'] },
    { tat: [T('butterfly', 5.0, 0)] },
    { tat: [T('rose', 5.2, -1)] },
    { tat: [T('star', 4.4, 1)], pie: ['helix'] },
    { tat: [T('snake', 4.6, 0)] },
    { pie: ['conch', 'tragus', 'lobe'] },
    { tat: [T('heartdagger', 5.0, 0)] },
    { tat: [T('tiger', 5.8, 0)] },
    { tat: [T('rose', 5.8, 0)], pie: ['conch'] },
    { tat: [T('skull', 4.6, -4.2), T('snake', 4.4, 3.4)] },
    { tat: [T('moth', 5.6, 0)] },
    { tat: [T('burnheart', 5.2, 0)], pie: ['tragus', 'helix'] },
    { tat: [T('dagger', 3.8, -3.6), T('cherry', 4.0, 3.8)] },
    { pie: ['lobe', 'lobe2', 'helix', 'conch'] },
    { tat: [T('rose', 5.6, -5.8), T('tiger', 5.8, 1.0), T('swallow', 5.4, 7.6)], pie: ['lobe', 'helix', 'tragus'] },
  ];
  D.COUNT = LIST.length;

  // 피부·머리 색(손님마다 돌아가며)
  const SKIN = ['#e9b896', '#d9a07c', '#f0c7a8', '#c88a64', '#e3ad8a', '#b9785a', '#f2cfb4', '#d29872'];
  const HAIR = ['#1b1714', '#3b2618', '#121010', '#6b4a2c', '#1e1a17', '#b8a27c', '#2a1e16', '#7a2a3a'];
  const SLEEVE = ['#1d1d22', '#2b3a55', '#5a2a2a', '#3a4a32', '#d8d4cc', '#22262c', '#6a5a3a', '#1d1d22'];
  D.customer = function (i) {
    const c = LIST[i], last = i === D.COUNT - 1;
    return {
      i, last,
      tat: (c.tat || []).map((t) => Object.assign({}, t)),
      pie: (c.pie || []).slice(),
      skin: SKIN[i % SKIN.length], hair: HAIR[(i * 3) % HAIR.length], sleeve: SLEEVE[(i * 5) % SLEEVE.length],
      hairy: i % 4 === 1 ? 1 : i % 4 === 3 ? 0.5 : 0.15, // 팔 털
      longHair: i % 3 === 2,
      seed: 1000 + i * 7919,
      // 움찔: 몇 초마다, 얼마나 크게(cm). 뒤로 갈수록 잦고 큼
      flinchGap: last ? 6 : Math.max(6.5, 15 - i * 0.38), flinchAmp: last ? 0.75 : 0.35 + i * 0.016,
      pain: last ? 1.3 : 0.75 + i * 0.022, // 바늘이 살에 닿아 있을 때 인내심 줄기 배수
      drain: 0.12 + i * 0.006, // 가만있어도 줄기(초당)
      breath: last ? 1.15 : 1 + i * 0.006, // 숨 빠르기
    };
  };

  // 값: 타투 한 장 = 폭(cm) 제곱 × 120 + 색 칠하면 + 1500, 피어싱 한 곳 500
  D.priceTat = (t) => Math.round((t.w * t.w * 120 + (t.col && FLASH.get(t.id).shapes.some((s) => s.f) ? 1500 : 0)) / 100) * 100;
  D.PRICE_PIE = 500;
  D.MISS = { off: 200, blow: 200, spill: 100, crook: 300 }; // 실수 하나에 깎는 값

  // 상점: lv 0 은 처음부터 가진 것
  D.SHOP = [
    { id: 'machine', ko: '머신', en: 'Machine', dko: '빨리 그어도 선이 덜 끊기고 덜 번짐', den: 'Faster strokes stay solid, less smudge', lv: [
      { ko: '코일 머신', en: 'Coil Machine', cost: 0 },
      { ko: '로터리 머신', en: 'Rotary Machine', cost: 1500 },
      { ko: '펜 머신', en: 'Pen Machine', cost: 4200 }] },
    { id: 'needle', ko: '니들', en: 'Needles', dko: '가는 선, 덜 삐끗하고 덜 삐져나감', den: 'Finer lines, fewer slips and spills', lv: [
      { ko: '7RL 니들', en: '7RL Needle', cost: 0 },
      { ko: '5RL 니들', en: '5RL Needle', cost: 1200 },
      { ko: '3RL 니들', en: '3RL Needle', cost: 3500 }] },
    { id: 'lamp', ko: '조명', en: 'Lamp', dko: '밝아져서 스텐실 선이 또렷함', den: 'Brighter, stencil lines show clearer', lv: [
      { ko: '형광등', en: 'Ceiling Light', cost: 0 },
      { ko: '스탠드', en: 'Desk Lamp', cost: 1000 },
      { ko: '링 조명', en: 'Ring Light', cost: 2800 }] },
    { id: 'rest', ko: '팔걸이', en: 'Arm Rest', dko: '손님이 덜 자주, 덜 크게 움찔함', den: 'Customers flinch less and smaller', lv: [
      { ko: '나무 팔걸이', en: 'Wooden Rest', cost: 0 },
      { ko: '쿠션 팔걸이', en: 'Cushion Rest', cost: 1600 },
      { ko: '시술 침대', en: 'Tattoo Bed', cost: 4400 }] },
    { id: 'gel', ko: '스텐실 젤', en: 'Stencil Gel', dko: '닦아도 스텐실 선이 덜 지워짐', den: 'Wiping fades the stencil less', lv: [
      { ko: '물', en: 'Water', cost: 0 },
      { ko: '스텐실 젤', en: 'Stencil Gel', cost: 900 },
      { ko: '프로 젤', en: 'Pro Gel', cost: 2400 }] },
    // 쓰는 것: 사서 쌓아 두고 단추로 하나씩
    { id: 'cream', use: true, ko: '마취 크림', en: 'Numbing Cream', dko: '단추로 바르면 이번 손님이 덜 아파함', den: 'Apply to make this customer feel less pain', cost: 600 },
    { id: 'candy', use: true, ko: '사탕', en: 'Candy', dko: '단추로 써서 인내심 +40', den: 'Use it to restore 40 patience', cost: 300, heal: 40 },
  ];
  D.GEAR = {
    vFast: [5, 7, 9.5], // 이보다 빨리 그으면 선이 듬성듬성(cm/초)
    smudge: [1, 0.6, 0.35], // 번지는 잉크 양
    // 니들은 살수록 가늘어짐(10/25 사장님 "굵어지면 안되고 더 가늘어져서 섬세한 시술"): 그리는 굵기는 줄고, 스텐실 덮는 폭·삐끗 여유는 늘어남
    lineR: [0.05, 0.04, 0.03], // 선 바늘 반지름(cm), 그려지는 굵기
    lineHit: [0.065, 0.075, 0.085], // 이 안의 스텐실 점은 덮은 것으로 셈(cm)
    slip: [0.14, 0.17, 0.2], // 스텐실에서 이만큼 떨어지면 삐끗(cm)
    brushR: [0.2, 0.17, 0.14], // 칠하기 바늘 반지름(cm), 그려지는 굵기
    brushHit: [0.2, 0.21, 0.22], // 칠하기에서 칸 점 덮는 폭(cm)
    expo: [1.0, 1.14, 1.28],
    stencil: [0.62, 0.78, 0.92], // 스텐실 진하기
    flinch: [1, 0.7, 0.45], // 움찔 크기·잦기
    wipeFade: [0.07, 0.035, 0.012], // 한 번 닦을 때 스텐실이 옅어지는 양
  };
})();
