/* puzzles.js — 맵 곳곳의 퍼즐. 찾을 것은 빛나지 않는다. 헤매며 단서를 읽어야 나온다
 * 부적 8장: 발자국 따라가기 둘(등불을 켜야 보인다) · 푸른 손자국 둘(등불을 꺼야 보인다) · 똑똑 두드리는 장독 하나 · 석등 셋을 밝힌 비석 셋
 * 여동생 흔적: 머리카락이 휘감은 신발·비옷(소금으로 태운다) · 물레방아에 낀 통나무를 빼면 올라오는 머리끈 · 뒤집힌 배 뒤에서 등불을 끄면 보이는 손전등 */
(function () {
  const W = window.WORLD, PR = window.PROPS;
  const PZ = {};
  const rng = seed => { let s = Math.abs(seed | 0) % 2147483647 || 1; return () => (s = s * 16807 % 2147483647, (s - 1) / 2147483646); };
  const bank = (z, s, off) => W.cx(z) + s * (W.hw(z) + off);
  const used = id => W.used.has(id);
  const mesh = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(m); return m; };
  function tex(w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t; }
  const DS = THREE.DoubleSide;

  // ── 재질 ──
  const MT = {
    rock: new THREE.MeshLambertMaterial({ color: 0x565c5e, flatShading: true }),
    rockDk: new THREE.MeshLambertMaterial({ color: 0x3d4244, flatShading: true }),
    moss: new THREE.MeshLambertMaterial({ color: 0x323c30, flatShading: true }),
    wood: new THREE.MeshLambertMaterial({ color: 0x4d3a2a }),
    log: new THREE.MeshLambertMaterial({ color: 0x5e4a34, flatShading: true }),
    straw: new THREE.MeshLambertMaterial({ color: 0x8a7446 }),
    hanji: new THREE.MeshLambertMaterial({ color: 0xd6d0bc, side: DS }),
    pink: new THREE.MeshLambertMaterial({ color: 0xa4506c, side: DS, flatShading: true }),
    steel: new THREE.MeshLambertMaterial({ color: 0x6a6e70 }),
    jar: new THREE.MeshPhongMaterial({ color: 0x46301f, specular: 0x2c241c, shininess: 16, side: DS }),
    lid: new THREE.MeshPhongMaterial({ color: 0x35241a, specular: 0x241c16, shininess: 12, side: DS }),
    slab: new THREE.MeshLambertMaterial({ color: 0x40423e, flatShading: true }),
    hair: new THREE.MeshPhongMaterial({ color: 0x0b0a0a, specular: 0x4c5458, shininess: 60 }),
  };

  // ── 그림 ──
  // 아이 장화 자국 — 둥근 앞코, 가로 줄무늬 바닥, 좁은 뒤꿈치
  const bootTex = tex(64, 128, (c) => {
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(32, 40, 22, 30, 0, 0, 6.283); c.fill();
    c.beginPath(); c.ellipse(33, 98, 16, 22, 0, 0, 6.283); c.fill();
    c.fillRect(19, 44, 28, 52);
    c.globalCompositeOperation = 'destination-out';
    for (let y = 16; y < 118; y += 9) { c.fillRect(8, y, 48, 3); }           // 바닥 무늬
    c.fillRect(8, 70, 48, 6);                                                // 굽 사이
    for (let i = 0; i < 90; i++) { c.globalAlpha = Math.random() * .5; c.beginPath(); c.arc(Math.random() * 64, Math.random() * 128, 1 + Math.random() * 2, 0, 6.283); c.fill(); }
  });
  // 젖은 손바닥 자국 — 손가락 다섯, 아래로 흘러내린 물줄기, 거친 가장자리
  const handTex = tex(128, 176, (c) => {
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(66, 106, 30, 34, .05, 0, 6.283); c.fill();
    const finger = (bx, by, a, len, wd) => { c.save(); c.translate(bx, by); c.rotate(a); c.beginPath(); if (c.roundRect) c.roundRect(-wd / 2, -len, wd, len + 8, wd / 2); else c.rect(-wd / 2, -len, wd, len + 8); c.fill(); c.restore(); };
    finger(46, 84, -.32, 46, 11); finger(60, 76, -.08, 56, 11.5); finger(74, 77, .12, 52, 11); finger(87, 86, .34, 40, 10);
    finger(38, 112, -1.05, 34, 13);                                          // 엄지
    for (let i = 0; i < 7; i++) { const x = 42 + Math.random() * 50, y0 = 128 + Math.random() * 8, L = 12 + Math.random() * 30; c.fillRect(x, y0, 2.6, L); c.beginPath(); c.arc(x + 1.3, y0 + L, 3, 0, 6.283); c.fill(); }
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 260; i++) { c.globalAlpha = Math.random() * .7; c.beginPath(); c.arc(Math.random() * 128, Math.random() * 176, .8 + Math.random() * 2.4, 0, 6.283); c.fill(); }
  });

  // ── 부적 — 돌에 눌려 놓인 종이 한 장. 스스로 빛나지 않는다 ──
  function charmMesh(i, x, y, z, yaw, dark) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw;
    const mat = dark
      ? new THREE.MeshBasicMaterial({ map: W.charmTex(), color: 0x6f8e86, side: DS })        // 캄캄할 때만 희미하게 떠오른다
      : new THREE.MeshLambertMaterial({ map: W.charmTex(), color: 0xbdb49a, side: DS });
    const paper = mesh(new THREE.PlaneGeometry(.34, .56), mat, 0, .25, 0, g); paper.rotation.x = -.55;
    mesh(new THREE.DodecahedronGeometry(.08, 0), MT.rockDk, 0, .05, .16, g);
    g.userData = { charm: { i }, paper };
    return g;
  }
  const faceWater = s => Math.atan2(-s, 0);   // 물 쪽을 보는 방향

  // ── 퍼즐 목록 ──
  function makePrints(id, charm, z0, s, seed) {
    const r = rng(seed), segs = [[], []];
    let z = z0;
    segs[0].push({ x: bank(z, s, .3), z });
    for (let k = 0; k < 7; k++) { z += 2.3 + r() * .9; segs[0].push({ x: bank(z, s, k % 2 ? 4.0 + r() * .8 : 1.2 + r() * .8), z }); }
    segs[0].push({ x: bank(z + 2.4, s, -1.2), z: z + 2.4 });   // 물로 들어간다 — 발자국이 끊긴다
    z += 12 + r() * 4;
    const s2 = -s;
    for (let k = 0; k < 6; k++) { segs[1].push({ x: bank(z, s2, k === 0 ? -.8 : (k % 2 ? 1.1 + r() * .7 : 3.8 + r() * .8)), z }); z += 2.3 + r() * .8; }
    const end = { x: bank(z, s2, 4.6), z };
    segs[1].push({ x: bank(z - .8, s2, 3.4), z: z - .8 });
    const prints = [];
    for (const seg of segs) {
      let side = 1;
      for (let k = 0; k + 1 < seg.length; k++) {
        const a = seg[k], b = seg[k + 1], L = Math.hypot(b.x - a.x, b.z - a.z), yaw = Math.atan2(b.x - a.x, b.z - a.z), n = Math.floor(L / .6);
        for (let j = 0; j < n; j++) { const f = (j + .5) / n, px = a.x + (b.x - a.x) * f, pz = a.z + (b.z - a.z) * f; prints.push({ x: px + Math.cos(yaw) * .1 * side, z: pz - Math.sin(yaw) * .1 * side, yaw: yaw + (r() - .5) * .18, side }); side = -side; }
      }
    }
    return { id, type: 'prints', charm, z0, s, s2, prints, umbrella: { x: bank(z0 - 1, s, .9), z: z0 - 1, rot: r() * 6 }, end, zA: z0 - 4, zB: end.z + 4 };
  }
  function makeHands(id, charm, z0, s, seed) {
    const r = rng(seed), stones = []; let z = z0;
    for (let k = 0; k < 3; k++) { stones.push({ x: bank(z, s, 4.2 + r() * 1.2), z, r: .9 + r() * .3 }); z += 5.5 + r() * 2; }
    for (let k = 0; k < 2; k++) { stones.push({ x: W.cx(z) + s * W.hw(z) * (k ? -.32 : .3), z, r: 1.2, mid: true }); z += 6.5 + r() * 2; }
    for (let k = 0; k < 3; k++) { stones.push({ x: bank(z, -s, 4.0 + r() * 1.2), z, r: .9 + r() * .3 }); z += 5.5 + r() * 2; }
    const end = { x: bank(z, -s, 4.0), z };
    const rope = { x: bank(z0 - 7, s, 2.2), z: z0 - 7 };
    stones.forEach((st, k) => { const prev = k ? stones[k - 1] : rope, dx = prev.x - st.x, dz = prev.z - st.z, d = Math.hypot(dx, dz) || 1; st.fx = dx / d; st.fz = dz / d; });
    return { id, type: 'hands', charm, z0, s, s2: -s, stones, end, rope, zA: z0 - 11, zB: end.z + 4 };
  }
  function makeJars(id, charm, z0, s) {
    const jars = [], SC = [1.05, .85, 1.2, .95, 1.1, .8, 1.0, 1.15, .9];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) { const z = z0 + (col - 1) * 1.3 + (row % 2) * .35; jars.push({ x: bank(z, s, 2.5 + row * 1.25), z, sc: SC[row * 3 + col] }); }
    return { id, type: 'jars', charm, z0, s, jars, right: 7, zA: z0 - 7, zB: z0 + 7, knockT: 1 };
  }
  const SITES = PR.SITES;
  const DEF = [
    makePrints('Z0', 0, Math.round(84 * W.ZS), 1, 7101),
    { id: 'Z1', type: 'stele', charm: 1, site: SITES[0] },
    makeJars('Z2', 2, Math.round(572 * W.ZS), -1),
    makeHands('Z3', 3, Math.round(690 * W.ZS), 1, 7303),
    { id: 'Z4', type: 'stele', charm: 4, site: SITES[1] },
    makePrints('Z5', 5, Math.round(1004 * W.ZS), -1, 7505),
    { id: 'Z6', type: 'stele', charm: 6, site: SITES[2] },
    makeHands('Z7', 7, Math.round(1486 * W.ZS), -1, 7707),
    { id: 'H0', type: 'hair', mark: 'bridge' },
    { id: 'H1', type: 'hair', mark: 'falls' },
    { id: 'M0', type: 'mill', mark: 'mill' },
    { id: 'B0', type: 'boat', mark: 'boat' },
  ];
  PZ.DEF = DEF;

  // ── 돌탑 — 아이가 들어가 숨을 수 있는 속 빈 돌무더기. 물귀신은 들어오지 못한다 ──
  const TOWERS = [];
  function mkTower(z, s, shrine) {
    const x = bank(z, s, 3.0), dx = W.cx(z) - x, dz = -2.2, l = Math.hypot(dx, dz);
    let y = W.terrainH(x, z); for (let i = 0; i < 8; i++) { const a = i * .785; y = Math.min(y, W.terrainH(x + Math.sin(a) * 1.8, z + Math.cos(a) * 1.8)); }
    return { id: '', type: 'tower', x, z, s, dx: dx / l, dz: dz / l, y, shrine };
  }
  {
    const busyT = z => W.MARKS.some(m => Math.abs(m.z - z) < 24 * W.ZS) || DEF.some(d => d.zA !== undefined && z > d.zA - 6 && z < d.zB + 6)
      || SITES.some(st => Math.abs(st.z - z) < 30 * W.ZS) || PR.SLUICE.some(sl => Math.abs(sl.wz - z) < 10 || Math.abs(sl.gz - z) < 10)   // 수문은 바퀴·둑 둘레만 — 구간 전체를 비우니 초반 300m 에 탑이 없었다
      || Math.abs(W.CAMP_Z - z) < 18;   // 야영지 — 맵을 줄인 뒤 탑이 천막 옆(240/246)에 붙었다(2026-09-16)
    let side = 1;
    for (let z0 = 44; z0 < W.END - 60; z0 += Math.round(70 * W.ZS)) {   // 간격도 맵 배율대로
      let z = z0; for (let k = 0; k < 16 && busyT(z); k++) z += (k % 2 ? -1 : 1) * 7 * (k + 1);   // 앞뒤로 번갈아 빈자리를 찾는다
      if (busyT(z) || TOWERS.some(o => Math.abs(o.z - z) < 50 * W.ZS)) continue;
      const s = side; side = -side;
      TOWERS.push(mkTower(z, s));
    }
    // 서낭당 가기 바로 전 — 여기서 숨었다가 서낭당까지 달린다 (둘레 퍼즐을 비켜 물가 쪽을 골랐다)
    [[160, 124, 1], [620, 580, 1], [1100, 1062, -1], [1590, 1556, 1]].map(([a, b, c]) => [Math.round(a * W.ZS), Math.round(b * W.ZS), c]).forEach(([mz, z, s]) => {
      for (let i = TOWERS.length - 1; i >= 0; i--) if (Math.abs(TOWERS[i].z - z) < 45 * W.ZS) TOWERS.splice(i, 1);
      TOWERS.push(mkTower(z, s, mz));
    });
    TOWERS.sort((a, b) => a.z - b.z); TOWERS.forEach((t, i) => t.id = 'T' + i);
  }
  DEF.push(...TOWERS);
  PZ.TOWERS = TOWERS;
  PZ.hideAt = (px, pz) => { for (const t of TOWERS) if (Math.abs(t.z - pz) < 2.2 && Math.hypot(px - t.x, pz - t.z) < 1.95) return t; return null; };   // 탑 안 어디든(벽 안쪽까지 1.78m + 문턱) — 1.05 였을 땐 안에 서 있어도 잡혀갔다(2026-09-16)
  W.CHARM_N = 8;
  W.CHARM_SPOTS = [];
  W.pickCharms = () => new Set([0, 1, 2, 3, 4, 5, 6, 7]);
  W.puzBusy = z => DEF.some(d => (d.zA !== undefined && z > d.zA && z < d.zB) || (d.type === 'tower' && Math.abs(d.z - z) < 6));

  // 흔적 자리 옮기기 — 머리끈은 물레바퀴 아래, 손전등은 뒤집힌 배 뒤에 숨는다
  { const mm = W.MARKS.find(m => m.t === 'mill'); const toward = mm.x > W.cx(mm.z) ? -1 : 1; mm.item.x = mm.x + toward * 2.7; mm.item.z = mm.z + 3.8; mm.toward = toward; }
  { const bm = W.MARKS.find(m => m.t === 'boat'); bm.item.x = W.cx(bm.z) + 4.1; bm.item.z = bm.z + 3.6; }

  // ── 짓기 ──
  const B = {
    prints(d, g, u, inR) {
      if (inR(d.umbrella.z)) {   // 물가에 뒤집혀 나뒹구는 분홍 우산 — 폭우 날 여동생 것
        const p = d.umbrella, gy = W.groundH(p.x, p.z), ug = new THREE.Group(); ug.position.set(p.x, gy, p.z); ug.rotation.y = p.rot; g.add(ug);
        const tilt = new THREE.Group(); tilt.position.y = .3; tilt.rotation.z = 1.35; ug.add(tilt);
        mesh(new THREE.ConeGeometry(.52, .26, 8, 1, true), MT.pink, 0, .13, 0, tilt);
        for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, rib = mesh(new THREE.CylinderGeometry(.006, .006, .56, 3), MT.steel, Math.cos(a) * .25, .12, Math.sin(a) * .25, tilt); rib.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); }
        mesh(new THREE.CylinderGeometry(.011, .011, .8, 5), MT.steel, 0, -.2, 0, tilt);
        const hook = mesh(new THREE.TorusGeometry(.05, .014, 5, 10, Math.PI), MT.pink, .05, -.6, 0, tilt); hook.rotation.z = Math.PI;
        const sh = mesh(new THREE.CircleGeometry(.55, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }), p.x, gy + .03, p.z, g); sh.rotation.x = -Math.PI / 2;   // 땅에 닿은 그림자
        u.rocks.push({ x: p.x, z: p.z, r: .35 + 1.7 });
      }
      const geo = new THREE.PlaneGeometry(.14, .28); geo.rotateX(-Math.PI / 2);
      for (const p of d.prints) {
        if (!inR(p.z)) continue;
        const gy = W.groundH(p.x, p.z); if (gy < W.height(p.x, p.z, 0) + .03) continue;
        const m = mesh(geo, new THREE.MeshPhongMaterial({ color: 0x0b0d0e, specular: 0x5a6a70, shininess: 80, alphaMap: bootTex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), p.x, gy + .025, p.z, g);
        m.rotation.y = p.yaw; m.scale.x = p.side; m.visible = false; m.renderOrder = 2;
        u.pz.push({ kind: 'print', x: p.x, z: p.z, m });
      }
      if (inR(d.end.z)) {   // 비탈 밑 바위 틈 — 물길에서는 안 보인다
        const e = d.end, s2 = d.s2;
        for (const [ox, oz, rr, mat] of [[1.5, 0, 1.55, MT.rock], [.3, -1.7, 1.0, MT.moss], [.5, 1.6, 1.1, MT.rockDk], [-.6, 2.6, .7, MT.rock]]) {
          const x = e.x + s2 * ox, z = e.z + oz, rk = mesh(new THREE.DodecahedronGeometry(rr, 0), mat, x, W.groundH(x, z) + rr * .45, z, g);
          rk.rotation.set(ox * 2, oz, rr); rk.scale.y = .85; u.rocks.push({ x, z, r: rr * .85 + 1.7 });
        }
        if (!W.charmTaken.has(d.charm)) { const x = e.x - s2 * .25; const c = charmMesh(d.charm, x, W.groundH(x, e.z), e.z, faceWater(s2)); g.add(c); u.charms.push(c); u.pz.push({ kind: 'charm', c, show: () => true }); }
      }
    },
    hands(d, g, u, inR) {
      if (inR(d.rope.z)) {   // 금줄 — 말뚝 둘 사이에 새끼줄, 흰 종이가 매달렸다
        const p = d.rope, grp = new THREE.Group(); grp.position.set(p.x, W.groundH(p.x, p.z), p.z); g.add(grp);
        const pts = [];
        for (const dz of [-1.3, 1.3]) { const st = mesh(new THREE.CylinderGeometry(.05, .07, 1.5, 6), MT.wood, 0, .72, dz, grp); st.rotation.x = dz * .05; u.rocks.push({ x: p.x, z: p.z + dz, r: .1 + 1.7 }); }
        for (let i = 0; i <= 8; i++) { const f = i / 8, dz = -1.3 + f * 2.6; pts.push(new THREE.Vector3(0, 1.36 - Math.sin(f * Math.PI) * .32, dz)); }
        mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .028, 5), MT.straw, 0, 0, 0, grp);
        for (let i = 1; i < 8; i++) { const q = pts[i], strip = mesh(new THREE.PlaneGeometry(.07, i % 2 ? .24 : .16), MT.hanji, .02, q.y - .12, q.z, grp); strip.rotation.set(0, Math.PI / 2, (i % 3 - 1) * .1); }
      }
      const hg = new THREE.PlaneGeometry(.36, .5);
      for (const st of d.stones) {
        if (!inR(st.z)) continue;
        const base = st.mid ? Math.max(W.terrainH(st.x, st.z), -.35) + st.r * .32 : W.groundH(st.x, st.z) + st.r * .42;
        const rk = mesh(new THREE.DodecahedronGeometry(st.r, 1), st.mid ? MT.rockDk : MT.rock, st.x, base, st.z, g); rk.rotation.set(st.x, st.z, 0); rk.scale.y = .82;
        u.rocks.push({ x: st.x, z: st.z, r: st.r * .92 + 1.7 });
        const hy = Math.max(base + st.r * .28, W.height(st.x, st.z, 0) + .35);
        const m = mesh(hg, new THREE.MeshBasicMaterial({ map: handTex, color: 0xa2eedd, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: DS, fog: false }), st.x + st.fx * st.r * 1.0, hy, st.z + st.fz * st.r * 1.0, g);
        m.lookAt(st.x + st.fx * 9, hy + .6, st.z + st.fz * 9); m.rotateZ((st.z * 7 % 1) - .5); m.visible = false; m.renderOrder = 5;
        u.pz.push({ kind: 'hand', x: st.x, z: st.z, m, ph: st.z });
      }
      if (inR(d.end.z)) {   // 굿당 — 판돌 제단, 정화수 그릇, 돌탑
        const e = d.end, s2 = d.s2, gy = W.groundH(e.x, e.z), grp = new THREE.Group(); grp.position.set(e.x, gy, e.z); grp.rotation.y = faceWater(s2); g.add(grp);
        for (const dx of [-.55, .55]) mesh(new THREE.BoxGeometry(.32, .42, .42), MT.rockDk, dx, .21, 0, grp).rotation.y = dx;
        const slab = mesh(new THREE.BoxGeometry(1.6, .14, .82), MT.slab, 0, .49, 0, grp); slab.rotation.z = .03;
        mesh(new THREE.CylinderGeometry(.13, .09, .1, 12), new THREE.MeshPhongMaterial({ color: 0xcfd4d0, shininess: 70 }), .5, .61, -.1, grp);
        for (const [dx, n] of [[-1.3, 4], [1.25, 3]]) for (let k = 0; k < n; k++) { const r = .26 - k * .045; mesh(new THREE.DodecahedronGeometry(r, 0), MT.rock, dx, r * .8 + k * .3, -.25, grp).rotation.y = k; }
        u.rocks.push({ x: e.x, z: e.z, r: .9 + 1.7 });
        if (!W.charmTaken.has(d.charm)) {   // 제단 판돌 위 — 줍는 거리는 청크 좌표로 재니 청크에 바로 붙인다
          const c = charmMesh(d.charm, e.x, gy + .56, e.z, faceWater(s2) + .3, true); c.visible = false; g.add(c);
          u.charms.push(c); u.pz.push({ kind: 'charm', c, show: lit => !lit });
        }
      }
    },
    jars(d, g, u, inR) {
      if (!inR(d.z0)) return;
      const s = d.s, px = bank(d.z0, s, 3.75), grp = new THREE.Group(); g.add(grp);
      const plat = mesh(new THREE.BoxGeometry(4.2, .22, 4.6), MT.slab, px, W.groundH(px, d.z0) + .06, d.z0, grp); plat.rotation.y = .04;
      const prof = [[0, 0], [.22, .01], [.33, .1], [.42, .3], [.45, .46], [.41, .6], [.3, .72], [.23, .76], [.23, .81], [.2, .82]].map(p => new THREE.Vector2(p[0], p[1]));
      const jarGeo = new THREE.LatheGeometry(prof, 16), lidGeo = new THREE.LatheGeometry([[0, .1], [.12, .098], [.2, .08], [.26, .035], [.28, 0], [.24, -.02]].map(p => new THREE.Vector2(p[0], p[1])), 16);
      const parts = [];
      d.jars.forEach((j, k) => {
        const y = W.groundH(j.x, j.z) + .17, jm = mesh(jarGeo, MT.jar, j.x, y, j.z, grp); jm.scale.setScalar(j.sc); jm.rotation.y = k;
        const lid = mesh(lidGeo, MT.lid, j.x, y + .81 * j.sc, j.z, grp); lid.scale.setScalar(j.sc);
        u.rocks.push({ x: j.x, z: j.z, r: .45 * j.sc + 1.7 });
        parts.push({ j, jm, lid, y, k });
      });
      const piece = { kind: 'jars', d, x: px, z: d.z0, parts, lidT: used(d.id) ? 9 : -1, jig: 0, hold: 0 };
      u.pz.push(piece);
      if (!W.charmTaken.has(d.charm)) {
        const R = d.jars[d.right], x = R.x + s * .15, zc = R.z + .72;
        const c = charmMesh(d.charm, x, W.groundH(x, zc) + .1, zc, faceWater(s)); g.add(c); u.charms.push(c);
        u.pz.push({ kind: 'charm', c, show: () => piece.lidT > 1.1 });   // 뚜껑이 떨어지고 한 박자 뒤
      }
    },
    stele(d, g, u, inR) {
      const st = d.site.st; if (!inR(st.z) || W.charmTaken.has(d.charm)) return;
      const x = st.x - d.site.s * 1.15, c = charmMesh(d.charm, x, W.groundH(x, st.z) + .02, st.z + .3, faceWater(d.site.s)); g.add(c); u.charms.push(c);
      u.pz.push({ kind: 'charm', c, show: () => used(d.site.id) });
    },
    hair(d, g, u, inR) {
      const m = W.MARKS.find(mm => mm.t === d.mark); if (!inR(m.item.z) || W.taken.has(m.i)) return;
      const item = u.items.find(it => it.userData.item === m.item); if (!item) return;
      const it = m.item, bed = Math.max(W.terrainH(it.x, it.z), -.3), top = bed + .08 + .62 * .52 * .8;
      const grp = new THREE.Group(); grp.position.set(it.x, 0, it.z); g.add(grp);
      const r = rng(it.z * 13 | 0), mats = [], HR = window.HAIR;
      const mat = HR.mat({ amp: .05 }); mats.push(mat);
      const out = HR.begin(), c0 = top + .02, up = new THREE.Vector3(0, 1, 0);
      // 1) 물건을 칭칭 감은 타래 — 띠가 물건 겉면에 눕는다(법선 = 바깥쪽)
      for (let k = 0; k < 40; k++) {
        const a0 = r() * 6.283, turns = .7 + r() * .9, pts = [], rad = .13 + r() * .07, y0 = c0 + .12 + r() * .06;
        for (let j = 0; j <= 7; j++) { const f = j / 7, a = a0 + f * turns * 6.283, rr = rad + Math.sin(f * 9 + k) * .015; pts.push(new THREE.Vector3(Math.sin(a) * rr * 1.25, y0 - f * .2, Math.cos(a) * rr)); }
        HR.card(out, pts, HR.fan(.025, .05), (f, p, n) => n.set(p.x, 0, p.z).normalize(), r() * 6);
      }
      // 2) 타래에서 풀려 바위를 넘어 물속으로 — 물살 아래쪽(-z)으로 쏠려 구불구불
      for (let k = 0; k < 70; k++) {
        const a0 = r() * 6.283, L = .9 + r() * 1.5, dir = a0 + (Math.PI - a0) * .35 * r(), pts = [];
        for (let j = 0; j <= 8; j++) {
          const f = j / 8, rr = .16 + f * L, aa = dir * (1 - f * .3) + Math.PI * f * .3 + Math.sin(f * 6 + k) * .22;
          const y = f < .3 ? c0 + .06 - f * .25 : Math.max(bed + .03, c0 - .05 - (f - .3) * 1.4);   // 바위 겉을 타고 내려가 물 밑으로
          pts.push(new THREE.Vector3(Math.sin(aa) * rr, Math.min(y, f > .55 ? -.02 - (f - .55) * .15 : 9), Math.cos(aa) * rr));
        }
        HR.card(out, pts, HR.fan(.03, .09 + r() * .05), (f, p, n) => n.set(p.x, f < .55 ? .45 : 2.5, p.z).normalize(), r() * 6);   // 바위 옆을 탈 땐 겉면에 눕고, 물에선 수면에 눕는다
      }
      // 3) 제멋대로 뻗은 잔머리
      for (let k = 0; k < 16; k++) {
        const a0 = r() * 6.283, pts = [];
        for (let j = 0; j <= 5; j++) { const f = j / 5, rr = .15 + f * (.25 + r() * .2); pts.push(new THREE.Vector3(Math.sin(a0 + f * 2.2) * rr, c0 + .1 + Math.sin(f * 3) * .08, Math.cos(a0 + f * 2.2) * rr)); }
        HR.card(out, pts, () => .018, null, r() * 6);
      }
      const hm = new THREE.Mesh(HR.end(out), mat); hm.position.y = 0; grp.add(hm);
      const locked = !used(d.id); item.userData.locked = locked; grp.visible = locked;
      u.pz.push({ kind: 'hair', d, item, grp, mats, x: it.x, z: it.z, y: top, burn: locked ? -1 : 9, cool: 0 });
    },
    mill(d, g, u, inR) {
      const m = W.MARKS.find(mm => mm.t === 'mill'); if (!inR(m.z)) return;
      const wi = u.spin.length - 1; if (wi < 0) return;
      const wheel = u.spin[wi]; u.spin.splice(wi, 1);   // 통나무를 빼기 전엔 돌지 않는다
      const wx = m.x + m.toward * 2.9, wy = W.terrainH(m.x, m.z);
      const ly = Math.max(W.groundH(wx, m.z - 1.25), W.height(wx, m.z - 1.25, 0)) + .45;
      const log = mesh(new THREE.CylinderGeometry(.22, .26, 3.2, 8), MT.log, wx, ly, m.z - 1.25, g);   // 바퀴살 사이에 비스듬히 끼었다
      log.rotation.set(.12, .25, Math.PI / 2 - .5);
      for (let i = 0; i < 3; i++) { const br = mesh(new THREE.CylinderGeometry(.03, .06, .7, 4), MT.log, (i - 1) * .7, .2, 0, log); br.rotation.x = (i - 1) * .8; }   // 잔가지
      const item = u.items.find(it => it.userData.item === m.item);
      const done = used(d.id);
      if (item && !done) item.visible = false;
      if (done) log.visible = false;
      u.pz.push({ kind: 'mill', d, m, wheel, log, item, x: wx, z: m.z - 1.25, prog: 0, t: done ? 99 : -1, spin: done ? .35 : 0, lx: wx, lz: m.z - 1.25, ly });
    },
    boat(d, g, u, inR) {
      const m = W.MARKS.find(mm => mm.t === 'boat'); if (!inR(m.item.z) || W.taken.has(m.i)) return;
      const item = u.items.find(it => it.userData.item === m.item); if (!item || !item.userData.beam) return;
      item.children[0].rotation.y = -Math.PI / 2;   // 불빛이 배 밑에서 물길 아래쪽(오는 쪽)으로 새어 나오게
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xfff0c8, transparent: true, opacity: 0, depthWrite: false, fog: false })); glow.scale.set(1.3, 1.3, 1); glow.position.set(0, .45, 0); glow.visible = false; item.add(glow);
      const pool = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xffe6b0, transparent: true, opacity: 0, depthWrite: false, fog: false })); pool.scale.set(2.8, 1.0, 1); pool.position.set(.5, .2, -3.3); pool.visible = false; item.add(pool);   // 배 밑으로 새어 나와 물 위에 번진 빛
      u.pz.push({ kind: 'boat', item, beam: item.userData.beam, glow, pool, x: m.item.x, z: m.item.z });
    },
    tower(d, g, u, inR) {
      if (!inR(d.z)) return;
      const r = rng(d.z * 7 | 0), doorA = Math.atan2(d.dx, d.dz), N = 190;
      const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), MT.rock, N); im.frustumCulled = false;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
      let n = 0;
      const LAY = 10;
      for (let L = 0; L < LAY && n < N; L++) {   // 아래는 넓고 위로 갈수록 좁아지는 돌무더기, 아래 다섯 켜에 문
        const f = L / (LAY - 1), R = 2.0 - f * 1.6, y = d.y + .16 + L * .33, cnt = Math.max(4, Math.round(6.283 * R / .6));
        for (let i = 0; i < cnt && n < N; i++) {
          const a = (i + (L % 2) * .5) / cnt * 6.283, da = Math.atan2(Math.sin(a - doorA), Math.cos(a - doorA));
          if (L < 5 && Math.abs(da) < .6) continue;
          p.set(d.x + Math.sin(a) * R, y + (r() - .5) * .07, d.z + Math.cos(a) * R);
          e.set((r() - .5) * .5, a + (r() - .5) * .5, (r() - .5) * .4); q.setFromEuler(e);
          const s = .29 + r() * .13; sc.set(s * 1.3, s * .6, s * 1.05);
          m4.compose(p, q, sc); im.setMatrixAt(n++, m4);
        }
      }
      { const R = 2.0 - 5 / (LAY - 1) * 1.6; p.set(d.x + d.dx * R, d.y + .16 + 5 * .33 - .08, d.z + d.dz * R); e.set(0, doorA + Math.PI / 2, 0); q.setFromEuler(e); sc.set(1.0, .16, .34); m4.compose(p, q, sc); im.setMatrixAt(n++, m4); }   // 문 위 긴 돌
      { p.set(d.x, d.y + .16 + LAY * .33, d.z); q.identity(); sc.set(.34, .3, .34); m4.compose(p, q, sc); im.setMatrixAt(n++, m4); }                     // 꼭대기 돌
      im.count = n; g.add(im);
      const fl = mesh(new THREE.CircleGeometry(1.5, 16), new THREE.MeshLambertMaterial({ color: 0x1c201e }), d.x, d.y + .04, d.z, g); fl.rotation.x = -Math.PI / 2;   // 안쪽 흙바닥
      for (let i = 0; i < 16; i++) {   // 벽 — 문 자리만 비운다
        const a = i / 16 * 6.283, da = Math.atan2(Math.sin(a - doorA), Math.cos(a - doorA));
        if (Math.abs(da) < .78) continue;
        u.rocks.push({ x: d.x + Math.sin(a) * 2.05, z: d.z + Math.cos(a) * 2.05, r: .5 + 1.7 });
      }
    },
  };
  PZ.build = function (ci, z0, z1, g) {
    const u = g.userData; u.pz = [];
    const inR = z => z >= z0 && z < z1;
    for (const d of DEF) B[d.type](d, g, u, inR);
  };
  function* pieces() { for (const ch of W.chunks.values()) if (ch.userData.pz) yield* ch.userData.pz; }

  // ── 매 프레임 (놀이 중) ──
  PZ.tick = function (c) {
    const { P, G, dt, A } = c;
    for (const e of pieces()) {
      const d = Math.hypot(P.x - e.x, P.z - e.z);
      if (e.kind === 'jars' && e.lidT < 0) {
        // 똑… 똑똑. 안에서 무언가 두드린다 — 가까울수록 크게, 소리 나는 쪽으로 기운다
        const R = e.parts[e.d.right], dj = Math.hypot(P.x - R.j.x, P.z - R.j.z);
        if (dj < 26) {
          e.d.knockT -= dt;
          if (e.d.knockT <= 0) {
            e.d.knockT = 2.2 + Math.random() * 1.6;
            const yaw = c.camYaw, rx = -Math.cos(yaw), rz = Math.sin(yaw), ux = (R.j.x - P.x) / (dj || 1), uz = (R.j.z - P.z) / (dj || 1);
            A.knock(Math.pow(1 - dj / 26, 1.5), Math.max(-1, Math.min(1, (ux * rx + uz * rz) * 1.2)));
            e.jig = .35;
          }
          if (dj < R.j.sc * .45 + 1.05 && !c.frozen) { e.hold += dt; if (e.hold > .6) { W.used.add(e.d.id); e.lidT = 0; A.lidOff(); if (c.act) c.act('crouch', .9); G.shake = Math.max(G.shake || 0, .3); c.save(); } }
          else e.hold = 0;
        }
      } else if (e.kind === 'hair' && e.burn < 0) {
        e.cool -= dt;
        if (d < 1.95 && e.cool <= 0 && !c.frozen) {   // 손대려 하면 머리카락이 조여들며 밀쳐 낸다
          e.cool = 2.2; G.shake = Math.max(G.shake || 0, .7); A.whisper(); A.splash(.7); if (c.act) c.act('hitbig', 1.3);
          G.saltCue = 3.2;   // 글 없이 — 소금 칸·단추가 번쩍인다
          const ux = (P.x - e.x) / (d || 1), uz = (P.z - e.z) / (d || 1); P.x = e.x + ux * 2.5; P.z = e.z + uz * 2.5;
        }
      } else if (e.kind === 'mill' && e.t < 0 && !c.frozen) {
        const dl = Math.hypot(P.x - e.lx, P.z - e.lz);
        if (dl < 2.8) {   // 통나무 곁에 버티고 서면 조금씩 빠진다
          e.prog = Math.min(1, e.prog + dt / 2.6); if (c.hold) c.hold('push'); e.creakT = (e.creakT || 0) - dt; if (e.creakT <= 0) { e.creakT = .5; A.creak(); A.splash(.35); }
          if (e.prog >= 1) { W.used.add(e.d.id); e.t = 0; A.clunk(); G.shake = Math.max(G.shake || 0, .5); c.save(); }
        } else e.prog = Math.max(0, e.prog - dt * .4);
      }
    }
  };

  // ── 소금 — 머리카락에 뿌리면 타 없어진다 ──
  PZ.saltTarget = function (px, pz) {
    let best = null, bd = 6.5;
    for (const e of pieces()) if (e.kind === 'hair' && e.burn < 0) { const d = Math.hypot(px - e.x, pz - e.z); if (d < bd) { bd = d; best = e; } }
    return best && { x: best.x, y: best.y + .2, z: best.z, piece: best };
  };
  PZ.burn = function (e, A) {
    if (!e || e.burn >= 0) return;
    e.burn = 0; W.used.add(e.d.id); e.item.userData.locked = false; A.shriek(); A.sizzle();
  };

  // ── 매 프레임 (그림) ──
  const ember = new THREE.Color(0xff5a1e);
  PZ.update = function (t, dt, P, lit) {
    for (const e of pieces()) {
      const d = Math.hypot(P.x - e.x, P.z - e.z);
      switch (e.kind) {
        case 'print': {   // 등불 빛이 닿는 곳에만 젖은 자국이 드러난다
          const o = lit ? Math.max(0, Math.min(1, (5.4 - d) / 2.4)) * .9 : 0;
          e.m.visible = o > .01; if (e.m.visible) e.m.material.opacity = o;
          break;
        }
        case 'hand': {    // 등불을 꺼야 멀리서도 푸르게 떠오른다
          const o = lit ? 0 : Math.max(0, Math.min(1, (28 - d) / 9)) * (.72 + Math.sin(t * 1.3 + e.ph) * .14);
          e.m.visible = o > .01; if (e.m.visible) e.m.material.opacity = o;
          break;
        }
        case 'charm': {
          const on = !W.charmTaken.has(e.c.userData.charm.i) && e.show(lit);
          e.c.visible = on;
          if (on) e.c.userData.paper.rotation.z = Math.sin(t * 1.6 + e.c.position.z) * .05;
          break;
        }
        case 'jars': {
          e.jig = Math.max(0, e.jig - dt);
          const R = e.parts[e.d.right];
          if (e.lidT < 0) { R.lid.rotation.set(Math.sin(t * 60) * e.jig * .12, 0, Math.cos(t * 47) * e.jig * .12); R.lid.position.y = R.y + .81 * R.j.sc + e.jig * .05 * Math.abs(Math.sin(t * 40)); }
          else {   // 뚜껑이 튀어 올라 옆으로 떨어진다
            e.lidT += dt; const k = Math.min(1, e.lidT / .7), s = e.d.s;
            R.lid.position.set(R.j.x - s * k * .9, R.y + .8 * R.j.sc + Math.sin(k * Math.PI) * .7 - k * .72, R.j.z + k * .5);
            R.lid.rotation.set(k * 1.9, 0, k * 1.2);
          }
          break;
        }
        case 'hair': {
          if (e.burn < 0) break;   // 물결 흔들림은 hair.js 셰이더가 한다
          if (e.burn > 1.4) { e.grp.visible = false; break; }
          e.burn += dt; const k = Math.min(1, e.burn / 1.3);   // 불씨처럼 붉게 달았다가 오그라들며 사라진다
          e.mats.forEach(m => { m.color.setHex(0x0b0a0a).lerp(ember, Math.min(1, k * 2.2)); m.emissive.copy(ember).multiplyScalar(Math.max(0, .9 - k)); });
          e.grp.scale.set(1 - k * .85, 1 - k * .3, 1 - k * .85);
          break;
        }
        case 'mill': {
          if (e.t < 0) { e.log.rotation.x = .12 + (e.prog > 0 ? Math.sin(t * 38) * .06 * e.prog : 0); }
          else {
            e.t += dt;
            e.spin += (.35 - e.spin) * Math.min(1, dt * .6);
            if (e.log.visible) {   // 빠진 통나무는 물살에 떠내려간다
              e.lz -= dt * 1.4; e.log.position.set(e.lx, Math.max(W.groundH(e.lx, e.lz), W.height(e.lx, e.lz, t)) + .2, e.lz); e.log.rotation.y += dt * .3;
              if (e.t > 7) e.log.visible = false;
            }
            if (e.item && !e.item.visible && e.t > 2.6 && !W.taken.has(e.m.i)) { e.item.visible = true; window.AUDIO.splash(.6); window.AUDIO.pick(); }
          }
          e.wheel.rotation.z -= e.spin * dt;
          break;
        }
        case 'boat': {    // 손전등은 아직 켜져 있다 — 등불을 끄면 배 밑으로 새어 나오는 빛이 보인다
          e.beam.visible = e.glow.visible = e.pool.visible = !lit && e.item.visible;
          if (e.beam.visible) { const f = Math.random() < .06 ? .2 : .85 + Math.sin(t * 23) * .15; e.beam.material.opacity = .5 * f; e.glow.material.opacity = .7 * f; e.pool.material.opacity = .45 * f; }
          break;
        }
      }
    }
  };
  window.PUZ = PZ;
})();
