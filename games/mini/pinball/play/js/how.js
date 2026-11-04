// HOW TO PLAY 칸 그림 — 게임 색으로 동작을 되풀이
(function () {
  let raf = 0, t0 = 0, run = false;
  const cvs = () => [...document.querySelectorAll('#how canvas')];
  function bg(g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1c0c44'); gr.addColorStop(1, '#0a0820');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  function flipper(g, x, y, a, mir) {
    g.save(); g.translate(x, y); g.scale(mir ? -1 : 1, 1); g.rotate(-a);
    g.fillStyle = '#ff2a3a'; g.beginPath(); g.arc(0, 0, 13, Math.PI / 2, Math.PI * 1.5); g.lineTo(62, -7); g.arc(62, 0, 7, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill();
    g.fillStyle = '#f6f2ff'; g.beginPath(); g.arc(0, 0, 10, Math.PI / 2, Math.PI * 1.5); g.lineTo(62, -4.5); g.arc(62, 0, 4.5, -Math.PI / 2, Math.PI / 2); g.closePath(); g.fill();
    g.fillStyle = '#c8ccd8'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.restore();
  }
  function ball(g, x, y) {
    const gr = g.createRadialGradient(x - 3, y - 4, 1, x, y, 10); gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#b8bcc8'); gr.addColorStop(1, '#3a3a4a');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
  }
  function finger(g, x, y, press) {
    g.save(); g.translate(x, y + (press ? 4 : 0)); g.scale(0.75, 0.75); g.globalAlpha = 0.9;
    g.fillStyle = '#ffd8b8'; g.strokeStyle = '#3a1a10'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(0, 0, 11, 15, 0, 0, 7); g.fill(); g.stroke();
    g.fillRect(-11, 0, 22, 34); g.strokeRect(-11, 0, 22, 34);
    if (press) { g.strokeStyle = '#ffe14a'; g.lineWidth = 3; g.beginPath(); g.arc(0, -4, 22, 0, 7); g.stroke(); }
    g.restore();
  }
  function scene1(g, w, h, t) {
    bg(g, w, h);
    const ph = t % 2.4, L = ph > 0.3 && ph < 0.6, R = ph > 1.5 && ph < 1.8;
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.setLineDash([5, 6]); g.beginPath(); g.moveTo(w / 2, 6); g.lineTo(w / 2, h - 6); g.stroke(); g.setLineDash([]);
    flipper(g, w * 0.22, h * 0.68, L ? 0.5 : -0.5, false); flipper(g, w * 0.78, h * 0.68, R ? 0.5 : -0.5, true);
    // 공: 왼쪽 플리퍼에서 튀어 오른쪽으로, 다시 내려옴
    let bx, by; const u = ph / 2.4;
    if (ph < 0.4) { bx = w * 0.4; by = h * (0.2 + ph * 1.2); }
    else if (ph < 1.2) { const k = (ph - 0.4) / 0.8; bx = w * (0.4 + 0.2 * k); by = h * (0.6 - Math.sin(k * Math.PI) * 0.5); }
    else if (ph < 1.6) { const k = (ph - 1.2) / 0.4; bx = w * 0.6; by = h * (0.6 + 0 * k); }
    else { const k = (ph - 1.6) / 0.8; bx = w * (0.6 - 0.2 * k); by = h * (0.6 - Math.sin(k * Math.PI) * 0.45); }
    ball(g, bx, by);
    finger(g, w * 0.2, h * 0.86, L); finger(g, w * 0.8, h * 0.86, R);
  }
  function scene2(g, w, h, t) {
    bg(g, w, h);
    const ph = t % 2.6, x = w * 0.7;
    g.fillStyle = '#2a2a3a'; g.fillRect(x - 16, 10, 32, h - 20);
    g.strokeStyle = '#c8ccd8'; g.lineWidth = 3; g.strokeRect(x - 16, 10, 32, h - 20);
    let pull = ph < 1.2 ? ph / 1.2 : ph < 1.3 ? 1 - (ph - 1.2) / 0.1 : 0;
    const py = h - 46 + pull * 26;
    // 스프링
    g.strokeStyle = '#d8dde8'; g.lineWidth = 2.5; g.beginPath(); for (let i = 0; i <= 8; i++) { const yy = py + 10 + i * (h - 14 - py - 10) / 8; g.lineTo(x + (i % 2 ? 8 : -8), yy); } g.stroke();
    g.fillStyle = '#ff2a3a'; g.fillRect(x - 12, py, 24, 9);
    let by = py - 10; if (ph >= 1.3) { by = py - 10 - (ph - 1.3) * 260; }
    if (by > -12) ball(g, x, by);
    finger(g, w * 0.3, h * 0.6, ph < 1.25);
    // 힘 막대
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(w * 0.12, h * 0.2, 14, h * 0.5);
    g.fillStyle = '#ff9a1a'; g.fillRect(w * 0.12, h * 0.2 + h * 0.5 * (1 - pull), 14, h * 0.5 * pull);
  }
  function scene3(g, w, h, t) {
    bg(g, w, h);
    const lit = Math.floor(t * 2.2) % 12;
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * (0.95 - i * 0.1), x = w / 2 + Math.cos(a) * w * 0.38, y = h * 0.8 - Math.sin(a) * h * 0.62;
      g.fillStyle = i < lit ? (i === 9 ? '#ff3a2a' : '#8dff3a') : 'rgba(255,255,255,.12)';
      if (i < lit) { g.shadowColor = g.fillStyle; g.shadowBlur = 12; }
      g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.shadowBlur = 0;
    }
    // 황금 표적(작게)
    const s = lit >= 10 ? 1 + Math.sin(t * 30) * 0.06 : 1;
    g.save(); g.translate(w / 2, h * 0.62); g.scale(s, s);
    [[24, '#8a5a10'], [22, '#ffc23a'], [16, '#d8302a'], [11, '#fff4d8'], [6, '#d8302a']].forEach(([r, c]) => { g.fillStyle = c; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-8, -10, 8, 4, -0.5, 0, 7); g.fill();
    g.restore();
    if (lit >= 10) { g.font = "400 18px Ttl, sans-serif"; g.fillStyle = '#ffe14a'; g.textAlign = 'center'; g.fillText('CLEAR', w / 2, h * 0.24); }
  }
  const scenes = [scene1, scene2, scene3];
  function frame(now) {
    if (!run) return; const t = (now - t0) / 1000;
    cvs().forEach((c, i) => {
      const r = c.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1);
      const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      const g = c.getContext('2d'); const k = r.width / 200; g.setTransform(dpr * k, 0, 0, dpr * k, 0, 0); scenes[i](g, 200, r.height / k, t);
    });
    raf = requestAnimationFrame(frame);
  }
  window.HOW = { start() { run = true; t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }, stop() { run = false; cancelAnimationFrame(raf); }, draw(t) { run = true; t0 = performance.now() - t * 1000; frame(performance.now()); run = false; } };
})();
