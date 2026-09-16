// 장면 1: 아이 방
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  SCN.bedroom = function (ctx) {
    const r = ctx.r;
    const root = ctx.root;
    const night = ctx.opt.night;
    const pal = pick(r, [
      { wall: '#f5d7c4', dot: '#eebfa4', wall2: '#cfe0f0', dot2: '#b9d0e8', low: '#8fb8de', kind: 'dot', blanket: '#5aa9e6', rug: ['#ffcf70', '#ff9f68', '#fff1cf'] },
      { wall: '#d3ead7', dot: '#bddfc3', wall2: '#f7e0c8', dot2: '#efcfad', low: '#f2b880', kind: 'stripe', blanket: '#f07f8f', rug: ['#8fd3c8', '#5fb7ae', '#e6f7f3'] },
      { wall: '#dcd6f7', dot: '#c7bef2', wall2: '#fbe6bf', dot2: '#f6d48f', low: '#a99be6', kind: 'star', blanket: '#ffb347', rug: ['#b9a7f0', '#8f7be0', '#f1ecff'] },
    ]);
    ctx.bg(night ? '#34304f' : '#fbeee2', night ? '#1f1d33' : '#efd3c2');
    P.room(ctx, {
      floorTex: K.woodFloor('#c98e5e', r),
      wallTex: K.wallpaper(pal.wall, pal.dot, pal.kind),
      wallTex2: K.wallpaper(pal.wall2, pal.dot2, 'dot'),
      slab: '#8b5a3a',
      wainscot: pal.low,
    });
    const D = ctx.D;

    // ── 창문 + 커튼 (뒷벽)
    const win = P.window(root, 1.4, 3.7, -5, 2.4, 2.0, night ? { stars: 1, skyTop: '#1b2350', skyBot: '#3a4a8a' } : {});
    D(win, { kinds: ['color'] });
    const cl = P.curtain(root, -0.25, 5.15, -4.8, 0.9, 2.9, pal.blanket);
    const cr = P.curtain(root, 3.05, 5.15, -4.8, 0.9, 2.9, pal.blanket);
    D(cl, { kinds: ['color', 'hide'], group: 'curtain' });
    D(cr, { kinds: ['color', 'hide'], group: 'curtain' });
    mesh(K.cyl(0.05, 0.05, 4.2, 10), mat('#8a5a3c'), 1.4, 5.2, -4.75, root).rotation.z = Math.PI / 2;

    // ── 침대 (왼벽에 붙여)
    const bed = group(-3.75, 0, -2.6, root);
    const wood = mat('#b77a4f', { roughness: 0.55 });
    const woodD = mat('#9a6039', { roughness: 0.55 });
    mesh(rbox(2.5, 0.5, 4.6, 0.1), wood, 0, 0.45, 0, bed);
    [[-1.1, -2.15], [1.1, -2.15], [-1.1, 2.15], [1.1, 2.15]].forEach(([a, b]) => mesh(rbox(0.22, 0.4, 0.22, 0.05), woodD, a, 0.2, b, bed));
    const head = group(0, 0, -2.35, bed);
    mesh(rbox(2.6, 2.4, 0.22, 0.1), wood, 0, 1.2, 0, head);
    const hb = mesh(rbox(2.0, 1.0, 0.1, 0.35), pm(shade(pal.blanket, 0.35), { roughness: 0.9 }), 0, 1.65, 0.12, head);
    D(hb, { kinds: ['color'] });
    const foot = mesh(rbox(2.6, 1.2, 0.2, 0.1), wood, 0, 0.6, 2.35, bed);
    mesh(rbox(2.3, 0.4, 4.3, 0.15), mat('#fbfaf6', { roughness: 0.9 }), 0, 0.88, 0, bed);
    // 이불: 무늬 질감
    const quiltT = tex(256, 256, (c, W, H) => {
      c.fillStyle = pal.blanket; c.fillRect(0, 0, W, H);
      c.fillStyle = shade(pal.blanket, 0.28);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2 === 0) c.fillRect(x * 64, y * 64, 64, 64);
      c.fillStyle = 'rgba(255,255,255,0.8)';
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if ((x + y) % 2 === 1) K.star(c, x * 64 + 32, y * 64 + 32, 16, 7);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.setLineDash([6, 5]);
      for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, H); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(W, i * 64); c.stroke(); }
    });
    const quiltM = new T.MeshStandardMaterial({ map: quiltT, roughness: 0.95 });
    quiltM.userData.paint = true;
    const quilt = mesh(rbox(2.5, 0.34, 3.0, 0.16), quiltM, 0, 1.12, 0.75, bed);
    D(quilt, { kinds: ['color'] });
    const fold = mesh(rbox(2.52, 0.22, 0.5, 0.1), mat('#ffffff', { roughness: 0.9 }), 0, 1.24, -0.65, bed);
    const pillow = mesh(rbox(1.5, 0.34, 0.8, 0.17), pm('#fff6e8', { roughness: 0.95 }), 0, 1.22, -1.65, bed);
    pillow.rotation.x = -0.25;
    D(pillow, { kinds: ['color', 'hide'] });
    blob(root, -3.75, -2.6, 3.4, 5.6, 0.3);
    // 침대 위 곰인형
    const bear = P.teddy(bed, 0.55, -1.2, 0.55, pick(r, ['#c98a52', '#e8c79a', '#9c6b4a']), 0.3);
    bear.position.y = 1.2;
    D(bear, { kinds: ['hide', 'color', 'mirror'] });
    D(bear.userData.bow, { kinds: ['hide', 'color'], minLv: 2 });

    // ── 머리맡 벽시계, 그림들 (왼벽)
    const clock = P.clock(root, -3.75, 5.0, -5, pick(r, ['#e76f51', '#2a9d8f', '#f4a261']));
    D(clock, {
      kinds: ['color', 'alt', 'hide'],
      alt(on, d) { clock.userData.hour.rotation.z += on ? 1.6 : -1.6; },
    });
    const pics = Object.keys(P.pics);
    const p1 = pick(r, pics);
    const f1 = P.frame(root, -5, 3.6, -0.2, 1.3, 1.0, P.pics[p1], { onLeft: 1, color: '#7a5236' });
    D(f1, { kinds: ['color', 'hide', 'alt'], alt: frameAlt(f1, pics, p1) });
    const p2 = pick(r, pics.filter((x) => x !== p1));
    const f2 = P.frame(root, -5, 3.3, 1.6, 0.9, 1.3, P.pics[p2], { onLeft: 1, color: '#ffffff' });
    D(f2, { kinds: ['color', 'hide', 'alt'], alt: frameAlt(f2, pics, p2) });

    // 왼벽 선반 + 소품
    const shelf = group(-4.75, 2.6, 3.2, root);
    mesh(rbox(0.5, 0.12, 2.4, 0.04), mat('#f3e6d6', { roughness: 0.6 }), 0, 0, 0, shelf);
    [-0.9, 0.9].forEach((z) => mesh(rbox(0.4, 0.3, 0.08, 0.02), mat('#caa37a'), -0.05, -0.2, z, shelf));
    const smallPlant = P.plant(shelf, 0, -0.7, 0.36, r, { y: 0.06, noBlob: 1, pot: '#6fb3d2', leaves: 7 });
    D(smallPlant, { kinds: ['hide', 'color'] });
    const rocket = group(0, 0.06, 0.1, shelf);
    const rk = pm('#ffffff', { roughness: 0.35 });
    mesh(K.capsule(0.13, 0.35), rk, 0, 0.32, 0, rocket);
    mesh(K.cone(0.13, 0.22, 16), pm('#e84a5f', { roughness: 0.4 }), 0, 0.72, 0, rocket);
    [0, 2.1, 4.2].forEach((a) => {
      const fin = mesh(K.box(0.02, 0.2, 0.14), mat('#e84a5f'), Math.sin(a) * 0.13, 0.12, Math.cos(a) * 0.13, rocket);
      fin.rotation.y = a;
    });
    mesh(K.cyl(0.05, 0.05, 0.03, 12), mat('#7ec8e3', { roughness: 0.1 }), 0.13, 0.42, 0, rocket).rotation.z = Math.PI / 2;
    D(rocket, { kinds: ['hide', 'color', 'grow'] });
    const snow = group(0, 0.06, 0.8, shelf);
    mesh(K.cyl(0.14, 0.16, 0.1, 16), mat('#7a4a2a'), 0, 0.05, 0, snow);
    mesh(K.sphere(0.17), new T.MeshPhysicalMaterial({ color: 0xdff4ff, roughness: 0.05, transmission: 0.3, transparent: true, opacity: 0.55 }), 0, 0.24, 0, snow);
    mesh(K.cone(0.07, 0.16, 8), pm('#3f9b5a'), 0, 0.22, 0, snow);
    D(snow, { kinds: ['hide', 'color'] });

    // ── 책상 + 의자 (창 아래)
    const desk = group(1.4, 0, -4.2, root);
    const dw = pm(pick(r, ['#f2e3cf', '#ffffff', '#cfe3ef']), { roughness: 0.5 });
    mesh(rbox(2.8, 0.14, 1.3, 0.05), dw, 0, 1.55, 0, desk);
    const legM = mat('#9a6a45', { roughness: 0.5 });
    [[-1.25, -0.5], [1.25, -0.5], [-1.25, 0.5], [1.25, 0.5]].forEach(([a, b]) => mesh(rbox(0.12, 1.5, 0.12, 0.04), legM, a, 0.75, b, desk));
    const drawer = group(0.85, 0, 0, desk);
    mesh(rbox(0.9, 0.9, 1.2, 0.06), dw, 0, 1.0, 0, drawer);
    mesh(K.box(0.84, 0.02, 0.02), mat('#d9c5aa'), 0, 1.02, 0.6, drawer);
    const knob1 = mesh(K.sphere(0.06), pm('#e0a13a', { roughness: 0.3, metalness: 0.4 }), 0, 1.25, 0.62, drawer);
    const knob2 = mesh(K.sphere(0.06), pm('#e0a13a', { roughness: 0.3, metalness: 0.4 }), 0, 0.8, 0.62, drawer);
    D(knob2, { kinds: ['hide', 'color'], minLv: 3 });
    blob(root, 1.4, -4.2, 3.4, 1.8, 0.28);
    // 스탠드 + 불빛
    const lamp = group(-0.8, 1.62, -0.25, desk);
    const lampM = pm(pick(r, ['#f6c945', '#ef6f6c', '#5ab1bb']), { roughness: 0.35 });
    mesh(K.cyl(0.25, 0.28, 0.07, 24), lampM, 0, 0.03, 0, lamp);
    const arm = mesh(K.cyl(0.035, 0.035, 0.9, 10), mat('#444'), 0.05, 0.45, 0, lamp);
    arm.rotation.z = -0.15;
    const shadeG = group(0.16, 0.9, 0.05, lamp);
    shadeG.rotation.z = -0.9;
    mesh(K.cone(0.28, 0.4, 24, 1), lampM, 0, 0, 0, shadeG).material.side = T.DoubleSide;
    mesh(K.sphere(0.09), K.glow(0xfff1c1, night ? 6 : 2.5), 0, -0.12, 0, shadeG);
    const lampLight = ctx.light(new T.PointLight(0xffd9a0, night ? 14 : 4, 6, 1.6));
    lampLight.position.set(0.9, 2.3, -4.1);
    D(lamp, { kinds: ['color', 'hide', 'mirror'] });
    // 책상 위: 책 더미, 연필꽂이, 지구본, 머그
    const bstack = group(0.25, 1.62, -0.2, desk);
    [['#3b6ea5', 0.9], ['#e76f51', 0.8], ['#2a9d8f', 0.85]].forEach(([c, w], i) => {
      const b = mesh(rbox(w, 0.13, 0.62, 0.02), pm(c, { roughness: 0.6 }), (i - 1) * 0.04, 0.07 + i * 0.135, 0, bstack);
      b.rotation.y = (i - 1) * 0.12;
    });
    D(bstack, { kinds: ['hide', 'color'] });
    const cup = group(-0.35, 1.62, 0.3, desk);
    mesh(K.cyl(0.12, 0.11, 0.3, 16), pm('#7cc6a4', { roughness: 0.4 }), 0, 0.15, 0, cup);
    ['#e63946', '#ffb703', '#219ebc'].forEach((c, i) => {
      const pen = mesh(K.cyl(0.02, 0.02, 0.5, 6), mat(c), (i - 1) * 0.05, 0.4, (i % 2) * 0.04, cup);
      pen.rotation.z = (i - 1) * 0.2;
    });
    D(cup, { kinds: ['hide', 'color'] });
    const globe = group(0.95, 1.62, -0.25, desk);
    mesh(K.cyl(0.14, 0.18, 0.06, 20), mat('#6b4a32'), 0, 0.03, 0, globe);
    mesh(K.cyl(0.02, 0.02, 0.3, 8), mat('#6b4a32'), 0, 0.18, 0, globe);
    const earthT = tex(128, 64, (c, W, H) => {
      c.fillStyle = '#4aa3df'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#6cc070';
      [[20, 20, 14, 10], [30, 42, 8, 12], [70, 18, 20, 9], [80, 40, 10, 10], [108, 46, 8, 6]].forEach(([x, y, a, b]) => { c.beginPath(); c.ellipse(x, y, a, b, 0.4, 0, 7); c.fill(); });
    });
    const eM = new T.MeshStandardMaterial({ map: earthT, roughness: 0.4 });
    eM.userData.paint = true;
    const earth = mesh(K.sphere(0.3, 28, 18), eM, 0, 0.55, 0, globe);
    earth.rotation.z = 0.4;
    D(globe, { kinds: ['hide', 'color', 'grow'] });
    const mug = P.mug(desk, 0.2, 1.62, 0.35, pick(r, ['#ffffff', '#ffcad4', '#bde0fe']), 0.4);
    D(mug, { kinds: ['hide', 'color', 'mirror'] });
    const note = mesh(rbox(0.5, 0.02, 0.36, 0.01), pm('#fff27a', { roughness: 0.9 }), -0.2, 1.63, 0.3, desk);
    note.rotation.y = -0.3;
    D(note, { kinds: ['show'], minLv: 1 });

    const chair = group(1.2, 0, -3.05, root);
    chair.rotation.y = 0.25;
    const cm = pm(pick(r, ['#ff8a5b', '#6c9bd2', '#8ccf7e']), { roughness: 0.5 });
    mesh(rbox(1.0, 0.14, 0.95, 0.06), cm, 0, 0.95, 0, chair);
    mesh(rbox(1.0, 1.0, 0.12, 0.06), cm, 0, 1.55, 0.45, chair);
    [[-0.4, -0.38], [0.4, -0.38], [-0.4, 0.38], [0.4, 0.38]].forEach(([a, b]) => mesh(rbox(0.09, 0.95, 0.09, 0.03), mat('#8a5a3c'), a, 0.47, b, chair));
    const cushion = mesh(rbox(0.8, 0.12, 0.75, 0.06), pm('#fff1d6', { roughness: 1 }), 0, 1.07, -0.02, chair);
    D(chair, { kinds: ['color', 'turn'], turn: 0.7 });
    D(cushion, { kinds: ['hide', 'color'], minLv: 2 });
    blob(root, 1.2, -3.05, 1.5, 1.4, 0.35, null, chair);

    // ── 책장 (뒷벽 오른쪽)
    const shelfB = group(4.1, 0, -4.45, root);
    const sb = pm(pick(r, ['#ffffff', '#f0dcc4', '#9fc5c9']), { roughness: 0.55 });
    const inner = mat(shade('#f0dcc4', -0.08), { roughness: 0.7 });
    mesh(rbox(1.7, 4.0, 0.1, 0.03), inner, 0, 2.0, -0.42, shelfB);
    const sbParts = [];
    sbParts.push(mesh(rbox(0.12, 4.0, 0.95, 0.03), sb, -0.8, 2.0, 0, shelfB));
    sbParts.push(mesh(rbox(0.12, 4.0, 0.95, 0.03), sb, 0.8, 2.0, 0, shelfB));
    [0.1, 1.05, 2.0, 2.95, 3.95].forEach((y) => sbParts.push(mesh(rbox(1.7, 0.1, 0.95, 0.03), sb, 0, y, 0, shelfB)));
    D(shelfB, { kinds: ['color'], paint: [sbParts[0]] });
    const shelfSet = [];
    [0.15, 1.1, 2.05].forEach((y, i) => {
      const bk = P.books(shelfB, i === 1 ? -0.2 : 0, y, 0.02, i === 1 ? 1.0 : 1.4, r, { h: 0.75 });
      bk.userData.books.forEach((b, j) => { if (j % 3 === 1) D(b, { kinds: ['color', 'hide'], minLv: 2 }); });
      D(bk, { kinds: ['hide'], minLv: 1, group: 'shelf' + i });
      shelfSet.push(bk);
    });
    const piggy = group(0.45, 1.15, 0.05, shelfB);
    const pg = pm('#f7a8b8', { roughness: 0.35 });
    mesh(K.sphere(0.25), pg, 0, 0.25, 0, piggy).scale.set(1.2, 1, 1);
    mesh(K.cyl(0.08, 0.08, 0.08, 14), pg, 0.3, 0.25, 0, piggy).rotation.z = Math.PI / 2;
    [[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.1], [0.12, 0.1]].forEach(([a, b]) => mesh(K.cyl(0.05, 0.05, 0.12, 8), pg, a, 0.06, b, piggy));
    mesh(K.cone(0.06, 0.1, 8), pg, 0.15, 0.48, 0.1, piggy);
    mesh(K.sphere(0.025), mat('#222'), 0.24, 0.32, 0.12, piggy);
    D(piggy, { kinds: ['hide', 'color', 'mirror'] });
    // 맨 위칸: 트로피
    const trophy = group(-0.3, 3.0, 0, shelfB);
    const gold = pm('#f2c14e', { roughness: 0.25, metalness: 0.85 });
    mesh(rbox(0.3, 0.12, 0.3, 0.02), mat('#5a3b28'), 0, 0.06, 0, trophy);
    mesh(K.cyl(0.04, 0.06, 0.2, 10), gold, 0, 0.22, 0, trophy);
    mesh(K.lathe('cupT', [[0, 0], [0.05, 0], [0.18, 0.12], [0.2, 0.32], [0.17, 0.33], [0, 0.18]]), gold, 0, 0.3, 0, trophy);
    D(trophy, { kinds: ['hide', 'color', 'grow'] });
    const dino = group(0.35, 3.0, 0.05, shelfB);
    const dm = pm('#6cc070', { roughness: 0.6 });
    mesh(K.sphere(0.2), dm, 0, 0.22, 0, dino).scale.set(1.3, 0.9, 0.8);
    const neck = mesh(K.capsule(0.07, 0.25), dm, -0.2, 0.42, 0, dino);
    neck.rotation.z = 0.5;
    mesh(K.sphere(0.1), dm, -0.3, 0.58, 0, dino).scale.set(1.3, 1, 1);
    const tail = mesh(K.cone(0.08, 0.35, 10), dm, 0.32, 0.2, 0, dino);
    tail.rotation.z = -1.5;
    [[-0.12, 0.1], [0.12, 0.1], [-0.12, -0.1], [0.12, -0.1]].forEach(([a, b]) => mesh(K.cyl(0.05, 0.05, 0.14, 8), dm, a, 0.07, b, dino));
    mesh(K.sphere(0.02), mat('#222'), -0.36, 0.62, 0.07, dino);
    D(dino, { kinds: ['hide', 'color', 'mirror'] });
    blob(root, 4.1, -4.45, 2.0, 1.3, 0.3);

    // ── 러그
    const rugT = tex(256, 256, (c, W, H) => {
      c.fillStyle = pal.rug[2]; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        c.strokeStyle = i % 2 ? pal.rug[0] : pal.rug[1];
        c.lineWidth = 10;
        c.beginPath(); c.arc(W / 2, H / 2, 118 - i * 20, 0, 7); c.stroke();
      }
      c.fillStyle = pal.rug[1];
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.arc(W / 2 + Math.cos(a) * 20, H / 2 + Math.sin(a) * 20, 5, 0, 7); c.fill(); }
    });
    const rugM = new T.MeshStandardMaterial({ map: rugT, roughness: 1 });
    rugM.userData.paint = true;
    const rug = mesh(K.cyl(2.3, 2.3, 0.05, 48), rugM, 0.6, 0.03, 0.9, root);
    rug.castShadow = false;
    D(rug, { kinds: ['color'] });

    // ── 바닥 장난감
    const cat = P.cat(root, 0.2, 1.4, 0.95, pick(r, ['#f0a24e', '#8d8d8d', '#4a4a4a', '#c98a52']), -0.6, { y: 0.05 });
    D(cat, { kinds: ['hide', 'color', 'mirror'], colors: ['#f0a24e', '#8d8d8d', '#4a4a4a', '#c98a52', '#f5ebe0'] });
    const ball = P.ball(root, 2.3, 2.4, 0.38, pick(r, ['#ff6b6b', '#4dabf7', '#ffd43b']), '#ffffff');
    D(ball, { kinds: ['hide', 'color', 'move'], move: [-1.0, -0.4] });
    const blocks = P.blocks(root, -1.4, 3.3, r, ['#ff6b6b', '#4dabf7', '#ffd43b']);
    D(blocks, { kinds: ['hide'] });
    blocks.userData.items.forEach((b, i) => D(b, { kinds: ['color', 'hide'], minLv: i === 2 ? 0 : 2, group: 'blk' + i }));
    const car = P.car(root, 1.8, 0.2, pick(r, ['#e63946', '#1d7bd1', '#2bb673']), 0.8);
    D(car, { kinds: ['hide', 'color', 'turn'], turn: Math.PI });
    const slip = group(-1.9, 0, 0.6, root);
    slip.rotation.y = 0.4;
    const sm = pm(pick(r, ['#ffb3c1', '#a0c4ff']), { roughness: 1 });
    [-0.22, 0.22].forEach((x, i) => {
      const s = mesh(rbox(0.32, 0.14, 0.72, 0.07), sm, x, 0.07, i * 0.12, slip);
      mesh(K.sphere(0.08), mat('#fff'), x, 0.16, 0.2 + i * 0.12, slip);
    });
    D(slip, { kinds: ['hide', 'color', 'turn'], turn: 0.9 });
    blob(root, -1.9, 0.7, 1.2, 1.2, 0.3, null, slip);

    // 장난감 상자 (왼쪽 앞)
    const box = group(-4.0, 0, 3.6, root);
    const bm = pm(pick(r, ['#ffd166', '#06d6a0', '#ef476f']), { roughness: 0.6 });
    mesh(rbox(1.6, 1.0, 1.2, 0.08), bm, 0, 0.5, 0, box);
    mesh(rbox(1.64, 0.1, 1.24, 0.04), mat('#ffffff', { roughness: 0.5 }), 0, 0.95, 0, box);
    const lid = mesh(rbox(1.64, 0.14, 1.24, 0.06), bm, 0, 1.08, -0.5, box);
    lid.rotation.x = -1.2;
    lid.position.z = -0.55; lid.position.y = 1.5;
    const star = mesh(K.sphere(0.2, 16, 12), pm('#ffffff'), 0.2, 0.55, 0.61, box);
    star.scale.z = 0.2;
    D(star, { kinds: ['hide', 'color'], minLv: 1 });
    const duck = group(-0.3, 0.95, 0, box);
    const yl = pm('#ffd43b', { roughness: 0.3 });
    mesh(K.sphere(0.2), yl, 0, 0.18, 0, duck).scale.set(1.2, 0.9, 1);
    mesh(K.sphere(0.13), yl, 0.12, 0.4, 0, duck);
    mesh(K.cone(0.05, 0.12, 8), mat('#ff8c42'), 0.28, 0.38, 0, duck).rotation.z = -Math.PI / 2;
    D(duck, { kinds: ['hide', 'color', 'mirror'] });
    const bat = mesh(K.cyl(0.05, 0.08, 1.1, 10), pm('#d4a373'), 0.4, 1.2, 0.1, box);
    bat.rotation.set(0.3, 0, -0.35);
    D(bat, { kinds: ['hide', 'color'] });
    D(box, { kinds: ['color'] });
    blob(root, -4.0, 3.6, 2.2, 1.8, 0.35, null, box);

    // 화분 (책장 옆)
    const plant = P.plant(root, 2.75, -2.5, 0.95, r, { pot: pick(r, ['#d9774c', '#f1f1f1', '#6d9dc5']) });
    D(plant, { kinds: ['hide', 'color', 'grow'], grow: 1.3 });

    // 추가로 생기는 것
    const sock = group(3.3, 0, 1.0, root);
    sock.rotation.y = -0.6;
    const skm = pm('#ff70a6', { roughness: 1 });
    mesh(rbox(0.22, 0.08, 0.6, 0.04), skm, 0, 0.04, 0, sock);
    mesh(rbox(0.22, 0.08, 0.3, 0.04), skm, 0.12, 0.04, 0.3, sock).rotation.y = 0.8;
    D(sock, { kinds: ['show'] });
    const book2 = mesh(rbox(0.7, 0.12, 0.5, 0.03), pm('#8338ec'), -2.4, 0.06, 2.2, root);
    book2.rotation.y = 0.5;
    D(book2, { kinds: ['show'] });
    const paper = mesh(rbox(0.5, 0.01, 0.36, 0.005), pm('#ffffff'), 3.4, 0.02, -1.0, root);
    paper.rotation.y = 0.3;
    D(paper, { kinds: ['show'], minLv: 2 });

    if (night) {
      ctx.sun.intensity = 0.55;
      ctx.sun.color.set(0x9aa8ff);
      ctx.hemi.intensity = 0.3;
      ctx.env = 0.25;
      ctx.exposure(1.1);
      const moon = ctx.light(new T.PointLight(0xfff0c8, 18, 12, 1.4));
      moon.position.set(-2, 5.6, -2);
    }
    return { view: { fit: 6.3, ly: 2.5 } };
  };

  function frameAlt(f, pics, cur) {
    let saved = null;
    return function (on, d) {
      const p = f.children.find((m) => m.material && m.material.map && m.material.userData.nopaint);
      if (on) {
        saved = p.material.map;
        const other = pics.filter((x) => x !== cur);
        const name = other[(d.p || 0) % other.length];
        const img = saved.image;
        p.material.map = K.tex(img.width, img.height, P.pics[name]);
      } else {
        p.material.map.dispose();
        p.material.map = saved;
      }
      p.material.needsUpdate = true;
    };
  }
})();
