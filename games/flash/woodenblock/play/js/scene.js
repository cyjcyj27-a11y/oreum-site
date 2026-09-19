// 장면: 따뜻한 저녁 거실 탁자 위 나무 블록 탑. 나무결은 전부 코드 캔버스로 그린다.
(function () {
  const T = THREE;
  const SC = (window.SC = {});
  const cv = document.getElementById('cv');
  const R = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  // 폰은 해상도·그림자를 한 단계 낮춘다
  const MOBILE = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  SC.MOBILE = MOBILE;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.25 : 1.5));
  R.toneMapping = T.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.05;
  R.shadowMap.enabled = true;
  R.shadowMap.type = T.PCFSoftShadowMap;
  SC.renderer = R;

  const scene = new T.Scene();
  SC.scene = scene;
  const BG = new T.Color(0x1c120c);
  scene.background = BG;
  scene.fog = new T.Fog(0x1c120c, 9, 26);

  const cam = new T.PerspectiveCamera(38, 1, 0.05, 80);
  SC.camera = cam;

  // ---------- 작은 난수 ----------
  function rng(seed) {
    let s = (seed * 9301 + 49297) % 233280 || 1;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }

  // ---------- 환경맵: 따뜻한 방을 구워서 나무 윤기·금속이 방을 비추게 ----------
  (function env() {
    const es = new T.Scene();
    const g = new T.SphereGeometry(10, 32, 16);
    const cc = document.createElement('canvas');
    cc.width = 16; cc.height = 256;
    const x = cc.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3a2a20');
    gr.addColorStop(0.42, '#7a5236');
    gr.addColorStop(0.5, '#4a3222');
    gr.addColorStop(1, '#150d08');
    x.fillStyle = gr; x.fillRect(0, 0, 16, 256);
    const tx = new T.CanvasTexture(cc);
    tx.colorSpace = T.SRGBColorSpace;
    es.add(new T.Mesh(g, new T.MeshBasicMaterial({ map: tx, side: T.BackSide })));
    // 창·등 판
    const p1 = new T.Mesh(new T.PlaneGeometry(4, 3), new T.MeshBasicMaterial({ color: new T.Color(3.2, 2.3, 1.4) }));
    p1.position.set(-5, 5, 4); p1.lookAt(0, 0, 0); es.add(p1);
    const p2 = new T.Mesh(new T.PlaneGeometry(3, 5), new T.MeshBasicMaterial({ color: new T.Color(0.5, 0.65, 1.0) }));
    p2.position.set(7, 3, -3); p2.lookAt(0, 0, 0); es.add(p2);
    const pm = new T.PMREMGenerator(R);
    scene.environment = pm.fromScene(es, 0.04).texture;
    pm.dispose();
  })();

  // ---------- 빛 ----------
  const hemi = new T.HemisphereLight(0xffe2c0, 0x2a1a10, 0.55);
  scene.add(hemi);
  const key = new T.DirectionalLight(0xffd29a, 2.6);
  key.position.set(-3.2, 7.5, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  key.shadow.camera.left = -2.6; key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 4.8; key.shadow.camera.bottom = -1.2;
  key.shadow.camera.near = 2; key.shadow.camera.far = 16;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.012;
  key.shadow.radius = 3;
  scene.add(key);
  scene.add(key.target);
  SC.key = key;
  const rim = new T.DirectionalLight(0x9fc0ff, 0.9);
  rim.position.set(4, 3.5, -4.5);
  scene.add(rim);

  // ---------- 나무결 그리기 ----------
  // 판(atlas) 1024x1024: 위 절반 = 옆면 결(길이 방향), 아래 절반 = 마구리 나이테
  const SKINS = [
    { id: 'pine', name: '원목', price: 0, base: [214, 170, 118], dark: [150, 98, 52], light: [236, 202, 150] },
    { id: 'birch', name: '자작나무', price: 150, base: [232, 212, 178], dark: [190, 160, 118], light: [246, 234, 208] },
    { id: 'cherry', name: '벚나무', price: 300, base: [176, 96, 60], dark: [118, 52, 28], light: [206, 132, 88] },
    { id: 'walnut', name: '호두나무', price: 450, base: [110, 72, 46], dark: [58, 34, 20], light: [150, 106, 70] },
    { id: 'bamboo', name: '대나무', price: 600, base: [214, 196, 120], dark: [150, 132, 60], light: [234, 222, 156], node: 1 },
    { id: 'pastel', name: '파스텔', price: 800, paint: ['#ffb3c7', '#b8e2ff', '#c9f2b8', '#ffe7a3', '#dcc7ff'] },
    { id: 'choco', name: '초콜릿', price: 1000, base: [92, 52, 32], dark: [60, 32, 18], light: [128, 78, 50], choco: 1 },
    { id: 'marble', name: '대리석', price: 1300, marble: 1 },
    { id: 'rainbow', name: '무지개', price: 1600, paint: ['#ff5a5a', '#ffa23a', '#ffe14d', '#5ad46a', '#4ab0ff', '#9a6bff'] },
    { id: 'ice', name: '얼음', price: 2000, ice: 1 },
    { id: 'glow', name: '야광', price: 2500, glow: 1 },
    { id: 'gold', name: '황금', price: 3200, gold: 1 },
  ];
  SC.SKINS = SKINS;

  const rgb = (a, k) => 'rgb(' + a.map((v) => Math.max(0, Math.min(255, Math.round(v * (k || 1))))).join(',') + ')';
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  let _noise = null;
  function noiseTile() {
    if (_noise) return _noise;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const id = x.createImageData(256, 256);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 60; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(id, 0, 0);
    return (_noise = c);
  }
  function woodAtlas(sk, seed) {
    const S = 1024;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const r = rng(seed * 31 + 7);
    // --- 옆면: 길이 방향으로 흐르는 결 ---
    x.fillStyle = rgb(sk.base);
    x.fillRect(0, 0, S, S / 2);
    // 넓은 색 얼룩
    for (let i = 0; i < 14; i++) {
      const y = r() * S / 2, h = 30 + r() * 120;
      const g = x.createLinearGradient(0, y - h, 0, y + h);
      const col = r() < 0.5 ? sk.dark : sk.light;
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, rgb(col).replace('rgb', 'rgba').replace(')', ',' + (0.12 + r() * 0.12) + ')'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(0, y - h, S, h * 2);
    }
    // 결 줄: 천천히 휘는 줄 여러 가닥
    // 한 판에 같은 흐름(휨)을 공유해야 진짜 결처럼 나란히 흐른다
    const fr = 0.0015 + r() * 0.002, ph = r() * 6.28, amp0 = 6 + r() * 10;
    const lines = 150 + (r() * 60) | 0;
    for (let i = 0; i < lines; i++) {
      const y0 = (i / lines) * S / 2 + (r() - 0.5) * 6;
      const amp = amp0 * (0.7 + r() * 0.6);
      const late = r() < 0.3; // 늦은 나무(진한 줄)
      x.strokeStyle = rgb(late ? sk.dark : mix(sk.base, sk.dark, 0.4)).replace('rgb', 'rgba').replace(')', ',' + (late ? 0.28 + r() * 0.25 : 0.08 + r() * 0.12) + ')');
      x.lineWidth = late ? 0.9 + r() * 1.6 : 0.5 + r() * 0.8;
      x.beginPath();
      for (let u = -10; u <= S + 10; u += 12) {
        const y = y0 + Math.sin(u * fr + ph + y0 * 0.004) * amp + Math.sin(u * fr * 3.7 + ph * 2 + y0 * 0.01) * amp * 0.18;
        u < 0 ? x.moveTo(u, y) : x.lineTo(u, y);
      }
      x.stroke();
    }
    // 옹이 하나쯤
    if (r() < 0.55) {
      const kx = 120 + r() * (S - 240), ky = 60 + r() * (S / 2 - 120);
      for (let k = 7; k > 0; k--) {
        x.strokeStyle = rgb(sk.dark).replace('rgb', 'rgba').replace(')', ',' + (0.18 + k * 0.05) + ')');
        x.lineWidth = 2;
        x.beginPath();
        x.ellipse(kx, ky, k * 9, k * 3.2, 0, 0, 6.29);
        x.stroke();
      }
      x.fillStyle = rgb(sk.dark, 0.8);
      x.beginPath(); x.ellipse(kx, ky, 8, 3, 0, 0, 6.29); x.fill();
    }
    // 대나무 마디
    if (sk.node) {
      for (const u of [S * 0.3, S * 0.72]) {
        x.fillStyle = rgb(sk.dark).replace('rgb', 'rgba').replace(')', ',.5)');
        x.fillRect(u - 3, 0, 6, S / 2);
        x.fillStyle = rgb(sk.light).replace('rgb', 'rgba').replace(')', ',.4)');
        x.fillRect(u + 3, 0, 5, S / 2);
      }
    }
    // 고운 잡티 (미리 만든 잡티 판을 깔아 준다)
    x.save();
    x.globalAlpha = 0.5;
    x.globalCompositeOperation = 'overlay';
    const np = x.createPattern(noiseTile(), 'repeat');
    x.fillStyle = np;
    x.translate(r() * 256, r() * 256);
    x.fillRect(-256, -256, S + 256, S / 2 + 256);
    x.restore();

    // --- 마구리: 나이테 (중심이 판 밖에 있어 호처럼 보인다) ---
    const Y0 = S / 2;
    x.fillStyle = rgb(mix(sk.base, sk.dark, 0.15));
    x.fillRect(0, Y0, S, S / 2);
    for (let t = 0; t < 2; t++) {
      const ox = t * S / 2;
      x.save();
      x.beginPath(); x.rect(ox, Y0, S / 2, S / 2); x.clip();
      const cx = ox + S / 4 + (r() - 0.5) * 900, cy = Y0 + S / 4 + (r() < 0.5 ? -1 : 1) * (420 + r() * 300);
      for (let k = 6; k < 1400; k += 5 + r() * 9) {
        x.strokeStyle = rgb(sk.dark).replace('rgb', 'rgba').replace(')', ',' + (0.2 + r() * 0.35) + ')');
        x.lineWidth = 1 + r() * 2.5;
        x.beginPath(); x.arc(cx, cy, k, 0, 6.29); x.stroke();
      }
      x.restore();
    }
    return c;
  }

  function paintAtlas(sk, seed) {
    const c = woodAtlas({ base: [200, 170, 130], dark: [140, 110, 80], light: [230, 210, 180] }, seed);
    const x = c.getContext('2d');
    x.globalCompositeOperation = 'multiply';
    x.fillStyle = '#fff';
    x.globalAlpha = 1;
    // 칠 색은 꼭짓점 색으로 주므로 여기서는 결만 옅게 남긴다
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = 'rgba(255,255,255,.72)';
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function marbleAtlas(seed) {
    const S = 1024, c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const r = rng(seed * 13 + 3);
    x.fillStyle = '#eeebe6'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) {
      x.strokeStyle = 'rgba(' + (90 + r() * 60 | 0) + ',' + (90 + r() * 60 | 0) + ',' + (100 + r() * 60 | 0) + ',' + (0.12 + r() * 0.35) + ')';
      x.lineWidth = 0.6 + r() * 3;
      x.beginPath();
      let px = r() * S, py = r() * S;
      x.moveTo(px, py);
      for (let k = 0; k < 40; k++) {
        px += (r() - 0.3) * 60; py += (r() - 0.5) * 50;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    return c;
  }

  function iceAtlas(seed) {
    const S = 512, c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const r = rng(seed * 7 + 1);
    x.fillStyle = '#dff4ff'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) {
      x.strokeStyle = 'rgba(255,255,255,' + (0.2 + r() * 0.5) + ')';
      x.lineWidth = 0.5 + r() * 1.5;
      x.beginPath();
      const a = r() * S, b = r() * S;
      x.moveTo(a, b); x.lineTo(a + (r() - 0.5) * 120, b + (r() - 0.5) * 120);
      x.stroke();
    }
    return c;
  }

  const texCache = {};
  const matCache = {};
  const VARIANTS = 4;
  function tex(canvas, bump) {
    const t = new T.CanvasTexture(canvas);
    if (!bump) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = Math.min(8, R.capabilities.getMaxAnisotropy());
    return t;
  }
  function skinMat(id, v) {
    const list = matCache[id] || (matCache[id] = []);
    if (list[v]) return list[v];
    const sk = SKINS.find((s) => s.id === id) || SKINS[0];
    {
      let m;
      if (sk.marble) {
        const cvs = marbleAtlas(v + 1);
        m = new T.MeshStandardMaterial({ map: tex(cvs), roughness: 0.18, metalness: 0, envMapIntensity: 0.9 });
      } else if (sk.ice) {
        const cvs = iceAtlas(v + 1);
        m = new T.MeshStandardMaterial({ map: tex(cvs), color: 0xcfefff, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.72, envMapIntensity: 1.6 });
      } else if (sk.gold) {
        const cvs = marbleAtlas(v + 20);
        m = new T.MeshStandardMaterial({ color: 0xffc94a, roughnessMap: tex(cvs, 1), roughness: 0.32, metalness: 1, envMapIntensity: 1.4 });
      } else if (sk.glow) {
        const cvs = woodAtlas({ base: [120, 255, 170], dark: [40, 180, 120], light: [200, 255, 220] }, v + 50);
        const t = tex(cvs);
        m = new T.MeshStandardMaterial({ map: t, emissive: 0x3dffa0, emissiveMap: t, emissiveIntensity: 0.55, roughness: 0.5 });
      } else if (sk.paint) {
        const cvs = paintAtlas(sk, v + 90);
        m = new T.MeshStandardMaterial({ map: tex(cvs), vertexColors: true, roughness: 0.42, envMapIntensity: 0.8 });
      } else {
        const cvs = woodAtlas(sk, v + (sk.id.length * 17));
        const t = tex(cvs);
        m = new T.MeshStandardMaterial({
          map: t, bumpMap: tex(cvs, 1), bumpScale: 0.6,
          roughness: sk.choco ? 0.35 : 0.62, metalness: 0, envMapIntensity: sk.choco ? 0.9 : 0.55,
          vertexColors: true,
        });
      }
      list[v] = m;
    }
    return list[v];
  }
  SC.skinMat = skinMat;

  // ---------- 둥근 모서리 블록 도형 (UV 는 판의 옆면/마구리 칸으로) ----------
  const _p = new T.Vector3(), _n = new T.Vector3();
  function blockGeo(L, H, W, seed, tint) {
    const seg = 3, rad = Math.min(0.017, H * 0.12);
    const n = seg * 2 + 1;
    const box = new T.BoxGeometry(1, 1, 1, n, n, n);
    const g = box.toNonIndexed();
    box.dispose();
    const pos = g.attributes.position.array, nor = g.attributes.normal.array, uv = g.attributes.uv.array;
    const half = new T.Vector3(L / 2 - rad, H / 2 - rad, W / 2 - rad);
    const hs = 0.5 / n;
    const r = rng(seed);
    const ou = r() * 0.3, ov = r() * 0.5, ex = (r() * 2) | 0;
    const flip = r() < 0.5;
    const groups = g.groups;
    const col = new Float32Array(pos.length);
    for (let gi = 0; gi < groups.length; gi++) {
      const gr = groups[gi];
      const axis = gi >> 1; // 0:x(마구리) 1:y(윗·아랫면) 2:z(옆면)
      for (let k = gr.start; k < gr.start + gr.count; k++) {
        const i = k * 3, j = k * 2;
        _p.fromArray(pos, i);
        _n.copy(_p);
        _n.x -= Math.sign(_n.x) * hs; _n.y -= Math.sign(_n.y) * hs; _n.z -= Math.sign(_n.z) * hs;
        _n.normalize();
        const x = half.x * Math.sign(_p.x) + _n.x * rad;
        const y = half.y * Math.sign(_p.y) + _n.y * rad;
        const z = half.z * Math.sign(_p.z) + _n.z * rad;
        pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
        nor[i] = _n.x; nor[i + 1] = _n.y; nor[i + 2] = _n.z;
        // 판 좌표
        let u, v;
        if (axis === 0) {
          // 마구리: 아래 절반, 두 칸 중 하나
          u = (ex * 0.5) + (z / W + 0.5) * 0.46 + 0.02;
          v = 0.04 + (y / H + 0.5) * 0.3 + ov * 0.15;
        } else {
          // 옆면·윗면: 결이 길이(x) 방향
          const a = (x / L + 0.5) * 0.7 + ou;
          u = flip ? 1 - a : a;
          const b = axis === 1 ? (z / W + 0.5) * 0.16 : (y / H + 0.5) * 0.1;
          v = 0.5 + 0.03 + ov * 0.1 + b + (axis === 1 ? (_p.y > 0 ? 0.0 : 0.17) : (_p.z > 0 ? 0.1 : 0.24));
        }
        uv[j] = u; uv[j + 1] = v;
        col[i] = tint[0]; col[i + 1] = tint[1]; col[i + 2] = tint[2];
      }
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.attributes.position.needsUpdate = true;
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }

  SC.makeBlock = function (L, H, W, seed, skinId, paintIdx) {
    const r = rng(seed * 3 + 11);
    const sk = SKINS.find((s) => s.id === skinId) || SKINS[0];
    const tint = blockTint(sk, r, paintIdx);
    const g = blockGeo(L, H, W, seed, tint);
    const m = new T.Mesh(g, skinMat(sk.id, seed % VARIANTS));
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.seed = seed;
    return m;
  };
  function blockTint(sk, r, paintIdx) {
    if (sk.paint) {
      const c = new T.Color(sk.paint[(paintIdx == null ? (r() * sk.paint.length) | 0 : paintIdx) % sk.paint.length]);
      return [c.r, c.g, c.b];
    }
    const k = 0.9 + r() * 0.16;
    return [k, k * (0.98 + r() * 0.03), k * (0.95 + r() * 0.06)];
  }
  SC.reskin = function (mesh, skinId, paintIdx) {
    const sk = SKINS.find((s) => s.id === skinId) || SKINS[0];
    const seed = mesh.userData.seed;
    const r = rng(seed * 3 + 11);
    const tint = blockTint(sk, r, paintIdx);
    const col = mesh.geometry.attributes.color;
    for (let i = 0; i < col.count; i++) col.setXYZ(i, tint[0], tint[1], tint[2]);
    col.needsUpdate = true;
    mesh.material = skinMat(sk.id, seed % VARIANTS);
  };

  // ---------- 탁자 ----------
  function tableTex() {
    const c = woodAtlas({ base: [96, 58, 34], dark: [52, 28, 14], light: [132, 86, 52] }, 777);
    return c;
  }
  const tc = tableTex();
  const ttx = tex(tc);
  ttx.wrapS = ttx.wrapT = T.RepeatWrapping;
  ttx.repeat.set(2.2, 4);
  ttx.offset.set(0, 0.02);
  const tableMat = new T.MeshStandardMaterial({ map: ttx, roughness: 0.38, metalness: 0, envMapIntensity: 0.7 });
  const TR = 3.4;
  const top = new T.Mesh(new T.CylinderGeometry(TR, TR, 0.12, 96, 1), tableMat);
  top.position.y = -0.06;
  top.receiveShadow = true;
  scene.add(top);
  const edge = new T.Mesh(new T.TorusGeometry(TR, 0.06, 12, 96), new T.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.4 }));
  edge.rotation.x = Math.PI / 2;
  edge.position.y = -0.06;
  scene.add(edge);
  const leg = new T.Mesh(new T.CylinderGeometry(0.35, 0.55, 5, 24), new T.MeshStandardMaterial({ color: 0x2a170c, roughness: 0.6 }));
  leg.position.y = -2.6;
  scene.add(leg);
  SC.TABLE_R = TR;

  // 탁자 위 소품: 머그잔 하나 (장면에 깊이)
  (function props() {
    const mugM = new T.MeshStandardMaterial({ color: 0xe8e1d6, roughness: 0.25, envMapIntensity: 0.8 });
    const mug = new T.Group();
    const body = new T.Mesh(new T.CylinderGeometry(0.2, 0.18, 0.42, 40, 1, true), mugM);
    body.position.y = 0.21; body.castShadow = true;
    const bottom = new T.Mesh(new T.CircleGeometry(0.18, 40), mugM);
    bottom.rotation.x = -Math.PI / 2; bottom.position.y = 0.01;
    const inner = new T.Mesh(new T.CylinderGeometry(0.185, 0.17, 0.4, 40, 1, true), new T.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.3, side: T.BackSide }));
    inner.position.y = 0.22;
    const coffee = new T.Mesh(new T.CircleGeometry(0.185, 40), new T.MeshStandardMaterial({ color: 0x3a1e0e, roughness: 0.15 }));
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.34;
    const handle = new T.Mesh(new T.TorusGeometry(0.1, 0.03, 12, 24, Math.PI * 1.2), mugM);
    handle.position.set(0.2, 0.22, 0); handle.rotation.z = -Math.PI * 0.6; handle.castShadow = true;
    const rim = new T.Mesh(new T.TorusGeometry(0.195, 0.012, 8, 40), mugM);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.42;
    mug.add(body, bottom, inner, coffee, handle, rim);
    mug.position.set(1.75, 0, -1.2);
    mug.rotation.y = 0.8;
    scene.add(mug);
    // 받침 컵받침
    const coaster = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.02, 40), new T.MeshStandardMaterial({ color: 0x7b8a5a, roughness: 0.9 }));
    coaster.position.set(1.75, 0.01, -1.2); coaster.receiveShadow = true;
    scene.add(coaster);
  })();

  // ---------- 방 뒤 배경: 흐린 벽 + 꼬마전구 번짐 ----------
  (function room() {
    // 방 한 바퀴 그림 (2048 x 512): 벽지·창문 둘·책장·스탠드·액자. 마지막에 흐리게 해서 초점 밖처럼
    const W2 = 2048, H2 = 512;
    const src = document.createElement('canvas');
    src.width = W2; src.height = H2;
    const x = src.getContext('2d');
    const r = rng(5);
    const g = x.createLinearGradient(0, 0, 0, H2);
    g.addColorStop(0, '#0e0806');
    g.addColorStop(0.35, '#2a1a10');
    g.addColorStop(0.6, '#3b2517');
    g.addColorStop(0.63, '#4a2e1a'); // 징두리 판벽
    g.addColorStop(0.85, '#2c1a0f');
    g.addColorStop(1, '#1a0f08');
    x.fillStyle = g; x.fillRect(0, 0, W2, H2);
    // 벽지 세로 줄
    for (let i = 0; i < W2; i += 22) {
      x.fillStyle = 'rgba(255,220,170,' + (0.015 + (i / 22 % 2) * 0.02) + ')';
      x.fillRect(i, 0, 11, H2 * 0.6);
    }
    // 판벽 칸
    x.fillStyle = 'rgba(255,210,150,.12)';
    x.fillRect(0, H2 * 0.62, W2, 4);
    for (let i = 0; i < W2; i += 128) {
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 3;
      x.strokeRect(i + 14, H2 * 0.66, 100, H2 * 0.22);
      x.strokeStyle = 'rgba(255,210,150,.1)'; x.lineWidth = 2;
      x.strokeRect(i + 17, H2 * 0.66 + 3, 100, H2 * 0.22);
    }
    // 창문 (푸른 밤 + 먼 불빛)
    function win(cx, w, h) {
      const y0 = 70;
      x.fillStyle = '#1a100a'; x.fillRect(cx - w / 2 - 10, y0 - 10, w + 20, h + 20);
      const wg = x.createLinearGradient(0, y0, 0, y0 + h);
      wg.addColorStop(0, '#0f1a33'); wg.addColorStop(0.7, '#23355a'); wg.addColorStop(1, '#3a3f5a');
      x.fillStyle = wg; x.fillRect(cx - w / 2, y0, w, h);
      for (let i = 0; i < 40; i++) {
        x.fillStyle = 'rgba(255,' + (190 + r() * 60 | 0) + ',120,' + (0.4 + r() * 0.5) + ')';
        const px = cx - w / 2 + r() * w, py = y0 + h * (0.55 + r() * 0.42);
        x.fillRect(px, py, 2 + r() * 3, 2 + r() * 3);
      }
      x.fillStyle = '#1a100a';
      x.fillRect(cx - 3, y0, 6, h); x.fillRect(cx - w / 2, y0 + h * 0.45, w, 6);
      // 커튼
      for (const s of [-1, 1]) {
        const cg = x.createLinearGradient(cx + s * (w / 2 + 30), 0, cx + s * (w / 2 - 20), 0);
        cg.addColorStop(0, '#5a2a1a'); cg.addColorStop(0.5, '#7a3a22'); cg.addColorStop(1, '#4a2014');
        x.fillStyle = cg;
        x.beginPath();
        x.moveTo(cx + s * (w / 2 + 40), y0 - 30);
        x.lineTo(cx + s * (w / 2 - 25), y0 - 30);
        x.quadraticCurveTo(cx + s * (w / 2 - 5), y0 + h * 0.6, cx + s * (w / 2 + 5), H2 * 0.62);
        x.lineTo(cx + s * (w / 2 + 40), H2 * 0.62);
        x.fill();
      }
    }
    win(560, 170, 190);
    win(1500, 150, 170);
    // 책장
    const bx0 = 920, bw = 260;
    x.fillStyle = '#24160d'; x.fillRect(bx0, 60, bw, 260);
    for (let sh = 0; sh < 4; sh++) {
      const sy = 70 + sh * 62;
      let px = bx0 + 8;
      while (px < bx0 + bw - 14) {
        const w = 7 + r() * 9, h = 34 + r() * 18;
        x.fillStyle = 'hsl(' + ([10, 25, 40, 200, 350, 30][(r() * 6) | 0]) + ',' + (18 + r() * 22 | 0) + '%,' + (18 + r() * 16 | 0) + '%)';
        if (r() < 0.1) { x.save(); x.translate(px, sy + 52); x.rotate(-0.25); x.fillRect(0, -h, w, h); x.restore(); px += w + 6; continue; }
        x.fillRect(px, sy + 52 - h, w, h);
        x.fillStyle = 'rgba(255,230,180,.12)'; x.fillRect(px + 1, sy + 52 - h, 2, h);
        px += w + 1;
      }
      x.fillStyle = '#3a2414'; x.fillRect(bx0, sy + 52, bw, 8);
    }
    // 스탠드 (따뜻한 번짐)
    function lamp(cx) {
      const lg = x.createRadialGradient(cx, 150, 0, cx, 150, 190);
      lg.addColorStop(0, 'rgba(255,200,120,.55)'); lg.addColorStop(1, 'rgba(255,160,80,0)');
      x.fillStyle = lg; x.fillRect(cx - 200, 0, 400, 360);
      x.fillStyle = '#e8b878';
      x.beginPath(); x.moveTo(cx - 34, 175); x.lineTo(cx + 34, 175); x.lineTo(cx + 22, 120); x.lineTo(cx - 22, 120); x.fill();
      x.fillStyle = '#1a100a'; x.fillRect(cx - 2, 175, 4, 150);
    }
    lamp(1270);
    lamp(260);
    // 액자
    x.fillStyle = '#6a4a26'; x.fillRect(1780, 110, 120, 90);
    const pg = x.createLinearGradient(0, 118, 0, 192);
    pg.addColorStop(0, '#d98a4a'); pg.addColorStop(1, '#5a6a8a');
    x.fillStyle = pg; x.fillRect(1788, 118, 104, 74);
    x.fillStyle = '#3a4a3a'; x.beginPath(); x.moveTo(1788, 192); x.lineTo(1830, 150); x.lineTo(1860, 172); x.lineTo(1892, 140); x.lineTo(1892, 192); x.fill();
    // 초점 밖처럼 흐리게
    const c = document.createElement('canvas');
    c.width = W2; c.height = H2;
    const cx2 = c.getContext('2d');
    cx2.filter = 'blur(5px)';
    cx2.drawImage(src, 0, 0);
    cx2.filter = 'none';
    // 가장자리 이음새 없애기
    cx2.drawImage(src, 0, 0, 12, H2, W2 - 12, 0, 12, H2);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    const wall = new T.Mesh(new T.CylinderGeometry(14, 14, 16, 64, 1, true), new T.MeshBasicMaterial({ map: t, side: T.BackSide, fog: false }));
    wall.position.y = 3;
    scene.add(wall);
    // 꼬마전구 (부드러운 원 스프라이트)
    const bc = document.createElement('canvas');
    bc.width = bc.height = 64;
    const bx = bc.getContext('2d');
    const bg = bx.createRadialGradient(32, 32, 0, 32, 32, 32);
    bg.addColorStop(0, 'rgba(255,255,255,1)');
    bg.addColorStop(0.35, 'rgba(255,255,255,.55)');
    bg.addColorStop(1, 'rgba(255,255,255,0)');
    bx.fillStyle = bg; bx.fillRect(0, 0, 64, 64);
    const bt = new T.CanvasTexture(bc);
    const bulbs = new T.Group();
    const r2 = rng(42);
    for (let i = 0; i < 46; i++) {
      const a = -2.2 + i * 0.1;
      const sm = new T.SpriteMaterial({ map: bt, color: new T.Color().setHSL(0.09 + r2() * 0.04, 0.9, 0.6), transparent: true, opacity: 0.55 + r2() * 0.35, depthWrite: false, fog: false, blending: T.AdditiveBlending });
      const s = new T.Sprite(sm);
      const rr = 12;
      const sag = Math.sin((i % 12) / 12 * Math.PI) * 0.8;
      s.position.set(Math.sin(a) * rr, 4.3 - sag - (i > 23 ? 0.5 : 0), -Math.cos(a) * rr);
      const k = 0.35 + r2() * 0.35;
      s.scale.set(k, k, 1);
      bulbs.add(s);
    }
    scene.add(bulbs);
    SC.bulbs = bulbs;
  })();

  // ---------- 카메라 궤도 ----------
  const C = (SC.cam = { yaw: 0.62, pitch: 0.2, dist: 5.2, ty: 1.3, tyGoal: 1.3 });
  SC.updateCam = function () {
    const cp = Math.cos(C.pitch);
    cam.position.set(Math.sin(C.yaw) * C.dist * cp, C.ty + Math.sin(C.pitch) * C.dist, Math.cos(C.yaw) * C.dist * cp);
    cam.lookAt(0, C.ty, 0);
  };
  SC.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    // 세로 화면에선 시야를 넓혀 탑이 들어오게
    cam.fov = w / h < 0.8 ? 50 : 38;
    cam.updateProjectionMatrix();
  };
  window.addEventListener('resize', SC.resize);
  SC.resize();
  SC.updateCam();

  // 제목 화면에선 탑을 오른쪽으로 비켜 세운다 (넓은 화면만)
  SC.shift = 0;
  SC.render = function () {
    const w = R.domElement.width, h = R.domElement.height;
    const k = w / h >= 1 ? SC.shift : 0;
    if (k) cam.setViewOffset(w, h, -w * k, 0, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    R.render(scene, cam);
  };
})();
