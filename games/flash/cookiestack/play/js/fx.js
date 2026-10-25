// 효과: PERFECT 형광 테 번짐 + 점토 알갱이 튐, 받침 쿵 먼지.
(function () {
  const F = (window.FX = {});
  const list = [];
  const FW = ['#ff3fa4', '#ffe62e', '#7dff3a', '#18e8ff', '#c45bff', '#ff7a1a'];
  let ringGeo = null, dotGeo = null, sprGeo = null, crumbGeo = null;
  function ringMat(c) { return new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1, depthWrite: false, fog: false, side: THREE.DoubleSide }); }
  // 블록 테두리 모양 고리(네모난 형광 테가 바깥으로 퍼진다)
  function frame(w, d, t) {
    const s = new THREE.Shape(), r = 0.2, W = w / 2 + t, H = d / 2 + t;
    s.moveTo(-W + r, -H); s.lineTo(W - r, -H); s.quadraticCurveTo(W, -H, W, -H + r); s.lineTo(W, H - r); s.quadraticCurveTo(W, H, W - r, H); s.lineTo(-W + r, H); s.quadraticCurveTo(-W, H, -W, H - r); s.lineTo(-W, -H + r); s.quadraticCurveTo(-W, -H, -W + r, -H);
    const h = new THREE.Path(), iw = w / 2 + 0.02, ih = d / 2 + 0.02;
    h.moveTo(-iw, -ih); h.lineTo(-iw, ih); h.lineTo(iw, ih); h.lineTo(iw, -ih); h.lineTo(-iw, -ih);
    s.holes.push(h);
    const g = new THREE.ShapeGeometry(s, 6); g.rotateX(-Math.PI / 2);
    return g;
  }
  F.perfect = function (b, combo) {
    const col = b.mesh.material.color.clone().lerp(new THREE.Color('#ffffff'), 0.35);
    const n = Math.min(3, 1 + Math.floor(combo / 3));
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(frame(b.w, b.d, 0.16), ringMat(col));
      m.position.set(b.x, b.y0 + 0.04, b.z); m.renderOrder = 5;
      RND.scene.add(m);
      list.push({ m, t: -i * 0.12, life: 0.7, kind: 'ring' });
    }
    // 형광 스프링클이 사방으로 튄다
    if (!sprGeo) sprGeo = new THREE.CapsuleGeometry(0.045, 0.2, 2, 6);
    const ice = b.mesh.children[0] ? b.mesh.children[0].material : b.mesh.material;
    const k = Math.min(20, 8 + combo * 2);
    for (let i = 0; i < k; i++) {
      const a = Math.random() * Math.PI * 2;
      const m = new THREE.Mesh(sprGeo, i % 3 ? ice : CLAY.mat(FW[i % FW.length], { rough: 0.4, ns: 0.2, emis: FW[i % FW.length], ei: 0.5 }));
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      const ex = Math.cos(a), ez = Math.sin(a);
      m.position.set(b.x + ex * b.w * 0.5, b.y1, b.z + ez * b.d * 0.5);
      RND.scene.add(m);
      list.push({ m, t: 0, life: 0.9, kind: 'dot', v: new THREE.Vector3(ex * (2 + Math.random() * 2), 3 + Math.random() * 3, ez * (2 + Math.random() * 2)) });
    }
  };
  // 잘린 자리에서 쿠키 부스러기
  F.crumbs = function (x, y, z, dough, ax, k) {
    if (!crumbGeo) crumbGeo = CLAY.ball(0.07, 7, 0.02, 5);
    const mat = CLAY.mat(dough ? '#7a4426' : '#e8ae5e', { rough: 0.8, ns: 0.5 });
    const n = 6 + Math.round(k * 12);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(crumbGeo, mat); const sc = 0.6 + Math.random() * 1.2;
      m.position.set(x + (ax === 'z' ? (Math.random() - 0.5) * 2.4 : 0), y + (Math.random() - 0.5) * 0.3, z + (ax === 'x' ? (Math.random() - 0.5) * 2.4 : 0));
      RND.scene.add(m);
      list.push({ m, t: 0, life: 1.0, kind: 'dot', s0: sc, g: 22, v: new THREE.Vector3((Math.random() - 0.5) * 3, 1 + Math.random() * 2.5, (Math.random() - 0.5) * 3) });
    }
  };
  F.slam = function (b) {
    if (!dotGeo) dotGeo = CLAY.ball(0.11, 8, 0.01, 3);
    const mat = CLAY.mat('#fff8ee', { rough: 0.5, ns: 0.6 });
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const m = new THREE.Mesh(dotGeo, mat); m.scale.setScalar(1.3);
      m.position.set(b.x + Math.cos(a) * b.w * 0.55, b.y0 + 0.1, b.z + Math.sin(a) * b.d * 0.55);
      RND.scene.add(m);
      list.push({ m, t: 0, life: 0.7, kind: 'dot', v: new THREE.Vector3(Math.cos(a) * 4.5, 1.5 + Math.random() * 1.5, Math.sin(a) * 4.5) });
    }
    const m = new THREE.Mesh(frame(b.w, b.d, 0.22), ringMat(new THREE.Color('#ffffff')));
    m.position.set(b.x, b.y0 + 0.03, b.z); RND.scene.add(m);
    list.push({ m, t: 0, life: 0.6, kind: 'ring' });
  };
  // 엔딩 축포: 형광 점토 알갱이가 둥글게 터진다
  F.firework = function (y) {
    if (!dotGeo) dotGeo = CLAY.ball(0.11, 8, 0.01, 3);
    const c = FW[(Math.random() * FW.length) | 0], mat = CLAY.mat(c, { rough: 0.4, ns: 0.3, emis: c, ei: 0.9 });
    const a0 = Math.random() * Math.PI * 2, cx = Math.cos(a0) * (4 + Math.random() * 4), cz = Math.sin(a0) * (4 + Math.random() * 4);
    for (let i = 0; i < 26; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), sp = 5 + Math.random() * 2;
      const m = new THREE.Mesh(dotGeo, mat); m.scale.setScalar(1.8); m.position.set(cx, y, cz); RND.scene.add(m);
      list.push({ m, t: 0, life: 1.3, kind: 'dot', s0: 1.8, v: new THREE.Vector3(Math.cos(a) * s * sp, u * sp + 2, Math.sin(a) * s * sp), g: 4 });
    }
  };
  F.step = function (dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i]; e.t += dt;
      if (e.t < 0) { e.m.visible = false; continue; }
      e.m.visible = true;
      const u = e.t / e.life;
      if (e.kind === 'ring') { const s = 1 + u * 0.9; e.m.scale.set(s, 1, s); e.m.material.opacity = Math.max(0, 1 - u); }
      else { e.v.y -= (e.g || 16) * dt; e.m.position.addScaledVector(e.v, dt); e.m.scale.setScalar(Math.max(0.01, (e.s0 || 1) * (1 - u * u))); }
      if (u >= 1) { RND.scene.remove(e.m); if (e.kind === 'ring') { e.m.geometry.dispose(); e.m.material.dispose(); } list.splice(i, 1); }
    }
  };
})();
