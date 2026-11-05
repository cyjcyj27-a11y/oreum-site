// HOW TO PLAY 움직이는 그림 세 칸
(function () {
  const W = (window.HOW = {});
  let run = false, t0 = 0;
  const skin = (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e2ab88'); gr.addColorStop(0.5, '#efc0a0'); gr.addColorStop(1, '#d69c7a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
  // 머신(옆에서 본 작은 그림): 끝이 (x, y)
  function machine(g, x, y, on, t) {
    g.save(); g.translate(x + (on ? Math.sin(t * 90) * 1 : 0), y); g.rotate(0.6);
    g.fillStyle = '#d4d8dc'; g.strokeStyle = '#18171b'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-5, -20); g.lineTo(5, -20); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#1a1a1c'; g.fillRect(-9, -64, 18, 44); g.strokeRect(-9, -64, 18, 44);
    g.fillStyle = '#b8642c'; g.fillRect(8, -96, 16, 30); g.strokeRect(8, -96, 16, 30);
    g.fillStyle = '#7a1c1c'; g.fillRect(-12, -104, 10, 44); g.strokeRect(-12, -104, 10, 44);
    g.restore();
  }
  const curve = (t) => [60 + t * 320, 160 + Math.sin(t * Math.PI * 2) * 60];
  function panel1(g, w, h, T) {
    skin(g, w, h);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#4b2a9a'; g.lineWidth = 5; g.beginPath(); for (let i = 0; i <= 60; i++) { const p = curve(i / 60); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
    const k = Math.min(1, (T % 4.2) / 3.2);
    // 앞 60% 는 천천히 진한 선, 뒤 40% 는 빨라서 끊긴 선
    g.strokeStyle = '#18171b'; g.lineWidth = 8; g.beginPath(); for (let i = 0; i <= 60 * Math.min(k, 0.6); i++) { const p = curve(i / 60); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
    if (k > 0.6) { g.fillStyle = 'rgba(24,23,27,.5)'; for (let i = 36; i <= 60 * k; i += 2) { const p = curve(i / 60); g.beginPath(); g.arc(p[0], p[1], 3, 0, 7); g.fill(); } }
    const p = curve(k); machine(g, p[0], p[1], k < 1, T);
    if (k > 0.62) { g.font = '900 34px Ttl, serif'; g.textAlign = 'center'; g.lineWidth = 7; g.strokeStyle = '#18171b'; g.strokeText('X', p[0], 60); g.fillStyle = '#ff6a5a'; g.fillText('X', p[0], 60); }
  }
  function panel2(g, w, h, T) {
    const ph = T % 3.6; const omen = ph > 0.8 && ph < 1.9, jerk = ph >= 1.9 && ph < 2.3;
    g.fillStyle = '#3a2a24'; g.fillRect(0, 0, w, h);
    const dx = omen ? Math.sin(T * 80) * 4 : jerk ? 40 * Math.sin(((ph - 1.9) / 0.4) * Math.PI) : 0;
    g.save(); g.translate(dx, 0);
    const gr = g.createLinearGradient(0, 70, 0, 230); gr.addColorStop(0, '#e2ab88'); gr.addColorStop(0.5, '#efc0a0'); gr.addColorStop(1, '#c98a6c'); g.fillStyle = gr;
    g.beginPath(); g.moveTo(-10, 80); g.lineTo(w + 10, 100); g.lineTo(w + 10, 220); g.lineTo(-10, 230); g.closePath(); g.fill(); g.strokeStyle = '#18171b'; g.lineWidth = 4; g.stroke();
    if (omen) { g.strokeStyle = '#18171b'; g.lineWidth = 3; for (const y of [64, 246]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(140 + k * 60, y - 8); g.lineTo(150 + k * 60, y); g.lineTo(140 + k * 60, y + 8); g.stroke(); } }
    g.restore();
    // 떨리면 바늘을 들어 올림
    const lift = ph > 0.9 && ph < 2.6 ? 50 : 0; machine(g, 230, 150 - lift, lift === 0, T);
  }
  function panel3(g, w, h, T) {
    g.fillStyle = '#3a2a24'; g.fillRect(0, 0, w, h);
    const ph = T % 4, inh = ph % 2 < 0.9;
    // 귀(옆모습 단순)
    g.save(); g.translate(170, 150 + (inh ? -4 : 0));
    g.fillStyle = '#e8b596'; g.strokeStyle = '#18171b'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(-20, -80); g.bezierCurveTo(60, -120, 110, -40, 80, 30); g.bezierCurveTo(70, 70, 50, 110, 10, 110); g.bezierCurveTo(-30, 110, -30, 60, -25, 20); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(0, -60); g.bezierCurveTo(50, -80, 70, -20, 40, 30); g.stroke();
    g.fillStyle = '#c8312b'; g.beginPath(); g.arc(10, 85, 7, 0, 7); g.fill();
    g.restore();
    // 날숨 때 쏙
    const push = ph > 2.1 && ph < 2.9 ? (ph - 2.1) / 0.8 : ph >= 2.9 ? 1 : 0;
    g.save(); g.translate(180 + 120 - push * 40, 235 + (inh ? -4 : 0)); g.rotate(-0.2);
    g.fillStyle = '#e6eaee'; g.strokeStyle = '#18171b'; g.lineWidth = 3; g.fillRect(0, -4, 120, 8); g.strokeRect(0, -4, 120, 8); g.fillStyle = '#3a7ad8'; g.fillRect(110, -9, 20, 18); g.strokeRect(110, -9, 20, 18);
    g.restore();
    g.font = '30px Ttl, serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#18171b'; const tx = inh ? L('들숨', 'IN') : L('날숨', 'OUT');
    g.strokeText(tx, 360, 50); g.fillStyle = inh ? '#ff8a7a' : '#8ff0a0'; g.fillText(tx, 360, 50);
  }
  function frame() {
    if (!run) return;
    const T = (performance.now() - t0) / 1000;
    [['h1', panel1], ['h2', panel2], ['h3', panel3]].forEach(([id, f]) => { const c = document.getElementById(id); const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); f(g, c.width, c.height, T); });
    requestAnimationFrame(frame);
  }
  W.start = function () { if (run) return; run = true; t0 = performance.now(); requestAnimationFrame(frame); };
  W.stop = function () { run = false; };
})();
