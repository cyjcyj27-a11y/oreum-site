// HOW TO PLAY: 실제 조리대 모양을 위에서 본 움직이는 그림 세 칸
(function () {
  const H = (window.HOW = {});
  let raf = 0, t0 = 0;
  const PI = Math.PI;
  function finger(g, x, y, press) {
    g.save(); g.translate(x, y); g.rotate(-0.35);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(6, 30, 16, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#f6d2b0'; g.strokeStyle = '#7a4a2a'; g.lineWidth = 3;
    g.beginPath(); g.roundRect ? g.roundRect(-11, -4 + (press ? 3 : 0), 22, 60, 11) : g.rect(-11, -4, 22, 60); g.fill(); g.stroke();
    g.fillStyle = '#fff1e4'; g.beginPath(); g.ellipse(0, 6 + (press ? 3 : 0), 7, 5, 0, 0, 7); g.fill();
    g.restore();
    if (press) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 18, 0, 7); g.stroke(); }
  }
  function steel(g, w, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9aa0a6'); gr.addColorStop(1, '#6e747a'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.08)'; for (let y = 4; y < h; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
  function iron(g, x, y, w, h) { g.fillStyle = '#1c1916'; g.fillRect(x, y, w, h); g.strokeStyle = '#3a3330'; g.lineWidth = 6; g.strokeRect(x, y, w, h); g.fillStyle = 'rgba(255,210,120,.08)'; g.fillRect(x + 8, y + 8, w - 16, h * 0.3); }
  function panCells(g, x, y, cw, ch, cols) { g.fillStyle = '#c9ced3'; g.fillRect(x - 4, y - 4, cw * cols.length + 8, ch + 8); cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(x + i * cw + 2, y + 2, cw - 4, ch - 4); }); g.strokeStyle = '#eef1f3'; g.lineWidth = 3; g.strokeRect(x - 4, y - 4, cw * cols.length + 8, ch + 8); }
  function tub(g, x, y, r, col) { g.fillStyle = '#c9ced3'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#eef1f3'; g.lineWidth = 4; g.stroke(); g.fillStyle = col; g.beginPath(); g.arc(x, y, r - 6, 0, 7); g.fill(); }
  function cake(g, x, y, r, c, sq) { // 위에서 본 호떡
    const col = HOT.cookCol(c), rgb = (k) => 'rgb(' + col.map((v) => Math.round(v * 255 * k)).join(',') + ')';
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x + 3, y + 4, r, r * (sq || 1), 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r); gr.addColorStop(0, rgb(1.1)); gr.addColorStop(1, rgb(0.82));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * (sq || 1), 0, 0, 7); g.fill();
    g.strokeStyle = rgb(0.6); g.lineWidth = 2; g.stroke();
  }
  function ring(g, x, y, f, col) { g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(x, y, 14, 0, 7); g.stroke(); g.strokeStyle = col; g.beginPath(); g.arc(x, y, 14, -PI / 2, -PI / 2 + f * PI * 2); g.stroke(); }

  // 1. 반죽 떼기 → 설탕 두 숟갈 → 동글동글 문질러 오므리기
  function step1(g, t) {
    const w = 440, h = 300; steel(g, w, h);
    panCells(g, 14, 196, 40, 92, ['#f2e4c4', '#b9cf86', '#6a4a5a']); panCells(g, 160, 196, 40, 92, ['#5a3216', '#4a1a1c', '#f3e3a6', '#8a6a3a']);
    g.fillStyle = '#e6e6e0'; g.fillRect(250, 50, 170, 130); g.strokeStyle = '#f6f6f2'; g.lineWidth = 4; g.strokeRect(250, 50, 170, 130);
    const T = t % 6;
    const bx = 335, by = 115;
    if (T < 1) { const k = T; finger(g, 34 + (bx - 34) * k, 240 + (by - 240) * k, true); if (k > 0.2) cake(g, 34 + (bx - 34) * k, 240 + (by - 240) * k, 30, 0); }
    else {
      const close = T < 3.2 ? 0 : Math.min(1, (T - 3.2) / 2);
      const r = 46 - close * 18;
      cake(g, bx, by, r, 0);
      const sp = T < 2 ? 1 : T < 3.2 ? 2 : 2;
      if (close < 0.8) { g.fillStyle = '#5a3216'; g.beginPath(); g.arc(bx, by, (8 + sp * 6) * (1 - close), 0, 7); g.fill(); g.fillStyle = 'rgba(160,100,50,.8)'; for (let i = 0; i < 14 * sp; i++) g.fillRect(bx - 12 + ((i * 37) % 24), by - 10 + ((i * 53) % 20), 2, 2); }
      if (close > 0) { g.strokeStyle = 'rgba(160,120,70,.6)'; g.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; g.beginPath(); g.moveTo(bx + Math.cos(a) * r * 0.2, by + Math.sin(a) * r * 0.2); g.lineTo(bx + Math.cos(a) * r * 0.8, by + Math.sin(a) * r * 0.8); g.stroke(); } }
      if (T < 3.2) { const k = (T - 1) % 1.1; finger(g, 180, 240, k < 0.3); if (k > 0.3 && k < 0.9) { g.fillStyle = '#8a8f94'; g.beginPath(); g.ellipse(180 + (bx - 180) * (k - 0.3) / 0.6, 240 + (by - 240) * (k - 0.3) / 0.6, 14, 9, 0, 0, 7); g.fill(); } }
      else { const a = T * 7; finger(g, bx + Math.cos(a) * 34, by + Math.sin(a) * 34, true); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.arc(bx, by, 34, 0, 7); g.stroke(); g.setLineDash([]); }
    }
  }
  // 2. 철판에 올려 고리가 초록이면 톡 뒤집고, 꾹 눌러 납작하게
  // 2. 철판에 올려 고리가 초록이면 톡 뒤집기
  function step2(g, t) {
    const w = 440, h = 300; steel(g, w, h); iron(g, 40, 40, 360, 220);
    const T = t % 4.4, x = 200, y = 150, flipped = T > 3.0;
    const cc = flipped ? 0.1 : Math.min(1.0, T / 2.4) * 0.92;
    const lift = T > 2.6 && T < 3.0 ? Math.sin((T - 2.6) / 0.4 * PI) * 26 : 0, sq = T > 2.6 && T < 3.0 ? Math.abs(Math.cos((T - 2.6) / 0.4 * PI)) : 1;
    cake(g, x, y - lift, 34, flipped ? 0.92 : 0.15 + cc * 0.15, sq);
    for (let i = 0; i < 10; i++) { const a = i * 0.63 + t * 3, rr = 40 + (i % 3) * 4; g.fillStyle = 'rgba(255,240,200,.6)'; g.beginPath(); g.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.9, 2.2, 0, 7); g.fill(); }
    if (!flipped) ring(g, x, y - 62, Math.min(1, cc / 1.32), cc >= 0.75 ? '#4fc24a' : cc > 0.55 ? '#f2c33a' : '#f6efe0');
    if (T > 2.3 && T < 2.9) finger(g, x, y, T > 2.45);
  }
  // 3. 누르개를 집어 호떡 위로 끌고 와 꾹(초록에서 떼기). 너무 오래 누르면 속이 터져 흐름. 고리는 호떡 위에
  function stepPress(g, t) {
    const w = 440, h = 300; steel(g, w, h); iron(g, 40, 40, 300, 220);
    const T = t % 9, x = 170, y = 175, hx = 392, hy = 120, over = T > 4.5;
    const u = over ? T - 4.5 : T; // 앞: 알맞게 누르고 떼기, 뒤: 너무 오래 눌러 터짐
    const mv = Math.max(0, Math.min(1, (u - 0.5) / 0.6)), e = mv * mv * (3 - 2 * mv); // 0.5~1.1초: 누르개를 집어 옮김
    const pressing = over ? u > 1.2 : u > 1.2 && u < 3.3;
    const k = Math.max(0, Math.min(over ? 1.25 : 0.82, (u - 1.25) / 1.8));
    const r = 34 + 22 * Math.min(1, k) + (k > 1 ? (k - 1) * 30 : 0);
    if (over && k > 1.06) { g.fillStyle = 'rgba(40,16,4,.9)'; const pr = 20 + (k - 1.06) * 400; for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; g.beginPath(); g.ellipse(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4) * 0.9, Math.min(26, pr * 0.3), Math.min(16, pr * 0.2), a, 0, 7); g.fill(); } }
    cake(g, x, y, r, 0.92);
    // 누르개: 제자리 → 손가락 따라 호떡 위 → 다 누르면 제자리로
    const back = !over && u >= 3.3 ? Math.min(1, (u - 3.3) / 0.5) : 0;
    const px = hx + (x - hx) * e + (hx - x) * back, py = hy + (y - hy) * e + (hy - y) * back, pr2 = 52 + Math.max(0, r - 56) * 0.4;
    g.fillStyle = 'rgba(220,226,232,' + (pressing ? 0.5 : 0.85) + ')'; g.beginPath(); g.arc(px, py, pr2, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#7a4a24'; g.beginPath(); g.roundRect ? g.roundRect(px - 30, py - 8, 60, 16, 8) : g.rect(px - 30, py - 8, 60, 16); g.fill();
    if (pressing) {
      const f = k / 1.06, col = k > 1.02 ? '#e2412a' : k >= 0.66 ? '#4fc24a' : '#4aa8e8';
      ring(g, x, y - r - 46, Math.min(1, f), col);
    }
    if (u > 0.3 && (over || u < 3.3)) finger(g, px + 4, py - 4, u > 0.5);
    if (over && k > 1.06) { g.fillStyle = '#ff6a5a'; g.font = '900 34px sans-serif'; g.textAlign = 'center'; g.fillText('X', x + 110, y - 90); }
  }
  // 4. 쟁반에서 쓱 갈라 씨앗을 넣고, 손님에게 끌어다 주기
  function step3(g, t) {
    const w = 440, h = 300; g.fillStyle = '#1d1a2a'; g.fillRect(0, 0, w, 120);
    for (let i = 0; i < 18; i++) { g.fillStyle = ['rgba(255,190,110,.35)', 'rgba(120,200,255,.3)', 'rgba(255,110,90,.3)'][i % 3]; g.beginPath(); g.arc((i * 71) % w, 20 + (i * 37) % 80, 12, 0, 7); g.fill(); }
    // 손님(어깨·머리 실루엣)
    g.fillStyle = '#3b4a6a'; g.beginPath(); g.ellipse(300, 132, 64, 40, 0, PI, 0); g.fill(); g.fillStyle = '#e8c4a2'; g.beginPath(); g.arc(300, 62, 26, 0, 7); g.fill(); g.fillStyle = '#2a1d16'; g.beginPath(); g.arc(300, 54, 27, PI, 0); g.fill();
    // 말풍선
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect ? g.roundRect(352, 14, 76, 60, 12) : g.rect(352, 14, 76, 60); g.fill(); UI.drawIcon(g, { kind: 'seed' }, 390, 42, 0.62);
    g.save(); g.translate(0, 120); steel(g, w, 180); g.restore();
    tub(g, 360, 240, 46, '#7a6a48'); for (let i = 0; i < 40; i++) { g.fillStyle = ['#d8cba5', '#5f7e38', '#c99358'][i % 3]; g.fillRect(330 + ((i * 29) % 60), 214 + ((i * 41) % 52), 5, 3); }
    g.fillStyle = '#efe6cf'; g.fillRect(70, 160, 180, 120);
    const T = t % 6.5;
    let x = 160, y = 220;
    const cut = T > 1.4, seeds = T > 2.8 ? Math.min(1, (T - 2.8) / 0.6) : 0;
    if (T > 4.2) { const k = Math.min(1, (T - 4.2) / 1.2); x = 160 + (300 - 160) * k; y = 220 + (150 - 220) * k; }
    if (T < 5.4) {
      cake(g, x, y, 46, 0.92);
      if (cut) { g.fillStyle = '#3a1806'; g.beginPath(); g.ellipse(x, y, 32 * Math.min(1, (T - 1.4) / 0.4), 6 + seeds * 4, 0, 0, 7); g.fill(); }
      if (seeds) for (let i = 0; i < 34 * seeds; i++) { const u = ((i * 0.618) % 1 - 0.5) * 1.8; g.fillStyle = ['#d8cba5', '#5f7e38', '#c99358'][i % 3]; g.save(); g.translate(x + u * 28, y + 2 - (1 - u * u) * 18 * ((i % 4) * 0.25 + 0.3)); g.rotate(i); g.beginPath(); g.ellipse(0, 0, 7, 3.4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,20,.45)'; g.lineWidth = 1; g.stroke(); g.restore(); }
    } else { g.fillStyle = '#fbf8f0'; g.beginPath(); g.moveTo(278, 150); g.lineTo(322, 150); g.lineTo(316, 196); g.lineTo(284, 196); g.closePath(); g.fill(); g.fillStyle = '#c8261e'; g.fillRect(284, 156, 8, 36); g.fillRect(304, 156, 8, 36); }
    if (T < 1.4) { const k = Math.min(1, T / 1.2); finger(g, 110 + 100 * k, 222, true); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(110, 222); g.lineTo(210, 222); g.stroke(); g.setLineDash([]); }
    else if (T > 2.2 && T < 3.2) finger(g, 360, 240, T < 2.5);
    else if (T > 4.0 && T < 5.4) finger(g, x + 4, y + 4, true);
    if (T > 5.4) { g.fillStyle = '#ff6a8a'; const k = (T - 5.4); g.save(); g.translate(350, 70 - k * 20); g.scale(1.2, 1.2); g.beginPath(); g.moveTo(0, 6); g.bezierCurveTo(-14, -6, -6, -16, 0, -8); g.bezierCurveTo(6, -16, 14, -6, 0, 6); g.fill(); g.restore(); }
  }
  const steps = [step1, step2, stepPress, step3];
  H.start = function () {
    t0 = performance.now(); cancelAnimationFrame(raf);
    const cvs = [1, 2, 3, 4].map((i) => document.getElementById('h' + i));
    const f = () => { const t = (performance.now() - t0) / 1000; cvs.forEach((c, i) => { const g = c.getContext('2d'); g.save(); g.clearRect(0, 0, 440, 300); steps[i](g, t); g.restore(); }); raf = requestAnimationFrame(f); };
    f();
  };
  H.stop = function () { cancelAnimationFrame(raf); };
  H.draw = function (t) { [1, 2, 3, 4].forEach((i, k) => { const g = document.getElementById('h' + i).getContext('2d'); g.clearRect(0, 0, 440, 300); steps[k](g, t); }); };
})();
