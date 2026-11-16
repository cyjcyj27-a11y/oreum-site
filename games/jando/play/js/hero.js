// 주인공 모델 — 물리 몸(BODY.pts)이 가리키는 방향으로 뼈를 매 프레임 겨눈다. 모델이 안 뜨면 캡슐 몸 그대로
(function () {
  const S = { ready: false, root: null, bones: {}, restQ: {}, want: {}, rig: null };
  const J = window.HERO_J;
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  function loadGLB(url) {
    const parse = buf => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej));
    if (location.protocol === 'file:') return new Promise((res, rej) => {
      const name = url.split('/').pop();
      const done = () => { const b64 = window.GLBJS && window.GLBJS[name]; if (!b64) return rej(new Error('no glbjs')); const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); window.GLBJS[name] = null; parse(u8.buffer).then(res, rej); };
      const s = document.createElement('script'); s.src = url + '.js'; s.onload = done; s.onerror = () => rej(new Error('load ' + s.src)); document.head.appendChild(s);
    });
    return fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(parse);
  }
  // 같은 자리 꼭짓점의 면 법선을 평균 (Meshy 모델이 각져 보이지 않게)
  function smoothNormals(g) {
    const P = g.attributes.position; if (!P) return; const n = P.count, ix = g.index, acc = new Float32Array(n * 3), rep = new Int32Array(n), key = new Map();
    for (let i = 0; i < n; i++) { const k = Math.round(P.getX(i) * 2e4) + ',' + Math.round(P.getY(i) * 2e4) + ',' + Math.round(P.getZ(i) * 2e4); let r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; }
    const tn = ix ? ix.count : n, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let t = 0; t < tn; t += 3) { const i0 = ix ? ix.getX(t) : t, i1 = ix ? ix.getX(t + 1) : t + 1, i2 = ix ? ix.getX(t + 2) : t + 2; a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1).sub(a); c.fromBufferAttribute(P, i2).sub(a); b.cross(c); for (const i of [i0, i1, i2]) { const r = rep[i] * 3; acc[r] += b.x; acc[r + 1] += b.y; acc[r + 2] += b.z; } }
    const N = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const r = rep[i] * 3, l = Math.hypot(acc[r], acc[r + 1], acc[r + 2]) || 1; N[i * 3] = acc[r] / l; N[i * 3 + 1] = acc[r + 1] / l; N[i * 3 + 2] = acc[r + 2] / l; }
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  }
  // [뼈, 지금 시작점, 지금 끝점, 쉬는 시작 관절, 쉬는 끝 관절, 기준(R=어깨 좌우, F=몸 앞), 부모]
  const DEF = [
    ['hips', 'hip', 'chest', 'hips', 'chest', 'R', null], ['spine', 'hip', 'chest', 'spine', 'chest', 'R', 'hips'], ['chest', 'chest', 'neck', 'chest', 'neck', 'R', 'spine'],
    ['neck', 'neck', 'head', 'neck', 'head', 'R', 'chest'], ['head', 'neck', 'head', 'head', 'top', 'R', 'neck'],
  ];
  for (const s of ['L', 'R']) DEF.push(
    ['shoulder.' + s, 'chest', 'sh' + s, 'clav.' + s, 'shoulder.' + s, 'F', 'chest'], ['upperarm.' + s, 'sh' + s, 'elbow' + s, 'shoulder.' + s, 'elbow.' + s, 'F', 'shoulder.' + s],
    ['forearm.' + s, 'elbow' + s, 'hand' + s, 'elbow.' + s, 'wrist.' + s, 'F', 'upperarm.' + s], ['hand.' + s, 'elbow' + s, 'hand' + s, 'wrist.' + s, 'tip.' + s, 'F', 'forearm.' + s],
    ['thigh.' + s, 'hip', 'knee' + s, 'hipj.' + s, 'knee.' + s, 'F', 'hips'], ['shin.' + s, 'knee' + s, 'foot' + s, 'knee.' + s, 'ankle.' + s, 'F', 'thigh.' + s],
    ['foot.' + s, null, null, 'ankle.' + s, 'toe.' + s, 'S', 'shin.' + s]);
  const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
  function frameQ(d, r, out) {   // y = 뼈 방향, x = 기준을 뼈에 수직으로
    _y.copy(d).normalize(); _x.copy(r).addScaledVector(_y, -r.dot(_y));
    if (_x.lengthSq() < 1e-6) { _x.set(0, 0, 1).addScaledVector(_y, -_y.z); if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0); }
    _x.normalize(); _z.crossVectors(_x, _y); _m.makeBasis(_x, _y, _z); return out.setFromRotationMatrix(_m);
  }
  const R0 = new THREE.Vector3(-1, 0, 0), F0 = new THREE.Vector3(0, 0, 1);
  function init(scene) {
    if (!J || !window.GLTFLoaderClass) return;
    loadGLB('assets/models/hero.glb').then(g => {
      const root = g.scene;
      root.traverse(o => {
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; smoothNormals(o.geometry); const m = o.material; m.roughness = 0.85; m.metalness = 0; if (m.map) { m.map.anisotropy = 16; m.map.needsUpdate = true; } }
        if (o.isBone) S.bones[o.name.replace('.', '')] = o;   // 불러오면 이름의 점이 빠진다 (shoulder.L → shoulderL)
      });
      scene.add(root); root.updateMatrixWorld(true);
      for (const d of DEF) { const b = S.bones[d[0].replace('.', '')]; if (!b) { console.warn('no bone', d[0]); return; } S.restQ[d[0]] = b.getWorldQuaternion(new THREE.Quaternion()); }
      S.rig = S.bones.hips.parent; S.root = root;
      // 쉬는 자세 틀(뼈 방향 + 기준)
      for (const d of DEF) { const ref = d[5] === 'R' ? R0 : d[5] === 'F' ? F0 : V(J['knee.' + d[0].slice(-1)]).sub(V(J['ankle.' + d[0].slice(-1)])); d.q0 = frameQ(V(J[d[4]]).sub(V(J[d[3]])), ref, new THREE.Quaternion()); }
      S.ready = true; if (window.BODY) BODY.heroReady();
    }).catch(e => console.warn('hero load', e));
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _hp = new THREE.Vector3();
  function update(pts) {
    if (!S.ready) return;
    const P = n => _a.set(pts[n].x, pts[n].y, pts[n].z).clone();
    _r.copy(P('shR')).sub(P('shL')).normalize(); _u.copy(P('head')).sub(P('hip')).normalize(); _f.crossVectors(_u, _r).normalize();
    for (const d of DEF) {
      let dir, ref;
      if (d[5] === 'S') {   // 발: 발끝은 몸 앞을 정강이에 수직으로
        const s = d[0].slice(-1), shin = P('knee' + s).sub(P('foot' + s)).normalize();
        dir = _f.clone().addScaledVector(shin, -_f.dot(shin)); if (dir.lengthSq() < 1e-4) dir.copy(_f); ref = shin;
      } else { dir = P(d[2]).sub(P(d[1])); ref = d[5] === 'R' ? _r : _f; }
      frameQ(dir, ref, _q); _q2.copy(d.q0).invert(); _q.multiply(_q2).multiply(S.restQ[d[0]]);   // 지금 틀 × 쉬는 틀⁻¹ × 쉬는 세계 회전
      (S.want[d[0]] || (S.want[d[0]] = new THREE.Quaternion())).copy(_q);
    }
    S.rig.updateWorldMatrix(true, false); S.rig.getWorldQuaternion(_pq);
    for (const d of DEF) {
      const b = S.bones[d[0].replace('.', '')], par = d[6] ? S.want[d[6]] : _pq;
      b.quaternion.copy(par).invert().multiply(S.want[d[0]]);
    }
    // 엉덩이 뼈 자리 = 물리 몸 엉덩이
    _hp.set(pts.hip.x, pts.hip.y, pts.hip.z); S.rig.worldToLocal(_hp); S.bones.hips.position.copy(_hp);
    S.root.updateMatrixWorld(true);
  }
  function bonePos(n, out) { return S.bones[n.replace('.', '')].getWorldPosition(out || new THREE.Vector3()); }
  window.HERO = { S, init, update, bonePos };
})();
