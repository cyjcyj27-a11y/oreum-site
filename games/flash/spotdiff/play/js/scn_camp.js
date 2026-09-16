// 장면 5: 캠핑장
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  SCN.camp = function (ctx) {
    const r = ctx.r, root = ctx.root, D = ctx.D;
    const night = ctx.opt.night;
    const pal = pick(r, [
      { grass: '#8cc665', tent: '#f4a261', van: '#8ecae6' },
      { grass: '#9bcf6b', tent: '#e76f51', van: '#ffd166' },
      { grass: '#86bf5f', tent: '#2a9d8f', van: '#f28482' },
    ]);
    ctx.bg(night ? '#1d2447' : '#bfe6f5', night ? '#0d1024' : '#f3ead3');
    P.island(ctx, { topTex: P.grassTex(pal.grass, r), lip: shade(pal.grass, -0.1) });

    // 흙길
    const path = mesh(new T.CircleGeometry(1, 24), mat('#d9b98a', { roughness: 1 }), 0.6, 0.012, 0.6, root);
    path.rotation.x = -Math.PI / 2;
    path.scale.set(2.6, 2.2, 1);
    path.receiveShadow = true;
    path.castShadow = false;

    // ── 모닥불 (가운데)
    const fire = group(0.6, 0, 0.6, root);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const st = mesh(K.ico(0.16, 0), mat('#8d8d8d', { roughness: 0.9, flatShading: true }), Math.cos(a) * 0.6, 0.09, Math.sin(a) * 0.6, fire);
      st.scale.y = 0.6;
    }
    [0, 1.2, 2.4].forEach((a) => {
      const lg = mesh(K.cyl(0.08, 0.09, 0.8, 8), mat('#6b4a32'), Math.cos(a) * 0.15, 0.2, Math.sin(a) * 0.15, fire);
      lg.rotation.set(0, -a, Math.PI / 2 - 0.5);
      lg.rotation.order = 'YZX';
    });
    const flame = group(0, 0.2, 0, fire);
    mesh(K.cone(0.25, 0.7, 10), K.glow(0xff7b00, night ? 3 : 2), 0, 0.3, 0, flame);
    mesh(K.cone(0.14, 0.45, 8), K.glow(0xffd166, night ? 4 : 2.5), 0.03, 0.25, 0.02, flame);
    D(flame, { kinds: ['hide'] });
    const fl = ctx.light(new T.PointLight(0xff9a3c, night ? 30 : 4, 7, 1.3));
    fl.position.set(0.6, 1.0, 0.6);
    // 통나무 의자
    [[-1.3, 0.3, 0.2], [1.1, -1.4, 1.2], [2.2, 1.3, -0.4]].forEach(([x, z, ry], i) => {
      const lg = group(0.6 + x, 0, 0.6 + z, root);
      lg.rotation.y = ry;
      const bark = pm('#8d6346', { roughness: 0.95 });
      mesh(K.cyl(0.3, 0.3, 1.4, 14), bark, 0, 0.3, 0, lg).rotation.z = Math.PI / 2;
      [-0.7, 0.7].forEach((xx) => mesh(K.cyl(0.26, 0.26, 0.02, 14), mat('#e9c46a'), xx, 0.3, 0, lg).rotation.z = Math.PI / 2);
      blob(root, 0.6 + x, 0.6 + z, 1.8, 0.9, 0.35, null, lg);
      D(lg, { kinds: ['hide', 'turn'], turn: 1.2, group: 'log' });
    });
    // 마시멜로 꼬치
    const stick = group(-0.3, 0.6, 1.1, root);
    stick.rotation.set(0, -0.6, -0.9);
    mesh(K.cyl(0.015, 0.015, 1.1, 5), mat('#8d6346'), 0, 0.5, 0, stick);
    mesh(K.cyl(0.05, 0.05, 0.1, 10), pm('#fff5e1'), 0, 1.05, 0, stick);
    D(stick, { kinds: ['show'] });

    // ── 텐트 (왼쪽 뒤)
    const tent = group(-2.6, 0, -2.2, root);
    tent.rotation.y = 0.5;
    const tm = pm(pal.tent, { roughness: 0.8, side: T.DoubleSide });
    const tShape = new T.Shape();
    tShape.moveTo(-1.3, 0); tShape.lineTo(0, 1.9); tShape.lineTo(1.3, 0); tShape.lineTo(-1.3, 0);
    const tGeo = new T.ExtrudeGeometry(tShape, { depth: 2.6, bevelEnabled: false });
    const tb = mesh(tGeo, tm, 0, 0, -1.3, tent);
    const door = new T.Shape();
    door.moveTo(-0.6, 0); door.lineTo(0, 1.2); door.lineTo(0.6, 0); door.lineTo(-0.6, 0);
    const dm = mesh(new T.ShapeGeometry(door), mat('#3d2b1f', { roughness: 1 }), 0, 0.01, 1.31, tent);
    const flapM = mat(shade(pal.tent, 0.25), { roughness: 0.8, side: T.DoubleSide });
    const flap = mesh(new T.ShapeGeometry(door), flapM, 0.35, 0.01, 1.4, tent);
    flap.rotation.y = -0.9;
    mesh(K.cyl(0.03, 0.03, 2.3, 6), mat('#555'), 0, 1.0, 1.4, tent);
    blob(root, -2.6, -2.2, 3.4, 3.4, 0.35, null, tent);
    D(tent, { kinds: ['color'] });
    const flag = group(0, 2.1, 1.4, tent);
    mesh(K.cyl(0.015, 0.015, 0.4, 4), mat('#333'), 0, 0.2, 0, flag);
    const fg = mesh(new T.PlaneGeometry(0.35, 0.22), pm(pick(r, ['#ffd166', '#06d6a0', '#ef476f']), { side: T.DoubleSide }), 0.18, 0.3, 0, flag);
    D(flag, { kinds: ['hide', 'color'], minLv: 1 });
    // 침낭
    const bag = group(-1.3, 0, -0.6, root);
    bag.rotation.y = 0.3;
    const bgM = pm(pick(r, ['#5e60ce', '#e76f51', '#43aa8b']), { roughness: 0.8 });
    mesh(rbox(0.8, 0.25, 1.8, 0.12), bgM, 0, 0.12, 0, bag);
    mesh(K.cyl(0.18, 0.18, 0.8, 16), bgM, 0, 0.3, -0.8, bag).rotation.z = Math.PI / 2;
    blob(root, -1.3, -0.6, 1.2, 2.2, 0.3, null, bag);
    D(bag, { kinds: ['color', 'hide'] });
    // 랜턴
    const lantern = group(-1.4, 0, -2.0, root);
    const lnM = pm(pick(r, ['#2b2d42', '#e63946', '#006d77']), { roughness: 0.4, metalness: 0.4 });
    mesh(K.cyl(0.14, 0.16, 0.08, 12), lnM, 0, 0.04, 0, lantern);
    mesh(K.cyl(0.12, 0.12, 0.3, 12), K.glow(0xffe29a, night ? 4 : 1.5), 0, 0.24, 0, lantern);
    mesh(K.cone(0.16, 0.14, 12), lnM, 0, 0.46, 0, lantern);
    mesh(K.torus(0.08, 0.012, Math.PI), lnM, 0, 0.52, 0, lantern);
    blob(root, -1.4, -2.0, 0.6, 0.6, 0.35, null, lantern);
    D(lantern, { kinds: ['hide', 'color'] });
    if (night) { const ln = ctx.light(new T.PointLight(0xffe29a, 8, 4, 1.5)); ln.position.set(-1.4, 0.6, -2.0); }

    // ── 캠핑카 (오른쪽 뒤)
    const van = group(2.9, 0, -2.9, root);
    van.rotation.y = -0.15;
    const vm = pm(pal.van, { roughness: 0.35 });
    const white = mat('#fbfbf8', { roughness: 0.4 });
    mesh(rbox(3.4, 1.0, 1.7, 0.25), vm, 0, 0.75, 0, van);
    mesh(rbox(3.4, 0.9, 1.7, 0.35), white, 0, 1.65, 0, van);
    mesh(rbox(2.8, 0.3, 1.5, 0.15), white, -0.2, 2.2, 0, van);
    const glass = mat('#2b4c6f', { roughness: 0.1, metalness: 0.3 });
    glass.userData.nopaint = true;
    [[-1.0], [0.1], [1.2]].forEach(([x]) => mesh(rbox(0.8, 0.5, 0.05, 0.08), glass, x, 1.65, 0.86, van));
    mesh(rbox(0.05, 0.5, 1.2, 0.08), glass, 1.72, 1.65, 0, van);
    const tire = mat('#222', { roughness: 0.9 });
    [[-1.1, 0.8], [1.1, 0.8], [-1.1, -0.8], [1.1, -0.8]].forEach(([a, b]) => {
      const w = mesh(K.cyl(0.35, 0.35, 0.25, 18), tire, a, 0.35, b, van);
      w.rotation.x = Math.PI / 2;
      mesh(K.cyl(0.16, 0.16, 0.26, 12), mat('#ced4da', { metalness: 0.6 }), a, 0.35, b, van).rotation.x = Math.PI / 2;
    });
    [-1, 1].forEach((s) => mesh(K.sphere(0.1, 10, 8), K.glow(0xfff3c4, night ? 3 : 0.6), 1.72, 0.85, s * 0.55, van));
    blob(root, 2.9, -2.9, 4.2, 2.4, 0.4, null, van);
    D(van, { kinds: ['color'] });
    // 차양 + 줄전구
    const awn = group(-0.2, 2.0, 0.9, van);
    const awT = tex(128, 32, (c, W, H) => { for (let x = 0; x < 8; x++) { c.fillStyle = x % 2 ? '#fefae0' : pick(K.rng(7), ['#e63946', '#2a9d8f']); c.fillRect(x * 16, 0, 16, H); } });
    const awM = new T.MeshStandardMaterial({ map: awT, side: T.DoubleSide, roughness: 0.8 });
    awM.userData.paint = true;
    const ap = mesh(new T.PlaneGeometry(2.6, 1.0), awM, 0, -0.2, 0.45, awn);
    ap.rotation.x = -Math.PI / 2 + 0.4;
    D(awn, { kinds: ['hide', 'color'] });
    const surf = group(-1.9, 2.4, 0, van);
    surf.rotation.set(0, 0, Math.PI / 2 - 0.05);
    const sfM = pm(pick(r, ['#ffb703', '#fb5607', '#3a86ff']), { roughness: 0.3 });
    mesh(K.sphere(0.5, 16, 12), sfM, 0, 0, 0, surf).scale.set(0.4, 0.05, 1.8);
    D(surf, { kinds: ['show'] });
    // 캠핑 의자 둘 + 작은 탁자
    [[1.8, -1.0, 0.4], [3.2, -1.1, -0.3]].forEach(([x, z, ry], i) => {
      const ch = group(x, 0, z, root);
      ch.rotation.y = ry;
      const cm = pm(pick(r, ['#e63946', '#3a86ff', '#ffb703', '#8338ec']), { roughness: 0.8, side: T.DoubleSide });
      const seat = mesh(K.box(0.7, 0.04, 0.6), cm, 0, 0.6, 0, ch);
      seat.rotation.x = -0.1;
      const back = mesh(K.box(0.7, 0.7, 0.04), cm, 0, 0.95, -0.35, ch);
      back.rotation.x = -0.25;
      const leg = mat('#495057', { metalness: 0.6 });
      [[-0.33, 0.25, 0.4], [0.33, 0.25, 0.4], [-0.33, -0.25, -0.4], [0.33, -0.25, -0.4]].forEach(([a, b, t]) => { const l = mesh(K.cyl(0.02, 0.02, 0.8, 5), leg, a, 0.32, b, ch); l.rotation.x = t; });
      blob(root, x, z, 1.0, 1.0, 0.35, null, ch);
      D(ch, { kinds: ['color', 'hide', 'turn'], turn: 1.4, group: 'cchair' });
    });
    const table = group(2.5, 0, -0.6, root);
    const ttop = pm(pick(r, ['#d4a373', '#adb5bd']), { roughness: 0.6 });
    mesh(rbox(0.8, 0.06, 0.6, 0.02), ttop, 0, 0.55, 0, table);
    [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].forEach(([a, b]) => mesh(K.cyl(0.02, 0.02, 0.55, 5), mat('#495057'), a, 0.27, b, table));
    blob(root, 2.5, -0.6, 1, 0.9, 0.3, null, table);
    const mug = P.mug(table, -0.15, 0.58, 0.05, pick(r, ['#e63946', '#ffffff', '#2a9d8f']), 0.8);
    mug.scale.setScalar(0.8);
    D(mug, { kinds: ['hide', 'color'] });
    const map = mesh(rbox(0.3, 0.02, 0.22, 0.005), pm('#f1faee'), 0.18, 0.59, -0.05, table);
    D(map, { kinds: ['show'], minLv: 1 });
    D(table, { kinds: ['color'], paint: [table.children[0]] });

    // ── 연못 (왼쪽 앞)
    const pond = group(-2.8, 0, 2.6, root);
    const water = mesh(new T.CircleGeometry(1.7, 40), new T.MeshStandardMaterial({ color: night ? 0x1d3557 : 0x48cae4, roughness: 0.1, metalness: 0.1 }), 0, 0.02, 0, pond);
    water.rotation.x = -Math.PI / 2;
    water.scale.set(1, 0.8, 1);
    water.castShadow = false;
    const edge = mesh(K.torus(1.7, 0.12, Math.PI * 2), mat('#bfb5a5', { roughness: 0.9 }), 0, 0.02, 0, pond);
    edge.rotation.x = Math.PI / 2;
    edge.scale.set(1, 0.8, 0.5);
    [[0.6, 0.3, 0.3], [-0.5, -0.4, 0.25], [-0.2, 0.6, 0.2]].forEach(([x, z, s2], i) => {
      const pad = group(x, 0.04, z, pond);
      const lp = mesh(K.cyl(s2, s2, 0.02, 16, 1), pm('#52b788'), 0, 0, 0, pad);
      if (i === 0) {
        const fl = P.flower(pad, 0.05, 0.02, '#ffafcc', 0.5);
        D(fl, { kinds: ['hide', 'color'], minLv: 1 });
      }
      D(pad, { kinds: ['hide'], group: 'pad' + i, minLv: 1 });
    });
    const duck = group(0.1, 0.05, -0.2, pond);
    duck.rotation.y = 0.7;
    const dkM = pm('#ffd60a', { roughness: 0.5 });
    mesh(K.sphere(0.22, 16, 12), dkM, 0, 0.1, 0, duck).scale.set(1.3, 0.8, 1);
    mesh(K.sphere(0.14, 14, 10), dkM, 0.2, 0.3, 0, duck);
    mesh(K.cone(0.05, 0.12, 8), mat('#fb8500'), 0.36, 0.28, 0, duck).rotation.z = -Math.PI / 2;
    mesh(K.sphere(0.025, 6, 4), mat('#222'), 0.28, 0.34, 0.08, duck);
    D(duck, { kinds: ['hide', 'color', 'mirror'], colors: ['#ffd60a', '#ffffff', '#ff8fab'] });
    const duck2 = duck.clone();
    duck2.position.set(-0.7, 0.05, 0.4);
    duck2.scale.setScalar(0.7);
    duck2.traverse((m) => { if (m.isMesh) m.material = m.material.clone(); });
    pond.add(duck2);
    D(duck2, { kinds: ['show'] });
    // 나무 선착장 + 낚싯대
    const dock = group(-1.3, 0, 2.1, root);
    dock.rotation.y = -0.5;
    const plank = pm('#b08968', { roughness: 0.8 });
    for (let i = 0; i < 5; i++) mesh(rbox(0.3, 0.08, 1.2, 0.02), plank, -0.7 + i * 0.33, 0.2, 0, dock);
    [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]].forEach(([a, b]) => mesh(K.cyl(0.06, 0.06, 0.3, 6), mat('#7f5539'), a, 0.12, b, dock));
    D(dock, { kinds: ['color'] });
    const rod = group(-0.5, 0.25, 0, dock);
    rod.rotation.set(0, 0, 0.7);
    mesh(K.cyl(0.02, 0.01, 1.6, 5), pm('#2b2d42'), 0, 0.8, 0, rod);
    mesh(K.cyl(0.05, 0.05, 0.06, 8), mat('#adb5bd'), 0, 0.2, 0.04, rod).rotation.x = Math.PI / 2;
    D(rod, { kinds: ['hide', 'color'] });
    const bucket = group(0.4, 0.24, 0.2, dock);
    mesh(K.cyl(0.16, 0.12, 0.28, 12), pm(pick(r, ['#adb5bd', '#e63946', '#4895ef'])), 0, 0.14, 0, bucket);
    mesh(K.torus(0.15, 0.01, Math.PI), mat('#555'), 0, 0.28, 0, bucket);
    D(bucket, { kinds: ['hide', 'color'] });

    // ── 나무들 (가장자리)
    const trees = [
      ['pine', -4.3, -4.2, 1.3], ['pine', -2.9, -4.4, 1.0], ['round', -0.6, -4.2, 1.1], ['pine', 0.8, -4.5, 0.9],
      ['round', -4.3, -0.6, 1.0], ['pine', -4.4, 0.9, 1.15], ['round', 4.4, 0.5, 0.95], ['pine', 4.3, 2.3, 1.1],
      ['round', 1.2, 4.3, 0.8],
    ];
    trees.forEach(([k, x, z, s2], i) => {
      const col = k === 'pine' ? pick(r, ['#2d6a4f', '#1b4332', '#40916c']) : pick(r, ['#52b788', '#74c69d', '#95d5b2', '#f4a261']);
      const t = k === 'pine' ? P.pine(root, x, z, s2, col, r) : P.roundTree(root, x, z, s2, col, r);
      t.rotation.y = r() * 6;
      D(t, { kinds: i % 3 === 0 ? ['hide', 'color', 'grow'] : ['hide', 'color'], grow: 0.72, colors: k === 'pine' ? ['#2d6a4f', '#bc6c25', '#e9c46a', '#1b4332'] : ['#52b788', '#f4a261', '#e76f51', '#ffd166', '#74c69d'], group: i % 2 ? null : 'treeC' });
    });
    const small = P.pine(root, 3.7, 4.2, 0.55, '#40916c', r);
    D(small, { kinds: ['show'] });
    // 바위·수풀·버섯·꽃
    [[-3.6, 1.0, 0.8], [3.8, -0.8, 0.6], [2.4, 3.6, 0.7]].forEach(([x, z, s2], i) => D(P.rock(root, x, z, s2), { kinds: ['hide', 'color'], group: 'rock' + i }));
    [[-0.3, 3.9, 1.0, '#ffafcc'], [3.2, 2.2, 0.9, null], [-4.2, 4.2, 0.8, '#ffd166']].forEach(([x, z, s2, f], i) => {
      const b = P.bush(root, x, z, s2, pick(r, ['#40916c', '#52b788', '#2d6a4f']), f);
      D(b, { kinds: ['hide', 'color'], group: 'bush' + i, colors: ['#40916c', '#95d5b2', '#2d6a4f', '#b5e48c'] });
      if (f) D(b, { kinds: ['alt'], minLv: 2, alt: (on) => b.userData.flowers.color.set(on ? '#8ecae6' : f) });
    });
    [[-1.9, 4.0], [1.7, 2.6], [-3.5, -1.7]].forEach(([x, z], i) => D(P.mushroom(root, x, z, pick(r, ['#e63946', '#f77f00', '#9d4edd']), 1.2), { kinds: ['hide', 'color'], group: 'mush' + i, minLv: 1 }));
    for (let i = 0; i < 6; i++) {
      const f = P.flower(root, -0.8 + (r() - 0.5) * 7, 3.0 + r() * 1.5, pick(r, ['#ff595e', '#ffca3a', '#ffffff', '#c77dff']), 1.1);
      if (i % 2 === 0) D(f, { kinds: ['hide', 'color'], minLv: 2 });
    }
    // 토끼
    const bunny = group(1.9, 0, 3.4, root);
    bunny.rotation.y = -0.8;
    const bm = pm(pick(r, ['#ffffff', '#d6ccc2', '#b08968']), { roughness: 0.95 });
    mesh(K.sphere(0.25, 16, 12), bm, 0, 0.22, 0, bunny).scale.set(1.2, 1, 1);
    mesh(K.sphere(0.17, 14, 10), bm, 0.25, 0.4, 0, bunny);
    [-1, 1].forEach((sd) => { const e = mesh(K.capsule(0.04, 0.22), bm, 0.22, 0.66, sd * 0.06, bunny); e.rotation.x = sd * 0.2; });
    mesh(K.sphere(0.08, 8, 6), mat('#ffffff'), -0.3, 0.25, 0, bunny);
    mesh(K.sphere(0.02, 6, 4), mat('#222'), 0.38, 0.44, 0.08, bunny);
    blob(root, 1.9, 3.4, 0.8, 0.7, 0.35, null, bunny);
    D(bunny, { kinds: ['hide', 'color', 'mirror'], colors: ['#ffffff', '#d6ccc2', '#b08968', '#5c5c5c'] });
    // 표지판
    const sign = group(4.2, 0, 4.1, root);
    sign.rotation.y = 0.8;
    mesh(K.cyl(0.05, 0.05, 1.3, 6), mat('#7f5539'), 0, 0.65, 0, sign);
    const sM = pm('#b08968', { roughness: 0.8 });
    const arrow = new T.Shape();
    arrow.moveTo(-0.4, -0.12); arrow.lineTo(0.3, -0.12); arrow.lineTo(0.45, 0); arrow.lineTo(0.3, 0.12); arrow.lineTo(-0.4, 0.12);
    const ar = mesh(new T.ExtrudeGeometry(arrow, { depth: 0.05, bevelEnabled: false }), sM, 0.1, 1.1, 0.02, sign);
    D(sign, { kinds: ['mirror', 'hide', 'color'] });
    // 배낭
    const pack = group(-0.3, 0, -1.5, root);
    pack.rotation.y = 0.8;
    const pkM = pm(pick(r, ['#ef476f', '#118ab2', '#ffd166']), { roughness: 0.7 });
    mesh(rbox(0.55, 0.75, 0.35, 0.14), pkM, 0, 0.38, 0, pack);
    mesh(rbox(0.4, 0.3, 0.12, 0.06), pkM, 0, 0.28, 0.2, pack);
    mesh(K.cyl(0.1, 0.1, 0.5, 12), mat('#6a994e'), 0, 0.82, 0, pack).rotation.z = Math.PI / 2;
    blob(root, -0.3, -1.5, 0.8, 0.7, 0.35, null, pack);
    D(pack, { kinds: ['hide', 'color', 'turn'], turn: 1.6 });

    if (night) {
      ctx.sun.intensity = 0.35;
      ctx.sun.color.set(0x7d8cff);
      ctx.hemi.intensity = 0.22;
      ctx.env = 0.15;
      ctx.exposure(1.2);
    } else {
      ctx.sun.intensity = 3.2;
      ctx.hemi.intensity = 0.7;
    }
    return { view: { fit: 6.4, ly: 0.6 } };
  };
})();
