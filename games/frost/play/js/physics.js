// physics.js — 건드리면 굴러가는 물건들 (사장님 2026-09-17 "게임의 기본은 드넓은 3d배경이 아니라 물리효과")
//   · 공·호박·양동이·솔방울·돌: 걸어 들어가면 밀리고, 달려 들어가면 차인다. 비탈에선 저절로 굴러 내려간다
//   · E 로 공을 뻥 찬다 / 돌은 E 로 집어 들고 다시 E 로 던진다(솔방울은 차기만)
//   · 물에 떨어지면 첨벙 + 물결, 가벼운 것은 뜨고 돌은 가라앉는다. 돌을 낮게 던지면 물수제비
//   · 걷거나 헤엄치면 발밑에 물결, 풀·고사리·갈대는 몸에 밀려 눕는다(flora.js 에 주인공 자리를 넘겨준다)
//   그리기는 종류마다 InstancedMesh 하나 — 물건이 늘어도 그리기 명령은 종류 수만큼
(function () {
  const V3 = THREE.Vector3;
  const G = 9.8;
  // r 반지름 · m 무게 · e 튕김 · roll 구름 저항 · kick 차이는 정도 · float 뜨나 · grab 집어 드나
  const KINDS = {
    ball:    { r: 0.11, m: 0.45, e: 0.62, roll: 0.35, kick: 1.7, float: true, grab: true, snd: 'bounce' },
    pumpkin: { r: 0.2, m: 5, e: 0.2, roll: 1.1, kick: 0.55, float: true, snd: 'kick' },
    bucket:  { r: 0.15, m: 1.2, e: 0.3, roll: 2.2, kick: 1.0, float: true, snd: 'tin' },
    cone:    { r: 0.05, m: 0.1, e: 0.35, roll: 2.5, kick: 1.0, float: true, snd: 'tock' },   // 집기 뺌 — 던져도 쓸모가 없어서 차는 것만 (사장님 2026-09-18)
    stone:   { r: 0.065, m: 0.4, e: 0.25, roll: 3.5, kick: 0.8, float: false, grab: true, snd: 'tock' },
  };
  const bodies = [];
  const meshes = {};
  let scene = null, rnd = null;

  // ── 모양 ──
  function ballGeo() {
    const g = new THREE.IcosahedronGeometry(0.11, 2);
    const p = g.attributes.position, c = [];
    for (let i = 0; i < p.count; i++) {   // 가죽 조각 공: 조각마다 흰색/갈색
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = (Math.abs(x) > Math.abs(y) && Math.abs(x) > Math.abs(z)) ? 0 : (Math.abs(y) > Math.abs(z) ? 1 : 2);
      const col = k === 1 ? [0.55, 0.3, 0.14] : [0.92, 0.86, 0.74];
      c.push(...col);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    return g;
  }
  function pumpkinGeo() {
    const g = new THREE.SphereGeometry(0.2, 16, 10);
    const p = g.attributes.position, c = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const a = Math.atan2(z, x), rib = 1 - 0.09 * Math.pow(Math.abs(Math.sin(a * 4)), 0.6);
      p.setXYZ(i, x * rib * 1.15, y * 0.8, z * rib * 1.15);
      const t = 0.85 + 0.15 * Math.abs(Math.cos(a * 4));
      c.push(0.95 * t, 0.5 * t, 0.12 * t);
    }
    g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    const st = new THREE.CylinderGeometry(0.018, 0.028, 0.08, 5).translate(0, 0.19, 0);
    const sc = []; for (let i = 0; i < st.attributes.position.count; i++) sc.push(0.33, 0.4, 0.18);
    st.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
    return GEO.merge([g, st]);
  }
  function bucketGeo() {
    const body = new THREE.CylinderGeometry(0.15, 0.12, 0.26, 12, 1, true);
    const bot = new THREE.CircleGeometry(0.12, 12).rotateX(Math.PI / 2).translate(0, -0.13, 0);
    const b1 = new THREE.CylinderGeometry(0.153, 0.15, 0.025, 12).translate(0, 0.07, 0);
    const b2 = new THREE.CylinderGeometry(0.131, 0.128, 0.025, 12).translate(0, -0.08, 0);
    const col = (g, r, gg, b) => { const c = []; for (let i = 0; i < g.attributes.position.count; i++) c.push(r, gg, b); g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g; };
    return GEO.merge([col(body, 0.54, 0.42, 0.28), col(bot, 0.42, 0.32, 0.2), col(b1, 0.3, 0.3, 0.3), col(b2, 0.3, 0.3, 0.3)]);
  }
  function coneGeo() {
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const y = -0.04 + i * 0.02, r = 0.028 * Math.sin((i + 1) / 6 * Math.PI) + 0.012;
      const g = new THREE.ConeGeometry(r + 0.008, 0.03, 7).translate(0, y, 0);
      const c = []; const t = 0.8 + (i % 2) * 0.2;
      for (let j = 0; j < g.attributes.position.count; j++) c.push(0.45 * t, 0.3 * t, 0.17 * t);
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      parts.push(g);
    }
    const g = GEO.merge(parts); g.scale(1.1, 1.1, 1.1); return g;
  }
  function stoneGeo() {
    const g = new THREE.IcosahedronGeometry(0.065, 1);
    const p = g.attributes.position, c = [];
    const r = U.mulberry(77);
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) * 1.25, p.getY(i) * 0.55, p.getZ(i) * (1 + (r() - 0.5) * 0.2));
      const t = 0.5 + r() * 0.12; c.push(t, t * 0.98, t * 0.94);
    }
    g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    return g;
  }

  function add(kind, x, z, y) {
    const K = KINDS[kind];
    const gy = y == null ? WORLD.groundAt(x, z) : y;
    const b = {
      kind, K, i: 0, p: new V3(x, gy + K.r, z), v: new V3(), q: new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), rnd() * 6.28),
      home: new V3(x, gy + K.r, z), sleep: true, still: 0, cool: 0, gone: false, held: false, skips: 0, wet: gy < 0, awayT: 0,
    };
    bodies.push(b);
    return b;
  }

  // ── 놓기 ──
  function place() {
    return;   // 발에 채이는 물건은 전부 뺐다 (사장님 2026-09-20 "공차는거 쓸데없어 발에 채이는거 다지워")
    const Z = TER.Z;
    // 공: 마을 한가운데 둘, 부탁 집(운동복 소년네) 앞마당 하나
    add('ball', Z.village.x + 3, Z.village.z - 4);
    add('ball', Z.village.x - 6, Z.village.z + 9);
    const hs = WORLD.QHOUSES || [];
    hs.forEach((h, n) => {
      const [x, z] = h.L(h.w * 0.5 + 1.2, -h.d / 2 - 2.2);
      if (!COL.inside(x, TER.H(x, z) + 0.3, z, 0.3)) add(n % 2 ? 'bucket' : 'ball', x, z);
      for (let k = 0; k < 2; k++) {   // 텃밭 호박
        const [px, pz] = h.L(-h.w * 0.5 - 1.6 - k * 0.7, -h.d * 0.2 + k * 0.9);
        if (!COL.inside(px, TER.H(px, pz) + 0.3, pz, 0.3) && TER.H(px, pz) > 0.3) add('pumpkin', px, pz);
      }
    });
    { const h = WORLD.HOME.h; if (h) { const [x, z] = h.L(h.w * 0.15 + 1.5, -h.d / 2 - 1.2); add('pumpkin', x, z); const [x2, z2] = h.L(h.w * 0.15 + 2.3, -h.d / 2 - 1.4); add('bucket', x2, z2); } }
    // 우물 옆 양동이
    WORLD.WELLS.slice(0, 3).forEach(w => { const x = w.x + 1.6, z = w.z + 0.8; if (!COL.inside(x, TER.H(x, z) + 0.3, z, 0.3)) add('bucket', x, z); });
    // 물가 돌 · 솔숲 솔방울
    let st = 0, cn = 0;
    for (let k = 0; k < 20000 && (st < 70 || cn < 45); k++) {
      const x = (rnd() - 0.5) * TER.LIMIT * 2, z = (rnd() - 0.5) * TER.LIMIT * 2;
      const h = TER.H(x, z);
      if (st < 70 && h > 0.04 && h < 0.45) {
        let wet = false;
        for (let a = 0; a < 6.28 && !wet; a += 1.05) if (TER.H(x + Math.cos(a) * 3, z + Math.sin(a) * 3) < -0.1) wet = true;
        if (wet && TER.boardD(x, z) > 1.5 && !COL.inside(x, h + 0.2, z, 0.2)) {
          add('stone', x, z);
          for (let j = 0; j < 2 && st < 70; j++, st++) { const ox = x + (rnd() - 0.5) * 1.6, oz = z + (rnd() - 0.5) * 1.6; if (TER.H(ox, oz) > 0.03) add('stone', ox, oz); }
          st++;
        }
        continue;
      }
      if (cn < 45 && h > 0.4) {
        const f = TER.forest(x, z);
        if (f && (f.k === 'pine' || f.k === 'spruce') && FLORA.treeNear(x, z, 3.5) && !COL.inside(x, h + 0.2, z, 0.15)) { add('cone', x, z); cn++; }
      }
    }
  }

  let ripples = [], ripMat = null, ripGeo = null;
  function build(sc) {
    scene = sc;
    rnd = U.mulberry(9091);
    place();
    const geos = { ball: ballGeo(), pumpkin: pumpkinGeo(), bucket: bucketGeo(), cone: coneGeo(), stone: stoneGeo() };
    // 꼭짓점 색은 눈에 보이는 색(sRGB)으로 적었으니 그림 계산용(선형)으로 바꾼다 — 안 바꾸면 호박이 누렇게 바랜다
    for (const k in geos) { const c = geos[k].attributes.color; for (let i = 0; i < c.array.length; i++) c.array[i] = Math.pow(c.array[i], 2.2); }
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
    for (const k in KINDS) {
      const list = bodies.filter(b => b.kind === k);
      const me = new THREE.InstancedMesh(geos[k], mat, Math.max(1, list.length));
      list.forEach((b, i) => { b.i = i; });
      me.count = list.length;
      me.castShadow = true; me.receiveShadow = true;
      me.frustumCulled = false;
      me.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      meshes[k] = me;
      scene.add(me);
      list.forEach(setM);
    }
    // 물결
    // 물결 그림: 안쪽이 밝고 바깥으로 흐려지는 두 겹 고리 (딱딱한 과녁처럼 보이지 않게)
    const rc = GEO.canvas(128, 128), rg = rc.getContext('2d'), img = rg.createImageData(128, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const d = Math.hypot(x - 63.5, y - 63.5) / 63.5;
      const a = Math.exp(-Math.pow((d - 0.86) / 0.05, 2)) + 0.45 * Math.exp(-Math.pow((d - 0.7) / 0.04, 2)) + 0.12 * Math.exp(-Math.pow((d - 0.5) / 0.08, 2));
      const o = (y * 128 + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = Math.min(255, a * 255);
    }
    rg.putImageData(img, 0, 0);
    ripGeo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    ripMat = new THREE.MeshBasicMaterial({ map: GEO.tex(rc), color: 0xe4f2f8, transparent: true, opacity: 0.5, depthWrite: false });
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(ripGeo, ripMat.clone());
      m.visible = false; m.renderOrder = 3;
      scene.add(m);
      ripples.push({ m, t: 9, dur: 1, s0: 0.1, s1: 1 });
    }
    // 손에 든 것
    held = new THREE.Mesh(geos.stone, mat);
    held.castShadow = true; held.visible = false;
    heldGeos = geos;
    scene.add(held);
  }
  let held = null, heldGeos = null;

  const M4 = new THREE.Matrix4(), S0 = new V3(0, 0, 0), S1 = new V3(1, 1, 1);
  const dirty = {};
  function setM(b) {
    const hide = b.gone || b.held;
    M4.compose(b.p, b.q, hide ? S0 : S1);
    meshes[b.kind].setMatrixAt(b.i, M4);
    dirty[b.kind] = true;
  }

  function ripple(x, z, size, dur) {
    let r = ripples.find(o => o.t >= o.dur);
    if (!r) r = ripples.reduce((a, o) => (o.t / o.dur > a.t / a.dur ? o : a));
    r.t = 0; r.dur = dur || 1.2; r.s0 = size * 0.15; r.s1 = size;
    r.m.position.set(x, 0.03, z);
    r.m.visible = true;
  }
  function splash(p, k) {
    FEEL.splash(new V3(p.x, 0.05, p.z), Math.round(3 + k * 10));
    ripple(p.x, p.z, 0.6 + k * 1.4, 1.4);
    setTimeout(() => ripple(p.x, p.z, 0.4 + k * 1.0, 1.1), 180);
  }

  function wake(b) { b.sleep = false; b.still = 0; }

  // 땅의 기울기
  const _n = new V3();
  function normalAt(x, z) {
    const e = 0.25;
    const hx = TER.H(x + e, z) - TER.H(x - e, z), hz = TER.H(x, z + e) - TER.H(x, z - e);
    return _n.set(-hx, 2 * e, -hz).normalize();
  }

  const _t = { x: 0, y: 0, z: 0 }, _ax = new V3(), _dq = new THREE.Quaternion(), _hv = new V3();
  function stepBody(b, dt) {
    const K = b.K, p = b.p, v = b.v;
    const g0 = WORLD.groundAt(p.x, p.z, p.y - K.r);
    const inWater = g0 < -0.05 && p.y - K.r * 0.5 < 0;
    const wasAbove = p.y - K.r > 0.001;
    v.y -= G * dt;
    if (inWater) {
      if (K.float) {
        const sub = U.clamp((K.r * 0.6 - p.y) / K.r, 0, 1.6);
        v.y += sub * G * 2.4 * dt;
        v.multiplyScalar(Math.exp(-2.2 * dt));
        v.y *= Math.exp(-2.5 * dt);
        // 물결 따라 살살 떠내려간다
        v.x += Math.sin(T.time * 0.3 + p.z * 0.1) * 0.05 * dt; v.z += Math.cos(T.time * 0.27 + p.x * 0.1) * 0.05 * dt;
      } else {
        v.multiplyScalar(Math.exp(-3.5 * dt));
        v.y = Math.max(v.y, -1.2);
      }
    }
    // 물수제비
    if (b.kind === 'stone' && wasAbove && g0 < -0.2 && p.y - K.r + v.y * dt <= 0 && v.y < 0) {
      const hs = Math.hypot(v.x, v.z);
      if (hs > 4 && -v.y < hs * 0.5 && b.skips < 9) {
        b.skips++;
        v.y = -v.y * 0.5 + 0.9; v.x *= 0.8; v.z *= 0.8;
        p.y = K.r + 0.001;
        AUD.sfx('skip');
        FEEL.splash(new V3(p.x, 0.04, p.z), 3);
        ripple(p.x, p.z, 1.0, 1.3);
        return;
      }
    }
    p.addScaledVector(v, dt);
    // 물에 들어가는 순간
    if (wasAbove && p.y - K.r <= 0 && g0 < -0.05 && !b.wet) {
      b.wet = true;
      const k = U.clamp((-v.y + Math.hypot(v.x, v.z) * 0.3) / 8 * (0.5 + K.m / 4), 0.15, 1);
      splash(p, k);
      AUD.sfx('plop', k);
      if (b.kind === 'stone') {
        if (b.skips >= 2) { FX.pop('×' + b.skips, p); if (b.skips >= 4) { AUD.sfx('coin'); } }
        b.sinkT = 0;
      }
    }
    if (p.y - K.r > 0.05 || g0 >= -0.05) b.wet = inWater && p.y - K.r < 0.05;
    // 땅
    const g = WORLD.groundAt(p.x, p.z, p.y - K.r);
    let onGround = false;
    if (p.y - K.r < g) {
      p.y = g + K.r;
      const n = normalAt(p.x, p.z);
      if (g > TER.H(p.x, p.z) + 0.02) n.set(0, 1, 0);   // 마루·널길 위는 평평
      const vn = v.dot(n);
      if (vn < 0) {
        if (vn < -1.2) { AUD.sfx(K.snd === 'tin' ? 'tin' : (K.snd === 'bounce' ? 'bounce' : 'tock'), U.clamp(-vn / 6, 0.15, 1) * vol(p)); }
        v.addScaledVector(n, -(1 + (vn < -1 ? K.e : 0)) * vn);
      }
      // 구름 저항 (비탈 방향 힘은 남는다)
      const damp = Math.exp(-K.roll * dt * (inWater ? 2 : 1));
      v.x *= damp; v.z *= damp;
      onGround = true;
    }
    // 부딪힘: 나무·집·울타리
    _t.x = p.x; _t.y = p.y - K.r; _t.z = p.z;
    if (COL.push(_t, K.r, K.r * 2)) {
      const nx = _t.x - p.x, nz = _t.z - p.z, d = Math.hypot(nx, nz) || 1;
      const ux = nx / d, uz = nz / d, vn = v.x * ux + v.z * uz;
      if (vn < 0) {
        if (vn < -1.5) AUD.sfx(K.snd === 'tin' ? 'tin' : 'tock', U.clamp(-vn / 6, 0.15, 0.8) * vol(p));
        v.x -= (1 + K.e) * vn * ux; v.z -= (1 + K.e) * vn * uz;
      }
      p.x = _t.x; p.z = _t.z;
    }
    const L = TER.LIMIT - 1;
    if (Math.abs(p.x) > L) { p.x = Math.sign(p.x) * L; v.x *= -0.4; }
    if (Math.abs(p.z) > L) { p.z = Math.sign(p.z) * L; v.z *= -0.4; }
    // 굴러가는 모습
    _hv.set(v.x, 0, v.z);
    const sp = _hv.length();
    if (sp > 0.01) {
      if (onGround || inWater) {
        _ax.set(v.z, 0, -v.x).normalize();
        _dq.setFromAxisAngle(_ax, sp / K.r * dt * (inWater ? 0.3 : 1));
        b.q.premultiply(_dq);
      } else if (b.spin) {
        _dq.setFromAxisAngle(b.spinAx, b.spin * dt); b.q.premultiply(_dq);
      }
    }
    // 가라앉은 돌은 바닥에서 쉰다
    if (inWater && !K.float && p.y - K.r <= g + 0.01) { b.sleep = true; b.sunk = true; }
    // 멈춤
    if ((onGround || inWater) && v.lengthSq() < (inWater ? 0.0004 : 0.01)) { b.still += dt; if (b.still > 0.6 && !inWater) { v.set(0, 0, 0); b.sleep = true; } }
    else b.still = 0;
  }
  function vol(p) { return U.clamp(1 - Math.hypot(p.x - PL.pos.x, p.z - PL.pos.z) / 30, 0, 1); }

  // ── 주인공과 부딪힘 ──
  function touchPlayer(b, dt) {
    const K = b.K, p = b.p, pp = PL.pos;
    const dx = p.x - pp.x, dz = p.z - pp.z, d = Math.hypot(dx, dz), R = 0.3 + K.r;
    if (d > R || p.y < pp.y - 0.3 || p.y - K.r > pp.y + 1.0) return;
    const ux = d > 1e-3 ? dx / d : Math.sin(PL.yaw), uz = d > 1e-3 ? dz / d : Math.cos(PL.yaw);
    // 밀어낸다
    p.x = pp.x + ux * R; p.z = pp.z + uz * R;
    const pv = PL.vel, s = Math.hypot(pv.x, pv.z);
    const into = pv.x * ux + pv.z * uz;
    if (into > 0.2) {
      wake(b);
      if (b.cool <= 0 && s > 1.2) {
        // 발에 차인다 — 달릴수록 세고 높게
        // 달려서 공을 차면 초속 9m 쯤, 호박은 1m 도 안 간다
        const spd = Math.min(10, s * 0.66 * K.kick / Math.sqrt(K.m));
        let dx2 = pv.x / s * 0.7 + ux * 0.3, dz2 = pv.z / s * 0.7 + uz * 0.3;
        const dl = Math.hypot(dx2, dz2) || 1; dx2 /= dl; dz2 /= dl;
        b.v.x = dx2 * spd; b.v.z = dz2 * spd;
        b.v.y = Math.max(b.v.y, s > 3.5 ? spd * 0.3 : 0.4);
        b.cool = 0.35;
        AUD.sfx(K.snd === 'tin' ? 'tin' : (b.kind === 'ball' ? 'kick' : 'tock'), U.clamp(s / 6, 0.3, 1));
      } else {
        // 천천히 밀면 따라 굴러간다
        const want = into * 1.05;
        const cur = b.v.x * ux + b.v.z * uz;
        if (cur < want) { b.v.x += ux * (want - cur); b.v.z += uz * (want - cur); }
      }
    }
  }

  // ── 차기 · 집기 · 던지기 ──
  let holding = null, throwT = -1, kickT = -1, kickB = null;
  function nearest(fn, r) {
    let best = null, bd = r;
    for (const b of bodies) {
      if (b.gone || b.held || !fn(b)) continue;
      const d = Math.hypot(b.p.x - PL.pos.x, b.p.z - PL.pos.z);
      if (d < bd && Math.abs(b.p.y - PL.pos.y) < 1.2) { bd = d; best = b; }
    }
    return best;
  }
  function near() {
    if (holding) return { kind: 'throw', label: 'E ↗' };
    if (PL.swim) return null;
    const b = nearest(b => b.kind === 'ball' || b.K.grab, 1.25);
    if (!b) return null;
    if (b.kind === 'ball') return { kind: 'kick', b, label: 'E ⚽' };
    return { kind: 'grab', b, label: 'E ✋' };
  }
  // 'kick' 동작(속도 1.4)에서 오른발이 공에 닿는 때와 그 자리(몸 기준 앞·옆) — 게임 안에서 재었다
  const KICK_HIT = 0.33, KICK_FWD = 0.42, KICK_SIDE = -0.29;
  function kick(b) {
    const has = !!PLAYER.CH.acts.kick;
    const yaw = Math.atan2(b.p.x - PL.pos.x, b.p.z - PL.pos.z);
    PL.yaw = yaw;
    if (has) {   // 공이 오른발 앞에 오게 한 발 옮겨 선다
      const nx = b.p.x - (Math.sin(yaw) * KICK_FWD + Math.cos(yaw) * KICK_SIDE);
      const nz = b.p.z - (Math.cos(yaw) * KICK_FWD - Math.sin(yaw) * KICK_SIDE);
      if (!COL.inside(nx, PL.pos.y + 0.5, nz, 0.3)) { PL.pos.x = nx; PL.pos.z = nz; }
    }
    PLAYER.doAct(has ? 'kick' : 'throw', has ? 0.75 : 0.6, has ? { speed: 1.4, once: true } : { speed: 2.4, from: 0.5, once: true });
    kickT = has ? KICK_HIT : 0.18; kickB = b;
    b.cool = 1;   // 차기 전에 몸에 밀리지 않게
  }
  let grabT = -1, grabB = null;
  function grab(b) {
    PL.yaw = Math.atan2(b.p.x - PL.pos.x, b.p.z - PL.pos.z);
    PLAYER.doAct('pick', 0.9, { speed: 2.4, from: 0.6 });
    grabT = 0.38; grabB = b;
  }
  function grabNow(b) {
    if (b.gone) return;
    b.held = true; b.sleep = true; b.v.set(0, 0, 0); b.skips = 0; b.sunk = false;
    holding = b;
    held.geometry = heldGeos[b.kind];
    setM(b);
    AUD.sfx('pick');
  }
  function throwIt() {
    if (!holding) return;
    // 카메라가 보는 쪽으로
    const yaw = Math.atan2(-Math.sin(CAM.yaw), -Math.cos(CAM.yaw));
    PL.yaw = yaw;
    PLAYER.doAct('throw', 0.9, { speed: 1.8, from: 0.35, once: true });
    throwT = 0.28;
  }
  function release() {
    const b = holding; if (!b) return;
    holding = null;
    held.getWorldPosition(b.p);
    const fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw);
    // 위를 보면 높이, 아래를 보면 낮고 빠르게 (물수제비)
    const pitch = U.clamp(0.42 - (CAM.pitch || 0) * 1.2, 0.02, 0.9);
    const sp = b.kind === 'ball' ? 9 : 13.5;
    b.v.set(fx * Math.cos(pitch) * sp, Math.sin(pitch) * sp, fz * Math.cos(pitch) * sp);
    b.v.x += PL.vel.x; b.v.z += PL.vel.z;
    b.spin = 14; b.spinAx = new V3(fz, 0, -fx);
    b.held = false; b.wet = false; b.sunk = false; b.skips = 0;
    wake(b);
    AUD.sfx('whoosh');
  }
  function act(n) {
    if (n.kind === 'throw') return throwIt();
    if (n.kind === 'kick') return kick(n.b);
    if (n.kind === 'grab') return grab(n.b);
  }

  // ── 매 프레임 ──
  const hand = new V3();
  let wadeT = 0;
  function update(dt) {
    if (!scene) return;
    // 풀 눕히기
    if (FLORA.bend) { FLORA.bend.uPl.value.set(PL.pos.x, PL.ch && PL.ch.holder.visible ? PL.pos.y : -99, PL.pos.z); FLORA.bend.uT.value = T.time; }
    if (T.mode !== 'play' && T.mode !== 'over') return;
    const n = Math.min(3, Math.ceil(dt / 0.017));
    const h = dt / n;
    for (const b of bodies) {
      if (b.gone || b.held) continue;
      const far = Math.abs(b.p.x - PL.pos.x) > 60 || Math.abs(b.p.z - PL.pos.z) > 60;
      if (!far && T.mode === 'play') touchPlayer(b, dt);
      if (b.cool > 0) b.cool -= dt;
      // 멀리 가 버린 것·가라앉은 돌은 안 보일 때 제자리로
      if (far && (b.sunk || b.p.distanceToSquared(b.home) > 400)) {
        b.awayT += dt;
        if (b.awayT > 40) { b.p.copy(b.home); b.v.set(0, 0, 0); b.sunk = false; b.sleep = true; b.wet = b.home.y < b.K.r; b.awayT = 0; setM(b); }
      } else b.awayT = 0;
      if (b.sleep || far) continue;
      for (let i = 0; i < n; i++) stepBody(b, h);
      if (b.spin) b.spin *= Math.exp(-dt * 1.5);
      setM(b);
    }
    // 서로 부딪힘 (깨어 있는 것끼리만, 가까운 것만)
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.sleep || a.gone || a.held) continue;
      for (let j = 0; j < bodies.length; j++) {
        const c = bodies[j];
        if (i === j || c.gone || c.held) continue;
        const dx = c.p.x - a.p.x, dy = c.p.y - a.p.y, dz = c.p.z - a.p.z, R = a.K.r + c.K.r;
        if (Math.abs(dx) > R || Math.abs(dz) > R) continue;
        const d = Math.hypot(dx, dy, dz);
        if (d >= R || d < 1e-4) continue;
        const ux = dx / d, uy = dy / d, uz = dz / d;
        const ma = a.K.m, mc = c.K.m, pen = R - d;
        a.p.x -= ux * pen * mc / (ma + mc); a.p.z -= uz * pen * mc / (ma + mc);
        c.p.x += ux * pen * ma / (ma + mc); c.p.z += uz * pen * ma / (ma + mc);
        const rv = (c.v.x - a.v.x) * ux + (c.v.y - a.v.y) * uy + (c.v.z - a.v.z) * uz;
        if (rv < 0) {
          const e = Math.min(a.K.e, c.K.e) + 0.2;
          const jj = -(1 + e) * rv / (1 / ma + 1 / mc);
          a.v.x -= jj / ma * ux; a.v.y -= jj / ma * uy; a.v.z -= jj / ma * uz;
          c.v.x += jj / mc * ux; c.v.y += jj / mc * uy; c.v.z += jj / mc * uz;
          wake(c);
          if (rv < -1.5) AUD.sfx(a.K.snd === 'tin' || c.K.snd === 'tin' ? 'tin' : 'tock', U.clamp(-rv / 6, 0.2, 0.8) * vol(a.p));
        }
        setM(a); setM(c);
      }
    }
    for (const k in dirty) if (dirty[k]) { meshes[k].instanceMatrix.needsUpdate = true; dirty[k] = false; }
    // 손에 든 것
    if (PLAYER.CH.bones.RightHand) PLAYER.CH.bones.RightHand.getWorldPosition(hand);
    held.visible = !!holding && PL.ch.holder.visible;
    if (holding) {
      held.position.copy(hand); held.position.y += 0.02;
      held.quaternion.copy(holding.q);
      if (PL.swim) { release(); }
    }
    if (grabT >= 0) { grabT -= dt; if (grabT < 0 && grabB) { grabNow(grabB); grabB = null; } }
    if (throwT >= 0) { throwT -= dt; if (throwT < 0) release(); }
    if (kickT >= 0) {
      kickT -= dt;
      if (kickT < 0 && kickB) {
        const b = kickB; kickB = null;
        const fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw);
        if (Math.hypot(b.p.x - PL.pos.x, b.p.z - PL.pos.z) < 1.6) {
          const pitch = U.clamp(0.5 - (CAM.pitch || 0) * 1.2, 0.12, 0.9);
          b.v.set(fx * Math.cos(pitch) * 9.5, Math.sin(pitch) * 9.5, fz * Math.cos(pitch) * 9.5);
          wake(b); b.cool = 0.4;
          AUD.sfx('kick', 1);
          if (window.CAM) CAM.shake = Math.max(CAM.shake || 0, 0.12);
        }
      }
    }
    // 물결
    for (const r of ripples) {
      if (r.t >= r.dur) continue;
      r.t += dt;
      const k = Math.min(1, r.t / r.dur);
      const s = U.lerp(r.s0, r.s1, 1 - (1 - k) * (1 - k));
      r.m.scale.set(s, 1, s);
      r.m.material.opacity = 0.38 * (1 - k) * (1 - k * 0.3);
      if (k >= 1) r.m.visible = false;
    }
    // 걷고 헤엄칠 때 발밑 물결
    const sp = Math.hypot(PL.vel.x, PL.vel.z);
    if ((PL.wade || PL.swim) && T.mode === 'play') {
      wadeT -= dt * (0.6 + sp);
      if (wadeT <= 0) { wadeT = PL.swim ? 1.6 : 1.1; ripple(PL.pos.x, PL.pos.z, sp > 0.3 ? 1.1 : 0.7, 1.6); }
    }
  }

  window.PHYS = { build, update, near, act, add, bodies, KINDS, ripple, get holding() { return holding; } };
})();
