// 풍경 — 하늘, 햇빛, 먼 석주들, 발아래 구름바다, 새 (스카이라이더 scenery.js 에서 가져옴)
(function () {
  const T = TERRAIN;
  const rng = NOISE.makeRng(31337), N = NOISE.makeNoise(777), smooth = T.smooth;
  const S = { sun: null, hemi: null, sky: null, clouds: [], sea: [], birds: [], fog: null, pillars: [] };
  const CLOUD_Y = -62;

  function makeSky() {
    const mat = new THREE.ShaderMaterial({
      uniforms: { top: { value: new THREE.Color(0.27, 0.43, 0.68) }, horizon: { value: new THREE.Color(0.84, 0.80, 0.72) }, sunDir: { value: new THREE.Vector3(0.55, 0.42, 0.62).normalize() }, sunColor: { value: new THREE.Color(1.0, 0.86, 0.62) } },
      vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz - cameraPosition; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top, horizon, sunDir, sunColor; varying vec3 vW; void main(){ vec3 d = normalize(vW); float h = d.y; vec3 c = mix(horizon, top, smoothstep(-0.05, 0.55, h)); c = mix(c, horizon * 0.92, smoothstep(0.0, -0.4, h)); float s = max(0.0, dot(d, sunDir)); c += sunColor * (pow(s, 300.0) * 1.6 + pow(s, 12.0) * 0.28 + pow(s, 3.0) * 0.07); gl_FragColor = vec4(c, 1.0); }',
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat); m.renderOrder = -10; m.frustumCulled = false; return m;
  }
  function puffTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const dx = (x - 128) / 128, dy = (y - 128) / 128, r = Math.sqrt(dx * dx + dy * dy);
      const n = 0.5 + 0.5 * N.fbm3(x * 0.03, y * 0.03, 1.7, 3, 2.2, 0.55);
      const a = smooth(1.0, 0.25, r) * smooth(0.25, 0.75, n + (1 - r) * 0.35), i = (y * 256 + x) * 4;
      const sh = 238 + 17 * (1 - dy * 0.5);   // 아래쪽이 조금 어둡게
      img.data[i] = sh; img.data[i + 1] = sh - 3; img.data[i + 2] = sh - 6; img.data[i + 3] = Math.min(255, a * 255);
    }
    g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function seaTexture() {
    const W = 256, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d'), img = g.createImageData(W, W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const a1 = x / W * Math.PI * 2, a2 = y / W * Math.PI * 2;
      const n = 0.5 + 0.5 * N.fbm3(Math.cos(a1) * 2.2, Math.sin(a1) * 2.2 + Math.cos(a2) * 2.2, Math.sin(a2) * 2.2, 4, 2.1, 0.5);
      const a = smooth(0.28, 0.66, n), i = (y * W + x) * 4, sh = 228 + 27 * n;
      img.data[i] = sh; img.data[i + 1] = sh; img.data[i + 2] = sh + 4; img.data[i + 3] = a * 255;
    }
    g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function initSky(scene) {
    if (S.sky) return;
    S.sky = makeSky(); scene.add(S.sky);
    S.fog = new THREE.FogExp2(0xc4c4c2, 0.0055); scene.fog = S.fog;
    S.hemi = new THREE.HemisphereLight(0xc6d8f0, 0x5a5445, 1.05); scene.add(S.hemi);
    S.sun = new THREE.DirectionalLight(0xffe2b8, 3.0);
    S.sun.castShadow = true; S.sun.shadow.mapSize.set(2048, 2048);
    const sc = S.sun.shadow.camera; sc.left = sc.bottom = -14; sc.right = sc.top = 14; sc.near = 1; sc.far = 160;
    S.sun.shadow.bias = -0.0005; S.sun.shadow.normalBias = 0.035;
    scene.add(S.sun); scene.add(S.sun.target);
  }
  const _belowC = new THREE.Color(0x7d858a);
  const _rainC = new THREE.Color(0x7c8186), _flashC = new THREE.Color(0xeef2ff), _skyTop = new THREE.Color(0.27, 0.43, 0.68), _skyHor = new THREE.Color(0.84, 0.80, 0.72), _stormTop = new THREE.Color(0.30, 0.33, 0.37), _stormHor = new THREE.Color(0.55, 0.56, 0.57), _sunC = new THREE.Color(1.0, 0.86, 0.62), _zero = new THREE.Vector3();
  function makeRain(scene) {
    const n = 1400, pos = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) { const x = (Math.random() - 0.5) * 44, y = Math.random() * 30 - 12, z = (Math.random() - 0.5) * 44; pos.set([x, y, z, x, y + 0.6, z], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xc9d2dc, transparent: true, opacity: 0, depthWrite: false, fog: true })); m.frustumCulled = false; m.visible = false; scene.add(m); S.rain = m;
  }
  function init(scene) {
    initSky(scene); S.scene = scene; makeRain(scene);
    const rt = rockTex();
    const pillar = new THREE.Mesh(T.buildPillar(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, map: rt.map, bumpMap: rt.bump, bumpScale: 2.2 }));
    pillar.castShadow = true; pillar.receiveShadow = true; scene.add(pillar); S.pillar = pillar;
    // 정상 정자 (Meshy, 바위 받침 포함 — 받침을 마당에 반쯤 묻는다). 계단(+Z 면)이 잔도가 도착하는 쪽을 보게
    if (window.PROPS) PROPS.get('pavilion.glb', { rough: 0.85, metal: 0 }, m => {
      const sc = 3.2, thEnd = T.TH0 + T.NSEG * T.DTH;
      m.scale.setScalar(sc); m.position.set(0, T.SUMMIT - 0.5 + 0.947 * sc, 0); m.rotation.y = Math.PI / 2 - thEnd;
      scene.add(m); S.pavilion = m; S.pavilionDoor = thEnd;   // 계단이 향한 각(game.js 정자 충돌이 쓴다)
    });
    // 먼 석주들
    const lowMat = new THREE.MeshStandardMaterial({ color: 0x9a8a74, roughness: 1, map: rt.map, bumpMap: rt.bump, bumpScale: 1.5, flatShading: true });
    S.below = new THREE.Group(); S.below.visible = false; scene.add(S.below);
    const dmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: rt.map, bumpMap: rt.bump, bumpScale: 1.5 });
    const placed = [];
    for (let i = 0; i < 52; i++) {
      let ang, dist, rad, ok = false, tries = 0;
      while (!ok && tries++ < 30) {
        ang = rng() * Math.PI * 2; dist = 48 + Math.pow(rng(), 1.3) * 300; rad = 3 + rng() * 9;
        ok = dist > rad + 16;
        for (const p of placed) if (Math.hypot(Math.cos(ang) * dist - p.x, Math.sin(ang) * dist - p.z) < rad + p.r + 6) { ok = false; break; }
      }
      if (!ok) continue;
      const h = -20 + rng() * 150 * (0.45 + 0.55 * Math.min(1, dist / 110));
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
      const m = new THREE.Mesh(T.buildDistantPillar(1000 + i * 17, h, rad, -95, rng() < 0.3), dmat); m.position.set(x, 0, z); scene.add(m);
      placed.push({ x, z, r: rad }); S.pillars.push({ x, z, r: rad * 1.35, h });
      lowerPillar(x, z, rad);
      // 꼭대기 소나무 몇 그루
      if (h > 10 && rng() < 0.75) addPines(scene, x, h, z, rad * 0.55, 2 + Math.floor(rng() * 4));
    }
    for (let i = 0; i < 12; i++) {   // 아주 먼 산덩이
      const ang = rng() * Math.PI * 2, dist = 420 + rng() * 380, rad = 30 + rng() * 60;
      const m = new THREE.Mesh(T.buildDistantPillar(5000 + i * 31, 40 + rng() * 220, rad, -95), dmat); m.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist); scene.add(m);
    }
    // ── 구름 아래 협곡 (사장님 10/8 "바닥까지 떨어지게") — 줄이 끊겨 떨어질 때만 보인다. 바닥 y = T.BASE ──
    function lowerPillar(x, z, rad) {   // 먼 석주의 구름 아래 밑동 (위 석주는 -95 에서 끝난다)
      const g = new THREE.CylinderGeometry(rad * 1.25, rad * 2.0, -92 - T.BASE, 16, 14, true), P = g.attributes.position, sd = x * 0.13 + z * 0.07;
      for (let i = 0; i < P.count; i++) { const px = P.getX(i), py = P.getY(i), pz = P.getZ(i), k = 1 + 0.16 * N.noise3(px * 0.18 + sd, py * 0.04, pz * 0.18) + 0.06 * Math.sin(py * 0.25 + sd); P.setXYZ(i, px * k, py, pz * k); }   // 울퉁불퉁 + 지층
      g.computeVertexNormals(); const m = new THREE.Mesh(g, lowMat);
      m.position.set(x, (T.BASE - 92) / 2, z); S.below.add(m);
    }
    { const N2 = NOISE.makeNoise(9090), g = new THREE.PlaneGeometry(1800, 1800, 90, 90); g.rotateX(-Math.PI / 2);
      const P = g.attributes.position, cols = [], c = new THREE.Color();
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), z = P.getZ(i), d = Math.hypot(x, z), n = N2.fbm3(x * 0.012, 0, z * 0.012, 3, 2, 0.5);
        P.setY(i, -Math.abs(n) * 6 * Math.min(1, Math.max(0, (d - 26) / 30)));   // 바닥 판정은 평평(y=0), 울퉁불퉁은 아래로만
        c.setRGB(0.33, 0.31, 0.27).lerp(new THREE.Color(0.24, 0.3, 0.2), Math.max(0, n) * 1.4).multiplyScalar(0.85 + 0.3 * N2.noise3(x * 0.08, 1, z * 0.08)); cols.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      const tex = rt.map.clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(160, 160);
      const floor = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: tex })); floor.position.y = T.BASE; floor.receiveShadow = true; S.below.add(floor);
      // 굴러 떨어진 바위들
      const bg = new THREE.DodecahedronGeometry(1, 0), bm = new THREE.MeshStandardMaterial({ color: 0x6d6155, roughness: 1, flatShading: true });
      const rocks = new THREE.InstancedMesh(bg, bm, 140), o = new THREE.Object3D();
      for (let i = 0; i < 140; i++) { const a = rng() * Math.PI * 2, d = 24 + Math.pow(rng(), 1.6) * 380, s = 0.6 + rng() * 4; o.position.set(Math.cos(a) * d, T.BASE + s * 0.35, Math.sin(a) * d); o.rotation.set(rng() * 3, rng() * 3, rng() * 3); o.scale.set(s, s * (0.5 + rng() * 0.4), s * (0.8 + rng() * 0.4)); o.updateMatrix(); rocks.setMatrixAt(i, o.matrix); }
      rocks.castShadow = true; rocks.receiveShadow = true; S.below.add(rocks); }
    // 정상 소나무
    addPines(scene, 0, T.SUMMIT, 0, 6.6, 5, 4.4); flushPines(scene);   // 정자(반지름 약 3m) 바깥 고리에만
    // 발아래 구름바다
    const st = seaTexture();
    for (let i = 0; i < 3; i++) {
      const tex = st.clone(); tex.needsUpdate = true; tex.repeat.set(8 + i * 3, 8 + i * 3);
      const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.97 - i * 0.22, color: 0xffffff });
      const m = new THREE.Mesh(new THREE.CircleGeometry(1100, 48), mat); m.rotation.x = -Math.PI / 2; m.position.y = CLOUD_Y - 8 + i * 7; m.renderOrder = 2;
      scene.add(m); S.sea.push({ m, tex, sp: 0.004 + i * 0.003 });
    }
    const under = new THREE.Mesh(new THREE.CircleGeometry(1400, 32), new THREE.MeshBasicMaterial({ color: 0xd8d8d6, fog: false, side: THREE.DoubleSide }));   // 밑에서 보면 흐린 구름 천장 under.rotation.x = -Math.PI / 2; under.position.y = CLOUD_Y - 12; scene.add(under);
    const pt = puffTexture();
    function puff(x, y, z, sc, op) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pt, transparent: true, opacity: op, depthWrite: false, color: 0xfff8f0 }));
      s.position.set(x, y, z); s.scale.set(sc * (1.2 + rng() * 0.5), sc, 1); s.renderOrder = 3; scene.add(s);
      S.clouds.push({ s, vx: 0.25 + rng() * 0.4, baseY: y, ph: rng() * 6 });
    }
    for (let i = 0; i < 120; i++) { const a = rng() * Math.PI * 2, d = 14 + rng() * 340; puff(Math.cos(a) * d, CLOUD_Y + rng() * 14, Math.sin(a) * d, 16 + rng() * 34, 0.8 + rng() * 0.2); }
    for (let i = 0; i < 26; i++) { const a = rng() * Math.PI * 2, d = 60 + rng() * 220; puff(Math.cos(a) * d, -40 + rng() * 60, Math.sin(a) * d, 10 + rng() * 20, 0.25 + rng() * 0.2); }
    for (let i = 0; i < 24; i++) { const a = rng() * Math.PI * 2, d = 30 + rng() * 300; puff(Math.cos(a) * d, 80 + rng() * 80, Math.sin(a) * d, 14 + rng() * 26, 0.25 + rng() * 0.2); }
    // 새 (먼 곳을 맴도는 매)
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.Float32BufferAttribute([-0.7, 0, 0, 0, 0, 0.15, 0, 0, -0.15, 0.7, 0, 0, 0, 0, -0.15, 0, 0, 0.15], 3));
    const bm = new THREE.MeshBasicMaterial({ color: 0x1a1816, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(bg, bm); scene.add(m); S.birds.push({ m, r: 18 + rng() * 40, y: -10 + rng() * 60, a: rng() * 6, sp: (0.08 + rng() * 0.08) * (rng() < 0.5 ? 1 : -1), ph: rng() * 6 }); }
  }
  // 사암 무늬 (이음매 없이 반복): 바탕 얼룩 · 지층 줄(아래에 밝은 턱) · 세로 갈라짐 · 빗물 자국 · 알갱이. 색은 꼭짓점 색이 내고 여기선 밝기만
  function rockTex() {
    const W = 512, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const N2 = NOISE.makeNoise(4242), R = NOISE.makeRng(77);
    const img = g.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const a = x / W * Math.PI * 2, b = y / H * Math.PI * 2;
      const n1 = N2.fbm3(Math.cos(a) * 1.4 + Math.cos(b) * 0.4, Math.sin(a) * 1.4, Math.sin(b) * 1.4 + 2.3, 4, 2.1, 0.5);
      const n2 = N2.noise3(Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(b) * 1.5 + Math.sin(b) * 1.5);   // 세로로 길쭉한 얼룩
      let v = 0.8 + n1 * 0.14 + n2 * 0.05 + (R() - 0.5) * 0.06;
      const i = (y * W + x) * 4, k = Math.max(0, Math.min(255, Math.round(v * 235)));
      d[i] = Math.min(255, k + 5); d[i + 1] = k; d[i + 2] = Math.max(0, k - 6); d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const wrapDraw = fn => { for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) { g.save(); g.translate(ox, oy); fn(); g.restore(); } };
    // 빗물 자국: 위에서 아래로 흐른 옅은 세로 줄
    g.filter = 'blur(5px)';
    for (let k = 0; k < 30; k++) { const x = R() * W, w = 6 + R() * 22, al = 0.05 + R() * 0.08; wrapDraw(() => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(40,30,22,' + al + ')'); gr.addColorStop(0.5, 'rgba(40,30,22,' + al * 0.4 + ')'); gr.addColorStop(1, 'rgba(40,30,22,' + al + ')'); g.fillStyle = gr; g.fillRect(x, 0, w, H); }); }
    g.filter = 'none';
    // 지층 줄: 이음매 없는 물결(정수 배 사인)
    const beds = 4;
    for (let k = 0; k < beds; k++) {
      const y0 = (k + 0.2 + R() * 0.5) * H / beds, f1 = 1 + Math.floor(R() * 3), f2 = 3 + Math.floor(R() * 4), p1 = R() * 6, p2 = R() * 6, amp = 4 + R() * 10, wdt = 1 + R() * 2.2, st = 0.1 + R() * 0.16;
      const yy = x => y0 + Math.sin(x / W * Math.PI * 2 * f1 + p1) * amp + Math.sin(x / W * Math.PI * 2 * f2 + p2) * amp * 0.35;
      const gaps = [R() * 60];
      wrapDraw(() => {
        // 줄은 끊어진 토막들 (이어진 고리처럼 보이면 나무 나이테가 된다)
        for (let x0 = gaps[0]; x0 < W; ) { const len = 40 + ((x0 * 7.3 + k * 31) % 90), x1 = Math.min(W, x0 + len);
          g.beginPath(); for (let x = x0; x <= x1; x += 6) g.lineTo(x, yy(x)); g.strokeStyle = 'rgba(38,26,18,' + st + ')'; g.lineWidth = wdt; g.stroke();
          g.beginPath(); for (let x = x0; x <= x1; x += 6) g.lineTo(x, yy(x) + wdt + 1.5); g.strokeStyle = 'rgba(255,246,228,.12)'; g.lineWidth = 2; g.stroke();
          x0 = x1 + 25 + ((x0 * 3.7 + k * 13) % 70); }
      });
    }
    // 세로 갈라짐: 아래로 내려가며 조금씩 꺾이는 선
    for (let k = 0; k < 12; k++) {
      let x = R() * W, y = R() * H; const len = 50 + R() * 170, pts = [[x, y]];
      for (let s = 0; s < len; s += 10) { x += (R() - 0.5) * 6; y += 10; pts.push([x, y]); }
      const lw = 0.8 + R() * 1.8;
      wrapDraw(() => { g.beginPath(); pts.forEach(p => g.lineTo(p[0], p[1])); g.strokeStyle = 'rgba(30,22,16,.2)'; g.lineWidth = lw; g.stroke(); g.beginPath(); pts.forEach(p => g.lineTo(p[0] + lw + 0.8, p[1])); g.strokeStyle = 'rgba(255,245,225,.16)'; g.lineWidth = 1; g.stroke(); });
    }
    // 알갱이·구멍
    for (let k = 0; k < 420; k++) { const x = R() * W, y = R() * H, r = 0.5 + R() * 1.0; g.fillStyle = R() < 0.55 ? 'rgba(40,28,20,.35)' : 'rgba(255,248,232,.28)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    const map = new THREE.CanvasTexture(c); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
    const bump = new THREE.CanvasTexture(c); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    return { map, bump };
  }
  // 소나무 — 줄기 + 층층 원뿔 (화산 바위의 소나무)
  let pineG = null;
  function addPines(scene, cx, y, cz, spread, n, inner) {
    inner = inner || 0;
    if (!pineG) pineG = { trunk: new THREE.CylinderGeometry(0.12, 0.2, 1, 6), leaf: new THREE.ConeGeometry(1, 1, 7), tm: new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 }), lm: new THREE.MeshStandardMaterial({ color: 0x2f4a2a, roughness: 1, flatShading: true }), T: [], L: [] };
    for (let k = 0; k < n; k++) {
      const a = rng() * Math.PI * 2, d = inner + rng() * (spread - inner), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, h = 3 + rng() * 4, lean = (rng() - 0.5) * 0.4;
      const g = new THREE.Object3D(); g.position.set(x, y - 0.2, z); g.rotation.set(lean, rng() * 6, (rng() - 0.5) * 0.3); g.updateMatrix();
      const tr = new THREE.Object3D(); tr.scale.set(1, h, 1); tr.position.y = h / 2; tr.updateMatrix(); pineG.T.push(g.matrix.clone().multiply(tr.matrix));
      for (let j = 0; j < 3; j++) { const l = new THREE.Object3D(); const w = (1.7 - j * 0.4) * (0.8 + rng() * 0.4); l.scale.set(w, 0.9, w * 0.8); l.position.set((rng() - 0.5) * 0.5, h * (0.55 + j * 0.2), (rng() - 0.5) * 0.5); l.updateMatrix(); pineG.L.push(g.matrix.clone().multiply(l.matrix)); }
    }
  }
  // 소나무는 줄기·잎 두 덩어리로 한꺼번에 그린다
  function flushPines(scene) {
    if (!pineG) return;
    for (const [list, geo, mat] of [[pineG.T, pineG.trunk, pineG.tm], [pineG.L, pineG.leaf, pineG.lm]]) {
      const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere && im.computeBoundingSphere(); im.frustumCulled = false; scene.add(im);
    }
  }
  function update(dt, t, camPos) {
    // 햇빛과 그림자 상자가 카메라를 따라간다
    const sd = new THREE.Vector3(0.55, 0.42, 0.62).normalize();
    S.sun.position.copy(camPos).addScaledVector(sd, 60); S.sun.target.position.copy(camPos); S.sun.target.updateMatrixWorld();
    // 구름 밑: 하늘 대신 흐린 회색, 안개 짙게, 빛 약하게
    const bk = Math.min(1, Math.max(0, (CLOUD_Y - 4 - camPos.y) / 16));
    if (S.below) S.below.visible = camPos.y < CLOUD_Y + 6;
    // 비(S.wDark 0~1)는 하늘·안개를 잿빛으로, 번개(S.flash)는 잠깐 하얗게 (game.js 위험이 정한다)
    const wd = S.wDark || 0, fl = S.flash || 0;
    if (bk !== S.bk || wd !== S.wd0 || fl !== S.fl0) {
      S.bk = bk; S.wd0 = wd; S.fl0 = fl;
      S.fog.color.set(0xc4c4c2).lerp(_rainC, wd * 0.85).lerp(_belowC, bk).lerp(_flashC, fl * 0.6); S.fog.density = 0.0055 + bk * 0.0035 + wd * 0.007;
      S.sky.visible = bk < 0.5; if (S.scene) S.scene.background = bk >= 0.5 ? S.fog.color : null;
      const u = S.sky.material.uniforms; u.top.value.copy(_skyTop).lerp(_stormTop, wd).lerp(_flashC, fl * 0.7); u.horizon.value.copy(_skyHor).lerp(_stormHor, wd).lerp(_flashC, fl * 0.7); u.sunColor.value.copy(_sunC).multiplyScalar(1 - wd * 0.85);
      S.hemi.intensity = 1.05 * (1 - bk * 0.45) * (1 - wd * 0.4) + fl * 3; S.sun.intensity = 3.0 * (1 - bk * 0.7) * (1 - wd * 0.72) + fl * 1.5;
    }
    // 빗줄기: 카메라 둘레 상자 안에서 떨어지고, 바닥에 닿으면 위로 돌려 보낸다. 바람만큼 기운다
    const ra = S.rainAmt || 0;
    if (S.rain) {
      S.rain.visible = ra > 0.01; S.rain.material.opacity = Math.min(0.55, ra * 0.55);
      if (S.rain.visible) {
        const P = S.rain.geometry.attributes.position, a = P.array, n = P.count / 2, wv = S.windV || _zero, sp = 22 + ra * 6, L = 0.45 + ra * 0.35;
        for (let i = 0; i < n; i++) {
          const j = i * 6; let x = a[j], y = a[j + 1], z = a[j + 2];
          y -= sp * dt; x += wv.x * 1.6 * dt; z += wv.z * 1.6 * dt;
          if (y < camPos.y - 14 || Math.abs(x - camPos.x) > 22 || Math.abs(z - camPos.z) > 22) { x = camPos.x + (Math.random() - 0.5) * 44; z = camPos.z + (Math.random() - 0.5) * 44; y = camPos.y + 6 + Math.random() * 14; }
          a[j] = x; a[j + 1] = y; a[j + 2] = z; a[j + 3] = x - wv.x * 0.05; a[j + 4] = y + L; a[j + 5] = z - wv.z * 0.05;
        }
        P.needsUpdate = true;
      }
    }
    S.sky.position.copy(camPos);
    for (const s of S.sea) s.tex.offset.x += s.sp * dt;
    for (const c of S.clouds) { c.s.position.x += c.vx * dt; if (c.s.position.x > 380) c.s.position.x -= 760; c.s.position.y = c.baseY + Math.sin(t * 0.2 + c.ph) * 0.6; }
    for (const b of S.birds) { b.a += b.sp * dt; b.m.position.set(Math.cos(b.a) * b.r, b.y + Math.sin(t * 0.5 + b.ph) * 2, Math.sin(b.a) * b.r); b.m.rotation.y = -b.a + (b.sp > 0 ? 0 : Math.PI); b.m.scale.y = 1; const f = Math.sin(t * 6 + b.ph); b.m.rotation.z = f * 0.25; }
  }
  window.WORLD = { S, initSky, init, update, CLOUD_Y };
})();
