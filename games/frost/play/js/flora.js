// flora.js — 나무·풀·고사리·밭 작물. 잎은 잎사귀 그림 판(카드)을 둥글게 모아 만든다.
(function () {
  const rnd = U.mulberry(515);
  const CH = 100;                 // 나무 덩어리 크기(m) — 맵 60% 뒤 60→100 (그리기 명령 줄이기) — 화면 밖 덩어리는 통째로 안 그린다
  const GCH = 36;                 // 풀 덩어리 크기(m)
  let grassR = 80;                // 이 거리 안의 풀 덩어리만 그린다
  const chunks = new Map();       // 'i,j' → { list:[{kind, mats[]}] }
  const groups = [];              // 거리 따라 숨길 풀 덩어리
  const treeMeshes = [];          // 거리 따라 가볍게 바꿀 나무 덩어리

  // ── 그림 ──
  function leafTex(kind) {
    const S = 256, c = GEO.canvas(S), g = c.getContext('2d');
    const r = U.mulberry(kind.length * 31 + 7);
    const pal = {
      birch: ['#9fc25a', '#b6d46a', '#7ea846', '#c9dc7c', '#6f9a3c'],
      oak: ['#4f7a30', '#5e8a38', '#3e6628', '#6e9a42', '#35591f'],
      bush: ['#5f8e3a', '#78a444', '#4a7a2e', '#8ab452'],
      aspen: ['#8fb84e', '#a8c860', '#6f9a3c', '#c0d470'],
    }[kind];
    if (kind === 'pine' || kind === 'spruce') {
      // 가지와 바늘잎
      const cols = kind === 'pine' ? ['#3f6a34', '#4f7c3c', '#2f5628', '#5e8a46'] : ['#27462a', '#315536', '#1f3a22', '#3b6440'];
      for (let b = 0; b < 16; b++) {
        const x0 = r() * S, y0 = r() * S, a = r() * Math.PI * 2, L = 40 + r() * 70;
        g.strokeStyle = '#3a2a1c'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); g.stroke();
        for (let k = 0; k < 70; k++) {
          const t = r(), px = x0 + Math.cos(a) * L * t, py = y0 + Math.sin(a) * L * t;
          const na = a + (r() < 0.5 ? 1 : -1) * (0.6 + r() * 0.6), nl = (kind === 'pine' ? 10 : 7) + r() * 8;
          g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(na) * nl, py + Math.sin(na) * nl); g.stroke();
        }
      }
    } else {
      const n = kind === 'oak' ? 260 : 340;
      for (let k = 0; k < n; k++) {
        const x = 12 + r() * (S - 24), y = 12 + r() * (S - 24);
        // 가운데로 몰리게
        const cx = S / 2 + (x - S / 2) * (0.55 + 0.45 * r()), cy = S / 2 + (y - S / 2) * (0.55 + 0.45 * r());
        const a = r() * Math.PI * 2, s = kind === 'oak' ? 9 + r() * 7 : 6 + r() * 5;
        g.save(); g.translate(cx, cy); g.rotate(a);
        const col = pal[(r() * pal.length) | 0];
        g.fillStyle = col;
        g.beginPath();
        if (kind === 'oak') {   // 물결 가장자리 잎
          for (let i = 0; i <= 10; i++) { const t = i / 10 * Math.PI * 2; const rr = s * (0.62 + 0.18 * Math.cos(t * 3)); g.lineTo(Math.cos(t) * rr * 1.35, Math.sin(t) * rr * 0.72); }
        } else {                // 끝이 뾰족한 자작 잎
          g.moveTo(-s, 0); g.quadraticCurveTo(-s * 0.2, -s * 0.85, s * 1.1, 0); g.quadraticCurveTo(-s * 0.2, s * 0.85, -s, 0);
        }
        g.fill();
        // 잎 빛·그늘
        g.fillStyle = 'rgba(255,255,230,.18)'; g.beginPath(); g.ellipse(-s * 0.1, -s * 0.18, s * 0.5, s * 0.2, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(30,40,10,.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke();
        g.restore();
      }
    }
    const t = GEO.tex(c);
    return t;
  }

  function barkTex(kind) {
    const W = 128, Hh = 512, c = GEO.canvas(W, Hh), g = c.getContext('2d');
    const r = U.mulberry(kind.length * 17 + 3);
    if (kind === 'birch') {
      g.fillStyle = '#e9e6dc'; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${150 + r() * 60},${150 + r() * 50},${140 + r() * 40},.18)`; g.fillRect(r() * W, r() * Hh, 1 + r() * 6, 1); }
      for (let i = 0; i < 70; i++) {   // 까만 가로 줄무늬(자작나무 껍질)
        const y = r() * Hh, x = r() * W, w = 6 + r() * 34, h = 1.5 + r() * 4.5;
        g.fillStyle = `rgba(${20 + r() * 30},${20 + r() * 25},${20 + r() * 20},${0.7 + r() * 0.3})`;
        g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, 7); g.fill();
        if (x + w / 2 > W) { g.beginPath(); g.ellipse(x - W, y, w / 2, h / 2, 0, 0, 7); g.fill(); }
      }
      // 밑동은 거칠고 검다
      const gr = g.createLinearGradient(0, Hh * 0.82, 0, Hh);
      gr.addColorStop(0, 'rgba(40,36,30,0)'); gr.addColorStop(1, 'rgba(40,36,30,.9)');
      g.fillStyle = gr; g.fillRect(0, Hh * 0.8, W, Hh * 0.2);
    } else {
      const base = { pine: ['#6b4a34', '#8a5a3a', '#b0703e'], oak: ['#4a4238', '#5a5046', '#3a342c'], spruce: ['#4e4034', '#5c4c3e', '#3e3228'], dead: ['#7a7468', '#8a8478', '#5c5850'] }[kind];
      g.fillStyle = base[0]; g.fillRect(0, 0, W, Hh);
      for (let i = 0; i < 260; i++) {   // 세로 골
        const x = r() * W, y = r() * Hh, h = 20 + r() * 70;
        g.fillStyle = r() < 0.5 ? base[1] : base[2];
        g.globalAlpha = 0.5 + r() * 0.4;
        g.fillRect(x, y, 3 + r() * 7, h);
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x - 1, y, 1.5, h);
        g.globalAlpha = 1;
      }
      if (kind === 'pine') {   // 소나무 윗동은 주홍빛
        const gr = g.createLinearGradient(0, 0, 0, Hh * 0.6);
        gr.addColorStop(0, 'rgba(210,120,60,.75)'); gr.addColorStop(1, 'rgba(210,120,60,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, Hh * 0.6);
      }
    }
    const t = GEO.tex(c, true);
    return t;
  }

  function grassCardTex(kind) {
    const S = 128, c = GEO.canvas(S), g = c.getContext('2d');
    const r = U.mulberry(kind.length * 13 + 5);
    if (kind === 'fern') {
      // 고사리 잎 — 가운데 줄기에서 좌우로 작은 깃
      for (let f = 0; f < 5; f++) {
        const a = -Math.PI / 2 + (f - 2) * 0.42, L = 58 + r() * 12;
        const x0 = S / 2, y0 = S - 2;
        g.strokeStyle = '#3f6a26'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(x0, y0);
        const ex = x0 + Math.cos(a) * L * 1.2, ey = y0 + Math.sin(a) * L;
        g.quadraticCurveTo(x0 + Math.cos(a) * L * 0.5, y0 + Math.sin(a) * L * 0.8 - 8, ex, ey); g.stroke();
        for (let k = 1; k < 16; k++) {
          const t = k / 16, px = U.lerp(x0, ex, t), py = U.lerp(y0, ey, t) - Math.sin(t * Math.PI) * 6;
          const w = (1 - t) * 11 + 2;
          g.fillStyle = k % 2 ? '#5e9a34' : '#4c8a2c';
          for (const sd of [-1, 1]) {
            g.beginPath(); g.ellipse(px + Math.cos(a + sd * 1.3) * w * 0.6, py + Math.sin(a + sd * 1.3) * w * 0.6, w * 0.55, 2.2, a + sd * 1.3, 0, 7); g.fill();
          }
        }
      }
    } else if (kind === 'rye') {
      for (let i = 0; i < 46; i++) {
        const x = 6 + r() * (S - 12), top = 6 + r() * 30, lean = (r() - 0.5) * 12;
        g.strokeStyle = r() < 0.5 ? '#c7a85a' : '#b0924a'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x, S); g.quadraticCurveTo(x + lean * 0.3, (S + top) / 2, x + lean, top + 14); g.stroke();
        g.fillStyle = r() < 0.5 ? '#e0c878' : '#d2b464';
        g.beginPath(); g.ellipse(x + lean, top + 7, 2.4, 8, lean * 0.02, 0, 7); g.fill();
      }
    } else if (kind === 'flax') {
      for (let i = 0; i < 40; i++) {
        const x = 6 + r() * (S - 12), top = 20 + r() * 50;
        g.strokeStyle = '#5c8a3a'; g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(x, S); g.lineTo(x + (r() - 0.5) * 8, top); g.stroke();
        if (r() < 0.75) {
          g.fillStyle = r() < 0.5 ? '#7fa2e0' : '#96b4ec';
          for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; g.beginPath(); g.ellipse(x + Math.cos(a) * 3, top + Math.sin(a) * 3, 2.6, 1.8, a, 0, 7); g.fill(); }
          g.fillStyle = '#f0e090'; g.beginPath(); g.arc(x, top, 1.2, 0, 7); g.fill();
        }
      }
    } else if (kind === 'potato') {
      for (let i = 0; i < 60; i++) {
        const x = 20 + r() * (S - 40), y = 30 + r() * (S - 36), s = 7 + r() * 6;
        g.fillStyle = ['#4a7a2c', '#5a8a36', '#3c6a24'][(r() * 3) | 0];
        g.beginPath(); g.ellipse(x, y, s, s * 0.6, r() * 3, 0, 7); g.fill();
      }
      for (let i = 0; i < 10; i++) { g.fillStyle = r() < 0.5 ? '#f4f0f4' : '#d8c8ec'; g.beginPath(); g.arc(20 + r() * (S - 40), 30 + r() * 40, 2.2, 0, 7); g.fill(); }
    } else if (kind === 'reed') {
      for (let i = 0; i < 30; i++) {
        const x = 6 + r() * (S - 12), top = 4 + r() * 20;
        g.strokeStyle = r() < 0.5 ? '#7a8a44' : '#8c9a50'; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(x, S); g.lineTo(x + (r() - 0.5) * 10, top); g.stroke();
        if (r() < 0.3) { g.fillStyle = '#5a3a24'; g.beginPath(); g.ellipse(x, top + 10, 2.4, 7, 0, 0, 7); g.fill(); }
      }
    } else {
      // 풀 + 들꽃 몇 송이
      for (let i = 0; i < 140; i++) {
        const x = 4 + r() * (S - 8), top = 20 + r() * 80 + Math.abs(x - S / 2) * 0.4, lean = (r() - 0.5) * 26;
        const w = 2.2 + r() * 1.6;
        g.fillStyle = ['#6a9a3a', '#82ae48', '#58882e', '#9cc056', '#76a040'][(r() * 5) | 0];
        g.beginPath(); g.moveTo(x - w / 2, S); g.quadraticCurveTo(x + lean * 0.2, (S + top) / 2, x + lean, top);
        g.quadraticCurveTo(x + lean * 0.2 + w * 0.3, (S + top) / 2, x + w / 2, S); g.fill();
      }
      if (kind === 'flowers') {
        for (let i = 0; i < 9; i++) {
          const x = 10 + r() * (S - 20), y = 30 + r() * 50;
          const col = ['#ffffff', '#f4e060', '#6a8ae0', '#e0507a', '#c070e0'][(r() * 5) | 0];
          g.fillStyle = col;
          for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; g.beginPath(); g.arc(x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.1, 0, 7); g.fill(); }
          g.fillStyle = '#f0c030'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill();
        }
      }
    }
    return GEO.tex(c);
  }

  // ── 모양 ──
  // 둥근 잎 뭉치: 가운데 c, 반지름 rx,ry,rz 안에 판 n 장
  function crown(cx, cy, cz, rx, ry, rz, n, size, lean) {
    const list = [];
    const q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      let x, y, z;
      do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
      const k = 0.55 + 0.45 * Math.cbrt(rnd());
      const px = cx + x * rx * k, py = cy + y * ry * k, pz = cz + z * rz * k;
      const s = size * (0.75 + rnd() * 0.5);
      let g = new THREE.PlaneGeometry(s, s);
      e.set((rnd() - 0.5) * 1.6, rnd() * Math.PI * 2, (rnd() - 0.5) * 1.6);
      g.applyQuaternion(q.setFromEuler(e));
      g.translate(px, py, pz);
      // 법선은 뭉치 바깥쪽 — 덩어리 전체가 둥글게 빛을 받는다
      const nx = (px - cx) / rx, ny = (py - cy) / ry + (lean || 0.35), nz = (pz - cz) / rz;
      const nl = Math.hypot(nx, ny, nz) || 1;
      const nm = g.attributes.normal;
      for (let v = 0; v < nm.count; v++) nm.setXYZ(v, nx / nl, ny / nl, nz / nl);
      // 안쪽은 어둡게
      const dark = 0.55 + 0.45 * Math.min(1, Math.hypot((px - cx) / rx, (py - cy) / ry, (pz - cz) / rz));
      const up = 0.85 + 0.25 * ((py - cy) / ry);
      g = GEO.tint(g, 0xffffff);
      const cc = g.attributes.color;
      for (let v = 0; v < cc.count; v++) cc.setXYZ(v, dark * up, dark * up, dark * up);
      list.push(g);
    }
    return list;
  }
  function trunk(r0, r1, h, seg, x, z, lean) {
    const g = new THREE.CylinderGeometry(r1, r0, h, seg || 7, 4, true);
    g.translate(0, h / 2, 0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * h / 6);
    if (lean) g.rotateZ(lean);
    g.translate(x || 0, 0, z || 0);
    return g;
  }
  function branch(x, y, z, len, ry, rz, r) {
    const g = new THREE.CylinderGeometry(r * 0.4, r, len, 5, 1, true);
    g.translate(0, len / 2, 0);
    g.rotateZ(rz); g.rotateY(ry);
    g.translate(x, y, z);
    return g;
  }

  // 종류별: 줄기 도형, 잎 도형, 잎 질감, 줄기 질감, 부딪힘 반지름
  const KINDS = {};
  function makeKinds() {
    // 자작나무 — 가늘고 흰 줄기, 위로 긴 잎 뭉치 여럿
    {
      const tr = [trunk(0.2, 0.1, 13, 7)];
      for (let i = 0; i < 5; i++) { const a = rnd() * 6.28; tr.push(branch(0, 5 + i * 1.4, 0, 2.4, a, 0.9, 0.06)); }
      const lv = [];
      lv.push(...crown(0, 10.2, 0, 2.4, 3.8, 2.4, 26, 2.2));
      lv.push(...crown(0.9, 7.2, 0.5, 1.9, 2.0, 1.9, 12, 2.0));
      lv.push(...crown(-0.8, 7.8, -0.6, 1.7, 2.0, 1.7, 10, 2.0));
      KINDS.birch = { tr: GEO.merge(tr), lv: GEO.merge(lv), leaf: 'birch', bark: 'birch', r: 0.25,
        trLo: GEO.merge([trunk(0.2, 0.1, 13, 5)]), lvLo: GEO.merge(crown(0, 9.6, 0, 2.3, 3.9, 2.3, 10, 3.3)) };
    }
    // 소나무 — 길고 곧은 줄기, 꼭대기에 납작한 잎층
    {
      const tr = [trunk(0.34, 0.16, 18, 7)];
      for (let i = 0; i < 6; i++) { const a = i * 1.1; tr.push(branch(0, 11.5 + i * 1.0, 0, 2.6, a, 1.2, 0.09)); }
      const lv = [];
      lv.push(...crown(0, 17.2, 0, 3.0, 1.5, 3.0, 20, 2.6, 0.8));
      lv.push(...crown(1.4, 14.8, 0.6, 2.2, 1.2, 2.2, 12, 2.4, 0.8));
      lv.push(...crown(-1.3, 13.4, -0.9, 2.0, 1.1, 2.0, 10, 2.4, 0.8));
      KINDS.pine = { tr: GEO.merge(tr), lv: GEO.merge(lv), leaf: 'pine', bark: 'pine', r: 0.36,
        trLo: GEO.merge([trunk(0.34, 0.16, 18, 5)]), lvLo: GEO.merge(crown(0, 15.8, 0, 2.8, 2.2, 2.8, 9, 3.6, 0.8)) };
    }
    // 가문비 — 원뿔
    {
      const tr = [trunk(0.34, 0.08, 15, 6)];
      const lv = [];
      for (let i = 0; i < 9; i++) {
        const y = 1.8 + i * 1.45, w = 3.4 * (1 - i / 10) + 0.4;
        lv.push(...crown(0, y, 0, w, 0.7, w, Math.round(6 + w * 3), 1.9 + w * 0.25, 0.9));
      }
      const lo = [];
      for (let i = 0; i < 4; i++) { const y = 2.6 + i * 3.1, w = 3.4 * (1 - i / 4.5) + 0.5; lo.push(...crown(0, y, 0, w, 1.3, w, 4, 2.6 + w * 0.5, 0.9)); }
      KINDS.spruce = { tr: GEO.merge(tr), lv: GEO.merge(lv), leaf: 'spruce', bark: 'spruce', r: 0.34, trLo: GEO.merge([trunk(0.34, 0.08, 15, 4)]), lvLo: GEO.merge(lo) };
    }
    // 참나무 — 굵은 줄기, 넓게 퍼진 가지, 커다란 잎 덩어리
    {
      const tr = [trunk(0.9, 0.55, 7.5, 9)];
      const lv = [];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.28 + rnd() * 0.5, L = 5 + rnd() * 2, by = 5.5 + rnd() * 1.5, rz = 0.9 + rnd() * 0.3;
        tr.push(branch(0, by, 0, L, a, rz, 0.32));
        // 가지 끝 = (-L sin rz cos a, by + L cos rz, L sin rz sin a)
        const ex = -L * Math.sin(rz) * Math.cos(a), ey = by + L * Math.cos(rz), ez = L * Math.sin(rz) * Math.sin(a);
        lv.push(...crown(ex, ey + 1.2, ez, 3.6, 2.6, 3.6, 26, 3.3));
      }
      lv.push(...crown(0, 13.2, 0, 5.2, 3.4, 5.2, 36, 3.4));
      KINDS.oak = { tr: GEO.merge(tr), lv: GEO.merge(lv), leaf: 'oak', bark: 'oak', r: 0.95,
        trLo: GEO.merge([trunk(0.9, 0.55, 8.5, 6)]), lvLo: GEO.merge(crown(0, 11.8, 0, 6.2, 3.6, 6.2, 16, 5.6)) };
    }
    // 마른 나무 (늪)
    {
      const tr = [trunk(0.3, 0.12, 8, 6)];
      for (let i = 0; i < 5; i++) tr.push(branch(0, 3.5 + i * 0.9, 0, 2.2 + rnd(), rnd() * 6.28, 0.7 + rnd() * 0.6, 0.08));
      KINDS.dead = { tr: GEO.merge(tr), lv: null, bark: 'dead', r: 0.3, trLo: GEO.merge([trunk(0.3, 0.12, 8, 4)]) };
    }
    // 덤불
    {
      KINDS.bush = { tr: null, lv: GEO.merge(crown(0, 0.9, 0, 1.4, 1.0, 1.4, 16, 1.3, 0.5)), leaf: 'bush', r: 0, lvLo: GEO.merge(crown(0, 0.9, 0, 1.2, 0.8, 1.2, 5, 1.9, 0.5)) };
    }
  }

  function keepAlpha(m, size) {
    GEO.noFlip(m);
    const nf = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      nf(sh, r);
      sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>',
        `{ vec2 ddx = dFdx(vMapUv * ${size.toFixed(1)}), ddy = dFdy(vMapUv * ${size.toFixed(1)});
           float lod = max(0.0, 0.5 * log2(max(dot(ddx, ddx), dot(ddy, ddy))));
           diffuseColor.a *= 1.0 + lod * 0.32; }
         #include <alphatest_fragment>`);
    };
    m.customProgramCacheKey = () => 'keepAlpha' + size;
    return m;
  }

  const MATS = {};
  function mats(kind) {
    if (MATS[kind]) return MATS[kind];
    const K = KINDS[kind];
    const o = {};
    if (K.tr) {
      const bt = barkTex(K.bark);
      o.tr = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.95, vertexColors: true });
    }
    if (K.lv) {
      const lt = leafTex(K.leaf);
      o.lv = keepAlpha(new THREE.MeshStandardMaterial({ map: lt, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, envMapIntensity: 0.35, vertexColors: true }), 256);
      o.lvDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: lt, alphaTest: 0.45, side: THREE.DoubleSide });
      // 잎 뒤로 비치는 빛 흉내 — 그늘진 쪽도 너무 새까맣지 않게
      o.lv.emissive = new THREE.Color(0x1a2410);
    }
    return (MATS[kind] = o);
  }

  // ── 심기 ──
  const placed = [];   // {kind, x, y, z, s, ry}
  function plant() {
    const cell = 7.5;
    for (let gz = -TER.HALF; gz < TER.HALF; gz += cell) {
      for (let gx = -TER.HALF; gx < TER.HALF; gx += cell) {
        const x = gx + rnd() * cell, z = gz + rnd() * cell;
        const f = TER.forest(x, z);
        if (!f) continue;
        const clump = 0.55 + N.fbm(x / 30, z / 30, 2) * 1.2;
        if (rnd() > f.d * clump) continue;
        const h = TER.H(x, z);
        let kind;
        const r = rnd();
        switch (f.k) {
          case 'birch': kind = r < 0.82 ? 'birch' : (r < 0.92 ? 'spruce' : 'bush'); break;
          case 'pine': kind = r < 0.72 ? 'pine' : (r < 0.9 ? 'spruce' : 'birch'); break;
          case 'pushcha': kind = r < 0.42 ? 'oak' : (r < 0.8 ? 'spruce' : (r < 0.9 ? 'birch' : 'bush')); break;
          case 'spruce': kind = r < 0.7 ? 'spruce' : 'pine'; break;
          case 'swamp': if (h < -0.35) continue; kind = r < 0.45 ? 'dead' : (r < 0.8 ? 'birch' : 'bush'); break;
          default: kind = r < 0.35 ? 'birch' : (r < 0.55 ? 'oak' : (r < 0.7 ? 'pine' : 'bush'));
        }
        if (h < 0.15 && kind !== 'dead') continue;
        if (TER.boardD(x, z) < 2.5) continue;
        const s = kind === 'oak' ? 0.85 + rnd() * 0.5 : 0.85 + rnd() * 0.5;
        placed.push({ kind, x, y: h - 0.15, z, s, ry: rnd() * 6.28 });
      }
    }
    // 푸시차의 늙은 거목 한 그루 (고사리꽃 곁)
    placed.push({ kind: 'oak', x: TER.Z.fern.x + 9, y: TER.H(TER.Z.fern.x + 9, TER.Z.fern.z - 6) - 0.2, z: TER.Z.fern.z - 6, s: 1.9, ry: 0.4 });
  }

  // 나무 둘레 빈자리 확인 (다른 것 놓을 때)
  function treeNear(x, z, r) {
    for (const p of placed) if (Math.abs(p.x - x) < r + 1 && Math.abs(p.z - z) < r + 1 && Math.hypot(p.x - x, p.z - z) < r + (p.kind === 'oak' ? p.s : 0.3)) return true;
    return false;
  }

  function chunkKey(x, z, size) { size = size || CH; return Math.floor((x + TER.HALF) / size) + ',' + Math.floor((z + TER.HALF) / size); }

  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function buildTrees(scene, quality) {
    makeKinds();
    plant();
    // 덩어리·종류별로 나눈다
    const buckets = new Map();
    for (const p of placed) {
      if (quality < 1 && p.kind === 'bush' && rnd() < 0.5) continue;
      const k = chunkKey(p.x, p.z) + '|' + p.kind;
      let b = buckets.get(k); if (!b) buckets.set(k, b = []);
      b.push(p);
      const K = KINDS[p.kind];
      if (K.r) COL.circle(p.x, p.z, K.r * p.s, p.y - 1, p.y + 30, 'tree');
    }
    const col = new THREE.Color();
    for (const [k, list] of buckets) {
      const kind = k.split('|')[1];
      const K = KINDS[kind], m = mats(kind);
      const meshes = [];
      if (K.tr) meshes.push(new THREE.InstancedMesh(K.tr, m.tr, list.length));
      if (K.lv) { const lm = new THREE.InstancedMesh(K.lv, m.lv, list.length); lm.customDepthMaterial = m.lvDepth; meshes.push(lm); }
      list.forEach((p, i) => {
        Q.setFromAxisAngle(UP, p.ry);
        S3.set(p.s, p.s * (0.9 + (i % 5) * 0.05), p.s);
        M4.compose(V.set(p.x, p.y, p.z), Q, S3);
        const tone = 0.85 + ((i * 37) % 11) / 11 * 0.3;
        for (const me of meshes) {
          me.setMatrixAt(i, M4);
          if (me.geometry === K.lv) { col.setRGB(tone, tone * (0.95 + ((i * 13) % 7) / 70), tone * 0.95); me.setColorAt(i, col); }
          else { col.setRGB(1, 1, 1); me.setColorAt(i, col); }
        }
      });
      const [ci, cj] = k.split('|')[0].split(',').map(Number);
      const cx = -TER.HALF + (ci + 0.5) * CH, cz = -TER.HALF + (cj + 0.5) * CH;
      for (const me of meshes) {
        me.castShadow = true; me.receiveShadow = true;
        me.computeBoundingSphere();
        const isLv = me.geometry === K.lv;
        me.userData = { cx, cz, hi: me.geometry, lo: isLv ? K.lvLo : K.trLo };
        treeMeshes.push(me);
        scene.add(me);
      }
    }
  }

  // ── 풀·고사리·밭 ──
  function cardClump(n, w, h) {
    const list = [];
    for (let i = 0; i < n; i++) {
      let g = new THREE.PlaneGeometry(w, h);
      g.translate(0, h / 2, 0);
      g.rotateY(i / n * Math.PI);
      const nm = g.attributes.normal;
      for (let v = 0; v < nm.count; v++) nm.setXYZ(v, 0, 1, 0);   // 풀은 위에서 빛을 받는다
      g = GEO.tint(g, 0xffffff);
      // 뿌리 쪽은 어둡게
      const p = g.attributes.position, c = g.attributes.color;
      for (let v = 0; v < p.count; v++) { const k = p.getY(v) < 0.01 ? 0.72 : 1.05; c.setXYZ(v, k, k, k); }
      list.push(g);
    }
    return GEO.merge(list);
  }

  // 풀이 몸에 밀려 눕고 바람에 흔들린다 (사장님 2026-09-17 "게임의 기본은 물리효과") — 주인공 자리는 physics.js 가 넣는다
  const bend = { uPl: { value: new THREE.Vector3(0, -99, 0) }, uT: { value: 0 } };
  function bendy(m, k) {
    const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
    const stiff = k === 'reed' || k === 'rye' ? 0.7 : 1.0;
    m.onBeforeCompile = (sh, r) => {
      prev(sh, r);
      sh.uniforms.uPl = bend.uPl; sh.uniforms.uT = bend.uT;
      sh.vertexShader = 'uniform vec3 uPl;\nuniform float uT;\n' +sh.vertexShader.replace('#include <project_vertex>', `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
        #endif
        vec4 wp = modelMatrix * mvPosition;
        float hk = clamp(position.y / 1.1, 0.0, 1.0);
        hk *= hk;
        vec2 dd = wp.xz - uPl.xz;
        float dl = length(dd);
        float near = (1.0 - smoothstep(0.25, 1.15, dl)) * step(abs(wp.y - uPl.y), 2.5);
        vec2 dir = dl > 0.001 ? dd / dl : vec2(0.0);
        wp.xz += dir * near * hk * 0.55 * ${stiff.toFixed(2)};
        wp.y -= near * hk * 0.35 * ${stiff.toFixed(2)};
        float w = sin(uT * 1.6 + wp.x * 0.23 + wp.z * 0.17) + 0.5 * sin(uT * 2.9 + wp.x * 0.61);
        wp.x += w * 0.045 * hk; wp.z += cos(uT * 1.3 + wp.z * 0.21) * 0.035 * hk;
        mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;`);
    };
    m.customProgramCacheKey = () => (prevKey ? prevKey() : '') + 'bend' + stiff;
    return m;
  }

  function buildGround(scene, quality) {
    const defs = {
      grass: { geo: cardClump(2, 0.95, 0.5), tex: 'grass' },
      flowers: { geo: cardClump(2, 1.0, 0.55), tex: 'flowers' },
      fern: { geo: cardClump(3, 1.8, 1.25), tex: 'fern' },
      rye: { geo: cardClump(2, 1.6, 1.25), tex: 'rye' },
      flax: { geo: cardClump(2, 1.4, 0.8), tex: 'flax' },
      potato: { geo: cardClump(2, 1.0, 0.55), tex: 'potato' },
      reed: { geo: cardClump(2, 1.4, 1.9), tex: 'reed' },
    };
    for (const k in defs) {
      const t = grassCardTex(defs[k].tex);
      defs[k].mat = bendy(keepAlpha(new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, envMapIntensity: 0.4, vertexColors: true }), 128), k);
    }
    const buckets = new Map();
    const add = (k, x, z, s) => {
      const key = chunkKey(x, z, GCH) + '|' + k;
      let b = buckets.get(key); if (!b) buckets.set(key, b = []);
      b.push([x, TER.H(x, z) - 0.04, z, s]);
    };
    const step = quality < 1 ? 2.6 : 1.8;
    for (let z = -TER.HALF + 2; z < TER.HALF - 2; z += step) {
      for (let x = -TER.HALF + 2; x < TER.HALF - 2; x += step) {
        const px = x + (rnd() - 0.5) * step, pz = z + (rnd() - 0.5) * step;
        const h = TER.H(px, pz);
        const m = Math.max(Math.abs(px), Math.abs(pz));
        if (m > TER.LIMIT - 6) continue;
        const fi = TER.inField(px, pz, -1);
        if (Math.hypot(px - TER.Z.village.x, pz - TER.Z.village.z) < 70 && COL.inside(px, h + 0.3, pz, 0.35)) continue;   // 집 밑
        if (fi) {
          const k = fi.f.k;
          if (k === 'potato') { if (Math.sin(fi.v * 2.4) > 0.2) add('potato', px, pz, 0.9 + rnd() * 0.3); }
          else add(k, px, pz, 0.9 + rnd() * 0.35);
          if (k !== 'potato' && rnd() < 0.8) add(k, px + step / 2, pz + step / 2, 0.9 + rnd() * 0.35);
          continue;
        }
        if (TER.roadD(px, pz) < 2.2) continue;
        if (TER.boardD(px, pz) < 1.6) continue;
        const dv = Math.hypot(px - TER.Z.village.x, pz - TER.Z.village.z);
        if (dv < 93 && COL.inside(px, h + 0.3, pz, 0.35)) continue;   // 집·가판대 밑에는 안 심는다
        if (h < -0.05) { if (h > -0.9 && rnd() < 0.35) add('reed', px, pz, 0.8 + rnd() * 0.5); continue; }
        if (h < 0.25 && rnd() < 0.5) { add('reed', px, pz, 0.7 + rnd() * 0.4); continue; }
        const f = TER.forest(px, pz);
        const n = N.fbm(px / 25, pz / 25, 2);
        if (f && (f.k === 'pushcha' || f.k === 'pine' || f.k === 'spruce')) {
          if (rnd() < 0.35 + n) add('fern', px, pz, 0.7 + rnd() * 0.6);
          else if (rnd() < 0.25) add('grass', px, pz, 0.6 + rnd() * 0.4);
          continue;
        }
        if (dv < 47 && rnd() < 0.55) continue;   // 마당은 짧게
        if (rnd() < 0.85 + n * 0.5) add(rnd() < 0.12 + Math.max(0, n) * 0.4 ? 'flowers' : 'grass', px, pz, 0.7 + rnd() * 0.6);
        if (f && f.k === 'birch' && rnd() < 0.15) add('fern', px, pz, 0.6 + rnd() * 0.4);
      }
    }
    const col = new THREE.Color();
    for (const [key, list] of buckets) {
      const k = key.split('|')[1], d = defs[k];
      const me = new THREE.InstancedMesh(d.geo, d.mat, list.length);
      list.forEach((p, i) => {
        Q.setFromAxisAngle(UP, rnd() * 6.28);
        S3.set(p[3], p[3] * (0.8 + rnd() * 0.4), p[3]);
        M4.compose(V.set(p[0], p[1], p[2]), Q, S3);
        me.setMatrixAt(i, M4);
        const t = 0.8 + rnd() * 0.35;
        col.setRGB(t, t, t * 0.95); me.setColorAt(i, col);
      });
      me.receiveShadow = true;
      me.computeBoundingSphere();
      const [ci, cj] = key.split('|')[0].split(',').map(Number);
      me.userData.cx = -TER.HALF + (ci + 0.5) * GCH; me.userData.cz = -TER.HALF + (cj + 0.5) * GCH;
      groups.push(me);
      scene.add(me);
    }
  }

  function build(scene, quality) {
    if (quality < 1) grassR = 58;
    buildTrees(scene, quality);
  }

  // 먼 풀 덩어리는 숨긴다
  function update(cam) {
    const px = cam.position.x, pz = cam.position.z;
    for (const m of treeMeshes) {
      const d = Math.hypot(m.userData.cx - px, m.userData.cz - pz);
      m.visible = d < 320;   // 안개 끝 너머 나무 덩어리는 안 그린다
      const want = d < 85 || !m.userData.lo ? m.userData.hi : m.userData.lo;
      if (m.geometry !== want) m.geometry = want;
      m.castShadow = d < 75;
    }
    for (const g of groups) {
      const d = Math.hypot(g.userData.cx - cam.position.x, g.userData.cz - cam.position.z);
      g.visible = d < grassR;
    }
  }

  window.FLORA = { bend, build, buildGround, update, treeNear, placed, KINDS, crown, leafTex, barkTex, mats };
})();
