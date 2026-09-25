// 레이스 엔진 — 화면·카트 4대·아이템·카메라·순위
(function () {
  const W = {};
  window.RACE = W;

  let renderer, scene, camera, cam2, clock;
  let T = null, sceneryObj = null, boxes = [], quality = 1;
  let karts = [], players = [], running = false, splitMode = false;
  let pip = null, pipCam = null;   // 맞은 선수 정면 화면 (오른쪽 작은 창)
  let fx = null, proj = [], drops = [], ponies = [], stones = [], effGroup = null;
  let sunLight = null, hemi = null, flashEl = null;
  const tmp = new THREE.Vector3();

  // ---------- 처음 한 번 ----------
  function initGL(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    W.exposure = 1.15;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.4, 2600);
    cam2 = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.4, 2600);
    clock = new THREE.Clock();
    addEventListener('resize', resize);
    W.renderer = renderer; W.scene = scene; W.camera = camera;
    // 내가 맞으면 화면 가장자리가 번쩍 (W.flash 초만큼). 전엔 W.flash 값만 넣고 그리는 곳이 없었다 (2026-09-25)
    flashEl = document.createElement('div');
    flashEl.style.cssText = 'position:fixed;left:0;right:0;pointer-events:none;opacity:0;background:radial-gradient(circle,rgba(255,255,255,0) 45%,rgba(255,255,255,.9) 100%)';
    canvas.after(flashEl);
  }

  function resize() {
    if (!renderer) return;
    renderer.setSize(innerWidth, innerHeight);
    const a = splitMode ? innerWidth / (innerHeight / 2) : innerWidth / innerHeight;
    camera.aspect = a; camera.updateProjectionMatrix();
    cam2.aspect = a; cam2.updateProjectionMatrix();
  }

  // 하늘 (BUY JEJU 결): 천정 → 지평선 → 아지랑이(안개색), 해 원반과 번짐
  function skyDome(theme) {
    const geo = new THREE.SphereGeometry(1800, 32, 20);
    const sun = new THREE.Vector3(theme.sun[2], theme.sun[3], theme.sun[4]).normalize();
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        top: { value: new THREE.Color(theme.sky[0]) }, hor: { value: new THREE.Color(theme.sky[1]) }, haze: { value: new THREE.Color(theme.fog) },
        sunDir: { value: sun }, sunCol: { value: new THREE.Color(theme.sun[0]) }, night: { value: theme.night ? 1 : 0 },
      },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 top; uniform vec3 hor; uniform vec3 haze; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night; varying vec3 vD;',
        'void main(){',
        '  vec3 d = normalize(vD); float h = d.y;',
        '  vec3 c = mix(hor, top, pow(clamp(h, 0.0, 1.0), 0.5));',
        '  c = mix(haze, c, smoothstep(-0.03, 0.16, h));',
        '  float s = max(dot(d, sunDir), 0.0);',
        '  float disc = smoothstep(0.9994, 0.9997, s);',
        '  c += sunCol * (disc * (night > 0.5 ? 0.9 : 5.0) + pow(s, 14.0) * (night > 0.5 ? 0.05 : 0.32) + pow(s, 3.0) * (night > 0.5 ? 0.0 : 0.1));',
        '  gl_FragColor = vec4(c, 1.0);',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
    });
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = -1;   // 제일 먼저 (먼 한라산·오름이 하늘에 가려지지 않게)
    return m;
  }

  // 파티클 (먼지·불꽃·물방울) 한 덩어리로
  function makeFx(n) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), siz = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d');
    const rg = c.createRadialGradient(32, 32, 1, 32, 32, 31);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.45, 'rgba(255,255,255,.55)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rg;
    c.fillRect(0, 0, 64, 64);
    const mat = new THREE.PointsMaterial({
      size: 1, map: new THREE.CanvasTexture(cv), vertexColors: true,
      transparent: true, depthWrite: false, blending: THREE.NormalBlending, sizeAttenuation: true,
    });
    mat.onBeforeCompile = (s) => {
      s.vertexShader = 'attribute float size;\n' + s.vertexShader.replace('gl_PointSize = size;', 'gl_PointSize = size;')
        .replace('uniform float size;', '');
    };
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    const life = new Float32Array(n), vel = new Float32Array(n * 3), max = new Float32Array(n), sz0 = new Float32Array(n), grav = new Float32Array(n);
    return { pts, g, pos, col, siz, life, vel, max, sz0, grav, n, head: 0 };
  }

  // grav: 떨어지는 세기 (기본 2.4 = 먼지처럼 둥실, 물방울·과즙은 크게)
  function spawn(x, y, z, vx, vy, vz, r, gg, b, size, life, grav) {
    const f = fx;
    const i = f.head = (f.head + 1) % f.n;
    f.pos[i * 3] = x; f.pos[i * 3 + 1] = y; f.pos[i * 3 + 2] = z;
    f.vel[i * 3] = vx; f.vel[i * 3 + 1] = vy; f.vel[i * 3 + 2] = vz;
    f.col[i * 3] = r; f.col[i * 3 + 1] = gg; f.col[i * 3 + 2] = b;
    f.siz[i] = size; f.sz0[i] = size;
    f.life[i] = life; f.max[i] = life;
    f.grav[i] = grav == null ? 2.4 : grav;
  }

  function stepFx(dt) {
    const f = fx;
    for (let i = 0; i < f.n; i++) {
      if (f.life[i] <= 0) { if (f.siz[i] !== 0) f.siz[i] = 0; continue; }
      f.life[i] -= dt;
      const k = Math.max(0, f.life[i] / f.max[i]);
      f.pos[i * 3] += f.vel[i * 3] * dt;
      f.pos[i * 3 + 1] += f.vel[i * 3 + 1] * dt;
      f.pos[i * 3 + 2] += f.vel[i * 3 + 2] * dt;
      f.vel[i * 3 + 1] -= f.grav[i] * dt;
      f.siz[i] = f.sz0[i] * (0.35 + k * 0.85);
      if (f.life[i] <= 0) f.siz[i] = 0;
    }
    f.g.attributes.position.needsUpdate = true;
    f.g.attributes.color.needsUpdate = true;
    f.g.attributes.size.needsUpdate = true;
  }

  // ---------- 코스 열기 ----------
  function loadCourse(idx, opt) {
    opt = opt || {};
    clearCourse();
    T = TRACK.sampleCourse(idx);
    const th = SCENERY.THEMES[T.c.theme];

    scene.fog = new THREE.Fog(th.fog, th.fogNear || 90, th.fogFar || 1400);
    scene.background = new THREE.Color(th.fog);
    const sky = skyDome(th);
    scene.add(sky);
    W.sky = sky;

    // 밤 테마는 하늘색이 거의 검정이라 환경광을 따로 밝게 준다
    hemi = th.night || th.indoor
      ? new THREE.HemisphereLight(0x6a7ba8, 0x2e3346, th.amb * 1.5)
      : new THREE.HemisphereLight(th.sky[0], th.ground, th.amb);
    scene.add(hemi);
    sunLight = new THREE.DirectionalLight(th.sun[0], th.sun[1]);
    sunLight.position.set(th.sun[2], th.sun[3], th.sun[4]);
    sunLight.castShadow = quality > 0;
    sunLight.shadow.mapSize.set(quality > 0 ? 1024 : 512, quality > 0 ? 1024 : 512);
    const d = 62;
    sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.camera.far = 320;
    sunLight.shadow.bias = -0.0006;
    sunLight.shadow.normalBias = 0.045;
    scene.add(sunLight, sunLight.target);

    const rm = TRACK.roadMesh(T, th);
    scene.add(rm.road, rm.shoulder, rm.line, rm.dash);
    W.roadObjs = [rm.road, rm.shoulder, rm.line, rm.dash, sky];

    renderer.toneMappingExposure = th.night ? 1.45 : 1.15;
    sceneryObj = SCENERY.build(scene, T, quality);

    // 결승선 (흑백 격자 띠)
    const fin = finishLine();
    scene.add(fin);
    W.finish = fin;

    boxes = ITEMS.init(scene, T);

    effGroup = new THREE.Group();
    scene.add(effGroup);
    fx = makeFx(360);
    effGroup.add(fx.pts);

    // 아이템 풀: 한라봉(던짐)·옥돔(바닥)·조랑말(가로막기)·돌하르방(떨어짐)
    const pool = (n, id) => Array.from({ length: n }, () => {
      const g = ITEMS.dress(new THREE.Group(), id);
      g.visible = false;
      effGroup.add(g);
      return { g, on: false };
    });
    reticles = [makeReticle(), makeReticle()];
    proj = pool(8, 'hallabong');
    drops = pool(12, 'okdom');
    drops.forEach((d) => {   // 옥돔이 뿜은 물웅덩이
      d.pud = new THREE.Mesh(new THREE.CircleGeometry(1, 28),
        new THREE.MeshBasicMaterial({ color: 0x6cc8f5, transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
      d.pud.rotation.x = -Math.PI / 2;
      d.pud.visible = false;
      effGroup.add(d.pud);
    });
    ponies = pool(4, 'pony');
    stones = pool(4, 'harubang');
    stones.forEach((st) => {   // 떨어질 자리 그림자
      st.mark = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
      st.mark.rotation.x = -Math.PI / 2;
      st.mark.visible = false;
      effGroup.add(st.mark);
    });
    // 로딩 중에 미리 데워 둔다 (첫 프레임 멈칫 막기)
    W.warm = () => {
      try {
        // 아이템 모델도 미리 올린다: 숨겨 둔 채면 처음 던질 때 그림(텍스처)을 올리느라 아이템마다 0.5초 멈칫했다 (2026-09-25)
        const hid = [];
        effGroup.traverse((o) => { if (!o.visible) { hid.push(o); o.visible = true; } });
        effGroup.traverse((o) => {
          if (!o.isMesh) return;
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) renderer.initTexture(m.map); if (m.emissiveMap) renderer.initTexture(m.emissiveMap); });
        });
        renderer.compile(scene, camera);
        hid.forEach((o) => { o.visible = false; });
        renderer.render(scene, camera);
      } catch (e) {}
    };
    W.T = T;
    return T;
  }

  function finishLine() {
    const a = TRACK.at(T, 0);
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 16;
    const c = cv.getContext('2d');
    for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) {
      c.fillStyle = (x + y) % 2 ? '#181818' : '#f2f2ee';
      c.fillRect(x * 8, y * 8, 8, 8);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(a.hw * 2, 3), new THREE.MeshBasicMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = -Math.atan2(a.tan.x, a.tan.z);
    m.position.copy(a.p);
    m.position.y += 0.06;
    g.add(m);
    // 간판 기둥
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 6.4, 8), new THREE.MeshLambertMaterial({ color: 0xd8d4c8 }));
      p.position.copy(a.p).addScaledVector(a.side, s * (a.hw + 0.6));
      p.position.y += 3.2;
      g.add(p);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(a.hw * 2 + 2, 1.5, 0.4), new THREE.MeshLambertMaterial({ color: 0xe8523a }));
    bar.position.copy(a.p);
    bar.position.y += 6.2;
    bar.rotation.y = Math.atan2(a.tan.x, a.tan.z);
    g.add(bar);
    return g;
  }

  function clearCourse() {
    pip = null;
    if (!scene) return;
    if (window.PHYS) PHYS.dispose();
    while (scene.children.length) {
      const o = scene.children.pop();
      o.traverse && o.traverse((c) => {
        if (c.userData.keep) return;   // 운전자·아이템 GLB 는 여러 코스가 같이 쓴다
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          const ms = Array.isArray(c.material) ? c.material : [c.material];
          ms.forEach((m) => { if (m.map && m.map.dispose) m.map.dispose(); m.dispose(); });
        }
      });
    }
    karts = [];
    boxes = [];
  }

  // ---------- 카트 배치 ----------
  // list: [{kart, driver, human:true/false, skill}]
  function setupRacers(list) {
    const gp = TRACK.grid(T, list.length);
    karts = list.map((e, i) => {
      const g = KART.make(e.kart, e.driver, i + 1);
      scene.add(g);
      const S = new KART.State();
      S.pos.copy(gp[i].p);
      S.pos.y += 0.02;
      S.yaw = Math.atan2(gp[i].dir.x, gp[i].dir.z);
      S.lastS = gp[i].s;
      S.prog = -(T.total - gp[i].s);
      S.hint = TRACK.locate(T, S.pos, null).i;
      S.skill = KART.DRIVERS[e.driver].glb;   // 동물 스킬 (kart.js SKILLS)
      S.dashMax = S.skill === 'bunny' ? 6 : 10;   // 부스터 간격 10초 (2026-09-25 사장님), 토리는 같은 비율로 6초
      return {
        g, S, human: !!e.human, pad: e.pad || 0,
        brain: e.human ? null : AI.brain(e.skill || 1),
        stat: KART.KARTS[e.kart], driver: KART.DRIVERS[e.driver],
        name: KART.DRIVERS[e.driver].name, idx: i, ctl: { thr: 0, steer: 0, drift: false },
      };
    });
    players = karts.filter((k) => k.human);
    return karts;
  }

  // ---------- 조준 ----------
  // 모든 아이템은 과녁 하나를 노린다. 과녁은 내 앞에 있는 선수만 (2026-09-24 사장님 "앞에 있는 선수한테만 조준이 되는게 맞지")
  // → 1등이 아이템 키를 누르면 아이템을 버린다(조준 표시도 안 뜬다)
  // 사람: 앞 선수 중 1등을 먼저 ("조준을 1등우선으로"), 좌우 키로 다른 앞 선수. CPU: 바로 앞 카트
  const ahead = (k, o) => o !== k && !o.S.finished && o.S.prog > k.S.prog;
  function aimTarget(k) {
    let t = null;
    karts.forEach((o) => {
      if (!ahead(k, o)) return;
      if (!t || (k.human ? o.S.prog > t.S.prog : o.S.prog < t.S.prog)) t = o;
    });
    return t;
  }
  // 사람이 아이템 키를 누르고 있으면(조준 중) 과녁 카트 머리 위에 빨간 조준 표시, 떼면 발사
  let reticles = [];
  function makeReticle() {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.9, depthTest: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.09, 8, 36), mat);
    g.add(ring);
    for (let i = 0; i < 4; i++) {   // 십자 눈금
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), mat);
      const a = i * Math.PI / 2;
      t.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0);
      t.rotation.z = a + Math.PI / 2;
      g.add(t);
    }
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.6, 4), mat);
    arrow.rotation.x = Math.PI;
    arrow.position.y = -1.6;
    g.add(arrow);
    g.traverse((c) => { c.renderOrder = 999; });
    g.visible = false;
    effGroup.add(g);
    return g;
  }
  // 조준 중 좌우: 과녁을 화면에서 왼쪽(-1)·오른쪽(+1)에 있는 다음 상대로 바꾼다
  function nextTarget(k, dir, cam) {
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).setY(0).normalize();
    const fwd = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 2).setY(0).normalize().negate();
    const list = karts.filter((o) => ahead(k, o)).map((o) => {
      const dx = o.S.pos.x - k.S.pos.x, dz = o.S.pos.z - k.S.pos.z;
      return { o, b: Math.atan2(dx * right.x + dz * right.z, dx * fwd.x + dz * fwd.z) };   // 0 = 정면, + = 화면 오른쪽
    }).sort((a, b) => a.b - b.b);
    if (!list.length) return null;
    let i = list.findIndex((e) => e.o === k.aimSel);
    if (i < 0) return list[0].o;
    i = (i + dir + list.length) % list.length;
    return list[i].o;
  }
  function stepAim(dt) {
    players.forEach((pl, i) => {
      const r = reticles[i];
      if (!r) return;
      const tg = pl.S.item >= 0 && pl.ctl.aim ? (pl.aimSel || aimTarget(pl)) : null;   // 아이템 키를 누르고 있는 동안만
      r.visible = !!tg;
      if (!tg) return;
      r.position.set(tg.S.pos.x, tg.S.pos.y + 3.1 + Math.sin(performance.now() * 0.006) * 0.12, tg.S.pos.z);
      const cam = i === 0 ? camera : (cam2 || camera);
      r.quaternion.copy(cam.quaternion);   // 늘 화면을 본다
      r.children[0].rotation.z += dt * 2.5;
    });
  }

  // ---------- 아이템 쓰기 ----------
  function useItem(k) {
    const S = k.S;
    if (S.item < 0 || S.itemCd > 0) return;
    const kind = ITEMS.KIND[S.item].id;
    const aim = k.aimSel && ahead(k, k.aimSel) ? k.aimSel : aimTarget(k);   // 사람이 골라 둔 과녁이 먼저
    k.aimSel = null;
    S.item = -1;
    S.itemCd = 0.25;
    // 1등이 옥돔을 버리면 내 뒤에 남는다 → 뒤에서 오는 선수가 밟고 미끄러진다, 오른쪽 작은 창에 보인다 (2026-09-24 사장님)
    if (kind === 'okdom' && !aim) {
      const d = drops.find((x) => !x.on);
      if (d) {
        const f = new THREE.Vector3(Math.sin(S.yaw), 0, Math.cos(S.yaw));
        d.on = true;
        d.g.visible = true;
        d.pud.visible = false;
        d.from = S.pos.clone().setY(S.pos.y + 1.2);
        d.aim = null;
        d.fwd = f;
        d.land = S.pos.clone().addScaledVector(f, -6);   // 내 뒤 6m 에 웅덩이, 옥돔은 그 앞에서 뒤쪽으로 뿜는다
        d.fly = 0.45;
        d.age = -d.fly;
        d.owner = k.idx;
        d.t = 22;
      }
      AUD.sfx('banana');
      return;
    }
    if (!aim) {   // 앞에 아무도 없으면(1등) 노릴 수 없어 아이템을 버린다 — 다음 상자에서 새로 받는다 (2026-09-24 사장님)
      for (let i = 0; i < 8; i++) spawn(S.pos.x, S.pos.y + 1.2, S.pos.z, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, 0.8, 0.8, 0.8, 0.8, 0.5, 6);
      if (k.human) AUD.sfx('ui');
      return;
    }
    if (kind === 'hallabong') {
      // 과녁을 향해 높이 던진다. 떨어질 자리는 날아가는 동안 과녁을 따라가 반드시 맞는다
      const p = proj.find((x) => !x.on);
      if (p && aim) {
        p.on = true;
        p.g.visible = true;
        p.from = S.pos.clone().addScaledVector(new THREE.Vector3(Math.sin(S.yaw), 0, Math.cos(S.yaw)), 1.2);
        p.from.y += 1.4;
        const dist = p.from.distanceTo(aim.S.pos);
        p.fly = Math.min(1.7, 0.55 + dist / 55);   // 멀수록 오래
        p.arc = Math.min(16, 3 + dist * 0.13);     // 멀수록 높이
        p.age = 0;
        p.owner = k.idx;
        p.target = aim;
      }
      AUD.sfx('banana');
    } else if (kind === 'okdom') {
      // 과녁 코앞(가는 길)으로 포물선을 그리며 날아가 앉아, 과녁 쪽으로 물을 뿜는다
      const d = drops.find((x) => !x.on);
      if (d && aim) {
        d.on = true;
        d.g.visible = true;
        d.pud.visible = false;
        d.from = S.pos.clone().setY(S.pos.y + 1.2);
        d.aim = aim;
        d.fly = 0.7;          // 나는 시간
        d.age = -d.fly;       // 0 이 되면 앉는다
        d.owner = k.idx;
        d.t = 22;
      }
      AUD.sfx('banana');
    } else if (kind === 'pony') {
      // 과녁 앞 길가에서 튀어나와 과녁을 들이받는다
      const po = ponies.find((x) => !x.on);
      if (po && aim) {
        po.on = true;
        po.g.visible = true;
        po.aim = aim;
        const a = TRACK.at(T, aim.S.lastS + 18);
        const sd = Math.random() < 0.5 ? -1 : 1;
        po.g.position.copy(a.p).addScaledVector(a.side, sd * (a.hw + 1.5));
        po.t = 0;
        po.life = 4;
        po.hitDone = false;
        po.dir = 0;
        po.owner = k.idx;
      }
      AUD.sfx('item');
    } else if (kind === 'harubang') {
      // 과녁 머리 위로 떨어진다. 그림자가 0.9초 따라다니다 쿵
      const st = stones.find((x) => !x.on);
      if (st && aim) {
        st.on = true;
        st.target = aim;
        st.t = 0;
        st.owner = k.idx;
        st.landed = false;
        st.mark.visible = true;
      }
      AUD.sfx('item');
    }
  }

  // by = 공격한 카트 번호. 사람이 맞힌 거면 맞은 선수를 오른쪽 작은 창에 정면으로 비춘다
  function hitKart(k, hard, by) {
    const S = k.S;
    if (S.shield > 0) { S.shield = 0; AUD.sfx('shield'); return false; }
    if (by != null && by !== k.idx && karts[by] && karts[by].human) pip = { k, yaw: S.yaw, until: performance.now() + 2600, who: by };
    if (k.human && W.cb.onHurt) W.cb.onHurt(k);
    S.spin = (hard ? 1.25 : 0.9) * (S.skill === 'panda' ? 0.5 : 1);   // 판이: 튼튼한 몸
    S.squash = hard ? 0.8 : 0.5;
    S.vel *= 0.35;
    S.boost = 0;
    S.drift = 0;
    AUD.sfx('hit');
    // (맞을 때마다 나오던 하얀 연기는 뺐다 — 아이템마다 제 효과가 있다. 2026-09-24 사장님)
    return true;
  }

  // ---------- 한 프레임 ----------
  function stepRace(dt, input) {
    if (W.flash > 0) W.flash = Math.max(0, W.flash - dt);
    const n = karts.length;
    // 사람 입력
    players.forEach((k) => {
      const c = input(k);
      k.ctl.thr = c.thr; k.ctl.steer = c.steer; k.ctl.drift = c.drift; k.ctl.aim = !!c.aim;
      // 급출발 (전진 두 번 톡톡): 확 튀어 나가고 0.7초 부스트, 5초에 한 번
      k.S.dashCd = Math.max(0, (k.S.dashCd || 0) - dt);
      if (c.dash && k.S.dashCd <= 0 && !(k.S.spin > 0) && !(k.S.hydro > 0) && !k.S.finished) {
        const start = c.dash === 2;   // 출발 급발진: 바로 최고 속도 가까이 + 부스트 길게
        k.S.dashCd = k.S.dashMax || 10;   // 부스터는 10초에 한 번, 토리는 6초 (출발 급발진도 같이 센다)
        k.S.vel = start ? Math.max(k.S.vel, KART.TOP * 0.9) : Math.max(k.S.vel, Math.min(KART.TOP * 0.8, k.S.vel + 11));
        k.S.boost = Math.max(k.S.boost, start ? 1.3 : 0.7);
        AUD.sfx('boost');
        const bx = -Math.sin(k.S.yaw), bz = -Math.cos(k.S.yaw);
        for (let i = 0; i < 16; i++) spawn(k.S.pos.x + bx * 1.2 + (Math.random() - 0.5) * 1.4, k.S.pos.y + 0.3, k.S.pos.z + bz * 1.2 + (Math.random() - 0.5) * 1.4,
          bx * (4 + Math.random() * 4), 0.8 + Math.random() * 1.8, bz * (4 + Math.random() * 4), 0.85, 0.82, 0.76, 1.6, 0.6);   // 뒤로 튀는 흙먼지
      }
      if (c.aim && k.S.item >= 0) {   // 조준 시작 땐 바로 앞 카트, 좌우로 다른 상대
        if (!k.aimSel || !ahead(k, k.aimSel)) k.aimSel = aimTarget(k);   // 조준 중에 추월당한 과녁은 다시 고른다
        if (c.aimDir) k.aimSel = nextTarget(k, c.aimDir, k === players[0] ? camera : cam2) || k.aimSel;
      }
      if (c.use) useItem(k);
      if (!c.aim) k.aimSel = null;
    });
    // 순위 (먼저 계산해야 CPU 가 눈치를 본다)
    const order = karts.slice().sort((a, b) => (b.S.finished ? b.S.finishProg : b.S.prog) - (a.S.finished ? a.S.finishProg : a.S.prog));
    order.forEach((k, i) => { k.S.place = i + 1; });
    const pp = players.length ? players[0].S.place : 1;

    karts.forEach((k) => {
      const S = k.S;
      if (!k.human) {
        const c = AI.drive(S, k.brain, T, dt);
        k.ctl.thr = c.thr; k.ctl.steer = c.steer; k.ctl.drift = c.drift;
        // 아이템
        if (S.item >= 0) {
          k.brain.itemWait -= dt;
          if (k.brain.itemWait <= 0) { useItem(k); k.brain.itemWait = 1.5 + Math.random() * 3.5; }
        }
      }
      // 자석
      if (S.magnet && S.magnet.t > 0) {
        S.magnet.t -= dt;
        const tg = S.magnet.target;
        if (tg) {
          const want = Math.atan2(tg.S.pos.x - S.pos.x, tg.S.pos.z - S.pos.z);
          let d = want - S.yaw;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          k.ctl.steer = Math.max(-1, Math.min(1, k.ctl.steer + d * 1.2));
          S.vel += 9 * dt;
        }
      }
      const stat = { acc: k.stat.acc, top: k.stat.top * (k.human ? 1 : AI.rubberFor(S.place, n, pp) * k.brain.skill), grip: k.stat.grip };
      KART.step(S, k.ctl, stat, T, dt, W.cb);
      S.time += dt;
      KART.pose(k.g, S, k.ctl, dt);

      // 드리프트·부스트·흙먼지
      const spd = Math.abs(S.vel);
      if (S.drift > 0 && spd > 6) {
        const dm = S.skill === 'kitty' ? 1 / 1.5 : 1;
        const lvl = S.drift > 2.4 * dm ? 3 : S.drift > 1.4 * dm ? 2 : S.drift > 0.65 * dm ? 1 : 0;
        const col = [[0.85, 0.85, 0.9], [0.45, 0.75, 1], [1, 0.72, 0.25], [1, 0.35, 0.8]][lvl];
        for (const s of [-1, 1]) {
          spawn(S.pos.x - Math.sin(S.yaw) * 0.9 + Math.cos(S.yaw) * s * 0.7, S.pos.y + 0.22,
            S.pos.z - Math.cos(S.yaw) * 0.9 - Math.sin(S.yaw) * s * 0.7,
            (Math.random() - 0.5) * 2, 0.8 + Math.random(), (Math.random() - 0.5) * 2,
            col[0], col[1], col[2], 0.8 + lvl * 0.25, 0.35);
        }
      }
      if (S.boost > 0 && Math.random() < 0.6) {
        for (const sd of [-1, 1]) spawn(
          S.pos.x - Math.sin(S.yaw) * 1.3 + Math.cos(S.yaw) * sd * 0.36, S.pos.y + 0.5, S.pos.z - Math.cos(S.yaw) * 1.3 - Math.sin(S.yaw) * sd * 0.36,
          -Math.sin(S.yaw) * 5 + (Math.random() - 0.5) * 1.6, 0.8 + Math.random() * 1.4, -Math.cos(S.yaw) * 5 + (Math.random() - 0.5) * 1.6,
          1, 0.62, 0.18, 0.85, 0.26);
      }
      if (!S.onRoad && spd > 5) {
        spawn(S.pos.x + (Math.random() - 0.5) * 1.4, S.pos.y + 0.15, S.pos.z + (Math.random() - 0.5) * 1.4,
          0, 0.7, 0, 0.72, 0.64, 0.5, 1.3, 0.5);
      }
    });

    // 날아간 소품 굴리기
    if (window.PHYS) PHYS.step(dt);

    // 카트끼리
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (KART.bump(karts[i].S, karts[j].S) && (karts[i].human || karts[j].human)) {
        if (Math.random() < 0.3) AUD.sfx('bump');
      }
    }

    // 아이템 상자
    boxes.forEach((b) => {
      if (b.cd > 0) { b.cd -= dt; b.g.visible = b.cd <= 0; if (b.cd > 0) return; }
      b.g.rotation.y += dt * 2.2;
      b.g.rotation.x += dt * 0.9;
      b.g.position.y = b.p.y + 1.1 + Math.sin(performance.now() * 0.003 + b.p.x) * 0.16;
      karts.forEach((k) => {
        if (k.S.item >= 0 || b.cd > 0) return;
        // 옆 거리만 본다 (높이를 두 번 더해 상자가 2.2m 에 떠서 옆으로 0.9m 안에 들어야만 먹히던 것, 2026-09-24)
        const dx = k.S.pos.x - b.p.x, dz = k.S.pos.z - b.p.z;
        if (dx * dx + dz * dz < 2.5 * 2.5) {
          k.S.item = ITEMS.roll(k.S.place, karts.length);
          b.cd = 2;
          b.g.visible = false;
          if (k.human) { AUD.sfx('item'); if (W.cb.onItem) W.cb.onItem(k); }
        }
      });
    });

    // 한라봉 (포물선을 그리며 날아가 과녁 위로 떨어진다)
    proj.forEach((p) => {
      if (!p.on) return;
      p.age += dt;
      const tg = p.target, f = Math.min(1, p.age / p.fly);
      const land = tg.S.pos;
      p.g.position.lerpVectors(p.from, land, f);
      p.g.position.y = p.from.y + (land.y + 0.5 - p.from.y) * f + Math.sin(f * Math.PI) * p.arc;
      p.g.rotation.set(p.age * 9, Math.atan2(land.x - p.from.x, land.z - p.from.z), p.age * 4, 'YXZ');   // 데굴데굴 돌며
      if (Math.random() < dt * 25) spawn(p.g.position.x, p.g.position.y, p.g.position.z,
        (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, 0.95, 0.3, 0.02, 0.5, 0.4, 10);   // 날아가며 흘리는 과즙 한 방울
      if (f < 1) return;
      p.on = false;
      p.g.visible = false;
      const landed = hitKart(tg, true, p.owner);
      if (landed) { tg.S.vel *= 0.5; if (W.cb.onSplash) W.cb.onSplash(p.owner, tg); }
      // 퍽: 귤색 과즙 (색은 선형값 — 0.9·0.25·0.01 이 화면에서 귤색 #f28c1c 쯤)
      for (let i = 0; i < 34; i++) {   // 사방으로 튀었다 뚝뚝 떨어지는 과즙 방울
        const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 7;
        spawn(land.x, land.y + 0.9, land.z, Math.cos(a) * v, 3 + Math.random() * 6, Math.sin(a) * v,
          0.86, 0.12 + Math.random() * 0.08, 0.004, 0.6 + Math.random() * 0.6, 0.9, 16);
      }
      for (let i = 0; i < 10; i++) spawn(land.x + (Math.random() - 0.5), land.y + 1.0, land.z + (Math.random() - 0.5),   // 퍼지는 과즙 안개
        (Math.random() - 0.5) * 3, 0.5 + Math.random(), (Math.random() - 0.5) * 3, 0.95, 0.2, 0.01, 2.2, 0.45);
      for (let i = 0; i < 8; i++) spawn(land.x, land.y + 1.0, land.z,   // 껍질 조각
        (Math.random() - 0.5) * 8, 4 + Math.random() * 4, (Math.random() - 0.5) * 8, 0.8, 0.16, 0.005, 0.45, 1.0, 18);
      AUD.sfx('splash');
      if (players.indexOf(tg) >= 0) { W.flash = 0.2; W.flashWho = players.indexOf(tg); }
    });

    // 옥돔 (과녁 코앞으로 날아가 앉아 과녁 쪽으로 물을 뿜는다. 옥돔이나 웅덩이를 밟으면 미끄러진다)
    drops.forEach((d) => {
      if (!d.on) return;
      d.t -= dt;
      d.age += dt;
      if (d.age < 0 && !d.aim) {   // 1등이 버린 옥돔: 내 뒤 자리로 낮게 넘긴다
        const f = 1 + d.age / d.fly;
        d.g.position.lerpVectors(d.from, d.land, f);
        d.g.position.y += Math.sin(f * Math.PI) * 1.6;
        d.g.rotation.set(f * Math.PI * 2, Math.atan2(d.fwd.x, d.fwd.z), 0, 'YXZ');
        return;
      }
      if (d.age < 0) {   // 날아가는 중: 과녁이 갈 길(앞 8m)을 따라가며 포물선
        const A = d.aim.S, f = 1 + d.age / d.fly;
        const ahead = new THREE.Vector3(Math.sin(A.yaw), 0, Math.cos(A.yaw));
        const land = A.pos.clone().addScaledVector(ahead, Math.max(6, Math.abs(A.vel) * 0.35 + 5));
        d.land = land;
        d.fwd = ahead;
        d.g.position.lerpVectors(d.from, land, f);
        d.g.position.y += Math.sin(f * Math.PI) * 4.5;
        d.g.rotation.set(f * Math.PI * 2, A.yaw, 0, 'YXZ');   // 공중제비
        return;
      }
      if (!d.pud.visible) {   // 착지: 웅덩이는 과녁 쪽(착지점), 옥돔은 그 너머에서 과녁을 본다
        d.back = d.fwd.clone().negate();
        const ly = TRACK.locate(T, d.land, null).y;
        d.pud.position.copy(d.land).setY(ly + 0.03);
        d.g.position.copy(d.land).addScaledVector(d.fwd, 2.6).setY(ly);
        d.g.rotation.set(0, Math.atan2(d.back.x, d.back.z), 0);
        d.pud.scale.setScalar(0.01);
        d.pud.visible = true;
        d.age = 0;
        for (let i = 0; i < 10; i++) spawn(d.g.position.x, ly + 0.3, d.g.position.z,
          (Math.random() - 0.5) * 5, Math.random() * 3, (Math.random() - 0.5) * 5, 0.55, 0.82, 1.0, 1.0, 0.5);
      }
      const R = 2.3 * Math.min(1, d.age / 0.3);   // 웅덩이는 0.3초 만에 퍼진다
      d.pud.scale.setScalar(Math.max(0.01, R));
      d.g.position.y = d.pud.position.y - 0.03 + Math.abs(Math.sin(d.age * 6)) * 0.06;   // 뿜을 때마다 들썩
      if (Math.random() < dt * 40) {   // 입에서 뿜는 물줄기
        const mx = d.g.position.x + d.back.x * 0.8, mz = d.g.position.z + d.back.z * 0.8, sp = 3 + Math.random() * 2.5;
        spawn(mx, d.g.position.y + 0.45, mz, d.back.x * sp + (Math.random() - 0.5), 2.2 + Math.random() * 1.5, d.back.z * sp + (Math.random() - 0.5),
          0.55, 0.82, 1.0, 0.7, 0.55);
      }
      karts.forEach((k) => {
        if (!d.on || (k.idx === d.owner && d.age < 1)) return;
        const dx = k.S.pos.x - d.pud.position.x, dz = k.S.pos.z - d.pud.position.z;
        if (k.S.pos.distanceToSquared(d.g.position) < 3.0 || dx * dx + dz * dz < (R + 0.6) * (R + 0.6)) {
          d.on = false;
          d.g.visible = false;
          d.pud.visible = false;
          const v = k.S.vel, dir = k.S.yaw + k.S.slip;
          if (hitKart(k, false, d.owner)) {   // 물에 미끄러짐: 제자리에서 도는 대신 가던 속도 그대로 빙글빙글 미끄러진다
            k.S.spin = 0; k.S.squash = 0;
            k.S.hydro = k.S.skill === 'panda' ? 0.85 : 1.7; k.S.hydroDir = dir; k.S.vel = Math.max(8, v * 0.92);
          }
          for (let i = 0; i < 12; i++) spawn(k.S.pos.x, k.S.pos.y + 0.2, k.S.pos.z,
            (Math.random() - 0.5) * 7, Math.random() * 3, (Math.random() - 0.5) * 7, 0.55, 0.82, 1.0, 1.0, 0.5);
          AUD.sfx('splash');
        }
      });
      if (d.t <= 0) { d.on = false; d.g.visible = false; d.pud.visible = false; }
    });

    // 조랑말 (길가에서 튀어나와 과녁을 쫓아 들이받고, 지나가서 사라진다)
    ponies.forEach((po) => {
      if (!po.on) return;
      po.t += dt;
      const A = po.aim.S;
      if (!po.hitDone) {
        const dx = A.pos.x - po.g.position.x, dz = A.pos.z - po.g.position.z;
        po.dir = Math.atan2(dx, dz);
        const sp = Math.max(24, Math.abs(A.vel) + 14);
        const dist = Math.hypot(dx, dz);
        const step = Math.min(dist, sp * dt);
        po.g.position.x += Math.sin(po.dir) * step;
        po.g.position.z += Math.cos(po.dir) * step;
        if (dist < 2.2) {   // 조랑말 크기(3.89m)에 맞춘 부딪히는 거리
          po.hitDone = true;
          hitKart(po.aim, true, po.owner);
          for (let i = 0; i < 16; i++) spawn(A.pos.x, A.pos.y + 0.6, A.pos.z,
            (Math.random() - 0.5) * 8, Math.random() * 4, (Math.random() - 0.5) * 8, 0.85, 0.75, 0.6, 1.6, 0.7);
          AUD.sfx('bump');
          po.life = po.t + 1.2;
        }
      } else {   // 들이받고 그대로 달려 나간다
        po.g.position.x += Math.sin(po.dir) * 20 * dt;
        po.g.position.z += Math.cos(po.dir) * 20 * dt;
      }
      const l = TRACK.locate(T, po.g.position, null);
      po.g.position.y = l.y + Math.abs(Math.sin(po.t * 11)) * 0.35;   // 깡충깡충
      po.g.rotation.set(Math.sin(po.t * 11) * 0.12, po.dir, 0, 'YXZ');
      if (Math.random() < dt * 20) spawn(po.g.position.x, l.y + 0.2, po.g.position.z,
        (Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2, 0.85, 0.8, 0.7, 1.2, 0.5);   // 흙먼지
      if (po.t >= po.life) { po.on = false; po.g.visible = false; }
    });

    // 돌하르방 (그림자가 따라가다 쿵)
    stones.forEach((st) => {
      if (!st.on) return;
      st.t += dt;
      const tp = st.target.S.pos, WARN = 0.9, FALL = 0.35;
      if (!st.landed) {   // 떨어지는 동안은 과녁을 따라간다
        st.mark.position.set(tp.x, tp.y + 0.08, tp.z);
        st.mark.scale.setScalar(0.5 + 0.5 * Math.min(1, st.t / WARN));
      }
      if (st.t >= WARN && !st.landed) {
        const f = Math.min(1, (st.t - WARN) / FALL);
        st.g.visible = true;
        st.g.position.set(st.mark.position.x, st.mark.position.y + 18 * (1 - f * f), st.mark.position.z);
        st.g.rotation.y = st.target.S.yaw + Math.PI;
        if (f >= 1) {
          st.landed = true;
          st.mark.visible = false;
          karts.forEach((k) => {
            if (k.idx === st.owner) return;
            if (k.S.pos.distanceToSquared(st.g.position) < 7.5 && hitKart(k, true, st.owner)) { k.S.squash = 1.3; k.S.slow = k.S.skill === 'panda' ? 1.1 : 2.2; }
          });
          // 돌가루: 바닥을 따라 퍼지는 뿌연 고리 + 위로 튀는 돌 부스러기 + 오래 남는 먼지
          const gx = st.g.position.x, gy = st.g.position.y, gz = st.g.position.z;
          for (let i = 0; i < 36; i++) {
            const a = i / 36 * Math.PI * 2, v = 7 + Math.random() * 6, c = 0.62 + Math.random() * 0.12;
            spawn(gx + Math.cos(a) * 0.8, gy + 0.3, gz + Math.sin(a) * 0.8, Math.cos(a) * v, 0.4 + Math.random() * 1.6, Math.sin(a) * v, c, c * 0.97, c * 0.9, 2.6 + Math.random(), 1.1);
          }
          for (let i = 0; i < 22; i++) {
            const c = 0.3 + Math.random() * 0.15;
            spawn(gx, gy + 1.2, gz, (Math.random() - 0.5) * 9, 5 + Math.random() * 6, (Math.random() - 0.5) * 9, c, c, c * 1.05, 0.55, 0.9);
          }
          for (let i = 0; i < 14; i++) {
            const c = 0.7 + Math.random() * 0.1;
            spawn(gx + (Math.random() - 0.5) * 2.5, gy + 0.8 + Math.random() * 1.5, gz + (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 2, c, c * 0.97, c * 0.92, 3.4, 1.6);
          }
          AUD.sfx('bolt');
          if (players.indexOf(st.target) >= 0) { W.flash = 0.3; W.flashWho = players.indexOf(st.target); }
        }
      }
      if (st.landed && st.t > WARN + FALL + 1.4) { st.on = false; st.g.visible = false; }
    });

    // 물에 미끄러지는 카트: 바퀴 밑에서 물보라
    karts.forEach((k) => {
      if (!(k.S.hydro > 0)) return;
      for (let i = 0; i < 3; i++) spawn(k.S.pos.x + (Math.random() - 0.5) * 1.6, k.S.pos.y + 0.15, k.S.pos.z + (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 5, 1.5 + Math.random() * 2.5, (Math.random() - 0.5) * 5, 0.6, 0.85, 1.0, 0.9, 0.45);
    });
    stepAim(dt);
    stepFx(dt);
    return order;
  }

  // ---------- 카메라 ----------
  function follow(cam, k, dt, snap) {
    const S = k.S;
    const spd = Math.abs(S.vel);
    const back = 9.2 + spd * 0.085;
    const yaw = S.yaw + S.slip * 0.55;
    tmp.set(S.pos.x - Math.sin(yaw) * back, S.pos.y + 4.05 + spd * 0.022, S.pos.z - Math.cos(yaw) * back);
    if (snap) cam.position.copy(tmp);
    else cam.position.lerp(tmp, Math.min(1, dt * (S.air ? 4 : 7)));
    const look = new THREE.Vector3(S.pos.x + Math.sin(yaw) * 8, S.pos.y + 1.75, S.pos.z + Math.cos(yaw) * 8);
    cam.lookAt(look);
    const want = 64 + Math.min(20, spd * 0.55) + (S.boost > 0 ? 8 : 0);
    cam.fov += (want - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix();
    if (sunLight) {
      sunLight.position.set(S.pos.x + SCENERY.THEMES[T.c.theme].sun[2], SCENERY.THEMES[T.c.theme].sun[3], S.pos.z + SCENERY.THEMES[T.c.theme].sun[4]);
      sunLight.target.position.copy(S.pos);
      sunLight.target.updateMatrixWorld();
    }
  }

  function render() {
    if (flashEl) {   // 2P 분할이면 맞은 사람 쪽 반만
      const half = splitMode && players.length > 1;
      flashEl.style.top = half && W.flashWho === 1 ? '50%' : '0';
      flashEl.style.bottom = half && W.flashWho === 0 ? '50%' : '0';
      flashEl.style.opacity = W.flash > 0 ? Math.min(1, W.flash / 0.2) * 0.8 : 0;
    }
    if (sceneryObj && sceneryObj.update) sceneryObj.update(performance.now() / 1000);
    if (splitMode && players.length > 1) {
      const h = innerHeight / 2, w = innerWidth;
      renderer.setScissorTest(true);
      renderer.setViewport(0, h, w, h);   // 위: 1P
      renderer.setScissor(0, h, w, h);
      renderer.render(scene, camera);
      renderer.setViewport(0, 0, w, h);   // 아래: 2P
      renderer.setScissor(0, 0, w, h);
      renderer.render(scene, cam2);
      renderer.setScissorTest(false);
    } else {
      renderer.setViewport(0, 0, innerWidth, innerHeight);
      renderer.render(scene, camera);
      renderPip();
    }
  }

  // 내 공격에 맞은 선수를 앞에서 찍어 오른쪽 창에 2.6초 보여 준다 (2P 분할 화면에선 안 띄운다)
  function renderPip() {
    const el = document.getElementById('pip');
    const on = pip && performance.now() < pip.until && karts.indexOf(pip.k) >= 0;
    if (el) el.classList.toggle('on', !!on);
    if (!on) { pip = null; return; }
    const r = el.getBoundingClientRect();
    if (!r.width) return;
    if (!pipCam) pipCam = new THREE.PerspectiveCamera(38, 1, 0.3, 900);
    pipCam.aspect = r.width / r.height;
    pipCam.updateProjectionMatrix();
    const P = pip.k.S.pos, fx = Math.sin(pip.yaw), fz = Math.cos(pip.yaw);   // 맞은 순간의 앞쪽에서 (빙글 도는 게 보이게)
    pipCam.position.set(P.x + fx * 4.6, P.y + 3.4, P.z + fz * 4.6);   // 길 한가운데 앞에서 조금 높이 (옆 담·건물에 가리지 않게)
    pipCam.lookAt(P.x, P.y + 0.9, P.z);
    const x = r.left, y = innerHeight - r.bottom;
    const sh = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;   // 그림자는 본 화면에서 이미 그렸다
    renderer.setScissorTest(true);
    renderer.setViewport(x, y, r.width, r.height);
    renderer.setScissor(x, y, r.width, r.height);
    renderer.render(scene, pipCam);
    renderer.setScissorTest(false);
    renderer.shadowMap.autoUpdate = sh;
    renderer.setViewport(0, 0, innerWidth, innerHeight);
  }

  Object.assign(W, { initGL, loadCourse, clearCourse, setupRacers, stepRace, follow, render, resize, useItem, hitKart, spawn, cb: {} });
  Object.defineProperties(W, {
    karts: { get: () => karts },
    players: { get: () => players },
    boxes: { get: () => boxes },
    track: { get: () => T },
    cam2: { get: () => cam2 },
    split: { get: () => splitMode, set: (v) => { splitMode = v; resize(); } },
    quality: { get: () => quality, set: (q) => { quality = q; } },
  });
})();
