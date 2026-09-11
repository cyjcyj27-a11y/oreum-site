/* fish.js — 물고기 종류·모양·헤엄·행동. 몸통은 회전체, 지느러미 판을 한 덩어리로 합쳐 셰이더로 구부린다 */
(function () {
  // tier 1 발밑에서 빈바늘에도 무는 고기 · 2 미끼를 걸어야 오는 고기 · 3 미끼 걸고 멀리 던져야 오는 대물 · 4 거대 참다랑어 — 다른 29종을 다 잡은 뒤에만 나타나고, 잡으면 엔딩(사장님, 2026-09-09)
  // stage(tier 1): 0 멸치 → 1 자리돔 → 2 각재기 → 3 정어리 → 4 고등어 → 5 나머지. 앞 것을 잡아야 다음이 나온다(사장님, 2026-09-09 "제일 먼저 발밑에서 잡히는 고기는 멸치, 그다음 자리돔 각재기 정어리 고등어 순")
  // len 은 cm, pull 은 당기는 힘(0~1), sta 는 체력(초), food 는 배부름, cut 은 미끼로 쓸 때 토막 수(자리돔 2토막부터 크기대로 늘어난다 — 사장님 2026-09-09), wt 는 나타날 확률 가중치, night 는 밤에만, dusk 는 밤에 잘 옴
  const SPECIES = [
    { id: 'anchovy', ko: '멸치', en: 'Anchovy', tier: 1, stage: 0, len: [8, 14], top: 0x3a5a78, belly: 0xe0eaf0, h: 0.9, w: 0.55, tail: 0.8, dorsal: 0.4, pull: 0.12, sta: 1.5, speed: 1.5, food: 20, cut: 2, wt: 2 },
    { id: 'damsel', ko: '자리돔', en: 'Damselfish', tier: 1, stage: 1, len: [10, 18], top: 0x3a3a48, belly: 0xb8b0c0, h: 1.5, w: 0.6, tail: 0.8, dorsal: 0.9, pull: 0.15, sta: 2, speed: 1.3, food: 24, cut: 3, wt: 3 },
    { id: 'scad', ko: '각재기', en: 'Horse Mackerel', tier: 1, stage: 2, len: [22, 38], top: 0x3a6a62, belly: 0xd6e4e6, h: 1.0, w: 0.7, tail: 1.0, dorsal: 0.5, pull: 0.28, sta: 3, speed: 1.9, food: 40, cut: 5, wt: 2.5 },
    { id: 'sardine', ko: '정어리', en: 'Sardine', tier: 1, stage: 3, len: [18, 28], top: 0x2a4f6e, belly: 0xd8e6ee, h: 1.05, w: 0.7, tail: 0.9, dorsal: 0.5, pull: 0.22, sta: 2.5, speed: 1.6, food: 32, cut: 4, wt: 3 },
    { id: 'mackerel', ko: '고등어', en: 'Mackerel', tier: 1, stage: 4, len: [30, 46], top: 0x1c5a78, belly: 0xcfe0e8, stripe: 1, h: 1.0, w: 0.75, tail: 1.1, dorsal: 0.45, pull: 0.34, sta: 4, speed: 2.1, food: 48, cut: 6, wt: 2 },
    { id: 'gizzard', ko: '전어', en: 'Gizzard Shad', tier: 1, stage: 5, len: [18, 26], top: 0x2f4f5f, belly: 0xdde8ea, h: 1.3, w: 0.6, tail: 0.9, dorsal: 0.5, pull: 0.2, sta: 2.5, speed: 1.6, food: 30, cut: 4, wt: 2 },
    { id: 'rockfish', ko: '볼락', en: 'Rockfish', tier: 1, stage: 5, len: [18, 30], top: 0x5a3428, belly: 0xd8b8a0, h: 1.5, w: 0.8, tail: 0.8, dorsal: 1.1, pull: 0.3, sta: 3.5, speed: 1.3, food: 36, cut: 4, wt: 1.2, dusk: 1 },
    { id: 'filefish', ko: '쥐치', en: 'Filefish', tier: 1, stage: 5, len: [15, 25], top: 0x8a7a4a, belly: 0xd8ccaa, h: 1.7, w: 0.45, tail: 0.7, dorsal: 1.4, pull: 0.22, sta: 3, speed: 1.0, food: 28, cut: 3, wt: 1.2 },
    { id: 'halfbeak', ko: '학공치', en: 'Halfbeak', tier: 1, stage: 5, len: [25, 40], top: 0x5a7a8a, belly: 0xe4ecee, h: 0.7, w: 0.5, tail: 0.9, dorsal: 0.3, bill: 1, pull: 0.24, sta: 3, speed: 2.2, food: 34, cut: 5, wt: 1.2 },
    { id: 'puffer', ko: '복어', en: 'Pufferfish', tier: 1, stage: 5, len: [20, 35], top: 0x6a6a5a, belly: 0xf0f0e0, h: 1.5, w: 1.4, tail: 0.6, dorsal: 0.3, blunt: 1, pull: 0.2, sta: 3, speed: 0.8, food: 26, cut: 4, wt: 1 },
    { id: 'cutlass', ko: '갈치', en: 'Cutlassfish', tier: 1, stage: 5, len: [70, 120], top: 0xaab8c4, belly: 0xe2eaee, h: 1.4, w: 0.25, tail: 0.25, dorsal: 0.8, pull: 0.36, sta: 5, speed: 1.8, food: 60, cut: 13, wt: 2, night: 1 },
    { id: 'bream', ko: '감성돔', en: 'Black Seabream', tier: 2, len: [30, 55], top: 0x2a2c32, belly: 0x9aa4aa, h: 1.6, w: 0.7, tail: 1.0, dorsal: 1.0, pull: 0.5, sta: 8, speed: 1.6, food: 85, cut: 6, wt: 1.5 },
    { id: 'beakfish', ko: '돌돔', en: 'Striped Beakfish', tier: 2, len: [30, 60], top: 0xc4c8cc, belly: 0xe4e6e8, stripe: 1, h: 1.6, w: 0.7, tail: 0.95, dorsal: 1.1, pull: 0.6, sta: 10, speed: 1.5, food: 95, cut: 7, wt: 1 },
    { id: 'opaleye', ko: '벵에돔', en: 'Opaleye', tier: 2, len: [30, 50], top: 0x2a3a3a, belly: 0x8a9a9a, h: 1.6, w: 0.7, tail: 1.0, dorsal: 1.0, pull: 0.5, sta: 8, speed: 1.6, food: 80, cut: 6, wt: 1.3 },
    { id: 'snapper', ko: '참돔', en: 'Red Snapper', tier: 2, len: [45, 80], top: 0xc8402e, belly: 0xf3c8b0, h: 1.65, w: 0.75, tail: 1.0, dorsal: 1.0, pull: 0.55, sta: 10, speed: 1.7, food: 110, cut: 9, wt: 2 },
    { id: 'flounder', ko: '광어', en: 'Flounder', tier: 2, len: [40, 70], top: 0x6a5a3a, belly: 0xe8e0d0, h: 0.5, w: 2.0, tail: 0.8, dorsal: 0.3, pull: 0.5, sta: 8, speed: 1.2, food: 115, cut: 8, wt: 1.2 },
    { id: 'seabass', ko: '농어', en: 'Sea Bass', tier: 2, len: [50, 90], top: 0x4a5a5c, belly: 0xd0d8d8, h: 1.2, w: 0.7, tail: 1.1, dorsal: 0.8, pull: 0.62, sta: 11, speed: 2.2, food: 125, cut: 10, wt: 1.5, dusk: 1 },
    { id: 'conger', ko: '붕장어', en: 'Conger Eel', tier: 2, len: [60, 100], top: 0x4a4a48, belly: 0xb8b0a0, h: 0.5, w: 0.45, tail: 0.3, dorsal: 0.3, pull: 0.55, sta: 9, speed: 1.4, food: 100, cut: 11, wt: 1, night: 1 },
    { id: 'spanish', ko: '삼치', en: 'Spanish Mackerel', tier: 2, len: [60, 100], top: 0x2a4a6a, belly: 0xcfd8de, h: 0.95, w: 0.6, tail: 1.3, dorsal: 0.6, pull: 0.66, sta: 11, speed: 3.2, food: 135, cut: 11, wt: 1.5 },
    { id: 'croaker', ko: '민어', en: 'Croaker', tier: 2, len: [60, 100], top: 0x6a6a5a, belly: 0xd8d0c0, h: 1.3, w: 0.8, tail: 1.0, dorsal: 0.8, pull: 0.6, sta: 10, speed: 1.8, food: 145, cut: 11, wt: 1 },
    { id: 'cod', ko: '대구', en: 'Cod', tier: 2, len: [50, 90], top: 0x6a5a48, belly: 0xd8d0c0, h: 1.3, w: 0.9, tail: 0.9, dorsal: 0.9, pull: 0.58, sta: 10, speed: 1.5, food: 135, cut: 10, wt: 1, dusk: 1 },
    { id: 'grouper', ko: '능성어', en: 'Grouper', tier: 2, len: [50, 90], top: 0x5a4a3a, belly: 0xc8b8a0, stripe: 1, h: 1.6, w: 1.0, tail: 0.9, dorsal: 1.0, pull: 0.7, sta: 12, speed: 1.3, food: 165, cut: 10, wt: 0.8 },
    { id: 'dorado', ko: '만새기', en: 'Mahi-mahi', tier: 2, len: [70, 125], top: 0x1f8a6a, belly: 0xf0c94a, h: 1.5, w: 0.6, tail: 1.3, dorsal: 1.3, blunt: 1, pull: 0.68, sta: 12, speed: 3.0, food: 155, cut: 13, wt: 1.5 },
    { id: 'yellowtail', ko: '방어', en: 'Yellowtail', tier: 2, len: [65, 105], top: 0x2b4a72, belly: 0xdde6ea, band: 1, h: 1.15, w: 0.8, tail: 1.2, dorsal: 0.5, pull: 0.78, sta: 13, speed: 2.6, food: 180, cut: 12, wt: 1.2 },
    { id: 'amberjack', ko: '부시리', en: 'Amberjack', tier: 2, len: [80, 130], top: 0x2a4a6a, belly: 0xdde6ea, band: 1, h: 1.1, w: 0.8, tail: 1.3, dorsal: 0.5, pull: 0.82, sta: 14, speed: 2.8, food: 195, cut: 14, wt: 1 },
    { id: 'sailfish', ko: '돛새치', en: 'Sailfish', tier: 3, len: [200, 300], top: 0x1a4a8a, belly: 0xc8d4dc, h: 1.0, w: 0.6, tail: 1.6, dorsal: 3.0, bill: 1, pull: 0.95, sta: 42, speed: 4.5, food: 300, cut: 0, wt: 1 },
    { id: 'tuna', ko: '참다랑어', en: 'Bluefin Tuna', tier: 3, len: [230, 300], top: 0x0e1a3c, belly: 0xc9d4dc, band: 0, h: 1.25, w: 1.05, tail: 1.5, dorsal: 0.55, finlet: 1, pull: 1.0, sta: 45, speed: 3.6, food: 400, cut: 0, wt: 2 },
    { id: 'marlin', ko: '청새치', en: 'Blue Marlin', tier: 3, len: [250, 350], top: 0x1a3a7a, belly: 0xc8d4dc, h: 1.1, w: 0.7, tail: 1.6, dorsal: 1.6, bill: 1, pull: 1.0, sta: 50, speed: 4.2, food: 550, cut: 0, wt: 1 },
    { id: 'swordfish', ko: '황새치', en: 'Swordfish', tier: 3, len: [250, 380], top: 0x2a3a4a, belly: 0xc8d0d8, h: 1.0, w: 0.7, tail: 1.6, dorsal: 1.8, bill: 1, pull: 1.0, sta: 50, speed: 4.0, food: 700, cut: 0, wt: 1 },
    { id: 'giant', ko: '거대 참다랑어', en: 'Giant Bluefin', tier: 4, len: [400, 480], top: 0x0a1430, belly: 0xc0ccd8, h: 1.3, w: 1.1, tail: 1.6, dorsal: 0.6, finlet: 1, pull: 1.0, sta: 80, speed: 3.2, food: 999, cut: 0, wt: 1 },
  ];
  const BY = {}; SPECIES.forEach(s => BY[s.id] = s);

  const vert = `
    uniform float uTime, uPhase, uAmp, uFreq, uFlop;
    varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN;
    void main() {
      vec3 p = position; vec3 n = normal;
      float w = clamp(0.5 - p.x, 0.0, 1.0);
      float s = sin(uTime * uFreq + uPhase - p.x * 5.5);
      p.z += s * uAmp * (0.12 + w * w * 1.4);
      // 갑판 위 퍼덕임 — 몸 전체가 x 축으로 뒤척인다
      if (uFlop > 0.0) { float a = sin(uTime * 14.0 + uPhase) * uFlop * 0.9; float c = cos(a), sn = sin(a); p.yz = vec2(p.y * c - p.z * sn, p.y * sn + p.z * c); n.yz = vec2(n.y * c - n.z * sn, n.y * sn + n.z * c); }
      vL = position; vLN = n;
      vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const frag = `
    precision highp float;
    uniform vec3 uTop, uBelly, uSunDir, uDeep, uCam, uLampPos; uniform float uNight, uLamp, uStripe, uBand, uAlpha;
    varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vLN;
    void main() {
      vec3 n = normalize(vN);
      float belly = smoothstep(-0.3, 0.35, vLN.y);
      vec3 col = mix(uBelly, uTop, belly);
      if (uStripe > 0.0) { float st = sin(vL.x * 42.0 + sin(vL.z * 26.0 + vL.y * 18.0) * 1.5) * 0.5 + 0.5; col = mix(col, col * 0.45, uStripe * smoothstep(0.45, 0.7, st) * smoothstep(0.1, 0.5, vLN.y)); }
      if (uBand > 0.0) { float b = smoothstep(0.1, 0.0, abs(vLN.y - 0.05)); col = mix(col, vec3(0.95, 0.8, 0.25), b * uBand * 0.8); }
      vec3 V = normalize(uCam - vW);
      float ndv = max(dot(n, V), 0.0);
      float day = clamp(uSunDir.y * 3.0 + 0.3, 0.0, 1.0);
      float l = 0.62 + 0.55 * max(dot(n, uSunDir), 0.0) * day;
      col *= l;
      col += vec3(0.7, 0.8, 0.9) * pow(1.0 - ndv, 3.0) * 0.45 * (1.0 - belly * 0.5);   // 은빛 비늘
      float under = step(vW.y, 0.02);
      float dep = clamp(-vW.y / 6.0, 0.0, 1.0);
      col = mix(col, uDeep, dep * 0.7 * under);
      float d = length(uCam - vW);
      col = mix(col, uDeep, smoothstep(9.0, 34.0, d) * 0.9 * under);
      col *= 1.0 - uNight * 0.7;
      if (uLamp > 0.0) { float ld = length(vW - uLampPos); col += vec3(1.0, 0.75, 0.4) * uLamp * 0.5 / (1.0 + ld * ld * 0.25) * (0.5 + 0.5 * belly); }
      gl_FragColor = vec4(col, uAlpha);
    }`;

  // ── 모양 ──
  function ring(pts, arr) { for (const p of pts) arr.push(p); }
  // 몸통: 길이 1 (머리 +0.5, 꼬리 -0.5). 단면은 타원 (w 좌우, h 위아래)
  function bodyGeo(sp) {
    const N = 26, M = 14, pos = [], nor = [];
    const prof = (t) => { // t 0 꼬리 → 1 머리, 반지름
      let r = Math.pow(Math.sin(Math.PI * t), sp.blunt ? 0.55 : 0.75) * 0.11;
      if (sp.blunt && t > 0.8) r *= 1.0 + (t - 0.8) * 1.6;          // 만새기 이마
      if (t < 0.1) r = Math.max(r, 0.012 + t * 0.15);                // 꼬리자루
      return r;
    };
    const P = (i, j) => { const t = i / N, a = j / M * Math.PI * 2; const r = prof(t); const x = t - 0.5; return [x, Math.sin(a) * r * sp.h, Math.cos(a) * r * sp.w]; };
    for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      ring([...a, ...b, ...c, ...a, ...c, ...d], pos);
      const nrm = (p) => { const t = (p[0] + 0.5), j2 = Math.atan2(p[1] / sp.h, p[2] / sp.w); const n = [0, Math.sin(j2) / sp.h, Math.cos(j2) / sp.w]; const dr = (prof(Math.min(1, t + 0.02)) - prof(Math.max(0, t - 0.02))) / 0.04; n[0] = -dr * 1.2; const L = Math.hypot(n[0], n[1], n[2]) || 1; return [n[0] / L, n[1] / L, n[2] / L]; };
      [a, b, c, a, c, d].forEach(p => ring(nrm(p), nor));
    }
    return { pos, nor };
  }
  function fin(pts, pos, nor, flip) { // 두께 없는 판 (양면)
    const [a, b, c] = pts; const n = flip ? [0, 0, -1] : [0, 0, 1];
    ring([...a, ...b, ...c], pos); ring([...n, ...n, ...n], nor);
    ring([...a, ...c, ...b], pos); ring([...n, ...n, ...n], nor);
  }
  function build(sp) {
    const { pos, nor } = bodyGeo(sp);
    const T = sp.tail * 0.13, ty = T * 1.15;
    fin([[-0.5, 0, 0], [-0.5 - T * 1.1, ty, 0], [-0.5 - T * 0.35, 0, 0]], pos, nor);      // 꼬리 위
    fin([[-0.5, 0, 0], [-0.5 - T * 0.35, 0, 0], [-0.5 - T * 1.1, -ty, 0]], pos, nor);    // 꼬리 아래
    const D = sp.dorsal;
    if (sp.blunt) fin([[0.32, 0.1 * sp.h, 0], [-0.3, 0.09 * sp.h + 0.09 * D, 0], [-0.42, 0.03, 0]], pos, nor);
    else fin([[0.1, 0.1 * sp.h, 0], [-0.05, 0.1 * sp.h + 0.12 * D, 0], [-0.25, 0.06 * sp.h, 0]], pos, nor);
    fin([[-0.2, -0.09 * sp.h, 0], [-0.32, -0.09 * sp.h - 0.06, 0], [-0.4, -0.04, 0]], pos, nor);   // 뒷지느러미
    // 가슴지느러미 (좌우, 옆으로)
    for (const s of [1, -1]) { const z = 0.1 * sp.w * s; const a = [0.2, -0.02, z], b = [0.02, -0.06, z + 0.09 * s], c = [0.06, 0.01, z + 0.04 * s]; fin(s > 0 ? [a, b, c] : [a, c, b], pos, nor, s < 0); }
    if (sp.bill) { fin([[0.46, 0.014, 0], [0.8, 0, 0], [0.46, -0.014, 0]], pos, nor); fin([[0.46, 0, 0.014], [0.8, 0, 0], [0.46, 0, -0.014]], pos, nor); }   // 청새치 부리
    if (sp.finlet) for (let i = 0; i < 5; i++) { const x = -0.22 - i * 0.05; fin([[x, 0.07, 0], [x - 0.02, 0.1, 0], [x - 0.035, 0.065, 0]], pos, nor); fin([[x, -0.07, 0], [x - 0.035, -0.065, 0], [x - 0.02, -0.1, 0]], pos, nor); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    return g;
  }
  const GEO = {}; const geoOf = sp => GEO[sp.id] || (GEO[sp.id] = build(sp));
  const eyeGeo = new THREE.SphereGeometry(0.018, 8, 6), eyeMat = new THREE.MeshBasicMaterial({ color: 0x08080c });

  function makeMaterial(sp, shared) {
    const jit = (h, k) => { const c = new THREE.Color(h); c.offsetHSL((Math.random() - .5) * .03, (Math.random() - .5) * .1, (Math.random() - .5) * k); return c; };
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: shared.uTime, uSunDir: shared.uSunDir, uDeep: shared.uDeep, uCam: shared.uCam, uNight: shared.uNight, uLamp: shared.uLamp, uLampPos: shared.uLampPos,
        uPhase: { value: Math.random() * 6.28 }, uAmp: { value: 0.05 }, uFreq: { value: 6 }, uFlop: { value: 0 }, uAlpha: { value: 1 },
        uTop: { value: jit(sp.top, .06) }, uBelly: { value: jit(sp.belly, .04) }, uStripe: { value: sp.stripe || 0 }, uBand: { value: sp.band || 0 },
      }, vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, transparent: false,
    });
  }

  const V = THREE.Vector3;
  function init(scene, sea, cb) {
    const shared = sea.U;
    const fishes = [];
    let nextId = 1;
    const F = {
      fishes, SPECIES, BY, active: null, night: false, stage: 0, giantOK: false,   // stage·giantOK 는 game 이 도감을 보고 넣어 준다
      // 등급 안에서 가중치로 한 종을 뽑는다 — 밤에만 오는 놈(night), 밤에 잘 오는 놈(dusk)
      pick(tier) {
        const c = SPECIES.filter(sp => sp.tier === tier && (tier !== 1 || (sp.stage || 0) <= F.stage)); let tot = 0; const w = c.map(sp => { let k = sp.wt || 1; if (sp.night) k *= F.night ? 3 : 0; if (sp.dusk) k *= F.night ? 2 : 0.6; tot += k; return k; });
        let r = Math.random() * tot; for (let i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i].id; } return c[0].id;
      },
      // 도감용 그림 — 따로 만든 작은 캔버스에 한 마리를 옆모습으로 찍어 그림 주소로 돌려준다
      thumb(spId) {
        if (!F._th) { const cv = document.createElement('canvas'); cv.width = 480; cv.height = 240; const r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setClearColor(0x000000, 0); r.outputColorSpace = THREE.SRGBColorSpace; const cam = new THREE.OrthographicCamera(-0.72, 0.72, 0.36, -0.36, 0.1, 10); cam.position.set(0, 1.6, 4); cam.lookAt(0, 1.5, 0); F._th = { r, cam, cv, cache: {} }; }
        const th = F._th; if (th.cache[spId]) return th.cache[spId];
        const sp = BY[spId]; const sc = new THREE.Scene();
        const sh = { uTime: { value: 0 }, uSunDir: { value: new V(0.5, 0.7, 0.6).normalize() }, uDeep: { value: new THREE.Color(0x0a2a3a) }, uCam: { value: th.cam.position.clone() }, uNight: { value: 0 }, uLamp: { value: 0 }, uLampPos: { value: new V() } };
        const mat = makeMaterial(sp, sh); mat.uniforms.uAmp.value = 0;
        const grp = new THREE.Group(); grp.add(new THREE.Mesh(geoOf(sp), mat));
        for (const s of [1, -1]) { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(0.36, 0.025 * sp.h, 0.075 * sp.w * s); grp.add(e); }
        const wide = 1 + (sp.tail || 1) * 0.15 + (sp.bill ? 0.3 : 0); grp.scale.setScalar(1.15 / wide); grp.position.set(sp.bill ? -0.08 : 0.02, 1.5, 0); grp.rotation.set(0.12, -0.42, 0); sc.add(grp);
        th.r.render(sc, th.cam); const url = th.cv.toDataURL('image/png'); mat.dispose(); th.cache[spId] = url; return url;
      },
      spawn(spId, opt) {
        const sp = BY[spId]; opt = opt || {};
        const len = (opt.len || (sp.len[0] + Math.random() * (sp.len[1] - sp.len[0]))) / 100;
        const mat = makeMaterial(sp, shared);
        const grp = new THREE.Group(); const body = new THREE.Mesh(geoOf(sp), mat); grp.add(body);
        for (const s of [1, -1]) { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(0.36, 0.025 * sp.h, 0.075 * sp.w * s); e.scale.setScalar(sp.blunt ? 1.2 : 1); grp.add(e); }
        grp.scale.setScalar(len);
        const a = opt.angle == null ? Math.random() * Math.PI * 2 : opt.angle, r = opt.r == null ? 6 + Math.random() * 14 : opt.r;
        const depth = opt.depth == null ? F.depthFor(sp) : opt.depth;
        const f = { id: nextId++, sp, len, grp, mat, u: mat.uniforms, pos: new V(Math.cos(a) * r, -depth, Math.sin(a) * r), vel: new V(), yaw: Math.random() * Math.PI * 2, pitch: 0,
          state: 'wander', t: 0, tgt: new V(), retgt: 0, nib: 0, nibT: 0, speed: sp.speed * (0.8 + Math.random() * 0.4), alive: true, school: opt.school || 0, seen: false };
        f.tgt.copy(f.pos); grp.position.copy(f.pos); scene.add(grp); fishes.push(f); return f;
      },
      depthFor(sp) { return sp.tier === 1 ? 0.3 + Math.random() * 0.9 : sp.tier === 2 ? 0.5 + Math.random() * 1.6 : sp.tier === 4 ? 2.0 + Math.random() * 1.0 : 0.55 + Math.random() * 0.9; },
      schoolSp() { return F.stage === 0 ? 'anchovy' : F.stage < 3 ? 'damsel' : 'sardine'; },   // 무리 지어 다니는 기본 고기: 멸치 → 자리돔 → 정어리
      remove(f) { f.alive = false; scene.remove(f.grp); f.mat.dispose(); const i = fishes.indexOf(f); if (i >= 0) fishes.splice(i, 1); if (F.active === f) F.active = null; },
      count(tier) { let n = 0; for (const f of fishes) if (f.sp.tier === tier && f.state !== 'caught') n++; return n; },
      // 뗏목 근처를 어슬렁대는 기본 무리
      populate() {
        for (let i = 0; i < 7; i++) F.spawn(F.schoolSp(), { school: 1 });
        for (let i = 0; i < 3; i++) F.spawn(F.pick(1));
      },
      newTarget(f, ctx) {
        const sp = f.sp; let r, a;
        // 물속에 미끼가 있으면 절반쯤은 그 언저리로 모여든다 (멀리 던져도 고기가 온다)
        if (ctx.hook && Math.random() < 0.55 && F.eligible(f, ctx.baitTier) && (sp.tier > 1 || Math.random() < 0.7)) { const rr = 2 + Math.random() * 6, aa = Math.random() * Math.PI * 2; f.tgt.set(ctx.hook.x + Math.cos(aa) * rr, -F.depthFor(sp), ctx.hook.z + Math.sin(aa) * rr); f.retgt = 2 + Math.random() * 3 + f.pos.distanceTo(f.tgt) / (f.speed * 0.7); return; }   // 찌까지 갈 시간은 준다
        if (f.school) { r = 4 + Math.random() * 12; a = ctx.time * 0.15 + Math.random() * 1.2; } else { r = (sp.tier === 3 ? 6 : 3) + Math.random() * (sp.tier === 1 ? 18 : 22); a = Math.random() * Math.PI * 2; }
        f.tgt.set(Math.cos(a) * r, -F.depthFor(sp), Math.sin(a) * r); f.retgt = 2 + Math.random() * 4;
      },
      // ctx: { dt, time, hook: Vector3|null (물속 바늘), baitTier, raft: Vector3, allowBite: bool }
      update(ctx) {
        const dt = ctx.dt; F.night = !!ctx.night;
        for (let i = fishes.length - 1; i >= 0; i--) {
          const f = fishes[i]; f.t += dt; const sp = f.sp, u = f.u;
          if (f.state === 'wander' || f.state === 'flee') {
            f.retgt -= dt; if (f.retgt <= 0) F.newTarget(f, ctx);
            if (f.state === 'flee') { f.tgt.copy(f.pos).multiplyScalar(3); f.tgt.y = -4; if (f.pos.length() > 40) { F.remove(f); continue; } }
            // 바늘에 끌림 — 물속 바늘이 있고, 미끼 등급이 맞고, 아직 아무도 안 붙었을 때
            if (f.state === 'wander' && ctx.hook && ctx.allowBite && !F.active && F.eligible(f, ctx.baitTier)) {
              const d = f.pos.distanceTo(ctx.hook);
              if (d < (sp.tier >= 3 ? 26 : sp.tier === 2 ? 20 : 16) && Math.random() < dt * F.biteRate(f, ctx)) { f.state = 'approach'; F.active = f; if (cb.onInterest) cb.onInterest(f); }
            }
            F.steer(f, f.tgt, f.state === 'flee' ? f.speed * 2.2 : f.speed * (f.school ? 0.9 : 0.7), dt);
          } else if (f.state === 'approach') {
            if (!ctx.hook) { f.state = 'wander'; F.active = null; }
            else { const tg = ctx.hook.clone(); tg.y -= 0.25 + f.len * 0.2; F.steer(f, tg, f.speed * 0.9, dt); if (f.pos.distanceTo(tg) < 0.5 + f.len * 0.4) { f.state = 'nibble'; f.nib = 1 + Math.floor(Math.random() * 3); f.nibT = 0.6 + Math.random() * 0.8; } }
          } else if (f.state === 'nibble') {
            if (!ctx.hook) { f.state = 'wander'; F.active = null; }
            else {
              const tg = ctx.hook.clone(); tg.y -= 0.2 + f.len * 0.25; tg.x += Math.sin(f.t * 2.3) * (0.3 + f.len * 0.3); tg.z += Math.cos(f.t * 1.7) * (0.3 + f.len * 0.3);
              F.steer(f, tg, f.speed * 0.5, dt);
              f.nibT -= dt;
              if (f.nibT <= 0) {
                if (f.nib > 0) { f.nib--; f.nibT = 0.9 + Math.random() * 1.1; if (cb.onNibble) cb.onNibble(f); }
                else { f.state = 'bite'; f.t = 0; if (cb.onBite) cb.onBite(f); }
              }
            }
          } else if (f.state === 'bite') {
            if (ctx.hook) { const tg = ctx.hook.clone(); tg.y -= 0.1 + f.len * 0.2; f.pos.lerp(tg, Math.min(1, dt * 8)); }
            f.yaw += Math.sin(f.t * 20) * dt * 2;
          } else if (f.state === 'hooked') {
            // 자리는 game 이 정해 준다 (f.fightPos). 몸부림만
            const tg = f.fightPos || f.pos; f.pos.lerp(tg, Math.min(1, dt * 6));
            const th = f.thrash || 0; f.yaw += Math.sin(f.t * (9 + th * 8)) * dt * (2.5 + th * 5);
            f.pitch = Math.sin(f.t * 5) * 0.25 * th;
          } else if (f.state === 'caught') {
            // 갑판 위 — game 이 pos 를 놓는다
            u.uFlop.value = Math.max(0, (f.flop || 0)); f.flop = (f.flop || 0) - dt * 0.35;
          }
          // 헤엄 진폭·빠르기
          const sp2 = f.vel.length();
          const act = f.state === 'hooked' ? 1.6 : f.state === 'flee' ? 1.4 : 0.6 + sp2 * 0.35;
          u.uAmp.value = f.state === 'caught' ? 0.02 : 0.045 * act; u.uFreq.value = f.state === 'caught' ? 3 : (4 + act * 3) * (sp.tier >= 3 ? 0.7 : 1);
          if (f.state !== 'caught') {
            f.grp.position.copy(f.pos); f.grp.rotation.set(0, 0, 0); f.grp.rotation.y = -f.yaw + Math.PI / 2; f.grp.rotateZ(f.pitch);
            if (f.pos.y > 0.05 && f.state !== 'hooked') f.pos.y = 0.05;
          }
        }
      },
      steer(f, tgt, speed, dt) {
        const d = tgt.clone().sub(f.pos); const L = d.length(); if (L < 0.05) return;
        const wantYaw = Math.atan2(d.z, d.x); let dy = wantYaw - f.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        const turn = (f.sp.tier >= 3 ? 1.6 : 3.2) * dt; f.yaw += Math.max(-turn, Math.min(turn, dy));
        const wantPitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); f.pitch += (Math.max(-0.5, Math.min(0.5, wantPitch)) - f.pitch) * Math.min(1, dt * 3);
        const v = new V(Math.cos(f.yaw), 0, Math.sin(f.yaw)).multiplyScalar(speed); v.y = Math.sin(f.pitch) * speed;
        f.vel.lerp(v, Math.min(1, dt * 2)); f.pos.addScaledVector(f.vel, dt);
        if (f.pos.y > -0.15) f.pos.y = -0.15; if (f.pos.y < -7) f.pos.y = -7;
      },
      eligible(f, baitTier) { const t = f.sp.tier; if (baitTier <= 0) return t === 1; if (baitTier === 1) return t <= 2; return t >= 2; },   // 빈바늘은 작은 고기만 문다
      // 낚시의 이치: 작은 고기는 발밑에서 쉽게, 큰 고기는 미끼를 걸고 멀리 던져야 온다
      hookDist(ctx) { return ctx.hook ? Math.hypot(ctx.hook.x - ctx.raft.x, ctx.hook.z - ctx.raft.z) : 0; },
      biteRate(f, ctx) {
        const t = f.sp.tier, b = ctx.baitTier, hd = F.hookDist(ctx);
        let r = t === 1 ? (b === 0 ? 0.11 : 0.03) : t === 2 ? (b === 1 ? 0.16 : b === 2 ? 0.07 : 0) : 0.16;
        if (t === 1) r *= hd < 10 ? 1.6 : hd < 18 ? 1 : 0.5;                       // 작은 고기는 뗏목 근처가 잘 물지만 멀리서도 온다
        else if (t === 2) r *= hd < 10 ? 0.3 : hd < 14 ? 0.6 : 1;                   // 좋은 고기는 미끼 걸고 멀리 던져야 잘 오지만, 발밑에서도 어쩌다 온다 — 낚시는 알 수 없다
        else r *= hd < 16 ? 0 : hd < 20 ? 0.3 : 1;                                  // 참치는 20m 밖
        return r * (ctx.night ? 0.7 : 1);
      },
      // 미끼 등급에 따라 큰 놈을 불러온다 (멀리서 나타나 다가온다)
      lure(baitTier, ctx) {
        const hk = ctx && ctx.hook; const hd = hk ? Math.hypot(hk.x, hk.z) : 0, ha = hk ? Math.atan2(hk.z, hk.x) : Math.random() * Math.PI * 2;
        const beyond = (extra) => ({ r: Math.max(22, hd + 4 + Math.random() * 5 + extra), angle: ha + (Math.random() - .5) * 1.0 });   // 찌 너머에서 나타나 찌 쪽으로 온다
        const toward = (f) => { if (!hk) return; const rr = 1.5 + Math.random() * 3, aa = Math.random() * Math.PI * 2; f.tgt.set(hk.x + Math.cos(aa) * rr, -F.depthFor(f.sp), hk.z + Math.sin(aa) * rr); f.retgt = 3 + f.pos.distanceTo(f.tgt) / (f.speed * 0.7); };
        if (baitTier >= 1 && F.count(2) < 2 && Math.random() < 0.6) toward(F.spawn(F.pick(2), beyond(0)));
        if (baitTier >= 2 && F.count(3) < 1 && Math.random() < 0.6) toward(F.spawn(F.pick(3), Object.assign(beyond(6), { depth: 1.2 })));
        if (baitTier >= 2 && F.giantOK && F.count(4) < 1 && Math.random() < 0.7) toward(F.spawn('giant', Object.assign(beyond(12), { depth: 2.4 })));   // 마지막: 거대 참다랑어 — 도감 29종을 다 채운 뒤에만
      },
      // 가끔 지나가는 구경거리 — 미끼 없어도 좋은 물고기가 스쳐간다
      passerby() { if (F.count(2) < 1 && Math.random() < 0.5) F.spawn(F.pick(2), { r: 16 + Math.random() * 8 }); },
      keepPopulation(hook) { if (F.count(1) < 8 && Math.random() < 0.6) { const o = { r: 18 + Math.random() * 6, school: Math.random() < 0.7 ? 1 : 0 }; if (hook) { const hd = Math.hypot(hook.x, hook.z); o.r = Math.max(4, hd + (Math.random() - .5) * 8); o.angle = Math.atan2(hook.z, hook.x) + (Math.random() - .5) * 0.5; } F.spawn(Math.random() < 0.45 ? F.schoolSp() : F.pick(1), o); } },
    };
    return F;
  }
  window.FISH = { init, SPECIES, BY };
})();
