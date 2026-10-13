// 인형(경품) 그림: 야시장 사격게임의 경품 인형을 그대로 가져와 쓴다. 털 천 재질 + 반짝 눈
(function () {
  const T = THREE;
  const SC = (window.PL = {});
  function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
  SC.rng = rng;
  const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = (a, k) => 'rgb(' + a.map((v) => clamp255(v * (k || 1))).join(',') + ')';
  const rgba = (a, al) => 'rgba(' + a.map(clamp255).join(',') + ',' + al + ')';
  SC.rgb = rgb; SC.rgba = rgba;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  SC.canvas = canvas;
  function tex(c, rx, ry, srgb) {
    const t = new T.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = T.SRGBColorSpace;
    if (rx) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry || rx); }
    t.anisotropy = 4;
    return t;
  }
  SC.tex = tex;
  function mergeGeos(gs) {
    const list = gs.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of list) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += c;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return out;
  }
  SC.mergeGeos = mergeGeos;
  function colored(g, hex, shade) {
    const c = new T.Color(hex);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    let y0 = Infinity, y1 = -Infinity;
    if (shade) { for (let i = 0; i < n; i++) { const y = g.attributes.position.getY(i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    for (let i = 0; i < n; i++) {
      let k = 1;
      if (shade) { const t = (g.attributes.position.getY(i) - y0) / Math.max(1e-4, y1 - y0); k = 1 - shade + shade * t; }
      col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return g;
  }
  SC.colored = colored;
  function noiseCanvas(S, seed, base, amp, blobs) {
    const c = canvas(S, S), x = c.getContext('2d'), r = rng(seed);
    x.fillStyle = rgb([base, base, base]); x.fillRect(0, 0, S, S);
    for (let i = 0; i < S * S * 0.25; i++) { const v = base + (r() - 0.5) * amp; x.fillStyle = rgb([v, v, v]); x.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5); }
    for (let i = 0; i < (blobs || 0); i++) { x.fillStyle = rgba([base - 30, base - 30, base - 30], 0.08); x.beginPath(); x.arc(r() * S, r() * S, 4 + r() * 20, 0, 6.3); x.fill(); }
    return c;
  }
  SC.noiseCanvas = noiseCanvas;
  function star(x, cx, cy, R0, r0) {
    x.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r0 : R0; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath(); x.fill();
  }
  SC.star = star;
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  SC.rr = rr;

  //  경품 인형 12(마지막은 대왕 곰). 털 천 재질 + 반짝 눈
  // ============================================================
  const furBump = tex(noiseCanvas(128, 91, 128, 160, 0), 3, 3, false);
  SC.furMat = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new T.Color(1, 1, 1), bumpMap: furBump, bumpScale: 0.6 });
  SC.glossMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.0 });
  SC.PRIZES = [
    { id: 'bear', name: '곰', c: 0xa86a3a, d: 0x6a3a1a, l: 0xf0d0a8, ears: 'round' },
    { id: 'rabbit', name: '토끼', c: 0xfff4f0, d: 0xf0b8c8, l: 0xffffff, ears: 'long' },
    { id: 'cat', name: '고양이', c: 0xf0a040, d: 0xc86a18, l: 0xfff0d8, ears: 'point', stripes: 1 },
    { id: 'dog', name: '강아지', c: 0xf0d8b0, d: 0x8a5a30, l: 0xffffff, ears: 'flop' },
    { id: 'duck', name: '오리', c: 0xffe04a, d: 0xf0a818, l: 0xff8a2a, ears: 'none', beak: 1 },
    { id: 'penguin', name: '펭귄', c: 0x2a2e3a, d: 0x1a1c24, l: 0xffffff, ears: 'none', beak: 1, belly: 1 },
    { id: 'pig', name: '돼지', c: 0xffb8c8, d: 0xf08aa0, l: 0xff9ab0, ears: 'point', snout: 1 },
    { id: 'frog', name: '개구리', c: 0x6ac84a, d: 0x3a8a2a, l: 0xe8f8b0, ears: 'eyes' },
    { id: 'panda', name: '판다', c: 0xffffff, d: 0x1a1a1a, l: 0xffffff, ears: 'round', panda: 1 },
    { id: 'fox', name: '여우', c: 0xf07a2a, d: 0x8a3a10, l: 0xffffff, ears: 'point', tail: 1 },
    { id: 'dino', name: '공룡', c: 0x7ad85a, d: 0x3a9a3a, l: 0xf8f0a0, ears: 'none', spikes: 1 },
    { id: 'king', name: '대왕 곰돌이', c: 0xfbf8f2, d: 0xe6ded2, l: 0xfff3ea, ears: 'round', ribbon: 1, big: 1 }, // 대왕 곰돌이: 하얀 곰(인형 100개로 교환)
  ];
  SC.makePrize = function (idx) {
    const P = SC.PRIZES[idx];
    const fur = [], gloss = [];
    const S = (r, sx, sy, sz, x, y, z, col, seg) => { const g = new T.SphereGeometry(r, seg || 18, 14); g.scale(sx, sy, sz); g.translate(x, y, z); fur.push(colored(g, col, 0.25)); return g; };
    const G = (r, x, y, z, col) => { const g = new T.SphereGeometry(r, 12, 10); g.translate(x, y, z); gloss.push(colored(g, col)); };
    // 앉은 몸 + 발 + 팔
    S(0.07, 1, 1.05, 0.9, 0, 0.075, 0, P.c);
    if (P.belly) S(0.056, 1, 1.05, 0.55, 0, 0.075, 0.034, P.l);
    else S(0.042, 1, 1.1, 0.45, 0, 0.078, 0.046, P.l);
    for (const s of [-1, 1]) {
      S(0.028, 1, 0.8, 1.35, s * 0.04, 0.02, 0.05, P.d);
      const a = S(0.022, 1, 1.8, 1, s * 0.07, 0.085, 0.015, P.c);
    }
    // 머리
    const HY = 0.18;
    S(0.068, 1.08, 0.98, 1, 0, HY, 0.005, P.c);
    if (P.snout) S(0.026, 1.3, 1, 0.8, 0, HY - 0.012, 0.062, P.l);
    else if (!P.beak) S(0.03, 1.3, 0.85, 0.8, 0, HY - 0.018, 0.055, P.l);
    if (P.beak) { const b = new T.SphereGeometry(0.022, 12, 8); b.scale(1.4, 0.5, 1.2); b.translate(0, HY - 0.012, 0.066); fur.push(colored(b, 0xff8a2a)); }
    // 눈·코
    const eyeY = P.ears === 'eyes' ? HY + 0.05 : HY + 0.012;
    for (const s of [-1, 1]) {
      if (P.panda) S(0.02, 1, 1.25, 0.6, s * 0.03, eyeY, 0.055, P.d);
      if (P.ears === 'eyes') S(0.024, 1, 1, 1, s * 0.035, HY + 0.05, 0.03, P.c);
      G(0.011, s * 0.028, eyeY, 0.063, 0x0a0a0c);
      G(0.003, s * 0.028 + 0.004, eyeY + 0.004, 0.073, 0xffffff);
    }
    if (!P.beak) G(0.009, 0, HY - 0.008, P.snout ? 0.082 : 0.078, P.snout ? 0xd86a80 : 0x1a1210);
    // 볼 발그레
    for (const s of [-1, 1]) { const g = new T.SphereGeometry(0.011, 8, 6); g.scale(1.4, 0.8, 0.4); g.translate(s * 0.045, HY - 0.018, 0.058); fur.push(colored(g, 0xff9aa8)); }
    // 귀
    for (const s of [-1, 1]) {
      if (P.ears === 'round') { S(0.024, 1, 1, 0.6, s * 0.05, HY + 0.055, 0, P.panda ? P.d : P.c); S(0.013, 1, 1, 0.4, s * 0.05, HY + 0.055, 0.01, P.panda ? 0x3a3a3a : P.l); }
      else if (P.ears === 'long') { const e = S(0.018, 0.9, 3.0, 0.6, s * 0.025, HY + 0.1, -0.005, P.c); S(0.01, 0.9, 2.6, 0.3, s * 0.025, HY + 0.1, 0.006, P.d); }
      else if (P.ears === 'point') { const e = new T.ConeGeometry(0.024, 0.045, 12); e.rotateZ(-s * 0.35); e.translate(s * 0.045, HY + 0.07, 0); fur.push(colored(e, P.c, 0.2)); const e2 = new T.ConeGeometry(0.013, 0.03, 10); e2.rotateZ(-s * 0.35); e2.translate(s * 0.044, HY + 0.066, 0.008); fur.push(colored(e2, P.d)); }
      else if (P.ears === 'flop') { S(0.022, 0.7, 1.6, 0.5, s * 0.07, HY + 0.005, 0, P.d); }
    }
    if (P.stripes) for (let k = -1; k <= 1; k++) { const g = new T.TorusGeometry(0.066, 0.005, 5, 16, 0.6); g.rotateY(Math.PI / 2); g.rotateZ(Math.PI / 2 - 0.3); g.rotateX(k * 0.3); g.translate(0, HY, 0); fur.push(colored(g, P.d)); }
    if (P.tail) { const g = new T.SphereGeometry(0.03, 12, 10); g.scale(0.8, 0.8, 2.2); g.rotateX(-0.5); g.translate(0.05, 0.05, -0.08); fur.push(colored(g, P.c, 0.2)); const t2 = new T.SphereGeometry(0.018, 10, 8); t2.translate(0.06, 0.08, -0.14); fur.push(colored(t2, P.l)); }
    if (P.spikes) for (let k = 0; k < 4; k++) { const g = new T.ConeGeometry(0.014, 0.03, 8); g.rotateX(-0.3 - k * 0.35); g.translate(0, HY + 0.07 - k * 0.04, -0.03 - k * 0.025); fur.push(colored(g, 0xffc83a)); }
    if (P.ribbon) { for (const s of [-1, 1]) { const g = new T.ConeGeometry(0.022, 0.05, 10); g.rotateZ(s * Math.PI / 2); g.translate(s * 0.026, HY - 0.07, 0.06); fur.push(colored(g, 0xd8261e)); } const k = new T.SphereGeometry(0.012, 10, 8); k.translate(0, HY - 0.07, 0.066); fur.push(colored(k, 0xd8261e)); }
    const grp = new T.Group();
    const m1 = new T.Mesh(mergeGeos(fur), SC.furMat); m1.castShadow = true; grp.add(m1);
    const m2 = new T.Mesh(mergeGeos(gloss), SC.glossMat); grp.add(m2);
    if (P.big) grp.scale.setScalar(3.2);
    return grp;
  };

})();
