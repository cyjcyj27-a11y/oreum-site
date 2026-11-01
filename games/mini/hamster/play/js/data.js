// 판·구역·햄스터 품종 표. 판 10개 = 구역 5개 × 2판, 맨 끝은 해바라기 밭.
(function () {
  const D = (window.DATA = {});
  D.COLS = 4;            // 걸을 수 있는 칸: -4 ~ 4
  D.WRAP = 14;           // 움직이는 것들이 도는 폭(-14 ~ 14)
  D.LEN = [34, 38, 40, 42, 44, 46, 48, 50, 52, 54]; // 판마다 줄 수(마지막 줄이 은신처)
  D.CHEEK = 12;          // 볼주머니 한도
  // 구역: 바닥 색, 길 종류별 비율, 장애물·탈것 이름
  D.ZONES = [
    { id: 'room', ko: '아이방', en: 'KIDS ROOM', sky: 0xf6e7d2, fog: 0xf6e7d2,
      safe: [0xf3c6c9, 0xf7d7a8], kinds: { road: 0.62, rail: 0.18, water: 0 }, obs: ['block', 'crayon', 'ball', 'block'], mov: ['toycar', 'toycar', 'truck'] },
    { id: 'kitchen', ko: '부엌', en: 'KITCHEN', sky: 0xe4eef0, fog: 0xe4eef0,
      safe: [0xf4f1ea, 0xdfe7ea], kinds: { road: 0.45, rail: 0, water: 0.35 }, obs: ['mug', 'onion', 'milk', 'mug'], mov: ['robot', 'robot'] },
    { id: 'yard', ko: '마당', en: 'BACKYARD', sky: 0xdff0d0, fog: 0xdff0d0,
      safe: [0x9fd36b, 0x8cc65c], kinds: { road: 0.42, rail: 0, water: 0.38 }, obs: ['pot', 'rock', 'shroom', 'rock'], mov: ['mower', 'mower'] },
    { id: 'alley', ko: '골목', en: 'ALLEY', sky: 0xf1dcc6, fog: 0xf1dcc6,
      safe: [0xd9cbb8, 0xcdbfae], kinds: { road: 0.6, rail: 0.2, water: 0 }, obs: ['cone', 'hydrant', 'bag', 'cone'], mov: ['car', 'car', 'van'] },
    { id: 'park', ko: '공원', en: 'PARK', sky: 0xd8ecf6, fog: 0xd8ecf6,
      safe: [0xa6d870, 0x95cc62], kinds: { road: 0.38, rail: 0, water: 0.45 }, obs: ['stump', 'flower', 'flower', 'rock'], mov: ['dog'] }
  ];
  // 판 번호(0~9)마다 빠르기·고양이 속도
  D.stage = function (i) {
    const z = Math.floor(i / 2), k = i / 9;
    return {
      i, z, zone: D.ZONES[z], len: D.LEN[i],
      sp: [(0.9 + k * 1.0) * 0.87, (1.8 + k * 2.0) * 0.87], // 탈것 빠르기(칸/초) 범위. 11/1 ×0.93, 11/1 한 번 더 ×0.87
      gap: [(3.3 - k * 0.8) * 1.15, (6.5 - k * 1.6) * 1.15], // 탈것 사이 빈 칸. 11/1 ×1.08, 한 번 더 ×1.15
      floatLen: [3.2 - k * 1.0, 3.8 - k * 0.9], // 물 위 탈것 길이
      cat: (0.32 + k * 0.38) * 0.9            // 11/1 ×0.9. 고양이가 따라오는 빠르기(줄/초)
    };
  };
  D.STAGES = 10;
  // 햄스터 품종: 털 위·배·볼·귀 안쪽·줄무늬
  D.BREEDS = [
    { id: 'golden', ko: '골든', en: 'GOLDEN', price: 0, top: 0xe9a24c, belly: 0xfff4e4, cheek: 0xffffff, stripe: null },
    { id: 'jungle', ko: '정글리안', en: 'DJUNGARIAN', price: 40, top: 0x9b9590, belly: 0xffffff, cheek: 0xffffff, stripe: 0x4a4440 },
    { id: 'pearl', ko: '펄', en: 'PEARL', price: 80, top: 0xf6f2ec, belly: 0xffffff, cheek: 0xffffff, stripe: 0xc9c2bb },
    { id: 'pudding', ko: '푸딩', en: 'PUDDING', price: 120, top: 0xf2c46c, belly: 0xfff2d6, cheek: 0xfff2d6, stripe: null },
    { id: 'sapphire', ko: '블루사파이어', en: 'SAPPHIRE', price: 170, top: 0x8e9cb2, belly: 0xf4f6fa, cheek: 0xf4f6fa, stripe: 0x55607a },
    { id: 'panda', ko: '판다', en: 'PANDA', price: 230, top: 0xffffff, belly: 0xffffff, cheek: 0xffffff, stripe: null, patch: 0x2a2626 },
    { id: 'robo', ko: '로보로프스키', en: 'ROBOROVSKI', price: 300, top: 0xd9a96a, belly: 0xffffff, cheek: 0xffffff, stripe: null, brow: 0xffffff, small: true },
    { id: 'black', ko: '블랙', en: 'BLACK', price: 400, top: 0x3a3330, belly: 0x5a504a, cheek: 0x5a504a, stripe: null }
  ];
  D.name = (o) => (window.EN ? o.en : o.ko);
})();
