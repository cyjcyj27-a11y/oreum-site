/* game.js — 장면·입력·카메라·규칙·HUD */
(function () {
  const W = window.WORLD, A = window.AUDIO;
  const EN = /[?&]lang=en/.test(location.search);
  const $ = id => document.getElementById(id);
  const isTouch = ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');
  if (EN) { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(el => el.innerHTML = el.getAttribute('data-en')); document.title = 'Shiba Vet Day — Oreum Games'; }

  const canvas = $('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fd0f2); scene.fog = new THREE.Fog(0xbfe0f5, 40, 90);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 200);
  const world = W.build(scene);
  const player = new window.Player(scene), dog = new window.Dog(scene), IT = window.ITEMS; IT.init(scene);
  // 하늘 구름 (값싼 스프라이트)
  (function clouds() { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g = cv.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.95)'; [[30, 36, 22], [60, 28, 26], [92, 38, 20], [50, 42, 18]].forEach(c => { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 7); g.fill(); }); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, opacity: .85, depthWrite: false })); s.position.set(Math.random() * 120 - 45, 22 + Math.random() * 12, Math.random() * 100 - 40); s.scale.set(14 + Math.random() * 10, 7 + Math.random() * 4, 1); scene.add(s); } })();

  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  /* ---------- 입력 ---------- */
  const keys = {}; let camYaw = Math.PI, camPitch = .32, lookDX = 0, lookDY = 0, locked = false;
  addEventListener('keydown', e => { keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); onKey(e.code); });
  addEventListener('keyup', e => { keys[e.code] = false; });
  function lockPointer() { if (isTouch || !canvas.requestPointerLock || document.pointerLockElement === canvas) return; try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  canvas.addEventListener('click', () => { if (G.state === 'play') lockPointer(); });
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
  addEventListener('mousemove', e => { if (locked || (G.state === 'play' && (e.buttons & 1))) { lookDX += e.movementX; lookDY += e.movementY; } }); // 잠금이 안 걸려도 끌면 돈다
  addEventListener('mousedown', e => { if (G.state === 'play' && locked && e.button === 0) doAction(); });
  addEventListener('contextmenu', e => { if (G.state === 'play') e.preventDefault(); });
  // 터치: 왼쪽 조이스틱 / 오른쪽 드래그 시점
  const joy = { id: null, x0: 0, y0: 0, dx: 0, dy: 0 }, look = { id: null, x: 0, y: 0 };
  const jb = $('joy'), jk = $('joyKnob');
  canvas.addEventListener('touchstart', e => { for (const t of e.changedTouches) { if (look.id === null) { look.id = t.identifier; look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });   // 화면 끌기 = 시점. 이동은 오른쪽 아래 패드 (스카이라이더와 같음)
  canvas.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { let dx = t.clientX - joy.x0, dy = t.clientY - joy.y0; const l = Math.hypot(dx, dy); if (l > 55) { dx *= 55 / l; dy *= 55 / l; } joy.dx = dx / 55; joy.dy = dy / 55; jk.style.transform = `translate(${dx}px,${dy}px)`; } else if (t.identifier === look.id) { lookDX += (t.clientX - look.x) * 2.8; lookDY += (t.clientY - look.y) * 2.4; look.x = t.clientX; look.y = t.clientY; } } e.preventDefault(); }, { passive: false });
  const tEnd = e => { for (const t of e.changedTouches) { if (t.identifier === joy.id) { joy.id = null; joy.dx = joy.dy = 0; jk.style.transform = ''; } if (t.identifier === look.id) look.id = null; } };
  canvas.addEventListener('touchend', tEnd); canvas.addEventListener('touchcancel', tEnd);
  let tRun = false, tSneak = false;
  $('btnGrab').addEventListener('touchstart', e => { e.preventDefault(); doAction(); }, { passive: false });
  $('btnDoor').addEventListener('touchstart', e => { e.preventDefault(); toggleDoor(); }, { passive: false });
  $('btnTreat').addEventListener('click', () => useItem('treat'));
  $('btnToy').addEventListener('click', () => useItem('toy'));
  // 둥근 패드 — 손가락 벡터를 이동으로. 놓으면 0 (스카이라이더와 같은 코드)
  { const pad = $('pad'), knob = $('knob'); let padId = null;
    const padMove = e => { const r = pad.getBoundingClientRect(), R = r.width / 2, max = R - knob.offsetWidth / 2; const mx = e.clientX - (r.left + R), my = e.clientY - (r.top + R), d = Math.hypot(mx, my), sc = d > max ? max / d : 1; const kx = mx * sc, ky = my * sc; knob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)'; let nx = kx / max, ny = ky / max; if (Math.hypot(nx, ny) < .08) nx = ny = 0; joy.dx = nx; joy.dy = ny; joy.id = 'pad'; };
    const padEnd = e => { if (padId !== e.pointerId) return; padId = null; pad.classList.remove('on'); knob.style.transform = ''; joy.dx = joy.dy = 0; joy.id = null; };
    pad.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (padId !== null) return; padId = e.pointerId; try { pad.setPointerCapture(padId); } catch (_) { } pad.classList.add('on'); padMove(e); });
    pad.addEventListener('pointermove', e => { if (padId !== e.pointerId) return; e.stopPropagation(); padMove(e); });
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd); pad.addEventListener('lostpointercapture', padEnd); }
  $('btnRun').addEventListener('touchstart', e => { e.preventDefault(); tRun = !tRun; if (tRun) tSneak = false; $('btnRun').classList.toggle('on', tRun); $('btnSneak').classList.remove('on'); }, { passive: false });
  $('btnSneak').addEventListener('touchstart', e => { e.preventDefault(); tSneak = !tSneak; if (tSneak) tRun = false; $('btnSneak').classList.toggle('on', tSneak); $('btnRun').classList.remove('on'); }, { passive: false });
  $('btnSfx').addEventListener('click', () => { $('btnSfx').classList.toggle('off', !A.toggle()); });
  $('btnSfx').classList.toggle('off', !A.on);

  function onKey(code) {
    if (G.state === 'title' && (code === 'Space' || code === 'Enter')) start();
    else if (G.state === 'clear' && (code === 'Space' || code === 'Enter')) start();
    else if (G.state === 'play') { if (code === 'Space') doAction(); else if (code === 'KeyE') toggleDoor(); else if (code === 'KeyK') $('btnSfx').click(); else if (code === 'Digit1') useItem('treat'); else if (code === 'Digit2') useItem('toy'); }
  }
  $('title').addEventListener('click', () => { if (G.state === 'title') start(); });
  $('over').addEventListener('click', () => { if (G.state === 'clear') start(); });

  /* ---------- 규칙 ---------- */
  const G = { state: 'title', time: 0, best: 0, titleT: 0, clearT: 0, shake: 0, stage: 1, bests: {} };
  try { G.stage = Math.max(1, +localStorage.getItem('shibavet.stage') || 1); G.bests = JSON.parse(localStorage.getItem('shibavet.bests') || '{}'); } catch (e) { }
  // 스테이지 — 처음엔 잡기 쉽고 갈수록 눈치가 빨라진다. 5 가 원래 난이도, 그 뒤로는 끝없이.
  const STAGES = [
    null,
    { speed: 2.6, boost: 3.2, sense: .5, stamina: 4, struggle: .45, juke: false, hide: false, taunt: false, eatT: 6, offerT: 5, steal: 0 },
    { speed: 3.2, boost: 4.0, sense: .65, stamina: 6, struggle: .6, juke: false, hide: false, taunt: true, eatT: 5, offerT: 4, steal: 0 },
    { speed: 3.9, boost: 4.8, sense: .8, stamina: 8, struggle: .75, juke: true, hide: false, taunt: true, eatT: 4, offerT: 3, steal: .15 },
    { speed: 4.6, boost: 5.6, sense: .9, stamina: 10, struggle: .9, juke: true, hide: true, taunt: true, eatT: 3, offerT: 2.3, steal: .35 },
    { speed: 5.3, boost: 6.5, sense: 1, stamina: 11, struggle: 1, juke: true, hide: true, taunt: true, eatT: 2.4, offerT: 1.8, steal: .55 }
  ];
  function stageKnobs(n) {
    if (n < STAGES.length) return Object.assign({}, STAGES[n]);
    // 6단계부터는 끝없이 오른다 — 위를 막지 않는다(사장님: "난도가 끝없이 올라가서 영원히 안 끝나는 것도 괜찮"). 속도는 천천히, 버둥거림·눈치·지구력은 꾸준히.
    const k = n - 5; return { speed: 5.3 + k * .12, boost: 6.5 + k * .12, sense: 1 + k * .05, stamina: 11 + k * 1.2, struggle: 1 + k * .08, juke: true, hide: true, taunt: true, eatT: Math.max(.7, 2.4 - k * .2), offerT: Math.max(.5, 1.8 - k * .15), steal: Math.min(.95, .55 + k * .05) };
  }
  function saveStage() { try { localStorage.setItem('shibavet.stage', String(G.stage)); localStorage.setItem('shibavet.bests', JSON.stringify(G.bests)); } catch (e) { } }
  function showStage() { $('stageT').textContent = 'STAGE ' + G.stage; $('stageH').textContent = 'STAGE ' + G.stage; const b = G.bests[G.stage]; $('titleBest').textContent = b ? '🏆 ' + fmt(b) : ''; $('titleItems').textContent = (IT.count('treat') + IT.count('toy')) ? '🦴 ' + IT.count('treat') + '   🎾 ' + IT.count('toy') : ''; }
  function start() {
    document.body.classList.add('playing'); A.unlock(); G.state = 'play'; G.time = 0; player.reset(); dog.reset(); dog.D = stageKnobs(G.stage); showStage(); IT.clear(); IT.spawn(); updItems(); dog.m.g.visible = true; W.doors.forEach(d => { d.open = true; d.t = 1; }); world.goal.visible = false;
    camYaw = Math.PI; camPitch = 0; $('title').classList.add('hide'); $('over').classList.remove('show'); $('topbar').classList.add('show'); $('keys').classList.add('show'); $('hud').classList.add('show'); $('cross').classList.add('show');
    $('carry').hidden = true; { const v = $('vetVid'); v.pause(); } lockPointer();
    if (window.OG) OG.start();   // 집계: 한 판 시작
  }
  function useItem(cat) {
    if (G.state !== 'play' || player.carry) return;
    const it = IT.use(cat, player.x, player.z, player.L, player.yaw); if (!it) return;
    A.grab(); updItems();
  }
  function updItems() { $('invTreat').textContent = IT.count('treat'); $('invToy').textContent = IT.count('toy'); }
  function doAction() {
    if (G.state !== 'play') return;
    if (player.carry) { dog.struggle = Math.max(0, dog.struggle - .16); player.patT = .35; A.pat(); return; }
    if (player.lunge()) { }
  }
  function nearestDoor() {
    let best = null, bd = 2.0;
    for (const d of W.doors) { if (d.layer !== player.L) continue; const cx = d.cx, cz = d.cz; const dd = Math.hypot(cx - player.x, cz - player.z); if (dd < bd) { bd = dd; best = d; } }
    return best;
  }
  function toggleDoor() {
    const d = nearestDoor(); if (!d) return;
    if (d.open) { // 사람이나 개가 문칸에 있으면 못 닫음
      const inCell = (x, z) => d.cells.some(c => c[0] === W.cellOf(x) && c[1] === W.cellOf(z));
      const nearCell = (x, z, r) => d.cells.some(c => { const x0 = c[0] * W.CELL, z0 = c[1] * W.CELL; const ddx = Math.max(x0 - x, 0, x - x0 - W.CELL), ddz = Math.max(z0 - z, 0, z - z0 - W.CELL); return Math.hypot(ddx, ddz) < r; });
      if (nearCell(player.x, player.z, .3) || (dog.L === d.layer && nearCell(dog.x, dog.z, .25))) return;
    }
    d.open = !d.open; A.door(d.open); dog.replan = 0;
    if (!d.open && dog.state !== 'flee' && Math.hypot(dog.x - player.x, dog.z - player.z) < 7) dog.setState('alert');
  }
  function tryCatch() {
    if (player.lunging <= 0 || player.carry || dog.carried) return;
    const dx = dog.x - player.x, dz = dog.z - player.z, d = Math.hypot(dx, dz);
    if (d > 1.25 || dog.L !== player.L && !W.inStair(dog.x, dog.z)) return;
    let rel = Math.atan2(dx, dz) - player.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); if (Math.abs(rel) > 1.3 && d > .6) return;
    if (dog.state === 'eat') { dog.fed = true; if (dog.lure) IT.remove(dog.lure); dog.lure = null; }   // 먹다가 잡히면 먹은 셈 — 배불러서 덜 버둥거린다
    else if (dog.lure) { dog.lure.taken = false; dog.lure = null; }
    dog.dropMouth();
    dog.carried = true; dog.struggle = .15; dog.path = []; dog.setState('carried'); player.carry = true; player.lunging = 0; A.whine(.9, 1); A.bark(.6);
    world.goal.visible = true; $('carry').hidden = false; G.shake = .3;
  }
  G.dogEscaped = function () {
    dog.carried = false; player.carry = false; dog.struggle = 0; dog.boost = 3; dog.fed = false; dog.setState('flee'); dog.replan = 0; dog.hideBan = 3;
    dog.x = player.x + Math.sin(player.yaw) * .6; dog.z = player.z + Math.cos(player.yaw) * .6; dog.L = player.L;
    if (!player.canStand(player.L, dog.x, dog.z, W.height(player.L, player.x, player.z))) { dog.x = player.x; dog.z = player.z; }
    if (dog.blocked(dog.L, dog.x, dog.z)) { dog.x = player.x; dog.z = player.z; dog.unstick(); }
    A.escape(); world.goal.visible = false; $('carry').hidden = true; G.shake = .25;
  };
  function checkGoal() {
    if (!player.carry) return;
    const C = W.CAR, ddx = Math.max(C.x0 - player.x, 0, player.x - C.x1), ddz = Math.max(C.z0 - player.z, 0, player.z - C.z1);   // 차 상자까지 거리
    if (Math.hypot(ddx, ddz) < 1.1 || Math.hypot(player.x - W.GOAL.x, player.z - W.GOAL.z) < 1.6) {
      document.body.classList.remove('playing'); G.state = 'clear'; G.clearT = 0; A.clear(); setTimeout(() => A.engine(), 600);
      const t = G.time, b = G.bests[G.stage]; if (!b || t < b) G.bests[G.stage] = t;
      $('overStage').textContent = 'STAGE ' + G.stage; $('overTime').textContent = fmt(t); $('overBest').textContent = fmt(G.bests[G.stage]);
      $('overItems').textContent = (IT.count('treat') + IT.count('toy')) ? '🦴 ' + IT.count('treat') + '   🎾 ' + IT.count('toy') : '';   // 쌓아 둔 것
      if (window.OG) OG.over({ result: 'CLEAR', stage: G.stage, time: Math.round(t) });   // 집계: 한 판 끝
      G.stage++; saveStage();   // 다음 판은 다음 스테이지. 제목 화면도 거기서 시작한다
      $('over').classList.add('show'); $('carry').hidden = true; $('keys').classList.remove('show'); $('cross').classList.remove('show');
      { const v = $('vetVid'); v.currentTime = 0; v.muted = !A.on; const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; v.play().catch(() => {}); }); }   // 병원 장면 — 소리가 막히면 소리 없이라도
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }
  const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };

  /* ---------- 1인칭 카메라 ---------- */
  scene.add(camera);
  const EYE = 1.62, EYE_SNEAK = 1.18;
  let eyeH = EYE, bobT = 0, bobAmp = 0, camFov = 74; const carryQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.2, .3, 0));
  // 손 — 카메라에 붙은 두 팔
  const skinM = new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: .8 }), shirtM = new THREE.MeshStandardMaterial({ color: 0x3f8fd8, roughness: .9 });
  const hands = new THREE.Group(); camera.add(hands);
  function makeArm(side) {
    // 어깨 → 위팔(소매) → 팔꿈치 → 아래팔(맨살) → 손목 → 손바닥 + 손가락 넷 + 엄지. 팔꿈치가 안쪽·위로 굽어 있어 몽둥이처럼 안 보인다.
    const g = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(.064, .15, 4, 12), shirtM); upper.rotation.x = Math.PI / 2; upper.position.z = -.1; g.add(upper);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.072, .068, .045, 14), shirtM); cuff.rotation.x = Math.PI / 2; cuff.position.z = -.19; g.add(cuff);
    const elbow = new THREE.Group(); elbow.position.z = -.2; g.add(elbow);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), skinM); elbow.add(joint);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(.038, .05, .25, 12), skinM); fore.rotation.x = Math.PI / 2; fore.position.z = -.125; elbow.add(fore);
    const wrist = new THREE.Group(); wrist.position.z = -.25; elbow.add(wrist);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(.092, .03, .09), skinM); palm.position.z = -.042; wrist.add(palm);
    const fingers = [];
    for (let i = 0; i < 4; i++) {   // 손가락 — 살짝 오므린다
      const f = new THREE.Group(); f.position.set((i - 1.5) * .024, 0, -.088); f.rotation.x = -.45 - Math.abs(i - 1.5) * .08; f.userData.i = i; wrist.add(f); fingers.push(f);
      const seg = new THREE.Mesh(new THREE.CapsuleGeometry(.0115, .056 - Math.abs(i - 1.5) * .006, 3, 8), skinM); seg.rotation.x = Math.PI / 2; seg.position.z = -.028; f.add(seg);
    }
    const th = new THREE.Group(); th.position.set(side * -.042, .004, -.03); th.rotation.set(-.3, side * .9, 0); wrist.add(th);   // 엄지는 안쪽으로
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(.011, .038, 3, 8), skinM); thumb.rotation.x = Math.PI / 2; thumb.position.z = -.024; th.add(thumb);
    elbow.rotation.set(-.45, side * .5, 0);   // 팔꿈치: 위로·안쪽으로 굽힘
    wrist.rotation.set(.45, side * -.25, side * .12);   // 손등이 보이게 살짝 꺾음
    g.userData.side = side; g.userData.elbow = elbow; g.userData.wrist = wrist; g.userData.fingers = fingers; g.userData.thumb = th; hands.add(g); return g;
  }
  const armL = makeArm(-1), armR = makeArm(1);
  const armTgt = { l: new THREE.Vector3(), r: new THREE.Vector3(), lr: new THREE.Euler(), rr: new THREE.Euler() };
  function updateHands(dt) {
    const sp = Math.min(1, player.speed / 4.7), sw = Math.sin(bobT) * sp * .04;
    let lx = -.34, ly = -.4, lz = -.42, rx = .34, ry = -.4, rz = -.42, lrx = .2, rrx = .2, lry = .3, rry = -.3;
    if (player.carry) { lx = -.2; ly = -.58; lz = -.42; rx = .26; ry = -.58; rz = -.42; lrx = .95; rrx = .95; lry = .5; rry = -.4; if (player.patT > 0) { ry += .18 + Math.sin(player.patT * 30) * .04; rz -= .12; } }
    else if (player.lunging > 0) { lx = -.24; ly = -.52; lz = -.38; rx = .24; ry = -.52; rz = -.38; lrx = .6; rrx = .6; lry = .12; rry = -.12; }   // 소매는 아래 가장자리, 아래팔이 비스듬히 올라온다
    else if (player.mode === 'sneak') { ly = -.3; ry = -.3; lz = -.42; rz = -.42; }
    // 팔꿈치·손목은 자세마다 다르게: 안고 있으면 아래팔을 수평으로 펴고 손바닥을 위로, 덮칠 땐 팔을 쭉 편다
    let ex = -.5, ey = .55, wx = .45, wz = .12, fc = -.45, fs = 0;   // 팔꿈치, 손목, 손가락 오므림·벌림
    if (player.carry) { ex = -1.0; ey = .85; wx = -.6; wz = 1.3; fc = -.35; fs = .05; }
    else if (player.lunging > 0) { ex = -.35; ey = .3; wx = -1.25; wz = .0; fc = -.05; fs = .22; }   // 손바닥이 앞을 보고 손가락을 쫙
    for (const a of [armL, armR]) { const s = a.userData.side, e = a.userData.elbow, w = a.userData.wrist, k = Math.min(1, dt * 12);
      e.rotation.x += (ex - e.rotation.x) * k; e.rotation.y += (s * ey - e.rotation.y) * k; w.rotation.x += (wx - w.rotation.x) * k; w.rotation.z += (s * wz - w.rotation.z) * k;
      for (const f of a.userData.fingers) { const i = f.userData.i; f.rotation.x += ((fc - Math.abs(i - 1.5) * .08) - f.rotation.x) * k; f.rotation.y += ((i - 1.5) * fs - f.rotation.y) * k; }
      const t = a.userData.thumb; t.rotation.y += ((s * (.9 + fs * 1.5)) - t.rotation.y) * k; }
    armL.position.set(lx + sw, ly + Math.abs(Math.sin(bobT * 2)) * sp * .02, lz); armR.position.set(rx + sw, ry + Math.abs(Math.sin(bobT * 2 + 1)) * sp * .02, rz);
    armL.rotation.set(lrx, lry, 0); armR.rotation.set(rrx, rry, 0);
  }
  function updateCamera(dt) {
    const sens = isTouch ? .0022 : .0021;
    camYaw -= lookDX * sens; camPitch = Math.max(-1.35, Math.min(1.35, camPitch - lookDY * sens)); lookDX = lookDY = 0;
    // 머리 흔들림 — 걸음에 맞춰 위아래·좌우
    const sp = player.speed, spN = Math.min(1, sp / 4.7);
    bobT += dt * (2.2 + sp * 1.9); const ampWant = sp > .3 ? (player.mode === 'run' ? .05 : player.mode === 'sneak' ? .015 : .03) : 0;
    bobAmp += (ampWant - bobAmp) * Math.min(1, dt * 6);
    const bobY = Math.abs(Math.sin(bobT)) * bobAmp, bobX = Math.cos(bobT * .5) * bobAmp * .5;
    eyeH += ((player.mode === 'sneak' ? EYE_SNEAK : EYE) - eyeH) * Math.min(1, dt * 8);
    const py = W.height(player.L, player.x, player.z);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw); // 오른쪽 벡터
    let sx = 0, sy = 0; if (G.shake > 0) { G.shake -= dt; sx = (Math.random() - .5) * .05; sy = (Math.random() - .5) * .05; }
    if (player.carry) { const st = dog.struggle; sx += Math.sin(bobT * 9) * st * .012; sy += Math.cos(bobT * 13) * st * .01; }
    camera.position.set(player.x + rx * (bobX + sx), py + eyeH + bobY + sy, player.z + rz * (bobX + sx));
    camera.rotation.order = 'YXZ'; camera.rotation.set(camPitch, camYaw + Math.PI, Math.cos(bobT * .5) * bobAmp * .25);
    const fovWant = 74 + (player.mode === 'run' ? spN * 8 : 0); camFov += (fovWant - camFov) * Math.min(1, dt * 4);
    if (Math.abs(camera.fov - camFov) > .05) { camera.fov = camFov; camera.updateProjectionMatrix(); }
    updateHands(dt);
    // 안은 개는 카메라 앞에
    if (player.carry) { // 안은 개 — 화면 아래에서 주인을 올려다본다
      const p = camera.localToWorld(new THREE.Vector3(.05, -.6, -.72)); dog.m.g.position.copy(p);
      dog.m.g.quaternion.copy(camera.quaternion).multiply(carryQ);
    }
    player.m.g.visible = false;
  }
  function titleCamera(dt) {
    G.titleT += dt; const a = Math.sin(G.titleT * .12) * .35;
    camera.position.set(15 + Math.sin(a) * 14, 6.5, 26 + Math.cos(a) * 3); camera.lookAt(15, 3.2, 10);
  }

  /* ---------- HUD ---------- */
  const ind = $('ind'), v = new THREE.Vector3();
  function updateHUD() {
    $('time').textContent = fmt(G.time);
    if (player.carry) { $('carryBar').style.width = (dog.struggle * 100) + '%'; $('carry').classList.toggle('hot', dog.struggle > .7); }
    else { $('carryBar').style.width = '0%'; $('carry').classList.remove('hot'); }
    $('btnDoor').classList.toggle('show', !!nearestDoor());
    { const dx = dog.x - player.x, dz = dog.z - player.z, d = Math.hypot(dx, dz); let rel = Math.atan2(dx, dz) - player.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      $('cross').classList.toggle('hot', !player.carry && ((!!nearestDoor()) || (d < 1.5 && Math.abs(rel) < .9 && (dog.L === player.L || W.inStair(dog.x, dog.z))))); }
    // 개(안고 있으면 차) 방향 — 왼쪽 위 배지의 화살표가 그쪽으로 돈다. 화면 위 = 내 앞
    { let tx, tz; if (player.carry) { const C = W.CAR; tx = (C.x0 + C.x1) / 2; tz = (C.z0 + C.z1) / 2; } else { tx = dog.x; tz = dog.z; }
      const dx = tx - player.x, dz = tz - player.z, d = Math.hypot(dx, dz); let rel = Math.atan2(dx, dz) - camYaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
      ind.querySelector('.arrow').style.transform = 'rotate(' + (-90 + rel * 180 / Math.PI) + 'deg)';
      $('indIco').textContent = player.carry ? '🚗' : '🐕'; ind.classList.toggle('near', d < 2.5); }
  }

  /* ---------- 루프 ---------- */
  let last = performance.now();
  function frame(dt) {
    hands.visible = G.state === 'play';   // 1인칭 팔은 경기 중에만. 타이틀에서 켜 두면 자리 잡기 전 팔이 카메라 코앞을 가린다
    if (G.state === 'title') { player.m.g.visible = true; titleCamera(dt); dog.update(dt, player, G); player.animate(dt, null); }
    else if (G.state === 'play') {
      G.time += dt;
      let ix = 0, iz = 0; if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1; if (keys.KeyA) ix -= 1; if (keys.KeyD) ix += 1;
      if (keys.ArrowLeft) camYaw += dt * 2.4; if (keys.ArrowRight) camYaw -= dt * 2.4; // 화살표 좌우 = 몸 돌리기
      // 폰 패드: 앞뒤는 걷기, 좌우는 몸 돌리기(카메라가 같이 돈다). 옆걸음이면 시점을 따로 끌어야 해서 한 손으로 못 한다
      // 폰 패드 — 야간자율학습 스틱과 같은 규칙: 방향은 켜짐/꺼짐, 끝까지(78%) 밀면 달린다. 시점은 화면 끌기만
      let padRun = false;
      if (joy.id !== null) {
        const n = Math.hypot(joy.dx, joy.dy), on = n > .22;
        if (on && joy.dx < -.12) ix -= 1; if (on && joy.dx > .12) ix += 1;
        if (on && joy.dy < -.12) iz += 1; if (on && joy.dy > .12) iz -= 1;
        padRun = n > .78;
      }
      const run = !!(keys.ShiftLeft || keys.ShiftRight) || tRun || padRun, sneak = !!(keys.KeyC) || tSneak;
      player.yaw = camYaw; player.move(dt, ix, iz, camYaw, run && !sneak, sneak);
      IT.update(dt); { const got = IT.checkPickup(player); if (got) { A.pat(); updItems(); const el = $(got === 'treat' ? 'btnTreat' : 'btnToy'); el.classList.remove('got'); void el.offsetWidth; el.classList.add('got'); } }
      dog.update(dt, player, G); tryCatch(); player.animate(dt, player.carry ? dog : null);
      W.doors.forEach(d => { const tg = d.open ? 1 : 0; d.t += (tg - d.t) * Math.min(1, dt * 7); d.mesh.rotation.y = (d.axis === 'x' ? -1 : 1) * d.t * Math.PI * .52; });
      world.goal.rotation.z += dt; world.goal.material.opacity = .4 + Math.sin(G.time * 5) * .2;
      updateCamera(dt); checkGoal(); updateHUD();
    } else if (G.state === 'clear') { G.clearT += dt; player.animate(dt, dog); updateCamera(dt); }
    renderer.render(scene, camera);
  }
  function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  // 세로로 들면 가로로 눕히라고 알린다. 미디어쿼리 대신 실제 창 비율을 잰다(전체화면에서 방향이 늦게 바뀌는 폰이 있다)
  let rotSkipped = false;
  function syncRot() { const w = innerWidth, h = innerHeight; if (w < 10 || h < 10) return; document.body.classList.toggle('portrait', isTouch && !rotSkipped && h > w * 1.02); }
  $('rotGo').addEventListener('click', async () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) { }
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { }
  });
  $('rotSkip').addEventListener('click', e => { e.preventDefault(); rotSkipped = true; syncRot(); });
  addEventListener('resize', syncRot); addEventListener('orientationchange', () => setTimeout(syncRot, 240)); syncRot(); setTimeout(syncRot, 400);
  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');   // 스크린샷용 — 단추·상단바 숨김
  showStage(); updItems();
  window.__sv = { tick(n, dt) { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 60); }, setCam(y) { camYaw = y; }, G, player, dog, W, start, keys, doAction, toggleDoor, camera, stageKnobs, saveStage, showStage, useItem, IT };
})();
