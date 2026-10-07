// 숨은그림찾기: 진행·화면·입력
(function () {
  const $ = (id) => document.getElementById(id);
  const EN = /[?&]lang=en/i.test(location.search);
  const T2 = (ko, en) => (EN ? en : ko);
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'Hidden Objects';
    $('h1').textContent = 'HIDDEN OBJECTS';
    $('h1').classList.add('en');
    $('start').firstChild.textContent = 'START';
    $('toDex').firstChild.textContent = 'COLLECTION';
    $('endingDex').firstChild.textContent = 'COLLECTION';
    $('dexTitle').textContent = 'COLLECTION';
    $('rotTitle').textContent = 'HIDDEN OBJECTS';
    $('rotBtn').firstChild.textContent = 'ROTATE';
  }
  const ALL_SCENES = [
    { id: 'attic', ko: '다락방', en: 'Attic' },
    { id: 'shop', ko: '문방구', en: 'Stationery Shop' },
    { id: 'grandma', ko: '할머니 댁', en: "Grandma's House" },
    { id: 'garage', ko: '차고', en: 'Garage' },
    { id: 'library', ko: '도서관', en: 'Library' },
    { id: 'greenhouse', ko: '온실', en: 'Greenhouse' },
  ];
  const SCENES = ALL_SCENES.filter((s) => SCN[s.id]);
  const PER = 5;
  const TOTAL = SCENES.length * PER;
  const KEY = 'hiddenpic.prog';
  const DEX = ITEMS.list;

  // ── 저장
  let prog = { open: 1, last: 1, stars: {}, dex: {}, plays: {}, buff: null, cats: 0, ended: 0 };
  try { Object.assign(prog, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const saveProg = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) {} };

  // ── 판 정보: 방마다 5판, 4·5번째는 밤
  function info(s) {
    const si = Math.floor((s - 1) / PER) % SCENES.length;
    const k = (s - 1) % PER, round = Math.floor((s - 1) / PER);
    const n = Math.min(10, 6 + Math.floor(round * 0.7) + (k >= 3 ? 1 : 0));
    const lv = Math.min(5, round * 0.85 + k / 2.5);
    const time = 70 + n * 14;
    return { s, si, scene: SCENES[si].id, night: k >= 3, n, lv, time, seed: s * 7919 + 13 + (prog.plays[s] || 0) * 977 };
  }

  // ── 상태
  const st = { mode: 'title', stage: 1, items: [], cat: null, left: 0, total: 1, hints: 2, guard: 0, miss: 0, over: true, paused: false, combo: 0, lastFind: 0 };
  const view = { z: 1, cx: 0.5, cy: 0.5 };
  const pic = $('pic'), cv = $('view'), panel = $('panel'), listEl = $('list');
  let main = document.createElement('canvas');
  let fx = [];   // 반짝이·표시
  let dirty = true;
  window.__hp = { st, view, info, prog, S };

  // ── 배치
  let PW = 0, PH = 0, PX = 0, PY = 0, port = false, DPR = 1;
  function layout() {
    const W = innerWidth, H = innerHeight;
    port = H > W * 1.05;
    document.documentElement.classList.toggle('port', port);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const pill = document.getElementById('oreumHome');   // 오름 알약 옆에 STAGE 라벨(폰 가로)
    if (pill) document.documentElement.style.setProperty('--pillw', Math.round(pill.getBoundingClientRect().right + 2) + 'px');
    // 그림은 크게, 찾을 물건 목록은 작게(10/7 사장님 "보통 그림이 크고 찾을물건이 작지않냐")
    if (!port) {
      const pw = Math.round(H < 480 ? Math.max(200, Math.min(232, W - H * S.ASPECT)) : Math.max(170, Math.min(260, W - H * S.ASPECT)));
      document.documentElement.style.setProperty('--pw', pw + 'px');
      PX = pw; PY = 0; PW = W - pw; PH = H;
    } else {
      const ph = 96;
      document.documentElement.style.setProperty('--ph', ph + 'px');
      const L = portList(W);
      const lh = L.rows * L.s * 1.08 + (L.rows - 1) * 6 + 18;
      PX = 0; PY = ph; PW = W; PH = Math.max(160, H - ph - lh);
    }
    pic.style.left = PX + 'px'; pic.style.top = PY + 'px'; pic.style.width = PW + 'px'; pic.style.height = PH + 'px';
    cv.width = Math.round(PW * DPR); cv.height = Math.round(PH * DPR);
    layoutList();
    clampView();
    dirty = true;
  }
  // 세로 화면 목록: 한 줄에 다 들어가면 한 줄, 아니면 두 줄. 칸은 52px 까지
  function portList(W) {
    const n = Math.max(1, st.items.length || 8);
    const s1 = (W - 24 - (n - 1) * 6) / n;
    if (s1 >= 40) return { s: Math.floor(Math.min(52, s1)), c: n, rows: 1 };
    const c = Math.ceil(n / 2);
    return { s: Math.floor(Math.min(52, (W - 24 - (c - 1) * 6) / c)), c, rows: 2 };
  }
  function layoutList() {
    const n = st.items.length;
    if (!n) return;
    let best = { s: 0, c: 2 };
    if (!port) {
      const cap = innerHeight < 480 ? 52 : 74;   // PC 도 물건 사진은 74px 까지
      const r = listEl.getBoundingClientRect();
      const aw = r.width - 12, ah = innerHeight - r.top - 10;
      for (let c = 1; c <= 4; c++) {
        const rows = Math.ceil(n / c);
        const sz = Math.min(cap, (aw - (c - 1) * 6) / c, (ah - (rows - 1) * 6) / rows / 1.24);
        if (sz > best.s + 0.5) best = { s: sz, c };
      }
    } else best = portList(innerWidth);
    best.s = Math.floor(best.s);
    listEl.style.gridTemplateColumns = 'repeat(' + best.c + ',' + best.s + 'px)';
    listEl.style.gap = '6px';
    listEl.classList.toggle('small', best.s < 70);
  }
  addEventListener('resize', () => { layout(); if (st.mode === 'title') drawTitle(); });

  // ── 그림 보기(확대·이동)
  function base() { return Math.min(PW, PH * S.ASPECT); }
  function clampView() {
    view.z = Math.max(1, Math.min(4, view.z));
    const w = base() * view.z, h = w / S.ASPECT;
    const hx = PW / 2 / w, hy = PH / 2 / h;
    view.cx = w <= PW ? 0.5 : Math.max(hx, Math.min(1 - hx, view.cx));
    view.cy = h <= PH ? 0.5 : Math.max(hy, Math.min(1 - hy, view.cy));
  }
  function toImg(x, y) {   // pic 안 css 좌표 → 그림 0~1
    const w = base() * view.z, h = w / S.ASPECT;
    return { u: view.cx + (x - PW / 2) / w, v: view.cy + (y - PH / 2) / h };
  }
  function toScr(u, v) {
    const w = base() * view.z, h = w / S.ASPECT;
    return { x: PW / 2 + (u - view.cx) * w, y: PH / 2 + (v - view.cy) * h };
  }
  function zoomAt(x, y, k) {
    const a = toImg(x, y);
    const z0 = view.z;
    view.z = Math.max(1, Math.min(4, view.z * k));
    const w = base() * view.z, h = w / S.ASPECT;
    view.cx = a.u - (x - PW / 2) / w;
    view.cy = a.v - (y - PH / 2) / h;
    clampView();
    if (Math.abs(view.z - z0) > 0.01) AU.play('zoom');
    dirty = true;
  }

  // ── 그리기
  const IMGBG = () => (S.bg ? S.bg[1] : '#2a2230');
  function draw(now) {
    const g = cv.getContext('2d');
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.fillStyle = '#2a2230';
    g.fillRect(0, 0, PW, PH);
    if (!main.width) return;
    const w = base() * view.z, h = w / S.ASPECT;
    const x0 = PW / 2 - view.cx * w, y0 = PH / 2 - view.cy * h;
    // 그림 바깥 여백은 그림 배경색으로
    const gr = g.createLinearGradient(0, 0, 0, PH);
    gr.addColorStop(0, S.bg ? S.bg[0] : '#333'); gr.addColorStop(1, IMGBG());
    g.fillStyle = gr; g.fillRect(0, 0, PW, PH);
    g.imageSmoothingQuality = 'high';
    g.drawImage(main, x0, y0, w, h);
    // 찾은 물건: 금빛 테두리(찾은 순간 밝게, 그 뒤엔 은은하게)
    st.items.concat(st.cat ? [st.cat] : []).forEach((it) => {
      if (!it.found || !it.glow) return;
      const t = (now - it.t) / 1000;
      const a = t < 1.2 ? 1 : 0.55;
      g.globalAlpha = a;
      g.drawImage(it.glow, x0, y0, w, h);
      if (t < 1.2) { g.globalAlpha = (1.2 - t) / 1.2; g.drawImage(it.glow, x0, y0, w, h); }
      g.globalAlpha = 1;
      if (t < 0.9) dirty = true;
    });
    // 힌트 고리
    if (st.hintOn) {
      const it = st.hintOn.it;
      if (it.found || now > st.hintOn.until) st.hintOn = null;
      else {
        const p = toScr(it.cx, it.cy);
        const R0 = Math.max(26, (it.x1 - it.x0) * w * 0.9, (it.y1 - it.y0) * h * 0.9);
        const k = (now - st.hintOn.t0) / 1000;
        const R = R0 * (1 + Math.max(0, 1.6 - k * 2.2)) * (1 + Math.sin(now / 120) * 0.08);
        g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.stroke();
        g.lineWidth = 5; g.strokeStyle = '#ffd23f'; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.stroke();
        dirty = true;
      }
    }
    // 반짝이·표시
    fx = fx.filter((f) => now - f.t0 < f.life);
    fx.forEach((f) => {
      const t = (now - f.t0) / f.life;
      const p = toScr(f.u, f.v);
      if (f.kind === 'spark') {
        const x = p.x + f.vx * t * 60, y = p.y + f.vy * t * 60 + t * t * 30;
        g.globalAlpha = 1 - t;
        g.fillStyle = f.c;
        star(g, x, y, f.s * (1 - t * 0.5), f.s * 0.42 * (1 - t * 0.5));
        g.globalAlpha = 1;
      } else if (f.kind === 'x' || f.kind === 'shield') {
        const s = 16 * (1 + (1 - Math.min(1, t * 4)) * 0.4);
        g.globalAlpha = 1 - Math.max(0, t - 0.6) / 0.4;
        g.lineCap = 'round';
        if (f.kind === 'x') {
          g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.35)';
          g.beginPath(); g.moveTo(p.x - s, p.y - s); g.lineTo(p.x + s, p.y + s); g.moveTo(p.x + s, p.y - s); g.lineTo(p.x - s, p.y + s); g.stroke();
          g.lineWidth = 5; g.strokeStyle = '#ff4d3a';
          g.beginPath(); g.moveTo(p.x - s, p.y - s); g.lineTo(p.x + s, p.y + s); g.moveTo(p.x + s, p.y - s); g.lineTo(p.x - s, p.y + s); g.stroke();
        } else {
          g.lineWidth = 5; g.strokeStyle = '#7ad0ff';
          g.beginPath(); g.arc(p.x, p.y, s * 1.3, 0, 7); g.stroke();
        }
        g.globalAlpha = 1;
      } else if (f.kind === 'ring') {
        g.globalAlpha = 1 - t;
        g.lineWidth = 6 * (1 - t) + 1; g.strokeStyle = f.c;
        g.beginPath(); g.arc(p.x, p.y, 10 + t * f.s, 0, 7); g.stroke();
        g.globalAlpha = 1;
      } else if (f.kind === 'miss') {   // 판이 끝났을 때 못 찾은 물건
        const R = Math.max(22, f.r * w);
        g.lineWidth = 5; g.strokeStyle = '#ff4d3a';
        g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.stroke();
      }
    });
    if (fx.length) dirty = true;
  }
  function star(g, x, y, R, r) {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, q = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    g.closePath(); g.fill();
  }
  function loop(now) {
    if (dirty && st.mode !== 'title') { dirty = false; draw(now || performance.now()); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__hp.draw = () => draw(performance.now());

  // ── 입력: 한 손가락 끌기 = 이동, 두 손가락 = 확대, 짧게 누르기 = 찾기, 휠 = 확대
  const ptrs = new Map();
  let gest = null;
  function local(e) { const r = pic.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  pic.addEventListener('pointerdown', (e) => {
    AU.unlock();
    pic.setPointerCapture && pic.setPointerCapture(e.pointerId);
    const p = local(e);
    ptrs.set(e.pointerId, p);
    if (ptrs.size === 1) gest = { kind: 'tap', x0: p.x, y0: p.y, cx: view.cx, cy: view.cy, t0: performance.now(), moved: false };
    else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      gest = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), z0: view.z, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, moved: true };
      gest.a0 = toImg(gest.m.x, gest.m.y);
    }
  });
  pic.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId) || !gest) return;
    const p = local(e);
    ptrs.set(e.pointerId, p);
    if (gest.kind === 'tap' || gest.kind === 'pan') {
      const dx = p.x - gest.x0, dy = p.y - gest.y0;
      if (!gest.moved && Math.hypot(dx, dy) > 8) { gest.moved = true; gest.kind = 'pan'; }
      if (gest.kind === 'pan') {
        const w = base() * view.z, h = w / S.ASPECT;
        view.cx = gest.cx - dx / w; view.cy = gest.cy - dy / h;
        clampView(); dirty = true;
      }
    } else if (gest.kind === 'pinch' && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      view.z = Math.max(1, Math.min(4, gest.z0 * d / Math.max(10, gest.d0)));
      const w = base() * view.z, h = w / S.ASPECT;
      view.cx = gest.a0.u - (m.x - PW / 2) / w; view.cy = gest.a0.v - (m.y - PH / 2) / h;
      clampView(); dirty = true;
    }
  });
  function up(e) {
    if (!ptrs.has(e.pointerId)) return;
    const p = ptrs.get(e.pointerId);
    ptrs.delete(e.pointerId);
    if (gest && gest.kind === 'tap' && !gest.moved && ptrs.size === 0 && performance.now() - gest.t0 < 600) tapAt(p.x, p.y);
    if (ptrs.size === 0) gest = null;
    else if (gest && gest.kind === 'pinch') { const q = [...ptrs.values()][0]; gest = { kind: 'pan', x0: q.x, y0: q.y, cx: view.cx, cy: view.cy, moved: true }; }
  }
  pic.addEventListener('pointerup', up);
  pic.addEventListener('pointercancel', (e) => { ptrs.delete(e.pointerId); if (!ptrs.size) gest = null; });
  pic.addEventListener('wheel', (e) => { e.preventDefault(); const p = local(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0016)); }, { passive: false });

  // ── 찾기
  function tapAt(x, y) {
    if (st.mode !== 'play' || st.paused || st.over) return;
    const a = toImg(x, y);
    if (a.u < 0 || a.u > 1 || a.v < 0 || a.v > 1) return;
    const rad = Math.max(3, 15 * S.IW / (base() * view.z));
    const byK = {};
    st.items.forEach((it) => { if (!it.found) byK[it.k] = it; });
    if (st.cat && !st.cat.found) byK[st.cat.k] = st.cat;
    const k = S.hit(a.u, a.v, rad, (q) => !!byK[q]);
    if (k >= 0) {
      const it = byK[k];
      if (it === st.cat) catFound(it, a); else found(it, a);
    } else miss(a);
  }
  window.__hp.tapImg = (u, v) => { const p = toScr(u, v); tapAt(p.x, p.y); };

  function glowOf(k) {
    const m = S.mask(k);
    const c = document.createElement('canvas');
    c.width = m.width; c.height = m.height;
    const g = c.getContext('2d');
    g.shadowColor = '#ffe680'; g.shadowBlur = 6;
    for (let i = 0; i < 3; i++) g.drawImage(m, 0, 0);
    g.shadowBlur = 0;
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffd84a'; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(m, 0, 0);
    return c;
  }
  function burst(u, v, n, cols, sz) {
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.4;
      fx.push({ kind: 'spark', u, v, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, s: (sz || 7) * (0.6 + Math.random() * 0.8), c: cols[i % cols.length], t0, life: 700 + Math.random() * 400 });
    }
    fx.push({ kind: 'ring', u, v, s: 70, c: cols[0], t0, life: 500 });
    dirty = true;
  }
  function found(it, a) {
    it.found = true;
    it.t = performance.now();
    it.glow = glowOf(it.k);
    const n = st.items.filter((q) => q.found).length;
    AU.play('found', n - 1);
    burst(it.cx, it.cy, 14, ['#ffe066', '#ffffff', '#ffb347']);
    // 연달아 찾으면 칭찬 + 시간
    const now = performance.now();
    st.combo = now - st.lastFind < 4500 ? st.combo + 1 : 1;
    st.lastFind = now;
    if (st.combo >= 2) {
      const w = st.combo >= 4 ? 'AMAZING' : st.combo === 3 ? 'GREAT' : 'NICE';
      word(w + '  +3', 800);
      st.left = Math.min(st.total + 60, st.left + 3);
      setTimeout(() => AU.play('combo', st.combo), 120);
    }
    flyTo(it);
    hud();
    if (n === st.items.length) { st.over = true; setTimeout(clear, 900); }
  }
  function catFound(it, a) {
    it.found = true;
    it.t = performance.now();
    it.glow = glowOf(it.k);
    st.gotCat = true;
    AU.play('cat');
    burst(it.cx, it.cy, 22, ['#ffd84a', '#fff6c0', '#ff9ac0'], 9);
    word(T2('냐옹!', 'MEOW!'), 1100);
  }
  function miss(a) {
    st.miss++;
    st.combo = 0;
    if (st.guard > 0) {
      st.guard--;
      AU.play('guard');
      fx.push({ kind: 'shield', u: a.u, v: a.v, t0: performance.now(), life: 700 });
    } else {
      st.left = Math.max(0, st.left - 5);
      AU.play('miss');
      fx.push({ kind: 'x', u: a.u, v: a.v, t0: performance.now(), life: 700 });
      pic.classList.remove('shake'); void pic.offsetWidth; pic.classList.add('shake');
      if (st.left <= 0) gameOver();
    }
    dirty = true;
    hud();
  }

  // 찾은 물건 그림이 목록 사진으로 날아간다
  function flyTo(it) {
    const slot = listEl.querySelector('[data-k="' + it.k + '"]');
    if (!slot) return;
    const p = toScr(it.cx, it.cy);
    const r0 = pic.getBoundingClientRect(), r1 = slot.querySelector('canvas').getBoundingClientRect();
    const f = document.createElement('canvas');
    f.width = f.height = 128;
    f.getContext('2d').drawImage(S.thumb(it.id, 128), 0, 0);
    f.style.cssText = 'position:fixed;z-index:24;pointer-events:none;width:72px;height:72px;left:' + (r0.left + p.x - 36) + 'px;top:' + (r0.top + p.y - 36) + 'px;transition:transform .55s cubic-bezier(.5,-0.3,.6,1),opacity .2s .5s;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))';
    document.body.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const dx = r1.left + r1.width / 2 - (r0.left + p.x), dy = r1.top + r1.height / 2 - (r0.top + p.y);
      f.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + (r1.width / 72) + ') rotate(360deg)';
      f.style.opacity = '0';
    }));
    setTimeout(() => {
      f.remove();
      slot.classList.add('got', 'hit');
      AU.play('land');
      setTimeout(() => slot.classList.remove('hit'), 520);
    }, 560);
  }

  // ── 힌트
  function useHint() {
    AU.unlock();
    if (st.mode !== 'play' || st.paused || st.over) return;
    const left = st.items.filter((it) => !it.found);
    if (st.hints <= 0 || !left.length) { AU.play('nohint'); return; }
    st.hints--;
    AU.play('hint');
    const it = left[Math.floor(Math.random() * left.length)];
    // 확대한 화면 밖이면 그리로 옮긴다
    const p = toScr(it.cx, it.cy);
    if (p.x < 30 || p.y < 30 || p.x > PW - 30 || p.y > PH - 30) { view.cx = it.cx; view.cy = it.cy; clampView(); }
    st.hintOn = { it, t0: performance.now(), until: performance.now() + 4000 };
    const slot = listEl.querySelector('[data-k="' + it.k + '"]');
    if (slot) { slot.classList.remove('hit'); void slot.offsetWidth; slot.classList.add('hit'); }
    hud(); dirty = true;
  }
  $('bHint').onclick = useHint;

  // ── 시간
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.5, (now - (st.last || now)) / 1000);
    st.last = now;
    if (st.mode !== 'play' || st.paused || st.over || document.hidden) return;
    tick(dt);
  }, 100);
  function tick(dt) {
    const before = Math.ceil(st.left);
    st.left -= dt;
    const after = Math.ceil(st.left);
    if (after !== before && after <= 10 && after > 0) AU.play('tick');
    if (st.left <= 0) { st.left = 0; gameOver(); }
    hud();
  }
  window.__hp.tick = tick;
  function mmss(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function hud() {
    const r = Math.max(0, Math.min(1, st.left / st.total));
    $('tfill').style.width = r * 100 + '%';
    $('tbar').classList.toggle('low', r < 0.2);
    $('tnum').textContent = mmss(st.left);
    $('tnum').classList.toggle('low', st.left <= 10 && !st.over);
    $('hints').textContent = st.hints;
    $('bHint').classList.toggle('empty', st.hints <= 0);
    const sh = $('shield');
    if (sh) { sh.hidden = st.guard <= 0; sh.textContent = 'SHIELD ' + st.guard; }
  }
  function word(t, ms) {
    const w = $('word');
    w.textContent = t;
    w.classList.remove('on'); void w.offsetWidth;
    w.classList.add('on');
    clearTimeout(word.t);
    word.t = setTimeout(() => w.classList.remove('on'), ms || 900);
  }

  // ── 판 시작
  let overT = 0, gpuSent = false, dealT = 0;
  function imgRes() {
    if (S.SAFE) return 1400;
    const want = Math.max(PW, PH * S.ASPECT) * DPR * 1.9;
    return Math.round(Math.max(1500, Math.min(2400, want)));
  }
  function startStage(s) {
    clearTimeout(overT);
    st.over = true;
    st.mode = 'play';
    st.stage = s;
    prog.last = s;
    saveProg();
    const I = info(s);
    st.I = I;
    document.body.classList.add('playing');
    $('title').classList.add('off'); $('titleBg').classList.add('off');
    $('end').classList.remove('on'); $('ending').classList.remove('on');
    $('stages').classList.remove('on'); $('dex').classList.remove('on');
    $('loading').hidden = false;
    $('cards').innerHTML = '';
    dealt = null; picking = false;
    clearTimeout(dealT);
    $('stage').textContent = 'STAGE ' + s;
    if (window.OG) try { OG.start({ stage: s }); } catch (e) {}
    setTimeout(() => {
      layout();
      let res = build(I);
      const cov = Math.round((S.cover || 0) * 100);
      const ga = (n, p) => { try { if (window.gtag) gtag('event', n, p); } catch (e) {} };
      if (!gpuSent) { gpuSent = true; ga('hiddenpic_gpu', { stage: s, gpu: S.gpu(), cover: cov, n: res.items.length }); }
      if (res.items.length < Math.min(4, I.n) || cov < 5 || S.lost) {   // 폰에서 3D 가 안 그려지면 가벼운 판으로
        const was = { stage: s, gpu: S.gpu(), cover: cov, n: res.items.length, lost: S.lost ? 1 : 0 };
        if (S.goSafe()) { res = build(I); was.safe_n = res.items.length; was.safe_cover = Math.round((S.cover || 0) * 100); }
        ga('hiddenpic_blank', was);
      }
      st.items = res.items;
      st.cat = res.cat;
      st.gotCat = false;
      st.total = I.time; st.left = I.time;
      st.hints = 2; st.guard = 0; st.miss = 0; st.combo = 0; st.hintOn = null;
      fx = [];
      // 앞 판 카드 효과
      const b = prog.buff;
      if (b) {
        const gd = b.gold;
        if (b.fx === 'time') { st.total += gd ? 45 : 20; st.left = st.total; }
        else if (b.fx === 'hint') st.hints += gd ? 2 : 1;
        else if (b.fx === 'guard') st.guard = gd ? 5 : 2;
        prog.buff = null; saveProg();
        setTimeout(() => word(fxLabel(b.fx, gd), 1100), 350);
      }
      makeList();
      layout();
      // 세로 화면은 그림이 작으니 조금 당겨서 시작(옆으로 밀어 본다)
      view.z = port ? Math.max(1, Math.min(2.5, PH * S.ASPECT / PW)) : 1; view.cx = 0.5; view.cy = 0.5;
      clampView();
      hud();
      $('loading').hidden = true;
      st.over = false;
      st.last = performance.now();
      setPause(false);
      dirty = true;
    }, 40);
  }
  function build(I) {
    S.build(I.scene, I.seed, { night: I.night });
    const res = S.place(I.n, I.lv, I.seed);
    main.width = imgRes(); main.height = Math.round(main.width / S.ASPECT);
    S.draw(main);
    return res;
  }
  function makeList() {
    listEl.innerHTML = '';
    st.items.forEach((it, i) => {
      const d = document.createElement('div');
      d.className = 'pol';
      d.dataset.k = it.k;
      d.style.transform = 'rotate(' + ((i * 37) % 7 - 3) + 'deg)';
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      c.getContext('2d').drawImage(S.thumb(it.id, 128), 0, 0);
      d.appendChild(c);
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = T2(ITEMS[it.id].ko, ITEMS[it.id].en);
      d.appendChild(nm);
      listEl.appendChild(d);
    });
  }

  // ── 끝: 별 + 카드 셋 중 하나
  function fxLabel(f, gold) {
    if (f === 'time') return 'TIME +' + (gold ? 45 : 20);
    if (f === 'hint') return 'HINT +' + (gold ? 2 : 1);
    return 'SHIELD ' + (gold ? 5 : 2);
  }
  function clear() {
    if (st.mode !== 'play') return;
    st.over = true;
    if (window.OG) try { OG.over({ result: 'CLEAR', stage: st.stage, score: Math.ceil(st.left) }); } catch (e) {}
    const r = st.left / st.total;
    const stars = r >= 0.45 ? 3 : r >= 0.2 ? 2 : 1;
    const s = st.stage;
    if (stars > (prog.stars[s] || 0)) prog.stars[s] = stars;
    prog.open = Math.max(prog.open, Math.min(TOTAL, s + 1));
    prog.plays[s] = (prog.plays[s] || 0) + 1;
    if (st.gotCat) prog.cats = (prog.cats || 0) + 1;
    saveProg();
    AU.play('clear');
    $('endTitle').textContent = st.miss === 0 ? 'PERFECT' : 'CLEAR';
    $('endSub').textContent = '';
    const es = $('endStars');
    es.hidden = false;
    es.innerHTML = '<span class="dim">★</span><span class="dim">★</span><span class="dim">★</span>';
    for (let i = 0; i < stars; i++) setTimeout(() => { es.children[i].className = ''; AU.play('star', i); }, 450 + i * 260);
    ['endList', 'endRetry', 'endNext'].forEach((id) => ($(id).hidden = true));
    $('end').classList.add('on');
    dealT = setTimeout(deal, 450 + stars * 260 + 250);
  }

  // 카드 셋: 대부분 일반, 가끔 금테. 숨은 고양이를 찾았으면 금테 하나는 꼭
  function rollCards() {
    const r = Math.random;
    const have = (id) => !!prog.dex[id];
    const out = [];
    while (out.length < 3) {
      const pool = DEX.filter((id) => !out.some((c) => c.id === id));
      const fresh = pool.filter((id) => !have(id));
      const from = fresh.length && r() < 0.65 ? fresh : pool;
      const id = from[Math.floor(r() * from.length)];
      out.push({ id, gold: r() < 0.07 });
    }
    if (st.gotCat && !out.some((c) => c.gold)) out[Math.floor(r() * 3)].gold = true;
    return out;
  }
  let dealt = null;
  function deal() {
    const box = $('cards');
    box.innerHTML = '';
    dealt = rollCards();
    AU.play('deal');
    dealt.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'card' + (c.gold ? ' gold' : '');
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px) rotate(' + (i - 1) * 6 + 'deg)';
      const f = document.createElement('div');
      f.className = 'f';
      const th = document.createElement('canvas'); th.width = th.height = 160;
      th.getContext('2d').drawImage(S.thumb(c.id, 160), 0, 0);
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = T2(ITEMS[c.id].ko, ITEMS[c.id].en);
      const fl = document.createElement('div'); fl.className = 'fx'; fl.textContent = fxLabel(ITEMS[c.id].fx, c.gold);
      f.append(th, nm, fl);
      const bk = document.createElement('div'); bk.className = 'bk';
      el.append(bk, f);
      el.onclick = () => pick(i);
      box.appendChild(el);
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = ''; AU.play('flip'); }, 120 + i * 140);
    });
  }
  let picking = false;
  function pick(i) {
    if (picking || !dealt) return;
    picking = true;
    AU.unlock();
    const els = [...$('cards').children];
    const c = dealt[i], el = els[i];
    el.classList.add('pre');
    if (c.gold) { el.classList.add('goldglow'); AU.play('shine'); }
    setTimeout(() => {
      el.classList.remove('pre');
      el.classList.add('open', 'pick');
      AU.play(c.gold ? 'gold' : 'flip');
      const isNew = !prog.dex[c.id];
      if (isNew) el.classList.add('new');
      prog.dex[c.id] = Math.max(prog.dex[c.id] || 0, c.gold ? 2 : 1);
      prog.buff = { fx: ITEMS[c.id].fx, gold: c.gold };
      saveProg();
      if (c.gold) burstDom(el);
      setTimeout(() => {
        els.forEach((o, j) => { if (j !== i) { o.classList.add('open', 'dim'); } });
        AU.play('flip');
        $('endSub').textContent = T2('도감 ', 'COLLECTION ') + dexCount() + ' / ' + DEX.length;
        ['endList', 'endRetry', 'endNext'].forEach((id) => ($(id).hidden = false));
        picking = false;
        dealt = null;
      }, 700);
    }, c.gold ? 900 : 500);
  }
  function burstDom(el) {
    const r = el.getBoundingClientRect();
    for (let i = 0; i < 24; i++) {
      const s = document.createElement('i');
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      s.style.cssText = 'position:fixed;z-index:60;pointer-events:none;width:10px;height:10px;border-radius:50%;background:' + (i % 2 ? '#ffd84a' : '#fff6c0') + ';left:' + (r.left + r.width / 2) + 'px;top:' + (r.top + r.height / 2) + 'px;transition:transform .8s cubic-bezier(.2,.8,.3,1),opacity .8s';
      document.body.appendChild(s);
      requestAnimationFrame(() => requestAnimationFrame(() => { s.style.transform = 'translate(' + Math.cos(a) * d + 'px,' + Math.sin(a) * d + 'px) scale(.3)'; s.style.opacity = '0'; }));
      setTimeout(() => s.remove(), 900);
    }
  }
  const dexCount = () => DEX.filter((id) => prog.dex[id]).length;

  function gameOver() {
    if (st.over) return;
    st.over = true;
    if (window.OG) try { OG.over({ result: 'GAME OVER', stage: st.stage, score: st.items.filter((i) => i.found).length }); } catch (e) {}
    AU.play('over');
    const t0 = performance.now();
    st.items.forEach((it) => { if (!it.found) fx.push({ kind: 'miss', u: it.cx, v: it.cy, r: Math.max(it.x1 - it.x0, it.y1 - it.y0) * 0.7, t0, life: 1e9 }); });
    view.z = 1; view.cx = 0.5; view.cy = 0.5; dirty = true;
    overT = setTimeout(() => {
      $('endTitle').textContent = 'GAME OVER';
      $('endStars').hidden = true;
      $('cards').innerHTML = '';
      $('endSub').textContent = st.items.filter((i) => i.found).length + ' / ' + st.items.length;
      $('endNext').hidden = true; $('endList').hidden = false; $('endRetry').hidden = false;
      $('end').classList.add('on');
    }, 1700);
  }
  $('endNext').onclick = () => { AU.play('click'); if (st.stage >= TOTAL) showEnding(); else startStage(st.stage + 1); };
  $('endRetry').onclick = () => { AU.play('click'); startStage(st.stage); };
  $('endList').onclick = () => { AU.play('click'); openStages(); };

  // ── 멈춤·소리
  function setPause(v) {
    st.paused = v;
    $('pauseCover').hidden = !v;
    $('tPause').classList.toggle('off', v);
  }
  $('tPause').onclick = () => { AU.play('click'); if (st.mode === 'play' && !st.over) setPause(!st.paused); };
  $('pauseCover').onclick = () => setPause(false);
  const tMus = $('tMus'), tSnd = $('tSnd');
  function syncTog() { tMus.classList.toggle('off', !AU.bgm); tSnd.classList.toggle('off', !AU.snd); }
  tMus.onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); syncTog(); };
  $('tRot').onclick = () => { AU.play('click'); if (window.OL && OL.go) OL.go(); };
  $('rotBtn').onclick = () => { AU.unlock(); AU.play('click'); if (window.OL && OL.go) OL.go(); };
  tSnd.onclick = () => { AU.unlock(); AU.setSnd(!AU.snd); syncTog(); AU.play('click'); };
  syncTog();
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'm') tMus.onclick();
    else if (k === 'k') tSnd.onclick();
    else if ((k === 'p' || k === 'escape') && st.mode === 'play' && !st.over) setPause(!st.paused);
    else if (k === 'h') useHint();
    else if ((k === '+' || k === '=') && st.mode === 'play') zoomAt(PW / 2, PH / 2, 1.3);
    else if (k === '-' && st.mode === 'play') zoomAt(PW / 2, PH / 2, 1 / 1.3);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.mode === 'play' && !st.over) setPause(true); });

  // ── 스테이지 목록
  const sceneThumbs = {};
  function sceneThumb(ix) {
    if (sceneThumbs[ix]) return sceneThumbs[ix];
    const c = document.createElement('canvas');
    c.width = 320; c.height = 200;
    S.build(SCENES[ix].id, ix * 101 + 5, {});
    S.draw(c);
    return (sceneThumbs[ix] = c.toDataURL('image/jpeg', 0.82));
  }
  const starSum = () => Object.values(prog.stars).reduce((a, b) => a + b, 0);
  function openStages() {
    const L = $('slist');
    L.innerHTML = '';
    const wasPlay = st.mode === 'play' && !st.over;
    if (wasPlay) setPause(true);
    SCENES.forEach((sc, ix) => {
      let sum = 0;
      const first = ix * PER;
      for (let k = 1; k <= PER; k++) sum += prog.stars[first + k] || 0;
      const h = document.createElement('div');
      h.className = 'room';
      h.innerHTML = '<img src="' + sceneThumb(ix) + '"><span>' + T2(sc.ko, sc.en) + '</span><span class="st">★ ' + sum + ' / ' + PER * 3 + '</span>';
      L.appendChild(h);
      const gr = document.createElement('div');
      gr.className = 'grid';
      for (let k = 1; k <= PER; k++) {
        const s = first + k;
        const b = document.createElement('button');
        const lock = s > prog.open;
        b.className = 'cell' + (lock ? ' lock' : '') + (s === prog.last ? ' cur' : '');
        b.innerHTML = s + (lock ? '<i class="lockic"></i>' : '<small>' + '★'.repeat(prog.stars[s] || 0) + '</small>');
        if (!lock) b.onclick = () => { AU.unlock(); AU.play('click'); startStage(s); };
        gr.appendChild(b);
      }
      L.appendChild(gr);
    });
    $('starSum').textContent = '★ ' + starSum();
    $('stages').classList.add('on');
    // 목록 그림을 짓느라 장면이 바뀌었으면 판 장면을 되돌린다
    if (st.mode === 'play' && st.I) restoreScene();
  }
  function restoreScene() {
    S.build(st.I.scene, st.I.seed, { night: st.I.night });
    S.place(st.I.n, st.I.lv, st.I.seed);
  }
  $('closeStages').onclick = () => { AU.play('click'); $('stages').classList.remove('on'); };

  // ── 도감
  function openDex() {
    AU.unlock();
    const G = $('dexGrid');
    G.innerHTML = '';
    $('dexInfo').textContent = '';
    DEX.forEach((id) => {
      const d = document.createElement('div');
      const have = prog.dex[id] || 0;
      d.className = 'dx' + (have ? '' : ' no') + (have === 2 ? ' gold' : '');
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      g.drawImage(S.thumb(id, 128), 0, 0);
      if (!have) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#141212'; g.fillRect(0, 0, 128, 128); }
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = have ? T2(ITEMS[id].ko, ITEMS[id].en) : '?';
      d.append(c, nm);
      if (have) d.onclick = () => { AU.play('click'); $('dexInfo').textContent = T2(ITEMS[id].ko, ITEMS[id].en) + '  ·  ' + fxLabel(ITEMS[id].fx, have === 2); };
      G.appendChild(d);
    });
    $('dexCount').textContent = dexCount() + ' / ' + DEX.length;
    $('dex').classList.add('on');
    if (st.mode === 'play' && !st.over) setPause(true);
  }
  $('closeDex').onclick = () => { AU.play('click'); $('dex').classList.remove('on'); };
  $('toDex').onclick = () => { AU.play('click'); openDex(); };
  $('endingDex').onclick = () => { AU.play('click'); openDex(); };

  // ── 엔딩: 모은 물건이 진열장에. 도감을 다 채우면 고양이가 왕관을 쓴다
  function showEnding() {
    const done = dexCount() === DEX.length;
    prog.ended = Math.max(prog.ended || 0, done ? 2 : 1);
    saveProg();
    st.mode = 'ending';
    document.body.classList.remove('playing');
    $('end').classList.remove('on');
    const c = $('endingCv');
    if (SCN.cabinet) { S.build('cabinet', 7, { dex: prog.dex, complete: done }); S.draw(c); }
    $('endingTitle').textContent = done ? 'COMPLETE' : 'THE END';
    $('endingSub').textContent = T2('도감 ', 'COLLECTION ') + dexCount() + ' / ' + DEX.length + '   ★ ' + starSum();
    $('ending').classList.add('on');
    AU.play('end');
  }
  $('endingOk').onclick = () => { AU.play('click'); $('ending').classList.remove('on'); toTitle(); };
  window.__hp.ending = showEnding;

  // ── 타이틀: 실제 장면을 뒤에 그대로
  function drawTitle() {
    const c = $('cvT');
    const w = innerWidth, h = innerHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.min(2200, Math.round(Math.max(w, h * S.ASPECT) * dpr));
    c.width = pw; c.height = Math.round(pw / S.ASPECT);
    const si = Math.floor((Math.min(prog.last, TOTAL) - 1) / PER) % SCENES.length;
    S.build(SCENES[si].id, 4242, {});
    S.place(8, 0, 4242);
    S.draw(c);
  }
  function toTitle() {
    st.mode = 'title';
    st.over = true;
    document.body.classList.remove('playing');
    $('title').classList.remove('off'); $('titleBg').classList.remove('off');
    $('toList').hidden = prog.open <= 1;
    $('start').firstChild.textContent = prog.last > 1 || prog.open > 1 ? T2('이어하기', 'CONTINUE') : T2('시작', 'START');
    drawTitle();
  }
  $('start').onclick = () => { AU.unlock(); AU.play('click'); startStage(Math.min(prog.last, prog.open) || 1); };
  $('toList').onclick = () => { AU.unlock(); AU.play('click'); openStages(); };
  layout();
  toTitle();
  document.addEventListener('pointerdown', () => AU.unlock(), { once: true });
})();
