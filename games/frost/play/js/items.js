// items.js — 버섯 12종·꽃 12종 줍기, 황새 둥지 찾기, 장터 팔기·상점·찻집, 쿠팔라의 밤
(function () {
  const rnd = U.mulberry(4242);
  const Z = TER.Z;
  const L = U.L;

  // ── 도감 ──
  const SHROOMS = [
    { ko: '꾀꼬리버섯', en: 'Chanterelle', price: 4, cap: 'funnel', cc: 0xf0a020, uc: 0xf4b840, sc: 0xf0b030, h: 0.14, r: 0.09, sr: 0.03, n: 30, zone: ['birch', 'pine'] },
    { ko: '자작나무버섯', en: 'Birch Bolete', price: 5, cap: 'dome', cc: 0x8a5a34, uc: 0xe8dcc0, sc: 0xe8e4dc, h: 0.2, r: 0.1, sr: 0.035, spots: 1, n: 28, zone: ['birch'] },
    { ko: '등색껄껄이', en: 'Orange Bolete', price: 7, cap: 'dome', cc: 0xd8531f, uc: 0xe8dcc0, sc: 0xe0dcd4, h: 0.22, r: 0.11, sr: 0.04, spots: 1, n: 18, zone: ['birch'] },
    { ko: '비단그물버섯', en: 'Slippery Jack', price: 3, cap: 'dome', cc: 0x6a3e1c, uc: 0xe0c060, sc: 0xe8dca8, h: 0.12, r: 0.1, sr: 0.03, gloss: 1, n: 30, zone: ['pine'] },
    { ko: '그물버섯', en: 'Porcini', price: 15, cap: 'dome', cc: 0x7a4a26, uc: 0xf0e8c8, sc: 0xf2ead8, h: 0.18, r: 0.13, sr: 0.06, fat: 1, n: 10, zone: ['pine', 'pushcha'] },
    { ko: '뽕나무버섯', en: 'Honey Fungus', price: 4, cap: 'dome', cc: 0xc89040, uc: 0xf0e0b0, sc: 0xe8d8b0, h: 0.12, r: 0.05, sr: 0.012, cluster: 7, n: 0, zone: ['stump'] },
    { ko: '흰젖버섯', en: 'Milk Cap', price: 5, cap: 'funnel', cc: 0xf2eee0, uc: 0xf4f0e0, sc: 0xf0ece0, h: 0.1, r: 0.12, sr: 0.04, n: 20, zone: ['birch'] },
    { ko: '무당버섯', en: 'Russula', price: 2, cap: 'flat', cc: 0xd83a4a, uc: 0xf6f2ea, sc: 0xf6f2ea, h: 0.1, r: 0.09, sr: 0.03, n: 40, zone: ['birch', 'pine', 'pushcha', 'meadow'] },
    { ko: '큰갓버섯', en: 'Parasol', price: 6, cap: 'parasol', cc: 0xd8c8a8, uc: 0xf4f0e8, sc: 0xc8b898, h: 0.36, r: 0.17, sr: 0.022, scales: 1, n: 16, zone: ['meadow'] },
    { ko: '곰보버섯', en: 'Morel', price: 9, cap: 'morel', cc: 0x8a6a40, uc: 0x8a6a40, sc: 0xe8e0c8, h: 0.08, r: 0.05, sr: 0.03, n: 14, zone: ['wet'] },
    { ko: '붉은젖버섯', en: 'Saffron Milk Cap', price: 7, cap: 'funnel', cc: 0xe07a30, uc: 0xe89040, sc: 0xe08840, h: 0.1, r: 0.1, sr: 0.03, rings: 1, n: 18, zone: ['pine'] },
    { ko: '숲의 왕', en: 'King Porcini', price: 60, cap: 'dome', cc: 0x6a3a1e, uc: 0xf0e0b0, sc: 0xf2e8d0, h: 0.3, r: 0.3, sr: 0.13, fat: 1, n: 1, zone: ['king'], scale: 1.6 },
  ];
  const POISON = { ko: '광대버섯', en: 'Fly Agaric', cap: 'dome', cc: 0xd82a1a, uc: 0xf6f2ea, sc: 0xf6f2ea, h: 0.2, r: 0.12, sr: 0.03, dots: 1, n: 26, zone: ['birch', 'pine'] };

  const FLOWERS = [
    { ko: '수레국화', en: 'Cornflower', pc: 0x3a62d8, cen: 0x2a3a90, shape: 'star', h: 0.55, zone: 'rye', n: 8 },
    { ko: '캐모마일', en: 'Chamomile', pc: 0xfafaf4, cen: 0xf0c020, shape: 'daisy', h: 0.4, zone: 'meadowV', n: 10 },
    { ko: '양귀비', en: 'Poppy', pc: 0xe02818, cen: 0x201818, shape: 'cup', h: 0.55, zone: 'rye', n: 8 },
    { ko: '초롱꽃', en: 'Bellflower', pc: 0x8a5ad8, cen: 0xe0d0f0, shape: 'bell', h: 0.55, zone: 'birch', n: 8 },
    { ko: '물망초', en: 'Forget-me-not', pc: 0x7ab0f0, cen: 0xf0e040, shape: 'tiny', h: 0.3, zone: 'swamp', n: 8 },
    { ko: '수련', en: 'Water Lily', pc: 0xfaf6f0, cen: 0xf0d040, shape: 'lily', h: 0, zone: 'lake', n: 7 },
    { ko: '아마꽃', en: 'Flax Flower', pc: 0x88aaf0, cen: 0xf0f0c0, shape: 'daisy5', h: 0.5, zone: 'flax', n: 8 },
    { ko: '붉은토끼풀', en: 'Red Clover', pc: 0xd0508a, cen: 0xd0508a, shape: 'ball', h: 0.3, zone: 'meadow', n: 10 },
    { ko: '헤더', en: 'Heather', pc: 0xa860c0, cen: 0xa860c0, shape: 'spike', h: 0.4, zone: 'pine', n: 8 },
    { ko: '은방울꽃', en: 'Lily of the Valley', pc: 0xfcfcf4, cen: 0xfcfcf4, shape: 'bells', h: 0.3, zone: 'pushcha', n: 8 },
    { ko: '들장미', en: 'Wild Rose', pc: 0xf088a8, cen: 0xf0d040, shape: 'rose', h: 0.75, zone: 'castle', n: 8 },
    { ko: '동의나물', en: 'Marsh Marigold', pc: 0xf8d020, cen: 0xe0a010, shape: 'cup', h: 0.35, zone: 'shore', n: 8 },
  ];

  const SHOP = [
    { id: 'basket1', ko: '큰 바구니', en: 'Big Basket', price: 40, icon: '🧺' },
    { id: 'boots', ko: '장화', en: 'Rubber Boots', price: 60, icon: '🥾' },
    // 등불은 뺐다 (사장님 2026-09-19 "등불은 빼") — 밤엔 주인공 둘레 불빛이 저절로 켜진다 (game.js)
    { id: 'shoes', ko: '운동화', en: 'Sneakers', price: 120, icon: '👟' },
    { id: 'basket2', ko: '아주 큰 바구니', en: 'Huge Basket', price: 150, icon: '🧺', need: 'basket1' },
    { id: 'spear', ko: '작살', en: 'Fish Spear', price: 50, icon: '🔱' },   // 선착장에 놓여 있던 것을 상점으로 (사장님 2026-09-26 "상점에서 파는걸로해")
    { id: 'rifle', ko: '장총', en: 'Hunting Rifle', price: 200, icon: '🎯' },
    // 꼬치 도구는 뺐다 — 멧돼지는 팔기만 (사장님 2026-09-27)
  ];

  function cap() { return T.shop.basket2 ? 30 : (T.shop.basket1 ? 16 : 8); }

  // ── 모양 ──
  function capGeo(sp) {
    const R = sp.r, pts = [];
    const K = 8;
    for (let i = 0; i <= K; i++) {
      const t = i / K;
      let x, y;
      switch (sp.cap) {
        case 'funnel': x = R * (0.25 + 0.75 * Math.sin(t * Math.PI / 2)); y = R * (0.15 + 0.35 * t - 0.15 * Math.sin(t * Math.PI)); if (i === K) y = R * 0.28; break;
        case 'flat': x = R * Math.sin(t * Math.PI / 2); y = R * 0.35 * Math.cos(t * Math.PI / 2) + R * 0.05; break;
        case 'parasol': x = R * Math.sin(t * Math.PI / 2); y = R * (0.28 * Math.cos(t * Math.PI / 2) + (t < 0.2 ? 0.12 * (1 - t / 0.2) : 0)); break;
        case 'morel': x = R * (0.95 * Math.sin(t * Math.PI * 0.85 + 0.2)); y = R * 2.6 * (1 - t); break;
        default: x = R * Math.sin(t * Math.PI / 2) * (sp.fat ? 1.05 : 1); y = R * (sp.fat ? 0.75 : 0.62) * Math.cos(t * Math.PI / 2);
      }
      pts.push(new THREE.Vector2(Math.max(0.001, x), y));
    }
    // 뒤집어 아랫면
    pts.reverse();
    const top = new THREE.LatheGeometry(pts, 11);
    const under = new THREE.CircleGeometry(R * (sp.cap === 'funnel' ? 1.0 : 0.98), 11);
    under.rotateX(Math.PI / 2);
    under.translate(0, sp.cap === 'funnel' ? R * 0.28 - 0.001 : 0.002, 0);
    let g1 = GEO.tint(top, sp.cc, 0.12, rnd);
    // 꼭대기 쪽 진하게, 가장자리 밝게
    const p = g1.attributes.position, c = g1.attributes.color;
    for (let i = 0; i < p.count; i++) { const k = 0.8 + 0.4 * (Math.hypot(p.getX(i), p.getZ(i)) / R); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }
    if (sp.cap === 'morel') {   // 벌집 구멍
      for (let i = 0; i < p.count; i++) { const k = N.n2(p.getX(i) * 90, p.getY(i) * 90) > 0.1 ? 0.45 : 1; c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k); }
    }
    const list = [g1, GEO.tint(under, sp.uc)];
    if (sp.dots || sp.scales) {
      for (let i = 0; i < 14; i++) {
        const a = rnd() * 6.28, rr = R * (0.1 + rnd() * 0.75);
        const yy = (sp.cap === 'parasol' ? R * 0.26 * Math.cos(rr / R * Math.PI / 2) : R * 0.62 * Math.cos(rr / R * Math.PI / 2)) + R * 0.03;
        const d = new THREE.SphereGeometry(R * (sp.dots ? 0.16 : 0.08), 5, 3);
        d.scale(1, 0.45, 1);
        d.translate(Math.cos(a) * rr, yy, Math.sin(a) * rr);
        list.push(GEO.tint(d, sp.dots ? 0xfaf8f0 : 0x7a5a3a));
      }
    }
    if (sp.rings) {
      const ring = new THREE.TorusGeometry(R * 0.6, R * 0.04, 4, 20); ring.rotateX(Math.PI / 2); ring.translate(0, R * 0.25, 0);
      list.push(GEO.tint(ring, 0xc05a20));
    }
    return list;
  }
  function shroomGeo(sp) {
    const parts = [];
    const one = (ox, oz, s, tilt) => {
      const stem = new THREE.CylinderGeometry(sp.sr * 0.85, sp.sr * (sp.fat ? 1.7 : 1.1), sp.h, 6);
      stem.translate(0, sp.h / 2, 0);
      let sg = GEO.tint(stem, sp.sc, 0.06, rnd);
      GEO.shadeY(sg, 0.7, 1);
      const bits = [sg];
      if (sp.cap === 'parasol') { const ring = new THREE.TorusGeometry(sp.sr * 1.6, sp.sr * 0.5, 4, 10); ring.rotateX(Math.PI / 2); ring.translate(0, sp.h * 0.7, 0); bits.push(GEO.tint(ring, 0xf0ece0)); }
      if (sp.spots) {   // 줄기의 검은 비늘
        const p = sg.attributes.position, c = sg.attributes.color;
        for (let i = 0; i < p.count; i++) if (N.n2(p.getX(i) * 200 + p.getZ(i) * 150, p.getY(i) * 60) > 0.2) c.setXYZ(i, 0.25, 0.22, 0.2);
      }
      for (const g of capGeo(sp)) { g.translate(0, sp.h - (sp.cap === 'morel' ? 0.01 : 0.004), 0); bits.push(g); }
      const g = GEO.merge(bits);
      g.scale(s, s, s);
      if (tilt) g.rotateZ(tilt);
      g.translate(ox, 0, oz);
      parts.push(g);
    };
    if (sp.cluster) {
      for (let i = 0; i < sp.cluster; i++) { const a = i / sp.cluster * 6.28; one(Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0.7 + rnd() * 0.5, Math.cos(a) * 0.3); }
    } else {
      one(0, 0, 1, 0);
      if (!sp.scale) { one(0.12, 0.05, 0.55, 0.15); }
    }
    const g = GEO.merge(parts);
    const k = (sp.scale || 1) * 1.45;   // 아이들이 찾기 쉽게 실제보다 조금 크게
    g.scale(k, k, k);
    return g;
  }

  function berryGeo() {
    const parts = [];
    for (let i = 0; i < 40; i++) {
      let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
      const lf = new THREE.SphereGeometry(0.05, 3, 2); lf.scale(1, 0.4, 1.5); lf.rotateY(rnd() * 6.28);
      lf.translate(x * 0.38, 0.22 + y * 0.2, z * 0.38);
      parts.push(GEO.tint(lf, rnd() < 0.5 ? 0x3f7a2c : 0x557f30, 0.2, rnd));
    }
    for (let i = 0; i < 26; i++) {
      const a = rnd() * 6.28, r = 0.15 + rnd() * 0.25;
      parts.push(GEO.tint(new THREE.SphereGeometry(0.035, 5, 4).translate(Math.cos(a) * r, 0.18 + rnd() * 0.25, Math.sin(a) * r), 0x2a3a8a, 0.25, rnd));
    }
    const g = GEO.merge(parts); g.scale(1.4, 1.4, 1.4); return g;
  }

  function flowerGeo(fl) {
    const parts = [];
    const H = fl.h;
    if (fl.shape === 'lily') {
      const pad = new THREE.CircleGeometry(0.42, 16, 0.3, 5.8); pad.rotateX(-Math.PI / 2);
      parts.push(GEO.tint(pad, 0x3f7a30));
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * 6.28 + (i % 2) * 0.26, lay = i % 2;
        const pt = new THREE.SphereGeometry(0.09, 6, 4); pt.scale(0.55, 0.25, 1.4);
        pt.rotateX(lay ? -0.5 : -0.2); pt.translate(0, 0.06 + lay * 0.03, 0.1 - lay * 0.02); pt.rotateY(a);
        parts.push(GEO.tint(pt, fl.pc));
      }
      parts.push(GEO.tint(new THREE.SphereGeometry(0.04, 6, 4).translate(0, 0.1, 0), fl.cen));
      const g = GEO.merge(parts); g.scale(1.5, 1.5, 1.5); return g;
    }
    // 줄기·잎
    const stem = new THREE.CylinderGeometry(0.006, 0.01, H, 4); stem.translate(0, H / 2, 0);
    parts.push(GEO.tint(stem, 0x4a7a2c));
    for (let i = 0; i < 3; i++) { const lf = new THREE.SphereGeometry(0.05, 4, 2); lf.scale(0.4, 0.1, 1.4); lf.rotateY(i * 2.1); lf.translate(Math.sin(i * 2.1) * 0.06, H * (0.15 + i * 0.18), Math.cos(i * 2.1) * 0.06); parts.push(GEO.tint(lf, 0x4f8a34)); }
    const head = (y, s) => {
      const bits = [];
      switch (fl.shape) {
        case 'daisy': case 'daisy5': case 'star': {
          const n = fl.shape === 'daisy' ? 16 : (fl.shape === 'daisy5' ? 5 : 10);
          for (let i = 0; i < n; i++) {
            const pt = new THREE.SphereGeometry(0.03, 4, 2);
            pt.scale(fl.shape === 'star' ? 0.35 : 0.6, 0.15, fl.shape === 'daisy5' ? 1.6 : 1.8);
            pt.translate(0, 0, 0.05); pt.rotateY(i / n * 6.28);
            bits.push(GEO.tint(pt, fl.pc));
          }
          bits.push(GEO.tint(new THREE.SphereGeometry(fl.shape === 'daisy' ? 0.028 : 0.018, 6, 4).scale(1, 0.6, 1), fl.cen));
          break;
        }
        case 'cup': case 'rose': {
          const n = fl.shape === 'rose' ? 5 : 4;
          for (let i = 0; i < n; i++) {
            const pt = new THREE.SphereGeometry(0.05, 5, 3); pt.scale(1, 0.3, 1);
            pt.rotateX(fl.shape === 'rose' ? -0.2 : -0.9); pt.translate(0, 0.02, 0.04); pt.rotateY(i / n * 6.28);
            bits.push(GEO.tint(pt, fl.pc));
          }
          bits.push(GEO.tint(new THREE.SphereGeometry(0.02, 6, 4), fl.cen));
          break;
        }
        case 'bell': case 'bells': {
          const n = fl.shape === 'bells' ? 6 : 3;
          for (let i = 0; i < n; i++) {
            const b = new THREE.ConeGeometry(fl.shape === 'bells' ? 0.018 : 0.035, fl.shape === 'bells' ? 0.03 : 0.06, 6, 1, true);
            b.translate(0.04 * (i % 2 ? 1 : -1) * (fl.shape === 'bells' ? 0.6 : 1), -i * (fl.shape === 'bells' ? 0.035 : 0.07), 0);
            bits.push(GEO.tint(b, fl.pc));
          }
          break;
        }
        case 'tiny': {
          for (let i = 0; i < 9; i++) { const d = new THREE.SphereGeometry(0.018, 5, 3); d.scale(1, 0.4, 1); d.translate((rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.08); bits.push(GEO.tint(d, fl.pc)); }
          bits.push(GEO.tint(new THREE.SphereGeometry(0.01, 4, 3), fl.cen));
          break;
        }
        case 'ball': {
          const b = new THREE.IcosahedronGeometry(0.05, 1);
          const p = b.attributes.position;
          for (let i = 0; i < p.count; i++) { const k = 1 + (rnd() - 0.5) * 0.3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 1.2, p.getZ(i) * k); }
          bits.push(GEO.tint(b, fl.pc, 0.25, rnd));
          break;
        }
        case 'spike': {
          for (let i = 0; i < 14; i++) { const d = new THREE.SphereGeometry(0.014, 4, 3); d.translate(Math.cos(i * 2.4) * 0.018, -i * 0.018, Math.sin(i * 2.4) * 0.018); bits.push(GEO.tint(d, fl.pc, 0.2, rnd)); }
          break;
        }
      }
      const g = GEO.merge(bits); g.scale(s, s, s); g.translate(0, y, 0); return g;
    };
    parts.push(head(H, 1.6));
    if (fl.shape !== 'rose') parts.push(head(H * 0.8, 1.2).translate(0.07, 0, 0.03));
    if (fl.shape === 'rose') {   // 들장미 덤불
      for (let i = 0; i < 36; i++) {
        let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
        const lf = new THREE.SphereGeometry(0.06, 3, 2); lf.scale(1, 0.35, 1.6); lf.rotateY(rnd() * 6.28); lf.rotateX(rnd() - 0.5);
        lf.translate(x * 0.42, 0.42 + y * 0.36, z * 0.42);
        parts.push(GEO.tint(lf, rnd() < 0.5 ? 0x3f7a2c : 0x4f8a34, 0.2, rnd));
      }
      for (let i = 0; i < 6; i++) { const a = rnd() * 6.28, rr = 0.3 + rnd() * 0.15; parts.push(head(0.3 + rnd() * 0.45, 1.2).translate(Math.cos(a) * rr, 0, Math.sin(a) * rr)); }
    }
    const g = GEO.merge(parts);
    g.scale(1.3, 1.3, 1.3);
    return g;
  }

  // ── 자리 고르기 ──
  function zoneOK(z, x, zz) {
    const h = TER.H(x, zz);
    const f = TER.forest(x, zz);
    const k = f ? f.k : null;
    if (z === 'wet') { const ds = Math.hypot(x - Z.swamp.x, zz - Z.swamp.z); return h > 0.25 && h < 1.4 && (ds < 60 || TER.lakeE(x, zz) < 1.25); }
    if (h < 0.3) return false;
    if (TER.roadD(x, zz) < 2.5) return false;
    if (COL.inside(x, h + 0.3, zz, 0.35)) return false;
    switch (z) {
      case 'birch': case 'pine': case 'pushcha': return k === z;
      case 'meadow': return k === 'meadow' && !TER.inField(x, zz, 2);
      default: return false;
    }
  }
  function pickSpot(zones, tries) {
    for (let i = 0; i < (tries || 400); i++) {
      const z = zones[(rnd() * zones.length) | 0];
      let x, zz;
      if (z === 'pushcha') { x = -52 - rnd() * 104; zz = -24 - rnd() * 128; }
      else if (z === 'wet') { if (rnd() < 0.6) { x = Z.swamp.x + (rnd() - 0.5) * 120; zz = Z.swamp.z + (rnd() - 0.5) * 120; } else { const a = rnd() * 6.28; x = Z.lake.x + Math.cos(a) * Z.lake.rx * 1.1; zz = Z.lake.z + Math.sin(a) * Z.lake.rz * 1.1; } }
      else { x = (rnd() - 0.5) * 304; zz = (rnd() - 0.5) * 304; }
      if (zoneOK(z, x, zz)) return [x, zz];
    }
    return null;
  }
  function flowerSpot(zone) {
    for (let i = 0; i < 600; i++) {
      let x, z, y = null;
      switch (zone) {
        case 'rye': case 'flax': {
          const fs = TER.FIELDS.filter(f => f.k === zone), f = fs[(rnd() * fs.length) | 0];
          const u = (rnd() - 0.5) * (f.w - 4), v = (rnd() - 0.5) * (f.h - 4);
          x = f.x + u * f.c - v * f.s; z = f.z + u * f.s + v * f.c; break;
        }
        case 'meadowV': { const a = rnd() * 6.28, r = 47 + rnd() * 35; x = Z.village.x + Math.cos(a) * r; z = Z.village.z + Math.sin(a) * r; if (TER.inField(x, z, 2) || TER.lakeE(x, z) < 1.15) continue; break; }
        case 'lake': { const a = rnd() * 6.28, r = 12 + rnd() * 16; x = Z.island.x + Math.cos(a) * r; z = Z.island.z + Math.sin(a) * r; if (TER.H(x, z) > -1.4) continue; y = 0.02; break; }
        case 'swamp': { x = Z.swamp.x + (rnd() - 0.5) * 88; z = Z.swamp.z + (rnd() - 0.5) * 88; const h = TER.H(x, z); if (h < 0.15 || h > 0.9) continue; break; }
        case 'shore': { const a = rnd() * 6.28; x = Z.lake.x + Math.cos(a) * Z.lake.rx * (1.02 + rnd() * 0.1); z = Z.lake.z + Math.sin(a) * Z.lake.rz * (1.02 + rnd() * 0.1); const h = TER.H(x, z); if (h < 0.1 || h > 1.5) continue; break; }
        case 'castle': { const a = rnd() * 6.28, r = 42 + rnd() * 24; x = Z.castle.x + Math.cos(a) * r; z = Z.castle.z + Math.sin(a) * r; break; }
        default: { const p = pickSpot([zone === 'meadow' ? 'meadow' : zone], 60); if (!p) continue; [x, z] = p; }
      }
      if (y === null) {
        const h = TER.H(x, z);
        if (h < 0.1 || TER.roadD(x, z) < 1.5 || COL.inside(x, h + 0.3, z, 0.4) || Math.abs(x) > 152 || Math.abs(z) > 152) continue;
        y = h;
      }
      return [x, y, z];
    }
    return null;
  }

  // ── 만들기 ──
  const spots = [];      // {t:'m'|'f'|'p', sp, x,y,z, on, re, mesh, idx}
  const meshes = [];
  let glint = null;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), V = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

  function setInst(s) {
    const k = s.on ? 1 : 0;
    Q.setFromAxisAngle(UP, s.ry);
    S3.set(k, k, k);
    M4.compose(V.set(s.x, s.y, s.z), Q, S3);
    s.mesh.setMatrixAt(s.idx, M4);
    s.mesh.instanceMatrix.needsUpdate = true;
  }

  let fern = null;
  // 버섯·꽃·블루베리는 부탁에 필요한 개수만 정확히 (사장님 2026-09-18 "버섯이나 꽃은 미션에 필요한 개수만 놓아줘 정확하게")
  //   부탁에 없는 종류는 도감용 1개. 따서 판 탓에 부탁을 못 채우게 될 때만 모자란 만큼 다시 돋는다
  const QS = () => window.QUESTS ? QUESTS.QUESTS : [];
  const BERRY_N = 14;   // 블루베리 덤불 (팔아서 돈이 된다)
  function needTotal(t, id) {   // 처음에 놓을 개수
    let n = 0;
    for (const q of QS()) {
      if (t === 'm' && q.m === id) n += q.n;
      else if (t === 'f' && q.f === id) n += q.n;
      else if (t === 'e' && q.g === 'berry') n += q.n;
    }
    if (t === 'm' && id === 0) n = Math.max(n, 4);   // 꾀꼬리버섯은 할머니 요리 거리로 4개 (2026-09-19 부탁 뺌)
    if (t === 'e') n = BERRY_N;                      // 블루베리는 돈벌이 (2026-09-20 부탁 뺀 뒤)
    return t === 'e' || t === 'f' ? n : Math.max(1, n);   // 꽃은 도감이 없어져 부탁 개수만 (2026-09-18)
  }
  function needLeft(t, id) {   // 아직 모자라면 안 되는 개수 (끝낸 부탁은 빼고, 도감에 없으면 1)
    let n = 0;
    QS().forEach((q, i) => {
      if (T.quests[i]) return;
      if ((t === 'm' && q.m === id) || (t === 'f' && q.f === id) || (t === 'e' && q.g === 'berry')) n += q.n;
    });
    if (t === 'm' && !T.got[t + id]) n = Math.max(n, 1);
    if (t === 'e') n = BERRY_N;
    return n;
  }
  function have(t, id) {   // 땅에 난 것 + 가진 것
    let n = 0;
    for (const s of spots) if (s.on && s.t === t && s.sp === id) n++;
    if (t === 'm') n += T.basket.filter(k => k === id).length;
    else if (t === 'f') n += T.fbag[id] || 0;
    else if (t === 'e') n += T.items.berry || 0;
    return n;
  }

  function build(scene) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
    const CELL = 72;
    const add = (t, sp, list, geo, id) => {
      const cells = new Map();
      for (const p of list) { const k = Math.floor((p[0] + 460) / CELL) + ',' + Math.floor((p[2] + 460) / CELL); (cells.get(k) || cells.set(k, []).get(k)).push(p); }
      for (const [k, part] of cells) {
        const me = new THREE.InstancedMesh(geo, mat, part.length);
        me.castShadow = false; me.receiveShadow = true;   // 버섯·꽃은 작아서 그림자가 거의 안 보인다 — 그리기 명령만 늘어 끔 (2026-09-17)
        part.forEach((p, i) => {
          const s = { t, sp: id, x: p[0], y: p[1], z: p[2], ry: rnd() * 6.28, on: true, re: 0, mesh: me, idx: i };
          spots.push(s); setInst(s);
        });
        me.computeBoundingSphere();
        // 넘어져 쏟아진 버섯이 덩어리 밖으로 나갈 수 있으니 공을 넉넉히
        me.boundingSphere.radius += 12;
        const [ci, cj] = k.split(',').map(Number);
        me.userData.cx = -460 + (ci + 0.5) * CELL; me.userData.cz = -460 + (cj + 0.5) * CELL;
        scene.add(me); meshes.push(me);
      }
    };
    SHROOMS.forEach((sp, id) => {
      const list = [];
      const want = Math.max(needTotal('m', id), sp.n || 8);   // 버섯은 돈벌이 — 넉넉히 (사장님 2026-09-18 "버섯은 돈벌기위해 따는걸로")
      if (sp.zone[0] === 'stump') {
        const st = WORLD.STUMPS.slice().sort((a, b) => TER.roadD(a.x, a.z) - TER.roadD(b.x, b.z)).slice(0, want);   // 길에서 가까운 그루터기
        for (const q of st) list.push([q.x + 0.1, q.y - 0.02, q.z]);
      } else if (sp.zone[0] === 'king') {
        list.push([Z.fern.x - 6, TER.H(Z.fern.x - 6, Z.fern.z + 4), Z.fern.z + 4]);
      } else {
        for (let i = 0; i < 400 && list.length < want; i++) { const p = pickSpot(sp.zone); if (p) list.push([p[0], TER.H(p[0], p[1]) - 0.02, p[1]]); }
      }
      if (list.length) add('m', sp, list, shroomGeo(sp), id);
    });
    { const list = []; for (let i = 0; i < 400 && list.length < needTotal('e', -2); i++) { const p = pickSpot(['pine', 'birch']); if (p) list.push([p[0], TER.H(p[0], p[1]) - 0.02, p[1]]); } add('e', null, list, berryGeo(), -2); }
    { const list = []; for (let i = 0; i < POISON.n; i++) { const p = pickSpot(POISON.zone); if (p) list.push([p[0], TER.H(p[0], p[1]) - 0.02, p[1]]); } add('p', POISON, list, shroomGeo(POISON), -1); }
    FLOWERS.forEach((fl, id) => {
      const list = [];
      for (let i = 0; i < 400 && list.length < needTotal('f', id); i++) { const p = flowerSpot(fl.zone); if (p) list.push(p); }
      add('f', fl, list, flowerGeo(fl), id);
    });
    // 반짝임
    const n = 64;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const c = GEO.canvas(32), cx = c.getContext('2d');
    const gr = cx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,245,200,.7)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, 32, 32);
    cx.fillStyle = 'rgba(255,255,255,.9)'; cx.fillRect(15, 2, 2, 28); cx.fillRect(2, 15, 28, 2);
    glint = new THREE.Points(g, new THREE.PointsMaterial({ map: GEO.tex(c), size: 0.5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glint.frustumCulled = false;
    scene.add(glint);

    fern = buildFern(scene);
    makeIcons();
  }

  // ── 고사리꽃 ──
  function buildFern(scene) {
    const grp = new THREE.Group();
    const x = Z.fern.x, z = Z.fern.z, y = TER.H(x, z);
    grp.position.set(x, y, z);
    // 큰 고사리 덤불
    const fm = FLORA.mats; // 안 씀
    const leaf = GEO.noFlip(new THREE.MeshStandardMaterial({ color: 0x2f6a24, roughness: 0.8, side: THREE.DoubleSide }));
    for (let i = 0; i < 11; i++) {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      for (let k = 0; k <= 16; k++) { const t = k / 16; s.lineTo(0.2 * Math.sin(t * Math.PI) * (k % 2 ? 1.7 : 0.9), t * 1.8); }
      for (let k = 16; k >= 0; k--) { const t = k / 16; s.lineTo(-0.2 * Math.sin(t * Math.PI) * (k % 2 ? 1.7 : 0.9), t * 1.8); }
      const g = new THREE.ShapeGeometry(s);
      g.rotateX(-0.9 + (i % 3) * 0.12);
      const m = new THREE.Mesh(g, leaf);
      m.rotation.y = i / 11 * 6.28;
      m.castShadow = true;
      grp.add(m);
    }
    // 꽃: 붉은 금빛 꽃잎 여섯, 처음엔 오므린 봉오리
    const bloom = new THREE.Group();
    bloom.position.y = 1.25;
    const pm = new THREE.MeshStandardMaterial({ color: 0xe8341a, emissive: 0xd02810, emissiveIntensity: 1.1, roughness: 0.5, side: THREE.DoubleSide });
    const pm2 = new THREE.MeshStandardMaterial({ color: 0xffa030, emissive: 0xe07010, emissiveIntensity: 1.0, roughness: 0.5, side: THREE.DoubleSide });
    const petals = [];
    for (let layer = 0; layer < 2; layer++) {
      const n = layer ? 5 : 7;
      for (let i = 0; i < n; i++) {
        const piv = new THREE.Group();
        const holder = new THREE.Group();
        holder.rotation.y = i / n * 6.28 + layer * 0.4;
        const pg = new THREE.SphereGeometry(0.2, 12, 6); pg.scale(layer ? 0.45 : 0.55, 0.1, layer ? 1.0 : 1.35); pg.translate(0, 0, layer ? 0.17 : 0.25);
        piv.add(new THREE.Mesh(pg, layer ? pm2 : pm));
        piv.userData.layer = layer;
        holder.add(piv);
        bloom.add(holder); petals.push(piv);
      }
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0a0 }));
    bloom.add(core);
    const light = new THREE.PointLight(0xff7a40, 0, 16, 1.6);
    light.position.y = 0.3;
    bloom.add(light);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: WORLD.fireTex(), color: 0xffc070, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
    halo.scale.set(1.6, 1.6, 1);
    bloom.add(halo);
    grp.add(bloom);
    grp.visible = false;
    grp.userData = { petals, light, halo, bloom, open: 0, opening: false };
    scene.add(grp);
    return grp;
  }

  // ── 그림 아이콘 (도감용) ──
  const ICONS = { m: [], f: [], p: null };
  function makeIcons() {
    const ren = T.renderer;
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.4));
    const dl = new THREE.DirectionalLight(0xfff4e0, 2.2); dl.position.set(1, 2, 1.5); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
    const rt = new THREE.WebGLRenderTarget(128, 128);
    const buf = new Uint8Array(128 * 128 * 4);
    const cv = GEO.canvas(128), cx = cv.getContext('2d'), img = cx.createImageData(128, 128);
    const shot = (geo) => {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }));
      geo.computeBoundingBox();
      const b = geo.boundingBox, c = new THREE.Vector3(), s = new THREE.Vector3();
      b.getCenter(c); b.getSize(s);
      const r = Math.max(s.x, s.y, s.z) * 0.62;
      cam.position.set(c.x + r * 1.7, c.y + r * 1.2, c.z + r * 2.6);
      cam.lookAt(c);
      sc.add(m);
      const prevT = ren.getRenderTarget(), prevTone = ren.toneMapping;
      ren.setRenderTarget(rt);
      ren.setClearColor(0x000000, 0);
      ren.clear();
      ren.render(sc, cam);
      ren.readRenderTargetPixels(rt, 0, 0, 128, 128, buf);
      ren.setRenderTarget(prevT);
      ren.setClearColor(0x000000, 1);
      sc.remove(m); m.material.dispose();
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const si = ((127 - y) * 128 + x) * 4, di = (y * 128 + x) * 4;
        img.data[di] = Math.min(255, Math.pow(buf[si] / 255, 1 / 2.2) * 255); img.data[di + 1] = Math.min(255, Math.pow(buf[si + 1] / 255, 1 / 2.2) * 255); img.data[di + 2] = Math.min(255, Math.pow(buf[si + 2] / 255, 1 / 2.2) * 255); img.data[di + 3] = buf[si + 3];
      }
      cx.clearRect(0, 0, 128, 128);
      cx.putImageData(img, 0, 0);
      return cv.toDataURL('image/png');
    };
    // 로딩 중엔 할머니 말풍선에 쓰는 첫 버섯 한 장만 굽는다. 나머지는 타이틀이 뜬 뒤 한 장씩 (iconsStep, game.js)
    //   전엔 25장을 로딩 중에 다 구워 첫 화면이 1.1초 늦었다 (2026-10-01)
    try { ICONS.m[0] = shot(shroomGeo(SHROOMS[0])); } catch (e) { console.warn('icons', e); }
    for (let i = 1; i < SHROOMS.length; i++) iconJobs.push(() => { ICONS.m[i] = shot(shroomGeo(SHROOMS[i])); });
    FLOWERS.forEach((fl, i) => iconJobs.push(() => { ICONS.f[i] = shot(flowerGeo(fl)); }));
    iconJobs.push(() => { ICONS.p = shot(shroomGeo(POISON)); });
    iconJobs.push(() => rt.dispose());
  }
  const iconJobs = [];
  function iconsStep() {
    const job = iconJobs.shift();
    if (job) try { job(); } catch (e) { console.warn('icons', e); }
    return iconJobs.length > 0;
  }

  // ── 매 프레임 ──
  let near = null, glintT = 0, dizzyT = 0;
  const _v = new THREE.Vector3(), _f = new THREE.Vector3();

  // 황새 둥지: 가까이 가면 찾은 것 (사진기는 2026-09-18 뺌 — 사장님 "사진찍기 없애고")
  function nests() {
    return;   // 둥지 찾기는 뺐다 (사장님 2026-09-19 "새로운 장소 미션 빼고 황새 둥지 사진 미션도 빼") — 둥지는 풍경으로만
    if (WORLD.inHouse(PL.pos.x, PL.pos.z, PL.pos.y)) return;
    WORLD.NESTS.forEach((n, i) => {
      if (T.got['n' + i] || Math.hypot(n.x - PL.pos.x, n.z - PL.pos.z) > 9) return;
      T.got['n' + i] = true;
      AUD.sfx('clatter'); AUD.sfx('new');
      HUD.card(RIDE.nestIcon(), L('황새 둥지', 'Stork Nest') + ' ' + (i + 1), 'n');
      checkAll();
      U.save();
    });
  }

  let regrowT = 0;
  function update(dt, cam) {
    const t = T.time;
    for (const me of meshes) me.visible = Math.hypot(me.userData.cx - cam.position.x, me.userData.cz - cam.position.z) < 120;
    // 다시 돋아남 — 독버섯은 늘, 나머지는 부탁·도감에 모자랄 때만
    regrowT -= dt;
    const check = regrowT <= 0;
    if (check) regrowT = 2;
    for (const s of spots) {
      if (s.on) continue;
      s.re -= dt;
      if (s.re > 0 || Math.hypot(s.x - PL.pos.x, s.z - PL.pos.z) <= 30) continue;
      if (s.t === 'p' || s.t === 'm') { s.on = true; setInst(s); continue; }   // 버섯은 늘 다시 돋는다
      if (check && have(s.t, s.sp) < needLeft(s.t, s.sp)) { s.on = true; setInst(s); }
    }
    // 고사리꽃 피기
    const fd = fern.userData;
    if (fern.visible) {
      fd.halo.material.opacity = 0.55 + Math.sin(t * 3) * 0.25;
      if (fd.opening) fd.open = Math.min(1, fd.open + dt * 0.45);
      fd.petals.forEach((pv, i) => { pv.rotation.x = U.lerp(-1.35, pv.userData.layer ? -0.35 : 0.15, fd.open) + Math.sin(t * 2 + i) * 0.03; });
      fd.light.intensity = 2 + fd.open * 6 + Math.sin(t * 5) * 0.8;
      fd.halo.material.opacity *= 0.5 + fd.open * 0.5;
      fd.bloom.rotation.y += dt * 0.3;
      const k = 1 + fd.open * 0.8; fd.bloom.scale.setScalar(k);
    }
    near = null;
    if (T.mode !== 'play') return;
    nests();
    if (PL.act) return;
    // 들소 위에서는 부탁 전하기·줍기·내리기 (사장님 2026-09-19 "들소 탄 채 버섯 따기" — 옆으로 몸을 숙여 줍는다)
    if (PL.ride) { near = RIDE.busy ? null : (QUESTS.near || (RIDE.calm && ridePick()) || RIDE.near()); return; }
    const px = PL.pos.x, pz = PL.pos.z;
    // 놓아둔 바구니
    near = FEEL.bagNear();
    // 줍기 — 버섯·꽃은 제일 나중에: 옆에 버섯이 있으면 잡은 멧돼지·놓인 도구·사람 쪽 E 가 안 떴다 (사장님 2026-09-27)
    let bd = PL.swim ? 2.4 : 1.7, pk = null;
    for (const s of spots) {
      if (!s.on) continue;
      const d = Math.hypot(s.x - px, s.z - pz);
      if (!near && d < bd && Math.abs(s.y - (PL.swim ? 0 : PL.pos.y)) < 1.6) { bd = d; pk = { kind: 'pick', s }; }
    }
    if (pk) pk.label = pickLabel(pk.s);
    // 사람들
    const sp = WORLD.NPCSPOT;
    const dist = o => Math.hypot(o.x - px, o.z - pz);
    // 가판 앞뿐 아니라 표도르 곁(가판 옆·뒤)에서도 판다 — 사장님 2026-09-20 "안사주는데" (옆에 서 있어 3.2m 밖이었다)
    if (!near && sp.seller && (dist(sp.seller) < 4.5 || (sp.farmer && dist(sp.farmer) < 3.2))) {
      let nf = 0; for (const k in T.fish) nf += T.fish[k];
      const nd = (T.dishes || []).length, nw = T.items.wood || 0, nh = T.items.honey || 0, nb = T.items.berry || 0, np = T.items.boar || 0;
      const lab = (T.basket.length ? ' 🍄' + T.basket.length : '') + (nf ? ' 🐟' + nf : '') + (nd ? ' 🍲' + nd : '')
        + (nw ? ' 🪵' + nw : '') + (nh ? ' 🍯' + nh : '') + (nb ? ' 🫐' + nb : '') + (np ? ' 🐗' + np : '');
      if (lab) near = { kind: 'sell', label: 'E ' + L('팔기', 'SELL') + lab };   // 팔 것이 없으면 아무것도 안 띄운다 (사장님 2026-10-01 "🍄 0 필요없지 않냐")
    }
    if (!near && sp.shop && dist(sp.shop) < 3.2) near = { kind: 'shop', label: 'E ' + L('상점', 'SHOP') };
    // 잠자기는 뺐다 (사장님 2026-09-24 "자는 기능자체가 불필요한듯")
    // 부탁한 주민
    if (!near) near = QUESTS.near;
    // 물·장작·꿀 가져오기
    if (!near) {
      const G = QUESTS.GOODS, it = T.items;
      const fetchAt = (list, g, r) => {
        if (near) return;
        for (const o of list) {
          if (Math.hypot(o.x - px, o.z - pz) > r) continue;
          if ((o.cool || 0) > T.time || (o.crane && o.crane.t >= 0)) continue;
          if ((it[g] || 0) >= G[g].max) { near = { kind: 'full', label: G[g].icon + ' ' + it[g] + '/' + G[g].max }; return; }
          near = { kind: 'fetch', g, o, label: 'E ' + G[g].icon };
          return;
        }
      };
      // 우물은 장식 — 물 긷기는 뺐다 (사장님 2026-09-25 "물긷는 기능도 없애고 우물은 장식으로")
      fetchAt(WORLD.HIVES, 'honey', 1.8);
      fetchAt(WORLD.STUMPS, 'wood', 1.6);
      // 누운 통나무(LOGS)에서 장작 얻기는 뺐다 — 장작은 그루터기에서만 (사장님 2026-09-25)
    }
    // 모닥불·고사리꽃
    if (!near && T.kupala === 1 && Math.hypot(Z.bonfire.x - px, Z.bonfire.z - pz) < 7) near = { kind: 'bonfire', label: 'E 🔥' };
    if (!near && T.kupala === 2 && Math.hypot(Z.fern.x - px, Z.fern.z - pz) < 3) near = { kind: 'fern', label: 'E ✿' };
    // 공 차기·돌 집기 (들고 있으면 던지기가 먼저)
    if (!near) near = SNAKES.near();   // 장화 신고 뱀 차기
    if (!near) near = TOOLS.near();    // 땅에 놓인 도구 들기
    if (!near) near = FISHING.near();
    if (!near) near = PLAY.near();
    if (!near) near = HUNT.near();   // 쓰러진 멧돼지에서 고기
    if (!near) near = ISLAND.near();
    if (!near) near = RIDE.near();
    if (!near) near = pk;   // 버섯·꽃 줍기
    // E 로 도구·바구니 내려놓기는 뺐다 — 가방 창에서 넣고 꺼낸다 (사장님 2026-10-01 "가방으로 들어가니까 필요없다", 작살·장총·바구니 모두)
    // 반짝임 (가까운 버섯·꽃)
    glintT -= dt;
    if (glintT <= 0) {
      glintT = 0.25;
      const pos = glint.geometry.attributes.position;
      let n = 0;
      for (const s of spots) {
        if (!s.on || n >= pos.count) continue;
        const d = Math.hypot(s.x - px, s.z - pz);
        if (d > 22) continue;
        const ph = (t * 0.8 + s.idx * 0.37 + s.sp * 0.13) % 3;
        if (ph > 0.6) continue;
        pos.setXYZ(n++, s.x, s.y + (s.t === 'f' ? 0.9 : 0.55), s.z);
      }
      for (let i = n; i < pos.count; i++) pos.setXYZ(i, 0, -999, 0);
      pos.needsUpdate = true;
    }
    glint.material.size = 0.35 + Math.sin(t * 8) * 0.12;
    if (dizzyT > 0) { dizzyT -= dt; CAM.yaw += Math.sin(t * 3) * dt * 0.8; }
  }

  // ── 행동 ──
  function act() {
    const n = near;
    if (!n) return;
    switch (n.kind) {
      case 'pick': return pick(n.s);
      case 'bag': return FEEL.pickBag();
      case 'sell': return HUD.open('sell');
      case 'shop': return HUD.shop(true);
      case 'quest': return QUESTS.deliver(n.r);
      case 'fetch': return fetch(n);
      case 'full': AUD.sfx('deny'); return;
      case 'cook': return COOK.cook(n.r);
      case 'isl': return ISLAND.act(n);
      case 'rye': case 'feed': case 'mount': case 'ride': return RIDE.act(n);
      case 'bonfire': return GAME.kupalaNight();
      case 'fern': return GAME.fernBloom();
      case 'tool': case 'tooldrop': return TOOLS.act(n);
      case 'snakekick': return SNAKES.act(n);
      case 'pour': return FEEL.pour();
      case 'spear': return FISHING.act(n);
      case 'ladder': return PLAY.act(n);
      case 'boar': return HUNT.take(n.b);
    }
  }

  function pickLabel(s) {
    if (s.t === 'm' && T.basket.length >= cap()) return '🧺 ' + T.basket.length + '/' + cap();
    return 'E ' + L('따기', 'PICK');   // 버섯·꽃·열매는 땅에 난 것이라 따기 (사장님 2026-09-30)
  }
  // 들소 등에서 손이 닿는 것 (들소 옆 2.6m 안)
  function ridePick() {
    let bd = 2.6, n = null;
    for (const s of spots) {
      if (!s.on) continue;
      const d = Math.hypot(s.x - PL.pos.x, s.z - PL.pos.z);
      if (d < bd && Math.abs(s.y - PL.pos.y) < 3.2) { bd = d; n = { kind: 'pick', s }; }
    }
    if (n) n.label = pickLabel(n.s);
    return n;
  }
  function pick(s) {
    // 버섯·블루베리는 바구니에 딴다 — 가방에 있으면 꺼내 든다 (들고 있던 도구는 가방으로)
    if ((s.t === 'm' || s.t === 'p' || s.t === 'e') && !FEEL.held() && !FEEL.takeBag()) { AUD.sfx('deny'); return; }
    if (s.t === 'm' && T.basket.length >= cap()) { AUD.sfx('deny'); HUD.bump('basket'); return; }
    if (s.t === 'e' && (T.items.berry || 0) >= QUESTS.GOODS.berry.max) { AUD.sfx('deny'); return; }
    if (PL.ride) RIDE.reach(s);   // 들소는 멈추고, 등에서 그쪽으로 몸을 숙인다
    else {
      face(s.x, s.z);
      PLAYER.doAct(PL.swim ? 'tread' : 'pick', PL.swim ? 0.5 : 1.25, { speed: 2.2, from: 0.6 });
    }
    // 손이 닿아 뽑히는 순간에 기록 (feel.js 가 흔들고 뽑고 바구니·꽃다발로 날린다)
    FEEL.pluck(s, () => {
      s.on = false; s.re = s.t === 'f' ? 200 + rnd() * 100 : (s.t === 'e' ? 120 : (s.sp === 11 ? 600 : 160 + rnd() * 160));
      setInst(s);
      if (s.t === 'p') {   // 독버섯
        AUD.sfx('poison'); dizzyT = 5; HUD.dizzy(5);
        return;
      }
      if (s.t === 'e') { T.items.berry = (T.items.berry || 0) + 1; FX.pop('🫐', PL.pos); U.save(); return; }
      if (s.t === 'm') {
        T.basket.push(s.sp);
        const key = 'm' + s.sp;
        if (!T.got[key]) { T.got[key] = true; discover('m', s.sp); }
      } else {
        T.fbag[s.sp] = (T.fbag[s.sp] || 0) + 1;
        FX.pop('🌼', PL.pos);
      }
      U.save();
    });
  }

  function discover(t, id) {
    const def = t === 'm' ? SHROOMS[id] : FLOWERS[id];
    AUD.sfx('new');
    HUD.card(t === 'm' ? ICONS.m[id] : ICONS.f[id], L(def.ko, def.en), t);
    checkAll();
  }

  // 표도르가 사 주는 값 (부탁이 없어져 장작·꿀·블루베리도 여기로, 사장님 2026-09-20)
  const GOODS_PRICE = { wood: 20, honey: 50, berry: 8, boar: 300 };   // 멧돼지는 통째로 (2026-09-20)
  // 팔기 — 표도르 곁에서 E 로 창을 열고, 누른 것만 판다 (사장님 2026-09-27 "클릭해서 선택해서 팔게, 클릭하면 얼마인지 가격표시")
  //   줄 하나 = 같은 것끼리 묶음 { key, img|icon, ko, en, n, unit, total }
  function sellList() {
    const rows = [];
    {   // 바구니는 늘 가지고 있다 (손에든 가방에든)
      const c = {}; for (const id of T.basket) c[id] = (c[id] || 0) + 1;
      for (const id in c) rows.push({ key: 'm' + id, img: ICONS.m[id], ko: SHROOMS[id].ko, en: SHROOMS[id].en, n: c[id], unit: SHROOMS[id].price });
    }
    for (const id in T.fish || {}) if (T.fish[id] > 0) { const F = FISHING.FISH[id]; rows.push({ key: 'k' + id, img: FISHING.icon(+id), ko: F.ko, en: F.en, n: T.fish[id], unit: F.price || 0 }); }
    const dc = {}; for (const d of T.dishes || []) (dc[d.k] = dc[d.k] || []).push(d.v);
    for (const k in dc) { const D = COOK.DISHES[k] || { ko: '멧돼지 꼬치구이', en: 'Boar Skewer' };   // 옛 저장의 꼬치구이
      rows.push({ key: 'd' + k, img: COOK.DISHES[k] ? COOK.icon(k) : PLAY.skewerIcon(), ko: D.ko, en: D.en, n: dc[k].length, unit: dc[k][0], total: dc[k].reduce((a, v) => a + v, 0) }); }
    for (const g in GOODS_PRICE) { const c = T.items[g] || 0; if (c) { const G = QUESTS.GOODS[g]; rows.push({ key: 'g' + g, icon: G.icon, ko: G.ko, en: G.en, n: c, unit: GOODS_PRICE[g] }); } }
    for (const r of rows) if (r.total == null) r.total = r.unit * r.n;
    return rows;
  }
  function sellKeys(keys) {
    const rows = sellList().filter(r => keys.includes(r.key));
    let sum = 0, n = 0;
    for (const r of rows) {
      sum += r.total; n += r.n;
      const t = r.key[0], id = r.key.slice(1);
      if (t === 'm') T.basket = T.basket.filter(x => String(x) !== id);
      else if (t === 'k') delete T.fish[id];
      else if (t === 'd') T.dishes = T.dishes.filter(d => d.k !== id);
      else if (t === 'g') T.items[id] = 0;
    }
    if (!sum) { AUD.sfx('deny'); return 0; }
    T.coins += sum; T.sold += n;
    AUD.sfx('coin');
    HUD.praise('+' + sum + ' 🪙');
    U.save();
    return sum;
  }

  function fetch(n) {
    const G = QUESTS.GOODS[n.g];
    face(n.o.x, n.o.z);
    // 두레박 우물: 장대가 내려가 물을 떠 올린다 (world.js drawWater)
    if (n.g === 'water' && n.o.crane) {
      if (!WORLD.drawWater(n.o, pos => {
        T.items.water = Math.min(G.max, (T.items.water || 0) + 1);
        T.did.water = true;
        n.o.cool = T.time + 2;
        FEEL.takePail(pos);
        AUD.sfx('pour');
        U.save();
      })) { AUD.sfx('deny'); return; }
      PLAYER.doAct('pick', 3.4, { speed: 0.8, from: 0.2 });
      return;
    }
    // 장작은 도끼로 패고, 꿀은 연기 뿜어 벌집 판을 들어낸다 (feel.js)
    if (n.g === 'wood' || n.g === 'honey') {
      n.o.cool = T.time + 999;   // 하는 동안 다시 안 눌리게
      FEEL[n.g === 'wood' ? 'chop' : 'honey'](n.o, () => {
        T.items[n.g] = Math.min(G.max, (T.items[n.g] || 0) + 1);
        T.did[n.g] = true;
        n.o.cool = T.time + (n.g === 'honey' ? 90 : (WORLD.STUMPS.includes(n.o) ? 300 : 4));   // 그루터기는 토막 하나뿐 (feel.js stumpTick 이 5분 뒤 다시 놓는다)
        FX.pop(G.icon, PL.pos);
        AUD.sfx('pick');
        U.save();
      });
      return;
    }
    PLAYER.doAct('pick', 1.1, { speed: 2.2, from: 0.6 });
    setTimeout(() => {
      T.items[n.g] = Math.min(G.max, (T.items[n.g] || 0) + 1);
      n.o.cool = T.time + (n.g === 'water' ? 2 : (n.g === 'honey' ? 90 : 45));
      AUD.sfx(n.g === 'water' ? 'splash' : 'pick');
      if (n.g === 'water') { FEEL.splash(new THREE.Vector3(n.o.x, (n.o.y || TER.H(n.o.x, n.o.z)) + 0.2, n.o.z), 8); FEEL.takePail(new THREE.Vector3(n.o.x, (n.o.y || TER.H(n.o.x, n.o.z)) + 0.3, n.o.z)); }
      FX.pop(G.icon, PL.pos);
      U.save();
    }, 500);
  }

  function face(x, z) { PL.yaw = Math.atan2(x - PL.pos.x, z - PL.pos.z); }

  // 넘어지면 바구니에서 버섯이 쏟아진다
  function spill() {
    if (!FEEL.held()) return;
    const k = Math.min(3, T.basket.length);
    for (let i = 0; i < k; i++) {
      const id = T.basket.pop();
      // 가까운 꺼진 자리 하나를 이 버섯 자리로 되살린다
      // 같은 덩어리(주인공 근처) 안의 자리만 옮겨 쓴다 — 멀리 있는 덩어리는 화면에서 잘린다
      const nearCell = q => Math.hypot(q.mesh.userData.cx - PL.pos.x, q.mesh.userData.cz - PL.pos.z) < 75;
      const s = spots.find(q => q.t === 'm' && q.sp === id && !q.on && nearCell(q));
      if (!s) continue;
      const a = rnd() * 6.28;
      s.x = PL.pos.x + Math.cos(a) * (1.5 + rnd() * 1.5); s.z = PL.pos.z + Math.sin(a) * (1.5 + rnd() * 1.5);
      s.y = WORLD.groundAt(s.x, s.z) - 0.02;
      s.on = true; setInst(s);
    }
    if (k) HUD.bump('basket');
  }

  function counts() {
    const c = { m: 0, f: 0, n: 0, b: 0, h: 0, p: PLACES.count(), k: FISHING.counts() };
    for (const k in T.got) if (T.got[k] && c[k[0]] != null && k[0] !== 'h' && k[0] !== 'k') c[k[0]]++;
    for (const k in T.quests) if (T.quests[k]) c.h++;
    return c;
  }
  function checkAll() {
    const c = counts();
    // 황새 둥지·명소는 조건에서 뺐다 (사장님 2026-09-19 "새로운 장소 미션 빼고 황새 둥지 사진 미션도 빼")
    if (false && T.kupala === 0 && c.m >= 12 && c.b >= 12) {   // 쿠팔라의 밤은 엔딩 장면으로만 (사장님 2026-09-20 "엔딩을 9번으로 스토리영상으로")
      T.kupala = 1;
      setTimeout(() => { HUD.praise(L('쿠팔라의 밤', 'KUPALA NIGHT')); AUD.sfx('new'); }, 2600);
      U.save();
    }
  }

  // 남은 것 중 가장 가까운 것
  function guide() {
    const px = PL.pos.x, pz = PL.pos.z;
    if (T.kupala === 1) return { x: Z.bonfire.x, z: Z.bonfire.z };
    if (T.kupala === 2) return { x: Z.fern.x, z: Z.fern.z };
    if (T.kupala >= 3) return null;
    if (!T.met) { const gm = QUESTS.grandma(); if (gm) return gm; }   // 처음엔 할머니부터
    const bp = FEEL.bagPos();
    if (bp && QUESTS.needs().some(q => q.m != null)) return bp;   // 버섯 부탁인데 바구니가 없으면 바구니부터
    const rq = QUESTS.ready();
    if (rq) return rq;
    if (QUESTS.mikPend() != null) { const ms = QUESTS.mikSpot(); if (ms) return ms; }   // 길들인 들소를 타고 있으면 미하스에게 (상)

    let best = null, bd = 1e9;
    const consider = (x, z) => { const d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; best = { x, z }; } };
    // 지금 부탁받은 것이 있는 가장 가까운 곳 (사장님 2026-09-17 "어디로 가야 될지 모르겠어")
    for (const q of QUESTS.needs()) {
      if (q.m != null) { for (const s of spots) if (s.on && s.t === 'm' && s.sp === q.m) consider(s.x, s.z); }
      else if (q.f != null) { for (const s of spots) if (s.on && s.t === 'f' && s.sp === q.f) consider(s.x, s.z); }
      else if (q.g === 'berry') { for (const s of spots) if (s.on && s.t === 'e') consider(s.x, s.z); }
      else if (q.g === 'honey') WORLD.HIVES.forEach(o => { if ((o.cool || 0) <= T.time) consider(o.x, o.z); });
      else if (q.g === 'wood') { WORLD.STUMPS.forEach(o => { if ((o.cool || 0) <= T.time) consider(o.x, o.z); }); }
      else if (q.k != null) consider(Z.lake.x - 20, Z.lake.z);
      else if (q.hunt) HUNT.goals(consider);
      else if (q.ride && !PL.ride) {
        // 길들인 들소 → 친구 들소 → 호밀 → 아무 들소
        const B = ANIMALS.bisons.filter(b => !b.calf);
        let list = B.filter(b => T.tame && T.tame[b.id]);
        if (!list.length) list = B.filter(b => T.got['b' + b.id]);
        if (list.length) list.forEach(b => consider(b.pos.x, b.pos.z));
        else bisonGoal(consider);
      }
    }
    if (best) return best;
    { const ig = ISLAND.goal(); if (ig) return ig; }   // 공주의 열쇠를 가졌으면 얼음할아버지로
    for (const s of spots) {
      if (!s.on || s.t === 'p' || s.t === 'e' || s.t === 'f') continue;
      if (T.got[s.t + s.sp]) continue;
      consider(s.x, s.z);
    }
    if (ANIMALS.bisons.some(b => !T.got['b' + b.id])) bisonGoal(consider);
    if (!best) return QUESTS.pending();
    return best;
  }

  // 친구가 아닌 들소 — 호밀이 없으면 호밀밭부터
  function bisonGoal(consider) {
    if ((T.items.rye || 0) > 0) ANIMALS.bisons.forEach(b => { if (!T.got['b' + b.id]) consider(b.pos.x, b.pos.z); });
    else TER.FIELDS.forEach(f => { if (f.k === 'rye') consider(f.x, f.z); });
  }

  function buy(id) {
    const it = SHOP.find(s => s.id === id);
    if (!it || T.shop[id] || T.coins < it.price || (it.need && !T.shop[it.need])) { AUD.sfx('deny'); return false; }
    T.coins -= it.price; T.shop[id] = true;
    if ((id === 'rifle' || id === 'spear') && window.TOOLS) TOOLS.take(id);   // 장총·작살은 사자마자 손에 (들고 있던 건 발 앞에)
    applyShop();
    AUD.sfx('buy');
    U.save();
    return true;
  }
  function applyShop() {
    if (window.GAME && GAME.lamp) GAME.lamp(!!T.shop.lamp);
  }

  function reset() {
    for (const s of spots) { s.on = true; setInst(s); }
    fern.visible = false; fern.userData.open = 0; fern.userData.opening = false;
  }

  window.ITEMS = { iconsStep, setInst, checkAll, build, update, act, spill, guide, counts, buy, applyShop, cap, reset, sellList, sellKeys, SHROOMS, FLOWERS, POISON, SHOP, ICONS, spots,
    get near() { return near; }, get fern() { return fern; } };
})();
