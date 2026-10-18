// how.js — HOW TO PLAY 창의 그림 세 칸. 실제 게임 화면(assets/how/1~3.webp) 위에 누르는 키·땅 동그라미·현상금을 되풀이해 그린다
(function () {
  const EN = DATA.EN, W = 880, H = 640;
  const touch = () => document.body.classList.contains('touch');
  const TX = EN ? {
    k: ['Pick an outlaw on the WANTED board<br>Arrow keys ride, follow the yellow arrow', 'Hold Space, the ring sweeps out and back<br>Let go when it turns gold', 'Drag your catch to the JAIL for the bounty<br>Catch every outlaw on the board'],
    t: ['Pick an outlaw on the WANTED board<br>Left stick rides, follow the yellow arrow', 'Hold the lasso button, the ring sweeps out and back<br>Let go when it turns gold']
  } : {
    k: ['마을 게시판에서 수배범을 골라요<br>방향키로 말을 몰아 노란 화살을 따라가요', 'Space 를 누르고 있으면 땅의 동그라미가 멀어졌다 가까워져요<br>수배범에 겹쳐 금색이 되면 놓아요', '묶은 수배범을 감옥(JAIL)까지 끌고 오면 현상금을 받아요<br>게시판의 수배범을 모두 잡아요'],
    t: ['마을 게시판에서 수배범을 골라요<br>왼쪽 원판으로 말을 몰아 노란 화살을 따라가요', '올가미 단추를 누르고 있으면 땅의 동그라미가 멀어졌다 가까워져요<br>수배범에 겹쳐 금색이 되면 놓아요']
  };
  const imgs = [1, 2, 3].map(n => { const i = new Image(); i.src = 'assets/how/' + n + '.webp'; return i; });
  const INK = '#26170c', GOLD = '#ffd23c';
  const ARROW = new Path2D('M12 1.5L21.5 12.5H16V22.5H8V12.5H2.5Z');
  let cvs = [], raf = 0, t0 = 0;
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  // 종이 키 단추: 눌리면 아래로 내려가고 두께가 얇아진다
  function key(c, x, y, w, h, label, down, fs) {
    const d = down ? 7 : 0;
    rr(c, x, y + 10, w, h, 12); c.fillStyle = INK; c.fill();
    rr(c, x, y + d, w, h, 12); const g = c.createLinearGradient(0, y + d, 0, y + d + h); g.addColorStop(0, down ? '#e8d6a6' : '#f8ecc8'); g.addColorStop(1, down ? '#c9ae72' : '#dcc590'); c.fillStyle = g; c.fill();
    c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#3a230e'; c.font = '400 ' + (fs || 34) + 'px BHTitle, Ria, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w / 2, y + d + h / 2 + 2);
  }
  // 놋쇠 둥근 단추(폰): 올가미 단추·이동 원판
  function brass(c, x, y, r, down) {
    const d = down ? 6 : 0;
    c.beginPath(); c.arc(x, y + 8, r, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(x, y + d, r, 0, Math.PI * 2); const g = c.createLinearGradient(0, y - r + d, 0, y + r + d); g.addColorStop(0, '#fbe29a'); g.addColorStop(.55, '#dfa844'); g.addColorStop(1, '#a8721e'); c.fillStyle = g; c.fill();
    c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); if (down) { c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); }
    return d;
  }
  function arrow(c, x, y, s, rot) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s / 24, s / 24); c.translate(-12, -12); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowOffsetY = 4 * 24 / s; c.fillStyle = GOLD; c.fill(ARROW); c.shadowColor = 'transparent'; c.lineWidth = 2.2; c.lineJoin = 'round'; c.strokeStyle = '#1a0f06'; c.stroke(ARROW); c.restore(); }
  function puff(c, x, y, r, a) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = 'rgba(226,190,140,' + a + ')'; c.fill(); }
  function zoom(c, ox, oy, k) { c.save(); c.scale(k, k); c.translate(-ox, -oy); }
  function bg(c, i, dy) { const im = imgs[i]; if (im.complete && im.naturalWidth) c.drawImage(im, 0, dy || 0, W, H); else { c.fillStyle = '#c88a52'; c.fillRect(0, 0, W, H); } }

  // 1칸: 말이 달리고(흙먼지), 노란 화살이 갈 길을 가리키고, 앞 키(폰은 원판)를 누르고 있다
  function p1(c, s) {
    s %= 2.4; const bob = Math.sin(s * Math.PI * 2 * 2.6) * 2.5; zoom(c, 170, 110, 1.32);
    const im = imgs[0]; if (im.complete && im.naturalWidth) c.drawImage(im, 0, bob - 4, W, H + 8); else bg(c, 0);
    for (let k = 0; k < 5; k++) { const f = (s * 1.6 + k / 5) % 1; puff(c, 392 - f * 120, 428 - f * 34, 10 + f * 26, 0.55 * (1 - f)); }
    arrow(c, 690 + Math.sin(s * Math.PI * 2 / 0.6) * 12, 318, 96, Math.PI / 2); c.restore();
    const down = s > 0.3;
    if (touch()) {
      c.beginPath(); c.arc(132, 520, 84, 0, Math.PI * 2); c.fillStyle = 'rgba(38,23,12,.35)'; c.fill(); c.lineWidth = 5; c.strokeStyle = 'rgba(38,23,12,.8)'; c.stroke();
      const ky = down ? -44 * ease((s - 0.3) / 0.2) : 0; brass(c, 132, 520 + ky, 36, false);
    } else key(c, 70, 496, 100, 100, '↑', down, 52);
  }
  // 2칸: 누르고 있으면 동그라미가 멀어졌다 가까워지고, 표적에 겹쳐 금색일 때 놓으면 고리가 몸을 조인다
  const A = [300, 500], F = [536, 177], O = [489, 242], HAND = [338, 404];
  function ring(c, x, y, rx, ry, gold, a) {
    c.save(); c.globalAlpha = a; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.lineWidth = 13; c.strokeStyle = 'rgba(26,15,6,.45)'; c.stroke(); c.lineWidth = 7; c.strokeStyle = gold ? GOLD : 'rgba(255,255,255,.92)'; c.stroke();
    if (gold) { c.shadowColor = GOLD; c.shadowBlur = 18; c.stroke(); } c.restore();
  }
  function p2(c, s) {
    s %= 3.4; zoom(c, 160, 96, 1.36); bg(c, 1);
    let g = 0, held = s >= 0.35 && s < 1.45;
    if (s >= 0.35 && s < 1.1) g = 0.5 - 0.5 * Math.cos(Math.PI * (s - 0.35) / 0.75); else if (s >= 1.1 && s < 1.45) g = 1 - 0.21 * ease((s - 1.1) / 0.35);
    if (held) {
      const x = A[0] + (F[0] - A[0]) * g, y = A[1] + (F[1] - A[1]) * g, r = 72 - 30 * g, on = Math.hypot(x - O[0], y - O[1]) < 26;
      ring(c, x, y, r, r * 0.42, on, 1);
    } else if (s >= 1.45) {
      const k = ease((s - 1.45) / 0.3), a = s > 3.0 ? 1 - (s - 3.0) / 0.4 : 1, rx = 48 - 26 * k, cy = O[1] - 46 * k;
      c.save(); c.globalAlpha = a; c.beginPath(); c.moveTo(HAND[0], HAND[1]); c.quadraticCurveTo((HAND[0] + O[0]) / 2, Math.min(HAND[1], cy) - 40 * (1 - k), O[0] - rx, cy);
      c.lineWidth = 9; c.strokeStyle = 'rgba(26,15,6,.5)'; c.stroke(); c.lineWidth = 5; c.strokeStyle = '#d8b46a'; c.stroke(); c.restore();
      ring(c, O[0], cy, rx, rx * (0.42 - 0.1 * k), true, a);
      const f = (s - 1.45) / 0.4; if (f < 1) {
        c.fillStyle = 'rgba(255,214,90,' + (0.5 * (1 - f)) + ')'; c.fillRect(0, 0, W, H);
        c.save(); c.strokeStyle = 'rgba(255,240,180,' + (1 - f) + ')'; c.lineWidth = 6; c.lineCap = 'round';
        for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2, r0 = 40 + f * 50, r1 = r0 + 26; c.beginPath(); c.moveTo(O[0] + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 0.7); c.lineTo(O[0] + Math.cos(an) * r1, cy + Math.sin(an) * r1 * 0.7); c.stroke(); }
        c.restore();
      }
    }
    c.restore();
    if (touch()) {
      const d = brass(c, 780, 530, 66, held);
      c.save(); c.translate(780 - 40, 530 + d - 44); c.scale(1.25, 1.25); c.lineWidth = 5; c.strokeStyle = '#3a230e'; c.lineCap = 'round';
      c.beginPath(); c.ellipse(34, 22, 20, 12, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(19, 30); c.bezierCurveTo(12, 40, 22, 46, 16, 58); c.stroke(); c.restore();
    } else key(c, 590, 528, 236, 78, 'SPACE', held, 32);
  }
  // 3칸: 묶은 놈을 끌고(흙먼지) 감옥 앞에 오면 현상금이 튀어 오른다
  function p3(c, s) {
    s %= 3; bg(c, 2);
    for (let k = 0; k < 4; k++) { const f = (s * 1.4 + k / 4) % 1; puff(c, 800 + f * 70, 482 - f * 26, 12 + f * 24, 0.5 * (1 - f)); }
    if (s > 0.9 && s < 2.8) {
      const u = s - 0.9, sc = u < 0.18 ? ease(u / 0.18) * 1.25 : u < 0.32 ? 1.25 - 0.25 * ease((u - 0.18) / 0.14) : 1, a = s > 2.4 ? 1 - (s - 2.4) / 0.4 : 1, y = 92 - 26 * ease(u / 1.2);
      c.save(); c.globalAlpha = a; c.translate(286, y); c.scale(sc, sc);
      c.font = '400 80px BHTitle, Ria, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      c.lineWidth = 16; c.strokeStyle = INK; c.strokeText('$50', 0, 0); c.fillStyle = GOLD; c.fillText('$50', 0, 0);
      c.fillStyle = '#fff6c8'; for (let i = 0; i < 7; i++) { const an = i / 7 * Math.PI * 2 + u * 2, r = 74 + u * 30; c.beginPath(); c.arc(Math.cos(an) * r, Math.sin(an) * r * 0.6, 6 * (1 - u / 1.9), 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
  }
  const DRAW = [p1, p2, p3];
  function loop(now) { raf = requestAnimationFrame(loop); const s = (now - t0) / 1000; cvs.forEach((c, i) => DRAW[i](c, s)); }
  window.HOW = {
    open() {
      const tx = touch() ? TX.t : [], ps = document.querySelectorAll('#howUI .step p');
      ps.forEach((p, i) => { p.innerHTML = '<b>' + (i + 1) + '</b><br>' + (tx[i] || TX.k[i]); });
      document.getElementById('howUI').classList.toggle('en', EN);
      cvs = [...document.querySelectorAll('#howUI canvas')].map(e => e.getContext('2d'));
      t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    draw(s) { cvs.forEach((c, i) => DRAW[i](c, s)); }   // 시험용: 한 순간을 그린다
  };
})();
