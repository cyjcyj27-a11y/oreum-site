// 집과 마당. 미터 단위, y 위. 정적인 것은 재질 하나로 합치고(Batch), 부딪힘은 상자 목록(W.boxes).
(function () {
  const W = (window.WORLD = { boxes: [], spots: {}, anim: [] });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let BW, BF, BO; // 벽·바닥(그림자 안 드리움) / 가구(드리움) / 바깥(지붕·담)

  function solid(b, x0, y0, z0, x1, y1, z1, col, jit, cell, noCol) {
    b.box(x0, y0, z0, x1, y1, z1, col, jit === undefined ? 0.06 : jit, cell);
    if (!noCol) W.boxes.push({ x0, y0, z0, x1, y1, z1 });
  }
  const furn = (x0, y0, z0, x1, y1, z1, col, jit, noCol) => solid(BF, x0, y0, z0, x1, y1, z1, col, jit, 0, noCol);
  const deco = (x0, y0, z0, x1, y1, z1, col, jit) => solid(BF, x0, y0, z0, x1, y1, z1, col, jit, 0, true);
  function cyl(b, x, y, z, r, h, col, seg, noCol, rt) {
    const g = new THREE.CylinderGeometry(rt === undefined ? r : rt, r, h, seg || 16);
    b.add(g, col, TOON.M(x, y + h / 2, z), 0.04);
    if (!noCol) W.boxes.push({ x0: x - r * 0.85, y0: y, z0: z - r * 0.85, x1: x + r * 0.85, y1: y + h, z1: z + r * 0.85 });
  }

  // 방마다 벽지 색(면 가운데 자리로 고름)
  function wallCol(x, y, z, c, nx, ny, nz) {
    const out = x < -6.02 || x > 6.02 || z > 0.02 || z < -8.02;
    if (out) { c.set(y < 0.35 ? '#8d8178' : '#e6d5bb'); if (y > 0.35 && Math.floor(y / 0.22) % 2) c.multiplyScalar(0.96); return; }
    if (z > -4.52) {
      if (x < -2) { // 부엌 타일
        c.set('#e4ece8'); if ((Math.floor(x / 0.3) + Math.floor(y / 0.3) + Math.floor(z / 0.3)) % 2) c.set('#d3e0dc'); return;
      }
      c.set('#f2e2c4'); if (Math.floor((x + z) / 0.4) % 2) c.multiplyScalar(0.965); return; // 거실 크림 줄무늬 벽지
    }
    if (x < -2) { c.set('#ecdcb6'); return; } // 할아버지 방 한지
    if (x < 2) { c.set('#c4d7e6'); if (Math.floor((x + z) / 0.5) % 2) c.multiplyScalar(0.95); return; } // 남고딩 방 하늘색
    c.set('#f3d2d3'); if ((Math.floor(x / 0.25) + Math.floor(y / 0.25) + Math.floor(z / 0.25)) % 3 === 0) c.set('#f8e2e2'); // 안방 분홍 점무늬
  }
  function floorCol(x, y, z, c) {
    if (z > 0.05) { c.set('#7aa95a'); return; }
    if (z > -4.52 && x < -2) { c.set((Math.floor(x / 0.4) + Math.floor(z / 0.4)) % 2 ? '#d9d2c4' : '#c6bdac'); return; } // 부엌 바닥
    if (z <= -4.52 && x >= -2 && x < 2) { c.set('#c08a55'); if (Math.floor(x / 0.18) % 2) c.multiplyScalar(0.93); return; } // 마루
    c.set('#e2b46c'); if (Math.floor(z / 0.9) % 2) c.multiplyScalar(0.97); // 장판
  }

  // 무늬 그림(캔버스) — 방충망·화면
  function canvasTex(w, h, draw) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  W.build = function (scene) {
    BW = new TOON.Batch(); BF = new TOON.Batch(); BO = new TOON.Batch();
    const H = 2.5, T = 0.15;
    // ---------- 땅·바닥 ----------
    BO.add(new THREE.PlaneGeometry(40, 40, 40, 40).rotateX(-Math.PI / 2), (x, y, z, c) => {
      const d = Math.hypot(x - 1.6, z - 3.4);
      c.set(d < 0.75 ? '#55703a' : d < 3.2 ? '#5f9a48' : '#73a957'); if ((Math.floor(x) + Math.floor(z)) % 2) c.multiplyScalar(0.95);
      if (Math.abs(x + 0.9) < 0.6 && z > 0 && z < 8) c.set('#b9ab95'); // 대문에서 현관 디딤돌 길
    }, TOON.M(0, -0.01, 0), 0.1);
    BW.box(-6, -0.12, -8, 6, 0, 0, floorCol, 0.03, 0.3);
    // 기단(바깥 테두리만)
    BO.box(-6.3, -0.12, 0.15, 6.3, 0.04, 0.32, '#a59a8e', 0.05); BO.box(-6.3, -0.12, -8.32, 6.3, 0.04, -8.15, '#a59a8e', 0.05);
    BO.box(-6.32, -0.12, -8.32, -6.15, 0.04, 0.32, '#a59a8e', 0.05); BO.box(6.15, -0.12, -8.32, 6.32, 0.04, 0.32, '#a59a8e', 0.05);
    // ---------- 바깥벽 ----------
    solid(BW, -6.15, 0, -8.15, 6.15, H, -8, wallCol, 0.02, 0.5);
    solid(BW, -6.15, 0, -8, -6, H, 0.15, wallCol, 0.02, 0.5);
    solid(BW, 6, 0, -8, 6.15, H, 0.15, wallCol, 0.02, 0.5);
    // 앞벽: 부엌 창(x -5~-3.4), 현관문(x -1.5~-0.5, 벽은 막힘), 거실 창(x 0.4~2.4, 열림)
    solid(BW, -6, 0, 0, -5, H, T, wallCol, 0.02, 0.5);
    solid(BW, -5, 0, 0, -3.4, 1.0, T, wallCol, 0.02, 0.5);
    solid(BW, -5, 1.9, 0, -3.4, H, T, wallCol, 0.02, 0.5);
    solid(BW, -3.4, 0, 0, 0.4, H, T, wallCol, 0.02, 0.5);
    solid(BW, 0.4, 0, 0, 2.4, 0.8, T, wallCol, 0.02, 0.5);
    solid(BW, 0.4, 2.0, 0, 2.4, H, T, wallCol, 0.02, 0.5);
    solid(BW, 2.4, 0, 0, 6, H, T, wallCol, 0.02, 0.5);
    // 천장(안쪽 흰 반자) + 지붕(바깥)
    BW.box(-6, H, -8, 6, H + 0.12, 0, (x, y, z, c, nx, ny) => c.set(ny < -0.5 ? '#fbf6ea' : '#a59a8e'), 0.02, 0.6);
    W.boxes.push({ x0: -6.2, y0: H, z0: -8.2, x1: 6.2, y1: H + 1.6, z1: 0.2 });
    const roofCol = (x, y, z, c) => { c.set('#4b5675'); if (Math.floor((y + Math.abs(z + 4) * 0.55) / 0.16) % 2) c.set('#424b68'); };
    const rl = Math.hypot(4.7, 1.35);
    BO.add(new THREE.BoxGeometry(13.2, 0.14, rl, 1, 1, 14), roofCol, TOON.M(0, H + 0.12 + 0.68, -6.0, Math.atan2(1.35, 4.7) * -1, 0, 0), 0.03);
    BO.add(new THREE.BoxGeometry(13.2, 0.14, rl, 1, 1, 14), roofCol, TOON.M(0, H + 0.12 + 0.68, -1.95, Math.atan2(1.35, 4.7), 0, 0), 0.03);
    // 박공(양 옆 삼각 벽)
    const gab = new THREE.Shape(); gab.moveTo(-4.3, 0); gab.lineTo(4.3, 0); gab.lineTo(0, 1.35); gab.lineTo(-4.3, 0);
    [-6.08, 6.08].forEach((x) => BO.add(new THREE.ExtrudeGeometry(gab, { depth: 0.14, bevelEnabled: false }), '#d9c7aa', TOON.M(x - 0.07, H + 0.1, -4, 0, Math.PI / 2, 0), 0.02));
    // 처마 홈통
    BO.box(-6.4, H + 0.02, 0.3, 6.4, H + 0.12, 0.42, '#7d8494');
    // ---------- 안 벽 ----------
    // 가운데 벽(z -4.6~-4.45), 문 셋: 할아버지 x -4.4~-3.5, 남고딩 x -0.45~0.45, 안방 x 2.3~3.2
    const mz0 = -4.6, mz1 = -4.45, dh = 2.05;
    [[-6, -4.4], [-3.5, -0.45], [0.45, 2.3], [3.2, 6]].forEach((s) => solid(BW, s[0], 0, mz0, s[1], H, mz1, wallCol, 0.02, 0.5));
    [[-4.4, -3.5], [-0.45, 0.45], [2.3, 3.2]].forEach((s) => {
      solid(BW, s[0], dh, mz0, s[1], H, mz1, wallCol, 0.02, 0.5);
      // 문틀
      deco(s[0] - 0.06, 0, mz0 - 0.02, s[0], dh + 0.06, mz1 + 0.02, '#8a5a3a'); deco(s[1], 0, mz0 - 0.02, s[1] + 0.06, dh + 0.06, mz1 + 0.02, '#8a5a3a');
      deco(s[0] - 0.06, dh, mz0 - 0.02, s[1] + 0.06, dh + 0.06, mz1 + 0.02, '#8a5a3a');
    });
    solid(BW, -2.075, 0, -8, -1.925, H, mz0, wallCol, 0.02, 0.5);
    solid(BW, 1.925, 0, -8, 2.075, H, mz0, wallCol, 0.02, 0.5);
    // 걸레받이(방마다)
    const base = '#7a5236';
    [[-6, -8, 6, -7.96], [-6, -4.64, 6, -4.6], [-6, -4.45, 6, -4.41], [-6, -0.04, 6, 0]].forEach((r) => deco(r[0], 0, r[1], r[2], 0.08, r[3], base, 0.02));
    [[-6, -5.96], [5.96, 6], [-2.115, -2.075], [-1.925, -1.885], [1.885, 1.925], [2.075, 2.115]].forEach((r) => deco(r[0], 0, r[0] < -5 || r[0] > 5 ? -8 : -8, r[1], 0.08, r[0] < -5 || r[0] > 5 ? 0 : -4.6, base, 0.02));

    // ---------- 거실 창: 왼쪽 반은 방충망(찢어진 구멍), 오른쪽 반은 유리 ----------
    deco(0.35, 0.75, -0.02, 2.45, 0.8, 0.17, '#c9ccd2'); deco(0.35, 2.0, -0.02, 2.45, 2.05, 0.17, '#c9ccd2');
    deco(0.35, 0.8, -0.02, 0.4, 2.0, 0.17, '#c9ccd2'); deco(2.4, 0.8, -0.02, 2.45, 2.0, 0.17, '#c9ccd2');
    deco(1.38, 0.8, 0.0, 1.43, 2.0, 0.06, '#b8bcc4'); deco(1.38, 0.8, 0.09, 1.43, 2.0, 0.13, '#b8bcc4');
    // 유리(오른쪽 반) — 부딪힘
    // 유리는 안·밖 양면으로 그리고, 하늘빛 + 비스듬한 반사 띠 두 줄로 "닫힌 유리"가 보이게
    const glTex = canvasTex(200, 240, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(190,225,255,0.42)'); gr.addColorStop(1, 'rgba(150,190,230,0.30)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.save(); g.translate(w / 2, h / 2); g.rotate(-0.6);
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(-w, -h * 0.28, w * 2, 26);
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-w, -h * 0.28 + 40, w * 2, 10);
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(-w, h * 0.22, w * 2, 14);
      g.restore();
    });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ map: glTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    glass.position.set(1.9, 1.4, 0.032); scene.add(glass);
    // 미닫이 유리문 틀(유리 둘레 은색 테)
    deco(1.43, 0.8, 0.015, 2.4, 0.86, 0.05, '#b8bcc4'); deco(1.43, 1.94, 0.015, 2.4, 2.0, 0.05, '#b8bcc4'); deco(2.34, 0.8, 0.015, 2.4, 2.0, 0.05, '#b8bcc4');
    deco(1.43, 1.32, 0.03, 1.46, 1.48, 0.06, '#7d8494'); // 손잡이
    W.boxes.push({ x0: 1.4, y0: 0.8, z0: 0.02, x1: 2.4, y1: 2.0, z1: 0.045 });
    // 방충망(왼쪽 반, 구멍 x 0.52~0.86, y 0.83~1.13)
    const hole = { x0: 0.52, x1: 0.86, y0: 0.83, y1: 1.13 };
    W.hole = V((hole.x0 + hole.x1) / 2, (hole.y0 + hole.y1) / 2, 0.11);
    const scrTex = canvasTex(256, 304, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = 'rgba(40,46,56,0.55)'; g.lineWidth = 1;
      for (let x = 0; x <= w; x += 4) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
      for (let y = 0; y <= h; y += 4) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
      // 찢어진 구멍: 들쭉날쭉 지우고 가장자리에 너덜한 실
      const hx0 = ((hole.x0 - 0.4) / 1.0) * w, hx1 = ((hole.x1 - 0.4) / 1.0) * w, hy0 = h - ((hole.y1 - 0.8) / 1.2) * h, hy1 = h - ((hole.y0 - 0.8) / 1.2) * h;
      const cx = (hx0 + hx1) / 2, cy = (hy0 + hy1) / 2, rx = (hx1 - hx0) / 2, ry = (hy1 - hy0) / 2;
      const pts = []; for (let a = 0; a < 28; a++) { const t = (a / 28) * Math.PI * 2, k = 0.78 + Math.random() * 0.3; pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]); }
      g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); pts.forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.fill(); g.restore();
      // 너덜너덜한 가장자리: 짙은 테 + 늘어진 실 몇 가닥
      g.strokeStyle = 'rgba(25,28,36,0.95)'; g.lineWidth = 2.6; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p) => g.lineTo(p[0], p[1])); g.closePath(); g.stroke();
      g.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) { const p = pts[(i * 3) % pts.length], dx = cx - p[0], dy = cy - p[1], l = Math.hypot(dx, dy) || 1; const len = 5 + Math.random() * 9; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + (dx / l) * len * 0.5 + 3, p[1] + (dy / l) * len * 0.5 + 4, p[0] + (dx / l) * len, p[1] + (dy / l) * len + 5); g.stroke(); }
    });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.2), new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    scr.position.set(0.9, 1.4, 0.11); scene.add(scr);
    // 방충망 부딪힘: 구멍 둘레 네 조각
    const sz0 = 0.095, sz1 = 0.125;
    W.boxes.push({ x0: 0.4, y0: 0.8, z0: sz0, x1: hole.x0, y1: 2.0, z1: sz1 });
    W.boxes.push({ x0: hole.x1, y0: 0.8, z0: sz0, x1: 1.4, y1: 2.0, z1: sz1 });
    W.boxes.push({ x0: hole.x0, y0: 0.8, z0: sz0, x1: hole.x1, y1: hole.y0, z1: sz1 });
    W.boxes.push({ x0: hole.x0, y0: hole.y1, z0: sz0, x1: hole.x1, y1: 2.0, z1: sz1 });
    // 막힌 창(밤 유리 판) — 부엌·안방·남고딩·할아버지 방
    const nightWin = (x0, y0, x1, y1, z, inX) => {
      const col = (x, y, zz, c) => { c.set('#2f3a6a'); if (((inX ? zz : x) * 3 + y * 2) % 1.4 < 0.12) c.set('#6f7fb8'); };
      if (inX) { deco(z - 0.03, y0, x0, z + 0.03, y1, x1, col, 0.0); deco(z - 0.04, y0 - 0.05, x0 - 0.05, z + 0.04, y0, x1 + 0.05, '#efefea'); }
      else { deco(x0, y0, z - 0.03, x1, y1, z + 0.03, col, 0.0); deco(x0 - 0.05, y0 - 0.05, z - 0.04, x1 + 0.05, y0, z + 0.04, '#efefea'); }
    };
    deco(-5, 1.0, 0.03, -3.4, 1.9, 0.07, (x, y, z, c) => { c.set('#2f3a6a'); if ((x * 3 + y * 2) % 1.4 < 0.12) c.set('#6f7fb8'); }, 0);
    W.boxes.push({ x0: -5, y0: 1.0, z0: 0.0, x1: -3.4, y1: 1.9, z1: 0.15 });
    nightWin(-1.2, 1.1, 0.4, 1.9, -8.07); nightWin(3.4, 1.1, 5.0, 1.9, -8.07); nightWin(-5.2, 1.1, -3.6, 1.9, -8.07);
    // 현관문(앞벽 바깥에 붙은 판)
    deco(-1.5, 0, 0.15, -0.5, 2.05, 0.2, '#7a4a2e'); deco(-1.42, 0.08, 0.2, -0.58, 1.97, 0.22, '#8f5a36'); deco(-0.68, 0.95, 0.22, -0.6, 1.1, 0.26, '#d9b44a');
    deco(-1.7, -0.02, 0.15, -0.3, 0.12, 0.75, '#b0a69a'); // 현관 디딤

    // ---------- 거실 ----------
    // 창 아래 장식장 + 고양이 쿠션
    furn(0.5, 0, -0.55, 2.3, 0.6, -0.15, '#a8714a'); deco(0.52, 0.06, -0.57, 1.38, 0.54, -0.55, '#b98256'); deco(1.42, 0.06, -0.57, 2.28, 0.54, -0.55, '#b98256');
    BF.add(new THREE.CylinderGeometry(0.3, 0.32, 0.07, 20), '#e58a8a', TOON.M(1.45, 0.635, -0.36, 0, 0, 0, 1, 1, 0.62), 0.05);
    W.spots.cat = { p: V(1.45, 0.67, -0.36), yaw: Math.PI + 0.5 };
    // 강아지 방석
    BF.add(new THREE.CylinderGeometry(0.46, 0.5, 0.12, 24), '#6f8fc8', TOON.M(1.3, 0, -2.4).multiply(TOON.M(0, 0.06, 0)), 0.05);
    BF.add(new THREE.TorusGeometry(0.44, 0.07, 8, 24).rotateX(Math.PI / 2), '#5b78ae', TOON.M(1.3, 0.12, -2.4), 0.04);
    W.boxes.push({ x0: 0.84, y0: 0, z0: -2.86, x1: 1.76, y1: 0.12, z1: -1.94 });
    W.spots.dog = { p: V(1.3, 0.13, -2.4), yaw: -0.4 };
    // 러그
    BF.add(new THREE.CylinderGeometry(1.25, 1.25, 0.012, 32), (x, y, z, c) => { const d = Math.hypot(x - 3.2, z - 2.2 * -1); c.set(Math.floor(d / 0.25) % 2 ? '#b8574e' : '#d9a066'); }, TOON.M(3.2, 0.006, -2.2), 0);
    // 소파(뒤 벽쪽, TV 를 봄)
    const sofa = '#7d4a3a';
    furn(3.4, 0, -4.42, 5.8, 0.42, -3.55, sofa); furn(3.4, 0.42, -4.42, 5.8, 0.92, -4.18, sofa);
    furn(3.4, 0.42, -4.42, 3.6, 0.62, -3.55, '#6c3f32'); furn(5.6, 0.42, -4.42, 5.8, 0.62, -3.55, '#6c3f32');
    deco(3.6, 0.42, -4.18, 4.6, 0.47, -3.58, '#8e5847'); deco(4.6, 0.42, -4.18, 5.6, 0.47, -3.58, '#8e5847');
    W.spots.dad = { p: V(4.5, 0.47, -3.92), yaw: 0 };
    // 전자 모기향(소파 머리맡 바닥)
    cyl(BF, 3.12, 0, -3.75, 0.09, 0.05, '#c9ccd2', 16);
    BF.add(new THREE.TorusGeometry(0.06, 0.008, 6, 20).rotateX(Math.PI / 2), '#3d7a3c', TOON.M(3.12, 0.058, -3.75), 0);
    BF.add(new THREE.TorusGeometry(0.035, 0.008, 6, 16).rotateX(Math.PI / 2), '#3d7a3c', TOON.M(3.12, 0.058, -3.75), 0);
    W.coil = V(3.12, 0.06, -3.75);
    // TV 장 + TV(앞벽 쪽, 화면이 소파를 봄)
    furn(3.9, 0, -0.5, 5.3, 0.45, -0.15, '#5a4030'); furn(3.95, 0.45, -0.38, 5.25, 1.25, -0.28, '#1e1e24');
    const tvM = new THREE.MeshBasicMaterial({ color: '#7fb6ff' });
    const tv = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), tvM); tv.position.set(4.6, 0.85, -0.385); tv.rotation.y = Math.PI; scene.add(tv);
    W.anim.push((t) => { const k = 0.75 + 0.25 * Math.sin(t * 3.1) * Math.sin(t * 1.7 + 1); tvM.color.setRGB(0.45 * k + 0.1, 0.62 * k + 0.1, 0.95 * k); });
    // 좌탁·화분·벽시계
    furn(2.7, 0, -2.6, 3.7, 0.36, -1.9, '#b07a4c');
    cyl(BF, 2.05, 0, -0.5, 0.17, 0.3, '#c96b45', 16); BF.add(new THREE.IcosahedronGeometry(0.32, 1), '#4f8a3e', TOON.M(2.05, 0.62, -0.5, 0, 0, 0, 1, 1.2, 1), 0.15);
    W.boxes.push({ x0: 1.8, y0: 0.3, z0: -0.75, x1: 2.3, y1: 0.95, z1: -0.25 });
    BF.add(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24).rotateX(Math.PI / 2), '#f7f1e2', TOON.M(1.3, 2.0, -4.42), 0);
    BF.add(new THREE.TorusGeometry(0.2, 0.025, 6, 24), '#8a5a3a', TOON.M(1.3, 2.0, -4.42), 0);
    // ---------- 부엌 ----------
    furn(-6, 0, -4.4, -5.4, 0.88, -0.6, '#f0ebe0'); deco(-6, 0.88, -4.42, -5.36, 0.92, -0.58, '#8f8a84');
    deco(-5.98, 0.89, -3.0, -5.5, 0.93, -2.2, '#9fb2bf'); // 개수대
    deco(-5.38, 0.06, -4.38, -5.36, 0.8, -0.62, '#e2dccf');
    furn(-6, 1.5, -4.4, -5.65, 2.3, -0.6, '#efe8da');
    cyl(BF, -5.75, 0.92, -1.2, 0.16, 0.18, '#5d6670', 16); // 냄비
    cyl(BF, -5.72, 0.92, -3.7, 0.13, 0.22, '#c8322f', 16); // 밥솥
    furn(-6, 0, -4.42, -5.25, 1.85, -3.62, '#eef2f4'); deco(-5.26, 0.95, -4.3, -5.22, 1.35, -4.26, '#9aa4ab'); deco(-5.26, 0.2, -4.3, -5.22, 0.8, -4.26, '#9aa4ab');
    deco(-5.26, 1.5, -3.9, -5.23, 1.58, -3.82, '#ff6a5a'); deco(-5.26, 1.3, -3.78, -5.23, 1.36, -3.72, '#4fb3ff');
    W.spots.mom = { p: V(-4.95, 0, -2.6), yaw: Math.PI / 2 };
    // 식탁·의자
    furn(-4.0, 0.68, -3.0, -2.9, 0.74, -1.8, '#c99a62'); [[-3.95, -2.95], [-2.95, -2.95], [-3.95, -1.85], [-2.95, -1.85]].forEach((p) => deco(p[0], 0, p[1], p[0] + 0.05, 0.68, p[1] + 0.05, '#a87a48'));
    W.boxes.push({ x0: -4.0, y0: 0, z0: -3.0, x1: -2.9, y1: 0.68, z1: -1.8 });
    furn(-3.7, 0, -3.5, -3.25, 0.44, -3.1, '#9a6c40'); furn(-3.7, 0.44, -3.5, -3.25, 0.95, -3.44, '#9a6c40');
    // 부엌·거실 사이 아일랜드
    furn(-2.6, 0, -3.6, -2.05, 0.9, -1.3, '#d8cdb8'); deco(-2.64, 0.9, -3.64, -2.01, 0.95, -1.26, '#8f8a84');
    // ---------- 안방(아기) ----------
    furn(3.9, 0, -7.9, 5.9, 0.45, -5.7, '#d8c2a0');
    BF.box(3.88, 0.45, -7.4, 5.92, 0.56, -5.68, '#f3b8c4', 0.05); BF.box(4.1, 0.45, -7.88, 5.7, 0.58, -7.45, '#ffffff', 0.04);
    W.boxes.push({ x0: 3.88, y0: 0.45, z0: -7.9, x1: 5.92, y1: 0.58, z1: -5.68 });
    furn(5.3, 0, -5.5, 5.95, 2.0, -4.7, '#c49a74');
    // 아기침대(창살 사이로 모기는 지나감)
    const cx0 = 2.3, cx1 = 3.4, cz0 = -7.85, cz1 = -7.05;
    furn(cx0, 0.42, cz0, cx1, 0.5, cz1, '#ffffff'); BF.box(cx0 + 0.03, 0.5, cz0 + 0.03, cx1 - 0.03, 0.56, cz1 - 0.03, '#bfe3f2', 0.03);
    [[cx0, cz0], [cx1 - 0.05, cz0], [cx0, cz1 - 0.05], [cx1 - 0.05, cz1 - 0.05]].forEach((p) => furn(p[0], 0, p[1], p[0] + 0.05, 0.98, p[1] + 0.05, '#f6f1e8'));
    [[cx0, cz0, cx1, cz0 + 0.04], [cx0, cz1 - 0.04, cx1, cz1], [cx0, cz0, cx0 + 0.04, cz1], [cx1 - 0.04, cz0, cx1, cz1]].forEach((r) => {
      furn(r[0], 0.9, r[1], r[2], 0.95, r[3], '#f6f1e8');
      const along = r[2] - r[0] > r[3] - r[1];
      const n = Math.floor((along ? r[2] - r[0] : r[3] - r[1]) / 0.1);
      for (let i = 1; i < n; i++) { const x = along ? r[0] + i * 0.1 : r[0] + 0.01, z = along ? r[1] + 0.01 : r[1] + i * 0.1; deco(x, 0.56, z, x + 0.02, 0.9, z + 0.02, '#f6f1e8', 0); }
    });
    W.spots.baby = { p: V((cx0 + cx1) / 2, 0.56, (cz0 + cz1) / 2), yaw: 0 };
    // 모빌
    deco(2.84, 1.5, -7.46, 2.86, 2.5, -7.44, '#c8c2b6');
    const mob = new THREE.Group(); mob.position.set(2.85, 1.45, -7.45); scene.add(mob);
    ['#ffd35a', '#7ec8f2', '#f28aa8', '#9ad67a'].forEach((c, i) => {
      const a = (i / 4) * Math.PI * 2, s = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), TOON.col(c)); TOON.outline(s);
      s.position.set(Math.cos(a) * 0.2, -0.15 - (i % 2) * 0.06, Math.sin(a) * 0.2); mob.add(s);
    });
    W.anim.push((t) => { mob.rotation.y = t * 0.4; });
    // ---------- 남고딩 방 ----------
    furn(-1.3, 0.7, -7.95, 0.7, 0.75, -7.3, '#efefef'); deco(-1.28, 0, -7.93, -1.23, 0.7, -7.88, '#555'); deco(0.63, 0, -7.93, 0.68, 0.7, -7.88, '#555');
    deco(-1.28, 0, -7.37, -1.23, 0.7, -7.32, '#555'); deco(0.63, 0, -7.37, 0.68, 0.7, -7.32, '#555');
    W.boxes.push({ x0: -1.3, y0: 0, z0: -7.95, x1: 0.7, y1: 0.7, z1: -7.3 });
    furn(-0.78, 0.75, -7.88, 0.18, 1.32, -7.82, '#15151b'); deco(-0.33, 0.75, -7.8, -0.27, 0.86, -7.72, '#2a2a30');
    const gTex = canvasTex(128, 80, (g, w, h) => {
      g.fillStyle = '#20163a'; g.fillRect(0, 0, w, h); g.fillStyle = '#3fd1a8'; g.fillRect(0, h - 18, w, 18);
      g.fillStyle = '#ffd34a'; g.fillRect(20, h - 32, 10, 14); g.fillStyle = '#ff4f6a'; g.fillRect(84, h - 40, 16, 22); g.fillRect(60, 18, 8, 8); g.fillStyle = '#fff'; g.fillRect(6, 6, 40, 6);
    });
    const monM = new THREE.MeshBasicMaterial({ map: gTex });
    const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), monM); mon.position.set(-0.3, 1.04, -7.815); scene.add(mon);
    W.anim.push((t) => { const k = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 4.3); monM.color.setRGB(k, k, k); });
    deco(-0.62, 0.75, -7.62, -0.02, 0.77, -7.46, '#22222a'); deco(0.1, 0.75, -7.6, 0.2, 0.77, -7.48, '#22222a');
    furn(0.35, 0.75, -7.9, 0.6, 1.22, -7.45, '#22222a'); deco(0.6, 0.8, -7.85, 0.61, 1.17, -7.5, '#ff3fa0', 0);
    // 게이밍 의자
    furn(-0.58, 0.42, -7.05, -0.02, 0.5, -6.55, '#c22b3a'); furn(-0.5, 0.55, -6.6, -0.1, 1.0, -6.53, '#1d1d24'); deco(-0.46, 0.62, -6.61, -0.14, 0.95, -6.6, '#c22b3a'); deco(-0.33, 0, -6.85, -0.27, 0.42, -6.79, '#333');
    W.spots.teen = { p: V(-0.3, 0.5, -6.84), yaw: Math.PI };
    furn(0.9, 0, -7.95, 1.92, 0.48, -5.95, '#7a6a5a'); BF.box(0.88, 0.48, -7.0, 1.94, 0.58, -5.93, '#3f6ec8', 0.05); BF.box(1.0, 0.48, -7.9, 1.8, 0.6, -7.45, '#ffffff', 0.04);
    W.boxes.push({ x0: 0.88, y0: 0.48, z0: -7.95, x1: 1.94, y1: 0.6, z1: -5.93 });
    deco(-1.92, 1.2, -7.6, -1.9, 1.9, -7.0, '#ff7a3a'); deco(-1.92, 1.1, -6.8, -1.9, 1.7, -6.3, '#3a8aff'); deco(-1.92, 1.25, -6.7, -1.89, 1.55, -6.4, '#ffe04a');
    BF.add(new THREE.SphereGeometry(0.11, 12, 8), '#e2672a', TOON.M(1.6, 0.11, -5.4), 0.05); // 농구공
    // ---------- 할아버지 방 ----------
    furn(-4.6, 0.28, -7.3, -3.4, 0.33, -6.6, '#6e4426'); [[-4.55, -7.25], [-3.5, -7.25], [-4.55, -6.7], [-3.5, -6.7]].forEach((p) => deco(p[0], 0, p[1], p[0] + 0.05, 0.28, p[1] + 0.05, '#5a361e'));
    W.boxes.push({ x0: -4.6, y0: 0, z0: -7.3, x1: -3.4, y1: 0.28, z1: -6.6 });
    BF.box(-4.45, 0, -6.4, -3.6, 0.06, -5.6, '#8f2f3a', 0.04); // 방석
    W.spots.grandpa = { p: V(-4.02, 0.06, -6.0), yaw: Math.PI };
    furn(-5.95, 0, -7.9, -5.4, 1.8, -5.6, '#1b1a22'); // 자개장
    for (let i = 0; i < 18; i++) { const y = 0.3 + Math.random() * 1.3, z = -7.7 + Math.random() * 1.9; deco(-5.41, y, z, -5.39, y + 0.05 + Math.random() * 0.06, z + 0.05 + Math.random() * 0.08, ['#bfe8e0', '#f2d8f0', '#dff2b8'][i % 3], 0); }
    furn(-3.0, 0, -7.95, -2.3, 0.5, -7.4, '#6b4a2e'); furn(-2.95, 0.5, -7.85, -2.35, 0.95, -7.45, '#3a3630'); deco(-2.9, 0.55, -7.46, -2.4, 0.9, -7.44, '#4a6a5a');
    // ---------- 마당 ----------
    // 풀숲 늪 웅덩이(태어나는 곳): 들쭉날쭉한 진흙 둔덕, 탁한 초록 물, 개구리밥·연잎·부들
    const bx = 1.6, bz = 3.4, WY = 0.022;
    const rim = (a) => 0.52 + Math.sin(a * 3) * 0.06 + Math.sin(a * 5 + 1) * 0.04 + Math.sin(a * 9 + 2) * 0.02;
    // 진흙 둔덕(물가를 둘러싼 낮은 흙 띠, 바깥으로 갈수록 풀색과 섞임)
    { const sh = new THREE.Shape(), hole = new THREE.Path(), N = 48;
      for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, r = rim(a) + 0.16; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, r = rim(a) - 0.01; i ? hole.lineTo(Math.cos(a) * r, Math.sin(a) * r) : hole.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      sh.holes.push(hole);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.03, bevelSegments: 2, curveSegments: 4 });
      BF.add(g.rotateX(-Math.PI / 2), (x, y, z, c) => { const d = Math.hypot(x - bx, z - bz); c.set(d > 0.62 ? '#5d7a3a' : '#5a4630'); if (y > 0.04) c.set(d > 0.6 ? '#6a8a40' : '#6b5538'); }, TOON.M(bx, -0.012, bz), 0.12); }
    // 웅덩이 바닥(어두운 진흙)
    { const sh = new THREE.Shape(), N = 48; for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, r = rim(a); i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      BF.add(new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), '#2e2a1c', TOON.M(bx, 0.004, bz), 0.05);
      // 탁한 초록 물(만화 반사 띠 두 줄)
      const wTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
        const gr = g.createRadialGradient(64, 64, 10, 64, 64, 70); gr.addColorStop(0, '#5c7a3e'); gr.addColorStop(1, '#3f5a2c'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        g.strokeStyle = 'rgba(220,240,190,.45)'; g.lineWidth = 3; g.beginPath(); g.ellipse(48, 46, 26, 9, -0.3, 3.6, 5.2); g.stroke(); g.beginPath(); g.ellipse(80, 84, 18, 6, -0.3, 3.6, 5.0); g.stroke();
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
      const wg = new THREE.ShapeGeometry(sh); const uv = wg.attributes.uv, pp = wg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pp.getX(i) / 1.3 + 0.5, pp.getY(i) / 1.3 + 0.5);
      const water = new THREE.Mesh(wg.rotateX(-Math.PI / 2), TOON.mat({ map: wTex, transparent: true, opacity: 0.93 }));
      water.position.set(bx, WY, bz); water.receiveShadow = true; scene.add(water); }
    // 개구리밥(작은 초록 점)·연잎 두 장·물가 부들
    for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (rim(a) - 0.05); if (r < 0.12) continue; BF.add(new THREE.CircleGeometry(0.006 + Math.random() * 0.006, 6).rotateX(-Math.PI / 2), Math.random() < 0.5 ? '#8fc34a' : '#6fa83a', TOON.M(bx + Math.cos(a) * r, WY + 0.002, bz + Math.sin(a) * r), 0); }
    [[0.28, -0.12, 0.09, 0.6], [-0.2, 0.25, 0.07, 2.2]].forEach((q) => BF.add(new THREE.CircleGeometry(q[2], 16, 0.4, Math.PI * 2 - 0.4).rotateX(-Math.PI / 2), '#4e8a34', TOON.M(bx + q[0], WY + 0.003, bz + q[1], 0, q[3], 0), 0.06));
    for (let i = 0; i < 7; i++) { const a = 0.35 + i * 0.36, r = rim(a) + 0.05, x = bx + Math.cos(a) * r, z = bz + Math.sin(a) * r, h = 0.35 + (i % 3) * 0.12;
      BF.add(new THREE.CylinderGeometry(0.004, 0.006, h, 5), '#5f7a32', TOON.M(x, h / 2, z, (i % 2 ? 0.08 : -0.06), 0, (i % 3 - 1) * 0.08), 0);
      if (i % 2 === 0) BF.add(new THREE.CapsuleGeometry(0.012, 0.06, 3, 6), '#6a3e22', TOON.M(x, h - 0.03, z), 0.05); }
    W.basin = V(bx, WY + 0.004, bz);
    W.spawn = V(bx, 0.12, bz);
    // 감나무
    cyl(BO, -4.2, 0, 4.6, 0.16, 2.0, '#6a4630', 10);
    [[0, 2.4, 0, 1.1], [0.7, 2.1, 0.3, 0.8], [-0.6, 2.2, -0.2, 0.85], [0.1, 2.9, -0.3, 0.75]].forEach((b) => BO.add(new THREE.IcosahedronGeometry(b[3], 1), (x, y, z, c, nx, ny) => c.set(ny > 0.3 ? '#5c9a46' : '#3f7a36'), TOON.M(-4.2 + b[0], b[1], 4.6 + b[2]), 0.12));
    for (let i = 0; i < 9; i++) { const a = i * 2.3, r = 0.7 + (i % 3) * 0.2; BO.add(new THREE.SphereGeometry(0.06, 8, 6), '#f2862a', TOON.M(-4.2 + Math.cos(a) * r, 1.8 + (i % 4) * 0.25, 4.6 + Math.sin(a) * r), 0); }
    W.boxes.push({ x0: -5.3, y0: 1.5, z0: 3.5, x1: -3.1, y1: 3.5, z1: 5.7 });
    // 담장(시멘트 블록)
    const wallC = (x, y, z, c) => { c.set('#b3ada3'); if ((Math.floor(x / 0.4) + Math.floor(y / 0.2) + Math.floor(z / 0.4)) % 2) c.set('#aca69c'); };
    BO.box(-9, 0, 7.8, 9, 1.4, 8, wallC, 0.02, 0.2); BO.box(-9, 0, -8.6, -8.8, 1.4, 8, wallC, 0.02, 0.2); BO.box(8.8, 0, -8.6, 9, 1.4, 8, wallC, 0.02, 0.2);
    BO.box(-9, 0, -8.8, 9, 1.4, -8.6, wallC, 0.02, 0.2);
    // 화분 몇 개
    [[3.2, 1.2], [3.6, 1.0], [-2.4, 1.1]].forEach((p, i) => { cyl(BF, p[0], 0, p[1], 0.14, 0.22, '#a9603e', 12); BF.add(new THREE.IcosahedronGeometry(0.2, 1), ['#4d9440', '#e5577a', '#58a048'][i], TOON.M(p[0], 0.38, p[1]), 0.15); });
    // 빨랫줄 기둥
    cyl(BO, 5.5, 0, 3.0, 0.04, 1.9, '#8a8f98', 8); cyl(BO, 5.5, 0, 6.5, 0.04, 1.9, '#8a8f98', 8);
    deco(5.49, 1.85, 3.0, 5.51, 1.87, 6.5, '#ddd');
    [[3.6, '#ffffff'], [4.4, '#7ab8e8'], [5.3, '#f2c94c']].forEach((s) => deco(5.47, 1.35, s[0], 5.53, 1.85, s[0] + 0.55, s[1], 0.03));

    // ---------- 합쳐서 장면에 ----------
    W.meshes = [BW.build({ cast: false }), BF.build({ cast: true }), BO.build({ cast: false })];
    W.meshes.forEach((m) => scene.add(m));
    // 천장 등(빛나는 원판)
    const lampM = new THREE.MeshBasicMaterial({ color: '#fff8e2' });
    [[2.2, -2.2], [-4, -2.2], [-4, -6.2], [0, -6.2], [4, -6.2]].forEach((p) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20).rotateX(Math.PI / 2), lampM); l.position.set(p[0], 2.495, p[1]); scene.add(l); });
    // 풀(모기 눈엔 거인 풀숲) — 대야 둘레
    buildGrass(scene, bx, bz);
    buildSmoke(scene);
    W.bounds = { x0: -8.6, x1: 8.6, y0: 0.01, y1: 4.6, z0: -8.5, z1: 7.6 };
  };

  function buildGrass(scene, cx, cz) {
    const pos = [], col = [], nor = [];
    const c0 = new THREE.Color('#2f6a2e'), c1 = new THREE.Color('#9fd86a');
    let n = 0;
    for (let i = 0; i < 1400 && n < 1100; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.74 + Math.pow(Math.random(), 0.7) * 3.1;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      if (z < 0.4) continue;
      n++;
      const h = 0.12 + Math.random() * 0.34 * (1.1 - r / 4), w = 0.012 + Math.random() * 0.01, rot = Math.random() * Math.PI, lean = (Math.random() - 0.5) * 0.5;
      const dx = Math.cos(rot) * w, dz = Math.sin(rot) * w, tx = x + Math.cos(rot + 1.57) * lean * h, tz = z + Math.sin(rot + 1.57) * lean * h;
      pos.push(x - dx, 0, z - dz, x + dx, 0, z + dz, tx, h, tz);
      const nx = -Math.sin(rot), nz = Math.cos(rot);
      for (let k = 0; k < 3; k++) nor.push(nx, 0.3, nz);
      const k = 0.8 + Math.random() * 0.3;
      col.push(c0.r * k, c0.g * k, c0.b * k, c0.r * k, c0.g * k, c0.b * k, c1.r * k, c1.g * k, c1.b * k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, TOON.mat({ vertexColors: true, side: THREE.DoubleSide }));
    m.receiveShadow = true; scene.add(m); W.grass = m;
  }
  // 모기향 연기: 미리 만든 판 몇 장을 돌려 씀
  function buildSmoke(scene) {
    const tex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); const gr = g.createRadialGradient(32, 32, 4, 32, 32, 30); gr.addColorStop(0, 'rgba(235,235,240,.75)'); gr.addColorStop(1, 'rgba(235,235,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })();
    W.puffTex = tex;
    const ps = [];
    for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.5 })); s.userData.t = i / 14; scene.add(s); ps.push(s); }
    W.anim.push((t, dt) => {
      ps.forEach((s, i) => {
        s.userData.t = (s.userData.t + dt * 0.12) % 1; const k = s.userData.t;
        s.position.set(W.coil.x + Math.sin(k * 9 + i) * 0.08 * k, W.coil.y + k * 1.0, W.coil.z + Math.cos(k * 7 + i) * 0.08 * k);
        const sc = 0.06 + k * 0.32; s.scale.set(sc, sc, 1); s.material.opacity = 0.55 * (1 - k);
      });
    });
  }

  W.update = function (t, dt) { for (const f of W.anim) f(t, dt); };

  // ---------- 부딪힘 ----------
  // 공(p, r)을 상자 밖으로 밀어내고 그쪽 속도를 지운다. 닿은 면 법선 수를 돌려준다.
  const _q = new THREE.Vector3(), _d = new THREE.Vector3();
  W.push = function (p, r, v) {
    let hit = 0;
    for (const b of W.boxes) {
      if (p.x < b.x0 - r || p.x > b.x1 + r || p.y < b.y0 - r || p.y > b.y1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
      _q.set(Math.min(Math.max(p.x, b.x0), b.x1), Math.min(Math.max(p.y, b.y0), b.y1), Math.min(Math.max(p.z, b.z0), b.z1));
      _d.subVectors(p, _q); const dist = _d.length();
      if (dist > 1e-6) {
        if (dist >= r) continue;
        _d.multiplyScalar(1 / dist); p.addScaledVector(_d, r - dist);
      } else {
        // 상자 속: 가장 얕은 쪽으로
        const pen = [p.x - b.x0, b.x1 - p.x, p.y - b.y0, b.y1 - p.y, p.z - b.z0, b.z1 - p.z]; let mi = 0; for (let i = 1; i < 6; i++) if (pen[i] < pen[mi]) mi = i;
        _d.set(0, 0, 0); const ax = mi >> 1, sg = mi & 1 ? 1 : -1; _d.setComponent(ax, sg); p.setComponent(ax, p.getComponent(ax) + sg * (pen[mi] + r));
      }
      if (v) { const vn = v.dot(_d); if (vn < 0) v.addScaledVector(_d, -vn); }
      hit++;
    }
    const B = W.bounds;
    if (B) { p.x = Math.min(Math.max(p.x, B.x0), B.x1); p.y = Math.min(Math.max(p.y, B.y0 + r), B.y1); p.z = Math.min(Math.max(p.z, B.z0), B.z1); }
    return hit;
  };
  // 선분 a→b 가 처음 상자에 닿는 비율(0~1), 없으면 1
  W.ray = function (a, b, pad) {
    let best = 1; const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, e = pad || 0;
    for (const bx of W.boxes) {
      let t0 = 0, t1 = best, ok = true;
      const ax = [[a.x, dx, bx.x0 - e, bx.x1 + e], [a.y, dy, bx.y0 - e, bx.y1 + e], [a.z, dz, bx.z0 - e, bx.z1 + e]];
      for (const s of ax) {
        if (Math.abs(s[1]) < 1e-9) { if (s[0] < s[2] || s[0] > s[3]) { ok = false; break; } continue; }
        let u0 = (s[2] - s[0]) / s[1], u1 = (s[3] - s[0]) / s[1]; if (u0 > u1) { const k = u0; u0 = u1; u1 = k; }
        t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 > t1) { ok = false; break; }
      }
      if (ok && t0 < best) best = t0;
    }
    return best;
  };
  // 발밑 바닥 높이(그림자 점 자리)
  W.floorY = function (p) {
    let y = p.z > 0.15 ? 0 : 0;
    for (const b of W.boxes) { if (p.x >= b.x0 && p.x <= b.x1 && p.z >= b.z0 && p.z <= b.z1 && b.y1 <= p.y + 0.001 && b.y1 > y) y = b.y1; }
    return y;
  };
  // 어느 방인가(표시용)
  W.room = function (p) {
    if (p.z > 0.1) return 'yard';
    if (p.z > -4.5) return p.x < -2 ? 'kitchen' : 'living';
    return p.x < -2 ? 'grandpa' : p.x < 2 ? 'teen' : 'baby';
  };
})();
