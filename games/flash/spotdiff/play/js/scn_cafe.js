// 장면 3: 카페
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  SCN.cafe = function (ctx) {
    const r = ctx.r, root = ctx.root, D = ctx.D;
    const night = ctx.opt.night;
    const pal = pick(r, [
      { wall: '#3f5f55', brick: '#b5654a', wood: '#a0673f', accent: '#f4a261', awn: ['#e76f51', '#fefae0'] },
      { wall: '#f1e3d3', brick: '#c9795d', wood: '#7f5539', accent: '#2a9d8f', awn: ['#2a9d8f', '#fefae0'] },
      { wall: '#23395b', brick: '#a4553f', wood: '#b07d4f', accent: '#ffb703', awn: ['#ffb703', '#23395b'] },
    ]);
    ctx.bg(night ? '#2b2438' : '#f3e6da', night ? '#17131f' : '#dcc5b2');
    const floorT = tex(512, 512, (c, W, H) => {
      // 헤링본 마루
      c.fillStyle = shade(pal.wood, 0.1); c.fillRect(0, 0, W, H);
      const bw = 32, bl = 96;
      for (let y = -2; y < 8; y++) for (let x = -2; x < 8; x++) {
        const ox = x * bl - y * bw, oy = y * bl + x * bw;
        [[0, 0, bl, bw], [bl - bw, bw, bw, bl]].forEach(([dx, dy, w, h], k) => {
          c.fillStyle = shade(pal.wood, (((x * 3 + y * 5 + k) % 5) - 2) * 0.025);
          c.fillRect(ox + dx, oy + dy, w, h);
          c.strokeStyle = 'rgba(40,20,10,0.22)'; c.lineWidth = 1.5;
          c.strokeRect(ox + dx, oy + dy, w, h);
        });
      }
    }, [2, 2]);
    const brickT = tex(256, 256, (c, W, H) => {
      c.fillStyle = '#e8dcd0'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
        c.fillStyle = shade(pal.brick, (((x * 7 + y * 3) % 5) - 2) * 0.05);
        c.fillRect(x * 64 + (y % 2) * 32 + 3, y * 32 + 3, 58, 26);
      }
    }, [3, 2]);
    const wallT = tex(256, 256, (c, W, H) => {
      c.fillStyle = pal.wall; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 3, H);
    }, [4, 3]);
    P.room(ctx, { floorTex: floorT, wallTex: brickT, wallTex2: wallT, slab: '#4a3a33', wallEdge: '#efe6dc' });
    // 왼벽 아래 판넬
    const low = mesh(K.box(10, 1.6, 0.06), mat(shade(pal.wood, -0.1), { roughness: 0.6 }), -4.97, 0.8, 0, root);
    low.rotation.y = Math.PI / 2;

    // ── 계산대 (뒷벽 앞, 오른쪽)
    const bar = group(1.8, 0, -3.3, root);
    const barT = tex(256, 128, (c, W, H) => {
      c.fillStyle = shade(pal.wood, -0.05); c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 16) { c.fillStyle = x % 32 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'; c.fillRect(x, 0, 3, H); }
    }, [3, 1]);
    const barM = new T.MeshStandardMaterial({ map: barT, roughness: 0.6 });
    mesh(rbox(5.4, 1.7, 1.0, 0.06), barM, 0, 0.85, 0, bar);
    mesh(rbox(5.6, 0.12, 1.2, 0.04), mat('#2b2b2b', { roughness: 0.25 }), 0, 1.76, 0, bar);
    blob(root, 1.8, -3.3, 6, 1.6, 0.35);
    // 커피 머신
    const machine = group(-1.6, 1.82, -0.1, bar);
    const mm = pm(pick(r, ['#c0c0c0', '#e63946', '#f1faee']), { roughness: 0.2, metalness: 0.7 });
    mesh(rbox(1.1, 0.8, 0.7, 0.08), mm, 0, 0.4, 0, machine);
    mesh(rbox(1.2, 0.08, 0.75, 0.03), mat('#333'), 0, 0.84, 0, machine);
    [-0.25, 0.25].forEach((x) => {
      mesh(K.cyl(0.06, 0.08, 0.1, 12), mat('#222'), x, 0.2, 0.4, machine);
      mesh(rbox(0.06, 0.06, 0.3, 0.02), mat('#222'), x, 0.2, 0.55, machine);
    });
    const gauge = mesh(K.cyl(0.09, 0.09, 0.03, 16), mat('#fff'), 0, 0.6, 0.36, machine);
    gauge.rotation.x = Math.PI / 2;
    D(machine, { kinds: ['color'] });
    const cup1 = mesh(K.cyl(0.07, 0.06, 0.12, 12), pm('#ffffff'), -0.25, 0.06, 0.4, machine);
    D(cup1, { kinds: ['hide', 'color'], minLv: 2 });
    // 계산기
    const reg = group(0.4, 1.82, 0.05, bar);
    mesh(rbox(0.7, 0.3, 0.5, 0.04), pm('#343a40', { roughness: 0.4 }), 0, 0.15, 0, reg);
    const scr = mesh(rbox(0.5, 0.35, 0.05, 0.02), mat('#212529'), 0, 0.5, -0.1, reg);
    scr.rotation.x = -0.3;
    mesh(K.box(0.42, 0.26, 0.01), K.glow(0x6ee7b7, 1.4), 0, 0.5, -0.07, reg).rotation.x = -0.3;
    D(reg, { kinds: ['color', 'hide'] });
    // 진열장 (케이크)
    const disp = group(1.7, 1.82, 0, bar);
    mesh(rbox(1.5, 0.08, 0.8, 0.03), mat('#e9ecef'), 0, 0.04, 0, disp);
    mesh(rbox(1.5, 0.8, 0.8, 0.05), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.18 }), 0, 0.44, 0, disp).castShadow = false;
    mesh(K.box(1.4, 0.03, 0.7), mat('#e9ecef'), 0, 0.45, 0, disp);
    const cakeC = ['#fcd5ce', '#8d5524', '#fff1e6', '#b5e48c', '#ffb3c6'];
    [[-0.45, 0.08, -0.1], [0.05, 0.08, 0.05], [0.45, 0.08, -0.05], [-0.25, 0.48, 0.05], [0.3, 0.48, -0.05]].forEach(([x, y, z], i) => {
      const cg = group(x, y, z, disp);
      mesh(K.cyl(0.17, 0.17, 0.2, 20), pm(cakeC[(i + Math.floor(r() * 5)) % 5], { roughness: 0.8 }), 0, 0.1, 0, cg);
      mesh(K.cyl(0.18, 0.18, 0.04, 20), mat('#fffaf0', { roughness: 0.6 }), 0, 0.2, 0, cg);
      mesh(K.sphere(0.045, 10, 8), mat('#e63946', { roughness: 0.3 }), 0, 0.25, 0, cg);
      D(cg, { kinds: i === 1 ? ['hide', 'color'] : ['color', 'hide'], group: 'cake' + i, minLv: i > 2 ? 1 : 0 });
    });
    // 계산대 앞 스툴
    [-1.6, -0.3, 1.0].forEach((x, i) => {
      const s = group(1.8 + x, 0, -2.3, root);
      const seat = pm(pick(r, ['#e63946', '#2a9d8f', '#ffb703', '#264653']), { roughness: 0.4 });
      mesh(K.cyl(0.32, 0.32, 0.14, 24), seat, 0, 1.25, 0, s);
      mesh(K.cyl(0.05, 0.05, 1.2, 8), mat('#adb5bd', { metalness: 0.8, roughness: 0.3 }), 0, 0.6, 0, s);
      mesh(K.torus(0.22, 0.025), mat('#adb5bd', { metalness: 0.8, roughness: 0.3 }), 0, 0.5, 0, s).rotation.x = Math.PI / 2;
      mesh(K.cyl(0.3, 0.34, 0.05, 20), mat('#495057', { metalness: 0.5 }), 0, 0.03, 0, s);
      blob(root, 1.8 + x, -2.3, 1.0, 1.0, 0.35, null, s);
      D(s, { kinds: ['color', 'hide'], group: 'stool' });
    });

    // ── 뒷벽: 메뉴판, 선반, 네온
    const menu = P.frame(root, -2.4, 3.9, -5, 2.4, 1.6, (c, W, H) => {
      c.fillStyle = '#1f2a24'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.fillText('MENU', W / 2, 38);
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 5; i++) { c.fillRect(20, 60 + i * 26, 110 + ((i * 37) % 60), 6); c.fillRect(W - 50, 60 + i * 26, 30, 6); }
      c.strokeStyle = '#ffd166'; c.lineWidth = 3;
      c.beginPath(); c.arc(W - 40, 36, 14, 0, 7); c.stroke();
    }, { color: '#6b4a32' });
    D(menu, { kinds: ['alt', 'color'], alt: (() => {
      let saved;
      return (on) => {
        const p = menu.children.find((m) => m.material && m.material.userData.nopaint);
        if (on) { saved = p.material.map; p.material.map = K.tex(256, 171, (c, W, H) => { c.drawImage(saved.image, 0, 0, W, H); c.fillStyle = '#ffd166'; c.beginPath(); c.arc(40, 34, 16, 0, 7); c.fill(); }); }
        else { p.material.map.dispose(); p.material.map = saved; }
        p.material.needsUpdate = true;
      };
    })() });
    const shelf = group(2.4, 3.3, -4.75, root);
    mesh(rbox(3.4, 0.1, 0.5, 0.03), mat(pal.wood), 0, 0, 0, shelf);
    mesh(rbox(3.4, 0.1, 0.5, 0.03), mat(pal.wood), 0, 1.05, 0, shelf);
    // 원두 봉투·병
    for (let i = 0; i < 4; i++) {
      const b = group(-1.2 + i * 0.8, 0.05, 0, shelf);
      if (i % 2) {
        mesh(rbox(0.36, 0.55, 0.22, 0.05), pm(['#6d4c41', '#d4a373', '#2d6a4f', '#bc4749'][i], { roughness: 0.8 }), 0, 0.28, 0, b);
        mesh(K.box(0.2, 0.18, 0.01), mat('#fefae0'), 0, 0.3, 0.115, b);
      } else {
        mesh(K.cyl(0.15, 0.15, 0.5, 16), new T.MeshPhysicalMaterial({ color: 0xf1f7f7, roughness: 0.05, transparent: true, opacity: 0.4 }), 0, 0.25, 0, b);
        mesh(K.cyl(0.13, 0.13, 0.32, 14), pm('#4a2c1d', { roughness: 0.9 }), 0, 0.16, 0, b);
        mesh(K.cyl(0.16, 0.16, 0.06, 16), mat('#222'), 0, 0.52, 0, b);
      }
      D(b, { kinds: ['hide', 'color'], group: 'bean' + i, minLv: i === 3 ? 2 : 0 });
    }
    for (let i = 0; i < 5; i++) {
      const m = P.mug(shelf, -1.4 + i * 0.7, 1.1, 0, ['#ffffff', '#264653', '#e9c46a', '#f4a261', '#ffffff'][i], 0.6);
      if (i % 2 === 0) D(m, { kinds: ['hide', 'color', 'mirror'], group: 'mug' + i, minLv: 1 });
    }
    // 네온 간판 (커피잔 모양)
    const neon = group(-0.2, 3.2, -4.95, root);
    const nm = K.glow(pick(r, [0xff5e9c, 0x5ee7ff, 0xffd166]), night ? 4 : 2.2);
    nm.userData.glow = true;
    const n1 = mesh(K.torus(0.35, 0.03, Math.PI), nm, 0, 0, 0, neon);
    n1.rotation.z = Math.PI;
    mesh(K.cyl(0.03, 0.03, 0.7, 6), nm, 0, 0, 0, neon).rotation.z = Math.PI / 2;
    const n2 = mesh(K.torus(0.12, 0.03, Math.PI), nm, 0.42, -0.12, 0, neon);
    n2.rotation.z = -Math.PI / 2;
    [-0.12, 0.05, 0.22].forEach((x, i) => {
      const w = mesh(K.torus(0.08, 0.025, Math.PI), nm, x, 0.22 + (i % 2) * 0.05, 0, neon);
      w.rotation.z = Math.PI / 2 + (i % 2 ? Math.PI : 0);
    });
    D(neon, { kinds: ['hide', 'alt'], alt: (on, d) => { nm.emissive.setHex(on ? pick(K.rng(d.p + 3), [0x7cff6b, 0xb28dff]) : nm.userData.orig || nm.emissive.getHex()); } });
    nm.userData.orig = nm.emissive.getHex();

    // ── 왼벽: 창 두 개 + 차양, 벽 선반 화분
    const windows = [];
    [-1.2, 2.2].forEach((z, i) => {
      const w = P.window(root, 0, 0, 0, 1.6, 1.8, night ? { stars: 1, skyTop: '#101a3a', skyBot: '#2d3c73' } : { hill: '#8fcf7a' });
      w.position.set(-5, 3.2, z);
      w.rotation.y = Math.PI / 2;
      windows.push(w);
      D(w, { kinds: ['color'], group: 'win' });
      // 줄무늬 차양
      const awT = tex(128, 32, (c, W, H) => {
        for (let x = 0; x < 8; x++) { c.fillStyle = pal.awn[x % 2]; c.fillRect(x * 16, 0, 16, H); }
      });
      const awM = new T.MeshStandardMaterial({ map: awT, roughness: 0.8, side: T.DoubleSide });
      awM.userData.paint = true;
      const aw = group(-4.75, 4.35, z, root);
      const pl = mesh(new T.PlaneGeometry(2.0, 0.7), awM, 0, 0, 0, aw);
      pl.rotation.set(-Math.PI / 2 + 0.6, Math.PI / 2, 0, 'YXZ');
      D(aw, { kinds: ['color', 'hide'], group: 'awn' + i, minLv: 1 });
    });
    // 창가 테이블 두 개
    [-1.2, 2.2].forEach((z, i) => {
      const t = group(-3.6, 0, z, root);
      mesh(K.cyl(0.75, 0.75, 0.08, 32), mat('#f8f9fa', { roughness: 0.3 }), 0, 1.45, 0, t);
      mesh(K.cyl(0.06, 0.06, 1.4, 10), mat('#343a40', { metalness: 0.6, roughness: 0.3 }), 0, 0.72, 0, t);
      mesh(K.cyl(0.4, 0.45, 0.05, 20), mat('#343a40', { metalness: 0.6 }), 0, 0.03, 0, t);
      blob(root, -3.6, z, 2.0, 2.0, 0.3);
      // 의자 둘
      [[1.05, 0], [0, 1.05]].forEach(([dx, dz], k) => {
        const ch = group(-3.6 + dx, 0, z + dz * (i ? -1 : 1), root);
        ch.rotation.y = dx ? Math.PI / 2 : i ? Math.PI : 0;
        const cm = pm(pick(r, ['#e76f51', '#2a9d8f', '#e9c46a', '#8ecae6']), { roughness: 0.45 });
        mesh(rbox(0.8, 0.1, 0.8, 0.04), cm, 0, 0.92, 0, ch);
        mesh(rbox(0.8, 0.34, 0.07, 0.04), cm, 0, 1.55, 0.36, ch);
        [-0.32, 0.32].forEach((a) => mesh(K.cyl(0.03, 0.03, 0.7, 6), mat('#343a40'), a, 1.2, 0.36, ch));
        [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]].forEach(([a, b]) => mesh(K.cyl(0.03, 0.03, 0.92, 6), mat('#343a40'), a, 0.46, b, ch));
        blob(root, -3.6 + dx, z + dz * (i ? -1 : 1), 1.1, 1.1, 0.3, null, ch);
        D(ch, { kinds: ['color', 'turn', 'hide'], turn: 0.9, group: 'chair' + i });
      });
      // 테이블 위
      const cup = P.mug(t, -0.2, 1.49, 0.15, pick(r, ['#ffffff', '#ffcad4', '#caf0f8']), 1.2);
      D(cup, { kinds: ['hide', 'color', 'mirror'] });
      const dessert = group(0.25, 1.49, -0.15, t);
      mesh(K.cyl(0.25, 0.2, 0.03, 20), mat('#fff'), 0, 0.015, 0, dessert);
      if (i === 0) {
        mesh(K.cyl(0.16, 0.16, 0.12, 20), pm('#e9c46a', { roughness: 0.8 }), 0, 0.09, 0, dessert);
        mesh(K.cyl(0.16, 0.16, 0.03, 20), pm('#7f4f24', { roughness: 0.4 }), 0, 0.16, 0, dessert);
        mesh(rbox(0.08, 0.03, 0.08, 0.01), mat('#fff3b0'), 0, 0.19, 0, dessert);
      } else {
        for (let k = 0; k < 3; k++) mesh(K.sphere(0.09, 14, 10), pm(['#ffafcc', '#caffbf', '#ffd6a5'][k]), Math.cos(k * 2.1) * 0.1, 0.07, Math.sin(k * 2.1) * 0.1, dessert).scale.y = 0.6;
      }
      D(dessert, { kinds: ['hide', 'color'] });
      const flower = group(0, 1.49, -0.35, t);
      mesh(K.cyl(0.05, 0.06, 0.25, 10), new T.MeshPhysicalMaterial({ color: 0xdff4ff, roughness: 0.05, transparent: true, opacity: 0.5 }), 0, 0.12, 0, flower);
      mesh(K.cyl(0.008, 0.008, 0.35, 4), mat('#4c956c'), 0, 0.3, 0, flower);
      mesh(K.sphere(0.07, 10, 8), pm(pick(r, ['#ff595e', '#ffca3a', '#8ac926'])), 0, 0.48, 0, flower);
      D(flower, { kinds: ['hide', 'color'], minLv: 1 });
    });

    // ── 앞쪽: 소파 자리
    const sofa = group(2.2, 0, 2.6, root);
    sofa.rotation.y = -Math.PI / 2;
    const sf = pm(pick(r, ['#6d597a', '#b56576', '#355070', '#588157']), { roughness: 0.9 });
    mesh(rbox(3.0, 0.6, 1.2, 0.15), sf, 0, 0.55, 0, sofa);
    mesh(rbox(3.0, 1.0, 0.35, 0.15), sf, 0, 1.2, -0.45, sofa);
    [-1.45, 1.45].forEach((x) => mesh(rbox(0.3, 0.9, 1.2, 0.12), sf, x, 0.75, 0, sofa));
    [-0.7, 0.7].forEach((x) => mesh(rbox(1.3, 0.2, 0.9, 0.1), mat(shade('#f8edeb', 0), { roughness: 0.95 }), x, 0.95, 0.1, sofa));
    [[-1.3, 0.3], [1.3, 0.3]].forEach(([a, b]) => mesh(K.cyl(0.05, 0.03, 0.25, 8), mat('#3a2e28'), a, 0.12, b, sofa));
    blob(root, 2.2, 2.6, 1.8, 3.4, 0.35, null, sofa);
    D(sofa, { kinds: ['color'] });
    const pillow1 = mesh(rbox(0.6, 0.55, 0.2, 0.12), pm(pick(r, ['#ffb703', '#8ecae6', '#ffafcc'])), -0.9, 1.25, -0.2, sofa);
    pillow1.rotation.set(-0.2, 0.2, 0.1);
    D(pillow1, { kinds: ['hide', 'color'] });
    const pillow2 = mesh(rbox(0.6, 0.55, 0.2, 0.12), pm('#ffffff'), 0.9, 1.25, -0.2, sofa);
    pillow2.rotation.set(-0.2, -0.2, -0.1);
    D(pillow2, { kinds: ['show'] });
    const cat = P.cat(sofa, 0.2, 0.15, 0.7, pick(r, ['#3d3d3d', '#f0a24e', '#8d8d8d']), 0.2, { y: 1.04 });
    D(cat, { kinds: ['hide', 'color', 'mirror'], colors: ['#f0a24e', '#8d8d8d', '#4a4a4a', '#c98a52', '#f5ebe0'] });
    // 낮은 탁자
    const low2 = group(0.5, 0, 2.6, root);
    mesh(rbox(1.2, 0.1, 1.8, 0.05), mat(pal.wood, { roughness: 0.5 }), 0, 0.8, 0, low2);
    [[-0.5, -0.8], [0.5, -0.8], [-0.5, 0.8], [0.5, 0.8]].forEach(([a, b]) => mesh(rbox(0.08, 0.8, 0.08, 0.02), mat(shade(pal.wood, -0.2)), a, 0.4, b, low2));
    blob(root, 0.5, 2.6, 1.6, 2.3, 0.3);
    const book = mesh(rbox(0.5, 0.08, 0.7, 0.02), pm(pick(r, ['#e63946', '#1d3557', '#2a9d8f'])), 0.1, 0.89, -0.4, low2);
    book.rotation.y = 0.3;
    D(book, { kinds: ['hide', 'color'] });
    const latte = P.mug(low2, -0.1, 0.85, 0.4, '#ffffff', 2.4);
    D(latte, { kinds: ['hide', 'color', 'mirror'] });
    const laptop = group(0.1, 0.85, 0.3, low2);
    laptop.rotation.y = -1.9;
    mesh(rbox(0.6, 0.03, 0.42, 0.01), pm('#adb5bd', { metalness: 0.6, roughness: 0.3 }), 0, 0.02, 0, laptop);
    const lid = mesh(rbox(0.6, 0.4, 0.02, 0.01), pm('#adb5bd', { metalness: 0.6, roughness: 0.3 }), 0, 0.22, -0.22, laptop);
    lid.rotation.x = -0.25;
    D(laptop, { kinds: ['show'], minLv: 1 });

    // 큰 화분 + 벽 조명
    const plant = P.plant(root, 4.2, -1.3, 1.1, r, { pot: pick(r, ['#f1f1f1', '#264653', '#e9c46a']), leaves: 11 });
    D(plant, { kinds: ['hide', 'color', 'grow'], grow: 1.25 });
    const plant2 = P.plant(root, -4.2, 4.2, 0.8, r, { pot: '#bc6c25', leaf: '#52796f' });
    D(plant2, { kinds: ['hide', 'color'] });
    // 칠판 입간판
    const sign = group(-1.0, 0, 3.8, root);
    sign.rotation.y = 0.5;
    const sT = tex(128, 160, (c, W, H) => {
      c.fillStyle = '#263238'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('OPEN', W / 2, 36);
      c.strokeStyle = '#ffd166'; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, 90, 22, 0, 7); c.stroke();
      c.fillStyle = '#ff8fab'; c.fillRect(30, 130, 68, 6);
    });
    const sgM = new T.MeshStandardMaterial({ map: sT, roughness: 0.9 });
    [-1, 1].forEach((sd) => {
      const board = mesh(K.box(0.9, 1.3, 0.05), [mat('#8d6346'), mat('#8d6346'), mat('#8d6346'), mat('#8d6346'), sgM, sgM], 0, 0.7, sd * 0.22, sign);
      board.rotation.x = sd * 0.18;
    });
    mesh(K.box(1.0, 0.06, 0.1), pm('#8d6346'), 0, 1.36, 0, sign);
    blob(root, -1.0, 3.8, 1.3, 1.1, 0.3, null, sign);
    D(sign, { kinds: ['hide', 'turn'], turn: Math.PI / 2 });

    // 줄 전구 (뒷벽 위)
    const bulbs = group(0, 5.3, -4.8, root);
    const cord = mat('#222');
    for (let i = 0; i < 14; i++) {
      const x = -4.5 + i * 0.7;
      const y = -Math.abs(Math.sin((i / 13) * Math.PI * 2)) * 0.35;
      const b = mesh(K.sphere(0.07, 10, 8), K.glow(0xffe0a3, night ? 4 : 1.8), x, y - 0.1, 0.05, bulbs);
      mesh(K.cyl(0.03, 0.03, 0.06, 6), cord, x, y - 0.02, 0.05, bulbs);
      if (i === 5) D(b, { kinds: ['hide'], minLv: 3 });
    }
    const cl = ctx.light(new T.PointLight(0xffc98a, night ? 26 : 6, 9, 1.3));
    cl.position.set(1.5, 4.2, -2.5);
    const cl2 = ctx.light(new T.PointLight(0xffc98a, night ? 16 : 3, 7, 1.4));
    cl2.position.set(-3, 3.5, 1);

    if (night) {
      ctx.sun.intensity = 0.4;
      ctx.sun.color.set(0x8a95ff);
      ctx.hemi.intensity = 0.25;
      ctx.env = 0.2;
      ctx.exposure(1.15);
    } else {
      ctx.hemi.intensity = 0.6;
    }
    return { view: { fit: 6.3, ly: 2.5 } };
  };
})();
