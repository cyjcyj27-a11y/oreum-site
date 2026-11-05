// 3D 장면: 파스텔 미니어처 떡집. 작업대 하나에 만들기·포장·택배 자리, 오른쪽 끝에 장난감 트럭 길.
// 직교 카메라로 비스듬히 내려다보고, 가장자리를 흐려(틸트시프트) 미니어처 사진처럼 보이게 한다.
(function () {
  const R = (window.RND = {});
  const V3 = THREE.Vector3;
  const PI = Math.PI;

  // 자리(작업대 윗면 y=0, 앞쪽 +z)
  const ST = (R.ST = { make: -9, pack: 0, ship: 9, truck: 15.6 });
  R.BENCH = { x0: -13.5, x1: 18.5, z0: -2.3, z1: 2.3 };

  // ---------- 렌더러 ----------
  const cv = document.getElementById('cv');
  const renderer = (R.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }));
  const LOW = (R.LOW = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent));
  R.dpr = Math.min(devicePixelRatio || 1, LOW ? 1.5 : 1.6);
  renderer.setPixelRatio(R.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = (R.scene = new THREE.Scene());
  scene.background = new THREE.Color('#fbeef2');

  // 직교 카메라: 비스듬히 위에서
  const cam = (R.cam = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 200));
  const DIR = new V3(-0.17, 1.15, 0.95).normalize();
  R.view = { x: ST.make, y: 0.3, z: 0.2, h: 9, tx: ST.make, ty: 0.3, tz: 0.2, th: 9 };

  // ---------- 빛 ----------
  scene.add(new THREE.HemisphereLight('#fff6f8', '#e8dcf0', 1.7));
  const sun = (R.sun = new THREE.DirectionalLight('#fff6ea', 2.3));
  sun.position.set(-8, 16, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
  const sc = sun.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 50;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 6;
  scene.add(sun); scene.add(sun.target);
  const fill = new THREE.DirectionalLight('#efe6ff', 0.5); fill.position.set(10, 6, 8); scene.add(fill);

  const TOY = window.TOY;
  const M = (c, o) => TOY.mat(c, o);
  const add = (g, m, x, y, z, p) => TOY.mesh(g, m, x, y, z, p || scene);

  // ---------- 방(바닥·뒷벽) ----------
  function floorTex() {
    return TOY.tex(TOY.canvas(512, 512, (g, w, h) => {
      const s = 64;
      for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) { g.fillStyle = ((x + y) / s) % 2 ? '#fbefe8' : '#f6e2da'; g.fillRect(x, y, s, s); }
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
      for (let i = 0; i <= w; i += s) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    }), [17.5, 4]);
  }
  const floor = add(new THREE.PlaneGeometry(140, 30), M('#ffffff', { map: floorTex(), rough: 0.8 }), 3, -3.2, 2); // 왼쪽 공장·오른쪽 거래소까지
  floor.rotation.x = -PI / 2; floor.castShadow = false;

  // 뒷벽: 위는 분홍 벽지 줄무늬, 아래는 민트 징두리판
  function wallTex() {
    return TOY.tex(TOY.canvas(512, 512, (g, w, h) => {
      g.fillStyle = '#fcedf2'; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x, 0, 22, h); }
      g.fillStyle = 'rgba(236,180,200,.35)'; for (let x = 32; x < w; x += 64) for (let y = 20; y < h; y += 64) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
    }), [14, 1.4]);
  }
  const WALL_Z = -3.6;
  const wall = add(new THREE.PlaneGeometry(140, 16), M('#ffffff', { map: wallTex(), rough: 0.9 }), 3, 4.2, WALL_Z);
  wall.castShadow = false;
  const wains = add(TOY.rbox(140, 3.4, 0.3, 0.12), M('#d6f3ea', { rough: 0.6 }), 3, -1.6, WALL_Z + 0.1);
  wains.castShadow = false;
  add(TOY.rbox(140, 0.22, 0.42, 0.1), M('#ffffff', { rough: 0.4, gloss: 0.4 }), 3, 0.15, WALL_Z + 0.16).castShadow = false;

  // 창문: 하늘과 구름이 보이는 둥근 창 둘
  function sky() {
    return TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd3ff'); gr.addColorStop(1, '#dff1ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      [[70, 90, 34], [110, 80, 40], [150, 96, 30], [60, 190, 22], [90, 184, 28]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    }));
  }
  const skyMat = M('#ffffff', { map: sky(), rough: 1, emis: 0 });
  skyMat.emissive = new THREE.Color('#ffffff'); skyMat.emissiveMap = skyMat.map; skyMat.emissiveIntensity = 0.55;
  function windowAt(x) {
    const g = new THREE.Group(); g.position.set(x, 3.5, WALL_Z + 0.05); scene.add(g);
    add(TOY.rbox(3.6, 3.0, 0.3, 0.4), M('#ffffff', { gloss: 0.5, rough: 0.35 }), 0, 0, 0.1, g);
    add(TOY.rbox(3.1, 2.5, 0.1, 0.3), skyMat, 0, 0, 0.27, g).castShadow = false;
    add(TOY.rbox(0.14, 2.5, 0.16, 0.06), M('#ffffff', { gloss: 0.5 }), 0, 0, 0.33, g);
    add(TOY.rbox(3.1, 0.14, 0.16, 0.06), M('#ffffff', { gloss: 0.5 }), 0, 0, 0.33, g);
    add(TOY.rbox(4.0, 0.25, 0.6, 0.12), M('#ffffff', { gloss: 0.5 }), 0, -1.6, 0.35, g);
    // 화분
    add(TOY.rcyl(0.32, 0.5, 0.08), M('#f6a58a', { gloss: 0.3 }), 1.2, -1.22, 0.4, g);
    for (let i = 0; i < 5; i++) { const l = add(new THREE.SphereGeometry(0.22, 16, 12), M('#8fd39a', { rough: 0.6 }), 1.2 + Math.cos(i * 1.3) * 0.18, -0.8 + (i % 2) * 0.16, 0.4 + Math.sin(i * 1.3) * 0.12, g); l.scale.set(1, 1.3, 0.7); }
    return g;
  }
  windowAt(-6.5); windowAt(11.5);

  // 선반: 떡 상자·항아리
  function shelf(x, y) {
    const g = new THREE.Group(); g.position.set(x, y, WALL_Z + 0.3); scene.add(g);
    add(TOY.rbox(4.6, 0.2, 0.9, 0.08), M('#ffffff', { gloss: 0.4 }), 0, 0, 0.3, g);
    const cols = ['#ffc6d9', '#c6e6ff', '#fff1a8', '#d7c6ff'];
    for (let i = 0; i < 4; i++) {
      const b = add(TOY.rbox(0.8, 0.55, 0.6, 0.1), M(cols[i], { gloss: 0.35 }), -1.6 + i * 1.05, 0.38, 0.32, g);
      add(TOY.rbox(0.82, 0.08, 0.62, 0.04), M('#ffffff', { gloss: 0.4 }), 0, 0.05, 0, b);
    }
    return g;
  }
  shelf(-1.6, 4.2); shelf(4.4, 5.6);

  // 간판: 오떡 (벽에 붙은 둥근 판)
  const signG = (R.sign = new THREE.Group()); signG.position.set(1.4, 7.3, WALL_Z + 0.2); scene.add(signG);
  add(TOY.rbox(5.2, 1.7, 0.3, 0.8), M('#ff8fb1', { gloss: 0.6, rough: 0.35 }), 0, 0, 0, signG);
  const signTxt = add(new THREE.PlaneGeometry(4.6, 1.5), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label(L('오떡', 'OTTEOK'), { size: 170, color: '#ffffff', stroke: '#d9547e', sw: 22 }) }), 0, 0, 0.17, signG);
  signTxt.castShadow = false; signTxt.receiveShadow = false;
  R.setSign = function (txt) { if (window.EN) txt = { '오떡': 'OTTEOK', '오떡닷컴': 'otteok.com', '(주)오떡': 'OTTEOK Inc.' }[txt] || txt; signTxt.material.map = TOY.label(txt, { size: txt.length > 4 ? 110 : 170, color: '#ffffff', stroke: '#d9547e', sw: 22 }); signTxt.material.needsUpdate = true; };

  // ---------- 작업대 ----------
  const B = R.BENCH;
  function woodTex() {
    return TOY.tex(TOY.canvas(512, 256, (g, w, h) => {
      g.fillStyle = '#fde9d6'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) { g.fillStyle = y % 128 ? '#fbe2cb' : '#fdeadb'; g.fillRect(0, y, w, 62); g.fillStyle = 'rgba(200,140,110,.25)'; g.fillRect(0, y + 62, w, 2); }
      g.strokeStyle = 'rgba(190,120,80,.18)'; g.lineWidth = 2;
      for (let i = 0; i < 30; i++) { const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); g.stroke(); }
    }), [6, 1.4]);
  }
  const top = add(TOY.rbox(B.x1 - B.x0, 0.5, B.z1 - B.z0, 0.18), M('#ffffff', { map: woodTex(), rough: 0.55, gloss: 0.25 }), (B.x0 + B.x1) / 2, -0.25, 0);
  top.castShadow = true;
  // 앞판(서랍 줄)
  const apron = add(TOY.rbox(B.x1 - B.x0 - 0.6, 0.9, 0.3, 0.12), M('#ffe4d6', { gloss: 0.3 }), (B.x0 + B.x1) / 2, -0.9, B.z1 - 0.35);
  for (let x = B.x0 + 2.5; x < B.x1 - 1; x += 4) add(new THREE.SphereGeometry(0.1, 12, 8), M('#ffffff', { gloss: 0.6 }), x, -0.9, B.z1 - 0.15);
  // 다리
  [[B.x0 + 0.6, B.z0 + 0.6], [B.x0 + 0.6, B.z1 - 0.6], [B.x1 - 0.6, B.z0 + 0.6], [B.x1 - 0.6, B.z1 - 0.6], [4, B.z1 - 0.6], [4, B.z0 + 0.6]].forEach(([x, z]) => add(TOY.rbox(0.5, 3, 0.5, 0.2), M('#f6cfb0', { gloss: 0.2 }), x, -1.7, z));

  // 자리 매트: 자리마다 색 다른 둥근 매트(어디가 어디인지 색으로)
  function mat(x, w, c) { const m = add(TOY.rbox(w, 0.06, 3.9, 0.5), M(c, { rough: 0.85 }), x, 0.03, 0); m.castShadow = false; return m; }
  mat(ST.make, 7.4, '#fff1e6'); mat(ST.pack, 7.4, '#ffeef3'); mat(ST.ship, 7.4, '#eef5ff');

  // 트럭 길(작업대 오른쪽 끝)
  const road = add(TOY.rbox(5.4, 0.06, 2.4, 0.4), M('#7d8496', { rough: 0.9 }), ST.truck + 0.4, 0.03, 0.6);
  road.castShadow = false;
  for (let i = 0; i < 4; i++) add(TOY.rbox(0.7, 0.02, 0.12, 0.05), M('#ffffff', { rough: 0.6 }), ST.truck - 1.6 + i * 1.3, 0.07, 0.6).castShadow = false;

  // ---------- 장난감 트럭 ----------
  const truck = (R.truck = new THREE.Group());
  truck.position.set(ST.truck, 0, 0.6); scene.add(truck);
  (function buildTruck() {
    const body = new THREE.Group(); truck.add(body); truck.userData.body = body;
    add(TOY.rbox(2.6, 1.5, 1.6, 0.25), M('#fff4f8', { gloss: 0.5, rough: 0.35 }), -0.4, 1.15, 0, body); // 짐칸
    add(TOY.rbox(2.64, 0.32, 1.64, 0.12), M('#ff8fb1', { gloss: 0.5 }), -0.4, 0.62, 0, body);
    // 짐칸 옆 글자
    const side = add(new THREE.PlaneGeometry(2.2, 0.8), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label(L('오떡닷컴', 'otteok.com'), { size: 110, color: '#ff6f9c' }) }), -0.4, 1.2, 0.81, body);
    side.castShadow = false;
    add(TOY.rbox(1.2, 1.25, 1.5, 0.35), M('#ff8fb1', { gloss: 0.6, rough: 0.3 }), 1.4, 0.95, 0, body); // 머리
    add(TOY.rbox(0.1, 0.55, 1.2, 0.08), M('#bfe8ff', { gloss: 0.9, rough: 0.1 }), 2.0, 1.2, 0, body); // 앞유리
    add(TOY.rbox(0.7, 0.45, 0.05, 0.08), M('#bfe8ff', { gloss: 0.9, rough: 0.1 }), 1.45, 1.25, 0.76, body);
    add(new THREE.SphereGeometry(0.12, 12, 8), M('#fff6a0', { emis: 0.6 }), 2.0, 0.65, 0.5, body);
    add(new THREE.SphereGeometry(0.12, 12, 8), M('#fff6a0', { emis: 0.6 }), 2.0, 0.65, -0.5, body);
    truck.userData.wheels = [];
    [[-1.1, 0.75], [-1.1, -0.75], [1.3, 0.75], [1.3, -0.75]].forEach(([x, z]) => {
      const w = add(TOY.rcyl(0.36, 0.3, 0.1), M('#4a4f63', { rough: 0.7 }), x, 0.36, z, truck);
      w.rotation.x = PI / 2;
      add(TOY.rcyl(0.16, 0.32, 0.05), M('#ffffff', { gloss: 0.6 }), 0, 0, 0, w);
      truck.userData.wheels.push(w);
    });
    const sh = TOY.blob(4.4, 2.2, 0.3); sh.position.set(0, 0.075, 0); truck.add(sh);
  })();

  // ---------- 장난감 화물 비행기(해외 배송) ----------
  const planeG = (R.plane = new THREE.Group());
  planeG.position.set(ST.truck, 0, 0.6); planeG.visible = false; scene.add(planeG);
  (function buildPlane() {
    const body = new THREE.Group(); planeG.add(body); planeG.userData.body = body;
    const wm = M('#ffffff', { gloss: 0.6, rough: 0.3 }), pm = M('#ff8fb1', { gloss: 0.6, rough: 0.3 });
    const f = add(new THREE.CapsuleGeometry(0.62, 2.6, 8, 20), wm, 0, 1.0, 0, body); f.rotation.z = PI / 2;
    add(TOY.rbox(3.2, 0.12, 0.08, 0.04), pm, -0.1, 0.92, 0.62, body);
    add(TOY.rbox(0.9, 0.1, 3.4, 0.05), wm, 0.1, 0.85, 0, body);
    add(TOY.rbox(0.5, 0.1, 1.3, 0.05), wm, -1.75, 1.25, 0, body);
    add(TOY.rbox(0.55, 0.85, 0.1, 0.05), pm, -1.75, 1.6, 0, body);
    for (let i = 0; i < 4; i++) add(new THREE.SphereGeometry(0.12, 12, 8), M('#bfe8ff', { gloss: 1, rough: 0.1 }), 0.9 - i * 0.45, 1.2, 0.58, body).scale.set(1, 1, 0.4);
    add(new THREE.SphereGeometry(0.3, 16, 12), M('#bfe8ff', { gloss: 1, rough: 0.1 }), 1.75, 1.15, 0, body).scale.set(0.8, 0.7, 1.2);
    planeG.userData.wheels = [];
    [[0.8, 0.5], [0.8, -0.5], [-1.0, 0]].forEach(([x, z]) => { const w = add(TOY.rcyl(0.18, 0.16, 0.05), M('#4a4f63', { rough: 0.7 }), x, 0.18, z, planeG); w.rotation.x = PI / 2; planeG.userData.wheels.push(w); });
    const side = add(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('OTTEOK AIR', { size: 70, color: '#ff6f9c' }) }), -0.2, 1.05, 0.63, body);
    side.castShadow = false;
    const sh = TOY.blob(4.4, 3.4, 0.3); sh.position.set(0, 0.075, 0); planeG.add(sh);
  })();

  // ---------- 장마다 늘어나는 방 꾸밈 ----------
  const DEC = {};
  R.decor = function (ch) {
    const want = (n, f) => { if (ch >= n && !DEC[n]) { DEC[n] = f(); } if (DEC[n]) DEC[n].visible = ch >= n; };
    // 2장: 컴퓨터(오떡닷컴 화면)와 줄 전구
    want(2, () => {
      const g = new THREE.Group(); scene.add(g);
      const mon = new THREE.Group(); mon.position.set(-4.4, 0, -1.75); g.add(mon);
      add(TOY.rbox(2.0, 1.3, 0.16, 0.12), M('#ffffff', { gloss: 0.5 }), 0, 1.25, 0, mon);
      const scr = add(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshBasicMaterial({ map: screenTex() }), 0, 1.25, 0.085, mon); scr.castShadow = false;
      add(TOY.rbox(0.25, 0.5, 0.2, 0.08), M('#ffffff', { gloss: 0.5 }), 0, 0.3, -0.02, mon);
      add(TOY.rbox(0.9, 0.08, 0.5, 0.04), M('#ffffff', { gloss: 0.5 }), 0, 0.05, 0, mon);
      const cols = ['#ff9ec0', '#ffe08a', '#9fd2ff', '#b8e8a2'];
      for (let i = 0; i < 26; i++) { const x = -12 + i * 1.2; const y = 6.0 - Math.sin((i % 6) / 5 * PI) * 0.5; const b = add(new THREE.SphereGeometry(0.13, 12, 8), M(cols[i % 4], { emis: 0.6 }), x, y, WALL_Z + 0.25, g); b.castShadow = false; }
      return g;
    });
    // 3장: 벽에 지도 포스터
    want(3, () => {
      const g = new THREE.Group(); scene.add(g);
      add(TOY.rbox(3.0, 2.2, 0.1, 0.1), M('#ffffff', { gloss: 0.3 }), 8.6, 4.6, WALL_Z + 0.1, g);
      const m = add(new THREE.PlaneGeometry(2.7, 1.9), new THREE.MeshBasicMaterial({ map: mapTex() }), 8.6, 4.6, WALL_Z + 0.17, g); m.castShadow = false;
      return g;
    });
    // 4장: 뒤쪽 컨베이어 벨트(상자가 흘러감)
    want(4, () => {
      const g = new THREE.Group(); scene.add(g);
      const bt = TOY.tex(TOY.canvas(128, 32, (q, w, h) => { q.fillStyle = '#9aa6bd'; q.fillRect(0, 0, w, h); q.fillStyle = '#b8c3d8'; for (let x = 0; x < w; x += 32) q.fillRect(x, 0, 12, h); }), [24, 1]);
      add(TOY.rbox(26, 0.18, 0.5, 0.08), M('#ffffff', { map: bt, rough: 0.6 }), 2, 0.09, -2.05, g);
      g.userData.belt = bt; g.userData.boxes = [];
      for (let i = 0; i < 9; i++) { const b = add(TOY.rbox(0.42, 0.34, 0.36, 0.06), M(['#f0d0a8', '#ffd6e4', '#d9ecff'][i % 3], { rough: 0.7 }), -11 + i * 3, 0.35, -2.05, g); g.userData.boxes.push(b); }
      R.beltG = g;
      return g;
    });
    // 5장: 벽 TV(생방송)와 트로피
    want(5, () => {
      const g = new THREE.Group(); scene.add(g);
      add(TOY.rbox(2.6, 1.6, 0.14, 0.1), M('#3a3a4a', { gloss: 0.6 }), -9.5, 4.8, WALL_Z + 0.1, g);
      const s = add(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshBasicMaterial({ map: TOY.label('LIVE', { size: 130, color: '#ffffff', bg: '#ff5a7a' }) }), -9.5, 4.8, WALL_Z + 0.18, g); s.castShadow = false;
      const t = new THREE.Group(); t.position.set(4.4, 5.85, WALL_Z + 0.6); g.add(t);
      add(TOY.rcyl(0.18, 0.2, 0.05), M('#ffd45a', { gloss: 1, rough: 0.2 }), 0, 0.1, 0, t);
      add(new THREE.CylinderGeometry(0.35, 0.12, 0.5, 20), M('#ffd45a', { gloss: 1, rough: 0.2 }), 0, 0.5, 0, t);
      return g;
    });
    // 6장: 지구본
    want(6, () => {
      const g = new THREE.Group(); scene.add(g);
      R.globe = add(new THREE.SphereGeometry(0.5, 28, 20), M('#ffffff', { map: globeTex(), gloss: 0.5 }), -1.6, 5.05, WALL_Z + 0.7, g);
      add(TOY.rcyl(0.25, 0.12, 0.04), M('#ffd45a', { gloss: 1 }), -1.6, 4.4, WALL_Z + 0.7, g);
      return g;
    });
    // 7장: 벽 위 주식 전광판
    want(7, () => {
      const g = new THREE.Group(); scene.add(g);
      add(TOY.rbox(30, 0.7, 0.2, 0.1), M('#2a2433', { gloss: 0.4 }), 3, 8.9, WALL_Z + 0.1, g);
      const tx = TOY.tex(TOY.canvas(1024, 64, (q, w, h) => { q.fillStyle = '#2a2433'; q.fillRect(0, 0, w, h); q.font = "40px 'Ttl',sans-serif"; q.textBaseline = 'middle'; q.fillStyle = '#7ff0b0'; q.fillText('otteok.com ▲ 1,240%     SONGPYEON ▲ 88%     INJEOLMI ▲ 61%     ', 0, 34); }), [3, 1]);
      add(new THREE.PlaneGeometry(29.6, 0.5), new THREE.MeshBasicMaterial({ map: tx }), 3, 8.9, WALL_Z + 0.21, g).castShadow = false;
      R.ticker = tx;
      return g;
    });
  };
  function screenTex() {
    return TOY.tex(TOY.canvas(360, 220, (g, w, h) => {
      const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
      g.fillStyle = '#fff6f9'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff7aa8'; g.fillRect(0, 0, w, 40);
      g.fillStyle = '#fff'; g.font = "26px 'Ttl',sans-serif"; g.textBaseline = 'middle'; g.fillText('otteok.com', 14, 21);
      ['#e9c46a', '#ffc6d8', '#ffd59e'].forEach((c, i) => { g.fillStyle = c; rr(20 + i * 110, 62, 90, 70, 12); g.fill(); });
      g.fillStyle = '#ff7aa8'; rr(110, 156, 140, 40, 20); g.fill(); g.fillStyle = '#fff'; g.font = "22px 'Ttl',sans-serif"; g.textAlign = 'center'; g.fillText('ORDER', 180, 177);
    }));
  }
  function mapTex() {
    return TOY.tex(TOY.canvas(300, 210, (g, w, h) => {
      g.fillStyle = '#d9efff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#c6ebb4'; g.beginPath(); g.moveTo(140, 20); g.bezierCurveTo(190, 30, 200, 90, 185, 130); g.bezierCurveTo(175, 175, 140, 190, 120, 180); g.bezierCurveTo(100, 150, 95, 100, 110, 60); g.bezierCurveTo(115, 40, 125, 22, 140, 20); g.fill();
      g.beginPath(); g.ellipse(115, 196, 14, 6, 0, 0, 7); g.fill();
      [[150, 60], [160, 120], [130, 150], [175, 150], [140, 95], [120, 130]].forEach(([x, y]) => { g.fillStyle = '#ff5a7a'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); });
    }));
  }
  function globeTex() {
    return TOY.tex(TOY.canvas(256, 128, (g, w, h) => {
      g.fillStyle = '#8fd0ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#9fe08a';
      [[40, 40, 30, 20], [70, 80, 16, 26], [120, 40, 30, 18], [140, 70, 18, 24], [200, 45, 34, 20], [210, 95, 14, 10]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a, b, 0.3, 0, 7); g.fill(); });
      g.fillStyle = '#ff5a7a'; [[200, 50], [60, 45], [125, 45], [215, 98]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); });
    }));
  }
  R.stepDecor = function (dt) {
    if (R.beltG && R.beltG.visible) { R.beltG.userData.belt.offset.x -= dt * 0.25; R.beltG.userData.boxes.forEach((b) => { b.position.x += dt * 0.75; if (b.position.x > 15) b.position.x -= 27; }); }
    if (R.globe) R.globe.rotation.y += dt * 0.4;
    if (R.ticker) R.ticker.offset.x += dt * 0.04;
  };

  // ---------- 엔딩: 나스닥 종(단상 위 금빛 종) ----------
  let bellG = null;
  // pos 를 주면 그 자리(거래소 단상 위)에
  R.bell = function (pos) {
    if (bellG) return bellG;
    bellG = new THREE.Group(); if (pos) bellG.position.copy(pos); else bellG.position.set(ST.pack, 0, -0.2); scene.add(bellG);
    const gold = M('#ffe58a', { gloss: 1, rough: 0.25, emis: 0.18 });
    if (!pos) {
      add(TOY.rbox(3.2, 0.5, 2.2, 0.2), M('#ff9ec0', { gloss: 0.5 }), 0, 0.25, 0, bellG);
      add(TOY.rbox(3.3, 0.12, 2.3, 0.06), M('#ffffff', { gloss: 0.5 }), 0, 0.5, 0, bellG);
      const lab = add(new THREE.PlaneGeometry(2.6, 0.42), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('NASDAQ', { size: 120, color: '#ffffff' }) }), 0, 0.27, 1.11, bellG);
      lab.castShadow = false;
    }
    // 종 걸이
    [-1.1, 1.1].forEach((x) => add(TOY.rcyl(0.08, 2.6, 0.04), gold, x, 1.8, 0, bellG));
    add(TOY.rcyl(0.08, 2.3, 0.04), gold, 0, 3.1, 0, bellG).rotation.z = PI / 2;
    const sw = new THREE.Group(); sw.position.set(0, 3.05, 0); bellG.add(sw); bellG.userData.sw = sw;
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.15 + Math.pow(t, 1.8) * 0.75 + (t > 0.9 ? (t - 0.9) * 1.2 : 0), -t * 1.2)); }
    add(new THREE.LatheGeometry(pts, 36), gold, 0, -0.05, 0, sw).material.side = THREE.DoubleSide;
    add(new THREE.SphereGeometry(0.16, 16, 12), gold, 0, 0.02, 0, sw);
    const clap = add(new THREE.SphereGeometry(0.16, 14, 10), M('#e8a42a', { gloss: 1 }), 0, -1.15, 0, sw);
    bellG.userData.pick = 'bell';
    bellG.scale.setScalar(0.01);
    FX.tw(0.6, (u) => bellG.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
    return bellG;
  };
  R.ringBell = function (done) {
    const sw = bellG.userData.sw;
    if (window.SND) SND.bell();
    R.shake(0.2);
    FX.tw(2.4, (u) => { sw.rotation.z = Math.sin(u * PI * 7) * 0.55 * (1 - u); }, null, FX.ease.lin);
    // 금빛 소리 고리
    const bp = bellG.position;
    for (let i = 0; i < 4; i++) FX.wait(i * 0.35, () => FX.ring(new THREE.Vector3(bp.x, bp.y + 0.55, bp.z), { color: '#ffe27a', size: 1, to: 6, life: 0.9 }));
    // 떡과 별이 하늘에서 쏟아진다
    const types = ['injeolmi', 'songpyeon', 'mujigae', 'kkuldduk', 'jeolpyeon', 'garaetteok', 'baekseolgi', 'ddalgi'];
    let n = 0;
    const rain = () => {
      if (n++ > 46) return;
      const pc = DDEOK.piece(types[n % types.length], { color: ['#ffc6d8', '#b9e3a3', '#fffaf2'][n % 3] });
      pc.position.set(bp.x + (Math.random() - 0.5) * 12, 9, (Math.random() - 0.5) * 4);
      pc.rotation.set(Math.random() * 6, Math.random() * 6, 0);
      scene.add(pc);
      let v = 0;
      const x = pc.position.x, z = pc.position.z;
      const floorY = (z > -2.2 && z < 2.2 && x > R.BENCH.x0 && x < R.BENCH.x1) || (window.EXCH && x > 22.5 && x < 49.5 && z > -3.3 && z < 3.6) ? 0 : -3.1;
      FX.tw(2.2, () => {
        v += 0.016 * 14; pc.position.y -= v * 0.016; pc.rotation.x += 0.05;
        if (pc.position.y < floorY) { pc.position.y = floorY; v = -v * 0.35; }
      }, null, FX.ease.lin);
      FX.wait(0.05, rain);
    };
    rain();
    let k = 0;
    const conf = () => { if (k++ > 10) return; FX.burst(new THREE.Vector3(bp.x + (Math.random() - 0.5) * 6, 5, (Math.random() - 0.5) * 2), { n: 18, kind: 'confetti', color: ['#ff8fb1', '#ffe27a', '#9fd2ff', '#b8e8a2', '#cdb4ff'], size: 0.22, speed: 3, up: 2, g: 3, life: 2.4, drag: 1, spin: 8 }); FX.wait(0.2, conf); };
    conf();
    FX.wait(2.6, () => done && done());
  };

  // ---------- 틸트시프트(가장자리 흐림) ----------
  const TS = { on: true, rtA: null, rtB: null, quad: null, sceneQ: null, camQ: null, mBlur: null, mOut: null };
  R.TS = TS;
  function makeTS() {
    const W = Math.max(2, Math.floor(innerWidth * R.dpr)), H = Math.max(2, Math.floor(innerHeight * R.dpr));
    const opt = { samples: LOW ? 0 : 4, colorSpace: THREE.SRGBColorSpace };
    if (TS.rtA) { TS.rtA.setSize(W, H); TS.rtB.setSize(W, H); TS.rtC.setSize(W, H); return; }
    TS.rtA = new THREE.WebGLRenderTarget(W, H, opt);
    TS.rtB = new THREE.WebGLRenderTarget(W, H, { colorSpace: THREE.SRGBColorSpace });
    TS.rtC = new THREE.WebGLRenderTarget(W, H, { colorSpace: THREE.SRGBColorSpace });
    TS.camQ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    TS.sceneQ = new THREE.Scene();
    const vs = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
    TS.mBlur = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2(1, 0) }, uRes: { value: new THREE.Vector2(W, H) }, uFocus: { value: 0.48 }, uBand: { value: 0.2 }, uAmt: { value: 3.2 } },
      vertexShader: vs,
      fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uDir; uniform vec2 uRes; uniform float uFocus; uniform float uBand; uniform float uAmt; varying vec2 vUv;
        void main(){ float d = max(0., abs(vUv.y-uFocus)-uBand); float r = clamp(d*uAmt, 0., 1.) * 7.0;
          vec2 st = uDir / uRes * r; vec4 c = texture2D(tDiffuse, vUv)*0.2270;
          c += texture2D(tDiffuse, vUv+st*1.3846)*0.3162; c += texture2D(tDiffuse, vUv-st*1.3846)*0.3162;
          c += texture2D(tDiffuse, vUv+st*3.2308)*0.0703; c += texture2D(tDiffuse, vUv-st*3.2308)*0.0703;
          gl_FragColor = c; }`,
      depthTest: false, depthWrite: false,
    });
    // 마지막: 살짝 채도 올리고 가장자리 어둡게
    TS.mOut = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: vs,
      fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
        void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(.299,.587,.114)); c.rgb = mix(vec3(l), c.rgb, 0.98);
          vec2 q = vUv-.5; c.rgb *= 1.0 - dot(q,q)*0.32; gl_FragColor = c; }`,
      depthTest: false, depthWrite: false,
    });
    TS.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), TS.mBlur);
    TS.sceneQ.add(TS.quad);
  }

  // ---------- 화면 맞추기 ----------
  R.portrait = false;
  R.orderK = 0; // 주문서가 떠 있으면 1
  R.resize = function () {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    R.portrait = h > w * 1.05;
    makeTS();
    if (TS.mBlur) TS.mBlur.uniforms.uRes.value.set(w * R.dpr, h * R.dpr);
    R.applyCam(true);
  };
  // 자리마다 보이는 폭(월드 단위): 폰 세로는 폭에 맞추고 PC 는 높이에 맞춘다
  R.applyCam = function (snap) {
    const v = R.view;
    if (snap) { v.x = v.tx; v.y = v.ty; v.z = v.tz; v.h = v.th; }
    const asp = innerWidth / innerHeight;
    let hh = v.h; // 보이는 높이(월드)
    const needW = v.h * (R.portrait ? 1.08 : 1.25); // 자리 하나가 다 보일 폭
    if (hh * asp < needW) hh = needW / asp;
    cam.left = -hh * asp / 2; cam.right = hh * asp / 2; cam.top = hh / 2; cam.bottom = -hh / 2;
    cam.updateProjectionMatrix();
    // PC 는 왼쪽에 주문서가 있으니 장면을 오른쪽으로 조금 민다
    const wpp = (cam.right - cam.left) / innerWidth;
    // 폰 세로는 위 상단바·아래 주문서 사이 가운데에 오도록 살짝 아래로
    const tgt = new V3(v.x - (R.portrait ? 0 : 130 * wpp * R.orderK), v.y, v.z + (R.portrait ? 1.3 * R.orderK : 0));
    cam.position.copy(tgt).addScaledVector(DIR, 40);
    cam.lookAt(tgt);
    sun.position.set(v.x - 8, 16, 10); sun.target.position.set(v.x, 0, 0); sun.target.updateMatrixWorld();
    // 폰 세로는 화면 위아래에 글 칸이 있어서 초점 띠를 조금 위로
    if (TS.mBlur) { TS.mBlur.uniforms.uFocus.value = R.portrait ? 0.5 : 0.47; TS.mBlur.uniforms.uBand.value = R.band || (R.portrait ? 0.24 : 0.2); }
  };
  // 자리로 카메라 옮기기
  R.focus = function (x, z, h, y) { const v = R.view; v.tx = x; v.tz = z == null ? 0.2 : z; v.th = h || 9; v.ty = y == null ? 0.3 : y; };
  R.stepCam = function (dt) {
    const v = R.view, k = 1 - Math.exp(-dt * 5);
    v.x += (v.tx - v.x) * k; v.y += (v.ty - v.y) * k; v.z += (v.tz - v.z) * k; v.h += (v.th - v.h) * k;
    if (R.shakeT > 0) { R.shakeT -= dt; }
    R.applyCam(false);
    if (R.shakeT > 0) { const a = R.shakeA * (R.shakeT / 0.25); cam.position.x += (Math.random() - 0.5) * a; cam.position.y += (Math.random() - 0.5) * a; }
  };
  R.shakeT = 0; R.shakeA = 0;
  R.shake = function (a) { R.shakeT = 0.25; R.shakeA = a || 0.12; };

  R.render = function () {
    if (!TS.on || !TS.rtA) { renderer.setRenderTarget(null); renderer.render(scene, cam); return; }
    renderer.setRenderTarget(TS.rtA); renderer.render(scene, cam);
    TS.quad.material = TS.mBlur;
    TS.mBlur.uniforms.tDiffuse.value = TS.rtA.texture; TS.mBlur.uniforms.uDir.value.set(1, 0);
    renderer.setRenderTarget(TS.rtB); renderer.render(TS.sceneQ, TS.camQ);
    TS.mBlur.uniforms.tDiffuse.value = TS.rtB.texture; TS.mBlur.uniforms.uDir.value.set(0, 1);
    renderer.setRenderTarget(TS.rtC); renderer.render(TS.sceneQ, TS.camQ);
    TS.quad.material = TS.mOut; TS.mOut.uniforms.tDiffuse.value = TS.rtC.texture;
    renderer.setRenderTarget(null); renderer.render(TS.sceneQ, TS.camQ);
  };

  // ---------- 고르기·좌표 ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  // 그리기 전에도 맞게(시험 손이 그리지 않고 시간만 넘길 때)
  function fresh() { scene.updateMatrixWorld(); cam.updateMatrixWorld(); }
  function setRay(cx, cy) { fresh(); ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); }
  R.pick = function (cx, cy, list) {
    setRay(cx, cy);
    const hit = ray.intersectObjects(list, true)[0];
    if (!hit) return null;
    let o = hit.object;
    while (o && !o.userData.pick) o = o.parent;
    return o ? { obj: o, point: hit.point } : null;
  };
  const plane = new THREE.Plane(new V3(0, 1, 0), 0), tmp = new V3();
  R.groundAt = function (cx, cy, y) { setRay(cx, cy); plane.constant = -(y || 0); return ray.ray.intersectPlane(plane, tmp) ? tmp.clone() : null; };
  R.toScreen = function (v) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight }; };

  addEventListener('resize', () => R.resize());
  R.resize();
})();
