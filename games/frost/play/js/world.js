// world.js — 마을 통나무집·나무 교회·장터·두레박·울타리·건초더미·황새 둥지 기둥·늪 널길·모닥불·미르 성
(function () {
  const rnd = U.mulberry(1250);
  const Z = TER.Z;
  const lists = {};
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3(), _n = new THREE.Vector3(), _e = new THREE.Euler();
  const NESTS = [];    // 황새 둥지 자리 {x,y,z}
  const STUMPS = [];   // 그루터기 (뽕나무버섯 자리)
  let TOWER = null;    // 망루 전망대 (play.js 가 사다리로 쓴다)
  const WELLS = [], LOGS = [], HIVES = [];   // 물·장작·꿀 가져오는 자리
  const SIGNS = [];
  const NPCSPOT = {};
  let glassMat = null, winInMat = null, fireGroup = null, lampLights = [];

  // 세계 좌표로 옮기고, 면 방향에 맞춰 UV 를 m 단위로 준다
  function put(key, g, color, x, y, z, ry, uvScale) {
    if (g.index) g = g.toNonIndexed();
    _q.setFromAxisAngle(_n.set(0, 1, 0), ry || 0);
    _m.compose(_p.set(x, y, z), _q, _s);
    g.applyMatrix4(_m);
    const pos = g.attributes.position, nor = g.attributes.normal;
    const uv = new Float32Array(pos.count * 2), k = 1 / (uvScale || 2);
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
      const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
      let u, v;
      if (ny > 0.6) { u = px; v = pz; }
      else if (nx > 0.6) { u = pz; v = py; }
      else if (Math.abs(nor.getZ(i)) > 0.6) { u = px; v = py; }
      else { u = (px + pz) * 0.707; v = py; }   // 비스듬한 면(지붕)
      uv[i * 2] = u * k; uv[i * 2 + 1] = v * k;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g = GEO.tint(g, color == null ? 0xffffff : color);
    // 가까운 것끼리 한 덩어리 (화면 밖 덩어리는 안 그린다)
    const cell = Math.floor((x + 460) / 70) + ',' + Math.floor((z + 460) / 70);
    const lk = key + '|' + cell;
    (lists[lk] || (lists[lk] = [])).push(g);
    return g;
  }
  // 집 안 좌표(로컬) → 세계 좌표 도우미
  function local(ox, oz, ry) {
    const c = Math.cos(ry), s = Math.sin(ry);
    return (lx, lz) => [ox + lx * c + lz * s, oz - lx * s + lz * c];
  }

  // ── 질감 ──
  function logTex() {
    const c = GEO.canvas(256), g = c.getContext('2d');
    const r = U.mulberry(3);
    for (let i = 0; i < 8; i++) {   // 통나무 8줄
      const y = i * 32;
      const gr = g.createLinearGradient(0, y, 0, y + 32);
      gr.addColorStop(0, '#6e6e6e'); gr.addColorStop(0.25, '#d8d8d8'); gr.addColorStop(0.6, '#bcbcbc'); gr.addColorStop(0.95, '#4a4a4a'); gr.addColorStop(1, '#2a2a2a');
      g.fillStyle = gr; g.fillRect(0, y, 256, 32);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.18})`; g.fillRect(r() * 256, y + 6 + r() * 20, 10 + r() * 50, 1); }
      g.fillStyle = 'rgba(40,40,40,.6)'; g.fillRect(0, y + 30, 256, 2);   // 이끼 줄눈
    }
    return GEO.tex(c, true);
  }
  function roofTex() {
    const c = GEO.canvas(256), g = c.getContext('2d');
    g.fillStyle = '#bdbdbd'; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 16) {   // 골함석 골
      const gr = g.createLinearGradient(x, 0, x + 16, 0);
      gr.addColorStop(0, '#8a8a8a'); gr.addColorStop(0.5, '#e6e6e6'); gr.addColorStop(1, '#8a8a8a');
      g.fillStyle = gr; g.fillRect(x, 0, 16, 256);
    }
    const r = U.mulberry(9);
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(120,70,40,${r() * 0.25})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, 4 + r() * 18, 2 + r() * 8, 0, 0, 7); g.fill(); }
    return GEO.tex(c, true);
  }
  function brickTex() {
    const c = GEO.canvas(256), g = c.getContext('2d');
    g.fillStyle = '#9a8f86'; g.fillRect(0, 0, 256, 256);
    const r = U.mulberry(11);
    for (let row = 0; row < 16; row++) {
      for (let col = -1; col < 9; col++) {
        const x = col * 32 + (row % 2) * 16, y = row * 16;
        const t = 0.8 + r() * 0.35;
        g.fillStyle = `rgb(${160 * t | 0},${62 * t | 0},${44 * t | 0})`;
        g.fillRect(x + 1, y + 1, 30, 14);
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 1, y + 1, 30, 3);
      }
    }
    return GEO.tex(c, true);
  }
  function stoneTex() {
    const c = GEO.canvas(256), g = c.getContext('2d');
    g.fillStyle = '#cfc8b8'; g.fillRect(0, 0, 256, 256);
    const r = U.mulberry(21);
    for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${90 + r() * 60},${90 + r() * 50},${80 + r() * 40},${r() * 0.2})`; g.fillRect(r() * 256, r() * 256, 2 + r() * 8, 2 + r() * 8); }
    g.strokeStyle = 'rgba(80,70,60,.4)';
    for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    return GEO.tex(c, true);
  }
  function plankTex() {
    const c = GEO.canvas(256), g = c.getContext('2d');
    const r = U.mulberry(31);
    for (let i = 0; i < 8; i++) {
      const t = 0.75 + r() * 0.3;
      g.fillStyle = `rgb(${200 * t | 0},${200 * t | 0},${200 * t | 0})`; g.fillRect(i * 32, 0, 32, 256);
      for (let k = 0; k < 20; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(i * 32 + r() * 30, r() * 256, 1, 20 + r() * 80); }
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(i * 32, 0, 2, 256);
    }
    return GEO.tex(c, true);
  }

  // ── 도형 조각 ──
  function prism(w, h, d) {   // 박공 삼각 벽: 밑변 w, 높이 h, 두께 d (가운데 원점, 밑면 y=0)
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.lineTo(-w / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    return g;
  }
  function kokoshnik(w, h, d) {   // 창틀 위 조각 장식
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h * 0.35);
    s.quadraticCurveTo(w * 0.32, h * 0.4, w * 0.22, h * 0.7);
    s.quadraticCurveTo(w * 0.1, h * 0.9, 0, h);
    s.quadraticCurveTo(-w * 0.1, h * 0.9, -w * 0.22, h * 0.7);
    s.quadraticCurveTo(-w * 0.32, h * 0.4, -w / 2, h * 0.35);
    s.lineTo(-w / 2, 0);
    const hole = new THREE.Path();
    hole.absarc(0, h * 0.5, h * 0.14, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 6 });
    g.translate(0, 0, -d / 2);
    return g;
  }
  function onion(r, h) {   // 양파 지붕
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const rr = r * (Math.sin(t * Math.PI * 0.95 + 0.05) * (1 - t * 0.35)) * (t < 0.55 ? 1 + t * 0.4 : 1);
      pts.push(new THREE.Vector2(Math.max(0.02, rr * (1 - Math.pow(t, 3))), t * h));
    }
    return new THREE.LatheGeometry(pts, 14);
  }

  // ── 통나무집 ──
  const PAINT = [0xffffff, 0xffffff, 0x6f94c8, 0x7fae86, 0xe0c060, 0xffffff, 0x9fb8d8];
  const ROOFC = [0x7a8088, 0x5f7d5a, 0x8a4a3a, 0x6a7a8a, 0x4d6a8a];
  // 통나무집 — 속이 빈 집: 문으로 걸어 들어간다 (사장님 2026-09-17 "들어갈 수 있는 곳은 없냐")
  const HOUSES = [], QHOUSES = [], HOME = { h: null };
  function house(x, z, ry, w, d, opt) {
    opt = opt || {};
    const y = TER.H(x, z) - 0.25;
    const L = local(x, z, ry);
    const wh = 2.9, T0 = 0.45, TH = 0.2;          // 벽 높이, 바닥 높이, 벽 두께
    const paint = opt.paint != null ? opt.paint : PAINT[(rnd() * PAINT.length) | 0];
    const logCol = paint === 0xffffff ? 0x8a6a4a : paint;
    const inCol = 0xb89068;                         // 안쪽 벽 나무색
    // 로컬 좌표로 놓는 도우미
    const at = (key, g, col, lx, ly, lz, rot, uv) => { const [wx, wz] = L(lx, lz); return put(key, g, col, wx, y + ly, wz, ry + (rot || 0), uv); };
    const colL = (lx, lz, hw, hd, y0, y1, top) => { const [wx, wz] = L(lx, lz); const o = COL.box(wx, wz, hw, hd, -ry, y + y0, y + y1); if (top) o.top = true; return o; };
    // 주춧돌·마루·천장
    put('stone', GEO.box(w + 0.3, 0.7, d + 0.3, 0, 0.1, 0), 0x9a948a, x, y, z, ry);
    at('plank', GEO.box(w - 0.3, 0.08, d - 0.3), 0x9a7650, 0, T0 + 0.03, 0, 0, 0.9);
    colL(0, 0, w / 2 - 0.1, d / 2 - 0.1, -1, T0 + 0.07, true);
    at('plank', GEO.box(w - 0.2, 0.1, d - 0.2), 0x8a6a48, 0, T0 + wh - 0.05, 0, 0, 0.9);
    COL.box(x, z, w / 2, d / 2, -ry, y + T0 + wh - 0.12, y + T0 + wh + 4);   // 천장 (카메라가 뚫지 않게)
    // 벽: 바깥은 칠한 통나무, 안쪽은 나무색 판 한 겹
    const DX = -w * 0.15, DW = 1.05, DH = 2.15;     // 문 자리 (앞 벽 = -z)
    const wall = (lx, lz, sx, sz, h) => {
      at('wall', GEO.box(sx, h, sz), logCol, lx, T0 + h / 2, lz, 0, 1.6);
      colL(lx, lz, sx / 2, sz / 2, -1, T0 + h + 0.1);
    };
    wall(w / 2 - TH / 2, 0, TH, d, wh);
    wall(-w / 2 + TH / 2, 0, TH, d, wh);
    wall(0, d / 2 - TH / 2, w, TH, wh);
    const la = -w / 2, lb = DX - DW / 2, ra = DX + DW / 2, rb = w / 2;
    wall((la + lb) / 2, -d / 2 + TH / 2, lb - la, TH, wh);
    wall((ra + rb) / 2, -d / 2 + TH / 2, rb - ra, TH, wh);
    at('wall', GEO.box(DW, wh - DH, TH), logCol, DX, T0 + DH + (wh - DH) / 2, -d / 2 + TH / 2, 0, 1.6);
    colL(DX, -d / 2 + TH / 2, DW / 2, TH / 2, T0 + DH, T0 + wh + 0.1);
    for (const [lx, lz, sx, sz] of [[w / 2 - TH - 0.01, 0, 0.02, d - 2 * TH], [-w / 2 + TH + 0.01, 0, 0.02, d - 2 * TH], [0, d / 2 - TH - 0.01, w - 2 * TH, 0.02]])
      at('wall', GEO.box(sx, wh, sz), inCol, lx, T0 + wh / 2, lz, 0, 1.6);
    // 문틀·열린 문짝
    for (const sx of [-1, 1]) at('trim', GEO.box(0.1, DH + 0.1, TH + 0.06), 0xe8e2d4, DX + sx * (DW / 2 + 0.05), T0 + DH / 2, -d / 2 + TH / 2);
    at('trim', GEO.box(DW + 0.3, 0.12, TH + 0.06), 0xe8e2d4, DX, T0 + DH + 0.06, -d / 2 + TH / 2);
    if (opt.closed) {
      // 닫힌 집 (사장님 2026-09-17 "주인공집과 미션있는집 5채 빼고는 문을 닫아서 못 들어가게")
      at('trim', GEO.box(DW, DH - 0.05, 0.08), 0x6a4a30, DX, T0 + DH / 2, -d / 2 + 0.02);
      for (const oy of [0.45, 1.7]) at('trim', GEO.box(DW - 0.12, 0.1, 0.04), 0x4e3422, DX, T0 + oy, -d / 2 - 0.04);
      at('trim', new THREE.SphereGeometry(0.045, 6, 5), 0xc8a050, DX + DW / 2 - 0.16, T0 + 1.05, -d / 2 - 0.07);
      colL(DX, -d / 2 + TH / 2, DW / 2 + 0.05, TH / 2 + 0.08, -1, T0 + DH + 0.1);
    } else {
      const th = 1.75, hx = DX - DW / 2 + 0.03, hz = -d / 2 + TH;
      at('trim', GEO.box(0.98, DH - 0.05, 0.05), 0x6a4a30, hx + Math.cos(th) * 0.49, T0 + DH / 2, hz + Math.sin(th) * 0.49, -th);
      colL(hx + Math.cos(th) * 0.49, hz + Math.sin(th) * 0.49, 0.12, 0.12, T0, T0 + DH);
    }
    // 박공
    const rh = w * 0.42;
    for (const sz of [-1, 1]) {
      const [gx, gz] = L(0, sz * (d / 2 - 0.02));
      put('plank', prism(w, rh, 0.14), paint === 0xffffff ? 0xb89a70 : paint, gx, y + T0 + wh, gz, ry);
    }
    // 지붕
    const slope = Math.atan2(rh, w / 2), len = Math.hypot(w / 2, rh) + 0.55;
    const rc = opt.roof != null ? opt.roof : ROOFC[(rnd() * ROOFC.length) | 0];
    for (const sd of [-1, 1]) {
      const g = new THREE.BoxGeometry(len, 0.12, d + 1.0);
      g.translate(sd * len / 2, 0, 0);
      g.rotateZ(sd * -slope);
      g.translate(0, rh + 0.06, 0);
      put('roof', g, rc, x, y + T0 + wh, z, ry, 1.5);
    }
    put('trim', GEO.box(0.22, 0.18, d + 1.05, 0, rh + 0.14, 0), 0x5a5550, x, y + T0 + wh, z, ry);
    // 창문 (바깥 장식 + 안쪽 유리·창턱)
    const nWin = Math.max(2, Math.floor(d / 2.4));
    const trimCol = opt.trim != null ? opt.trim : 0xf4f2ea;
    const shutter = [0x3f6aa8, 0x3f8a5a, 0x2f5a9a, 0xb04a3a][(rnd() * 4) | 0];
    const win = (lx, lz, face) => {
      const fr = ry + face;
      const [wx, wz] = L(lx, lz);
      const wy = y + T0 + 1.35;
      put('glass', GEO.box(0.95, 1.15, 0.06, 0, 0, 0), 0x2a3a4a, wx, wy, wz, fr);
      const nx = Math.sin(face), nz = Math.cos(face);
      const [ix, iz] = L(lx - nx * (TH + 0.05), lz - nz * (TH + 0.05));
      put('winIn', GEO.box(0.95, 1.15, 0.04, 0, 0, 0), 0xffffff, ix, wy, iz, fr);
      const [jx, jz] = L(lx - nx * (TH + 0.08), lz - nz * (TH + 0.08));
      put('trim', GEO.box(1.15, 0.08, 0.1, 0, -0.62, 0), 0xe8e2d4, jx, wy, jz, fr);
      const f = (w2, h2, ox, oy) => put('trim', GEO.box(w2, h2, 0.12, ox, oy, 0.04), trimCol, wx, wy, wz, fr);
      f(1.25, 0.12, 0, 0.64); f(1.35, 0.14, 0, -0.66); f(0.12, 1.3, -0.6, 0); f(0.12, 1.3, 0.6, 0);
      f(0.05, 1.15, 0, 0); f(0.95, 0.05, 0, 0.18);
      const k = kokoshnik(1.5, 0.75, 0.08); k.translate(0, 0.7, 0.06);
      put('trim', k, trimCol, wx, wy, wz, fr);
      const k2 = kokoshnik(1.2, 0.35, 0.08); k2.rotateZ(Math.PI); k2.translate(0, -0.72, 0.06);
      put('trim', k2, trimCol, wx, wy, wz, fr);
      for (const sd of [-1, 1]) put('trim', GEO.box(0.5, 1.2, 0.05, sd * 0.93, 0, 0.12), shutter, wx, wy, wz, fr);
    };
    for (let i = 0; i < nWin; i++) {
      const lz = -d / 2 + d * (i + 0.5) / nWin;
      win(w / 2 + 0.03, lz, Math.PI / 2);
      if (i !== 1) win(-w / 2 - 0.03, lz, -Math.PI / 2);
    }
    win(0, d / 2 + 0.03, 0);
    // 현관
    const [px, pz] = L(DX, -d / 2 - 0.9);
    put('plank', GEO.box(1.8, 0.2, 1.6, 0, 0.55, 0), 0xa08060, px, y, pz, ry);
    for (const sx of [-0.8, 0.8]) put('plank', GEO.box(0.12, 2.6, 0.12, sx, 0.6 + 1.3, -0.7), 0xa08060, px, y, pz, ry);
    put('plank', GEO.box(2.1, 0.1, 2.0, 0, 3.25, -0.1), 0x8a6a4a, px, y, pz, ry);
    COL.box(px, pz, 1.0, 0.85, -ry, y - 1, y + 0.62).top = true;
    for (const sx of [-0.8, 0.8]) colL(DX + sx, -d / 2 - 1.6, 0.08, 0.08, -1, 3.3);
    {
      let top = y + 0.62, k = 0;
      while (k < 6) {
        const lz = -d / 2 - 1.95 - k * 0.4;
        const [sx2, sz2] = L(DX, lz);
        const gh = TER.H(sx2, sz2);
        if (top - gh <= 0.36) break;
        top -= 0.3;
        put('plank', GEO.box(1.6, top - gh + 0.3, 0.42, 0, (top - gh + 0.3) / 2 - 0.3, 0), 0x9a7a58, sx2, gh, sz2, ry);
        COL.box(sx2, sz2, 0.8, 0.21, -ry, gh - 1, top).top = true;
        k++;
      }
    }

    // ── 살림 ── (닫힌 집은 안을 꾸미지 않는다)
    //   집 안은 할 일이 없어 모든 집 문을 닫았다 (사장님 2026-09-24). 할머니네 요리 도구는 앞마당에 (outdoorKitchen)
    if (opt.closed) {
      if (opt.chimney) {
        const [cx, cz] = L(w / 2 - TH - 0.55, d / 2 - TH - 0.6);
        put('brick', GEO.box(0.6, 2.4, 0.6, 0, 1.2, 0), 0xffffff, cx, y + T0 + wh, cz, ry, 1);
      }
      const h = { x, z, y, ry, w, d, floor: y + T0 + 0.07, top: y + T0 + wh + rh, ridgeA: L(0, d / 2 + 0.2), ridgeB: L(0, -d / 2 - 0.2), L, bed: null, door: L(DX, -d / 2 - 0.9), closed: true };
      // 주민이 서는 자리: 현관 계단 오른편 앞마당, 집을 등지고
      const [sx, sz] = L(DX + 1.6, -d / 2 - 2.6);
      h.stand = { x: sx, z: sz, yaw: ry + Math.PI };
      HOUSES.push(h);
      return h;
    }
  }

  // 할머니네 앞마당 부엌 (사장님 2026-09-24 "할머니집안에 있는 요리도구를 할머니집 밖으로")
  //   집 앞벽 왼편 긴 의자(할머니가 앉아 있다) · 왼쪽 옆마당 페치카(차양 아래) · 그 앞 식탁
  function outdoorKitchen(h) {
    const { w, d, ry, L } = h;
    const g = (lx, lz) => { const [wx, wz] = L(lx, lz); return [wx, TER.H(wx, wz), wz]; };
    const at = (key, geo, col, lx, ly, lz, rot, uv, base) => { const [wx, gy, wz] = g(lx, lz); return put(key, geo, col, wx, (base != null ? base : gy) + ly, wz, ry + (rot || 0), uv); };
    const colL = (lx, lz, hw, hd, y0, y1, base) => { const [wx, gy, wz] = g(lx, lz); const b = base != null ? base : gy; const o = COL.box(wx, wz, hw, hd, -ry, b + y0, b + y1); o.top = true; return o; };
    // 긴 의자 — 앞벽에 붙여서. 앉은 할머니 엉덩이 높이(0.34m)에 맞춘 낮은 의자
    const bx = -w / 2 + 0.85, bz = -d / 2 - 0.32, by = g(bx, bz)[1];
    at('plank', GEO.box(1.4, 0.07, 0.4), 0x7a5634, bx, 0.305, bz, 0, 1, by);
    for (const ox of [-0.55, 0.55]) at('plank', GEO.box(0.07, 0.3, 0.34), 0x6a4a30, bx + ox, 0.15, bz, 0, 1, by);
    colL(bx, bz, 0.7, 0.2, -1, 0.34, by);
    // 페치카 — 흰 흙 난로, 아궁이는 앞(-z)으로
    const sx = -w / 2 - 1.55, sz = -d / 2 + 1.0, sy = g(sx, sz)[1];
    at('stone', GEO.box(1.3, 1.1, 1.5), 0xf0ece2, sx, 0.55, sz, 0, 0.8, sy);
    at('stone', GEO.box(1.4, 0.1, 1.6), 0xe0dace, sx, 1.14, sz, 0, 0.8, sy);
    at('trim', GEO.box(0.55, 0.42, 0.05), 0x1a1410, sx, 0.42, sz - 0.76, 0, 1, sy);      // 아궁이
    at('trim', GEO.box(0.6, 0.06, 0.35), 0x3a3028, sx, 0.2, sz - 0.9, 0, 1, sy);
    at('stone', GEO.box(0.45, 1.6, 0.45), 0xf0ece2, sx + 0.3, 1.19 + 0.8, sz + 0.45, 0, 0.8, sy);   // 굴뚝
    colL(sx, sz, 0.7, 0.8, -1, 1.2, sy);
    // 차양 — 기둥 넷 + 판자 지붕
    for (const [ox, oz] of [[-0.95, -1.05], [0.95, -1.05], [-0.95, 1.05], [0.95, 1.05]]) {
      at('plank', GEO.box(0.1, 2.5, 0.1), 0x7a5a3a, sx + ox, 1.25, sz + oz, 0, 1, sy);
      colL(sx + ox, sz + oz, 0.07, 0.07, -1, 2.5, sy);
    }
    { const roof = GEO.box(2.3, 0.08, 2.5); roof.rotateX(0.12); at('roof', roof, 0x8a6a4a, sx, 2.55, sz, 0, 1.2, sy); }
    // 식탁 — 페치카 앞, 수놓은 수건·그릇·빵·사모바르
    const tx = -w / 2 - 1.35, tz = -d / 2 - 2.45, ty = g(tx, tz)[1];
    at('plank', GEO.box(1.5, 0.07, 0.95), 0x8a5e3a, tx, 0.76, tz, 0, 0.9, ty);
    for (const [ox, oz] of [[-0.65, -0.38], [0.65, -0.38], [-0.65, 0.38], [0.65, 0.38]]) at('plank', GEO.box(0.07, 0.76, 0.07), 0x6a4a30, tx + ox, 0.38, tz + oz, 0, 1, ty);
    at('trim', GEO.box(0.35, 0.01, 1.05), 0xf6f2ea, tx, 0.8, tz, 0, 1, ty);
    for (let i = 0; i < 5; i++) at('trim', GEO.box(0.36, 0.012, 0.05), 0xc0302a, tx, 0.805, tz - 0.4 + i * 0.2, 0, 1, ty);
    at('trim', new THREE.CylinderGeometry(0.16, 0.1, 0.08, 10), 0xe8dcc0, tx - 0.35, 0.84, tz - 0.1, 0, 1, ty);
    at('trim', new THREE.SphereGeometry(0.13, 8, 6).scale(1.3, 0.6, 1), 0xb07838, tx + 0.35, 0.85, tz + 0.1, 0, 1, ty);
    at('trim', new THREE.CylinderGeometry(0.1, 0.13, 0.32, 10), 0xd8a040, tx + 0.1, 0.96, tz + 0.25, 0, 1, ty);
    colL(tx, tz, 0.78, 0.5, -1, 0.8, ty);
    // 요리 자리 (cook.js) — [x, 높이, z]
    const sp3 = (lx, lz, hy, base) => { const [wx, gy, wz] = g(lx, lz); return [wx, (base != null ? base : gy) + hy, wz]; };
    h.spots = {
      stove: sp3(sx - 0.2, sz - 0.35, 1.19, sy),     // 페치카 위 무쇠솥
      fire: sp3(sx, sz - 1.45, 0),                  // 아궁이 앞에 선다
      table: sp3(tx + 0.45, tz - 0.2, 0.81, ty),     // 요리를 내려놓는 자리
      serve: sp3(tx + 1.15, tz - 0.2, 0),           // 식탁 옆에 선다
    };
    // 할머니 자리: 서 있을 땐 의자 앞, 앉으면 의자 위 (quests.js seatStep)
    const [ax, az] = L(bx, bz - 0.55), [qx, qz] = L(bx, bz - 0.02);
    h.stand = { x: ax, z: az, yaw: ry + Math.PI, seat: { x: qx, z: qz } };
  }

  // 울타리 한 줄 (판자 울타리)
  function fence(ax, az, bx, bz) {
    const len = Math.hypot(bx - ax, bz - az), n = Math.floor(len / 0.32);
    const ry = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = U.lerp(ax, bx, t), z = U.lerp(az, bz, t);
      const h = 1.05 + (i % 2) * 0.08;
      put('plank', GEO.box(0.12, h, 0.03, 0, h / 2, 0), 0xb09a78, x, TER.H(x, z) - 0.1, z, ry + Math.PI / 2, 1);
    }
    for (const yy of [0.35, 0.8]) {
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      put('plank', GEO.box(0.05, 0.08, len, 0, yy, 0), 0x8a7458, mx, TER.H(mx, mz) - 0.1, mz, ry, 1);
    }
    const c = Math.cos(ry), s = Math.sin(ry);
    COL.box((ax + bx) / 2, (az + bz) / 2, 0.08, len / 2, -ry, -9, TER.H(ax, az) + 1.2);
  }

  // 두레박 (우물 장대)
  // 움직이는 두레박 장대
  const CRANES = [];
  const CRANE_MAT = {
    pole: new THREE.MeshStandardMaterial({ color: 0x9a7a54, roughness: 0.9 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x6a665e, roughness: 0.95, flatShading: true }),
    rope: new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 1 }),
    bucket: new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.85 }),
    band: new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 0.6, metalness: 0.3 }),
    water: new THREE.MeshStandardMaterial({ color: 0x3f6f86, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }),
  };
  function craneEnd(c) {
    const cs = Math.cos(c.phi), sn = Math.sin(c.phi), [dx, dy] = c.E0;
    return [c.PX + dx * cs - dy * sn, c.PY + dx * sn + dy * cs];
  }
  function craneSet(c) {
    c.pivot.rotation.z = c.phi;
    const [ex, ey] = craneEnd(c);
    c.rope.position.set(ex, ey, 0); c.rope.scale.y = c.ropeLen;
    c.bucket.position.set(ex, ey - c.ropeLen, 0);
  }
  const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k);
  // 두레박으로 물 긷기: 내려가 물에 닿고(첨벙) 차서 올라오면 onFull(두레박 세계 위치)
  function drawWater(o, onFull) {
    const c = o.crane;
    if (!c || c.t >= 0) return false;
    c.t = 0; c.onFull = onFull; c.splashed = false; c.water.visible = false; c.bucket.visible = true;
    if (window.AUD) AUD.sfx('creak');
    return true;
  }
  const _bw = new THREE.Vector3();
  function craneUpdate(dt) {
    for (const c of CRANES) {
      if (c.t < 0) continue;
      c.t += dt;
      const t = c.t;
      if (t < 1.2) c.phi = 0.33 * ease(t / 1.2);
      else if (t < 1.75) {
        c.phi = 0.33 + Math.sin((t - 1.2) * 18) * 0.006 * (1.75 - t);   // 물에 닿아 출렁
        if (!c.splashed) { c.splashed = true; if (window.AUD) AUD.sfx('splash'); c.bucket.getWorldPosition(_bw); if (window.FEEL) FEEL.splash(_bw, 10); }
        if (t > 1.45) c.water.visible = true;
      } else if (t < 3.0) {
        if (c.phi > 0.3 && (t - 1.75) < 0.05 && window.AUD) AUD.sfx('creak');
        c.phi = 0.33 * (1 - ease((t - 1.75) / 1.25));
        if (Math.random() < dt * 9 && window.FEEL) { c.bucket.getWorldPosition(_bw); _bw.y -= 0.35; FEEL.drip(_bw); }
      } else if (c.onFull) {
        c.phi = 0;
        c.bucket.getWorldPosition(_bw);
        const f = c.onFull; c.onFull = null;
        c.bucket.visible = false;
        f(_bw.clone(), c.bucket);
      } else if (t > 4.2) {
        c.water.visible = false; c.bucket.visible = true; c.t = -1;   // 새 두레박
      }
      craneSet(c);
    }
  }

  // 두레박 우물 (사장님 2026-09-17 "이게 우물이라니") — 통나무를 井 자로 쌓은 몸통 + 우물 위로 드리운 장대(쥬라벨)
  function wellCrane(x, z) {
    const y = TER.H(x, z) - 0.12, ry = 0.3;   // 몸통을 땅에 조금 묻는다 (떠 보이지 않게)
    WELLS.push({ x, z, y });
    const at = (key, g, col, uv) => put(key, g, col, x, y, z, ry, uv || 1);
    // 두 점 사이 통나무 (로컬 좌표)
    const beam = (ax, ay, az, bx, by, bz, r0, r1, col, seg) => {
      const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dy, dz);
      const g = new THREE.CylinderGeometry(r1, r0, len, seg || 7);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
      g.applyQuaternion(q); g.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
      at('plank', g, col, 1);
    };
    // 몸통: 통나무 6단, 단마다 방향을 바꿔 끝이 엇갈려 튀어나온다
    const H = 0.19, S = 0.78, LOGC = [0x7a5a3c, 0x6e5034, 0x86664a];
    for (let k = 0; k < 6; k++) {
      const yy = 0.1 + k * H * 0.82;
      for (const sd of [-1, 1]) {
        const col = LOGC[(k + (sd > 0 ? 1 : 0)) % 3];
        if (k % 2 === 0) beam(-S - 0.22, yy, sd * S, S + 0.22, yy, sd * S, H / 2, H / 2 * 0.92, col);
        else beam(sd * S, yy, -S - 0.22, sd * S, yy, S + 0.22, H / 2, H / 2 * 0.92, col);
      }
    }
    const top = 0.1 + 5 * H * 0.82 + H / 2;
    // 안쪽: 짙은 판벽과 물
    for (const [ox, oz, w, d] of [[0, S - 0.12, 1.3, 0.04], [0, -S + 0.12, 1.3, 0.04], [S - 0.12, 0, 0.04, 1.3], [-S + 0.12, 0, 0.04, 1.3]])
      at('trim', GEO.box(w, top - 0.05, d, ox, top / 2, oz), 0x2e2418);
    at('trim', GEO.box(1.26, 0.02, 1.26, 0, top - 0.55, 0), 0x16242c);
    // 반쯤 덮은 뚜껑과 가장자리에 걸친 두레박 하나
    at('plank', GEO.box(0.7, 0.05, 1.5, 0.38, top + 0.03, 0), 0x9a7a54, 0.6);
    at('trim', GEO.box(0.08, 0.06, 1.5, 0.12, top + 0.05, 0), 0x6a4a30);
    // 장대 기둥: 갈라진 나무 기둥 (우물 옆 3.4m)
    const PX = 3.4, PY = 4.3;
    beam(PX, -0.3, 0, PX, PY - 0.35, 0, 0.17, 0.14, 0x6a5238);
    beam(PX, PY - 0.4, 0, PX - 0.12, PY + 0.2, -0.16, 0.08, 0.06, 0x6a5238, 5);
    beam(PX, PY - 0.4, 0, PX + 0.12, PY + 0.2, 0.16, 0.08, 0.06, 0x6a5238, 5);
    beam(PX, PY, -0.25, PX, PY, 0.25, 0.04, 0.04, 0x3a2a1e, 5);            // 굴대
    // 움직이는 부분 (사장님 2026-09-17 "물리적으로 물을 긷는 재미") — 장대·누름돌·줄·두레박은 따로 그려 실제로 오르내린다
    const LX = 0.05, LY = 3.25;                                               // 긴 쪽 끝 (우물 한가운데 위)
    const ux = (PX - LX), uy = (PY - LY), ul = Math.hypot(ux, uy);
    const SX = PX + ux / ul * 2.3, SY = PY + uy / ul * 2.3;                   // 짧은 쪽 끝
    const BY = top + 0.55;
    const root = new THREE.Group(); root.position.set(x, y, z); root.rotation.y = ry;
    const pivot = new THREE.Group(); pivot.position.set(PX, PY, 0); root.add(pivot);
    const bg = (ax, ay, bx, by, r0, r1, seg) => {
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      const g = new THREE.CylinderGeometry(r1, r0, len, seg || 7);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, 0)));
      g.translate((ax + bx) / 2, (ay + by) / 2, 0);
      return g;
    };
    const mk = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; };
    pivot.add(mk(bg(LX - PX, LY - PY, SX - PX, SY - PY, 0.06, 0.11), CRANE_MAT.pole));
    let i0 = 0;
    for (const [ox, oy, oz, rr] of [[-0.25, -0.3, 0, 0.3], [-0.05, -0.42, 0.12, 0.24], [-0.4, -0.45, -0.1, 0.2]]) {
      const stone = new THREE.IcosahedronGeometry(rr, 1);
      const sp = stone.attributes.position;
      const wr = U.mulberry(77 + i0++);   // 전체 난수 순서를 건드리지 않게 따로
      for (let i = 0; i < sp.count; i++) sp.setXYZ(i, sp.getX(i) * (1 + (wr() - 0.5) * 0.3), sp.getY(i) * 0.8, sp.getZ(i) * (1 + (wr() - 0.5) * 0.3));
      stone.computeVertexNormals();
      stone.translate(SX - PX + ox, SY - PY + oy, oz);
      pivot.add(mk(stone, CRANE_MAT.stone));
    }
    pivot.add(mk(bg(SX - PX - 0.25, SY - PY - 0.05, SX - PX - 0.15, SY - PY + 0.05, 0.03, 0.03, 4), CRANE_MAT.rope));
    // 줄(가는 장대) — 늘 곧게 아래로
    const rope = mk(new THREE.CylinderGeometry(0.022, 0.022, 1, 5).translate(0, -0.5, 0), CRANE_MAT.rope);
    root.add(rope);
    // 두레박 — 원점이 줄 끝
    const bucket = new THREE.Group();
    bucket.add(mk(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 12).translate(0, -0.25, 0), CRANE_MAT.bucket));
    for (const hy of [-0.31, -0.13]) bucket.add(mk(new THREE.CylinderGeometry(0.168 - (hy + 0.25) * 0.13, 0.168 - (hy + 0.25) * 0.13, 0.03, 12).translate(0, hy, 0), CRANE_MAT.band));
    bucket.add(mk(new THREE.TorusGeometry(0.16, 0.012, 4, 12, Math.PI).translate(0, -0.12, 0), CRANE_MAT.band));
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.155, 12).rotateX(-Math.PI / 2).translate(0, -0.13, 0), CRANE_MAT.water);
    water.visible = false; bucket.add(water);
    root.add(bucket);
    const crane = { root, pivot, rope, bucket, water, E0: [LX - PX, LY - PY], PX, PY, ropeLen: LY - (BY + 0.28), phi: 0, t: -1, onFull: null, splashed: false };
    WELLS[WELLS.length - 1].crane = crane;
    CRANES.push(crane);
    craneSet(crane);
    // 둘레에 깐 넓적돌 (젖어서 짙다)
    const fr = U.mulberry(91);
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * 6.28 + fr() * 0.3, rr = 1.35 + fr() * 0.35, sz = 0.26 + fr() * 0.16;
      const fl = new THREE.CylinderGeometry(sz, sz * 1.05, 0.07, 9);
      const fp = fl.attributes.position;
      for (let k = 0; k < fp.count; k++) { const px = fp.getX(k), pz = fp.getZ(k), j = 0.75 + fr() * 0.45; fp.setX(k, px * j * 1.25); fp.setZ(k, pz * j * 0.85); }
      fl.computeVertexNormals();
      fl.rotateY(-a + fr());
      fl.translate(Math.cos(a) * rr, 0.13 + fr() * 0.02, Math.sin(a) * rr);
      at('stone', fl, [0x5e5a52, 0x6a665c, 0x57534c][i % 3]);
    }
    // 땅에 둔 물통 하나
    const pail = new THREE.CylinderGeometry(0.2, 0.16, 0.36, 10); pail.translate(-1.25, 0.18, 0.7);
    at('plank', pail, 0x7a5a3c, 0.5);
    at('trim', new THREE.CylinderGeometry(0.19, 0.19, 0.01, 10).translate(-1.25, 0.32, 0.7), 0x2c4a58);
    COL.circle(x, z, 1.05, y - 1, y + top + 0.1);
    { const [qx, qz] = local(x, z, ry)(PX, 0); COL.circle(qx, qz, 0.25, y - 1, y + PY); }
  }

  function haystack(x, z, s) {
    const y = TER.H(x, z);
    const g = new THREE.SphereGeometry(1.8 * s, 12, 8);
    g.scale(1, 1.5, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const yy = p.getY(i); if (yy < 0) p.setY(i, yy * 0.2); p.setX(i, p.getX(i) * (1 + (Math.random() - 0.5) * 0.08)); p.setZ(i, p.getZ(i) * (1 + (Math.random() - 0.5) * 0.08)); }
    g.computeVertexNormals();
    put('roof', g, 0xc8a860, x, y + 0.1, z, 0, 0.6);   // 지붕 질감을 짚처럼 쓴다
    put('plank', GEO.cyl(0.05, 0.05, 4.2 * s, 4), 0x6a5238, x, y, z, 0);
    COL.circle(x, z, 1.7 * s, y - 1, y + 3 * s);
  }

  // 황새 둥지 (기둥·지붕·나무 위)
  function nestAt(x, y, z, withPole, tag) {
    if (withPole) {
      put('plank', GEO.cyl(0.16, 0.2, y - TER.H(x, z), 6), 0x6a5a48, x, TER.H(x, z), z, 0, 1);
      put('plank', GEO.box(1.8, 0.1, 0.12, 0, y - TER.H(x, z) - 0.1, 0), 0x6a5a48, x, TER.H(x, z), z, 0.4);
      put('plank', GEO.box(0.12, 0.1, 1.8, 0, y - TER.H(x, z) - 0.1, 0), 0x6a5a48, x, TER.H(x, z), z, 0.4);
      COL.circle(x, z, 0.3, -9, y);
    }
    // 잔가지 둥지 — 가는 막대를 둥글게 겹쳐 쌓는다
    for (let i = 0; i < 90; i++) {
      const a = rnd() * 6.28, rr = 0.5 + rnd() * 0.4, len = 0.7 + rnd() * 0.7;
      const g = new THREE.CylinderGeometry(0.012, 0.018, len, 3);
      g.rotateZ(Math.PI / 2 + (rnd() - 0.5) * 0.5);
      g.rotateY(a + Math.PI / 2 + (rnd() - 0.5) * 0.8);
      put('trim', g, rnd() < 0.5 ? 0x5a4630 : 0x7a6448, x + Math.cos(a) * rr, y + rnd() * 0.45, z + Math.sin(a) * rr, 0, 1);
    }
    const bed = new THREE.CylinderGeometry(0.8, 0.5, 0.42, 12, 2);
    const bp = bed.attributes.position;
    for (let i = 0; i < bp.count; i++) bp.setX(i, bp.getX(i) * (1 + (rnd() - 0.5) * 0.15));
    bed.computeVertexNormals();
    put('roof', bed, 0x6a5238, x, y + 0.18, z, 0, 0.5);
    NESTS.push({ x, y: y + 0.45, z, tag });
  }

  // 나무 교회
  function church(x, z, ry) {
    const y = TER.H(x, z) - 0.2;
    const L = local(x, z, ry);
    const blue = 0x86a8d0, white = 0xf2efe6, dome = 0x2f5e9e, gold = 0xe8c060;
    put('stone', GEO.box(9.4, 0.8, 13.4, 0, 0.2, 0), 0x9a948a, x, y, z, ry);
    put('wall', GEO.box(9, 6, 13, 0, 3.6, 0), blue, x, y, z, ry, 1.6);
    // 박공 지붕
    for (const sd of [-1, 1]) {
      const g = new THREE.BoxGeometry(6.2, 0.15, 14);
      g.translate(sd * 3.1, 0, 0); g.rotateZ(sd * -0.72); g.translate(0, 3.9, 0);
      put('roof', g, 0x4d6a8a, x, y + 6.6, z, ry, 1.5);
    }
    for (const sz of [-1, 1]) { const g = prism(9, 4.0, 0.14); g.rotateY(0); const [gx, gz] = L(0, sz * 6.5); put('plank', g, white, gx, y + 6.6, gz, ry); }
    // 가운데 팔각 탑 + 양파 지붕
    put('wall', new THREE.CylinderGeometry(2.0, 2.0, 4.2, 8).translate(0, 2.1, 0), white, x, y + 9.8, z, ry, 1.6);
    put('trim', new THREE.CylinderGeometry(2.3, 2.3, 0.3, 8).translate(0, 4.3, 0), dome, x, y + 9.8, z, ry);
    put('trim', onion(2.3, 4.2), dome, x, y + 14.3, z, ry);
    put('trim', GEO.cyl(0.08, 0.08, 2.2, 4), gold, x, y + 18.3, z, ry);
    put('trim', GEO.box(1.1, 0.1, 0.1, 0, 1.6, 0), gold, x, y + 18.3, z, ry);
    put('trim', GEO.box(0.7, 0.1, 0.1, 0, 1.1, 0), gold, x, y + 18.3, z, ry);
    // 앞 종탑
    const [bx, bz] = L(0, -8.4);
    put('wall', GEO.box(4, 9, 4, 0, 4.5, 0), white, bx, y, bz, ry, 1.6);
    put('trim', GEO.box(4.4, 0.3, 4.4, 0, 9.1, 0), dome, bx, y, bz, ry);
    put('wall', GEO.box(3, 2.4, 3, 0, 10.4, 0), blue, bx, y, bz, ry, 1.6);
    for (const [ox, oz] of [[0, -1.52], [0, 1.52], [-1.52, 0], [1.52, 0]]) put('glass', GEO.box(Math.abs(oz) ? 1.2 : 0.05, 1.5, Math.abs(ox) ? 1.2 : 0.05, ox, 10.5, oz), 0x1a2028, bx, y, bz, ry);
    put('trim', onion(1.6, 3.2), dome, bx, y + 11.6, bz, ry);
    put('trim', GEO.cyl(0.06, 0.06, 1.8, 4), gold, bx, y + 14.7, bz, ry);
    put('trim', GEO.box(0.8, 0.08, 0.08, 0, 1.3, 0), gold, bx, y + 14.7, bz, ry);
    // 문
    const [dx, dz] = L(0, -10.45);
    put('trim', GEO.box(1.6, 2.6, 0.1, 0, 1.3, 0), 0x5a3a24, dx, y + 0.4, dz, ry);
    for (let i = 0; i < 3; i++) { const [wx, wz] = L(4.53, -3 + i * 3.4); put('glass', GEO.box(0.05, 2.0, 0.9, 0, 3.8, 0), 0x2a3a4a, wx, y, wz, ry); const [wx2, wz2] = L(-4.53, -3 + i * 3.4); put('glass', GEO.box(0.05, 2.0, 0.9, 0, 3.8, 0), 0x2a3a4a, wx2, y, wz2, ry); }
    COL.box(x, z, 4.6, 6.6, -ry, y - 1, y + 20);
    COL.box(bx, bz, 2.1, 2.1, -ry, y - 1, y + 20);
    return { y };
  }

  // 장터 가판대
  function stall(x, z, ry, awn) {
    const y = TER.H(x, z);
    for (const [ox, oz] of [[-1.6, -0.9], [1.6, -0.9], [-1.6, 0.9], [1.6, 0.9]]) put('plank', GEO.box(0.12, 2.6, 0.12, ox, 1.3, oz), 0x7a5a3a, x, y, z, ry);
    put('plank', GEO.box(3.4, 0.1, 1.4, 0, 0.95, 0.1), 0xa08060, x, y, z, ry);
    put('plank', GEO.box(3.4, 0.85, 0.06, 0, 0.45, -0.58), 0x8a6a4a, x, y, z, ry);
    // 줄무늬 차양
    for (let i = 0; i < 8; i++) {
      const g = new THREE.BoxGeometry(3.6 / 8, 0.05, 2.4);
      g.rotateX(0.28);
      g.translate(-1.8 + 3.6 / 16 + i * 3.6 / 8, 2.75, 0);
      put('trim', g, i % 2 ? 0xf4f0e6 : awn, x, y, z, ry);
    }
    // 물건: 감자·양배추·사과·단지
    const L = local(x, z, ry);
    for (let i = 0; i < 3; i++) {
      const [cx, cz] = L(-1.0 + i, -0.1);
      put('plank', GEO.box(0.8, 0.3, 0.55, 0, 1.15, 0), 0x9a7a54, cx, y, cz, ry);
      const col = [0xb89060, 0x8ab860, 0xc03a2a][i];
      for (let k = 0; k < 7; k++) {
        const s = new THREE.IcosahedronGeometry(i === 1 ? 0.14 : 0.09, 1);
        put('trim', s, col, cx + (rnd() - 0.5) * 0.55, y + 1.36 + rnd() * 0.06, cz + (rnd() - 0.5) * 0.35, 0);
      }
    }
    COL.box(x, z, 1.75, 0.8, -ry, y - 1, y + 2.4);
  }

  // ── 명소 12곳 (terrain.js PLACES) — 길 끝·길가에 가 볼 만한 것 ──
  let sails = null;
  function placesBuild(scene) {
    const P = {}; for (const p of TER.PLACES) P[p.id] = p;
    const W = 0x7a5a3a, D = 0x5a4430, PL = 0xa08060;
    // 풍차 — 팔각 몸통, 돌아가는 날개
    {
      const { x, z } = P.mill, y = TER.H(x, z) - 0.3, ry = 2.2;
      put('wall', new THREE.CylinderGeometry(2.1, 3.0, 7.5, 8).translate(0, 3.75, 0), 0x9a7a58, x, y, z, ry, 1.6);
      put('stone', new THREE.CylinderGeometry(3.2, 3.4, 0.8, 8).translate(0, 0.4, 0), 0x8a8478, x, y, z, ry, 1);
      put('roof', new THREE.ConeGeometry(2.6, 2.6, 8).translate(0, 8.8, 0), 0x6a5a4a, x, y, z, ry, 1);
      const L = local(x, z, ry);
      const at = (key, g, col, lx, ly, lz) => { const [wx, wz] = L(lx, lz); put(key, g, col, wx, y + ly, wz, ry, 1); };
      at('plank', GEO.box(1.1, 2.0, 0.1), D, 0, 1.8, 2.75);                 // 문
      for (const hy of [3.6, 5.6]) at('glass', GEO.box(0.6, 0.7, 0.08), 0x2a3a4a, 0, hy, 2.45);
      at('plank', GEO.box(0.3, 0.3, 1.6), D, 0, 7.3, 2.6);                  // 날개 축
      COL.circle(x, z, 3.1, y - 1, y + 9);
      // 날개 (따로 돌린다)
      sails = new THREE.Group();
      const [sx, sz] = L(0, 3.45);
      sails.position.set(sx, y + 7.3, sz);
      sails.rotation.y = ry;
      const wood = new THREE.MeshStandardMaterial({ color: 0x6a5238, roughness: 0.9 });
      const cloth = new THREE.MeshStandardMaterial({ color: 0xece2cc, roughness: 1, side: THREE.DoubleSide });
      for (let i = 0; i < 4; i++) {
        const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.4, 0.16), wood); bar.position.y = 3.2; arm.add(bar);
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 4.6), cloth); sail.position.set(0.75, 3.8, -0.05); arm.add(sail);
        for (let k = 0; k < 5; k++) { const rung = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.06), wood); rung.position.set(0.72, 1.7 + k * 1.05, 0); arm.add(rung); }
        sails.add(arm);
      }
      sails.traverse(o => { if (o.isMesh) o.castShadow = true; });
      scene.add(sails);
    }
    // 선착장 — 물로 뻗은 널판과 쪽배
    {
      const { x, z } = P.pier, ry = 0.15;
      const L = local(x, z, ry);
      const top = 0.5;
      // 첫 널판은 뭍 위에 (k=-1) — 물가에서 널판 턱이 0.53m 라 못 올라섰다 (2026-09-20 전수 시험, 작살을 못 잡았다)
      for (let k = -1; k < 9; k++) {
        const [px, pz] = L(0, k * 1.6);
        const gh = Math.max(TER.H(px, pz), -3);
        put('plank', GEO.box(2.4, 0.12, 1.5), k % 2 ? PL : 0x967656, px, top - 0.06, pz, ry + (k % 3 - 1) * 0.02, 0.8);
        for (const sx of [-1.1, 1.1]) { const [qx, qz] = L(sx, k * 1.6); put('plank', GEO.cyl(0.1, 0.12, top - gh + 0.4, 5), D, qx, gh - 0.3, qz, 0, 1); }
        COL.box(px, pz, 1.2, 0.8, -ry, gh - 2, top).top = true;
      }
      // 쪽배
      const [bx, bz] = L(2.6, 9);
      const hull = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); hull.scale(0.75, 0.45, 2.1);
      put('plank', hull, 0x6a8aa8, bx, 0.28, bz, ry + 0.2, 0.6);
      put('plank', GEO.box(1.3, 0.06, 0.25), PL, bx, 0.12, bz, ry + 0.2);
      COL.circle(bx, bz, 0.9, -3, 0.5);
    }
    // 망루 — 네 기둥과 지붕 얹은 전망대, 사다리
    {
      const { x, z } = P.tower, y = TER.H(x, z), ry = 0.4, H = 9;
      const L = local(x, z, ry);
      for (const [ox, oz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
        const [px, pz] = L(ox, oz);
        put('plank', GEO.cyl(0.14, 0.2, H + 3.8, 6), D, px, y - 0.2, pz, 0, 1);   // 지붕을 1.2m 올림 — 전망대에서 아래를 겨누면 카메라가 지붕 속에 들어갔다 (2026-09-20)
        COL.circle(px, pz, 0.25, y - 1, y + H + 3.2);
      }
      for (const hy of [2.5, 5.5]) for (const [ox, oz, w, d] of [[0, -1.5, 3, 0.12], [0, 1.5, 3, 0.12], [-1.5, 0, 0.12, 3], [1.5, 0, 0.12, 3]]) {
        const [px, pz] = L(ox, oz); put('plank', GEO.box(w, 0.12, d), W, px, y + hy, pz, ry + (ox ? 0 : 0), 1);
      }
      put('plank', GEO.box(3.8, 0.2, 3.8), PL, x, y + H, z, ry, 1);
      // 올라설 수 있는 바닥 (사장님 2026-09-20 "전망대 올라가서 멧돼지 쏘게해줘")
      { const deck = COL.box(x, z, 1.9, 1.9, -ry, y + H - 0.1, y + H + 0.1); deck.top = true; }
      // 난간은 네 면 모두 막는다 — 사다리 쪽을 터 두면 걸어 나가 9m 아래로 떨어진다 (2026-09-20 시험)
      //   내려갈 땐 사다리 자리(exit)에서 E
      for (const [ox, oz, w, d] of [[0, -1.85, 3.8, 0.08], [0, 1.85, 3.8, 0.08], [-1.85, 0, 0.08, 3.8], [1.85, 0, 0.08, 3.8]]) {
        const [px, pz] = L(ox, oz); put('plank', GEO.box(w, 0.9, d, 0, 0.45, 0), W, px, y + H + 0.1, pz, ry, 1);
        COL.box(px, pz, w / 2, d / 2, -ry, y + H + 0.1, y + H + 1.0);
      }
      const rf = new THREE.ConeGeometry(3.3, 1.8, 4); rf.rotateY(Math.PI / 4);
      put('roof', rf.translate(0, H + 4.1, 0), 0x5f7d5a, x, y, z, ry, 1);
      // 사다리
      const [lx, lz] = L(0, -1.75);
      for (const sx of [-0.35, 0.35]) { const [qx, qz] = L(sx, -1.75); put('plank', GEO.box(0.08, H, 0.08, 0, H / 2, 0), D, qx, y, qz, ry); }
      for (let k = 0; k < 22; k++) put('plank', GEO.box(0.7, 0.05, 0.06), W, lx, y + 0.4 + k * 0.4, lz, ry);
      put('trim', GEO.box(0.9, 0.5, 0.05), 0xb8342a, lx, y + H + 0.55, lz, ry);   // 붉은 깃발 판
      const [ex, ez] = L(0, -0.55);
      TOWER = { x, z, y, H, ry, lx, lz, deck: y + H + 0.1, exit: [ex, ez] };   // play.js 가 사다리로 쓴다
    }
    // 숲지기 오두막 — 닫힌 작은 통나무집, 장작더미, 그루터기 (장작 줍는 곳)
    {
      const { x, z } = P.hut, ry = -0.7;
      house(x, z, ry, 4.6, 5.4, { closed: true, paint: 0xffffff, roof: 0x5f7d5a });
      const L = local(x, z, ry);
      const [wx, wz] = L(3.6, 0), wy = TER.H(wx, wz);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6 - r; c++) {
        const g = new THREE.CylinderGeometry(0.16, 0.16, 1.2, 7); g.rotateX(Math.PI / 2);
        const [px, pz] = L(3.6, -1.3 + c * 0.34 + r * 0.17);
        put('plank', g, [0x8a6a48, 0x7a5a3a, 0x9a7a58][(r + c) % 3], px, wy + 0.16 + r * 0.29, pz, ry, 0.5);
      }
      COL.box(wx, wz, 0.7, 1.2, -ry, wy - 1, wy + 1.2);
      const [sx, sz] = L(-3.2, -3.8), sy = TER.H(sx, sz);
      put('plank', GEO.cyl(0.5, 0.62, 0.6, 9), 0x6a5238, sx, sy - 0.1, sz, 0, 1);
      put('trim', new THREE.CylinderGeometry(0.46, 0.46, 0.05, 12).translate(0, 0.52, 0), 0xc8a878, sx, sy - 0.1, sz, 0);
      put('plank', GEO.box(0.06, 0.7, 0.06, 0, 0.8, 0), 0x8a6a48, sx + 0.1, sy, sz, 0);    // 도끼 자루
      put('stone', GEO.box(0.3, 0.14, 0.04, 0.1, 0.48, 0), 0x9aa0a8, sx + 0.1, sy, sz, 0.4);
      COL.circle(sx, sz, 0.6, sy - 1, sy + 0.52);
      STUMPS.push({ x: sx, y: sy + 0.45, z: sz });
    }
    // 샘 — 돌 테두리 샘물과 작은 지붕 십자가, 매단 천 (물 긷는 곳)
    {
      const { x, z } = P.spring, y = TER.H(x, z);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; put('stone', new THREE.IcosahedronGeometry(0.34, 0), 0x8a8a80, x + Math.cos(a) * 1.3, y + 0.1, z + Math.sin(a) * 1.3, a, 1); }
      put('trim', new THREE.CylinderGeometry(1.1, 1.1, 0.05, 16), 0x3a6a8a, x, y + 0.08, z, 0);
      COL.circle(x, z, 1.5, y - 1, y + 0.5);
      const cx = x + 2.2, cz = z - 0.6;
      put('plank', GEO.box(0.18, 3.0, 0.18, 0, 1.5, 0), D, cx, y, cz, 0.3);
      put('plank', GEO.box(1.3, 0.16, 0.16, 0, 2.3, 0), D, cx, y, cz, 0.3);
      const rf = prism(1.2, 0.5, 0.5); put('roof', rf.translate(0, 3.0, 0), 0x6a5a4a, cx, y, cz, 0.3 + Math.PI / 2, 1);
      [0xb8342a, 0xf2ece0, 0x3f7a4a, 0xd8a040].forEach((c, i) => put('trim', GEO.box(0.08, 0.6, 0.02, -0.45 + i * 0.3, 1.9, 0.1), c, cx, y, cz, 0.3));
      COL.circle(cx, cz, 0.25, y - 1, y + 3);
      WELLS.push({ x, z });
    }
    // 사냥꾼 야영지 — 천막, 불 터, 통나무 의자, 말림대 (장작 줍는 곳)
    {
      const { x, z } = P.camp, y = TER.H(x, z), ry = 0.6;
      const L = local(x, z, ry);
      const [tx, tz] = L(0, 3.2), ty = TER.H(tx, tz);
      const tent = prism(3.2, 2.2, 3.4); put('trim', tent, 0x8a8a5a, tx, ty, tz, ry + Math.PI / 2, 1);
      put('trim', GEO.box(0.9, 1.4, 0.02, 0, 0.7, 1.72), 0x3a3a2a, tx, ty, tz, ry);
      COL.box(tx, tz, 1.6, 1.7, -ry, ty - 1, ty + 2.2);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; put('stone', new THREE.IcosahedronGeometry(0.22, 0), 0x7a7468, x + Math.cos(a) * 0.9, y + 0.05, z + Math.sin(a) * 0.9, a, 1); }
      for (let i = 0; i < 4; i++) { const g = new THREE.CylinderGeometry(0.07, 0.08, 1.2, 5); g.rotateZ(1.2); g.rotateY(i * 1.6); put('plank', g, 0x3a2a1e, x, y + 0.25, z, 0, 1); }
      // 모닥불 옆 누운 통나무도 지웠다 (사장님 2026-09-25)
      const [rx, rz] = L(2.8, -1.0), rgy = TER.H(rx, rz);
      for (const sx of [-0.9, 0.9]) { const [qx, qz] = L(2.8 + sx, -1.0); put('plank', GEO.box(0.1, 1.9, 0.1, 0, 0.95, 0), D, qx, rgy, qz, ry); }
      put('plank', GEO.box(2.0, 0.08, 0.08, 0, 1.85, 0), D, rx, rgy, rz, ry);
      for (let i = 0; i < 4; i++) { const [qx, qz] = L(2.3 + i * 0.35, -1.0); put('trim', GEO.box(0.12, 0.6, 0.04, 0, 1.5, 0), [0x9a5a3a, 0xc8a060, 0x7a8a4a, 0xb8342a][i], qx, rgy, qz, ry); }
      COL.circle(rx, rz, 1.0, rgy - 1, rgy + 2);
    }
    // 참나무 고목 — 굵은 줄기, 뻗은 가지, 커다란 잎 덩어리
    {
      const { x, z } = P.oak, y = TER.H(x, z);
      const trunk = new THREE.CylinderGeometry(1.1, 1.9, 7.5, 10, 4);
      const tp = trunk.attributes.position;
      for (let i = 0; i < tp.count; i++) { const a = Math.atan2(tp.getZ(i), tp.getX(i)); const k = 1 + Math.sin(a * 5 + tp.getY(i)) * 0.08; tp.setX(i, tp.getX(i) * k); tp.setZ(i, tp.getZ(i) * k); }
      trunk.computeVertexNormals(); trunk.translate(0, 3.5, 0);
      put('plank', trunk, 0x4a3c2e, x, y - 0.3, z, 0, 1.2);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.28 + 0.4, len = 5 + (i % 3);
        const th = 1.0 + (i % 2) * 0.25;
        const b = new THREE.CylinderGeometry(0.28, 0.6, len, 6); b.translate(0, len / 2, 0); b.rotateZ(th); b.rotateY(a);
        put('plank', b, 0x4a3c2e, x, y + 6.2, z, 0, 1);
        const reach = len * Math.sin(th);
        const bx = x - Math.cos(a) * reach, by = y + 6.2 + len * Math.cos(th) + 0.8, bz = z + Math.sin(a) * reach;
        // 잎 덩어리: 작은 뭉치 여러 개, 위는 밝고 아래는 어둡게
        for (let k = 0; k < 5; k++) {
          const lr = 1.5 + rnd() * 0.9;
          const cr = new THREE.IcosahedronGeometry(lr, 1); cr.scale(1, 0.7, 1);
          GEO.shadeY(put('trim', cr, [0x5a8a3e, 0x6a9a48, 0x4e7e36, 0x74a452][(i + k) % 4], bx + (rnd() - 0.5) * 3.2, by + (rnd() - 0.3) * 1.6, bz + (rnd() - 0.5) * 3.2, rnd() * 6, 1), 0.62, 1.12);
        }
      }
      for (let k = 0; k < 7; k++) {
        const lr = 2 + rnd();
        const cr = new THREE.IcosahedronGeometry(lr, 1); cr.scale(1, 0.7, 1);
        const a2 = k / 7 * 6.28;
        GEO.shadeY(put('trim', cr, [0x6a9a48, 0x5a8a3e, 0x74a452][k % 3], x + Math.cos(a2) * 2.2, y + 11 + (k % 2) * 1.2, z + Math.sin(a2) * 2.2, a2, 1), 0.62, 1.12);
      }
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; const g = new THREE.CylinderGeometry(0.15, 0.4, 2.8, 5); g.rotateZ(1.25); g.rotateY(a); put('plank', g, 0x4a3c2e, x + Math.cos(-a) * 1.6, y + 0.1, z + Math.sin(-a) * 1.6, 0, 1); }
      COL.circle(x, z, 1.9, y - 1, y + 9);
      // 둘러친 천 (오래된 나무에 소원 천을 매단다)
      for (let i = 0; i < 5; i++) put('trim', GEO.box(0.06, 0.5, 0.03), [0xb8342a, 0xf2ece0, 0xd8a040, 0xb8342a, 0x3a6a9a][i], x + Math.cos(i) * 2.0, y + 3.2 + i * 0.1, z + Math.sin(i) * 2.0, i, 1);
    }
    // 들소 관찰대 — 계단으로 오르는 지붕 달린 단
    {
      const { x, z } = P.hide, ry = -2.2, H = 2.7;
      const y = TER.H(x, z);
      const L = local(x, z, ry);
      for (const [ox, oz] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) { const [px, pz] = L(ox, oz); put('plank', GEO.cyl(0.12, 0.14, H + 2.4, 6), D, px, y - 0.3, pz, 0, 1); COL.circle(px, pz, 0.2, y - 1, y + H + 2); }
      put('plank', GEO.box(3.2, 0.16, 3.2), PL, x, y + H, z, ry, 1);
      COL.box(x, z, 1.6, 1.6, -ry, y + H - 0.4, y + H + 0.08).top = true;
      for (const [ox, oz, w, d] of [[0, 1.55, 3.2, 0.1], [-1.55, 0, 0.1, 3.2], [1.55, 0, 0.1, 3.2]]) {
        const [px, pz] = L(ox, oz); put('plank', GEO.box(w, 1.0, d, 0, 0.5, 0), W, px, y + H + 0.08, pz, ry, 1);
        COL.box(px, pz, w / 2 + 0.02, d / 2 + 0.06, -ry, y + H, y + H + 1.1);
      }
      const rf = new THREE.ConeGeometry(2.8, 1.2, 4); rf.rotateY(Math.PI / 4);
      put('roof', rf.translate(0, H + 2.6, 0), 0x6a5a4a, x, y, z, ry, 1);
      // 계단 (앞쪽 -z 로 내려간다)
      const steps = Math.ceil(H / 0.3);
      for (let k = 0; k < steps; k++) {
        const top = y + H - (k + 1) * (H / steps) + 0.02;
        const [px, pz] = L(0, -1.8 - k * 0.42);
        const gh = TER.H(px, pz);
        if (top < gh) break;
        put('plank', GEO.box(1.1, 0.1, 0.42), PL, px, top - 0.05, pz, ry, 1);
        COL.box(px, pz, 0.55, 0.21, -ry, gh - 1, top).top = true;
      }
      for (const sx of [-0.6, 0.6]) {
        const [a1, b1] = L(sx, -1.6);
        const g = new THREE.BoxGeometry(0.08, 0.08, steps * 0.44); g.rotateX(-Math.atan2(H, steps * 0.42));
        const [mx, mz] = L(sx, -1.6 - steps * 0.21);
        put('plank', g.translate(0, 0.9, 0), D, mx, y + H / 2, mz, ry, 1);
      }
    }
    // 늪 오두막 — 기둥 위 작은 집
    {
      const { x, z } = P.shack, ry = 1.1, y = Math.max(TER.H(x, z), 0) + 1.0;
      const L = local(x, z, ry);
      for (const [ox, oz] of [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4]]) { const [px, pz] = L(ox, oz); put('plank', GEO.cyl(0.13, 0.16, 3.2, 6), D, px, y - 2.2, pz, 0, 1); COL.circle(px, pz, 0.22, y - 3, y); }
      put('plank', GEO.box(3.8, 0.15, 3.4), PL, x, y, z, ry, 1);
      put('wall', GEO.box(3.2, 2.2, 2.8, 0, 1.15, 0), 0x6a5a48, x, y, z, ry, 1.6);
      const rf = prism(3.8, 1.3, 3.4); put('roof', rf.translate(0, 2.25, 0), 0x5a5a4a, x, y, z, ry + Math.PI / 2, 1);
      const [dx, dz] = L(0, -1.41); put('plank', GEO.box(0.9, 1.7, 0.06, 0, 0.95, 0), 0x3a2a1e, dx, y, dz, ry);
      const [wx, wz] = L(1.61, 0); put('glass', GEO.box(0.06, 0.6, 0.7, 0, 1.4, 0), 0x2a3a4a, wx, y, wz, ry);
      COL.box(x, z, 1.9, 1.7, -ry, y - 3, y + 3.4);
      // 사다리
      for (let k = 0; k < 4; k++) { const [px, pz] = L(0, -1.9 - k * 0.05); put('plank', GEO.box(0.8, 0.05, 0.06), W, px, y - 0.25 - k * 0.3, pz, ry); }
      // 매달린 그물과 장대
      const [nx, nz] = L(-2.4, 0.5), ny = TER.H(nx, nz);
      put('plank', GEO.cyl(0.05, 0.05, 2.2, 4), D, nx, ny, nz, 0, 1);
      put('trim', GEO.box(0.03, 1.0, 0.8, 0, 1.4, 0), 0xb8b098, nx, ny, nz, ry, 1);
    }
    // 호수 섬 — 나무 십자가와 벤치
    {
      const { x, z } = P.island, y = TER.H(x, z);
      put('plank', GEO.box(0.2, 3.2, 0.2, 0, 1.6, 0), 0x6a5238, x + 2, y, z - 1, 0.5);
      put('plank', GEO.box(1.4, 0.18, 0.18, 0, 2.4, 0), 0x6a5238, x + 2, y, z - 1, 0.5);
      put('trim', GEO.box(0.5, 0.9, 0.02, 0, 2.0, 0.12), 0xf2ece0, x + 2, y, z - 1, 0.5);
      COL.circle(x + 2, z - 1, 0.25, y - 1, y + 3.2);
      put('plank', GEO.box(1.8, 0.08, 0.45, 0, 0.45, 0), PL, x - 1.5, TER.H(x - 1.5, z + 1.5), z + 1.5, 0.5);
      for (const sx of [-0.75, 0.75]) put('plank', GEO.box(0.08, 0.45, 0.4, sx, 0.22, 0), D, x - 1.5, TER.H(x - 1.5, z + 1.5), z + 1.5, 0.5);
    }
    signposts(scene);
  }

  // 이정표 — 장터 앞 큰 이정표(마을에서 나가는 길 6갈래)와 소나무 숲 갈림길
  function signArm(scene, x, y, z, ang, text, icon) {
    const mk = (tipRight) => {
      const c = GEO.canvas(512, 96), g = c.getContext('2d');
      g.fillStyle = '#e8dcc0';
      g.beginPath();
      if (tipRight) { g.moveTo(0, 6); g.lineTo(440, 6); g.lineTo(508, 48); g.lineTo(440, 90); g.lineTo(0, 90); }
      else { g.moveTo(512, 6); g.lineTo(72, 6); g.lineTo(4, 48); g.lineTo(72, 90); g.lineTo(512, 90); }
      g.closePath(); g.fill();
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#b8342a'; g.fillRect(tipRight ? 14 : 86, 14, 6, 68);
      g.font = '52px "Ria", sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'center';
      g.fillStyle = '#2a2018';
      const cx = tipRight ? 236 : 276;
      g.fillText(icon + ' ' + text, cx, 52, 380);
      return GEO.tex(c);
    };
    const edge = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 });
    const front = new THREE.MeshStandardMaterial({ map: mk(true), roughness: 0.9, transparent: true, alphaTest: 0.5 });
    const back = new THREE.MeshStandardMaterial({ map: mk(false), roughness: 0.9, transparent: true, alphaTest: 0.5 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.41, 0.04), [edge, edge, edge, edge, front, back]);
    m.position.set(x + Math.sin(ang) * 1.12, y, z + Math.cos(ang) * 1.12);
    m.rotation.y = ang - Math.PI / 2;
    m.castShadow = true;
    scene.add(m);
    SIGNS.push({ m });
  }
  function signpost(scene, x, z, arms) {
    const y = TER.H(x, z);
    put('plank', GEO.cyl(0.1, 0.13, 4.2, 6), 0x6a5238, x, y - 0.1, z, 0, 1);
    put('roof', new THREE.ConeGeometry(0.22, 0.3, 6).translate(0, 4.2, 0), 0x6a5a4a, x, y - 0.1, z, 0, 1);
    COL.circle(x, z, 0.2, y - 1, y + 4);
    arms.forEach((a, i) => signArm(scene, x, y + 3.6 - i * 0.48, z, a.ang, a.text, a.icon));
  }
  function signposts(scene) {
    const L = U.L;
    const R = TER.ROADS;
    const dir = (r, k) => { const [ax, az] = R[r][k || 0], [bx, bz] = R[r][(k || 0) + 1]; return Math.atan2(bx - ax, bz - az); };
    signpost(scene, Z.market.x - 4.5, Z.market.z + 9.5, [
      { ang: dir(2), text: L('소나무 숲', 'Pine Forest'), icon: '🌲' },
      { ang: dir(0), text: L('자작나무 숲', 'Birch Forest'), icon: '🌳' },
      { ang: dir(6), text: L('호수', 'Lake'), icon: '⛵' },
      { ang: dir(1), text: L('쿠팔라 들판', 'Kupala Field'), icon: '🔥' },
      { ang: dir(5), text: L('미르 성', 'Mir Castle'), icon: '🏰' },
      { ang: dir(4), text: L('늪', 'Swamp'), icon: '🐸' },
    ]);
    // 소나무 숲 길과 원시림 길이 갈리는 곳
    const [jx, jz] = R[3][0];
    signpost(scene, jx + 2.6, jz + 2.2, [
      { ang: dir(2, 2), text: L('소나무 숲', 'Pine Forest'), icon: '🌲' },
      { ang: dir(3), text: L('원시림', 'Old Forest'), icon: '🦬' },
      { ang: dir(2, 1) + Math.PI, text: L('마을', 'Village'), icon: '🏠' },
    ]);
  }

  // 간판 (벨라루스 말)
  function sign(x, z, ry, text, icon, h, sc, oneSide) {
    const c = GEO.canvas(512, 160), g = c.getContext('2d');
    g.fillStyle = '#f2ead8'; g.fillRect(0, 0, 512, 160);
    g.strokeStyle = '#6a4a2a'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 150);
    g.fillStyle = '#b8342a'; g.fillRect(14, 14, 484, 12); g.fillRect(14, 134, 484, 12);
    // 벨라루스 수놓은 무늬 흉내 (마름모)
    g.fillStyle = '#b8342a';
    for (let i = 0; i < 12; i++) { const cx = 30 + i * 41; g.beginPath(); g.moveTo(cx, 20); g.lineTo(cx + 6, 26); g.lineTo(cx, 32); g.lineTo(cx - 6, 26); g.fill(); }
    g.font = '64px "Ria", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(icon, 70, 82);
    g.fillStyle = '#2a2018'; g.font = 'bold 64px Georgia, serif';
    g.fillText(text, 290, 84);
    const t = GEO.tex(c);
    // 앞뒤 양면 — 한쪽 면만 그리면 뒤쪽(길 쪽)에서 투명해 안 보였다 (사장님 2026-09-27 "간판자체가 없어")
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
    const w = sc ? 2.6 * sc : 2.6, hh = sc ? 0.81 * sc : 0.81;
    const m = new THREE.Group();
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mat); m.add(f);
    if (!oneSide) { const bk = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mat); bk.rotation.y = Math.PI; bk.position.z = -0.01; m.add(bk); }
    const y = TER.H(x, z);
    m.position.set(x, y + (h || 3.2), z);
    m.rotation.y = ry;
    SIGNS.push({ m, text, icon, t, c });
    return m;
  }

  // 늪 널길
  function boardwalks() {
    for (const l of TER.BOARDS) {
      for (let i = 0; i < l.length - 1; i++) {
        const [ax, az] = l[i], [bx, bz] = l[i + 1];
        const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
        const n = Math.ceil(len / 0.45);
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n, x = U.lerp(ax, bx, t), z = U.lerp(az, bz, t);
          put('plank', GEO.box(1.9, 0.08, 0.38, (rnd() - 0.5) * 0.08, 0, 0), rnd() < 0.2 ? 0x7a6a54 : 0x9a8466, x, BOARD_Y, z, ry + (rnd() - 0.5) * 0.04, 1);
          if (k % 5 === 0) for (const sd of [-0.85, 0.85]) {
            const px = x + Math.cos(ry) * sd, pz = z - Math.sin(ry) * sd;
            put('plank', GEO.cyl(0.08, 0.08, 1.8, 5), 0x5a4a38, px, BOARD_Y - 1.6, pz, 0, 1);
          }
        }
      }
    }
  }
  const BOARD_Y = 0.42;

  // 모닥불 자리 (쿠팔라 밤에 불이 붙는다)
  function bonfire(x, z) {
    const y = TER.H(x, z);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * 6.28;
      const g = new THREE.CylinderGeometry(0.1, 0.13, 3.4, 5);
      g.translate(0, 1.7, 0);
      g.rotateZ(0.35); g.rotateY(a);
      put('plank', g, 0x6a5238, x, y - 0.1, z, 0, 1);
    }
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * 6.28;
      put('stone', new THREE.IcosahedronGeometry(0.3, 0), 0x8a8478, x + Math.cos(a) * 2.2, y, z + Math.sin(a) * 2.2, a, 1);
    }
    // 둘러앉는 통나무
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 6.28 + 0.3;
      const g = new THREE.CylinderGeometry(0.28, 0.28, 2.4, 8); g.rotateZ(Math.PI / 2);
      put('plank', g, 0x7a5a3a, x + Math.cos(a) * 5, y + 0.25, z + Math.sin(a) * 5, -a + Math.PI / 2, 1);
    }
    COL.circle(x, z, 1.6, y - 1, y + 3);
    // 불꽃 (처음엔 숨김)
    fireGroup = new THREE.Group();
    fireGroup.position.set(x, y + 0.4, z);
    fireGroup.visible = false;
    const light = new THREE.PointLight(0xff9a40, 0, 30, 1.6);
    light.position.y = 2;
    fireGroup.add(light);
    fireGroup.userData.light = light;
    const ft = fireTex();
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      s.userData.ph = rnd() * 6.28; s.userData.sp = 0.7 + rnd() * 0.6;
      fireGroup.add(s);
    }
    return fireGroup;
  }
  function fireTex() {
    const c = GEO.canvas(64), g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 36, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,250,210,1)'); gr.addColorStop(0.35, 'rgba(255,170,60,.9)'); gr.addColorStop(0.7, 'rgba(220,70,20,.35)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return GEO.tex(c);
  }

  // 미르 성 — 붉은 벽돌, 흰 돌 띠, 네 귀 탑 + 문탑
  function castle(cx, cz) {
    const y = 16.2;
    const S = 19;   // 반폭
    const wallH = 8.5;
    const walls = [
      [cx, cz - S, S, 0.9, 0], [cx, cz + S, S, 0.9, 0], [cx - S, cz, 0.9, S, 0], [cx + S, cz, 0.9, S, 0],
    ];
    for (const [x, z, hw, hd] of walls) {
      if (z === cz - S) {   // 북쪽 벽에는 문이 있다 (문탑 사이로 드나든다)
        for (const sd of [-1, 1]) {
          const w2 = (hw - 3.5) / 2, mx = x + sd * (3.5 + w2);
          put('brick', GEO.box(w2 * 2, wallH, hd * 2, 0, wallH / 2, 0), 0xffffff, mx, y - 0.5, z, 0, 2);
          put('stone', GEO.box(w2 * 2 + 0.1, 0.4, hd * 2 + 0.2, 0, wallH + 0.1, 0), 0xe8e2d6, mx, y - 0.5, z, 0, 2);
          COL.box(mx, z, w2, hd, 0, y - 3, y + wallH);
        }
      } else {
        put('brick', GEO.box(hw * 2, wallH, hd * 2, 0, wallH / 2, 0), 0xffffff, x, y - 0.5, z, 0, 2);
        put('stone', GEO.box(hw * 2 + 0.1, 0.4, hd * 2 + 0.2, 0, wallH + 0.1, 0), 0xe8e2d6, x, y - 0.5, z, 0, 2);
        COL.box(x, z, hw, hd, 0, y - 3, y + wallH);
      }
      // 총안(톱니)은 성벽 위 길을 가로막아 뺌 (사장님 2026-09-19 "여기 벽돌을 지워")
    }
    // 탑
    const tower = (x, z, w, h, roofCol) => {
      put('stone', GEO.box(w + 0.4, 1.4, w + 0.4, 0, 0.2, 0), 0xe0dace, x, y - 1, z, 0, 2);
      put('brick', GEO.box(w, h, w, 0, h / 2, 0), 0xffffff, x, y - 0.5, z, 0, 2);
      // 흰 돌 띠와 모서리 돌
      for (let k = 1; k < 4; k++) put('stone', GEO.box(w + 0.15, 0.35, w + 0.15, 0, h * k / 4, 0), 0xefe9dc, x, y - 0.5, z, 0, 2);
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) put('stone', GEO.box(0.35, h, 0.35, ox * w / 2, h / 2, oz * w / 2), 0xefe9dc, x, y - 0.5, z, 0, 2);
      // 창 (좁고 긴)
      for (let k = 0; k < 3; k++) for (const [ox, oz, fr] of [[0, -w / 2 - 0.02, 0], [0, w / 2 + 0.02, 0], [-w / 2 - 0.02, 0, 1], [w / 2 + 0.02, 0, 1]]) {
        put('glass', GEO.box(fr ? 0.05 : 0.5, 1.4, fr ? 0.5 : 0.05, ox, h * (k + 0.55) / 4, oz), 0x1a2028, x, y - 0.5, z, 0);
      }
      // 첨탑 지붕
      const rf = new THREE.ConeGeometry(w * 0.78, w * 1.35, 4);
      rf.rotateY(Math.PI / 4);
      put('roof', rf.translate(0, h + w * 0.67, 0), roofCol, x, y - 0.5, z, 0, 1);
      put('trim', GEO.cyl(0.07, 0.07, 1.8, 4, 0, h + w * 1.3, 0), 0xe8c060, x, y - 0.5, z, 0);
      COL.box(x, z, w / 2 + 0.2, w / 2 + 0.2, 0, y - 3, y + h + 5);
      return { top: y - 0.5 + h };
    };
    const tt = [];
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) tt.push(tower(cx + ox * S, cz + oz * S, 6.5, 17 + (ox + oz === 0 ? 2 : 0), 0x3f6a4a));
    // 문탑 (가운데가 뚫렸다)
    const gx = cx, gz = cz - S;
    for (const sd of [-1, 1]) {
      put('brick', GEO.box(2.2, 22, 7, sd * 2.4, 11, 0), 0xffffff, gx, y - 0.5, gz, 0, 2);
      COL.box(gx + sd * 2.4, gz, 1.1, 3.5, 0, y - 3, y + 22);
    }
    put('brick', GEO.box(7, 13, 7, 0, 15.5, 0), 0xffffff, gx, y - 0.5, gz, 0, 2);
    for (let k = 0; k < 4; k++) put('stone', GEO.box(7.2, 0.35, 7.2, 0, 10 + k * 3.4, 0), 0xefe9dc, gx, y - 0.5, gz, 0, 2);
    // 아치 윗돌
    put('stone', GEO.box(2.8, 0.6, 7.1, 0, 8.9, 0), 0xe0dace, gx, y - 0.5, gz, 0, 2);
    const rf = new THREE.ConeGeometry(5.2, 7.5, 4); rf.rotateY(Math.PI / 4);
    put('roof', rf.translate(0, 22 + 3.75, 0), 0x3f6a4a, gx, y - 0.5, gz, 0, 1);
    put('trim', onion(1.0, 2.0).translate(0, 29.2, 0), 0x3f6a4a, gx, y - 0.5, gz, 0);
    put('trim', GEO.cyl(0.07, 0.07, 1.6, 4, 0, 31.1, 0), 0xe8c060, gx, y - 0.5, gz, 0);
    // 안뜰 궁전 (남쪽)
    put('stone', GEO.box(24, 11, 9, 0, 5.5, 0), 0xf0e8d8, cx, y - 0.5, cz + 11.5, 0, 2);
    for (let i = 0; i < 8; i++) for (let k = 0; k < 2; k++) put('glass', GEO.box(1.0, 1.8, 0.05, -10.5 + i * 3, 2.8 + k * 4, -4.53), 0x2a3a4a, cx, y - 0.5, cz + 11.5, 0);
    for (const sd of [-1, 1]) { const g = new THREE.BoxGeometry(5.2, 0.2, 25); g.translate(sd * 2.6, 0, 0); g.rotateZ(sd * -0.6); g.rotateY(Math.PI / 2); put('roof', g.translate(0, 14, 0), 0x8a3a2a, cx, y - 0.5, cz + 11.5, 0, 1.5); }
    for (const sd of [-1, 1]) { const g = prism(9, 3.0, 0.2); g.rotateY(Math.PI / 2); put('stone', g, 0xf0e8d8, cx + sd * 12, y + 10.5, cz + 11.5, 0, 2); }
    COL.box(cx, cz + 11.5, 12, 4.5, 0, y - 3, y + 14);
    // 둥지는 북동 탑 꼭대기
    return tt;
  }

  // 그루터기·쓰러진 통나무·바위
  function forestBits() {
    const push = (k, x, z) => {
      const y = TER.H(x, z);
      if (k === 'stump') {
        put('plank', GEO.cyl(0.55, 0.7, 0.7, 9), 0x6a5238, x, y - 0.1, z, rnd() * 6, 1);
        put('trim', new THREE.CylinderGeometry(0.5, 0.5, 0.05, 12).translate(0, 0.62, 0), 0xc8a878, x, y - 0.1, z, 0);
        COL.circle(x, z, 0.65, y - 1, y + 0.62);
        STUMPS.push({ x, y: y + 0.55, z });
      } else if (k === 'log') {
        rnd(); rnd();   // 누운 긴 통나무는 지웠다 (사장님 2026-09-25 "긴나무는 아예 지워버려") — 난수 순서는 그대로
      } else {
        const s = 0.6 + rnd() * 1.4;
        const g = new THREE.IcosahedronGeometry(s, 1);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + (rnd() - 0.5) * 0.35), p.getY(i) * 0.7, p.getZ(i) * (1 + (rnd() - 0.5) * 0.35));
        g.computeVertexNormals();
        put('stone', g, 0x8a8a80, x, y + s * 0.15, z, rnd() * 6, 1);
        COL.circle(x, z, s * 0.9, y - 1, y + s * 0.8);
      }
    };
    let tries = 0, st = 0;
    while (st < 90 && tries++ < 4000) {
      const x = (rnd() - 0.5) * 304, z = (rnd() - 0.5) * 304;
      const f = TER.forest(x, z);
      if (!f || f.k === 'meadow' || f.k === 'spruce' || f.k === 'swamp') continue;
      if (FLORA.treeNear(x, z, 2.2) || TER.H(x, z) < 0.3) continue;
      push(rnd() < 0.55 ? 'stump' : (rnd() < 0.6 ? 'log' : 'rock'), x, z);
      st++;
    }
    for (let i = 0; i < 40; i++) {
      const x = (rnd() - 0.5) * 304, z = (rnd() - 0.5) * 304;
      if (TER.inField(x, z, 4) || TER.roadD(x, z) < 4 || TER.H(x, z) < 0.5 || FLORA.treeNear(x, z, 2)) continue;
      if (Math.hypot(x - Z.village.x, z - Z.village.z) < 50) continue;
      push('rock', x, z);
    }
  }

  // 벌통 (나무 상자 벌통, 기둥 위)
  function hive(x0, z0) {   // 나무·물·집·길을 비켜 선다 (2026-09-18 집을 옮기고 벌통이 표도르네 집 안에 들어가 있었다)
    let x = x0, z = z0;
    for (let k = 0; k < 40 && (FLORA.treeNear(x, z, 2.5) || TER.H(x, z) < 0.5 || COL.inside(x, TER.H(x, z) + 0.6, z, 2.5) || TER.roadD(x, z) < 3); k++) { x = x0 + (rnd() - 0.5) * 30; z = z0 + (rnd() - 0.5) * 30; }
    const y = TER.H(x, z), ry = rnd() * 6.28;
    const col = [0x4f7ab8, 0xd8a040, 0x5a9a5a][HIVES.length % 3];
    for (const [ox, oz] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]) put('plank', GEO.box(0.08, 0.5, 0.08, ox, 0.25, oz), 0x5a4a38, x, y, z, ry);
    put('plank', GEO.box(0.7, 0.75, 0.6, 0, 0.88, 0), col, x, y, z, ry, 1);
    put('trim', GEO.box(0.72, 0.04, 0.62, 0, 0.72, 0), 0xf0ead8, x, y, z, ry);
    put('trim', GEO.box(0.72, 0.04, 0.62, 0, 1.0, 0), 0xf0ead8, x, y, z, ry);
    put('trim', GEO.box(0.3, 0.04, 0.05, 0, 0.56, 0.31), 0x1a1410, x, y, z, ry);
    const rf = new THREE.ConeGeometry(0.62, 0.3, 4); rf.rotateY(Math.PI / 4);
    put('roof', rf.translate(0, 1.4, 0), 0x6a5a4a, x, y, z, ry, 0.6);
    COL.circle(x, z, 0.45, y - 1, y + 1.5);
    HIVES.push({ x, z, y });
  }

  function village() {
    const V = Z.village;
    // 집들: 큰길 양옆에 줄지어
    // 사는 집 5채는 장터 둘레 길과 길 사이에 한 채씩, 문은 장터 쪽 (사장님 2026-09-18 "맵이 이렇게 넓은데 굳이 집 3채를 붙여서 지어야 했냐")
    //   나머지 9칸은 집을 안 짓고 둥지 기둥 자리로만 쓴다
    const spots = [
      [-21.4, 19.5, -0.78], [-21.7, -28.2, -2.28], [4, 30, 0.00], [-15, 46, -0.2], [14, 38, 3.2],
      [18, 50, 3.0], [29.8, 19.1, 0.80], [-29, 25, 1.4], [-30, 40, 1.7], [-4, 54, 1.55],
      [9, 65, 1.3], [-25, 56, 0.9], [31, 32, 2.9], [17.5, -20.7, 2.40],
    ];
    // 장터에서 제일 가까운 집 = 주인공(할머니)네, 다음 4채 = 부탁 집 (사장님: 할머니 포함 5명·5채)
    //   나머지 9자리는 비운다 (사장님 2026-09-17 "미션 없는 집은 없애자"). 난수 순서는 집을 지은 것과 똑같이 소비한다
    const M = Z.market;
    const order = spots.map((p, i) => i).sort((a, b) => Math.hypot(V.x + spots[a][0] - M.x, V.z + spots[a][1] - M.z) - Math.hypot(V.x + spots[b][0] - M.x, V.z + spots[b][1] - M.z));
    const role = {};
    order.forEach((k, n) => { role[k] = n === 0 ? 'home' : (n <= 4 ? 'q' + (n - 1) : 'closed'); });
    const houses = [];
    spots.forEach(([ox, oz, ry], k) => {
      const x = V.x + ox, z = V.z + oz;
      const w = 6 + rnd() * 1.5, d = 8 + rnd() * 2.5;
      if (role[k] === 'closed') { rnd(); rnd(); rnd(); rnd(); houses.push({ x, z, ry, w, d, h: null }); return; }
      const h = house(x, z, ry, w, d, { closed: true, chimney: true });
      h.role = role[k];
      if (role[k] === 'home') { HOME.h = h; outdoorKitchen(h); }
      else if (role[k] !== 'closed') QHOUSES[+role[k].slice(1)] = h;
      houses.push({ x, z, ry, w, d, h });
      // 앞마당 울타리
      const L = local(x, z, ry);
      const a = L(w / 2 + 3.5, -d / 2 - 1.5), b = L(w / 2 + 3.5, d / 2 + 1.5);
      fence(a[0], a[1], b[0], b[1]);
      if (rnd() < 0.6) {   // 해바라기 몇 그루
        for (let j = 0; j < 4; j++) {
          const [sx, sz] = L(w / 2 + 2.2, -d / 2 + 1 + j * 1.3);
          sunflower(sx, sz);
        }
      }
    });
    // 교회
    church(V.x - 30, V.z - 14, 0.6);
    // 가판은 장터가 아니라 집 앞에 (사장님 2026-09-19 "표도르 아저씨는 물건을 사 주는 사람으로 배치하고 가판을 아저씨 집 앞으로, 물건 판매는 추리닝 입은 아이 집 앞")
    //   QHOUSES[0] = 표도르(사기: РЫНОК) · QHOUSES[2] = 얀카(팔기: ЛАВКА). 찻집은 기능이 없어 뺐다
    const frontStall = (h, awn, txt, icon) => {
      if (!h) return null;
      const [sx, sz] = h.L(1.4, -(h.d / 2 + 4.6));           // 문 앞마당, 한쪽으로 비켜서
      const ry = h.ry + Math.PI;                              // 집을 마주 본다
      stall(sx, sz, ry, awn);
      const SL = local(sx, sz, ry);
      // 차양 앞 끝(손님 쪽이 높다)에 세운 양면 간판 + 계산대 앞판에 붙인 작은 간판 — 가까이 서면 차양 간판은 화면 위로 벗어난다
      const [gx, gz] = SL(0, -1.3); T.scene.add(sign(gx, gz, ry + Math.PI, txt, icon, 3.5));
      const [fx, fz] = SL(0, -0.67); T.scene.add(sign(fx, fz, ry + Math.PI, txt, icon, 0.5, 0.72, true));
      const [bx, bz] = SL(0, 1.5);                            // 주인이 서는 자리 (가판 뒤)
      const [px, pz] = SL(0, -1.9);                           // 손님이 서는 자리
      return { x: px, z: pz, ry: ry + Math.PI, keep: { x: bx, z: bz, yaw: ry } };
    };
    NPCSPOT.seller = frontStall(QHOUSES[0], 0xc0392b, 'РЫНОК', '🍄');   // 표도르: 물건을 사 준다 · 간판은 러시아어 (사장님 2026-09-27, 옛 벨라루스어 РЫНАК)
    NPCSPOT.shop = frontStall(QHOUSES[2], 0x2e7d4a, 'ЛАВКА', '🧺');      // 얀카: 물건을 판다 · 러시아어 (옛 벨라루스어 КРАМА)
    if (NPCSPOT.seller) NPCSPOT.farmer = NPCSPOT.seller.keep;
    if (NPCSPOT.shop) NPCSPOT.yanka = NPCSPOT.shop.keep;
    flowerGarden(QHOUSES[1]);   // 알레샤네 (quests.js: 표도르 0 · 알레샤 1 · 얀카 2 · 미하스 3)
    bisonPen();
    // 두레박·건초
    wellCrane(V.x + 9.3, V.z + 8);
    wellCrane(V.x - 26.7, V.z + 37.3);    // 옛 자리(-40, 108)는 호밀밭 안이라 호밀이 우물을 뚫고 자랐다 (2026-09-17)
    for (const f of TER.FIELDS) {
      if (f.k === 'rye' || f.k === 'potato') for (let i = 0; i < 2; i++) haystack(f.x + f.c * (i - 0.5) * f.w * 0.9 + f.s * (f.h / 2 + 5), f.z + f.s * (i - 0.5) * f.w * 0.9 - f.c * (f.h / 2 + 5), 0.9 + rnd() * 0.3);
    }
    return houses;
  }

  // 알레샤네 앞마당 꽃밭 (사장님 2026-09-27 "알레샤집앞에 꽃밭정원을 만들어줘 여자애집이니까")
  //   현관 계단 양옆 화단 둘 + 앞마당 화단 하나, 낮은 흰 울타리. 꽃은 튤립·데이지·양귀비·수레국화(벨라루스 나라꽃)·접시꽃
  //   자기 난수를 따로 쓴다 — 전역 rnd 를 쓰면 뒤에 짓는 것들 자리가 바뀐다
  function flowerGarden(h) {
    if (!h) return;
    const R = U.mulberry(5151), { w, d, ry, L } = h;
    const DX = -w * 0.15;
    const at = (key, g, col, lx, lz, ly, rot) => { const [x, z] = L(lx, lz); put(key, g, col, x, TER.H(x, z) + ly, z, ry + (rot || 0)); };
    const FL = [
      { k: 'tulip', c: [0xe0303a, 0xf07aa0, 0xf6d23a, 0xffffff] },
      { k: 'daisy', c: [0xffffff] },
      { k: 'poppy', c: [0xd8201c] },
      { k: 'corn', c: [0x3a6ae0, 0x5a86f0] },
      { k: 'mallow', c: [0xe86aa8, 0xc83a7a, 0xf4b8d0] },
    ];
    function flower(lx, lz, f, col) {
      const tall = f.k === 'mallow' ? 0.7 + R() * 0.3 : 0.16 + R() * 0.14;
      at('trim', GEO.cyl(0.01, 0.013, tall, 4), 0x4a8a30, lx, lz, 0.12);
      const y = 0.12 + tall, S = 1.6;   // 꽃송이는 멀리서도 보이게 크게
      if (f.k === 'tulip') { at('trim', new THREE.CylinderGeometry(0.045 * S, 0.028 * S, 0.09 * S, 6, 1, true), col, lx, lz, y); at('trim', new THREE.CircleGeometry(0.028 * S, 6).rotateX(Math.PI / 2), col, lx, lz, y - 0.04 * S); }
      else if (f.k === 'daisy') { at('trim', new THREE.CylinderGeometry(0.055 * S, 0.055 * S, 0.01, 10), col, lx, lz, y); at('trim', new THREE.SphereGeometry(0.022 * S, 6, 4).scale(1, 0.5, 1), 0xf0c020, lx, lz, y + 0.01); }
      else if (f.k === 'poppy') { at('trim', new THREE.CylinderGeometry(0.055 * S, 0.03 * S, 0.035 * S, 7), col, lx, lz, y); at('trim', new THREE.SphereGeometry(0.016 * S, 5, 3), 0x1a1410, lx, lz, y + 0.03); }
      else if (f.k === 'corn') { at('trim', new THREE.IcosahedronGeometry(0.038 * S, 0).scale(1, 0.7, 1), col, lx, lz, y); }
      else { for (let i = 0; i < 4; i++) at('trim', new THREE.CylinderGeometry(0.05 * S, 0.05 * S, 0.014, 7), col, lx, lz, y - i * 0.15, R()); }
    }
    // 잎 덤불 — 꽃 아래를 초록으로 덮어 화단이 꽉 차 보이게
    function bush(lx, lz) {
      const g = new THREE.IcosahedronGeometry(0.11 + R() * 0.04, 0); g.scale(1.2, 0.55 + R() * 0.25, 1.2);
      at('trim', g, [0x3f7a2c, 0x4a8a34, 0x356a26][(R() * 3) | 0], lx, lz, 0.13, R() * 3);
    }
    function bed(x0, x1, z0, z1) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, bw = x1 - x0, bd = z1 - z0;
      at('trim', GEO.box(bw, 0.14, bd), 0x4a3424, cx, cz, 0.02);              // 흙 (땅보다 도톰하게 — 같은 높이 두 면 번쩍임 방지)
      for (const [lx, lz, sx, sz] of [[cx, z0, bw + 0.08, 0.06], [cx, z1, bw + 0.08, 0.06], [x0, cz, 0.06, bd], [x1, cz, 0.06, bd]])
        at('plank', GEO.box(sx, 0.2, sz), 0xe8e2d4, lx, lz, 0.05);             // 흰 테두리 판
      const n = Math.max(2, Math.round(bw / 0.17)), m = Math.max(2, Math.round(bd / 0.17));
      for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
        const lx = x0 + (i + 0.5) * bw / n + (R() - 0.5) * 0.07, lz = z0 + (j + 0.5) * bd / m + (R() - 0.5) * 0.07;
        if ((i + j) % 2 === 0) bush(lx, lz);
        // 접시꽃(키 큰 꽃)은 벽 쪽 줄에만, 앞줄은 낮은 꽃
        const back = j === m - 1;
        const f = back ? FL[4] : FL[(R() * 4) | 0];
        flower(lx, lz, f, f.c[(R() * f.c.length) | 0]);
      }
    }
    // 현관 계단 왼쪽 · 오른쪽 (앞벽에 붙여서), 앞마당 (계단 길은 비운다)
    bed(-w / 2 + 0.25, DX - 1.15, -d / 2 - 1.35, -d / 2 - 0.35);
    bed(DX + 1.15, w / 2 - 0.25, -d / 2 - 1.35, -d / 2 - 0.35);
    bed(-w / 2 - 0.2, DX - 1.1, -d / 2 - 4.4, -d / 2 - 2.6);
    // 낮은 흰 울타리 — 앞마당 화단 둘레 왼쪽·앞쪽
    for (let lz = -d / 2 - 0.3; lz > -d / 2 - 4.8; lz -= 0.28) at('plank', GEO.box(0.05, 0.5, 0.07, 0, 0.25, 0), 0xf2eee4, -w / 2 - 0.55, lz, 0);
    for (let lx = -w / 2 - 0.55; lx < DX - 0.9; lx += 0.28) at('plank', GEO.box(0.07, 0.5, 0.05, 0, 0.25, 0), 0xf2eee4, lx, -d / 2 - 4.8, 0);
    for (const [lx, lz, sx, sz] of [[-w / 2 - 0.55, -d / 2 - 2.55, 0.03, 4.5], [(-w / 2 - 0.55 + DX - 0.9) / 2, -d / 2 - 4.8, DX - 0.9 + w / 2 + 0.55, 0.03]])
      for (const hy of [0.18, 0.38]) at('plank', GEO.box(sx, 0.04, sz, 0, hy, 0), 0xf2eee4, lx, lz, 0);
  }

  // 들소 목장 — 마을 남쪽, 원시림 가는 쪽의 빈 풀밭 (사장님 2026-10-01 "길들여진 들소를 모아놓는 공간")
  //   밭·숲·길·건물을 다 피하는 자리는 여기 하나였다 (미하스네 집 뒤는 아마밭). 길들인 들소는 여기서 지낸다 (animals.js)
  //   마을 쪽(북, z1) 가운데에 4m 문, 안쪽 구석에 건초더미와 여물통
  const PEN = { x0: 1, x1: 23, z0: -24, z1: -8, gate: [10, 14] };
  function bisonPen() {
    const P = PEN;
    fence(P.x0, P.z1, P.gate[0], P.z1); fence(P.gate[1], P.z1, P.x1, P.z1);   // 마을 쪽 (문)
    fence(P.x1, P.z1, P.x1, P.z0); fence(P.x1, P.z0, P.x0, P.z0); fence(P.x0, P.z0, P.x0, P.z1);
    for (const gx of P.gate) { const y = TER.H(gx, P.z1); put('plank', GEO.box(0.18, 1.6, 0.18, 0, 0.8, 0), 0x7a5a3a, gx, y - 0.1, P.z1, 0, 1); }   // 문기둥
    haystack(P.x1 - 3, P.z0 + 3, 0.75);
    { const x = P.x0 + 3.5, z = P.z0 + 2.2, y = TER.H(x, z);   // 여물통
      put('plank', GEO.box(2.4, 0.08, 0.7, 0, 0.45, 0), 0x7a5a3a, x, y, z, 0);
      for (const sx of [-1, 1]) put('plank', GEO.box(0.08, 0.35, 0.7, sx * 1.16, 0.65, 0), 0x7a5a3a, x, y, z, 0);
      for (const sz of [-1, 1]) put('plank', GEO.box(2.4, 0.35, 0.08, 0, 0.65, sz * 0.31), 0x7a5a3a, x, y, z, 0);
      put('trim', GEO.box(2.2, 0.12, 0.5, 0, 0.6, 0), 0xc8a860, x, y, z, 0);
      for (const [lx, lz] of [[-1.1, -0.3], [1.1, -0.3], [-1.1, 0.3], [1.1, 0.3]]) put('plank', GEO.box(0.1, 0.45, 0.1, lx, 0.22, lz), 0x6a4a30, x, y, z, 0);
      COL.box(x, z, 1.25, 0.4, 0, y - 1, y + 0.85); }
  }

  function sunflower(x, z) {
    const y = TER.H(x, z);
    put('trim', GEO.cyl(0.03, 0.04, 2.1, 4), 0x4a7a2c, x, y, z, 0);
    const head = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 12); head.rotateX(1.2);
    put('trim', head, 0x4a3018, x, y + 2.15, z + 0.05, 0);
    const pet = new THREE.CylinderGeometry(0.45, 0.45, 0.03, 14); pet.rotateX(1.2);
    put('trim', pet, 0xf0c020, x, y + 2.15, z + 0.03, 0);
    for (const sd of [-1, 1]) { const l = new THREE.SphereGeometry(0.2, 5, 3); l.scale(1.4, 0.2, 0.7); put('trim', l, 0x4f8a30, x + sd * 0.2, y + 1.1, z, 0); }
  }

  function nests(houses) {
    // 할머니네 지붕 1 · 들판 길가 기둥 7 · 교회 1 · 성 1 · 늪 마른나무 2 = 12
    //   (사장님 2026-09-18 "황새둥지도 더 넓게 배치해" — 마을에 8개 몰려 있던 것을 맵 전체로. 둥지끼리 46m 이상, 트인 풀밭 길가 3.5~14m)
    { const h = HOME.h;
      const [nx, nz] = h.ridgeA;
      put('plank', GEO.cyl(0.1, 0.12, 1.6, 5), 0x6a5a48, nx, h.top - 0.4, nz, 0, 1);
      nestAt(nx, h.top + 1.1, nz, false, 'roof'); }
    const poles = [[6, -138], [-98, -86], [110, -58], [-22, -66], [90, 26], [34, 66], [-22, 66]];
    for (const [x, z] of poles) nestAt(x, TER.H(x, z) + 8.5, z, true, 'pole');
    nestAt(Z.village.x - 30, TER.H(Z.village.x - 30, Z.village.z - 14) + 22, Z.village.z - 14, true, 'church');
    nestAt(Z.castle.x + 19, 16.2 - 0.5 + 19 + 8.9, Z.castle.z - 19, false, 'castle');
    for (const [x, z] of [[-120, 60], [-92, 24]]) {
      const y = TER.H(x, z);
      put('plank', GEO.cyl(0.22, 0.32, 7.5, 6), 0x7a7468, x, y - 0.3, z, 0, 1);
      COL.circle(x, z, 0.35, -9, y + 7.2);
      nestAt(x, y + 7.2, z, false, 'swamp');
    }
    // 성 탑 둥지 받침
  }

  const MATS = {};
  function build(scene) {
    const houses = village();
    nests(houses);
    boardwalks();
    forestBits();
    hive(-68, -44); hive(93.3, -40); hive(20, -116); hive(-24, -8);
    castle(Z.castle.x, Z.castle.z);
    scene.add(bonfire(Z.bonfire.x, Z.bonfire.z));
    placesBuild(scene);
    for (const c of CRANES) scene.add(c.root);

    const lt = logTex(), rt = roofTex(), bt = brickTex(), st = stoneTex(), pt = plankTex();
    MATS.wall = new THREE.MeshStandardMaterial({ map: lt, vertexColors: true, roughness: 0.92 });
    MATS.roof = new THREE.MeshStandardMaterial({ map: rt, vertexColors: true, roughness: 0.6, metalness: 0.25, side: THREE.DoubleSide });
    MATS.trim = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
    MATS.brick = new THREE.MeshStandardMaterial({ map: bt, vertexColors: true, roughness: 0.9 });
    MATS.stone = new THREE.MeshStandardMaterial({ map: st, vertexColors: true, roughness: 0.95 });
    MATS.plank = new THREE.MeshStandardMaterial({ map: pt, vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
    MATS.lamp = new THREE.MeshBasicMaterial({ vertexColors: true });
    winInMat = MATS.winIn = new THREE.MeshStandardMaterial({ color: 0x33485a, roughness: 0.3, emissive: 0xa8cce8, emissiveIntensity: 0.6 });
    glassMat = MATS.glass = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.15, metalness: 0.4, emissive: 0xffb050, emissiveIntensity: 0 });
    for (const lk in lists) {
      const k = lk.split('|')[0];
      const g = GEO.merge(lists[lk]);
      const m = new THREE.Mesh(g, MATS[k]);
      m.castShadow = k !== 'glass' && k !== 'lamp' && k !== 'winIn';
      m.userData.sh = m.castShadow;
      m.receiveShadow = true;
      const [ci, cj] = lk.split('|')[1].split(',').map(Number);
      m.userData.cx = -460 + (ci + 0.5) * 70; m.userData.cz = -460 + (cj + 0.5) * 70;
      scene.add(m);
      cells.push(m);
    }
  }

  // 밤에는 창에 불이 들어온다
  function inHouse(px, pz, py) {
    for (const h of HOUSES) {
      const dx = px - h.x, dz = pz - h.z, c = Math.cos(h.ry), s = Math.sin(h.ry);
      const u = dx * c - dz * s, v = dx * s + dz * c;
      if (Math.abs(u) < h.w / 2 && Math.abs(v) < h.d / 2 && py > h.floor - 0.3 && py < h.floor + 2.5) return h;
    }
    return null;
  }
  const cells = [];   // 70m 칸마다 합친 덩어리 — 멀면 안 그린다
  function update(dt, night) {
    if (window.PL) for (const m of cells) {
      const d = Math.hypot(m.userData.cx - PL.pos.x, m.userData.cz - PL.pos.z);
      m.visible = d < 300;
      m.castShadow = m.userData.sh && d < 110;   // 그림자는 가까운 칸만
    }
    if (sails) sails.rotation.z += dt * 0.5;
    craneUpdate(dt);
    if (glassMat) glassMat.emissiveIntensity = night * 1.6;
    if (winInMat) { winInMat.emissive.setRGB(U.lerp(0.66, 1.0, night), U.lerp(0.8, 0.62, night), U.lerp(0.91, 0.3, night)); winInMat.emissiveIntensity = U.lerp(0.6, 0.7, night); }
    // 실내 조명은 뺐다 — 집에 들어갈 일이 없고, 처음 켜질 때 모든 재질을 다시 짜느라 버벅였다 (사장님 2026-09-24)
    if (fireGroup && fireGroup.visible) {
      const t = T.time;
      fireGroup.userData.light.intensity = 40 + Math.sin(t * 13) * 6 + Math.sin(t * 7.3) * 5;
      fireGroup.children.forEach((s, i) => {
        if (!s.isSprite) return;
        const ph = (t * s.userData.sp + s.userData.ph) % 1;
        const a = s.userData.ph * 6;
        s.position.set(Math.cos(a) * 0.5 * (1 - ph), 0.6 + ph * 3.4, Math.sin(a) * 0.5 * (1 - ph));
        const k = (1 - ph) * 2.6 + 0.4;
        s.scale.set(k, k * 1.3, 1);
        s.material.opacity = Math.min(1, (1 - ph) * 1.6);
      });
    }
  }
  function lightFire(on) { if (fireGroup) fireGroup.visible = !!on; }

  function groundAt(x, z, y) {
    let g = TER.H(x, z);
    if (TER.boardD(x, z) < 1.0 && g < BOARD_Y + 0.05) g = BOARD_Y + 0.04;
    const t = COL.topAt(x, z, y == null ? g : y, 0.45);
    if (t > g) g = t;
    return g;
  }

  window.WORLD = { PEN, drawWater, WELLS, LOGS, HIVES, HOUSES, QHOUSES, HOME, inHouse, build, update, lightFire, groundAt, NESTS, STUMPS, NPCSPOT, SIGNS, BOARD_Y, onion, fireTex, get TOWER() { return TOWER; } };
})();
