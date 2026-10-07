// 무대: 렌더러·빛·카메라, 장면 짓기, 물건 숨기기, 번호 그림(어디를 눌렀나), 작은 그림(목록)
(function () {
  const T = THREE;
  const S = (window.S = {});
  const SCN = (window.SCN = window.SCN || {});

  const ASPECT = (S.ASPECT = 16 / 10);
  const IW = 800, IH = 500;   // 번호 그림 크기(누른 자리 판정)
  let renderer, scene, cam, root, sun, hemi, envRT, idRT;
  let spots = [], placed = [];
  let bgTop = '#f6e7d8', bgBot = '#e9c9b4';

  function init() {
    if (renderer) return;
    const SAFE = S.SAFE;   // 폰에서 3D 가 안 그려지면 쓰는 가벼운 판(틀린그림찾기에서 배운 것)
    renderer = new T.WebGLRenderer({ antialias: !SAFE, alpha: true, preserveDrawingBuffer: true, powerPreference: SAFE ? 'low-power' : 'default' });
    renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); S.lost = true; });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = !SAFE;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    scene = new T.Scene();
    cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    hemi = new T.HemisphereLight(0xfff4e6, 0x8a6a58, 0.5);
    scene.add(hemi);
    sun = new T.DirectionalLight(0xfff0dc, 2.6);
    sun.castShadow = !SAFE;
    sun.shadow.mapSize.set(SAFE ? 512 : 2048, SAFE ? 512 : 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 4;
    const sc = sun.shadow.camera;
    sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 60;
    scene.add(sun, sun.target);
    const es = new T.Scene();
    const eg = new T.SphereGeometry(10, 32, 16);
    const col = [];
    const p = eg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 10;
      const c = new T.Color(0xfff3e4).lerp(new T.Color(0x6b5a55), Math.max(0, -y) * 0.9);
      if (y > 0.2) c.lerp(new T.Color(0xffffff), (y - 0.2) * 0.6);
      col.push(c.r, c.g, c.b);
    }
    eg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    es.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const panel = new T.Mesh(new T.PlaneGeometry(6, 4), new T.MeshBasicMaterial({ color: 0xffffff }));
    panel.position.set(6, 6, 4);
    panel.lookAt(0, 0, 0);
    es.add(panel);
    if (!SAFE) {
      const pmg = new T.PMREMGenerator(renderer);
      envRT = pmg.fromScene(es, 0.02);
      scene.environment = envRT.texture;
    } else hemi.intensity = 1.1;
    root = new T.Group();
    scene.add(root);
    idRT = new T.WebGLRenderTarget(IW, IH, { depthBuffer: true, samples: 0 });
  }

  function disposeTree(o) {
    o.traverse((x) => {
      if (x.material) {
        (Array.isArray(x.material) ? x.material : [x.material]).forEach((q) => {
          if (q.map && !q.map.userData.keep) q.map.dispose();
          q.dispose();
        });
      }
    });
  }

  // ── 장면 짓기
  S.build = function (name, seed, opt) {
    init();
    disposeTree(root);
    scene.remove(root);
    root = new T.Group();
    scene.add(root);
    scene.children.filter((c) => c.userData.sceneLight).forEach((c) => scene.remove(c));
    spots = []; placed = [];
    const r = K.rng(seed);
    const ctx = {
      root, r, opt: opt || {}, scene, sun, hemi,
      light(l) { l.userData.sceneLight = true; scene.add(l); return l; },
      bg(top, bot) { bgTop = top; bgBot = bot; },
      exposure(v) { renderer.toneMappingExposure = v; },
      env: 1,
      // 물건을 둘 수 있는 면: 가운데 (x,y,z), 너비 w(x), 깊이 d(z). parent 를 주면 그 안 좌표
      spot(x, y, z, w, d, o) {
        o = o || {};
        const sp = { x, y, z, w, d, max: o.max || 0.7, parent: o.parent || null, wall: o.wall || null, tag: o.tag || '', used: [] };
        spots.push(sp);
        return sp;
      },
    };
    sun.target.position.set(0, 0, 0);
    sun.intensity = 3.4;
    sun.color.set(0xfff0dc);
    hemi.intensity = S.SAFE ? 1.1 : 0.5;
    renderer.toneMappingExposure = 0.95;
    sun.position.set(10, 13, 5);
    const info = SCN[name](ctx);
    S.envK = ctx.env;
    root.traverse((x) => {
      if (!x.isMesh) return;
      (Array.isArray(x.material) ? x.material : [x.material]).forEach((q) => {
        if (q.envMapIntensity == null) return;
        if (q.userData.env == null) q.userData.env = q.envMapIntensity === 1 ? 0.6 : q.envMapIntensity;
        q.envMapIntensity = q.userData.env * ctx.env;
      });
    });
    const view = (info && info.view) || {};
    const dir = new T.Vector3(view.dx || 1, view.dy || 0.95, view.dz || 1.05).normalize();
    const look = new T.Vector3(view.lx || 0, view.ly == null ? 1.6 : view.ly, view.lz || 0);
    cam.position.copy(look).addScaledVector(dir, 50);
    cam.up.set(0, 1, 0);
    cam.lookAt(look);
    const f = (S.fit = view.fit || 7.4);
    cam.left = -f * ASPECT; cam.right = f * ASPECT; cam.top = f; cam.bottom = -f;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    S.info = info;
    S.bg = [bgTop, bgBot];
    return info;
  };

  // ── 물건 하나 만들기: 가장 긴 변을 size 로, 바닥을 y=0 에
  function makeItem(id, size) {
    const def = ITEMS[id];
    const g = new T.Group();
    const inner = new T.Group();
    g.add(inner);
    def.make(inner);
    inner.updateMatrixWorld(true);
    const box = new T.Box3();
    inner.traverse((x) => { if (x.isMesh && !(x.material.transparent && x.material.depthWrite === false)) box.expandByObject(x); });
    const sz = box.getSize(new T.Vector3());
    const k = size / Math.max(sz.x, sz.y, sz.z, 0.01);
    inner.scale.setScalar(k);
    const c = box.getCenter(new T.Vector3());
    inner.position.set(-c.x * k, -box.min.y * k + 0.004, -c.z * k);
    g.userData.item = id;
    g.userData.foot = Math.max(sz.x, sz.z) * k * 0.5;
    g.userData.h = sz.y * k;
    g.traverse((x) => { if (x.isMesh) { x.castShadow = true; x.receiveShadow = true; } });
    return g;
  }
  S.makeItem = makeItem;

  function spotWorld(sp) {
    const v = new T.Vector3(sp.x, sp.y, sp.z);
    if (sp.parent) { sp.parent.updateMatrixWorld(true); sp.parent.localToWorld(v); }
    return v;
  }

  // 자리 하나 고르기: 겹치지 않게
  function putInSpot(obj, sp, r) {
    const rad = obj.userData.foot;
    if (rad * 2 > Math.max(sp.w, sp.d) * 1.15 && rad * 2 > sp.max * 1.3) return false;
    for (let t = 0; t < 14; t++) {
      const x = sp.x + (r() - 0.5) * Math.max(0, sp.w - rad * 1.4);
      const z = sp.z + (r() - 0.5) * Math.max(0, sp.d - rad * 1.4);
      if (sp.used.some((u) => Math.hypot(u.x - x, u.z - z) < (u.rad + rad) * (u.obj.userData.clutter && obj.userData.clutter ? 0.78 : 0.92))) continue;
      obj.position.set(x, sp.y, z);
      obj.rotation.y = r() * Math.PI * 2;
      (sp.parent || root).add(obj);
      const u = { x, z, rad, obj };
      sp.used.push(u);
      obj.userData.spot = sp;
      obj.userData.u = u;
      return true;
    }
    return false;
  }
  function unput(obj) {
    const sp = obj.userData.spot;
    if (sp) sp.used = sp.used.filter((u) => u.obj !== obj);
    if (obj.parent) obj.parent.remove(obj);
    obj.userData.spot = null;
  }
  function placeAnywhere(obj, r, size) {
    for (let t = 0; t < 30; t++) {
      // 넓은 자리일수록 자주
      let tot = 0;
      spots.forEach((s) => (tot += Math.min(6, s.w * s.d) + 0.4));
      let q = r() * tot, sp = spots[0];
      for (const s of spots) { q -= Math.min(6, s.w * s.d) + 0.4; if (q <= 0) { sp = s; break; } }
      if (size > sp.max * 1.25) continue;
      if (putInSpot(obj, sp, r)) return true;
    }
    return false;
  }

  // ── 번호 그림: 물건마다 다른 색, 나머지는 검정
  const idBuf = new Uint8Array(IW * IH * 4);
  const blackM = new T.MeshBasicMaterial({ color: 0x000000 });
  let idMats = [];
  function idMat(k) {
    if (!idMats[k]) {
      const mm = new T.MeshBasicMaterial({ toneMapped: false });
      mm.color.setRGB((k + 1) / 255, 170 / 255, 0, T.LinearSRGBColorSpace);
      idMats[k] = mm;
    }
    return idMats[k];
  }
  // alone: 이 번호만 보이게(가림 없이) — 숨김 비율 재기
  S.prof = { renders: 0, rounds: 0, ms: 0 };
  function renderIds(list, alone) {
    const t0 = performance.now(); S.prof.renders++;
    const keep = [];
    const own = new Map();
    list.forEach((o, k) => o.traverse((x) => { if (x.isMesh) own.set(x, k); }));
    scene.traverse((x) => {
      if (!x.isMesh) return;
      keep.push([x, x.material, x.visible]);
      const k = own.has(x) ? own.get(x) : -1;
      const mm = x.material;
      const fade = mm && !Array.isArray(mm) && mm.transparent && mm.depthWrite === false;
      if (fade) { x.visible = false; return; }
      if (alone != null) { if (k !== alone) { x.visible = false; return; } }
      x.material = k >= 0 ? idMat(k) : blackM;
    });
    const env = scene.environment;
    scene.environment = null;
    renderer.setRenderTarget(idRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.readRenderTargetPixels(idRT, 0, 0, IW, IH, idBuf);
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000, 0);
    scene.environment = env;
    keep.forEach(([x, mm, v]) => { x.material = mm; x.visible = v; });
    S.prof.ms += performance.now() - t0;
  }
  function countOne(k) {
    let n = 0;
    for (let i = 0; i < idBuf.length; i += 4) if (idBuf[i + 1] === 170 && idBuf[i] - 1 === k) n++;
    return n;
  }
  // 번호마다 보이는 칸 수와 상자 (위아래 뒤집힘 고려: 0 줄이 맨 아래)
  function countIds(n) {
    const st = [];
    for (let k = 0; k < n; k++) st.push({ n: 0, x0: IW, y0: IH, x1: -1, y1: -1, sx: 0, sy: 0 });
    for (let y = 0; y < IH; y++) {
      const yy = IH - 1 - y;
      for (let x = 0; x < IW; x++) {
        const i = (y * IW + x) * 4;
        if (idBuf[i + 1] !== 170) continue;
        const k = idBuf[i] - 1;
        if (k < 0 || k >= n) continue;
        const s = st[k];
        s.n++; s.sx += x; s.sy += yy;
        if (x < s.x0) s.x0 = x; if (x > s.x1) s.x1 = x;
        if (yy < s.y0) s.y0 = yy; if (yy > s.y1) s.y1 = yy;
      }
    }
    return st.map((s) => ({ n: s.n, x0: s.x0 / IW, y0: s.y0 / IH, x1: (s.x1 + 1) / IW, y1: (s.y1 + 1) / IH, cx: s.n ? s.sx / s.n / IW : 0.5, cy: s.n ? s.sy / s.n / IH : 0.5 }));
  }

  // ── 물건 숨기기
  // n 개 찾을 것 + 고양이 하나 + 미끼 여럿. lv 0 쉬움 → 5 어려움
  S.place = function (n, lv, seed, o) {
    o = o || {};
    const r = K.rng(seed ^ 0x51ed27);
    const pool = ITEMS.list.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const extra = 3;
    const want = pool.slice(0, n + extra);
    const decoyN = Math.min(pool.length - n - extra, o.decoys == null ? 10 + Math.round(lv * 2) : o.decoys);
    const decoys = pool.slice(n + extra, n + extra + decoyN);
    const L = Math.min(lv, 5) / 5;
    const baseSize = 0.92 - L * 0.34;   // 0.92 → 0.58
    const minPx = Math.round(220 - L * 140);   // 220 → 80 칸
    const rMin = 0.72 - L * 0.42, rMax = lv >= 3 ? 0.9 : 1.01;   // 가려진 비율
    const size = (id) => baseSize * (ITEMS[id].sz || 1) * (0.92 + r() * 0.16);
    const tg = want.map((id) => makeItem(id, size(id)));
    const cat = o.noCat ? null : makeItem('cat', baseSize * 0.95);
    const dc = decoys.map((id) => makeItem(id, size(id)));
    const all = tg.concat(cat ? [cat] : [], dc);
    all.forEach((obj) => { if (!placeAnywhere(obj, r, obj.userData.foot * 2)) obj.userData.lost = true; });
    // 잡동사니로 빈 곳을 채운다(가림·헷갈림)
    const names = (S.info && S.info.clutter) || CLUT.all;
    const dens = o.density == null ? (S.info && S.info.density || 1) * (0.95 + L * 0.4) : o.density;
    const clut = [], fillLog = [];
    spots.forEach((sp) => {
      const want = Math.round(Math.min(9, (sp.w * sp.d) / 0.5) * dens + (r() < 0.5 ? 1 : 0));
      for (let i = 0, fails = 0; i < want && fails < 8; ) {
        const nm = K.pick(r, names);
        const c = CLUT.make(nm, r, Math.min(sp.max * 1.1, CLUT.size(nm) * (0.85 + r() * 0.25)));
        if (putInSpot(c, sp, r)) { clut.push(c); i++; } else fails++;
      }
      fillLog.push([sp.tag, want, sp.used.length]);
    });
    S.fillLog = fillLog;
    // 자리를 못 찾으면 잡동사니 하나를 치우고 다시
    let budget = Math.ceil(clut.length * 0.2);   // 잡동사니를 너무 많이 치우면 다시 휑해진다
    const evict = () => { if (!clut.length || budget <= 0) return; budget--; const i = Math.floor(r() * clut.length); unput(clut[i]); clut.splice(i, 1); };
    const replace = (obj) => { for (let t = 0; t < 6; t++) { if (placeAnywhere(obj, r, obj.userData.foot * 2)) return true; if (t >= 3) evict(); } return false; };
    const checks = tg.concat(cat ? [cat] : []);
    let stats = null, aloneN = [];
    renderer.shadowMap.autoUpdate = false;
    S.prof = { renders: 0, rounds: 0, ms: 0 };
    for (let round = 0; round < 10; round++) {
      S.prof.rounds++;
      // 놓지 못한 것은 다시
      all.forEach((obj) => { if (obj.userData.lost && replace(obj)) obj.userData.lost = false; });
      renderIds(all);
      stats = countIds(all.length);
      let bad = 0, good = 0, catOk = !cat;
      checks.forEach((obj, k) => {
        if (obj.userData.lost) { bad++; return; }
        // 혼자 그렸을 때 칸 수는 자리를 옮겼을 때만 다시 잰다
        const key = obj.parent ? obj.position.x.toFixed(3) + ',' + obj.position.z.toFixed(3) + ',' + obj.rotation.y.toFixed(3) + ',' + obj.parent.id : '';
        if (obj.userData.aloneKey !== key) { renderIds(all, k); obj.userData.aloneN = countOne(k); obj.userData.aloneKey = key; }
        const a = obj.userData.aloneN;
        aloneN[k] = a;
        const v = stats[k].n, ratio = a ? v / a : 0;
        const isCat = obj === cat;
        const need = isCat ? minPx * 0.55 : minPx;
        const lo = isCat ? Math.min(rMin, 0.4) : rMin;
        const ok = v >= need && ratio >= lo && ratio <= rMax;
        obj.userData.ok = ok;
        if (ok) { if (isCat) catOk = true; else good++; return; }
        bad++;
        // 이미 필요한 만큼 찾을 것이 채워졌으면 나머지는 그대로 둔다(미끼가 된다)
        if (!isCat && good >= n) return;
        unput(obj); if (!replace(obj)) obj.userData.lost = true;
      });
      if (!bad || (good >= n && catOk)) break;
      if (round === 9) { renderIds(all); stats = countIds(all.length); }
    }
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    // 마지막 번호 그림을 남긴다(누른 자리 판정)
    renderIds(all);
    stats = countIds(all.length);
    placed = all;
    const catK = tg.length;
    let items = tg.map((obj, k) => Object.assign({ k, id: obj.userData.item, obj, found: false, ok: !!obj.userData.ok && !obj.userData.lost }, stats[k]));
    // 조건을 채운 것부터, 그다음 잘 보이는 것 — n 개만 목록에 (나머지는 미끼로 남는다)
    items = items.filter((it) => it.n > 0).sort((a, b) => (b.ok - a.ok) || (b.n - a.n)).slice(0, n).sort((a, b) => a.k - b.k);
    const catInfo = cat ? Object.assign({ k: catK, id: 'cat', obj: cat, found: false }, stats[catK]) : null;
    S.items = items; S.cat = catInfo;
    return { items, cat: catInfo && catInfo.n > 0 ? catInfo : null, decoys: decoys };
  };

  // 누른 자리(u,v: 0~1)에서 rad(번호 그림 칸) 안의 가장 가까운 번호
  S.hit = function (u, v, rad, accept) {
    const cx = u * IW, cy = (1 - v) * IH;
    let best = -1, bd = 1e9;
    const R = Math.ceil(rad);
    for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(IH - 1, Math.ceil(cy + R)); y++)
      for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(IW - 1, Math.ceil(cx + R)); x++) {
        const i = (y * IW + x) * 4;
        if (idBuf[i + 1] !== 170) continue;
        const k = idBuf[i] - 1;
        if (accept && !accept(k)) continue;
        const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d < bd && d <= rad * rad) { bd = d; best = k; }
      }
    return best;
  };

  // 물건 k 의 보이는 모양 (흰색) — 찾았을 때 빛 테두리
  S.mask = function (k) {
    const c = document.createElement('canvas');
    c.width = IW; c.height = IH;
    const g = c.getContext('2d');
    const img = g.createImageData(IW, IH), o = img.data;
    for (let y = 0; y < IH; y++) {
      const si = y * IW * 4, di = (IH - 1 - y) * IW * 4;
      for (let x = 0; x < IW * 4; x += 4) {
        if (idBuf[si + x + 1] === 170 && idBuf[si + x] - 1 === k) { o[di + x] = o[di + x + 1] = o[di + x + 2] = 255; o[di + x + 3] = 255; }
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  };
  S.IW = IW; S.IH = IH;

  // ── 그리기: WebGL 그림을 직접 읽어 2D 캔버스로 (폰에서 drawImage 가 옛 그림을 주던 일 대비)
  function setSize(w, h) {
    if (renderer.domElement.width !== w || renderer.domElement.height !== h) renderer.setSize(w, h, false);
  }
  let rpCv = null, rpBuf = null;
  function readGL(w, h) {
    const gl = renderer.getContext();
    if (!rpCv) rpCv = document.createElement('canvas');
    if (rpCv.width !== w || rpCv.height !== h) { rpCv.width = w; rpCv.height = h; rpBuf = new Uint8Array(w * h * 4); }
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, rpBuf);
    const g = rpCv.getContext('2d');
    const img = g.createImageData(w, h), o = img.data, row = w * 4;
    let cover = 0;
    for (let y = 0; y < h; y++) {
      const si = (h - 1 - y) * row, di = y * row;
      for (let x = 0; x < row; x += 4) {
        const a = rpBuf[si + x + 3];
        if (!a) { o[di + x + 3] = 0; continue; }
        if ((x & 60) === 0 && (y & 15) === 0) cover++;
        const k = a === 255 ? 1 : 255 / a;
        o[di + x] = rpBuf[si + x] * k; o[di + x + 1] = rpBuf[si + x + 1] * k; o[di + x + 2] = rpBuf[si + x + 2] * k; o[di + x + 3] = a;
      }
    }
    S.cover = cover / ((w / 16) * (h / 16));
    g.putImageData(img, 0, 0);
    return rpCv;
  }
  S.draw = function (canvas) {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    setSize(w, h);
    renderer.render(scene, cam);
    { const gl = renderer.getContext(); if (gl.finish) gl.finish(); }
    const g = canvas.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, bgTop);
    gr.addColorStop(1, bgBot);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.drawImage(readGL(w, h), 0, 0);
    const v = g.createRadialGradient(w / 2, h * 0.48, h * 0.4, w / 2, h / 2, h * 1.0);
    v.addColorStop(0, 'rgba(40,20,20,0)');
    v.addColorStop(1, 'rgba(40,20,20,0.24)');
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
  };

  // ── 작은 그림: 물건 하나를 비스듬히
  let thScene = null, thCam = null;
  const thCache = {};
  S.thumb = function (id, px) {
    px = px || 160;
    const key = id + '@' + px;
    if (thCache[key]) return thCache[key];
    init();
    if (!thScene) {
      thScene = new T.Scene();
      thScene.add(new T.HemisphereLight(0xfff4e6, 0x8a6a58, S.SAFE ? 1.2 : 0.7));
      const d = new T.DirectionalLight(0xfff0dc, 2.4);
      d.position.set(4, 7, 5);
      thScene.add(d);
      thCam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    }
    thScene.environment = scene.environment;
    const obj = makeItem(id, 1);
    obj.rotation.y = ITEMS[id].thumbRot == null ? -0.5 : ITEMS[id].thumbRot;
    thScene.add(obj);
    obj.updateMatrixWorld(true);
    const box = new T.Box3();
    obj.traverse((x) => { if (x.isMesh && !(x.material.transparent && x.material.depthWrite === false)) box.expandByObject(x); });
    const c = box.getCenter(new T.Vector3());
    const dir = new T.Vector3(0.35, 0.75, 1).normalize();
    thCam.position.copy(c).addScaledVector(dir, 20);
    thCam.lookAt(c);
    thCam.updateMatrixWorld();
    // 화면에 비친 상자 크기로 맞춘다
    const pts = [];
    for (let i = 0; i < 8; i++) pts.push(new T.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    const inv = thCam.matrixWorldInverse;
    let mx = 0, my = 0;
    pts.forEach((p) => { p.applyMatrix4(inv); mx = Math.max(mx, Math.abs(p.x)); my = Math.max(my, Math.abs(p.y)); });
    const f = Math.max(mx, my) * 1.12;
    thCam.left = -f; thCam.right = f; thCam.top = f; thCam.bottom = -f;
    thCam.updateProjectionMatrix();
    setSize(px, px);
    const exp = renderer.toneMappingExposure;
    renderer.toneMappingExposure = 1.0;
    renderer.render(thScene, thCam);
    renderer.toneMappingExposure = exp;
    const out = document.createElement('canvas');
    out.width = out.height = px;
    out.getContext('2d').drawImage(readGL(px, px), 0, 0);
    thScene.remove(obj);
    disposeTree(obj);
    return (thCache[key] = out);
  };

  S.gpu = function () {
    try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return String(e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)).slice(0, 90); } catch (err) { return '?'; }
  };
  S.goSafe = function () {
    if (S.SAFE) return false;
    S.SAFE = true;
    try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {}
    renderer = null; thScene = null; S.lost = false;
    for (const k in thCache) delete thCache[k];
    idMats = [];
    init();
    return true;
  };
  S.spots = () => spots;
  S.placed = () => placed;
  S.cam = () => cam;
  S.scene = () => scene;
  // 물건의 화면 자리(0~1)
  S.project = function (obj) {
    const v = new T.Vector3();
    obj.getWorldPosition(v);
    v.y += (obj.userData.h || 0) * 0.5;
    v.project(cam);
    return { u: (v.x + 1) / 2, v: (1 - v.y) / 2 };
  };
})();
