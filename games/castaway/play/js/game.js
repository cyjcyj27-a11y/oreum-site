/* game.js — 장면·입력·카메라·규칙·HUD */
(function () {
  const A = window.AUDIO, V = THREE.Vector3;
  const EN = /[?&]lang=en/.test(location.search);
  const $ = id => document.getElementById(id);
  const isTouch = ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');
  if (EN) { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(el => el.innerHTML = el.getAttribute('data-en')); document.title = 'Open Sea — Oreum Games'; }
  const T = (ko, en) => EN ? en : ko;

  const canvas = $('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 1.8)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xdcecf6, 50, 190);
  const camera = new THREE.PerspectiveCamera(58, 1, .1, 500);
  const sea = window.SEA.build(scene, isTouch);
  const W = window.WORLD.build(scene, sea);
  const F = window.FISH.init(scene, sea, { onNibble, onBite, onInterest });
  F.populate();
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  /* ---------- 상태 ---------- */
  let best = { days: 0, cm: 0 }; try { best = Object.assign(best, JSON.parse(localStorage.getItem('castaway.best') || '{}')); } catch (e) { }
  const G = { state: 'title', day: 1, food: 100, inv: {}, bait: 0, baitSp: null, time: 0, eatT: 0, cheerT: 0, pull: 0, baitUses: 0, bestCm: 0, caught: 0, overT: 0, ending: null, down: false, sit: false };
  // 낚시 단계: idle 대 들고 있음 · charge 힘 모으기 · flying 날아감 · float 찌 떠 있음 · bite 입질 · fight 싸움 · land 끌어올림
  const L = { st: 'idle', power: 0, t: 0, pos: new V(), vel: new V(), dip: 0, fish: null, dist: 0, dir: 0, tension: 0, sta: 1, run: 0, slackT: 0, hold: false, pulse: 0, biteT: 0, hookT: 0, reelTk: 0, jump: null };
  sea.dayT = 0.1;

  /* ---------- 입력 ---------- */
  let camYaw = Math.PI, camPitch = 0.05, lookDX = 0, lookDY = 0, dragging = false, orbitDrag = false;
  let orbYaw = 0, orbPitch = 0.72, orbDist = 6.4, orbFree = false;
  const FP = false, fpPitch = -0.22;   // 1인칭은 뺐다(2026-09-07 사장님 "필요없다") — 3인칭 고정. 둘러보기: 사람 바라보는 방향 기준 카메라 각·높이·거리
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'Space') { e.preventDefault(); actDown(); }
    if (e.code === 'Escape' && dexOpen) { toggleDex(false); return; }
    if (e.code === 'KeyD') { toggleDex(); return; }
    if (dexOpen) return;
    if (e.code === 'Digit1' || e.code === 'Digit2') eat(); if (e.code === 'KeyB') cycleBait(); if (e.code === 'KeyK') toggleSfx();
    if (e.code === 'Enter' && G.state === 'title') start();
  });
  addEventListener('keyup', e => { if (e.code === 'Space') actUp(); });
  canvas.addEventListener('mousedown', e => { if (e.button !== 0 && e.button !== 2) return; dragging = true; orbitDrag = e.button === 2; drag.x = e.clientX; drag.y = e.clientY; drag.moved = 0; });
  addEventListener('mousemove', e => { if (dragging) { lookDX += e.clientX - drag.x; lookDY += e.clientY - drag.y; drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y); drag.x = e.clientX; drag.y = e.clientY; } });
  addEventListener('mouseup', e => { dragging = false; orbitDrag = false; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { orbDist = Math.max(3, Math.min(13, orbDist + e.deltaY * 0.005)); e.preventDefault(); }, { passive: false });
  const drag = { x: 0, y: 0, moved: 0 }; const look = { id: null, x: 0, y: 0 }; const pinch = { id: null, x: 0, y: 0, d: 0 };
  canvas.addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (look.id === null) { look.id = t.identifier; look.x = t.clientX; look.y = t.clientY; } else if (pinch.id === null) { pinch.id = t.identifier; pinch.x = t.clientX; pinch.y = t.clientY; pinch.d = Math.hypot(look.x - t.clientX, look.y - t.clientY); } } e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === look.id) { if (pinch.id === null) { lookDX += (t.clientX - look.x) * 1.6; lookDY += (t.clientY - look.y) * 1.4; } look.x = t.clientX; look.y = t.clientY; } else if (t.identifier === pinch.id) { pinch.x = t.clientX; pinch.y = t.clientY; } } if (pinch.id !== null) { const d = Math.hypot(look.x - pinch.x, look.y - pinch.y); if (pinch.d > 0) orbDist = Math.max(3, Math.min(13, orbDist - (d - pinch.d) * 0.02)); pinch.d = d; } e.preventDefault(); }, { passive: false });
  const tEnd = e => { for (const t of e.changedTouches) { if (t.identifier === look.id) look.id = null; if (t.identifier === pinch.id) pinch.id = null; } };
  canvas.addEventListener('touchend', tEnd); canvas.addEventListener('touchcancel', tEnd);
  const btnAct = $('btnAct');
  btnAct.addEventListener('touchstart', e => { e.preventDefault(); actDown(); }, { passive: false });
  btnAct.addEventListener('touchend', e => { e.preventDefault(); actUp(); }, { passive: false });
  btnAct.addEventListener('touchcancel', e => { actUp(); });
  $('invF').addEventListener('click', () => toggleDex()); $('bait').addEventListener('click', cycleBait); $('titleDex').addEventListener('click', () => toggleDex(true)); $('dexX').addEventListener('click', () => toggleDex(false)); $('dex').addEventListener('click', e => { if (e.target === $('dex')) toggleDex(false); });
  $('btnSfx').addEventListener('click', toggleSfx); function toggleSfx() { const on = A.toggle(); $('btnSfx').classList.toggle('off', !on); }
  $('btnSfx').classList.toggle('off', !A.on);
  $('title').querySelector('.go.start').addEventListener('click', start);
  $('title').querySelector('.go.cont').addEventListener('click', resume);
  $('over').querySelector('.again').addEventListener('click', () => location.reload());
  let rotSkipped = false;
  function syncRot() { const w = innerWidth, h = innerHeight; if (w < 10 || h < 10) return; document.body.classList.toggle('portrait', isTouch && !rotSkipped && h > w * 1.02); }
  $('rotGo').addEventListener('click', () => { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', e => { e.preventDefault(); rotSkipped = true; syncRot(); });
  addEventListener('resize', syncRot); addEventListener('orientationchange', () => setTimeout(syncRot, 240)); syncRot(); setTimeout(syncRot, 400);

  /* ---------- HUD ---------- */
  let toastT = 0;
  function toast(txt, sub, red, len) { const el = $('toast'); el.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : ''); el.classList.toggle('red', !!red); el.classList.add('show'); toastT = len || 1.6; }
  function hud() {
    $('dayH').textContent = 'DAY ' + G.day;
    // 막대는 가득 차면 끝, 숫자는 쌓인 대로 보여 준다
    $('foodBar').style.width = Math.max(0, Math.min(100, G.food)) + '%';
    $('foodN').textContent = Math.max(0, Math.round(G.food)); $('food').classList.toggle('hot', G.food < 25);
    $('nF').textContent = invAll(); $('invF').classList.toggle('dim', !invAll());
    $('baitT').textContent = G.bait > 0 ? String(G.baitUses) : '—'; $('bait').className = 'stat item on' + G.bait;   // 남은 토막 수
    const m = $('meter'); if (L.st === 'charge') { m.className = 'show'; $('meterBar').style.width = (L.power * 100) + '%'; } else if (L.st === 'fight') { m.className = 'show tens' + (L.tension > 0.78 ? ' hot' : ''); $('meterBar').style.width = (Math.min(1, L.tension) * 100) + '%'; } else m.className = '';
    if (isTouch) { btnAct.className = 'tbtn' + (L.st === 'bite' ? ' bite' : ((L.hold || L.pulse > 0) ? ' on' : '')); btnAct.textContent = L.st === 'bite' ? T('걸기', 'HOOK') : (L.st === 'idle' || L.st === 'charge') ? T('던지기', 'CAST') : T('감기', 'REEL'); }
  }
  function pop(id) { const el = $(id); el.classList.remove('got'); void el.offsetWidth; el.classList.add('got'); }

  /* ---------- 규칙 ---------- */
  function start() {
    if (G.state !== 'title') return; A.unlock(); G.state = 'play'; $('title').classList.add('hide'); $('topbar').classList.add('show'); $('keys').classList.add('show'); document.body.classList.add('playing');
    camYaw = Math.PI; G.time = 0; hud(); saveT = 0;
    if (window.OG) OG.start();   // 집계: 한 판 시작
  }
  /* 저장 · 이어하기 — 노는 동안 5초마다, 창을 닫을 때. GAME OVER·엔딩 시작에서 지운다(사장님, 2026-09-09 "망망대해도 이어하기가 없어") */
  const SAVE_KEY = 'castaway.prog', SAVE_G = ['day', 'food', 'inv', 'bait', 'baitSp', 'baitUses', 'bestCm', 'caught']; let saveT = 0;
  function saveProg() { if (G.state !== 'play' || G.ending) return; try { const o = { v: 1, dayT: sea.dayT }; SAVE_G.forEach(k => o[k] = G[k]); localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) { } }
  function clearProg() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
  function loadProg() { try { const o = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return o && o.v === 1 && o.day >= 1 && o.food > 0 ? o : null; } catch (e) { return null; } }
  function resume() {
    const o = loadProg(); if (!o || G.state !== 'title') return;
    SAVE_G.forEach(k => { if (o[k] !== undefined) G[k] = o[k]; }); G.inv = G.inv || {}; sea.dayT = o.dayT || 0.1;
    if (G.baitSp && !F.BY[G.baitSp]) { G.baitSp = null; G.bait = 0; G.baitUses = 0; }
    W.setBait(G.bait); W.setRack(invAll());
    start();
  }
  $('title').querySelector('.go.cont').classList.toggle('off', !loadProg());   // 저장이 없으면 흐리게(눌러도 아무 일 없음)
  addEventListener('pagehide', saveProg); document.addEventListener('visibilitychange', () => { if (document.hidden) saveProg(); });
  const busy = () => G.state !== 'play' || G.eatT > 0 || dexOpen;
  function actDown() {
    if (dexOpen) return;
    if (G.state === 'title') { start(); return; }
    if (busy()) return;
    if (L.st === 'idle') { camYaw += orbYaw; orbYaw = 0; L.st = 'charge'; L.power = 0; L.t = 0; W.setPose('charge'); }   // 카메라가 보는 쪽으로 몸을 돌려 던진다
    else if (L.st === 'float') { L.hold = true; }
    else if (L.st === 'bite') { hookFish(); }
    else if (L.st === 'fight') { L.pulse = 0.3; A.reelTick(); }   // 한 번 누르면 한 번 감긴다 — 연타
  }
  function actUp() {
    if (L.st === 'charge') cast();
    L.hold = false;
  }
  function cast() {
    L.st = 'flying'; L.t = 0; const f = new V(Math.sin(camYaw), 0, Math.cos(camYaw)); const v = 6 + L.power * 11;   // 최대 힘이면 30m 남짓 — 참치 자리(20m 밖)는 넉넉히 닿고, 고기가 못 따라올 만큼 멀지는 않게
    L.pos.copy(W.rodTip); L.vel.copy(f).multiplyScalar(v * Math.cos(0.6)); L.vel.y = v * Math.sin(0.6);
    W.setPose('castEnd', null, null, 26); A.cast();   // 휙 던지는 동작
  }
  function onInterest(f) { }
  function onNibble(f) { if (L.st !== 'float') return; L.dip = 0.14 + f.len * 0.1; A.nibble(); W.splash(L.pos, 0.25); }
  function onBite(f) {
    if (L.st !== 'float') { f.state = 'wander'; F.active = null; return; }
    L.st = 'bite'; L.fish = f; L.biteT = f.sp.tier >= 3 ? 0.7 : f.sp.tier === 2 ? 0.85 : 1.0; L.dip = 0.5; A.bite(); W.splash(L.pos, 0.6 + f.len);
  }
  function hookFish() {
    const f = L.fish; L.st = 'fight'; L.hold = false; f.state = 'hooked'; f.t = 0;
    L.dist = Math.hypot(L.pos.x - W.raftPos.x, L.pos.z - W.raftPos.z); L.dir = Math.atan2(L.pos.z - W.raftPos.z, L.pos.x - W.raftPos.x);
    L.tension = 0.3; L.sta = 1; L.run = 0; L.runRest = 2.5; L.pulse = 0; L.slackT = 0; L.jump = null; A.hook(); W.setPose('fight');
    f.fightPos = new V(); f.thrash = 1;
  }
  function loseFish(why) {
    const f = L.fish; if (f) { f.state = 'flee'; f.fightPos = null; F.active = null; }
    L.fish = null; L.st = 'idle'; L.hold = false; W.setRodBend(0); W.setPose('idle');
    useBait();
    if (why === 'snap') { A.snap(); toast('SNAP', null, true); } else { A.miss(); toast('MISS', null, true); }
    hud();
  }
  function landFish() {
    const f = L.fish; L.st = 'land'; L.t = 0; f.state = 'caught'; f.flop = 2.2; f.fightPos = null; F.active = null; W.setRodBend(0); W.setPose('cheer', null, null, 14); G.cheerT = 1.3;   // 잡았다! 두 팔 번쩍
    const cm = Math.round(f.len * 100); G.caught++;
    const rec = cm > G.bestCm; G.bestCm = Math.max(G.bestCm, cm); if (cm > best.cm) { best.cm = cm; saveBest(); }
    A.catchFan(Math.min(3, f.sp.tier)); A.splash(1 + f.len);
    const name = EN ? f.sp.en : f.sp.ko;
    const first = dexRecord(f.sp.id, cm);
    if (first) { toast('NEW!', name + ' ' + cm + 'cm', false, 2.8); }
    else toast('CATCH!', name + ' ' + cm + 'cm' + (rec && G.caught > 1 ? ' · ' + T('신기록', 'NEW RECORD') : ''), false, 2.6);
    useBait();
    L.landFrom = f.pos.clone(); L.landTo = new V(); W.deckPoint(0.35, 0.15, L.landTo);
    if (f.sp.tier === 4) { G.ending = { t: 0 }; G.sit = true; W.setPose('sit'); clearProg(); }   // 엔딩은 거대 참다랑어(30번째)만
  }
  function eat(which) {
    if (G.state !== 'play' || G.eatT > 0 || (L.st !== 'idle' && L.st !== 'float')) return;
    // 고른 것이 없으면 작은 것부터 먹는다
    const sp = which && (G.inv[which] || 0) > 0 ? which : BAIT_ORDER.find(id => (G.inv[id] || 0) > 0); if (!sp) return;
    // 배는 100 에서 막히지 않고 쌓인다 — 999짜리 큰 고기를 먹으면 며칠을 간다 (사장님 2026-09-11)
    // 하루 = 150초, 배는 170초에 100 준다 — 100 이면 하루치다.
    G.inv[sp]--; const gain = F.BY[sp].food; G.food = Math.min(999, G.food + gain);
    G.eatT = 1.3; W.setPose('eat'); A.eat(); pop('food'); toast('+' + gain, null, false, 0.9); W.setRack(invAll()); hud();
    if (dexOpen) buildDex();
  }
  function cycleBait() {
    if (busy() || (L.st !== 'idle' && L.st !== 'float')) return;   // 찌가 떠 있을 때도 미끼를 바꿀 수 있다(사장님, 2026-09-09 만새기 단추)
    // 지금 걸린 미끼는 돌려받고 다음 것으로
    if (G.baitSp && G.baitUses === BAIT_USES[G.baitSp]) G.inv[G.baitSp] = (G.inv[G.baitSp] || 0) + 1;   // 안 쓴 미끼만 돌려받는다
    // 작은 것 → 큰 것 → 없음 순으로 돈다
    const cur = G.baitSp ? BAIT_ORDER.indexOf(G.baitSp) : -1; let next = null;
    for (let k = cur + 1; k < BAIT_ORDER.length; k++) if ((G.inv[BAIT_ORDER[k]] || 0) > 0) { next = BAIT_ORDER[k]; break; }
    if (next) G.inv[next]--;
    G.baitSp = next; G.bait = next ? F.BY[next].tier : 0; G.baitUses = next ? BAIT_USES[next] : 0; W.setBait(G.bait); W.setRack(invAll()); pop('bait'); hud();
  }
  function setBaitSp(id) {
    if (G.state !== 'play' || G.eatT > 0 || (L.st !== 'idle' && L.st !== 'float') || (G.inv[id] || 0) <= 0) return;
    if (G.baitSp === id && G.baitUses === BAIT_USES[id]) return;   // 이미 그게 걸려 있다
    if (G.baitSp && G.baitUses === BAIT_USES[G.baitSp]) G.inv[G.baitSp] = (G.inv[G.baitSp] || 0) + 1;   // 안 쓴 미끼만 돌려받는다
    G.inv[id]--; G.baitSp = id; G.bait = F.BY[id].tier; G.baitUses = BAIT_USES[id]; W.setBait(G.bait); W.setRack(invAll()); pop('bait'); hud();
    if (dexOpen) buildDex();
  }
  // 미끼 한 마리는 토막 내어 여러 번 쓴다 — 종마다 cut 토막 (사장님 2026-09-07). 순서는 작은(배부름 낮은) 것부터
  const BAIT_USES = {}; F.SPECIES.forEach(sp => BAIT_USES[sp.id] = sp.cut);
  const BAIT_ORDER = F.SPECIES.filter(sp => sp.cut > 0).sort((a, b) => a.food - b.food).map(sp => sp.id);
  // 가진 물고기 전부. 예전엔 미끼로 쓸 수 있는 것(cut>0)만 세서 돛새치·황새치를 잡아도 0 으로 나왔다 (사장님 2026-09-11)
  const invAll = () => F.SPECIES.reduce((n, sp) => n + (G.inv[sp.id] || 0), 0);

  /* ---------- 도감 ---------- */
  let DEX = {}; try { DEX = JSON.parse(localStorage.getItem('castaway.dex') || '{}') || {}; } catch (e) { }
  let dexOpen = false;
  const dexCount = () => F.SPECIES.filter(sp => DEX[sp.id]).length;
  function syncStage() {   // tier 1 순서: 멸치 → 자리돔 → 각재기 → 정어리 → 고등어 → 나머지. 거대 참다랑어는 나머지 29종을 다 잡은 뒤
    const has = id => !!DEX[id];
    const chain = ['anchovy', 'damsel', 'scad', 'sardine', 'mackerel']; let st = 0; while (st < chain.length && has(chain[st])) st++; F.stage = st;   // 멸치→자리돔→각재기→정어리→고등어 차례로 열린다
    F.giantOK = F.SPECIES.every(sp => sp.tier === 4 || has(sp.id));
  }
  syncStage();
  function dexRecord(id, cm) { const first = !DEX[id]; const d = DEX[id] || (DEX[id] = { n: 0, cm: 0 }); d.n++; d.cm = Math.max(d.cm, cm); try { localStorage.setItem('castaway.dex', JSON.stringify(DEX)); } catch (e) { } syncStage(); return first; }
  const CUT_SVG = $('bait').querySelector('svg').outerHTML;   // 상단바의 토막난 생선 그림을 그대로 쓴다
  function buildDex() {
    const grid = $('dexGrid'); grid.innerHTML = '';
    for (const sp of F.SPECIES) {
      const d = DEX[sp.id], n = G.inv[sp.id] || 0; const card = document.createElement('div'); card.className = 'card' + (n > 0 ? ' have' : d ? ' seen' : ' no');
      const img = document.createElement('img'); img.src = F.thumb(sp.id); img.alt = ''; card.appendChild(img);
      if (n > 0) { const b = document.createElement('b'); b.className = 'n'; b.textContent = '×' + n; card.appendChild(b); }
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = d ? (EN ? sp.en : sp.ko) : '???'; card.appendChild(nm);
      if (n > 0) {   // 먹기 · 미끼 고르기
        const acts = document.createElement('div'); acts.className = 'acts';
        const bE = document.createElement('button'); bE.type = 'button'; bE.className = 'act eat'; bE.innerHTML = '🍖 <b>+' + sp.food + '</b>'; bE.addEventListener('click', () => eat(sp.id)); acts.appendChild(bE);
        const bB = document.createElement('button'); bB.type = 'button'; bB.className = 'act bait' + ((L.st === 'idle' || L.st === 'float') ? '' : ' off'); bB.innerHTML = CUT_SVG + ' <b>×' + sp.cut + '</b>'; bB.addEventListener('click', () => setBaitSp(sp.id)); acts.appendChild(bB);
        card.appendChild(acts);
      } else { const rc = document.createElement('div'); rc.className = 'rc'; rc.textContent = d ? d.cm + 'cm' : (sp.len[0] + '~' + sp.len[1] + 'cm'); card.appendChild(rc); }
      grid.appendChild(card);
    }
    $('dexH').textContent = T('물고기 ', 'FISH ') + dexCount() + ' / ' + F.SPECIES.length;
  }
  function toggleDex(on) {
    on = on == null ? !dexOpen : on; if (on === dexOpen) return;
    if (on && G.state !== 'play' && G.state !== 'title') return;
    dexOpen = on; if (on) buildDex(); $('dex').classList.toggle('show', on); document.body.classList.toggle('dexOpen', on); $('titleDex').textContent = '🐟 ' + dexCount() + ' / ' + F.SPECIES.length;
    if (on && L.st === 'charge') { L.st = 'idle'; L.hold = false; W.setPose('idle'); }
  }
  $('titleDex').textContent = '🐟 ' + dexCount() + ' / ' + F.SPECIES.length;
  function useBait() { if (G.bait <= 0) return; G.baitUses--; if (G.baitUses <= 0) { G.bait = 0; G.baitSp = null; G.baitUses = 0; W.setBait(0); } }
  function saveBest() { try { localStorage.setItem('castaway.best', JSON.stringify(best)); } catch (e) { } }
  function gameOver() {
    G.state = 'over'; G.down = true; W.setPose('down'); W.setLine(false); L.st = 'idle'; A.gameover(); clearProg();
    if (window.OG) OG.over({ result: 'GAME OVER', day: G.day, cm: G.bestCm, dex: dexCount() });   // 집계: 한 판 끝
    if (G.day > best.days) { best.days = G.day; saveBest(); }
    setTimeout(() => { $('fade').classList.add('show'); }, 800);
    setTimeout(() => { $('overH').textContent = 'GAME OVER'; $('overDay').textContent = G.day; $('overDex').textContent = dexCount() + '/' + F.SPECIES.length; $('overCm').textContent = G.bestCm ? G.bestCm + 'cm' : '—'; $('over').classList.add('show'); }, 2400);
  }
  function showClear() {
    if (window.OG) OG.over({ result: 'CLEAR', day: G.day, cm: G.bestCm, dex: dexCount() });   // 집계: 클리어
    if (G.day > best.days) { best.days = G.day; saveBest(); }
    $('fade').classList.add('white'); $('fade').classList.add('show');
    setTimeout(() => { $('over').classList.add('clear'); $('overH').textContent = 'CLEAR'; $('overDay').textContent = G.day; $('overDex').textContent = dexCount() + '/' + F.SPECIES.length; $('overCm').textContent = G.bestCm + 'cm'; $('over').classList.add('show'); }, 1500);
  }
  { const b = []; if (best.days) b.push('DAY ' + best.days); if (best.cm) b.push(T('최고 ', 'BEST ') + best.cm + 'cm'); $('titleBest').textContent = b.join(' · '); }   // DAY 5 · 최고 97cm

  /* ---------- 프레임 ---------- */
  const tmpV = new V(), camTarget = new V(0, 0.5, -6), camLook = new V(); let popT = 0, lureT = 0, passT = 20, gullT = 5;
  const F_ = () => new V(Math.sin(camYaw), 0, Math.cos(camYaw));
  function frame(dt) {
    dt = Math.min(dt, 1 / 20); G.time += dt;
    // 시점
    // 대를 들고 있을 때 끌기 = 조준(사람이 같이 돈다). 줄이 나가 있거나 오른쪽 단추면 = 둘러보기(카메라만 돈다)
    // 끌기는 언제나 카메라만 돈다. 던지려고 누르는 순간 사람이 카메라가 보는 쪽으로 몸을 돌린다 (actDown)
    if (G.state === 'play') {
      { orbYaw -= lookDX * 0.005; orbPitch = Math.max(0.12, Math.min(1.25, orbPitch + lookDY * 0.004)); }
    }
    lookDX = lookDY = 0;
    // 하루
    if (G.state === 'play' || G.state === 'title') {
      sea.dayT += dt / 150;
      if (sea.dayT >= 1) { sea.dayT -= 1; if (G.state === 'play') { G.day++; toast('DAY ' + G.day, null, false, 2); A.day(); sea.sea = 0.7 + Math.random() * 0.8; A.setSea(sea.sea); W.gullCenter.set((Math.random() - .5) * 30, 0, (Math.random() - .5) * 30); } }
    }
    if (G.ending) { sea.dayT += (0.12 - sea.dayT) * dt * 0.3; }
    sea.update(dt, camera.position);
    scene.fog.color.copy(sea.U.uHorizon.value);

    /* 낚시 */
    const raft = W.raftPos; const f = L.fish;
    if (G.state === 'play') {
      G.food -= dt * (100 / 170); if (G.food <= 0) { G.food = 0; gameOver(); }
      saveT += dt; if (saveT > 5) { saveT = 0; saveProg(); }
      if (G.eatT > 0) { G.eatT -= dt; if (G.eatT <= 0) W.setPose(L.st === 'fight' ? 'fight' : 'idle'); }
      if (G.cheerT > 0) { G.cheerT -= dt; if (G.cheerT <= 0 && !G.ending) W.setPose('idle'); }
      G.pull += (((L.st === 'fight' && L.pulse > 0) ? 1 : 0) - G.pull) * Math.min(1, dt * 12);
      if (L.st === 'charge') { L.t += dt; L.power = 0.5 - 0.5 * Math.cos(L.t * 2.4); }
      else if (L.st === 'flying') {
        L.t += dt; L.vel.y -= 9.8 * dt; L.pos.addScaledVector(L.vel, dt);
        const h = sea.height(L.pos.x, L.pos.z);
        if (L.pos.y <= h) { L.pos.y = h; L.st = 'float'; L.dip = 0.25; lureT = 1.5; A.plop(); W.splash(L.pos, 0.5); W.setPose('idle'); }
        if (L.t > 0.35 && L.t < 0.4) W.setPose('idle');
      }
      else if (L.st === 'float' || L.st === 'bite') {
        if (L.hold && L.st === 'float') { // 감기 — 찌를 뗏목 쪽으로
          tmpV.copy(raft).sub(L.pos); tmpV.y = 0; const d = tmpV.length();
          if (d < 2.2) { L.st = 'idle'; L.hold = false; if (F.active) { F.active.state = 'wander'; F.active = null; } }
          else { L.pos.addScaledVector(tmpV.normalize(), 3.4 * dt); L.reelTk += dt; if (L.reelTk > 0.09) { L.reelTk = 0; A.reelTick(); } if (F.active && Math.random() < dt * 2) { F.active.state = 'wander'; F.active = null; } }
        }
        L.dip += (0 - L.dip) * Math.min(1, dt * 4);
        L.pos.y = sea.height(L.pos.x, L.pos.z) + 0.02 - L.dip;
        if (L.st === 'bite') { L.biteT -= dt; if (L.biteT <= 0) { const f2 = L.fish; f2.state = 'flee'; F.active = null; L.fish = null; L.st = 'float'; L.dip = 0; useBait(); A.miss(); toast('MISS', null, true); hud(); } }
      }
      else if (L.st === 'fight' && f) {
        f.t += dt; const sp = f.sp;
        // 체력은 줄이 팽팽할 때 빠진다
        // 체력은 줄이 팽팽할 때 빠지고, 달릴 때도 제풀에 빠진다
        L.sta = Math.max(0, L.sta - dt / sp.sta * (L.tension > 0.35 ? 1 : L.run > 0 ? 0.5 : 0.15));
        if (L.run <= 0 && L.runRest <= 0 && Math.random() < dt * (sp.tier >= 3 ? 0.3 : sp.tier === 2 ? 0.45 : 0.3) * (0.2 + L.sta)) {
          L.run = L.runDur = (sp.tier >= 3 ? 1.5 : 1.0) + Math.random() * 1.0; L.runRest = 1.2 + Math.random() * 1.5; A.splash(0.6 + f.len); W.splash(f.pos, 0.6 + f.len);   // 물보라가 예고
          if (sp.tier >= 2 && !L.jump && Math.random() < 0.55) { L.jump = { t: 0, dur: 0.75 + f.len * 0.15, h: 0.8 + f.len * 0.6 }; }
        }
        if (L.run > 0) L.run -= dt; else L.runRest -= dt;
        const runK = L.run > 0 ? Math.min(1, (L.runDur - L.run) / (sp.tier >= 3 ? 0.9 : 0.5)) : 0;   // 달리기 힘은 반 초(참치는 0.9초)에 걸쳐 차오른다
        const pullBase = sp.pull * (0.3 + 0.7 * L.sta), pull = pullBase * (1 + (sp.tier >= 3 ? 0.95 : 0.7) * runK);
        const far = L.dist > 28 ? 0.45 : 1;   // 줄이 많이 풀리면 물의 저항으로 덜 끌려 나간다
        // 긴장은 물고기 힘에 따른 목표치로 수렴한다 — 작은 놈은 계속 감아도 안 끊기고, 큰 놈은 달릴 때 감고 있으면 끊긴다
        const reeling = L.pulse > 0; L.pulse -= dt;
        if (reeling) { L.dist -= Math.max(0.5, 2.4 * (1 - pull * 0.7)) * dt; }
        else L.dist += pull * 2.6 * far * dt;
        // 안 달릴 때는 아무리 감아도 0.96 까지만 — 줄은 달릴 때만 끊긴다
        const target = reeling ? Math.min(0.96, 0.32 + 0.7 * pullBase) + 0.75 * (pull - pullBase) : (L.run > 0 ? pull * 0.35 : 0);
        L.tension += (target - L.tension) * Math.min(1, 1.5 * dt);
        L.tension = Math.max(0, Math.min(1.05, L.tension));
        if (L.tension > 0.75) A.creak(L.tension);
        if (L.tension >= 0.985 || L.dist > 60) { loseFish('snap'); }
        else {
          if (L.tension < 0.07) { L.slackT += dt; if (L.slackT > 2.4) loseFish('slack'); } else L.slackT = 0;
          if (L.st === 'fight') {
            L.dir += Math.sin(f.t * 0.7 + f.id) * dt * (L.run > 0 ? 1.1 : 0.45);
            f.fightPos.set(raft.x + Math.cos(L.dir) * L.dist, -(0.45 + f.len * 0.35), raft.z + Math.sin(L.dir) * L.dist);
            if (L.jump) { L.jump.t += dt; const k = L.jump.t / L.jump.dur; f.fightPos.y = -0.3 + Math.sin(Math.PI * Math.min(1, k)) * L.jump.h; if (k >= 1) { L.jump = null; W.splash(f.pos, 0.9 + f.len); A.splash(0.8 + f.len); } }
            f.thrash = 0.3 + L.tension * 0.7 + (L.run > 0 ? 0.5 : 0);
            L.pos.copy(f.fightPos); L.pos.y = Math.min(sea.height(L.pos.x, L.pos.z) - 0.1, f.fightPos.y + 0.4);
            W.setRodBend(0.15 + L.tension * 0.8);
            if (L.dist < 1.6) landFish();
          }
        }
      }
      else if (L.st === 'land' && f) {
        L.t += dt; const k = Math.min(1, L.t / 0.8); W.deckPoint(0.35, 0.15, L.landTo);
        f.pos.lerpVectors(L.landFrom, L.landTo, k); f.pos.y += Math.sin(Math.PI * k) * 1.5;
        f.grp.position.copy(f.pos); f.grp.rotation.set(0, -camYaw + Math.PI / 2, 0.1); f.grp.rotation.x = Math.sin(L.t * 12) * 0.25 * Math.max(0, 2 - L.t);
        if (L.t > 0.8 && L.t < 2.4 && Math.random() < dt * 4) A.flop();
        if (L.t > 2.4 && !G.ending) { G.inv[f.sp.id] = (G.inv[f.sp.id] || 0) + 1; pop('invF'); W.setRack(invAll()); F.remove(f); L.fish = null; L.st = 'idle'; hud(); }
        L.pos.copy(W.rodTip); L.pos.y -= 0.5;
      }
      // 물고기 무리 관리
      popT -= dt; if (popT <= 0) { popT = 6; F.keepPopulation((L.st === 'float' || L.st === 'bite') ? W.hookPoint : null); }
      passT -= dt; if (passT <= 0) { passT = 22 + Math.random() * 20; F.passerby(); }
      if (L.st === 'float' && G.bait > 0 && Math.hypot(L.pos.x - raft.x, L.pos.z - raft.z) > 12) { lureT -= dt; if (lureT <= 0) { lureT = 5; F.lure(G.bait, { hook: W.hookPoint, raft }); } }   // 큰 고기는 멀리 던졌을 때만 온다 — 찌 너머에서 나타나 다가온다
      gullT -= dt; if (gullT <= 0) { gullT = 6 + Math.random() * 14; A.gull(); }
    }
    if (L.st === 'idle' || G.state !== 'play') { L.pos.copy(W.rodTip); L.pos.y -= 0.55; L.pos.x += Math.sin(G.time * 1.3) * 0.05; }
    if (L.st === 'charge') { L.pos.copy(W.rodTip); L.pos.y -= 0.4; }
    W.bobber.position.copy(L.pos);
    W.bobber.rotation.set(L.st === 'flying' ? -0.6 : 0, 0, L.st === 'float' ? Math.sin(G.time * 2.1) * 0.12 : 0);
    tmpV.copy(L.pos); tmpV.y += 0.1; W.setLine(G.state !== 'over', tmpV, L.st === 'fight' ? 0.05 : L.st === 'flying' ? 0.1 : 0.35);
    if (L.st !== 'fight') W.setRodBend(L.st === 'charge' ? L.power * 0.25 : 0);
    W.setFacing(camYaw);

    /* 엔딩 — 참치와 함께 섬으로 */
    if (G.ending) {
      const E = G.ending; E.t += dt;
      if (E.t > 2.5 && !W.island.visible) { W.island.visible = true; const fd = F_(); W.island.position.copy(fd).multiplyScalar(260); W.island.position.y = 0; W.gullCenter.copy(fd).multiplyScalar(30); }
      if (W.island.visible) { const fd = F_(); const d = Math.max(75, 260 - (E.t - 2.5) * 16); W.island.position.copy(fd).multiplyScalar(d); }
      if (E.t > 15 && !E.done) { E.done = true; A.clear(); showClear(); }
    }

    /* 물고기 */
    const hookIn = (L.st === 'float' || L.st === 'bite') ? W.hookPoint : null;
    F.update({ dt, time: G.time, hook: hookIn, baitTier: G.bait, raft, allowBite: L.st === 'float' && G.state === 'play', night: sea.night > 0.5 });

    W.setFirstPerson(FP && G.state === 'play' && !G.ending);
    W.update(dt, { time: G.time, night: sea.night, down: G.down, sit: G.sit, pull: G.pull, crank: L.st === 'fight' && L.pulse > 0, eat: G.eatT > 0, fp: (FP && G.state === 'play' && !G.ending) ? { pitch: fpPitch } : null });

    /* 카메라 */
    if (G.state === 'title') {
      const a = G.time * 0.07 + Math.PI; camera.position.set(raft.x + Math.sin(a) * 9.5, raft.y + 3.0 + Math.sin(G.time * 0.3) * 0.2, raft.z + Math.cos(a) * 9.5); camLook.set(raft.x, raft.y + 0.9, raft.z); camera.lookAt(camLook);
    } else if (G.ending) {
      const E = G.ending, fd = F_(); const k = Math.min(1, Math.max(0, (E.t - 1.5) / 10));
      const dist = 5.4 + k * 12, h = 3 + k * 4; camera.position.copy(raft).addScaledVector(fd, -dist).add(new V(-fd.z * (1.2 + k * 3), h, fd.x * (1.2 + k * 3)));
      camLook.copy(raft).addScaledVector(fd, 8 + k * 30); camLook.y = raft.y + 0.6 + k * 3; camera.lookAt(camLook);
    } else if (FP && G.state === 'play') {
      const eye = W.eye(tmpV); camera.position.copy(eye);
      const cp = fpPitch; camLook.set(eye.x + Math.sin(camYaw) * Math.cos(cp), eye.y + Math.sin(cp), eye.z + Math.cos(camYaw) * Math.cos(cp)); camera.lookAt(camLook);
    } else {
      const fd = F_(); const right = new V(fd.z, 0, -fd.x);
      const bob = sea.height(raft.x, raft.z) * 0.4;
      const cy = camYaw + orbYaw, cp = orbPitch, cd = orbDist;
      camera.position.set(raft.x - Math.sin(cy) * Math.cos(cp) * cd, raft.y + Math.sin(cp) * cd + bob, raft.z - Math.cos(cy) * Math.cos(cp) * cd);
      camera.position.addScaledVector(right, -Math.cos(orbYaw) * 1.0);   // 돛 반대쪽(왼쪽 어깨) 너머
      orbFree = Math.abs(orbYaw) > 0.25;
      let want;
      if (orbFree) { want = tmpV.copy(raft).setY(raft.y + 1.0).clone(); }
      else if (L.st === 'fight' || L.st === 'float' || L.st === 'bite' || L.st === 'flying') { want = L.pos.clone(); want.y = Math.max(want.y, raft.y + 0.3); want.lerp(tmpV.copy(raft).addScaledVector(fd, 7).setY(raft.y + 0.4), 0.2); }
      else { want = tmpV.copy(raft).addScaledVector(fd, 7); want.y = raft.y + 0.4 - camPitch * 5; }
      if (G.state === 'over') { want = tmpV.copy(raft).setY(raft.y + 0.5); camera.position.y -= Math.min(1.5, G.overT += dt * 0.3); }
      camTarget.lerp(want, Math.min(1, dt * 3)); camera.lookAt(camTarget);
    }
    if (window.__dbgCam) { camera.position.copy(window.__dbgCam.p); camera.lookAt(window.__dbgCam.l); }
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('show'); }
    hud();
    renderer.render(scene, camera);
  }
  let last = performance.now();
  function loop(now) { const dt = (now - last) / 1000; last = now; frame(dt); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  hud();
  window.__cw = { saveProg, resume, loadProg, orbit(y, p, d) { orbYaw = y; if (p != null) orbPitch = p; if (d != null) orbDist = d; }, render() { renderer.render(scene, camera); }, tick(n, dt) { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 60); }, G, L, F, W, sea, camera, start, actDown, actUp, eat, cycleBait, toggleDex, dexRecord, setBaitSp, setYaw(y) { camYaw = y; }, landFish, hookFish };
})();
