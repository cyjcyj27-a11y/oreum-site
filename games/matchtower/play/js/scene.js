// 장면: 70년대 다방 탁자 위. 단위는 cm. 그림은 전부 코드 캔버스로 그린다.
(function () {
  const T = THREE;
  const SC = (window.SC = {});
  const cv = document.getElementById('cv');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  const MOBILE = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  SC.MOBILE = MOBILE;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 1.5));
  R.toneMapping = T.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.0;
  R.shadowMap.enabled = true;
  R.shadowMap.type = T.PCFSoftShadowMap;
  SC.renderer = R;

  const scene = new T.Scene();
  SC.scene = scene;
  scene.background = new T.Color(0x1a0f0a);

  const cam = new T.PerspectiveCamera(40, 1, 0.5, 1500);
  SC.camera = cam;

  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }
  SC.rng = rng;
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function tex(c, data) {
    const t = new T.CanvasTexture(c);
    if (!data) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    return t;
  }

  // ---------- 환경맵: 호박색 다방 안을 구워서 유리·도자기·광택이 방을 비추게 ----------
  (function env() {
    const es = new T.Scene();
    const c = cvs(16, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#2a1810'); g.addColorStop(0.4, '#6a3e22'); g.addColorStop(0.52, '#3a2214'); g.addColorStop(1, '#120a06');
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
    es.add(new T.Mesh(new T.SphereGeometry(10, 32, 16), new T.MeshBasicMaterial({ map: t, side: T.BackSide })));
    // 머리 위 등 두 개 + 창
    for (const [px, pz] of [[-2, 1], [3, -2]]) {
      const p = new T.Mesh(new T.CircleGeometry(1.2, 24), new T.MeshBasicMaterial({ color: new T.Color(4, 2.4, 1.1) }));
      p.position.set(px, 7, pz); p.lookAt(0, 0, 0); es.add(p);
    }
    const w = new T.Mesh(new T.PlaneGeometry(5, 3), new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.0, 1.6) }));
    w.position.set(-8, 3, -5); w.lookAt(0, 0, 0); es.add(w);
    const pm = new T.PMREMGenerator(R);
    scene.environment = pm.fromScene(es, 0.03).texture;
    pm.dispose();
  })();

  // ---------- 빛: 머리 위 주황 갓등 + 창에서 드는 오후 빛 ----------
  scene.add(new T.HemisphereLight(0xffe0b8, 0x2a160c, 0.55));
  const key = new T.DirectionalLight(0xffd2a0, 2.5);
  key.position.set(-30, 90, 25);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -50; key.shadow.camera.right = 50;
  key.shadow.camera.top = 50; key.shadow.camera.bottom = -50;
  key.shadow.camera.near = 20; key.shadow.camera.far = 220;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 2.5;
  scene.add(key, key.target);
  SC.key = key;
  const fill = new T.DirectionalLight(0xa8c0ff, 0.45);
  fill.position.set(60, 30, -50);
  scene.add(fill);
  // 갓등 웅덩이 빛 (탁자 가운데만 살짝 더 밝게)
  const pool = new T.SpotLight(0xffb070, 1600, 160, 0.55, 0.8, 1.6);
  pool.position.set(4, 95, -6);
  pool.target.position.set(0, 0, 0);
  scene.add(pool, pool.target);

  // ---------- 나뭇결 ----------
  function woodCanvas(W, H, base, dark, light, seed, lines, amp) {
    const c = cvs(W, H), x = c.getContext('2d'), r = rng(seed);
    const rgb = (a, al) => 'rgba(' + a.map((v) => Math.max(0, Math.min(255, v | 0))).join(',') + ',' + (al == null ? 1 : al) + ')';
    x.fillStyle = rgb(base); x.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const y = r() * H, h = H * (0.03 + r() * 0.1);
      const g = x.createLinearGradient(0, y - h, 0, y + h);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, rgb(r() < 0.5 ? dark : light, 0.12 + r() * 0.14)); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, y - h, W, h * 2);
    }
    const fr = 0.0012 + r() * 0.002, ph = r() * 6.28;
    for (let i = 0; i < lines; i++) {
      const y0 = (i / lines) * H + (r() - 0.5) * 4, late = r() < 0.3;
      x.strokeStyle = rgb(late ? dark : dark.map((v, k) => (v + base[k]) / 2), late ? 0.25 + r() * 0.3 : 0.08 + r() * 0.12);
      x.lineWidth = late ? 0.8 + r() * 1.6 : 0.5 + r() * 0.7;
      x.beginPath();
      for (let u = -10; u <= W + 10; u += 10) {
        const y = y0 + Math.sin(u * fr + ph + y0 * 0.005) * amp + Math.sin(u * fr * 3.3 + y0 * 0.02) * amp * 0.2;
        u < 0 ? x.moveTo(u, y) : x.lineTo(u, y);
      }
      x.stroke();
    }
    return c;
  }
  SC.woodCanvas = woodCanvas;

  // ---------- 탁자: 짙은 마호가니 + 유리판(광택 겹) + 놋쇠 띠 ----------
  const TW = 90, TD = 56, TT = 3;
  SC.TABLE = { w: TW, d: TD, t: TT };
  const topC = woodCanvas(2048, 1280, [74, 40, 24], [32, 14, 8], [112, 66, 40], 71, 320, 10);
  (function doily() {
    // 커피잔 받침 밑 코바늘 레이스 (유리 밑에 깔린 것)
    const x = topC.getContext('2d');
    const cx = (-19 / TW + 0.5) * 2048, cy = (-13 / TD + 0.5) * 1280, R0 = 12 / TW * 2048;
    x.save();
    x.translate(cx, cy);
    x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
    x.fillStyle = 'rgba(244,236,220,.94)';
    x.beginPath();
    for (let a = 0; a <= 360; a += 2) {
      const k = a * Math.PI / 180, rr = R0 * (0.94 + 0.06 * Math.cos(k * 24));
      a ? x.lineTo(Math.cos(k) * rr, Math.sin(k) * rr) : x.moveTo(rr, 0);
    }
    x.fill();
    x.shadowColor = 'transparent';
    // 구멍 무늬: 동심원 고리마다 작은 구멍을 뚫어 레이스처럼
    x.globalCompositeOperation = 'destination-out';
    for (let ring = 1; ring < 7; ring++) {
      const rr = R0 * (0.16 + ring * 0.12), n = 8 + ring * 8, hole = R0 * (0.018 + ring * 0.004);
      for (let i = 0; i < n; i++) {
        const k = (i / n) * Math.PI * 2 + ring * 0.2;
        x.beginPath(); x.ellipse(Math.cos(k) * rr, Math.sin(k) * rr, hole * 1.5, hole, k, 0, 7); x.fill();
      }
    }
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = 'rgba(200,188,166,.7)'; x.lineWidth = 1.2;
    for (let ring = 1; ring < 8; ring++) { x.beginPath(); x.arc(0, 0, R0 * (0.1 + ring * 0.12), 0, 7); x.stroke(); }
    for (let i = 0; i < 24; i++) { const k = i / 24 * Math.PI * 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(k) * R0 * 0.93, Math.sin(k) * R0 * 0.93); x.stroke(); }
    x.restore();
  })();
  const topTex = tex(topC);
  const topMat = new T.MeshPhysicalMaterial({ map: topTex, roughness: 0.55, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.9 });
  (function table() {
    const s = new T.Shape(), rr = 3, w = TW / 2, d = TD / 2;
    s.moveTo(-w + rr, -d); s.lineTo(w - rr, -d); s.quadraticCurveTo(w, -d, w, -d + rr); s.lineTo(w, d - rr); s.quadraticCurveTo(w, d, w - rr, d);
    s.lineTo(-w + rr, d); s.quadraticCurveTo(-w, d, -w, d - rr); s.lineTo(-w, -d + rr); s.quadraticCurveTo(-w, -d, -w + rr, -d);
    const g = new T.ExtrudeGeometry(s, { depth: TT - 0.8, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 3, curveSegments: 8 });
    // 윗면 UV 를 판 전체 좌표로
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / TW + 0.5, p.getY(i) / TD + 0.5);
    g.rotateX(-Math.PI / 2);
    g.translate(0, -TT + 0.4, 0);
    const top = new T.Mesh(g, topMat);
    top.receiveShadow = true; top.castShadow = true;
    scene.add(top);
    // 놋쇠 띠
    const brass = new T.MeshStandardMaterial({ color: 0xc89a48, metalness: 1, roughness: 0.28, envMapIntensity: 1.2 });
    const band = new T.Mesh(new T.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false, curveSegments: 8 }), brass);
    band.geometry.rotateX(-Math.PI / 2);
    band.scale.set(1.012, 1, 1.02);
    band.position.y = -TT + 0.6;
    scene.add(band);
    // 다리·밑판
    const legM = new T.MeshStandardMaterial({ color: 0x2a140a, roughness: 0.5 });
    for (const [lx, lz] of [[-38, -22], [38, -22], [-38, 22], [38, 22]]) {
      const l = new T.Mesh(new T.CylinderGeometry(1.8, 1.4, 70, 16), legM);
      l.position.set(lx, -TT - 35, lz); scene.add(l);
    }
    // 바닥: 70년대 체크 타일
    const fc = cvs(512, 512), fx = fc.getContext('2d');
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { fx.fillStyle = (i + j) % 2 ? '#3a2a20' : '#8a6a4a'; fx.fillRect(i * 64, j * 64, 64, 64); }
    const ft = tex(fc); ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(12, 12);
    const floor = new T.Mesh(new T.PlaneGeometry(600, 600), new T.MeshStandardMaterial({ map: ft, roughness: 0.4, color: 0x6a5040 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -72; floor.receiveShadow = true;
    scene.add(floor);
  })();

  // ---------- 성냥 ----------
  const ML = 4.6, MW = 0.22, HEAD_X = 2.22, HEAD_R = 0.16;
  SC.MATCH = { L: ML, W: MW, HEAD_X, HEAD_R };
  const stickC = (function () {
    const c = cvs(512, 64), x = c.getContext('2d'), r = rng(9);
    x.fillStyle = '#e8cf9c'; x.fillRect(0, 0, 512, 64);
    for (let i = 0; i < 40; i++) {
      x.strokeStyle = 'rgba(150,104,52,' + (0.08 + r() * 0.2) + ')';
      x.lineWidth = 0.5 + r();
      const y = r() * 64;
      x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(170, y + (r() - 0.5) * 6, 340, y + (r() - 0.5) * 6, 512, y + (r() - 0.5) * 4); x.stroke();
    }
    return c;
  })();
  const stickTex = tex(stickC);
  const stickMat = new T.MeshStandardMaterial({ map: stickTex, roughness: 0.78, envMapIntensity: 0.5 });
  const stickGeo = (function () {
    // 모서리를 살짝 죽인 네모 막대 (결이 길이 방향)
    const g = new T.BoxGeometry(ML - 0.1, MW, MW, 4, 1, 1);
    return g;
  })();
  const headMat = new T.MeshStandardMaterial({ color: 0x8e1c14, roughness: 0.5, metalness: 0, envMapIntensity: 0.9 });
  const headGeo = (function () {
    const g = new T.SphereGeometry(1, 18, 12);
    const p = g.attributes.position, r = rng(4);
    for (let i = 0; i < p.count; i++) {
      const k = 1 + (r() - 0.5) * 0.08;
      // 끝이 둥글고 막대 쪽으로 가늘어지는 물방울 모양
      let X = p.getX(i), Y = p.getY(i) * k, Z = p.getZ(i) * k;
      const taper = X < 0 ? 1 + X * 0.28 : 1;
      p.setXYZ(i, X * 0.27, Y * 0.168 * taper, Z * 0.168 * taper);
    }
    g.computeVertexNormals();
    g.translate(HEAD_X, 0, 0);
    return g;
  })();
  SC.makeMatches = function (max) {
    const st = new T.InstancedMesh(stickGeo, stickMat, max);
    const hd = new T.InstancedMesh(headGeo, headMat, max);
    for (const m of [st, hd]) { m.castShadow = true; m.receiveShadow = true; m.count = 0; m.frustumCulled = false; scene.add(m); }
    // 막대마다 색을 조금씩
    const col = new T.Color(), r = rng(12);
    for (let i = 0; i < max; i++) { const k = 0.9 + r() * 0.14; st.setColorAt(i, col.setRGB(k, k * (0.97 + r() * 0.04), k * (0.92 + r() * 0.08))); }
    st.instanceColor.needsUpdate = true;
    return { st, hd };
  };

  // ---------- 탁자 소품 (충돌 모양은 game.js 가 SC.PROPS 를 읽어 만든다) ----------
  SC.PROPS = [];
  const porcelain = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.16, clearcoat: 0.9, clearcoatRoughness: 0.06, envMapIntensity: 1.3, emissive: 0x2a2622 });
  const gold = new T.MeshStandardMaterial({ color: 0xd8a848, metalness: 1, roughness: 0.25 });
  function lathe(pts, seg, mat) {
    const m = new T.Mesh(new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), seg), mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  // 커피잔 + 받침 (레이스 위)
  (function cup() {
    const g = new T.Group();
    // 두툼한 흰 도자기 잔 (금테·무늬 없음) + 넓은 민무늬 받침
    const saucer = lathe([[0, 0], [3.6, 0], [3.9, 0.2], [4.3, 0.28], [5.6, 0.5], [7.2, 0.95], [7.9, 1.25], [8.05, 1.38], [7.9, 1.45], [7.2, 1.2], [5.6, 0.78], [4.6, 0.62], [4.3, 0.7], [3.9, 0.62], [0, 0.6]], 64, porcelain);
    g.add(saucer);
    const body = lathe([[0, 0.62], [2.5, 0.62], [2.9, 0.75], [3.35, 1.2], [3.7, 2.0], [3.9, 3.4], [4.02, 5.2], [4.1, 6.55], [4.08, 6.85], [3.9, 6.95], [3.7, 6.8], [3.62, 5.2], [3.48, 3.2], [3.15, 1.9], [2.5, 1.35], [0, 1.28]], 64, porcelain);
    g.add(body);
    // 연한 다방커피 (우유 섞인 갈색)
    const coffee = new T.Mesh(new T.CircleGeometry(3.66, 48), new T.MeshStandardMaterial({ color: 0x86705e, roughness: 0.2, envMapIntensity: 1.0 }));
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = 6.1; g.add(coffee);
    const crema = new T.Mesh(new T.RingGeometry(3.3, 3.66, 48), new T.MeshStandardMaterial({ color: 0xc9a27c, roughness: 0.35, transparent: true, opacity: 0.55 }));
    crema.rotation.x = -Math.PI / 2; crema.position.y = 6.105; g.add(crema);
    // 두툼한 고리 손잡이
    const handle = new T.Mesh(new T.TorusGeometry(1.35, 0.42, 14, 28, Math.PI * 1.3), porcelain);
    handle.position.set(4.05, 4.1, 0); handle.rotation.z = -Math.PI * 0.65; handle.castShadow = true; g.add(handle);
    // 찻숟가락
    const spoon = new T.Group();
    const sb = new T.Mesh(new T.BoxGeometry(7, 0.12, 0.5), new T.MeshStandardMaterial({ color: 0xf2eee6, metalness: 0.75, roughness: 0.22, envMapIntensity: 2.2 }));
    const bowl = new T.Mesh(new T.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), sb.material);
    bowl.scale.set(1.3, 0.3, 0.85); bowl.position.set(-4.1, -0.02, 0);
    spoon.add(sb, bowl); spoon.position.set(1.8, 1.45, 5.6); spoon.rotation.y = 0.35; spoon.rotation.z = 0.05;
    spoon.traverse((o) => (o.castShadow = true));
    g.add(spoon);
    g.position.set(-19, 0, -13);
    g.rotation.y = 0.6;
    scene.add(g);
    SC.PROPS.push({ type: 'cyl', x: -19, z: -13, r: 7.9, h: 1.3 }, { type: 'cyl', x: -19, z: -13, r: 4.1, h: 6.95 });
  })();

  // 두꺼운 유리 재떨이 (팔각) + 다 탄 성냥 하나
  (function ashtray() {
    // 크리스털 재떨이 (사장님 사진): 둥근 몸통, 가장자리 톱니 16개, 안쪽 벽 다이아몬드 무늬, 매끈한 둥근 바닥
    const crystal = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.0, metalness: 0, transmission: 0.3, thickness: 0.8, ior: 1.6, emissive: 0x3a3632, sheen: 1, sheenColor: new T.Color(0xffffff), sheenRoughness: 0.3,
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 3.2, specularIntensity: 1, specularColor: new T.Color(1, 1, 1), flatShading: true });
    const N = 16; // 톱니 수
    // 옆모습: 바깥 바닥 → 바깥 벽 → 윗단 → 안쪽 벽 → 안쪽 바닥
    const prof = [[0, 0], [5.6, 0], [6.1, 0.15], [6.5, 0.7], [6.85, 1.6], [7.0, 2.5], [6.95, 3.05], [6.5, 3.25], [5.7, 3.25], [5.35, 2.9], [4.9, 2.1], [4.35, 1.35], [3.9, 1.1], [0, 1.08]];
    const INNER = [9, 10, 11]; // 안쪽 벽 (다이아몬드 무늬)
    const RIM = [5, 6, 7, 8]; // 윗단 (톱니)
    const SEG = N * 4;
    const g = new T.LatheGeometry(prof.map((p) => new T.Vector2(p[0], p[1])), SEG);
    const pos = g.attributes.position;
    const NP = prof.length;
    for (let i = 0; i < pos.count; i++) {
      const pi = i % NP, si = Math.floor(i / NP);
      const th = (si / SEG) * Math.PI * 2;
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
      if (r < 1e-4) continue;
      let k = 1, dy = 0;
      const ph = ((si % 4) / 4); // 톱니 하나 안에서 0..1
      const tri = 1 - Math.abs(ph * 2 - 1); // 0 → 1 → 0
      if (RIM.includes(pi)) { k = 1 - 0.07 * (1 - tri); dy = pi >= 6 ? -0.28 * (1 - tri) : 0; } // 골은 안으로 들어가고 낮다
      if (INNER.includes(pi)) k = 1 + (pi === 10 ? 0.1 : 0.05) * (si % 2 ? 1 : -0.6); // 안쪽 벽 지그재그 = 다이아몬드 컷
      if (pi === 3 || pi === 4) k = 1 + 0.035 * (si % 2 ? 1 : -1); // 바깥 벽 세로 골
      pos.setXYZ(i, x * k, pos.getY(i) + dy, z * k);
    }
    g.computeVertexNormals();
    const a = new T.Mesh(g, crystal);
    a.castShadow = false; a.receiveShadow = true;
    a.position.set(22, 0, -4);
    scene.add(a);
    // 유리 밑 옅은 그림자와 빛 모임
    const sc = cvs(128, 128), sx = sc.getContext('2d');
    const gg = sx.createRadialGradient(64, 64, 10, 64, 64, 64);
    gg.addColorStop(0, 'rgba(255,240,220,.18)'); gg.addColorStop(0.6, 'rgba(0,0,0,.28)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = gg; sx.fillRect(0, 0, 128, 128);
    const sh = new T.Mesh(new T.PlaneGeometry(17, 17), new T.MeshBasicMaterial({ map: tex(sc), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(22.6, 0.04, -3.5); scene.add(sh);

    // --- 담배: 톱니 골 하나에 걸쳐, 재 끝은 안쪽으로 ---
    const cg = new T.Group();
    const CR = 0.4, PL = 5.8, FL = 2.6;
    const pc = cvs(256, 64), px = pc.getContext('2d');
    px.fillStyle = '#f7f5ef'; px.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 256; i += 3) { px.fillStyle = 'rgba(200,195,185,' + (0.12 + Math.random() * 0.1) + ')'; px.fillRect(i, 0, 1, 64); }
    px.fillStyle = 'rgba(190,185,170,.5)'; px.fillRect(0, 30, 256, 2);
    const paper = new T.MeshStandardMaterial({ map: tex(pc), roughness: 0.8 });
    const fc = cvs(256, 64), fx = fc.getContext('2d');
    fx.fillStyle = '#d98a3a'; fx.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 900; i++) { fx.fillStyle = Math.random() < 0.5 ? 'rgba(150,80,20,.55)' : 'rgba(250,200,130,.5)'; fx.fillRect(Math.random() * 256, Math.random() * 64, 2, 2); }
    fx.fillStyle = '#e8c878'; fx.fillRect(250, 0, 6, 64);
    const filt = new T.MeshStandardMaterial({ map: tex(fc), roughness: 0.75 });
    const body = new T.Mesh(new T.CylinderGeometry(CR, CR, PL, 24), paper); body.rotation.z = Math.PI / 2; body.position.x = -PL / 2;
    const f = new T.Mesh(new T.CylinderGeometry(CR, CR, FL, 24), filt); f.rotation.z = Math.PI / 2; f.position.x = FL / 2;
    const fend = new T.Mesh(new T.CircleGeometry(CR, 24), new T.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.95 })); fend.rotation.y = Math.PI / 2; fend.position.x = FL + 0.001;
    // 재: 회색 끝, 살짝 부스스
    const ash = new T.Mesh(new T.CylinderGeometry(CR * 0.97, CR * 0.9, 0.55, 18), new T.MeshStandardMaterial({ color: 0x8a8680, roughness: 1 }));
    ash.rotation.z = Math.PI / 2; ash.position.x = -PL - 0.27;
    const ashEnd = new T.Mesh(new T.SphereGeometry(CR * 0.9, 16, 8), ash.material); ashEnd.scale.set(0.35, 1, 1); ashEnd.position.x = -PL - 0.55;
    cg.add(body, f, fend, ash, ashEnd);
    cg.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
    // 골 자리 (첫 톱니 골, 몸통 기준 각도 0) 에 걸친다
    const notchA = 0.35;
    const nx = Math.cos(notchA), nz = Math.sin(notchA);
    cg.position.set(22 + nx * 6.1, 2.95 + CR, -4 - nz * 6.1);
    cg.rotation.order = 'YZX';
    cg.rotation.y = notchA;           // 담배 길이축(x)을 바깥 방향으로
    cg.rotation.z = 0.27;             // 재 끝이 안쪽으로 내려가게
    scene.add(cg);
    SC.PROPS.push({ type: 'cyl', x: 22, z: -4, r: 7.0, h: 3.25 });
  })();

  // 엽차 호박색 유리잔
  (function tea() {
    // 다방 물컵 (사장님 사진): 낮고 위가 넓은 각진 갈색 유리컵, 보리차가 담겨 있다
    const F = 10; // 모서리 수
    const glass = new T.MeshPhysicalMaterial({ color: 0xb4722e, roughness: 0.06, transparent: true, opacity: 0.62, envMapIntensity: 2.2, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false, side: T.DoubleSide, flatShading: true });
    const g = lathe([[0, 0], [3.0, 0], [3.2, 0.25], [3.85, 7.0], [3.62, 7.05], [3.0, 1.2], [0, 1.05]], F, glass);
    g.castShadow = false;
    g.position.set(-23, 0, 9);
    g.renderOrder = 2;
    scene.add(g);
    // 입술 닿는 가장자리는 밝게
    const rim = new T.Mesh(new T.CylinderGeometry(3.86, 3.86, 0.18, F, 1, true), new T.MeshPhysicalMaterial({ color: 0xf0d2a0, roughness: 0.1, transparent: true, opacity: 0.7, clearcoat: 1, flatShading: true, side: T.DoubleSide }));
    rim.position.set(-23, 6.95, 9);
    scene.add(rim);
    const tea = new T.Mesh(new T.CylinderGeometry(3.52, 3.08, 4.4, F), new T.MeshStandardMaterial({ color: 0x7a3e12, roughness: 0.08, transparent: true, opacity: 0.72, envMapIntensity: 1.2, flatShading: true }));
    tea.position.set(-23, 1.2 + 2.2, 9);
    tea.renderOrder = 1;
    scene.add(tea);
    const sc = cvs(64, 64), sx = sc.getContext('2d');
    const gg = sx.createRadialGradient(32, 32, 8, 32, 32, 32);
    gg.addColorStop(0, 'rgba(90,40,0,.45)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = gg; sx.fillRect(0, 0, 64, 64);
    const sh = new T.Mesh(new T.PlaneGeometry(10, 10), new T.MeshBasicMaterial({ map: tex(sc), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(-22, 0.05, 10); scene.add(sh);
    SC.PROPS.push({ type: 'cyl', x: -23, z: 9, r: 3.8, h: 7.05 });
  })();

  // 초원다방 팔각 통성냥 (70년대 다방 탁자마다 있던 큰 팔각 성냥통)
  SC.box = null;
  SC.buildBox = function () {
    const g = new T.Group();
    const R = 6.0, H = 5.6, LR = 6.25, LH = 1.7; // 몸통 반지름·높이, 뚜껑 반지름·높이 (꼭짓점까지)
    const r = rng(33);
    const TS = -Math.PI / 8; // 면 하나가 +z 를 똑바로 보게
    // --- 옆면 8장: 검은 테 + 팥색 마찰면, 앞 한 장은 하늘색 딱지 ---
    const SW = 256, SH = 256;
    const sc = cvs(SW * 8, SH), x = sc.getContext('2d');
    for (let k = 0; k < 8; k++) {
      const ox = k * SW;
      x.fillStyle = '#16140f'; x.fillRect(ox, 0, SW, SH);
      if (k === 0) {
        x.fillStyle = '#f4f0e0'; x.fillRect(ox + 26, 78, SW - 52, SH - 94);
        x.fillStyle = '#2f9ad8'; x.fillRect(ox + 32, 84, SW - 64, SH - 106);
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.font = '900 46px Title, "Malgun Gothic", sans-serif';
        x.fillText('초원다방', ox + SW / 2, 118);
        x.fillStyle = '#ffe9a0'; x.fillRect(ox + 58, 142, SW - 116, 3);
        // 가운데 작은 커피잔
        x.fillStyle = '#fff';
        x.beginPath(); x.moveTo(ox + 106, 168); x.lineTo(ox + 150, 168); x.quadraticCurveTo(ox + 148, 200, ox + 128, 202); x.quadraticCurveTo(ox + 108, 200, ox + 106, 168); x.fill();
        x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.arc(ox + 154, 179, 7, -1.4, 1.6); x.stroke();
        x.fillRect(ox + 96, 204, 64, 4);
        x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 3;
        for (const dx of [-10, 0, 10]) { x.beginPath(); x.moveTo(ox + 128 + dx, 162); x.quadraticCurveTo(ox + 135 + dx, 155, ox + 128 + dx, 148); x.stroke(); }
        x.fillStyle = '#fff'; x.font = '900 24px Title, "Malgun Gothic", sans-serif';
        x.fillText('☎ 2-4567', ox + SW / 2, 228);
      } else {
        // 마찰면: 팥색 사포 알갱이 + 그은 자국
        const g2 = x.createLinearGradient(0, 30, 0, SH - 30);
        g2.addColorStop(0, '#5e1c16'); g2.addColorStop(1, '#43120e');
        x.fillStyle = g2; x.fillRect(ox + 30, 80, SW - 60, SH - 106);
        for (let i = 0; i < 2600; i++) {
          x.fillStyle = r() < 0.5 ? 'rgba(20,4,2,' + r() * 0.5 + ')' : 'rgba(150,70,50,' + r() * 0.35 + ')';
          x.fillRect(ox + 30 + r() * (SW - 60), 80 + r() * (SH - 106), 1.6, 1.6);
        }
        for (let i = 0; i < 3 + (r() * 4 | 0); i++) {
          x.strokeStyle = 'rgba(20,10,8,' + (0.25 + r() * 0.3) + ')'; x.lineWidth = 2 + r() * 3;
          const yy = 100 + r() * 120; x.beginPath(); x.moveTo(ox + 40 + r() * 40, yy); x.lineTo(ox + 150 + r() * 70, yy + (r() - 0.5) * 40); x.stroke();
        }
      }
    }
    const dark = new T.MeshStandardMaterial({ color: 0x16140f, roughness: 0.8 });
    // 윗면은 비워 두고(속 성냥이 보이게) 안쪽 벽·속 바닥을 따로 둔다
    const body = new T.Mesh(new T.CylinderGeometry(R, R, H, 8, 1, false, TS), [new T.MeshStandardMaterial({ map: tex(sc), roughness: 0.85 }), new T.MeshBasicMaterial({ visible: false }), dark]);
    body.position.y = H / 2;
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    const liner = new T.Mesh(new T.CylinderGeometry(R - 0.05, R - 0.05, 3, 8, 1, true, TS), new T.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9, side: T.BackSide }));
    liner.position.y = H - 1.5;
    g.add(liner);
    const floorIn = new T.Mesh(new T.CircleGeometry(R, 8, TS + Math.PI / 2), new T.MeshStandardMaterial({ color: 0xcfae78, roughness: 0.9 }));
    floorIn.rotation.x = -Math.PI / 2; floorIn.position.y = H - 2.5;
    g.add(floorIn);

    // --- 뚜껑: 초록 꽃무늬 판지 + 투명 비닐, 가운데 팔각 창에 그림 딱지 ---
    const leaf = (w, h, seed) => {
      const c = cvs(w, h), lx = c.getContext('2d'), rr = rng(seed);
      lx.fillStyle = '#2f5a36'; lx.fillRect(0, 0, w, h);
      for (let i = 0; i < (w * h) / 900; i++) {
        const px = rr() * w, py = rr() * h, s = 6 + rr() * 10;
        lx.strokeStyle = rr() < 0.5 ? 'rgba(170,210,160,.55)' : 'rgba(110,160,110,.6)'; lx.lineWidth = 1.6;
        if (rr() < 0.5) { for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283; lx.beginPath(); lx.ellipse(px + Math.cos(a) * s * 0.6, py + Math.sin(a) * s * 0.6, s * 0.5, s * 0.25, a, 0, 7); lx.stroke(); } }
        else { lx.beginPath(); lx.moveTo(px, py); lx.quadraticCurveTo(px + s, py - s, px + s * 2, py); lx.quadraticCurveTo(px + s, py + s * 0.6, px, py); lx.stroke(); }
      }
      return c;
    };
    const lidSide = new T.MeshPhysicalMaterial({ map: tex(leaf(2048, 128, 7)), roughness: 0.6, clearcoat: 1, clearcoatRoughness: 0.1 });
    const LT = H + 0.62; // 뚜껑 윗면 높이 (성냥이 두 켜 쌓일 만큼 올린다)
    const RI = 3.9; // 가운데 팔각 구멍 반지름
    const lidRim = new T.Mesh(new T.CylinderGeometry(LR, LR, LH, 8, 1, true, TS), lidSide);
    lidRim.position.y = LT - LH / 2;
    lidRim.castShadow = true;
    g.add(lidRim);
    // 윗면 그림 (1cm = px2 픽셀, 가운데가 판 가운데): 초록 꽃무늬 + 구멍 둘레 은빛 테 + 붉은 띠에 이름
    const TC = 1024, tc = leaf(TC, TC, 11), tx = tc.getContext('2d');
    const C0 = TC / 2, px2 = TC / (2 * LR);
    const oct = (rad) => { tx.beginPath(); for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; const px = C0 + Math.cos(a) * rad, py = C0 + Math.sin(a) * rad; k ? tx.lineTo(px, py) : tx.moveTo(px, py); } tx.closePath(); };
    oct((RI + 1.25) * px2); tx.fillStyle = '#e8dcc0'; tx.fill();
    oct((RI + 1.1) * px2); tx.fillStyle = '#c22a20'; tx.fill();
    oct((RI + 0.32) * px2); tx.fillStyle = '#d8dcd8'; tx.fill();
    tx.fillStyle = '#fff4d8'; tx.textAlign = 'center'; tx.textBaseline = 'middle';
    tx.font = '900 ' + (0.5 * px2 | 0) + 'px Title, "Malgun Gothic", sans-serif';
    const ap = (RI + 0.71) * Math.cos(Math.PI / 8) * px2;
    tx.fillText('초원다방', C0, C0 + ap);
    tx.fillText('성냥', C0, C0 - ap);
    // 윗면 판: 가운데가 뚫린 팔각 고리. UV 는 월드 (x, z) 를 판 (가로, 세로)에 그대로
    const pos = [], uv = [], idx = [];
    for (let k = 0; k < 8; k++) {
      const a = (k + 0.5) * Math.PI / 4, c = Math.cos(a), s2 = Math.sin(a);
      for (const rr2 of [LR, RI]) { pos.push(c * rr2, 0, s2 * rr2); uv.push(c * rr2 / (2 * LR) + 0.5, 1 - (s2 * rr2 / (2 * LR) + 0.5)); }
    }
    for (let k = 0; k < 8; k++) {
      const o0 = k * 2, i0 = k * 2 + 1, o1 = ((k + 1) % 8) * 2, i1 = o1 + 1;
      idx.push(i0, o1, o0, i0, i1, o1);
    }
    const tg = new T.BufferGeometry();
    tg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    tg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    tg.setIndex(idx);
    tg.computeVertexNormals();
    const top = new T.Mesh(tg, new T.MeshPhysicalMaterial({ map: tex(tc), roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2, side: T.DoubleSide }));
    top.position.y = LT + 0.001;
    top.receiveShadow = true;
    g.add(top);
    // 구멍 안쪽 벽 (은빛 판지 테)
    const hole = new T.Mesh(new T.CylinderGeometry(RI, RI, 0.64, 8, 1, true, TS), new T.MeshStandardMaterial({ color: 0xb8bcb4, metalness: 0.6, roughness: 0.35, side: T.DoubleSide }));
    hole.position.y = LT - 0.32;
    g.add(hole);
    const edge = new T.Mesh(new T.CylinderGeometry(LR + 0.03, LR + 0.03, 0.08, 8, 1, true, TS), new T.MeshStandardMaterial({ color: 0xdfeee0, roughness: 0.2, transparent: true, opacity: 0.55 }));
    edge.position.y = LT - 0.01;
    g.add(edge);
    // --- 속에 가득 찬 성냥: 두 켜를 엇갈려 빽빽이, 맨 위엔 흐트러진 몇 개 ---
    const MS = [];
    const rs = rng(71), RC = 5.35, HLf = 2.35;
    for (let layer = 0; layer < 2; layer++) {
      const y = H + 0.115 + layer * 0.222;
      const along = layer ? Math.PI / 2 : 0;
      for (let d = -RC + 0.2; d <= RC - 0.2; d += 0.236) {
        const hc = Math.sqrt(RC * RC - d * d);
        if (hc < HLf + 0.05) continue;
        const room = hc - HLf;
        const centers = room > 2.45 ? [-2.38 + (rs() - 0.5) * 0.1, 2.38 + (rs() - 0.5) * 0.1] : [(rs() - 0.5) * 2 * Math.min(room, 0.6)];
        for (const c of centers) {
          // 두 개씩 놓인 줄은 머리를 가운데로 모은다 (구멍으로 빨간 머리 줄이 보이게)
          const sh = centers.length > 1 ? (c < 0 ? 1 : -1) : (rs() < 0.5 ? 1 : -1);
          const yaw = (layer ? (sh > 0 ? 1.5 * Math.PI : 0.5 * Math.PI) : (sh > 0 ? 0 : Math.PI)) + (rs() - 0.5) * 0.05;
          const px = layer ? d : c, pz = layer ? c : d;
          MS.push([px, y + (rs() - 0.5) * 0.01, pz, yaw, (rs() - 0.5) * 0.03]);
        }
      }
    }
    for (let i = 0; i < 7; i++) {
      const a = rs() * 6.283, rr3 = rs() * 1.2;
      MS.push([Math.cos(a) * rr3, H + 0.5 + rs() * 0.05, Math.sin(a) * rr3, rs() * 6.283, (rs() - 0.5) * 0.12]);
    }
    // 쏟아부어 만든 더미(js/pile.js)가 있으면 그 자리를 쓴다
    const PL = window.PILE || null;
    // 더미 밑에는 줄 맞춘 두 켜를 깔아 빈틈으로도 성냥이 보이게 (더미 바닥 H-0.8 보다 아래)
    if (PL) for (const m of MS) m[1] -= 1.25;
    const NM = (PL ? PL.length : 0) + MS.length;
    const bst = new T.InstancedMesh(stickGeo, stickMat, NM), bhd = new T.InstancedMesh(headGeo, headMat, NM);
    const mm = new T.Matrix4(), q = new T.Quaternion(), pp = new T.Vector3(), one = new T.Vector3(1, 1, 1), e = new T.Euler(0, 0, 0, 'YXZ');
    const col = new T.Color();
    if (PL) PL.forEach((m, i) => {
      q.set(m[3], m[4], m[5], m[6]); pp.set(m[0], m[1], m[2]);
      mm.compose(pp, q, one);
      bst.setMatrixAt(i, mm); bhd.setMatrixAt(i, mm);
      const k = 0.88 + rs() * 0.16; bst.setColorAt(i, col.setRGB(k, k * 0.98, k * 0.94));
    });
    const o0 = PL ? PL.length : 0;
    MS.forEach((m, j) => {
      const i = o0 + j;
      e.set(m[4], m[3], (rs() - 0.5) * 0.02);
      q.setFromEuler(e); pp.set(m[0], m[1], m[2]);
      mm.compose(pp, q, one);
      bst.setMatrixAt(i, mm); bhd.setMatrixAt(i, mm);
      const k = 0.88 + rs() * 0.16; bst.setColorAt(i, col.setRGB(k, k * 0.98, k * 0.94));
    });
    for (const m of [bst, bhd]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; g.add(m); }

    g.position.set(7, 0, -15);
    g.rotation.y = 0.2;
    scene.add(g);
    SC.box = g;
    SC.PROPS.push({ type: 'cyl', x: 7, z: -15, r: LR, h: LT });
  };

  // ---------- 다방 안 한 바퀴 (흐리게 = 초점 밖) ----------
  (function room() {
    const W2 = 4096, H2 = 1024;
    const src = cvs(W2, H2), x = src.getContext('2d'), r = rng(77);
    // 세로 v: 0 = 위(y +190), 1 = 아래(y -110). 탁자 윗면(y 0)은 v 0.633
    const vy = (y) => ((190 - y) / 300) * H2;
    // 벽: 짙은 호두나무 판벽
    const g = x.createLinearGradient(0, 0, 0, H2);
    g.addColorStop(0, '#120a06'); g.addColorStop(0.25, '#3a2214'); g.addColorStop(0.55, '#4a2c18'); g.addColorStop(1, '#1a0e08');
    x.fillStyle = g; x.fillRect(0, 0, W2, H2);
    for (let i = 0; i < W2; i += 96) {
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i, 0, 4, H2);
      x.fillStyle = 'rgba(255,200,140,.05)'; x.fillRect(i + 4, 0, 3, H2);
    }
    // 천장 몰딩
    x.fillStyle = '#24140a'; x.fillRect(0, vy(165), W2, 22);
    x.fillStyle = 'rgba(255,190,120,.12)'; x.fillRect(0, vy(165) + 22, W2, 4);
    // 창 (레이스 커튼 너머 오후 햇빛)
    function window_(cx, w) {
      const y0 = vy(150), y1 = vy(40);
      const wg = x.createLinearGradient(0, y0, 0, y1);
      wg.addColorStop(0, '#fff2d0'); wg.addColorStop(1, '#f0c890');
      x.fillStyle = wg; x.fillRect(cx - w / 2, y0, w, y1 - y0);
      // 창살
      x.fillStyle = '#3a2412';
      for (let k = 0; k <= 4; k++) x.fillRect(cx - w / 2 + (k * w) / 4 - 5, y0, 10, y1 - y0);
      x.fillRect(cx - w / 2, (y0 + y1) / 2 - 5, w, 10);
      // 레이스: 반투명 흰 물결
      for (let k = 0; k < 2; k++) {
        const sx = k ? cx + w / 2 - w * 0.28 : cx - w / 2;
        const lg = x.createLinearGradient(sx, 0, sx + w * 0.28, 0);
        lg.addColorStop(0, 'rgba(255,250,240,.85)'); lg.addColorStop(1, 'rgba(255,250,240,.45)');
        x.fillStyle = lg; x.fillRect(sx, y0 - 10, w * 0.28, y1 - y0 + 20);
        for (let j = 0; j < 9; j++) { x.fillStyle = 'rgba(200,180,150,.25)'; x.fillRect(sx + j * w * 0.031, y0, 3, y1 - y0); }
      }
      // 빛 번짐
      const bl = x.createRadialGradient(cx, (y0 + y1) / 2, 10, cx, (y0 + y1) / 2, w);
      bl.addColorStop(0, 'rgba(255,220,160,.35)'); bl.addColorStop(1, 'rgba(255,200,140,0)');
      x.fillStyle = bl; x.fillRect(cx - w * 1.2, y0 - w * 0.6, w * 2.4, w * 2);
    }
    window_(700, 520);
    // 어항 (초록·파랑 빛, 금붕어)
    (function tank(cx) {
      const y0 = vy(70), y1 = vy(20), w = 300;
      x.fillStyle = '#20140c'; x.fillRect(cx - w / 2 - 14, y1, w + 28, 60);
      const tg = x.createLinearGradient(0, y0, 0, y1);
      tg.addColorStop(0, '#6ad0c0'); tg.addColorStop(1, '#1a6a5a');
      x.fillStyle = tg; x.fillRect(cx - w / 2, y0, w, y1 - y0);
      for (let i = 0; i < 7; i++) {
        const fx = cx - w / 2 + 30 + r() * (w - 60), fy = y0 + 30 + r() * (y1 - y0 - 60);
        x.fillStyle = r() < 0.7 ? '#ff7a20' : '#f0f0e0';
        x.beginPath(); x.ellipse(fx, fy, 14, 8, 0, 0, 7); x.fill();
        x.beginPath(); x.moveTo(fx + 12, fy); x.lineTo(fx + 26, fy - 9); x.lineTo(fx + 26, fy + 9); x.fill();
      }
      for (let i = 0; i < 9; i++) { x.strokeStyle = '#2a8a3a'; x.lineWidth = 6; x.beginPath(); const bx = cx - w / 2 + 20 + i * 32; x.moveTo(bx, y1); x.quadraticCurveTo(bx + 20, (y0 + y1) / 2, bx - 5, y0 + 30 + r() * 30); x.stroke(); }
      const gl = x.createRadialGradient(cx, (y0 + y1) / 2, 20, cx, (y0 + y1) / 2, 300);
      gl.addColorStop(0, 'rgba(80,220,190,.25)'); gl.addColorStop(1, 'rgba(80,220,190,0)');
      x.fillStyle = gl; x.fillRect(cx - 320, y0 - 200, 640, 500);
    })(1620);
    // 벽시계
    (function clock(cx, cy) {
      x.fillStyle = '#5a3418'; x.beginPath(); x.arc(cx, cy, 64, 0, 7); x.fill();
      x.fillStyle = '#f0e4c8'; x.beginPath(); x.arc(cx, cy, 52, 0, 7); x.fill();
      x.strokeStyle = '#2a1a10'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + 22, cy - 26); x.stroke();
      x.lineWidth = 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - 8, cy + 42); x.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillStyle = '#2a1a10'; x.fillRect(cx + Math.cos(a) * 44 - 2, cy + Math.sin(a) * 44 - 2, 4, 4); }
      // 추
      x.fillStyle = '#5a3418'; x.fillRect(cx - 30, cy + 60, 60, 140);
      x.fillStyle = '#c89a48'; x.beginPath(); x.arc(cx + 6, cy + 170, 16, 0, 7); x.fill();
    })(1180, vy(135));
    // 액자: 학과 소나무
    (function frame(cx, cy) {
      x.fillStyle = '#8a6a2a'; x.fillRect(cx - 170, cy - 100, 340, 200);
      x.fillStyle = '#e8dcc0'; x.fillRect(cx - 156, cy - 86, 312, 172);
      x.strokeStyle = '#3a3020'; x.lineWidth = 9;
      x.beginPath(); x.moveTo(cx - 120, cy + 86); x.quadraticCurveTo(cx - 90, cy, cx - 40, cy - 30); x.stroke();
      x.fillStyle = '#3a5a3a';
      for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(cx - 70 + i * 24, cy - 36 - (i % 2) * 14, 36, 12, 0, 0, 7); x.fill(); }
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + 70, cy - 10, 26, 12, -0.3, 0, 7); x.fill();
      x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx + 50, cy - 8); x.lineTo(cx + 10, cy - 40); x.stroke();
      x.fillStyle = '#c02020'; x.beginPath(); x.arc(cx + 92, cy - 18, 5, 0, 7); x.fill();
      x.fillStyle = '#e04030'; x.beginPath(); x.arc(cx + 110, cy - 60, 18, 0, 7); x.fill();
    })(2350, vy(120));
    // 달력
    (function cal(cx, cy) {
      x.fillStyle = '#f4efe0'; x.fillRect(cx - 70, cy - 100, 140, 200);
      x.fillStyle = '#c02020'; x.fillRect(cx - 70, cy - 100, 140, 40);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) { x.fillStyle = j === 0 ? '#c02020' : '#2a2a2a'; x.fillRect(cx - 60 + j * 18, cy - 40 + i * 24, 10, 12); }
    })(2780, vy(110));
    // 카운터와 전축 스피커
    x.fillStyle = '#2a160a'; x.fillRect(3000, vy(45), 700, vy(-40) - vy(45));
    x.fillStyle = 'rgba(255,190,120,.15)'; x.fillRect(3000, vy(45), 700, 8);
    for (const sx of [3080, 3560]) {
      x.fillStyle = '#1a0e08'; x.fillRect(sx, vy(120), 90, 150);
      x.fillStyle = '#3a2a20'; x.beginPath(); x.arc(sx + 45, vy(120) + 50, 30, 0, 7); x.fill(); x.beginPath(); x.arc(sx + 45, vy(120) + 115, 20, 0, 7); x.fill();
    }
    // 커피 사이펀 불빛
    for (let i = 0; i < 4; i++) {
      const sx = 3240 + i * 70, sy = vy(62);
      x.fillStyle = 'rgba(200,220,230,.5)'; x.beginPath(); x.arc(sx, sy, 18, 0, 7); x.fill();
      x.fillStyle = '#3a1a0a'; x.beginPath(); x.arc(sx, sy + 4, 13, 0, 7); x.fill();
      const fl = x.createRadialGradient(sx, sy + 34, 1, sx, sy + 34, 30);
      fl.addColorStop(0, 'rgba(120,170,255,.8)'); fl.addColorStop(1, 'rgba(120,170,255,0)');
      x.fillStyle = fl; x.fillRect(sx - 30, sy + 4, 60, 60);
    }
    // 고무나무 화분
    for (const px of [1950, 3900]) {
      x.fillStyle = '#6a3a1a'; x.fillRect(px - 45, vy(30), 90, 90);
      for (let i = 0; i < 16; i++) {
        const lx = px + (r() - 0.5) * 160, ly = vy(40 + r() * 110);
        x.fillStyle = r() < 0.5 ? '#1a3a1a' : '#2a5a2a';
        x.beginPath(); x.ellipse(lx, ly, 34, 16, r() * 3, 0, 7); x.fill();
      }
    }
    // 붉은 벨벳 칸막이 소파 (방 한 바퀴)
    for (let i = 0; i < 9; i++) {
      const sx = 60 + i * 460, w = 400;
      if (i === 7) continue; // 카운터 자리
      const y0 = vy(38), y1 = vy(-30);
      const sg = x.createLinearGradient(0, y0, 0, y1);
      sg.addColorStop(0, '#a02a24'); sg.addColorStop(0.35, '#7a1a16'); sg.addColorStop(1, '#3a0c0a');
      x.fillStyle = sg;
      x.beginPath(); x.moveTo(sx, y1); x.lineTo(sx, y0 + 20); x.quadraticCurveTo(sx, y0, sx + 20, y0); x.lineTo(sx + w - 20, y0); x.quadraticCurveTo(sx + w, y0, sx + w, y0 + 20); x.lineTo(sx + w, y1); x.fill();
      // 단추 박음
      for (let j = 0; j < 7; j++) for (let k = 0; k < 2; k++) {
        const bx = sx + 34 + j * 55 + (k % 2) * 27, by = y0 + 26 + k * 40;
        x.fillStyle = 'rgba(40,6,4,.6)'; x.beginPath(); x.arc(bx, by, 5, 0, 7); x.fill();
        x.fillStyle = 'rgba(255,140,120,.18)'; x.beginPath(); x.arc(bx - 1, by - 2, 3, 0, 7); x.fill();
      }
      // 칸막이 간유리
      x.fillStyle = '#2a1608'; x.fillRect(sx + w + 8, vy(95), 36, vy(-30) - vy(95));
      x.fillStyle = 'rgba(220,210,190,.25)'; x.fillRect(sx + w + 14, vy(92), 24, vy(40) - vy(92));
    }
    // 갓등 (주황 유리 갓, 빛 번짐)
    for (let i = 0; i < 8; i++) {
      const lx = 240 + i * 510, ly = vy(125 + (i % 2) * 10);
      x.strokeStyle = '#120a06'; x.lineWidth = 3; x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx, ly - 30); x.stroke();
      const lg = x.createRadialGradient(lx, ly, 5, lx, ly, 220);
      lg.addColorStop(0, 'rgba(255,170,80,.6)'); lg.addColorStop(1, 'rgba(255,140,60,0)');
      x.fillStyle = lg; x.fillRect(lx - 220, ly - 220, 440, 440);
      const sg = x.createLinearGradient(0, ly - 30, 0, ly + 20);
      sg.addColorStop(0, '#e07a28'); sg.addColorStop(1, '#ffc070');
      x.fillStyle = sg;
      x.beginPath(); x.moveTo(lx - 16, ly - 30); x.lineTo(lx + 16, ly - 30); x.lineTo(lx + 46, ly + 18); x.lineTo(lx - 46, ly + 18); x.fill();
      x.fillStyle = '#fff4d0'; x.beginPath(); x.ellipse(lx, ly + 18, 40, 6, 0, 0, 7); x.fill();
    }
    // 초점 밖처럼 흐리게
    const c = cvs(W2, H2), cx2 = c.getContext('2d');
    cx2.filter = 'blur(9px)';
    cx2.drawImage(src, 0, 0);
    cx2.filter = 'none';
    cx2.drawImage(src, 0, 0, 24, H2, W2 - 24, 0, 24, H2);
    const t = tex(c);
    const wall = new T.Mesh(new T.CylinderGeometry(170, 170, 300, 96, 1, true), new T.MeshBasicMaterial({ map: t, side: T.BackSide, fog: false, color: 0xffffff }));
    wall.position.y = 40;
    scene.add(wall);
    const ceil = new T.Mesh(new T.CircleGeometry(172, 48), new T.MeshBasicMaterial({ color: 0x0e0805 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = 189; scene.add(ceil);
  })();

  // ---------- 카메라 궤도 ----------
  const C = (SC.cam = { yaw: 0.55, pitch: 0.5, dist: 38, tx: 0, ty: 2, tz: 0, txGoal: 0, tyGoal: 2, tzGoal: 0, distGoal: 0 });
  SC.updateCam = function () {
    const cp = Math.cos(C.pitch);
    cam.position.set(C.tx + Math.sin(C.yaw) * C.dist * cp, C.ty + Math.sin(C.pitch) * C.dist, C.tz + Math.cos(C.yaw) * C.dist * cp);
    cam.lookAt(C.tx, C.ty, C.tz);
  };
  SC.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    cam.fov = w / h < 0.8 ? 56 : 40;
    cam.updateProjectionMatrix();
  };
  window.addEventListener('resize', SC.resize);
  SC.resize();
  SC.updateCam();
  SC.shift = 0;
  SC.render = function () {
    const w = R.domElement.width, h = R.domElement.height;
    const k = w / h >= 1 ? SC.shift : 0;
    if (k) cam.setViewOffset(w, h, -w * k, 0, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    R.render(scene, cam);
  };
})();
