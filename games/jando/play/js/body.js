// 잔도공 몸 — 베를레 점 14개 + 막대. 자세(목표점)로 끌어당기되 늦게 따라와서 흔들림·무게가 생긴다
(function () {
  const P = PHYS;
  const pts = {}, bones = [];
  const REST = {
    head: [0, 1.70, 0.02], neck: [0, 1.53, 0], chest: [0, 1.36, 0], hip: [0, 0.98, 0],
    kneeL: [-0.11, 0.53, 0.03], footL: [-0.12, 0.07, 0.02], kneeR: [0.11, 0.53, 0.03], footR: [0.12, 0.07, 0.02],
    shL: [-0.21, 1.43, 0], shR: [0.21, 1.43, 0], elbowL: [-0.29, 1.15, -0.02], handL: [-0.33, 0.88, 0.04], elbowR: [0.29, 1.15, -0.02], handR: [0.33, 0.88, 0.04],
  };
  // 주인공 모델이 있으면 막대 길이를 모델 관절에 맞춘다 (팔은 내린 자세로)
  const HJ = window.HERO_J;
  if (HJ) {
    const g = n => HJ[n], len3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const ua = len3(g('shoulder.L'), g('elbow.L')), fa = len3(g('elbow.L'), g('wrist.L')) + 0.06;
    Object.assign(REST, { hip: [0, g('hips')[1], 0], chest: [0, g('chest')[1], 0], neck: [0, g('neck')[1], 0], head: [0, g('head')[1] + 0.09, 0.02] });
    for (const [s, sg] of [['L', 1], ['R', -1]]) {
      const sh = g('shoulder.' + s); REST['sh' + s] = [sg * Math.abs(sh[0]) * -1, sh[1], 0];
      REST['elbow' + s] = [REST['sh' + s][0], sh[1] - ua, 0]; REST['hand' + s] = [REST['sh' + s][0], sh[1] - ua - fa, 0.02];
      const k = g('knee.' + s), a = g('ankle.' + s), hj = g('hipj.' + s);
      REST['knee' + s] = [-sg * Math.abs(hj[0]) * 0.9, k[1], 0.03]; REST['foot' + s] = [-sg * Math.abs(hj[0]) * 0.9, a[1], 0.02];
    }
  }
  // 옛 캡슐 몸 높이 → 모델 높이 (걷기 자세는 발 기준, 매달림은 엉덩이 기준)
  // 모델 관절에서 계산한다 (모델을 바꿔도 맞게)
  const hy = n => HJ[n][1];
  const MAPY = HJ ? [[0, 0], [0.07, hy('ankle.L')], [0.53, hy('knee.L')], [0.97, hy('hips')], [1.35, hy('chest')], [1.42, hy('shoulder.L')], [1.52, hy('neck')], [1.69, hy('head') + 0.09], [2.2, hy('head') + 0.55]] : null;
  const LEGK = HJ ? (hy('hips') - hy('ankle.L')) / 0.9 : 1;
  const MAPR = HJ ? [[-1, -LEGK], [0, 0], [0.38, hy('chest') - hy('hips')], [0.45, hy('shoulder.L') - hy('hips')], [0.55, hy('neck') - hy('hips')], [0.72, hy('head') + 0.09 - hy('hips')], [1, hy('head') + 0.37 - hy('hips')]] : null;
  function lerpMap(M, v) { if (!M) return v; if (v <= M[0][0]) return M[0][1] + (v - M[0][0]) * (M[1][1] - M[0][1]) / (M[1][0] - M[0][0]); for (let i = 1; i < M.length; i++) if (v <= M[i][0]) { const a = M[i - 1], b = M[i]; return a[1] + (v - a[0]) / (b[0] - a[0]) * (b[1] - a[1]); } const a = M[M.length - 2], b = M[M.length - 1]; return b[1] + (v - b[0]) * (b[1] - a[1]) / (b[0] - a[0]); }
  let MAPMODE = 0;   // 0 = 발 기준, 1 = 엉덩이 기준
  const MASS = { head: 0.9, neck: 0.8, chest: 2.2, hip: 2.5, kneeL: 0.8, footL: 0.7, kneeR: 0.8, footR: 0.7, shL: 1, shR: 1, elbowL: 0.6, handL: 0.5, elbowR: 0.6, handR: 0.5 };
  for (const n in REST) { const p = P.makePoint(0, 0, 0, MASS[n], 0.07); p.name = n; pts[n] = p; }
  const len = (a, b) => Math.hypot(REST[a][0] - REST[b][0], REST[a][1] - REST[b][1], REST[a][2] - REST[b][2]);
  const B = (a, b, k) => bones.push({ a: pts[a], b: pts[b], len: len(a, b), k: k || 1 });
  B('head', 'neck'); B('neck', 'chest'); B('chest', 'hip'); B('hip', 'kneeL'); B('kneeL', 'footL'); B('hip', 'kneeR'); B('kneeR', 'footR');
  B('shL', 'elbowL'); B('elbowL', 'handL'); B('shR', 'elbowR'); B('elbowR', 'handR'); B('chest', 'shL'); B('chest', 'shR'); B('shL', 'shR'); B('neck', 'shL', 0.6); B('neck', 'shR', 0.6);
  B('head', 'chest', 0.5); B('neck', 'hip', 0.4); B('shL', 'hip', 0.3); B('shR', 'hip', 0.3);

  // ── 자세 ──────────────────────────────────────────
  const O = new THREE.Vector3(), R = new THREE.Vector3(), U = new THREE.Vector3(), F = new THREE.Vector3();
  const tgt = {}; for (const n in REST) tgt[n] = new THREE.Vector3();
  function W(n, lx, ly, lz, raw) {
    if (HJ && !raw) { ly = lerpMap(MAPMODE ? MAPR : MAPY, ly); if (/^(sh|elbow|hand)/.test(n)) lx *= 0.72; }
    tgt[n].copy(O).addScaledVector(R, lx).addScaledVector(U, ly).addScaledVector(F, lz);
  }
  function basis(o, fwd, up) { O.copy(o); F.copy(fwd).normalize(); U.copy(up).normalize(); R.crossVectors(F, U).normalize(); F.crossVectors(U, R).normalize(); }
  const S = { mode: 'walk', k: 0.5, grav: 0, t: 0, built: false, flail: 0 };
  // st: { mode, root, fwd, up, phase, speed, carry, ext, drill, hammer, reel, wallN, look }
  function pose(st) {
    const ph = st.phase || 0, sp = Math.min(1, (st.speed || 0) / 5);
    MAPMODE = st.mode === 'hang' ? 1 : 0;
    if (st.mode === 'walk' || st.mode === 'mantle') {
      basis(st.root, st.fwd, st.up || new THREE.Vector3(0, 1, 0));
      const stride = 0.18 + 0.32 * sp, lift = 0.06 + 0.12 * sp, bob = Math.abs(Math.cos(ph)) * 0.04 * (sp > 0.05 ? 1 : 0);
      const lean = 0.04 + sp * 0.12 + (st.carry ? 0.05 : 0);
      const crouch = st.crouch || 0;
      W('hip', 0, 0.97 - bob - crouch * 0.35, 0);
      W('chest', 0, 1.35 - bob - crouch * 0.42, lean); W('neck', 0, 1.52 - bob - crouch * 0.44, lean * 1.3); W('head', 0, 1.69 - bob - crouch * 0.45, lean * 1.5 + 0.03);
      for (const [s, sg] of [['L', -1], ['R', 1]]) {
        const a = sp > 0.03 ? ph + (s === 'L' ? 0 : Math.PI) : 0;
        const fz = Math.sin(a) * stride, fy = 0.07 + Math.max(0, Math.cos(a)) * lift * (sp > 0.03 ? 1 : 0);
        W('foot' + s, sg * 0.12, fy, fz);
        W('knee' + s, sg * 0.11, 0.52 + fy * 0.5 - crouch * 0.2, fz * 0.5 + 0.08 + crouch * 0.3);
        W('sh' + s, sg * 0.21, 1.42 - bob - crouch * 0.43, lean);
        const sw = -Math.sin(a) * (0.1 + 0.3 * sp);
        W('elbow' + s, sg * 0.28, 1.15 - bob - crouch * 0.4, sw * 0.6 + lean * 0.5);
        W('hand' + s, sg * 0.31, 0.9 - bob - crouch * 0.35, sw + 0.06 + lean * 0.4);
      }
      if (st.carry) {   // 오른 어깨에 판자, 왼손은 앞쪽을 잡는다 / 내밀 때는 두 손으로 밀어낸다
        const e = st.ext || 0;
        // 판자는 머리(삿갓) 위 top+0.1 에 뜨고 내밀수록 e*0.4 내려온다(game.js carriedPose) — 손이 그 판자 밑면을 받친다
        const py = (window.HERO_J ? HERO_J.top[1] + 0.1 : 1.95) - e * 0.4 - 0.06;
        if (e > 0.01) { const fz = 0.4 + Math.min(0.35, e * 0.3); W('elbowR', 0.26, py - 0.3, fz - 0.2); W('handR', 0.2, py, fz); W('elbowL', -0.26, py - 0.3, fz - 0.2); W('handL', -0.2, py, fz); }
        else { W('elbowR', 0.34, py - 0.3, 0.1); W('handR', 0.28, py, 0.22); W('elbowL', -0.34, py - 0.3, 0.1); W('handL', -0.28, py, 0.22); }
      }
      if (st.drill) { const dy = st.drillY || 1.0; W('elbowR', 0.16, Math.max(0.5, dy + 0.05), 0.25, 1); W('handR', 0.08, dy, 0.42, 1); W('elbowL', -0.1, Math.max(0.5, dy + 0.08), 0.25, 1); W('handL', 0.0, dy + 0.05, 0.36, 1); }
      if (st.hammer !== undefined && st.hammer >= 0) { const h = st.hammer; const up = 1 - Math.min(1, h * 3); W('elbowR', 0.25, 1.3 + up * 0.25, 0.25); W('handR', 0.2, 1.25 + up * 0.55, 0.45 - up * 0.2); }
    } else if (st.mode === 'hang') {
      // root = 하네스(엉덩이). 벽을 보고, 줄 쪽으로 몸이 서고, 발은 벽을 딛는다
      const n = st.wallN;   // 벽에서 바깥
      const up = st.up.clone().addScaledVector(n, 0.25).normalize();
      basis(st.root, n.clone().negate(), up);
      const wd = st.wallDist === undefined ? 0.6 : st.wallDist;   // 엉덩이 ~ 벽 거리
      const reach = Math.min(0.85, Math.max(0.25, wd - 0.05));
      W('hip', 0, 0, 0);
      W('chest', 0, 0.38, 0.04); W('neck', 0, 0.55, 0.06); W('head', 0, 0.72, 0.1);
      const ph2 = st.phase || 0, mv = st.speed || 0;
      for (const [s, sg] of [['L', -1], ['R', 1]]) {
        const a = ph2 + (s === 'L' ? 0 : Math.PI), step = Math.sin(a) * 0.12 * Math.min(1, mv * 2);
        W('foot' + s, sg * 0.16 + step * 0.6, -0.42 + Math.max(0, Math.cos(a)) * 0.08 * Math.min(1, mv * 2), reach);
        W('knee' + s, sg * 0.15, -0.08, reach * 0.55 + 0.02);
        W('sh' + s, sg * 0.21, 0.45, 0.04);
      }
      // 손: 왼손은 줄, 오른손은 드릴/망치 또는 줄
      W('elbowL', -0.12, 0.6, 0.1); W('handL', -0.04, 0.85, 0.02);
      if (st.drill) { W('elbowR', 0.2, 0.42, 0.22, 1); W('handR', 0.08, st.drillY || 0.5, reach * 0.85, 1); }
      else if (st.hammer !== undefined && st.hammer >= 0) { const up = 1 - Math.min(1, st.hammer * 3); W('elbowR', 0.25, 0.5 + up * 0.2, 0.25); W('handR', 0.15, 0.4 + up * 0.45, reach * 0.8 - up * 0.2); }
      else if (st.reel) { const r = Math.sin((st.t || 0) * 9) * 0.12; W('elbowR', 0.1, 0.55 + r, 0.15); W('handR', 0.03, 0.75 + r, 0.05); }
      else { W('elbowR', 0.28, 0.25, 0.12); W('handR', 0.3, 0.02, 0.2); }
    } else if (st.mode === 'down') {   // 바닥에 떨어져 축 늘어짐: 목표를 지금 자리 바로 아래로 두고 아주 약하게 끈다 (중력·바닥 충돌이 눕힌다)
      for (const n in pts) tgt[n].set(pts[n].x, Math.max(TERRAIN.BASE + 0.08, pts[n].y - 0.25), pts[n].z);
    } else {   // air: 허우적
      basis(st.root, st.fwd, new THREE.Vector3(0, 1, 0));
      const t = (st.t || 0) * 11;
      W('hip', 0, 0.97, 0); W('chest', 0, 1.35, 0); W('neck', 0, 1.52, 0); W('head', 0, 1.69, 0);
      for (const [s, sg] of [['L', -1], ['R', 1]]) {
        const a = t + (s === 'L' ? 0 : 2);
        W('sh' + s, sg * 0.21, 1.42, 0); W('elbow' + s, sg * 0.45, 1.55 + Math.sin(a) * 0.1, Math.cos(a) * 0.15); W('hand' + s, sg * 0.55, 1.85 + Math.sin(a) * 0.15, Math.cos(a) * 0.25);
        W('knee' + s, sg * 0.14, 0.6 + Math.sin(a * 0.8) * 0.12, 0.15); W('foot' + s, sg * 0.16, 0.2 + Math.sin(a * 0.8) * 0.15, Math.cos(a * 0.8) * 0.2);
      }
    }
  }
  function snap() { for (const n in pts) P.setPos(pts[n], tgt[n].x, tgt[n].y, tgt[n].z); }
  // 한 프레임: 자세로 끌고, 막대를 맞추고, 바위·판자에 부딪힌다
  function step(st, dt) {
    pose(st);
    if (!S.built) { snap(); S.built = true; }
    const k = st.mode === 'down' ? 0.03 : st.mode === 'air' ? 0.16 : st.mode === 'hang' ? 0.42 : 0.5;
    const drag = 0.9, g = st.mode === 'down' ? -14 : st.mode === 'air' ? -2 : -6;
    for (const n in pts) { const p = pts[n]; p.ay += g; P.integrate(p, dt, drag); }
    for (const n in pts) { const p = pts[n], t = tgt[n]; p.x += (t.x - p.x) * k; p.y += (t.y - p.y) * k; p.z += (t.z - p.z) * k; }
    for (let it = 0; it < 2; it++) for (const b of bones) P.stick(b.a, b.b, b.len, b.k, 0);
    for (const n in pts) {
      const p = pts[n];
      const c = TERRAIN.collidePoint(p, 0.07) || PATH.pushOut(p, 0.06);
      if (c) { p.px = p.x - (p.x - p.px) * 0.5; p.pz = p.z - (p.z - p.pz) * 0.5; if (c.ny > 0.5 && p.y < p.py) p.py = p.y; }
    }
  }
  function teleport(st) { pose(st); snap(); S.built = true; }

  // ── 그림 ──────────────────────────────────────────
  const M = {}, segs = [], joints = [], extra = {};
  function build(scene) {
    const std = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.8 : r, metalness: m || 0 });
    Object.assign(M, { skin: std(0xd29f78, 0.7), jacket: std(0x2c4170, 0.85), jacket2: std(0x23365e, 0.85), pants: std(0x2f3846, 0.9), glove: std(0xe9e4d6, 0.9), boot: std(0x2a2420, 0.6), harness: std(0xf07a1c, 0.6), helmet: std(0xf3c21b, 0.32, 0.05), eye: std(0x1b1512, 0.4), drill: std(0x2a2a2c, 0.4, 0.3), drillY: std(0xf0b420, 0.45), steel: std(0x9aa0a8, 0.35, 0.8), handle: std(0x6b4423, 0.8) });
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1), sph = new THREE.SphereGeometry(1, 14, 10);
    const seg = (a, b, r0, r1, m) => { const mesh = new THREE.Mesh(cyl, m); mesh.castShadow = true; scene.add(mesh); segs.push({ mesh, a, b, r: (r0 + r1) / 2 }); };
    const joint = (n, r, m, sy) => { const mesh = new THREE.Mesh(sph, m); mesh.castShadow = true; scene.add(mesh); joints.push({ mesh, n, r, sy: sy || 1 }); };
    seg('neck', 'head', 0.05, 0.05, M.skin); seg('neck', 'chest', 0.12, 0.15, M.jacket); seg('chest', 'hip', 0.16, 0.14, M.jacket);
    seg('shL', 'shR', 0.075, 0.075, M.jacket2);
    seg('shL', 'elbowL', 0.065, 0.055, M.jacket); seg('elbowL', 'handL', 0.055, 0.045, M.jacket);
    seg('shR', 'elbowR', 0.065, 0.055, M.jacket); seg('elbowR', 'handR', 0.055, 0.045, M.jacket);
    seg('hip', 'kneeL', 0.085, 0.07, M.pants); seg('kneeL', 'footL', 0.068, 0.055, M.pants);
    seg('hip', 'kneeR', 0.085, 0.07, M.pants); seg('kneeR', 'footR', 0.068, 0.055, M.pants);
    joint('head', 0.118, M.skin); joint('chest', 0.15, M.jacket); joint('hip', 0.14, M.pants);
    joint('shL', 0.078, M.jacket2); joint('shR', 0.078, M.jacket2); joint('elbowL', 0.058, M.jacket); joint('elbowR', 0.058, M.jacket);
    joint('handL', 0.058, M.glove, 0.85); joint('handR', 0.058, M.glove, 0.85); joint('kneeL', 0.072, M.pants); joint('kneeR', 0.072, M.pants);
    // 안전모 (둥근 몸 + 챙 + 가운데 등줄)
    const hg = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.142, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), M.helmet); dome.castShadow = true; hg.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 20), M.helmet); brim.position.set(0, 0.005, 0.03); brim.scale.set(1, 1, 1.12); hg.add(brim);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.26), M.helmet); ridge.position.set(0, 0.13, 0); hg.add(ridge);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.008, 6, 20, Math.PI), M.boot); strap.rotation.set(0, Math.PI / 2, Math.PI); strap.position.y = -0.0; hg.add(strap);
    scene.add(hg); extra.helmet = hg;
    // 얼굴: 눈 두 개, 코
    const face = new THREE.Group();
    for (const sx of [-0.042, 0.042]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), M.eye); e.position.set(sx, 0.01, 0.105); face.add(e); }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), M.skin); nose.position.set(0, -0.02, 0.118); face.add(nose);
    scene.add(face); extra.face = face;
    // 하네스: 허리 고리 + 어깨 띠 둘 + 등 고리
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.022, 6, 22), M.harness); belt.castShadow = true; scene.add(belt); extra.belt = belt;
    extra.straps = [0, 1].map(() => { const m = new THREE.Mesh(cyl, M.harness); scene.add(m); return m; });
    // 장화
    extra.boots = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.24), M.boot); m.castShadow = true; scene.add(m); return m; });
    // 드릴 (손에 들 때만)
    const dg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.26), M.drillY); body.position.z = 0.05; dg.add(body);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.07), M.drill); grip.position.set(0, -0.1, 0); dg.add(grip);
    const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), M.steel); bit.rotation.x = Math.PI / 2; bit.position.z = 0.32; dg.add(bit);
    dg.traverse(o => { o.castShadow = true; }); dg.visible = false; scene.add(dg); extra.drill = dg; extra.bit = bit;
    const hm = new THREE.Group();
    const hh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.36, 6), M.handle); hh.position.y = 0.12; hm.add(hh);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.16), M.steel); head.position.y = 0.3; hm.add(head);
    hm.traverse(o => { o.castShadow = true; }); hm.visible = false; scene.add(hm); extra.hammer = hm;
    // 허리 공구 벨트에 찬 드릴·망치 (손에 들 때는 벨트에서 사라진다)
    extra.beltDrill = dg.clone(); extra.beltDrill.visible = false; scene.add(extra.beltDrill);
    extra.beltHammer = hm.clone(); extra.beltHammer.visible = false; scene.add(extra.beltHammer);
    // Meshy 모델(드릴·망치)이 뜨면 상자 모양은 숨기고 모델을 손·벨트 틀에 맞춰 넣는다 (드릴: 날 +Z·손잡이 -Y, 망치: 자루 +Y·머리 위)
    if (window.PROPS) {
      const swap = (grp, mk) => { grp.children.forEach(c => c.visible = false); const m = mk(); m.traverse(o => { o.castShadow = true; }); grp.add(m); };
      PROPS.get('drill.glb', { rough: 0.55, metal: 0.2 }, m => {
        const mk = () => { const c = m.clone(); c.rotation.y = Math.PI / 2; c.scale.setScalar(0.22); c.position.set(0, 0.01, 0.12); return c; };
        swap(dg, mk); swap(extra.beltDrill, mk);
      });
      PROPS.get('hammer.glb', { rough: 0.6, metal: 0.25 }, m => {
        const mk = () => { const c = m.clone(); c.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2)); c.scale.setScalar(0.19); c.position.set(0, 0.19, 0); return c; };   // 손목 기준이라 자루 가운데가 손바닥(+0.08)에 오게
        swap(hm, mk); swap(extra.beltHammer, mk);
      });
    }
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();
  const V = n => _a.set(pts[n].x, pts[n].y, pts[n].z);
  function draw(st) {
    for (const s of segs) {
      const a = pts[s.a], b = pts[s.b]; _a.set(a.x, a.y, a.z); _b.set(b.x, b.y, b.z); _d.subVectors(_b, _a);
      const L = _d.length(); if (L < 1e-5) continue;
      _q.setFromUnitVectors(_up, _d.multiplyScalar(1 / L)); s.mesh.quaternion.copy(_q); s.mesh.position.addVectors(_a, _b).multiplyScalar(0.5); s.mesh.scale.set(s.r, L, s.r);
    }
    for (const j of joints) { const p = pts[j.n]; j.mesh.position.set(p.x, p.y, p.z); j.mesh.scale.set(j.r, j.r * j.sy, j.r); }
    if (S.hero) HERO.update(pts);
    // 머리 방향 = 목→머리 위, 얼굴 = 어깨 오른쪽 × 위
    const head = new THREE.Vector3(pts.head.x, pts.head.y, pts.head.z), neck = new THREE.Vector3(pts.neck.x, pts.neck.y, pts.neck.z);
    const up = head.clone().sub(neck).normalize();
    const rgt = new THREE.Vector3(pts.shR.x - pts.shL.x, pts.shR.y - pts.shL.y, pts.shR.z - pts.shL.z).normalize();
    const fw = new THREE.Vector3().crossVectors(up, rgt).normalize();   // R = F × U 의 반대 순서
    const rr = new THREE.Vector3().crossVectors(fw, up).normalize();
    _m.makeBasis(rr.clone().negate(), up, fw);
    extra.helmet.position.copy(head).addScaledVector(up, 0.035).addScaledVector(fw, -0.005); extra.helmet.quaternion.setFromRotationMatrix(_m);
    extra.face.position.copy(head); extra.face.quaternion.setFromRotationMatrix(_m);
    // 하네스
    const hip = new THREE.Vector3(pts.hip.x, pts.hip.y, pts.hip.z), chest = new THREE.Vector3(pts.chest.x, pts.chest.y, pts.chest.z);
    const tor = chest.clone().sub(hip).normalize();
    extra.belt.position.copy(hip).addScaledVector(tor, 0.06); extra.belt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tor);
    for (let i = 0; i < 2; i++) {
      const sh = i ? pts.shR : pts.shL; _a.set(sh.x, sh.y, sh.z).addScaledVector(fw, 0.07); _b.copy(hip).addScaledVector(fw, 0.13).addScaledVector(rgt, i ? 0.06 : -0.06);
      _d.subVectors(_b, _a); const L = _d.length(); const m = extra.straps[i];
      m.quaternion.setFromUnitVectors(_up, _d.normalize()); m.position.addVectors(_a, _b).multiplyScalar(0.5); m.scale.set(0.022, L, 0.022);
    }
    // 장화: 발끝은 무릎→발 방향과 몸 앞쪽 사이
    for (let i = 0; i < 2; i++) {
      const f = i ? pts.footR : pts.footL, k = i ? pts.kneeR : pts.kneeL;
      const shin = new THREE.Vector3(f.x - k.x, f.y - k.y, f.z - k.z).normalize();
      let toe = fw.clone().addScaledVector(shin, -fw.dot(shin)).normalize(); if (!isFinite(toe.x)) toe.copy(fw);
      const side = new THREE.Vector3().crossVectors(shin.clone().negate(), toe).normalize();
      _m.makeBasis(side, shin.clone().negate(), toe);
      const bt = extra.boots[i]; bt.position.set(f.x, f.y, f.z).addScaledVector(toe, 0.05).addScaledVector(shin, 0.0); bt.quaternion.setFromRotationMatrix(_m);
    }
    // 도구
    const hr = S.hero ? HERO.bonePos('hand.R') : new THREE.Vector3(pts.handR.x, pts.handR.y, pts.handR.z), er = S.hero ? HERO.bonePos('forearm.R') : new THREE.Vector3(pts.elbowR.x, pts.elbowR.y, pts.elbowR.z);
    extra.drill.visible = !!st.drillShow; extra.hammer.visible = !st.drillShow && st.hammer !== undefined && st.hammer >= 0;
    if (extra.drill.visible) {
      const dir = st.drillDir ? st.drillDir.clone() : hr.clone().sub(er).normalize();
      _m.lookAt(new THREE.Vector3(), dir, _up); extra.drill.quaternion.setFromRotationMatrix(_m); extra.drill.rotateY(Math.PI);
      extra.drill.position.copy(hr); extra.bit.rotation.z += st.drilling ? 0.9 : 0;
    }
    // 벨트: 엉덩이 옆에 아래로 늘어뜨려 찬다
    const bt = st.belt || {}, hipP = S.hero ? HERO.bonePos('hips') : new THREE.Vector3(pts.hip.x, pts.hip.y, pts.hip.z);
    const torsoUp = new THREE.Vector3(pts.chest.x - pts.hip.x, pts.chest.y - pts.hip.y, pts.chest.z - pts.hip.z).normalize();
    extra.beltDrill.visible = !!bt.d && !extra.drill.visible; extra.beltHammer.visible = !!bt.h && !extra.hammer.visible;
    if (extra.beltDrill.visible) { extra.beltDrill.position.copy(hipP).addScaledVector(rgt, 0.3).addScaledVector(torsoUp, -0.02).addScaledVector(fw, -0.1); _m.lookAt(new THREE.Vector3(), torsoUp.clone().negate(), fw); extra.beltDrill.quaternion.setFromRotationMatrix(_m); extra.beltDrill.rotateY(Math.PI); }
    if (extra.beltHammer.visible) { extra.beltHammer.position.copy(hipP).addScaledVector(rgt, -0.29).addScaledVector(torsoUp, -0.24).addScaledVector(fw, -0.12); extra.beltHammer.quaternion.setFromUnitVectors(_up, torsoUp); }   // 머리가 벨트 위에 걸리고 자루는 아래로
    if (extra.hammer.visible) {
      const arm = hr.clone().sub(er).normalize();
      extra.hammer.position.copy(hr).addScaledVector(arm, -0.08); extra.hammer.quaternion.setFromUnitVectors(_up, arm);
    }
  }
  function heroReady() {
    segs.forEach(s => s.mesh.visible = false); joints.forEach(j => j.mesh.visible = false);
    ['helmet', 'face', 'belt'].forEach(k => extra[k].visible = false); extra.straps.forEach(m => m.visible = false); extra.boots.forEach(m => m.visible = false);
    S.hero = true;
  }
  function get(n, out) { const p = pts[n]; return (out || new THREE.Vector3()).set(p.x, p.y, p.z); }
  window.BODY = { pts, step, teleport, build, draw, get, S, heroReady };
})();
