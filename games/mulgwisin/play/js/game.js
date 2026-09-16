/* game.js — 물귀신: 밤 계곡 물길을 거슬러 오른다. 등불 하나 들고 굽이마다 명소를 찾고, 깊은 물에서 올라오는 손을 피한다 */
(function () {
  const $ = id => document.getElementById(id);
  const W = window.WORLD, A = window.AUDIO;
  const EN = /[?&]lang=en/.test(location.search);
  const isTouch = ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');
  if (/[?&]shot=1/.test(location.search)) document.body.classList.add('shot');
  if (EN) { document.documentElement.lang = 'en'; document.querySelectorAll('[data-en]').forEach(el => el.innerHTML = el.getAttribute('data-en')); document.title = 'Mulgwisin — Oreum Games'; }
  const NM = m => EN ? m.en : m.ko;

  // ── 렌더러·장면 ──
  const canvas = $('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
  const vw = () => Math.max(1, innerWidth || 1), vh = () => Math.max(1, innerHeight || 1);   // 창이 0 일 때 화면 계산이 깨지지 않게
  renderer.setSize(vw(), vh()); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.5;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, vw() / vh(), .08, 1500);
  W.build(scene);
  const ghost = new window.Ghost(scene);
  OMEN.build(scene);
  UNCLE.init(scene);

  // ── 저장 ──
  const SAVE = 'mulgwisin.run2', BEST = 'mulgwisin.best';
  const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  let best = load(BEST) || 0;

  // ── 헤엄치는 사람 ──
  const skin = new THREE.MeshLambertMaterial({ color: 0xe8c4a4 });
  const suit = new THREE.MeshLambertMaterial({ color: 0xc23a2a });
  const hairM = new THREE.MeshLambertMaterial({ color: 0x1a120c });
  function buildSwimmer() {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const mk = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (parent || body).add(m); return m; };
    const torso = mk(new THREE.CapsuleGeometry(.19, .46, 6, 12), skin, 0, -.12, 0); torso.rotation.x = Math.PI / 2;
    const trunk = mk(new THREE.CapsuleGeometry(.2, .16, 6, 12), suit, 0, -.13, -.32); trunk.rotation.x = Math.PI / 2;
    const head = new THREE.Group(); head.position.set(0, .0, .42); body.add(head);
    mk(new THREE.SphereGeometry(.15, 14, 12), skin, 0, 0, 0, head);
    mk(new THREE.SphereGeometry(.155, 14, 12, 0, Math.PI * 2, 0, Math.PI * .5), hairM, 0, .01, -.02, head);
    const arms = [], legs = [];
    [-1, 1].forEach(s => {
      const ap = new THREE.Group(); ap.position.set(s * .26, -.04, .22); body.add(ap);
      mk(new THREE.CapsuleGeometry(.055, .3, 4, 8), skin, 0, -.17, 0, ap);
      const fo = new THREE.Group(); fo.position.set(0, -.34, 0); ap.add(fo); mk(new THREE.CapsuleGeometry(.05, .28, 4, 8), skin, 0, -.16, 0, fo); mk(new THREE.SphereGeometry(.06, 8, 8), skin, 0, -.34, 0, fo);
      ap.userData.fo = fo; arms.push(ap);
      const lp = new THREE.Group(); lp.position.set(s * .1, -.16, -.42); body.add(lp);
      mk(new THREE.CapsuleGeometry(.075, .42, 4, 8), skin, 0, 0, -.26, lp).rotation.x = Math.PI / 2; mk(new THREE.CapsuleGeometry(.06, .36, 4, 8), skin, 0, -.02, -.7, lp).rotation.x = Math.PI / 2; mk(new THREE.BoxGeometry(.1, .06, .22), skin, 0, -.03, -.98, lp);
      legs.push(lp);
    });
    // 등에 진 등불 — 기름이 있는 동안 켜져 있다
    const lamp = new THREE.Group(); lamp.position.set(0, .34, -.42);   // 씬에 따로 두고 손 뼈를 따라간다
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .3, 9, 1, true), new THREE.MeshLambertMaterial({ color: 0xffb060, emissive: 0xff8c30, emissiveIntensity: 1.3, side: THREE.DoubleSide, transparent: true, opacity: .92 })); lamp.add(paper);
    const lampL = new THREE.PointLight(0xffc890, 19, 26, 1.8); lamp.add(lampL);
    const lampG = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xffb478, transparent: true, opacity: .32, depthWrite: false })); lampG.scale.set(1.9, 1.9, 1); lamp.add(lampG);
    return { g, body, head, arms, legs, lamp, paper, lampL, lampG };
  }
  const pl = buildSwimmer(); scene.add(pl.g); scene.add(pl.lamp);
  // 카메라 쪽에서 아이만 은은히 비추는 달빛 — 뒷모습이 실루엣으로 묻히지 않게
  { const hl = new THREE.PointLight(0xa8c2dc, 12, 7, 2); hl.position.set(0, 1.5, -1.5); pl.g.add(hl); }
  const STAND = 1.02;   // 코드 모형이 곧게 섰을 때 몸 원점에서 발까지
  const HAND_Y = .55;   // 팔을 내리고 섰을 때 발에서 주먹까지

  // ── 주인공 — BUY JEJU 의 남자아이 (idle · walk · run) ──
  const heroG = new THREE.Group(); pl.g.add(heroG);
  const HERO = { on: false, root: null, mixer: null, act: {}, cur: '', hand: null };
  let _boyBuf = null;
  function boyBuf() {
    if (_boyBuf) return Promise.resolve(_boyBuf);
    if (W.FILE) return new Promise((res, rej) => {   // file:// 은 fetch 가 막혀 base64 사본을 읽는다
      const sc = document.createElement('script'); sc.src = 'assets/boy.glb.js';
      sc.onload = () => { const b = atob(window.BOY_GLB); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); window.BOY_GLB = null; _boyBuf = u.buffer; res(_boyBuf); };
      sc.onerror = rej; document.body.appendChild(sc);
    });
    return fetch('assets/boy.glb').then(r => r.arrayBuffer()).then(b => (_boyBuf = b));
  }
  function newBoy() {   // 같은 파일에서 몸을 하나 더 뜬다 (주인공·동생)
    if (!window.GLTFLoaderClass) return Promise.reject(new Error('로더 없음'));
    const L = new window.GLTFLoaderClass();
    return boyBuf().then(buf => new Promise((res, rej) => L.parse(buf, '', res, rej)));
  }
  function dressBoy(root) {
    root.traverse(o => { o.userData.keep = true; if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false; const m = o.material;
      if (m && m.emissiveMap && m.map && m.emissiveMap.image === m.map.image) { m.emissiveMap = null; m.emissive && m.emissive.setScalar(0); m.needsUpdate = true; }   // Meshy 자체발광 끄기
      if (m && m.map) { m.map.anisotropy = 8; m.map.needsUpdate = true; } } });
  }
  newBoy().then(gl => {
    const root = gl.scene; dressBoy(root);
    heroG.add(root); root.position.y = -.12;   // 믹사모 리깅 — 발을 바닥에 맞춘다
    pl.lamp.scale.setScalar(.46);   // 아이 손에 들리는 크기
    root.traverse(o => { if (!HERO.hand && o.isBone && /righthand$/i.test(o.name.replace(/[:_]/g, ''))) HERO.hand = o; });
    HERO.bone = {}; root.traverse(o => { if (o.isBone) { const n = o.name.replace(/[:_]/g, '').toLowerCase().replace('mixamorig', ''); if (/^(rightarm|rightforearm|leftarm|leftforearm|rightupleg|rightleg|leftupleg|leftleg|head|neck|spine01)$/.test(n)) HERO.bone[n] = o; } });   // 점프 자세·등불 든 팔을 클립 위에 덧입힐 뼈 · 머리채를 잡히는 자리
    if (!HERO.hand) console.warn('오른손 뼈를 못 찾음');
    HERO.mixer = new THREE.AnimationMixer(root);
    (gl.animations || []).forEach(c => { HERO.act[c.name] = HERO.mixer.clipAction(c); });
    HERO.root = root; HERO.on = true; pl.body.visible = false;
  }).catch(e => console.warn('주인공 모델', e));
  // 믹사모 동작(줍기·밀기·웅크리기·넘어지기·일어나기)을 새로 뜬 쉬는 자세 모델에 구워 주인공에 붙인다 — js/acts.js
  Promise.all([newBoy(), ACTS.load()]).then(([gl]) => {
    const clips = ACTS.bake(gl.scene, gl.animations);
    const sub = (c, n, a, b) => c && THREE.AnimationUtils.subclip(c, n, Math.round(a * 30), Math.round(b * 30), 30);
    if (clips.pickup) clips.pick = sub(clips.pickup, 'pick', 1.5, 3.3);   // 허리 숙여 줍는 대목만
    if (clips.getup) clips.rise = sub(clips.getup, 'rise', 0, 6.5);
    if (clips.fallback) clips.fallback = sub(clips.fallback, 'fallback', 0, 2.45);   // 마지막 한 프레임이 선 자세로 튀어 돌아가서 잘라 낸다
    if (clips.push) clips.push = sub(clips.push, 'push', 2.0, 3.85);
    if (clips.throw) clips.throw = sub(clips.throw, 'throw', .35, 1.5);   // 팔을 뒤로 젖혔다 뿌리는 대목만 — 손을 떠나는 때가 .9초                  // 선 채로 미는 대목만 되풀이
    const add = () => { if (!HERO.mixer) return setTimeout(add, 300); for (const n in clips) HERO.act[n] = HERO.mixer.clipAction(clips[n]); HERO.clips = clips; };
    add();
  }).catch(e => console.warn('동작 굽기', e));
  function heroHold(name) { if (HERO.act[name]) { HERO.holdName = name; HERO.holdT = .2; } }   // 매 틱 부르는 동안 이어진다
  // 한 번만 하는 동작 — 끝나면 걷기·서기로 돌아간다. 돌려주는 값은 걸리는 초
  function heroAct(name, speed, hold) {
    const a = HERO.act[name]; if (!a || !HERO.clips) return 0;
    if ((G.ghost === 'grab' || G.ghost === 'drown') && name !== 'fallback') return 0;   // 끌려가는 동안엔 다른 동작이 끼어들지 않는다
    const dur = HERO.clips[name].duration / (speed || 1);
    HERO.once = { name, t: 0, dur: hold || dur, speed: speed || 1, lock: !!hold }; HERO.cur = '';
    return dur;
  }

  // 여동생 — 사장님이 믹사모로 리깅해 온 여자아이(assets/sister.glb, 텍스처는 sister.jpg 따로)
  // 서기·걷기·달리기는 같은 믹사모 뼈라 트랙을 그대로 붙이고, 엉덩이 이동만 다리 길이 비율로 줄인다(assets/acts_c.glb)
  const SIS_H = 1.22;   // 멀리서 너무 작아 보였다(09-16) — 오빠(1.25)보다 살짝 작게
  const GL = url => new Promise((res, rej) => new window.GLTFLoaderClass().load(url, res, undefined, rej));
  let _sisTex = null, _sisClips = null;
  function legUnits(root) {   // 서 있는 엉덩이 높이를 트랙 단위로
    const f = k => { let o = null; root.traverse(n => { if (!o && n.name.replace(/[^a-z]/gi, '').toLowerCase() === 'mixamorig' + k) o = n; }); return o; };
    const ch = ['hips', 'leftupleg', 'leftleg', 'leftfoot'].map(f); if (ch.some(x => !x)) return 1;
    root.updateMatrixWorld(true); const a = new THREE.Vector3(), b = new THREE.Vector3(); let sum = 0;
    for (let i = 0; i < 3; i++) { ch[i].getWorldPosition(a); ch[i + 1].getWorldPosition(b); sum += a.distanceTo(b); }
    const ps = ch[0].parent ? Math.abs(ch[0].parent.getWorldScale(new THREE.Vector3()).y) : 1; return sum / (ps || 1);
  }
  function newSister() {
    if (!window.GLTFLoaderClass) return newBoy();
    // file:// 에선 fetch·그림 읽기가 막혀 base64 사본(assets/*.js)으로 읽는다 — 예전엔 남자아이 모형으로 대신했다(2026-09-16)
    const texFrom = url => new Promise(res => { const done = t => { if (t) { t.colorSpace = THREE.SRGBColorSpace; t.flipY = true; t.anisotropy = 8; } res(t); };   /* FBX 에서 내보낸 UV 라 뒤집어야 맞는다 */
      if (!W.FILE) return new THREE.TextureLoader().load(url, done, undefined, () => res(null));
      W.glbBuf(url).then(buf => { const img = new Image(); img.onload = () => { const t = new THREE.Texture(img); t.needsUpdate = true; done(t); }; img.onerror = () => res(null); img.src = URL.createObjectURL(new Blob([buf], { type: 'image/jpeg' })); }, () => res(null)); });
    const LD = url => W.FILE ? W.glbLoad(url) : GL(url);
    if (!_sisTex) _sisTex = texFrom('assets/sister.jpg');
    if (!_sisClips) _sisClips = LD('assets/acts_c.glb').catch(() => null);
    return Promise.all([LD('assets/sister.glb'), _sisClips, _sisTex]).then(([gl, src, tex]) => {
      const root = gl.scene;
      root.traverse(o => { if (o.isSkinnedMesh) { o.frustumCulled = false; if (tex) { o.material.map = tex; o.material.needsUpdate = true; } } });
      root.updateMatrixWorld(true);
      const h = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y || 1;
      const holder = new THREE.Group(); holder.add(root); root.scale.multiplyScalar(SIS_H / h);
      const anims = [];
      if (src) { const k = legUnits(root) / legUnits(src.scene);
        for (const c0 of src.animations) { const c = c0.clone(); c.tracks.forEach(t => { if (/hips\.position$/i.test(t.name)) for (let i = 0; i < t.values.length; i++) t.values[i] *= k; }); anims.push(c); } }
      return { scene: holder, animations: anims, mixRoot: root };
    });
  }
  // 동생 — 발원지에서 기다린다
  const KID = { root: null, mixer: null, host: null, act: {}, cur: '' };
  newSister().then(gl => {
    const root = gl.scene; if (!gl.mixRoot) { dressBoy(root); root.position.y = -.12; root.scale.setScalar(.94); }
    KID.mixer = new THREE.AnimationMixer(gl.mixRoot || root);
    (gl.animations || []).forEach(c => { KID.act[c.name] = KID.mixer.clipAction(c); });
    KID.root = root; playKid('idle'); tintKid(0);
  }).catch(() => { });
  function tintKid(k) {   // 0 제 빛깔 · 1 물에 젖은 창백한 빛
    if (!KID.root) return;
    KID.root.traverse(o => { if (o.isSkinnedMesh || o.isMesh) { const m = o.material; if (m && m.color) m.color.setRGB(.46 - k * .12, .56 - k * .1, .8 - k * .04); if (m && 'roughness' in m) { m.roughness = 1; m.metalness = 0; } } });   // 바탕부터 서늘하게 — 주황 등불에 검은 머리가 갈색으로 보였다(09-16)
  }
  function playKid(name, speed) {
    const a = KID.act[name] || KID.act.idle; if (!a) return;
    if (KID.cur !== name) { const p = KID.act[KID.cur]; a.reset().fadeIn(.2).play(); if (p) p.fadeOut(.2); KID.cur = name; }
    a.timeScale = speed || 1;
  }
  // 흔적을 주우면 — 그 자리에 동생의 푸른 잔상이 잠깐 나타나 강 위쪽으로 걸어간다
  const ECHO = { root: null, mixer: null, mats: [], t: -1, x: 0, z: 0 };
  newSister().then(gl => {
    const root = gl.scene; if (!gl.mixRoot) { root.position.y = -.12; root.scale.setScalar(.94); } root.visible = false;
    const glows = [];
    root.traverse(o => { if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false;
      // 여동생 얼굴·옷 그림을 살리되 밤빛과 상관없이 스스로 밝게(빛 받는 재질로 바꿨다가 캄캄해서 안 보였다 — 2026-09-16)
      const m = new THREE.MeshBasicMaterial({ map: o.material.map || null, color: 0x252e3a, transparent: true, opacity: 0, depthWrite: false, fog: true });   // 09-16 두 번 더 낮춤 — 어둠에 반쯤 묻히게
      o.material = m; o.renderOrder = 6; ECHO.mats.push(m);
      if (o.isSkinnedMesh) glows.push(o); } });
    for (const o of glows) {   // 푸른 빛 겹 — 같은 뼈에 붙여 몸을 따라 은은하게 번진다
      const gm = new THREE.MeshBasicMaterial({ color: 0x6fb4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const g = new THREE.SkinnedMesh(o.geometry, gm); g.bind(o.skeleton, o.bindMatrix); g.frustumCulled = false; g.renderOrder = 7; o.parent.add(g);
      gm.userData.glow = true; ECHO.mats.push(gm); }
    const holder = new THREE.Group(); holder.add(root); scene.add(holder); ECHO.holder = holder;
    ECHO.mixer = new THREE.AnimationMixer(gl.mixRoot || root);
    const w = (gl.animations || []).find(a => a.name === 'walk'); if (w) ECHO.mixer.clipAction(w).play();
    ECHO.root = root;
  }).catch(() => { });
  function memoryEcho(x, z) {
    if (!ECHO.root) return;
    // 카메라가 보는 쪽 앞에 나타나 멀어져 간다 — 늘 뒷모습만(2026-09-16 사장님)
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    ECHO.t = 0; ECHO.x = x + fx * 3.2; ECHO.z = z + fz * 3.2; ECHO.dx = fx; ECHO.dz = fz; ECHO.root.visible = true; A.memory();
  }
  function updateEcho(dt, t) {
    if (ECHO.t < 0 || !ECHO.root) return;
    ECHO.t += dt; ECHO.x += ECHO.dx * dt * 1.05; ECHO.z += ECHO.dz * dt * 1.05;
    const a = ECHO.t < .7 ? ECHO.t / .7 : ECHO.t < 2.8 ? 1 : Math.max(0, 1 - (ECHO.t - 2.8) / 1.1);
    const op = a * (.44 + Math.sin(t * 17) * .07 + (Math.random() < .05 ? -.3 : 0));
    ECHO.mats.forEach(m => m.opacity = Math.max(0, op) * (m.userData.glow ? .04 : 1));   // 밝으면 안 무섭다(09-16) — 흐릿하고 서늘하게
    ECHO.holder.position.set(ECHO.x, Math.max(W.groundH(ECHO.x, ECHO.z), W.height(ECHO.x, ECHO.z, t) - .05), ECHO.z);   /* 물 위를 걷는다 — 바닥에 서면 물에 잠겨 안 보인다 */
    ECHO.holder.rotation.y = Math.atan2(ECHO.x - camera.position.x, ECHO.z - camera.position.z);   // 카메라에서 멀어지는 쪽을 본다 — 얼굴은 끝내 안 보인다
    ECHO.mixer.update(dt);
    if (ECHO.t > 4) { ECHO.t = -1; ECHO.root.visible = false; }
  }
  function playHero(name, speed) {
    const a = HERO.act[name] || HERO.act.idle; if (!a) return;
    if (HERO.cur !== name) {
      const p = HERO.act[HERO.cur], once = HERO.once && HERO.once.name === name;
      a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once;
      a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.fadeIn(.18).play(); if (p && p !== a) p.fadeOut(.18);
      // heroAct 는 같은 동작을 다시 틀려고 cur 를 비운다 — 그러면 p 가 없어 앞 동작이 안 꺼진다.
      // 끝나고 멈춰 선 한 번짜리 동작(넘어지기)이 무게 1 로 남아 누운 채 걸었다(2026-09-16). 켜져 있는 다른 동작은 다 끈다
      for (const k in HERO.act) { const o = HERO.act[k]; if (o !== a && o !== p && o.enabled && o.isScheduled()) o.fadeOut(.18); }
      HERO.cur = name;
    }
    a.timeScale = speed || 1;
  }
  const P = { x: 0, z: 2, y: 0, yaw: 0, speed: 0, vx: 0, vz: 0, st: 100, phase: 0, sink: 0, strokeAcc: 0, foot: false, dry: false, air: false, jv: 0, airK: 0, raise: 0, crankK: 0, crankA: 0, adv: 0 };
  let camYaw = 0;
  const lampPos = new THREE.Vector3(), kidPos = new THREE.Vector3(), lampLocal = new THREE.Vector3();

  // 물보라
  const foam = []; { const mat = new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xdfe9ea, transparent: true, opacity: .5, depthWrite: false }); for (let i = 0; i < 48; i++) { const s = new THREE.Sprite(mat.clone()); s.visible = false; scene.add(s); foam.push({ s, life: 0, vx: 0, vz: 0, sc: 1 }); } }
  function spawnFoam(x, z, n, big) { for (let k = 0; k < n; k++) { const f = foam.find(f => f.life <= 0); if (!f) return; f.life = .6 + Math.random() * .5; f.vx = (Math.random() - .5) * 1.4; f.vz = (Math.random() - .5) * 1.4; f.sc = (big ? .9 : .45) + Math.random() * .3; f.s.position.set(x + (Math.random() - .5) * .3, 0, z + (Math.random() - .5) * .3); f.s.visible = true; } }
  function updateFoam(dt, t) { for (const f of foam) { if (f.life <= 0) continue; f.life -= dt; if (f.life <= 0) { f.s.visible = false; continue; } const fl = W.flow(f.s.position.x, f.s.position.z); f.s.position.x += (f.vx + fl.x) * dt; f.s.position.z += (f.vz + fl.z) * dt; f.s.position.y = W.height(f.s.position.x, f.s.position.z, t) + .04; const k = f.life / 1.1; f.s.material.opacity = k * .55; f.s.scale.setScalar(f.sc * (1.4 - k * .6)); } }

  // ── 상태 ──
  const G = {
    state: 'title', t: 0, oil: 100, items: 0, charms: 0, seed: 1, cpX: 0, cpZ: 2, endT: 0, ended: false,
    lamp: true, san: 100, grain: 0, holy: false,
    ghost: 'away', gT: 0, gx: 0, gz: 0, gy: .95, stare: 0, owlT: 20, shake: 0, hint: 0, gNear: 99,
    omenT: 12, strike: -1, cool: 0, kind: '', lastKind: '', lastOmen: '', blink: 0, blackT: 0, flickT: 0, spike: 0, glim: 0, hushed: false, hairHit: true,
    salt: 3, grip: 0, grabs: 0, lunges: 0, banishT: -1, wheel: null,
  };
  const SALT_MAX = 9;
  let under = false, lastUnder = false;
  const el = { topbar: $('topbar'), dist: $('dist'), st: $('st'), stBar: $('stBar'), oil: $('oil'), oilBar: $('oilBar'), charm: $('charm'), item: $('item'), grain: $('grain'), dread: $('dread'), toast: $('toast'), keys: $('keys'), title: $('title'), over: $('over'), overH: $('overH'), overDist: $('overDist'), overItem: $('overItem'), overBest: $('overBest'), overBtn: $('overBtn'), titleBest: $('titleBest'), goStart: $('goStart'), goCont: $('goCont'), uw: $('uw'), flash: $('flash'), btnLamp: $('btnLamp'), btnRun: $('btnRun'), btnJump: $('btnJump'), btnSalt: $('btnSalt'), salt: $('salt'), saltN: $('saltN'), mash: $('mash'), sub: $('sub'), mis: $('mis'), misIc: $('misIc'), misN: $('misN'), trace: $('trace'), traceN: $('traceN') };

  // 줍기 자막 — 무엇을 주웠고, 누구 것이었을까. 유품은 모두 이 강에 빠져 죽은 사람들의 것이다
  const SUBS = EN ? {
    RING: ['I found a ring.', 'Whose ring was it?'], COIN: ['A rusty old coin.', 'Who dropped it here?'], HAIRPIN: ['A hairpin.', 'Whose hair did it hold?'],
    WATCH: ['A stopped wristwatch.', 'What time did it stop?'], GLASSES: ['A pair of glasses.', 'Did they see the water coming?'], WHISTLE: ['A whistle.', 'Did no one hear it?'],
    KEY: ['A house key.', 'Which door was it waiting for?'], MARBLE: ['A glass marble.', 'Which child was it?'],
    shoe: ["My sister's shoe.", 'Where is the other one?'], bag: ["My sister's school bag.", "It's still wet."], tie: ["My sister's hair tie.", 'I bought it for her.'],
    torch: ['Our flashlight.', "It's still on."], coat: ["My sister's yellow raincoat.", 'She wore it that day.'], charm: ['A talisman.'],
    shrine: ['This is a shrine.', 'Here the ghost will not come, even in the dark.'],
  } : {
    반지: ['반지를 주웠다', '누구의 반지일까'], 동전: ['녹슨 동전을 주웠다', '누가 여기 떨어뜨렸을까'], 머리핀: ['머리핀을 주웠다', '누구의 머리에 꽂혀 있었을까'],
    손목시계: ['멈춘 손목시계를 주웠다', '몇 시에 멈췄을까'], 안경: ['안경을 주웠다', '물이 차오르는 걸 보았을까'], 호루라기: ['호루라기를 주웠다', '아무도 듣지 못했을까'],
    열쇠: ['열쇠를 주웠다', '어느 집 문이 기다리고 있을까'], 구슬: ['유리구슬을 주웠다', '어느 아이의 구슬이었을까'],
    shoe: ['동생 신발이다', '한 짝은 어디 있을까'], bag: ['동생 책가방이다', '아직도 젖어 있다'], tie: ['동생 머리끈이다', '내가 사 준 거였는데'],
    torch: ['우리 집 손전등이다', '아직 켜져 있다'], coat: ['동생 노란 비옷이다', '그날 입고 나갔던'], charm: ['부적을 찾았다'],
    shrine: ['서낭당입니다', '여기서는 불을 꺼도 귀신이 나타나지 않습니다'],   // 사장님이 정한 안내(2026-09-16)
  };
  function subtitle(key, dur) {
    const lines = Array.isArray(key) ? key.map((s, i, a) => (i === 0 ? '“' : '') + s + (i === a.length - 1 ? '”' : '')) : key && key.lines ? key.lines : SUBS[key]; if (!lines) return;   // {lines} 는 따옴표 없는 혼잣말   // 배열이면 사람이 한 말
    el.sub.innerHTML = ''; lines.slice(0, 2).forEach(s => { const sp = document.createElement('span'); sp.textContent = s; el.sub.appendChild(sp); });
    el.sub.classList.add('show'); clearTimeout(subtitle.t); subtitle.t = setTimeout(() => el.sub.classList.remove('show'), dur || 3400);
  }
  function toast(s) { el.toast.innerHTML = window.EMO ? EMO(s) : s; el.toast.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.toast.classList.remove('show'), 1400); }
  function saveRun() { store(SAVE, { x: G.cpX, z: G.cpZ, oil: Math.round(G.oil), seed: G.seed, found: [...W.found], taken: [...W.taken], lamps: [...W.lampTaken], charms: [...W.charmTaken], used: [...W.used], salt: G.salt, mis: G.mis, candles: G.candles || 0 }); }

  // ── 서낭당 미션 — 처음 닿으면 다음 서낭당까지 할 일을 하나 준다. 해내면 소금·기름 ──
  const MISSIONS = [{ k: 'relic', n: 3, ic: '💍' }, { k: 'candle', n: 3, ic: '🕯️' }, { k: 'lamp', n: 3, ic: '🏮' }, { k: 'relic', n: 3, ic: '💍' }];
  const SHRINES = W.MARKS.filter(m => m.cp);
  const misCount = k => k === 'relic' ? PROPS.relicCount() : k === 'candle' ? (G.candles || 0) : W.lampTaken.size;
  function showMis() {
    if (!G.mis) { el.mis.hidden = true; return; }
    const M = MISSIONS[G.mis.i]; el.mis.hidden = false; el.misIc.textContent = M.ic;
    el.misN.textContent = Math.max(0, Math.min(M.n, misCount(M.k) - G.mis.base)) + '/' + M.n;
  }
  function startMission(m) {
    const i = SHRINES.indexOf(m); if (i < 0 || W.used.has('M' + i) || (G.mis && G.mis.i === i)) return;
    const M = MISSIONS[i]; G.mis = { i, base: misCount(M.k) }; showMis();
    el.mis.classList.remove('hot'); void el.mis.offsetWidth; el.mis.classList.add('hot');
    setTimeout(() => { if (G.mis && G.mis.i === i) toast('⛩ ' + M.ic + ' × ' + M.n); }, 2700);
  }
  function misTick() {
    if (!G.mis) return;
    const M = MISSIONS[G.mis.i], got = misCount(M.k) - G.mis.base;
    if (el.misN._v !== got) { el.misN._v = got; showMis(); }
    if (got >= M.n) {
      W.used.add('M' + G.mis.i); G.mis = null; showMis();
      A.clear(); addSalt(3); G.oil = 100; setLamp(true);
      toast('MISSION CLEAR   🧂 +3   🏮'); saveRun();
    }
  }

  function place(x, z) {
    P.x = x; P.z = z; P.speed = 0; P.st = 100; P.sink = 0;
    HERO.once = null; HERO.holdName = null; HERO.holdT = 0; HERO.cur = ''; if (HERO.act && HERO.act.idle) playHero('idle');   // 붙잡힐 때 건 넘어지기(99초)가 남아 리트라이하면 누운 채 시작했다(2026-09-16)
    P.yaw = camYaw = 0;
    G.ghost = 'away'; G.gT = 0; G.grain = 0; G.holy = false; G.hidden = null; G.busy = 0; G.saltPend = null; G.hairBurn = null; UNCLE.reset(); G.grip = 0; G.banishT = -1;
    G.strike = -1; G.cool = 0; G.omenT = 12; G.kind = ''; G.blackT = G.flickT = G.spike = G.glim = 0; G.hushed = false; G.hairHit = true; OMEN.clear(); A.unhush();
    ghost.hideHands(); ghost.hideBody(); ghost.hideFar(); ghost.hideGrip(); G.wheel = null;
    el.grain.style.opacity = 0; el.dread.style.opacity = 0;
    W.reset(); W.ensure(z);
    W.setDawn(0); END.orbs.forEach(o => { o.t = -1; o.s.visible = false; }); END.motes.forEach(m => { m.t = -1; m.s.visible = false; }); END.stage = 0;
    ECHO.t = -1; if (ECHO.root) ECHO.root.visible = false; KID.host = null; playKid('idle');
    if (KID.root) KID.root.visible = true; tintKid(0); ghost.body.scale.setScalar(1); el.flash.style.opacity = 0; END.black = false; END.lunge = 0; END.drag = false; END.boltT = 0; boltEl.style.opacity = 0;
    P.y = W.groundH(x, z);
    camera.position.set(x, P.y + 2.5, z - 4.6);
  }

  function start(fresh) {
    A.unlock();
    PROPS.SLUICE.forEach(sl => { sl.prog = 0; sl.k = 0; });
    if (fresh) { W.found.clear(); W.taken.clear(); W.lampTaken.clear(); W.charmTaken.clear(); W.used.clear(); G.oil = 100; G.salt = 3; G.items = 0; G.mis = null; G.candles = 0; G.cpX = W.HOME.x; G.cpZ = W.HOME.z; /* 출발은 강가 작은 집 마당 */ G.seed = (Math.random() * 1e9) | 0 || 7; }
    else { const s = load(SAVE); if (s) { W.found = new Set(s.found || []); W.taken = new Set(s.taken || []); W.lampTaken = new Set(s.lamps || []); W.charmTaken = new Set(s.charms || []); W.used = new Set(s.used || []); G.mis = s.mis || null; G.candles = s.candles || 0; G.oil = s.oil != null ? s.oil : 100; G.salt = s.salt != null ? Math.max(2, s.salt) : 3; G.cpX = s.x; G.cpZ = s.z; G.items = W.taken.size; G.seed = s.seed || 7; } }
    W.charms = W.pickCharms(G.seed); G.charms = W.charmTaken.size;
    G.lamp = true; setLamp(true);
    place(G.cpX, G.cpZ);
    el.item.textContent = G.charms + '/' + W.CHARM_N;
    G.state = 'play'; G.endT = 0; G.ended = false; G.grabs = 0; G.lunges = 0; showMis();
    el.title.classList.add('hide'); el.over.classList.remove('show'); el.topbar.classList.add('show'); el.keys.classList.add('show'); document.body.classList.add('playing');
    saveRun();
  }
  function showTitle() {
    G.state = 'title'; W.found.clear(); W.taken.clear(); W.lampTaken.clear(); W.charmTaken.clear(); W.used.clear(); W.charms = W.pickCharms(1); G.charms = 0;
    place(W.HOME.x, W.HOME.z); G.oil = 100;
    el.title.classList.remove('hide'); el.over.classList.remove('show'); el.topbar.classList.remove('show'); el.keys.classList.remove('show'); document.body.classList.remove('playing');
    const s = load(SAVE); el.goCont.hidden = !(s && s.z > 4);
    el.titleBest.textContent = best > 20 ? 'BEST  ' + Math.round(best) + 'm' : '';
  }
  function resultRows() { el.overDist.textContent = Math.max(0, Math.round(P.z)) + 'm'; el.overItem.textContent = G.charms + '/' + W.CHARM_N; $('overRelic').textContent = PROPS.relicCount() + '/' + PROPS.RELIC_N; $('overTrace').textContent = G.items + '/' + W.TRACE_N;el.overBest.textContent = Math.round(best) + 'm'; }
  function gameOver() {
    G.state = 'over'; A.gameover(); A.heart(false); A.setDeep(0); ghost.hideGrip();
    el.over.classList.remove('clear', 'true'); el.overH.textContent = 'GAME OVER'; el.overBtn.textContent = 'RETRY';
    resultRows(); G.grain = 0; el.grain.style.opacity = 0;
    setTimeout(() => el.over.classList.add('show'), 600);
    document.body.classList.remove('playing');
    saveRun();
  }
  // ── 엔딩 ──
  // 부적 8 + 흔적 5 를 들고 발원지에 닿으면: 동생이 달려오고, 물 건너 물귀신이 둘을 본다.
  // 유품 28 을 다 모았으면(진엔딩) 유품이 빛이 되어 물귀신에게 돌아가고, 물귀신은 따뜻한 빛으로 풀려 올라가며 날이 밝는다.
  // 아니면 물귀신은 끝내 말없이 물속으로 가라앉고, 밤은 그대로다.
  const END = { kx: 0, kz: 0, gx: 0, gz: 0, stage: 0, orbs: [], motes: [] };
  { const mat = new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xffd98a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 28; i++) { const s = new THREE.Sprite(mat.clone()); s.visible = false; s.renderOrder = 5; scene.add(s); END.orbs.push({ s, t: -1, delay: 0, from: new THREE.Vector3(), to: new THREE.Vector3() }); }
    for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(mat.clone()); s.visible = false; s.renderOrder = 5; scene.add(s); END.motes.push({ s, t: -1, v: new THREE.Vector3() }); } }
  const _v = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  function beginEnding() {
    G.state = 'clear'; G.endT = 0; G.ended = false; G.trueEnd = PROPS.relicCount() >= PROPS.RELIC_N;
    A.heart(false); A.setDeep(0); ghost.hideBody(); ghost.hideFar(); G.ghost = 'away'; G.banishT = -1; G.strike = -1; G.hushed = false; G.glim = G.blackT = G.flickT = 0; OMEN.clear(); A.unhush();
    G.gNear = 99; G.grain = 0; el.grain.style.opacity = 0; el.dread.style.opacity = 0;
    END.stage = 0; END.way = undefined; if (W.kid) { W.kid.getWorldPosition(_v); END.kx = _v.x; END.kz = _v.z; }
    // 동생은 달려와 오빠 바로 앞에 선다 — 그리고 물귀신으로 변한다
    { // 동생이 설 자리 — 오빠 둘레 1.4m 가운데 바위에서 가장 먼 곳. 카메라는 둘을 가리지 않는 쪽 옆에서
      const clr = (x, z) => W.rocks.reduce((mn, r) => Math.min(mn, Math.hypot(x - r.x, z - r.z) - Math.max(0, r.r - 1.7) * 1.35 - .4), 99);
      let best = -1e9;
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, x = P.x + Math.sin(a) * 1.4, z = P.z + Math.cos(a) * 1.4; const sc = Math.min(clr(x, z), 4) + (z > P.z ? .3 : 0); if (sc > best) { best = sc; END.tx = x; END.tz = z; } }
      const ux = (END.tx - P.x) / 1.4, uz = (END.tz - P.z) / 1.4, mx = (P.x + END.tx) / 2, mz = (P.z + END.tz) / 2;
      let bs = -1e9; END.camS = 1;
      for (const sg of [1, -1]) { let mn = 99; for (let k = 1; k <= 6; k++) { const f = k / 6 * 3.6; mn = Math.min(mn, clr(mx - uz * sg * f, mz + ux * sg * f)); } if (mn > bs) { bs = mn; END.camS = sg; } }
    }
    END.t1 = END.t2 = END.t3 = END.t4 = 0; END.flip = 0; END.black = false; END.arriveT = 0; END.lunge = undefined;
    document.body.classList.remove('playing'); el.keys.classList.remove('show');
  }
  function endingTick(dt, t) {
    const E = END; G.endT += dt; const T = G.endT;
    // 동생 — 2.2초부터 달려와 1.1m 앞에 선다
    const turnTo = (cur, x, z, fx, fz, k) => { let a = Math.atan2(x - fx, z - fz) - cur; a = Math.atan2(Math.sin(a), Math.cos(a)); return cur + a * Math.min(1, dt * k); };
    if (W.kid && T > 2.2) {   // 동생이 달려와 내 옆에 선다 — 발원지 둘레 바위 틈으로 먼저 빠져나온다
      if (E.way === undefined) { _v.set(2.4, 0, -3.4); W.kid.parent.localToWorld(_v); E.way = { x: _v.x, z: _v.z }; }
      if (E.way && Math.hypot(E.way.x - E.kx, E.way.z - E.kz) < .4) E.way = null;
      const gx = E.way ? E.way.x : E.tx, gz = E.way ? E.way.z : E.tz;
      const dx = gx - E.kx, dz = gz - E.kz, d = Math.hypot(dx, dz) + (E.way ? 1 : 0);
      const dd = Math.hypot(dx, dz); if (dd > .05) { const sp = Math.min(dd, dt * 2.9); E.kx += dx / dd * sp; E.kz += dz / dd * sp; }
      playKid(d > .3 ? 'run' : 'idle', 1.1);
      if (d <= .3 && !E.arriveT) E.arriveT = T;   // 오빠 앞에 닿은 때
      _v.set(E.kx, W.groundH(E.kx, E.kz), E.kz); W.kid.parent.worldToLocal(_v); W.kid.position.copy(_v);
      E.kyaw = d > .3 ? Math.atan2(dx, dz) : turnTo(E.kyaw || 0, P.x, P.z, E.kx, E.kz, 3);   // 서서는 오빠를 올려다본다
      W.kid.rotation.y = E.kyaw - (W.kid.parent.rotation.y || 0);
      P.yaw = turnTo(P.yaw, E.kx, E.kz, P.x, P.z, 3);
    }
    G.blackT = Math.max(0, G.blackT - dt);
    if (E.boltT > 0) {   // 번개 — 번쩍·꺼짐·번쩍 뒤 스러진다. 하늘빛을 잠깐 크게 올린다
      E.boltT -= dt; const u = .7 - E.boltT;
      const f = u < .07 ? 1 : u < .15 ? .15 : u < .24 ? .85 : Math.max(0, 1 - (u - .24) / .46) * .5;
      boltEl.style.opacity = (f * .75).toFixed(3); W.lights.hemi.intensity = 1.45 + f * 7;
      if (E.boltT <= 0) { boltEl.style.opacity = 0; if (!(G.trueEnd && E.stage >= 4)) W.lights.hemi.intensity = 1.45; }
    }
    const gy = W.groundH(E.kx, E.kz);
    // 5.4초 — 고요. 풀벌레도 물소리도 끊기고, 동생 얼굴빛이 조금씩 물빛으로 식는다
    if (E.stage === 0 && T > 5.4 && E.arriveT && T > E.arriveT + 1.3) { E.stage = 1; E.t1 = T; E.nextFlip = T + 1.3; bolt();   /* 변신 전에 천둥번개가 먼저 친다(09-16) */ A.hush(40); A.heart(true); }
    if (E.stage === 1) {
      tintKid(Math.min(1, (T - E.t1) / 1.2));
      if (T > E.nextFlip) {   // 등불이 꺼졌다 켜질 때마다 동생과 물귀신이 번갈아 보인다
        E.flip++; E.nextFlip = T + Math.max(.16, .6 - E.flip * .09);
        if (E.flip === 1 && A.girlScream) A.girlScream();   // 처음 뒤바뀌는 순간 — 동생이 비명을 지르고, 그 소리가 귀신 소리로 뒤틀린다
        G.blackT = .13; el.flash.style.opacity = .97; setTimeout(() => { if (!END.black) el.flash.style.opacity = 0; }, 110); A.blink();
        const ghostNow = E.flip % 2 === 1 || E.flip >= 6;
        if (KID.root) KID.root.visible = !ghostNow;
        if (ghostNow) { ghost.body.scale.setScalar(Math.min(1, .5 + E.flip * .09)); ghost.bodyAt(E.kx, gy, E.kz, t, 'scream'); ghost.body.rotation.y = Math.atan2(P.x - E.kx, P.z - E.kz); } else ghost.hideBody();
        if (E.flip >= 6) { E.stage = 2; E.t2 = T; ghost.body.scale.setScalar(1); A.wail(); A.whisper(); G.shake = .9; bolt(); }
      }
    }
    if (E.stage >= 2 && E.stage < 4 && !E.lunge) { ghost.bodyAt(E.kx, gy, E.kz, t, 'zidle'); ghost.body.rotation.y = Math.atan2(P.x - E.kx, P.z - E.kz); }   // 동생이 섰던 자리에 그대로 서서 오빠를 본다
    if (!G.trueEnd) {
      // 1.7초 뒤 — 동생이었던 물귀신이 오빠의 머리채를 잡아 넘어뜨리고 샘 가운데로 끌고 가 함께 가라앉는다 (2026-09-16 사장님)
      if (E.stage === 2 && T > E.t2 + 1.7) {
        E.stage = 3; E.drag = true; E.lunge = 1;   // lunge: 선 채로 서 있는 동작을 더는 덮어쓰지 않게
        const dx = E.kx - P.x, dz = E.kz - P.z, l = Math.hypot(dx, dz) || 1; G.dragX = dx / l; G.dragZ = dz / l;   // 동생이 섰던 쪽 — 샘 가운데로
        G.ghost = 'grab'; G.gT = 0; G.grip = 0; P.speed = 0; P.yaw = Math.atan2(-G.dragX, -G.dragZ);
        heroAct('fallback', 1.35, 99); A.grab(); A.pull(); A.wail(); A.heart(true); spawnFoam(P.x, P.z, 14, true);
        G.shake = 1.4; el.flash.style.opacity = .95; setTimeout(() => { if (!END.black) el.flash.style.opacity = 0; }, 70);
      }
      if (E.stage === 3 && G.ghost === 'grab') {
        G.gT += dt; P.sink = Math.min(HERO.clips ? .1 : .2, P.sink + dt * .4);
        dragStep(G.gT < .7 ? 0 : Math.min(1, (G.gT - .7) / .5) * 1.5, dt);
        const gx = P.x + G.dragX * 1.15, gz = P.z + G.dragZ * 1.15, wy = W.height(gx, gz, t);
        ghost.bodyAt(gx, wy - 2.0 + Math.min(1, G.gT / .18) * 1.72 + Math.sin(t * 3) * .03, gz, t, 'drag'); gripHair(gx, gz, .95);
        if (G.gT > 3.0) { G.ghost = 'drown'; G.gT = 0; A.drown(); A.heart(false); }
      } else if (E.stage === 3 && G.ghost === 'drown') {
        G.gT += dt; P.sink = Math.min(.9, P.sink + dt * .45);
        dragStep(1.2, dt);
        const gx = P.x + G.dragX * 1.15, gz = P.z + G.dragZ * 1.15, wy = W.height(gx, gz, t);
        ghost.bodyAt(gx, wy - .28 - G.gT * .95, gz, t, 'drag'); gripHair(gx, gz, .55 - G.gT * .5);
        if (G.gT > 2.3 && !E.black) { E.black = true; el.flash.style.background = '#000'; el.flash.style.opacity = 1; ghost.hideBody(); }
        if (G.gT > 3.4 && !G.ended) { G.ended = true; allClear(); }
      }
    } else {
      // 진엔딩 — 모은 유품이 빛이 되어 동생에게 돌아가고, 동생은 따뜻한 빛으로 풀려난다. 날이 밝는다
      if (E.stage === 2 && T > E.t2 + 1.6) { E.stage = 3; E.t3 = T; A.unhush(); A.heart(false); E.orbs.forEach((o, i) => { o.t = 0; o.delay = i * .075; o.from.set(P.x, P.y + 1, P.z); o.to.set(E.kx, gy + 1.5, E.kz); }); }
      if (E.stage === 3 && T > E.t3 + 3.2) { E.stage = 4; E.t4 = T; ghost.releaseBody(); A.release(); }
      if (E.stage === 4 && T > E.t4 + 1.2) { E.stage = 5; E.motes.forEach((m, i) => { m.t = -i * .06; m.s.position.set(E.kx + (Math.random() - .5) * .6, gy + Math.random() * 1.8, E.kz + (Math.random() - .5) * .6); m.v.set((Math.random() - .5) * .3, .5 + Math.random() * .7, (Math.random() - .5) * .3); }); }
      if (E.stage >= 4) W.setDawn((T - E.t4) / 6);
      if (E.stage >= 5 && T > E.t4 + 8 && !G.ended) { G.ended = true; allClear(); }
    }
    for (const o of E.orbs) {
      if (o.t < 0) continue;
      o.t += dt; const k = (o.t - o.delay) / 1.3;
      if (k < 0) continue;
      if (k >= 1) { if (o.s.visible) { A.pick(); o.s.visible = false; } o.t = -1; continue; }
      o.s.visible = true; o.s.position.lerpVectors(o.from, o.to, k); o.s.position.y += Math.sin(k * Math.PI) * 1.6;
      const sc = .28 + Math.sin(t * 9 + o.delay * 40) * .06; o.s.scale.set(sc, sc, 1); o.s.material.opacity = Math.min(1, k * 4) * (1 - Math.max(0, k - .85) * 6);
    }
    for (const m of E.motes) {
      if (m.t === -1 && !m.s.visible && E.stage < 5) continue;
      m.t += dt; if (m.t < 0) continue;
      if (m.t > 4) { m.s.visible = false; continue; }
      m.s.visible = true; m.s.position.addScaledVector(m.v, dt); const sc = .12 + Math.sin(m.t * 6) * .03; m.s.scale.set(sc, sc, 1); m.s.material.opacity = Math.min(1, m.t * 2) * Math.max(0, 1 - m.t / 4);
    }
  }
  // 엔딩 번개 — 천둥 소리 + 하얗게 번쩍 (2026-09-16 사장님 "천둥번개도 같이")
  const boltEl = document.createElement('div');
  boltEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:4;background:radial-gradient(ellipse at 50% 20%,#f4f8ff,#b8c8dc 70%);mix-blend-mode:screen';
  document.body.appendChild(boltEl);
  function bolt() { END.boltT = .7; A.thunder(); G.shake = Math.max(G.shake, .6); }
  function allClear() {
    G.state = 'clear'; A.clear(); A.heart(false); A.setDeep(0);
    el.over.classList.add('clear'); el.overH.textContent = G.trueEnd ? 'TRUE END' : 'ALL CLEAR'; el.overBtn.textContent = 'START'; el.over.classList.toggle('true', !!G.trueEnd);
    best = Math.max(best, P.z); store(BEST, best); resultRows();
    try { localStorage.removeItem(SAVE); } catch (e) { }
    setTimeout(() => { el.over.classList.add('show'); el.flash.style.opacity = 0; }, 1200);
    document.body.classList.remove('playing');
  }
  el.overBtn.addEventListener('click', () => { if (G.state === 'clear') start(true); else start(false); });
  el.goStart.addEventListener('click', () => showStory(() => start(true)));
  el.goCont.addEventListener('click', () => start(false));

  // ── 프롤로그 — 시작을 누르면 비 오는 밤, 이야기가 한 장씩 떠오르고 소년이 강가로 나선다 ──
  const STORY = EN ? [   // 한 장에 한 줄 — 짧게 끊어 읽힌다
    ['There was a legend about that river.'],
    ["It barely came up to a grown man's knees,"],
    ['yet every year, people drowned in it.'],
    ['Whispers began of a water ghost.'],
    ['A brother and his little sister lived'],
    ['in a small house beside that river.'],
    ['One day, in a pouring storm,'],
    ['the little sister went out to the yard'],
    ['and never came back.'],
    ['Not the next day. Nor the day after……'],
    ['The boy sets out along the dark river'],
    ['to find his sister.'],
  ] : [
    ['그 강에는 전설이 있었다'],
    ['겨우 어른 무릎 높이밖에 차지 않는'],
    ['얕은 강인데도 불구하고'],
    ['매년 사람들이 익사해서 죽어 나갔다'],
    ['물귀신이 있다는 소문이 돌기 시작했다'],
    ['그 강 옆 작은 집에서 살던 남매가 있었다'],
    ['폭우가 쏟아진 어느 날'],
    ['마당에 나갔던 여동생은'],
    ['영영 돌아오지 않았다'],
    ['다음 날도 그다음 날도……'],
    ['소년은 여동생을 찾으러'],
    ['어두운 강가로 나선다'],
  ];
  const STORM = STORY.findIndex(p => /폭우|pouring storm/.test(p[0]));   // 번개가 치는 장
  const SS = { on: false, page: -1, t: 0, hold: 0, done: null, drops: [], raf: 0, flashT: 0 };
  const storyEl = $('story'), storyText = $('storyText'), rainCv = $('rain'), rainC = rainCv.getContext('2d');
  function showStory(done) {
    if (SS.on) return;
    A.unlock(); SS.on = true; SS.done = done; SS.page = -1; SS.last = performance.now();
    el.title.classList.add('hide'); storyEl.classList.add('show'); A.rain(true);
    SS.drops = []; for (let i = 0; i < 260; i++) SS.drops.push({ x: Math.random(), y: Math.random(), v: .9 + Math.random() * .8, l: .03 + Math.random() * .05, a: .12 + Math.random() * .3 });
    storyPage(0, 1.1);
    cancelAnimationFrame(SS.raf); SS.raf = requestAnimationFrame(storyLoop);
  }
  function storyPage(i, delay) {
    SS.page = i; storyText.classList.remove('out'); storyText.innerHTML = '';
    if (i >= STORY.length) return endStory();
    const lines = STORY[i]; let chars = 0;
    lines.forEach((s, k) => { const sp = document.createElement('span'); sp.textContent = s; storyText.appendChild(sp); setTimeout(() => { if (SS.on && SS.page === i) sp.classList.add('on'); }, (delay + k * 1.1) * 1000); chars += s.length; });
    SS.t = 0; SS.hold = delay + (lines.length - 1) * 1.1 + 1.6 + chars * (EN ? .045 : .075);   // 읽을 만큼 머문다
    if (i === STORM) setTimeout(() => { if (SS.on && SS.page === STORM) { SS.flashT = .5; A.thunder(); } }, 300);   // 폭우 — 번개
  }
  function nextPage() {
    if (!SS.on) return;
    storyText.classList.add('out'); const i = SS.page; SS.page = -2;   // 나가는 중
    setTimeout(() => { if (SS.on) storyPage(i + 1, .35); }, 900);
  }
  function endStory() {
    if (!SS.on) return;
    SS.on = false; A.rain(false); storyEl.classList.remove('show'); cancelAnimationFrame(SS.raf);
    setTimeout(() => { storyText.innerHTML = ''; rainC.clearRect(0, 0, rainCv.width, rainCv.height); }, 1300);
    if (SS.done) SS.done();
  }
  function storyLoop(now) {
    if (!SS.on) return;
    const dt = Math.min(.05, (now - SS.last) / 1000); SS.last = now;
    if (SS.page >= 0) { SS.t += dt; if (SS.t > SS.hold) nextPage(); }
    storyTick(dt);
    SS.raf = requestAnimationFrame(storyLoop);
  }
  function storyTick(dt) {   // 비 줄기 · 번개
    const w = rainCv.width = Math.max(1, rainCv.clientWidth), h = rainCv.height = Math.max(1, rainCv.clientHeight);
    rainC.clearRect(0, 0, w, h); rainC.lineWidth = 1.2; rainC.lineCap = 'round';
    for (const d of SS.drops) {
      d.y += d.v * dt * 1.6; d.x -= d.v * dt * .18; if (d.y > 1.05) { d.y = -.08; d.x = Math.random() * 1.1; }
      rainC.strokeStyle = `rgba(170,196,214,${d.a})`; rainC.beginPath(); rainC.moveTo(d.x * w, d.y * h); rainC.lineTo((d.x + d.l * .12) * w, (d.y - d.l) * h); rainC.stroke();
    }
    if (SS.flashT > 0) { SS.flashT -= dt; const k = SS.flashT > .38 ? .85 : SS.flashT > .3 ? .1 : SS.flashT > .22 ? .6 : Math.max(0, SS.flashT * 1.5); $('storyFlash').style.opacity = k; }
    else $('storyFlash').style.opacity = 0;
  }
  storyEl.addEventListener('pointerdown', e => { e.preventDefault(); if (SS.page >= 0) nextPage(); });
  $('storySkip').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); endStory(); });

  // ── 등불 ──
  // 켜면 길과 부적이 보이지만 물귀신이 더 자주 찾아온다. 끄면 기름도 줄지 않는다.
  function setLamp(on) {
    G.lamp = !!on && G.oil > 0;
    el.btnLamp.classList.toggle('on', G.lamp);
    el.oil.classList.toggle('off', !G.lamp);
  }
  function toggleLamp() { if (G.state !== 'play') return; if (!G.lamp && G.oil <= 0) return; setLamp(!G.lamp); A.lamp(); }

  // ── 입력 ──
  const keys = {};
  // 행동 단추 하나 — 평소엔 소금을 뿌리고, 붙잡혔을 땐 발버둥친다
  function action() {
    if (G.state !== 'play') return;
    if (G.ghost === 'grab') struggle(); else throwSalt();
  }
  // 수문 바퀴 — 손잡이를 끼운 바퀴 곁에서 단추를 누르면 그만큼 돌아간다
  function crank() {
    if (!G.wheel) return false;
    P.yaw = Math.atan2(G.wheel.x - P.x, G.wheel.z - P.z); P.speed = 0;   // 바퀴를 마주 본다
    G.wheel.turn = (G.wheel.turn || 0) + 1;
    el.mash.classList.remove('hit'); void el.mash.offsetWidth; el.mash.classList.add('hit');
    return true;
  }
  // 점프 — 발이 바닥에 닿아 있을 때만. 물속에서는 몸이 무거워 낮게 뛴다
  function jump() {
    if (G.state !== 'play' || P.air || G.busy > 0 || G.hidden || G.ghost === 'grab' || G.ghost === 'drown') return;
    if (P.y - W.groundH(P.x, P.z) > .3) return;   // 이미 떠 있으면 두 번 뛰지 못한다
    P.air = true; P.jv = P.dry ? 5.1 : 3.6; P.st = Math.max(0, P.st - 5);
    if (P.dry) A.sprint(); else A.splash(.8);
  }
  addEventListener('keydown', e => {
    if (e.repeat) { if (e.code === 'Space') e.preventDefault(); return; }
    if (G.menu) return;   // 지도·인벤토리 — 게임 조작은 멈춘다
    keys[e.code] = true;
    if (SS.on) { if (e.code === 'Escape') endStory(); else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (SS.page >= 0) nextPage(); } return; }   // 프롤로그 — 넘기기·건너뛰기
    if (e.code === 'Space') { e.preventDefault(); if (G.state === 'play') { if (G.ghost === 'grab') struggle(); else if (!crank()) jump(); } else if (G.state === 'title') (el.goCont.hidden ? el.goStart : el.goCont).click(); else el.overBtn.click(); }
    if (e.code === 'KeyF') { e.preventDefault(); if (G.state === 'play') action(); }
    if (e.code === 'KeyE') { e.preventDefault(); toggleLamp(); }
    if (e.code === 'KeyK') { const on = A.toggle(); $('btnSfx').classList.toggle('off', !on); }
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  $('btnSfx').addEventListener('click', () => { const on = A.toggle(); $('btnSfx').classList.toggle('off', !on); }); if (!A.on) $('btnSfx').classList.add('off');
  const camDrag = { id: null, x: 0, end: -9 };   // 화면 끌기로 시점 돌리기 — 폰 표준(2026-09-16 사장님 "모바일에서 시점돌리기가 안되네")
  canvas.addEventListener('pointerdown', e => { A.unlock(); if (G.state !== 'play') return; if (camDrag.id === null) { camDrag.id = e.pointerId; camDrag.x = e.clientX; } if (G.ghost === 'grab') struggle(); else crank(); });
  addEventListener('pointermove', e => { if (camDrag.id !== e.pointerId) return; const dx = e.clientX - camDrag.x; camDrag.x = e.clientX; if (G.state === 'play' && !G.menu) camYaw -= dx * .0065; });
  { const up = e => { if (camDrag.id !== e.pointerId) return; camDrag.id = null; camDrag.end = G.t; }; addEventListener('pointerup', up); addEventListener('pointercancel', up); }   // 붙잡혔을 땐 화면 어디를 눌러도 발버둥 · 수문 앞에서는 바퀴를 돌린다
  el.btnSalt.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); A.unlock(); action(); });
  const joy = { dx: 0, dy: 0, id: null };
  { const pad = $('pad'), knob = $('knob'); let padId = null;
    const padMove = e => { const r = pad.getBoundingClientRect(), R = r.width / 2, max = R - knob.offsetWidth / 2; const mx = e.clientX - (r.left + R), my = e.clientY - (r.top + R), d = Math.hypot(mx, my), sc = d > max ? max / d : 1; const kx = mx * sc, ky = my * sc; knob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)'; let nx = kx / max, ny = ky / max; if (Math.hypot(nx, ny) < .08) nx = ny = 0; joy.dx = nx; joy.dy = ny; joy.id = 'pad'; };
    const padEnd = e => { if (padId !== e.pointerId) return; padId = null; pad.classList.remove('on'); knob.style.transform = ''; joy.dx = joy.dy = 0; joy.id = null; };
    pad.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (padId !== null) return; padId = e.pointerId; try { pad.setPointerCapture(padId); } catch (_) { } pad.classList.add('on'); padMove(e); A.unlock(); });
    pad.addEventListener('pointermove', e => { if (padId !== e.pointerId) return; e.stopPropagation(); padMove(e); });
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd); pad.addEventListener('lostpointercapture', padEnd); }
  let tRun = false;
  el.btnRun.addEventListener('pointerdown', e => { e.preventDefault(); tRun = true; el.btnRun.classList.add('on'); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.btnRun.addEventListener(ev, () => { tRun = false; el.btnRun.classList.remove('on'); }));
  el.btnLamp.addEventListener('pointerdown', e => { e.preventDefault(); A.unlock(); toggleLamp(); });
  el.btnJump.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); A.unlock(); if (G.ghost === 'grab') struggle(); else if (!crank()) jump(); });
  let rotSkipped = false;
  function syncRot() { const w = innerWidth, h = innerHeight; if (w < 10 || h < 10) return; document.body.classList.toggle('portrait', isTouch && !rotSkipped && h > w * 1.02); }
  $('rotGo').addEventListener('click', () => { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', e => { e.preventDefault(); rotSkipped = true; syncRot(); });
  function onResize() { renderer.setSize(vw(), vh()); camera.aspect = vw() / vh(); camera.updateProjectionMatrix(); syncRot(); }
  addEventListener('resize', onResize); syncRot();

  // ── 물귀신 ──
  // 거의 보이지 않는다. 대부분은 징조 — 멀리 스쳤다 사라지는 흰 형체, 다가오다 멈추는 발소리, 떠내려오는 머리카락,
  // 골짜기의 흥얼거림, 뚝 끊기는 풀벌레 소리. 부적·흔적을 손에 넣는 결정적인 순간에만 온다.
  // 올 때는 한 번 크게: 등불이 깜빡일 때마다 가까워지거나(깜빡 다가옴), 고요 끝에 코앞 물속에서 솟는다(솟구침).
  const gPos = new THREE.Vector3(), camDir = new THREE.Vector3(), toG = new THREE.Vector3();
  const DARK = 18;   // 등불을 끄면 이보다 먼 물귀신은 어둠에 묻혀 보이지 않는다
  const COOL = 55;   // 한 번 덮친 뒤 이만큼은 다시 오지 않는다
  function seenAt(x, y, z) {   // 0 = 화면 밖, 1 = 화면 한가운데
    gPos.set(x, y, z);
    camera.getWorldDirection(camDir);
    toG.copy(gPos).sub(camera.position);
    if (toG.dot(camDir) <= 0) return 0;
    const p = gPos.clone().project(camera);
    if (!(Math.abs(p.x) <= .95) || !(Math.abs(p.y) <= 1.05)) return 0;
    return Math.max(.25, 1 - Math.abs(p.x) * .6);
  }
  function ghostSeen() {
    if (G.ghost !== 'stalk' || !ghost.far.visible) return 0;
    return seenAt(G.gx, ghost.far.position.y + ghost.farH * .62, G.gz);   // 가슴께
  }
  function footY(x, z) { const gy = W.groundH(x, z), wy = W.height(x, z, G.t); return gy > wy + .1 ? gy - .08 : wy - .5; }   // 물에선 소복 자락이 무릎께까지 잠긴다
  // 보는 쪽에서 a 라디안 비낀 방향으로 dist — 물길을 벗어나지 않게
  function spotAhead(dist, a) {
    const yaw = camYaw + a, x = P.x + Math.sin(yaw) * dist, z = P.z + Math.cos(yaw) * dist;
    if (z < -20) return null;
    const c = W.cx(z), lim = W.hw(z) + 10;
    return { x: c + Math.max(-lim, Math.min(lim, x - c)), z };
  }
  function ghostAppear(x, z) {
    G.gx = x; G.gz = z; G.gy = footY(x, z);
    G.ghost = 'stalk'; G.gT = 0; G.stare = 0; G.glim = 0;
    ghost.showFar(G.gx, G.gz, P.x, P.z, true, G.gy);
  }
  function strikeEnd(quiet) { G.strike = -1; G.kind = ''; G.cool = 0; G.hushed = false; G.omenT = quiet + Math.random() * 10; A.unhush(); }
  function ghostGone() {
    G.ghost = 'away'; G.gT = 0; ghost.sinkFar(); A.heart(false); strikeEnd(24);
  }
  function armStrike(delay, force) {   // 결정적인 순간 — 곧바로 오지 않고 몇 초 뒤, 고요가 먼저 온다
    if (G.state !== 'play' || G.ghost !== 'away' || G.strike >= 0) return;
    if (!force) { G.omenT = Math.min(G.omenT, 1.5); return; }   // 유품·부적 같은 순간엔 징조만 짙어진다 — 실제로 오는 건 어둠·물속일 때뿐
    G.strike = Math.max(delay, COOL * (force ? .35 : 1) - G.cool); G.hushed = false;   // 어둠·물속이 부르면 쉬는 틈이 짧다
  }
  function lurkAt(tw) {   // 숨은 돌탑 문밖에 서서 들여다본다
    ghostAppear(tw.x + tw.dx * 7.5, tw.z + tw.dz * 7.5); G.kind = 'lurk'; G.outT = 0; A.whisper(); G.spike = .45;
  }
  function beginStrike() {
    G.hushed = false; G.glim = 0; OMEN.steps = null;
    if (G.hidden) { A.unhush(); lurkAt(G.hidden); return; }
    const ambush = G.force ? G.force === 'ambush' : G.lastKind === 'blink' ? Math.random() < .65 : Math.random() < .3;   // 같은 수를 잘 안 되풀이한다
    G.force = '';
    if (ambush) {   // 솟구침 — 코앞 물속에서 솟아 얼굴을 들이민다
      const s = spotAhead(2.3, (Math.random() - .5) * .3);
      if (!s) return;
      ghostAppear(s.x, s.z); G.kind = G.lastKind = 'ambush'; G.gy -= 2.3; ghost.moveFar(G.gx, G.gz, P.x, P.z, G.gy);
      A.unhush(); A.sting(); A.wail(); spawnFoam(s.x, s.z, 16, true);
      G.shake = 1.6; G.spike = 1;
      el.flash.style.background = '#cfdcdc'; el.flash.style.opacity = .55; setTimeout(() => { el.flash.style.opacity = 0; el.flash.style.background = '#000'; }, 70);
    } else {        // 깜빡 다가옴 — 멀리 서 있다가 등불이 꺼졌다 켜질 때마다 가까워진다
      let s = null;
      for (let k = 0; k < 4 && !s; k++) { const c = spotAhead(22 + Math.random() * 5, (Math.random() - .5) * .7); if (c && seenAt(c.x, footY(c.x, c.z) + 1.7, c.z) > 0) s = c; }
      s = s || spotAhead(22, 0); if (!s) return;
      ghostAppear(s.x, s.z); G.kind = G.lastKind = 'blink'; G.blink = 2.2;
      A.whisper(); G.spike = .5;
    }
  }
  function blinkStep() {
    const d = Math.hypot(P.x - G.gx, P.z - G.gz);
    G.blackT = .17; el.flash.style.opacity = .97; setTimeout(() => el.flash.style.opacity = 0, 160);
    if (d < 5.4 && !G.hidden) { ghostTake(); return; }
    const nd = Math.max(3.8, d * .56), sd = (Math.random() - .5) * 1.2;
    const ux = (G.gx - P.x) / d, uz = (G.gz - P.z) / d;
    G.gx = P.x + ux * nd - uz * sd; G.gz = P.z + uz * nd + ux * sd; G.gy = footY(G.gx, G.gz);
    ghost.moveFar(G.gx, G.gz, P.x, P.z, G.gy);
    A.blink(); G.spike = .75; G.shake = Math.max(G.shake, .5);
    G.blink = 1.5 - Math.min(.45, G.charms * .05) + Math.random() * .35;
  }

  // 징조 — 해를 끼치지 않는다. 있다는 것만 알린다
  const OMENS = { glimpse: 3, steps: 3, hair: 2, hum: 2, flicker: 2, splash: 1.4 };
  function omen(force) {
    let kind = force;
    if (!kind) {
      const list = Object.keys(OMENS).filter(k => k !== G.lastOmen);
      let r = Math.random() * list.reduce((a, k) => a + OMENS[k], 0);
      for (const k of list) { r -= OMENS[k]; if (r <= 0) { kind = k; break; } }
    }
    G.lastOmen = kind;
    if (kind === 'glimpse') {   // 눈가에 흰 형체가 스친다 — 똑바로 보면 없다
      const side = Math.random() < .5 ? -1 : 1;
      for (const a of [side, -side]) {
        const s = spotAhead(40 + Math.random() * 10, a * (.5 + Math.random() * .12)); if (!s) continue;
        const y = footY(s.x, s.z);
        if (seenAt(s.x, y + 1.7, s.z) <= 0) continue;
        G.glim = 1.15; G.gx = s.x; G.gz = s.z; G.gy = y; ghost.showFar(s.x, s.z, P.x, P.z, true, y);
        return;
      }
      return omen('hum');
    }
    if (kind === 'steps') {     // 보이지 않는 누군가가 걸어와 코앞에서 멈춘다
      const s = spotAhead(13, (Math.random() - .5) * .6); if (!s) return;
      OMEN.walk(s.x, s.z, () => ({ x: P.x, z: P.z }), (x, z, land) => {
        const d = Math.hypot(P.x - x, P.z - z); A.plop(land, Math.min(1.5, .35 + (13 - d) / 9));
        if (!land) spawnFoam(x, z, 3, false);
      }, () => { if (G.state !== 'play' || G.ghost !== 'away') return; A.whisper(); G.spike = .55; G.shake = Math.max(G.shake, .35); });
      return;
    }
    if (kind === 'hair') {      // 긴 머리카락이 떠내려온다
      const s = spotAhead(7, (Math.random() - .5) * .2);
      if (!s || W.groundH(s.x, s.z) > W.height(s.x, s.z, G.t) - .05) return omen('steps');
      OMEN.drift(s.x, s.z); G.hairHit = false; return;
    }
    if (kind === 'hum') { A.hum(); return; }
    if (kind === 'flicker') { G.flickT = 1.3; A.blink(); G.spike = .3; return; }
    if (kind === 'splash') { A.splash(.8); setTimeout(() => { if (G.state === 'play') A.whisper(); }, 650); return; }
  }
  // 덮치기 전 한 박자 — 코앞에 크게 "팍" 나타나 얼굴을 들이민 뒤 끌고 간다(2026-09-16 사장님 "뿅만 하고 안 보인다")
  const REVEAL_T = .85;
  function ghostReveal() {
    if (G.hidden) return;
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    G.ghost = 'reveal'; G.gT = 0; G.glim = 0;
    G.gx = P.x + fx * 1.25; G.gz = P.z + fz * 1.25; G.gy = footY(G.gx, G.gz);
    ghost.showFar(G.gx, G.gz, P.x, P.z, true, G.gy); ghost.far.rotation.y = Math.atan2(P.x - G.gx, P.z - G.gz); ghost.playFar('scream', 1.3);   // 좀비팩 비명 — 얼굴을 정면으로 들이민다(공격 동작은 몸이 옆으로 틀어져 얼굴이 가렸다)
    P.speed = 0; P.yaw = Math.atan2(fx, fz);
    A.unhush(); (A.jump || A.sting)(); A.wail();
    G.shake = 2.4; G.spike = 1; G.blackT = 0;
    el.flash.style.background = '#e8f0f0'; el.flash.style.opacity = .7; setTimeout(() => { el.flash.style.opacity = 0; el.flash.style.background = '#000'; }, 60);
  }
  function ghostTake() {   // 덮친다 — 뒤에서 솟아 머리채를 잡아 넘어뜨리고 물 가운데로 끌고 간다. 발버둥쳐 뿌리칠 수 있다
    if (G.hidden) return;
    if (G.ghost !== 'reveal') return ghostReveal();
    G.ghost = 'grab'; G.gT = 0; G.grip = 0; ghost.hideFar();
    { let dx = W.cx(P.z) - P.x, dz = -4.5; if (Math.abs(dx) < 3) dx = (Math.random() < .5 ? -1 : 1) * 1.5; const l = Math.hypot(dx, dz); G.dragX = dx / l; G.dragZ = dz / l; }
    P.yaw = Math.atan2(-G.dragX, -G.dragZ); P.speed = 0;   // 등 뒤에서 머리채를 잡혀 뒤로 넘어진다 — 머리가 물귀신 쪽
    heroAct('fallback', 1.35, 99);
    A.grab(); A.pull(); A.wail(); spawnFoam(P.x, P.z, 14, true);
    G.shake = 1.4; el.flash.style.opacity = .95; setTimeout(() => el.flash.style.opacity = 0, 70);
  }
  const GRAB_TIME = 3.4;
  function dragStep(sp, dt) {   // 끌려가는 몸 — 바위에 걸리면 비껴 간다
    let nx = P.x + G.dragX * sp * dt, nz = P.z + G.dragZ * sp * dt;
    for (const r of W.rocks) { if (r.pass) continue; const d = Math.hypot(nx - r.x, nz - r.z), rr = r.r - 1.7; if (d < rr && d > .001) { nx = r.x + (nx - r.x) / d * rr; nz = r.z + (nz - r.z) / d * rr; } }
    P.x = nx; P.z = nz; P.yaw = Math.atan2(-G.dragX, -G.dragZ);   // 뒤로 넘어진 채 머리채를 잡혀 끌리니 머리가 앞선다
    if (sp > .2 && Math.random() < dt * 14) spawnFoam(P.x - G.dragX * .5 + (Math.random() - .5) * .6, P.z - G.dragZ * .5 + (Math.random() - .5) * .6, 2, true);
    G.dragSnd = (G.dragSnd || 0) - dt; if (sp > .2 && G.dragSnd <= 0) { G.dragSnd = .32 + Math.random() * .2; A.splash(.55 + Math.random() * .3); }
  }
  // 물귀신의 손을 아이 머리채에 얹는다 — 팔뚝은 물귀신 쪽으로 뻗는다. hy 는 물귀신 손이 잡은 높이
  const _head = new THREE.Vector3();
  function gripHair(gx, gz, hy) {
    const B = HERO.bone;
    if (HERO.on && B && B.head) { B.head.getWorldPosition(_head); }
    else _head.set(P.x + Math.sin(P.yaw) * .35, P.y + .55 - P.sink, P.z + Math.cos(P.yaw) * .35);
    ghost.gripAt(_head.x + G.dragX * .12, _head.y + .16, _head.z + G.dragZ * .12, gx, W.height(gx, gz, G.t) + hy, gz, G.t);   // 정수리 쪽 머리채를 쥔다 — 얼굴을 가리지 않게
    // 누운 소년 머리는 물속이라 손이 안 닿는다 — 머리채를 잡혀 상체가 들려 올라간다(발을 축으로 몸을 세운다)
    // 상체를 세우는 것만으로는 머리가 20cm 남짓밖에 안 올라가서(머리가 몸 축에 가깝다) 몸 전체도 들려 올라간다
    if (HERO.on && ghost.handFloorY != null) {
      G.hairTilt = .55;
      const noLift = _head.y - (G.hairLift || 0);                                    // 들어 올리기 전 머리 높이
      G.hairLiftT = Math.max(0, Math.min(.45, ghost.handFloorY - .16 - noLift));
    }
  }
  const gripNeed = () => Math.min(16, Math.round(6 + G.charms * .6 + G.grabs * 1.5));   // 부적이 늘수록, 여러 번 붙잡힐수록 힘들다
  function struggle() {
    if (G.ghost !== 'grab' || G.gT < .35) return;   // 솟아오르는 순간은 못 뿌리친다
    G.grip = Math.min(1, G.grip + 1 / gripNeed());
    P.sink = Math.max(0, P.sink - .06); G.shake = Math.max(G.shake, .55);
    spawnFoam(P.x + (Math.random() - .5), P.z + (Math.random() - .5), 3, true); A.splash(.7 + Math.random() * .4);
    el.mash.classList.remove('hit'); void el.mash.offsetWidth; el.mash.classList.add('hit');
    if (G.grip >= 1) breakFree();
  }
  function breakFree() {   // 뿌리쳤다 — 물귀신은 찢어지며 물러나고 아이는 숨을 몰아쉬며 일어난다
    G.grabs++; G.ghost = 'away'; G.gT = 0; G.grip = 0; strikeEnd(26); ghost.hideGrip();
    HERO.once = null; heroAct('rise', 1.9, 2.4); G.busy = 2.0;   // 허우적대다 일어난다
    ghost.banishBody(); A.free(); A.shriek(); A.heart(false);
    P.st = Math.min(P.st, 30); G.shake = 1.0;
    el.flash.style.background = '#dfe9ea'; el.flash.style.opacity = .5; setTimeout(() => { el.flash.style.opacity = 0; el.flash.style.background = '#000'; }, 90);
  }

  // ── 소금 — 마주 본 물귀신에게 뿌리면 비명을 지르며 찢어져 사라진다 ──
  const salt = []; { const mat = new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xf4f8ff, transparent: true, depthWrite: false }); for (let i = 0; i < 44; i++) { const s = new THREE.Sprite(mat.clone()); s.visible = false; s.renderOrder = 5; scene.add(s); salt.push({ s, life: 0, v: new THREE.Vector3() }); } }
  const saltFrom = new THREE.Vector3(), saltTo = new THREE.Vector3();
  const SALT_REL = .34;   // 누른 뒤 손을 떠나기까지 — 믹사모 Throw 를 .35~1.5초로 잘라 1.6배로 돌린 값
  function throwSalt() {
    if (G.ghost === 'drown' || G.ghost === 'grab' || G.saltPend) return;
    if (G.salt <= 0) { A.miss(); el.salt.classList.remove('empty'); void el.salt.offsetWidth; el.salt.classList.add('empty'); return; }
    G.salt--; saveRun();
    const seen = ghostSeen(), d = G.ghost === 'stalk' ? Math.hypot(P.x - G.gx, P.z - G.gz) : 99;
    const hit = seen > 0 && d < 10.5;
    const hairT = hit ? null : PUZ.saltTarget(P.x, P.z);   // 흔적을 휘감은 머리카락
    // 던질 쪽으로 몸을 돌리고 팔을 휘두른다
    if (hit) P.yaw = Math.atan2(G.gx - P.x, G.gz - P.z);
    else if (hairT) P.yaw = Math.atan2(hairT.x - P.x, hairT.z - P.z);
    else P.yaw = camYaw;
    const dur = heroAct('throw', 1.6); G.busy = Math.max(G.busy, dur ? .55 : 0);
    G.saltPend = { t: dur ? SALT_REL : 0, hit, hairT };
  }
  function releaseSalt(pd) {   // 손을 떠나는 순간 — 소리·알갱이·맞힘
    A.saltThrow();
    const hit = pd.hit && G.ghost === 'stalk', hairT = pd.hairT;
    saltFrom.copy(lampPos); saltFrom.y += .25;
    if (hit) saltTo.set(G.gx, ghost.far.position.y + ghost.farH * .72, G.gz);
    else if (hairT) saltTo.set(hairT.x, hairT.y, hairT.z);
    else { saltTo.set(P.x + Math.sin(P.yaw) * 6, P.y + 1.2, P.z + Math.cos(P.yaw) * 6); }
    const fly = Math.min(.42, saltFrom.distanceTo(saltTo) / 18);
    for (const p of salt) {
      if (p.life > 0 && Math.random() < .5) continue;
      p.life = fly + Math.random() * .25; p.s.visible = true; p.s.position.copy(saltFrom);
      p.v.copy(saltTo).sub(saltFrom).multiplyScalar(1 / fly); p.v.x += (Math.random() - .5) * 3; p.v.y += (Math.random() - .1) * 2.5; p.v.z += (Math.random() - .5) * 3;
      const sc = .08 + Math.random() * .12; p.s.scale.set(sc, sc, 1);
    }
    if (hit) G.banishT = fly;   // 알갱이가 닿는 순간 터진다
    else if (hairT) G.hairBurn = { t: fly, piece: hairT.piece };
  }
  function updateSalt(dt) {
    if (G.saltPend) { G.saltPend.t -= dt; if (G.saltPend.t <= 0) { const pd = G.saltPend; G.saltPend = null; if (G.ghost !== 'grab' && G.ghost !== 'drown') releaseSalt(pd); } }
    if (G.hairBurn) { G.hairBurn.t -= dt; if (G.hairBurn.t <= 0) { PUZ.burn(G.hairBurn.piece, A); G.hairBurn = null; saveRun(); } }
    for (const p of salt) { if (p.life <= 0) continue; p.life -= dt; if (p.life <= 0) { p.s.visible = false; continue; } p.v.y -= 9 * dt; p.s.position.addScaledVector(p.v, dt); p.s.material.opacity = Math.min(1, p.life * 4); }
  }
  function ghostBanish() {
    ghost.banishFar(); A.shriek(); A.heart(false);
    G.ghost = 'away'; G.gT = 0; strikeEnd(20);   // 한동안 오지 않는다
    G.shake = Math.max(G.shake, .7); G.lunges = 0;
    el.flash.style.background = '#dfe9ea'; el.flash.style.opacity = .35; setTimeout(() => { el.flash.style.opacity = 0; el.flash.style.background = '#000'; }, 80);
  }
  function addSalt(n) { G.salt = Math.min(SALT_MAX, G.salt + n); el.salt.classList.remove('hot'); void el.salt.offsetWidth; el.salt.classList.add('hot'); }

  function ghostTick(dt) {
    const deep = W.deepness(P.x, P.z); A.setDeep(deep);
    const lit = G.lamp && G.oil > 0;
    // 귀신이 오는 조건 둘 — 불이 꺼졌을 때, 물속에 10초 넘게 있을 때(2026-09-16 사장님)
    const wet = !P.dry && !G.hidden;   // 둔치를 벗어나 물에 들어가 있다
    G.wetT = wet ? (G.wetT || 0) + dt : 0; G.darkT = !lit && !G.hidden ? (G.darkT || 0) + dt : 0;
    // 푸른 손자국 퍼즐은 캄캄해야 풀린다 — 금줄~제단 구간에선 봐준다. 징조만 짙어지고 오래 버티면 그때 온다(2026-09-16 사장님)
    const handZone = PUZ.DEF.some(d => d.type === 'hands' && P.z > d.zA && P.z < d.zB);
    const called = G.darkT > (handZone ? 20 : 1.5) || G.wetT > (handZone ? 25 : 10);
    let seen = 0;
    if (G.banishT >= 0) { G.banishT -= dt; if (G.banishT <= 0) { G.banishT = -1; if (G.ghost === 'stalk') ghostBanish(); } }
    G.blackT = Math.max(0, G.blackT - dt); G.flickT = Math.max(0, G.flickT - dt); G.spike = Math.max(0, G.spike - dt * 1.4);

    if (G.ghost === 'away') {
      if (!G.holy) G.cool += dt;
      // 스친 형체 — 1초 남짓, 똑바로 쳐다보면 곧바로 없다
      if (G.glim > 0) {
        G.glim -= dt;
        if (seenAt(G.gx, G.gy + 1.7, G.gz) > .8) G.glim = Math.min(G.glim, .06);
        if (G.glim <= 0) { G.glim = 0; ghost.hideFar(); G.spike = .35; }
      }
      if (G.strike >= 0) {
        if (G.holy) { if (G.hushed) { G.hushed = false; A.unhush(); A.heart(false); } G.strike = Math.max(G.strike, 6); }   // 서낭당 안에선 오지 못한다
        else if (!called && G.strike > 1) { G.strike = -1; G.hushed = false; A.unhush(); A.heart(false); }   // 불을 다시 켰거나 물에서 나왔다 — 오다 만다
        else {
          G.strike -= dt;
          if (G.strike < 3.4 && !G.hushed) { G.hushed = true; A.hush(8); OMEN.steps = null; setTimeout(() => { if (G.hushed) A.heart(true); }, 1400); }
          if (G.strike <= 0) { if (G.glim > 0) { G.glim = 0; ghost.hideFar(); } beginStrike(); }
        }
      } else if (called && !G.holy) armStrike(handZone ? 3 : G.darkT > 1.5 ? 4 : 3, true);
      if (G.hairHit === false && OMEN.hairNear(P.x, P.z) < 2.2) { G.hairHit = true; G.spike = .3; A.whisper(); }
      if (G.ghost === 'away' && !G.hushed) {
        G.omenT -= dt * (lit ? 1.2 : 1) * (G.strike >= 0 ? 2.4 : 1) * (handZone && !lit ? 2.2 : 1);   // 올 때가 가까우면 징조가 잦아진다
        if (G.omenT <= 0 && !G.holy && G.glim <= 0 && !OMEN.walking()) { omen(); G.omenT = Math.max(7, 12 + Math.random() * 10 - G.charms * .8); }   // 분위기는 귀신 몫 — 징조를 자주
      }
    } else if (G.ghost === 'stalk') {
      G.gT += dt;
      seen = ghostSeen();
      const d = Math.hypot(P.x - G.gx, P.z - G.gz);
      if (G.hidden && G.kind !== 'lurk' && G.banishT < 0) { G.blackT = .17; el.flash.style.opacity = .97; setTimeout(() => el.flash.style.opacity = 0, 160); lurkAt(G.hidden); }   // 코앞에서 돌탑으로 뛰어들었다
      if (G.kind === 'lurk') {     // 들어오지 못한다 — 나오면 다시 다가온다
        G.outT = G.hidden ? 0 : (G.outT || 0) + dt;   // 문턱에서 잠깐 삐져나온 건 봐준다
        if (G.outT > 1) { if (d < 16) { G.kind = 'blink'; G.blink = 1.2; } else ghostGone(); }
        else if (G.hidden && G.gT > 8) ghostGone();
      } else if (G.kind === 'ambush') {   // 솟아오른 뒤 한 박자 — 소금을 못 뿌리면 덮친다
        G.gy = Math.min(footY(G.gx, G.gz), G.gy + dt * 11);
        if (G.gT > 1.3 && G.banishT < 0) ghostTake();
      } else if (G.banishT < 0) {  // 쳐다보면 등불이 버틴다, 눈을 돌리면 금세 깜빡인다
        G.blink -= dt * (seen > 0 ? .55 : 1.35);
        if (G.blink <= 0) blinkStep();
      }
      if (G.ghost === 'stalk') {
        ghost.moveFar(G.gx, G.gz, P.x, P.z, G.gy);
        ghost.far.visible = G.blackT > 0 ? false : lit ? true : d < DARK;   // 등불이 꺼지면 먼 형체는 어둠에 묻힌다
      }
      A.heart(d < 24);
      if (G.ghost !== 'stalk' || G.banishT >= 0) { }       // 이미 덮쳤거나 소금이 날아가는 중
      else if (G.holy) ghostGone();                         // 서낭당 불빛 안으로 들어가면 물러난다
      else if (d > 48 || G.gT > 40) ghostGone();            // 따돌렸다
    } else if (G.ghost === 'reveal') {   // 코앞에 크게 — 짧게 멈췄다가 끌고 간다
      G.gT += dt;
      if (G.hidden) { lurkAt(G.hidden); }
      else {
        const k = Math.min(1, G.gT / .25);
        ghost.far.visible = true; ghost.far.position.set(G.gx, G.gy + (1 - k) * -.5, G.gz);   // 물에서 확 솟는다
        if (G.gT > REVEAL_T) ghostTake();
      }
    } else if (G.ghost === 'grab') {
      G.gT += dt; P.sink = Math.min(HERO.clips ? .1 : .2, P.sink + dt * .4);
      G.grip = Math.max(0, G.grip - dt * .1);               // 손을 놓으면 다시 끌려간다
      // 넘어진 뒤 발목을 잡혀 물 가운데로 질질 끌려간다 — 발버둥칠수록 느려진다
      dragStep(G.gT < .7 ? 0 : Math.min(1, (G.gT - .7) / .5) * (1.7 - G.grip * 1.3), dt);
      { const gx = P.x + G.dragX * 1.15, gz = P.z + G.dragZ * 1.15, wy = W.height(gx, gz, G.t);
        ghost.bodyAt(gx, wy - 2.0 + Math.min(1, G.gT / .18) * 1.72 + Math.sin(G.t * 3) * .03, gz, G.t);   /* 코앞에 선 뒤라 곧바로 솟는다 */ gripHair(gx, gz, .95); }   // 얕은 물에서 솟아 머리채를 쥔 채 뒷걸음질
      if (G.gT > GRAB_TIME) { G.ghost = 'drown'; G.gT = 0; G.grip = 0; A.drown(); A.heart(false); }
    } else if (G.ghost === 'drown') {
      G.gT += dt; P.sink = Math.min(.9, P.sink + dt * .45);
      dragStep(1.3, dt);
      { const gx = P.x + G.dragX * 1.15, gz = P.z + G.dragZ * 1.15, wy = W.height(gx, gz, G.t);
        ghost.bodyAt(gx, wy - .28 - G.gT * .95, gz, G.t); gripHair(gx, gz, .55 - G.gT * .5); }   // 머리채를 쥔 채 함께 물속으로 가라앉는다
      if (G.gT > 2.4) gameOver();
    }


    // 지직 · 어둠
    const dG = G.ghost === 'stalk' ? Math.hypot(P.x - G.gx, P.z - G.gz) : 99;
    G.gNear = dG;
    let want = seen > 0 ? Math.min(.9, .2 + seen * .28 + (1 - Math.min(1, dG / 30)) * .55) : 0;
    want = Math.max(want, G.spike * .8);
    if (G.hushed) want = Math.max(want, .08);
    if (G.ghost === 'grab' || G.ghost === 'drown') want = .85;
    G.grain += (want - G.grain) * Math.min(1, dt * 7);
    if (seen > 0 && dG < 14) G.shake = Math.max(G.shake, .3);

    if (!G.hushed) { G.owlT -= dt; if (G.owlT <= 0) { G.owlT = 14 + Math.random() * 20; A.owl(); } }
  }

  // 화면 지직 — 잡음 그림 몇 장을 돌려 쓴다
  const grains = [];
  { for (let i = 0; i < 5; i++) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 180;
      const c = cv.getContext('2d'), im = c.createImageData(180, 180);
      for (let j = 0; j < im.data.length; j += 4) { const v = 60 + Math.random() * 195; im.data[j] = im.data[j + 1] = im.data[j + 2] = v; im.data[j + 3] = Math.random() < .45 ? 210 : 40; }
      c.putImageData(im, 0, 0); grains.push('url(' + cv.toDataURL() + ')');
    } }
  let grainI = 0, grainT = 0;
  function drawGrain(dt) {
    const k = G.grain;
    el.grain.style.opacity = k < .02 ? 0 : k * .5;
    const dn = G.gNear != null ? G.gNear : 99;
    el.dread.style.opacity = dn < 11 ? (1 - dn / 11) * .55 : 0;
    if (k < .02) return;
    grainT += dt;
    if (grainT > .085) { grainT = 0; grainI = (grainI + 1) % grains.length; el.grain.style.backgroundImage = grains[grainI]; }
  }

  // ── 클립 위에 덧입히는 자세 — 뛰어오른 다리, 등불을 물 밖으로 드는 오른팔 ──
  // 뼈마다 축이 제각각이라 세계 축(몸의 오른쪽)으로 돌린다. 애니메이션을 갱신한 뒤에 부른다
  const _bq = new THREE.Quaternion(), _bq2 = new THREE.Quaternion(), _bax = new THREE.Vector3(), _rax = new THREE.Vector3(), _uax = new THREE.Vector3(0, 1, 0);
  // 덧입힌 뼈는 덧입히기 전 자세를 기억해 둔다. 클립이 그 뼈를 매 프레임 다시 써 주지 않으면
  // 각도가 프레임마다 쌓여 팔이 빙글빙글 돈다(2026-09-16 영상) — 다음 프레임 시작에 되돌린다
  const _touched = new Map(); let _poseFrame = 0;
  function poseBegin() {
    _poseFrame++;
    for (const [b, s] of _touched) if (b.quaternion.equals(s.post)) b.quaternion.copy(s.pre);   // 클립이 안 건드렸다 → 덧입히기 전으로
  }
  function boneTurn(b, ang, ax) {
    if (!b || !b.parent || Math.abs(ang) < .004) return;
    let s = _touched.get(b); if (!s) { s = { pre: new THREE.Quaternion(), post: new THREE.Quaternion(), f: -1 }; _touched.set(b, s); }
    if (s.f !== _poseFrame) { s.pre.copy(b.quaternion); s.f = _poseFrame; }
    b.parent.getWorldQuaternion(_bq).invert(); _bax.copy(ax || _rax).applyQuaternion(_bq).normalize(); _bq2.setFromAxisAngle(_bax, ang); b.quaternion.premultiply(_bq2);
    s.post.copy(b.quaternion);
  }
  function poseOver(dt, t) {
    const B = HERO.bone; if (!B) return;
    poseBegin();
    _rax.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));   // 몸의 오른쪽 — 이 축으로 돌리면 팔다리가 앞뒤로 움직인다
    P.airK += ((P.air ? 1 : 0) - P.airK) * Math.min(1, dt * 14);
    if (P.airK > .02) {   // 솟을 땐 무릎을 끌어올리고, 내려올 땐 다리를 뻗어 착지한다
      const up = Math.max(-1, Math.min(1, P.jv / 4.5)), k = P.airK;
      boneTurn(B.leftupleg, -k * (.6 + up * .35)); boneTurn(B.leftleg, k * (.95 + up * .25));
      boneTurn(B.rightupleg, -k * (.22 - up * .3)); boneTurn(B.rightleg, k * .55);
    }
    // 수문 바퀴 — 두 팔을 앞으로 뻗어 테를 잡고, 바퀴가 도는 만큼 손이 원을 그린다 (믹사모에 맞는 클립이 없어 뼈로 직접 돌린다)
    P.crankK += (((G.wheel && !P.air && G.state === 'play') ? 1 : 0) - P.crankK) * Math.min(1, dt * 7);
    if (P.crankK > .02) {
      if (G.wheel) P.crankA = -G.wheel.wheel.rotation.y;
      const k = P.crankK, sw = Math.sin(P.crankA), cw = Math.cos(P.crankA);
      boneTurn(B.rightarm, -k * (.70 + cw * .16)); boneTurn(B.rightforearm, -k * (.88 - cw * .18));
      boneTurn(B.leftarm, k * (.70 - cw * .16)); boneTurn(B.leftforearm, k * (.88 + cw * .18));   // 왼쪽 뼈는 방향이 뒤집혀 있어 부호를 반대로
      boneTurn(B.rightarm, k * (.10 + sw * .16), _uax); boneTurn(B.leftarm, k * (.10 + sw * .16), _uax);   // 손이 테를 따라 좌우로 돈다
    }
    if (HERO.hand) {   // 물이 깊으면 등불 든 팔을 들어 올린다 — 등불이 잠기지 않게
      // 손 뼈로 재면 방금 든 팔이 다시 재어져 "높다→내림→낮다→올림"을 되풀이하며 팔을 휘두른다(2026-09-16 영상).
      // 팔을 내린 채의 주먹 높이(발 + HAND_Y)로 잰다. 등불이 꺼져 있으면 들 까닭이 없다
      const lit = G.lamp && G.oil > 0;
      const need = lit ? Math.max(0, W.height(P.x, P.z, t) + .46 - (P.y - P.sink + HAND_Y)) : 0;   // 등불은 주먹보다 13cm 아래에 달린다 — 그만큼 더 든다
      P.raise += (Math.min(1, need / .4) - P.raise) * Math.min(1, dt * 4);
      if (P.raise > .02) { boneTurn(B.rightarm, -P.raise * 1.6); boneTurn(B.rightforearm, -P.raise * .5); }
    }
  }

  // ── 프레임 ──
  const fwd = { x: 0, z: 1 };
  function frame(dt) {
    dt = Math.min(.05, dt); G.t += dt; const t = G.t;
    G.busy = Math.max(0, (G.busy || 0) - dt);
    const play = G.state === 'play', frozen = (G.ghost === 'grab' || G.ghost === 'drown' || G.ghost === 'reveal') || G.state === 'clear' || G.busy > 0;
    fwd.x = Math.sin(camYaw); fwd.z = Math.cos(camYaw);
    // 이동 — 화면 기준
    let ix = 0, iz = 0, run = false;
    if (play && !frozen) {
      if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1; if (keys.KeyW || keys.ArrowUp) iz += 1; if (keys.KeyS || keys.ArrowDown) iz -= 1;
      if (joy.id) { ix = joy.dx; iz = -joy.dy; }
      const n = Math.hypot(ix, iz); if (n > 1) { ix /= n; iz /= n; }
      run = (!!(keys.ShiftLeft || keys.ShiftRight) || tRun || (joy.id && n > .82)) && P.st > 0;
    }
    const len = Math.hypot(ix, iz);
    { const gy = W.groundH(P.x, P.z), wy = W.height(P.x, P.z, t);
      P.foot = gy > wy - 1.6;      // 발이 바닥에 닿는다
      P.dry = gy > wy + .05; }     // 물 밖 — 뭍이나 발판 위
    let want = 0;
    if (len > 0) want = P.dry ? (run ? 4.8 : 3.2) : (run ? 4.0 : 2.7);   // 물속은 무릎까지 차서 조금 느리다
    if (P.st <= 0) want *= .55; if (frozen) want = 0;
    P.speed += (want - P.speed) * Math.min(1, dt * (want > P.speed ? 3.5 : 2.2));
    if (len > 0) {
      const dx = fwd.x * iz - fwd.z * ix, dz = fwd.z * iz + fwd.x * ix;   // 앞 + 오른쪽
      const ty = Math.atan2(dx, dz); let d = ty - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 6);
    }
    P.vx = Math.sin(P.yaw) * P.speed; P.vz = Math.cos(P.yaw) * P.speed;
    const climbing = !P.air && P.y < W.groundH(P.x, P.z) - .25;   // 발판 턱에 매달려 몸을 끌어올리는 중 — 다 올라설 때까지 앞으로 못 간다
    if (!frozen && !climbing && P.speed > .05) {
      const from = P.foot ? W.groundH(P.x, P.z) : W.height(P.x, P.z, t);
      const canGo = (nx, nz) => {
        const deck = W.deckAt(nx, nz);
        if (deck !== null) return P.air ? deck - P.y <= 1.0 : deck - from <= .8;   // 무릎께 턱은 걸어 오르고, 선착장처럼 높은 발판은 뛰어올라야 오른다
        const h = W.groundH(nx, nz);
        if (h - from > 1.5) return false;                                   // 너무 높은 턱
        const dx = nx - P.x, dz = nz - P.z, d = Math.hypot(dx, dz) || 1e-4;
        return W.terrainH(P.x + dx / d * 1.2, P.z + dz / d * 1.2) - from <= 1.0;   // 비탈이 가파르면 못 오른다 (발판은 위에서 따로 본다 — 여기서 같이 보면 발판 앞 1.2m 에 보이지 않는 벽이 생긴다)
      };
      const mx = P.vx * dt, mz = P.vz * dt, ox = P.x, oz = P.z;
      let nx = P.x + mx, nz = P.z + mz;
      if (!canGo(nx, nz)) {   // 비탈을 따라 미끄러진다
        const e = .8, gx = W.groundH(P.x + e, P.z) - W.groundH(P.x - e, P.z), gz = W.groundH(P.x, P.z + e) - W.groundH(P.x, P.z - e);
        const gl = Math.hypot(gx, gz) || 1, ux = gx / gl, uz = gz / gl, dot = mx * ux + mz * uz;
        const sx = mx - ux * dot, sz = mz - uz * dot;
        if (canGo(P.x + sx, P.z + sz)) { nx = P.x + sx; nz = P.z + sz; }
        else { nx = P.x - ux * .07; nz = P.z - uz * .07; P.speed *= .6; }   // 구석에 몰리면 낮은 쪽으로 밀려난다
      }
      for (const r of W.rocks) { if (r.pass) continue; const d = Math.hypot(nx - r.x, nz - r.z), rr = r.r - 1.7; if (d < rr && d > .001) { nx = r.x + (nx - r.x) / d * rr; nz = r.z + (nz - r.z) / d * rr; } }   // pass 는 카메라만 막는 처마
      P.x = nx; P.z = nz;
      P.adv = Math.hypot(P.x - ox, P.z - oz) / Math.max(1e-4, dt);   // 실제로 나아간 빠르기 — 벽·바퀴에 막혀 제자리면 0 에 가깝다
    } else P.adv = 0;
    // 급류 — 물에 들어서 있으면 물살에 떠밀린다. 붙잡히면 물살에 휩쓸려 간다
    P.flow = 0; P.drift = 0;
    if (!P.dry && G.state !== 'title' && G.state !== 'clear') {
      const f = W.flow(P.x, P.z), drag = (G.ghost === 'grab' || G.ghost === 'drown') ? 1.6 : 1;
      P.flow = f.s;
      const nx = P.x + f.x * drag * dt, nz = P.z + f.z * drag * dt;
      if (W.groundH(nx, nz) < W.height(nx, nz, t) + .05) { P.x = nx; P.z = nz; P.drift = Math.hypot(f.x, f.z) * drag; }
    }

    if (play) {
      W.ensure(P.z);
      // 체력 — 물살을 거슬러 뛸 때 깎이고, 뭍이나 잔잔한 물에서는 돌아온다
      if (run && len > 0 && !P.dry) P.st = Math.max(0, P.st - dt * (6 + P.flow * 4));
      else P.st = Math.min(100, P.st + dt * (P.dry ? 18 : len > 0 ? 8 : 12));
      if (P.flow > 1.1 && Math.random() < dt * P.flow * 3) spawnFoam(P.x + (Math.random() - .5) * .8, P.z + .3, 1, true);   // 급류가 다리에 부딪혀 하얗게 인다
      el.stBar.style.width = P.st + '%'; el.st.classList.toggle('low', P.st < 22);
      // 등불 기름 — 켜 둔 동안에만 준다
      if (G.lamp) { G.oil = Math.max(0, G.oil - dt * .78); if (G.oil <= 0) { setLamp(false); armStrike(4, true); } }   /* 기름이 다해 캄캄해지는 순간 */
      el.oilBar.style.width = G.oil + '%'; el.oil.classList.toggle('low', G.oil < 20);
      el.dist.textContent = Math.max(0, Math.round(P.z)) + 'm';
      if (P.z > best) { best = P.z; store(BEST, best); }
      // 손맛
      P.strokeAcc += dt * (run ? 2.4 : 1.6) * (P.speed > .3 ? 1 : 0);
      if (P.strokeAcc >= 1) { P.strokeAcc -= 1; if (!frozen) {
        if (P.dry) A.step();
        else { spawnFoam(P.x + Math.sin(P.yaw + 1.57) * .3, P.z + Math.cos(P.yaw + 1.57) * .3, run ? 3 : 2, run); run ? A.sprint() : A.stroke(); } } }
      // 떠 있는 등불 — 기름
      // 떠 있는 등불은 기름이 90 아래일 때만 줍는다 — 가득 찬 채로 주우면 넘쳐서 버려진다. 줄면 돌아와 주우면 된다
      for (const l of W.lamps) if (!l.userData.taken && G.oil < 90 && Math.hypot(P.x - l.position.x, P.z - l.position.z) < 2.0) { l.userData.taken = true; l.visible = false; W.lampTaken.add(l.userData.id); heroAct('pick', 1.9); G.busy = Math.max(G.busy, .45); G.oil = Math.min(100, G.oil + 45); A.lamp(); toast('🏮 +45'); if (!G.lamp) setLamp(true); }
      // 흔적
      for (const it of W.items) if (it.visible && !it.userData.locked && Math.hypot(P.x - it.position.x, P.z - it.position.z) < 2.2) {
        it.visible = false; W.taken.add(it.userData.item.i); G.items = W.taken.size; heroAct('pick', 1.2); G.busy = Math.max(G.busy, .9);
        toast('👣 ' + G.items + '/' + W.TRACE_N); subtitle(it.userData.item.k); memoryEcho(it.position.x, it.position.z);
        if (G.items === 3 || G.items === 5) armStrike(9 + Math.random() * 6);
        el.trace.classList.remove('hot'); void el.trace.offsetWidth; el.trace.classList.add('hot');
        if (G.items >= W.TRACE_N && G.charms >= W.CHARM_N) setTimeout(() => toast(EN ? 'THE SOURCE' : '발원지로'), 2200);
        saveRun();
      }
      // 부적 — 주울 때마다 물귀신이 곧바로 찾아온다
      for (const c of W.charmObjs) if (c.visible && Math.hypot(P.x - c.position.x, P.z - c.position.z) < 1.8) {
        c.visible = false; W.charmTaken.add(c.userData.charm.i); G.charms = W.charmTaken.size; heroAct('pick', 1.4); G.busy = Math.max(G.busy, .75);
        el.item.textContent = G.charms + '/' + W.CHARM_N;
        el.charm.classList.add('hot'); setTimeout(() => el.charm.classList.remove('hot'), 1200);
        A.lamp(); A.whisper(); toast('📜 ' + G.charms + '/' + W.CHARM_N); subtitle('charm');
        G.shake = Math.max(G.shake, .5);
        if (G.charms >= W.CHARM_N) { A.clear(); if (G.items >= W.TRACE_N) setTimeout(() => toast(EN ? 'THE SOURCE' : '발원지로'), 1500); }
        if (G.charms % 2 === 0) armStrike(6 + Math.random() * 7);   // 짝수 번째 부적 — 결정적인 순간
        saveRun();
      }
      // 명소
      G.holy = false;
      for (const m of W.marks) {
        const d = m.cp ? Math.max(Math.abs(P.z - m.z) * 1.3, Math.hypot(P.x - m.x, P.z - m.z) - 8) : Math.hypot(P.x - m.x, P.z - m.z);
        if (m.cp && d < m.r) G.holy = true;   // 서낭당 불빛 안 — 물귀신이 물러나고 정신이 돌아온다
        if (d < m.r && !W.found.has(m.i)) { W.found.add(m.i); A.clear(); toast(NM(m)); if (m.cp) { G.cpX = W.cx(m.z) + (m.x - W.cx(m.z)) * .5; G.cpZ = m.z; setTimeout(() => subtitle('shrine', 5200), 600); addSalt(2); setTimeout(() => toast('🧂 +2'), 1300); startMission(m); } saveRun(); }
        if (m.t === 'spring' && d < 8 && G.state === 'play') {
          if (G.charms >= W.CHARM_N && G.items >= W.TRACE_N) beginEnding();
          else if (!G.shortT || G.t - G.shortT > 4) { G.shortT = G.t; toast('📜 ' + G.charms + '/' + W.CHARM_N + '   👣 ' + G.items + '/' + W.TRACE_N); }
        }
      }
      if (G.state === 'play') { const cx = { P, G, dt, t, lit: G.lamp && G.oil > 0, frozen, A, toast, save: saveRun, setLamp, addSalt, camYaw, sub: subtitle, say: subtitle, act: (n, s) => { heroAct(n, s); G.busy = Math.max(G.busy, .6); }, hold: heroHold }; PROPS.tick(cx); PUZ.tick(cx); UNCLE.tick(cx); misTick(); G.hidden = PUZ.hideAt(P.x, P.z); }
      if (G.state === 'play') ghostTick(dt);
    }
    if (G.state === 'clear') endingTick(dt, t);

    // 사람 모델
    pl.g.visible = G.state !== 'title';
    { const wy = W.height(P.x, P.z, t), gy = W.groundH(P.x, P.z);
      // 얕은 강 — 늘 바닥을 딛고 걷는다
      const baseY = gy;
      if (P.air) {   // 뛰어오른 동안은 포물선, 발이 땅에 닿으면 멈춘다
        P.jv -= 19 * dt; P.y += P.jv * dt;
        if (P.y <= baseY) { const hard = P.jv < -4.6, climb = baseY - P.y > .3; P.air = false; P.jv = 0; if (!climb) P.y = baseY; if (P.dry) A.plop(true, hard ? 1.7 : 1); else A.splash(hard ? 1.2 : .8); }   // 발판 위로 올라탄 때는 그 자리에서 몸을 끌어 올린다
      } else P.y += (baseY - P.y) * Math.min(1, dt * (Math.abs(baseY - P.y) > 1.2 ? 6 : 10));
      const drifting = !frozen && P.adv <= .4 && P.drift > .3;   // 물살에 떠밀리는 중 — 굳은 채 미끄러지지 않게 버티며 발을 옮긴다(2026-09-16 사장님)
      const moving = (P.adv > .4 || drifting) && !frozen;   // 제자리에서 다리만 구르지 않게 — 실제로 나아가거나 떠밀릴 때만 걷는 동작
      const swimming = false;
      if (G.ghost !== 'grab' && G.ghost !== 'drown' && P.sink > 0) P.sink = Math.max(0, P.sink - dt * .8);   // 뿌리치고 일어난다
      pl.g.position.set(P.x, P.y + (HERO.on ? 0 : STAND) - P.sink, P.z); pl.g.rotation.y = P.yaw;
      if (HERO.on) {   // 남자아이 — 물속에서도 걷는다. 붙잡히면 물살에 쓰러진다
        const grabbed = G.ghost === 'grab' || G.ghost === 'drown';
        if (HERO.once) { HERO.once.t += dt; if (HERO.once.t > HERO.once.dur || (moving && !drifting && HERO.once.t > .35 && !HERO.once.lock)) HERO.once = null; }
        HERO.holdT = (HERO.holdT || 0) - dt;
        if (HERO.once) playHero(HERO.once.name, HERO.once.speed);
        else if (HERO.holdT > 0) playHero(HERO.holdName, 1);
        else playHero(grabbed ? 'run' : (moving ? (run ? 'run' : 'walk') : 'idle'),
                 grabbed ? 1.7 : (moving ? (drifting ? Math.min(.9, .35 + P.drift * .3) : run ? (P.dry ? 1 : .85) : (P.dry ? 1.05 : .9)) : 1));
        const tilt = grabbed && !HERO.clips ? 1.45 : grabbed ? (G.hairTilt || 0) : 0;   // 동작 클립이 있으면 넘어지는 동작 + 머리채에 들린 만큼만 세운다
        heroG.rotation.x += (tilt - heroG.rotation.x) * Math.min(1, dt * 5);
        const k = heroG.rotation.x / 1.57;
        G.hairLift = grabbed ? (G.hairLift || 0) + ((G.hairLiftT || 0) - (G.hairLift || 0)) * Math.min(1, dt * 6) : 0;   // 머리채에 들린 만큼
        heroG.position.z = -.30 * k; heroG.position.y = .46 * k + G.hairLift;
        HERO.mixer.update(dt);
        poseOver(dt, t);
      } 
      const tilt = swimming ? (moving ? .08 : -.95) : -1.55;   // 서 있으면 곧게
      if (!HERO.on) {
      pl.body.rotation.x += (tilt - pl.body.rotation.x) * Math.min(1, dt * 5);
      pl.body.position.y += (((swimming && moving) ? 0 : -.3) - pl.body.position.y) * Math.min(1, dt * 4);
      P.phase += dt * (frozen ? (G.ghost === 'grab' ? 12 : 3) : (moving ? (swimming ? (run ? 9 : 6.2) : (run ? 7.5 : 5.2)) : 2.2));
      pl.arms.forEach((a, i) => { const ph = P.phase + i * Math.PI;
        if (G.ghost === 'grab') { a.rotation.x = -2.6 + Math.sin(ph) * .7; a.rotation.z = (i ? -1 : 1) * .9; a.userData.fo.rotation.x = -.3; }
        else if (swimming && moving) { a.rotation.x = Math.PI + ph; a.rotation.z = (i ? -1 : 1) * .25; a.userData.fo.rotation.x = Math.sin(ph) * .6 - .4; }
        else if (!swimming) { a.rotation.x = 1.45 + (moving ? Math.sin(ph) * .5 : 0); a.rotation.z = (i ? -1 : 1) * .16; a.userData.fo.rotation.x = moving ? -.35 + Math.sin(ph) * .25 : -.25; }
        else { a.rotation.x = -.6 + Math.sin(ph) * .5; a.rotation.z = (i ? -1 : 1) * 1.1; a.userData.fo.rotation.x = -.6; } });
      pl.legs.forEach((l, i) => { const ph = P.phase + i * Math.PI;
        if (!swimming) l.rotation.x = (moving ? Math.sin(ph) * .5 : 0);
        else l.rotation.x = Math.sin(P.phase * (moving ? 1.6 : .8) + i * Math.PI) * (G.ghost === 'grab' ? .8 : moving ? .35 : .5) + (moving ? .1 : .9); });
      pl.head.rotation.x = swimming ? (moving ? -.6 : -.2) : .05; pl.head.rotation.z = moving && swimming ? Math.sin(P.phase * .5) * .35 : 0;
      }
      // 등불 — 아이가 오른손에 들고 다닌다 (물이 깊으면 poseOver 가 팔을 들어 올린다)
      if (HERO.on && HERO.hand) { HERO.hand.getWorldPosition(lampPos); pl.lamp.position.set(lampPos.x, lampPos.y - .13, lampPos.z); }
      else { lampLocal.set(0, .34, -.42); pl.g.localToWorld(lampLocal); pl.lamp.position.copy(lampLocal); }
      pl.lamp.rotation.y = P.yaw;
      const lit = G.lamp && G.oil > 0; let flick = lit ? (G.oil < 20 ? .45 + Math.random() * .55 : .85 + Math.sin(t * 11) * .15) : 0;
      if (G.blackT > 0) flick = 0; else if (G.flickT > 0 && Math.sin(G.flickT * 29) < -.15) flick *= .04;   // 물귀신이 오면 등불이 꺼졌다 켜진다
      pl.lamp.visible = pl.g.visible && lit;
      pl.lampL.intensity = 19 * flick * (G.hidden ? .3 : 1);   // 돌탑 안에선 불빛이 돌벽에 막혀 어둑하다 pl.paper.visible = pl.lampG.visible = lit; pl.lampG.material.opacity = .32 * flick;
      lampPos.copy(pl.lamp.position);
    }
    // 카메라 — 등 뒤에서 따라온다
    { let d = P.yaw - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (iz > -.2 && len > 0 && camDrag.id === null && t - camDrag.end > 1.2) camYaw += d * Math.min(1, dt * 2.0 * (iz < .2 && Math.abs(ix) > .2 ? .35 : 1));   // 화면을 끄는 중·끈 직후·서 있을 땐 저절로 돌지 않는다   // 뒤로 걸을 땐 카메라가 따라 돌지 않는다 (돌면 S 방향이 뒤집혀 제자리에서 빙빙 돈다)   // 뒤로 걸을 땐 카메라가 따라 돌지 않는다 (돌면 S 방향이 뒤집혀 제자리에서 빙빙 돈다)
      let tx, ty, tz, lx, ly, lz, duck = 0;
      if (G.state === 'title') { camYaw = 0; const sw = Math.sin(t * .12) * .35; tx = P.x + 3.2 + sw * 2; ty = P.y + 2.6; tz = P.z + 8.5; lx = P.x - .6; ly = P.y + 1.5; lz = P.z - 4; }   // 타이틀 — 물가에서 불 켜진 집과 마당의 아이를 올려다본다
      else if (G.state === 'clear' && G.endT < 5.2) {   // 동생을 향해 천천히 돌아본다 — 동생이 달려온다
        const k = Math.min(1, G.endT / 2.6);
        let kx = P.x + Math.sin(camYaw) * 8, kz = P.z + Math.cos(camYaw) * 8, ky = P.y + 1;
        if (W.kid) { W.kid.getWorldPosition(kidPos); kx = kidPos.x; kz = kidPos.z; ky = kidPos.y + .75; }
        const back = 4.6 - k * 1.6;
        tx = P.x - Math.sin(camYaw) * back; ty = P.y + 2.3 - k * .5; tz = P.z - Math.cos(camYaw) * back;
        lx = P.x + (kx - P.x) * k; ly = (P.y + 1) + (ky - P.y - 1) * k; lz = P.z + (kz - P.z) * k;
      }
      else if ((G.state === 'clear' || G.ended) && !END.drag) {   // 오빠 어깨 너머로 동생을 — 변하는 순간을 코앞에서 본다
        const E = END, dx = E.kx - P.x, dz = E.kz - P.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
        const rise = G.trueEnd && E.t4 ? Math.min(1, Math.max(0, (G.endT - E.t4) / 6)) : 0;   // 날이 밝으면 뒤로·위로 물러난다
        // 옆에서 둘을 한 화면에 — 발원지 둘레 바위에 가리지 않게 샘 가운데 쪽으로 비껴 선다
        const mx = (P.x + E.kx) / 2, mz = (P.z + E.kz) / 2, s = E.camS || 1;
        const side = 3.4 + rise * 3.5;
        tx = mx - uz * s * side - ux * .6; ty = P.y + 1.35 + rise * 2.4; tz = mz + ux * s * side - uz * .6;
        lx = E.stage >= 2 ? E.kx * .7 + P.x * .3 : mx; ly = W.groundH(mx, mz) + (E.stage >= 2 ? 1.25 : .75) + rise * 1.4; lz = E.stage >= 2 ? E.kz * .7 + P.z * .3 : mz;
      }
      else if (G.ghost === 'stalk' && G.kind === 'ambush') {   // 솟구침 — 아이 어깨 너머로 코앞의 얼굴을 올려다본다
        const sx = Math.sin(camYaw), sz = Math.cos(camYaw);
        tx = P.x - sx * 1.5 + sz * .45; ty = P.y + 1.25; tz = P.z - sz * 1.5 - sx * .45;
        lx = G.gx; ly = ghost.far.position.y + ghost.farH * .8; lz = G.gz;
      }
      else if (G.ghost === 'reveal') {   // 아이 어깨 너머 — 코앞에 선 귀신 얼굴을 올려다본다
        const sx = Math.sin(camYaw), sz = Math.cos(camYaw);
        tx = P.x - sx * .9 + sz * .35; ty = P.y + 1.2; tz = P.z - sz * .9 - sx * .35;
        lx = G.gx; ly = G.gy + ghost.farH * .82; lz = G.gz;
      }
      else if (G.ghost === 'grab') { const px = -G.dragZ, pz = G.dragX, mx = P.x + G.dragX * .7, mz = P.z + G.dragZ * .7, gy0 = W.groundH(mx, mz); tx = mx + px * 3.6 - G.dragX * 1.2; ty = gy0 + 1.25; tz = mz + pz * 3.6 - G.dragZ * 1.2; lx = mx; ly = gy0 + .55 + Math.min(1, G.gT / .7) * .35; lz = mz; }   // 옆에서 — 넘어진 아이와 발목을 쥔 물귀신이 한 화면에
      else if (G.ghost === 'drown') { const px = -G.dragZ, pz = G.dragX, mx = P.x + G.dragX * .7, mz = P.z + G.dragZ * .7; tx = mx + px * 3.0 - G.dragX * 1.0; tz = mz + pz * 3.0 - G.dragZ * 1.0; ty = Math.max(W.groundH(tx, tz) + .1, .9 - G.gT * .3); lx = mx; ly = .5 - G.gT * .25; lz = mz; }   // 물살 속으로 함께 잠긴다
      else if (G.hidden && G.state === 'play') { const tw = G.hidden; tx = P.x + tw.dx * .5; ty = P.y + 1.05; tz = P.z + tw.dz * .5; lx = tw.x + tw.dx * 12; ly = tw.y + .7; lz = tw.z + tw.dz * 12; }   /* 소년 앞, 문 안쪽에서 문밖을 내다본다(2026-09-16 사장님) */   /* 아이 어깨 옆으로 비껴 문밖이 보이게 */   // 돌탑 안 — 문틈으로 밖을 내다본다
      else {   // 등 뒤 — 비탈·언덕에 파묻히면 바짝 붙는다
        let back = 4.6;
        for (const b of [4.6, 3.8, 3.0, 2.3, 1.7]) { back = b; if (W.groundH(P.x - Math.sin(camYaw) * b, P.z - Math.cos(camYaw) * b) < P.y + 1.6) break; }
        // 처마 밑에서는 카메라가 지붕을 뚫고 올라가지 않게 낮게 따라온다
        { const dx = -Math.sin(camYaw), dz = -Math.cos(camYaw); let lim = back;   // 집 벽·바위에 카메라가 파묻히면 그 앞까지만 물러난다
          for (const r of W.rocks) { if (!r.cam) continue;   // 벽처럼 높은 것만 — 낮은 바위까지 피하면 화면이 시도 때도 없이 당겨진다
            const rr = r.r - 1.7 + .35, ox = P.x - r.x, oz = P.z - r.z, b2 = ox * dx + oz * dz, c2 = ox * ox + oz * oz - rr * rr;
            if (c2 < 0) { lim = Math.min(lim, 1.1); if (r.pass) duck = 1; continue; }
            const disc = b2 * b2 - c2; if (disc <= 0) continue;
            const tt = -b2 - Math.sqrt(disc); if (tt > 0 && tt < lim) { lim = tt; if (r.pass) duck = 1; } }
          back = Math.max(1.1, lim); }
        tx = P.x - Math.sin(camYaw) * back; ty = P.y + (duck ? 1.35 : 2.5); tz = P.z - Math.cos(camYaw) * back;
        lx = P.x + Math.sin(camYaw) * 7; ly = P.y + (duck ? 1.05 : .9); lz = P.z + Math.cos(camYaw) * 7;
      }
      const gh = W.groundH(tx, tz) + (duck ? .9 : 1.4); if (ty < gh && G.ghost !== 'grab' && G.ghost !== 'drown' && !G.hidden) ty = gh;   // 비탈에 파묻히지 않게
      const k = Math.min(1, dt * (G.ghost === 'reveal' ? 14 : G.ghost === 'grab' ? 5 : G.kind === 'ambush' && G.ghost === 'stalk' ? 10 : 3.2));
      camera.position.x += (tx - camera.position.x) * k; camera.position.y += (ty - camera.position.y) * k; camera.position.z += (tz - camera.position.z) * k;
      if (G.shake > 0) { G.shake = Math.max(0, G.shake - dt * 2.2); camera.position.x += (Math.random() - .5) * G.shake * .25; camera.position.y += (Math.random() - .5) * G.shake * .2; }
      camera.lookAt(lx, ly, lz);
      under = camera.position.y < W.height(camera.position.x, camera.position.z, t);
      if (under !== lastUnder) { lastUnder = under; el.uw.classList.toggle('on', under); A.muffle(under); }
    }
    if (KID.root && W.kid && KID.host !== W.kid) {   // 발원지 칸이 새로 지어질 때마다 다시 붙인다
      (W.kid.userData.code || []).forEach(o => o.visible = false);
      W.kid.children.forEach(o => { if (o.userData && o.userData.lamp) { o.scale.setScalar(.42); o.position.set(-.55, .12, .35); } });   // 동생 곁 등불 — 아이 손에 맞는 크기로
      W.kid.add(KID.root); KID.host = W.kid;
    }
    if (KID.mixer && KID.root && KID.root.parent) KID.mixer.update(dt);
    ghost.update(dt, t); OMEN.update(dt, t); UNCLE.update(dt, t); updateFoam(dt, t); PROPS.update(t, dt, P, G.state !== 'title' && G.lamp && G.oil > 0); PUZ.update(t, dt, P, G.state !== 'title' && G.lamp && G.oil > 0);
    W.update(t, camera, under, lampPos, G.state === 'title' || !G.lamp || G.oil <= 0 || G.blackT > 0 ? 0 : (G.oil < 20 ? .11 : .22));
    drawGrain(dt); updateSalt(dt); updateEcho(dt, t);
    if (el.traceN._v !== G.items) { el.traceN._v = G.items; el.traceN.textContent = G.items + '/' + W.TRACE_N; }
    // 소금 개수 · 발버둥 표시
    if (el.saltN._v !== G.salt) { el.saltN._v = G.salt; el.saltN.textContent = G.salt; el.salt.classList.toggle('low', G.salt === 0); }
    { const cue = (G.saltCue || 0) > 0 && G.salt > 0; if (cue) G.saltCue -= dt;   // 머리카락에 밀쳐졌을 때 — 소금을 쓰라는 신호
      if (el.salt._cue !== cue) { el.salt._cue = cue; el.salt.classList.toggle('cue', cue); el.btnSalt.classList.toggle('cue', cue); } }
    const grabMash = G.ghost === 'grab' && G.gT > .35, wheelMash = !!G.wheel && G.ghost !== 'grab' && G.ghost !== 'drown';
    const mashOn = G.state === 'play' && (grabMash || wheelMash);
    if (el.mash._on !== mashOn) { el.mash._on = mashOn; el.mash.classList.toggle('show', mashOn); }
    if (mashOn) el.mash.style.setProperty('--p', ((grabMash ? G.grip : G.wheel.sl.prog) * 100).toFixed(1) + '%');
    renderer.render(scene, camera);
  }
  let last = performance.now();
  function loop(now) { const dt = (now - last) / 1000; last = now; if (!G.menu) frame(dt); requestAnimationFrame(loop); }   // 지도·인벤토리가 열려 있으면 멈춘다
  showTitle(); requestAnimationFrame(loop);
  window.__mg = { G, P, W, ghost, camera, start, frame, story: SS, storyTick, nextPage, endStory, heroAct, HERO, jump, crank, take: ghostTake, tick(n, dt) { for (let i = 0; i < (n || 1); i++) frame(dt || 1 / 60); }, clearKeys() { for (const k in keys) keys[k] = false; }, key(c, v) { keys[c] = v; }, action, toggleLamp, warp(z) { P.z = z; P.x = W.cx(z); W.ensure(z); G.cpZ = z; G.cpX = P.x; }, attack(kind) { G.force = kind || ''; G.cool = 99; G.strike = .01; G.holy = false; }, omen, seen: ghostSeen, render() { renderer.render(scene, camera); } };
})();
