// town.js — 마을(보안관·감옥·술집·잡화점…)과 은신처 소품
(function () {
  const { S, loadGLB, fitStatic } = CORE; const { heightAt, addCol, rnd, rr, SITES, TOWN } = WORLD; const { M4, bake, merge, BIN, Kit, tex } = WORLD._;
  const V3 = THREE.Vector3, PI = Math.PI;
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const plank = tex(256, 256, (c, w) => { // 2m × 2m 널빤지(세로 여덟 장)
      c.fillStyle = '#d9d1c6'; c.fillRect(0, 0, w, w);
      for (let i = 0; i < 8; i++) { const x = i * 32, v = 205 + Math.random() * 40 | 0; c.fillStyle = `rgb(${v},${v - 5},${v - 12})`; c.fillRect(x, 0, 32, w);
        c.strokeStyle = 'rgba(90,66,48,.22)'; c.lineWidth = 1; for (let k = 0; k < 7; k++) { const gx = x + 3 + Math.random() * 26; c.beginPath(); c.moveTo(gx, 0); c.bezierCurveTo(gx + 3, w * 0.3, gx - 3, w * 0.7, gx + 1, w); c.stroke(); }
        c.fillStyle = 'rgba(40,26,18,.55)'; c.fillRect(x, 0, 2, w); c.fillStyle = 'rgba(255,250,240,.35)'; c.fillRect(x + 2, 0, 1, w);
        [20, 236].forEach(y => { c.fillStyle = 'rgba(40,30,24,.7)'; c.beginPath(); c.arc(x + 16, y, 2, 0, 7); c.fill(); });
        if (Math.random() < 0.5) { const ky = Math.random() * w; c.fillStyle = 'rgba(80,54,36,.35)'; c.beginPath(); c.ellipse(x + 10 + Math.random() * 12, ky, 4, 7, 0, 0, 7); c.fill(); } }
      const g = c.createLinearGradient(0, 0, 0, w); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,40,26,.16)'); c.fillStyle = g; c.fillRect(0, 0, w, w);
    });
    MAT = { wood: new THREE.MeshStandardMaterial({ map: plank, vertexColors: true, roughness: 0.92, metalness: 0, envMapIntensity: 0.3 }),
      plain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.3 }),
      glow: new THREE.MeshBasicMaterial({ vertexColors: true }) };
    return MAT;
  }
  function flush(name) { // 지금까지 모은 조각을 재질마다 한 덩어리로
    const out = {}; const M = mats();
    ['wood', 'plain', 'glow'].forEach(k => { if (!BIN[k].length) return; const me = new THREE.Mesh(merge(BIN[k], k === 'wood'), M[k]); BIN[k] = []; me.castShadow = k !== 'glow'; me.receiveShadow = k !== 'glow'; me.name = name + '-' + k; S.add(me); out[k] = me; });
    return out;
  }
  function sign(k, text, w, h, x, y, z, o) {
    o = o || {};
    const t = tex(512, Math.round(512 * h / w), (c, W, H) => {
      c.fillStyle = o.bg || '#ead9b0'; c.fillRect(0, 0, W, H); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(90,60,30,${Math.random() * 0.08})`; c.fillRect(Math.random() * W, Math.random() * H, 3 + Math.random() * 30, 1); }
      c.strokeStyle = o.fg || '#3a1d10'; c.lineWidth = 8; c.strokeRect(8, 8, W - 16, H - 16); c.lineWidth = 2; c.strokeRect(20, 20, W - 40, H - 40);
      c.fillStyle = o.fg || '#3a1d10'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = H * 0.62; c.font = `900 ${fs}px BHTitle, Georgia, serif`;
      const tw = c.measureText(text).width; if (tw > W - 70) { fs *= (W - 70) / tw; c.font = `900 ${fs}px BHTitle, Georgia, serif`; }
      c.fillText(text, W / 2, H / 2 + fs * 0.04);
    }, false);
    const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0, envMapIntensity: 0.2 }));
    me.applyMatrix4(k.base.clone().multiply(M4(x, y, z, o.ry || 0))); S.add(me); return me;
  }
  // 앞면이 +z 인 서부 가게: 몸통 + 가짜 정면 + 현관 지붕 + 문·창 + 간판
  function store(o) {
    const k = new Kit(o.x, o.z, o.ry), w = o.w, d = o.d, h = o.h, fz = d / 2, fh = h + 1.5, tr = o.trim || 0x5b4332, lit = o.glow === false ? 0x1c1612 : 0xffc66e;
    k.box(w, h, d, o.col, 0, 0, 0); k.box(w + 0.3, 0.22, d + 0.3, 0x574434, 0, h, 0);
    k.box(w + 0.5, fh, 0.3, o.col, 0, 0, fz + 0.05, { j: 0.05 }); k.box(w * 0.5, 0.7, 0.3, o.col, 0, fh, fz + 0.05); k.box(w + 0.8, 0.18, 0.5, tr, 0, fh - 0.02, fz + 0.05); k.box(w * 0.5 + 0.3, 0.16, 0.5, tr, 0, fh + 0.7, fz + 0.05);
    k.box(w + 0.4, 0.16, 2.6, 0x8d6e50, 0, 0, fz + 1.45);
    const n = Math.max(3, Math.round(w / 3.4)); for (let i = 0; i < n; i++) k.box(0.16, 2.72, 0.16, tr, -w / 2 + 0.2 + i * (w - 0.4) / (n - 1), 0.16, fz + 2.55);
    k.box(w + 0.6, 0.1, 2.95, 0x6b5240, 0, 2.86, fz + 1.5, { rx: 0.09 });
    if (o.two) { k.box(w + 0.4, 0.14, 2.4, 0x8d6e50, 0, 3.15, fz + 1.4); for (let i = 0; i < n * 2 - 1; i++) k.box(0.08, 0.8, 0.08, tr, -w / 2 + 0.2 + i * (w - 0.4) / (n * 2 - 2), 3.29, fz + 2.5); k.box(w + 0.4, 0.09, 0.12, tr, 0, 4.05, fz + 2.5); }
    // 문
    k.box(1.5, 2.4, 0.12, tr, 0, 0.16, fz + 0.2); k.box(1.2, 2.2, 0.14, o.swing ? 0x1c1612 : 0x3a2a20, 0, 0.16, fz + 0.22, { bin: 'plain', j: 0 });
    if (o.swing) [-0.31, 0.31].forEach(x => k.box(0.56, 0.9, 0.06, 0x9a6a40, x, 0.9, fz + 0.34));
    // 창
    const wins = [[-w * 0.3, 1.1], [w * 0.3, 1.1]]; if (o.two) wins.push([-w * 0.3, 4.0], [0, 4.0], [w * 0.3, 4.0]);
    wins.forEach(([x, y]) => { k.box(1.5, 1.5, 0.1, tr, x, y, fz + 0.2); k.box(1.24, 1.24, 0.12, lit, x, y + 0.13, fz + 0.22, { bin: o.glow === false ? 'plain' : 'glow', j: 0.25 }); k.box(0.07, 1.24, 0.14, tr, x, y + 0.13, fz + 0.23); k.box(1.24, 0.07, 0.14, tr, x, y + 0.72, fz + 0.23); });
    if (o.sign) sign(k, o.sign, Math.min(w * 0.86, 0.9 * o.sign.length + 1.2), 1.0, 0, o.two ? h + 0.7 : h + 0.62, fz + 0.23, { bg: o.signBg, fg: o.signFg });
    k.wall(-w / 2, w / 2, -d / 2, d / 2); return k;
  }
  function barrel(k, x, z, s) { s = s || 1; k.cyl(0.36 * s, 0.32 * s, 0.95 * s, 0x8a5c38, x, 0, z, { seg: 10 }); k.cyl(0.375 * s, 0.375 * s, 0.07, 0x3a302a, x, 0.2 * s, z, { seg: 10, j: 0 }); k.cyl(0.375 * s, 0.375 * s, 0.07, 0x3a302a, x, 0.68 * s, z, { seg: 10, j: 0 }); const p = k.world(x, z); addCol({ x: p.x, z: p.z, rx: 0.4 * s, rz: 0.4 * s, tag: 'barrel' }); }
  function crate(k, x, z, s, y) { s = s || 0.8; k.box(s, s, s, 0xa9824f, x, y || 0, z, { ry: rr(0, 1) }); if (!y) { const p = k.world(x, z); addCol({ x: p.x, z: p.z, rx: s * 0.6, rz: s * 0.6, tag: 'crate' }); } }
  function wagon(k, x, z, ry, cover, tilt) {
    const o = { ry, rz: tilt || 0 }, c = Math.cos(ry), s = Math.sin(ry), L = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    k.box(3.2, 0.5, 1.5, 0x8a623c, x, 0.85, z, o); k.box(3.2, 0.12, 1.6, 0x5b4332, x, 0.78, z, o);
    [[-1.1, 0.86], [1.1, 0.86], [-1.1, -0.86], [1.1, -0.86]].forEach(([lx, lz]) => { const [wx, wz] = L(lx, lz); k.put('plain', new THREE.TorusGeometry(0.58, 0.07, 6, 14), 0x4a372b, wx, 0.62, wz, { ry }); for (let a = 0; a < 3; a++) k.put('plain', new THREE.BoxGeometry(1.08, 0.06, 0.05), 0x6b5240, wx, 0.62, wz, { ry, rz: a * PI / 3 }); });
    if (cover) k.put('plain', new THREE.CylinderGeometry(0.85, 0.85, 2.9, 12, 1, true, 0, PI), 0xe9dfc8, x, 1.3, z, { ry: ry + PI / 2, rx: 0, rz: PI / 2, j: 0.06 });
    const [tx, tz] = L(2.3, 0); k.box(1.6, 0.08, 0.1, 0x5b4332, tx, 0.7, tz, { ry, rz: -0.25 });
    const p = k.world(x, z); addCol({ x: p.x, z: p.z, rx: 1.5, rz: 1.5, tag: 'wagon' });
  }
  const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.0, 0.25), transparent: true, opacity: 0.9, depthWrite: false });
  const flameGeo = (() => { const a = new THREE.ConeGeometry(0.32, 1.0, 7); a.translate(0, 0.5, 0); return a; })();
  WORLD.fires = [];
  function campfire(k, x, z, big) {
    const s = big ? 1.6 : 1;
    for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; k.put('plain', new THREE.IcosahedronGeometry(0.17 * s, 0), 0x8d8378, x + Math.cos(a) * 0.62 * s, 0.08, z + Math.sin(a) * 0.62 * s, { ry: a, j: 0.3 }); }
    for (let i = 0; i < 4; i++) k.put('plain', new THREE.CylinderGeometry(0.07 * s, 0.08 * s, 0.9 * s, 6), 0x3b2a20, x, 0.22 * s, z, { ry: i * 0.8, rx: 1.15 });
    const p = k.world(x, z), f = new THREE.Mesh(flameGeo, flameMat); f.position.set(p.x, heightAt(p.x, p.z) + 0.12, p.z); f.scale.setScalar(s); S.add(f); WORLD.fires.push({ m: f, s, ph: rnd() * 9 });
    const f2 = new THREE.Mesh(flameGeo, flameMat); f2.position.copy(f.position); f2.position.x += 0.12; f2.scale.setScalar(s * 0.6); S.add(f2); WORLD.fires.push({ m: f2, s: s * 0.6, ph: rnd() * 9 });
    addCol({ x: p.x, z: p.z, rx: 0.7 * s, rz: 0.7 * s, tag: 'fire' });
  }
  function tent(k, x, z, ry, col) {
    k.put('plain', new THREE.CylinderGeometry(0.02, 1.7, 2.1, 4, 1), col || 0xd9c9a2, x, 1.05, z, { ry: ry + PI / 4, j: 0.07, sx: 1, sy: 1, sz: 1.25 });
    k.put('plain', new THREE.CylinderGeometry(0.01, 0.6, 1.5, 3, 1), 0x2a1f18, x + Math.sin(ry) * 1.02, 0.74, z + Math.cos(ry) * 1.02, { ry: ry + PI, j: 0 });
    k.cyl(0.04, 0.04, 2.5, 0x5b4332, x, 0, z, { seg: 5 });
    const p = k.world(x, z); addCol({ x: p.x, z: p.z, rx: 1.35, rz: 1.35, tag: 'tent' });
  }
  function rails(k, x0, z0, x1, z1) {
    const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, px = Math.cos(a) * 0.55, pz = -Math.sin(a) * 0.55;
    [-1, 1].forEach(sd => k.put('plain', new THREE.BoxGeometry(0.08, 0.1, L), 0x4a4644, cx + px * sd, 0.17, cz + pz * sd, { ry: a, j: 0 }));
    for (let t = 0.5; t < L; t += 1.1) k.put('plain', new THREE.BoxGeometry(1.7, 0.1, 0.22), 0x5b4332, x0 + Math.sin(a) * t, 0.07, z0 + Math.cos(a) * t, { ry: a });
  }
  WORLD._.town = { mats, flush, sign, store, barrel, crate, wagon, campfire, tent, rails };
})();
