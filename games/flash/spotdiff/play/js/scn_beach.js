// 장면 6: 바닷가
(function () {
  const T = THREE;
  const SCN = (window.SCN = window.SCN || {});
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  SCN.beach = function (ctx) {
    const r = ctx.r, root = ctx.root, D = ctx.D;
    const eve = ctx.opt.night;
    ctx.bg(eve ? '#ffb38a' : '#aee4f5', eve ? '#6a4c93' : '#fff3dc');
    const sand = '#f3d9a4';
    // 모래 윗면 + 물가
    const sandT = tex(512, 512, (c, W, H) => {
      c.fillStyle = sand; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 1400; i++) { c.fillStyle = i % 2 ? 'rgba(160,110,50,0.12)' : 'rgba(255,255,255,0.25)'; c.fillRect(r() * W, r() * H, 2, 2); }
      for (let i = 0; i < 12; i++) { c.strokeStyle = 'rgba(180,130,70,0.12)'; c.lineWidth = 3; c.beginPath(); const y = r() * H; c.moveTo(0, y); c.bezierCurveTo(W * 0.3, y + 10, W * 0.6, y - 10, W, y + 4); c.stroke(); }
    }, [1, 1]);
    P.island(ctx, { topTex: sandT, lip: '#e9c98a', layers: ['#e2bf85', '#c9a06a', '#a47a4c', '#7a5636'], under: '#7a5636' });
    // 바다: 오른쪽 앞 절반 (x + z > 0.8)
    const seaT = tex(256, 256, (c, W, H) => {
      const gr = c.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, eve ? '#f7a072' : '#7fdbe8');
      gr.addColorStop(0.4, eve ? '#9d6fb6' : '#2fb6d8');
      gr.addColorStop(1, eve ? '#4b3b8f' : '#1a7fc1');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 4, x + 16, y); c.stroke(); }
    });
    const S = 5.15;
    const shore = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      // 물가 곡선: (S, -0.5) → (-0.5, S)
      const x = S - t * (S + 2.6) + Math.sin(t * Math.PI * 3) * 0.4;
      const z = -2.6 + t * (S + 2.6) + Math.sin(t * Math.PI * 2) * 0.35;
      shore.push([x, z]);
    }
    const sh = new T.Shape();
    sh.moveTo(S, -2.6);
    shore.forEach(([x, z]) => sh.lineTo(x, z));
    sh.lineTo(S, S);
    sh.lineTo(S, -2.6);
    const seaGeo = new T.ShapeGeometry(sh, 32);
    // ShapeGeometry 는 XY 판: x→x, y→z 로 눕힌다
    const seaM = new T.MeshStandardMaterial({ map: seaT, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.93, side: T.DoubleSide });
    const sea = new T.Mesh(seaGeo, seaM);
    sea.rotation.x = Math.PI / 2;
    sea.position.y = 0.06;
    sea.receiveShadow = true;
    root.add(sea);
    // UV 를 위치로
    const uv = seaGeo.attributes.uv, pos = seaGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + S) / (2 * S), (pos.getY(i) + S) / (2 * S));
    // 물거품 줄
    const foamPts = shore.map(([x, z]) => new T.Vector3(x - 0.08, 0.08, z - 0.08));
    const foam = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(foamPts), 60, 0.07, 6), mat('#ffffff', { roughness: 0.6 }));
    foam.scale.y = 0.3;
    foam.position.y = 0.05;
    root.add(foam);
    // 섬 옆면 물 (바다가 닿는 두 면)
    const sideSea = mat(eve ? '#6d5ba8' : '#2aa7d1', { roughness: 0.2, transparent: true, opacity: 0.85 });
    mesh(K.box(7.8, 1.3, 0.1), sideSea, 1.3, -0.6, 5.26, root).castShadow = false;
    mesh(K.box(0.1, 1.3, 7.8), sideSea, 5.26, -0.6, 1.3, root).castShadow = false;

    // ── 야자수 (뒤쪽)
    const palms = [[-3.9, -3.8, 1.2, 0.2], [-1.8, -4.3, 1.0, -0.2], [-4.3, -1.3, 0.9, 0.4]];
    palms.forEach(([x, z, s2, lean], i) => {
      const p = palm(root, x, z, s2, lean, r);
      D(p, { kinds: ['hide', 'grow', 'color'], grow: 0.75, colors: ['#52b788', '#2d6a4f', '#95d5b2', '#e9c46a'], group: 'palm' + i });
      D(p.userData.coco, { kinds: ['hide'], minLv: 1 });
    });

    // ── 파라솔 + 선베드
    const para = group(-1.4, 0, -1.0, root);
    mesh(K.cyl(0.04, 0.04, 2.8, 8), mat('#f8f9fa'), 0, 1.4, 0, para);
    const pTex = tex(256, 16, (c, W, H) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : pick(K.rng(r() * 1000), ['#ff595e', '#1982c4', '#ffca3a', '#8ac926']); c.fillRect((i * W) / 8, 0, W / 8, H); } });
    const pM = new T.MeshStandardMaterial({ map: pTex, roughness: 0.7, side: T.DoubleSide });
    pM.userData.paint = true;
    const canopy = mesh(new T.ConeGeometry(1.6, 0.6, 8, 1, true), pM, 0, 2.75, 0, para);
    mesh(K.sphere(0.08, 8, 6), mat('#f8f9fa'), 0, 3.08, 0, para);
    para.rotation.z = 0.08;
    blob(root, -1.2, -1.0, 2.8, 2.8, 0.25, null, para);
    D(para, { kinds: ['color', 'hide'] });
    [[-2.3, -0.2, 0.9], [-0.9, 0.6, 0.6]].forEach(([x, z, ry], i) => {
      const bed = group(x, 0, z, root);
      bed.rotation.y = ry;
      const bm = pm(pick(r, ['#ffffff', '#ffadad', '#a0c4ff', '#fdffb6']), { roughness: 0.6 });
      mesh(rbox(0.7, 0.08, 1.4, 0.03), bm, 0, 0.35, 0.1, bed);
      const back = mesh(rbox(0.7, 0.08, 0.7, 0.03), bm, 0, 0.55, -0.75, bed);
      back.rotation.x = 0.6;
      [[-0.3, 0.7], [0.3, 0.7], [-0.3, -0.5], [0.3, -0.5]].forEach(([a, b]) => mesh(K.cyl(0.025, 0.025, 0.35, 5), mat('#adb5bd'), a, 0.17, b, bed));
      blob(root, x, z, 1.0, 1.7, 0.3, null, bed);
      D(bed, { kinds: ['color', 'hide', 'turn'], turn: 0.9, group: 'bed' });
    });
    const towel = mesh(rbox(0.8, 0.02, 1.5, 0.01), pm(pick(r, ['#ff006e', '#3a86ff', '#ffbe0b'])), -2.3, 0.02, 1.9, root);
    towel.rotation.y = 0.2;
    D(towel, { kinds: ['color', 'hide'] });
    const glasses = group(-2.3, 0.05, 1.5, root);
    [-0.08, 0.08].forEach((x) => mesh(K.cyl(0.06, 0.06, 0.02, 12), mat('#222', { roughness: 0.1 }), x, 0, 0, glasses));
    D(glasses, { kinds: ['show'], minLv: 1 });

    // 아이스박스 + 음료
    const cool = group(-3.4, 0, 0.9, root);
    cool.rotation.y = 0.4;
    const cm = pm(pick(r, ['#e63946', '#3a86ff', '#2a9d8f']), { roughness: 0.5 });
    mesh(rbox(0.9, 0.55, 0.6, 0.08), cm, 0, 0.28, 0, cool);
    mesh(rbox(0.94, 0.12, 0.64, 0.05), mat('#ffffff'), 0, 0.6, 0, cool);
    mesh(K.torus(0.18, 0.025, Math.PI), mat('#ffffff'), 0, 0.66, 0, cool);
    blob(root, -3.4, 0.9, 1.2, 1.0, 0.35, null, cool);
    D(cool, { kinds: ['color', 'hide'] });
    const can = group(-3.0, 0, 1.6, root);
    mesh(K.cyl(0.08, 0.08, 0.24, 12), pm(pick(r, ['#ff595e', '#8ac926', '#1982c4'])), 0, 0.12, 0, can);
    D(can, { kinds: ['hide', 'color'], minLv: 1 });

    // 모래성 + 양동이 + 삽
    const castle = group(-1.2, 0, 2.4, root);
    const sm = pm('#e9c98a', { roughness: 1 });
    mesh(rbox(1.2, 0.35, 1.0, 0.05), sm, 0, 0.17, 0, castle);
    [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]].forEach(([a, b]) => {
      mesh(K.cyl(0.18, 0.2, 0.7, 10), sm, a, 0.35, b, castle);
      mesh(K.cone(0.2, 0.25, 10), sm, a, 0.82, b, castle);
    });
    const tower = mesh(K.cyl(0.25, 0.3, 0.8, 12), sm, 0, 0.75, 0, castle);
    D(tower, { kinds: ['hide', 'grow'], grow: 1.4 });
    const cflag = group(0, 1.15, 0, castle);
    mesh(K.cyl(0.012, 0.012, 0.5, 4), mat('#333'), 0, 0.25, 0, cflag);
    mesh(new T.PlaneGeometry(0.25, 0.16), pm(pick(r, ['#e63946', '#1982c4', '#ffca3a']), { side: T.DoubleSide }), 0.13, 0.42, 0, cflag);
    D(cflag, { kinds: ['hide', 'color', 'mirror'] });
    blob(root, -1.2, 2.4, 1.8, 1.5, 0.3, null, castle);
    const pail = group(-2.6, 0, 3.3, root);
    const plM = pm(pick(r, ['#ff006e', '#ffbe0b', '#8338ec']), { roughness: 0.4 });
    mesh(K.cyl(0.24, 0.18, 0.4, 16), plM, 0, 0.2, 0, pail);
    mesh(K.torus(0.23, 0.015, Math.PI), mat('#333'), 0, 0.4, 0, pail);
    blob(root, -2.6, 3.3, 0.7, 0.7, 0.35, null, pail);
    D(pail, { kinds: ['hide', 'color', 'move'], move: [0.4, 0.6] });
    const shovel = group(-1.5, 0.05, 3.5, root);
    shovel.rotation.y = 0.8;
    const svM = pm(pick(r, ['#3a86ff', '#06d6a0']), { roughness: 0.4 });
    mesh(K.cyl(0.03, 0.03, 0.5, 6), svM, 0, 0, 0, shovel).rotation.z = Math.PI / 2;
    mesh(rbox(0.25, 0.03, 0.2, 0.02), svM, 0.35, 0, 0, shovel);
    D(shovel, { kinds: ['hide', 'color', 'turn'], turn: 1.4 });

    // 비치볼
    const ball = P.ball(root, 1.0, 0.6, 0.32, pick(r, ['#ff595e', '#1982c4', '#8ac926']), '#ffca3a');
    D(ball, { kinds: ['hide', 'color', 'move'], move: [-0.8, -0.6] });
    // 서핑보드 꽂힌 것
    const board = group(-3.4, 0, -2.4, root);
    board.rotation.set(0.1, 0.7, 0.05);
    const bdM = pm(pick(r, ['#ff9f1c', '#2ec4b6', '#e71d36']), { roughness: 0.3 });
    mesh(K.sphere(0.5, 20, 12), bdM, 0, 1.0, 0, board).scale.set(0.9, 2.2, 0.12);
    mesh(K.box(0.06, 1.8, 0.07), mat('#ffffff'), 0, 1.0, 0.03, board);
    blob(root, -3.4, -2.4, 1.0, 0.6, 0.35, null, board);
    D(board, { kinds: ['color', 'hide'] });

    // 게·불가사리·조개
    const crab = group(0.3, 0.02, 0.9, root);
    crab.rotation.y = -0.5;
    const crM = pm('#ef476f', { roughness: 0.5 });
    mesh(K.sphere(0.22, 16, 10), crM, 0, 0.14, 0, crab).scale.set(1.3, 0.55, 1);
    [-1, 1].forEach((sd) => {
      mesh(K.sphere(0.08, 10, 8), crM, sd * 0.3, 0.2, 0.2, crab).scale.set(1, 0.8, 1.2);
      mesh(K.sphere(0.035, 6, 4), mat('#fff'), sd * 0.08, 0.3, 0.14, crab);
      mesh(K.sphere(0.018, 6, 4), mat('#222'), sd * 0.08, 0.31, 0.17, crab);
      for (let k = 0; k < 3; k++) { const l = mesh(K.cyl(0.02, 0.02, 0.25, 4), crM, sd * 0.3, 0.07, -0.1 + k * 0.1, crab); l.rotation.z = sd * 1.2; }
    });
    blob(root, 0.3, 0.9, 0.8, 0.6, 0.35, null, crab);
    D(crab, { kinds: ['hide', 'color', 'move'], move: [0.8, -0.9] });
    const starT = tex(64, 64, (c) => { c.fillStyle = '#ffffff'; K.star(c, 32, 34, 30, 12); });
    [[-3.4, 4.1, '#ff8c42'], [1.5, -0.8, '#f15bb5'], [-3.9, 2.4, '#ffbe0b']].forEach(([x, z, col], i) => {
      const st = new T.Mesh(new T.PlaneGeometry(0.5, 0.5), new T.MeshStandardMaterial({ map: starT, color: col, transparent: true, alphaTest: 0.5, roughness: 0.7 }));
      st.material.userData.paint = true;
      st.rotation.set(-Math.PI / 2, 0, i);
      st.position.set(x, 0.03, z);
      st.castShadow = true;
      root.add(st);
      D(st, { kinds: i === 2 ? ['show'] : ['hide', 'color'], group: 'star' + i, minLv: i ? 1 : 0 });
    });
    [[-0.2, 0.4], [2.2, -2.9], [-3.4, 3.9]].forEach(([x, z], i) => {
      const shell = group(x, 0, z, root);
      shell.rotation.y = i * 2;
      mesh(K.sphere(0.13, 12, 8, 0, Math.PI), pm(['#ffd6e0', '#fff1e6', '#e0c3fc'][i], { roughness: 0.4 }), 0, 0.02, 0, shell).scale.set(1, 0.5, 1);
      D(shell, { kinds: ['hide', 'color'], group: 'shell' + i, minLv: 2 });
    });

    // 인명구조 망대 (오른쪽 뒤)
    const guard = group(2.6, 0, -3.4, root);
    guard.rotation.y = -0.6;
    const gw = mat('#f8f9fa', { roughness: 0.6 });
    [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]].forEach(([a, b]) => { const l = mesh(K.cyl(0.07, 0.07, 2.2, 6), gw, a, 1.1, b, guard); });
    const gM = pm(pick(r, ['#e63946', '#ffb703', '#2a9d8f']), { roughness: 0.5 });
    mesh(rbox(1.6, 0.12, 1.4, 0.03), gw, 0, 2.2, 0, guard);
    mesh(rbox(1.4, 1.0, 1.2, 0.05), gM, 0, 2.8, 0, guard);
    mesh(rbox(1.0, 0.5, 0.05, 0.03), mat('#1d3557', { roughness: 0.1 }), 0, 2.9, 0.61, guard);
    mesh(K.cone(1.1, 0.5, 4), mat('#f8f9fa'), 0, 3.55, 0, guard).rotation.y = Math.PI / 4;
    for (let k = 0; k < 4; k++) mesh(rbox(0.6, 0.06, 0.2, 0.02), gw, 0, 0.4 + k * 0.45, 0.85 + k * 0.08, guard).rotation.x = -0.4;
    blob(root, 2.6, -3.4, 2.2, 2.0, 0.3, null, guard);
    D(guard, { kinds: ['color'] });
    const ring = group(0.75, 1.7, 0.6, guard);
    const rgM = pm('#ff6b35', { roughness: 0.5 });
    mesh(K.torus(0.24, 0.07), rgM, 0, 0, 0, ring);
    D(ring, { kinds: ['hide', 'color'] });
    const gflag = group(-0.7, 3.4, -0.6, guard);
    mesh(K.cyl(0.02, 0.02, 1.2, 4), mat('#333'), 0, 0.6, 0, gflag);
    mesh(new T.PlaneGeometry(0.5, 0.3), pm('#ffd60a', { side: T.DoubleSide }), 0.26, 1.0, 0, gflag);
    D(gflag, { kinds: ['hide', 'color'] });

    // ── 바다 위: 튜브, 부표, 배
    const tube = group(4.2, 0.1, 4.0, root);
    const tbT = tex(128, 16, (c, W, H) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#ff4d6d'; c.fillRect((i * W) / 8, 0, W / 8, H); } });
    const tbM = new T.MeshStandardMaterial({ map: tbT, roughness: 0.4 });
    tbM.userData.paint = true;
    mesh(K.torus(0.4, 0.15), tbM, 0, 0, 0, tube).rotation.x = Math.PI / 2;
    D(tube, { kinds: ["hide", "color", "move"], move: [-0.9, 0.3] });
    const buoyA = buoy(root, 4.6, 1.2, pick(r, ['#ff006e', '#ffbe0b']));
    D(buoyA, { kinds: ['hide', 'color'] });
    const buoyB = buoy(root, 1.2, 4.3, '#ff006e');
    D(buoyB, { kinds: ['show'] });
    const boat = group(3.6, 0.05, 3.0, root);
    boat.rotation.y = 0.9;
    const hull = pm(pick(r, ['#ffffff', '#ffd166', '#90e0ef']), { roughness: 0.5 });
    const hs = new T.Shape();
    hs.moveTo(-0.9, 0.35); hs.lineTo(0.9, 0.35); hs.lineTo(0.6, -0.1); hs.lineTo(-0.7, -0.1); hs.lineTo(-0.9, 0.35);
    const hg = new T.ExtrudeGeometry(hs, { depth: 0.8, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
    mesh(hg, hull, 0, 0, -0.4, boat);
    mesh(K.box(1.7, 0.05, 0.7), mat('#b08968'), 0, 0.3, 0, boat);
    const stripe = mesh(K.box(1.85, 0.06, 0.86), pm('#e63946'), 0, 0.22, 0, boat);
    const mast = group(0.1, 0.3, 0, boat);
    mesh(K.cyl(0.03, 0.03, 1.8, 6), mat('#8d6346'), 0, 0.9, 0, mast);
    const sailS = new T.Shape();
    sailS.moveTo(0, 0); sailS.lineTo(0, 1.5); sailS.lineTo(0.9, 0.05);
    mesh(new T.ShapeGeometry(sailS), pm('#fefae0', { side: T.DoubleSide }), 0.04, 0.2, 0, mast);
    D(mast, { kinds: ['mirror', 'hide', 'color'] });
    D(boat, { kinds: ['color'], paint: [stripe] });
    // 홍학 튜브
    const dol = group(1.9, 0.08, 3.6, root);
    dol.rotation.y = 0.8;
    const dM = pm('#ff8fab', { roughness: 0.35 });
    mesh(K.torus(0.42, 0.16), dM, 0, 0.05, 0, dol).rotation.x = Math.PI / 2;
    const neck = mesh(K.torus(0.28, 0.07, Math.PI * 1.1), dM, 0.36, 0.45, 0, dol);
    neck.rotation.z = -Math.PI * 0.35;
    const fh = group(0.2, 0.9, 0, dol);
    mesh(K.sphere(0.13, 14, 10), dM, 0, 0, 0, fh);
    mesh(K.cone(0.05, 0.2, 8), mat('#222'), 0.18, -0.06, 0, fh).rotation.z = -Math.PI / 2 - 0.5;
    [-1, 1].forEach((sd) => mesh(K.sphere(0.025, 6, 4), mat('#222'), 0.07, 0.04, sd * 0.1, fh));
    mesh(K.sphere(0.18, 12, 8), dM, -0.42, 0.25, 0, dol).scale.set(1.3, 0.5, 0.6);
    D(dol, { kinds: ['hide', 'mirror', 'color'], colors: ['#ff8fab', '#ffd166', '#8ecae6'] });
    const paddle = group(3.5, 0.08, 0.1, root);
    paddle.rotation.y = -0.8;
    const pbM = pm(pick(r, ['#ffbe0b', '#fb5607', '#8338ec']), { roughness: 0.3 });
    mesh(K.sphere(0.5, 18, 10), pbM, 0, 0, 0, paddle).scale.set(0.5, 0.06, 1.8);
    D(paddle, { kinds: ['hide', 'color', 'turn'], turn: 1.2 });
    // 갈매기 (하늘 위)
    const gull = group(0.8, 4.4, -1.0, root);
    const gm = pm('#ffffff', { roughness: 0.7 });
    mesh(K.sphere(0.15, 12, 8), gm, 0, 0, 0, gull).scale.set(1.8, 0.8, 0.8);
    [-1, 1].forEach((sd) => { const w = mesh(K.box(0.12, 0.03, 0.6), gm, 0, 0.05, sd * 0.3, gull); w.rotation.x = sd * -0.35; });
    mesh(K.cone(0.04, 0.12, 6), mat('#ffb703'), 0.3, 0, 0, gull).rotation.z = -Math.PI / 2;
    D(gull, { kinds: ['hide', 'mirror'] });
    const gull2 = gull.clone();
    gull2.position.set(-2.4, 4.9, -2.0);
    gull2.scale.setScalar(0.8);
    root.add(gull2);
    D(gull2, { kinds: ['show'] });
    // 바위
    [[4.2, -3.9, 0.9], [-4.4, 3.9, 0.7]].forEach(([x, z, s2], i) => D(P.rock(root, x, z, s2, '#8d99ae'), { kinds: ['hide', 'color'], group: 'rk' + i }));
    const sign = group(-4.3, 0, 2.2, root);
    sign.rotation.y = 0.8;
    mesh(K.cyl(0.05, 0.05, 1.4, 6), mat('#8d6346'), 0, 0.7, 0, sign);
    mesh(rbox(0.9, 0.5, 0.06, 0.03), pm(pick(r, ['#2a9d8f', '#e76f51'])), 0, 1.3, 0.04, sign);
    mesh(K.box(0.6, 0.06, 0.01), mat('#fff'), 0, 1.36, 0.08, sign);
    mesh(K.box(0.45, 0.06, 0.01), mat('#fff'), 0, 1.22, 0.08, sign);
    blob(root, -4.3, 2.2, 0.6, 0.6, 0.35, null, sign);
    D(sign, { kinds: ['hide', 'color', 'mirror'] });

    if (eve) {
      ctx.sun.intensity = 2.4;
      ctx.sun.color.set(0xffa36c);
      ctx.sun.position.set(12, 6, 2);
      ctx.hemi.intensity = 0.45;
      ctx.hemi.color.set(0xffc2a8);
      ctx.env = 0.5;
    } else {
      ctx.sun.intensity = 3.4;
      ctx.hemi.intensity = 0.8;
    }
    return { view: { fit: 6.4, ly: 0.6 } };
  };

  function palm(parent, x, z, s, lean, r) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    const bark = mat('#a47148', { roughness: 0.9 });
    let px = 0, py = 0;
    for (let i = 0; i < 7; i++) {
      const seg = mesh(K.cyl(0.13 - i * 0.008, 0.16 - i * 0.008, 0.52, 8), i % 2 ? bark : mat('#8d5f3a', { roughness: 0.9 }), px, py + 0.26, 0, g);
      seg.rotation.z = -lean * (i / 6);
      px += Math.sin(lean * (i / 6)) * 0.5;
      py += 0.5;
    }
    const top = group(px, py, 0, g);
    const leaf = pm('#40916c', { roughness: 0.7, side: T.DoubleSide });
    for (let k = 0; k < 7; k++) {
      const f = group(0, 0, 0, top);
      f.rotation.y = (k / 7) * Math.PI * 2 + r() * 0.3;
      const fr = mesh(K.sphere(0.5, 12, 6), leaf, 0.7, -0.15, 0, f);
      fr.scale.set(1.5, 0.1, 0.35);
      fr.rotation.z = -0.35;
    }
    const coco = group(0.1, -0.15, 0.05, top);
    [[0, 0], [0.18, 0.1], [0.05, -0.18]].forEach(([a, b]) => mesh(K.sphere(0.12, 10, 8), mat('#6f4518'), a, 0, b, coco));
    g.userData.coco = coco;
    K.blob(parent, x + px * s * 0.6, z, 2.4 * s, 2.4 * s, 0.3, null, g);
    return g;
  }

  function buoy(parent, x, z, col) {
    const g = group(x, 0.05, z, parent);
    const m = pm(col, { roughness: 0.4 });
    mesh(K.sphere(0.25, 16, 10), m, 0, 0.1, 0, g).scale.y = 0.8;
    mesh(K.cyl(0.04, 0.06, 0.5, 8), mat('#ffffff'), 0, 0.45, 0, g);
    mesh(K.sphere(0.06, 8, 6), K.glow(0xfff3b0, 1.5), 0, 0.72, 0, g);
    return g;
  }
})();
