// 3D 핀볼대 그리기 — 판 좌표 (x,y) → 세계 (x-10, 높이, 20-y)
(function () {
  const P = window.PHYS;
  const T3 = THREE;
  const wx = x => x - 10, wz = y => 20 - y;
  let renderer, scene, camera, envTex, bloom = null;
  const S = {};                     // 밖에서 쓰는 손잡이
  const HDR = (hex, k) => new T3.Color(hex).multiplyScalar(k);   // 1 넘는 색 = 빛 번짐

  // ── 도형 합치기 ──
  function merge(geos) {
    const parts = geos.map(g => g.index ? g.toNonIndexed() : g);
    let n = 0; parts.forEach(g => n += g.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    parts.forEach(g => {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += g.attributes.position.count;
    });
    const m = new T3.BufferGeometry();
    m.setAttribute('position', new T3.BufferAttribute(pos, 3)); m.setAttribute('normal', new T3.BufferAttribute(nor, 3)); m.setAttribute('uv', new T3.BufferAttribute(uv, 2));
    return m;
  }
  // 판 위 선분을 상자로
  function wallBox(ax, ay, bx, by, h, th, y0) {
    const L = Math.hypot(bx - ax, by - ay) + th * 0.6;
    const g = new T3.BoxGeometry(L, h, th);
    const m = new T3.Matrix4().makeRotationY(Math.atan2(by - ay, bx - ax));
    m.setPosition(wx((ax + bx) / 2), (y0 || 0) + h / 2, wz((ay + by) / 2));
    g.applyMatrix4(m); return g;
  }
  // 둥근 모서리 벽(캡슐 단면) — 크롬 레일처럼 보이게
  function railGeo(ax, ay, bx, by, h, r, y0) {
    const L = Math.hypot(bx - ax, by - ay);
    const g = new T3.CapsuleGeometry(r, L, 3, 10); g.rotateZ(Math.PI / 2);
    g.scale(1, h / (2 * r), 1);
    const m = new T3.Matrix4().makeRotationY(Math.atan2(by - ay, bx - ax));
    m.setPosition(wx((ax + bx) / 2), (y0 || 0) + h / 2, wz((ay + by) / 2));
    g.applyMatrix4(m); return g;
  }
  function cyl(x, y, r, h, y0, seg) { const g = new T3.CylinderGeometry(r, r, h, seg || 18); g.translate(wx(x), (y0 || 0) + h / 2, wz(y)); return g; }
  // 판 좌표 모양을 세워서 올리기
  function extrude(pts, depth, y0, bevel) {
    const sh = new T3.Shape(pts.map(p => new T3.Vector2(p[0], p[1])));
    const g = new T3.ExtrudeGeometry(sh, { depth, bevelEnabled: !!bevel, bevelSize: bevel || 0, bevelThickness: bevel || 0, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2); g.translate(-10, y0 || 0, 20); return g;
  }
  // 판 좌표 다각형 판(그림 uv 를 모양 상자에 맞춤)
  function flatShape(pts, y0) {
    const g = new T3.ShapeGeometry(new T3.Shape(pts.map(p => new T3.Vector2(p[0], p[1]))));
    let x0 = 1e9, x1 = -1e9, y0b = 1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0b = Math.min(y0b, p[1]); y1 = Math.max(y1, p[1]); });
    const pa = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getX(i) - x0) / (x1 - x0), (pa.getY(i) - y0b) / (y1 - y0b));
    g.rotateX(-Math.PI / 2); g.translate(-10, y0, 20); return g;
  }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function capsulePts(L, r0, r1, grow) {
    const pts = [];
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; pts.push([Math.cos(a) * (r0 + grow), Math.sin(a) * (r0 + grow)]); pts.push([L + Math.cos(a) * (r1 + grow), Math.sin(a) * (r1 + grow)]); }
    return hull(pts);
  }
  function grow(pts, k) { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]); }

  // ── 캔버스 그림 ──
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) { const t = new T3.CanvasTexture(c); if (srgb !== false) t.colorSpace = T3.SRGBColorSpace; t.anisotropy = 4; return t; }
  function glowTex() {
    const c = cv(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,.75)'); gr.addColorStop(0.45, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c);
  }
  function sparkleTex() {   // 네 갈래 별 반짝(11/3 "반짝반짝하게")
    const c = cv(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.25, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#fff';
    [[64, 2, 8], [64, 126, 8], [2, 64, 8], [126, 64, 8]].forEach(([x, y, w], i) => { g.beginPath(); if (i < 2) { g.moveTo(x, y); g.lineTo(64 - w, 64); g.lineTo(64 + w, 64); } else { g.moveTo(x, y); g.lineTo(64, 64 - w); g.lineTo(64, 64 + w); } g.closePath(); g.fill(); });
    g.save(); g.translate(64, 64); g.rotate(Math.PI / 4); g.fillStyle = 'rgba(255,255,255,.55)'; [[0, -40, 3], [0, 40, 3], [-40, 0, 3], [40, 0, 3]].forEach(([x, y, w], i) => { g.beginPath(); if (i < 2) { g.moveTo(x, y); g.lineTo(-w, 0); g.lineTo(w, 0); } else { g.moveTo(x, y); g.lineTo(0, -w); g.lineTo(0, w); } g.closePath(); g.fill(); }); g.restore();
    return tex(c);
  }
  function envMap(bright) {
    const c = cv(512, 256), g = c.getContext('2d');
    let gr = g.createLinearGradient(0, 0, 0, 256);
    if (bright) { gr.addColorStop(0, '#e8e0ff'); gr.addColorStop(0.42, '#9a88d8'); gr.addColorStop(0.55, '#3a2a60'); gr.addColorStop(1, '#140a24'); }
    else { gr.addColorStop(0, '#2a1850'); gr.addColorStop(0.45, '#120a28'); gr.addColorStop(1, '#05030c'); }
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    // 오락실 천장 형광등·네온 띠(크롬에 비치는 것)
    const bars = [[30, '#ffffff', 0.9], [140, '#ff4fc0', 0.75], [250, '#ffffff', 0.7], [330, '#3ae8ff', 0.8], [440, '#ffc84a', 0.75]];
    bars.forEach(([x, col, a]) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x, 40, 34, 70); g.globalAlpha = a * 0.35; g.fillRect(x - 10, 30, 54, 90); });
    g.globalAlpha = 1; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 12, 512, 8);
    const t = tex(c); t.mapping = T3.EquirectangularReflectionMapping; return t;
  }

  // ── 실사 재질(ambientCG CC0, js/tex.js 의 data 주소) ──
  const texCache = {};
  function ptex(key, srgb, rx, ry) {
    const id = key + rx + 'x' + ry;
    if (texCache[id]) return texCache[id];
    const img = new Image(); const t = new T3.Texture(img);
    img.onload = () => { t.needsUpdate = true; }; img.src = (window.TEX || {})[key] || '';
    if (srgb) t.colorSpace = T3.SRGBColorSpace;
    t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 8;
    return texCache[id] = t;
  }
  function pbr(name, rx, ry, o) {
    return new T3.MeshStandardMaterial(Object.assign({ map: ptex(name + '_c', true, rx, ry), normalMap: ptex(name + '_n', false, rx, ry), roughnessMap: ptex(name + '_r', false, rx, ry) }, o || {}));
  }

  // ── 인서트 자리(판 그림의 테두리와 불빛 판이 같은 자리를 씀) ──
  const STG = []; for (let i = 0; i < 10; i++) { const a = Math.PI * (0.95 - i * 0.1); STG.push([P.CX + Math.cos(a) * 4.4, 9.4 + Math.sin(a) * 3.6]); }
  const INS = {
    lanes: P.laneX.map(x => ({ x, y: 30.1, sh: 'c', r: 0.55, col: 0xffc23a })),
    orbit: [{ x: 0.95, y: 20.6, sh: 'a', r: 0.7, rot: 0, col: 0x22e6ff }, { x: 0.95, y: 22.2, sh: 'a', r: 0.55, rot: 0, col: 0x22e6ff }],
    saucer: [{ x: 14.1, y: 19.6, sh: 'a', r: 0.6, rot: -0.9, col: 0x6affd8 }, { x: 13.1, y: 18.6, sh: 'a', r: 0.48, rot: -0.9, col: 0x6affd8 }],
    drops: P.drops.map((d, i) => ({ x: 3.3, y: 15.05 + i * 1.18, sh: 'a', r: 0.38, rot: Math.PI / 2, col: 0xffc23a })),
    stands: P.stands.map((s, i) => ({ x: 17.2, y: 13.4 + i * 1.45, sh: 'c', r: 0.32, col: 0xff3a2a })),
    mult: [2, 3, 4, 5].map((m, i) => ({ x: 7.65 + i * 1.1, y: 19.75, sh: 'c', r: 0.5, col: 0xff2fa8, txt: m + 'x' })),
    stage: STG.map((p, i) => ({ x: p[0], y: p[1], sh: 'c', r: 0.36, col: i === 9 ? 0xff3a2a : 0x8dff3a, txt: String(i + 1) })),
    save: { x: P.CX, y: 3.15, sh: 'c', r: 0.45, col: 0x22e6ff },
    rampL: [[9.2, 10.6], [8.4, 13.4], [7.6, 16.2]].map(p => ({ x: p[0], y: p[1], sh: 'a', r: 0.5, rot: 0.28, col: 0x3a9aff })),
    rampR: [[11.5, 13.2], [12.3, 15.9], [12.9, 18.5]].map(p => ({ x: p[0], y: p[1], sh: 'a', r: 0.5, rot: -0.27, col: 0xff4a3a })),
    lock: [0, 1, 2].map(i => ({ x: 14.0 + i * 0.85, y: 22.9, sh: 'c', r: 0.26, col: 0x6affa0 })),
    chase: Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (0.1 + i * 0.0667); return { x: 10 + Math.cos(a) * 8.7, y: 30 + Math.sin(a) * 8.7, sh: 'c', r: 0.22, col: [0xffd23a, 0xff3a2a, 0xffffff][i % 3], chase: i + 1 }; }),
    eb: { x: P.CX, y: 7.4, sh: 'c', r: 0.42, col: 0xffa020 }
  };

  // ── 판 그림 ──
  const TS = 48, TW = 20, TY0 = -2.5, TY1 = 40.5, TH = TY1 - TY0;
  const tx = x => x * TS, ty = y => (TY1 - y) * TS;
  function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function insertBezel(g, o) {
    g.save(); g.translate(tx(o.x), ty(o.y)); g.rotate(-(o.rot || 0));
    const r = o.r * TS, col = '#' + new T3.Color(o.col).getHexString();
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6;
    g.beginPath();
    if (o.sh === 'c') g.arc(0, 0, r + 4, 0, 7);
    else { const s = r + 4; g.moveTo(0, -s); g.lineTo(s * 0.66, s * 0.18); g.lineTo(s * 0.28, s * 0.18); g.lineTo(s * 0.28, s * 0.84); g.lineTo(-s * 0.28, s * 0.84); g.lineTo(-s * 0.28, s * 0.18); g.lineTo(-s * 0.66, s * 0.18); g.closePath(); }
    g.fillStyle = '#0a0612'; g.fill(); g.shadowBlur = 0;
    g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,240,200,.55)'; g.stroke();
    g.globalAlpha = 0.35; g.fillStyle = col; g.fill(); g.globalAlpha = 1;
    g.restore();
  }
  function playfieldTex() {
    const c = cv(TW * TS, TH * TS), g = c.getContext('2d'), R = rnd(7);
    // 1 바탕: 남보라 밤하늘
    let gr = g.createLinearGradient(0, 0, 0, c.height);
    gr.addColorStop(0, '#120a36'); gr.addColorStop(0.28, '#21146a'); gr.addColorStop(0.55, '#2a1670'); gr.addColorStop(0.8, '#160c44'); gr.addColorStop(1, '#08051a');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    // 2 성운
    [[2.5, 35, '255,60,180', 6], [17, 33, '40,200,255', 6], [2, 19, '140,70,255', 6], [17.5, 14, '255,80,160', 5], [9.3, 5, '40,140,255', 6], [9.3, 17.6, '120,60,255', 8]].forEach(([x, y, col, r]) => {
      const q = g.createRadialGradient(tx(x), ty(y), 0, tx(x), ty(y), r * TS); q.addColorStop(0, `rgba(${col},.13)`); q.addColorStop(1, `rgba(${col},0)`); g.fillStyle = q; g.fillRect(0, 0, c.width, c.height);
    });
    // 3 별
    for (let i = 0; i < 700; i++) { const x = R() * c.width, y = R() * c.height, s = R(); g.fillStyle = `rgba(255,${220 + R() * 35},255,${0.25 + s * 0.6})`; g.fillRect(x, y, s > 0.9 ? 2.5 : 1.5, s > 0.9 ? 2.5 : 1.5); if (s > 0.985) { g.fillRect(x - 6, y + 0.5, 14, 1.2); g.fillRect(x + 0.5, y - 6, 1.2, 14); } }
    // 4 범퍼 자리 햇살(주황·노랑 번갈아, 굵은 검은 테)
    { const cx = tx(P.CX), cy = ty(25.6), r1 = 5.6 * TS;
      for (let i = 0; i < 28; i++) { const a0 = i / 28 * Math.PI * 2, a1 = (i + 1) / 28 * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r1, a0, a1); g.closePath(); g.fillStyle = i % 2 ? '#ff7a1a' : '#ffc23a'; g.fill(); }
      gr = g.createRadialGradient(cx, cy, r1 * 0.2, cx, cy, r1); gr.addColorStop(0, 'rgba(255,255,220,.55)'); gr.addColorStop(0.7, 'rgba(255,120,20,0)'); gr.addColorStop(1, 'rgba(60,0,40,.55)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.fill();
      g.lineWidth = 7; g.strokeStyle = '#120818'; g.beginPath(); g.arc(cx, cy, r1, 0, 7); g.stroke();
      g.lineWidth = 3; g.strokeStyle = '#ffe9a0'; g.beginPath(); g.arc(cx, cy, r1 - 7, 0, 7); g.stroke(); }
    // 5 아래쪽 보라 속도선(플리퍼에서 위로 퍼짐)
    { const cx = tx(P.CX), cy = ty(2.5);
      for (let i = 0; i < 22; i++) { const a0 = Math.PI * (1.08 + i * 0.038), a1 = a0 + Math.PI * 0.019; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * 16 * TS, cy + Math.sin(a0) * 16 * TS); g.lineTo(cx + Math.cos(a1) * 16 * TS, cy + Math.sin(a1) * 16 * TS); g.closePath(); g.fillStyle = i % 2 ? 'rgba(120,60,220,.20)' : 'rgba(40,180,255,.10)'; g.fill(); } }
    // 6 샷 길: 플리퍼에서 각 목표까지 색 띠(굵은 테) — 인서트가 이 위에 놓임
    const shot = (pts, col) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(tx(p[0]), ty(p[1])) : g.moveTo(tx(p[0]), ty(p[1])));
      g.lineWidth = 1.25 * TS; g.strokeStyle = '#0e0818'; g.stroke(); g.globalAlpha = 0.78; g.lineWidth = 0.98 * TS; g.strokeStyle = col; g.stroke(); g.globalAlpha = 1;
      g.lineWidth = 0.5 * TS; g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke();
    };
    shot([[9.5, 9.4], [8.3, 13.6], [7.0, 18.6]], '#1d6fd8');
    shot([[11.2, 12.5], [12.4, 16.5], [13.3, 20.8]], '#d8302a');
    shot([[8.0, 13.5], [4.3, 17.0], [2.2, 19.6], [0.95, 21.6]], '#1aa8a0');
    shot([[11.6, 15.6], [13.6, 18.2], [14.9, 20.2]], '#2a9a48');
    // 7 기능 이름(인쇄 글자)
    const label = (t, x, y, rot, size, col) => { g.save(); g.translate(tx(x), ty(y)); g.rotate(rot || 0); g.font = `400 ${size}px Ttl, 'Black Han Sans', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = '#0e0818'; g.strokeText(t, 0, 0); g.fillStyle = col || '#fff6dc'; g.fillText(t, 0, 0); g.restore(); };
    label('RAMP', 7.3, 12.0, -1.3, 30, '#bfe4ff'); label('RAMP', 12.0, 14.2, 1.25, 30, '#ffd0c8'); label('ORBIT', 3.5, 17.6, -0.95, 26, '#b8fff6'); label('HOLE', 13.0, 17.1, 0.95, 26, '#c8ffd0');
    label('JACKPOT', P.CX, 21.0, 0, 26, '#ffe14a'); label('EXTRA BALL', P.CX, 6.4, 0, 24, '#9ff0ff');
    // 8 황금 표적 자리: 고전 과녁 + 별빛 줄
    const bx = tx(P.CX), by = ty(P.boss.y);
    for (let i = 0; i < 24; i++) { g.save(); g.translate(bx, by); g.rotate(i / 24 * Math.PI * 2); g.fillStyle = i % 2 ? 'rgba(255,210,90,.10)' : 'rgba(255,255,255,.05)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(5.2 * TS, -0.55 * TS); g.lineTo(5.2 * TS, 0.55 * TS); g.fill(); g.restore(); }
    [[3.2, '#f2c23a'], [3.0, '#141030'], [2.6, '#d8302a'], [2.0, '#f6f0e0'], [1.4, '#d8302a'], [0.8, '#f6f0e0'], [0.35, '#f2c23a']].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.arc(bx, by, r * TS, 0, 7); g.fill(); });
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; [2.6, 2.0, 1.4, 0.8].forEach(r => { g.beginPath(); g.arc(bx, by, r * TS, 0, 7); g.stroke(); });
    const dc = ['#e8322a', '#f2c23a', '#f6f2e8', '#f2c23a'];
    // 9 불빛 띠(왼쪽 벽·오른쪽 벽·아치 안쪽)
    const band = (x0, y0, x1, y1) => {
      const L = Math.hypot(tx(x1) - tx(x0), ty(y1) - ty(y0)), ang = Math.atan2(ty(y1) - ty(y0), tx(x1) - tx(x0));
      g.save(); g.translate(tx(x0), ty(y0)); g.rotate(ang);
      g.fillStyle = '#1a1020'; g.fillRect(0, -10, L, 20);
      for (let s = 0; s < L; s += 26) { g.fillStyle = dc[(s / 26) % 4 | 0]; g.fillRect(s + 2, -8, 22, 16); g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(s + 13, 0, 3.5, 0, 7); g.fill(); }
      g.fillStyle = '#f2c23a'; g.fillRect(0, -11, L, 2.5); g.fillRect(0, 8.5, L, 2.5); g.restore();
    };
    band(0.42, 9.6, 0.42, 30); band(P.W - 0.42, 9.6, P.W - 0.42, 28.2);
    for (let i = 0; i < 26; i++) { const a0 = Math.PI * i / 26, a1 = Math.PI * (i + 1) / 26; band(10 + 9.58 * Math.cos(a0), 30 + 9.58 * Math.sin(a0), 10 + 9.58 * Math.cos(a1), 30 + 9.58 * Math.sin(a1)); }
    // 9-2 안내벽 아래(공이 못 가는 곳)는 검게, 벽 따라 불빛 띠
    [[[0, 9.8], [5.62, 5.86], [5.62, -2.5], [0, -2.5]], [[P.W, 9.8], [P.W - 5.62, 5.86], [P.W - 5.62, -2.5], [P.W, -2.5]]].forEach(poly => { g.beginPath(); poly.forEach((p, i) => i ? g.lineTo(tx(p[0]), ty(p[1])) : g.moveTo(tx(p[0]), ty(p[1]))); g.closePath(); g.fillStyle = 'rgba(6,3,14,.82)'; g.fill(); });
    band(0.2, 9.35, 5.3, 5.75); band(P.W - 0.2, 9.35, P.W - 5.3, 5.75);
    // 플리퍼 사이 은은한 빛
    gr = g.createRadialGradient(tx(P.CX), ty(5.5), 0, tx(P.CX), ty(5.5), 4.5 * TS); gr.addColorStop(0, 'rgba(80,220,255,.22)'); gr.addColorStop(1, 'rgba(80,220,255,0)'); g.fillStyle = gr; g.fillRect(0, ty(10), c.width, ty(1) - ty(10));
    // 10 위 레인 홈
    P.laneX.forEach(x => {
      g.fillStyle = 'rgba(0,0,0,.45)'; roundRect(g, tx(x - 0.62), ty(34.2), 1.24 * TS, 3.6 * TS, 18); g.fill();
      g.strokeStyle = 'rgba(255,210,90,.6)'; g.lineWidth = 2; g.stroke();
    });
    // 11 플리퍼 위 안쪽 화살표(인레인)
    [[2.6, 8.2, 0.62], [P.W - 2.6, 8.2, -0.62]].forEach(([x, y, a]) => { for (let k = 0; k < 3; k++) { g.save(); g.translate(tx(x + Math.sign(a) * k * 0.8), ty(y - k * 0.58)); g.rotate(Math.PI + a * 1.2); g.strokeStyle = `rgba(255,200,90,${0.7 - k * 0.18})`; g.lineWidth = 5; g.beginPath(); g.moveTo(-12, -6); g.lineTo(0, 6); g.lineTo(12, -6); g.stroke(); g.restore(); } });
    // 12 인서트 테두리
    Object.values(INS).forEach(v => (Array.isArray(v) ? v : [v]).forEach(o => insertBezel(g, o)));
    // 13 홀 둘레 금테와 과녁선
    g.save(); g.translate(tx(P.saucer.x), ty(P.saucer.y));
    gr = g.createRadialGradient(0, 0, 20, 0, 0, 62); gr.addColorStop(0, 'rgba(255,200,80,.45)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 62, 0, 7); g.fill();
    g.strokeStyle = '#f2c23a'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 50, 0, 7); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 58, 0, 7); g.stroke();
    g.restore();
    // 14 발사 통로(금속)
    gr = g.createLinearGradient(tx(P.W), 0, tx(20), 0); gr.addColorStop(0, '#1a1a26'); gr.addColorStop(0.5, '#4a4a60'); gr.addColorStop(1, '#14141c');
    g.fillStyle = gr; g.fillRect(tx(P.W), ty(30), tx(20) - tx(P.W), ty(0) - ty(30));
    // 15 아래 어둡게 + 가장자리
    gr = g.createLinearGradient(0, ty(6), 0, ty(-2.5)); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.7)'); g.fillStyle = gr; g.fillRect(0, ty(6), c.width, ty(-2.5) - ty(6));
    gr = g.createRadialGradient(c.width / 2, c.height * 0.5, c.width * 0.42, c.width / 2, c.height * 0.5, c.height * 0.6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
    // 16 인쇄 결: 아주 옅은 점
    { const id = g.getImageData(0, 0, c.width, c.height), d = id.data, Rn = rnd(99); for (let i = 0; i < d.length; i += 4) { const n = (Rn() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(id, 0, 0); }
    return tex(c);
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function woodTex() {
    const c = cv(1024, 128), g = c.getContext('2d'), R = rnd(5);
    const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#3a1c0c'); gr.addColorStop(0.5, '#4a2410'); gr.addColorStop(1, '#2a1206');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 128);
    for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${R() > 0.5 ? '20,8,2' : '110,60,24'},${0.2 + R() * 0.3})`; g.lineWidth = 0.8 + R() * 2; const y = R() * 128; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 4 * R()); g.stroke(); }
    return tex(c);
  }
  function apronTex(side) {
    const c = cv(512, 300), g = c.getContext('2d');
    let gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, '#2a1450'); gr.addColorStop(1, '#0c0618'); g.fillStyle = gr; g.fillRect(0, 0, 512, 300);
    // 불빛 띠
    const dc = ['#e8322a', '#f2c23a', '#f6f2e8', '#f2c23a'];
    for (let x = 0; x < 512; x += 32) { g.fillStyle = dc[(x / 32) % 4]; g.fillRect(x + 2, 6, 28, 22); g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(x + 16, 17, 4, 0, 7); g.fill(); }
    g.fillStyle = '#f2c23a'; g.fillRect(0, 2, 512, 4); g.fillRect(0, 28, 512, 4);
    // 구름 + 글자
    // 별 장식
    g.fillStyle = 'rgba(242,194,58,.35)'; [[60, 160], [452, 160], [90, 250], [422, 250]].forEach(([x, y]) => { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 22; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); });
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = "400 92px Ttl, 'Black Han Sans', sans-serif";
    g.lineWidth = 12; g.strokeStyle = '#12021e'; g.lineJoin = 'round';
    const t = side ? 'EXTRA BALL' : 'PINBALL';
    if (side) g.font = "400 64px Ttl, 'Black Han Sans', sans-serif";
    if (!side) g.font = "400 80px Ttl, 'Black Han Sans', sans-serif";
    g.strokeText(t, 256, 175); gr = g.createLinearGradient(0, 130, 0, 220); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(1, '#ffb020'); g.fillStyle = gr; g.fillText(t, 256, 175);
    g.strokeStyle = '#f2c23a'; g.lineWidth = 3; g.strokeRect(10, 40, 492, 250);
    return tex(c);
  }
  function backglassTex() {
    const c = cv(1024, 532), g = c.getContext('2d');
    let gr = g.createRadialGradient(512, 290, 20, 512, 290, 620); gr.addColorStop(0, '#3a1c8a'); gr.addColorStop(1, '#0c0626'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 532);
    for (let i = 0; i < 36; i++) { const a0 = i / 36 * Math.PI * 2; g.beginPath(); g.moveTo(512, 290); g.arc(512, 290, 700, a0, a0 + Math.PI / 36); g.closePath(); g.fillStyle = i % 2 ? 'rgba(255,170,40,.16)' : 'rgba(255,60,160,.10)'; g.fill(); }
    // 쇠구슬 셋
    [[190, 380, 70], [840, 360, 58], [700, 120, 36]].forEach(([x, y, r]) => { const q = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); q.addColorStop(0, '#ffffff'); q.addColorStop(0.45, '#b8bccc'); q.addColorStop(1, '#2a2a3a'); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const t1 = 'PINBALL';
    g.font = "400 150px Ttl, 'Black Han Sans', sans-serif";
    g.lineWidth = 26; g.strokeStyle = '#12021e'; g.strokeText(t1, 512, 280);
    gr = g.createLinearGradient(0, 170, 0, 390); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(0.5, '#ffc23a'); gr.addColorStop(1, '#ff6a10'); g.fillStyle = gr; g.fillText(t1, 512, 280);
    // 테두리 전구
    for (let x = 20; x < 1024; x += 40) { [12, 520].forEach(y => { g.fillStyle = (x / 40) % 2 ? '#fff2b0' : '#ff5a3a'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); }); }
    return tex(c);
  }
  function speakerTex() {
    const c = cv(1024, 128), g = c.getContext('2d');
    g.fillStyle = '#0c0b10'; g.fillRect(0, 0, 1024, 128);
    [180, 844].forEach(x => { for (let yy = 20; yy < 110; yy += 9) for (let xx = -90; xx < 90; xx += 9) if (xx * xx / 8100 + (yy - 64) * (yy - 64) / 2025 < 1) { g.fillStyle = '#2a2830'; g.beginPath(); g.arc(x + xx, yy, 2.6, 0, 7); g.fill(); } });
    g.fillStyle = '#ff8a1a'; g.globalAlpha = 0.12; g.fillRect(330, 30, 364, 68); g.globalAlpha = 1;
    return tex(c);
  }
  function sheenTex() {
    const c = cv(256, 512), g = c.getContext('2d');
    [[60, 0.05, 26], [170, 0.035, 40], [210, 0.03, 12]].forEach(([x, a, w]) => {
      const gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,250,240,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.save(); g.translate(x, 256); g.rotate(-0.18); g.fillRect(-w, -360, w * 2, 720); g.restore();
    });
    return tex(c);
  }
  function plasticTex(hue) {
    const c = cv(256, 256), g = c.getContext('2d');
    let gr = g.createLinearGradient(0, 256, 256, 0); gr.addColorStop(0, hue[0]); gr.addColorStop(1, hue[1]); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    // 불꽃 무늬
    g.fillStyle = 'rgba(255,240,160,.85)';
    for (let i = 0; i < 5; i++) { const x = 30 + i * 48; g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x - 18, 160, x + 6, 90 + (i % 2) * 40); g.quadraticCurveTo(x + 20, 170, x + 26, 256); g.fill(); }
    g.strokeStyle = '#12021e'; g.lineWidth = 10; g.strokeRect(0, 0, 256, 256);
    return tex(c);
  }
  function capTex(col) {
    const c = cv(256, 256), g = c.getContext('2d');
    const gr = g.createRadialGradient(100, 90, 8, 128, 128, 130); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, col); gr.addColorStop(1, '#1a0020');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
    g.fillStyle = '#fffaf0'; g.strokeStyle = '#1a0a20'; g.lineWidth = 6; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 30 : 72; g.lineTo(128 + Math.cos(a) * r, 132 + Math.sin(a) * r); } g.closePath(); g.stroke(); g.fill();
    return tex(c);
  }
  function textTex(txt, col, w, h, font) {
    const c = cv(w, h), g = c.getContext('2d'); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.85)'; g.lineJoin = 'round'; g.strokeText(txt, w / 2, h / 2 + 2); g.fillStyle = col; g.fillText(txt, w / 2, h / 2 + 2);
    return tex(c);
  }

  // ── 인서트(불빛 판) ──
  const inserts = [];
  function arrowGeo(s) {
    const sh = new T3.Shape(); sh.moveTo(0, s); sh.lineTo(s * 0.62, -s * 0.15); sh.lineTo(s * 0.25, -s * 0.15); sh.lineTo(s * 0.25, -s * 0.8); sh.lineTo(-s * 0.25, -s * 0.8); sh.lineTo(-s * 0.25, -s * 0.15); sh.lineTo(-s * 0.62, -s * 0.15); sh.closePath();
    return new T3.ShapeGeometry(sh);
  }
  function insert(o) {
    const geo = o.sh === 'c' ? new T3.CircleGeometry(o.r, 24) : arrowGeo(o.r);
    const mat = new T3.MeshBasicMaterial({ color: o.col, transparent: true, opacity: 0.95, depthWrite: false });
    const m = new T3.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.rotation.z = o.rot || 0; m.position.set(wx(o.x), 0.014, wz(o.y));
    scene.add(m);
    if (o.txt) { const t = new T3.Mesh(new T3.PlaneGeometry(o.r * 1.9, o.r * 1.9), new T3.MeshBasicMaterial({ map: textTex(o.txt, '#fff', 128, 128, "400 70px 'Black Han Sans', sans-serif"), transparent: true, depthWrite: false })); t.rotation.x = -Math.PI / 2; t.position.set(wx(o.x), 0.03, wz(o.y)); t.renderOrder = 2; scene.add(t); }
    const r = { m, col: new T3.Color(o.col), lit: 0, blink: 0, chase: o.chase || 0 }; inserts.push(r); return r;
  }
  function updateInsert(o, t) {
    let k = o.lit;
    if (o.chase) k = Math.max(k, (Math.floor(t * 8) + o.chase) % 3 === 0 ? 1 : 0);
    if (o.blink) k = (Math.sin(t * o.blink * 6.283) > 0) ? 1 : 0;
    o.m.material.color.copy(o.col).multiplyScalar(k > 0.5 ? 2.6 * k : 0.22);
  }

  // ── 불꽃 파티클 ──
  const NP = 600; let pts, pPos, pCol, pVel = new Float32Array(NP * 3), pLife = new Float32Array(NP), pi = 0;
  function sparks(x, y, h, col, n, sp) {
    const c = HDR(col, 2.2);
    for (let i = 0; i < n; i++) {
      const k = pi = (pi + 1) % NP;
      pPos[k * 3] = wx(x); pPos[k * 3 + 1] = h; pPos[k * 3 + 2] = wz(y);
      const a = Math.random() * Math.PI * 2, u = Math.random() * 0.9 + 0.2, s = (sp || 9) * (0.4 + Math.random() * 0.8);
      pVel[k * 3] = Math.cos(a) * s * u; pVel[k * 3 + 1] = (Math.random() * 0.8 + 0.4) * s * 0.9; pVel[k * 3 + 2] = Math.sin(a) * s * u;
      pLife[k] = 0.45 + Math.random() * 0.5;
      const w = Math.random() < 0.3 ? 3 : 0; pCol[k * 3] = w || c.r; pCol[k * 3 + 1] = w || c.g; pCol[k * 3 + 2] = w || c.b;
    }
  }
  function stepSparks(dt) {
    const f = Math.pow(0.12, dt);
    for (let k = 0; k < NP; k++) {
      if (pLife[k] <= 0) continue;
      pLife[k] -= dt; pVel[k * 3 + 1] -= 22 * dt;
      pPos[k * 3] += pVel[k * 3] * dt; pPos[k * 3 + 1] += pVel[k * 3 + 1] * dt; pPos[k * 3 + 2] += pVel[k * 3 + 2] * dt;
      if (pPos[k * 3 + 1] < 0.05) { pPos[k * 3 + 1] = 0.05; pVel[k * 3 + 1] *= -0.4; pVel[k * 3] *= 0.7; pVel[k * 3 + 2] *= 0.7; }
      if (pLife[k] <= 0) pPos[k * 3 + 1] = -50;
      pCol[k * 3] *= f; pCol[k * 3 + 1] *= f; pCol[k * 3 + 2] *= f;
    }
    pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
  }

  // ── 점수 글자 띄우기 ──
  const pops = [];
  function popText(x, y, txt, col, big) {
    const o = pops.find(p => p.life <= 0) || pops[0];
    const g = o.ctx; g.clearRect(0, 0, 512, 128);
    g.font = `400 ${big ? 86 : 62}px Ttl, "Black Han Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 12; g.strokeStyle = '#12021e'; g.lineJoin = 'round'; g.strokeText(txt, 256, 66);
    g.fillStyle = col || '#ffe44a'; g.fillText(txt, 256, 66);
    o.tex.needsUpdate = true; o.life = 1.1; o.sp.position.set(wx(x), 2.2, wz(y)); o.base = big ? 10 : 7; o.sp.visible = true;
  }

  // ── 빛 번짐(블룸) 후처리 ──
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function makeBloom() {
    if (!renderer.capabilities.isWebGL2) return null;
    const quad = new T3.Mesh(new T3.PlaneGeometry(2, 2)), qs = new T3.Scene(), qc = new T3.OrthographicCamera(-1, 1, 1, -1, 0, 1); quad.frustumCulled = false; qs.add(quad);
    const mk = (fs, u) => new T3.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false, toneMapped: false });
    const bright = mk('uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); float k = clamp((l - th) / max(l, 1e-4), 0.0, 1.0); gl_FragColor = vec4(c * k, 1.0); }', { t: { value: null }, th: { value: 1.3 } });
    const blur = mk('uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 s = texture2D(t, vUv).rgb * 0.227; s += (texture2D(t, vUv + d * 1.385).rgb + texture2D(t, vUv - d * 1.385).rgb) * 0.316; s += (texture2D(t, vUv + d * 3.23).rgb + texture2D(t, vUv - d * 3.23).rgb) * 0.070; gl_FragColor = vec4(s, 1.0); }', { t: { value: null }, d: { value: new T3.Vector2() } });
    const comp = new T3.ShaderMaterial({
      uniforms: { t: { value: null }, b0: { value: null }, b1: { value: null }, b2: { value: null }, b3: { value: null }, b4: { value: null }, k: { value: 0.55 } },
      vertexShader: VS, depthTest: false, depthWrite: false,
      fragmentShader: 'uniform sampler2D t, b0, b1, b2, b3, b4; uniform float k; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; vec3 b = texture2D(b0, vUv).rgb * 0.8 + texture2D(b1, vUv).rgb * 0.9 + texture2D(b2, vUv).rgb * 1.0 + texture2D(b3, vUv).rgb * 1.1 + texture2D(b4, vUv).rgb * 1.2; gl_FragColor = vec4(c + b * k * 0.5, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'
    });
    const opt = { type: T3.HalfFloatType, depthBuffer: false };
    const B = { main: null, br: null, h: [], v: [], quad, qs, qc, bright, blur, comp };
    B.resize = function () {
      const s = new T3.Vector2(); renderer.getDrawingBufferSize(s);
      [B.main, B.br, ...B.h, ...B.v].forEach(r => r && r.dispose());
      B.main = new T3.WebGLRenderTarget(s.x, s.y, { type: T3.HalfFloatType, samples: 4 });
      let w = Math.max(1, s.x >> 1), h = Math.max(1, s.y >> 1); B.br = new T3.WebGLRenderTarget(w, h, opt); B.h = []; B.v = [];
      for (let i = 0; i < 5; i++) { B.h.push(new T3.WebGLRenderTarget(w, h, opt)); B.v.push(new T3.WebGLRenderTarget(w, h, opt)); w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); }
    };
    const pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(qs, qc); };
    B.render = function () {
      renderer.setRenderTarget(B.main); renderer.render(scene, camera);
      bright.uniforms.t.value = B.main.texture; pass(bright, B.br);
      let src = B.br.texture;
      for (let i = 0; i < 5; i++) {
        const hh = B.h[i], vv = B.v[i];
        blur.uniforms.t.value = src; blur.uniforms.d.value.set(1 / hh.width, 0); pass(blur, hh);
        blur.uniforms.t.value = hh.texture; blur.uniforms.d.value.set(0, 1 / vv.height); pass(blur, vv);
        src = vv.texture;
      }
      comp.uniforms.t.value = B.main.texture; for (let i = 0; i < 5; i++) comp.uniforms['b' + i].value = B.v[i].texture;
      pass(comp, null);
    };
    return B;
  }

  // ── 만들기 ──
  S.build = function (canvas) {
    renderer = new T3.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = T3.SRGBColorSpace; renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T3.PCFSoftShadowMap;
    scene = new T3.Scene(); scene.background = new T3.Color(0x07060a);
    camera = new T3.PerspectiveCamera(38, 1, 0.5, 200);
    const pm = new T3.PMREMGenerator(renderer);
    { const es = new T3.Scene(); es.background = new T3.Color(0x0c0a10);
      const box = new T3.Mesh(new T3.BoxGeometry(80, 30, 80), new T3.MeshBasicMaterial({ color: 0x15121a, side: T3.BackSide })); box.position.y = 10; es.add(box);
      [[-10, 0], [10, 0], [0, -24], [0, 24]].forEach(([x, z]) => { const l = new T3.Mesh(new T3.PlaneGeometry(3, 16), new T3.MeshBasicMaterial({ color: new T3.Color(4.5, 4.4, 4.0) })); l.rotation.x = Math.PI / 2; l.position.set(x, 24, z); es.add(l); });
      const warm = new T3.Mesh(new T3.PlaneGeometry(22, 6), new T3.MeshBasicMaterial({ color: new T3.Color(2.4, 1.6, 0.9) })); warm.position.set(0, 8, -38); es.add(warm);
      const sign = new T3.Mesh(new T3.PlaneGeometry(10, 2), new T3.MeshBasicMaterial({ color: new T3.Color(2.2, 0.4, 1.2) })); sign.position.set(38, 10, 0); sign.rotation.y = -Math.PI / 2; es.add(sign);
      envTex = pm.fromScene(es, 0.02).texture; scene.environment = envTex; }
    S.glow = glowTex();

    // 빛: 위 형광등 + 따뜻한 판 조명
    scene.add(new T3.HemisphereLight(0xb8a890, 0x100a08, 0.35));
    scene.fog = new T3.Fog(0x07060a, 70, 140);
    // 백박스 밑 형광등이 판을 내려 비춤(그림자 담당)
    const top = new T3.SpotLight(0xfff2e0, 340, 90, 0.6, 0.85, 1.5); top.position.set(0, 24, wz(48)); top.target.position.set(0, 0, wz(12));
    top.castShadow = true; top.shadow.mapSize.set(1024, 1024); top.shadow.bias = -0.0006; top.shadow.radius = 3; top.shadow.camera.near = 8; top.shadow.camera.far = 70;
    scene.add(top, top.target); S.topL = top;
    const front = new T3.SpotLight(0xffe2c0, 700, 90, 0.6, 0.85, 1.5); front.position.set(0, 30, wz(-16)); front.target.position.set(0, 0, wz(16)); scene.add(front, front.target); S.frontL = front;
    // 옆에서 비추는 색 조명 둘(왼쪽 자홍·오른쪽 하늘): 캐비닛·크롬에 색이 돌게
    S.rim = [[-26, 0xff3ab0], [26, 0x2ae8ff]].map(([x, c]) => { const l = new T3.SpotLight(c, 170, 110, 0.7, 0.9, 1.3); l.position.set(x, 26, wz(16)); l.target.position.set(0, 0, wz(18)); scene.add(l, l.target); return l; });
    // 플라스틱 밑 전구(GI): 따뜻한 빛 셋, 개수 고정
    S.giL = [[3.2, 11.5], [P.W - 3.2, 11.5], [P.CX, 28]].map(([x, y], i) => { const l = new T3.PointLight(0xffc888, i === 2 ? 2.5 : 9, 11, 1.4); l.position.set(wx(x), 3.2, wz(y)); scene.add(l); return l; });
    S.flash = [new T3.PointLight(0xff3aa8, 0, 12, 1.6), new T3.PointLight(0x3ae8ff, 0, 12, 1.6)];
    S.flash.forEach(l => { l.position.set(0, 3, 0); scene.add(l); });

    // 판: 니스 칠한 광택(클리어코트)
    const pf = new T3.Mesh(new T3.PlaneGeometry(TW, TH), (() => { const pt = playfieldTex(); return new T3.MeshPhysicalMaterial({ map: pt, emissiveMap: pt, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.55, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 0.9 }); })());
    pf.rotation.x = -Math.PI / 2; pf.position.set(0, 0, wz((TY0 + TY1) / 2)); pf.receiveShadow = true; scene.add(pf);

    // 재질
    const chrome = new T3.MeshStandardMaterial({ color: 0xe8ecf4, metalness: 1, roughness: 0.1 });
    const steel = new T3.MeshStandardMaterial({ metalness: 1, color: 0xd0d4dc, roughness: 0.26, normalMap: ptex('steel_n', false, 6, 0.4), normalScale: new T3.Vector2(0.25, 0.25), envMapIntensity: 1.2 });
    const rubber = new T3.MeshStandardMaterial({ color: 0xff2a3a, roughness: 0.5, metalness: 0, emissive: 0x700012 });
    const rubberW = new T3.MeshStandardMaterial({ color: 0xf4f0f8, roughness: 0.6, metalness: 0 });
    const plastic = new T3.MeshStandardMaterial({ color: 0xf6f2ff, roughness: 0.22, metalness: 0, envMapIntensity: 0.9 });
    const woodT = ptex('cab_c', true, 4, 1);
    const wood = new T3.MeshStandardMaterial({ map: ptex('cab_c', true, 4, 1), normalMap: ptex('cab_n', false, 4, 1), metalness: 0, envMapIntensity: 0.12, color: 0x4a3430, roughness: 0.85 });   // 옆판: 거칠게(윗면이 조명을 되비쳐 회색 판으로 보이던 것 11/3)
    const ply = pbr('ply', 3, 1, { metalness: 0, envMapIntensity: 0.4 });
    S.mats = { chrome, rubber, plastic, wood, ply, steel }; S.scene = scene;

    // 바깥 둘레 나무 테 + 안쪽 크롬 레일
    const outer = [], inner = [];
    P.segs.forEach(s => {
      if (['gate', 'gate2', 'drop', 'stand', 'sling', 'slingside', 'apron'].includes(s.tag)) return;
      const isOuter = (s.ax === 0 && s.bx === 0) || (s.ax === 20 && s.bx === 20) || (s.tag === 'wall' && s.ay >= 29.9 && s.by >= 29.9 && Math.hypot(s.ax - 10, s.ay - 30) > 9.9);
      if (isOuter) outer.push(wallBox(s.ax, s.ay, s.bx, s.by, 1.4, 0.5));
      else inner.push(railGeo(s.ax, s.ay, s.bx, s.by, s.tag === 'guide' ? 0.75 : 0.95, 0.14));
    });
    const outerM = new T3.Mesh(merge(outer), ply); outerM.receiveShadow = true; scene.add(outerM);
    const innerM = new T3.Mesh(merge(inner), steel); innerM.castShadow = true; innerM.receiveShadow = true; scene.add(innerM);
    // 바깥 둘레 크롬 띠
    const capG = []; P.segs.forEach(s => { if ((s.ax === 0 && s.bx === 0) || (s.ax === 20 && s.bx === 20)) capG.push(wallBox(s.ax, s.ay, s.bx, s.by, 0.12, 0.62, 1.4)); });
    P.arcPts.forEach((p, i) => { if (i) capG.push(wallBox(P.arcPts[i - 1][0], P.arcPts[i - 1][1], p[0], p[1], 0.12, 0.62, 1.4)); });
    scene.add(new T3.Mesh(merge(capG), chrome));
    // 캐비닛 옆판(나무) + 크롬 손잡이 레일
    const side = []; side.push(wallBox(-1.25, -6, -1.25, 42, 2.4, 2.0, -0.9)); side.push(wallBox(21.25, -6, 21.25, 42, 2.4, 2.0, -0.9)); side.push(wallBox(-2.2, 41.6, 22.2, 41.6, 2.4, 1.2, -0.9));
    scene.add(new T3.Mesh(merge(side), wood));
    const rail = []; rail.push(wallBox(-0.6, -4.2, -0.6, 42, 0.22, 0.75, 1.5)); rail.push(wallBox(20.6, -4.2, 20.6, 42, 0.22, 0.75, 1.5));   // 좁은 크롬 레일, 옆판 윗면은 짙은 나무가 보이게(11/3)
    scene.add(new T3.Mesh(merge(rail), steel));
    // 앞 잠금 막대(lockdown bar) + 앞판
    scene.add(new T3.Mesh(wallBox(-2.4, -4.6, 22.4, -4.6, 0.55, 1.4, 1.5), steel));
    scene.add(new T3.Mesh(wallBox(-2.4, -4.4, 22.4, -4.4, 2.4, 1.0, -0.9), wood));
    // 백박스: 핀볼 제목이 불 들어온 유리
    { const bb = new T3.Group(); bb.position.set(0, 1.5, wz(43.6)); bb.rotation.x = -0.08; scene.add(bb);
      const shell = new T3.Mesh(new T3.BoxGeometry(24.4, 15, 3.4), wood); shell.position.y = 7.5; bb.add(shell);
      const bgT = backglassTex(); const glass = new T3.Mesh(new T3.PlaneGeometry(21.6, 11.2), new T3.MeshStandardMaterial({ map: bgT, emissiveMap: bgT, emissive: 0xffffff, emissiveIntensity: 1.45, roughness: 0.08 }));
      glass.position.set(0, 8.9, 1.72); bb.add(glass); S.backglass = glass;
      const frame = []; [[0, 14.6, 22.6, 0.5], [0, 3.2, 22.6, 0.5], [-11.05, 8.9, 0.5, 11.9], [11.05, 8.9, 0.5, 11.9]].forEach(([x, y, w, h]) => { const g = new T3.BoxGeometry(w, h, 0.4); g.translate(x, y, 1.75); frame.push(g); });
      bb.add(new T3.Mesh(merge(frame), steel));
      const spk = new T3.Mesh(new T3.PlaneGeometry(22, 2.6), new T3.MeshStandardMaterial({ map: speakerTex(), roughness: 0.6 })); spk.position.set(0, 1.5, 1.72); bb.add(spk); }

    // 램프: 앞은 투명 플라스틱 홈, 뒤는 크롬 철사 레일 + 받침 기둥
    const clearM = new T3.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.32, side: T3.DoubleSide, depthWrite: false, envMapIntensity: 1.6, clearcoat: 1 });
    const V = (p) => new T3.Vector3(wx(p[0]), p[2], wz(p[1]));
    S.rampMesh = P.ramps.map((r, ri) => {
      const grp = new T3.Group(); scene.add(grp);
      const pts = r.pts.map(V), n = pts.length, split = Math.floor(n * 0.5);
      const side = (i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; const t = b.clone().sub(a).normalize(); return new T3.Vector3().crossVectors(t, new T3.Vector3(0, 1, 0)).normalize(); };
      // 투명 홈(바닥 + 양벽)
      const pos = [], idx = [], W2 = 0.72, WH = 0.62;
      for (let i = 0; i <= split; i++) { const p = pts[i], sv = side(i); const prof = [[-W2, WH], [-W2, -0.08], [W2, -0.08], [W2, WH]]; prof.forEach(([u, v]) => pos.push(p.x + sv.x * u, p.y - 0.42 + v, p.z + sv.z * u)); }
      for (let i = 0; i < split; i++) for (let k = 0; k < 3; k++) { const a = i * 4 + k, b = a + 1, c = a + 4, d = a + 5; idx.push(a, c, b, b, c, d); }
      const tg = new T3.BufferGeometry(); tg.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); tg.setIndex(idx); tg.computeVertexNormals();
      const trough = new T3.Mesh(tg, clearM); trough.renderOrder = 4; grp.add(trough);
      // 홈 윗테(크롬 띠) 두 줄
      [-W2, W2].forEach(u => { const c = new T3.CatmullRomCurve3(pts.slice(0, split + 1).map((p, i) => { const sv = side(i); return new T3.Vector3(p.x + sv.x * u, p.y - 0.42 + WH, p.z + sv.z * u); })); grp.add(new T3.Mesh(new T3.TubeGeometry(c, split * 2, 0.06, 6), chrome)); });
      // 뒤쪽 철사 레일(네 가닥)
      [[-0.42, -0.36], [0.42, -0.36], [-0.5, 0.05], [0.5, 0.05]].forEach(([u, v]) => { const c = new T3.CatmullRomCurve3(pts.slice(split - 1).map((p, j) => { const i = j + split - 1, sv = side(i); return new T3.Vector3(p.x + sv.x * u, p.y + v, p.z + sv.z * u); })); const m = new T3.Mesh(new T3.TubeGeometry(c, (n - split) * 2, 0.05, 6), chrome); m.castShadow = true; grp.add(m); });
      // 받침 기둥
      for (let i = 6; i < n - 4; i += 9) { const p = pts[i]; if (p.y < 0.8) continue; const g = new T3.CylinderGeometry(0.07, 0.07, p.y - 0.3, 6); g.translate(p.x, (p.y - 0.3) / 2, p.z); grp.add(new T3.Mesh(g, chrome)); }
      // 입구 금속 날개
      const lip = new T3.Mesh(new T3.BoxGeometry(1.7, 0.06, 0.5), chrome); lip.position.set(wx(r.cx), 0.05, wz(r.top - 0.1)); grp.add(lip);
      return grp;
    });

    // 플라스틱 덮개 더(크롬 받침 기둥 위에 뜬 그림 판)
    const plas = [
      [[[16.3, 24.5], [18.3, 24.7], [18.4, 28.5], [17.0, 28.9]], ['#2a6aff', '#22e6ff']],
      [[[16.1, 19.5], [17.7, 20.0], [17.9, 23.4], [16.5, 23.2]], ['#2a9a48', '#c8ff5a']],
      [[[4.3, 30.4], [5.7, 30.4], [5.6, 34.2], [4.4, 34.2]], ['#ff2fa8', '#ffd23a']],
      [[[12.7, 30.4], [14.1, 30.4], [14.0, 34.2], [12.8, 34.2]], ['#ff2fa8', '#ffd23a']]
    ];
    plas.forEach(([pts, hue]) => {
      const pt = plasticTex(hue);
      const m = new T3.MeshStandardMaterial({ map: pt, emissiveMap: pt, emissive: 0xffffff, emissiveIntensity: 0.8, transparent: true, opacity: 0.9, roughness: 0.12, side: T3.DoubleSide, depthWrite: false });
      const pl = new T3.Mesh(flatShape(pts, 1.45), m); pl.renderOrder = 3; scene.add(pl);
      pts.forEach(q => { const g = new T3.CylinderGeometry(0.09, 0.09, 1.4, 8); g.translate(wx(q[0]), 0.7, wz(q[1])); scene.add(new T3.Mesh(g, chrome)); });
    });

    // 플래셔 돔(위 양쪽): 큰 일에 번쩍
    S.flashers = [[2.6, 35.2, 0xff3a2a], [16.6, 35.6, 0xffd23a]].map(([x, y, c]) => {
      const base = new T3.Mesh(new T3.CylinderGeometry(0.55, 0.6, 0.3, 20), new T3.MeshStandardMaterial({ color: 0x141018, roughness: 0.4 })); base.position.set(wx(x), 1.55, wz(y)); scene.add(base);
      const dm = new T3.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.15 });
      const dome = new T3.Mesh(new T3.SphereGeometry(0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), dm); dome.position.set(wx(x), 1.7, wz(y)); scene.add(dome);
      return { dm, x, y, c, t: 0 };
    });
    S.flasher = (i) => { const f = S.flashers[i]; f.t = 1; S.lightAt(i, f.x, f.y - 3, f.c, 120); };

    // 유리: 천장 등이 비치는 옅은 줄
    { const gl = new T3.Mesh(new T3.PlaneGeometry(20.6, 46), new T3.MeshBasicMaterial({ map: sheenTex(), transparent: true, opacity: 0.4, blending: T3.AdditiveBlending, depthWrite: false }));
      gl.rotation.x = -Math.PI / 2; gl.position.set(0, 4.2, wz(18.5)); gl.renderOrder = 8; scene.add(gl); S.glass = gl; }
    // 아치 바깥 구석 메우기
    const fillM = new T3.MeshStandardMaterial({ map: woodT, roughness: 0.6 });
    const cl = [[0, 30], [0, 40.6], [10, 40.6]].concat(P.arcPts.filter(p => p[0] < 10).sort((a, b) => b[0] - a[0]));
    const cr = cl.map(p => [20 - p[0], p[1]]).reverse();
    scene.add(new T3.Mesh(extrude(cl, 1.38, 0), fillM)); scene.add(new T3.Mesh(extrude(cr, 1.38, 0), fillM));

    S.neon = [];

    // 기둥(크롬) + 고무 링 + 기둥 밑 전구(GI)
    const postG = [], ringG = [], gi = [];
    P.circles.forEach(c => {
      if (c.tag !== 'post') return;
      postG.push(cyl(c.x, c.y, 0.16, 1.15)); const cp = new T3.SphereGeometry(0.2, 10, 8); cp.translate(wx(c.x), 1.15, wz(c.y)); postG.push(cp);
      const r = new T3.TorusGeometry(c.r - 0.04, 0.1, 8, 18); r.rotateX(Math.PI / 2); r.translate(wx(c.x), 0.42, wz(c.y)); ringG.push(r);
      gi.push(wx(c.x), 0.18, wz(c.y));
    });
    const postM = new T3.Mesh(merge(postG), chrome); postM.castShadow = true; scene.add(postM);
    scene.add(new T3.Mesh(merge(ringG), rubberW));
    const gg = new T3.BufferGeometry(); gg.setAttribute('position', new T3.Float32BufferAttribute(gi, 3));
    S.gi = new T3.Points(gg, new T3.PointsMaterial({ size: 1.6, map: S.glow, color: HDR(0xffd9a0, 0.7), transparent: true, opacity: 0.35, blending: T3.AdditiveBlending, depthWrite: false }));
    scene.add(S.gi);

    // 슬링샷: 흰 몸통 + 고무띠 + 위 플라스틱 덮개(불꽃 그림)
    S.slings = [P.slingL, P.slingR].map((sl, i) => {
      const pts = [sl.A, sl.B, sl.C]; const ptsW = i === 1 ? pts.slice().reverse() : pts;
      const body = new T3.Mesh(extrude(ptsW, 0.7, 0), plastic); body.castShadow = true; scene.add(body);
      const cxp = (sl.A[0] + sl.B[0] + sl.C[0]) / 3, cyp = (sl.A[1] + sl.B[1] + sl.C[1]) / 3;
      const lightM = new T3.MeshBasicMaterial({ color: HDR(0xffc040, 0.6) });
      const top = new T3.Mesh(extrude(grow(ptsW, 0.55), 0.02, 0.71), lightM); scene.add(top);
      // 고무띠: 세 기둥을 두르는 흰 고무
      const band = new T3.Mesh(merge([railGeo(sl.B[0], sl.B[1], sl.C[0], sl.C[1], 0.36, 0.11, 0.25), railGeo(sl.A[0], sl.A[1], sl.B[0], sl.B[1], 0.36, 0.11, 0.25), railGeo(sl.A[0], sl.A[1], sl.C[0], sl.C[1], 0.36, 0.11, 0.25)]), rubberW); scene.add(band);
      const ptex = plasticTex(i ? ['#ff2fa8', '#ff8a1a'] : ['#7a2aff', '#ff2fa8']);
      const plM = new T3.MeshStandardMaterial({ map: ptex, emissiveMap: ptex, emissive: 0xffffff, emissiveIntensity: 0.7, transparent: true, opacity: 0.88, roughness: 0.15, side: T3.DoubleSide, depthWrite: false });
      const pl = new T3.Mesh(flatShape(grow(ptsW, 1.18), 1.3), plM); pl.renderOrder = 3; scene.add(pl);
      return { top, band, plM, t: 0 };
    });

    // 범퍼: 검은 받침 + 별 치마 + 흰 몸통 + 크롬 링 + 빛나는 뚜껑
    const bcol = ['#ff2fa8', '#22e6ff', '#ffc23a'];
    S.bumpers = P.bumpers.map((b, i) => {
      const grp = new T3.Group(); grp.position.set(wx(b.x), 0, wz(b.y)); scene.add(grp);
      const col = new T3.Color(bcol[i]);
      const base = new T3.Mesh(new T3.CylinderGeometry(b.r * 1.0, b.r * 1.1, 0.22, 32), new T3.MeshStandardMaterial({ color: 0x14101c, roughness: 0.4 })); base.position.y = 0.11; grp.add(base);
      const star = new T3.Shape(); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, r = k % 2 ? b.r * 1.05 : b.r * 1.45; k ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const skM = new T3.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.1, transparent: true, opacity: 0.85, roughness: 0.2, side: T3.DoubleSide });
      const sk = new T3.Mesh(new T3.ShapeGeometry(star), skM); sk.rotation.x = -Math.PI / 2; sk.position.y = 0.24; grp.add(sk);
      const body = new T3.Mesh(new T3.CylinderGeometry(b.r * 0.8, b.r * 0.86, 0.85, 32), plastic); body.position.y = 0.66; body.castShadow = true; grp.add(body);
      const ring = new T3.Mesh(new T3.TorusGeometry(b.r * 0.95, 0.09, 8, 32), chrome); ring.rotation.x = Math.PI / 2; ring.position.y = 0.6; grp.add(ring);
      const ct = capTex(bcol[i]);
      const capM = new T3.MeshStandardMaterial({ map: ct, emissiveMap: ct, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.42, envMapIntensity: 0.8 });
      const cap = new T3.Mesh(new T3.CylinderGeometry(b.r * 1.02, b.r * 0.98, 0.26, 40), [new T3.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.0, roughness: 0.3 }), capM, capM]);
      cap.position.y = 1.22; cap.castShadow = true; grp.add(cap);
      return { grp, skM, ring, cap, capM, col, t: 0 };
    });

    // 드롭 타깃(노란 판 + 위 검은 띠)
    const dropM = new T3.MeshStandardMaterial({ color: 0xffd23a, roughness: 0.25, emissive: 0x5a3a00, emissiveIntensity: 0.7 });
    S.drops = P.drops.map(d => { const m = new T3.Mesh(new T3.BoxGeometry(0.22, 0.95, 0.95), dropM); m.position.set(wx(d.ax + 0.08), 0.48, wz((d.ay + d.by) / 2)); m.castShadow = true; scene.add(m); return { m, y: 0.48 }; });
    { const g = new T3.Mesh(new T3.BoxGeometry(0.5, 0.25, 4.9), new T3.MeshStandardMaterial({ color: 0x14101c, roughness: 0.5 })); g.position.set(wx(1.95), 0.12, wz(16.6)); scene.add(g); }
    // 스탠드업(빨간 판 + 흰 동그라미)
    const standM = new T3.MeshStandardMaterial({ color: 0xff2a3a, roughness: 0.3, emissive: 0x600010, emissiveIntensity: 0.9 });
    const dotM = new T3.MeshBasicMaterial({ color: 0xffffff });
    S.stands = P.stands.map(s => {
      const g = new T3.Group(); g.position.set(wx(s.ax - 0.1), 0, wz((s.ay + s.by) / 2)); scene.add(g);
      const m = new T3.Mesh(new T3.BoxGeometry(0.16, 0.9, 0.95), standM); m.position.y = 0.45; m.castShadow = true; g.add(m);
      const d = new T3.Mesh(new T3.CircleGeometry(0.26, 16), dotM); d.rotation.y = -Math.PI / 2; d.position.set(-0.09, 0.5, 0); g.add(d);
      return { g, d, t: 0 };
    });
    // 항아리 구멍
    const hole = new T3.Mesh(new T3.CircleGeometry(0.7, 28), new T3.MeshBasicMaterial({ color: 0x000000 })); hole.rotation.x = -Math.PI / 2; hole.position.set(wx(P.saucer.x), 0.016, wz(P.saucer.y)); scene.add(hole);
    const lip = new T3.Mesh(new T3.TorusGeometry(0.8, 0.13, 10, 32), chrome); lip.rotation.x = Math.PI / 2; lip.position.set(wx(P.saucer.x), 0.06, wz(P.saucer.y)); scene.add(lip);
    S.saucerRing = new T3.Mesh(new T3.TorusGeometry(1.05, 0.05, 6, 40), new T3.MeshBasicMaterial({ color: HDR(0x6affd8, 2) })); S.saucerRing.rotation.x = Math.PI / 2; S.saucerRing.position.set(wx(P.saucer.x), 0.03, wz(P.saucer.y)); scene.add(S.saucerRing);
    // 발사 통로 게이트
    const gt = P.gate; scene.add(new T3.Mesh(wallBox(gt.ax, gt.ay, gt.bx, gt.by, 0.08, 0.05, 0.85), chrome));
    { const g2 = P.gate2; scene.add(new T3.Mesh(wallBox(g2.ax, g2.ay, g2.bx, g2.by, 0.08, 0.05, 0.85), chrome)); const w = []; for (let k = 0; k <= 4; k++) { const u = k / 4; w.push(cyl(g2.ax + (g2.bx - g2.ax) * u, g2.ay + (g2.by - g2.ay) * u, 0.035, 0.85)); } scene.add(new T3.Mesh(merge(w), chrome)); }

    // 앞판(에이프런): 플리퍼 아래 양쪽
    [[0, 7.0, 0], [11.6, P.W, 1]].forEach(([x0, x1, sd]) => {
      const box = new T3.Mesh(wallBox(x0, -0.5, x1, -0.5, 0.32, 4.6, 0), new T3.MeshStandardMaterial({ color: 0x0c0618, roughness: 0.5 })); scene.add(box);
      const top = new T3.Mesh(flatShape([[x0, -2.8], [x1, -2.8], [x1, 1.8], [x0, 1.8]], 0.33), new T3.MeshStandardMaterial({ map: apronTex(sd), roughness: 0.35, metalness: 0.1, envMapIntensity: 0.6 })); scene.add(top);
      const trim = new T3.Mesh(railGeo(x0 + 0.1, 1.75, x1 - 0.1, 1.75, 0.1, 0.07, 0.33), chrome); scene.add(trim);
    });

    // 플리퍼
    S.flippers = P.flippers.map((f, i) => {
      const grp = new T3.Group(); grp.position.set(wx(f.px), 0, wz(f.py)); scene.add(grp);
      const hp = capsulePts(f.L, f.r0, f.r1, 0); const hr = capsulePts(f.L, f.r0, f.r1, 0.07);
      const mk = (pts, d, y0, m) => { const sh = new T3.Shape(pts.map(p => new T3.Vector2(p[0], p[1]))); const g = new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); const me = new T3.Mesh(g, m); me.castShadow = true; grp.add(me); return me; };
      mk(hr, 0.4, 0.12, rubber); mk(hp, 0.62, 0.06, plastic);
      const cap = new T3.Mesh(new T3.CylinderGeometry(0.22, 0.22, 0.1, 16), chrome); cap.position.y = 0.78; grp.add(cap);
      return grp;
    });

    // 발사 막대
    const pl = new T3.Group(); pl.position.set(wx(P.LANE_X), 0.5, wz(0.5)); scene.add(pl);
    const rod = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.16, 2.2, 10), chrome); rod.rotation.x = Math.PI / 2; rod.position.z = 1.1; pl.add(rod);
    const tip = new T3.Mesh(new T3.CylinderGeometry(0.42, 0.42, 0.3, 16), rubber); tip.rotation.x = Math.PI / 2; tip.position.z = 0.05; pl.add(tip);
    const spr = new T3.Mesh(new T3.TorusGeometry(0.3, 0.05, 4, 10), chrome); S.spring = [];
    for (let i = 0; i < 6; i++) { const s = spr.clone(); s.position.z = 0.4 + i * 0.28; pl.add(s); S.spring.push(s); }
    S.plunger = pl;

    // 인서트들
    S.ins = {};
    for (const k in INS) S.ins[k] = Array.isArray(INS[k]) ? INS[k].map(insert) : insert(INS[k]);
    S.laneTxt = ['P', 'I', 'N'].map((ch, i) => { const sp = new T3.Mesh(new T3.PlaneGeometry(1.0, 1.0), new T3.MeshBasicMaterial({ map: textTex(ch, '#fff', 128, 128, "400 92px 'Black Han Sans', sans-serif"), transparent: true, depthWrite: false })); sp.rotation.x = -Math.PI / 2; sp.position.set(wx(P.laneX[i]), 0.03, wz(30.1)); sp.renderOrder = 2; scene.add(sp); return sp; });
    { const t = new T3.Mesh(new T3.PlaneGeometry(2.6, 0.5), new T3.MeshBasicMaterial({ map: textTex('SHOOT AGAIN', '#bff6ff', 512, 100, "400 64px 'Black Han Sans', sans-serif"), transparent: true, depthWrite: false })); t.rotation.x = -Math.PI / 2; t.position.set(wx(P.CX), 0.03, wz(2.25)); scene.add(t); }

    // 황금 표적: 금 원통 위에 과녁 뚜껑, 둘레 불빛 링, 맞으면 번쩍
    const bg = new T3.Group(); bg.position.set(wx(P.boss.x), -3.6, wz(P.boss.y)); scene.add(bg);
    const face = new T3.Group(); bg.add(face);
    const goldM = new T3.MeshStandardMaterial({ color: 0xffc23a, roughness: 0.22, metalness: 0.9, emissive: 0xff8a10, emissiveIntensity: 0 });
    const drum = new T3.Mesh(new T3.CylinderGeometry(1.5, 1.6, 1.3, 48), goldM); drum.position.y = 0.65; drum.castShadow = true; face.add(drum);
    const bc = cv(256, 256), bgx = bc.getContext('2d');
    [[128, '#8a5a10'], [120, '#ffc23a'], [96, '#d8302a'], [70, '#fff4d8'], [44, '#d8302a'], [18, '#fff4d8']].forEach(([r, c]) => { bgx.fillStyle = c; bgx.beginPath(); bgx.arc(128, 128, r, 0, 7); bgx.fill(); });
    const bt = tex(bc);
    const headM = new T3.MeshStandardMaterial({ map: bt, emissiveMap: bt, emissive: 0xffffff, emissiveIntensity: 0.15, roughness: 0.2 });
    const lid = new T3.Mesh(new T3.CylinderGeometry(1.5, 1.5, 0.14, 48), [goldM, headM, goldM]); lid.position.y = 1.37; face.add(lid);
    const ringL = new T3.Mesh(new T3.TorusGeometry(1.62, 0.08, 8, 48), new T3.MeshBasicMaterial({ color: HDR(0xffd25a, 2.2) })); ringL.rotation.x = Math.PI / 2; ringL.position.y = 1.0; face.add(ringL);
    const bgl = new T3.Sprite(new T3.SpriteMaterial({ map: S.glow, color: 0xffb030, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 }));
    bgl.position.y = 1.2; bgl.scale.setScalar(8); bg.add(bgl);
    S.boss = { g: bg, head: face, headM, goldM, glow: bgl, y: -3.6, t: 0 };

    // 공
    // 공
    const ballM = new T3.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.07, envMap: pm.fromEquirectangular(envMap(true)).texture, envMapIntensity: 1.5 });
    S.ballGeo = new T3.SphereGeometry(P.BR, 32, 20); S.ballM = ballM; S.ballMeshes = [];
    S.trailGeo = new T3.BufferGeometry(); S.trailPos = new Float32Array(3 * 14 * 4); S.trailCol = new Float32Array(3 * 14 * 4);
    S.trailGeo.setAttribute('position', new T3.BufferAttribute(S.trailPos, 3)); S.trailGeo.setAttribute('color', new T3.BufferAttribute(S.trailCol, 3));
    S.trail = new T3.Points(S.trailGeo, new T3.PointsMaterial({ size: 1.1, map: S.glow, vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
    S.trail.frustumCulled = false; scene.add(S.trail);

    // 불꽃
    const pg = new T3.BufferGeometry(); pPos = new Float32Array(NP * 3).fill(-50); pCol = new Float32Array(NP * 3);
    pg.setAttribute('position', new T3.BufferAttribute(pPos, 3)); pg.setAttribute('color', new T3.BufferAttribute(pCol, 3));
    pts = new T3.Points(pg, new T3.PointsMaterial({ size: 0.38, map: S.glow, vertexColors: true, transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
    pts.frustumCulled = false; scene.add(pts);
    // 점수 글자
    for (let i = 0; i < 10; i++) {
      const c = cv(512, 128), t = tex(c);
      const sp = new T3.Sprite(new T3.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false })); sp.visible = false; sp.renderOrder = 10; scene.add(sp);
      pops.push({ sp, ctx: c.getContext('2d'), tex: t, life: 0, base: 5 });
    }
    // 화면 번쩍(카메라 앞 판)
    S.flashPlane = new T3.Mesh(new T3.PlaneGeometry(4, 4), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: T3.AdditiveBlending }));
    S.flashPlane.position.z = -1.2; S.flashPlane.renderOrder = 20; camera.add(S.flashPlane); scene.add(camera);

    // ── 반짝반짝(11/3): LED 띠·크롬 글린트·글리터·백박스 전구 ──
    S.spark = sparkleTex();
    const mkPts = (arr, size, map, opacity) => { const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(arr.map(a => a.p).flat(), 3)); g.setAttribute('color', new T3.Float32BufferAttribute(new Array(arr.length * 3).fill(0), 3)); const m = new T3.Points(g, new T3.PointsMaterial({ size, map, vertexColors: true, transparent: true, opacity: opacity || 1, blending: T3.AdditiveBlending, depthWrite: false })); m.frustumCulled = false; scene.add(m); return { m, arr, col: g.attributes.color }; };
    // LED 띠: 양 옆 벽·아치·안내벽 따라 작은 전구(판에 인쇄된 불빛 띠 위), 색이 돌며 달린다
    { const led = []; const line = (x0, y0, x1, y1, step) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step)); for (let i = 0; i <= n; i++) { const u = i / n; led.push({ p: [wx(x0 + (x1 - x0) * u), 0.26, wz(y0 + (y1 - y0) * u)], k: led.length }); } };
      line(0.42, 9.6, 0.42, 30, 0.9); line(P.W - 0.42, 9.6, P.W - 0.42, 28.2, 0.9);
      for (let i = 0; i <= 30; i++) { const a = Math.PI * i / 30; led.push({ p: [wx(10 + 9.58 * Math.cos(a)), 0.26, wz(30 + 9.58 * Math.sin(a))], k: led.length }); }
      line(0.2, 9.35, 5.3, 5.75, 0.9); line(P.W - 0.2, 9.35, P.W - 5.3, 5.75, 0.9);
      S.led = mkPts(led, 0.72, S.glow, 0.95); S.ledCols = [new T3.Color(0xff3ab0), new T3.Color(0xffd23a), new T3.Color(0x2ae8ff), new T3.Color(0xffffff)]; }
    // 크롬 글린트: 기둥 머리·범퍼 링·플리퍼 끝·램프 레일·홀 테에 네 갈래 별이 번갈아 반짝
    { const gl = []; P.circles.forEach(c => { if (c.tag === 'post') gl.push({ p: [wx(c.x) - 0.08, 1.32, wz(c.y) - 0.06], s: Math.random() * 6.28, f: 0.7 + Math.random() * 0.9 }); });
      P.bumpers.forEach(b => { for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; gl.push({ p: [wx(b.x) + Math.cos(a) * b.r * 0.95, 0.75, wz(b.y) + Math.sin(a) * b.r * 0.95], s: Math.random() * 6.28, f: 0.8 + Math.random() }); } });
      P.ramps.forEach(r => { for (let i = 2; i < r.pts.length - 2; i += 5) { const q = r.pts[i]; gl.push({ p: [wx(q[0]), q[2] + 0.3, wz(q[1])], s: Math.random() * 6.28, f: 0.6 + Math.random() * 0.8 }); } });
      [[P.saucer.x - 0.6, 0.2, P.saucer.y + 0.5], [P.saucer.x + 0.7, 0.2, P.saucer.y - 0.3]].forEach(q => gl.push({ p: [wx(q[0]), q[1], wz(q[2])], s: Math.random() * 6.28, f: 1 }));
      S.glints = mkPts(gl, 1.6, S.spark, 1); }
    // 글리터: 판 위에 흩뿌린 작은 반짝이(니스 속 펄 가루처럼 드문드문 빛남)
    { const R = rnd(31), gt = []; for (let i = 0; i < 260; i++) { const x = 0.6 + R() * (P.W - 1.2), y = -2 + R() * 41; gt.push({ p: [wx(x), 0.05, wz(y)], s: R() * 6.28, f: 1.5 + R() * 3 }); } S.glitter = mkPts(gt, 0.34, S.spark, 0.85); }
    // 백박스 테두리 전구(진짜 돌아가는 마키 불빛)
    { const mq = []; const bbz = wz(43.6), bbY = 1.5; for (let i = 0; i <= 22; i++) { const x = -10.6 + i * 21.2 / 22; mq.push({ p: [x, bbY + 3.5, bbz + 1.9], k: i }); mq.push({ p: [x, bbY + 14.3, bbz + 1.9], k: i + 1 }); } for (let i = 1; i < 10; i++) { const y = bbY + 3.5 + i * 10.8 / 10; mq.push({ p: [-10.9, y, bbz + 1.9], k: i + 3 }); mq.push({ p: [10.9, y, bbz + 1.9], k: i + 5 }); }
      S.marquee = mkPts(mq, 0.7, S.glow, 1); }
    // 공 반짝임(별 스프라이트)
    S.ballGlint = [];
    S.glintFor = (i) => { while (S.ballGlint.length <= i) { const sp = new T3.Sprite(new T3.SpriteMaterial({ map: S.spark, color: 0xffffff, blending: T3.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 })); sp.scale.setScalar(0.9); sp.visible = false; scene.add(sp); S.ballGlint.push(sp); } return S.ballGlint[i]; };
    bloom = makeBloom();
    S.resize(); window.addEventListener('resize', S.resize);
  };

  // ── 카메라 맞추기 ──
  let shake = 0, flashA = 0, flashCol = new T3.Color(1, 1, 1), camMode = 'play', titleT = 0;
  const camDir = new T3.Vector3(0, 1.32, 1).normalize();
  function pitch(a) { const e = a < 0.56 ? 58 : a < 0.66 ? 54 : a < 0.9 ? 48 : 40; camDir.set(0, Math.sin(e * Math.PI / 180), Math.cos(e * Math.PI / 180)); }
  let fit = { dist: 60, tgt: new T3.Vector3(0, 0, 0) };
  S.topInset = 0;
  S.resize = function () {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (bloom) bloom.resize();
    const corners = [[-0.6, -4.8, 2.0], [20.6, -4.8, 2.0], [-0.6, 40.8, 3.2], [20.6, 40.8, 3.2], [-0.6, 40.8, 0], [20.6, -4.8, 0]].map(c => new T3.Vector3(wx(c[0]), c[2], wz(c[1])));
    pitch(w / Math.max(1, h - S.topInset));
    const topN = 1 - 2 * (S.topInset / h) - 0.02, botN = -0.985, sideN = 0.97;
    let tgt = new T3.Vector3(0, 0, wz(18.5)), dist = 40;
    for (let it = 0; it < 40; it++) {
      camera.position.copy(tgt).addScaledVector(camDir, dist); camera.lookAt(tgt); camera.updateMatrixWorld();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      corners.forEach(c => { const p = c.clone().project(camera); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
      const sx = (x1 - x0) / (2 * sideN), sy = (y1 - y0) / (topN - botN);
      dist *= Math.max(sx, sy) * 0.5 + 0.5;
      const off = ((y1 + y0) / 2) - ((topN + botN) / 2);
      tgt.z -= off * dist * 0.18;
    }
    fit.dist = dist; fit.tgt.copy(tgt);
  };
  S.setTop = px => { S.topInset = px; S.resize(); };

  S.shake = a => { shake = Math.max(shake, a); };
  S.flashScreen = (a, col) => { flashA = Math.max(flashA, a); flashCol.set(col || 0xffffff); };
  S.camMode = m => { camMode = m; };
  S.sparks = sparks; S.pop = popText;
  S.lightAt = (i, x, y, col, k) => { const l = S.flash[i]; l.position.set(wx(x), 2.2, wz(y)); l.color.set(col); l.intensity = Math.max(l.intensity, k || 60); };
  S.inserts = inserts;

  // ── 매 프레임 ──
  const tmpV = new T3.Vector3();
  S.render = function (dt, t, st) {
    // 공
    while (S.ballMeshes.length < P.balls.length) { const m = new T3.Mesh(S.ballGeo, S.ballM); m.castShadow = true; scene.add(m); S.ballMeshes.push(m); }
    S.ballMeshes.forEach((m, i) => { const b = P.balls[i]; m.visible = !!b; if (b) { m.position.set(wx(b.x), P.BR + (b.cap ? -0.45 : 0) + (b.h || 0), wz(b.y)); m.rotation.x -= b.vy * dt * 2; m.rotation.z -= b.vx * dt * 2; } });
    // 꼬리
    let ti = 0;
    P.balls.forEach(b => {
      b.trail.unshift(wx(b.x), wz(b.y)); if (b.trail.length > 28) b.trail.length = 28;
      const sp = Math.hypot(b.vx, b.vy), k = Math.min(1, Math.max(0, (sp - 14) / 30));
      for (let j = 0; j < 14 && ti < 56; j++, ti++) {
        const x = b.trail[j * 2], z = b.trail[j * 2 + 1];
        S.trailPos[ti * 3] = x === undefined ? 0 : x; S.trailPos[ti * 3 + 1] = x === undefined ? -50 : 0.5; S.trailPos[ti * 3 + 2] = z || 0;
        const f = k * (1 - j / 14); S.trailCol[ti * 3] = 0.5 * f; S.trailCol[ti * 3 + 1] = 1.1 * f; S.trailCol[ti * 3 + 2] = 1.6 * f;
      }
    });
    for (; ti < 56; ti++) S.trailPos[ti * 3 + 1] = -50;
    S.trailGeo.attributes.position.needsUpdate = true; S.trailGeo.attributes.color.needsUpdate = true;
    // 플리퍼
    S.flippers.forEach((g, i) => g.rotation.y = P.flippers[i].a);
    // 발사 막대
    const pc = st.charge || 0; S.plunger.position.z = wz(0.5) + pc * 1.3; S.spring.forEach((s, i) => s.position.z = 0.4 + i * 0.28 * (1 - pc * 0.55));
    // 범퍼
    S.bumpers.forEach(b => { b.t = Math.max(0, b.t - dt * 4); const k = b.t; b.skM.emissiveIntensity = 0.6 + Math.sin(t * 3 + b.grp.position.x) * 0.2 + k * 4; b.capM.emissiveIntensity = 0.5 + k * 2.5; b.ring.position.y = 0.6 - k * 0.32; b.cap.scale.setScalar(1 + k * 0.06); });
    S.slings.forEach(s => { s.t = Math.max(0, s.t - dt * 5); s.top.material.color.copy(HDR(0xffc040, 0.6 + s.t * 3)); s.plM.emissiveIntensity = 0.35 + s.t * 1.5; });
    S.drops.forEach((d, i) => { const want = P.drops[i].on ? 0.48 : -0.6; d.m.position.y += (want - d.m.position.y) * Math.min(1, dt * 18); });
    S.stands.forEach(s => { s.t = Math.max(0, s.t - dt * 4); s.g.position.x = wx(P.W - 0.22) + s.t * 0.2; });
    // 대왕
    const B = S.boss, bw = P.boss.on ? 0 : -3.8; B.y += (bw - B.y) * Math.min(1, dt * 3); B.g.position.y = B.y; B.g.position.x = wx(P.boss.x);
    B.t = Math.max(0, B.t - dt * 3); B.headM.emissiveIntensity = 0.15 + B.t * 2.5; B.goldM.emissiveIntensity = B.t * 1.2; B.head.rotation.y = t * 1.5; B.head.scale.setScalar(1 + B.t * 0.1); B.glow.material.opacity = P.boss.on ? 0.35 + 0.25 * Math.sin(t * 4) + B.t : 0;
    // 인서트·항아리·네온·GI
    inserts.forEach(o => updateInsert(o, t));
    S.saucerRing.material.color.copy(HDR(0x6affd8, 1.2 + Math.sin(t * 5) * 0.8));
    const nk = 2.4 + Math.sin(t * 2.2) * 0.7 + (st.neonBoost || 0) * 2;
    S.giL.forEach((l, i) => l.intensity = (i === 2 ? 2.5 : 9) * (0.9 + (st.neonBoost || 0) * 0.6) * (P.boss.on ? 0.75 : 1));
    S.gi.material.opacity = 0.32 + (st.neonBoost || 0) * 0.25;
    S.flash.forEach(l => l.intensity *= Math.pow(0.02, dt));
    S.flashers.forEach(f => { f.t = Math.max(0, f.t - dt * 3); f.dm.emissiveIntensity = 0.6 + Math.sin(t * 2.5) * 0.25 + f.t * 6; });
    if (st.mode === 'title') inserts.forEach((o, i) => { o.lit = (Math.floor(t * 6) + i) % 5 === 0 ? 1 : 0; o.blink = 0; });
    stepSparks(dt);
    pops.forEach(p => { if (p.life <= 0) return; p.life -= dt; const u = 1 - p.life / 1.1; p.sp.position.y += dt * 2.2; const s = p.base * (u < 0.12 ? u / 0.12 * 1.2 : 1.2 - Math.min(0.2, (u - 0.12) * 2)); p.sp.scale.set(s, s / 4, 1); p.sp.material.opacity = p.life < 0.3 ? p.life / 0.3 : 1; if (p.life <= 0) p.sp.visible = false; });

    // 반짝반짝 갱신
    if (S.led) { const c = S.led.col.array, n = S.led.arr.length; for (let i = 0; i < n; i++) { const ph = (t * 3.2 - i * 0.45), w = 0.5 + 0.5 * Math.sin(ph); const base = S.ledCols[(Math.floor(t * 0.4) + Math.floor(i / 7)) % S.ledCols.length]; const k = 0.6 + 2.4 * w * w; c[i * 3] = base.r * k; c[i * 3 + 1] = base.g * k; c[i * 3 + 2] = base.b * k; } S.led.col.needsUpdate = true; }
    if (S.glints) { const c = S.glints.col.array; S.glints.arr.forEach((g, i) => { const w = Math.max(0, Math.sin(t * g.f * 2.0 + g.s)); const k = w > 0.8 ? (w - 0.8) / 0.2 * 3.6 : 0; c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = k; }); S.glints.col.needsUpdate = true; }
    if (S.glitter) { const c = S.glitter.col.array; S.glitter.arr.forEach((g, i) => { const w = Math.sin(t * g.f + g.s); const k = w > 0.93 ? (w - 0.93) / 0.07 * 2.4 : 0; c[i * 3] = k; c[i * 3 + 1] = k * 0.97; c[i * 3 + 2] = k * 0.9; }); S.glitter.col.needsUpdate = true; }
    if (S.marquee) { const c = S.marquee.col.array; S.marquee.arr.forEach((g, i) => { const on = (Math.floor(t * 6) + g.k) % 3 === 0; const col = g.k % 2 ? [2.6, 2.3, 1.4] : [2.8, 0.9, 0.5]; const k = on ? 1 : 0.18; c[i * 3] = col[0] * k; c[i * 3 + 1] = col[1] * k; c[i * 3 + 2] = col[2] * k; }); S.marquee.col.needsUpdate = true; }
    S.ballMeshes.forEach((m, i) => { const sp = S.glintFor(i); sp.visible = m.visible; if (m.visible) { sp.position.copy(m.position); sp.position.x -= 0.16; sp.position.y += 0.42; sp.position.z -= 0.14; const w = 0.75 + 0.25 * Math.sin(t * 9 + i); sp.scale.setScalar(0.8 * w); sp.material.opacity = 0.55 + 0.4 * w; } });
    for (let i = S.ballMeshes.length; i < S.ballGlint.length; i++) S.ballGlint[i].visible = false;

    // 카메라
    shake = Math.max(0, shake - dt * 2.2);
    let tgt = tmpV.copy(fit.tgt), dist = fit.dist;
    if (camMode === 'title') { titleT += dt; camera.position.copy(tgt).addScaledVector(camDir, dist); camera.position.x += Math.sin(titleT * 0.25) * 2.2; camera.position.y += Math.sin(titleT * 0.17) * 0.8; camera.lookAt(tgt); }
    else { camera.position.copy(tgt).addScaledVector(camDir, dist); camera.lookAt(tgt); }
    if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.9; camera.position.y += (Math.random() - 0.5) * shake * 0.6; }
    flashA = Math.max(0, flashA - dt * 3); S.flashPlane.material.opacity = flashA; S.flashPlane.material.color.copy(flashCol);
    if (bloom) bloom.render(); else renderer.render(scene, camera);
  };
  S.neonBase = [new T3.Color(0xff3ab0), new T3.Color(0x2ae8ff)];
  S.clearPops = () => pops.forEach(p => { p.life = 0; p.sp.visible = false; });
  S.hitBumper = i => { S.bumpers[i].t = 1; };
  S.hitSling = i => { S.slings[i].t = 1; };
  S.hitStand = i => { S.stands[i].t = 1; };
  S.hitBoss = () => { S.boss.t = 1; };
  S.neonColor = (a, b) => { S.neonBase[0].set(a); S.neonBase[1].set(b); };
  S.canvas = () => renderer.domElement;
  S.info = () => renderer.info.render;
  S.compile = () => renderer.compile(scene, camera);
  window.SCENE = S;
})();
