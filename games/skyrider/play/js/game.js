// 메인 루프 — 오토바이 조종, 라이더 그리기, 카메라, HUD, 배달
(function () {
  const T = TERRAIN;
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 2600);

  // 첫 프레임: 하늘만 바로 그린다 (세계는 다음 틱에 만든다)
  SCENERY.initSky(scene); camera.position.set(0, 0, 0); camera.lookAt(1, 0.25, 0);
  (function sizeNow() { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); })();
  renderer.render(scene, camera);
  setTimeout(function boot() {
  SCENERY.init(scene); FX.init(scene); DELIVERY.init(scene);
  const P = PLAYER.pts;

  // ── 라이더 메시 ───────────────────────────────────
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8b190, roughness: 0.8 });
  const red = new THREE.MeshStandardMaterial({ color: 0xa02a22, roughness: 0.85 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x2b2d36, roughness: 0.9 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x141215, roughness: 0.9 });
  const cylG = new THREE.CylinderGeometry(1, 1, 1, 10, 1);
  const sphG = new THREE.SphereGeometry(1, 12, 10);
  const segs = [], joints = [];
  function seg(a, b, r0, r1, mat) { const m = new THREE.Mesh(cylG, mat); m.castShadow = true; scene.add(m); segs.push({ m, a, b, r0, r1 }); }
  function joint(n, r, mat, sy) { const m = new THREE.Mesh(sphG, mat); m.castShadow = true; scene.add(m); joints.push({ m, n, r, sy: sy || 1 }); }
  const glove = new THREE.MeshStandardMaterial({ color: 0x2a2320, roughness: 0.8 });
  const boot = new THREE.MeshStandardMaterial({ color: 0x1e1a18, roughness: 0.6 });
  const helmetM = new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.35, metalness: 0.1 });
  const visorM = new THREE.MeshStandardMaterial({ color: 0x1a2430, roughness: 0.2, metalness: 0.6 });
  seg('neck', 'head', 0.05, 0.055, skin);
  seg('neck', 'chest', 0.1, 0.15, red);
  seg('chest', 'hip', 0.155, 0.135, red);
  seg('shL', 'shR', 0.06, 0.06, red);   // 어깨
  seg('shL', 'elbowL', 0.062, 0.052, red); seg('elbowL', 'handL', 0.05, 0.042, red);
  seg('shR', 'elbowR', 0.062, 0.052, red); seg('elbowR', 'handR', 0.05, 0.042, red);
  seg('hip', 'kneeL', 0.08, 0.065, pants); seg('kneeL', 'footL', 0.062, 0.05, pants);
  seg('hip', 'kneeR', 0.08, 0.065, pants); seg('kneeR', 'footR', 0.062, 0.05, pants);
  joint('head', 0.125, skin); joint('chest', 0.14, red); joint('hip', 0.125, pants);
  joint('shL', 0.07, red); joint('shR', 0.07, red); joint('elbowL', 0.055, red); joint('elbowR', 0.055, red); joint('handL', 0.062, glove, 0.8); joint('handR', 0.062, glove, 0.8);
  joint('kneeL', 0.075, pants); joint('kneeR', 0.075, pants); joint('footL', 0.085, boot, 0.6); joint('footR', 0.085, boot, 0.6);
  // 헬멧 + 바이저 + 등가방 (머리·가슴을 따라간다)
  const helmet = new THREE.Mesh(sphG, helmetM); helmet.scale.set(0.165, 0.155, 0.17); helmet.castShadow = true; scene.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.06), visorM); scene.add(visor);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.22), new THREE.MeshStandardMaterial({ color: 0xd42a1a, roughness: 0.7 })); pack.castShadow = true; scene.add(pack);
  const packLid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.24), new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.7 })); scene.add(packLid);
  const _fwd = new THREE.Vector3(), _rgt = new THREE.Vector3(), _upv = new THREE.Vector3();
  const hair = { position: new THREE.Vector3() };
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _q = new THREE.Quaternion();
  function drawBody() {
    for (const s of segs) {
      const a = P[s.a], b = P[s.b];
      _a.set(a.x, a.y, a.z); _b.set(b.x, b.y, b.z); _d.subVectors(_b, _a);
      const L = _d.length(); if (L < 1e-5) continue;
      _q.setFromUnitVectors(_up, _d.multiplyScalar(1 / L));
      s.m.quaternion.copy(_q); s.m.position.addVectors(_a, _b).multiplyScalar(0.5);
      s.m.scale.set((s.r0 + s.r1) * 0.5, L, (s.r0 + s.r1) * 0.5);
    }
    for (const j of joints) { const p = P[j.n]; j.m.position.set(p.x, p.y, p.z); j.m.scale.set(j.r, j.r * j.sy, j.r); }
    const h = P.head, c = P.chest, hp = P.hip;
    const B = bike(); _fwd.set(0, 0, 1).applyQuaternion(B.g.quaternion); _rgt.set(1, 0, 0).applyQuaternion(B.g.quaternion); _upv.set(0, 1, 0).applyQuaternion(B.g.quaternion);
    helmet.position.set(h.x, h.y + 0.02, h.z).addScaledVector(_fwd, 0.01); helmet.quaternion.copy(B.g.quaternion);
    visor.position.set(h.x, h.y - 0.01, h.z).addScaledVector(_fwd, 0.15); visor.quaternion.copy(B.g.quaternion);
    // 가방: 가슴 뒤
    _d.set(c.x - hp.x, c.y - hp.y, c.z - hp.z).normalize();
    pack.position.set((c.x + hp.x) / 2, (c.y + hp.y) / 2 + 0.05, (c.z + hp.z) / 2).addScaledVector(_fwd, -0.26); pack.quaternion.copy(B.g.quaternion);
    packLid.position.copy(pack.position).addScaledVector(_upv, 0.21); packLid.quaternion.copy(B.g.quaternion);
  }

  // ── 입력 ──────────────────────────────────────────
  const input = { keys: {}, resetHold: 0, touch: false, drag: null, tSteer: 0, tFwd: 0, btnUp: false, btnDn: false };
  let started = false, t0 = performance.now(), paused = false, pausedAt = 0;
  let titleFreeze = false, titleDrag = null, titleYaw = 0, titlePitch = 0, titleDist = 13;   // 제목 화면 카메라: 끌어서 돌리기, C 로 흔들림 멈춤
  const KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1, Space: 1, ShiftLeft: 1, ShiftRight: 1, ControlLeft: 1, ControlRight: 1 };
  window.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyC' && !started) { titleFreeze = !titleFreeze; return; }
    if (KEYS[e.code]) { e.preventDefault(); input.keys[e.code] = true; if (!started) start(); }
    if (e.repeat) return;
    if (e.code === 'KeyM') { AUDIO.init(); const on = AUDIO.toggleMusic(); UI.msg(on ? TX('음악 켬', 'Music ON') : TX('음악 끔', 'Music OFF')); syncTog(); }
    if (e.code === 'KeyK') { AUDIO.init(); const on = AUDIO.toggleSfx(); UI.msg(on ? TX('효과음 켬', 'Sound ON') : TX('효과음 끔', 'Sound OFF')); syncTog(); }
    if (e.code === 'KeyR') input.resetHold = 0.0001;
    if (e.code === 'KeyF') input.far = !input.far;
    if ((e.code === 'KeyP' || (e.code === 'Escape' && !shopOpen && !bigOpen)) && started && !DEAD.on) togglePause();
    if (e.code === 'KeyG' && started) { if (shopOpen) closeShop(); else openShop(); }
    if (e.code === 'Escape') { if (shopOpen) closeShop(); if (bigOpen) closeBig(); }
    if (e.code === 'KeyT' && started) { if (bigOpen) closeBig(); else openBig(); }
  });
  window.addEventListener('keyup', e => { if (KEYS[e.code]) input.keys[e.code] = false; if (e.code === 'KeyR') input.resetHold = 0; });
  window.addEventListener('blur', () => { input.keys = {}; input.resetHold = 0; });
  const orbit = { yaw: 0, pitch: 0, dist: 8.5, drag: null, idle: 0 };
  window.addEventListener('pointerdown', e => {
    if (!started) {   // 제목 화면: 끌면 카메라가 돌고, 그냥 누르면 시작
      titleDrag = { x: e.clientX, y: e.clientY, moved: false }; return;
    }
    if (e.target.closest && e.target.closest('button')) return;
    if (e.pointerType === 'touch') { input.touch = true; input.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; }
    else orbit.drag = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointermove', e => {
    if (titleDrag) {
      const dx = e.clientX - titleDrag.x, dy = e.clientY - titleDrag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) titleDrag.moved = true;
      titleYaw -= dx * 0.006; titlePitch = Math.max(-0.4, Math.min(0.8, titlePitch + dy * 0.004)); titleFreeze = true;
      titleDrag.x = e.clientX; titleDrag.y = e.clientY; return;
    }
    if (e.pointerType !== 'touch') {
      if (orbit.drag) { orbit.yaw -= (e.clientX - orbit.drag.x) * 0.006; orbit.pitch = Math.max(-0.5, Math.min(0.9, orbit.pitch + (e.clientY - orbit.drag.y) * 0.004)); orbit.drag.x = e.clientX; orbit.drag.y = e.clientY; orbit.idle = 0; }
      return;
    }
    if (!input.drag || input.drag.id !== e.pointerId) return;
    input.tSteer = Math.max(-1, Math.min(1, (e.clientX - input.drag.x) / 90));
    input.tFwd = Math.max(-1, Math.min(1, (input.drag.y - e.clientY) / 90));
  });
  window.addEventListener('wheel', e => { if (!started) { titleDist = Math.max(7, Math.min(24, titleDist + e.deltaY * 0.01)); return; } orbit.dist = Math.max(5, Math.min(18, orbit.dist + e.deltaY * 0.01)); }, { passive: true });
  const endDrag = e => { if (titleDrag) { const m = titleDrag.moved; titleDrag = null; if (!m && !started) start(); return; } if (e.pointerType !== 'touch') orbit.drag = null; if (input.drag && input.drag.id === e.pointerId) { input.drag = null; input.tSteer = input.tFwd = 0; } };
  window.addEventListener('pointerup', endDrag); window.addEventListener('pointercancel', endDrag);
  const bUp = document.getElementById('up'), bDn = document.getElementById('dn');
  for (const [el, k] of [[bUp, 'btnUp'], [bDn, 'btnDn']]) {
    el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); input[k] = true; if (!started) start(); });
    el.addEventListener('pointerup', () => { input[k] = false; }); el.addEventListener('pointercancel', () => { input[k] = false; }); el.addEventListener('pointerleave', () => { input[k] = false; });
  }
  // 십자 화살표: 누르는 동안만 (앞뒤 = padF, 좌우 = padS. 왼쪽이 +)
  input.padF = 0; input.padS = 0;
  for (const [id, key, val] of [['padU', 'padF', 1], ['padD', 'padF', -1], ['padL', 'padS', 1], ['padR', 'padS', -1]]) {
    const el = document.getElementById(id); if (!el) continue;
    const off = () => { if (input[key] === val) input[key] = 0; };
    el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); input[key] = val; if (!started) start(); });
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  }
  // 브라우저를 숨기거나 닫으면 소리도 같이 멈춘다
  document.addEventListener('visibilitychange', () => { if (window.AUDIO && AUDIO.pause) AUDIO.pause(document.hidden || paused); });
  window.addEventListener('pagehide', () => { if (window.AUDIO && AUDIO.pause) AUDIO.pause(true); });
  if ('ontouchstart' in window) { document.body.classList.add('touch'); input.touch = true; }
  const btnMusic = document.getElementById('btnMusic'), btnSfx = document.getElementById('btnSfx');
  function syncTog() { btnMusic.classList.toggle('off', !AUDIO.musicOn); btnSfx.classList.toggle('off', !AUDIO.sfxOn); }
  btnMusic.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AUDIO.init(); AUDIO.toggleMusic(); syncTog(); });
  btnSfx.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); AUDIO.init(); AUDIO.toggleSfx(); syncTog(); });
  syncTog();
  function togglePause() {
    if (!started || DEAD.on) return;
    paused = !paused;
    if (paused) { pausedAt = performance.now(); input.keys = {}; input.btnUp = input.btnDn = false; input.drag = null; input.tSteer = input.tFwd = 0; input.padF = input.padS = 0; }
    else t0 += performance.now() - pausedAt;
    document.getElementById('pause').classList.toggle('show', paused);
    document.getElementById('btnPause').textContent = paused ? '▶' : '❚❚';
    AUDIO.pause(paused);
  }
  document.getElementById('btnPause').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); togglePause(); });
  document.getElementById('pause').addEventListener('pointerdown', e => { e.stopPropagation(); togglePause(); });

  // 폰은 가로 전용: 시작하는 손짓에 전체화면 + 가로 고정을 건다 (막히면 그냥 넘어간다)
  function lockLandscape() {
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => { }); } catch (e) { }
  }
  document.addEventListener('fullscreenchange', () => { if (document.fullscreenElement && input.touch) lockLandscape(); });
  function start() {
    started = true; AUDIO.init();
    if (input.touch) { try { const el = document.documentElement; const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (p && p.then) p.then(lockLandscape).catch(() => { }); else lockLandscape(); } catch (e) { lockLandscape(); } }
    document.getElementById('title').classList.add('hide');
    document.getElementById('hud').classList.add('show'); document.getElementById('topbar').classList.add('show'); mmC.classList.add('show');
    t0 = performance.now();
    scheduleFirstOrder();
  }
  // 첫 주문은 10초 뒤에 (멈춤 중이면 풀릴 때까지 기다린다). 다시 시작하면 옛 예약은 버린다
  let orderGen = 0;
  function scheduleFirstOrder() {
    const gen = ++orderGen;
    setTimeout(function firstOrder() { if (gen !== orderGen) return; if (paused) { setTimeout(firstOrder, 500); return; } if (!DEAD.on) DELIVERY.begin(bike().g.position); }, 10000);
  }
  // RETRY: 페이지를 다시 읽지 않고 제자리에서 다시 시작 (전체화면·가로 고정이 안 풀린다)
  function restart() {
    if (DEAD.go) { const go = DEAD.go; DEAD.go = null; const over = document.getElementById('over'); window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true); over.removeEventListener('click', go, true); over.removeEventListener('touchend', go, true); }
    input.drag = null; input.padF = input.padS = 0; input.btnUp = input.btnDn = false; input.tSteer = input.tFwd = 0;
    const bankrupt = (DEAD.reason || '').startsWith('파산');
    DEAD.on = false; DEAD.shown = false; DEAD.t = 0; DEAD.reason = '';
    HP.hp = HP.max; HP.inv = 0; drawHp();
    FUEL.fuel = FUEL.tank; FUEL.warnT = 0; FUEL.refueling = false;
    const B = bike(); B.g.rotation.set(0, 0, 0); SCENERY.parkBikeAtHome(); seatRider(); snapCamera(); shake = 0;
    DELIVERY.reset(); if (bankrupt) DELIVERY.D.money = 10;
    document.getElementById('over').classList.remove('show');
    document.getElementById('hud').classList.add('show'); document.getElementById('topbar').classList.add('show'); mmC.classList.add('show');
    paused = false; t0 = performance.now();
    scheduleFirstOrder();
  }

  // ── 오토바이 ───────────────────────────────────────
  const FUEL = { tank: 100, fuel: 100, price: 1.0 / 100, refueling: false };   // 한 통 가득 = 1코인
  // ── 오토바이 기종 ──────────────────────────────────
  const BIKES = [
    { name: TX('스쿠터', 'Scooter'), pay: 10, tag: TX('가볍고 싸다. 한 번 부딪히면 끝', 'Light and cheap. One hit and it is over'), price: 0, color: 0xf0ede4, speed: 20, accel: 12, turn: 1.6, climb: 9, tank: 100, eff: 1.0, tough: 10, cargo: 0.9, extra: 'scooter', hp: 1, bars: [1, 1, 3, 2, 1], sink: 8, lift: 13 },
    { name: TX('오프로드', 'Off-road'), pay: 20, tag: TX('스쿠터 내구성의 두 배', 'Twice the scooter durability'), price: 100, color: 0xd42a1a, speed: 24, accel: 15, turn: 1.8, climb: 11, tank: 110, eff: 1.1, tough: 10, cargo: 1.0, extra: 'dirt', hp: 2, bars: [2, 2, 3, 2, 2], sink: 8, lift: 12 },
    { name: TX('슈퍼스포츠', 'Supersport'), pay: 30, tag: TX('스포티한 감각. 바람을 느껴봐', 'Sporty feel. Feel the wind'), price: 300, color: 0x2352c8, speed: 28, accel: 18, turn: 2.1, climb: 11, tank: 90, eff: 0.6, tough: 10, cargo: 1.2, extra: 'sport', hp: 3, bars: [3, 3, 2, 3, 2], sink: 7, lift: 15 },
    { name: TX('전기 바이크', 'Electric Bike'), pay: 50, tag: TX('하이브리드, 기름은 반만', 'Hybrid, half the fuel'), price: 500, color: 0xeeeeea, speed: 32, accel: 22, turn: 1.9, climb: 12, tank: 120, eff: 0.4, tough: 10, cargo: 0.7, extra: 'electric', hp: 4, bars: [4, 4, 4, 5, 3], quiet: true, sink: 6, lift: 11 },
    { name: TX('호버바이크', 'Hoverbike'), pay: 100, tag: TX('태양광, 기름 없이 난다. 멈춰도 안 떨어진다', 'Solar. Flies without fuel, never drops when stopped'), price: 1000, color: 0xf4f1ea, speed: 36, accel: 24, turn: 2.0, climb: 16, tank: 130, eff: 0, solar: true, tough: 10, cargo: 0.8, extra: 'sky', hp: 5, bars: [5, 5, 3, 4, 5], sink: 0, lift: 1, hover: true },
  ];
  const GARAGE = { owned: [0], cur: 0 };
  try { const g = JSON.parse(localStorage.getItem('maedal.garage') || 'null'); if (g && Array.isArray(g.owned)) { GARAGE.owned = g.owned.filter(i => BIKES[i]); if (!GARAGE.owned.includes(0)) GARAGE.owned.unshift(0); GARAGE.cur = BIKES[g.cur] && GARAGE.owned.includes(g.cur) ? g.cur : 0; } } catch (e) { }
  function saveGarage() { try { localStorage.setItem('maedal.garage', JSON.stringify(GARAGE)); } catch (e) { } }
  function bikeSpec() { return BIKES[GARAGE.cur]; }
  function applyBike(i) {
    HP.max = HP.hp = BIKES[i].hp || 3; try { drawHp(); } catch (e) {}
    if (window.SCENERY && SCENERY.spawnCrows && SCENERY.S.huts.length) SCENERY.spawnCrows(i);   // 좋은 기종일수록 까마귀가 많다
    GARAGE.cur = i; const sp = BIKES[i]; const B = bike();
    B.paint.color.set(sp.color);
    for (const k in B.extras) for (const m of B.extras[k]) m.visible = (k === sp.extra);
    const ratio = FUEL.tank > 0 ? FUEL.fuel / FUEL.tank : 1; FUEL.tank = sp.tank; FUEL.price = 1.0 / sp.tank; FUEL.fuel = Math.min(sp.tank, Math.max(FUEL.fuel, sp.tank * ratio));
    saveGarage();
  }
  const DEAD = { on: false, t: 0, reason: '' };
  const HP = { max: 3, hp: 3, inv: 0 };
  const RIDE = { vel: new THREE.Vector3(), fwd: new THREE.Vector3(0, 0, 1), yaw: 0, pitch: 0, roll: 0, targets: { hip: [0, 0, 0], handL: [0, 0, 0], handR: [0, 0, 0], footL: [0, 0, 0], footR: [0, 0, 0], kneeL: [0, 0, 0], kneeR: [0, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0], shL: [0, 0, 0], shR: [0, 0, 0], elbowL: [0, 0, 0], elbowR: [0, 0, 0], lean: [0, 0, 0] }, bob: 0 };
  const _bv = new THREE.Vector3(), _bpt = { x: 0, y: 0, z: 0 };
  function bike() { return SCENERY.S.bike; }
  function seatRider() {
    const B = bike(); RIDE.yaw = B.g.rotation.y; RIDE.vel.set(0, 0, 0);
    PLAYER.resetAt(B.g.position.x, B.g.position.y, B.g.position.z);
    updateRideTargets(); PLAYER.setRide(RIDE.targets);
  }
  function updateRideTargets() {
    const B = bike(); B.g.updateMatrixWorld();
    const sp = Math.min(1, RIDE.vel.length() / 25);
    const lean = 0.12 * sp, side = -RIDE.roll * 0.35, bob = Math.sin(performance.now() * 0.011) * 0.012 * sp;
    for (const n in B.seat) {
      const s = B.seat[n]; let x = s[0], y = s[1], z = s[2];
      if (n === 'chest') { z += lean * 0.5; y += bob; x += side * 0.4; }
      if (n === 'shL' || n === 'shR') { z += lean * 0.65; y += bob; x += side * 0.55; }
      if (n === 'elbowL' || n === 'elbowR') { z += lean * 0.3; y += bob * 0.5; x += side * 0.3; }
      if (n === 'neck') { z += lean * 0.8; y += bob; x += side * 0.7; }
      if (n === 'head') { z += lean * 1.1; y += bob * 1.2; x += side; }
      _bv.set(x, y, z).applyMatrix4(B.g.matrixWorld); const t = RIDE.targets[n]; t[0] = _bv.x; t[1] = _bv.y; t[2] = _bv.z;
    }
  }
  let bumpCD = 0, shake = 0;
  function bump(nx, ny, nz) {
    const vn = RIDE.vel.x * nx + RIDE.vel.y * ny + RIDE.vel.z * nz;
    if (vn < 0) {
      const SPEC = bikeSpec();
      if (FUEL.fuel <= 0 && -vn > 2) { crash('연료가 떨어져 추락했다'); return; }
      if (-vn > SPEC.tough * 0.55) { RIDE.vel.x -= vn * nx * 1.8; RIDE.vel.y -= vn * ny * 1.8; RIDE.vel.z -= vn * nz * 1.8; RIDE.vel.multiplyScalar(0.35); damage('절벽에 부딪혔다'); return; }
      RIDE.vel.x -= vn * nx * 1.5; RIDE.vel.y -= vn * ny * 1.5; RIDE.vel.z -= vn * nz * 1.5;
      if (-vn > 3 && bumpCD <= 0) { bumpCD = 0.5; shake = Math.min(1, -vn / 12); AUDIO.land(-vn); FX.dust(bike().g.position, 12); RIDE.vel.multiplyScalar(SPEC.tough >= 15 ? 0.9 : 0.6); DELIVERY.hit(-vn * SPEC.cargo); }
    }
  }
  // ── 데미지: 3번이면 추락 ────────────────────────────
  const elHp = document.getElementById('hp'), elHit = document.getElementById('hit');
  function drawHp() { let s = ''; for (let i = 0; i < HP.max; i++) s += '<svg class="wr' + (i < HP.hp ? '' : ' off') + '"><use href="#wr"/></svg>'; elHp.querySelector('b').innerHTML = s; }
  function damage(reason) {
    if (DEAD.on || HP.inv > 0) return;
    HP.hp--; HP.inv = 1.2; drawHp();
    shake = 1.0; AUDIO.crash(0.49); FX.dust(bike().g.position, 18);
    elHit.classList.add('on'); setTimeout(() => elHit.classList.remove('on'), 220);
    elHp.classList.remove('shake'); void elHp.offsetWidth; elHp.classList.add('shake');
    if (HP.hp <= 0) crash(reason);
  }
  // ── 추락 / 게임오버 ────────────────────────────────
  function crash(reason) {
    if (DEAD.on) return;
    DEAD.on = true; DEAD.t = 0; DEAD.reason = reason;
    const B = bike(); B.riding = false; B.throttle = 0;
    // 라이더가 튕겨 나간다
    PLAYER.setRide(null);
    for (const n of PLAYER.order) { const p = P[n]; p.px = p.x - RIDE.vel.x / 120 - RIDE.fwd.x * 0.03; p.py = p.y - 0.03; p.pz = p.z - RIDE.vel.z / 120 - RIDE.fwd.z * 0.03; }
    shake = 1.2; AUDIO.crash(0.7); FX.dust(B.g.position, 30);
    RIDE.vel.multiplyScalar(0.3); RIDE.vel.y = 2;
  }
  function gameOver(reason) {
    if (DEAD.shown) return; DEAD.shown = true;
    const D = DELIVERY.D;
    try { if (reason.startsWith('파산')) localStorage.removeItem('maedal.money'); else localStorage.setItem('maedal.money', String(Math.max(0, Math.round(D.money)))); } catch (e) { }
    document.getElementById('overReason').textContent = 'GAME OVER';
    document.getElementById('overStat').textContent = reason.startsWith('파산') ? '' : '🪙 ' + Math.round(D.money);
    document.getElementById('over').classList.add('show');
    document.getElementById('hud').classList.remove('show'); document.getElementById('topbar').classList.remove('show'); mmC.classList.remove('show'); closeBig(); elTut.classList.remove('on'); elMsg.classList.remove('on'); elSub.classList.remove('on');
    // RETRY: 0.6초 뒤부터 어디를 눌러도(터치·클릭·키) 제자리에서 다시 시작
    setTimeout(() => {
      const over = document.getElementById('over');
      const go = e => { if (!DEAD.shown) return; if (e && e.stopPropagation) e.stopPropagation(); if (e && e.cancelable && e.type === 'touchend') e.preventDefault(); restart(); };
      DEAD.go = go;
      window.addEventListener('pointerdown', go, true); window.addEventListener('keydown', go, true);
      over.addEventListener('click', go, true); over.addEventListener('touchend', go, true);
    }, 600);
  }
  function updateDead(dt) {
    DEAD.t += dt;
    const B = bike();
    RIDE.vel.y -= 18.2 * dt; RIDE.vel.multiplyScalar(Math.exp(-dt * 0.3));
    B.g.position.addScaledVector(RIDE.vel, dt);
    B.g.rotation.x += dt * 7.5; B.g.rotation.z += dt * 2.0;   // 앞으로 뒤집히며 떨어진다
    _bpt.x = B.g.position.x; _bpt.y = B.g.position.y; _bpt.z = B.g.position.z;
    const c = T.collidePoint(_bpt, 0.5); if (c && c.push > 0) { B.g.position.set(_bpt.x, _bpt.y, _bpt.z); RIDE.vel.multiplyScalar(0.2); }
    if (DEAD.t > 2.6) gameOver(DEAD.reason);
  }
  function updateRide(dt) {
    const B = bike(); bumpCD -= dt; HP.inv = Math.max(0, HP.inv - dt);
    const k = input.keys;
    let steer = (k.ArrowLeft || k.KeyA ? 1 : 0) - (k.ArrowRight || k.KeyD ? 1 : 0) - input.tSteer + (input.padS || 0);
    let fwd = (k.ArrowUp || k.KeyW ? 1 : 0) - (k.ArrowDown || k.KeyS ? 1 : 0) + input.tFwd + (input.padF || 0);
    let climb = (k.Space || input.btnUp ? 1 : 0) - (k.ShiftLeft || k.ShiftRight || k.ControlLeft || k.ControlRight || input.btnDn ? 1 : 0);
    steer = Math.max(-1, Math.min(1, steer)); fwd = Math.max(-1, Math.min(1, fwd));
    // 연료
    const SPEC0 = bikeSpec(); if (SPEC0.solar) FUEL.fuel = FUEL.tank;
    const empty = FUEL.fuel <= 0 && !SPEC0.solar;
    const moved = RIDE.vel.length() * dt;   // 이번 프레임 이동 거리(m)
    if (!empty) FUEL.fuel = Math.max(0, FUEL.fuel - bikeSpec().eff * (moved * 0.14 + dt * 0.03));   // 100L = 약 700m: 배달 두 곳 + 주유소까지
    if (empty) { fwd = 0; climb = 0; steer *= 0.4; RIDE.vel.y -= 39 * dt; RIDE.vel.x *= Math.exp(-dt * 0.8); RIDE.vel.z *= Math.exp(-dt * 0.8); if (!FUEL.warned0) { FUEL.warned0 = true; AUDIO.land(6); } }
    else if (FUEL.fuel < FUEL.tank * 0.3 && !FUEL.atStation) { FUEL.warnT = (FUEL.warnT || 0) - dt; if (FUEL.warnT <= 0) { FUEL.warnT = 3.2; AUDIO.warn(); } }   // 30% 아래면 기름 넣을 때까지 3.2초마다 경고음 (주유소 위에선 조용)
    // 주유: 주유소 마당 위에 천천히 멈추면 (한 통 가득 = 1코인)
    FUEL.refueling = false; FUEL.atStation = false;
    for (const st of SCENERY.S.stations) { const dx = B.g.position.x - st.pos.x, dz = B.g.position.z - st.pos.z, dy = B.g.position.y - st.pos.y; if (Math.hypot(dx, dz) < 7.0 && dy > -1.5 && dy < 4) { FUEL.atStation = true; break; } }
    if (RIDE.vel.length() < 3.5 && !SPEC0.solar) for (const st of SCENERY.S.stations) {
      const dx = B.g.position.x - st.pos.x, dz = B.g.position.z - st.pos.z, dy = B.g.position.y - st.pos.y;
      if (Math.hypot(dx, dz) < 6.0 && dy > -1 && dy < 3.5 && FUEL.fuel < FUEL.tank - 0.01) {
        const add = Math.min(FUEL.tank - FUEL.fuel, 22 * dt); FUEL.fuel += add; DELIVERY.D.money -= add * FUEL.price; FUEL.refueling = true;
        if (FUEL.fuel >= FUEL.tank - 0.01) { DELIVERY.D.money = Math.round(DELIVERY.D.money); if (DELIVERY.D.money < 0) { gameOver('파산 — 기름값을 못 냈다'); DEAD.on = true; } }
      }
    }
    // 경고는 30% 위로 다시 올라온 뒤에야 다시 무장된다 (주유 중 매 프레임 울리던 버그)
    if (FUEL.fuel >= FUEL.tank * 0.3) FUEL.warnT = 0;   // 30% 위로 올라갔다가 다시 떨어지면 바로 경고
    if (FUEL.atStation) FUEL.warnT = Math.max(FUEL.warnT || 0, 1.0);   // 주유소를 떠나고 1초 뒤부터
    if (window.AUDIO && AUDIO.refuel) AUDIO.refuel(!!FUEL.refueling && FUEL.fuel < FUEL.tank - 0.01 && !DEAD.on);
    if (FUEL.fuel > 0) FUEL.warned0 = false;
    const SPEC = bikeSpec();
    RIDE.yaw += steer * SPEC.turn * dt * (0.5 + 0.5 * Math.min(1, RIDE.vel.length() / 6));
    RIDE.fwd.set(Math.sin(RIDE.yaw), 0, Math.cos(RIDE.yaw));
    RIDE.vel.addScaledVector(RIDE.fwd, fwd * SPEC.accel * dt); RIDE.vel.y += climb * SPEC.climb * dt;
    // 날개 없는 기종은 앞으로 달려야 뜬다 — 느리면 가라앉는다
    if (!SPEC.hover && !empty && climb <= 0) {   // 상승 중엔 가라앉지 않는다
      const hs = Math.hypot(RIDE.vel.x, RIDE.vel.z);
      const liftK = Math.min(1, hs / SPEC.lift);
      RIDE.vel.y -= SPEC.sink * (1 - liftK) * dt;
      if (RIDE.vel.y < 0 && climb <= 0) RIDE.vel.y *= Math.exp(-dt * 1.4);   // 낙하 상한 ~5m/s
      RIDE.sinking = liftK < 0.5 && climb <= 0;
    } else RIDE.sinking = false;
    if (!empty) { RIDE.vel.multiplyScalar(Math.exp(-dt * 1.3)); const sp = RIDE.vel.length(); if (sp > SPEC.speed) RIDE.vel.multiplyScalar(SPEC.speed / sp); }
    else if (RIDE.vel.y < -68) RIDE.vel.y = -68;
    B.g.position.addScaledVector(RIDE.vel, dt);
    // 본 기둥·선반·정상
    _bpt.x = B.g.position.x; _bpt.y = B.g.position.y + 0.6; _bpt.z = B.g.position.z;
    const c = T.collidePoint(_bpt, 1.15);
    if (c && c.push > 0) { B.g.position.set(_bpt.x, _bpt.y - 0.6, _bpt.z); bump(c.nx, c.ny, c.nz); }
    // 먼 석주들 (원기둥 근사)
    for (const pl of SCENERY.S.pillars) {
      const ddx = B.g.position.x - pl.x, ddz = B.g.position.z - pl.z; const hd = Math.hypot(ddx, ddz);
      if (hd > pl.r + 1.3 || B.g.position.y > pl.h + 1.0 + (pl.flat ? 0 : 3)) continue;
      if (pl.flat && B.g.position.y > pl.h - 1.5 && hd < pl.r * 0.8) { if (RIDE.vel.y < -2 && FUEL.fuel <= 0) { crash('연료가 떨어져 추락했다'); return; } if (-RIDE.vel.y > bikeSpec().tough * 0.55) { RIDE.vel.y = 2; damage('땅에 처박혔다'); } B.g.position.y = Math.max(B.g.position.y, pl.h + 0.9); if (RIDE.vel.y < 0) RIDE.vel.y = 0; continue; }
      if (hd < pl.r + 1.3) { const nx = ddx / (hd || 1), nz = ddz / (hd || 1); B.g.position.x = pl.x + nx * (pl.r + 1.3); B.g.position.z = pl.z + nz * (pl.r + 1.3); bump(nx, 0, nz); }
    }
    // 건물(집·식당·가게)은 뚫고 못 간다
    for (const bd of SCENERY.S.buildings) {
      if (B.g.position.y < bd.y0 - 0.3 || B.g.position.y > bd.y1) continue;
      const ddx = B.g.position.x - bd.x, ddz = B.g.position.z - bd.z; const hd = Math.hypot(ddx, ddz);
      if (hd < bd.r + 0.9) { const nx = ddx / (hd || 1), nz = ddz / (hd || 1); B.g.position.x = bd.x + nx * (bd.r + 0.9); B.g.position.z = bd.z + nz * (bd.r + 0.9); bump(nx, 0, nz); }
    }
    if (B.g.position.y > T.SUMMIT + 40) { B.g.position.y = T.SUMMIT + 40; RIDE.vel.y = Math.min(0, RIDE.vel.y); }
    // 까마귀: 스치면 추락
    for (const bd of SCENERY.S.birds) {
      if (Math.abs(bd.pos.y - B.g.position.y) > 1.6) continue;
      const d2 = (bd.pos.x - B.g.position.x) ** 2 + (bd.pos.y - 0.7 - B.g.position.y) ** 2 + (bd.pos.z - B.g.position.z) ** 2;
      if (d2 < 1.1 * 1.1 && HP.inv <= 0) { const dx = B.g.position.x - bd.pos.x, dz = B.g.position.z - bd.pos.z; const dd = Math.hypot(dx, dz) || 1; RIDE.vel.x += dx / dd * 6; RIDE.vel.z += dz / dd * 6; RIDE.vel.y -= 3; RIDE.vel.multiplyScalar(0.7); damage('까마귀와 부딪혔다'); break; }
    }
    RIDE.roll += ((-steer * 0.45) - RIDE.roll) * (1 - Math.exp(-dt * 5));
    RIDE.pitch += ((-fwd * 0.12 + climb * 0.1) - RIDE.pitch) * (1 - Math.exp(-dt * 5));
    B.g.rotation.set(RIDE.pitch, RIDE.yaw, RIDE.roll);
    B.throttle = (Math.abs(fwd) * 0.7 + Math.abs(climb) * 0.5) * (SPEC.quiet ? 0.15 : 1); B.vel.copy(RIDE.vel); B.riding = true;
    updateRideTargets();
    // 상체 기울기: 가속 반대 + 진행 방향으로
    const L = RIDE.targets.lean; L[0] = RIDE.fwd.x * 0.35 - RIDE.vel.x * 0.02; L[2] = RIDE.fwd.z * 0.35 - RIDE.vel.z * 0.02;
  }

  // ── 오토바이 가게 ──────────────────────────────────
  const elShop = document.getElementById('shop'), elShopList = document.getElementById('shopList'), btnShop = document.getElementById('btnShop');
  let shopOpen = false, atHome = false;
  function nearHome() { const B = bike(); const sh = SCENERY.S.shop; if (!sh) return false; return Math.hypot(B.g.position.x - sh.pos.x, B.g.position.z - sh.pos.z) < 9 && Math.abs(B.g.position.y - sh.pos.y) < 6; }
  function renderShop() {
    const D = DELIVERY.D; let html = '';
    const LAB = TX(['속도', '내구성', '적재량', '연비', '부양'], ['Speed', 'Durability', 'Cargo', 'Fuel economy', 'Lift']);
    BIKES.forEach((b, i) => {
      const owned = GARAGE.owned.includes(i), cur = GARAGE.cur === i;
      const pips = v => { let h = ''; for (let k = 0; k < 5; k++) h += '<i class="' + (k < v ? 'on' : '') + '"></i>'; return h; };
      html += '<div class="card' + (cur ? ' cur' : '') + '"><div class="thumb" style="background-image:url(' + b.img + ')"></div><div class="info"><b>' + (i + 1) + '. ' + b.name + ' <span class="price">' + (b.price ? '🪙 ' + b.price : TX('기본', 'Free')) + '</span></b><p>' + b.tag + '</p>' +
        '<div class="bars">' + LAB.map((l, k) => '<span>' + l + '<u>' + pips(b.bars[k]) + '</u></span>').join('') + '</div></div>' +
        '<div class="act">' + (cur ? '<em>' + TX('타는 중', 'Riding') + '</em>' : owned ? '<button data-ride="' + i + '">' + TX('타기', 'Ride') + '</button>' : '<button data-buy="' + i + '"' + (D.money < b.price ? ' disabled' : '') + '>' + TX('구매', 'Buy') + '</button>') + '</div></div>';
    });
    elShopList.innerHTML = html;
  }
  elShopList.addEventListener('pointerdown', e => {
    const t = e.target.closest('button'); if (!t) return; e.stopPropagation();
    if (t.dataset.buy !== undefined) { const i = +t.dataset.buy; const b = BIKES[i]; if (DELIVERY.D.money >= b.price) { DELIVERY.D.money -= b.price; GARAGE.owned.push(i); applyBike(i); UI.msg(TX(b.name + ' 샀다!', 'Bought ' + b.name + '!'), true); AUDIO.deliver(true); renderShop(); } }
    if (t.dataset.ride !== undefined) { applyBike(+t.dataset.ride); renderShop(); }
  });
  function openShop() { if (!nearHome() || DEAD.on) return; if (!thumbsDone) { renderBikeThumbs(); thumbsDone = true; } shopOpen = true; renderShop(); elShop.classList.add('show'); }
  function closeShop() { shopOpen = false; elShop.classList.remove('show'); }
  btnShop.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (shopOpen) closeShop(); else openShop(); });
  document.getElementById('shopClose').addEventListener('pointerdown', e => { e.stopPropagation(); closeShop(); });
  elShop.addEventListener('pointerdown', e => e.stopPropagation());
  applyBike(GARAGE.cur);
  // 가게 카드 그림: 실제 3D 오토바이를 작은 화면에 찍는다
  function renderBikeThumbs() {
    const B = bike(); const g = B.g; const parent = g.parent;
    const pos = g.position.clone(), rot = g.rotation.clone();
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(320, 320); r.setClearColor(0x000000, 0);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x777066, 1.3));
    const dl = new THREE.DirectionalLight(0xfff0dc, 2.6); dl.position.set(3, 5, 4); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    sc.add(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
    const savedHead = SCENERY.S.headlight ? SCENERY.S.headlight.intensity : 0; if (SCENERY.S.headlight) SCENERY.S.headlight.intensity = 0;
    BIKES.forEach(b => {
      B.paint.color.set(b.color);
      for (const k in B.extras) for (const m of B.extras[k]) m.visible = (k === b.extra);
      const d = b.extra === 'sky' ? 8.2 : 4.9; cam.position.set(d * 0.86, d * 0.34, d * 0.40); cam.lookAt(0, 0.6, 0.05);   // 옆·앞 3/4 시점
      r.render(sc, cam); b.img = r.domElement.toDataURL('image/png');
    });
    parent.add(g); g.position.copy(pos); g.rotation.copy(rot);
    if (SCENERY.S.headlight) SCENERY.S.headlight.intensity = savedHead;
    r.dispose(); applyBike(GARAGE.cur);
  }
  let thumbsDone = false;

  // ── 미니맵 / 큰 지도 ───────────────────────────────
  const mmC = document.getElementById('minimap'), mmX = mmC.getContext('2d');
  const bmC = document.getElementById('bigmapc'), bmX = bmC.getContext('2d'), elBig = document.getElementById('bigmap');
  let bigOpen = false, mmT = 0;
  const MAP_R = 255;   // 지도가 담는 반지름(m) — 가장 먼 집까지
  function drawMap(ctx, size, rotate, radiusM, showNames) {
    const B = bike(); const bx = B.g.position.x, bz = B.g.position.z;
    const c = size / 2, k = (c - 8) / radiusM;
    ctx.clearRect(0, 0, size, size);
    ctx.save(); ctx.translate(c, c);
    /* 작은 지도도 북쪽 고정 — rotate 는 '내 위치를 가운데에' 만 뜻한다 (2026-09-02, 큰 지도와 방향을 맞춤) */
    const toXY = (x, z) => rotate ? [-(x - bx) * k, -(z - bz) * k] : [-x * k, -z * k];
    // 바다(구름) 배경 원
    ctx.beginPath(); ctx.arc(0, 0, c - 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(70,90,110,.45)'; ctx.fill();
    // 석주
    for (const pl of SCENERY.S.pillars) { const [x, y] = toXY(pl.x, pl.z); ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, pl.r * k), 0, Math.PI * 2); ctx.fillStyle = pl.flat ? 'rgba(190,170,140,.75)' : 'rgba(120,105,90,.55)'; ctx.fill(); }
    { const [x, y] = toXY(0, 0); ctx.beginPath(); ctx.arc(x, y, Math.max(2, 8.6 * k), 0, Math.PI * 2); ctx.fillStyle = 'rgba(120,160,90,.9)'; ctx.fill(); }
    ctx.font = (showNames ? 38 : 12) + 'px Griun, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const D = DELIVERY.D;
    // 집
    for (const t of D.targets) { const [x, y] = toXY(t.pos.x, t.pos.z); ctx.fillStyle = t === D.cur ? '#ffd27a' : '#f2ede4'; ctx.fillText('🏠', x, y); if (showNames) { ctx.save(); ctx.font = '38px Griun, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillText(t.name, x, y + 42); ctx.restore(); } }
    // 주유소: 빨간 원 위에 크게
    for (const st of SCENERY.S.stations) {
      if (st.name === '식당') continue; const [x, y] = toXY(st.pos.x, st.pos.z);
      const sq = showNames ? 44 : 16;   // 빨간 네모 주유기
      ctx.fillStyle = '#d42a1a'; ctx.beginPath(); ctx.roundRect(x - sq / 2, y - sq / 2, sq, sq, sq * 0.2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.font = (showNames ? 30 : 11) + 'px Griun, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('⛽', x, y + 1); ctx.restore();
      if (showNames) { ctx.save(); ctx.font = '38px Griun, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillText(st.name, x, y + 48); ctx.restore(); }
    }
    if (SCENERY.S.shop) { const [x, y] = toXY(SCENERY.S.shop.pos.x, SCENERY.S.shop.pos.z); const sx = x + (showNames ? 34 : 8), sy = y - (showNames ? 16 : 6); ctx.fillText('🏍', sx, sy); if (showNames) { ctx.save(); ctx.font = '30px Griun, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillText(TX('모터샵', 'Shop'), sx, sy - 34); ctx.restore(); } }
    { const [x, y] = toXY(0, 0); ctx.fillStyle = '#ffd27a'; ctx.fillText('★', x, y - 1); if (showNames) { ctx.save(); ctx.font = '38px Griun, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillText(TX('식당', 'Diner'), x, y + 42); ctx.restore(); } }
    // 배달 갈 곳: 맥박 원
    if (D.state === 'carry' && D.cur) {
      let [x, y] = toXY(D.cur.pos.x, D.cur.pos.z);
      const dd = Math.hypot(x, y), lim = c - 16;
      if (dd > lim) { x *= lim / dd; y *= lim / dd; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#b26bff'; ctx.fill(); }   // 범위 밖: 가장자리에 방향
      const r = (showNames ? 14 : 7) + (showNames ? 6 : 4) * Math.sin(performance.now() * 0.006); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.strokeStyle = '#b26bff'; ctx.lineWidth = showNames ? 4 : 2.5; ctx.stroke();
    }
    // 나
    { const [x, y] = toXY(bx, bz); ctx.save(); ctx.translate(x, y); ctx.rotate(-RIDE.yaw); /* 북쪽 고정 지도에서 진행 방향을 가리킨다 */ const A = showNames ? 3.4 : 1; if (showNames) { const pr = 22 + 4 * Math.sin(performance.now() * 0.006); ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,90,58,.28)'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); } ctx.beginPath(); ctx.moveTo(0, -8 * A); ctx.lineTo(5 * A, 6 * A); ctx.lineTo(0, 3 * A); ctx.lineTo(-5 * A, 6 * A); ctx.closePath(); ctx.fillStyle = '#ff5a3a'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = A; ctx.stroke(); ctx.restore(); }
    // N — 둘 다 북쪽 고정이라 위가 북쪽
    { const fs = showNames ? 34 : 17; ctx.font = '900 ' + fs + 'px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const ny = -(c - 6) + fs * 0.75; ctx.lineWidth = fs * 0.22; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText('N', 0, ny); ctx.fillStyle = '#ffd27a'; ctx.fillText('N', 0, ny); }
    ctx.restore();
  }
  function updateMaps(dt) {
    mmT -= dt;
    if (mmT <= 0) { mmT = 0.12; drawMap(mmX, 300, true, 140, false); }
    if (bigOpen) drawMap(bmX, 900, false, MAP_R, true);
  }
  function openBig() { bigOpen = true; elBig.classList.add('show'); }
  function closeBig() { bigOpen = false; elBig.classList.remove('show'); }
  mmC.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (bigOpen) closeBig(); else openBig(); });
  document.getElementById('bigmapClose').addEventListener('pointerdown', e => { e.stopPropagation(); closeBig(); });
  elBig.addEventListener('pointerdown', e => e.stopPropagation());

  // ── HUD ───────────────────────────────────────────
  const elH = document.getElementById('h'), elTime = document.getElementById('time'), elMsg = document.getElementById('msg'), elFlash = document.getElementById('flash');
  const elDeliv = document.getElementById('deliv'), elArrow = document.getElementById('arrow'), elMoney = document.getElementById('money'), elDone = document.getElementById('done'), elVert = document.getElementById('vert'), elTut = document.getElementById('tut'), hint = document.getElementById('hint');
  let msgT = 0, subT = 0;
  const elSub = document.getElementById('sub'), elFuel = document.getElementById('fuelbar'), elFuelWrap = document.getElementById('fuel'), elPkg = document.getElementById('pkg');
  const UI = { msg(s, long) { elMsg.textContent = s; elMsg.classList.remove('pop', 'bad'); elMsg.classList.add('on'); msgT = long ? 4 : 2.2; }, pop(s, bad) { elMsg.innerHTML = s.replace('🥄', '<svg class="spoon"><use href="#sp"/></svg>'); elMsg.classList.add('on', 'pop'); elMsg.classList.toggle('bad', !!bad); msgT = 2.4; }, sub(s) { elSub.textContent = s; elSub.classList.add('on'); subT = 5; } };
  // 말풍선: 이름 + 한마디. dur 초 뒤에 사라진다
  const elBub = document.getElementById('bubble'); let bubT = null;
  UI.bubble = function (who, text, dur) {
    elBub.querySelector('b').textContent = who; elBub.querySelector('span').textContent = text;
    elBub.classList.remove('on'); void elBub.offsetWidth; elBub.classList.add('on');
    clearTimeout(bubT); bubT = setTimeout(function () { elBub.classList.remove('on'); }, (dur || 2.6) * 1000);
  };
  window.UI = UI;
  const TUT = ('ontouchstart' in window) ? [
    TX('화면을 <b>끌어서</b> 조종 (좌우 = 방향, 위아래 = 앞뒤) · <b>위로 / 아래로</b> 단추', '<b>Drag</b> the screen to steer (left/right = turn, up/down = forward/back) · <b>UP / DOWN</b> buttons'),
    TX('왼쪽 아래 <b>지도</b>의 빨간 원이 배달 갈 집.  위쪽 화살표를 따라가서 <b>마당 위에 천천히 멈추면</b> 배달', 'The red circle on the <b>map</b> is the house.  Follow the arrow and <b>stop slowly over the yard</b> to deliver'),
    TX('지도를 누르면 크게.  바위에 부딪히면 튕기고, 구름 속은 앞이 안 보입니다', 'Tap the map to enlarge.  Rocks bounce you, clouds block the view'),
  ] : [
    TX('<b>↑</b> 앞으로 · <b>←→</b> 방향 · <b>스페이스</b> 위로 · <b>Shift</b> 아래로', '<b>↑</b> Forward · <b>←→</b> Turn · <b>Space</b> Up · <b>Shift</b> Down'),
    TX('왼쪽 아래 <b>지도</b>의 빨간 원이 배달 갈 집.  위쪽 화살표를 따라가서 <b>마당 위에 천천히 멈추면</b> 배달 (<b>T</b> = 큰 지도)', 'The red circle on the <b>map</b> is the house.  Follow the arrow and <b>stop slowly over the yard</b> to deliver (<b>T</b> = big map)'),
    TX('늦으면 0코인.  바위에 부딪히면 튕기고, 구름 속은 앞이 안 보입니다', 'Late = 0 coins.  Rocks bounce you, clouds block the view'),
  ];
  let moved = 0, tutT = 0;
  function tutorial(dt) { elTut.classList.remove('on'); return;
    tutT += dt; moved += RIDE.vel.length() * dt;
    const D = DELIVERY.D;
    let step = moved < 25 ? 0 : (D.done === 0 ? 1 : 2);
    if (D.done >= 2 || (D.done >= 1 && tutT > 14)) step = 3;
    if (step < TUT.length) { const key = 's' + step; if (elTut.dataset.step !== key) { elTut.innerHTML = TUT[step]; elTut.dataset.step = key; tutT = 0; } elTut.classList.add('on'); }
    else elTut.classList.remove('on');
  }
  function hud(dt) {
    tutorial(dt);
    const B = bike(); const D = DELIVERY.D;
    elH.textContent = Math.max(0, B.g.position.y).toFixed(0);
    const s = Math.floor((performance.now() - t0) / 1000); elTime.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    elMoney.textContent = Math.round(D.money); elDone.textContent = D.done + (D.best ? TX(' / 최고 ', ' / Best ') + D.best : '');
    if (msgT > 0) { msgT -= dt; if (msgT <= 0) elMsg.classList.remove('on'); }
    if (subT > 0) { subT -= dt; if (subT <= 0) elSub.classList.remove('on'); }
    elFuel.style.width = (FUEL.fuel / FUEL.tank * 100).toFixed(1) + '%'; document.getElementById('fuelnum').textContent = bikeSpec().solar ? TX('☀ 태양광', '☀ Solar') : Math.ceil(FUEL.fuel);
    elFuelWrap.classList.toggle('solar', !!bikeSpec().solar);
    const fr = FUEL.fuel / FUEL.tank; elFuelWrap.classList.toggle('mid', fr <= 0.5 && fr > 0.3); elFuelWrap.classList.toggle('low', fr <= 0.3 && FUEL.fuel > 0); elFuelWrap.classList.toggle('empty', FUEL.fuel <= 0 && !bikeSpec().solar); elFuelWrap.classList.toggle('filling', FUEL.refueling);
    elMoney.style.color = D.money < 60 ? '#ff8a6a' : '';
    elVert.classList.toggle('sink', !!RIDE.sinking && !nearHome());
    const nh = nearHome(); if (nh !== atHome) { atHome = nh; btnShop.classList.toggle('show', nh); if (!nh && shopOpen) closeShop(); }
    if (shopOpen && !nh) closeShop();
    elPkg.textContent = D.state === 'carry' ? D.pkg.icon + ' ' + D.pkg.name + '  ' + D.pay + TX('코인', ' coins') : '';
    if (D.state !== 'carry' || !D.cur) { elDeliv.textContent = TX('다음 주문 기다리는 중…', 'Waiting for next order…'); elArrow.style.opacity = 0; elVert.textContent = ''; }
    else {
      const dx = D.cur.pos.x - B.g.position.x, dz = D.cur.pos.z - B.g.position.z, dy = D.cur.pos.y - B.g.position.y;
      const dist = Math.hypot(dx, dz); const left = Math.max(0, D.limit - D.t);
      elDeliv.textContent = D.cur.name + '  ' + Math.round(Math.hypot(dist, dy)) + 'm' + (left > 0 ? '   ⏱ ' + Math.ceil(left) + 's' : TX('   늦음', '   LATE'));
      const ang = Math.atan2(dx, dz) - RIDE.yaw;
      elArrow.style.opacity = 1; elArrow.style.transform = 'rotate(' + (-ang * 180 / Math.PI) + 'deg)';
      elVert.textContent = Math.abs(dy) < 3 ? TX('같은 높이', 'Same height') : (dy > 0 ? '▲ ' + Math.round(dy) + TX('m 위', 'm up') : '▼ ' + Math.round(-dy) + TX('m 아래', 'm down'));
    }
    const y = B.g.position.y;
    if (input.resetHold > 0) { input.resetHold += dt; hint.textContent = TX('R 계속 누르면 식당로… ', 'Hold R to respawn… ') + Math.max(0, 1.5 - input.resetHold).toFixed(1); hint.classList.add('on'); if (input.resetHold > 1.5) { input.resetHold = 0; doReset(); } }
    else hint.classList.remove('on');
  }
  const seen = { cloud: false };
  function fellCheck() { if (!DEAD.on && bike().g.position.y < T.BASE + 2) crash('협곡 바닥에 떨어졌다'); }
  function doReset() { if (DEAD.on) return; SCENERY.parkBikeAtHome(); seatRider(); snapCamera(); }

  // ── 카메라 ────────────────────────────────────────
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), _des = new THREE.Vector3(), _lk = new THREE.Vector3();
  const _cf = new THREE.Vector3();
  function desired() {
    const B = bike();
    const sp = Math.min(1, RIDE.vel.length() / 22);
    const yaw = RIDE.yaw + orbit.yaw; _cf.set(Math.sin(yaw), 0, Math.cos(yaw));
    const back = orbit.dist - 1 + sp * 2.5, up = 2.8 + sp * 0.6 + orbit.pitch * 6;
    if (DEAD.on) { const c = P.chest; _des.set(c.x, c.y, c.z).addScaledVector(_cf, -9); _des.y += 4; _lk.set(c.x, c.y, c.z); return; }
    _des.copy(B.g.position).addScaledVector(_cf, -back); _des.y += up;
    _lk.copy(B.g.position).addScaledVector(_cf, 3 * (1 - Math.abs(orbit.yaw) / Math.PI)); _lk.y += 1.0;
    // 카메라가 바위 속으로 들어가지 않게
    _bpt.x = _des.x; _bpt.y = _des.y; _bpt.z = _des.z; T.collidePoint(_bpt, 0.8); _des.set(_bpt.x, _bpt.y, _bpt.z);
  }
  function snapCamera() { desired(); camPos.copy(_des); camLook.copy(_lk); }
  function updateCamera(dt, t) {
    if (input.far) { const B = bike(); camera.position.set(B.g.position.x + 40, B.g.position.y + 18, B.g.position.z + 40); camera.lookAt(B.g.position); camPos.copy(camera.position); return; }
    if (!started) {
      // 시작 화면: 식당 마당을 천천히 도는 조감
      // 집 정면(간판·문 쪽)에서, 살짝만 흔들리며
      const H = SCENERY.S.house; const a = H.rotation.y + titleYaw + (titleFreeze ? 0 : Math.sin(t * 0.15) * 0.09);   // 끌어서 돌린 각도 + 아주 살짝 흔들림(C 로 멈춤)
      _des.set(H.position.x + Math.sin(a) * titleDist, T.SUMMIT + 4.2 + titlePitch * 8, H.position.z + Math.cos(a) * titleDist); camPos.lerp(_des, 0.03); camLook.lerp(_lk.set(H.position.x, T.SUMMIT + 1.3, H.position.z), 0.05);
    } else {
      if (!orbit.drag) { orbit.idle += dt; if (orbit.idle > 1.2) { const k = 1 - Math.exp(-dt * 2.5); orbit.yaw += (0 - orbit.yaw) * k; orbit.pitch += (0 - orbit.pitch) * k; } }
      desired();
      camPos.lerp(_des, 1 - Math.exp(-dt * 5)); camLook.lerp(_lk, 1 - Math.exp(-dt * 7));
    }
    camera.position.copy(camPos);
    if (shake > 0.001) { camera.position.x += (Math.random() - 0.5) * shake * 0.5; camera.position.y += (Math.random() - 0.5) * shake * 0.5; shake *= Math.exp(-dt * 6); }
    camera.lookAt(camLook);
  }

  // ── 바람 ──────────────────────────────────────────
  const WN = NOISE.makeNoise(99);
  let windStrength = 0;
  function wind(t) {
    const y = bike().g.position.y;
    const s = T.smooth(140, 205, y);
    const gust = 0.55 + 0.45 * WN.noise3(t * 0.22, 1.3, 0);
    const puff = Math.max(0, WN.noise3(t * 0.9, 7.7, 0)); const strong = puff * puff * 4.5;
    const mag = s * (2.2 * gust + strong);
    const a = t * 0.04;
    PLAYER.state.wind.set(Math.cos(a) * mag, 0, Math.sin(a) * mag);
    if (started) RIDE.vel.addScaledVector(PLAYER.state.wind, 0.02 * (1 / 60));
    windStrength = s * (0.35 + 0.65 * (gust * 0.5 + puff * 0.5));
  }

  // ── 루프 ──────────────────────────────────────────
  const STEP = 1 / 120; let acc = 0, last = performance.now();
  function physStep() {
    PLAYER.applyForces(); PLAYER.integrate(STEP);
    for (let it = 0; it < 6; it++) { PLAYER.solve(); if (it === 5) PLAYER.collide(); }
    PLAYER.after(STEP);
  }
  function resize() { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize); resize();
  SCENERY.parkBikeAtHome(); seatRider(); snapCamera(); { const H = SCENERY.S.house; camPos.set(H.position.x + Math.sin(H.rotation.y) * 13, T.SUMMIT + 4.2, H.position.z + Math.cos(H.rotation.y) * 13); camLook.set(H.position.x, T.SUMMIT + 1.3, H.position.z); }

  function frame(now) {
    requestAnimationFrame(frame);
    if (canvas.width !== Math.floor(window.innerWidth * renderer.getPixelRatio()) || canvas.height !== Math.floor(window.innerHeight * renderer.getPixelRatio())) resize();
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (paused) { updateMaps(dt); renderer.render(scene, camera); return; }
    if (started) { if (DEAD.on) updateDead(dt); else { updateRide(dt); DELIVERY.update(dt, bike().g.position, RIDE.vel.length(), true); } }
    wind(t); if (started) fellCheck();
    acc += dt; let n = 0;
    while (acc >= STEP && n++ < 8) { physStep(); acc -= STEP; }
    if (started && !DEAD.on) { hud(dt); updateMaps(dt); }
    updateCamera(dt, t);
    drawBody();
    FX.update(dt);
    SCENERY.update(dt, t, camera.position, _a.set(P.chest.x, P.chest.y, P.chest.z));
    const inCloud = T.smooth(SCENERY.CLOUD_Y - 16, SCENERY.CLOUD_Y - 3, camera.position.y) * (1 - T.smooth(SCENERY.CLOUD_Y + 10, SCENERY.CLOUD_Y + 24, camera.position.y));
    elFlash.style.opacity = (inCloud * 0.1).toFixed(3);
    AUDIO.update(dt, windStrength, started ? RIDE.vel.length() : 0, inCloud);
    renderer.render(scene, camera);
    if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
  }
  window.GAME = { scene, renderer, camera, input, RIDE, FUEL, DEAD, orbit, BIKES, GARAGE, applyBike, openShop, crash, restart };
  requestAnimationFrame(frame);
  }, 20);
})();
