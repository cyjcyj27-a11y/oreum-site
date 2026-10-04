// data.js — 현상범·강화·글자
(function () {
  const EN = new URLSearchParams(location.search).get('lang') === 'en';
  // 현상범 13명. 이름 = 죄목(사장님이 정한 그대로). model 이 있으면 assets/models/outlaws/<model>.glb 를 표적이 될 때 읽는다. 없으면 카우보이(star.glb)
  const O = (id, tier, site, ko, en, bounty, o) => Object.assign({ id, tier, site, name: EN ? en : ko, crime: '', bounty, speed: 5, h: 1.76, tug: 0 }, o, { img: (window.WANTED && WANTED[(o && o.model) || 'bank']) || 'assets/wanted/' + ((o && o.model) || 'bank') + '.jpg' });
  const OUTLAWS = [
    O(1, 1, 'hay', '품행불량', 'Bad Attitude', 50, { model: 'rude', speed: 4.4, h: 1.78 }),
    O(2, 1, 'camp1', '홈리스', 'Homeless', 80, { model: 'homeless', speed: 4.8, h: 1.74 }),
    O(3, 1, 'flats', '원산지표시위반', 'Origin Label Fraud', 120, { model: 'origin', speed: 5.1, zig: 1, h: 1.52 }),
    O(4, 2, 'camp2', '불법체류자', 'Overstayer', 250, { model: 'illegal', speed: 5.6, tug: 1, h: 1.66 }),
    O(5, 2, 'ranch', '명품짝퉁유통', 'Knockoff Dealer', 300, { model: 'fake', horse: 7.4, coat: 0x8a5a3a, tug: 1, h: 1.68 }),
    O(6, 2, 'wagon', '동물보호법위반', 'Animal Cruelty', 400, { model: 'animal', speed: 5.4, zig: 1, shoot: 3.4, tug: 1, h: 1.72 }),
    O(7, 3, 'canyon', '몰카범', 'Hidden Camera', 700, { model: 'spycam', horse: 8.4, coat: 0x9a4a2a, shoot: 3.1, tug: 2, h: 1.74 }),
    O(8, 3, 'ghost', '코인사기꾼', 'Crypto Scammer', 850, { model: 'coin', horse: 8.8, coat: 0x3a3230, shoot: 2.8, tug: 2, h: 1.78 }),
    O(9, 3, 'mine', '방화범', 'Arsonist', 1000, { model: 'arson', speed: 5.8, bomb: 3.6, tug: 2, h: 1.68 }),
    O(10, 4, 'tower', '마약유통', 'Drug Dealer', 1500, { model: 'drug', horse: 9.6, coat: 0xb89a74, zig: 1, tug: 3, h: 1.6 }),
    O(11, 4, 'gulch', '은행강도', 'Bank Robber', 2000, { horse: 10.2, coat: 0xd8d2c6, shoot: 2.3, tug: 3, noMask: 1, h: 1.82 }),   // 10/3 "은행강도 복면 없애 줘": 맨얼굴(부하·좀도둑은 같은 모델이라도 복면 그대로)
    O(12, 4, 'grave', '남편살해범', 'Husband Killer', 3000, { model: 'husband', horse: 10.4, coat: 0x7a7672, shoot: 2.1, zig: 1, tug: 3, h: 1.68 }),
    O(13, 5, 'fort', '범죄단체조직(계모임)', 'Savings Club Ring', 10000, { model: 'gye', horse: 10.8, coat: 0x1c1a1a, shoot: 1.9, tug: 4, h: 1.6, guards: 3, boss: 1 })
  ];
  const TIER_NEED = [0, 0, 2, 5, 8, 12]; // 그 급이 열리려면 잡아야 하는 수
  const UP = {
    rope:   { v: [30, 32, 34, 36, 38],          p: [80, 300, 900, 2200] },   // 던지는 거리(m). 10/3 사장님 "멀리 있는 수배범을 잡는 맛" 으로 30m(상점에선 안 팖, 옛 저장 단계만 32~38)
    horse:  { v: [10, 11, 12, 13, 14],          p: [120, 400, 1100, 2600] }, // 말 속도(m/s)
    loop:   { v: [1.3, 1.6, 1.95, 2.3],         p: [150, 600, 1800] },       // 올가미 반지름(m)
    gloves: { v: [1, 1.3, 1.65, 2.1],           p: [200, 700, 2000] }        // 당기는 힘
  };
  const T = EN ? { title: 'LASSO SISTER', cont: 'CONTINUE', land: 'ROTATE', ride: 'RIDE', off: 'OFF', board: 'WANTED', store: 'BUY HORSE', stable: 'STABLE', keys: 'Arrows Move · WASD Look · Space Lasso · E Ride<br>Drag Look · Wheel Zoom · H Horse',
      rope: 'ROPE', horse: 'HORSE', loop: 'LOOP', gloves: 'GLOVES', fry: 'Drifter', guard: 'Henchman', petty: 'Petty Thief', hench: 'Henchman', newHorse: 'NEW HORSE', horseDown: 'HORSE DOWN', retry: 'RETRY' }
    : { title: '올가미 언니', cont: '이어하기', land: '가로로 보기', ride: '타기', off: '내리기', board: '현상수배', store: '말 사기', stable: '마구간', keys: '방향키 이동 · WASD 시점 · Space 올가미 · E 타기<br>마우스 끌기 시점 · 휠 확대 · H 말 부르기',
      rope: '밧줄', horse: '말', loop: '올가미', gloves: '장갑', fry: '좀도둑', guard: '부하', petty: '좀도둑', hench: '부하', newHorse: '새 말', horseDown: '말이 쓰러졌다', retry: '다시하기' };
  window.DATA = { OUTLAWS, TIER_NEED, UP, T, EN, FRY_BOUNTY: 20, GUARD_BOUNTY: 100, HORSE_PRICE: 300 };
})();
