// puzzle.js — 장소 장치 퍼즐: 풀어야 다음 데이트 장소가 열린다
//   연못 ← 오리배로 새끼 오리 모으기 · 도쇼궁 ← 석등 순서 · 동물원 ← 판다 동상 돌리기 · 분수 광장 ← 밸브로 물줄기 켜기
(function () {
  const DEF = [
    { id: 'duck', gate: 1, name: '오리배' },
    { id: 'lamp', gate: 2, name: '석등', x: -8, z: 16 },
    { id: 'panda', gate: 3, name: '판다', x: -40, z: -31 },
    { id: 'fount', gate: 4, name: '분수', x: 25, z: -44 },
  ];
  const PZ = { DEF };
  const acts = [];      // { x, z, r, icon, ok(), fn() }
  let scene;

  const solved = id => !!(T.puz && T.puz[id]);
  const forGate = g => DEF.find(d => d.gate === g) || null;
  const mat = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, flatShading: true }, o || {}));
  function mesh(geo, m, x, y, z, parent, sx, sy, sz) {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z);
    if (sx) o.scale.set(sx, sy == null ? sx : sy, sz == null ? sx : sz);
    o.castShadow = true; o.receiveShadow = true; (parent || scene).add(o); return o;
  }
  const block = (x, z, r) => PARK.C.circles.push({ x, z, r });
  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(0.5, 14, 10), cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    cone4: new THREE.ConeGeometry(0.7071, 1, 4), torus: new THREE.TorusGeometry(0.45, 0.07, 8, 20),
  };
  GEO.cone4.rotateY(Math.PI / 4);
  function emojiTex(sym, bg) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = bg || '#fff4dc'; g.fillRect(0, 0, 128, 128);
    g.font = '88px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(sym, 64, 70);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function done(id, x, z) {
    T.puz = T.puz || {}; T.puz[id] = 1; U.save();
    AUD.sfx('clear');
    FX.coins(new THREE.Vector3(x, 0, z), 2, 5);   // 🪙10
    const d = DEF.find(q => q.id === id), zn = DATA.ZONES[d.gate];
    setTimeout(() => { FX.banner(zn.name, 1.8); AUD.sfx('bell'); }, 700);
    ZONE.paintFlags();
  }

  // ═════ 1. 오리배: 새끼 오리 네 마리를 엄마 오리에게 ═════
  const D = { boat: null, dockL: null, dockW: null, mom: null, kids: [], trail: [], vel: new THREE.Vector3(), yaw: 0, spot: null };
  const PO = () => PARK.POND;
  // 배가 갈 수 있는 물: 가장자리·섬·둑길에서 조금 떨어져야 한다
  function boatOK(x, z) {
    const p = PO(), ex = (x - p.x) / (p.rx - 1.4), ez = (z - p.z) / (p.rz - 1.4);
    if (ex * ex + ez * ez > 1) return false;
    if (Math.hypot(x - (-64), z - 44) < 9 + 1.4) return false;
    if (x > -58.5 && x < -31.5 && Math.abs(z - 44) < 3.9) return false;
    return true;
  }
  function duckMesh(s, kid) {
    const g = new THREE.Group();
    const body = mat(kid ? 0xf2d35a : 0x8a6a48), head = mat(kid ? 0xf2d35a : 0x2f6b45), beak = mat(0xf29a2a);
    mesh(GEO.sph, body, 0, 0.18 * s, 0, g, 0.7 * s, 0.5 * s, 1.0 * s);
    mesh(GEO.sph, head, 0, 0.55 * s, 0.35 * s, g, 0.42 * s);
    mesh(GEO.sph, beak, 0, 0.5 * s, 0.6 * s, g, 0.2 * s, 0.1 * s, 0.26 * s);
    mesh(GEO.sph, body, 0, 0.3 * s, -0.5 * s, g, 0.3 * s, 0.25 * s, 0.3 * s);
    scene.add(g); return g;
  }
  function buildDuck() {
    const p = PO(), a = 0.6;
    let k = 0.5, sx = 0, sz = 0;
    for (; k < 1.6; k += 0.005) { sx = p.x + Math.cos(a) * p.rx * k; sz = p.z + Math.sin(a) * p.rz * k; if (!PARK.inWater(sx, sz, 0)) break; }
    const nx = Math.cos(a), nz = Math.sin(a);
    D.dockL = { x: sx + nx * 1.8, z: sz + nz * 1.8 };
    let wk = k; while (wk > 0.5 && !boatOK(p.x + Math.cos(a) * p.rx * wk, p.z + Math.sin(a) * p.rz * wk)) wk -= 0.005;
    D.dockW = { x: p.x + Math.cos(a) * p.rx * wk, z: p.z + Math.sin(a) * p.rz * wk };
    D.spot = { x: D.dockL.x, z: D.dockL.z, name: DEF[0].name };
    // 선착장 나무판
    const wood = mat(0x7a5a3a);
    const len = Math.hypot(D.dockL.x - D.dockW.x, D.dockL.z - D.dockW.z) + 1.2, yaw = Math.atan2(nx, nz);
    const pier = mesh(GEO.box, wood, (D.dockL.x + D.dockW.x) / 2, 0.22, (D.dockL.z + D.dockW.z) / 2, null, 1.6, 0.16, len); pier.rotation.y = yaw;
    for (const sd of [-1, 1]) { const q = mesh(GEO.cyl, wood, D.dockW.x + Math.cos(yaw) * sd * 0.9, 0.5, D.dockW.z - Math.sin(yaw) * sd * 0.9, null, 0.16, 1.0, 0.16); q.castShadow = false; }
    // 오리배
    const b = new THREE.Group();
    const white = mat(0xf6f3ec), blue = mat(0x4a90d0), beak = mat(0xf2a33a), eye = new THREE.MeshBasicMaterial({ color: 0x1b1b1f });
    mesh(GEO.box, white, 0, 0.3, 0, b, 1.9, 0.55, 2.8);
    mesh(GEO.box, blue, 0, 0.6, -0.4, b, 1.7, 0.12, 1.4);
    mesh(GEO.sph, white, 0, 1.2, 1.15, b, 0.75, 1.5, 0.75);
    mesh(GEO.sph, white, 0, 1.95, 1.3, b, 0.6);
    mesh(GEO.sph, beak, 0, 1.9, 1.7, b, 0.3, 0.16, 0.42);
    for (const sd of [-1, 1]) mesh(GEO.sph, eye, sd * 0.22, 2.05, 1.52, b, 0.09);
    b.position.set(D.dockW.x, 0.12, D.dockW.z); D.yaw = yaw + Math.PI; b.rotation.y = D.yaw;
    D.boat = b; scene.add(b);
    // 엄마 오리(섬 너머 서쪽 물) · 새끼 네 마리
    D.mom = { g: duckMesh(1.5), x: -82, z: 44 };
    D.mom.g.position.set(D.mom.x, 0.1, D.mom.z);
    [[-52, 18], [-84, 20], [-82, 70], [-60, 74]].forEach(([x, z], i) => {
      // 도는 동그라미 둘레까지 배가 닿을 수 있게 가운데 쪽으로 당긴다
      for (let n = 0; n < 60 && ![0, 1, 2, 3].every(q => boatOK(x + Math.cos(q * 1.57) * 2.5, z + Math.sin(q * 1.57) * 2.5)); n++) { x += (p.x - x) * 0.04; z += (p.z - z) * 0.04; }
      D.kids.push({ g: duckMesh(0.7, true), hx: x, hz: z, x, z, st: 'free', ph: i * 1.7, yaw: 0 });
    });
    acts.push({ get x() { return D.boat.position.x; }, get z() { return D.boat.position.z; }, r: 3.6, icon: '🦆', ok: () => !PL.ride, fn: board });
  }
  function board() {
    PL.ride = D; PL.f.riding = ALLY.f.riding = true;
    for (const f of [PL.f, ALLY.f]) { f.state = 'free'; f.atk = null; f.moveSpeed = 0; f.push.set(0, 0, 0); f.air = false; f.ch.play('idle', 0.2, { force: true }); }
    D.vel.set(0, 0, 0); D.trail.length = 0;
    AUD.sfx('splash');
  }
  function landSpot() {
    const bx = D.boat.position.x, bz = D.boat.position.z;
    for (let d = 2.2; d <= 5.2; d += 0.5) for (let i = 0; i < 24; i++) {
      const a = i / 24 * U.TAU, x = bx + Math.sin(a) * d, z = bz + Math.cos(a) * d;
      if (PARK.blocked(x, z, 0.6) || PARK.C.circles.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 0.6)) continue;
      return { x, z };
    }
    return null;
  }
  function unboard() {
    const s = landSpot(); if (!s) { AUD.sfx('deny'); return; }
    PL.ride = null; PL.f.riding = ALLY.f.riding = false;
    for (const f of [PL.f, ALLY.f]) { f.y = 0; }
    PL.f.pos.set(s.x, 0, s.z); PL.f.yaw = Math.atan2(s.x - D.boat.position.x, s.z - D.boat.position.z);
    ALLY.placeNearHero();
    AUD.sfx('step'); AUD.sfx('step');
  }
  function duckUpdate(dt) {
    const b = D.boat; if (!b) return;
    const t = T.time;
    if (PL.ride === D) {
      const mv = PLAYER.moveVec(), m = Math.min(1, Math.hypot(mv.x, mv.z));
      const sp = (PLAYER.IN.run ? 6.2 : 4.2) * m;
      const wx = m > 0.05 ? mv.x / Math.hypot(mv.x, mv.z) * sp : 0, wz = m > 0.05 ? mv.z / Math.hypot(mv.x, mv.z) * sp : 0;
      D.vel.x = U.damp(D.vel.x, wx, 2.2, dt); D.vel.z = U.damp(D.vel.z, wz, 2.2, dt);
      const nx = b.position.x + D.vel.x * dt, nz = b.position.z + D.vel.z * dt;
      if (boatOK(nx, nz)) { b.position.x = nx; b.position.z = nz; }
      else if (boatOK(nx, b.position.z)) { b.position.x = nx; D.vel.z *= 0.3; }
      else if (boatOK(b.position.x, nz)) { b.position.z = nz; D.vel.x *= 0.3; }
      else D.vel.multiplyScalar(0.2);
      const v = Math.hypot(D.vel.x, D.vel.z);
      if (v > 0.4) D.yaw = U.angTo(D.yaw, Math.atan2(D.vel.x, D.vel.z), dt * 2.4);
      // 지나온 자리 — 새끼 오리가 줄지어 따라온다
      const last = D.trail[D.trail.length - 1];
      if (!last || Math.hypot(last.x - b.position.x, last.z - b.position.z) > 0.25) { D.trail.push({ x: b.position.x, z: b.position.z }); if (D.trail.length > 140) D.trail.shift(); }
      if (v > 1 && Math.random() < dt * 3) AUD.sfx('paddle');
      // 두 사람을 배에 앉힌다
      const fx = Math.sin(D.yaw), fz = Math.cos(D.yaw), rx = Math.cos(D.yaw), rz = -Math.sin(D.yaw);
      [[PL.f === T.ken ? PL.f : ALLY.f, -0.42], [PL.f === T.ken ? ALLY.f : PL.f, 0.42]].forEach(([f, sd]) => {
        f.pos.set(b.position.x + rx * sd - fx * 0.45, 0, b.position.z + rz * sd - fz * 0.45);
        f.y = 0.45 + Math.sin(t * 2.2) * 0.04; f.yaw = D.yaw;
        f.ch.holder.position.set(f.pos.x, f.y, f.pos.z); f.ch.holder.rotation.y = D.yaw;
        if (f.ch.cur !== 'idle') f.ch.play('idle', 0.2, { force: true });
      });
    }
    b.rotation.y = D.yaw;
    b.position.y = 0.12 + Math.sin(t * 2.2) * 0.04;
    b.rotation.z = Math.sin(t * 1.7) * 0.03;
    // 엄마 오리
    const mo = D.mom;
    mo.g.position.y = 0.1 + Math.sin(t * 2) * 0.03;
    mo.g.rotation.y = Math.sin(t * 0.4) * 0.8;
    let follow = 0, home = 0;
    D.kids.forEach((k, i) => {
      let tx = k.hx + Math.cos(t * 0.5 + k.ph) * 1.5, tz = k.hz + Math.sin(t * 0.5 + k.ph) * 1.5, rate = 1.5;
      if (k.st === 'follow') {
        const idx = D.trail.length - 1 - (follow + 1) * 6;
        const p = idx >= 0 ? D.trail[idx] : D.trail[0] || { x: b.position.x, z: b.position.z };
        tx = p.x; tz = p.z; rate = 4; follow++;
      } else if (k.st === 'home') {
        const a = t * 0.7 + i * 1.57;
        tx = mo.x + Math.cos(a) * (2 + (i % 2) * 0.6); tz = mo.z + Math.sin(a) * (2 + (i % 2) * 0.6); rate = 3; home++;
      }
      const dx = tx - k.x, dz = tz - k.z;
      k.x += dx * Math.min(1, rate * dt); k.z += dz * Math.min(1, rate * dt);
      if (Math.hypot(dx, dz) > 0.05) k.yaw = U.angTo(k.yaw, Math.atan2(dx, dz), dt * 6);
      k.g.position.set(k.x, 0.1 + Math.sin(t * 3 + k.ph) * 0.04, k.z); k.g.rotation.y = k.yaw;
      if (k.st === 'free' && PL.ride === D && Math.hypot(k.x - b.position.x, k.z - b.position.z) < 3.4) {
        k.st = 'follow'; AUD.sfx('peep'); FX.ring({ x: k.x, z: k.z }, 0.8);
      }
    });
    // 엄마 곁에 오면 따라오던 새끼가 엄마에게 간다
    if (PL.ride === D && follow && Math.hypot(b.position.x - mo.x, b.position.z - mo.z) < 5.5) {
      D.kids.forEach(k => { if (k.st === 'follow') k.st = 'home'; });
      AUD.sfx('quack'); FX.ring({ x: mo.x, z: mo.z }, 1.6);
      FX.praise('🐥 ' + D.kids.filter(k => k.st === 'home').length + '/' + D.kids.length);
      if (!solved('duck') && D.kids.every(k => k.st === 'home')) done('duck', mo.x, mo.z);
    }
  }

  // ═════ 2. 석등: 에마 판의 그림 순서대로 불 켜기 ═════
  const L = { lamps: [], step: 0, seq: ['🌙', '🐱', '🌸', '🐟'], syms: ['🌸', '🐟', '⭐', '🐱', '🌙'] };
  function buildLamp() {
    const { x: cx, z: cz } = DEF[1];
    const stone = mat(0x9c988c), wood = mat(0x6b4a32);
    L.syms.forEach((sym, i) => {
      const a = -Math.PI / 2 + (i - 2) * 0.62;          // 판 앞쪽으로 부채꼴
      const x = cx + Math.sin(a) * 5, z = cz + Math.cos(a) * 5;
      const g = new THREE.Group(); g.position.set(x, PARK.groundY(x, z), z); g.rotation.y = Math.atan2(cx - x, cz - z); scene.add(g);
      mesh(GEO.box, stone, 0, 0.25, 0, g, 0.95, 0.5, 0.95);
      mesh(GEO.cyl, stone, 0, 1.17, 0, g, 0.36, 1.36, 0.36);
      mesh(GEO.box, stone, 0, 1.9, 0, g, 0.8, 0.12, 0.8);
      mesh(GEO.box, stone, 0, 2.5, 0, g, 0.8, 0.12, 0.8);
      const tex = emojiTex(sym);
      const paper = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffb050, emissiveMap: tex, emissiveIntensity: 0.02, roughness: 0.9 });
      for (let s = 0; s < 4; s++) {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), paper);
        p.position.set(Math.sin(s * Math.PI / 2) * 0.36, 2.2, Math.cos(s * Math.PI / 2) * 0.36); p.rotation.y = s * Math.PI / 2; g.add(p);
      }
      mesh(GEO.cone4, stone, 0, 2.9, 0, g, 1.3, 0.62, 1.3);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffb860, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      glow.position.set(0, 2.2, 0); glow.scale.setScalar(2.4); g.add(glow);
      block(x, z, 0.55);
      const lamp = { sym, g, paper, glow, lit: false, x, z };
      L.lamps.push(lamp);
      acts.push({ x, z, r: 1.9, icon: '🏮', ok: () => !lamp.lit && L.step >= 0 && !solved('lamp'), fn: () => lightLamp(lamp) });
    });
    // 에마 판 (그림 순서)
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const g2 = cv.getContext('2d');
    g2.fillStyle = '#e8cfa0'; g2.fillRect(0, 0, 512, 160); g2.strokeStyle = '#8a5a34'; g2.lineWidth = 10; g2.strokeRect(5, 5, 502, 150);
    g2.font = '74px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
    L.seq.forEach((s, i) => {
      g2.fillText(s, 70 + i * 124, 86);
      if (i < 3) { g2.fillStyle = '#8a5a34'; g2.beginPath(); g2.moveTo(122 + i * 124, 66); g2.lineTo(140 + i * 124, 80); g2.lineTo(122 + i * 124, 94); g2.fill(); }
    });
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const bg = new THREE.Group(); bg.position.set(cx, 0, cz); bg.rotation.y = Math.PI; scene.add(bg);
    for (const sd of [-1, 1]) mesh(GEO.box, wood, sd * 1.5, 1.1, 0, bg, 0.16, 2.2, 0.16);
    mesh(GEO.box, wood, 0, 2.3, 0, bg, 3.5, 0.14, 0.4);
    mesh(GEO.box, wood, 0, 1.45, 0, bg, 2.9, 0.95, 0.08);
    for (const sd of [1, -1]) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.88), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
      pl.position.set(0, 1.45, sd * 0.05); if (sd < 0) pl.rotation.y = Math.PI; bg.add(pl);
    }
    block(cx, cz, 1.6);
  }
  let _glow = null;
  function glowTex() {
    if (_glow) return _glow;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,230,170,1)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    _glow = new THREE.CanvasTexture(cv); return _glow;
  }
  function setLit(lamp, on) { lamp.lit = on; lamp.paper.emissiveIntensity = on ? 1.4 : 0.02; lamp.glow.material.opacity = on ? 0.9 : 0; }
  function lightLamp(lamp) {
    if (lamp.sym === L.seq[L.step]) {
      setLit(lamp, true); L.step++;
      AUD.sfx('chime', L.step);
      if (L.step === L.seq.length) done('lamp', DEF[1].x, DEF[1].z);
    } else {
      setLit(lamp, true); lamp.paper.emissive.setHex(0xff3020);
      AUD.sfx('fizzle');
      L.step = -1; L.resetT = 0.45;   // 잠깐 빨갛게 보였다가 전부 꺼진다
    }
  }
  function lampUpdate(dt) {
    if (L.resetT > 0 && (L.resetT -= dt) <= 0) {
      for (const q of L.lamps) { setLit(q, false); q.paper.emissive.setHex(0xffb050); }
      L.step = 0;
    }
  }

  // ═════ 3. 판다 동상: 셋 다 가운데를 보게 (하나 돌리면 옆 동상도 돈다) ═════
  const N = { st: [], o: [1, 2, 3] };
  function buildPanda() {
    const { x: cx, z: cz } = DEF[2];
    const stone = mat(0x9c988c), wh = mat(0xf4f2ec), bk = mat(0x1d1d20), bamboo = mat(0x7fae4a);
    // 가운데: 대나무 기둥 + 판다빵 간판
    mesh(GEO.cyl, bamboo, cx, 1.6, cz, null, 0.22, 3.2, 0.22);
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 70, 50, 0, 7); g.fill();
    g.fillStyle = '#111'; [[28, 30], [100, 30]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); });
    [[44, 64], [84, 64]].forEach(([x, y], i) => { g.beginPath(); g.ellipse(x, y, 11, 15, i ? -0.5 : 0.5, 0, 7); g.fill(); });
    g.beginPath(); g.arc(64, 88, 7, 0, 7); g.fill();
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv) }));
    sign.position.set(cx, 3.6, cz); sign.scale.setScalar(1.4); scene.add(sign);
    block(cx, cz, 0.4);
    [0, 1, 2].forEach(i => {
      const a = Math.PI / 2 + i * U.TAU / 3;
      const x = cx + Math.sin(a) * 4.4, z = cz + Math.cos(a) * 4.4;
      mesh(GEO.box, stone, x, 0.4, z, null, 1.3, 0.8, 1.3);
      const g3 = new THREE.Group(); g3.position.set(x, 0.8, z); scene.add(g3);
      mesh(GEO.sph, wh, 0, 0.6, 0, g3, 1.0, 1.1, 0.9);
      mesh(GEO.sph, wh, 0, 1.35, 0.1, g3, 0.8);
      for (const sd of [-1, 1]) {
        mesh(GEO.sph, bk, sd * 0.3, 1.68, 0.05, g3, 0.28);
        mesh(GEO.sph, bk, sd * 0.16, 1.4, 0.44, g3, 0.16, 0.2, 0.08);
        mesh(GEO.sph, bk, sd * 0.45, 0.75, 0.2, g3, 0.3, 0.55, 0.3);
        mesh(GEO.sph, bk, sd * 0.28, 0.15, 0.25, g3, 0.35, 0.3, 0.45);
      }
      mesh(GEO.sph, bk, 0, 1.25, 0.5, g3, 0.1, 0.08, 0.06);
      const gem = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0xff3020, emissiveIntensity: 0.6 });
      const lamp = mesh(GEO.sph, gem, x + Math.sin(Math.atan2(cx - x, cz - z)) * 0.7, 0.62, z + Math.cos(Math.atan2(cx - x, cz - z)) * 0.7, null, 0.42);
      block(x, z, 0.85);
      const s = { g: g3, gem, lamp, goal: Math.atan2(cx - x, cz - z), yaw: 0, x, z };
      s.yaw = s.goal + N.o[i] * Math.PI / 2; g3.rotation.y = s.yaw;
      N.st.push(s);
      acts.push({ x, z, r: 2.1, icon: '🔄', ok: () => !solved('panda'), fn: () => turnPanda(i) });
    });
    paintPanda();
  }
  function paintPanda() {
    N.st.forEach((s, i) => { const ok = N.o[i] === 0; s.gem.emissive.setHex(ok ? 0x40ff70 : 0xff3020); s.gem.emissiveIntensity = ok ? 1.2 : 0.6; });
  }
  function turnPanda(i) {
    N.o[i] = (N.o[i] + 1) % 4; N.o[(i + 1) % 3] = (N.o[(i + 1) % 3] + 1) % 4;
    AUD.sfx('grind');
    paintPanda();
    if (N.o.every(v => v === 0)) setTimeout(() => done('panda', DEF[2].x, DEF[2].z), 500);
  }
  function pandaUpdate(dt) {
    N.st.forEach((s, i) => {
      const want = s.goal + N.o[i] * Math.PI / 2;
      s.g.rotation.y = U.angTo(s.g.rotation.y, want, dt * 3.2);
    });
  }

  // ═════ 4. 분수 밸브: 물줄기 다섯을 다 켠다 (밸브 하나가 제 물줄기와 옆 물줄기를 바꾼다) ═════
  const F = { jets: [], valves: [], on: [1, 0, 0, 0, 0] };
  function buildFount() {
    const { x: cx, z: cz } = DEF[3];
    const water = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0x5aa8d8, emissiveIntensity: 0.35, transparent: true, opacity: 0.72, roughness: 0.1 });
    const red = mat(0xc8342a, { flatShading: false, roughness: 0.5 }), metal = mat(0x5a6068, { metalness: 0.5, roughness: 0.5 });
    const gp = PARK.groundPaint;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * U.TAU / 5;
      const jx = cx + Math.cos(a) * 4.4, jz = cz + Math.sin(a) * 4.4;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.6, 1, 12, 1, true), water);
      col.position.set(jx, 0.4, jz); scene.add(col);
      const cap = new THREE.Mesh(GEO.sph, water); cap.position.set(jx, 0.5, jz); cap.scale.setScalar(0.7); scene.add(cap);
      F.jets.push({ col, cap, h: 0.3 });
      // 밸브: 같은 방향 광장 바깥. 가로등·의자에 겹치면 조금 밀어낸다
      let R = 25.5, vx = 0, vz = 0;
      for (; R < 30; R += 0.5) {
        vx = cx + Math.cos(a) * R; vz = cz + Math.sin(a) * R;
        if (!PARK.C.circles.some(c => Math.hypot(c.x - vx, c.z - vz) < c.r + 1.2) && !PARK.C.boxes.some(b => Math.hypot(b.x - vx, b.z - vz) < Math.max(b.hw, b.hd) + 1.2) && !PARK.blocked(vx, vz, 0.8)) break;
      }
      mesh(GEO.cyl, metal, vx, 0.55, vz, null, 0.22, 1.1, 0.22);
      const wheel = new THREE.Mesh(GEO.torus, red); wheel.position.set(vx, 1.15, vz); wheel.rotation.y = a + Math.PI / 2; wheel.castShadow = true; scene.add(wheel);
      const hub = mesh(GEO.cyl, red, vx, 1.15, vz, null, 0.14, 0.2, 0.14); hub.rotation.x = Math.PI / 2; hub.rotation.z = a + Math.PI / 2;
      block(vx, vz, 0.5);
      F.valves.push({ wheel, x: vx, z: vz, spin: 0 });
      acts.push({ x: vx, z: vz, r: 2.0, icon: '🔄', ok: () => !solved('fount'), fn: () => turnValve(i) });
      // 땅에 밸브 → 물줄기 관 자국
      if (gp) {
        gp.g.strokeStyle = 'rgba(70,86,104,0.55)'; gp.g.lineWidth = 0.45 * gp.PX; gp.g.setLineDash([1.2 * gp.PX, 0.8 * gp.PX]);
        gp.g.beginPath(); gp.g.moveTo(gp.cx(vx), gp.cz(vz)); gp.g.lineTo(gp.cx(cx + Math.cos(a) * 8.2), gp.cz(cz + Math.sin(a) * 8.2)); gp.g.stroke(); gp.g.setLineDash([]);
      }
    }
    if (gp) gp.tex.needsUpdate = true;
  }
  function turnValve(i) {
    F.on[i] ^= 1; F.on[(i + 1) % 5] ^= 1;
    F.valves[i].spin += Math.PI;
    AUD.sfx('ratchet');   // 밸브 돌리는 드르륵 (9/14 사장님, 예전엔 물소리)
    if (F.on.every(v => v)) setTimeout(() => { done('fount', DEF[3].x, DEF[3].z); PARK.openTape(true); }, 600);
  }
  function fountUpdate(dt) {
    const t = T.time, all = solved('fount');
    F.jets.forEach((j, i) => {
      const want = F.on[i] ? (all ? 5.6 + Math.sin(t * 3 + i) * 1.4 : 4.8) : 0.3;
      j.h = U.damp(j.h, want, 4, dt);
      j.col.scale.y = j.h; j.col.position.y = 0.35 + j.h / 2;
      j.cap.position.y = 0.35 + j.h; j.cap.scale.setScalar(F.on[i] ? 1.1 + Math.sin(t * 9 + i) * 0.1 : 0.5);
    });
    F.valves.forEach(v => { v.wheel.rotation.z = U.damp(v.wheel.rotation.z, v.spin, 6, dt); });
  }

  // ═════ 공통 ═════
  function init(sc) {
    scene = sc;
    buildDuck(); buildLamp(); buildPanda(); buildFount();
    refresh();
  }
  // 저장된 풀이 상태를 장치에 칠한다 (새로 시작하면 처음으로)
  function refresh() {
    const s = id => solved(id);
    if (PL.ride) { PL.ride = null; PL.f.riding = ALLY.f.riding = false; PL.f.y = ALLY.f.y = 0; }
    D.boat.position.set(D.dockW.x, 0.12, D.dockW.z); D.vel.set(0, 0, 0);
    D.kids.forEach(k => { k.st = s('duck') ? 'home' : 'free'; if (!s('duck')) { k.x = k.hx; k.z = k.hz; } });
    L.resetT = 0; L.step = s('lamp') ? L.seq.length : 0; L.lamps.forEach(q => setLit(q, s('lamp') && L.seq.includes(q.sym)));
    N.o = s('panda') ? [0, 0, 0] : [1, 2, 3]; paintPanda();
    F.on = s('fount') ? [1, 1, 1, 1, 1] : [1, 0, 0, 0, 0];
  }

  function nearest() {
    const f = PL.f; let best = null, bd = 1e9;
    for (const a of acts) {
      const d = Math.hypot(a.x - f.pos.x, a.z - f.pos.z);
      if (d < a.r && d < bd && a.ok()) { bd = d; best = a; }
    }
    return best;
  }
  function nearAct() {
    if (T.mode !== 'play' || ZONE.active || !PL.f || PL.f.dead) return null;
    if (PL.ride) {
      // 뭍 찾기는 무거워서 0.25초마다
      if (T.time - (D.landT || -9) > 0.25) { D.landT = T.time; D.canLand = !!landSpot(); }
      return D.canLand ? { icon: '🚶' } : null;
    }
    return nearest();
  }
  function act() {
    if (T.mode !== 'play' || ZONE.active || PL.f.dead) return false;
    if (PL.ride) { unboard(); return true; }
    if (PL.f.state !== 'free') return false;
    const a = nearest(); if (!a) return false;
    a.fn(); return true;
  }
  // 다음 갈 곳이 퍼즐이면 그 자리
  function spotFor(g) {
    const d = forGate(g); if (!d || solved(d.id)) return null;
    return d.id === 'duck' ? Object.assign(D.spot, { puz: d }) : { x: d.x, z: d.z, name: d.name, puz: d };
  }

  function update(dt) {
    duckUpdate(dt); lampUpdate(dt); pandaUpdate(dt); fountUpdate(dt);
  }

  // 지도에 찍을 오리들: 아직 못 데려온 새끼(노랑)·엄마(갈색)
  function duckDots() {
    if (solved('duck') || !D.mom) return null;
    return { kids: D.kids.filter(k => k.st !== 'home').map(k => ({ x: k.x, z: k.z, follow: k.st === 'follow' })), mom: { x: D.mom.x, z: D.mom.z } };
  }

  Object.assign(PZ, { init, update, refresh, act, nearAct, solved, forGate, spotFor, duckDots });
  window.PUZ = PZ;
})();
