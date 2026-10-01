// geo.js — 도형 잇기·색칠·캔버스 질감 도우미
(function () {
  // 여러 도형을 한 도형으로 (색 속성이 없으면 흰색으로 채운다)
  function merge(list) {
    const parts = list.map(g => g.index ? g.toNonIndexed() : g);
    let n = 0; for (const g of parts) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
    let o = 0;
    for (const g of parts) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (!g.attributes.normal) g.computeVertexNormals();
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
      else col.fill(1, o * 3, (o + c) * 3);
      o += c;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.computeBoundingSphere();
    return out;
  }
  // 도형 전체를 한 색으로 (선형 색)
  function tint(g, hex, jitter, rnd) {
    if (g.index) g = g.toNonIndexed();
    const c = new THREE.Color(hex);
    const n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const j = jitter ? 1 + ((rnd ? rnd() : Math.random()) - 0.5) * jitter : 1;
      a[i * 3] = c.r * j; a[i * 3 + 1] = c.g * j; a[i * 3 + 2] = c.b * j;
    }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  }
  // 아래(y 최저)는 어둡게, 위는 밝게 — 덩어리에 명암을 넣는다
  function shadeY(g, lo, hi) {
    const p = g.attributes.position, c = g.attributes.color;
    let y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); }
    for (let i = 0; i < p.count; i++) {
      const k = U.lerp(lo, hi, (p.getY(i) - y0) / Math.max(1e-4, y1 - y0));
      c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
    }
    return g;
  }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
  function tex(c, rep, srgb) {
    const t = new THREE.CanvasTexture(c);
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function M(g) { return g; }
  const box = (w, h, d, x, y, z, ry) => { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x || 0, y || 0, z || 0); return g; };
  const cyl = (r0, r1, h, seg, x, y, z) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg || 8); g.translate(x || 0, (y || 0) + h / 2, z || 0); return g; };
  // 양면 판의 뒷면도 앞면처럼 밝게
  function noFlip(m) {
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      if (prev) prev(sh, r);
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>',
        THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''));
    };
    return m;
  }
  window.GEO = { noFlip, merge, tint, shadeY, canvas, tex, box, cyl, M };
})();
