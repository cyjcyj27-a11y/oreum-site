// 개구리 점프 — 게임 본체
(function () {
  'use strict';
  const L = window.LV, PH = window.PH, P = PH.P, ART = window.ART, AU = window.AU;
  const $ = id => document.getElementById(id);
  const EN = /[?&]lang=en\b/.test(location.search);
  const NAMES = EN ? L.NAMES_EN : L.NAMES;
  const cv = $('cv'), cx = cv.getContext('2d');
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');

  // ── 상태 ──
  const w = PH.world(L);
  let f = PH.frog(240, 0);
  function fresh() {
    return { x: 240, y: 0, zone: 0, flags: [true], golds: L.golds.map(() => false), flies: L.flies.map(() => false),
      time: 0, jumps: 0, falls: 0, best: 0, ended: false, magicSeen: false, ver: 2 };
  }
  let S = fresh();
  let CHAR = 'frog';                               // frog = 이지, dog = 로봇개 하드
  try { CHAR = localStorage.getItem('controlking.char') === 'dog' ? 'dog' : 'frog'; } catch (e) {}
  const SAVEKEY = () => CHAR === 'dog' ? 'controlking.save.dog' : 'controlking.save';
  let mode = 'title';           // title | play | pause | end
  let noSave = false;
  function save() {
    if (noSave || mode === 'title') return;
    if (f.on) { S.x = f.x; S.y = f.y; }
    try { localStorage.setItem(SAVEKEY(), JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      const o = JSON.parse(localStorage.getItem(SAVEKEY()) || 'null');
      if (o && o.golds) {
        const F = fresh();
        S = Object.assign(F, o);
        // 12구간 때 기록 이어받기: 늘어난 칸은 빈 채로, 옛 엔딩은 중간 쉼터가 됐으니 THE END 표시는 끈다
        S.golds = F.golds.map((v, i) => !!o.golds[i]); S.flies = F.flies.map((v, i) => !!(o.flies || [])[i]);
        if (o.ver !== 2) { S.ended = false; S.ver = 2; }
        return true;
      }
    } catch (e) {}
    return false;
  }
  const goldN = () => S.golds.filter(Boolean).length;
  const goldA = () => S.golds.slice(0, 12).filter(Boolean).length;   // 산꼭대기 석등
  const goldB = () => S.golds.slice(12).filter(Boolean).length;      // 달 앞 별자리
  const flyN = () => S.flies.filter(Boolean).length;

  // ── 화면 크기 ──
  let DPR = 1, CW = 0, CH = 0, sc = 1, ox = 0, portrait = true;
  function fit() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    CW = window.innerWidth; CH = window.innerHeight;
    cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR);
    cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
    portrait = CH >= CW;
    if (portrait) sc = CW / (L.W + 24);
    else sc = Math.min(CH / 580, (CW - (isTouch ? 380 : 0)) / (L.W + 24));
    ox = (CW - L.W * sc) / 2;
  }
  window.addEventListener('resize', fit);
  fit();

  // 개구리를 화면 어디에 둘지 (아래 조작 단추 위)
  function frogScreenY() {
    if (portrait) { const bottom = CH - (isTouch ? 150 : 40); return bottom - 0.26 * (bottom - 50); }
    return CH - 0.3 * CH;
  }
  let camY = -60;
  function camFloor() { return -((portrait && isTouch ? 150 : 40) + 30) / sc; }   // 우물 바닥이 조작 단추 위에 보이게
  function camWant() {
    if (mode === 'end') return f.y - CH * 0.74 / sc;       // 엔딩: 개구리·옥토끼는 화면 위쪽, THE END 판은 그 아래
    return Math.max(camFloor(), f.y - (CH - frogScreenY()) / sc);
  }

  // ── 입력 ──
  const inp = { l: false, r: false, jump: false };
  const keys = {};
  function syncKeys() {
    inp.l = !!(keys.ArrowLeft || keys.KeyA || touchL);
    inp.r = !!(keys.ArrowRight || keys.KeyD || touchR);
    inp.jump = !!(keys.Space || keys.ArrowUp || keys.KeyW || touchJ);
  }
  let touchL = false, touchR = false, touchJ = false;
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.repeat) return;
    AU.init();
    if (mode === 'play') {
      if (e.code === 'KeyP' || e.code === 'Escape') { openPause(); return; }
      if (e.code === 'KeyM') { toggleBgm(); return; }
      if (e.code === 'KeyK') { toggleSfx(); return; }
    } else if (mode === 'pause' && (e.code === 'KeyP' || e.code === 'Escape')) { closePause(); return; }
    else if (mode === 'title' && (e.code === 'Space' || e.code === 'Enter') && $('ask').classList.contains('hide')) { e.preventDefault(); $('bStart').click(); return; }
    else if (!$('ask').classList.contains('hide')) { if (e.code === 'Enter') $('askY').click(); if (e.code === 'Escape') $('askN').click(); return; }
    keys[e.code] = true; syncKeys();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; syncKeys(); });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; touchL = touchR = touchJ = false; syncKeys(); });
  function hold(el, set) {
    const ids = new Set();
    const on = () => { set(ids.size > 0); el.classList.toggle('on', ids.size > 0); syncKeys(); };
    el.addEventListener('pointerdown', e => { e.preventDefault(); AU.init(); ids.add(e.pointerId); try { el.setPointerCapture(e.pointerId); } catch (x) {} on(); });
    const up = e => { ids.delete(e.pointerId); on(); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  }
  hold($('bL'), v => touchL = v);
  hold($('bR'), v => touchR = v);
  hold($('bJ'), v => touchJ = v);
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') openPause(); });

  // ── 소리 단추 ──
  function paintTogs() { $('tBgm').classList.toggle('off', !AU.bgmOn); $('tSfx').classList.toggle('off', !AU.sfxOn); }
  function toggleBgm() { AU.init(); AU.setBgm(!AU.bgmOn); paintTogs(); }
  function toggleSfx() { AU.init(); AU.setSfx(!AU.sfxOn); paintTogs(); }
  $('tBgm').onclick = toggleBgm; $('tSfx').onclick = toggleSfx;
  $('tPause').onclick = () => { if (mode === 'play') openPause(); };
  paintTogs();

  // ── 효과 ──
  const parts = [], pops = [];
  let shake = 0;
  const FX = { flags: S.flags, magicOn: false, magicT: 0, bounce: {} };
  if (ART.setFX) ART.setFX(FX);
  const anim = { blink: 0, blinkT: 2.5, land: 0, mouth: 0, walkPh: 0, idle: 0, ribbitT: 7, stepT: 0 };
  const tng = { on: false, t: 0, tx: 0, ty: 0, gold: false, idx: -1 };
  const crow = { on: false, x: 0, y: 0, tx: 0, ty: 0, face: -1, mode: 'fly', t: 0, leave: false };

  function puff(x, y, n, col, spd, up, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.PI + Math.random() * Math.PI;
      parts.push({ x: x + (Math.random() - 0.5) * 20, y: y + 2, vx: Math.cos(a) * spd * (0.4 + Math.random()), vy: -Math.sin(a) * spd * 0.5 * up + Math.random() * 30,
        life: 0.5 + Math.random() * 0.4, max: 0.9, col, size: (size || 4) * (0.6 + Math.random() * 0.8), g: -200 });
    }
  }
  function sparkle(x, y, n, col) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.7 + Math.random() * 0.5, max: 1.2, col, size: 3 + Math.random() * 3, g: 120, star: true }); }
  }
  function pop(text, x, y, col, big) { pops.push({ text, x, y, t: 0, col: col || '#fff8dc', big: !!big }); }
  function dustCol(p) {
    const t = p ? p.t : '';
    if (t === 'cloud' || t === 'mist' || t === 'puff' || t === 'snow' || t === 'ice') return 'rgba(255,255,255,.8)';
    if (t === 'thatch') return 'rgba(230,200,120,.8)';
    if (t === 'branch' || t === 'twig' || t === 'leaf' || t === 'bamboo') return 'rgba(140,190,90,.8)';
    if (p && p.z === 0 && p.floor) return 'rgba(160,200,210,.8)';
    return 'rgba(200,190,170,.7)';
  }

  function callCrow() {
    const p = nearPerch();
    crow.on = true; crow.leave = false; crow.t = 0; crow.mode = 'fly';
    crow.face = p.x > f.x ? -1 : 1;
    crow.x = crow.face > 0 ? -60 : L.W + 60; crow.y = f.y + 260;
    crow.tx = p.x; crow.ty = p.y;
  }
  function nearPerch() {       // 개구리 근처 발판 가장자리
    let best = null, bd = 1e9;
    for (const p of w.plats) {
      if (p.gone || p.magic || p.per || p.floor && Math.abs(p.y - f.y) > 5) continue;
      const dy = p.y - f.y; if (dy < -20 || dy > 320) continue;
      const ex = p.x + p.w - 14 < f.x ? p.x + p.w - 14 : p.x + 14;
      const d = Math.abs(ex - f.x) + Math.abs(dy) * 0.5;
      if (d > 60 && d < bd) { bd = d; best = { x: ex, y: p.y }; }
    }
    return best || { x: f.x < 240 ? f.x + 120 : f.x - 120, y: f.y };
  }

  // ── 물리에서 오는 사건 ──
  let lastLandY = 0;
  function ev(type, a, b) {
    if (type === 'jump') { AU.S.jump(a); if (f.robo) AU.S.servo(); puff(f.x, f.y, 5 + a * 6, dustCol(null), 60 + a * 60, 1, 3); S.jumps++; anim.idle = 0; }
    else if (type === 'land') {
      const p = b;
      anim.land = Math.min(1, 0.4 + a / 400);
      AU.S.land(a);
      puff(f.x, f.y, 4 + Math.min(10, a / 40), dustCol(p), 70 + Math.min(120, a / 3), 0.6, 4);
      if (a > 280) shake = Math.min(8, a / 80);
      if (a > 360 && !crow.on) { S.falls++; callCrow(); }
      onStand(p);
    }
    else if (type === 'splat') {
      if (f.robo) { AU.S.crash(); setTimeout(() => AU.S.repair(), 950); } else AU.S.splat();
      shake = 12; anim.land = 1;
      puff(f.x, f.y, 16, dustCol(b), 180, 0.8, 5);
      S.falls++;
      if (!crow.on) callCrow();
      onStand(b);
    }
    else if (type === 'spring') { AU.S.spring(); FX.bounce[a.id] = 1; a.bend = 1; puff(f.x, f.y, 6, dustCol(a), 80, 1, 3); }
    else if (type === 'bonk') { AU.S.bonk(a); puff(f.x + (f.vx > 0 ? -14 : 14), f.y + 12, 3, 'rgba(255,255,255,.7)', 50, 1, 2.5); }
    else if (type === 'head') AU.S.bonk(150);
    else if (type === 'crumble' && a.t === 'magpie') {     // 오작교: 까치들이 흩어져 날아간다
      AU.S.magpie();
      for (let i = 0; i < 7; i++) parts.push({ x: a.x + (i + 0.5) * a.w / 7, y: a.y - 6, vx: (Math.random() - 0.5) * 160, vy: 120 + Math.random() * 120, life: 1.4, max: 1.4, col: '#1a1d26', size: 6, g: -60, bird: true, ph: Math.random() * 6 });
    }
    else if (type === 'crumble') { AU.S.crumble(); for (let i = 0; i < 10; i++) parts.push({ x: a.x + Math.random() * a.w, y: a.y - Math.random() * a.h, vx: (Math.random() - 0.5) * 80, vy: Math.random() * 60, life: 1, max: 1, col: a.t === 'mist' ? 'rgba(240,240,255,.8)' : a.t === 'plank' ? '#6a4a2a' : '#7a6656', size: 5 + Math.random() * 5, g: 900, chunk: a.t !== 'mist' }); }
    else if (type === 'back') AU.S.back();
  }

  function onStand(p) {
    const k = PH.zoneOf(w, p.y);
    if (p.floor && !S.flags[p.z]) {
      S.flags[p.z] = true;
      AU.S.zone(); banner(p.z);
      sparkle(24, p.y + 50, 14, '#ffd65a');
    }
    if (k > S.zone) S.zone = k;
    if (!p.floor && p.y > S.best + 30 && p.y - lastLandY > 60) {
      const gain = p.y - lastLandY;
      pop(gain > 210 ? 'GREAT' : 'NICE', f.x, f.y + 40, gain > 210 ? '#ffd65a' : '#fff8dc', gain > 210);
    }
    if (p.y > S.best) S.best = p.y;
    lastLandY = p.y;
    if (p.peak && mode === 'play') startCut();
    save();
  }

  let bannerT = 0;
  function banner(k) {
    $('bnK').textContent = (k + 1) + ' / ' + NAMES.length; $('bnN').textContent = NAMES[k];
    $('banner').classList.add('on'); bannerT = 2.6;
  }

  // 파리: 입 가까이 오면 혀로 낚아챈다
  const REACH = 50;
  function mouth() { return [f.x + f.face * 15, f.y + 11]; }
  function hunt() {
    if (tng.on) return;
    const [mx, my] = mouth();
    let bi = -1, bd = REACH, gold = false;
    for (let i = 0; i < L.flies.length; i++) {
      if (S.flies[i]) continue; const q = L.flies[i];
      if (Math.abs(q.y - f.y) > 120) continue;
      const d = Math.hypot(q.x - mx, q.y - my); if (d < bd) { bd = d; bi = i; gold = false; }
    }
    for (let i = 0; i < L.golds.length; i++) {
      if (S.golds[i]) continue; const q = L.golds[i];
      const d = Math.hypot(q.x - mx, q.y - my); if (d < bd + 6) { bd = d; bi = i; gold = true; }
    }
    if (bi < 0) return;
    const q = gold ? L.golds[bi] : L.flies[bi];
    if (q.x < mx === f.face > 0 && Math.abs(q.x - mx) > 8 && f.on) f.face = -f.face;
    tng.on = true; tng.t = 0; tng.tx = q.x; tng.ty = q.y; tng.gold = gold; tng.idx = bi;
    if (gold) S.golds[bi] = true; else S.flies[bi] = true;
  }
  function tongueDone() {
    if (tng.gold) {
      if (f.robo) AU.S.zap(true); AU.S.gold(); sparkle(tng.tx, tng.ty, 26, '#ffd65a'); pop('+1', f.x, f.y + 44, '#ffd65a', true);
      if (goldA() === 12) magicReady(1);
      if (goldB() === 12) magicReady(2);
    } else { if (f.robo) { AU.S.zap(false); sparkle(f.x, f.y + 22, 6, '#8cffaa'); } else AU.S.eat(); pop('+1', f.x, f.y + 40); }
    anim.mouth = 0.25;
    save();
  }
  function magicReady(n) {
    if (n === 2) { if (!w.magic2On) { w.magic2On = FX.magic2On = true; FX.magic2T = 0; AU.S.magic(); } return; }
    if (!FX.magicOn) { FX.magicOn = true; FX.magicT = 0; w.magicOn = true; AU.S.magic(); }
  }

  // ── 한 프레임 ──
  let acc = 0, T = 0, wasCharging = false, hudT = 0, saveT = 0;
  function update(dt) {
    T += mode === 'cut' ? dt * 0.35 : dt;
    if (mode === 'cut') cutStep(dt);
    if (mode === 'play') {
      if (mode === 'play') S.time += dt;
      acc += dt;
      const input = mode === 'play' ? inp : { l: false, r: false, jump: false };
      while (acc >= P.DT) { PH.step(w, f, input, P.DT, ev); acc -= P.DT; }
      if (f.charging && !wasCharging) AU.S.chargeOn(P.CHG * (1 - f.charge));
      if (!f.charging && wasCharging) AU.S.chargeOff();
      wasCharging = f.charging;
      if (mode === 'play') hunt();
      if (mode === 'play') cutCheck();
      AU.wind(w.wind);
      AU.setBand(AU.bandOf(PH.zoneOf(w, f.y)));
    }
    // 개구리 몸짓
    anim.blinkT -= dt; if (anim.blinkT < 0) { anim.blink = 0.12; anim.blinkT = 2 + Math.random() * 3; }
    if (anim.blink > 0) anim.blink -= dt;
    if (anim.land > 0) anim.land = Math.max(0, anim.land - dt * 5);
    if (anim.mouth > 0) anim.mouth -= dt;
    const walking = f.on && !f.charging && Math.abs(f.vx) > 20;
    if (walking) { anim.walkPh += dt * 14; anim.stepT -= dt; if (anim.stepT < 0) { AU.S.step(); anim.stepT = 0.22; } } else anim.walkPh = 0;
    if (f.on && !walking && !f.charging && f.stun <= 0) { anim.idle += dt; anim.ribbitT -= dt; if (anim.ribbitT < 0 && mode === 'play') { if (f.robo) AU.S.beep(); else AU.S.ribbit(); anim.mouth = 0.3; anim.ribbitT = 8 + Math.random() * 6; } }
    // 혀
    if (tng.on) { tng.t += dt; if (tng.t >= 0.09 && !tng.hit) { tng.hit = true; tongueDone(); } if (tng.t >= 0.2) { tng.on = false; tng.hit = false; } }
    // 뚜껑문: 아래에서 뚫고 지나가면 위로 탁 열렸다가 천천히 닫힌다
    for (const p of w.plats) {
      if (p.t !== 'hatch') continue;
      if (f.vy > 0 && f.x + 15 > p.x && f.x - 15 < p.x + p.w && f.y + 26 > p.y - p.h && f.y < p.y + 4) { if (!(p.open > 0.6)) AU.S.hatch(); p.open = 1; }
      else if (p.open > 0) p.open = Math.max(0, p.open - dt * 1.6);
    }
    // 발판 흔들림
    for (const id in FX.bounce) { FX.bounce[id] -= dt * 3; if (FX.bounce[id] <= 0) delete FX.bounce[id]; }
    for (const p of w.plats) if (p.bend) { p.bend = Math.max(0, p.bend - dt * 3); }
    if (FX.magicOn) FX.magicT += dt;
    if (FX.magic2On) FX.magic2T += dt;
    if (FX.endT != null) FX.endT += dt;
    ART.SUN.lift = mode === 'end' ? Math.min(1, ART.SUN.lift + dt / 5) : 0;
    // 까마귀
    if (crow.on) {
      crow.t += dt;
      if (crow.mode === 'fly' && !crow.leave) {
        const dx = crow.tx - crow.x, dy = crow.ty - crow.y, d = Math.hypot(dx, dy);
        if (d < 6) { crow.x = crow.tx; crow.y = crow.ty; crow.mode = 'laugh'; crow.t = 0; AU.S.crow(); crow.face = f.x > crow.x ? 1 : -1; pop(EN ? 'CAW CAW' : '깍깍', crow.x, crow.y + 70, '#fff8dc'); }
        else { const v = Math.min(d, 420 * dt); crow.x += dx / d * v; crow.y += dy / d * v; }
      } else if (crow.mode === 'laugh') { if (crow.t > 0.9) { crow.mode = 'sit'; crow.t = 0; } }
      else if (crow.mode === 'sit') { crow.face = f.x > crow.x ? 1 : -1; if (crow.t > 1.4 || Math.abs(f.y - crow.y) > 400) { crow.mode = 'fly'; crow.leave = true; crow.t = 0; } }
      else if (crow.leave) { crow.x += crow.face * 300 * dt; crow.y += 240 * dt; if (crow.t > 2.5) crow.on = false; }
    }
    // 번개: 폭풍 구름 구간에서 가끔 하늘이 번쩍
    if (PH.zoneOf(w, f.y) === 12 && (mode === 'play' || mode === 'title')) {
      FX.boltT = (FX.boltT || 3) - dt;
      if (FX.boltT <= 0) { FX.bolt = 1; FX.boltX = 60 + Math.random() * 360; FX.boltT = 3 + Math.random() * 4; AU.S.thunder(); }
    }
    if (FX.bolt > 0) FX.bolt = Math.max(0, FX.bolt - dt * 2.5);
    // 가루·글자
    for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.life -= dt; if (q.life <= 0) { parts.splice(i, 1); continue; } q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.98; }
    for (let i = pops.length - 1; i >= 0; i--) { pops[i].t += dt; if (pops[i].t > 1) pops.splice(i, 1); }
    if (shake > 0) shake = Math.max(0, shake - dt * 30);
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) $('banner').classList.remove('on'); }
    // 카메라
    const want = mode === 'title' ? titleCam() : camWant();
    if (!isFinite(camY)) camY = isFinite(want) ? want : 0;   // 창이 숨은 채 열리면 크기 0 으로 계산돼 망가진다
    if (isFinite(want)) camY += (want - camY) * Math.min(1, dt * (mode === 'title' ? 1.5 : 5));
    hudT -= dt; if (hudT < 0) { hud(); hudT = 0.2; }
    saveT += dt; if (saveT > 5) { saveT = 0; if (mode === 'play') save(); }
    AU.schedule();
  }
  function titleCam() { return S.y - (CH - CH * (CH < 500 ? 0.47 : 0.6)) / sc; }   // 제목 화면: 개구리는 제목과 START 사이

  function hud() {
    $('hH').textContent = Math.max(0, Math.round(f.y / 40)) + 'm';
    $('hF').textContent = flyN();
    $('hG').textContent = goldN() + '/' + L.golds.length;
    const s = Math.floor(S.time), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    $('hT').textContent = (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0');
  }

  // ── 그리기 ──
  function frogPose() {
    let m = 'idle';
    if (f.stun > 0) m = 'splat';
    else if (!f.on) m = f.vy > 0 ? 'rise' : 'fall';
    else if (f.charging) m = 'charge';
    else if (Math.abs(f.vx) > 20) m = 'walk';
    else if (anim.land > 0) m = 'land';
    let look = [0, 0];
    if (m === 'idle' && crow.on) look = [crow.x > f.x === f.face > 0 ? 0.8 : -0.8, -0.3];
    return { robo: f.robo, stunT: (f.stun0 || 0) - f.stun, vy: f.vy, slide: f.robo && !!f.on && Math.abs(f.vx) > 50 && !inp.l && !inp.r, mode: m, sq: f.charge, face: f.face, blink: anim.blink > 0 ? 1 : 0, land: anim.land, walkPh: anim.walkPh, mouth: tng.on || anim.mouth > 0 ? 1 : 0, tongue: tng.on || anim.mouth > 0.12, ground: !!f.on, look };
  }
  function render() {
    if (!CW || !CH || !(sc > 0)) { fit(); if (!CW || !CH || !(sc > 0)) return; }
    if (!isFinite(camY)) camY = mode === 'title' ? titleCam() : camWant();
    if (!isFinite(camY)) return;   // 창이 숨어 크기가 0 이면 그리지 않는다
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const sh = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const V = ART.view(sc, ox + sh, CH + (shake > 0 ? (Math.random() - 0.5) * shake : 0), camY, CW, CH);
    ART.sky(cx, V, T);
    ART.scenery(cx, V, T);
    ART.well(cx, V, T);
    ART.sideShade(cx, V);
    if (FX.bolt > 0) ART.bolt(cx, V, FX.bolt, FX.boltX);
    const lo = camY - 200, hi = camY + CH / sc + 200;
    FX.flags = S.flags; FX.t = w.t;             // 깜빡이는 별은 물리 시계에 맞춰 그린다
    for (const p of w.plats) if (p.y > lo && p.y - p.h < hi) ART.plat(cx, V, p, T, FX);
    ART.lanterns(cx, V, T, goldA());
    ART.stars12(cx, V, T, goldB());
    // 파리
    for (let i = 0; i < L.flies.length; i++) { if (S.flies[i] && !(tng.on && !tng.gold && tng.idx === i && !tng.hit)) continue; const q = L.flies[i]; if (q.y < lo || q.y > hi) continue; (f.robo ? ART.battery : ART.fly)(cx, V.X(q.x), V.Y(q.y), sc, T, i, false); }
    for (let i = 0; i < L.golds.length; i++) { if (S.golds[i] && !(tng.on && tng.gold && tng.idx === i && !tng.hit)) continue; const q = L.golds[i]; if (q.y < lo || q.y > hi) continue; (f.robo ? ART.battery : ART.fly)(cx, V.X(q.x), V.Y(q.y), sc, T, i + 99, true); }
    // 까마귀
    if (crow.on) ART.crow(cx, V.X(crow.x), V.Y(crow.y), sc, crow.face, crow.mode, T);
    // 개구리
    const F = frogPose();
    ART.frog(cx, V.X(f.x), V.Y(f.y), sc, F, T);
    if (tng.on) {
      const [mx, my] = mouth(), k = tng.t < 0.09 ? tng.t / 0.09 : 1 - (tng.t - 0.09) / 0.11;
      if (!f.robo)                                   // 로봇개는 혀·빛줄기 없이 배터리가 그냥 들어간다(사장님 9/30 "빼도 될거같은데")
        ART.tongue(cx, V.X(mx), V.Y(my), V.X(mx + (tng.tx - mx) * k), V.Y(my + (tng.ty - my) * k), sc);
    }
    if (f.charging && mode === 'play') ART.gauge(cx, V.X(f.x), V.Y(f.y + 22), sc, f.charge);
    // 가루
    for (const q of parts) {
      const a = Math.min(1, q.life / q.max * 1.6), x = V.X(q.x), y = V.Y(q.y), r = q.size * sc;
      cx.globalAlpha = a;
      if (q.star) ART.star(cx, x, y, r, q.col);
      else if (q.bird) ART.bird(cx, x, y, sc, T + q.ph, q.vx > 0 ? 1 : -1);
      else if (q.chunk) { cx.fillStyle = q.col; cx.fillRect(x - r / 2, y - r / 2, r, r); }
      else { cx.fillStyle = q.col; cx.beginPath(); cx.arc(x, y, r * (1.4 - a * 0.4), 0, Math.PI * 2); cx.fill(); }
    }
    cx.globalAlpha = 1;
    // 튀어 오르는 글자
    for (const q of pops) {
      const k = q.t, x = V.X(q.x), y = V.Y(q.y + k * 50), size = (q.big ? 30 : 20) * Math.max(0.8, sc) * (k < 0.15 ? 0.6 + k / 0.15 * 0.4 : 1);
      cx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      cx.font = size + 'px TitleF, Ria, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.lineJoin = 'round'; cx.lineWidth = size * 0.28; cx.strokeStyle = '#173a14'; cx.strokeText(q.text, x, y);
      cx.fillStyle = q.col; cx.fillText(q.text, x, y);
    }
    cx.globalAlpha = 1;
    // 가장자리 어둡게
    const vg = cx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.45, CW / 2, CH / 2, Math.max(CW, CH) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    cx.fillStyle = vg; cx.fillRect(0, 0, CW, CH);
  }

  // ── 화면 흐름 ──
  function placeFrog(x, y) {
    f = PH.frog(x, y);
    let best = null;
    for (const p of w.plats) if (!p.gone && (!p.magic || (p.magic === 1 ? w.magicOn : w.magic2On)) && Math.abs(p.y - y) < 2 && x + 15 > p.x && x - 15 < p.x + p.w) best = p;
    if (!best) { best = w.plats.find(p => p.floor && p.z === PH.zoneOf(w, y)) || w.plats[0]; f.y = best.y; if (f.x < best.x || f.x > best.x + best.w) f.x = 60; }
    f.on = best; f.y = best.y; lastLandY = f.y; f.robo = CHAR === 'dog';
  }
  function showTitle() {
    mode = 'title'; FX.endT = null; cut = null;
    document.body.classList.remove('playing');
    $('title').classList.remove('hide'); $('topbar').classList.add('hide');
    const has = load();
    w.magicOn = FX.magicOn = goldA() === 12; FX.magicT = 9;
    w.magic2On = FX.magic2On = goldB() === 12; FX.magic2T = 9;
    placeFrog(S.x, S.y); camY = titleCam();
    $('bNew').classList.toggle('hide', !has);
    $('tEnd').classList.toggle('hide', !S.ended);
    AU.setBand(AU.bandOf(PH.zoneOf(w, f.y)));
  }
  function startPlay() {
    AU.init();
    mode = 'play';
    document.body.classList.add('playing');
    $('title').classList.add('hide'); $('topbar').classList.remove('hide');
    anim.ribbitT = 3;
    hud(); save();
    if (S.time < 1 && f.y < 10) setTimeout(() => banner(0), 400);
  }
  $('bStart').onclick = () => startPlay();
  // 캐릭터 고르기: 캐릭터마다 저장이 따로다
  const ICON = {
    fly: $('hF').previousElementSibling.outerHTML, gold: $('hG').previousElementSibling.outerHTML,
    bat: '<svg viewBox="0 0 24 24"><rect x="7" y="4" width="10" height="17" rx="2.5" fill="#5a6270" stroke="#1a1d24" stroke-width="1.4"/><rect x="10" y="2" width="4" height="3" rx="1" fill="#1a1d24"/><rect x="9" y="14" width="6" height="4.5" rx="1" fill="#6dff8a"/><rect x="9" y="8.8" width="6" height="4.5" rx="1" fill="#6dff8a"/><path d="M12.8 6.5 10.3 12h2.2l-1 4.8 3.3-6h-2.2z" fill="#fff"/></svg>',
    gbat: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(255,214,90,.35)"/><rect x="7" y="4" width="10" height="17" rx="2.5" fill="#f0c040" stroke="#7a4a00" stroke-width="1.4"/><rect x="10" y="2" width="4" height="3" rx="1" fill="#7a4a00"/><path d="M12.8 6.5 10.3 12h2.2l-1 4.8 3.3-6h-2.2z" fill="#7a4a00"/></svg>'
  };
  function paintIcons() {
    const robo = CHAR === 'dog';
    $('hF').previousElementSibling.outerHTML = robo ? ICON.bat : ICON.fly;
    $('hG').previousElementSibling.outerHTML = robo ? ICON.gbat : ICON.gold;
  }
  function paintChars() { $('cFrog').classList.toggle('on', CHAR === 'frog'); $('cDog').classList.toggle('on', CHAR === 'dog'); paintIcons(); }
  function pickChar(c) { if (CHAR === c) return; AU.init(); CHAR = c; try { localStorage.setItem('controlking.char', c); } catch (e) {} paintChars(); if (c === 'dog') AU.S.beep(); else AU.S.ribbit(); showTitle(); }
  $('cFrog').onclick = () => pickChar('frog'); $('cDog').onclick = () => pickChar('dog');
  paintChars();
  $('bNew').onclick = () => ask(EN ? 'Start over?' : '처음부터 할까요?', () => {
    try { localStorage.removeItem(SAVEKEY()); } catch (e) {}
    S = fresh(); w.magicOn = FX.magicOn = w.magic2On = FX.magic2On = false; placeFrog(S.x, S.y); camY = titleCam(); startPlay();
  });
  let askCb = null;
  function ask(text, cb) { $('askT').textContent = text; askCb = cb; $('ask').classList.remove('hide'); }
  $('askN').onclick = () => { $('ask').classList.add('hide'); askCb = null; };
  $('askY').onclick = () => { $('ask').classList.add('hide'); const c = askCb; askCb = null; if (c) c(); };
  $('ask').onclick = e => { if (e.target.id === 'ask') $('askN').click(); };

  function openPause() { mode = 'pause'; AU.S.chargeOff(); for (const k in keys) keys[k] = false; touchL = touchR = touchJ = false; syncKeys(); f.charging = false; f.charge = 0; save(); $('pause').classList.remove('hide'); }
  function closePause() { $('pause').classList.add('hide'); $('map').classList.add('hide'); mode = 'play'; }
  $('bResume').onclick = closePause;
  $('bHome').onclick = () => { $('pause').classList.add('hide'); save(); showTitle(); };
  $('bMap').onclick = () => { $('pause').classList.add('hide'); openMap(); };
  $('bMapX').onclick = () => { $('map').classList.add('hide'); $('pause').classList.remove('hide'); };

  const FLAG = '<svg viewBox="0 0 24 24"><path d="M5 3v19" stroke="#173a14" stroke-width="2.5"/><path d="M6 4c5-2 7 3 13 1v8c-6 2-8-3-13-1z" fill="#ff7a3c" stroke="#173a14" stroke-width="1.6"/></svg>';
  const GOLD = '<svg viewBox="0 0 24 24"><ellipse cx="8" cy="8" rx="5" ry="3" fill="#fffbe0" stroke="#b8902a" transform="rotate(-30 8 8)"/><ellipse cx="16" cy="8" rx="5" ry="3" fill="#fffbe0" stroke="#b8902a" transform="rotate(30 16 8)"/><ellipse cx="12" cy="14" rx="5" ry="4" fill="#f0b830" stroke="#8a5a10"/></svg>';
  const NOGOLD = '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="13" rx="5" ry="4" fill="none" stroke="rgba(23,58,20,.5)" stroke-width="1.6" stroke-dasharray="2 2"/></svg>';
  function openMap() {
    const cur = PH.zoneOf(w, f.y);
    $('mapL').innerHTML = NAMES.map((n, k) => {
      const ok = !!S.flags[k];
      return '<button class="zrow' + (ok ? '' : ' lock') + (k === cur ? ' here' : '') + '" data-k="' + k + '"><span class="n">' + (k + 1) + '</span><span class="nm">' + (ok ? n : '?') + '</span>' + (ok ? (S.golds[k] ? (CHAR === 'dog' ? ICON.gbat : GOLD) : NOGOLD) : '') + '</button>';
    }).join('');
    $('mapL').querySelectorAll('.zrow').forEach(b => b.onclick = () => {
      const k = +b.dataset.k; if (!S.flags[k]) return;
      const fl = w.plats.find(p => p.floor && p.z === k);
      placeFrog(60, fl.y); camY = camWant(); lastLandY = fl.y;
      $('map').classList.add('hide'); mode = 'play'; save();
    });
    $('map').classList.remove('hide');
  }

  // ── 엔딩 컷신: 마지막 점프로 달 조각 높이에 닿으면, 느린 화면으로 큰 달 꼭대기 옥토끼 옆까지 날아오른다 ──
  const MOON = { x: L.W * 0.62, cy: L.zoneTop[23] + 1560 - 150, R: 330 };     // art.js bigMoon 과 같은 자리
  const CUT_Y = L.zoneTop[23] + 1440;                 // 마지막 디딤별(1380) 위로 이만큼 뛰어오르면 컷신
  let cut = null;
  function cutCheck() {
    if (cut || f.on || !w.magic2On) return;
    if (f.y >= CUT_Y) startCut();
  }
  function startCut() {
    if (cut) return;
    const x1 = MOON.x - 38, y1 = MOON.cy + Math.sqrt(MOON.R * MOON.R - 38 * 38);
    cut = { t: 0, dur: 3.2, x0: f.x, y0: f.y, x1, y1, H: Math.max(90, y1 - f.y) * 0.55 + 60, py: f.y, sp: 0 };
    mode = 'cut'; S.ended = true; save();
    AU.S.chargeOff(); AU.S.magic(); AU.S.jump(1);
    document.body.classList.remove('playing');
    f.on = null; f.charging = false; f.charge = 0; f.stun = 0; f.face = x1 >= f.x ? 1 : -1;
    sparkle(f.x, f.y + 20, 30, '#ffd65a');
  }
  function cutStep(dt) {
    const c = cut; c.t += dt;
    const k = Math.min(1, c.t / c.dur), u = k + 0.13 * Math.sin(2 * Math.PI * k);   // 꼭대기 근처에서 제일 느리다
    const nx = c.x0 + (c.x1 - c.x0) * u, ny = c.y0 + (c.y1 - c.y0) * u + c.H * 4 * u * (1 - u);
    f.vy = (ny - c.py) / Math.max(dt, 1e-3) * 3; f.vx = 0; c.py = ny; f.x = nx; f.y = ny; f.on = null;
    c.sp -= dt; if (c.sp <= 0 && k < 1) { c.sp = 0.06; sparkle(f.x, f.y + 18, 2, Math.random() < 0.5 ? '#ffd65a' : '#fff6c0'); }
    if (k >= 1) {
      f.x = c.x1; f.y = c.y1; f.vy = 0; f.on = { x: c.x1 - 30, y: c.y1, w: 60, h: 10, t: 'moontop', z: 23 };
      anim.land = 1; AU.S.land(420); shake = 4; puff(f.x, f.y, 10, 'rgba(255,245,210,.9)', 90, 0.6, 4);
      mode = 'play'; ending();
    }
  }

  // ── 엔딩 ──
  function ending() {
    if (mode !== 'play') return;
    mode = 'end'; S.ended = true; save();
    AU.S.chargeOff(); AU.S.end();
    document.body.classList.remove('playing');
    sparkle(f.x, f.y + 30, 40, '#ffd65a');
    FX.endT = 0; FX.endX = f.x;                    // 옥토끼가 돌아보고 반긴다(art.js moonRabbit)
    setTimeout(() => AU.S.ribbit(), 900);
    setTimeout(() => {
      const s = Math.floor(S.time), tt = Math.floor(s / 3600) + ':' + String(Math.floor(s / 60) % 60).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      const st = (lab, v) => '<div class="stat"><b>' + lab + ' ' + v + '</b></div>';
      $('endSt').innerHTML = st(EN ? 'TIME' : '시간', tt) + st(EN ? 'JUMPS' : '점프', S.jumps) + st(EN ? 'FALLS' : '추락', S.falls) + st(CHAR === 'dog' ? (EN ? 'BATTERIES' : '배터리') : (EN ? 'FLIES' : '파리'), flyN() + '/' + L.flies.length);
      $('topbar').classList.add('hide');
      $('endUI').classList.add('on');
    }, 2600);
  }
  $('bEnd').onclick = () => { $('endUI').classList.remove('on'); showTitle(); };

  // ── 돌리기 ──
  let last = 0, rafOn = true;
  function loop(ts) {
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
    update(dt); render();
    if (rafOn) requestAnimationFrame(loop);
  }

  // 시험용 손잡이(미리보기 창은 rAF 가 돌지 않는다)
  window.__jp = {
    get S() { return S; }, get f() { return f; }, w, L, inp, anim, crow, FX,
    tick(n, dt) { dt = dt || 1 / 60; for (let i = 0; i < (n || 1); i++) update(dt); render(); },
    render, fit, start: startPlay, title: showTitle, placeFrog, openMap, openPause, ending, banner, startCut, get mode() { return mode; },
    set(o) { Object.assign(S, o); }, noSave(v) { noSave = v; }, stopRaf() { rafOn = false; },
    snap() { camY = mode === 'title' ? titleCam() : camWant(); }
  };

  // 영어판 글자
  if (EN) {
    document.documentElement.lang = 'en'; document.title = 'Control King';
    $('tH').textContent = 'CONTROL KING'; $('bNew').textContent = 'NEW GAME'; $('bResume').textContent = 'RESUME'; $('bMap').textContent = 'MAP';
    $('bHome').textContent = 'TITLE'; $('mapH').textContent = 'MAP'; $('bMapX').textContent = 'CLOSE'; $('askN').textContent = 'CANCEL'; $('askY').textContent = 'OK';
    $('cFrog').firstChild.textContent = 'FROG'; $('cDog').firstChild.textContent = 'ROBO DOG'; $('bEnd').textContent = 'TITLE'; $('keys').textContent = '←→ Move · Space Jump · P Pause';
  }
  showTitle();
  requestAnimationFrame(loop);
})();
