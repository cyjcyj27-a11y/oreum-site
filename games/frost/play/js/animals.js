// animals.js — 황새·들소(주브르)·멧돼지·반딧불이. 몸은 코드로 빚는다.
(function () {
  const rnd = U.mulberry(88);
  const Z = TER.Z;
  const V3 = THREE.Vector3;

  // 털 질감 (결 방향 줄무늬)
  function furTex(base, dark, light, seed) {
    const c = GEO.canvas(256), g = c.getContext('2d');
    const r = U.mulberry(seed);
    g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const x = r() * 256, y = r() * 256, l = 4 + r() * 12;
      g.strokeStyle = r() < 0.55 ? dark : light;
      g.globalAlpha = 0.25 + r() * 0.35;
      g.lineWidth = 1 + r();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y + l); g.stroke();
    }
    g.globalAlpha = 1;
    return GEO.tex(c, true);
  }

  // 찌그러뜨린 공 (털 뭉치 느낌을 위해 표면을 살짝 흔든다)
  function blob(rx, ry, rz, x, y, z, col, jit, seg) {
    const g = new THREE.SphereGeometry(1, seg || 14, Math.max(6, ((seg || 14) * 0.7) | 0));
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + (jit ? (rnd() - 0.5) * jit : 0);
      p.setXYZ(i, p.getX(i) * rx * k, p.getY(i) * ry * k, p.getZ(i) * rz * k);
    }
    g.computeVertexNormals();
    g.translate(x, y, z);
    return GEO.tint(g, col, 0.08, rnd);
  }
  function limb(r0, r1, len, col) {
    const g = new THREE.CylinderGeometry(r1, r0, len, 7);
    g.translate(0, -len / 2, 0);
    return GEO.tint(g, col);
  }
  function mesh(geos, mat) {
    const g = GEO.merge(geos);
    GEO.shadeY(g, 0.55, 1.08);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  // ── 황새 ──
  let storkMat;
  function stork() {
    const W = 0xf4f2ec, B = 0x16161a, R = 0xd8402a;
    const root = new THREE.Group();
    const body = new THREE.Group();
    body.add(mesh([
      blob(0.2, 0.2, 0.42, 0, 0, 0, W, 0.04),
      // 등의 검은 날개깃
      blob(0.16, 0.1, 0.4, 0.13, 0.05, -0.12, B, 0.1),
      blob(0.16, 0.1, 0.4, -0.13, 0.05, -0.12, B, 0.1),
      blob(0.12, 0.05, 0.24, 0, 0.02, -0.42, B, 0.1),
    ], storkMat));
    body.position.y = 0.95;
    root.add(body);
    // 목
    const neck = new THREE.Group();
    neck.position.set(0, 0.1, 0.34);
    const curve = new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(0, 0.2, 0.07), new V3(0, 0.38, 0.02), new V3(0, 0.5, 0.08)]);
    const ng = GEO.tint(new THREE.TubeGeometry(curve, 10, 0.055, 6), W);
    const head = new THREE.Group();
    head.position.set(0, 0.5, 0.08);
    const beak = new THREE.ConeGeometry(0.03, 0.34, 6); beak.rotateX(Math.PI / 2); beak.translate(0, -0.01, 0.23);
    const eye = new THREE.SphereGeometry(0.016, 5, 4);
    head.add(mesh([blob(0.06, 0.06, 0.08, 0, 0, 0, W, 0), GEO.tint(beak, R), GEO.tint(eye.clone().translate(0.045, 0.02, 0.03), B), GEO.tint(eye.translate(-0.045, 0.02, 0.03), B)], storkMat));
    neck.add(mesh([ng], storkMat));
    neck.add(head);
    body.add(neck);
    // 다리
    const legs = [];
    for (const sd of [-1, 1]) {
      const l = new THREE.Group();
      l.position.set(sd * 0.08, 0.97, 0.02);
      l.add(mesh([limb(0.018, 0.016, 0.95, R), GEO.tint(new THREE.BoxGeometry(0.1, 0.02, 0.16).translate(0, -0.95, 0.05), R)], storkMat));
      root.add(l); legs.push(l);
    }
    // 날개 (날 때 펼친다)
    const wings = [];
    for (const sd of [-1, 1]) {
      const w = new THREE.Group();
      w.position.set(sd * 0.15, 0.08, 0);
      const s = new THREE.Shape();
      s.moveTo(0, -0.18); s.lineTo(0.9, -0.28); s.lineTo(1.05, -0.05); s.lineTo(0.9, 0.12); s.lineTo(0, 0.2);
      const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2);
      if (sd < 0) g.scale(-1, 1, 1);
      const col = new Float32Array(g.attributes.position.count * 3);
      const p = g.attributes.position;
      const cw = new THREE.Color(W), cb = new THREE.Color(B);
      for (let i = 0; i < p.count; i++) { const t = Math.abs(p.getX(i)) > 0.5 ? cb : cw; col[i * 3] = t.r; col[i * 3 + 1] = t.g; col[i * 3 + 2] = t.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const m = new THREE.Mesh(g, storkMat.clone()); m.material.side = THREE.DoubleSide; m.castShadow = true;
      w.add(m); w.visible = false;
      body.add(w); wings.push(w);
    }
    return { root, body, neck, head, legs, wings };
  }

  // ── 들소 (주브르) ──
  let bisonMat, boarMat;
  function bison(calf) {
    const D = 0x2e2118, M = 0x4e3a28, L = 0x7a5a38, HORN = 0x262220;
    const root = new THREE.Group();
    const body = new THREE.Group();
    body.position.y = 1.3;
    root.add(body);
    body.add(mesh([
      // 높고 털 많은 어깨 혹 → 낮아지는 등 → 엉덩이
      blob(0.72, 0.86, 0.78, 0, 0.22, 0.42, L, 0.16, 18),
      blob(0.6, 0.72, 0.6, 0, 0.1, 0.0, M, 0.1, 16),
      blob(0.55, 0.58, 0.62, 0, 0.0, -0.55, M, 0.08, 16),
      blob(0.5, 0.52, 0.42, 0, -0.02, -0.98, M, 0.08),
      blob(0.46, 0.42, 0.95, 0, -0.34, -0.2, D, 0.1),     // 배
      blob(0.56, 0.7, 0.5, 0, -0.02, 0.92, L, 0.22, 16),   // 목 갈기
      blob(0.36, 0.58, 0.34, 0, -0.5, 0.88, D, 0.3),       // 가슴 털
      blob(0.3, 0.3, 0.3, 0.42, -0.35, 0.55, D, 0.35), blob(0.3, 0.3, 0.3, -0.42, -0.35, 0.55, D, 0.35),
    ], bisonMat));
    const tail = new THREE.Group(); tail.position.set(0, 0.2, -1.36);
    tail.add(mesh([limb(0.045, 0.03, 0.75, D), blob(0.08, 0.16, 0.08, 0, -0.78, 0, D, 0.25)], bisonMat));
    tail.rotation.x = 0.2;
    body.add(tail);
    // 머리: 낮고 크다. 짧은 뿔, 턱수염
    const head = new THREE.Group();
    head.position.set(0, -0.22, 1.28);
    const hornG = [];
    for (const sd of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([new V3(sd * 0.24, 0.24, 0.02), new V3(sd * 0.46, 0.3, 0.02), new V3(sd * 0.5, 0.5, 0.12)]);
      hornG.push(GEO.tint(new THREE.TubeGeometry(c, 6, 0.05, 5), HORN));
    }
    const eyeG = new THREE.SphereGeometry(0.045, 6, 4);
    head.add(mesh([
      blob(0.4, 0.44, 0.44, 0, 0, 0.08, D, 0.2, 14),
      blob(0.28, 0.28, 0.32, 0, -0.2, 0.44, M, 0.05),
      blob(0.2, 0.14, 0.1, 0, -0.24, 0.72, 0x1a1410, 0),
      blob(0.2, 0.36, 0.22, 0, -0.56, 0.24, D, 0.35),
      blob(0.42, 0.34, 0.34, 0, 0.26, -0.06, L, 0.3),
      GEO.tint(eyeG.clone().translate(0.29, 0.02, 0.36), 0x080808),
      GEO.tint(eyeG.translate(-0.29, 0.02, 0.36), 0x080808),
      blob(0.12, 0.07, 0.09, 0.4, 0.1, 0.08, M, 0), blob(0.12, 0.07, 0.09, -0.4, 0.1, 0.08, M, 0),
      ...hornG,
    ], bisonMat));
    head.rotation.x = 0.3;
    body.add(head);
    // 다리: 몸속에서 시작하는 굵은 윗다리 + 아랫다리 + 발굽
    const legs = [];
    for (const [x, z, fr] of [[0.36, 0.62, 1], [-0.36, 0.62, 1], [0.32, -0.8, 0], [-0.32, -0.8, 0]]) {
      const l = new THREE.Group();
      l.position.set(x, 1.28, z);
      l.add(mesh([
        limb(fr ? 0.26 : 0.24, 0.13, 0.78, fr ? D : M),
        limb(0.12, 0.1, 0.5, D).translate(0, -0.76, 0),
        blob(0.13, 0.08, 0.15, 0, -1.26, 0.03, 0x14100c, 0),
      ], bisonMat));
      root.add(l); legs.push(l);
    }
    const s = calf ? 0.58 : 1.08;
    root.scale.setScalar(s);
    return { root, body, head, legs, tail, s };
  }

  function boar() {
    const D = 0x2e2824, M = 0x4a4038, L = 0x6a5a4c;
    const root = new THREE.Group();
    const body = new THREE.Group(); body.position.y = 0.62; root.add(body);
    body.add(mesh([
      blob(0.34, 0.42, 0.72, 0, 0.02, 0, M, 0.12),
      blob(0.3, 0.44, 0.35, 0, 0.08, 0.35, D, 0.18),
      blob(0.06, 0.12, 0.62, 0, 0.42, 0.05, D, 0.4),   // 등갈기
    ], boarMat));
    const head = new THREE.Group(); head.position.set(0, 0.02, 0.72);
    const snout = new THREE.CylinderGeometry(0.1, 0.2, 0.46, 8); snout.rotateX(Math.PI / 2); snout.translate(0, -0.08, 0.26);
    const tusk = new THREE.ConeGeometry(0.02, 0.14, 4);
    head.add(mesh([
      blob(0.24, 0.28, 0.3, 0, 0, 0, D, 0.15),
      GEO.tint(snout, M),
      blob(0.1, 0.09, 0.03, 0, -0.08, 0.5, 0x3a2a26, 0),
      GEO.tint(tusk.clone().rotateZ(0.3).translate(0.09, -0.08, 0.38), 0xf0e8d8),
      GEO.tint(tusk.rotateZ(-0.3).translate(-0.09, -0.08, 0.38), 0xf0e8d8),
      blob(0.06, 0.12, 0.04, 0.15, 0.25, -0.05, D, 0), blob(0.06, 0.12, 0.04, -0.15, 0.25, -0.05, D, 0),
      GEO.tint(new THREE.SphereGeometry(0.025, 5, 4).translate(0.14, 0.07, 0.18), 0x0a0a0a),
      GEO.tint(new THREE.SphereGeometry(0.025, 5, 4).translate(-0.14, 0.07, 0.18), 0x0a0a0a),
    ], boarMat));
    head.rotation.x = 0.25;
    body.add(head);
    const legs = [];
    for (const [x, z] of [[0.16, 0.42], [-0.16, 0.42], [0.16, -0.45], [-0.16, -0.45]]) {
      const l = new THREE.Group(); l.position.set(x, 0.48, z);
      l.add(mesh([limb(0.07, 0.04, 0.48, D)], boarMat));
      root.add(l); legs.push(l);
    }
    return { root, body, head, legs };
  }
  // 블렌더로 다듬은 멧돼지(tools/boar_blender.py → assets/models/boar.glb, 사장님 2026-09-19)
  //   몸·머리·다리 넷을 코드 멧돼지 자리에 갈아 끼운다. 못 불러오면 코드 멧돼지 그대로
  function boarGLB() {
    if (!window.PLAYER || !PLAYER.loadGLB) return;
    PLAYER.loadGLB('assets/models/boar.glb?v=1').then(gl => {
      const N = {};
      gl.scene.traverse(o => { if (o.isMesh) N[o.name] = o; });
      if (!N.body || !N.head || !N.leg3) return;
      // 정점 색에 회색 털 그림이 곱해져 너무 어둡다 → 이 재질만 밝게
      const mat = boarMat.clone(); mat.color.setRGB(2.3, 2.15, 2.0);
      for (const b of boars) {
        const put = (grp, src) => {
          for (let i = grp.children.length - 1; i >= 0; i--) if (grp.children[i].isMesh) grp.remove(grp.children[i]);
          const m = new THREE.Mesh(src.geometry, mat);
          m.castShadow = true; m.receiveShadow = true;
          grp.add(m);
        };
        b.body.position.copy(N.body.position);
        b.head.position.copy(N.head.position).sub(N.body.position);
        put(b.body, N.body); put(b.head, N.head);
        b.legs.forEach((l, i) => { l.position.copy(N['leg' + i].position); put(l, N['leg' + i]); });
      }
    }).catch(e => console.warn('boar.glb', e.message));
  }

  // ── 무리 ──
  const bisons = [], storks = [], flyers = [], boars = [];
  let fireflies = null, trail = null;

  function build(scene) {
    storkMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    bisonMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: furTex('#9a9a9a', '#3a3a3a', '#e0e0e0', 5) });
    boarMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: furTex('#9a9a9a', '#3a3a3a', '#d0d0d0', 8) });

    // 둥지마다 황새 한두 마리
    WORLD.NESTS.forEach((n, i) => {
      const k = i % 3 === 0 ? 2 : 1;
      for (let j = 0; j < k; j++) {
        const s = stork();
        s.root.position.set(n.x + (j ? 0.3 : -0.15), n.y - 0.02, n.z + (j ? -0.2 : 0.1));
        s.root.rotation.y = rnd() * 6.28;
        s.ph = rnd() * 10; s.nest = i;
        scene.add(s.root);
        storks.push(s);
      }
    });
    // 하늘을 도는 황새
    for (let i = 0; i < 5; i++) {
      const s = stork();
      s.legs.forEach(l => l.rotation.x = -1.35);
      s.wings.forEach(w => w.visible = true);
      s.neck.rotation.x = 1.1;
      s.cx = (rnd() - 0.5) * 500; s.cz = (rnd() - 0.2) * 400; s.r = 30 + rnd() * 50; s.h = 35 + rnd() * 25; s.ph = rnd() * 6.28; s.sp = 0.12 + rnd() * 0.08;
      scene.add(s.root);
      flyers.push(s);
    }
    // 들소 12 마리 — 공터와 둘레 숲
    for (let i = 0; i < 12; i++) {
      const calf = i === 3 || i === 7 || i === 10;
      const b = bison(calf);
      const a = i / 12 * 6.28 + rnd() * 0.4, rr = 3.3 + rnd() * 12;
      b.home = { x: Z.clearing.x + Math.cos(a) * rr, z: Z.clearing.z + Math.sin(a) * rr };
      b.pos = new V3(b.home.x, 0, b.home.z);
      b.yaw = rnd() * 6.28; b.want = b.yaw;
      b.state = 'graze'; b.t = rnd() * 6; b.ph = rnd() * 6; b.id = i; b.speed = 0; b.fear = 0; b.calf = calf; b.eat = 0; b.pitch = 0; b.roll = 0;
      const tone = 0.85 + rnd() * 0.3;
      b.root.traverse(o => { if (o.isMesh) { o.material = bisonMat.clone(); o.material.color.setRGB(tone, tone * 0.97, tone * 0.93); } });
      scene.add(b.root);
      bisons.push(b);
    }
    // 멧돼지 여덟 (사장님 2026-10-01 12마리 → "너무 자주 나온다" 8마리) — 처음 넷은 그대로, 넷은 숲에 고루
    //   둘은 망루(102.4,-64) 둘레 — 전망대에 올라가 내려다보며 쏘라고 (사장님 2026-09-20)
    const bh = [[88, -74], [116, -50], [-60, -32], [-120, -100]];
    {   // 숲(소나무·가문비·원시림·자작나무) 안, 장터에서 60m 밖, 서로 30m 넘게 — 따로 뽑은 난수라 다른 것 자리는 그대로
      const r2 = U.mulberry(1212), M = TER.Z.market;
      for (let k = 0; k < 20000 && bh.length < 8; k++) {   // 12 → 8 (사장님 2026-10-01 "너무 자주 나온다")
        const x = (r2() - 0.5) * TER.LIMIT * 1.8, z = (r2() - 0.5) * TER.LIMIT * 1.8;
        const f = TER.forest(x, z);
        if (!f || !['pine', 'spruce', 'pushcha', 'birch'].includes(f.k)) continue;
        if (TER.H(x, z) < 0.5 || TER.roadD(x, z) < 6 || Math.hypot(x - M.x, z - M.z) < 60) continue;
        if (COL.inside(x, TER.H(x, z) + 0.3, z, 1.0)) continue;
        if (bh.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 30)) continue;
        bh.push([x, z]);
      }
    }
    for (let i = 0; i < bh.length; i++) {
      const b = boar();
      b.home = { x: bh[i][0], z: bh[i][1] };
      b.pos = new V3(b.home.x, 0, b.home.z);
      b.yaw = rnd() * 6.28; b.want = b.yaw; b.state = 'root'; b.t = rnd() * 4; b.ph = rnd() * 6; b.cool = 0; b.speed = 0;
      scene.add(b.root);
      boars.push(b);
    }
    boarGLB();
    buildFireflies(scene);
  }

  function spriteTex() {
    const c = GEO.canvas(32), g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.3, 'rgba(210,255,120,.8)'); gr.addColorStop(1, 'rgba(160,255,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return GEO.tex(c);
  }
  function buildFireflies(scene) {
    const n = 420;
    const pos = new Float32Array(n * 3), base = [];
    for (let i = 0; i < n; i++) {
      let x, z;
      const zone = i % 3;
      if (zone === 0) { x = Z.swamp.x + (rnd() - 0.5) * 80; z = Z.swamp.z + (rnd() - 0.5) * 80; }
      else if (zone === 1) { x = Z.bonfire.x + 12 + (rnd() - 0.5) * 56; z = Z.bonfire.z + (rnd() - 0.5) * 48; }
      else { x = -80 + (rnd() - 0.5) * 104; z = -80 + (rnd() - 0.5) * 104; }
      base.push([x, TER.H(x, z) + 0.4 + rnd() * 2.2, z, rnd() * 6.28]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ map: spriteTex(), size: 0.55, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xd8ff90, opacity: 0 });
    fireflies = new THREE.Points(g, m);
    fireflies.frustumCulled = false;
    fireflies.userData.base = base;
    scene.add(fireflies);
    // 고사리꽃으로 이끄는 반딧불 길
    const pts = [[Z.bonfire.x, Z.bonfire.z], [16, 28], [-8, -16], [-1.6, -48], [-32, -64], [-64, -70], [-92, -76], [-112, -100], [Z.fern.x + 4, Z.fern.z + 10]];
    const tp = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const n2 = Math.ceil(Math.hypot(bx - ax, bz - az) / 3.2);
      for (let k = 0; k < n2; k++) { const x = U.lerp(ax, bx, k / n2), z = U.lerp(az, bz, k / n2); tp.push([x, TER.H(x, z) + 1.2, z, k * 0.4 + i]); }
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tp.length * 3), 3));
    trail = new THREE.Points(g2, new THREE.PointsMaterial({ map: spriteTex(), size: 0.9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe890, opacity: 0 }));
    trail.frustumCulled = false; trail.userData.base = tp; trail.visible = false;
    scene.add(trail);
  }

  // ── 움직임 ──
  function walkLegs(a, speed, dt, amp) {
    a.ph += dt * (2 + speed * 2.4);
    const s = Math.min(1, speed / 1.2) * (amp || 0.45);
    a.legs.forEach((l, i) => { l.rotation.x = Math.sin(a.ph + (i === 0 || i === 3 ? 0 : Math.PI)) * s; });
    a.body.position.y = a.baseY + Math.abs(Math.sin(a.ph)) * 0.03 * speed;
  }

  const _d = new V3();
  // 멀리 있는 짐승은 안 그리고, 가까운 것만 그림자를 드리운다 (맵 60% 뒤 그리기 명령 줄이기, 2026-09-17)
  function lod(root, d, far) {
    const vis = d < far, sh = d < 45;
    if (root.visible !== vis) root.visible = vis;
    if (root.userData.sh !== sh) { root.userData.sh = sh; root.traverse(o => { if (o.isMesh) o.castShadow = sh; }); }
  }
  function update(dt, player) {
    const t = T.time;
    const px = player.pos.x, pz = player.pos.z;
    const running = player.running;
    // 둥지 황새: 가끔 고개를 젖히고 부리를 딱딱
    for (const s of storks) {
      if (s.root) lod(s.root, Math.hypot(s.root.position.x - px, s.root.position.z - pz), 150);
      s.ph += dt;
      const clat = (s.ph % 9) < 1.4;
      s.neck.rotation.x = clat ? -0.9 + Math.sin(s.ph * 30) * 0.08 : Math.sin(s.ph * 0.6) * 0.1;
      s.head.rotation.x = clat ? -0.6 : 0.3;
      s.clatter = clat && (s.ph % 9) < dt * 1.5 ? 1 : 0;
      if (s.clatter && Math.hypot(s.root.position.x - px, s.root.position.z - pz) < 45 && window.AUD) AUD.sfx('clatter');
    }
    for (const s of flyers) {
      s.ph += dt * s.sp;
      const x = s.cx + Math.cos(s.ph) * s.r, z = s.cz + Math.sin(s.ph) * s.r;
      s.root.position.set(x, s.h + Math.sin(s.ph * 3) * 2, z);
      s.root.rotation.y = -s.ph;
      const flap = Math.sin(t * 4 + s.ph * 10);
      const glide = Math.sin(t * 0.3 + s.ph) > 0.2;
      s.wings.forEach((w, i) => w.rotation.z = (glide ? 0.05 : flap * 0.5) * (i ? 1 : -1));
    }
    // 들소
    for (const b of bisons) {
      if (b.baseY == null) b.baseY = b.body.position.y;
      const dx = b.pos.x - px, dz = b.pos.z - pz, d = Math.hypot(dx, dz);
      // 타고 있는 들소는 ride.js 가 몬다 — 여기선 모양만
      if (b.rider) {
        b.root.position.copy(b.pos);
        b.root.rotation.set(b.pitch || 0, b.yaw, b.roll || 0, 'YXZ');
        b.root.visible = true;
        walkLegs(b, b.speed, dt, 0.55);
        b.head.rotation.x = U.damp(b.head.rotation.x, 0.3 + (b.pitch || 0) * 2, 6, dt);
        b.tail.rotation.z = Math.sin(t * 5 + b.id) * 0.4;
        continue;
      }
      if (b.root.rotation.x || b.root.rotation.z) { b.root.rotation.x = 0; b.root.rotation.z = 0; }
      // 길들인 들소는 목장에서 지낸다 (사장님 2026-10-01). 밖에 있으면 그 자리에서 기다리다가, 주인공이 50m 넘게 멀어지면 목장으로 옮겨 둔다
      const tame = T.tame && T.tame[b.id], P = WORLD.PEN;
      let penned = false;
      if (tame && P) {
        const inside = b.pos.x > P.x0 + 1 && b.pos.x < P.x1 - 1 && b.pos.z > P.z0 + 1 && b.pos.z < P.z1 - 1;
        if (!inside && d > 50) {
          const r = (b.id * 0.618) % 1, q = (b.id * 0.381) % 1;
          b.pos.x = P.x0 + 2.5 + r * (P.x1 - P.x0 - 5); b.pos.z = P.z0 + 3 + q * (P.z1 - P.z0 - 6);
          b.state = 'graze'; b.t = 3; b.speed = 0;
        } else if (!inside) { b.speed = U.damp(b.speed, 0, 3, dt); b.state = 'graze'; b.t = Math.max(b.t, 2); }
        penned = inside || d > 50;
        b.home = { x: (P.x0 + P.x1) / 2, z: (P.z0 + P.z1) / 2 };
      }
      // 친구가 된 들소는 안 달아난다. 호밀을 가진 채 걸어오면 달아나지 않고 다가온다 (ride.js, 2026-09-18)
      const friend = T.got['b' + b.id], rye = (T.items.rye || 0) > 0 && !player.ride;
      if (!friend && ((running && d < 16) || (d < 5.5 && !rye))) { b.fear = 4.5; b.want = Math.atan2(dx, dz); }
      let target = 0;
      if (b.eat > 0) {
        b.eat -= dt; target = 0;
        b.want = Math.atan2(-dx, -dz);
      } else if (!friend && rye && b.fear <= 0 && d < 14 && T.mode === 'play') {
        // 호밀 냄새: 주인공 쪽으로 천천히, 머리가 닿을 만큼 오면 멈춘다
        b.want = Math.atan2(-dx, -dz);
        target = d > 1.4 + 1.55 * b.s ? 0.8 : 0;
      } else if (b.fear > 0) {
        b.fear -= dt; target = 6.5;
        if (b.fear <= 0) { b.state = 'graze'; b.t = 3; }
      } else {
        b.t -= dt;
        if (b.t <= 0) {
          if (b.state === 'graze') { b.state = 'walk'; b.t = 3 + rnd() * 5; const hx = b.home.x - b.pos.x, hz = b.home.z - b.pos.z; b.want = Math.hypot(hx, hz) > 25 ? Math.atan2(hx, hz) : rnd() * 6.28; }
          else { b.state = 'graze'; b.t = 5 + rnd() * 8; }
        }
        target = b.state === 'walk' ? 1.0 : 0;
      }
      b.speed = U.damp(b.speed, target, 2.5, dt);
      b.yaw += U.angDiff(b.yaw, b.want) * Math.min(1, dt * 1.8);
      const nx = b.pos.x + Math.sin(b.yaw) * b.speed * dt, nz = b.pos.z + Math.cos(b.yaw) * b.speed * dt;
      const f = TER.forest(nx, nz);
      const penOk = !penned || (nx > P.x0 + 1.6 && nx < P.x1 - 1.6 && nz > P.z0 + 1.6 && nz < P.z1 - 1.6);   // 목장 안에선 울타리 앞에서 돌아선다
      if (penOk && TER.H(nx, nz) > 0.4 && Math.max(Math.abs(nx), Math.abs(nz)) < 370) { b.pos.x = nx; b.pos.z = nz; }
      else b.want += 1.5 * dt * 4;
      b.pos.y = TER.H(b.pos.x, b.pos.z);
      b.root.position.copy(b.pos);
      b.root.rotation.y = b.yaw;
      lod(b.root, Math.hypot(b.pos.x - px, b.pos.z - pz), 130);
      walkLegs(b, b.speed, dt, 0.4);
      const grazing = b.eat > 0 || (b.fear <= 0 && b.state === 'graze');
      b.head.rotation.x = U.damp(b.head.rotation.x, grazing ? 0.95 + Math.sin(t * 1.3 + b.id) * 0.08 : 0.3, 3, dt);
      b.tail.rotation.z = Math.sin(t * 2 + b.id) * 0.25;
    }
    // 멧돼지: 가까이 가면 돌진
    for (const b of boars) {
      if (b.baseY == null) b.baseY = b.body.position.y;
      // 총에 맞은 멧돼지: 옆으로 쓰러져 있다가 한참 뒤 사라지고, 더 뒤에 제자리에서 다시 나온다 (hunt.js)
      if (b.dead) {
        b.deadT += dt;
        const k = Math.min(1, b.deadT / 0.45);
        b.root.rotation.set(0, b.yaw, k * k * 1.45, 'YXZ');
        b.root.position.set(b.pos.x, b.pos.y + Math.sin(k * Math.PI) * 0.15, b.pos.z);
        b.legs.forEach((l, i) => { l.rotation.x = U.damp(l.rotation.x, (i % 2 ? 0.3 : -0.3), 4, dt); });
        b.body.position.y = U.damp(b.body.position.y, b.baseY, 14, dt);   // 달리다 맞으면 몸통이 뛰던 높이(최대 0.2m)에 굳어 다리와 떨어져 보였다 (2026-10-01)
        if (b.deadT > 40) b.root.position.y -= Math.min(1, (b.deadT - 40) / 3) * 0.8;
        b.root.visible = b.deadT < 43 && Math.hypot(b.pos.x - px, b.pos.z - pz) < 100;
        if (b.deadT > 150 && Math.hypot(b.home.x - px, b.home.z - pz) > 40) {
          b.dead = false; b.meat = false; b.state = 'root'; b.t = 3; b.cool = 8; b.pos.set(b.home.x, 0, b.home.z); b.pos.y = TER.H(b.pos.x, b.pos.z);
          b.root.rotation.set(0, b.yaw, 0); b.root.visible = true;
        }
        continue;
      }
      const dx = px - b.pos.x, dz = pz - b.pos.z, d = Math.hypot(dx, dz);
      b.cool -= dt;
      let target = 0;
      if (b.state === 'charge') {
        b.t -= dt; target = 7.2;
        b.want = Math.atan2(dx, dz);
        if (player.ride) { b.state = 'flee'; b.t = 2.5; b.cool = 8; }   // 들소 탄 사람에겐 못 덤빈다
        else if (d < 1.3 && Math.abs(b.pos.y - player.pos.y) < 1.8 && player.canHit()) { player.knock(b.pos); if (window.GAME) GAME.die(); b.state = 'flee'; b.t = 3; b.cool = 12; if (window.AUD) AUD.sfx('boar'); }
        if (b.t <= 0) { b.state = 'flee'; b.t = 2.5; b.cool = 8; }
      } else if (b.state === 'flee') {
        b.t -= dt; target = 5; b.want = Math.atan2(-dx, -dz);
        if (b.t <= 0) { b.state = 'root'; b.t = 4; }
      } else {
        b.t -= dt;
        if (d < 11 && b.pos.y > player.pos.y - 2 && b.cool <= 0 && T.mode === 'play' && !player.safe && !player.ride) { b.state = 'charge'; b.t = 2.6; if (window.AUD) AUD.sfx('boar'); }
        else if (player.ride && d < 16 && T.mode === 'play') { b.state = 'flee'; b.t = 3 + rnd() * 2; if (window.AUD && rnd() < 0.5) AUD.sfx('boar', 0.6); }   // 들소 탄 사람은 쫓아와 쏜다 (2026-09-19)
        else if (b.t <= 0) { b.state = b.state === 'root' ? 'walk' : 'root'; b.t = 3 + rnd() * 4; const hx = b.home.x - b.pos.x, hz = b.home.z - b.pos.z; b.want = Math.hypot(hx, hz) > 20 ? Math.atan2(hx, hz) : rnd() * 6.28; }
        target = b.state === 'walk' ? 1.1 : 0;
      }
      b.speed = U.damp(b.speed, target, 5, dt);
      b.yaw += U.angDiff(b.yaw, b.want) * Math.min(1, dt * (b.state === 'charge' ? 6 : 2));
      const nx = b.pos.x + Math.sin(b.yaw) * b.speed * dt, nz = b.pos.z + Math.cos(b.yaw) * b.speed * dt;
      if (TER.H(nx, nz) > 0.3) { b.pos.x = nx; b.pos.z = nz; }
      const p = { x: b.pos.x, y: b.pos.y, z: b.pos.z };
      COL.push(p, 0.45, 0.8); b.pos.x = p.x; b.pos.z = p.z;
      b.pos.y = TER.H(b.pos.x, b.pos.z);
      b.root.position.copy(b.pos);
      b.root.rotation.y = b.yaw;
      lod(b.root, Math.hypot(b.pos.x - px, b.pos.z - pz), 100);
      walkLegs(b, b.speed, dt, 0.6);
      b.head.rotation.x = U.damp(b.head.rotation.x, b.state === 'root' ? 0.7 + Math.sin(t * 6 + b.ph) * 0.12 : 0.1, 5, dt);
    }
    // 반딧불
    const night = SKY.cur.night;
    if (fireflies) {
      fireflies.material.opacity = night * 0.95;
      fireflies.visible = night > 0.02;
      if (fireflies.visible) {
        const p = fireflies.geometry.attributes.position, base = fireflies.userData.base;
        for (let i = 0; i < base.length; i++) {
          const b = base[i], w = t * 0.5 + b[3];
          p.setXYZ(i, b[0] + Math.sin(w) * 1.5, b[1] + Math.sin(w * 1.7) * 0.5, b[2] + Math.cos(w * 0.8) * 1.5);
        }
        p.needsUpdate = true;
        const blink = 0.55 + 0.45 * Math.sin(t * 3);
        fireflies.material.size = 0.45 + blink * 0.2;
      }
    }
    if (trail && trail.visible) {
      trail.material.opacity = 1;
      const p = trail.geometry.attributes.position, base = trail.userData.base;
      for (let i = 0; i < base.length; i++) {
        const b = base[i], w = t * 1.4 - b[3];
        p.setXYZ(i, b[0] + Math.sin(w * 1.3) * 0.6, b[1] + Math.sin(w) * 0.35 + (Math.sin(w * 0.5) > 0.6 ? 0.3 : 0), b[2] + Math.cos(w) * 0.6);
      }
      p.needsUpdate = true;
    }
  }

  // 사람과 부딪힘 (들소는 크다)
  function pushPlayer(p) {
    for (const b of bisons) {
      if (b.rider) continue;
      const r = 1.1 * b.s + 0.35;
      const dx = p.x - b.pos.x, dz = p.z - b.pos.z, d = Math.hypot(dx, dz);
      if (d < r && d > 1e-3) { p.x = b.pos.x + dx / d * r; p.z = b.pos.z + dz / d * r; }
    }
  }

  function showTrail(on) { if (trail) trail.visible = !!on; }

  window.ANIMALS = { build, update, pushPlayer, showTrail, bisons, storks, boars, bison, stork, boar };
})();
