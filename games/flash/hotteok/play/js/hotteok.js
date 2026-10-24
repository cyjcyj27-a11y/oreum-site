// 호떡 한 개: 극좌표 격자를 모양 값(펼친 반죽 → 공 → 납작)으로 다시 빚고, 꼭짓점 색으로 양면 익힘을 칠한다
(function () {
  const V3 = THREE.Vector3, PI = Math.PI;
  const N = 12, A = 48; // 반지름 마디, 둘레 마디
  const H = (window.HOT = {});

  // 공용 도형: 윗면·아랫면 격자 인덱스
  function makeGeo() {
    const g = new THREE.BufferGeometry();
    const per = (N + 1) * A, cnt = per * 2;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(cnt * 3), 3));
    const idx = [];
    for (let s = 0; s < 2; s++) {
      const o = s * per;
      for (let i = 0; i < N; i++) for (let j = 0; j < A; j++) {
        const a = o + i * A + j, b = o + (i + 1) * A + j, c = o + (i + 1) * A + ((j + 1) % A), d = o + i * A + ((j + 1) % A);
        if (s === 0) idx.push(a, d, c, a, c, b); else idx.push(a, b, c, a, c, d);
      }
      // 옆 띠: 윗면 테와 아랫면 테를 잇기
    }
    for (let j = 0; j < A; j++) { const t0 = N * A + j, t1 = N * A + ((j + 1) % A), b0 = per + N * A + j, b1 = per + N * A + ((j + 1) % A); idx.push(t0, t1, b1, t0, b1, b0); }
    g.setIndex(idx);
    return g;
  }

  // 익힘 → 색(날반죽 → 노릇 → 갈색 → 탐)
  // 반죽마다 날 → 노릇 → 갈색 → 탐 색
  const PAL = {
    plain: { raw: [0.93, 0.86, 0.71], gold: [0.86, 0.58, 0.24], brown: [0.52, 0.27, 0.09] },
    green: { raw: [0.74, 0.82, 0.55], gold: [0.62, 0.62, 0.26], brown: [0.4, 0.33, 0.1] },
    black: { raw: [0.46, 0.33, 0.4], gold: [0.4, 0.24, 0.26], brown: [0.26, 0.13, 0.12] },
  };
  const BURNT = [0.13, 0.07, 0.035];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function cookCol(c, dough) {
    const pl = PAL[dough] || PAL.plain, RAW = pl.raw, GOLD = pl.gold, BROWN = pl.brown;
    if (c < 0.15) return RAW;
    if (c < 0.8) { const t = (c - 0.15) / 0.65; return mix(RAW, GOLD, t * (2 - t)); }
    if (c < 1.32) return mix(GOLD, BROWN, (c - 0.8) / 0.52);
    return mix(BROWN, BURNT, Math.min(1, (c - 1.32) / 0.4));
  }
  H.cookCol = cookCol;

  // 씨앗 한 알 도형(납작한 타원체)과 재질
  const seedGeo = new THREE.SphereGeometry(1, 8, 6);
  const seedMat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0, color: 0xffffff });
  const SEEDCOL = [[0.84, 0.79, 0.64], [0.38, 0.5, 0.22], [0.79, 0.58, 0.35], [0.62, 0.55, 0.42]];
  const SEEDSZ = [[0.011, 0.0034, 0.0052], [0.012, 0.003, 0.0068], [0.0085, 0.005, 0.0068], [0.0075, 0.0032, 0.0038]];

  let uid = 0;
  H.make = function (fill, dough) {
    const geo = makeGeo();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0, envMapIntensity: 0.55 });
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
    const grp = new THREE.Group(); const spin = new THREE.Group(); spin.add(mesh); grp.add(spin);
    const ph = [Math.random() * 6, Math.random() * 6, Math.random() * 6, Math.random() * 6];
    // 꼭짓점마다 고정된 얼룩 값(노릇한 무늬가 고르지 않게)
    const per = (N + 1) * A, nz = new Float32Array(per * 2);
    for (let s = 0; s < 2; s++) for (let i = 0; i <= N; i++) for (let j = 0; j < A; j++) {
      const t = i / N, a = (j / A) * PI * 2, x = Math.cos(a) * t, y = Math.sin(a) * t;
      nz[s * per + i * A + j] = Math.sin(x * 9 + ph[0] + s) * Math.cos(y * 8 + ph[1]) * 0.5 + Math.sin(x * 23 + y * 17 + ph[2]) * 0.3 + Math.sin(x * 41 - y * 37 + ph[3]) * 0.2;
    }
    const h = {
      id: ++uid, grp, spin, mesh, geo, mat, ph, nz,
      fill: fill || null, dough: dough || 'plain', spoons: 0, close: 0, stage: 'board',
      flat: 0, cookA: 0, cookB: 0, down: 0, // down: 0 = A 면이 아래
      pressed: 0, burst: 0, cut: 0, scoops: 0, seeds: [], oilT: 0,
      x: 0, z: 0, lift: 0, dirty: true,
    };
    // 펼친 반죽 위 소(설탕·치즈 더미)
    const pileM = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 8, 0, PI * 2, 0, PI / 2), RND.fillMat[fill || 'sugar']);
    pileM.scale.set(0.0001, 0.0001, 0.0001); pileM.castShadow = true; spin.add(pileM); h.pile = pileM;
    // 가른 자리(짙은 꿀 틈)
    const slitM = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: 0x3a1806, roughness: 0.15, metalness: 0.1, envMapIntensity: 1.5 }));
    slitM.rotation.x = -PI / 2; slitM.visible = false; spin.add(slitM); h.slit = slitM;
    // 씨앗
    const im = new THREE.InstancedMesh(seedGeo, seedMat, 140); im.count = 0; im.castShadow = true; im.frustumCulled = false; spin.add(im); h.inst = im;
    // 터진 설탕 웅덩이(철판 위, 바깥 world 에 붙임)
    h.puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: h.fill ? DATA.FILL[h.fill].puddle : 0x2a1206, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.95 }));
    h.puddle.rotation.x = -PI / 2; h.puddle.visible = false; h.puddle.scale.setScalar(0.01); RND.world.add(h.puddle);
    RND.world.add(grp);
    H.shape(h);
    return h;
  };

  // 모양 값 → 반지름 R, 높이 Ht, 테 높이 rim, 둥글기 q
  function params(h) {
    if (h.stage === 'board' || (h.stage === 'held' && h.from === 'board')) {
      const c = h.close, e = c * c * (3 - 2 * c);
      return { R: 0.078 + (0.052 - 0.078) * e, Ht: 0.016 + (0.072 - 0.016) * e, rim: 0.007 + (0.03 - 0.007) * e, q: 3 - e, cup: Math.sin(c * PI) * 0.018, knot: e };
    }
    const f = Math.min(1.25, h.flat + h.sag);
    const k = Math.min(1, f);
    if (!h.fill && h.puff > 0) { // 공갈호떡: 속이 비어 둥글게 부풀어 오름(누르면 꺼짐)
      const u = h.puff * Math.max(0, 1 - h.flat * 2.5);
      const R0 = 0.052 + 0.04 * k, H0 = Math.max(0.011, 0.072 - 0.055 * k);
      return { R: R0 + 0.035 * u, Ht: H0 + 0.05 * u, rim: H0 * 0.42 * (1 - u * 0.5), q: 2 - 0.2 * u, cup: 0, knot: Math.max(0, 1 - k * 2.5) * (1 - u) };
    }
    const R = 0.052 + 0.04 * k + Math.max(0, f - 1) * 0.06;
    const Ht = Math.max(0.011, 0.072 - 0.055 * k - Math.max(0, f - 1) * 0.02);
    return { R, Ht, rim: Ht * (0.42 + 0.08 * k), q: 2 + 3.5 * k, cup: 0, knot: Math.max(0, 1 - k * 2.5) };
  }
  H.params = params;

  H.shape = function (h) {
    if (h.sag === undefined) h.sag = 0;
    const p = params(h);
    const pos = h.geo.attributes.position.array, col = h.geo.attributes.color.array;
    const per = (N + 1) * A;
    // 위로 보이는 면/아래 면의 익힘
    const up = h.down ? h.cookA : h.cookB, dn = h.down ? h.cookB : h.cookA;
    const oily = h.stage === 'griddle' || h.stage === 'tray' || h.stage === 'held' && h.from !== 'board';
    for (let s = 0; s < 2; s++) for (let i = 0; i <= N; i++) {
      const t = i / N;
      const prof = Math.pow(Math.max(0, 1 - Math.pow(t, p.q)), 1 / p.q);
      for (let j = 0; j < A; j++) {
        const a = (j / A) * PI * 2;
        const wob = 1 + 0.03 * Math.sin(a * 3 + h.ph[0]) + 0.02 * Math.sin(a * 5 + h.ph[1]) + 0.012 * Math.sin(a * 9 + h.ph[2]);
        const r = p.R * t * wob;
        let y;
        if (s === 0) {
          y = p.rim + (p.Ht - p.rim) * prof;
          // 오므릴 때 가장자리가 위로 말려 올라옴 + 꼭지 주름
          y += p.cup * t * t;
          if (p.knot > 0) y += p.knot * (0.007 * Math.exp(-t * t / 0.02) + 0.0025 * Math.sin(a * 7 + h.ph[3]) * Math.max(0, 0.45 - t));
        } else y = p.rim * (1 - prof) * 0.55;
        const k = (s * per + i * A + j) * 3;
        pos[k] = Math.cos(a) * r; pos[k + 1] = y; pos[k + 2] = Math.sin(a) * r;
        // 색
        const n = h.nz[s * per + i * A + j];
        let cv = s === 0 ? up : dn;
        if (s === 0) cv = cv * (1 - 0.18 * t) + Math.max(0, t - 0.82) * 2 * dn * 0.6; // 윗면 가장자리는 아랫면 익힘이 비침
        else cv = cv * (0.92 + 0.12 * t);
        cv += n * 0.16 * Math.min(1, cv * 2);
        let c3 = cookCol(Math.max(0, cv), h.dough);
        if (h.stage === 'board' || h.from === 'board') { const fl = 0.04 * n; c3 = [c3[0] + fl, c3[1] + fl, c3[2] + fl]; }
        col[k] = c3[0] * c3[0]; col[k + 1] = c3[1] * c3[1]; col[k + 2] = c3[2] * c3[2]; // 화면색 → 선형
      }
    }
    h.geo.attributes.position.needsUpdate = true; h.geo.attributes.color.needsUpdate = true;
    h.geo.computeVertexNormals(); h.geo.computeBoundingSphere();
    h.mat.roughness = oily ? 0.42 : 0.55;
    h.top = p.Ht; h.R = p.R;
    // 소 더미: 오므릴수록 안으로 사라짐
    if (h.stage === 'board' || h.from === 'board') {
      const amt = h.fill === 'cheese' ? Math.min(1.4, h.spoons) : Math.min(3, h.spoons) / 2;
      if (h.fill && h.pile.material !== RND.fillMat[h.fill]) h.pile.material = RND.fillMat[h.fill];
      const vis = amt * Math.max(0, 1 - h.close * 1.6);
      const r = 0.03 * Math.sqrt(vis), hh = 0.008 * vis;
      h.pile.scale.set(Math.max(1e-4, r), Math.max(1e-4, hh), Math.max(1e-4, r)); h.pile.position.y = p.Ht * 0.9;
    } else h.pile.scale.set(1e-4, 1e-4, 1e-4);
    // 가른 틈
    if (h.cut > 0) { h.slit.visible = true; h.slit.position.y = p.Ht + 0.0012; h.slit.scale.set(p.R * 0.74 * Math.min(1, h.cut), 0.01 + 0.01 * Math.min(2, h.scoops), 1); }
    else h.slit.visible = false;
    h.dirty = false;
  };

  // 씨앗 한 국자: 위에서 쏟아져 튕기며 틈 위에 수북이
  H.addScoop = function (h) {
    h.scoops++;
    const base = h.seeds.length, n = 60;
    for (let i = 0; i < n; i++) {
      const tp = Math.floor(Math.random() * 4);
      const u = (Math.random() - 0.5) * 1.6, v = (Math.random() - 0.5);
      const tx = u * (h.R || 0.09) * 0.52, tz = v * (0.03 + h.scoops * 0.01);
      h.seeds.push({ tp, x: tx + (Math.random() - 0.5) * 0.02, y: 0.12 + Math.random() * 0.05, z: tz, vy: 0, tx, tz, ty: 0, rot: [Math.random() * 6, Math.random() * 6, Math.random() * 6], delay: i * 0.012, bounce: 0, done: false, mound: 1 - Math.min(1, Math.hypot(u / 0.8, v / 0.5)) });
    }
    H.layoutSeeds(h, base);
  };
  H.layoutSeeds = function (h) {
    // 목표 높이: 가운데가 높은 언덕
    h.seeds.forEach((s, i) => { s.ty = (h.top || 0.02) + 0.003 + Math.max(0, s.mound) * (0.012 + 0.01 * h.scoops) + (i % 4) * 0.0018; });
  };
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new V3(), _p = new V3(), _c = new THREE.Color();
  H.updSeeds = function (h, dt) {
    if (!h.seeds.length) return false;
    let moving = false;
    h.seeds.forEach((s, i) => {
      if (s.delay > 0) { s.delay -= dt; moving = true; }
      else if (!s.done) {
        s.vy -= 3.2 * dt; s.y += s.vy * dt; s.x += (s.tx - s.x) * Math.min(1, dt * 6); s.z += (s.tz - s.z) * Math.min(1, dt * 6);
        if (s.y < s.ty) { s.y = s.ty; if (s.bounce < 2 && Math.abs(s.vy) > 0.15) { s.vy = -s.vy * 0.3; s.bounce++; } else { s.vy = 0; s.done = true; } }
        moving = true;
      }
      const sz = SEEDSZ[s.tp];
      _e.set(s.rot[0] * 0.25, s.rot[1], s.rot[2] * 0.25); _q.setFromEuler(_e); _s.set(sz[0], sz[1], sz[2]); _p.set(s.x, s.delay > 0 ? -1 : s.y, s.z);
      _m.compose(_p, _q, s.delay > 0 ? _s.set(1e-5, 1e-5, 1e-5) : _s); h.inst.setMatrixAt(i, _m);
      const c = SEEDCOL[s.tp]; _c.setRGB(c[0], c[1], c[2]); h.inst.setColorAt(i, _c);
    });
    h.inst.count = h.seeds.length; h.inst.instanceMatrix.needsUpdate = true; if (h.inst.instanceColor) h.inst.instanceColor.needsUpdate = true;
    return moving;
  };

  H.dispose = function (h) {
    RND.world.remove(h.grp); RND.world.remove(h.puddle);
    h.geo.dispose(); h.mat.dispose(); h.pile.geometry.dispose(); h.slit.geometry.dispose(); h.slit.material.dispose(); h.puddle.geometry.dispose(); h.puddle.material.dispose(); h.inst.dispose();
  };
})();
