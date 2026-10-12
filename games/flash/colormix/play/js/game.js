// 색깔섞기 — 판·입력·그림 칠하기·카드·저장
(function () {
  const { rgb, key, css, shade, PIG } = window.MIX;
  const LV = window.LEVELS, D = window.DATA, ART = window.ART, AU = window.AU;
  const $ = (id) => document.getElementById(id);
  const CARD = {}; D.cards.forEach((c) => (CARD[c.id] = c));
  // ── 저장
  const SK = 'colormix.save';
  let S;
  try { S = JSON.parse(localStorage.getItem(SK)); } catch (e) {}
  S = Object.assign({ clr: {}, bag: {}, seen: {}, mixes: {}, done: {} }, S || {});
  const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} };
  const li = (p, q) => LV.findIndex((L) => L.p === p && L.q === q);
  const avail = D.paints.map((p) => p.n);
  const unlocked = (n) => avail.includes(n) && (n === 1 || S.done[n - 1]);
  const nextLevel = () => { for (let i = 0; i < LV.length; i++) if (!S.clr[i] && unlocked(LV[i].p)) return i; return -1; };

  // ── 그림(완성 그림·밑그림·구역 지도)
  const IMGS = {};
  function img(src) { if (IMGS[src]) return IMGS[src]; const im = new Image(); im.src = src; IMGS[src] = im; return im; }
  const ready = (im) => im.complete && im.naturalWidth > 0;
  const wood = img('assets/wood.webp');
  const PW = 1024, PH = 572;
  const PT = {};
  function paint(n) {
    if (PT[n]) return PT[n];
    const pad = (x) => String(x).padStart(2, '0');
    const P = (PT[n] = { n, img: img('assets/paint/p' + pad(n) + '.webp'), sk: img('assets/paint/p' + pad(n) + '_s.webp'), masks: null, cent: [], base: null, dirty: true });
    // 그림이 늦게 와도(더블클릭으로 열 때 등) 다 오면 보이는 캔버스를 다시 그린다
    [P.img, P.sk].forEach((im) => im.addEventListener('load', () => { P.dirty = true; redrawShown(n); }));
    const m = new Image();
    m.onload = () => {
      const c = document.createElement('canvas'); c.width = m.width; c.height = m.height;
      const g = c.getContext('2d'); g.drawImage(m, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      P.masks = []; P.cent = [];
      for (let k = 0; k < 10; k++) {
        const mc = document.createElement('canvas'); mc.width = c.width; mc.height = c.height;
        const mg = mc.getContext('2d'), id = mg.createImageData(c.width, c.height);
        let sx = 0, sy = 0, cnt = 0;
        for (let i = 0, p = 0; i < d.length; i += 4, p++) if (Math.round(d[i] / 20) === k) { id.data[i + 3] = 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = 255; sx += p % c.width; sy += (p / c.width) | 0; cnt++; }
        mg.putImageData(id, 0, 0);
        P.masks.push(mc);
        P.cent.push(cnt ? [(sx / cnt) * PW / c.width, (sy / cnt) * PH / c.height] : [PW / 2, PH / 2]);
      }
      P.dirty = true; redrawShown(n);
    };
    m.src = window.MASKS[n];
    return P;
  }
  const tmp = document.createElement('canvas'); tmp.width = PW; tmp.height = PH;
  const tg = tmp.getContext('2d');
  // 구역 k 를 완성 그림으로 칠한다. prog(0~1) 가 있으면 붓질이 지나간 만큼만
  function drawRegion(g, P, k, prog) {
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, PW, PH);
    if (prog != null && prog < 1) {
      const [cx, cy] = P.cent[k];
      tg.save(); tg.strokeStyle = '#fff'; tg.lineCap = 'round'; tg.lineJoin = 'round';
      const bw = 70, rows = Math.ceil(PH / (bw * 0.75)), tot = rows;
      const upto = prog * tot;
      for (let r = 0; r < rows; r++) {
        const f = Math.min(1, upto - r); if (f <= 0) break;
        const y = (r + 0.5) * bw * 0.75, dir = r % 2 ? -1 : 1, x0 = dir > 0 ? -40 : PW + 40, x1 = x0 + dir * (PW + 80) * f;
        tg.lineWidth = bw * (0.9 + 0.2 * Math.sin(r * 2.1));
        tg.beginPath(); tg.moveTo(x0, y + Math.sin(r) * 8); tg.quadraticCurveTo((x0 + x1) / 2, y + 14 * Math.sin(r * 1.7), x1, y - Math.sin(r) * 8); tg.stroke();
      }
      tg.fillStyle = '#fff'; tg.beginPath(); tg.arc(cx, cy, 30 + prog * 900, 0, Math.PI * 2); tg.fill();
      tg.restore();
      tg.globalCompositeOperation = 'destination-in';
    }
    tg.imageSmoothingEnabled = true;
    tg.drawImage(P.masks[k], 0, 0, PW, PH);
    tg.globalCompositeOperation = 'source-in';
    tg.drawImage(P.img, 0, 0, PW, PH);
    tg.globalCompositeOperation = 'source-over';
    g.drawImage(tmp, 0, 0);
  }
  // 그림 한 장의 지금 모습(밑그림 + 칠한 구역)을 base 에 굽는다
  function bake(P, skip) {
    if (!P.base) { P.base = document.createElement('canvas'); P.base.width = PW; P.base.height = PH; }
    const g = P.base.getContext('2d');
    g.clearRect(0, 0, PW, PH);
    if (ready(P.sk)) g.drawImage(P.sk, 0, 0, PW, PH); else { g.fillStyle = '#efe7d6'; g.fillRect(0, 0, PW, PH); }
    if (P.masks && ready(P.img)) for (let k = 0; k < 10; k++) { const i = li(P.n, k); if (i >= 0 && S.clr[i] && k !== skip) drawRegion(g, P, k); }
    P.dirty = !(P.masks && ready(P.img) && ready(P.sk));
    P.skip = skip;
  }
  const shown = new Map();   // 캔버스 → 그 위에 그린 그림 번호
  function redrawShown(n) { shown.forEach((m, cv) => { if (m === n && cv.isConnected) showPaint(cv, n); }); }
  function showPaint(cv, n, anim) {
    if (!anim) shown.set(cv, n);
    const P = paint(n), g = cv.getContext('2d');
    const skip = anim ? anim.k : -1;
    if (P.dirty || P.skip !== skip || !P.base) bake(P, skip);
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(P.base, 0, 0, cv.width, cv.height);
    if (anim && P.masks && ready(P.img)) { g.save(); g.scale(cv.width / PW, cv.height / PH); drawRegion(g, P, anim.k, anim.p); g.restore(); }
  }

  // ── 판
  const bc = $('bc'), bg = bc.getContext('2d');
  let G = null;          // 지금 판
  let uid = 1;
  function start(i) {
    const L = LV[i];
    G = { i, L, moves: L.lim, used: 0, hist: [], busy: false, sel: null, item: null, knife: null, won: false, parts: [], rings: [],
      walls: new Set(L.walls.map(([x, y]) => x + ',' + y)),
      blobs: L.b.map(([x, y, v]) => ({ id: uid++, x, y, ax: x, ay: y, v: v.slice(), seed: (x * 7 + y * 13 + i) % 97, sq: 0, wob: 0, glow: 0 })) };
    G.goal = L.goal; G.gk = key(L.goal);
    G.blobs.forEach((b) => (S.mixes[key(b.v)] = 1));
    show('play'); $('stgN').textContent = L.p + '-' + (L.q + 1);
    $('sStage').style.setProperty('--c', css(rgb(L.goal)));
    drawGoal(); hud(); items(); layout(); $('bUndo').classList.remove('alert');
    paint(L.p).dirty = true; showPaint($('pc'), L.p);
  }
  function snap() { return { blobs: G.blobs.map((b) => ({ ...b, v: b.v.slice() })), moves: G.moves, used: G.used }; }
  function hud() {
    const m = $('mv'); m.textContent = G.moves; m.classList.toggle('low', G.moves <= 1);
  }
  function drawGoal() {
    const cv = $('gc'), g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    const W = cv.width;
    ART.blob(g, W / 2, W * 0.37, W * 0.28, rgb(G.goal), 11);
    // 들어갈 물감 방울(재료) — 물감마다 점 하나씩
    const dots = []; G.goal.forEach((a, k) => { for (let i = 0; i < a; i++) dots.push(k); });
    const dr = W * 0.082, gap = Math.min(dr * 2.5, (W - dr * 2) / Math.max(1, dots.length - 1));
    const x0 = W / 2 - (gap * (dots.length - 1)) / 2;
    dots.forEach((k, i) => ART.blob(g, x0 + i * gap, W * 0.86, dr, rgb(PIG[k]), 3 + i));
  }
  const at = (x, y) => G.blobs.find((b) => b.x === x && b.y === y);
  const free = (x, y) => x >= 0 && y >= 0 && x < G.L.w && y < G.L.h && !G.walls.has(x + ',' + y);
  // 한 방향으로 밀었을 때 어디까지 가나(게임 규칙 = tools/levels.py)
  function slide(b, dx, dy) {
    let x = b.x, y = b.y, steps = 0;
    for (;;) {
      const nx = x + dx, ny = y + dy;
      if (!free(nx, ny)) return steps ? { x, y, steps, hit: null } : null;
      const o = at(nx, ny);
      if (o) return { x: nx, y: ny, steps: steps + 1, hit: o };
      x = nx; y = ny; steps++;
    }
  }
  function push(b, dx, dy) {
    if (G.busy || G.won || G.moves <= 0) return;
    const r = slide(b, dx, dy);
    if (!r) { b.sq = 0.25; b.bx = dx; b.by = dy; AU.play('bump'); return; }
    G.hist.push(snap());
    G.moves--; G.used++; hud();
    G.busy = true; AU.play('push');
    const tx = r.hit ? r.x - dx * 0.45 : r.x, ty = r.hit ? r.y - dy * 0.45 : r.y;
    b.anim = { fx: b.x, fy: b.y, tx, ty, t: 0, dur: 0.06 + r.steps * 0.065, done() {
      if (r.hit) {
        const o = r.hit;
        o.v = o.v.map((a, k) => a + b.v[k]);
        G.blobs.splice(G.blobs.indexOf(b), 1);
        o.sq = 0.35; o.wob = 0.09; o.mixFrom = rgb(b.v); o.mixT = 1; o.bx = dx; o.by = dy;
        const k = key(o.v), fresh = !S.mixes[k];
        S.mixes[k] = 1;
        splash(o.x, o.y, [rgb(b.v), rgb(o.v)], fresh ? 34 : 22);
        if (fresh) G.rings.push({ x: o.x, y: o.y, t: 0, c: rgb(o.v) });
        AU.play('plop', Math.min(7, o.v.reduce((s, a) => s + a, 0) - 1));
        if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) {}
        G.sel = o;
      } else { b.x = r.x; b.y = r.y; b.ax = r.x; b.ay = r.y; b.sq = 0.18; b.bx = dx; b.by = dy; AU.play('bump'); }
      G.busy = false;
      save();
      check();
    } };
  }
  // 남은 MOVES 로 견본을 만들 수 있나 — 못 만들면 UNDO 단추가 깜빡인다(답은 안 알려 줌)
  function* solveGen() {
    const W = G.L.w, H = G.L.h, gk = G.gk, lim = G.moves;
    const enc = (bs) => bs.map((b) => b.x + ',' + b.y + ':' + b.v.join('')).sort().join('|');
    let fr = [G.blobs.map((b) => ({ x: b.x, y: b.y, v: b.v.slice() }))], seen = new Set([enc(fr[0])]), cnt = 0;
    for (let d = 0; d < lim; d++) {
      const nx = [];
      for (const bs of fr) for (let i = 0; i < bs.length; i++) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const b = bs[i]; let x = b.x, y = b.y, st = 0, hit = -1;
        for (;;) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= H || G.walls.has(X + ',' + Y)) break;
          const j = bs.findIndex((o) => o.x === X && o.y === Y);
          if (j >= 0) { hit = j; break; }
          x = X; y = Y; st++;
        }
        if (hit < 0 && !st) continue;
        const nb = bs.map((o) => ({ x: o.x, y: o.y, v: o.v.slice() }));
        if (hit >= 0) { nb[hit].v = nb[hit].v.map((a, k) => a + b.v[k]); if (key(nb[hit].v) === gk) return true; nb.splice(i, 1); }
        else { nb[i].x = x; nb[i].y = y; }
        const e = enc(nb); if (seen.has(e)) continue; seen.add(e); nx.push(nb);
        if (++cnt > 30000) return true;   // 너무 넓으면 막혔다고 하지 않는다
        if (cnt % 150 === 0) yield;
      }
      fr = nx; if (!fr.length) break;
    }
    return false;
  }
  // 화면이 멈추지 않게 6ms 씩 나눠 돌린다
  let deadTok = 0;
  function checkDead() {
    const tok = ++deadTok, me = G;
    $('bUndo').classList.remove('alert');
    if (!G || G.won || G.moves <= 0) return;
    const it = solveGen();
    const step = () => {
      if (tok !== deadTok || G !== me) return;
      const t = performance.now(); let r;
      do { r = it.next(); } while (!r.done && performance.now() - t < 6);
      if (r.done) { if (!r.value && !G.won) $('bUndo').classList.add('alert'); }
      else setTimeout(step, 0);
    };
    setTimeout(step, 0);
  }

  function check() {
    const w = G.blobs.find((b) => key(b.v) === G.gk);
    if (w) { $('bUndo').classList.remove('alert'); return win(w); }
    checkDead();
    if (G.moves <= 0) setTimeout(() => { if (!G.won && G.moves <= 0) { AU.play('over'); open('over'); } }, 500);
  }

  // ── 판 그리기
  let BS = 400, DPR = 1, cell = 60, ox = 0, oy = 0;
  function layout() {
    if (!G) return;
    const pl = $('play').getBoundingClientRect(), land = innerWidth >= innerHeight;
    const ih = $('items').getBoundingClientRect().height || 60;
    let s;
    const iw = $('items').getBoundingClientRect().width || 60;
    if (land) s = Math.min(pl.height - 6, pl.width * 0.56 - iw - 12);
    else { const lh = $('lhs').getBoundingClientRect().height; s = Math.min(pl.width - 8, pl.height - lh - ih - 26); }
    s = Math.max(200, Math.floor(s));
    DPR = Math.min(2, window.devicePixelRatio || 1);
    BS = s; bc.style.width = bc.style.height = s + 'px'; bc.width = bc.height = Math.round(s * DPR);
    const n = Math.max(G.L.w, G.L.h);
    cell = s / (n + 0.7); ox = (s - G.L.w * cell) / 2; oy = (s - G.L.h * cell) / 2;
  }
  addEventListener('resize', () => { layout(); });
  const cx = (x) => ox + (x + 0.5) * cell, cy = (y) => oy + (y + 0.5) * cell;
  const rad = (v) => cell * Math.min(0.37, 0.2 + 0.05 * v.reduce((s, a) => s + a, 0));
  function splash(x, y, cols, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      G.parts.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, r: 0.03 + Math.random() * 0.06, c: cols[i % cols.length], life: 0.5 + Math.random() * 0.4, t: 0 });
    }
  }
  function tick(dt) {
    if (!G) return;
    G.blobs.forEach((b) => {
      if (b.anim) {
        const A = b.anim; A.t += dt; const k = Math.min(1, A.t / A.dur), e = k * k * (3 - 2 * k);
        b.ax = A.fx + (A.tx - A.fx) * e; b.ay = A.fy + (A.ty - A.fy) * e;
        if (k >= 1) { b.anim = null; A.done(); }
      }
      b.sq *= Math.pow(0.0015, dt); b.wob *= Math.pow(0.02, dt);
      if (b.mixT) b.mixT = Math.max(0, b.mixT - dt * 2.6);
      if (b.glowT != null) { b.glowT += dt; b.glow = 0.6 + 0.4 * Math.sin(b.glowT * 9); }
    });
    G.parts = G.parts.filter((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 9 * dt; p.vx *= 0.92; return p.t < p.life; });
    G.rings = G.rings.filter((r) => (r.t += dt) < 0.8);
  }
  // 방울에 든 물감: 물감마다 작은 점 하나(흰 테로 판 위에서도 보이게)
  function pips(g, v, x, y, cl) {
    const ks = []; v.forEach((a, k) => { for (let i = 0; i < a; i++) ks.push(k); });
    const n = ks.length, dr = cl * Math.min(0.068, 0.4 / Math.max(1, n)), gap = dr * 2.3, x0 = x - (gap * (n - 1)) / 2;
    ks.forEach((k, i) => {
      g.fillStyle = 'rgba(255,250,238,.95)'; g.beginPath(); g.arc(x0 + i * gap, y, dr + 1.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = css(rgb(PIG[k])); g.beginPath(); g.arc(x0 + i * gap, y, dr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(58,42,30,.45)'; g.lineWidth = 1; g.stroke();
    });
  }
  function draw() {
    if (!G) return;
    const g = bg;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, BS, BS);
    ART.board(g, BS, BS, G.L, cell, ox, oy, wood);
    G.walls.forEach((s) => { const [x, y] = s.split(',').map(Number); ART.cork(g, cx(x), cy(y), cell * 0.38); });
    // 나이프로 옮길 빈칸 표시
    if (G.knife) for (let y = 0; y < G.L.h; y++) for (let x = 0; x < G.L.w; x++) if (free(x, y) && !at(x, y)) { g.strokeStyle = 'rgba(216,71,58,.55)'; g.setLineDash([5, 5]); g.lineWidth = 2; g.beginPath(); g.arc(cx(x), cy(y), cell * 0.3, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
    G.rings.forEach((r) => { const k = r.t / 0.8; g.strokeStyle = css(r.c, 0.7 * (1 - k)); g.lineWidth = cell * 0.08 * (1 - k); g.beginPath(); g.arc(cx(r.x), cy(r.y), cell * (0.4 + k * 0.5), 0, Math.PI * 2); g.stroke(); });
    const order = G.blobs.slice().sort((a, b) => (a.anim ? 1 : 0) - (b.anim ? 1 : 0));
    order.forEach((b) => {
      let c = rgb(b.v);
      if (b.mixT) c = c.map((x, k) => x * (1 - b.mixT * 0.6) + b.mixFrom[k] * b.mixT * 0.6);
      const ax = Math.abs(b.bx || 0), sx = 1 + b.sq * (ax ? -0.5 : 0.4), sy = 1 + b.sq * (ax ? 0.4 : -0.5);
      const r = rad(b.v);
      if (G.sel === b && !G.won) { g.strokeStyle = 'rgba(255,250,235,.85)'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.arc(cx(b.ax), cy(b.ay), r + cell * 0.07, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
      ART.blob(g, cx(b.ax), cy(b.ay), r, c, b.seed, { sx, sy, wob: b.wob, glow: b.glow });
      pips(g, b.v, cx(b.ax), cy(b.ay) + cell * 0.41, cell);
    });
    G.parts.forEach((p) => { const k = 1 - p.t / p.life; g.fillStyle = css(p.c, Math.min(1, k * 1.6)); g.beginPath(); g.arc(ox + p.x * cell, oy + p.y * cell, cell * p.r * (0.6 + 0.4 * k), 0, Math.PI * 2); g.fill(); });
    if (drag && drag.b && drag.dir) {   // 미는 방향 화살표
      const b = drag.b, [dx, dy] = drag.dir, x = cx(b.ax) + dx * cell * 0.62, y = cy(b.ay) + dy * cell * 0.62;
      g.save(); g.translate(x, y); g.rotate(Math.atan2(dy, dx)); g.fillStyle = 'rgba(255,250,235,.9)'; g.strokeStyle = 'rgba(58,42,30,.6)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cell * 0.16, 0); g.lineTo(-cell * 0.08, -cell * 0.13); g.lineTo(-cell * 0.08, cell * 0.13); g.closePath(); g.fill(); g.stroke(); g.restore();
    }
  }
  let last = performance.now(), anim = null;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    tick(dt); draw(); fx(dt);
    if (anim) anim(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__tick = (dt) => { tick(dt); draw(); fx(dt); if (anim) anim(dt); };

  // ── 입력: 방울을 누르고 미는 쪽으로 끈다(PC 는 눌러 고르고 화살표도 됨)
  let drag = null;
  function cellAt(e) {
    const r = bc.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    return [Math.floor((x - ox) / cell), Math.floor((y - oy) / cell), x, y];
  }
  bc.addEventListener('pointerdown', (e) => {
    if (!G || G.won) return;
    AU.unlock();
    const [x, y, px, py] = cellAt(e);
    if (G.knife) {   // 나이프: 빈칸을 누르면 옮긴다
      if (free(x, y) && !at(x, y)) { G.hist.push(snap()); const b = G.knife; b.x = b.ax = x; b.y = b.ay = y; b.sq = 0.3; G.knife = null; spend('knife'); AU.play('use'); check(); }
      else { G.knife = null; }
      return;
    }
    const b = at(x, y);
    if (G.item && b) { useOn(b); return; }
    if (b) { G.sel = b; drag = { b, x0: px, y0: py, dir: null, pid: e.pointerId }; bc.setPointerCapture(e.pointerId); }
  });
  bc.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [, , px, py] = cellAt(e), dx = px - drag.x0, dy = py - drag.y0, d = Math.hypot(dx, dy);
    drag.dir = d > cell * 0.22 ? (Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]) : null;
  });
  const endDrag = () => { if (!drag) return; const d = drag; drag = null; if (d.dir) push(d.b, d.dir[0], d.dir[1]); };
  bc.addEventListener('pointerup', endDrag);
  bc.addEventListener('pointercancel', () => (drag = null));
  addEventListener('keydown', (e) => {
    if (!G || $('play').classList.contains('hide')) return;
    const K = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (K && G.sel && G.blobs.includes(G.sel)) { e.preventDefault(); push(G.sel, K[0], K[1]); }
    if (e.key === 'z' || e.key === 'Z') undo();
    if (e.key === 'r' || e.key === 'R') retry();
  });
  function undo() {
    if (!G || G.busy || G.won || !G.hist.length) return;
    const h = G.hist.pop();
    G.blobs = h.blobs.map((b) => ({ ...b, anim: null })); G.moves = h.moves; G.used = h.used; G.sel = null; hud(); AU.play('undo'); checkDead();
  }
  function retry() { if (!G || G.busy) return; AU.play('undo'); close(); start(G.i); }
  $('bUndo').onclick = () => { AU.unlock(); undo(); };
  $('bRe').onclick = () => { AU.unlock(); retry(); };

  // ── 가방(카드로 받은 도구)
  function spend(id) { S.bag[id]--; if (S.bag[id] <= 0) delete S.bag[id]; G.item = null; save(); items(); }
  function items() {
    const box = $('items'); box.innerHTML = '';
    Object.keys(S.bag).forEach((id) => {
      const c = CARD[id]; if (!c) return;
      const b = document.createElement('button'); b.className = 'itm' + (c.gold ? ' gold' : '') + (G && G.item === id ? ' on' : '');
      const cv = document.createElement('canvas'); cv.width = cv.height = 88; ART.card(cv, id); b.appendChild(cv);
      const n = document.createElement('i'); n.textContent = S.bag[id]; b.appendChild(n);
      b.onclick = () => { AU.unlock(); AU.play('click'); pickItem(id); };
      box.appendChild(b);
    });
  }
  function pickItem(id) {
    if (!G || G.won || G.busy) return;
    const c = CARD[id];
    if (c.k === 'now') {
      if (c.mv) { G.moves += c.mv; hud(); AU.play('water'); spend(id); bigText('+' + c.mv); $('over').classList.add('hide'); }
      else if (id === 'brush') { const b = G.sel && G.blobs.includes(G.sel) ? G.sel : G.blobs[0]; G.hist.push(snap()); b.v = G.goal.slice(); b.sq = 0.4; AU.play('use'); spend(id); check(); }
      return;
    }
    G.item = G.item === id ? null : id; G.knife = null; items();
  }
  function useOn(b) {
    const id = G.item, c = CARD[id];
    G.hist.push(snap());
    if (c.pig != null) { b.v[c.pig] += c.amt || 1; b.sq = 0.3; b.wob = 0.06; splash(b.x, b.y, [rgb(PIG[c.pig]), rgb(b.v)], 16); S.mixes[key(b.v)] = 1; }
    else if (id === 'rag') { G.blobs.splice(G.blobs.indexOf(b), 1); splash(b.x, b.y, [rgb(b.v)], 18); }
    else if (id === 'drop') {
      const m = b.v.indexOf(Math.max(...b.v)); b.v[m]--;
      if (!b.v.some((a) => a)) G.blobs.splice(G.blobs.indexOf(b), 1); else { b.sq = 0.25; S.mixes[key(b.v)] = 1; }
    } else if (id === 'knife') { G.hist.pop(); G.knife = b; G.item = null; items(); return; }
    AU.play('use'); spend(id); check();
  }

  // ── 이겼을 때: 방울이 빛나고 → 물감 방울들이 그림으로 날아가 → 그 구역이 붓질로 칠해진다
  const fxc = document.createElement('canvas'); fxc.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:7';
  document.body.appendChild(fxc); const fg = fxc.getContext('2d');
  let flies = [];
  function fx(dt) {
    if (!flies.length && !fxc._used) return;
    const w = innerWidth, h = innerHeight;
    if (fxc.width !== w || fxc.height !== h) { fxc.width = w; fxc.height = h; }
    fg.clearRect(0, 0, w, h); fxc._used = flies.length > 0;
    flies = flies.filter((f) => {
      f.t += dt; const k = Math.min(1, Math.max(0, (f.t - f.delay) / f.dur));
      if (k <= 0) return true;
      const e = 1 - Math.pow(1 - k, 3), x = f.x0 + (f.x1 - f.x0) * e, y = f.y0 + (f.y1 - f.y0) * e - Math.sin(k * Math.PI) * f.arc;
      fg.fillStyle = css(f.c, 1 - k * 0.3); fg.beginPath(); fg.arc(x, y, f.r * (1 - k * 0.5), 0, Math.PI * 2); fg.fill();
      fg.fillStyle = 'rgba(255,252,240,.6)'; fg.beginPath(); fg.arc(x - f.r * 0.3, y - f.r * 0.3, f.r * 0.25, 0, Math.PI * 2); fg.fill();
      if (k >= 1 && !f.hit) { f.hit = 1; if (f.onhit) f.onhit(); }
      return k < 1;
    });
  }
  function bigText(t, cls) { const b = $('big'); b.textContent = t; b.className = ''; void b.offsetWidth; b.className = 'on ' + (cls || ''); }
  function win(b) {
    G.won = true; G.sel = null; b.glowT = 0;
    const L = G.L, stars = G.used <= L.opt ? 3 : G.used <= L.opt + 1 ? 2 : 1;
    const first = !S.clr[G.i];
    S.clr[G.i] = Math.max(S.clr[G.i] || 0, stars); save();
    AU.play('match');
    setTimeout(() => bigText(['', 'NICE', 'GREAT', 'PERFECT'][stars], stars === 3 ? 'gold' : ''), 150);
    const P = paint(L.p), br = bc.getBoundingClientRect(), pr = $('pc').getBoundingClientRect();
    const [mx, my] = P.cent[L.q] || [PW / 2, PH / 2];
    const tx = pr.left + (mx / PW) * pr.width, ty = pr.top + (my / PH) * pr.height;
    const sx = br.left + cx(b.ax), sy = br.top + cy(b.ay), c = rgb(b.v);
    setTimeout(() => {
      b.glowT = null; b.glow = 0;
      G.blobs.splice(G.blobs.indexOf(b), 1); splash(b.x, b.y, [c], 20);
      for (let i = 0; i < 14; i++) flies.push({ x0: sx + (Math.random() - 0.5) * 30, y0: sy + (Math.random() - 0.5) * 30, x1: tx + (Math.random() - 0.5) * 60, y1: ty + (Math.random() - 0.5) * 40, c, r: 6 + Math.random() * 8, t: 0, delay: i * 0.03, dur: 0.55 + Math.random() * 0.15, arc: 60 + Math.random() * 80, onhit: i === 0 ? reveal : null });
    }, 700);
    function reveal() {
      AU.play('reveal');
      let p = 0;
      anim = (dt) => {
        p = Math.min(1, p + dt / 1.5);
        showPaint($('pc'), L.p, { k: L.q, p });
        if (p >= 1) { anim = null; paint(L.p).dirty = true; showPaint($('pc'), L.p); setTimeout(() => after(stars, first), 450); }
      };
    }
  }
  function after(stars, first) {
    const L = G.L;
    const allDone = Array.from({ length: 10 }, (_, q) => S.clr[li(L.p, q)]).every(Boolean);
    const fresh = allDone && !S.done[L.p];
    if (allDone) { S.done[L.p] = 1; save(); }
    openPick(stars, () => (fresh ? openDone(L.p) : goNext()));
  }
  function goNext() {
    const n = nextLevel();
    if (n >= 0 && LV[n].p === G.L.p) start(n); else openGallery();
  }

  // ── 카드 셋 중 하나
  function deal() {
    const norm = D.cards.filter((c) => !c.gold), gold = D.cards.filter((c) => c.gold), out = [];
    while (out.length < 3) {
      const pool = Math.random() < 0.08 ? gold : norm;
      const c = pool[Math.floor(Math.random() * pool.length)];
      if (!out.includes(c)) out.push(c);
    }
    return out;
  }
  function openPick(stars, then) {
    open('pick'); $('pickH').textContent = 'CLEAR';
    const st = $('stars').children;
    [...st].forEach((s) => s.classList.remove('on'));
    [0, 1, 2].forEach((k) => k < stars && setTimeout(() => { st[k].classList.add('on'); AU.play('star', k); }, 250 + k * 260));
    const box = $('cards'); box.innerHTML = ''; $('bPickOk').classList.add('hide');
    const hand = deal(); let chosen = false;
    hand.forEach((c, i) => {
      const el = document.createElement('div'); el.className = 'card' + (c.gold ? ' gold' : '') + (S.seen[c.id] ? '' : ' new');
      el.innerHTML = '<div class="b"></div><div class="f"><canvas width="220" height="220"></canvas><div class="n">' + c.name + '</div><div class="e">' + c.e + '</div></div>';
      ART.card(el.querySelector('canvas'), c.id);
      box.appendChild(el);
      const t0 = 1000 + stars * 120;
      if (c.gold) setTimeout(() => AU.play('shine'), t0 - 300);
      setTimeout(() => { el.classList.add('open'); AU.play(c.gold ? 'gold' : 'flip'); S.seen[c.id] = 1; save(); }, t0 + i * 260);
      el.onclick = () => {
        if (chosen || !el.classList.contains('open')) return;
        chosen = true; AU.play('card');
        S.bag[c.id] = (S.bag[c.id] || 0) + 1; save();
        [...box.children].forEach((o) => o !== el && o.classList.add('dimmed'));
        el.style.transform = 'rotateY(180deg) translateY(-14px) scale(1.06)';
        $('bPickOk').classList.remove('hide');
        $('bPickOk').onclick = () => { AU.play('click'); close(); if (!S.how4) openHow(then, true); else then(); };
      };
    });
  }

  // ── 화면
  const SCR = ['gal', 'sel', 'pick', 'dex', 'pause', 'over', 'done', 'how', 'end'];
  function show(which) {   // 바탕 화면: title | play
    $('title').classList.toggle('hide', which !== 'title');
    $('play').classList.toggle('hide', which !== 'play');
    $('topbar').classList.toggle('hide', which !== 'play');
    close();
  }
  function open(id) { SCR.forEach((s) => $(s).classList.toggle('hide', s !== id)); }
  function close() { SCR.forEach((s) => $(s).classList.add('hide')); }
  function chipCanvas(v) { const cv = document.createElement('canvas'); cv.width = cv.height = 84; ART.blob(cv.getContext('2d'), 42, 40, 26, rgb(v), 5); return cv; }

  function openGallery() {
    if (!$('play').classList.contains('hide')) show('title');
    $('title').classList.add('hide');
    open('gal');
    const box = $('galG'); box.innerHTML = '';
    for (let n = 1; n <= D.total; n++) {
      const b = document.createElement('button'); b.className = 'frm';
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 286; b.appendChild(cv);
      if (!unlocked(n)) b.classList.add('lock');
      else {
        const draw = () => showPaint(cv, n); draw(); setTimeout(draw, 300); setTimeout(draw, 1200);
        const cnt = Array.from({ length: 10 }, (_, q) => S.clr[li(n, q)]).filter(Boolean).length;
        const st = document.createElement('div'); st.className = 'st'; st.textContent = cnt + '/10'; b.appendChild(st);
        b.onclick = () => { AU.unlock(); AU.play('click'); openSel(n); };
      }
      box.appendChild(b);
    }
  }
  let selN = 1;
  function openSel(n) {
    selN = n; open('sel');
    $('selH').textContent = D.paints.find((p) => p.n === n).name;
    const cv = $('selPc'); showPaint(cv, n); setTimeout(() => showPaint(cv, n), 400);
    const box = $('chips'); box.innerHTML = '';
    let nx = -1;
    for (let q = 0; q < 10; q++) {
      const i = li(n, q), L = LV[i], s = S.clr[i] || 0;
      if (!s && nx < 0) nx = q;
      const b = document.createElement('button'); b.className = 'sw';
      b.appendChild(chipCanvas(L.goal));
      const st = document.createElement('b'); st.textContent = s ? '★'.repeat(s) : ' '; b.appendChild(st);
      const locked = !s && q !== nx;
      if (locked) b.classList.add('lock'); else b.onclick = () => { AU.play('click'); start(i); };
      if (q === nx) b.classList.add('next');
      box.appendChild(b);
    }
    $('bSelGo').onclick = () => { AU.play('click'); start(li(n, nx >= 0 ? nx : 0)); };
  }
  function openDone(n) {
    open('done'); AU.play('complete');
    const cv = $('donePc'); showPaint(cv, n);
    $('bDoneOk').onclick = () => {
      AU.play('click');
      if (avail.every((p) => S.done[p]) && avail.length === D.total && !S.ended) { S.ended = 1; save(); openEnd(); return; }
      const k = nextLevel(); if (k >= 0) start(k); else openGallery();
    };
  }
  // 엔딩: 열 장을 건 전시회. 도감을 다 채웠으면 금테
  function openEnd() {
    G = null; show('title'); $('title').classList.add('hide');
    open('end'); AU.play('complete');
    const full = D.cards.every((c) => S.seen[c.id]);
    $('endH').textContent = full ? 'MASTERPIECE' : 'THE END';
    $('endH').classList.toggle('gold', full);
    const box = $('endG'); box.innerHTML = '';
    for (let n = 1; n <= D.total; n++) {
      const f = document.createElement('div'); f.className = 'frm' + (full ? ' gold' : '');
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 286; f.appendChild(cv);
      const st = document.createElement('div'); st.className = 'st'; st.textContent = D.paints[n - 1].name; f.appendChild(st);
      box.appendChild(f);
      f.style.opacity = 0; f.style.transform = 'scale(.8)'; f.style.transition = 'opacity .5s, transform .5s cubic-bezier(.34,1.56,.64,1)';
      setTimeout(() => { showPaint(cv, n); f.style.opacity = 1; f.style.transform = 'none'; AU.play('star', n % 3); }, 500 + n * 260);
    }
    $('bEndOk').onclick = () => { AU.play('click'); title(); };
  }
  function openDex() {
    $('title').classList.add('hide');
    open('dex');
    const box = $('dexG'); box.innerHTML = '';
    const seen = D.cards.filter((c) => S.seen[c.id]).length;
    $('dexN').textContent = seen + '/' + D.cards.length;
    D.cards.forEach((c) => {
      const d = document.createElement('div'); d.className = 'it' + (S.seen[c.id] ? '' : ' unk') + (c.gold ? ' gold' : '');
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; ART.card(cv, c.id); d.appendChild(cv);
      const t = document.createElement('div'); t.textContent = S.seen[c.id] ? c.name : '?'; d.appendChild(t);
      box.appendChild(d);
    });
    const ks = Object.keys(S.mixes);
    $('mixH').textContent = 'COLORS ' + ks.length;
    const mb = $('mixes'); mb.innerHTML = '';
    ks.map((k) => k.split('').map(Number)).sort((a, b) => { const A = rgb(a), B = rgb(b); return hue(A) - hue(B); }).forEach((v) => { const i = document.createElement('i'); i.style.background = css(rgb(v)); mb.appendChild(i); });
  }
  function hue([r, g, b]) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (d < 0.08) return 400 + (1 - mx) * 100; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; }
  $('bDex').onclick = () => { AU.play('click'); openDex(); };
  $('bDexX').onclick = () => { AU.play('click'); openGallery(); };
  $('bGalX').onclick = () => { AU.play('click'); title(); };
  $('bSelX').onclick = () => { AU.play('click'); openGallery(); };
  $('tPause').onclick = () => { AU.play('click'); open('pause'); };
  $('bResume').onclick = () => { AU.play('click'); close(); };
  $('bQuit').onclick = () => { AU.play('click'); G = null; openGallery(); };
  $('bRetry').onclick = () => { AU.play('click'); close(); start(G.i); };
  $('bOverUndo').onclick = () => { close(); undo(); };
  function tog(id, on, set) { const b = $(id); b.classList.toggle('off', !on()); b.onclick = () => { AU.unlock(); set(!on()); b.classList.toggle('off', !on()); AU.play('click'); }; }
  tog('tBgm', () => AU.bgm, AU.setBgm); tog('tSfx', () => AU.snd, AU.setSnd);


  // ── 게임 설명(처음 START 때 한 번, 게임 중엔 ? 단추) — 2026-10-12 사장님 "게임설명이 첨에 있어야될거같애"
  let howRun = false;
  function openHow(then, only4) {
    $('title').classList.add('hide');
    open('how'); howRun = true;
    document.querySelector('#how .steps').classList.toggle('one', !!only4);
    document.querySelector('#how h2').textContent = only4 ? 'ITEM' : 'HOW TO PLAY';
    const cvs = [...document.querySelectorAll('#how .step canvas')], t0 = performance.now();
    const big = document.createElement('canvas'); big.width = PW; big.height = PH;
    const loop = (now) => {
      if (!howRun) return;
      const t = (now - t0) / 1000;
      howStep1(cvs[0].getContext('2d'), t % 2.8);
      howStep2(cvs[1].getContext('2d'), t % 3.6);
      howStep4(cvs[3].getContext('2d'), t % 3.6);
      const g3 = cvs[2].getContext('2d'), P = paint(1), tt = t % 5.5, bgc = big.getContext('2d');
      bgc.clearRect(0, 0, PW, PH);
      if (ready(P.sk)) bgc.drawImage(P.sk, 0, 0, PW, PH);
      if (P.masks && ready(P.img)) { const n = Math.floor(tt / 0.42); for (let k = 0; k < Math.min(10, n + 1); k++) drawRegion(bgc, P, k, k < n ? null : (tt % 0.42) / 0.42); }
      g3.clearRect(0, 0, 440, 320); g3.fillStyle = '#f1e6cc'; g3.fillRect(0, 0, 440, 320);
      g3.fillStyle = '#fbf6ea'; g3.fillRect(14, 30, 412, 246); g3.drawImage(big, 22, 38, 396, 230);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    $('bHowOk').onclick = () => { AU.unlock(); AU.play('click'); howRun = false; S.how = 1; if (only4) S.how4 = 1; save(); close(); then(); };
  }
  const cardImg = {};
  function cardCv(id) { if (!cardImg[id]) { const c = document.createElement('canvas'); c.width = c.height = 96; ART.card(c, id); cardImg[id] = c; } return cardImg[id]; }
  function howStep4(g, t) {
    g.clearRect(0, 0, 440, 320);
    // 판(왼쪽) + 가방(오른쪽 세로 줄)
    g.fillStyle = '#e2c08e'; ART.rrect(g, 30, 60, 250, 200, 36); g.fill();
    [[100, 160], [210, 160]].forEach(([x, y]) => { g.fillStyle = 'rgba(110,62,24,.25)'; g.beginPath(); g.arc(x, y, 44, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(240,215,170,.8)'; g.beginPath(); g.arc(x + 3, y + 4, 39, 0, Math.PI * 2); g.fill(); });
    const on = t > 0.6 && t < 1.6, used = t >= 1.6;
    [['tR', 70], ['cup', 175]].forEach(([id, y], i) => {
      const x = 320, sel = i === 0 && on, dy = sel ? -6 : 0;
      if (i === 0 && used) return;
      g.fillStyle = '#fbf6ea'; ART.rrect(g, x, y + dy, 80, 88, 8); g.fill();
      g.strokeStyle = sel ? '#d8473a' : 'rgba(0,0,0,.12)'; g.lineWidth = sel ? 5 : 1.5; g.stroke();
      g.drawImage(cardCv(id), x + 6, y + dy + 6, 68, 68);
    });
    const v = used ? [1, 1, 0, 0, 0] : [0, 1, 0, 0, 0];
    const w = used ? Math.max(0, 1 - (t - 1.6) * 3) : 0;
    ART.blob(g, 210, 152, 30 + (used ? 4 : 0), rgb(v), 7, { sx: 1 + w * 0.25, sy: 1 - w * 0.2 });
    const ks = []; v.forEach((a, k) => { for (let i = 0; i < a; i++) ks.push(k); });
    ks.forEach((k, i) => { const x = 210 - (ks.length - 1) * 9 + i * 18; g.fillStyle = '#fffaee'; g.beginPath(); g.arc(x, 198, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = css(rgb(PIG[k])); g.beginPath(); g.arc(x, 198, 6, 0, Math.PI * 2); g.fill(); });
    if (used && t < 2.1) for (let i = 0; i < 8; i++) { const a = i * 0.8, d = 36 + (t - 1.6) * 120; g.fillStyle = css(rgb(PIG[0]), 1 - (t - 1.6) * 2); g.beginPath(); g.arc(210 + Math.cos(a) * d, 152 + Math.sin(a) * d, 5, 0, Math.PI * 2); g.fill(); }
    if (t > 0.2 && t < 0.9) finger(g, 360, 110, t > 0.5);
    else if (t >= 0.9 && t < 1.8) { const k = ease((t - 0.9) / 0.4); finger(g, 360 + (210 - 360) * k, 110 + (152 - 110) * k, t > 1.35); }
  }

  const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
  function wells(g, xs, y, r) {
    g.clearRect(0, 0, 440, 320); g.fillStyle = '#e2c08e'; ART.rrect(g, 20, y - 70, 400, 140, 40); g.fill();
    xs.forEach((x) => { g.fillStyle = 'rgba(110,62,24,.25)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(240,215,170,.8)'; g.beginPath(); g.arc(x + 3, y + 4, r * 0.88, 0, Math.PI * 2); g.fill(); });
  }
  function finger(g, x, y, down) {
    g.save(); g.fillStyle = 'rgba(255,248,235,.95)'; g.strokeStyle = 'rgba(58,42,30,.8)'; g.lineWidth = 3;
    if (down) { g.strokeStyle = 'rgba(216,71,58,.6)'; g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'rgba(58,42,30,.8)'; }
    g.beginPath(); g.ellipse(x + 8, y + 26, 15, 30, -0.35, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fillStyle = 'rgba(216,71,58,.35)'; g.fill();
    g.restore();
  }
  function howStep1(g, t) {
    const xs = [100, 220, 340], y = 170;
    wells(g, xs, y, 46);
    const R = rgb(PIG[0]), B = rgb(PIG[2]);
    const k = ease((t - 0.9) / 0.5), merged = t > 1.4;
    if (!merged) { ART.blob(g, 340, y, 34, B, 3); ART.blob(g, 100 + (340 - 44 - 100) * k, y, 34, R, 5); }
    else { const w = Math.max(0, 1 - (t - 1.4) * 3); ART.blob(g, 340, y, 40, rgb([1, 0, 1, 0, 0]), 3, { sx: 1 + w * 0.3, sy: 1 - w * 0.25 }); }
    if (t > 1.4 && t < 1.9) for (let i = 0; i < 8; i++) { const a = i * 0.8, d = 40 + (t - 1.4) * 120; g.fillStyle = css(i % 2 ? R : B, 1 - (t - 1.4) * 2); g.beginPath(); g.arc(340 + Math.cos(a) * d, y + Math.sin(a) * d, 6, 0, Math.PI * 2); g.fill(); }
    if (t > 0.2 && t < 1.3) { const fx = 100 + 120 * ease((t - 0.5) / 0.5); finger(g, fx, y + 10, t > 0.4); }
    if (t > 0.5 && t < 1.0) { g.fillStyle = 'rgba(255,250,235,.9)'; g.beginPath(); g.moveTo(170, y - 60); g.lineTo(150, y - 74); g.lineTo(150, y - 46); g.closePath(); g.fill(); g.fillRect(110, y - 64, 42, 8); }
  }
  function howStep2(g, t) {
    const xs = [220, 300, 380], y = 200, goal = [0, 1, 0, 0, 2];
    wells(g, xs, y, 36);
    // 견본 카드
    g.fillStyle = '#fbf6ea'; ART.rrect(g, 30, 40, 120, 150, 8); g.fill(); g.strokeStyle = 'rgba(0,0,0,.1)'; g.stroke();
    ART.blob(g, 90, 95, 36, rgb(goal), 11);
    [1, 4, 4].forEach((p, i) => ART.blob(g, 64 + i * 26, 160, 10, rgb(PIG[p]), 3 + i));
    const Y = rgb(PIG[1]), K = rgb(PIG[4]);
    const k1 = ease((t - 0.5) / 0.35), k2 = ease((t - 1.4) / 0.4);
    if (t < 0.85) { ART.blob(g, 220, y, 27, Y, 2); ART.blob(g, 300 + 46 * k1, y, 27, K, 4); ART.blob(g, 380, y, 27, K, 6); }
    else if (t < 1.8) { ART.blob(g, 220 + (380 - 40 - 220) * k2, y, 27, Y, 2); ART.blob(g, 380, y, 32, rgb([0, 0, 0, 0, 2]), 6); }
    else {
      const glow = 0.6 + 0.4 * Math.sin(t * 10);
      ART.blob(g, 380, y, 36, rgb(goal), 6, { glow });
      g.strokeStyle = 'rgba(242,184,30,' + Math.min(1, (t - 1.8) * 3) + ')'; g.lineWidth = 6; g.beginPath(); g.arc(90, 95, 50, 0, Math.PI * 2); g.stroke();
    }
    if (t > 0.2 && t < 0.9) finger(g, 300 + 46 * k1, y + 8, t > 0.4);
    if (t > 1.05 && t < 1.8) finger(g, 220 + (340 - 220) * k2, y + 8, t > 1.25);
    g.font = "400 30px 'Star'"; g.fillStyle = '#3a2a1e'; g.textAlign = 'center'; g.fillText('MOVES 2', 300, 80);
  }
  $('tHow').onclick = () => { AU.play('click'); openHow(close); };

  // ── 타이틀: 지금 칠하는 그림 위에 제목
  function title() {
    G = null; show('title');
    const n = Math.max(1, ...avail.filter(unlocked));
    const cv = $('tPc'); showPaint(cv, n); setTimeout(() => showPaint(cv, n), 300); setTimeout(() => showPaint(cv, n), 1200);
    const box = $('tBtns'); box.innerHTML = '';
    const go = document.createElement('button'); go.className = 'btn'; go.textContent = 'START';
    go.onclick = () => { AU.unlock(); AU.play('click'); const k = nextLevel(); const run = () => (k < 0 ? openGallery() : start(k)); if (!S.how) openHow(run); else run(); };
    box.appendChild(go);
    if (Object.keys(S.clr).length) {
      const gl = document.createElement('button'); gl.className = 'btn alt'; gl.style.setProperty('--c', '#2f63b8'); gl.textContent = 'GALLERY';
      gl.onclick = () => { AU.unlock(); AU.play('click'); openGallery(); };
      box.appendChild(gl);
    }
  }
  // 미리 그림을 불러 둔다
  avail.filter(unlocked).forEach((n) => paint(n));
  title();
  window.CM = { cellXY: (x, y) => { const r = bc.getBoundingClientRect(); return [r.left + cx(x), r.top + cy(y)]; }, S, start, openHow, openEnd, LV, get G() { return G; }, push, openGallery, openSel, openDex, openPick, win: () => win(G.blobs[0]) };
})();
