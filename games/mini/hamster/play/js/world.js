// 세상: 줄(레인) 만들기·그리기·움직이는 것·카메라. 줄 번호 r 은 z = -r 자리.
(function () {
  const W = (window.WORLD = {});
  const T = THREE, M = MDL;
  const WR = DATA.WRAP, COLS = DATA.COLS;

  // 같은 판은 늘 같은 모양(다시 해도 같은 길) — 씨앗 있는 난수
  function rng(seed) { let s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const R = (r, a, b) => a + r() * (b - a);

  const LENS = { toycar: 1.5, truck: 2.4, robot: 0.95, mower: 1.5, bigball: 0.95, car: 2.8, van: 3.4, dog: 1.6 };
  const FLOAT = { kitchen: ['biscuit'], yard: ['leaf'], park: ['lily', 'lily', 'duck'] };

  // ---------- 판 짜기 ----------
  W.lanes = new Map();      // 줄 번호 → 줄 정보
  W.stageRow = [];          // 판마다 첫 줄
  W.homeRow = [];           // 판마다 은신처 줄
  W.endRow = 0;             // 엔딩 밭 도착 줄
  function put(r, o) { o.r = r; o.obs = o.obs || new Set(); o.deco = o.deco || []; o.seeds = o.seeds || new Map(); o.items = o.items || []; W.lanes.set(r, o); return o; }

  function fillItems(lane, kinds, lenOf, gapR, rnd) {
    for (let tries = 0; tries < 20; tries++) {
      const its = []; let sumL = 0, sumG = 0;
      while (sumL + sumG < WR * 2 - 1) { const k = kinds[Math.floor(rnd() * kinds.length)], L = lenOf(k), g = R(rnd, gapR[0], gapR[1]); its.push({ kind: k, len: L, gap: g }); sumL += L; sumG += g; }
      if (its.length > 1 && sumL + sumG > WR * 2) { const last = its.pop(); sumL -= last.len; sumG -= last.gap; }
      const k = (WR * 2 - sumL) / sumG;
      if (its.length && its.every((it) => it.gap * k >= gapR[0] * 0.85)) {
        let x = -WR + R(rnd, 0, 2);
        for (const it of its) { it.x = x + it.len / 2; x += it.len + it.gap * k; it.col = M.PAST[Math.floor(rnd() * 6)]; }
        lane.items = its; return;
      }
    }
    lane.items = [{ kind: kinds[0], len: lenOf(kinds[0]), x: 0, col: M.PAST[0] }];
  }

  W.build = function () {
    W.lanes.clear(); W.stageRow = []; W.homeRow = [];
    // 출발: 뒤로 철망 우리(빠져나온 곳)
    for (let r = -8; r <= 0; r++) put(r, { type: r === -1 ? 'cage' : 'safe', z: 0, stage: 0, shade: r & 1 });
    let r = 1;
    for (let s = 0; s < DATA.STAGES; s++) {
      const st = DATA.stage(s), zn = st.zone, rnd = rng(1000 + s * 7919);
      W.stageRow[s] = r;
      const end = r + st.len - 1;
      let spine = 0, prevSpine = 0;
      const kinds = zn.kinds;
      let lastDir = rnd() < 0.5 ? 1 : -1;
      // 처음 두 줄은 쉼
      const plan = [];
      plan.push('safe', 'safe');
      while (plan.length < st.len - 2) {
        const u = rnd(); let t = 'road';
        if (u < kinds.water) t = 'water'; else if (u < kinds.water + kinds.rail) t = 'rail';
        let n = t === 'rail' ? 1 : t === 'water' ? 1 + Math.floor(rnd() * Math.min(3, 2 + s / 4)) : 1 + Math.floor(rnd() * Math.min(zn.id === 'alley' ? 3 : 4, 2 + s / 3));
        for (let i = 0; i < n && plan.length < st.len - 2; i++) plan.push(t);
        const rest = 1 + (rnd() < 0.45 - s * 0.03 ? 1 : 0) + (s < 2 && rnd() < 0.4 ? 1 : 0);
        for (let i = 0; i < rest && plan.length < st.len - 2; i++) plan.push('safe');
      }
      plan.push('safe');
      for (let i = 0; i < plan.length; i++, r++) {
        const t = plan[i];
        const ln = put(r, { type: t, z: st.z, stage: s, shade: r & 1, zone: zn });
        if (t === 'safe') {
          prevSpine = spine;
          if (rnd() < 0.5) spine = Math.max(-COLS + 1, Math.min(COLS - 1, spine + (rnd() < 0.5 ? -1 : 1)));
          const dens = 0.16 + s * 0.012;
          for (let c = -COLS; c <= COLS; c++) if (c !== spine && c !== prevSpine && rnd() < dens) ln.obs.add(c);
          if (ln.obs.size > 6) ln.obs.delete([...ln.obs][0]);
          if (rnd() < 0.5) { const free = []; for (let c = -COLS; c <= COLS; c++) if (!ln.obs.has(c)) free.push(c); ln.seeds.set(free[Math.floor(rnd() * free.length)], rnd() < 0.08 ? 'gold' : 'seed'); }
        } else if (t === 'road') {
          lastDir = rnd() < 0.7 ? -lastDir : lastDir; ln.dir = lastDir;
          ln.speed = R(rnd, st.sp[0], st.sp[1]);
          const big = zn.id === 'alley';
          if (big) ln.speed *= 1.05;
          if (zn.id === 'kitchen') ln.speed *= 0.75;
          const g = big ? [st.gap[0] + 2.4, st.gap[1] + 3.4] : st.gap;
          fillItems(ln, zn.mov.map((k) => (k === 'toycar' && rnd() < 0 ? k : k)).concat(zn.id === 'yard' ? ['bigball'] : zn.id === 'park' ? ['dog', 'bigball', 'dog'] : []), (k) => LENS[k], g, rnd);
        } else if (t === 'rail') {
          ln.dir = rnd() < 0.5 ? 1 : -1;
          const sub = zn.id === 'alley';
          ln.train = { kind: sub ? 'subway' : 'woodtrain', len: sub ? 13.2 : 8.5, speed: sub ? 17 : 10, col: 0 };
          ln.items = []; ln.next = R(rnd, 1.5, 4); ln.warn = 0;
        } else if (t === 'water') {
          lastDir = -lastDir; ln.dir = lastDir;
          ln.speed = R(rnd, 0.7, 1.15) * (0.9 + s * 0.08);
          const fk = FLOAT[zn.id] || ['biscuit'];
          fillItems(ln, fk, (k) => k === 'duck' ? 1.5 : k === 'lily' ? (rnd() < 0.5 ? 1.1 : 2.2) : Math.round(R(rnd, st.floatLen[0], st.floatLen[1])), [1.0 + s * 0.06, 2.4 + s * 0.08], rnd);
        }
      }
      W.homeRow[s] = r;
      put(r, { type: 'home', z: st.z, stage: s, shade: 0, zone: zn });
      r++;
    }
    for (let i = 0; i < 30; i++, r++) put(r, { type: 'field', z: 4, stage: DATA.STAGES, shade: r & 1 });
    // 막다른 칸 없애기: 쉼 줄의 빈 칸 덩어리마다 위 줄로 나갈 칸이 하나는 있게(뒤에서부터 거꾸로)
    for (let q = r - 1; q >= 0; q--) {
      const ln = W.lanes.get(q), nx = W.lanes.get(q + 1);
      if (!ln || !W.walkable(ln) || !nx || !W.walkable(nx)) continue;
      let c = -COLS;
      while (c <= COLS) {
        if (ln.obs.has(c)) { c++; continue; }
        const a = c; while (c <= COLS && !ln.obs.has(c)) c++;
        let ok = false; for (let k = a; k < c; k++) if (!nx.obs.has(k)) ok = true;
        if (!ok) nx.obs.delete(a + Math.floor((c - a) / 2));
      }
    }
    W.endRow = W.homeRow[DATA.STAGES - 1] + 7;
    // 걸을 수 없는 바깥(-14~-5, 5~14) 장식
    W.lanes.forEach((ln) => {
      const rnd = rng(77 + ln.r * 131);
      const zn = DATA.ZONES[Math.min(4, ln.z)];
      if (ln.type === 'safe' || ln.type === 'home') for (let c = -12; c <= 12; c++) if (Math.abs(c) > COLS && rnd() < 0.42) ln.deco.push([c, zn.obs[Math.floor(rnd() * zn.obs.length)]]);
      if (ln.type === 'field') {
        const wall = ln.r > W.endRow + 1; // 도착 줄 너머는 해바라기 숲
        for (let c = -12; c <= 12; c++) {
          const a = Math.abs(c);
          if (wall ? rnd() < 0.9 : a > COLS ? rnd() < 0.9 : a > 1 && rnd() < 0.3) ln.deco.push([c, wall || a > 2 ? 'sunflower' : 'flower']);
        }
      }
    });
  };
  W.stageOf = (r) => { for (let s = DATA.STAGES - 1; s >= 0; s--) if (r >= W.stageRow[s]) return s; return 0; };

  // ---------- 그리기 ----------
  let scene, camera, renderer, sun, hemi, rowRoot;
  W.init = function (canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = T.SRGBColorSpace;
    scene = new T.Scene();
    scene.background = new T.Color(DATA.ZONES[0].sky); scene.fog = new T.Fog(DATA.ZONES[0].fog, 20, 42);
    camera = new T.PerspectiveCamera(34, 1, 0.5, 120);
    hemi = new T.HemisphereLight(0xffffff, 0xcfb89a, 1.25); scene.add(hemi);
    sun = new T.DirectionalLight(0xfff0d8, 1.9); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 50;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    scene.add(sun); scene.add(sun.target);
    rowRoot = new T.Group(); scene.add(rowRoot);
    W.scene = scene; W.camera = camera; W.renderer = renderer;
    W.resize();
  };
  W.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };

  // 줄 색
  const ROAD = { room: 0x8fb4d8, kitchen: 0xa6b0b8, yard: 0x6fae4c, alley: 0x55565c, park: 0xc98a6a };
  const WATER = { kitchen: 0x9a5e3a, yard: 0x5ab8d8, park: 0x46a6b0 };
  function shade(c, k) { const o = new T.Color(c); o.multiplyScalar(k); return o.getHex(); }
  function groundColor(ln) {
    const zn = DATA.ZONES[Math.min(4, ln.z)];
    if (ln.type === 'field') return ln.shade ? 0x9ad66a : 0x8ccc5c;
    if (ln.type === 'home') return 0xf2dcae;
    return zn.safe[ln.shade];
  }

  function rowParts(ln) {
    const p = new M.Parts(), wp = new M.Parts(), zn = DATA.ZONES[Math.min(4, ln.z)], id = zn.id, B = M.box();
    const rnd = rng(9 + ln.r * 31);
    const strip = (c, top, h, side) => {
      p.add(B, c, [0, top - h / 2, 0], 0, [COLS * 2 + 1, h, 1]);
      p.add(B, shade(c, side || 0.74), [-(COLS + 0.5 + 5), top - h / 2, 0], 0, [10, h, 1]).add(B, shade(c, side || 0.74), [COLS + 0.5 + 5, top - h / 2, 0], 0, [10, h, 1]);
      p.add(B, shade(c, 0.7), [-(COLS + 0.5 + 10 + 4), top - h / 2, 0], 0, [8, h, 1]).add(B, shade(c, 0.78), [COLS + 0.5 + 10 + 4, top - h / 2, 0], 0, [8, h, 1]);
    };
    if (ln.type === 'safe' || ln.type === 'home' || ln.type === 'field' || ln.type === 'cage') {
      const c = ln.type === 'cage' ? 0xf2dcae : groundColor(ln);
      strip(c, 0, 0.6);
      if (id === 'kitchen' && ln.type === 'safe') for (let x = -13.5; x <= 13.5; x += 1) p.add(B, 0xc8cfd2, [x, 0.003, 0], 0, [0.04, 0.01, 1]);
      if (id === 'alley' && ln.type === 'safe') { for (let x = -13.5; x <= 13.5; x += 1) p.add(B, 0xb2a594, [x, 0.003, 0], 0, [0.05, 0.01, 1]); p.add(B, 0xb2a594, [0, 0.003, 0.48], 0, [28, 0.01, 0.05]); }
      if ((id === 'yard' || id === 'park' || ln.type === 'field') && ln.type !== 'home') for (let i = 0; i < 18; i++) p.add(M.cone(4), shade(c, 0.85), [R(rnd, -13, 13), 0.06, R(rnd, -0.45, 0.45)], 0, [0.05, 0.13, 0.05]);
      if (id === 'room' && ln.type === 'safe') for (let x = -13; x <= 13; x += 2) p.add(M.sph(6), shade(c, 1.06), [x + (ln.r & 1), 0.005, 0], 0, [0.18, 0.012, 0.18]);
      if (ln.type === 'home') {
        // 톱밥 + 양쪽 은신처(나무 집·휴지심 굴)
        for (let i = 0; i < 60; i++) p.add(B, [0xe8c890, 0xd8b070, 0xf6e2b8][i % 3], [R(rnd, -13, 13), 0.01, R(rnd, -0.45, 0.45)], [0, R(rnd, 0, 3), 0], [0.18, 0.02, 0.08]);
        for (const s of [-1, 1]) {
          const x = s * (COLS + 1.6);
          p.add(M.rbox(1.4, 0.9, 1.0, 0.06, 1), 0xc8925a, [x, 0.45, 0]).add(M.box(), 0xa8703a, [x - 0.36, 1.08, 0], [0, 0, 0.62], [0.95, 0.07, 1.1]).add(M.box(), 0xa8703a, [x + 0.36, 1.08, 0], [0, 0, -0.62], [0.95, 0.07, 1.1]).add(M.cyl(0.24, 0.24, 16), 0x3a2414, [x, 0.36, -0.49], [Math.PI / 2, 0, 0], [1, 0.03, 1]);
          p.add(M.cyl(0.42, 0.42, 20), 0xf4ead8, [x + s * 1.6, 0.42, 0], [Math.PI / 2, 0, 0], [1, 0.95, 1]).add(M.cyl(0.36, 0.36, 20), 0x6a5a48, [x + s * 1.6, 0.42, 0], [Math.PI / 2, 0, 0], [1, 0.97, 1]);
          // 깃발
          p.add(M.cyl(0.03, 0.03, 6), 0xffffff, [s * (COLS + 0.55), 0.7, 0], 0, [1, 1.4, 1]).add(M.box(), 0xff5a6a, [s * (COLS + 0.55) + 0.2, 1.22, 0], 0, [0.38, 0.26, 0.02]);
        }
      }
      if (ln.type === 'cage') {
        for (let x = -13; x <= 13; x += 0.26) if (Math.abs(x) > 0.5) p.add(M.cyl(0.02, 0.02, 5), 0xe4e8ec, [x, 0.5, 0], 0, [1, 0.9, 1]);
        p.add(B, 0xd0d6dc, [0, 0.95, 0], 0, [27, 0.05, 0.05]).add(B, 0xd0d6dc, [0, 0.45, 0], 0, [27, 0.04, 0.04]).add(B, 0x6ac8b8, [0, 0.08, 0.1], 0, [27, 0.16, 0.5]);
        // 열린 철망 문: 바깥으로 젖혀짐
        for (let k = 0; k < 4; k++) p.add(M.cyl(0.02, 0.02, 5), 0xe4e8ec, [0.5 + 0.12 * k * Math.cos(1.2), 0.5, -0.12 * k * Math.sin(1.2)], 0, [1, 0.9, 1]);
      }
    } else if (ln.type === 'road') {
      const c = ROAD[id];
      strip(c, -0.05, 0.55, 0.78);
      if (id === 'room') { p.add(B, 0xffffff, [0, -0.045, 0.46], 0, [28, 0.012, 0.05]).add(B, 0xffffff, [0, -0.045, -0.46], 0, [28, 0.012, 0.05]); for (let x = -13; x < 14; x += 1.6) p.add(B, 0xffe27a, [x, -0.044, 0], 0, [0.6, 0.012, 0.06]); }
      if (id === 'alley') { for (let x = -13; x < 14; x += 2) p.add(B, 0xf2f2ea, [x, -0.044, 0.5], 0, [1.1, 0.012, 0.06]); }
      if (id === 'yard') for (let i = 0; i < 10; i++) p.add(M.cone(4), 0x5a9a3c, [R(rnd, -13, 13), -0.02, R(rnd, -0.45, 0.45)], 0, [0.04, 0.08, 0.04]);
      if (id === 'park') { p.add(B, 0xf6f0e6, [0, -0.044, 0.44], 0, [28, 0.012, 0.05]).add(B, 0xf6f0e6, [0, -0.044, -0.44], 0, [28, 0.012, 0.05]); }
      if (id === 'kitchen') for (let x = -13.5; x <= 13.5; x += 1) p.add(B, 0x9aa4aa, [x, -0.047, 0], 0, [0.04, 0.01, 1]);
    } else if (ln.type === 'rail') {
      const wood = id === 'room';
      strip(wood ? 0xe2c08a : 0x8a8478, -0.05, 0.55, 0.78);
      for (let x = -13.5; x < 14; x += wood ? 2 : 0.7) p.add(B, wood ? 0xc89a5a : 0x6a4a34, [x, -0.02, 0], 0, [wood ? 0.1 : 0.2, 0.05, 0.86]);
      for (const z of [-0.25, 0.25]) p.add(B, wood ? 0xb0804a : 0xb8bcc2, [0, wood ? -0.04 : 0.03, z], 0, [28, wood ? 0.02 : 0.07, wood ? 0.1 : 0.06]);
      // 건널목 기둥(불은 따로)
      for (const s of [-1, 1]) p.add(M.cyl(0.05, 0.05, 8), 0xf2f2f2, [s * (COLS + 0.7), 0.6, 0.42], 0, [1, 1.3, 1]).add(B, 0x2a2a2e, [s * (COLS + 0.7), 1.2, 0.42], 0, [0.4, 0.2, 0.1]);
    } else if (ln.type === 'water') {
      strip(shade(WATER[id], 0.6), -0.45, 0.4, 1);
      wp.add(B, WATER[id], [0, -0.17, 0], 0, [28, 0.02, 1]);
      for (let i = 0; i < 6; i++) wp.add(M.sph(6), shade(WATER[id], 1.12), [R(rnd, -13, 13), -0.155, R(rnd, -0.35, 0.35)], 0, [R(rnd, 0.3, 0.8), 0.01, 0.06]);
    }
    for (const c of ln.obs) p.addParts(M.obstacle(DATA.ZONES[Math.min(4, ln.z)].obs[Math.floor(rnd() * 4)], rnd), [c, 0, 0], R(rnd, -0.3, 0.3));
    for (const [c, k] of ln.deco) p.addParts(M.obstacle(k, rnd), [c + R(rnd, -0.15, 0.15), 0, R(rnd, -0.1, 0.1)], R(rnd, 0, 6));
    return { p, wp };
  }

  const LIVE = new Map(); // 줄 번호 → {g, movers, seeds, lights}
  const geoCache = new Map();
  function moverGeo(kind, L, col) {
    const k = kind + L.toFixed(2) + ':' + col;
    if (!geoCache.has(k)) geoCache.set(k, M.mover(kind, L, col).merge());
    return geoCache.get(k);
  }
  let seedGeo = null, goldGeo = null;
  function show(ln) {
    const g = new T.Group(); g.position.z = -ln.r;
    const { p, wp } = rowParts(ln);
    const m = new T.Mesh(p.merge(), M.vmat); m.castShadow = true; m.receiveShadow = true; g.add(m);
    if (wp.list.length) { const w = new T.Mesh(wp.merge(), M.wet); w.receiveShadow = true; w.userData.own = true; g.add(w); }
    const live = { g, movers: [], seeds: new Map(), lights: null };
    if (ln.type === 'road' || ln.type === 'water') {
      for (const it of ln.items) {
        const o = new T.Mesh(moverGeo(it.kind, it.len, it.col), M.vmat); o.castShadow = true; o.receiveShadow = ln.type === 'water';
        if (ln.dir < 0) o.rotation.y = Math.PI;
        if (it.kind === 'car' || it.kind === 'van') o.scale.z = 0.56;
        if (ln.type === 'water') o.position.y = -0.17;
        if (it.kind === 'bigball') o.position.y = M.BALL_R; // 공 가운데를 반지름만큼 띄워야 땅에 안 묻힘
        g.add(o); live.movers.push(o);
      }
    }
    if (ln.type === 'rail') {
      const tr = new T.Mesh(moverGeo(ln.train.kind, ln.train.len, 0), M.vmat); tr.castShadow = true; tr.visible = false; if (ln.dir < 0) tr.rotation.y = Math.PI;
      if (ln.train.kind === 'subway') tr.scale.z = 0.52;
      g.add(tr); live.movers.push(tr);
      const lm = new T.MeshBasicMaterial({ color: 0x5a2020 });
      for (const s of [-1, 1]) for (const d of [-0.1, 0.1]) { const b = new T.Mesh(M.sph(10), lm); b.scale.setScalar(0.07); b.position.set(s * (COLS + 0.7) + d, 1.2, 0.48); g.add(b); }
      live.lights = lm;
    }
    if (!seedGeo) { seedGeo = M.seed(false).merge(); goldGeo = M.seed(true).merge(); }
    ln.seeds.forEach((k, c) => { const o = new T.Mesh(k === 'gold' ? goldGeo : seedGeo, k === 'gold' ? M.wet : M.vmat); o.position.set(c, 0.16, 0); o.rotation.y = R(Math.random, 0, 6); o.castShadow = true; g.add(o); live.seeds.set(c, o); });
    rowRoot.add(g); LIVE.set(ln.r, live);
  }
  function hide(r) { const l = LIVE.get(r); if (!l) return; rowRoot.remove(l.g); l.g.children[0].geometry.dispose(); l.g.children.forEach((o) => { if (o.userData.own) o.geometry.dispose(); }); LIVE.delete(r); }
  W.clearRows = function () { [...LIVE.keys()].forEach(hide); };
  W.window = function (lo, hi) {
    for (const r of [...LIVE.keys()]) if (r < lo || r > hi) hide(r);
    for (let r = lo; r <= hi; r++) if (!LIVE.has(r) && W.lanes.has(r)) show(W.lanes.get(r));
  };
  W.removeSeed = function (r, c) { const ln = W.lanes.get(r); if (ln) ln.seeds.delete(c); const l = LIVE.get(r); if (l && l.seeds.has(c)) { const o = l.seeds.get(c); l.g.remove(o); l.seeds.delete(c); } };
  W.seedMesh = (r, c) => { const l = LIVE.get(r); return l && l.seeds.get(c); };

  // ---------- 움직임 ----------
  const wrap = (x) => ((((x + WR) % (WR * 2)) + WR * 2) % (WR * 2)) - WR;
  W.time = 0;
  W.update = function (dt, onTrain) {
    W.time += dt;
    W.lanes.forEach((ln) => {
      if (ln.type === 'road' || ln.type === 'water') { for (const it of ln.items) it.x = wrap(it.x + ln.dir * ln.speed * dt); }
      else if (ln.type === 'rail') {
        const tr = ln.train;
        if (!tr.on) {
          ln.next -= dt;
          ln.warn = ln.next < 1.5 ? 1 : 0;
          if (ln.warn && !ln.warned) { ln.warned = true; if (onTrain) onTrain(ln, 'warn'); }
          if (ln.next <= 0) { tr.on = true; tr.x = -ln.dir * (WR + tr.len / 2); ln.items = [tr]; ln.warned = false; if (onTrain) onTrain(ln, 'go'); }
        } else {
          tr.x += ln.dir * tr.speed * dt; ln.warn = 1;
          if (Math.abs(tr.x) > WR + tr.len / 2 + 1) { tr.on = false; ln.items = []; ln.next = 3 + ((ln.r * 37) % 30) / 10; ln.warn = 0; }
        }
      }
    });
    LIVE.forEach((l, r) => {
      const ln = W.lanes.get(r);
      if (ln.type === 'road' || ln.type === 'water') {
        ln.items.forEach((it, i) => {
          const o = l.movers[i]; o.position.x = it.x;
          if (it.kind === 'bigball') o.rotation.z = -it.x / M.BALL_R; // 제자리 구르기(미끄러지지 않게)
          if (it.kind === 'dog') o.position.y = Math.abs(Math.sin(W.time * 9 + i)) * 0.08;
          if (ln.type === 'water') o.position.y = -0.17 + Math.sin(W.time * 2.2 + it.x * 0.7) * 0.025;
        });
      } else if (ln.type === 'rail') {
        const o = l.movers[0], tr = ln.train; o.visible = !!tr.on; if (tr.on) o.position.x = tr.x;
        l.lights.color.setHex(ln.warn && Math.floor(W.time * 5) % 2 ? 0xff2a1a : 0x5a2020);
      }
      l.seeds.forEach((o, c) => { o.rotation.y += dt * 1.6; o.position.y = 0.16 + Math.sin(W.time * 3 + c) * 0.04; });
    });
  };

  // ---------- 묻기 ----------
  W.lane = (r) => W.lanes.get(r);
  W.walkable = (ln) => ln && (ln.type === 'safe' || ln.type === 'home' || ln.type === 'field');
  W.blocked = function (c, r) {
    const ln = W.lanes.get(r);
    if (!ln || ln.type === 'cage') return true;
    if (Math.abs(c) > COLS) return true;
    return W.walkable(ln) && ln.obs.has(c);
  };
  W.hit = function (x, r) {
    const ln = W.lanes.get(r); if (!ln || (ln.type !== 'road' && ln.type !== 'rail')) return null;
    for (const it of ln.items) if (Math.abs(x - it.x) < it.len / 2 + 0.22) return it;
    return null;
  };
  W.floater = function (x, r) {
    const ln = W.lanes.get(r); if (!ln || ln.type !== 'water') return null;
    for (const it of ln.items) if (Math.abs(x - it.x) < it.len / 2 + 0.12) return it;
    return null;
  };

  // ---------- 카메라·하늘 ----------
  const bg = new T.Color(), fg = new T.Color();
  W.setZone = function (z, k) {
    const a = DATA.ZONES[Math.min(4, z)], b = DATA.ZONES[Math.min(4, z + 1)];
    bg.setHex(a.sky).lerp(new T.Color(b.sky), k || 0); fg.setHex(a.fog).lerp(new T.Color(b.fog), k || 0);
    scene.background.copy(bg); scene.fog.color.copy(fg);
  };
  W.zoom = 1;
  W.setCam = function (x, row) {
    const asp = camera.aspect;
    const k = (asp < 1 ? Math.min(2.0, 0.78 / asp + 0.18) : asp < 1.3 ? 1.12 : 1) * W.zoom;
    const tz = -row - (asp > 1.6 ? 3.1 : 2.4) * k;
    const lx = x * 0.4 - (2.3 * k - 2.3); // 세로 화면에서도 햄스터가 가운데 오게
    camera.position.set(lx + 4.2 * k, 10.2 * k, tz + 7.2 * k);
    camera.lookAt(lx, 0, tz);
    sun.position.set(x * 0.4 - 5, 12, tz + 7); sun.target.position.set(x * 0.4, 0, tz);
    scene.fog.near = 16 * k; scene.fog.far = 34 * k;
  };
  W.render = () => renderer.render(scene, camera);
})();
