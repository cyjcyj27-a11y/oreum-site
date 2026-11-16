// 옛 잔도공이 남긴 물건 12개 (사장님 11/11 "160개를 까는동안 작은 보상") — 절벽에 박힌 녹슨 못에 끈으로 걸려 있다.
// build(i) → Group: 원점 = 벽에 박힌 못 뿌리, +Z = 벽 바깥, 물건은 못 끝에서 아래로 늘어진다. thumb(renderer, i) → 도감 그림(dataURL)
(function () {
  const std = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.8 : r, metalness: m || 0 });
  const M = {
    rust: std(0x7a3f22, 0.85, 0.55), iron: std(0x55585c, 0.6, 0.75), straw: std(0xc9a65a, 0.95), strawD: std(0x9c7a3a, 0.95), cord: std(0x5a3d22, 0.9),
    red: std(0xa8281c, 0.7), wood: std(0x6b4423, 0.85), bronze: std(0xa9803a, 0.45, 0.8), clay: std(0x7a4a2c, 0.75), cer: std(0xe6e8e4, 0.35, 0.05), blue: std(0x3a5f9a, 0.4), brass: std(0xc9a13a, 0.4, 0.85)
  };
  function tex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  const mesh = (g, m, x, y, z) => { const o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; return o; };
  // 못 + 끈
  function hanger(g, drop) {
    const peg = mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.24, 6), M.rust, 0, 0, 0.1); peg.rotation.x = Math.PI / 2; g.add(peg);
    const head = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.012, 8), M.rust, 0, 0, 0.22); head.rotation.x = Math.PI / 2; g.add(head);
    if (drop > 0) g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, drop, 5), M.cord, 0, -drop / 2, 0.19));
  }
  // 다시 그린 물건들이 같이 쓰는 도구: 고정 난수, 얼룩 무늬, 한 번만 만드는 재질, 두 점을 잇는 막대
  function rng(s) { return () => (s = (s * 16807 + 11) % 2147483647) / 2147483647; }
  function mottle(base, spots, n, seed) { return tex(128, 128, (c, W, H) => { const r = rng(seed); c.fillStyle = base; c.fillRect(0, 0, W, H); for (let i = 0; i < n; i++) { c.fillStyle = spots[i % spots.length]; c.globalAlpha = 0.25 + r() * 0.4; const s = 2 + r() * 9; c.beginPath(); c.ellipse(r() * W, r() * H, s, s * (0.4 + r() * 0.8), r() * 3, 0, 7); c.fill(); } c.globalAlpha = 1; }); }
  const TM = {}; const tm = (k, f) => TM[k] || (TM[k] = f());
  function rod(g, m, a, b, r) { const A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), o = mesh(new THREE.CylinderGeometry(r, r, d.length(), 5), m); o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(o); return o; }
  const rustM = () => tm('rust', () => new THREE.MeshStandardMaterial({ map: mottle('#6b3a22', ['#a9602c', '#3a2216', '#c98a48', '#54301c'], 240, 7), roughness: 0.9, metalness: 0.4 }));
  const ironM = () => tm('iron', () => new THREE.MeshStandardMaterial({ map: mottle('#4c4e52', ['#3a3b3e', '#5e6064', '#6a4a34', '#707276'], 200, 11), roughness: 0.55, metalness: 0.7 }));
  const grainM = (k, base, dark) => tm(k, () => new THREE.MeshStandardMaterial({ map: tex(64, 128, (c, w, h) => { const r = rng(5); c.fillStyle = base; c.fillRect(0, 0, w, h); for (let i = 0; i < 46; i++) { c.fillStyle = i % 3 ? dark : 'rgba(255,235,190,.16)'; c.fillRect(r() * w, 0, 1 + r() * 2, h); } }), roughness: 0.85 }));
  const L = [
    { ko: '녹슨 고리', en: 'Rusty Ring', make(g) { hanger(g, 0); const m = rustM();
      g.add(mesh(new THREE.TorusGeometry(0.1, 0.02, 10, 28), m, 0, -0.1, 0.19));
      for (let i = 0; i < 3; i++) { const l = mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 14), m, 0, -0.228 - i * 0.052, 0.19); l.scale.y = 1.35; l.rotation.y = i % 2 ? 0.2 : Math.PI / 2 - 0.2; g.add(l); }
      const hk = mesh(new THREE.TorusGeometry(0.034, 0.011, 6, 16, Math.PI * 1.35), m, 0.004, -0.4, 0.19); hk.rotation.z = Math.PI * 0.62; g.add(hk);
      const tipc = mesh(new THREE.ConeGeometry(0.011, 0.03, 6), m, 0.036, -0.385, 0.19); g.add(tipc); } },
    { ko: '낡은 삿갓', en: 'Worn Straw Hat', make(g) { hanger(g, 0.06);
      const t = tex(256, 64, (c, w, h) => { c.fillStyle = '#c9a65a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 64; i++) { c.fillStyle = i % 2 ? 'rgba(90,60,20,.35)' : 'rgba(255,240,190,.25)'; c.fillRect(i * 4, 0, 2, h); } for (let y = 6; y < h; y += 9) { c.fillStyle = 'rgba(80,50,15,.4)'; c.fillRect(0, y, w, 2); } });
      const hat = mesh(new THREE.ConeGeometry(0.26, 0.13, 20, 1, true), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide }), 0, -0.2, 0.17); hat.rotation.x = Math.PI / 2 - 0.25; g.add(hat);
      const tip = mesh(new THREE.SphereGeometry(0.025, 8, 6), M.strawD, 0, -0.17, 0.3); g.add(tip); } },
    { ko: '부적', en: 'Paper Charm', make(g) { hanger(g, 0.05);
      const t = tex(96, 256, (c, w, h) => { c.fillStyle = '#e2c24a'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(120,80,10,.18)'; for (let i = 0; i < 60; i++) c.fillRect((i * 37) % w, (i * 71) % h, 3, 2); c.strokeStyle = '#a01810'; c.lineWidth = 7; c.lineCap = 'round'; c.strokeRect(10, 10, w - 20, h - 20);
        c.beginPath(); c.moveTo(24, 44); c.lineTo(72, 44); c.moveTo(48, 30); c.lineTo(48, 84); c.moveTo(26, 66); c.lineTo(70, 66); c.moveTo(30, 108); c.quadraticCurveTo(48, 92, 66, 108); c.quadraticCurveTo(48, 128, 30, 108); c.moveTo(48, 128); c.lineTo(48, 176); c.moveTo(28, 150); c.lineTo(68, 150); c.moveTo(30, 196); c.lineTo(48, 226); c.lineTo(68, 196); c.stroke(); });
      const p = mesh(new THREE.PlaneGeometry(0.12, 0.32), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide }), 0, -0.22, 0.19); p.rotation.set(0.12, 0.25, 0.06); g.add(p); } },
    { ko: '호리병', en: 'Gourd Bottle', make(g) { hanger(g, 0.06); const y = -0.31;
      const gm = tm('gourd', () => new THREE.MeshStandardMaterial({ map: tex(128, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8a5a26'); gr.addColorStop(0.3, '#c69a4e'); gr.addColorStop(0.7, '#b47e38'); gr.addColorStop(1, '#6a421e'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const r = rng(3); for (let i = 0; i < 170; i++) { c.fillStyle = i % 3 ? 'rgba(70,40,12,.24)' : 'rgba(245,215,150,.2)'; const s = 1 + r() * 4; c.beginPath(); c.ellipse(r() * w, r() * h, s, s * (1 + r() * 4), 0, 0, 7); c.fill(); } }), roughness: 0.5 }));
      const pts = [[0, -0.105], [0.05, -0.098], [0.088, -0.07], [0.102, -0.03], [0.096, 0.012], [0.07, 0.05], [0.044, 0.072], [0.037, 0.086], [0.046, 0.1], [0.06, 0.125], [0.058, 0.155], [0.04, 0.18], [0.022, 0.195], [0.018, 0.225], [0.023, 0.232]].map(p => new THREE.Vector2(p[0], p[1]));
      g.add(mesh(new THREE.LatheGeometry(pts, 22), gm, 0, y, 0.19)); g.add(mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.035, 8), M.wood, 0, y + 0.245, 0.19));
      const band = mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 16), M.red, 0, y + 0.085, 0.19); band.rotation.x = Math.PI / 2; g.add(band);
      g.add(mesh(new THREE.SphereGeometry(0.014, 8, 6), M.red, 0.03, y + 0.083, 0.22));
      rod(g, M.red, [0.03, y + 0.08, 0.222], [0.04, y - 0.0, 0.262], 0.004); rod(g, M.red, [0.03, y + 0.08, 0.222], [0.016, y - 0.01, 0.268], 0.004);
      for (const p of [[0.04, y - 0.015, 0.264], [0.016, y - 0.025, 0.27]]) { const ts = mesh(new THREE.ConeGeometry(0.011, 0.04, 7), M.red, p[0], p[1], p[2]); g.add(ts); } } },
    { ko: '짚신 한 짝', en: 'One Straw Sandal', make(g) { hanger(g, 0.07);
      const s = new THREE.Group(); s.position.set(0, -0.06, 0.2); s.rotation.set(-0.1, 0, 0.07); g.add(s);
      const sm = tm('weave', () => { const t = tex(128, 128, (c, w, h) => { c.fillStyle = '#c4a058'; c.fillRect(0, 0, w, h); for (let row = 0; row < 16; row++) { const y0 = row * 8; c.fillStyle = 'rgba(70,45,12,.45)'; c.fillRect(0, y0, w, 1.5); c.strokeStyle = row % 2 ? 'rgba(255,238,190,.4)' : 'rgba(110,75,25,.45)'; c.lineWidth = 1.5; c.beginPath(); for (let x = -8; x < w + 8; x += 5) { c.moveTo(x, y0 + 7); c.lineTo(x + (row % 2 ? 5 : -5), y0 + 2); } c.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 8); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); });
      const sh = new THREE.Shape(); sh.moveTo(0, -0.01); sh.bezierCurveTo(0.05, -0.01, 0.052, -0.09, 0.046, -0.14); sh.bezierCurveTo(0.042, -0.2, 0.072, -0.25, 0.052, -0.29); sh.bezierCurveTo(0.03, -0.325, -0.04, -0.325, -0.056, -0.28); sh.bezierCurveTo(-0.07, -0.23, -0.046, -0.19, -0.046, -0.14); sh.bezierCurveTo(-0.052, -0.08, -0.05, -0.01, 0, -0.01);
      const sole = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.016, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1, curveSegments: 10 }), sm); sole.castShadow = true; s.add(sole);
      const cm = M.strawD, zt = 0.02;
      for (const sx of [-1, 1]) { for (let k = 0; k < 3; k++) { const lp = mesh(new THREE.TorusGeometry(0.016, 0.005, 5, 10, Math.PI), cm, sx * 0.043, -0.075 - k * 0.045, zt); lp.rotation.set(Math.PI / 2, Math.PI / 2, 0); s.add(lp); }
        rod(s, cm, [sx * 0.043, -0.04, zt + 0.014], [sx * 0.045, -0.185, zt + 0.016], 0.005); rod(s, cm, [sx * 0.045, -0.185, zt + 0.016], [0, -0.275, zt + 0.004], 0.006); }
      const heel = mesh(new THREE.TorusGeometry(0.043, 0.006, 5, 14, Math.PI), cm, 0, -0.04, zt); heel.rotation.x = Math.PI / 2; s.add(heel);
      s.add(mesh(new THREE.SphereGeometry(0.011, 6, 5), cm, 0, -0.275, zt + 0.006)); } },
    { ko: '부러진 망치', en: 'Broken Hammer', make(g) { hanger(g, 0.085);
      const k = new THREE.Group(); k.position.set(0, -0.135, 0.19); k.rotation.z = 0.12; g.add(k);
      const im = tm('ironF', () => { const m = ironM().clone(); m.flatShading = true; return m; }), wm = grainM('handle', '#7a5230', 'rgba(50,28,10,.3)'), face = tm('face', () => { const m = std(0xa3a6aa, 0.3, 0.85); m.flatShading = true; return m; }), raw = tm('raw', () => std(0xc09a62, 0.9));
      for (const sx of [-1, 1]) { const ge = new THREE.CylinderGeometry(0.05, 0.058, 0.1, 4); ge.rotateY(Math.PI / 4); const h = mesh(ge, im, sx * 0.05, 0, 0); h.rotation.z = -sx * Math.PI / 2; k.add(h);
        const fg = new THREE.CylinderGeometry(0.043, 0.05, 0.01, 4); fg.rotateY(Math.PI / 4); const f = mesh(fg, face, sx * 0.104, 0, 0); f.rotation.z = -sx * Math.PI / 2; k.add(f); }
      k.add(mesh(new THREE.BoxGeometry(0.012, 0.084, 0.084), rustM(), 0, 0, 0));
      k.add(mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.012, 8), raw, 0, 0.046, 0)); k.add(mesh(new THREE.BoxGeometry(0.026, 0.004, 0.006), im, 0, 0.053, 0));
      k.add(mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.15, 8), wm, 0, -0.115, 0));
      const cord = mesh(new THREE.TorusGeometry(0.024, 0.006, 5, 12), M.cord, 0, -0.06, 0); cord.rotation.x = Math.PI / 2; k.add(cord);
      const r = rng(9); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, len = 0.025 + r() * 0.06, sp = mesh(new THREE.ConeGeometry(0.009, len, 4), raw, Math.cos(a) * 0.013 * (i ? 1 : 0), -0.19 - len / 2 + 0.004, Math.sin(a) * 0.013 * (i ? 1 : 0)); sp.rotation.set((r() - 0.5) * 0.3, r() * 3, Math.PI + (r() - 0.5) * 0.3); k.add(sp); } } },
    { ko: '꺼진 등', en: 'Dead Lantern', make(g) { hanger(g, 0.055); const y = -0.27;
      const pm = tm('paper', () => new THREE.MeshStandardMaterial({ map: tex(384, 128, (c, w, h) => { const r = rng(21); c.fillStyle = '#d6c496'; c.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { c.fillStyle = i % 2 ? 'rgba(110,75,30,.2)' : 'rgba(255,245,215,.25)'; const s = 3 + r() * 12; c.beginPath(); c.ellipse(r() * w, r() * h, s, s * 0.6, r() * 3, 0, 7); c.fill(); }
        const so = c.createLinearGradient(0, 0, 0, h); so.addColorStop(0, 'rgba(20,12,5,.55)'); so.addColorStop(0.35, 'rgba(20,12,5,0)'); c.fillStyle = so; c.fillRect(0, 0, w, h);
        c.fillStyle = '#17110b'; c.beginPath(); c.moveTo(16, 40); c.lineTo(32, 34); c.lineTo(40, 50); c.lineTo(54, 58); c.lineTo(44, 80); c.lineTo(50, 104); c.lineTo(28, 96); c.lineTo(20, 110); c.lineTo(10, 84); c.lineTo(18, 64); c.closePath(); c.fill(); c.beginPath(); c.moveTo(268, 86); c.lineTo(284, 80); c.lineTo(290, 100); c.lineTo(276, 112); c.closePath(); c.fill();
        c.strokeStyle = '#4a2f18'; c.lineWidth = 3; for (let p = 0; p < 6; p++) { const x = p * 64; c.strokeRect(x + 5, 6, 54, h - 12); c.beginPath(); c.moveTo(x + 5, 44); c.lineTo(x + 59, 44); c.moveTo(x + 5, 84); c.lineTo(x + 59, 84); c.moveTo(x + 32, 6); c.lineTo(x + 32, h - 6); c.stroke(); } }), roughness: 0.95, side: THREE.DoubleSide }));
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.19, 6, 1, true), pm, 0, y, 0.19));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; g.add(mesh(new THREE.BoxGeometry(0.013, 0.2, 0.013), M.wood, Math.cos(a) * 0.081, y, 0.19 + Math.sin(a) * 0.081)); }
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.118, 0.05, 6), M.wood, 0, y + 0.122, 0.19)); g.add(mesh(new THREE.CylinderGeometry(0.122, 0.122, 0.01, 6), M.cord, 0, y + 0.098, 0.19)); g.add(mesh(new THREE.SphereGeometry(0.018, 8, 6), M.wood, 0, y + 0.155, 0.19));
      g.add(mesh(new THREE.CylinderGeometry(0.094, 0.08, 0.028, 6), M.wood, 0, y - 0.108, 0.19));
      const hd = mesh(new THREE.TorusGeometry(0.05, 0.005, 5, 14, Math.PI), ironM(), 0, y + 0.15, 0.19); g.add(hd);
      rod(g, M.cord, [0, y - 0.12, 0.19], [0, y - 0.16, 0.19], 0.004); const ts = mesh(new THREE.ConeGeometry(0.014, 0.06, 7), tm('fade', () => std(0x8a3a2c, 0.9)), 0, y - 0.185, 0.19); g.add(ts); } },
    { ko: '엽전 꾸러미', en: 'String of Coins', make(g) { hanger(g, 0.05);
      const cg = tm('coinG', () => { const s = new THREE.Shape(); s.absarc(0, 0, 0.04, 0, Math.PI * 2, false); const h = new THREE.Path(), q = 0.011; h.moveTo(-q, -q); h.lineTo(-q, q); h.lineTo(q, q); h.lineTo(q, -q); h.closePath(); s.holes.push(h); const ge = new THREE.ExtrudeGeometry(s, { depth: 0.005, bevelEnabled: false, curveSegments: 18 }); ge.translate(0, 0, -0.0025); return ge; });
      const coinM = (k, base) => tm(k, () => { const t = tex(128, 128, (c, w, h) => { const r = rng(k.length * 13); c.fillStyle = base; c.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { c.fillStyle = i % 2 ? 'rgba(50,60,30,.28)' : 'rgba(255,225,140,.22)'; const s = 2 + r() * 8; c.beginPath(); c.arc(r() * w, r() * h, s, 0, 7); c.fill(); }
          c.strokeStyle = 'rgba(255,225,150,.75)'; c.lineWidth = 7; c.beginPath(); c.arc(64, 64, 58, 0, 7); c.stroke(); c.lineWidth = 5; c.strokeRect(42, 42, 44, 44);
          c.strokeStyle = 'rgba(55,35,10,.8)'; c.lineWidth = 3.5; c.lineCap = 'round'; for (const [x, y] of [[64, 24], [64, 104], [24, 64], [104, 64]]) { c.beginPath(); c.moveTo(x - 9, y - 6); c.lineTo(x + 9, y - 6); c.moveTo(x, y - 11); c.lineTo(x, y + 10); c.moveTo(x - 8, y + 3); c.lineTo(x + 8, y + 3); c.moveTo(x - 6, y + 10); c.lineTo(x + 7, y + 10); c.stroke(); } });
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12.5, 12.5); t.offset.set(0.5, 0.5); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.7 }); });
      const A = coinM('ca', '#b88d3e'), B = coinM('cbb', '#8f7038'), r = rng(31);
      for (let i = 0; i < 13; i++) { const c = mesh(cg, i % 3 === 1 ? B : A, (r() - 0.5) * 0.012, -0.06 - i * 0.0115, 0.19 + (r() - 0.5) * 0.01); c.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.6); g.add(c); }
      rod(g, M.red, [0, -0.2, 0.19], [0, -0.245, 0.196], 0.005);
      for (const [x, yy, z, rz, m] of [[-0.05, -0.262, 0.2, 0.5, B], [0.048, -0.266, 0.204, -0.45, A], [0, -0.285, 0.212, 0.08, A]]) { const c = mesh(cg, m, x, yy, z); c.rotation.set(-0.12, x * 4, rz); g.add(c); }
      g.add(mesh(new THREE.SphereGeometry(0.013, 6, 5), M.red, 0, -0.243, 0.2)); } },
    { ko: '놋쇠 방울', en: 'Brass Bell', make(g) { hanger(g, 0.07); const y = -0.2;
      const pts = [[0.0, 0.1], [0.035, 0.095], [0.06, 0.06], [0.07, 0.0], [0.085, -0.06], [0.1, -0.085]].map(p => new THREE.Vector2(p[0], p[1]));
      const b = mesh(new THREE.LatheGeometry(pts, 18), new THREE.MeshStandardMaterial({ color: 0xc9a13a, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide }), 0, y, 0.19); g.add(b);
      const lp = mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 10), M.brass, 0, y + 0.115, 0.19); g.add(lp); g.add(mesh(new THREE.SphereGeometry(0.02, 8, 6), M.iron, 0, y - 0.08, 0.19)); } },
    { ko: '곰방대', en: 'Tobacco Pipe', make(g) { hanger(g, 0.05);
      const k = new THREE.Group(); k.position.set(-0.03, -0.075, 0.19); k.rotation.z = 0.42; g.add(k);
      const bm = grainM('bamboo', '#b8975a', 'rgba(90,60,20,.22)');
      k.add(mesh(new THREE.CylinderGeometry(0.006, 0.013, 0.075, 8), M.brass, 0, 0.0625, 0)); k.add(mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.008, 8), M.brass, 0, 0.104, 0));
      k.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), bm, 0, -0.105, 0));
      for (const yy of [-0.03, -0.115, -0.19]) { const n = mesh(new THREE.TorusGeometry(0.0125, 0.003, 4, 10), M.strawD, 0, yy, 0); n.rotation.x = Math.PI / 2; k.add(n); }
      k.add(mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.06, 8), M.brass, 0, -0.262, 0)); k.add(mesh(new THREE.SphereGeometry(0.017, 8, 6), M.brass, 0, -0.295, 0));
      const pts = [[0.0, 0], [0.012, 0.002], [0.017, 0.02], [0.03, 0.048], [0.033, 0.052], [0.027, 0.05], [0.014, 0.022], [0.0, 0.016]].map(p => new THREE.Vector2(p[0], p[1]));
      const bowl = mesh(new THREE.LatheGeometry(pts, 14), tm('brass2', () => new THREE.MeshStandardMaterial({ color: 0xc9a13a, roughness: 0.4, metalness: 0.85, side: THREE.DoubleSide })), 0.012, -0.297, 0); bowl.rotation.z = -Math.PI / 2; k.add(bowl);
      const tie = mesh(new THREE.TorusGeometry(0.014, 0.004, 4, 10), M.cord, 0, 0.02, 0); tie.rotation.x = Math.PI / 2; k.add(tie); } },
    { ko: '이 빠진 밥그릇', en: 'Chipped Rice Bowl', make(g) { hanger(g, 0.1); const y = -0.27;
      const pts = [[0.03, -0.06], [0.045, -0.05], [0.085, -0.01], [0.105, 0.05], [0.098, 0.05], [0.08, -0.002], [0.04, -0.04], [0.0, -0.045]].map(p => new THREE.Vector2(p[0], p[1]));
      const t = tex(128, 32, (c, w, h) => { c.fillStyle = '#e6e8e4'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a5f9a'; c.fillRect(0, 4, w, 4); c.fillRect(0, 12, w, 2); });
      const b = mesh(new THREE.LatheGeometry(pts, 20, 0.5, Math.PI * 2 - 0.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, side: THREE.DoubleSide }), 0, y, 0.19); b.rotation.x = 0.55; g.add(b);
      for (const sx of [-1, 1]) { const c = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 4), M.cord, sx * 0.05, y + 0.08, 0.19); c.rotation.z = sx * 0.45; g.add(c); } } },
    { ko: '부치지 못한 편지', en: 'Unsent Letter', make(g) { hanger(g, 0.04);
      const t = tex(160, 224, (c, w, h) => { c.fillStyle = '#e9dfc6'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(120,90,40,.15)'; for (let i = 0; i < 80; i++) c.fillRect((i * 53) % w, (i * 97) % h, 4, 2); c.strokeStyle = '#2a221a'; c.lineWidth = 3; c.lineCap = 'round';
        for (let col = 0; col < 5; col++) { const x = w - 26 - col * 27; c.beginPath(); for (let y = 22; y < h - 30 - col * 22; y += 15) { c.moveTo(x - 6 + Math.sin(y * 0.7 + col) * 3, y); c.lineTo(x + 6 + Math.cos(y * 0.5 + col) * 3, y + 6 + Math.sin(y + col) * 3); } c.stroke(); } c.fillStyle = '#a01810'; c.fillRect(18, h - 44, 22, 22); });
      const pm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, side: THREE.DoubleSide });
      const a = mesh(new THREE.PlaneGeometry(0.2, 0.14), pm, 0, -0.13, 0.195); a.rotation.x = 0.1; g.add(a); const b = mesh(new THREE.PlaneGeometry(0.2, 0.14), pm, 0, -0.265, 0.205); b.rotation.x = -0.16; g.add(b); } }
  ];
  function build(i) { const g = new THREE.Group(); L[i].make(g); return g; }
  // 도감 그림: 작은 장면에 물건 하나만 놓고 찍는다
  const thumbs = {};
  function thumb(renderer, i) {
    if (thumbs[i]) return thumbs[i];
    const N = 192, rt = new THREE.WebGLRenderTarget(N, N), sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.05, 10);
    sc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 1.5)); const d = new THREE.DirectionalLight(0xffe2b8, 2.6); d.position.set(1.2, 1.6, 2.2); sc.add(d);
    const g = build(i); sc.add(g);
    const box = new THREE.Box3().setFromObject(g), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, 0.2) * 0.5;
    cam.position.set(c.x + r * 1.1, c.y + r * 0.35, c.z + r / Math.tan(15 * Math.PI / 180) * 1.25); cam.lookAt(c);
    const prev = renderer.getRenderTarget(), pc = new THREE.Color(); renderer.getClearColor(pc); const pa = renderer.getClearAlpha();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam);
    const px = new Uint8Array(N * N * 4); renderer.readRenderTargetPixels(rt, 0, 0, N, N, px);
    renderer.setRenderTarget(prev); renderer.setClearColor(pc, pa); rt.dispose();
    const cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), im = x.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) { const a = ((N - 1 - y) * N + xx) * 4, b = (y * N + xx) * 4; for (let k = 0; k < 3; k++) im.data[b + k] = Math.pow(px[a + k] / 255, 1 / 2.2) * 255; im.data[b + 3] = px[a + 3]; }
    x.putImageData(im, 0, 0); thumbs[i] = cv.toDataURL('image/png'); return thumbs[i];
  }
  window.RELICS = { L, N: L.length, SEGS: [4, 15, 27, 40, 53, 66, 79, 92, 105, 118, 131, 146], build, thumb };
})();
