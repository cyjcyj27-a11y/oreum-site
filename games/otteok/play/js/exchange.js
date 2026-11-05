// 엔딩: 나스닥 증권거래소. 트럭 길 오른쪽 큰 바닥판 위에 둥근 LED 시세판·거래석(모니터·의자)·종 치는 단상.
// 사람 없이 물건만. 종을 치면 시세판의 otteok.com 주가가 치솟고 색종이·떡이 쏟아진다.
(function () {
  const E = (window.EXCH = {});
  const V3 = THREE.Vector3, PI = Math.PI;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  const M = (c, o) => TOY.mat(c, o);
  const add = (g, m, x, y, z, p) => TOY.mesh(g, m, x, y, z, p);
  const X0 = 22.5, X1 = 49.5, Z0 = -3.3, Z1 = 3.6;
  E.CX = (X0 + X1) / 2;
  let root = null, board = null, boardTex = [], ticker = null, minis = [], miniTex = null, live = 0, liveT = 0, T = 0, drawT = 0;
  const PRICE0 = 52000, PRICE1 = 696800;

  function glow(c, k) { const m = new THREE.MeshBasicMaterial({ color: c }); if (k != null) { m.transparent = true; m.opacity = k; } return m; }

  // ---------- 시세판 그림 ----------
  const BW = 2048, BH = 512;
  function drawBoard() {
    const g = board.getContext('2d');
    g.fillStyle = '#0d1a3a'; g.fillRect(0, 0, BW, BH);
    // 잔 격자
    g.strokeStyle = 'rgba(80,140,255,.12)'; g.lineWidth = 1;
    for (let x = 0; x < BW; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, BH); g.stroke(); }
    for (let y = 0; y < BH; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(BW, y); g.stroke(); }
    const k = live ? Math.min(1, liveT / 2.4) : 0, e = 1 - Math.pow(1 - k, 3);
    // 왼쪽: 회사 이름·주가
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = '#ff8fb1'; g.font = "92px 'Ttl',sans-serif"; g.fillText('otteok.com', 60, 110);
    g.fillStyle = '#9fb6e6'; g.font = "40px 'Ttl',sans-serif"; g.fillText('OTTEOK  ·  NASDAQ', 64, 190);
    const price = PRICE0 + (PRICE1 - PRICE0) * e, pct = ((price / PRICE0 - 1) * 100);
    g.fillStyle = live ? '#5dffa8' : '#ffffff'; g.font = "120px 'Ttl',sans-serif"; g.fillText('₩' + Math.round(price).toLocaleString('en-US'), 60, 320);
    g.font = "64px 'Ttl',sans-serif"; g.fillStyle = live ? '#5dffa8' : '#9fb6e6';
    g.fillText(live ? '▲ ' + pct.toFixed(0) + '%' : L('공모가', 'IPO PRICE'), 66, 430);
    // 가운데: 봉 그래프(종을 치면 치솟음)
    const gx = 760, gw = 760, gy0 = 470, gh = 400;
    g.strokeStyle = 'rgba(160,190,255,.35)'; g.lineWidth = 2; g.strokeRect(gx, gy0 - gh, gw, gh);
    const n = 30;
    let v = 0.18;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const target = 0.18 + Math.sin(i * 1.7) * 0.03 + (t > 0.62 ? Math.pow((t - 0.62) / 0.38, 1.6) * 0.78 * e : 0);
      const o = v, c = target; v = c;
      const hi = Math.max(o, c) + 0.02, lo = Math.min(o, c) - 0.02;
      const x = gx + 14 + t * (gw - 40), up = c >= o;
      g.strokeStyle = g.fillStyle = up ? '#5dffa8' : '#ff6f8a';
      g.beginPath(); g.moveTo(x + 7, gy0 - hi * gh); g.lineTo(x + 7, gy0 - lo * gh); g.stroke();
      g.fillRect(x, gy0 - Math.max(o, c) * gh, 14, Math.max(4, Math.abs(c - o) * gh));
    }
    // 오른쪽: 떡 종목 시세
    const rows = [['SONGPYEON', 88], ['INJEOLMI', 61], ['GARAETTEOK', 47], ['KKULDDUK', 39], ['MUJIGAE', 72], ['BAEKSEOLGI', 25]];
    g.font = "bold 46px 'Ui',sans-serif";
    rows.forEach(([nm, p], i) => {
      const y = 80 + i * 70;
      g.fillStyle = '#cfe0ff'; g.textAlign = 'left'; g.fillText(nm, 1580, y);
      g.fillStyle = '#5dffa8'; g.textAlign = 'right'; g.fillText('▲' + Math.round(p * (0.4 + 0.6 * e)) + '%', 2010, y);
    });
    // 시가총액
    if (live) {
      g.textAlign = 'center'; g.fillStyle = '#ffe27a'; g.font = "56px 'Ttl',sans-serif";
      g.fillText(L('시가총액 ', 'MARKET CAP ') + UI.fmt(BIZ.value() * (0.6 + 0.4 * e)), 1140, 110);
    }
    boardTex.forEach((t) => (t.needsUpdate = true));
  }
  function drawTicker(g, w, h) {
    g.fillStyle = '#081129'; g.fillRect(0, 0, w, h);
    g.font = "40px 'Ttl',sans-serif"; g.textBaseline = 'middle';
    // 띠 하나에 다 들어가는 만큼만, 간격을 고르게(한 바퀴 돌아도 글자가 안 잘린다)
    const items = ['otteok.com ▲1,240%', 'SONGPYEON ▲88%', 'INJEOLMI ▲61%', 'MUJIGAE ▲72%', 'GARAETTEOK ▲47%'];
    const gap = (w - items.reduce((a, s) => a + g.measureText(s).width, 0)) / items.length;
    let x = gap / 2;
    items.forEach((s, i) => { g.fillStyle = i === 0 ? '#ff8fb1' : '#5dffa8'; g.fillText(s, x, h / 2 + 2); x += g.measureText(s).width + gap; });
  }
  function drawMini(g, w, h) {
    g.fillStyle = '#0d1a3a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#5dffa8'; g.lineWidth = 4; g.beginPath();
    for (let i = 0; i <= 20; i++) { const x = 8 + i * (w - 16) / 20, y = h * 0.75 - i * h * 0.025 - Math.sin(i * 1.3) * h * 0.08; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.fillStyle = '#ff8fb1'; g.font = "22px 'Ttl',sans-serif"; g.fillText('otteok.com', 8, 24);
  }

  function build() {
    if (root) return;
    root = new THREE.Group(); RND.scene.add(root);
    // 바닥: 짙은 남색 광택 + 하늘색 격자
    const fl = TOY.tex(TOY.canvas(256, 256, (g, w, h) => { g.fillStyle = '#3d5596'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,210,255,.5)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }), [10, 3]);
    add(TOY.rbox(X1 - X0, 3.2, Z1 - Z0, 0.25), M('#ffffff', { map: fl, rough: 0.3, gloss: 0.9, emis: 0.15 }), E.CX, -1.6, (Z0 + Z1) / 2, root);
    const edge = add(TOY.rbox(X1 - X0 - 0.4, 0.06, 0.12, 0.03), glow('#58c8ff'), E.CX, 0.03, Z1 - 0.15, root); edge.castShadow = false;
    // 뒷벽: 짙은 남색 + 별빛 점
    const wt = TOY.tex(TOY.canvas(256, 256, (g, w, h) => { g.fillStyle = '#34478a'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(190,220,255,.5)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % w, (i * 53) % h, 2, 2); }), [8, 3]);
    const wall = add(new THREE.PlaneGeometry(X1 - X0 + 1, 14), M('#ffffff', { map: wt, rough: 0.9, emis: 0.2 }), E.CX, 3.8, -3.48, root); wall.castShadow = false;
    // 둥근 LED 시세판(조각 9장)
    board = TOY.canvas(BW, BH, () => {});
    const N = 9, R = 15, A = 0.9, pw = 2 * R * Math.sin(A / (N - 1) / 2) * 1.02, ph = pw * N * BH / BW;
    const base = new THREE.CanvasTexture(board); base.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < N; i++) {
      const a = -A / 2 + (A * i) / (N - 1);
      const t = base.clone(); t.repeat.set(1 / N, 1); t.offset.set(i / N, 0); t.needsUpdate = true; boardTex.push(t);
      const p = add(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: t }), E.CX + Math.sin(a) * R, 3.5, -2.9 + (1 - Math.cos(a)) * R * 0.9, root);
      // 위에서 내려다보는 카메라 쪽으로 뒤로 젖힘
      p.rotation.order = 'YXZ'; p.rotation.y = -a; p.rotation.x = -0.42; p.castShadow = false;
      const fr = add(TOY.rbox(pw + 0.04, 0.12, 0.2, 0.04), M('#2b3a6a', { gloss: 0.5 }), 0, -ph / 2 - 0.06, -0.08, p); fr.castShadow = false;
    }
    // 위 띠: 흐르는 시세
    const tc = TOY.canvas(2048, 64, drawTicker);
    ticker = TOY.tex(tc, [2, 1]);
    const tb = add(new THREE.PlaneGeometry(X1 - X0 - 2, 0.55), new THREE.MeshBasicMaterial({ map: ticker }), E.CX, 7.0, -3.38, root); tb.castShadow = false;
    // NASDAQ 글자 판
    const sg = add(TOY.rbox(9, 1.5, 0.25, 0.3), M('#0f1b40', { gloss: 0.6 }), E.CX, 8.4, -3.35, root);
    const st = add(new THREE.PlaneGeometry(8.6, 1.3), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('NASDAQ', { w: 1024, h: 160, size: 130, color: '#ffffff' }) }), 0, 0, 0.14, sg); st.castShadow = false;
    // 거래석: 둥근 줄 셋(책상·모니터 둘·의자)
    miniTex = TOY.tex(TOY.canvas(256, 160, drawMini));
    const desk = M('#e9eef8', { gloss: 0.5 }), dark = M('#2b3448', { gloss: 0.4 }), chair = M('#4a5a8a', { gloss: 0.3 });
    [[-1.6, 7.5, 7], [0.0, 8.5, 9], [1.5, 9.5, 11]].forEach(([z, rr, n]) => {
      for (let i = 0; i < n; i++) {
        const a = -0.55 + (1.1 * i) / (n - 1);
        const g = new THREE.Group(); g.position.set(E.CX + Math.sin(a) * rr, 0, z + (1 - Math.cos(a)) * rr * 0.35 - 0.6); g.rotation.y = -a * 0.8; root.add(g);
        add(TOY.rbox(1.5, 0.12, 0.7, 0.05), desk, 0, 0.75, 0, g);
        add(TOY.rbox(1.3, 0.7, 0.08, 0.04), desk, 0, 0.4, -0.3, g);
        [-0.36, 0.36].forEach((x) => {
          add(TOY.rbox(0.62, 0.4, 0.05, 0.03), dark, x, 1.12, -0.18, g);
          const sc = add(new THREE.PlaneGeometry(0.56, 0.34), new THREE.MeshBasicMaterial({ map: miniTex }), x, 1.12, -0.152, g); sc.castShadow = false; minis.push(sc);
          add(TOY.rbox(0.06, 0.25, 0.06, 0.02), dark, x, 0.88, -0.2, g);
        });
        const c = new THREE.Group(); c.position.set(0, 0, 0.6); g.add(c);
        add(TOY.rcyl(0.06, 0.45, 0.02), dark, 0, 0.22, 0, c);
        add(TOY.rbox(0.5, 0.1, 0.5, 0.06), chair, 0, 0.48, 0, c);
        add(TOY.rbox(0.5, 0.5, 0.08, 0.06), chair, 0, 0.75, 0.24, c);
      }
    });
    // 단상: 종 치는 자리(앞 가운데)
    const pod = new THREE.Group(); pod.position.set(E.CX, 0, 2.55); root.add(pod); E.pod = pod;
    add(TOY.rbox(5.2, 0.55, 1.7, 0.15), M('#f4f7ff', { gloss: 0.7 }), 0, 0.28, 0, pod);
    const pl = add(new THREE.PlaneGeometry(4.6, 0.42), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('otteok.com', { w: 1024, h: 110, size: 86, color: '#ff6f9c' }) }), 0, 0.28, 0.86, pod); pl.castShadow = false;
    add(TOY.rbox(5.3, 0.06, 1.8, 0.03), glow('#58c8ff'), 0, 0.58, 0, pod).castShadow = false;
    // 양옆 색종이 대포
    E.cannons = [-11.5, 11.5].map((dx) => { const c = new THREE.Group(); c.position.set(E.CX + dx, 0, 2.6); root.add(c); add(TOY.rcyl(0.4, 0.4, 0.1), dark, 0, 0.2, 0, c); const b = add(TOY.rcyl(0.25, 1.1, 0.08), M('#ff8fb1', { gloss: 0.6 }), 0, 0.85, 0, c); b.rotation.z = dx < 0 ? -0.4 : 0.4; return c; });
    drawBoard();
  }

  E.step = function (dt) {
    if (!root) return;
    T += dt;
    ticker.offset.x += dt * (live ? 0.12 : 0.04);
    if (live) liveT += dt;
    drawT += dt;
    if (live && liveT < 3.2 && drawT > 0.05) { drawT = 0; drawBoard(); }
  };

  // 엔딩 시작: 카메라를 거래소로 → 종 → 치면 시세 폭등 → done(결과 카드)
  E.open = function (done) {
    build(); live = 0; liveT = 0; drawBoard();
    G.lock = false;
    const h = RND.portrait ? 16 : 13;
    RND.focus(E.CX, -0.6, h, 2.0);
    RND.band = 0.4; // 흐림 띠를 넓혀 시세판까지 또렷하게
    UI.banner('NASDAQ', L('상장일 아침', 'IPO Day'));
    S('fanfare');
    FX.wait(1.6, () => {
      const bell = RND.bell(E.pod.position.clone().add(new V3(0, 0.08, 0))); // 종 걸이 기둥 밑이 단상 윗면(0.58)에 닿게
      G.point(bell, 2.0);
      G.station = {
        down() {
          G.station = null; G.point(null);
          live = 1; liveT = 0;
          RND.ringBell(() => {
            UI.banner(L('나스닥 상장!', 'LISTED ON NASDAQ!'), 'otteok.com');
            setTimeout(() => done && done(), 2600);
          });
          // 색종이 대포
          E.cannons.forEach((c, i) => {
            for (let k = 0; k < 6; k++) FX.wait(k * 0.25, () => FX.burst(c.position.clone().add(new V3(i ? -0.4 : 0.4, 1.4, 0)), { n: 26, kind: 'confetti', color: ['#ff8fb1', '#ffe27a', '#9fd2ff', '#b8e8a2', '#cdb4ff'], size: 0.24, speed: 6, up: 5, g: 3, life: 2.6, drag: 1, spin: 8 }));
          });
          S('fanfare');
        },
      };
    });
  };
})();
