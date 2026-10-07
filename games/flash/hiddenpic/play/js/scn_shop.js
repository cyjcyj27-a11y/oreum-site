// 장면 2: 문방구
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;

  SCN.shop = function (ctx) {
    const r = ctx.r, root = ctx.root, night = ctx.opt.night, sp = ctx.spot;
    const pal = pick(r, [
      { wall: '#cfe6d8', wall2: '#f6e3b8', floor: ['#e8dcc8', '#c8503a'], shelf: '#e8e2d6', counter: '#3a7ab0' },
      { wall: '#f4d6cf', wall2: '#d6e4f4', floor: ['#ece4d4', '#3a6a9a'], shelf: '#f2ece0', counter: '#d8503a' },
      { wall: '#e8e0f4', wall2: '#d8f0e4', floor: ['#f0e8d8', '#3a8a6a'], shelf: '#efe6d4', counter: '#e8a030' },
    ]);
    ctx.bg(night ? '#2a2c44' : '#f2ece2', night ? '#191a2c' : '#d9cfc2');
    P.room(ctx, { floorTex: Q.tiles(pal.floor[0], pal.floor[1], 8), wallTex: Q.paint(pal.wall, r), wallTex2: Q.paint(pal.wall2, r, { stripe: 'rgba(255,255,255,0.35)' }), slab: '#5a4a44', wallEdge: '#f4efe6', baseboard: '#6a5a50', height: 7, wainscot: shade(pal.wall, -0.12), wainscotH: 1.2 });

    // ── 간판
    const sign = tex(512, 128, (c, W, H) => {
      c.fillStyle = '#d8382a'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#fff4d0'; c.lineWidth = 8; c.strokeRect(10, 10, W - 20, H - 20);
      c.fillStyle = '#fff4d0'; c.font = 'bold 74px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('문방구', W / 2, H / 2 + 4);
    });
    const sg = mesh(rbox(3.2, 0.8, 0.14, 0.04), [mat('#b8301e'), mat('#b8301e'), mat('#b8301e'), mat('#b8301e'), new T.MeshStandardMaterial({ map: sign, roughness: 0.6, emissive: night ? 0x331010 : 0 }), mat('#b8301e')], -0.55, 5.35, -4.88, root);
    sg.castShadow = false;
    Q.bunting(root, -4.6, 5.6, -4.7, 4.6, -4.7, ['#e84a4a', '#f0c030', '#3a8ad8', '#4ab86a', '#f07ab0'], 16);
    Q.bunting(root, -4.7, 5.6, -4.6, -4.7, 4.4, ['#f0c030', '#3a8ad8', '#e84a4a', '#4ab86a'], 14);

    // ── 뒷벽 큰 진열장 둘
    Q.shelf(ctx, -2.6, -4.5, { w: 3.6, d: 0.85, h: 4.6, levels: 5, color: pal.shelf, books: 0.3, max: 0.75, bookCols: ['#e84a4a', '#3a8ad8', '#f0c030', '#4ab86a', '#9a5ad8', '#f07ab0'] });
    Q.shelf(ctx, 1.4, -4.5, { w: 2.6, d: 0.85, h: 4.6, levels: 5, color: pal.shelf, books: 0, max: 0.75 });
    // ── 문 (뒷벽 오른쪽): 유리문
    const dg = group(3.9, 0, -4.92, root);
    mesh(rbox(1.6, 3.6, 0.12, 0.04), mat('#8a6a4a'), 0, 1.8, 0, dg);
    const gl = mesh(K.box(1.2, 2.6, 0.02), new T.MeshStandardMaterial({ color: night ? 0x1a2450 : 0xbfe6ff, roughness: 0.05, emissive: night ? 0x0a1030 : 0x203040 }), 0, 2.1, 0.07, dg);
    mesh(K.cyl(0.05, 0.05, 0.5, 8), mat('#d9a93a', { metalness: 0.7, roughness: 0.3 }), 0.45, 1.7, 0.14, dg);
    const open = tex(128, 64, (c, W, H) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#d8382a'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('OPEN', W / 2, H / 2 + 2); });
    mesh(K.box(0.6, 0.3, 0.02), new T.MeshStandardMaterial({ map: open }), 0, 2.8, 0.1, dg);

    // ── 왼벽: 진열장 + 걸이판
    Q.shelf(ctx, -4.55, -1.6, { w: 2.8, d: 0.8, h: 3.4, levels: 3, rot: Math.PI / 2, color: pal.shelf, books: 0.35, max: 0.8 });
    const pb = tex(256, 256, (c, W, H) => { c.fillStyle = '#c9a070'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(60,40,20,0.55)'; for (let y = 8; y < H; y += 16) for (let x = 8; x < W; x += 16) { c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); } });
    const peg = mesh(K.box(0.06, 2.4, 3.0), [new T.MeshStandardMaterial({ map: pb }), mat('#c9a070'), mat('#c9a070'), mat('#c9a070'), mat('#c9a070'), mat('#c9a070')], -4.94, 4.4, 2.2, root);
    peg.castShadow = false;
    // 걸이판에 걸린 봉지 장난감(장식)
    const bagC = ['#e84a4a', '#3a8ad8', '#f0c030', '#4ab86a', '#f07ab0', '#9a5ad8'];
    for (let i = 0; i < 9; i++) {
      const y = 3.7 + Math.floor(i / 3) * 0.75, z = 1.3 + (i % 3) * 0.9;
      const bg = mesh(rbox(0.06, 0.6, 0.55, 0.03), mat(pick(r, bagC), { roughness: 0.4 }), -4.86, y, z, root);
      mesh(rbox(0.02, 0.32, 0.32, 0.03), new T.MeshStandardMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.5, roughness: 0.05 }), -4.82, y - 0.04, z, root);
      mesh(K.cyl(0.015, 0.015, 0.2, 4), mat('#888'), -4.86, y + 0.4, z, root).rotation.z = Math.PI / 2;
    }
    Q.shelf(ctx, -4.55, 2.2, { w: 2.8, d: 0.8, h: 1.6, levels: 1, rot: Math.PI / 2, color: pal.shelf, books: 0, max: 0.8 });

    // ── 계산대 (오른쪽, 앞뒤로 길게)
    const ct = group(3.5, 0, 0.6, root);
    const cm = mat(pal.counter, { roughness: 0.45 }), ctop = mat('#f4efe6', { roughness: 0.35 });
    mesh(rbox(1.3, 1.5, 3.6, 0.06), cm, 0, 0.75, 0, ct);
    mesh(rbox(1.5, 0.1, 3.8, 0.03), ctop, 0, 1.55, 0, ct);
    for (let i = 0; i < 4; i++) mesh(rbox(0.02, 1.2, 0.7, 0.02), mat(shade(pal.counter, 0.2)), -0.66, 0.7, -1.3 + i * 0.86, ct);
    // 금전등록기
    const reg = group(0.1, 1.6, 1.2, ct);
    reg.rotation.y = -Math.PI / 2;
    mesh(rbox(0.8, 0.4, 0.6, 0.06), mat('#3a3a40', { roughness: 0.4 }), 0, 0.2, 0, reg);
    mesh(rbox(0.7, 0.3, 0.3, 0.04), mat('#5a5a62', { roughness: 0.4 }), 0, 0.5, -0.12, reg).rotation.x = -0.4;
    mesh(rbox(0.5, 0.18, 0.04, 0.02), mat('#9ad86a', { roughness: 0.2, emissive: 0x204010 }), 0, 0.62, -0.02, reg).rotation.x = -0.4;
    // 사탕 유리병 셋
    [-1.3, -0.75].forEach((z, i) => {
      const jg = group(0.15, 1.6, z, ct);
      mesh(K.cyl(0.24, 0.24, 0.55, 20), new T.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 0.28, 0, jg);
      const cc = ['#e84a4a', '#f0c030', '#4ab86a', '#3a8ad8', '#f07ab0'];
      for (let k = 0; k < 14; k++) mesh(K.sphere(0.06, 8, 6), mat(cc[(k + i) % 5], { roughness: 0.3 }), (r() - 0.5) * 0.3, 0.07 + (k % 5) * 0.08, (r() - 0.5) * 0.3, jg);
      mesh(K.cyl(0.25, 0.25, 0.06, 20), mat('#d8382a'), 0, 0.58, 0, jg);
    });
    sp(3.45, 1.62, 0.05, 1.0, 1.0, { max: 0.75, tag: 'counter' });
    sp(3.45, 1.62, 2.2, 1.0, 0.7, { max: 0.7, tag: 'counter' });
    blob(root, 3.5, 0.6, 2.0, 4.6, 0.4);

    // ── 뽑기 기계 (뒤 오른쪽 구석)
    const gm = group(3.9, 0, -2.8, root);
    gm.rotation.y = -0.5;
    const red = mat('#d8302a', { roughness: 0.35 });
    mesh(rbox(0.9, 1.3, 0.9, 0.06), red, 0, 0.65, 0, gm);
    mesh(K.sphere(0.55, 24, 18), new T.MeshStandardMaterial({ color: 0xeef8ff, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 1.75, 0, gm);
    const capC = ['#ffd23a', '#3ab0e8', '#f07ab0', '#7ad86a', '#ffffff'];
    for (let k = 0; k < 18; k++) { const a = r() * 6.28, rr = r() * 0.38; mesh(K.sphere(0.11, 10, 8), mat(capC[k % 5], { roughness: 0.3 }), Math.cos(a) * rr, 1.38 + (k % 4) * 0.12, Math.sin(a) * rr, gm); }
    mesh(K.cyl(0.14, 0.14, 0.08, 16), mat('#c9cdd2', { metalness: 0.7, roughness: 0.3 }), 0, 0.85, 0.46, gm).rotation.x = Math.PI / 2;
    mesh(K.cyl(0.58, 0.58, 0.1, 24), red, 0, 2.3, 0, gm);
    blob(root, 3.9, -2.8, 1.4, 1.4, 0.4);

    // ── 가운데 진열대 (두 단)
    const is = group(-0.6, 0, 0.7, root);
    const iw = mat('#c9a070', { roughness: 0.55 });
    mesh(rbox(2.8, 0.9, 1.6, 0.05), iw, 0, 0.45, 0, is);
    mesh(rbox(2.9, 0.08, 1.7, 0.02), mat('#e8d8b8'), 0, 0.92, 0, is);
    mesh(rbox(1.5, 0.6, 0.9, 0.04), iw, 0, 1.25, 0, is);
    mesh(rbox(1.6, 0.06, 1.0, 0.02), mat('#e8d8b8'), 0, 1.57, 0, is);
    sp(-0.6, 0.97, 0.7, 2.6, 1.45, { max: 0.75, tag: 'island' });
    sp(-0.6, 1.62, 0.7, 1.4, 0.85, { max: 0.65, tag: 'island' });
    blob(root, -0.6, 0.7, 3.4, 2.2, 0.4);
    // 공 바구니 (철망)
    const bin = group(1.6, 0, 2.9, root);
    mesh(new T.CylinderGeometry(0.6, 0.55, 0.9, 16, 1, true), new T.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 0.6, roughness: 0.4, wireframe: true }), 0, 0.45, 0, bin);
    const ballC = ['#e84a4a', '#3a8ad8', '#f0c030', '#4ab86a', '#f07ab0'];
    for (let k = 0; k < 9; k++) mesh(K.sphere(0.18, 14, 10), mat(ballC[k % 5], { roughness: 0.35 }), (r() - 0.5) * 0.6, 0.6 + (k % 3) * 0.12, (r() - 0.5) * 0.6, bin);
    blob(root, 1.6, 2.9, 1.4, 1.4, 0.4);
    // 앞 바닥 상자들(장식)
    const bx = group(-3.2, 0, 3.6, root);
    mesh(rbox(1.0, 0.7, 0.8, 0.03), mat('#c99a62', { roughness: 0.9 }), 0, 0.35, 0, bx);
    mesh(rbox(0.8, 0.55, 0.7, 0.03), mat('#d8b07a', { roughness: 0.9 }), 0.1, 0.98, 0, bx).rotation.y = 0.3;
    sp(-3.1, 1.26, 3.6, 0.6, 0.5, { max: 0.55, tag: 'box' });
    blob(root, -3.2, 3.6, 1.6, 1.3, 0.4);

    // ── 바닥 자리
    sp(-0.6, 0.01, 3.2, 2.6, 1.4, { max: 0.9, tag: 'floor' });
    sp(1.4, 0.01, -2.6, 2.2, 1.0, { max: 0.85, tag: 'floor' });
    sp(-2.7, 0.01, -2.7, 1.6, 1.0, { max: 0.85, tag: 'floor' });
    sp(-3.3, 0.01, 0.6, 1.0, 1.6, { max: 0.85, tag: 'floor' });
    sp(2.1, 0.01, 0.6, 0.7, 2.6, { max: 0.8, tag: 'floor' });

    // ── 천장 등
    [[-2, -1.5], [1.5, 0.5]].forEach(([x, z]) => {
      mesh(K.cyl(0.012, 0.012, 1.2, 4), mat('#222222'), x, 6.4, z, root).castShadow = false;
      const sh = mesh(new T.ConeGeometry(0.42, 0.34, 20, 1, true), new T.MeshStandardMaterial({ color: 0x2f6a5a, roughness: 0.5, side: T.DoubleSide }), x, 5.7, z, root);
      sh.castShadow = false;
      const bb = mesh(K.sphere(0.12, 12, 8), new T.MeshStandardMaterial({ color: 0xfff2c8, emissive: night ? 0xffd080 : 0x332a10, emissiveIntensity: night ? 2.5 : 0.6 }), x, 5.56, z, root);
      bb.castShadow = false;
      if (night) { const pl = ctx.light(new T.PointLight(0xffd8a0, 11, 10, 1.4)); pl.position.set(x, 5.3, z); }
    });
    if (night) { ctx.sun.intensity = 0.5; ctx.sun.color.set(0x8fa0ff); ctx.hemi.intensity = 0.3; ctx.env = 0.4; }
    return { view: { fit: 6.0, ly: 2.2 }, clutter: ['gift', 'jar', 'blocks', 'books', 'tin', 'yarn', 'scroll', 'globe', 'sewbox', 'frame', 'radio'] };
  };
})();
