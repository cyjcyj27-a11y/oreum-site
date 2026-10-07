// 장면 3: 할머니 댁 (장판·자개장·텔레비전·교자상)
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;

  function jangpan(base) {
    return tex(512, 512, (c, W, H) => {
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      const s = W / 4;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = `rgba(120,70,20,${0.04 + ((x * 7 + y * 3) % 5) * 0.015})`; c.fillRect(x * s + 2, y * s + 2, s - 4, s - 4); }
      c.strokeStyle = 'rgba(110,60,20,0.35)'; c.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, H); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(W, i * s); c.stroke(); }
      const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.08)');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
    }, [2.5, 2.5]);
  }
  function hanji(base, flower) {
    return tex(256, 256, (c, W, H) => {
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(150,120,80,${Math.random() * 0.06})`; c.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1); }
      c.fillStyle = flower;
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        const cx = x * 64 + (y % 2) * 32 + 16, cy = y * 64 + 20;
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.beginPath(); c.ellipse(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 5, 3, a, 0, 7); c.fill(); }
      }
    }, [4, 2.4]);
  }
  function najeon() {   // 자개 무늬
    return tex(256, 256, (c, W, H) => {
      c.fillStyle = '#1a1416'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#c9a24a'; c.lineWidth = 3; c.strokeRect(10, 10, W - 20, H - 20);
      const pearl = ['#f4f0ff', '#c8f0e8', '#f8d8e8', '#e0e8ff'];
      // 학과 구름
      for (let i = 0; i < 26; i++) {
        c.fillStyle = pearl[i % 4]; c.globalAlpha = 0.85;
        const x = 30 + Math.random() * (W - 60), y = 30 + Math.random() * (H - 60);
        c.beginPath(); c.ellipse(x, y, 4 + Math.random() * 10, 2 + Math.random() * 4, Math.random() * 3, 0, 7); c.fill();
      }
      c.globalAlpha = 1; c.fillStyle = '#f4f0ff';
      c.beginPath(); c.ellipse(W * 0.55, H * 0.45, 26, 9, -0.4, 0, 7); c.fill();
      c.beginPath(); c.moveTo(W * 0.65, H * 0.4); c.lineTo(W * 0.78, H * 0.28); c.lineTo(W * 0.8, H * 0.31); c.fill();
      c.fillStyle = '#d8304a'; c.beginPath(); c.arc(W * 0.79, H * 0.29, 4, 0, 7); c.fill();
    });
  }

  SCN.grandma = function (ctx) {
    const r = ctx.r, root = ctx.root, night = ctx.opt.night, sp = ctx.spot;
    const pal = pick(r, [
      { floor: '#d9a858', wall: '#f2e8d2', flower: 'rgba(200,120,120,0.35)', cush: ['#d8503a', '#3a6ab0', '#e8b030'] },
      { floor: '#cf9c4c', wall: '#eef0e0', flower: 'rgba(110,150,110,0.35)', cush: ['#8a3a8a', '#3a8a6a', '#e86a4a'] },
      { floor: '#d4a050', wall: '#f4e4d8', flower: 'rgba(120,130,190,0.35)', cush: ['#c83a3a', '#2a5a8a', '#4a9a5a'] },
    ]);
    ctx.bg(night ? '#2a2638' : '#f3ebdc', night ? '#191724' : '#dccbb0');
    P.room(ctx, { floorTex: jangpan(pal.floor), wallTex: hanji(pal.wall, pal.flower), wallTex2: hanji(shade(pal.wall, -0.03), pal.flower), slab: '#6a4a32', wallEdge: '#8a5a3a', baseboard: '#7a5232', height: 6.6, wainscot: '#a87850', wainscotH: 0.9 });

    // ── 자개장 (뒷벽 왼쪽)
    const jg = group(-2.9, 0, -4.45, root);
    const lac = mat('#1a1416', { roughness: 0.18, metalness: 0.1 });
    mesh(rbox(3.6, 3.8, 1.0, 0.04), lac, 0, 2.0, 0, jg);
    mesh(rbox(3.8, 0.16, 1.1, 0.03), lac, 0, 3.98, 0, jg);
    mesh(rbox(3.7, 0.25, 1.05, 0.03), mat('#2a2022', { roughness: 0.3 }), 0, 0.12, 0, jg);
    const nj = new T.MeshStandardMaterial({ map: najeon(), roughness: 0.2, metalness: 0.15 });
    [-1.2, 0, 1.2].forEach((x) => { mesh(K.box(1.1, 3.0, 0.02), nj, x, 2.1, 0.51, jg); mesh(K.cyl(0.05, 0.05, 0.04, 10), mat('#c9a24a', { metalness: 0.8, roughness: 0.3 }), x + (x > 0 ? -0.45 : 0.45), 2.1, 0.53, jg).rotation.x = Math.PI / 2; });
    sp(-2.9, 4.08, -4.45, 3.4, 0.85, { max: 0.75, tag: 'top' });
    blob(root, -2.9, -4.4, 4.2, 1.5, 0.4);

    // ── 텔레비전 장 + 옛 텔레비전
    const tv = group(0.9, 0, -4.4, root);
    const wood = mat('#8a5a32', { roughness: 0.45 });
    mesh(rbox(2.8, 1.1, 1.0, 0.04), wood, 0, 0.55, 0, tv);
    [-0.7, 0.7].forEach((x) => mesh(rbox(1.2, 0.8, 0.02, 0.02), mat('#a87048', { roughness: 0.45 }), x, 0.55, 0.51, tv));
    const box = group(-0.4, 1.1, 0, tv);
    mesh(rbox(1.5, 1.2, 1.0, 0.1), mat('#6a4a32', { roughness: 0.4 }), 0, 0.6, 0, box);
    const scr = tex(128, 96, (c, W, H) => { const g2 = c.createRadialGradient(W / 2, H / 2, 5, W / 2, H / 2, W / 1.6); g2.addColorStop(0, night ? '#8ac8ff' : '#4a5a6a'); g2.addColorStop(1, '#1a2028'); c.fillStyle = g2; c.fillRect(0, 0, W, H); });
    mesh(rbox(1.0, 0.8, 0.04, 0.1), new T.MeshStandardMaterial({ map: scr, roughness: 0.1, emissive: night ? 0x3a5a8a : 0x000000, emissiveIntensity: night ? 0.8 : 0 }), -0.15, 0.62, 0.5, box);
    [0.95, 0.75].forEach((y, i) => mesh(K.cyl(0.06, 0.06, 0.05, 12), mat('#c9a24a', { metalness: 0.6 }), 0.55, y - i * 0.05 - 0.2, 0.52, box).rotation.x = Math.PI / 2);
    [-1, 1].forEach((s) => { const a = mesh(K.cyl(0.012, 0.012, 1.0, 4), mat('#c9cdd2', { metalness: 0.8 }), s * 0.25, 1.6, 0, box); a.rotation.z = s * 0.5; });
    sp(1.85, 1.15, -4.4, 0.75, 0.8, { max: 0.75, tag: 'tvside' });
    if (night) { const pl = ctx.light(new T.PointLight(0x8ac8ff, 4, 5, 1.6)); pl.position.set(0.6, 1.9, -3.6); }
    blob(root, 0.9, -4.3, 3.4, 1.5, 0.4);

    // ── 창호 창 (뒷벽 오른쪽)
    P.window(root, 3.5, 3.6, -5, 1.8, 1.6, night ? { stars: 1, skyTop: '#1b2350', skyBot: '#3a4a8a', frame: '#8a5a3a' } : { frame: '#8a5a3a', skyTop: '#9fd4f2', skyBot: '#e8f6ff', hill: '#7ab86a' });
    const lat = mat('#8a5a3a');
    for (let i = 1; i < 4; i++) { mesh(K.box(0.04, 1.6, 0.04), lat, 3.5 - 0.9 + i * 0.45, 3.6, -4.9, root); mesh(K.box(1.8, 0.04, 0.04), lat, 3.5, 3.6 - 0.8 + i * 0.4, -4.9, root); }
    sp(3.5, 2.64, -4.78, 1.9, 0.38, { max: 0.55, tag: 'sill' });

    // ── 창 아래 낮은 장, 왼벽 안쪽 장식장
    Q.shelf(ctx, 3.55, -4.55, { w: 1.9, d: 0.8, h: 1.5, levels: 2, color: '#8a5a32', books: 0.35, max: 0.6 });
    Q.shelf(ctx, -4.55, -3.0, { w: 1.6, d: 0.8, h: 2.4, levels: 2, rot: Math.PI / 2, color: '#6a3a22', books: 0.3, max: 0.8 });

    // ── 왼벽: 반닫이 + 이불 더미
    const bd = group(-4.45, 0, -0.6, root);
    bd.rotation.y = Math.PI / 2;
    mesh(rbox(2.6, 1.2, 0.95, 0.04), mat('#7a4a28', { roughness: 0.4 }), 0, 0.6, 0, bd);
    const brass = mat('#c9a24a', { metalness: 0.7, roughness: 0.3 });
    [-0.9, 0, 0.9].forEach((x) => { mesh(rbox(0.5, 0.06, 0.02, 0.01), brass, x, 0.95, 0.48, bd); mesh(K.cyl(0.08, 0.08, 0.03, 12), brass, x, 0.6, 0.49, bd).rotation.x = Math.PI / 2; });
    const qc = ['#e86a7a', '#5a8ad8', '#f0c050', '#7ac08a', '#f4f0e6', '#c86ad8'];
    let qy = 1.2;
    for (let i = 0; i < 4; i++) {
      const h = 0.22 + r() * 0.08;
      const q = mesh(rbox(2.0 - i * 0.12, h, 0.85, 0.1), mat(pick(r, qc), { roughness: 1 }), (r() - 0.5) * 0.1, qy + h / 2, 0, bd);
      qy += h;
    }
    sp(-4.45, qy + 0.02, -0.6, 0.7, 1.4, { max: 0.65, tag: 'quilt' });
    sp(-4.45, 1.22, 0.75, 0.75, 0.2, { max: 0.5, tag: 'chest' });
    blob(root, -4.45, -0.6, 1.5, 3.2, 0.4);

    // ── 병풍 (왼벽 앞쪽)
    const bp = group(-4.6, 0, 2.8, root);
    const scr2 = tex(256, 512, (c, W, H) => {
      c.fillStyle = '#efe4c8'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#3a3a3a'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(W * 0.3, H); c.bezierCurveTo(W * 0.2, H * 0.6, W * 0.6, H * 0.5, W * 0.45, H * 0.15); c.stroke();
      c.fillStyle = '#e86a8a';
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(W * (0.3 + Math.random() * 0.4), H * (0.15 + Math.random() * 0.5), 8, 0, 7); c.fill(); }
      c.fillStyle = '#2a2a2a'; c.font = '28px serif'; c.fillText('福', W * 0.72, H * 0.12);
    });
    for (let i = 0; i < 4; i++) {
      const pnl = mesh(K.box(0.06, 2.6, 0.75), [new T.MeshStandardMaterial({ map: scr2, roughness: 0.9 }), mat('#5a2a1a'), mat('#5a2a1a'), mat('#5a2a1a'), mat('#5a2a1a'), mat('#5a2a1a')], (i % 2) * 0.28, 1.3, -1.1 + i * 0.72, bp);
      pnl.rotation.y = i % 2 ? -0.35 : 0.35;
    }
    blob(root, -4.4, 2.8, 1.0, 3.2, 0.35);

    // ── 벽 장식: 달력, 시계, 가족사진
    const cal = tex(128, 192, (c, W, H) => {
      c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#3a7ab0'; c.fillRect(0, 0, W, 70);
      c.fillStyle = '#d8302a'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('10', W / 2, 120);
      c.fillStyle = '#888'; for (let y = 0; y < 4; y++) for (let x = 0; x < 7; x++) c.fillRect(8 + x * 16, 136 + y * 13, 9, 6);
    });
    mesh(K.box(0.9, 1.35, 0.03), new T.MeshStandardMaterial({ map: cal, roughness: 0.9 }), 0.9, 4.0, -4.94, root).castShadow = false;
    P.clock(root, -4.95, 4.3, -2.2, '#8a5a32', true);
    P.frame(root, -5, 4.0, 0.6, 1.4, 1.0, P.pics.mountain, { onLeft: 1, color: '#c9a24a' });

    // ── 교자상 + 방석
    Q.table(ctx, 0.6, 0.6, { w: 2.6, d: 1.5, h: 0.75, color: '#a8683a', under: false, max: 0.8 });
    // 과일 접시
    const fp = group(0.2, 0.81, 0.4, root);
    mesh(K.cyl(0.42, 0.3, 0.08, 22), mat('#f4f0e6', { roughness: 0.25 }), 0, 0.04, 0, fp);
    [[0, 0, '#e85a3a'], [0.18, 0.1, '#f0a030'], [-0.15, 0.12, '#e85a3a'], [0.05, -0.18, '#f0a030']].forEach(([x, z, c]) => mesh(K.sphere(0.13, 14, 10), mat(c, { roughness: 0.4 }), x, 0.18, z, fp));
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b], i) => {
      const cx = 0.6 + a * 1.9, cz = 0.6 + b * 1.35;
      const cu = mesh(rbox(0.95, 0.16, 0.95, 0.12), mat(pal.cush[i % 3], { roughness: 1 }), cx, 0.08, cz, root);
      cu.rotation.y = (r() - 0.5) * 0.5;
      mesh(K.sphere(0.05, 8, 6), mat('#f0d070'), cx, 0.17, cz, root);
    });

    // ── 오른쪽 앞: 낮은 장 + 전기밥솥, 선풍기
    const lc = group(3.9, 0, 1.8, root);
    lc.rotation.y = -Math.PI / 2;
    mesh(rbox(2.2, 0.9, 0.9, 0.04), mat('#9a6a42', { roughness: 0.45 }), 0, 0.45, 0, lc);
    const rc = group(-0.6, 0.9, 0, lc);
    mesh(K.cyl(0.32, 0.3, 0.5, 22), mat('#f4f0f0', { roughness: 0.3 }), 0, 0.25, 0, rc);
    mesh(K.sphere(0.32, 22, 10), mat('#d84a4a', { roughness: 0.3 }), 0, 0.5, 0, rc).scale.y = 0.35;
    mesh(rbox(0.3, 0.06, 0.08, 0.02), mat('#3a3a3a'), 0, 0.62, 0, rc);
    sp(3.9, 0.92, 2.45, 0.7, 0.9, { max: 0.7, tag: 'cabinet' });
    blob(root, 3.9, 1.8, 1.5, 2.8, 0.4);
    const fan = group(3.4, 0, -1.6, root);
    fan.rotation.y = -0.8;
    mesh(K.cyl(0.35, 0.4, 0.08, 20), mat('#e8e8f0', { roughness: 0.3 }), 0, 0.04, 0, fan);
    mesh(K.cyl(0.05, 0.05, 1.6, 8), mat('#c9cdd2', { metalness: 0.6 }), 0, 0.85, 0, fan);
    const head = group(0, 1.75, 0, fan);
    mesh(K.sphere(0.14, 12, 10), mat('#e8e8f0'), 0, 0, -0.12, head);
    mesh(K.torus(0.42, 0.015), mat('#c9cdd2', { metalness: 0.6 }), 0, 0, 0.08, head);
    for (let i = 0; i < 3; i++) { const bl = mesh(K.sphere(0.2, 12, 8), new T.MeshStandardMaterial({ color: 0x8ad0f0, roughness: 0.2, transparent: true, opacity: 0.75 }), Math.cos(i * 2.1) * 0.2, Math.sin(i * 2.1) * 0.2, 0.06, head); bl.scale.set(1, 0.45, 0.1); bl.rotation.z = i * 2.1; }
    blob(root, 3.4, -1.6, 1.0, 1.0, 0.4);

    // ── 바닥 자리
    sp(0.6, 0.01, 3.4, 3.0, 1.4, { max: 0.95, tag: 'floor' });
    sp(-2.6, 0.01, 1.4, 1.2, 2.4, { max: 0.9, tag: 'floor' });
    sp(-1.4, 0.01, -2.8, 2.2, 0.9, { max: 0.85, tag: 'floor' });
    sp(2.2, 0.01, -2.4, 1.6, 1.0, { max: 0.85, tag: 'floor' });
    sp(2.6, 0.01, 3.4, 1.0, 1.4, { max: 0.85, tag: 'floor' });
    sp(-0.2, 0.01, -1.9, 1.4, 0.9, { max: 0.85, tag: 'floor' });
    sp(2.9, 0.01, 0.1, 0.9, 1.6, { max: 0.85, tag: 'floor' });
    sp(-1.8, 0.01, 3.7, 1.4, 0.9, { max: 0.85, tag: 'floor' });

    // ── 형광등
    const fl = mesh(rbox(2.2, 0.12, 0.3, 0.05), new T.MeshStandardMaterial({ color: 0xffffff, emissive: night ? 0xf0f8ff : 0x222222, emissiveIntensity: night ? 1.4 : 0.3 }), 0.3, 6.4, -1.0, root);
    fl.castShadow = false;
    if (night) {
      const pl = ctx.light(new T.PointLight(0xf4f8ff, 14, 12, 1.3)); pl.position.set(0.3, 5.6, 0);
      ctx.sun.intensity = 0.5; ctx.sun.color.set(0x8fa0ff); ctx.hemi.intensity = 0.3; ctx.env = 0.4;
    }
    return { view: { fit: 6.0, ly: 2.0 }, density: 1.35, clutter: ['plates', 'teapot', 'cushion', 'yarn', 'basket', 'vase', 'pot', 'sewbox', 'jar', 'books', 'frame', 'radio'] };
  };
})();
