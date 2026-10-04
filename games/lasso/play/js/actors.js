// actors.js — 말(코드 모델)·사람(GLB)·밧줄
(function () {
  const { S, cloneSkinned } = CORE; const { M4, bake, merge } = WORLD._;
  const V3 = THREE.Vector3, PI = Math.PI;

  // ── 말: 몸·목·꼬리·다리 여덟 마디. 털색은 재질 색, 꼭짓점 색은 밝고 어두움 ──
  let HG = null;
  function horseGeos() {
    if (HG) return HG;
    const W = 0xffffff, D = 0x2c2622, cap = (r, l) => new THREE.CapsuleGeometry(r, l, 4, 12), sph = r => new THREE.SphereGeometry(r, 12, 9);
    // 고리를 이어 붙인 몸통(옆에서 본 윤곽을 따라): [y, z, 기울기, 반폭, 반높이, 밝기]
    const loft = (secs, N) => {
      const pos = [], col = [], idx = [];
      secs.forEach(([y, z, a, rx, ry, sh]) => { const uy = Math.cos(a), uz = -Math.sin(a), c = sh === undefined ? 1 : sh; for (let k = 0; k < N; k++) { const t = k / N * PI * 2; pos.push(Math.cos(t) * rx, y + Math.sin(t) * ry * uy, z + Math.sin(t) * ry * uz); col.push(c, c, c); } });
      for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < N; k++) { const p0 = i * N + k, p1 = i * N + (k + 1) % N, p2 = p0 + N, p3 = p1 + N; idx.push(p0, p1, p2, p1, p3, p2); }
      const cap = (i, flip) => { const [y, z, , , , sh] = secs[i], c = sh === undefined ? 1 : sh, ci = pos.length / 3; pos.push(0, y, z); col.push(c, c, c); for (let k = 0; k < N; k++) { const p0 = i * N + k, p1 = i * N + (k + 1) % N; if (flip) idx.push(ci, p1, p0); else idx.push(ci, p0, p1); } };
      cap(0, true); cap(secs.length - 1, false);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g.toNonIndexed();
    };
    const body = merge([loft([[1.36, -0.99, 0, 0.06, 0.1], [1.36, -0.92, 0, 0.25, 0.28], [1.34, -0.7, 0, 0.36, 0.4], [1.3, -0.38, 0, 0.345, 0.37], [1.27, 0, 0, 0.335, 0.36], [1.28, 0.3, 0, 0.335, 0.39], [1.31, 0.52, 0, 0.32, 0.42], [1.34, 0.72, 0, 0.26, 0.37, 1], [1.36, 0.86, 0, 0.12, 0.2]], 14)]);
    const tack = merge([
      bake(new THREE.BoxGeometry(0.5, 0.05, 0.8), M4(0, 1.665, -0.05), 0xa33a2a, 0.08), bake(new THREE.BoxGeometry(0.05, 0.3, 0.8), M4(0.3, 1.55, -0.05, 0, 0, 0.5), 0xa33a2a, 0.08), bake(new THREE.BoxGeometry(0.05, 0.3, 0.8), M4(-0.3, 1.55, -0.05, 0, 0, -0.5), 0xa33a2a, 0.08),
      bake(cap(0.19, 0.34), M4(0, 1.72, -0.06, 0, PI / 2, 0, 1.1, 1, 0.5), 0x6e4526, 0.06), bake(new THREE.BoxGeometry(0.4, 0.2, 0.1), M4(0, 1.84, -0.36, 0, -0.3), 0x5d3a20, 0.06), bake(new THREE.CylinderGeometry(0.04, 0.05, 0.2, 6), M4(0, 1.86, 0.24), 0x5d3a20, 0.06), bake(sph(0.06), M4(0, 1.97, 0.24), 0x8a5a34, 0),
      bake(new THREE.BoxGeometry(0.04, 0.5, 0.05), M4(0.4, 1.32, 0.02), 0x4a2e1a, 0), bake(new THREE.BoxGeometry(0.04, 0.5, 0.05), M4(-0.4, 1.32, 0.02), 0x4a2e1a, 0), bake(new THREE.BoxGeometry(0.1, 0.08, 0.2), M4(0.42, 1.06, 0.04), 0x8a8478, 0), bake(new THREE.BoxGeometry(0.1, 0.08, 0.2), M4(-0.42, 1.06, 0.04), 0x8a8478, 0),
      bake(cap(0.11, 0.34), M4(0, 1.8, -0.6, 0, 0, PI / 2), 0x7a8a5a, 0.1)]);
    // 목·머리 묶음: 원점 = 어깨 위 목뿌리
    const neck = merge([
      loft([[-0.14, -0.08, 0.95, 0.2, 0.36], [0.22, 0.17, 0.95, 0.155, 0.26], [0.6, 0.43, 0.85, 0.125, 0.2], [0.8, 0.6, -0.2, 0.135, 0.19], [0.7, 0.86, -0.62, 0.105, 0.14], [0.55, 1.08, -0.62, 0.088, 0.1, 0.55], [0.5, 1.16, -0.62, 0.05, 0.06, 0.4]], 12),
      bake(new THREE.ConeGeometry(0.06, 0.2, 5), M4(0.095, 1.04, 0.56, 0, -0.25, -0.25), W, 0), bake(new THREE.ConeGeometry(0.06, 0.2, 5), M4(-0.095, 1.04, 0.56, 0, -0.25, 0.25), W, 0),
      bake(new THREE.BoxGeometry(0.08, 0.98, 0.17), M4(0, 0.45, -0.04, 0, 0.76), D, 0.2), bake(new THREE.BoxGeometry(0.1, 0.2, 0.12), M4(0, 0.94, 0.7, 0, 1.9), D, 0.2),
      bake(sph(0.034), M4(0.118, 0.82, 0.74), 0x0e0c0a, 0), bake(sph(0.034), M4(-0.118, 0.82, 0.74), 0x0e0c0a, 0),
      bake(new THREE.TorusGeometry(0.115, 0.016, 4, 12), M4(0, 0.62, 0.98, 0, 0.6, 0, 0.9, 1.15, 1), 0x3a2a1c, 0)]);
    const tail = merge([loft([[0.02, 0.05, -1.2, 0.05, 0.05, 0.17], [-0.2, -0.12, -1.3, 0.1, 0.1, 0.17], [-0.55, -0.2, -1.5, 0.11, 0.1, 0.15], [-0.85, -0.22, -1.57, 0.07, 0.07, 0.13], [-1.02, -0.22, -1.57, 0.015, 0.015, 0.12]], 8)]);
    const up = merge([bake(new THREE.CylinderGeometry(0.15, 0.085, 0.62, 10), M4(0, -0.25, 0, 0, 0, 0, 1, 1, 1.2), W, 0.03)]);
    const low = merge([bake(new THREE.CylinderGeometry(0.078, 0.066, 0.44, 8), M4(0, -0.22, 0), 0xdcdcdc, 0.03), bake(sph(0.085), M4(0, -0.43, 0), 0xdcdcdc, 0), bake(new THREE.CylinderGeometry(0.08, 0.105, 0.14, 8), M4(0, -0.51, 0.015), D, 0)]);
    return HG = { body, tack, neck, tail, up, low };
  }
  // ── 조랑말(GLB + 블렌더로 넣은 네발 뼈대). 동작은 뼈를 옆 축으로 돌려서 만든다 ──
  let PONY = null; const _qd = new THREE.Quaternion(), _qe = new THREE.Quaternion(), AX = new V3(1, 0, 0), AZ = new V3(0, 0, 1);
  function makePony(coat) {
    const body = cloneSkinned(PONY.scene), B = {}; let mat = null;
    body.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; mat = o.material = o.material.clone(); mat.roughness = 0.8; mat.metalness = 0; mat.envMapIntensity = 0.4; if (mat.map) mat.map.anisotropy = 8; if (coat) mat.color.set(coat); } if (o.isBone) B[o.name] = o; });
    body.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(body), sc = 2.05 / (bb.max.y - bb.min.y);
    const root = new THREE.Group(), rig = new THREE.Group(); body.scale.multiplyScalar(sc); body.position.y = -bb.min.y * sc; rig.add(body); root.add(rig); S.add(root); root.updateMatrixWorld(true);
    const J = {}; for (const n in B) { const pr = B[n].parent.getWorldQuaternion(new THREE.Quaternion()); J[n] = { b: B[n], rest: B[n].quaternion.clone(), pr, pri: pr.clone().invert() }; }
    const turn = (n, ax, az) => { const j = J[n]; if (!j) return; _qd.setFromAxisAngle(AX, ax); if (az) _qd.multiply(_qe.setFromAxisAngle(AZ, az)); j.b.quaternion.copy(j.pri).multiply(_qd).multiply(j.pr).multiply(j.rest); };
    const legs = [['FL', 1], ['FR', 1], ['HL', 0], ['HR', 0]].map(([n, front]) => ({ n, front, a: 0, k: 0 }));
    return { root, rig, mat, pony: true, pos: new V3(), yaw: 0, speed: 0, ph: Math.random() * 6, t: Math.random() * 9, seat: new V3(), rear: 0, neckA: 0, tailA: 0,
      update(dt) {
        const v = Math.abs(this.speed); this.t += dt;
        const gallop = v > 5.5, rate = v < 0.3 ? 0 : gallop ? 11 + v * 0.6 : 5 + v * 1.1; this.ph += dt * rate;
        const A = v < 0.3 ? 0 : gallop ? 0.78 : 0.22 + v * 0.07, off = gallop ? [0, 0.7, PI + 0.2, PI + 0.9] : [0, PI, PI, 0], e = Math.min(1, dt * 18);
        legs.forEach((l, i) => { const a = this.ph + off[i], sw = Math.sin(a) * A; l.a += (-sw * (l.front ? 1 : 0.85) - l.a) * e; const bend = Math.max(0, Math.sin(a + (l.front ? 1.9 : 1.2))) * (gallop ? 1.25 : 0.7) * (A > 0 ? 1 : 0); l.k += ((l.front ? bend : -bend * 0.2 + Math.max(0, -sw) * 0.5) - l.k) * e; turn(l.n + '_up', l.a); turn(l.n + '_low', l.k); });
        const bob = gallop ? Math.abs(Math.sin(this.ph)) * 0.1 : v > 0.3 ? Math.abs(Math.sin(this.ph)) * 0.03 : 0;
        if (this.rear > 0) this.rear -= dt;
        const rearA = this.rear > 0 ? Math.sin(Math.min(1, this.rear / 0.7) * PI) * 0.5 : 0;
        this.rig.position.y = bob; this.rig.rotation.x = (gallop ? Math.sin(this.ph + 0.8) * 0.05 : 0) - rearA;
        const na = (gallop ? 0.2 + Math.sin(this.ph + 2) * 0.08 : v > 0.3 ? 0.06 + Math.sin(this.ph * 2) * 0.03 : Math.sin(this.t * 0.7) * 0.04) + rearA * 0.3; this.neckA += (na - this.neckA) * Math.min(1, dt * 8); turn('Neck', this.neckA); turn('Head', -this.neckA * 0.5);
        const ta = gallop ? 0.75 + Math.sin(this.ph) * 0.15 : v > 0.3 ? 0.15 : 0; this.tailA += (ta - this.tailA) * Math.min(1, dt * 5); const sway = Math.sin(this.t * 1.6) * (gallop ? 0.08 : 0.16);
        turn('Tail1', this.tailA, sway); turn('Tail2', this.tailA * 0.5, sway);
        this.root.position.copy(this.pos); this.root.rotation.y = this.yaw;
        this.stepHit = gallop ? Math.floor(this.ph / PI * 2) !== Math.floor((this.ph - dt * rate) / PI * 2) : v > 0.3 && Math.floor(this.ph / PI) !== Math.floor((this.ph - dt * rate) / PI);
        this.seat.set(0, 1.19 + bob, -0.06).applyAxisAngle(V3X, this.rig.rotation.x).applyAxisAngle(V3Y, this.yaw).add(this.pos);
      } };
  }
  const tackMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, envMapIntensity: 0.3 });
  function makeHorse(coat, noSaddle) {
    if (PONY) return makePony(coat === 0xb9763c ? null : coat); // 주인공 말은 모델 색 그대로
    const G = horseGeos(), mat = new THREE.MeshStandardMaterial({ color: coat, vertexColors: true, roughness: 0.7, metalness: 0, envMapIntensity: 0.4 });
    const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig);
    const mk = (g, m, par, x, y, z) => { const o = new THREE.Mesh(g, m || mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; (par || rig).add(o); return o; };
    mk(G.body); const tk = mk(G.tack, tackMat); tk.visible = !noSaddle;
    const neck = mk(G.neck, mat, rig, 0, 1.48, 0.66), tail = mk(G.tail, mat, rig, 0, 1.5, -0.95);
    const legs = [[0.22, 0.6, 1], [-0.22, 0.6, 1], [0.24, -0.62, 0], [-0.24, -0.62, 0]].map(([x, z, front]) => { const up = mk(G.up, mat, rig, x, 1.1, z), low = mk(G.low, mat, up, 0, -0.53, 0); return { up, low, front }; });
    S.add(root);
    const h = { root, rig, neck, tail, legs, mat, tack: tk, pos: new V3(), yaw: 0, speed: 0, ph: Math.random() * 6, t: Math.random() * 9, seat: new V3(), rear: 0,
      update(dt) {
        const v = Math.abs(this.speed); this.t += dt;
        const gallop = v > 5.5, rate = v < 0.3 ? 0 : gallop ? 9.5 + v * 0.55 : 4.2 + v * 0.9; this.ph += dt * rate;
        const A = v < 0.3 ? 0 : gallop ? 0.82 : 0.2 + v * 0.07, off = gallop ? [0, 0.7, PI + 0.2, PI + 0.9] : [0, PI, PI, 0];
        this.legs.forEach((l, i) => { const a = this.ph + off[i], sw = Math.sin(a) * A; l.up.rotation.x += (-sw * (l.front ? 1 : 0.85) - l.up.rotation.x) * Math.min(1, dt * 18); const bend = Math.max(0, Math.sin(a + (l.front ? 1.9 : 1.2))) * (gallop ? 1.35 : 0.75) * (A > 0 ? 1 : 0); l.low.rotation.x += ((l.front ? bend : -bend * 0.2 + Math.max(0, -sw) * 0.5) - l.low.rotation.x) * Math.min(1, dt * 18); });
        const bob = gallop ? Math.abs(Math.sin(this.ph)) * 0.13 : v > 0.3 ? Math.abs(Math.sin(this.ph)) * 0.035 : 0;
        if (this.rear > 0) this.rear -= dt;
        const rearA = this.rear > 0 ? Math.sin(Math.min(1, this.rear / 0.7) * PI) * 0.55 : 0;
        this.rig.position.y = bob; this.rig.rotation.x = (gallop ? Math.sin(this.ph + 0.8) * 0.055 : 0) - rearA;
        this.neck.rotation.x = (gallop ? 0.22 + Math.sin(this.ph + 2) * 0.09 : v > 0.3 ? 0.08 + Math.sin(this.ph * 2) * 0.03 : Math.sin(this.t * 0.7) * 0.05) + rearA * 0.4;
        this.tail.rotation.x = gallop ? 0.9 + Math.sin(this.ph) * 0.15 : 0.08; this.tail.rotation.z = Math.sin(this.t * 1.6) * (gallop ? 0.1 : 0.22);
        this.root.position.copy(this.pos); this.root.rotation.y = this.yaw;
        this.stepHit = gallop ? Math.floor(this.ph / PI * 2) !== Math.floor((this.ph - dt * rate) / PI * 2) : v > 0.3 && Math.floor(this.ph / PI) !== Math.floor((this.ph - dt * rate) / PI);
        this.seat.set(0, 1.62 + bob, -0.06).applyAxisAngle(V3X, this.rig.rotation.x).applyAxisAngle(V3Y, this.yaw).add(this.pos);
      } };
    return h;
  }
  const V3X = new V3(1, 0, 0), V3Y = new V3(0, 1, 0);

  // ── 사람: 뼈 있는 GLB 를 복제해 키·색을 맞춘다 ──
  const _va = new V3(), _vb = new V3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion();
  function aimBone(bone, child, dir) { // 뼈가 child 쪽을 보는 방향을 dir(세계 좌표)로
    if (!bone || !child) return;
    bone.getWorldPosition(_va); child.getWorldPosition(_vb);
    _qa.setFromUnitVectors(_vb.sub(_va).normalize(), dir);
    bone.getWorldQuaternion(_qb); bone.parent.getWorldQuaternion(_qc);
    bone.quaternion.copy(_qc.invert().multiply(_qa.multiply(_qb))); bone.updateMatrixWorld(true);
  }
  const BN = { hips: /^Hips$/i, spine: /^Spine02$|^Spine2$/i, head: /^Head$/i, la: /^LeftArm$/i, lfa: /^LeftForeArm$/i, lh: /^LeftHand$/i, ra: /^RightArm$/i, rfa: /^RightForeArm$/i, rh: /^RightHand$/i,
    lul: /^LeftUpLeg$/i, ll: /^LeftLeg$/i, lf: /^LeftFoot$/i, rul: /^RightUpLeg$/i, rl: /^RightLeg$/i, rf: /^RightFoot$/i };
  // 면마다 끊긴 법선을 같은 자리의 꼭짓점끼리 평균해 부드럽게 한다(안 하면 얼굴과 몸이 각져 보인다). 모양과 무늬는 그대로
  function smoothNormals(g) {
    if (g.userData.smooth || !g.attributes.position) return; g.userData.smooth = 1;
    const P = g.attributes.position, n = P.count, ix = g.index, acc = new Float32Array(n * 3), rep = new Int32Array(n), key = new Map();
    for (let i = 0; i < n; i++) { const k = Math.round(P.getX(i) * 2e4) + ',' + Math.round(P.getY(i) * 2e4) + ',' + Math.round(P.getZ(i) * 2e4); let r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; }
    const tn = ix ? ix.count : n, a = new V3(), b = new V3(), c = new V3();
    for (let t = 0; t < tn; t += 3) { const i0 = ix ? ix.getX(t) : t, i1 = ix ? ix.getX(t + 1) : t + 1, i2 = ix ? ix.getX(t + 2) : t + 2;
      a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1).sub(a); c.fromBufferAttribute(P, i2).sub(a); b.cross(c); // 길이 = 넓이의 두 배 → 넓은 면이 더 많이 반영된다
      for (const i of [i0, i1, i2]) { const r = rep[i] * 3; acc[r] += b.x; acc[r + 1] += b.y; acc[r + 2] += b.z; } }
    const N = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const r = rep[i] * 3, l = Math.hypot(acc[r], acc[r + 1], acc[r + 2]) || 1; N[i * 3] = acc[r] / l; N[i * 3 + 1] = acc[r + 1] / l; N[i * 3 + 2] = acc[r + 2] / l; }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  }
  function makePerson(gltf, height, tint, noMask) {
    const body = cloneSkinned(gltf.scene), bones = {}; let mat = null;
    body.traverse(o => {
      if (o.isMesh) { smoothNormals(o.geometry); o.castShadow = true; o.frustumCulled = false; mat = o.material = o.material.clone(); mat.flatShading = false; mat.envMapIntensity = 0.4; mat.roughness = 0.85; mat.metalness = 0; if (mat.map) mat.map.anisotropy = 8; if (tint) mat.color.set(tint); }
      if (o.isBone) { const n = o.name.replace(/^mixamorig:?/i, ''); for (const k in BN) if (BN[k].test(n)) bones[k] = o; }
    });
    body.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(body), sc = height / (bb.max.y - bb.min.y);
    const root = new THREE.Group(), tilt = new THREE.Group(); body.scale.multiplyScalar(sc); body.position.y = -bb.min.y * sc; tilt.add(body); root.add(tilt); S.add(root);
    const mixer = new THREE.AnimationMixer(body), acts = {};
    const fists = []; body.traverse(o => { if (o.isMesh && o.morphTargetDictionary && o.morphTargetDictionary.fist !== undefined) fists.push([o, o.morphTargetDictionary.fist]); });   // 주먹 모프(tools/fist_morph.py 로 심은 것). 손가락 뼈가 없어 손 모양은 모프로 바꾼다
    let mask = null;
    if (tint !== undefined && !noMask && bones.head) { // 현상범: 코와 입을 가린 두건
      root.updateMatrixWorld(true); let top = null, front = null; bones.head.traverse(o => { if (/head_?end/i.test(o.name)) top = o; if (/headfront/i.test(o.name)) front = o; });
      const hp = bones.head.getWorldPosition(new V3()), u = top ? top.getWorldPosition(new V3()).sub(hp).normalize() : new V3(0, 1, 0), f = front ? front.getWorldPosition(new V3()).sub(hp) : new V3(0, 0, 1); f.addScaledVector(u, -f.dot(u)).normalize(); const r = new V3().crossVectors(u, f);
      const Wm = new THREE.Matrix4().makeBasis(r, u, f).setPosition(hp.clone().addScaledVector(u, 0.055).addScaledVector(f, 0.085));
      mask = new THREE.Mesh(maskGeo, new THREE.MeshStandardMaterial({ color: 0x8a1c14, roughness: 0.9, metalness: 0, side: THREE.DoubleSide })); mask.castShadow = false;
      mask.matrixAutoUpdate = false; mask.matrix.copy(bones.head.matrixWorld).invert().multiply(Wm); bones.head.add(mask);
    } gltf.animations.forEach(a => acts[a.name.toLowerCase()] = mixer.clipAction(a));
    let standT = 0.02;
    if (acts.walk && bones.lf && bones.rf) { // 서 있는 자세 = 걷기 동작에서 두 발이 가장 가지런한 순간
      const a = acts.walk, dur = a.getClip().duration; a.play(); let best = 1e9;
      for (let i = 0; i < 32; i++) { a.time = dur * i / 32; mixer.update(0); root.updateMatrixWorld(true); bones.lf.getWorldPosition(_va); bones.rf.getWorldPosition(_vb); const d = Math.abs(_va.z - _vb.z) + Math.abs(_va.y - _vb.y) * 3; if (d < best) { best = d; standT = a.time; } }
      a.stop(); }
    if (acts.walk) { const st = mixer.clipAction(acts.walk.getClip().clone()); st.timeScale = 0; acts.stand = st; }
    const p = { root, tilt, body, bones, mat, mask, mixer, acts, standT, cur: null, height, pos: new V3(), yaw: 0,
      // t0 을 주면 그 시각부터 다시 튼다(주먹처럼 한 번 치는 동작: 맞는 순간 조금 앞에서 시작)
      play(n, ts, t0) { const a = this.acts[n] || this.acts.stand; if (ts !== undefined && n !== 'stand') a.timeScale = ts; if (this.cur === a && t0 === undefined) return; a.reset(); if (n === 'stand') a.time = this.standT; else if (t0 !== undefined) a.time = t0; a.enabled = true; a.setEffectiveWeight(1); a.play(); if (this.cur && this.cur !== a) this.cur.crossFadeTo(a, t0 !== undefined ? 0.07 : 0.18, false); this.cur = a; },
      fwd(out) { return out.set(Math.sin(this.root.rotation.y), 0, Math.cos(this.root.rotation.y)); },
      fist(v) { for (let i = 0; i < fists.length; i++) fists[i][0].morphTargetInfluences[fists[i][1]] = v; },   // 0 = 편 손, 1 = 주먹
      hand(out) { return this.bones.rh ? this.bones.rh.getWorldPosition(out) : out.copy(this.root.position).setY(this.root.position.y + 1.2); },
      chest(out) { return this.bones.spine ? this.bones.spine.getWorldPosition(out) : out.copy(this.root.position).setY(this.root.position.y + this.height * 0.68); },
      lie(on) { this.tilt.rotation.x = on ? -PI / 2 : 0; this.tilt.position.y = on ? 0.2 : 0; this.tilt.position.z = on ? this.height * 0.5 : 0; },
      pose(kind, t) { // 동작 위에 덧입히는 자세(매 프레임, mixer.update 뒤에)
        const b = this.bones; this.root.updateMatrixWorld(true);
        const f = _f.set(Math.sin(this.root.rotation.y), 0, Math.cos(this.root.rotation.y)), r = _r.set(-f.z, 0, f.x), d = _d.set(0, -1, 0);
        const dir = (a, bb, c) => _t.set(0, 0, 0).addScaledVector(f, a).addScaledVector(d, bb).addScaledVector(r, c).normalize();
        if (kind === 'ride') {
          aimBone(b.lul, b.ll, dir(0.42, 0.7, -0.85)); aimBone(b.ll, b.lf, dir(-0.2, 1, -0.16)); aimBone(b.rul, b.rl, dir(0.42, 0.7, 0.85)); aimBone(b.rl, b.rf, dir(-0.2, 1, 0.16));
          aimBone(b.la, b.lfa, dir(0.35, 0.9, -0.22)); aimBone(b.lfa, b.lh, dir(0.9, 0.25, 0.25));
          if (!t) { aimBone(b.ra, b.rfa, dir(0.35, 0.9, 0.22)); aimBone(b.rfa, b.rh, dir(0.9, 0.25, -0.25)); }
        } else if (kind === 'stand') { // 두 발 모으고 팔을 내린 차렷 가까운 자세
          aimBone(b.lul, b.ll, dir(0.02, 1, -0.09)); aimBone(b.ll, b.lf, dir(-0.03, 1, -0.02)); aimBone(b.rul, b.rl, dir(0.02, 1, 0.09)); aimBone(b.rl, b.rf, dir(-0.03, 1, 0.02));
          aimBone(b.la, b.lfa, dir(0.02, 1, -0.2)); aimBone(b.lfa, b.lh, dir(0.22, 1, -0.06)); aimBone(b.ra, b.rfa, dir(0.02, 1, 0.2)); aimBone(b.rfa, b.rh, dir(0.22, 1, 0.06));
        } else if (kind === 'spin') { // 오른팔을 들어 머리 위에서 돌린다
          aimBone(b.ra, b.rfa, dir(0.1, -0.9, 0.5)); aimBone(b.rfa, b.rh, dir(Math.cos(t) * 0.42, -1, Math.sin(t) * 0.42));
        } else if (kind === 'guard') { // 두 팔을 올려 얼굴을 막는다
          aimBone(b.ra, b.rfa, dir(0.75, 0.55, 0.3)); aimBone(b.rfa, b.rh, dir(0.25, -1, -0.28)); aimBone(b.la, b.lfa, dir(0.75, 0.55, -0.3)); aimBone(b.lfa, b.lh, dir(0.25, -1, 0.28));
        } else if (kind === 'windup') { // 오른 주먹을 뒤로 뺀다
          aimBone(b.ra, b.rfa, dir(-0.7, -0.15, 0.6)); aimBone(b.rfa, b.rh, dir(0.1, -1, 0.1)); aimBone(b.la, b.lfa, dir(0.7, 0.5, -0.3)); aimBone(b.lfa, b.lh, dir(0.4, -0.9, 0.2));
        } else if (kind === 'throw') { aimBone(b.ra, b.rfa, dir(0.8, -0.45, 0.3)); aimBone(b.rfa, b.rh, dir(1, -0.15, 0));
        } else if (kind === 'pull') { const k = Math.sin(t * 18) * 0.12; aimBone(b.ra, b.rfa, dir(0.7, 0.5 + k, 0.2)); aimBone(b.rfa, b.rh, dir(1, -0.1, -0.2)); aimBone(b.la, b.lfa, dir(0.7, 0.5 - k, -0.2)); aimBone(b.lfa, b.lh, dir(1, -0.1, 0.2));
        } else if (kind === 'tied') { const u = _u.set(0, 1, 0).applyQuaternion(this.tilt.getWorldQuaternion(_qa)), ff = _t2.set(0, 0, 1).applyQuaternion(_qa), rt = _t3.crossVectors(u, ff);
          const dd = (a, c) => _t.set(0, 0, 0).addScaledVector(u, -1).addScaledVector(ff, a).addScaledVector(rt, c).normalize();
          aimBone(b.la, b.lfa, dd(0.1, 0.12)); aimBone(b.lfa, b.lh, dd(0.35, -0.5)); aimBone(b.ra, b.rfa, dd(0.1, -0.12)); aimBone(b.rfa, b.rh, dd(0.35, 0.5)); }
      } };
    return p;
  }
  const _f = new V3(), _r = new V3(), _d = new V3(), _t = new V3(), _u = new V3(), _t2 = new V3(), _t3 = new V3();
  const maskGeo = (() => { const a = new THREE.CylinderGeometry(0.098, 0.106, 0.085, 12, 1, true, -PI * 0.55, PI * 1.1).toNonIndexed(), b = new THREE.ConeGeometry(0.106, 0.15, 12, 1, true, -PI * 0.5, PI).toNonIndexed(); b.rotateX(PI); b.translate(0, -0.117, 0); const P = new Float32Array(a.attributes.position.array.length + b.attributes.position.array.length); P.set(a.attributes.position.array); P.set(b.attributes.position.array, a.attributes.position.array.length); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.computeVertexNormals(); return g; })();

  // ── 밧줄: 점 여러 개를 잇는 여섯 모 대롱. 무늬는 세 가닥을 꼰 삼밧줄(캔버스로 그려 색과 요철에 같이 쓴다) ──
  const ropeTex = (() => {
    const N = 64, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), im = c.createImageData(N, N), d = im.data;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const t = ((x + y) % 32) / 32, round = Math.sin(t * PI), fib = Math.sin((x - y) * 1.9 + Math.sin(y * 0.7) * 1.3) * 0.5 + 0.5; // 가닥 하나의 둥근 배 + 가닥 속 잔 섬유
      let v = 0.34 + round * 0.62 + (fib - 0.5) * 0.12 + ((x * 37 + y * 91) % 13) / 13 * 0.06; if (t < 0.07 || t > 0.93) v *= 0.45; // 가닥 사이 골
      v = Math.max(0, Math.min(1, v)); const o = (y * N + x) * 4; d[o] = 96 + v * 150; d[o + 1] = 66 + v * 128; d[o + 2] = 30 + v * 88; d[o + 3] = 255;
    }
    c.putImageData(im, 0, 0); const tx = new THREE.CanvasTexture(cv); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 8; if ('colorSpace' in tx) tx.colorSpace = THREE.SRGBColorSpace; else tx.encoding = THREE.sRGBEncoding; return tx;
  })();
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: ropeTex, bumpMap: ropeTex, bumpScale: 0.012, roughness: 1, metalness: 0, envMapIntensity: 0.2 });
  const RK = 6, RTILE = 0.13; // 둘레 면 수, 무늬 한 칸의 길이(m)
  class Rope {
    constructor(n, rad) {
      this.n = n; this.rad = rad || 0.028; this.pts = []; for (let i = 0; i <= n; i++) this.pts.push(new V3());
      const g = new THREE.BufferGeometry(), W = RK + 1, cnt = (n + 1) * W, idx = [];
      for (let i = 0; i < n; i++) for (let k = 0; k < RK; k++) { const a = i * W + k, b = a + 1, c = a + W, d = b + W; idx.push(a, c, b, b, c, d); }
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cnt * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(cnt * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(cnt * 2), 2)); g.setIndex(idx);
      this.mesh = new THREE.Mesh(g, ropeMat); this.mesh.frustumCulled = false; this.mesh.castShadow = true; this.mesh.visible = false; S.add(this.mesh);
    }
    // a 에서 b 로 slack 만큼 처진 줄(땅 밑으로는 안 내려감)
    hang(a, b, slack, ground) { for (let i = 0; i <= this.n; i++) { const t = i / this.n, p = this.pts[i].lerpVectors(a, b, t); p.y -= slack * 4 * t * (1 - t); if (ground) { const gy = ground(p.x, p.z) + 0.04; if (p.y < gy) p.y = gy; } } this.commit(); }
    commit() {
      const G = this.mesh.geometry.attributes, P = G.position, N = G.normal, U = G.uv, r = this.rad, W = RK + 1; let len = 0;
      for (let i = 0; i <= this.n; i++) {
        const p = this.pts[i], a = this.pts[Math.max(0, i - 1)], b = this.pts[Math.min(this.n, i + 1)];
        if (i) len += p.distanceTo(a);
        _t.subVectors(b, a).normalize(); _u.set(0, 1, 0); if (Math.abs(_t.y) > 0.95) _u.set(1, 0, 0);
        _t2.crossVectors(_t, _u).normalize(); _t3.crossVectors(_t, _t2);
        for (let k = 0; k < W; k++) { const an = k / RK * PI * 2, cs = Math.cos(an), sn = Math.sin(an), nx = _t2.x * cs + _t3.x * sn, ny = _t2.y * cs + _t3.y * sn, nz = _t2.z * cs + _t3.z * sn, o = i * W + k;
          P.setXYZ(o, p.x + nx * r, p.y + ny * r, p.z + nz * r); N.setXYZ(o, nx, ny, nz); U.setXY(o, k / RK, len / RTILE); }
      }
      P.needsUpdate = true; N.needsUpdate = true; U.needsUpdate = true; this.mesh.visible = true;
    }
    hide() { this.mesh.visible = false; }
  }
  // 올가미 고리: 고리를 따라 무늬가 감기게 무늬 좌표를 바꿔 넣는다(둘레 방향 = 가로, 고리 방향 = 세로)
  const loopGeo = new THREE.TorusGeometry(1, 0.03, 8, 40); loopGeo.rotateX(PI / 2);
  { const uv = loopGeo.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, u * 54); } }
  function makeLoop() { const m = new THREE.Mesh(loopGeo, ropeMat); m.castShadow = true; m.visible = false; m.frustumCulled = false; S.add(m); return m; }

  window.ACT = { setPony(g) { PONY = g; }, makeHorse, makePerson, aimBone, Rope, makeLoop, ropeMat };
})();
