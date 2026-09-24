// 장면: 한가위 밤 시골 마당. 보름달·돌담·감나무·장독대·초롱, 멍석 위 윷판. 그림은 전부 코드 캔버스.
(function () {
  const T = THREE;
  const SC = (window.SC = {});
  const cv = document.getElementById('cv');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  const MOBILE = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  SC.MOBILE = MOBILE;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.25 : 1.5));
  R.toneMapping = T.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.0;
  R.shadowMap.enabled = true;
  R.shadowMap.type = T.PCFSoftShadowMap;
  SC.renderer = R;

  const scene = new T.Scene();
  SC.scene = scene;
  const SKY = new T.Color(0x0d1630);
  scene.background = SKY;
  scene.fog = new T.Fog(0x0d1630, 26, 70);

  const cam = new T.PerspectiveCamera(40, 1, 0.1, 120);
  SC.camera = cam;

  // ---------- 작은 난수 ----------
  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }
  SC.rng = rng;
  const rgb = (a, k) => 'rgb(' + a.map((v) => Math.max(0, Math.min(255, Math.round(v * (k || 1))))).join(',') + ')';
  const rgba = (a, al) => 'rgba(' + a.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',') + ',' + al + ')';

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, rep, srgb) {
    const t = new T.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = T.SRGBColorSpace;
    if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep); }
    t.anisotropy = 4;
    return t;
  }

  // ---------- 환경맵: 밤하늘 + 달빛 + 초롱 불빛 ----------
  (function env() {
    const es = new T.Scene();
    const c = canvas(16, 256);
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#0a1028'); g.addColorStop(0.45, '#1a2650'); g.addColorStop(0.52, '#3a3040'); g.addColorStop(1, '#0c0806');
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    es.add(new T.Mesh(new T.SphereGeometry(10, 24, 12), new T.MeshBasicMaterial({ map: tex(c), side: T.BackSide })));
    const moon = new T.Mesh(new T.PlaneGeometry(3, 3), new T.MeshBasicMaterial({ color: new T.Color(2.2, 2.3, 2.6) }));
    moon.position.set(-4, 6, -5); moon.lookAt(0, 0, 0); es.add(moon);
    const lamp = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ color: new T.Color(3.5, 2.0, 0.8) }));
    lamp.position.set(5, 4, 3); lamp.lookAt(0, 0, 0); es.add(lamp);
    const pm = new T.PMREMGenerator(R);
    scene.environment = pm.fromScene(es, 0.04).texture;
    pm.dispose();
  })();

  // ---------- 빛 ----------
  scene.add(new T.HemisphereLight(0x6f7fb8, 0x2a1c10, 0.55));
  const moonL = new T.DirectionalLight(0xbfcfff, 1.35);
  moonL.position.set(-9, 14, -7);
  moonL.castShadow = true;
  moonL.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  moonL.shadow.camera.left = -7; moonL.shadow.camera.right = 7;
  moonL.shadow.camera.top = 7; moonL.shadow.camera.bottom = -7;
  moonL.shadow.camera.near = 4; moonL.shadow.camera.far = 40;
  moonL.shadow.bias = -0.0005; moonL.shadow.normalBias = 0.02; moonL.shadow.radius = 3;
  scene.add(moonL); scene.add(moonL.target);
  // 초롱: 따뜻한 점광 하나(개수 고정)
  const lampL = new T.PointLight(0xffb060, 26, 22, 1.8);
  lampL.position.set(4.6, 4.2, 2.6);
  scene.add(lampL);
  SC.lampL = lampL;
  const fill = new T.DirectionalLight(0xffc890, 0.35);
  fill.position.set(6, 5, 6);
  scene.add(fill);

  // ---------- 흙마당 ----------
  function groundTex() {
    const S = 1024, c = canvas(S, S), x = c.getContext('2d'), r = rng(11);
    x.fillStyle = '#6a5136'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 9000; i++) {
      const v = 70 + r() * 60;
      x.fillStyle = rgba([v + 20, v, v - 22], 0.5);
      const s = 1 + r() * 4;
      x.fillRect(r() * S, r() * S, s, s);
    }
    for (let i = 0; i < 260; i++) {
      x.fillStyle = rgba([120 + r() * 40, 95 + r() * 30, 60 + r() * 20], 0.25);
      x.beginPath(); x.ellipse(r() * S, r() * S, 6 + r() * 30, 3 + r() * 12, r() * 6.3, 0, 6.3); x.fill();
    }
    for (let i = 0; i < 60; i++) { // 작은 돌
      x.fillStyle = rgba([140 + r() * 40, 135 + r() * 30, 125 + r() * 30], 0.8);
      x.beginPath(); x.ellipse(r() * S, r() * S, 2 + r() * 4, 1.5 + r() * 3, r() * 6.3, 0, 6.3); x.fill();
    }
    return c;
  }
  const gT = tex(groundTex(), 6);
  const ground = new T.Mesh(new T.CircleGeometry(60, 48), new T.MeshStandardMaterial({ map: gT, roughness: 0.95, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);

  // ---------- 멍석(짚으로 짠 둥근 자리) ----------
  function matTex() {
    const S = 1024, c = canvas(S, S), x = c.getContext('2d'), r = rng(5);
    x.fillStyle = '#b8935a'; x.fillRect(0, 0, S, S);
    const cell = 14;
    for (let j = 0; j < S / cell; j++) for (let i = 0; i < S / cell; i++) {
      const horiz = (i + j) % 2 === 0;
      const v = 165 + r() * 45, k = [v + 20, v - 10, v - 70];
      x.fillStyle = rgb(k);
      x.fillRect(i * cell + 1, j * cell + 1, cell - 2, cell - 2);
      // 짚 결
      x.strokeStyle = rgba([k[0] - 40, k[1] - 40, k[2] - 30], 0.7); x.lineWidth = 1;
      x.beginPath();
      for (let s = 0; s < 4; s++) {
        if (horiz) { const y = j * cell + 2 + s * 3; x.moveTo(i * cell + 1, y); x.lineTo(i * cell + cell - 1, y); }
        else { const xx = i * cell + 2 + s * 3; x.moveTo(xx, j * cell + 1); x.lineTo(xx, j * cell + cell - 1); }
      }
      x.stroke();
      x.fillStyle = rgba([255, 240, 200], 0.18); x.fillRect(i * cell + 1, j * cell + 1, cell - 2, 2);
    }
    return c;
  }
  const MATR = 5.2;
  const matMat = new T.MeshStandardMaterial({ map: tex(matTex(), 5), roughness: 0.9 });
  const mat = new T.Mesh(new T.CylinderGeometry(MATR, MATR + 0.1, 0.12, 64), matMat);
  mat.position.y = 0.06; mat.receiveShadow = true; mat.castShadow = true;
  scene.add(mat);
  // 테두리 감침(둥근 줄)
  const rim = new T.Mesh(new T.TorusGeometry(MATR + 0.02, 0.09, 10, 72), new T.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.8 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.12; rim.castShadow = true;
  scene.add(rim);
  SC.MATR = MATR;
  SC.MAT_Y = 0.12;

  // ---------- 윷판 천 ----------
  const BS = 2.4; // 판 좌표 배율(정규화 -1..1 → 세계)
  SC.BS = BS;
  const CLOTH = 3.15;
  function boardTex() {
    const S = 1024, c = canvas(S, S), x = c.getContext('2d'), r = rng(3);
    // 무명천
    x.fillStyle = '#efe2c4'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 24000; i++) { x.fillStyle = rgba([200 + r() * 55, 190 + r() * 50, 150 + r() * 50], 0.35); x.fillRect(r() * S, r() * S, 2, 1); }
    x.strokeStyle = 'rgba(120,90,50,.08)'; x.lineWidth = 1;
    for (let i = 0; i < S; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); }
    // 테두리 색동 띠
    const band = ['#b8342a', '#2f6fb8', '#e0a52a', '#3e8f4a', '#8a3a8a'];
    for (let i = 0; i < 5; i++) { x.fillStyle = band[i]; x.globalAlpha = 0.85; x.fillRect(0, i * 10, S, 10); x.fillRect(0, S - 10 - i * 10, S, 10); x.fillRect(i * 10, 0, 10, S); x.fillRect(S - 10 - i * 10, 0, 10, S); }
    x.globalAlpha = 1;
    // 판 그림(먹)
    const P = window.YUT.POS;
    const px = (n) => [S / 2 + P[n][0] * (BS / CLOTH) * S / 2, S / 2 + P[n][1] * (BS / CLOTH) * S / 2];
    x.strokeStyle = 'rgba(30,20,14,.85)'; x.lineWidth = 6; x.lineCap = 'round';
    const line = (a, b) => { const A = px(a), B = px(b); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); };
    line(20, 5); line(5, 10); line(10, 15); line(15, 20); line(5, 15); line(10, 20);
    // 먹이 번진 느낌
    x.strokeStyle = 'rgba(30,20,14,.25)'; x.lineWidth = 12;
    line(20, 5); line(5, 10); line(10, 15); line(15, 20); line(5, 15); line(10, 20);
    for (let n = 1; n <= 29; n++) {
      const [X, Y] = px(n);
      const big = n === 5 || n === 10 || n === 15 || n === 20 || n === 23;
      x.fillStyle = '#f3e8cc'; x.beginPath(); x.arc(X, Y, big ? 30 : 19, 0, 6.3); x.fill();
      x.strokeStyle = 'rgba(30,20,14,.9)'; x.lineWidth = big ? 7 : 5; x.beginPath(); x.arc(X, Y, big ? 30 : 19, 0, 6.3); x.stroke();
      if (big) { x.fillStyle = 'rgba(184,52,42,.9)'; x.beginPath(); x.arc(X, Y, 11, 0, 6.3); x.fill(); }
      else { x.fillStyle = 'rgba(30,20,14,.8)'; x.beginPath(); x.arc(X, Y, 5, 0, 6.3); x.fill(); }
    }
    // 방(가운데) 태극 무늬
    const [cx, cy] = px(23);
    x.fillStyle = '#b8342a'; x.beginPath(); x.arc(cx, cy, 20, Math.PI / 2, Math.PI * 1.5); x.arc(cx, cy - 10, 10, Math.PI * 1.5, Math.PI * 0.5); x.arc(cx, cy + 10, 10, Math.PI * 1.5, Math.PI * 0.5, true); x.fill();
    x.fillStyle = '#2f6fb8'; x.beginPath(); x.arc(cx, cy, 20, -Math.PI / 2, Math.PI / 2); x.arc(cx, cy + 10, 10, Math.PI / 2, Math.PI * 1.5); x.arc(cx, cy - 10, 10, Math.PI / 2, Math.PI * 1.5, true); x.fill();
    // 얼룩·구김
    for (let i = 0; i < 40; i++) { x.fillStyle = rgba([150 + r() * 40, 120 + r() * 30, 70], 0.06); x.beginPath(); x.ellipse(r() * S, r() * S, 20 + r() * 80, 10 + r() * 40, r() * 6.3, 0, 6.3); x.fill(); }
    return c;
  }
  const boardMat = new T.MeshStandardMaterial({ map: tex(boardTex()), roughness: 0.85 });
  const board = new T.Mesh(new T.PlaneGeometry(CLOTH * 2, CLOTH * 2), boardMat);
  board.rotation.x = -Math.PI / 2; board.position.y = 0.15; board.receiveShadow = true;
  scene.add(board);
  const boardEdge = new T.Mesh(new T.BoxGeometry(CLOTH * 2, 0.03, CLOTH * 2), new T.MeshStandardMaterial({ color: 0xd8c8a4, roughness: 0.9 }));
  boardEdge.position.y = 0.134; boardEdge.receiveShadow = true; scene.add(boardEdge);
  // 천 귀퉁이 누르는 조약돌 4개
  const pebMat = new T.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.7 });
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const p = new T.Mesh(new T.SphereGeometry(0.16, 12, 8), pebMat);
    p.scale.set(1.3, 0.6, 1); p.position.set(sx * (CLOTH - 0.1), 0.2, sz * (CLOTH - 0.1)); p.castShadow = true; scene.add(p);
  }
  SC.node = (n) => { const p = window.YUT.POS[n]; return new T.Vector3(p[0] * BS, 0.15, p[1] * BS); };

  // ---------- 돌담·감나무·장독대·초롱 ----------
  const props = new T.Group(); scene.add(props);
  (function wall() {
    const r = rng(21);
    const stoneMat = new T.MeshStandardMaterial({ color: 0x8c8880, roughness: 0.95, vertexColors: true });
    const geos = [];
    const RW = 16;
    for (let a = 0; a < Math.PI * 2; a += 0.11) {
      if (a > Math.PI * 1.15 && a < Math.PI * 1.85) continue; // 앞(카메라 쪽)은 트여 있다
      for (let h = 0; h < 4; h++) {
        const sz = 0.55 + r() * 0.5;
        const g = new T.DodecahedronGeometry(sz, 0);
        g.scale(1.3, 0.75, 1);
        const rad = RW + (r() - 0.5) * 0.6;
        g.rotateY(r() * 6.3);
        g.translate(Math.cos(a + h * 0.05) * rad, 0.35 + h * 0.62, Math.sin(a + h * 0.05) * rad);
        const v = 0.45 + r() * 0.3;
        const col = new Float32Array(g.attributes.position.count * 3);
        for (let i = 0; i < col.length; i += 3) { col[i] = v + 0.05; col[i + 1] = v; col[i + 2] = v - 0.05; }
        g.setAttribute('color', new T.BufferAttribute(col, 3));
        geos.push(g);
      }
    }
    const m = new T.Mesh(mergeGeos(geos), stoneMat);
    m.castShadow = true; m.receiveShadow = true;
    props.add(m);
  })();

  function mergeGeos(gs) {
    let n = 0;
    const list = gs.map((g) => (g.index ? g.toNonIndexed() : g));
    for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const g of list) {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
      else col.fill(1, o * 3, (o + g.attributes.position.count) * 3);
      o += g.attributes.position.count;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('color', new T.BufferAttribute(col, 3));
    return out;
  }
  SC.mergeGeos = mergeGeos;

  (function tree() {
    const r = rng(8);
    const bark = new T.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 });
    const leaf = new T.MeshStandardMaterial({ color: 0x3a6a2a, roughness: 0.9, vertexColors: true });
    const fruit = new T.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.45, emissive: 0x401800, emissiveIntensity: 0.4 });
    const g = new T.Group();
    const trunk = new T.Mesh(new T.CylinderGeometry(0.28, 0.45, 4.2, 9), bark);
    trunk.position.y = 2.1; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 4; i++) {
      const b = new T.Mesh(new T.CylinderGeometry(0.1, 0.2, 2.4, 7), bark);
      const a = i * 1.6 + 0.4;
      b.position.set(Math.cos(a) * 0.8, 4.6, Math.sin(a) * 0.8);
      b.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
      b.castShadow = true; g.add(b);
    }
    const lg = [];
    for (let i = 0; i < 26; i++) {
      const s = 0.7 + r() * 0.9;
      const gg = new T.IcosahedronGeometry(s, 1);
      const a = r() * 6.3, d = r() * 2.4;
      gg.translate(Math.cos(a) * d, 5.4 + r() * 1.6 - d * 0.2, Math.sin(a) * d);
      const v = 0.75 + r() * 0.5;
      const col = new Float32Array(gg.attributes.position.count * 3);
      for (let k = 0; k < col.length; k += 3) { col[k] = 0.45 * v; col[k + 1] = 0.7 * v; col[k + 2] = 0.3 * v; }
      gg.setAttribute('color', new T.BufferAttribute(col, 3));
      lg.push(gg);
    }
    const leaves = new T.Mesh(mergeGeos(lg), leaf); leaves.castShadow = true; g.add(leaves);
    const fg = [];
    for (let i = 0; i < 34; i++) {
      const gg = new T.SphereGeometry(0.19, 10, 8);
      const a = r() * 6.3, d = 0.6 + r() * 2.5;
      gg.translate(Math.cos(a) * d, 4.9 + r() * 1.9, Math.sin(a) * d);
      fg.push(gg);
    }
    const fr = new T.Mesh(mergeGeos(fg), fruit); fr.castShadow = true; g.add(fr);
    g.position.set(-9.5, 0, -8);
    props.add(g);
    const g2 = g.clone(); g2.position.set(11, 0, -10); g2.rotation.y = 2.1; g2.scale.setScalar(0.85); props.add(g2);
  })();

  (function jars() {
    const jarMat = new T.MeshStandardMaterial({ color: 0x4a2e1e, roughness: 0.35, metalness: 0.05 });
    const lidMat = new T.MeshStandardMaterial({ color: 0x3a241a, roughness: 0.5 });
    const pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new T.Vector2(0.35 + Math.sin(t * Math.PI) * 0.55 + t * 0.05, t * 1.5)); }
    const geo = new T.LatheGeometry(pts, 20);
    const base = new T.Mesh(new T.BoxGeometry(6, 0.3, 2.4), new T.MeshStandardMaterial({ color: 0x6a6660, roughness: 1 }));
    base.position.set(8.5, 0.15, -6); base.receiveShadow = true; base.castShadow = true; props.add(base);
    for (let i = 0; i < 5; i++) {
      const s = 0.8 + ((i * 7) % 3) * 0.15;
      const j = new T.Mesh(geo, jarMat); j.scale.setScalar(s);
      j.position.set(6.4 + i * 1.05, 0.3, -6 + ((i % 2) - 0.5) * 0.8);
      j.castShadow = true; props.add(j);
      const lid = new T.Mesh(new T.CylinderGeometry(0.45 * s, 0.38 * s, 0.14, 16), lidMat);
      lid.position.set(j.position.x, 0.3 + 1.5 * s + 0.05, j.position.z); lid.castShadow = true; props.add(lid);
    }
  })();

  (function lantern() {
    const poleMat = new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9 });
    const pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 5.2, 8), poleMat);
    pole.position.set(5.2, 2.6, 2.4); pole.castShadow = true; props.add(pole);
    const arm = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.2, 6), poleMat);
    arm.rotation.z = Math.PI / 2; arm.position.set(4.7, 5.1, 2.4); props.add(arm);
    const paper = new T.MeshStandardMaterial({ color: 0xffd8a0, emissive: new T.Color(1.6, 0.9, 0.35), roughness: 0.9, transparent: true, opacity: 0.95 });
    const body = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.7, 10), paper);
    body.position.set(4.3, 4.3, 2.4); props.add(body);
    const cap = new T.Mesh(new T.CylinderGeometry(0.08, 0.4, 0.18, 10), poleMat); cap.position.set(4.3, 4.72, 2.4); props.add(cap);
    const bot = new T.Mesh(new T.CylinderGeometry(0.38, 0.3, 0.1, 10), poleMat); bot.position.set(4.3, 3.9, 2.4); props.add(bot);
    lampL.position.set(4.3, 4.25, 2.4);
    SC.lampBody = body;
  })();

  // 절구·감 바구니(왼쪽 앞) — 빈 자리 채우기
  (function leftProps() {
    const stone = new T.MeshStandardMaterial({ color: 0x7a7670, roughness: 0.95 });
    const pts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new T.Vector2(0.55 + t * 0.25 - Math.sin(t * Math.PI) * 0.08, t * 0.9)); }
    pts.push(new T.Vector2(0.62, 0.9), new T.Vector2(0.4, 0.75));
    const mortar = new T.Mesh(new T.LatheGeometry(pts, 18), stone);
    mortar.position.set(-7.2, 0, 1.4); mortar.castShadow = true; mortar.receiveShadow = true; props.add(mortar);
    const pestle = new T.Mesh(new T.CylinderGeometry(0.11, 0.14, 1.9, 8), new T.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 }));
    pestle.position.set(-6.9, 1.15, 1.1); pestle.rotation.set(0.35, 0, -0.55); pestle.castShadow = true; props.add(pestle);
    // 대나무 바구니 + 감
    const bask = new T.Mesh(new T.LatheGeometry([new T.Vector2(0.05, 0), new T.Vector2(0.55, 0), new T.Vector2(0.8, 0.45), new T.Vector2(0.82, 0.5), new T.Vector2(0.74, 0.5), new T.Vector2(0.5, 0.06)], 16),
      new T.MeshStandardMaterial({ color: 0xb08a50, roughness: 0.9, side: T.DoubleSide }));
    bask.position.set(-7.6, 0, 3.6); bask.castShadow = true; bask.receiveShadow = true; props.add(bask);
    const gs = [];
    const r2 = rng(31);
    for (let i = 0; i < 9; i++) { const g = new T.SphereGeometry(0.2, 10, 8); g.scale(1, 0.85, 1); const a = r2() * 6.3, d = r2() * 0.45; g.translate(Math.cos(a) * d, 0.42 + (i > 5 ? 0.3 : 0), Math.sin(a) * d); gs.push(g); }
    const fruit = new T.Mesh(mergeGeos(gs), new T.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.45, emissive: 0x401800, emissiveIntensity: 0.35 }));
    fruit.position.copy(bask.position); fruit.castShadow = true; props.add(fruit);
    // 뒤쪽 짚단 둘
    const hayT = tex(matTex(), 2); hayT.repeat.set(3, 1.5);
    const hay = new T.MeshStandardMaterial({ map: hayT, color: 0xe0b060, roughness: 1 });
    const tie = new T.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 });
    for (const [x, z, s] of [[-8.5, -4.5, 1], [-7.2, -5.6, 0.8], [-9.6, -2.6, 0.9]]) {
      const h = new T.Mesh(new T.CylinderGeometry(0.62 * s, 0.9 * s, 1.7 * s, 14), hay);
      h.position.set(x, 0.85 * s, z); h.rotation.y = x; h.castShadow = true; h.receiveShadow = true; props.add(h);
      const top = new T.Mesh(new T.SphereGeometry(0.62 * s, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), hay);
      top.position.set(x, 1.7 * s, z); top.castShadow = true; props.add(top);
      const band = new T.Mesh(new T.TorusGeometry(0.72 * s, 0.05, 6, 20), tie);
      band.rotation.x = Math.PI / 2; band.position.set(x, 1.0 * s, z); props.add(band);
    }
  })();

  // 보름달 + 별
  (function sky() {
    const moon = new T.Mesh(new T.SphereGeometry(2.6, 24, 16), new T.MeshBasicMaterial({ color: new T.Color(2.4, 2.4, 2.1), fog: false }));
    moon.position.set(-22, 30, -46); scene.add(moon);
    const halo = new T.Mesh(new T.SphereGeometry(4.2, 24, 16), new T.MeshBasicMaterial({ color: 0xbfc8ff, transparent: true, opacity: 0.12, fog: false }));
    halo.position.copy(moon.position); scene.add(halo);
    const r = rng(77), n = 220;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = r() * 6.3, e = 0.15 + r() * 1.2, d = 80;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * d; pos[i * 3 + 1] = Math.sin(e) * d; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * d;
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xdfe6ff, size: 0.35, fog: false, transparent: true, opacity: 0.85 })));
    // 먼 산 실루엣
    const hill = new T.MeshBasicMaterial({ color: 0x0a1226, fog: false });
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + 0.3, d = 55;
      const h = new T.Mesh(new T.SphereGeometry(16 + (i % 3) * 5, 16, 10), hill);
      h.scale.set(1.6, 0.42, 1);
      h.position.set(Math.cos(a) * d, -2, Math.sin(a) * d);
      scene.add(h);
    }
  })();

  // ---------- 윷가락 ----------
  const STICK_L = 1.55, STICK_R = 0.175;
  SC.STICK_L = STICK_L; SC.STICK_R = STICK_R;
  // 무늬(상점)
  const SKINS = [
    { id: 'pine', name: '소나무', price: 0, base: [222, 186, 128], dark: [150, 104, 56] },
    { id: 'chestnut', name: '밤나무', price: 150, base: [150, 96, 52], dark: [90, 50, 22] },
    { id: 'bamboo', name: '대나무', price: 300, base: [206, 196, 120], dark: [140, 130, 60], node: 1 },
    { id: 'birch', name: '자작나무', price: 450, base: [236, 226, 206], dark: [120, 110, 100], birch: 1 },
    { id: 'ebony', name: '먹감나무', price: 600, base: [70, 56, 46], dark: [24, 18, 14] },
    { id: 'lacquer', name: '옻칠', price: 800, paint: '#b8342a', gloss: 1 },
    { id: 'pearl', name: '자개', price: 1000, pearl: 1, gloss: 1 },
    { id: 'jade', name: '옥', price: 1300, paint: '#5aa88a', jade: 1, gloss: 1 },
    { id: 'gold', name: '금박', price: 1600, gold: 1 },
    { id: 'ice', name: '얼음', price: 2000, ice: 1 },
    { id: 'rainbow', name: '무지개', price: 2500, rainbow: 1 },
    { id: 'glow', name: '야광', price: 3200, glow: 1 },
  ];
  SC.SKINS = SKINS;
  // 윷가락 질감 한 판(512): 위 절반 = 둥근 등(길이 방향이 세로), 왼쪽 아래 = 배(자른 면, 길이 방향이 가로), 오른쪽 아래 = 끝 나이테
  const mixc = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
  function grainLines(x, x0, y0, w, h, along, col, n, r, alpha, width) {
    // along 'y': 결이 세로로 흐름(등), 'x': 가로(배)
    x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
    for (let i = 0; i < n; i++) {
      const late = r() < 0.32;
      x.strokeStyle = rgba(col, (late ? alpha * 2.2 : alpha) * (0.6 + r() * 0.8));
      x.lineWidth = (late ? 1.2 : 0.6) * width * (0.6 + r() * 1.2);
      const off = (i / n) * (along === 'y' ? w : h) + (r() - 0.5) * 6;
      const amp = 2 + r() * 5, fr = 0.01 + r() * 0.02, ph = r() * 6.3;
      x.beginPath();
      const len = along === 'y' ? h : w;
      for (let k = 0; k <= 24; k++) {
        const t = (k / 24) * len, wob = Math.sin(t * fr + ph) * amp + Math.sin(t * fr * 3.1 + ph * 2) * amp * 0.3;
        const px = along === 'y' ? x0 + off + wob : x0 + t, py = along === 'y' ? y0 + t : y0 + off + wob;
        k ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    }
    x.restore();
  }
  function knot(x, cx, cy, rad, dark, base, r, squash) {
    x.save(); x.translate(cx, cy); x.scale(squash || 1, 1);
    for (let k = 6; k >= 0; k--) {
      const rr = rad * (0.25 + k * 0.13);
      x.fillStyle = rgba(k % 2 ? dark : mixc(base, dark, 0.45), 0.55 + (6 - k) * 0.05);
      x.beginPath(); x.ellipse(0, 0, rr, rr * (0.8 + r() * 0.2), 0, 0, 6.3); x.fill();
    }
    x.fillStyle = rgba(dark, 0.9); x.beginPath(); x.ellipse(0, 0, rad * 0.2, rad * 0.16, 0, 0, 6.3); x.fill();
    x.restore();
  }
  // 넓은 색 얼룩 띠(결 방향으로 흐르는 밝고 어두운 띠)
  function bands(x, x0, y0, w, h, along, dark, light, n, r) {
    x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
    for (let i = 0; i < n; i++) {
      const col = r() < 0.5 ? dark : light, a = 0.08 + r() * 0.1;
      const span = along === 'y' ? w : h, pos = r() * span, wid = span * (0.05 + r() * 0.12);
      const g = along === 'y' ? x.createLinearGradient(x0 + pos - wid, 0, x0 + pos + wid, 0) : x.createLinearGradient(0, y0 + pos - wid, 0, y0 + pos + wid);
      g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g; x.fillRect(x0, y0, w, h);
    }
    x.restore();
  }
  function speckle(x, x0, y0, w, h, n, r, col, a) {
    for (let i = 0; i < n; i++) { x.fillStyle = rgba(col, r() * a); x.fillRect(x0 + r() * w, y0 + r() * h, 1 + r() * 2, 1); }
  }
  function stickTex(sk, seed) {
    const S = 512, H = S / 2, c = canvas(S, S), x = c.getContext('2d'), r = rng(seed * 13 + 1);
    const wood = !!sk.base;
    const base = sk.base || [200, 170, 120], dark = sk.dark || [110, 70, 30], light = mixc(base, [255, 250, 235], 0.45);
    if (wood) {
      // --- 등(둥근 면, 위 절반): 껍질 벗긴 나무 — 살짝 짙고 결이 촘촘 ---
      const backBase = mixc(base, dark, 0.5);
      x.fillStyle = rgb(backBase); x.fillRect(0, 0, S, H);
      speckle(x, 0, 0, S, H, 5000, r, dark, 0.25);
      bands(x, 0, 0, S, H, 'y', dark, light, 9, r);
      grainLines(x, 0, 0, S, H, 'y', dark, 125, r, 0.3, 1.15);
      grainLines(x, 0, 0, S, H, 'y', light, 30, r, 0.12, 0.8);
      const nk = 2 + ((r() * 2) | 0);
      for (let k = 0; k < nk; k++) knot(x, 40 + r() * (S - 80), 20 + r() * (H - 40), 10 + r() * 12, dark, backBase, r, 0.7);
      if (sk.node) for (let k = 0; k < 3; k++) { const yy = 30 + k * 90 + r() * 20; x.fillStyle = rgba(dark, 0.55); x.fillRect(0, yy, S, 7); x.fillStyle = rgba(light, 0.5); x.fillRect(0, yy - 3, S, 3); }
      if (sk.birch) for (let k = 0; k < 40; k++) { x.fillStyle = rgba([40, 36, 34], 0.75); x.fillRect(r() * S, r() * H, 2 + r() * 3, 8 + r() * 40); }
      // 둥근 면 명암: 가운데(위) 밝고 양옆 어둡게, 얇은 하이라이트 띠
      let g = x.createLinearGradient(0, 0, S, 0);
      g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(255,245,220,.16)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)');
      x.fillStyle = g; x.fillRect(0, 0, S, H);
      // 등에 X 세 개(가락마다 있는 표시) — 판 위 절반의 가운데(둥근 꼭대기), 길이 방향으로 셋
      // 둥근 면은 가로(둘레) 픽셀이 세로(길이)보다 촘촘해서, 같은 크기로 보이게 세로를 눌러 그린다
      const arcLen = STICK_R * SEG, ky = (H / STICK_L) / (S / arcLen);
      const drawX = (yy, col, lw, r0) => { x.save(); x.translate(S / 2, yy); x.scale(1, ky); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r0, -r0); x.lineTo(r0, r0); x.moveTo(r0, -r0); x.lineTo(-r0, r0); x.stroke(); x.restore(); };
      for (const yy of [H * 0.2, H * 0.5, H * 0.8]) { drawX(yy, 'rgba(80,40,10,.35)', 22, 78); drawX(yy, 'rgba(30,14,6,.92)', 12, 78); }
      // --- 배(자른 면, 왼쏙 아래): 연한 속살 + 가로 결 + 옹이 + 톱자국 ---
      x.fillStyle = rgb(light); x.fillRect(0, H, H, H);
      speckle(x, 0, H, H, H, 2500, r, dark, 0.14);
      bands(x, 0, H, H, H, 'x', dark, light, 6, r);
      grainLines(x, 0, H, H, H, 'x', dark, 54, r, 0.36, 1.25);
      grainLines(x, 0, H, H, H, 'x', mixc(base, dark, 0.5), 18, r, 0.1, 2.2);
      knot(x, 40 + r() * (H - 80), H + 40 + r() * (H - 80), 9 + r() * 9, dark, light, r, 1.6);
      for (let k = 0; k < 14; k++) { x.strokeStyle = rgba(dark, 0.06 + r() * 0.06); x.lineWidth = 1; const xx = r() * H; x.beginPath(); x.moveTo(xx, H); x.lineTo(xx + (r() - 0.5) * 30, S); x.stroke(); }
      g = x.createLinearGradient(0, H, 0, S);
      g.addColorStop(0, 'rgba(0,0,0,.25)'); g.addColorStop(0.12, 'rgba(0,0,0,0)'); g.addColorStop(0.88, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)');
      x.fillStyle = g; x.fillRect(0, H, H, H);
    } else {
      // 특별 무늬: 판 전체 채우고, 등 쪽 명암만 얹는다
      if (sk.paint) { x.fillStyle = sk.paint; x.fillRect(0, 0, S, S); if (sk.jade) for (let i = 0; i < 90; i++) { x.fillStyle = rgba([255, 255, 255], 0.06 + r() * 0.08); x.beginPath(); x.ellipse(r() * S, r() * S, 30 + r() * 40, 6 + r() * 8, r() * 3, 0, 6.3); x.fill(); } }
      else if (sk.pearl) {
        x.fillStyle = '#141a22'; x.fillRect(0, 0, S, S);
        for (let i = 0; i < 500; i++) { x.fillStyle = 'hsla(' + r() * 360 + ',70%,' + (60 + r() * 30) + '%,' + (0.5 + r() * 0.4) + ')'; x.beginPath(); const px = r() * S, py = r() * S; x.moveTo(px, py); for (let k = 0; k < 5; k++) x.lineTo(px + (r() - 0.5) * 40, py + (r() - 0.5) * 40); x.fill(); }
      } else if (sk.gold) {
        const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#f8e08a'); g.addColorStop(0.5, '#c8901a'); g.addColorStop(1, '#f6d870');
        x.fillStyle = g; x.fillRect(0, 0, S, S); speckle(x, 0, 0, S, S, 3000, r, [255, 240, 180], 0.3);
        grainLines(x, 0, 0, S, S, 'y', [120, 80, 10], 40, r, 0.08, 1);
      } else if (sk.ice) {
        x.fillStyle = '#bfe8ff'; x.fillRect(0, 0, S, S); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2;
        for (let i = 0; i < 50; i++) { x.beginPath(); x.moveTo(r() * S, r() * S); x.lineTo(r() * S, r() * S); x.stroke(); }
      } else if (sk.rainbow) {
        const g = x.createLinearGradient(0, 0, S, 0); ['#ff5a5a', '#ffa23a', '#ffe14d', '#5ad46a', '#4ab0ff', '#9a6bff'].forEach((c2, i) => g.addColorStop(i / 5, c2));
        x.fillStyle = g; x.fillRect(0, 0, S, S);
        grainLines(x, 0, 0, S, S, 'y', [0, 0, 0], 40, r, 0.06, 1);
      } else if (sk.glow) {
        x.fillStyle = '#183a2a'; x.fillRect(0, 0, S, S);
        for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(120,255,180,.9)'; x.beginPath(); x.arc(r() * S, r() * S, 4 + r() * 8, 0, 6.3); x.fill(); }
      }
      const g = x.createLinearGradient(0, 0, S, 0);
      g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.22)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      x.fillStyle = g; x.fillRect(0, 0, S, H);
    }
    // --- 끝(오른쪽 아래): 나이테 ---
    const cx = S * 0.75, cy = S * 0.75, R0 = S * 0.2 + 6;
    x.save(); x.beginPath(); x.rect(H, H, H, H); x.clip();
    x.fillStyle = wood ? rgb(mixc(base, light, 0.3)) : rgba([255, 255, 255], 0.12); x.fillRect(H, H, H, H);
    if (wood) {
      const ox = (r() - 0.5) * 40, oy = (r() - 0.5) * 30;
      for (let k = 22; k >= 0; k--) {
        const rr = (k / 22) * R0 * 1.25;
        x.strokeStyle = rgba(dark, k % 2 ? 0.75 : 0.3); x.lineWidth = k % 2 ? 2.2 + r() * 1.5 : 3.2;
        x.beginPath(); x.ellipse(cx + ox * (1 - k / 22), cy + oy * (1 - k / 22), rr, rr * (0.86 + r() * 0.1), 0.2, 0, 6.3); x.stroke();
      }
      speckle(x, H, H, H, H, 1500, r, dark, 0.2);
      x.strokeStyle = rgba(dark, 0.9); x.lineWidth = 5; x.beginPath(); x.ellipse(cx, cy, R0 * 1.02, R0 * 1.02, 0, 0, 6.3); x.stroke(); // 껍질 자리
      x.fillStyle = rgba(dark, 0.35); x.beginPath(); x.ellipse(cx + ox, cy + oy, 7, 6, 0, 0, 6.3); x.fill(); // 심
      for (let k = 0; k < 3; k++) { x.strokeStyle = rgba(dark, 0.5); x.lineWidth = 1.2; x.beginPath(); x.moveTo(cx + ox, cy + oy); const a = r() * 6.3; x.lineTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); x.stroke(); }
    } else { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(H, H, H, H); }
    x.restore();
    return c;
  }
  // 범프(울퉁불퉁) 판: 질감을 흑백으로 눌러서
  function bumpOf(c) {
    const b = canvas(c.width, c.height), x = b.getContext('2d');
    x.filter = 'grayscale(1) contrast(1.6) brightness(1.1)';
    x.drawImage(c, 0, 0);
    return b;
  }
  // 단면: 반원보다 조금 두툼한 활꼴(둥근 쪽이 무거워 배가 자주 위로 온다). 배(평평한 면)는 y = FLAT_Y
  const SEG = 1.22 * Math.PI, TH0 = Math.PI / 2 - SEG / 2;
  const FLAT_Y = STICK_R * Math.sin(TH0);
  SC.FLAT_Y = FLAT_Y; SC.SEG = SEG; SC.TH0 = TH0;
  function stickGeo() {
    // 축 = X, 둥근 면은 +Y 쪽, 배는 y = FLAT_Y (아래)
    const cyl = new T.CylinderGeometry(STICK_R, STICK_R, STICK_L, 20, 1, true, TH0, SEG);
    cyl.rotateZ(Math.PI / 2); // 축을 X 로 (원래 x → y)
    { const uv = cyl.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), 0.5 + uv.getY(i) * 0.5); } // 등: 판 위 절반
    const halfW = STICK_R * Math.cos(TH0);
    const flat = new T.PlaneGeometry(STICK_L, halfW * 2);
    flat.rotateX(Math.PI / 2); // 법선 -Y
    flat.translate(0, FLAT_Y, 0);
    { const uv = flat.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 0.5); } // 배: 판 왼쪽 아래
    // 양 끝 덮개: 활꼴을 현의 가운데에서 부채처럼
    function cap(sign) {
      const pos = [], nor = [], uv = [];
      const n = 20;
      const cx = sign * STICK_L / 2;
      for (let k = 0; k < n; k++) {
        const a0 = TH0 + (k / n) * SEG, a1 = TH0 + ((k + 1) / n) * SEG;
        const p0 = [cx, STICK_R * Math.sin(a0), STICK_R * Math.cos(a0)], p1 = [cx, STICK_R * Math.sin(a1), STICK_R * Math.cos(a1)], m = [cx, FLAT_Y, 0];
        const tri = sign > 0 ? [m, p1, p0] : [m, p0, p1]; // +x 끝은 바깥에서 볼 때 반시계가 되게
        for (const q of tri) { pos.push(q[0], q[1], q[2]); nor.push(sign, 0, 0); uv.push(0.75 + (q[2] / STICK_R) * 0.2, 0.25 + (q[1] / STICK_R) * 0.2); } // 끝: 판 오른쪽 아래 나이테
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      return g;
    }
    const all = mergeGeosUV([cyl, flat, cap(-1), cap(1)]);
    all.computeBoundingBox();
    return all;
  }
  function mergeGeosUV(gs) {
    const list = gs.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of list) {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      const u = g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2).fill(0.5);
      uv.set(u, o * 2); o += g.attributes.position.count;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3)); out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return out;
  }
  SC.stickGeo = stickGeo();
  SC.stickMats = {};
  SC.stickMaterial = function (skinId) {
    if (SC.stickMats[skinId]) return SC.stickMats[skinId];
    const sk = SKINS.find((s) => s.id === skinId) || SKINS[0];
    const cv2 = stickTex(sk, 3);
    const m = new T.MeshStandardMaterial({ map: tex(cv2), roughness: sk.gloss || sk.gold || sk.ice ? 0.25 : 0.72, metalness: sk.gold ? 0.6 : 0.02 });
    if (sk.base) { m.bumpMap = tex(bumpOf(cv2), null, false); m.bumpScale = 0.011; }
    if (sk.glow) { m.emissive = new T.Color(0.3, 1.2, 0.6); m.emissiveMap = m.map; m.emissiveIntensity = 0.5; }
    if (sk.ice) { m.transparent = true; m.opacity = 0.85; }
    SC.stickMats[skinId] = m;
    return m;
  };
  // 뒷도 표시(배 쪽에 X 두 개)
  SC.backMark = function () {
    const c = canvas(64, 64), x = c.getContext('2d');
    x.strokeStyle = '#2a1408'; x.lineWidth = 8; x.lineCap = 'round';
    x.beginPath(); x.moveTo(16, 16); x.lineTo(48, 48); x.moveTo(48, 16); x.lineTo(16, 48); x.stroke();
    const m = new T.Mesh(new T.PlaneGeometry(STICK_R * 1.7, STICK_R * 1.7), new T.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = Math.PI / 2; m.position.y = FLAT_Y - 0.003; // 배(아래)쪽
    return m;
  };

  // ---------- 말(4팀: 강아지·고양이·토끼·병아리) ----------
  const TEAMS = [
    { id: 'dog', name: '강아지', face: '🐶', color: 0xe8b56a, dark: 0x8a5a2a, band: 0xd23a2a, light: 0xfff0d8 },
    { id: 'cat', name: '고양이', face: '🐱', color: 0x9a9aa8, dark: 0x4a4a58, band: 0x2f6fb8, light: 0xf4f4f8 },
    { id: 'rabbit', name: '토끼', face: '🐰', color: 0xf6f0ea, dark: 0xd8b8b8, band: 0x3e8f4a, light: 0xffc8d0 },
    { id: 'chick', name: '병아리', face: '🐥', color: 0xffd23a, dark: 0xd89a10, band: 0x8a3a8a, light: 0xff8a2a },
  ];
  SC.TEAMS = TEAMS;
  const pieceMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.02 });
  function colored(g, hex) {
    const c = new T.Color(hex);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return g;
  }
  function pieceGeo(team) {
    const t = TEAMS[team];
    const gs = [];
    // 몸(둥근 조약돌 같은 말)
    const body = new T.SphereGeometry(0.3, 18, 12); body.scale(1, 0.72, 1); body.translate(0, 0.22, 0); gs.push(colored(body, t.color));
    // 띠(팀 색)
    const band = new T.TorusGeometry(0.29, 0.045, 8, 22); band.rotateX(Math.PI / 2); band.translate(0, 0.2, 0); gs.push(colored(band, t.band));
    // 머리
    const head = new T.SphereGeometry(0.235, 18, 12); head.translate(0, 0.6, 0.02); gs.push(colored(head, t.color));
    // 얼굴 밝은 부분(주둥이)
    if (team !== 1) { const muz = new T.SphereGeometry(0.12, 12, 8); muz.scale(1.2, 0.8, 0.8); muz.translate(0, 0.53, 0.2); gs.push(colored(muz, t.light)); }
    // 눈
    for (const s of [-1, 1]) { const e = new T.SphereGeometry(0.035, 8, 6); e.translate(s * 0.095, 0.64, 0.2); gs.push(colored(e, 0x1a1210)); }
    // 코
    if (team !== 1) { const nose = new T.SphereGeometry(0.035, 8, 6); nose.scale(1.3, 0.8, 1); nose.translate(0, 0.575, 0.285); gs.push(colored(nose, team === 3 ? 0xff8a2a : 0x2a1a14)); }
    if (team === 0) { // 강아지: 늘어진 귀
      for (const s of [-1, 1]) { const e = new T.SphereGeometry(0.09, 10, 8); e.scale(0.7, 1.5, 0.5); e.translate(s * 0.24, 0.6, -0.02); gs.push(colored(e, t.dark)); }
      const tail = new T.SphereGeometry(0.07, 8, 6); tail.scale(0.8, 1.6, 0.8); tail.translate(0, 0.35, -0.3); gs.push(colored(tail, t.dark));
    } else if (team === 1) { // 고양이: 쫑긋 세모 귀(속 분홍) + 볼 두 개 + 분홍 코 + 수염 + 이마 줄무늬
      for (const sd of [-1, 1]) {
        const e = new T.ConeGeometry(0.1, 0.24, 3); e.rotateY(Math.PI); e.rotateZ(sd * -0.32); e.translate(sd * 0.14, 0.8, 0); gs.push(colored(e, t.color));
        const inr = new T.ConeGeometry(0.06, 0.15, 3); inr.rotateY(Math.PI); inr.rotateZ(sd * -0.32); inr.translate(sd * 0.137, 0.78, 0.035); gs.push(colored(inr, 0xf2a6b4));
        // 볼(주둥이 양쪽 불룩)
        const ch = new T.SphereGeometry(0.068, 10, 8); ch.scale(1.1, 0.85, 0.8); ch.translate(sd * 0.055, 0.535, 0.195); gs.push(colored(ch, t.light));
        // 수염 셋
        // 볼에서 바깥으로 부채처럼 퍼진다
        for (let k = 0; k < 3; k++) {
          const a = (1 - k) * 0.2, dx = sd * Math.cos(a), dy = Math.sin(a), L = 0.17;
          const w = new T.CylinderGeometry(0.006, 0.003, L, 4); w.rotateZ(Math.atan2(-dx, dy));
          w.translate(sd * 0.1 + dx * L / 2, 0.54 + (1 - k) * 0.012 + dy * L / 2, 0.215); gs.push(colored(w, 0xf4f4f8));
        }
      }
      const nose = new T.ConeGeometry(0.03, 0.035, 3); nose.rotateX(Math.PI); nose.rotateY(Math.PI); nose.translate(0, 0.585, 0.255); gs.push(colored(nose, 0xe07a8c));
      // 이마에서 정수리로 넘어가는 줄무늬 셋(머리 곡면을 따라 휜 띠)
      for (let k = -1; k <= 1; k++) {
        const st = new T.TorusGeometry(0.237, 0.012, 6, 14, k ? 0.5 : 0.7);
        st.rotateY(-Math.PI / 2); st.rotateX(-0.5); st.rotateZ(-k * 0.28);
        st.translate(k * 0.02, 0.6, 0.02); gs.push(colored(st, t.dark));
      }
      // 꼬리: 몸 아랫단을 뒤에서 옆으로 감싼다(위에서 봐도 머리 뒤로 솟지 않게)
      const tail = new T.TorusGeometry(0.31, 0.04, 6, 16, Math.PI * 0.55); tail.rotateX(Math.PI / 2); tail.rotateY(Math.PI * 0.15); tail.translate(0, 0.1, 0); gs.push(colored(tail, t.dark));
    } else if (team === 2) { // 토끼: 긴 귀
      for (const s of [-1, 1]) {
        const e = new T.SphereGeometry(0.075, 10, 8); e.scale(0.8, 2.4, 0.6); e.rotateZ(s * -0.18); e.translate(s * 0.12, 0.95, -0.02); gs.push(colored(e, t.color));
        const inr = new T.SphereGeometry(0.05, 8, 6); inr.scale(0.7, 2.0, 0.4); inr.rotateZ(s * -0.18); inr.translate(s * 0.12, 0.95, 0.03); gs.push(colored(inr, t.light));
      }
      const tail = new T.SphereGeometry(0.08, 8, 6); tail.translate(0, 0.3, -0.3); gs.push(colored(tail, 0xffffff));
    } else { // 병아리: 볏 + 부리 + 날개
      const comb = new T.SphereGeometry(0.06, 8, 6); comb.scale(0.7, 1.4, 0.7); comb.translate(0, 0.85, 0); gs.push(colored(comb, t.light));
      const beak = new T.ConeGeometry(0.05, 0.12, 6); beak.rotateX(Math.PI / 2); beak.translate(0, 0.57, 0.3); gs.push(colored(beak, t.light));
      for (const s of [-1, 1]) { const w = new T.SphereGeometry(0.12, 10, 8); w.scale(0.5, 1, 1.2); w.translate(s * 0.28, 0.25, 0); gs.push(colored(w, t.dark)); }
    }
    return mergeGeos(gs);
  }
  SC.pieceGeos = TEAMS.map((_, i) => pieceGeo(i));
  SC.makePiece = function (team) {
    const m = new T.Mesh(SC.pieceGeos[team], pieceMat);
    m.castShadow = true; m.receiveShadow = false;
    return m;
  };
  // 발밑 표시 고리(고를 수 있는 말)
  SC.ringGeo = new T.RingGeometry(0.34, 0.44, 32);
  SC.ringMat = new T.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85, depthWrite: false, side: T.DoubleSide });
  SC.ringMatSel = new T.MeshBasicMaterial({ color: 0x7cff8a, transparent: true, opacity: 0.95, depthWrite: false, side: T.DoubleSide });
  SC.ringMatDst = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, side: T.DoubleSide });
  // 접지 그림자 판(말 밑)
  (function () {
    const c = canvas(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 4, 32, 32, 30); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    SC.blobMat = new T.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false });
    SC.blobGeo = new T.PlaneGeometry(0.7, 0.7); SC.blobGeo.rotateX(-Math.PI / 2);
  })();

  // ---------- 카메라: 판 전체가 세로·가로 어디서든 들어오게 ----------
  const look = new T.Vector3(0, 0.1, 0.35);
  let camDist = 12;
  const PITCH = 0.9; // 라디안(내려보는 각)
  SC.fitCamera = function () {
    const w = innerWidth, h = innerHeight;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    cam.fov = cam.aspect < 1 ? 46 : 40;
    // 판+손 자리(±4.6)가 들어오는 거리를 이분 탐색
    const pts = [];
    const E = cam.aspect < 1 ? 4.15 : 4.7; // 세로 화면은 판을 더 크게(멍석 가장자리는 잘려도 된다)
    for (const [x, z] of [[E, E], [-E, E], [E, -E], [-E, -E], [E, 0], [-E, 0], [0, E], [0, -E]]) pts.push(new T.Vector3(x, 0.6, z));
    let lo = 5, hi = 40;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      cam.position.set(0, Math.sin(PITCH) * mid, Math.cos(PITCH) * mid + look.z);
      cam.lookAt(look); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      let ok = true;
      for (const p of pts) { const v = p.clone().project(cam); if (Math.abs(v.x) > 0.93 || v.y > 0.72 || v.y < -0.9) { ok = false; break; } }
      if (ok) hi = mid; else lo = mid;
    }
    camDist = hi;
    cam.position.set(0, Math.sin(PITCH) * camDist, Math.cos(PITCH) * camDist + look.z);
    cam.lookAt(look); cam.updateProjectionMatrix();
    SC.camBase = cam.position.clone();
  };
  SC.fitCamera();
  addEventListener('resize', SC.fitCamera);
  // 아주 살짝 숨쉬는 카메라
  SC.breathe = function (t) {
    if (!SC.camBase) return;
    cam.position.x = SC.camBase.x + Math.sin(t * 0.37) * 0.06;
    cam.position.y = SC.camBase.y + Math.sin(t * 0.53) * 0.04;
    cam.lookAt(look);
    if (SC.lampBody) { const f = 1 + Math.sin(t * 7.3) * 0.04 + Math.sin(t * 13.1) * 0.03; lampL.intensity = 26 * f; }
  };

  // ---------- 한 번 그려 두기(첫 프레임 끊김 방지) ----------
  SC.warm = function () {
    const tmp = [];
    for (let i = 0; i < 4; i++) { const m = SC.makePiece(i); m.position.set(0, -5, 0); scene.add(m); tmp.push(m); }
    const s = new T.Mesh(SC.stickGeo, SC.stickMaterial('pine')); s.position.set(0, -5, 0); scene.add(s); tmp.push(s);
    const r1 = new T.Mesh(SC.ringGeo, SC.ringMat); r1.position.y = -5; scene.add(r1); tmp.push(r1);
    const b = new T.Mesh(SC.blobGeo, SC.blobMat); b.position.y = -5; scene.add(b); tmp.push(b);
    R.compile(scene, cam);
    R.render(scene, cam);
    for (const m of tmp) scene.remove(m);
  };
})();
