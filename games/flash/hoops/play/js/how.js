// HOW TO PLAY: 실제 화면 모양을 작게 그려 되풀이(손가락이 공을 위로 튕김 → 날아가 들어감)
(function () {
  const H = (window.HOW = {});
  let raf = 0, t0 = 0, after = null;
  function ball(g, x, y, r) {
    const rg = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    rg.addColorStop(0, '#ffb070'); rg.addColorStop(0.6, '#e2671f'); rg.addColorStop(1, '#8a3208');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = '#1b0f0a'; g.lineWidth = Math.max(1, r * 0.12);
    g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
    g.beginPath(); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke();
    g.beginPath(); g.arc(x - r * 1.25, y, r * 0.9, -0.75, 0.75); g.stroke();
    g.beginPath(); g.arc(x + r * 1.25, y, r * 0.9, Math.PI - 0.75, Math.PI + 0.75); g.stroke();
  }
  function hoop(g, x, y, s) {
    g.fillStyle = 'rgba(220,235,255,0.16)'; g.strokeStyle = '#fff'; g.lineWidth = 2.5;
    g.fillRect(x - 34 * s, y - 40 * s, 68 * s, 44 * s); g.strokeRect(x - 34 * s, y - 40 * s, 68 * s, 44 * s);
    g.strokeStyle = '#ff6a1a'; g.strokeRect(x - 12 * s, y - 16 * s, 24 * s, 16 * s);
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 1.5;
    for (let i = 0; i <= 6; i++) { const a = x - 16 * s + i * 32 * s / 6; g.beginPath(); g.moveTo(a, y + 4 * s); g.lineTo(x - 10 * s + i * 20 * s / 6 + (i % 2 ? 3 : -3) * s, y + 26 * s); g.stroke(); }
    g.strokeStyle = '#ff5a14'; g.lineWidth = 4 * s;
    g.beginPath(); g.ellipse(x, y + 4 * s, 17 * s, 5 * s, 0, 0, 7); g.stroke();
  }
  // 검지 하나(손끝이 위): 살색 + 손톱 + 마디 주름, 아래로 손등이 이어짐
  function finger(g, x, y) {
    g.save();
    g.fillStyle = '#f0c29c'; g.strokeStyle = '#7a4a2a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x - 10, y + 60); g.lineTo(x - 10, y + 8); g.quadraticCurveTo(x - 10, y - 4, x, y - 4); g.quadraticCurveTo(x + 10, y - 4, x + 10, y + 8); g.lineTo(x + 10, y + 60); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(x + 22, y + 66, 26, 16, -0.3, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f7ddd0'; g.strokeStyle = '#b8846a'; g.lineWidth = 1.2;
    g.beginPath(); g.ellipse(x, y + 4, 6, 7, 0, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(122,74,42,0.6)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x - 5, y + 24); g.quadraticCurveTo(x, y + 26, x + 5, y + 24); g.stroke();
    g.beginPath(); g.moveTo(x - 5, y + 40); g.quadraticCurveTo(x, y + 42, x + 5, y + 40); g.stroke();
    g.restore();
  }
  function bg(g, w, h) {
    const lg = g.createLinearGradient(0, 0, 0, h); lg.addColorStop(0, '#1a1030'); lg.addColorStop(1, '#0a0814');
    g.fillStyle = lg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1f2a24'; g.beginPath(); g.moveTo(w * 0.38, h * 0.42); g.lineTo(w * 0.62, h * 0.42); g.lineTo(w * 0.95, h); g.lineTo(w * 0.05, h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const x = w * 0.05 + i * w * 0.08; g.beginPath(); g.moveTo(x, h); g.lineTo(w * 0.38 + i * w * 0.02, h * 0.42); g.stroke(); }
  }
  const ease = (k) => k * k * (3 - 2 * k);
  // 한 번 던짐: 0~0.35 손가락이 위로 끌림, 0.35~1 공이 포물선으로 (tx,ty)까지
  function flick(g, w, h, k, len, tx, ty, ang) {
    const bx0 = w / 2, by0 = h * 0.84;
    if (k < 0.35) {
      const f = ease(k / 0.35), fx = bx0 + ang * 60 * f, fy = by0 + 10 - len * f;
      ball(g, bx0 + ang * 14 * f, by0 - 20 * f, 16);
      finger(g, fx, fy + 18);
      g.strokeStyle = 'rgba(255,210,58,0.9)'; g.lineWidth = 4; g.setLineDash([6, 6]);
      g.beginPath(); g.moveTo(bx0, by0 + 10); g.lineTo(fx, fy); g.stroke(); g.setLineDash([]);
    } else {
      const f = (k - 0.35) / 0.65, x = bx0 + (tx - bx0) * f, y = by0 - 20 + (ty - by0 + 20) * f - Math.sin(f * Math.PI) * h * 0.32;
      ball(g, x, y, 16 - 7 * f);
    }
  }
  function draw1(g, w, h, t) {
    bg(g, w, h); hoop(g, w / 2, h * 0.3, 1);
    const k = (t % 2.2) / 2.2;
    flick(g, w, h, Math.min(1, k * 1.25), 70, w / 2, h * 0.33, 0);
    if (k > 0.82) { g.fillStyle = '#ffd23a'; g.font = '30px Ttl, sans-serif'; g.textAlign = 'center'; g.fillText('NICE', w / 2, h * 0.14); }
  }
  function draw2(g, w, h, t) {
    bg(g, w, h); hoop(g, w / 2, h * 0.3, 1);
    const c = Math.floor(t / 2.2) % 3, k = Math.min(1, ((t % 2.2) / 2.2) * 1.25);
    if (c === 0) flick(g, w, h, k, 34, w / 2, h * 0.55, 0);       // 짧게 → 모자람
    else if (c === 1) flick(g, w, h, k, 72, w / 2, h * 0.33, 0); // 길게 → 들어감
    else flick(g, w, h, k, 66, w * 0.82, h * 0.36, 1);           // 비스듬히 → 옆으로
    const lab = ['SHORT', 'LONG', 'SIDE'][c];
    g.fillStyle = '#fff'; g.font = '22px Ttl, sans-serif'; g.textAlign = 'left'; g.fillText(lab, 12, 30);
  }
  function draw3(g, w, h, t) {
    g.fillStyle = '#070707'; g.fillRect(0, 0, w, h);
    const k = (t % 5) / 5, tm = Math.max(0, Math.ceil(40 - k * 46)), sc = Math.min(30, Math.floor(k * 36) * 2);
    const seg = window.RND && RND.seg7;
    g.fillStyle = '#d9d9d9'; g.font = 'bold 15px Ui, sans-serif'; g.textAlign = 'center';
    g.fillText('SCORE', w * 0.27, 40); g.fillText('TIME', w * 0.73, 40); g.fillText('GOAL', w * 0.5, 150);
    const num = (s, cx, y, col) => { for (let i = 0; i < s.length; i++) seg && seg(g, s[i], cx - s.length * 17 + i * 34, y, 28, 52, col, 'rgba(255,45,31,0.08)'); };
    num(String(sc).padStart(2, '0'), w * 0.27, 52, sc >= 20 ? '#ffd23a' : '#ff2d1f');
    num(String(tm).padStart(2, '0'), w * 0.73, 52, tm <= 10 ? '#ffd23a' : '#ff2d1f');
    num('20', w * 0.5, 160, '#3dff6a');
    if (tm <= 10 && tm > 0) { g.fillStyle = '#ffd23a'; g.font = '26px Ttl, sans-serif'; g.fillText('+3', w * 0.73, 136); }
    if (tm === 0) { g.fillStyle = '#ffd23a'; g.font = '40px Ttl, sans-serif'; g.fillText('CLEAR', w / 2, 226); }
  }
  function loop(t) {
    const s = (t - t0) / 1000;
    [['hw1', draw1], ['hw2', draw2], ['hw3', draw3]].forEach(([id, fn]) => { const c = document.getElementById(id); fn(c.getContext('2d'), c.width, c.height, s); });
    raf = requestAnimationFrame(loop);
  }
  H.open = function (fn) {
    after = fn; document.getElementById('how').hidden = false;
    t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  H.draw = (s) => { [['hw1', draw1], ['hw2', draw2], ['hw3', draw3]].forEach(([id, fn]) => { const c = document.getElementById(id); fn(c.getContext('2d'), c.width, c.height, s); }); };
  document.getElementById('howOk').onclick = () => {
    if (window.AU) AU.play('click');
    cancelAnimationFrame(raf); document.getElementById('how').hidden = true;
    const f = after; after = null; if (f) f();
  };
})();
