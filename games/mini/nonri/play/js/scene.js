// 그림자 마을 장면: 시간대 하늘 + 세 겹 실루엣 + 솟아오르는 건물 + 엔딩 창문 불빛
(function () {
  const IMG = {};
  for (const k in window.SPR) { const im = new Image(); im.src = SPR[k]; IMG[k] = im; }
  const ZW = 1000, X0 = 600, GY = 1000; // 구역 폭, 첫 구역 가운데, 세상 높이
  const LAND = ['bridge', 'mill', 'clock', 'library', 'station', 'theater', 'school', 'lighthouse', 'observatory', 'castle'];
  const LAND_H = [190, 340, 400, 270, 230, 330, 320, 400, 320, 430];
  const HT = { house1: 150, house2: 165, house3: 175, bakery: 140, well: 105, fence: 62, tree: 190, pine: 200, willow: 185, lamp: 165, bench: 56, cart: 66, granny: 118, kite: 150, bike: 108, cat: 52, dog: 62, birds: 120 };
  const MIDP = ['house1', 'tree', 'house2', 'pine', 'bakery', 'willow', 'house3', 'well', 'lamp', 'fence'];
  const FRONTP = ['cat', 'granny', 'bench', 'kite', 'dog', 'cart', 'bike', 'birds', 'lamp', 'pine'];
  const SLOT = [[-190, 'm'], [100, 'f'], [250, 'm'], [-50, 'f'], [400, 'm'], [330, 'f'], [550, 'm'], [200, 'f'], [-340, 'm'], [470, 'f']];
  function rnd(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
  const PLAN = [];
  for (let z = 0; z < 10; z++) {
    const r = rnd(z + 3), cx = X0 + z * ZW, sl = [];
    const mi = Math.floor(r() * 10), fi = Math.floor(r() * 10);
    for (let i = 0; i < 10; i++) {
      const [dx, ly] = SLOT[i]; const k = ly === 'm' ? MIDP[(mi + i) % 10] : FRONTP[(fi + i) % 10];
      sl.push({ k, x: cx + dx + (r() - 0.5) * 40, ly, flip: r() < 0.5, h: HT[k] * (0.92 + r() * 0.16) * (ly === 'f' ? 1.12 : 1) });
    }
    PLAN.push({ cx, slots: sl });
  }
  const WORLD_W = X0 * 2 + ZW * 9;
  // 땅 높이(세상 좌표)
  const gMid = x => 790 + 22 * Math.sin(x / 430) + 12 * Math.sin(x / 170 + 2);
  const gFront = x => 905 + 26 * Math.sin(x / 300 + 1) + 10 * Math.sin(x / 120);
  const gBack = x => 700 + 40 * Math.sin(x / 650 + 0.5) + 18 * Math.sin(x / 230);
  // 하늘 시간표: p 0(늦은 오후) → 1(밤)
  const SKY = [
    [0.00, '#7e8fc9', '#e9b98a', '#ffe2b0', 0.30],
    [0.35, '#6a5aa0', '#f09a6a', '#ffcf8a', 0.52],
    [0.55, '#4a3a7e', '#e2705a', '#ffb060', 0.72],
    [0.75, '#2a2358', '#8a4870', '#e07c5c', 0.95],
    [0.90, '#141638', '#3a2c5e', '#7a4a6a', 1.15],
    [1.00, '#0a0c22', '#1c1d48', '#3a2f62', 1.3]
  ];
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  function css(c, a) { return a == null ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function skyAt(p) {
    p = Math.max(0, Math.min(1, p));
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (p <= b[0]) { const t = (p - a[0]) / (b[0] - a[0]); return { top: mix(hex(a[1]), hex(b[1]), t), mid: mix(hex(a[2]), hex(b[2]), t), bot: mix(hex(a[3]), hex(b[3]), t), sun: a[4] + (b[4] - a[4]) * t }; }
    }
    const l = SKY[SKY.length - 1]; return { top: hex(l[1]), mid: hex(l[2]), bot: hex(l[3]), sun: l[4] };
  }
  const INK = [17, 16, 24];
  let cv, cx2, W = 0, H = 0, dpr = 1, layer, lctx, paper;
  const stars = [], clouds = [];
  const st = { p: 0, pT: 0, camX: X0, camT: X0, zoom: 1, zoomT: 1, built: [], land: [], parts: [], shake: 0, pose: 'g_look', poseT: 0, lights: [], lightOn: false };
  for (let z = 0; z < 10; z++) { st.built.push([]); st.land.push(null); }
  function makePaper() {
    paper = document.createElement('canvas'); paper.width = paper.height = 256;
    const c = paper.getContext('2d'), d = c.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 200 + Math.random() * 55; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    c.putImageData(d, 0, 0);
    c.globalAlpha = 0.25; c.strokeStyle = '#9a9a9a';
    for (let i = 0; i < 60; i++) { c.beginPath(); const x = Math.random() * 256, y = Math.random() * 256; c.moveTo(x, y); c.lineTo(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 8); c.stroke(); }
  }
  function init(canvas) {
    cv = canvas; cx2 = cv.getContext('2d');
    layer = document.createElement('canvas'); lctx = layer.getContext('2d');
    makePaper();
    const r = rnd(7);
    for (let i = 0; i < 140; i++) stars.push({ x: r(), y: r() * 0.62, s: 0.6 + r() * 1.6, tw: r() * 6.28 });
    for (let i = 0; i < 6; i++) clouds.push({ x: r() * 1.6, y: 0.1 + r() * 0.3, w: 0.18 + r() * 0.16, sp: 0.004 + r() * 0.006 });
    resize();
  }
  function resize() {
    if (!cv) return;
    const b = cv.getBoundingClientRect(); dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = Math.max(1, Math.round(b.width)); H = Math.max(1, Math.round(b.height));
    cv.width = W * dpr; cv.height = H * dpr; layer.width = cv.width; layer.height = cv.height;
  }
  // 세상 → 화면
  function view() {
    const s = H / GY * st.zoom, half = W / 2 / s;
    let cx = Math.max(half - 200, Math.min(WORLD_W - half + 200, st.camX));
    if (W / s > WORLD_W + 400) cx = WORLD_W / 2;
    return { s, ox: W / 2 - cx * s, oy: H - GY * s };
  }
  // 색 입힌 실루엣 사본(색은 하늘 따라 천천히 바뀌니 몇 단계로 묶어 저장)
  const TC = new Map();
  function tint(k, col) {
    const key = k + '|' + col.join(',');
    let t = TC.get(key);
    if (!t) {
      if (TC.size > 160) { for (const kk of TC.keys()) if (!kk.endsWith('|' + col.join(','))) TC.delete(kk); }
      const im = IMG[k]; t = document.createElement('canvas'); t.width = im.width; t.height = im.height;
      const g = t.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = css(col); g.fillRect(0, 0, t.width, t.height);
      TC.set(key, t);
    }
    return t;
  }
  const q8 = c => c.map(v => Math.round(v / 6) * 6);
  let sky = null, skyAt0 = -1, skyP = -9, skyW = 0;
  function easeBack(t) { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function drawSprite(c, k, x, gy, h, flip, rise, v, clipY, col) {
    const im0 = IMG[k]; if (!im0 || !im0.width || rise <= 0) return;
    const im = col ? tint(k, col) : im0;
    const w = h * im0.width / im0.height, off = (1 - rise) * (h + 20);
    const sx = x * v.s + v.ox, sy = (gy + off) * v.s + v.oy, sw = w * v.s, sh = h * v.s;
    if (sx + sw < -20 || sx - sw > W + 20) return;
    c.save();
    if (clipY != null) { c.beginPath(); c.rect(sx - sw, -9999, sw * 2, clipY * v.s + v.oy + 9999); c.clip(); }
    c.translate(sx, sy); if (flip) c.scale(-1, 1);
    c.drawImage(im, -sw / 2, -sh, sw, sh);
    c.restore();
  }
  function hills(c, v, fn, step) {
    c.beginPath();
    const x0 = -v.ox / v.s - 50, x1 = (W - v.ox) / v.s + 50, s2 = Math.max(step, (x1 - x0) / 400);
    c.moveTo(x0 * v.s + v.ox, H + 5);
    for (let x = x0; x <= x1; x += s2) c.lineTo(x * v.s + v.ox, fn(x) * v.s + v.oy);
    c.lineTo(x1 * v.s + v.ox, H + 5); c.closePath(); c.fill();
  }
  function riseOf(b, now) {
    if (b.out) return 1 - Math.min(1, (now - b.out) / 500);
    return easeBack(Math.min(1, Math.max(0, (now - b.t) / 900)));
  }
  function drawLights(c, v, now, ly) {
    for (const L of st.lights) {
      if (L.ly !== ly || now < L.t) continue;
      const a = Math.min(1, (now - L.t) / 500), im = IMG['w_' + L.k]; if (!im || !im.width) continue;
      const w = L.h * im.width / im.height, sx = L.x * v.s + v.ox, sy = L.gy * v.s + v.oy, sw = w * v.s, sh = L.h * v.s;
      c.save(); c.globalAlpha = a * (0.88 + 0.12 * Math.sin(now / 300 + L.x));
      c.shadowColor = 'rgba(255,200,110,0.9)'; c.shadowBlur = 14;
      c.translate(sx, sy); if (L.flip) c.scale(-1, 1); c.drawImage(im, -sw / 2, -sh, sw, sh);
      c.restore();
    }
  }
  function drawGirl(c, now) {
    const k = st.pose, im = IMG[k]; if (!im || !im.width) return;
    const gh = Math.min(H * 0.34, W * 0.5), iw = gh * im.width / im.height;
    const x = Math.max(gh * 0.36, W * 0.1), y = H - H * 0.03, age = (now - st.poseT) / 1000;
    const dy = k === 'g_joy' ? -Math.max(0, Math.sin(Math.min(1, age * 2.2) * Math.PI)) * gh * 0.12 : Math.sin(now / 900) * gh * 0.006;
    c.drawImage(im, x - iw / 2, y - gh + dy, iw, gh);
  }
  function dust(x, gy, n, col) {
    const now = performance.now();
    for (let i = 0; i < n; i++) st.parts.push({ x: x + (Math.random() - 0.5) * 120, y: gy - Math.random() * 10, vx: (Math.random() - 0.5) * 160, vy: -40 - Math.random() * 80, r: 6 + Math.random() * 10, rot: Math.random() * 3, life: 600 + Math.random() * 500, t: now, c: col || INK });
  }
  function drawSky(c, sk, v, horizon, now) {
    const g = c.createLinearGradient(0, 0, 0, Math.max(10, horizon));
    g.addColorStop(0, css(sk.top)); g.addColorStop(0.62, css(sk.mid)); g.addColorStop(1, css(sk.bot));
    c.fillStyle = g; c.fillRect(-20, -20, W + 40, H + 40);
    const dark = Math.max(0, Math.min(1, (st.p - 0.62) / 0.3));
    if (dark > 0) {
      for (const s of stars) {
        const a = dark * (0.55 + 0.45 * Math.sin(now / 700 + s.tw));
        c.fillStyle = `rgba(255,244,214,${a})`; c.beginPath(); c.arc(s.x * W, s.y * horizon, s.s * Math.max(0.7, Math.min(1.6, v.s * 2)), 0, 7); c.fill();
      }
    }
    const sunY = horizon - (1 - sk.sun) * horizon * 0.85 + 30 * v.s;
    const sunX = W * 0.72, sunR = Math.max(22, Math.min(H * 0.1, 95 * v.s));
    if (sk.sun < 1.25) {
      const sg = c.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 3.2);
      sg.addColorStop(0, 'rgba(255,214,140,0.55)'); sg.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = sg; c.fillRect(sunX - sunR * 3.3, sunY - sunR * 3.3, sunR * 6.6, sunR * 6.6);
      c.fillStyle = css(mix([255, 228, 160], [255, 150, 90], Math.min(1, st.p * 1.4)));
      c.beginPath(); c.arc(sunX, sunY, sunR, 0, 7); c.fill();
    }
    if (dark > 0.3) { // 초승달
      c.globalAlpha = (dark - 0.3) / 0.7; c.fillStyle = '#fff1cf';
      const mx = W * 0.2, my = horizon * 0.22, mr = Math.max(12, Math.min(H * 0.06, 46 * v.s));
      c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
      c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(mx + mr * 0.45, my - mr * 0.15, mr * 0.9, 0, 7); c.fill();
    }
    const cc = mix(sk.mid, [255, 240, 220], 0.35 * (1 - dark));
    for (const cl of clouds) {
      const x = ((cl.x + now / 1000 * cl.sp) % 1.8 - 0.3) * W, y = cl.y * horizon, w = cl.w * W;
      c.fillStyle = css(cc, 0.55 - dark * 0.35);
      c.beginPath(); c.ellipse(x, y, w * 0.5, w * 0.11, 0, 0, 7); c.ellipse(x - w * 0.15, y - w * 0.07, w * 0.2, w * 0.11, 0, 0, 7); c.ellipse(x + w * 0.12, y - w * 0.09, w * 0.24, w * 0.13, 0, 0, 7); c.fill();
    }
    c.globalAlpha = 0.07; c.globalCompositeOperation = 'multiply';
    c.fillStyle = c.createPattern(paper, 'repeat'); c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  function render(now) {
    if (!cv) return;
    const c = cx2, sk = skyAt(st.p), v = view();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    let shx = 0, shy = 0;
    if (st.shake > 0) { shx = (Math.random() - 0.5) * st.shake; shy = (Math.random() - 0.5) * st.shake; }
    c.save(); c.translate(shx, shy);
    const horizon = 760 * v.s + v.oy;
    if (!sky) sky = document.createElement('canvas');
    if (sky.width !== cv.width || sky.height !== cv.height) { sky.width = cv.width; sky.height = cv.height; skyAt0 = -1; }
    if (now - skyAt0 > 450 || Math.abs(st.p - skyP) > 0.006 || Math.abs(skyW - horizon) > 0.5) {
      skyAt0 = now; skyP = st.p; skyW = horizon;
      const sc = sky.getContext('2d'); sc.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSky(sc, sk, v, horizon, now);
    }
    c.drawImage(sky, 0, 0, W, H);
    const dark = Math.max(0, Math.min(1, (st.p - 0.62) / 0.3));
    // 뒤 겹: 먼 언덕 + 먼 마을
    const skq = skyAt(Math.round(st.p * 20) / 20), backC = mix(INK, skq.mid, 0.55), midC = mix(INK, skq.bot, 0.22);
    c.fillStyle = css(mix(INK, sk.mid, 0.7)); hills(c, { s: v.s, ox: v.ox * 0.3 + W * 0.35, oy: v.oy }, x => gBack(x) - 40, 30);
    const vb = { s: v.s, ox: v.ox * 0.5 + W * 0.25, oy: v.oy };
    const bq = q8(backC), mq = q8(midC);
    for (let i = 0; i < 40; i++) { const k = ['house1', 'house2', 'pine', 'tree', 'house3', 'clock'][i % 6]; const x = i * 300 + 120; drawSprite(c, k, x, gBack(x) + 8, (HT[k] || 260) * 0.55, i % 2, 1, vb, null, bq); }
    c.fillStyle = css(backC); hills(c, vb, gBack, 30);
    for (let z = 0; z < 10; z++) {
      const P = PLAN[z], L = st.land[z];
      if (L) drawSprite(c, LAND[z], P.cx, gMid(P.cx) + 6, LAND_H[z], false, L.out ? 1 - Math.min(1, (now - L.out) / 600) : easeBack(Math.min(1, Math.max(0, (now - L.t) / 1300))), v, null, mq);
      st.built[z].forEach((b, i) => { const sl = P.slots[i]; if (sl.ly === 'm') drawSprite(c, sl.k, sl.x, gMid(sl.x) + 6, sl.h, sl.flip, riseOf(b, now), v, null, mq); });
    }
    c.fillStyle = css(midC); hills(c, v, gMid, 20);
    if (st.lightOn) drawLights(c, v, now, 'm');
    // 앞 겹
    for (let z = 0; z < 10; z++) {
      const P = PLAN[z];
      st.built[z].forEach((b, i) => { const sl = P.slots[i]; if (sl.ly === 'f') drawSprite(c, sl.k, sl.x, gFront(sl.x) + 4, sl.h, sl.flip, riseOf(b, now), v, gFront(sl.x) + 6); });
    }
    c.fillStyle = css(INK); hills(c, v, gFront, 16);
    if (st.lightOn) drawLights(c, v, now, 'f');
    for (let i = st.parts.length - 1; i >= 0; i--) {
      const q = st.parts[i], a = (now - q.t) / q.life;
      if (a >= 1) { st.parts.splice(i, 1); continue; }
      if (a < 0) continue;
      const x = (q.x + q.vx * a) * v.s + v.ox, y = (q.y + q.vy * a + 120 * a * a) * v.s + v.oy;
      c.fillStyle = css(q.c, 1 - a); c.beginPath(); c.ellipse(x, y, q.r * v.s * (1 + a), q.r * v.s * 0.7 * (1 + a), q.rot, 0, 7); c.fill();
    }
    if (!st.noGirl) drawGirl(c, now);
    c.restore();
  }
  let last = 0, rafOn = false;
  function tick(now) {
    now = now || performance.now();
    const dt = Math.min(0.05, Math.max(0, (now - (last || now)) / 1000)); last = now;
    st.p += (st.pT - st.p) * Math.min(1, dt * 1.2);
    st.camX += (st.camT - st.camX) * Math.min(1, dt * 2.4);
    st.zoom += (st.zoomT - st.zoom) * Math.min(1, dt * 1.6);
    st.shake = Math.max(0, st.shake - dt * 40);
    render(now);
  }
  // 움직이는 게 없으면(문제 읽는 동안) 0.15초에 한 번만 그린다
  let lastDraw = 0;
  function busy(now) {
    return Math.abs(st.pT - st.p) > 0.0015 || Math.abs(st.camT - st.camX) > 0.6 || Math.abs(st.zoomT - st.zoom) > 0.002 ||
      st.shake > 0 || st.parts.length > 0 || now < (st.until || 0);
  }
  function loop(t) { if (busy(t) || t - lastDraw > 150) { lastDraw = t; tick(t); } else last = t; requestAnimationFrame(loop); }
  const hold = ms => { st.until = Math.max(st.until || 0, performance.now() + ms); };
  const SCN = {
    init, resize, tick, LAND, PLAN,
    start() { if (!rafOn) { rafOn = true; requestAnimationFrame(loop); } },
    setTime(p, instant) { st.pT = p; if (instant) st.p = p; },
    focus(z, instant) { st.zoomT = 1; st.camT = PLAN[Math.max(0, Math.min(9, z))].cx + 110; if (instant) { st.camX = st.camT; st.zoom = 1; } },
    overview(instant) { st.zoomT = 0.6; st.camT = PLAN[0].cx; if (instant) { st.zoom = st.zoomT; st.camX = PLAN[8].cx; st.camT = st.camX; } },
    pose(k) { if (st.pose !== 'g_' + k) { st.pose = 'g_' + k; st.poseT = performance.now(); hold(900); } },
    count(z) { return st.built[z].length; },
    addProp(z, instant) {
      const i = st.built[z].length; if (i >= 10) return;
      st.built[z].push({ t: instant ? -1e6 : performance.now() }); if (!instant) hold(1500);
      if (!instant) { const sl = PLAN[z].slots[i], gy = sl.ly === 'm' ? gMid(sl.x) : gFront(sl.x); setTimeout(() => { dust(sl.x, gy, 10, sl.ly === 'm' ? mix(INK, skyAt(st.p).bot, 0.22) : INK); st.shake = 4; }, 480); }
    },
    addLand(z, instant) {
      st.land[z] = { t: instant ? -1e6 : performance.now() }; if (!instant) hold(2000);
      if (!instant) { const x = PLAN[z].cx; setTimeout(() => { dust(x, gMid(x), 26, mix(INK, skyAt(st.p).bot, 0.22)); st.shake = 12; }, 850); }
    },
    clearZone(z, instant) {
      if (instant) { st.built[z] = []; st.land[z] = null; return; }
      const now = performance.now(); hold(900); st.built[z].forEach(b => b.out = now); if (st.land[z]) st.land[z].out = now;
      setTimeout(() => { st.built[z] = []; st.land[z] = null; }, 650);
    },
    reset() { for (let z = 0; z < 10; z++) { st.built[z] = []; st.land[z] = null; } st.lights = []; st.lightOn = false; },
    lightUp(onEach, inst) { // 창문 불을 왼쪽부터 차례로 켠다. 다 켜지는 데 걸리는 ms 를 돌려준다
      st.lights = []; st.lightOn = true; const now = performance.now(); let d = 600;
      const order = [];
      for (let z = 0; z < 10; z++) {
        if (st.land[z] && IMG['w_' + LAND[z]]) order.push({ k: LAND[z], x: PLAN[z].cx, gy: gMid(PLAN[z].cx) + 6, h: LAND_H[z], ly: 'm', flip: false });
        st.built[z].forEach((b, i) => { const sl = PLAN[z].slots[i]; if (IMG['w_' + sl.k]) order.push({ k: sl.k, x: sl.x, gy: sl.ly === 'm' ? gMid(sl.x) + 6 : gFront(sl.x) + 4, h: sl.h, ly: sl.ly, flip: sl.flip }); });
      }
      order.sort((a, b) => a.x - b.x); if (!inst) hold(9000 + 7000);
      const step = Math.max(90, 7000 / Math.max(1, order.length));
      order.forEach(o => { o.t = inst ? 0 : now + d; st.lights.push(o); if (!inst) setTimeout(() => { st.camT = o.x + 150; if (onEach) onEach(); }, d); d += step; });
      return d;
    },
    lightsInstant() { SCN.lightUp(null, true); },
    shake(n) { st.shake = n; hold(300); },
    snapshot(w, h, p, girl) { // 결과 카드용: 마을 전체를 따로 그림
      const keep = { cv, cx2, W, H, dpr, layer, lctx, zoom: st.zoom, camX: st.camX, p: st.p, ng: st.noGirl, pose: st.pose };
      const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
      const l2 = document.createElement('canvas'); l2.width = w; l2.height = h;
      cv = c2; cx2 = c2.getContext('2d'); W = w; H = h; dpr = 1; layer = l2; lctx = l2.getContext('2d');
      if (p != null) st.p = p;
      st.zoom = 0.62; st.camX = PLAN[8].cx - 80; st.noGirl = !girl; if (girl) st.pose = 'g_' + girl;
      const sh = st.shake; st.shake = 0;
      render(performance.now() + 99999);
      st.shake = sh;
      cv = keep.cv; cx2 = keep.cx2; W = keep.W; H = keep.H; dpr = keep.dpr; layer = keep.layer; lctx = keep.lctx; st.zoom = keep.zoom; st.camX = keep.camX; st.p = keep.p; st.noGirl = keep.ng; st.pose = keep.pose;
      return c2;
    },
    ready() { for (const k in IMG) if (!IMG[k].complete) return false; return true; },
    IMG, _st: st
  };
  window.SCN = SCN;
})();
