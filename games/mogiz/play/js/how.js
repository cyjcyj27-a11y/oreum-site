// HOW TO PLAY 움직이는 그림 셋 + 진화 카드 그림(2D 만화: 굵은 윤곽 + 두 단계 명암).
(function () {
  const H = (window.HOW = {});
  const INK = '#1c1426', SK = '#f3c9a3', SKD = '#dca37c';
  let raf = 0, t0 = 0;
  function cap(g, x1, y1, x2, y2, r, fill, shade) {
    g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = r * 2 + 6; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = fill; g.lineWidth = r * 2; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    if (shade) { g.strokeStyle = shade; g.lineWidth = r * 0.7; g.beginPath(); g.moveTo(x1, y1 + r * 0.55); g.lineTo(x2, y2 + r * 0.55); g.stroke(); }
  }
  function ell(g, x, y, rx, ry, fill, a) { g.beginPath(); g.ellipse(x, y, rx, ry, a || 0, 0, 7); g.fillStyle = fill; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
  // 옆에서 본 모기(오른쪽을 봄). belly 0~1, hl: 강조할 곳
  function mosq(g, x, y, s, belly, flap, hl, gold) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const H2 = gold ? '#ffcf3a' : '#ff4d6d';
    // 다리
    g.lineWidth = 2.2; g.lineCap = 'round';
    [[-4, 0], [2, 0], [8, 0]].forEach((l, i) => { for (let k = 0; k < 5; k++) { g.strokeStyle = hl === 'leg' ? (k % 2 ? H2 : INK) : k % 2 ? '#f2efe6' : INK; g.beginPath(); g.moveTo(l[0] - k * 4 + i * 2, 6 + k * 5); g.lineTo(l[0] - (k + 1) * 4 + i * 2, 6 + (k + 1) * 5); g.stroke(); } });
    // 날개
    g.save(); g.rotate(-0.4 - Math.sin(flap) * 0.5);
    g.fillStyle = hl === 'wing' ? 'rgba(255,90,120,.55)' : 'rgba(210,235,255,.7)'; g.strokeStyle = hl === 'wing' ? H2 : '#4a5a7a'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(-14, -10, 18, 6, 0.1, 0, 7); g.fill(); g.stroke(); g.restore();
    // 배
    const br = 1 + belly * 0.9, bc = belly > 0.05 ? 'rgb(' + (74 + belly * 150) + ',' + (66 - belly * 30) + ',' + (82 - belly * 20) + ')' : '#4a4252';
    ell(g, -16, 2, 15 * (1 + belly * 0.35), 6 * br, hl === 'belly' ? H2 : bc, 0.15);
    if (belly < 0.6) { g.strokeStyle = '#f2efe6'; g.lineWidth = 2; [-22, -15, -8].forEach((bx) => { g.beginPath(); g.moveTo(bx, -3 * br); g.lineTo(bx + 1, 6 * br); g.stroke(); }); }
    // 가슴·머리·눈
    ell(g, 0, 0, 7, 6.5, hl === 'camo' ? '#5a7a4a' : '#3b3443');
    ell(g, 9, 1, 4.5, 4.5, '#3b3443');
    ell(g, 10.5, 0, 3, 3, hl === 'eye' ? H2 : '#8a2236');
    // 침
    g.strokeStyle = INK; g.lineWidth = hl === 'needle' ? 3.2 : 2.2; g.beginPath(); g.moveTo(13, 3); g.lineTo(26, 10); g.stroke();
    if (hl === 'needle') { g.strokeStyle = H2; g.lineWidth = 1.6; g.beginPath(); g.moveTo(14, 3.5); g.lineTo(25, 9.5); g.stroke(); }
    g.restore();
  }
  function bg(g, w, h, top, bot) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top || '#3a3a7a'); gr.addColorStop(1, bot || '#b65f8f'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  function arm(g, w, h) { cap(g, -10, h * 0.72, w + 10, h * 0.62, 26, SK, SKD); }
  function bar(g, x, y, w, k, col) { g.fillStyle = 'rgba(15,10,35,.7)'; g.fillRect(x, y, w, 10); g.fillStyle = col; g.fillRect(x, y, w * k, 10); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x, y, w, 10); }
  function hand(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); ell(g, 0, 0, 30, 20, SK); for (let i = 0; i < 4; i++) ell(g, -18 + i * 12, -20, 6, 12, SK); ell(g, 30, 4, 7, 12, SK, -0.8); g.restore(); }
  function word(g, s, x, y, sz, col) { g.font = sz + 'px Jal, Ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = sz * 0.22; g.strokeStyle = INK; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); }

  function draw1(g, w, h, t) {
    bg(g, w, h); arm(g, w, h);
    const k = (t % 3) / 3, x = 30 + k * 120, y = 50 + Math.sin(t * 5) * 6 + k * 40;
    if (k > 0.55) { g.strokeStyle = '#ff4d6d'; g.lineWidth = 4; g.beginPath(); g.arc(178, h * 0.55, 14 + Math.sin(t * 9) * 3, 0, 7); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
    mosq(g, x, y, 1.6, 0, t * 40);
  }
  function draw2(g, w, h, t) {
    bg(g, w, h); arm(g, w, h);
    const k = (t % 4) / 4;
    mosq(g, 140, h * 0.5 - 14, 1.7, Math.min(1, k * 1.3), t * 6);
    if (k > 0.6) { g.strokeStyle = INK; g.lineWidth = 3; for (let i = 0; i < 3; i++) { const xx = 95 + i * 18 + Math.sin(t * 30 + i) * 2; g.beginPath(); g.moveTo(xx, 120); g.quadraticCurveTo(xx + 8, 110, xx, 102); g.stroke(); } }
    bar(g, 30, 14, 180, Math.min(1, k * 1.2), '#e3243f');
    bar(g, 30, 30, 180, Math.min(1, k * 1.05), k > 0.7 ? '#ff3048' : '#ffb03a');
  }
  function draw3(g, w, h, t) {
    bg(g, w, h); arm(g, w, h);
    const k = (t % 3) / 3, flee = k > 0.32;
    const hy = k < 0.45 ? 20 - k * 30 : k < 0.55 ? 6 + (k - 0.45) * 900 : 96;
    const mx = flee ? 140 + (k - 0.32) * 260 : 140, my = flee ? 86 - (k - 0.32) * 200 : 86;
    mosq(g, mx, my, 1.5, 0.8, t * 40);
    hand(g, 140, hy, 1.1);
    if (k > 0.55 && k < 0.8) word(g, L('찰싹!', 'SMACK!'), 120, 60, 34, '#fff');
    if (k > 0.55 && k < 0.85) word(g, L('휙!', 'DODGE!'), 200, 30, 26, '#7fe0ff');
  }
  const D = [draw1, draw2, draw3];
  H.start = function () {
    t0 = performance.now(); cancelAnimationFrame(raf);
    const loop = () => { const t = (performance.now() - t0) / 1000; ['hw1', 'hw2', 'hw3'].forEach((id, i) => { const c = document.getElementById(id); D[i](c.getContext('2d'), c.width, c.height, t); }); raf = requestAnimationFrame(loop); };
    loop();
  };
  H.stop = function () { cancelAnimationFrame(raf); };
  // 진화 카드 그림: 모기 한 마리에서 그 카드가 키우는 곳을 빨갛게(금테는 금빛)
  const PART = { wing: 'wing', quiet: 'wing', lift: 'wing', gJet: 'wing', gGhost: 'wing', dash: 'wing', rush: 'wing', leg: 'leg', slim: 'leg', shell: 'camo', numb: 'needle', sharp: 'needle', greedy: 'needle', gNumb: 'needle', gKing: 'needle', pop: 'needle', reflex: 'eye', gReflex: 'eye', eye: 'eye', nose: 'eye', belly: 'belly', digest: 'belly', tank: 'belly', resist: 'camo', coil: 'camo', gImmune: 'camo', camo: 'camo', hide: 'camo', whisper: 'wing', calm: 'camo' };
  H.cardArt = function (cv, cd, unknown) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    g.fillStyle = cd.g ? '#fff1b0' : '#eef3ff'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, 7); g.fill();
    g.strokeStyle = cd.g ? '#b8860b' : '#3a6fd0'; g.lineWidth = w * 0.035; g.stroke();
    if (unknown) { g.globalAlpha = 0.3; g.filter = 'brightness(0)'; }
    mosq(g, w * 0.55, h * 0.5, w / 64, PART[cd.id] === 'belly' ? 0.7 : 0.15, 0.6, PART[cd.id] || 'needle', !!cd.g);
    g.globalAlpha = 1; g.filter = 'none';
    if (unknown) word(g, '?', w / 2, h / 2, w * 0.4, '#fff');
  };
})();
