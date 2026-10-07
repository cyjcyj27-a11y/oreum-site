// 잡동사니: 장면을 빽빽하게 채우는 소품(찾을 물건과 겹치지 않는 종류만)
(function () {
  const T = THREE;
  const { rbox, mesh, group, mat, tex, shade, pick } = K;
  const C = (window.CLUT = {});
  const m = (c, o) => mat(c, Object.assign({ roughness: 0.6 }, o || {}));

  // 유리병(잼·구슬·단추)
  C.jar = (g, r) => {
    const fill = pick(r, ['#c8323a', '#f0a830', '#6a9a3a', '#7a4ad8', '#3a8ad8', '#e8e0c8']);
    const h = 0.4 + r() * 0.25;
    mesh(K.cyl(0.16, 0.16, h * 0.7, 16), m(fill, { roughness: 0.4 }), 0, h * 0.35, 0, g);
    mesh(K.cyl(0.18, 0.18, h, 18), new T.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.05, transparent: true, opacity: 0.3 }), 0, h / 2, 0, g);
    mesh(K.cyl(0.17, 0.17, 0.08, 16), m(pick(r, ['#c9a24a', '#d8d8d8', '#c8323a']), { metalness: 0.5, roughness: 0.4 }), 0, h + 0.04, 0, g);
    mesh(K.cyl(0.185, 0.185, 0.14, 16), m('#f6eed8'), 0, h * 0.5, 0, g);
  };
  // 나무 궤짝
  C.crate = (g, r) => {
    const w = 0.8 + r() * 0.3, h = 0.55 + r() * 0.2;
    const wd = m(pick(r, ['#b98a5a', '#a87a4a', '#c9a070']), { roughness: 0.8 });
    const dk = m('#7a5232', { roughness: 0.8 });
    mesh(rbox(w, h, w * 0.75, 0.02), wd, 0, h / 2, 0, g);
    [-1, 1].forEach((s) => { mesh(rbox(0.08, h + 0.01, w * 0.75 + 0.02, 0.01), dk, s * (w / 2 - 0.04), h / 2, 0, g); });
    [0.3, 0.7].forEach((t) => mesh(K.box(w + 0.01, 0.04, w * 0.75 + 0.01), dk, 0, h * t, 0, g));
  };
  // 선물 상자
  C.gift = (g, r) => {
    const s = 0.4 + r() * 0.25, col = pick(r, ['#3a8ad8', '#d8323a', '#3aa86a', '#e8a830', '#9a4ad8']);
    mesh(rbox(s, s * 0.8, s, 0.02), m(col, { roughness: 0.5 }), 0, s * 0.4, 0, g);
    const rb = m(pick(r, ['#fff4c8', '#f0d040', '#ffffff']), { roughness: 0.4 });
    mesh(K.box(s + 0.01, s * 0.8 + 0.01, 0.07), rb, 0, s * 0.4, 0, g);
    mesh(K.box(0.07, s * 0.8 + 0.01, s + 0.01), rb, 0, s * 0.4, 0, g);
    [-1, 1].forEach((d) => { const b = mesh(K.torus(0.07, 0.025), rb, d * 0.07, s * 0.8 + 0.05, 0, g); b.rotation.y = Math.PI / 2; b.rotation.x = d * 0.5; });
  };
  // 지구본
  C.globe = (g, r) => {
    const t = tex(256, 128, (c, W, H) => {
      c.fillStyle = '#4a8ad0'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#d8c070';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(r() * W, 20 + r() * (H - 40), 14 + r() * 26, 8 + r() * 18, r() * 3, 0, 7); c.fill(); }
    });
    mesh(K.cyl(0.18, 0.22, 0.06, 16), m('#5a3420'), 0, 0.03, 0, g);
    mesh(K.cyl(0.025, 0.025, 0.22, 6), m('#5a3420'), 0, 0.14, 0, g);
    const ring = mesh(K.torus(0.33, 0.018, Math.PI), m('#c9a24a', { metalness: 0.6, roughness: 0.3 }), 0, 0.55, 0, g); ring.rotation.z = Math.PI / 2 + 0.4;
    mesh(K.sphere(0.3, 24, 16), new T.MeshStandardMaterial({ map: t, roughness: 0.45 }), 0, 0.55, 0, g).rotation.z = 0.4;
  };
  // 석유 등잔
  C.lantern = (g, r) => {
    const mt = m(pick(r, ['#3a3a3a', '#7a2a2a', '#2a4a3a']), { metalness: 0.5, roughness: 0.4 });
    mesh(K.cyl(0.2, 0.24, 0.12, 14), mt, 0, 0.06, 0, g);
    mesh(K.cyl(0.15, 0.15, 0.36, 14), new T.MeshStandardMaterial({ color: 0xfff0c8, roughness: 0.1, transparent: true, opacity: 0.45, emissive: 0x332200 }), 0, 0.3, 0, g);
    [0, 1.57, 3.14, 4.71].forEach((a) => mesh(K.cyl(0.015, 0.015, 0.38, 4), mt, Math.cos(a) * 0.16, 0.3, Math.sin(a) * 0.16, g));
    mesh(K.cone(0.2, 0.16, 14), mt, 0, 0.56, 0, g);
    const h = mesh(K.torus(0.1, 0.015, Math.PI), mt, 0, 0.64, 0, g);
  };
  // 새장
  C.cage = (g, r) => {
    const gd = m('#c9a24a', { metalness: 0.6, roughness: 0.35 });
    mesh(K.cyl(0.32, 0.34, 0.06, 18), gd, 0, 0.03, 0, g);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; mesh(K.cyl(0.008, 0.008, 0.6, 4), gd, Math.cos(a) * 0.3, 0.33, Math.sin(a) * 0.3, g); }
    mesh(new T.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.6, roughness: 0.35, wireframe: true }), 0, 0.62, 0, g);
    mesh(K.torus(0.06, 0.015), gd, 0, 0.95, 0, g);
    mesh(K.cyl(0.01, 0.01, 0.5, 4), m('#5a3420'), 0, 0.35, 0, g).rotation.z = Math.PI / 2;
  };
  // 바구니
  C.basket = (g, r) => {
    const t = tex(128, 64, (c, W, H) => { c.fillStyle = '#c9984a'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(90,50,20,0.45)'; for (let y = 0; y < H; y += 8) for (let x = (y / 8) % 2 * 8; x < W; x += 16) c.fillRect(x, y, 8, 4); });
    const b = new T.MeshStandardMaterial({ map: t, roughness: 0.9, side: T.DoubleSide });
    mesh(new T.CylinderGeometry(0.4, 0.3, 0.38, 20, 1, true), b, 0, 0.19, 0, g);
    mesh(K.cyl(0.3, 0.3, 0.02, 18), b, 0, 0.01, 0, g);
    mesh(K.torus(0.4, 0.03), m('#a87a3a'), 0, 0.38, 0, g).rotation.x = Math.PI / 2;
    const h = mesh(K.torus(0.36, 0.025, Math.PI), m('#a87a3a'), 0, 0.38, 0, g);
    const cl = mesh(rbox(0.5, 0.12, 0.4, 0.05), m(pick(r, ['#e8d0b0', '#c8504a', '#5a8ad0'])), 0, 0.34, 0, g); cl.rotation.y = r();
  };
  // 꽃병
  C.vase = (g, r) => {
    const col = pick(r, ['#3a6ab0', '#e8e0d0', '#5a8a7a', '#c8704a']);
    mesh(K.lathe('vase', [[0, 0], [0.14, 0], [0.2, 0.15], [0.17, 0.38], [0.09, 0.5], [0.12, 0.58], [0, 0.58]]), m(col, { roughness: 0.25 }), 0, 0, 0, g);
    const st = m('#4a7a3a');
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3, l = 0.3 + r() * 0.15;
      const s = mesh(K.cyl(0.01, 0.01, l, 4), st, Math.cos(a) * 0.04, 0.58 + l / 2, Math.sin(a) * 0.04, g); s.rotation.z = Math.cos(a) * 0.3; s.rotation.x = Math.sin(a) * 0.3;
      mesh(K.sphere(0.06, 8, 6), m(pick(r, ['#f0e060', '#f8f8f0', '#e85a7a', '#f09040'])), Math.cos(a) * (0.04 + l * 0.3), 0.58 + l * 0.95, Math.sin(a) * (0.04 + l * 0.3), g);
    }
  };
  // 접시 더미
  C.plates = (g, r) => {
    const c = pick(r, ['#f6f2ea', '#e8f0f6', '#f6eaea']);
    const n = 3 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) mesh(K.cyl(0.32, 0.24, 0.05, 22), m(c, { roughness: 0.2 }), (r() - 0.5) * 0.03, 0.03 + i * 0.055, 0, g);
    mesh(K.torus(0.29, 0.012), m('#3a6ab0'), 0, 0.06 + (n - 1) * 0.055, 0, g).rotation.x = Math.PI / 2;
  };
  // 옛 라디오
  C.radio = (g, r) => {
    const w = m(pick(r, ['#8a4a2a', '#6a3a22', '#c8a070']), { roughness: 0.4 });
    mesh(rbox(0.7, 0.45, 0.3, 0.1), w, 0, 0.225, 0, g);
    const sp = tex(64, 64, (c, W, H) => { c.fillStyle = '#e8d8b0'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(80,50,20,0.5)'; c.lineWidth = 2; for (let y = 4; y < H; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } });
    mesh(K.box(0.32, 0.28, 0.02), new T.MeshStandardMaterial({ map: sp, roughness: 0.9 }), -0.14, 0.24, 0.155, g);
    [0.18, 0.26].forEach((x, i) => { const k = mesh(K.cyl(0.04, 0.04, 0.05, 10), m('#2a2a2a'), x, 0.16 + i * 0.12, 0.17, g); k.rotation.x = Math.PI / 2; });
  };
  // 책 더미
  C.books = (g, r) => {
    let y = 0;
    const n = 2 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const h = 0.08 + r() * 0.06;
      const b = mesh(rbox(0.55 + r() * 0.2, h, 0.4 + r() * 0.1, 0.015), m(pick(r, ['#8a2a2a', '#2a4a6a', '#5a6a3a', '#a8783a', '#3a2a4a', '#c8a86a', '#2a6a6a'])), (r() - 0.5) * 0.06, y + h / 2, 0, g);
      b.rotation.y = (r() - 0.5) * 0.5;
      y += h;
    }
  };
  // 방석·쿠션
  C.cushion = (g, r) => {
    const c = pick(r, ['#c8504a', '#5a8ad0', '#e8c060', '#7a5a9a', '#4a9a7a']);
    const cu = mesh(K.sphere(0.35, 18, 12), m(c, { roughness: 0.95 }), 0, 0.12, 0, g); cu.scale.set(1, 0.34, 1);
    mesh(K.sphere(0.04, 8, 6), m(shade(c, -0.3)), 0, 0.24, 0, g);
  };
  // 털실 뭉치
  C.yarn = (g, r) => {
    const c = pick(r, ['#e86a7a', '#6ab0e8', '#f0c050', '#8ad06a', '#b07ad8']);
    mesh(K.sphere(0.2, 16, 12), m(c, { roughness: 1 }), 0, 0.2, 0, g);
    for (let i = 0; i < 4; i++) { const t = mesh(K.torus(0.2, 0.012), m(shade(c, -0.15), { roughness: 1 }), 0, 0.2, 0, g); t.rotation.set(r() * 3, r() * 3, 0); }
  };
  // 찻주전자
  C.teapot = (g, r) => {
    const c = m(pick(r, ['#f4f0e6', '#4a7ab0', '#c8504a', '#5a8a6a']), { roughness: 0.25 });
    const b = mesh(K.sphere(0.24, 18, 14), c, 0, 0.22, 0, g); b.scale.set(1, 0.85, 1);
    mesh(K.cyl(0.13, 0.15, 0.06, 14), c, 0, 0.42, 0, g);
    mesh(K.sphere(0.04, 8, 6), c, 0, 0.47, 0, g);
    const sp = mesh(K.cyl(0.03, 0.05, 0.26, 8), c, 0.28, 0.27, 0, g); sp.rotation.z = -0.9;
    const h = mesh(K.torus(0.1, 0.025, Math.PI * 1.2), c, -0.24, 0.24, 0, g); h.rotation.z = Math.PI / 2;
  };
  // 화분 (작은 다육)
  C.pot = (g, r) => { P.plant(g, 0, 0, 0.42 + r() * 0.15, r, { noBlob: 1, pot: pick(r, ['#d9774c', '#5a8ab0', '#e8e0d0', '#7a9a5a']), leaf: pick(r, ['#4f9a58', '#5aa87a', '#3a7a4a']), leaves: 6 + Math.floor(r() * 5) }); };
  // 깡통
  C.tin = (g, r) => {
    const c = pick(r, ['#d8323a', '#3a6ab0', '#e8b030', '#3a8a5a']);
    mesh(K.cyl(0.17, 0.17, 0.36, 16), m('#c9cdd2', { metalness: 0.7, roughness: 0.3 }), 0, 0.18, 0, g);
    mesh(K.cyl(0.172, 0.172, 0.22, 16), m(c), 0, 0.18, 0, g);
  };
  // 장난감 블록
  C.blocks = (g, r) => {
    const cs = ['#e84a4a', '#3a8ad8', '#f0c030', '#4ab86a'];
    for (let i = 0; i < 3; i++) { const b = mesh(rbox(0.26, 0.26, 0.26, 0.03), m(pick(r, cs), { roughness: 0.4 }), (i % 2) * 0.28 - 0.14, 0.13 + (i === 2 ? 0.26 : 0), 0, g); b.rotation.y = (r() - 0.5) * 0.6; }
  };
  // 둘둘 만 종이
  C.scroll = (g, r) => {
    const c = m(pick(r, ['#f2e6c8', '#e8d0a0', '#f8f4ea']), { roughness: 0.9 });
    for (let i = 0; i < 3; i++) { const s = mesh(K.cyl(0.07, 0.07, 0.7, 12), c, 0, 0.07, (i - 1) * 0.15, g); s.rotation.z = Math.PI / 2; s.rotation.y = (r() - 0.5) * 0.4; }
    const s2 = mesh(K.cyl(0.07, 0.07, 0.6, 12), c, 0, 0.2, 0, g); s2.rotation.z = Math.PI / 2;
  };
  // 세운 액자
  C.frame = (g, r) => {
    const pics = Object.keys(P.pics);
    const f = P.frame(g, 0, 0.35, 0, 0.6, 0.7, P.pics[pick(r, pics)], { color: pick(r, ['#c9a24a', '#5a3420', '#f4f0e6']) });
    f.rotation.x = -0.18; f.position.z = -0.06;
  };
  // 실타래 상자(반짇고리)
  C.sewbox = (g, r) => {
    const c = m(pick(r, ['#c8504a', '#5a7ab0', '#a87a4a']), { roughness: 0.5 });
    mesh(rbox(0.6, 0.26, 0.42, 0.04), c, 0, 0.13, 0, g);
    const cs = ['#f0e060', '#e85a7a', '#5ab0e8', '#8ad06a'];
    for (let i = 0; i < 4; i++) { const s = mesh(K.cyl(0.05, 0.05, 0.12, 10), m(cs[i]), -0.2 + i * 0.13, 0.3, 0, g); s.rotation.x = Math.PI / 2; }
  };

  // 실제 크기(가장 긴 변)
  const SZ = { jar: 0.5, crate: 0.95, gift: 0.55, globe: 0.75, lantern: 0.62, cage: 0.85, basket: 0.75, vase: 0.78, plates: 0.6, radio: 0.68, books: 0.62, cushion: 0.7, yarn: 0.38, teapot: 0.58, pot: 0.62, tin: 0.42, blocks: 0.55, scroll: 0.62, frame: 0.72, sewbox: 0.58 };
  C.all = Object.keys(C);
  C.size = (name) => SZ[name] || 0.6;
  // 장면이 쓰는 이름 목록에서 하나 만들기 (크기 sz 로 맞춤)
  C.make = function (name, r, sz) {
    const g = new T.Group(), inner = new T.Group();
    g.add(inner);
    C[name](inner, r);
    inner.updateMatrixWorld(true);
    const box = new T.Box3();
    inner.traverse((x) => { if (x.isMesh && !(x.material.transparent && x.material.depthWrite === false)) box.expandByObject(x); });
    const s = box.getSize(new T.Vector3());
    const k = sz ? sz / Math.max(s.x, s.y, s.z) : 1;
    inner.scale.setScalar(k);
    const c = box.getCenter(new T.Vector3());
    inner.position.set(-c.x * k, -box.min.y * k + 0.003, -c.z * k);
    g.userData.foot = Math.max(s.x, s.z) * k * 0.5;
    g.userData.h = s.y * k;
    g.userData.clutter = name;
    g.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    return g;
  };
})();
