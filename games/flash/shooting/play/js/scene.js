// 장면: 여름밤 야시장 사격장 부스. 줄무늬 천막·알전구·벨벳 막·3단 선반. 그림은 전부 코드.
// 단위는 미터(실제 치수). 카메라는 계산대 뒤에 서 있고 움직이지 않는다(멀미 없음).
(function () {
  const T = THREE;
  const SC = (window.SC = {});
  const cv = document.getElementById('cv');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: /[?&]shot\b/.test(location.search) });
  const MOBILE = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  SC.MOBILE = MOBILE;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.25 : 1.5));
  R.toneMapping = T.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.05;
  R.shadowMap.enabled = true;
  R.shadowMap.type = T.PCFSoftShadowMap;
  R.autoClear = false;
  SC.renderer = R;

  const scene = new T.Scene();
  SC.scene = scene;
  scene.background = new T.Color(0x0b0a1a);
  scene.fog = new T.Fog(0x0b0a1a, 7, 22);

  const cam = new T.PerspectiveCamera(30, 1, 0.05, 60);
  SC.camera = cam;
  const EYE = new T.Vector3(0, 1.42, 1.35);
  SC.EYE = EYE;

  // ---------- 작은 도구 ----------
  function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
  SC.rng = rng;
  const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const rgb = (a, k) => 'rgb(' + a.map((v) => clamp255(v * (k || 1))).join(',') + ')';
  const rgba = (a, al) => 'rgba(' + a.map(clamp255).join(',') + ',' + al + ')';
  SC.rgb = rgb; SC.rgba = rgba;
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  SC.canvas = canvas;
  function tex(c, rx, ry, srgb) {
    const t = new T.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = T.SRGBColorSpace;
    if (rx) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry || rx); }
    t.anisotropy = 4;
    return t;
  }
  SC.tex = tex;
  function mergeGeos(gs) {
    const list = gs.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of list) {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += c;
    }
    const out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    return out;
  }
  SC.mergeGeos = mergeGeos;
  function colored(g, hex, shade) {
    const c = new T.Color(hex);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    let y0 = Infinity, y1 = -Infinity;
    if (shade) { for (let i = 0; i < n; i++) { const y = g.attributes.position.getY(i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
    for (let i = 0; i < n; i++) {
      let k = 1;
      if (shade) { const t = (g.attributes.position.getY(i) - y0) / Math.max(1e-4, y1 - y0); k = 1 - shade + shade * t; }
      col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    return g;
  }
  SC.colored = colored;
  function noiseCanvas(S, seed, base, amp, blobs) {
    const c = canvas(S, S), x = c.getContext('2d'), r = rng(seed);
    x.fillStyle = rgb([base, base, base]); x.fillRect(0, 0, S, S);
    for (let i = 0; i < S * S * 0.25; i++) { const v = base + (r() - 0.5) * amp; x.fillStyle = rgb([v, v, v]); x.fillRect(r() * S, r() * S, 1 + r() * 1.5, 1 + r() * 1.5); }
    for (let i = 0; i < (blobs || 0); i++) { x.fillStyle = rgba([base - 30, base - 30, base - 30], 0.08); x.beginPath(); x.arc(r() * S, r() * S, 4 + r() * 20, 0, 6.3); x.fill(); }
    return c;
  }
  SC.noiseCanvas = noiseCanvas;
  function star(x, cx, cy, R0, r0) {
    x.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r0 : R0; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath(); x.fill();
  }
  SC.star = star;
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  SC.rr = rr;

  // ---------- 환경맵: 천막 안(따뜻한 알전구 줄) ----------
  (function env() {
    const es = new T.Scene();
    const c = canvas(16, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#3a1a14'); g.addColorStop(0.35, '#7a3a20'); g.addColorStop(0.5, '#2a1410'); g.addColorStop(1, '#0a0608');
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    es.add(new T.Mesh(new T.SphereGeometry(10, 24, 12), new T.MeshBasicMaterial({ map: tex(c), side: T.BackSide })));
    for (let i = 0; i < 9; i++) {
      const b = new T.Mesh(new T.SphereGeometry(0.35, 8, 6), new T.MeshBasicMaterial({ color: new T.Color(6, 4.2, 2.2) }));
      const a = (i / 8 - 0.5) * 2.4;
      b.position.set(Math.sin(a) * 6, 4.2, -Math.cos(a) * 6); es.add(b);
    }
    const front = new T.Mesh(new T.PlaneGeometry(6, 2), new T.MeshBasicMaterial({ color: new T.Color(1.6, 1.2, 0.9) }));
    front.position.set(0, 3, 6); front.lookAt(0, 0, 0); es.add(front);
    const pm = new T.PMREMGenerator(R);
    scene.environment = pm.fromScene(es, 0.03).texture;
    pm.dispose();
  })();

  // ---------- 빛: 개수 고정(점광 2 + 그림자 스포트 1) ----------
  const hemi = new T.HemisphereLight(0xffd7a8, 0x201018, 0.55);
  scene.add(hemi);
  const key = new T.SpotLight(0xffe2b8, 34, 9, 0.95, 0.55, 1.6);
  key.position.set(0.2, 2.75, 0.35);
  key.target.position.set(0, 1.05, -2.3);
  key.castShadow = true;
  key.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  key.shadow.camera.near = 0.8; key.shadow.camera.far = 6;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015; key.shadow.radius = 3;
  scene.add(key); scene.add(key.target);
  SC.key = key;
  // 알전구 줄의 따뜻한 빛: 점광 하나(빛 개수는 고정)
  const warmL = new T.PointLight(0xffac64, 9, 6, 1.5); warmL.position.set(0, 2.5, -1.2); scene.add(warmL);
  SC.warm = [warmL];

  // ---------- 나무 질감(칠한 판자) ----------
  function woodTex(S, seed, base, paint) {
    const c = canvas(S, S), x = c.getContext('2d'), r = rng(seed);
    x.fillStyle = rgb(base); x.fillRect(0, 0, S, S);
    const rows = 4;
    for (let j = 0; j < rows; j++) {
      const y0 = (j * S) / rows, hgt = S / rows;
      const k = 0.9 + r() * 0.2;
      x.fillStyle = rgb(base, k); x.fillRect(0, y0, S, hgt);
      for (let i = 0; i < 26; i++) {
        x.strokeStyle = rgba(base.map((v) => v * 0.6), 0.12 + r() * 0.18); x.lineWidth = 0.6 + r() * 1.6;
        const yy = y0 + r() * hgt, amp = 1 + r() * 3, ph = r() * 6;
        x.beginPath();
        for (let s = 0; s <= 32; s++) { const xx = (s / 32) * S; const v = yy + Math.sin(xx * 0.02 + ph) * amp; if (s) x.lineTo(xx, v); else x.moveTo(xx, v); }
        x.stroke();
      }
      x.fillStyle = rgba([20, 10, 6], 0.55); x.fillRect(0, y0, S, 2);
      x.fillStyle = rgba([255, 240, 210], 0.12); x.fillRect(0, y0 + 2, S, 2);
    }
    if (paint) {
      for (let i = 0; i < 70; i++) {
        x.fillStyle = rgba([150, 110, 70], 0.35 + r() * 0.3);
        x.beginPath(); x.ellipse(r() * S, r() * S, 2 + r() * 10, 1 + r() * 4, r() * 3, 0, 6.3); x.fill();
      }
    }
    for (let i = 0; i < 40; i++) { x.fillStyle = rgba([0, 0, 0], 0.05 + r() * 0.06); x.beginPath(); x.ellipse(r() * S, r() * S, 6 + r() * 30, 3 + r() * 12, r() * 3, 0, 6.3); x.fill(); }
    return c;
  }
  SC.woodTex = woodTex;
  const woodPlain = woodTex(512, 3, [164, 118, 72]);
  const shelfMat = new T.MeshStandardMaterial({ map: tex(woodTex(512, 9, [196, 60, 48], true), 2, 0.5), roughness: 0.75 });
  const postMat = new T.MeshStandardMaterial({ map: tex(woodTex(256, 5, [236, 206, 120], true), 1, 3), roughness: 0.7 });
  const darkWood = new T.MeshStandardMaterial({ map: tex(woodTex(512, 7, [92, 58, 36]), 2, 2), roughness: 0.85 });
  const counterTopMat = new T.MeshStandardMaterial({ map: tex(woodPlain, 3, 1), roughness: 0.55 });
  SC.mats = { shelfMat, postMat, darkWood, counterTopMat };

  // ---------- 바닥 ----------
  (function floor() {
    const c = canvas(512, 512), x = c.getContext('2d'), r = rng(44);
    x.fillStyle = '#2a2220'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) { const v = 30 + r() * 40; x.fillStyle = rgba([v + 8, v, v - 4], 0.6); x.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 2); }
    for (let i = 0; i < 30; i++) { x.fillStyle = rgba([10, 8, 8], 0.2); x.beginPath(); x.ellipse(r() * 512, r() * 512, 10 + r() * 40, 5 + r() * 20, r() * 3, 0, 6.3); x.fill(); }
    const g = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshStandardMaterial({ map: tex(c, 16), roughness: 1 }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  })();

  // ---------- 부스 골격 ----------
  const BOOTH = { W: 3.3, back: -3.05, front: 0.15, H: 2.95 };
  SC.BOOTH = BOOTH;
  const booth = new T.Group(); scene.add(booth);
  SC.booth = booth;
  function box(w, h, d, mat, x, y, z, cast) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = cast !== false; m.receiveShadow = true; booth.add(m); return m;
  }
  SC.box = box;

  // 뒤 막: 짙은 붉은 벨벳, 세로 주름
  (function curtain() {
    const c = canvas(512, 512), x = c.getContext('2d'), r = rng(12);
    const g = x.createLinearGradient(0, 0, 512, 0);
    for (let i = 0; i <= 16; i++) { const k = 0.5 + 0.5 * Math.cos(i * Math.PI); g.addColorStop(i / 16, rgb([92 + 70 * k, 14 + 14 * k, 26 + 16 * k])); }
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { x.fillStyle = rgba([255, 200, 200], r() * 0.05); x.fillRect(r() * 512, r() * 512, 1, 2 + r() * 4); }
    x.fillStyle = '#b8862a'; x.fillRect(0, 486, 512, 8);
    for (let i = 0; i < 512; i += 4) { x.fillStyle = i % 8 ? '#d8a840' : '#8a6018'; x.fillRect(i, 494, 3, 18); }
    const W = 3.4, H = 2.5;
    const geo = new T.PlaneGeometry(W, H, 96, 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const xx = p.getX(i); p.setZ(i, Math.sin((xx / W) * Math.PI * 16) * 0.035); }
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex(c), roughness: 0.95 }));
    m.position.set(0, 0.35 + H / 2, BOOTH.back + 0.05); m.receiveShadow = true;
    booth.add(m);
  })();

  // 선반 3단(판자 사이 틈으로 떨어진다) + 위 레일
  const TIERS = [
    { y: 0.95, z: -1.9 },
    { y: 1.25, z: -2.25 },
    { y: 1.55, z: -2.6 },
  ];
  SC.TIERS = TIERS;
  SC.SHELF = { len: 2.9, depth: 0.2, th: 0.035 };
  SC.RAIL = { y: 1.95, z: -2.86 };
  SC.PIT_Y = 0.42;
  const goldMat = new T.MeshStandardMaterial({ color: 0xd8a840, metalness: 0.6, roughness: 0.35 });
  SC.goldMat = goldMat;
  for (const t of TIERS) {
    box(SC.SHELF.len, SC.SHELF.th, SC.SHELF.depth, shelfMat, 0, t.y - SC.SHELF.th / 2, t.z);
    const lip = box(SC.SHELF.len, 0.02, 0.012, goldMat, 0, t.y - SC.SHELF.th - 0.005, t.z + SC.SHELF.depth / 2 + 0.006);
    lip.castShadow = false;
    for (const sx of [-1.3, 0, 1.3]) box(0.03, t.y - SC.PIT_Y, 0.03, darkWood, sx, (t.y + SC.PIT_Y) / 2 - SC.SHELF.th, t.z - 0.06);
  }
  (function pit() {
    const m = new T.Mesh(new T.BoxGeometry(3.3, 0.04, 1.5), new T.MeshStandardMaterial({ color: 0x1a1016, roughness: 1 }));
    m.position.set(0, SC.PIT_Y - 0.02, -2.35); m.receiveShadow = true; booth.add(m);
  })();
  // 선반 앞 치마판
  box(3.3, SC.PIT_Y + 0.33, 0.03, darkWood, 0, (SC.PIT_Y + 0.33) / 2, -1.62);
  // 위 레일: 쇠 막대 + 물결 판
  (function rail() {
    const steel = new T.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.85, roughness: 0.35 });
    SC.steel = steel;
    box(3.3, 0.025, 0.12, steel, 0, SC.RAIL.y - 0.0125, SC.RAIL.z);
    const c = canvas(512, 64), x = c.getContext('2d');
    x.fillStyle = '#1f5aa0'; x.fillRect(0, 0, 512, 64);
    for (let k = 0; k < 3; k++) {
      x.fillStyle = ['#2f7fd0', '#5aa8f0', '#bfe4ff'][k];
      x.beginPath(); x.moveTo(0, 64);
      for (let i = 0; i <= 512; i += 8) x.lineTo(i, 26 + k * 12 + Math.sin(i / 24 + k * 1.7) * 6);
      x.lineTo(512, 64); x.fill();
    }
    const board = box(3.3, 0.16, 0.02, new T.MeshStandardMaterial({ map: tex(c, 3, 1), roughness: 0.6 }), 0, SC.RAIL.y - 0.1, SC.RAIL.z + 0.07);
    board.castShadow = false;
  })();

  // 옆벽(구멍판): 레일 끝을 가린다
  const SIDE_X = 1.62;
  SC.SIDE_X = SIDE_X;
  const peg = (function () {
    const c = canvas(512, 512), x = c.getContext('2d'), r = rng(19);
    x.fillStyle = '#c89a5a'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) { x.fillStyle = rgba([120 + r() * 60, 80 + r() * 40, 40], 0.2); x.fillRect(r() * 512, r() * 512, 2, 1); }
    for (let j = 16; j < 512; j += 32) for (let i = 16; i < 512; i += 32) {
      x.fillStyle = '#3a2410'; x.beginPath(); x.arc(i, j, 4, 0, 6.3); x.fill();
      x.fillStyle = 'rgba(255,230,190,.3)'; x.beginPath(); x.arc(i + 1, j + 1.5, 4, 0.2, 2.8); x.fill();
    }
    return new T.MeshStandardMaterial({ map: tex(c, 2, 2), roughness: 0.85 });
  })();
  for (const s of [-1, 1]) {
    const w = box(0.04, 2.5, 1.55, peg, s * (SIDE_X + 0.02), 0.35 + 1.25, -2.3);
    w.castShadow = false;
  }
  // 기둥 넷 + 앞쪽 옆판
  for (const s of [-1, 1]) {
    box(0.1, BOOTH.H, 0.1, postMat, s * (BOOTH.W / 2 + 0.05), BOOTH.H / 2, BOOTH.front);
    box(0.1, BOOTH.H, 0.1, postMat, s * (BOOTH.W / 2 + 0.05), BOOTH.H / 2, BOOTH.back);
    box(0.06, BOOTH.H - 0.3, 1.5, darkWood, s * (BOOTH.W / 2 + 0.07), (BOOTH.H - 0.3) / 2, -0.7).castShadow = false;
  }
  // 계산대: 빨강 칠 판 + 금색 별 띠 + 윗판
  (function counter() {
    const c = canvas(1024, 256), x = c.getContext('2d'), r = rng(31);
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#c43a2c'); g.addColorStop(1, '#8a2018');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 10; i++) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * 102.4, 0, 3, 256); x.fillStyle = 'rgba(255,220,200,.12)'; x.fillRect(i * 102.4 + 3, 0, 2, 256); }
    x.fillStyle = '#e8b848';
    for (let i = 0; i < 12; i++) star(x, 42 + i * 86, 128, 20, 9);
    x.fillStyle = '#f0c858'; x.fillRect(0, 18, 1024, 10); x.fillRect(0, 228, 1024, 10);
    for (let i = 0; i < 90; i++) { x.fillStyle = rgba([60, 20, 10], 0.25); x.beginPath(); x.ellipse(r() * 1024, r() * 256, 2 + r() * 8, 1 + r() * 3, 0, 0, 6.3); x.fill(); }
    const front = new T.Mesh(new T.BoxGeometry(BOOTH.W + 0.3, 0.95, 0.05), new T.MeshStandardMaterial({ map: tex(c), roughness: 0.7 }));
    front.position.set(0, 0.475, BOOTH.front + 0.55); front.receiveShadow = true; booth.add(front);
    const top = new T.Mesh(new T.BoxGeometry(BOOTH.W + 0.4, 0.05, 0.62), counterTopMat);
    top.position.set(0, 0.975, BOOTH.front + 0.28); top.receiveShadow = true; top.castShadow = true; booth.add(top);
    SC.COUNTER_Y = 1.0;
  })();

  // 천막: 빨강·크림 줄무늬 지붕 + 물결 차양
  (function canopy() {
    const c = canvas(512, 256), x = c.getContext('2d'), r = rng(15);
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2e6cc' : '#c8281e'; x.fillRect(i * 64, 0, 64, 256); }
    for (let i = 0; i < 6000; i++) { x.fillStyle = rgba([0, 0, 0], r() * 0.05); x.fillRect(r() * 512, r() * 256, 1, 3); }
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    const canvasMat = new T.MeshStandardMaterial({ map: tex(c), roughness: 0.9, side: T.DoubleSide });
    const roof = new T.Mesh(new T.PlaneGeometry(BOOTH.W + 0.6, 3.6, 1, 1), canvasMat);
    roof.rotation.x = Math.PI / 2 + 0.12; roof.position.set(0, BOOTH.H + 0.08, (BOOTH.front + BOOTH.back) / 2 + 0.15);
    booth.add(roof);
    const vc = canvas(1024, 256), v = vc.getContext('2d');
    const n = 12, w = 1024 / n;
    for (let i = 0; i < n; i++) {
      v.fillStyle = i % 2 ? '#f2e6cc' : '#c8281e';
      v.beginPath(); v.moveTo(i * w, 0); v.lineTo(i * w + w, 0); v.lineTo(i * w + w, 150);
      v.arc(i * w + w / 2, 150, w / 2, 0, Math.PI); v.closePath(); v.fill();
      v.fillStyle = 'rgba(0,0,0,.18)'; v.fillRect(i * w, 0, 4, 150);
    }
    v.fillStyle = '#e8b848'; v.fillRect(0, 12, 1024, 10);
    const am = canvas(1024, 256), y = am.getContext('2d'); y.drawImage(vc, 0, 0);
    const d = y.getImageData(0, 0, 1024, 256);
    for (let i = 0; i < d.data.length; i += 4) { const on = d.data[i + 3] > 10 ? 255 : 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = on; d.data[i + 3] = 255; }
    y.putImageData(d, 0, 0);
    const valMat = new T.MeshStandardMaterial({ map: tex(vc), alphaMap: tex(am, 0, 0, false), alphaTest: 0.5, side: T.DoubleSide, roughness: 0.9 });
    const val = new T.Mesh(new T.PlaneGeometry(BOOTH.W + 0.6, 0.42), valMat);
    val.position.set(0, BOOTH.H - 0.14, BOOTH.front + 0.08);
    booth.add(val);
    const val2 = val.clone(); val2.position.set(0, BOOTH.H - 0.2, BOOTH.back + 0.1); booth.add(val2);
    SC.canvasMat = canvasMat;
  })();

  // 간판: 레일 위 판에 글자
  (function sign() {
    const c = canvas(1024, 256);
    const m = new T.Mesh(new T.PlaneGeometry(2.1, 0.46), new T.MeshStandardMaterial({ map: tex(c), roughness: 0.6 }));
    m.position.set(0, 2.52, SC.RAIL.z + 0.02);
    booth.add(m);
    SC.signMesh = m;
    SC.signDraw = function (text, font) {
      const x = c.getContext('2d');
      x.clearRect(0, 0, 1024, 256);
      const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#2a1a3a'); g.addColorStop(1, '#140c20');
      x.fillStyle = g; rr(x, 8, 8, 1008, 240, 40); x.fill();
      x.lineWidth = 12; x.strokeStyle = '#e8b848'; rr(x, 14, 14, 996, 228, 36); x.stroke();
      x.font = font || '900 150px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.lineWidth = 22; x.strokeStyle = '#7a1408'; x.strokeText(text, 512, 136);
      const tg = x.createLinearGradient(0, 60, 0, 200); tg.addColorStop(0, '#fff6c8'); tg.addColorStop(0.5, '#ffd24a'); tg.addColorStop(1, '#ff9a2a');
      x.fillStyle = tg; x.fillText(text, 512, 136);
      m.material.map.needsUpdate = true;
    };
    SC.signDraw('');
  })();

  // ---------- 알전구: 몸통 한 덩어리 + 번짐 점 ----------
  const glowTex = (function () {
    const c = canvas(64, 64), x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.2, 'rgba(255,200,120,.55)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return tex(c);
  })();
  SC.glowTex = glowTex;
  (function bulbs() {
    const pts = [];
    const lines = [[-1.72, 1.72, BOOTH.H - 0.34, BOOTH.front + 0.1, 17, 0.1], [-1.6, 1.6, BOOTH.H - 0.36, -1.1, 15, 0.14]];
    for (const L of lines) for (let i = 0; i < L[4]; i++) { const t = i / (L[4] - 1); pts.push([L[0] + (L[1] - L[0]) * t, L[2] - Math.sin(t * Math.PI) * L[5], L[3]]); }
    for (let i = 0; i < 14; i++) { const t = i / 13; pts.push([-1.02 + 2.04 * t, 2.77, SC.RAIL.z + 0.04]); pts.push([-1.02 + 2.04 * t, 2.27, SC.RAIL.z + 0.04]); }
    for (let i = 1; i < 4; i++) { const t = i / 4; pts.push([-1.07, 2.27 + 0.5 * t, SC.RAIL.z + 0.04]); pts.push([1.07, 2.27 + 0.5 * t, SC.RAIL.z + 0.04]); }
    const wireMat = new T.LineBasicMaterial({ color: 0x1a1210 });
    for (const L of lines) {
      const P = []; for (let i = 0; i <= 40; i++) { const t = i / 40; P.push(new T.Vector3(L[0] + (L[1] - L[0]) * t, L[2] + 0.03 - Math.sin(t * Math.PI) * L[5], L[3])); }
      booth.add(new T.Line(new T.BufferGeometry().setFromPoints(P), wireMat));
    }
    const gs = [];
    const cols = [0xfff0b0, 0xffb060, 0xff7a5a, 0xa8e0ff, 0xb8ff9a];
    pts.forEach((p, i) => {
      const g = new T.SphereGeometry(0.026, 10, 8); g.scale(1, 1.25, 1); g.translate(p[0], p[1] - 0.03, p[2]);
      gs.push(colored(g, cols[i % cols.length]));
      const s = new T.CylinderGeometry(0.012, 0.012, 0.02, 6); s.translate(p[0], p[1] - 0.002, p[2]); gs.push(colored(s, 0x303030));
    });
    const bm = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    bm.color.setScalar(2.2);
    booth.add(new T.Mesh(mergeGeos(gs), bm));
    const pos = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1] - 0.03; pos[i * 3 + 2] = p[2]; });
    const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    const glow = new T.Points(pg, new T.PointsMaterial({ map: glowTex, size: 0.2, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.8, toneMapped: false }));
    booth.add(glow);
    SC.bulbGlow = glow;
  })();

  // ---------- 바깥 야시장: 먼 불빛 + 가게 실루엣 ----------
  (function market() {
    const r = rng(88);
    const pos = [], col = [];
    for (let i = 0; i < 260; i++) {
      const side = r() < 0.5 ? -1 : 1;
      pos.push(side * (2.3 + r() * 7), 1.2 + r() * 2.6, -1 - r() * 12);
      const c = new T.Color().setHSL([0.08, 0.02, 0.12, 0.55, 0.95][(r() * 5) | 0], 0.8, 0.6);
      col.push(c.r, c.g, c.b);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    scene.add(new T.Points(g, new T.PointsMaterial({ map: glowTex, size: 0.55, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.55, fog: false })));
    const sil = new T.MeshStandardMaterial({ color: 0x1a1420, roughness: 1 });
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? -1 : 1, x = side * (2.8 + (i >> 1) * 1.6 + r()), z = -2 - r() * 7;
      const w = 1.4 + r(), h = 2.2 + r() * 0.8;
      const b = new T.Mesh(new T.BoxGeometry(w, h, 1.2), sil); b.position.set(x, h / 2, z); scene.add(b);
      const roof = new T.Mesh(new T.ConeGeometry(w * 0.8, 0.5, 4), new T.MeshStandardMaterial({ color: new T.Color().setHSL(r(), 0.5, 0.22), roughness: 1 }));
      roof.rotation.y = Math.PI / 4; roof.position.set(x, h + 0.25, z); scene.add(roof);
    }
  })();

  // ============================================================
  //  표적 모형
  // ============================================================
  SC.ITEM = {};
  // --- 깡통: 반지름 4.2cm, 높이 12.2cm. 상표 6가지 ---
  const CAN_R = 0.042, CAN_H = 0.122;
  SC.ITEM.can = { r: CAN_R, h: CAN_H };
  const LABELS = [
    { bg: ['#d8261e', '#a8140e'], band: '#ffe066', word: 'TOMATO', pic: 'tomato' },
    { bg: ['#ffb43a', '#e07818'], band: '#fff4d0', word: 'PEACH', pic: 'peach' },
    { bg: ['#2a6ad8', '#163a8a'], band: '#ffffff', word: 'TUNA', pic: 'fish' },
    { bg: ['#34a84a', '#1a6a2a'], band: '#ffe066', word: 'CORN', pic: 'corn' },
    { bg: ['#7a3ab8', '#4a1a7a'], band: '#ffd0f0', word: 'GRAPE', pic: 'grape' },
    { bg: ['#f0f0e8', '#c8c8c0'], band: '#d8261e', word: 'MILK', pic: 'cow' },
  ];
  function drawPic(x, p) {
    const blob = (col, cx, cy, rx, ry) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 6.3); x.fill(); };
    if (p === 'tomato') { blob('#ff4a3a', 0, 0, 44, 38); blob('rgba(255,255,255,.35)', -16, -14, 12, 8); x.fillStyle = '#2a8a2a'; for (let i = 0; i < 5; i++) { x.save(); x.rotate(i * 1.26); x.beginPath(); x.ellipse(0, -36, 5, 14, 0, 0, 6.3); x.fill(); x.restore(); } }
    else if (p === 'peach') { blob('#ffcf8a', 0, 2, 42, 40); blob('#ff8a6a', 12, 8, 26, 26); blob('rgba(255,255,255,.35)', -14, -14, 10, 7); x.fillStyle = '#4aa84a'; x.beginPath(); x.ellipse(10, -40, 16, 7, -0.5, 0, 6.3); x.fill(); }
    else if (p === 'fish') { x.fillStyle = '#bfe0ff'; x.beginPath(); x.ellipse(-6, 0, 44, 22, 0, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(30, 0); x.lineTo(56, -22); x.lineTo(56, 22); x.fill(); blob('#163a8a', -30, -5, 5, 5); }
    else if (p === 'corn') { blob('#ffd83a', 0, 0, 22, 44); x.fillStyle = 'rgba(160,110,0,.5)'; for (let j = -36; j < 40; j += 10) for (let i = -16; i < 18; i += 9) { x.beginPath(); x.arc(i, j, 3, 0, 6.3); x.fill(); } x.fillStyle = '#5ac85a'; x.beginPath(); x.moveTo(-6, 44); x.quadraticCurveTo(-40, 0, -30, -30); x.quadraticCurveTo(-14, 10, 0, 44); x.fill(); }
    else if (p === 'grape') { for (let j = 0; j < 4; j++) for (let i = 0; i <= 3 - j; i++) blob('#b86af0', (i - (3 - j) / 2) * 20, -20 + j * 18, 11, 11); x.fillStyle = '#4a8a2a'; x.fillRect(-3, -48, 6, 16); }
    else if (p === 'cow') { blob('#ffffff', 0, 0, 40, 34); blob('#1a1a1a', -14, -10, 12, 9); blob('#1a1a1a', 18, 8, 9, 12); blob('#ffb0b8', 0, 18, 22, 12); }
  }
  function labelTex(L, seed) {
    const W = 512, H = 256, c = canvas(W, H), x = c.getContext('2d'), r = rng(seed);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, L.bg[0]); g.addColorStop(1, L.bg[1]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#c8ccd0'; x.fillRect(0, 0, W, 18); x.fillRect(0, H - 18, W, 18);
    x.fillStyle = 'rgba(0,0,0,.25)'; for (const y of [6, 12, H - 12, H - 6]) x.fillRect(0, y, W, 2);
    x.fillStyle = L.band; x.fillRect(0, 40, W, 34); x.fillRect(0, H - 70, W, 20);
    for (const cx of [128, 384]) {
      x.save(); x.translate(cx, 150); x.scale(0.85, 0.85); drawPic(x, L.pic); x.restore();
      x.font = '900 32px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = L.bg[1]; x.fillText(L.word, cx, 58);
    }
    for (let i = 0; i < 400; i++) { x.fillStyle = rgba([255, 255, 255], r() * 0.08); x.fillRect(r() * W, r() * H, 1 + r() * 6, 1); }
    return c;
  }
  const canTop = (function () {
    const c = canvas(128, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 10, 64, 64, 64); g.addColorStop(0, '#e8ecef'); g.addColorStop(0.75, '#a8b0b8'); g.addColorStop(0.85, '#f4f6f8'); g.addColorStop(1, '#8a9098');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 2; for (const r0 of [40, 50]) { x.beginPath(); x.arc(64, 64, r0, 0, 6.3); x.stroke(); }
    return new T.MeshStandardMaterial({ map: tex(c), metalness: 0.9, roughness: 0.3 });
  })();
  SC.canMats = LABELS.map((L, i) => [new T.MeshStandardMaterial({ map: tex(labelTex(L, i + 3)), metalness: 0.35, roughness: 0.38 }), canTop, canTop]);
  SC.canGeo = new T.CylinderGeometry(CAN_R, CAN_R, CAN_H, 28, 1);

  // --- 유리병: 높이 26cm ---
  const BOT = { h: 0.26, r: 0.036 };
  SC.ITEM.bottle = BOT;
  const botProfile = [[0.0, 0], [0.03, 0.0], [0.036, 0.008], [0.036, 0.15], [0.033, 0.17], [0.022, 0.195], [0.013, 0.215], [0.012, 0.245], [0.015, 0.25], [0.015, 0.258], [0.0, 0.26]].map((p) => new T.Vector2(p[0], p[1] - BOT.h / 2));
  SC.botProfile = botProfile;
  SC.bottleGeo = new T.LatheGeometry(botProfile, 22);
  SC.bottleMats = [0x2a8a3a, 0x8a4a1a, 0x2a5aa8].map((c) => new T.MeshStandardMaterial({ color: c, metalness: 0.1, roughness: 0.08, transparent: true, opacity: 0.74, envMapIntensity: 1.6 }));
  SC.bottleLabel = (function () {
    const c = canvas(256, 64), x = c.getContext('2d');
    x.fillStyle = '#f4ead0'; x.fillRect(0, 0, 256, 64);
    x.fillStyle = '#c8281e'; x.fillRect(0, 6, 256, 6); x.fillRect(0, 52, 256, 6);
    x.font = '900 26px sans-serif'; x.fillStyle = '#3a1a10'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('SODA', 64, 33); x.fillText('SODA', 192, 33);
    const g = new T.CylinderGeometry(0.0368, 0.0368, 0.06, 22, 1, true);
    g.translate(0, -0.03, 0);
    return { geo: g, mat: new T.MeshStandardMaterial({ map: tex(c), roughness: 0.8 }) };
  })();
  // 깨진 조각: 병을 세로 6조각 x 2단. 조각마다 모양(얇은 곡면) + 충돌용 점
  function radiusAt(h) { // 병 높이 h(바닥 0)에서의 반지름
    for (let i = 1; i < botProfile.length; i++) { const a = botProfile[i - 1], b = botProfile[i], ya = a.y + BOT.h / 2, yb = b.y + BOT.h / 2; if (h >= ya && h <= yb) return a.x + ((b.x - a.x) * (h - ya)) / Math.max(1e-6, yb - ya); }
    return 0.012;
  }
  SC.shards = (function () {
    const out = [];
    const segs = 6, bands = [[0, 0.14], [0.14, 0.26]];
    for (const [h0, h1] of bands) {
      const prof = [0, 0.5, 1].map((t) => { const h = h0 + (h1 - h0) * t; return new T.Vector2(radiusAt(Math.max(0.004, Math.min(0.252, h))), h - BOT.h / 2); });
      for (let s = 0; s < segs; s++) {
        const a0 = (s / segs) * Math.PI * 2, a1 = ((s + 1) / segs) * Math.PI * 2;
        const outer = [], inner = [];
        for (const p of prof) for (let k = 0; k <= 3; k++) { const a = a0 + ((a1 - a0) * k) / 3; outer.push(new T.Vector3(Math.cos(a) * p.x, p.y, Math.sin(a) * p.x)); inner.push(new T.Vector3(Math.cos(a) * (p.x - 0.003), p.y, Math.sin(a) * (p.x - 0.003))); }
        const all = outer.concat(inner);
        const c = new T.Vector3(); all.forEach((p) => c.add(p)); c.divideScalar(all.length);
        all.forEach((p) => p.sub(c));
        const cols = 4, rows = prof.length, pos = [];
        const q = (arr, i, j) => arr[j * cols + i];
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) for (const arr of [outer, inner]) {
          const A = q(arr, i, j), B = q(arr, i + 1, j), C = q(arr, i + 1, j + 1), D = q(arr, i, j + 1);
          pos.push(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, A.x, A.y, A.z, C.x, C.y, C.z, D.x, D.y, D.z);
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
        out.push({ geo: g, center: c, pts: new Float32Array(all.flatMap((p) => [p.x, p.y, p.z])) });
      }
    }
    return out;
  })();
  SC.shardMats = SC.bottleMats.map((m) => { const k = m.clone(); k.side = T.DoubleSide; k.opacity = 0.8; return k; });

  // --- 나무 오리: 폭 16cm, 높이 16cm, 두께 2cm. 원점 = 바닥 가운데 ---
  SC.ITEM.duck = { w: 0.16, h: 0.16, d: 0.02 };
  (function duck() {
    const s = new T.Shape();
    s.moveTo(-0.07, 0.0);
    s.lineTo(0.06, 0.0);
    s.quadraticCurveTo(0.08, 0.035, 0.05, 0.065);
    s.quadraticCurveTo(0.03, 0.075, 0.02, 0.085);
    s.quadraticCurveTo(0.045, 0.1, 0.04, 0.125);
    s.lineTo(0.075, 0.12); s.lineTo(0.078, 0.128); s.lineTo(0.042, 0.143);
    s.quadraticCurveTo(0.03, 0.16, 0.005, 0.158);
    s.quadraticCurveTo(-0.02, 0.152, -0.02, 0.125);
    s.quadraticCurveTo(-0.018, 0.1, -0.005, 0.085);
    s.quadraticCurveTo(-0.05, 0.08, -0.07, 0.06);
    s.lineTo(-0.085, 0.075);
    s.lineTo(-0.075, 0.035);
    s.quadraticCurveTo(-0.08, 0.01, -0.07, 0.0);
    const g = new T.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 10 });
    g.translate(0, 0, -0.01);
    g.computeBoundingBox();
    const bb = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    SC.duckGeo = g;
    const c = canvas(256, 256), x = c.getContext('2d'), r = rng(61);
    const U = (X) => ((X - bb.min.x) / (bb.max.x - bb.min.x)) * 256, V = (Y) => 256 - ((Y - bb.min.y) / (bb.max.y - bb.min.y)) * 256;
    const gg = x.createLinearGradient(0, 0, 0, 256); gg.addColorStop(0, '#ffe45a'); gg.addColorStop(1, '#f0a818');
    x.fillStyle = gg; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#e89a10'; x.beginPath(); x.ellipse(U(-0.02), V(0.04), 44, 24, -0.15, 0, 6.3); x.fill();
    x.strokeStyle = '#b86a08'; x.lineWidth = 4; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(U(-0.02) + 14, V(0.04) - 22 + k * 12, 26, 0.3, 1.6); x.stroke(); }
    x.fillStyle = '#ff6a1a'; x.beginPath(); x.moveTo(U(0.035), V(0.12)); x.lineTo(U(0.08), V(0.124)); x.lineTo(U(0.042), V(0.145)); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(U(0.012), V(0.136), 12, 0, 6.3); x.fill();
    x.fillStyle = '#1a1210'; x.beginPath(); x.arc(U(0.017), V(0.136), 7, 0, 6.3); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(U(0.02), V(0.14), 2.5, 0, 6.3); x.fill();
    x.fillStyle = '#2f7fd0'; x.beginPath(); x.moveTo(0, 256); for (let i = 0; i <= 256; i += 8) x.lineTo(i, 234 + Math.sin(i / 14) * 6); x.lineTo(256, 256); x.fill();
    for (const [rad, col] of [[20, '#fff'], [13, '#d8261e'], [6, '#fff']]) { x.fillStyle = col; x.beginPath(); x.arc(U(-0.035), V(0.045), rad, 0, 6.3); x.fill(); }
    for (let i = 0; i < 60; i++) { x.fillStyle = rgba([200, 160, 100], 0.4); x.beginPath(); x.ellipse(r() * 256, r() * 256, 1 + r() * 4, 1 + r() * 2, r() * 3, 0, 6.3); x.fill(); }
    SC.duckMat = new T.MeshStandardMaterial({ map: tex(c), roughness: 0.55 });
    SC.duckFoot = new T.BoxGeometry(0.06, 0.012, 0.05);
    SC.duckFootMat = new T.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.8 });
  })();

  // --- 쇠 과녁(쓰러지는 철판): 지름 14cm 둥근 판 + 목 ---
  SC.ITEM.popper = { r: 0.07, th: 0.012, neck: 0.1 };
  (function popper() {
    const c = canvas(256, 256), x = c.getContext('2d');
    x.fillStyle = '#5a5a60'; x.fillRect(0, 0, 256, 256);
    const rings = ['#f0ece0', '#1a1a1a', '#f0ece0', '#1a1a1a', '#d8261e'];
    rings.forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(128, 128, 124 - i * 24, 0, 6.3); x.fill(); });
    x.fillStyle = '#ffe066'; x.beginPath(); x.arc(128, 128, 12, 0, 6.3); x.fill();
    const r = rng(8); for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(90,70,50,.2)'; x.beginPath(); x.arc(r() * 256, r() * 256, 2 + r() * 5, 0, 6.3); x.fill(); }
    const face = new T.MeshStandardMaterial({ map: tex(c), metalness: 0.35, roughness: 0.45 });
    const edge = new T.MeshStandardMaterial({ color: 0x5a5a60, metalness: 0.8, roughness: 0.4 });
    const g = new T.CylinderGeometry(0.07, 0.07, 0.012, 32);
    g.rotateX(Math.PI / 2);
    SC.popperMats = [edge, face, edge];
    SC.popperGeo = g;
    SC.popperNeck = new T.BoxGeometry(0.03, 0.1, 0.01);
    SC.popperEdge = edge;
  })();

  // --- 풍선: 지름 14cm ---
  SC.ITEM.balloon = { r: 0.07 };
  (function balloon() {
    const g = new T.SphereGeometry(0.07, 22, 16);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) { const k = 1 + (-y / 0.07) * 0.28; p.setY(i, y * k); const s = 1 - (-y / 0.07) * 0.18; p.setX(i, p.getX(i) * s); p.setZ(i, p.getZ(i) * s); } }
    g.computeVertexNormals();
    const knot = new T.ConeGeometry(0.012, 0.018, 8); knot.rotateX(Math.PI); knot.translate(0, -0.095, 0);
    SC.balloonGeo = mergeGeos([g, knot]);
    SC.balloonCols = [0xff3a4a, 0xffc83a, 0x3a9aff, 0x4ad86a, 0xff6ad8, 0xff8a2a, 0xa86aff];
    SC.balloonMats = SC.balloonCols.map((c) => new T.MeshStandardMaterial({ color: c, roughness: 0.22, envMapIntensity: 1.4 }));
    SC.stringMat = new T.LineBasicMaterial({ color: 0xf0f0f0, transparent: true, opacity: 0.6 });
    const c = canvas(512, 512), x = c.getContext('2d'), r = rng(71);
    x.fillStyle = '#b8864a'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 26000; i++) { const v = 120 + r() * 90; x.fillStyle = rgba([v + 20, v * 0.72, v * 0.4], 0.7); x.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
    x.strokeStyle = '#6a4020'; x.lineWidth = 18; x.strokeRect(9, 9, 494, 494);
    SC.corkBoardMat = new T.MeshStandardMaterial({ map: tex(c), roughness: 1 });
  })();

  // --- 도미노: 5 x 14 x 2.5cm ---
  SC.ITEM.domino = { w: 0.05, h: 0.14, d: 0.025 };
  (function domino() {
    const c = canvas(128, 256), x = c.getContext('2d');
    x.fillStyle = '#f6efe0'; x.fillRect(0, 0, 128, 256);
    x.fillStyle = '#1a1a1a'; x.fillRect(10, 126, 108, 5);
    for (const [px, py] of [[40, 50], [88, 90], [64, 70], [40, 170], [88, 170], [40, 210], [88, 210]]) { x.beginPath(); x.arc(px, py, 10, 0, 6.3); x.fill(); }
    const face = new T.MeshStandardMaterial({ map: tex(c), roughness: 0.35 });
    const side = new T.MeshStandardMaterial({ color: 0x24242a, roughness: 0.4 });
    SC.dominoMat = [side, side, side, side, face, face];
    SC.dominoGeo = new T.BoxGeometry(0.05, 0.14, 0.025);
  })();

  // --- 폭죽 상자: 11cm, 심지 ---
  SC.ITEM.boom = { s: 0.11 };
  (function boom() {
    const c = canvas(256, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#ff3a2a'); g.addColorStop(1, '#a8140e');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#ffd24a'; star(x, 128, 112, 72, 30);
    x.fillStyle = '#ffe890'; x.fillRect(0, 22, 256, 10);
    x.font = '900 40px sans-serif'; x.textAlign = 'center'; x.fillStyle = '#ffe890'; x.fillText('BOOM', 128, 222);
    x.strokeStyle = '#5a0a06'; x.lineWidth = 8; x.strokeRect(4, 4, 248, 248);
    SC.boomMat = new T.MeshStandardMaterial({ map: tex(c), roughness: 0.6 });
    SC.boomGeo = new T.BoxGeometry(0.11, 0.11, 0.11);
    SC.fuseGeo = new T.CylinderGeometry(0.004, 0.004, 0.05, 6); SC.fuseGeo.translate(0, 0.078, 0);
    SC.fuseMat = new T.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
  })();

  // --- 총알: 코르크(지름 1.8cm) · 비비탄 · 테니스공 ---
  SC.ITEM.cork = { r: 0.009, h: 0.022 };
  (function cork() {
    const c = noiseCanvas(64, 5, 170, 90, 30);
    const x = c.getContext('2d'); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#d8a060'; x.fillRect(0, 0, 64, 64);
    SC.corkMat = new T.MeshStandardMaterial({ map: tex(c), roughness: 1 });
    const g = new T.CylinderGeometry(0.0085, 0.0095, 0.022, 12); g.rotateX(Math.PI / 2);
    SC.corkGeo = g;
    SC.pelletGeo = new T.SphereGeometry(0.006, 8, 6);
    SC.pelletMat = new T.MeshStandardMaterial({ color: 0xffd24a, metalness: 0.2, roughness: 0.4 });
    SC.ballGeo = new T.SphereGeometry(0.033, 16, 12);
    const bc = canvas(128, 64), y = bc.getContext('2d'); y.fillStyle = '#d8f03a'; y.fillRect(0, 0, 128, 64); y.strokeStyle = '#fff'; y.lineWidth = 5; y.beginPath(); for (let i = 0; i <= 128; i += 4) y.lineTo(i, 32 + Math.sin((i / 128) * Math.PI * 4) * 16); y.stroke();
    SC.ballMat = new T.MeshStandardMaterial({ map: tex(bc), roughness: 0.9 });
  })();

  // ---------- 떠오르는 점수 글자(스프라이트) ----------
  SC.makeLabel = function () {
    const c = canvas(256, 96);
    const m = new T.SpriteMaterial({ map: tex(c), transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const s = new T.Sprite(m); s.scale.set(0.24, 0.09, 1); s.renderOrder = 60; s.visible = false;
    s.userData.draw = function (text, col) {
      const x = c.getContext('2d'); x.clearRect(0, 0, 256, 96);
      x.font = '900 60px Ria, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.lineWidth = 12; x.strokeStyle = '#3a0c06'; x.strokeText(text, 128, 50);
      x.fillStyle = col || '#ffe066'; x.fillText(text, 128, 50);
      m.map.needsUpdate = true;
    };
    scene.add(s);
    return s;
  };


  // --- 나무 핀(작은 볼링 핀): 높이 16cm, 흰 칠 + 빨간 띠 ---
  SC.ITEM.pin = { h: 0.16, r: 0.026 };
  (function pin() {
    const P = [[0, 0], [0.018, 0], [0.024, 0.02], [0.026, 0.045], [0.022, 0.075], [0.013, 0.1], [0.011, 0.115], [0.014, 0.135], [0.0135, 0.15], [0.007, 0.158], [0, 0.16]];
    SC.pinProfile = P.map((p) => new T.Vector2(p[0], p[1] - 0.08));
    const g = new T.LatheGeometry(SC.pinProfile, 20);
    const c = canvas(64, 256), x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, '#d8d0c0'); gr.addColorStop(0.5, '#fffaf0'); gr.addColorStop(1, '#d8d0c0');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 256);
    x.fillStyle = '#d8261e'; x.fillRect(0, 70, 64, 14); x.fillRect(0, 92, 64, 8);
    for (let i = 0; i < 80; i++) { x.fillStyle = 'rgba(120,90,60,.12)'; x.fillRect(Math.random() * 64, Math.random() * 256, 1, 4); }
    SC.pinGeo = g;
    SC.pinMat = new T.MeshStandardMaterial({ map: tex(c), roughness: 0.35 });
  })();
  SC.popperFoot = new T.BoxGeometry(0.1, 0.012, 0.07);

  // ============================================================
  //  경품 인형 12(마지막은 대왕 곰). 털 천 재질 + 반짝 눈
  // ============================================================
  const furBump = tex(noiseCanvas(128, 91, 128, 160, 0), 3, 3, false);
  SC.furMat = new T.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new T.Color(1, 1, 1), bumpMap: furBump, bumpScale: 0.6 });
  SC.glossMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.0 });
  SC.PRIZES = [
    { id: 'bear', name: '곰', c: 0xa86a3a, d: 0x6a3a1a, l: 0xf0d0a8, ears: 'round' },
    { id: 'rabbit', name: '토끼', c: 0xfff4f0, d: 0xf0b8c8, l: 0xffffff, ears: 'long' },
    { id: 'cat', name: '고양이', c: 0xf0a040, d: 0xc86a18, l: 0xfff0d8, ears: 'point', stripes: 1 },
    { id: 'dog', name: '강아지', c: 0xf0d8b0, d: 0x8a5a30, l: 0xffffff, ears: 'flop' },
    { id: 'duck', name: '오리', c: 0xffe04a, d: 0xf0a818, l: 0xff8a2a, ears: 'none', beak: 1 },
    { id: 'penguin', name: '펭귄', c: 0x2a2e3a, d: 0x1a1c24, l: 0xffffff, ears: 'none', beak: 1, belly: 1 },
    { id: 'pig', name: '돼지', c: 0xffb8c8, d: 0xf08aa0, l: 0xff9ab0, ears: 'point', snout: 1 },
    { id: 'frog', name: '개구리', c: 0x6ac84a, d: 0x3a8a2a, l: 0xe8f8b0, ears: 'eyes' },
    { id: 'panda', name: '판다', c: 0xffffff, d: 0x1a1a1a, l: 0xffffff, ears: 'round', panda: 1 },
    { id: 'fox', name: '여우', c: 0xf07a2a, d: 0x8a3a10, l: 0xffffff, ears: 'point', tail: 1 },
    { id: 'dino', name: '공룡', c: 0x7ad85a, d: 0x3a9a3a, l: 0xf8f0a0, ears: 'none', spikes: 1 },
    { id: 'king', name: '대왕 곰', c: 0xc8844a, d: 0x7a4a20, l: 0xf6dcb4, ears: 'round', ribbon: 1, big: 1 },
  ];
  SC.makePrize = function (idx) {
    const P = SC.PRIZES[idx];
    const fur = [], gloss = [];
    const S = (r, sx, sy, sz, x, y, z, col, seg) => { const g = new T.SphereGeometry(r, seg || 18, 14); g.scale(sx, sy, sz); g.translate(x, y, z); fur.push(colored(g, col, 0.25)); return g; };
    const G = (r, x, y, z, col) => { const g = new T.SphereGeometry(r, 12, 10); g.translate(x, y, z); gloss.push(colored(g, col)); };
    // 앉은 몸 + 발 + 팔
    S(0.07, 1, 1.05, 0.9, 0, 0.075, 0, P.c);
    if (P.belly) S(0.056, 1, 1.05, 0.55, 0, 0.075, 0.034, P.l);
    else S(0.042, 1, 1.1, 0.45, 0, 0.078, 0.046, P.l);
    for (const s of [-1, 1]) {
      S(0.028, 1, 0.8, 1.35, s * 0.04, 0.02, 0.05, P.d);
      const a = S(0.022, 1, 1.8, 1, s * 0.07, 0.085, 0.015, P.c);
    }
    // 머리
    const HY = 0.18;
    S(0.068, 1.08, 0.98, 1, 0, HY, 0.005, P.c);
    if (P.snout) S(0.026, 1.3, 1, 0.8, 0, HY - 0.012, 0.062, P.l);
    else if (!P.beak) S(0.03, 1.3, 0.85, 0.8, 0, HY - 0.018, 0.055, P.l);
    if (P.beak) { const b = new T.SphereGeometry(0.022, 12, 8); b.scale(1.4, 0.5, 1.2); b.translate(0, HY - 0.012, 0.066); fur.push(colored(b, 0xff8a2a)); }
    // 눈·코
    const eyeY = P.ears === 'eyes' ? HY + 0.05 : HY + 0.012;
    for (const s of [-1, 1]) {
      if (P.panda) S(0.02, 1, 1.25, 0.6, s * 0.03, eyeY, 0.055, P.d);
      if (P.ears === 'eyes') S(0.024, 1, 1, 1, s * 0.035, HY + 0.05, 0.03, P.c);
      G(0.011, s * 0.028, eyeY, 0.063, 0x0a0a0c);
      G(0.003, s * 0.028 + 0.004, eyeY + 0.004, 0.073, 0xffffff);
    }
    if (!P.beak) G(0.009, 0, HY - 0.008, P.snout ? 0.082 : 0.078, P.snout ? 0xd86a80 : 0x1a1210);
    // 볼 발그레
    for (const s of [-1, 1]) { const g = new T.SphereGeometry(0.011, 8, 6); g.scale(1.4, 0.8, 0.4); g.translate(s * 0.045, HY - 0.018, 0.058); fur.push(colored(g, 0xff9aa8)); }
    // 귀
    for (const s of [-1, 1]) {
      if (P.ears === 'round') { S(0.024, 1, 1, 0.6, s * 0.05, HY + 0.055, 0, P.panda ? P.d : P.c); S(0.013, 1, 1, 0.4, s * 0.05, HY + 0.055, 0.01, P.panda ? 0x3a3a3a : P.l); }
      else if (P.ears === 'long') { const e = S(0.018, 0.9, 3.0, 0.6, s * 0.025, HY + 0.1, -0.005, P.c); S(0.01, 0.9, 2.6, 0.3, s * 0.025, HY + 0.1, 0.006, P.d); }
      else if (P.ears === 'point') { const e = new T.ConeGeometry(0.024, 0.045, 12); e.rotateZ(-s * 0.35); e.translate(s * 0.045, HY + 0.07, 0); fur.push(colored(e, P.c, 0.2)); const e2 = new T.ConeGeometry(0.013, 0.03, 10); e2.rotateZ(-s * 0.35); e2.translate(s * 0.044, HY + 0.066, 0.008); fur.push(colored(e2, P.d)); }
      else if (P.ears === 'flop') { S(0.022, 0.7, 1.6, 0.5, s * 0.07, HY + 0.005, 0, P.d); }
    }
    if (P.stripes) for (let k = -1; k <= 1; k++) { const g = new T.TorusGeometry(0.066, 0.005, 5, 16, 0.6); g.rotateY(Math.PI / 2); g.rotateZ(Math.PI / 2 - 0.3); g.rotateX(k * 0.3); g.translate(0, HY, 0); fur.push(colored(g, P.d)); }
    if (P.tail) { const g = new T.SphereGeometry(0.03, 12, 10); g.scale(0.8, 0.8, 2.2); g.rotateX(-0.5); g.translate(0.05, 0.05, -0.08); fur.push(colored(g, P.c, 0.2)); const t2 = new T.SphereGeometry(0.018, 10, 8); t2.translate(0.06, 0.08, -0.14); fur.push(colored(t2, P.l)); }
    if (P.spikes) for (let k = 0; k < 4; k++) { const g = new T.ConeGeometry(0.014, 0.03, 8); g.rotateX(-0.3 - k * 0.35); g.translate(0, HY + 0.07 - k * 0.04, -0.03 - k * 0.025); fur.push(colored(g, 0xffc83a)); }
    if (P.ribbon) { for (const s of [-1, 1]) { const g = new T.ConeGeometry(0.022, 0.05, 10); g.rotateZ(s * Math.PI / 2); g.translate(s * 0.026, HY - 0.07, 0.06); fur.push(colored(g, 0xd8261e)); } const k = new T.SphereGeometry(0.012, 10, 8); k.translate(0, HY - 0.07, 0.066); fur.push(colored(k, 0xd8261e)); }
    const grp = new T.Group();
    const m1 = new T.Mesh(mergeGeos(fur), SC.furMat); m1.castShadow = true; grp.add(m1);
    const m2 = new T.Mesh(mergeGeos(gloss), SC.glossMat); grp.add(m2);
    if (P.big) grp.scale.setScalar(3.2);
    return grp;
  };

  // 걸어 둔 경품: 앞 차양 아래 한 줄(타이틀에서 보인다) + 계산대 오른쪽 끝의 대왕 곰
  SC.prizeHang = [];
  (function hangPrizes() {
    const rope = new T.LineBasicMaterial({ color: 0x2a1a10 });
    for (let i = 0; i < 11; i++) {
      const g = SC.makePrize(i);
      const x = -1.45 + (i * 2.9) / 10;
      g.position.set(x, 2.3 - (i % 2) * 0.05, BOOTH.front - 0.05);
      g.rotation.y = (i % 3 - 1) * 0.15;
      booth.add(g);
      const l = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x, g.position.y + 0.25, g.position.z), new T.Vector3(x, BOOTH.H - 0.3, g.position.z)]), rope);
      booth.add(l);
      SC.prizeHang.push({ g, l });
    }
    const king = SC.makePrize(11);
    king.scale.setScalar(2.6);
    king.position.set(1.22, SC.COUNTER_Y, 0.42); king.rotation.y = -0.45;
    booth.add(king);
    SC.kingBear = king;
  })();

  // ============================================================
  //  너구리 사장: 부스 안 왼쪽, 의자 위. 부위별로 따로 움직인다
  // ============================================================
  SC.raccoon = (function () {
    const root = new T.Group();
    root.position.set(-1.27, 0.06, -1.5);
    root.rotation.y = 0.5;
    root.scale.setScalar(0.85);
    const part = (gs, gl) => { const g = new T.Group(); const m = new T.Mesh(mergeGeos(gs), SC.furMat); m.castShadow = true; g.add(m); if (gl && gl.length) g.add(new T.Mesh(mergeGeos(gl), SC.glossMat)); return g; };
    const S = (arr, r, sx, sy, sz, x, y, z, col, sh) => { const g = new T.SphereGeometry(r, 20, 14); g.scale(sx, sy, sz); g.translate(x, y, z); arr.push(colored(g, col, sh == null ? 0.25 : sh)); return g; };
    const GRAY = 0x6e6660, DARK = 0x221c1c, WHITE = 0xe8e0d4;
    // 의자
    const stool = new T.Mesh(new T.CylinderGeometry(0.17, 0.15, 0.05, 16), SC.mats.darkWood); stool.position.y = 0.62; stool.castShadow = true; root.add(stool);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.28; const leg = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.6, 6), SC.mats.darkWood); leg.position.set(Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12); root.add(leg); }
    // 몸 + 앞치마(빨강·흰 줄)
    const bodyG = [];
    S(bodyG, 0.2, 1, 1.15, 0.85, 0, 0.84, 0, GRAY);
    S(bodyG, 0.15, 1, 1.1, 0.6, 0, 0.82, 0.07, WHITE);
    for (let k = 0; k < 5; k++) { const g = new T.CylinderGeometry(0.188, 0.2, 0.03, 20, 1, true, -1.1, 2.2); g.translate(0, 0.72 + k * 0.045, 0.012); bodyG.push(colored(g, k % 2 ? 0xf4f0ea : 0xd8261e)); }
    for (const s of [-1, 1]) S(bodyG, 0.06, 1, 0.7, 1.4, s * 0.1, 0.66, 0.12, DARK); // 발
    const body = part(bodyG); root.add(body);
    // 꼬리(줄무늬)
    const tailG = [];
    for (let k = 0; k < 5; k++) S(tailG, 0.055 - k * 0.004, 1, 1, 1.2, 0.12 + k * 0.035, 0.72 + k * 0.03, -0.18 - k * 0.04, k % 2 ? DARK : GRAY, 0.1);
    const tail = part(tailG); root.add(tail);
    // 머리
    const headG = [], headGl = [];
    S(headG, 0.15, 1.12, 0.92, 0.95, 0, 0, 0, GRAY);
    S(headG, 0.07, 1.5, 0.8, 0.9, 0, -0.035, 0.11, WHITE); // 주둥이
    for (const s of [-1, 1]) {
      S(headG, 0.055, 1.35, 0.8, 0.5, s * 0.06, 0.02, 0.11, DARK, 0); // 눈 가면
      S(headG, 0.05, 1, 1, 0.55, s * 0.105, -0.05, 0.08, WHITE); // 볼 털
      S(headG, 0.05, 1, 1, 0.5, s * 0.1, 0.12, -0.01, DARK); // 귀
      S(headG, 0.028, 1, 1, 0.4, s * 0.1, 0.12, 0.01, WHITE);
      const e = new T.SphereGeometry(0.018, 12, 10); e.translate(s * 0.058, 0.025, 0.14); headGl.push(colored(e, 0x0a0a0a));
      const h = new T.SphereGeometry(0.005, 8, 6); h.translate(s * 0.058 + 0.006, 0.032, 0.156); headGl.push(colored(h, 0xffffff));
    }
    S(headG, 0.02, 1.3, 0.9, 1, 0, 0.1, 0.12, WHITE); // 이마 흰 줄
    const nose = new T.SphereGeometry(0.022, 12, 10); nose.scale(1.3, 0.9, 1); nose.translate(0, -0.02, 0.18); headGl.push(colored(nose, 0x141414));
    // 종이 모자(야시장 사장)
    const hat = new T.CylinderGeometry(0.08, 0.1, 0.07, 18); hat.translate(0, 0.14, 0); headG.push(colored(hat, 0xf4f0ea, 0.1));
    const band = new T.CylinderGeometry(0.101, 0.101, 0.02, 18); band.translate(0, 0.12, 0); headG.push(colored(band, 0xd8261e));
    const head = part(headG, headGl); head.position.set(0, 1.14, 0.02); root.add(head);
    // 팔(어깨가 축)
    const arms = [];
    for (const s of [-1, 1]) {
      const g = [];
      S(g, 0.05, 1, 2.2, 1, 0, -0.09, 0, GRAY);
      S(g, 0.042, 1, 1, 1, 0, -0.19, 0.01, DARK);
      const a = part(g); a.position.set(s * 0.18, 0.96, 0.02); a.rotation.z = s * 0.25; root.add(a); arms.push(a);
    }
    // 입(웃을 때 벌어짐): 검정 반달
    const mouth = new T.Mesh(new T.SphereGeometry(0.025, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshStandardMaterial({ color: 0x5a0a10, roughness: 0.6 }));
    mouth.scale.set(1.3, 0.1, 0.6); mouth.position.set(0, -0.07, 0.15); head.add(mouth);
    booth.add(root);
    return { root, head, body, arms, tail, mouth, mood: 'idle', t: 0 };
  })();

  // ============================================================
  //  총 6종(따로 그리는 장면). 길이 방향 = -z, 원점 = 손잡이
  // ============================================================
  const gunScene = new T.Scene();
  const gunCam = new T.PerspectiveCamera(40, 1, 0.01, 5);
  SC.gunScene = gunScene; SC.gunCam = gunCam;
  gunScene.add(new T.HemisphereLight(0xffd7a8, 0x201018, 0.9));
  const gl1 = new T.DirectionalLight(0xffe2b8, 2.2); gl1.position.set(0.3, 1, 0.4); gunScene.add(gl1);
  const gl2 = new T.DirectionalLight(0xff9a5a, 0.9); gl2.position.set(-1, 0.2, -0.5); gunScene.add(gl2);
  gunScene.environment = scene.environment;
  const gunWood = [
    new T.MeshStandardMaterial({ map: tex(woodTex(256, 21, [196, 130, 70])), roughness: 0.45 }),
    new T.MeshStandardMaterial({ map: tex(woodTex(256, 22, [110, 58, 30])), roughness: 0.35 }),
    new T.MeshStandardMaterial({ color: 0x2f7fd0, roughness: 0.35, metalness: 0.1 }),
    new T.MeshStandardMaterial({ color: 0xd8261e, roughness: 0.35, metalness: 0.1 }),
  ];
  const gunSteel = new T.MeshStandardMaterial({ color: 0x3a3e46, metalness: 0.9, roughness: 0.3 });
  const brass = new T.MeshStandardMaterial({ color: 0xe0b050, metalness: 0.95, roughness: 0.25 });
  SC.GUNS = [
    { id: 'cork', name: '코르크총', wood: 0, barrels: 1, len: 0.45, r: 0.011 },
    { id: 'long', name: '장총', wood: 1, barrels: 1, len: 0.6, r: 0.011 },
    { id: 'twin', name: '쌍발총', wood: 0, barrels: 2, len: 0.45, r: 0.011 },
    { id: 'burst', name: '3연발', wood: 2, barrels: 1, len: 0.45, r: 0.012, drum: 1 },
    { id: 'shot', name: '산탄총', wood: 1, barrels: 2, len: 0.5, r: 0.016, pump: 1 },
    { id: 'cannon', name: '공 대포', wood: 3, barrels: 1, len: 0.42, r: 0.04, fat: 1 },
  ];
  SC.makeGun = function (idx) {
    const D = SC.GUNS[idx];
    const g = new T.Group();
    // 개머리판(옆 모양을 오려 두께를 준다): x = 길이(0 = 개머리 끝)
    const s = new T.Shape();
    s.moveTo(0, -0.07); s.lineTo(0, 0.035); s.quadraticCurveTo(0.08, 0.03, 0.17, 0.018);
    s.lineTo(0.2, 0.012); s.lineTo(0.5, 0.012); s.lineTo(0.52, -0.004); s.lineTo(0.5, -0.03); s.lineTo(0.26, -0.032);
    s.quadraticCurveTo(0.22, -0.035, 0.2, -0.075); s.lineTo(0.17, -0.075); s.quadraticCurveTo(0.17, -0.04, 0.14, -0.035);
    s.quadraticCurveTo(0.06, -0.04, 0, -0.07);
    const sg = new T.ExtrudeGeometry(s, { depth: 0.038, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 8 });
    sg.translate(-0.2, 0, -0.019);
    sg.rotateY(Math.PI / 2);
    const stock = new T.Mesh(sg, gunWood[D.wood]); g.add(stock);
    // 총열
    const bx = D.barrels === 2 ? [-0.013 - D.r * 0.4, 0.013 + D.r * 0.4] : [0];
    const muzzles = [];
    for (const x of bx) {
      const b = new T.Mesh(new T.CylinderGeometry(D.r, D.r * (D.fat ? 1.25 : 1), D.len, 18), D.fat ? brass : gunSteel);
      b.rotation.x = Math.PI / 2; b.position.set(x, 0.022 + D.r * 0.5, -0.1 - D.len / 2); g.add(b);
      const ring = new T.Mesh(new T.TorusGeometry(D.r * 1.1, D.r * 0.25, 8, 18), brass);
      ring.position.set(x, 0.022 + D.r * 0.5, -0.1 - D.len + 0.005); g.add(ring);
      muzzles.push(new T.Vector3(x, 0.022 + D.r * 0.5, -0.1 - D.len - 0.01));
    }
    // 띠·가늠쇠·방아쇠
    for (const z of [-0.2, -0.28]) { const band = new T.Mesh(new T.BoxGeometry(D.barrels === 2 ? 0.07 : 0.046, 0.05, 0.012), brass); band.position.set(0, 0.012, z); g.add(band); }
    const sight = new T.Mesh(new T.BoxGeometry(0.004, 0.014, 0.01), brass); sight.position.set(0, 0.03 + D.r * 1.5, -0.1 - D.len + 0.02); g.add(sight);
    const guard = new T.Mesh(new T.TorusGeometry(0.018, 0.003, 6, 16, Math.PI * 1.2), gunSteel); guard.rotation.y = Math.PI / 2; guard.position.set(0, -0.03, -0.02); g.add(guard);
    const trig = new T.Mesh(new T.BoxGeometry(0.004, 0.02, 0.005), gunSteel); trig.position.set(0, -0.03, -0.02); trig.rotation.x = 0.3; g.add(trig);
    if (D.drum) { const d = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.03, 20), brass); d.rotation.z = Math.PI / 2; d.position.set(0, -0.02, -0.13); g.add(d); }
    if (D.pump) { const p = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.12, 12), gunWood[0]); p.rotation.x = Math.PI / 2; p.position.set(0, -0.005, -0.33); g.add(p); }
    // 끝에 물린 코르크
    const corks = [];
    for (const m of muzzles) { if (D.fat) { const b = new T.Mesh(SC.ballGeo, SC.ballMat); b.position.copy(m).add(new T.Vector3(0, 0, 0.01)); g.add(b); corks.push(b); } else { const c = new T.Mesh(SC.corkGeo, SC.corkMat); c.position.copy(m); g.add(c); corks.push(c); } }
    g.userData = { muzzles, corks, def: D };
    return g;
  };
  // 총구 불꽃(총 장면 안)
  SC.flash = (function () {
    const c = canvas(128, 128), x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,220,140,.8)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex(c), transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    s.scale.setScalar(0.08); s.visible = false; gunScene.add(s);
    return s;
  })();

  // ============================================================
  //  카메라: 게임(계산대 뒤) / 타이틀(부스 전체) 두 자리
  // ============================================================
  const LOOK = new T.Vector3(0, 1.36, -2.25);
  SC.LOOK = LOOK;
  SC.view = { top: 0, bottom: 0 };
  const TEYE = new T.Vector3(0, 1.62, 4.3), TLOOK = new T.Vector3(0, 1.62, -1.2);
  const fitFov = function (eye, look, pts, yTop, yBot, xm) {
    cam.position.copy(eye); cam.lookAt(look);
    let lo = 8, hi = 100;
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2;
      cam.fov = mid; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      let ok = true;
      for (const p of pts) { const v = p.clone().project(cam); if (Math.abs(v.x) > xm || v.y > yTop || v.y < yBot) { ok = false; break; } }
      if (ok) hi = mid; else lo = mid;
    }
    return hi;
  };
  SC.fovPlay = 30; SC.fovTitle = 40; SC.camK = 0;
  SC.fitCamera = function () {
    const w = innerWidth, h = innerHeight;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    const pts = [];
    for (const sx of [-1.5, 1.5]) { pts.push(new T.Vector3(sx, TIERS[0].y - 0.02, TIERS[0].z + 0.1)); pts.push(new T.Vector3(sx, SC.RAIL.y + 0.25, SC.RAIL.z)); }
    const yTop = 1 - (SC.view.top / h) * 2 - 0.02, yBot = -1 + (SC.view.bottom / h) * 2 + 0.02;
    SC.fovPlay = fitFov(EYE, LOOK, pts, yTop, yBot, 0.96);
    const tp = [];
    for (const sx of [-1.8, 1.8]) { tp.push(new T.Vector3(sx, 0.3, BOOTH.front + 0.6)); tp.push(new T.Vector3(sx, BOOTH.H + 0.1, BOOTH.front)); }
    SC.fovTitle = fitFov(TEYE, TLOOK, tp, 0.98, -0.98, 0.98);
    gunCam.aspect = w / h; gunCam.updateProjectionMatrix();
    SC.setCam(SC.camK);
    if (SC.onFit) SC.onFit();
  };
  const _p = new T.Vector3(), _l = new T.Vector3();
  SC.setCam = function (k) { // k: 0 = 타이틀, 1 = 게임
    SC.camK = k;
    const e = k * k * (3 - 2 * k);
    _p.lerpVectors(TEYE, EYE, e); _l.lerpVectors(TLOOK, LOOK, e);
    cam.position.copy(_p); cam.lookAt(_l);
    cam.fov = SC.fovTitle + (SC.fovPlay - SC.fovTitle) * e;
    cam.updateProjectionMatrix();
    SC.camBase = cam.position.clone();
    SC.camLook = _l.clone();
  };
})();
