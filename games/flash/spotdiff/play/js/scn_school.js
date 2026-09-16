// 장면 4: 교실
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  SCN.school = function (ctx) {
    const r = ctx.r, root = ctx.root, D = ctx.D;
    const night = ctx.opt.night;
    const pal = pick(r, [
      { wall: '#f4f1de', low: '#81b29a', board: '#2f5d50' },
      { wall: '#fdf6e3', low: '#e07a5f', board: '#264653' },
      { wall: '#eef3f8', low: '#6d8fc9', board: '#2d4a3e' },
    ]);
    ctx.bg(night ? '#3a2c3f' : '#f1eadf', night ? '#221a28' : '#d9cbb8');
    const floorT = tex(512, 512, (c, W, H) => {
      // 긴 마루 판
      const rows = 10, ph = H / rows;
      for (let i = 0; i < rows; i++) {
        c.fillStyle = shade('#d6a86c', ((i * 7) % 5 - 2) * 0.03);
        c.fillRect(0, i * ph, W, ph);
        c.fillStyle = 'rgba(80,40,10,0.28)';
        c.fillRect(0, i * ph, W, 2);
        const off = (i * 173) % W;
        c.fillRect(off, i * ph, 2, ph);
        c.strokeStyle = 'rgba(90,50,20,0.08)';
        for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(0, i * ph + 8 + k * 10); c.lineTo(W, i * ph + 10 + k * 10); c.stroke(); }
      }
    }, [2, 2]);
    const wallT = tex(256, 256, (c, W, H) => { c.fillStyle = pal.wall; c.fillRect(0, 0, W, H); }, [4, 3]);
    P.room(ctx, { floorTex: floorT, wallTex: wallT, slab: '#6b5445', wainscot: pal.low, wainscotH: 1.5 });

    // ── 칠판 (뒷벽)
    const drawBoard = (extra) => (c, W, H) => {
      c.fillStyle = pal.board; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 30; i++) c.fillRect((i * 97) % W, (i * 41) % H, 30, 6);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.lineCap = 'round';
      // 해 + 집 + 사과 낙서
      c.beginPath(); c.arc(40, 34, 16, 0, 7); c.stroke();
      for (let i = 0; i < 8; i++) { const a = i * 0.785; c.beginPath(); c.moveTo(40 + Math.cos(a) * 22, 34 + Math.sin(a) * 22); c.lineTo(40 + Math.cos(a) * 30, 34 + Math.sin(a) * 30); c.stroke(); }
      c.beginPath(); c.moveTo(90, 100); c.lineTo(120, 70); c.lineTo(150, 100); c.lineTo(150, 130); c.lineTo(90, 130); c.closePath(); c.stroke();
      c.fillStyle = '#ffd6e0'; c.font = 'bold 26px sans-serif'; c.fillText('1 + 2 = 3', 180, 50);
      c.fillStyle = '#fff3b0'; c.fillText('A B C', 190, 100);
      c.strokeStyle = '#ff8fab'; c.beginPath(); c.arc(330, 110, 18, 0, 7); c.stroke();
      if (extra) { c.strokeStyle = '#a0e7e5'; c.beginPath(); c.moveTo(250, 125); c.lineTo(290, 125); c.lineTo(270, 140); c.closePath(); c.stroke(); c.fillStyle = '#a0e7e5'; c.fillText('★', 40, 125); }
    };
    const board = group(-0.5, 3.1, -5, root);
    mesh(rbox(4.6, 2.2, 0.12, 0.04), mat('#8d6346', { roughness: 0.5 }), 0, 0, 0.06, board);
    const bT = tex(400, 190, drawBoard(false));
    const bM = new T.MeshStandardMaterial({ map: bT, roughness: 0.95 });
    const bp = mesh(new T.PlaneGeometry(4.3, 1.95), bM, 0, 0, 0.125, board);
    bp.castShadow = false;
    D(board, { kinds: ['alt'], alt: (() => { let saved; return (on) => { if (on) { saved = bM.map; bM.map = tex(400, 190, drawBoard(true)); } else { bM.map.dispose(); bM.map = saved; } bM.needsUpdate = true; }; })() });
    const tray = mesh(rbox(4.4, 0.08, 0.25, 0.02), mat('#8d6346'), 0, -1.12, 0.2, board);
    const chalk = group(0.9, -1.04, 0.22, board);
    ['#ffffff', '#ffd166', '#ff8fab'].forEach((c, i) => mesh(K.cyl(0.025, 0.025, 0.22, 6), pm(c), i * 0.12, 0, 0, chalk).rotation.z = Math.PI / 2);
    D(chalk, { kinds: ['hide'], minLv: 1 });
    const eraser = mesh(rbox(0.36, 0.1, 0.14, 0.02), pm('#3a86ff'), -1.2, -1.02, 0.22, board);
    D(eraser, { kinds: ['hide', 'color'] });

    // 칠판 위 시계, 옆 게시판
    const clock = P.clock(root, -0.5, 5.0, -5, pick(r, ['#264653', '#e76f51', '#8338ec']));
    D(clock, { kinds: ['color', 'alt'], alt(on) { clock.userData.hour.rotation.z += on ? 1.8 : -1.8; } });
    const pin = group(3.4, 3.2, -5, root);
    const corkT = tex(128, 128, (c, W, H) => {
      c.fillStyle = '#c69c6d'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 300; i++) { c.fillStyle = i % 2 ? 'rgba(80,40,10,0.18)' : 'rgba(255,255,255,0.1)'; c.fillRect((i * 37) % W, (i * 61) % H, 2, 2); }
    });
    mesh(rbox(2.6, 2.0, 0.1, 0.03), mat('#8d6346'), 0, 0, 0.05, pin);
    mesh(new T.PlaneGeometry(2.4, 1.8), new T.MeshStandardMaterial({ map: corkT, roughness: 1 }), 0, 0, 0.105, pin);
    const papers = [
      [-0.7, 0.4, 0.7, 0.8, '#ffffff', 0.1], [0.2, 0.45, 0.6, 0.6, '#ffe066', -0.1], [0.8, 0.3, 0.5, 0.7, '#a0c4ff', 0.05],
      [-0.6, -0.5, 0.8, 0.6, '#ffadad', -0.05], [0.4, -0.45, 0.8, 0.6, '#caffbf', 0.08],
    ];
    papers.forEach(([x, y, w, h, c, rot], i) => {
      const pg = group(x, y, 0.12, pin);
      pg.rotation.z = rot;
      mesh(K.box(w, h, 0.01), pm(c, { roughness: 1 }), 0, 0, 0, pg);
      // 그림 줄
      mesh(K.box(w * 0.6, 0.04, 0.012), mat('#888'), 0, h * 0.2, 0.001, pg);
      mesh(K.box(w * 0.4, 0.04, 0.012), mat('#888'), -w * 0.1, 0, 0.001, pg);
      mesh(K.sphere(0.04, 8, 6), pm(['#e63946', '#1d3557', '#2a9d8f', '#ffb703', '#8338ec'][i]), 0, h / 2 - 0.06, 0.02, pg);
      D(pg, { kinds: ['hide', 'color'], group: 'paper' + i, minLv: i > 2 ? 1 : 0 });
    });
    const star = group(1.05, 0.75, 0.13, pin);
    const stT = tex(64, 64, (c) => { c.fillStyle = '#ffd23f'; K.star(c, 32, 34, 30, 13); });
    mesh(new T.PlaneGeometry(0.45, 0.45), new T.MeshStandardMaterial({ map: stT, transparent: true, roughness: 0.6 }), 0, 0, 0, star);
    D(star, { kinds: ['show'] });

    // ── 교탁 (칠판 앞)
    const desk = group(-0.8, 0, -3.3, root);
    const dm = pm(pick(r, ['#b07d4f', '#8d6346', '#caa37a']), { roughness: 0.5 });
    mesh(rbox(2.4, 0.12, 1.1, 0.04), dm, 0, 1.6, 0, desk);
    mesh(rbox(2.3, 1.5, 0.08, 0.03), dm, 0, 0.8, 0.45, desk);
    [-1.1, 1.1].forEach((x) => mesh(rbox(0.1, 1.55, 1.0, 0.03), dm, x, 0.78, 0, desk));
    blob(root, -0.8, -3.3, 2.8, 1.6, 0.35);
    D(desk, { kinds: ['color'] });
    const apple = group(0.8, 1.66, 0.1, desk);
    mesh(K.sphere(0.15), pm('#e63946', { roughness: 0.35 }), 0, 0.14, 0, apple);
    mesh(K.cyl(0.015, 0.015, 0.1, 5), mat('#5a3b28'), 0, 0.32, 0, apple);
    const leaf = mesh(K.sphere(0.06, 8, 6), mat('#52b788'), 0.05, 0.33, 0, apple);
    leaf.scale.set(1.3, 0.3, 0.7);
    D(apple, { kinds: ['hide', 'color'] });
    const books = group(-0.6, 1.66, 0, desk);
    ['#1d3557', '#e63946', '#ffb703'].forEach((c, i) => mesh(rbox(0.7 - i * 0.05, 0.12, 0.5, 0.02), pm(c), 0, 0.06 + i * 0.125, 0, books).rotation.y = (i - 1) * 0.15);
    D(books, { kinds: ['hide', 'color'] });
    const globe = group(0.1, 1.66, -0.25, desk);
    mesh(K.cyl(0.12, 0.16, 0.06, 20), mat('#343a40'), 0, 0.03, 0, globe);
    const eT = tex(128, 64, (c, W, H) => {
      c.fillStyle = '#48cae4'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#90be6d';
      [[20, 22, 14, 10], [34, 42, 8, 12], [72, 20, 18, 9], [84, 42, 10, 10]].forEach(([x, y, a, b]) => { c.beginPath(); c.ellipse(x, y, a, b, 0.4, 0, 7); c.fill(); });
    });
    const gM = new T.MeshStandardMaterial({ map: eT, roughness: 0.4 });
    gM.userData.paint = true;
    mesh(K.sphere(0.26, 24, 16), gM, 0, 0.42, 0, globe);
    mesh(K.torus(0.29, 0.015, Math.PI), mat('#adb5bd', { metalness: 0.7 }), 0, 0.42, 0, globe).rotation.z = 0.4;
    D(globe, { kinds: ['hide', 'color', 'grow'] });

    // ── 학생 책상 3x2
    const bags = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = -2.2 + col * 2.2, z = -0.4 + row * 2.4;
        const dg = group(x, 0, z, root);
        const top = pm(pick(r, ['#e9c46a', '#f4a261', '#d4a373']), { roughness: 0.5 });
        mesh(rbox(1.5, 0.1, 0.9, 0.03), top, 0, 1.25, 0, dg);
        const legM = mat('#6c757d', { metalness: 0.5, roughness: 0.35 });
        [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].forEach(([a, b]) => mesh(K.cyl(0.035, 0.035, 1.2, 6), legM, a, 0.6, b, dg));
        mesh(rbox(1.3, 0.25, 0.7, 0.02), mat('#adb5bd', { metalness: 0.3 }), 0, 1.05, 0, dg);
        blob(root, x, z, 1.9, 1.3, 0.3);
        // 의자
        const ch = group(x, 0, z + 0.85, root);
        const cm = pm(pick(r, ['#4dabf7', '#ff6b6b', '#51cf66', '#fcc419']), { roughness: 0.45 });
        mesh(rbox(0.8, 0.08, 0.7, 0.03), cm, 0, 0.8, 0, ch);
        mesh(rbox(0.8, 0.5, 0.06, 0.03), cm, 0, 1.3, 0.34, ch);
        [[-0.34, -0.3], [0.34, -0.3], [-0.34, 0.3], [0.34, 0.3]].forEach(([a, b]) => mesh(K.cyl(0.03, 0.03, 0.8, 6), legM, a, 0.4, b, ch));
        [-0.34, 0.34].forEach((a) => mesh(K.cyl(0.025, 0.025, 0.5, 6), legM, a, 1.05, 0.34, ch));
        blob(root, x, z + 0.85, 1.0, 0.9, 0.3, null, ch);
        D(ch, { kinds: ['color', 'turn', 'hide'], turn: 0.6, group: 'sch' + ((row + col) % 3) });
        D(dg, { kinds: ['color'], paint: [dg.children[0]], group: 'desk' + ((row * 2 + col) % 3) });
        // 책상 위 소품: 순서대로 다르게
        const k = (row * 3 + col) % 6;
        if (k === 0 || k === 3) {
          const nb = mesh(rbox(0.5, 0.03, 0.36, 0.01), pm(pick(r, ['#ffffff', '#caf0f8', '#ffe5ec'])), -0.2, 1.32, 0, dg);
          nb.rotation.y = 0.2;
          const pencil = group(0.2, 1.32, 0.05, dg);
          pencil.rotation.y = -0.7;
          mesh(K.cyl(0.025, 0.025, 0.45, 6), pm('#ffd60a'), 0, 0.025, 0, pencil).rotation.z = Math.PI / 2;
          mesh(K.cone(0.025, 0.07, 6), mat('#f4d6a0'), 0.26, 0.025, 0, pencil).rotation.z = -Math.PI / 2;
          D(nb, { kinds: ['color', 'hide'] });
          D(pencil, { kinds: ['hide', 'color', 'turn'], turn: 1.4, minLv: 1 });
        } else if (k === 1 || k === 4) {
          const box = group(0.25, 1.3, -0.05, dg);
          mesh(rbox(0.5, 0.18, 0.3, 0.05), pm(pick(r, ['#ff8fab', '#8ecae6', '#b8f2e6'])), 0, 0.09, 0, box);
          D(box, { kinds: ['hide', 'color'] });
          const ruler = mesh(rbox(0.6, 0.02, 0.08, 0.005), pm('#e9ff70', { transparent: true, opacity: 0.8 }), -0.3, 1.31, 0.15, dg);
          ruler.rotation.y = -0.3;
          D(ruler, { kinds: ['hide', 'color'], minLv: 2 });
          const eraserS = mesh(rbox(0.12, 0.06, 0.08, 0.02), pm('#ffffff'), -0.2, 1.33, -0.15, dg);
          D(eraserS, { kinds: ['show'], minLv: 2 });
        } else {
          const cup = P.mug(dg, -0.35, 1.3, -0.1, pick(r, ['#ffffff', '#ffd6a5', '#a0c4ff']), 0.9);
          D(cup, { kinds: ['hide', 'color', 'mirror'] });
          const openB = group(0.2, 1.31, 0.05, dg);
          const pageM = mat('#fffdf5', { roughness: 0.9 });
          [-1, 1].forEach((sd) => { const pg = mesh(rbox(0.32, 0.03, 0.42, 0.01), pageM, sd * 0.16, 0.02, 0, openB); pg.rotation.z = sd * 0.08; });
          const cover = mesh(rbox(0.68, 0.015, 0.46, 0.005), pm(pick(r, ['#e76f51', '#2a9d8f', '#6a4c93'])), 0, 0, 0, openB);
          D(openB, { kinds: ['hide', 'color', 'turn'], turn: 0.9 });
        }
        // 가방: 의자 옆에 몇 개
        if ((row + col) % 2 === 0) {
          const bag = group(x + 0.55, 0, z + 1.1, root);
          bag.rotation.y = -0.4 + col * 0.3;
          const bm = pm(pick(r, ['#ef476f', '#118ab2', '#06d6a0', '#ffd166', '#8338ec']), { roughness: 0.7 });
          mesh(rbox(0.55, 0.65, 0.3, 0.12), bm, 0, 0.33, 0, bag);
          mesh(rbox(0.45, 0.3, 0.12, 0.06), mat(shade('#333333', 0.1)), 0, 0.22, 0.17, bag).material = bm;
          mesh(K.torus(0.12, 0.03, Math.PI), bm, 0, 0.66, 0, bag);
          blob(root, x + 0.55, z + 1.1, 0.8, 0.6, 0.35, null, bag);
          D(bag, { kinds: ['hide', 'color', 'turn'], turn: 1.2 });
          bags.push(bag);
        }
      }
    }

    // ── 왼벽: 창 둘, 사물함
    [-2.6, 0.9].forEach((z, i) => {
      const w = P.window(root, 0, 0, 0, 2.0, 1.9, night ? { stars: 1, skyTop: '#2a1e4a', skyBot: '#f28f6b' } : {});
      w.position.set(-5, 3.6, z);
      w.rotation.y = Math.PI / 2;
      D(w, { kinds: ['color'], group: 'win' });
    });
    const plantW = P.plant(root, -4.55, -2.3, 0.4, r, { y: 2.45, noBlob: 1, pot: '#ffb4a2' });
    D(plantW, { kinds: ['hide', 'color'] });
    const fish = group(-4.6, 2.45, 1.0, root);
    mesh(rbox(0.8, 0.5, 0.45, 0.04), new T.MeshPhysicalMaterial({ color: 0xcdefff, roughness: 0.05, transparent: true, opacity: 0.5 }), 0, 0.26, 0, fish);
    mesh(K.box(0.74, 0.3, 0.4), new T.MeshStandardMaterial({ color: 0x48cae4, transparent: true, opacity: 0.45 }), 0, 0.2, 0, fish);
    const goldfish = group(0.05, 0.25, 0.05, fish);
    mesh(K.sphere(0.07, 12, 8), pm('#ff7b00', { roughness: 0.4 }), 0, 0, 0, goldfish).scale.set(1.4, 1, 0.7);
    mesh(K.cone(0.05, 0.08, 6), pm('#ff7b00'), -0.12, 0, 0, goldfish).rotation.z = Math.PI / 2;
    D(goldfish, { kinds: ['hide', 'color'], minLv: 1 });
    D(fish, { kinds: ['hide'], minLv: 0, group: 'tank' });
    // 사물함 (왼벽 앞쪽)
    const lock = group(-4.5, 0, 3.4, root);
    lock.rotation.y = Math.PI / 2;
    const lm = pm(pick(r, ['#8ecae6', '#ffb4a2', '#b5e48c']), { roughness: 0.5 });
    mesh(rbox(2.6, 1.8, 0.9, 0.05), mat('#f8f9fa', { roughness: 0.5 }), 0, 0.9, 0, lock);
    for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 4; xx++) {
      const door = mesh(rbox(0.58, 0.8, 0.05, 0.03), lm, -0.95 + xx * 0.63, 0.47 + yy * 0.88, 0.45, lock);
      mesh(K.cyl(0.03, 0.03, 0.04, 8), mat('#495057'), 0.2, 0, 0.03, door).rotation.x = Math.PI / 2;
      if ((xx + yy) % 3 === 0) D(door, { kinds: ['color'], minLv: 2, group: 'lk' + xx });
    }
    blob(root, -4.5, 3.4, 1.4, 3.0, 0.3);
    D(lock, { kinds: ['color'], paint: [lock.children[1]] });
    const ballL = P.ball(lock, 0.6, 0, 0.26, pick(r, ['#ff6b6b', '#4dabf7']), '#ffffff');
    ballL.position.y = 2.06;
    D(ballL, { kinds: ['hide', 'color'] });
    const trophy = group(-0.6, 1.8, 0, lock);
    const gold = pm('#f2c14e', { roughness: 0.25, metalness: 0.85 });
    mesh(rbox(0.3, 0.12, 0.3, 0.02), mat('#5a3b28'), 0, 0.06, 0, trophy);
    mesh(K.cyl(0.04, 0.06, 0.2, 10), gold, 0, 0.22, 0, trophy);
    mesh(K.lathe('cupT', [[0, 0], [0.05, 0], [0.18, 0.12], [0.2, 0.32], [0.17, 0.33], [0, 0.18]]), gold, 0, 0.3, 0, trophy);
    D(trophy, { kinds: ['hide', 'color', 'grow'] });

    // 앞 오른쪽: 쓰레기통, 화분, 청소도구
    const bin = group(4.2, 0, 3.6, root);
    const binM = pm(pick(r, ['#2a9d8f', '#adb5bd', '#e76f51']), { roughness: 0.5 });
    mesh(rbox(0.8, 1.0, 0.8, 0.08), binM, 0, 0.5, 0, bin);
    mesh(K.box(0.3, 0.3, 0.02), mat('#ffffff'), 0, 0.6, 0.41, bin);
    blob(root, 4.2, 3.6, 1.1, 1.1, 0.35, null, bin);
    D(bin, { kinds: ['color', 'hide'] });
    const crumple = mesh(K.ico(0.1, 0), mat('#ffffff'), 3.6, 0.1, 3.4, root);
    D(crumple, { kinds: ['show'] });
    // 책 읽는 자리: 러그 + 빈백 + 책 더미
    const rugT = tex(128, 128, (c, W, H) => {
      c.fillStyle = '#ffe8d6'; c.fillRect(0, 0, W, H);
      ['#ffadad', '#ffd6a5', '#caffbf', '#9bf6ff'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, 8 + i * 30, W, 14); });
    });
    const rugM = new T.MeshStandardMaterial({ map: rugT, roughness: 1 });
    rugM.userData.paint = true;
    const rug = mesh(rbox(2.6, 0.04, 2.0, 0.02), rugM, 2.6, 0.02, 3.3, root);
    rug.castShadow = false;
    D(rug, { kinds: ['color'] });
    const bean = group(3.0, 0, 3.5, root);
    const beanM = pm(pick(r, ['#ff8fab', '#70d6ff', '#ffd670']), { roughness: 0.95 });
    mesh(K.sphere(0.7, 24, 16), beanM, 0, 0.45, 0, bean).scale.set(1, 0.7, 1);
    mesh(K.sphere(0.5, 20, 14), beanM, 0.1, 0.85, 0.35, bean).scale.set(1, 0.9, 0.6);
    blob(root, 3.0, 3.5, 1.7, 1.7, 0.35, null, bean);
    D(bean, { kinds: ['color', 'hide'] });
    const pile = group(1.9, 0.04, 3.0, root);
    ['#6a4c93', '#1982c4', '#8ac926', '#ffca3a'].forEach((c, i) => {
      const b = mesh(rbox(0.6, 0.1, 0.45, 0.02), pm(c), 0, 0.05 + i * 0.105, 0, pile);
      b.rotation.y = i * 0.35;
      if (i === 3) D(b, { kinds: ['hide', 'color'], minLv: 1 });
    });
    D(pile, { kinds: ['hide'] });
    const teddy = P.teddy(root, 3.35, 3.0, 0.4, pick(r, ['#c98a52', '#e8c79a']), -0.9);
    teddy.position.y = 0.55;
    D(teddy, { kinds: ['show'] });

    const plant = P.plant(root, 4.3, -3.6, 0.9, r, { pot: pick(r, ['#e76f51', '#f1f1f1']) });
    D(plant, { kinds: ['hide', 'color', 'grow'], grow: 1.3 });
    const broom = group(-4.75, 0, -4.3, root);
    broom.rotation.z = -0.15;
    mesh(K.cyl(0.03, 0.03, 2.2, 6), pm('#e9c46a'), 0, 1.3, 0, broom);
    mesh(rbox(0.5, 0.35, 0.12, 0.03), pm('#e63946'), 0, 0.18, 0, broom);
    D(broom, { kinds: ['hide', 'color'] });
    // 지구 모양 모빌 대신 천장 없는 방이니 뒷벽 알파벳 띠
    const abc = group(2.8, 5.1, -4.97, root);
    const abcC = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'];
    'ABCDEF'.split('').forEach((ch, i) => {
      const t = tex(64, 64, (c) => { c.fillStyle = abcC[i]; c.fillRect(0, 0, 64, 64); c.fillStyle = '#fff'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 32, 35); });
      const m = new T.MeshStandardMaterial({ map: t, roughness: 0.8 });
      m.userData.paint = true;
      const card = mesh(K.box(0.42, 0.42, 0.02), m, -1.3 + i * 0.52, 0, 0.02, abc);
      card.rotation.z = (i % 2 ? 1 : -1) * 0.06;
      if (i % 2 === 0) D(card, { kinds: ['hide', 'color'], group: 'abc' + i, minLv: 1 });
    });

    const l1 = ctx.light(new T.PointLight(0xfff2d6, night ? 18 : 3, 12, 1.2));
    l1.position.set(0.5, 5.5, 0.5);
    if (night) {
      // 노을
      ctx.sun.intensity = 1.6;
      ctx.sun.color.set(0xff9a62);
      ctx.sun.position.set(-4, 5, 10);
      ctx.hemi.intensity = 0.35;
      ctx.env = 0.4;
    }
    return { view: { fit: 6.3, ly: 2.5 } };
  };
})();
