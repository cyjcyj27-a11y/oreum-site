// 테이블 축구 — 3D 그림: 방·테이블·잔디판·막대·인형·공·점수 구슬
(function () {
  const TB = (window.TB = {});
  const C = PH.C;
  let R, scene, cam, spot, hemi, fill, ballMesh, fieldMat, woodMat, innerMat, roomMat, floorMat, lampBulb, lamp;
  const rodG = []; // 막대마다 { grp, spin, men, rod }
  const beads = [[], []];
  TB.low = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) {
    const t = new THREE.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  // 방 다섯 곳
  const THEMES = [
    { felt: ['#2f7d45', '#2a7040'], wood: { h: 22, s: 40, l: 24 }, light: 0xffe2b8, room: '#1b130e', floor: { h: 26, s: 35, l: 30 }, fog: 0x1b130e },
    { felt: ['#1f5f9a', '#1b5689'], wood: { h: 270, s: 18, l: 16 }, light: 0xd8c8ff, room: '#120c22', floor: { h: 250, s: 14, l: 18 }, fog: 0x120c22 },
    { felt: ['#2f8f7a', '#29806d'], wood: { h: 34, s: 42, l: 52 }, light: 0xfff6e6, room: '#3a4a50', floor: { h: 36, s: 30, l: 58 }, fog: 0x3a4a50 },
    { felt: ['#3d7a3a', '#356d33'], wood: { h: 14, s: 45, l: 26 }, light: 0xffc890, room: '#22140c', floor: { h: 18, s: 38, l: 26 }, fog: 0x22140c },
    { felt: ['#36913f', '#2f8138'], wood: { h: 0, s: 0, l: 10 }, light: 0xffffff, room: '#0a0d12', floor: { h: 210, s: 8, l: 14 }, fog: 0x0a0d12 },
  ];
  TB.THEMES = THEMES;

  // ---------- 무늬 ----------
  function fieldCanvas(th) {
    const W = 2048, H = Math.round(2048 * (C.HW * 2) / (C.HL * 2));
    const c = cv(W, H), g = c.getContext('2d'), r = rnd(11);
    const px = W / (C.HL * 2);
    const X = (x) => (x + C.HL) * px, Z = (z) => (z + C.HW) * px;
    // 잔디 줄무늬 (막대 사이마다)
    const n = 16;
    for (let i = 0; i < n; i++) {
      g.fillStyle = th.felt[i % 2];
      g.fillRect((i * W) / n, 0, W / n + 1, H);
    }
    // 펠트 결
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const k = (r() - 0.5) * 14;
      d[i] += k; d[i + 1] += k; d[i + 2] += k;
    }
    g.putImageData(img, 0, 0);
    // 가운데 밝고 가장자리 어둡게
    const rg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.62);
    rg.addColorStop(0, 'rgba(255,255,220,.07)');
    rg.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
    // 선
    g.strokeStyle = 'rgba(245,245,235,.92)';
    g.fillStyle = 'rgba(245,245,235,.92)';
    g.lineWidth = 0.0055 * px;
    const m = 0.018;
    g.strokeRect(X(-C.HL + m), Z(-C.HW + m), (C.HL - m) * 2 * px, (C.HW - m) * 2 * px);
    g.beginPath(); g.moveTo(X(0), Z(-C.HW + m)); g.lineTo(X(0), Z(C.HW - m)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), 0.1 * px, 0, 7); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), 0.009 * px, 0, 7); g.fill();
    for (const s of [-1, 1]) {
      const gx = s * (C.HL - m);
      // 페널티 박스
      const pd = 0.16, pw = 0.23;
      g.strokeRect(Math.min(X(gx), X(gx - s * pd)), Z(-pw), pd * px, pw * 2 * px);
      // 골 박스
      const gd = 0.06, gw = 0.13;
      g.strokeRect(Math.min(X(gx), X(gx - s * gd)), Z(-gw), gd * px, gw * 2 * px);
      // 페널티 점·호
      g.beginPath(); g.arc(X(gx - s * 0.11), Z(0), 0.007 * px, 0, 7); g.fill();
      g.beginPath();
      if (s < 0) g.arc(X(gx - s * 0.11), Z(0), 0.08 * px, -0.64, 0.64);
      else g.arc(X(gx - s * 0.11), Z(0), 0.08 * px, Math.PI - 0.64, Math.PI + 0.64);
      g.stroke();
    }
    // 막대 그림자 자국 (오래 쓴 테이블)
    g.fillStyle = 'rgba(0,0,0,.05)';
    for (const rd of PH.RODS) for (const s of [1, -1]) g.fillRect(X(rd.x * s) - 0.012 * px, 0, 0.024 * px, H);
    return c;
  }

  function woodCanvas(tone, seed) {
    const W = 512, H = 512, c = cv(W, H), g = c.getContext('2d'), r = rnd(seed || 5);
    g.fillStyle = `hsl(${tone.h},${tone.s}%,${tone.l}%)`;
    g.fillRect(0, 0, W, H);
    for (let k = 0; k < 140; k++) {
      const y = r() * H;
      g.strokeStyle = `hsla(${tone.h},${tone.s + 5}%,${Math.max(3, tone.l - 8 - r() * 8)}%,${0.15 + r() * 0.3})`;
      g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x * 0.012 + k) * 3 * r());
      g.stroke();
    }
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = `hsla(${tone.h},${tone.s}%,${Math.min(80, tone.l + 10)}%,${0.08 + r() * 0.1})`;
      g.lineWidth = 1;
      const y = r() * H;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + (r() - 0.5) * 6); g.stroke();
    }
    return c;
  }
  function floorCanvas(tone) {
    const W = 1024, H = 1024, c = cv(W, H), g = c.getContext('2d'), r = rnd(3);
    const bw = W / 8;
    for (let i = 0; i < 8; i++) {
      let y = -r() * 300;
      while (y < H) {
        const len = 180 + r() * 260;
        const L = tone.l + (r() - 0.5) * 8;
        g.fillStyle = `hsl(${tone.h + (r() - 0.5) * 6},${tone.s}%,${L}%)`;
        g.fillRect(i * bw, y, bw, len);
        for (let k = 0; k < 10; k++) {
          g.strokeStyle = `hsla(${tone.h},${tone.s}%,${L - 8}%,.3)`;
          g.lineWidth = 0.7;
          const x = i * bw + r() * bw;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y + len); g.stroke();
        }
        g.fillStyle = 'rgba(0,0,0,.45)';
        g.fillRect(i * bw, y, bw, 2);
        y += len;
      }
      g.fillStyle = 'rgba(0,0,0,.5)';
      g.fillRect(i * bw, 0, 2, H);
    }
    return c;
  }
  function wallCanvas(col) {
    const W = 512, H = 512, c = cv(W, H), g = c.getContext('2d'), r = rnd(9);
    g.fillStyle = col;
    g.fillRect(0, 0, W, H);
    // 벽돌
    const bh = 32, bw = 96;
    for (let y = 0; y < H; y += bh) {
      const off = (y / bh) % 2 ? bw / 2 : 0;
      for (let x = -bw; x < W + bw; x += bw) {
        g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.05})`;
        g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
      }
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(0, y, W, 2);
      for (let x = -bw; x < W + bw; x += bw) g.fillRect(x + off, y, 2, bh);
    }
    return c;
  }

  // ---------- 도형 합치기 (꼭짓점 색) ----------
  function merge(parts) {
    let n = 0;
    const gs = parts.map((p) => {
      const g = (p.g.index ? p.g.toNonIndexed() : p.g.clone());
      g.applyMatrix4(p.m);
      n += g.attributes.position.count;
      return { g, c: new THREE.Color(p.c) };
    });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const { g, c } of gs) {
      const P = g.attributes.position.array, N = g.attributes.normal.array;
      pos.set(P, o * 3);
      nor.set(N, o * 3);
      for (let i = 0; i < P.length / 3; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
      o += P.length / 3;
      g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.computeBoundingSphere();
    return out;
  }
  const M4 = () => new THREE.Matrix4();
  function mt(x, y, z, sx, sy, sz, rx, ry, rz) {
    const m = M4();
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || 1, sz || 1));
    return m;
  }

  // 인형 하나 (막대 = z축, 발끝 -y, 앞 = +x)
  const SPH = new THREE.SphereGeometry(1, 16, 12); // 머리·몸통
  const SPS = new THREE.SphereGeometry(1, 8, 6); // 눈·귀·손 같은 작은 것
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
  const CYLT = new THREE.CylinderGeometry(0.78, 1, 1, 12, 1); // 아래가 넓은
  const BOX = new THREE.BoxGeometry(1, 1, 1);
  const SKINS = ['#f2c7a5', '#e8b48f', '#d49a72', '#b87a52', '#8a5a3a', '#f5d2b8'];
  const HAIRS = ['#1b1410', '#2b1d14', '#4a2e1a', '#6b4424', '#1a1a1a', '#8a5a2a', '#d8b060', '#231a14'];
  function manParts(z, kit, r) {
    const skin = SKINS[Math.floor(r() * SKINS.length)], hair = HAIRS[Math.floor(r() * HAIRS.length)];
    const P = [];
    const add = (g, c, m) => P.push({ g, c, m });
    // 머리
    add(SPH, skin, mt(0, 0.028, z, 0.0112, 0.0122, 0.0108));
    // 머리카락: 뒤통수·정수리를 덮는 모자꼴
    add(SPH, hair, mt(-0.0016, 0.0312, z, 0.0114, 0.0104, 0.0114));
    add(SPS, hair, mt(0.004, 0.036, z, 0.0082, 0.0046, 0.0098, 0, 0, 0.35));
    // 귀
    add(SPS, skin, mt(-0.0005, 0.027, z + 0.0107, 0.0024, 0.0034, 0.0016));
    add(SPS, skin, mt(-0.0005, 0.027, z - 0.0107, 0.0024, 0.0034, 0.0016));
    // 눈·코
    add(SPS, '#15110e', mt(0.0103, 0.0295, z + 0.0042, 0.0014, 0.0019, 0.0014));
    add(SPS, '#15110e', mt(0.0103, 0.0295, z - 0.0042, 0.0014, 0.0019, 0.0014));
    add(SPS, skin, mt(0.0113, 0.0262, z, 0.0022, 0.0026, 0.0018));
    // 목
    add(CYL, skin, mt(0, 0.0145, z, 0.0048, 0.008, 0.0048));
    // 몸통 (윗옷) — 어깨 넓고 허리 좁게
    add(SPH, kit.shirt, mt(0, 0.002, z, 0.0105, 0.0135, 0.0172));
    add(CYLT, kit.shirt, mt(0, -0.014, z, 0.0098, 0.03, 0.0138, 0, 0, Math.PI));
    add(CYL, kit.trim, mt(0, 0.0118, z, 0.0062, 0.0022, 0.0062)); // 깃
    // 팔 (소매 + 팔 + 손)
    for (const s of [-1, 1]) {
      add(SPS, kit.shirt, mt(0, 0.0045, z + s * 0.0158, 0.0072, 0.0078, 0.0068));
      add(CYL, skin, mt(0.0012, -0.012, z + s * 0.0175, 0.0042, 0.026, 0.0042, 0, 0, 0.05));
      add(SPS, skin, mt(0.0022, -0.0255, z + s * 0.0176, 0.0048, 0.0054, 0.0045));
    }
    // 반바지
    add(CYLT, kit.shorts, mt(0, -0.0365, z, 0.0104, 0.0165, 0.0152));
    add(CYL, kit.trim, mt(0, -0.0448, z, 0.0105, 0.0012, 0.0153)); // 바짓단
    // 다리: 붙은 두 다리 + 양말 + 축구화
    for (const s of [-1, 1]) {
      add(CYL, skin, mt(0, -0.0485, z + s * 0.0058, 0.0052, 0.012, 0.0052));
      add(CYL, kit.socks, mt(0, -0.0605, z + s * 0.0058, 0.0056, 0.013, 0.0056));
    }
    add(BOX, kit.socks, mt(0, -0.056, z, 0.009, 0.018, 0.008)); // 다리 사이 채움 (하나로 붙은 인형 다리)
    add(BOX, '#141414', mt(0.0028, -0.0685, z, 0.0175, 0.0075, 0.0265));
    add(SPS, '#141414', mt(0.0112, -0.0688, z, 0.006, 0.0038, 0.0128));
    add(BOX, '#e8e8e8', mt(0.0028, -0.0655, z, 0.0178, 0.0012, 0.0268)); // 축구화 흰 줄
    return P;
  }

  let manMat, chromeMat, gripMat, capMat, beadMat;
  function buildRodGeo(rd, kit, seed) {
    const r = rnd(seed);
    const parts = [];
    for (const mz of rd.men) parts.push(...manParts(mz, kit, r));
    return merge(parts);
  }

  // ---------- 장면 ----------
  TB.init = function (canvas) {
    R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    R.outputColorSpace = THREE.SRGBColorSpace;
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.05;
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(32, 1, 0.02, 30);
    TB.cam = cam;
    TB.scene = scene;

    // 환경 비춤: 천장 등·창을 가진 작은 방을 구워 쓴다 (크롬 막대·유광 인형이 방을 비춘다)
    const envS = new THREE.Scene();
    envS.background = new THREE.Color(0x2a2420);
    const pan = (x, y, z, w, h, col, ry, rx) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0);
      envS.add(m);
    };
    pan(0, 3, 0, 2.4, 0.8, 0xfff0d8, 0, Math.PI / 2);
    pan(-4, 1.6, 0, 3, 1.4, 0x9ab0c8, Math.PI / 2);
    pan(4, 1.2, 1, 2, 1, 0xffd0a0, -Math.PI / 2);
    pan(0, -1, 0, 8, 8, 0x3a2a1c, 0, Math.PI / 2);
    const pm = new THREE.PMREMGenerator(R);
    scene.environment = pm.fromScene(envS, 0.03).texture;
    pm.dispose();

    // 빛
    spot = new THREE.SpotLight(0xffe2b8, 12, 5, 0.8, 0.6, 1.3);
    spot.position.set(0.05, 1.35, 0.12);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(TB.low ? 1024 : 2048, TB.low ? 1024 : 2048);
    spot.shadow.camera.near = 0.6;
    spot.shadow.camera.far = 2.6;
    spot.shadow.bias = -0.0004;
    spot.shadow.normalBias = 0.002;
    spot.shadow.radius = 3;
    scene.add(spot, spot.target);
    hemi = new THREE.HemisphereLight(0xbcc6d8, 0x3a2818, 0.55);
    scene.add(hemi);
    fill = new THREE.DirectionalLight(0xc8d4ff, 0.35);
    fill.position.set(-1, 0.8, 1.6);
    scene.add(fill);

    buildRoom();
    buildTable();
    buildRods();
    // 공
    const bc = cv(256, 128), bg = bc.getContext('2d');
    bg.fillStyle = '#f4f1e8'; bg.fillRect(0, 0, 256, 128);
    const br = rnd(4);
    for (let i = 0; i < 400; i++) { bg.fillStyle = `rgba(0,0,0,${0.02 + br() * 0.04})`; bg.beginPath(); bg.arc(br() * 256, br() * 128, 1 + br() * 2, 0, 7); bg.fill(); }
    bg.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 6; i++) { bg.beginPath(); bg.arc(20 + i * 43, 64 + (i % 2 ? 20 : -20), 7, 0, 7); bg.fill(); }
    ballMesh = new THREE.Mesh(new THREE.SphereGeometry(C.R, 28, 18), new THREE.MeshStandardMaterial({ map: tex(bc), roughness: 0.32, metalness: 0, envMapIntensity: 0.7 }));
    ballMesh.castShadow = true;
    scene.add(ballMesh);

    TB.setTheme(0);
    TB.resize();
  };

  function buildRoom() {
    floorMat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0, envMapIntensity: 0.35 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.82;
    floor.receiveShadow = true;
    scene.add(floor);
    roomMat = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, envMapIntensity: 0.2 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), roomMat);
    back.position.set(0, 1.6, -2.6);
    scene.add(back);
    const side = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), roomMat);
    side.position.set(-3.4, 1.6, 0); side.rotation.y = Math.PI / 2;
    scene.add(side);
    const side2 = side.clone(); side2.position.x = 3.4; side2.rotation.y = -Math.PI / 2;
    scene.add(side2);
    // 매달린 등갓
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.24, 0.16, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1d4a36, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide }));
    shade.position.set(0.05, 1.45, 0.12);
    lamp = new THREE.Group();
    scene.add(lamp);
    lamp.add(shade);
    const inside = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.236, 0.155, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff1d0, side: THREE.BackSide }));
    inside.position.copy(shade.position);
    lamp.add(inside);
    lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10), new THREE.MeshBasicMaterial({ color: 0xfff6e0 }));
    lampBulb.position.set(0.05, 1.39, 0.12);
    lamp.add(lampBulb);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 2, 6), new THREE.MeshBasicMaterial({ color: 0x111111 }));
    cord.position.set(0.05, 2.5, 0.12);
    lamp.add(cord);
    // 뒤쪽 소품: 의자 둘, 벽 선반
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.7 });
    for (const x of [-1.4, 1.5]) {
      const stool = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x7a2020, roughness: 0.5 }));
      seat.position.y = -0.1;
      stool.add(seat);
      for (let k = 0; k < 4; k++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.7, 6), dark);
        const a = (k / 4) * Math.PI * 2 + 0.4;
        leg.position.set(Math.cos(a) * 0.12, -0.46, Math.sin(a) * 0.12);
        stool.add(leg);
      }
      stool.position.set(x, 0, -1.1 + (x > 0 ? 0.2 : 0));
      stool.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      scene.add(stool);
    }
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.2), dark);
    shelf.position.set(0.4, 1.0, -2.5);
    scene.add(shelf);
    const cols = [0x7a3020, 0x2a5a3a, 0xc8a040, 0x3a4a7a, 0x8a8a8a];
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2 + (i % 3) * 0.05, 10), new THREE.MeshStandardMaterial({ color: cols[i % 5], roughness: 0.2, metalness: 0.1 }));
      b.position.set(-0.4 + i * 0.18, 1.12 + (i % 3) * 0.025, -2.48);
      scene.add(b);
    }
  }

  let fieldMesh;
  function buildTable() {
    fieldMat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, envMapIntensity: 0.25 });
    fieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(C.HL * 2, C.HW * 2), fieldMat);
    fieldMesh.rotation.x = -Math.PI / 2;
    fieldMesh.receiveShadow = true;
    scene.add(fieldMesh);

    woodMat = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0, envMapIntensity: 0.6 });
    innerMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.55, metalness: 0, envMapIntensity: 0.4 });
    capMat = new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.3, metalness: 0.1 });
    const add = (geo, mat, x, y, z, cast, recv) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = cast !== false;
      m.receiveShadow = recv !== false;
      scene.add(m);
      statics.push(m);
      return m;
    };
    const statics = [];
    const T = 0.045, WH = 0.19; // 벽 두께·높이
    const L = C.HL * 2 + T * 2 + 0.24;
    // 긴 옆벽 (안쪽 검정 판 + 바깥 나무)
    for (const s of [-1, 1]) {
      add(new THREE.BoxGeometry(L, WH, 0.006), innerMat, 0, WH / 2 - 0.02, s * (C.HW + 0.003));
      add(new THREE.BoxGeometry(L, WH + 0.02, T), woodMat, 0, WH / 2 - 0.03, s * (C.HW + 0.006 + T / 2));
      add(new THREE.BoxGeometry(L + 0.01, 0.02, T + 0.024), capMat, 0, WH - 0.026, s * (C.HW + 0.006 + T / 2));
      // 막대 구멍 부싱
      for (const rd of PH.RODS) for (const d of [1, -1]) {
        const b = add(new THREE.CylinderGeometry(0.015, 0.015, T + 0.012, 18), capMat, rd.x * d, C.ROD_Y, s * (C.HW + 0.006 + T / 2), false);
        b.rotation.x = Math.PI / 2;
      }
    }
    // 서브 구멍 (먼 쪽 벽 가운데)
    const hole = add(new THREE.CircleGeometry(0.024, 24), new THREE.MeshBasicMaterial({ color: 0x050505 }), 0, 0.05, -C.HW + 0.0005, false, false);
    void hole;
    // 끝벽: 골 입구를 뚫고 뒤에 주머니
    const GH = 0.07;
    for (const s of [-1, 1]) {
      const x = s * (C.HL + T / 2);
      const sideW = C.HW - C.GW;
      for (const zs of [-1, 1]) {
        add(new THREE.BoxGeometry(T, WH, sideW), woodMat, x, WH / 2 - 0.03, zs * (C.GW + sideW / 2));
        add(new THREE.BoxGeometry(T - 0.004, WH - 0.01, 0.004), innerMat, x - s * 0.001, WH / 2 - 0.03, zs * (C.GW + 0.002));
      }
      add(new THREE.BoxGeometry(T, WH - GH, C.GW * 2), woodMat, x, GH + (WH - GH) / 2 - 0.03, 0);
      add(new THREE.BoxGeometry(T + 0.014, 0.02, C.HW * 2 + T * 2 + 0.016), capMat, x, WH - 0.026, 0);
      // 골 주머니 (어두운 상자)
      const pocket = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
      add(new THREE.BoxGeometry(0.12, 0.004, C.GW * 2), pocket, s * (C.HL + 0.07), -0.07, 0, false);
      add(new THREE.BoxGeometry(0.004, GH + 0.07, C.GW * 2), pocket, s * (C.HL + 0.125), 0, 0, false);
      for (const zs of [-1, 1]) add(new THREE.BoxGeometry(0.12, GH + 0.07, 0.004), pocket, s * (C.HL + 0.07), 0, zs * C.GW, false);
      // 골 입구 테두리 (흰 선)
      const lip = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.4 });
      add(new THREE.BoxGeometry(0.006, 0.006, C.GW * 2 + 0.012), lip, s * (C.HL + 0.004), GH, 0, false);
      for (const zs of [-1, 1]) add(new THREE.BoxGeometry(0.006, GH, 0.006), lip, s * (C.HL + 0.004), GH / 2, zs * (C.GW + 0.003), false);
      // 바깥 끝 판 (나무)
      add(new THREE.BoxGeometry(0.12, WH + 0.02, C.HW * 2 + T * 2 + 0.004), woodMat, s * (C.HL + T + 0.06), WH / 2 - 0.03, 0);
    }
    // 구석 경사판
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 3, 1);
      const m = add(g, innerMat, sx * (C.HL - 0.006), 0.004, sz * (C.HW - 0.006), false);
      m.scale.set(1, 0.4, 1);
      m.rotation.y = Math.atan2(sz, -sx) + Math.PI / 6;
    }
    // 몸통·다리
    add(new THREE.BoxGeometry(C.HL * 2 + 0.36, 0.2, C.HW * 2 + 0.09), woodMat, 0, -0.13, 0);
    const legMat = woodMat;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(new THREE.BoxGeometry(0.09, 0.62, 0.09), legMat, sx * (C.HL + 0.08), -0.53, sz * (C.HW - 0.02));
      add(new THREE.CylinderGeometry(0.05, 0.06, 0.03, 16), capMat, sx * (C.HL + 0.08), -0.805, sz * (C.HW - 0.02));
    }
    add(new THREE.BoxGeometry(C.HL * 2 + 0.1, 0.06, 0.06), legMat, 0, -0.62, 0);

    // 점수 구슬: 끝벽 위 철사에 10개씩
    beadMat = [null, null];
    for (let t = 0; t < 2; t++) {
      const x = (t === 0 ? -1 : 1) * (C.HL + T + 0.06);
      const wire = add(new THREE.CylinderGeometry(0.002, 0.002, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1, roughness: 0.3 }), x, WH + 0.0, 0, false);
      wire.rotation.x = Math.PI / 2;
      beadMat[t] = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      for (let i = 0; i < 10; i++) {
        const b = add(new THREE.SphereGeometry(0.011, 14, 10), beadMat[t], x, WH, 0, true, false);
        b.scale.set(1, 1, 0.8);
        beads[t].push(b);
        statics.pop();
      }
    }
    mergeStatics(statics);
    TB.setScore(0, 0);
  }

  // 움직이지 않는 테이블 부품을 재질·그림자 설정별로 하나로 합친다 (그리기 명령 줄이기)
  function mergeStatics(list) {
    const groups = new Map();
    for (const m of list) {
      const k = m.material.uuid + '|' + m.castShadow + m.receiveShadow;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(m);
    }
    for (const ms of groups.values()) {
      if (ms.length < 2) continue;
      let n = 0;
      const gs = ms.map((m) => {
        m.updateMatrixWorld(true);
        const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        g.applyMatrix4(m.matrixWorld);
        n += g.attributes.position.count;
        return g;
      });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      let o = 0;
      for (const g of gs) {
        const c = g.attributes.position.count;
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
        o += c;
        g.dispose();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.computeBoundingSphere();
      const one = new THREE.Mesh(geo, ms[0].material);
      one.castShadow = ms[0].castShadow;
      one.receiveShadow = ms[0].receiveShadow;
      scene.add(one);
      for (const m of ms) { scene.remove(m); m.geometry.dispose(); }
    }
  }

  function buildRods() {
    manMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0, envMapIntensity: 0.9 });
    chromeMat = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.22, metalness: 0.92, envMapIntensity: 1.8 });
    gripMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
    // 손잡이: 홈 파인 고무
    const gpts = [];
    for (let i = 0; i <= 24; i++) {
      const y = (i / 24) * 0.11;
      const rr = 0.0145 + (i % 4 < 2 ? 0.0012 : 0) - (i === 0 || i === 24 ? 0.003 : 0);
      gpts.push(new THREE.Vector2(rr, y));
    }
    const gripGeo = new THREE.LatheGeometry(gpts, 20);
    let g_bar = null;
    for (const r of PH.S.rods) {
      const grp = new THREE.Group();
      grp.position.set(r.x, C.ROD_Y, 0);
      const spin = new THREE.Group();
      grp.add(spin);
      if (r.team === 1) spin.rotation.y = Math.PI; // 앞이 -x
      const holder = new THREE.Group();
      spin.add(holder);
      // 막대 길이는 가동 폭만큼 더 길게: 끝까지 밀어도 손잡이가 벽 안으로 들어오지 않는다 (실제 테이블처럼)
      const out = C.HW + 0.06 + r.tr; // 벽 바깥까지
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.0078, 0.0078, out * 2, 16), chromeMat);
      g_bar = bar;
      bar.rotation.x = Math.PI / 2;
      bar.castShadow = true;
      holder.add(bar);
      // 손잡이는 주인 쪽 (0팀 = 앞쪽 +z, 1팀 = 먼 쪽). spin 이 뒤집혀 있으니 로컬 +z 에 달면 된다
      const grip = new THREE.Mesh(gripGeo, gripMat);
      grip.rotation.x = Math.PI / 2;
      grip.position.z = out;
      holder.add(grip);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 14, 8), capMat);
      cap.position.z = out + 0.115;
      cap.scale.set(1, 1, 0.5);
      holder.add(cap);
      const end = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 12), capMat);
      end.rotation.x = Math.PI / 2;
      end.position.z = -out;
      holder.add(end);
      // 인형 (나중에 옷 입힘)
      const men = new THREE.Mesh(new THREE.BufferGeometry(), manMat);
      men.castShadow = true;
      men.receiveShadow = true;
      holder.add(men);
      rodG.push({ grp, spin, holder, men, bar: g_bar, rod: r });
      scene.add(grp);
    }
  }

  // 지금 손에 잡은 막대를 밝게 (누가 잡았는지 보이게)
  let heldMat = null;
  TB.setHeld = function (rods) {
    if (!heldMat) { heldMat = chromeMat.clone(); heldMat.color.set(0xfff0b0); heldMat.emissive = new THREE.Color(0x6a5520); heldMat.envMapIntensity = 2.2; }
    for (const g of rodG) g.bar.material = rods && rods.indexOf(g.rod) >= 0 ? heldMat : chromeMat;
  };

  TB.setKits = function (k0, k1) {
    rodG.forEach((g, i) => {
      const kit = g.rod.team === 0 ? k0 : k1;
      g.men.geometry.dispose();
      // 1팀 인형은 z 가 뒤집혀 보이므로 men 배열을 거꾸로 (시각만)
      const rd = g.rod.team === 0 ? g.rod : { men: g.rod.men.map((m) => -m) };
      g.men.geometry = buildRodGeo(rd, kit, 100 + i * 7 + (kit.seed || 0));
    });
    beadMat[0].color.set(k0.shirt);
    beadMat[1].color.set(k1.shirt);
  };

  TB.setScore = function (a, b) {
    const WH = 0.19;
    [a, b].forEach((n, t) => {
      beads[t].forEach((m, i) => {
        // 점수만큼 먼 쪽으로 밀어 둔다
        const scored = i < n;
        const z = scored ? -0.22 + i * 0.0205 : 0.03 + i * 0.0205;
        m.userData.tz = z;
        if (m.userData.z == null) m.userData.z = z;
        m.position.y = WH;
      });
    });
  };

  // 방 무늬는 방마다 한 번만 그려 두고 바꿔 끼운다 (재질 셰이더는 그대로라 다시 준비하지 않는다)
  const themeTex = {};
  let curTheme = -1;
  function rep(t, x, y) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; }
  TB.setTheme = function (i) {
    i = i % THEMES.length;
    if (i === curTheme) return;
    curTheme = i;
    const th = THEMES[i];
    const T = themeTex[i] || (themeTex[i] = {
      field: tex(fieldCanvas(th)),
      wood: rep(tex(woodCanvas(th.wood, 5 + i)), 3, 1),
      floor: rep(tex(floorCanvas(th.floor)), 5, 5),
      wall: rep(tex(wallCanvas(th.room)), 6, 2.5),
    });
    const set = (m, t) => { const first = !m.map; m.map = t; if (first) m.needsUpdate = true; };
    set(fieldMat, T.field);
    set(woodMat, T.wood);
    set(floorMat, T.floor);
    set(roomMat, T.wall);
    spot.color.set(th.light);
    lampBulb.material.color.set(th.light);
    scene.background = new THREE.Color(th.fog);
    if (!scene.fog) scene.fog = new THREE.Fog(th.fog, 3, 7);
    else scene.fog.color.set(th.fog);
  };

  // 처음 보이는 재질·그림을 미리 한 번 그려 둔다 (골 장면에서 멈칫하지 않게)
  const warmCam = new THREE.PerspectiveCamera(80, 1.6, 0.05, 20);
  TB.warm = function () {
    warmCam.position.set(0, 1.4, 0.9);
    warmCam.lookAt(0, -0.1, 0);
    R.compile(scene, warmCam);
    R.render(scene, warmCam);
    warmCam.position.set(0, 0.25, 0.05);
    for (const x of [-1, 1]) { warmCam.lookAt(x, 0, 0); R.render(scene, warmCam); }
  };

  // ---------- 카메라 ----------
  const camPos = new THREE.Vector3(0, 1, 1), camLook = new THREE.Vector3(), wantPos = new THREE.Vector3(0, 1, 1), wantLook = new THREE.Vector3();
  let shakeA = 0;
  TB.camTo = function (p, l, snap) {
    wantPos.set(p[0], p[1], p[2]);
    wantLook.set(l[0], l[1], l[2]);
    if (snap) { camPos.copy(wantPos); camLook.copy(wantLook); }
  };
  TB.camStep = function (dt, k) {
    const f = 1 - Math.exp(-dt * (k || 3));
    camPos.lerp(wantPos, f);
    camLook.lerp(wantLook, f);
  };
  TB.shake = (a) => { shakeA = Math.max(shakeA, a); };
  // 경기 카메라: 테이블 전체가 들어오게 거리를 맞춘다
  TB.playCam = function () {
    const asp = innerWidth / innerHeight;
    const vf = (cam.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * asp);
    // 공중에서 똑바로 내려다본다 (사장님 2026-09-20: 비스듬하면 아래쪽 공이 가려진다)
    const el = 1.50; // 거의 수직 (아주 조금 기울여 입체감만)
    const needW = C.HL + 0.09; // 가로: 골 주머니까지
    const needH = C.HW + 0.06; // 세로: 옆벽 손잡이 조금까지
    const dW = needW / Math.tan(hf / 2) + 0.03;
    const dH = needH / Math.tan(vf / 2) + 0.03;
    const d = Math.max(dW, dH, 0.8);
    return [[0, Math.sin(el) * d, Math.cos(el) * d], [0, 0, 0]];
  };

  TB.resize = function () {
    const w = innerWidth, h = innerHeight;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };

  // ---------- 매 프레임 ----------
  TB.sync = function (dt) {
    const S = PH.S;
    // 물리 막대는 경기마다 새로 만들어지니(PH.reset) 매번 같은 순서의 지금 막대를 읽는다
    for (let i = 0; i < rodG.length; i++) {
      const g = rodG[i];
      const r = S.rods[i];
      if (!r) continue;
      g.rod = r;
      g.grp.position.z = r.pos;
      g.holder.rotation.z = r.ang;
    }
    const b = S.ball;
    ballMesh.visible = b.st !== 'wait';
    ballMesh.position.set(b.x, b.y, b.z);
    // 굴러가는 회전
    const sp = Math.hypot(b.vx, b.vz);
    if (sp > 1e-4 && b.st === 'play') {
      const ax = new THREE.Vector3(b.vz, 0, -b.vx).normalize();
      ballMesh.rotateOnWorldAxis(ax, (sp * dt) / C.R);
    }
    for (const t of [0, 1]) for (const m of beads[t]) {
      m.userData.z += (m.userData.tz - m.userData.z) * Math.min(1, dt * 8);
      m.position.z = m.userData.z;
    }
  };

  TB.render = function (dt) {
    let sx = 0, sy = 0;
    if (shakeA > 0.0001) {
      sx = (Math.random() - 0.5) * shakeA;
      sy = (Math.random() - 0.5) * shakeA;
      shakeA *= Math.pow(0.02, dt || 0.016);
    }
    cam.position.set(camPos.x + sx, camPos.y + sy, camPos.z);
    // 거의 수직으로 내려다볼 때는 화면 위 = 테이블 먼 쪽으로 고정 (안 그러면 카메라가 비딱하게 돈다)
    if (camPos.y > 1.15) cam.up.set(0, 0, -1); else cam.up.set(0, 1, 0);
    cam.lookAt(camLook);
    // 위에서 내려다보는 카메라는 등갓 높이라 등을 숨긴다
    if (lamp) lamp.visible = camPos.y < 1.15;
    R.render(scene, cam);
  };

  // 화면 좌표 ↔ 테이블
  const v3 = new THREE.Vector3();
  TB.project = function (x, y, z) {
    v3.set(x, y, z).project(cam);
    return [(v3.x * 0.5 + 0.5) * innerWidth, (-v3.y * 0.5 + 0.5) * innerHeight];
  };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -C.R), hit = new THREE.Vector3();
  TB.pick = function (cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null;
  };
  TB.canvas = () => R.domElement;
  TB.info = () => R.info.render;
})();
