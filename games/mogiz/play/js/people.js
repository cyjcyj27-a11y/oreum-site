// 피 빨 대상 일곱: 모양(만화 인형), 살 자리(prims), 팔(2관절 IK), 가만히 있는 몸짓, 간지러움·찾기·내려치기.
(function () {
  const P = (window.PEOPLE = { list: [], by: {} });
  const V3 = THREE.Vector3, Y = new V3(0, 1, 0);
  const v = (x, y, z) => new V3(x, y, z);
  const _a = new V3(), _b = new V3(), _c = new V3(), _d = new V3(), _q = new THREE.Quaternion();
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

  function capGeo(r, L) { return TOON.onrm(new THREE.CapsuleGeometry(r, Math.max(0.0005, L), 4, 10)); }
  function place(mesh, a, b) {
    _d.subVectors(b, a); const L = _d.length() || 1e-4;
    mesh.position.copy(a).addScaledVector(_d, 0.5);
    mesh.quaternion.setFromUnitVectors(Y, _d.multiplyScalar(1 / L));
  }
  function segMat(a, b) { _d.subVectors(b, a); const L = _d.length(); return new THREE.Matrix4().compose(a.clone().addScaledVector(_d, 0.5), new THREE.Quaternion().setFromUnitVectors(Y, _d.clone().normalize()), v(1, 1, 1)); }

  // ---------- 인형 짓기 도우미 ----------
  function Maker(c) { this.c = c; this.b = new TOON.Batch(); this.h = new TOON.Batch(); }
  // 캡슐(a→b, r). skin: 살(물 수 있음), cov: [t0,t1] 옷으로 가린 구간, head: 머리 무리
  Maker.prototype.cap = function (a, b, r, col, o) {
    o = o || {}; const L = a.distanceTo(b);
    (o.head ? this.h : this.b).add(new THREE.CapsuleGeometry(r, Math.max(0.0005, L), 4, 10), col, segMat(a, b), o.j === undefined ? 0.04 : o.j);
    if (o.prim !== false) this.c.prims.push({ grp: o.head ? 'head' : 'body', a: a.clone(), b: b.clone(), r, skin: !!o.skin, cov: o.cov || null, solid: o.solid !== false });
  };
  Maker.prototype.sph = function (p, sx, sy, sz, col, o) {
    o = o || {};
    (o.head ? this.h : this.b).add(new THREE.SphereGeometry(1, 16, 12), col, TOON.M(p.x, p.y, p.z, o.rx || 0, o.ry || 0, o.rz || 0, sx, sy, sz), o.j === undefined ? 0.04 : o.j);
    // 부딪힘은 실제 타원 그대로(공 하나로 뭉뚱그리면 길쭉한 몸 끝이 뚫림). prim:false 라도 큰 것은 막기만 함
    const big = Math.min(sx, sy, sz) >= 0.012;
    if (o.prim !== false || big) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0));
      this.c.prims.push({ grp: o.head ? 'head' : 'body', a: p.clone(), b: p.clone(), r: Math.min(sx, sy, sz), ell: v(sx, sy, sz), eq: q, eqi: q.clone().invert(), skin: o.prim !== false && !!o.skin, sfn: o.sfn || null, solid: o.solid !== false });
    }
  };
  // 한 덩어리 몸통: 옆 윤곽(prof [높이, 반폭])을 돌려 만들고 앞뒤는 depth 배로 납작하게. 어깨·허리·엉덩이가 이어짐
  Maker.prototype.lathe = function (prof, depth, col, mat, j) {
    const pts = prof.map((q) => new THREE.Vector2(Math.max(0.0005, q[1]), q[0]));
    const g = new THREE.LatheGeometry(pts, 28); g.scale(1, 1, depth);
    // 색 함수는 몸통 자체 좌표(윤곽 높이 y)로 받음 → 옷 경계가 고리 줄과 맞아 톱니가 안 생김
    let cf = col;
    if (typeof col === 'function') { const inv = mat.clone().invert(), lv = new V3(); cf = (x, y, z, cc, nx, ny, nz) => { lv.set(x, y, z).applyMatrix4(inv); col(lv.x, lv.y, lv.z, cc); }; }
    this.b.add(g, cf, mat, j === undefined ? 0.025 : j);
    // 부딪힘: 윤곽 칸마다 타원 하나
    const pos = new V3(), q = new THREE.Quaternion(), sc = new V3(); mat.decompose(pos, q, sc);
    for (let i = 0; i < prof.length - 1; i++) {
      const y0 = prof[i][0], y1 = prof[i + 1][0], r0 = Math.max(prof[i][1], prof[i + 1][1]);
      if (r0 < 0.04) continue;
      const c = v(0, (y0 + y1) / 2, 0).applyMatrix4(mat);
      this.c.prims.push({ grp: 'body', a: c, b: c.clone(), r: Math.min(r0 * depth, (y1 - y0) / 2 + 0.03), ell: v(r0, (y1 - y0) / 2 + 0.03, r0 * depth), eq: q.clone(), eqi: q.clone().invert(), skin: false, solid: true });
    }
  };
  Maker.prototype.geo = function (g, col, m, head, j) { (head ? this.h : this.b).add(g, col, m, j === undefined ? 0.03 : j); };
  Maker.prototype.finish = function () {
    const c = this.c;
    c.bodyMesh = this.b.build({ cast: true }); c.root.add(c.bodyMesh);
    c.headMesh = this.h.pos.length ? this.h.build({ cast: true }) : new THREE.Group(); c.head.add(c.headMesh);
    c.prims.forEach((p) => { p.node = p.grp === 'head' ? c.head : c.root; });
  };

  // 팔(어깨 S, 위 L1·아래 L2, 반지름, 색). 손끝 물건은 end 에.
  function Arm(c, o) {
    this.c = c; Object.assign(this, o);
    this.up = new THREE.Mesh(capGeo(o.r1, o.L1), TOON.col(o.c1)); this.up.castShadow = true; TOON.outline(this.up);
    this.fo = new THREE.Mesh(capGeo(o.r2, o.L2), TOON.col(o.c2)); this.fo.castShadow = true; TOON.outline(this.fo);
    this.hand = new THREE.Mesh(new THREE.SphereGeometry(o.hr, 12, 8), TOON.col(o.ch || o.c2)); this.hand.castShadow = true; TOON.outline(this.hand);
    if (o.hs) this.hand.scale.set(o.hs[0], o.hs[1], o.hs[2]);
    if (o.sleeve) { this.sl = new THREE.Mesh(capGeo(o.r1 * 1.12, o.L1 * o.sleeve), TOON.col(o.sc)); TOON.outline(this.sl); this.up.add(this.sl); this.sl.position.y = -o.L1 / 2 + (o.L1 * o.sleeve) / 2; }
    this.hold = new THREE.Group(); this.hand.add(this.hold);
    // 엄지(사람 손만): 손바닥 옆 작은 혹
    if (o.thumb !== false && o.hs === undefined) {
      this.hand.scale.set(1.05, 1.25, 0.72);
      const th = new THREE.Mesh(new THREE.SphereGeometry(o.hr * 0.42, 8, 6), TOON.col(o.ch || o.c2)); TOON.outline(th);
      th.position.set(o.hr * 0.75 * (o.S.x >= 0 ? 1 : -1), -o.hr * 0.15, o.hr * 0.35); th.scale.set(1, 1.5, 1); this.hand.add(th);
    }
    // 어깨 공(옷 색): 팔이 몸에서 튀어나와 보이지 않게
    if (o.sc) { const sb = new THREE.Mesh(new THREE.SphereGeometry(o.r1 * 1.0, 12, 8), TOON.col(o.sc)); sb.castShadow = true; TOON.outline(sb); sb.position.copy(o.S); c.root.add(sb);
      c.prims.push({ node: c.root, a: o.S.clone(), b: o.S.clone(), r: o.r1 * 1.0, skin: false, solid: true }); }
    [this.up, this.fo, this.hand].forEach((m) => c.root.add(m));
    // 살 자리
    const L1 = o.L1, L2 = o.L2;
    c.prims.push({ node: this.up, a: v(0, -L1 / 2, 0), b: v(0, L1 / 2, 0), r: o.r1, skin: !!o.skin1, cov: o.sleeve ? [0, o.sleeve] : null, solid: true, arm: this });
    c.prims.push({ node: this.fo, a: v(0, -L2 / 2, 0), b: v(0, L2 / 2, 0), r: o.r2, skin: !!o.skin2, solid: true, arm: this });
    c.prims.push({ node: this.hand, a: v(0, 0, 0), b: v(0, 0, 0), r: o.hr, skin: !!o.skin2, solid: true, arm: this });
    this.W = o.rest.clone(); this.E = v(); this.tipL = 0;
    this.solve();
  }
  // 손목 W(인형 좌표)에 닿도록 팔꿈치를 정함
  Arm.prototype.solve = function () {
    const S = this.S, L1 = this.L1, L2 = this.L2;
    _a.subVectors(this.W, S); let d = _a.length(); const dir = _a.normalize().clone();
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 0.01), L1 + L2 - 0.002);
    const W = S.clone().addScaledVector(dir, d); this.Wr = W;
    const ca = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    _b.copy(this.pole).addScaledVector(dir, -this.pole.dot(dir)); if (_b.lengthSq() < 1e-6) _b.set(0, -1, 0); _b.normalize();
    this.E.copy(S).addScaledVector(dir, L1 * ca).addScaledVector(_b, L1 * sa);
    place(this.up, S, this.E); place(this.fo, this.E, W);
    _c.subVectors(W, this.E).normalize(); this.dirF = _c.clone();
    this.hand.position.copy(W).addScaledVector(_c, this.hr * 0.55);
    this.hand.quaternion.copy(this.fo.quaternion);
    // 든 물건은 겨누는 곳(aimT)을 향함, 없으면 아래팔 방향
    this.dirA = this.aimT ? _b.subVectors(this.aimT, this.hand.position).normalize().clone() : this.dirF;
    if (this.tipL) this.hold.quaternion.copy(_q.copy(this.hand.quaternion).invert()).multiply(new THREE.Quaternion().setFromUnitVectors(Y, this.dirA));
  };
  // 손끝(물건 끝) 월드 자리
  Arm.prototype.tip = function (out) {
    out.copy(this.hand.position); if (this.tipL && this.hold.visible) out.addScaledVector(this.dirA || this.dirF, this.tipL);
    return this.c.root.localToWorld(out);
  };

  // 손에 드는 물건
  function racket() {
    const g = new THREE.Group();
    const h = TOON.mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.2, 8), '#f2c230'); h.position.y = 0.08; g.add(h);
    const f = TOON.mesh(new THREE.TorusGeometry(0.12, 0.012, 6, 24), '#2f6fd6'); f.position.y = 0.3; g.add(f);
    const net = new THREE.Mesh(new THREE.CircleGeometry(0.115, 20), new THREE.MeshBasicMaterial({ color: '#b8d8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); net.position.y = 0.3; g.add(net);
    g.userData.net = net; return g;
  }
  function swatter() {
    const g = new THREE.Group();
    const h = TOON.mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.4, 6), '#3f9a4a'); h.position.y = 0.2; g.add(h);
    const p = TOON.mesh(new THREE.BoxGeometry(0.15, 0.17, 0.008), '#56c060'); p.position.y = 0.47; g.add(p);
    return g;
  }
  function sprayCan() {
    const g = new THREE.Group();
    const b = TOON.mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.19, 12), '#f4d03a'); b.position.y = 0.06; g.add(b);
    const s = TOON.mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.06, 12), '#2f9a46', false); s.position.y = 0.05; g.add(s);
    const cap = TOON.mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.035, 10), '#ffffff'); cap.position.y = 0.17; g.add(cap);
    return g;
  }

  // ---------- 캐릭터 ----------
  function Char(id) {
    this.id = id; this.D = DATA.T[id];
    const sp = WORLD.spots[id];
    this.root = new THREE.Group(); this.root.position.copy(sp.p); this.root.rotation.y = sp.yaw;
    this.head = new THREE.Group(); this.root.add(this.head);
    this.prims = []; this.arms = []; this.bumps = [];
    this.itch = 0; this.annoy = 0; this.alert = 0; this.blood = 0; this.done = false; this.act = null; this.cool = 0; this.look = 0; this.lookP = 0;
    this.headBase = new THREE.Quaternion(); this.headPos = v();
  }
  Char.prototype.headWorld = function (out) { return this.head.localToWorld(out.copy(this.headC || v())); };

  const SKIN = '#f3c9a3', SKIN2 = '#e9b78e', SKINO = '#dcab86', HAIR = '#2a2228';
  function face(m, c, o) {
    // 눈·눈썹·코·입(머리 좌표, 앞 +z)
    const r = o.r, ey = o.ey || 0.012, ex = o.ex || r * 0.36;
    if (o.closed) [-1, 1].forEach((s) => m.geo(new THREE.TorusGeometry(r * 0.12, r * 0.025, 4, 10, Math.PI), '#2a1f22', TOON.M(s * ex, ey, r * 0.93, 0, 0, Math.PI), true, 0));
    else [-1, 1].forEach((s) => { m.sph(v(s * ex, ey, r * 0.9), r * 0.13, r * 0.18, r * 0.07, '#1d1418', { head: true, prim: false, j: 0 }); m.sph(v(s * ex + r * 0.04, ey + r * 0.06, r * 0.95), r * 0.04, r * 0.04, r * 0.02, '#ffffff', { head: true, prim: false, j: 0 }); });
    if (o.brow) [-1, 1].forEach((s) => m.geo(new THREE.BoxGeometry(r * 0.3, r * 0.06, r * 0.05), o.brow, TOON.M(s * ex, ey + r * 0.27, r * 0.88, 0, 0, s * (o.browT || 0.12)), true, 0));
    m.sph(v(0, ey - r * 0.2, r * 0.98), r * 0.11, r * 0.1, r * 0.1, o.nose || SKIN2, { head: true, prim: false });
    if (o.mouth !== false) m.geo(new THREE.BoxGeometry(r * (o.mw || 0.3), r * 0.05, r * 0.04), o.mouth || '#7a2e34', TOON.M(0, ey - r * 0.44, r * 0.9), true, 0);
    if (o.cheek) [-1, 1].forEach((s) => m.sph(v(s * r * 0.55, ey - r * 0.25, r * 0.78), r * 0.15, r * 0.09, r * 0.05, o.cheek, { head: true, prim: false, j: 0 }));
    if (o.ears !== false) [-1, 1].forEach((s) => m.sph(v(s * r * 0.98, 0, 0), r * 0.18, r * 0.26, r * 0.12, SKIN, { head: true, skin: true }));
  }

  // 남고딩: 의자에 앉아 게임. 검은 반팔·회색 반바지·헤드셋·삼선 슬리퍼
  function buildTeen(c) {
    const m = new Maker(c);
    // 몸통 한 덩어리(엉덩이 → 허리 → 가슴 → 어깨), 살짝 앞으로 숙임
    const tCol = (x, y, z, cc) => cc.set(y < 0.145 ? '#5d6470' : '#2b2d38');
    m.lathe([[0.0, 0], [0.01, 0.12], [0.06, 0.165], [0.13, 0.165], [0.145, 0.162], [0.155, 0.158], [0.2, 0.145], [0.3, 0.14], [0.4, 0.16], [0.47, 0.17], [0.52, 0.15], [0.56, 0.1], [0.58, 0.05], [0.585, 0]], 0.66, tCol, TOON.M(0, 0.02, 0.0, 0.18, 0, 0));
    m.geo(new THREE.BoxGeometry(0.08, 0.045, 0.01), '#ffd34a', TOON.M(0.06, 0.4, 0.19, 0.18, 0, 0), false, 0);
    m.cap(v(0, 0.53, 0.11), v(0, 0.6, 0.13), 0.055, SKIN, { skin: true });
    [-1, 1].forEach((s) => {
      m.cap(v(s * 0.09, 0.08, 0.02), v(s * 0.1, 0.1, 0.44), 0.07, SKIN, { skin: true, cov: [0, 0.55] });
      m.cap(v(s * 0.09, 0.08, 0.02), v(s * 0.095, 0.09, 0.26), 0.085, '#5d6470', { prim: false });
      m.cap(v(s * 0.1, 0.1, 0.44), v(s * 0.11, -0.36, 0.47), 0.055, SKIN, { skin: true });
      m.sph(v(s * 0.11, -0.43, 0.53), 0.055, 0.035, 0.11, '#2f5fc4');
      [0, 1, 2].forEach((k) => m.geo(new THREE.BoxGeometry(0.012, 0.01, 0.08), '#ffffff', TOON.M(s * 0.11 + (k - 1) * 0.022, -0.395, 0.53), false, 0));
    });
    // 머리(머리 좌표: 가운데 0, 앞 +z)
    c.head.position.set(0, 0.715, 0.15); c.headC = v(0, 0, 0); const r = 0.115;
    m.sph(v(0, 0, 0), r, r * 1.08, r * 1.05, SKIN, { head: true, skin: true, pr: r, sfn: (n) => n.z > -0.15 && n.y < 0.42 });
    m.sph(v(0, r * 0.3, -r * 0.14), r * 1.07, r * 0.86, r * 1.03, HAIR, { head: true, prim: false }); m.sph(v(0, -r * 0.05, -r * 0.3), r * 0.98, r * 0.8, r * 0.82, HAIR, { head: true, prim: false });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; m.geo(new THREE.ConeGeometry(0.03, 0.08, 5), HAIR, TOON.M(Math.cos(a) * 0.07, r * 0.95, Math.sin(a) * 0.07 - 0.02, Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6), true, 0.05); }
    m.sph(v(0, r * 0.62, r * 0.62), r * 0.75, r * 0.22, r * 0.35, HAIR, { head: true, prim: false });
    face(m, c, { r, brow: HAIR, browT: -0.18, ears: false, mouth: '#6a2a30', mw: 0.22 });
    // 헤드셋
    m.geo(new THREE.TorusGeometry(r * 1.12, 0.012, 6, 20, Math.PI), '#1a1a20', TOON.M(0, 0.0, -0.01, 0, 0, 0), true, 0);
    [-1, 1].forEach((s) => { m.geo(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 14), '#1a1a20', TOON.M(s * r * 1.08, 0, 0, 0, 0, Math.PI / 2), true, 0); m.geo(new THREE.TorusGeometry(0.045, 0.006, 4, 14), '#4dff9a', TOON.M(s * r * 1.3, 0, 0, 0, Math.PI / 2, 0), true, 0); });
    m.finish();
    // 팔: +x 가 인형의 왼쪽
    c.arms.push(new Arm(c, { name: 'L', S: v(0.18, 0.49, 0.1), L1: 0.27, L2: 0.25, r1: 0.052, r2: 0.046, hr: 0.053, c1: SKIN, c2: SKIN, skin1: true, skin2: true, sleeve: 0.45, sc: '#2b2d38', rest: v(0.12, 0.28, 0.5), pole: v(1, -0.6, -0.5) }));
    c.arms.push(new Arm(c, { name: 'R', S: v(-0.18, 0.49, 0.1), L1: 0.27, L2: 0.25, r1: 0.052, r2: 0.046, hr: 0.053, c1: SKIN, c2: SKIN, skin1: true, skin2: true, sleeve: 0.45, sc: '#2b2d38', rest: v(-0.3, 0.27, 0.46), pole: v(-1, -0.6, -0.5) }));
    const rk = racket(); rk.rotation.x = 0; c.arms[1].hold.add(rk); c.arms[1].hold.visible = false; c.arms[1].tipL = 0.33; c.arms[1].tipR = 0.12; c.racket = rk;
    // 책상 위 모기채
    const dk = racket(); dk.position.set(-1.05, 0.77, -7.75); dk.rotation.set(-Math.PI / 2, 0, -0.6); c.deskRacket = dk;
    c.idle = function (t) {
      const L = this.arms[0], R = this.arms[1];
      if (!L.busy) L.W.set(0.12 + Math.sin(t * 13) * 0.01, 0.28 + Math.max(0, Math.sin(t * 22)) * 0.012, 0.5);
      if (!R.busy) R.W.set(-0.3 + Math.sin(t * 2.3) * 0.03, 0.27 + Math.max(0, Math.sin(t * 7)) * 0.006, 0.46 + Math.cos(t * 1.7) * 0.02);
      this.head.rotation.x = 0.12 + Math.sin(t * 0.7) * 0.03;
    };
  }

  // 엄마: 부엌에서 도마질. 분홍 반팔 블라우스·앞치마·뽀글 파마
  function buildMom(c) {
    const m = new Maker(c), PANTS = '#6d7fa8';
    [-1, 1].forEach((s) => {
      m.cap(v(s * 0.09, 0.82, 0), v(s * 0.09, 0.45, 0.02), 0.085, PANTS);
      m.cap(v(s * 0.09, 0.45, 0.02), v(s * 0.09, 0.08, 0), 0.065, PANTS);
      m.cap(v(s * 0.09, 0.06, 0.0), v(s * 0.09, 0.07, 0.07), 0.05, SKIN, { skin: true });
      m.sph(v(s * 0.09, 0.03, 0.06), 0.06, 0.03, 0.11, '#ff9ab8');
    });
    // 몸통 한 덩어리: 엉덩이 → 잘록한 허리 → 가슴 → 둥근 어깨. 앞치마는 몸에 칠함(앞쪽 크림 + 허리 빨간 끈)
    const mCol = (x, y, z, cc) => {
      if (y < 0.965) cc.set(PANTS); else cc.set('#e98aa2');
      if (y > 1.03 && y < 1.065) cc.set('#e46a7e');
    };
    m.lathe([[0.79, 0], [0.8, 0.11], [0.85, 0.17], [0.92, 0.18], [0.965, 0.17], [0.975, 0.168], [1.03, 0.145], [1.065, 0.143], [1.14, 0.155], [1.22, 0.165], [1.29, 0.16], [1.34, 0.13], [1.37, 0.08], [1.385, 0]], 0.7, mCol, TOON.M(0, 0, 0.015));
    // 앞치마: 몸 앞쪽 반만 감싸는 크림 천(몸통보다 6mm 바깥)
    { const ap = [[0.84, 0.172], [0.92, 0.186], [0.965, 0.176], [1.03, 0.151]].map((q) => new THREE.Vector2(q[1] + 0.006, q[0]));
      const ag = new THREE.LatheGeometry(ap, 12, -0.95, 1.9); ag.scale(1, 1, 0.7);
      m.geo(ag, '#f6f0e2', TOON.M(0, 0, 0.015), false, 0.02);
      m.geo(new THREE.BoxGeometry(0.05, 0.035, 0.012), '#e46a7e', TOON.M(0, 0.93, 0.15), false, 0); }
    // 블라우스 꽃무늬 점
    for (let i = 0; i < 7; i++) { const a = -1.5 + i * 0.5, y = 1.16 + (i % 3) * 0.05; m.sph(v(Math.sin(a) * 0.162, y, Math.cos(a) * 0.162 * 0.7 + 0.015), 0.014, 0.014, 0.006, '#fff1a8', { prim: false, j: 0, ry: a }); }
    m.cap(v(0, 1.35, 0.02), v(0, 1.42, 0.03), 0.055, SKIN, { skin: true });
    c.head.position.set(0, 1.52, 0.04); c.headC = v(0, 0, 0); const r = 0.11;
    m.sph(v(0, 0, 0), r, r * 1.1, r * 1.02, SKIN, { head: true, skin: true, pr: r, sfn: (n) => n.z > -0.1 && n.y < 0.4 });
    // 뽀글 파마
    const HC = '#3d2a24';
    for (let iy = 0; iy < 5; iy++) for (let ia = 0; ia < 12; ia++) { const b = -0.55 + iy * 0.42, a = (ia / 12) * Math.PI * 2 + iy * 0.3; const x = Math.cos(a) * Math.cos(b), y = Math.sin(b), z = Math.sin(a) * Math.cos(b); if (z > 0.35 && y < 0.62) continue; if (iy === 4 && ia % 3) continue; m.sph(v(x * r * 0.96, y * r * 0.98 + 0.012, z * r * 0.95 - 0.008), 0.03, 0.03, 0.03, HC, { head: true, prim: false, j: 0.12 }); }
    face(m, c, { r, brow: HC, mouth: '#c2304a', cheek: '#f5a0a8', mw: 0.26 });
    m.finish();
    c.arms.push(new Arm(c, { name: 'L', S: v(0.17, 1.28, 0.015), L1: 0.25, L2: 0.23, r1: 0.054, r2: 0.048, hr: 0.054, c1: SKIN, c2: SKIN, skin1: true, skin2: true, sleeve: 0.5, sc: '#e98aa2', rest: v(0.13, 0.96, 0.42), pole: v(1, -0.5, -0.6) }));
    c.arms.push(new Arm(c, { name: 'R', S: v(-0.17, 1.28, 0.015), L1: 0.25, L2: 0.23, r1: 0.054, r2: 0.048, hr: 0.054, c1: SKIN, c2: SKIN, skin1: true, skin2: true, sleeve: 0.5, sc: '#e98aa2', rest: v(-0.1, 0.98, 0.45), pole: v(-1, -0.5, -0.6) }));
    const knife = new THREE.Group(); const kb = TOON.mesh(new THREE.BoxGeometry(0.008, 0.16, 0.05), '#d9dde2'); kb.position.set(0, 0.1, 0.02); knife.add(kb); const kh = TOON.mesh(new THREE.BoxGeometry(0.02, 0.08, 0.025), '#3a2a24'); kh.position.y = -0.01; knife.add(kh);
    knife.rotation.x = Math.PI / 2; c.arms[1].hold.add(knife); c.knife = knife;
    const can = sprayCan(); c.arms[1].hold.add(can); can.visible = false; c.can = can;
    const cc = sprayCan(); cc.position.set(-5.6, 0.92, -1.95); c.counterCan = cc;
    c.idle = function (t) {
      const L = this.arms[0], R = this.arms[1];
      if (!R.busy) R.W.set(-0.1, 0.98 + Math.max(0, Math.sin(t * 9)) * 0.07, 0.38 + Math.sin(t * 0.8) * 0.03);
      if (!L.busy) L.W.set(0.13, 0.96, 0.36 + Math.sin(t * 0.8) * 0.03);
      this.head.rotation.x = 0.35 + Math.sin(t * 1.1) * 0.04; this.head.rotation.z = Math.sin(t * 1.9) * 0.06;
    };
  }

  // 아빠: 소파에 누워 TV. 흰 런닝셔츠·파란 땡땡이 트렁크·볼록 배
  function buildDad(c) {
    const m = new Maker(c);
    const dots = (x, y, z, cc) => cc.set('#3a69b8'); m.sph(v(0.25, 0.11, 0), 0.17, 0.12, 0.19, dots);
    for (let i = 0; i < 10; i++) { const a = i * 2.4, b = (i % 3) * 0.5 - 0.4; m.sph(v(0.25 + Math.cos(a) * 0.15 * Math.cos(b), 0.11 + Math.sin(b) * 0.1 + 0.03, Math.sin(a) * 0.17 * Math.cos(b)), 0.014, 0.014, 0.014, '#ffffff', { prim: false, j: 0 }); }
    // 누운 몸통 한 덩어리(엉덩이 → 볼록 배 → 가슴 → 어깨). 런닝셔츠라 어깨·겨드랑이 살이 보임
    const dCol = (x, y, z, cc) => { cc.set(y < 0.22 ? '#3a69b8' : '#f4f4ef'); if (y > 0.7 && Math.abs(z) > 0.11) cc.set(SKIN); if (y > 0.78 && Math.abs(z) < 0.07) cc.set(SKIN); };
    m.lathe([[0, 0], [0.02, 0.15], [0.1, 0.18], [0.22, 0.2], [0.34, 0.215], [0.46, 0.21], [0.58, 0.2], [0.7, 0.2], [0.78, 0.17], [0.83, 0.1], [0.85, 0]], 0.92, dCol, TOON.M(0.42, 0.17, 0, 0, 0, Math.PI / 2).multiply(TOON.M(0, 0, 0, 0, 0, 0, 0.85, 1, 1)));
    m.sph(v(-0.02, 0.27, 0), 0.2, 0.08, 0.16, '#f4f4ef', { prim: false }); // 볼록 배
    m.cap(v(-0.43, 0.2, 0), v(-0.55, 0.22, 0), 0.062, SKIN, { skin: true });
    [-1, 1].forEach((s) => {
      m.cap(v(0.35, 0.1, s * 0.1), v(0.72, 0.12, s * 0.11), 0.085, SKIN, { skin: true, cov: [0, 0.32] });
      m.cap(v(0.35, 0.1, s * 0.1), v(0.47, 0.105, s * 0.105), 0.095, '#3a69b8', { prim: false });
      m.cap(v(0.72, 0.12, s * 0.11), v(1.04, 0.07, s * 0.12), 0.062, SKIN, { skin: true });
      m.sph(v(1.08, 0.14, s * 0.12), 0.04, 0.08, 0.05, SKIN, { skin: true });
      // 다리털
      for (let k = 0; k < 4; k++) m.geo(new THREE.BoxGeometry(0.03, 0.004, 0.004), '#3a2a24', TOON.M(0.78 + k * 0.06, 0.18, s * 0.11 + (k % 2 ? 0.02 : -0.02), 0, 0.4, 0.3), false, 0);
    });
    // 머리: 옆으로 누워 TV(+z)를 봄. 머리 꼭대기가 -x
    c.head.position.set(-0.68, 0.28, 0.02); c.head.rotation.set(0, 0, Math.PI / 2 * 0.85); c.headC = v(0, 0, 0); const r = 0.135;
    m.sph(v(0, 0, 0), r, r * 1.05, r * 1.05, SKIN, { head: true, skin: true, pr: r, sfn: (n) => n.z > -0.2 });
    m.sph(v(0, r * 0.2, -r * 0.35), r * 1.02, r * 0.75, r * 0.8, '#2b2420', { head: true, prim: false });
    [-1, 1].forEach((s) => m.geo(new THREE.BoxGeometry(0.004, 0.09, 0.004), '#2b2420', TOON.M(s * 0.03, r * 0.95, r * 0.2, 0.9, 0, s * 0.4), true, 0));
    face(m, c, { r, brow: '#2b2420', browT: 0.1, mouth: '#7a2e34', mw: 0.35 });
    m.finish();
    // 팔 A(TV 쪽): 리모컨을 배 위에, 팔 B: 머리 밑
    c.arms.push(new Arm(c, { name: 'A', S: v(-0.36, 0.22, 0.2), L1: 0.29, L2: 0.27, r1: 0.06, r2: 0.053, hr: 0.058, c1: SKIN, c2: SKIN, skin1: true, skin2: true, rest: v(0.02, 0.36, 0.12), pole: v(0.2, 0.3, 1) }));
    c.arms.push(new Arm(c, { name: 'B', S: v(-0.36, 0.22, -0.2), L1: 0.29, L2: 0.27, r1: 0.06, r2: 0.053, hr: 0.058, c1: SKIN, c2: SKIN, skin1: true, skin2: true, rest: v(-0.74, 0.32, -0.05), pole: v(0.6, 0.6, -0.4) }));
    const rem = TOON.mesh(new THREE.BoxGeometry(0.04, 0.14, 0.02), '#2a2a30'); rem.position.y = 0.05; c.arms[0].hold.add(rem); c.remote = rem;
    c.idle = function (t) {
      const A = this.arms[0], B = this.arms[1];
      const sc = Math.sin(t * 0.37) > 0.82; // 가끔 배 긁기
      if (!A.busy) A.W.set(sc ? 0.0 + Math.sin(t * 14) * 0.04 : 0.02, sc ? 0.4 : 0.36, sc ? 0.0 : 0.12);
      if (!B.busy) B.W.set(-0.74, 0.32, -0.05);
      this.bodyMesh.position.y = Math.max(0, Math.sin(t * 6)) * (Math.sin(t * 0.5) > 0.7 ? 0.012 : 0); // TV 보고 웃음
    };
  }

  // 할아버지: 방석에 책상다리, 신문. 흰 모시 적삼·대머리·흰 수염·안경
  function buildGrandpa(c) {
    const m = new Maker(c), PANTS = '#8c8a7a', SH = '#efeee6';
    const gCol = (x, y, z, cc) => cc.set(y < 0.145 ? PANTS : SH);
    m.lathe([[0.03, 0], [0.04, 0.14], [0.1, 0.19], [0.145, 0.186], [0.155, 0.184], [0.18, 0.18], [0.27, 0.16], [0.36, 0.155], [0.44, 0.16], [0.5, 0.145], [0.54, 0.1], [0.565, 0.05], [0.57, 0]], 0.74, gCol, TOON.M(0, 0, 0.0, 0.22, 0, 0));
    [-1, 1].forEach((s) => {
      m.cap(v(s * 0.1, 0.1, 0.02), v(s * 0.32, 0.1, 0.2), 0.08, PANTS);
      m.cap(v(s * 0.32, 0.09, 0.22), v(-s * 0.08, 0.07, 0.3), 0.06, PANTS);
      m.sph(v(-s * 0.15, 0.07, 0.3), 0.045, 0.04, 0.085, SKINO, { skin: true, ry: s * 0.6 });
    });
    // 적삼 고름
    m.geo(new THREE.BoxGeometry(0.02, 0.14, 0.01), '#d9d6c6', TOON.M(0.04, 0.38, 0.12, 0.22, 0, -0.2), false, 0);
    m.cap(v(0, 0.58, 0.09), v(0, 0.65, 0.11), 0.048, SKINO, { skin: true });
    c.head.position.set(0, 0.76, 0.13); c.headC = v(0, 0, 0); const r = 0.112;
    m.sph(v(0, 0, 0), r, r * 1.08, r * 1.02, SKINO, { head: true, skin: true, pr: r });
    // 반짝 대머리 빛
    m.sph(v(-0.02, r * 0.86, r * 0.25), r * 0.22, r * 0.06, r * 0.14, '#fff2dc', { head: true, prim: false, j: 0 });
    // 옆·뒤 흰 머리
    // 옆·뒤 흰 머리: 귀 위 옆머리 두 뭉치 + 뒤통수 아래 한 줄(정수리는 반짝 대머리)
    [-1, 1].forEach((sd) => m.sph(v(sd * r * 0.9, -r * 0.05, -r * 0.12), r * 0.2, r * 0.32, r * 0.42, '#f4f2ea', { head: true, prim: false, j: 0.05, rz: sd * 0.25 }));
    m.sph(v(0, -r * 0.28, -r * 0.8), r * 0.72, r * 0.26, r * 0.3, '#f4f2ea', { head: true, prim: false, j: 0.05, rx: 0.5 });
    face(m, c, { r, brow: '#f4f2ea', browT: 0.25, mouth: false, nose: '#d39c78' });
    m.sph(v(0, -r * 0.4, r * 0.86), r * 0.4, r * 0.13, r * 0.14, '#f4f2ea', { head: true, prim: false, j: 0 });
    [-1, 1].forEach((s) => m.geo(new THREE.TorusGeometry(r * 0.2, 0.004, 4, 16), '#2a2420', TOON.M(s * r * 0.36, 0.012, r * 1.0), true, 0));
    m.geo(new THREE.BoxGeometry(r * 0.25, 0.004, 0.004), '#2a2420', TOON.M(0, 0.016, r * 1.0), true, 0);
    m.finish();
    c.arms.push(new Arm(c, { name: 'L', S: v(0.175, 0.47, 0.1), L1: 0.26, L2: 0.24, r1: 0.05, r2: 0.044, hr: 0.042, c1: SKINO, c2: SKINO, skin1: true, skin2: true, sleeve: 0.55, sc: SH, rest: v(0.17, 0.43, 0.4), pole: v(1, -0.7, -0.2) }));
    c.arms.push(new Arm(c, { name: 'R', S: v(-0.175, 0.47, 0.1), L1: 0.26, L2: 0.24, r1: 0.05, r2: 0.044, hr: 0.042, c1: SKINO, c2: SKINO, skin1: true, skin2: true, sleeve: 0.55, sc: SH, rest: v(-0.17, 0.43, 0.4), pole: v(-1, -0.7, -0.2) }));
    // 신문(두 손 사이)
    const npTex = (() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const g = cv.getContext('2d'); g.fillStyle = '#efe9da'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#2a2420'; g.fillRect(8, 6, 112, 12); for (let y = 26; y < 92; y += 6) { g.fillRect(8, y, 52, 2); g.fillRect(68, y, 52, 2); } g.fillStyle = '#8a8070'; g.fillRect(68, 26, 52, 30); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    // 펼친 신문: 가운데 접힌 두 쪽이 할아버지 쪽으로 살짝 V 자로 꺾임, 두 손은 바깥 가장자리를 쥠
    const np = new THREE.Group(); c.root.add(np); c.news = np;
    c.newsEdge = [];
    [-1, 1].forEach((sd) => {
      const t2 = npTex.clone(); t2.needsUpdate = true; t2.repeat.set(0.5, 1); t2.offset.set(sd < 0 ? 0 : 0.5, 0);
      const hinge = new THREE.Group(); hinge.rotation.y = sd * -0.32; np.add(hinge);
      const g = new THREE.PlaneGeometry(0.22, 0.32); g.translate(sd * 0.11, 0, 0);
      const pm = new THREE.Mesh(g, TOON.mat({ map: t2, side: THREE.DoubleSide })); pm.castShadow = true; hinge.add(pm);
      // 종이 테두리 선
      const eg = new THREE.EdgesGeometry(g); const el = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: '#3a3026' })); hinge.add(el);
      const edge = new THREE.Object3D(); edge.position.set(sd * 0.212, -0.06, 0); hinge.add(edge); c.newsEdge.push(edge);
    });
    np.position.set(0, 0.5, 0.35); np.rotation.set(-0.3, 0, 0);
    const sw = swatter(); c.arms[1].hold.add(sw); c.arms[1].hold.visible = false; c.arms[1].tipL = 0.47; c.arms[1].tipR = 0.09; c.sw = sw;
    const fl = swatter(); fl.position.set(-0.38, 0.012, 0.15); fl.rotation.set(-Math.PI / 2, 0, 0.4); c.root.add(fl); c.floorSw = fl;
    c.idle = function (t) {
      const L = this.arms[0], R = this.arms[1];
      this.head.rotation.x = 0.28 + Math.sin(t * 0.4) * 0.03;
      const show = !L.busy && !R.busy; this.news.visible = show;
      if (show) {
        // 신문이 살짝 흔들림(숨·페이지 넘기기), 손목은 가장자리 바로 뒤(손이 종이 끝을 감싸 쥠)
        this.news.position.set(0, 0.5 + Math.sin(t * 0.6) * 0.008, 0.35); this.news.rotation.set(-0.3 + Math.sin(t * 0.5) * 0.02, 0, Math.sin(t * 0.37) * 0.02);
        this.news.updateMatrixWorld(true);
        const inv = this.root.matrixWorld.clone().invert();
        [L, R].forEach((a, i) => { const e = this.newsEdge[i === 0 ? 1 : 0]; e.getWorldPosition(a.W); a.W.applyMatrix4(inv); a.W.z -= a.hr * 0.4; a.W.y -= a.hr * 0.3; });
      } else {
        if (!L.busy) L.W.set(0.17, 0.43, 0.38);
        if (!R.busy) R.W.set(-0.17, 0.43, 0.38);
      }
    };
  }

  // 아기: 아기침대에 누워 잠. 노란 배냇옷·기저귀·쪽쪽이
  function buildBaby(c) {
    const m = new Maker(c);
    m.sph(v(0, 0.08, 0.02), 0.12, 0.085, 0.16, '#ffd95a');
    m.sph(v(0, 0.07, 0.15), 0.1, 0.07, 0.08, '#ffffff');
    [-1, 1].forEach((s) => {
      m.cap(v(s * 0.06, 0.06, 0.16), v(s * 0.11, 0.12, 0.26), 0.045, SKIN, { skin: true });
      m.cap(v(s * 0.11, 0.12, 0.26), v(s * 0.09, 0.07, 0.34), 0.04, SKIN, { skin: true });
      m.sph(v(s * 0.09, 0.07, 0.37), 0.035, 0.03, 0.045, SKIN, { skin: true });
    });
    // 머리: 얼굴이 위(+y). 머리 좌표 앞 +z 가 위를 보게 x 축 -90°
    c.head.position.set(0, 0.1, -0.2); c.head.rotation.x = -Math.PI / 2; c.headC = v(0, 0, 0); const r = 0.1;
    m.sph(v(0, 0, 0), r, r * 1.05, r, SKIN, { head: true, skin: true, pr: r });
    m.geo(new THREE.ConeGeometry(0.012, 0.05, 5), '#6a4a3a', TOON.M(0, r * 0.4, r * 0.85, 1.2, 0, 0), true, 0);
    face(m, c, { r, closed: true, mouth: false, cheek: '#f7a0a8', ey: 0.0 });
    m.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 12), '#7ec8f2', TOON.M(0, -r * 0.45, r * 0.98, Math.PI / 2, 0, 0), true, 0);
    m.geo(new THREE.TorusGeometry(0.014, 0.004, 4, 10), '#ffffff', TOON.M(0, -r * 0.45, r * 1.05), true, 0);
    m.finish();
    c.arms.push(new Arm(c, { name: 'L', S: v(0.11, 0.1, -0.08), L1: 0.1, L2: 0.09, r1: 0.035, r2: 0.033, hr: 0.034, c1: '#ffd95a', c2: SKIN, skin1: false, skin2: true, rest: v(0.18, 0.12, -0.22), pole: v(1, 0.4, 0.3) }));
    c.arms.push(new Arm(c, { name: 'R', S: v(-0.11, 0.1, -0.08), L1: 0.1, L2: 0.09, r1: 0.035, r2: 0.033, hr: 0.034, c1: '#ffd95a', c2: SKIN, skin1: false, skin2: true, rest: v(-0.18, 0.12, -0.22), pole: v(-1, 0.4, 0.3) }));
    c.idle = function (t) {
      const L = this.arms[0], R = this.arms[1];
      if (!L.busy) L.W.set(0.18, 0.12 + Math.sin(t * 0.9) * 0.01, -0.22);
      if (!R.busy) R.W.set(-0.18, 0.12 + Math.sin(t * 0.9 + 1) * 0.01, -0.22);
      this.bodyMesh.scale.y = 1 + Math.sin(t * 2.2) * 0.03;
    };
  }

  // 고양이: 창가 쿠션에 동그랗게 말려 자는 치즈냥(앞발에 턱을 괴고, 꼬리로 몸을 감음)
  function buildCat(c) {
    const m = new Maker(c), OR = '#f2a447', OD = '#c8692a', CR = '#fff3e2', PK = '#f48ea0', INK = '#3a2418';
    // 줄무늬: 등 위쪽만, 척추(x)를 가로지르는 띠, 배 쪽은 크림
    const tabby = (x, y, z, cc) => { cc.set(OR); if (y < 0.045) cc.set('#f6cf95'); else if (Math.floor((x + Math.sin(z * 18) * 0.012 + 1) / 0.034) % 2 === 0 && y > 0.07) cc.set(OD); }; tabby.pv = 1;
    m.sph(v(-0.02, 0.085, 0), 0.165, 0.095, 0.125, tabby);
    // 뒷다리 허벅지·발
    m.sph(v(-0.08, 0.07, 0.085), 0.065, 0.05, 0.055, tabby);
    m.sph(v(-0.03, 0.026, 0.14), 0.034, 0.022, 0.045, CR);
    // 꼬리: 몸 앞을 감아 돌고 끝은 크림
    const tp = [v(-0.17, 0.06, -0.05), v(-0.19, 0.045, 0.06), v(-0.12, 0.035, 0.15), v(-0.02, 0.032, 0.19), v(0.06, 0.03, 0.2)];
    const tcol = (x, y, z, cc) => cc.set(Math.floor((x * 0.7 + z + 1) / 0.04) % 2 ? OR : OD); tcol.pv = 1;
    for (let i = 0; i < 4; i++) m.cap(tp[i], tp[i + 1], 0.029 - i * 0.002, tcol, { j: 0.02 });
    m.sph(v(0.075, 0.03, 0.2), 0.026, 0.022, 0.03, OD);
    // 앞발 하나(움직이지 않는 쪽): 하얀 장갑
    m.sph(v(0.06, 0.026, 0.165), 0.03, 0.022, 0.04, CR);
    // 머리: 앞발 위에 턱을 괴고 방 쪽을 봄
    c.head.position.set(0.125, 0.11, 0.125); c.head.rotation.set(0.08, 0.3, 0.16); c.headC = v(0, 0, 0); const r = 0.068;
    m.sph(v(0, 0, 0), r * 1.18, r, r * 1.02, OR, { head: true });
    // 이마 M 무늬
    [[-0.02, 0.25], [0, 0], [0.02, -0.25]].forEach((q) => m.geo(new THREE.BoxGeometry(0.006, 0.03, 0.004), OD, TOON.M(q[0], r * 0.82, r * 0.5, -1.0, 0, q[1]), true, 0));
    // 볼 털·주둥이·턱(크림)
    [-1, 1].forEach((s) => m.sph(v(s * r * 0.62, -r * 0.3, r * 0.55), r * 0.42, r * 0.34, r * 0.34, CR, { head: true }));
    [-1, 1].forEach((s) => m.sph(v(s * r * 0.24, -r * 0.3, r * 0.86), r * 0.3, r * 0.24, r * 0.22, CR, { head: true }));
    m.sph(v(0, -r * 0.52, r * 0.74), r * 0.24, r * 0.16, r * 0.18, CR, { head: true });
    // 분홍 코(역삼각)·ω 입
    m.geo(new THREE.ConeGeometry(r * 0.13, r * 0.12, 3), PK, TOON.M(0, -r * 0.13, r * 1.0, Math.PI / 2 + 0.3, 0, Math.PI), true, 0);
    [-1, 1].forEach((s) => m.geo(new THREE.TorusGeometry(r * 0.1, r * 0.022, 4, 10, Math.PI), INK, TOON.M(s * r * 0.1, -r * 0.3, r * 1.0, 0, 0, Math.PI), true, 0));
    // 감은 눈(아래로 휜 선)
    [-1, 1].forEach((s) => m.geo(new THREE.TorusGeometry(r * 0.17, r * 0.045, 4, 12, Math.PI * 0.85), INK, TOON.M(s * r * 0.4, r * 0.08, r * 0.99, 0, s * 0.35, Math.PI + Math.PI * 0.075), true, 0));
    // 수염 셋씩(짙은 가는 선)
    [-1, 1].forEach((s) => [-0.12, 0, 0.12].forEach((a, k) => m.geo(new THREE.CylinderGeometry(0.0011, 0.0011, r * 1.1, 4), '#5a4030', TOON.M(s * r * 0.95, -r * 0.3 + k * 0.004, r * 0.75, 0, 0, s * (Math.PI / 2 + a)), true, 0)));
    // 귀: 납작한 삼각뿔, 안쪽 분홍
    [-1, 1].forEach((s) => {
      m.geo(new THREE.ConeGeometry(r * 0.5, r * 0.8, 3), OR, TOON.M(s * r * 0.62, r * 0.88, -r * 0.05, -0.15, 0, -s * 0.38).multiply(TOON.M(0, 0, 0, 0, 0, 0, 1, 1, 0.55)), true, 0.02);
      m.geo(new THREE.ConeGeometry(r * 0.32, r * 0.55, 3), PK, TOON.M(s * r * 0.6, r * 0.84, r * 0.08, -0.15, 0, -s * 0.38).multiply(TOON.M(0, 0, 0, 0, 0, 0, 1, 1, 0.4)), true, 0);
      c.prims.push({ grp: 'head', a: v(s * r * 0.6, r * 0.75, 0), b: v(s * r * 0.62, r * 1.05, 0), r: r * 0.2, skin: true, solid: true });
    });
    m.finish();
    // 휘두르는 앞발: 짧은 팔은 몸속에, 하얀 장갑 발만 턱 밑에 보임
    c.arms.push(new Arm(c, { name: 'P', S: v(0.08, 0.06, 0.07), L1: 0.055, L2: 0.06, r1: 0.026, r2: 0.024, hr: 0.028, c1: OR, c2: OR, ch: CR, skin1: true, skin2: true, rest: v(0.14, 0.03, 0.17), pole: v(0.3, 1, 0), hs: [1, 0.75, 1.35] }));
    const pad = TOON.mesh(new THREE.SphereGeometry(0.009, 8, 6), PK, false); pad.position.set(0, -0.018, 0.012); c.arms[0].hand.add(pad);
    c.idle = function (t) {
      const P0 = this.arms[0];
      if (!P0.busy) P0.W.set(0.14, 0.03, 0.17);
      const b = Math.sin(t * 1.6);
      this.bodyMesh.scale.set(1 + b * 0.015, 1 + b * 0.035, 1 + b * 0.01);
      this.head.rotation.x += b * 0.02;
    };
  }

  // 강아지: 방석에 엎드려 앞발에 턱을 괸 흰 진돗개(빨간 목걸이)
  function buildDog(c) {
    const m = new Maker(c), WH = '#f6f1e6', WD = '#e3d6c0', PK = '#f2a7b0', INK = '#2a1f1a';
    const fur = (x, y, z, cc) => { cc.set(WH); if (y < 0.04) cc.set(WD); }; fur.pv = 1;
    // 몸통(척추 x, 머리 +x)
    m.sph(v(0, 0.1, 0), 0.25, 0.1, 0.13, fur);
    m.sph(v(0.14, 0.11, 0), 0.12, 0.105, 0.12, fur);
    // 뒷다리: 접은 허벅지 + 앞으로 나온 발
    [-1, 1].forEach((s) => { m.sph(v(-0.13, 0.08, s * 0.1), 0.085, 0.065, 0.05, fur); m.sph(v(-0.04, 0.025, s * 0.125), 0.05, 0.025, 0.035, WD); });
    // 말린 꼬리(등 위)
    m.geo(new THREE.TorusGeometry(0.05, 0.026, 8, 18), WH, TOON.M(-0.24, 0.19, 0, 0, Math.PI / 2, 0.5), false, 0.02);
    c.prims.push({ grp: 'body', a: v(-0.27, 0.16, 0), b: v(-0.21, 0.22, 0), r: 0.04, skin: true, solid: true });
    // 오른 앞발(가만히): 앞으로 뻗음
    m.cap(v(0.18, 0.05, -0.065), v(0.36, 0.028, -0.07), 0.033, fur);
    m.sph(v(0.38, 0.026, -0.07), 0.04, 0.026, 0.036, WD);
    // 빨간 목걸이 + 금빛 이름표
    m.geo(new THREE.TorusGeometry(0.085, 0.012, 6, 20), '#d6322e', TOON.M(0.235, 0.12, 0, 0, Math.PI / 2, -0.35), false, 0);
    m.sph(v(0.27, 0.06, 0), 0.016, 0.016, 0.006, '#f2c230', { j: 0 });
    // 머리: 앞발 위에 턱, 얼굴은 +x
    c.head.position.set(0.31, 0.11, 0.0); c.head.rotation.set(0, Math.PI / 2, 0.12); c.headC = v(0, 0, 0); const r = 0.09;
    m.sph(v(0, 0, 0), r * 1.05, r * 0.95, r, WH, { head: true });
    m.cap(v(0, -r * 0.3, r * 0.45), v(0, -r * 0.38, r * 1.15), r * 0.4, WH, { head: true });
    m.sph(v(0, -r * 0.55, r * 0.95), r * 0.34, r * 0.16, r * 0.3, WD, { head: true });
    m.sph(v(0, -r * 0.2, r * 1.55), r * 0.17, r * 0.13, r * 0.12, INK, { head: true });
    m.sph(v(-r * 0.06, -r * 0.14, r * 1.62), r * 0.05, r * 0.035, r * 0.03, '#ffffff', { head: true, prim: false, j: 0 });
    [-1, 1].forEach((s) => {
      // 쫑긋 선 귀
      m.geo(new THREE.ConeGeometry(r * 0.36, r * 0.75, 3), WH, TOON.M(s * r * 0.52, r * 0.92, -r * 0.12, -0.2, 0, -s * 0.25).multiply(TOON.M(0, 0, 0, 0, 0, 0, 1, 1, 0.55)), true, 0.02);
      m.geo(new THREE.ConeGeometry(r * 0.22, r * 0.5, 3), PK, TOON.M(s * r * 0.5, r * 0.88, -r * 0.03, -0.2, 0, -s * 0.25).multiply(TOON.M(0, 0, 0, 0, 0, 0, 1, 1, 0.4)), true, 0);
      c.prims.push({ grp: 'head', a: v(s * r * 0.5, r * 0.75, -r * 0.1), b: v(s * r * 0.56, r * 1.15, -r * 0.12), r: r * 0.18, skin: true, solid: true });
      // 감은 눈 + 눈썹 점(진돗개 느낌)
      m.geo(new THREE.TorusGeometry(r * 0.16, r * 0.045, 4, 12, Math.PI * 0.85), INK, TOON.M(s * r * 0.36, r * 0.16, r * 0.95, 0, s * 0.38, Math.PI + Math.PI * 0.075), true, 0);
      m.sph(v(s * r * 0.33, r * 0.42, r * 0.9), r * 0.08, r * 0.05, r * 0.03, '#d9b27a', { head: true, prim: false, j: 0 });
    });
    m.geo(new THREE.TorusGeometry(r * 0.1, r * 0.022, 4, 10, Math.PI), INK, TOON.M(0, -r * 0.48, r * 1.42, 0, 0, Math.PI), true, 0);
    m.finish();
    // 휘두르는 왼 앞발(머리 옆으로 뻗어 있다가 휙)
    c.arms.push(new Arm(c, { name: 'P', S: v(0.18, 0.06, 0.065), L1: 0.11, L2: 0.1, r1: 0.036, r2: 0.032, hr: 0.04, c1: WH, c2: WH, ch: WD, rest: v(0.36, 0.028, 0.075), pole: v(0, 1, 0.4), hs: [1, 0.65, 1.1] }));
    c.snapHead = true;
    c.idle = function (t) {
      const P0 = this.arms[0];
      if (!P0.busy) P0.W.set(0.36 + Math.max(0, Math.sin(t * 7)) * (Math.sin(t * 0.4) > 0.85 ? 0.02 : 0), 0.028, 0.075);
      this.bodyMesh.scale.y = 1 + Math.sin(t * 2.4) * 0.03;
    };
  }

  const BUILD = { cat: buildCat, dog: buildDog, baby: buildBaby, teen: buildTeen, mom: buildMom, dad: buildDad, grandpa: buildGrandpa };

  P.build = function (scene) {
    WORLD.spots.mom.yaw = -Math.PI / 2;
    DATA.ORDER.forEach((id) => {
      const c = new Char(id); BUILD[id](c);
      // 고양이·강아지는 털 위 어디든 물 수 있음
      if (id === 'cat' || id === 'dog') c.prims.forEach((p) => { p.skin = true; p.cov = null; p.sfn = null; });
      c.headBase.copy(c.head.quaternion); c.headPos.copy(c.head.position);
      scene.add(c.root);
      if (c.deskRacket) scene.add(c.deskRacket);
      if (c.counterCan) scene.add(c.counterCan);
      c.arms.forEach((a) => a.solve());
      P.list.push(c); P.by[id] = c;
    });
    // 물린 자국(부푼 분홍 점) 하나를 돌려 씀
    P.bumpGeo = TOON.onrm(new THREE.SphereGeometry(0.009, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)); P.bumpGeo.translate(0, -0.0015, 0); P.bumpMat = TOON.mat({ color: '#f0848a' });
    // 간지러움 표시(짧은 물결 셋)
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    g.strokeStyle = '#1c1426'; g.lineWidth = 5; g.lineCap = 'round';
    [[14, 40], [32, 30], [50, 40]].forEach((p, i) => { g.beginPath(); g.moveTo(p[0] - 6, p[1] + 14); g.quadraticCurveTo(p[0] + 6, p[1] + 6, p[0] - 4, p[1] - 2); g.quadraticCurveTo(p[0] - 10, p[1] - 10, p[0] + 2, p[1] - 18); g.stroke(); });
    P.itchMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false });
    P.list.forEach((c) => { const s = new THREE.Sprite(P.itchMat); s.scale.setScalar(0.08); s.visible = false; s.renderOrder = 5; scene.add(s); c.itchS = s; });
    // 위험 고리(겹눈 카드)
    P.ring = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.09, 24), new THREE.MeshBasicMaterial({ color: '#ff3048', transparent: true, opacity: 0.8, depthTest: false, side: THREE.DoubleSide }));
    P.ring.renderOrder = 6; P.ring.visible = false; scene.add(P.ring);
  };

  // ---------- 살 찾기 ----------
  // p 가장 가까운 살(또는 몸) 자리. 돌려줌: {c, pr, d(겉면까지), pt(겉면 점), n(법선), skin}
  const res = { c: null, pr: null, d: 1e9, pt: new V3(), n: new V3(), skin: false };
  const _A = new V3(), _B = new V3(), _P = new V3(), _N = new V3(), _L = new V3();
  P.fr = 0;
  const _E = new V3(), _F = new V3();
  P.primInfo = function (pr, p, outPt, outN) {
    if (pr.ell) {
      // 타원: 노드 좌표 → 타원 좌표에서 단위구로 펴서 겉면 점·법선을 근사
      const nd = pr.node; if (nd.userData.invF !== P.fr) { nd.userData.inv = (nd.userData.inv || new THREE.Matrix4()).copy(nd.matrixWorld).invert(); nd.userData.invF = P.fr; }
      _E.copy(p).applyMatrix4(nd.userData.inv).sub(pr.a).applyQuaternion(pr.eqi);
      _F.set(_E.x / pr.ell.x, _E.y / pr.ell.y, _E.z / pr.ell.z); let k = _F.length(); if (k < 1e-6) { _F.set(0, 1, 0); k = 1e-6; }
      _F.multiplyScalar(1 / k); // 단위구 위 방향
      _P.set(_F.x * pr.ell.x, _F.y * pr.ell.y, _F.z * pr.ell.z); // 타원 겉면(타원 좌표)
      _N.set(_F.x / pr.ell.x, _F.y / pr.ell.y, _F.z / pr.ell.z).normalize();
      const dl = _E.distanceTo(_P) * (k < 1 ? -1 : 1);
      _L.copy(_N).applyQuaternion(pr.eq); // 노드 좌표 법선
      let skin = pr.skin; if (skin && pr.sfn) skin = pr.sfn(_L);
      if (outPt) outPt.copy(_P).applyQuaternion(pr.eq).add(pr.a).applyMatrix4(nd.matrixWorld);
      if (outN) outN.copy(_L).transformDirection(nd.matrixWorld);
      return { d: dl, skin, t: 0 };
    }
    _A.copy(pr.a).applyMatrix4(pr.node.matrixWorld); _B.copy(pr.b).applyMatrix4(pr.node.matrixWorld);
    _d.subVectors(_B, _A); const ll = _d.lengthSq();
    let t = ll > 1e-9 ? Math.min(1, Math.max(0, _P.subVectors(p, _A).dot(_d) / ll)) : 0;
    _c.copy(_A).addScaledVector(_d, t);
    _N.subVectors(p, _c); let dist = _N.length(); if (dist < 1e-6) { _N.set(0, 1, 0); dist = 1e-6; } _N.multiplyScalar(1 / dist);
    if (outPt) outPt.copy(_c).addScaledVector(_N, pr.r);
    if (outN) outN.copy(_N);
    let skin = pr.skin;
    if (skin && pr.cov && t >= pr.cov[0] && t <= pr.cov[1]) skin = false;
    if (skin && pr.sfn) { _L.copy(_N).applyQuaternion(_q.setFromRotationMatrix(pr.node.matrixWorld).invert()); skin = pr.sfn(_L); }
    return { d: dist - pr.r, skin, t };
  };
  P.nearest = function (p, maxD, onlyId, skinOnly, skipDone) {
    res.c = null; res.d = 1e9;
    for (const c of P.list) {
      if (onlyId && c.id !== onlyId) continue;
      if (skipDone && c.done) continue;
      if (c.root.position.distanceToSquared(p) > 2.6) continue;
      for (const pr of c.prims) {
        const i = P.primInfo(pr, p, _a, _b);
        if (skinOnly && !i.skin) continue;
        if (i.d < res.d && i.d < maxD) { res.c = c; res.pr = pr; res.d = i.d; res.pt.copy(_a); res.n.copy(_b); res.skin = i.skin; }
      }
    }
    return res.c ? res : null;
  };
  // 모기를 몸 밖으로 밀어냄
  P.push = function (p, r, vel, skip) {
    for (const c of P.list) {
      if (c.root.position.distanceToSquared(p) > 2.6) continue;
      for (const pr of c.prims) {
        if (!pr.solid || pr === skip) continue;
        const i = P.primInfo(pr, p, _a, _b);
        if (i.d < r) { p.addScaledVector(_b, r - i.d); if (vel) { const vn = vel.dot(_b); if (vn < 0) vel.addScaledVector(_b, -vn); } }
      }
    }
  };

  // 카메라 팔이 몸속으로 들어가지 않게: a→b 를 열 번 짚어 처음 몸에 닿는 비율
  const _s = new V3();
  P.rayBody = function (a, b, pad) {
    const near = P.list.filter((c) => c.root.visible && c.root.position.distanceToSquared(a) < 2.6);
    if (!near.length) return 1;
    for (let i = 1; i <= 10; i++) {
      const t = i / 10; _s.lerpVectors(a, b, t);
      for (const c of near) for (const pr of c.prims) { if (P.primInfo(pr, _s, null, null).d < pad) return Math.max(0, t - 0.1); }
    }
    return 1;
  };
  // 물린 자리 부기: 꽂는 순간 생겨 간지러울수록 커짐, 떼면 남음
  Char.prototype.newBump = function (pr, worldPt) {
    const b = new THREE.Mesh(P.bumpGeo, P.bumpMat); b.scale.set(0.3, 0.15, 0.3);
    pr.node.add(b); b.position.copy(pr.node.worldToLocal(worldPt.clone()));
    // 살 바깥을 향해 눕힘
    // 살 결에 수직으로: 캡슐 축 위 가장 가까운 점에서 바깥으로
    _d.subVectors(pr.b, pr.a); const ll = _d.lengthSq(), tt = ll > 1e-9 ? Math.min(1, Math.max(0, _a.subVectors(b.position, pr.a).dot(_d) / ll)) : 0;
    const n = new V3().subVectors(b.position, _c.copy(pr.a).addScaledVector(_d, tt)); if (n.lengthSq() > 1e-8) b.quaternion.setFromUnitVectors(Y, n.normalize());
    return b;
  };
  Char.prototype.keepBump = function (b) { b.scale.multiplyScalar(0.85); this.bumps.push(b); if (this.bumps.length > 10) { const o = this.bumps.shift(); o.parent && o.parent.remove(o); } };
  Char.prototype.dropBump = function (b) { b.parent && b.parent.remove(b); };
  Char.prototype.reset = function () {
    this.itch = 0; this.annoy = 0; this.alert = 0; this.blood = 0; this.done = false; this.act = null; this.cool = 0;
    this.bumps.forEach((b) => b.parent && b.parent.remove(b)); this.bumps = [];
    this.arms.forEach((a) => { a.busy = false; });
    this.hold(false);
    this.root.position.copy(WORLD.spots[this.id].p); this.head.position.copy(this.headPos); this.head.quaternion.copy(this.headBase);
  };
  // 무기 들기/놓기
  Char.prototype.hold = function (on) {
    if (this.id === 'teen') { this.arms[1].hold.visible = on; this.deskRacket.visible = !on; }
    if (this.id === 'grandpa') { this.arms[1].hold.visible = on; this.floorSw.visible = !on; }
    if (this.id === 'mom') { this.can.visible = on; this.knife.visible = !on; this.counterCan.visible = !on; this.arms[1].tipL = on ? 0.16 : 0; }
    this.armed = on;
  };

  // ---------- 내려치기 ----------
  // kind: 'itch'(물린 자리) | 'hunt'(날아다니는 모기) | 'kill'(첫 목숨 연출)
  Char.prototype.strike = function (kind, G) {
    const D = this.D, mp = MOSQ.pos;
    let wind = kind === 'itch' ? D.wind : D.wind * 0.85;
    if (kind === 'kill') wind = 0.35;
    let type = 'slap';
    if (this.armed && this.id === 'mom' && kind === 'hunt') type = 'spray';
    if (this.id === 'dad' && kind === 'hunt') type = 'clap';
    if (this.id === 'dog' && kind === 'hunt') type = 'snap';
    // 팔 고르기: 물린 팔이 아니고, 닿고, 가까운 쪽
    const tgtW = kind === 'itch' && G.att ? G.attWorld(_P).clone() : mp.clone();
    const tl = this.root.worldToLocal(tgtW.clone());
    let best = null, bd = 1e9;
    this.arms.forEach((a) => {
      if (kind === 'itch' && G.att && G.att.pr.arm === a) return;
      if ((this.id === 'teen' || this.id === 'grandpa') && this.armed && a !== this.arms[1]) return;
      const d = a.S.distanceTo(tl) - (a.L1 + a.L2 + (a.tipL && a.hold.visible ? a.tipL : 0));
      if (d < bd) { bd = d; best = a; }
    });
    if (type === 'snap') best = null;
    // 손이 안 닿는 곳(발등 등): 몸을 털어 떼어 냄(안 죽음)
    if (kind === 'itch' && (!best || bd > 0.12)) { this.act = { kind, type: 'shake', t: 0, wind: 0.45, hitT: 0.1, tgtW, done: false }; if (G.onStrike) G.onStrike(this, this.act); return true; }
    if (!best && type !== 'snap') return false;
    if (bd > 0.12 && type === 'slap' && kind !== 'kill') return false; // 안 닿음
    this.act = { kind, type, arm: best, t: 0, wind, hitT: type === 'spray' ? 0.25 : kind === 'kill' ? 0.3 : 0.09, tgtW, done: false, hitDone: false, prevTip: null };
    if (best) best.busy = true;
    if (type === 'clap') this.arms.forEach((a) => (a.busy = true));
    if (G.onStrike) G.onStrike(this, this.act);
    return true;
  };

  // 매 프레임. G: 게임 상태(붙어 있는지, 카드 값 등). 모기를 맞히면 G.kill(this, how)
  Char.prototype.update = function (dt, t, G) {
    const near = this.root.position.distanceTo(MOSQ.pos) < 5.5;
    this.root.visible = near || G.showAll;
    if (!near && !G.showAll) return;
    const st = G.st, mine = G.att && G.att.c === this;
    this.cool -= dt;
    // 간지러움
    if (mine) {
      this.itch += this.D.itch * st.itchMul * dt;
    } else this.itch = Math.max(0, this.itch - st.decay * dt);
    // 귓가 앵앵
    this.headWorld(_a);
    const ed = _a.distanceTo(MOSQ.pos);
    if (!G.att && ed < 0.38 && G.alive && !this.D.harmless) this.annoy += dt * 0.55 * st.annoy * (1.4 - ed / 0.38); else this.annoy = Math.max(0, this.annoy - dt * 0.35);
    // 행동 시작
    if (!this.act && G.alive && G.mode === 'play') {
      if (mine && this.itch >= 1) { if (this.strike('itch', G)) { this.itch = 0.35; } }
      else if (this.annoy >= 1) { this.annoy = 0; this.alert = this.D.alert * st.alertMul; this.hold(this.id !== 'baby'); this.strike('hunt', G); }
      else if (this.alert > 0 && this.cool <= 0 && !G.att) {
        const tl = this.root.worldToLocal(_b.copy(MOSQ.pos));
        const reach = this.arms.reduce((m, a) => Math.max(m, a.L1 + a.L2 + (a.tipL && a.hold.visible ? a.tipL : 0) + 0.15 - a.S.distanceTo(tl)), -1);
        if (reach > 0 || (this.id === 'mom' && this.armed && _a.distanceTo(MOSQ.pos) < 1.6) || (this.snapHead && _a.distanceTo(MOSQ.pos) < 0.35)) { this.strike('hunt', G); this.cool = this.D.hunt; }
      }
    }
    if (this.alert > 0) { this.alert -= dt; if (this.alert <= 0) { this.alert = 0; if (!this.act) this.hold(false); } }
    // 몸짓(고개는 늘 기본 자세에서 다시 시작)
    this.head.quaternion.copy(this.headBase);
    this.idle(t);
    if (this.act) this.runAct(dt, G);
    // 간지러움 표시
    const show = mine && this.itch > 0.62 && !this.act;
    this.itchS.visible = show;
    if (show) { G.attWorld(_c); this.itchS.position.copy(_c).add(_d.set(0, 0.03, 0)); this.itchS.material.rotation = Math.sin(t * 30) * 0.15; const s = 0.018 + Math.sin(t * 25) * 0.002; this.itchS.scale.set(s, s, 1); }
    // 간지러우면 그 자리가 움찔
    // 간지러우면 몸이 움찔움찔(경고) — 0.7 넘으면 시작, 1 에 가까울수록 세게 + 고개가 물린 쪽으로
    const tw = mine && !this.act ? Math.max(0, (this.itch - 0.62) / 0.38) : 0;
    const sp0 = WORLD.spots[this.id].p;
    if (tw > 0) {
      const j = Math.sin(t * 47) * Math.sin(t * 13 + 1);
      this.root.position.set(sp0.x + j * 0.009 * tw, sp0.y + Math.abs(j) * 0.004 * tw, sp0.z + Math.cos(t * 39) * 0.006 * tw);
      this.head.rotation.z += Math.sin(t * 31) * 0.08 * tw; this.head.rotation.y += 0.25 * tw;
      if (tw > 0.5 && !this._said) { this._said = 1; G.fx && G.fx('itchy', this.headWorld(new V3()).add(new V3(0, 0.15, 0)), this); }
    } else { this.root.position.lerp(sp0, 0.3); if (!mine) this._said = 0; }
    this.arms.forEach((a) => a.solve());
    this.root.updateMatrixWorld(true);
  };

  const _tip = new V3(), _seg = new V3();
  Char.prototype.runAct = function (dt, G) {
    const A = this.act, st = G.st;
    A.t += dt;
    const a = A.arm;
    // 목표: 물린 자리는 살 따라, 찾기는 휘두르기 0.12초 전까지 모기를 따라감
    if (A.kind === 'itch' && G.att && G.att.c === this) G.attWorld(A.tgtW);
    else if (A.kind === 'kill' || A.t < A.wind - 0.2) { A.tgtW.copy(MOSQ.pos); if (A.kind === 'hunt') A.tgtW.addScaledVector(MOSQ.vel, this.D.lead || 0); }
    const tl = this.root.worldToLocal(_P.copy(A.tgtW));
    const ph = A.t < A.wind ? 0 : A.t < A.wind + A.hitT ? 1 : A.t < A.wind + A.hitT + 0.45 ? 2 : 3;
    // 위험 고리
    if (st.eye > 0 && ph === 0 && A.type !== 'spray') { P.ring.visible = true; P.ring.position.copy(A.tgtW); P.ring.lookAt(RND.camera.position); const k = 1 + (1 - A.t / A.wind) * 0.8; P.ring.scale.setScalar(k * (a && a.tipR && a.hold.visible ? a.tipR / 0.08 : 1)); }
    if (ph !== 0 && P.ring.visible && P.ring.userData.c === this) P.ring.visible = false;
    if (ph === 0) P.ring.userData.c = this;
    if (A.type === 'shake') {
      // 몸을 부르르 → 툭 털어 냄
      const k = ph === 0 ? A.t / A.wind : 0;
      this.root.position.y = WORLD.spots[this.id].p.y + (ph === 0 ? Math.abs(Math.sin(A.t * 40)) * 0.01 * k : 0);
      if (ph === 1 && !A.hitDone) { A.hitDone = true; if (G.att && G.att.c === this) G.bonk(this, A.tgtW.clone().add(new V3(0, -0.05, 0)), true); }
      if (ph >= 2) { this.root.position.y = WORLD.spots[this.id].p.y; this.act = null; if (!this.alert) { this.alert = this.D.alert * st.alertMul; this.hold(this.id !== 'baby'); } }
      return;
    }
    if (A.type === 'snap') {
      // 강아지 고개 물기
      const base = this.headPos, k = ph === 0 ? -0.15 * ease(A.t / A.wind) : ph === 1 ? ease((A.t - A.wind) / A.hitT) : ph === 2 ? 1 - ease((A.t - A.wind - A.hitT) / 0.45) : 0;
      _c.copy(tl).sub(base); const L = Math.min(_c.length(), 0.3); _c.setLength(L);
      this.head.position.copy(base).addScaledVector(_c, k);
      if (ph === 1) { this.head.localToWorld(_tip.set(0, -0.02, 0.17)); if (_tip.distanceTo(MOSQ.pos) < 0.06 * st.hitbox + MOSQ.R) G.kill(this, 'snap'); }
      if (ph === 3) { this.head.position.copy(base); this.act = null; G.onDodge && G.onDodge(this); }
      return;
    }
    if (A.type === 'clap') {
      // 양손이 모기 양옆에서 짝
      const L = this.arms[0], R = this.arms[1];
      _c.copy(tl); const side = new V3(0, 0, 1);
      const open = ph === 0 ? 0.28 * ease(A.t / A.wind) : ph === 1 ? 0.28 * (1 - ease((A.t - A.wind) / A.hitT)) : ph === 2 ? 0.0 : 0;
      if (ph < 3) { L.W.copy(_c).addScaledVector(side, open + 0.04); R.W.copy(_c).addScaledVector(side, -open - 0.04); }
      if (ph === 1 && A.t - A.wind > A.hitT * 0.7 && !A.hitDone) {
        A.hitDone = true;
        L.tip(_tip); R.tip(_seg);
        if (MOSQ.pos.distanceTo(_c.copy(_tip).add(_seg).multiplyScalar(0.5)) < 0.09 * st.hitbox + MOSQ.R) G.kill(this, 'clap');
        G.fx && G.fx('clap', _c.clone(), this);
      }
      if (ph === 3) { L.busy = R.busy = false; this.act = null; G.onDodge && G.onDodge(this); }
      return;
    }
    if (A.type === 'spray') {
      // 엄마: 캔을 모기 쪽으로 들고, 칙—
      _c.copy(tl).sub(a.S).setLength(Math.min(0.45, _c.length())).add(a.S);
      a.W.lerp(_c, Math.min(1, dt * 8)); a.aimT = tl.clone();
      if (ph >= 1 && !A.hitDone) { A.hitDone = true; G.fx && G.fx('spray', A.tgtW.clone(), this); }
      if (ph === 3) { a.busy = false; a.aimT = null; this.act = null; }
      return;
    }
    // 손바닥·앞발·모기채·파리채
    const tool = !!(a.tipL && a.hold.visible), tipL = tool ? a.tipL : 0, hitR = (tool ? a.tipR : a.hr + 0.012) * st.hitbox * (A.kind === 'kill' ? 3 : 1) + MOSQ.R;
    _c.subVectors(tl, a.S); const dist = _c.length(); _c.normalize();
    const hitW = _d.copy(a.S).addScaledVector(_c, Math.max(0.05, dist - tipL)); // 손목 자리
    // 올린 자리: 목표 위·바깥으로
    const upW = _seg.copy(hitW).add(new V3(0, 0.22, 0)).addScaledVector(_c, -0.12);
    a.aimT = a.tipL && a.hold.visible ? tl.clone() : null;
    if (ph === 0) a.W.lerpVectors(a.rest, upW, ease(A.t / (A.wind * 0.7)));
    else if (ph === 1 || (ph === 2 && !A.endChk)) {
      // 내려치는 마지막 프레임(손이 목표에 닿은 자리)까지 꼭 판정
      if (ph === 2) A.endChk = 1;
      a.W.lerpVectors(upW, hitW, ph === 2 ? 1 : ease((A.t - A.wind) / A.hitT));
      a.solve(); a.tip(_tip);
      // 휘두른 길 전체로 판정(빠른 손이 지나쳐도 맞음)
      const prev = A.prevTip || _tip.clone();
      const dd = segDist(MOSQ.pos, prev, _tip);
      if (dd < hitR && !A.hitDone) { A.hitDone = true; if (this.D.harmless) G.bonk && G.bonk(this, _tip.clone()); else G.kill(this, this.id === 'teen' && this.armed ? 'zap' : this.id === 'grandpa' && this.armed ? 'swat' : 'slap'); }
      A.prevTip = _tip.clone();
      if (A.t - A.wind + dt >= A.hitT && !A.sfx) { A.sfx = 1; G.fx && G.fx(this.armed && this.id === 'teen' ? 'zapmiss' : 'slap', _tip.clone(), this); }
    } else if (ph === 2) a.W.lerpVectors(hitW, a.rest, ease((A.t - A.wind - A.hitT) / 0.45));
    else { a.busy = false; a.aimT = null; this.act = null; if (!A.hitDone) G.onDodge && G.onDodge(this); if (A.kind === 'itch' && !this.alert) { this.alert = this.D.alert * st.alertMul; this.hold(true); } }
  };
  function segDist(p, a, b) { _A.subVectors(b, a); const l = _A.lengthSq(); let t = l > 1e-9 ? _B.subVectors(p, a).dot(_A) / l : 0; t = Math.max(0, Math.min(1, t)); return _B.copy(a).addScaledVector(_A, t).distanceTo(p); }
  P.segDist = segDist;
})();
