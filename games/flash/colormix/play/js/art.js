// 그림 그리기: 물감 방울·팔레트 판·카드 그림 — 과슈 그림체(평평한 면 + 한 단계 그늘 + 밝은 붓 자국, 빛은 왼쪽 위)
(function () {
  const { css, shade } = window.MIX;
  const ART = (window.ART = {});
  const TAU = Math.PI * 2;
  function rng(seed) { let s = (seed * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
  // 울퉁불퉁한 동그라미(손으로 짠 물감)
  function lumpPath(g, x, y, r, seed, wob, sx, sy) {
    const n = 22, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + 0.055 * Math.sin(a * 3 + seed * 1.7) + 0.04 * Math.sin(a * 5 + seed * 3.1) + wob * Math.sin(a * 2 + seed + performance.now() / 90);
      pts.push([x + Math.cos(a) * r * k * sx, y + Math.sin(a) * r * k * sy]);
    }
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      if (i === 0) g.moveTo(mx, my); else g.quadraticCurveTo(p[0], p[1], mx, my);
    }
    const p = pts[0], q = pts[1];
    g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    g.closePath();
  }
  ART.lumpPath = lumpPath;
  // 물감 방울 하나. c = [r,g,b] 0~1, o = {wob, sx, sy, glow}
  ART.blob = function (g, x, y, r, c, seed, o) {
    o = o || {};
    const sx = o.sx || 1, sy = o.sy || 1, wob = o.wob || 0;
    g.save();
    // 판에 떨어진 그림자
    g.fillStyle = 'rgba(60,30,10,.28)';
    lumpPath(g, x + r * 0.1, y + r * 0.2, r * 1.0, seed, 0, sx, sy * 0.92); g.fill();
    if (o.glow) { g.shadowColor = 'rgba(255,240,180,' + o.glow + ')'; g.shadowBlur = r * 0.9; }
    // 그늘 면(오른쪽 아래)
    g.fillStyle = css(shade(c, -0.3));
    lumpPath(g, x, y, r, seed, wob, sx, sy); g.fill();
    g.shadowBlur = 0;
    g.save();
    lumpPath(g, x, y, r, seed, wob, sx, sy); g.clip();
    // 밝은 면
    g.fillStyle = css(c);
    lumpPath(g, x - r * 0.12, y - r * 0.15, r * 0.9, seed + 2, wob, sx, sy); g.fill();
    // 붓 자국(밝은 결 두세 줄)
    const R = rng(seed);
    g.strokeStyle = css(shade(c, 0.22), 0.55); g.lineCap = 'round'; g.lineWidth = Math.max(1.5, r * 0.09);
    for (let i = 0; i < 3; i++) {
      const a0 = -2.6 + R() * 0.6, rr = r * (0.35 + i * 0.18);
      g.beginPath(); g.arc(x - r * 0.05, y, rr, a0, a0 + 0.9 + R() * 0.5); g.stroke();
    }
    // 반짝(왼쪽 위, 크림색 붓 한 번)
    g.fillStyle = 'rgba(255,252,240,.78)';
    g.beginPath(); g.ellipse(x - r * 0.38 * sx, y - r * 0.4 * sy, r * 0.2 * sx, r * 0.11 * sy, -0.7, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,252,240,.5)';
    g.beginPath(); g.arc(x - r * 0.12 * sx, y - r * 0.58 * sy, r * 0.06, 0, TAU); g.fill();
    g.restore();
    // 테두리: 그 면의 짙은 색으로 가늘게
    g.strokeStyle = css(shade(c, -0.5), 0.55); g.lineWidth = Math.max(1, r * 0.045);
    lumpPath(g, x, y, r, seed, wob, sx, sy); g.stroke();
    g.restore();
  };
  // 팔레트 판(나무) + 우물 칸
  ART.board = function (g, W, H, L, cell, ox, oy, wood) {
    const pad = cell * 0.32, x0 = ox - pad, y0 = oy - pad, bw = L.w * cell + pad * 2, bh = L.h * cell + pad * 2, rr = cell * 0.5;
    g.save();
    g.fillStyle = 'rgba(50,25,8,.35)';
    rrect(g, x0 + cell * 0.08, y0 + cell * 0.14, bw, bh, rr); g.fill();
    rrect(g, x0, y0, bw, bh, rr); g.save(); g.clip();
    if (wood && wood.complete && wood.naturalWidth) {
      const pat = g.createPattern(wood, 'repeat'); g.fillStyle = pat; g.fillRect(x0, y0, bw, bh);
      g.fillStyle = 'rgba(255,236,200,.38)'; g.fillRect(x0, y0, bw, bh);
    } else { g.fillStyle = '#d9a768'; g.fillRect(x0, y0, bw, bh); }
    // 판 윗면 빛(왼쪽 위) · 아래 그늘
    g.fillStyle = 'rgba(255,245,220,.25)'; g.fillRect(x0, y0, bw, cell * 0.12);
    g.fillStyle = 'rgba(80,40,10,.18)'; g.fillRect(x0, y0 + bh - cell * 0.14, bw, cell * 0.14);
    g.restore();
    g.strokeStyle = 'rgba(90,50,20,.6)'; g.lineWidth = Math.max(2, cell * 0.04); rrect(g, x0, y0, bw, bh, rr); g.stroke();
    const R = rng(7);
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
      const cx = ox + (x + 0.5) * cell, cy = oy + (y + 0.5) * cell, r = cell * 0.43;
      g.fillStyle = 'rgba(110,62,24,.26)'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,240,210,.32)'; g.beginPath(); g.arc(cx + r * 0.08, cy + r * 0.1, r * 0.9, 0, TAU); g.fill();
      g.fillStyle = 'rgba(232,200,150,.55)'; g.beginPath(); g.arc(cx + r * 0.05, cy + r * 0.07, r * 0.86, 0, TAU); g.fill();
      if (R() < 0.3) {   // 말라붙은 물감 얼룩
        const sc = [[.85, .3, .25], [.95, .8, .3], [.3, .45, .75], [.4, .6, .3], [.6, .35, .6]][Math.floor(R() * 5)];
        g.strokeStyle = css(sc, 0.18); g.lineWidth = r * 0.22; g.lineCap = 'round';
        const a = R() * TAU; g.beginPath(); g.arc(cx, cy, r * 0.55, a, a + 1 + R()); g.stroke();
      }
    }
    g.restore();
  };
  // 코르크 마개(막힌 칸)
  ART.cork = function (g, cx, cy, r) {
    g.save();
    g.fillStyle = 'rgba(50,25,8,.35)'; g.beginPath(); g.ellipse(cx + r * 0.08, cy + r * 0.16, r, r * 0.95, 0, 0, TAU); g.fill();
    g.fillStyle = '#8f6236'; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
    g.fillStyle = '#c8955c'; g.beginPath(); g.arc(cx - r * 0.06, cy - r * 0.08, r * 0.86, 0, TAU); g.fill();
    const R = rng(Math.round(cx * 7 + cy));
    for (let i = 0; i < 26; i++) {
      const a = R() * TAU, d = Math.sqrt(R()) * r * 0.78;
      g.fillStyle = R() < 0.5 ? 'rgba(110,70,35,.55)' : 'rgba(240,205,150,.6)';
      g.beginPath(); g.arc(cx - r * 0.06 + Math.cos(a) * d, cy - r * 0.08 + Math.sin(a) * d, r * (0.04 + R() * 0.05), 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(90,55,25,.6)'; g.lineWidth = r * 0.06; g.beginPath(); g.arc(cx - r * 0.06, cy - r * 0.08, r * 0.62, 0, TAU); g.stroke();
    g.restore();
  };
  function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  ART.rrect = rrect;
  ART.rng = rng;
})();
// 카드 그림(200×200 기준으로 그려서 캔버스 크기에 맞춘다)
(function () {
  const ART = window.ART, { css, shade, rgb, PIG } = window.MIX, TAU = Math.PI * 2;
  const ink = 'rgba(58,42,30,.75)';
  function outline(g, w) { g.strokeStyle = ink; g.lineWidth = w || 3; g.lineJoin = 'round'; g.stroke(); }
  function tube(g, c, size, gold) {
    g.save(); g.translate(100, 104); g.rotate(-0.55); g.scale(size, size);
    if (gold) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.fillStyle = 'rgba(255,225,120,.9)'; g.beginPath(); g.arc(Math.cos(a) * 92, Math.sin(a) * 92, 4, 0, TAU); g.fill(); }
    // 짜낸 물감
    ART.blob(g, 0, -86 + 6, 16, c, 3);
    // 몸통(은색) + 색 띠
    g.beginPath(); g.moveTo(-26, -50); g.lineTo(26, -50); g.lineTo(32, 52); g.lineTo(-32, 52); g.closePath();
    g.fillStyle = gold ? '#e8c25a' : '#d9d6cf'; g.fill(); outline(g);
    g.fillStyle = css(c); g.fillRect(-28, -22, 57, 46);
    g.fillStyle = css(shade(c, -0.3)); g.fillRect(8, -22, 21, 46);
    g.fillStyle = 'rgba(255,252,240,.85)'; g.fillRect(-28, -2, 57, 7);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-20, -48, 8, 98);
    // 접힌 끝
    g.beginPath(); g.moveTo(-34, 52); g.lineTo(34, 52); g.lineTo(34, 66); g.lineTo(-34, 66); g.closePath(); g.fillStyle = '#b9b4aa'; g.fill(); outline(g);
    for (let i = -28; i < 30; i += 8) { g.beginPath(); g.moveTo(i, 54); g.lineTo(i, 64); g.strokeStyle = 'rgba(60,50,40,.35)'; g.lineWidth = 2; g.stroke(); }
    // 어깨 + 뚜껑
    g.beginPath(); g.moveTo(-26, -50); g.lineTo(-10, -62); g.lineTo(10, -62); g.lineTo(26, -50); g.closePath(); g.fillStyle = '#c9c5bc'; g.fill(); outline(g);
    g.restore();
  }
  function cup(g, x, y, s, gold) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); g.moveTo(-34, -46); g.lineTo(34, -46); g.lineTo(26, 48); g.lineTo(-26, 48); g.closePath();
    g.fillStyle = gold ? 'rgba(242,200,90,.5)' : 'rgba(220,235,240,.6)'; g.fill();
    g.beginPath(); g.moveTo(-31, -14); g.lineTo(31, -14); g.lineTo(26, 48); g.lineTo(-26, 48); g.closePath();
    g.fillStyle = gold ? '#e9b53c' : '#8fc3dc'; g.fill();
    g.fillStyle = gold ? '#f8d877' : '#b9def0'; g.beginPath(); g.ellipse(0, -14, 31, 6, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-34, -46); g.lineTo(34, -46); g.lineTo(26, 48); g.lineTo(-26, 48); g.closePath(); outline(g);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-24, -40, 7, 80);
    g.restore();
  }
  ART.card = function (cv, id) {
    const g = cv.getContext('2d'), s = cv.width / 200;
    g.clearRect(0, 0, cv.width, cv.height);
    g.save(); g.scale(s, s);
    const tm = /^t([RYBWK])([23]?)$/.exec(id);
    if (tm) { const n = tm[2] ? +tm[2] : 1; tube(g, rgb(PIG['RYBWK'.indexOf(tm[1])]), n === 2 ? 1.12 : n === 3 ? 1.05 : 0.92, n === 3); }
    else if (id === 'cup') cup(g, 100, 104, 1);
    else if (id === 'cup2') { cup(g, 72, 110, 0.85); cup(g, 128, 96, 0.85); }
    else if (id === 'cup3') { cup(g, 58, 116, 0.7); cup(g, 100, 92, 0.7); cup(g, 142, 116, 0.7); }
    else if (id === 'can') {
      g.save(); g.translate(96, 110);
      g.beginPath(); g.moveTo(-46, -34); g.lineTo(34, -34); g.lineTo(40, 50); g.lineTo(-52, 50); g.closePath(); g.fillStyle = '#5f9a6e'; g.fill(); outline(g);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-38, -28, 10, 72);
      g.beginPath(); g.moveTo(34, 0); g.lineTo(84, -52); g.lineTo(92, -44); g.lineTo(40, 16); g.closePath(); g.fillStyle = '#4d8460'; g.fill(); outline(g);
      g.beginPath(); g.ellipse(90, -50, 12, 7, -0.8, 0, TAU); g.fillStyle = '#3f6e50'; g.fill(); outline(g);
      g.beginPath(); g.arc(-6, -34, 30, Math.PI, 0); g.strokeStyle = ink; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#5f9a6e'; g.lineWidth = 4; g.stroke();
      [[104, -40], [110, -28], [100, -22]].forEach(([x, y]) => { g.fillStyle = '#8fc3dc'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); });
      g.restore();
    }
    else if (id === 'jar') {
      cup(g, 100, 108, 1.15, 1);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.fillStyle = 'rgba(255,240,170,.9)'; g.beginPath(); g.arc(100 + Math.cos(a) * 78, 100 + Math.sin(a) * 78, 4, 0, TAU); g.fill(); }
    } else if (id === 'rag') {
      g.save(); g.translate(100, 104);
      g.beginPath(); g.moveTo(-62, -30); g.quadraticCurveTo(-20, -60, 30, -44); g.quadraticCurveTo(70, -30, 58, 12); g.quadraticCurveTo(64, 50, 20, 54); g.quadraticCurveTo(-30, 66, -56, 38); g.quadraticCurveTo(-76, 0, -62, -30); g.closePath();
      g.fillStyle = '#efe7d6'; g.fill(); outline(g);
      [[-30, -16, [.85, .19, .17]], [18, -20, [.13, .33, .7]], [-6, 22, [.98, .8, .18]], [30, 24, [.22, .58, .26]]].forEach(([x, y, c], i) => { g.fillStyle = css(c, 0.75); g.beginPath(); g.ellipse(x, y, 16, 9, i, 0, TAU); g.fill(); });
      g.strokeStyle = 'rgba(120,100,80,.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-40, 0); g.quadraticCurveTo(0, -12, 40, 4); g.stroke();
      g.restore();
    } else if (id === 'drop') {
      g.save(); g.translate(100, 100); g.rotate(0.6);
      g.beginPath(); g.rect(-9, -20, 18, 74); g.fillStyle = 'rgba(220,235,240,.8)'; g.fill(); outline(g);
      g.beginPath(); g.moveTo(-9, 54); g.lineTo(0, 74); g.lineTo(9, 54); g.closePath(); g.fillStyle = 'rgba(220,235,240,.8)'; g.fill(); outline(g);
      g.fillStyle = '#8d4fa5'; g.fillRect(-7, 20, 14, 33);
      g.beginPath(); g.ellipse(0, -40, 17, 25, 0, 0, TAU); g.fillStyle = '#c8402e'; g.fill(); outline(g);
      g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-6, -48, 5, 10, 0, 0, TAU); g.fill();
      g.restore();
      ART.blob(g, 62, 158, 12, [0.47, 0.2, 0.55], 4);
    } else if (id === 'knife') {
      g.save(); g.translate(100, 100); g.rotate(-0.7);
      g.beginPath(); g.moveTo(-8, 10); g.lineTo(8, 10); g.lineTo(10, 80); g.quadraticCurveTo(0, 90, -10, 80); g.closePath(); g.fillStyle = '#a0652f'; g.fill(); outline(g);
      g.fillStyle = '#c9c6bf'; g.fillRect(-5, -6, 10, 18);
      g.beginPath(); g.moveTo(-3, -6); g.lineTo(-16, -40); g.quadraticCurveTo(-18, -84, 0, -90); g.quadraticCurveTo(18, -84, 16, -40); g.lineTo(3, -6); g.closePath();
      g.fillStyle = '#d7d9dc'; g.fill(); outline(g);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-9, -76, 5, 40);
      g.fillStyle = css([0.95, 0.5, 0.14], 0.85); g.beginPath(); g.ellipse(2, -72, 11, 14, 0, 0, TAU); g.fill();
      g.restore();
    } else if (id === 'brush') {
      g.save(); g.translate(100, 100); g.rotate(0.75);
      g.beginPath(); g.moveTo(-6, -10); g.lineTo(6, -10); g.lineTo(4, 82); g.lineTo(-4, 82); g.closePath(); g.fillStyle = '#e2a93a'; g.fill(); outline(g);
      g.fillStyle = '#c9c6bf'; g.fillRect(-8, -30, 16, 22); g.strokeStyle = ink; g.strokeRect(-8, -30, 16, 22);
      g.beginPath(); g.moveTo(-8, -30); g.quadraticCurveTo(-10, -60, 0, -78); g.quadraticCurveTo(10, -60, 8, -30); g.closePath(); g.fillStyle = '#f4c542'; g.fill(); outline(g);
      g.restore();
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; g.fillStyle = 'rgba(255,230,140,.95)'; g.beginPath(); g.arc(100 + Math.cos(a) * 80, 100 + Math.sin(a) * 80, 5, 0, TAU); g.fill(); }
    }
    g.restore();
  };
})();
