/* ALL SEEING PIZZA — 그림 (배경·화덕·계산대·피자·상자·리무진) */
(function () {
  'use strict';
  const W = 1280, H = 720;
  const rnd = s => { const v = Math.sin(s * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function rr(x, x0, y0, w, h, r) { x.beginPath(); x.roundRect(x0, y0, w, h, r); }
  function ell(x, cx, cy, rx, ry) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); }
  function vg(x, y0, y1, stops) { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }
  function hg(x, x0, x1, stops) { const g = x.createLinearGradient(x0, 0, x1, 0); stops.forEach(s => g.addColorStop(s[0], s[1])); return g; }

  // 자리(게임과 같이 씀)
  const L = {
    WALL: 470, FLOOR: 480, DOORX: 948, STREET: 962,
    OVENS: [130, 290, 450, 610], OVEN_Y: 462, OVEN_W: 136, OVEN_H: 190,
    COUNTER: { x0: 40, x1: 800, top: 492, bot: 598 },
    REG: { x: 720, y: 492 },
    ORDER: { x: 736, y: 682 }, QUEUE: [{ x: 814, y: 684 }, { x: 870, y: 694 }, { x: 918, y: 704 }],
    WAIT_Y: 700, WALK_Y: 704, SIDE_Y: 646, CURB: 1130, ROAD_Y: 716,
    ANON: [{ x: 1000, y: 640 }, { x: 1150, y: 640 }, { x: 1075, y: 596 }, { x: 1036, y: 552 }, { x: 1118, y: 552 }],   // PC 에선 오른쪽 아래에 상점·도감 단추가 있어 x 1170 안쪽에만
  };

  /* ── 피자(위에서 본 모양) ── */
  const PIZZAS = {
    cheese: { sauce: '#e2542a', cheese: '#ffd766', tops: [] },
    pepperoni: { sauce: '#e2542a', cheese: '#ffd766', tops: [['pep', 7]] },
    margherita: { sauce: '#e2542a', cheese: '#fff1c8', tops: [['moz', 5], ['basil', 5]] },
    hawaiian: { sauce: '#e2542a', cheese: '#ffd766', tops: [['pine', 7], ['ham', 5]] },
    supreme: { sauce: '#e2542a', cheese: '#ffd766', tops: [['pep', 4], ['pepper', 5], ['olive', 6], ['mush', 4]] },
    truffle: { sauce: '#f4e6c4', cheese: '#fff4d8', tops: [['truffle', 9], ['gold', 5]] },
    kimchi: { sauce: '#d9452a', cheese: '#ffc76a', tops: [['kimchi', 7], ['onion', 7]] },
  };
  function pizza(x, cx, cy, r, kind, rot) {
    const P = PIZZAS[kind] || PIZZAS.cheese;
    x.save(); x.translate(cx, cy); x.rotate(rot || 0);
    ell(x, 0, r * .12, r * 1.02, r * .98); x.fillStyle = 'rgba(0,0,0,.25)'; x.fill();
    const cr = x.createRadialGradient(-r * .3, -r * .3, r * .2, 0, 0, r);
    cr.addColorStop(0, '#f6c276'); cr.addColorStop(1, '#b9702a');
    ell(x, 0, 0, r, r); x.fillStyle = cr; x.fill();
    ell(x, 0, 0, r * .84, r * .84); x.fillStyle = P.sauce; x.fill();
    x.fillStyle = P.cheese;                       // 녹은 치즈 — 둥근 물결 가장자리
    x.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, rr2 = r * (.74 + .05 * Math.sin(i * 2.7)); const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,.28)'; ell(x, -r * .28, -r * .3, r * .22, r * .12); x.fill();
    P.tops.forEach(([t, n], ti) => {
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2 + ti * .7, d = r * (.25 + .38 * rnd(i * 3.3 + ti)), px = Math.cos(a) * d, py = Math.sin(a) * d;
        if (t === 'pep') { ell(x, px, py, r * .13, r * .13); x.fillStyle = '#b9261c'; x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; ell(x, px + r * .03, py + r * .03, r * .05, r * .05); x.fill(); }
        else if (t === 'moz') { ell(x, px, py, r * .15, r * .13); x.fillStyle = '#fffdf4'; x.fill(); }
        else if (t === 'basil') { x.save(); x.translate(px, py); x.rotate(a); ell(x, 0, 0, r * .12, r * .06); x.fillStyle = '#2f9a3a'; x.fill(); x.restore(); }
        else if (t === 'pine') { x.save(); x.translate(px, py); x.rotate(a * 2); x.fillStyle = '#ffe14a'; x.beginPath(); x.moveTo(0, -r * .1); x.lineTo(r * .1, r * .07); x.lineTo(-r * .1, r * .07); x.closePath(); x.fill(); x.restore(); }
        else if (t === 'ham') { x.fillStyle = '#f08a8a'; rr(x, px - r * .08, py - r * .06, r * .16, r * .12, r * .03); x.fill(); }
        else if (t === 'pepper') { x.strokeStyle = '#3cb043'; x.lineWidth = r * .05; x.beginPath(); x.arc(px, py, r * .08, .3, Math.PI * 1.7); x.stroke(); }
        else if (t === 'olive') { ell(x, px, py, r * .06, r * .06); x.fillStyle = '#222'; x.fill(); ell(x, px, py, r * .025, r * .025); x.fillStyle = P.cheese; x.fill(); }
        else if (t === 'mush') { x.fillStyle = '#d8c3a0'; x.beginPath(); x.arc(px, py, r * .08, Math.PI, 0); x.fill(); x.fillRect(px - r * .025, py, r * .05, r * .07); }
        else if (t === 'truffle') { x.fillStyle = '#2a1e18'; ell(x, px, py, r * .05, r * .05); x.fill(); }
        else if (t === 'kimchi') {   // 배추김치 한 잎 — 쭈글한 가장자리, 붉은 양념, 허연 줄기
          x.save(); x.translate(px, py); x.rotate(a * 1.7 + ti); const k = r * .19;
          x.fillStyle = '#b8261a'; x.beginPath();
          for (let q = 0; q <= 10; q++) { const aa = q / 10 * Math.PI * 2, rr2 = k * (q % 2 ? .72 : 1) * (1 + .15 * Math.sin(q * 3 + i)); const qx = Math.cos(aa) * rr2 * 1.25, qy = Math.sin(aa) * rr2 * .8; q ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }
          x.closePath(); x.fill();
          x.fillStyle = '#e04a26'; ell(x, -k * .15, -k * .12, k * .75, k * .42); x.fill();
          x.fillStyle = '#f7dfb0'; x.beginPath(); x.moveTo(-k * 1.05, k * .12); x.quadraticCurveTo(0, -k * .22, k * 1.05, k * .06); x.quadraticCurveTo(0, k * .1, -k * 1.05, k * .12); x.fill();
          x.fillStyle = '#7a1208'; for (let q = 0; q < 5; q++) { x.fillRect(-k * .7 + q * k * .33, -k * .35 + (q % 2) * k * .45, k * .09, k * .09); }
          x.restore(); }
        else if (t === 'onion') { x.strokeStyle = '#3cb043'; x.lineWidth = r * .03; ell(x, px, py, r * .04, r * .04); x.stroke(); }
        else if (t === 'gold') { x.fillStyle = '#ffd24a'; x.save(); x.translate(px, py); x.rotate(a); x.fillRect(-r * .06, -r * .04, r * .12, r * .08); x.restore(); }
      }
    });
    x.restore();
  }

  /* ── 피자 상자(옆에서 비스듬히) — 뚜껑에 눈 로고 ── */
  function box(x, cx, cy, s) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    x.fillStyle = '#b07a3e'; rr(x, -34, -6, 68, 14, 3); x.fill();
    x.fillStyle = vg(x, -14, -4, [[0, '#f0c98c'], [1, '#d9a864']]); x.beginPath(); x.moveTo(-34, -6); x.lineTo(-26, -16); x.lineTo(26, -16); x.lineTo(34, -6); x.closePath(); x.fill();
    x.fillStyle = '#7a3a1a'; x.beginPath(); x.moveTo(0, -15); x.lineTo(7, -8); x.lineTo(-7, -8); x.closePath(); x.fill();
    x.fillStyle = '#fff'; ell(x, 0, -10.5, 2.4, 1.5); x.fill();
    x.fillStyle = '#9a6430'; x.fillRect(-34, 3, 68, 2);
    x.restore();
  }

  /* ── 코인 더미 ── */
  function coins(x, cx, cy, n, t) {
    for (let i = 0; i < n; i++) {
      const ox = (i % 4 - 1.5) * 13 + ((i / 4 | 0) % 2) * 6, oy = -Math.floor(i / 4) * 6;
      ell(x, cx + ox, cy + oy, 9, 5); x.fillStyle = '#b8861c'; x.fill();
      ell(x, cx + ox, cy + oy - 2, 9, 5); x.fillStyle = hg(x, cx + ox - 9, cx + ox + 9, [[0, '#ffe794'], [.5, '#ffd24a'], [1, '#d49a1e']]); x.fill();
      x.strokeStyle = '#9a7010'; x.lineWidth = 1; x.stroke();
    }
  }

  /* ── 화덕(벽돌 돔) ── */
  function oven(x, cx, base, st) {  // st: {lock, fire(0~1), prog, done, kind, t, hot}
    const w = L.OVEN_W, h = L.OVEN_H, top = base - h;
    x.save();
    if (st.lock) x.globalAlpha = .35;
    // 받침
    x.fillStyle = vg(x, base - 58, base, [[0, '#8c5a3c'], [1, '#5e3a26']]); rr(x, cx - w / 2 - 6, base - 58, w + 12, 58, 6); x.fill();
    // 돔
    x.beginPath(); x.moveTo(cx - w / 2, base - 56); x.bezierCurveTo(cx - w / 2, top - 10, cx + w / 2, top - 10, cx + w / 2, base - 56); x.closePath();
    x.fillStyle = vg(x, top, base - 56, [[0, '#d2744a'], [1, '#a24a2a']]); x.fill();
    x.save(); x.clip();                        // 벽돌 결
    x.strokeStyle = 'rgba(80,30,10,.35)'; x.lineWidth = 2;
    for (let y = top; y < base - 56; y += 16) { x.beginPath(); x.moveTo(cx - w, y); x.lineTo(cx + w, y); x.stroke(); for (let k = -4; k < 5; k++) { const bx = cx + k * 30 + ((y / 16 | 0) % 2) * 15; x.beginPath(); x.moveTo(bx, y); x.lineTo(bx, y + 16); x.stroke(); } }
    x.fillStyle = 'rgba(255,255,255,.12)'; ell(x, cx - w * .2, top + 30, w * .25, 18); x.fill();
    x.restore();
    // 입구(아치) + 불
    const mw = 70, mh = 50, my = base - 60;
    x.beginPath(); x.moveTo(cx - mw / 2, my); x.lineTo(cx - mw / 2, my - mh * .45); x.quadraticCurveTo(cx, my - mh * 1.25, cx + mw / 2, my - mh * .45); x.lineTo(cx + mw / 2, my); x.closePath();
    x.fillStyle = '#1a0c06'; x.fill();
    if (!st.lock) {
      x.save(); x.clip();
      const f = .55 + .45 * (st.fire || 0), t = st.t || 0;
      const g = x.createRadialGradient(cx, my, 4, cx, my - 10, mw * .8);
      g.addColorStop(0, 'rgba(255,240,160,' + f + ')'); g.addColorStop(.5, 'rgba(255,140,40,' + f * .9 + ')'); g.addColorStop(1, 'rgba(120,20,0,0)');
      x.fillStyle = g; x.fillRect(cx - mw, my - mh * 1.4, mw * 2, mh * 1.6);
      for (let i = 0; i < 5; i++) {         // 흔들리는 불꽃
        const fx = cx - 24 + i * 12, fh = (14 + 10 * Math.sin(t * 9 + i * 1.7)) * (.7 + .6 * (st.fire || 0));
        x.fillStyle = i % 2 ? '#ffb02e' : '#ffe27a'; x.beginPath(); x.moveTo(fx - 6, my); x.quadraticCurveTo(fx - 4, my - fh * .6, fx, my - fh); x.quadraticCurveTo(fx + 4, my - fh * .6, fx + 6, my); x.fill();
      }
      if (st.kind) pizza(x, cx, my - 6, 18, st.kind, 0);   // 굽는 피자(앞에서 보면 납작하게)
      x.restore();
      // 불빛 번짐
      const gl = x.createRadialGradient(cx, my - 10, 10, cx, my - 10, 120 + 60 * (st.fire || 0));
      gl.addColorStop(0, 'rgba(255,170,60,' + (.22 + .25 * (st.fire || 0)) + ')'); gl.addColorStop(1, 'rgba(255,170,60,0)');
      x.fillStyle = gl; x.fillRect(cx - 200, my - 200, 400, 320);
    }
    // 굴뚝
    const peak = .75 * (top - 10) + .25 * (base - 56);      // 돔 꼭대기 — 굴뚝이 여기에 붙는다
    x.fillStyle = '#6e4430'; rr(x, cx - 12, peak - 54, 24, 60, 4); x.fill(); x.fillStyle = '#4e2e20'; rr(x, cx - 16, peak - 60, 32, 10, 3); x.fill();
    x.restore();
  }

  /* ── 리무진(옆모습, 왼쪽을 봄) ── */
  function limo(x, cx, base, s, door) {
    x.save(); x.translate(cx, base); x.scale(s, s);
    ell(x, 0, 2, 230, 10); x.fillStyle = 'rgba(0,0,0,.35)'; x.fill();
    x.fillStyle = vg(x, -86, -20, [[0, '#2c2f38'], [.5, '#0f1116'], [1, '#050608']]);
    x.beginPath(); x.moveTo(-230, -26); x.bezierCurveTo(-232, -52, -214, -60, -180, -62);
    x.lineTo(-138, -64); x.bezierCurveTo(-120, -92, -100, -96, -70, -96); x.lineTo(150, -96); x.bezierCurveTo(180, -96, 196, -80, 206, -64);
    x.bezierCurveTo(226, -60, 232, -44, 230, -24); x.lineTo(230, -18); x.lineTo(-230, -18); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,.18)'; rr(x, -200, -60, 410, 4, 2); x.fill();         // 옆 반사
    x.fillStyle = vg(x, -90, -64, [[0, '#6c7a8e'], [1, '#2a3240']]);                     // 창
    x.beginPath(); x.moveTo(-126, -66); x.bezierCurveTo(-112, -86, -98, -88, -76, -88); x.lineTo(-40, -88); x.lineTo(-40, -66); x.closePath(); x.fill();
    rr(x, -30, -88, 150, 22, 3); x.fill();
    x.beginPath(); x.moveTo(130, -88); x.lineTo(148, -88); x.bezierCurveTo(170, -88, 184, -78, 192, -66); x.lineTo(130, -66); x.closePath(); x.fill();
    if (door) { x.fillStyle = '#050608'; rr(x, 20, -90, 50 * door, 70, 3); x.fill(); }
    x.fillStyle = '#c9ced8'; rr(x, -230, -30, 14, 8, 3); x.fill(); x.fillStyle = '#ffe9a8'; rr(x, -228, -46, 10, 8, 3); x.fill();
    x.fillStyle = '#e03030'; rr(x, 220, -46, 10, 10, 3); x.fill();
    for (const wx of [-150, 150]) { ell(x, wx, -18, 30, 30); x.fillStyle = '#0a0a0c'; x.fill(); ell(x, wx, -18, 16, 16); x.fillStyle = '#9aa2b0'; x.fill(); ell(x, wx, -18, 6, 6); x.fillStyle = '#4a505c'; x.fill(); }
    x.fillStyle = '#ffd24a'; x.beginPath(); x.moveTo(196, -96); x.lineTo(206, -104); x.lineTo(212, -96); x.fill();  // 작은 깃발 받침
    x.restore();
  }

  /* ── 로고: 피자 조각 피라미드 + 모든 것을 보는 눈 ── */
  function logo(x, cx, cy, r) {   // 일루미나티처럼 꼭짓점이 위(사장님 9/28) — 조각은 위아래로 뒤집어 그리고, 눈은 똑바로
    const top = cy - r * .9, bot = cy + r * 1.05;
    x.save(); x.translate(0, 2 * cy - r * .14); x.scale(1, -1);
    x.fillStyle = '#c9762a'; x.beginPath(); x.moveTo(cx - r, top); x.quadraticCurveTo(cx, top - r * .42, cx + r, top); x.lineTo(cx + r * .9, top + r * .16); x.quadraticCurveTo(cx, top - r * .2, cx - r * .9, top + r * .16); x.closePath(); x.fill();
    x.fillStyle = vg(x, top, bot, [[0, '#ffd65a'], [1, '#f3a21f']]); x.beginPath(); x.moveTo(cx - r * .9, top + r * .16); x.quadraticCurveTo(cx, top - r * .2, cx + r * .9, top + r * .16); x.quadraticCurveTo(cx + r * .2, bot - r * .3, cx, bot); x.quadraticCurveTo(cx - r * .2, bot - r * .3, cx - r * .9, top + r * .16); x.fill();
    x.fillStyle = '#d8382a'; for (const [px, py, pr] of [[-.45, .12, .13], [.42, .2, .12], [.05, .62, .1]]) { ell(x, cx + px * r, top + py * r * 2, pr * r, pr * r); x.fill(); }
    x.restore();
    const ey = cy - r * .02, ew = r * .5, eh = r * .26;
    x.fillStyle = '#fffaf0'; x.beginPath(); x.moveTo(cx - ew, ey); x.bezierCurveTo(cx - ew * .5, ey - eh * 1.3, cx + ew * .5, ey - eh * 1.3, cx + ew, ey); x.bezierCurveTo(cx + ew * .5, ey + eh * 1.3, cx - ew * .5, ey + eh * 1.3, cx - ew, ey); x.fill();
    x.strokeStyle = '#5a2a0a'; x.lineWidth = r * .045; x.stroke();
    x.fillStyle = '#1d6fd8'; ell(x, cx, ey, eh * .82, eh * .82); x.fill(); x.fillStyle = '#08152b'; ell(x, cx, ey, eh * .42, eh * .42); x.fill();
    x.fillStyle = '#fff'; ell(x, cx + eh * .28, ey - eh * .3, eh * .18, eh * .18); x.fill();
  }

  /* ── 배경(가게 안 + 바깥 거리) — 한 번 그려 두고 쓴다 ── */
  function background(x, S, EN) {
    const up = (S && S.up) || {};
    // 바깥 하늘·길 건너 건물
    x.fillStyle = vg(x, 0, 480, [[0, '#7cc6f0'], [1, '#d6f0fb']]); x.fillRect(L.STREET, 0, W - L.STREET, 480);
    for (let i = 0; i < 5; i++) { const bx = L.STREET + i * 70 - 10, bh = 180 + rnd(i * 4.1) * 160; x.fillStyle = ['#b9c4d6', '#a9b6cc', '#c6cedc'][i % 3]; x.fillRect(bx, 480 - bh, 64, bh); x.fillStyle = 'rgba(255,255,255,.45)'; for (let wy = 480 - bh + 14; wy < 470; wy += 24) for (let wx = bx + 8; wx < bx + 56; wx += 16) x.fillRect(wx, wy, 8, 12); }
    // 바깥 가게 외벽(문 위 간판 자리)
    x.fillStyle = vg(x, 0, 480, [[0, '#8a2f2a'], [1, '#6a2420']]); x.fillRect(L.DOORX - 12, 0, 60, 480);
    // 인도·차도
    x.fillStyle = vg(x, 480, 660, [[0, '#c8c3ba'], [1, '#b2ada4']]); x.fillRect(L.STREET, 480, W - L.STREET, 180);
    x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let px = L.STREET; px < W; px += 64) { x.beginPath(); x.moveTo(px, 480); x.lineTo(px - 30, 660); x.stroke(); }
    x.fillStyle = '#8e8a82'; x.fillRect(L.STREET, 656, W - L.STREET, 10);
    x.fillStyle = vg(x, 666, 720, [[0, '#4a4a50'], [1, '#34343a']]); x.fillRect(L.STREET, 666, W - L.STREET, 54);
    x.fillStyle = '#e8e0c8'; for (let px = L.STREET + 20; px < W; px += 90) x.fillRect(px, 700, 44, 5);
    // 가게 안 벽: 윗벽 벽돌(따뜻한 주황) + 아래 나무 판
    x.fillStyle = vg(x, 0, L.WALL, [[0, '#f3b27a'], [1, '#e89a60']]); x.fillRect(0, 0, L.DOORX, L.WALL);
    x.fillStyle = 'rgba(160,70,30,.16)';
    for (let y = 8, r = 0; y < 330; y += 26, r++) for (let bx = (r % 2) * 40 - 40; bx < L.DOORX; bx += 80) { rr(x, bx + 3, y, 74, 22, 4); x.fill(); }
    x.fillStyle = vg(x, 330, L.WALL, [[0, '#8a5230'], [1, '#6e3e22']]); x.fillRect(0, 330, L.DOORX, L.WALL - 330);
    x.fillStyle = 'rgba(255,255,255,.08)'; for (let px = 0; px < L.DOORX; px += 36) x.fillRect(px, 334, 3, L.WALL - 336);
    x.fillStyle = '#5a3018'; x.fillRect(0, 326, L.DOORX, 8);
    // 천장 등 줄
    x.strokeStyle = '#3a2418'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 26); x.quadraticCurveTo(L.DOORX / 2, 60, L.DOORX, 26); x.stroke();
    for (let i = 1; i < 8; i++) { const px = i * L.DOORX / 8, py = 26 + 34 * Math.sin(i / 8 * Math.PI) * .95; ell(x, px, py + 8, 7, 9); x.fillStyle = ['#ffd24a', '#ff6a5a', '#7fd6ff', '#8ef06a'][i % 4]; x.fill(); }
    // 메뉴판(칠판) — 열린 메뉴만 그림
    x.fillStyle = '#5a3a22'; rr(x, 660, 76, 250, 200, 10); x.fill(); x.fillStyle = '#23322a'; rr(x, 670, 86, 230, 180, 6); x.fill();
    x.fillStyle = '#f4efe0'; x.font = "26px 'Ria', sans-serif"; x.textAlign = 'center'; x.fillText('MENU', 785, 116);
    const menu = ['cheese', 'pepperoni', 'margherita', 'hawaiian', 'supreme', 'truffle'].slice(0, 2 + (up.menu || 0)).concat(up.kimchi ? ['kimchi'] : []);
    const n = menu.length, cols = n > 6 ? 4 : 3, pr = n > 6 ? 20 : 24, gap = n > 6 ? 54 : 72;
    menu.forEach((k, i) => { pizza(x, (n > 6 ? 704 : 712) + (i % cols) * gap, 162 + Math.floor(i / cols) * 66, pr, k, 0); });
    // 벽 액자: 로고
    x.fillStyle = '#4a2a16'; rr(x, 380, 70, 170, 170, 14); x.fill(); x.fillStyle = vg(x, 80, 230, [[0, '#3a1450'], [1, '#1a0a2e']]); rr(x, 390, 80, 150, 150, 8); x.fill();
    logo(x, 465, 148, 52);
    // 선반(화덕 위쪽 벽) — 화분·소스병
    x.fillStyle = '#5a3018'; x.fillRect(40, 196, 290, 8);
    x.fillStyle = '#3c7a3a'; ell(x, 80, 150, 30, 26); x.fill(); x.fillStyle = '#58a04e'; ell(x, 68, 138, 20, 18); x.fill(); ell(x, 96, 142, 18, 16); x.fill();
    x.fillStyle = '#b8583a'; rr(x, 60, 160, 40, 36, 6); x.fill();
    for (let i = 0; i < 4; i++) { x.fillStyle = ['#2f9a3a', '#c8342a', '#e8c040', '#2f6ad8'][i]; rr(x, 150 + i * 24, 162, 16, 34, 4); x.fill(); x.fillStyle = '#fff'; x.fillRect(153 + i * 24, 176, 10, 8); }
    x.fillStyle = '#e8e0d0'; for (let i = 0; i < 3; i++) { ell(x, 268 + i * 14, 184 - i * 2, 12, 12); x.fill(); x.strokeStyle = '#b8a890'; x.lineWidth = 2; x.stroke(); }
    // 인테리어(DECOR) 단계마다 벽 장식
    const dec = up.decor || 0;
    if (dec >= 1) { x.fillStyle = '#2f9a3a'; x.fillRect(0, 312, L.DOORX / 3, 8); x.fillStyle = '#fff'; x.fillRect(L.DOORX / 3, 312, L.DOORX / 3, 8); x.fillStyle = '#d8382a'; x.fillRect(L.DOORX * 2 / 3, 312, L.DOORX / 3 + 2, 8); }
    if (dec >= 2) { for (let i = 0; i < 3; i++) { x.fillStyle = '#4a2a16'; rr(x, 580 + i * 26, 250 + (i % 2) * 8, 20, 26, 3); x.fill(); x.fillStyle = ['#ffd24a', '#7fd6ff', '#ff8ab8'][i]; x.fillRect(583 + i * 26, 253 + (i % 2) * 8, 14, 20); } }
    if (dec >= 3) { x.fillStyle = '#ffe9a8'; for (let i = 0; i < 12; i++) { ell(x, 20 + i * 76, 44 + 10 * Math.sin(i), 4, 4); x.fill(); } }
    if (dec >= 4) { x.fillStyle = '#c8a040'; rr(x, 250, 90, 100, 130, 8); x.fill(); x.fillStyle = '#fff8e0'; rr(x, 258, 98, 84, 114, 5); x.fill(); pizza(x, 300, 155, 30, 'truffle', 0); }
    if (dec >= 5) { x.fillStyle = 'rgba(255,215,90,.18)'; x.fillRect(0, 0, L.DOORX, L.WALL); }
    // 바닥: 체크무늬 + 원근
    x.save(); x.beginPath(); x.rect(0, L.FLOOR, L.DOORX, H - L.FLOOR); x.clip();
    for (let r = 0; r < 6; r++) {
      const y0 = L.FLOOR + r * 40, y1 = y0 + 40;
      for (let c = 0; c < 26; c++) { x.fillStyle = (r + c) % 2 ? '#f4efe6' : '#2c2a30'; x.fillRect(c * 38 - (r % 2) * 0, y0, 38, 40); }
    }
    x.fillStyle = vg(x, L.FLOOR, H, [[0, 'rgba(0,0,0,.28)'], [.3, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.1)']]); x.fillRect(0, L.FLOOR, L.DOORX, H - L.FLOOR);
    x.restore();
    x.fillStyle = '#4a2a16'; x.fillRect(0, L.WALL, L.DOORX, 12);  // 걸레받이
    // 문틀(가게 안과 바깥 사이)
    x.fillStyle = '#3a1e10'; x.fillRect(L.DOORX - 6, 0, 18, H);
    x.fillStyle = 'rgba(180,220,240,.18)'; x.fillRect(L.DOORX + 12, 180, 4, 470);
  }

  /* 바깥 간판(불빛이 깜빡여서 매 프레임 그림) */
  function neon(x, t, EN) {
    const cx = 1118, cy = 118, on = .85 + .15 * Math.sin(t * 3) * (Math.sin(t * 17) > .96 ? 0 : 1);
    x.save();
    x.fillStyle = '#1a0a2e'; rr(x, 990, 44, 270, 150, 20); x.fill();
    x.strokeStyle = '#0b0b0a'; x.lineWidth = 8; x.stroke();
    const g = x.createLinearGradient(990, 0, 1260, 0); g.addColorStop(0, '#2a1040'); g.addColorStop(.5, '#4a1a66'); g.addColorStop(1, '#2a1040');
    x.fillStyle = g; rr(x, 996, 50, 258, 138, 16); x.fill();
    x.shadowColor = '#ffcf4a'; x.shadowBlur = 24 * on; logo(x, 1050, 112, 40); x.shadowBlur = 0;
    x.fillStyle = 'rgba(255,243,196,' + on + ')'; x.shadowColor = '#ffb52e'; x.shadowBlur = 16 * on;
    x.textAlign = 'left';                                  // 간판 = 게임 제목(사장님 9/28 "간판도 뉴월드피자로")
    if (EN) { x.font = "900 29px 'TitleF', 'Arial Black', sans-serif"; x.fillText('NEW', 1100, 100); x.fillText('WORLD', 1100, 132);
      x.font = "900 20px 'TitleF', sans-serif"; x.fillStyle = 'rgba(255,214,90,' + on + ')'; x.fillText('P I Z Z A', 1101, 162); }
    else { x.font = "900 40px 'TitleF', sans-serif"; x.fillText('뉴월드', 1098, 118);
      x.font = "900 30px 'TitleF', sans-serif"; x.fillStyle = 'rgba(255,214,90,' + on + ')'; x.fillText('피 자', 1104, 160); }
    x.restore();
    x.fillStyle = '#0b0b0a'; x.fillRect(1000, 194, 6, 14); x.fillRect(1244, 194, 6, 14);
  }

  /* 계산대 앞면(사람보다 뒤, 화덕보다 앞) */
  function counter(x) {
    const C = L.COUNTER;
    x.fillStyle = vg(x, C.top, C.bot, [[0, '#c0703a'], [1, '#8a4a22']]); rr(x, C.x0, C.top + 10, C.x1 - C.x0, C.bot - C.top - 10, 6); x.fill();
    x.fillStyle = 'rgba(0,0,0,.14)'; for (let px = C.x0 + 30; px < C.x1; px += 60) x.fillRect(px, C.top + 22, 3, C.bot - C.top - 26);
    x.fillStyle = vg(x, C.top, C.top + 14, [[0, '#f4efe6'], [1, '#d8d0c2']]); rr(x, C.x0 - 8, C.top, C.x1 - C.x0 + 16, 14, 5); x.fill();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(C.x0, C.bot - 6, C.x1 - C.x0, 6);
  }

  /* 금전등록기(동전 통) */
  function register(x, n, cap, t, full) {
    const cx = L.REG.x, b = L.REG.y;
    x.save();
    x.fillStyle = '#3a3a44'; rr(x, cx - 46, b - 40, 92, 40, 6); x.fill();
    x.fillStyle = vg(x, b - 86, b - 40, [[0, '#6a6a78'], [1, '#44444e']]); x.beginPath(); x.moveTo(cx - 40, b - 40); x.lineTo(cx - 30, b - 84); x.lineTo(cx + 30, b - 84); x.lineTo(cx + 40, b - 40); x.closePath(); x.fill();
    x.fillStyle = '#9cf0a8'; rr(x, cx - 22, b - 78, 44, 16, 3); x.fill();
    x.fillStyle = '#123a1a'; x.font = "12px 'Ria', sans-serif"; x.textAlign = 'center'; x.fillText(n + '/' + cap, cx, b - 66);
    x.fillStyle = '#d8d8e0'; for (let i = 0; i < 6; i++) { rr(x, cx - 24 + (i % 3) * 17, b - 56 + Math.floor(i / 3) * 8, 13, 6, 2); x.fill(); }
    x.restore();
    const shown = Math.min(12, Math.ceil(n / Math.max(1, cap) * 12));
    if (n > 0) coins(x, cx - 70, b - 6, shown, t);
    if (full) { const k = .5 + .5 * Math.sin(t * 8); x.strokeStyle = 'rgba(255,60,60,' + (.4 + .6 * k) + ')'; x.lineWidth = 4; rr(x, cx - 120, b - 96, 176, 100, 16); x.stroke(); }
  }

  window.ART = { W, H, L, rr, ell, vg, hg, pizza, box, coins, oven, limo, logo, background, neon, counter, register, PIZZAS };
})();
