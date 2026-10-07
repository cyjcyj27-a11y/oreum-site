// 장면 5: 도서관 (높은 책장·긴 열람 탁자·초록 갓 등·사다리)
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const BOOKS = ['#7a2a2a', '#2a4a6a', '#3a5a3a', '#8a6a3a', '#3a2a4a', '#a8783a', '#5a2a3a', '#2a5a5a', '#6a4a2a'];

  function bankerLamp(parent, x, y, z, night, ctx) {
    const g = group(x, y, z, parent);
    const brass = mat('#c9a24a', { metalness: 0.7, roughness: 0.3 });
    mesh(K.cyl(0.18, 0.2, 0.05, 16), brass, 0, 0.03, 0, g);
    mesh(K.cyl(0.025, 0.025, 0.5, 8), brass, 0, 0.3, 0, g);
    const sh = mesh(new T.CylinderGeometry(0.12, 0.3, 0.16, 20, 1, true, 0, Math.PI), new T.MeshStandardMaterial({ color: 0x1f7a4a, roughness: 0.15, side: T.DoubleSide, emissive: night ? 0x0a3a1a : 0 }), 0, 0.58, 0, g);
    sh.rotation.x = Math.PI / 2; sh.rotation.z = Math.PI / 2;
    if (night) { const pl = ctx.light(new T.PointLight(0xffd8a0, 4, 4, 1.6)); pl.position.set(x, y + 0.4, z); }
    return g;
  }
  function chair(parent, x, z, rot, col) {
    const g = group(x, 0, z, parent);
    g.rotation.y = rot;
    const w = mat(col, { roughness: 0.5 });
    mesh(rbox(0.8, 0.1, 0.8, 0.03), w, 0, 0.85, 0, g);
    [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]].forEach(([a, b]) => mesh(rbox(0.08, 0.85, 0.08, 0.02), w, a, 0.42, b, g));
    mesh(rbox(0.8, 0.9, 0.08, 0.03), w, 0, 1.35, -0.36, g);
    return g;
  }

  SCN.library = function (ctx) {
    const r = ctx.r, root = ctx.root, night = ctx.opt.night, sp = ctx.spot;
    const pal = pick(r, [{ wall: '#3f5a48', low: '#6a4028', floor: '#7a4a2c', rug: '#8a2a2a' }, { wall: '#3a4a62', low: '#5a3a2a', floor: '#6f4430', rug: '#2a5a4a' }, { wall: '#6a3a3a', low: '#4a3020', floor: '#80502e', rug: '#2a3a6a' }]);
    ctx.bg(night ? '#262434' : '#efe6d8', night ? '#16141f' : '#d4c4ae');
    P.room(ctx, { floorTex: K.woodFloor(pal.floor, r), wallTex: K.wallpaper(pal.wall, shade(pal.wall, 0.08), 'stripe'), wallTex2: K.wallpaper(shade(pal.wall, -0.04), shade(pal.wall, 0.06), 'stripe'), slab: '#4a2c1a', wallEdge: '#5a3a24', baseboard: '#3a2416', height: 7.2, wainscot: pal.low, wainscotH: 1.4 });

    // ── 뒷벽 높은 책장 둘 + 창
    Q.shelf(ctx, -3.0, -4.5, { w: 2.8, d: 0.85, h: 5.2, levels: 5, color: '#5a3420', books: 0.62, max: 0.75, bookCols: BOOKS });
    Q.shelf(ctx, 0.0, -4.5, { w: 2.8, d: 0.85, h: 5.2, levels: 5, color: '#5a3420', books: 0.62, max: 0.75, bookCols: BOOKS });
    P.window(root, 3.3, 4.0, -5, 1.6, 2.4, night ? { stars: 1, skyTop: '#1b2350', skyBot: '#3a4a8a', frame: '#4a2c1a' } : { frame: '#4a2c1a', skyTop: '#8ec8f0', skyBot: '#e8f4ff', hill: '#6aa85a' });
    P.curtain(root, 2.25, 5.6, -4.78, 0.6, 3.6, '#8a2a2a');
    P.curtain(root, 4.35, 5.6, -4.78, 0.6, 3.6, '#8a2a2a');
    sp(3.3, 2.66, -4.78, 1.7, 0.36, { max: 0.55, tag: 'sill' });
    // 창 아래 낮은 책장
    Q.shelf(ctx, 3.3, -4.55, { w: 1.9, d: 0.8, h: 1.6, levels: 2, color: '#5a3420', books: 0.5, max: 0.6, bookCols: BOOKS });

    // ── 왼벽 책장 + 사다리
    Q.shelf(ctx, -4.5, -1.2, { w: 3.0, d: 0.85, h: 5.2, levels: 5, rot: Math.PI / 2, color: '#5a3420', books: 0.55, max: 0.75, bookCols: BOOKS });
    const ld = group(-3.75, 0, 0.9, root);
    ld.rotation.x = 0; ld.rotation.z = 0.28;
    const lw = mat('#8a5a32', { roughness: 0.5 });
    [-0.35, 0.35].forEach((z) => mesh(rbox(0.08, 5.0, 0.08, 0.02), lw, 0, 2.5, z, ld));
    for (let i = 0; i < 9; i++) mesh(K.cyl(0.03, 0.03, 0.7, 6), lw, 0, 0.4 + i * 0.52, 0, ld).rotation.x = Math.PI / 2;

    // ── 안락의자 + 둥근 탁자 (왼쪽 앞)
    const ac = group(-3.6, 0, 3.0, root);
    ac.rotation.y = Math.PI / 2 - 0.3;
    const lea = mat('#7a2a1a', { roughness: 0.45 });
    mesh(rbox(1.4, 0.55, 1.3, 0.15), lea, 0, 0.5, 0, ac);
    mesh(rbox(1.4, 1.2, 0.3, 0.15), lea, 0, 1.2, -0.55, ac);
    [-1, 1].forEach((s2) => mesh(rbox(0.28, 0.75, 1.3, 0.12), lea, s2 * 0.62, 0.85, 0, ac));
    sp(-3.55, 0.8, 3.05, 0.7, 0.7, { max: 0.6, tag: 'chair' });
    blob(root, -3.6, 3.0, 2.0, 2.0, 0.4);
    Q.table(ctx, -2.0, 4.0, { w: 1.1, round: true, h: 1.0, color: '#5a3420', max: 0.7, under: false });

    // ── 긴 열람 탁자 + 초록 갓 등 + 의자
    const tw = 4.0, td = 1.6;
    Q.table(ctx, 0.4, 0.6, { w: tw, d: td, h: 1.35, color: '#6a3a22', max: 0.8 });
    [-1.0, 1.0].forEach((dx) => bankerLamp(root, 0.4 + dx, 1.4, 0.15, night, ctx));
    [-1.3, 0, 1.3].forEach((dx, i) => { chair(root, 0.4 + dx, -0.6, 0, '#5a3420'); chair(root, 0.4 + dx + 0.3, 1.85, Math.PI, '#5a3420'); });
    // 펼친 책 두 권 (장식)
    [[-0.3, 0.8], [1.3, 0.4]].forEach(([x, z]) => {
      const ob = group(0.4 + x, 1.41, z, root);
      ob.rotation.y = r() * 0.6 - 0.3;
      [-1, 1].forEach((s2) => { const pg = mesh(rbox(0.36, 0.04, 0.5, 0.01), mat('#f4ecd8'), s2 * 0.18, 0.04, 0, ob); pg.rotation.z = -s2 * 0.08; });
      mesh(rbox(0.76, 0.03, 0.54, 0.01), mat('#7a2a2a'), 0, 0.01, 0, ob);
    });

    // ── 책 수레 (오른쪽 앞)
    const ct = group(3.4, 0, 1.6, root);
    ct.rotation.y = -Math.PI / 2 + 0.2;
    const cw = mat('#8a5a32', { roughness: 0.5 });
    [0.35, 1.05].forEach((y) => mesh(rbox(1.8, 0.08, 0.7, 0.02), cw, 0, y, 0, ct));
    [[-0.85, -0.3], [0.85, -0.3], [-0.85, 0.3], [0.85, 0.3]].forEach(([a, b]) => { mesh(rbox(0.06, 1.1, 0.06, 0.01), cw, a, 0.6, b, ct); mesh(K.sphere(0.07, 8, 6), mat('#2a2a2a'), a, 0.07, b, ct); });
    P.books(ct, -0.35, 0.39, 0, 0.9, r, { h: 0.55, d: 0.5, colors: BOOKS });
    sp(3.4, 1.1, 1.6, 0.7, 1.6, { max: 0.65, tag: 'cart' });
    blob(root, 3.4, 1.6, 1.3, 2.2, 0.4);
    // ── 큰 지구본 (서 있는)
    const gl = group(3.6, 0, -2.4, root);
    mesh(K.cyl(0.35, 0.45, 0.1, 18), mat('#5a3420'), 0, 0.05, 0, gl);
    mesh(K.cyl(0.05, 0.07, 1.1, 10), mat('#5a3420'), 0, 0.6, 0, gl);
    const ring = mesh(K.torus(0.68, 0.03, Math.PI * 1.2), mat('#c9a24a', { metalness: 0.7, roughness: 0.3 }), 0, 1.6, 0, gl); ring.rotation.z = Math.PI / 2 + 0.4;
    const gt = tex(256, 128, (c, W, H) => { c.fillStyle = '#d8c89a'; c.fillRect(0, 0, W, H); c.fillStyle = '#8a6a3a'; for (let i = 0; i < 8; i++) { c.beginPath(); c.ellipse(r() * W, 20 + r() * (H - 40), 14 + r() * 24, 8 + r() * 16, r() * 3, 0, 7); c.fill(); } });
    mesh(K.sphere(0.62, 28, 20), new T.MeshStandardMaterial({ map: gt, roughness: 0.5 }), 0, 1.6, 0, gl).rotation.z = 0.4;
    blob(root, 3.6, -2.4, 1.4, 1.4, 0.4);

    // ── 긴 깔개
    const rg = K.tex(256, 512, (c, W, H) => { c.fillStyle = pal.rug; c.fillRect(0, 0, W, H); c.strokeStyle = '#e8c070'; c.lineWidth = 10; c.strokeRect(14, 14, W - 28, H - 28); c.fillStyle = 'rgba(232,192,112,0.6)'; for (let y = 60; y < H - 40; y += 56) { c.beginPath(); c.moveTo(W / 2, y); c.lineTo(W / 2 + 30, y + 22); c.lineTo(W / 2, y + 44); c.lineTo(W / 2 - 30, y + 22); c.fill(); } });
    const rug = mesh(K.box(2.6, 0.03, 5.6), new T.MeshStandardMaterial({ map: rg, roughness: 1 }), 0.4, 0.016, 1.4, root);
    rug.castShadow = false;

    // ── 바닥 자리
    sp(0.4, 0.04, 3.4, 2.4, 1.2, { max: 0.9, tag: 'rug' });
    sp(-1.9, 0.01, -2.6, 2.0, 1.2, { max: 0.9, tag: 'floor' });
    sp(1.9, 0.01, -2.7, 1.2, 1.2, { max: 0.9, tag: 'floor' });
    sp(-2.6, 0.01, 1.1, 0.9, 2.0, { max: 0.85, tag: 'floor' });
    sp(2.2, 0.01, 3.6, 1.0, 1.2, { max: 0.9, tag: 'floor' });

    // ── 샹들리에
    mesh(K.cyl(0.015, 0.015, 1.4, 4), mat('#3a2a1a'), 0.4, 6.5, 0.4, root).castShadow = false;
    const ch = group(0.4, 5.7, 0.4, root);
    mesh(K.torus(0.6, 0.04), mat('#c9a24a', { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, ch).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const b = mesh(K.sphere(0.09, 10, 8), new T.MeshStandardMaterial({ color: 0xfff2c8, emissive: night ? 0xffc870 : 0x332a10, emissiveIntensity: night ? 2.4 : 0.5 }), Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6, ch); b.castShadow = false; }
    ch.children.forEach((c) => (c.castShadow = false));
    if (night) {
      const pl = ctx.light(new T.PointLight(0xffd090, 12, 12, 1.3)); pl.position.set(0.4, 5.4, 0.4);
      ctx.sun.intensity = 0.45; ctx.sun.color.set(0x8fa0ff); ctx.hemi.intensity = 0.28; ctx.env = 0.35;
    }
    return { view: { fit: 6.1, ly: 2.3 }, density: 1.15, clutter: ['books', 'globe', 'lantern', 'scroll', 'frame', 'vase', 'teapot', 'jar', 'radio', 'pot', 'basket', 'cage'] };
  };
})();
