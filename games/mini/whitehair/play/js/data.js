// 손님 단계·흰머리 종류·상점 표
(function () {
  const D = (window.DATA = {});
  // 흰머리 종류(도감). coin = 한 가닥 값, root = 뿌리 힘(클수록 오래 당겨야 빠짐)
  D.TYPES = {
    normal: { ko: '보통 흰머리', en: 'Plain White', coin: 100, root: 1.0, from: 0 },
    sprout: { ko: '새싹 흰머리', en: 'White Sprout', coin: 150, root: 0.8, from: 2 },
    half: { ko: '반백 머리', en: 'Half Gray', coin: 120, root: 1.0, from: 4 },
    curly: { ko: '곱슬 흰머리', en: 'Curly White', coin: 130, root: 1.1, from: 6 },
    thick: { ko: '굵은 흰머리', en: 'Thick White', coin: 200, root: 1.6, from: 8 },
    silver: { ko: '은빛 긴 머리', en: 'Long Silver', coin: 180, root: 1.2, from: 10 },
    twin: { ko: '쌍둥이 흰머리', en: 'Twin White', coin: 300, root: 1.3, from: 13 },
    gold: { ko: '황금 머리카락', en: 'Golden Hair', coin: 1000, root: 1.4, from: 9 },
  };
  D.TYPE_KEYS = Object.keys(D.TYPES);

  // 머리 모양(10/22 사장님 "모든 사람이 직모냐 파마머리 짧은머리 다양하게 없냐" → 실루엣이 다르게)
  // len: 검은 머리 길이(cm), curl: 물결, helix: 뽀글이 고리 반지름(cm), stand: 두피에서 서는 정도(0~1),
  // flow: 결 방향(whorl 가마 · side 2:8 가르마 · back 올백 · down 아래로), grav: 늘어짐, bald: 정수리 빈 곳, temple: 이마 양옆 벗겨짐
  const STY = {
    short: { len: [1.6, 2.6], curl: 0, stand: 0.7, flow: 'whorl', bald: 0, temple: 0 }, // 스포츠머리: 위로 섬
    mid: { len: [3.8, 5.6], curl: 0, flow: 'whorl', bald: 0, temple: 0.05 }, // 보통 머리
    perm: { len: [2.6, 3.6], curl: 0, helix: 0.42, stand: 0.45, flow: 'whorl', bald: 0, temple: 0 }, // 뽀글이 파마
    side: { len: [5.5, 8.0], curl: 0, flow: 'side', bald: 0, temple: 0.08 }, // 2:8 가르마
    crown: { len: [3.0, 4.4], curl: 0, flow: 'whorl', bald: 0.2, temple: 0.12 }, // 정수리 빈 머리
    buzz: { len: [1.1, 1.7], curl: 0, flow: 'whorl', bald: 0, temple: 0.04 }, // 까까머리
    back: { len: [5.0, 7.0], curl: 0, flow: 'back', bald: 0, temple: 0.1 }, // 올백
    bob: { len: [9.0, 12.0], curl: 0.15, flow: 'down', grav: 4.5, bald: 0, temple: 0 }, // 장발(덥수룩하게 늘어짐)
  };
  const ORDER = ['short', 'mid', 'perm', 'back', 'side', 'crown', 'bob', 'buzz', 'perm', 'short', 'side', 'back', 'crown', 'mid', 'perm', 'bob', 'buzz', 'side', 'perm', 'back', 'short', 'crown', 'bob', 'perm'];
  // 검정 몇 가지 + 갈색 염색
  const TONES = ['#1b1714', '#231a14', '#15130f', '#4b2e1d', '#2a1e16', '#1e1a17', '#3d2618'];
  D.COUNT = 25; // 마지막(25번째)이 엔딩 손님
  D.customer = function (i) {
    const last = i === D.COUNT - 1;
    // 마지막 손님은 금발 뽀글이 파마 할머니(금발 사이 흰머리 찾기, 사장님 10/22), 10번째는 보라색 스포츠머리
    const sty = last ? 'perm' : ORDER[i % ORDER.length];
    const st = STY[sty];
    const types = D.TYPE_KEYS.filter((k) => D.TYPES[k].from <= i && k !== 'sprout');
    return {
      i, last,
      style: sty,
      len: st.len, curl: st.curl, helix: st.helix || 0, stand: st.stand || 0, flow: st.flow, grav: st.grav || 1, bald: st.bald, temple: st.temple + (i > 14 ? 0.05 : 0),
      tone: last ? '#d8b46c' : i === 9 ? '#5b2a78' : TONES[i % TONES.length],
      seed: 1000 + i * 7919,
      whites: last ? 230 : Math.round(3 + i * 1.25),
      hidden: last ? 40 : i < 2 ? 0 : Math.round(1 + (i - 2) * 0.55),
      types,
      // 황금 머리카락: 10번째 손님부터 세 손님에 한 번꼴(10·13·16·19·22번째 한 가닥씩), 마지막은 세 가닥, 한 가닥 1000코인 (10/22 사장님 "10판째부터")
      gold: last ? 3 : i >= 9 && (i - 9) % 3 === 0 ? 1 : 0,
      move: last ? 0.85 : 0.18 + i * 0.03, // 움직임 잦기
      drain: last ? 0.35 : 0.35 + i * 0.018, // 초당 인내심 줄기
      heal: last ? 1.6 : 0, // PERFECT 마다 인내심 회복
    };
  };

  // 상점: lv 0 은 처음부터 가진 것
  D.SHOP = [
    { id: 'tweez', ko: '족집게', en: 'Tweezers', dko: '덜 끊기고, 옆 검은 머리가 덜 딸려 옴', den: 'Fewer snaps, fewer black hairs dragged along', lv: [
      { ko: '맨손가락', en: 'Fingers', cost: 0 },
      { ko: '쇠 족집게', en: 'Steel Tweezers', cost: 900 },
      { ko: '뾰족 족집게', en: 'Pointed Tweezers', cost: 2600 },
      { ko: '장인 족집게', en: 'Master Tweezers', cost: 6500 }] },
    { id: 'comb', ko: '참빗', en: 'Fine Comb', dko: '한 번에 더 넓게 빗김', den: 'Combs a wider strip at once', lv: [
      { ko: '작은 참빗', en: 'Small Fine Comb', cost: 0 },
      { ko: '참빗', en: 'Fine Comb', cost: 1400 },
      { ko: '큰 참빗', en: 'Large Fine Comb', cost: 3600 }] },
    { id: 'lamp', ko: '조명', en: 'Lamp', dko: '가게가 밝아져 숨은 흰머리가 잘 보임', den: 'Brighter shop, hidden white hairs show up', lv: [
      { ko: '형광등', en: 'Ceiling Light', cost: 0 },
      { ko: '스탠드', en: 'Desk Lamp', cost: 1100 },
      { ko: '링 조명', en: 'Ring Light', cost: 3200 }] },
    { id: 'loupe', ko: '돋보기', en: 'Loupe', dko: '머리를 더 가까이 확대', den: 'Zoom in closer', lv: [
      { ko: '맨눈', en: 'Bare Eyes', cost: 0 },
      { ko: '돋보기', en: 'Magnifier', cost: 1000 },
      { ko: '확대경', en: 'Head Loupe', cost: 2800 }] },
    { id: 'chair', ko: '의자', en: 'Chair', dko: '손님이 편해서 고개를 덜 움직임', den: 'Customer moves their head less', lv: [
      { ko: '나무 의자', en: 'Wooden Chair', cost: 0 },
      { ko: '쿠션 의자', en: 'Cushion Chair', cost: 1700 },
      { ko: '안마 의자', en: 'Massage Chair', cost: 4600 }] },
    // 쓰는 것(사장님 10/22 "사자마자 발효되는게 아니라 사용하게"): 살 때마다 하나씩 쌓이고, 손님 받다가 단추로 하나씩 씀
    { id: 'tea', use: true, ko: '차 대접', en: 'Tea', dko: '단추로 써서 인내심 +60', den: 'Use it to restore 60 patience', cost: 500, heal: 60 },
    { id: 'rub', use: true, ko: '어깨 주무르기', en: 'Shoulder Rub', dko: '단추로 써서 인내심 +35', den: 'Use it to restore 35 patience', cost: 300, heal: 35 },
  ];
  // 단계별 값
  D.GEAR = {
    grabR: [17, 13, 11, 9], // 집는 범위(px)
    dblR: [4.0, 2.8, 1.8, 1.0], // 옆 머리까지 같이 집히는 범위(px)
    snapK: [0.85, 1.0, 1.15, 1.3], // 끊어지지 않고 버티는 세기
    combR: [2.45, 3.15, 3.85], // 참빗 길이의 반(cm): 작은 참빗 4.9cm · 참빗 6.3cm · 큰 참빗 7.7cm (10/22 사장님 "크기를 70%로")
    expo: [1.0, 1.14, 1.28],
    zoomMin: [24, 18, 13],
    move: [1, 0.72, 0.48],
  };
})();
