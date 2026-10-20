// HOW TO PLAY: 진짜 인물 그림으로 세 동작을 되풀이해 보여 준다(점 그림, CSS 로 키움)
(function () {
  const H = (window.HOW = {});
  let raf = 0, t0 = 0, after = null;
  const P = PX.POSE, LK = PX.LOOKS;
  const T = { back: '#d8c8a4', brick: '#ece0c0', mort: '#a8987a', top: '#c89a5e', topL: '#ecc488', front: '#8a5e34', frontD: '#5a3a1e', blk: '#8e8a84', blkL: '#b4b0a8', blkD: '#64605a' };
  function bg(g) {
    g.fillStyle = T.back; g.fillRect(0, 0, 160, 120);
    for (let i = 0; i < 90; i++) { g.fillStyle = i % 2 ? T.brick : T.mort; g.fillRect((i * 53) % 160, (i * 37) % 120, 1 + (i % 3), 1); }
    for (let x = 0; x < 160; x += 64) { g.fillStyle = '#7a3a26'; g.fillRect(x, 0, 4, 120); g.fillStyle = '#a85438'; g.fillRect(x + 1, 0, 1, 120); }
    g.fillStyle = '#7a3a26'; g.fillRect(0, 10, 160, 3); for (let k = 0; k < 40; k++) { g.fillStyle = k % 2 ? '#2f8a5a' : '#c83a2a'; g.fillRect(k * 4, 13, 4, 2); }
  }
  function slab(g, x, y, w) { g.fillStyle = T.topL; g.fillRect(x, y - 2, w, 1); g.fillStyle = T.top; g.fillRect(x, y - 1, w, 2); g.fillStyle = T.front; g.fillRect(x, y + 1, w, 3); g.fillStyle = T.frontD; g.fillRect(x, y + 4, w, 2); }
  function block(g, x, y, w, h) {
    g.fillStyle = '#3e3c38'; g.fillRect(x, y, w, h);
    for (let yy = 0; yy < h; yy += 8) for (let xx = (Math.floor(yy / 8) % 2) * 8 - 8; xx < w; xx += 16) { const a = Math.max(0, xx), b = Math.min(w, xx + 15); if (b > a) { g.fillStyle = T.blk; g.fillRect(x + a, y + yy + 1, b - a, 6); g.fillStyle = T.blkL; g.fillRect(x + a, y + yy + 1, b - a, 1); } }
  }
  function key(g, x, y, s, on) {   // 단추 그림
    g.fillStyle = '#1a0e12'; g.fillRect(x - 1, y - 1, 16, 12); g.fillStyle = on ? '#f0c058' : '#3a2a20'; g.fillRect(x, y, 14, 10);
    g.fillStyle = on ? '#1a0e12' : '#c8a070'; g.font = '8px Px, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x + 7, y + 5.5);
  }
  const ease = PX.ease;
  // 1) 달리다 점프: 틈을 건너뛰고 내려선다
  function d1(g, t) {
    bg(g); slab(g, 0, 96, 66); slab(g, 106, 96, 54); block(g, 0, 98, 66, 22); block(g, 106, 98, 54, 22);
    const k = t % 2.4; let x, y = 96, p, st = 'run';
    if (k < 0.5) { x = 8 + k * 100; p = PX.run((k * 2.5) % 1); }
    else if (k < 1.12) { const u = k - 0.5; x = 58 + u * 140 * 0.62; y = 96 - 125 * u * 0.62 * 1.4 + 210 * u * u * 1.4 * 0.62; p = P.leap; st = 'leap'; }
    else if (k < 1.3) { x = 112; p = PX.mix(P.crouch, P.stand, (k - 1.12) / 0.18); }
    else { x = 112 + Math.min(1, (k - 1.3) / 0.5) * 30; p = k < 1.8 ? PX.run(((k - 1.3) * 2.5) % 1) : P.stand; }
    y = Math.min(96, y);
    PX.draw(g, p, { look: LK.prince, sword: 1, t, vx: st === 'run' ? 60 : 30, air: st === 'leap' }, x, y, 1);
    key(g, 4, 4, '→', k < 1.1); key(g, 22, 4, '↑', k > 0.38 && k < 0.6);
  }
  // 2) 위 칸 끝으로 뛰어 매달리고, 위를 눌러 오른다
  function d2(g, t) {
    bg(g); block(g, 92, 50, 68, 70); slab(g, 92, 52, 68); slab(g, 0, 106, 92);
    const k = t % 3.2; let x = 74, y = 106, p = P.stand;
    const hx = 92 - 5, hy = 52 - G.HANG_HAND;
    if (k < 0.4) p = P.stand;
    else if (k < 0.56) p = P.jumpPrep;
    else if (k < 0.8) { const u = (k - 0.56) / 0.24; x = 74 + (hx - 74) * u; y = 106 + (hy - 106) * (1 - (1 - u) * (1 - u)); p = PX.mix(P.jumpUp, P.hang, u); }
    else if (k < 1.5) { x = hx; y = hy; p = P.hang; }
    else if (k < 2.3) { const u = (k - 1.5) / 0.8; p = PX.keys(PX.climbKeys, u); x = hx + (100 - hx) * ease((u - 0.3) / 0.5); y = hy + (52 - hy) * ease(Math.min(1, u / 0.62)); }
    else { x = 100; y = 52; p = P.stand; }
    PX.draw(g, p, { look: LK.prince, sword: 1, t }, x, y, 1);
    key(g, 4, 4, '↑', (k > 0.4 && k < 0.6) || (k > 1.3 && k < 1.6));
  }
  // 3) 적이 칼을 쳐들면 막고, 그다음 친다
  function d3(g, t) {
    bg(g); slab(g, 0, 100, 160); block(g, 0, 102, 160, 18);
    const k = t % 2.6, gl = LK.guard;
    let ep = P.guardF, pp = P.guardF, spark = 0, et = 0, pk = '';
    if (k < 0.5) { ep = PX.mix(P.guardF, P.windup, ease(k / 0.5)); }
    else if (k < 0.62) { ep = P.strike; pp = P.block; spark = 1; pk = 'B'; }
    else if (k < 0.9) { ep = PX.mix(P.block, P.hurt, Math.sin((k - 0.62) / 0.28 * Math.PI)); pp = P.block; pk = 'B'; }
    else if (k < 1.0) { pp = PX.mix(P.guardF, P.windup, (k - 0.9) / 0.1); ep = P.hurt; pk = 'A'; }
    else if (k < 1.3) { pp = P.strike; ep = P.hurt; et = 1; pk = 'A'; }
    else if (k < 1.7) { pp = PX.mix(P.strike, P.guardF, (k - 1.3) / 0.4); ep = PX.mix(P.hurt, P.guardF, (k - 1.3) / 0.4); }
    const ex = k > 1.0 && k < 1.7 ? 104 : 98;
    PX.draw(g, pp, { look: LK.prince, sword: 2, t }, 64, 100, 1);
    PX.draw(g, ep, { look: gl, sword: 2, t, tint: et ? [255, 240, 220, 0.5] : null }, ex, 100, -1);
    if (spark) { g.fillStyle = '#fff6c0'; for (let i = 0; i < 8; i++) { const a = i * 0.8; g.fillRect(Math.round(82 + Math.cos(a) * 5), Math.round(70 + Math.sin(a) * 5), 1, 1); } }
    key(g, 4, 4, '↑', pk === 'B'); key(g, 22, 4, L('공', 'A'), pk === 'A');
    if (k < 0.5) { g.fillStyle = '#ff5a48'; g.fillRect(101, 18, 2, 7); g.fillRect(101, 27, 2, 2); }
  }
  // 4) 화살 구멍이 쏘면 숙여서 머리 위로 보낸다
  function d4(g, t) {
    bg(g); slab(g, 0, 100, 160); block(g, 0, 102, 160, 18);
    g.fillStyle = '#1a0e12'; g.fillRect(144, 56, 12, 13); g.fillStyle = '#7a5634'; g.fillRect(145, 57, 10, 11); g.fillStyle = '#c83a2a'; g.fillRect(146, 59, 8, 1); g.fillStyle = '#1a0e12'; g.fillRect(145, 65, 2, 2);
    const k = t % 2.0, ax = 142 - k * 150, duck = ax < 104 && ax > 30;
    const p = duck ? P.duck : PX.mix(P.duck, P.stand, Math.min(1, ax > 104 ? (ax - 104) / 20 : (30 - ax) / 20));
    PX.draw(g, p, { look: LK.prince, sword: 1, t }, 64, 100, 1);
    if (ax > -10) { const y = 66; g.fillStyle = '#e8e0c8'; g.fillRect(Math.round(ax), y, 10, 1); g.fillStyle = '#c8ccd8'; g.fillRect(Math.round(ax) - 2, y, 2, 1); g.fillStyle = '#c83a2a'; g.fillRect(Math.round(ax) + 9, y - 1, 2, 1); g.fillRect(Math.round(ax) + 9, y + 1, 2, 1); }
    key(g, 4, 4, '↓', duck);
  }
  const DR = [['hw1', d1], ['hw2', d2], ['hw3', d3], ['hw4', d4]];
  H.draw = function (s) { for (const [id, fn] of DR) { const c = document.getElementById(id), g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g, s); } };
  function loop(t) { H.draw((t - t0) / 1000); raf = requestAnimationFrame(loop); }
  H.open = function (fn) { after = fn; document.getElementById('how').hidden = false; t0 = performance.now(); cancelAnimationFrame(raf); H.draw(0); raf = requestAnimationFrame(loop); };
  document.getElementById('howOk').onclick = () => {
    AU.play('click'); cancelAnimationFrame(raf); document.getElementById('how').hidden = true;
    const f = after; after = null; if (f) f();
  };
})();