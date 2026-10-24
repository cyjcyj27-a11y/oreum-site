// 3D 장면: 남포동 밤거리 호떡 노점(조리대·철판·통·도구·뒷거리), 카메라 맞추기, 알갱이
(function () {
  const R = (window.RND = {});
  const V3 = THREE.Vector3;
  const PI = Math.PI;

  // ---------- 자리(조리대 윗면 y=0, x 오른쪽, z 요리사 쪽 +) ----------
  const P = (R.POS = {
    grid: { x: 0, z: -0.17, w: 0.74, d: 0.52, y: 0.035 }, // 철판
    board: { x: -0.22, z: 0.25, w: 0.27, d: 0.21 }, // 빚는 판
    tray: { x: 0.2, z: 0.25, w: 0.27, d: 0.21 },   // 가르고 씨앗 넣는 쟁반
    doughPan: { x: -0.37, z: 0.53, cw: 0.1, d: 0.18, keys: ['plain', 'green', 'black'] }, // 반죽 통(칸 셋)
    fillPan: { x: 0.02, z: 0.53, cw: 0.1, d: 0.18, keys: ['sugar', 'bean', 'cheese', 'japchae'] }, // 속 통(칸 넷)
    seeds: { x: 0.385, z: 0.52, r: 0.095 },  // 씨앗 통
    oil: { x: 0.46, z: -0.06 },              // 기름병
    press: { x: 0.47, z: -0.33 },            // 누르개 놓는 자리
    cups: { x: -0.47, z: -0.36 },
    bin: { x: -0.47, z: -0.1, r: 0.066 },   // 버리는 통
    front: -0.5,                              // 손님 쪽 조리대 끝
  });
  // 철판 칸: 앞줄 셋이 먼저, 뒷줄은 철판 넓히기로
  R.SPOTS = [[-0.235, -0.05], [0, -0.05], [0.235, -0.05], [-0.235, -0.29], [0, -0.29], [0.235, -0.29]].map(([x, z]) => ({ x, z }));
  R.SLOTS = [-0.42, 0.0, 0.42]; // 손님 서는 자리 x
  R.CUST_Z = -0.82;

  // ---------- 렌더러 ----------
  const cv = document.getElementById('cv');
  const renderer = (R.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }));
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = (R.scene = new THREE.Scene());
  scene.background = new THREE.Color(0x0d0f18);
  scene.fog = new THREE.Fog(0x141522, 4, 14);
  const cam = (R.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 40));

  // ---------- 캔버스 무늬 ----------
  function canvas(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
  function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
  function dtex(c, rep) { const t = new THREE.CanvasTexture(c); t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  R.rnd = rnd;

  // 스테인리스 결(가로로 긁힌 줄)
  const steelC = canvas(512, 512, (g, w, h) => {
    g.fillStyle = '#8f949a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const y = rnd() * h, l = 40 + rnd() * 300, x = rnd() * w; g.strokeStyle = 'rgba(' + (rnd() > 0.5 ? '255,255,255' : '30,30,35') + ',' + (0.04 + rnd() * 0.08) + ')'; g.lineWidth = 0.6 + rnd() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (rnd() - 0.5) * 2); g.stroke(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(60,40,20,' + (0.04 + rnd() * 0.06) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 10 + rnd() * 40, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); }
  });
  const steelRough = canvas(256, 256, (g, w, h) => { g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { g.strokeStyle = 'rgba(' + (rnd() > 0.5 ? '200,200,200' : '40,40,40') + ',.25)'; g.beginPath(); const y = rnd() * h; g.moveTo(rnd() * w, y); g.lineTo(rnd() * w, y); g.stroke(); } });
  const steelMat = (R.steelMat = new THREE.MeshStandardMaterial({ map: tex(steelC, [2, 2]), roughnessMap: dtex(steelRough, [2, 2]), color: 0xe8ecf0, metalness: 0.55, roughness: 0.36, envMapIntensity: 1.4 }));
  const steelBright = new THREE.MeshStandardMaterial({ map: steelMat.map, color: 0xf2f4f6, metalness: 0.9, roughness: 0.25 });

  // 무쇠 철판: 길든 검은 쇠 + 기름 얼룩 + 눌어붙은 동그란 자국
  const ironC = canvas(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a2522'); gr.addColorStop(1, '#1c1916'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { g.fillStyle = 'rgba(' + (rnd() > 0.5 ? '90,70,50' : '5,5,5') + ',' + rnd() * 0.12 + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); }
    for (let i = 0; i < 22; i++) { const x = rnd() * w, y = rnd() * h, r = 30 + rnd() * 50; g.strokeStyle = 'rgba(70,45,25,' + (0.15 + rnd() * 0.2) + ')'; g.lineWidth = 3 + rnd() * 8; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.fillStyle = 'rgba(40,25,12,.18)'; g.beginPath(); g.arc(x, y, r * 0.9, 0, 7); g.fill(); }
    // 가장자리 기름때
    const e = g.createLinearGradient(0, 0, 0, h); e.addColorStop(0, 'rgba(80,50,20,.35)'); e.addColorStop(0.1, 'rgba(0,0,0,0)'); e.addColorStop(0.9, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(80,50,20,.35)'); g.fillStyle = e; g.fillRect(0, 0, w, h);
  });
  const ironRough = canvas(512, 256, (g, w, h) => { g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); g.save(); g.translate(rnd() * w, rnd() * h); g.scale(30 + rnd() * 70, 14 + rnd() * 30); gr.addColorStop(0, 'rgba(20,20,20,.75)'); gr.addColorStop(1, 'rgba(20,20,20,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); } });
  const ironMat = (R.ironMat = new THREE.MeshStandardMaterial({ map: tex(ironC), roughnessMap: dtex(ironRough), color: 0xffffff, metalness: 0.55, roughness: 0.3, envMapIntensity: 1.3 }));

  // ---------- 환경맵: 어두운 거리 + 따뜻한 전구 점 ----------
  (function env() {
    const c = canvas(1024, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a2c3c'); gr.addColorStop(0.45, '#5a5262'); gr.addColorStop(0.55, '#5e4a3a'); gr.addColorStop(1, '#2a2018'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const x = rnd() * w, y = h * (0.3 + rnd() * 0.25), r = 6 + rnd() * 26; const rg = g.createRadialGradient(x, y, 0, x, y, r); const col = ['255,200,120', '255,120,80', '120,200,255', '255,240,200'][i % 4]; rg.addColorStop(0, 'rgba(' + col + ',1)'); rg.addColorStop(1, 'rgba(' + col + ',0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
      // 머리 위 전구 줄
      for (let i = 0; i < 6; i++) { const x = w * (0.15 + i * 0.14), y = h * 0.12; const rg = g.createRadialGradient(x, y, 0, x, y, 60); rg.addColorStop(0, 'rgba(255,220,150,1)'); rg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = rg; g.fillRect(x - 60, y - 60, 120, 120); }
    });
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
  })();

  // ---------- 빛 ----------
  const hemi = new THREE.HemisphereLight(0x5a6890, 0x3a2414, 0.55); scene.add(hemi);
  const key = (R.key = new THREE.DirectionalLight(0xffe2b8, 1.8));
  key.position.set(0.5, 2.4, 0.9); key.target.position.set(0, 0, -0.05); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
  const sc = key.shadow.camera; sc.left = -1.2; sc.right = 1.2; sc.top = 1.2; sc.bottom = -1.2; sc.near = 0.5; sc.far = 5;
  const bulb = (R.bulb = new THREE.PointLight(0xffb066, 1.4, 3.2, 1.6)); bulb.position.set(-0.05, 0.95, -0.35); scene.add(bulb);
  const rim = new THREE.DirectionalLight(0x7aa0ff, 0.7); rim.position.set(-1.5, 1.6, -3); scene.add(rim);
  // 철판 열기(아래에서 비추는 주황빛)
  const heat = (R.heat = new THREE.PointLight(0xff7a30, 0.0, 0.9, 2)); heat.position.set(P.grid.x, 0.12, P.grid.z); scene.add(heat);

  // ---------- 조리대(스테인리스 수레) ----------
  const world = (R.world = new THREE.Group()); scene.add(world);
  function box(w, h, d, mat, x, y, z, cast, recv) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = !!cast; m.receiveShadow = recv !== false; world.add(m); return m; }
  box(1.7, 0.04, 1.32, steelMat, 0, -0.02, 0.09); // 윗판
  box(1.7, 0.86, 0.03, steelMat, 0, -0.45, -0.57); // 손님 쪽 앞판
  box(1.72, 0.05, 0.05, steelBright, 0, -0.005, -0.585); // 앞 테
  box(0.03, 0.88, 1.32, steelMat, -0.85, -0.46, 0.09); box(0.03, 0.88, 1.32, steelMat, 0.85, -0.46, 0.09);
  // 앞판에 붙인 빨간 시트지 글씨 띠
  const signFront = (R.signFront = canvas(1024, 192, () => {}));
  const sfMat = new THREE.MeshStandardMaterial({ map: tex(signFront), roughness: 0.55, metalness: 0.1 });
  const sfm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), sfMat); sfm.position.set(0, -0.22, -0.587); sfm.rotation.y = PI; world.add(sfm);
  R.drawFrontSign = function () {
    const g = signFront.getContext('2d'), w = 1024, h = 192;
    g.fillStyle = '#c8261e'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f7d24a'; g.fillRect(0, 10, w, 8); g.fillRect(0, h - 18, w, 8);
    g.font = '900 108px Ttl, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff6dc'; g.fillText(L('호떡', 'HOTTEOK'), w / 2, h / 2 + 4);
    sfMat.map.needsUpdate = true;
  };

  // 철판: 무쇠 판 + 두꺼운 테 + 가장자리 기름 홈
  const G = P.grid;
  const gplate = (R.gplate = new THREE.Mesh(new THREE.BoxGeometry(G.w, 0.02, G.d), ironMat)); gplate.position.set(G.x, G.y - 0.01, G.z); gplate.receiveShadow = true; world.add(gplate);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x1b1816, metalness: 0.6, roughness: 0.45 });
  [[G.w + 0.04, 0.03, 0.02, 0, -G.d / 2 - 0.01], [G.w + 0.04, 0.03, 0.02, 0, G.d / 2 + 0.01], [0.02, 0.03, G.d, -G.w / 2 - 0.01, 0], [0.02, 0.03, G.d, G.w / 2 + 0.01, 0]].forEach(([w, h, d, x, z]) => { box(w, h, d, rimMat, G.x + x, G.y + 0.005, G.z + z, true); });
  box(G.w + 0.08, 0.035, G.d + 0.08, new THREE.MeshStandardMaterial({ color: 0x2a2826, metalness: 0.7, roughness: 0.5 }), G.x, 0.0, G.z); // 받침
  // 철판 위 기름막(번들거림): 투명 판, 기름 양에 따라 밝기
  const oilMat = (R.oilMat = new THREE.MeshStandardMaterial({ color: 0xffd27a, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.2, envMapIntensity: 2.5, depthWrite: false }));
  const oilFilm = new THREE.Mesh(new THREE.PlaneGeometry(G.w * 0.96, G.d * 0.92), oilMat); oilFilm.rotation.x = -PI / 2; oilFilm.position.set(G.x, G.y + 0.0015, G.z); world.add(oilFilm);
  // 칸 표시: 철판에 희미하게 눌어붙은 둥근 자국(놓을 자리)
  const spotMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
  const spotGlow = new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending });
  R.spotMesh = R.SPOTS.map((s) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.085, 0.1, 40), spotMat); m.rotation.x = -PI / 2; m.position.set(s.x, G.y + 0.002, s.z); world.add(m);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40), spotGlow.clone()); gl.rotation.x = -PI / 2; gl.position.set(s.x, G.y + 0.0025, s.z); world.add(gl);
    return { ring: m, glow: gl };
  });
  R.setSpots = function (n) { R.spotMesh.forEach((s, i) => { s.ring.visible = i < n; s.glow.visible = i < n; }); };
  R.hiSpot = function (i) { R.spotMesh.forEach((s, k) => (s.glow.material.opacity = k === i ? 0.22 : 0)); };

  // 통: 스테인리스 둥근 통(안쪽 내용물 별도)
  function tub(x, z, r, h, fillCol, fillTex, rough) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); world.add(grp);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.92, h, 40, 1, true), new THREE.MeshStandardMaterial({ map: steelMat.map, color: 0xe6e9ec, metalness: 0.88, roughness: 0.3, side: THREE.DoubleSide }));
    wall.position.y = h / 2; wall.castShadow = true; grp.add(wall);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 8, 40), steelBright); lip.rotation.x = PI / 2; lip.position.y = h; grp.add(lip);
    const fill = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 40), new THREE.MeshStandardMaterial({ color: fillCol, map: fillTex || null, roughness: rough === undefined ? 0.8 : rough })); fill.rotation.x = -PI / 2; fill.position.y = h * 0.82; fill.receiveShadow = true; grp.add(fill);
    grp.userData.fill = fill;
    return grp;
  }
  function wob(g, amt) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = Math.sin(x * 61 + z * 37) * Math.cos(z * 53 - y * 29) * amt; p.setXYZ(i, x * (1 + n * 8), y, z * (1 + n * 8)); } g.computeVertexNormals(); }
  // 칸 자리: R.cell('dough'|'fill', 키)
  R.cell = function (pan, key) { const o = pan === 'dough' ? P.doughPan : P.fillPan, i = o.keys.indexOf(key), n = o.keys.length; return { x: o.x + (i - (n - 1) / 2) * o.cw, z: o.z, w: o.cw, d: o.d }; };
  // 반죽 재질(칸마다 색)
  R.doughMats = {};
  ['plain', 'green', 'black'].forEach((k) => { R.doughMats[k] = new THREE.MeshStandardMaterial({ color: new THREE.Color(DATA.DOUGH[k].col), roughness: 0.42, metalness: 0, envMapIntensity: 0.7 }); });
  R.doughMat = R.doughMats.plain;
  // 속 재질
  const sugarC = canvas(256, 256, (g, w, h) => { g.fillStyle = '#5a3216'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { const v = rnd(); g.fillStyle = v > 0.7 ? 'rgba(150,90,40,.8)' : v > 0.35 ? 'rgba(90,50,22,.9)' : 'rgba(40,20,8,.9)'; g.fillRect(rnd() * w, rnd() * h, 2, 2); } });
  R.sugarTex = tex(sugarC);
  R.sugarMat = new THREE.MeshStandardMaterial({ map: R.sugarTex, roughness: 0.75, color: 0xffffff });
  // 팥: 짙은 자줏빛 앙금 + 덜 으깬 팥알
  const beanC = canvas(256, 256, (g, w, h) => { g.fillStyle = '#4a1a1c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 220; i++) { const x = rnd() * w, y = rnd() * h; g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '120,40,40' : '30,8,10') + ',.7)'; g.beginPath(); g.ellipse(x, y, 7, 5, rnd() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,200,190,.25)'; g.beginPath(); g.ellipse(x - 2, y - 2, 2.5, 1.5, 0, 0, 7); g.fill(); } });
  R.beanTex = tex(beanC);
  // 콘치즈: 모짜렐라 채 + 노란 옥수수알
  const cheeseC = canvas(256, 256, (g, w, h) => { g.fillStyle = '#f3e3a6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { g.strokeStyle = 'rgba(' + (rnd() > 0.5 ? '255,250,220' : '210,180,100') + ',.8)'; g.lineWidth = 3; g.beginPath(); const x = rnd() * w, y = rnd() * h, a = rnd() * 6; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); g.stroke(); } for (let i = 0; i < 90; i++) { const x = rnd() * w, y = rnd() * h; g.fillStyle = '#f2b81a'; g.beginPath(); g.ellipse(x, y, 6, 5, rnd() * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,220,.6)'; g.beginPath(); g.arc(x - 2, y - 2, 1.6, 0, 7); g.fill(); } });
  R.cheeseTex = tex(cheeseC);
  // 잡채: 당면 가닥 + 시금치 초록 + 당근 주황 + 양파
  const japC = canvas(256, 256, (g, w, h) => { g.fillStyle = '#8a6a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '200,170,120' : '150,115,70') + ',.75)'; g.lineWidth = 2; g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.bezierCurveTo(x + 20, y - 15, x + 30, y + 20, x + 60, y + 4); g.stroke(); } for (let i = 0; i < 70; i++) { g.fillStyle = ['#3c7a2a', '#e8762a', '#f0e8d0'][i % 3]; g.save(); g.translate(rnd() * w, rnd() * h); g.rotate(rnd() * 3); g.fillRect(-7, -2, 14, 4); g.restore(); } });
  R.japTex = tex(japC);
  R.fillMat = {
    sugar: R.sugarMat,
    bean: new THREE.MeshStandardMaterial({ map: R.beanTex, roughness: 0.4 }),
    cheese: new THREE.MeshStandardMaterial({ map: R.cheeseTex, roughness: 0.6 }),
    japchae: new THREE.MeshStandardMaterial({ map: R.japTex, roughness: 0.45 }),
  };
  R.cheeseMat = R.fillMat.cheese;
  // 칸 나뉜 네모 스테인리스 통(밧드). 칸마다 내용물 더미 + 아직 안 연 칸은 뚜껑
  const panWall = new THREE.MeshStandardMaterial({ map: steelMat.map, color: 0xe6e9ec, metalness: 0.88, roughness: 0.3, side: THREE.DoubleSide });
  R.lids = {};
  function pan(o, kind, matOf, fillOf) {
    const n = o.keys.length, W2 = o.cw * n, h = 0.06;
    const grp = new THREE.Group(); grp.position.set(o.x, 0, o.z); world.add(grp);
    const add = (w, hh, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m || panWall); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; grp.add(b); return b; };
    add(W2 + 0.012, 0.006, o.d + 0.012, 0, 0.003, 0);
    add(W2 + 0.012, h, 0.006, 0, h / 2, -o.d / 2); add(W2 + 0.012, h, 0.006, 0, h / 2, o.d / 2);
    add(0.006, h, o.d, -W2 / 2, h / 2, 0); add(0.006, h, o.d, W2 / 2, h / 2, 0);
    for (let i = 1; i < n; i++) add(0.004, h * 0.95, o.d, -W2 / 2 + i * o.cw, h * 0.475, 0);
    add(W2 + 0.02, 0.006, 0.012, 0, h, -o.d / 2, steelBright).castShadow = false;
    add(W2 + 0.02, 0.006, 0.012, 0, h, o.d / 2, steelBright).castShadow = false;
    o.keys.forEach((k, i) => {
      const x = -W2 / 2 + (i + 0.5) * o.cw;
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(o.cw * 0.94, o.d * 0.96), matOf(k)); bed.rotation.x = -PI / 2; bed.position.set(x, h * 0.7, 0); bed.receiveShadow = true; grp.add(bed);
      fillOf(k, x, h, grp);
      // 뚜껑
      const lid = new THREE.Group(); lid.position.set(x, h + 0.004, 0);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(o.cw * 0.98, 0.006, o.d * 0.98), steelBright); plate.castShadow = true; lid.add(plate);
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 12), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 })); knob.position.y = 0.009; lid.add(knob);
      grp.add(lid); R.lids[kind + ':' + k] = lid;
    });
    return grp;
  }
  R.doughPanG = pan(P.doughPan, 'dough', (k) => R.doughMats[k], (k, x, h, grp) => {
    for (let j = 0; j < 2; j++) { const g = new THREE.SphereGeometry(0.045, 20, 12, 0, PI * 2, 0, PI / 2); wob(g, 0.006); const m = new THREE.Mesh(g, R.doughMats[k]); m.scale.set(1, 0.55, 1.15); m.position.set(x + (j ? 0.012 : -0.01), h * 0.7, j ? 0.04 : -0.035); m.castShadow = true; grp.add(m); }
  });
  R.fillPanG = pan(P.fillPan, 'fill', (k) => R.fillMat[k], (k, x, h, grp) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 10, 0, PI * 2, 0, PI / 2), R.fillMat[k]); m.scale.set(0.95, 0.35, 1.6); m.position.set(x, h * 0.7, 0); m.castShadow = true; grp.add(m);
  });
  // 그날까지 연 칸만 뚜껑을 연다
  R.setLocks = function (day) {
    P.doughPan.keys.forEach((k) => (R.lids['dough:' + k].visible = !DATA.openDough(k, day)));
    P.fillPan.keys.forEach((k) => (R.lids['fill:' + k].visible = !DATA.openFill(k, day)));
    // 씨앗 통·국자는 씨앗호떡이 차림표에 열린 날부터
    const sd = DATA.isOpen('seed', day); R.seedsG.visible = sd; R.scoop.visible = sd;
  };
  // 숟가락(속 통 설탕 칸에 꽂혀 있음)
  R.spoonHome = function () { const c = R.cell('fill', 'sugar'); return new V3(c.x + 0.02, 0.09, c.z + 0.05); };
  function makeSpoon(bowlR, len) {
    const g = new THREE.Group();
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(bowlR * 0.3, 18, 10, 0, PI * 2, PI / 2, PI / 2), steelBright); bowl.scale.set(1, 0.45, 1.3); bowl.castShadow = true; g.add(bowl);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, len, 8), steelBright); h.rotation.x = PI / 2; h.position.z = len / 2 + bowlR * 0.3; h.castShadow = true; g.add(h);
    return g;
  }
  R.spoon = makeSpoon(0.07, 0.11); R.spoon.position.copy(R.spoonHome()); R.spoon.rotation.set(-0.9, 0.4, 0); world.add(R.spoon);
  // 씨앗 통: 해바라기씨·호박씨·땅콩이 섞인 무늬
  const seedC = canvas(512, 512, (g, w, h) => {
    g.fillStyle = '#6a5034'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1300; i++) {
      const x = rnd() * w, y = rnd() * h, a = rnd() * 6, k = rnd();
      g.save(); g.translate(x, y); g.rotate(a);
      if (k < 0.45) { g.fillStyle = '#d6c9a3'; g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,100,70,.6)'; g.lineWidth = 1; g.stroke(); }
      else if (k < 0.8) { g.fillStyle = '#5f7e38'; g.beginPath(); g.ellipse(0, 0, 10, 5.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(200,230,150,.35)'; g.beginPath(); g.ellipse(-2, -1.5, 5, 2, 0, 0, 7); g.fill(); }
      else { g.fillStyle = '#c99358'; g.beginPath(); g.ellipse(0, 0, 8, 6, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,70,30,.6)'; g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke(); }
      g.restore();
    }
  });
  R.seedTex = tex(seedC);
  const seedsG = (R.seedsG = tub(P.seeds.x, P.seeds.z, P.seeds.r, 0.085, 0xffffff, R.seedTex));
  { const m = new THREE.Mesh(new THREE.SphereGeometry(P.seeds.r * 0.93, 28, 10, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: R.seedTex, roughness: 0.6 })); m.scale.y = 0.35; m.position.y = 0.07; seedsG.add(m); }
  R.scoop = makeSpoon(0.11, 0.13); R.scoop.position.set(P.seeds.x - 0.03, 0.1, P.seeds.z + 0.04); R.scoop.rotation.set(-0.9, -0.5, 0); world.add(R.scoop);

  // 빚는 판·쟁반: 얕은 스테인리스 쟁반
  function trayM(o, col) {
    const g = new THREE.Group(); g.position.set(o.x, 0, o.z); world.add(g);
    const base = new THREE.Mesh(new THREE.BoxGeometry(o.w, 0.006, o.d), new THREE.MeshStandardMaterial({ map: steelMat.map, color: col, metalness: 0.75, roughness: 0.35 })); base.position.y = 0.004; base.receiveShadow = true; g.add(base);
    [[o.w, 0.018, 0.008, 0, -o.d / 2], [o.w, 0.018, 0.008, 0, o.d / 2], [0.008, 0.018, o.d, -o.w / 2, 0], [0.008, 0.018, o.d, o.w / 2, 0]].forEach(([w, h, d, x, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steelBright); m.position.set(x, 0.01, z); m.castShadow = true; g.add(m); });
    return g;
  }
  R.boardG = trayM(P.board, 0xf0f0ea);
  // 판에 바른 기름 번들(작은 반사 점)
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(P.board.w * 0.9, P.board.d * 0.85), new THREE.MeshStandardMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.3, depthWrite: false })); m.rotation.x = -PI / 2; m.position.y = 0.008; R.boardG.add(m); }
  R.trayG = trayM(P.tray, 0xe8e2d6);
  // 쟁반 위 기름종이
  { const pc = canvas(256, 256, (g, w, h) => { g.fillStyle = '#efe6cf'; g.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(190,140,60,' + rnd() * 0.18 + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 8 + rnd() * 30, 0, 7); g.fill(); } });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(P.tray.w * 0.86, P.tray.d * 0.84), new THREE.MeshStandardMaterial({ map: tex(pc), roughness: 0.85 })); m.rotation.x = -PI / 2; m.rotation.z = 0.06; m.position.y = 0.0085; m.receiveShadow = true; R.trayG.add(m); }

  // 기름병: 노란 짜는 병
  R.oilB = (function () {
    const g = new THREE.Group(); g.position.set(P.oil.x, 0, P.oil.z); world.add(g);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.038, 0.17, 24), new THREE.MeshPhysicalMaterial({ color: 0xf3c234, roughness: 0.35, transmission: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.2 })); body.position.y = 0.085; body.castShadow = true; g.add(body);
    const lab = canvas(256, 128, (c, w, h) => { c.fillStyle = '#2f8a3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff6cc'; c.font = '900 56px Ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L('식용유', 'OIL'), w / 2, h / 2 + 4); });
    const lm = new THREE.Mesh(new THREE.CylinderGeometry(0.0362, 0.0362, 0.06, 24, 1, true, -PI / 2.4, PI / 1.2), new THREE.MeshStandardMaterial({ map: tex(lab), roughness: 0.5 })); lm.position.y = 0.08; lm.rotation.y = PI * 0.15; g.add(lm); g.userData.label = lab;
    const capM = new THREE.MeshStandardMaterial({ color: 0x2f8a3a, roughness: 0.45 }); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, 0.04, 20), capM); cap.position.y = 0.19; g.add(cap);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.008, 0.035, 12), capM); tip.position.y = 0.225; g.add(tip);
    return g;
  })();

  // 누르개: 둥근 스테인리스 판 + 나무 손잡이
  R.press = (function () {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.008, 40), steelBright); plate.castShadow = true; g.add(plate);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.07, 12), steelBright); neck.position.y = 0.04; neck.castShadow = true; g.add(neck);
    const woodC = canvas(128, 64, (c, w, h) => { c.fillStyle = '#7a4a24'; c.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { c.strokeStyle = 'rgba(' + (rnd() > 0.5 ? '160,100,50' : '50,25,10') + ',.5)'; c.beginPath(); const y = rnd() * h; c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y); c.stroke(); } });
    R.woodMat = new THREE.MeshStandardMaterial({ map: tex(woodC), roughness: 0.6 });
    const knob = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.08, 6, 16), R.woodMat); knob.rotation.z = PI / 2; knob.position.y = 0.085; knob.castShadow = true; g.add(knob);
    g.position.set(P.press.x, 0.005, P.press.z); world.add(g);
    return g;
  })();
  R.pressHome = new V3(P.press.x, 0.005, P.press.z);
  // 뒤집개
  R.spat = (function () {
    const g = new THREE.Group();
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.003, 0.12), steelBright); blade.position.z = -0.06; blade.castShadow = true; g.add(blade);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.08), steelBright); neck.position.set(0, 0.015, 0.03); neck.rotation.x = -0.35; g.add(neck);
    const h = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.11, 6, 12), R.woodMat); h.rotation.x = PI / 2 - 0.25; h.position.set(0, 0.04, 0.13); h.castShadow = true; g.add(h);
    g.visible = false; world.add(g); return g;
  })();
  // 가위
  R.scis = (function () {
    const g = new THREE.Group();
    const bm = steelBright, hm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
    const a = new THREE.Group(), b = new THREE.Group();
    [a, b].forEach((s, i) => {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.09), bm); bl.position.z = -0.045; bl.castShadow = true; s.add(bl);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 8, 20), hm); ring.rotation.x = PI / 2; ring.position.set(i ? 0.014 : -0.014, 0, 0.03); s.add(ring);
      g.add(s);
    });
    g.userData.a = a; g.userData.b = b; g.visible = false; world.add(g); return g;
  })();

  // 종이컵 무늬: 흰 종이 + 빨간 줄무늬
  const cupC = canvas(512, 128, (g, w, h) => { g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8261e'; for (let x = 0; x < w; x += 64) { g.fillRect(x, 0, 18, h); } g.fillStyle = '#f2c53a'; g.fillRect(0, h - 16, w, 8); });
  R.cupMat = new THREE.MeshStandardMaterial({ map: tex(cupC), roughness: 0.7, side: THREE.DoubleSide });
  R.makeCup = function () { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.042, 0.1, 28, 1, true), R.cupMat); m.castShadow = true; const g = new THREE.Group(); m.position.y = 0.05; g.add(m); const bot = new THREE.Mesh(new THREE.CircleGeometry(0.042, 24), R.cupMat); bot.rotation.x = -PI / 2; bot.position.y = 0.002; g.add(bot); return g; };
  // 쌓인 종이컵
  { const st = new THREE.Group(); st.position.set(P.cups.x, 0, P.cups.z); for (let i = 0; i < 6; i++) { const c = R.makeCup(); c.position.y = i * 0.018; st.add(c); } world.add(st); }

  // 버리는 통: 파란 봉지 테 두른 은색 통(까만 그릇으로 그리지 않는다)
  R.binG = (function () {
    const g = new THREE.Group(); g.position.set(P.bin.x, 0, P.bin.z); world.add(g);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(P.bin.r, P.bin.r * 0.85, 0.09, 28, 1, true), new THREE.MeshStandardMaterial({ map: steelMat.map, color: 0xd8dde2, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide })); wall.position.y = 0.045; wall.castShadow = true; g.add(wall);
    const bag = new THREE.Mesh(new THREE.TorusGeometry(P.bin.r, 0.009, 8, 28), new THREE.MeshStandardMaterial({ color: 0x3a7ad8, roughness: 0.4 })); bag.rotation.x = PI / 2; bag.position.y = 0.09; g.add(bag);
    const inside = new THREE.Mesh(new THREE.CircleGeometry(P.bin.r * 0.95, 24), new THREE.MeshStandardMaterial({ color: 0x5a8ee0, roughness: 0.5 })); inside.rotation.x = -PI / 2; inside.position.y = 0.093; g.add(inside);
    return g;
  })();

  // ---------- 뒤: 손님 쪽 바닥·거리 ----------
  const groundC = canvas(512, 512, (g, w, h) => { g.fillStyle = '#1c1a1c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = 'rgba(' + (rnd() > 0.5 ? '90,90,100' : '0,0,0') + ',' + rnd() * 0.3 + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); } g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); g.beginPath(); g.moveTo(i * 128 + (i % 2) * 64, 0); g.lineTo(i * 128 + (i % 2) * 64, h); g.stroke(); } });
  const glowC = canvas(512, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(10px)'; for (let i = 0; i < 46; i++) { const x = rnd() * w, y = rnd() * h * 0.75, c = ['255,170,90', '255,90,80', '90,190,255', '255,220,160'][i % 4], r = 4 + rnd() * 10; const gr = g.createLinearGradient(x, y, x, y + 160); gr.addColorStop(0, 'rgba(' + c + ',.55)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(x - r / 2, y, r, 160); }
    const rg = g.createRadialGradient(w / 2, h, 0, w / 2, h, w * 0.6); rg.addColorStop(0, 'rgba(255,170,90,.55)'); rg.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), new THREE.MeshStandardMaterial({ map: tex(groundC, [10, 8]), emissiveMap: tex(glowC), emissive: 0xffffff, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.2, color: 0x9a9aa8 }));
  ground.rotation.x = -PI / 2; ground.position.set(0, -0.9, -4); ground.receiveShadow = true; scene.add(ground);
  // 밤거리 뒷그림: 간판·창문 불빛이 흐리게 번진 건물들
  const streetC = (R.streetC = canvas(2048, 900, () => {}));
  const streetMat = new THREE.MeshBasicMaterial({ map: tex(streetC), fog: false });
  const street = new THREE.Mesh(new THREE.PlaneGeometry(11, 4.84), streetMat); street.position.set(0, 1.25, -5.2); scene.add(street);
  R.drawStreet = function () {
    const g = streetC.getContext('2d'), w = 2048, h = 900; seed = 99;
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#0a0c1c'); sky.addColorStop(0.55, '#1d1a2c'); sky.addColorStop(1, '#2a1c18'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    const signs = EN ? ['GUKBAP', 'PHARMACY', 'KARAOKE', 'CAFE', 'FISH', 'HOTEL', 'BIFF', 'BBQ', 'NAMPO', 'SNACK', 'CINEMA'] : ['국밥', '약국', '노래방', '다방', '횟집', '호텔', 'BIFF', '갈비', '남포동', '분식', '극장'];
    const cols = ['#ff4a5a', '#3ae0ff', '#ffd23a', '#ff7af0', '#7aff8a', '#ffffff', '#ff8a2a'];
    // 건물
    let x = -40;
    while (x < w) {
      const bw = 160 + rnd() * 220, bh = 380 + rnd() * 420, top = h - bh;
      g.fillStyle = 'hsl(' + (220 + rnd() * 40) + ',18%,' + (9 + rnd() * 7) + '%)'; g.fillRect(x, top, bw, bh);
      for (let yy = top + 20; yy < h - 140; yy += 38) for (let xx = x + 14; xx < x + bw - 20; xx += 34) { if (rnd() < 0.45) { g.fillStyle = rnd() < 0.6 ? 'rgba(255,214,150,' + (0.45 + rnd() * 0.5) + ')' : 'rgba(170,210,255,' + (0.3 + rnd() * 0.4) + ')'; g.fillRect(xx, yy, 20, 24); } }
      // 세로 간판
      if (rnd() < 0.75) { const sx = x + bw * (0.2 + rnd() * 0.5), sy = top + 40 + rnd() * 120, s = signs[Math.floor(rnd() * signs.length)], c = cols[Math.floor(rnd() * cols.length)];
        const vert = rnd() < 0.5 && !EN; g.save(); g.shadowColor = c; g.shadowBlur = 30; g.fillStyle = '#111'; const sw = vert ? 70 : 60 + s.length * 52, sh = vert ? 70 * s.length + 20 : 80; g.fillRect(sx - 6, sy - 6, sw + 12, sh + 12); g.strokeStyle = c; g.lineWidth = 6; g.strokeRect(sx, sy, sw, sh); g.fillStyle = c; g.font = '900 54px Ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          if (vert) [...s].forEach((ch, i) => g.fillText(ch, sx + sw / 2, sy + 45 + i * 70)); else g.fillText(s, sx + sw / 2, sy + sh / 2 + 3); g.restore(); }
      x += bw + 6;
    }
    // 길가 노점 불빛·사람 그림자
    for (let i = 0; i < 40; i++) { const bx = rnd() * w, by = h - 120 - rnd() * 60, r = 20 + rnd() * 60; const rg = g.createRadialGradient(bx, by, 0, bx, by, r); const c = ['255,190,110', '255,120,80', '255,230,180'][i % 3]; rg.addColorStop(0, 'rgba(' + c + ',.85)'); rg.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = rg; g.fillRect(bx - r, by - r, r * 2, r * 2); }
    g.fillStyle = 'rgba(8,8,12,.85)'; for (let i = 0; i < 26; i++) { const px = rnd() * w, ph = 120 + rnd() * 60; g.beginPath(); g.ellipse(px, h - ph * 0.62, 16, 20, 0, 0, 7); g.fill(); g.beginPath(); g.roundRect ? g.roundRect(px - 26, h - ph * 0.5, 52, ph * 0.5 + 10, 18) : g.rect(px - 26, h - ph * 0.5, 52, ph * 0.5); g.fill(); }
    // 멀리 있으니 흐리게: 한 번 흐린 그림을 다시 얹기
    const t = document.createElement('canvas'); t.width = w; t.height = h; const tg = t.getContext('2d'); tg.filter = 'blur(7px)'; tg.drawImage(streetC, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(t, 0, 0);
    // 보케(둥글게 번진 불빛)
    for (let i = 0; i < 60; i++) { const bx = rnd() * w, by = h * (0.35 + rnd() * 0.6), r = 10 + rnd() * 34; const c = ['255,200,120', '255,90,90', '120,220,255', '255,240,200'][i % 4]; g.fillStyle = 'rgba(' + c + ',' + (0.12 + rnd() * 0.2) + ')'; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(' + c + ',' + (0.05 + rnd() * 0.08) + ')'; g.lineWidth = 2; g.stroke(); }
    streetMat.map.needsUpdate = true;
  };

  // ---------- 천막·기둥·전구 ----------
  const tarpC = canvas(512, 256, (g, w, h) => { for (let x = 0; x < w; x += 64) { g.fillStyle = (x / 64) % 2 ? '#f08a2a' : '#e8622a'; g.fillRect(x, 0, 64, h); } for (let i = 0; i < 200; i++) { g.fillStyle = 'rgba(0,0,0,' + rnd() * 0.08 + ')'; g.fillRect(rnd() * w, rnd() * h, 3, 3); } const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const tarpMat = new THREE.MeshStandardMaterial({ map: tex(tarpC, [3, 1]), roughness: 0.8, side: THREE.DoubleSide });
  const tarp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6, 12, 4), tarpMat); tarp.rotation.x = PI / 2 - 0.25; tarp.position.set(0, 1.45, -0.1); scene.add(tarp);
  // 천막 앞 처마(늘어진 물결 띠)
  const flapG = new THREE.PlaneGeometry(2.4, 0.16, 24, 1); { const p = flapG.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) < 0) p.setY(i, p.getY(i) - Math.abs(Math.sin(p.getX(i) * 6.5)) * 0.04); } }
  const flap = new THREE.Mesh(flapG, tarpMat); flap.position.set(0, 1.27, -0.86); scene.add(flap);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x6c7076, metalness: 0.8, roughness: 0.4 });
  [[-0.95, -0.7], [0.95, -0.7], [-0.95, 0.75], [0.95, 0.75]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.4, 12), poleMat); m.position.set(x, 0.3, z); m.castShadow = true; scene.add(m); });
  // 전구 줄
  R.bulbs = [];
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffb050, emissiveIntensity: 2.4, roughness: 0.3 });
  for (let i = 0; i < 7; i++) { const x = -0.84 + i * 0.28, y = 1.12 - Math.sin((i / 6) * PI) * 0.05; const b = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), bulbMat); b.position.set(x, y, -0.78); scene.add(b); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.05, 6), poleMat); w.position.set(x, y + 0.035, -0.78); scene.add(w); R.bulbs.push(b);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: R.glowTex || (R.glowTex = glowTexture()), color: 0xffb860, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(0.2, 0.2, 1); glow.position.copy(b.position); scene.add(glow); }
  function glowTexture() { const c = canvas(64, 64, (g) => { const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,.4)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); }); return new THREE.CanvasTexture(c); }

  // 골판지 차림표(왼쪽 기둥에 매단 것)
  const menuC = (R.menuC = canvas(512, 640, () => {}));
  const menuMat = new THREE.MeshStandardMaterial({ map: tex(menuC), roughness: 0.9 });
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.525), menuMat); menu.position.set(-0.98, 0.6, -0.55); menu.rotation.y = 0.35; scene.add(menu);
  R.drawMenu = function (day) {
    const g = menuC.getContext('2d'), w = 512, h = 640; seed = 5;
    g.fillStyle = '#b98b55'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 9) { g.fillStyle = 'rgba(90,60,30,' + (0.1 + rnd() * 0.06) + ')'; g.fillRect(0, y, w, 3); }
    g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#1a1410'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 64px Ttl, sans-serif'; g.fillText(L('차림표', 'MENU'), w / 2, 76);
    const keys = DATA.KIND_KEYS;
    keys.forEach((k, i) => { const K = DATA.KIND[k], y = 140 + i * 48; g.globalAlpha = DATA.isOpen(k, day) ? 1 : 0.25; g.font = '900 36px Ui, sans-serif'; g.textAlign = 'left'; g.fillStyle = '#1a1410'; g.fillText(L(K.ko, K.en), 34, y); g.textAlign = 'right'; g.fillStyle = '#c8261e'; g.fillText(K.price.toLocaleString(), w - 30, y); g.globalAlpha = 1; });
    g.strokeStyle = '#c8261e'; g.lineWidth = 6; g.beginPath(); g.ellipse(w / 2, 600, 150, 26, -0.03, 0, 7); g.stroke();
    g.font = '900 34px Ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#c8261e'; g.fillText(L('부산 명물', 'Busan Classic'), w / 2, 602);
    menuMat.map.needsUpdate = true;
  };
  // 오른쪽: 쌓인 씨앗 봉지·냅킨통(장식)
  { const bag = canvas(256, 320, (g, w, h) => { g.fillStyle = '#e9e2cf'; g.fillRect(0, 0, w, h); g.fillStyle = '#3d7a3c'; g.fillRect(0, 60, w, 120); g.fillStyle = '#fff'; g.font = '900 54px Ui, sans-serif'; g.textAlign = 'center'; g.fillText(L('해바라기씨', 'SEEDS'), w / 2, 136); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(0, 0, w, 14); });
    const bm = new THREE.MeshStandardMaterial({ map: tex(bag), roughness: 0.75 });
    [[1.02, -0.45, 0.3], [1.1, -0.15, -0.2]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.07), bm); m.position.set(x, 0.11, z); m.rotation.y = r; m.castShadow = true; scene.add(m); });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.9), steelMat); shelf.position.set(1.06, -0.015, -0.2); shelf.receiveShadow = true; scene.add(shelf);
    const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.9), steelMat); shelf2.position.set(-1.06, -0.015, -0.2); shelf2.receiveShadow = true; scene.add(shelf2);
    // 왼쪽 선반: 반죽 그릇에 덮은 비닐, 보온 통
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.2, 28), new THREE.MeshStandardMaterial({ map: steelMat.map, color: 0xe6e9ec, metalness: 0.85, roughness: 0.3 })); pot.position.set(-1.08, 0.1, -0.35); pot.castShadow = true; scene.add(pot);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.012, 28), steelBright); lid.position.set(-1.08, 0.205, -0.35); scene.add(lid);
  }

  // ---------- 알갱이(김·기름 거품·설탕 가루·연기) ----------
  const PN = 900;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSize = new Float32Array(PN), pAlpha = new Float32Array(PN), pSoft = new Float32Array(PN);
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSize, 1)); pGeo.setAttribute('alpha', new THREE.BufferAttribute(pAlpha, 1)); pGeo.setAttribute('soft', new THREE.BufferAttribute(pSoft, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { scale: { value: 600 } },
    vertexShader: 'attribute float size; attribute float alpha; attribute float soft; attribute vec3 color; varying vec3 vC; varying float vA; varying float vS; uniform float scale; void main(){ vC=color; vA=alpha; vS=soft; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*scale/-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vC; varying float vA; varying float vS; void main(){ vec2 d=gl_PointCoord-.5; float r=length(d)*2.0; if(r>1.0) discard; float a=mix(1.0-smoothstep(.7,1.0,r), 1.0-r*r, vS); gl_FragColor=vec4(vC, a*vA); }',
  });
  const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; pts.renderOrder = 5; scene.add(pts);
  const parts = []; for (let i = 0; i < PN; i++) parts.push({ life: 0 });
  let pNext = 0;
  // kind: steam·smoke·bubble·sugar·oil·spark
  R.emit = function (kind, x, y, z, n) {
    for (let k = 0; k < (n || 1); k++) {
      const p = parts[pNext]; pNext = (pNext + 1) % PN;
      p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = 0; p.vy = 0; p.vz = 0; p.g = 0; p.drag = 1;
      if (kind === 'steam') { p.x += (Math.random() - 0.5) * 0.08; p.z += (Math.random() - 0.5) * 0.08; p.vy = 0.12 + Math.random() * 0.1; p.vx = (Math.random() - 0.5) * 0.03; p.life = p.max = 1.4 + Math.random(); p.s0 = 0.03; p.s1 = 0.12; p.a = 0.09; p.c = [0.95, 0.93, 0.9]; p.soft = 1; }
      else if (kind === 'smoke') { p.x += (Math.random() - 0.5) * 0.06; p.z += (Math.random() - 0.5) * 0.06; p.vy = 0.1 + Math.random() * 0.08; p.life = p.max = 1.8 + Math.random(); p.s0 = 0.05; p.s1 = 0.22; p.a = 0.35; p.c = [0.22, 0.2, 0.2]; p.soft = 1; }
      else if (kind === 'bubble') { const a = Math.random() * 6.28, r = 0.07 + Math.random() * 0.05; p.x += Math.cos(a) * r; p.z += Math.sin(a) * r; p.life = p.max = 0.2 + Math.random() * 0.35; p.s0 = 0.006 + Math.random() * 0.008; p.s1 = p.s0 * 1.4; p.a = 0.85; p.c = [1, 0.95, 0.75]; p.soft = 0; }
      else if (kind === 'oil') { p.vx = (Math.random() - 0.5) * 0.4; p.vz = (Math.random() - 0.5) * 0.4; p.vy = 0.3 + Math.random() * 0.4; p.g = 3; p.life = p.max = 0.35; p.s0 = p.s1 = 0.006; p.a = 0.9; p.c = [1, 0.85, 0.4]; p.soft = 0; }
      else if (kind === 'sugar') { p.x += (Math.random() - 0.5) * 0.02; p.z += (Math.random() - 0.5) * 0.02; p.vy = -0.1; p.g = 2.5; p.life = p.max = 0.35 + Math.random() * 0.1; p.s0 = p.s1 = 0.006; p.a = 1; p.c = Math.random() < 0.5 ? [0.35, 0.18, 0.07] : [0.55, 0.32, 0.14]; p.soft = 0; p.floor = y - 0.07; }
      else if (kind === 'flour') { p.vx = (Math.random() - 0.5) * 0.3; p.vz = (Math.random() - 0.5) * 0.3; p.vy = 0.15 + Math.random() * 0.2; p.g = 0.8; p.drag = 0.9; p.life = p.max = 0.6; p.s0 = 0.01; p.s1 = 0.03; p.a = 0.5; p.c = [1, 0.97, 0.9]; p.soft = 1; }
      else if (kind === 'spark') { const a = Math.random() * 6.28, v = 0.4 + Math.random() * 0.6; p.vx = Math.cos(a) * v; p.vz = Math.sin(a) * v; p.vy = 0.5 + Math.random() * 0.6; p.g = 2.2; p.life = p.max = 0.7; p.s0 = 0.02; p.s1 = 0.006; p.a = 1; p.c = [1, 0.8, 0.35]; p.soft = 0; }
    }
  };
  function updParts(dt) {
    for (let i = 0; i < PN; i++) {
      const p = parts[i];
      if (p.life <= 0) { pAlpha[i] = 0; continue; }
      p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.floor !== undefined && p.y < p.floor) { p.y = p.floor; p.vy = 0; p.vx = p.vz = 0; }
      const k = 1 - p.life / p.max;
      pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z;
      pCol[i * 3] = p.c[0]; pCol[i * 3 + 1] = p.c[1]; pCol[i * 3 + 2] = p.c[2];
      pSize[i] = p.s0 + (p.s1 - p.s0) * k; pSoft[i] = p.soft;
      pAlpha[i] = p.a * (p.kind === 'steam' || p.kind === 'smoke' ? Math.sin(k * PI) : 1 - k * k);
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; pGeo.attributes.size.needsUpdate = true; pGeo.attributes.alpha.needsUpdate = true; pGeo.attributes.soft.needsUpdate = true;
  }

  // ---------- 눈: 천천히 흔들리며 내리는 눈송이(천막 밖은 많이, 천막 아래는 바람에 들이친 몇 송이) ----------
  const SN = 700;
  const sGeo = new THREE.BufferGeometry(), sPos = new Float32Array(SN * 3), sSize = new Float32Array(SN), sA = new Float32Array(SN), sPh = new Float32Array(SN), sV = new Float32Array(SN);
  function snowAt(i, top) {
    // 대부분은 노점 너머 거리에, 일부는 조리대 위로
    const near = Math.random() < 0.1;
    sPos[i * 3] = (Math.random() - 0.5) * (near ? 1.6 : 6);
    sPos[i * 3 + 1] = top ? (near ? 1.1 + Math.random() * 0.2 : 1.6 + Math.random() * 0.8) : -0.9 + Math.random() * (near ? 2.0 : 3.2);
    sPos[i * 3 + 2] = near ? -0.75 + Math.random() * 0.55 : -5 + Math.random() * 4.2;
    sSize[i] = near ? 0.006 + Math.random() * 0.006 : 0.02 + Math.random() * 0.018; sA[i] = 0.55 + Math.random() * 0.4; sPh[i] = Math.random() * 6.28; sV[i] = 0.16 + Math.random() * 0.14;
  }
  for (let i = 0; i < SN; i++) snowAt(i, false);
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('size', new THREE.BufferAttribute(sSize, 1)); sGeo.setAttribute('alpha', new THREE.BufferAttribute(sA, 1));
  const sMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { scale: pMat.uniforms.scale },
    vertexShader: 'attribute float size; attribute float alpha; varying float vA; uniform float scale; void main(){ vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=max(1.5,size*scale/-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying float vA; void main(){ vec2 d=gl_PointCoord-.5; float r=length(d)*2.0; if(r>1.0) discard; gl_FragColor=vec4(0.96,0.97,1.0,(1.0-r*r)*vA); }',
  });
  const snowPts = (R.snow = new THREE.Points(sGeo, sMat)); snowPts.frustumCulled = false; snowPts.renderOrder = 6; scene.add(snowPts);
  let snowT = 0, snowN = 0;
  // 눈 양: 0~1. 목표까지 천천히(약 40초에 가득) 늘어난다. 새로 끼는 눈송이는 맨 위에서 시작
  R.snowLevel = 0; R.snowTarget = 0;
  R.setSnow = function (target, now) { R.snowTarget = target; if (now) R.snowLevel = target; };
  sGeo.setDrawRange(0, 0);
  function updSnow(dt) {
    snowT += dt;
    R.snowLevel += Math.max(-dt * 0.5, Math.min(dt * 0.025, R.snowTarget - R.snowLevel));
    const n = Math.floor(SN * R.snowLevel);
    if (n > snowN) for (let i = snowN; i < n; i++) snowAt(i, true);
    snowN = n; sGeo.setDrawRange(0, n);
    if (!n) return;
    for (let i = 0; i < n; i++) {
      sPos[i * 3 + 1] -= sV[i] * dt;
      sPos[i * 3] += Math.sin(snowT * 0.8 + sPh[i]) * 0.05 * dt + 0.02 * dt;
      sPos[i * 3 + 2] += Math.cos(snowT * 0.6 + sPh[i]) * 0.03 * dt;
      const y = sPos[i * 3 + 1], z = sPos[i * 3 + 2];
      // 조리대·철판에 닿으면 녹아 사라짐, 땅에 닿으면 다시 위에서
      if (y < -0.9 || (y < 0.05 && z > -0.6 && Math.abs(sPos[i * 3]) < 0.85)) snowAt(i, true);
    }
    sGeo.attributes.position.needsUpdate = true;
  }

  // ---------- 카메라 맞추기 ----------
  // 화면 비율마다 조리대 전체 + 손님 얼굴이 다 들어오는 가장 작은 시야각을 찾는다
  const KEYS = [[-0.54, 0, 0.64], [0.54, 0, 0.64], [-0.54, 0, -0.5], [0.54, 0, -0.5], [-0.6, 0.7, R.CUST_Z], [0.6, 0.7, R.CUST_Z]].map((a) => new V3(...a));
  R.camBase = { pos: new V3(0, 1.08, 0.98), look: new V3(0, 0.08, -0.2) };
  R.view = { pos: new V3(), look: new V3(), fov: 50 };
  R.fit = function () {
    const w = innerWidth || 1, h = innerHeight || 1;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    const portrait = h > w;
    // 세로 화면은 조금 더 위에서 내려다봄(엄지 닿는 아래쪽에 조리대)
    const pos = portrait ? new V3(0, 1.5, 0.98) : new V3(0, 1.08, 1.1);
    const look = portrait ? new V3(0, 0.0, -0.05) : new V3(0, 0.12, -0.18);
    cam.position.copy(pos); cam.lookAt(look);
    let lo = 15, hi = 100;
    for (let i = 0; i < 22; i++) {
      const f = (lo + hi) / 2; cam.fov = f; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      let ok = true; for (const k of KEYS) { const v = k.clone().project(cam); if (Math.abs(v.x) > 0.97 || v.y > 0.9 || v.y < -0.97) { ok = false; break; } }
      if (ok) hi = f; else lo = f;
    }
    cam.fov = hi; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    // 남는 세로 공간은 위(거리·손님)로: 맨 아래 열쇠점이 화면 아래 끝에 오게 민다
    let minY = 9; for (const k of KEYS) minY = Math.min(minY, k.clone().project(cam).y);
    R.shiftY = Math.max(0, minY + 0.96); cam.projectionMatrix.elements[9] += R.shiftY; cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    R.view.pos.copy(pos); R.view.look.copy(look); R.view.fov = hi;
    pMat.uniforms.scale.value = h * 0.5 / Math.tan((hi * PI) / 360) * Math.min(devicePixelRatio || 1, 1.5);
  };
  addEventListener('resize', R.fit);

  // 카드·표지용: 가로 카메라로 한 장 따로 찍기(끝나면 화면 맞춤 되돌림)
  R.snap = function (w, h, pos, look, fov) {
    renderer.setSize(w, h, false); renderer.setPixelRatio(1);
    cam.aspect = w / h; cam.fov = fov; cam.position.copy(pos); cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    renderer.render(scene, cam);
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(renderer.domElement, 0, 0, w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); R.fit(); renderer.render(scene, cam);
    return c;
  };

  // 화면 좌표 → 조리대 높이 y 의 평면 위 점
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new V3(0, 1, 0), 0);
  R.pick = function (sx, sy, y) {
    ndc.set((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam);
    plane.constant = -(y || 0); const out = new V3(); return ray.ray.intersectPlane(plane, out) ? out : null;
  };
  R.ray = function (sx, sy) { ndc.set((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); return ray; };
  R.toScreen = function (v) { const p = v.clone().project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight, p.z]; };

  // ---------- 그리기 ----------
  let last = performance.now();
  R.hooks = [];
  R.tick = function (dt) {
    for (const f of R.hooks) f(dt);
    updParts(dt); updSnow(dt);
    if (!R.noRender) renderer.render(scene, cam);
  };
  R.loop = function () {
    const now = performance.now(); const dt = Math.min(0.05, (now - last) / 1000); last = now;
    R.tick(dt);
    requestAnimationFrame(R.loop);
  };
  R.boot = function () {
    R.fit(); R.drawStreet(); R.drawMenu(1); R.drawFrontSign();
    renderer.compile(scene, cam);
    requestAnimationFrame(R.loop);
  };
  R.redrawText = function (day) { R.drawStreet(); R.drawMenu(day); R.drawFrontSign(); };
})();
