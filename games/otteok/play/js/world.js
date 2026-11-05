// 가맹 지도(5장 전국, 6장부터 세계): 도시 핀을 눌러 돈을 내면 가맹점이 생기고 하루 끝마다 로열티가 들어온다.
// 땅 모양은 경위도 점을 이어 부드럽게 그린 파스텔 지도(정밀 지도 아님).
(function () {
  const W = (window.WORLD = {});
  const $ = (id) => document.getElementById(id);
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  const fmt = (n) => UI.fmt(n);

  // [경도, 위도]
  const LAND = [
    // 유라시아(한반도 포함)
    [[-9, 38], [-9, 43], [-2, 46], [-4, 48], [1, 50], [4, 52], [8, 54], [9, 57], [6, 62], [13, 66], [20, 70], [30, 71], [42, 67], [55, 69], [68, 72], [80, 73], [100, 76], [115, 73], [130, 71], [150, 71], [170, 67], [178, 64], [165, 60], [158, 53], [150, 59], [140, 59], [137, 54], [140, 48], [134, 43], [130.7, 42.4],
      [130.3, 42.3], [129.7, 41.7], [129.8, 41.0], [129.3, 40.7], [128.5, 40.2], [127.6, 39.8], [127.5, 39.4], [127.9, 39.0], [128.35, 38.6], [128.6, 38.3], [129.1, 37.7], [129.4, 37.1], [129.55, 36.5], [129.45, 35.95], [129.35, 35.5], [129.05, 35.1], [128.6, 34.85], [128.1, 34.85], [127.6, 34.7], [127.1, 34.5], [126.5, 34.35], [126.3, 34.7], [126.4, 35.1], [126.6, 35.6], [126.5, 36.1], [126.15, 36.6], [126.4, 36.8], [126.6, 37.1], [126.6, 37.5], [126.1, 37.75], [125.3, 37.7], [124.7, 38.1], [125.1, 38.8], [125.4, 39.4], [124.9, 39.6], [124.3, 40.0], [123.2, 39.7], [122.2, 40.5], [121.2, 38.8], [121.8, 39.6], [121, 40.8], [118, 39], [119.5, 37], [120.5, 36], [119.5, 34.5], [121.8, 31], [121.5, 28], [119.5, 25.5], [116, 22.8], [110.5, 21], [108.5, 21.5], [106.5, 17], [109, 12.5], [106, 9], [104.5, 10.5], [100.5, 13.5], [100, 9], [103.5, 1.4], [100.5, 3.5], [98, 8], [98.5, 16], [94, 17], [91.5, 22.5], [87, 21.5], [80, 15], [77.5, 8], [73, 17], [72.5, 21], [67, 24.5], [61, 25], [57, 25.5], [56, 27], [51, 28], [48, 30], [48.5, 28], [51, 24.5], [56, 24], [59.5, 22.5], [55, 17], [52, 15.5], [43.5, 12.7], [39.5, 20], [35, 28], [34.5, 31.5], [35.8, 36], [30, 36.3], [26.5, 37.5], [26, 40], [29, 41], [23.5, 38], [22, 37], [20, 40], [19, 42], [13.5, 45.5], [12.5, 44], [16, 41], [18.5, 40], [15.5, 38], [12, 41], [10, 44], [7.5, 43.7], [3, 43], [3, 41.5], [0, 39], [-0.5, 37.5], [-2, 36.7], [-5.5, 36]],
    // 아프리카
    [[-17, 21], [-16, 28], [-10, 30], [-6, 35.8], [3, 37], [10, 37], [11, 33], [20, 31], [25, 32], [32, 31.5], [34.5, 28], [37, 22], [39, 15], [43.5, 12], [51, 11.5], [47, 4], [40, -3], [39.5, -10], [40.5, -15.5], [35, -22], [33, -26], [30, -31], [25, -34], [18.5, -34.5], [17, -29], [12, -17], [13, -11], [9, -1], [9.5, 4], [4, 6.3], [-5, 5], [-11, 7], [-17, 14.5]],
    // 북아메리카
    [[-168, 65], [-162, 70], [-140, 70], [-125, 70], [-110, 73], [-95, 72], [-82, 73], [-75, 68], [-64, 60], [-56, 52], [-60, 46], [-66, 44], [-70, 42], [-75, 38], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 27], [-97, 22], [-92, 18], [-87, 21], [-88, 16], [-83, 10], [-79, 9], [-81, 8], [-86, 12], [-92, 15], [-105, 20], [-110, 24], [-112, 30], [-117, 32], [-121, 35], [-124, 40], [-124, 46], [-127, 50], [-133, 55], [-140, 59], [-150, 60], [-158, 57], [-165, 60]],
    // 그린란드
    [[-50, 60], [-42, 60], [-22, 70], [-18, 77], [-35, 83], [-60, 82], [-70, 78], [-55, 72]],
    // 남아메리카
    [[-80, 9], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-38, -14], [-40, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -42], [-66, -50], [-70, -54], [-74, -50], [-74, -42], [-72, -30], [-71, -18], [-76, -14], [-81, -6], [-80, 1], [-78, 6]],
    // 호주
    [[114, -22], [114, -34], [118, -35], [123, -34], [129, -31.5], [131, -31.5], [135, -34.5], [138, -35], [140, -38], [146, -39], [150, -37.5], [153, -31], [153, -25], [146, -19], [142.5, -10.7], [141, -16], [136, -12], [131, -11.3], [127, -14], [122, -17]],
    // 일본
    [[129.8, 32.7], [130.3, 31.2], [131.4, 31.4], [131.9, 33.3], [133, 34], [135, 33.5], [137, 34.6], [140, 35], [141, 38], [142, 41], [141, 42.5], [144, 43], [145.5, 44], [142, 45.5], [140, 42], [139.8, 40], [139, 37.5], [136.5, 37], [133, 35.5], [131, 34.4], [130.2, 33.9], [129.6, 33.2]],
    [[129.2, 34.1], [129.45, 34.3], [129.4, 34.7], [129.25, 34.6]], // 쓰시마
    [[-5.5, 50], [1.5, 51], [1.7, 52.8], [-0.2, 54], [-2, 55.8], [-1.8, 57.6], [-3.3, 58.6], [-5.2, 58.5], [-6, 56.5], [-4.8, 54.8], [-3, 53.3], [-4.7, 52]], // 영국
    [[-10, 51.6], [-6, 52], [-6, 55], [-8, 55.2], [-10, 54]], // 아일랜드
    [[120.2, 22.5], [121, 22], [121.9, 25], [121.4, 25.3], [120.1, 23.5]], // 타이완
    [[95.3, 5.5], [98, 4], [104, -2.5], [106, -6], [104.5, -5.8], [101, -2.5], [96, 2.5]], // 수마트라
    [[109, 1.5], [110.5, -3], [116, -4], [118.5, 1], [117, 6.8], [115, 5]], // 보르네오
    [[105.5, -6.8], [114.5, -7.8], [114, -8.7], [106, -7.6]], // 자바
    [[131, -1], [141, -2.7], [150, -10.5], [143, -9], [138, -8.3], [132.5, -3.5]], // 뉴기니
    [[120, 18.5], [122, 18.5], [122.5, 14], [125.5, 9.5], [126, 6.5], [122, 7], [123.8, 10.8], [120.8, 14.5]], // 필리핀
    [[172.7, -34.4], [178.5, -37.7], [176.9, -39.7], [174.8, -41.3], [172, -40.5]], // 뉴질랜드
    [[172.5, -41], [174, -41.7], [171, -44.5], [167, -46.3], [168.5, -44.5]],
    [[44, -25], [47, -25], [50.5, -15.5], [49.5, -12], [44.3, -16]], // 마다가스카르
    [[79.8, 8], [81.8, 7.5], [80.2, 9.8]], // 스리랑카
    [[-24, 65.5], [-13.5, 65], [-18.5, 63.4], [-22.5, 64]], // 아이슬란드
    [[-85, 22], [-74, 20], [-77, 21.5], [-82, 23.2]], // 쿠바
    [[126.15, 33.3], [126.6, 33.22], [126.95, 33.45], [126.6, 33.56], [126.3, 33.48]], // 제주
  ];
  // 보이는 범위 [경도0, 경도1, 위도0, 위도1]
  // 이름표가 겹치는 도시는 옆으로(l 왼쪽, r 오른쪽)
  const SIDE = { world: { kr: 'l', tokyo: 'r', osaka: 'r', shanghai: 'l', hongkong: 'r', bangkok: 'l', singapore: 'r', london: 'l', paris: 'r', toronto: 'l', newyork: 'r' },
    korea: { seoul: 'r', incheon: 'l', daejeon: 'r', gwangju: 'l', daegu: 'r', busan: 'r', jeju: 'r' } };
  const VIEW = { korea: [123.6, 131.4, 32.6, 39.2], world: [-170, 180, -50, 76] };
  let mode = 'world', box = { w: 1, h: 1, ox: 0, oy: 0, s: 1 }, sel = null;

  function fit(cw, ch) {
    const v = VIEW[mode], lw = v[1] - v[0], lh = v[3] - v[2];
    // 위도는 살짝 늘려(메르카토르 흉내) 한반도가 납작해 보이지 않게
    const k = mode === 'korea' ? 1.22 : 1.12;
    // 폰 세로에서 세계 지도는 높이에 맞춰 크게 띄우고 좌우로 끌어 본다
    const wide = mode === 'world' && cw / ch < 1.3;
    const s = wide ? (ch / (lh * k)) * 0.92 : Math.min(cw / lw, ch / (lh * k));
    const ss = s * zoom, mw = lw * ss, mh = lh * k * ss;
    // 처음 열면 폰 세로는 한국 쪽을 가운데로
    if (panX == null) panX = wide ? cw / 2 - (127 - v[0]) * ss - (cw - mw) / 2 : 0;
    // 지도가 칸보다 크면 끝이 칸 안으로 들어오지 않게, 작으면 가운데
    const lim = (a, full, size) => (full > size ? Math.max((size - full) / 2, Math.min((full - size) / 2, a)) : 0);
    panX = lim(panX, mw, cw); panY = lim(panY, mh, ch);
    box = { s: ss, k, ox: (cw - mw) / 2 + panX, oy: (ch - mh) / 2 + panY, v, cw, ch, lw, lh };
  }
  let zoom = 1, panX = null, panY = 0, drag = null, moved = false;
  const ZMAX = 8, touches = new Map();
  let grip = null;
  // (mx, my) 자리를 그대로 두고 확대·축소
  function zoomAt(mx, my, f) {
    const z = Math.max(1, Math.min(ZMAX, zoom * f)), r = z / zoom;
    if (r === 1) return;
    const b = box, now = performance.now(), s2 = b.s * r;
    // 굴리는 동안은 처음 커서 밑 자리를 붙잡는다(지도가 칸보다 작을 때 가운데로 밀린 만큼 되돌아오게)
    if (!grip || now - grip.t > 300 || Math.abs(mx - grip.mx) + Math.abs(my - grip.my) > 4) grip = { mx, my, u: (mx - b.ox) / b.s, v: (my - b.oy) / b.s };
    grip.t = now;
    const nx = mx - grip.u * s2, ny = my - grip.v * s2;
    panX = nx - (b.cw - b.lw * s2) / 2; panY = ny - (b.ch - b.lh * b.k * s2) / 2; zoom = z;
    $('wPop').hidden = true; sel = null; draw(); pins();
  }
  const P = (lon, lat) => [box.ox + (lon - box.v[0]) * box.s, box.oy + (box.v[3] - lat) * box.k * box.s];

  function draw() {
    const cv = $('wCv'), r = $('wMap').getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.max(2, r.width * dpr); cv.height = Math.max(2, r.height * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit(r.width, r.height);
    const gr = g.createLinearGradient(0, 0, 0, r.height); gr.addColorStop(0, '#d6efff'); gr.addColorStop(1, '#bfe2fb'); g.fillStyle = gr; g.fillRect(0, 0, r.width, r.height);
    // 물결 점
    g.fillStyle = 'rgba(255,255,255,.45)';
    for (let y = 18; y < r.height; y += 34) for (let x = (y / 34 % 2) * 22; x < r.width; x += 44) { g.beginPath(); g.ellipse(x, y, 7, 2.2, 0, 0, 7); g.fill(); }
    // 땅: 그림자 → 흰 테 → 연두
    const shape = (pts) => {
      const q = pts.map((p) => P(p[0], p[1]));
      g.beginPath();
      for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (i === 0) g.moveTo(m[0], m[1]); else g.quadraticCurveTo(a[0], a[1], m[0], m[1]); }
      const a = q[0], b = q[1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      g.closePath();
    };
    g.save(); g.translate(0, 4); g.fillStyle = 'rgba(80,120,160,.18)'; LAND.forEach((p) => { shape(p); g.fill(); }); g.restore();
    g.lineJoin = 'round';
    LAND.forEach((p) => { shape(p); g.lineWidth = mode === 'korea' ? 7 : 4; g.strokeStyle = '#ffffff'; g.stroke(); g.fillStyle = '#c9ecb6'; g.fill(); });
    // 본사(서울)에서 산 도시로 점선
    const hq = P(127, 37.6);
    g.setLineDash([6, 6]); g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,111,156,.75)';
    DATA.CITY.forEach((c) => {
      if (!BIZ.cities()[c.k] || c.k === 'seoul') return;
      const p = P(c.lon, c.lat); if (!inView(c)) return;
      const mx = (hq[0] + p[0]) / 2, my = Math.min(hq[1], p[1]) - Math.abs(hq[0] - p[0]) * 0.18 - 20;
      g.beginPath(); g.moveTo(hq[0], hq[1]); g.quadraticCurveTo(mx, my, p[0], p[1]); g.stroke();
    });
    g.setLineDash([]);
  }
  const inView = (c) => { const v = VIEW[mode]; return c.lon >= v[0] && c.lon <= v[1] && c.lat >= v[2] && c.lat <= v[3]; };

  function pins(dropK) {
    const box1 = $('wPins'); box1.innerHTML = '';
    const ch = G.save.ch;
    let list = DATA.CITY.filter((c) => (mode === 'korea' ? c.ch === 5 : c.ch === 6));
    if (mode === 'world') list = [{ k: 'kr', ko: '한국', en: 'Korea', lon: 127.5, lat: 36.5, home: 1 }].concat(list);
    list.forEach((c) => {
      const own = c.home || BIZ.cities()[c.k], lock = !c.home && c.ch > ch;
      const side = SIDE[mode][c.k] || '';
      const b = document.createElement('button'); b.className = 'pin' + (own ? ' own' : '') + (lock ? ' lock' : '') + (dropK === c.k ? ' drop' : '') + (side ? ' ' + side : '');
      const p = P(c.lon, c.lat); b.style.left = p[0] + 'px'; b.style.top = p[1] + 'px';
      b.innerHTML = '<i></i><span></span>';
      const sp = b.querySelector('span'); sp.textContent = L(c.ko, c.en);
      const sm = document.createElement('small');
      sm.textContent = c.home ? fmt(BIZ.stores() - storesAbroad()) + L('곳', '') : own ? fmt(c.stores) + L('곳', '') : fmt(c.price);
      sp.appendChild(sm);
      if (dropK === c.k) { const rg = document.createElement('div'); rg.className = 'ring'; b.appendChild(rg); }
      if (!own && !lock) b.onclick = (e) => { e.stopPropagation(); if (moved) return; pop(c, p); };
      box1.appendChild(b);
    });
  }
  const storesAbroad = () => DATA.CITY.reduce((a, c) => a + (c.ch === 6 && BIZ.cities()[c.k] ? c.stores : 0), 0);

  function pop(c, p) {
    sel = c; S('click');
    const el = $('wPop'); el.hidden = false;
    const r = $('wMap').getBoundingClientRect();
    el.style.left = Math.max(100, Math.min(r.width - 100, p[0])) + 'px'; el.style.top = Math.max(150, p[1] - 30) + 'px';
    $('wpN').textContent = L(c.ko, c.en);
    $('wpD').textContent = L('가맹점 ' + fmt(c.stores) + '곳 · 로열티 하루 +' + fmt(c.roy), fmt(c.stores) + ' stores · +' + fmt(c.roy) + '/day');
    const btn = $('wpBuy'); btn.innerHTML = '<i class="coinI"></i>'; btn.appendChild(document.createTextNode(fmt(c.price)));
    btn.classList.toggle('poor', G.save.coins < c.price);
  }
  $('wpBuy').onclick = (e) => {
    e.stopPropagation();
    if (!sel) return;
    if (!BIZ.buyCity(sel.k)) { S('fail'); return; }
    const c = sel, k = sel.k; sel = null; $('wPop').hidden = true;
    // 사는 순간 첫 로열티가 들어온다
    const s = G.save; s.coins += c.roy; s.total += c.roy; s.chSales = (s.chSales || 0) + c.roy; G.store();
    S('fanfare'); [250, 380, 510, 640].forEach((t) => setTimeout(() => S('coin'), t));
    stats(); draw(); pins(k); UI.coin(); UI.bizPop();
    const p = P(c.lon, c.lat), g = document.createElement('div'); g.className = 'wgain'; g.textContent = '+' + fmt(c.roy);
    g.style.left = p[0] + 'px'; g.style.top = p[1] + 'px'; $('wMap').appendChild(g);
    setTimeout(() => g.remove(), 1500);
    const wc = $('wCoin').parentElement; wc.classList.remove('flash'); void wc.offsetWidth; wc.classList.add('flash');
  };
  const local = (x, y) => { const r = $('wMap').getBoundingClientRect(); return [x - r.left, y - r.top]; };
  const gap = () => { const a = [...touches.values()]; return a.length < 2 ? null : { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; };
  // 마우스 휠로 확대·축소
  $('wMap').addEventListener('wheel', (e) => {
    e.preventDefault();
    const m = local(e.clientX, e.clientY);
    zoomAt(m[0], m[1], Math.exp(-e.deltaY * 0.0016));
  }, { passive: false });
  $('wMap').addEventListener('pointerdown', (e) => {
    if (e.target.closest('#wPop')) return;
    moved = false;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag = { x: e.clientX, y: e.clientY, moved: false, pinch: touches.size > 1 ? gap() : null };
    if (e.target.closest('.pin')) return;
    $('wPop').hidden = true; sel = null;
  });
  addEventListener('pointermove', (e) => {
    if (!drag || $('world').hidden) return;
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // 두 손가락: 벌리면 확대
    if (touches.size > 1) {
      const g = gap();
      if (drag.pinch && drag.pinch.d > 0) {
        moved = true;
        const m = local(g.x, g.y);
        panX += g.x - drag.pinch.x; panY += g.y - drag.pinch.y;
        fit(box.cw, box.ch);
        zoomAt(m[0], m[1], g.d / drag.pinch.d);
        draw(); pins();
      }
      drag.pinch = g;
      return;
    }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; moved = true; }
    if (!drag.moved) return;
    panX += dx; panY += dy; drag.x = e.clientX; drag.y = e.clientY;
    $('wPop').hidden = true; sel = null; draw(); pins();
  });
  const release = (e) => {
    touches.delete(e.pointerId);
    const a = [...touches.values()];
    // 두 손가락에서 하나를 떼면 남은 손가락으로 이어서 끌기
    drag = a.length ? { x: a[0].x, y: a[0].y, moved: true, pinch: null } : null;
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  function stats() {
    $('wVal').textContent = fmt(BIZ.value());
    $('wRoy').textContent = '+' + fmt(BIZ.roy());
    $('wStores').textContent = fmt(BIZ.stores());
    $('wCoin').textContent = fmt(G.save.coins);
  }

  W.open = function () {
    mode = G.save.ch >= 6 ? 'world' : 'korea'; zoom = 1; panX = null; panY = 0; touches.clear(); drag = null;
    $('wT').textContent = mode === 'world' ? L('세계 가맹 지도', 'World Franchise Map') : L('전국 가맹 지도', 'Franchise Map');
    $('wPop').hidden = true; sel = null;
    G.paused = true; G.lock = true;
    $('world').hidden = false;
    requestAnimationFrame(() => { stats(); draw(); pins(); }); // 숫자가 먼저: 윗줄 높이가 바뀌면 지도 칸도 바뀐다
  };
  W.close = function () {
    $('world').hidden = true;
    // 상점에서 열었으면 상점으로 돌아가고(계속 멈춤), 아니면 영업을 잇는다
    const sh = !$('shop').hidden;
    G.paused = sh; G.lock = sh;
    if (sh) UI.shop();
    UI.dayEndBtn();
  };
  $('bWorldX').onclick = () => { S('click'); W.close(); };
  addEventListener('resize', () => { if (!$('world').hidden) { draw(); pins(); } });
})();
