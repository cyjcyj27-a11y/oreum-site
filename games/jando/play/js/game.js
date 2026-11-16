// 메인 — 걷기·매달리기·작업(드릴·망치·판자), 카메라, 날(DAY), 화면 글
(function () {
  const T = TERRAIN;
  const EN = (new URLSearchParams(location.search).get('lang') || '').toLowerCase() === 'en';
  const TX = (ko, en) => EN ? en : ko;
  const canvas = document.getElementById('c');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.08, 3200);
  function resize() { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize); resize();
  WORLD.initSky(scene); camera.position.set(0, 2, 12); camera.lookAt(0, 1, 0); renderer.render(scene, camera);

  WORLD.init(scene); PATH.init(scene); BODY.build(scene); HERO.init(scene);
  const DAYS = [6, 10, 12, 14, 16, 18, 20, 20, 22, 22];
  const dayStart = d => DAYS.slice(0, d - 1).reduce((a, b) => a + b, 0);
  const G = { day: 1, coins: 0, falls: 0, lost: 0, started: false, paused: false, over: false, t: 0, shake: 0, wind: 0, windT: 0, gust: 0, msgT: 0, pileN: 0, pilePos: new THREE.Vector3(), clear: false };

  // ── 효과 (불꽃·돌가루·나무 부스러기·돌 조각) ───────
  const FX = (function () {
    const N = 500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), P = [];
    for (let i = 0; i < N; i++) P.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, g: 9.8, drag: 0, r: 1, gc: 1, b: 1 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const sprite = (function () { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.07, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; scene.add(pts);
    const dN = 260, dpos = new Float32Array(dN * 3), dcol = new Float32Array(dN * 3), D = [];
    for (let i = 0; i < dN; i++) D.push({ x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, r: 1, gc: 1, b: 1 });
    const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dgeo.setAttribute('color', new THREE.BufferAttribute(dcol, 3));
    const dpts = new THREE.Points(dgeo, new THREE.PointsMaterial({ size: 0.16, map: sprite, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false })); dpts.frustumCulled = false; scene.add(dpts);
    let si = 0, di = 0;
    function spark(p, n, dir, spd) {
      for (let k = 0; k < n; k++) { const q = P[si++ % N]; q.x = p.x; q.y = p.y; q.z = p.z; const a = Math.random() * 6.28, s = (spd || 3) * (0.4 + Math.random()); q.vx = (dir ? dir.x * s : 0) + Math.cos(a) * s * 0.6; q.vy = (dir ? dir.y * s : 0) + Math.random() * s * 0.8; q.vz = (dir ? dir.z * s : 0) + Math.sin(a) * s * 0.6; q.life = 0.25 + Math.random() * 0.35; q.g = 9.8; q.r = 1; q.gc = 0.62 + Math.random() * 0.2; q.b = 0.2; }
    }
    function dust(p, n, color, spd, up) {
      for (let k = 0; k < n; k++) { const q = D[di++ % dN]; q.x = p.x + (Math.random() - 0.5) * 0.08; q.y = p.y; q.z = p.z + (Math.random() - 0.5) * 0.08; const a = Math.random() * 6.28, s = (spd || 0.6) * Math.random(); q.vx = Math.cos(a) * s; q.vz = Math.sin(a) * s; q.vy = (up || 0.2) * Math.random(); q.life = q.max = 0.8 + Math.random() * 0.9; const c = color || [0.78, 0.68, 0.55]; q.r = c[0]; q.gc = c[1]; q.b = c[2]; }
    }
    // 떨어지는 돌 조각
    const chunks = [], chunkG = new THREE.DodecahedronGeometry(0.05, 0), chunkM = new THREE.MeshStandardMaterial({ color: 0x8a7462, roughness: 1, flatShading: true });
    for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(chunkG, chunkM); m.visible = false; scene.add(m); chunks.push({ m, v: new THREE.Vector3(), w: new THREE.Vector3(), life: 0 }); }
    let ci = 0;
    function chunk(p, dir, sz) { const c = chunks[ci++ % chunks.length]; c.m.visible = true; c.m.position.copy(p); c.m.scale.setScalar((0.5 + Math.random()) * (sz || 1)); c.v.set((dir ? dir.x : 0) * 1.5 + (Math.random() - 0.5), Math.random() * 1.2, (dir ? dir.z : 0) * 1.5 + (Math.random() - 0.5)); c.w.set(Math.random() * 9, Math.random() * 9, Math.random() * 9); c.life = 6; }
    function update(dt) {
      for (let i = 0; i < N; i++) { const q = P[i]; if (q.life <= 0) { pos[i * 3 + 1] = -999; continue; } q.life -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; pos[i * 3] = q.x; pos[i * 3 + 1] = q.y; pos[i * 3 + 2] = q.z; const f = Math.min(1, q.life * 4); col[i * 3] = q.r * f * 1.6; col[i * 3 + 1] = q.gc * f * 1.4; col[i * 3 + 2] = q.b * f; }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      for (let i = 0; i < dN; i++) { const q = D[i]; if (q.life <= 0) { dpos[i * 3 + 1] = -999; continue; } q.life -= dt; q.vy -= 0.4 * dt; q.vx *= 0.98; q.vz *= 0.98; q.x += q.vx * dt + G.windV.x * 0.4 * dt; q.y += q.vy * dt; q.z += q.vz * dt + G.windV.z * 0.4 * dt; dpos[i * 3] = q.x; dpos[i * 3 + 1] = q.y; dpos[i * 3 + 2] = q.z; const f = q.life / q.max; dcol[i * 3] = q.r * f; dcol[i * 3 + 1] = q.gc * f; dcol[i * 3 + 2] = q.b * f; }
      dgeo.attributes.position.needsUpdate = true; dgeo.attributes.color.needsUpdate = true;
      for (const c of chunks) { if (!c.m.visible) continue; c.life -= dt; c.v.y -= 9.8 * dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += c.w.x * dt; c.m.rotation.y += c.w.y * dt; const h = T.collidePoint(c.m.position, 0.04); if (h && c.v.y < 0) { c.v.y = Math.abs(c.v.y) * 0.35; c.v.x += h.nx * 1.2; c.v.z += h.nz * 1.2; } if (c.life <= 0 || c.m.position.y < WORLD.CLOUD_Y - 5) c.m.visible = false; }
    }
    function streak(p, v, color) { const q = D[di++ % dN]; q.x = p.x; q.y = p.y; q.z = p.z; q.vx = v.x; q.vy = v.y; q.vz = v.z; q.life = q.max = 0.9; q.r = color[0]; q.gc = color[1]; q.b = color[2]; }
    return { spark, dust, chunk, streak, update };
  })();
  G.windV = new THREE.Vector3();

  // ── 물건: 판자 그림, 자재 더미, 줄 ─────────────────
  const plankGeo = new THREE.BoxGeometry(1, PATH.THK, 1);
  function plankMesh() { const m = new THREE.Mesh(plankGeo, PATH.S.wood); m.scale.set(1.55, 1, PATH.DEP); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; }
  const carried = plankMesh(); carried.visible = false;
  const pile = new THREE.Group(); scene.add(pile);
  const pileMeshes = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(plankGeo, PATH.S.wood); m.scale.set(1.55, 1, PATH.DEP); m.castShadow = true; m.receiveShadow = true; m.position.y = 0.05 + i * 0.105; m.rotation.y = (Math.random() - 0.5) * 0.12; pile.add(m); pileMeshes.push(m); }
  { const bar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.07), PATH.S.steel); bar.position.set(0, 0.02, 0.35); pile.add(bar); const b2 = bar.clone(); b2.position.z = -0.35; pile.add(b2); }
  // 판자 더미는 잔도 끝 두 칸 뒤로 따라온다(사장님 10/9 A안: 뒷날엔 판자 한 장 가지러 왕복 30초가 넘었다). 첫날 처음 세 칸은 바위턱
  function pileIdx() { return Math.max(dayStart(G.day) - 1, PATH.S.built - 3); }
  function placePile() {
    const s = pileIdx() + 1; G.pileI = s - 1; G.pileLean = s > 0;
    if (s === 0) { const th = T.SHELF.c - 0.25, y = T.SHELF.yt, r = T.baseRadius(y) + T.bump(th, y) + 1.25; G.pilePos.set(Math.cos(th) * r, y, Math.sin(th) * r); pile.rotation.y = -th + Math.PI / 2; }
    else { const sg = PATH.seg(s - 1); G.pilePos.copy(sg.C).addScaledVector(sg.tan, -0.1).addScaledVector(sg.rad, -PATH.DEP / 2 + 0.08); G.pilePos.y = sg.y; pile.rotation.y = -sg.thc + Math.PI / 2; }
    pile.position.copy(G.pilePos);
    // 첫날은 바위턱에 눕혀 쌓고, 잔도 위에서는 안쪽 바위벽에 세워 기대 둔다 (길을 막지 않게)
    const lean = s > 0;
    pileMeshes.forEach((m, i) => {
      if (!lean) { m.rotation.set(0, (Math.sin(i * 7.1) * 0.06), 0); m.position.set(0, 0.05 + i * 0.105, 0); }
      else { m.rotation.set(-Math.PI / 2 + 0.16, 0, 0); m.position.set(0, PATH.DEP / 2 * Math.cos(0.16) + 0.02, 0.06 + i * 0.1); }
    });
    pile.children.forEach(c => { if (pileMeshes.indexOf(c) < 0) c.visible = !lean; });
  }
  // 공구함 — 첫날 바위턱에. 드릴·망치를 E 로 집어 허리 벨트에 찬다
  G.tools = { drill: false, hammer: false }; G.boxPos = new THREE.Vector3();
  const toolbox = new THREE.Group(); scene.add(toolbox);
  { const crate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.42), new THREE.MeshStandardMaterial({ color: 0x9a2a1e, roughness: 0.55, metalness: 0.35 })); crate.position.y = 0.16; crate.castShadow = true; toolbox.add(crate);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 0.44), new THREE.MeshStandardMaterial({ color: 0x6e1a12, roughness: 0.5, metalness: 0.4 })); lid.position.y = 0.335; toolbox.add(lid);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 14, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: 0.7, roughness: 0.4 })); handle.position.y = 0.35; toolbox.add(handle); }
  const boxDrill = new THREE.Group(), boxHammer = new THREE.Group();
  { const y = new THREE.MeshStandardMaterial({ color: 0xf0b420, roughness: 0.45 }), k = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.4, metalness: 0.3 }), st = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.35, metalness: 0.8 }), wd = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.8 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.11, 0.09), y); boxDrill.add(b); const g = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.14), k); g.position.set(-0.06, -0.02, 0.09); boxDrill.add(g); const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), st); bit.rotation.z = Math.PI / 2; bit.position.x = 0.27; boxDrill.add(bit);
    const hh = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.36, 6), wd); hh.rotation.z = Math.PI / 2; boxHammer.add(hh); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), st); hd.position.x = 0.18; boxHammer.add(hd);
    boxDrill.position.set(-0.12, 0.42, -0.05); boxDrill.rotation.y = 0.3; boxHammer.position.set(0.12, 0.38, 0.1); boxHammer.rotation.y = -0.4;
    [boxDrill, boxHammer].forEach(o => { o.traverse(m => m.castShadow = true); toolbox.add(o); }); }
  // 공구함 속 드릴·망치도 Meshy 모델로 (날·머리가 +X 쪽)
  if (window.PROPS) {
    const swap = (grp, name, opt, sc) => PROPS.get(name, opt, m => { grp.children.forEach(c => c.visible = false); m.rotation.y = Math.PI; m.scale.setScalar(sc); m.traverse(o => { o.castShadow = true; }); grp.add(m); });
    swap(boxDrill, 'drill.glb', { rough: 0.55, metal: 0.2 }, 0.22); swap(boxHammer, 'hammer.glb', { rough: 0.6, metal: 0.25 }, 0.19);
  }
  function placeBox() {
    const th = T.SHELF.c + 0.1, y = T.SHELF.yt, r = T.baseRadius(y) + T.bump(th, y) + 0.75;
    G.boxPos.set(Math.cos(th) * r, y, Math.sin(th) * r); toolbox.position.copy(G.boxPos); toolbox.rotation.y = -th + Math.PI / 2;
    toolbox.visible = dayStart(G.day) === 0; boxDrill.visible = !G.tools.drill; boxHammer.visible = !G.tools.hammer;
  }
  function syncPile() { const cap = G.pileLean ? 3 : 8; pileMeshes.forEach((m, i) => m.visible = i < Math.min(cap, G.pileN)); }
  // 안전줄 (12토막, 처지면 늘어진 곡선)
  const ROPE_WEAK = 2;   // 닳는 토막 (고리에서 셋째)
  const ropeN = 12, ropeM = new THREE.MeshStandardMaterial({ color: 0xc8261c, roughness: 0.7 });
  const rope = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), ropeM, ropeN); rope.frustumCulled = false; scene.add(rope);
  const ropeHook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 6, 10), new THREE.MeshStandardMaterial({ color: 0xb0b4ba, metalness: 0.8, roughness: 0.3 })); scene.add(ropeHook);
  const _rm = new THREE.Matrix4(), _rq = new THREE.Quaternion(), _rs = new THREE.Vector3(), _ra = new THREE.Vector3(), _rb = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);
  function ropeOut(p) { const d = Math.hypot(p.x, p.z), R = T.surfaceRadius(Math.atan2(p.z, p.x), p.y) + 0.04; if (d < R) { p.x *= R / d; p.z *= R / d; } }
  const ropeC0 = new THREE.Color(0xc8261c), ropeC1 = new THREE.Color(0xd9c7a2); let ropeThick = 1;   // 상점에서 줄을 올리면 색·굵기가 바뀐다
  function drawRope(a, b, slack) {
    const sag = Math.max(0, slack) * 0.5, wr = G.ropeWear || 0;
    ropeM.color.copy(ropeC0).lerp(ropeC1, wr * 0.8);
    if (G.snapped) { drawStubs(a, b); return; }
    for (let i = 0; i < ropeN; i++) {
      const u0 = i / ropeN, u1 = (i + 1) / ropeN;
      _ra.lerpVectors(a, b, u0); _ra.y -= sag * 4 * u0 * (1 - u0); _rb.lerpVectors(a, b, u1); _rb.y -= sag * 4 * u1 * (1 - u1);
      ropeOut(_ra); ropeOut(_rb);
      if (wr > 0.3) { const j = (wr - 0.3) * 0.025 * Math.sin(G.t * 47 + i * 1.7); _ra.x += j; _rb.z += j; }
      if (HS.gust) { const gl = HS.gustV.length() * 0.012 * Math.sin(G.t * 31 + i * 2.1) * Math.sin(u0 * Math.PI); _ra.x += gl; _ra.z -= gl; }   // 돌풍에 줄이 펄럭   // 팽팽하게 떤다
      const d = _rb.clone().sub(_ra), L = d.length(); _rq.setFromUnitVectors(_Y, d.normalize()); const th = (i === ROPE_WEAK ? 1 - wr * 0.72 : 1) * ropeThick; _rs.set(th, L, th);   // 고리 가까운 한 토막이 닳아 가늘어진다
      _rm.compose(_ra.clone().add(_rb).multiplyScalar(0.5), _rq, _rs); rope.setMatrixAt(i, _rm);
    }
    rope.instanceMatrix.needsUpdate = true; ropeHook.position.copy(a);
  }
  // 끊긴 줄: 고리에 남은 토막은 아래로 늘어져 흔들리고, 하네스에 남은 토막은 몸 위로 펄럭인다
  function drawStubs(a, b) {
    const half = ropeN / 2;
    for (let i = 0; i < ropeN; i++) {
      const top = i < half, k = top ? i : i - half, base = top ? a : b, len = top ? 0.7 : 0.9, dl = len / half;
      const sw = Math.sin(G.t * (top ? 3.1 : 9) + k * 0.6) * 0.05 * k;
      _ra.copy(base).add(new THREE.Vector3(sw, (top ? -1 : 1) * dl * k, sw * 0.5)); _rb.copy(base).add(new THREE.Vector3(sw * 1.2, (top ? -1 : 1) * dl * (k + 1), sw * 0.6));
      const d = _rb.clone().sub(_ra), L = d.length(); _rq.setFromUnitVectors(_Y, d.normalize()); const th = k === half - 1 ? 0.35 : 1; _rs.set(th, L, th);
      _rm.compose(_ra.clone().add(_rb).multiplyScalar(0.5), _rq, _rs); rope.setMatrixAt(i, _rm);
    }
    rope.instanceMatrix.needsUpdate = true; ropeHook.position.copy(a);
  }
  // 떨어뜨린 판자 (굴러 떨어진다)
  const falling = [];
  function dropPlank(pos, quat, vel) { const m = plankMesh(); m.position.copy(pos); m.quaternion.copy(quat); falling.push({ m, v: vel.clone(), w: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3), t: 0, hit: false }); }
  function updateFalling(dt) {
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i]; f.t += dt; f.v.y -= 9.8 * dt; f.m.position.addScaledVector(f.v, dt);
      f.m.rotation.x += f.w.x * dt; f.m.rotation.y += f.w.y * dt; f.m.rotation.z += f.w.z * dt;
      const h = T.collidePoint(f.m.position, 0.3); if (h) { f.v.x += h.nx * 2.5; f.v.z += h.nz * 2.5; f.v.y = Math.max(f.v.y, -2); f.w.multiplyScalar(1.3); if (!f.bonk) { f.bonk = true; AUDIO.play('wood', 0.5, 0.8); FX.dust(f.m.position, 8); } }
      if (f.m.position.y < WORLD.CLOUD_Y && !f.hit) { f.hit = true; AUDIO.play('crack', 0.35, 0.9, 1.6); FX.dust(f.m.position, 20, [0.95, 0.95, 0.95], 2, 1); }
      if (f.m.position.y < WORLD.CLOUD_Y - 30) { scene.remove(f.m); falling.splice(i, 1); }
    }
  }

  // ── 입력 ──────────────────────────────────────────
  const IN = { k: {}, padX: 0, padY: 0, act: false, actPrev: false, jump: false, jumpPrev: false, mouseAct: false, touchAct: false };
  const MOVEK = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, Space: 1, ShiftLeft: 1, ShiftRight: 1, KeyE: 1 };
  window.addEventListener('keydown', e => {
    if (MOVEK[e.code]) e.preventDefault();
    IN.k[e.code] = true;
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') { if (G.started && !G.clear && !(e.code === 'Escape' && performance.now() - lockEscT < 300)) togglePause(); }
    if (e.code === 'KeyB') { if ($('dex').classList.contains('show')) closeDex(); else openDex(); }
    if (e.code === 'KeyM') { AUDIO.init(); AUDIO.setMusic(!AUDIO.musicOn); syncTog(); }
    if (e.code === 'KeyK') { AUDIO.init(); AUDIO.setSfx(!AUDIO.sfxOn); syncTog(); }
    if (!G.started && !G.intro && (e.code === 'Enter')) startGame(!loadGame());
  });
  window.addEventListener('keyup', e => { IN.k[e.code] = false; });
  window.addEventListener('blur', () => { IN.k = {}; IN.mouseAct = false; });
  window.addEventListener('contextmenu', e => e.preventDefault());
  const CAM = { yaw: 0, pitch: 0.28, dist: 4.4, drag: null, tgt: new THREE.Vector3(), cur: new THREE.Vector3(), first: true };
  canvas.addEventListener('pointerdown', e => {
    AUDIO.init();
    // 마우스를 잡는 클릭은 잡기만 한다(사장님 11/16 "잠금 풀려고 클릭하면 나무판을 잡아버림"). 잡힌 뒤의 클릭부터 작업
    if (e.pointerType === 'mouse' && G.started && !locked() && playing() && canvas.requestPointerLock) { lockMouse(); return; }
    if (e.pointerType === 'mouse' && e.button === 0 && G.started) { IN.mouseAct = true; return; }
    CAM.drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  });
  canvas.addEventListener('pointermove', e => {
    if (!CAM.drag || CAM.drag.id !== e.pointerId) return;
    const k = e.pointerType === 'touch' ? 0.009 : 0.006;
    CAM.yaw -= (e.clientX - CAM.drag.x) * k; CAM.pitch = Math.max(-0.45, Math.min(1.05, CAM.pitch + (e.clientY - CAM.drag.y) * k * 0.7));
    CAM.drag.x = e.clientX; CAM.drag.y = e.clientY;
  });
  // PC 표준 마우스 시점(사장님 11/11): 화면을 누르면 마우스를 잡고, 움직이기만 해도 시점이 돈다. Esc 로 풀면 멈춤. 창(멈춤·DAY CLEAR·GAME OVER·엔딩)이 뜨면 저절로 풀어 단추를 누를 수 있게 한다
  const playing = () => G.started && !G.paused && !G.clear && !G.over && !document.getElementById('ending').classList.contains('show');
  const locked = () => document.pointerLockElement === canvas;
  let lockEscT = 0;
  function lockMouse() { if (locked() || !playing() || !canvas.requestPointerLock) return; try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (_) { } }
  document.addEventListener('mousemove', e => {
    if (!locked() || !playing()) return;
    const k = 0.0025;
    CAM.yaw -= (e.movementX || 0) * k; CAM.pitch = Math.max(-0.45, Math.min(1.05, CAM.pitch + (e.movementY || 0) * k * 0.7));
  });
  document.addEventListener('pointerlockchange', () => { if (!locked()) { IN.mouseAct = false; if (playing()) { lockEscT = performance.now(); togglePause(); } } });
  const endPtr = e => { if (e.pointerType === 'mouse' && e.button === 0) IN.mouseAct = false; if (CAM.drag && CAM.drag.id === e.pointerId) CAM.drag = null; };
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
  window.addEventListener('wheel', e => { CAM.dist = Math.max(2.4, Math.min(9, CAM.dist + e.deltaY * 0.004)); }, { passive: true });
  // 폰 패드
  const pad = document.getElementById('pad'), knob = document.getElementById('knob');
  { let id = null;
    const mv = e => { const r = pad.getBoundingClientRect(), Rr = r.width / 2, max = Rr - knob.offsetWidth / 2; const mx = e.clientX - (r.left + Rr), my = e.clientY - (r.top + Rr), d = Math.hypot(mx, my), s = d > max ? max / d : 1; knob.style.transform = 'translate(' + mx * s + 'px,' + my * s + 'px)'; let nx = mx * s / max, ny = my * s / max; if (Math.hypot(nx, ny) < 0.08) nx = ny = 0; IN.padX = nx; IN.padY = -ny; };
    const end = e => { if (id !== e.pointerId) return; id = null; pad.classList.remove('on'); knob.style.transform = ''; IN.padX = IN.padY = 0; };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (id !== null) return; id = e.pointerId; try { pad.setPointerCapture(id); } catch (_) { } pad.classList.add('on'); mv(e); AUDIO.init(); });
    pad.addEventListener('pointermove', e => { if (id === e.pointerId) mv(e); }); pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end); pad.addEventListener('lostpointercapture', end); }
  for (const [id, key] of [['bAct', 'touchAct'], ['bJump', 'touchJump']]) {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); IN[key] = true; el.classList.add('on'); AUDIO.init(); });
    const up = () => { IN[key] = false; el.classList.remove('on'); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  }
  if ('ontouchstart' in window) document.body.classList.add('touch');

  // ── 잔도공 ────────────────────────────────────────
  const WALK = 2.4, RUN = 5.2, CARRY = 1.8, GRAV = 20, HG = 9.8;
  const PL = { mode: 'walk', pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, phase: 0, speed: 0, carry: false, ext: 0, H: new THREE.Vector3(), Hv: new THREE.Vector3(), anchor: new THREE.Vector3(), ropeLen: 2, mantle: null, hammerT: -1, drillK: -1, drilling: false, kickT: 0, airFrom: 0, onWall: false, wallN: new THREE.Vector3(1, 0, 0), wallDist: 0.6, reel: false, grounded: true, lastSafe: new THREE.Vector3() };
  const fwdOf = y => new THREE.Vector3(Math.sin(y), 0, Math.cos(y));
  function camAxes() { const f = new THREE.Vector3(-Math.sin(CAM.yaw), 0, -Math.cos(CAM.yaw)), r = new THREE.Vector3(Math.cos(CAM.yaw), 0, -Math.sin(CAM.yaw)); return { f, r }; }
  function inputVec() {
    let x = (IN.k.KeyD ? 1 : 0) - (IN.k.KeyA ? 1 : 0), y = (IN.k.KeyW ? 1 : 0) - (IN.k.KeyS ? 1 : 0);   // PC 표준: WASD 이동(사장님 11/11)
    x += IN.padX; y += IN.padY; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    return { x, y, run: !!(IN.k.ShiftLeft || IN.k.ShiftRight) || Math.hypot(IN.padX, IN.padY) > 0.82 };
  }
  function groundY(x, z, y) { const a = PATH.groundAt(x, z, y), b = T.groundAt(x, z, y); return Math.max(a.y, b, propGround(x, z, y)); }
  // ── 소품 충돌(사장님 10/7 "물리충돌넣고"): 판자 더미·공구함·내려놓은 판자·정상 정자. 몸은 밀어내고, 윗면이 발보다 0.5 안이면 올라선다 ──
  const loose = [];   // 내려놓은 판자 { m, p: 가운데(y 는 윗면), yaw }
  function addLoose(x, top, z, yaw) { const m = plankMesh(); m.position.set(x, top - PATH.THK / 2, z); m.rotation.y = yaw; loose.push({ m, p: new THREE.Vector3(x, top, z), yaw }); }
  function clearLoose() { loose.forEach(l => scene.remove(l.m)); loose.length = 0; }
  function boxLocal(p, c, yaw) { const dx = p.x - c.x, dz = p.z - c.z, cs = Math.cos(yaw), sn = Math.sin(yaw); return { lx: dx * cs - dz * sn, lz: dx * sn + dz * cs }; }
  function obstacles() {   // 상자 { c(밑면 가운데), yaw, hx, hz, top }
    const o = [];
    const lean = G.pileLean, n = Math.min(lean ? 3 : 8, G.pileN);
    if (n > 0) o.push({ c: G.pilePos, yaw: pile.rotation.y, hx: 0.8, hz: lean ? 0.42 : 0.6, top: G.pilePos.y + (lean ? PATH.DEP : 0.05 + n * 0.105) });
    if (toolbox.visible) o.push({ c: G.boxPos, yaw: toolbox.rotation.y, hx: 0.37, hz: 0.23, top: G.boxPos.y + 0.36 });
    for (const l of loose) o.push({ c: l.p, yaw: l.yaw, hx: 0.78, hz: 0.58, top: l.p.y });
    return o;
  }
  // 정자(pavilion.glb 배율 3.2 를 잰 값): 바위 받침 r<2.95 → +0.34, 마루 r<2.2 → +0.44, 돌난간 r 2.1~2.4 높이 +1.0(계단 쪽 ±0.3rad 은 트임), 기둥 6개 r 1.62 굵기 0.15
  const PAV = { rock: 2.95, rockY: 0.34, floor: 2.2, floorY: 0.44, rail0: 2.1, rail1: 2.4, pillarR: 1.62, pillarT: 0.15, door: 0.3 };
  function pavAng() { return WORLD.S.pavilionDoor; }
  function propGround(x, z, yFeet) {
    let g = -Infinity;
    for (const o of obstacles()) { const l = boxLocal({ x, z }, o.c, o.yaw); if (Math.abs(l.lx) < o.hx && Math.abs(l.lz) < o.hz && o.top <= yFeet + 0.5 && o.top > g) g = o.top; }
    if (WORLD.S.pavilion && yFeet > T.SUMMIT - 1) { const d = Math.hypot(x, z), S = T.SUMMIT; if (d < PAV.floor && S + PAV.floorY <= yFeet + 0.5) g = Math.max(g, S + PAV.floorY); else if (d < PAV.rock && S + PAV.rockY <= yFeet + 0.5) g = Math.max(g, S + PAV.rockY); }
    return g;
  }
  function propClamp(p, R) {
    for (const o of obstacles()) {
      if (o.top <= p.y + 0.5 || p.y > o.top - 0.05 || o.c.y > p.y + 1.8) continue;   // 올라설 수 있거나 이미 위에 있으면 안 민다. 머리 위 층의 더미는 상관없다(사장님 11/16 "여기서 더 안 내려가진다": 한 바퀴 위 판자 더미가 아래층 길을 막았다)
      const l = boxLocal(p, o.c, o.yaw), px = o.hx + R - Math.abs(l.lx), pz = o.hz + R - Math.abs(l.lz);
      if (px <= 0 || pz <= 0) continue;
      const cs = Math.cos(o.yaw), sn = Math.sin(o.yaw);
      if (px < pz) { const sg = Math.sign(l.lx) || 1; p.x += sg * px * cs; p.z -= sg * px * sn; }
      else { const sg = Math.sign(l.lz) || 1; p.x += sg * pz * sn; p.z += sg * pz * cs; }
    }
    if (WORLD.S.pavilion && p.y > T.SUMMIT - 1 && p.y < T.SUMMIT + 2.5) {
      const d = Math.hypot(p.x, p.z), ang = Math.atan2(p.z, p.x), door = Math.abs(T.wrap(ang - pavAng())) < PAV.door;
      if (!door && d > PAV.rail0 - R && d < PAV.rail1 + R && d > 0.01) { const to = d < (PAV.rail0 + PAV.rail1) / 2 ? PAV.rail0 - R : PAV.rail1 + R; p.x *= to / d; p.z *= to / d; }
      for (let k = 0; k < 6; k++) { const a = pavAng() - Math.PI / 2 + (55 + k * 60) * Math.PI / 180, cx = Math.cos(a) * PAV.pillarR, cz = Math.sin(a) * PAV.pillarR, dx = p.x - cx, dz = p.z - cz, dd = Math.hypot(dx, dz), need = PAV.pillarT + R; if (dd < need && dd > 0.001) { p.x = cx + dx / dd * need; p.z = cz + dz / dd * need; } }
    }
  }
  // 지고 있는 판자 네 귀가 절벽에 박히지 않게 몸(base)을 민다 (사장님 10/7 "절벽"). 판자는 몸 앞으로 1.55 길게 뻗어 있어 몸 반지름으로는 못 막는다
  // 판자 위치는 carriedPose 와 같은 식. 내미는 중(ext)엔 얹을 칸이 벽에 붙어 있으니 10cm 까지 봐준다
  function carryWallOut(base, yOff) {
    if (!PL.carry) return;
    const f = fwdOf(PL.yaw), sx = f.z, sz = -f.x, e = PL.ext, ok = e > 0.02 ? 0.1 : -0.04;
    const y = base.y + yOff + (window.HERO_J ? HERO_J.top[1] + 0.1 : 1.95) - e * 0.4;
    for (let it = 0; it < 3; it++) {
      const cx = base.x + f.x * (0.12 + e * 0.95), cz = base.z + f.z * (0.12 + e * 0.95); let moved = false;
      for (const a of [-0.775, 0, 0.775]) for (const b of [-0.575, 0.575]) {
        const x = cx + f.x * a + sx * b, z = cz + f.z * a + sz * b, d = Math.hypot(x, z), R = T.surfaceRadius(Math.atan2(z, x), y) - ok;
        if (d < R) { const k = (R - d) / d; base.x += x * k; base.z += z * k; moved = true; }
      }
      if (!moved) break;
    }
  }
  function wallOut(p, yOff, rad) {   // 몸통이 바위에 박히지 않게 반지름 방향으로 민다
    if (p.y + yOff > T.SUMMIT - 0.02) return;   // 정상 마당 위에는 벽이 없다 (없으면 정상에 선 몸을 밖으로 밀어 떨어뜨린다)
    const d = Math.hypot(p.x, p.z), th = Math.atan2(p.z, p.x), R = T.surfaceRadius(th, p.y + yOff) + rad;
    if (d < R) { const k = R / Math.max(0.01, d); p.x *= k; p.z *= k; return true; }
    return false;
  }
  function hip() { return PL.mode === 'hang' ? PL.H.clone() : PL.pos.clone().setY(PL.pos.y + 0.97); }

  // 고리는 케이블에 걸려 있다. 몸이 0.6m 넘게 옆으로 가면 끌려온다 (그 안에서는 마찰로 버틴다). 끝 고리 너머로는 못 간다
  const _q1 = new THREE.Vector3(), _q2 = new THREE.Vector3();
  // 걸어 둔 고리(확보)보다 위에서 떨어지면 카라비너가 케이블을 타고 그 고리까지 미끄러져 내려간다(사장님 10/9 A안)
  function capP() { let m = -1; for (const j of PATH.S.clips) if (j < PATH.S.built && j > m) m = j; return m; }
  function dragClip(p) {
    if (PL.slide) { updateSlide(); PL.anchorP = PL.slide ? PL.slide.P : capP(); return; }
    const cap = capP();
    if (PL.mode === 'hang') {   // 매달리면 줄은 걸린 고리보다 위로 못 간다. 직전 자리가 그보다 위였으면(걷다가 바로 매달림) 거기서부터 미끄러진다
      if ((PL.anchorP === undefined ? -9 : PL.anchorP) > cap + 0.05) { startSlide(PL.anchorP); PL.anchorP = PL.slide.P; return; }
      PATH.nearestAnchor(p, PL.anchor, cap); PL.anchorP = PATH.S.lastP; return;
    }
    PATH.nearestAnchor(p, PL.anchor); PL.anchorP = PATH.S.lastP;
    if (PL.anchorP > cap + 0.05 && PL.airFrom - PL.pos.y > 0.3) startSlide(PL.anchorP);
  }
  const SLIDE_ROPE = 4.2;
  function startSlide(P) {
    PL.slide = { P, v: 0.5, zipT: 0 }; PL.ropeLen = Math.max(PL.ropeLen, SLIDE_ROPE);
    AUDIO.play('rope', 0.7, 1.2); AUDIO.fx('zip', 0.8);
  }
  let _slideDt = 1 / 60;
  function updateSlide() {
    const S = PL.slide, dt = _slideDt, cap = capP();
    S.v = Math.min(9, S.v + 14 * dt); S.P -= S.v * dt / PATH.cableLen(S.P);
    S.zipT -= dt; if (S.zipT <= 0) { S.zipT = 0.22; AUDIO.fx('zip', 0.5 + S.v / 18); }
    if (S.P <= cap) {
      S.P = cap; PL.slide = null; PATH.anchorAt(cap, PL.anchor);
      AUDIO.play('clank', 1, 0.8); AUDIO.play('rope', 0.9, 0.9); G.shake = Math.max(G.shake, 0.7); FX.spark(PL.anchor, 14, null, 2.5); FX.dust(PL.anchor, 8, [0.8, 0.7, 0.6], 0.6);
      G.falls++; saveGame(); return;
    }
    PATH.anchorAt(S.P, PL.anchor); if (Math.random() < 0.8) FX.spark(PL.anchor, 2, null, 1.6);
  }
  function enterAir(vy) {
    PL.mode = 'air'; PL.grounded = false; PL.airFrom = PL.pos.y; if (vy !== undefined) PL.vel.y = vy;
    PATH.nearestAnchor(hip(), PL.anchor); PL.anchorP = PATH.S.lastP; PL.ropeLen = Math.max(2.15, hip().distanceTo(PL.anchor) + 0.5);
  }
  // ── 줄 끊김(사장님 10/7 "오래 매달려 있으면 끈이 끊어져서 게임오버") ──
  // 매달려 있는 동안 HANG_MAX 초가 차면 끊어진다. 발이 땅·잔도에 닿으면 처음부터. 튜토리얼 중엔 멈춘다
  // WARN 초부터 줄이 바래고 가늘어지고 떨며, 삐걱 소리·실밥이 점점 잦아진다. 화면 글은 띄우지 않는다
  const HANG_MAX = 45, HANG_WARN = 28;
  G.hangT = 0; G.ropeWear = 0; G.snapped = false; G.creakT = 0;
  function updateRope(dt) {
    if (G.snapped) return;
    if (PL.mode === 'hang' && !TUT.S.on) G.hangT += dt * (1 + 0.4 * HS.wet);   // 젖은 줄은 빨리 상한다
    else if (PL.mode === 'walk' || PL.mode === 'mantle') G.hangT = 0;
    G.ropeWear = Math.max(0, Math.min(1, (G.hangT - hangWarn()) / (hangMax() - hangWarn())));
    if (G.ropeWear > 0) {
      G.creakT -= dt;
      if (G.creakT <= 0) {
        const w = G.ropeWear; G.creakT = 2.2 - w * 1.8 + Math.random() * 0.4;
        AUDIO.play('rope', 0.25 + w * 0.5, 0.55 + w * 0.25);
        const mid = ropePoint(ROPE_WEAK + 0.5); FX.dust(mid, 2 + Math.round(w * 6), [0.9, 0.82, 0.62], 0.3 + w * 0.4);
        if (w > 0.6) G.shake = Math.max(G.shake || 0, 0.06 + w * 0.1);
      }
    }
    if (G.hangT >= hangMax() && PL.mode === 'hang') snapRope();
  }
  function ropePoint(seg) { const h = BODY.get('hip'); return PL.anchor.clone().lerp(h, seg / ropeN); }
  function snapRope() {
    G.snapped = true; G.ropeWear = 1;
    const at = ropePoint(ROPE_WEAK + 0.5);
    AUDIO.play('crack', 0.9, 1.6); AUDIO.play('rope', 0.9, 1.3);
    FX.dust(at, 18, [0.92, 0.84, 0.64], 1.4); FX.spark(at, 6, null, 1.2); G.shake = 0.6;
    PL.mode = 'air'; PL.grounded = false; PL.airFrom = PL.H.y - 0.97; PL.pos.copy(PL.H).setY(PL.H.y - 0.97); PL.vel.copy(PL.Hv); PL.vel.y = Math.min(PL.vel.y, 0.5);
    PL.vel.addScaledVector(PL.wallN, 1.2);   // 벽에서 살짝 튕겨 나간다
    if (PL.carry) loseCarried();
    G.falls++; G.snapT = G.t; G.over = false; saveGame();
  }
  // 협곡 바닥에 부딪힘: 쿵·흙먼지·돌 조각·크게 흔들림, 몸은 축 늘어진다. 1.6초 뒤 GAME OVER
  function crash() {
    PL.mode = 'down'; PL.pos.y = T.BASE; PL.vel.set(0, 0, 0);
    AUDIO.play('crack', 1, 0.5); AUDIO.play('clunk', 1, 0.55); AUDIO.play('wood', 0.7, 0.5);
    const p = PL.pos.clone().setY(T.BASE + 0.2); FX.dust(p, 50, [0.55, 0.5, 0.44], 3.2, 1); FX.dust(p, 20, [0.45, 0.42, 0.38], 1.2);
    for (let i = 0; i < 12; i++) FX.chunk(p, new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5));
    G.shake = 1.6; setTimeout(gameOver, 1600);
  }
  function gameOver() {
    if (G.over) return; G.over = true;
    document.getElementById('overH').textContent = Math.max(0, Math.round((PATH.S.built > 0 ? PATH.seg(PATH.S.built - 1).y : 0) - T.BASE)) + 'm';
    document.getElementById('over').classList.add('show'); AUDIO.play('clunk', 0.6, 0.7);
  }
  // RETRY: 오늘(DAY) 처음부터 — 오늘 깐 판자·코인은 되돌리고, 공구는 그대로
  function retryDay() {
    document.getElementById('over').classList.remove('show');
    G.snapped = false; G.over = false; G.hangT = 0; G.ropeWear = 0; falling.length = 0;
    const keep = PATH.S.segs.slice(0, dayStart(G.day)).map(s => [s.tilt || 0, (s.bend || [0, 0])[0], (s.bend || [0, 0])[1]]);
    for (const j of [...PATH.S.clips]) if (j >= dayStart(G.day)) PATH.S.clips.delete(j); PL.slide = null;
    PATH.setBuilt(dayStart(G.day), keep); G.coins = dayCoins0; G.pileN = DAYS[G.day - 1] + 2; clearLoose();
    placePile(); syncPile(); placeBox(); placePlayer(); saveGame(); resetHazards(); dayCard();
  }
  function enterHang() {
    PL.mode = 'hang'; PL.H.copy(PL.pos).setY(PL.pos.y + 0.97); PL.Hv.copy(PL.vel);
    const drop = PL.airFrom - PL.pos.y;
    if (drop > 0.6) { G.shake = Math.min(1, drop * 0.25); AUDIO.play('rope', Math.min(1, 0.4 + drop * 0.15)); FX.dust(PL.anchor, 6, [0.8, 0.7, 0.6], 0.4); }
    if (drop > 2.5) { G.falls++; }
    if (PL.carry) loseCarried();
  }
  function loseCarried() { PL.carry = false; carried.visible = false; PL.ext = 0; dropPlank(carried.position, carried.quaternion, new THREE.Vector3(PL.vel.x, 0, PL.vel.z)); G.lost++; G.coins = Math.max(0, G.coins - 15); flashCoin(-15); saveGame(); }

  function updateWalk(dt) {
    const iv = inputVec(), { f, r } = camAxes();
    if (PL.latch) { if (Math.hypot(iv.x, iv.y) < 0.1) PL.latch = false; else { iv.x = 0; iv.y = 0; } }
    if (HS.stunT > 0) { iv.x = 0; iv.y = 0; }   // 돌에 맞아 비틀   // 매달렸다 올라선 직후: 키를 한 번 뗄 때까지 서 있기
    const wish = new THREE.Vector3().addScaledVector(f, iv.y).addScaledVector(r, iv.x);
    const ext = PL.ext > 0.02;
    const spd = ext ? 0.55 : PL.carry ? CARRY : (iv.run ? RUN : WALK);
    const tvx = wish.x * spd, tvz = wish.z * spd, k = (1 - Math.exp(-(9 - 6.5 * HS.wet) * dt)) * (HS.stunT > 0 ? 0.3 : 1);   // 젖은 판자는 미끄럽다
    PL.vel.x += (tvx - PL.vel.x) * k; PL.vel.z += (tvz - PL.vel.z) * k;
    if (wish.lengthSq() > 0.01) { const ty = Math.atan2(wish.x, wish.z); let d = ty - PL.yaw; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; PL.yaw += d * Math.min(1, dt * (ext ? 2.2 : 11)); }
    const hs0 = Math.hypot(PL.vel.x, PL.vel.z);
    PL.pos.x += PL.vel.x * dt; PL.pos.z += PL.vel.z * dt;
    const brace = hs0 < 0.3 && !PL.carry;   // 가만히 서 있으면 몸을 낮춰 버틴다
    PL.pos.addScaledVector(HS.gustV, (PL.carry ? 0.22 : 0.11) * (brace ? 0.4 : 1) * dt);   // 돌풍에 밀린다 (걸으면 더, 판자를 지면 돛처럼 더)
    wallOut(PL.pos, 0.35, 0.3); wallOut(PL.pos, 1.3, 0.36); wallOut(PL.pos, 1.75, 0.34);   // 어깨 0.36, 삿갓 챙 0.34
    carryWallOut(PL.pos, 0);
    PATH.railClamp(PL.pos); propClamp(PL.pos, 0.3);
    const g = groundY(PL.pos.x, PL.pos.z, PL.pos.y + 0.05);
    if (PL.grounded && g > PL.pos.y - 0.55 && g < PL.pos.y + 0.5) { PL.pos.y += (g - PL.pos.y) * Math.min(1, dt * 18); if (Math.abs(g - PL.pos.y) < 0.01) PL.pos.y = g; PL.vel.y = 0; PL.lastSafe.copy(PL.pos); }
    else if (PL.grounded) { enterAir(0); }
    const hs = Math.hypot(PL.vel.x, PL.vel.z); PL.speed = hs; PL.phase += dt * (2.2 + hs * 2.2) * (hs > 0.15 ? 1 : 0);
    if (jumpPressed() && PL.grounded && !ext) { enterAir(6.4); AUDIO.play('step', 0.5, 0.9); }
    if (hs > 0.3) { const s = Math.floor(PL.phase / Math.PI); if (s !== PL.stepI) { PL.stepI = s; AUDIO.play('step', 0.25 + hs * 0.06, 0.9 + Math.random() * 0.2); } }
    PATH.nearestAnchor(hip(), PL.anchor); PL.anchorP = PATH.S.lastP; PL.slide = null;
  }
  function updateAir(dt) {
    const iv = inputVec(), { f, r } = camAxes();
    const wish = new THREE.Vector3().addScaledVector(f, iv.y).addScaledVector(r, iv.x);
    PL.vel.x += wish.x * 2.5 * dt; PL.vel.z += wish.z * 2.5 * dt;
    PL.vel.y -= GRAV * dt; PL.pos.addScaledVector(PL.vel, dt);
    if (!G.snapped) dragClip(hip());   // 끊긴 뒤엔 고리 토막이 제자리에 남는다
    wallOut(PL.pos, 0.35, 0.3); wallOut(PL.pos, 1.3, 0.3); propClamp(PL.pos, 0.3);
    const g = groundY(PL.pos.x, PL.pos.z, PL.pos.y + 0.3);
    if (G.snapped) {
      PL.vel.y = Math.max(PL.vel.y, -42);   // 공기 저항: 초속 42m 까지 (260m 를 7초쯤에)
      AUDIO.loopVol('wind', Math.min(1, 0.25 + -PL.vel.y / 42 * 0.75));
      if (PL.pos.y <= T.BASE + 0.02) { crash(); return; }
    }
    if (!G.snapped && PL.vel.y <= 0 && PL.pos.y <= g + 0.02 && g > -Infinity) { PL.slide = null; PL.pos.y = g; PL.vel.y = 0; PL.mode = 'walk'; PL.grounded = true; const drop = PL.airFrom - g; if (drop > 0.3) { AUDIO.play('step', 0.7, 0.8); G.shake = Math.min(0.5, drop * 0.12); } return; }
    if (!G.snapped && hip().distanceTo(PL.anchor) > PL.ropeLen) enterHang();
    if (PL.pos.y < -40 && !G.snapped) { PL.pos.copy(PL.lastSafe); PL.vel.set(0, 0, 0); PL.mode = 'walk'; PL.grounded = true; }
  }
  // 매달리기: 하네스 점 하나가 줄(최대 길이)에 묶여 진자처럼 흔들리고, 발은 벽을 딛는다
  function updateHang(dt) {
    const iv = inputVec(), H = PL.H, v = PL.Hv;
    const th = Math.atan2(H.z, H.x), n = PL.wallN.set(Math.cos(th), 0, Math.sin(th)), t = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th));
    const Rw = T.surfaceRadius(th, H.y + 0.1), dd0 = Math.hypot(H.x, H.z); PL.wallDist = dd0 - Rw;
    PL.onWall = PL.wallDist < 0.95;
    PL.reel = false;
    if (iv.y > 0.3) { PL.ropeLen = Math.max(0.55, PL.ropeLen - 1.0 * iv.y * dt); PL.reel = true; }
    if (iv.y < -0.3) { PL.ropeLen = Math.min(10, PL.ropeLen - 1.0 * iv.y * dt); PL.reel = true; }
    v.y -= HG * dt;
    v.addScaledVector(G.windV, dt);
    dragClip(H);
    const { r } = camAxes(); const sgn = t.dot(r) >= 0 ? 1 : -1;
    const side = iv.x * sgn;
    const ropeD = PL.anchor.clone().sub(H); const ropeL = ropeD.length(); ropeD.multiplyScalar(1 / Math.max(1e-4, ropeL));
    if (PL.onWall) {
      const vt = v.dot(t);
      const brace = ((Math.abs(side) > 0.1 || PL.brace) ? 0.85 : 0.25) * (1 - 0.45 * HS.wet);   // 젖은 바위는 미끄럽다
      const gvec = new THREE.Vector3(0, -HG, 0), gperp = gvec.clone().addScaledVector(ropeD, -gvec.dot(ropeD));
      v.addScaledVector(t, -gperp.dot(t) * brace * dt);
      if (Math.abs(side) > 0.1) v.addScaledVector(t, (side * (PL.brace ? 0.6 : 1.5) - vt) * 6 * dt);
      else v.addScaledVector(t, -vt * (PL.brace ? 5 : 1.8) * dt);
      v.y *= Math.exp(-1.5 * dt);
    } else if (Math.abs(side) > 0.1) v.addScaledVector(t, side * 2.2 * dt);   // 벽에서 떨어져 흔들릴 땐 ←→ 로 그네처럼 키운다
    // 흔들려 날아갔다가 X 앞에 착 붙으면 NICE (몸이 멈춘다)
    const touch = PL.wallDist < 0.5;   // 발이 바위에 닿음
    if (!touch) PL.freeT = (PL.freeT || 0) + dt;
    else if (PL.freeT > 0.35) {
      const w = PATH.S.work; let hit = false;
      if (w) for (let k = 0; k < 2; k++) { const a = holeAim(k); if (a && a.d < a.tol * 1.6 && w.drive[k] < 1) hit = true; }
      if (hit) { popMsg('NICE'); v.multiplyScalar(0.12); AUDIO.play('clunk', 0.45, 1.3); FX.dust(H.clone().setY(H.y - 0.9), 6, [0.8, 0.7, 0.6], 0.5); }
      else AUDIO.play('step', 0.45, 0.85);
      PL.freeT = 0;
    } else PL.freeT = 0;
    H.addScaledVector(v, dt);
    carryWallOut(H, -0.97);
    const Rw2 = T.surfaceRadius(th, H.y + 0.1) + 0.42, d2 = Math.hypot(H.x, H.z);
    if (d2 < Rw2) { const k = Rw2 / d2; H.x *= k; H.z *= k; const vn = v.dot(n); if (vn < 0) v.addScaledVector(n, -vn); }
    const D = H.clone().sub(PL.anchor), L = D.length();
    if (L > PL.ropeLen) { D.multiplyScalar(1 / L); H.copy(PL.anchor).addScaledVector(D, PL.ropeLen); const vr = v.dot(D); if (vr > 0) v.addScaledVector(D, -vr); }
    const c = PATH.pushOut(H, 0.12); if (c && c.ny < 0 && v.y > 0) v.y = 0;
    // 몸 전체가 판자를 뚫지 않게(사장님 10/7 "동작 수리", 머리가 판자 위로 솟던 것): 머리(+0.85)가 판자 밑면에 닿으면 몸을 그만큼 내리고 줄을 풀어 주고, 발(-0.95)이 판자 윗면에 닿으면 올린다
    { const hp = H.clone().setY(H.y + 0.85), ch = PATH.pushOut(hp, 0.08);
      if (ch) { const bot = ch.ny > 0 ? hp.y - PATH.THK - 0.16 : hp.y; H.y = bot - 0.85; if (v.y > 0) v.y = 0; const L2 = H.distanceTo(PL.anchor); if (L2 > PL.ropeLen) PL.ropeLen = L2; }
      // 판자 밑에서 ↑ 를 누르고 있으면 판자 바깥 끝을 붙잡고 올라선다(사장님 10/9 "올라가지지도않고": 머리가 막혀 줄만 풀리고 제자리였음)
      PL.blockT = ch && iv.y > 0.3 ? (PL.blockT || 0) + dt : 0;
      if (PL.blockT > 0.25 && underMantle()) return;
      const fp = H.clone().setY(H.y - 0.95), cf = PATH.pushOut(fp, 0.08);
      if (cf) { const top = cf.ny > 0 ? fp.y : fp.y + PATH.THK + 0.16; H.y = top + 0.95; if (v.y < 0) v.y = 0; } }
    PL.speed = Math.abs(v.dot(t)); PL.phase += dt * PL.speed * 6;
    // 내려서기(사장님 11/11 "발판에 내려서기가 어려워"): 발이 판자에 받쳐지는 높이(윗면 +0.06)가 내려서는 기준(+0.03)보다 높아 줄을 아무리 풀어도 못 섰다 → 기준을 +0.1 로, 판자 가장자리도 발이 받쳐지는 폭(0.08)까지
    const gg = Math.max(PATH.groundAt(H.x, H.z, H.y - 0.9, 0.08).y, T.groundAt(H.x, H.z, H.y - 0.9));
    if (gg > -Infinity && H.y - 0.97 <= gg + 0.1 && v.y <= 0.1) { PL.slide = null; PL.mode = 'walk'; PL.grounded = true; PL.latch = true; PL.pos.copy(H).setY(gg); PL.vel.set(0, 0, 0); PL.yaw = Math.atan2(-n.x, -n.z); AUDIO.play('climb', 0.5); return; }
    if (jumpPressed() && !tryMantle() && PL.onWall) {   // 벽 차기: 바깥·옆으로 튕겨 나가 크게 흔들린다
      v.addScaledVector(n, 2.6).addScaledVector(t, side * 2.4); v.y += 0.6; PL.freeT = 0.01;
      AUDIO.play('step', 0.7, 0.75); FX.dust(H.clone().setY(H.y - 0.9).addScaledVector(n, -0.3), 8, [0.8, 0.7, 0.6], 0.7);
    }
  }
  function tryMantle() {
    const H = PL.H; let best = null, bd = 9;
    // 발밑 1.2m 아래 판자까지 Space 로 내려선다(전엔 발보다 높은 곳만 찾아서, 판자 바로 위에 매달려 Space 를 누르면 벽만 찼다)
    for (let dy = -1.6; dy <= 1.4; dy += 0.2) for (let a = 0; a < 13; a++) {
      const ang = a / 12 * Math.PI * 2, rr = a === 12 ? 0 : 0.55, x = H.x + Math.cos(ang) * rr, z = H.z + Math.sin(ang) * rr, y = H.y + dy;
      const g = groundY(x, z, y);
      if (g > -Infinity && g > H.y - 0.97 - 1.2 && g < H.y + 1.35) { const dd = Math.abs(g - H.y) + 0.3; if (dd < bd) { bd = dd; best = new THREE.Vector3(x, g, z); } }
    }
    if (!best) return false;
    const pr = PATH.groundAt(best.x, best.z, best.y + 0.1);
    if (pr.i >= 0) { const s = PATH.seg(pr.i), l = PATH.local(s, best.x, best.z); const u = Math.max(-s.L / 2 + 0.25, Math.min(s.L / 2 - 0.25, l.u)), vv = Math.max(-PATH.DEP / 2 + 0.3, Math.min(PATH.DEP / 2 - 0.35, l.v)); best.copy(s.C).addScaledVector(s.tan, u).addScaledVector(s.rad, vv); best.y = s.y; }
    PL.mantle = { from: H.clone().setY(H.y - 0.97), to: best, t: 0 }; PL.mode = 'mantle'; PL.vel.set(0, 0, 0); PL.slide = null;
    const dir = best.clone().sub(H); PL.yaw = Math.atan2(dir.x, dir.z);
    AUDIO.play('climb', 0.7); return true;
  }
  // 머리 위 판자로: 바깥 끝으로 몸을 빼고(via) → 판자 높이로 → 안으로
  function underMantle() {
    const H = PL.H, pr = PATH.groundAt(H.x, H.z, H.y + 1.2, 0.12); if (pr.i < 0) return false;
    const s = PATH.seg(pr.i), l = PATH.local(s, H.x, H.z), u = Math.max(-s.L / 2 + 0.3, Math.min(s.L / 2 - 0.3, l.u));
    const via = s.C.clone().addScaledVector(s.tan, u).addScaledVector(s.rad, PATH.DEP / 2 + 0.35).setY(H.y - 0.97);
    const to = s.C.clone().addScaledVector(s.tan, u).addScaledVector(s.rad, PATH.DEP / 2 - 0.4).setY(s.y);
    PL.mantle = { from: H.clone().setY(H.y - 0.97), via, to, t: 0 }; PL.mode = 'mantle'; PL.vel.set(0, 0, 0); PL.blockT = 0; PL.slide = null;
    PL.yaw = Math.atan2(-s.rad.x, -s.rad.z); AUDIO.play('climb', 0.7); return true;
  }
  function updateMantle(dt) {
    const m = PL.mantle;
    if (m.via) {   // 바깥으로 빼기 0~0.3 · 올라가기 0.3~0.75 · 안으로 0.75~1 (0.9초)
      m.t += dt / 0.9; const k = Math.min(1, m.t), e = x => x * x * (3 - 2 * x);
      const a = e(Math.min(1, k / 0.3)), b = e(Math.max(0, Math.min(1, (k - 0.3) / 0.45))), c = e(Math.max(0, (k - 0.75) / 0.25));
      PL.pos.copy(m.from).lerp(m.via, a); PL.pos.y = m.from.y + (m.to.y + 0.05 - m.from.y) * b;
      PL.pos.x += (m.to.x - m.via.x) * c; PL.pos.z += (m.to.z - m.via.z) * c; PL.speed = 0;
      if (k >= 1) { PL.mode = 'walk'; PL.grounded = true; PL.latch = true; PL.pos.copy(m.to); PL.mantle = null; PL.lastSafe.copy(PL.pos); }
      return;
    }
    m.t += dt / 0.55; const k = Math.min(1, m.t);
    const up = Math.min(1, k * 1.7), fw = Math.max(0, (k - 0.45) / 0.55);
    PL.pos.set(m.from.x + (m.to.x - m.from.x) * fw, m.from.y + (m.to.y - m.from.y) * up + Math.sin(k * Math.PI) * 0.15, m.from.z + (m.to.z - m.from.z) * fw);
    PL.speed = 0;
    if (k >= 1) { PL.mode = 'walk'; PL.grounded = true; PL.latch = true; PL.pos.copy(m.to); PL.mantle = null; PL.lastSafe.copy(PL.pos); }
  }
  function jumpPressed() { const j = !!(IN.k.Space || IN.touchJump); return j && !IN.jumpPrev; }

  // ── 작업: 자재 집기 · 드릴 · 망치 · 판자 내밀기 ─────
  const WK = { target: null, k: -1, skidT: 0, kickT: 0, settle: null, nice: 0 };
  function actHeld() { return !!(IN.k.KeyE || IN.mouseAct || IN.touchAct); }
  function holeAim(k) {
    const w = PATH.S.work; if (!w) return null;
    const h = PATH.seg(w.i).beams[k];
    if (PL.mode === 'hang') {
      const th = Math.atan2(PL.H.z, PL.H.x), aim = T.surfacePoint(th, Math.max(PL.H.y + 0.2, Math.min(PL.H.y + 0.85, h.hole.y)), 0.01);   // 팔이 닿는 높이 안이면 손을 뻗는다
      return { d: aim.distanceTo(h.hole), aim, tol: 0.15, h };
    }
    if (PL.mode === 'walk') {
      const p = PL.pos, dy = h.hole.y - p.y; if (dy < -0.3 || dy > 1.75) return null;
      const th = Math.atan2(p.z, p.x), wallD = Math.hypot(p.x, p.z) - T.surfaceRadius(th, h.hole.y);
      if (wallD > 1.05) return null;
      const aim = T.surfacePoint(th, h.hole.y, 0.01);
      return { d: aim.distanceTo(h.hole), aim, tol: 0.34, h };   // 서서는 손을 뻗을 수 있다
    }
    return null;
  }
  // 판자를 놓을 자리 앞에 섰나: 짓는 칸의 시작점 가까이
  function nearLayEdge() {
    const w = PATH.S.work; if (!w || PL.mode !== 'walk') return false;
    const s = PATH.seg(w.i), st = s.C.clone().addScaledVector(s.tan, -s.L / 2);
    return Math.hypot(PL.pos.x - st.x, PL.pos.z - st.z) < 1.5 && Math.abs(PL.pos.y - (s.y - T.RISE)) < 0.6;
  }
  // 끝 고리 밑에 섰나 (아직 안 건 고리)
  function clipNear() {
    const j = PATH.S.built - 1; if (j < 0 || PATH.S.clips.has(j)) return false;
    const b = PATH.boltPos(j), dy = b.y - PL.pos.y;
    return Math.hypot(PL.pos.x - b.x, PL.pos.z - b.z) < 1.2 && dy > 0.9 && dy < 2.6;
  }
  function pickTarget() {
    WK.target = null; WK.k = -1;
    if (WK.settle) return;
    if (PL.carry) { if (nearLayEdge() || PL.ext > 0) WK.target = 'lay'; return; }
    if (PL.mode === 'walk' && toolbox.visible && (!G.tools.drill || !G.tools.hammer) && Math.hypot(PL.pos.x - G.boxPos.x, PL.pos.z - G.boxPos.z) < 1.3 && Math.abs(PL.pos.y - G.boxPos.y) < 1) { WK.target = 'tool'; return; }
    if (PL.mode === 'walk') { const ri = relicNear(); if (ri >= 0) { WK.target = 'relic'; WK.k = ri; return; } }
    if (PL.mode === 'walk' && !PL.carry && clipNear()) { WK.target = 'clip'; return; }   // E 를 누르면 고리부터 철컥, 계속 누르고 있으면 다음 프레임부터 드릴질
    if (PL.mode === 'walk' && G.pileN > 0 && Math.hypot(PL.pos.x - G.pilePos.x, PL.pos.z - G.pilePos.z) < 1.5 && Math.abs(PL.pos.y - G.pilePos.y) < 1) { WK.target = 'pile'; return; }
    if (PL.mode === 'walk') { let bi = -1, bd = 1.5; loose.forEach((l, i) => { const d = Math.hypot(PL.pos.x - l.p.x, PL.pos.z - l.p.z); if (d < bd && Math.abs(PL.pos.y - l.p.y) < 1) { bd = d; bi = i; } }); if (bi >= 0) { WK.target = 'loose'; WK.k = bi; return; } }
    const w = PATH.S.work; if (!w) return;
    let best = 9;
    for (let k = 0; k < 2; k++) {
      const a = holeAim(k); if (!a) continue;
      if (w.drill[k] < 1 && G.tools.drill && a.d < 0.65 && a.d < best) { best = a.d; WK.target = 'drill'; WK.k = k; }
      else if (w.drill[k] >= 1 && w.drive[k] < 1 && G.tools.hammer && a.d < 0.45 && a.d < best) { best = a.d; WK.target = 'hammer'; WK.k = k; }
    }
  }
  // 안전줄 고리 표시(사장님 11/16 "나무판 잡기 전에 절벽에 줄 매다는 것도 표시가 없어"): 아직 안 건 끝 고리에 금빛 고리가 뜬다. 손이 닿는 자리에 서면 커지며 깜빡인다. 걸면 사라진다
  const CLIPMK = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.strokeStyle = 'rgba(20,12,6,.65)'; g.lineWidth = 20; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.stroke();
    g.strokeStyle = '#f2cf72'; g.lineWidth = 11; g.beginPath(); g.arc(64, 64, 46, 0, 7); g.stroke();
    g.fillStyle = '#f2cf72'; g.strokeStyle = 'rgba(20,12,6,.7)'; g.lineWidth = 5; g.beginPath(); g.moveTo(64, 118); g.lineTo(50, 98); g.lineTo(78, 98); g.closePath(); g.stroke(); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = 50; m.visible = false; scene.add(m); return m;
  })();
  function updateClipMark() {
    const j = PATH.S.built - 1, on = j >= 0 && !PATH.S.clips.has(j) && G.started && !G.clear && !G.over && !END.on;
    CLIPMK.visible = on; if (!on) return;
    const b = PATH.boltPos(j), th = Math.atan2(b.z, b.x); CLIPMK.position.set(b.x + Math.cos(th) * 0.12, b.y, b.z + Math.sin(th) * 0.12);
    const near = PL.mode === 'walk' && !PL.carry && clipNear(), s = near ? 0.78 + Math.sin(G.t * 9) * 0.08 : 0.55;
    CLIPMK.scale.set(s, s, 1); CLIPMK.material.opacity = near ? 1 : 0.75;
  }
  function updateWork(dt) {
    const held = actHeld(), press = held && !IN.actPrev, release = !held && IN.actPrev;
    pickTarget();
    const w = PATH.S.work; PL.drilling = false; PL.brace = held && (WK.target === 'drill' || WK.target === 'hammer');
    if (WK.target === 'tool' && press) {
      const which = !G.tools.drill ? 'drill' : 'hammer'; G.tools[which] = true; placeBox(); saveGame();
      AUDIO.play('clunk', 0.8, which === 'drill' ? 1 : 1.2); FX.dust(G.boxPos.clone().setY(G.boxPos.y + 0.4), 5, [0.7, 0.6, 0.5], 0.4);
    }
    if (WK.target === 'relic' && press) takeRelic(WK.k);
    if (WK.target === 'clip' && press) {
      const j = PATH.S.built - 1, b = PATH.boltPos(j); PATH.S.clips.add(j); PATH.refresh(); saveGame();
      AUDIO.fx('clip', 1); AUDIO.play('clank', 0.35, 1.7); FX.spark(b, 4, null, 1.2); PL.clipT = 0.35;
    }
    if (WK.target === 'loose' && press) { const l = loose.splice(WK.k, 1)[0]; scene.remove(l.m); PL.carry = true; carried.visible = true; AUDIO.play('wood', 0.6, 1.1); saveGame(); }
    else if (PL.carry && press && !WK.target) putDown();   // 지고 있는데 놓을 데(잔도 끝)가 아니면 그 자리에 내려놓는다 (더미 옆이면 더미로)
    if (WK.target === 'pile' && press) {
      PL.carry = true; carried.visible = true; G.pileN--; syncPile(); AUDIO.play('wood', 0.6, 1.1); FX.dust(G.pilePos.clone().setY(G.pilePos.y + 0.6), 8, [0.7, 0.55, 0.4], 0.5);
      if (G.pileN <= 0 && PATH.S.built + 1 < dayEnd()) { setTimeout(() => { G.pileN += 2; G.coins = Math.max(0, G.coins - 30); flashCoin(-30); syncPile(); AUDIO.play('wood', 0.5, 0.9); }, 1200); }
    }
    if (WK.target === 'drill' && held) {
      const a = holeAim(WK.k);
      if (a && a.d < a.tol) {
        PL.drilling = true;
        const rate = (PL.mode === 'hang' ? 1 / 1.7 : 1 / 1.2) * (1 - a.d / a.tol * 0.5) * (1 - 0.25 * HS.wet) * DRILL_K[G.up.drill];
        w.drill[WK.k] = Math.min(1, w.drill[WK.k] + rate * dt);
        if (Math.random() < 0.7) FX.spark(a.aim, 2, a.h.n, 2.5);
        if (Math.random() < 0.5) FX.dust(a.aim, 1, [0.82, 0.72, 0.6], 0.5, 0.2);
        if (Math.random() < dt * 2.5) FX.chunk(a.aim, a.h.n);
        AUDIO.loopVol('drill', 0.55, 0.95 + Math.random() * 0.1);
        G.shake = Math.max(G.shake, 0.06);
        if (PL.mode === 'hang') {   // 반동: 몸이 옆·바깥으로 튄다
          WK.kickT -= dt;
          if (WK.kickT <= 0) { WK.kickT = 0.12 + Math.random() * 0.08; const th = Math.atan2(PL.H.z, PL.H.x); const t = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th)), n = new THREE.Vector3(Math.cos(th), 0, Math.sin(th)); PL.Hv.addScaledVector(t, (Math.random() - 0.5) * (0.32 + G.day * 0.05)).addScaledVector(n, 0.22); }
        }
        if (w.drill[WK.k] >= 1) { AUDIO.play('clunk', 0.9); FX.dust(a.h.hole, 14, [0.82, 0.72, 0.6], 0.9, 0.3); for (let i = 0; i < 3; i++) FX.chunk(a.h.hole, a.h.n); PATH.refresh(); }
        else if (Math.random() < 0.3) PATH.refresh();
      } else if (a) {   // 빗나감: 드릴이 바위 위를 긁는다
        AUDIO.loopVol('drill', 0.25, 1.25);
        WK.skidT -= dt; if (WK.skidT <= 0) { WK.skidT = 0.18; FX.spark(a.aim, 5, a.h.n, 3.5); w.jit[WK.k] += 1; }
      }
    } else AUDIO.loopVol('drill', 0, 1);
    if (WK.target === 'hammer' && held && PL.hammerT < 0) { PL.hammerT = 0; PL.hammerK = WK.k; }   // 누르고 있으면 계속 내리친다
    if (PL.hammerT >= 0) {
      const before = PL.hammerT; PL.hammerT += dt;
      if (before < 0.13 && PL.hammerT >= 0.13 && w) {
        const k = PL.hammerK, h = PATH.seg(w.i).beams[k];
        let sway = 0; if (PL.mode === 'hang') { const th = Math.atan2(PL.H.z, PL.H.x); sway = Math.abs(PL.Hv.x * -Math.sin(th) + PL.Hv.z * Math.cos(th)); }
        const good = sway < 0.45, tip = h.hole.clone().addScaledVector(h.n, 0.3);
        w.drive[k] = Math.min(1, w.drive[k] + (good ? (G.up.hammer >= 1 ? 1 : 0.5) : (G.up.hammer >= 2 ? 0.5 : 0.2)));   // 상점 망치: 1단 한 방, 2단 빗맞아도 안 휨
        if (!good && G.up.hammer < 2) w.bend[k] = Math.min(0.5, w.bend[k] + 0.08);
        AUDIO.play(good ? 'clank' : 'clank2', 0.9, good ? 1 : 1.25); FX.spark(tip, good ? 8 : 16, h.n, good ? 2.5 : 4);
        G.shake = Math.max(G.shake, good ? 0.12 : 0.2);
        if (w.drive[k] >= 1) { AUDIO.play('clank', 0.7, 1.4, 0.08); if (w.bend[k] < 0.01) popMsg('NICE'); }
        PATH.refresh();
      }
      if (PL.hammerT > 0.36) PL.hammerT = -1;
    }
    // 판자 내밀기 → 떼면 떨어뜨린다
    if (PL.carry) {
      // 쉽게 놓기(사장님 10/7): 누르고 있으면 판자가 쇠기둥 한가운데까지만 나가고 멈춘다. 거기서 떼면 얹히고, 일찍 떼면 떨어뜨리지 않고 도로 거둔다
      if (WK.target === 'lay' && held) {
        // 사장님 11/16 "두번째 판자가 안놔져": 길 방향에서 45도 넘게 돌아서 있으면 판자가 허공으로 나갔다. 누르고 있는 동안 몸을 짓는 칸 쪽으로 돌린다
        if (PL.mode === 'walk' && PATH.S.work) { const tn = PATH.seg(PATH.S.work.i).tan, ty = Math.atan2(tn.x, tn.z); let d = ty - PL.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); PL.yaw += d * Math.min(1, dt * 14); }
        PL.ext = Math.min(2.3, PL.ext + dt * 1.05); const over = layU(); if (over > 0) PL.ext = Math.max(0, PL.ext - over / 0.95); }
      else if (PL.ext > 0 && !held) { if (layOK()) releasePlank(false); else PL.ext = 0; }
    }
    // 판자가 자리 잡는 중
    if (WK.settle) {
      const S = WK.settle; S.t += dt / 0.32; const k = Math.min(1, S.t), e = k < 1 ? 1 - Math.pow(1 - k, 3) : 1;
      S.m.position.lerpVectors(S.p0, S.p1, e); S.m.position.y += Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.08 * (1 - k); S.m.quaternion.slerpQuaternions(S.q0, S.q1, e);
      if (k >= 1) {
        scene.remove(S.m); const ww = PATH.S.work;
        PATH.lay(S.tilt, ww.bend.slice()); G.coins += S.pay; flashCoin(S.pay); if (S.perfect) popMsg('PERFECT');
        AUDIO.play('plank', 1.0); G.shake = 0.35; const s = PATH.seg(PATH.S.built - 1);
        for (let i = 0; i < 5; i++) FX.dust(s.C.clone().addScaledVector(s.tan, (i / 4 - 0.5) * s.L).setY(s.y), 5, [0.75, 0.66, 0.55], 1.2, 0.4);
        WK.settle = null; if (pileIdx() !== G.pileI) { placePile(); syncPile(); } saveGame(); checkDay();
      }
    }
  }
  function carriedPose(dt) {
    if (!PL.carry) return;
    const f = fwdOf(PL.yaw), side = new THREE.Vector3(f.z, 0, -f.x), e = PL.ext;
    G.sway = (G.sway || 0) + dt;
    const wv = G.windV.dot(side), sway = (Math.sin(G.sway * 2.3) * 0.04 + wv * 0.05) * e;
    const base = PL.mode === 'hang' ? PL.H.clone().setY(PL.H.y - 0.97) : PL.pos;
    carried.position.copy(base).addScaledVector(f, 0.12 + e * 0.95).addScaledVector(side, sway); carried.position.y = base.y + (window.HERO_J ? HERO_J.top[1] + 0.1 : 1.95) - e * 0.4 + (PL.mode === 'walk' ? Math.abs(Math.cos(PL.phase)) * 0.03 : 0);
    // 쇠기둥 둘 위에 올라왔나(releasePlank 과 같은 판정) — 왔으면 흔들림 없이 살짝 내려앉고 한 번 '툭'. 여기서 떼면 얹힌다
    const on = layOK();
    if (on) { carried.position.y -= 0.08; carried.rotation.set(0, PL.yaw - Math.PI / 2, 0); if (!G.onStakes) AUDIO.play('wood', 0.35, 1.4); }
    else { carried.rotation.set(0, PL.yaw - Math.PI / 2, 0); carried.rotateX(sway * 0.8); carried.rotateZ(-e * 0.06); }
    G.onStakes = on;
  }
  // 판자 한가운데가 칸 한가운데보다 얼마나 앞섰나(+면 지나침)
  function layU() { const w = PATH.S.work; if (!w) return 0; const s = PATH.seg(w.i), f = fwdOf(PL.yaw), cp = PL.pos.clone().addScaledVector(f, 0.12 + PL.ext * 0.95); return PATH.local(s, cp.x, cp.z).u; }
  // 지금 떼면 얹히나: 쇠기둥 둘이 박혀 있고 판자가 칸 위(앞뒤 0.5·좌우 0.8·방향 50도 안)에 있을 때
  function layOK() {
    const w = PATH.S.work; if (!w || !PL.carry || PL.ext <= 0.02 || w.drive[0] < 1 || w.drive[1] < 1) return false;
    const s = PATH.seg(w.i), f = fwdOf(PL.yaw), cp = PL.pos.clone().addScaledVector(f, 0.12 + PL.ext * 0.95), l = PATH.local(s, cp.x, cp.z);
    return Math.abs(l.u) < 0.5 && Math.abs(l.v) < 0.8 && Math.acos(Math.min(1, Math.abs(f.dot(s.tan)))) < 0.9;
  }
  // 판자 내려놓기(사장님 10/7): 더미 옆이면 더미에 도로, 아니면 앞 1m 바닥(없으면 발밑)에 눕힌다. 다시 E 로 줍는다
  function putDown() {
    const f = fwdOf(PL.yaw);
    if (Math.hypot(PL.pos.x - G.pilePos.x, PL.pos.z - G.pilePos.z) < 1.8 && Math.abs(PL.pos.y - G.pilePos.y) < 1) { G.pileN++; syncPile(); FX.dust(G.pilePos.clone().setY(G.pilePos.y + 0.6), 6, [0.7, 0.55, 0.4], 0.4); }
    else {
      let x = PL.pos.x + f.x * 1.0, z = PL.pos.z + f.z * 1.0, g = groundY(x, z, PL.pos.y + 0.3);
      if (!(g > -Infinity) || Math.abs(g - PL.pos.y) > 0.6) { x = PL.pos.x; z = PL.pos.z; g = PL.pos.y; }
      addLoose(x, g + PATH.THK, z, PL.yaw - Math.PI / 2); FX.dust(new THREE.Vector3(x, g + 0.1, z), 6, [0.7, 0.55, 0.4], 0.4);
    }
    PL.carry = false; carried.visible = false; PL.ext = 0; AUDIO.play('wood', 0.5, 0.95); saveGame();
  }
  function releasePlank(tooFar) {
    const s = PATH.seg(PATH.S.work.i), w = PATH.S.work, c = carried.position.clone(), l = PATH.local(s, c.x, c.z);
    const f = fwdOf(PL.yaw), yawErr = Math.acos(Math.min(1, Math.abs(f.dot(s.tan))));
    const ready = w.drive[0] >= 1 && w.drive[1] >= 1;
    carried.visible = false; PL.carry = false; PL.ext = 0;
    if (!tooFar && ready && Math.abs(l.u) < 0.5 && Math.abs(l.v) < 0.8 && yawErr < 0.9) {
      const m = plankMesh(); m.position.copy(c); m.quaternion.copy(carried.quaternion);
      const tilt = (w.bend[0] + w.bend[1]) * 0.12;
      const q1 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -s.thc + Math.PI / 2).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt));
      const perfect = Math.abs(l.u) < 0.15 && Math.abs(l.v) < 0.12 && w.bend[0] + w.bend[1] < 0.01;
      WK.settle = { m, p0: c, p1: s.C.clone(), q0: m.quaternion.clone(), q1, t: 0, tilt, pay: 40 + (perfect ? 10 : 0) - Math.round((w.bend[0] + w.bend[1]) * 40), perfect };
      AUDIO.play('wood', 0.5, 0.9);
    } else {
      dropPlank(c, carried.quaternion, f.clone().multiplyScalar(0.8).setY(-0.5));
      G.lost++; G.coins = Math.max(0, G.coins - 15); flashCoin(-15); AUDIO.play('wood', 0.6, 0.75); saveGame();
    }
  }

  // ── 튜토리얼: 첫날 처음 한 번. 할 일 한 줄 + 할 곳 위에 아래 화살표 ──
  const TUT = (function () {
    const touch = () => document.body.classList.contains('touch');
    const K = (pc, ph) => touch() ? ph : pc;
    const s0 = () => PATH.seg(0), s1 = () => PATH.seg(1), w = () => PATH.S.work;
    const hole = (i, k) => PATH.seg(i).beams[k].hole;
    const openHole = i => { const x = w(); if (!x || x.i !== i) return null; if (x.drive[1] < 1) return hole(i, 1); if (x.drive[0] < 1) return hole(i, 0); return null; };   // 먼 X 먼저
    const STEPS = [
      { t: () => K('공구함 앞에서 E 를 두 번 눌러 드릴과 망치를 집으세요', '공구함 앞에서 작업 단추를 두 번 눌러 드릴과 망치를 집으세요'), done: () => G.tools.drill && G.tools.hammer, at: () => G.boxPos.clone().setY(G.boxPos.y + 0.45) },
      { t: () => K('벽의 흰 X 앞에 서서 E 를 누르고 있으면 드릴로 구멍을 뚫습니다', '벽의 흰 X 앞에 서서 작업 단추를 누르고 있으면 드릴로 구멍을 뚫습니다'), done: () => PATH.S.built > 0 || w().drill[0] >= 1 || w().drill[1] >= 1, at: () => hole(0, 0) },
      { t: () => K('구멍에 쇠기둥이 꽂혔습니다. E 를 누르고 있으면 망치로 박습니다', '구멍에 쇠기둥이 꽂혔습니다. 작업 단추를 누르고 있으면 망치로 박습니다'), done: () => PATH.S.built > 0 || w().drive[0] >= 1 || w().drive[1] >= 1, at: () => hole(0, w().drill[0] >= 1 ? 0 : 1) },
      { t: () => '옆의 흰 X 도 똑같이 뚫고 박으세요', done: () => PATH.S.built > 0 || (w().drive[0] >= 1 && w().drive[1] >= 1), at: () => hole(0, w().drive[0] >= 1 ? 1 : 0) },
      { t: () => K('판자 더미 앞에서 E 를 눌러 판자를 드세요', '판자 더미 앞에서 작업 단추를 눌러 판자를 드세요'), done: () => PATH.S.built > 0 || PL.carry, at: () => G.pilePos.clone().setY(G.pilePos.y + 1.0) },
      { t: () => K('쇠기둥 앞 바위턱 끝에 서서 E 를 누르고 있으면 판자를 내밉니다. 쇠기둥 위에 오면 떼세요', '쇠기둥 앞 바위턱 끝에 서서 작업 단추를 누르고 있으면 판자를 내밉니다. 쇠기둥 위에 오면 떼세요'), done: () => PATH.S.built > 0, at: () => { const s = s0(); return s.C.clone().addScaledVector(s.tan, -s.L / 2 - 0.4).setY(T.SHELF.yt + 0.3); } },
      { t: () => K('끝 고리 밑에서 E 를 눌러 안전줄을 거세요. 안 걸고 떨어지면 마지막으로 건 고리까지 미끄러져 내려갑니다', '끝 고리 밑에서 작업 단추를 눌러 안전줄을 거세요. 안 걸고 떨어지면 마지막으로 건 고리까지 미끄러져 내려갑니다'), done: () => PATH.S.clips.has(0) || PATH.S.built > 1, at: () => PATH.S.built > 0 ? PATH.boltPos(0).clone().setY(PATH.boltPos(0).y - 0.2) : null },
      { t: () => K('다음 칸 X 두 개도 뚫고 박으세요. 손이 안 닿는 X 는 판자 끝에서 걸어 나가 떨어지면 안전줄에 매달려서 합니다', '다음 칸 X 두 개도 뚫고 박으세요. 손이 안 닿는 X 는 판자 끝에서 걸어 나가 떨어지면 안전줄에 매달려서 합니다'), done: () => PL.mode === 'hang' || PATH.S.built > 1 || (w().drive[0] >= 1 && w().drive[1] >= 1), at: () => openHole(1) },
      { t: () => K('매달린 채 A D 로 벽을 딛고 X 앞으로, W S 로 줄 높이를 맞추고 E 를 누르고 있으세요', '매달린 채 패드 좌우로 벽을 딛고 X 앞으로, 패드 위아래로 줄 높이를 맞추고 작업 단추를 누르고 있으세요'), done: () => PATH.S.built > 1 || (w().drive[0] >= 1 && w().drive[1] >= 1), at: () => openHole(1) },
      { t: () => K('W 로 줄을 감아 올라가거나 판자 가까이에서 Space 로 올라서세요', '패드 위로 줄을 감아 올라가거나 판자 가까이에서 점프 단추로 올라서세요'), done: () => PL.mode === 'walk' || PATH.S.built > 1, at: () => { const s = s0(); return s.C.clone().addScaledVector(s.tan, s.L / 2 - 0.3).setY(s.y + 0.3); } },
      { t: () => K('판자를 하나 더 가져와 잔도 끝에서 E 를 누르고 있다가 쇠기둥 위에서 떼세요', '판자를 하나 더 가져와 잔도 끝에서 작업 단추를 누르고 있다가 쇠기둥 위에서 떼세요'), done: () => PATH.S.built > 1, at: () => PL.carry ? (() => { const s = s0(); return s.C.clone().addScaledVector(s.tan, s.L / 2 - 0.2).setY(s.y + 0.4); })() : G.pilePos.clone().setY(G.pilePos.y + 1.0) },
      { t: () => '이렇게 한 칸씩 이어 가면 됩니다. 오늘은 여섯 칸!', done: () => false, at: () => null, hold: 5 },
    ];
    const S = { i: -1, on: false, t: 0 };
    let el, txt, cnt;
    // 화살표 (할 곳 위에서 오르내림)
    const arrow = (function () { const c = document.createElement('canvas'); c.width = 64; c.height = 96; const g = c.getContext('2d'); g.fillStyle = '#f2cf72'; g.strokeStyle = '#7e140c'; g.lineWidth = 6; g.lineJoin = 'round'; g.beginPath(); g.moveTo(32, 90); g.lineTo(6, 52); g.lineTo(21, 52); g.lineTo(21, 6); g.lineTo(43, 6); g.lineTo(43, 52); g.lineTo(58, 52); g.closePath(); g.stroke(); g.fill(); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true })); sp.scale.set(0.26, 0.39, 1); sp.renderOrder = 20; sp.visible = false; scene.add(sp); return sp; })();
    function show() { const s = STEPS[S.i]; txt.textContent = s.t(); cnt.textContent = (S.i + 1) + '/' + STEPS.length; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); AUDIO.play('click', 0.5, 1.3); }
    function stop() { S.on = false; el.classList.remove('show'); arrow.visible = false; try { localStorage.setItem('jando.tut', '1'); } catch (e) { } }
    function start() {
      el = $('tut'); txt = $('tutTxt'); cnt = $('tutN');
      let seen = false; try { seen = localStorage.getItem('jando.tut') === '1'; } catch (e) { }
      if (seen || G.day !== 1 || PATH.S.built > 0) return;
      $('tutX').onclick = e => { e.stopPropagation(); stop(); };
      S.on = true; S.i = 0; S.t = 0; el.classList.add('show'); show();
    }
    function update(dt) {
      if (!S.on) return;
      const s = STEPS[S.i]; S.t += dt;
      if (s.hold ? S.t > s.hold : s.done()) { if (S.i >= STEPS.length - 1) return stop(); S.i++; S.t = 0; while (S.i < STEPS.length - 1 && STEPS[S.i].done()) S.i++; show(); return; }
      const p = s.at(); arrow.visible = !!p;
      if (p) { arrow.position.copy(p); arrow.position.y += 0.55 + Math.sin(G.t * 5) * 0.08; }
    }
    return { start, update, S, stop };
  })();

  // ── 날(DAY)·코인·저장 ──────────────────────────────
  const dayEnd = () => dayStart(G.day) + DAYS[G.day - 1];
  let dayCoins0 = 0;
  function saveGame() {
    try { localStorage.setItem('jando.save', JSON.stringify({ day: G.day, built: PATH.S.built, coins: G.coins, falls: G.falls, lost: G.lost, pileN: G.pileN, tools: G.tools, up: G.up, clips: [...PATH.S.clips], loose: loose.map(l => [+l.p.x.toFixed(2), +l.p.y.toFixed(2), +l.p.z.toFixed(2), +l.yaw.toFixed(2)]), q: PATH.S.segs.slice(0, PATH.S.built).map(s => [+(s.tilt || 0).toFixed(3), +((s.bend || [0, 0])[0]).toFixed(3), +((s.bend || [0, 0])[1]).toFixed(3)]) })); } catch (e) { }
  }
  function loadGame() { try { const s = JSON.parse(localStorage.getItem('jando.save') || 'null'); return s && s.built !== undefined ? s : null; } catch (e) { return null; } }
  function checkDay() {
    if (PATH.S.built >= dayEnd()) {
      G.clear = true;
      setTimeout(() => {
        const ui = document.getElementById('clear');
        document.getElementById('clrDay').textContent = 'DAY ' + G.day;
        document.getElementById('clrCoin').textContent = '+' + (G.coins - dayCoins0);
        document.getElementById('clrH').textContent = Math.round(PATH.seg(PATH.S.built - 1).y - T.BASE) + 'm';
        shopRender(); ui.classList.add('show'); AUDIO.play('clear', 0.8);
      }, 900);
    }
  }
  function nextDay() {
    document.getElementById('clear').classList.remove('show');
    if (G.day >= DAYS.length) { ending(); return; }
    G.day++; G.clear = false; dayCoins0 = G.coins; G.pileN = DAYS[G.day - 1] + 2; placePile(); syncPile(); saveGame(); resetHazards(); dayCard();
  }
  // ── 상점(사장님 11/11 "160개를 까는동안 작은 보상"): DAY CLEAR 창에서 코인으로 공구를 올린다. 사는 순간 공구 색이 바뀐다(구리 → 금) ──
  G.up = { drill: 0, hammer: 0, rope: 0 };
  const UPG = {
    drill: { name: TX('드릴', 'DRILL'), cost: [400, 1200], fx: [TX('속도 1.5배', 'SPEED x1.5'), TX('속도 2.2배', 'SPEED x2.2')] },
    hammer: { name: TX('망치', 'HAMMER'), cost: [500, 1500], fx: [TX('한 방', 'ONE HIT'), TX('안 휨', 'NO BEND')] },
    rope: { name: TX('안전줄', 'ROPE'), cost: [400, 1200], fx: [TX('70초', '70 SEC'), TX('100초', '100 SEC')] }
  };
  const UP_IC = {
    drill: '<svg viewBox="0 0 40 28"><path d="M3 6h17a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-5l-2 8H6l2-8H3z" fill="currentColor" stroke="#3a2614" stroke-width="2" stroke-linejoin="round"/><path d="M23 11h6l8 1-8 1h-6z" fill="#3a2614"/></svg>',
    hammer: '<svg viewBox="0 0 40 28"><rect x="17" y="6" width="5" height="21" rx="1.5" fill="#8a5a30" stroke="#3a2614" stroke-width="2"/><rect x="6" y="2" width="27" height="10" rx="2" fill="currentColor" stroke="#3a2614" stroke-width="2"/></svg>',
    rope: '<svg viewBox="0 0 40 28"><ellipse cx="20" cy="14" rx="14" ry="10" fill="none" stroke="#3a2614" stroke-width="8"/><ellipse cx="20" cy="14" rx="14" ry="10" fill="none" stroke="currentColor" stroke-width="4.5"/><path d="M31 21l6 5" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>'
  };
  const DRILL_K = [1, 1.5, 2.2], HANG_MAXS = [45, 70, 100], ROPE_COL = [0xc8261c, 0x2a78d8, 0xe8b830], ROPE_THK = [1, 1.35, 1.7];
  const hangMax = () => HANG_MAXS[G.up.rope], hangWarn = () => hangMax() - 17;
  const TIER = [null, { c: 0xffa868, m: 0.6, r: 0.38, e: 0x2a1000 }, { c: 0xffd23a, m: 0.9, r: 0.25, e: 0x4a3200 }];
  const toolMats = { drill: [], hammer: [] };
  function applyUp() {
    for (const k of ['drill', 'hammer']) { const t = TIER[G.up[k]]; for (const m of toolMats[k]) { const b = m.userData.base; if (t) { m.color.setHex(t.c); m.metalness = t.m; m.roughness = t.r; m.emissive.setHex(t.e); } else { m.color.setHex(b.c); m.metalness = b.m; m.roughness = b.r; m.emissive.setHex(0); } } }
    ropeC0.setHex(ROPE_COL[G.up.rope]); ropeThick = ROPE_THK[G.up.rope];
  }
  if (window.PROPS) for (const k of ['drill', 'hammer']) PROPS.get(k + '.glb', k === 'drill' ? { rough: 0.55, metal: 0.2 } : { rough: 0.6, metal: 0.25 }, m => {
    m.traverse(o => { if (o.isMesh && toolMats[k].indexOf(o.material) < 0) { const mt = o.material; mt.userData.base = { c: mt.color.getHex(), m: mt.metalness, r: mt.roughness }; toolMats[k].push(mt); } }); applyUp();
  });
  function shopRender() {
    const el = $('shop'); el.style.display = G.day >= DAYS.length ? 'none' : ''; $('clrHave').textContent = G.coins;
    el.innerHTML = Object.keys(UPG).map(k => { const u = UPG[k], lv = G.up[k], max = lv >= 2;
      return '<button class="up stone' + (max ? ' max' : '') + (!max && G.coins < u.cost[lv] ? ' poor' : '') + '" data-k="' + k + '"><i class="ic t' + lv + '">' + UP_IC[k] + '</i><b>' + u.name + '</b><span class="pip">' + [0, 1, 2].map(i => '<u class="' + (i <= lv ? 'on' : '') + '"></u>').join('') + '</span><small>' + (max ? 'MAX' : u.fx[lv]) + '</small><em>' + (max ? '' : u.cost[lv]) + '</em></button>'; }).join('');
  }
  document.getElementById('shop').addEventListener('click', e => {
    const b = e.target.closest('.up'); if (!b) return; const k = b.dataset.k, lv = G.up[k]; if (lv >= 2) return; const c = UPG[k].cost[lv];
    if (G.coins < c) { AUDIO.play('clunk', 0.35, 0.6); b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); return; }
    G.coins -= c; G.up[k]++; applyUp(); saveGame(); AUDIO.play('clank', 0.8, 1.3); AUDIO.play('clear', 0.45); hudT = 0; shopRender();
    const nb = document.querySelector('#shop [data-k="' + k + '"]'); if (nb) nb.classList.add('got');
    FX.spark(hip(), 14, null, 2.2);
  });

  // ── 옛 잔도공이 남긴 물건 12개: 지은 칸 벽의 녹슨 못에 걸려 있다. 가까이서 E 로 집으면 도감에. 도감은 새로 시작해도 남는다 ──
  const DEX = new Set(); try { JSON.parse(localStorage.getItem('jando.dex') || '[]').forEach(i => DEX.add(i)); } catch (e) { }
  const glintTex = (function () { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,240,190,.55)'); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(31, 4, 2, 56); g.fillRect(4, 31, 56, 2); return new THREE.CanvasTexture(c); })();
  const relics = RELICS.SEGS.map((si, i) => {
    const s = PATH.seg(si), th = s.thc, n = new THREE.Vector3(Math.cos(th), 0, Math.sin(th)), p = T.surfacePoint(th, s.y + 1.4, 0);
    const g = RELICS.build(i); g.position.copy(p); g.rotation.y = Math.atan2(n.x, n.z); g.visible = false; scene.add(g);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glintTex, color: 0xffe9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); gl.position.set(0, -0.2, 0.3); g.add(gl);
    return { i, si, g, gl, p, n, feetY: s.y, placed: false };
  });
  function updateRelics(dt) {
    for (const r of relics) {
      const on = PATH.S.built > r.si && !DEX.has(r.i); r.g.visible = on; if (!on) continue;
      if (!r.placed && window.WORLD && WORLD.S.pillar) { r.placed = true; r.g.position.copy(r.p).addScaledVector(r.n, PATH.visOff({ hole: r.p, n: r.n })); }
      const k = 0.5 + 0.5 * Math.sin(G.t * 2.6 + r.i); r.gl.scale.setScalar(0.22 + k * 0.2); r.gl.material.opacity = 0.35 + k * 0.5; r.gl.material.rotation = G.t * 0.6;
    }
  }
  function relicNear() { for (const r of relics) if (r.g.visible && Math.hypot(PL.pos.x - r.p.x, PL.pos.z - r.p.z) < 1.6 && Math.abs(PL.pos.y - r.feetY) < 1) return r.i; return -1; }
  function takeRelic(i) {
    DEX.add(i); try { localStorage.setItem('jando.dex', JSON.stringify([...DEX])); } catch (e) { }
    const r = relics[i]; r.g.visible = false; AUDIO.play('clank', 0.5, 1.6); AUDIO.play('clear', 0.5); FX.spark(r.g.position.clone().addScaledVector(r.n, 0.2).setY(r.g.position.y - 0.2), 16, r.n, 2);
    G.coins += 30; flashCoin(30); saveGame();
    const el = $('relicPop'); el.querySelector('img').src = RELICS.thumb(renderer, i); el.querySelector('b').textContent = TX(RELICS.L[i].ko, RELICS.L[i].en); el.querySelector('small').textContent = DEX.size + '/' + RELICS.N;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  }
  function dexRender() {
    $('dexN').textContent = DEX.size + '/' + RELICS.N;
    $('dexGrid').innerHTML = RELICS.L.map((r, i) => DEX.has(i) ? '<div class="cell"><img src="' + RELICS.thumb(renderer, i) + '" alt=""><span>' + TX(r.ko, r.en) + '</span></div>' : '<div class="cell no"><i>?</i><span>&nbsp;</span></div>').join('');
  }
  function openDex() { if (!G.started || G.clear || G.over) return; if (G.paused) { if (!$('pause').classList.contains('show')) return; $('pause').classList.remove('show'); } G.paused = true; document.body.classList.add('pz'); IN.k = {}; AUDIO.pause(true); dexRender(); $('dex').classList.add('show'); }
  function closeDex() { $('dex').classList.remove('show'); G.paused = false; document.body.classList.remove('pz'); AUDIO.pause(false); lockMouse(); }
  document.getElementById('dex').addEventListener('click', () => closeDex());
  document.getElementById('btnDex').addEventListener('click', e => { e.stopPropagation(); if (document.getElementById('dex').classList.contains('show')) closeDex(); else openDex(); });

  // ── 엔딩(사장님 11/11 "엔딩 만들어"): 혼자 정자까지 걸어 올라가 자기가 놓은 길을 돌아본다 → 카메라가 물러나며 석주를 감아 올라온 잔도 전체 → 결과표. 다른 사람은 안 나온다(10/7 "혼자 외롭게 길만드는데") ──
  const END = { on: false, t: 0, ph: 0, wp: [], wi: 0, from: null, look: new THREE.Vector3(), a: 0 };
  const END_REVEAL = 13;
  function ending() {
    if (END.on) return;
    END.on = true; END.t = 0; END.ph = 0; END.wi = 0; G.clear = true;
    document.body.classList.add('ending'); document.getElementById('clear').classList.remove('show'); $('tut').classList.remove('show'); resetHazards();
    const s = PATH.seg(T.NSEG - 1), a = pavAng();
    const p0 = s.C.clone().addScaledVector(s.tan, s.L / 2 - 0.25);
    if (PL.mode !== 'walk' || PL.pos.distanceTo(p0) > 8) { PL.pos.copy(s.C).setY(s.y); BODY.teleport(feed()); CAM.first = true; }
    PL.mode = 'walk'; PL.grounded = true; PL.vel.set(0, 0, 0); PL.carry = false; carried.visible = false; PL.ext = 0; PL.slide = null; PL.hammerT = -1; PL.drilling = false; WK.target = null;
    END.wp = [p0, new THREE.Vector3(Math.cos(a) * 4.3, 0, Math.sin(a) * 4.3), new THREE.Vector3(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5)];
    saveGame();
  }
  const angTo = (cur, to, k) => { let d = to - cur; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return cur + d * Math.min(1, k); };
  function updateEnding(dt) {
    END.t += dt;
    if (END.ph === 0) {   // 정자까지 걸어간다 (지친 걸음 1.5m/s)
      const w = END.wp[END.wi], dx = w.x - PL.pos.x, dz = w.z - PL.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.12) { END.wi++; if (END.wi >= END.wp.length) { END.ph = 1; END.t = 0; PL.speed = 0; } }
      else {
        const sp = 1.5, st = Math.min(d, sp * dt); PL.pos.x += dx / d * st; PL.pos.z += dz / d * st;
        const g = groundY(PL.pos.x, PL.pos.z, PL.pos.y + 0.05); if (g > -Infinity) PL.pos.y += (g - PL.pos.y) * Math.min(1, dt * 12);
        PL.yaw = angTo(PL.yaw, Math.atan2(dx, dz), dt * 6); PL.speed = sp; PL.phase += dt * (2.2 + sp * 2.2);
        const si = Math.floor(PL.phase / Math.PI); if (si !== PL.stepI) { PL.stepI = si; AUDIO.play('step', 0.3, 0.9 + Math.random() * 0.2); }
        CAM.yaw = angTo(CAM.yaw, PL.yaw + Math.PI, dt * 1.2); CAM.pitch += (0.22 - CAM.pitch) * Math.min(1, dt * 1.5); CAM.dist += (4.6 - CAM.dist) * Math.min(1, dt * 1.5);
      }
    } else if (END.ph === 1) {   // 돌아서서 온 길을 본다
      const a = pavAng(); PL.speed = 0; PL.yaw = angTo(PL.yaw, Math.atan2(Math.cos(a), Math.sin(a)), dt * 2.2);
      if (END.t > 2.4) { END.ph = 2; END.t = 0; END.from = camera.position.clone(); END.look.copy(CAM.cur); AUDIO.play('clear', 0.8); }
    } else if (END.ph === 2) {
      if (END.t >= END_REVEAL) { END.ph = 3; END.t = 0; showEndCard(); }
    }
  }
  // 물러나는 카메라: 석주 둘레를 돌며 바깥으로·아래로. 끝난 뒤에도 천천히 돈다
  const _el = new THREE.Vector3();
  function endingCam(dt) {
    const f = END.from, S = T.SUMMIT, k0 = END.ph === 2 ? Math.min(1, END.t / END_REVEAL) : 1, k = k0 * k0 * (3 - 2 * k0);
    const a0 = Math.atan2(f.z, f.x), r0 = Math.hypot(f.x, f.z);
    const a = a0 + 1.15 * k + (END.ph === 3 ? END.t * 0.025 : 0), r = r0 + (58 - r0) * k, y = f.y + (S - 12 - f.y) * k;
    camera.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    _el.set(0, S - 27, 0); _el.lerpVectors(END.look, _el, k); camera.lookAt(_el);
  }
  // 결과표: 1080x1350 카드(위는 지금 화면, 아래는 숫자). 저장 = 카드 그림, 공유 = 링크만
  let endCardCv = null;
  function endTitle() {
    const f = G.falls;
    if (f === 0) return TX('한 번도 안 떨어진 잔도공', 'NEVER FELL ONCE');
    if (f <= 5) return TX('줄을 믿는 잔도공', 'TRUSTS THE ROPE');
    if (f <= 20) return TX('줄에 매달려 사는 잔도공', 'LIVES ON THE ROPE');
    return TX('떨어지는 게 일인 잔도공', 'FALLING IS THE JOB');
  }
  function showEndCard() {
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#dcc4a2'); bg.addColorStop(0.5, '#cbb291'); bg.addColorStop(1, '#b39674'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(60,40,20,.10)'; for (let i = 0; i < 900; i++) g.fillRect((i * 733) % W, (i * 419) % H, 2, 2);
    // 지금 화면(석주를 감은 잔도)을 가운데 기준으로 잘라 넣는다
    renderer.render(scene, camera);
    const ix = 44, iy = 44, iw = W - 88, ih = 700, sw0 = canvas.width, sh0 = canvas.height, ar = iw / ih;
    let sw = sw0, sh = sw0 / ar; if (sh > sh0) { sh = sh0; sw = sh0 * ar; }
    g.fillStyle = '#4a0c06'; g.fillRect(ix - 8, iy - 8, iw + 16, ih + 16); g.fillStyle = '#f2cf72'; g.fillRect(ix - 3, iy - 3, iw + 6, ih + 6);
    try { g.drawImage(canvas, (sw0 - sw) / 2, (sh0 - sh) / 2, sw, sh, ix, iy, iw, ih); } catch (e) { }
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.font = '150px Climate, Gmarket, sans-serif'; g.lineWidth = 16; g.strokeStyle = '#f2cf72'; g.strokeText(TX('개통', 'OPEN!'), W / 2, 905); g.fillStyle = '#b8261c'; g.fillText(TX('개통', 'OPEN!'), W / 2, 905);
    g.font = '700 46px Gmarket, sans-serif'; g.fillStyle = '#3a2614'; g.fillText(endTitle(), W / 2, 980);
    const st = [[TX('판자', 'PLANKS'), PATH.S.built], [TX('높이', 'HEIGHT'), Math.round(T.SUMMIT - T.BASE) + 'm'], [TX('추락', 'FALLS'), G.falls], [TX('옛 물건', 'RELICS'), DEX.size + '/' + RELICS.N]];
    const bw = 232, gap = 16, x0 = (W - bw * 4 - gap * 3) / 2;
    st.forEach((s, i) => { const x = x0 + i * (bw + gap), y = 1022;
      g.fillStyle = 'rgba(255,250,235,.45)'; g.fillRect(x, y, bw, 176); g.strokeStyle = '#4e3c2a'; g.lineWidth = 3; g.strokeRect(x, y, bw, 176);
      g.font = '500 34px Gmarket, sans-serif'; g.fillStyle = '#3a2614'; g.fillText(s[0], x + bw / 2, y + 54);
      g.font = '700 72px Gmarket, sans-serif'; g.fillStyle = '#7e140c'; g.fillText(String(s[1]), x + bw / 2, y + 140); });
    g.font = '700 38px Gmarket, sans-serif'; g.fillStyle = '#3a2614'; g.fillText(TX('절벽 잔도공', 'CLIFF WALKER') + '  ·  oreumgames.com', W / 2, 1290);
    endCardCv = cv; try { $('endCard').src = cv.toDataURL('image/jpeg', 0.9); } catch (e) { }
    document.getElementById('ending').classList.add('show');
  }
  document.getElementById('bEndSave').addEventListener('click', () => { if (!endCardCv) return; const a = document.createElement('a'); a.download = 'cliffwalker.png'; a.href = endCardCv.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove(); });
  document.getElementById('bEndShare').addEventListener('click', () => {
    const url = EN ? 'https://oreumgames.com/en/games/jando/' : 'https://oreumgames.com/games/jando/', text = TX('절벽 잔도공 개통! 판자 ' + PATH.S.built + '개, 추락 ' + G.falls + '번', 'Cliff Walker: road opened! ' + PATH.S.built + ' planks, ' + G.falls + ' falls');
    if (navigator.share) navigator.share({ title: TX('절벽 잔도공', 'Cliff Walker'), text, url }).catch(() => { });
    else { try { navigator.clipboard.writeText(text + ' ' + url); popMsg(TX('링크 복사', 'COPIED')); } catch (e) { } }
  });
  function dayCard() { const d = document.getElementById('dayCard'); d.querySelector('b').textContent = 'DAY ' + G.day; d.classList.remove('show'); void d.offsetWidth; d.classList.add('show'); }
  document.getElementById('bNext').addEventListener('click', () => { AUDIO.play('click', 0.6); nextDay(); });
  document.getElementById('bRetry').addEventListener('click', () => { AUDIO.play('click', 0.6); retryDay(); });

  // ── 화면 글 ───────────────────────────────────────
  const $ = id => document.getElementById(id);
  function popMsg(t, bad) { const m = $('msg'); m.textContent = t; m.className = bad ? 'bad' : ''; void m.offsetWidth; m.classList.add('on'); clearTimeout(popMsg.t); popMsg.t = setTimeout(() => m.classList.remove('on'), 900); }
  function flashCoin(d) { const c = $('coinFx'); c.textContent = (d > 0 ? '+' : '') + d; c.className = d > 0 ? '' : 'bad'; void c.offsetWidth; c.classList.add('on'); }
  let hudT = 0;
  function hud(dt) {
    hudT -= dt; if (hudT > 0) return; hudT = 0.15;
    const ds = dayStart(G.day);
    $('sDay').textContent = G.day; $('sPlank').textContent = (PATH.S.built - ds) + '/' + DAYS[G.day - 1];
    $('sH').textContent = Math.round(hip().y - T.BASE); $('sCoin').textContent = G.coins; $('sDex').textContent = DEX.size + '/' + RELICS.N;
  }
  function syncTog() { $('btnMusic').classList.toggle('off', !AUDIO.musicOn); $('btnSfx').classList.toggle('off', !AUDIO.sfxOn); }
  $('btnMusic').addEventListener('click', () => { AUDIO.init(); AUDIO.setMusic(!AUDIO.musicOn); syncTog(); });
  $('btnSfx').addEventListener('click', () => { AUDIO.init(); AUDIO.setSfx(!AUDIO.sfxOn); syncTog(); });
  $('btnPause').addEventListener('click', () => togglePause());
  $('pause').addEventListener('click', () => togglePause());
  function togglePause() { if (!G.started) return; if ($('dex').classList.contains('show')) { closeDex(); return; } G.paused = !G.paused; $('pause').classList.toggle('show', G.paused); document.body.classList.toggle('pz', G.paused); IN.k = {}; AUDIO.pause(G.paused); if (!G.paused) lockMouse(); }
  syncTog();

  // ── 카메라 ────────────────────────────────────────
  const _ct = new THREE.Vector3(), _cd = new THREE.Vector3(), _hit = new THREE.Vector3();
  function updateCam(dt) {
    const yk = (IN.k.ArrowLeft ? 1 : 0) - (IN.k.ArrowRight ? 1 : 0), pk = (IN.k.ArrowUp ? 1 : 0) - (IN.k.ArrowDown ? 1 : 0);
    CAM.yaw += yk * 2.3 * dt; CAM.pitch = Math.max(-0.45, Math.min(1.05, CAM.pitch + pk * 1.3 * dt));
    BODY.get('chest', _ct); _ct.y += 0.3;
    if (CAM.first) { CAM.cur.copy(_ct); CAM.first = false; } else CAM.cur.lerp(_ct, 1 - Math.exp(-10 * dt));
    _cd.set(Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), Math.cos(CAM.yaw) * Math.cos(CAM.pitch));
    let dist = CAM.dist + (PL.mode === 'hang' ? 0.6 : 0);
    if (T.raycast(CAM.cur, _cd, dist + 0.3, _hit)) dist = Math.max(0.6, _hit.distanceTo(CAM.cur) - 0.3);
    camera.position.copy(CAM.cur).addScaledVector(_cd, dist);
    camera.lookAt(CAM.cur);
    // 줄이 끊겨 떨어지는 동안: 몸 위쪽·절벽 바깥에서 내려다보며 따라간다(초속 42m 라 늦게 따라가면 몸을 놓친다). 처음 1초에 걸쳐 그 자리로 옮겨 간다
    if (G.snapped && PL.mode === 'air') {
      BODY.get('chest', _ct); CAM.cur.copy(_ct);
      const d = Math.hypot(_ct.x, _ct.z) || 1, want = new THREE.Vector3(_ct.x / d * 3.2, 4.5, _ct.z / d * 3.2);
      if (!CAM.fallOff) CAM.fallOff = camera.position.clone().sub(_ct);
      CAM.fallOff.lerp(want, 1 - Math.exp(-2.5 * dt));
      camera.position.copy(_ct).add(CAM.fallOff); camera.lookAt(_ct.x, _ct.y - 1.2, _ct.z);
    } else CAM.fallOff = null;
    if (G.shake > 0.001) { camera.position.x += (Math.random() - 0.5) * G.shake * 0.12; camera.position.y += (Math.random() - 0.5) * G.shake * 0.12; G.shake *= Math.exp(-7 * dt); }
  }

  // ── 위험 (사장님 10/8 "위험을 늘리자") ─────────────────────────────
  // 날마다 하나씩 새로 나온다: DAY 2 낙석 · 3 돌풍 · 4 비 · 6 금 간 바위 · 8 천둥번개. 모두 징조를 먼저 보이고 덮친다(메모 horror-omen-pacing)
  // 화면 글은 없다 — 징조(돌가루·잔돌·소리·하늘)로 알린다. 숫자는 평균 기준으로 넉넉히(메모 difficulty-for-average-player)
  const HZ = [null,
    {},                                            // 1 (튜토리얼)
    { rock: 50 },                                  // 2 낙석
    { rock: 46, gust: 55 },                        // 3 + 돌풍
    { rock: 42, gust: 50, rain: 1 },               // 4 + 비
    { rock: 40, gust: 46, rain: 1 },               // 5
    { rock: 38, gust: 42, rain: 1, crack: 0.35 },  // 6 + 금 간 바위
    { rock: 34, gust: 38, rain: 1, crack: 0.45 },  // 7
    { rock: 30, gust: 34, rain: 2, crack: 0.5 },   // 8 + 천둥번개
    { rock: 27, gust: 30, rain: 2, crack: 0.55 },  // 9
    { rock: 24, gust: 27, rain: 2, crack: 0.6 },   // 10
  ];
  const HS = { rockT: 0, gustT: 0, rainT: 0, rainPh: 'dry', rainAmt: 0, dark: 0, wet: 0, rocks: [], omen: null, gust: null, gustV: new THREE.Vector3(), flashT: 0, boltT: 0, thunderAt: -1, stress: [0, 0], crackGrow: [0, 0], crackT: 0, stunT: 0 };
  const hz = () => HZ[Math.min(HZ.length - 1, G.day)] || {};
  const rnd = (a, b) => a + Math.random() * (b - a);
  function hazOn() { return G.started && !G.clear && !G.snapped && !G.paused && !TUT.S.on && !!PATH.S.work; }
  const rockGeo = new THREE.DodecahedronGeometry(1, 0), rockMat = new THREE.MeshStandardMaterial({ color: 0x7d6c5a, roughness: 1, flatShading: true });
  function resetHazards() {
    for (const r of HS.rocks) scene.remove(r.m); HS.rocks.length = 0; HS.omen = null; HS.gust = null; HS.gustV.set(0, 0, 0);
    const h = hz(); HS.rockT = h.rock ? rnd(0.45, 0.8) * h.rock : 1e9; HS.gustT = h.gust ? rnd(0.5, 0.9) * h.gust : 1e9;
    HS.rainPh = 'dry'; HS.rainT = h.rain ? rnd(14, 30) : 1e9; HS.stress = [0, 0]; HS.crackGrow = [0, 0]; HS.stunT = 0; HS.boltT = rnd(6, 12);
  }
  // 소리 크기: 몸에서 멀수록 작게
  const nearVol = (p, d0) => Math.max(0, Math.min(1, 1 - (p.distanceTo(hip()) - (d0 || 3)) / 20));

  // ── 낙석: 머리 위 12~18m 에서 돌가루·잔돌이 2.2초 먼저 흘러내린 뒤 큰 돌이 떨어진다 ──
  function startRockOmen() {
    const hp = hip(), th = Math.atan2(hp.z, hp.x), off = rnd(-1.3, 1.3) / Math.max(4, Math.hypot(hp.x, hp.z));   // 몸에서 옆으로 0~1.3m — 피할 수 있게
    const y = Math.min(T.SUMMIT - 1, hp.y + rnd(9, 13)); const p = T.surfacePoint(th + off, y, 0.35);
    HS.omen = { p, t: 0, pebT: 0, dustT: 0, n: p.clone().setY(0).normalize() };
    AUDIO.fx('crumble', 0.5 + 0.5 * nearVol(p, 8));
  }
  function updateRockOmen(dt) {
    const o = HS.omen; o.t += dt; o.pebT -= dt; o.dustT -= dt;
    if (o.pebT <= 0) { o.pebT = rnd(0.1, 0.2); FX.chunk(o.p.clone().add(new THREE.Vector3(rnd(-0.2, 0.2), 0, rnd(-0.2, 0.2))), o.n.clone().multiplyScalar(0.1), 2.2); if (Math.random() < 0.6) AUDIO.fx('pebble', 0.5 + 0.5 * nearVol(o.p, 6)); }
    // 돌이 내려올 줄을 따라 돌가루가 몸 옆까지 흘러내린다 (카메라에 보이는 징조)
    for (let q = 0; q < 2; q++) { const y = rnd(hip().y - 1.5, o.p.y), f = o.p.clone().setY(y).add(new THREE.Vector3(rnd(-0.25, 0.25), 0, rnd(-0.25, 0.25))); FX.streak(f, new THREE.Vector3(0, -rnd(5, 8), 0), [0.8, 0.72, 0.6]); }
    if (o.dustT <= 0) { o.dustT = 0.25; FX.dust(o.p, 5, [0.78, 0.7, 0.58], 0.4, 0.1); }
    if (o.t > 1.3 && !o.cr2) { o.cr2 = true; AUDIO.fx('crumble', 0.8); }
    if (o.t >= 2.2) { dropRock(o.p, rnd(0.3, 0.45)); HS.omen = null; }
  }
  function dropRock(p, r) {
    const m = new THREE.Mesh(rockGeo, rockMat); m.scale.set(r, r * 0.8, r * 0.9); m.position.copy(p); m.castShadow = true; scene.add(m);
    const n = p.clone().setY(0).normalize();
    HS.rocks.push({ m, r, v: n.multiplyScalar(0.2), w: new THREE.Vector3(rnd(-4, 4), rnd(-4, 4), rnd(-4, 4)), hit: false, bounceT: 0 });
    AUDIO.fx('rockBreak', 0.4 + 0.5 * nearVol(p, 6)); FX.dust(p, 14, [0.78, 0.7, 0.58], 1.0);
  }
  function updateRocks(dt) {
    for (let i = HS.rocks.length - 1; i >= 0; i--) {
      const R = HS.rocks[i], p = R.m.position; R.bounceT -= dt;
      R.v.y -= GRAV * dt; p.addScaledVector(R.v, dt); R.m.rotation.x += R.w.x * dt; R.m.rotation.y += R.w.y * dt; R.m.rotation.z += R.w.z * dt;
      const c = T.collidePoint(p, R.r * 0.8);
      if (c && c.ny < 0.5) { const n = new THREE.Vector3(c.nx, 0, c.nz); const vn = R.v.dot(n); if (vn < 0) R.v.addScaledVector(n, -vn * 1.3); R.v.addScaledVector(n, 0.25); if (R.bounceT <= 0) { R.bounceT = 0.25; AUDIO.fx('rockHit', 0.15 + 0.6 * nearVol(p, 5)); FX.dust(p, 6, [0.78, 0.7, 0.58], 0.6); } }
      const pc = PATH.pushOut(p, R.r * 0.8);
      if (pc && pc.ny > 0 && R.v.y < 0) {   // 판자에 떨어짐: 쿵 튀고 굴러 떨어진다
        R.v.y = Math.abs(R.v.y) * 0.32; R.v.addScaledVector(p.clone().setY(0).normalize(), 1.6); R.w.multiplyScalar(1.3);
        if (R.bounceT <= 0) { R.bounceT = 0.2; AUDIO.fx('rockHit', 0.3 + 0.7 * nearVol(p, 4)); AUDIO.play('wood', 0.3 + 0.5 * nearVol(p, 4), 0.7); FX.dust(p, 12, [0.7, 0.6, 0.48], 1.0); G.shake = Math.max(G.shake, 0.3 * nearVol(p, 3)); }
      }
      if (!R.hit && !G.snapped && PL.mode !== 'down') {   // 몸에 맞았나 (머리·가슴·엉덩이)
        for (const bn of ['head', 'chest', 'hip']) { if (BODY.get(bn).distanceTo(p) < R.r + 0.38) { R.hit = true; rockHitPlayer(R); break; } }
      }
      if (p.y < hip().y - 45 || p.y < WORLD.CLOUD_Y - 10) { scene.remove(R.m); HS.rocks.splice(i, 1); }
    }
  }
  function rockHitPlayer(R) {
    const p = R.m.position, hp = hip(), out = hp.clone().setY(0).normalize(), side = new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(Math.sign((hp.clone().sub(p)).dot(new THREE.Vector3(-out.z, 0, out.x))) || 1);
    AUDIO.fx('bodyHit', 1); AUDIO.fx('rockHit', 0.8); FX.dust(p, 18, [0.7, 0.62, 0.5], 1.4); G.shake = 1.0;
    R.v.multiplyScalar(0.3); R.v.addScaledVector(out, 2.5);
    if (PL.carry) loseCarried();
    if (PL.mode === 'hang') { PL.Hv.addScaledVector(side, 3.2).addScaledVector(out, 1.4); PL.Hv.y -= 1; G.hangT += 10; }   // 줄이 크게 흔들리고 상한다
    else if (PL.mode === 'walk' || PL.mode === 'mantle') { if (PL.mode === 'mantle') { PL.mode = 'walk'; PL.pos.copy(PL.mantle.to); PL.mantle = null; } PL.vel.addScaledVector(out, 1.4).addScaledVector(side, 1.0); HS.stunT = 0.6; }   // 비틀: 0.6초 몸을 못 가눈다(판자 바깥 끝에 서 있었으면 떨어져 줄에 걸린다)
    else if (PL.mode === 'air') PL.vel.addScaledVector(out, 2).addScaledVector(side, 1);
  }

  // ── 돌풍: 휘파람이 1.8초 차오르고 돌가루가 바람 방향으로 날린 뒤 2.6초 세게 민다 ──
  function startGust() {
    const hp = hip(), out = hp.clone().setY(0).normalize(), tan = new THREE.Vector3(-out.z, 0, out.x).multiplyScalar(Math.random() < 0.5 ? -1 : 1);
    const dir = tan.addScaledVector(out, 0.15).normalize();
    HS.gust = { t: 0, dir, str: 1.6 + G.day * 0.15, dustT: 0 };
    AUDIO.fx('gust', 0.9);
  }
  function updateGust(dt) {
    const g = HS.gust; g.t += dt; g.dustT -= dt;
    const k = g.t < 1.8 ? 0.15 * (g.t / 1.8) : g.t < 4.4 ? Math.min(1, (g.t - 1.8) / 0.35) : Math.max(0, 1 - (g.t - 4.4) / 0.8);
    HS.gustV.copy(g.dir).multiplyScalar(g.str * k);
    if (g.dustT <= 0) {   // 바람 위쪽에서 돌가루·잎이 몸 쪽으로 날아온다
      g.dustT = g.t < 1.8 ? 0.06 : 0.025; const hp = hip();
      for (let q = 0; q < 3; q++) { const up = hp.clone().addScaledVector(g.dir, -rnd(2, 5)).add(new THREE.Vector3(rnd(-0.9, 0.9), rnd(-0.6, 1.6), rnd(-0.9, 0.9))); FX.streak(up, g.dir.clone().multiplyScalar(rnd(6, 10) * (0.45 + k)).add(new THREE.Vector3(0, rnd(-0.5, 0.8), 0)), [0.86, 0.8, 0.66]); }
    }
    if (k > 0.5) G.shake = Math.max(G.shake, 0.08 * k);
    if (g.t > 5.2) { HS.gust = null; HS.gustV.set(0, 0, 0); }
  }

  // ── 비: 하늘이 어두워지고 먼 천둥 → 빗방울 → 장대비(45~75초) → 갬. 젖으면 미끄럽고, 줄이 빨리 상하고, 드릴이 느리다 ──
  //    천둥번개(DAY 8~): 비 오는 동안 번쩍 → 0.3~1.2초 뒤 우르릉
  function updateRain(dt) {
    const h = hz(), storm = h.rain === 2; HS.rainT -= dt;
    if (h.rain && HS.rainT <= 0) {
      if (HS.rainPh === 'dry') { HS.rainPh = 'omen'; HS.rainT = 6; AUDIO.fx('thunderFar', 0.8); }
      else if (HS.rainPh === 'omen') { HS.rainPh = 'rain'; HS.rainT = rnd(45, 75); }
      else if (HS.rainPh === 'rain') { HS.rainPh = 'clear'; HS.rainT = 7; }
      else { HS.rainPh = 'dry'; HS.rainT = rnd(35, 60); }
    }
    const want = HS.rainPh === 'omen' ? { amt: 0.12, dark: 0.55 } : HS.rainPh === 'rain' ? { amt: storm ? 1.25 : 1, dark: storm ? 1 : 0.8 } : { amt: 0, dark: 0 };
    if (!h.rain || G.clear || G.snapped) { want.amt = 0; want.dark = 0; }
    HS.rainAmt += (want.amt - HS.rainAmt) * Math.min(1, dt * 0.5); HS.dark += (want.dark - HS.dark) * Math.min(1, dt * 0.35);
    HS.wet = Math.max(HS.wet - dt * 0.02, Math.min(1, HS.rainAmt));   // 그쳐도 한동안 젖어 있다
    WORLD.S.rainAmt = HS.rainAmt; WORLD.S.wDark = HS.dark; WORLD.S.windV = G.windV; AUDIO.rain(Math.min(1, HS.rainAmt));
    // 판자·바위에 튀는 빗방울 (발 둘레)
    if (HS.rainAmt > 0.3 && Math.random() < HS.rainAmt * dt * 14) { const p = (PL.mode === 'hang' ? PL.H.clone().setY(PL.H.y - 0.9) : PL.pos.clone()).add(new THREE.Vector3(rnd(-1.2, 1.2), 0.05, rnd(-1.2, 1.2))); FX.dust(p, 2, [0.75, 0.8, 0.86], 0.5, 0.6); }
    // 번개
    if (storm && HS.rainPh === 'rain' && !G.snapped) {
      HS.boltT -= dt;
      if (HS.boltT <= 0) { HS.boltT = rnd(7, 15); HS.flashT = 0.32; HS.thunderAt = G.t + rnd(0.3, 1.2); }
    }
    if (HS.flashT > 0) { HS.flashT -= dt; const f = HS.flashT / 0.32; WORLD.S.flash = f > 0.6 ? 1 : f > 0.45 ? 0.2 : f > 0.3 ? 0.8 : f * 1.5; } else WORLD.S.flash = 0;   // 두 번 번쩍
    if (HS.thunderAt > 0 && G.t >= HS.thunderAt) { HS.thunderAt = -1; AUDIO.fx('thunder', 1); G.shake = Math.max(G.shake, 0.35); }
  }

  // ── 금 간 바위(DAY 6~): 구멍 둘레에 금. 드릴을 오래 대고 있으면 금이 퍼지며 바스락 → 1.3초 넘게 계속 대면 바위가 떨어져 나가 뚫던 것의 절반을 잃는다 ──
  //    끊어서(짧게 여러 번) 뚫으면 된다. 떼면 0.5초 안에 금이 가라앉는다
  const crackTex = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const R = NOISE.makeRng(606);
    g.strokeStyle = 'rgba(28,20,14,0.95)'; g.lineCap = 'round';
    for (let k = 0; k < 9; k++) {   // 가운데서 뻗는 금 + 곁가지
      let x = 128, y = 128, a = k / 9 * Math.PI * 2 + R() * 0.5, w = 10;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 9; s++) { a += (R() - 0.5) * 0.9; const L = 9 + R() * 9; x += Math.cos(a) * L; y += Math.sin(a) * L; g.lineWidth = w; g.lineTo(x, y); w = Math.max(2.5, w * 0.84); if (R() < 0.3) { g.stroke(); g.beginPath(); g.moveTo(x, y); let bx = x, by = y, ba = a + (R() - 0.5) * 2; for (let q = 0; q < 3; q++) { bx += Math.cos(ba) * 8; by += Math.sin(ba) * 8; g.lineTo(bx, by); } g.lineWidth = 3.5; g.stroke(); g.beginPath(); g.moveTo(x, y); } }
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const crackMeshes = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, fog: true })); m.visible = false; m.renderOrder = 1; scene.add(m); return m; });
  function isCracked(i, k) { const h = hz(); if (!h.crack) return false; const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v) < h.crack; }
  function updateCrack(dt) {
    const w = PATH.S.work;
    for (let k = 0; k < 2; k++) {
      const m = crackMeshes[k], on = !!w && isCracked(w.i, k);
      m.visible = on; if (!on) { HS.stress[k] = 0; continue; }
      const h = PATH.seg(w.i).beams[k], drillingThis = PL.drilling && WK.k === k && w.drill[k] < 1;
      HS.stress[k] = Math.max(0, Math.min(1.2, HS.stress[k] + (drillingThis ? dt / 1.3 : -dt / 0.5)));
      const st = HS.stress[k], sc = 0.85 + HS.crackGrow[k] * 0.3 + st * 0.4;
      m.position.copy(h.hole).addScaledVector(h.n, 0.012 + PATH.visOff(h)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), h.n); m.scale.set(sc, sc, 1); m.material.opacity = 0.55 + st * 0.45;
      if (drillingThis && st > 0.35) {   // 징조: 바스락·돌가루·떨림이 점점 잦아진다
        HS.crackT -= dt; if (HS.crackT <= 0) { HS.crackT = 0.32 - st * 0.22; AUDIO.fx('crackle', 0.4 + st * 0.6); FX.dust(h.hole.clone().addScaledVector(h.n, 0.05).add(new THREE.Vector3(rnd(-0.2, 0.2), rnd(-0.2, 0.2), 0)), 2, [0.78, 0.7, 0.58], 0.4, 0.1); if (Math.random() < 0.4) FX.chunk(h.hole, h.n); G.shake = Math.max(G.shake, 0.05 + st * 0.12); }
      }
      if (st >= 1) breakRock(k, h, w);
    }
  }
  function breakRock(k, h, w) {
    HS.stress[k] = 0.25; HS.crackGrow[k] = Math.min(1.2, HS.crackGrow[k] + 0.35); w.drill[k] *= 0.5; PATH.refresh();   // 뚫던 것의 절반을 잃는다
    AUDIO.fx('rockBreak', 1); AUDIO.loopVol('drill', 0, 1); G.shake = 0.6;
    const p = h.hole.clone().addScaledVector(h.n, 0.15); FX.dust(p, 24, [0.78, 0.7, 0.58], 1.4); for (let i = 0; i < 8; i++) FX.chunk(p, h.n);
    dropRock(p.clone().addScaledVector(h.n, 0.25).setY(p.y - 0.1), 0.2);   // 떨어져 나간 조각 — 밑에 있으면 맞는다
    if (PL.mode === 'hang') PL.Hv.addScaledVector(h.n, 1.6); else { PL.vel.addScaledVector(h.n, 1.2); HS.stunT = 0.35; }
  }

  // ── 한 프레임 ──
  function updateHazards(dt) {
    const on = hazOn(), h = hz();
    HS.stunT = Math.max(0, HS.stunT - dt);
    if (on && h.rock) { if (HS.omen) updateRockOmen(dt); else if ((HS.rockT -= dt) <= 0) { HS.rockT = h.rock * rnd(0.7, 1.3); startRockOmen(); } }
    else if (!on) HS.omen = null;
    updateRocks(dt);
    if (on && h.gust) { if (HS.gust) updateGust(dt); else if ((HS.gustT -= dt) <= 0) { HS.gustT = h.gust * rnd(0.7, 1.3); startGust(); } }
    else if (HS.gust) { HS.gust = null; HS.gustV.set(0, 0, 0); }
    updateRain(dt);
    if (on || PATH.S.work) updateCrack(dt);
  }

  // ── 바람 ──────────────────────────────────────────
  function updateWind(dt) {
    G.windT += dt; const base = 0.15 + (G.day - 1) * 0.18;
    const gust = Math.max(0, Math.sin(G.windT * 0.45) * 0.6 + Math.sin(G.windT * 1.3 + 1) * 0.4);
    const a = G.windT * 0.05; G.windV.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(base * gust * 1.6 * (1 + HS.dark * 0.4)).add(HS.gustV);
    if (!G.snapped) AUDIO.loopVol('wind', 0.12 + Math.min(0.5, base * gust * 0.4));
  }

  // ── 한 프레임 ─────────────────────────────────────
  const bodyState = {};
  function feed() {
    const st = bodyState; for (const k in st) delete st[k];
    st.t = G.t; st.carry = PL.carry; st.ext = PL.ext; st.phase = PL.phase; st.speed = PL.speed;
    st.hammer = PL.hammerT; st.drill = PL.drilling || (WK.target === 'drill' && actHeld());
    st.drillShow = WK.target === 'drill' || PL.drilling; st.drilling = PL.drilling; st.belt = { d: G.tools.drill, h: G.tools.hammer };
    if (PL.mode === 'hang') {
      st.mode = 'hang'; st.root = PL.H; st.up = PL.anchor.clone().sub(PL.H).normalize(); st.wallN = PL.wallN.clone(); st.wallDist = PL.wallDist; st.reel = PL.reel; { const a = WK.k >= 0 && PATH.S.work ? PATH.seg(PATH.S.work.i).beams[WK.k].hole : null; st.drillY = a ? Math.max(0.2, Math.min(0.85, a.y - PL.H.y)) : 0.5; }
      st.drillDir = PL.wallN.clone().negate();
    } else if (PL.mode === 'air') { st.mode = 'air'; st.root = PL.pos; st.fwd = fwdOf(PL.yaw); }
    else if (PL.mode === 'down') { st.mode = 'down'; st.root = PL.pos; st.fwd = fwdOf(PL.yaw); }
    else {
      st.mode = 'walk'; st.root = PL.pos; st.fwd = fwdOf(PL.yaw); st.crouch = PL.mode === 'mantle' ? 0.5 * Math.sin(Math.min(1, PL.mantle.t) * Math.PI) : (HS.gustV.length() > 0.6 && PL.speed < 0.3 && !PL.carry ? 0.3 : 0);   // 돌풍에 버틸 때 몸을 낮춘다
      if (WK.target === 'drill' || WK.target === 'hammer') { const a = holeAim(WK.k); if (a) { st.drillY = Math.max(0.45, Math.min(1.5, a.h.hole.y - PL.pos.y)); st.crouch = Math.max(0, Math.min(0.6, (0.9 - st.drillY) * 0.9)); st.drillDir = a.h.n.clone().negate(); } }
    }
    return st;
  }
  function tick(dt) {
    G.t += dt;
    if (locked() && !playing()) { try { document.exitPointerLock(); } catch (_) { } }
    if (!G.started) { titleCam(dt); WORLD.update(dt, G.t, camera.position); BODY.step(feed(), dt); BODY.draw(bodyState); renderer.render(scene, camera); return; }
    if (G.paused) { renderer.render(scene, camera); return; }
    updateWind(dt);
    if (!G.clear || PL.mode !== 'walk') {
      _slideDt = dt; if (PL.mode === 'walk') updateWalk(dt); else if (PL.mode === 'air') updateAir(dt); else if (PL.mode === 'hang') updateHang(dt); else if (PL.mode === 'mantle') updateMantle(dt);
    }
    if (G.snapped && !G.over && PL.mode !== 'down' && G.t - G.snapT > 14) gameOver();   // 어디 걸려 못 떨어져도 창은 뜬다
    if (END.on) updateEnding(dt); else updateWork(dt); updateClipMark();
    carriedPose(dt); updateRope(dt); updateHazards(dt); updateRelics(dt);
    BODY.step(feed(), dt); BODY.draw(bodyState);
    const harness = BODY.get('hip'); const dist = harness.distanceTo(PL.anchor);
    drawRope(PL.anchor, harness, PL.mode === 'hang' || PL.mode === 'air' ? PL.ropeLen - dist : 0.35);
    FX.update(dt); updateFalling(dt);
    if (END.on && END.ph >= 2) endingCam(dt); else updateCam(dt);
    WORLD.update(dt, G.t, camera.position); hud(dt); if (!END.on) TUT.update(dt);
    IN.jumpPrev = !!(IN.k.Space || IN.touchJump); IN.actPrev = actHeld();
    if (!G.noRender) renderer.render(scene, camera);
  }
  let titleA = 0;
  function titleCam(dt) {
    titleA += dt * 0.06;
    const c = G.pilePos.clone(); c.y += 1.2;
    camera.position.set(c.x + Math.cos(titleA + 0.6) * 11, c.y + 3.2, c.z + Math.sin(titleA + 0.6) * 11);
    const d = Math.hypot(camera.position.x, camera.position.z), th = Math.atan2(camera.position.z, camera.position.x), R = T.surfaceRadius(th, camera.position.y) + 1.5;
    if (d < R) { camera.position.x *= R / d; camera.position.z *= R / d; }
    camera.lookAt(c.x, c.y, c.z);
  }

  // ── 시작 ──────────────────────────────────────────
  function placePlayer() {
    const ds = dayStart(G.day);
    if (PATH.S.built <= 0) { const p = G.pilePos.clone(), th = Math.atan2(p.z, p.x); PL.pos.set(Math.cos(th + 0.16) * Math.hypot(p.x, p.z), T.SHELF.yt, Math.sin(th + 0.16) * Math.hypot(p.x, p.z)); }
    else { const s = PATH.seg(Math.max(0, PATH.S.built - 1)); PL.pos.copy(s.C).addScaledVector(s.tan, 0.2).addScaledVector(s.rad, -0.1); PL.pos.y = s.y; }
    const s0 = PATH.seg(Math.min(T.NSEG - 1, PATH.S.built)); PL.yaw = Math.atan2(s0.tan.x, s0.tan.z);
    PL.mode = 'walk'; PL.grounded = true; PL.vel.set(0, 0, 0); PL.lastSafe.copy(PL.pos); PATH.nearestAnchor(hip(), PL.anchor); PL.anchorP = PATH.S.lastP; PL.slide = null;
    PL.carry = false; carried.visible = false; PL.ext = 0; PL.hammerT = -1;
    CAM.yaw = PL.yaw + Math.PI; CAM.pitch = 0.3; CAM.first = true;
    BODY.teleport(feed());
  }
  function startGame(fresh) {
    AUDIO.init(); AUDIO.play('click', 0.6);
    if (fresh) { try { localStorage.removeItem('jando.save'); } catch (e) { } PATH.setBuilt(0); G.day = 1; G.coins = 0; G.falls = 0; G.lost = 0; G.pileN = DAYS[0] + 2; G.tools = { drill: false, hammer: false }; G.up = { drill: 0, hammer: 0, rope: 0 }; applyUp(); PATH.S.clips = new Set([-1]); PL.slide = null; clearLoose(); G.snapped = false; G.hangT = 0; G.ropeWear = 0; placePile(); syncPile(); placeBox(); placePlayer(); try { localStorage.removeItem('jando.tut'); } catch (e) { } }
    $('title').classList.add('hide'); begin();
  }
  function begin() {
    G.started = true; dayCoins0 = G.coins; $('title').classList.add('hide'); document.body.classList.add('playing'); resetHazards(); dayCard(); TUT.start();
    AUDIO.startLoop('wind', 0.15);
    if (PATH.S.built >= T.NSEG) ending();   // 다 지은 저장을 이어 하면 바로 엔딩
  }
  // 이어하기
  const sv = loadGame();
  if (sv) { G.day = sv.day; G.coins = sv.coins; G.falls = sv.falls || 0; G.lost = sv.lost || 0; G.tools = sv.tools || { drill: sv.built > 0, hammer: sv.built > 0 }; if (sv.up) { G.up = { drill: sv.up.drill | 0, hammer: sv.up.hammer | 0, rope: sv.up.rope | 0 }; applyUp(); } PATH.S.clips = new Set(sv.clips || [-1, ...Array.from({ length: sv.built }, (_, i) => i)]); PATH.setBuilt(sv.built, sv.q); G.pileN = sv.pileN === undefined ? DAYS[G.day - 1] + 2 : sv.pileN; if (PATH.S.built >= dayStart(G.day) + DAYS[G.day - 1] && G.day < DAYS.length) { G.day++; G.pileN = DAYS[G.day - 1] + 2; } }
  else { G.pileN = DAYS[0] + 2; }
  placePile(); syncPile(); placeBox(); placePlayer();
  if (sv && sv.loose) for (const a of sv.loose) addLoose(a[0], a[1], a[2], a[3]);
  $('bStart').addEventListener('click', () => startGame(!sv));
  if (sv) { $('bStart').textContent = TX('이어하기', 'CONTINUE'); $('bNew').hidden = false; $('bNew').addEventListener('click', () => startGame(true)); }
  $('bAgain').addEventListener('click', () => { $('ending').classList.remove('show'); END.on = false; document.body.classList.remove('ending'); G.clear = false; CAM.dist = 4.4; startGame(true); });

  let last = performance.now();
  function loop(ts) { const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000)); last = ts; tick(dt); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  // 시험 손잡이
  window.__jd = { END, DEX, relics, takeRelic, shopRender, openDex, applyUp, G, PL, IN, CAM, WK, PATH, BODY, camera, renderer, scene, HS, HZ, resetHazards, startRockOmen, startGust, dropRock, loose, propGround, propClamp, tick(n, dt) { for (let i = 0; i < (n || 1); i++) tick(dt || 1 / 60); }, start: startGame, placePlayer, nextDay, hip, holeAim, feed };
})();
