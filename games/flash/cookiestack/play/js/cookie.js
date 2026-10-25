// 점토 쿠키: 구운 반죽 판(버터·코코아 번갈아) 위에 형광 아이싱을 바른 한 층.
// 반죽 색은 꼭짓점 색으로 구워 넣어(가장자리·아래는 더 노릇) 재질 두 개를 모든 쿠키가 나눠 쓴다.
(function () {
  const K = (window.COOKIE = {});
  const BODY_H = 0.36, ICE_H = 0.15;
  const SPR = ['#ff3fa4', '#ffe62e', '#7dff3a', '#18e8ff', '#c45bff', '#ffffff'];
  K.DOUGH = [new THREE.Color('#f2bd6e'), new THREE.Color('#7a4426')];
  const dark = [new THREE.Color('#b8722e'), new THREE.Color('#4a2614')];
  let bodyMat = null;
  function bodyMatGet() {
    if (!bodyMat) bodyMat = CLAY.mat('#ffffff', { rough: 0.72, ns: 0.75, vc: 1 });
    return bodyMat;
  }
  // 반죽 판: 위 가장자리와 아래쪽을 짙게, 표면에 작은 얼룩
  function bodyGeo(w, d, dough, seed) {
    const g = CLAY.rbox(w, BODY_H, d, 0.13, Math.min(w, d, 1.2) * 0.025, seed);
    g.translate(0, -0.25 + BODY_H / 2, 0);
    const p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), c = new THREE.Color();
    const A = K.DOUGH[dough], B = dark[dough];
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const yb = (y + 0.25) / BODY_H; // 0 아래 ~ 1 위
      const edge = Math.max(Math.abs(x) / (w / 2), Math.abs(z) / (d / 2));
      let t = (1 - yb) * 0.55 + Math.max(0, edge - 0.82) * 2.2 * (yb > 0.6 ? 1 : 0.4);
      t += (CLAY.noise(x * 3.1 + seed, y * 3.1, z * 3.1) * 0.5 + 0.5) * 0.22;
      c.copy(A).lerp(B, Math.min(1, t));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  // 아이싱: 가장자리를 조금 남기고 바른 말랑한 판
  function iceGeo(w, d, seed) {
    const iw = Math.max(0.12, w - 0.34), id = Math.max(0.12, d - 0.34);
    const g = CLAY.rbox(iw, ICE_H, id, Math.min(0.07, iw / 2.2, id / 2.2), Math.min(iw, id, 1) * 0.03, seed + 7);
    g.translate(0, -0.25 + BODY_H + ICE_H / 2 - 0.05, 0);
    return g;
  }
  // 아이싱 위 스프링클(넓이만큼, 아이싱 가장자리 안쪽)
  let sprCap = null;
  function sprGeo(w, d, seed) {
    if (!sprCap) sprCap = new THREE.CapsuleGeometry(0.03, 0.13, 2, 5);
    const iw = Math.max(0.12, w - 0.5), id = Math.max(0.12, d - 0.5), n = Math.max(1, Math.round(iw * id * 2.2));
    const items = [], q = new THREE.Quaternion(), e = new THREE.Euler(); let sd = seed * 9301 + 49297;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      e.set(Math.PI / 2, 0, r() * Math.PI * 2); q.setFromEuler(e);
      items.push([sprCap, new THREE.Matrix4().compose(new THREE.Vector3((r() - 0.5) * iw, -0.25 + BODY_H + ICE_H - 0.03, (r() - 0.5) * id), q, new THREE.Vector3(1, 1, 1)), new THREE.Color(SPR[(i + (seed | 0)) % SPR.length])]);
    }
    return K.mergeColored(items);
  }
  // 쿠키 한 층(몸통 Mesh 에 아이싱·스프링클을 자식으로)
  const cache = {};
  K.make = function (w, d, iceMat, dough, seed, shared) {
    let bg, ig;
    let sg;
    if (shared) { const key = dough; cache[key] = cache[key] || [bodyGeo(w, d, dough, 3 + dough), iceGeo(w, d, 9), sprGeo(w, d, 5 + dough)]; bg = cache[key][0]; ig = cache[key][1]; sg = cache[key][2]; }
    else { bg = bodyGeo(w, d, dough, seed); ig = iceGeo(w, d, seed); sg = sprGeo(w, d, seed); }
    const m = new THREE.Mesh(bg, bodyMatGet());
    const ice = new THREE.Mesh(ig, iceMat);
    m.add(ice);
    m.add(new THREE.Mesh(sg, K.sprinkleMat()));
    m.castShadow = m.receiveShadow = ice.castShadow = ice.receiveShadow = true;
    if (shared) m.userData.sharedGeo = true;
    return m;
  };
  // 꼭짓점 색으로 칠한 조각들을 한 덩어리로(스프링클)
  K.mergeColored = function (items) {
    let n = 0; const gs = items.map((it) => { const g = (it[0].index ? it[0].toNonIndexed() : it[0].clone()); g.applyMatrix4(it[1]); n += g.attributes.position.count; return [g, it[2]]; });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
    let o = 0;
    gs.forEach(([g, c]) => { const cnt = g.attributes.position.count; P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); for (let i = 0; i < cnt; i++) { C[(o + i) * 3] = c.r; C[(o + i) * 3 + 1] = c.g; C[(o + i) * 3 + 2] = c.b; } o += cnt; g.dispose(); });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(C, 3));
    return out;
  };
  let sprMat = null;
  K.sprinkleMat = () => sprMat || (sprMat = CLAY.mat('#ffffff', { rough: 0.35, ns: 0.2, vc: 1, emis: '#2a2a2a', ei: 1 }));
  // 판 사이 받침: 생크림 판 + 형광 스프링클
  K.cream = function (W, H, seed) {
    const m = new THREE.Mesh(CLAY.rbox(W, H, W, 0.18, 0.04, seed), CLAY.mat('#fffaf2', { rough: 0.32, ns: 0.45, emis: '#ffffff', ei: 0.06 }));
    const items = [], cap = new THREE.CapsuleGeometry(0.035, 0.16, 2, 5), q = new THREE.Quaternion(), e = new THREE.Euler();
    CLAY.srand(seed * 7 + 1);
    for (let i = 0; i < 46; i++) {
      e.set(Math.PI / 2, 0, CLAY.rnd() * Math.PI * 2); q.setFromEuler(e);
      const mt = new THREE.Matrix4().compose(new THREE.Vector3((CLAY.rnd() - 0.5) * (W - 0.4), H / 2 + 0.01, (CLAY.rnd() - 0.5) * (W - 0.4)), q, new THREE.Vector3(1, 1, 1));
      items.push([cap, mt, new THREE.Color(SPR[i % SPR.length])]);
    }
    const s = new THREE.Mesh(K.mergeColored(items), K.sprinkleMat());
    m.add(s);
    m.castShadow = m.receiveShadow = true; s.castShadow = true;
    return m;
  };
})();
