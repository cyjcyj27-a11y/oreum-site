// HOW TO PLAY 움직이는 그림 셋 + 도감 벌 그림(캔버스 2D, 점토 느낌으로 둥글게 명암).
(function () {
  const H = (window.HOW = {});
  let raf = 0;
  function ball(g, x, y, r, c, sh) {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, shade(c, 1.35)); gr.addColorStop(0.6, c); gr.addColorStop(1, shade(c, sh || 0.65));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  function shade(hex, k) { const c = parseInt(hex.slice(1), 16); let r = (c >> 16) & 255, gg = (c >> 8) & 255, b = c & 255; r = Math.min(255, r * k); gg = Math.min(255, gg * k); b = Math.min(255, b * k); return 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')'; }
  // 벌 그림: 종마다 배 무늬(bands)·몸매(sh)·털(fuzz)·다리(legs, dangle)가 다르다. 머리가 위(-y).
  function bee(g, x, y, s, sp, ang, dead) {
    const sh = sp.sh || [1, 1, 1, 1], aw = 9 * sh[0], al = 15 * sh[1], tr = 7.5 * sh[2], hr = 6.5 * sh[3];
    const ay = tr * 0.75 + al - 2, hy = -(tr * 0.7 + hr * 0.75);
    g.save(); g.translate(x, y); g.rotate(ang || 0); g.scale(s, s);
    g.lineCap = 'round';
    // 다리
    g.strokeStyle = dead ? '#555' : (sp.legs || '#3a2410'); g.lineWidth = 1.6;
    for (let i = -1; i <= 1; i++) for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * tr * 0.6, i * 3); g.lineTo(d * (tr + 5), i * 6 + 1); g.lineTo(d * (tr + 7), i * 6 + 6); g.stroke(); }
    if (sp.dangle) { g.lineWidth = 1.8; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 3, 4); g.lineTo(d * (aw + 5), ay - 2); g.lineTo(d * (aw + 3), ay + al + 6); g.stroke(); } }
    // 더듬이
    g.strokeStyle = dead ? '#444' : '#1a140c'; g.lineWidth = 1.3;
    for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * 2, hy - hr * 0.6); g.quadraticCurveTo(d * 5, hy - hr - 7, d * 9, hy - hr - 5); g.stroke(); }
    // 날개
    g.fillStyle = 'rgba(255,255,255,.7)'; g.strokeStyle = 'rgba(80,80,90,.5)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(-tr - 3, 6, 5.5, 14, 0.75, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(tr + 3, 6, 5.5, 14, -0.75, 0, 7); g.fill(); g.stroke();
    // 배(종마다 무늬)
    g.save(); g.beginPath(); g.ellipse(0, ay, aw, al, 0, 0, 7); g.clip();
    g.fillStyle = dead ? '#777777' : sp.col; g.fillRect(-aw, ay - al, aw * 2, al * 2);
    (sp.bands || [[0.2, 0.32, '#1a140c'], [0.48, 0.6, '#1a140c'], [0.76, 0.88, '#1a140c']]).forEach(([a, b, c]) => {
      g.fillStyle = dead ? '#444444' : c; const y0 = ay - al + a * al * 2, y1 = ay - al + b * al * 2;
      if (sp.wavy) { g.beginPath(); g.moveTo(-aw, y0); for (let xx = -aw; xx <= aw; xx += 1) g.lineTo(xx, y1 + Math.sin(xx / aw * Math.PI * 2.5) * 1.3); g.lineTo(aw, y0); g.fill(); }
      else g.fillRect(-aw, y0, aw * 2, y1 - y0);
    });
    // 둥근 명암
    const gr = g.createRadialGradient(-aw * 0.35, ay - al * 0.3, 1, 0, ay, al * 1.1);
    gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.4)');
    g.fillStyle = gr; g.fillRect(-aw, ay - al, aw * 2, al * 2);
    g.restore();
    // 가슴(털보·꿀벌은 털)
    if (sp.fuzz) { g.strokeStyle = dead ? '#555' : shade(sp.tho, 1.25); g.lineWidth = 1.4; for (let i = 0; i < 22; i++) { const t = i / 22 * 6.283; g.beginPath(); g.moveTo(Math.cos(t) * tr * 0.8, Math.sin(t) * tr * 0.8); g.lineTo(Math.cos(t) * (tr + 2.6), Math.sin(t) * (tr + 2.6)); g.stroke(); } }
    ball(g, 0, 0, tr, dead ? '#555555' : sp.tho);
    ball(g, 0, hy, hr, dead ? '#777777' : sp.head);
    g.fillStyle = '#16120e'; g.beginPath(); g.ellipse(-hr * 0.55, hy - 1, hr * 0.34, hr * 0.48, 0.3, 0, 7); g.ellipse(hr * 0.55, hy - 1, hr * 0.34, hr * 0.48, -0.3, 0, 7); g.fill();
    g.restore();
  }
  H.drawBee = function (cv, sp, unknown) {
    cv.width = 240; cv.height = 180;
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    if (unknown) { g.globalAlpha = 0.25; g.filter = 'brightness(0)'; }
    // 머리 끝(더듬이)부터 배 끝(늘어진 다리)까지 재서 칸 가운데에 오게
    const sh = sp.sh || [1, 1, 1, 1], tail = 7.5 * sh[2] * 0.75 + 30 * sh[1] - 2 + (sp.dangle ? 7 : 0), front = 7.5 * sh[2] * 0.7 + 6.5 * sh[3] * 1.75 + 7;
    const sc = Math.min(3.1 * Math.min(1.16, 0.86 + sp.size * 0.1), 222 / (tail + front));
    bee(g, cv.width / 2 + sc * (tail - front) / 2, cv.height / 2, sc, sp, Math.PI / 2);
    g.globalAlpha = 1; g.filter = 'none';
  };
  function ground(g, W, Hh) { g.fillStyle = '#f3e2bc'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#9cc66a'; g.fillRect(0, Hh * 0.78, W, Hh); }
  function man(g, x, y, s, armA) {
    g.save(); g.translate(x, y); g.scale(s, s);
    ball(g, -6, 30, 8, '#2f5a3a'); ball(g, 8, 30, 8, '#2f5a3a');
    ball(g, 0, 8, 17, '#f4efe2');
    g.save(); g.rotate(armA || 0); ball(g, 12, -2, 6, '#ffd12a'); g.fillStyle = '#ffcf1f'; g.fillRect(14, -6, 20, 8); g.fillStyle = '#fff'; g.fillRect(33, -5, 5, 6); g.restore();
    ball(g, 0, -16, 15, '#f4efe2'); ball(g, 4, -16, 10, '#1d2433');
    g.fillStyle = '#fff'; g.beginPath(); g.arc(1, -17, 2.5, 0, 7); g.arc(8, -17, 2.5, 0, 7); g.fill();
    g.strokeStyle = '#ff8a1e'; g.lineWidth = 3; g.beginPath(); g.moveTo(-15, 12); g.lineTo(15, 12); g.stroke();
    g.restore();
  }
  function mist(g, x, y, t, len) { for (let i = 0; i < 14; i++) { const k = ((t * 1.8 + i / 14) % 1); g.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - k)) + ')'; g.beginPath(); g.arc(x + k * len, y - k * len * 0.35 + Math.sin(i * 3) * k * 8, 3 + k * 10, 0, 7); g.fill(); } }
  function nestBall(g, x, y, s) {
    const cols = ['#b59a72', '#8f7352', '#c9b08a', '#6e5a44'];
    g.save(); g.beginPath(); g.ellipse(x, y, 22 * s, 27 * s, 0, 0, 7); g.clip();
    for (let i = 0; i < 12; i++) { g.fillStyle = cols[i % 4]; g.fillRect(x - 30 * s, y - 27 * s + i * 4.6 * s, 60 * s, 5 * s); }
    g.restore(); g.fillStyle = '#120a05'; g.beginPath(); g.arc(x, y + 22 * s, 4 * s, 0, 7); g.fill();
  }
  const SPW = { col: '#ffcf2a', tho: '#4a3218', head: '#f2b420' };
  function f1(g, W, Hh, t) {
    ground(g, W, Hh); man(g, 60, 160, 1.2, -0.35);
    mist(g, 108, 128, t, 110);
    const k = (t * 0.6) % 1;
    if (k < 0.5) bee(g, 190 - k * 10, 70 + Math.sin(t * 12) * 3, 1.1, SPW, 0.3);
    else { const f = (k - 0.5) * 2; bee(g, 185, 70 + f * f * 110, 1.1, SPW, f * 9, f > 0.9); }
  }
  function f2(g, W, Hh, t) {
    ground(g, W, Hh);
    g.fillStyle = '#5d6577'; g.fillRect(0, 20, W, 18);
    const k = (t * 0.45) % 1;
    const up = Math.min(1, Math.max(0, (k - 0.35) / 0.35));
    if (up < 1) nestBall(g, 160, 66, 1);
    // 기세 막대
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(120, 104, 80, 8); g.fillStyle = k < 0.35 ? '#ff6a3a' : '#5cd65c'; g.fillRect(120, 104, 80 * (k < 0.35 ? 1 - k * 2 : 0.28), 8);
    man(g, 70, 170, 1.1, -0.8);
    if (k >= 0.35) { const ty = 150 - 70 * up; g.strokeStyle = '#a8743a'; g.lineWidth = 4; g.beginPath(); g.moveTo(108, 160); g.lineTo(160, ty + 26); g.stroke(); g.fillStyle = 'rgba(233,243,239,.6)'; g.beginPath(); g.moveTo(160, ty + 26); g.lineTo(130, ty - 34); g.lineTo(190, ty - 34); g.closePath(); g.fill(); g.strokeStyle = '#d8d8d8'; g.lineWidth = 3; g.beginPath(); g.ellipse(160, ty - 34, 30, 7, 0, 0, 7); g.stroke(); }
    if (k > 0.75) { g.fillStyle = '#dfe8e2'; g.beginPath(); g.ellipse(200, 186, 18, 15, 0, 0, 7); g.fill(); g.fillStyle = '#ff7a1c'; g.beginPath(); g.arc(200, 172, 4, 0, 7); g.fill(); }
  }
  function f3(g, W, Hh, t) {
    ground(g, W, Hh);
    g.fillStyle = '#5d6577'; g.fillRect(0, 18, 120, 16); g.fillStyle = '#120a05'; g.beginPath(); g.arc(90, 42, 6, 0, 7); g.fill();
    // 꽃
    g.fillStyle = '#ff8aa8'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(205 + Math.cos(i * 1.25) * 7, 170 + Math.sin(i * 1.25) * 7, 5, 0, 7); g.fill(); }
    for (let i = 0; i < 3; i++) { const k = ((t * 0.35 + i / 3) % 1); const x = 90 + (205 - 90) * k, y = 44 + (165 - 44) * k - Math.sin(k * Math.PI) * 30; bee(g, x, y, 0.7, SPW, Math.atan2(121, 115) + Math.PI / 2 * 0); }
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.setLineDash([4, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(205, 165); g.quadraticCurveTo(150, 70, 92, 46); g.stroke(); g.setLineDash([]);
    man(g, 160, 175, 0.9, -0.6);
  }
  H.start = function () {
    cancelAnimationFrame(raf);
    const cs = [document.getElementById('hw1'), document.getElementById('hw2'), document.getElementById('hw3')], fs = [f1, f2, f3];
    const t0 = performance.now();
    const step = () => {
      if (document.getElementById('how').hidden) return;
      const t = (performance.now() - t0) / 1000;
      cs.forEach((c, i) => { const g = c.getContext('2d'); g.save(); fs[i](g, c.width, c.height, t); g.restore(); });
      raf = requestAnimationFrame(step);
    };
    step();
  };
})();
