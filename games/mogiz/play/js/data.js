// 숫자 모음: 피 빨 대상 일곱, 진화 카드 30.
(function () {
  const D = (window.DATA = {});
  // need: 다 빠는 데 드는 초(기본 침), itch: 빠는 동안 1초에 차는 간지러움, wind: 손 올리는 시간,
  // alert: 놓친 뒤 찾아다니는 초, hunt: 찾을 때 휘두르는 사이 간격, ul: 피 1초가 몇 ㎕
  D.ORDER = ['cat', 'dog', 'baby', 'teen', 'mom', 'dad', 'grandpa'];
  D.T = {
    cat: { ko: '고양이', en: 'Cat', need: 2.8, itch: 0.32, wind: 0.85, alert: 6, hunt: 1.4, ul: 1.0, col: '#f0a24a' },
    dog: { ko: '강아지', en: 'Dog', need: 3.2, itch: 0.38, wind: 0.75, alert: 7.5, hunt: 1.2, ul: 1.2, col: '#f4efe4' },
    baby: { ko: '아기', en: 'Baby', need: 3.0, itch: 0.21, wind: 1.2, alert: 4, hunt: 2.4, ul: 0.9, col: '#ffd95a', harmless: true },
    teen: { ko: '남고딩', en: 'High schooler', need: 4.5, itch: 0.46, wind: 0.57, alert: 11, hunt: 0.95, ul: 1.6, col: '#2b2d38' },
    mom: { ko: '엄마', en: 'Mom', need: 4.8, itch: 0.48, wind: 0.57, alert: 11, hunt: 1.3, ul: 1.6, col: '#e98aa2' },
    dad: { ko: '아빠', en: 'Dad', need: 5.2, itch: 0.52, wind: 0.55, alert: 12.5, hunt: 1.0, ul: 1.8, col: '#3a69b8' },
    grandpa: { ko: '할아버지', en: 'Grandpa', need: 6.0, itch: 0.63, wind: 0.47, alert: 16, hunt: 0.8, ul: 1.7, col: '#efeee6' },
  };
  D.BASE = { speed: 1.15, vert: 0.9, suck: 1, itchMul: 1, cap: 3.0, digest: 0.35, annoy: 1, alertMul: 1, detach: 0.12, pop: 0.7, toxin: 1, coilImmune: false, hitbox: 1, heavy: 0.35, dash: 0, dashCd: 3.2, reticle: 0.22, decay: 0.25, eye: 0, slowmo: 0, boost: 0, greedy: 0 };
  // 진화 카드: g = 금테
  D.CARDS = [
    { id: 'wing', ko: '날개 근육', en: 'Wing Muscles', dk: '나는 속도 +12%', de: 'Speed +12%', f: (s) => (s.speed *= 1.12) },
    { id: 'leg', ko: '가는 다리', en: 'Slim Legs', dk: '속도 +6%, 배 무게 -10%', de: 'Speed +6%, belly weight -10%', f: (s) => { s.speed *= 1.06; s.heavy *= 0.9; } },
    { id: 'numb', ko: '마취 침', en: 'Numbing Needle', dk: '간지러움 -14%', de: 'Itch -14%', f: (s) => (s.itchMul *= 0.86) },
    { id: 'sharp', ko: '날카로운 침', en: 'Sharp Needle', dk: '빠는 속도 +16%', de: 'Suck speed +16%', f: (s) => (s.suck *= 1.16) },
    { id: 'belly', ko: '큰 배', en: 'Big Belly', dk: '배 용량 +25%', de: 'Belly size +25%', f: (s) => (s.cap *= 1.25) },
    { id: 'digest', ko: '빠른 소화', en: 'Fast Digest', dk: '소화 +40%', de: 'Digest +40%', f: (s) => (s.digest *= 1.4) },
    { id: 'quiet', ko: '조용한 날개', en: 'Quiet Wings', dk: '귓가에서 덜 들킴 -25%', de: 'Ear buzz notice -25%', f: (s) => (s.annoy *= 0.75) },
    { id: 'eye', ko: '겹눈', en: 'Compound Eyes', dk: '내려칠 자리가 빨갛게 보임', de: 'See where the hit lands', f: (s) => (s.eye += 1) },
    { id: 'reflex', ko: '빠른 반사', en: 'Quick Reflex', dk: '침 빼기 -0.05초', de: 'Pull out -0.05s', f: (s) => (s.detach = Math.max(0.04, s.detach - 0.05)) },
    { id: 'resist', ko: '독 내성', en: 'Poison Resist', dk: '스프레이·모기향 독 -25%', de: 'Poison -25%', f: (s) => (s.toxin *= 0.75) },
    { id: 'camo', ko: '위장 무늬', en: 'Camouflage', dk: '찾아다니는 시간 -20%', de: 'Search time -20%', f: (s) => (s.alertMul *= 0.8) },
    { id: 'dash', ko: '순간 가속', en: 'Dash', dk: 'E 또는 대시 단추로 휙', de: 'Dash with E', f: (s) => { s.dash += 1; s.dashCd = Math.max(1.2, s.dashCd * (s.dash > 1 ? 0.75 : 1)); } },
    { id: 'greedy', ko: '흡혈 본능', en: 'Blood Instinct', dk: '간지러움 절반 전까지 빠는 속도 +25%', de: 'Suck +25% while itch is low', f: (s) => (s.greedy += 0.25) },
    { id: 'shell', ko: '단단한 껍질', en: 'Hard Shell', dk: '독 -15%, 맞는 크기 -6%', de: 'Poison -15%, hitbox -6%', f: (s) => { s.toxin *= 0.85; s.hitbox *= 0.94; } },
    { id: 'lift', ko: '강한 날갯짓', en: 'Strong Flap', dk: '위아래 속도 +25%', de: 'Vertical speed +25%', f: (s) => (s.vert *= 1.25) },
    { id: 'nose', ko: '피 냄새', en: 'Blood Scent', dk: '살을 찾는 거리 +40%', de: 'Skin lock range +40%', f: (s) => (s.reticle *= 1.4) },
    { id: 'pop', ko: '침 빼기 달인', en: 'Pop Out', dk: '침 빼고 튕기는 힘 +45%', de: 'Pull-out push +45%', f: (s) => (s.pop *= 1.45) },
    { id: 'calm', ko: '느긋한 숨', en: 'Slow Breath', dk: '떼면 간지러움이 두 배 빨리 가라앉음', de: 'Itch fades 2x faster', f: (s) => (s.decay *= 2) },
    { id: 'coil', ko: '모기향 적응', en: 'Coil Proof', dk: '모기향 연기 무시', de: 'Ignore mosquito coil smoke', f: (s) => (s.coilImmune = true) },
    { id: 'whisper', ko: '귓가 속삭임', en: 'Whisper', dk: '귓가에서 덜 들킴 -40%', de: 'Ear buzz notice -40%', f: (s) => (s.annoy *= 0.6) },
    { id: 'hide', ko: '그림자 숨기', en: 'Shadow Hide', dk: '찾아다니는 시간 -30%', de: 'Search time -30%', f: (s) => (s.alertMul *= 0.7) },
    { id: 'tank', ko: '피 저장고', en: 'Blood Tank', dk: '배 무게 -25%', de: 'Belly weight -25%', f: (s) => (s.heavy *= 0.75) },
    { id: 'slim', ko: '날렵한 몸', en: 'Slim Body', dk: '맞는 크기 -15%', de: 'Hitbox -15%', f: (s) => (s.hitbox *= 0.85) },
    { id: 'rush', ko: '끈기', en: 'Grit', dk: '피하고 나면 1.5초 동안 속도 +40%', de: 'After a dodge, speed +40% for 1.5s', f: (s) => (s.boost += 0.4) },
    { id: 'gReflex', g: 1, ko: '반사신경', en: 'Bullet Time', dk: '손이 올라오면 세상이 느려짐', de: 'Time slows when a hit winds up', f: (s) => (s.slowmo += 1) },
    { id: 'gNumb', g: 1, ko: '마취왕', en: 'Numb King', dk: '간지러움 -35%', de: 'Itch -35%', f: (s) => (s.itchMul *= 0.65) },
    { id: 'gJet', g: 1, ko: '제트 날개', en: 'Jet Wings', dk: '속도 +30%, 위아래 +30%', de: 'Speed +30%, vertical +30%', f: (s) => { s.speed *= 1.3; s.vert *= 1.3; } },
    { id: 'gImmune', g: 1, ko: '독 면역', en: 'Poison Proof', dk: '독 -75%', de: 'Poison -75%', f: (s) => (s.toxin *= 0.25) },
    { id: 'gGhost', g: 1, ko: '투명 날개', en: 'Ghost Wings', dk: '덜 들킴 -50%, 찾는 시간 -40%', de: 'Notice -50%, search -40%', f: (s) => { s.annoy *= 0.5; s.alertMul *= 0.6; } },
    { id: 'gKing', g: 1, ko: '대왕 침', en: 'King Needle', dk: '빠는 속도 +50%, 배 용량 +30%', de: 'Suck +50%, belly +30%', f: (s) => { s.suck *= 1.5; s.cap *= 1.3; } },
  ];
  D.CARD = {}; D.CARDS.forEach((c) => (D.CARD[c.id] = c));
  // 환생할수록 물린 자리가 덜 부어오름(= 덜 간지러움): 한 번 환생마다 5%, 가장 적게 72%까지(10/24 사장님 6번 만에 엔딩 → 난이도 올림, 옛 8%·62%)
  D.swell = (life) => Math.max(0.72, Math.pow(0.95, Math.max(0, (life || 1) - 1)));
  D.stats = function (ids, life) { const s = Object.assign({}, D.BASE); (ids || []).forEach((id) => D.CARD[id] && D.CARD[id].f(s)); s.swell = D.swell(life); s.itchMul *= s.swell; return s; };
})();
