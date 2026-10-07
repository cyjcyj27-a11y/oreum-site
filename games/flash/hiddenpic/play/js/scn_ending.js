// 엔딩: 모은 물건이 진열장에 놓인다. 도감을 다 채우면 고양이가 왕관을 쓴다
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade } = K;

  SCN.cabinet = function (ctx) {
    const root = ctx.root, r = ctx.r;
    const dex = ctx.opt.dex || {}, done = !!ctx.opt.complete;
    ctx.bg('#2a2230', '#1a1520');
    P.room(ctx, { floorTex: K.woodFloor('#8a5a3a', r), wallTex: K.wallpaper('#e8d6b8', '#dcc6a2', 'dot'), wallTex2: K.wallpaper('#e2ceb0', '#d6bf9a', 'dot'), slab: '#5a3a24', wallEdge: '#6a432a', baseboard: '#5a3822', height: 7.4, wainscot: '#8a5a3a', wainscotH: 1.0 });
    // 진열장 7칸 x 7단
    const ids = ITEMS.list;
    const cols = 7, rows = Math.ceil(ids.length / cols);
    const W = 8.4, H = 6.4, D = 1.0;
    const cab = group(0.2, 0, -4.4, root);
    const wd = mat('#5a3420', { roughness: 0.45 }), wdL = mat('#7a4a2c', { roughness: 0.5 });
    mesh(rbox(W, H, 0.1, 0.03), mat('#3a2418', { roughness: 0.6 }), 0, H / 2, -D / 2 + 0.05, cab);
    [-1, 1].forEach((s) => mesh(rbox(0.14, H, D, 0.03), wd, s * (W / 2 - 0.07), H / 2, 0, cab));
    const gap = (H - 0.2) / rows;
    for (let i = 0; i <= rows; i++) mesh(rbox(W, 0.08, D, 0.02), wdL, 0, 0.1 + i * gap, 0, cab);
    const cw = (W - 0.3) / cols;
    ids.forEach((id, k) => {
      const row = rows - 1 - Math.floor(k / cols), col = k % cols;
      const x = -W / 2 + 0.15 + cw * (col + 0.5), y = 0.14 + row * gap;
      const have = dex[id] || 0;
      if (have) {
        const it = S.makeItem(id, Math.min(cw, gap) * 0.62);
        it.position.set(x, y, 0.05);
        it.rotation.y = -0.35;
        cab.add(it);
        if (have === 2) {
          mesh(K.cyl(cw * 0.3, cw * 0.32, 0.04, 20), mat('#f2c43a', { metalness: 0.8, roughness: 0.25 }), x, y + 0.02, 0.05, cab);
        }
      } else {
        // 빈 자리: 작은 이름표만
        mesh(rbox(cw * 0.42, 0.14, 0.02, 0.01), mat('#efe4c8', { roughness: 0.9 }), x, y + 0.1, D / 2 - 0.05, cab).rotation.x = -0.3;
      }
    });
    // 유리문 테
    mesh(rbox(W + 0.1, 0.18, D + 0.1, 0.03), wd, 0, H + 0.08, 0, cab);
    blob(root, 0.2, -4.2, W * 1.1, 2.0, 0.45);

    // 고양이: 앞 방석 위
    const cu = mesh(rbox(1.8, 0.24, 1.6, 0.2), mat('#b8323a', { roughness: 1 }), 0.4, 0.12, 0.8, root);
    [[-0.85, -0.75], [0.85, -0.75], [-0.85, 0.75], [0.85, 0.75]].forEach(([a, b]) => mesh(K.sphere(0.08, 8, 6), mat('#f2c44a'), 0.4 + a, 0.2, 0.8 + b, root));
    const cat = S.makeItem('cat', 1.5);
    cat.position.set(0.4, 0.24, 0.8);
    cat.rotation.y = -0.6;
    root.add(cat);
    if (done) {
      const cr = S.makeItem('crown', 0.42);
      cr.position.set(0.95, 0.95, 1.1);
      cr.rotation.z = -0.2;
      root.add(cr);
      const spot = ctx.light(new T.SpotLight(0xffe08a, 40, 14, 0.5, 0.6, 1.2));
      spot.position.set(0.4, 7, 4); spot.target.position.set(0.4, 0, 0.8);
      ctx.scene.add(spot.target); spot.target.userData.sceneLight = true;
    }
    // 양옆 화분·스탠드
    P.plant(root, -3.6, 1.6, 1.1, r, { pot: '#c8704a', leaves: 11 });
    P.plant(root, 4.0, 1.4, 0.9, r, { pot: '#3a6ab0', leaves: 9 });
    ctx.sun.position.set(6, 12, 9);
    ctx.sun.intensity = 3.0;
    return { view: { dx: 0.55, dy: 0.62, dz: 1.15, fit: 4.6, ly: 3.0, lz: -2.2 } };
  };
})();
