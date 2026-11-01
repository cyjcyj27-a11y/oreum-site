// 모양 만들기: 줄마다 바닥·장애물을 한 덩어리(꼭짓점 색)로 합쳐 그리기 횟수를 줄인다.
// 햄스터는 볼이 부풀어야 하니 따로 조각으로 둔다.
(function () {
  const M = (window.MDL = {});
  const T = THREE;
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _c = new T.Color();

  // 모서리 둥근 상자: 상자를 잘게 쪼갠 뒤 안쪽 상자 밖으로 나온 꼭짓점을 반지름 r 공 위로 민다
  const RB = new Map();
  M.rbox = function (w, h, d, r, seg) {
    const key = [w, h, d, r, seg].join(',');
    if (RB.has(key)) return RB.get(key);
    seg = seg || 3; r = Math.min(r, w / 2, h / 2, d / 2);
    const g = new T.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2);
    const p = g.attributes.position, n = g.attributes.normal, hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r, v = new T.Vector3(), c = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      c.set(Math.max(-hw, Math.min(hw, v.x)), Math.max(-hh, Math.min(hh, v.y)), Math.max(-hd, Math.min(hd, v.z)));
      v.sub(c); if (v.lengthSq() > 1e-9) { v.normalize(); n.setXYZ(i, v.x, v.y, v.z); v.multiplyScalar(r).add(c); p.setXYZ(i, v.x, v.y, v.z); }
    }
    RB.set(key, g); return g;
  };
  const G = {};
  M.sph = (s) => G['s' + s] || (G['s' + s] = new T.SphereGeometry(1, s || 14, Math.max(8, Math.round((s || 14) * 0.7))));
  M.cyl = (rt, rb, s) => { const k = 'c' + rt + ',' + rb + ',' + s; return G[k] || (G[k] = new T.CylinderGeometry(rt, rb, 1, s || 16)); };
  M.cone = (s) => G['k' + s] || (G['k' + s] = new T.ConeGeometry(1, 1, s || 16));
  M.tor = (r, t) => { const k = 't' + r + ',' + t; return G[k] || (G[k] = new T.TorusGeometry(r, t, 8, 20)); };
  M.BALL_R = 0.47; // 마당·공원에서 굴러가는 큰 공 반지름
  M.box = () => G.box || (G.box = new T.BoxGeometry(1, 1, 1));

  // 조각 모음: add(모양, 색, 위치, 돌림, 크기) → merge() 하면 꼭짓점 색 한 덩어리
  M.Parts = function () { this.list = []; };
  M.Parts.prototype.add = function (geo, color, pos, rot, scl) {
    _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0);
    _q.setFromEuler(_e);
    _m.compose(new T.Vector3(pos[0], pos[1], pos[2]), _q, scl ? new T.Vector3(scl[0], scl[1], scl[2]) : new T.Vector3(1, 1, 1));
    this.list.push({ geo, color, m: _m.clone() });
    return this;
  };
  // 다른 모음을 옮겨서 붙이기
  M.Parts.prototype.addParts = function (pp, pos, ry, s) {
    const base = new T.Matrix4().compose(new T.Vector3(pos[0], pos[1], pos[2]), new T.Quaternion().setFromEuler(new T.Euler(0, ry || 0, 0)), new T.Vector3(s || 1, s || 1, s || 1));
    for (const it of pp.list) this.list.push({ geo: it.geo, color: it.color, m: base.clone().multiply(it.m) });
    return this;
  };
  const NI = new WeakMap();
  M.Parts.prototype.merge = function () {
    let n = 0;
    const pre = this.list.map((it) => {
      let g = it.geo;
      if (g.index) { if (!NI.has(g)) NI.set(g, g.toNonIndexed()); g = NI.get(g); }
      n += g.attributes.position.count; return g;
    });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
    const v = new T.Vector3(), nm = new T.Matrix3();
    let o = 0;
    this.list.forEach((it, k) => {
      const g = pre[k], p = g.attributes.position, nn = g.attributes.normal;
      nm.getNormalMatrix(it.m); _c.set(it.color);
      for (let i = 0; i < p.count; i++, o++) {
        v.fromBufferAttribute(p, i).applyMatrix4(it.m); P[o * 3] = v.x; P[o * 3 + 1] = v.y; P[o * 3 + 2] = v.z;
        v.fromBufferAttribute(nn, i).applyMatrix3(nm).normalize(); N[o * 3] = v.x; N[o * 3 + 1] = v.y; N[o * 3 + 2] = v.z;
        C[o * 3] = _c.r; C[o * 3 + 1] = _c.g; C[o * 3 + 2] = _c.b;
      }
    });
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(P, 3));
    out.setAttribute('normal', new T.BufferAttribute(N, 3));
    out.setAttribute('color', new T.BufferAttribute(C, 3));
    out.computeBoundingSphere();
    return out;
  };

  // 재질: 장난감 같은 반무광 + 가장자리가 살짝 밝은 보송한 빛
  function fuzz(m, k) {
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n float rimK = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 2.2);\n totalEmissiveRadiance += diffuseColor.rgb * rimK * ' + k.toFixed(2) + ';');
    };
    m.customProgramCacheKey = () => 'fz' + k;
    return m;
  }
  M.vmat = fuzz(new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 }), 0.22);
  M.wet = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.0 });
  const furMats = new Map();
  M.fur = (c) => { if (!furMats.has(c)) furMats.set(c, fuzz(new T.MeshStandardMaterial({ color: c, roughness: 0.92 }), 0.55)); return furMats.get(c); };
  const flat = new Map();
  M.mat = (c, r) => { const k = c + ':' + (r || 0.7); if (!flat.has(k)) flat.set(k, new T.MeshStandardMaterial({ color: c, roughness: r || 0.7 })); return flat.get(k); };

  // ---------- 햄스터 ----------
  // 앞이 -z. root(자리) > hop(뛰기·찌그러짐) > 몸 조각들. 볼 두 개는 따로 잡아 둔다.
  // 서 있는 찹쌀떡 몸 하나: 크림 몸통 위에 주황 털 모자(등 쪽으로 기울여 등은 거의 주황), 눈은 모자 경계에.
  const CAP = new Map();
  function capGeo(th, tilt) { const k = th + ':' + tilt; if (!CAP.has(k)) CAP.set(k, new T.SphereGeometry(1, 34, 22, 0, Math.PI * 2, 0, th).rotateX(tilt)); return CAP.get(k); } // 공 상태에서 기울여야 몸통과 꼭 겹친다
  // ---------- Meshy 햄스터(js/hmodel.js) ----------
  // 보통 모습과 볼 꽉 찬 모습 두 벌. 품종 색은 그림의 주황 털만 품종 털색으로 바꿔 칠한다.
  const HG = {}, HT = {};
  function b64(s, Arr) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Arr(u.buffer); }
  M.HM_TURN = Math.PI; // Meshy 모델은 +z 를 보고 있어 게임 앞(-z)으로 돌린다
  function hmGeo(k) {
    if (HG[k]) return HG[k];
    const d = window.HMODEL[k], g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(b64(d.pos, Float32Array), 3));
    g.setAttribute('normal', new T.BufferAttribute(b64(d.nor, Float32Array), 3));
    g.setAttribute('uv', new T.BufferAttribute(b64(d.uv, Float32Array), 2));
    g.setIndex(new T.BufferAttribute(b64(d.idx, Uint32Array), 1));
    g.rotateY(M.HM_TURN);
    g.computeBoundingBox(); const bb = g.boundingBox, c = new T.Vector3(); bb.getCenter(c);
    g.translate(-c.x, -bb.min.y, -c.z);
    const s = 0.82 / (bb.max.y - bb.min.y); g.scale(s, s, s); // 키 0.82(귀 끝까지)
    g.computeBoundingBox(); g.computeBoundingSphere();
    return (HG[k] = g);
  }
  const IMG = {};
  function hmImg(k, cb) {
    if (!IMG[k]) { const im = new Image(); IMG[k] = { im, ok: false, w: [] }; im.onload = () => { IMG[k].ok = true; IMG[k].w.forEach((f) => f()); }; im.src = window.HMODEL[k].tex; }
    const o = IMG[k]; if (o.ok) cb(o.im); else o.w.push(() => cb(o.im));
  }
  function hsl(r, g, b) { // 0~1 sRGB → [h, s, l]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
  function recolor(im, b, size) { // size 를 주면 그 크기로 줄여서 칠한다(사진용, 빠름)
    const c = document.createElement('canvas'); c.width = size || im.width; c.height = size || im.height;
    const g = c.getContext('2d'); g.drawImage(im, 0, 0, c.width, c.height);
    if (b.id === 'golden') return c;
    const d = g.getImageData(0, 0, c.width, c.height), p = d.data, top = rgb(b.patch || b.top), bel = rgb(b.belly);
    for (let i = 0; i < p.length; i += 4) {
      const [h, s, l] = hsl(p[i] / 255, p[i + 1] / 255, p[i + 2] / 255);
      if (h > 0.04 && h < 0.13 && s > 0.45 && l > 0.3 && l < 0.82) { // 주황 털 → 품종 털색(밝기 결은 그대로)
        const k = l / 0.62; p[i] = Math.min(255, top[0] * k); p[i + 1] = Math.min(255, top[1] * k); p[i + 2] = Math.min(255, top[2] * k);
      } else if (b.id === 'black' && l > 0.8 && h > 0.03 && h < 0.16) { // 블랙은 크림 배도 어둡게
        const k = l / 0.92; p[i] = bel[0] * k; p[i + 1] = bel[1] * k; p[i + 2] = bel[2] * k;
      }
    }
    g.putImageData(d, 0, 0); return c;
  }
  function hmMat(k, b) {
    const key = k + ':' + b.id; if (HT[key]) return HT[key];
    const tex = new T.Texture(); tex.colorSpace = T.SRGBColorSpace; tex.generateMipmaps = false; tex.minFilter = T.LinearFilter; tex.anisotropy = 8;
    const m = fuzz(new T.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0 }), 0.28);
    hmImg(k, (im) => { tex.image = recolor(im, b); tex.needsUpdate = true; });
    return (HT[key] = m);
  }
  function meshyHamster(b) {
    const root = new T.Group(), hop = new T.Group(); root.add(hop);
    const norm = new T.Mesh(hmGeo('ham'), hmMat('ham', b)), full = new T.Mesh(hmGeo('full'), hmMat('full', b));
    norm.castShadow = full.castShadow = true; full.visible = false; hop.add(norm, full);
    const sh = new T.Mesh(new T.CircleGeometry(0.36, 22), new T.MeshBasicMaterial({ color: 0x2a1a10, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; root.add(sh);
    const sc = b.small ? 0.94 : 1.08;
    hop.scale.setScalar(sc);
    root.userData = { hop, norm, full, cheeks: [], shadow: sh, base: sc, meshy: true };
    return root;
  }

  // 사진 찍기용 햄스터 한 벌(js/portrait.js). 그림을 512 로 줄여 칠하고, 다 칠하면 done
  M.hamsterShot = function (k, b, done) {
    const tex = new T.Texture(); tex.colorSpace = T.SRGBColorSpace; tex.generateMipmaps = false; tex.minFilter = T.LinearFilter;
    const m = fuzz(new T.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0 }), 0.28), o = new T.Mesh(hmGeo(k), m);
    hmImg(k, (im) => { tex.image = recolor(im, b, 512); tex.needsUpdate = true; done(o); });
  };

  M.hamster = function (b) {
    if (window.HMODEL) return meshyHamster(b);
    const root = new T.Group(), hop = new T.Group(); root.add(hop);
    const top = M.fur(b.top), belly = M.fur(b.belly), pink = M.mat(0xf6a3ae, 0.55), black = M.mat(0x141012, 0.18), white = M.mat(0xffffff, 0.3);
    const S = M.sph(30);
    function m(geo, mat, x, y, z, sx, sy, sz, p) { const o = new T.Mesh(geo, mat); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; (p || hop).add(o); return o; }
    const RX = 0.37, RY = 0.4, RZ = 0.35, CY = 0.4;
    const surfZ = (x, y) => -RZ * Math.sqrt(Math.max(0, 1 - (x / RX) ** 2 - ((y - CY) / RY) ** 2)); // 앞면 z
    const body = m(S, belly, 0, CY, 0, RX, RY, RZ);
    // 털 모자: 위에서 1.86 라디안까지 덮고 뒤로 0.56 기울임 → 앞은 눈 위, 뒤는 엉덩이 가까이
    m(capGeo(1.86, 0.56), top, 0, CY, 0, RX * 1.012, RY * 1.012, RZ * 1.012);
    if (b.stripe) m(capGeo(2.0, 1.25), M.fur(b.stripe), 0, CY, 0, 0.045, RY * 1.02, RZ * 1.02); // 이마에서 꼬리까지 등줄
    const cheeks = [];
    for (const sx of [-1, 1]) {
      const ex = sx * 0.14, ey = 0.475;
      cheeks.push(m(S, belly, sx * 0.19, 0.35, -0.17, 0.1, 0.09, 0.1));
      if (b.patch) m(S, M.fur(b.patch), ex, ey + 0.005, surfZ(ex, ey) + 0.012, 0.1, 0.095, 0.03); // 판다 눈 무늬
      const ez = surfZ(ex, ey);
      m(S, black, ex, ey, ez + 0.014, 0.07, 0.078, 0.042);                 // 큰 눈
      m(S, white, ex + 0.013, ey + 0.028, ez - 0.026, 0.022, 0.022, 0.01); // 눈 반짝(큰 점)
      m(S, white, ex - 0.02, ey - 0.03, ez - 0.022, 0.009, 0.009, 0.006);  // 작은 반짝
      if (b.brow) m(S, M.fur(b.brow), ex, ey + 0.1, surfZ(ex, ey + 0.1) + 0.01, 0.05, 0.022, 0.02);
      // 동그란 귀
      const ear = m(S, b.patch ? M.fur(b.patch) : top, sx * 0.215, 0.755, 0.0, 0.115, 0.11, 0.05); ear.rotation.z = sx * -0.42;
      const inn = m(S, pink, sx * 0.217, 0.752, -0.04, 0.072, 0.068, 0.018); inn.rotation.z = sx * -0.42;
      m(S, pink, sx * 0.11, 0.235, surfZ(0.11, 0.235) + 0.012, 0.058, 0.048, 0.05);   // 앞발(배 앞에 모음)
      m(S, pink, sx * 0.15, 0.035, -0.2, 0.075, 0.04, 0.085);              // 뒷발
    }
    const nz = surfZ(0, 0.44);
    m(S, pink, 0, 0.44, nz - 0.004, 0.024, 0.019, 0.018);                  // 코
    m(S, M.mat(0xb8424e, 0.5), 0, 0.378, surfZ(0, 0.378) + 0.012, 0.04, 0.032, 0.02);  // 벌린 입
    m(S, M.mat(0xf27a86, 0.5), 0, 0.368, surfZ(0, 0.368) + 0.004, 0.026, 0.016, 0.012); // 혀
    m(M.box(), white, -0.01, 0.4, surfZ(0, 0.4) - 0.006, 0.017, 0.026, 0.01); // 앞니
    m(M.box(), white, 0.01, 0.4, surfZ(0, 0.4) - 0.006, 0.017, 0.026, 0.01);
    m(S, top, 0, 0.16, 0.34, 0.045, 0.04, 0.04);                           // 꼬리
    // 볼이 꽉 차면 입에 문 씨
    const mouth = new T.Group(); hop.add(mouth); mouth.visible = false;
    const sd = M.mat(0x2a2628, 0.45), sl = M.mat(0xe8e2d6, 0.6);
    [[-0.035, 0.36, 0.5], [0.03, 0.355, -0.4], [0, 0.335, 0.1]].forEach(([x, y, r]) => {
      const g = new T.Group(); g.position.set(x, y, surfZ(x, y) - 0.012); g.rotation.set(-0.3, 0, r); mouth.add(g);
      m(S, sd, 0, 0, 0, 0.03, 0.05, 0.022, g); m(S, sl, 0, 0, -0.016, 0.006, 0.042, 0.008, g);
    });
    // 수염: 짧고 흰 줄
    const wp = [];
    for (const sx of [-1, 1]) for (const a of [-0.03, 0.03]) wp.push(sx * 0.2, 0.4 + a, -0.27, sx * 0.37, 0.41 + a * 2.4, -0.26);
    const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(wp, 3));
    hop.add(new T.LineSegments(wg, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })));
    // 바닥 그림자(흐린 원)
    const sh = new T.Mesh(new T.CircleGeometry(0.36, 22), new T.MeshBasicMaterial({ color: 0x2a1a10, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; root.add(sh);
    const sc = b.small ? 1.0 : 1.15;
    hop.scale.setScalar(sc);
    root.userData = { hop, cheeks, body, mouth, shadow: sh, base: sc };
    return root;
  };
  M.setCheek = function (h, k) { // k: 0~1
    if (h.userData.meshy) { const f = k >= 0.75; h.userData.full.visible = f; h.userData.norm.visible = !f; h.userData.norm.scale.set(1 + k * 0.16, 1, 1 + k * 0.06); return; }
    h.userData.cheeks.forEach((c, i) => { c.scale.set(0.1 * (1 + k * 1.2), 0.09 * (1 + k * 0.9), 0.1 * (1 + k * 0.8)); c.position.x = (i ? 1 : -1) * (0.19 + k * 0.08); c.position.y = 0.35 - k * 0.015; c.position.z = -0.17 - k * 0.05; });
    if (h.userData.mouth) h.userData.mouth.visible = k >= 0.75;
  };

  // ---------- 해바라기씨 ----------
  M.seed = function (gold) {
    const p = new M.Parts();
    if (gold) { p.add(M.sph(14), 0xffc93a, [0, 0, 0], 0, [0.14, 0.1, 0.26]).add(M.sph(10), 0xfff2a0, [0, 0.06, -0.05], 0, [0.07, 0.04, 0.11]); }
    else {
      p.add(M.sph(14), 0x3a3634, [0, 0, 0], 0, [0.12, 0.085, 0.23]);
      for (const x of [-0.045, 0, 0.045]) p.add(M.sph(8), 0xf2efe6, [x * 1.3, 0.016, 0], 0, [0.016, 0.076, 0.21]);
    }
    return p;
  };

  // ---------- 장애물(한 칸 안) ----------
  const PAST = (M.PAST = [0xff8a80, 0x7fc8f8, 0xffd36a, 0x9be08a, 0xc9a6ff, 0xff9ccf]);
  M.obstacle = function (kind, rnd) {
    const p = new M.Parts(), col = PAST[Math.floor(rnd() * PAST.length)];
    switch (kind) {
      case 'block': { // 그림 붙은 나무 글자 블록
        const s = 0.72 + rnd() * 0.12, ry = (rnd() - 0.5) * 0.5;
        p.add(M.rbox(s, s, s, 0.07, 2), 0xe8c48e, [0, s / 2, 0], [0, ry, 0]);
        for (let f = 0; f < 4; f++) { const a = ry + f * Math.PI / 2; p.add(M.rbox(s * 0.7, s * 0.7, 0.03, 0.04, 1), PAST[(f + Math.floor(rnd() * 6)) % 6], [Math.sin(a) * s / 2, s / 2, Math.cos(a) * s / 2], [0, a, 0]); }
        if (rnd() < 0.4) p.add(M.rbox(s * 0.8, s * 0.8, s * 0.8, 0.06, 2), 0xe8c48e, [0.05, s + s * 0.4, -0.02], [0, ry + 0.6, 0]).add(M.rbox(s * 0.56, 0.03, s * 0.56, 0.02, 1), PAST[Math.floor(rnd() * 6)], [0.05, s + s * 0.8 + 0.01, -0.02], [0, ry + 0.6, 0]);
        break; }
      case 'crayon': {
        const n = 1 + Math.floor(rnd() * 2);
        for (let i = 0; i < n; i++) { const c = PAST[Math.floor(rnd() * 6)], x = (i - (n - 1) / 2) * 0.3, rz = (rnd() - 0.5) * 0.2;
          p.add(M.cyl(0.12, 0.12, 10), c, [x, 0.42, 0], [0, 0, rz], [1, 0.84, 1]).add(M.cyl(0.125, 0.125, 10), 0xffffff, [x, 0.42, 0], [0, 0, rz], [1, 0.45, 1]).add(M.cone(10), c, [x, 0.95, 0], [0, 0, rz], [0.12, 0.22, 0.12]); }
        break; }
      case 'ball': {
        const r = 0.36;
        p.add(M.sph(18), col, [0, r, 0], 0, [r, r, r]).add(M.sph(18), 0xffffff, [0, r, 0], [0.3, 0, 0.5], [r * 1.01, r * 0.35, r * 1.01]);
        break; }
      case 'mug': {
        p.add(M.cyl(0.3, 0.27, 20), col, [0, 0.32, 0], 0, [1, 0.64, 1]).add(M.cyl(0.25, 0.25, 20), 0x5a3a24, [0, 0.635, 0], 0, [1, 0.04, 1]).add(M.tor(0.13, 0.04), col, [0.32, 0.33, 0], 0, [1, 1.2, 1]);
        break; }
      case 'onion': {
        p.add(M.sph(16), 0xb0607a, [0, 0.3, 0], 0, [0.32, 0.3, 0.32]).add(M.cone(8), 0x9a5068, [0, 0.66, 0], 0, [0.07, 0.16, 0.07]).add(M.sph(10), 0xe8d0b0, [0, 0.03, 0], 0, [0.12, 0.04, 0.12]);
        break; }
      case 'milk': {
        p.add(M.box(), 0xffffff, [0, 0.4, 0], 0, [0.5, 0.8, 0.5]).add(M.box(), 0x5aa8e8, [0, 0.36, 0], 0, [0.51, 0.24, 0.51]).add(M.cone(4), 0xf2f2f2, [0, 0.9, 0], [0, Math.PI / 4, 0], [0.36, 0.2, 0.36]);
        break; }
      case 'pot': {
        p.add(M.cyl(0.32, 0.23, 14), 0xd2734a, [0, 0.27, 0], 0, [1, 0.54, 1]).add(M.cyl(0.35, 0.35, 14), 0xc0653e, [0, 0.52, 0], 0, [1, 0.08, 1]).add(M.sph(12), 0x5aa848, [0, 0.72, 0], 0, [0.36, 0.28, 0.36]).add(M.sph(10), 0x6cbf58, [0.12, 0.86, 0.05], 0, [0.2, 0.18, 0.2]);
        if (rnd() < 0.5) p.add(M.sph(8), 0xff7a9a, [-0.1, 0.92, -0.12], 0, [0.08, 0.08, 0.08]);
        break; }
      case 'rock': {
        const s = 0.32 + rnd() * 0.1;
        p.add(M.sph(7), 0xa8a29a, [0, s * 0.7, 0], [rnd(), rnd(), rnd()], [s * 1.2, s * 0.9, s]).add(M.sph(6), 0x958f88, [s * 0.5, s * 0.4, 0.1], [rnd(), 0, 0], [s * 0.6, s * 0.5, s * 0.6]);
        break; }
      case 'shroom': {
        p.add(M.cyl(0.09, 0.12, 10), 0xf6ecd8, [0, 0.22, 0], 0, [1, 0.44, 1]).add(M.sph(16), 0xe8443a, [0, 0.46, 0], 0, [0.32, 0.22, 0.32]);
        for (let i = 0; i < 5; i++) { const a = i * 1.26 + rnd(); p.add(M.sph(6), 0xffffff, [Math.cos(a) * 0.2, 0.55, Math.sin(a) * 0.2], 0, [0.05, 0.03, 0.05]); }
        break; }
      case 'cone': {
        p.add(M.box(), 0xff7a1a, [0, 0.03, 0], 0, [0.6, 0.06, 0.6]).add(M.cone(14), 0xff7a1a, [0, 0.45, 0], 0, [0.24, 0.8, 0.24]).add(M.cyl(0.155, 0.185, 14), 0xffffff, [0, 0.45, 0], 0, [1, 0.16, 1]);
        break; }
      case 'hydrant': {
        p.add(M.cyl(0.2, 0.22, 14), 0xd8382a, [0, 0.36, 0], 0, [1, 0.6, 1]).add(M.sph(12), 0xd8382a, [0, 0.68, 0], 0, [0.2, 0.14, 0.2]).add(M.cyl(0.07, 0.07, 8), 0xe8b030, [0, 0.4, 0], [0, 0, Math.PI / 2], [1, 0.62, 1]).add(M.cyl(0.25, 0.25, 14), 0xb82a20, [0, 0.07, 0], 0, [1, 0.12, 1]);
        break; }
      case 'bag': {
        p.add(M.sph(10), 0x2a2a30, [0, 0.33, 0], [rnd(), 0, 0], [0.4, 0.33, 0.36]).add(M.sph(8), 0x34343a, [0, 0.66, 0], 0, [0.1, 0.1, 0.1]).add(M.cone(6), 0x2a2a30, [0.06, 0.76, 0], [0, 0, -0.5], [0.06, 0.14, 0.04]);
        break; }
      case 'stump': {
        p.add(M.cyl(0.36, 0.42, 14), 0x8a5a36, [0, 0.3, 0], 0, [1, 0.6, 1]).add(M.cyl(0.33, 0.33, 14), 0xe2c08a, [0, 0.605, 0], 0, [1, 0.01, 1]).add(M.tor(0.18, 0.015), 0xb08a5a, [0, 0.612, 0], [Math.PI / 2, 0, 0]);
        break; }
      case 'flower': {
        const n = 2 + Math.floor(rnd() * 2);
        for (let i = 0; i < n; i++) { const x = (rnd() - 0.5) * 0.5, z = (rnd() - 0.5) * 0.5, h = 0.5 + rnd() * 0.3, c = [0xff6a8a, 0xffd23a, 0xffffff, 0xb08aff][Math.floor(rnd() * 4)];
          p.add(M.cyl(0.025, 0.025, 6), 0x4a9a3a, [x, h / 2, z], 0, [1, h, 1]);
          for (let k = 0; k < 5; k++) { const a = k * 1.2566; p.add(M.sph(8), c, [x + Math.cos(a) * 0.08, h, z + Math.sin(a) * 0.08], 0, [0.07, 0.03, 0.07]); }
          p.add(M.sph(8), 0xffa31a, [x, h + 0.02, z], 0, [0.05, 0.035, 0.05]); }
        p.add(M.sph(8), 0x5aa848, [0, 0.08, 0], 0, [0.35, 0.1, 0.3]);
        break; }
      case 'sunflower': { // 엔딩 밭
        const h = 1.6 + rnd() * 1.0;
        p.add(M.cyl(0.05, 0.06, 8), 0x4a8a2a, [0, h / 2, 0], 0, [1, h, 1]).add(M.sph(8), 0x5aa83a, [0.18, h * 0.45, 0], [0, 0, -0.6], [0.22, 0.03, 0.12]).add(M.sph(8), 0x5aa83a, [-0.18, h * 0.6, 0], [0, 0, 0.6], [0.22, 0.03, 0.12]);
        for (let k = 0; k < 14; k++) { const a = k * 0.4488; p.add(M.sph(8), 0xffc81e, [Math.cos(a) * 0.28, h + Math.sin(a) * 0.28, 0.02], [0, 0, a], [0.16, 0.06, 0.03]); }
        p.add(M.cyl(0.2, 0.2, 18), 0x5a3a1a, [0, h, 0.04], [Math.PI / 2, 0, 0], [1, 0.06, 1]);
        break; }
    }
    return p;
  };

  // ---------- 움직이는 것(길이 L, 앞이 +x) ----------
  M.mover = function (kind, L, col) {
    const p = new M.Parts();
    const wheel = (x, z, r, c) => p.add(M.cyl(r, r, 14), c || 0x2a2a2e, [x, r, z], [Math.PI / 2, 0, 0], [1, 0.16, 1]).add(M.cyl(r * 0.45, r * 0.45, 10), 0xd8d8de, [x, r, z + (z > 0 ? 0.08 : -0.08)], [Math.PI / 2, 0, 0], [1, 0.02, 1]);
    switch (kind) {
      case 'toycar': { // 태엽 자동차
        p.add(M.rbox(L * 0.92, 0.36, 0.78, 0.14, 2), col, [0, 0.34, 0]).add(M.rbox(L * 0.5, 0.3, 0.66, 0.12, 2), col, [-L * 0.08, 0.62, 0]).add(M.rbox(L * 0.42, 0.22, 0.68, 0.08, 2), 0xbfe8ff, [-L * 0.08, 0.63, 0]);
        p.add(M.sph(10), 0xfff6c0, [L * 0.46, 0.38, 0.22], 0, [0.05, 0.07, 0.07]).add(M.sph(10), 0xfff6c0, [L * 0.46, 0.38, -0.22], 0, [0.05, 0.07, 0.07]);
        p.add(M.cyl(0.03, 0.03, 6), 0xd8b040, [-L * 0.08, 0.86, 0], 0, [1, 0.2, 1]).add(M.box(), 0xe8c050, [-L * 0.08, 0.98, 0], 0, [0.04, 0.12, 0.3]); // 태엽
        for (const x of [-L * 0.3, L * 0.3]) for (const z of [-0.36, 0.36]) wheel(x, z, 0.17);
        break; }
      case 'truck': {
        p.add(M.rbox(L * 0.34, 0.62, 0.84, 0.12, 2), col, [L * 0.3, 0.5, 0]).add(M.rbox(L * 0.2, 0.26, 0.86, 0.06, 2), 0xbfe8ff, [L * 0.33, 0.66, 0]).add(M.rbox(L * 0.6, 0.5, 0.9, 0.08, 2), 0xffd36a, [-L * 0.17, 0.48, 0]);
        for (const x of [-L * 0.35, -L * 0.05, L * 0.33]) for (const z of [-0.4, 0.4]) wheel(x, z, 0.19);
        break; }
      case 'robot': { // 로봇청소기
        p.add(M.cyl(0.46, 0.47, 32), 0xf4f6f8, [0, 0.13, 0], 0, [1, 0.2, 1]).add(M.cyl(0.33, 0.33, 28), 0x34383e, [0, 0.235, 0], 0, [1, 0.02, 1]).add(M.cyl(0.11, 0.11, 18), 0xd8dce2, [0.05, 0.25, 0], 0, [1, 0.03, 1]);
        p.add(M.tor(0.47, 0.035), 0x5a6068, [0, 0.1, 0], [Math.PI / 2, 0, 0]).add(M.sph(8), 0x3aff9a, [0.3, 0.25, 0], 0, [0.035, 0.02, 0.035]).add(M.box(), 0x2a2e34, [0.25, 0.1, 0], [0, 0, 0], [0.12, 0.14, 0.7]);
        break; }
      case 'mower': { // 로봇 잔디깎이
        p.add(M.rbox(L * 0.9, 0.36, 0.8, 0.16, 2), 0x3a8a4a, [0, 0.33, 0]).add(M.rbox(L * 0.5, 0.16, 0.6, 0.08, 2), 0x2a2a2e, [0, 0.56, 0]).add(M.box(), 0xffcc2a, [L * 0.44, 0.32, 0], 0, [0.04, 0.1, 0.66]);
        for (const x of [-L * 0.3, L * 0.3]) for (const z of [-0.4, 0.4]) wheel(x, z, 0.2, 0x2a2a2e);
        break; }
      case 'bigball': {
        const r = M.BALL_R; p.add(M.sph(20), col, [0, 0, 0], 0, [r, r, r]).add(M.sph(20), 0xffffff, [0, 0, 0], [0, 0, 0], [r * 1.01, r * 0.3, r * 1.01]).add(M.sph(20), 0xffffff, [0, 0, 0], [Math.PI / 2, 0, 0], [r * 1.01, r * 0.3, r * 1.01]); // 가운데가 원점: 제자리에서 구르게(놓을 때 r 만큼 띄움)
        break; }
      case 'car': { // 진짜 자동차(햄스터한테는 집채만 함)
        p.add(M.rbox(L * 0.98, 0.5, 1.7, 0.22, 2), col, [0, 0.56, 0]).add(M.rbox(L * 0.54, 0.44, 1.5, 0.2, 2), col, [-L * 0.06, 0.96, 0]).add(M.rbox(L * 0.48, 0.32, 1.52, 0.14, 2), 0x9ad2ee, [-L * 0.06, 0.98, 0]);
        p.add(M.sph(10), 0xfff6c0, [L * 0.48, 0.6, 0.55], 0, [0.06, 0.1, 0.16]).add(M.sph(10), 0xfff6c0, [L * 0.48, 0.6, -0.55], 0, [0.06, 0.1, 0.16]).add(M.box(), 0x3a3a40, [L * 0.49, 0.42, 0], 0, [0.1, 0.16, 1.6]);
        for (const x of [-L * 0.31, L * 0.31]) for (const z of [-0.78, 0.78]) wheel(x, z, 0.3);
        break; }
      case 'van': {
        p.add(M.rbox(L * 0.98, 0.95, 1.8, 0.28, 2), 0xf4f4f0, [0, 0.82, 0]).add(M.rbox(L * 0.22, 0.42, 1.82, 0.16, 2), 0x9ad2ee, [L * 0.38, 1.02, 0]).add(M.box(), col, [-L * 0.1, 0.72, 0], 0, [L * 0.6, 0.26, 1.82]);
        for (const x of [-L * 0.33, L * 0.33]) for (const z of [-0.8, 0.8]) wheel(x, z, 0.3);
        break; }
      case 'dog': { // 산책하는 강아지
        const c = col, y = 0.62;
        p.add(M.sph(16), c, [0, y, 0], 0, [L * 0.36, 0.3, 0.32]).add(M.sph(16), c, [L * 0.36, y + 0.3, 0], 0, [0.3, 0.28, 0.27]).add(M.sph(12), 0xf6e6d0, [L * 0.52, y + 0.22, 0], 0, [0.16, 0.12, 0.14]).add(M.sph(8), 0x1a1416, [L * 0.62, y + 0.25, 0], 0, [0.05, 0.04, 0.05]);
        p.add(M.sph(8), 0x1a1416, [L * 0.47, y + 0.38, 0.12], 0, [0.035, 0.045, 0.035]).add(M.sph(8), 0x1a1416, [L * 0.47, y + 0.38, -0.12], 0, [0.035, 0.045, 0.035]);
        p.add(M.sph(10), 0x6a4630, [L * 0.32, y + 0.38, 0.25], [0.5, 0, 0], [0.08, 0.18, 0.05]).add(M.sph(10), 0x6a4630, [L * 0.32, y + 0.38, -0.25], [-0.5, 0, 0], [0.08, 0.18, 0.05]);
        for (const x of [-L * 0.22, L * 0.2]) for (const z of [-0.15, 0.15]) p.add(M.cyl(0.07, 0.06, 8), c, [x, 0.25, z], 0, [1, 0.5, 1]).add(M.sph(8), 0xf6e6d0, [x + 0.02, 0.04, z], 0, [0.08, 0.05, 0.09]);
        p.add(M.sph(8), c, [-L * 0.4, y + 0.22, 0], [0, 0, 0.8], [0.06, 0.2, 0.06]);
        p.add(M.tor(0.13, 0.03), 0xe8443a, [L * 0.25, y + 0.18, 0], [0, Math.PI / 2, 0.4], [1, 1.1, 1]);
        break; }
      case 'woodtrain': { // 나무 장난감 기차
        const car = 1.7, n = Math.round(L / car);
        for (let i = 0; i < n; i++) {
          const x = L / 2 - car / 2 - i * car;
          if (i === 0) { p.add(M.rbox(1.5, 0.5, 0.86, 0.1, 2), 0xd83a3a, [x, 0.45, 0]).add(M.cyl(0.3, 0.3, 16), 0x2a6ad8, [x + 0.25, 0.85, 0], [0, 0, Math.PI / 2], [1, 1.0, 1]).add(M.rbox(0.6, 0.66, 0.86, 0.1, 2), 0xffd23a, [x - 0.42, 0.98, 0]).add(M.cyl(0.1, 0.13, 10), 0x2a2a2e, [x + 0.55, 1.2, 0], 0, [1, 0.4, 1]); }
          else { p.add(M.rbox(1.5, 0.5, 0.86, 0.1, 2), [0x3aa858, 0xffd23a, 0x2a6ad8][i % 3], [x, 0.45, 0]).add(M.rbox(0.5, 0.4, 0.5, 0.08, 2), PAST[i % 6], [x, 0.9, 0]); }
          for (const wx of [x - 0.45, x + 0.45]) for (const z of [-0.42, 0.42]) wheel(wx, z, 0.2, 0xe8c48e);
        }
        break; }
      case 'subway': { // 전철
        const car = 4.4, n = Math.round(L / car);
        for (let i = 0; i < n; i++) {
          const x = L / 2 - car / 2 - i * car;
          p.add(M.rbox(car - 0.2, 2.2, 1.9, 0.3, 2), 0xe6e8ec, [x, 1.5, 0]).add(M.box(), 0x3a8ad8, [x, 1.0, 0], 0, [car - 0.25, 0.22, 1.92]).add(M.box(), 0x2a3440, [x, 1.85, 0], 0, [car - 0.6, 0.6, 1.93]);
        }
        p.add(M.box(), 0xfff2a0, [L / 2 - 0.05, 1.0, 0.6], 0, [0.1, 0.16, 0.2]).add(M.box(), 0xfff2a0, [L / 2 - 0.05, 1.0, -0.6], 0, [0.1, 0.16, 0.2]);
        break; }
      // 물 위
      case 'biscuit': {
        p.add(M.rbox(L * 0.96, 0.16, 0.86, 0.05, 2), 0xe6b46a, [0, 0.02, 0]).add(M.rbox(L * 0.9, 0.04, 0.8, 0.02, 1), 0xf0c47a, [0, 0.1, 0]);
        for (let x = -L / 2 + 0.3; x < L / 2 - 0.1; x += 0.4) for (const z of [-0.2, 0.2]) p.add(M.cyl(0.035, 0.035, 6), 0xb07a3a, [x, 0.12, z], 0, [1, 0.02, 1]);
        break; }
      case 'leaf': {
        p.add(M.sph(16), 0x5aa848, [0, 0.02, 0], 0, [L * 0.5, 0.06, 0.46]).add(M.box(), 0x3a7a30, [0, 0.07, 0], 0, [L * 0.9, 0.02, 0.04]);
        for (const s of [-1, 1]) for (let k = -2; k <= 2; k++) p.add(M.box(), 0x3f8a36, [k * L * 0.14 + 0.08, 0.07, s * 0.13], [0, s * 0.6, 0], [0.04, 0.015, 0.3]);
        break; }
      case 'lily': {
        const n = Math.max(1, Math.round(L / 1.1));
        for (let i = 0; i < n; i++) { const x = -L / 2 + 0.55 + i * 1.1; p.add(M.cyl(0.5, 0.5, 20), 0x4aa05a, [x, 0.02, 0], 0, [1, 0.06, 1]).add(M.cone(3), 0x2e6a8a, [x + 0.3, 0.03, 0.12], [0, 0.5, 0], [0.25, 0.08, 0.1]); if (i % 3 === 0) p.add(M.sph(8), 0xff9ac0, [x - 0.15, 0.12, -0.15], 0, [0.12, 0.08, 0.12]); }
        break; }
      case 'duck': {
        p.add(M.sph(16), 0xffd23a, [0, 0.25, 0], 0, [L * 0.42, 0.3, 0.45]).add(M.sph(14), 0xffd23a, [L * 0.32, 0.65, 0], 0, [0.26, 0.26, 0.26]).add(M.sph(10), 0xff8a1a, [L * 0.5, 0.6, 0], 0, [0.14, 0.06, 0.12]).add(M.sph(6), 0x1a1416, [L * 0.4, 0.72, 0.17], 0, [0.04, 0.05, 0.04]).add(M.sph(6), 0x1a1416, [L * 0.4, 0.72, -0.17], 0, [0.04, 0.05, 0.04]).add(M.cone(8), 0xffd23a, [-L * 0.44, 0.42, 0], [0, 0, 0.9], [0.12, 0.25, 0.12]);
        break; }
    }
    return p;
  };
  M.RIDE_Y = { biscuit: 0.12, leaf: 0.08, lily: 0.06, duck: 0.52 };

  // 고양이 앞발(뒤에서 내려와 덮친다)
  // 고양이 앞발(사장님 사진: 회색 고등어 태비 팔 + 하얀 양말 발). 단순하게: 둥근 흰 발 하나에 발가락 셋만 살짝, 발톱 없음.
  // 발바닥 -y, 발가락 -z, 팔은 +z 로 길게 뻗어 화면 밖으로 나간다(끝이 보이면 잘린 팔처럼 무섭다)
  M.paw = function () {
    const p = new M.Parts(), sock = 0xf6f4f0, fur = 0x9a948c, dk = 0x55504a, pink = 0xf2a8b4;
    p.add(M.sph(24), sock, [0, 0, 0], 0, [0.82, 0.48, 0.9]);                           // 둥근 흰 발
    for (const x of [-0.42, 0, 0.42]) p.add(M.sph(16), sock, [x, 0.04, -0.66], 0, [0.3, 0.34, 0.3]); // 발가락 셋
    p.add(M.sph(16), pink, [0, -0.42, 0.05], 0, [0.36, 0.08, 0.3]);                  // 발바닥 젤리(밑이라 덮칠 때만 살짝)
    p.add(M.cyl(0.6, 0.6, 20), sock, [0, 0.1, 0.55], [Math.PI / 2, 0, 0], [1, 0.7, 1]); // 하얀 양말 목
    const AL = 7;
    p.add(M.cyl(0.6, 0.6, 20), fur, [0, 0.1, 0.9 + AL / 2], [Math.PI / 2, 0, 0], [1, AL, 1]); // 회색 팔
    for (let z = 1.3; z < AL; z += 0.55) p.add(M.cyl(0.6, 0.6, 20), dk, [0, 0.1, z], [Math.PI / 2, 0, 0], [1.012, 0.14, 1.012]); // 고등어 줄무늬
    return p;
  };
})();
