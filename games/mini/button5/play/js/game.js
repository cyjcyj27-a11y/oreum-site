// 5억년 버튼 — 게임 흐름
(function () {
  'use strict';
  const D = window.B5D, A = window.B5A, ART = window.B5ART, T = D.T;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const RES_KEYS = ['line', 'num', 'stone', 'tower', 'km', 'word', 'statue'];
  const POSE = { scratch: 'scratch', count: 'count', dig: 'dig', stack: 'stack', walk: 'walk', talk: 'talk', carve: 'carve' };
  const SND = { scratch: 'scratch', count: 'count', dig: 'dig', stack: 'stack', walk: 'walk', talk: 'talk', carve: 'carve' };

  // ── 저장되는 상태 ───────────────────────────────────────
  function fresh() {
    const r = {}; RES_KEYS.forEach(k => r[k] = 0);
    const lv = {}; D.ACTS.forEach(a => lv[a.id] = 1);
    return { v: 1, money: 0, presses: 0, totalYears: 0, tripYears: 0, inVoid: false, pending: 0,
      owned: {}, res: r, ever: Object.assign({}, r), lv, found: 0, readN: 0, ended: false, started: false,
      drw: { n: 0, pics: [], murals: 0 } };
  }
  let S = fresh();
  function load() {
    try { const j = JSON.parse(localStorage.getItem('button5.save') || 'null'); if (j && j.v === 1) { S = Object.assign(fresh(), j); RES_KEYS.forEach(k => { if (S.res[k] == null) S.res[k] = 0; if (S.ever[k] == null) S.ever[k] = 0; }); if (!S.drw || !S.drw.pics) S.drw = { n: 0, pics: [], murals: 0 }; } } catch (e) {}
  }
  let noSave = false;
  function save() { if (noSave) return; try { localStorage.setItem('button5.save', JSON.stringify(S)); } catch (e) {} }
  load();

  // ── 이번 판에만 쓰는 상태 ───────────────────────────────
  const R = { scene: 'title', t: 0, focus: 0.3, bore: {}, auto: {}, cool: {}, memFx: { list: {}, sea: 0 }, pose: 'idle', poseP: 1,
    walkBlend: 0, walkPh: 0, walkOff: 0, lastWalk: -9, parts: [], pulse: 0, busy: false, pressed: false, dogHappy: 0,
    unlocked: '', tab: 'act', ending: null, cw: 0, ch: 0, land: false, lastUi: 0, me: null, hit: {}, msgQ: [], msgT: 0 };
  D.ACTS.forEach(a => { R.bore[a.id] = 0; R.auto[a.id] = 0; });

  const houseTier = () => D.SHOP.reduce((m, it) => (it.house && S.owned[it.id] ? Math.max(m, it.house) : m), 0);
  const memList = () => D.SHOP.filter(it => it.mem && S.owned[it.id]);
  const unlockedActs = () => D.ACTS.filter(a => a.unlock(S));
  function decodedN() { let n = 0; while (n < S.found && S.ever.word >= D.MSGS[n].words) n++; return n; }

  // ── 화면 짜임: 그림은 남은 칸 전부, 조작부는 전용 칸 ─────────────────
  function fit() {
    const W = innerWidth, H = innerHeight, land = W > H * 1.05;
    R.land = land;
    const panel = $('panel');
    let pw = 0, ph = 0;
    if (R.scene === 'void') { if (land) pw = R.drw ? clamp(W * 0.2, 150, 240) : clamp(W * 0.36, 250, 420); else ph = R.drw ? clamp(H * 0.16, 110, 140) : clamp(H * 0.45, 250, 360); }
    else if (R.scene === 'room') { if (land) pw = clamp(W * 0.22, 170, 260); else ph = clamp(H * 0.14, 86, 120); }
    panel.classList.toggle('land', land);
    panel.classList.toggle('drawing', !!R.drw && R.scene === 'void');
    if (pw) Object.assign(panel.style, { left: (W - pw) + 'px', top: '0', width: pw + 'px', height: H + 'px' });
    else Object.assign(panel.style, { left: '0', top: (H - ph) + 'px', width: W + 'px', height: ph + 'px' });
    R.cw = W - pw; R.ch = H - ph;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(R.cw * dpr); cv.height = Math.round(R.ch * dpr);
    cv.style.width = R.cw + 'px'; cv.style.height = R.ch + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    $('topbar').style.width = R.cw + 'px';
    R.tbH = $('topbar').getBoundingClientRect().height;
    if (R.drw) placeDrawX();
    setTimeout(() => fitAll(), 0);
    const mp = $('msgPop'); Object.assign(mp.style, { left: '0', top: '0', width: R.cw + 'px', height: R.ch + 'px' });
  }
  addEventListener('resize', fit);


  // ── 넘치는 글자는 칸에 맞을 때까지 글자를 줄인다(영문 긴 단어 등, 2026-09-29 사장님 "글자크기를 줄여서 해결해") ──
  const FIT_SEL = '.card .nm, .card .vl, .mem span, .row .nm, .row .pr, .tab, #roomP .btn, #drawDone, #title .btns .btn, .stat b';
  function fitEl(el) {
    if (!el || !el.isConnected) return;
    el.style.fontSize = '';
    const box = el.matches('.mem span') ? el.parentElement : el;
    const cs = getComputedStyle(el); let fs = parseFloat(cs.fontSize); const min = Math.max(el.matches('.card .vl') ? 8 : 9, fs * 0.45);
    let guard = 40;
    while (box.scrollWidth > box.clientWidth + 0.5 && fs > min && guard--) { fs -= 0.5; el.style.fontSize = fs + 'px'; }
  }
  function fitAll(root) { (root || document).querySelectorAll(FIT_SEL).forEach(fitEl); }
  addEventListener('resize', () => setTimeout(() => fitAll(), 0));

  // ── 상단바 ─────────────────────────────────────────────
  function topbar() {
    const tb = $('topbar');
    const yrs = `<div class="stat"><b id="sYrs"></b><span>/ ${T('138억', '13.8B yrs')}</span></div>`;
    const logs = `<div class="stat btnlike" id="sLog"><span>${T('흔적', 'TRACES')}</span><b id="sMsg"></b></div>`;
    const money = `<div class="stat gold"><b id="sMoney"></b></div>`;
    tb.innerHTML = (R.scene === 'room' ? money + yrs : yrs + logs) + '<div class="spacer"></div>' +   // 방에는 흔적 단추가 아래 칸에 있다
      `<span class="togs"><button class="tog${A.AU.bgmOn ? '' : ' off'}" id="tBgm" title="BGM">${ICON_BGM}</button><button class="tog${A.AU.sfxOn ? '' : ' off'}" id="tSfx" title="SFX">${ICON_SFX}</button></span>`;
    if ($('sLog')) $('sLog').onclick = () => { A.init(); openLog(); };
    $('tBgm').onclick = e => { A.init(); A.setBgm(!A.AU.bgmOn); e.currentTarget.classList.toggle('off', !A.AU.bgmOn); };
    $('tSfx').onclick = e => { A.init(); A.setSfx(!A.AU.sfxOn); e.currentTarget.classList.toggle('off', !A.AU.sfxOn); };
    tbUpdate(); R.tbH = $('topbar').getBoundingClientRect().height;
  }
  // 소리 단추 기호(음표·스피커) — 이모지가 아니라 직접 그린 흰 그림
  const ICON_BGM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17.5V5.5l11-2.5v12" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="6.3" cy="17.8" rx="3.4" ry="2.7" fill="#fff"/><ellipse cx="17.3" cy="15.3" rx="3.4" ry="2.7" fill="#fff"/></svg>';
  const ICON_SFX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h4l5-4.5v15L7 15H3z" fill="#fff"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
  let shownMoney = 0;
  function tbUpdate() {
    const y = $('sYrs'); if (y) y.textContent = D.yearsShort(S.totalYears);
    const m = $('sMsg'); if (m) m.textContent = decodedN() + '/12';
    const mo = $('sMoney'); if (mo) mo.textContent = D.won(shownMoney);
  }

  // ── 알림 ───────────────────────────────────────────────
  let toastT = 0;
  function toast(txt, gold) {
    const el = $('toast'); el.textContent = txt; el.classList.toggle('gold', !!gold);
    el.style.left = (R.cw / 2) + 'px'; el.style.top = (R.drw ? R.ch * 0.7 : Math.max(R.ch * (R.scene === 'void' ? 0.3 : 0.34), (R.tbH || 0) + 50)) + 'px';
    el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 1500);
  }
  function ask(txt, yes) {
    $('askT').textContent = txt; $('ask').classList.remove('hide');
    $('askY').onclick = () => { $('ask').classList.add('hide'); yes(); };
    $('askN').onclick = () => $('ask').classList.add('hide');
  }
  $('ask').addEventListener('pointerdown', e => { if (e.target.id === 'ask') $('ask').classList.add('hide'); });

  // ── 제목 ───────────────────────────────────────────────
  function showTitle() {
    R.scene = 'title'; document.body.classList.remove('playing', 'inroom');
    $('title').classList.remove('hide'); $('panel').classList.add('hide'); $('topbar').classList.add('hide');
    const has = S.started && !S.ended;
    $('bStart').textContent = has ? T('이어하기', 'CONTINUE') : 'START';
    setTimeout(() => fitAll($('title')), 0);
    $('bNew').classList.toggle('hide', !has);
    $('bNew').style.display = has ? '' : 'none'; fitAll($('title'));
    $('tEnd').style.display = S.ended ? '' : 'none';
    fit();
  }
  $('bStart').onclick = () => {
    A.init(); A.SFX.tap();
    if (S.ended) { const keep = S; S = fresh(); S.ended = false; void keep; }
    S.started = true; save();
    $('title').classList.add('hide');
    if (S.inVoid) enterVoid(true); else enterRoom(false);
  };
  $('bNew').onclick = () => { A.init(); ask(T('처음부터 할까요?', 'Start over?'), () => { S = fresh(); S.started = true; save(); $('title').classList.add('hide'); enterRoom(false); }); };

  // ── 방 ─────────────────────────────────────────────────
  function enterRoom(paid) {
    R.scene = 'room'; R.busy = false; R.pressed = false;
    document.body.classList.add('inroom'); document.body.classList.remove('playing');
    $('panel').classList.remove('hide'); $('roomP').style.display = ''; $('voidP').style.display = 'none';
    $('topbar').classList.remove('hide');
    fit(); topbar(); A.setMode('room'); fitAll();
    if (paid) {
      const from = S.money - paid, to = S.money, t0 = performance.now();
      shownMoney = from;
      const step = () => { const k = Math.min(1, (performance.now() - t0) / 1200); shownMoney = from + (to - from) * (1 - Math.pow(1 - k, 3)); tbUpdate(); if (k < 1) requestAnimationFrame(step); else { shownMoney = to; tbUpdate(); } };
      setTimeout(() => { A.SFX.cash(); toast('+' + D.won(paid), true); step(); }, 700);
    } else { shownMoney = S.money; tbUpdate(); }
  }
  function pressButton() {
    if (R.busy || R.scene !== 'room') return;
    R.busy = true; R.pressed = true; A.init(); A.SFX.press();
    S.pending = D.offer(S.presses);
    fadeTo(1, 1100, () => { S.inVoid = true; S.tripYears = 0; save(); enterVoid(false); fadeTo(0, 1600); });
  }

  // ── 5억 년 ─────────────────────────────────────────────
  function enterVoid(resume) {
    R.scene = 'void'; R.busy = false; R.focus = resume ? 0.2 : 0.35;
    D.ACTS.forEach(a => { R.bore[a.id] = 0; R.auto[a.id] = 0; });
    memList().forEach(m => { R.cool[m.id] = 0; });
    R.pose = 'idle'; R.poseP = 1; R.walkBlend = 0; R.parts = []; R.memFx = { list: {}, sea: 0 };
    document.body.classList.add('playing'); document.body.classList.remove('inroom');
    $('panel').classList.remove('hide'); $('roomP').style.display = 'none'; $('voidP').style.display = '';
    $('topbar').classList.remove('hide');
    R.unlocked = ''; fit(); topbar(); buildCards(); A.setMode('void');
    if (!resume) A.SFX.arrive();
  }
  function leaveVoid() {
    if (R.busy) return;
    if (R.drw) closeDraw(); R.mural = null;
    R.busy = true; A.SFX.back();
    fadeTo(1, 900, () => {
      // 그리는 동안 5억 년을 여러 번 넘겼으면 그만큼 한꺼번에 받는다(버튼을 그만큼 누른 셈)
      const k = Math.max(1, Math.floor(S.tripYears / D.YEARS_PER_TRIP));
      let paid = S.pending || D.offer(S.presses);
      for (let i = 1; i < k; i++) paid += D.offer(S.presses + i);
      S.inVoid = false; S.presses += k; S.money += paid; S.pending = 0; S.tripYears = 0; save();
      enterRoom(paid); fadeTo(0, 1200);
    });
  }

  function doAct(a, manual) {
    if (a.cost && S.res[a.cost.res] < a.cost.n) { if (manual) { A.SFX.no(); hitCard(a.id); } return false; }
    if (a.cost) S.res[a.cost.res] -= a.cost.n;
    const b = manual ? R.bore[a.id] : 0, lv = S.lv[a.id];
    const g = a.gain * D.lvGain(lv) * (1 - D.BORE_CUT * b) * D.houseMult(houseTier()) * (1 + 0.2 * S.drw.murals);
    S.res[a.res] += g; S.ever[a.res] += g;
    R.focus = Math.min(1, R.focus + (manual ? D.F_TAP * (1 - D.BORE_CUT * b) : D.F_AUTO));
    if (manual) {
      R.bore[a.id] = Math.min(1, R.bore[a.id] + D.BORE_UP);
      if (a.id === 'walk') R.lastWalk = R.t; else { R.pose = POSE[a.id]; R.poseP = 0; }
      A.SFX[SND[a.id]] && A.SFX[SND[a.id]]();
      if (a.id === 'stack' || a.id === 'carve') setTimeout(() => A.SFX.stone(), 90);
      burst(a.id);
      hitCard(a.id);
    }
    return true;
  }
  function useMem(m) {
    if (R.cool[m.id] > 0) { A.SFX.no(); return; }
    R.cool[m.id] = D.MEM_COOL; R.focus = 1;
    D.ACTS.forEach(a => R.bore[a.id] = 0);
    R.memFx.list[m.id] = 0;
    A.SFX.memory(); if (m.id === 'dog') setTimeout(() => A.SFX.bark(), 400);
    // 반짝이는 고리
    const me = R.me; if (me) for (let i = 0; i < 26; i++) { const an = i / 26 * Math.PI * 2; R.parts.push({ x: me.head[0], y: me.head[1], vx: Math.cos(an) * 120, vy: Math.sin(an) * 90, life: 1.2, max: 1.2, k: 'spark' }); }
  }
  function upgrade(a) {
    const lv = S.lv[a.id]; if (lv >= D.MAX_LV) return;
    const c = D.upCost(a, lv);
    if (S.res[a.up.res] < c) { A.SFX.no(); hitCard(a.id); return; }
    S.res[a.up.res] -= c; S.lv[a.id] = lv + 1; A.SFX.up(); hitCard(a.id);
    toast(a.name + ' Lv' + (lv + 1));
  }

  // 입자
  const GL = ['◇', '△', '○', '□', '▽', '◁', '▷', '┼', '╳', '◈'];
  function burst(id) {
    const me = R.me; if (!me) return;
    const [hx, hy] = me.hand, [ex, ey] = me.head, P = R.parts;
    const rnd = (a, b) => a + Math.random() * (b - a);
    if (id === 'scratch') for (let i = 0; i < 6; i++) P.push({ x: hx, y: hy, vx: rnd(-40, 40), vy: rnd(-60, -10), life: 0.6, max: 0.6, k: 'dust' });
    else if (id === 'count') P.push({ x: hx, y: hy - 10, vx: rnd(-8, 8), vy: -40, life: 1, max: 1, k: 'txt', s: D.num(S.ever.num) });
    else if (id === 'dig') for (let i = 0; i < 8; i++) P.push({ x: hx, y: hy, vx: rnd(-90, 90), vy: rnd(-160, -60), g: 420, life: 0.8, max: 0.8, k: 'chip' });
    else if (id === 'stack' || id === 'carve') for (let i = 0; i < 6; i++) P.push({ x: hx, y: hy, vx: rnd(-70, 70), vy: rnd(-90, -20), g: 300, life: 0.5, max: 0.5, k: id === 'carve' ? 'spark' : 'chip' });
    else if (id === 'talk') P.push({ x: ex + rnd(-12, 12), y: ey - 18, vx: rnd(-14, 14), vy: -34, life: 1.4, max: 1.4, k: 'txt', s: GL[Math.floor(Math.random() * GL.length)], glyph: 1 });
    else if (id === 'walk') for (let i = 0; i < 3; i++) P.push({ x: R.cw / 2 + rnd(-20, 20), y: ART.proj(0, ART.V.fz)[1], vx: rnd(-30, 30), vy: rnd(-20, -5), life: 0.5, max: 0.5, k: 'dust' });
  }
  function drawParts(dt) {
    const P = R.parts;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life -= dt; if (p.life <= 0) { P.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt;
      const a = p.life / p.max;
      if (p.k === 'dust') { ctx.fillStyle = `rgba(110,98,84,${0.6 * a})`; ctx.fillRect(p.x, p.y, 2.5, 2.5); }
      else if (p.k === 'chip') { ctx.fillStyle = `rgba(120,112,100,${a})`; ctx.fillRect(p.x, p.y, 3.5, 3); }
      else if (p.k === 'spark') { ctx.fillStyle = `rgba(255,214,140,${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill(); }
      else if (p.k === 'txt') { ctx.globalAlpha = a; ctx.fillStyle = p.glyph ? '#6b5a4a' : '#3b3530'; ctx.font = `${p.glyph ? 18 : 17}px ${p.glyph ? 'sans-serif' : 'TitleF, Ria'}`; ctx.textAlign = 'center'; ctx.fillText(p.s, p.x, p.y); ctx.globalAlpha = 1; }
    }
    if (P.length > 300) P.splice(0, P.length - 300);
  }

  // ── 조작 칸(카드) ──────────────────────────────────────
  function buildCards() {
    const acts = unlockedActs();
    const key = acts.map(a => a.id).join(',') + (drawOpen() ? ',draw' : '') + '|' + memList().map(m => m.id).join(',') + '|' + R.tab;
    if (key === R.unlocked) return;
    const before = R.unlocked.split('|')[0].split(',');
    R.unlocked = key;
    const box = $('cards'); box.innerHTML = '';
    acts.forEach(a => {
      const el = document.createElement('button'); el.className = 'card'; el.id = 'c_' + a.id;
      el.innerHTML = `<span class="nm">${a.name}</span><span class="row2"><span class="vl"></span><span class="lv"></span></span><span class="bar"><i></i></span>`;
      if (R.unlocked && before[0] !== '' && !before.includes(a.id)) { el.classList.add('new'); A.SFX.found(); }
      el.addEventListener('pointerdown', e => { e.preventDefault(); A.init(); if (R.scene !== 'void' || R.ending) return; if (R.tab === 'up') upgrade(a); else doAct(a, true); });
      box.appendChild(el);
    });
    if (R.tab === 'act' && drawOpen()) {
      const el = document.createElement('button'); el.className = 'card'; el.id = 'c_draw';
      el.innerHTML = `<span class="nm">${T('그리기', 'DRAW')}</span><span class="row2"><span class="vl"></span><span class="lv"></span></span><span class="bar"><i></i></span>`;
      if (before[0] !== '' && !before.includes('draw')) { el.classList.add('new'); A.SFX.found(); }
      el.addEventListener('pointerdown', e => { e.preventDefault(); A.init(); if (R.scene === 'void' && !R.ending) openDraw(); });
      box.appendChild(el);
    }
    const mb = $('mems'); mb.innerHTML = '';
    memList().forEach(m => {
      const el = document.createElement('button'); el.className = 'mem'; el.id = 'm_' + m.id;
      el.innerHTML = `<i></i><span>${m.mem}</span>`;
      el.addEventListener('pointerdown', e => { e.preventDefault(); A.init(); if (R.scene === 'void' && !R.ending) useMem(m); });
      mb.appendChild(el);
    });
    $('keys').textContent = matchMedia('(pointer:fine)').matches ? T('1~7 행동 · D 그리기 · Q~Y 기억 · Tab 강화', '1-7 act · D draw · Q-Y memory · Tab upgrade') : '';
    uiUpdate(true);
    fitAll($('panel'));
  }
  function hitCard(id) { const el = $('c_' + id); if (!el) return; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
  function setTab(t) { R.tab = t; $('panel').classList.toggle('tab-up', t === 'up'); $('tabAct').classList.toggle('on', t === 'act'); $('tabUp').classList.toggle('on', t === 'up'); R.unlocked = ''; buildCards(); }
  $('tabAct').onclick = () => { A.init(); A.SFX.tap(); setTab('act'); };
  $('tabUp').onclick = () => { A.init(); A.SFX.tap(); setTab('up'); };
  function uiUpdate(force) {
    if (!force && R.t - R.lastUi < 0.1) return;
    R.lastUi = R.t;
    let anyUp = false;
    unlockedActs().forEach(a => {
      const el = $('c_' + a.id); if (!el) return;
      const lv = S.lv[a.id], vl = el.querySelector('.vl'), lvEl = el.querySelector('.lv'), bar = el.querySelector('.bar i');
      const cost = lv < D.MAX_LV ? D.upCost(a, lv) : 0, canUp = lv < D.MAX_LV && S.res[a.up.res] >= cost;
      if (canUp) anyUp = true;
      if (R.tab === 'act') {
        const v = D.LANG === 'en' ? D.num(S.res[a.res]) : `${D.RES_NAME[a.res]} ${D.num(S.res[a.res])}`;   // 영문은 낱말이 길어 숫자만
        if (vl.textContent !== v) { vl.textContent = v; fitEl(vl); } lvEl.textContent = lv > 1 && D.LANG !== 'en' ? 'Lv' + lv : '';
        bar.style.width = Math.round(R.bore[a.id] * 100) + '%'; bar.parentNode.style.visibility = '';
        el.classList.toggle('dim', !!(a.cost && S.res[a.cost.res] < a.cost.n)); el.classList.remove('can');
      } else {
        lvEl.textContent = 'Lv' + lv;
        const uv = lv >= D.MAX_LV ? 'MAX' : `${D.RES_NAME[a.up.res]} ${D.num(cost)}`; if (vl.textContent !== uv) { vl.textContent = uv; fitEl(vl); }
        bar.parentNode.style.visibility = 'hidden';
        el.classList.toggle('can', canUp); el.classList.toggle('dim', !canUp);
      }
    });
    const cd = $('c_draw');
    if (cd) { cd.querySelector('.vl').textContent = (S.drw.n % 12) + '/12'; cd.querySelector('.lv').textContent = S.drw.murals ? (D.LANG === 'en' ? 'M' : T('벽화', '')) + S.drw.murals : '';
      cd.querySelector('.bar').style.visibility = 'hidden'; cd.classList.toggle('on', !!R.drw); }
    $('upDot').classList.toggle('on', anyUp && R.tab !== 'up');
    memList().forEach(m => { const el = $('m_' + m.id); if (el) el.querySelector('i').style.width = Math.round(clamp(R.cool[m.id] / D.MEM_COOL, 0, 1) * 100) + '%'; });
    tbUpdate();
  }


  // ── 바닥에 손가락으로 그리기 ─────────────────────────────
  const drawOpen = () => S.ever.line >= 20 && S.drw.n < 36;
  const SCR = D.ACTS.find(a => a.id === 'scratch');
  function drawType(n) { const m = Math.floor(n / 12), i = n % 12; return ART.PICS[(i * (m === 1 ? 5 : m === 2 ? 7 : 1) + m * 3) % 12]; }
  function drawLayout() {
    const top = (R.tbH || 44) + 10;
    const dotsY = top + 14, areaTop = dotsY + 34;
    const U = Math.min(R.cw * 0.46, (R.ch - areaTop) * 0.5);
    return { dotsY, cx: R.cw / 2, cy: (areaTop + R.ch) / 2, U };
  }
  function openDraw() {
    if (R.drw || !drawOpen()) return;
    const guide = ART.picPath(drawType(S.drw.n)), targets = [];
    guide.forEach((st, si) => { for (let k = 1; k < st.length; k++) { const [ax, ay] = st[k - 1], [bx, by] = st[k], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L / 0.045));
      for (let j = 0; j < n; j++) targets.push([ax + (bx - ax) * j / n, ay + (by - ay) * j / n, si]); }
      const e = st[st.length - 1]; targets.push([e[0], e[1], si]); });
    R.drw = { guide, targets, cov: new Uint8Array(targets.length), covN: 0, strokes: [], cur: null, prog: 0, done: false, doneT: 0, acc: 0, lastAct: -9 };
    const W = S.drw.wip;
    if (W && W.n === S.drw.n && W.cov && W.cov.length === targets.length) {
      R.drw.strokes = W.strokes.map(st => st.map(p => p.slice()));
      W.cov.forEach((v, i) => { if (v) { R.drw.cov[i] = 1; R.drw.covN++; } });
      R.drw.prog = R.drw.covN / targets.length;
    }
    A.SFX.tap(); $('drawX').classList.remove('hide'); fit(); placeDrawX(); buildCards(); doneBtn(); fitAll($('panel'));
  }
  function doneBtn() {
    const b = $('drawDone'), Dw = R.drw; if (!Dw) return;
    const ok = Dw.prog >= 0.7 && !Dw.done;
    b.classList.toggle('main', ok); b.classList.toggle('gray', !ok); b.disabled = !ok;
  }
  $('drawDone').onclick = () => { A.init(); const Dw = R.drw; if (!Dw || Dw.done || Dw.prog < 0.7) return; finishPic(); };
  function keepWip() { // 그리다 만 획과 칠한 자리를 저장해 둔다
    const Dw = R.drw; if (!Dw || Dw.done) return;
    S.drw.wip = { n: S.drw.n, strokes: Dw.strokes.filter(st => st.length > 1).map(st => st.map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100])), cov: Array.from(Dw.cov) };
  }
  function closeDraw() { keepWip(); save(); R.drw = null; $('drawX').classList.add('hide'); fit(); R.unlocked = ''; buildCards(); }
  function placeDrawX() { const b = $('drawX'); b.style.top = ((R.tbH || 44) + 10) + 'px'; b.style.left = (R.cw - 58) + 'px'; }
  $('drawX').onclick = () => { A.init(); A.SFX.tap(); closeDraw(); };
  function drawPoint(x, y, start) {
    const Dw = R.drw; if (!Dw || Dw.done) return;
    const L = drawLayout(), u = [(x - L.cx) / L.U, (y - L.cy) / L.U];
    if (start || !Dw.cur) { Dw.cur = [u]; Dw.strokes.push(Dw.cur); }
    else { const p = Dw.cur[Dw.cur.length - 1], d = Math.hypot(u[0] - p[0], u[1] - p[1]); if (d < 0.02) return; Dw.cur.push(u); Dw.acc += d; }
    const prev = Dw.cur.length > 1 ? Dw.cur[Dw.cur.length - 2] : u, seg = Math.hypot(u[0] - prev[0], u[1] - prev[1]), ns = Math.max(1, Math.ceil(seg / 0.03));
    for (let q = 0; q <= ns; q++) {
      const px = prev[0] + (u[0] - prev[0]) * q / ns, py = prev[1] + (u[1] - prev[1]) * q / ns;
      for (let i = 0; i < Dw.targets.length; i++) if (!Dw.cov[i]) { const t = Dw.targets[i]; if (Math.hypot(t[0] - px, t[1] - py) < 0.15) { Dw.cov[i] = 1; Dw.covN++; } }
    }
    Dw.prog = Dw.covN / Dw.targets.length;
    // 긋는 만큼 긁기로 친다(초당 6번까지) — 시간이 흐른다
    if (Dw.acc >= 0.1 && R.t - Dw.lastAct >= 0.16) { Dw.acc = 0; Dw.lastAct = R.t; doAct(SCR, true); }
    for (let i = 0; i < 2; i++) R.parts.push({ x, y, vx: (Math.random() - 0.5) * 60, vy: -10 - Math.random() * 40, life: 0.5, max: 0.5, k: 'dust' });
    if (Dw.prog >= 0.97) finishPic();   // 다 그리면 저절로, 그 전엔 완성 단추로(70%부터)
    doneBtn();
  }
  function finishPic() {
    const Dw = R.drw; Dw.done = true; $('drawDone').disabled = true; Dw.doneT = 0; Dw.cur = null;
    // 저장은 가볍게: 소수 둘째 자리, 점이 많으면 솎는다
    let pts = Dw.strokes.reduce((a, st) => a + st.length, 0), step = Math.max(1, Math.ceil(pts / 260));
    const pic = Dw.strokes.filter(st => st.length > 1).map(st => st.filter((p, k) => k % step === 0 || k === st.length - 1).map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]));
    S.drw.pics.push(pic); S.drw.n++; S.drw.wip = null;
    const m = Math.floor((S.drw.n - 1) / 12);
    S.res.line += 20 * (m + 1); S.ever.line += 20 * (m + 1);
    A.SFX.decoded(); toast(T('그림 ', '') + (((S.drw.n - 1) % 12) + 1) + '/12', true);
    save();
  }
  function startMural(m) {
    R.mural = { m, t: 0, cue: 0 };
    S.drw.murals = Math.max(S.drw.murals, m + 1);
    S.res.word += 800 * (m + 1); S.ever.word += 800 * (m + 1); R.focus = 1;
    save();
  }
  function muralStep(dt) {
    const M = R.mural; if (!M) return;
    M.t += dt;
    while (M.cue < 12 && M.t >= M.cue * 0.25) { A.SFX.chime(M.cue); M.cue++; }
    if (M.cue === 12 && M.t >= 3) { A.SFX.found(); M.cue = 13; }
    if (M.cue === 13 && M.t >= 4) { A.SFX.memory(); M.cue = 14; }
    if (M.cue === 14 && M.t >= 6.6) { A.SFX.decoded(); toast(T('벽화 ', 'MURAL ') + (M.m + 1), true); M.cue = 15; }
    if (M.t > 8) R.mural = null;
  }
  function drawFrame(dt) {
    const Dw = R.drw, L = drawLayout();
    if (Dw.done) { Dw.doneT += dt; if (Dw.doneT > 1.4) { const n = S.drw.n; closeDraw(); if (n % 12 === 0) startMural(n / 12 - 1); return false; } }
    ART.drawCloseup(ctx, R.cw, R.ch, { guide: Dw.guide, targets: Dw.targets, cov: Dw.cov, strokes: Dw.strokes, prog: Dw.prog, done: Dw.done, doneT: Dw.doneT, n: S.drw.n - (Dw.done ? 1 : 0), trip: S.tripYears / D.YEARS_PER_TRIP, dotsY: L.dotsY, cx: L.cx, cy: L.cy, U: L.U }, R.t);
    return true;
  }
  cv.addEventListener('pointermove', e => {
    if (!R.drw || !(e.buttons & 1) && e.pointerType === 'mouse') return;
    if (!R.drw.cur) return;
    const r = cv.getBoundingClientRect(); drawPoint(e.clientX - r.left, e.clientY - r.top, false);
  });
  const endStroke = () => { if (R.drw) { R.drw.cur = null; keepWip(); } };
  cv.addEventListener('pointerup', endStroke); cv.addEventListener('pointercancel', endStroke); cv.addEventListener('pointerleave', endStroke);

  // ── 상점 · 흔적 창 ──────────────────────────────────────
  $('bShop').onclick = () => { A.init(); A.SFX.tap(); openShop(); };
  $('bLog').onclick = () => { A.init(); A.SFX.tap(); openLog(); };
  $('shopX').onclick = () => $('shop').classList.add('hide');
  $('logX').onclick = () => $('log').classList.add('hide');
  ['shop', 'log'].forEach(id => $(id).addEventListener('pointerdown', e => { if (e.target.id === id) $(id).classList.add('hide'); }));
  function openShop() {
    $('shopT').textContent = T('상점', 'SHOP'); $('shopM').textContent = D.won(S.money);
    const L = $('shopL'); L.innerHTML = '';
    D.SHOP.forEach(it => {
      const row = document.createElement('div'); row.className = 'row';
      const own = !!S.owned[it.id];
      row.innerHTML = `<span class="nm">${it.name}</span><span class="pr">${D.won(it.price)}</span>`;
      if (own) { const o = document.createElement('span'); o.className = 'own'; o.textContent = '✔'; row.appendChild(o); }
      else { const b = document.createElement('button'); b.className = 'btn' + (S.money >= it.price ? ' main' : ' gray'); b.textContent = T('구매', 'BUY');
        b.onclick = () => buy(it); row.appendChild(b); }
      L.appendChild(row);
    });
    $('shop').classList.remove('hide'); fitAll($('shop'));
  }
  function buy(it) {
    if (S.owned[it.id]) return;
    if (S.money < it.price) { A.SFX.no(); return; }
    S.money -= it.price; S.owned[it.id] = true; shownMoney = S.money; save();
    A.SFX.buy(); if (it.id === 'dog') setTimeout(() => A.SFX.bark(), 500);
    toast(it.name, true); tbUpdate(); openShop();
  }
  const GLY = ['◇', '△', '○', '□', '▽', '◁', '▷', '┼', '╳', '◈', '⊙', '⊿'];
  function partial(text, pct, seed) { // 해독한 만큼만 글자가 보인다
    const chars = [...text], idx = chars.map((ch, i) => i).filter(i => chars[i] !== ' ');
    idx.sort((a, b) => ART.hash(seed * 97 + a) - ART.hash(seed * 97 + b));
    const show = new Set(idx.slice(0, Math.floor(idx.length * pct)));
    return chars.map((ch, i) => (ch === ' ' || show.has(i) ? ch : GLY[Math.floor(ART.hash(seed * 31 + i) * GLY.length)])).join('');
  }
  function openLog() {
    const dn = decodedN();
    $('logT').textContent = T('흔적', 'TRACES'); $('logN').textContent = dn + '/12';
    const L = $('logL'); L.innerHTML = '';
    D.MSGS.forEach((m, i) => {
      const row = document.createElement('div'); row.className = 'row msg';
      if (i >= S.found) { row.classList.add('lock'); row.innerHTML = `<span class="no">${i + 1}</span><span class="tx">? ? ?</span><span class="pc">${D.num(S.ever.km)} / ${D.num(m.km)} km</span>`; }
      else {
        const prev = i ? D.MSGS[i - 1].words : 0;
        const pct = clamp(S.ever.word >= m.words ? 1 : (S.ever.word - prev * 0.5) / (m.words - prev * 0.5), 0, 1);
        if (pct < 1) row.classList.add('lock');
        row.innerHTML = `<span class="no">${i + 1}</span><span class="tx">${partial(m.text, pct, i)}</span>` + (pct < 1 ? `<span class="pc">${D.RES_NAME.word} ${D.num(S.ever.word)} / ${D.num(m.words)}</span>` : '');
      }
      L.appendChild(row);
    });
    $('log').classList.remove('hide');
  }
  function popMsg(i) {
    $('mpNo').textContent = T('흔적', 'TRACE') + ' ' + (i + 1);
    $('mpTx').textContent = D.MSGS[i].text;
    $('toast').classList.remove('on');   // 흔적 알림과 창 제목이 겹치지 않게
    $('msgPop').classList.add('on'); R.msgT = 6;
  }
  $('msgPop').addEventListener('pointerdown', () => { $('msgPop').classList.remove('on'); R.msgT = 0; });

  // ── 화면 전환 ───────────────────────────────────────────
  let fadeAnim = null;
  function fadeTo(v, ms, done) {
    if (R.instant) { $('fade').style.opacity = v; fadeAnim = null; done && done(); return; }
    const el = $('fade'), from = parseFloat(el.style.opacity || 0), t0 = performance.now();
    fadeAnim = { from, v, ms, t0, done };
  }
  function fadeStep(now) {
    if (!fadeAnim) return;
    const f = fadeAnim, k = Math.min(1, (now - f.t0) / f.ms);
    $('fade').style.opacity = f.from + (f.v - f.from) * k;
    if (k >= 1) { fadeAnim = null; f.done && f.done(); }
  }

  // ── 엔딩 ───────────────────────────────────────────────
  function startEnding() {
    if (R.drw) closeDraw();
    R.ending = { t: 0, bang: false, crack: false, stars: null, shown: false };
    S.ended = true; S.inVoid = false; save();
    $('panel').classList.add('hide'); $('topbar').classList.add('hide');
    R.scene = 'end'; fit();
    A.setMode('');
  }
  function endingFrame(dt, now) {
    const E = R.ending; E.t += dt;
    const w = R.cw, h = R.ch, t = E.t;
    if (t < 12.5) {
      const st = { walkOff: 0, ever: S.ever, res: S.res, found: S.found, decoded: 12, acts: {}, pose: 'idle', poseP: 1, ending: { stand: t > 1.5 }, walkBlend: 0, drw: S.drw };
      if (t > 3) { const k = clamp((t - 3) / 6, 0, 1); st.stranger = { z: 40 - 35.1 * (1 - Math.pow(1 - k, 2)), x: 0.85, ph: t * 7, walking: k < 1 }; }
      if (t > 9) {
        if (!E.crack) { E.crack = true; A.SFX.crack(); }
        const k = clamp((t - 9) / 3, 0, 1);
        st.floorFx = c2 => { // 두 사람 사이 바닥이 빛으로 갈라진다(사람 뒤에 그린다)
          const [sx, sy] = ART.proj(0.45, 4.6);
          c2.save(); c2.strokeStyle = 'rgba(255,226,160,.95)'; c2.shadowColor = '#ffb050'; c2.shadowBlur = 18; c2.lineWidth = 3; c2.lineJoin = 'round';
          for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2 + ART.hash(i) * 0.3, L = k * Math.max(w, h) * (0.3 + ART.hash(i + 3) * 0.7);
            c2.beginPath(); c2.moveTo(sx, sy); for (let j = 1; j <= 6; j++) c2.lineTo(sx + Math.cos(an + (ART.hash(i * 7 + j) - 0.5) * 0.5) * L * j / 6, sy + Math.sin(an + (ART.hash(i * 9 + j) - 0.5) * 0.5) * L * j / 6 * 0.35); c2.stroke(); }
          const g = c2.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.5 * k); g.addColorStop(0, 'rgba(255,240,200,.8)'); g.addColorStop(1, 'rgba(255,240,200,0)');
          c2.fillStyle = g; c2.fillRect(0, 0, w, h); c2.restore();
        };
      }
      ART.drawVoid(ctx, w, h, st, t);
      yearsCounter(Math.min(D.UNIVERSE + (t > 1 ? (t - 1) * 4e7 : 0), 1.4e10), 1, 0);
      if (t > 11) $('fade').style.opacity = clamp((t - 11) / 1.3, 0, 1);
    } else {
      if (!E.bang) {
        E.bang = true; A.SFX.bang(); A.setMode('end');
        const cols = ['#ffffff', '#ffe6b8', '#bcd6ff', '#ffc2a0', '#e8d0ff'];
        E.stars = []; for (let i = 0; i < 1400; i++) { const r = Math.pow(Math.random(), 0.7), core = Math.random() < 0.25; E.stars.push({ r, a: core ? Math.random() * Math.PI * 2 : (i % 3) * 2.094 + r * 5.5 + (Math.random() - 0.5) * 0.7, v: 0.6 + Math.random() * 1.2, spin: 0.02 / (0.2 + r), flat: 0.35 + Math.random() * 0.25, col: cols[i % 5], b: 0.4 + Math.random() * 0.6, sz: Math.random() < 0.08 ? 2.4 : 1.3 }); }
      }
      $('fade').style.opacity = clamp(1 - (t - 12.5) / 0.6, 0, 1);
      ART.drawCosmos(ctx, w, h, t - 12.5, E.stars);
      if (t > 19 && !E.shown) { E.shown = true; $('endYrs').textContent = D.yearsFull(S.totalYears); $('endUI').classList.add('on'); }
    }
  }
  $('bEnd').onclick = () => { A.init(); $('endUI').classList.remove('on'); R.ending = null; $('fade').style.opacity = 0; A.setMode(''); showTitle(); };

  // ── 햇수 표시(캔버스 위쪽 하늘 자리) ────────────────────────
  function yearsCounter(y, focus, pulse) {
    const w = R.cw, h = R.ch, tb = $('topbar').getBoundingClientRect();
    const top = (tb.height || 44) + 6;
    const fs = Math.min(h * 0.085, w * 0.085, 64);
    const txt = D.yearsFull(y);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = `700 ${fs * (1 + pulse * 0.12)}px TitleF, Ria, sans-serif`;
    const g = Math.round(40 + (1 - focus) * 90);
    ctx.fillStyle = `rgb(${g},${g - 4},${g - 8})`;
    ctx.fillText(txt, w / 2, top);
    if (R.scene === 'void') {
      const bw = Math.min(w * 0.7, 520), bx = (w - bw) / 2, by = top + fs * 1.18, k = clamp(S.tripYears / D.YEARS_PER_TRIP, 0, 1);
      ctx.fillStyle = 'rgba(60,54,46,.16)'; ctx.fillRect(bx, by, bw, 5);
      ctx.fillStyle = '#3b3530'; ctx.fillRect(bx, by, bw * k, 5);
      for (let i = 1; i < 5; i++) { ctx.fillStyle = 'rgba(60,54,46,.35)'; ctx.fillRect(bx + bw * i / 5 - 1, by - 3, 2, 11); }
    }
    ctx.restore();
  }

  // ── 한 프레임 ───────────────────────────────────────────
  function step(dt, now) {
    R.t += dt;
    fadeStep(now || performance.now());
    if (R.scene === 'title') {
      const box = ART.drawTitle(ctx, R.cw, R.ch, R.t, D.won(D.offer(0)).replace('원', T('원', '')));
      R.hit.box = box;
      return;
    }
    if (R.scene === 'room') {
      R.dogHappy = Math.max(0, R.dogHappy - dt);
      const st = { house: houseTier(), owned: S.owned, pressed: R.pressed, label: D.won(D.offer(S.presses)), dogHappy: R.dogHappy, top: R.tbH };
      if (!R.nodraw) R.hit = ART.drawRoom(ctx, R.cw, R.ch, st, R.t);
      return;
    }
    if (R.scene === 'end') { if (R.ending) endingFrame(dt, now); return; }
    if (R.scene !== 'void') return;

    // 질림은 쉬면 풀린다
    D.ACTS.forEach(a => R.bore[a.id] = Math.max(0, R.bore[a.id] - D.BORE_DOWN * dt));
    // 저절로(습관)
    if (!R.busy) unlockedActs().forEach(a => { const au = D.lvAuto(S.lv[a.id]); if (!au) return; R.auto[a.id] += au * dt; while (R.auto[a.id] >= 1) { R.auto[a.id] -= 1; doAct(a, false); } });
    // 몰입만큼 시간이 흐른다
    R.focus = Math.max(D.F_MIN, R.focus - D.F_DECAY * R.focus * dt);
    if (!R.busy) {
      const before = S.tripYears;
      const dy = R.focus * D.YEARS_PER_TRIP / D.TRIP_SEC * dt;
      S.tripYears = R.drw ? S.tripYears + dy : Math.min(D.YEARS_PER_TRIP, S.tripYears + dy); S.totalYears += S.tripYears - before;
      if (Math.floor(S.tripYears / 1e8) > Math.floor(before / 1e8)) { R.pulse = 1; A.SFX.milestone(); }
    }
    R.pulse = Math.max(0, R.pulse - dt * 2);
    // 기억
    memList().forEach(m => { if (R.cool[m.id] > 0) R.cool[m.id] = Math.max(0, R.cool[m.id] - dt); });
    for (const id in R.memFx.list) { R.memFx.list[id] += dt / 5; if (R.memFx.list[id] >= 1) delete R.memFx.list[id]; }
    R.memFx.sea = R.memFx.list.trip != null ? Math.sin(R.memFx.list.trip * Math.PI) : 0;
    // 걷기
    const walking = R.t - R.lastWalk < 1.1;
    R.walkBlend = clamp(R.walkBlend + (walking ? 4 : -3) * dt, 0, 1);
    if (R.walkBlend > 0) { R.walkPh += dt * 7; R.walkOff += dt * 2.2 * R.walkBlend; }
    R.poseP = Math.min(1, R.poseP + dt / 0.35); if (R.poseP >= 1) R.pose = 'idle';
    // 흔적 찾기·해독
    const dnBefore = decodedN();
    while (S.found < 12 && S.ever.km >= D.MSGS[S.found].km) { S.found++; A.SFX.found(); toast(T('흔적', 'TRACE') + ' ' + S.found); }
    const dn = decodedN();
    if (dn > S.readN) { for (let i = S.readN; i < dn; i++) R.msgQ.push(i); S.readN = dn; A.SFX.decoded(); }
    void dnBefore;
    if (R.msgT > 0) { R.msgT -= dt; if (R.msgT <= 0) $('msgPop').classList.remove('on'); }
    else if (R.msgQ.length && !$('msgPop').classList.contains('on')) popMsg(R.msgQ.shift());
    // 새로 열린 행동
    buildCards();
    // 그리기
    const st = { walkOff: R.walkOff, ever: S.ever, res: S.res, found: S.found, decoded: dn, acts: { carve: S.ever.tower >= 12 }, pose: R.pose, poseP: R.poseP,
      walkBlend: R.walkBlend, walkPh: R.walkPh, memFx: R.memFx, dim: 0 };
    muralStep(dt);
    st.drw = S.drw; st.muralFx = R.mural;
    if (!R.nodraw) {
      if (!(R.drw && drawFrame(dt))) R.me = ART.drawVoid(ctx, R.cw, R.ch, st, R.t) || R.me;
      drawParts(dt); if (!R.drw) yearsCounter(S.tripYears, R.focus, R.pulse);
    }
    uiUpdate(false);
    // 끝
    if (S.totalYears >= D.UNIVERSE && dn >= 12 && !R.ending) { startEnding(); return; }
    if (S.tripYears >= D.YEARS_PER_TRIP && !R.busy && !R.drw && !R.mural) leaveVoid();
  }

  let last = 0, rafOn = true;
  function loop(ts) {
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    step(dt, ts);
    if (rafOn) requestAnimationFrame(loop);
  }

  // ── 입력 ───────────────────────────────────────────────
  cv.addEventListener('pointerdown', e => {
    A.init();
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const inR = b => b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    if (R.scene === 'void' && R.drw) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) {} drawPoint(x, y, true); return; }
    if (R.scene === 'room') {
      if (inR(R.hit.box)) pressButton();
      else if (inR(R.hit.dog)) { R.dogHappy = 1.4; A.SFX.bark(); }
    }
  });
  addEventListener('keydown', e => {
    if (e.repeat && R.scene !== 'void') return;
    A.init();
    if (R.scene === 'room' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); pressButton(); return; }
    if (R.scene !== 'void' || R.ending) return;
    if (e.code === 'Tab') { e.preventDefault(); setTab(R.tab === 'act' ? 'up' : 'act'); return; }
    if (e.code === 'Escape' && R.drw) { closeDraw(); return; }
    if (e.key === 'd' || e.key === 'D') { if (R.drw) closeDraw(); else openDraw(); return; }
    const a = D.ACTS.find(x => x.key === e.key);
    if (a && a.unlock(S)) { if (R.tab === 'up') upgrade(a); else doAct(a, true); return; }
    const mi = 'qwerty'.indexOf(e.key.toLowerCase()), ml = memList();
    if (mi >= 0 && ml[mi]) useMem(ml[mi]);
  });
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  setInterval(save, 4000);

  // 시험용 손잡이(미리보기 창은 rAF 가 돌지 않는다)
  window.__b5 = {
    get S() { return S; }, R, D,
    tick(n, dt) { dt = dt || 1 / 30; for (let i = 0; i < (n || 1); i++) step(dt, performance.now()); },
    act(id, n) { const a = D.ACTS.find(x => x.id === id); for (let i = 0; i < (n || 1); i++) doAct(a, true); },
    press: pressButton, leave: leaveVoid, fitAll, openDraw, closeDraw, drawPoint, startMural, drawLayout, memList, unlockedActs, decodedN, set(o) { Object.assign(S, o); }, reset() { S = fresh(); }, noSave(v) { noSave = v; },
    start() { $('bStart').onclick(); }, fit, buy, openShop, openLog, useMem, upgrade, setTab, fresh,
    stopRaf() { rafOn = false; }
  };

  // 영어판 글자
  if (D.LANG === 'en') {
    document.documentElement.lang = 'en'; document.title = '500 Million Year Button';
    document.querySelector('#title h1').innerHTML = '500 MILLION<br>YEAR BUTTON';
    $('bShop').textContent = 'SHOP'; $('bLog').textContent = 'TRACES'; $('tabAct').firstChild.textContent = 'ACT'; $('tabUp').firstChild.textContent = 'UPGRADE';
    $('bNew').textContent = 'NEW GAME'; $('drawDone').textContent = 'DONE'; $('askN').textContent = 'CANCEL'; $('askY').textContent = 'OK'; $('bEnd').textContent = 'TITLE';
  }
  showTitle();
  requestAnimationFrame(loop);
})();
