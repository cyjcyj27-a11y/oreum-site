// game.js — 올가미 언니: 조종·올가미·현상범·끌고 가기·감옥·상점·저장
(function () {
  const { R, S, cam, CAM, IN, touch, Q, loadGLB, sfx, AU, actx, wrap } = CORE; const { heightAt, collide, avoid, SITES, TOWN, EDGE } = WORLD; const { OUTLAWS, TIER_NEED, UP, T } = DATA;
  const V3 = THREE.Vector3, PI = Math.PI, $ = s => document.querySelector(s), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SAVE = 'bounty.save';
  const G = { started: false, paused: false, ui: null, money: 0, caught: [], up: { rope: 0, horse: 0, loop: 0, gloves: 0 }, target: 0, time: 0, ended: false, deliver: null, introT: 0, hp: 3, horseHp: 3, horseDead: false, dead: false, ch: 1, cine: null };   // ch: 1부(현상범 13명) → 엔딩 장면 → 감옥 폭파 → 2부(탈옥범 13명 다시 잡기) → 진짜 엔딩   // hp: 내 몸(걸을 때 총알 3발), horseHp: 말(탔을 때 3발). 말이 죽으면 상점에서 $300
  const stat = k => UP[k].v[G.up[k]];
  let hero = null, horse = null; const outlaws = [], captives = [];
  if (touch) document.body.classList.add('touch');

  // ── 저장 ──
  function save() { if (!G.started || G.ended) return; try { localStorage.setItem(SAVE, JSON.stringify({ v: 2, seen: G.seenBoard ? 1 : 0, money: G.money, caught: G.caught, up: G.up, target: G.target, hd: G.horseDead ? 1 : 0, ch: G.ch })); } catch (e) {} }
  function load() { try { const d = JSON.parse(localStorage.getItem(SAVE)); return d && d.v === 2 ? d : null; } catch (e) { return null; } }

  // ── 먼지·연기(점 120개를 돌려 쓴다) ──
  const PN = 120, pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSz = new Float32Array(PN), pAl = new Float32Array(PN), pVel = [], pLife = new Float32Array(PN), pMax = new Float32Array(PN), pS0 = new Float32Array(PN); let pNext = 0;
  for (let i = 0; i < PN; i++) pVel.push(new V3());
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3)); pGeo.setAttribute('size', new THREE.BufferAttribute(pSz, 1)); pGeo.setAttribute('alpha', new THREE.BufferAttribute(pAl, 1));
  const pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { sc: { value: 600 } },
    vertexShader: 'attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float sc; void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * sc / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.25, d) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC, a); }' });
  const pts = new THREE.Points(pGeo, pMat); pts.frustumCulled = false; pts.renderOrder = 3; S.add(pts);
  const _pc = new THREE.Color();
  function puff(x, y, z, vx, vy, vz, hex, size, life) { const i = pNext; pNext = (pNext + 1) % PN; pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pVel[i].set(vx, vy, vz); _pc.set(hex); pCol[i * 3] = _pc.r; pCol[i * 3 + 1] = _pc.g; pCol[i * 3 + 2] = _pc.b; pS0[i] = size; pLife[i] = pMax[i] = life; }
  function dust(p, n, spread, size) { for (let i = 0; i < n; i++) puff(p.x + (Math.random() - 0.5) * spread, p.y + 0.15, p.z + (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 1.6, 0.5 + Math.random() * 1.2, (Math.random() - 0.5) * 1.6, 0xe2c096, (size || 0.9) * (0.7 + Math.random() * 0.6), 0.6 + Math.random() * 0.5); }
  function updPuffs(dt) { for (let i = 0; i < PN; i++) { if (pLife[i] <= 0) { pAl[i] = 0; continue; } pLife[i] -= dt; const k = pLife[i] / pMax[i]; pPos[i * 3] += pVel[i].x * dt; pPos[i * 3 + 1] += pVel[i].y * dt; pPos[i * 3 + 2] += pVel[i].z * dt; pVel[i].multiplyScalar(1 - dt * 1.5); pSz[i] = pS0[i] * (1.6 - k * 0.6); pAl[i] = Math.max(0, k) * 0.34; }
    pGeo.attributes.position.needsUpdate = pGeo.attributes.size.needsUpdate = pGeo.attributes.alpha.needsUpdate = pGeo.attributes.color.needsUpdate = true; pMat.uniforms.sc.value = R.domElement.height * 0.9; }

  // ── 화면 글자 ──
  const _sp = new V3();
  function ftext(txt, wpos, cls) {
    _sp.copy(wpos).project(cam); if (_sp.z > 1) return;
    const e = document.createElement('div'); e.className = 'ftxt ' + (cls || ''); e.textContent = txt; const x = (_sp.x * 0.5 + 0.5) * innerWidth, y = (-_sp.y * 0.5 + 0.5) * innerHeight;
    e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(.6)`; e.style.transition = 'transform .9s cubic-bezier(.2,1.2,.4,1), opacity .9s'; $('#fx').appendChild(e);
    requestAnimationFrame(() => { e.style.transform = `translate(${x}px,${y - 70}px) translate(-50%,-50%) scale(1)`; }); setTimeout(() => { e.style.opacity = 0; }, 650); setTimeout(() => e.remove(), 1500);
  }
  function banner(txt, red) { const b = $('#banner'); b.textContent = txt; b.className = red ? 'red' : ''; void b.offsetWidth; b.classList.add('show'); }
  function setMoney(v, bump) { G.money = v; const e = $('#sMoney'); e.querySelector('b').textContent = '$' + v.toLocaleString('en-US'); if (bump) { e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } }

  // ── 입력 ──
  const JOY = { x: 0, y: 0, on: false };
  function moveInput() {
    const k = IN.keys; let x = 0, y = 0;
    if (k.ArrowUp) y += 1; if (k.ArrowDown) y -= 1; if (k.ArrowLeft) x -= 1; if (k.ArrowRight) x += 1; // 이동은 방향키, WASD 는 시점(core.js keyCam)
    let m = Math.hypot(x, y); if (m > 0) { x /= m; y /= m; m = (k.ShiftLeft || k.ShiftRight) ? 0.4 : 1; }
    if (JOY.on) { const L = Math.hypot(JOY.x, JOY.y); m = L < 0.16 ? 0 : Math.min(1, L); x = L > 0.01 ? JOY.x / L : 0; y = L > 0.01 ? JOY.y / L : 0; }
    return { x, y, m };
  }
  (function () { // 폰 왼쪽 패드
    const pad = $('#pad'), knob = pad.querySelector('i'); let id = null;
    const set = e => { const r = pad.getBoundingClientRect(), R0 = r.width / 2; let x = (e.clientX - r.left - R0) / R0, y = (e.clientY - r.top - R0) / R0; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } JOY.x = x; JOY.y = -y; JOY.on = true; knob.style.transform = `translate(${x * R0 * 0.55}px,${y * R0 * 0.55}px)`; };
    pad.addEventListener('pointerdown', e => { id = e.pointerId; pad.setPointerCapture(id); set(e); });
    pad.addEventListener('pointermove', e => { if (e.pointerId === id) set(e); });
    const end = e => { if (e.pointerId !== id) return; id = null; JOY.on = false; JOY.x = JOY.y = 0; knob.style.transform = ''; };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
  })();

  // ── 주인공: 걸을 땐 화면 기준, 말을 타면 차처럼(앞으로 + 좌우 조향) ──
  const WALK = 2.25, RUN = 5.4; let WALK_TS = 1.5, RUN_TS = 1.6;
  const H = { mode: 'foot', vel: new V3(), stun: 0, safe: 0, hold: 0, stepT: 0, throwT: 0, hipH: 0.93, mash: 0, stam: 4, punchT: 0, runV: 0, fistV: 0, lgT: 0, lgx: 0, lgz: 0 };
  const _f = new V3(), _a = new V3(), _b = new V3(), _hc = new V3(), _hand = new V3(), followPt = new V3();
  const heroCenter = out => out.copy(H.mode === 'ride' ? horse.pos : hero.pos);
  const facing = () => H.mode === 'ride' ? horse.yaw : hero.yaw;
  CAM.follow = () => H.mode === 'ride' ? followPt.set(horse.pos.x, horse.pos.y + (G.started ? 1.9 : 1.5), horse.pos.z)
    : G.fight ? followPt.set(hero.pos.x * 0.6 + G.fight.o.pos.x * 0.4, hero.pos.y + 1.15, hero.pos.z * 0.6 + G.fight.o.pos.z * 0.4)   // 격투: 둘 사이(주인공 쪽)를 본다
    : followPt.set(hero.pos.x, hero.pos.y + 1.25, hero.pos.z);
  CAM.ground = heightAt;
  function mount() {
    if (H.mode !== 'foot' || H.stun > 0 || G.chase || G.horseDead || Math.hypot(hero.pos.x - horse.pos.x, hero.pos.z - horse.pos.z) > 3.4) return;
    H.mode = 'ride'; horse.calling = false; horse.speed = 0; hero.play('stand'); CAM.off = wrap(CAM.yaw - (horse.yaw + PI)); CAM.chase = horse.yaw; CAM.manualT = performance.now() - 700; CAM.tDist = 9.5; sfx('bump');
  }
  function dismount() {
    if (H.mode !== 'ride') return; H.mode = 'foot';
    hero.pos.set(horse.pos.x + Math.cos(horse.yaw) * 1.45, 0, horse.pos.z - Math.sin(horse.yaw) * 1.45); collide(hero.pos, 0.35); hero.yaw = horse.yaw; H.vel.set(0, 0, 0);
    horse.speed = 0; CAM.chase = null; CAM.tYaw = CAM.yaw; CAM.tDist = 7.5; sfx('step');
  }
  function warpHorse() {   // 카메라 뒤(화면 밖)에서 막힌 데 없는 자리를 찾아 말을 옮긴다
    const cx = cam.position.x - hero.pos.x, cz = cam.position.z - hero.pos.z, cl = Math.hypot(cx, cz) || 1, base = Math.atan2(cx / cl, cz / cl);
    const bad = horse.warpAt;   // 방금 옮겼다가 또 막힌 자리는 피한다
    for (const da of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, 2.1, -2.1, 2.6, -2.6, PI]) for (const r of [CAM.dist + 7, CAM.dist + 4, 9, 6]) { const a = base + da, x = hero.pos.x + Math.sin(a) * r, z = hero.pos.z + Math.cos(a) * r; _a.set(x, 0, z); if (collide(_a, 0.9) || Math.hypot(x, z) > EDGE - 5) continue;
      if (bad && Math.hypot(x - bad.x, z - bad.z) < 5) continue;
      if (freeLen(x, z, -Math.sin(a), -Math.cos(a), r - 1.5) < r - 3) continue;   // 주인공 바로 앞(3m)까지 곧장 달려올 길이 트여 있어야
      horse.pos.set(x, heightAt(x, z), z); horse.yaw = a + PI; horse.speed = 6; horse.callP = null; horse.callT = 0; horse.warpAt = { x, z }; return true; }
    horse.warpAt = null; return false; }
  function boardOnFoot() { dismount(); hero.yaw = Math.atan2(TOWN.board.x - hero.pos.x, -6.2 - hero.pos.z); openBoard(); }   // 처음 한 번: 말에서 내려 게시판을 보며 연다
  function callHorse() { if (H.mode !== 'foot' || G.chase || G.horseDead) return; H.autoMount = false; horse.calling = true; horse.callT = 0; horse.callP = null; horse.warpAt = null; sfx('whistle'); }
  // 말을 누르면 탄다(10/3 사장님 "말을 클릭하면 타는 거로"): 가까우면 바로, 멀면 불러서 닿는 순간 탄다. 판정은 화면에서 말 몸통 둘레(뼈대 메쉬 광선 판정 대신)
  const _hp0 = new V3(), _hp1 = new V3();
  function horseUnder(x, y) { if (!horse.root.visible || G.horseDead) return false; _hp0.set(horse.pos.x, horse.pos.y + 1.15, horse.pos.z).project(cam); if (_hp0.z > 1) return false; _hp1.set(horse.pos.x, horse.pos.y + 2.2, horse.pos.z).project(cam);
    const W = innerWidth, Hh = innerHeight, cx = (_hp0.x * 0.5 + 0.5) * W, cy = (-_hp0.y * 0.5 + 0.5) * Hh, r = Math.max(28, Math.abs((_hp1.y - _hp0.y) * 0.5 * Hh) * 1.25); return Math.hypot((x - cx) / 1.3, y - cy) < r; }
  function canClickRide() { return G.started && !G.ui && !G.paused && !G.ended && !G.cine && !G.deliver && H.mode === 'foot' && !G.horseDead && !G.chase && H.stun <= 0 && L.state === 'idle'; }
  function clickRide() { if (Math.hypot(hero.pos.x - horse.pos.x, hero.pos.z - horse.pos.z) < 3.4) { mount(); return; } callHorse(); H.autoMount = true; }
  // 말 울음(neigh)은 내 말이 총에 맞을 때만 낸다(10/3 사장님 "총 안 맞았는데도 소리 내네"). 다른 데서 쓰지 말 것
  function stunHero(shot) {
    if (H.safe > 0 || H.stun > 0 || G.deliver) return;
    if (shot) { // 총알: 말이 놀라 앞발을 들고 멈춘다(떨어지지는 않는다). 걷는 중이면 잠깐 주춤. 'powder' 는 하얀 가루: 피해는 총알과 같고 연출만 다르다(하얀 번쩍 + COUGH)
      const pw = shot === 'powder'; H.safe = 2.6; CAM.shake = 0.4; if (pw) { powderFx(); sfx('cough'); powderBurst(hero.chest(_a), 10, false); ftext('COUGH', hero.chest(_a).setY(_a.y + 0.7), 'bad'); } else sfx('ricochet'); if (L.state === 'spin' || L.state === 'fly') idleLasso();
      const hpE = $('#sHp'); hpE.classList.remove('hurt'); void hpE.offsetWidth; hpE.classList.add('hurt');
      if (H.mode === 'ride') { G.horseHp--; updHpHUD(); if (G.horseHp <= 0) { horseDie(); return; } horse.rear = 0.7; horse.speed = 0; sfx('neigh'); H.hold = 0.8; }   // 탔을 땐 말이 맞는다: 3발이면 말이 쓰러진다
      else { G.hp--; updHpHUD(); if (G.hp <= 0) { heroDie(); return; } H.hold = 0.6; H.vel.set(0, 0, 0); sfx('oof'); }   // 걸을 땐 내가 맞는다: 3발이면 게임 오버
      dust(heroCenter(_hc), 4, 1); return; }
    if (L.state === 'hold') slip(); else if (L.state !== 'idle') idleLasso();
    if (H.mode === 'ride') { dismount(); horse.rear = 0.7; }
    H.stun = 1.5; H.safe = 3.4; hero.lie(true); hero.play('stand'); sfx('oof'); sfx('thud'); CAM.shake = 0.5; dust(hero.pos, 6, 1.2);
  }
  // 말이 쓰러진다: 내려서 옆으로 눕고 3.5초 뒤 사라진다. 상점에서 새 말($300)을 사기 전까진 걸어 다닌다
  function horseDie() {
    dismount(); G.horseDead = true; horse.dead = true; horse.deadT = 0; horse.speed = 0; horse.calling = false; horse.rear = 0;
    sfx('neigh'); sfx('thud'); CAM.shake = 0.7; dust(horse.pos, 10, 1.6); banner(T.horseDown, true); H.hold = 1.0; H.vel.set(0, 0, 0); updHpHUD(); updTargetHUD(); save();
  }
  function buyHorse() {
    G.horseDead = false; G.horseHp = 3; horse.dead = false; horse.deadT = 0; horse.root.rotation.z = 0; horse.root.visible = true; horse.calling = false; horse.speed = 0;
    // 새 말은 주인공 옆 울타리 바깥(길 쪽) 빈자리에 길을 보고 선다(10/3 "말을 샀는데 갇혀서 못 나온다": 바라보는 쪽에 세웠더니 울타리 안에 생겼다)
    const inPen = (x, z) => x > 6.4 && x < 19.6 && z > 6.6 && z < 14.5; let ok = false;
    for (const r of [2.6, 4, 6]) { for (const da of [PI / 2, -PI / 2, PI, PI * 0.75, -PI * 0.75, PI / 4, -PI / 4, 0]) { const a = hero.yaw + da, x = hero.pos.x + Math.sin(a) * r, z = hero.pos.z + Math.cos(a) * r; if (inPen(x, z) || Math.hypot(x, z) > EDGE - 4) continue; _a.set(x, 0, z); if (collide(_a, 0.85)) continue; horse.pos.set(x, 0, z); ok = true; break; } if (ok) break; }
    if (!ok) horse.pos.set(hero.pos.x + Math.sin(hero.yaw + PI / 2) * 2.6, 0, hero.pos.z + Math.cos(hero.yaw + PI / 2) * 2.6);   // 어디서든 사니까(10/6) 마구간이 아니라 주인공 옆
    horse.pos.y = heightAt(horse.pos.x, horse.pos.z); horse.yaw = PI; horse.rear = 0.7; horse.update(0.016); updHpHUD(); updTargetHUD();
  }
  // 내가 쓰러진다: 게임 오버. 저장은 그대로 두고 RETRY 로 이어하기(체력만 채워서)
  function heroDie() {
    G.dead = true; G.ended = true; if (L.state === 'hold') slip(); else if (L.state !== 'idle') idleLasso();
    H.stun = 9999; H.hold = 9999; H.vel.set(0, 0, 0); hero.lie(true); hero.play('stand'); sfx('oof'); sfx('thud'); CAM.shake = 0.8; dust(hero.pos, 8, 1.4);
    banner('GAME OVER', true); MUSIC.mode('calm'); document.body.classList.add('ending'); CAM.tDist = 12; CAM.tPitch = 0.45;
    $('#endCard .end').textContent = 'GAME OVER'; $('#btnTitle').textContent = T.retry; setTimeout(() => $('#endCard').classList.add('show'), 1400);
  }
  let hpKey = '';
  function updHpHUD() { const ride = H.mode === 'ride' && !G.horseDead, n = ride ? G.horseHp : G.hp, k = (ride ? 'r' : 'f') + n; if (k === hpKey) return; hpKey = k; const e = $('#sHp'); e.classList.toggle('ride', ride); const ps = e.querySelectorAll('.hp i'); for (let i = 0; i < ps.length; i++) ps[i].className = i < n ? 'on' : ''; }
  function updHero(dt) {
    if (H.hold > 0) H.hold -= dt;
    const lock = G.ui || H.stun > 0 || H.hold > 0 || L.state === 'hold' || G.introT > 0 || G.deliver || !G.started;
    const inp = G.cine ? { x: 0, y: G.cine.thr || 0, m: G.cine.thr ? 1 : 0 } : lock ? { x: 0, y: 0, m: 0 } : moveInput();
    if (H.stun > 0) { H.stun -= dt; if (H.stun <= 0.4) hero.lie(false); }
    if (H.safe > 0) H.safe -= dt; if (H.throwT > 0) H.throwT -= dt;
    if (H.mode === 'ride') {
      const maxV = stat('horse') * (captives.length ? 0.93 : 1);
      let thr = 0, st = 0;
      if (inp.m > 0.1) { st = inp.x * inp.m; thr = JOY.on ? (inp.y > -0.6 ? inp.m : -1) : inp.y; }
      // 아래(뒤) = 뒷걸음이 아니라 제자리에서 돌아선다: 카메라가 말 뒤를 따라 같이 돌아 가는 쪽이 늘 보인다
      const pivot = thr < -0.4 && horse.speed < (JOY.on ? 5 : 3.5); if (Math.abs(st) >= 0.3) H.pivot = Math.sign(st); else if (pivot) st = H.pivot || 1;   // 폰(조이스틱)은 더 빠른 속도에서부터 돌아서기 시작(10/7 포럼 "유턴이 답답")
      const want = thr > 0.15 ? maxV * Math.min(1, thr * 1.15) : thr < -0.4 ? 1.3 : Math.abs(st) > 0.3 ? 1.4 : 0;
      const acc = want > horse.speed ? 7 : thr < -0.1 || lock ? (JOY.on && thr < -0.4 ? 24 : 15) : 5;   // 폰에서 뒤로 당기면 더 빨리 선다
      horse.speed += clamp(want - horse.speed, -acc * dt, acc * dt);
      horse.yaw -= st * (2.5 - 1.1 * Math.min(1, Math.abs(horse.speed) / maxV)) * (pivot ? (JOY.on ? 2.1 : 1.25) : 1) * dt * (horse.speed < -0.1 ? -1 : 1);   // 폰 돌아서기 x2.1(180도 0.65초쯤, 전엔 1초)
      const px = horse.pos.x, pz = horse.pos.z;
      horse.pos.x += Math.sin(horse.yaw) * horse.speed * dt; horse.pos.z += Math.cos(horse.yaw) * horse.speed * dt;
      const hit = collide(horse.pos, 0.85);
      if (hit) { // 정면으로 박으면 멈칫, 비스듬히 닿으면 벽을 따라 비껴 달린다
        const mx = horse.pos.x - px, mz = horse.pos.z - pz, mv = Math.hypot(mx, mz) / dt, sp0 = Math.abs(horse.speed);
        if (sp0 > 5 && mv < sp0 * 0.45) { sfx('bump'); CAM.shake = 0.25; if (hit === 'cactus') { horse.rear = 0.7; } }
        if (horse.speed > 0.5 && mv > 0.3) horse.yaw += wrap(Math.atan2(mx, mz) - horse.yaw) * Math.min(1, dt * 7);
        horse.speed = Math.sign(horse.speed) * Math.min(sp0, Math.max(mv, 1.2));
      }
      horse.pos.y = heightAt(horse.pos.x, horse.pos.z); if (G.started && !G.cine) CAM.chase = horse.yaw;
      H.vel.set((horse.pos.x - px) / dt, 0, (horse.pos.z - pz) / dt);
    } else {
      const fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw), sx = Math.cos(CAM.yaw), sz = -Math.sin(CAM.yaw);
      let sp = inp.m < 0.12 ? 0 : inp.m < 0.6 ? WALK : captives.length && !G.chase ? 4.4 : RUN;
      let wx = (fx * inp.y + sx * inp.x) * sp, wz = (fz * inp.y + sz * inp.x) * sp; const k = 1 - Math.exp(-9 * dt);
      H.mash *= Math.exp(-2.4 * dt); if (H.punchT > 0) H.punchT -= dt;
      if (G.chase && !G.fight && !lock) { // 풀려난 놈을 쫓는다: Space 를 빨리 두드릴수록 빨라진다. 방향을 안 누르면 저절로 그놈 쪽으로
        sp = CHASE_V0 + CHASE_K * Math.min(9, H.mash * 2.4); H.runV = sp;
        let ux = fx * inp.y + sx * inp.x, uz = fz * inp.y + sz * inp.x; if (inp.m < 0.12) { ux = G.chase.pos.x - hero.pos.x; uz = G.chase.pos.z - hero.pos.z; }
        const um = Math.hypot(ux, uz) || 1; wx = ux / um * sp; wz = uz / um * sp; }
      // 걸을 때 카메라: 옆으로 갈수록 등 뒤로 돌아온다(카메라 쪽으로 올 때는 안 돈다 → 방향이 뒤집히지 않는다). 시점을 손으로 돌린 뒤 0.9초는 그대로 둔다
      if (sp > 0 && !G.fight && performance.now() - CAM.manualT > 900) { const dl = wrap(Math.atan2(wx, wz) + PI - CAM.tYaw); CAM.tYaw += G.chase && inp.m < 0.12 ? clamp(dl, -2.2 * dt, 2.2 * dt) : Math.sin(dl) * 1.0 * dt; }
      H.vel.x += (wx - H.vel.x) * k; H.vel.z += (wz - H.vel.z) * k;
      hero.pos.x += H.vel.x * dt; hero.pos.z += H.vel.z * dt;
      if (H.lgT > 0) { const f = Math.min(dt, H.lgT) / 0.12; hero.pos.x += H.lgx * f; hero.pos.z += H.lgz * f; H.lgT -= dt; }   // 주먹 내지를 때 한 발 들어간다(붙어서 때리게)
      collide(hero.pos, 0.35);
      const hx = hero.pos.x - horse.pos.x, hz = hero.pos.z - horse.pos.z, hd = Math.hypot(hx, hz); if (hd < 1.0 && hd > 0.001) { hero.pos.x = horse.pos.x + hx / hd; hero.pos.z = horse.pos.z + hz / hd; }
      hero.pos.y = heightAt(hero.pos.x, hero.pos.z);
      const v = Math.hypot(H.vel.x, H.vel.z);
      if (sp > 0) hero.yaw += wrap(Math.atan2(wx, wz) - hero.yaw) * Math.min(1, dt * 11); else if (L.state === 'spin' || L.state === 'fly' || L.state === 'cinch' || L.state === 'hold') hero.yaw += wrap(L.aimYaw - hero.yaw) * Math.min(1, dt * 10);
      // 격투 카메라(10/3 사장님 "전투할 때 카메라 회전해 줘"): 놈 쪽을 보는 주인공의 오른 어깨 뒤로 비스듬히 돌아가 둘이 맞붙은 모습을 비춘다. 손으로 돌리면 1.5초는 손을 따른다
      if (G.fight && performance.now() - CAM.manualT > 1500) { const fy = Math.atan2(G.fight.o.pos.x - hero.pos.x, G.fight.o.pos.z - hero.pos.z) + PI + 0.62; CAM.tYaw += wrap(fy - CAM.tYaw) * Math.min(1, dt * 3.2); CAM.tPitch += (0.26 - CAM.tPitch) * Math.min(1, dt * 2); }
      if (G.fight && sp === 0) hero.yaw += wrap(Math.atan2(G.fight.o.pos.x - hero.pos.x, G.fight.o.pos.z - hero.pos.z) - hero.yaw) * Math.min(1, dt * 12);
      if (H.stun > 0) hero.play('stand'); else if (G.fight && hero.acts.fightidle) { if (!(H.punchT > 0.03) && !(H.hold > 0)) hero.play(v > 0.6 ? 'walk' : 'fightidle', v > 0.6 ? Math.max(0.5, v / WALK * WALK_TS) : 1.2); } // 격투: 주먹과 맞는 동작은 punch, hitHero 가 튼다(믹사모 동작)
      else if (v > 3.4) hero.play('run', v / RUN * RUN_TS); else if (v > 0.25) hero.play('walk', Math.max(0.5, v / WALK * WALK_TS)); else hero.play('stand');
      if (v > 3.4) { H.stepT -= dt; if (H.stepT <= 0) { H.stepT = 0.3; sfx('step'); puff(hero.pos.x, hero.pos.y + 0.12, hero.pos.z, -H.vel.x * 0.1, 0.6, -H.vel.z * 0.1, 0xe2c096, 0.6, 0.5); } }
    }
    H.fistV += ((G.fight && H.stun <= 0 ? 1 : 0) - H.fistV) * Math.min(1, dt * 10); hero.fist(H.fistV);   // 격투 중엔 주먹을 쥔다
    // 말(안 탔을 때): 부르면 달려온다
    if (H.mode !== 'ride') {
      if (horse.dead) { horse.deadT += dt; horse.speed = 0; horse.calling = false; horse.root.rotation.z = Math.min(PI / 2, horse.deadT * 4); horse.pos.y = heightAt(horse.pos.x, horse.pos.z) + Math.min(0.2, horse.deadT * 0.8); if (horse.deadT > 3.5) horse.root.visible = false; }
      else if (horse.calling) {
        const dx = hero.pos.x - horse.pos.x, dz = hero.pos.z - horse.pos.z, d = Math.hypot(dx, dz);
        // 길을 못 찾고 건물·울타리에 막히면(1.2초에 1m 도 못 다가옴) 또는 6초가 지나도 40m 넘게 멀면, 카메라 뒤쪽 빈자리로 옮겨 거기서 달려오게 한다(10/4 사장님 "말이 안온다 어디 갖혔나봐")
        horse.callT = (horse.callT || 0) + dt; if (!horse.callP) horse.callP = { d, t: 0 }; horse.callP.t += dt;
        if (horse.callP.t >= 1.2) { const stuck = horse.callP.d - d < 1 && d > 4; horse.callP = { d, t: 0 }; if (stuck && d < 10) { horse.calling = false; horse.speed = 0; H.autoMount = false; } else if (stuck || (horse.callT > 6 && d > 40)) warpHorse(); }   // 10m 안에서 막히면(주인공이 처마 밑 같은 좁은 데) 거기 서서 기다린다
        if (d < 2.6) { horse.calling = false; horse.speed = 0; if (H.autoMount) { H.autoMount = false; mount(); } } else { horse.yaw += wrap(Math.atan2(dx, dz) - horse.yaw) * Math.min(1, dt * 4); horse.speed += (Math.min(11, d * 1.2 + 2) - horse.speed) * Math.min(1, dt * 3); horse.pos.x += Math.sin(horse.yaw) * horse.speed * dt; horse.pos.z += Math.cos(horse.yaw) * horse.speed * dt; collide(horse.pos, 0.85); horse.pos.y = heightAt(horse.pos.x, horse.pos.z); }
      } else horse.speed *= Math.pow(0.02, dt);
    }
    horse.update(dt);
    if (horse.stepHit && Math.abs(horse.speed) > 1) { sfx('hoof', Math.min(1, 0.35 + Math.abs(horse.speed) / 14)); if (Math.abs(horse.speed) > 6) puff(horse.pos.x - Math.sin(horse.yaw) * 0.8, horse.pos.y + 0.15, horse.pos.z - Math.cos(horse.yaw) * 0.8, (Math.random() - 0.5), 0.8, (Math.random() - 0.5), 0xe9cfa8, 0.7, 0.7); }
    // 몸 놓기 + 덧입히는 자세
    if (H.mode === 'ride') { hero.root.position.set(horse.seat.x, horse.seat.y - H.hipH + 0.3, horse.seat.z); hero.root.rotation.set(0, horse.yaw, 0); hero.yaw = horse.yaw; hero.pos.copy(horse.pos); }
    else { hero.root.position.copy(hero.pos); hero.root.rotation.set(0, hero.yaw, 0); }
    hero.mixer.update(dt);
    const armBusy = L.state === 'spin' || L.state === 'hold' || H.throwT > 0;
    if (H.mode === 'ride' && H.stun <= 0) hero.pose('ride', armBusy); else if (H.mode === 'foot' && hero.cur === hero.acts.stand && H.stun <= 0) hero.pose('stand');
    if (L.state === 'spin') hero.pose('spin', L.spinA); else if (L.state === 'hold') hero.pose('pull', G.time); else if (H.throwT > 0) hero.pose('throw');
  }

  // ── 올가미: 누르고 있으면 머리 위에서 돌고(땅의 동그라미가 멀어졌다 가까워졌다), 놓으면 그 자리로 날아간다 ──
  const L = { state: 'idle', t: 0, charge: 0, aimYaw: 0, dist: 0, land: new V3(), from: new V3(), cur: new V3(), target: null, gauge: 0, spinA: 0, sfxT: 0, pending: false, dur: 0.4, r0: 1 };
  const loop = ACT.makeLoop(), lrope = new ACT.Rope(10, 0.026);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 44), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -PI / 2; ring.visible = false; ring.renderOrder = 2; S.add(ring);
  const catchables = () => outlaws.filter(o => o.state === 'idle' || o.state === 'alert' || o.state === 'mount' || o.state === 'flee' || o.state === 'guard');
  // 올가미 거리 게이지(10/5 포럼 플레이어 "고리가 펴지는 중인지 돌아오는 중인지 알 수 없어 놓는 타이밍이 찍기였다"): 화면 아래 막대 위를 손잡이가 오가고, 표적이 있는 거리에 금색 눈금. 손잡이가 눈금에 닿을 때 놓는다
  const aimE = $('#aim'), aimKb = aimE.querySelector('.kb'), aimTk = aimE.querySelector('.tk'), aimNum = aimE.querySelector('b');
  function aimUI(on, pos, back, tick, gold, dist) { aimE.classList.toggle('on', on); if (!on) return; aimKb.style.left = (pos * 100).toFixed(1) + '%'; aimKb.classList.toggle('back', back); aimKb.classList.toggle('gold', gold); aimTk.style.display = tick === null ? 'none' : ''; if (tick !== null) aimTk.style.left = (tick * 100).toFixed(1) + '%'; aimNum.textContent = Math.round(dist) + 'm'; }
  function idleLasso() { aimUI(false); if (L.state === 'cinch' && L.target && L.target.state === 'snared') { L.target.state = 'flee'; L.target.boost = 2; } if (CAM.manualT > performance.now()) CAM.manualT = performance.now() - 600; L.state = 'idle'; L.pending = false; loop.visible = false; lrope.hide(); ring.visible = false; $('#tug').classList.remove('on'); $('#lassoBtn').classList.remove('on'); }
  function lassoDown() {
    if (!G.started || G.paused || G.ui || G.deliver || G.introT > 0 || G.ended || G.cine) return; actx();
    if (G.fight) { punch(); return; } if (G.chase) { H.mash += 1; return; }
    if (L.state === 'hold') { L.gauge = Math.min(1.02, L.gauge + 0.085 * stat('gloves')); sfx('tug'); CAM.shake = 0.12; if (L.target) L.target.kick = 0.14; return; }
    if (L.state !== 'idle' || H.stun > 0) return; if (captives.length >= 3) { sfx('no'); ftext('FULL', hero.chest(_a).setY(_a.y + 0.7), 'bad'); return; }   // 셋까지만 끈다
    L.state = 'spin'; L.t = 0; L.sfxT = 0; L.aimYaw = facing(); L.pending = false; $('#lassoBtn').classList.add('on');
  }
  function lassoUp() { $('#lassoBtn').classList.remove('on'); if (L.state !== 'spin') return; if (L.t < 0.15) L.pending = true; else release(); }
  function release() { aimUI(false); L.pending = false; L.state = 'fly'; L.t = 0; L.from.copy(loop.position); L.dur = 0.26 + L.dist * 0.022; L.r0 = loop.scale.x; H.throwT = 0.4; sfx('throw'); }
  function slip() { const o = L.target; sfx('slip'); if (o) { ftext('MISS', o.p.chest(_a), 'bad'); o.state = 'flee'; o.boost = 2.5; } L.state = 'cool'; L.t = 0; loop.visible = false; lrope.hide(); $('#tug').classList.remove('on'); if (CAM.manualT > performance.now()) CAM.manualT = performance.now() - 600; }
  function landLasso() {
    ring.visible = false; const lr = stat('loop'); let best = null, bd = 1e9;
    catchables().forEach(o => { const d = Math.hypot(o.pos.x - L.land.x, o.pos.z - L.land.z); if (d < lr + 0.35 && d < bd) { bd = d; best = o; } });
    if (!best) { L.state = 'miss'; L.t = 0; sfx('land'); dust(L.land, 4, lr); return; }
    const perfect = bd < lr * 0.42; ftext(perfect ? 'PERFECT' : 'NICE', best.p.chest(_a), perfect ? 'big' : ''); sfx('snag', perfect); L.target = best; L.perfect = perfect;
    if (best.horse) unhorse(best);
    best.state = 'snared'; best.vel.set(0, 0, 0); best.pos.y = heightAt(best.pos.x, best.pos.z); best.p.cur = null; best.p.play('stand'); L.state = 'cinch'; L.t = 0; snapFx(best, perfect);
  }
  // 걸린 순간의 손맛: 잠깐 느려지고(히트스톱), 화면이 당겨지고 가장자리가 번쩍, 발밑 흙먼지와 밧줄 보푸라기, 폰은 진동
  function snapFx(o, perfect) {
    G.slowT = perfect ? 0.5 : 0.36; G.fovK = perfect ? 1.3 : 1; CAM.shake = perfect ? 0.55 : 0.38;
    const f = $('#snapFx'); f.classList.remove('on'); f.classList.toggle('big', perfect); void f.offsetWidth; f.classList.add('on');
    try { if (navigator.vibrate && touch) navigator.vibrate(perfect ? [45, 30, 70] : 45); } catch (e) {}
    dust(o.pos, perfect ? 14 : 9, 1.4, 1.1); o.p.chest(_a); for (let i = 0; i < (perfect ? 18 : 11); i++) { const a = i / (perfect ? 18 : 11) * PI * 2; puff(_a.x, _a.y, _a.z, Math.cos(a) * 4.5, (Math.random() - 0.3) * 2.5, Math.sin(a) * 4.5, 0xfff4d8, 0.34, 0.4); }   // 가슴에서 사방으로 튀는 밝은 보푸라기(모래색이면 안 보인다)
  }
  // 조이기가 끝나면: 센 놈은 줄다리기(hold), 약한 놈은 바로 잡아챈다
  function cinchDone(best) {
    const perfect = L.perfect;
    if (best.tugLv > 0) { L.state = 'hold'; L.gauge = perfect ? 0.68 : 0.45; best.state = 'roped'; best.ropeD = Math.max(6.5, Math.hypot(best.pos.x - heroCenter(_hc).x, best.pos.z - _hc.z) + 0.5); best.vel.set(0, 0, 0); if (H.mode === 'ride') { CAM.off = CAM.off < 0 ? -0.75 : 0.75; CAM.manualT = performance.now() + 60000; } $('#tug').classList.add('on'); }
    else { capture(best); L.state = 'cool'; L.t = 0; }
  }
  function updLasso(dt) {
    if (L.state === 'idle') return;
    const hp = hero.hand(_hand);
    if (L.state === 'spin') {
      // 고리 크기 오가는 박자: 30m 면 1.8초에 한 번 끝까지(초당 15m)
      L.t += dt; const cyc = (L.t / (1.25 + Math.max(0, stat('rope') - 12) * 0.03)) % 2; L.charge = 0.05 + 0.95 * (cyc < 1 ? cyc : 2 - cyc);
      const maxD = stat('rope'), base = facing(), c = heroCenter(_hc); L.dist = 3 + (maxD - 3) * L.charge;
      let best = null, bd = 1e9;
      catchables().forEach(o => { const dx = o.pos.x - c.x, dz = o.pos.z - c.z, d = Math.hypot(dx, dz); if (d > maxD + 7 || Math.abs(wrap(Math.atan2(dx, dz) - base)) > (H.mode === 'ride' ? 2.0 : 1.6)) return; if (d < bd) { bd = d; best = o; } });
      const ft = 0.26 + L.dist * 0.022;
      if (best) L.aimYaw += wrap(Math.atan2(best.pos.x + best.vel.x * ft - c.x - H.vel.x * 0, best.pos.z + best.vel.z * ft - c.z) - L.aimYaw) * Math.min(1, dt * 12); else L.aimYaw += wrap(base - L.aimYaw) * Math.min(1, dt * 8);
      L.land.set(c.x + Math.sin(L.aimYaw) * L.dist, 0, c.z + Math.cos(L.aimYaw) * L.dist); L.land.y = heightAt(L.land.x, L.land.z) + 0.12;
      const lr = stat('loop'); ring.visible = true; ring.position.copy(L.land); ring.scale.setScalar(lr);
      const gold = !!best && Math.hypot(best.pos.x + best.vel.x * ft - L.land.x, best.pos.z + best.vel.z * ft - L.land.z) < lr; ring.material.color.set(gold ? 0xffd23a : 0xffffff);
      const dp = best ? Math.hypot(best.pos.x + best.vel.x * ft - c.x, best.pos.z + best.vel.z * ft - c.z) : 0;
      aimUI(true, (L.dist - 3) / (maxD - 3), cyc >= 1, best && dp < maxD + 1 ? clamp((dp - 3) / (maxD - 3), 0, 1) : null, gold, L.dist);
      L.spinA += dt * (9 + 6 * L.charge); const rad = 0.5 + 0.55 * L.charge;
      loop.visible = true; loop.position.set(hp.x, hp.y + 0.5, hp.z); loop.scale.setScalar(rad); loop.rotation.set(Math.sin(L.spinA) * 0.22, L.spinA, Math.cos(L.spinA) * 0.22);
      _a.set(loop.position.x + Math.cos(L.spinA) * rad, loop.position.y, loop.position.z + Math.sin(L.spinA) * rad); lrope.hang(hp, _a, 0.04);
      L.sfxT -= dt; if (L.sfxT <= 0) { L.sfxT = 0.3 - 0.1 * L.charge; sfx('spin', L.charge); }
      if (L.pending && L.t >= 0.15) release();
    } else if (L.state === 'fly') {
      L.t += dt; const e = Math.min(1, L.t / L.dur), lr = stat('loop');
      L.cur.lerpVectors(L.from, L.land, e); L.cur.y += Math.sin(e * PI) * (1.0 + L.dist * 0.12);   // 멀수록 높게 포물선(30m 면 4.6m)
      loop.position.copy(L.cur); loop.scale.setScalar(L.r0 + (lr - L.r0) * e); L.spinA += dt * 7; loop.rotation.set(0.5 * (1 - e), L.spinA, 0);
      lrope.hang(hp, L.cur, 0.7 * Math.sin(e * PI), heightAt);
      if (e >= 1) landLasso();
    } else if (L.state === 'cinch') { // 땅에 떨어진 고리가 몸을 타고 올라가 가슴에서 확 조인다. 줄은 팽팽해져 부르르 떤다
      const o = L.target; if (!o || o.state !== 'snared') { idleLasso(); return; }
      L.t += dt; const e = Math.min(1, L.t / 0.14), ee = 1 - Math.pow(1 - e, 3), lr = stat('loop'); o.p.chest(_a);
      loop.visible = true; _b.set(o.pos.x, o.pos.y + 0.15, o.pos.z); loop.position.lerpVectors(_b, _a, ee); loop.scale.setScalar(lr + (0.36 - lr) * ee); loop.rotation.set(0, L.spinA += dt * 4, 0);
      const after = Math.max(0, L.t - 0.14), slack = e < 1 ? 0.45 * (1 - ee) : Math.sin(after * 75) * 0.07 * Math.max(0, 1 - after / 0.12); lrope.hang(hp, loop.position, slack, heightAt);
      if (L.t >= 0.26) cinchDone(o);
    } else if (L.state === 'hold') {
      const o = L.target; L.gauge -= (0.16 + 0.06 * o.tugLv) * dt; $('#tug .g i').style.width = clamp(L.gauge * 100, 0, 100) + '%';
      o.p.chest(_a); loop.visible = true; loop.position.copy(_a); loop.scale.setScalar(0.36); loop.rotation.set(0, 0, 0); lrope.hang(hp, _a, 0.02);
      if (L.gauge <= 0) slip(); else if (L.gauge >= 1) { $('#tug').classList.remove('on'); if (CAM.manualT > performance.now()) CAM.manualT = performance.now() - 600; capture(o); L.state = 'cool'; L.t = 0; }
    } else if (L.state === 'miss') {
      L.t += dt; const e = Math.min(1, L.t / 0.55), b = Math.max(0, e - 0.3) / 0.7;
      loop.position.lerpVectors(L.land, hp, b); loop.scale.setScalar(stat('loop') * (1 - 0.75 * b)); lrope.hang(hp, loop.position, 0.4 * (1 - e), heightAt);
      if (e >= 1) idleLasso();
    } else if (L.state === 'cool') { L.t += dt; loop.visible = false; lrope.hide(); if (L.t > 0.35) idleLasso(); }
  }

  // ── 현상범 ──
  const ohorses = [], capRopes = [], stable = [];   // stable: 마구간 울타리 안의 말(파는 말)
  const _pcol = new THREE.Color(), ponyCoat = hex => _pcol.set(hex).lerp(new THREE.Color(0xffffff), 0.35); // 흰 조랑말 무늬에 곱하는 색(너무 어둡지 않게)
  function mkOutlaw(gltf, only) { const p = ACT.makePerson(gltf, 1.76, 0xffffff, !!only); p.root.visible = false; return { only: only || 0, p, pos: p.pos, vel: new V3(), yaw: 0, state: 'off', kind: '', def: null, t: 0, horse: null, myHorse: null, tugLv: 0, speed: 5, fleeT: 0, shootT: 0, far: 0, boost: 0, hop: 0, kick: 0, home: new V3(), dragV: 0, bumpT: 0, dustT: 0, coinT: 2, coins: 0, wanderT: 0 }; }
  function spawn(kind, def, x, z) {
    const mine = kind === 'main' && def.model ? def.id : 0, o = outlaws.find(q => q.state === 'off' && q.only === mine); if (!o) return null;
    Object.assign(o, { kind, def, state: kind === 'guard' ? 'guard' : 'idle', yaw: Math.random() * 6, t: Math.random() * 5, fleeT: 0, far: 0, boost: 0, horse: null, myHorse: null, tugLv: def.tug || 0, speed: def.speed || 5, shootT: 1.5 + Math.random() * 2, dragV: 0, coins: 0, hop: 0, kick: 0, tight: kind !== 'main', dragD: 0, getup: 0, fhp: 0, escT: 0, stP: null, sgT: 0, sgYaw: undefined });
    o.pos.set(x, heightAt(x, z), z); o.home.set(x, 0, z); o.vel.set(0, 0, 0);
    o.p.root.visible = true; o.p.lie(false); o.p.mat.color.set(def.tint || 0xffffff); if (o.p.mask) { o.p.mask.material.color.set(def.mask || 0x8a1c14); o.p.mask.visible = !def.noMask; } o.p.root.scale.setScalar((def.h || 1.76) / 1.76); o.p.cur = null; o.p.mixer.stopAllAction(); o.p.play(kind === 'main' && def.id % 2 === 0 ? 'dance1' : 'stand', 1);
    if (def.horse) { const h = ohorses.find(q => !q.used); if (h) { h.used = true; h.mat.color.set(h.pony ? ponyCoat(def.coat || 0x6a4a34) : def.coat || 0x6a4a34); h.pos.set(x + 2.2, heightAt(x + 2.2, z - 1.2), z - 1.2); h.yaw = 1; h.speed = 0; h.root.visible = true; h.fade = 0; o.myHorse = h; h.update(0.016); } }
    return o;
  }
  function despawn(o) { if (G.chase === o) endChase(); o.state = 'off'; o.p.root.visible = false; if (o.myHorse) { o.myHorse.used = false; o.myHorse.root.visible = false; o.myHorse = null; } o.horse = null; }
  function unhorse(o) { const h = o.horse; o.horse = null; o.myHorse = null; h.fade = 7; o.pos.copy(h.pos); h.rear = 0.5; }
  // 현상범 전용 모델은 표적으로 고를 때 읽는다(13명을 처음에 다 읽으면 로딩이 길어진다)
  const modelP = {};
  function needModel(def) { if (!def.model) return Promise.resolve(); return modelP[def.id] || (modelP[def.id] = loadGLB('assets/models/outlaws/' + def.model + '.glb').then(g => new Promise(r => setTimeout(() => r(g), 0))).then(g => { const o = mkOutlaw(g, def.id); o.p.root.visible = true; o.p.root.position.copy(hero.pos);
      const warm = () => { o.p.root.visible = true; o.p.root.traverse(c => c.frustumCulled = false); o.p.mixer.update(0.01); R.render(S, cam); o.p.root.traverse(c => c.frustumCulled = true); o.p.root.visible = false; outlaws.push(o); };
      const cp = R.compileAsync ? R.compileAsync(o.p.root, cam, S).catch(() => {}) : Promise.resolve(R.compile(S, cam)); o.p.root.visible = false;   // 셰이더는 따로 엮고(compileAsync) 그동안 화면엔 안 보이게
      return cp.then(() => new Promise(r => setTimeout(r, 0))).then(warm); })); }   // 불러올 때 한 번 그려 GPU 에 올려 둔다(처음 눈에 들어올 때 0.3~0.5초 멈칫하던 것)
  const curTarget = () => outlaws.find(o => o.kind === 'main' && o.state !== 'off' && o.def.id === G.target);
  function setTarget(id) {
    if (G.ch === 2) { if (L.state === 'hold') idleLasso(); G.target = id; G.respawn = 0; updTargetHUD(); save(); return; }   // 2부: 다 풀려 있으니 전단은 화살표 목적지만 바꾼다(놈들은 updCh2 가 은신처마다 세워 둔다)
    if (G.chase) endChase();
    outlaws.forEach(o => { if (o.state !== 'off' && o.state !== 'down' && o.state !== 'jail' && (o.kind === 'main' || o.kind === 'guard')) despawn(o); });
    if (L.state === 'hold') idleLasso();
    G.target = id; G.respawn = 0; MUSIC.mode('calm');
    if (id) { const def = OUTLAWS[id - 1], s = SITES[def.site], c = Math.cos(s.ry), sn = Math.sin(s.ry), at = (lx, lz) => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
      const go = () => { if (G.target !== id || curTarget() || captives.some(o => o.kind === 'main' && o.def.id === id)) return; const [x, z] = at(2.4, 2.6); spawn('main', def, x, z);
        for (let i = 0; i < (def.guards || 0); i++) { const [gx, gz] = at(-7 + i * 7, 9); spawn('guard', { name: T.hench, tint: 0x8a7a70, h: 1.74 + i * 0.05, tug: 1, shoot: 2.8, bounty: DATA.GUARD_BOUNTY }, gx, gz); } };
      needModel(def).then(go).catch(e => console.error(e)); }
    updTargetHUD(); save();
  }
  function escaped(o) { if (o.kind !== 'main') { despawn(o); return; } banner('ESCAPED', true); sfx('escaped'); MUSIC.mode('calm'); const id = o.def.id; despawn(o); if (G.ch === 2) ch2Gone[id] = G.time; else G.respawn = 6; }
  // ── 2부: 탈옥한 놈들이 은신처마다 한꺼번에 나와 있다(10/7 사장님 "2부에서는 한꺼번에 다 풀려 있고 여러 명을 한꺼번에 잡을 수 있게") ──
  // 주인공이 은신처 280m 안에 들어오면 그 놈을 세운다(모델은 한 번에 하나씩 읽어 멈칫이 겹치지 않게). 달아난 놈은 6초 뒤, 주인공이 은신처에서 60m 넘게 떨어져 있을 때 다시 선다
  const ch2Gone = {}; let ch2Loading = false;
  const outlawOut = id => outlaws.some(o => o.kind === 'main' && o.state !== 'off' && o.def && o.def.id === id);
  function updCh2(dt) {
    if (G.ch !== 2 || !G.started || G.cine || G.ended || ch2Loading) return;
    const c = heroCenter(_hc);
    for (const d of OUTLAWS) {
      if (G.caught.includes(d.id) || !tierOpen(d.tier, d.id) || outlawOut(d.id)) continue;
      const s = SITES[d.site], dist = Math.hypot(c.x - s.x, c.z - s.z); if (dist > 280 || dist < 60) continue;
      if (ch2Gone[d.id] && G.time - ch2Gone[d.id] < 6) continue;
      ch2Loading = true;

      needModel(d).then(() => { ch2Loading = false; if (G.ch !== 2 || G.caught.includes(d.id) || outlawOut(d.id)) return; const s2 = SITES[d.site], c2 = heroCenter(_hc); if (Math.hypot(c2.x - s2.x, c2.z - s2.z) > 320) return;   // 읽는 사이 멀어졌으면 다음에
        const k = Math.cos(s2.ry), sn = Math.sin(s2.ry), at = (lx, lz) => [s2.x + lx * k + lz * sn, s2.z - lx * sn + lz * k]; const [x, z] = at(2.4, 2.6); spawn('main', d, x, z);
        for (let i = 0; i < (d.guards || 0); i++) { const [gx, gz] = at(-7 + i * 7, 9); spawn('guard', { name: T.hench, tint: 0x8a7a70, h: 1.74 + i * 0.05, tug: 1, shoot: 2.8, bounty: DATA.GUARD_BOUNTY }, gx, gz); } }).catch(e => { ch2Loading = false; console.error(e); });
      break;   // 한 틱에 하나
    }
  }
  // 2부에서 목적지가 비면 가장 가까운 은신처의 놈을 화살표 목적지로(전단에서 바꿀 수 있다)
  function autoTarget() { if (G.ch !== 2 || G.target || G.ended) return; const c = heroCenter(_hc); let best = 0, bd = 1e9; OUTLAWS.forEach(d => { if (G.caught.includes(d.id) || !tierOpen(d.tier, d.id)) return; const s = SITES[d.site], dist = Math.hypot(c.x - s.x, c.z - s.z); if (dist < bd) { bd = dist; best = d.id; } }); if (best) setTarget(best); }
  function capture(o) {
    o.state = 'down'; o.vel.set(0, 0, 0); o.p.lie(true); o.p.cur = null; o.p.play('run', 1.3); sfx('yank'); sfx('oof', 0.8 + Math.random() * 0.5); CAM.shake = 0.6; G.slowT = Math.max(G.slowT || 0, 0.22); G.fovK = Math.max(G.fovK || 0, 0.7);   // 확 잡아채 땅에 메친다
    const c = heroCenter(_hc), dx = c.x - o.pos.x, dz = c.z - o.pos.z, d = Math.hypot(dx, dz) || 1; o.pos.x += dx / d * Math.min(3.2, d * 0.5); o.pos.z += dz / d * Math.min(3.2, d * 0.5); o.hop = 0.8; o.dragV = 0; o.coins = 0; o.coinT = 2; dust(o.pos, 14, 2, 1.4); try { if (navigator.vibrate && touch) navigator.vibrate(60); } catch (e) {}
    captives.push(o); updCapHUD(); updTargetHUD(); if (o.kind === 'main') MUSIC.mode('calm');
  }
  // 총알·다이너마이트(미리 만들어 돌려 쓴다)
  const bullets = [], bombs = [], powders = [];
  function shoot(o, c) {
    const b = bullets.find(q => q.life <= 0); if (!b) return; o.p.chest(b.pos); const tt = Math.hypot(c.x - b.pos.x, c.z - b.pos.z) / 30;
    _a.set(c.x + H.vel.x * tt * 0.5 + (Math.random() - 0.5) * 4.4, c.y + 1.2, c.z + H.vel.z * tt * 0.5 + (Math.random() - 0.5) * 4.4).sub(b.pos).normalize();
    b.vel.copy(_a).multiplyScalar(30); b.life = 2; b.m.visible = true; sfx('shot'); puff(b.pos.x, b.pos.y, b.pos.z, _a.x * 2, 0.5, _a.z * 2, 0xfff0c0, 0.9, 0.25);
  }
  // 하얀 가루(마약유통범, 10/7 사장님 "하얀 가루를 뿌려서 주인공이 맞으면 데미지"): 주머니를 던져 발밑에서 터지고, 구름 안에 있으면 총알 한 발과 같은 피해
  function powder(o, c) { const b = powders.find(q => q.state === 0); if (!b) return; o.p.chest(b.from); b.to.set(c.x + H.vel.x * 0.45, 0, c.z + H.vel.z * 0.45); b.to.y = heightAt(b.to.x, b.to.z) + 0.1; b.state = 1; b.t = 0; b.hit = false; b.m.visible = true; b.m.scale.setScalar(1); sfx('throw'); }
  function powderBurst(p, n, big) { for (let i = 0; i < n; i++) puff(p.x + (Math.random() - 0.5) * 0.6, p.y + (big ? 0.3 + Math.random() * 0.8 : -0.6 + Math.random() * 0.8), p.z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * (big ? 5 : 3), big ? 0.6 + Math.random() * 2 : 0.2 + Math.random() * 1.0, (Math.random() - 0.5) * (big ? 5 : 3), i % 4 ? 0xf6f3ea : 0xdcd8cc, big ? 1.5 + Math.random() * 1.3 : 0.9 + Math.random() * 0.6, big ? 1.0 + Math.random() * 0.5 : 0.7); }
  function powderFx() { const f = $('#powderFx'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
  function bomb(o, c) { const b = bombs.find(q => q.state === 0); if (!b) return; o.p.chest(b.from); b.to.set(c.x + H.vel.x * 0.55, 0, c.z + H.vel.z * 0.55); b.to.y = heightAt(b.to.x, b.to.z) + 0.12; b.state = 1; b.t = 0; b.m.visible = true; sfx('throw'); }
  function updShots(dt) {
    const c = heroCenter(_hc);
    bullets.forEach(b => { if (b.life <= 0) return; b.life -= dt; b.pos.addScaledVector(b.vel, dt); b.m.position.copy(b.pos); b.m.lookAt(_a.copy(b.pos).add(b.vel));
      if (Math.hypot(b.pos.x - c.x, b.pos.z - c.z) < 0.8 && Math.abs(b.pos.y - c.y - 1.2) < 1.5) { b.life = 0; stunHero(true); }
      else if (b.pos.y < heightAt(b.pos.x, b.pos.z)) { b.life = 0; sfx('ricochet'); dust(b.pos, 2, 0.4, 0.6); }
      if (b.life <= 0) b.m.visible = false; });
    bombs.forEach(b => { if (!b.state) return; b.t += dt;
      if (b.state === 1) { const e = Math.min(1, b.t / 0.9); b.m.position.lerpVectors(b.from, b.to, e); b.m.position.y += Math.sin(e * PI) * 4; b.m.rotation.x += dt * 9; if (e >= 1) { b.state = 2; b.t = 0; sfx('fuse'); } }
      else { b.m.scale.setScalar(1 + Math.sin(b.t * 30) * 0.25); if (Math.floor(b.t * 4) !== Math.floor((b.t - dt) * 4)) sfx('fuse'); puff(b.to.x, b.to.y + 0.3, b.to.z, (Math.random() - 0.5), 1.5, (Math.random() - 0.5), 0xffe08a, 0.3, 0.25);
        if (b.t > 1.0) { b.state = 0; b.m.visible = false; b.m.scale.setScalar(1); sfx('boom'); CAM.shake = 0.9;
          for (let i = 0; i < 16; i++) puff(b.to.x, b.to.y + 0.4, b.to.z, (Math.random() - 0.5) * 9, 1 + Math.random() * 5, (Math.random() - 0.5) * 9, i % 3 ? 0x6a5a4c : 0xffa040, 2.2, 0.9);
          if (Math.hypot(c.x - b.to.x, c.z - b.to.z) < 4.2) stunHero(); } } });
    powders.forEach(b => { if (!b.state) return; b.t += dt;
      if (b.state === 1) { const e = Math.min(1, b.t / 0.55); b.m.position.lerpVectors(b.from, b.to, e); b.m.position.y += Math.sin(e * PI) * 2.6; b.m.rotation.x += dt * 7; b.m.rotation.z += dt * 5;
        if (Math.random() < dt * 40) puff(b.m.position.x, b.m.position.y, b.m.position.z, (Math.random() - 0.5) * 0.6, 0.3, (Math.random() - 0.5) * 0.6, 0xf6f3ea, 0.35, 0.3);   // 날아가며 가루가 흩날린다
        if (e >= 1) { b.state = 2; b.t = 0; b.m.visible = false; sfx('land'); powderBurst(b.to, 26, true); } }
      else { if (b.t < 0.9 && Math.random() < dt * 18) puff(b.to.x + (Math.random() - 0.5) * 2.4, b.to.y + 0.2 + Math.random() * 0.6, b.to.z + (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 0.8, 0.5, (Math.random() - 0.5) * 0.8, 0xf1eee6, 1.4, 0.8);   // 구름이 1초쯤 머문다
        if (!b.hit && Math.hypot(c.x - b.to.x, c.z - b.to.z) < 2.6 && H.safe <= 0 && H.stun <= 0 && !G.deliver) { b.hit = true; stunHero('powder'); }
        if (b.t > 1.0) b.state = 0; } });
  }
  const _av = new V3();
  // 막힘 풀기(10/3 사장님 "얘 여기 갇힘": 말 탄 놈이 메사 비탈 오목한 데 대고 달리다 멈춤). 0.5초에 기대한 거리의 35%도 못 움직였으면
  // 사방 16방향을 10m 까지 1.5m 간격으로 찔러 보고, 트인 길이 길고 주인공 반대쪽인 방향으로 1.6초 동안 빠져나간다
  // 그 방향으로 몇 m 까지 트였나: 1.5m 간격으로 빠짐없이 찍는다(띄엄띄엄 찍으면 얇은 울타리를 건너뛰어 벽 너머를 트였다고 본다)
  function freeLen(x, z, sx, sz, maxL) { let free = 0; for (let Lm = 1.5; Lm <= maxL + 0.01; Lm += 1.5) { _b.set(x + sx * Lm, 0, z + sz * Lm); const px = _b.x, pz = _b.z; collide(_b, 0.9); if (Math.hypot(_b.x - px, _b.z - pz) > 0.3) break; free = Lm; } return free; }
  function pickEscape(o, body, ax, az) { let best = -1e9, by = body.yaw;
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, sx = Math.sin(a), sz = Math.cos(a), free = freeLen(body.pos.x, body.pos.z, sx, sz, 10.5);
      const sc = free + (sx * ax + sz * az) * 4; if (sc > best) { best = sc; by = a; } }
    o.escYaw = by; o.escT = 1.6; }
  function stuckCheck(o, body, sp, dt, ax, az) {
    if (!o.stP) o.stP = { x: body.pos.x, z: body.pos.z, t: 0 }; o.stP.t += dt;
    if (o.stP.t >= 0.5) { const mv = Math.hypot(body.pos.x - o.stP.x, body.pos.z - o.stP.z); if (mv < sp * 0.5 * 0.35 && !(o.escT > 0)) pickEscape(o, body, ax, az); o.stP.t = 0; o.stP.x = body.pos.x; o.stP.z = body.pos.z; }
    if (o.escT > 0) { o.escT -= dt; return o.escYaw; } return null;
  }
  // 도망 방향 고르기: 0.25초마다 사방 16방향을 16m 까지 1.5m 간격으로 찔러 보고, 주인공 반대쪽(x2)·트인 정도(x5)·지금 가던 쪽(x0.6)을 더해 고른다.
  // 예전엔 주인공 반대 방향 + 장애물 밀어내기 힘을 더했더니, 반대쪽이 메사 벽이면 벽에 대고 달리거나 그 앞에서 맴돌았다(10/3 "얘 여기 갇힘")
  function steerDir(o, body, ax, az, dt) { o.sgT = (o.sgT || 0) - dt; if (o.sgT > 0 && o.sgYaw !== undefined) return o.sgYaw; o.sgT = 0.25;
    const al = Math.hypot(ax, az) || 1; ax /= al; az /= al; let best = -1e9, by = body.yaw;
    for (let k = 0; k < 16; k++) { const a = k / 16 * PI * 2, sx = Math.sin(a), sz = Math.cos(a), free = freeLen(body.pos.x, body.pos.z, sx, sz, 16.5);
      const sc = (sx * ax + sz * az) * 1.5 + free / 16.5 * 6 + Math.cos(wrap(a - body.yaw)) * 0.6; if (sc > best) { best = sc; by = a; } }   // 10/6: 트인 정도 x5→x6, 반대쪽 x2→x1.5(막다른 모서리로 덜 몰리게)
    o.sgYaw = by; return by; }
  function flee(o, dt, dx, dz, d) {
    o.fleeT += dt; const riding = !!o.horse, fry = o.kind === 'fry';
    let sp = (riding ? o.def.horse : o.speed) * (o.fleeT > 30 ? 0.76 : o.fleeT > 15 ? 0.88 : 1); if (o.boost > 0) { o.boost -= dt; sp *= 1.25; } if (d > 48) sp *= 0.6;
    let ax = dx / d, az = dz / d; if (o.def.zig) { const z = Math.sin(o.t * 2.1) * 0.75; ax += -dz / d * z; az += dx / d * z; }
    const body = riding ? o.horse : o, esc = stuckCheck(o, body, sp, dt, dx / d, dz / d), want = esc !== null ? esc : steerDir(o, body, ax, az, dt), pinned = riding && o.pinT > 0.3, tr = (riding ? 2.4 : 5) * (esc !== null ? 1.8 : 1) * (pinned ? 2.2 : 1) * dt; body.yaw += clamp(wrap(want - body.yaw), -tr, tr);
    // 말 탄 놈: 벽에 닿으면 벽을 따라 미끄러지는 쪽으로 고개를 튼다(멈춰 박고 있지 않게) — 단 실제로 나아갈 때만(10/6 사장님 "은행강도가 절벽앞에 갇혀 움직이지 않는다": 모서리에선 두 벽이 번갈아 고개를 틀어 머리가 모서리 한가운데에 고정됐다). 제자리면 미끄러지기를 끄고 위의 조향으로 빨리 돌아선다
    if (riding) { const h = o.horse; h.speed += (sp - h.speed) * Math.min(1, dt * 2.5); const hx0 = h.pos.x, hz0 = h.pos.z, step = h.speed * dt; h.pos.x += Math.sin(h.yaw) * h.speed * dt; h.pos.z += Math.cos(h.yaw) * h.speed * dt; if (collide(h.pos, 0.85)) { const mx = h.pos.x - hx0, mz = h.pos.z - hz0, mv = Math.hypot(mx, mz); if (mv > step * 0.45) { h.yaw += wrap(Math.atan2(mx, mz) - h.yaw) * Math.min(1, dt * 6); o.pinT = 0; } else o.pinT = (o.pinT || 0) + dt; h.speed *= Math.pow(0.4, dt); } else o.pinT = 0; h.pos.y = heightAt(h.pos.x, h.pos.z); o.vel.set(Math.sin(h.yaw) * h.speed, 0, Math.cos(h.yaw) * h.speed); o.pos.copy(h.pos); o.yaw = h.yaw; }
    else { o.vel.set(Math.sin(o.yaw) * sp, 0, Math.cos(o.yaw) * sp); o.pos.x += o.vel.x * dt; o.pos.z += o.vel.z * dt; collide(o.pos, 0.35); o.pos.y = heightAt(o.pos.x, o.pos.z); o.p.play('run', sp / 5.4 * 1.6); o.dustT -= dt; if (o.dustT <= 0) { o.dustT = 0.22; puff(o.pos.x, o.pos.y + 0.12, o.pos.z, 0, 0.6, 0, 0xe2c096, 0.6, 0.5); } }
    if ((o.def.shoot || o.def.bomb || o.def.powder) && H.stun <= 0) { o.shootT -= dt; if (o.shootT <= 0 && d < (o.def.powder ? 24 : 32) && d > 5) { o.shootT = (o.def.shoot || o.def.bomb || o.def.powder) * (0.8 + Math.random() * 0.5); if (o.def.shoot) shoot(o, heroCenter(_hc)); else if (o.def.bomb) bomb(o, heroCenter(_hc)); else powder(o, heroCenter(_hc)); } }
    if (d > (fry ? 80 : 130)) { o.far += dt; if (o.far > 4) escaped(o); } else o.far = 0;
  }
  function updOutlaw(o, dt) {
    if (o.state === 'off' || o.state === 'jail') return;
    const P = o.p, c = heroCenter(_hc), dx = o.pos.x - c.x, dz = o.pos.z - c.z, d = Math.hypot(dx, dz) || 0.01; o.t += dt;
    if (o.state === 'idle') {
      const alertR = (o.kind === 'fry' ? 16 : 18 + (o.def.tier || 1) * 5) + (H.mode === 'ride' && Math.abs(horse.speed) > 6 ? 5 : 0);
      if (d < alertR && G.started && G.introT <= 0) { o.state = 'alert'; o.t = 0; sfx('alert'); ftext('!', P.chest(_a).setY(_a.y + 0.8), 'big bad'); o.yaw = Math.atan2(-dx, -dz); P.play('stand'); if (o.kind === 'main') MUSIC.mode('chase'); }
      else if (o.kind === 'fry') { o.wanderT -= dt; if (o.wanderT <= 0) { o.wanderT = 3 + Math.random() * 4; o.yaw = Math.random() * 6.28; o.walk = Math.random() < 0.7; } if (o.walk) { o.pos.x += Math.sin(o.yaw) * 1.5 * dt; o.pos.z += Math.cos(o.yaw) * 1.5 * dt; if (collide(o.pos, 0.35)) o.wanderT = 0; o.pos.y = heightAt(o.pos.x, o.pos.z); P.play('walk', 1); } else P.play('stand'); }
    } else if (o.state === 'alert') { if (o.t > 0.55) { o.state = o.myHorse ? 'mount' : 'flee'; o.t = 0; o.fleeT = 0; }
    } else if (o.state === 'mount') {
      const h = o.myHorse, mx = h.pos.x - o.pos.x, mz = h.pos.z - o.pos.z, md = Math.hypot(mx, mz);
      if (md < 1.5 || o.t > 3) { o.horse = h; o.pos.copy(h.pos); h.yaw = Math.atan2(dx, dz); h.speed = 5; o.boost = 3; o.state = 'flee'; h.rear = 0.5; P.play('stand'); }
      else { o.yaw = Math.atan2(mx, mz); o.vel.set(Math.sin(o.yaw) * 6.2, 0, Math.cos(o.yaw) * 6.2); o.pos.x += o.vel.x * dt; o.pos.z += o.vel.z * dt; collide(o.pos, 0.35); o.pos.y = heightAt(o.pos.x, o.pos.z); P.play('run', 1.85); }
    } else if (o.state === 'flee') flee(o, dt, dx, dz, d);
    else if (o.state === 'roped') { // 줄에 걸려 반대쪽으로 버둥댄다
      o.yaw += wrap(Math.atan2(dx, dz) - o.yaw) * Math.min(1, dt * 8); let nd = d + 4.5 * dt; if (o.kick > 0) { o.kick -= dt; nd -= 5 * dt; } nd = clamp(nd, 2.2, o.ropeD);
      o.pos.x = c.x + dx / d * nd; o.pos.z = c.z + dz / d * nd; o.pos.y = heightAt(o.pos.x, o.pos.z); P.play('run', 1.8); o.dustT -= dt; if (o.dustT <= 0) { o.dustT = 0.15; dust(o.pos, 1, 0.6, 0.8); }
    } else if (o.state === 'loose') looseRun(o, dt, dx, dz, d);
    else if (o.state === 'fight') fightAI(o, dt, dx, dz, d);
    else if (o.state === 'guard') {
      o.yaw += wrap(Math.atan2(-dx, -dz) - o.yaw) * Math.min(1, dt * 5);
      if (d < 36 && G.started) { const a = o.t * 0.5 + o.home.x, tx = o.home.x + Math.cos(a) * 3, tz = o.home.z + Math.sin(a) * 3; o.pos.x += clamp(tx - o.pos.x, -2 * dt, 2 * dt); o.pos.z += clamp(tz - o.pos.z, -2 * dt, 2 * dt); collide(o.pos, 0.35); o.pos.y = heightAt(o.pos.x, o.pos.z); P.play('walk', 1.2);
        if (H.stun <= 0) { o.shootT -= dt; if (o.shootT <= 0 && d < 30) { o.shootT = o.def.shoot * (0.8 + Math.random() * 0.6); shoot(o, c); } } } else P.play('stand');
    }
    if (o.state === 'down') return; // 끌려가는 몸은 updCaptives 가 놓는다
    if (o.horse) { const h = o.horse; P.root.position.set(h.seat.x, h.seat.y - H.hipH * P.root.scale.y + 0.3, h.seat.z); P.root.rotation.set(0, h.yaw, 0); } else { P.root.position.copy(o.pos); P.root.rotation.set(0, o.yaw, 0); }
    if ((o.state === 'idle' || o.state === 'guard') && Math.hypot(o.pos.x - cam.position.x, o.pos.z - cam.position.z) > 140) return;   // 멀리서 가만히 있는 놈은 뼈대 계산을 쉰다(2부엔 12명이 한꺼번에 서 있다)
    P.mixer.update(dt); if (o.horse) P.pose('ride'); else if (o.state === 'snared') P.pose('tied'); else if (P.cur === P.acts.stand) P.pose('stand');
    o.fv = (o.fv || 0) + ((o.state === 'fight' ? 1 : 0) - (o.fv || 0)) * Math.min(1, dt * 10); P.fist(o.fv);   // 격투 중엔 주먹
    if (o.state === 'fight' && G.fight && P.acts.fightidle) { if (G.fight.phase === 'guard' && !(o.hitT > 0)) P.pose('guard'); }   // 막는 동안은 두 팔을 얼굴 앞으로(믹사모 자세만으로는 막는 줄 모른다)
    else if (o.state === 'fight' && G.fight) { const F = G.fight; if (F.punchT > 0) P.pose('throw'); else if (F.phase === 'swing') P.pose('windup'); else if (F.phase === 'guard') P.pose('guard'); }
  }
  // ── 올가미가 풀린다 → 맨몸 추격(Space 연타) → 격투 ──
  // 끌고 간 거리가 LOOSE_D 를 넘으면 줄이 풀려 달아난다(현상범마다 한 번). 주인공은 누구보다 빠르지만 뒤 번호일수록 더 빨리 두드려야 따라잡는다
  const LOOSE_D = 80, CHASE_V0 = 4.6, CHASE_K = 0.62, WARN_D = [50, 60, 67, 72, 76, 79];
  const looseV = id => 5.0 + (id - 1) * 0.267;   // 1번 5.0(초당 1번쯤) … 13번 8.2(초당 6번쯤)
  function tugUI(txt) { const e = $('#tug'); e.classList.toggle('on', !!txt); document.body.classList.toggle('mash-run', txt === 'RUN'); document.body.classList.toggle('mash-fight', txt === 'FIGHT'); e.classList.toggle('fight', txt === 'FIGHT'); e.querySelector('b').textContent = txt || 'PULL'; }
  function endChase() { if (G.fight) CAM.tDist = 7.5; G.chase = null; G.fight = null; tugUI(''); }
  function snapRope(o) {
    o.state = 'loose'; o.getup = 0.25; o.boost = 2.5; o.fleeT = 0; o.lspeed = looseV(o.def.id || 1) + (G.ch === 2 ? 0.3 : 0); o.p.lie(false); o.p.cur = null; o.p.play('stand'); o.pos.y = heightAt(o.pos.x, o.pos.z);
    G.chase = o; G.fight = null; H.stam = 4; H.mash = 0; sfx('slip'); sfx('alert'); ftext('SNAP', o.p.chest(_a).setY(_a.y + 0.6), 'big bad'); CAM.shake = 0.5; MUSIC.mode('chase'); updCapHUD(); updTargetHUD();
    if (L.state !== 'idle') idleLasso();
    if (H.mode === 'ride') { dismount(); horse.rear = 0.7; CAM.tDist = 8.5; } // 줄이 튕기며 말에서 끌려 내린다
    H.hold = 1.0; H.vel.set(0, 0, 0);   // 주춤하는 사이 놈이 먼저 치고 나간다
    tugUI('RUN');
  }
  function looseRun(o, dt, dx, dz, d) {
    const P = o.p; if (o.getup > 0) { o.getup -= dt; o.yaw += wrap(Math.atan2(dx, dz) - o.yaw) * Math.min(1, dt * 9); P.play('stand'); return; }
    o.fleeT += dt; let sp = o.lspeed * (o.fleeT > 24 ? 0.78 : o.fleeT > 13 ? 0.9 : 1); if (o.boost > 0) { o.boost -= dt; sp *= 1.25; }
    const esc = stuckCheck(o, o, sp, dt, dx / d, dz / d); o.yaw += clamp(wrap((esc !== null ? esc : steerDir(o, o, dx / d, dz / d, dt)) - o.yaw), -5 * dt * (esc !== null ? 1.8 : 1), 5 * dt * (esc !== null ? 1.8 : 1));
    o.vel.set(Math.sin(o.yaw) * sp, 0, Math.cos(o.yaw) * sp); o.pos.x += o.vel.x * dt; o.pos.z += o.vel.z * dt; collide(o.pos, 0.35); o.pos.y = heightAt(o.pos.x, o.pos.z); P.play('run', sp / 5.4 * 1.6);
    o.dustT -= dt; if (o.dustT <= 0) { o.dustT = 0.22; puff(o.pos.x, o.pos.y + 0.12, o.pos.z, 0, 0.6, 0, 0xe2c096, 0.6, 0.5); }
    if (d < 1.7 && H.mode === 'foot' && H.stun <= 0) { const t = o.def.tier || 1; o.state = 'fight'; o.vel.set(0, 0, 0); G.fight = { o, max: 4 + t * 2, hp: o.fhp || 4 + t * 2, phase: 'open', t: 0, openT: 1.5 - t * 0.12, guardT: 0.8 + t * 0.1, punchT: 0 }; H.vel.set(0, 0, 0); H.hold = 0.25; sfx('bump'); CAM.shake = 0.3; dust(o.pos, 5, 1); tugUI('FIGHT'); CAM.tDist = 5.2; }
    else if (d > 75 || o.fleeT > 55) escaped(o);
  }
  function fightAI(o, dt, dx, dz, d) {
    const F = G.fight, P = o.p; if (!F) { o.state = 'loose'; return; }
    o.yaw += wrap(Math.atan2(-dx, -dz) - o.yaw) * Math.min(1, dt * 10); F.t += dt; if (F.punchT > 0) F.punchT -= dt;
    if (o.kick > 0) { o.kick -= dt; o.pos.x += dx / d * 2.6 * dt; o.pos.z += dz / d * 2.6 * dt; collide(o.pos, 0.35); }
    else if (d > 1.05 && F.phase !== 'swing') { o.pos.x -= dx / d * 2.4 * dt; o.pos.z -= dz / d * 2.4 * dt; collide(o.pos, 0.35); if (!(o.hitT > 0)) P.play('walk', 1.3); }
    else if (!(o.hitT > 0) && F.phase !== 'swing' && !(F.punchT > 0)) P.play(P.acts.fightidle && F.phase === 'guard' ? 'fightidle' : 'stand', 1.2);   // 막을 때는 주먹 올린 자세, 틈을 보일 때는 팔을 내린다
    if (o.hitT > 0) o.hitT -= dt;
    o.pos.y = heightAt(o.pos.x, o.pos.z);
    if (d > 11) { G.fight = null; o.state = 'loose'; o.fleeT = 0; tugUI('RUN'); return; }
    if (F.phase === 'open') { if (F.t > F.openT) { F.phase = 'guard'; F.t = 0; } }       // 팔을 내리고 있다: 때릴 때
    else if (F.phase === 'guard') { if (F.t > F.guardT) { F.phase = 'swing'; F.t = 0; if (P.acts.hook) P.play('hook', 1.2, 0.42); sfx('alert'); ftext('!', P.chest(_a).setY(_a.y + 0.8), 'big bad'); } }   // 팔을 올려 막는다
    else if (F.t > 0.6) { F.phase = 'open'; F.t = 0; F.punchT = 0.28; sfx('throw');      // 주먹을 뒤로 뺐다가 휘두른다: 물러나면 빗나간다
      if (o.def.powder) powderBurst(P.chest(_a).add(_b.set(-dx / d * 0.9, 0, -dz / d * 0.9)), 14, false);   // 마약유통범: 주먹 대신 가루를 뿌린다
      if (d < (o.def.powder ? 2.3 : 1.75) && H.stun <= 0) hitHero(o, dx, dz, d, !!o.def.powder); else { ftext('MISS', hero.chest(_a).setY(_a.y + 0.5)); F.t = -0.5; } }
  }
  function punch() {
    const F = G.fight, o = F.o; if (H.punchT > 0 || H.stun > 0 || H.hold > 0) return; H.punchT = 0.27;
    if (hero.acts.jab) { H.pn = !H.pn; hero.play(H.pn ? 'jab' : 'cross', H.pn ? 1.1 : 1.3, H.pn ? 0.4 : 1.0); } else H.throwT = 0.2;   // 잽은 0.54초, 크로스는 1.15초에 주먹이 다 뻗는다
    const dx = o.pos.x - hero.pos.x, dz = o.pos.z - hero.pos.z, d = Math.hypot(dx, dz) || 0.01; hero.yaw = Math.atan2(dx, dz);
    if (d > 1.05) { const st = Math.min(d - 1.0, 0.55); H.lgx = dx / d * st; H.lgz = dz / d * st; H.lgT = 0.12; }   // 한 발 들어가며 친다
    if (d > 1.7) { sfx('throw'); return; }
    if (F.phase !== 'open') { sfx('bump'); ftext('BLOCK', o.p.chest(_a).setY(_a.y + 0.4)); return; }
    F.hp--; o.fhp = F.hp; o.kick = 0.12; o.hitT = 0.34; if (o.p.acts.hitbody) o.p.play('hitbody', 1.8, 0.05); sfx('thud'); sfx('oof', 0.9 + Math.random() * 0.5); CAM.shake = 0.28; ftext('POW', o.p.chest(_a).setY(_a.y + 0.5), 'big'); o.p.chest(_a); for (let i = 0; i < 4; i++) puff(_a.x, _a.y, _a.z, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, 0xfff0c0, 0.4, 0.3);
    if (F.hp <= 0) { endChase(); o.tight = true; ftext('K.O.', o.p.chest(_a).setY(_a.y + 1), 'big'); sfx('stamp'); capture(o); }
  }
  function hitHero(o, dx, dz, d, pw) {
    H.stam--; if (hero.acts.hitbody) hero.play('hitbody', 1.7, 0.05); if (pw) { powderFx(); sfx('cough'); } else { sfx('thud'); sfx('oof'); } CAM.shake = 0.55; ftext(pw ? 'COUGH' : 'OOF', hero.chest(_a).setY(_a.y + 0.5), 'bad'); hero.pos.x -= dx / d * 0.7; hero.pos.z -= dz / d * 0.7; collide(hero.pos, 0.35); H.vel.set(0, 0, 0); H.hold = 0.55; dust(hero.pos, 4, 0.8);
    if (H.stam <= 0) { H.stun = 2.0; H.safe = 3; hero.lie(true); hero.play('stand'); H.stam = 4; G.fight = null; o.state = 'loose'; o.fleeT = 0; o.getup = 0; tugUI('RUN'); } // 쓰러지면 그 틈에 다시 달아난다
  }
  function updFightUI() {
    if (G.fight) { const F = G.fight; $('#tug .g i').style.width = clamp(F.hp / F.max * 100, 0, 100) + '%'; const ps = document.querySelectorAll('#tug .hp i'); for (let i = 0; i < ps.length; i++) ps[i].className = i < H.stam ? 'on' : ''; }
    else if (G.chase) $('#tug .g i').style.width = clamp((H.runV - CHASE_V0) / (CHASE_K * 9) * 100, 0, 100) + '%';
  }
  function updStable(dt) { if (Math.hypot(cam.position.x - TOWN.store.x, cam.position.z - TOWN.store.z) > 120) return; stable.forEach(h => h.update(dt)); }
  function updOutlawHorses(dt) { updStable(dt); ohorses.forEach(h => { if (!h.root.visible) return; if (h.fade > 0) { h.fade -= dt; h.speed += (9 - h.speed) * Math.min(1, dt * 2); avoid(h.pos.x, h.pos.z, 12, _av); h.yaw += clamp(wrap(Math.atan2(Math.sin(h.yaw) + _av.x * 2, Math.cos(h.yaw) + _av.z * 2) - h.yaw), -2 * dt, 2 * dt); h.pos.x += Math.sin(h.yaw) * h.speed * dt; h.pos.z += Math.cos(h.yaw) * h.speed * dt; collide(h.pos, 0.85); h.pos.y = heightAt(h.pos.x, h.pos.z); if (h.fade <= 0) { h.root.visible = false; h.used = false; } } else if (Math.hypot(h.pos.x - cam.position.x, h.pos.z - cam.position.z) > 140) return; h.update(dt); if (h.stepHit && h.speed > 6 && Math.hypot(h.pos.x - hero.pos.x, h.pos.z - hero.pos.z) < 40) sfx('hoof', 0.4); }); }

  // ── 잡은 놈들: 밧줄에 묶여 줄줄이 끌려온다 ──
  function updCaptives(dt) {
    const fy = G.chase ? horse.yaw : facing(), fx = Math.sin(fy), fz = Math.cos(fy); let snapO = null;
    captives.forEach((o, i) => {
      const A = _b; if (i === 0) { if (H.mode === 'ride' || G.chase) A.set(horse.pos.x - fx * 1.25, 0, horse.pos.z - fz * 1.25); else A.set(hero.pos.x, 0, hero.pos.z); } else A.copy(captives[i - 1].pos);
      const dx = o.pos.x - A.x, dz = o.pos.z - A.z, d = Math.hypot(dx, dz) || 0.001, Lr = i === 0 ? 2.9 : 2.3, ox = o.pos.x, oz = o.pos.z;
      const reel = d > Lr + 1.5;   // 멀리서 잡은 놈: 한 번에 붙이지 않고 초당 24m 로 땅을 쓸며 끌려온다(끌려오는 동안은 풀림 거리에 안 센다)
      if (d > Lr) { const nd = reel ? Math.max(Lr, d - 24 * dt) : Lr; o.pos.x = A.x + dx / d * nd; o.pos.z = A.z + dz / d * nd; }
      if (reel) { o.dustT -= dt; if (o.dustT <= 0) { o.dustT = 0.05; dust(o.pos, 2, 0.7, 1.2); } }
      const hit = collide(o.pos, 0.4); if (!reel && !o.tight && !G.chase && !G.deliver) { o.dragD += Math.hypot(o.pos.x - ox, o.pos.z - oz); if (o.dragD > LOOSE_D) snapO = o; }
      o.dragV += (Math.hypot(o.pos.x - ox, o.pos.z - oz) / dt - o.dragV) * Math.min(1, dt * 6); o.t += dt; o.bumpT -= dt; if (o.hop > 0) o.hop -= dt;
      if (hit && hit !== 'edge' && o.dragV > 3 && o.bumpT <= 0) { o.bumpT = 0.7; sfx(hit === 'cactus' ? 'cactus' : 'bump'); sfx('oof', 0.9 + Math.random() * 0.5); ftext(hit === 'cactus' ? 'OUCH' : 'OOF', _a.copy(o.pos).setY(o.pos.y + 1), 'bad'); o.hop = 0.4; }
      o.pos.y = heightAt(o.pos.x, o.pos.z) + (o.dragV > 5 ? Math.abs(Math.sin(o.t * 11)) * (reel ? 0.45 : 0.15) : 0) + (o.hop > 0 ? Math.sin(o.hop / 0.5 * PI) * 0.5 : 0);
      if (d > 0.3) o.yaw += wrap(Math.atan2(-dx, -dz) + PI - o.yaw) * Math.min(1, dt * 8);
      const P = o.p; P.root.position.copy(o.pos); P.root.rotation.set(0, o.yaw, 0); P.play(o.dragV > 1.5 ? 'run' : 'stand', 1.2); P.mixer.update(dt); P.pose('tied');
      if (o.dragV > 4) { o.dustT -= dt; if (o.dustT <= 0) { o.dustT = 0.11; dust(o.pos, 1, 0.8, 1.1); }
        o.coinT -= dt; if (!reel && o.coinT <= 0 && o.coins < 10) { o.coinT = 1.6 + Math.random() * 2.4; o.coins++; const v = 1 + Math.floor(Math.random() * 3); setMoney(G.money + v, true); sfx('coin', o.coins); ftext('+$' + v, _a.copy(o.pos).setY(o.pos.y + 0.8)); } }
      // 밧줄
      const rp = capRopes[i]; if (i === 0) { if (H.mode === 'ride' || G.chase) _a.set(horse.pos.x - fx * 0.5, horse.pos.y + (horse.pony ? 1.42 : 1.75), horse.pos.z - fz * 0.5); else hero.bones.lh ? hero.bones.lh.getWorldPosition(_a) : _a.copy(hero.pos).setY(hero.pos.y + 1); } else captives[i - 1].p.chest(_a);
      // 풀림 경고: 50m 부터 줄이 빨개지고 떨리며, 50·60·67·72·76·79m 에서 점점 크게 삐걱인다
      const wf = (!o.tight && !G.deliver) ? clamp((o.dragD - WARN_D[0]) / (LOOSE_D - WARN_D[0]), 0, 1) : 0;
      o.warnI = o.warnI || 0; while (wf > 0 && o.warnI < WARN_D.length && o.dragD >= WARN_D[o.warnI]) { sfx('strain', o.warnI); o.warnI++; if (o.warnI >= 4) CAM.shake = Math.max(CAM.shake, 0.08 * o.warnI); }
      P.chest(_b); rp.hang(_a, _b, Math.max(0.03, (Lr - d) * 0.5) + (wf > 0 ? Math.sin(o.t * 38) * 0.05 * wf : 0), heightAt); rp.tint(wf, o.t);
    });
    if (snapO) { captives.splice(captives.indexOf(snapO), 1); snapRope(snapO); }
    for (let i = captives.length; i < capRopes.length; i++) capRopes[i].hide();
  }

  // ── 감옥: 문 앞에 끌고 오면 한 놈씩 던져 넣고 현상금을 받는다 ──
  const DOOR = new V3(-41.5, 0, -9.3);
  function updDeliver(dt) {
    const D = G.deliver;
    if (!D) { if (captives.length && L.state !== 'hold' && G.started) { const c = heroCenter(_hc); if (Math.hypot(c.x - TOWN.jail.x, c.z - TOWN.jail.z) < 6.5) { G.deliver = { t: 0.2, cur: null, k: 0, from: new V3() }; if (H.mode === 'ride') horse.speed = 0; } } return; }
    D.t += dt;
    if (D.cur) { const o = D.cur; D.k += dt / 0.55; const e = Math.min(1, D.k); o.pos.lerpVectors(D.from, DOOR, e); o.pos.y = Math.sin(e * PI) * 1.4 + 0.2; o.p.root.position.copy(o.pos); o.p.root.rotation.y += dt * 9; o.p.mixer.update(dt); if (e >= 1) { jailed(o); D.cur = null; D.t = 0; } return; }
    if (D.t > 0.4) { if (captives.length) { const o = captives.shift(); o.state = 'jail'; D.cur = o; D.k = 0; D.from.copy(o.pos); sfx('throw'); updCapHUD(); } else { G.deliver = null; save(); autoTarget(); } }
  }
  function jailed(o) {
    sfx('clang'); CAM.shake = 0.3; dust(DOOR, 5, 1.2);
    const b = o.def.bounty; setMoney(G.money + b, true); ftext('$' + b.toLocaleString('en-US'), _a.copy(DOOR).setY(2.8), 'big'); setTimeout(() => sfx('buy'), 120);
    const main = o.kind === 'main', boss = main && o.def.boss; if (main) { if (!G.caught.includes(o.def.id)) G.caught.push(o.def.id); banner('CAPTURED'); setTimeout(() => sfx('stamp'), 260); if (G.target === o.def.id) G.target = 0; drawBoard(); }
    despawn(o); updTargetHUD(); if (boss) setTimeout(() => cineStart(G.ch === 1 ? 'break' : 'final'), 2600);
  }

  // ── 좀도둑: 길 가는 동안 가끔 나타난다 ──
  let fryT = 12;
  const FRY_ON = false;   // 10/3 사장님 "스테이지마다 다른 수배범이 등장하지 않게": 길의 좀도둑을 끈다(표적 한 놈만 나온다. 마지막 요새의 부하 셋은 그대로)
  function updFry(dt) {
    if (!FRY_ON) return;
    fryT -= dt; if (fryT > 0 || !G.started) return; fryT = 16 + Math.random() * 14;
    if (outlaws.filter(o => o.kind === 'fry' && o.state !== 'off').length >= 2 || outlaws.filter(o => o.state === 'off' && !o.only).length < 3) return;
    const c = heroCenter(_hc), a = facing() + (Math.random() - 0.5) * 1.6, d = 50 + Math.random() * 25, x = c.x + Math.sin(a) * d, z = c.z + Math.cos(a) * d;
    if (Math.hypot(x, z) < 95 || Math.hypot(x, z) > EDGE - 30) return; _a.set(x, 0, z); if (collide(_a, 1.5)) return;
    spawn('fry', { name: T.petty, tint: [0xe8d8c0, 0xc8d8e8, 0xd8e8c8, 0xe8c8c8][Math.random() * 4 | 0], h: 1.6 + Math.random() * 0.2, tug: 0, speed: 4.6, zig: Math.random() < 0.4, bounty: DATA.FRY_BOUNTY }, x, z);
  }

  // ── 둘레 것들: 독수리(표적이 있는 곳 위를 돈다)·회전초·모닥불 ──
  const vultures = [], weeds = [];
  function mkAmbient() {
    const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.5, -2.2, 0.25, -0.2, 0, 0, -0.5, 0, 0, 0.5, 0, 0, -0.5, 2.2, 0.25, -0.2], 3)); vg.computeVertexNormals();
    const vm = new THREE.MeshBasicMaterial({ color: 0x1c1612, side: THREE.DoubleSide, fog: false });
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(vg, vm); m.visible = false; m.frustumCulled = false; S.add(m); vultures.push(m); }
    const wg = new THREE.IcosahedronGeometry(0.5, 1), wm = new THREE.MeshBasicMaterial({ color: 0x8a6a3e, wireframe: true });
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(wg, wm); m.scale.setScalar(0.7 + Math.random() * 0.8); S.add(m); weeds.push({ m, x: (Math.random() - 0.5) * 200, z: (Math.random() - 0.5) * 200, v: 2.5 + Math.random() * 3, ph: Math.random() * 6 }); }
  }
  function updAmbient(dt) {
    const tg = curTarget(), show = tg && tg.state !== 'down';
    vultures.forEach((m, i) => { m.visible = !!show; if (!show) return; const s = SITES[tg.def.site], a = G.time * 0.35 + i * 2.1, r = 13 + i * 3; m.position.set(s.x + Math.cos(a) * r, heightAt(s.x, s.z) + 30 + i * 4, s.z + Math.sin(a) * r); m.rotation.set(0, -a, 0.25); m.scale.y = 1 + Math.sin(G.time * 3 + i) * 0.6; });
    const c = heroCenter(_hc);
    weeds.forEach(w => { w.x += w.v * dt; w.z += w.v * 0.3 * dt; w.ph += dt * w.v * 2; if (w.x - c.x > 110) { w.x = c.x - 110; w.z = c.z + (Math.random() - 0.5) * 200; } if (Math.abs(w.z - c.z) > 120) w.z = c.z + (Math.random() - 0.5) * 200;
      w.m.position.set(w.x, heightAt(w.x, w.z) + 0.5 * w.m.scale.x + Math.abs(Math.sin(w.ph * 0.5)) * 0.5, w.z); w.m.rotation.z = -w.ph; });
    if (G.ch === 2 && breach.visible && Math.random() < dt * 2.2 && Math.hypot(cam.position.x - BREACH.x, cam.position.z - BREACH.z) < 160) puff(BREACH.x + (Math.random() - 0.5) * 1.2, 1.6 + Math.random(), BREACH.z + 0.3, (Math.random() - 0.5) * 0.4, 0.9, 0.3, 0x4a4440, 1.5, 2.4);   // 2부: 터진 감옥 벽에서 연기가 가늘게
    WORLD.fires.forEach(f => { f.m.scale.set(f.s * (0.9 + Math.sin(G.time * 13 + f.ph) * 0.14), f.s * (1 + Math.sin(G.time * 17 + f.ph * 2) * 0.24), f.s * (0.9 + Math.cos(G.time * 11 + f.ph) * 0.14)); });
  }

  // ── HUD ──
  function updCapHUD() {}   // 10/3 사장님 "올가미 표시는 왜 있어? → 빼자": 묶은 수 칸(#sCap)을 뺐다. 묶인 놈은 말 뒤에 보이고, 셋이 차면 던질 때 FULL 이 뜬다
  const mainCaptive = () => captives.find(o => o.kind === 'main');
  let HORSE_IMG = '';   // 위쪽 목적지 칸의 말 머리(아래에서 그린다)
  function fitTargetName() { const n = $('#sTarget small'); n.style.fontSize = ''; const f0 = parseFloat(getComputedStyle(n).fontSize); let f = f0; while (n.scrollWidth > n.clientWidth + 1 && f > f0 * 0.5) { f -= 0.5; n.style.fontSize = f + 'px'; } }   // 넘칠 때만 글자를 줄인다(배치는 그대로)
  addEventListener('resize', () => setTimeout(fitTargetName, 50));
  function updTargetHUD() {
    const e = $('#sTarget'), img = e.querySelector('img'), nm = e.querySelector('small'); e.classList.add('on');
    if (captives.length) { img.style.display = 'none'; nm.textContent = 'JAIL'; G.dest = 'jail'; }
    else if (G.target) { const d = OUTLAWS[G.target - 1]; img.style.display = ''; img.src = d.img || ''; nm.textContent = d.name; G.dest = 'target'; }
    else { img.style.display = 'none'; nm.textContent = 'WANTED'; G.dest = 'board'; }
    fitTargetName();
  }
  // 목적지 표식: 은신처 위에서 까딱이는 노란 화살(건물에 가려도 보인다). 마을(게시판·감옥·마구간)엔 띄우지 않는다 — 건물 생김새로 안다(10/3 "ui를 말이되게 구성하면 맨날 노란테두리로 얼버무릴일도 없지")
  const mark = new THREE.Group();
  { const cone = new THREE.ConeGeometry(0.75, 1.15, 4).rotateX(PI).translate(0, 0.575, 0), stem = new THREE.BoxGeometry(0.5, 0.95, 0.5).translate(0, 1.6, 0);
    const my = new THREE.MeshBasicMaterial({ color: 0xffd23c, depthTest: false, transparent: true, fog: false }), mk = new THREE.MeshBasicMaterial({ color: 0x1a0f06, depthTest: false, transparent: true, fog: false, side: THREE.BackSide });
    [cone, stem].forEach(g => { const o = new THREE.Mesh(g, mk); o.scale.set(1.22, 1.08, 1.22); o.renderOrder = 998; const y = new THREE.Mesh(g, my); y.renderOrder = 999; mark.add(o, y); });
    mark.visible = false; mark.traverse(o => o.frustumCulled = false); S.add(mark); }
  // 상단 목적지 칸의 말 머리(말이 죽으면 마구간으로 갈 때). 문짝에 그렸던 그림(10/3)을 칸 크기로 잘라 쓴다
  (() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 448;
    const c = cv.getContext('2d');
    const head = () => { c.beginPath(); c.moveTo(150, 24); c.lineTo(168, 76); c.bezierCurveTo(202, 92, 230, 150, 236, 230); c.bezierCurveTo(242, 320, 240, 390, 236, 444);   // 뒤 귀 → 갈기 → 굵은 목 뒤
      c.lineTo(92, 444); c.bezierCurveTo(100, 370, 118, 300, 150, 250); c.bezierCurveTo(140, 236, 132, 230, 124, 228);   // 목 앞 → 볼
      c.bezierCurveTo(104, 240, 76, 264, 52, 264); c.bezierCurveTo(28, 264, 16, 238, 24, 214);   // 아래턱 → 주둥이
      c.bezierCurveTo(40, 170, 82, 100, 114, 72); c.lineTo(120, 28); c.lineTo(138, 64); c.closePath(); };   // 콧등 → 이마 → 앞 귀
    c.save();   // 말 머리는 왼쪽을 본다
    head(); c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = '#1a0f08'; c.stroke(); c.fillStyle = '#efe2c2'; c.fill();
    c.strokeStyle = '#8c6b45'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i < 11; i++) { const y = 96 + i * 32, m = Math.min(i, 4); c.moveTo(184 + m * 5, y); c.quadraticCurveTo(200 + m * 3, y + 12, 210 + m * 2, y + 28); } c.moveTo(148, 250); c.bezierCurveTo(166, 226, 162, 196, 136, 190); c.moveTo(30, 250); c.lineTo(58, 248); c.stroke();   // 갈기 붓 자국, 볼 선, 입
    c.fillStyle = '#1a0f08'; c.beginPath(); c.ellipse(118, 122, 9, 6, -0.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(36, 228, 6, 5, 0.4, 0, 7); c.fill();   // 눈, 콧구멍
    c.restore();
    c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.4})`; c.fillRect(Math.random() * 256, Math.random() * 448, 2 + Math.random() * 10, 1 + Math.random() * 1.5); }   // 칠이 벗겨진 자국(나뭇결 방향)
    c.globalCompositeOperation = 'source-over'; const h = document.createElement('canvas'); h.width = h.height = 256; h.getContext('2d').drawImage(cv, 0, 0, 256, 256, 0, 0, 256, 256); HORSE_IMG = h.toDataURL();
  })();
  function updHUD() {
    const c = heroCenter(_hc); let tx, tz;
    if (G.dest === 'jail') { tx = TOWN.jail.x; tz = TOWN.jail.z; } else if (G.dest === 'target') { const o = curTarget(); if (o && o.state !== 'idle') { tx = o.pos.x; tz = o.pos.z; } else { const s = SITES[OUTLAWS[G.target - 1].site]; tx = s.x; tz = s.z; } } else if (G.dest === 'shop') { tx = TOWN.store.x; tz = TOWN.store.z; } else { tx = TOWN.board.x; tz = TOWN.board.z; }
    if (G.chase) { tx = G.chase.pos.x; tz = G.chase.pos.z; }
    // 상단 화살은 "가는 방향" 기준: 말 탔을 땐 말이 향한 쪽(위 키로 가는 쪽), 걸을 땐 화면 기준(10/5 포럼 플레이어 "화살표가 화면 기준이고 A/D 가 카메라를 돌려서 반대로 달렸다"). 가장자리 화살은 화면 기준 그대로
    const e = $('#sTarget'), d = Math.hypot(tx - c.x, tz - c.z), ang = Math.atan2(tx - c.x, tz - c.z), rel = wrap(ang - (H.mode === 'ride' ? horse.yaw : CAM.yaw + PI)), relCam = wrap(ang - (CAM.yaw + PI));
    e.querySelector('i').style.transform = `rotate(${(-rel * 180 / PI).toFixed(0)}deg)`; e.querySelector('b').textContent = Math.round(d) + 'm';
    const town = G.dest !== 'target', chasing = !town && curTarget() && curTarget().state !== 'idle', base = !G.ui && !G.deliver && !G.ended && !G.cine && !G.fight && d > 1.6, show = base && (G.chase || !chasing);
    mark.visible = show && !G.chase && !town;
    if (mark.visible) { const gy = heightAt(tx, tz), k = clamp(Math.hypot(tx - cam.position.x, tz - cam.position.z) / 18, 1, 5);
      mark.position.set(tx, gy + 4.4 + k * 0.2 + Math.abs(Math.sin(G.time * 3.2)) * 0.28 * k, tz); mark.scale.setScalar(k); mark.rotation.y = G.time * 1.6; }
    // 표식이 화면 밖(옆이나 등 뒤)이면 화면 가장자리에 큰 화살로 그쪽을 가리킨다
    const way = $('#way'); let off = false;
    if (base) { _a.set(tx, heightAt(tx, tz) + 2, tz).project(cam); off = _a.z > 1 || Math.abs(_a.x) > 0.9 || Math.abs(_a.y) > 0.86; }
    const uturn = off && Math.abs(rel) > 2.35; off = off && (show || uturn);   // 쫓는 중엔 가장자리 화살을 안 띄우지만(놈이 보이니까), 놈이 등 뒤로 돌아가면 유턴 화살은 띄운다   // 목적지가 거의 정반대(135도 넘게)면 아래 가운데에 돌아서라는 유턴 화살(10/5 포럼 "화살표가 내 뒤에 있어 한참 반대로 달렸다")
    way.classList.toggle('on', off); way.classList.toggle('u', uturn);
    if (uturn) { const W = innerWidth, Hh = innerHeight; way.style.transform = `translate(${(W / 2).toFixed(0)}px, ${(Hh * 0.8).toFixed(0)}px) scale(${rel < 0 ? -1 : 1}, 1)`; }
    else if (off) { const th = -relCam, W = innerWidth, Hh = innerHeight; way.style.transform = `translate(${(W / 2 + Math.sin(th) * W * 0.36).toFixed(0)}px, ${(Hh * 0.52 - Math.cos(th) * Hh * 0.3).toFixed(0)}px) rotate(${(th * 180 / PI).toFixed(0)}deg)`; }
  }

  // ── 게시판(현상수배 전단 고르기) ──
  // 전단은 한 장씩만 열린다: 아직 안 잡은 놈 중 번호가 제일 앞인 한 명(10/4 사장님 "현상수배범카드오픈은 한번에 한명씩만 공개해"). 예전엔 급별로 2·5·8·12명에 묶음으로 열렸다(TIER_NEED, 지금은 안 씀)
  // 1부: 아직 안 잡은 놈 중 번호가 제일 앞인 한 명만 열린다(10/4). 2부: 다 풀려 있다(10/7 사장님) — 두목만 나머지 12명을 넣은 뒤에 열린다
  const tierOpen = (t, id) => { if (G.ch === 2) return id !== 13 || G.caught.length >= 12; const d = OUTLAWS.find(q => !G.caught.includes(q.id)); return !!d && d.id === id; };
  function openBoard() {
    G.ui = 'board'; G.seenBoard = true; sfx('paper'); const box = $('#posters'); box.innerHTML = '';
    OUTLAWS.forEach(d => {
      const done = G.caught.includes(d.id), lock = !done && !tierOpen(d.tier, d.id), hide = lock && G.ch !== 2, b = document.createElement('button');   // 2부 두목은 잠겨도 얼굴·이름은 보인다(1부에서 봤으니까), 잿빛만
      b.className = 'poster' + (done ? ' done' : '') + (lock ? ' lock' : '') + (hide ? ' hide' : '') + (G.target === d.id ? ' sel' : '');
      b.innerHTML = `<div class="w${G.ch === 2 && !done ? ' esc' : ''}">${G.ch === 2 && !done ? 'ESCAPED' : 'WANTED'}</div><img src="${d.img || ''}" alt=""><div class="n">${hide ? '?' : d.name}</div>${d.crime ? `<div class="c">${hide ? '?' : d.crime}</div>` : ''}<div class="p">$${d.bounty.toLocaleString('en-US')}</div>`;
      b.onclick = () => { if (done) return; if (lock) { sfx('no'); return; } sfx('paper'); if (G.target !== d.id && !captives.some(o => o.kind === 'main' && o.def.id === d.id)) setTarget(d.id); closeUI(); };
      box.appendChild(b);
    });
    $('#boardUI').classList.add('show');
    const fitN = () => box.querySelectorAll('.n, .w, .p').forEach(n => { n.style.fontSize = ''; const w = n.clientWidth, sw = n.scrollWidth; if (w && sw > w) n.style.fontSize = (parseFloat(getComputedStyle(n).fontSize) * w / sw * 0.97).toFixed(1) + 'px'; });   // 긴 죄목(영문 Savings Club Ring 등)·폰에서 전단 폭보다 넓던 WANTED·$10,000 은 글자를 줄인다. 창이 막 뜰 때는 폭이 0일 수 있어 조금 뒤에 한 번 더
    fitN(); setTimeout(fitN, 60); setTimeout(fitN, 300);
    const sel = box.querySelector('.poster:not(.done):not(.lock)'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
  const ICON = {
    rope: '<svg viewBox="0 0 64 64" fill="none" stroke="#3a2410" stroke-width="4" stroke-linecap="round"><ellipse cx="32" cy="30" rx="20" ry="14"/><ellipse cx="32" cy="30" rx="13" ry="8"/><ellipse cx="32" cy="30" rx="6" ry="3"/><path d="M50 36c6 6-2 12 4 20"/></svg>',
    horse: '<svg viewBox="0 0 64 64" fill="none" stroke="#3a2410" stroke-width="7" stroke-linecap="round"><path d="M18 54C8 40 10 12 32 12s24 28 14 42"/><g stroke-width="3"><path d="M16 40h.1M17 28h.1M24 19h.1M40 19h.1M47 28h.1M48 40h.1"/></g></svg>',
    loop: '<svg viewBox="0 0 64 64" fill="none" stroke="#3a2410" stroke-width="4" stroke-linecap="round"><ellipse cx="34" cy="24" rx="22" ry="14"/><path d="M17 33C10 42 22 46 14 58"/><circle cx="17" cy="33" r="3" fill="#3a2410"/></svg>',
    gloves: '<svg viewBox="0 0 64 64" fill="#d9b06a" stroke="#3a2410" stroke-width="4" stroke-linejoin="round"><path d="M18 58V34l-6-10c-2-5 4-8 7-3l5 8V12c0-5 7-5 7 0v12-16c0-5 7-5 7 0v16-12c0-5 7-5 7 0v14-8c0-5 7-5 7 0v22c0 8-4 12-6 16z"/><path d="M18 50h29" fill="none"/></svg>'
  };
  function openShop() {
    $('#shopUI h3').textContent = T.stable;
    G.ui = 'shop'; sfx('click'); const box = $('#items'); box.innerHTML = '';
    // 10/3 사장님 "말 속도 업글 없애, 돈만 나가고 차이가 없어"(한 단계 +1m/s 라 체감이 없었다): 마구간은 말이 죽었을 때 새 말($300)만 판다. 밧줄·올가미·장갑도 안 판다. 옛 저장에서 산 단계는 그대로 쓴다
    { const price = DATA.HORSE_PRICE, b = document.createElement('button'); b.className = 'item' + (G.money < price ? ' poor' : '');
      b.innerHTML = ICON.horse + '<div class="n">' + T.newHorse + '</div><div class="lv"></div><div class="p">$' + price + '</div>';
      b.onclick = () => { if (G.money < price) { sfx('no'); return; } setMoney(G.money - price, true); buyHorse(); sfx('buy'); save(); closeUI(); }; box.appendChild(b); }
    $('#shopUI').classList.add('show');
  }
  function closeUI() { if (!G.ui) return; G.ui = null; $('#boardUI').classList.remove('show'); $('#shopUI').classList.remove('show'); sfx('click'); }
  // 상황 단추(E): 게시판 · 상점 · 타기 · 내리기
  let ctxFn = null, ctxT = 0, ctxAt = null;   // ctxAt: 단추를 띄울 세계 자리(시설 단추만). 없으면 오른쪽 아래 구석
  function updCtx(dt) {
    ctxT -= dt; if (ctxT > 0) return; ctxT = 0.12;
    const c = heroCenter(_hc); let label = '', fn = null; ctxAt = null;
    if (G.started && !G.ui && !G.deliver && !G.cine && L.state === 'idle' && H.stun <= 0) {
      if ((Math.hypot(c.x - TOWN.board.x, c.z - TOWN.board.z) < 4.6 || Math.hypot(c.x - TOWN.board.x, c.z + 6.2) < 3.4)) { label = T.board; fn = H.mode === 'ride' && !G.seenBoard ? boardOnFoot : openBoard; ctxAt = WCTX_BOARD; } // 말에 탄 채로도 단추는 보인다(10/4). 처음 한 번은 누르면 말에서 내려서 본다(10/2 규칙 그대로)
      else if (H.mode === 'foot' && !G.chase && !G.horseDead && Math.hypot(hero.pos.x - horse.pos.x, hero.pos.z - horse.pos.z) < 3.4) { label = T.ride; fn = mount; }   // 말 바로 옆이면 타기가 먼저(10/3 "말을 사고 E 누르면 마구간 창이 뜬다")
      else if (G.horseDead) { label = T.store + ' $' + DATA.HORSE_PRICE; fn = openShop; ctxAt = Math.hypot(c.x - TOWN.store.x, c.z - TOWN.store.z) < 4.6 ? WCTX_STABLE : null; }   // 말이 죽으면 그 자리에서 바로 산다(10/6 사장님 "말을 잃고나면 그자리에서 다시 살수있게"). 마구간 앞이면 울타리 위에, 아니면 구석 단추. 말이 살아 있으면 살 게 없다
      else if (H.mode === 'ride') { label = T.off; fn = dismount; }
      else if (!G.chase && !G.horseDead && Math.hypot(hero.pos.x - horse.pos.x, hero.pos.z - horse.pos.z) < 3.4) { label = T.ride; fn = mount; }
    }
    ctxFn = fn; if (fn) { $('#ctxBtn').textContent = label; $('#wctxBtn').textContent = label; }
    $('#callBtn').classList.toggle('on', G.started && H.mode === 'foot' && !horse.calling && !G.horseDead && Math.hypot(hero.pos.x - horse.pos.x, hero.pos.z - horse.pos.z) > 8);
  }

  // 시설 단추를 그 자리 위에 띄운다(매 프레임). 화면 밖이거나 등 뒤면 구석 단추로
  const WCTX_BOARD = new V3(-30, 3.45, -6.2), WCTX_STABLE = new V3(13, 2.0, 7.4);   // 게시판 판자 위, 마구간 울타리 앞 물통 위
  function updWctx() {
    const w = $('#wctx'), corner = $('#ctx'); let inWorld = false;
    if (ctxFn && ctxAt && !G.ui && !G.ended && !G.cine) { _a.set(ctxAt.x, heightAt(ctxAt.x, ctxAt.z) + ctxAt.y, ctxAt.z).project(cam);
      if (_a.z < 1 && Math.abs(_a.x) < 1.02 && Math.abs(_a.y) < 1.02) { inWorld = true; const W = innerWidth, Hh = innerHeight, tb = $('#topbar').getBoundingClientRect().bottom, bh = w.firstElementChild.offsetHeight || 56, x = clamp((_a.x * 0.5 + 0.5) * W, 90, W - 90), y = clamp((-_a.y * 0.5 + 0.5) * Hh, tb + bh + 24, Hh * 0.7);   // 상단 칸 아래로만
        w.style.transform = 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px) translate(-50%,-100%) translateY(-16px)'; } }
    w.classList.toggle('on', inWorld); corner.classList.toggle('on', !!ctxFn && !inWorld && !G.ui);
  }
  // ── 전단 얼굴 사진 · 마을 게시판 그림 ──
  function makePortraits(P, list) { // 시험 도구가 부른다(tools/testkit.js __wanted): 전단 사진을 assets/wanted 에 굽는다
    const ps = new THREE.Scene(); ps.background = new THREE.Color(0xcdb98a); ps.add(new THREE.HemisphereLight(0xffffff, 0x8a7a60, 1.7)); const dl = new THREE.DirectionalLight(0xffffff, 1.9); dl.position.set(1.5, 2, 2.5); ps.add(dl);
    const W = R.domElement.width, Hh = R.domElement.height, s = Math.min(W, Hh), pc = new THREE.PerspectiveCamera(22, W / Hh, 0.1, 20);
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), hp = new V3();
    ps.add(P.root); P.root.visible = true; P.root.position.set(0, 0, 0); P.root.rotation.set(0, 0, 0); P.root.scale.setScalar(1); P.lie(false); P.play('stand'); P.mixer.update(0.01); P.root.updateMatrixWorld(true); P.pose('stand');
    list.forEach(d => { P.mat.color.set(d.tint || 0xffffff); if (P.mask) { P.mask.material.color.set(d.mask || 0x8a1c14); P.mask.visible = !d.noMask; } P.root.updateMatrixWorld(true); if (P.bones.head) P.bones.head.getWorldPosition(hp); else hp.set(0, 1.6, 0); hp.y += 0.1; pc.position.set(hp.x + 0.28, hp.y - 0.2, hp.z + 1.7); pc.lookAt(hp); R.render(ps, pc); g.drawImage(R.domElement, (W - s) / 2, (Hh - s) / 2, s, s, 0, 0, 128, 128); d.img = cv.toDataURL('image/jpeg', 0.86); });
    S.add(P.root); P.root.visible = false;
  }
  const boardImgs = {};
  function drawBoard() { // 게시판 창(전단 고르기)과 같은 그림: 얼굴, 죄목, 현상금. 잠긴 것은 잿빛에 물음표
    const B = WORLD.board, c = B.canvas.getContext('2d'), W = B.canvas.width, Hh = B.canvas.height; c.clearRect(0, 0, W, Hh);
    OUTLAWS.forEach((d, i) => {
      const cw = W / 5, ch = Hh / 3, w = cw - 22, h = ch - 16, x = (i % 5) * cw + 11, y = Math.floor(i / 5) * ch + 8, done = G.caught.includes(d.id), lock = !done && !tierOpen(d.tier, d.id), hide = lock && G.ch !== 2, is = h * 0.42;
      c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((i % 2 ? 1 : -1) * 0.022);
      c.fillStyle = 'rgba(30,14,4,.45)'; c.fillRect(-w / 2 + 3, -h / 2 + 5, w, h); c.fillStyle = lock ? '#9a9486' : '#f0dfb4'; c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = '#8a8a8a'; c.beginPath(); c.arc(0, -h / 2 + 7, 4, 0, 7); c.fill();
      const esc = G.ch === 2 && !done; c.fillStyle = lock ? '#3a3632' : esc ? '#a8281a' : '#3a2410'; c.textAlign = 'center'; c.font = Math.round(h * (esc ? 0.15 : 0.17)) + 'px BHTitle, Georgia, serif'; c.fillText(esc ? 'ESCAPED' : 'WANTED', 0, -h / 2 + h * 0.2);
      c.fillStyle = lock ? '#4a4642' : '#cdb98a'; c.fillRect(-is / 2, -h / 2 + h * 0.24, is, is); c.lineWidth = 3; c.strokeStyle = lock ? '#3a3632' : '#3a2410'; c.strokeRect(-is / 2, -h / 2 + h * 0.24, is, is);
      const im = boardImgs[d.id]; if (!hide && im && im.complete && im.naturalWidth) { c.filter = done ? 'sepia(1) brightness(.8)' : lock ? 'sepia(.6) brightness(.55)' : 'sepia(.75) contrast(1.08)'; c.drawImage(im, -is / 2 + 2, -h / 2 + h * 0.24 + 2, is - 4, is - 4); c.filter = 'none'; }
      c.fillStyle = lock ? '#3a3632' : '#3a2410'; const nm = hide ? '?' : d.name; let fs = Math.round(h * 0.105); c.font = '800 ' + fs + 'px Ria, sans-serif'; const tw = c.measureText(nm).width; if (tw > w - 10) { fs = Math.floor(fs * (w - 10) / tw); c.font = '800 ' + fs + 'px Ria, sans-serif'; } c.fillText(nm, 0, -h / 2 + h * 0.79);
      c.fillStyle = lock ? '#5a2a22' : '#a8281a'; c.font = Math.round(h * 0.17) + 'px BHTitle, Georgia, serif'; c.fillText('$' + d.bounty.toLocaleString('en-US'), 0, h / 2 - h * 0.05);
      if (done) { c.rotate(-0.28); c.fillStyle = 'rgba(243,229,191,.5)'; c.fillRect(-w * 0.44, -h * 0.1, w * 0.88, h * 0.2); c.strokeStyle = '#a8281a'; c.lineWidth = 5; c.strokeRect(-w * 0.44, -h * 0.1, w * 0.88, h * 0.2); c.fillStyle = '#a8281a'; c.font = Math.round(h * 0.14) + 'px BHTitle, Georgia, serif'; c.fillText('CAPTURED', 0, h * 0.05); }
      c.restore();
    });
    B.tex.needsUpdate = true;
  }

  // ── 1부 엔딩 장면 → 감옥 폭파(탈옥) → 2부, 2부 두목을 넣으면 진짜 엔딩(10/4 사장님 "엔딩연출 다음 탈옥으로 이어지게하자") ──
  // 2부: 13명이 다른 은신처로 흩어지고, 현상금 두 배, 조금씩 세진다(걷는 놈 +12% · 말 탄 놈 +4% · 줄다리기 +1(4까지) · 1~3번 지그재그 · 맨손이던 놈은 총)
  const CH2_SITE = { 1: 'wagon', 2: 'flats', 3: 'camp1', 4: 'hay', 5: 'camp3', 6: 'camp2', 7: 'mine', 8: 'grave', 9: 'canyon', 10: 'ghost', 11: 'tower', 12: 'gulch', 13: 'fort' };
  function applyCh2() { if (OUTLAWS.ch2) return; OUTLAWS.ch2 = 1;
    OUTLAWS.forEach(d => { d.bounty *= 2; d.site = CH2_SITE[d.id]; if (d.horse) d.horse = +(d.horse * 1.04).toFixed(2); else d.speed = +(d.speed * 1.12).toFixed(2); d.tug = Math.min(4, (d.tug || 0) + 1); if (d.id <= 3) d.zig = 1; else if (!d.shoot && !d.bomb && !d.powder) d.shoot = 3.4; });
    while (ohorses.length < 9) { const h = ACT.makeHorse(0x6a4a34); h.root.visible = false; h.used = false; h.fade = 0; ohorses.push(h); } }   // 2부는 말 탄 놈 7명이 한꺼번에 나와 있으니 말을 미리 더 만든다
  // 감옥 왼쪽 벽에 뚫린 구멍 + 앞에 흩어진 돌무더기. 2부 내내 남아 있다
  const BREACH = new V3(-44.3, 0, -9.5), breach = new THREE.Group(), rubble = [], smokes = []; let fireball = null;
  function mkBreach() {
    const jag = (w, h, n, seed) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); for (let i = 0; i <= n; i++) { const a = PI - i / n * PI, r = 1 + Math.sin(i * 2.7 + seed) * 0.16 + Math.sin(i * 5.3 + seed * 2) * 0.08; sh.lineTo(Math.cos(a) * w / 2 * r, Math.sin(a) * h * r); } sh.lineTo(w / 2, 0); return new THREE.ShapeGeometry(sh); };
    const rim = new THREE.Mesh(jag(2.7, 2.75, 15, 1.3), new THREE.MeshStandardMaterial({ color: 0x6f665e, roughness: 1 })), hole = new THREE.Mesh(jag(2.1, 2.3, 13, 4.1), new THREE.MeshBasicMaterial({ color: 0x0c0907 }));
    rim.position.set(BREACH.x, 0, BREACH.z + 0.03); hole.position.set(BREACH.x, 0, BREACH.z + 0.05); breach.add(rim, hole);
    const rg = new THREE.BoxGeometry(1, 1, 1), rm = new THREE.MeshStandardMaterial({ color: 0x9c9084, roughness: 1 });
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(rg, rm), s = 0.25 + Math.random() * 0.45; m.scale.set(s * (1 + Math.random() * 0.6), s * 0.7, s); m.castShadow = true;
      const rest = new V3(BREACH.x + (Math.random() - 0.5) * 4.2, s * 0.32, BREACH.z + 0.6 + Math.random() * 3.2), rot = new THREE.Euler(Math.random() * 0.6, Math.random() * 6, Math.random() * 0.6);
      m.position.copy(rest); m.rotation.copy(rot); breach.add(m); rubble.push({ m, rest, rot, h: 1.4 + Math.random() * 2.4, spin: (Math.random() - 0.5) * 18 }); }
    breach.visible = false; S.add(breach);
    // 폭파: 불덩이 하나 + 부드러운 연기 뭉치 열넷(가장자리가 흐린 판. 점 먼지로는 안 보이고 공 모양은 도형 덩어리로 보인다)
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    for (let i = 0; i < 9; i++) { const x = 64 + (Math.random() - 0.5) * 34, y = 64 + (Math.random() - 0.5) * 34, r = 26 + Math.random() * 22, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
    const st = new THREE.CanvasTexture(cv);
    for (let i = 0; i < 14; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, color: 0x6a5e52, transparent: true, opacity: 0, depthWrite: false, rotation: Math.random() * 6 })); m.visible = false; S.add(m); smokes.push({ m, t: 9, v: new V3(), s: 1 }); }
    fireball = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, color: 0xffb050, transparent: true, opacity: 0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); fireball.visible = false; fireball.t = 9; S.add(fireball);
  }
  function breachShow(on) { breach.visible = !!on; rubble.forEach(r => { r.m.position.copy(r.rest); r.m.rotation.copy(r.rot); }); }
  // 장면 위 전단 13장: CAPTURED 도장 → (탈옥) ESCAPED 도장 + 현상금 두 배 → (2부 끝) 다시 CAPTURED
  function cinePosters(mode) {
    const box = $('#cineP'); box.innerHTML = '';
    OUTLAWS.forEach(d => { const e = document.createElement('div'); e.className = 'cp'; e.innerHTML = `<div class="w">${mode === 'final' ? 'ESCAPED' : 'WANTED'}</div><img src="${d.img || ''}" alt=""><div class="n">${d.name}</div><div class="p">$${(mode === 'break' ? G.cine.b1[d.id] : d.bounty).toLocaleString('en-US')}</div>`; if (mode === 'final') e.classList.add('esc0'); box.appendChild(e); });
    $('#cineSum').textContent = ''; $('#cine').classList.add('show');
    box.querySelectorAll('.n').forEach(n => { if (n.scrollWidth > n.clientWidth) n.style.fontSize = (parseFloat(getComputedStyle(n).fontSize) * n.clientWidth / n.scrollWidth).toFixed(1) + 'px'; });
  }
  function cineStamp(i, kind, quiet) { const e = $('#cineP').children[i]; if (!e) return; const st = document.createElement('i'); st.className = 'st ' + kind + (quiet ? ' still' : ''); st.textContent = kind === 'cap' ? 'CAPTURED' : 'ESCAPED'; e.appendChild(st);
    if (kind === 'esc') { e.querySelector('.p').textContent = '$' + OUTLAWS[i].bounty.toLocaleString('en-US'); e.classList.add('hot'); sfx('shot'); } else if (!quiet) sfx('stamp'); }
  const sumOf = () => OUTLAWS.reduce((a, d) => a + d.bounty, 0);
  const CP = new V3();   // 장면 카메라가 보는 곳
  let followSave = null;
  function shot(tx, ty, tz, yaw, pitch, dist, snap) { CP.set(tx, ty, tz); CAM.follow = () => CP; CAM.chase = null; CAM.tYaw = yaw; CAM.tPitch = pitch; CAM.tDist = dist; if (snap) CAM.snap(); }
  function rideShot(yaw, pitch, dist, snap) { CAM.follow = () => followPt.set(horse.pos.x, horse.pos.y + 1.9, horse.pos.z); CAM.chase = null; CAM.tYaw = yaw; CAM.tPitch = pitch; CAM.tDist = dist; if (snap) CAM.snap(); }
  // 헬라를 감옥 앞에 말 탄 채로 세운다(말이 죽었으면 살려서)
  function cinePlace() {
    if (G.chase) endChase(); if (L.state !== 'idle') idleLasso(); closeUI(); captives.forEach(o => despawn(o)); captives.length = 0; capRopes.forEach(r => r.hide()); setTarget(0);
    outlaws.forEach(o => { if (o.state !== 'off') despawn(o); }); bullets.forEach(b => { b.life = 0; b.m.visible = false; }); bombs.forEach(b => { b.state = 0; b.m.visible = false; }); powders.forEach(b => { b.state = 0; b.m.visible = false; });
    G.horseDead = false; G.horseHp = 3; G.hp = 3; horse.dead = false; horse.deadT = 0; horse.root.rotation.z = 0; horse.root.visible = true; horse.calling = false;
    H.mode = 'ride'; H.stun = 0; H.hold = 0; H.safe = 0; H.vel.set(0, 0, 0); hero.lie(false); hero.play('stand');
    horse.pos.set(-37, 0, 0.2); horse.pos.y = heightAt(horse.pos.x, horse.pos.z); horse.yaw = PI / 2; horse.speed = 0; horse.update(0.016); updHpHUD(); updTargetHUD();
  }
  // 감옥에서 뛰쳐나오는 놈들: 남는 사람 모델(이번에 읽어 둔 현상범 먼저, 모자라면 복면 쓴 카우보이)
  let runners = [];
  // 탈옥 장면: 13명이 한 명씩 제 얼굴로 뛰쳐나온다(10/7 "탈옥장면에 은행강도만 10명나옴" — 전엔 아직 안 불러온 모델 자리를 은행강도 복제가 채웠다).
  // 모델은 장면 시작 때 하나씩 불러 두고(preloadAll), 폭파 때까지 못 받은 놈은 복제로 채우지 않고 뺀다.
  function preloadAll() { return OUTLAWS.filter(d => d.model).reduce((p, d) => p.then(() => needModel(d)).catch(() => {}), Promise.resolve()); }
  function cineRunners() {
    const used = new Set(), free = [];
    OUTLAWS.forEach(d => { const mine = d.model ? d.id : 0, o = outlaws.find(q => q.state === 'off' && q.only === mine && !used.has(q)); if (o) { used.add(o); free.push([o, d]); } });
    runners = free.map(([o, d], i) => { const fromHole = i % 3 !== 2, a = (i / Math.max(1, free.length - 1) - 0.5) * 2.0 + (Math.random() - 0.5) * 0.25;
      Object.assign(o, { kind: 'cine', def: { tier: 1 }, state: 'cine', cd: 0.15 + i * 0.2, yaw: a, rs: 5.6 + Math.random() * 1.6 });
      o.pos.set(fromHole ? BREACH.x + (Math.random() - 0.5) * 0.8 : DOOR.x, 0, (fromHole ? BREACH.z : DOOR.z) - 0.6); o.vel.set(0, 0, 0);
      o.p.lie(false); o.p.mat.color.set(d.tint || 0xffffff); if (o.p.mask) { o.p.mask.visible = !d.noMask; o.p.mask.material.color.set(d.mask || 0x8a1c14); } o.p.root.scale.setScalar((d.h || 1.76) / 1.76); o.p.root.visible = false; o.p.cur = null; o.p.play('run', 1.7); return o; });
  }
  function updRunners(dt) { runners.forEach(o => { if (o.state !== 'cine') return; if (o.cd > 0) { o.cd -= dt; if (o.cd <= 0) { o.p.root.visible = true; dust(o.pos, 4, 0.8); } return; }
    o.pos.x += Math.sin(o.yaw) * o.rs * dt; o.pos.z += Math.cos(o.yaw) * o.rs * dt; collide(o.pos, 0.35); o.pos.y = heightAt(o.pos.x, o.pos.z); o.dustT = (o.dustT || 0) - dt; if (o.dustT <= 0) { o.dustT = 0.2; puff(o.pos.x, o.pos.y + 0.12, o.pos.z, 0, 0.6, 0, 0xe2c096, 0.6, 0.5); } }); }
  function boomJail() {
    breachShow(1); sfx('boom'); setTimeout(() => sfx('boom'), 140); CAM.shake = 1.3; try { if (navigator.vibrate && touch) navigator.vibrate([80, 40, 160]); } catch (e) {}
    for (let i = 0; i < 40; i++) { const f = i < 14; puff(BREACH.x + (Math.random() - 0.5) * 1.6, 0.6 + Math.random() * 2, BREACH.z + 0.4, (Math.random() - 0.5) * 8, 1 + Math.random() * 5, Math.random() * 7, f ? 0xffa040 : i % 2 ? 0x6a5a4c : 0x8a7a6a, f ? 1.6 : 2.6, f ? 0.6 : 1.6); }
    rubble.forEach(r => { r.t = 0; r.m.position.set(BREACH.x, 1.2, BREACH.z); });
    fireball.t = 0; fireball.visible = true; fireball.position.set(BREACH.x, 1.3, BREACH.z + 0.8);
    smokes.forEach((q, i) => { q.t = -i * 0.05; q.s = 0.8 + Math.random() * 0.7; q.m.position.set(BREACH.x + (Math.random() - 0.5) * 1.4, 0.8 + Math.random() * 1.2, BREACH.z + 0.9); q.v.set((Math.random() - 0.5) * 3.2, 1.6 + Math.random() * 1.8, 1.2 + Math.random() * 2.6); q.m.material.color.setHex(i % 3 ? 0x5a5048 : 0x9a8a78); });
    const f = $('#snapFx'); f.classList.remove('on'); f.classList.add('big'); void f.offsetWidth; f.classList.add('on');
    drawBoard(); MUSIC.mode('chase'); banner('JAILBREAK', true); cineRunners();
  }
  function updBoom(dt) {
    if (fireball && fireball.t < 0.5) { fireball.t += dt; const e = Math.min(1, fireball.t / 0.5); fireball.scale.setScalar(2 + 9 * Math.sqrt(e)); fireball.material.opacity = 0.95 * (1 - e); if (e >= 1) fireball.visible = false; }
    smokes.forEach(q => { if (q.t >= 4.5) return; q.t += dt; if (q.t < 0) return; q.m.visible = true; const e = q.t / 4.5; q.m.position.addScaledVector(q.v, dt); q.v.multiplyScalar(Math.pow(0.45, dt)); q.v.y += 0.25 * dt; q.m.scale.setScalar(q.s * (2.4 + q.t * 2.2)); q.m.material.opacity = 0.95 * Math.min(1, q.t * 5) * (1 - e) * (1 - e); if (q.t >= 4.5) q.m.visible = false; });
  }
  function updRubble(dt) { updBoom(dt); rubble.forEach(r => { if (r.t === undefined || r.t >= 1) return; r.t = Math.min(1, r.t + dt / 0.85); const e = r.t; r.m.position.set(BREACH.x + (r.rest.x - BREACH.x) * e, 1.2 + (r.rest.y - 1.2) * e + Math.sin(e * PI) * r.h, BREACH.z + (r.rest.z - BREACH.z) * e); r.m.rotation.set(r.rot.x + r.spin * (1 - e), r.rot.y + r.spin * 0.5 * (1 - e), r.rot.z); if (e >= 1) { r.m.rotation.copy(r.rot); dust(r.rest, 1, 0.4, 0.7); } }); }
  // 장면 순서(초). 장면 시간은 히트스톱과 상관없이 실제 시간
  const N13 = OUTLAWS.map((d, i) => i);
  const CINE = {
    break: [
      [0, () => { cinePlace(); shot(-39.5, 2.0, -4.6, 0.42, 0.2, 15, true); sfx('fanfare'); MUSIC.mode('calm'); }],
      [0.7, () => cinePosters('break')], ...N13.map(i => [1.2 + i * 0.3, () => cineStamp(i, 'cap')]),
      [5.3, () => { G.cine.sum = { from: 0, to: G.cine.sum0, t: 0 }; }],
      [8.2, () => { $('#cine').classList.remove('show'); G.cine.thr = 0.52; rideShot(-PI / 2 - 0.32, 0.16, 8.5, true); }],
      [9.4, () => { G.cine.drift = 1; }],   // 헬라가 노을 쪽으로 떠난다
      [12.8, () => { G.cine.thr = 0; G.cine.drift = 0; shot(-42.6, 1.9, -8.2, 0.62, 0.17, 19, true); boomJail(); }],
      [16.6, () => { G.cine.turn = -PI / 2; horse.rear = 0.8; rideShot(-PI / 2 + 0.75, 0.1, 7, true); }],
      [19.2, () => { cinePosters('break'); N13.forEach(i => cineStamp(i, 'cap', true)); $('#cineSum').textContent = '$' + G.cine.sum0.toLocaleString('en-US'); }],
      ...N13.map(i => [19.8 + i * 0.22, () => cineStamp(i, 'esc')]),
      [23.0, () => { G.cine.sum = { from: G.cine.sum0, to: sumOf(), t: 0 }; }],
      [26.0, () => cineDone()]
    ],
    final: [
      [0, () => { cinePlace(); shot(-39.5, 2.0, -4.6, 0.42, 0.2, 15, true); sfx('fanfare'); MUSIC.mode('calm'); }],
      [0.7, () => cinePosters('final')], ...N13.map(i => [1.2 + i * 0.3, () => cineStamp(i, 'cap')]),
      [5.3, () => { G.cine.sum = { from: 0, to: sumOf(), t: 0 }; }],
      [8.4, () => { $('#cine').classList.remove('show'); G.cine.thr = 0.5; rideShot(-PI / 2 - 0.32, 0.16, 8.5, true); }],
      [9.6, () => { G.cine.drift = 1; }],
      [14.4, () => { G.cine.end = 1; ending(); CAM.tDist = 9; CAM.tPitch = 0.16; }],   // 엔딩 카드 뒤로 노을 쪽으로 떠나는 헬라
      [24, () => { G.cine.thr = 0; }]
    ]
  };
  function cineStart(kind) {
    if (G.cine || G.ended) return; if (G.deliver) { setTimeout(() => cineStart(kind), 500); return; }
    const b1 = {}; OUTLAWS.forEach(d => b1[d.id] = d.bounty); followSave = followSave || CAM.follow;
    G.cine = { kind, t: 0, i: 0, thr: 0, sum0: sumOf(), b1 }; document.body.classList.add('cine');
    if (kind === 'break') { G.ch = 2; G.caught = []; G.target = 0; applyCh2(); save(); preloadAll(); }   // 장면 도중 꺼도 2부부터 이어진다(마을 게시판 그림은 폭파 때 바꾼다)
  }
  function updCine(dt) {
    const C = G.cine, list = CINE[C.kind]; C.t += dt;
    while (C.i < list.length && list[C.i][0] <= C.t) { const fn = list[C.i++][1]; fn(); if (!G.cine) return; }
    if (C.sum) { C.sum.t = Math.min(1, C.sum.t + dt / 1.4); const v = Math.round(C.sum.from + (C.sum.to - C.sum.from) * (1 - Math.pow(1 - C.sum.t, 3))); $('#cineSum').textContent = '$' + v.toLocaleString('en-US'); if (C.sum.t >= 1) { C.sum = null; sfx('buy'); } }
    if (C.drift) CAM.tYaw += 0.05 * dt;
    if (C.end) { CAM.tDist = Math.min(14, CAM.tDist + 0.5 * dt); CAM.tPitch = Math.min(0.26, CAM.tPitch + 0.01 * dt); }
    if (C.turn !== undefined) { horse.yaw += clamp(wrap(C.turn - horse.yaw), -2.4 * dt, 2.4 * dt); }
    updRunners(dt); updRubble(dt);
  }
  function cineDone() {
    const C = G.cine; if (!C) return; $('#cine').classList.remove('show');
    runners.forEach(o => { if (o.state === 'cine') despawn(o); }); runners = [];
    smokes.forEach(q => { q.t = 9; q.m.visible = false; }); if (fireball) fireball.visible = false;
    if (C.kind === 'break') { if (!breach.visible) { breachShow(1); drawBoard(); } rubble.forEach(r => { r.t = 1; r.m.position.copy(r.rest); r.m.rotation.copy(r.rot); }); MUSIC.mode('calm'); autoTarget(); }
    CAM.follow = followSave; G.cine = null; document.body.classList.remove('cine'); horse.speed = Math.min(horse.speed, 2);
    CAM.chase = horse.yaw; CAM.off = 0; CAM.tDist = 9.5; CAM.tPitch = 0.3; CAM.manualT = -9999; updTargetHUD(); save();
  }
  function cineSkip() { const C = G.cine; if (!C) return; sfx('click');
    if (C.kind === 'final') { if (!C.end) { $('#cine').classList.remove('show'); C.end = 1; C.thr = 0.5; if (C.t < 0.01) CINE.final[0][1](); rideShot(-PI / 2 - 0.32, 0.16, 9, true); C.i = CINE.final.length - 1; ending(); CAM.tDist = 9; CAM.tPitch = 0.16; } return; }
    if (C.t < 0.01) CINE.break[0][1](); cineDone(); }

  // ── 시작·끝 ──
  function startGame(cont) {
    actx(); const d = cont ? load() : null;
    G.ch = d && d.ch === 2 ? 2 : 1; if (G.ch === 2) { applyCh2(); breachShow(1); }
    G.seenBoard = !!(d && (d.seen || (d.caught || []).length || d.target || G.ch === 2)); if (d) { G.caught = d.caught || []; G.up = Object.assign(G.up, d.up); setMoney(d.money || 0); } else { try { localStorage.removeItem(SAVE); } catch (e) {} G.caught = []; G.up = { rope: 0, horse: 0, loop: 0, gloves: 0 }; setMoney(0); }
    G.started = true; G.introT = 1.1; document.body.classList.add('playing'); $('#title').classList.remove('show');
    G.hp = 3; G.horseHp = 3; G.dead = false; G.horseDead = !!(d && d.hd); horse.dead = G.horseDead; horse.deadT = 0; horse.root.rotation.z = 0; horse.root.visible = !G.horseDead;
    H.mode = 'ride'; CAM.off = wrap(CAM.yaw - (horse.yaw + PI)); CAM.chase = horse.yaw; CAM.manualT = -9999; CAM.tDist = 9.5; CAM.tPitch = 0.3;
    if (G.horseDead) { dismount(); H.hold = 0; }   // 말 없이 이어하기: 마을에서 걸어서 시작(상점에서 새 말 $300)
    drawBoard(); setTarget(d && d.target && !G.caught.includes(d.target) ? d.target : 0); updCapHUD(); updHpHUD(); MUSIC.start(); if (!G.horseDead) horse.rear = 0.7; autoTarget();
  }
  function ending() {
    G.ended = true; document.body.classList.add('ending'); try { localStorage.removeItem(SAVE); localStorage.setItem('bounty.ending', '1'); } catch (e) {}
    sfx('fanfare'); MUSIC.mode('calm'); CAM.tDist = 16; CAM.tPitch = 0.5; setTimeout(() => $('#endCard').classList.add('show'), 900);
  }

  // ── 한 프레임 ──
  let qT = 0, qN = 0, qLv = +(localStorage.getItem('bounty.q') || 0);
  function applyQ() { if (qLv >= 1) CORE.setDpr(1); if (qLv >= 2) { CORE.sun.castShadow = false; } }
  const FOV0 = cam.fov; let fovNow = FOV0;
  function tick(rdt, noDraw) {
    let dt = rdt; if (G.slowT > 0) { G.slowT -= rdt; dt = rdt * (G.slowT > 0.2 ? 0.15 : 0.15 + 0.85 * (1 - Math.max(0, G.slowT) / 0.2)); }   // 걸린 순간 히트스톱: 0.15배로 느렸다가 0.2초에 걸쳐 돌아온다
    if (G.fovK > 0) G.fovK = Math.max(0, G.fovK - rdt * 3); const fv = FOV0 * (1 - 0.09 * Math.min(1, G.fovK || 0) * (G.fovK > 1 ? 1.3 : 1)); if (Math.abs(fv - fovNow) > 0.01) { fovNow = fv; cam.fov = fv; cam.updateProjectionMatrix(); }   // 화면이 확 당겨졌다 풀린다
    if (!G.paused && !G.ui) {
      G.time += dt; if (G.introT > 0) G.introT -= dt;
      if (G.cine) updCine(rdt);
      updHero(dt); updLasso(dt);
      for (let i = 0; i < outlaws.length; i++) updOutlaw(outlaws[i], dt);
      updOutlawHorses(dt); updCaptives(dt); updShots(dt); updDeliver(dt); updFry(dt); updAmbient(dt); updPuffs(dt); updCtx(dt); updCh2(dt);
      if (G.respawn > 0) { G.respawn -= dt; if (G.respawn <= 0) { const s = G.target && SITES[OUTLAWS[G.target - 1].site]; if (s && Math.hypot(heroCenter(_hc).x - s.x, _hc.z - s.z) > 60) setTarget(G.target); else G.respawn = 2; } }
      if (G.started) { updHUD(); updFightUI(); updHpHUD(); }
      if (!G.started) { CAM.tYaw = horse.yaw + 0.55 + Math.sin(performance.now() * 0.00025) * 0.25; }
    }
    CORE.keyCam(rdt); CAM.update(rdt); if (G.started) updWctx(); if (!noDraw) R.render(S, cam);
  }
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame); const real = (now - last) / 1000 || 0.016, dt = Math.min(0.05, real); last = now; tick(dt);
    // 화질 자동 낮추기: 창이 가려져 느려진 프레임(0.25초 넘음)은 세지 않는다
    if (G.started && !G.paused && !G.ui && qLv < 2 && !document.hidden && real < 0.25) { qT += real; qN++; if (qN >= 150) { if (qT / qN > 0.03) { qLv++; try { localStorage.setItem('bounty.q', qLv); } catch (e) {} applyQ(); } qT = 0; qN = 0; } }
  }

  // ── 단추·키 ──
  function toggleSnd(kind, on) { if (kind === 'bgm') { AU.bgmOn = on; $('#tgBgm').classList.toggle('off', !on); if (on && G.started) MUSIC.start(); else MUSIC.stop(); } else { AU.sfxOn = on; $('#tgSfx').classList.toggle('off', !on); } try { localStorage.setItem('bounty.' + kind, on ? '1' : '0'); } catch (e) {} }
  function pause(v) { G.paused = v; $('#pauseVeil').classList.toggle('show', v); }
  function bind() {
    const click = (sel, fn) => $(sel).addEventListener('click', e => { e.stopPropagation(); fn(e); });
    click('#btnNew', () => { sfx('click'); startGame(false); }); click('#btnCont', () => { sfx('click'); startGame(true); });
    click('#tgPause', () => pause(!G.paused)); click('#pauseVeil', () => pause(false));
    click('#tgBgm', () => toggleSnd('bgm', !AU.bgmOn)); click('#tgSfx', () => toggleSnd('sfx', !AU.sfxOn));
    click('#boardX', closeUI); click('#shopX', closeUI); click('#ctxBtn', () => { if (ctxFn) { sfx('click'); ctxFn(); ctxT = 0; } }); click('#wctxBtn', () => { if (ctxFn) { sfx('click'); ctxFn(); ctxT = 0; } }); click('#callBtn', callHorse);
    click('#btnTitle', () => { if (G.dead) { const u = new URL(location.href); u.searchParams.set('go', 'c'); location.href = u.href; } else location.reload(); });   // 게임 오버면 저장한 데서 이어하기
    click('#btnLand', () => window.OL && OL.go()); click('#cineSkip', () => cineSkip());
    ['#boardUI', '#shopUI'].forEach(s => $(s).addEventListener('click', e => { if (e.target === $(s)) closeUI(); }));
    const lb = $('#lassoBtn'); lb.addEventListener('pointerdown', e => { e.preventDefault(); lb.setPointerCapture(e.pointerId); lassoDown(); }); lb.addEventListener('pointerup', lassoUp); lb.addEventListener('pointercancel', lassoUp);
    R.domElement.addEventListener('pointerdown', () => { if (touch && (G.chase || G.fight)) lassoDown(); });   // 폰: 쫓기·주먹 싸움 땐 화면 아무 데나 두드려도 뛴다·때린다(올가미 단추와 같다)
    IN.onTap = (x, y) => { if (canClickRide() && horseUnder(x, y)) { clickRide(); return; } if (L.state === 'hold') lassoDown(); };
    R.domElement.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || e.buttons) return; R.domElement.style.cursor = canClickRide() && horseUnder(e.clientX, e.clientY) ? 'pointer' : ''; });   // 말 위에선 손가락 커서
    IN.onKey = e => {
      if (e.code === 'Space') lassoDown(); else if (e.code === 'KeyE' || e.code === 'Enter') { if (G.ui) closeUI(); else if (ctxFn) { ctxFn(); ctxT = 0; } }
      else if (e.code === 'KeyH') callHorse(); else if (e.code === 'Escape') { if (G.ui) closeUI(); else if (G.started) pause(!G.paused); }
      else if (e.code === 'KeyP') pause(!G.paused); else if (e.code === 'KeyM') toggleSnd('bgm', !AU.bgmOn); else if (e.code === 'KeyK') toggleSnd('sfx', !AU.sfxOn);
    };
    IN.onKeyUp = e => { if (e.code === 'Space') lassoUp(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.started && !G.ended) { save(); } });
    $('#btnCont').textContent = T.cont; $('#btnLand').textContent = T.land; $('#keys').innerHTML = T.keys;
    document.querySelectorAll('#load .ttl, #title h1, #endCard h2').forEach(e => e.textContent = T.title); document.title = T.title;
    if (localStorage.getItem('bounty.bgm') === '0') toggleSnd('bgm', false); if (localStorage.getItem('bounty.sfx') === '0') toggleSnd('sfx', false);
  }

  // ── 불러오기 ──
  async function boot() {
    const bar = $('#load .bar i'), pct = $('#load .pct'), prog = p => { bar.style.width = (p * 100) + '%'; pct.textContent = Math.round(p * 100) + '%'; };
    bind(); prog(0.05);
    try { await Promise.all([document.fonts.load('40px BHTitle'), document.fonts.load('20px Ria')]); } catch (e) {}
    const starP = loadGLB('assets/models/star.glb'), heroP = loadGLB('assets/models/hero.glb').catch(() => null), ponyP = loadGLB('assets/models/pony.glb').catch(() => null);
    await WORLD.build(prog);
    const star = await starP, hg = (await heroP) || star; prog(0.9);
    hero = ACT.makePerson(hg, 1.75); if (hg !== star) { WALK_TS = +(hg.userData.walkTS || 1.5); RUN_TS = +(hg.userData.runTS || 1.6); }
    hero.play('stand'); hero.mixer.update(0.01); hero.root.updateMatrixWorld(true); if (hero.bones.hips) H.hipH = hero.bones.hips.getWorldPosition(_a).y - hero.root.position.y;
    ACT.setPony(await ponyP);
    horse = ACT.makeHorse(0xb9763c); horse.pos.set(TOWN.horse.x, 0, TOWN.horse.z); horse.yaw = PI / 2; horse.update(0.016);
    for (let i = 0; i < 7; i++) outlaws.push(mkOutlaw(star));
    // 마구간(헛간 앞 울타리, sites.js): 파는 말 셋. 울타리 앞(TOWN.store)에 서면 상점 단추. 맨 앞 말은 길에서 옆모습이 보이게 선다
    [[11.6, 9.1, PI / 2, 0xb9763c], [15.6, 11.2, -PI / 2 - 0.4, 0x5a3a26], [9.4, 11.6, 0.5, 0x2e2622]].forEach(([x, z, y, col]) => { const h = ACT.makeHorse(ponyCoat(col), true); h.pos.set(x, heightAt(x, z), z); h.yaw = y; h.update(0.016); stable.push(h); });
    for (let i = 0; i < 2; i++) { const h = ACT.makeHorse(0x6a4a34); h.root.visible = false; h.used = false; h.fade = 0; ohorses.push(h); }
    for (let i = 0; i < 3; i++) capRopes.push(new ACT.Rope(8, 0.026));
    const bg = new THREE.BoxGeometry(0.07, 0.07, 1.1), bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 0.8) });
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(bg, bm); m.visible = false; m.frustumCulled = false; S.add(m); bullets.push({ m, pos: new V3(), vel: new V3(), life: 0 }); }
    const dg = new THREE.CylinderGeometry(0.09, 0.09, 0.42, 8), dm = new THREE.MeshStandardMaterial({ color: 0xc02a1c, roughness: 0.7 });
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(dg, dm); m.visible = false; S.add(m); bombs.push({ m, state: 0, t: 0, from: new V3(), to: new V3() }); }
    const pg = new THREE.SphereGeometry(0.17, 10, 8), pm = new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.95 });   // 하얀 가루 주머니
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(pg, pm); m.visible = false; S.add(m); powders.push({ m, state: 0, t: 0, hit: false, from: new V3(), to: new V3() }); }
    mkAmbient(); mkBreach(); CORE.resize(); prog(0.96);
    await Promise.all(OUTLAWS.map(d => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = d.img; boardImgs[d.id] = im; })));
    drawBoard(); applyQ();
    CAM.occ = () => [WORLD.townMesh.wood, WORLD.mesaMesh];
    // 타이틀 장면: 큰길에서 말을 탄 채, 카메라는 앞 옆에서
    H.mode = 'ride'; hero.pos.copy(horse.pos); CAM.chase = null; CAM.tYaw = horse.yaw + 0.55; CAM.tDist = 5.4; CAM.tPitch = 0.05; CAM.snap();
    // 처음 보이는 것들을 한 번 그려 둔다(끊김 방지)
    tick(0.016, true);
    const warm = v => { outlaws.forEach(o => o.p.root.visible = v); ohorses.forEach(h => h.root.visible = v); loop.visible = ring.visible = v; bullets.forEach(q => q.m.visible = v); bombs.forEach(q => q.m.visible = v); powders.forEach(q => q.m.visible = v); vultures.forEach(q => q.visible = v); mark.visible = v; breach.visible = v; smokes.forEach(q => q.m.visible = v); fireball.visible = v; [breach, fireball, ...smokes.map(q => q.m)].forEach(o => o.traverse(c => c.frustumCulled = !v)); };   // 목적지 화살·감옥 구멍·폭파 연기도 미리 한 번 그려 둔다(처음 보일 때 멈칫하지 않게)
    warm(true); outlaws.forEach((o, i) => { o.p.root.position.set(horse.pos.x + 2 + i, 0, horse.pos.z + 3); o.p.root.updateMatrixWorld(true); }); ohorses.forEach((h, i) => { h.pos.set(horse.pos.x - 3 - i * 2, 0, horse.pos.z + 3); h.update(0.016); }); vultures.forEach((v, i) => v.position.set(horse.pos.x + i, 3, horse.pos.z));
    lrope.hang(_a.set(horse.pos.x, 1, horse.pos.z), _b.set(horse.pos.x + 1, 1, horse.pos.z), 0.1); capRopes.forEach(r0 => r0.hang(_a, _b, 0.1));
    R.compile(S, cam); { const fc = []; S.traverse(o => { if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && o.frustumCulled) { fc.push(o); o.frustumCulled = false; } }); R.render(S, cam); fc.forEach(o => o.frustumCulled = true); }   // 맵 전체를 한 번 그려 GPU 에 올려 둔다(시작 직후 카메라가 돌 때 처음 보이는 건물에서 멈칫하지 않게)
    warm(false); lrope.hide(); capRopes.forEach(r0 => r0.hide());
    prog(1); $('#bwCont').style.display = load() ? '' : 'none'; $('#title').classList.add('show'); $('#load').classList.add('gone');
    requestAnimationFrame(frame);
    if (Q.has('go')) startGame(Q.get('go') === 'c');
  }
  window.__bh = { G, H, L, CAM, outlaws, captives, tick: (n, dt, noDraw) => { for (let i = 0; i < (n || 1); i++) tick(dt || 1 / 60, noDraw); }, get hero() { return hero; }, get horse() { return horse; }, startGame, setTarget, setMoney, mount, dismount, lassoDown, lassoUp, capture, openBoard, openShop, closeUI, stunHero, spawn, ending, cineStart, cineSkip, applyCh2, stat, JOY, makePortraits, needModel, OUTLAWS };
  boot().catch(e => { console.error(e); $('#load .pct').textContent = 'ERROR ' + e.message; });
})();
