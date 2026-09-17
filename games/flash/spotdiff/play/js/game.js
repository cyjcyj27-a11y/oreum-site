// 틀린그림찾기: 진행·화면·입력
(function () {
  const $ = (id) => document.getElementById(id);
  // 영문판: ?lang=en
  const EN = /[?&]lang=en/i.test(location.search);
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'Spot the Difference';
    const h = document.querySelector('#title h1');
    h.textContent = 'SPOT THE DIFFERENCE';
    h.setAttribute('data-txt', 'SPOT THE DIFFERENCE');
    h.classList.add('en');
    $('start').textContent = 'START';
  }
  const SCENES = [
    { id: 'bedroom', ko: '아이 방', en: 'Kids Room' },
    { id: 'kitchen', ko: '부엌', en: 'Kitchen' },
    { id: 'cafe', ko: '카페', en: 'Cafe' },
    { id: 'school', ko: '교실', en: 'Classroom' },
    { id: 'camp', ko: '캠핑장', en: 'Campsite' },
    { id: 'beach', ko: '바닷가', en: 'Beach' },
  ];
  const PER = 10;
  const TOTAL = SCENES.length * PER;
  const KEY = 'spotdiff.prog';

  // ── 저장
  let prog = { open: 1, last: 1, stars: {}, hints: 3 };
  try { Object.assign(prog, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const saveProg = () => { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) {} };

  // ── 판 정보
  function info(s) {
    const endless = s > TOTAL;
    const si = endless ? (s * 7) % SCENES.length : Math.floor((s - 1) / PER) % SCENES.length;
    const k = (s - 1) % PER; // 방 안에서 몇 번째
    const round = Math.floor((s - 1) / PER); // 몇 번째 방
    let count = 5 + (k >= 5 ? 1 : 0) + Math.min(2, Math.floor(round / 2));
    let lv = Math.min(5, Math.floor(round * 0.8 + k / 5));
    if (endless) { count = 8; lv = 5; }
    const time = 60;
    return { s, scene: SCENES[si].id, room: si, night: k >= 7, count, lv, time, seed: s * 7919 + 13 };
  }

  // ── 상태
  const st = { mode: 'title', stage: 1, diffs: [], found: [], left: 0, total: 1, paused: false, t0: 0, miss: 0, hintOn: null, over: false };
  window.__sd = { st, info, prog };

  const board = $('board'), picA = $('picA'), picB = $('picB');
  const cvA = $('cvA'), cvB = $('cvB'), fxA = $('fxA'), fxB = $('fxB');

  // ── 배치
  function layout() {
    const tb = $('topbar').getBoundingClientRect();
    const top = st.mode === 'play' ? Math.max(48, tb.height) : 48;
    const W = innerWidth - 16, H = innerHeight - top - 10;
    const gap = 10;
    const rowW = Math.min((W - gap) / 2, (H * 4) / 3);
    const colW = Math.min(W, ((H - gap) / 2) * (4 / 3));
    const row = rowW >= colW;
    const w = Math.floor(row ? rowW : colW), h = Math.floor((w * 3) / 4);
    board.classList.toggle('col', !row);
    board.style.top = top + 'px';
    [picA, picB].forEach((p) => { p.style.width = w + 'px'; p.style.height = h + 'px'; });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pw = Math.round(w * dpr);
    if (pw > 1600) pw = 1600;
    const ph = Math.round((pw * 3) / 4);
    return { pw, ph, w, h };
  }

  let lastSize = '';
  function sizeCanvases() {
    const L = layout();
    const key = L.pw + 'x' + L.ph;
    [fxA, fxB].forEach((c) => { c.width = L.pw; c.height = L.ph; });
    if (key !== lastSize && st.mode === 'play' && st.diffs.length) {
      lastSize = key;
      cvA.width = cvB.width = L.pw;
      cvA.height = cvB.height = L.ph;
      S.paint(cvA, cvB, st.diffs);
    }
    lastSize = key;
    drawFx();
    return L;
  }
  addEventListener('resize', () => { if (st.mode !== 'title') sizeCanvases(); else drawTitle(); });

  // ── 판 시작
  let overT = 0;
  function startStage(s) {
    clearTimeout(overT);   // 앞 판 GAME OVER 창이 새 판 위에 늦게 뜨지 않게
    st.over = true;        // 판을 짓는 동안은 시계를 멈춘다 — 남은 시간이 아직 0이라 곧장 GAME OVER 가 났다(2026-09-17 사장님 "접속하면 리트라이 뜨고 힌트버튼도 안먹힘")
    st.mode = 'play';
    st.stage = s;
    prog.last = s;
    saveProg();
    const I = info(s);
    st.I = I;
    document.body.classList.add('playing');
    $('title').classList.add('off');
    $('titleBg').classList.add('off');
    $('end').classList.remove('on');
    $('sheet').classList.remove('on');
    $('loading').hidden = false;
    board.style.visibility = 'hidden';
    if (window.OG) OG.start({ stage: s });
    $('stage').textContent = s > TOTAL ? 'STAGE ∞' : 'STAGE ' + s;
    setTimeout(() => {
      S.build(I.scene, I.seed, { night: I.night });
      st.diffs = S.pick(I.count, I.lv, I.seed);
      st.found = st.diffs.map(() => false);
      st.total = I.time;
      st.left = I.time;
      st.miss = 0;
      st.over = false;
      st.hintOn = null;
      st.hints = 2;
      st.marks = [];
      const L = layout();
      cvA.width = cvB.width = L.pw;
      cvA.height = cvB.height = L.ph;
      S.paint(cvA, cvB, st.diffs);
      lastSize = L.pw + 'x' + L.ph;
      sizeCanvases();
      makeDots();
      hud();
      $('loading').hidden = true;
      board.style.visibility = '';
      st.last = performance.now();
      setPause(false);
    }, 30);
  }

  function makeDots() {
    const d = $('dots');
    d.innerHTML = '';
    st.diffs.forEach(() => d.appendChild(document.createElement('span')));
  }

  function hud() {
    const n = st.found.filter(Boolean).length;
    [...$('dots').children].forEach((e, i) => e.classList.toggle('on', i < n));
    const r = Math.max(0, st.left / st.total);
    $('tfill').style.width = r * 100 + '%';
    $('tbar').classList.toggle('low', r < 0.25);
    $('tnum').textContent = Math.ceil(Math.max(0, st.left));
    $('hints').textContent = st.hints;
    $('bHint').disabled = st.hints <= 0;
  }

  // ── 시간
  let lastTick = 0;
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
    if (st.hintOn && performance.now() > st.hintOn.until) { st.hintOn = null; drawFx(); }
    else if (st.hintOn) drawFx();
  }
  window.__sd.tick = (sec) => tick(sec);

  // ── 누르기
  function onTap(e) {
    if (st.mode !== 'play' || st.paused || st.over) return;
    AU.unlock();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    tapAt(x, y, e.currentTarget);
  }
  function tapAt(x, y, pic) {
    let best = -1, bd = 1e9;
    st.diffs.forEach((d, i) => {
      if (st.found[i]) return;
      const b = d.box;
      const pad = 0.025;
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const hw = Math.max((b.x1 - b.x0) / 2, 0.03) + pad;
      const hh = Math.max((b.y1 - b.y0) / 2, 0.04) + pad;
      if (Math.abs(x - cx) <= hw && Math.abs(y - cy) <= hh) {
        const dd = Math.hypot(x - cx, y - cy);
        if (dd < bd) { bd = dd; best = i; }
      }
    });
    if (best >= 0) {
      st.found[best] = true;
      const n = st.found.filter(Boolean).length;
      AU.play('hit', n - 1);
      if (st.hintOn && st.hintOn.i === best) st.hintOn = null;
      pop(best);
      hud();
      if (n === st.diffs.length) setTimeout(clear, 650);
    } else {
      st.miss++;
      st.left = Math.max(0, st.left - 5);
      AU.play('miss');
      st.marks.push({ x, y, until: performance.now() + 700 });
      pic.classList.remove('shake');
      void pic.offsetWidth;
      pic.classList.add('shake');
      drawFx();
      setTimeout(drawFx, 720);
      hud();
      if (st.left <= 0) gameOver();
    }
  }
  window.__sd.tap = (x, y) => tapAt(x, y, picA);
  picA.addEventListener('pointerdown', onTap);
  picB.addEventListener('pointerdown', onTap);

  // 찾은 동그라미가 커지며 나타난다
  const anim = {};
  function pop(i) {
    anim[i] = performance.now();
    drawFx();
    const t0 = performance.now();
    const step = () => {
      drawFx();
      if (performance.now() - t0 < 400) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(drawFx, 450);
  }

  function ring(g, W, H, d, color, k, dash, thick, minR) {
    const b = d.box;
    const cx = ((b.x0 + b.x1) / 2) * W, cy = ((b.y0 + b.y1) / 2) * H;
    const rx = Math.max(((b.x1 - b.x0) / 2) * W * 1.25, W * (minR || 0.035)) * k;
    const ry = Math.max(((b.y1 - b.y0) / 2) * H * 1.25, W * (minR || 0.035)) * k;
    const lw = Math.max(3, W * 0.007) * (thick || 1);
    g.setLineDash(dash ? [lw * 2.5, lw * 1.8] : []);
    g.lineWidth = lw * 2.2;
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.stroke();
    g.lineWidth = lw;
    g.strokeStyle = color;
    g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.stroke();
    g.setLineDash([]);
  }

  function drawFx() {
    const now = performance.now();
    [fxA, fxB].forEach((c) => {
      const g = c.getContext('2d');
      const W = c.width, H = c.height;
      g.clearRect(0, 0, W, H);
      if (st.mode !== 'play') return;
      st.diffs.forEach((d, i) => {
        if (st.found[i]) {
          const t = anim[i] ? Math.min(1, (now - anim[i]) / 350) : 1;
          const k = 1.6 - 0.6 * (1 - Math.pow(1 - t, 3));
          ring(g, W, H, d, '#3ee07a', k);
        } else if (st.over) {
          ring(g, W, H, d, '#ff4d4d', 1);
        }
      });
      if (st.hintOn) {   // 폰에서 안 보였다(가는 점선이 깜빡여 꺼진 때가 반) — 굵은 실선이 꺼지지 않고 맥박 친다(2026-09-17 사장님 "힌트버튼 안먹히고")
        const p = (Math.sin(now / 110) + 1) / 2;
        ring(g, W, H, st.diffs[st.hintOn.i], '#ffd23f', 1.15 + p * 0.35, false, 2.4, 0.07);
      }
      (st.marks || []).forEach((m) => {
        if (m.until < now) return;
        const s = W * 0.03, x = m.x * W, y = m.y * H;
        g.lineCap = 'round';
        g.lineWidth = W * 0.012;
        g.strokeStyle = 'rgba(0,0,0,.35)';
        g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke();
        g.lineWidth = W * 0.007;
        g.strokeStyle = '#ff4d4d';
        g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke();
      });
    });
    if (st.marks) st.marks = st.marks.filter((m) => m.until >= now);
  }

  // ── 힌트
  function useHint() {
    if (st.mode !== 'play' || st.paused || st.over || st.hints <= 0) return;
    const left = st.diffs.map((d, i) => i).filter((i) => !st.found[i]);
    if (!left.length) return;
    st.hints--;
    AU.play('hint');
    st.hintOn = { i: left[Math.floor(Math.random() * left.length)], until: performance.now() + 3500 };
    hud();
    drawFx();
    const pulse = () => { if (!st.hintOn) return drawFx(); drawFx(); requestAnimationFrame(pulse); };   // 시계(0.1초)보다 부드럽게
    requestAnimationFrame(pulse);
  }
  $('bHint').onclick = useHint;

  // ── 끝
  function word(t, ms) {
    const w = $('word');
    w.textContent = t;
    w.classList.add('on');
    setTimeout(() => w.classList.remove('on'), ms || 900);
  }

  function clear() {
    if (st.over) return;
    st.over = true;
    if (window.OG) OG.over({ result: 'CLEAR', stage: st.stage, score: Math.ceil(st.left) });
    const r = st.left / st.total;
    const stars = r >= 0.45 ? 3 : r >= 0.2 ? 2 : 1;
    const s = st.stage;
    const had = prog.stars[s] || 0;
    if (stars > had) prog.stars[s] = stars;
    if (s <= TOTAL) prog.open = Math.max(prog.open, s + 1);
    saveProg();
    AU.play('clear');
    const allClear = s === TOTAL;
    $('endTitle').textContent = allClear ? 'ALL CLEAR' : st.miss === 0 ? 'PERFECT' : 'CLEAR';
    $('endSub').textContent = allClear ? '⭐ ' + starSum() + ' / ' + TOTAL * 3 : '';
    const es = $('endStars');
    es.innerHTML = '<span class="dim">★</span><span class="dim">★</span><span class="dim">★</span>';
    for (let i = 0; i < stars; i++) setTimeout(() => { es.children[i].className = ''; AU.play('star', i); }, 350 + i * 260);
    $('endNext').hidden = false;
    $('end').classList.add('on');
    hud();
  }

  function gameOver() {
    if (st.over) return;
    st.over = true;
    if (window.OG) OG.over({ result: 'GAME OVER', stage: st.stage, score: st.found.filter(Boolean).length });
    AU.play('over');
    drawFx();
    overT = setTimeout(() => {
      $('endTitle').textContent = 'GAME OVER';
      $('endStars').innerHTML = '';
      $('endSub').textContent = st.found.filter(Boolean).length + ' / ' + st.diffs.length;
      $('endNext').hidden = true;
      $('end').classList.add('on');
    }, 1400);
  }

  $('endNext').onclick = () => { AU.play('click'); startStage(st.stage + 1); };
  $('endRetry').onclick = () => { AU.play('click'); startStage(st.stage); };
  $('endList').onclick = () => { AU.play('click'); openList(); };

  // ── 멈춤·소리
  function setPause(v) {
    st.paused = v;
    $('pauseCover').hidden = !v;
    $('tPause').classList.toggle('off', v);
    board.style.visibility = v ? 'hidden' : '';
  }
  $('tPause').onclick = () => setPause(!st.paused);
  $('pauseCover').onclick = () => setPause(false);
  const tMus = $('tMus'), tSnd = $('tSnd');
  function syncTog() { tMus.classList.toggle('off', !AU.bgm); tSnd.classList.toggle('off', !AU.snd); }
  tMus.onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); syncTog(); };
  tSnd.onclick = () => { AU.unlock(); AU.setSnd(!AU.snd); syncTog(); };
  syncTog();
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'm') tMus.onclick();
    else if (k === 'k') tSnd.onclick();
    else if ((k === 'p' || k === 'escape') && st.mode === 'play' && !st.over) setPause(!st.paused);
    else if (k === 'h') useHint();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && st.mode === 'play' && !st.over) setPause(true); });

  // ── 스테이지 목록
  const thumbs = {};
  function thumb(ri) {
    if (thumbs[ri]) return thumbs[ri];
    const c = document.createElement('canvas');
    c.width = 240; c.height = 180;
    S.build(SCENES[ri].id, ri * 101 + 5, {});
    S.draw(c);
    return (thumbs[ri] = c.toDataURL('image/jpeg', 0.8));
  }
  function starSum() { return Object.values(prog.stars).reduce((a, b) => a + b, 0); }
  function openList() {
    const L = $('list');
    L.innerHTML = '';
    const needRebuild = st.mode === 'play';
    SCENES.forEach((sc, ri) => {
      let sum = 0;
      for (let k = 1; k <= PER; k++) sum += prog.stars[ri * PER + k] || 0;
      const h = document.createElement('div');
      h.className = 'room';
      h.innerHTML = '<img src="' + thumb(ri) + '"><span>' + (document.documentElement.lang === 'en' ? sc.en : sc.ko) + '</span><span class="st">⭐ ' + sum + '/' + PER * 3 + '</span>';
      L.appendChild(h);
      const gr = document.createElement('div');
      gr.className = 'grid';
      for (let k = 1; k <= PER; k++) {
        const s = ri * PER + k;
        const b = document.createElement('button');
        b.className = 'cell' + (s > prog.open ? ' lock' : '') + (s === prog.last ? ' cur' : '');
        const n = prog.stars[s] || 0;
        b.innerHTML = s + '<small>' + '★'.repeat(n) + '</small>';
        if (s <= prog.open) b.onclick = () => { AU.unlock(); AU.play('click'); startStage(s); };
        gr.appendChild(b);
      }
      L.appendChild(gr);
    });
    if (prog.open > TOTAL) {
      const gr = document.createElement('div');
      gr.className = 'grid';
      gr.style.marginTop = '18px';
      const b = document.createElement('button');
      b.className = 'cell';
      b.innerHTML = '∞<small></small>';
      b.onclick = () => { AU.play('click'); startStage(Math.max(TOTAL + 1, prog.last)); };
      gr.appendChild(b);
      L.appendChild(gr);
    }
    $('starSum').textContent = starSum();
    $('sheet').classList.add('on');
    if (st.mode === 'play' && !st.over) setPause(true);
    // 썸네일 때문에 장면이 바뀌었으면 판 장면을 다시 짓는다
    if (needRebuild && st.I) {
      S.build(st.I.scene, st.I.seed, { night: st.I.night });
      st.diffs = S.pick(st.I.count, st.I.lv, st.I.seed);
    }
  }
  $('bList').onclick = () => { AU.play('click'); openList(); };
  $('bClose').onclick = () => {
    $('sheet').classList.remove('on');
    if (st.mode === 'title') return;
  };

  // ── 타이틀
  function drawTitle() {
    const c = $('cvT');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    if (!w || !h) return; // 창이 숨어 있으면 크기가 생길 때(resize) 다시 그린다
    // 4:3 그림을 화면 가득 (object-fit: cover)
    const pw = Math.min(1800, Math.round(Math.max(w, (h * 4) / 3) * dpr));
    c.width = pw;
    c.height = Math.round((pw * 3) / 4);
    const I = info(Math.min(prog.last, TOTAL));
    S.build(I.scene, 4242, {});
    S.draw(c);
  }
  $('start').onclick = () => { AU.unlock(); AU.play('click'); startStage(Math.min(prog.last, prog.open) || 1); };
  $('toList').onclick = () => { AU.unlock(); AU.play('click'); openList(); };
  $('toList').hidden = prog.open <= 1;
  if (prog.last > 1 || prog.open > 1) $('start').textContent = document.documentElement.lang === 'en' ? 'CONTINUE' : '이어하기';
  drawTitle();
  document.addEventListener('pointerdown', () => AU.unlock(), { once: true });
})();
