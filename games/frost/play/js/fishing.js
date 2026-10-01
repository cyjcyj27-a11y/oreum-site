// fishing.js — 호수 작살 낚시 (사장님 2026-09-18 "수영해서 물고기 잡기하자 작살로")
//   · 작살(벨라루스 '아스트로가', 세 갈래)은 얀카네 상점에서 산다 (사장님 2026-09-26) — 평소엔 오른손에 세워 든다
//   · 헤엄치다 스페이스로 잠수(hero.js dive) — 카메라가 보는 쪽으로 위아래 헤엄, 스페이스로 솟구침, 숨 🫧 이 다하면 저절로 떠오른다
//   · 물속에서 E: 작살 찌르기(믹사모 Bayonet Stab) — 끝에 걸린 물고기는 바구니로, 장터에서 판다
//   · 호수 물고기 12종: 붕어·농어·텐치·브림·잉어·강꼬치고기·로치·루드·아이드·강농어·모캐·메기. 다 잡으면 T.did.fish (알레샤 호감)
//   · 물속에 들어가면 안개·빛·떠다니는 알갱이로 물속 느낌 (after() 가 SKY.update 뒤에 덮어쓴다)
(function () {
  const V3 = THREE.Vector3;
  const L = U.L;
  const FISH = [
    { ko: '붕어', en: 'Crucian Carp', len: 0.24, h: 0.42, back: 0x6a5a22, side: 0xc8a040, belly: 0xf0e0a0, fin: 0xb07a30, n: 8, sp: 0.9, price: 3 },
    { ko: '농어', en: 'Perch', len: 0.26, h: 0.3, back: 0x3a5a2a, side: 0x9ab050, belly: 0xf0f0d0, fin: 0xe05a20, bars: 1, n: 7, sp: 1.1, price: 4 },
    { ko: '텐치', en: 'Tench', len: 0.32, h: 0.3, back: 0x2a3a1e, side: 0x6a7a34, belly: 0xc8b870, fin: 0x3a4a22, n: 5, sp: 0.8, price: 6, deep: 1 },
    { ko: '브림', en: 'Bream', len: 0.36, h: 0.5, back: 0x4a4a3a, side: 0xb0a890, belly: 0xe8e4d8, fin: 0x6a6a5a, n: 5, sp: 0.9, price: 7 },
    { ko: '잉어', en: 'Carp', len: 0.56, h: 0.36, back: 0x4a3a1a, side: 0xb08a40, belly: 0xe8d8a0, fin: 0x8a5a2a, scales: 1, n: 3, sp: 0.85, price: 12, deep: 1 },
    { ko: '강꼬치고기', en: 'Pike', len: 0.78, h: 0.18, back: 0x2a3a22, side: 0x5a7a3a, belly: 0xe0e0c0, fin: 0x7a6a3a, spots: 1, n: 2, sp: 1.6, price: 25, dart: 1 },
    // 여섯 종 더 (사장님 2026-10-01 "물고기도 12종으로") — 벨라루스 호수에 사는 것들. 메기가 제일 드물고 비싸다
    { ko: '로치', en: 'Roach', len: 0.22, h: 0.38, back: 0x3a4a5a, side: 0xc0c8d0, belly: 0xf0f0f0, fin: 0xd04a2a, n: 8, sp: 1.0, price: 3 },
    { ko: '루드', en: 'Rudd', len: 0.24, h: 0.4, back: 0x4a5a3a, side: 0xd0b860, belly: 0xf0e8c0, fin: 0xe03a2a, n: 6, sp: 1.0, price: 4 },
    { ko: '아이드', en: 'Ide', len: 0.4, h: 0.3, back: 0x3a4a4a, side: 0xa8b0a8, belly: 0xe8e8e0, fin: 0xc06a4a, n: 4, sp: 1.1, price: 8 },
    { ko: '강농어', en: 'Zander', len: 0.55, h: 0.2, back: 0x4a5a4a, side: 0xa8b098, belly: 0xe8e8d8, fin: 0x8a8a7a, bars: 1, n: 3, sp: 1.3, price: 15, deep: 1 },
    { ko: '모캐', en: 'Burbot', len: 0.5, h: 0.16, back: 0x3a3220, side: 0x7a6a3a, belly: 0xd8c898, fin: 0x5a4a2a, spots: 1, n: 2, sp: 0.7, price: 18, deep: 1 },
    { ko: '메기', en: 'Wels Catfish', len: 0.9, h: 0.2, back: 0x2a2a28, side: 0x4a4a3a, belly: 0xc8c0a8, fin: 0x3a3a30, spots: 1, whiskers: 1, n: 1, sp: 0.6, price: 40, deep: 1 },   // 수염 (사장님 2026-10-01) — 모캐와 구별
  ];
  const fish = [];
  let scene = null, group = null, spearGnd = null, spear = null, specks = null, uwEl = null, airEl = null, airBar = null;
  let thrustT = -1, caught = null, pickT = -1;

  // ── 물고기 모양: 몸(방추형, 등 짙고 배 옅게) + 꼬리·등·배지느러미 ──
  function fishGeo(F) {
    const g = new THREE.SphereGeometry(1, 16, 10);
    const p = g.attributes.position, c = [];
    const cb = new THREE.Color(F.back), cs = new THREE.Color(F.side), cl = new THREE.Color(F.belly), tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);   // z 가 몸 길이(+z 머리)
      const t = (z + 1) / 2;
      const taper = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.05)), 0.7) * (t < 0.25 ? 0.55 + t * 1.8 : 1);
      x *= F.len * 0.16 * taper; y *= F.len * F.h * taper; z *= F.len * 0.5;
      p.setXYZ(i, x, y, z);
      const v = (p.getY(i) / (F.len * F.h) + 1) / 2;   // 0 배 ~ 1 등
      tmp.copy(cl).lerp(cs, Math.min(1, v * 1.6)).lerp(cb, Math.max(0, v - 0.6) * 2.4);
      if (F.bars && v > 0.35 && Math.sin(t * 38) > 0.55) tmp.multiplyScalar(0.45);
      if (F.spots && v > 0.3 && v < 0.85 && Math.sin(t * 60) * Math.sin(v * 40) > 0.6) tmp.lerp(new THREE.Color(0xe8e0a8), 0.6);
      if (F.scales && Math.sin(t * 70 + v * 30) > 0.8) tmp.multiplyScalar(0.8);
      c.push(tmp.r, tmp.g, tmp.b);
    }
    g.computeVertexNormals();
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    const fc = new THREE.Color(F.fin);
    const fin = (pts) => { const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const cc = []; for (let i = 0; i < pts.length / 3; i++) cc.push(fc.r, fc.g, fc.b); fg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); fg.computeVertexNormals(); return fg; };
    const Lh = F.len * 0.5, H = F.len * F.h;
    const tail = fin([0, 0, -Lh * 0.92, 0, H * 0.9, -Lh * 1.35, 0, -H * 0.9, -Lh * 1.35, 0, 0, -Lh * 0.92, 0, 0, -Lh * 1.2, 0, H * 0.9, -Lh * 1.35]);
    const dorsal = fin([0, H * 0.85, Lh * 0.25, 0, H * 1.45, -Lh * 0.05, 0, H * 0.8, -Lh * 0.35]);
    const anal = fin([0, -H * 0.8, -Lh * 0.2, 0, -H * 1.2, -Lh * 0.45, 0, -H * 0.7, -Lh * 0.55]);
    const pec = fin([F.len * 0.07, -H * 0.3, Lh * 0.45, F.len * 0.16, -H * 0.7, Lh * 0.2, F.len * 0.06, -H * 0.5, Lh * 0.2]);
    const pec2 = fin([-F.len * 0.07, -H * 0.3, Lh * 0.45, -F.len * 0.16, -H * 0.7, Lh * 0.2, -F.len * 0.06, -H * 0.5, Lh * 0.2]);
    // 눈
    const eye = new THREE.SphereGeometry(F.len * 0.022, 6, 4); const ec = []; for (let i = 0; i < eye.attributes.position.count; i++) ec.push(0.05, 0.04, 0.03);
    eye.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3));
    const e1 = eye.clone().translate(F.len * 0.085, H * 0.25, Lh * 0.72), e2 = eye.clone().translate(-F.len * 0.085, H * 0.25, Lh * 0.72);
    const parts = [g, tail, dorsal, anal, pec, pec2, e1, e2];
    // 메기 수염: 윗입술 긴 수염 둘(옆으로 휘어 뒤로 늘어진다) + 턱 밑 짧은 수염 넷
    if (F.whiskers) {
      const wc = new THREE.Color(F.fin), V = THREE.Vector3;
      const whisker = (pts, r) => {
        const tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(q => new V(q[0], q[1], q[2]))), 12, r, 4, false);
        const pa = tg.attributes.position, cc = [];
        for (let i = 0; i < pa.count; i++) cc.push(wc.r, wc.g, wc.b);
        tg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
        return tg;
      };
      const r = F.len * 0.009;
      for (const sd of [-1, 1]) {
        parts.push(whisker([[sd * F.len * 0.05, H * 0.1, Lh * 0.97], [sd * F.len * 0.2, H * 0.05, Lh * 1.0], [sd * F.len * 0.34, -H * 0.35, Lh * 0.82], [sd * F.len * 0.42, -H * 1.0, Lh * 0.5]], r));
        for (const k of [0.03, 0.07]) parts.push(whisker([[sd * F.len * k, -H * 0.45, Lh * 0.9], [sd * F.len * (k + 0.02), -H * 0.95, Lh * 0.86], [sd * F.len * (k + 0.03), -H * 1.35, Lh * 0.76]], r * 0.6));
      }
    }
    return GEO.merge(parts);
  }

  // ── 작살: 긴 자루 + 세 갈래 쇠 끝. 원점 = 쥔 곳, +Z 가 끝 ──
  function spearMesh() {
    const grp = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.85 });
    const iron = new THREE.MeshStandardMaterial({ color: 0x5a5e62, roughness: 0.45, metalness: 0.6 });
    grp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.9, 7).rotateX(Math.PI / 2).translate(0, 0, 0.35), wood));
    grp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.07, 7).rotateX(Math.PI / 2).translate(0, 0, 1.3), iron));
    for (const sx of [-1, 0, 1]) {
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.22, 5).rotateX(Math.PI / 2).translate(sx * 0.03, 0, 1.44), iron);
      grp.add(prong);
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.004, 0.02).translate(sx * 0.03 + 0.007, 0, 1.46), iron));   // 미늘
    }
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.012).translate(0, 0, 1.32), iron));
    grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return grp;
  }

  function inLake(x, z, minDepth) { return TER.lakeE(x, z) < 0.95 && TER.H(x, z) < -(minDepth || 1.6); }

  function build(sc) {
    scene = sc;
    group = new THREE.Group(); scene.add(group);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide });
    const Z = TER.Z, rnd = U.mulberry(707);
    FISH.forEach((F, id) => {
      const geo = fishGeo(F);
      // 떼 지어 다닌다: 종류마다 무리 한두 곳
      const cx = Z.lake.x + (rnd() - 0.5) * Z.lake.rx * 1.1, cz = Z.lake.z + (rnd() - 0.5) * Z.lake.rz * 1.1;
      for (let i = 0; i < F.n; i++) {
        let x = cx, z = cz;
        for (let k = 0; k < 60; k++) { x = cx + (rnd() - 0.5) * 16; z = cz + (rnd() - 0.5) * 16; if (inLake(x, z, 2.2)) break; }
        if (!inLake(x, z, 2.2)) { for (let k = 0; k < 400; k++) { x = Z.lake.x + (rnd() - 0.5) * Z.lake.rx * 1.6; z = Z.lake.z + (rnd() - 0.5) * Z.lake.rz * 1.6; if (inLake(x, z, 2.2)) break; } }
        const m = new THREE.Mesh(geo, mat);
        const bottom = TER.H(x, z);
        const y = F.deep ? bottom + 0.4 + rnd() * 0.6 : U.lerp(bottom + 0.5, -0.7, 0.3 + rnd() * 0.6);
        m.position.set(x, y, z);
        group.add(m);
        fish.push({ id, F, m, home: new V3(cx, 0, cz), tgt: new V3(x, y, z), yaw: rnd() * 6.28, sp: 0, ph: rnd() * 6, t: rnd() * 3, flee: 0, alive: true, re: 0 });
      }
    });
    group.visible = false;
    // 선착장 끝 기둥에 기대 세운 작살
    const P = TER.PLACES.find(p => p.id === 'pier');
    if (P) {
      const ry = 0.15, c = Math.cos(ry), s = Math.sin(ry);
      const lx = 0.95, lz = 12.6;
      const x = P.x + lx * c + lz * s, z = P.z - lx * s + lz * c;
      spearGnd = spearMesh();
      spearGnd.position.set(x, 0.5, z);
      spearGnd.rotation.set(-1.25, ry + 0.2, 0);
      spearGnd.userData.at = new V3(x, 0.5, z);
      scene.add(spearGnd);
    }
    spear = spearMesh(); spear.visible = false; scene.add(spear);
    // 물속 알갱이
    const n = 260, pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * 16;
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    specks = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xcfe8dc, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false }));
    specks.frustumCulled = false; specks.visible = false; scene.add(specks);
    // 물속 색 덮개 · 숨 막대
    uwEl = document.createElement('div');
    uwEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;display:none;background:radial-gradient(ellipse at 50% 20%, rgba(80,170,160,.10), rgba(4,30,34,.55));';
    document.body.appendChild(uwEl);
    const tb = document.getElementById('topbar');
    if (tb) {
      airEl = document.createElement('span'); airEl.className = 'stat'; airEl.style.display = 'none';
      airEl.innerHTML = '<i>🫧</i><span style="display:inline-block;width:64px;height:6px;border-radius:3px;background:rgba(255,255,255,.2);overflow:hidden;vertical-align:middle"><span style="display:block;height:100%;width:100%;background:#9fe0ff"></span></span>';
      airBar = airEl.querySelector('span span');
      tb.insertBefore(airEl, tb.children[1] || null);
    }
    // 물은 아래에서도 보이게
    const wm = TER.water && TER.water.material; if (wm) wm.side = THREE.DoubleSide;
  }

  // ── E ──
  function near() {
    return null;   // 작살 줍기는 tools.js (선착장 끝에 놓인 도구)
    if (T.shop.spear || !spearGnd || !spearGnd.visible) return null;
    const a = spearGnd.userData.at;
    return Math.hypot(a.x - PL.pos.x, a.z - PL.pos.z) < 2.2 && Math.abs(PL.pos.y - 0.5) < 1.2 ? { kind: 'spear', label: 'E 🔱' } : null;
  }
  function act(n) {
    if (n.kind !== 'spear') return;
    PL.yaw = Math.atan2(spearGnd.userData.at.x - PL.pos.x, spearGnd.userData.at.z - PL.pos.z);
    PLAYER.doAct('pick', 1.0, { speed: 2.2, from: 0.6 });
    pickT = 0.45;
  }
  // 물속에서 E
  function thrust() {
    if (!TOOLS.held('spear')) { AUD.sfx('deny'); return; }
    if (thrustT >= 0) return;
    thrustT = 0; caught = null; aimFish = pickAim();
    PLAYER.play(PLAYER.CH.acts.swimstab ? 'swimstab' : 'stab', 0.12, { restart: true, once: true, speed: 1.9, from: 0.9 });
    PL.stabT = 0.75;
    AUD.sfx('whoosh');
  }

  const aimAt = new V3(), spearDir = new V3(0, 0, 1), spearGrip = new V3();
  const _hf = new V3(), _hv = new V3(), _hb = new V3();   // hitTest 전용
  const _f = new V3(), _h = new V3(), _tip = new V3(), _a = new V3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), UP = new V3(0, 1, 0);
  function lookDir(out) {
    const p = CAM.pitch, y = CAM.yaw;
    return out.set(-Math.sin(y) * Math.cos(p), -Math.sin(p), -Math.cos(y) * Math.cos(p)).normalize();
  }
  function counts() { let n = 0; for (let i = 0; i < FISH.length; i++) if (T.got['k' + i]) n++; return n; }

  function update(dt) {
    if (!scene) return;
    if (pickT >= 0) { pickT -= dt; if (pickT < 0) { T.shop.spear = true; spearGnd.visible = false; AUD.sfx('pick'); U.save(); } }
    if (spearGnd) spearGnd.visible = false;   // 놓인 작살은 tools.js 가 그린다
    const camUnder = T.camera && T.camera.position.y < -0.02;
    // 물고기: 호수 가까이 있을 때만 움직이고, 물속에서 볼 때만 그린다
    const dl = Math.hypot(PL.pos.x - TER.Z.lake.x, PL.pos.z - TER.Z.lake.z);
    group.visible = camUnder;
    if (dl < 120) for (const f of fish) {
      if (!f.alive) { f.re -= dt; if (f.re <= 0 && dl > 40) { f.alive = true; f.m.visible = true; } continue; }
      const d = f.m.position.distanceTo(PL.pos);
      // 잠수한 사람이 가까이 오면 달아난다 (강꼬치고기는 잠깐 버티다 휙)
      if (PL.dive && d < (f.F.dart ? 1.6 : 2.3) && f.flee <= 0) {
        f.flee = 1.2 + Math.random();
        _a.subVectors(f.m.position, PL.pos).setY(0).normalize();
        f.tgt.set(f.m.position.x + _a.x * 6, f.m.position.y, f.m.position.z + _a.z * 6);
      }
      f.t -= dt; if (f.flee > 0) f.flee -= dt;
      if (f.t <= 0 || f.m.position.distanceTo(f.tgt) < 0.4) {
        f.t = 2 + Math.random() * 4;
        for (let k = 0; k < 10; k++) {
          const x = f.home.x + (Math.random() - 0.5) * 18, z = f.home.z + (Math.random() - 0.5) * 18;
          if (!inLake(x, z, 2)) continue;
          const b = TER.H(x, z);
          f.tgt.set(x, f.F.deep ? b + 0.4 + Math.random() * 0.5 : U.lerp(b + 0.5, -0.6, Math.random()), z);
          break;
        }
      }
      const want = Math.atan2(f.tgt.x - f.m.position.x, f.tgt.z - f.m.position.z);
      f.yaw += U.angDiff(f.yaw, want) * Math.min(1, dt * (f.flee > 0 ? 6 : 1.6));
      const spd = f.F.sp * (f.flee > 0 ? (f.F.dart ? 5 : 3.2) : 0.35);
      f.sp = U.damp(f.sp, spd, 3, dt);
      const nx = f.m.position.x + Math.sin(f.yaw) * f.sp * dt, nz = f.m.position.z + Math.cos(f.yaw) * f.sp * dt;
      if (inLake(nx, nz, 1.2)) { f.m.position.x = nx; f.m.position.z = nz; } else { f.t = 0; f.yaw += 2; }
      f.m.position.y = U.damp(f.m.position.y, f.tgt.y, 1.2, dt);
      const b = TER.H(f.m.position.x, f.m.position.z);
      f.m.position.y = U.clamp(f.m.position.y, b + 0.15, -0.35);
      f.ph += dt * (4 + f.sp * 10);
      f.m.rotation.set(0, f.yaw + Math.sin(f.ph) * 0.18 * (0.4 + f.sp), Math.sin(f.ph * 0.5) * 0.05);
    }
    // 작살: 물속이면 보는 쪽으로 겨누고, 땅에선 오른손에 세워 든다
    const owned = TOOLS.held('spear');
    spear.visible = owned && PL.ch && PL.ch.holder.visible && T.mode !== 'title';
    if (spear.visible) {
      if (PL.dive) {
        lookDir(_f);
        // 물속에선 손뼈 대신 가슴 앞(보는 쪽)에서 뻗는다 — 찌르는 동작은 서서 하는 동작이라 손 자리가 몸과 어긋난다
        // 오른손으로 쥐고, 가슴 앞 2.2m 겨눈 곳을 향한다 — 찌르는 동작에서 손이 내려가도 작살은 손에서 겨눈 곳으로
        //   작살은 늘 몸이 향한 쪽 — 카메라 쪽을 따르면 뒤로 헤엄칠 때 거꾸로 보였고, 찌를 때 몸을 카메라 쪽으로 돌리면
        //   얼굴을 보는 카메라에선 몸이 뒤로 돌았다 (사장님 2026-09-27). 위아래는 몸 기울기(찌를 땐 카메라 높낮이를 따른다)
        if (PLAYER.CH.holder) _f.set(0, 0, 1).applyQuaternion(PLAYER.CH.holder.quaternion);
        PLAYER.CH.bones.RightHand.getWorldPosition(_h);
        PLAYER.CH.bones.Spine2.getWorldPosition(aimAt).addScaledVector(_f, 2.2);
        if (thrustT >= 0 && aimFish && aimFish.alive) aimAt.copy(aimFish.m.position);   // 겨눈 물고기 쪽으로
        _f.subVectors(aimAt, _h).normalize();
        let push = 0, hitNow = false;
        if (thrustT >= 0) {
          thrustT += dt;
          push = thrustT < 0.12 ? thrustT / 0.12 * 0.75 : Math.max(0, 0.75 - (thrustT - 0.12) / 0.3 * 0.75);
          hitNow = !caught && thrustT >= 0.05 && thrustT <= 0.3;   // 뻗어 나가는 동안 매 프레임 판정 (한 프레임만 보면 헤엄치는 물고기가 비켜 가 절반은 빗나갔다)
          if (thrustT > 0.45) thrustT = -1;
        }
        spearDir.copy(_f); spearGrip.copy(_h);
        spear.position.copy(_h).addScaledVector(_f, push - 0.25);
        _m.lookAt(_a.set(0, 0, 0), _f.clone().negate(), UP); spear.quaternion.setFromRotationMatrix(_m);
        // 판정은 작살을 제자리에 놓은 뒤에 — 예전엔 판정이 계산용 벡터(_f·_h)를 덮어써서
        //   찌르는 그 한 프레임에 작살이 엉뚱한 곳(몸 뒤쪽)으로 튀었다 (사장님 2026-09-27 "작살을 자기몸쪽으로 휘두르는데")
        if (hitNow) hitTest(true);
      } else {
        // 오른손에 쥐고 지팡이처럼 세워 든다 (사장님 2026-09-27 "손에 붙이는건 어렵냐") — 날은 위, 살짝 앞·바깥으로
        //   자루 끝이 땅을 뚫지 않게 손이 낮아지면(줍기 동작) 그만큼 들어 올린다
        const fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw);
        _f.set(fx * 0.14 - fz * 0.08, 1, fz * 0.14 + fx * 0.08).normalize();
        _a.set(fx, 0, fz);
        _m.lookAt(_h.set(0, 0, 0), _tip.copy(_f).negate(), _a); spear.quaternion.setFromRotationMatrix(_m);
        const B = PLAYER.CH.bones;
        B.RightHand.getWorldPosition(_h);
        if (B.RightHandMiddle1) { B.RightHandMiddle1.getWorldPosition(aimAt); _h.lerp(aimAt, 0.6); }   // 손목이 아니라 손바닥 한가운데
        const butt = _h.y - _f.y * 0.6, gy = WORLD.groundAt ? WORLD.groundAt(_h.x, _h.z, PL.pos.y + 0.3) : PL.pos.y;
        spear.position.copy(_h);
        if (butt < gy + 0.05) spear.position.y += gy + 0.05 - butt;
      }
    }
    // 잡힌 물고기: 작살 끝에 꽂혀 있다가 바구니로
    if (caught) {
      caught.t += dt;
      spear.localToWorld(_tip.set(0, 0, 1.38));
      if (caught.t < 0.9) { caught.f.m.position.copy(_tip); caught.f.m.rotation.z = Math.sin(caught.t * 30) * 0.4 * (1 - caught.t); }
      else { caught.f.m.visible = false; caught = null; }
    }
    // 물속 알갱이
    specks.visible = camUnder;
    if (camUnder) { specks.position.copy(T.camera.position); specks.rotation.y += dt * 0.02; }
    uwEl.style.display = camUnder ? 'block' : 'none';
    // 숨
    if (airEl) {
      airEl.style.display = PL.dive || (PL.air != null && PL.air < 0.999 && PL.swim) ? '' : 'none';
      if (airBar) { const a = PL.air == null ? 1 : PL.air; airBar.style.width = (a * 100) + '%'; airBar.style.background = a < 0.25 ? '#ff7a6a' : '#9fe0ff'; }
    }
  }

  // 찌를 때 몸 앞 25° 안·2.6m 안의 물고기 하나로 작살 끝을 살짝 돌린다 — 몸은 돌리지 않는다 (사장님 2026-09-27)
  let aimFish = null;
  const _pa = new V3(), _pb = new V3();
  function pickAim() {
    // 좌우는 몸이 향한 쪽 25° 안, 위아래는 50° 안 — 떠오르거나 가라앉을 땐 몸이 크게 기울어 몸 기울기로는 못 고른다
    PLAYER.CH.bones.Spine2.getWorldPosition(_pb);
    const fx = Math.sin(PL.yaw), fz = Math.cos(PL.yaw);
    let best = null, bs = 1e9;
    for (const f of fish) {
      if (!f.alive) continue;
      _pa.subVectors(f.m.position, _pb);
      const d = _pa.length(), hz = Math.hypot(_pa.x, _pa.z);
      if (d > 2.6 || d < 0.2 || hz < 0.05) continue;
      if ((_pa.x * fx + _pa.z * fz) / hz < 0.906) continue;   // cos 25°
      if (Math.abs(Math.atan2(_pa.y, hz)) > 0.87) continue;     // 50°
      if (d < bs) { bs = d; best = f; }
    }
    return best;
  }
  function hitTest(quiet) {
    // 판정은 작살이 나간 선 그대로: 쥔 손에서 겨눈 쪽으로 0.2~2.3m (물고기 크기만큼 너그럽게)
    const _f = _hf.copy(spearDir), _h = _hv;   // 판정 전용 벡터 (그리는 쪽 _f·_h 를 건드리지 않는다)
    const base = _hb.copy(spearGrip).addScaledVector(_f, 0.2);
    const SEG = 2.1;
    let best = null, bd = 1e9;
    for (const f of fish) {
      if (!f.alive) continue;
      const p = f.m.position;
      // 선분(작살 끝 쪽 1.4m)과 물고기 사이 거리
      const t = U.clamp(_h.subVectors(p, base).dot(_f) / SEG, 0, 1);
      const cx = base.x + _f.x * SEG * t, cy = base.y + _f.y * SEG * t, cz = base.z + _f.z * SEG * t;
      const d = Math.hypot(p.x - cx, p.y - cy, p.z - cz);
      const r = 0.3 + f.F.len * 0.35;
      if (d < r && d < bd) { bd = d; best = f; }
    }
    if (!best) { if (!quiet) AUD.sfx('swim'); return; }
    best.alive = false; best.re = 240;
    caught = { f: best, t: 0 };
    AUD.sfx('chop', 0.6); AUD.sfx('splash');
    T.fish = T.fish || {};
    T.fish[best.id] = (T.fish[best.id] || 0) + 1;
    FX.pop('🐟', PL.pos);
    const key = 'k' + best.id;
    if (!T.got[key]) {
      T.got[key] = true;
      AUD.sfx('new');
      HUD.card(icon(best.id), L(best.F.ko, best.F.en), 'k');
      if (counts() >= FISH.length && !T.did.fish) { T.did.fish = true; if (window.LIKE) LIKE.done('fish'); }
    }
    U.save();
  }

  // 도감 카드용 물고기 그림
  const icons = {};
  function icon(id) {
    if (icons[id]) return icons[id];
    const F = FISH[id], c = GEO.canvas(128, 128), g = c.getContext('2d');
    const col = n => '#' + new THREE.Color(n).getHexString();
    g.translate(64, 64); const w = 52, h = Math.min(30, 52 * F.h * 1.4);
    const gr = g.createLinearGradient(0, -h, 0, h); gr.addColorStop(0, col(F.back)); gr.addColorStop(0.5, col(F.side)); gr.addColorStop(1, col(F.belly));
    g.fillStyle = col(F.fin); g.beginPath(); g.moveTo(-w * 0.8, 0); g.lineTo(-w * 1.15, -h * 0.9); g.lineTo(-w * 1.05, 0); g.lineTo(-w * 1.15, h * 0.9); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-w * 0.1, -h * 0.85); g.lineTo(w * 0.1, -h * 1.35); g.lineTo(w * 0.3, -h * 0.8); g.fill();
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, w * 0.9, h, 0, 0, 7); g.fill();
    if (F.bars) { g.fillStyle = 'rgba(20,24,10,.45)'; for (let i = -2; i <= 2; i++) g.fillRect(i * 12 - 3, -h * 0.9, 6, h * 1.1); }
    if (F.spots) { g.fillStyle = 'rgba(240,235,180,.7)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(-30 + (i * 13) % 70, -h * 0.4 + (i % 3) * h * 0.35, 3, 2, 0, 0, 7); g.fill(); } }
    g.fillStyle = '#111'; g.beginPath(); g.arc(w * 0.62, -h * 0.25, 3.5, 0, 7); g.fill();
    if (F.whiskers) {   // 메기 수염: 입가에서 앞으로 나와 아래로 휘는 긴 수염 둘 + 턱 밑 짧은 수염
      g.strokeStyle = col(F.fin); g.lineCap = 'round';
      g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(w * 0.86, -h * 0.1); g.quadraticCurveTo(w * 1.18, -h * 0.4, w * 1.12, h * 1.9); g.stroke();
      g.beginPath(); g.moveTo(w * 0.84, h * 0.05); g.quadraticCurveTo(w * 1.05, h * 0.3, w * 0.92, h * 2.0); g.stroke();
      g.lineWidth = 1.8;
      for (const dx of [0.66, 0.74]) { g.beginPath(); g.moveTo(w * dx, h * 0.75); g.quadraticCurveTo(w * (dx + 0.03), h * 1.2, w * (dx - 0.02), h * 1.55); g.stroke(); }
    }
    return (icons[id] = c.toDataURL());
  }

  // SKY.update 뒤에 부른다: 물속이면 안개·하늘을 물빛으로
  let saved = null;
  function after(cam) {
    const under = cam.position.y < -0.02;
    const sc = T.scene;
    const wm = TER.water && TER.water.material;
    if (under) {
      if (!saved) { saved = { c: wm.color.getHex(), o: wm.opacity }; }
      wm.color.setRGB(0.35, 0.75, 0.72); wm.opacity = 0.7;   // 아래서 올려다본 수면은 밝게
      sc.fog.color.setRGB(0.06, 0.22, 0.24);
      sc.fog.near = 0.5; sc.fog.far = 24;
      sc.background = sc.fog.color;
      if (window.QUESTS) for (const r of QUESTS.res) r.sp.visible = false;   // 말풍선(안개 안 받음)이 물속까지 비친다
      if (SKY.dome) SKY.dome.visible = false;
    } else if (saved) {
      wm.color.setHex(saved.c); wm.opacity = saved.o;
      saved = null;
      sc.background = null;
      if (window.QUESTS) for (const r of QUESTS.res) r.sp.visible = true;
      if (SKY.dome) SKY.dome.visible = true;
    }
  }

  const restSpot = () => spearGnd && spearGnd.userData.at;
  window.FISHING = { build, update, after, near, act, thrust, FISH, fish, counts, icon, spearMesh, restSpot };
})();
