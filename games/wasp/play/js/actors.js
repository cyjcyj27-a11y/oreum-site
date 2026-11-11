// 인물·차·벌·벌집 점토 모형.
(function () {
  const A = (window.ACT = {});
  const M = (c, o) => CLAY.mat(c, o);
  function mesh(geo, mat, x, y, z, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.castShadow = true; m.receiveShadow = true; if (parent) parent.add(m); return m; }
  A.mesh = mesh;

  // ---------- 순한 얼굴(점토 인형): 작은 까만 눈+반짝 점, 순한 눈썹, 볼 홍조, 코, 웃는 입(콧수염 선택) ----------
  // e = 얼굴 면 타원체 {x,y,z(가운데), rx,ry,rz}. 부품은 그 면 위에 붙는다.
  let gridTex = null;
  function grid() {
    if (gridTex) return gridTex;
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const g = cv.getContext('2d');
    g.strokeStyle = 'rgba(20,24,32,1)'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= 32; i += 8) { g.moveTo(i, 0); g.lineTo(i, 32); g.moveTo(0, i); g.lineTo(32, i); } g.stroke();
    gridTex = new THREE.CanvasTexture(cv); gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(16, 10);
    return gridTex;
  }
  A.face = function (head, e, o) {
    o = o || {};
    const at = (x, y, out) => { const k = 1 - (x * x) / (e.rx * e.rx) - (y * y) / (e.ry * e.ry); return [e.x + x, e.y + y, e.z + e.rz * Math.sqrt(Math.max(0, k)) + (out || 0)]; };
    const black = M('#1a1410', { rough: 0.25, ns: 0 }), white = M('#ffffff', { rough: 0.2, ns: 0 }), brow = M(o.brow || '#5a3a24', { rough: 0.5 }), cheek = M('#f4a08c', { rough: 0.5 }), mouth = M('#7a3a2a', { rough: 0.4 });
    const S = o.s || 1, ex = 0.07 * S, ey = 0.02 * S;
    [-1, 1].forEach((sd) => {
      const p = at(sd * ex, ey, 0.004); const eye = mesh(CLAY.ball(0.024 * S, 12, 0, 40), black, p[0], p[1], p[2], head); eye.scale.set(1, 1.2, 0.55);
      const h = at(sd * ex - 0.008 * S, ey + 0.011 * S, 0.016); mesh(CLAY.ball(0.008 * S, 6, 0, 41), white, h[0], h[1], h[2], head);
      const b = at(sd * ex, ey + 0.065 * S, 0.006); const br = mesh(CLAY.capsule(0.009 * S, 0.034 * S, 0, 42), brow, b[0], b[1], b[2], head); br.rotation.z = Math.PI / 2 - sd * 0.18;
      const c = at(sd * 0.12 * S, -0.035 * S, 0.002); const ck = mesh(CLAY.ball(0.03 * S, 10, 0, 43), cheek, c[0], c[1], c[2], head); ck.scale.set(1.2, 0.75, 0.35);
    });
    const n = at(0, -0.015 * S, 0.006); mesh(CLAY.ball(0.026 * S, 10, 0.001, 44), M(o.skin || '#f2c49b', { rough: 0.45 }), n[0], n[1], n[2], head);
    if (o.mustache) [-1, 1].forEach((sd) => { const m = at(sd * 0.032 * S, -0.055 * S, 0.008); const mm = mesh(CLAY.ball(0.034 * S, 10, 0.002, 45), brow, m[0], m[1], m[2], head); mm.scale.set(1.35, 0.6, 0.6); mm.rotation.z = -sd * 0.25; });
    const mo = at(0, -0.085 * S, 0.004); const sm = mesh(new THREE.TorusGeometry(0.03 * S, 0.0075 * S, 6, 14, Math.PI * 0.8), mouth, mo[0], mo[1] + 0.012 * S, mo[2], head); sm.rotation.z = Math.PI + Math.PI * 0.1;
  };

  // ---------- 대원(방호복) ----------
  // 뿌리 = 발바닥. 관절 묶음: hipL/hipR/shL/shR/head. 오른손 스프레이, 왼손 포충망.
  A.hero = function () {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const suit = M('#f4efe2', { rough: 0.55 }), band = M('#ff8a1e', { rough: 0.4 }), glove = M('#ffd12a', { rough: 0.35 }), boot = M('#2f5a3a', { rough: 0.35 });
    const visor = M('#1d2433', { rough: 0.3, ns: 0.9 }), white = M('#ffffff', { rough: 0.25, ns: 0.2 }), black = M('#111111', { rough: 0.2, ns: 0 });
    // 몸통
    mesh(CLAY.capsule(0.3, 0.34, 0.012, 1), suit, 0, 0.92, 0, body).scale.set(1, 1, 0.86);
    mesh(new THREE.TorusGeometry(0.29, 0.045, 8, 24), band, 0, 0.78, 0, body).rotation.x = Math.PI / 2;
    mesh(CLAY.rbox(0.36, 0.08, 0.04, 0.02, 0.003, 2), band, 0, 1.08, 0.255, body);
    // 머리(헬멧) + 그물 얼굴창 + 큰 눈
    const head = new THREE.Group(); head.position.set(0, 1.42, 0); body.add(head);
    mesh(CLAY.ball(0.31, 22, 0.01, 3), suit, 0, 0, 0, head).scale.set(1, 0.95, 1);
    // 얼굴 창: 헬멧 앞에 살짝 나온 살구색 얼굴(가장자리는 헬멧과 맞물려 창 모양) + 그 위 반투명 그물
    const FE = { x: 0, y: -0.02, z: 0.215, rx: 0.2, ry: 0.19, rz: 0.115 };
    const faceM = mesh(CLAY.ball(1, 24, 0, 4), M('#f2c49b', { rough: 0.45, fs: 0.25, fa: 0.15 }), FE.x, FE.y, FE.z, head); faceM.scale.set(FE.rx, FE.ry, FE.rz);
    A.face(head, FE, { mustache: true });
    const veil = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: '#1d2433', alphaMap: grid(), transparent: true, opacity: 0.22, roughness: 0.6, depthWrite: false }));
    veil.position.set(FE.x, FE.y, FE.z + 0.012); veil.scale.set(FE.rx + 0.012, FE.ry + 0.012, FE.rz + 0.03); head.add(veil);
    // 얼굴 창 테두리(주황 고무 테)
    const rim = mesh(new THREE.TorusGeometry(1, 0.06, 8, 32), band, FE.x, FE.y, 0.235, head); rim.scale.set(FE.rx + 0.012, FE.ry + 0.012, 0.3);
    mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 24), band, 0, -0.17, 0, head).rotation.x = Math.PI / 2;
    // 팔
    function arm(s) {
      const sh = new THREE.Group(); sh.position.set(s * 0.33, 1.13, 0); body.add(sh);
      mesh(CLAY.capsule(0.095, 0.3, 0.006, 8 + s), suit, 0, -0.2, 0, sh);
      mesh(CLAY.capsule(0.085, 0.07, 0.006, 9 + s), glove, 0, -0.43, 0, sh);
      mesh(new THREE.TorusGeometry(0.098, 0.026, 6, 16), band, 0, -0.33, 0, sh).rotation.x = Math.PI / 2;
      return sh;
    }
    const shR = arm(1), shL = arm(-1);
    // 스프레이 캔(오른손)
    const can = new THREE.Group(); can.position.set(0, -0.5, 0.08); shL.add(can);  // 카메라가 오른쪽 어깨 너머라 화면 오른쪽에 보이는 손(모형의 왼손)
    mesh(CLAY.rcyl(0.065, 0.065, 0.26, 0.02, 16, 0.002, 11), M('#ffcf1f', { rough: 0.3, ns: 0.25 }), 0, 0, 0.06, can).rotation.x = Math.PI / 2;
    mesh(CLAY.rcyl(0.066, 0.066, 0.06, 0.01, 16, 0.001, 12), M('#222222', { rough: 0.3 }), 0, 0, 0.02, can).rotation.x = Math.PI / 2;
    mesh(CLAY.rcyl(0.045, 0.05, 0.07, 0.015, 12, 0.001, 13), white, 0, 0, 0.22, can).rotation.x = Math.PI / 2;
    const nozzle = new THREE.Object3D(); nozzle.position.set(0, 0, 0.27); can.add(nozzle);
    // 포충망(왼손): 막대 + 고리 + 그물
    // 망: 막대는 손에서 +Y 로, 고리는 막대 끝(막대가 고리 면 안), 그물 자루는 뒤(-Z)로
    const net = new THREE.Group(); net.position.set(0, -0.46, 0.04); shR.add(net);
    mesh(CLAY.rcyl(0.018, 0.018, 1.25, 0.01, 8, 0.002, 14), M('#a8743a', { rough: 0.45 }), 0, 0.5, 0, net);
    const ring = new THREE.Group(); ring.position.set(0, 1.38, 0); net.add(ring);
    mesh(new THREE.TorusGeometry(0.25, 0.02, 8, 24), M('#d8d8d8', { rough: 0.3 }), 0, 0, 0, ring);
    const bag = mesh(new THREE.ConeGeometry(0.25, 0.5, 16, 1, true), M('#e9f3ef', { rough: 0.8, side: 1, op: 0.7 }), 0, 0, -0.25, ring); bag.rotation.x = -Math.PI / 2;
    // 다리
    function leg(s) {
      const hp = new THREE.Group(); hp.position.set(s * 0.14, 0.62, 0); body.add(hp);
      mesh(CLAY.capsule(0.12, 0.26, 0.008, 15 + s), suit, 0, -0.2, 0, hp);
      const b = mesh(CLAY.rbox(0.22, 0.24, 0.32, 0.09, 0.006, 16 + s), boot, 0, -0.5, 0.04, hp);
      return hp;
    }
    const hipL = leg(-1), hipR = leg(1);
    root.userData = { body, head, shL, shR, hipL, hipR, can, nozzle, net, ring, bag };
    return root;
  };
  // 걷기·팔 자세(t = 걸음 위상, sp = 0~1 속도, aim = 0~1 스프레이 들기, pitch = 위아래 겨눔)
  A.pose = function (h, t, sp, aim, pitch, swing, hold) {
    const u = h.userData, s = Math.sin(t), c = Math.cos(t * 2);
    u.hipL.rotation.x = s * 0.7 * sp; u.hipR.rotation.x = -s * 0.7 * sp;
    u.body.position.y = Math.abs(c) * 0.04 * sp;
    u.body.rotation.z = s * 0.04 * sp;
    // 오른팔: 걸을 땐 흔들고, 겨눌 땐 앞으로(위아래도)
    // 스프레이 팔(shL): 걸을 땐 흔들고, 겨눌 땐 앞으로(위아래도)
    const armSwing = s * 0.6 * sp;
    u.shL.rotation.x = armSwing * (1 - aim) + (-Math.PI / 2 - pitch) * aim;
    u.shL.rotation.z = -0.08 * (1 - aim) + 0.05 * aim;
    // 포충망 팔(shR): swing 0~1 휘두르기, 평소엔 오른쪽 어깨 위로 비스듬히
    const sw = swing > 0 ? Math.sin(swing * Math.PI) : 0;
    u.shR.rotation.x = (-s * 0.45 * sp) * (1 - sw) - sw * 1.3;
    u.net.rotation.x = -0.55 + sw * 2.3;
    u.net.rotation.z = -0.6 * (1 - sw);
    u.shL.rotation.z = -0.1 - sw * 0.9;
    u.head.rotation.x = -pitch * 0.4;
    if (hold > 0) { // 두 손으로 장대를 들어 올림
      const up = -Math.PI / 2 - Math.max(0.2, pitch);
      u.shL.rotation.x += (up - u.shL.rotation.x) * hold; u.shR.rotation.x += (up - u.shR.rotation.x) * hold;
      u.shL.rotation.z = 0.25 * hold; u.shR.rotation.z = -0.25 * hold;
    }
    u.net.visible = !(hold > 0.3); // 벌집 씌울 땐 같은 포충망이 늘어난 장대(bagPole)로 보인다
  };

  // ---------- 신고자 ----------
  A.npc = function (kind) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const P = {
      granny: { top: '#9b5fb8', bot: '#5a6fa8', hair: '#d9d9d9', skin: '#f2c49b', h: 0.88 },
      guard: { top: '#3d5a8a', bot: '#2a2f3a', hair: '#3a3028', skin: '#e8b48a', h: 1 },
      teacher: { top: '#e8869a', bot: '#3a3a4a', hair: '#2a1d16', skin: '#f5cfaa', h: 0.97 },
      mourner: { top: '#262626', bot: '#262626', hair: '#2a2420', skin: '#e2ae86', h: 1 },
      pastor: { top: '#f3f3f3', bot: '#33333f', hair: '#8a8a8a', skin: '#efc09a', h: 1 },
      keeper: { top: '#6a8a4a', bot: '#4a4030', hair: '#bdbdbd', skin: '#dba67c', h: 0.95 },
      beekeeper: { top: '#f0e6c0', bot: '#6a5a3a', hair: '#4a3a2a', skin: '#d99e72', h: 1 },
    }[kind] || {};
    const top = M(P.top), bot = M(P.bot), skin = M(P.skin, { rough: 0.45 }), hair = M(P.hair, { rough: 0.6 }), white = M('#ffffff', { rough: 0.25, ns: 0.2 }), black = M('#111111', { rough: 0.2, ns: 0 });
    const k = P.h;
    mesh(CLAY.capsule(0.27, 0.3, 0.01, 21), top, 0, 0.85 * k, 0, body);
    mesh(CLAY.capsule(0.11, 0.3, 0.008, 22), bot, -0.12, 0.35 * k, 0, body);
    mesh(CLAY.capsule(0.11, 0.3, 0.008, 23), bot, 0.12, 0.35 * k, 0, body);
    const head = new THREE.Group(); head.position.set(0, 1.32 * k, 0); body.add(head);
    mesh(CLAY.ball(0.27, 20, 0.008, 24), skin, 0, 0, 0, head);
    const hm = mesh(CLAY.ball(0.285, 18, 0.015, 25), hair, 0, 0.06, -0.04, head); hm.scale.set(1, 0.85, 1);
    if (kind === 'granny') mesh(CLAY.ball(0.12, 12, 0.01, 26), hair, 0, 0.12, -0.27, head);
    if (kind === 'beekeeper') { mesh(CLAY.rcyl(0.42, 0.42, 0.04, 0.02, 20), M('#f0e6c0'), 0, 0.2, 0, head); mesh(CLAY.rcyl(0.22, 0.26, 0.2, 0.06, 18), M('#f0e6c0'), 0, 0.3, 0, head); }
    A.face(head, { x: 0, y: -0.02, z: 0, rx: 0.27, ry: 0.27, rz: 0.27 }, { s: 1.1, skin: P.skin, brow: kind === 'granny' || kind === 'pastor' || kind === 'keeper' ? '#9a9a9a' : '#3a2a20', mustache: kind === 'guard' || kind === 'keeper' });
    const sh = [];
    [-1, 1].forEach((s) => {
      const g = new THREE.Group(); g.position.set(s * 0.29, 1.03 * k, 0); body.add(g);
      mesh(CLAY.capsule(0.08, 0.28, 0.006, 31), top, 0, -0.18, 0, g);
      mesh(CLAY.ball(0.075, 10, 0.004, 32), skin, 0, -0.4, 0, g);
      sh.push(g);
    });
    root.userData = { body, head, shL: sh[0], shR: sh[1] };
    return root;
  };

  // ---------- 출동 차량(1톤 트럭) ----------
  A.truck = function () {
    const g = new THREE.Group(), b = new CLAY.Batch();
    const wht = M('#f7f4ec', { rough: 0.35 }), org = M('#ff7a1c', { rough: 0.35 }), glass = M('#5a7f9a', { rough: 0.15, ns: 0.1 }), tire = M('#2a2a2a', { rough: 0.7 }), grey = M('#9a9a9a', { rough: 0.4 }), red = M('#ff3b2a', { rough: 0.2, emis: '#ff2010', ei: 0.4 }), blue = M('#2a6aff', { rough: 0.2, emis: '#1040ff', ei: 0.4 });
    b.add(CLAY.rbox(1.8, 1.25, 1.5, 0.28, 0.01, 41), wht, [0, 1.15, 1.45]);
    b.add(CLAY.rbox(1.6, 0.55, 0.1, 0.08, 0.004, 42), glass, [0, 1.45, 2.18]);
    b.add(CLAY.rbox(1.82, 0.16, 1.52, 0.06, 0.004, 43), org, [0, 0.82, 1.45]);
    b.add(CLAY.rbox(1.9, 0.25, 3.1, 0.1, 0.01, 44), grey, [0, 0.65, -0.85]);
    b.add(CLAY.rbox(1.9, 0.5, 0.08, 0.04, 0.004, 45), wht, [0, 1.0, -2.36]);
    b.add(CLAY.rbox(0.08, 0.5, 3.0, 0.04, 0.004, 46), wht, [0.92, 1.0, -0.85]);
    b.add(CLAY.rbox(0.08, 0.5, 3.0, 0.04, 0.004, 46), wht, [-0.92, 1.0, -0.85]);
    b.add(CLAY.rbox(0.09, 0.12, 2.9, 0.04, 0.003, 47), org, [0.95, 1.05, -0.85]);
    b.add(CLAY.rbox(0.09, 0.12, 2.9, 0.04, 0.003, 47), org, [-0.95, 1.05, -0.85]);
    b.add(CLAY.rbox(0.5, 0.14, 0.24, 0.07, 0.003, 48), red, [-0.3, 1.86, 1.35]);
    b.add(CLAY.rbox(0.5, 0.14, 0.24, 0.07, 0.003, 49), blue, [0.3, 1.86, 1.35]);
    [[0.82, 1.5], [-0.82, 1.5], [0.82, -1.4], [-0.82, -1.4]].forEach(([x, z], i) => {
      b.add(CLAY.rcyl(0.38, 0.38, 0.28, 0.1, 18, 0.01, 50 + i), tire, [x, 0.38, z], [0, 0, Math.PI / 2]);
      b.add(CLAY.rcyl(0.18, 0.18, 0.3, 0.05, 12, 0.004, 60 + i), grey, [x, 0.38, z], [0, 0, Math.PI / 2]);
    });
    // 짐칸의 예비 캔 상자·사다리
    b.add(CLAY.rbox(0.7, 0.4, 0.5, 0.08, 0.01, 70), M('#3a6ad0', { rough: 0.4 }), [0.35, 0.98, -0.4]);
    for (let i = 0; i < 4; i++) b.add(CLAY.rcyl(0.07, 0.07, 0.26, 0.02, 12, 0.002, 71 + i), M('#ffcf1f', { rough: 0.3, ns: 0.25 }), [0.15 + (i % 2) * 0.3, 1.32, -0.45 + ((i / 2) | 0) * 0.14]);
    b.add(CLAY.rbox(0.45, 0.06, 2.8, 0.03, 0.004, 75), M('#c9c9c9', { rough: 0.35 }), [-0.45, 0.85, -0.85]);
    b.build(g);
    return g;
  };

  // ---------- 캔 상자(작업 자리 가까이, 새 캔 받는 곳) ----------
  A.canBox = function () {
    const g = new THREE.Group(), b = new CLAY.Batch();
    const blue = M('#2f6ad0', { rough: 0.4 }), lid = M('#f4f2ec', { rough: 0.35 }), can = M('#ffcf1f', { rough: 0.3 }), cap = M('#ffffff', { rough: 0.25 }), band = M('#222222', { rough: 0.3 });
    b.add(CLAY.rbox(0.9, 0.5, 0.6, 0.08, 0.008, 81), blue, [0, 0.25, 0]);
    b.add(CLAY.rbox(0.94, 0.06, 0.64, 0.03, 0.003, 82), lid, [0, 0.5, 0]);
    for (let i = 0; i < 6; i++) {
      const x = -0.28 + (i % 3) * 0.28, z = -0.12 + ((i / 3) | 0) * 0.24;
      b.add(CLAY.rcyl(0.075, 0.075, 0.3, 0.025, 12, 0.003, 83 + i), can, [x, 0.66, z]);
      b.add(CLAY.rcyl(0.077, 0.077, 0.05, 0.01, 12, 0.001, 90 + i), band, [x, 0.56, z]);
      b.add(CLAY.rcyl(0.05, 0.055, 0.06, 0.015, 10, 0.001, 96 + i), cap, [x, 0.84, z]);
    }
    b.build(g);
    return g;
  };

  // ---------- 벌 ----------
  // 줄무늬 그림(배) — 노랑·검정. 종마다 instanceColor 로 물들인다.
  function stripeTex(sp) {
    const cv = document.createElement('canvas'); cv.width = 32; cv.height = 128; const g = cv.getContext('2d');
    g.fillStyle = sp.col; g.fillRect(0, 0, 32, 128);
    // 그림 맨 위 = 배 끝, 맨 아래 = 허리
    (sp.bands || []).forEach(([a, b, c]) => {
      g.fillStyle = c; const y0 = (1 - b) * 128, y1 = (1 - a) * 128;
      if (sp.wavy) { g.beginPath(); for (let x = 0; x <= 32; x += 2) g.lineTo(x, y0 + Math.sin(x / 32 * Math.PI * 6) * 2.5); g.lineTo(32, y1); g.lineTo(0, y1); g.fill(); }
      else g.fillRect(0, y0, 32, y1 - y0);
    });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
  }
  A.waspParts = function (max) {
    const nt = CLAY.normalTex();
    const abdMs = {}; Object.keys(DATA.SP).forEach((k) => { abdMs[k] = CLAY.patch(new THREE.MeshStandardMaterial({ map: stripeTex(DATA.SP[k]), roughness: 0.4, normalMap: nt, normalScale: new THREE.Vector2(0.3, 0.3) }), 6, 0.5); });
    const legM = new THREE.MeshStandardMaterial({ roughness: 0.5 });
    const thoM = new THREE.MeshStandardMaterial({ roughness: 0.45, normalMap: nt, normalScale: new THREE.Vector2(0.4, 0.4) });
    const eyeM = new THREE.MeshStandardMaterial({ color: '#16120e', roughness: 0.15 });
    const wingM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    // 배: 허리에서 굵어졌다가 침 끝으로 뾰족(말벌 모양)
    const prof = [[0, 0], [0.012, 0.004], [0.03, 0.02], [0.043, 0.05], [0.045, 0.075], [0.038, 0.1], [0.024, 0.125], [0.008, 0.142], [0, 0.15]].map(([r, y]) => new THREE.Vector2(r, y));
    const abdG = new THREE.LatheGeometry(prof, 12); abdG.rotateX(-Math.PI / 2); abdG.translate(0, 0, 0.05);
    const thoG = new THREE.SphereGeometry(0.04, 10, 8);
    const headG = new THREE.SphereGeometry(0.034, 10, 8);
    const eyeG = new THREE.SphereGeometry(0.02, 8, 6);
    const wingG = new THREE.CircleGeometry(0.07, 12); wingG.scale(0.38, 1, 1); wingG.rotateX(-Math.PI / 2); wingG.translate(0, 0, -0.06);
    CLAY.patch(thoM, 6, 0.5);
    // 다리: 양쪽으로 벌어져 아래로 늘어진 가는 막대 둘(쌍살벌은 길게)
    const legG = (() => { const a = new THREE.CylinderGeometry(0.004, 0.003, 0.09, 5); a.translate(0, -0.045, 0); const b = a.clone(); a.rotateZ(0.35); a.translate(0.018, 0, 0); b.rotateZ(-0.35); b.translate(-0.018, 0, 0); const pos = new Float32Array(a.attributes.position.array.length * 2); pos.set(a.attributes.position.array); pos.set(b.attributes.position.array, a.attributes.position.array.length); const nor = new Float32Array(pos.length); nor.set(a.attributes.normal.array); nor.set(b.attributes.normal.array, a.attributes.normal.array.length); const n = a.attributes.position.count; const idx = []; for (const i of a.index.array) idx.push(i); for (const i of b.index.array) idx.push(i + n); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx); return g; })();
    const mk = (geo, mat, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.castShadow = true; m.frustumCulled = false; return m; };
    const P = { legs: mk(legG, legM, max), tho: mk(thoG, thoM, max), head: mk(headG, thoM, max), eyeL: mk(eyeG, eyeM, max), eyeR: mk(eyeG, eyeM, max), wingL: mk(wingG, wingM, max), wingR: mk(wingG, wingM, max) };
    P.wingL.castShadow = P.wingR.castShadow = false; P.eyeL.castShadow = P.eyeR.castShadow = false;
    const col = new THREE.Color();
    P.legs.castShadow = false;
    P.abd = {}; Object.keys(abdMs).forEach((k) => { P.abd[k] = mk(abdG, abdMs[k], k === 'queen' ? 2 : max); P.abd[k].setColorAt(0, col.set('#ffffff')); });
    for (let i = 0; i < max; i++) { P.legs.setColorAt(i, col.set('#3a2410')); P.tho.setColorAt(i, col.set('#3a2a18')); P.head.setColorAt(i, col.set('#f0a020')); }
    return P;
  };

  // ---------- 벌집 ----------
  // 말벌집 겉: 물결 줄무늬 종이(회갈·황토·밤색 띠)
  let paperTex = null;
  function paper() {
    if (paperTex) return paperTex;
    const W = 256, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const cols = ['#b59a72', '#8f7352', '#c9b08a', '#6e5a44', '#a88a62', '#d2bc98'];
    CLAY.srand(91);
    let y = 0;
    while (y < H) {
      const h = 3 + CLAY.rnd() * 7, c = cols[(CLAY.rnd() * cols.length) | 0], ph = CLAY.rnd() * 6, amp = 2 + CLAY.rnd() * 4;
      g.fillStyle = c; g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + ph) * amp);
      for (let x = W; x >= 0; x -= 8) g.lineTo(x, y + h + 2 + Math.sin(x * 0.05 + ph + 0.4) * amp);
      g.closePath(); g.fill(); y += h;
    }
    paperTex = new THREE.CanvasTexture(cv); paperTex.colorSpace = THREE.SRGBColorSpace; paperTex.wrapS = paperTex.wrapT = THREE.RepeatWrapping; paperTex.repeat.set(3, 2);
    return paperTex;
  }
  let hexTex = null;
  function hex() {
    if (hexTex) return hexTex;
    const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    g.fillStyle = '#5a4630'; g.fillRect(0, 0, N, N);
    const r = 12, w = r * Math.sqrt(3);
    for (let row = -1; row < N / (r * 1.5) + 1; row++) for (let col = -1; col < N / w + 1; col++) {
      const cx = col * w + (row % 2 ? w / 2 : 0), cy = row * r * 1.5;
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * (r - 1.6), cy + Math.sin(a) * (r - 1.6)); } g.closePath();
      g.fillStyle = CLAY.rnd() < 0.3 ? '#efe6d2' : '#c8b694'; g.fill();
    }
    hexTex = new THREE.CanvasTexture(cv); hexTex.colorSpace = THREE.SRGBColorSpace;
    return hexTex;
  }
  // kind: ball(말벌 공 모양) · comb(쌍살벌 열린 집) · ground(땅벌 굴) · swarm(꿀벌 분봉 덩어리) · queen(장수말벌 여왕 큰 집)
  A.nest = function (kind, size) {
    const g = new THREE.Group(); size = size || 1;
    const nt = CLAY.normalTex();
    if (kind === 'ball' || kind === 'queen') {
      const mat = new THREE.MeshStandardMaterial({ map: paper(), roughness: 0.75, normalMap: nt, normalScale: new THREE.Vector2(0.7, 0.7) });
      const geo = CLAY.lump(new THREE.SphereGeometry(0.32 * size, 26, 18), 0.03 * size, 4 / size, 3);
      const m = mesh(geo, mat, 0, -0.34 * size, 0, g); m.scale.set(1, 1.18, 1);
      // 매달린 꼭지 + 아래 구멍
      mesh(CLAY.rcyl(0.06 * size, 0.1 * size, 0.18 * size, 0.03, 10), mat, 0, 0.0, 0, g);
      const hole = mesh(new THREE.CircleGeometry(0.06 * size, 14), M('#140c06', { rough: 0.9, ns: 0 }), 0.0, -0.72 * size, 0.02 * size, g); hole.rotation.x = Math.PI / 2;
      g.userData.body = m;
    } else if (kind === 'comb') {
      const top = M('#8a7454', { rough: 0.8 });
      mesh(CLAY.rcyl(0.015, 0.015, 0.14, 0.005, 6), top, 0, -0.07, 0, g);
      const disc = mesh(CLAY.rcyl(0.15 * size, 0.18 * size, 0.07 * size, 0.025 * size, 18, 0.006), top, 0, -0.14 - 0.035 * size, 0, g);
      const bot = new THREE.Mesh(new THREE.CircleGeometry(0.17 * size, 24), new THREE.MeshStandardMaterial({ map: hex(), roughness: 0.7 }));
      bot.rotation.x = Math.PI / 2; bot.position.y = -0.14 - 0.071 * size; g.add(bot);
      g.userData.body = disc;
    } else if (kind === 'ground') {
      // 파헤쳐진 흙 구덩이 + 그 속에서 솟은 종이 벌집 윗부분 + 앞쪽 드나드는 구멍
      const dirt = M('#7a5a3c', { rough: 0.85 }), dirt2 = M('#5e4430', { rough: 0.9 });
      const pit = mesh(new THREE.CircleGeometry(0.46 * size, 22), M('#2e2016', { rough: 0.95, ns: 0 }), 0, 0.015, 0, g); pit.rotation.x = -Math.PI / 2;
      for (let i = 0; i < 13; i++) { const a = i / 13 * 6.28 + CLAY.rnd() * 0.3, rr = (0.46 + CLAY.rnd() * 0.1) * size, s = (0.09 + CLAY.rnd() * 0.07) * size; const c = mesh(CLAY.ball(s, 10, 0.03, 40 + i), i % 3 ? dirt : dirt2, Math.cos(a) * rr, s * 0.35, Math.sin(a) * rr, g); c.scale.set(1.2, 0.7, 1.1); }
      const mat = new THREE.MeshStandardMaterial({ map: paper(), roughness: 0.75, normalMap: nt, normalScale: new THREE.Vector2(0.7, 0.7) });
      const dome = mesh(CLAY.lump(new THREE.SphereGeometry(0.36 * size, 24, 14), 0.03 * size, 4 / size, 9), mat, 0, -0.08 * size, 0, g); dome.scale.set(1, 0.85, 1);
      const hole = mesh(new THREE.CircleGeometry(0.075 * size, 14), M('#100a05', { rough: 0.9, ns: 0 }), 0.05, 0.12 * size, 0.27 * size, g); hole.rotation.x = -0.75;
      g.userData.body = dome;
    } else if (kind === 'swarm') {
      const bee = M('#c8902a', { rough: 0.55, ns: 0.9 });
      for (let i = 0; i < 26; i++) { const a = CLAY.rnd() * 6.28, y = -CLAY.rnd() * 0.55, rr = 0.24 * (1 - Math.abs(y + 0.25) * 1.3); mesh(CLAY.ball(0.07 + CLAY.rnd() * 0.05, 10, 0.02, i), bee, Math.cos(a) * rr, y, Math.sin(a) * rr, g); }
      g.userData.body = g.children[0];
    }
    g.userData.kind = kind;
    return g;
  };
})();
