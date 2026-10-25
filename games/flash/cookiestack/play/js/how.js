// HOW TO PLAY 그림 셋: 실제 게임처럼 비스듬히 본 점토 블록을 2D 로 되풀이해 그린다.
(function () {
  const H = (window.HOW = {});
  let raf = 0, t0 = 0;
  const C = [];
  // 비스듬한 상자 하나(위·왼쪽·오른쪽 면 명암 + 점토 테)
  function box(g, cx, cy, w, d, h, ice, sq, dough) {
    const col = dough ? '#8a5030' : '#eab468';
    sq = sq || 0; h = h * (1 - sq); w *= 1 + sq * 0.4; d *= 1 + sq * 0.4;
    const k = 0.5, ax = w * 0.87, az = d * 0.87;
    const top = [[cx - ax / 2 + az / 2, cy - (ax / 2 + az / 2) * k], [cx + ax / 2 + az / 2, cy - (az / 2 - ax / 2) * k], [cx + ax / 2 - az / 2, cy + (ax / 2 + az / 2) * k], [cx - ax / 2 - az / 2, cy + (ax / 2 - az / 2) * k]];
    const shade = (f) => { const c = col.replace('#', ''); const n = parseInt(c, 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255; r = Math.min(255, r * f) | 0; gg = Math.min(255, gg * f) | 0; b = Math.min(255, b * f) | 0; return 'rgb(' + r + ',' + gg + ',' + b + ')'; };
    const poly = (pts, fill) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = fill; g.fill(); g.lineJoin = 'round'; g.lineWidth = 2.2; g.strokeStyle = 'rgba(40,20,60,.55)'; g.stroke(); };
    poly([top[3], top[2], [top[2][0], top[2][1] + h], [top[3][0], top[3][1] + h]], shade(0.78));
    poly([top[2], top[1], [top[1][0], top[1][1] + h], [top[2][0], top[2][1] + h]], shade(0.6));
    poly(top, shade(1.08));
    // 아이싱: 윗면 안쪽을 형광색으로, 몸통 옆면은 반죽색이 보이게 다시 칠함
    if (ice) {
      const ins = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
      const c0 = [(top[0][0] + top[2][0]) / 2, (top[0][1] + top[2][1]) / 2];
      const it = top.map((p) => ins(p, c0, 0.18).map((v, i) => v - (i ? 3 : 0)));
      const ic = ice; g.beginPath(); it.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = ic; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(40,20,60,.45)'; g.stroke();
    }
    // 반짝 점(점토 광)
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(top[0][0] * 0.4 + top[2][0] * 0.6 - 6, top[0][1] * 0.4 + top[2][1] * 0.6 - 2, 7, 3, -0.4, 0, 7); g.fill();
  }
  function tap(g, x, y, u) { if (u < 0 || u > 1) return; g.strokeStyle = 'rgba(255,255,255,' + (1 - u) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 8 + u * 26, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,' + (0.9 - u * 0.6) + ')'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }
  function bg(g, W, Hh) { const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#7cc8f2'); gr.addColorStop(1, '#e6f6ff'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
  function stack(g, cx, cy, n) { const cols = ['#ff3fa4', '#ff7a1a', '#ffe62e']; for (let i = 0; i < n; i++) box(g, cx, cy - i * 16, 70, 70, 16, cols[i % 3], 0, i % 2); return cy - n * 16; }
  const draws = [
    // 1: 오가는 블록 → 누르면 떨어져 붙음
    (g, W, Hh, t) => {
      bg(g, W, Hh); const T = t % 3, cx = W / 2, by = Hh * 0.74;
      const top = stack(g, cx, by, 3);
      if (T < 1.6) { const off = Math.sin(T * 2.4 - 1.2) * 46; box(g, cx + off * 0.87, top + off * 0.43 - 2, 70, 70, 16, '#7dff3a'); if (T > 1.35) tap(g, W * 0.78, Hh * 0.28, (T - 1.35) / 0.4); }
      else { const sq = Math.max(0, 0.35 - (T - 1.6) * 0.9) * Math.cos((T - 1.6) * 14); const off = Math.sin(1.6 * 2.4 - 1.2) * 46; box(g, cx + off * 0.87 * 0, top, 70, 70, 16, '#7dff3a', Math.max(0, sq)); }
    },
    // 2: 삐져나온 만큼 잘려 떨어짐
    (g, W, Hh, t) => {
      bg(g, W, Hh); const T = t % 3, cx = W / 2, by = Hh * 0.74;
      const top = stack(g, cx, by, 3);
      const o = 26;
      if (T < 1) { box(g, cx + o * 0.87, top + o * 0.43, 70, 70, 16, '#18e8ff'); tap(g, W * 0.78, Hh * 0.28, (T - 0.6) / 0.4); }
      else {
        const k = T - 1;
        box(g, cx + o * 0.87 / 2, top + o * 0.43 / 2, 70 - o, 70, 16, '#18e8ff');
        const fx = cx + (70 / 2 + o / 2) * 0.87 * 0.98 + k * 22, fy = top + (70 / 2) * 0.43 + 18 + k * k * 160;
        g.save(); g.translate(fx, fy); g.rotate(k * 1.2); box(g, 0, 0, o, 70, 16, '#18e8ff'); g.restore();
      }
    },
    // 3: 딱 맞추면 PERFECT, 다 쌓으면 받침
    (g, W, Hh, t) => {
      bg(g, W, Hh); const T = t % 3.2, cx = W / 2, by = Hh * 0.78;
      const top = stack(g, cx, by, 3);
      if (T < 0.8) { box(g, cx + (0.8 - T) * 40, top + (0.8 - T) * 20, 70, 70, 16, '#ff4fd8'); tap(g, W * 0.78, Hh * 0.28, (T - 0.5) / 0.3); }
      else {
        box(g, cx, top, 70, 70, 16, '#ff4fd8');
        const u = Math.min(1, (T - 0.8) / 0.6);
        g.strokeStyle = 'rgba(255,255,255,' + (1 - u) + ')'; g.lineWidth = 5;
        g.beginPath(); const s = 1 + u * 0.7, a = 70 * 0.87 * s; g.moveTo(cx, top - a * 0.5); g.lineTo(cx + a, top); g.lineTo(cx, top + a * 0.5); g.lineTo(cx - a, top); g.closePath(); g.stroke();
        g.font = '900 30px Ttl, Ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 7; g.strokeStyle = '#3a1a5a'; g.fillStyle = '#ffe62e';
        const y = Hh * 0.2 - u * 6; g.strokeText('PERFECT', cx, y); g.fillText('PERFECT', cx, y);
      }
    },
  ];
  H.open = function () {
    C.length = 0;
    ['hw1', 'hw2', 'hw3'].forEach((id) => { const c = document.getElementById(id); C.push(c); });
    t0 = performance.now();
    cancelAnimationFrame(raf);
    const fr = (ts) => { const t = (ts - t0) / 1000; C.forEach((c, i) => { const g = c.getContext('2d'); draws[i](g, c.width, c.height, t); }); raf = requestAnimationFrame(fr); };
    raf = requestAnimationFrame(fr);
    H.draw = (t) => C.forEach((c, i) => draws[i](c.getContext('2d'), c.width, c.height, t));
  };
  H.close = function () { cancelAnimationFrame(raf); };
})();
