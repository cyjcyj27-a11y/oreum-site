/* 인디밴드 데뷔시키기 — 데이터. 글은 [한국어, 영어] 짝으로 둔다. (file:// 에서도 되게 fetch 없이 전역으로)
   홍대병 걸린 인디밴드 애들을 섭외해서 방송, 유튜브, 예능으로 유명하게 만든다. */
(function () {
  'use strict';

  const STATS = [
    { k: 'vocal', n: ['보컬', 'Vocal'],  c: '#c58b8b' },
    { k: 'play',  n: ['연주', 'Play'],   c: '#5fb3d9' },
    { k: 'write', n: ['작곡', 'Write'],  c: '#c9a86a' },
    { k: 'perf',  n: ['무대', 'Stage'],  c: '#a37b98' },
    { k: 'charm', n: ['끼', 'Charm'],    c: '#8b9b7a' },
  ];

  const TRAITS = {
    artisan: { n: ['감성 장인', 'Soulful'],      d: ['보컬 연습 +35%, 멘탈 단단함', 'Vocal training +35%, steady mind'], gain: 1.0,  stam: .95, ment: .6,  stage: 1.0,  vocalBoost: 1.35 },
    beast:   { n: ['야성', 'Wild'],              d: ['무대 평가 +22%, 멘탈 최강', 'Stage +22%, unbreakable mind'],  gain: 1.05, stam: .9,  ment: .45, stage: 1.22 },
    hard:    { n: ['노력파', 'Grinder'],         d: ['연습 효율 +20%', 'Training +20%'],                                  gain: 1.20, stam: 1.0, ment: 1.0, stage: 1.0 },
    genius:  { n: ['천재형', 'Prodigy'],         d: ['가끔 폭발 성장', 'Random growth bursts'],                           gain: 1.0,  stam: 1.0, ment: 1.0, stage: 1.0,  genius: true },
    glass:   { n: ['유리멘탈', 'Glass Heart'],   d: ['멘탈이 빨리 깎임', 'Mind drains fast'],                             gain: 1.05, stam: 1.0, ment: 1.7, stage: .95 },
    mood:    { n: ['분위기메이커', 'Mood Maker'], d: ['매주 호흡 +2', 'Teamwork +2 every week'],                           gain: .95,  stam: 1.0, ment: .8,  stage: 1.0,  social: true },
    iron:    { n: ['철인', 'Iron Man'],          d: ['체력 소모 -35%', 'Stamina use -35%'],                               gain: 1.0,  stam: .65, ment: .9,  stage: 1.0 },
    ham:     { n: ['관종', 'Spotlight'],         d: ['버스킹 수익, 유명세 2배', 'Busking coins & fame ×2'],                gain: .95,  stam: 1.1, ment: .9,  stage: 1.05, ham: true },
  };

  /* 4명 — 제미나이 일러스트 img/m1~m8 (전신), f1~f8 (얼굴), b1~b8_{joy,sad,mad} (표정)
     hong = 홍대병(0~100). 높을수록 방송, 유튜브, 예능을 싫어하고 안 나가기도 한다. 버스킹, 작곡을 하면 오른다 */
  const TEAM_SIZE = 4;   // 뮤비 정예 넷 — 라이온, 카이렌, 도윤, 하루 (제이, 유안, 로운은 뺌, 2026-09-07 밤)
  const NAMED = [
    { key: 'lion',   sprite: 1, en: 'LION',   kr: '라이온', age: 22, height: '178cm', mbti: 'INTP',
      role: ['싱어송라이터', 'Singer-Songwriter'], mood: ['담백 / 몽환 / 따뜻', 'Calm / Dreamy / Warm'],
      desc: ['말수는 적지만 마음이 깊다.\n새벽 연습실에서만 목소리가 나온다.', 'Quiet, but deep.\nHis voice only comes out in the 2 A.M. practice room.'],
      keywords: [['순수', '감성', '몽환적', '따뜻한 시선'], ['Pure', 'Soulful', 'Dreamy', 'Warm eyes']],
      palette: ['#f4ece0', '#e6d3bc', '#8b9b7a', '#7b9aab'], acc: '#8b9b7a', tint: 'rgba(139,155,122,.10)',
      fee: 150, stats: { vocal: 50, play: 42, write: 54, perf: 26, charm: 34 }, maxStam: 78, mental: 74, pot: 4, hong: 70,
      trait: 'genius', sig: { n: ['새벽 세 시의 가사', '3 A.M. Lyrics'], d: ['휴식한 주에도 작곡 +2', '+2 Write even on rest weeks'] } },

    { key: 'kairen', sprite: 2, en: 'KAIREN', kr: '카이렌', age: 24, height: '183cm', mbti: 'ESTP',
      role: ['메인보컬', 'Lead Vocal'], mood: ['Dark Romanticism', 'Dark Romanticism'],
      desc: ['홍대병 말기 보컬. "TV는 음악을 죽인다."\n그런데 마이크를 잡으면 짐승이 된다.', 'Terminal Hongdae syndrome, on vocals. "TV kills music."\nBut with a mic, he\'s a beast.'],
      keywords: [['카리스마', '신비로움', '야성', '홍대병'], ['Charisma', 'Mystery', 'Wild', 'Indie pride']],
      palette: ['#0d0d0d', '#2b2b2b', '#a8503c', '#e4e0d8'], acc: '#a8503c', tint: 'rgba(168,80,60,.12)',
      fee: 200, stats: { vocal: 56, play: 40, write: 34, perf: 54, charm: 30 }, maxStam: 93, mental: 92, pot: 3, hong: 95,
      trait: 'beast', sig: { n: ['무대의 짐승', 'Stage Beast'], d: ['버스킹 유명세 2배, 체력 소모 +30%', 'Busking fame ×2, stamina use +30%'] } },

    { key: 'doyun',  sprite: 3, en: 'DOYUN',  kr: '도윤', age: 19, height: '176cm', mbti: 'ENFP',
      role: ['드럼, 예능 천재', 'Drums, Variety Genius'], mood: ['청량 / 에너지 / 햇살', 'Fresh / Energy / Sunny'],
      desc: ['하루 종일 합주실에 산다.\n홍대병은 없다. 카메라만 켜지면 예능 천재.', 'Lives in the rehearsal room.\nNo Hongdae syndrome. A variety genius the moment a camera turns on.'],
      keywords: [['청량', '성실', '에너지'], ['Fresh', 'Diligent', 'Energy']],
      palette: ['#5fb3d9', '#dff1fa', '#2b4a6b', '#ffffff'], acc: '#5fb3d9', tint: 'rgba(95,179,217,.12)',
      fee: 0, stats: { vocal: 28, play: 44, write: 20, perf: 50, charm: 62 }, maxStam: 96, mental: 70, pot: 4, hong: 20,
      trait: 'hard', sig: { n: ['예능 천재', 'Variety Genius'], d: ['예능 주에 유명세 2배', 'Fame ×2 on variety weeks'] } },

    { key: 'haru',   sprite: 4, en: 'HARU',   kr: '하루', age: 18, height: '174cm', mbti: 'INFJ',
      role: ['건반', 'Keys'], mood: ['은빛 / 조용함 / 첫눈', 'Silver / Quiet / First snow'],
      desc: ['가만히 서 있어도 시선이 간다.\n아직 자기가 뭘 잘하는지 모른다.', 'Eyes follow him when he just stands there.\nDoesn\'t know his own gift yet.'],
      keywords: [['비주얼', '신비', '잠재력'], ['Visual', 'Mystery', 'Potential']],
      palette: ['#d9dde3', '#ffffff', '#2a2a30', '#9aa3ad'], acc: '#b8c0cc', tint: 'rgba(184,192,204,.10)',
      fee: 80, stats: { vocal: 36, play: 40, write: 30, perf: 38, charm: 40 }, maxStam: 74, mental: 62, pot: 5, hong: 50,
      trait: 'artisan', sig: { n: ['화보 얼굴', 'Cover Face'], d: ['무대 55 이상이면 매주 유명세 +1', 'Fame +1 weekly while Stage ≥ 55'] } },
  ];

  /* 활동 — 앞 셋은 연습(코인 든다), 방송, 유튜브, 예능은 유명세, 버스킹은 코인, 휴식은 회복 */
  const ACTS = {
    vocal: { n: ['보컬', 'Vocal'],    i: '🎙️', cost: 50, stat: 'vocal', stam: 13, base: [3.7, 6.3] },
    play:  { n: ['합주', 'Jam'],      i: '🎸', cost: 45, stat: 'play',  stam: 15, base: [3.9, 6.6], team: 1 },
    write: { n: ['작곡', 'Write'],    i: '✍️', cost: 45, stat: 'write', stam: 10, base: [3.6, 6.4] },
    tv:    { n: ['방송', 'TV'],       i: '📺', cost: 0,  stat: null,    stam: 16, base: [0, 0], fame: true },
    yt:    { n: ['유튜브', 'YouTube'], i: '🎬', cost: 30, stat: null,    stam: 8,  base: [0, 0], fame: true },
    charm: { n: ['예능', 'Variety'],  i: '🤹', cost: 0,  stat: 'charm', stam: 12, base: [3.5, 6.0], fame: true },
    gig:   { n: ['버스킹', 'Busking'], i: '💰', cost: 0,  stat: null,    stam: 20, base: [0, 0] },
    rest:  { n: ['휴식', 'Rest'],     i: '😴', cost: 0,  stat: null,    stam: 0,  base: [0, 0] },
  };
  const ACT_ORDER = ['vocal', 'play', 'write', 'tv', 'yt', 'charm', 'gig', 'rest'];

  const POSITIONS = [
    ['vocal', ['메인보컬', 'Lead Vocal']],
    ['play',  ['리드 연주', 'Lead Player']],
    ['write', ['메인 프로듀서', 'Main Producer']],
    ['perf',  ['프론트맨', 'Frontman']],
    ['charm', ['예능 담당', 'Variety Guy']],
  ];

  const CONCEPTS = [
    { id: 'dream',    n: ['몽환 팝', 'Dream Pop'],     ico: '🌊', acc: '#8b9b7a',
      d: ['고르게 잘하는 밴드', 'For an even band'],
      w: { vocal: .28, play: .14, write: .24, perf: .10, charm: .24 },
      note: ['⚖️ 균형 보너스', '⚖️ Balance bonus'], balance: true, baseMul: 1.14, stick: '#9fd6b8' },
    { id: 'garage',   n: ['개러지 록', 'Garage Rock'], ico: '🔥', acc: '#a8503c',
      d: ['유명할수록 세다', 'Fame hits harder'],
      w: { vocal: .16, play: .26, write: .12, perf: .28, charm: .18 },
      note: ['🔥 유명세 ×1.25', '🔥 Fame ×1.25'], fameMul: 1.25, stick: '#ff7a5c' },
    { id: 'acoustic', n: ['어쿠스틱', 'Acoustic'],     ico: '🌙', acc: '#7b9aab',
      d: ['목소리와 호흡으로', 'Voice and teamwork'],
      w: { vocal: .32, play: .24, write: .26, perf: .06, charm: .12 },
      note: ['🤝 호흡 ×1.4', '🤝 Teamwork ×1.4'], teamMul: 1.42, stick: '#c9b6ff' },
  ];

  const GROUP_NAMES = ['NOCTURNE', 'BLUE HOUR', 'STILL', 'MIRAGE', 'VELVET', 'ORBIT', '해질녘', 'ATLAS'];

  /* 12주 뒤 얼마나 유명해졌나 */
  const RANKS = [
    { min: 80, rank: ['음악방송 1위', 'MUSIC SHOW #1'], icon: '🏆', big: true,
      txt: ['인디밴드가 아이돌을 밀어내고 트로피를 들었다.', 'An indie band pushed the idols aside and took the trophy.'] },
    { min: 65, rank: ['페스티벌 헤드라이너', 'FESTIVAL HEADLINER'], icon: '🎪',
      txt: ['여름 페스티벌 맨 위 줄에 이름이 박혔다.', 'Top line of the summer festival poster.'] },
    { min: 45, rank: ['라이브클럽 매진', 'SOLD-OUT CLUB'], icon: '🎸',
      txt: ['홍대 라이브클럽이 매진됐다. 줄이 골목을 돌았다.', 'The Hongdae club sold out. The line wrapped the block.'] },
    { min: 25, rank: ['홍대 골목 스타', 'ALLEY FAMOUS'], icon: '🌱',
      txt: ['홍대에선 다들 안다. 홍대 밖에선 아직.', 'Everyone in Hongdae knows. Outside, not yet.'] },
    { min: -1, rank: ['여전히 무명', 'STILL UNKNOWN'], icon: '🌧️',
      txt: ['그래도 네 명은 끝까지 무대 위에 있었다.', 'Still, four of them stood on that stage to the end.'] },
  ];

    /* 프로듀서 = 플레이어. 50살, 90년대 반짝 댄스그룹 맨 뒷줄 출신. 그림 img/p_*.webp (제미나이, 늙은 아저씨) */
  const PRODUCER = { en: 'TAEO', kr: '태오', age: 50, voice: .62 };   // 프로듀서 = 늙은 태오. 20대 반짝 댄스그룹 맨 뒷줄 → 지금은 식품회사 사장

  window.BB = { STATS, TRAITS, NAMED, TEAM_SIZE, PRODUCER, ACTS, ACT_ORDER, POSITIONS, CONCEPTS, GROUP_NAMES, RANKS };
})();
