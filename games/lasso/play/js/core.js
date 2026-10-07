// core.js — 화면·빛·하늘·카메라·입력·모델 불러오기·소리
(function () {
  const V3 = THREE.Vector3, PI = Math.PI;
  const Q = new URLSearchParams(location.search);
  const touch = matchMedia('(pointer: coarse)').matches || Q.has('touch');

  // ── 화면 ──────────────────────────────────────────
  const canvas = document.getElementById('c');
  const R = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  R.setPixelRatio(dpr);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.98;
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  const S = new THREE.Scene();
  const FOG = 0xf0c59a;
  S.fog = new THREE.Fog(FOG, 140, 780);

  // 하늘 — 해 질 녘: 위는 짙은 파랑, 지평선은 살구빛, 해 둘레는 금빛
  const SUN_DIR = new V3(0.62, 0.42, 0.46).normalize();
  const skyU = { top: { value: new THREE.Color(0x2f5fa8) }, mid: { value: new THREE.Color(0x8fb4d8) }, hor: { value: new THREE.Color(FOG) }, sun: { value: SUN_DIR.clone() }, sunCol: { value: new THREE.Color(0xffd08a) } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, hor, sunCol; uniform vec3 sun; varying vec3 vD;
      void main(){ float h = max(vD.y, 0.0);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h)); c = mix(c, top, smoothstep(0.16, 0.75, h));
        float s = max(dot(vD, sun), 0.0);
        c += sunCol * (pow(s, 900.0) * 4.0 + pow(s, 40.0) * 0.45 + pow(s, 5.0) * 0.22);
        c = mix(c, hor * 0.9, smoothstep(0.0, -0.2, vD.y)); gl_FragColor = vec4(c, 1.0); }`
  }));
  sky.renderOrder = -10; S.add(sky);

  // 빛: 낮은 해(그림자 하나) + 하늘/땅 반구광 + 반대편 푸른 채움광. 빛 개수는 바꾸지 않는다
  const hemi = new THREE.HemisphereLight(0xc4d6f5, 0xc08a56, 1.1); S.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd6a0, 2.7);
  sun.castShadow = true; sun.shadow.mapSize.set(touch ? 1024 : 2048, touch ? 1024 : 2048);
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05;
  const sc = sun.shadow.camera; sc.left = -46; sc.right = 46; sc.top = 46; sc.bottom = -46; sc.near = 1; sc.far = 320;
  S.add(sun); S.add(sun.target);
  const fill = new THREE.DirectionalLight(0x9db8ff, 0.4); fill.position.set(-60, 50, -50); S.add(fill);
  function placeSun(target) {
    // 그림자 지도가 떨리지 않게 2m 칸에 맞춘다
    const tx = Math.round(target.x / 2) * 2, tz = Math.round(target.z / 2) * 2;
    sun.target.position.set(tx, target.y, tz);
    sun.position.set(tx, target.y, tz).addScaledVector(SUN_DIR, 150);
    sun.target.updateMatrixWorld();
  }

  (function () { // 환경맵 — 하늘을 한 번 구워 재질이 하늘빛을 조금 받게
    const pm = new THREE.PMREMGenerator(R);
    const es = new THREE.Scene(); es.add(sky.clone());
    S.environment = pm.fromScene(es, 0.04).texture;
  })();

  // ── 카메라 ────────────────────────────────────────
  // 걸을 땐 저절로 돌지 않는다(끌기·Z·C 로만). 말을 타면 차처럼 말 뒤를 따라간다(chase)
  const cam = new THREE.PerspectiveCamera(50, 1, 0.3, 2400);
  const _od = new V3(), _or = new THREE.Raycaster();
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const CAM = {
    target: new V3(), yaw: 0, pitch: 0.3, dist: 8, tYaw: 0, tPitch: 0.3, tDist: 8, tTarget: new V3(),
    minD: 3, maxD: 22, follow: null, chase: null, off: 0, manualT: -9999, ground: null, occ: null, shake: 0,
    update(dt) {
      const k = 1 - Math.pow(0.0006, dt);
      if (this.follow) this.tTarget.copy(this.follow());
      this.target.lerp(this.tTarget, 1 - Math.pow(0.00002, dt));
      if (this.chase !== null) { // 말 뒤로: 끌어서 돌린 만큼(off)은 1.2초 뒤 천천히 돌아온다
        if (performance.now() - this.manualT > 1200) this.off *= Math.pow(0.08, dt);
        this.tYaw = this.chase + PI + this.off;
        this.yaw += wrap(this.tYaw - this.yaw) * (1 - Math.pow(0.012, dt));
      } else this.yaw += wrap(this.tYaw - this.yaw) * k;
      this.pitch += (this.tPitch - this.pitch) * k;
      this.dist += (this.tDist - this.dist) * k;
      const cp = Math.cos(this.pitch);
      cam.position.set(this.target.x + Math.sin(this.yaw) * cp * this.dist, this.target.y + Math.sin(this.pitch) * this.dist, this.target.z + Math.cos(this.yaw) * cp * this.dist);
      if (this.occ) { // 가리면 팔만 줄인다(각도는 그대로)
        _od.subVectors(cam.position, this.target); const L = _od.length(); _od.divideScalar(L);
        _or.set(this.target, _od); _or.far = L; const h = _or.intersectObjects(this.occ(), true)[0];
        const want = h ? Math.max(1.6, h.distance - 0.4) : L;
        this.arm = this.arm === undefined ? want : want < this.arm ? want : this.arm + (want - this.arm) * Math.min(1, dt * 3);
        if (this.arm < L - 0.01) cam.position.copy(this.target).addScaledVector(_od, this.arm);
      }
      if (this.ground) { const gy = this.ground(cam.position.x, cam.position.z) + 0.45; if (cam.position.y < gy) cam.position.y = gy; }
      if (this.shake > 0.001) { cam.position.x += (Math.random() - 0.5) * this.shake; cam.position.y += (Math.random() - 0.5) * this.shake; this.shake *= Math.pow(0.002, dt); }
      cam.lookAt(this.target);
      placeSun(this.target);
    },
    zoom(f) { this.tDist = Math.max(this.minD, Math.min(this.maxD, this.tDist * f)); },
    rot(a) { this.manualT = performance.now(); if (this.chase !== null) this.off = Math.max(-2.6, Math.min(2.6, this.off + a)); else this.tYaw += a; },
    tilt(a) { this.tPitch = Math.max(-0.12, Math.min(1.2, this.tPitch + a)); },
    snap() { if (this.follow) this.tTarget.copy(this.follow()); this.target.copy(this.tTarget); if (this.chase !== null) this.tYaw = this.chase + PI + this.off; this.yaw = this.tYaw; this.pitch = this.tPitch; this.dist = this.tDist; this.arm = undefined; this.update(0.016); }
  };

  function resize() {
    const w = innerWidth || 1280, h = innerHeight || 800;
    R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  // ── 입력: 끌기 = 시점 돌리기, 휠·두 손가락 = 확대, 짧게 누르기 = 탭 ──
  const IN = { onTap: null, keys: {}, onKey: null, onKeyUp: null };
  const ptrs = new Map(); let pinch = null;
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 });
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
  });
  canvas.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; p.moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); CAM.zoom(pinch.d / Math.max(d, 1)); pinch.d = d; return; }
    if (p.moved < 6) return;
    CAM.rot(-dx * 0.006); CAM.tilt(dy * 0.004);
  });
  function up(e) {
    const p = ptrs.get(e.pointerId); if (!p) return;
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (p.moved < 10 && performance.now() - p.t < 500 && IN.onTap) IN.onTap(e.clientX, e.clientY);
  }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); CAM.zoom(Math.pow(1.0012, e.deltaY)); }, { passive: false });
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault(); const rep = IN.keys[e.code]; IN.keys[e.code] = true; if (!rep && IN.onKey) IN.onKey(e); });
  addEventListener('keyup', e => { IN.keys[e.code] = false; if (IN.onKeyUp) IN.onKeyUp(e); });
  addEventListener('blur', () => { const was = IN.keys; IN.keys = {}; if (was.Space && IN.onKeyUp) IN.onKeyUp({ code: 'Space' }); });
  // 시점 키: A·D 좌우 돌리기, W·S 위아래(이동은 방향키). Z·C 도 좌우
  function keyCam(dt) { const k = IN.keys; if (k.KeyA || k.KeyZ) CAM.rot(2.3 * dt); if (k.KeyD || k.KeyC) CAM.rot(-2.3 * dt); if (k.KeyW) CAM.tilt(-1.3 * dt); if (k.KeyS) CAM.tilt(1.3 * dt); }

  // ── 모델: http 면 fetch, file:// 면 옆의 .glb.js 사본(window.GLBJS) ──
  const cache = {};
  function loadGLB(url) {
    if (cache[url]) return cache[url];
    const parse = buf => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej));
    let p;
    if (location.protocol === 'file:' || Q.has('filetest')) {
      p = new Promise((res, rej) => {
        const name = url.split('/').pop();
        const done = () => {
          const b64 = window.GLBJS && window.GLBJS[name];
          if (!b64) return rej(new Error('no glbjs ' + name));
          const bin = atob(b64), u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          window.GLBJS[name] = null;
          parse(u8.buffer).then(res, rej);
        };
        if (window.GLBJS && window.GLBJS[name]) return done();
        const s = document.createElement('script'); s.src = url + '.js';
        s.onload = done; s.onerror = () => rej(new Error('load ' + s.src));
        document.head.appendChild(s);
      });
    } else p = fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r.arrayBuffer(); }).then(parse);
    cache[url] = p;
    return p;
  }
  // 정적 모델: 바닥을 0 에, 가운데를 원점에, 기준 변을 size 로
  function fitStatic(gltf, size, by) {
    const src = gltf.scene.clone(true);
    src.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(src), sz = bb.getSize(new V3()), c = bb.getCenter(new V3());
    const ref = by === 'h' ? sz.y : by === 'w' ? Math.max(sz.x, sz.z) : Math.max(sz.x, sz.y, sz.z);
    const s = size / ref;
    const inner = new THREE.Group(); inner.add(src);
    src.position.set(-c.x, -bb.min.y, -c.z);
    inner.scale.setScalar(s);
    src.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const m = o.material;
      if (m) { m.envMapIntensity = 0.5; if (m.map) m.map.anisotropy = 4; if (m.metalness !== undefined) m.metalness = Math.min(m.metalness, 0.15); }
    });
    return { proto: inner, size: new V3(sz.x * s, sz.y * s, sz.z * s) };
  }
  // 뼈 있는 모델 복제(SkeletonUtils.clone 과 같은 일)
  function cloneSkinned(src) {
    const map = new Map();
    const clone = src.clone(true);
    const walk = (a, b) => { map.set(a, b); for (let i = 0; i < a.children.length; i++) walk(a.children[i], b.children[i]); };
    walk(src, clone);
    src.traverse(o => {
      if (!o.isSkinnedMesh) return;
      const c = map.get(o);
      const bones = o.skeleton.bones.map(b => map.get(b));
      c.bind(new THREE.Skeleton(bones, o.skeleton.boneInverses), o.bindMatrix);
    });
    return clone;
  }

  // ── 소리(코드로 만든 효과음) ─────────────────────────
  const AU = { ctx: null, sfxOn: true, bgmOn: true, master: null, bgmGain: null };
  function actx() {
    if (Q.has('mute')) return null;
    if (!AU.ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      AU.ctx = new C(); AU.master = AU.ctx.createGain(); AU.master.gain.value = 0.55; AU.master.connect(AU.ctx.destination);
      AU.bgmGain = AU.ctx.createGain(); AU.bgmGain.gain.value = 0.26; AU.bgmGain.connect(AU.ctx.destination);
      loadSamples();
    }
    if (AU.ctx.state === 'suspended') AU.ctx.resume();
    return AU.ctx;
  }
  // 녹음 효과음(js/sfx.js 의 base64 를 풀어 둔다). 아직 안 풀렸으면 false → 합성 소리로 대신
  const BUF = {};
  function loadSamples() { const D = window.SFXDATA || {}; for (const k in D) { const bin = atob(D[k]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); AU.ctx.decodeAudioData(u.buffer).then(b => BUF[k] = b).catch(() => {}); } }
  function smp(name, vol, rate, delay) { const b = BUF[name]; if (!b) return false; const s = AU.ctx.createBufferSource(), g = AU.ctx.createGain(); s.buffer = b; s.playbackRate.value = (rate || 1) * (0.96 + Math.random() * 0.08); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(AU.master); s.start(AU.ctx.currentTime + (delay || 0)); return true; }
  function tone(f, t0, dur, type, vol, slide, dest) {
    const c = AU.ctx; const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || AU.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, fq, q, dest, type) {
    const c = AU.ctx, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6);
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = fq || 1200; f.Q.value = q || 0.8;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest || AU.master); s.start(t0);
  }
  const SFX = {
    coin(i) { const t = AU.ctx.currentTime; const b = 1320 * Math.pow(1.06, (i || 0) % 6); tone(b, t, 0.08, 'square', 0.06); tone(b * 1.5, t + 0.06, 0.2, 'square', 0.05); },
    click() { const t = AU.ctx.currentTime; noise(t, 0.03, 0.5, 3200, 4); tone(1900, t, 0.03, 'square', 0.03); tone(700, t + 0.01, 0.05, 'triangle', 0.08); }, // 금속 딸깍
    no() { const t = AU.ctx.currentTime; tone(200, t, 0.14, 'square', 0.07); tone(150, t + 0.12, 0.2, 'square', 0.07); },
    buy() { const t = AU.ctx.currentTime; noise(t, 0.05, 0.4, 5000, 3); [1568, 2093, 2637].forEach((f, i) => tone(f, t + 0.03 + i * 0.05, 0.3, 'sine', 0.09)); }, // 금전 등록기
    spin(p) { const t = AU.ctx.currentTime; noise(t, 0.16, 0.16 + 0.1 * (p || 0), 700 + 500 * (p || 0), 1.2); }, // 밧줄 도는 바람 소리
    throw() { const t = AU.ctx.currentTime; noise(t, 0.4, 0.5, 1300, 0.7); tone(520, t, 0.3, 'sine', 0.05, 0.4); },
    land() { const t = AU.ctx.currentTime; noise(t, 0.12, 0.5, 400, 0.8); },
    snag(p) { if (smp(p ? 'crack' : 'crack2', p ? 1 : 0.85)) { smp('cinch', 0.75, 1, 0.05); return; } const t = AU.ctx.currentTime; noise(t, 0.08, 0.7, 2200, 2); tone(180, t, 0.18, 'triangle', 0.3, 0.5); tone(880, t + 0.03, 0.12, 'square', 0.05, 1.5); }, // 걸렸다: 채찍처럼 딱 + 매듭 조이는 소리(녹음)
    tug() { const t = AU.ctx.currentTime; noise(t, 0.07, 0.35, 900, 3); tone(140, t, 0.08, 'triangle', 0.2, 0.7); },
    yank() { if (smp('creak', 0.9, 0.9)) { smp('fall', 1, 1, 0.17); return; } const t = AU.ctx.currentTime; noise(t, 0.3, 0.7, 500, 0.6); tone(300, t, 0.25, 'sawtooth', 0.08, 0.3); setTimeout(() => SFX.thud(), 160); },   // 잡아챔: 밧줄 삐걱 + 땅에 쿵(녹음)
    thud() { const t = AU.ctx.currentTime; noise(t, 0.2, 0.9, 160, 0.7, null, 'lowpass'); tone(80, t, 0.2, 'sine', 0.5, 0.5); },
    oof(v) { const t = AU.ctx.currentTime, f = 170 * (v || 1); const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(), bp = AU.ctx.createBiquadFilter(); // 사람 "어이쿠"
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.28); bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(500, t + 0.28); bp.Q.value = 3;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32); o.connect(bp); bp.connect(g); g.connect(AU.master); o.start(t); o.stop(t + 0.4); },
    slip() { const t = AU.ctx.currentTime; noise(t, 0.25, 0.4, 2000, 1); tone(500, t, 0.25, 'sine', 0.08, 0.4); },
    hoof(v) { const t = AU.ctx.currentTime; noise(t, 0.06, 0.5 * (v || 1), 240, 1.4, null, 'lowpass'); tone(95, t, 0.05, 'sine', 0.22 * (v || 1), 0.6); },
    step() { const t = AU.ctx.currentTime; noise(t, 0.05, 0.14, 900, 1.2); },
    neigh() { const t = AU.ctx.currentTime; const o = AU.ctx.createOscillator(), g = AU.ctx.createGain(), l = AU.ctx.createOscillator(), lg = AU.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(1500, t + 0.15); o.frequency.exponentialRampToValueAtTime(420, t + 0.8);
      l.frequency.value = 17; lg.gain.value = 120; l.connect(lg); lg.connect(o.frequency); const bp = AU.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.6;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85); o.connect(bp); bp.connect(g); g.connect(AU.master); o.start(t); l.start(t); o.stop(t + 0.9); l.stop(t + 0.9); },
    whistle() { const t = AU.ctx.currentTime; tone(1900, t, 0.12, 'sine', 0.12, 1.5); tone(2600, t + 0.13, 0.3, 'sine', 0.12, 0.8); },
    shot() { const t = AU.ctx.currentTime; noise(t, 0.05, 1.2, 2500, 0.5); noise(t, 0.35, 0.7, 500, 0.5, null, 'lowpass'); tone(160, t, 0.12, 'square', 0.2, 0.3); },
    ricochet() { const t = AU.ctx.currentTime; tone(2400, t, 0.35, 'sine', 0.06, 0.35); },
    boom() { const t = AU.ctx.currentTime; noise(t, 0.8, 1.1, 150, 0.5, null, 'lowpass'); tone(70, t, 0.6, 'sine', 0.6, 0.4); noise(t, 0.2, 0.5, 2500, 0.6); },
    fuse() { const t = AU.ctx.currentTime; noise(t, 0.25, 0.14, 5000, 2); },
    clang() { const t = AU.ctx.currentTime; noise(t, 0.05, 0.7, 3500, 3); [523, 790, 1245, 1990].forEach(f => tone(f, t, 0.9, 'triangle', 0.07)); tone(110, t, 0.25, 'sine', 0.3, 0.6); }, // 감옥 문 철컹
    stamp() { const t = AU.ctx.currentTime; noise(t, 0.12, 0.9, 250, 0.9, null, 'lowpass'); tone(90, t, 0.12, 'sine', 0.4, 0.6); },
    paper() { const t = AU.ctx.currentTime; noise(t, 0.12, 0.25, 3800, 0.9); noise(t + 0.07, 0.1, 0.18, 2600, 0.9); },
    alert() { const t = AU.ctx.currentTime; tone(880, t, 0.09, 'square', 0.07); tone(1320, t + 0.09, 0.16, 'square', 0.07); },
    escaped() { const t = AU.ctx.currentTime; [392, 349, 294, 220].forEach((f, i) => tone(f, t + i * 0.16, 0.25, 'triangle', 0.14)); },
    fanfare() { const t = AU.ctx.currentTime; [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => { tone(f, t + i * 0.12, 0.3, 'square', 0.05); tone(f / 2, t + i * 0.12, 0.3, 'triangle', 0.1); }); },
    cactus() { const t = AU.ctx.currentTime; tone(1400, t, 0.08, 'square', 0.05, 1.6); noise(t, 0.06, 0.3, 3000, 2); },
    bump() { const t = AU.ctx.currentTime; noise(t, 0.09, 0.45, 300, 1, null, 'lowpass'); },
    cough() { if (smp('cough', 0.9)) return; SFX.oof(); }   // 하얀 가루를 맞았다: 기침 녹음(없으면 oof)
  };
  function sfx(name, a) { if (!AU.sfxOn) return; if (!actx()) return; try { SFX[name] && SFX[name](a); } catch (e) {} }

  window.CORE = { R, S, cam, CAM, IN, sun, hemi, fill, sky, skyU, SUN_DIR, FOG, touch, Q, keyCam, loadGLB, fitStatic, cloneSkinned, AU, actx, sfx, tone, noise, resize, wrap,
    setDpr(v) { dpr = v; R.setPixelRatio(v); resize(); }, get dpr() { return dpr; } };
})();
