// data.js — 구역(패거리)·기술 수치
(function () {
  // 패거리 옷색·머리색. 옷은 원래 검은 학생복 자리, 머리는 금발 자리를 칠한다
  const ZONES = [
    { id: 'sakura', name: '사쿠라길', x: 19, z: 36, r: 15,
      coat: [238, 236, 228], hair: [[236, 120, 170], [40, 36, 40], [250, 214, 120]], band: 0xff6fa8,
      waves: [3, 3], boss: { hp: 150, dmg: 9, scale: 1.12, hair: [250, 150, 200] }, lv: 0 },
    { id: 'pond', name: '시노바즈 연못', x: -22, z: 44, r: 15,
      coat: [38, 62, 128], hair: [[30, 28, 30], [120, 200, 240], [200, 200, 205]], band: 0x4aa3ff,
      waves: [3, 4], boss: { hp: 200, dmg: 12, scale: 1.14, hair: [240, 240, 240] }, lv: 1 },
    { id: 'shrine', name: '도쇼궁', x: -42, z: -7, r: 15,
      coat: [120, 26, 34], hair: [[30, 28, 30], [230, 60, 40], [240, 190, 80]], band: 0xffd23a,
      waves: [4, 4], boss: { hp: 240, dmg: 14, scale: 1.16, hair: [250, 200, 60] }, lv: 2 },
    { id: 'zoo', name: '동물원 정문', x: -20, z: -50, r: 15,
      coat: [44, 92, 52], hair: [[30, 28, 30], [160, 230, 90], [180, 110, 60]], band: 0x7be36b,
      waves: [4, 5], boss: { hp: 280, dmg: 15, scale: 1.18, hair: [30, 30, 30] }, lv: 3 },
    { id: 'fountain', name: '분수 광장', x: 25, z: -44, r: 21, final: true,
      coat: [245, 245, 245], hair: [[30, 28, 30], [30, 28, 30], [200, 40, 50]], band: 0xff2a2a,
      waves: [5], boss: { hp: 420, dmg: 17, scale: 1.24, hair: [20, 20, 22] }, lv: 4 },
  ];

  // 주인공 기술. wind = 누르고 맞을 때까지(초), rec = 맞은 뒤 다시 움직일 때까지
  const HERO_ATK = {
    jab:      { clip: 'jab',      dmg: 7,  range: 1.55, arc: 1.4, wind: 0.13, rec: 0.16, react: 'light', push: 0.5, next: 'cross', gauge: 6, lunge: 0.7 },
    cross:    { clip: 'cross',    dmg: 9,  range: 1.6,  arc: 1.4, wind: 0.15, rec: 0.18, react: 'light', push: 0.7, next: 'hook',  gauge: 7, lunge: 0.8 },
    hook:     { clip: 'hook',     dmg: 15, range: 1.65, arc: 1.7, wind: 0.19, rec: 0.32, react: 'big',   push: 2.0, next: null,    gauge: 10, lunge: 0.9 },
    kick:     { clip: 'kick',     dmg: 17, range: 1.95, arc: 1.6, wind: 0.26, rec: 0.36, react: 'down',  push: 2.6, next: null,    gauge: 10, lunge: 0.6 },
    dropkick: { clip: 'dropkick', dmg: 42, range: 2.9,  arc: 2.6, wind: 0.34, rec: 0.7,  react: 'down',  push: 4.5, next: null,    gauge: 0,  lunge: 4.2, special: true, brk: 2 },
    // 떠 있을 때 누르면 공중 킥 — 내려찍어 눕힌다
    airkick:  { clip: 'kick',     dmg: 20, range: 1.95, arc: 1.9, wind: 0.14, rec: 0.22, react: 'down',  push: 2.4, next: null,    gauge: 12, lunge: 1.6, brk: 1.3 },
    // 연속기 도중 체인지 — 들어오는 쪽이 날아 들어오며 찬다
    tag:      { clip: 'dropkick', dmg: 22, range: 2.4,  arc: 2.2, wind: 0.3,  rec: 0.45, react: 'big',   push: 2.4, next: null,    gauge: 8,  lunge: 4.0, brk: 1.6 },
  };
  // 상대 기술 — 눈에 보이게 천천히 들어온다. heavy = 노랗게 번쩍이는 큰 기술(옆으로 피해야 한다)
  const FOE_ATK = {
    jab:   { clip: 'jab',      dmg: 1.0, range: 1.45, arc: 1.2, wind: 0.46, rec: 0.42, react: 'light', push: 0.5, lunge: 0.6 },
    cross: { clip: 'cross',    dmg: 1.1, range: 1.5,  arc: 1.2, wind: 0.46, rec: 0.44, react: 'light', push: 0.7, lunge: 0.7 },
    hook:  { clip: 'hook',     dmg: 1.5, range: 1.55, arc: 1.5, wind: 0.56, rec: 0.55, react: 'big',   push: 1.6, lunge: 0.8 },
    kick:  { clip: 'kick',     dmg: 1.8, range: 1.85, arc: 1.4, wind: 0.62, rec: 0.6,  react: 'down',  push: 2.2, lunge: 0.5 },
    // 류지: 멀리서 달려들며 차기 (뛰어넘거나 옆으로 피한다)
    charge:  { clip: 'kick',     dmg: 2.4, range: 1.9, arc: 1.0, wind: 0.95, rec: 0.95, react: 'down', push: 3.0, lunge: 3.6, heavy: true, long: true },
    // 에리: 날아 차기 (뛰어도 맞는다 — 옆으로 피한다)
    flykick: { clip: 'dropkick', dmg: 2.2, range: 2.2, arc: 1.1, wind: 0.85, rec: 1.0,  react: 'down', push: 3.0, lunge: 3.4, heavy: true, long: true, hitsAir: true },
  };
  // 상대 연속기 — 장(0~4)마다 쓸 수 있는 묶음이 늘어난다. [묶음, 처음 쓰는 장]
  const FOE_PAT = {
    ryuji: [[['jab'], 0], [['jab', 'hook'], 0], [['kick'], 0], [['jab', 'jab', 'hook'], 1], [['charge'], 1], [['jab', 'kick'], 2], [['jab', 'cross', 'hook', 'kick'], 3]],
    eri:   [[['jab', 'jab'], 0], [['kick'], 0], [['jab'], 0], [['jab', 'jab', 'jab'], 1], [['jab', 'kick'], 1], [['flykick'], 2], [['jab', 'cross', 'jab', 'kick'], 3]],
  };

  window.DATA = { ZONES, HERO_ATK, FOE_ATK, FOE_PAT };
})();
