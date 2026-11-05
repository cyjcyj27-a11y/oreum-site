// 장난감 미니어처 재질과 모양: 파스텔 색, 둥근 모서리 상자, 둥근 판, 떡 모양들.
// 재질은 색·광택마다 하나씩 나눠 쓴다(캐시).
(function () {
  const T = (window.TOY = {});
  let seed = 4242;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  T.srand = (s) => { seed = s | 0 || 1; };
  T.rnd = rnd;

  // ---------- 재질 ----------
  const mats = {};
  // o: rough(0.55) · gloss(겉칠 광택 0~1) · emis(속빛, 말랑한 떡) · op(투명) · map · side · vc(꼭짓점 색)
  T.mat = function (color, o) {
    o = o || {};
    const key = [color, o.rough, o.gloss, o.emis, o.op, o.side, o.vc, o.map && o.map.uuid, o.flat].join('|');
    if (mats[key]) return mats[key];
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color), roughness: o.rough == null ? 0.55 : o.rough, metalness: 0,
      clearcoat: o.gloss || 0, clearcoatRoughness: 0.35, sheen: o.sheen || 0, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.6,
    });
    if (o.emis) { m.emissive = new THREE.Color(color); m.emissiveIntensity = o.emis; }
    if (o.op != null) { m.transparent = true; m.opacity = o.op; m.depthWrite = o.op > 0.9; }
    if (o.map) m.map = o.map;
    if (o.side) m.side = THREE.DoubleSide;
    if (o.vc) m.vertexColors = true;
    if (o.flat) m.flatShading = true;
    mats[key] = m;
    return m;
  };
  // 럭셔리 재질: 비치는 빛(RND.env)이 있어야 검정 옻칠·금박이 산다
  const LUX = {
    black: { color: '#17151a', rough: 0.12, metal: 0.35, cc: 1, ccr: 0.03, env: 2.2 },
    gold: { color: '#e9b64c', rough: 0.26, metal: 1, cc: 0.4, ccr: 0.2, env: 1.5 },
    satin: { color: '#f1c560', rough: 0.36, metal: 0.85, cc: 0, ccr: 0, env: 1.35, sheen: 0.6 },
    pattern: { color: '#ffffff', rough: 0.2, metal: 0.15, cc: 1, ccr: 0.04, env: 1.0 },
    velvet: { color: '#1d171c', rough: 0.9, metal: 0, cc: 0, ccr: 0, env: 0.4, sheen: 1 },
  };
  T.lux = function (kind) {
    const key = 'lux|' + kind;
    if (mats[key]) return mats[key];
    const o = LUX[kind];
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(o.color), roughness: o.rough, metalness: o.metal, clearcoat: o.cc, clearcoatRoughness: o.ccr,
      sheen: o.sheen || 0, sheenColor: new THREE.Color(kind === 'velvet' ? '#6a4a3a' : '#fff4d0'), sheenRoughness: 0.5 });
    if (window.RND && RND.env) { m.envMap = RND.env; m.envMapIntensity = o.env; }
    if (kind === 'pattern' && window.RND && RND.wallCanvas) m.map = T.tex(RND.wallCanvas, [1, 1]);
    return (mats[key] = m);
  };
  // 면마다 실제 크기대로 무늬를 펴는 UV(늘어나지 않게). tile = 무늬 한 장의 크기
  T.boxUV = function (geo, tile) {
    const g = geo.clone(), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (ay >= ax && ay >= az) { u = p.getX(i); v = p.getZ(i); } else if (ax >= az) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
      uv.setXY(i, u / tile + 0.5, v / tile + 0.5);
    }
    uv.needsUpdate = true;
    return g;
  };
  // 그림자 안 받는 단순 색(효과용)
  T.basic = function (color, op) {
    const key = 'b|' + color + '|' + op;
    if (mats[key]) return mats[key];
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: op != null, opacity: op == null ? 1 : op, depthWrite: op == null });
    return (mats[key] = m);
  };

  // ---------- 캔버스 무늬 ----------
  T.canvas = function (w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; };
  T.tex = function (c, rep) {
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  };

  // ---------- 둥근 모서리 상자 ----------
  // 격자를 모서리 쪽에 몰아서 만든 뒤 안쪽 상자에서 반지름만큼 밀어낸다. 법선은 밀어낸 방향 그대로.
  const rbCache = {};
  T.rbox = function (w, h, d, r, k) {
    k = k || 3;
    r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
    const key = [w, h, d, r, k].map((v) => v.toFixed(4)).join(',');
    if (rbCache[key]) return rbCache[key];
    const s = 2 * k + 1;
    const g = new THREE.BoxGeometry(1, 1, 1, s, s, s);
    const p = g.attributes.position, n = g.attributes.normal;
    const half = [w / 2, h / 2, d / 2];
    const v = [0, 0, 0], inner = [0, 0, 0], off = [0, 0, 0];
    for (let i = 0; i < p.count; i++) {
      v[0] = p.getX(i); v[1] = p.getY(i); v[2] = p.getZ(i);
      for (let a = 0; a < 3; a++) {
        const idx = Math.round((v[a] + 0.5) * s); // 0..s
        let c;
        if (idx <= k) c = -half[a] + r * (idx / k);
        else c = half[a] - r * ((s - idx) / k);
        v[a] = c;
        inner[a] = Math.max(-half[a] + r, Math.min(half[a] - r, c));
        off[a] = c - inner[a];
      }
      const L = Math.hypot(off[0], off[1], off[2]);
      if (L > 1e-6) {
        for (let a = 0; a < 3; a++) v[a] = inner[a] + (off[a] / L) * r;
        n.setXYZ(i, off[0] / L, off[1] / L, off[2] / L);
      }
      p.setXYZ(i, v[0], v[1], v[2]);
    }
    g.computeBoundingSphere();
    return (rbCache[key] = g);
  };

  // 둥근 원기둥(위아래 모서리가 둥근 원판): 옆모습을 그려 돌린다
  const rcCache = {};
  T.rcyl = function (rad, h, r, seg) {
    seg = seg || 40; r = Math.min(r, rad - 1e-3, h / 2 - 1e-3);
    const key = [rad, h, r, seg].join(',');
    if (rcCache[key]) return rcCache[key];
    const pts = [new THREE.Vector2(0, -h / 2)];
    const q = 5;
    for (let i = 0; i <= q; i++) { const a = -Math.PI / 2 + (i / q) * Math.PI / 2; pts.push(new THREE.Vector2(rad - r + Math.cos(a) * r, -h / 2 + r + Math.sin(a) * r)); }
    for (let i = 0; i <= q; i++) { const a = (i / q) * Math.PI / 2; pts.push(new THREE.Vector2(rad - r + Math.cos(a) * r, h / 2 - r + Math.sin(a) * r)); }
    pts.push(new THREE.Vector2(0, h / 2));
    const g = new THREE.LatheGeometry(pts, seg);
    return (rcCache[key] = g);
  };

  // 물체 만들기 도우미: 그림자 켜고 자리 잡기
  T.mesh = function (geo, mat, x, y, z, parent) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(m);
    return m;
  };

  // 바닥에 닿는 자리의 부드러운 접지 그림자(둥근 번짐 판)
  let blobTex = null;
  T.blob = function (w, d, op) {
    if (!blobTex) blobTex = T.tex(T.canvas(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62); gr.addColorStop(0, 'rgba(60,30,60,1)'); gr.addColorStop(0.55, 'rgba(60,30,60,.45)'); gr.addColorStop(1, 'rgba(60,30,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: op == null ? 0.35 : op, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 1;
    return m;
  };

  // ---------- 떡 모양 ----------
  // 말랑한 떡 재질(속빛을 조금 넣어 부드럽게)
  T.ddeok = function (color, o) { o = o || {}; return T.mat(color, { rough: o.rough == null ? 0.7 : o.rough, emis: o.emis == null ? 0.12 : o.emis, sheen: 0.6, map: o.map }); };

  // 콩고물·깨 같은 가루 점 무늬
  const dustCache = {};
  T.dustTex = function (base, dots, n) {
    const key = base + dots + n;
    // 점은 작게(256 칸에 1~2px)
    if (dustCache[key]) return dustCache[key];
    T.srand(91);
    const t = T.tex(T.canvas(256, 256, (g, w, h) => {
      g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < (n || 900); i++) { g.fillStyle = dots[(rnd() * dots.length) | 0]; const s = 0.8 + rnd() * 1.4; g.fillRect(rnd() * w, rnd() * h, s, s); }
    }), [2, 2]);
    return (dustCache[key] = t);
  };

  // 반달 송편: 납작한 공을 반으로 접은 모양 + 등에 꼬집은 줄
  let songGeo = null;
  T.songpyeonGeo = function () {
    if (songGeo) return songGeo;
    const g = new THREE.SphereGeometry(0.5, 40, 24);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // 반달: 아래를 평평하게, 가로로 길게, 위로 볼록
      const yy = y < -0.12 ? -0.12 + (y + 0.12) * 0.25 : y;
      const bend = Math.cos(x * 2.2) * 0.12;
      p.setXYZ(i, x * 1.35, (yy + 0.12) * 0.62 + bend * (yy > 0 ? 1 : 0.3), z * 0.72);
    }
    g.computeVertexNormals();
    return (songGeo = g);
  };

  // ---------- 글자 판(간판·스티커) ----------
  T.label = function (text, o) {
    o = o || {};
    const W = o.w || 512, H = o.h || 256;
    const c = T.canvas(W, H, (g) => {
      if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); }
      g.fillStyle = o.color || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      // 글자가 칸보다 길면 잘리지 않게 줄인다(테두리 두께까지 넣어서)
      const font = (px) => (g.font = (o.weight || '') + ' ' + px + "px 'Ttl','Ui',sans-serif");
      let px = o.size || 150; font(px);
      const room = W * 0.94 - (o.stroke ? o.sw || 18 : 0), tw = g.measureText(text).width;
      if (tw > room) { px = Math.floor(px * room / tw); font(px); }
      if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || 18; g.strokeStyle = o.stroke; g.strokeText(text, W / 2, H / 2 + (o.dy || 8)); }
      g.fillText(text, W / 2, H / 2 + (o.dy || 8));
    });
    return T.tex(c);
  };
})();
