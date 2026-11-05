// 손님 팔뚝: 3D 팔, 피부 그림, 스텐실·잉크를 그리는 판(patch), 선을 얼마나 덮었는지 세기
// 좌표: cm. 팔은 x 축(팔꿈치 -, 손목 +), 위가 +y. 살갗 위 자리는 (x, s) — s 는 팔 꼭대기에서 둘레를 따라 잰 길이(화면 오른쪽 +)
(function () {
  const A = (window.ARM = {});
  const X0 = -17, X1 = 14, NU = 124, NV = 96;
  A.X0 = X0; A.X1 = X1;
  let geo = null, arcS = null, thick = 1;
  const PX = 80; // 판 그림 1cm = 80px(최대 1024px)

  A.init = function (scene) {
    A.g = new THREE.Group(); scene.add(A.g);
    A.skinC = RND.cv2(1024, 512);
    A.skinT = RND.tex(A.skinC);
    A.skinMat = new THREE.MeshStandardMaterial({ map: A.skinT, roughness: 0.56, metalness: 0 });
    // 살갗이 살짝 비치는 느낌: 가장자리 붉게(fresnel)
    A.skinMat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  float fr = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.5);\n  gl_FragColor.rgb += vec3(0.22, 0.05, 0.02) * fr;');
    };
    A.arm = new THREE.Mesh(new THREE.BufferGeometry(), A.skinMat); A.arm.castShadow = A.arm.receiveShadow = true; A.g.add(A.arm);
    // 걷어 올린 소매
    A.sleeveC = RND.cv2(256, 256);
    A.sleeveMat = new THREE.MeshStandardMaterial({ map: RND.tex(A.sleeveC), roughness: 0.92 });
    A.sleeve = new THREE.Mesh(new THREE.BufferGeometry(), A.sleeveMat); A.sleeve.castShadow = A.sleeve.receiveShadow = true; A.g.add(A.sleeve);
    // 손목 끝을 덮은 수건
    const tc = RND.cv2(256, 256), tg = tc.getContext('2d'); tg.fillStyle = '#2a2a30'; tg.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7000; i++) { tg.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.3)'; tg.beginPath(); tg.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 1.4, 0, 7); tg.fill(); }
    const tT = RND.tex(tc); tT.wrapS = tT.wrapT = THREE.RepeatWrapping; tT.repeat.set(3, 3);
    const tw = new THREE.BoxGeometry(12, 4.2, 12, 20, 6, 20); const ta = tw.attributes.position;
    for (let i = 0; i < ta.count; i++) { const x = ta.getX(i), y = ta.getY(i), z = ta.getZ(i); const r = Math.min(1, Math.abs(z) / 6); ta.setY(i, y - r * r * 2.6 + Math.sin(x * 1.3 + z) * 0.18 + (y > 0 ? 0.6 * Math.cos(z * 0.25) : 0)); ta.setX(i, x + Math.sin(z * 0.8) * 0.3); }
    tw.computeVertexNormals();
    A.towel = new THREE.Mesh(tw, new THREE.MeshStandardMaterial({ map: tT, roughness: 1 })); A.towel.position.set(18.5, -0.8, 0); A.towel.castShadow = A.towel.receiveShadow = true; A.g.add(A.towel);
    A.patches = [];
    buildMachine();
    A.g.add(A.mc);
  };

  // ---------- 팔 모양 ----------
  function prof(x) {
    const t = (x - X0) / (X1 - X0);
    const r = (2.85 + 1.45 * Math.pow(1 - t, 1.25)) * thick;
    return { t, a: r * 1.12, b: r * (0.88 - 0.14 * t), bulge: 0.42 * Math.exp(-Math.pow((t - 0.24) / 0.17, 2)) * thick };
  }
  function ringPt(x, phi, out) {
    const p = prof(x), th = Math.PI / 2 + phi;
    const k = 1 + (p.bulge / p.a) * Math.max(0, Math.cos(phi + 0.55));
    const end = Math.min(1, (X1 + 0.6 - x) / 1.4); // 손목 끝은 수건 아래로 살짝 오므림
    const sq = end < 1 ? 0.7 + 0.3 * end : 1;
    out.set(x, p.b * k * Math.sin(th) * sq, p.a * k * Math.cos(th) * sq);
    return out;
  }
  A.buildGeo = function (th) {
    thick = th;
    const pos = new Float32Array((NU + 1) * (NV + 1) * 3), uv = new Float32Array((NU + 1) * (NV + 1) * 2);
    arcS = new Float32Array((NU + 1) * (NV + 1));
    const v = new THREE.Vector3(), pv = new THREE.Vector3();
    for (let i = 0; i <= NU; i++) {
      const x = X0 + ((X1 - X0) * i) / NU;
      // 둘레 길이: 꼭대기(phi=0)에서 양쪽으로
      const half = NV / 2;
      for (let j = 0; j <= NV; j++) {
        const phi = -Math.PI + (2 * Math.PI * j) / NV; ringPt(x, phi, v);
        const o = (i * (NV + 1) + j);
        pos[o * 3] = v.x; pos[o * 3 + 1] = v.y; pos[o * 3 + 2] = v.z;
        uv[o * 2] = (x - X0) / (X1 - X0); uv[o * 2 + 1] = j / NV;
      }
      arcS[i * (NV + 1) + half] = 0;
      for (let j = half + 1; j <= NV; j++) { const o = i * (NV + 1) + j, q = o - 1; v.fromArray(pos, o * 3); pv.fromArray(pos, q * 3); arcS[o] = arcS[q] + v.distanceTo(pv); }
      for (let j = half - 1; j >= 0; j--) { const o = i * (NV + 1) + j, q = o + 1; v.fromArray(pos, o * 3); pv.fromArray(pos, q * 3); arcS[o] = arcS[q] - v.distanceTo(pv); }
    }
    const idx = [];
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, c = a + NV + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    if (geo) geo.dispose();
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    // 끝 뚜껑(팔꿈치는 소매 속, 손목은 수건 속이라 안 보임)
    A.arm.geometry = geo;
    // 소매: 팔보다 조금 굵은 통 + 말아 올린 단
    const sp = [], su = [], sidx = [], SN = 48;
    const xs = [-30, -14.6, -14.0, -13.2, -12.9];
    const grow = [1.32, 1.3, 1.36, 1.38, 1.18];
    xs.forEach((x, i) => { for (let j = 0; j <= SN; j++) { const phi = -Math.PI + (2 * Math.PI * j) / SN; ringPt(Math.max(X0, x), phi, v); v.y *= grow[i]; v.z *= grow[i]; v.x = x; v.y += (i === 0 ? 0.8 : 0) + Math.sin(phi * 5 + i) * 0.08; sp.push(v.x, v.y, v.z); su.push(j / SN * 3, i / 4); } });
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < SN; j++) { const a = i * (SN + 1) + j, b = a + 1, c = a + SN + 1, d = c + 1; sidx.push(a, c, b, b, c, d); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setIndex(sidx); sg.computeVertexNormals();
    if (A.sleeve.geometry) A.sleeve.geometry.dispose(); A.sleeve.geometry = sg; A.sleeveMat.side = THREE.DoubleSide;
  };

  // 손님마다 피부·털·소매
  A.build = function (c) {
    A.clearPatches();
    A.buildGeo(0.94 + ((c.i * 37) % 11) / 60);
    const R = RND.rng(c.seed), g = A.skinC.getContext('2d'), W = 1024, H = 512;
    const base = new THREE.Color(c.skin);
    const hex = (col, l) => { const k = col.clone(); k.offsetHSL(0, 0, l); return '#' + k.getHexString(); };
    // v=0.5 가 팔 꼭대기(밝음), 위아래 가장자리가 팔 밑(어두움)
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, hex(base, -0.08)); gr.addColorStop(0.3, hex(base, -0.02)); gr.addColorStop(0.5, hex(base, 0.02)); gr.addColorStop(0.7, hex(base, -0.02)); gr.addColorStop(1, hex(base, -0.08));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 팔꿈치 쪽 살짝 붉게, 손목 쪽 살짝 노랗게
    const lg = g.createLinearGradient(0, 0, W, 0); lg.addColorStop(0, 'rgba(190,80,60,.1)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(220,170,90,.07)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    // 얼룩덜룩한 살결
    for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H, r = 6 + R() * 30; const sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, R() < 0.5 ? 'rgba(180,90,70,.06)' : 'rgba(255,230,210,.06)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // 땀구멍·잔점
    for (let i = 0; i < 26000; i++) { g.fillStyle = R() < 0.6 ? 'rgba(110,60,45,.07)' : 'rgba(255,240,230,.06)'; g.fillRect(R() * W, R() * H, 1.2, 1.2); }
    // 핏줄: 손목 안쪽(아래쪽 둘레)에 옅은 청록 줄
    g.lineCap = 'round';
    // 핏줄: 손목 쪽 팔 옆·아래(위에서는 잘 안 보이는 곳)에 흐릿하게
    g.save(); g.filter = 'blur(3px)';
    for (let k = 0; k < 4; k++) { const y0 = R() < 0.5 ? H * (0.12 + R() * 0.12) : H * (0.76 + R() * 0.12); g.strokeStyle = 'rgba(80,110,135,.09)'; g.lineWidth = 4 + R() * 3; g.beginPath(); let x = W * (0.6 + R() * 0.15), y = y0; g.moveTo(x, y); for (let s = 0; s < 5; s++) { x += 40 + R() * 40; y += (R() - 0.5) * 30; g.lineTo(x, y); } g.stroke(); }
    g.restore();
    // 점 몇 개
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(90,50,35,.55)'; g.beginPath(); g.arc(R() * W, H * (0.3 + R() * 0.4), 1.5 + R() * 2, 0, 7); g.fill(); }
    // 팔 털: 손목 쪽으로 누운 짧은 털
    const nH = Math.round(9000 * c.hairy);
    for (let i = 0; i < nH; i++) { const x = R() * W, y = R() * H, l = 3 + R() * 5, a = 0.15 + (y / H - 0.5) * 0.9 + (R() - 0.5) * 0.5; g.strokeStyle = `rgba(52,36,26,${0.08 + R() * 0.14})`; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 - 1, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    A.skinT.needsUpdate = true;
    // 소매 천
    const sgx = A.sleeveC.getContext('2d'); sgx.fillStyle = c.sleeve; sgx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) { sgx.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; sgx.fillRect(R() * 256, R() * 256, 1.5, 1.5); }
    for (let y = 0; y < 256; y += 3) { sgx.fillStyle = 'rgba(0,0,0,.05)'; sgx.fillRect(0, y, 256, 1); }
    A.sleeveMat.map.needsUpdate = true;
    A.g.position.set(0, 0, 0); A.g.rotation.set(0, 0, 0);
  };

  // (x, s) → 둘레 표 칸 찾기: 해당 x 고리의 s 값 사이에서 phi 를 구해 3D 점
  A.surf = function (x, s, out, nrm) {
    const fi = Math.max(0, Math.min(NU - 1e-4, ((x - X0) / (X1 - X0)) * NU)), i = Math.floor(fi);
    // 그 고리의 s 표에서 j 찾기(두 고리 사이 섞음)
    const findPhi = (ii) => { let lo = 0, hi = NV; const o = ii * (NV + 1); while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arcS[o + m] < s) lo = m; else hi = m; } const a = arcS[o + lo], b = arcS[o + hi]; const t = b > a ? (s - a) / (b - a) : 0; return -Math.PI + (2 * Math.PI * (lo + t)) / NV; };
    const phi = findPhi(i) * (1 - (fi - i)) + findPhi(i + 1) * (fi - i);
    ringPt(x, phi, out);
    if (nrm) { const p = prof(x); nrm.set(0, Math.sin(Math.PI / 2 + phi) / p.b, Math.cos(Math.PI / 2 + phi) / p.a).normalize(); }
    return out;
  };

  // ---------- 판(patch): 스텐실·잉크를 그리는 캔버스 + 같은 팔 모양에 덧씌운 껍질 ----------
  A.clearPatches = function () { A.patches.forEach((p) => { A.g.remove(p.mesh); p.mesh.geometry.dispose(); p.tex.dispose(); }); A.patches = []; A.cur = null; };
  A.startJob = function (job, gear) {
    const ds = FLASH.get(job.id), bb = FLASH.bbox(job.id);
    const side = job.w * 1.28 + 1.4;
    const px = Math.min(PX, Math.floor(1024 / side)), W = Math.ceil(side * px), H = W;
    const P = { job, side, px, W, H, x0: job.x - side / 2, s0: job.s - side / 2, gear };
    ['stC', 'tiC', 'irC', 'coC', 'inC', 'smC', 'outC'].forEach((k) => (P[k] = RND.cv2(W, H)));
    P.tex = RND.tex(P.outC); P.tex.wrapS = P.tex.wrapT = THREE.ClampToEdgeWrapping;
    // 판 좌표를 uv 로 하는 껍질(같은 꼭짓점)
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', geo.attributes.position); g2.setAttribute('normal', geo.attributes.normal); g2.setIndex(geo.index);
    const n = geo.attributes.position.count, uv = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) { const x = geo.attributes.position.getX(k); uv[k * 2] = (arcS[k] - P.s0) / side; uv[k * 2 + 1] = 1 - (x - P.x0) / side; }
    g2.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    P.mesh = new THREE.Mesh(g2, new THREE.MeshStandardMaterial({ map: P.tex, transparent: true, roughness: 0.38, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false }));
    P.mesh.receiveShadow = true; A.g.add(P.mesh);
    // 도안 → cm 점(가운데 맞춤, 돌림)
    const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2, sc = job.w / 100, cr = Math.cos(job.rot), sr = Math.sin(job.rot);
    const toCm = (p) => { const lx = (p[0] - cx) * sc, ly = (p[1] - cy) * sc; return [job.s + lx * cr - ly * sr, job.x + lx * sr + ly * cr]; }; // [s, x]
    P.shapes = ds._p.map((sh) => ({ f: job.col ? sh.f : null, subs: sh.subs.map((sp) => ({ closed: sp.closed, pts: sp.pts.map(toCm) })) }));
    // 스텐실 점(0.05cm 간격) + 칸 나눔
    const S = [], X = []; P.brk = new Set();
    P.shapes.forEach((sh) => sh.subs.forEach((sp) => {
      P.brk.add(S.length);
      const pts = sp.closed ? sp.pts.concat([sp.pts[0]]) : sp.pts;
      for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(l / 0.05)); for (let q = 0; q < m; q++) { const t = q / m; S.push(a[0] + (b[0] - a[0]) * t); X.push(a[1] + (b[1] - a[1]) * t); } }
    }));
    P.ss = Float32Array.from(S); P.sx = Float32Array.from(X); P.cov = new Uint8Array(S.length); P.nCov = 0;
    P.grid = new Map(); const C = 0.25;
    for (let k = 0; k < S.length; k++) { const key = Math.floor(S[k] / C) + ',' + Math.floor(X[k] / C); let l = P.grid.get(key); if (!l) P.grid.set(key, (l = [])); l.push(k); }
    // 색 칠 칸: 칸마다 색, 0.12cm 격자 점
    P.regions = [];
    const fills = P.shapes.map((sh, i) => ({ sh, i })).filter((o) => o.sh.f);
    if (fills.length) {
      const RP = 20, RW = Math.ceil(side * RP), rc = RND.cv2(RW, RW), rg = rc.getContext('2d', { willReadFrequently: true });
      rg.imageSmoothingEnabled = false;
      // 칸 번호는 16 간격 색으로, 가장자리 번짐(섞인 색)은 읽을 때 버림
      // 'n'(칠하지 않는 흰 칸)은 지도에 240 으로만 그려 그 밑 칸을 지우고, 칠할 칸으로 세지 않음
      fills.forEach((o) => { const blank = o.sh.f === 'n'; rg.fillStyle = 'rgb(' + (blank ? 240 : (P.regions.length + 1) * 16) + ',0,0)'; rg.beginPath(); o.sh.subs.forEach((sp) => { sp.pts.forEach((p, q) => { const X2 = (p[0] - P.s0) * RP, Y2 = (p[1] - P.x0) * RP; q ? rg.lineTo(X2, Y2) : rg.moveTo(X2, Y2); }); if (sp.closed) rg.closePath(); }); rg.fill('evenodd'); if (!blank) P.regions.push({ f: o.sh.f, pts: [], cov: 0, done: false, shape: o.sh }); });
      P.rmap = rg.getImageData(0, 0, RW, RW).data; P.RP = RP; P.RW = RW;
      for (let ys = 0; ys < side; ys += 0.12) for (let xs = 0; xs < side; xs += 0.12) { const id = regionAt(P, P.s0 + xs, P.x0 + ys); if (id >= 0) P.regions[id].pts.push(P.s0 + xs, P.x0 + ys, 0); }
      // 너무 작은 칸(점 3개 안)은 칠한 셈
      P.regions.forEach((r) => { r.n = r.pts.length / 3; if (r.n < 3) r.done = true; });
    }
    drawStencil(P);
    A.patches.push(P); A.cur = P; P.dirty = true;
    return P;
  };
  function regionAt(P, s, x) {
    const X = Math.floor((s - P.s0) * P.RP), Y = Math.floor((x - P.x0) * P.RP);
    if (X < 0 || Y < 0 || X >= P.RW || Y >= P.RW) return -1;
    const o = (Y * P.RW + X) * 4; const r = P.rmap[o]; return P.rmap[o + 3] === 255 && r > 0 && r < 240 && r % 16 === 0 ? r / 16 - 1 : -1;
  }
  A.regionAt = (s, x) => (A.cur && A.cur.regions.length ? regionAt(A.cur, s, x) : -1);
  // 보라색 스텐실(먹지로 찍어 살짝 번지고 군데군데 옅음)
  function drawStencil(P) {
    const g = P.stC.getContext('2d'), R = RND.rng(P.job.id.length * 31 + P.W);
    g.clearRect(0, 0, P.W, P.H); g.lineJoin = 'round'; g.lineCap = 'round';
    const path = () => { g.beginPath(); P.shapes.forEach((sh) => sh.subs.forEach((sp) => { sp.pts.forEach((p, q) => { const X = (p[0] - P.s0) * P.px, Y = (p[1] - P.x0) * P.px; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); if (sp.closed) g.closePath(); })); };
    g.save(); g.filter = 'blur(' + Math.max(1, P.px * 0.02).toFixed(1) + 'px)'; g.strokeStyle = 'rgba(92,52,170,.55)'; g.lineWidth = P.px * 0.1; path(); g.stroke(); g.restore();
    g.strokeStyle = '#4b2a9a'; g.lineWidth = P.px * 0.055; path(); g.stroke();
    // 군데군데 옅게(먹지 얼룩)
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < P.W * P.H / 900; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.1 + R() * 0.35) + ')'; g.beginPath(); g.arc(R() * P.W, R() * P.H, 1 + R() * P.px * 0.05, 0, 7); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  }

  // ---------- 바늘 ----------
  // 가장 가까운 스텐실 점까지 거리(cm), 없으면 9
  A.near = function (s, x, maxR) {
    const P = A.cur; if (!P) return 9; const C = 0.25, r = Math.ceil(maxR / C);
    const gi = Math.floor(s / C), gj = Math.floor(x / C); let best = 81;
    for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) { const l = P.grid.get((gi + a) + ',' + (gj + b)); if (!l) continue; for (const k of l) { const d = (P.ss[k] - s) ** 2 + (P.sx[k] - x) ** 2; if (d < best) best = d; } }
    return Math.sqrt(best);
  };
  const cpx = (P, s, x) => [(s - P.s0) * P.px, (x - P.x0) * P.px];
  // 선 바늘 한 점: 잉크 + 붉은 기 + 덮은 스텐실 점 표시. faint = 너무 빨라 듬성듬성(덮지 않음)
  A.inkDot = function (s, x, r, faint, hit) {
    const P = A.cur; if (!P) return 0;
    const [X, Y] = cpx(P, s, x), g = P.inC.getContext('2d');
    g.fillStyle = faint ? 'rgba(30,28,36,.32)' : 'rgba(20,19,24,.96)';
    g.beginPath(); g.arc(X, Y, Math.max(0.8, r * P.px * (faint ? 0.7 : 1)), 0, 7); g.fill();
    const ir = P.irC.getContext('2d'); ir.fillStyle = 'rgba(200,60,55,.022)'; ir.beginPath(); ir.arc(X, Y, P.px * 0.17, 0, 7); ir.fill();
    P.dirty = true;
    if (faint) return 0;
    let n = 0; const C = 0.25, rr = (hit || r + 0.015) ** 2;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = P.grid.get((Math.floor(s / C) + a) + ',' + (Math.floor(x / C) + b)); if (!l) continue; for (const k of l) { if (P.cov[k]) continue; if ((P.ss[k] - s) ** 2 + (P.sx[k] - x) ** 2 <= rr) { P.cov[k] = 1; P.nCov++; n++; } } }
    return n;
  };
  // 한 자리에 오래 머물러 번짐
  A.blowout = function (s, x) {
    const P = A.cur; if (!P) return; const [X, Y] = cpx(P, s, x), g = P.inC.getContext('2d'), r = P.px * 0.32;
    const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, 'rgba(30,34,58,.7)'); gr.addColorStop(0.6, 'rgba(40,48,80,.28)'); gr.addColorStop(1, 'rgba(40,48,80,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(X, Y, r, 0, 7); g.fill(); P.dirty = true;
  };
  // 칠하기 바늘: 그 색으로 칠하고, 칸 점 덮기. 돌려줌 {n, wrong, out}
  A.colorDot = function (s, x, r, col, hit) {
    const P = A.cur; if (!P) return null; const [X, Y] = cpx(P, s, x), g = P.coC.getContext('2d');
    g.fillStyle = FLASH.COL[col]; g.globalAlpha = 0.9; g.beginPath(); g.arc(X, Y, r * P.px, 0, 7); g.fill(); g.globalAlpha = 1;
    const ir = P.irC.getContext('2d'); ir.fillStyle = 'rgba(200,50,50,.02)'; ir.beginPath(); ir.arc(X, Y, P.px * (r + 0.15), 0, 7); ir.fill();
    P.dirty = true;
    const id = regionAt(P, s, x); let n = 0;
    P.regions.forEach((R) => { if (R.done || R.f !== col) return; const p = R.pts, rr = (hit || r) ** 2; for (let k = 0; k < p.length; k += 3) { if (p[k + 2]) continue; const d = (p[k] - s) ** 2 + (p[k + 1] - x) ** 2; if (d <= rr) { p[k + 2] = 1; R.cov++; n++; } } });
    return { n, id, wrong: id >= 0 && P.regions[id].f !== col, out: id < 0 };
  };
  // 번진 잉크·피(닦기 전까지 쌓임)
  A.smudge = function (s, x, k) {
    const P = A.cur; if (!P) return; const g = P.smC.getContext('2d'), [X, Y] = cpx(P, s + (Math.random() - 0.5) * 0.7, x + (Math.random() - 0.5) * 0.7), r = P.px * (0.12 + Math.random() * 0.3);
    const gr = g.createRadialGradient(X, Y, 0, X, Y, r); const red = Math.random() < 0.25;
    gr.addColorStop(0, red ? 'rgba(150,20,24,' + 0.06 * k + ')' : 'rgba(22,20,28,' + 0.09 * k + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); P.dirty = true;
  };
  // 휴지로 닦기: 번진 것 지우고, 스텐실도 조금 옅어짐
  A.wipe = function (s, x, fade) {
    let hit = 0;
    A.patches.forEach((P) => {
      const [X, Y] = cpx(P, s, x); if (X < -60 || Y < -60 || X > P.W + 60 || Y > P.H + 60) return;
      const r = P.px * 0.85;
      const g = P.smC.getContext('2d'); g.globalCompositeOperation = 'destination-out'; const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); g.globalCompositeOperation = 'source-over';
      if (P === A.cur && P.phase !== 'done') { const sg = P.stC.getContext('2d'); sg.globalCompositeOperation = 'destination-out'; const g2 = sg.createRadialGradient(X, Y, 0, X, Y, r); g2.addColorStop(0, 'rgba(0,0,0,' + fade + ')'); g2.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = g2; sg.fillRect(X - r, Y - r, r * 2, r * 2); sg.globalCompositeOperation = 'source-over'; }
      // 붉은 기도 조금 가라앉음
      const ir = P.irC.getContext('2d'); ir.globalCompositeOperation = 'destination-out'; ir.fillStyle = 'rgba(0,0,0,.05)'; ir.beginPath(); ir.arc(X, Y, r, 0, 7); ir.fill(); ir.globalCompositeOperation = 'source-over';
      P.dirty = true; hit = 1;
    });
    return hit;
  };
  // 선 마무리: 남은 몇 점은 자동으로 채움
  A.finishLine = function () {
    const P = A.cur; if (!P) return; const g = P.inC.getContext('2d'); g.fillStyle = 'rgba(20,19,24,.96)';
    const r = Math.max(0.8, P.gear.lineR * P.px), n = P.ss.length;
    // 덜 덮인 점 둘레(앞뒤 3점)를 이어 그어 끊긴 데가 없게
    const need = new Uint8Array(n); for (let k = 0; k < n; k++) if (!P.cov[k]) for (let q = -3; q <= 3; q++) if (k + q >= 0 && k + q < n) need[k + q] = 1;
    g.strokeStyle = 'rgba(20,19,24,.96)'; g.lineWidth = r * 2; g.lineCap = 'round';
    for (let k = 0; k < n - 1; k++) { if (!need[k] || P.brk.has(k + 1)) continue; const a = cpx(P, P.ss[k], P.sx[k]), b = cpx(P, P.ss[k + 1], P.sx[k + 1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (let k = 0; k < n; k++) P.cov[k] = 1;
    P.nCov = P.ss.length; P.dirty = true;
  };
  // 색 칸 마무리: 칸 모양대로 채움(선 아래라 경계는 선이 덮음)
  // 칸 마무리: 칸 지도에서 이 칸 자리만 칠함(흰 칸·위에 겹친 다른 색 칸은 덮지 않음, 10/24 호랑이 흰 주둥이가 주황으로 덮였던 것)
  A.finishRegion = function (R) {
    const P = A.cur, id = (P.regions.indexOf(R) + 1) * 16, m = RND.cv2(P.RW, P.RW), mg = m.getContext('2d'), im = mg.createImageData(P.RW, P.RW), hx = FLASH.COL[R.f];
    const cr = parseInt(hx.slice(1, 3), 16), cg = parseInt(hx.slice(3, 5), 16), cb = parseInt(hx.slice(5, 7), 16);
    for (let i = 0; i < P.RW * P.RW; i++) { if (P.rmap[i * 4 + 3] === 255 && P.rmap[i * 4] === id) { im.data[i * 4] = cr; im.data[i * 4 + 1] = cg; im.data[i * 4 + 2] = cb; im.data[i * 4 + 3] = 230; } }
    mg.putImageData(im, 0, 0);
    const g = P.coC.getContext('2d'); g.imageSmoothingEnabled = true; g.drawImage(m, 0, 0, P.RW, P.RW, 0, 0, (P.RW / P.RP) * P.px, (P.RW / P.RP) * P.px);
    R.done = true; A.tint(); P.dirty = true;
  };
  // 색 단계 안내(10/25 사장님 "고쳐"): 아직 안 칠한 칸에만 그 칸 색을 연하게 비춤, 다 칠한 칸은 사라짐
  A.tint = function () {
    const P = A.cur; if (!P) return; const g = P.tiC.getContext('2d'); g.clearRect(0, 0, P.W, P.H); P.dirty = true;
    if (P.phase !== 'color' || !P.regions.length) return;
    const m = RND.cv2(P.RW, P.RW), mg = m.getContext('2d'), im = mg.createImageData(P.RW, P.RW), col = {};
    P.regions.forEach((R, i) => { if (!R.done) { const hx = FLASH.COL[R.f]; col[(i + 1) * 16] = [parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16)]; } });
    for (let i = 0; i < P.RW * P.RW; i++) { if (P.rmap[i * 4 + 3] !== 255) continue; const c = col[P.rmap[i * 4]]; if (!c) continue; im.data[i * 4] = c[0]; im.data[i * 4 + 1] = c[1]; im.data[i * 4 + 2] = c[2]; im.data[i * 4 + 3] = 125; }
    mg.putImageData(im, 0, 0);
    g.imageSmoothingEnabled = true; g.drawImage(m, 0, 0, P.RW, P.RW, 0, 0, (P.RW / P.RP) * P.px, (P.RW / P.RP) * P.px);
  };
  A.lineCov = () => (A.cur ? A.cur.nCov / Math.max(1, A.cur.ss.length) : 0);
  // 다 끝난 판: 스텐실 지우고 붉은 기 낮춤
  A.closeJob = function () { const P = A.cur; if (!P) return; P.phase = 'done'; P.stC.getContext('2d').clearRect(0, 0, P.W, P.H); P.tiC.getContext('2d').clearRect(0, 0, P.W, P.H); P.smC.getContext('2d').clearRect(0, 0, P.W, P.H); P.dirty = true; };
  // 그림 합치기(바뀐 판만)
  A.flush = function (stencilK) {
    A.patches.forEach((P) => {
      if (!P.dirty) return; P.dirty = false;
      const g = P.outC.getContext('2d'); g.clearRect(0, 0, P.W, P.H);
      g.globalAlpha = stencilK; g.drawImage(P.stC, 0, 0); g.globalAlpha = 1;
      g.drawImage(P.irC, 0, 0); g.drawImage(P.tiC, 0, 0); g.drawImage(P.coC, 0, 0); g.drawImage(P.inC, 0, 0); g.drawImage(P.smC, 0, 0);
      // 가장자리 1px 비움(밖으로 번져 늘어나지 않게)
      g.clearRect(0, 0, P.W, 1); g.clearRect(0, P.H - 1, P.W, 1); g.clearRect(0, 0, 1, P.H); g.clearRect(P.W - 1, 0, 1, P.H);
      P.tex.needsUpdate = true;
    });
  };

  // ---------- 화면 → 살갗 ----------
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  A.hit = function (px, py) {
    const P = A.cur; if (!P) return null;
    v2.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(v2, RND.camera);
    const h = ray.intersectObject(A.arm, false)[0]; if (!h) return null;
    // 맞은 삼각형의 판 uv 로 (s, x)
    const uvA = P.mesh.geometry.attributes.uv, f = h.face, b = h.barycoord || null;
    let u, v;
    if (b) { u = uvA.getX(f.a) * b.x + uvA.getX(f.b) * b.y + uvA.getX(f.c) * b.z; v = uvA.getY(f.a) * b.x + uvA.getY(f.b) * b.y + uvA.getY(f.c) * b.z; }
    else { const tri = new THREE.Triangle(), pa = A.arm.geometry.attributes.position; const lp = A.arm.worldToLocal(h.point.clone()); tri.setFromAttributeAndIndices(pa, f.a, f.b, f.c); const bc = tri.getBarycoord(lp, new THREE.Vector3()); u = uvA.getX(f.a) * bc.x + uvA.getX(f.b) * bc.y + uvA.getX(f.c) * bc.z; v = uvA.getY(f.a) * bc.x + uvA.getY(f.b) * bc.y + uvA.getY(f.c) * bc.z; }
    return { s: P.s0 + u * P.side, x: P.x0 + (1 - v) * P.side, p: h.point, n: h.face.normal.clone().transformDirection(A.arm.matrixWorld) };
  };

  // ---------- 코일 머신(3D) ----------
  function buildMachine() {
    const m = (A.mc = new THREE.Group()), body = (A.mcBody = new THREE.Group()); m.add(body);
    const steel = new THREE.MeshStandardMaterial({ color: '#d4d8dc', metalness: 0.9, roughness: 0.25 });
    const iron = new THREE.MeshStandardMaterial({ color: '#7a1c1c', metalness: 0.55, roughness: 0.35 });
    const copper = new THREE.MeshStandardMaterial({ color: '#b8642c', metalness: 0.8, roughness: 0.32 });
    const rubber = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.8 });
    const cyl = (r1, r2, h, mat, y, seg) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 20), mat); c.position.y = y; c.castShadow = true; body.add(c); return c; };
    // 바늘 끝(살에 닿는 곳이 원점), 팁, 그립, 튜브 — 몸통은 +y 로
    A.needle = cyl(0.02, 0.02, 0.6, steel, 0.3, 6);
    cyl(0.09, 0.26, 1.4, steel, 1.2);
    // 그립: 고무 홈줄
    const gc = RND.cv2(64, 64), gg = gc.getContext('2d'); gg.fillStyle = '#1a1a1c'; gg.fillRect(0, 0, 64, 64); for (let y = 0; y < 64; y += 6) { gg.fillStyle = '#050506'; gg.fillRect(0, y, 64, 3); }
    const gT = RND.tex(gc); gT.wrapS = gT.wrapT = THREE.RepeatWrapping; gT.repeat.set(4, 4);
    cyl(0.5, 0.5, 2.6, new THREE.MeshStandardMaterial({ map: gT, roughness: 0.85 }), 3.2);
    cyl(0.28, 0.28, 2.4, steel, 5.6);
    // 몸틀(붉은 쇠) + 코일 둘 + 위 막대 + 스프링
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.6, 1.4), iron); fr.position.set(-0.75, 6.4, 0); fr.castShadow = true; body.add(fr);
    const fr2 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 1.4), iron); fr2.position.set(0.4, 4.3, 0); body.add(fr2);
    for (const z of [-0.36, 0.36]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.8, 18), copper); c.position.set(1.0, 5.4, z * 0); c.position.z = z; c.scale.set(0.9, 1, 0.9); c.castShadow = true; body.add(c); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.18, 0.7), steel); bar.position.set(0.55, 6.5, 0); body.add(bar);
    const spring = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.6), steel); spring.position.set(-0.35, 6.75, 0); body.add(spring);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 10), steel); post.position.set(0.9, 7.2, 0); body.add(post);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.07, 6, 18), new THREE.MeshStandardMaterial({ color: '#d8a020', roughness: 0.7 })); band.position.set(0.2, 5.8, 0); band.rotation.y = Math.PI / 2; body.add(band);
    // 클립코드
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 8), rubber); cord.position.set(-1.6, 9.2, 0); cord.rotation.z = 0.6; body.add(cord);
    m.scale.setScalar(0.82); m.visible = false;
  }
  // 머신 놓기: 끝은 살 위 점, 몸통은 화면 오른쪽 아래로 기울여 바늘 앞이 보이게
  const _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
  A.placeMachine = function (p, on, t) {
    const m = A.mc; if (!p) { m.visible = false; return; }
    m.visible = true; A.g.worldToLocal(m.position.copy(p));
    _d.set(0.75, 0.62, -0.32).normalize(); _q.setFromUnitVectors(_up, _d); m.quaternion.copy(_q);
    // 돌면 바늘이 오르내리고 몸이 떨림
    A.needle.position.y = on ? 0.3 + Math.sin(t * 220) * 0.08 : 0.42;
    A.mcBody.position.set(on ? Math.sin(t * 173) * 0.012 : 0, 0, on ? Math.cos(t * 191) * 0.012 : 0);
  };
})();
