// 2D 햄스터 그림(사진 못 찍을 때 대신) + HOW TO PLAY 움직이는 그림 세 칸.
(function () {
  const HM = (window.HAM2D = {});
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');
  function dark(c, k) { const r = ((c >> 16) & 255) * k, g = ((c >> 8) & 255) * k, b = (c & 255) * k; return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
  function ell(g, x, y, rx, ry, fill, stroke, lw) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = lw || 2; g.strokeStyle = stroke; g.stroke(); } }
  // 앞에서 본 햄스터(3D 모양과 같은 찹쌀떡: 위는 털색 모자, 아래는 크림). cheek 0~1, sq 찌그러짐
  HM.draw = function (g, x, y, s, b, cheek, sq) {
    if (window.PORT && PORT.draw(g, x, y, s, b, cheek, sq)) return; // Meshy 햄스터 사진이 있으면 그걸로
    cheek = cheek || 0; sq = sq || 0;
    g.save(); g.translate(x, y); g.scale(s * (1 + sq * 0.5), s * (1 - sq));
    const top = hex(b.top), belly = hex(b.belly), ink = '#4a2a14', pink = '#f6a3ae';
    ell(g, 0, 35, 30, 6, 'rgba(74,42,20,.18)');
    // 귀
    for (const sx of [-1, 1]) { ell(g, sx * 19, -27, 9.5, 9.5, b.patch ? hex(b.patch) : top, ink, 2.5); ell(g, sx * 19, -26, 5.5, 5.5, pink); }
    // 몸: 크림 바탕 위에 털 모자(가운데가 살짝 처진 경계)
    ell(g, 0, 2, 30, 33, belly);
    g.save(); g.beginPath(); g.ellipse(0, 2, 30, 33, 0, 0, 7); g.clip();
    g.fillStyle = top; g.beginPath(); g.moveTo(-40, -40); g.lineTo(40, -40); g.lineTo(40, -5); g.quadraticCurveTo(0, 6, -40, -5); g.closePath(); g.fill();
    if (b.stripe) { g.fillStyle = hex(b.stripe); g.fillRect(-2.5, -34, 5, 22); }
    const sh = g.createRadialGradient(-10, -14, 4, 0, 2, 38); sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(74,42,20,.18)');
    g.fillStyle = sh; g.fillRect(-40, -40, 80, 80);
    g.restore();
    ell(g, 0, 2, 30, 33, null, ink, 3);
    // 볼
    const ck = 6 + cheek * 10;
    if (cheek > 0.05) for (const sx of [-1, 1]) ell(g, sx * (19 + cheek * 7), 11, ck, ck * 0.9, hex(b.cheek), 'rgba(74,42,20,.35)', 1.5);
    // 수염
    g.strokeStyle = '#fff'; g.lineWidth = 1.4;
    for (const sx of [-1, 1]) for (const a of [-2, 2]) { g.beginPath(); g.moveTo(sx * 15, 6 + a); g.lineTo(sx * (33 + cheek * 8), 5 + a * 2.4); g.stroke(); }
    // 눈·코·입
    for (const sx of [-1, 1]) { if (b.patch) ell(g, sx * 11, -3, 8, 7.5, hex(b.patch)); ell(g, sx * 11, -3, 5.6, 6.2, '#141012'); ell(g, sx * 11 + 1.6, -5.4, 1.9, 1.9, '#fff'); ell(g, sx * 11 - 1.6, -0.6, 0.8, 0.8, '#fff'); if (b.brow) ell(g, sx * 11, -12, 3.8, 1.5, hex(b.brow)); }
    ell(g, 0, 4, 2.4, 1.8, '#f08a98');
    if (cheek >= 0.75) { for (const [sx, r] of [[-3, 0.5], [3, -0.4], [0, 0.1]]) { g.save(); g.translate(sx, 11); g.rotate(r); ell(g, 0, 0, 2.6, 4.4, '#2a2628'); g.strokeStyle = '#e8e2d6'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -3.4); g.lineTo(0, 3.4); g.stroke(); g.restore(); } }
    else { g.beginPath(); g.moveTo(-4, 8); g.quadraticCurveTo(0, 16, 4, 8); g.closePath(); g.fillStyle = '#b8424e'; g.fill(); ell(g, 0, 11.5, 2.2, 1.4, '#f27a86'); }
    g.fillStyle = '#fff'; g.fillRect(-2.2, 7, 2, 3); g.fillRect(0.2, 7, 2, 3);
    // 앞발·뒷발
    for (const sx of [-1, 1]) { ell(g, sx * 9, 21, 4.6, 3.8, pink, ink, 1.4); ell(g, sx * 12, 34, 6.5, 3.6, pink, ink, 1.4); }
    g.restore();
  };
  HM.seed = function (g, x, y, s, gold) {
    g.save(); g.translate(x, y); g.rotate(0.35); g.scale(s, s);
    ell(g, 0, 0, 4.5, 8, gold ? '#ffc93a' : '#3a3634', '#1a1614', 1.2);
    if (!gold) { g.strokeStyle = '#f2efe6'; g.lineWidth = 1; for (const k of [-2, 0, 2]) { g.beginPath(); g.moveTo(k, -6.5); g.lineTo(k, 6.5); g.stroke(); } }
    g.restore();
  };

  // ---------- HOW TO PLAY ----------
  const H = (window.HOW = {});
  let raf = 0, t0 = 0;
  function bg(g, w, h, rows) {
    rows.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * h / rows.length, w, h / rows.length + 1); });
  }
  function car(g, x, y, c) { g.fillStyle = c; g.beginPath(); g.roundRect(x - 26, y - 12, 52, 22, 8); g.fill(); g.fillStyle = '#bfe8ff'; g.fillRect(x - 12, y - 18, 22, 8); g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(x - 15, y + 11, 6, 0, 7); g.arc(x + 15, y + 11, 6, 0, 7); g.fill(); }
  function frame(now) {
    const t = (now - t0) / 1000;
    const b = DATA.BREEDS[0];
    // 1) 누르면 앞으로, 밀면 옆으로
    let c = document.getElementById('hw1'), g = c.getContext('2d'); g.clearRect(0, 0, 240, 200);
    bg(g, 240, 200, ['#f7d7a8', '#8fb4d8', '#f3c6c9', '#8fb4d8', '#f7d7a8']);
    const ph = t % 3, hopK = (p) => Math.max(0, Math.min(1, p));
    let hx = 120, hy = 160, sq = 0;
    if (ph < 1.4) { const k = hopK((ph - 0.5) / 0.25); hy = 160 - k * 80; sq = Math.sin(k * Math.PI) * -0.15; }
    else { const k = hopK((ph - 2.0) / 0.25); hy = 80; hx = 120 + k * 60; sq = Math.sin(k * Math.PI) * -0.15; }
    HM.draw(g, hx, hy - Math.sin(Math.min(1, Math.max(0, ph < 1.4 ? (ph - 0.5) / 0.25 : (ph - 2) / 0.25)) * Math.PI) * 14, 0.7, b, 0, sq);
    // 손가락
    const fx = ph < 1.4 ? 70 : 60 + hopK((ph - 1.7) / 0.3) * 50, fy = 150, press = ph < 1.4 ? (ph > 0.3 && ph < 0.6) : (ph > 1.7 && ph < 2.0);
    g.globalAlpha = 0.9; g.fillStyle = '#ffe2c8'; g.strokeStyle = '#4a2a14'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(fx, fy + (press ? 4 : 0), 11, 15, 0, 0, 7); g.fill(); g.stroke();
    if (press) { g.beginPath(); g.arc(fx, fy - 12, 18, 0, 7); g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke(); }
    if (ph >= 1.4) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 185); g.lineTo(130, 185); g.lineTo(120, 178); g.moveTo(130, 185); g.lineTo(120, 192); g.stroke(); }
    g.globalAlpha = 1;
    // 2) 씨 → 볼 빵빵 → 은신처
    c = document.getElementById('hw2'); g = c.getContext('2d'); g.clearRect(0, 0, 240, 200);
    bg(g, 240, 200, ['#9fd36b', '#8cc65c']);
    const p2 = t % 4, ck = Math.min(1, Math.floor(Math.min(p2, 2.4) / 0.6) / 4);
    g.fillStyle = '#c8925a'; g.fillRect(170, 70, 56, 50); g.fillStyle = '#a8703a'; g.beginPath(); g.moveTo(162, 72); g.lineTo(198, 40); g.lineTo(234, 72); g.fill(); g.fillStyle = '#3a2414'; g.beginPath(); g.arc(198, 106, 12, Math.PI, 0); g.fillRect(186, 106, 24, 14); g.fill();
    for (let i = 0; i < 4; i++) if (p2 < 0.6 * (i + 1)) HM.seed(g, 40 + i * 30, 160, 1.6, false);
    const hx2 = p2 < 2.6 ? 40 + Math.min(p2, 2.4) * 40 : 136 + Math.min(1, (p2 - 2.6) / 0.4) * 40;
    HM.draw(g, hx2, p2 > 2.6 ? 120 : 140, 0.75, b, p2 > 3.1 ? 0 : ck);
    if (p2 > 3.1) { g.font = '28px Ttl, Ui, sans-serif'; g.lineWidth = 6; g.strokeStyle = '#4a2a14'; g.fillStyle = '#ffd23a'; g.textAlign = 'center'; g.strokeText('+4', 198, 30 - (p2 - 3.1) * 20); g.fillText('+4', 198, 30 - (p2 - 3.1) * 20); }
    // 3) 고양이 앞발
    c = document.getElementById('hw3'); g = c.getContext('2d'); g.clearRect(0, 0, 240, 200);
    bg(g, 240, 200, ['#f4f1ea', '#dfe7ea', '#b9c2c8', '#f4f1ea']);
    const p3 = t % 3, k3 = Math.min(1, Math.max(0, (p3 - 1.2) / 0.25));
    HM.draw(g, 120, 130, 0.75, b, 0, k3 > 0.9 ? 0.5 : 0);
    const py = p3 < 1.2 ? 230 - Math.sin(p3 * 5) * 6 : 230 - k3 * 120;
    // 회색 태비 팔 + 하얀 양말 발(게임 속 앞발과 같은 모양)
    g.lineWidth = 3; g.strokeStyle = '#4a2a14';
    g.fillStyle = '#9a948c'; g.beginPath(); g.roundRect(94, py + 6, 52, 120, 20); g.fill(); g.stroke();
    g.fillStyle = '#55504a'; for (const k of [30, 50, 70]) g.fillRect(96, py + k, 48, 7);
    g.fillStyle = '#f6f4f0'; g.fillRect(96, py + 4, 48, 16);
    g.beginPath(); g.ellipse(120, py, 36, 30, 0, 0, 7); g.fill(); g.stroke();
    for (const x of [-18, 0, 18]) { g.beginPath(); g.ellipse(120 + x, py - 26, 12, 12, 0, 0, 7); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(120, py - 4, 34, 24, 0, 0, 7); g.fill();
    raf = requestAnimationFrame(frame);
  }
  H.start = function () { cancelAnimationFrame(raf); t0 = performance.now(); raf = requestAnimationFrame(frame); };
  H.stop = function () { cancelAnimationFrame(raf); };
})();
