// 장면 1: 다락방
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  // 나무 판자 벽
  function planks(base, r, horiz) {
    return K.tex(512, 512, (c, W, H) => {
      const n = 8;
      for (let i = 0; i < n; i++) {
        c.fillStyle = shade(base, (r() - 0.5) * 0.18);
        if (horiz) c.fillRect(0, (i * H) / n, W, H / n); else c.fillRect((i * W) / n, 0, W / n, H);
        c.fillStyle = 'rgba(50,25,10,0.45)';
        if (horiz) c.fillRect(0, (i * H) / n, W, 3); else c.fillRect((i * W) / n, 0, 3, H);
        c.strokeStyle = 'rgba(70,35,10,0.13)'; c.lineWidth = 1.5;
        for (let k = 0; k < 4; k++) {
          const q = (i + 0.15 + r() * 0.7) * (horiz ? H : W) / n;
          c.beginPath();
          if (horiz) { c.moveTo(0, q); c.bezierCurveTo(W * 0.3, q + (r() - 0.5) * 8, W * 0.7, q + (r() - 0.5) * 8, W, q); }
          else { c.moveTo(q, 0); c.bezierCurveTo(q + (r() - 0.5) * 8, H * 0.3, q + (r() - 0.5) * 8, H * 0.7, q, H); }
          c.stroke();
        }
        // 못 자국
        c.fillStyle = 'rgba(40,20,10,0.5)';
        for (let k = 0; k < 2; k++) { const a = (i + 0.5) * (horiz ? H : W) / n, b = (0.1 + k * 0.8) * (horiz ? W : H); c.beginPath(); horiz ? c.arc(b, a, 2.5, 0, 7) : c.arc(a, b, 2.5, 0, 7); c.fill(); }
      }
    }, [2, 1.2]);
  }

  // 페르시아풍 깔개
  function rugTex(c1, c2, c3) {
    return K.tex(512, 384, (c, W, H) => {
      c.fillStyle = c1; c.fillRect(0, 0, W, H);
      c.strokeStyle = c2; c.lineWidth = 18; c.strokeRect(22, 22, W - 44, H - 44);
      c.strokeStyle = c3; c.lineWidth = 5; c.strokeRect(44, 44, W - 88, H - 88);
      c.fillStyle = c3;
      for (let x = 60; x < W - 50; x += 28) { c.beginPath(); c.moveTo(x, 50); c.lineTo(x + 8, 60); c.lineTo(x, 70); c.lineTo(x - 8, 60); c.fill(); c.beginPath(); c.moveTo(x, H - 50); c.lineTo(x + 8, H - 60); c.lineTo(x, H - 70); c.lineTo(x - 8, H - 60); c.fill(); }
      c.fillStyle = c2;
      c.beginPath(); c.ellipse(W / 2, H / 2, 110, 70, 0, 0, 7); c.fill();
      c.fillStyle = c3;
      c.beginPath(); c.ellipse(W / 2, H / 2, 70, 40, 0, 0, 7); c.fill();
      c.fillStyle = c1;
      c.beginPath(); c.ellipse(W / 2, H / 2, 30, 16, 0, 0, 7); c.fill();
      // 술
      c.fillStyle = 'rgba(255,240,210,0.9)';
      for (let y = 10; y < H - 10; y += 8) { c.fillRect(0, y, 10, 3); c.fillRect(W - 10, y, 10, 3); }
      // 닳은 결
      for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    });
  }

  // 골판지 상자
  function boxTex(r) {
    return K.tex(256, 256, (c, W, H) => {
      c.fillStyle = '#c99a62'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(120,80,40,0.12)';
      for (let x = 0; x < W; x += 6) c.fillRect(x, 0, 2, H);
      c.fillStyle = 'rgba(200,170,120,0.85)'; c.fillRect(0, H * 0.45, W, H * 0.12);
      c.strokeStyle = 'rgba(60,30,10,0.55)'; c.lineWidth = 4;
      c.strokeRect(W * 0.18, H * 0.66, W * 0.3, H * 0.18);
      c.fillStyle = 'rgba(60,30,10,0.55)'; c.font = 'bold 34px sans-serif'; c.fillText(pick(r, ['FRAGILE', 'TOYS', 'BOOKS', 'XMAS']), W * 0.12, H * 0.32);
    });
  }

  SCN.attic = function (ctx) {
    const r = ctx.r, root = ctx.root, night = ctx.opt.night, sp = ctx.spot;
    const pal = pick(r, [
      { wall: '#c9a074', floor: '#8f5f3e', rug: ['#a8323a', '#f0c76a', '#2f4f7a'], sofa: '#6f8f6a' },
      { wall: '#d3ad80', floor: '#7f5236', rug: ['#2f5f6a', '#e8b65a', '#a8323a'], sofa: '#a85a4a' },
      { wall: '#c39a78', floor: '#946446', rug: ['#5a3f7a', '#f0c76a', '#c8553a'], sofa: '#4f6f8f' },
    ]);
    ctx.bg(night ? '#2c2a40' : '#f4e6d4', night ? '#1a1828' : '#e2c6a8');
    P.room(ctx, { floorTex: K.woodFloor(pal.floor, r), wallTex: planks(pal.wall, r, true), wallTex2: planks(shade(pal.wall, -0.05), r, true), slab: '#5f3a24', wallEdge: '#6a432a', baseboard: '#5a3822', height: 7 });
    const beam = mat('#6a432a', { roughness: 0.75 });
    // 서까래: 뒷벽·왼벽에 비스듬히
    [[-3.2, 1], [1.0, 1], [4.2, -1]].forEach(([x, s]) => { const b = mesh(rbox(0.32, 8.4, 0.3, 0.04), beam, x, 3.4, -4.82, root); b.rotation.z = s * 0.5; b.castShadow = false; });
    mesh(rbox(10.2, 0.34, 0.34, 0.04), beam, -0.15, 6.2, -4.8, root).castShadow = false;
    mesh(rbox(0.34, 0.34, 10, 0.04), beam, -4.8, 6.2, 0, root).castShadow = false;
    [-1.6, 2.4].forEach((z) => { const b = mesh(rbox(0.3, 8.0, 0.32, 0.04), beam, -4.82, 3.4, z, root); b.rotation.x = 0.45; b.castShadow = false; });

    // ── 창문 (뒷벽) + 창턱
    P.window(root, 1.4, 4.3, -5, 1.8, 1.4, night ? { stars: 1, skyTop: '#1b2350', skyBot: '#3a4a8a', frame: '#e9dcc4' } : { frame: '#e9dcc4', skyTop: '#ffb27a', skyBot: '#ffe2b0', hill: '#9a7a5a' });
    sp(1.4, 3.47, -4.78, 1.9, 0.36, { max: 0.6, tag: 'sill' });

    // ── 책장 (뒷벽 왼쪽)
    const bs = group(-1.7, 0, -4.5, root);
    const wd = mat('#7a4a2c', { roughness: 0.6 }), wdL = mat('#93603c', { roughness: 0.6 });
    mesh(rbox(2.5, 4.3, 0.12, 0.03), wd, 0, 2.15, -0.38, bs);
    [-1.2, 1.2].forEach((x) => mesh(rbox(0.12, 4.3, 0.85, 0.03), wd, x, 2.15, 0, bs));
    [0.08, 1.15, 2.2, 3.25, 4.3].forEach((y, i) => {
      mesh(rbox(2.5, 0.1, 0.85, 0.03), wdL, 0, y, 0, bs);
      if (i < 4) {
        const left = r() < 0.5;
        const bk = P.books(bs, left ? -0.6 : 0.6, y + 0.05, -0.04, 1.0, r, { h: 0.85, d: 0.6, colors: ['#8a2a2a', '#2a4a6a', '#5a6a3a', '#a8783a', '#3a2a4a', '#c8a86a', '#6a3a2a'] });
        sp(-1.7 + (left ? 0.55 : -0.55), y + 0.05, -4.5, 1.05, 0.6, { max: 0.8, tag: 'shelf' });
      }
    });
    sp(-1.7, 4.35, -4.5, 2.3, 0.6, { max: 0.75, tag: 'top' });
    blob(root, -1.7, -4.4, 3.0, 1.2, 0.35);

    // ── 바닥 책 더미 (책장 옆 구석)
    const pile = group(-3.9, 0, -3.9, root);
    let py = 0;
    for (let i = 0; i < 5; i++) {
      const bw = 0.9 + r() * 0.3, bh = 0.16 + r() * 0.08;
      const b = mesh(rbox(bw, bh, 0.7 + r() * 0.15, 0.02), mat(pick(r, ['#7a2a2a', '#2a4a5a', '#5a5a3a', '#a07a4a', '#3a3a5a'])), (r() - 0.5) * 0.1, py + bh / 2, 0, pile);
      b.rotation.y = (r() - 0.5) * 0.4;
      py += bh;
    }
    sp(-3.9, py, -3.9, 0.7, 0.6, { max: 0.6, tag: 'pile' });
    blob(root, -3.9, -3.9, 1.4, 1.2, 0.35);

    // ── 옛 궤짝
    const tr = group(1.5, 0, -3.3, root);
    tr.rotation.y = -0.08;
    const trW = mat('#6a3f24', { roughness: 0.55 }), trB = mat('#3a2a1a', { roughness: 0.4, metalness: 0.4 });
    mesh(rbox(2.2, 1.0, 1.2, 0.05), trW, 0, 0.5, 0, tr);
    const lid = mesh(K.cyl(0.6, 0.6, 2.2, 20, 1), trW, 0, 1.0, 0, tr); lid.rotation.z = Math.PI / 2; lid.scale.set(1, 1, 0.25);
    [-0.85, 0, 0.85].forEach((x) => { mesh(rbox(0.1, 1.02, 1.24, 0.02), trB, x, 0.5, 0, tr); });
    mesh(rbox(0.22, 0.26, 0.06, 0.02), mat('#d9a93a', { roughness: 0.3, metalness: 0.8 }), 0, 0.82, 0.62, tr);
    sp(1.5, 1.15, -3.3, 1.8, 0.55, { max: 0.75, tag: 'trunk' });
    blob(root, 1.5, -3.3, 2.8, 1.8, 0.4);

    // ── 상자 더미 (뒤 오른쪽)
    const bt = boxTex(r), bt2 = boxTex(r);
    const bxM = new T.MeshStandardMaterial({ map: bt, roughness: 0.9 }), bxM2 = new T.MeshStandardMaterial({ map: bt2, roughness: 0.9 });
    const b1 = mesh(rbox(1.7, 1.3, 1.5, 0.04), bxM, 3.7, 0.65, -3.95, root); b1.rotation.y = 0.06;
    const b2 = mesh(rbox(1.25, 1.0, 1.15, 0.04), bxM2, 3.55, 1.8, -4.05, root); b2.rotation.y = -0.12;
    const b3 = mesh(rbox(1.0, 0.8, 0.9, 0.04), bxM, 4.25, 0.4, -2.55, root); b3.rotation.y = 0.3;
    sp(3.55, 2.3, -4.05, 1.0, 0.9, { max: 0.75, tag: 'box' });
    sp(4.25, 0.8, -2.55, 0.75, 0.7, { max: 0.65, tag: 'box' });
    blob(root, 3.8, -3.6, 2.8, 2.6, 0.4);

    // ── 낡은 소파 (왼벽)
    const so = group(-4.0, 0, 0.9, root);
    const fab = pm(pal.sofa, { roughness: 0.95 }), fabD = mat(shade(pal.sofa, -0.18), { roughness: 0.95 });
    mesh(rbox(1.5, 0.6, 3.4, 0.12), fabD, 0, 0.45, 0, so);
    mesh(rbox(1.25, 0.3, 2.7, 0.14), fab, 0.1, 0.88, 0, so);
    mesh(rbox(0.45, 1.5, 3.4, 0.18), fab, -0.55, 1.1, 0, so);
    [-1, 1].forEach((s) => mesh(rbox(1.4, 0.75, 0.4, 0.16), fab, 0.05, 0.95, s * 1.55, so));
    [[-0.6, -1.5], [0.6, -1.5], [-0.6, 1.5], [0.6, 1.5]].forEach(([x, z]) => mesh(K.cyl(0.07, 0.05, 0.2, 8), wd, x, 0.1, z, so));
    // 무릎 담요
    const blT = K.tex(128, 128, (c, W, H) => { c.fillStyle = '#e8d6b0'; c.fillRect(0, 0, W, H); c.fillStyle = '#b8473a'; for (let i = 0; i < 4; i++) { c.fillRect(i * 32, 0, 10, H); c.fillRect(0, i * 32, W, 10); } });
    const bl = mesh(rbox(1.0, 0.12, 1.1, 0.05), new T.MeshStandardMaterial({ map: blT, roughness: 1 }), 0.05, 1.08, -0.85, so); bl.rotation.set(0.05, 0.2, -0.08);
    sp(-3.85, 1.04, 1.4, 0.8, 1.5, { max: 0.75, tag: 'sofa' });
    blob(root, -4.0, 0.9, 2.2, 4.2, 0.4);

    // ── 소파 옆 둥근 탁자 + 스탠드
    const tb = group(-3.6, 0, 3.55, root);
    mesh(K.cyl(0.62, 0.62, 0.08, 28), wdL, 0, 1.2, 0, tb);
    mesh(K.cyl(0.07, 0.09, 1.15, 10), wd, 0, 0.6, 0, tb);
    mesh(K.cyl(0.4, 0.45, 0.06, 20), wd, 0, 0.03, 0, tb);
    const lamp = group(-0.22, 1.24, -0.22, tb);
    mesh(K.cyl(0.16, 0.2, 0.08, 16), mat('#c9a24a', { metalness: 0.6, roughness: 0.3 }), 0, 0.04, 0, lamp);
    mesh(K.cyl(0.03, 0.03, 0.8, 8), mat('#c9a24a', { metalness: 0.6, roughness: 0.3 }), 0, 0.45, 0, lamp);
    const shadeM = new T.MeshStandardMaterial({ color: night ? 0xffe6b0 : 0xf2dcb0, emissive: night ? 0xffb860 : 0x000000, emissiveIntensity: night ? 0.9 : 0, roughness: 0.9, side: T.DoubleSide });
    mesh(new T.CylinderGeometry(0.22, 0.38, 0.42, 20, 1, true), shadeM, 0, 0.92, 0, lamp);
    sp(-3.45, 1.25, 3.7, 0.55, 0.55, { max: 0.55, tag: 'table' });
    blob(root, -3.6, 3.55, 1.5, 1.5, 0.35);
    if (night) { const pl = ctx.light(new T.PointLight(0xffb060, 9, 7, 1.6)); pl.position.set(-3.8, 2.4, 3.3); }

    // ── 깔개
    const rug = mesh(K.box(4.6, 0.03, 3.3), new T.MeshStandardMaterial({ map: rugTex(pal.rug[0], pal.rug[1], pal.rug[2]), roughness: 1 }), 0.7, 0.016, 0.7, root);
    rug.castShadow = false;
    sp(0.7, 0.032, 0.7, 4.0, 2.8, { max: 0.95, tag: 'rug' });

    // ── 흔들목마
    const hs = group(3.0, 0, -0.9, root);
    hs.rotation.y = -0.7;
    const hw = pm(pick(r, ['#f2efe6', '#e8c07a', '#d9d2c4']), { roughness: 0.5 }), mane = mat('#5a3420', { roughness: 0.9 }), red = mat('#c8323a', { roughness: 0.5 });
    [-1, 1].forEach((s) => { const rk = mesh(K.torus(1.5, 0.06, Math.PI * 0.42), red, 0, 1.55, s * 0.32, hs); rk.rotation.z = Math.PI * 1.29; });
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => { const l = mesh(K.cyl(0.07, 0.06, 0.75, 8), hw, sx * 0.5, 0.42, sz * 0.22, hs); l.rotation.z = -sx * 0.25; l.rotation.x = sz * 0.15; }));
    const body = mesh(K.capsule(0.3, 0.8), hw, 0, 0.92, 0, hs); body.rotation.z = Math.PI / 2;
    const neck = mesh(K.capsule(0.18, 0.45), hw, 0.62, 1.32, 0, hs); neck.rotation.z = -0.6;
    const head = mesh(K.capsule(0.17, 0.35), hw, 0.95, 1.52, 0, hs); head.rotation.z = -1.25;
    mesh(rbox(0.5, 0.35, 0.1, 0.05), mane, 0.55, 1.5, 0, hs).rotation.z = -0.6;
    [-1, 1].forEach((s) => { mesh(K.sphere(0.04, 8, 6), mat('#1a1a1a'), 1.0, 1.62, s * 0.15, hs); mesh(K.cone(0.06, 0.16, 6), hw, 0.82, 1.78, s * 0.09, hs); });
    mesh(rbox(0.6, 0.06, 0.5, 0.03), red, -0.05, 1.2, 0, hs);
    const tl = mesh(K.cone(0.12, 0.6, 8), mane, -0.7, 0.85, 0, hs); tl.rotation.z = 2.4;
    blob(root, 3.0, -0.9, 2.6, 1.6, 0.4);

    // ── 여행 가방 (누워 있음)
    const sc = group(-1.3, 0, 3.4, root);
    sc.rotation.y = 0.25;
    const lea = pm(pick(r, ['#8a4a2a', '#6a2a2a', '#3a4a5a']), { roughness: 0.55 });
    mesh(rbox(1.6, 0.46, 1.1, 0.08), lea, 0, 0.23, 0, sc);
    [-0.45, 0.45].forEach((x) => mesh(rbox(0.1, 0.48, 1.12, 0.02), mat('#3a2a1a'), x, 0.23, 0, sc));
    const hd = mesh(K.torus(0.16, 0.035, Math.PI), mat('#3a2a1a'), 0, 0.3, 0.58, sc); hd.rotation.x = Math.PI / 2; hd.rotation.y = 0;
    [[-0.78, -0.53], [0.78, -0.53], [-0.78, 0.53], [0.78, 0.53]].forEach(([x, z]) => mesh(K.sphere(0.06, 8, 6), mat('#d9a93a', { metalness: 0.7, roughness: 0.3 }), x, 0.42, z, sc));
    sp(-1.3, 0.47, 3.4, 1.3, 0.8, { max: 0.7, tag: 'case' });
    blob(root, -1.3, 3.4, 2.2, 1.6, 0.4);

    // ── 왼벽 선반 + 액자
    const ws = group(-4.72, 3.0, 2.2, root);
    mesh(rbox(0.5, 0.1, 2.2, 0.03), wdL, 0, 0, 0, ws);
    [-0.8, 0.8].forEach((z) => mesh(rbox(0.4, 0.3, 0.06, 0.02), wd, -0.05, -0.2, z, ws));
    sp(-4.68, 3.05, 2.2, 0.36, 2.0, { max: 0.55, tag: 'wallshelf' });
    const pics = Object.keys(P.pics);
    P.frame(root, -5, 3.9, -1.6, 1.4, 1.1, P.pics[pick(r, pics)], { onLeft: 1, color: '#c9a24a' });
    P.frame(root, -5, 4.5, 0.6, 0.8, 1.0, P.pics[pick(r, pics)], { onLeft: 1, color: '#5a3420' });


    // ── 왼벽 선반장
    const ls = group(-4.5, 0, -2.75, root);
    mesh(rbox(0.12, 3.3, 1.9, 0.03), wd, -0.38, 1.65, 0, ls);
    [-0.95, 0.95].forEach((z) => mesh(rbox(0.85, 3.3, 0.1, 0.03), wd, 0, 1.65, z, ls));
    [0.1, 1.1, 2.1, 3.25].forEach((y, i) => {
      mesh(rbox(0.85, 0.08, 1.9, 0.03), wdL, 0, y, 0, ls);
      sp(-4.5, y + 0.04, -2.75, 0.62, 1.7, { max: 0.75, tag: 'lshelf' });
    });
    blob(root, -4.4, -2.75, 1.2, 2.4, 0.35);

    // ── 오른쪽 앞 나무 벤치
    const bn = group(4.1, 0, 1.4, root);
    bn.rotation.y = Math.PI / 2;
    mesh(rbox(2.6, 0.12, 0.8, 0.04), wdL, 0, 0.75, 0, bn);
    [[-1.1, -0.3], [1.1, -0.3], [-1.1, 0.3], [1.1, 0.3]].forEach(([x, z]) => mesh(rbox(0.1, 0.72, 0.1, 0.02), wd, x, 0.36, z, bn));
    mesh(rbox(2.4, 0.06, 0.6, 0.02), wd, 0, 0.22, 0, bn);
    sp(4.1, 0.81, 1.4, 0.7, 2.4, { max: 0.75, tag: 'bench' });
    sp(4.1, 0.25, 1.4, 0.5, 2.2, { max: 0.45, tag: 'under' });
    blob(root, 4.1, 1.4, 1.2, 3.0, 0.35);

    // ── 바닥 빈자리 (앞)
    sp(2.6, 0.01, 3.5, 1.8, 2.2, { max: 0.95, tag: 'floor' });
    sp(1.2, 0.01, 4.2, 1.6, 1.0, { max: 0.95, tag: 'floor' });
    sp(-0.2, 0.01, -2.0, 1.6, 0.9, { max: 0.9, tag: 'floor' });
    sp(-2.4, 0.01, 1.0, 0.9, 2.4, { max: 0.85, tag: 'floor' });
    sp(2.4, 0.01, 0.9, 0.9, 1.6, { max: 0.85, tag: 'floor' });
    sp(-2.6, 0.01, -1.4, 1.2, 0.9, { max: 0.85, tag: 'floor' });
    // 페인트 깡통
    [[2.4, 2.9], [2.75, 2.65]].forEach(([x, z], i) => {
      const cn = group(x, 0, z, root);
      mesh(K.cyl(0.26, 0.26, 0.5, 18), mat('#c9cdd2', { metalness: 0.6, roughness: 0.4 }), 0, 0.25, 0, cn);
      mesh(K.cyl(0.265, 0.265, 0.22, 18), mat(i ? '#3a7ad8' : '#e8b03a', { roughness: 0.6 }), 0, 0.26, 0, cn);
      blob(root, x, z, 0.8, 0.8, 0.35);
    });

    // ── 매달린 전구
    mesh(K.cyl(0.012, 0.012, 1.6, 4), mat('#222222'), 0.6, 5.0, -1.0, root).castShadow = false;
    const bb = mesh(K.sphere(0.16, 14, 10), new T.MeshStandardMaterial({ color: 0xfff2c8, emissive: night ? 0xffd080 : 0x221a10, emissiveIntensity: night ? 2.2 : 0.4 }), 0.6, 4.05, -1.0, root);
    bb.castShadow = false;
    if (night) {
      const pl = ctx.light(new T.PointLight(0xffd090, 14, 12, 1.4)); pl.position.set(0.6, 3.9, -1.0);
      ctx.sun.intensity = 0.55; ctx.sun.color.set(0x8fa0ff); ctx.hemi.intensity = 0.28; ctx.env = 0.35;
    } else {
      ctx.sun.position.set(9, 12, 3);
    }
    return { view: { fit: 6.0, ly: 2.2 } };
  };
})();
