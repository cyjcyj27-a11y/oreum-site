// 숨길 물건 모음: 하나하나 크기 1 안팎(가장 긴 변), 바닥 y=0, 가운데 x=z=0
// fx: 판 끝 카드로 골랐을 때 다음 판에 주는 것 — time(시간) · hint(힌트) · guard(오답 막기)
(function () {
  const T = THREE;
  const { rbox, mesh, group, mat, tex } = K;
  const I = (window.ITEMS = {});
  const m = (c, o) => mat(c, Object.assign({ roughness: 0.5 }, o || {}));
  const metal = (c, r) => mat(c, { roughness: r == null ? 0.3 : r, metalness: 0.75 });
  const dark = () => m('#2a2522', { roughness: 0.6 });

  function def(id, ko, en, fx, make, o) {
    I[id] = Object.assign({ id, ko, en, fx, make }, o || {});
  }

  // ── 열쇠 (누워 있음)
  def('key', '열쇠', 'Key', 'guard', (g) => {
    const b = metal('#d6a93a', 0.28);
    const ring = mesh(K.torus(0.17, 0.06), b, -0.33, 0.06, 0, g); ring.rotation.x = Math.PI / 2;
    mesh(rbox(0.62, 0.08, 0.09, 0.03), b, 0.1, 0.05, 0, g);
    mesh(rbox(0.07, 0.08, 0.2, 0.02), b, 0.33, 0.05, 0.1, g);
    mesh(rbox(0.07, 0.08, 0.14, 0.02), b, 0.2, 0.05, 0.07, g);
  });

  // ── 숟가락
  def('spoon', '숟가락', 'Spoon', 'hint', (g) => {
    const s = metal('#d9dde2', 0.18);
    const bowl = mesh(K.sphere(0.16, 20, 12), s, -0.34, 0.06, 0, g); bowl.scale.set(1.25, 0.32, 0.9);
    const h = mesh(rbox(0.7, 0.04, 0.07, 0.02), s, 0.16, 0.05, 0, g); h.rotation.z = 0.08;
  });

  // ── 고무 오리
  def('duck', '고무 오리', 'Rubber Duck', 'guard', (g) => {
    const y = m('#ffd23a', { roughness: 0.35 });
    const body = mesh(K.sphere(0.4, 24, 16), y, 0, 0.32, 0, g); body.scale.set(1.15, 0.8, 0.9);
    mesh(K.sphere(0.24, 20, 14), y, 0.26, 0.72, 0, g);
    const beak = mesh(K.sphere(0.11, 14, 10), m('#ff8a2a', { roughness: 0.4 }), 0.48, 0.68, 0, g); beak.scale.set(1.3, 0.5, 0.9);
    [-1, 1].forEach((s) => mesh(K.sphere(0.035, 8, 6), dark(), 0.38, 0.8, s * 0.12, g));
    const tail = mesh(K.cone(0.12, 0.22, 12), y, -0.46, 0.5, 0, g); tail.rotation.z = 1.0;
  });

  // ── 사과
  def('apple', '사과', 'Apple', 'time', (g) => {
    const a = mesh(K.sphere(0.42, 24, 18), m('#d8312c', { roughness: 0.35 }), 0, 0.4, 0, g); a.scale.set(1, 0.92, 1);
    mesh(K.cyl(0.025, 0.03, 0.2, 6), m('#5a3a1e'), 0, 0.84, 0, g).rotation.z = 0.2;
    const lf = mesh(K.sphere(0.12, 10, 8), m('#4a9a3a'), 0.12, 0.86, 0, g); lf.scale.set(1, 0.25, 0.5); lf.rotation.z = -0.4;
  });

  // ── 바나나
  def('banana', '바나나', 'Banana', 'time', (g) => {
    const b = mesh(K.torus(0.42, 0.1, Math.PI * 0.7), m('#f5d03a', { roughness: 0.5 }), 0, 0.1, 0, g);
    b.rotation.x = Math.PI / 2; b.rotation.z = Math.PI * 0.15; b.scale.set(1, 1, 0.9);
    const tip = mesh(K.cyl(0.03, 0.05, 0.1, 6), m('#4a3a20'), 0.37, 0.1, 0.29, g); tip.rotation.x = Math.PI / 2;
  });

  // ── 당근
  def('carrot', '당근', 'Carrot', 'time', (g) => {
    const c = mesh(K.cone(0.14, 0.8, 16), m('#f07a22', { roughness: 0.6 }), 0, 0.13, 0, g); c.rotation.z = Math.PI / 2;
    const lf = m('#3e9a3a', { roughness: 0.6 });
    [-0.4, 0, 0.4].forEach((a) => { const l = mesh(K.cone(0.05, 0.34, 6), lf, 0.56, 0.13 + a * 0.12, a * 0.1, g); l.rotation.z = -Math.PI / 2 + a; });
  });

  // ── 버섯
  def('mushroom', '버섯', 'Mushroom', 'hint', (g) => {
    mesh(K.cyl(0.13, 0.16, 0.42, 14), m('#fff3df', { roughness: 0.8 }), 0, 0.21, 0, g);
    const cap = mesh(new T.SphereGeometry(0.36, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), m('#e0352c', { roughness: 0.5 }), 0, 0.4, 0, g); cap.scale.set(1, 0.7, 1);
    const w = m('#ffffff', { roughness: 0.6 });
    [[0.15, 0.6, 0.12], [-0.17, 0.58, 0.1], [0, 0.64, -0.12], [0.05, 0.6, 0.22]].forEach(([x, y, z]) => mesh(K.sphere(0.05, 8, 6), w, x, y, z, g));
  });

  // ── 안경 (누워 있음, 다리 접힘)
  def('glasses', '안경', 'Glasses', 'hint', (g) => {
    const f = m('#1d1d22', { roughness: 0.3 });
    const fr = group(0, 0.2, 0, g); fr.rotation.x = -0.35;
    [-1, 1].forEach((s) => mesh(K.torus(0.19, 0.035), f, s * 0.24, 0, 0, fr));
    mesh(K.torus(0.06, 0.03, Math.PI), f, 0, 0.04, 0, fr);
    const lens = new T.MeshStandardMaterial({ color: 0xbfe2ff, roughness: 0.05, transparent: true, opacity: 0.45 });
    [-1, 1].forEach((s) => { const l = mesh(K.cyl(0.18, 0.18, 0.01, 20), lens, s * 0.24, 0, 0, fr); l.rotation.x = Math.PI / 2; });
    [-1, 1].forEach((s) => mesh(rbox(0.05, 0.04, 0.42, 0.015), f, s * 0.42, 0.04, -0.2, g));
  });

  // ── 가위
  def('scissors', '가위', 'Scissors', 'guard', (g) => {
    const s = metal('#cfd4da', 0.2), h = m('#e8443a', { roughness: 0.4 });
    [-1, 1].forEach((sd) => {
      const bl = mesh(rbox(0.6, 0.03, 0.08, 0.02), s, 0.2, 0.04, 0, g); bl.rotation.y = sd * 0.16;
      const r = mesh(K.torus(0.12, 0.045), h, -0.22, 0.05, sd * 0.13, g); r.rotation.x = Math.PI / 2; r.scale.set(1.2, 1, 1);
    });
    mesh(K.cyl(0.03, 0.03, 0.06, 8), metal('#888888'), 0.02, 0.06, 0, g);
  });

  // ── 망치
  def('hammer', '망치', 'Hammer', 'guard', (g) => {
    mesh(rbox(0.86, 0.08, 0.1, 0.03), m('#c08a4e', { roughness: 0.6 }), 0, 0.06, 0, g);
    mesh(rbox(0.14, 0.14, 0.42, 0.03), metal('#6c7177', 0.4), 0.4, 0.08, 0, g);
    mesh(K.cyl(0.07, 0.07, 0.08, 12), metal('#6c7177', 0.4), 0.4, 0.08, 0.24, g).rotation.x = Math.PI / 2;
  });

  // ── 연필
  def('pencil', '연필', 'Pencil', 'hint', (g) => {
    const b = mesh(K.cyl(0.055, 0.055, 0.78, 6), m('#f5c52e', { roughness: 0.5 }), 0, 0.06, 0, g); b.rotation.z = Math.PI / 2;
    const t = mesh(K.cone(0.055, 0.16, 6), m('#e8c9a0', { roughness: 0.8 }), 0.47, 0.06, 0, g); t.rotation.z = -Math.PI / 2;
    const lead = mesh(K.cone(0.02, 0.06, 6), dark(), 0.54, 0.06, 0, g); lead.rotation.z = -Math.PI / 2;
    const er = mesh(K.cyl(0.055, 0.055, 0.1, 10), m('#f08aa0'), -0.44, 0.06, 0, g); er.rotation.z = Math.PI / 2;
    const fe = mesh(K.cyl(0.06, 0.06, 0.06, 10), metal('#bfc4c9'), -0.37, 0.06, 0, g); fe.rotation.z = Math.PI / 2;
  });

  // ── 머그컵
  def('mug', '머그컵', 'Mug', 'time', (g) => {
    const c = m('#3a8fd6', { roughness: 0.3 });
    mesh(K.cyl(0.3, 0.27, 0.62, 22), c, 0, 0.31, 0, g);
    mesh(K.cyl(0.26, 0.26, 0.02, 18), m('#5a3420', { roughness: 0.15 }), 0, 0.58, 0, g);
    const h = mesh(K.torus(0.17, 0.05, Math.PI * 1.1), c, 0.31, 0.32, 0, g); h.rotation.z = -Math.PI / 2 - 0.15;
    mesh(K.cyl(0.302, 0.302, 0.08, 22), m('#ffffff', { roughness: 0.3 }), 0, 0.42, 0, g);
  });

  // ── 중절모
  def('hat', '모자', 'Hat', 'guard', (g) => {
    const f = m('#4a3a5c', { roughness: 0.85 });
    mesh(K.cyl(0.5, 0.5, 0.05, 28), f, 0, 0.03, 0, g).scale.set(1, 1, 0.85);
    mesh(K.cyl(0.29, 0.32, 0.44, 24), f, 0, 0.27, 0, g).scale.set(1, 1, 0.85);
    mesh(K.cyl(0.325, 0.325, 0.09, 24), m('#c9a24a', { roughness: 0.6 }), 0, 0.11, 0, g).scale.set(1, 1, 0.85);
  });

  // ── 운동화
  def('shoe', '운동화', 'Sneaker', 'time', (g) => {
    const w = m('#f4f1ea', { roughness: 0.7 }), r = m('#e34a3b', { roughness: 0.6 });
    mesh(rbox(0.95, 0.1, 0.36, 0.05), w, 0, 0.05, 0, g);
    const up = mesh(K.sphere(0.3, 18, 12), r, 0.12, 0.22, 0, g); up.scale.set(1.45, 0.65, 0.58);
    mesh(rbox(0.36, 0.38, 0.32, 0.1), r, -0.26, 0.28, 0, g);
    mesh(rbox(0.12, 0.05, 0.3, 0.02), w, -0.26, 0.48, 0, g);
    [0, 0.12, 0.24].forEach((x) => mesh(rbox(0.04, 0.02, 0.2, 0.01), w, x, 0.38 - x * 0.25, 0, g));
  });

  // ── 전구
  def('bulb', '전구', 'Light Bulb', 'hint', (g) => {
    const gl = new T.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffd86a, emissiveIntensity: 0.35, roughness: 0.15 });
    const b = mesh(K.sphere(0.3, 22, 16), gl, 0, 0.62, 0, g); b.scale.set(1, 1.08, 1);
    mesh(K.cyl(0.13, 0.17, 0.2, 16), gl, 0, 0.38, 0, g);
    const s = metal('#b9bec4', 0.35);
    [0.25, 0.18, 0.11].forEach((y) => mesh(K.cyl(0.13, 0.13, 0.05, 14), s, 0, y, 0, g));
    mesh(K.cyl(0.07, 0.04, 0.08, 10), dark(), 0, 0.04, 0, g);
  });

  // ── 종
  def('bell', '종', 'Bell', 'guard', (g) => {
    const b = metal('#e0b23a', 0.22);
    mesh(K.lathe('bell', [[0, 0.72], [0.12, 0.7], [0.2, 0.6], [0.24, 0.35], [0.3, 0.14], [0.38, 0.06], [0.39, 0.0], [0, 0.0]]), b, 0, 0, 0, g);
    mesh(K.torus(0.07, 0.025), b, 0, 0.78, 0, g);
    mesh(K.sphere(0.07, 10, 8), metal('#8a6a2a'), 0, 0.02, 0, g);
  });

  // ── 자명종
  def('alarm', '자명종', 'Alarm Clock', 'time', (g) => {
    const c = m('#e34a5a', { roughness: 0.35 });
    const body = mesh(K.cyl(0.32, 0.32, 0.22, 26), c, 0, 0.4, 0, g); body.rotation.x = Math.PI / 2;
    const face = mesh(K.cyl(0.27, 0.27, 0.23, 26), m('#fffaf0', { roughness: 0.6 }), 0, 0.4, 0.005, g); face.rotation.x = Math.PI / 2;
    const d = dark();
    mesh(K.box(0.03, 0.18, 0.01), d, 0, 0.47, 0.12, g);
    mesh(K.box(0.14, 0.03, 0.01), d, 0.06, 0.4, 0.12, g);
    [-1, 1].forEach((s) => {
      const bell = mesh(new T.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), metal('#d9dde2', 0.25), s * 0.2, 0.66, 0, g); bell.rotation.z = -s * 0.5;
      const leg = mesh(K.cyl(0.025, 0.025, 0.16, 6), d, s * 0.2, 0.08, 0, g); leg.rotation.z = s * 0.4;
    });
  });

  // ── 모래시계
  def('hourglass', '모래시계', 'Hourglass', 'time', (g) => {
    const w = m('#8a5a32', { roughness: 0.5 });
    mesh(K.cyl(0.3, 0.3, 0.07, 18), w, 0, 0.035, 0, g);
    mesh(K.cyl(0.3, 0.3, 0.07, 18), w, 0, 0.93, 0, g);
    [[-1, -1], [1, -1], [0, 1]].forEach(([a, b]) => mesh(K.cyl(0.03, 0.03, 0.86, 6), w, a * 0.22, 0.48, b * 0.2, g));
    const gl = new T.MeshStandardMaterial({ color: 0xdff2ff, roughness: 0.05, transparent: true, opacity: 0.35 });
    mesh(K.lathe('hg', [[0, 0.07], [0.2, 0.08], [0.2, 0.22], [0.04, 0.48], [0.2, 0.74], [0.2, 0.89], [0, 0.9]]), gl, 0, 0, 0, g);
    const sand = m('#f2c46a', { roughness: 0.9 });
    mesh(K.cone(0.18, 0.22, 16), sand, 0, 0.19, 0, g);
    const top = mesh(K.cone(0.12, 0.13, 16), sand, 0, 0.6, 0, g); top.rotation.x = Math.PI;
  });

  // ── 돋보기
  def('loupe', '돋보기', 'Magnifier', 'hint', (g) => {
    const rim = metal('#c9a24a', 0.25);
    const r = mesh(K.torus(0.24, 0.045), rim, -0.18, 0.06, 0, g); r.rotation.x = Math.PI / 2;
    mesh(K.cyl(0.23, 0.23, 0.02, 24), new T.MeshStandardMaterial({ color: 0xcfeaff, roughness: 0.02, transparent: true, opacity: 0.5 }), -0.18, 0.06, 0, g);
    const h = mesh(K.cyl(0.05, 0.06, 0.5, 10), m('#5a2e1a', { roughness: 0.4 }), 0.3, 0.06, 0, g); h.rotation.z = Math.PI / 2;
  });

  // ── 물고기 인형
  def('fish', '물고기', 'Fish', 'time', (g) => {
    const b = m('#3fb0c9', { roughness: 0.5 });
    const body = mesh(K.sphere(0.3, 20, 14), b, 0, 0.3, 0, g); body.scale.set(1.45, 0.85, 0.5);
    const tail = mesh(K.cone(0.22, 0.3, 4), m('#f5a33a'), -0.52, 0.3, 0, g); tail.rotation.z = -Math.PI / 2; tail.scale.set(1, 1, 0.25);
    const fin = mesh(K.cone(0.1, 0.18, 4), m('#f5a33a'), 0, 0.55, 0, g); fin.scale.set(1.2, 1, 0.3);
    [-1, 1].forEach((s) => { mesh(K.sphere(0.07, 10, 8), m('#ffffff'), 0.27, 0.36, s * 0.12, g); mesh(K.sphere(0.035, 8, 6), dark(), 0.31, 0.37, s * 0.15, g); });
  });

  // ── 별
  def('star', '별', 'Star', 'hint', (g) => {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? 0.2 : 0.48;
      i ? s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    const geo = new T.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 });
    geo.translate(0, 0.46, -0.06);
    mesh(geo, m('#ffc928', { roughness: 0.3, metalness: 0.2 }), 0, 0, 0, g);
  });

  // ── 하트
  def('heart', '하트', 'Heart', 'guard', (g) => {
    const s = new T.Shape();
    s.moveTo(0, -0.42);
    s.bezierCurveTo(-0.5, -0.05, -0.5, 0.38, -0.24, 0.38);
    s.bezierCurveTo(-0.08, 0.38, 0, 0.26, 0, 0.18);
    s.bezierCurveTo(0, 0.26, 0.08, 0.38, 0.24, 0.38);
    s.bezierCurveTo(0.5, 0.38, 0.5, -0.05, 0, -0.42);
    const geo = new T.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3 });
    geo.translate(0, 0.46, -0.07);
    mesh(geo, m('#f0466e', { roughness: 0.35 }), 0, 0, 0, g);
  });

  // ── 주사위 (면마다 눈 1~6)
  def('dice', '주사위', 'Dice', 'guard', (g) => {
    const P6 = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .22], [.73, .22], [.27, .5], [.73, .5], [.27, .78], [.73, .78]] };
    const mats = [1, 6, 2, 5, 3, 4].map((n) => new T.MeshStandardMaterial({ roughness: 0.3, map: tex(128, 128, (c, W, H) => {
      c.fillStyle = '#fbfaf5'; c.fillRect(0, 0, W, H);
      c.fillStyle = n === 1 ? '#d82a2a' : '#1f1f24';
      P6[n].forEach(([x, y]) => { c.beginPath(); c.arc(x * W, y * H, n === 1 ? 17 : 12, 0, 7); c.fill(); });
      c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 6; c.strokeRect(0, 0, W, H);
    }) }));
    mesh(new T.BoxGeometry(0.6, 0.6, 0.6), mats, 0, 0.3, 0, g).rotation.y = 0.5;
  });

  // ── 체스 폰
  def('pawn', '체스 말', 'Chess Pawn', 'guard', (g) => {
    const k = m('#1f1c22', { roughness: 0.2 });
    mesh(K.lathe('pawn', [[0, 0], [0.3, 0], [0.3, 0.08], [0.22, 0.14], [0.14, 0.2], [0.1, 0.5], [0.2, 0.56], [0.1, 0.6], [0, 0.6]]), k, 0, 0, 0, g);
    mesh(K.sphere(0.17, 18, 14), k, 0, 0.74, 0, g);
  });

  // ── 왕관
  def('crown', '왕관', 'Crown', 'guard', (g) => {
    const gd = metal('#f2c43a', 0.2);
    mesh(new T.CylinderGeometry(0.36, 0.34, 0.22, 24, 1, true), gd, 0, 0.11, 0, g).material.side = T.DoubleSide;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      mesh(K.cone(0.1, 0.32, 8), gd, Math.cos(a) * 0.32, 0.36, Math.sin(a) * 0.32, g);
      mesh(K.sphere(0.045, 8, 6), gd, Math.cos(a) * 0.32, 0.53, Math.sin(a) * 0.32, g);
    }
    [0, 2.1, 4.2].forEach((a) => mesh(K.sphere(0.055, 10, 8), m('#d8283a', { roughness: 0.1 }), Math.cos(a) * 0.36, 0.11, Math.sin(a) * 0.36, g));
  });

  // ── 트로피
  def('trophy', '트로피', 'Trophy', 'time', (g) => {
    const gd = metal('#f0c040', 0.2);
    mesh(rbox(0.42, 0.14, 0.42, 0.03), m('#3a2a22', { roughness: 0.5 }), 0, 0.07, 0, g);
    mesh(K.cyl(0.05, 0.08, 0.3, 10), gd, 0, 0.29, 0, g);
    const cup = mesh(K.lathe('cup', [[0, 0.44], [0.12, 0.45], [0.26, 0.56], [0.33, 0.78], [0.34, 0.92], [0.3, 0.92], [0.29, 0.8], [0, 0.6]]), gd, 0, 0, 0, g);
    [-1, 1].forEach((s) => { const h = mesh(K.torus(0.12, 0.03, Math.PI), gd, s * 0.34, 0.74, 0, g); h.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; });
  });

  // ── 양초
  def('candle', '양초', 'Candle', 'hint', (g) => {
    mesh(K.cyl(0.32, 0.36, 0.06, 20), metal('#c9a24a', 0.3), 0, 0.03, 0, g);
    mesh(K.cyl(0.13, 0.13, 0.62, 16), m('#fbf1dc', { roughness: 0.7 }), 0, 0.37, 0, g);
    mesh(K.cyl(0.01, 0.01, 0.06, 4), dark(), 0, 0.71, 0, g);
    const f = mesh(K.sphere(0.05, 10, 8), new T.MeshBasicMaterial({ color: 0xffc040 }), 0, 0.78, 0, g); f.scale.set(1, 1.8, 1);
    const h = mesh(K.torus(0.08, 0.025, Math.PI * 1.2), metal('#c9a24a', 0.3), 0.36, 0.08, 0, g); h.rotation.x = Math.PI / 2;
  });

  // ── 사진기
  def('camera', '사진기', 'Camera', 'hint', (g) => {
    mesh(rbox(0.76, 0.46, 0.3, 0.06), m('#2a2a30', { roughness: 0.4 }), 0, 0.25, 0, g);
    mesh(rbox(0.78, 0.18, 0.31, 0.04), m('#b8a07a', { roughness: 0.8 }), 0, 0.15, 0, g);
    const ln = mesh(K.cyl(0.17, 0.19, 0.18, 22), metal('#3a3a40', 0.3), 0.05, 0.27, 0.22, g); ln.rotation.x = Math.PI / 2;
    const gl = mesh(K.cyl(0.12, 0.12, 0.19, 22), m('#3a5a8a', { roughness: 0.05 }), 0.05, 0.27, 0.23, g); gl.rotation.x = Math.PI / 2;
    mesh(rbox(0.14, 0.08, 0.1, 0.02), metal('#c9cdd2'), -0.24, 0.51, 0, g);
    mesh(K.cyl(0.05, 0.05, 0.05, 10), m('#d83a3a'), 0.26, 0.5, 0, g);
  });

  // ── 옛날 전화기
  def('phone', '전화기', 'Telephone', 'hint', (g) => {
    const c = m('#e05a3a', { roughness: 0.3 });
    mesh(K.lathe('ph', [[0, 0], [0.38, 0], [0.4, 0.06], [0.3, 0.38], [0, 0.4]]), c, 0, 0, 0, g).scale.set(1, 1, 0.8);
    const dial = mesh(K.cyl(0.15, 0.15, 0.04, 20), m('#fff6e6'), 0, 0.3, 0.2, g); dial.rotation.x = 1.0;
    const hs = mesh(K.capsule(0.07, 0.5), c, 0, 0.5, 0, g); hs.rotation.z = Math.PI / 2;
    [-1, 1].forEach((s) => mesh(K.sphere(0.12, 14, 10), c, s * 0.3, 0.48, 0, g).scale.set(0.8, 0.7, 1));
  });

  // ── 헤드폰 (누워 있음)
  def('headphones', '헤드폰', 'Headphones', 'hint', (g) => {
    const c = m('#2d2d36', { roughness: 0.4 }), p = m('#5ac8c0', { roughness: 0.5 });
    const hp = group(0, 0.16, 0, g); hp.rotation.x = -Math.PI / 2 + 0.35;
    mesh(K.torus(0.36, 0.045, Math.PI), c, 0, 0, 0, hp);
    [-1, 1].forEach((s) => { const e = mesh(K.cyl(0.16, 0.16, 0.14, 20), p, s * 0.38, 0, 0, hp); e.rotation.z = Math.PI / 2; });
  });

  // ── 풍선
  def('balloon', '풍선', 'Balloon', 'time', (g) => {
    const b = mesh(K.sphere(0.32, 22, 16), m('#ff4a7a', { roughness: 0.25 }), 0, 0.6, 0, g); b.scale.set(1, 1.2, 1);
    mesh(K.cone(0.05, 0.07, 8), m('#ff4a7a'), 0, 0.2, 0, g).rotation.x = Math.PI;
    mesh(K.cyl(0.008, 0.008, 0.2, 4), m('#eeeeee'), 0.02, 0.08, 0, g);
  });

  // ── 아이스크림
  def('icecream', '아이스크림', 'Ice Cream', 'time', (g) => {
    const cone = mesh(K.cone(0.18, 0.55, 16), m('#d9a35a', { roughness: 0.8 }), 0, 0.28, 0, g); cone.rotation.x = Math.PI;
    mesh(K.sphere(0.21, 18, 14), m('#ffb6c8', { roughness: 0.6 }), 0, 0.6, 0, g);
    mesh(K.sphere(0.17, 16, 12), m('#fff2d6', { roughness: 0.6 }), 0.02, 0.82, 0, g);
    mesh(K.sphere(0.05, 8, 6), m('#d81a2a', { roughness: 0.2 }), 0, 0.98, 0, g);
  });

  // ── 도넛
  def('donut', '도넛', 'Donut', 'time', (g) => {
    const d = mesh(K.torus(0.28, 0.15), m('#d9a05a', { roughness: 0.7 }), 0, 0.15, 0, g); d.rotation.x = Math.PI / 2;
    const ic = mesh(K.torus(0.28, 0.13), m('#f07ab0', { roughness: 0.4 }), 0, 0.2, 0, g); ic.rotation.x = Math.PI / 2; ic.scale.set(1, 1, 0.6);
    const cs = ['#ffffff', '#5ac8f0', '#ffd23a', '#7ad86a'];
    for (let i = 0; i < 14; i++) {
      const a = i * 0.9, rr = 0.2 + (i % 3) * 0.07;
      const s = mesh(K.box(0.05, 0.015, 0.015), m(cs[i % 4]), Math.cos(a) * rr, 0.31, Math.sin(a) * rr, g); s.rotation.y = a * 2;
    }
  });

  // ── 막대사탕
  def('lollipop', '막대사탕', 'Lollipop', 'time', (g) => {
    const t = tex(128, 128, (c, W, H) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#e8304a'; c.lineWidth = 14; c.beginPath();
      for (let a = 0; a < 22; a += 0.1) { const rr = a * 2.9; c.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr); }
      c.stroke();
    });
    const tm = new T.MeshStandardMaterial({ map: t, roughness: 0.2 });
    mesh(K.cyl(0.3, 0.3, 0.1, 28), [new T.MeshStandardMaterial({ color: 0xe8304a, roughness: 0.2 }), tm, tm], -0.2, 0.06, 0, g);
    mesh(K.cyl(0.025, 0.025, 0.6, 8), m('#fbf7ee'), 0.35, 0.06, 0, g).rotation.z = Math.PI / 2;
  });

  // ── 컵케이크
  def('cupcake', '컵케이크', 'Cupcake', 'time', (g) => {
    mesh(K.cyl(0.3, 0.22, 0.34, 16), m('#5ab8e0', { roughness: 0.7 }), 0, 0.17, 0, g);
    const cr = m('#fff0f4', { roughness: 0.6 });
    mesh(K.sphere(0.32, 18, 12), cr, 0, 0.4, 0, g).scale.set(1, 0.5, 1);
    mesh(K.sphere(0.22, 16, 12), cr, 0, 0.55, 0, g).scale.set(1, 0.65, 1);
    mesh(K.sphere(0.1, 12, 10), m('#d81a2a', { roughness: 0.2 }), 0, 0.72, 0, g);
  });

  // ── 유리병
  def('bottle', '유리병', 'Bottle', 'hint', (g) => {
    const gl = new T.MeshStandardMaterial({ color: 0x3fa86a, roughness: 0.08, transparent: true, opacity: 0.85 });
    mesh(K.lathe('btl', [[0, 0], [0.18, 0], [0.19, 0.5], [0.08, 0.66], [0.07, 0.86], [0.08, 0.9], [0, 0.9]]), gl, 0, 0, 0, g);
    mesh(K.cyl(0.075, 0.075, 0.08, 12), m('#c09060', { roughness: 0.9 }), 0, 0.92, 0, g);
    mesh(K.cyl(0.192, 0.192, 0.2, 18), m('#f4ead0', { roughness: 0.8 }), 0, 0.25, 0, g);
  });

  // ── 종이비행기
  def('plane', '종이비행기', 'Paper Plane', 'hint', (g) => {
    const p = new T.MeshStandardMaterial({ color: 0xfbfbf6, roughness: 0.9, side: T.DoubleSide });
    const tri = (v) => { const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(v, 3)); geo.computeVertexNormals(); return geo; };
    mesh(tri([0.5, 0.2, 0, -0.5, 0.26, -0.4, -0.5, 0.2, 0]), p, 0, 0, 0, g);
    mesh(tri([0.5, 0.2, 0, -0.5, 0.2, 0, -0.5, 0.26, 0.4]), p, 0, 0, 0, g);
    mesh(tri([0.5, 0.2, 0, -0.5, 0.2, 0, -0.5, 0.02, 0]), p, 0, 0, 0, g);
  });

  // ── 붓
  def('brush', '붓', 'Paintbrush', 'hint', (g) => {
    const h = mesh(K.cyl(0.04, 0.05, 0.62, 10), m('#c8402e', { roughness: 0.4 }), -0.12, 0.06, 0, g); h.rotation.z = Math.PI / 2;
    const f = mesh(K.cyl(0.055, 0.05, 0.14, 10), metal('#c9cdd2'), 0.25, 0.06, 0, g); f.rotation.z = Math.PI / 2;
    const b = mesh(K.cone(0.06, 0.2, 10), m('#2a6ad8', { roughness: 0.9 }), 0.42, 0.06, 0, g); b.rotation.z = -Math.PI / 2;
  });

  // ── 말굽 자석
  def('magnet', '자석', 'Magnet', 'guard', (g) => {
    const r = m('#e0302a', { roughness: 0.35 });
    const u = mesh(K.torus(0.24, 0.1, Math.PI), r, 0.06, 0.1, 0, g); u.rotation.x = -Math.PI / 2; u.rotation.z = -Math.PI / 2;
    [-1, 1].forEach((s) => { mesh(rbox(0.26, 0.2, 0.2, 0.03), r, -0.06, 0.1, s * 0.24, g); mesh(rbox(0.12, 0.2, 0.2, 0.03), metal('#d9dde2', 0.2), -0.25, 0.1, s * 0.24, g); });
  });

  // ── 나침반
  def('compass', '나침반', 'Compass', 'hint', (g) => {
    const t = tex(128, 128, (c, W, H) => {
      c.fillStyle = '#c99a3a'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#f6efd8'; c.beginPath(); c.arc(64, 64, 56, 0, 7); c.fill();
      c.fillStyle = '#2a2a2a';
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.fillRect(64 + Math.cos(a) * 48 - 2, 64 + Math.sin(a) * 48 - 2, 4, 4); }
      c.fillStyle = '#d8283a'; c.beginPath(); c.moveTo(64, 16); c.lineTo(74, 64); c.lineTo(54, 64); c.fill();
      c.fillStyle = '#2a3a5a'; c.beginPath(); c.moveTo(64, 112); c.lineTo(74, 64); c.lineTo(54, 64); c.fill();
    });
    const rim = metal('#c99a3a', 0.25);
    mesh(K.cyl(0.4, 0.4, 0.14, 28), [rim, new T.MeshStandardMaterial({ map: t, roughness: 0.5 }), rim], 0, 0.07, 0, g);
    mesh(K.torus(0.07, 0.03), rim, 0, 0.07, -0.44, g);
  });

  // ── 손전등
  def('torch', '손전등', 'Flashlight', 'hint', (g) => {
    const b = mesh(K.cyl(0.11, 0.11, 0.62, 16), m('#2a5ad8', { roughness: 0.35 }), -0.1, 0.13, 0, g); b.rotation.z = Math.PI / 2;
    const hd = mesh(K.cyl(0.18, 0.12, 0.22, 18), metal('#c9cdd2', 0.2), 0.3, 0.18, 0, g); hd.rotation.z = Math.PI / 2;
    const ln = mesh(K.cyl(0.155, 0.155, 0.01, 18), new T.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xffe9a0, emissiveIntensity: 0.4 }), 0.415, 0.18, 0, g); ln.rotation.z = Math.PI / 2;
    mesh(rbox(0.1, 0.05, 0.08, 0.02), m('#e0302a'), -0.05, 0.25, 0, g);
  });

  // ── 곰인형 (작은)
  def('bear', '곰인형', 'Teddy Bear', 'guard', (g) => {
    P.teddy(g, 0, 0, 0.62, '#b8834e', 0);
  });

  // ── 공
  def('ball', '공', 'Ball', 'time', (g) => {
    const t = tex(256, 128, (c, W, H) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#1e1e24';
      for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) {
        const cx = x * 44 + (y % 2) * 22 + 10, cy = y * 44 + 20, rr = 13;
        c.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.fill();
      }
    });
    mesh(K.sphere(0.4, 28, 20), new T.MeshStandardMaterial({ map: t, roughness: 0.4 }), 0, 0.4, 0, g).rotation.set(0.4, 0.3, 0.2);
  });

  // ── 우산 (펼침)
  def('umbrella', '우산', 'Umbrella', 'guard', (g) => {
    const c = new T.MeshStandardMaterial({ color: 0x8a4ad8, roughness: 0.6, side: T.DoubleSide });
    mesh(new T.ConeGeometry(0.5, 0.26, 8, 1, true), c, 0, 0.82, 0, g);
    mesh(K.cyl(0.018, 0.018, 0.86, 6), m('#333333'), 0, 0.5, 0, g);
    const hk = mesh(K.torus(0.08, 0.02, Math.PI), m('#7a4a2a'), 0.08, 0.08, 0, g); hk.rotation.z = Math.PI;
    mesh(K.sphere(0.03, 6, 4), m('#333333'), 0, 0.96, 0, g);
  });

  // ── 초승달
  def('moon', '달', 'Moon', 'time', (g) => {
    const s = new T.Shape();
    s.absarc(0, 0, 0.45, Math.PI * 0.5, Math.PI * 1.5, false);
    s.absarc(0.16, 0, 0.36, Math.PI * 1.4, Math.PI * 0.6, true);
    const geo = new T.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 });
    geo.translate(0.1, 0.46, -0.07);
    mesh(geo, m('#f5e27a', { roughness: 0.35 }), 0, 0, 0, g);
  });

  // ── 편지봉투
  def('letter', '편지', 'Letter', 'guard', (g) => {
    const t = tex(128, 96, (c, W, H) => {
      c.fillStyle = '#f7efe0'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#cdbb9c'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(W / 2, H * 0.55); c.lineTo(W, 0); c.stroke();
      c.fillStyle = '#d8283a'; c.beginPath(); c.arc(W / 2, H * 0.55, 10, 0, 7); c.fill();
      c.fillStyle = '#5a8ad8'; c.fillRect(W - 26, H - 30, 18, 22);
    });
    const pa = m('#f7efe0', { roughness: 0.9 });
    mesh(K.box(0.8, 0.03, 0.56), [pa, pa, new T.MeshStandardMaterial({ map: t, roughness: 0.9 }), pa, pa, pa], 0, 0.02, 0, g);
  });

  // ── 단풍잎
  def('leaf', '단풍잎', 'Maple Leaf', 'time', (g) => {
    const s = new T.Shape();
    const pts = [[0, 0.5], [0.1, 0.25], [0.32, 0.36], [0.25, 0.12], [0.48, 0.08], [0.28, -0.08], [0.33, -0.2], [0.05, -0.15], [0.03, -0.35], [-0.03, -0.35], [-0.05, -0.15], [-0.33, -0.2], [-0.28, -0.08], [-0.48, 0.08], [-0.25, 0.12], [-0.32, 0.36], [-0.1, 0.25]];
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    const geo = new T.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    mesh(geo, m('#e0502a', { roughness: 0.7 }), 0, 0.02, 0, g);
  });

  // ── 로켓 장난감
  def('rocket', '로켓', 'Toy Rocket', 'time', (g) => {
    const w = m('#f4f2ee', { roughness: 0.35 }), r = m('#e84a5f', { roughness: 0.4 });
    mesh(K.capsule(0.15, 0.42), w, 0, 0.4, 0, g);
    mesh(K.cone(0.15, 0.26, 16), r, 0, 0.86, 0, g);
    [0, 2.1, 4.2].forEach((a) => { const f = mesh(K.box(0.02, 0.24, 0.18), r, Math.sin(a) * 0.15, 0.16, Math.cos(a) * 0.15, g); f.rotation.y = a; });
    const win = mesh(K.cyl(0.06, 0.06, 0.03, 12), m('#7ec8e3', { roughness: 0.1 }), 0, 0.52, 0.15, g); win.rotation.x = Math.PI / 2;
  });

  // ── 기타
  def('guitar', '기타', 'Guitar', 'guard', (g) => {
    const w = m('#d08a42', { roughness: 0.45 });
    mesh(K.cyl(0.26, 0.26, 0.12, 24), w, -0.2, 0.06, 0, g);
    mesh(K.cyl(0.2, 0.2, 0.12, 24), w, 0.1, 0.06, 0, g);
    mesh(K.cyl(0.08, 0.08, 0.13, 16), dark(), -0.12, 0.07, 0, g);
    mesh(rbox(0.5, 0.05, 0.09, 0.02), m('#5a3420'), 0.5, 0.1, 0, g);
    mesh(rbox(0.12, 0.05, 0.13, 0.02), m('#5a3420'), 0.78, 0.1, 0, g);
  });

  // ── 숨은 고양이 (목록에 없는 덤)
  def('cat', '고양이', 'Cat', 'gold', (g) => {
    P.cat(g, 0, 0, 0.6, '#f0a24e', 0, { stripes: true });
  }, { secret: true });

  const SZ = {key: 0.72, spoon: 0.8, pencil: 0.85, brush: 0.85, scissors: 0.8, leaf: 0.75, letter: 0.85, glasses: 0.8, dice: 0.7, pawn: 0.75, magnet: 0.75, compass: 0.75, lollipop: 0.8, donut: 0.8, cupcake: 0.8, apple: 0.75, mushroom: 0.8, hat: 1.1, umbrella: 1.15, guitar: 1.15, shoe: 1.0, bear: 1.05, balloon: 1.0, trophy: 1.0, camera: 0.95, phone: 0.95};
  for (const k in SZ) I[k].sz = SZ[k];
  I.list = Object.keys(I).filter((k) => !I[k].secret);
})();
