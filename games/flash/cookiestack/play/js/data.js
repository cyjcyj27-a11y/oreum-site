// 판 정보: 판마다 쌓을 층 수, 하늘 색, 블록 형광색, 속도. 높이는 여기서 한 번에 계산한다.
(function () {
  const D = (window.DATA = {});
  D.BH = 0.5;      // 블록 한 층 높이
  D.PH = 0.4;      // 판 사이 받침 두께
  D.W0 = 3;        // 처음 블록 폭
  D.RANGE = 3.7;   // 블록이 오가는 거리(가운데에서)
  // 모드: 속도 배율(k), 한 층마다 빨라지는 양(dv), PERFECT 범위(빠를수록 조금 너그럽게), PERFECT 때 넓어지는 양(g1, 연속 3번부터 g3 더)
  // tools/sim_modes.py 평균 손 봇(누르는 순간 0.05초 흔들림) 10판 한 번에: EASY 49% · NORMAL 3% · HARD 0%, 손이 정확한 봇(0.035초): 99% · 50% · 2%
  D.MODES = {
    easy: { name: 'EASY', k: 1.0, dv: 0.03, t0: 0.1, tv: 0.012, g1: 0.08, g3: 0.18 },
    normal: { name: 'NORMAL', k: 1.25, dv: 0.04, t0: 0.08, tv: 0.01, g1: 0.04, g3: 0.15 },
    hard: { name: 'HARD', k: 1.55, dv: 0.05, t0: 0.06, tv: 0.008, g1: 0, g3: 0.12 },
  };
  D.mode = 'easy';
  D.M = () => D.MODES[D.mode];
  D.perfectTol = (v) => D.M().t0 + v * D.M().tv; // 이만큼 안으로 맞추면 PERFECT
  // 하늘 위·가운데·아래 색, 블록 형광색 줄(층마다 돌아감), 밤이면 형광이 더 빛남
  D.STAGES = [
    { n: 10, ko: '골목 지붕', en: 'ROOFTOPS', sky: ['#7cc8f2', '#e6f6ff', '#c9f0c0'], neon: ['#ff3fa4', '#ff7a1a', '#ffe62e'], glow: 0.18, v: 2.6 },
    { n: 12, ko: '참새 하늘', en: 'SPARROW SKY', sky: ['#6abff0', '#dff3ff', '#bfe8ff'], neon: ['#ffe62e', '#7dff3a', '#18e8c0'], glow: 0.18, v: 2.8 },
    { n: 14, ko: '구름 아래', en: 'UNDER CLOUDS', sky: ['#5fb4ee', '#eef8ff', '#ffffff'], neon: ['#18e8ff', '#5b8cff', '#c45bff'], glow: 0.2, v: 3.0 },
    { n: 16, ko: '구름 위', en: 'ABOVE CLOUDS', sky: ['#4aa4ea', '#cfeaff', '#fffaf0'], neon: ['#ff4fd8', '#ff3fa4', '#ff7a1a'], glow: 0.2, v: 3.2 },
    { n: 18, ko: '열기구 길', en: 'BALLOON ROAD', sky: ['#5a9ee6', '#ffe9c8', '#ffd0a8'], neon: ['#3dff5a', '#ffe62e', '#ff7a1a'], glow: 0.22, v: 3.4 },
    { n: 20, ko: '노을', en: 'SUNSET', sky: ['#5a5fb8', '#ff9a7a', '#ffcf6a'], neon: ['#18e8ff', '#3dff8a', '#ffe62e'], glow: 0.3, v: 3.6 },
    { n: 22, ko: '무지개 다리', en: 'RAINBOW', sky: ['#3d3f98', '#b06ac8', '#ff8aa0'], neon: ['#ff3f6a', '#ffe62e', '#3dffd0'], glow: 0.4, v: 3.8 },
    { n: 24, ko: '별밤', en: 'STARRY NIGHT', sky: ['#0d1240', '#2a2a78', '#5a3a90'], neon: ['#3dff5a', '#18e8ff', '#ff4fd8'], glow: 0.62, v: 4.0 },
    { n: 26, ko: '우주', en: 'SPACE', sky: ['#05061a', '#121a4a', '#1e1a50'], neon: ['#ffe62e', '#ff7a1a', '#ff3fa4'], glow: 0.7, v: 4.2 },
    { n: 28, ko: '달', en: 'THE MOON', sky: ['#03040f', '#0e1238', '#24204e'], neon: ['#c45bff', '#18e8ff', '#7dff3a'], glow: 0.75, v: 4.4 },
  ];
  // 판마다 시작 높이(받침 윗면)
  let y = D.PH;
  D.STAGES.forEach((s, i) => { s.i = i; s.y0 = y; y += s.n * D.BH + D.PH; s.y1 = y - D.PH; });
  D.TOP = y; // 마지막 받침 윗면(달 바로 아래)
  D.total = D.STAGES.reduce((a, s) => a + s.n, 0);
  // 층 색: 판의 형광색 셋 사이를 부드럽게 돈다
  D.color = function (si, k) {
    const s = D.STAGES[si], c = s.neon, t = (k / 4) % c.length, a = Math.floor(t), f = t - a;
    const A = new THREE.Color(c[a]), B = new THREE.Color(c[(a + 1) % c.length]);
    return A.lerp(B, f);
  };
  D.speed = (si, k) => D.STAGES[si].v * D.M().k + k * D.M().dv;
})();
