/* world.js — 뗏목·사람·낚싯대·줄·찌·물보라·갈매기·섬. 결·천·살갗은 캔버스로 그린 무늬를 쓴다 (파일 없음, file:// 에서도 동작) */
(function () {
  const V = THREE.Vector3;
  const R = (a, b) => a + Math.random() * (b - a);

  /* ── 캔버스 무늬 ── */
  function tex(w, h, fn, rep) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); fn(g, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); t.anisotropy = 4; return t; }
  function speck(g, w, h, n, a, s) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * s, 1 + Math.random() * s); } }
  // 통나무 껍질 — 세로 결(캔버스 y = 통나무 길이 방향), 갈라진 금, 옹이
  const barkTex = (base) => tex(256, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) { const d = Math.sin(x * 0.35) * 0.5 + Math.sin(x * 1.7) * 0.3 + Math.random() * 0.4; g.fillStyle = `rgba(${d > 0.4 ? 255 : 0},${d > 0.4 ? 230 : 0},${d > 0.4 ? 190 : 0},${Math.abs(d) * 0.13})`; g.fillRect(x, 0, 2, h); }
    g.strokeStyle = 'rgba(30,18,8,.55)'; g.lineWidth = 1.2;
    for (let i = 0; i < 26; i++) { let x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (Math.random() - .5) * 6; y += 14 + Math.random() * 20; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 5; i++) { const x = Math.random() * w, y = Math.random() * h, r = 5 + Math.random() * 9; g.fillStyle = 'rgba(40,24,10,.7)'; g.beginPath(); g.ellipse(x, y, r * 0.6, r, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(90,60,30,.6)'; g.beginPath(); g.ellipse(x, y, r, r * 1.6, 0, 0, 7); g.stroke(); }
    speck(g, w, h, 900, .25, 3);
  });
  // 잘린 단면 — 나이테
  const ringTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#c9a66b'; g.fillRect(0, 0, w, h); for (let r = 60; r > 2; r -= 3 + Math.random() * 4) { g.strokeStyle = `rgba(90,55,25,${0.25 + Math.random() * 0.4})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.ellipse(64, 66, r, r * 0.94, 0, 0, 7); g.stroke(); } g.strokeStyle = 'rgba(60,35,15,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(64, 66); g.lineTo(30, 20); g.stroke(); speck(g, w, h, 300, .2, 2); });
  // 널빤지 — 옅은 결 + 못 자국
  const plankTex = tex(256, 256, (g, w, h) => { g.fillStyle = '#a8865a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(60,35,15,${0.05 + Math.random() * 0.12})`; g.fillRect(0, y, w, 1 + Math.random() * 2); } speck(g, w, h, 500, .2, 3); g.fillStyle = 'rgba(40,40,45,.8)';[[18, 20], [238, 20], [18, 236], [238, 236]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 3, 0, 7); g.fill(); }); });
  // 천 — 올 + 얼룩 + 기운 자국 + 구멍 (alpha)
  const clothTex = (base, holes) => tex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`; g.fillRect(x, 0, 1, h); } for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`; g.fillRect(0, y, w, 1); }
    for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(90,70,40,${0.06 + Math.random() * 0.1})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 14, 5 + Math.random() * 10, Math.random() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 3; i++) { const x = Math.random() * (w - 40), y = Math.random() * (h - 40), pw = 16 + Math.random() * 18, ph = 14 + Math.random() * 16; g.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 40},${70 + Math.random() * 30},.85)`; g.fillRect(x, y, pw, ph); g.strokeStyle = 'rgba(30,20,10,.7)'; g.setLineDash([3, 3]); g.lineWidth = 1.5; g.strokeRect(x + 2, y + 2, pw - 4, ph - 4); g.setLineDash([]); }
    if (holes) { g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < holes; i++) { g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 1.5 + Math.random() * 3, Math.random() * 3, 0, 7); g.fill(); } g.globalCompositeOperation = 'source-over'; }
  });
  // 밀짚 — 비스듬한 엮음
  const strawTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#d2b46e'; g.fillRect(0, 0, w, h); for (let i = -h; i < w; i += 6) { g.strokeStyle = 'rgba(120,90,40,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.strokeStyle = 'rgba(255,240,200,.35)'; g.beginPath(); g.moveTo(i + 3, 0); g.lineTo(i + h + 3, h); g.stroke(); } for (let i = 0; i < w; i += 8) { g.strokeStyle = 'rgba(100,70,30,.35)'; g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } speck(g, w, h, 200, .2, 2); }, [3, 1]);
  // 살갗 — 볕에 탄 색에 옅은 얼룩
  const skinTex = tex(128, 128, (g, w, h) => { g.fillStyle = '#b8794f'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '90,40,20' : '230,170,130'},${Math.random() * 0.12})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, 7); g.fill(); } });
  // 밧줄
  const ropeTex = tex(64, 64, (g, w, h) => { g.fillStyle = '#c7ad7c'; g.fillRect(0, 0, w, h); for (let i = -h; i < w * 2; i += 10) { g.strokeStyle = 'rgba(80,60,30,.55)'; g.lineWidth = 4; g.beginPath(); g.moveTo(i, 0); g.lineTo(i - h, h); g.stroke(); } }, [1, 6]);
  const clothBump = tex(128, 128, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 2) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`; g.fillRect(x, 0, 1, h); } for (let y = 0; y < h; y += 2) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`; g.fillRect(0, y, w, 1); } });

  function build(scene, sea) {
    const M = THREE.MeshStandardMaterial;
    const bark = [new M({ map: barkTex('#7c5b3b'), roughness: 0.95 }), new M({ map: barkTex('#6a4a2e'), roughness: 0.95 }), new M({ map: barkTex('#8a6a48'), roughness: 0.92 })];
    const ringMat = new M({ map: ringTex, roughness: 0.9 });
    const plank = new M({ map: plankTex, roughness: 0.9 });
    const woodD = new M({ color: 0x5a3f28, roughness: 0.95, map: barkTex('#5e4229') });
    const rope = new M({ map: ropeTex, roughness: 1 });
    const skin = new M({ map: skinTex, roughness: 0.75 });
    const shirt = new M({ map: clothTex('#cfc6ad', 4), bumpMap: clothBump, bumpScale: 0.004, roughness: 1, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const pants = new M({ map: clothTex('#4f5d6b', 3), bumpMap: clothBump, bumpScale: 0.004, roughness: 1, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const hair = new M({ color: 0x2b1d12, roughness: 1 });
    const straw = new M({ map: strawTex, roughness: 1, side: THREE.DoubleSide });
    const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

    /* ── 뗏목 ── */
    const raft = new THREE.Group(); scene.add(raft);
    const RW = 3.3, RL = 4.6;
    // 울퉁불퉁한 통나무
    function logMesh(len, r, mat) {
      const g = new THREE.CylinderGeometry(r, r * 0.9, len, 12, 8);
      const p = g.attributes.position; const seed = Math.random() * 10;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const rr = Math.hypot(x, z); if (rr < 1e-4) continue; const k = 1 + 0.06 * Math.sin(y * 3.1 + seed + Math.atan2(z, x) * 2) + 0.04 * Math.sin(y * 9 + seed * 3) + (Math.random() - .5) * 0.02; p.setX(i, x * k); p.setZ(i, z * k); }
      g.computeVertexNormals();
      return shadowed(new THREE.Mesh(g, [mat, ringMat, ringMat]));
    }
    const logs = [];
    for (let i = 0; i < 8; i++) {
      const r = R(0.19, 0.24), log = logMesh(RL + R(-0.35, 0.3), r, bark[i % 3]);
      log.rotation.x = Math.PI / 2; log.rotation.y = R(-0.05, 0.05); log.position.set(-RW / 2 + 0.22 + i * (RW - 0.44) / 7, r - 0.16, R(-0.12, 0.12)); log.userData.r = r; raft.add(log); logs.push(log);
    }
    // 가로 받침 통나무 + 밧줄 감기 (나선)
    class Helix extends THREE.Curve { constructor(r, turns, len) { super(); this.r = r; this.turns = turns; this.len = len; } getPoint(t, o) { const a = t * this.turns * Math.PI * 2; return (o || new V()).set(Math.cos(a) * this.r, Math.sin(a) * this.r, (t - 0.5) * this.len); } }
    for (const z of [-1.7, 0, 1.7]) {
      const b = logMesh(RW + 0.4, 0.11, woodD); b.rotation.z = Math.PI / 2; b.position.set(0, -0.19, z); raft.add(b);
      for (let i = 0; i < 8; i++) { const lx = logs[i].position.x, ly = logs[i].position.y, lr = logs[i].userData.r; const tube = new THREE.Mesh(new THREE.TubeGeometry(new Helix(lr + 0.015, 2.5, 0.14), 60, 0.017, 6, false), rope); tube.rotation.y = Math.PI / 2; tube.position.set(lx, ly - 0.04, z); tube.scale.set(1, 1.12, 1); raft.add(tube); }
    }
    // 갑판 널빤지 (가운데 걷는 자리)
    for (let i = 0; i < 6; i++) { const pl = shadowed(new THREE.Mesh(new THREE.BoxGeometry(R(1.5, 2.2), 0.05, 0.26), plank)); pl.position.set(R(-0.2, 0.3), 0.1, -1.55 + i * 0.36 + R(-0.03, 0.03)); pl.rotation.y = R(-0.04, 0.04); raft.add(pl); }
    // 돛대 · 활대 · 버팀줄 · 기운 돛
    const mast = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 3.0, 9), woodD)); mast.position.set(-1.15, 1.45, 1.55); raft.add(mast);
    const sailG = new THREE.PlaneGeometry(1.1, 1.25, 10, 10); const sailBase = sailG.attributes.position.array.slice();
    const sail = shadowed(new THREE.Mesh(sailG, new M({ map: clothTex('#e2d8c0', 5), bumpMap: clothBump, bumpScale: 0.01, roughness: 1, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }))); sail.position.set(-1.15 - 0.57, 2.2, 1.55); raft.add(sail);
    const yard = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), woodD)); yard.rotation.z = Math.PI / 2; yard.position.set(-1.15 - 0.57, 2.85, 1.55); raft.add(yard);
    const stay = (from, to) => { const d = to.clone().sub(from); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, d.length(), 4), rope); m.position.copy(from).add(to).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new V(0, 1, 0), d.normalize()); raft.add(m); };
    stay(new V(-1.15, 2.9, 1.55), new V(1.3, 0.12, 2.1)); stay(new V(-1.15, 2.9, 1.55), new V(-1.5, 0.12, -2.0)); stay(new V(-1.15, 2.9, 1.55), new V(1.4, 0.12, -1.6));
    // 통 (널판 조각) · 상자 · 물통 · 사린 밧줄
    const barrel = new THREE.Group(); barrel.position.set(1.05, 0.08, 1.55); raft.add(barrel);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const st = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.62, 0.05), plank)); st.position.set(Math.cos(a) * 0.245, 0.31, Math.sin(a) * 0.245); st.rotation.y = -a + Math.PI / 2; barrel.add(st); }
    for (const y of [0.1, 0.32, 0.54]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.262, 0.014, 5, 20), new M({ color: 0x4a4a50, metalness: .7, roughness: .45 })); h.rotation.x = Math.PI / 2; h.position.y = y; barrel.add(h); }
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 14), plank); lid.position.y = 0.61; barrel.add(lid);
    const crate = new THREE.Group(); crate.position.set(0.35, 0.1, 1.75); crate.rotation.y = 0.2; raft.add(crate);
    for (const [x, y, z, w, h, d] of [[0, 0.02, 0, 0.5, 0.04, 0.5], [0, 0.4, 0, 0.5, 0.04, 0.5], [-0.23, 0.21, 0, 0.04, 0.38, 0.5], [0.23, 0.21, 0, 0.04, 0.38, 0.5], [0, 0.21, -0.23, 0.42, 0.38, 0.04], [0, 0.21, 0.23, 0.42, 0.38, 0.04]]) { const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), plank)); m.position.set(x, y, z); crate.add(m); }
    const jug = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.26, 10), new M({ color: 0x8a9a7a, roughness: .6 }))); jug.position.set(0.75, 0.25, 1.95); raft.add(jug);
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 20), rope); coil.rotation.x = Math.PI / 2; coil.position.set(-0.55, 0.16, 1.95); raft.add(coil);
    // 움막 — 두 장대 사이 줄에 걸친 방수천 (주름)
    const tarpG = new THREE.PlaneGeometry(1.5, 1.7, 12, 12);
    { const p = tarpG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -Math.abs(x) * 0.62 + Math.sin(y * 7 + x * 3) * 0.03 + Math.sin(x * 11) * 0.02); } tarpG.computeVertexNormals(); }
    const tarp = shadowed(new THREE.Mesh(tarpG, new M({ map: clothTex('#6f7d68', 3), bumpMap: clothBump, bumpScale: 0.01, roughness: 1, side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }))); tarp.rotation.x = -Math.PI / 2; tarp.rotation.z = Math.PI / 2; tarp.position.set(-0.95, 0.83, -0.55); tarp.scale.set(1, 1, 1); raft.add(tarp);
    for (const z of [-1.35, 0.25]) { const pole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.85, 6), woodD)); pole.position.set(-0.95, 0.5, z); raft.add(pole); }
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.7, 4), rope); ridge.rotation.x = Math.PI / 2; ridge.position.set(-0.95, 0.9, -0.55); raft.add(ridge);
    // 건조대 (잡은 물고기가 걸린다)
    const rack = new THREE.Group(); rack.position.set(1.3, 0.1, 0.35); raft.add(rack);
    for (const z of [-0.5, 0.5]) { const p = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.1, 6), woodD)); p.position.set(0, 0.55, z); rack.add(p); }
    const rline = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.0, 4), rope); rline.rotation.x = Math.PI / 2; rline.position.y = 1.05; rack.add(rline);
    const rackFish = []; const rfMat = new M({ color: 0xb9c2c8, roughness: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.22), rfMat); f.position.set(0, 0.93, -0.38 + i * 0.15); f.rotation.y = Math.PI / 2; f.visible = false; rack.add(f); rackFish.push(f); }
    // 등불
    const lampPole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.5, 6), woodD)); lampPole.position.set(1.35, 0.8, 1.9); raft.add(lampPole);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffc070 }); const lampM = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), lampMat); lampM.position.set(1.35, 1.45, 1.9); raft.add(lampM);
    const lampCage = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.22, 6, 1, true), new M({ color: 0x33302c, metalness: .6, roughness: .5, side: THREE.DoubleSide, transparent: true, opacity: .5 })); lampCage.position.set(1.35, 1.45, 1.9); raft.add(lampCage);
    const lamp = new THREE.PointLight(0xffb060, 0, 16, 1.6); lamp.position.set(1.35, 1.5, 1.9); raft.add(lamp);
    // 물가에 낀 이끼·물때
    for (let i = 0; i < 10; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(R(0.3, 0.7), R(0.08, 0.16)), new M({ color: 0x3f5a3a, roughness: 1, transparent: true, opacity: .7, side: THREE.DoubleSide })); const side = i % 2 ? 1 : -1; w.position.set(side * (RW / 2 + 0.05), -0.05, R(-2, 2)); w.rotation.y = Math.PI / 2; raft.add(w); }

    /* ── 사람 (정면이 +z) ── */
    const man = new THREE.Group(); man.position.set(0.1, 0.13, -1.0); raft.add(man);
    const cap = (r, len, mat) => shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), mat));
    const HIP = 0.9;
    const hips = new THREE.Group(); hips.position.y = HIP; man.add(hips);
    const legs = [];
    for (const s of [-1, 1]) {
      const l = new THREE.Group(); l.position.set(s * 0.13, HIP, 0); man.add(l);
      const th = cap(0.085, 0.3, pants); th.position.y = -0.2; l.add(th);
      const knee = new THREE.Group(); knee.position.y = -0.42; l.add(knee);
      const sh = cap(0.06, 0.3, skin); sh.position.y = -0.2; knee.add(sh);
      const ft = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.25), skin)); ft.position.set(0, -0.45, 0.05); knee.add(ft);
      for (let t = 0; t < 3; t++) { const toe = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 5), skin); toe.position.set(-0.035 + t * 0.035, -0.46, 0.18); knee.add(toe); }
      legs.push({ g: l, knee });
    }
    const torso = new THREE.Group(); hips.add(torso);
    const belly = cap(0.19, 0.28, shirt); belly.scale.set(1.15, 1, 0.72); belly.position.y = 0.3; torso.add(belly);
    const shortsTop = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.2, 0.2, 12), pants)); shortsTop.position.y = 0.02; shortsTop.scale.set(1, 1, 0.75); torso.add(shortsTop);
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 6, 20), rope); belt.rotation.x = Math.PI / 2; belt.position.y = 0.12; belt.scale.set(1, 0.78, 1); torso.add(belt);
    const neck = new THREE.Group(); neck.position.y = 0.6; torso.add(neck);
    const neckM = cap(0.055, 0.06, skin); neckM.position.y = 0.03; neck.add(neckM);
    const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 14), skin)); head.scale.set(0.92, 1.12, 0.95); head.position.y = 0.2; neck.add(head);
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), skin); ear.position.set(s * 0.14, 0.2, 0); ear.scale.set(0.5, 1, 0.8); neck.add(ear); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new M({ color: 0xf2ece0, roughness: .3 })); eye.position.set(s * 0.055, 0.23, 0.125); neck.add(eye); const pup = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 5), hair); pup.position.set(s * 0.055, 0.23, 0.145); neck.add(pup); const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.015), hair); brow.position.set(s * 0.055, 0.27, 0.13); brow.rotation.z = s * 0.2; neck.add(brow); }
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), skin); nose.position.set(0, 0.19, 0.145); nose.scale.set(0.8, 1.2, 1); neck.add(nose);
    // 덥수룩한 수염·머리
    for (let i = 0; i < 16; i++) { const a = R(-1.3, 1.3), y = R(0.06, 0.16), r = R(0.035, 0.06); const b = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), hair); b.position.set(Math.sin(a) * 0.12, y - Math.abs(a) * 0.03, Math.cos(a) * 0.11 + 0.02); neck.add(b); }
    for (let i = 0; i < 14; i++) { const a = R(-2.6, 2.6), r = R(0.04, 0.07); const b = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), hair); b.position.set(Math.sin(a) * 0.12, 0.27 + R(0, 0.05), Math.cos(a) * 0.1 - 0.03); neck.add(b); }
    // 밀짚모자 — 헐어서 처진 챙
    const brimG = new THREE.CylinderGeometry(0.34, 0.34, 0.012, 24); { const p = brimG.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const rr = Math.hypot(x, z); p.setY(i, p.getY(i) - rr * rr * 0.35 + Math.sin(Math.atan2(z, x) * 5) * 0.012 * rr); } brimG.computeVertexNormals(); }
    const brim = shadowed(new THREE.Mesh(brimG, straw)); brim.position.y = 0.33; brim.rotation.x = 0.06; neck.add(brim);
    const crown = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.13, 16), straw)); crown.position.y = 0.39; neck.add(crown);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 5, 20), new M({ color: 0x5a3a2a, roughness: 1 })); band.rotation.x = Math.PI / 2; band.position.y = 0.345; neck.add(band);
    function arm(s) {
      const sh = new THREE.Group(); sh.position.set(s * 0.25, 0.53, 0); torso.add(sh);
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), shirt); sh.add(shoulder);
      const up = cap(0.055, 0.22, skin); up.position.y = -0.17; sh.add(up);
      const sleeve = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.068, 0.12, 10), shirt)); sleeve.position.y = -0.07; sh.add(sleeve);
      const el = new THREE.Group(); el.position.y = -0.32; sh.add(el);
      const fo = cap(0.048, 0.22, skin); fo.position.y = -0.15; el.add(fo);
      const hand = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.05), skin)); hand.position.y = -0.32; el.add(hand);
      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.03, 3, 6), skin); thumb.position.set(s * 0.035, -0.3, 0.02); thumb.rotation.z = s * 0.6; el.add(thumb);
      const tip = new THREE.Object3D(); tip.position.y = -0.34; el.add(tip); return { sh, el, tip };
    }
    const armR = arm(1), armL = arm(-1);

    /* ── 메쉬로 만든 진짜 아저씨 (리깅 GLB). 읽히면 코드 사람은 감추고 모자만 머리뼈에 얹는다 ── */
    const RIG = { root: null, b: {}, rest: {}, len: {}, on: false, hatFix: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)) };
    const hat = new THREE.Group(); man.add(hat);
    // 뼈 축(시험으로 확인): 팔 x− = 앞으로 들기, z+ = 오른팔 바깥으로 벌리기(왼팔은 z−), 아래팔 x+ = 팔꿈치 굽힘, 척추 x− = 뒤로 젖힘
    const RIGMAP = { spine: 0.6, arm: 1.0, spread: -0.5, fore: 1.0, knee: 1.0, head: 1.0 };   // 모델이 A-포즈라 팔을 0.5 만큼 몸쪽으로 모아 두고 시작한다
    const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpM = new THREE.Matrix4(), tmpQ2 = new THREE.Quaternion();
    function qset(n, x, y, z) { const b = RIG.b[n]; if (!b) return; b.quaternion.copy(RIG.rest[n]).multiply(tmpQ.setFromEuler(tmpE.set(x, y, z))); }
    // 두 마디 IK — 어깨→팔꿈치→손. 뼈의 +Y 가 뼈 방향(메쉬 리그). 손이 target 에 오도록 위팔·아래팔의 세계 회전을 정한다
    const ikV = { S: new V(), E: new V(), H: new V(), d: new V(), x: new V(), y: new V(), z: new V(), pq: new THREE.Quaternion(), q: new THREE.Quaternion(), m: new THREE.Matrix4() };
    function aimBone(bone, dir, pole, twist) {
      const v = ikV; v.y.copy(dir).normalize(); v.x.crossVectors(pole, v.y); if (v.x.lengthSq() < 1e-6) v.x.set(1, 0, 0); v.x.normalize(); v.z.crossVectors(v.x, v.y).normalize();
      v.m.makeBasis(v.x, v.y, v.z); v.q.setFromRotationMatrix(v.m); if (twist) v.q.multiply(tmpQ.setFromAxisAngle(new V(0, 1, 0), twist));
      bone.parent.getWorldQuaternion(v.pq); bone.quaternion.copy(v.pq.invert()).multiply(v.q); bone.updateMatrixWorld(true);
    }
    function solveArm(side, target, pole, twist) {
      const A = RIG.b[side + 'Arm'], F = RIG.b[side + 'ForeArm'], Hd = RIG.b[side + 'Hand']; if (!A || !F || !Hd) return;
      const v = ikV; A.getWorldPosition(v.S);
      const a = RIG.len[side + 'A'], b = RIG.len[side + 'F'];
      v.d.copy(target).sub(v.S); let d = v.d.length(); const maxD = (a + b) * 0.995; if (d > maxD) { v.d.multiplyScalar(maxD / d); d = maxD; } if (d < 0.02) return;
      // 팔꿈치 각도 (코사인 법칙) → 팔꿈치 자리 = 어깨에서 target 쪽으로 a·cosθ, pole 쪽으로 a·sinθ
      const cosT = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
      const dirN = v.d.clone().normalize(); const side2 = pole.clone().sub(dirN.clone().multiplyScalar(pole.dot(dirN))); if (side2.lengthSq() < 1e-6) side2.set(0, -1, 0); side2.normalize();
      v.E.copy(v.S).addScaledVector(dirN, a * cosT).addScaledVector(side2, a * Math.sqrt(Math.max(0, 1 - cosT * cosT)));
      aimBone(A, v.E.clone().sub(v.S), pole, twist);
      A.getWorldPosition(v.S); F.getWorldPosition(v.E);
      aimBone(F, target.clone().sub(v.E), pole, twist);
    }
    // 1인칭 손 자리 (눈 기준: 앞, 오른쪽, 위) — [오른손 앞,오,위, 왼손 앞,오,위]
    const FP_HANDS = {
      idle: [0.40, 0.14, -0.36, 0.34, -0.06, -0.31], charge: [0.05, 0.42, 0.12, 0.28, -0.04, -0.26], castEnd: [0.50, 0.16, -0.22, 0.36, -0.06, -0.30],
      fight: [0.32, 0.12, -0.34, 0.28, -0.05, -0.27], cheer: [0.28, 0.26, 0.34, 0.28, -0.26, 0.34], eat: [0.40, 0.14, -0.30, 0.16, -0.02, -0.06], sit: [0.36, 0.14, -0.3, 0.32, -0.06, -0.26], down: [0.36, 0.14, -0.3, 0.32, -0.06, -0.26],
    };
    const handCur = { r: new V(), l: new V(), init: false };
    // file:// 로 열면 fetch 가 막히므로 base64 로 감싼 assets/man.glb.js 를 <script> 로 읽어 parse 한다 (http 에선 GLB 직접)
    function loadMan(cb) {
      if (!window.GLTFLoaderClass) return;
      const L = new window.GLTFLoaderClass();
      if (location.protocol === 'file:' || /[?&]embed=1/.test(location.search)) {
        const sc = document.createElement('script'); sc.src = 'assets/man.glb.js';
        sc.onload = () => { const b = atob(window.MAN_GLB); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); window.MAN_GLB = null; L.parse(u.buffer, '', cb, (e) => console.warn('man.glb parse', e)); };
        sc.onerror = () => console.warn('man.glb.js 못 읽음'); document.body.appendChild(sc);
      } else L.load('assets/man.glb', cb, undefined, (e) => console.warn('man.glb 못 읽음', e));
    }
    loadMan((g) => {
      const root = g.scene; root.traverse(o => { if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false; } });
      ['Hips', 'Spine', 'Spine01', 'Spine02', 'neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'RightUpLeg', 'RightLeg'].forEach(n => { const b = root.getObjectByName(n); if (b) { RIG.b[n] = b; RIG.rest[n] = b.quaternion.clone(); } });
      man.add(root); RIG.root = root; RIG.on = true; root.updateMatrixWorld(true);
      for (const sd of ['Right', 'Left']) { const A = RIG.b[sd + 'Arm'], F = RIG.b[sd + 'ForeArm'], H = RIG.b[sd + 'Hand']; if (A && F && H) { const pa = new V(), pf = new V(), ph = new V(); A.getWorldPosition(pa); F.getWorldPosition(pf); H.getWorldPosition(ph); RIG.len[sd + 'A'] = pa.distanceTo(pf); RIG.len[sd + 'F'] = pf.distanceTo(ph); } }
      hips.visible = false; legs.forEach(l => l.g.visible = false);
      [brim, crown, band].forEach(m => { hat.add(m); }); hat.visible = false;   // 메쉬 아저씨는 맨머리 (사장님 "모자는 치워라" 2026-09-07)
      if (RIG.b.Head && fpMode) RIG.b.Head.scale.setScalar(0.001);
    });

    /* ── 낚싯대 (세계 좌표, 손 위치에서 시작) ── */
    const ROD_L = 2.3, SEG = 9, rodSegs = [];
    const rodMat = new M({ color: 0x3a2a1c, roughness: 0.45 }), corkMat = new M({ color: 0xb08a5a, roughness: 0.9 });
    for (let i = 0; i < SEG; i++) { const r0 = 0.016 * (1 - i / SEG) + 0.006, r1 = 0.016 * (1 - (i + 1) / SEG) + 0.006; const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, ROD_L / SEG + 0.01, 7), i === 0 ? corkMat : rodMat); m.geometry.translate(0, ROD_L / SEG / 2, 0); if (i > 0) { const gd = new THREE.Mesh(new THREE.TorusGeometry(r0 + 0.012, 0.004, 4, 8), new M({ color: 0x8b8f96, metalness: .6, roughness: .4 })); gd.position.set(0, 0.1, r0 + 0.012); gd.rotation.x = Math.PI / 2; m.add(gd); } scene.add(m); rodSegs.push(m); }
    const reel = new THREE.Group(); scene.add(reel);
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 14), new M({ color: 0x8b8f96, metalness: .6, roughness: .35 })); reel.add(spool);
    const spoolLine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14), new M({ color: 0xe8e4d8, roughness: .8 })); reel.add(spoolLine);
    const crank = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.01), spool.material); crank.position.set(0.04, 0.035, 0); reel.add(crank);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), rodMat); knob.position.set(0.04, 0.07, 0); reel.add(knob);
    const rodTip = new V(), rodRoot = new V(), rodDir = new V(0, 1, 0);
    const bez = new THREE.QuadraticBezierCurve3(new V(), new V(), new V());
    // 줄
    const LN = 22, lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LN * 3), 3));
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x1c2a30, transparent: true, opacity: 0.85 })); line.frustumCulled = false; scene.add(line);
    // 찌 + 바늘 + 미끼
    const bobber = new THREE.Group(); scene.add(bobber);
    const bTop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 9, 0, Math.PI * 2, 0, Math.PI / 2), new M({ color: 0xe8352a, roughness: .35 })); bobber.add(bTop);
    const bBot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new M({ color: 0xf6f2e8, roughness: .35 })); bobber.add(bBot);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 5), new M({ color: 0xffe08a })); stick.position.y = 0.16; bobber.add(stick);
    const hookLine = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.6, 3), new THREE.MeshBasicMaterial({ color: 0xdddddd })); hookLine.position.y = -0.36; bobber.add(hookLine);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 10, Math.PI * 1.4), new M({ color: 0xa0a4aa, metalness: .7, roughness: .3 })); hook.position.y = -0.7; hook.rotation.z = Math.PI * 0.85; bobber.add(hook);
    const baitMat = new M({ color: 0xb8c6cc, roughness: .6 }); const bait = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), baitMat); bait.scale.set(1.8, 0.8, 0.6); bait.position.y = -0.72; bait.visible = false; bobber.add(bait);
    const hookPoint = new V();

    /* ── 물보라 ── */
    const PN = 120, pPos = new Float32Array(PN * 3), pVel = [], pLife = new Float32Array(PN);
    for (let i = 0; i < PN; i++) { pVel.push(new V()); pLife[i] = 0; pPos[i * 3 + 1] = -50; }
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const dot = document.createElement('canvas'); dot.width = dot.height = 32; { const g = dot.getContext('2d'); const gr = g.createRadialGradient(16, 16, 2, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
    const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xeef6fa, size: 0.16, map: new THREE.CanvasTexture(dot), transparent: true, opacity: .9, depthWrite: false, sizeAttenuation: true })); parts.frustumCulled = false; scene.add(parts);
    const rings = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.renderOrder = 6; scene.add(r); rings.push({ m: r, t: 9, s: 1 }); }
    function splash(p, size) {
      size = size || 1; let n = Math.floor(14 * size + 6);
      for (let i = 0; i < PN && n > 0; i++) if (pLife[i] <= 0) { n--; pLife[i] = 0.6 + Math.random() * 0.5; pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z; const a = Math.random() * 6.28, sp = (0.6 + Math.random() * 1.6) * Math.sqrt(size); pVel[i].set(Math.cos(a) * sp, 2 + Math.random() * 2.2 * Math.sqrt(size), Math.sin(a) * sp); }
      const r = rings.reduce((a, b) => a.t > b.t ? a : b); r.t = 0; r.s = 0.4 * Math.sqrt(size); r.m.position.set(p.x, p.y + 0.03, p.z);
    }

    /* ── 갈매기 ── */
    const gulls = []; const gullMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2, emissive: 0x9a9a9a, side: THREE.DoubleSide }), gullTip = new THREE.MeshLambertMaterial({ color: 0x444, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), gullMat); body.scale.set(1.9, 0.8, 0.8); g.add(body);
      const wings = []; for (const s of [-1, 1]) { const w = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.18), gullMat); p.position.x = s * 0.25; w.add(p); const t = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.14), gullTip); t.position.x = s * 0.56; w.add(t); w.rotation.x = -Math.PI / 2; g.add(w); wings.push(w); }
      scene.add(g); gulls.push({ g, wings, a: Math.random() * 6.28, r: 4 + Math.random() * 7, h: 7 + Math.random() * 6, sp: (0.25 + Math.random() * 0.2) * (i % 2 ? 1 : -1), ph: Math.random() * 6, cx: 0, cz: 0 });
    }
    const gullCenter = new V(6, 0, -14);

    /* ── 섬 (엔딩) ── */
    const island = new THREE.Group(); island.visible = false; scene.add(island);
    const green = new M({ color: 0x3f7a3a, roughness: 1, flatShading: true }), sand = new M({ color: 0xd9c89a, roughness: 1 });
    [[0, 0, 26, 14], [-22, 6, 18, 9], [20, -4, 20, 11], [-6, -12, 12, 6]].forEach(([x, z, r, h]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9), green); m.position.set(x, h / 2 - 1.5, z); island.add(m); });
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(48, 52, 1.2, 24), sand); beach.position.y = -0.4; island.add(beach);
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, pr = 36 + Math.random() * 8; const t = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 7, 5), woodD); t.position.set(Math.cos(a) * pr, 3.3, Math.sin(a) * pr); t.rotation.z = (Math.random() - .5) * .4; island.add(t); const c = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.6, 6), green); c.position.set(Math.cos(a) * pr, 7.2, Math.sin(a) * pr); island.add(c); }

    /* ── 자세 ── */
    // [hipsPitch, shR pitch, shR yaw, elR, shL pitch, shL yaw, elL, head pitch, rodPitch(도), torsoYaw, kneeBend]
    const POSE = {
      idle: [0.02, -0.55, -0.15, -1.25, -0.7, 0.35, -1.55, 0.15, 42, 0.15, 0.12],
      charge: [-0.3, -2.7, 0.3, -0.7, -1.9, 0.5, -1.2, -0.25, 128, -0.55, 0.35],
      castEnd: [0.28, -0.2, -0.1, -0.5, -0.55, 0.3, -1.4, 0.3, 8, 0.45, 0.3],
      fight: [-0.4, -1.1, -0.2, -1.5, -1.0, 0.4, -1.7, 0.05, 62, 0.1, 0.55],
      eat: [0.4, -0.3, -0.1, -1.1, -1.9, 0.6, -2.5, 0.4, 30, 0.1, 0.45],
      sit: [0.1, -0.2, 0.2, -0.9, -0.2, -0.2, -0.9, 0.05, 20, 0, 0],
      down: [1.2, 0.3, 0.6, -0.3, 0.3, -0.6, -0.3, -0.5, -10, 0, 0],
      cheer: [-0.12, -2.5, 0.2, -0.5, -2.5, -0.2, -0.5, -0.35, 70, 0, 0.1],
    };
    // 1인칭용 — 손을 낮추고 대를 오른쪽 위로 기울여 시야를 비운다
    const POSE_FP = {
      idle: [0.02, -1.15, -0.3, -1.6, -1.2, 0.4, -1.8, 0.15, 48, 0.15, 0.12],
      charge: [-0.22, -1.5, -1.0, -0.5, -1.2, 0.7, -1.2, -0.25, 110, -0.4, 0.35],   // 옆으로 젖혀 팔이 시야를 안 가리게
      castEnd: [0.22, -0.5, -0.45, -0.8, -0.6, 0.5, -1.3, 0.3, 18, 0.35, 0.3],
      fight: [-0.3, -0.8, -0.45, -1.4, -0.9, 0.6, -1.6, 0.05, 66, 0.1, 0.55],
      eat: [0.3, -0.2, -0.3, -1.0, -1.7, 0.6, -2.4, 0.4, 35, 0.1, 0.45],
      cheer: [-0.12, -2.5, 0.2, -0.5, -2.5, -0.2, -0.5, -0.35, 70, 0, 0.1],
    };
    let fpMode = false, lastPose = 'idle', lastBlend = null, poseSpeed = 7;
    const NP = 11, cur = POSE.idle.slice(), tgt = POSE.idle.slice();
    function setPose(name, k, blend, speed) { lastPose = name; lastBlend = blend; poseSpeed = speed || 7; const a = (fpMode && POSE_FP[name]) || POSE[name]; if (blend != null) { const b = POSE[blend.to]; for (let i = 0; i < NP; i++) tgt[i] = a[i] + (b[i] - a[i]) * blend.t; } else for (let i = 0; i < NP; i++) tgt[i] = a[i]; }
    let facing = 0, rodBend = 0, lineSlack = 0.3, lineTo = new V(0, 0, 4), lineOn = true, manDown = 0, manSit = 0, lookYaw = 0;

    const W = {
      raft, man, bobber, hookPoint, rodTip, island, gullCenter, lamp, sail, splash, setPose,
      setFacing(y) { facing = y; }, setRodBend(b) { rodBend = b; }, setLine(on, to, slack) { lineOn = on; if (to) lineTo.copy(to); if (slack != null) lineSlack = slack; },
      // t 는 미끼로 쓴 고기의 등급(1~3). 2 이상이면 큼직하게 — 3등급 대물도 미끼가 된다(2026-09-11)
      setBait(t) { bait.visible = t > 0; baitMat.color.setHex(t === 1 ? 0xb8c6cc : 0xd9a44a); const big = t >= 2; bait.scale.set(big ? 2.4 : 1.8, big ? 1.1 : 0.8, big ? 0.8 : 0.6); },
      setRack(n) { rackFish.forEach((f, i) => f.visible = i < n); },
      // 1인칭: 머리를 감추고(카메라가 그 자리) 눈 위치를 내준다
      setFirstPerson(on) { if (fpMode === on) return; fpMode = on; neck.visible = !on; if (RIG.b.Head) { RIG.b.Head.scale.setScalar(on ? 0.001 : 1); } setPose(lastPose, null, lastBlend); },
      eye(out) { if (RIG.b.Head) { RIG.b.Head.getWorldPosition(out); const f = new V(Math.sin(facing), 0, Math.cos(facing)); return out.addScaledVector(f, 0.1).add(new V(0, 0.06, 0)); } return neck.localToWorld(out.set(-0.05, 0.24, 0.1)); },
      RIG, RIGMAP, POSE, POSE_FP,
      raftPos: new V(), deck: new V(),
      deckPoint(x, z, out) { out.set(x, 0.14, z); raft.localToWorld(out); return out; },
      update(dt, ctx) {
        const t = ctx.time;
        // 뗏목이 파도를 탄다
        const h = sea.height(0, 0), sl = sea.slope(0, 0, 1.4);
        raft.position.y += ((h + 0.12) - raft.position.y) * Math.min(1, dt * 4);
        raft.rotation.x += (Math.atan(sl.dz) * 0.8 - raft.rotation.x) * Math.min(1, dt * 3);
        raft.rotation.z += (-Math.atan(sl.dx) * 0.8 - raft.rotation.z) * Math.min(1, dt * 3);
        raft.getWorldPosition(W.raftPos);
        // 돛 펄럭임
        { const p = sailG.attributes.position; for (let i = 0; i < p.count; i++) { const x = sailBase[i * 3], y = sailBase[i * 3 + 1]; p.setZ(i, Math.sin(t * 3 + x * 4 + y * 2) * 0.06 * (x + 0.55) + Math.sin(t * 5.3 + y * 6) * 0.02); } p.needsUpdate = true; sailG.computeVertexNormals(); }
        // 등불
        lamp.intensity = ctx.night * 7; lampMat.color.setHex(ctx.night > 0.05 ? 0xffc070 : 0x6a5a48); lamp.getWorldPosition(sea.U.uLampPos.value);
        // 사람 자세
        const k = Math.min(1, dt * poseSpeed); for (let i = 0; i < NP; i++) cur[i] += (tgt[i] - cur[i]) * k;
        if (poseSpeed > 7 && Math.abs(tgt[1] - cur[1]) < 0.05) poseSpeed = 7;   // 던지기처럼 빠른 동작은 닿으면 보통 속도로
        man.rotation.y = facing;
        const breath = Math.sin(t * 1.6) * 0.02, sway = Math.sin(t * 0.9) * 0.015;
        // 고개는 찌·물고기 쪽을 본다
        { const ml = man.worldToLocal(lineTo.clone()); const want = Math.max(-0.9, Math.min(0.9, Math.atan2(ml.x, ml.z))); lookYaw += (want - lookYaw) * Math.min(1, dt * 3); }
        hips.rotation.x = cur[0] + breath; hips.rotation.y = cur[9] + lookYaw * 0.25; hips.rotation.z = sway;
        armR.sh.rotation.set(cur[1], cur[2], -0.25); armR.el.rotation.x = cur[3]; armL.sh.rotation.set(cur[4], cur[5], 0.3); armL.el.rotation.x = cur[6]; neck.rotation.x = cur[7]; neck.rotation.y = lookYaw * 0.6;
        const kb = cur[10]; hips.position.y = HIP - kb * 0.12;
        legs.forEach((l, i) => { l.g.rotation.x = -kb * 0.55 + manSit * (i ? 1.3 : 1.5) + manDown * 0.2; l.knee.rotation.x = kb * 1.1 - manSit * 0.6; l.g.rotation.z = i ? -0.05 : 0.05; l.g.position.y = HIP - kb * 0.12; });
        manDown += ((ctx.down ? 1 : 0) - manDown) * Math.min(1, dt * 2); manSit += ((ctx.sit ? 1 : 0) - manSit) * Math.min(1, dt * 2);
        man.rotation.x = manDown * Math.PI / 2 * 0.95; man.position.y = 0.13 + manDown * 0.12 - manSit * 0.5;
        // 낚싯대: 오른손에서 시작, 각도는 자세가 정한다
        if (RIG.on) {
          const m = RIGMAP; man.updateMatrixWorld(true);
          // 살아 있는 움직임: 숨·무게 옮기기·두리번거림·당기기·릴 감기·씹기
          const idleish = lastPose === 'idle' || lastPose === 'castEnd';
          const pull = ctx.pull || 0, crank = ctx.crank ? Math.sin(t * 28) * 0.18 : 0, chew = ctx.eat ? Math.sin(t * 9) * 0.05 : 0;
          const lookX = idleish ? Math.sin(t * 0.23) * 0.1 : 0, lookY = idleish ? Math.sin(t * 0.37) * 0.3 + Math.sin(t * 0.11) * 0.2 : 0;
          const shift = Math.sin(t * 0.5);
          qset('Hips', 0, 0, shift * 0.03); if (RIG.b.Hips && RIG.rest.hipsX == null) RIG.rest.hipsX = RIG.b.Hips.position.x;
          qset('Spine', cur[0] * m.spine + breath * 2.5 - pull * 0.18, cur[9] + lookYaw * 0.25 + lookY * 0.25, sway * 2 - shift * 0.03); qset('Spine01', cur[0] * 0.35 - pull * 0.1, 0, 0);
          const spr = m.spread + (fpMode ? 0.05 : 0), micro = Math.sin(t * 1.3) * 0.02;
          qset('RightArm', cur[1] * m.arm - pull * 0.25 + micro, 0, spr);
          qset('RightForeArm', -cur[3] * m.fore + pull * 0.2, 0, 0);
          qset('LeftArm', cur[4] * m.arm - pull * 0.2 + micro, 0, -spr);
          qset('LeftForeArm', -cur[6] * m.fore + crank, 0, 0);
          qset('Head', cur[7] * m.head + lookX + chew - pull * 0.1, lookYaw * 0.6 + lookY, 0);
          const kb2 = cur[10]; qset('RightUpLeg', -kb2 * 0.5 * m.knee, 0, 0); qset('LeftUpLeg', -kb2 * 0.5 * m.knee, 0, 0); qset('RightLeg', kb2 * m.knee, 0, 0); qset('LeftLeg', kb2 * m.knee, 0, 0);
          if (RIG.b.Hips) { RIG.b.Hips.position.y = RIG.rest.hipsY == null ? (RIG.rest.hipsY = RIG.b.Hips.position.y) : RIG.rest.hipsY - kb2 * 0.12 - Math.abs(shift) * 0.01; RIG.b.Hips.position.x = RIG.rest.hipsX + shift * 0.02; }
          man.updateMatrixWorld(true);
          if (fpMode && ctx.fp && RIG.b.Head) {
            // 1인칭: 손을 눈앞 정해진 자리에 두고 팔이 따라온다
            const eye = W.eye(new V()); const p = ctx.fp.pitch || 0;
            const Fw = new V(Math.sin(facing) * Math.cos(p), Math.sin(p), Math.cos(facing) * Math.cos(p)), Rt = new V(Math.cos(facing), 0, -Math.sin(facing)), Up = new V().crossVectors(Fw, Rt).normalize();
            const hp = FP_HANDS[lastPose] || FP_HANDS.idle;
            const rT = eye.clone().addScaledVector(Fw, hp[0]).addScaledVector(Rt, hp[1]).addScaledVector(Up, hp[2]);
            const lT = eye.clone().addScaledVector(Fw, hp[3]).addScaledVector(Rt, hp[4]).addScaledVector(Up, hp[5]);
            if (!handCur.init) { handCur.r.copy(rT); handCur.l.copy(lT); handCur.init = true; } else { const kk = Math.min(1, dt * 8); handCur.r.lerp(rT, kk); handCur.l.lerp(lT, kk); }
            const poleR = new V().copy(Rt).multiplyScalar(0.6).addScaledVector(Up, -1).normalize(), poleL = new V().copy(Rt).multiplyScalar(-0.6).addScaledVector(Up, -1).normalize();
            solveArm('Right', handCur.r, poleR, 0); solveArm('Left', handCur.l, poleL, 0);
            man.updateMatrixWorld(true);
          }
          // 모자는 머리뼈를 따라간다
          if (RIG.b.Head) { RIG.b.Head.getWorldPosition(hat.position); man.worldToLocal(hat.position); RIG.b.Head.getWorldQuaternion(tmpQ2); man.getWorldQuaternion(tmpQ); hat.quaternion.copy(tmpQ.invert()).multiply(tmpQ2).multiply(RIG.hatFix); }
          if (RIG.b.RightHand) RIG.b.RightHand.getWorldPosition(rodRoot); else armR.tip.getWorldPosition(rodRoot);
        } else armR.tip.getWorldPosition(rodRoot);
        const rp = cur[8] * Math.PI / 180, ry = facing - (fpMode ? 0.45 : 0.06); rodDir.set(Math.sin(ry) * Math.cos(rp), Math.sin(rp), Math.cos(ry) * Math.cos(rp));
        const L = ROD_L; const toT = lineTo.clone().sub(rodRoot); const perp = toT.sub(rodDir.clone().multiplyScalar(toT.dot(rodDir))); if (perp.lengthSq() > 1e-4) perp.normalize(); else perp.set(0, -1, 0);
        const b = rodBend;
        bez.v0.copy(rodRoot).addScaledVector(rodDir, -0.25); bez.v1.copy(rodRoot).addScaledVector(rodDir, L * 0.55); bez.v2.copy(rodRoot).addScaledVector(rodDir, L * (1 - 0.45 * b)).addScaledVector(perp, L * 0.6 * b);
        for (let i = 0; i < SEG; i++) { const p0 = bez.getPoint(i / SEG), p1 = bez.getPoint((i + 1) / SEG); const d = p1.clone().sub(p0); rodSegs[i].position.copy(p0); rodSegs[i].scale.y = d.length() / (ROD_L / SEG) * 1.06; rodSegs[i].quaternion.setFromUnitVectors(new V(0, 1, 0), d.normalize()); }   // 마디가 벌어지지 않게 길이를 맞춘다
        rodTip.copy(bez.v2); reel.position.copy(rodRoot).addScaledVector(rodDir, 0.12).y -= 0.07; reel.rotation.set(0, facing, Math.PI / 2); reel.children[2].rotation.y = t * (b > 0.2 ? 12 : 0);
        // 줄
        line.visible = lineOn;
        if (lineOn) { const p = lineGeo.attributes.position; const mid = rodTip.clone().add(lineTo).multiplyScalar(0.5); mid.y -= rodTip.distanceTo(lineTo) * 0.18 * lineSlack; for (let i = 0; i < LN; i++) { const s = i / (LN - 1); const x = (1 - s) * (1 - s) * rodTip.x + 2 * (1 - s) * s * mid.x + s * s * lineTo.x, y = (1 - s) * (1 - s) * rodTip.y + 2 * (1 - s) * s * mid.y + s * s * lineTo.y, z = (1 - s) * (1 - s) * rodTip.z + 2 * (1 - s) * s * mid.z + s * s * lineTo.z; p.setXYZ(i, x, y, z); } p.needsUpdate = true; }
        hookPoint.set(0, -0.72, 0); bobber.localToWorld(hookPoint);
        // 물보라
        { const p = pGeo.attributes.position; for (let i = 0; i < PN; i++) if (pLife[i] > 0) { pLife[i] -= dt; pVel[i].y -= 9.8 * dt; pPos[i * 3] += pVel[i].x * dt; pPos[i * 3 + 1] += pVel[i].y * dt; pPos[i * 3 + 2] += pVel[i].z * dt; if (pLife[i] <= 0 || pPos[i * 3 + 1] < -0.5) { pLife[i] = 0; pPos[i * 3 + 1] = -50; } } p.needsUpdate = true; }
        for (const r of rings) { if (r.t < 2) { r.t += dt; const s = r.s + r.t * 2.2; r.m.scale.set(s, s, 1); r.m.material.opacity = Math.max(0, 0.6 * (1 - r.t / 1.6)); r.m.position.y = sea.height(r.m.position.x, r.m.position.z) + 0.03; } }
        // 갈매기
        for (const g of gulls) { g.a += g.sp * dt; g.cx += (gullCenter.x - g.cx) * dt * 0.3; g.cz += (gullCenter.z - g.cz) * dt * 0.3; const x = g.cx + Math.cos(g.a) * g.r, z = g.cz + Math.sin(g.a) * g.r, y = g.h + Math.sin(t * 0.7 + g.ph) * 0.8; g.g.position.set(x, y, z); g.g.rotation.y = -g.a + (g.sp > 0 ? Math.PI : 0); g.g.rotation.z = g.sp > 0 ? 0.25 : -0.25; const fl = Math.sin(t * 6 + g.ph) * 0.5; g.wings[0].rotation.z = fl; g.wings[1].rotation.z = -fl; }
      },
    };
    W.setBait(0);
    return W;
  }
  window.WORLD = { build };
})();
