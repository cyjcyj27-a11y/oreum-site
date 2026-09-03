// 풍경 — 하늘, 햇빛, 석주들, 구름바다, 새, 정상의 집
(function () {
  const T = TERRAIN;
  const rng = NOISE.makeRng(31337);
  const N = NOISE.makeNoise(777);
  const S = { sun: null, hemi: null, sky: null, clouds: [], sea: [], birds: [], smoke: [], lantern: null, lanternLight: null, house: null, fog: null, pillars: [], huts: [], stations: [], night: 0, shop: null, buildings: [] };
  const smooth = T.smooth;

  // ── 하늘 돔 ───────────────────────────────────────
  function makeSky() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color(0.30, 0.45, 0.68) },
        horizon: { value: new THREE.Color(0.86, 0.78, 0.66) },
        sunDir: { value: new THREE.Vector3(0.55, 0.42, 0.62).normalize() },
        sunColor: { value: new THREE.Color(1.0, 0.86, 0.62) },
        haze: { value: 0.0 },
      },
      vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz - cameraPosition; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top, horizon, sunDir, sunColor; uniform float haze; varying vec3 vW; void main(){ vec3 d = normalize(vW); float h = d.y; vec3 c = mix(horizon, top, smoothstep(-0.02, 0.55, h)); float s = max(0.0, dot(d, sunDir)); c += sunColor * (pow(s, 300.0) * 1.6 + pow(s, 12.0) * 0.28 + pow(s, 3.0) * 0.07); c = mix(c, horizon, haze * smoothstep(0.5, -0.3, h)); gl_FragColor = vec4(c, 1.0); }',
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), mat);
    m.renderOrder = -10; m.frustumCulled = false;
    return m;
  }

  // ── 구름 텍스처 ───────────────────────────────────
  function puffTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const dx = (x - 128) / 128, dy = (y - 128) / 128;
      const r = Math.sqrt(dx * dx + dy * dy);
      const n = 0.5 + 0.5 * N.fbm3(x * 0.03, y * 0.03, 1.7, 3, 2.2, 0.55);
      let a = smooth(1.0, 0.25, r) * smooth(0.25, 0.75, n + (1 - r) * 0.35);
      const i = (y * 256 + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 250; img.data[i + 2] = 245; img.data[i + 3] = Math.min(255, a * 255);
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function seaTexture() {
    const W = 256;
    const c = document.createElement('canvas'); c.width = c.height = W;
    const g = c.getContext('2d');
    const img = g.createImageData(W, W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      // 이어지는 노이즈 (토러스 매핑)
      const a1 = x / W * Math.PI * 2, a2 = y / W * Math.PI * 2;
      const n = 0.5 + 0.5 * N.fbm3(Math.cos(a1) * 2.2, Math.sin(a1) * 2.2 + Math.cos(a2) * 2.2, Math.sin(a2) * 2.2, 4, 2.1, 0.5);
      const a = smooth(0.32, 0.72, n);
      const i = (y * W + x) * 4;
      const sh = 235 + 20 * n;
      img.data[i] = sh; img.data[i + 1] = sh; img.data[i + 2] = sh + 5; img.data[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  const CLOUD_Y = 118;
  // 하늘·빛만 — 첫 프레임을 바로 그릴 수 있게 가볍다
  function initSky(scene) {
    if (S.sky) return;
    S.sky = makeSky(); scene.add(S.sky);
    S.fog = new THREE.FogExp2(0xb9bec4, 0.012); scene.fog = S.fog;
    S.hemi = new THREE.HemisphereLight(0xc6d8f0, 0x5a5445, 1.05); scene.add(S.hemi);
    S.sun = new THREE.DirectionalLight(0xffe2b8, 3.0);
    S.sun.position.set(0.55, 0.42, 0.62).multiplyScalar(60);
    S.sun.castShadow = true;
    S.sun.shadow.mapSize.set(2048, 2048);
    const sc = S.sun.shadow.camera; sc.left = sc.bottom = -16; sc.right = sc.top = 16; sc.near = 1; sc.far = 160;
    S.sun.shadow.bias = -0.0006; S.sun.shadow.normalBias = 0.04;
    scene.add(S.sun); scene.add(S.sun.target);
  }
  function init(scene) {
    initSky(scene);
    // 본 기둥
    const pg = T.buildPillar();
    const pillar = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0.0 }));
    pillar.castShadow = true; pillar.receiveShadow = true; scene.add(pillar);

    // 먼 석주들 — 1) 자리부터 정하고 2) 주유소는 북쪽 끝·남쪽 끝, 집은 나머지에서
    const dmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
    const placed = [], specs = [];
    // 주유소 기둥 넷: 동서남북 같은 거리에 먼저 세운다 (화면 왼쪽이 +x = 서쪽)
    const ST = [[TX('북쪽 주유소', 'North Gas'), 0, 135, 150], [TX('동쪽 주유소', 'East Gas'), -135, 0, 125], [TX('남쪽 주유소', 'South Gas'), 0, -135, 165], [TX('서쪽 주유소', 'West Gas'), 135, 0, 135]];
    ST.forEach(([name, x, z, h], i) => {
      const sp = { i, x, z, dist: Math.hypot(x, z), rad: 9, h, flat: true, station: true, hut: false, yaw: Math.atan2(-x, -z) + Math.PI, sc: 1, stName: name };
      placed.push({ x, z, r: 9 }); specs.push(sp);
    });
    for (let i = 4; i < 46; i++) {
      let ang, dist, rad, ok = false, tries = 0;
      while (!ok && tries++ < 30) {
        ang = rng() * Math.PI * 2; dist = 24 + Math.pow(rng(), 1.4) * 270; rad = 3 + rng() * 8;
        ok = dist > rad + 14;
        for (const p of placed) { const d = Math.hypot(Math.cos(ang) * dist - p.x, Math.sin(ang) * dist - p.z); if (d < rad + p.r + 6) { ok = false; break; } }
      }
      if (!ok) continue;
      const h = 30 + rng() * 240 * (0.4 + 0.6 * Math.min(1, dist / 120));
      const sp = { i, x: Math.cos(ang) * dist, z: Math.sin(ang) * dist, dist, rad, h, flat: false, station: false, hut: false, yaw: rng() * Math.PI * 2, sc: 0.8 + rng() * 0.25 };
      placed.push({ x: sp.x, z: sp.z, r: rad }); specs.push(sp);
    }
    // 집 11채: 서로·주유소·식당에서 가장 먼 빈 자리부터 채운다 (몰리지 않게)
    { const taken = [{ x: 0, z: 0 }, ...specs.filter(p => p.station)];
      let cand = specs.filter(p => !p.station && p.dist > 36 && p.dist < 228 && p.rad > 5);
      for (let n = 0; n < 10 && cand.length; n++) {   // 집은 열 채 (주민 열 명)
        const gap = p => Math.min(...taken.map(q => Math.hypot(q.x - p.x, q.z - p.z)));
        const best = cand.reduce((m, p) => gap(p) > gap(m) ? p : m);
        if (gap(best) < 48) break;   // 더 넣으면 몰린다
        best.hut = best.flat = true; taken.push(best); cand = cand.filter(p => p !== best);
      } }
    for (const p of specs) {
      const g = T.buildDistantPillar(1000 + p.i * 17, p.h, p.rad, T.BASE, p.flat);
      const m = new THREE.Mesh(g, dmat); m.position.set(p.x, 0, p.z); m.receiveShadow = false; scene.add(m);
      S.pillars.push({ x: p.x, z: p.z, r: p.rad * 1.35, h: p.h, flat: p.flat });
      if (p.station) { const spos = makeStation(scene, p.x, p.h, p.z, p.yaw); S.stations.push({ pos: spos, name: p.stName }); }
      else if (p.hut) { const hut = makeHut(scene, p.x, p.h, p.z, p.yaw, p.sc, p.i); S.huts.push({ pos: hut.userData.yard.clone(), group: hut }); }
    }
    // 아주 먼 산덩이
    for (let i = 0; i < 10; i++) {
      const ang = rng() * Math.PI * 2, dist = 380 + rng() * 300, rad = 30 + rng() * 60;
      const g = T.buildDistantPillar(5000 + i * 31, 200 + rng() * 260, rad, T.BASE);
      const m = new THREE.Mesh(g, dmat); m.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist); scene.add(m);
    }
    // 협곡 바닥
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), new THREE.MeshStandardMaterial({ color: 0x2f3b2c, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = T.BASE; scene.add(floor);

    // 구름바다
    const st = seaTexture();
    for (let i = 0; i < 2; i++) {
      const tex = st.clone(); tex.needsUpdate = true; tex.repeat.set(9 + i * 3, 9 + i * 3);
      const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.96 - i * 0.2, color: 0xffffff });
      const m = new THREE.Mesh(new THREE.CircleGeometry(900, 40), mat);
      m.rotation.x = -Math.PI / 2; m.position.y = CLOUD_Y - 3 + i * 6; m.renderOrder = 2;
      scene.add(m); S.sea.push({ m, tex, sp: 0.004 + i * 0.003 });
    }
    // 뭉게구름 스프라이트
    const pt = puffTexture();
    function puff(x, y, z, sc, op) {
      const sm = new THREE.SpriteMaterial({ map: pt, transparent: true, opacity: op, depthWrite: false, color: 0xfff6ee });
      const s = new THREE.Sprite(sm); s.position.set(x, y, z); s.scale.set(sc * (1.2 + rng() * 0.5), sc, 1); s.renderOrder = 3;
      scene.add(s); S.clouds.push({ s, vx: 0.25 + rng() * 0.4, baseY: y, ph: rng() * 6 });
    }
    for (let i = 0; i < 110; i++) { const a = rng() * Math.PI * 2, d = 8 + rng() * 320; puff(Math.cos(a) * d, CLOUD_Y - 8 + rng() * 22, Math.sin(a) * d, 14 + rng() * 34, 0.75 + rng() * 0.25); }
    for (let i = 0; i < 26; i++) { const a = rng() * Math.PI * 2, d = 12 + rng() * 200; puff(Math.cos(a) * d, 30 + rng() * 60, Math.sin(a) * d, 10 + rng() * 20, 0.35 + rng() * 0.2); }
    for (let i = 0; i < 30; i++) { const a = rng() * Math.PI * 2, d = 12 + rng() * 260; puff(Math.cos(a) * d, 165 + rng() * 75, Math.sin(a) * d, 12 + rng() * 26, 0.25 + rng() * 0.25); }

    // 새
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0, 0, 0.12, 0, 0, -0.12, 0.5, 0, 0, 0, 0, -0.12, 0, 0, 0.12], 3));
    const bm = new THREE.MeshBasicMaterial({ color: 0x0c0c0e, side: THREE.DoubleSide });
    const bodyG = new THREE.SphereGeometry(0.22, 8, 6).scale(1, 0.7, 1.6);
    crowG = { bg, bm, bodyG }; S.scene = scene;
    spawnCrows(0);   // 기종에 따라 다시 뿌린다 (applyBike)

    buildHouse(scene);
    buildBike(scene);
  }

  // 작은 집 한 채: 마당 돌바닥 + 착륙 원 + 등불
  const ROOFS = [0x3c3535, 0x4a3a3a, 0x35404a, 0x503c2c, 0x3a4a3a];

  // ── 집마다 직업 소품 (delivery.js 의 NAMES 순서와 같다: 화가·작가·감독·가수·배우·유튜버·CEO·축구선수·웹툰작가·사진작가)
  const HUT_ICON = ['🎨', '✍️', '🎬', '🎤', '🎭', '▶', '💼', '⚽', '📚', '📷', '🎹', '✏️'];
  const HUT_PLATE = ['#f2c14e', '#e8e2d2', '#2b2b30', '#c8457a', '#7a3ac8', '#e03030', '#2a4a8a', '#2f8a3e', '#3c7fd0', '#444', '#333', '#d08a3c'];
  function iconSign(idx) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = HUT_PLATE[idx % HUT_PLATE.length]; x.beginPath(); x.roundRect(4, 4, 120, 120, 22); x.fill();
    x.strokeStyle = '#fff3d0'; x.lineWidth = 6; x.stroke();
    x.font = '76px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff'; x.fillText(HUT_ICON[idx % HUT_ICON.length], 64, 70);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function decorateHut(g, idx, M) {
    const box = (w, h, d, m, x, y, z, ry) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); if (ry) o.rotation.y = ry; o.castShadow = true; g.add(o); return o; };
    const cyl = (r1, r2, h, m, x, y, z) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 10), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const sph = (r, m, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const white = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.7 });
    const black = new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: 0.6, metalness: 0.2 });
    const red = new THREE.MeshStandardMaterial({ color: 0xe03030, roughness: 0.6 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xf2c14e, emissive: 0xa06a10, emissiveIntensity: 0.35, roughness: 0.5, metalness: 0.4 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x8fc3ff, emissive: 0x3a70c0, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.6 });
    let rad = 1.6;
    const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o || {}));
    const flatRoof = (w, d, c, y) => { M.roof.visible = false; M.chim.visible = false; box(w, 0.22, d, mat(c || 0x2a2a30), 0, y || 2.3, 0); box(w, 0.28, 0.16, mat(c || 0x2a2a30), 0, (y || 2.3) + 0.2, d / 2 - 0.08); box(w, 0.28, 0.16, mat(c || 0x2a2a30), 0, (y || 2.3) + 0.2, -d / 2 + 0.08); };
    switch (idx % 12) {
      case 0: { // 아틀리에: 흰 회벽 + 평지붕 + 비스듬한 유리 천창 + 벽에 튄 물감
        M.body.material = mat(0xf0ebe0); flatRoof(3.3, 2.9, 0x6f6a62);
        const sky = box(1.6, 0.08, 1.4, glass, -0.5, 2.55, -0.2); sky.rotation.x = -0.3;
        [[0xe03030, -1.2, 1.7], [0x2f7fd0, -0.9, 1.1], [0xf2c14e, 1.25, 1.9], [0x3fae5a, 1.4, 0.7]].forEach(([c, x, y]) => { const b = box(0.28, 0.28, 0.04, mat(c), x, y, 1.32); b.rotation.z = 0.6; });
        M.wins[0].scale.set(2.0, 1.6, 1); M.wins[0].position.set(0.95, 1.35, 1.32);
        break; }
      case 1: { // 집필실: 짙은 녹색 벽 + 뾰족한 지붕 + 문 위 둥근 창 + 지붕창
        M.body.material = mat(0x2f4a3a); M.roof.scale.set(1, 1.5, 0.92); M.roof.position.y = 3.35; M.roof.material = mat(0x3a2a24);
        const rw = cyl(0.3, 0.3, 0.08, M.winM, 0, 1.95, 1.33); rw.rotation.x = Math.PI / 2;
        box(0.6, 0.55, 0.5, mat(0x3a2a24), 0.9, 3.2, 0.9); box(0.32, 0.32, 0.06, M.winM, 0.9, 3.2, 1.17);
        break; }
      case 2: { // 촬영장: 넓은 검은 격납고 + 큰 미닫이문 + 지붕 위 REC 빨간 불
        M.body.scale.set(1.55, 1.15, 1.2); M.body.position.y = 1.25; M.body.material = mat(0x26262c, { roughness: 0.6 }); flatRoof(4.9, 3.3, 0x18181c, 2.6);
        M.door.scale.set(2.6, 1.4, 1); M.door.position.set(0, 0.98, 1.6); M.door.material = mat(0x3a3a44, { metalness: 0.4, roughness: 0.5 });
        M.wins.forEach(w => w.visible = false); box(1.1, 0.12, 0.6, black, 1.4, 2.95, 0.6); sph(0.11, red, 1.4, 3.15, 0.6);
        rad = 2.3;
        break; }
      case 3: { // 녹음실: 둥근 몸통 + 돔 지붕 + 방음 패널 + 네온
        M.body.visible = false; M.roof.visible = false; M.chim.visible = false;
        cyl(1.65, 1.75, 2.2, mat(0x4a2a4a), 0, 1.1, 0); const dome = sph(1.7, mat(0x2b1b33), 0, 2.2, 0); dome.scale.set(1, 0.55, 1);
        for (let k = 0; k < 6; k++) { const a = -0.9 + k * 0.36; box(0.36, 0.5, 0.05, mat(0x1a1420), Math.sin(a) * 1.68, 1.55, Math.cos(a) * 1.68, a); }
        M.door.position.z = 1.66; M.wins.forEach(w => w.visible = false);
        const neon = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 24), mat(0xff4fd8, { emissive: 0xff2fd0, emissiveIntensity: 1.6 })); neon.position.set(0, 2.05, 1.62); g.add(neon);
        break; }
      case 4: { // 연습실(극장): 빨간 벽 + 차양 + 전구 줄 + 커튼
        M.body.material = mat(0x8a2a2a); flatRoof(3.3, 2.9, 0x3a2a24, 2.35);
        box(3.4, 0.1, 1.2, mat(0xd9c9a0), 0, 2.05, 1.85);
        for (let k = 0; k < 7; k++) sph(0.07, M.winM, -1.5 + k * 0.5, 1.98, 2.42);
        box(0.35, 1.5, 0.12, mat(0xb01f2e), -0.6, 0.75, 1.36); box(0.35, 1.5, 0.12, mat(0xb01f2e), 0.6, 0.75, 1.36);
        break; }
      case 5: { // 방송실: 흰 상자 + 검은 창띠 + ON AIR 붉은 판
        M.body.material = mat(0xf4f2ec, { roughness: 0.5 }); flatRoof(3.3, 2.9, 0xe8e2d2, 2.3);
        M.wins.forEach(w => w.visible = false); box(2.6, 0.55, 0.06, mat(0x15151a, { emissive: 0x2a5aa0, emissiveIntensity: 0.5 }), 0, 1.5, 1.33);
        box(1.2, 0.36, 0.08, mat(0xe03030, { emissive: 0xff2020, emissiveIntensity: 1.2 }), 0, 2.05, 1.36);
        break; }
      case 6: { // 대기업: 유리 로비 + 평지붕 (사옥은 뒤에)
        M.body.material = glass; M.door.material = black; flatRoof(3.3, 2.9, 0x1e2630, 2.3); M.wins.forEach(w => w.visible = false);
        break; }
      case 7: { // 훈련장: 흰 벽 + 초록 띠 + 평지붕 + 잔디
        M.body.material = mat(0xf0f0ea); box(3.04, 0.3, 2.64, mat(0x2f8a3e), 0, 1.7, 0); flatRoof(3.3, 2.9, 0x2f8a3e, 2.3);
        const turf = cyl(1.4, 1.4, 0.06, mat(0x3f9a4a), 2.6, 0.03, -0.6); const line = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.03, 4, 32).rotateX(Math.PI / 2), white); line.position.set(2.6, 0.07, -0.6); g.add(line);
        break; }
      case 8: { // 편집실: 보라 벽 + 2층 작업방 + 큰 모니터 창
        M.body.material = mat(0x5a3a7a); M.roof.visible = false; M.chim.visible = false;
        box(2.0, 1.4, 1.8, mat(0x7a4aa0), 0.4, 2.9, -0.2); box(2.2, 0.2, 2.0, mat(0x2a2a30), 0.4, 3.7, -0.2); box(3.3, 0.2, 2.9, mat(0x2a2a30), 0, 2.3, 0);
        box(1.1, 0.7, 0.06, mat(0x9ad0ff, { emissive: 0x4a9aff, emissiveIntensity: 1.1 }), 0.4, 2.9, 0.72);
        break; }
      case 9: { // 스튜디오: 검은 상자 + 통유리 정면
        M.body.material = mat(0x1c1c20, { roughness: 0.5 }); flatRoof(3.3, 2.9, 0x0f0f12, 2.3);
        M.wins.forEach(w => w.visible = false); box(2.4, 1.3, 0.06, mat(0xfff6dc, { emissive: 0xffe0a0, emissiveIntensity: 1.3 }), 0, 1.35, 1.33); M.door.position.x = -1.2; M.door.scale.set(0.8, 1, 1);
        break; }
      default: break;
    }
    // 간판 기둥: 마당 왼쪽 앞. 착륙 발판(가운데)은 비워 둔다
    cyl(0.05, 0.06, 2.0, M.dark, -2.3, 1.0, 2.3);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.08), [M.dark, M.dark, M.dark, M.dark, new THREE.MeshStandardMaterial({ map: iconSign(idx), emissive: 0xffffff, emissiveMap: iconSign(idx), emissiveIntensity: 0.55 }), M.dark]);
    sg.position.set(-2.3, 2.3, 2.3); g.add(sg);
    switch (idx % 12) {
      case 0: { // 화가: 이젤 + 캔버스 + 물감 방울
        cyl(0.03, 0.04, 1.7, M.wood, 2.1, 0.85, 1.0); cyl(0.03, 0.04, 1.7, M.wood, 2.5, 0.85, 1.25);
        const cv = box(0.9, 0.7, 0.05, white, 2.3, 1.25, 1.0, -0.5); cv.rotation.x = -0.15;
        [[0xe03030, 2.0, 1.8], [0x2f7fd0, 2.4, 2.0], [0xf2c14e, 2.7, 1.7]].forEach(([c, x, z]) => sph(0.12, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }), x, 0.1, z));
        break; }
      case 1: { // 작가: 책 더미 + 큰 연필
        [[0xb03a3a, 0.2], [0x2f5f8a, 0.36], [0xd9c9a0, 0.5]].forEach(([c, y], k) => box(0.7 - k * 0.05, 0.16, 0.5, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), 2.2, y, 1.0, k * 0.2));
        const pen = cyl(0.07, 0.07, 1.8, gold, 2.6, 0.9, 1.7); pen.rotation.z = 0.35; const tip = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 8), black); tip.position.set(2.92, 0.05, 1.7); tip.rotation.z = 0.35 + Math.PI; g.add(tip);
        break; }
      case 2: { // 영화감독: 삼각대 카메라 + 슬레이트
        for (const a of [0, 2.1, 4.2]) { const l = cyl(0.02, 0.03, 1.4, black, 2.3 + Math.sin(a) * 0.3, 0.7, 1.3 + Math.cos(a) * 0.3); l.rotation.z = Math.sin(a) * 0.25; l.rotation.x = -Math.cos(a) * 0.25; }
        box(0.5, 0.35, 0.7, black, 2.3, 1.55, 1.3); cyl(0.12, 0.14, 0.3, black, 2.3, 1.55, 1.75).rotation.x = Math.PI / 2;
        const sl = box(0.7, 0.55, 0.05, black, -2.4, 0.35, 1.0, 0.4); box(0.7, 0.14, 0.06, white, -2.4, 0.7, 1.0, 0.4);
        break; }
      case 3: { // 가수: 스탠드 마이크 + 스피커
        cyl(0.02, 0.03, 1.5, black, 2.2, 0.75, 1.2); sph(0.13, black, 2.2, 1.55, 1.2); cyl(0.25, 0.3, 0.06, black, 2.2, 0.03, 1.2);
        box(0.6, 0.9, 0.5, black, -2.3, 0.45, 0.8); cyl(0.17, 0.17, 0.04, white, -2.3, 0.55, 1.06).rotation.x = Math.PI / 2;
        break; }
      case 4: { // 배우: 스포트라이트 + 금별
        cyl(0.04, 0.05, 2.2, black, 2.4, 1.1, 1.0); const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 12), black); lamp.position.set(2.4, 2.25, 1.15); lamp.rotation.x = 1.3; g.add(lamp);
        sph(0.12, M.winM, 2.4, 2.1, 1.35);
        const star = new THREE.Shape(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.16 : 0.38, a = k * Math.PI / 5 - Math.PI / 2; k ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        const st = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 0.08, bevelEnabled: false }), gold); st.position.set(-2.3, 0.45, 0.9); g.add(st);
        break; }
      case 5: { // 유튜버: 링라이트 + 재생 단추
        cyl(0.03, 0.04, 1.6, black, 2.3, 0.8, 1.1); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 24), M.winM); ring.position.set(2.3, 1.75, 1.1); g.add(ring);
        box(0.9, 0.62, 0.12, red, 0.9, 2.85, 0.4); const tri = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 3), white); tri.position.set(0.9, 2.85, 0.48); tri.rotation.set(Math.PI / 2, 0, -Math.PI / 2); g.add(tri);
        break; }
      case 6: { // 대기업: 뒤에 유리 사옥
        box(2.4, 6.0, 2.4, new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.5, metalness: 0.3 }), 0, 3.0, -2.6);
        for (let f = 0; f < 5; f++) box(2.5, 0.5, 2.5, glass, 0, 0.9 + f * 1.1, -2.6);
        box(2.6, 0.2, 2.6, black, 0, 6.1, -2.6); cyl(0.03, 0.03, 1.2, black, 0.6, 6.8, -2.6); sph(0.08, red, 0.6, 7.4, -2.6);
        break; }
      case 7: { // 축구선수: 골대 + 공
        const gx = 2.6, gz = 0.9;
        cyl(0.05, 0.05, 1.6, white, gx, 0.8, gz - 0.9); cyl(0.05, 0.05, 1.6, white, gx, 0.8, gz + 0.9); box(0.1, 0.1, 1.9, white, gx, 1.6, gz);
        box(0.9, 1.6, 0.03, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, side: THREE.DoubleSide }), gx + 0.45, 0.8, gz, 0);
        sph(0.22, white, -2.2, 0.22, 1.2); const bl = box(0.25, 0.25, 0.25, black, -2.2, 0.22, 1.2); bl.scale.setScalar(0.85); bl.rotation.set(0.6, 0.8, 0.3);
        break; }
      case 8: { // 웹툰작가: 큰 태블릿 펜 + 말풍선 + 원고 더미
        const pen = cyl(0.06, 0.06, 1.7, new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.4 }), 2.5, 0.85, 1.5); pen.rotation.z = -0.4; const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 8), white); tip.position.set(2.18, 0.06, 1.5); tip.rotation.z = -0.4 + Math.PI; g.add(tip);
        for (let k = 0; k < 4; k++) box(0.6, 0.05, 0.8, white, -2.3, 0.05 + k * 0.06, 1.0, k * 0.15);
        const bub = sph(0.32, white, 2.0, 2.6, 0.4); bub.scale.set(1.5, 1, 0.5); const bt = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), white); bt.position.set(1.75, 2.25, 0.45); bt.rotation.z = 0.5; g.add(bt);
        break; }
      case 9: { // 사진작가: 삼각대 카메라 + 배경 천
        for (const a of [0, 2.1, 4.2]) { const l = cyl(0.02, 0.03, 1.3, M.dark, -2.2 + Math.sin(a) * 0.28, 0.65, 1.4 + Math.cos(a) * 0.28); l.rotation.z = Math.sin(a) * 0.25; l.rotation.x = -Math.cos(a) * 0.25; }
        box(0.4, 0.3, 0.25, black, -2.2, 1.45, 1.4); cyl(0.1, 0.12, 0.2, black, -2.2, 1.45, 1.62).rotation.x = Math.PI / 2;
        cyl(0.03, 0.03, 2.2, M.dark, 1.7, 1.1, 0.6); cyl(0.03, 0.03, 2.2, M.dark, 3.1, 1.1, 0.6); box(1.5, 0.06, 0.06, M.dark, 2.4, 2.2, 0.6);
        box(1.4, 2.0, 0.03, white, 2.4, 1.2, 0.62);
        break; }
      default: break;
    }
    return rad;
  }
  function makeHut(scene, x, y, z, yaw, sc, seed) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw; g.scale.setScalar(sc);
    const wood = new THREE.MeshStandardMaterial({ color: [0x6d4f36, 0x7a5a40, 0x5e4a3a][seed % 3], roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: ROOFS[seed % ROOFS.length], roughness: 0.95 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 1 });
    const winM = new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xffb050, emissiveIntensity: 1.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 2.6), wood); body.position.y = 1.1; body.castShadow = body.receiveShadow = true; g.add(body);
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 3.0), stone); base.position.y = 0.12; g.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.75, 1.5, 4), new THREE.MeshStandardMaterial({ color: 0x6b2a22, roughness: 0.9 })); roof.position.y = 2.95; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.92); roof.castShadow = true; g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.08), dark); door.position.set(0, 0.7, 1.32); g.add(door);
    const wins = [];
    for (const [wx, wz, ry] of [[0.85, 1.32, 0], [-0.85, 1.32, 0], [1.52, 0.3, Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), winM); w.position.set(wx, 1.35, wz); w.rotation.y = ry; g.add(w); wins.push(w); }
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), stone); chim.position.set(0.9, 3.0, -0.5); g.add(chim);
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 6), dark); lampPost.position.set(1.4, 0.8, 1.9); g.add(lampPost);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), winM); lamp.position.set(1.4, 1.65, 1.9); g.add(lamp);
    // 마당: 돌바닥 원 (착륙장)
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(5.4 / sc, 5.6 / sc, 0.12, 36), new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 1 })); yard.position.set(0, 0.0, 4.2 / sc); yard.receiveShadow = true; g.add(yard);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.0 / sc, 0.1 / sc, 6, 48).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xd9c9a0, roughness: 0.8 })); ring.position.set(0, 0.08, 4.2 / sc); g.add(ring);
    // 등불 빛 (멀리서도 보임)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, opacity: 0.7 }));
    glow.position.set(1.4, 1.7, 1.9); glow.scale.set(3 / sc, 3 / sc, 1); glow.renderOrder = 20; g.add(glow);
    const rad = decorateHut(g, S.huts.length, { wood, dark, stone, winM, body, roof, door, wins, chim, lampPost, lamp, glow }) || 1.6;
    scene.add(g);
    // 마당 중심(월드) — 착륙 판정용으로 그룹 위치를 마당으로 옮겨 둔다
    const yardW = new THREE.Vector3(0, 0, 4.2 / sc).applyMatrix4(g.matrixWorld.identity().compose(g.position, g.quaternion, g.scale));
    g.userData.yard = yardW;
    S.buildings.push({ x, z, r: rad * sc, y0: y, y1: y + 3.7 * sc });
    return g;
  }
  // 주유소: 마당 + 주유기 두 대 + 간판
  function makeStation(scene, x, y, z, yaw) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = yaw;
    const stone = new THREE.MeshStandardMaterial({ color: 0x8a847a, roughness: 1 });
    const redM = new THREE.MeshStandardMaterial({ color: 0xc8452c, roughness: 0.5, metalness: 0.2 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.8 });
    const lit = new THREE.MeshStandardMaterial({ color: 0xfff1c0, emissive: 0xffd070, emissiveIntensity: 1.8 });
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.2, 0.12, 40), stone); yard.receiveShadow = true; g.add(yard);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.4, 0.12, 6, 48).rotateX(Math.PI / 2), redM); ring.position.y = 0.08; g.add(ring);
    for (const sx of [-1, 1]) {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.45), redM); pump.position.set(sx * 1.2, 0.8, -3.3); pump.castShadow = true; g.add(pump);
      const face = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), lit); face.position.set(sx * 1.2, 1.15, -3.05); g.add(face);
      const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), dark); hose.position.set(sx * 1.55, 0.9, -3.3); hose.rotation.z = 0.3; g.add(hose);
    }
    const roofPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), dark); roofPost.position.set(0, 1.6, -3.9); g.add(roofPost);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.15, 2.2), redM); roof.position.set(0, 3.2, -3.3); roof.castShadow = true; g.add(roof);
    // 간판: 캔버스 글씨
    const c = document.createElement('canvas'); c.width = 256; c.height = 96; const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff3d0'; ctx.fillRect(0, 0, 256, 96); ctx.fillStyle = '#c8452c'; ctx.font = 'bold 64px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GAS', 128, 52);
    const signT = new THREE.CanvasTexture(c); signT.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.1), [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: signT, emissive: 0xffffff, emissiveMap: signT, emissiveIntensity: 0.6 }), dark]);
    sign.position.set(0, 4.0, -3.3); g.add(sign);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, opacity: 0.6, color: 0xff8866 }));
    glow.position.set(0, 4.0, -3.3); glow.scale.set(4, 4, 1); glow.renderOrder = 20; g.add(glow);
    // 첫 주유소 옆에 오토바이 가게
    if (!S.shop) {
      const shop = new THREE.Group(); shop.position.set(0, 0, 8.2); shop.rotation.y = Math.PI; g.add(shop);
      const wall = new THREE.MeshStandardMaterial({ color: 0x5b4a3c, roughness: 0.9 });
      const roofM = new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.9 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.8, 3.4), wall); body.position.y = 1.4; body.castShadow = body.receiveShadow = true; shop.add(body);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.2, 4.0), roofM); roof.position.set(0, 2.9, 0); roof.castShadow = true; shop.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 0.1), dark); door.position.set(0.6, 1.1, 1.72); shop.add(door);
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.08), lit); win.position.set(-1.6, 1.6, 1.72); shop.add(win);
      // 진열 오토바이 (작은 것 둘)
      for (const [sx, col] of [[-1.7, 0x2352c8], [1.7, 0xd42a1a]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 1.1), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.3 })); b.position.set(sx, 0.55, 2.6); b.rotation.y = 0.3 * Math.sign(sx); shop.add(b); for (const wz of [-0.45, 0.45]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.07, 8, 16), dark); w.position.set(sx, 0.3, 2.6 + wz); w.rotation.y = 0.3 * Math.sign(sx); shop.add(w); } }
      const sc = document.createElement('canvas'); sc.width = 320; sc.height = 96; const sctx = sc.getContext('2d');
      sctx.fillStyle = '#2b2a30'; sctx.fillRect(0, 0, 320, 96); sctx.fillStyle = '#ffd27a'; sctx.font = 'bold 52px Arial, sans-serif'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'; sctx.fillText('BIKE SHOP', 160, 50);
      const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 0.12), [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.55 }), dark]); sign.position.set(0, 3.6, 1.6); shop.add(sign);
      const sg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, opacity: 0.55, color: 0xffd27a })); sg.position.set(0, 3.6, 1.6); sg.scale.set(5, 5, 1); sg.renderOrder = 20; shop.add(sg);
      g.updateMatrixWorld(true);
      S.shop = { pos: new THREE.Vector3(0, 0, 8.2).applyMatrix4(g.matrixWorld), name: TX('모터샵', 'Shop') };
      S.buildings.push({ x: S.shop.pos.x, z: S.shop.pos.z, r: 3.2, y0: y, y1: y + 4.2 });
    }
    scene.add(g);
    return new THREE.Vector3(x, y, z);
  }
  let _glowTex = null;
  function glowTex() {
    if (_glowTex) return _glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
    const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,120,1)'); gr.addColorStop(0.25, 'rgba(255,170,80,0.5)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    _glowTex = new THREE.CanvasTexture(c); return _glowTex;
  }
  // 흰 벽돌 텍스처
  function brickTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#d9d3c8'; x.fillRect(0, 0, 256, 256);
    const bw = 64, bh = 32;
    for (let row = 0; row < 8; row++) for (let col = -1; col < 5; col++) {
      const ox = (row % 2) * bw / 2; const v = 238 + Math.floor(Math.random() * 14);
      x.fillStyle = 'rgb(' + v + ',' + (v - 3) + ',' + (v - 10) + ')';
      x.fillRect(col * bw + ox + 2, row * bh + 2, bw - 4, bh - 4);
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function stripeTex() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f6f1e6' : '#d42a1a'; x.fillRect(i * 16, 0, 16, 32); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
  }
  function buildHouse(scene) {
    const Y = T.SUMMIT;
    const g = new THREE.Group(); g.position.set(0.3, Y, -0.4); g.rotation.y = 0.6;
    const bt = brickTex(); bt.repeat.set(3, 2);
    const wood = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.85 });   // 식당 벽: 흰 벽돌
    const dark = new THREE.MeshStandardMaterial({ color: 0x35302f, roughness: 0.95 });
    const stone = new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 1 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 2.6), wood); body.position.y = 1.1; body.castShadow = body.receiveShadow = true; g.add(body);
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 3.0), stone); base.position.y = 0.12; g.add(base);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.75, 1.5, 4), new THREE.MeshStandardMaterial({ color: 0x6b2a22, roughness: 0.9 })); roof.position.y = 2.95; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.92); roof.castShadow = true; g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.08), new THREE.MeshStandardMaterial({ color: 0x8a3a2a, roughness: 0.7 })); door.position.set(0.95, 0.8, 1.32); g.add(door);
    const winM = new THREE.MeshStandardMaterial({ color: 0xffd08a, emissive: 0xffb050, emissiveIntensity: 1.6 });
    const bigWin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 0.06), winM); bigWin.position.set(-0.55, 1.25, 1.32); g.add(bigWin);
    for (const [x, z, ry] of [[1.52, 0.3, Math.PI / 2], [-1.52, -0.4, Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.06), winM); w.position.set(x, 1.35, z); w.rotation.y = ry; g.add(w); }
    // 창틀(흰) + 문 위 줄무늬 차양
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 0.04), new THREE.MeshStandardMaterial({ color: 0xfaf7f0 })); frame.position.set(-0.55, 1.25, 1.3); g.add(frame);
    const awn = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.05, 1.1), new THREE.MeshStandardMaterial({ map: stripeTex(), roughness: 0.8, side: THREE.DoubleSide })); awn.position.set(0.1, 2.05, 1.75); awn.rotation.x = 0.28; awn.castShadow = true; g.add(awn);
    for (const sx of [-1.45, 1.65]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), dark); post.position.set(sx, 0.95, 2.25); g.add(post); }
    // 마당 테이블 + 파라솔
    for (const [tx, tz] of [[-2.2, 3.4], [2.6, 3.9]]) {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 14), new THREE.MeshStandardMaterial({ color: 0xf3efe6 })); top.position.set(tx, 0.7, tz); g.add(top);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6), dark); leg.position.set(tx, 0.35, tz); g.add(leg);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), dark); pole.position.set(tx, 1.5, tz); g.add(pole);
      const para = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.45, 10), new THREE.MeshStandardMaterial({ color: 0xd42a1a, roughness: 0.8, side: THREE.DoubleSide })); para.position.set(tx, 2.35, tz); para.castShadow = true; g.add(para);
      for (const a of [0, Math.PI]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 10), new THREE.MeshStandardMaterial({ color: 0xf3efe6 })); st.position.set(tx + Math.cos(a) * 0.75, 0.42, tz + Math.sin(a) * 0.75); g.add(st); }
    }
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), stone); chim.position.set(0.9, 3.0, -0.5); g.add(chim);
    // 등불
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 6), dark); lampPost.position.set(1.4, 0.8, 1.9); g.add(lampPost);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), winM); lamp.position.set(1.4, 1.65, 1.9); g.add(lamp);
    const pl = new THREE.PointLight(0xffb35c, 25, 18, 2); pl.position.set(1.4, 1.7, 1.9); g.add(pl); S.lanternLight = pl;
    // 소나무
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 7), wood); trunk.position.set(-2.6, 1.0, 0.9); trunk.rotation.z = 0.12; g.add(trunk);
    const pine = new THREE.MeshStandardMaterial({ color: 0x2f4a2a, roughness: 1 });
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.2 - i * 0.3, 1.3, 7), pine); c.position.set(-2.6 - i * 0.05, 2.1 + i * 0.85, 0.9); c.castShadow = true; g.add(c); }
    // 돌길
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.28 + rng() * 0.12, 0.3, 0.06, 7), stone); s.position.set((rng() - 0.5) * 0.5, 0.03, 1.8 + i * 0.6); g.add(s); }
    // 식당 간판: SKY DELIVERY
    { const sc = document.createElement('canvas'); sc.width = 512; sc.height = 128; const x = sc.getContext('2d');
      x.fillStyle = '#d42a1a'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#fff3d0'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 118);
      x.fillStyle = '#fff'; x.font = 'bold 104px Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DELIVERY', 256, 66);
      const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
      const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.95, 0.12), [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: st, emissive: 0xffffff, emissiveMap: st, emissiveIntensity: 0.55 }), dark]);
      board.position.set(0, 4.35, 0.9); g.add(board);   // 지붕 위, 처마에 안 가리게
      for (const sx of [-1.5, 1.5]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), dark); post.position.set(sx, 3.4, 0.9); g.add(post); } }
    scene.add(g); S.house = g;
    S.buildings.push({ x: 0.3, z: -0.4, r: 2.2, y0: Y, y1: Y + 4.6 });
    // 멀리서도 보이는 등불 빛
    const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
    const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,200,120,1)'); gr.addColorStop(0.25, 'rgba(255,170,80,0.5)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false, opacity: 0.9 }));
    glow.position.set(1.4, Y + 1.7, 1.9); glow.scale.set(6, 6, 1); glow.renderOrder = 20; scene.add(glow); S.lantern = glow;
    // 굴뚝 연기
    const smokeM = new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, opacity: 0.35, depthWrite: false, color: 0xd8d8d8 });
    for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(smokeM.clone()); s.scale.set(0.8, 0.8, 1); scene.add(s); S.smoke.push({ s, t: i / 8 }); }
  }

  // ── 하늘을 나는 오토바이 ───────────────────────────
  function buildBike(scene) {
    const g = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({ color: 0xc8452c, roughness: 0.45, metalness: 0.35 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, roughness: 0.25, metalness: 0.9 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x1f1f22, roughness: 0.95 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.8, metalness: 0.3 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xd8b190, roughness: 0.8 });
    const cloth = new THREE.MeshStandardMaterial({ color: 0x3b4a6b, roughness: 0.9 });
    const M = (geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; g.add(m); return m; };
    // 차체 (앞이 +z)
    M(new THREE.BoxGeometry(0.45, 0.42, 1.3), paint, 0, 0.62, 0.05);
    M(new THREE.BoxGeometry(0.5, 0.18, 0.7), dark, 0, 0.86, -0.25);          // 안장
    M(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 10), paint, 0, 0.72, 0.55, Math.PI / 2 - 0.5, 0, 0); // 연료통
    M(new THREE.BoxGeometry(0.42, 0.3, 0.5), chrome, 0, 0.42, 0.1);          // 엔진
    M(new THREE.CylinderGeometry(0.05, 0.06, 0.9, 8), chrome, 0.2, 0.36, -0.35, Math.PI / 2 - 0.15, 0, 0); // 배기관
    M(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), chrome, 0, 0.62, 0.85, 0.5, 0, 0);  // 앞포크
    const bar = M(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), chrome, 0, 0.98, 0.72, 0, 0, Math.PI / 2); // 핸들
    M(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshStandardMaterial({ color: 0xfff1c0, emissive: 0xffd070, emissiveIntensity: 2 }), 0, 0.8, 1.0); // 헤드라이트
    const head = new THREE.SpotLight(0xffe0b0, 0, 40, 0.5, 0.6, 1.2); head.position.set(0, 0.85, 1.0); head.target.position.set(0, 0.2, 12); g.add(head); g.add(head.target); S.headlight = head;
    const wheelG = new THREE.TorusGeometry(0.34, 0.1, 12, 28).rotateY(Math.PI / 2);   // 바퀴는 옆으로 (앞뒤로 구르게)
    const wf = M(wheelG, rubber, 0, 0.36, 0.95), wb = M(wheelG, rubber, 0, 0.36, -0.75);
    const hubG = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 12);
    const hf = M(hubG, chrome, 0, 0.36, 0.95, 0, 0, Math.PI / 2), hb = M(hubG, chrome, 0, 0.36, -0.75, 0, 0, Math.PI / 2);
    // 발판
    for (const sx of [-1, 1]) M(new THREE.BoxGeometry(0.16, 0.04, 0.22), chrome, sx * 0.3, 0.4, 0.05);
    // 기종별 꾸밈 (보였다 안 보였다)
    const extras = {};
    const E = (key, geo, mat, x, y, z, rx, ry, rz) => { const m = M(geo, mat, x, y, z, rx, ry, rz); m.visible = false; (extras[key] = extras[key] || []).push(m); return m; };
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6 });
    const black = new THREE.MeshStandardMaterial({ color: 0x15151a, roughness: 0.5, metalness: 0.4 });
    const boxB = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.8 });
    const glowB = new THREE.MeshStandardMaterial({ color: 0x60c8ff, emissive: 0x2aa0ff, emissiveIntensity: 1.6 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xd9b45a, metalness: 0.8, roughness: 0.3 });
    const thrust = new THREE.MeshStandardMaterial({ color: 0x9fdcff, emissive: 0x3aa8ff, emissiveIntensity: 2.2, transparent: true, opacity: 0.85 });
    // 1 스쿠터: 흰 배달통 + 앞 가리개
    E('scooter', new THREE.BoxGeometry(0.62, 0.55, 0.6), white, 0, 1.05, -0.7); E('scooter', new THREE.BoxGeometry(0.5, 0.5, 0.12), white, 0, 0.75, 0.95);
    // 2 오프로드: 빨간 짐가방 + 앞 흙받이
    E('dirt', new THREE.BoxGeometry(0.5, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0x7a1f14, roughness: 0.9 }), 0, 1.0, -0.7); E('dirt', new THREE.BoxGeometry(0.34, 0.06, 0.6), paint, 0, 0.8, 1.05, 0.25, 0, 0);
    // 3 슈퍼스포츠: 페어링 + 검은 상자
    E('sport', new THREE.ConeGeometry(0.3, 0.9, 12), paint, 0, 0.8, 1.35, Math.PI / 2, 0, 0); E('sport', new THREE.BoxGeometry(0.06, 0.35, 0.5), paint, 0, 1.05, -0.9, 0.3, 0, 0); E('sport', new THREE.BoxGeometry(0.5, 0.36, 0.5), boxB, 0, 1.0, -0.7);
    // 4 전기 바이크: 검은 상자 + 파란 빛 테두리 바퀴 + 번개
    E('electric', new THREE.BoxGeometry(0.5, 0.36, 0.5), boxB, 0, 1.0, -0.7);
    E('electric', new THREE.TorusGeometry(0.26, 0.025, 8, 24).rotateY(Math.PI / 2), glowB, 0, 0.36, 0.95); E('electric', new THREE.TorusGeometry(0.26, 0.025, 8, 24).rotateY(Math.PI / 2), glowB, 0, 0.36, -0.75);
    E('electric', new THREE.BoxGeometry(0.45, 0.2, 0.5), black, 0, 0.42, 0.1);
    // 5 호버바이크: 큰 날개 + 금빛 줄 + 파란 추진 불꽃
    E('sky', new THREE.BoxGeometry(1.9, 0.05, 0.5), white, -1.2, 0.85, -0.2, 0, 0.15, 0.1); E('sky', new THREE.BoxGeometry(1.9, 0.05, 0.5), white, 1.2, 0.85, -0.2, 0, -0.15, -0.1);
    E('sky', new THREE.BoxGeometry(1.7, 0.02, 0.1), gold, -1.2, 0.88, -0.05, 0, 0.15, 0.1); E('sky', new THREE.BoxGeometry(1.7, 0.02, 0.1), gold, 1.2, 0.88, -0.05, 0, -0.15, -0.1);
    E('sky', new THREE.ConeGeometry(0.14, 0.7, 10), thrust, 0.2, 0.36, -1.1, -Math.PI / 2, 0, 0); E('sky', new THREE.ConeGeometry(0.14, 0.7, 10), thrust, -0.2, 0.36, -1.1, -Math.PI / 2, 0, 0);
    E('sky', new THREE.BoxGeometry(0.5, 0.36, 0.5), boxB, 0, 1.0, -0.7);
    g.userData.extras = extras; g.userData.paint = paint;
    // 머플러 연기
    const smokeM = new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, opacity: 0.4, depthWrite: false, color: 0xe8e4dc });
    const puffs = [];
    for (let i = 0; i < 28; i++) { const s = new THREE.Sprite(smokeM.clone()); s.visible = false; scene.add(s); puffs.push({ s, t: 1, x: 0, y: 0, z: 0 }); }
    g.rotation.order = 'YXZ';
    scene.add(g);
    S.bike = { g, wf, wb, hf, hb, bar, puffs, next: 0, emitT: 0, spin: 0, vel: new THREE.Vector3(), throttle: 0, riding: false, extras, paint,
      // 라이더가 앉을 자리 (로컬)
      seat: { hip: [0, 1.0, -0.12], chest: [0, 1.36, 0.06], neck: [0, 1.54, 0.14], head: [0, 1.7, 0.2],
        shL: [-0.2, 1.48, 0.1], shR: [0.2, 1.48, 0.1], elbowL: [-0.31, 1.2, 0.4], elbowR: [0.31, 1.2, 0.4], handL: [-0.32, 1.02, 0.62], handR: [0.32, 1.02, 0.62],
        kneeL: [-0.2, 0.72, 0.26], kneeR: [0.2, 0.72, 0.26], footL: [-0.28, 0.42, 0.06], footR: [0.28, 0.42, 0.06] } };
    parkBikeAtHome();
  }
  // 정상 식당 마당
  function parkBikeAtHome() {
    const B = S.bike;
    B.g.position.set(2.2, T.SUMMIT + 0.07, 2.6); B.g.rotation.set(0, 0.9, 0);
    B.vel.set(0, 0, 0); B.throttle = 0;
  }
  // 시작 선반, 등반가 오른쪽 2.2m
  function parkBikeAtStart() {
    const B = S.bike; const R0 = T.baseRadius(0.25) + T.surfaceRadius(0, 0.1) - T.baseRadius(0.1);
    const th = -2.3 / (R0 + 1.2);
    const r = R0 + 1.3;
    B.g.position.set(Math.cos(th) * r, 0.27, Math.sin(th) * r);
    B.g.rotation.set(0, Math.atan2(-Math.sin(th), Math.cos(th)), 0);   // 접선 방향을 본다
    B.vel.set(0, 0, 0); B.throttle = 0;
  }
  // 게임 쪽(RIDE)이 위치·속도·스로틀을 넣어 주면 바퀴·연기·소리만 여기서
  const _bx = new THREE.Vector3();
  function updateBike(dt, t, camPos) {
    const B = S.bike; if (!B) return;
    const sp = B.vel.length();
    B.spin += sp * dt * 3 + (B.throttle ? dt * 6 : 0);
    B.wf.rotation.x = B.spin; B.wb.rotation.x = B.spin * 1.05;
    B.hf.rotation.set(B.spin, 0, Math.PI / 2); B.hb.rotation.set(B.spin * 1.05, 0, Math.PI / 2);
    // 연기: 달릴 때 많이, 서 있으면 조금
    B.emitT -= dt;
    if (B.emitT <= 0) {
      B.emitT = B.throttle > 0.1 ? 0.06 : (B.riding ? 0.25 : 0.6);
      const p = B.puffs[B.next]; B.next = (B.next + 1) % B.puffs.length;
      _bx.set(0.2, 0.3, -0.85).applyQuaternion(B.g.quaternion).add(B.g.position);
      p.x = _bx.x; p.y = _bx.y; p.z = _bx.z; p.t = 0; p.s.visible = true;
    }
    for (const p of B.puffs) {
      if (!p.s.visible) continue;
      p.t += dt * 0.6; if (p.t >= 1) { p.s.visible = false; continue; }
      p.y += dt * 0.5; p.s.position.set(p.x, p.y, p.z);
      const sc = 0.4 + p.t * 2.0; p.s.scale.set(sc, sc, 1); p.s.material.opacity = 0.38 * (1 - p.t);
    }
    const d = camPos.distanceTo(B.g.position);
    if (window.AUDIO && AUDIO.engine) AUDIO.engine(B.riding ? 0 : d, B.riding ? 0.35 + 0.65 * B.throttle : 0.15);
  }

  // ── 매 프레임 ─────────────────────────────────────
  const _c1 = new THREE.Color(), _cBelow = new THREE.Color(0.70, 0.73, 0.76), _cIn = new THREE.Color(0.94, 0.95, 0.96), _cAbove = new THREE.Color(0.84, 0.82, 0.80);
  const _hzBelow = new THREE.Color(0.80, 0.76, 0.68), _hzAbove = new THREE.Color(0.93, 0.86, 0.76), _topBelow = new THREE.Color(0.30, 0.45, 0.68), _topAbove = new THREE.Color(0.22, 0.42, 0.72);
  // 하루: 8분. 0 = 한낮, 0.35 = 노을, 0.5~0.75 = 밤, 0.9 = 새벽
  const DAY = 480;
  const _sunDir = new THREE.Vector3(), _nightTop = new THREE.Color(0.03, 0.05, 0.10), _nightHz = new THREE.Color(0.10, 0.11, 0.16), _sunsetHz = new THREE.Color(0.98, 0.55, 0.30), _sunsetTop = new THREE.Color(0.25, 0.28, 0.5), _nightFog = new THREE.Color(0.08, 0.09, 0.12), _sunsetSun = new THREE.Color(1.0, 0.55, 0.3), _daySun = new THREE.Color(1.0, 0.86, 0.62);

  // ── 까마귀 떼 — 기종 단계(tier 0~4)가 오를수록 집 근처 떼가 는다: 6·8·10·12·14곳. 호버(4)는 마당에 더 가깝게
  let crowG = null;
  function spawnCrows(tier) {
    if (!crowG || !S.scene) return;
    for (const b of S.birds) S.scene.remove(b.g);
    S.birds.length = 0;
    const rr = NOISE.makeRng(9100 + tier);
    const houseN = 6 + 2 * tier, close = tier >= 4;
    const spots = [];
    for (let i = 0; i < houseN && S.huts.length; i++) {
      const h = S.huts[i % S.huts.length].pos;
      spots.push({ x: h.x + (rr() - 0.5) * 16, z: h.z + (rr() - 0.5) * 16, y: h.y + (close ? 2 + rr() * 5 : 4 + rr() * 10), r: close ? 6 + rr() * 6 : 9 + rr() * 8 });
    }
    for (let i = 0; i < 6; i++) { const a = rr() * Math.PI * 2, d = 25 + rr() * 120; spots.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, y: 40 + rr() * 200, r: 8 + rr() * 14 }); }
    for (const sp of spots) {
      const n = 3 + Math.floor(rr() * 3);
      for (let k = 0; k < n; k++) {
        const wl = new THREE.Mesh(crowG.bg, crowG.bm); wl.scale.set(1.7, 1, 1.7);
        const body = new THREE.Mesh(crowG.bodyG, crowG.bm);
        const grp = new THREE.Group(); grp.add(wl); grp.add(body); S.scene.add(grp);
        S.birds.push({ g: grp, w: wl, cx: sp.x, cz: sp.z, y: sp.y + (rr() - 0.5) * 4, r: sp.r * (0.8 + rr() * 0.4), ph: rr() * 7, sp: (0.35 + rr() * 0.2) * (rr() < 0.5 ? 1 : -1), fl: rr() * 6, pos: new THREE.Vector3() });
      }
    }
  }
  function update(dt, t, camPos, playerPos) {
    S.sky.position.copy(camPos);
    const y = camPos.y;
    const inCloud = smooth(CLOUD_Y - 16, CLOUD_Y - 3, y) * (1 - smooth(CLOUD_Y + 10, CLOUD_Y + 24, y));
    const above = smooth(CLOUD_Y + 8, CLOUD_Y + 30, y);
    // 시간
    const ph = 0.12;   // 낮으로 고정 — 밤·노을 없앰 (2026-09-02 "밤기능은 없는게 나은듯")
    const elev = Math.cos(ph * Math.PI * 2);                // 1 한낮 … -1 한밤
    const night = smooth(0.15, -0.25, elev);                // 0 낮 → 1 밤
    const sunset = Math.max(0, 1 - Math.abs(elev - 0.05) / 0.35) * (1 - night);
    S.night = night;
    const az = 0.72 + ph * Math.PI * 2 * 0.15;
    _sunDir.set(Math.cos(az) * 0.8, 0.15 + 0.6 * Math.max(-0.2, elev), Math.sin(az) * 0.8).normalize();
    const u = S.sky.material.uniforms;
    u.sunDir.value.copy(_sunDir);
    u.sunColor.value.copy(_daySun).lerp(_sunsetSun, sunset).multiplyScalar(1 - night);
    S.fog.density = (0.011 * (1 - above) + 0.0055 * above) * (1 + 0.4 * night) + inCloud * 0.03;   // 구름 속에서도 30m 앞은 보이게
    _c1.copy(_cBelow).lerp(_cAbove, above).lerp(_cIn, inCloud);
    _c1.lerp(_nightFog, night * (1 - inCloud * 0.6)); if (sunset > 0) _c1.lerp(_sunsetHz, sunset * 0.25);
    S.fog.color.copy(_c1);
    u.horizon.value.copy(_hzBelow).lerp(_hzAbove, above).lerp(_sunsetHz, sunset * 0.8).lerp(_nightHz, night);
    u.top.value.copy(_topBelow).lerp(_topAbove, above).lerp(_sunsetTop, sunset * 0.6).lerp(_nightTop, night);
    u.haze.value = inCloud * 0.9 + (1 - above) * 0.15;
    S.hemi.intensity = (1.0 + 0.4 * above + 0.6 * inCloud) * (1 - 0.85 * night);
    S.sun.intensity = (3.0 - 1.9 * inCloud) * (1 - night) * (1 - sunset * 0.3);
    S.sun.color.copy(_daySun).lerp(_sunsetSun, sunset);
    if (S.headlight) S.headlight.intensity = 60 * smooth(0.2, 0.7, night);
    for (const c of S.clouds) c.s.material.color.setScalar(1 - 0.8 * night);
    for (const s of S.sea) s.m.material.color.setScalar(1 - 0.8 * night);
    // 그림자 상자는 플레이어를 따라간다 (떨림 방지로 0.5m 스냅)
    const sx = Math.round(playerPos.x * 2) / 2, sy = Math.round(playerPos.y * 2) / 2, sz = Math.round(playerPos.z * 2) / 2;
    S.sun.target.position.set(sx, sy, sz);
    S.sun.position.set(sx + _sunDir.x * 60, sy + Math.max(0.15, _sunDir.y) * 60, sz + _sunDir.z * 60);
    // 구름
    for (const c of S.clouds) { c.s.position.x += c.vx * dt; if (c.s.position.x > 340) c.s.position.x = -340; c.s.position.y = c.baseY + Math.sin(t * 0.15 + c.ph) * 0.8; }
    for (const s of S.sea) { s.tex.offset.x += s.sp * dt; s.tex.offset.y += s.sp * 0.4 * dt; }
    // 새
    for (const b of S.birds) {
      const a = t * b.sp + b.ph;
      b.g.position.set(b.cx + Math.cos(a) * b.r, b.y + Math.sin(t * 0.5 + b.ph) * 2, b.cz + Math.sin(a) * b.r);
      b.pos.copy(b.g.position);
      b.g.rotation.y = -a + (b.sp < 0 ? Math.PI : 0);
      const fl = Math.sin(t * 9 + b.fl); b.w.rotation.x = 0; b.w.scale.y = 1; b.w.rotation.z = 0;
      b.w.geometry = b.w.geometry; b.w.rotation.x = fl * 0.5;
    }
    // 연기
    for (const s of S.smoke) {
      s.t += dt * 0.12; if (s.t > 1) s.t -= 1;
      const hx = S.house.position.x + Math.cos(S.house.rotation.y) * 0.9 - Math.sin(S.house.rotation.y) * -0.5;
      const hz = S.house.position.z - Math.sin(S.house.rotation.y) * 0.9 + Math.cos(S.house.rotation.y) * -0.5;
      s.s.position.set(hx + Math.sin(s.t * 6 + t * 0.3) * 0.4 + s.t * 1.2, T.SUMMIT + 3.7 + s.t * 5, hz + Math.cos(s.t * 5) * 0.3);
      const sc = 0.6 + s.t * 2.2; s.s.scale.set(sc, sc, 1); s.s.material.opacity = 0.32 * (1 - s.t) * Math.min(1, s.t * 6);
    }
    // 등불: 멀리서 크게, 가까이서 작게
    const d = camPos.distanceTo(S.lantern.position);
    const sc = Math.min(40, 2 + d * 0.06); S.lantern.scale.set(sc, sc, 1);
    S.lantern.material.opacity = (0.55 + 0.35 * Math.sin(t * 3.1) * 0.3 + 0.2) * (0.7 + 0.5 * S.night);
    S.lanternLight.intensity = 22 + Math.sin(t * 7) * 3;
    updateBike(dt, t, camPos);
  }

  // ── 먼지 입자 ─────────────────────────────────────
  const FX = (function () {
    const MAX = 400;
    const pos = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), life = new Float32Array(MAX);
    let mesh, next = 0;
    function init(scene) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ color: 0xcbb99e, size: 0.07, transparent: true, opacity: 0.8, depthWrite: false });
      mesh = new THREE.Points(g, m); mesh.frustumCulled = false; scene.add(mesh);
      for (let i = 0; i < MAX; i++) pos[i * 3 + 1] = -9999;
    }
    function dust(p, n) {
      for (let k = 0; k < n; k++) {
        const i = next; next = (next + 1) % MAX;
        pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
        vel[i * 3] = (Math.random() - 0.5) * 1.6; vel[i * 3 + 1] = Math.random() * 0.8 - 0.2; vel[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
        life[i] = 0.8 + Math.random() * 0.8;
      }
    }
    function update(dt) {
      for (let i = 0; i < MAX; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt; vel[i * 3 + 1] -= 6 * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (life[i] <= 0) pos[i * 3 + 1] = -9999;
      }
      mesh.geometry.attributes.position.needsUpdate = true;
    }
    return { init, dust, update };
  })();

  window.SCENERY = { init, initSky, update, S, CLOUD_Y, parkBikeAtStart, parkBikeAtHome, spawnCrows };
  window.FX = FX;
})();
