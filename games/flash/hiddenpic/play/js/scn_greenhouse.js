// 장면 6: 온실 (유리벽·화분 선반·꽃밭·손수레)
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;

  function glassWall(night, r) {
    return tex(512, 512, (c, W, H) => {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, night ? '#1b2350' : '#bfe4f6'); g.addColorStop(0.6, night ? '#2a3a6a' : '#e8f6ff'); g.addColorStop(0.62, night ? '#1a2a22' : '#8ac07a'); g.addColorStop(1, night ? '#142018' : '#5a9a5a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = night ? 'rgba(20,40,30,0.9)' : 'rgba(70,130,70,0.85)';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(r() * W, H * 0.62, 30 + r() * 40, Math.PI, 0); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.18)';
      for (let i = 0; i < 6; i++) { c.save(); c.translate(r() * W, r() * H * 0.5); c.rotate(-0.6); c.fillRect(0, 0, 8, 120); c.restore(); }
      c.strokeStyle = '#f4f4ee'; c.lineWidth = 10;
      for (let x = 0; x <= W; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y <= H; y += 170) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    }, [2, 1.2]);
  }
  function bigPlant(parent, x, z, s, r, col) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    const lf = mat(col || '#3f8a48', { roughness: 0.6 }), lf2 = mat(shade(col || '#3f8a48', -0.2), { roughness: 0.6 });
    for (let i = 0; i < 9; i++) {
      const st = group(0, 0, 0, g);
      st.rotation.y = i / 9 * Math.PI * 2 + r() * 0.4;
      st.rotation.z = 0.25 + r() * 0.5;
      const l = mesh(K.sphere(0.5, 12, 8), i % 2 ? lf : lf2, 0, 0.6 + r() * 0.4, 0, st);
      l.scale.set(0.3, 0.75, 0.1);
    }
    return g;
  }
  function wateringCan(parent, x, y, z, rot, col) {
    const g = group(x, y, z, parent);
    g.rotation.y = rot;
    const m = mat(col, { roughness: 0.35, metalness: 0.3 });
    mesh(K.cyl(0.22, 0.25, 0.45, 18), m, 0, 0.23, 0, g);
    const sp = mesh(K.cyl(0.03, 0.05, 0.6, 8), m, 0.32, 0.32, 0, g); sp.rotation.z = -0.9;
    mesh(K.cyl(0.07, 0.04, 0.06, 10), m, 0.55, 0.5, 0, g).rotation.z = -0.9;
    mesh(K.torus(0.16, 0.025, Math.PI), m, -0.05, 0.45, 0, g);
    return g;
  }

  SCN.greenhouse = function (ctx) {
    const r = ctx.r, root = ctx.root, night = ctx.opt.night, sp = ctx.spot;
    const pal = pick(r, [{ floor: ['#c8704a', '#b8603a'], bench: '#9a7048', flower: ['#e84a6a', '#f0c040', '#ffffff', '#b06ad8'] }, { floor: ['#b8684a', '#a85a3a'], bench: '#8a6a4a', flower: ['#ff8a3a', '#f8f0f0', '#e84a8a', '#5a8ae8'] }, { floor: ['#c87a52', '#b26a44'], bench: '#a07a52', flower: ['#f04a4a', '#f8e060', '#c88ae8', '#ffffff'] }]);
    ctx.bg(night ? '#1f2a3a' : '#eef6ee', night ? '#121820' : '#cfe0cc');
    P.room(ctx, { floorTex: Q.tiles(pal.floor[0], pal.floor[1], 6, 'rgba(240,220,200,0.6)'), wallTex: glassWall(night, r), wallTex2: glassWall(night, r), slab: '#6a5a4a', wallEdge: '#f4f4ee', baseboard: '#f4f4ee', height: 7 });
    // ── 뒷벽 긴 화분대 + 위 선반
    const pb = group(-0.6, 0, -4.5, root);
    const bw = mat(pal.bench, { roughness: 0.7 });
    mesh(rbox(6.4, 0.12, 0.95, 0.03), bw, 0, 1.3, 0, pb);
    mesh(rbox(6.2, 0.08, 0.85, 0.02), bw, 0, 0.4, 0, pb);
    [-3.0, -1, 1, 3.0].forEach((x) => [-0.38, 0.38].forEach((z) => mesh(rbox(0.1, 1.3, 0.1, 0.02), bw, x, 0.65, z, pb)));
    mesh(rbox(6.4, 0.08, 0.6, 0.02), bw, 0, 3.0, -0.18, pb);
    [-3.0, 3.0].forEach((x) => mesh(rbox(0.08, 1.7, 0.08, 0.02), bw, x, 2.15, -0.38, pb));
    sp(-0.6, 1.38, -4.5, 6.0, 0.8, { max: 0.8, tag: 'bench' });
    sp(-0.6, 0.45, -4.5, 6.0, 0.7, { max: 0.75, tag: 'under' });
    sp(-0.6, 3.05, -4.68, 6.0, 0.45, { max: 0.6, tag: 'upper' });
    blob(root, -0.6, -4.4, 7.2, 1.5, 0.35);
    // 화분대 위 고정 화분 몇 개
    [-2.6, 0.4, 2.2].forEach((x) => P.plant(root, -0.6 + x, -4.6, 0.55, r, { y: 1.36, noBlob: 1, pot: '#c8704a', leaves: 8 }));

    // ── 왼벽 계단식 화분대
    const st = group(-4.3, 0, 0.2, root);
    st.rotation.y = Math.PI / 2;
    [[0, 0.5, 0.55], [0, 1.1, 0.0], [0, 1.7, -0.5]].forEach(([x, y, z], i) => {
      mesh(rbox(3.2, 0.1, 0.55, 0.02), bw, 0, y, z, st);
      const [wx, wz] = Q.toW(-4.3, 0.2, Math.PI / 2, 0, z);
      sp(wx, y + 0.05, wz, 0.45, 3.0, { max: 0.6, tag: 'step' });
    });
    [-1.5, 1.5].forEach((x) => mesh(rbox(0.1, 1.8, 1.6, 0.02), bw, x, 0.9, 0.05, st));
    blob(root, -4.2, 0.2, 2.0, 3.6, 0.35);

    // ── 가운데 꽃밭 상자
    const fb = group(0.5, 0, 0.6, root);
    const fbw = mat('#8a5a32', { roughness: 0.75 });
    mesh(rbox(3.2, 0.7, 1.8, 0.04), fbw, 0, 0.35, 0, fb);
    mesh(rbox(3.0, 0.1, 1.6, 0.03), mat('#4a3020', { roughness: 1 }), 0, 0.68, 0, fb);
    for (let i = 0; i < 16; i++) {
      const fx = -1.3 + (i % 8) * 0.37 + (r() - 0.5) * 0.1, fz = (Math.floor(i / 8) - 0.5) * 0.7 + (r() - 0.5) * 0.15;
      const h = 0.35 + r() * 0.35;
      mesh(K.cyl(0.015, 0.015, h, 4), mat('#3f8a48'), fx, 0.7 + h / 2, fz, fb);
      const fl = mesh(K.sphere(0.11, 10, 8), mat(pick(r, pal.flower), { roughness: 0.6 }), fx, 0.72 + h, fz, fb); fl.scale.y = 0.6;
      const lf = mesh(K.sphere(0.12, 8, 6), mat('#4f9a58'), fx + 0.06, 0.78, fz, fb); lf.scale.set(1, 0.3, 0.5);
    }
    sp(0.5, 0.72, 1.35, 3.0, 0.3, { max: 0.5, tag: 'bedrim' });
    blob(root, 0.5, 0.6, 3.8, 2.4, 0.4);

    // ── 큰 화분 식물 (가림)
    bigPlant(root, 3.5, -2.6, 1.6, r);
    mesh(K.cyl(0.42, 0.34, 0.6, 20), mat('#c8704a', { roughness: 0.8 }), 3.5, 0.3, -2.6, root);
    bigPlant(root, -2.0, 3.6, 1.3, r, '#5aa86a');
    mesh(K.cyl(0.36, 0.3, 0.5, 20), mat('#e8e0d0', { roughness: 0.6 }), -2.0, 0.25, 3.6, root);
    blob(root, 3.5, -2.6, 1.4, 1.4, 0.4); blob(root, -2.0, 3.6, 1.2, 1.2, 0.4);

    // ── 손수레
    const wb = group(3.2, 0, 1.6, root);
    wb.rotation.y = -0.9;
    const wm = mat(pick(r, ['#2a8a4a', '#d8402a', '#2a6ad8']), { roughness: 0.4, metalness: 0.3 });
    mesh(new T.CylinderGeometry(0.75, 0.45, 0.5, 4, 1, true), new T.MeshStandardMaterial({ color: wm.color, roughness: 0.4, metalness: 0.3, side: T.DoubleSide }), 0, 0.75, 0, wb).rotation.y = Math.PI / 4;
    mesh(K.box(0.62, 0.04, 0.62), wm, 0, 0.5, 0, wb);
    const wh = mesh(K.torus(0.22, 0.07), mat('#1e1e22'), 0, 0.29, 0.75, wb); wh.rotation.y = Math.PI / 2;
    [-0.25, 0.25].forEach((x) => { const h = mesh(K.cyl(0.03, 0.03, 1.6, 6), mat('#8a5a32'), x, 0.7, -0.4, wb); h.rotation.x = 1.25; });
    mesh(K.box(0.6, 0.1, 0.6), mat('#4a3020', { roughness: 1 }), 0, 0.88, 0, wb);
    sp(3.2, 0.95, 1.6, 0.5, 0.5, { max: 0.5, tag: 'barrow' });
    blob(root, 3.2, 1.6, 1.6, 2.0, 0.4);

    // ── 흙 포대 + 물뿌리개
    [[-3.4, -3.5], [-2.8, -3.7]].forEach(([x, z], i) => { const sk = mesh(rbox(0.8, 0.5, 0.6, 0.18), mat(i ? '#c9b48a' : '#b8a070', { roughness: 1 }), x, 0.25, z, root); sk.rotation.y = r(); });
    sp(-3.1, 0.52, -3.6, 0.9, 0.5, { max: 0.5, tag: 'sack' });
    wateringCan(root, 1.6, 0, 3.2, 0.5, '#2a7ad8');
    wateringCan(root, -3.6, 1.75, -0.4, 1.2, '#e8a020');

    // ── 앞 오른쪽 정원 의자
    const gb = group(2.9, 0, 3.7, root);
    gb.rotation.y = -Math.PI / 2;
    const gw = mat('#f2f0ea', { roughness: 0.5 });
    mesh(rbox(2.2, 0.1, 0.8, 0.03), gw, 0, 0.75, 0, gb);
    mesh(rbox(2.2, 0.7, 0.08, 0.03), gw, 0, 1.15, -0.38, gb);
    [[-0.95, -0.3], [0.95, -0.3], [-0.95, 0.3], [0.95, 0.3]].forEach(([x, z]) => mesh(rbox(0.08, 0.75, 0.08, 0.02), gw, x, 0.37, z, gb));
    sp(2.95, 0.81, 3.7, 0.6, 2.0, { max: 0.7, tag: 'bench' });
    blob(root, 2.9, 3.7, 1.2, 2.6, 0.35);
    // 쌓은 빈 화분
    const sp2 = group(-0.9, 0, 4.2, root);
    for (let i = 0; i < 4; i++) mesh(new T.CylinderGeometry(0.34, 0.26, 0.4, 16, 1, true), new T.MeshStandardMaterial({ color: 0xc8704a, roughness: 0.8, side: T.DoubleSide }), 0, 0.2 + i * 0.14, 0, sp2);
    blob(root, -0.9, 4.2, 0.9, 0.9, 0.35);

    // ── 바닥 자리
    sp(0.7, 0.01, 3.0, 2.4, 1.2, { max: 0.95, tag: 'floor' });
    sp(0.9, 0.01, 4.3, 1.6, 0.9, { max: 0.9, tag: 'floor' });
    sp(-2.6, 0.01, -0.6, 0.9, 1.4, { max: 0.85, tag: 'floor' });
    sp(-1.6, 0.01, -2.6, 2.4, 1.2, { max: 0.9, tag: 'floor' });
    sp(2.0, 0.01, -2.6, 1.0, 1.2, { max: 0.9, tag: 'floor' });
    sp(-2.6, 0.01, 1.8, 0.9, 1.6, { max: 0.85, tag: 'floor' });
    sp(2.2, 0.01, -0.6, 1.0, 1.0, { max: 0.85, tag: 'floor' });

    if (night) {
      [[-1, -1], [1.5, 1.5]].forEach(([x, z]) => { const pl = ctx.light(new T.PointLight(0xffe0a0, 10, 11, 1.3)); pl.position.set(x, 5.2, z); });
      ctx.sun.intensity = 0.55; ctx.sun.color.set(0x8fa0ff); ctx.hemi.intensity = 0.3; ctx.env = 0.4;
    } else { ctx.sun.intensity = 3.8; ctx.hemi.intensity = 0.65; }
    return { view: { fit: 6.0, ly: 2.1 }, density: 1.4, clutter: ['pot', 'basket', 'vase', 'crate', 'tin', 'jar', 'cage', 'lantern', 'teapot', 'yarn', 'books', 'scroll'] };
  };
})();
