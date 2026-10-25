// 그리기 바탕: 렌더러·하늘·빛·카메라 + 높이마다 바뀌는 점토 풍경(마을·참새·구름·열기구·노을·무지개·별·행성·달).
(function () {
  const R = (window.RND = {});
  const D = window.DATA;
  const M = (c, o) => CLAY.mat(c, o);
  let low = false;
  R.init = function (canvas) {
    low = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    r.outputColorSpace = THREE.SRGBColorSpace;
    // 형광색이 바래지 않게 톤 매핑은 끈다
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    R.renderer = r;
    const s = (R.scene = new THREE.Scene());
    R.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);
    // 하늘: 카메라를 따라다니는 구, 색은 높이에 따라 바뀐다
    const skyM = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vp; void main(){ float h = normalize(vp).y; vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h*1.5,0.0,1.0),0.75)) : mix(mid, bot, clamp(-h*2.2,0.0,1.0)); gl_FragColor = vec4(c,1.0); }',
    });
    R.sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), skyM); R.sky.renderOrder = -1; R.sky.frustumCulled = false; s.add(R.sky);
    s.fog = new THREE.Fog('#e6f6ff', 70, 240);
    R.hemi = new THREE.HemisphereLight('#ffffff', '#9a8aa0', 1.25); s.add(R.hemi);
    const sun = (R.sun = new THREE.DirectionalLight('#fff4e4', 2.1));
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 11; sc.bottom = -11; sc.near = 18; sc.far = 62;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    s.add(sun); s.add(sun.target);
    R.sunDir = new THREE.Vector3(-0.45, 0.82, 0.36).normalize();
    R.fill = new THREE.DirectionalLight('#d8e4ff', 0.55); R.fill.position.set(14, 6, 10); s.add(R.fill);
    R.world = new THREE.Group(); s.add(R.world);
    buildWorld();
    CLAY.step = 0.3; // 블록은 이 간격
    R.resize();
    window.addEventListener('resize', R.resize);
    return R;
  };
  R.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.renderer.setSize(w, h, false);
    R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
    R.aspect = w / h;
  };
  // 이 높이에서 블록 줄이 화면에 다 들어오는 카메라 거리
  R.camDist = function () {
    const vf = THREE.MathUtils.degToRad(R.camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * R.aspect);
    const needW = 4.9, needH = 5.0; // 가운데에서 양옆·위아래로 보여야 하는 거리
    return Math.max(needW / Math.tan(hf / 2), needH / Math.tan(vf / 2));
  };
  const _dir = new THREE.Vector3(1, 0.86, 1).normalize();
  R.setCam = function (lookY, distK, spin) {
    const d = R.camDist() * (distK || 1), a = spin || 0;
    const c = Math.cos(a), sn = Math.sin(a);
    const dx = _dir.x * c - _dir.z * sn, dz = _dir.x * sn + _dir.z * c;
    // 폰 세로는 블록이 화면 아래쪽 2/5 쯤에 오게 바라보는 점을 살짝 올린다
    R.camera.position.set(dx * d, lookY + _dir.y * d, dz * d);
    R.lookAt = R.lookAt || new THREE.Vector3();
    R.lookAt.set(0, lookY + (R.aspect < 0.8 ? 1.6 : 0.9), 0);
    R.camera.lookAt(R.lookAt);
    R.sky.position.copy(R.camera.position);
    R.sun.position.set(R.sunDir.x * 40, lookY + R.sunDir.y * 40, R.sunDir.z * 40);
    R.sun.target.position.set(0, lookY - 2, 0);
  };
  // 하늘·빛을 높이에 맞춰 섞는다
  const cA = new THREE.Color(), cB = new THREE.Color();
  R.skyAt = function (y) {
    const S = D.STAGES; let i = 0;
    while (i < S.length - 1 && y > (S[i].y0 + S[i].y1) / 2) i++;
    const j = Math.max(0, i - 1), a = S[j], b = S[i];
    const ma = (a.y0 + a.y1) / 2, mb = (b.y0 + b.y1) / 2;
    const t = j === i ? 0 : THREE.MathUtils.clamp((y - ma) / (mb - ma), 0, 1);
    const u = R.sky.material.uniforms;
    ['top', 'mid', 'bot'].forEach((k, n) => { cA.set(a.sky[n]); cB.set(b.sky[n]); u[k].value.copy(cA).lerp(cB, t); });
    R.scene.fog.color.copy(u.mid.value);
    const night = THREE.MathUtils.clamp((y - 52) / 22, 0, 1);
    R.night = night;
    R.hemi.intensity = 1.25 - night * 0.55; R.hemi.color.set('#ffffff').lerp(cA.set('#8a9cff'), night);
    R.sun.intensity = 2.1 - night * 1.25; R.sun.color.set('#fff4e4').lerp(cA.set(y > 38 && y < 60 ? '#ffb27a' : '#c8d4ff'), Math.min(1, night + (y > 38 && y < 60 ? 0.6 : 0)));
    R.fill.intensity = 0.55 + night * 0.25;
    if (R.sunB) R.sunB.visible = y > 26 && y < 60;
    if (R.rainbow) R.rainbow.forEach((m) => (m.visible = y > 34 && y < 66));
    if (R.stars) { R.stars.material.opacity = THREE.MathUtils.clamp((y - 55) / 16, 0, 1); R.stars.position.y = y; }
  };
  R.render = function () { R.renderer.render(R.scene, R.camera); };
  // 처음 몇 초 프레임을 재서 느리면 해상도·그림자를 한 단계씩 낮춘다
  let fs = [], level = 0;
  R.watch = function (dt) {
    if (level >= 2) return;
    fs.push(dt); if (fs.length < 90) return;
    fs.sort((a, b) => a - b); const med = fs[45]; fs = [];
    if (med > 0.024) {
      level++;
      if (level === 1) { R.renderer.setPixelRatio(1); R.resize(); }
      else { R.sun.shadow.mapSize.set(512, 512); if (R.sun.shadow.map) { R.sun.shadow.map.dispose(); R.sun.shadow.map = null; } }
    } else level = 2;
  };
  R.shot = function (name) {
    R.render();
    const d = R.renderer.domElement.toDataURL('image/png');
    return fetch('/save?name=' + encodeURIComponent(name || 'shot.png'), { method: 'POST', body: d }).then((r) => r.text());
  };

  // ---------- 풍경 ----------
  const anim = []; // 움직이는 것: {o, f(t)}
  R.anim = anim;
  function add(o) { R.world.add(o); return o; }
  function buildWorld() {
    CLAY.srand(4242);
    CLAY.step = 0.6; // 풍경은 덜 잘게(삼각형 줄이기)
    const rnd = CLAY.rnd;
    const B = new CLAY.Batch();
    // 땅: 둥근 점토 판(연두 잔디) + 아래 흙 테
    B.add(CLAY.rcyl(34, 33, 1.2, 0.5, 48, 0.25, 1), M('#9ee86a', { rough: 0.62, ns: 0.6 }), [0, -0.6, 0]);
    B.add(CLAY.rcyl(33, 31, 3, 0.8, 48, 0.3, 2), M('#c98a5a', { rough: 0.7, ns: 0.6 }), [0, -2.4, 0]);
    // 탑 받침(맨 아래 판)
    B.add(CLAY.rbox(D.W0 + 0.9, D.PH + 0.6, D.W0 + 0.9, 0.22, 0.03, 3), M('#f4efe6', { rough: 0.5, ns: 0.55 }), [0, D.PH / 2 - 0.3, 0]);
    // 길: 탑에서 뻗는 크림색 길 두 줄
    for (let k = 0; k < 2; k++) {
      const g = CLAY.rbox(3.2, 0.25, 26, 0.12, 0.04, 10 + k);
      B.add(g, M('#f6e3b8', { rough: 0.7, ns: 0.5 }), k ? [0, 0.05, -15] : [-15, 0.05, 0], [0, k ? 0 : Math.PI / 2, 0]);
    }
    // 집: 형광 지붕의 작은 점토 집들
    const roofs = ['#ff5aa8', '#ff8a2a', '#ffe23a', '#5aff8a', '#3ad8ff', '#a86aff'];
    const walls = ['#fff6e8', '#ffe9d6', '#f0f4ff', '#fff0f6'];
    const spots = [];
    for (let i = 0; i < 26; i++) {
      let x, z, ok = false, tries = 0;
      while (!ok && tries++ < 40) {
        const a = rnd() * Math.PI * 2, rr = 9.5 + rnd() * 20; x = Math.cos(a) * rr; z = Math.sin(a) * rr;
        ok = Math.abs(x) > 2.4 && Math.abs(z) > 2.4 && spots.every((p) => Math.hypot(p[0] - x, p[1] - z) > 4.2);
        // 카메라 쪽 앞(+x,+z)은 비워 둔다(탑을 가리지 않게)
        if (x > 0 && z > 0 && x + z < 22) ok = false;
      }
      if (!ok) continue;
      spots.push([x, z]);
      const w = 2.2 + rnd() * 1.4, d = 2 + rnd() * 1.2, h = 1.6 + rnd() * 2.6, ry = rnd() * Math.PI;
      const wm = M(walls[i % walls.length], { rough: 0.55, ns: 0.6 }), rm = M(roofs[i % roofs.length], { rough: 0.45, ns: 0.6, emis: roofs[i % roofs.length], ei: 0.12 });
      const m4 = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1));
      const put = (geo, mat, px, py, pz, rx, rz) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(px, py, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, 0, rz || 0)), new THREE.Vector3(1, 1, 1)); B.addM(geo, mat, m4.clone().multiply(m)); };
      put(CLAY.rbox(w, h, d, 0.22, 0.04, i), wm, 0, h / 2, 0);
      // 지붕: 두 장 기울인 판
      const rw = w / 2 / Math.cos(0.62) + 0.35;
      put(CLAY.rbox(rw, 0.28, d + 0.5, 0.12, 0.03, i + 50), rm, -w / 4 - 0.02, h + Math.tan(0.62) * w / 4, 0, 0, 0.62);
      put(CLAY.rbox(rw, 0.28, d + 0.5, 0.12, 0.03, i + 70), rm, w / 4 + 0.02, h + Math.tan(0.62) * w / 4, 0, 0, -0.62);
      // 문·창
      put(CLAY.rbox(0.6, 1.0, 0.16, 0.08, 0.02, i + 90), M('#8a5a3a', { rough: 0.6, ns: 0.5 }), 0, 0.5, d / 2 + 0.03);
      put(CLAY.rbox(0.55, 0.5, 0.14, 0.1, 0.02, i + 110), M('#bfe8ff', { rough: 0.3, ns: 0.3, emis: '#ffe9a0', ei: 0.0 }), w / 4 + 0.15, h * 0.62, d / 2 + 0.03);
      put(CLAY.rbox(0.55, 0.5, 0.14, 0.1, 0.02, i + 130), M('#bfe8ff', { rough: 0.3, ns: 0.3, emis: '#ffe9a0', ei: 0.0 }), -w / 4 - 0.15, h * 0.62, d / 2 + 0.03);
    }
    // 나무: 갈색 기둥 + 형광 연두 공
    for (let i = 0; i < 34; i++) {
      const a = rnd() * Math.PI * 2, rr = 7 + rnd() * 24, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (x > 0 && z > 0 && x + z < 18) continue;
      if (spots.some((p) => Math.hypot(p[0] - x, p[1] - z) < 2.6) || (Math.abs(x) < 2.2 || Math.abs(z) < 2.2)) continue;
      const s = 0.7 + rnd() * 0.7;
      B.add(CLAY.capsule(0.18 * s, 1.2 * s, 0.02, i), M('#9a6a42', { rough: 0.7, ns: 0.6 }), [x, 0.75 * s, z]);
      const lc = ['#6aff4a', '#3ae87a', '#b8ff3a'][i % 3];
      B.add(CLAY.ball(0.9 * s, 14, 0.09 * s, i), M(lc, { rough: 0.55, ns: 0.6, emis: lc, ei: 0.08 }), [x, 1.9 * s, z]);
      B.add(CLAY.ball(0.6 * s, 12, 0.06 * s, i + 3), M(lc, { rough: 0.55, ns: 0.6, emis: lc, ei: 0.08 }), [x + 0.5 * s, 1.6 * s, z + 0.2 * s]);
    }
    // 전봇대와 전깃줄(참새 하늘)
    const poles = [[-15, -3], [-8, -14], [4, -17], [-17, 9], [14, -9]];
    poles.forEach((p, i) => {
      B.add(CLAY.rcyl(0.22, 0.28, 10, 0.1, 10, 0.03, i), M('#d8c8b0', { rough: 0.6, ns: 0.6 }), [p[0], 5, p[1]]);
      B.add(CLAY.rbox(2.2, 0.22, 0.22, 0.08, 0.02, i), M('#d8c8b0', { rough: 0.6, ns: 0.6 }), [p[0], 9.4, p[1]], [0, Math.atan2(-p[1], p[0]), 0]);
    });
    for (let i = 0; i < poles.length; i++) {
      const a = poles[i], b = poles[(i + 1) % poles.length];
      const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * t, 9.4 - Math.sin(t * Math.PI) * 0.9, a[1] + (b[1] - a[1]) * t)); }
      B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.045, 5), M('#3a3040', { rough: 0.6, ns: 0 }), [0, 0, 0]);
    }
    // 구름: 공 하나를 여러 번 찍는 InstancedMesh(그리기 한 번). 카메라와 탑 사이에 든 구름은 그때그때 비켜 준다.
    {
      const cg = CLAY.ball(1, 15, 0.09, 9);
      const cm = M('#ffffff', { rough: 0.7, ns: 0.5, emis: '#ffffff', ei: 0.06 });
      const list = [];
      const cy = D.STAGES[3].y0 - 2.4;
      for (let i = 0; i < (low ? 46 : 64); i++) {
        const a = rnd() * Math.PI * 2, rr = 7 + rnd() * 36;
        const s = 1.4 + rnd() * 2.2;
        list.push([Math.cos(a) * rr, cy + rnd() * 1.2, Math.sin(a) * rr, s, s * 0.55, s]);
      }
      // 그 아래 듬성듬성 구름 덩이
      for (let i = 0; i < 14; i++) {
        const a = Math.PI * 0.6 + rnd() * Math.PI * 1.3, rr = 9 + rnd() * 20, x = Math.cos(a) * rr, z = Math.sin(a) * rr; // 카메라 반대쪽 반에만
        const y = D.STAGES[2].y0 + 1 + rnd() * 5;
        for (let k = 0; k < 4; k++) { const s = 0.9 + rnd() * 0.8; list.push([x + (k - 1.5) * 1.0, y + rnd() * 0.5, z + rnd() * 0.6, s, s * 0.7, s]); }
      }
      const im = new THREE.InstancedMesh(cg, cm, list.length);
      im.castShadow = false; im.receiveShadow = false;
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
      const fade = new Float32Array(list.length).fill(1);
      const set = (i, f) => { const c = list[i]; e.set(0, i * 1.7, 0); q.setFromEuler(e); v.set(c[0], c[1], c[2]); sc.set(c[3] * f, c[4] * f, c[5] * f); m4.compose(v, q, sc); im.setMatrixAt(i, m4); };
      list.forEach((c, i) => set(i, 1));
      add(im);
      R.clouds = im;
      const A = new THREE.Vector3(), Bv = new THREE.Vector3(), P = new THREE.Vector3(), AB = new THREE.Vector3();
      anim.push(() => {
        A.copy(R.camera.position); Bv.copy(R.lookAt || P.set(0, 0, 0)); AB.subVectors(Bv, A); const L2 = AB.lengthSq();
        let ch = false;
        for (let i = 0; i < list.length; i++) {
          const c = list[i]; P.set(c[0], c[1], c[2]);
          let t = P.clone().sub(A).dot(AB) / L2; t = Math.max(0, Math.min(1, t));
          const d = P.distanceTo(A.clone().addScaledVector(AB, t));
          // 카메라 쪽 반에서 바라보는 점보다 높은 구름은 화면 위를 가리니 치운다
          const front = (c[0] * A.x + c[2] * A.z) > 0 && c[1] > Bv.y + 1.5;
          const want = d < c[3] * 1.15 + 1.6 || front ? 0 : 1;
          const f = fade[i] + (want - fade[i]) * 0.12;
          if (Math.abs(f - fade[i]) > 0.002) { fade[i] = f; set(i, Math.max(0.001, f)); ch = true; }
        }
        if (ch) im.instanceMatrix.needsUpdate = true;
      });
    }
    // 무지개: 일곱 줄 반원 다리(멀리)
    const rbc = ['#ff3f5a', '#ff8a1a', '#ffe62e', '#3dff5a', '#18c8ff', '#5b6cff', '#b45bff'];
    const ry0 = D.STAGES[6].y0 - 4;
    rbc.forEach((c, i) => {
      const g = new THREE.TorusGeometry(26 - i * 1.15, 0.62, 8, 60, Math.PI);
      B.add(g, M(c, { rough: 0.5, ns: 0.4, emis: c, ei: 0.35 }), [-30, ry0, -38], [0, Math.PI / 4, 0]);
    });
    B.build(R.world, true, true);
    // 무지개·멀리 것은 안개 끄기
    R.rainbow = [];
    R.world.children.forEach((m) => { if (m.material && rbc.indexOf('#' + m.material.color.getHexString()) >= 0) { m.material.fog = false; R.rainbow.push(m); } });

    // ---------- 움직이는 것 ----------
    // 참새: 몸·머리·부리·날개
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      const bc = i % 2 ? '#c88a52' : '#b07a48';
      g.add(new THREE.Mesh(CLAY.ball(0.32, 12, 0.02, i), M(bc, { rough: 0.6, ns: 0.6 })));
      const hd = new THREE.Mesh(CLAY.ball(0.22, 12, 0.015, i + 9), M('#8a5a36', { rough: 0.6, ns: 0.6 })); hd.position.set(0.28, 0.16, 0); g.add(hd);
      const bk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), M('#ffb21a', { rough: 0.5, ns: 0 })); bk.rotation.z = -Math.PI / 2; bk.position.set(0.5, 0.14, 0); g.add(bk);
      const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), M('#141018', { rough: 0.3, ns: 0 })); e1.position.set(0.42, 0.22, 0.12); g.add(e1);
      const e2 = e1.clone(); e2.position.z = -0.12; g.add(e2);
      const w1 = new THREE.Mesh(CLAY.ball(0.26, 10, 0.02, i + 20), M('#e8c89a', { rough: 0.6, ns: 0.6 })); w1.scale.set(1.2, 0.25, 0.7); w1.position.set(-0.02, 0.08, 0.3); g.add(w1);
      const w2 = w1.clone(); w2.position.z = -0.3; g.add(w2);
      g.traverse((m) => { m.castShadow = true; });
      const r0 = 7 + i * 1.3, h0 = D.STAGES[1].y0 + 1 + (i % 4) * 1.4, sp = 0.35 + (i % 3) * 0.08, ph = i * 0.9;
      add(g);
      anim.push((t) => { const a = t * sp + ph; g.position.set(Math.cos(a) * r0, h0 + Math.sin(t * 1.6 + i) * 0.5, Math.sin(a) * r0); g.rotation.y = -a - Math.PI / 2 + Math.PI; const f = Math.sin(t * 16 + i) * 0.9; w1.rotation.x = f; w2.rotation.x = -f; });
    }
    // 열기구 넷
    const bcol = [['#ff3fa4', '#ffe62e'], ['#18e8ff', '#ffffff'], ['#7dff3a', '#ff7a1a'], ['#c45bff', '#ffe62e']];
    bcol.forEach((cc, i) => {
      const g = new THREE.Group();
      const env = new THREE.Mesh(CLAY.ball(2.1, 20, 0.08, i), M(cc[0], { rough: 0.45, ns: 0.6, emis: cc[0], ei: 0.15 })); env.scale.set(1, 1.15, 1); g.add(env);
      const band = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.28, 8, 28), M(cc[1], { rough: 0.45, ns: 0.4, emis: cc[1], ei: 0.15 })); band.rotation.x = Math.PI / 2; band.position.y = -0.2; g.add(band);
      const bk = new THREE.Mesh(CLAY.rbox(0.9, 0.7, 0.9, 0.12, 0.02, i), M('#b07a48', { rough: 0.7, ns: 0.6 })); bk.position.y = -3.6; g.add(bk);
      for (let k = 0; k < 4; k++) { const ro = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4), M('#5a4030', { rough: 0.7, ns: 0 })); ro.position.set(k % 2 ? 0.35 : -0.35, -2.75, k < 2 ? 0.35 : -0.35); g.add(ro); }
      g.traverse((m) => { m.castShadow = true; });
      const a0 = [2.2, 3.4, 4.4, 5.6][i], r0 = [13, 20, 15, 24][i], h0 = D.STAGES[4].y0 + [3, 7, 11, 5][i];
      add(g);
      anim.push((t) => { const a = a0 + Math.sin(t * 0.05 + i) * 0.25; g.position.set(Math.cos(a) * r0, h0 + Math.sin(t * 0.5 + i) * 0.6, Math.sin(a) * r0); g.rotation.y = t * 0.1; });
    });
    // 비행기 하나(구름 위)
    {
      const g = new THREE.Group();
      const body = new THREE.Mesh(CLAY.capsule(0.55, 3.2, 0.02, 1), M('#ffffff', { rough: 0.45, ns: 0.5 })); body.rotation.z = Math.PI / 2; g.add(body);
      const wing = new THREE.Mesh(CLAY.rbox(1.2, 0.16, 5.2, 0.08, 0.02, 2), M('#18c8ff', { rough: 0.45, ns: 0.5, emis: '#18c8ff', ei: 0.15 })); g.add(wing);
      const tail = new THREE.Mesh(CLAY.rbox(0.8, 1.2, 0.16, 0.08, 0.02, 3), M('#ff3fa4', { rough: 0.45, ns: 0.5, emis: '#ff3fa4', ei: 0.15 })); tail.position.set(-1.9, 0.6, 0); g.add(tail);
      for (let k = 0; k < 4; k++) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), M('#2a3a5a', { rough: 0.3, ns: 0 })); w.position.set(1.1 - k * 0.6, 0.22, 0.5); g.add(w); }
      g.traverse((m) => { m.castShadow = true; });
      add(g);
      const h0 = D.STAGES[3].y0 + 5;
      anim.push((t) => { const p = ((t * 2.2) % 90) - 45; g.position.set(p * 0.72 - 14, h0 + Math.sin(t * 0.4) * 0.5, -p * 0.72 - 14); g.rotation.y = Math.PI * 0.75; });
    }
    // 노을 해: 크고 따뜻한 점토 공(멀리, 안개 없음)
    {
      const m = M('#ffb23a', { rough: 0.6, ns: 0.5, emis: '#ff8a2a', ei: 0.9 }); m.fog = false;
      const sunB = new THREE.Mesh(CLAY.ball(9, 28, 0.3, 5), m); sunB.position.set(-70, D.STAGES[5].y0 + 2, -70); add(sunB); R.sunB = sunB;
    }
    // 별: 점 한 무리(카메라 높이를 따라감, 밤에만 보임)
    {
      const N = 900, P = new Float32Array(N * 3), C = new Float32Array(N * 3), col = new THREE.Color();
      for (let i = 0; i < N; i++) {
        const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, rr = 220, sy = Math.sqrt(1 - u * u);
        P[i * 3] = Math.cos(a) * sy * rr; P[i * 3 + 1] = u * rr * 0.9 + 20; P[i * 3 + 2] = Math.sin(a) * sy * rr;
        col.set(['#ffffff', '#fff2a0', '#a8e8ff', '#ffb8f0'][i % 4]); C[i * 3] = col.r; C[i * 3 + 1] = col.g; C[i * 3 + 2] = col.b;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3));
      R.stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 1.8, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0, fog: false, depthWrite: false }));
      R.stars.frustumCulled = false; R.scene.add(R.stars);
    }
    // 고리 행성 둘·로켓(우주)
    {
      const p1m = M('#ff7a3a', { rough: 0.55, ns: 0.6, emis: '#ff5a2a', ei: 0.35 }); p1m.fog = false;
      const p1 = new THREE.Mesh(CLAY.ball(6, 28, 0.25, 7), p1m); p1.position.set(-46, D.STAGES[8].y0 + 6, -30); add(p1);
      const rm = M('#ffe62e', { rough: 0.5, ns: 0.4, emis: '#ffe62e', ei: 0.4 }); rm.fog = false;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.7, 6, 48), rm); ring.scale.set(1, 1, 0.15); ring.rotation.set(1.2, 0.3, 0.2); p1.add(ring);
      const p2m = M('#18e8ff', { rough: 0.55, ns: 0.6, emis: '#18c8ff', ei: 0.35 }); p2m.fog = false;
      const p2 = new THREE.Mesh(CLAY.ball(3.2, 24, 0.15, 8), p2m); p2.position.set(-18, D.STAGES[8].y0 + 11, -52); add(p2);
      anim.push((t) => { p1.rotation.y = t * 0.05; p2.rotation.y = -t * 0.08; });
      // 로켓
      const g = new THREE.Group();
      const body = new THREE.Mesh(CLAY.capsule(0.6, 2.2, 0.02, 11), M('#ffffff', { rough: 0.45, ns: 0.5 })); g.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.0, 14), M('#ff3fa4', { rough: 0.45, ns: 0, emis: '#ff3fa4', ei: 0.3 })); nose.position.y = 1.9; g.add(nose);
      const win = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), M('#18e8ff', { rough: 0.2, ns: 0, emis: '#18e8ff', ei: 0.6 })); win.position.set(0, 0.5, 0.55); g.add(win);
      for (let k = 0; k < 3; k++) { const f = new THREE.Mesh(CLAY.rbox(0.12, 0.9, 0.7, 0.05, 0.01, k), M('#ffe62e', { rough: 0.45, ns: 0.3, emis: '#ffe62e', ei: 0.3 })); const a = k * Math.PI * 2 / 3; f.position.set(Math.cos(a) * 0.6, -1.3, Math.sin(a) * 0.6); f.rotation.y = -a; g.add(f); }
      const fl = new THREE.Mesh(CLAY.ball(0.5, 10, 0.05, 3), M('#ff8a1a', { rough: 0.5, ns: 0, emis: '#ffb21a', ei: 1.2 })); fl.position.y = -1.9; fl.scale.set(1, 1.6, 1); g.add(fl);
      add(g);
      const h0 = D.STAGES[8].y0 + 2;
      anim.push((t) => { const p = (t * 1.5) % 40; g.position.set(-10 - p * 0.3, h0 + p, -16 + p * 0.1); g.rotation.z = -0.25; fl.scale.y = 1.4 + Math.sin(t * 30) * 0.3; });
    }
    // 달: 크고 둥근 점토 달 + 얼굴(끝에 눈을 뜬다)
    {
      const g = new THREE.Group();
      const mm = M('#f6c274', { rough: 0.7, ns: 0.9, emis: '#ffae4a', ei: 0.55 }); mm.fog = false;
      const geo = CLAY.ball(5.2, 40, 0.12, 21);
      // 구덩이: 바깥면을 몇 군데 눌러 판다
      const p = geo.attributes.position, v = new THREE.Vector3();
      const pits = []; for (let i = 0; i < 9; i++) { const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u); pits.push([new THREE.Vector3(Math.cos(a) * s, u, Math.sin(a) * s), 0.25 + rnd() * 0.25]); }
      for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); let d = 0; pits.forEach((q) => { const k = n.angleTo(q[0]); if (k < q[1]) d += Math.cos(k / q[1] * Math.PI / 2) * 0.12; }); v.addScaledVector(n, -d); p.setXYZ(i, v.x, v.y, v.z); }
      // 한 입 베어 문 자국: 오른쪽 위 가장자리를 동그랗게 세 번 파낸다
      const R0 = new THREE.Vector3(0.707, 0, -0.707), UP = new THREE.Vector3(0, 1, 0);
      const bites = [[0.15, 0.62], [-0.1, 0.78], [0.42, 0.42]].map(([fx, uy]) => R0.clone().multiplyScalar(0.8).addScaledVector(UP, uy).add(new THREE.Vector3(0.707, 0, 0.707).multiplyScalar(fx)).normalize());
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i); const n = v.clone().normalize(); let d = 0;
        bites.forEach((b) => { const k = n.angleTo(b); if (k < 0.42) d = Math.max(d, Math.sqrt(1 - (k / 0.42) * (k / 0.42)) * 2.1); });
        if (d > 0) { v.addScaledVector(n, -d); p.setXYZ(i, v.x, v.y, v.z); }
      }
      geo.computeVertexNormals();
      const moon = new THREE.Mesh(geo, mm); g.add(moon);
      // 초코칩
      const chipM = M('#4a2614', { rough: 0.5, ns: 0.4 }); chipM.fog = false;
      const chipG = CLAY.ball(0.42, 10, 0.08, 31);
      const face0 = new THREE.Vector3(0.707, 0, 0.707);
      for (let i = 0, put = 0; i < 80 && put < 16; i++) {
        const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, sq = Math.sqrt(1 - u * u), n = new THREE.Vector3(Math.cos(a) * sq, u, Math.sin(a) * sq);
        if (n.angleTo(face0) < 0.55 || bites.some((b) => n.angleTo(b) < 0.55)) continue;
        const c = new THREE.Mesh(chipG, chipM); c.position.copy(n).multiplyScalar(5.05); c.scale.set(1, 0.6, 1); c.lookAt(n.clone().multiplyScalar(10)); c.rotateX(Math.PI / 2); g.add(c); put++;
      }
      // 얼굴(카메라 쪽 +x,+z 방향)
      const face = new THREE.Group(); face.rotation.y = Math.PI / 4; g.add(face);
      const ek = M('#2a1a30', { rough: 0.4, ns: 0 });
      const eyeL = new THREE.Mesh(CLAY.ball(0.42, 12, 0.02, 1), ek), eyeR = eyeL.clone();
      eyeL.position.set(-1.4, 0.6, 4.95); eyeR.position.set(1.4, 0.6, 4.95); face.add(eyeL); face.add(eyeR);
      const lidM = M('#e8c860', { rough: 0.6, ns: 0.5, emis: '#c8a040', ei: 0.6 });
      const lidL = new THREE.Mesh(CLAY.capsule(0.12, 0.7, 0.01, 2), lidM); lidL.rotation.z = Math.PI / 2; lidL.position.set(-1.4, 0.6, 5.0); face.add(lidL);
      const lidR = lidL.clone(); lidR.position.x = 1.4; face.add(lidR);
      const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 8, 20, Math.PI), ek); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.6, 4.92); face.add(mouth);
      const chkM = M('#ff8ac8', { rough: 0.6, ns: 0.4, emis: '#ff8ac8', ei: 0.3 });
      const ch1 = new THREE.Mesh(CLAY.ball(0.5, 10, 0.02, 4), chkM); ch1.scale.set(1, 0.6, 0.3); ch1.position.set(-2.3, -0.3, 4.6); face.add(ch1);
      const ch2 = ch1.clone(); ch2.position.x = 2.3; face.add(ch2);
      g.position.set(-1.2, D.TOP + 6.4, -1.2);
      add(g);
      R.moon = { g, eyeL, eyeR, lidL, lidR, mouth, awake: 0 };
      eyeL.visible = eyeR.visible = false;
      anim.push((t) => {
        g.rotation.y = Math.sin(t * 0.2) * 0.08;
        g.position.y = D.TOP + 6.4 + Math.sin(t * 0.7) * 0.15;
        const aw = R.moon.awake;
        eyeL.visible = eyeR.visible = aw > 0.5; lidL.visible = lidR.visible = aw <= 0.5;
        mouth.scale.set(1, 0.5 + aw * 0.6, 1);
      });
    }
  }
  R.tickWorld = function (t) { for (let i = 0; i < anim.length; i++) anim[i](t); };
})();
