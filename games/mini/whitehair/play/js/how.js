// HOW TO PLAY 움직이는 그림 세 칸(두피 단면을 옆에서 본 그림)
(function () {
  const W = (window.HOW = {});
  let run = false, t0 = 0;
  const skin = (g, w, h, lift, lx) => {
    const gr = g.createLinearGradient(0, h * 0.6, 0, h); gr.addColorStop(0, '#f0c4a8'); gr.addColorStop(1, '#c98a6c');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 6) { const d = (x - lx) / 26; g.lineTo(x, h * 0.66 - lift * Math.exp(-d * d)); }
    g.lineTo(w, h); g.fill();
    g.strokeStyle = 'rgba(120,60,40,.5)'; g.lineWidth = 3; g.beginPath();
    for (let x = 0; x <= w; x += 6) { const d = (x - lx) / 26; const y = h * 0.66 - lift * Math.exp(-d * d); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  };
  const sy = (h, x, lift, lx) => { const d = (x - lx) / 26; return h * 0.66 - lift * Math.exp(-d * d); };
  function hair(g, x, y, ang, len, col, w, curve) {
    g.lineCap = 'round';
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    const path = () => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + (curve || 0), y + Math.sin(ang) * len * 0.5 - (curve || 0) * 0.3, ex, ey); };
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = w + 2.5; path(); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; path(); g.stroke();
  }
  function tweez(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    for (const s of [-1, 1]) { g.fillStyle = '#c9d0d6'; g.strokeStyle = '#4a5058'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, s * 2); g.lineTo(150, s * 14); g.lineTo(150, s * 6); g.lineTo(0, 0); g.closePath(); g.fill(); g.stroke(); }
    g.restore();
  }
  const blacks = (g, w, h, lift, lx, skipX) => { for (let x = 14; x < w; x += 22) { if (Math.abs(x - skipX) < 12) continue; hair(g, x, sy(h, x, lift, lx), -Math.PI / 2 - 0.9, 120, '#1b1714', 3.2, 20); } };
  // 끝을 잡고 당기면 중간에서 끊어짐(두 번째 3.2초)
  function panel1tip(g, w, h, T) {
    const lx = 200;
    let lift = 0, k = 0, cut = false, fly = 0;
    if (T < 0.6) k = 0; else if (T < 1.4) { k = (T - 0.6) / 0.8; lift = k * 16; } else { cut = true; fly = Math.min(1, (T - 1.4) / 0.7); }
    g.fillStyle = '#5b4334'; g.fillRect(0, 0, w, h);
    skin(g, w, h, cut ? 0 : lift, lx);
    blacks(g, w, h, lift, lx, lx);
    const ry = sy(h, lx, cut ? 0 : lift, lx);
    g.lineCap = 'round'; g.strokeStyle = '#f2f0ea'; g.lineWidth = 4.5;
    if (!cut) {
      const gx = lx + 150, gy = ry - 110 - k * 40;
      g.beginPath(); g.moveTo(lx, ry); g.quadraticCurveTo(lx + 40, ry - 70, gx, gy); g.stroke();
      if (T > 0.3) tweez(g, gx, gy, -0.5);
    } else {
      g.beginPath(); g.moveTo(lx, ry); g.quadraticCurveTo(lx + 20, ry - 40, lx + 50, ry - 60); g.stroke();
      const x = lx + 150 + fly * 60, y = ry - 150 - fly * 40;
      g.save(); g.translate(x, y); g.rotate(fly * 1.2); g.beginPath(); g.moveTo(0, 0); g.lineTo(-80, 40); g.stroke(); g.restore();
      tweez(g, x, y, -0.5);
      if (fly < 0.7) { g.font = '900 40px Ttl,sans-serif'; g.textAlign = 'center'; g.lineWidth = 7; g.strokeStyle = '#1d2430'; g.strokeText('SNAP', w * 0.3, 60); g.fillStyle = '#c9d2da'; g.fillText('SNAP', w * 0.3, 60); }
    }
  }
  function panel1(g, w, h, t) {
    if (t % 6.4 >= 3.2) return panel1tip(g, w, h, t % 3.2);
    const T = t % 3.2, lx = 230;
    let lift = 0, py = 0, out = false, fly = 0;
    if (T < 0.6) py = 0; else if (T < 1.6) { const k = (T - 0.6) / 1.0; lift = k * 34; py = k * 50; } else { out = true; fly = Math.min(1, (T - 1.6) / 0.8); }
    g.fillStyle = '#5b4334'; g.fillRect(0, 0, w, h);
    skin(g, w, h, out ? 0 : lift, lx);
    blacks(g, w, h, lift, lx, lx);
    const ry = sy(h, lx, out ? 0 : lift, lx);
    if (!out) {
      const gx = lx + 50, gy = ry - 70 - py;
      g.lineCap = 'round'; g.strokeStyle = '#f2f0ea'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(lx, ry); g.lineTo(gx, gy); g.quadraticCurveTo(gx + 40, gy + 10, gx + 60, gy + 40); g.stroke();
      if (T > 0.3) tweez(g, gx, gy, -0.5);
    } else {
      const x = lx + 50 + fly * 120, y = ry - 120 - fly * 60;
      g.save(); g.translate(x, y); g.rotate(-0.9 + fly);
      g.strokeStyle = '#f2f0ea'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, 40); g.stroke();
      g.fillStyle = '#fff6ea'; g.beginPath(); g.ellipse(-90, 40, 7, 5, 0.4, 0, 7); g.fill();
      g.restore();
      tweez(g, x, y, -0.5 + fly * 0.3);
      if (fly < 0.6) { g.font = '900 40px Ttl,sans-serif'; g.textAlign = 'center'; g.lineWidth = 7; g.strokeStyle = '#1d2430'; g.strokeText('PERFECT', w * 0.33, 60); g.fillStyle = '#ffe27a'; g.fillText('PERFECT', w * 0.33, 60); }
    }
  }
  function panel2(g, w, h, t) {
    const T = t % 3.0, lx = 210;
    let lift = 0, out = false, k = 0;
    if (T < 1.0) { k = T; lift = k * 30; } else out = true;
    g.fillStyle = '#5b4334'; g.fillRect(0, 0, w, h);
    skin(g, w, h, out ? 0 : lift, lx);
    blacks(g, w, h, lift, lx, lx);
    const ry = sy(h, lx, out ? 0 : lift, lx);
    if (!out) { const gx = lx + 50, gy = ry - 70 - k * 46; g.lineCap = 'round'; g.strokeStyle = '#1b1714'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(lx, ry); g.lineTo(gx, gy); g.stroke(); tweez(g, gx, gy, -0.5); }
    // 인내심 막대
    const bw = 220, f = out ? Math.max(0.35, 0.8 - (T - 1.0) * 0.9) : 0.8;
    g.fillStyle = '#111'; g.fillRect(w / 2 - bw / 2 - 4, 20, bw + 8, 22);
    g.fillStyle = f < 0.5 ? '#d43a2a' : '#2fae4a'; g.fillRect(w / 2 - bw / 2, 24, bw * f, 14);
    if (out && T < 2.4) { const s = 1 + Math.sin((T - 1) * 20) * 0.08; g.save(); g.translate(w / 2, 100); g.scale(s, s); g.font = '900 54px Ttl,sans-serif'; g.textAlign = 'center'; g.lineWidth = 9; g.strokeStyle = '#fff'; g.strokeText(L('아야!', 'OUCH!'), 0, 0); g.fillStyle = '#ff5a4a'; g.fillText(L('아야!', 'OUCH!'), 0, 0); g.restore(); }
  }
  function panel3(g, w, h, t) {
    const T = t % 3.4, cx = -60 + Math.min(1, T / 1.8) * (w + 120);
    g.fillStyle = '#5b4334'; g.fillRect(0, 0, w, h);
    skin(g, w, h, 0, -999);
    // 빗기 전: 제멋대로 뻗음 → 빗은 뒤: 빗 방향(오른쪽)으로 가지런히 납작
    for (let x = 10, i = 0; x < w; x += 14, i++) {
      const done = cx > x + 30;
      const ang = done ? -0.28 : -Math.PI / 2 - 0.5 + Math.sin(i * 2.7) * 0.7;
      hair(g, x, sy(h, x, 0, -999), ang, done ? 120 : 105, '#1b1714', 3, done ? 2 : Math.cos(i * 1.9) * 22);
    }
    // 숨은 새싹: 참빗이 지나가 머리가 납작하게 눕으면 위로 드러남
    if (cx > 270) { for (const x of [205, 238]) hair(g, x, sy(h, x, 0, -999), -Math.PI / 2 + (x - 220) * 0.012, 46, '#f2f0ea', 5, 0); }
    // 참빗: 대나무 몸통 + 가운데 등대 + 양쪽 가는 빗살
    g.save(); g.translate(cx, h * 0.5);
    const bam = g.createLinearGradient(-12, 0, 12, 0); bam.addColorStop(0, '#e9d9ae'); bam.addColorStop(0.5, '#fbf4de'); bam.addColorStop(1, '#cdb98a');
    // 빗살: 사진 속 참빗처럼 청록·자주·주황·노랑 색 띠
    const band = ['#2f5d5c', '#7b2f3c', '#c25a2e', '#c99a35', '#c25a2e', '#7b2f3c', '#2f5d5c'];
    g.lineWidth = 2;
    for (let y = -70; y <= 70; y += 3) { g.strokeStyle = band[Math.min(6, Math.floor((y + 70) / 20.2))]; g.beginPath(); g.moveTo(-40, y); g.lineTo(-10, y); g.moveTo(10, y); g.lineTo(40, y); g.stroke(); }
    g.fillStyle = bam; g.strokeStyle = '#8a744a'; g.lineWidth = 2;
    g.fillRect(-12, -76, 24, 152); g.strokeRect(-12, -76, 24, 152);
    g.fillRect(-44, -84, 88, 12); g.strokeRect(-44, -84, 88, 12); g.fillRect(-44, 72, 88, 12); g.strokeRect(-44, 72, 88, 12);
    g.strokeStyle = 'rgba(138,74,28,.85)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(4, -30); g.bezierCurveTo(-6, -18, 6, -6, -2, 8); g.moveTo(-4, 20); g.lineTo(2, 26); g.stroke();
    g.restore();
    if (T > 1.9 && T < 3.0) { g.font = '900 34px Ttl,sans-serif'; g.textAlign = 'center'; g.lineWidth = 7; g.strokeStyle = '#1d2430'; g.strokeText('!', 222, 120); g.fillStyle = '#ffe27a'; g.fillText('!', 222, 120); }
  }
  function frame() {
    if (!run) return;
    const t = (performance.now() - t0) / 1000;
    [['h1', panel1], ['h2', panel2], ['h3', panel3]].forEach(([id, f]) => { const c = document.getElementById(id); f(c.getContext('2d'), c.width, c.height, t); });
    requestAnimationFrame(frame);
  }
  W.start = () => { if (run) return; run = true; t0 = performance.now(); requestAnimationFrame(frame); };
  W.stop = () => { run = false; };
  W.draw = (t) => { [['h1', panel1], ['h2', panel2], ['h3', panel3]].forEach(([id, f]) => { const c = document.getElementById(id); f(c.getContext('2d'), c.width, c.height, t); }); };
})();
