// 장면 2: 부엌
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  SCN.kitchen = function (ctx) {
    const r = ctx.r, root = ctx.root, D = ctx.D;
    const night = ctx.opt.night;
    const pal = pick(r, [
      { wall: '#fdf0d5', tile: '#ffffff', grout: '#d9e4ea', cab: '#7fb3a6', floorA: '#f4efe6', floorB: '#d9cdb8', accent: '#e76f51' },
      { wall: '#f6e3e1', tile: '#eaf4fb', grout: '#c7d9e6', cab: '#f2b5a0', floorA: '#fbf7f0', floorB: '#9fb7c9', accent: '#2a9d8f' },
      { wall: '#e9f1df', tile: '#fffaf0', grout: '#e6d8c0', cab: '#f4d06f', floorA: '#f3eee4', floorB: '#c9a27e', accent: '#3a86ff' },
    ]);
    ctx.bg(night ? '#2e2c45' : '#f7ecdf', night ? '#1c1b2e' : '#e3d2c0');
    const floorT = tex(256, 256, (c, W, H) => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        c.fillStyle = (x + y) % 2 ? pal.floorA : pal.floorB;
        c.fillRect(x * 64, y * 64, 64, 64);
      }
      c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 2;
      for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, H); c.moveTo(0, i * 64); c.lineTo(W, i * 64); c.stroke(); }
    }, [2.5, 2.5]);
    const wallT = tex(256, 256, (c, W, H) => {
      c.fillStyle = pal.wall; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(0,0,0,0.025)';
      for (let i = 0; i < 60; i++) c.fillRect((i * 71) % W, (i * 37) % H, 3, 3);
    }, [4, 3]);
    P.room(ctx, { floorTex: floorT, wallTex: wallT, slab: '#6d5a4e', wainscot: null });

    // 뒷벽 타일
    const tileT = tex(256, 128, (c, W, H) => {
      c.fillStyle = pal.grout; c.fillRect(0, 0, W, H);
      for (let y = 0; y < 4; y++) for (let x = -1; x < 5; x++) {
        c.fillStyle = K.shade(pal.tile, -0.02 * ((x + y) % 3));
        c.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28);
      }
    }, [4, 1.5]);
    const tiles = mesh(K.box(10, 1.5, 0.04), new T.MeshStandardMaterial({ map: tileT, roughness: 0.25 }), 0, 2.45, -4.98, root);
    tiles.castShadow = false;

    // ── 뒷벽 조리대 (x -3 ~ 4.8)
    const cab = pm(pal.cab, { roughness: 0.55 });
    const top = mat('#f7f3ee', { roughness: 0.3 });
    const handle = mat('#d4af37', { roughness: 0.3, metalness: 0.8 });
    const run = group(0, 0, -4.4, root);
    const doors = [];
    for (let i = 0; i < 6; i++) {
      const x = -2.4 + i * 1.2;
      const d = group(x, 0, 0, run);
      mesh(rbox(1.16, 1.5, 1.1, 0.05), cab, 0, 0.85, 0, d);
      mesh(rbox(0.95, 1.2, 0.04, 0.04), mat(shade(pal.cab, 0.12), { roughness: 0.5 }), 0, 0.85, 0.56, d);
      const h = mesh(rbox(0.06, 0.34, 0.06, 0.02), handle, i % 2 ? -0.38 : 0.38, 1.2, 0.62, d);
      doors.push(h);
      if (i % 2 === 0) D(h, { kinds: ['hide'], minLv: 3 });
    }
    mesh(K.box(7.3, 0.1, 1.0), mat('#3a2e28'), 0.6, 0.05, 0.02, run);
    mesh(rbox(7.4, 0.14, 1.25, 0.04), top, 0.6, 1.66, 0.05, run);
    D(run, { kinds: ['color'], paint: [run.children[0].children[0]] });
    blob(root, 0.6, -4.2, 7.8, 1.6, 0.25);

    // 싱크대 + 수도꼭지
    const sink = group(0.6, 1.73, -4.35, root);
    mesh(rbox(1.3, 0.04, 0.8, 0.03), mat('#c9d1d6', { roughness: 0.2, metalness: 0.8 }), 0, 0, 0, sink);
    const faucet = group(0, 0, -0.45, sink);
    const chrome = pm('#dfe6ea', { roughness: 0.12, metalness: 0.9 });
    mesh(K.cyl(0.05, 0.06, 0.5, 12), chrome, 0, 0.25, 0, faucet);
    const spout = mesh(K.torus(0.18, 0.04, Math.PI), chrome, 0, 0.5, 0.18, faucet);
    spout.rotation.y = Math.PI / 2;
    mesh(K.cyl(0.03, 0.03, 0.2, 8), chrome, 0.15, 0.1, 0, faucet).rotation.z = Math.PI / 2;
    D(faucet, { kinds: ['mirror', 'hide'], minLv: 2 });
    const soap = group(-0.8, 0, -0.2, sink);
    mesh(K.cyl(0.1, 0.12, 0.34, 14), pm(pick(r, ['#7bd389', '#ff8fab', '#8ecae6']), { roughness: 0.15, transparent: true, opacity: 0.85 }), 0, 0.17, 0, soap);
    mesh(K.cyl(0.03, 0.03, 0.14, 8), mat('#fff'), 0, 0.4, 0, soap);
    D(soap, { kinds: ['hide', 'color'] });
    const sponge = mesh(rbox(0.3, 0.12, 0.2, 0.03), pm('#ffd23f'), 0.85, 0.06, 0.1, sink);
    D(sponge, { kinds: ['hide', 'color'] });

    // 창 (싱크대 위)
    const win = P.window(root, 0.6, 4.15, -5, 2.1, 1.5, night ? { stars: 1, skyTop: '#1b2350', skyBot: '#3a4a8a' } : { hill: '#79c26a' });
    D(win, { kinds: ['color'] });
    // 창틀 위 화분들
    const herbs = [];
    [-0.6, 0, 0.6].forEach((x, i) => {
      const h = P.plant(root, 0.6 + x, -4.78, 0.3, r, { y: 3.3, noBlob: 1, pot: ['#e07a5f', '#f2cc8f', '#81b29a'][i], leaves: 6, leaf: ['#3a7d44', '#6aa84f', '#2d6a4f'][i] });
      D(h, { kinds: ['hide', 'color'], group: 'herb' + i });
    });

    // 가스레인지 + 냄비 + 주전자
    const stove = group(3.0, 1.73, -4.35, root);
    mesh(rbox(1.4, 0.06, 0.9, 0.03), mat('#2b2b2b', { roughness: 0.3 }), 0, 0, 0, stove);
    [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.22], [0.35, 0.22]].forEach(([a, b]) => mesh(K.torus(0.14, 0.025), mat('#555'), a, 0.05, b, stove).rotation.x = Math.PI / 2);
    const pot = group(-0.35, 0.05, -0.2, stove);
    const potM = pm(pal.accent, { roughness: 0.35 });
    mesh(K.cyl(0.3, 0.27, 0.38, 24), potM, 0, 0.2, 0, pot);
    mesh(K.cyl(0.31, 0.31, 0.05, 24), potM, 0, 0.42, 0, pot);
    mesh(K.sphere(0.05), mat('#222'), 0, 0.47, 0, pot);
    [-1, 1].forEach((s) => mesh(rbox(0.12, 0.05, 0.08, 0.02), mat('#222'), s * 0.36, 0.32, 0, pot));
    D(pot, { kinds: ['color', 'hide'] });
    const kettle = group(0.35, 0.05, 0.22, stove);
    const kM = pm(pick(r, ['#f4f1de', '#e9c46a', '#90e0ef']), { roughness: 0.25 });
    mesh(K.sphere(0.25), kM, 0, 0.22, 0, kettle).scale.set(1, 0.85, 1);
    const kh = mesh(K.torus(0.16, 0.025, Math.PI), mat('#333'), 0, 0.4, 0, kettle);
    const ks = mesh(K.cone(0.05, 0.3, 10), kM, 0.28, 0.28, 0, kettle);
    ks.rotation.z = -1.0;
    D(kettle, { kinds: ['color', 'hide', 'mirror'] });
    // 후드
    const hood = group(3.0, 4.4, -4.6, root);
    mesh(rbox(1.5, 0.35, 0.8, 0.05), mat('#c9d1d6', { roughness: 0.3, metalness: 0.6 }), 0, 0, 0, hood);
    mesh(K.box(0.5, 1.4, 0.4), mat('#c9d1d6', { roughness: 0.3, metalness: 0.6 }), 0, 0.85, -0.15, hood);

    // 선반 (뒷벽 왼쪽 위): 병·그릇
    const shelf = group(-2.1, 3.9, -4.75, root);
    const shM = mat('#a0704a', { roughness: 0.6 });
    mesh(rbox(2.4, 0.1, 0.5, 0.03), shM, 0, 0, 0, shelf);
    mesh(rbox(2.4, 0.1, 0.5, 0.03), shM, 0, 1.0, 0, shelf);
    const jarC = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a'];
    for (let i = 0; i < 4; i++) {
      const j = group(-0.9 + i * 0.6, 0.05, 0, shelf);
      mesh(K.cyl(0.16, 0.16, 0.42, 16), new T.MeshPhysicalMaterial({ color: 0xeef7f7, roughness: 0.05, transparent: true, opacity: 0.45 }), 0, 0.21, 0, j);
      mesh(K.cyl(0.14, 0.14, 0.28 - (i % 2) * 0.1, 14), pm(jarC[i], { roughness: 0.9 }), 0, 0.15 - (i % 2) * 0.05, 0, j);
      mesh(K.cyl(0.17, 0.17, 0.07, 16), pm(pick(r, ['#8d6346', '#e63946', '#ffffff'])), 0, 0.46, 0, j).material.userData.paint = false;
      D(j, { kinds: ['hide', 'color'], group: 'jar' + i, minLv: i % 2 });
    }
    const plates = group(0, 1.05, -0.05, shelf);
    for (let i = 0; i < 4; i++) {
      const p = mesh(K.cyl(0.3, 0.26, 0.04, 24), pm(i % 2 ? '#ffffff' : '#bde0fe', { roughness: 0.3 }), -0.8 + i * 0.5, 0.3, 0, plates);
      p.rotation.x = Math.PI / 2 - 0.2;
      if (i === 1 || i === 3) D(p, { kinds: ['color', 'hide'], minLv: 1 });
    }
    const cupRow = group(0.9, 1.05, 0.05, shelf);
    D(P.mug(cupRow, 0, 0, 0, pick(r, ['#ff6b6b', '#ffd166', '#06d6a0']), 0.5), { kinds: ['hide', 'color', 'mirror'] });

    // ── 냉장고 (왼벽)
    const fridge = group(-4.3, 0, -3.8, root);
    fridge.rotation.y = Math.PI / 2;
    const fM = pm(pick(r, ['#9ad1d4', '#ffcad4', '#ffd6a5', '#b8e0d2']), { roughness: 0.3 });
    mesh(rbox(1.7, 4.2, 1.3, 0.12), fM, 0, 2.1, 0, fridge);
    mesh(K.box(1.6, 0.03, 0.02), mat('#9aa'), 0, 2.9, 0.66, fridge);
    const fh1 = mesh(rbox(0.07, 0.8, 0.08, 0.03), mat('#bbb', { metalness: 0.7, roughness: 0.3 }), 0.65, 3.4, 0.7, fridge);
    const fh2 = mesh(rbox(0.07, 1.1, 0.08, 0.03), mat('#bbb', { metalness: 0.7, roughness: 0.3 }), 0.65, 2.1, 0.7, fridge);
    D(fridge, { kinds: ['color'] });
    // 자석·쪽지
    const magC = ['#e63946', '#ffb703', '#219ebc', '#8338ec'];
    [[-0.3, 3.6], [0.2, 3.3], [-0.4, 2.4], [0.1, 1.7]].forEach(([x, y], i) => {
      const m = group(x, y, 0.66, fridge);
      if (i % 2) {
        mesh(rbox(0.36, 0.44, 0.01, 0.005), mat('#fffbe6'), 0, 0, 0.005, m);
        mesh(K.sphere(0.06), pm(magC[i]), 0, 0.2, 0.03, m).scale.z = 0.5;
      } else {
        const st = mesh(K.cyl(0.1, 0.1, 0.04, 5), pm(magC[i]), 0, 0, 0.03, m);
        st.rotation.x = Math.PI / 2;
      }
      D(m, { kinds: ['hide', 'color'], group: 'mag' + i });
    });
    blob(root, -4.3, -3.8, 1.9, 2.2, 0.35);

    // 왼벽: 시계, 달력, 조리도구 걸이
    const clock = P.clock(root, -5, 4.2, -1.0, pick(r, ['#e76f51', '#264653', '#f4a261']), true);
    D(clock, { kinds: ['color', 'alt'], alt(on) { clock.userData.min.rotation.z += on ? 2.4 : -2.4; } });
    const cal = P.frame(root, -5, 3.5, 0.4, 1.0, 1.3, (c, W, H) => {
      c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#e63946'; c.fillRect(0, 0, W, H * 0.22);
      c.fillStyle = '#fff'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.fillText('9', W / 2, H * 0.17);
      c.fillStyle = '#888';
      for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) c.fillRect(14 + x * 33, H * 0.3 + y * 42, 20, 20);
      c.fillStyle = '#e63946'; c.beginPath(); c.arc(14 + 4 * 33 + 10, H * 0.3 + 2 * 42 + 10, 16, 0, 7); c.lineWidth = 3; c.strokeStyle = '#e63946'; c.stroke();
    }, { onLeft: 1, color: '#dddddd' });
    D(cal, { kinds: ['hide', 'color'] });
    const rail = group(-4.93, 2.7, 1.9, root);
    rail.rotation.y = Math.PI / 2;
    mesh(K.cyl(0.03, 0.03, 1.8, 8), mat('#888', { metalness: 0.8, roughness: 0.3 }), 0, 0, 0.1, rail).rotation.z = Math.PI / 2;
    const tools = [];
    [-0.6, -0.2, 0.2, 0.6].forEach((x, i) => {
      const t = group(x, -0.05, 0.12, rail);
      const tm = pm(['#e76f51', '#2a9d8f', '#264653', '#f4a261'][i], { roughness: 0.5 });
      mesh(K.cyl(0.03, 0.03, 0.6, 8), tm, 0, -0.3, 0, t);
      if (i === 0) mesh(K.sphere(0.12, 16, 8), tm, 0, -0.65, 0.04, t).scale.set(1, 0.5, 1);
      else if (i === 1) mesh(rbox(0.2, 0.25, 0.03, 0.02), tm, 0, -0.7, 0, t);
      else if (i === 2) { for (let k = -1; k <= 1; k++) mesh(K.cyl(0.012, 0.012, 0.3, 4), tm, k * 0.05, -0.72, 0, t); }
      else mesh(K.sphere(0.1, 12, 8), tm, 0, -0.66, 0, t).scale.set(0.8, 1.4, 0.4);
      D(t, { kinds: ['hide', 'color'], group: 'tool' + i, minLv: 1 });
    });

    // ── 식탁 + 의자
    const table = group(0.4, 0, 0.9, root);
    const tw = pm(pick(r, ['#c68b59', '#ffffff', '#8d6346']), { roughness: 0.5 });
    mesh(K.cyl(1.5, 1.5, 0.12, 40), tw, 0, 1.5, 0, table);
    mesh(K.cyl(0.12, 0.16, 1.45, 12), mat('#6b4a32'), 0, 0.75, 0, table);
    mesh(K.cyl(0.6, 0.7, 0.08, 24), mat('#6b4a32'), 0, 0.04, 0, table);
    // 식탁보 줄
    const runner = mesh(rbox(0.8, 0.02, 2.6, 0.01), pm(pal.accent, { roughness: 0.9 }), 0, 1.57, 0, table);
    runner.rotation.y = 0.8;
    D(runner, { kinds: ['color', 'hide'] });
    blob(root, 0.4, 0.9, 3.8, 3.8, 0.3);
    const chairs = [];
    [[-1.9, 0.2, Math.PI / 2 + 0.2], [0.8, 2.35, 0.15], [2.1, -0.4, -Math.PI / 2 - 0.3]].forEach(([x, z, ry], i) => {
      const ch = group(0.4 + x, 0, 0.9 + z, root);
      ch.rotation.y = ry;
      const cm = pm(pick(r, ['#ffb4a2', '#9ad1d4', '#ffd166', '#cdb4db']), { roughness: 0.5 });
      mesh(rbox(0.9, 0.12, 0.9, 0.05), cm, 0, 0.95, 0, ch);
      mesh(rbox(0.9, 0.9, 0.1, 0.05), cm, 0, 1.55, 0.42, ch);
      [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]].forEach(([a, b]) => mesh(K.cyl(0.04, 0.04, 0.95, 8), mat('#6b4a32'), a, 0.47, b, ch));
      blob(root, 0.4 + x, 0.9 + z, 1.3, 1.3, 0.3, null, ch);
      D(ch, { kinds: i === 1 ? ['color', 'hide'] : ['color', 'turn', 'hide'], turn: 0.8, group: 'chair' });
    });
    // 식탁 위: 과일 그릇, 꽃병, 접시·컵
    const bowl = group(-0.2, 1.56, 0.15, table);
    mesh(K.lathe('bowl', [[0, 0], [0.25, 0], [0.5, 0.2], [0.55, 0.3], [0.5, 0.3], [0, 0.1]]), pm('#ffffff', { roughness: 0.3, side: T.DoubleSide }), 0, 0, 0, bowl);
    const apple = mesh(K.sphere(0.16), pm('#e63946', { roughness: 0.35 }), -0.15, 0.3, 0.05, bowl);
    D(apple, { kinds: ['color', 'hide'], minLv: 1 });
    const orange = mesh(K.sphere(0.15), pm('#f77f00', { roughness: 0.6 }), 0.16, 0.3, -0.08, bowl);
    D(orange, { kinds: ['color', 'hide'], minLv: 1 });
    const banana = group(0.02, 0.42, 0.12, bowl);
    const bn = mesh(K.torus(0.22, 0.05, Math.PI * 0.7), pm('#ffd60a', { roughness: 0.5 }), 0, 0, 0, banana);
    bn.rotation.set(Math.PI / 2 - 0.3, 0, 0.4);
    D(banana, { kinds: ['hide', 'color'], minLv: 1 });
    const grapes = group(0.05, 0.4, -0.2, bowl);
    for (let i = 0; i < 7; i++) mesh(K.sphere(0.055, 10, 8), pm('#7b2cbf', { roughness: 0.3 }), Math.sin(i * 2) * 0.07, -i * 0.025, Math.cos(i * 2) * 0.07, grapes);
    D(grapes, { kinds: ['show'], minLv: 1 });
    const vase = group(0.55, 1.56, -0.4, table);
    mesh(K.lathe('vase', [[0, 0], [0.14, 0], [0.2, 0.2], [0.1, 0.5], [0.12, 0.6], [0, 0.6]]), pm(pick(r, ['#48cae4', '#ffafcc', '#f4f1de']), { roughness: 0.2 }), 0, 0, 0, vase);
    const flowers = group(0, 0.55, 0, vase);
    const fc = pick(r, ['#ff595e', '#ffca3a', '#ff99c8']);
    [[0, 0.5, 0], [0.18, 0.4, 0.05], [-0.15, 0.42, -0.08], [0.05, 0.35, 0.18]].forEach(([x, y, z], i) => {
      mesh(K.cyl(0.012, 0.012, y, 5), mat('#4c956c'), x / 2, y / 2, z / 2, flowers).rotation.z = -x;
      const f = group(x, y, z, flowers);
      for (let k = 0; k < 5; k++) mesh(K.sphere(0.06, 10, 8), pm(fc), Math.cos(k * 1.256) * 0.07, 0, Math.sin(k * 1.256) * 0.07, f).scale.y = 0.5;
      mesh(K.sphere(0.04, 8, 6), mat('#ffd166'), 0, 0.02, 0, f);
    });
    D(flowers, { kinds: ['color', 'hide'] });
    const plate = group(-0.6, 1.57, -0.7, table);
    mesh(K.cyl(0.3, 0.24, 0.04, 24), mat('#ffffff', { roughness: 0.3 }), 0, 0.02, 0, plate);
    const cake = group(0, 0.04, 0, plate);
    mesh(K.cyl(0.16, 0.16, 0.2, 3), pm('#fcd5ce', { roughness: 0.7 }), 0, 0.1, 0, cake).rotation.y = 0.3;
    mesh(K.sphere(0.05, 10, 8), mat('#e63946'), 0, 0.24, 0, cake);
    D(cake, { kinds: ['hide', 'color'] });
    const glass = group(0.7, 1.57, 0.5, table);
    mesh(K.cyl(0.1, 0.09, 0.3, 16), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 0.15, 0, glass);
    const juice = mesh(K.cyl(0.085, 0.08, 0.22, 16), pm('#ff9f1c', { roughness: 0.2 }), 0, 0.11, 0, glass);
    D(glass, { kinds: ['hide', 'color'], paint: [juice] });

    // ── 바닥: 강아지, 밥그릇, 채소 바구니, 쓰레기통, 발매트
    const dog = puppy(root, 2.6, 2.6, 0.9, pick(r, ['#d4a373', '#f5ebe0', '#6f4e37']), -0.9);
    D(dog, { kinds: ['hide', 'color', 'mirror'], colors: ['#d4a373', '#f5ebe0', '#6f4e37', '#3a3a3a'] });
    D(dog.userData.collar, { kinds: ['color'], minLv: 2 });
    const bowl2 = group(3.7, 0, 1.5, root);
    mesh(K.cyl(0.3, 0.36, 0.18, 20), pm('#e63946', { roughness: 0.4 }), 0, 0.09, 0, bowl2);
    mesh(K.cyl(0.24, 0.24, 0.02, 16), mat('#8d5524'), 0, 0.17, 0, bowl2);
    blob(root, 3.7, 1.5, 0.9, 0.9, 0.35, null, bowl2);
    D(bowl2, { kinds: ['color', 'hide', 'move'], move: [0.3, 1.2] });
    const bone = group(3.3, 0.06, 3.6, root);
    bone.rotation.y = 0.7;
    const bm = mat('#fffaf0');
    mesh(K.cyl(0.05, 0.05, 0.4, 8), bm, 0, 0, 0, bone).rotation.z = Math.PI / 2;
    [-0.22, 0.22].forEach((x) => { mesh(K.sphere(0.07), bm, x, 0, 0.05, bone); mesh(K.sphere(0.07), bm, x, 0, -0.05, bone); });
    D(bone, { kinds: ['show'] });

    const basket = group(-3.3, 0, 3.2, root);
    const wick = tex(128, 64, (c, W, H) => {
      c.fillStyle = '#c69c6d'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#8d6346'; c.lineWidth = 2;
      for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 12) { c.beginPath(); c.moveTo(x, y + ((x / 12) % 2) * 4); c.lineTo(x + 12, y + 4 - ((x / 12) % 2) * 4); c.stroke(); }
    });
    mesh(K.cyl(0.6, 0.5, 0.6, 24, 1), new T.MeshStandardMaterial({ map: wick, roughness: 0.9 }), 0, 0.3, 0, basket);
    mesh(K.torus(0.6, 0.05), mat('#8d6346'), 0, 0.6, 0, basket).rotation.x = Math.PI / 2;
    blob(root, -3.3, 3.2, 1.5, 1.5, 0.35, null, basket);
    const carrots = [];
    [[-0.2, 0.1, 0.4], [0.05, -0.15, -0.3], [0.2, 0.15, 0.1]].forEach(([x, z, t], i) => {
      const cg = group(x, 0.65, z, basket);
      cg.rotation.set(t, i, 0.5);
      mesh(K.cone(0.09, 0.55, 10), pm('#f77f00'), 0, 0, 0, cg).rotation.x = Math.PI;
      mesh(K.cone(0.06, 0.25, 6), mat('#52b788'), 0, 0.38, 0, cg);
      D(cg, { kinds: ['hide', 'color'], group: 'carrot' + i, minLv: 1 });
    });
    const cabbage = mesh(K.sphere(0.28), pm('#95d5b2', { roughness: 0.8 }), 0.25, 0.7, 0.3, basket);
    D(cabbage, { kinds: ['hide', 'color'] });
    const onion = mesh(K.sphere(0.18), pm('#b56576', { roughness: 0.5 }), -0.3, 0.68, -0.2, basket);
    D(onion, { kinds: ['show'], minLv: 1 });

    const bin = group(4.2, 0, -2.6, root);
    const binM = pm(pick(r, ['#adb5bd', '#90be6d', '#f9c74f']), { roughness: 0.4, metalness: 0.3 });
    mesh(K.cyl(0.42, 0.36, 1.1, 24), binM, 0, 0.55, 0, bin);
    mesh(K.cyl(0.45, 0.45, 0.1, 24), binM, 0, 1.13, 0, bin);
    mesh(rbox(0.3, 0.06, 0.1, 0.02), mat('#333'), 0, 1.2, 0, bin);
    blob(root, 4.2, -2.6, 1.2, 1.2, 0.35, null, bin);
    D(bin, { kinds: ['color', 'hide'] });

    const mat1T = tex(256, 64, (c, W, H) => {
      c.fillStyle = pal.accent; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (let x = 12; x < W - 12; x += 20) c.fillRect(x, 10, 8, H - 20);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.strokeRect(5, 5, W - 10, H - 10);
    });
    const mmat = new T.MeshStandardMaterial({ map: mat1T, roughness: 1 });
    mmat.userData.paint = true;
    const floorMat = mesh(rbox(3.2, 0.04, 1.1, 0.02), mmat, 0.8, 0.02, -3.2, root);
    floorMat.castShadow = false;
    D(floorMat, { kinds: ['color', 'hide'] });

    // ── 왼벽 수납장: 전자레인지, 토스터, 빵
    const side = group(-4.45, 0, -0.9, root);
    side.rotation.y = Math.PI / 2;
    const sm = pm(pick(r, ['#8d6346', '#cdb4db', '#83c5be']), { roughness: 0.55 });
    mesh(rbox(2.4, 1.3, 1.0, 0.06), sm, 0, 0.72, 0, side);
    mesh(K.box(2.3, 0.08, 0.9), mat('#3a2e28'), 0, 0.04, 0, side);
    mesh(rbox(2.5, 0.1, 1.1, 0.03), top, 0, 1.42, 0, side);
    [-0.6, 0.6].forEach((x) => {
      mesh(rbox(1.0, 1.0, 0.04, 0.04), mat(shade('#8d6346', 0.2)), x, 0.75, 0.51, side).material = mat('#ffffff', { roughness: 0.5, transparent: true, opacity: 0.18 });
      mesh(K.sphere(0.05), handle, x + (x < 0 ? 0.38 : -0.38), 0.8, 0.55, side);
    });
    D(side, { kinds: ['color'] });
    blob(root, -4.45, -0.9, 1.4, 2.8, 0.3);
    const micro = group(-0.5, 1.47, -0.05, side);
    const mm = pm(pick(r, ['#e9ecef', '#495057', '#ffadad']), { roughness: 0.35 });
    mesh(rbox(1.0, 0.6, 0.7, 0.06), mm, 0, 0.3, 0, micro);
    mesh(rbox(0.6, 0.42, 0.02, 0.02), mat('#1d2d35', { roughness: 0.1 }), -0.12, 0.3, 0.35, micro);
    mesh(K.box(0.2, 0.42, 0.02), mat('#adb5bd'), 0.34, 0.3, 0.35, micro);
    const dial = mesh(K.cyl(0.04, 0.04, 0.03, 12), pm('#ff6b6b'), 0.34, 0.4, 0.37, micro);
    dial.rotation.x = Math.PI / 2;
    D(micro, { kinds: ['color', 'hide'] });
    D(dial, { kinds: ['color'], minLv: 3 });
    const toaster = group(0.55, 1.47, 0.05, side);
    const tm = pm(pick(r, ['#ff6b6b', '#4dabf7', '#ffd43b']), { roughness: 0.25, metalness: 0.2 });
    mesh(rbox(0.6, 0.4, 0.34, 0.1), tm, 0, 0.2, 0, toaster);
    [-0.07, 0.07].forEach((z) => mesh(K.box(0.4, 0.02, 0.05), mat('#222'), 0, 0.405, z, toaster));
    const bread = group(0, 0.4, 0.07, toaster);
    mesh(rbox(0.3, 0.26, 0.06, 0.05), pm('#e9c46a', { roughness: 0.9 }), 0, 0.05, 0, bread);
    D(bread, { kinds: ['show'], minLv: 1 });
    mesh(K.box(0.06, 0.14, 0.04), mat('#333'), 0.33, 0.25, 0, toaster);
    D(toaster, { kinds: ['color', 'hide', 'mirror'] });
    const loaf = group(0.05, 1.47, 0.35, side);
    mesh(K.capsule(0.13, 0.35), pm('#d4a373', { roughness: 0.9 }), 0, 0.13, 0, loaf).rotation.z = Math.PI / 2;
    D(loaf, { kinds: ['hide', 'color'] });

    // 조리대 아래 불빛
    const ul = ctx.light(new T.PointLight(0xffd6a0, night ? 16 : 3, 6, 1.5));
    ul.position.set(1.2, 3.1, -4.2);

    if (night) {
      ctx.sun.intensity = 0.5;
      ctx.sun.color.set(0x9aa8ff);
      ctx.hemi.intensity = 0.3;
      ctx.env = 0.25;
      ctx.exposure(1.1);
    }
    return { view: { fit: 6.3, ly: 2.5 } };
  };

  // 강아지 (엎드린)
  function puppy(parent, x, z, s, color, rotY) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    g.rotation.y = rotY || 0;
    const fur = pm(color, { roughness: 0.95 });
    const ear = mat(shade(color, -0.35), { roughness: 0.95 });
    const dark = mat('#2b211c', { roughness: 0.3 });
    const white = mat('#fffaf2', { roughness: 0.95 });
    const body = mesh(K.sphere(0.5), fur, 0, 0.32, 0, g);
    body.scale.set(1.3, 0.6, 0.8);
    const head = group(0.62, 0.52, 0, g);
    mesh(K.sphere(0.32), fur, 0, 0, 0, head).scale.set(1, 0.92, 1);
    mesh(K.sphere(0.16), white, 0.24, -0.08, 0, head).scale.set(1.1, 0.8, 1);
    mesh(K.sphere(0.06), dark, 0.4, -0.02, 0, head);
    [-1, 1].forEach((sd) => {
      mesh(K.sphere(0.045), dark, 0.25, 0.08, sd * 0.13, head);
      mesh(K.sphere(0.015), white, 0.285, 0.1, sd * 0.12, head);
      const e = mesh(K.sphere(0.14), ear, -0.05, 0.05, sd * 0.3, head);
      e.scale.set(0.6, 1.3, 0.35);
      e.rotation.x = sd * 0.35;
      // 앞발
      mesh(K.capsule(0.08, 0.3), fur, 0.55, 0.08, sd * 0.2, g).rotation.z = Math.PI / 2;
      mesh(K.sphere(0.09), white, 0.78, 0.08, sd * 0.2, g);
      // 뒷발
      mesh(K.sphere(0.16), fur, -0.4, 0.14, sd * 0.3, g).scale.set(1.3, 0.8, 0.6);
    });
    const tongue = mesh(K.sphere(0.05), mat('#ff7b9c'), 0.36, -0.15, 0.02, head);
    tongue.scale.set(0.6, 1, 1);
    const tail = mesh(K.capsule(0.05, 0.28), fur, -0.72, 0.42, 0, g);
    tail.rotation.z = 0.9;
    const collar = mesh(K.torus(0.24, 0.035), pm('#e63946', { roughness: 0.4 }), 0.42, 0.35, 0, g);
    collar.rotation.y = Math.PI / 2;
    collar.rotation.x = 0.3;
    g.userData.collar = collar;
    blob(parent, x, z, 2.0 * s, 1.4 * s, 0.4, null, g);
    return g;
  }
  P.puppy = puppy;
})();
