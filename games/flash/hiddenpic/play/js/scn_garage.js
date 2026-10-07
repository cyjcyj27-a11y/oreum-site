// 장면 4: 차고 (작업대·공구판·철제 선반·자전거)
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;

  function concrete(base) {
    return tex(512, 512, (c, W, H) => {
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
      for (let i = 0; i < 6; i++) { const g = c.createRadialGradient(Math.random() * W, Math.random() * H, 4, Math.random() * W, Math.random() * H, 60 + Math.random() * 60); g.addColorStop(0, 'rgba(40,30,20,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
      c.strokeStyle = 'rgba(0,0,0,0.2)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.moveTo(W / 2, 0); c.lineTo(W / 2, H); c.stroke();
      c.fillStyle = 'rgba(240,200,40,0.7)'; c.fillRect(W * 0.08, 0, 14, H);
    }, [2, 2]);
  }
  function rollTex() {
    return tex(256, 256, (c, W, H) => {
      c.fillStyle = '#b8bec6'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 16) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, y, W, 3); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, y + 12, W, 4); }
    });
  }
  function bike(parent, x, z, rot, col) {
    const g = group(x, 0, z, parent);
    g.rotation.y = rot;
    const fr = mat(col, { roughness: 0.3, metalness: 0.3 }), tire = mat('#1e1e22', { roughness: 0.8 }), steel = mat('#c9cdd2', { metalness: 0.8, roughness: 0.25 });
    [-0.75, 0.75].forEach((zz) => { mesh(K.torus(0.5, 0.06), tire, 0, 0.56, zz, g).rotation.y = Math.PI / 2; mesh(K.cyl(0.04, 0.04, 0.12, 8), steel, 0, 0.56, zz, g).rotation.z = Math.PI / 2; for (let k = 0; k < 6; k++) { const s = mesh(K.cyl(0.008, 0.008, 0.95, 3), steel, 0, 0.56, zz, g); s.rotation.x = k * Math.PI / 6; } });
    const bar = (a, b) => { const v = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const q = mesh(K.cyl(0.04, 0.04, v.length(), 8), fr, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, g); q.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), v.normalize()); };
    bar([0, 0.56, -0.75], [0, 0.6, 0]); bar([0, 0.6, 0], [0, 1.15, -0.1]); bar([0, 1.12, -0.1], [0, 1.15, 0.6]); bar([0, 0.6, 0], [0, 1.15, 0.6]); bar([0, 1.15, 0.6], [0, 0.56, 0.75]); bar([0, 0.56, -0.75], [0, 1.12, -0.1]);
    mesh(rbox(0.16, 0.06, 0.3, 0.03), mat('#2a2a2a'), 0, 1.22, -0.12, g);
    const hb = mesh(K.cyl(0.03, 0.03, 0.6, 8), steel, 0, 1.32, 0.62, g); hb.rotation.x = Math.PI / 2; hb.rotation.z = Math.PI / 2;
    mesh(K.cyl(0.03, 0.03, 0.2, 8), steel, 0, 1.24, 0.62, g);
    return g;
  }

  SCN.garage = function (ctx) {
    const r = ctx.r, root = ctx.root, night = ctx.opt.night, sp = ctx.spot;
    const pal = pick(r, [{ floor: '#9a9a96', wall: '#c8c0b4', bench: '#a8783a', box: '#d8302a' }, { floor: '#8e9298', wall: '#b8c4c8', bench: '#8a6a4a', box: '#2a6ad8' }, { floor: '#a09a90', wall: '#d0c4b0', bench: '#9a7048', box: '#e8a020' }]);
    ctx.bg(night ? '#262a36' : '#ece8e0', night ? '#16181f' : '#cfc8bc');
    P.room(ctx, { floorTex: concrete(pal.floor), wallTex: Q.paint(pal.wall, r, { brick: 1, dark: 1 }), wallTex2: Q.paint(shade(pal.wall, -0.04), r, { brick: 1, dark: 1 }), slab: '#55555a', wallEdge: '#8a8a90', baseboard: '#6a6a70', height: 7 });

    // ── 셔터 (뒷벽 오른쪽)
    const shutter = mesh(K.box(2.8, 4.2, 0.08), [mat('#9aa0a8'), mat('#9aa0a8'), mat('#9aa0a8'), mat('#9aa0a8'), new T.MeshStandardMaterial({ map: rollTex(), roughness: 0.5, metalness: 0.4 }), mat('#9aa0a8')], 3.5, 2.1, -4.94, root);
    shutter.castShadow = false;
    mesh(rbox(3.1, 0.5, 0.4, 0.05), mat('#6a6e74', { metalness: 0.5 }), 3.5, 4.45, -4.8, root);

    // ── 작업대 + 공구판
    const wb = group(-1.4, 0, -4.4, root);
    const wbt = mat(pal.bench, { roughness: 0.65 });
    mesh(rbox(3.4, 0.14, 1.1, 0.03), wbt, 0, 1.45, 0, wb);
    [[-1.55, -0.45], [1.55, -0.45], [-1.55, 0.45], [1.55, 0.45]].forEach(([a, b]) => mesh(rbox(0.12, 1.45, 0.12, 0.02), mat('#5a5a60', { metalness: 0.5 }), a, 0.72, b, wb));
    mesh(rbox(3.2, 0.06, 0.95, 0.02), wbt, 0, 0.45, 0, wb);
    const vise = group(1.3, 1.52, 0.35, wb);
    mesh(rbox(0.3, 0.22, 0.3, 0.03), mat('#2a5ad8', { metalness: 0.4 }), 0, 0.11, 0, vise);
    mesh(K.cyl(0.02, 0.02, 0.4, 6), mat('#c9cdd2', { metalness: 0.8 }), 0, 0.12, 0.25, vise).rotation.x = Math.PI / 2;
    sp(-1.6, 1.53, -4.4, 2.6, 0.9, { max: 0.8, tag: 'bench' });
    sp(-1.4, 0.49, -4.4, 2.9, 0.8, { max: 0.75, tag: 'under' });
    const pt = tex(256, 128, (c, W, H) => { c.fillStyle = '#e8d8b8'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(60,40,20,0.5)'; for (let y = 6; y < H; y += 12) for (let x = 6; x < W; x += 12) { c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); } });
    mesh(K.box(3.4, 1.8, 0.05), new T.MeshStandardMaterial({ map: pt, roughness: 0.8 }), -1.4, 2.7, -4.95, root).castShadow = false;
    // 걸린 공구(장식): 렌치·톱·줄자
    const steel = mat('#9aa0a8', { metalness: 0.7, roughness: 0.3 });
    [-2.6, -2.2, -1.8].forEach((x, i) => { mesh(rbox(0.08, 0.7 - i * 0.1, 0.03, 0.02), steel, x, 2.8, -4.9, root); mesh(K.torus(0.07, 0.025), steel, x, 3.2 - i * 0.05, -4.9, root); });
    const saw = mesh(K.box(0.9, 0.3, 0.02), steel, -0.6, 2.4, -4.9, root); saw.rotation.z = 0.1;
    mesh(rbox(0.3, 0.2, 0.1, 0.03), mat('#c8402e'), -1.15, 2.42, -4.9, root);
    mesh(K.cyl(0.18, 0.18, 0.1, 18), mat('#f0c030'), -0.3, 3.2, -4.88, root).rotation.x = Math.PI / 2;

    // ── 철제 선반 (왼벽)
    Q.shelf(ctx, -4.5, -1.4, { w: 3.0, d: 0.85, h: 4.2, levels: 4, rot: Math.PI / 2, color: '#6a6e74', books: 0, max: 0.8, back: false });

    // ── 빨간 공구 수레장
    const tc = group(1.2, 0, -4.2, root);
    const tcm = mat(pal.box, { roughness: 0.3, metalness: 0.2 });
    mesh(rbox(1.5, 1.5, 0.9, 0.05), tcm, 0, 0.85, 0, tc);
    for (let i = 0; i < 5; i++) { mesh(K.box(1.4, 0.02, 0.02), mat('#2a2a2a'), 0, 0.3 + i * 0.27, 0.46, tc); mesh(rbox(0.5, 0.05, 0.05, 0.02), mat('#c9cdd2', { metalness: 0.8 }), 0, 0.42 + i * 0.27, 0.48, tc); }
    [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([a, b]) => mesh(K.sphere(0.08, 8, 6), mat('#2a2a2a'), a, 0.08, b, tc));
    sp(1.2, 1.62, -4.2, 1.3, 0.75, { max: 0.75, tag: 'cabinet' });
    blob(root, 1.2, -4.2, 2.0, 1.4, 0.4);

    // ── 타이어 더미 (왼쪽 앞)
    const ty = group(-4.0, 0, 1.6, root);
    for (let i = 0; i < 3; i++) { const t = mesh(K.torus(0.42, 0.18), mat('#1e1e22', { roughness: 0.85 }), (r() - 0.5) * 0.1, 0.18 + i * 0.36, (r() - 0.5) * 0.1, ty); t.rotation.x = Math.PI / 2; }
    sp(-4.0, 1.08, 1.6, 0.6, 0.6, { max: 0.6, tag: 'tire' });
    blob(root, -4.0, 1.6, 1.5, 1.5, 0.4);
    // ── 자전거 (왼벽 앞쪽에 기대어)
    bike(root, -4.3, 3.4, 0.05, pick(r, ['#2a8ad8', '#e8402a', '#3aa86a']));
    blob(root, -4.3, 3.4, 0.6, 2.0, 0.35);

    // ── 드럼통·나무 궤짝 (오른쪽 뒤)
    const dr = group(3.9, 0, -2.6, root);
    mesh(K.cyl(0.5, 0.5, 1.4, 22), mat('#2a6a4a', { roughness: 0.4, metalness: 0.4 }), 0, 0.7, 0, dr);
    [0.25, 0.7, 1.15].forEach((y) => mesh(K.torus(0.5, 0.03), mat('#1a4a32', { metalness: 0.5 }), 0, y, 0, dr).rotation.x = Math.PI / 2);
    sp(3.9, 1.42, -2.6, 0.6, 0.6, { max: 0.6, tag: 'drum' });
    blob(root, 3.9, -2.6, 1.4, 1.4, 0.4);
    const cr = group(4.0, 0, -0.9, root);
    mesh(rbox(1.2, 0.9, 1.0, 0.03), mat('#b98a5a', { roughness: 0.85 }), 0, 0.45, 0, cr);
    mesh(rbox(1.0, 0.7, 0.85, 0.03), mat('#a87a4a', { roughness: 0.85 }), 0.05, 1.25, 0, cr).rotation.y = 0.2;
    sp(4.0, 1.62, -0.9, 0.7, 0.6, { max: 0.6, tag: 'crate' });
    blob(root, 4.0, -0.9, 1.8, 1.6, 0.4);

    // ── 가운데: 페달 자동차 (아이 장난감 차)
    const pc = group(0.6, 0, 1.0, root);
    pc.rotation.y = 0.5;
    const body = mat(pick(r, ['#e8402a', '#f0b020', '#2a8ad8']), { roughness: 0.25, metalness: 0.2 });
    mesh(rbox(1.0, 0.55, 2.0, 0.22), body, 0, 0.55, 0, pc);
    mesh(rbox(0.9, 0.35, 0.8, 0.2), body, 0, 0.98, -0.3, pc);
    mesh(rbox(0.85, 0.3, 0.06, 0.04), new T.MeshStandardMaterial({ color: 0xbfe3f5, roughness: 0.05 }), 0, 1.0, 0.12, pc);
    [[-0.52, -0.6], [0.52, -0.6], [-0.52, 0.65], [0.52, 0.65]].forEach(([a, b]) => { const w = mesh(K.cyl(0.24, 0.24, 0.16, 18), mat('#1e1e22'), a, 0.24, b, pc); w.rotation.z = Math.PI / 2; mesh(K.cyl(0.1, 0.1, 0.17, 12), mat('#e8e8e8', { metalness: 0.6 }), a, 0.24, b, pc).rotation.z = Math.PI / 2; });
    [-0.25, 0.25].forEach((x) => mesh(K.sphere(0.08, 10, 8), new T.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0x332a10 }), x, 0.62, 1.0, pc));
    sp(0.6, 1.16, 1.0, 0.6, 0.6, { max: 0.55, tag: 'carroof' });
    blob(root, 0.6, 1.0, 1.8, 2.6, 0.45);

    // ── 바닥 자리
    sp(-1.6, 0.01, -2.8, 2.4, 1.2, { max: 0.95, tag: 'floor' });
    sp(2.2, 0.01, -2.4, 1.2, 1.4, { max: 0.9, tag: 'floor' });
    sp(-2.2, 0.01, 1.2, 1.4, 2.6, { max: 0.95, tag: 'floor' });
    sp(1.6, 0.01, 2.6, 0.9, 2.2, { max: 0.9, tag: 'floor' });
    sp(0.0, 0.01, 3.7, 1.6, 1.2, { max: 0.95, tag: 'floor' });
    sp(-1.8, 0.01, -1.0, 1.4, 1.0, { max: 0.9, tag: 'floor' });

    // ── 받침대 위 널빤지 탁자 (오른쪽 앞)
    const sh = group(2.7, 0, 2.6, root);
    sh.rotation.y = Math.PI / 2;
    const swd = mat('#c9a070', { roughness: 0.7 });
    [-0.9, 0.9].forEach((x) => { [-1, 1].forEach((s2) => { const l = mesh(rbox(0.1, 1.15, 0.1, 0.02), swd, x, 0.55, s2 * 0.3, sh); l.rotation.x = s2 * 0.25; }); mesh(rbox(0.12, 0.12, 0.4, 0.02), swd, x, 1.08, 0, sh); });
    mesh(rbox(2.6, 0.08, 1.0, 0.02), mat('#d8b07a', { roughness: 0.7 }), 0, 1.18, 0, sh);
    sp(2.7, 1.23, 2.6, 0.85, 2.4, { max: 0.8, tag: 'plank' });
    blob(root, 2.7, 2.6, 1.6, 3.0, 0.35);
    // ── 상자 더미 (왼쪽 앞)
    const bx = group(-2.2, 0, 3.7, root);
    mesh(rbox(1.2, 0.8, 1.0, 0.03), mat('#c99a62', { roughness: 0.9 }), 0, 0.4, 0, bx);
    mesh(rbox(0.9, 0.6, 0.8, 0.03), mat('#d8b07a', { roughness: 0.9 }), -0.1, 1.1, 0, bx).rotation.y = -0.25;
    sp(-2.3, 1.42, 3.7, 0.6, 0.5, { max: 0.55, tag: 'box' });
    blob(root, -2.2, 3.7, 1.8, 1.5, 0.4);
    if (night) [[-1.4, -2.5], [1.6, 0.8]].forEach(([x, z]) => { const pl = ctx.light(new T.PointLight(0xe8f4ff, 10, 11, 1.3)); pl.position.set(x, 5.8, z); });
    if (night) { ctx.sun.intensity = 0.45; ctx.sun.color.set(0x8fa0ff); ctx.hemi.intensity = 0.3; ctx.env = 0.4; }
    return { view: { fit: 6.0, ly: 2.1 }, density: 1.4, clutter: ['crate', 'tin', 'jar', 'lantern', 'radio', 'basket', 'books', 'scroll', 'blocks', 'sewbox', 'pot', 'cage'] };
  };
})();
