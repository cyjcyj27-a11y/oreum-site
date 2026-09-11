// 주인공 고양이 루루 — 제주 관광은 루루가 다닌다.
// 브랜드 캐릭터 루루냥(밀짚모자·노란 스카프·초록 멜빵바지·갈색 가방, 큰 초록 눈의 얼룩 고양이)을 코드로 만든 2족 치비.
// 달리면 운전석에 앉아 앞발로 운전대를 잡고(핸들 따라 몸이 기울고 고개가 돈다), 서면 뛰어내려 주변을 어슬렁거린다.
// F(또는 명소 없을 때 E)로 내려서 방향키로 직접 걷고(Shift 달리기, 스페이스 점프), 차 옆에서 F로 다시 탄다.
(function () {
  const I = ISLAND, H = I.H;
  const S = { mode: 'ride', t: 0, x: 0, z: 0, y: 0, yaw: 0, jump: 0, jumpFrom: null, wanderT: 0, tgt: null, look: 0, lookT: 0, onFoot: false, spd: 0, jy: 0, jumpV: 0, ctl: null, parkT: 0 };
  const camPos = new THREE.Vector3(), camWant = new THREE.Vector3(), lookV = new THREE.Vector3(); let camInit = false;
  let scene = null, root = null, R = null; // R: 부위(rig)
  const carE = new THREE.Euler(), carQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), posV = new THREE.Vector3(), doorV = new THREE.Vector3();
  // 믹사모 Entering Car: 앞으로 1.8m 걸어가 왼쪽으로 90도 돌아 앉는다 → 클립 루트를 차 방향에서 -90도 돌려 두면 끝 자세가 차 앞을 본다. Exiting Car 는 차 방향 그대로 왼쪽으로 내린다
  const Q_ENTER = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2), enterQ = new THREE.Quaternion();
  const Q_OUT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), outQ = new THREE.Quaternion(), endV = new THREE.Vector3(), catV = new THREE.Vector3();   // 차 밖(왼쪽)을 보는 방향
  const STAND = 0.25;   // 엉덩이(모델 원점)에서 발바닥까지
  const gnd = (x, z) => { const h = Math.max(0, H(x, z)); const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null; return r == null ? h : Math.max(h, r); };   // 땅과 그려진 길·인도 중 높은 쪽
  // 발 디딜 높이: 발자리(±r) 다섯 점 중 가장 낮은 곳 — 비탈에서 발이 공중에 뜨지 않게(조금 묻히는 쪽이 덜 어색하다)
  // 땅(자연 비탈)은 발자리 5점 중 가장 낮은 곳, 길·인도(사람이 깐 단)는 5점 중 가장 높은 곳 — 인도 턱에 걸쳐 서면 인도 높이로(신발이 인도에 묻히지 않게)
  const foot = (x, z, r) => {
    const pts = [[x, z], [x + r, z], [x - r, z], [x, z + r], [x, z - r]]; let tmax = -1e9, smax = null;   // 비탈에선 발 둘레 가장 높은 땅에 맞춘다(낮은 데 맞추면 언덕에 몸이 박힌다)
    for (const [px, pz] of pts) { const h = Math.max(0, H(px, pz)); if (h > tmax) tmax = h; const sv = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(px, pz) : null; if (sv != null && (smax == null || sv > smax)) smax = sv; }
    return (smax == null ? tmax : Math.max(tmax, smax)) + 0.02;
  };
  const steep = (x, z) => Math.hypot(H(x + 1, z) - H(x - 1, z), H(x, z + 1) - H(x, z - 1)) / 2 > 0.9;   // 42도 넘는 비탈(절벽)

  // 탈것별 운전석 자리(차 기준 좌표: 앞 -z, 오른쪽 +x, 엉덩이 높이) 와 크기. 사람 상자가 붙은 탈것은 숨긴다.
  const SEAT = {
    open: [-0.42, 0.6, 0.55, 1.0],   // 엉덩이(쿠션) 높이 — 믹사모 앉기 클립은 엉덩이 뼈를 이 점에 맞춘다 car: [-0.4, 0.75, 0.1, 0.9], sport: [-0.4, 0.65, 0.25, 0.85], suv: [-0.42, 0.95, 0.25, 0.95], ev: [-0.4, 0.72, 0.05, 0.9], camper: [-0.42, 0.9, -1.9, 0.95],
    truck: [-0.4, 1.15, -1.7, 0.9], bus: [-0.6, 1.25, -4.0, 0.95], boat: [0, 1.2, 0.6, 1.0], fishing: [0, 1.3, -1.2, 1.0], ferry: [0, 3.0, 1, 1.1], train: [0, 2.15, 1.6, 1.0], sub: null, glider: null,
    kart: null, atv: null, horse: null, bicycle: null, cart: null, kayak: null, surf: null, diver: null,
  };

  // 고양이 자리(차 기준): 운전석·조수석 가운데, 좌석보다 조금 높게, 조금 뒤로. 발바닥은 여기서 STAND 만큼 아래다
  const CATSEAT = [0, 0.30, 0.15];

  // ---------- 그림으로 그린 얼굴·질감 (캔버스 → 텍스처) ----------
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
  // 머리 텍스처: 구의 UV — 가로가 둘레(앞 = 0.5), 세로가 위(0)→아래(1)
  const faceTex = canvasTex(1024, 512, (g, W, Hh) => {
    const cx = W / 2;
    g.fillStyle = '#f4ead6'; g.fillRect(0, 0, W, Hh);
    // 정수리·뒤통수·옆머리 갈색 얼룩
    g.fillStyle = '#5c3f2b';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 96);
    for (let x = W; x >= 0; x -= 32) g.lineTo(x, 96 + Math.sin(x * .05) * 14 + (Math.abs(x - cx) < 200 ? 30 : 0));
    g.closePath(); g.fill();
    for (const [x, y, rx, ry, rot] of [[150, 230, 120, 120, .2], [874, 230, 120, 120, -.2], [60, 180, 80, 140, 0], [964, 180, 80, 140, 0]]) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fill(); }
    // 이마 M 무늬 (세 줄기)
    g.lineCap = 'round'; g.strokeStyle = '#5c3f2b';
    for (const [dx, len, wdt] of [[0, 96, 30], [-58, 70, 22], [58, 70, 22]]) { g.lineWidth = wdt; g.beginPath(); g.moveTo(cx + dx, 100); g.lineTo(cx + dx * 1.1, 100 + len); g.stroke(); }
    // 볼 옆 줄무늬(연갈색)
    g.strokeStyle = '#9a7a55'; g.lineWidth = 12;
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(cx + s * (215 + i * 34), 225 + i * 18); g.lineTo(cx + s * (255 + i * 34), 275 + i * 18); g.stroke(); }
    // 입가(흰 부분)
    g.fillStyle = '#fbf7ef'; g.beginPath(); g.ellipse(cx, 302, 118, 66, 0, 0, 7); g.fill();
    // 볼 홍조
    for (const s of [-1, 1]) { const rg = g.createRadialGradient(cx + s * 165, 292, 4, cx + s * 165, 292, 46); rg.addColorStop(0, 'rgba(240,150,140,.55)'); rg.addColorStop(1, 'rgba(240,150,140,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(cx + s * 165, 292, 50, 34, 0, 0, 7); g.fill(); }
    // 눈 — 큼직하게, 초록 홍채·검은 눈동자·하이라이트
    for (const s of [-1, 1]) {
      const ex = cx + s * 92, ey = 236;
      g.fillStyle = '#3a2718'; g.beginPath(); g.ellipse(ex, ey, 52, 66, 0, 0, 7); g.fill();          // 테두리
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ex, ey + 2, 46, 60, 0, 0, 7); g.fill();       // 흰자
      const ir = g.createRadialGradient(ex, ey + 8, 6, ex, ey + 8, 44); ir.addColorStop(0, '#9fd37a'); ir.addColorStop(.7, '#5f9e45'); ir.addColorStop(1, '#2f5f2a');
      g.fillStyle = ir; g.beginPath(); g.ellipse(ex, ey + 6, 38, 52, 0, 0, 7); g.fill();               // 홍채
      g.fillStyle = '#17110c'; g.beginPath(); g.ellipse(ex, ey + 10, 20, 36, 0, 0, 7); g.fill();       // 눈동자
      g.fillStyle = 'rgba(58,39,24,.45)'; g.beginPath(); g.ellipse(ex, ey - 30, 40, 18, 0, Math.PI, 0); g.fill();   // 윗눈꺼풀 그늘
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ex - 14 * s, ey - 16, 13, 15, 0, 0, 7); g.fill(); g.beginPath(); g.arc(ex + 12 * s, ey + 26, 6, 0, 7); g.fill();   // 하이라이트
      g.strokeStyle = '#3a2718'; g.lineWidth = 5; g.beginPath(); g.ellipse(ex, ey - 40, 44, 14, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();   // 눈꺼풀 선
    }
    // 코 + 입(ω)
    g.fillStyle = '#e28b86'; g.beginPath(); g.moveTo(cx - 15, 292); g.lineTo(cx + 15, 292); g.quadraticCurveTo(cx, 318, cx, 318); g.closePath(); g.fill();
    g.strokeStyle = '#4a3226'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, 314); g.lineTo(cx, 326); g.stroke();
    g.beginPath(); g.moveTo(cx, 326); g.quadraticCurveTo(cx - 20, 345, cx - 38, 326); g.moveTo(cx, 326); g.quadraticCurveTo(cx + 20, 345, cx + 38, 326); g.stroke();
    // 수염 점
    g.fillStyle = '#c9b8a0'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + s * (60 + i * 16), 300 + i * 10 - 8, 3, 0, 7); g.fill(); }
  });
  const strawTex = canvasTex(256, 256, (g, W, Hh) => {
    g.fillStyle = '#d9b25c'; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = 'rgba(120,80,30,.35)'; g.lineWidth = 2;
    for (let y = 0; y < Hh; y += 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let x = 0; x < W; x += 14) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
    g.fillStyle = 'rgba(255,240,180,.25)'; for (let i = 0; i < 400; i++) g.fillRect(Math.random() * W, Math.random() * Hh, 6, 3);
  });
  strawTex.wrapS = strawTex.wrapT = THREE.RepeatWrapping; strawTex.repeat.set(4, 2);
  const clothTex = canvasTex(128, 128, (g, W, Hh) => { g.fillStyle = '#6b7d4a'; g.fillRect(0, 0, W, Hh); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '40,55,25' : '120,140,90'},.18)`; g.fillRect(Math.random() * W, Math.random() * Hh, 2, 2); } });
  clothTex.wrapS = clothTex.wrapT = THREE.RepeatWrapping; clothTex.repeat.set(2, 2);
  // 툰 음영 (4단계)
  const grad = new THREE.DataTexture(new Uint8Array([90, 150, 205, 255]), 4, 1, THREE.RedFormat); grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const toon = (c, o) => new THREE.MeshToonMaterial(Object.assign({ color: c, gradientMap: grad }, o || {}));
  const M = {
    face: toon(0xffffff, { map: faceTex }), fur: toon(0xf4ead6), furDark: toon(0x5c3f2b), white: toon(0xfbf7ef),
    inner: toon(0xf0b6b0), straw: toon(0xffffff, { map: strawTex }), band: toon(0x8a5a2b), flower: toon(0xf2a33a), flowerC: toon(0xfff0a0), leaf: toon(0x6b9b45),
    scarf: toon(0xf0c440), shirt: toon(0xf7f2e6), overall: toon(0xffffff, { map: clothTex }), strap: toon(0x7a4b26), bag: toon(0x8b5a2b), buckle: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: .4, metalness: .6 }),
    line: new THREE.MeshBasicMaterial({ color: 0x3a2a1e, side: THREE.BackSide }),
  };

  // 코드로 만든 루루냥 치비는 쓰지 않는다(주인공은 hero.glb). 메시는 만들지 않고 빈 뼈대만 둬서 기존 코드가 그대로 돌게 한다
  function build() {
    const g = new THREE.Group(), flip = new THREE.Group(); flip.visible = false; g.add(flip);
    const d = () => { const o = new THREE.Group(); flip.add(o); return o; };
    R = { body: d(), head: d(), hat: d(), earL: d(), earR: d(), armL: d(), armR: d(), legL: d(), legR: d(), tail: [d(), d(), d(), d()] };
    return g;
  }

  function init(sc) {
    scene = sc; root = build(); scene.add(root); catRoot = new THREE.Group(); scene.add(catRoot); gfLoad();
    S.x = PLAYER.x; S.z = PLAYER.z; S.y = gnd(S.x, S.z); S.mode = 'ride';
    loadGlb();
  }

  // ---------- Meshy 모델: 주인공(재벌집 아들, hero.glb: 서기/걷기/달리기) + 애완 고양이(cat_luru.glb: 걷기) ----------
  // 둘 다 얼굴이 +z, 뼈 스케일 1/100. 크기는 첫 프레임을 만든 뒤 Box3 로 잰다. 루트(엉덩이 원점, 앞 -z)에 맞춰 π 돌리고 발을 땅에 내린다.
  // 코드 치비는 숨겨 둔 예비(안 보인다). 고양이는 차에선 조수석, 내리면 주인공 뒤를 따라 걷는다.
  const CAT = { g: null, mixer: null, act: null, h: 0.42, t: 0, flip: Math.PI,   // flip: 이 GLB 는 머리가 +Z 쪽이다. 게임은 -Z 가 정면이라 180도 돌려 붙인다(2026-09-10, 뼈 위치로 확인: head z=+0.38, tail z=-0.06)
 idleT: 0.95 };   // h: 키(미터). idleT: 걷기 클립(1초)에서 네 발이 가장 고르게 땅에 닿는 순간 — 멈출 때 이 자세로 선다
  // (2026-09-10 발끝 뼈 넷의 높이차·짝 어긋남을 40칸으로 재서 고른 값. 0.16 은 앞발 하나가 들려 있어 걷다 만 것처럼 보였다)
  const HERO = { g: null, mixer: null, acts: null, h: 1.72, cur: '', holder: null, base: 0 };
  const C = { x: 0, z: 0, y: 0, yaw: 0, spd: 0 }; let catRoot = null;
  function fitModel(g, h, precise, mip) {   // precise: 뼈가 움직인 실제 자세로 잰다(아니면 원본 자세 기준이라 발이 땅에 파묻힌다). mip: 밉맵 켬(작은 모델용)
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g, !!precise), sz = new THREE.Vector3(); box.getSize(sz);
    const s = h / (sz.y || 1); g.scale.setScalar(s);
    const holder = new THREE.Group(); holder.rotation.y = Math.PI; holder.position.y = -STAND - box.min.y * s; holder.add(g);
    g.traverse(o => { if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.frustumCulled = false; if (o.material) { o.material.roughness = 0.85; o.material.metalness = 0; if (o.material.color) o.material.color.set(0xffffff);   // 믹사모 FBX 의 어두운 재질색이 텍스처에 곱해지지 않게
      // Meshy 텍스처는 조각난 UV 라 밉맵을 만들면 피부·옷 조각 색이 섞여 가장자리에 점이 생긴다 → 밉맵 없이 원본만 쓴다(인물은 늘 가까이 보인다)
      // 단, 고양이처럼 화면에 작게 보이는 모델은 밉맵 없이 2048 텍스처를 뿌리면 텍셀을 건너뛰어 지글거리고 뭉개진다 → 밉맵+이방성 16
      const m = o.material.map; if (m) { if (mip) { m.generateMipmaps = true; m.minFilter = THREE.LinearMipmapLinearFilter; m.magFilter = THREE.LinearFilter; m.anisotropy = 16; } else { m.generateMipmaps = false; m.minFilter = THREE.LinearFilter; m.magFilter = THREE.LinearFilter; m.anisotropy = 8; } m.needsUpdate = true; } } } });
    return holder;
  }
  function loadGlb() {
    if (!window.GLB) return;
    GLB.load('assets/models/hero.glb?v=6', {}).then(g => {
      const mixer = g.userData.mixer, clips = g.userData.clips || []; if (!mixer) throw new Error('no anim');
      const find = re => clips.find(c => re.test(c.name)) || clips[0];
      // 믹사모 클립: idle · walk(제자리) · run(제자리) · sit(앉아 있기, 반복) · enter(차에 타기, 한 번) · exit(차에서 내리기, 한 번)
      const act = re => { const c = clips.find(x => re.test(x.name)); return c ? mixer.clipAction(c) : null; };
      HERO.acts = { idle: act(/^idle/i) || mixer.clipAction(clips[0]), walk: act(/^walk/i), run: act(/^run/i), sit: act(/^sit/i), enter: act(/^enter/i), exit: act(/^exit/i), jump: act(/^jump$/i), jumpdown: act(/^jumpdown/i), vault: act(/^vault/i) };
      for (const k of ['enter', 'exit', 'jump', 'jumpdown', 'vault']) if (HERO.acts[k]) { HERO.acts[k].setLoop(THREE.LoopOnce, 1); HERO.acts[k].clampWhenFinished = true; }
      HERO.acts.idle.play(); mixer.update(0);
      HERO.holder = fitModel(g, HERO.h); HERO.base = HERO.holder.position.y; HERO.mixer = mixer; HERO.g = g; HERO.cur = 'idle';
      // 엉덩이 뼈가 루트(엉덩이 원점, 발은 -STAND)에서 어디에 있는지 클립·시각별로 잰다 — 타기/내리기/앉기 때 좌석에 맞추는 기준
      const hips = g.getObjectByName('mixamorigHips') || g.getObjectByName('Hips');
      const tmpRoot = new THREE.Group(); tmpRoot.add(HERO.holder); tmpRoot.updateMatrixWorld(true);
      const hipAt = (name, t) => { const a = HERO.acts[name]; if (!a || !hips) return new THREE.Vector3(0, 0.65, 0); mixer.stopAllAction(); a.reset(); a.play(); mixer.setTime(t); tmpRoot.updateMatrixWorld(true); const v = new THREE.Vector3(); hips.getWorldPosition(v); return v; };
      HERO.hip = { sit: hipAt('sit', 0.1), enter0: hipAt('enter', 0), enter1: hipAt('enter', HERO.acts.enter ? HERO.acts.enter.getClip().duration - 0.03 : 0), exit0: hipAt('exit', 0), exit1: hipAt('exit', HERO.acts.exit ? HERO.acts.exit.getClip().duration - 0.03 : 0), idle: hipAt('idle', 0.1) };
      mixer.stopAllAction(); HERO.acts.idle.reset().play(); mixer.update(0); tmpRoot.remove(HERO.holder);
      console.log('hero hips', JSON.stringify(Object.fromEntries(Object.entries(HERO.hip).map(([k, v]) => [k, v.toArray().map(x => +x.toFixed(2))]))));
            root.children[0].visible = false; root.add(HERO.holder);   // children[0] = 코드 치비(flip)
    }).catch(e => console.warn('주인공 GLB 실패', e));
    GLB.load('assets/models/cat_luru.glb?v=2', {}).then(g => {
      CAT.mixer = g.userData.mixer; CAT.act = g.userData.play(); if (CAT.act) { CAT.mixer.setTime(CAT.idleT); CAT.act.paused = true; }   // 멈춘 액션은 setTime 이 안 먹는다 → 시간 맞춘 뒤 멈춤
      CAT.g = fitModel(g, CAT.h, true, true); CAT.g.rotation.y = CAT.flip; catRoot.add(CAT.g); C.x = S.x; C.z = S.z; C.yaw = S.yaw;
    }).catch(e => console.warn('고양이 GLB 실패', e));
  }
  // 주인공 애니: idle / walk / run 을 섞어 바꾸고, 차 안에선 좌석에 가라앉혀 앉은 것처럼 보이게 한다
  function heroAnim(dt, name, speed, sink) {
    if (!HERO.mixer) return;
    if (name === 'sit' && !HERO.acts.sit) name = 'idle';
    if (HERO.cur !== name) {
      const prev = HERO.acts[HERO.cur], nx = HERO.acts[name]; if (prev) prev.fadeOut(0.18);
      if (nx) nx.reset().fadeIn(0.18).play();
      HERO.cur = name;
    }
    const a = HERO.acts[name]; if (a && name !== 'idle' && name !== 'sit') a.timeScale = Math.max(0.5, Math.min(2.5, speed || 1));
    HERO.mixer.update(dt);
    // 애니 없는 순간에도 굳어 보이지 않게: 숨쉬기(살짝 위아래·앞뒤), 서 있으면 천천히 두리번, 운전 중엔 핸들 따라 몸이 기운다
    { const t = S.t, br = Math.sin(t * 1.55); HERO.g.rotation.x = br * 0.022; HERO.g.scale.y = HERO.g.scale.x * (1 + br * 0.014);
      if (name === 'idle') { HERO.g.rotation.y = Math.sin(t * 0.45) * 0.2 + Math.sin(t * 1.3) * 0.05; HERO.g.rotation.z = Math.sin(t * 0.7) * 0.03; }
      else if (name === 'sit') { const st = Math.max(-1, Math.min(1, PLAYER.steer || 0));   // 서 있을 때만큼은 아니어도 운전석에서도 숨은 쉰다
        HERO.g.rotation.z = -st * 0.1 + Math.sin(t * 0.8) * 0.012; HERO.g.rotation.y = -st * 0.25 + Math.sin(t * 0.37) * 0.05; }
      else { HERO.g.rotation.y = 0; HERO.g.rotation.z = 0; } }
    HERO.g.position.set(0, 0, 0); HERO.holder.position.y = HERO.base - (sink || 0);
  }
  // 차 몸체와 부딪히기: 차를 앞뒤 2.4m·좌우 1.0m 상자로 보고, 점(o.x,o.z)이 pad 만큼 안쪽이면 가까운 면으로 밀어낸다
  function pushOutCar(o, pad) {
    if (PLAYER.mode !== 'ground') return false;
    const fx = -Math.sin(PLAYER.yaw), fz = -Math.cos(PLAYER.yaw), rx = Math.cos(PLAYER.yaw), rz = -Math.sin(PLAYER.yaw);
    const dx = o.x - PLAYER.x, dz = o.z - PLAYER.z, lf = dx * fx + dz * fz, lr = dx * rx + dz * rz;
    const HL = 2.4 + pad, HW = 1.0 + pad; if (Math.abs(lf) >= HL || Math.abs(lr) >= HW) return false;
    const pf = HL - Math.abs(lf), pr = HW - Math.abs(lr);   // 각 면까지 남은 거리 — 짧은 쪽으로 민다
    if (pr < pf) { const k = (lr < 0 ? -1 : 1) * pr; o.x += rx * k; o.z += rz * k; } else { const k = (lf < 0 ? -1 : 1) * pf; o.x += fx * k; o.z += fz * k; }
    return true;
  }
  // 주인공 '모델'이 실제로 보고 있는 쪽. S.yaw 는 가려는 방향이고 모델은 그걸 천천히 따라 돌기 때문에,
  // 고양이를 S.yaw 에 맞추면 눈으로는 딴 데를 보고 서 있다 (사장님 2026-09-10)
  const faceV = new THREE.Vector3(), faceQ = new THREE.Quaternion();
  function heroYaw() {
    if (!root) return S.yaw;
    faceV.set(0, 0, -1).applyQuaternion(root.getWorldQuaternion(faceQ));
    return (faceV.x * faceV.x + faceV.z * faceV.z) < 1e-6 ? S.yaw : Math.atan2(-faceV.x, -faceV.z);
  }

  // 지나가는 차(교통)에도 부딪힌다. 내 차만 막고 있어서 주인공·고양이가 버스를 뚫고 지나갔다 (사장님 2026-09-10)
  // 차마다 앞뒤 2.2m·좌우 0.95m 상자로 보고, 안에 들어가 있으면 가까운 면으로 밀어낸다. 부딪힌 차는 선다.
  function pushOutTraffic(o, pad) {
    const cars = window.TRAFFIC && TRAFFIC.cars; if (!cars) return false;
    let any = false;
    for (const c of cars) {
      const ox = o.x - c.x, oz = o.z - c.z; if (ox * ox + oz * oz > 49) continue;
      const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
      const lf = ox * fx + oz * fz, lr = ox * rx + oz * rz;
      const HL = 2.2 + pad, HW = 0.95 + pad;
      if (Math.abs(lf) >= HL || Math.abs(lr) >= HW) continue;
      const pf = HL - Math.abs(lf), pr = HW - Math.abs(lr);
      if (pr < pf) { const k = (lr < 0 ? -1 : 1) * pr; o.x += rx * k; o.z += rz * k; }
      else { const k = (lf < 0 ? -1 : 1) * pf; o.x += fx * k; o.z += fz * k; }
      if (TRAFFIC.hit) TRAFFIC.hit(c);
      any = true;
    }
    return any;
  }

  // 한 번만 트는 클립(enter/exit): 시작하면 처음부터, 끝나면 마지막 자세에 멈춘다. 끝났는지 돌려준다
  function heroOnce(dt, name, speed) {
    if (!HERO.mixer || !HERO.acts[name]) return true;
    const a = HERO.acts[name];
    // 이름이 바뀌었거나, 같은 이름인데 멈춘 채 처음(시간 0)에 있으면 다시 시작한다(간헐적으로 클립이 멈춘 채 남던 문제)
    if (HERO.cur !== name || (!a.isRunning() && a.time < 0.02)) { const prev = HERO.acts[HERO.cur]; if (prev && prev !== a) prev.fadeOut(0.12); a.reset(); a.timeScale = speed || 1; a.fadeIn(0.12).play(); HERO.cur = name; }
    HERO.mixer.update(dt);
    HERO.g.position.set(0, 0, 0); HERO.g.rotation.set(0, 0, 0); HERO.g.scale.y = HERO.g.scale.x; HERO.holder.position.y = HERO.base;
    return a.time >= a.getClip().duration - 0.04;
  }
  // 루트를 어디에 두면 엉덩이(뼈)가 world 점 P 에 오는가: root = P - rot(hipRel)
  const hipV = new THREE.Vector3();
  function rootForHip(P, hipRel, q, out) { hipV.copy(hipRel).applyQuaternion(q); return out.copy(P).sub(hipV); }
  // 고양이: 차에선 조수석, 밖에선 주인공 뒤를 따라간다
  function catUpdate(dt) {
    if (!CAT.g || !catRoot) return;
    if (!root.visible) { catRoot.visible = false; return; }
    catRoot.visible = true;
    const seat = SEAT[PLAYER.veh];
    // 주인공과 같이 뛰기(사장님, 2026-09-08): 내릴 땐 조수석에서 오른쪽으로 뛰어내리고, 탈 땐 주인공이 뛰어드는 순간 조수석으로 뛰어오른다
    const phase = S.mode + (S.mode === 'hop_in' && S.hp === 'vault' ? '_vault' : '');
    if (seat && phase !== C.lastPhase) {
      // 내릴 때는 차 옆이 아니라 '주인공 옆 자리'로 뛰어내린다.
      // 차 옆에 떨어뜨리면 주인공이 이미 걸어간 뒤라, 고양이가 몸을 180도 돌려 되돌아오며 딴 데를 보고 걷는다
      // (사장님 2026-09-10 "주인공과 다른 방향을 보고 걷는다")
      if (S.mode === 'hop_out' && C.lastPhase === 'ride') {
        const fh = -Math.sin(S.yaw), fz2 = -Math.cos(S.yaw), rh = Math.cos(S.yaw), rz2 = -Math.sin(S.yaw);
        catV.set(S.x - fh * 0.45 + rh * 0.62, 0, S.z - fz2 * 0.45 + rz2 * 0.62);
        catV.y = gnd(catV.x, catV.z) + STAND;
        C.jump = { t: 0, from: catRoot.position.clone(), to: catV.clone(), into: false };
      }
      if (phase === 'hop_in_vault') C.jump = { t: 0, from: catRoot.position.clone(), to: null, into: true };
      C.lastPhase = phase;
    }
    if (C.jump && seat) {
      const j = C.jump; j.t += dt; const k = Math.min(1, j.t / 0.8), e = k * k * (3 - 2 * k);
      const to = j.into ? carToWorld(CATSEAT[0], seat[1] + CATSEAT[1], seat[2] + CATSEAT[2], tmpV) : j.to;
      catRoot.position.lerpVectors(j.from, to, e); catRoot.position.y += Math.sin(k * Math.PI) * 0.55;
      const dx = to.x - j.from.x, dz = to.z - j.from.z; if (Math.hypot(dx, dz) > 0.05) { C.yaw = Math.atan2(-dx, -dz); }
      if (j.into) { carE.set(PLAYER.pitch || 0, PLAYER.yaw, PLAYER.roll || 0, 'YXZ'); carQ.setFromEuler(carE); catRoot.quaternion.copy(carQ); } else catRoot.quaternion.setFromEuler(carE.set(0, C.yaw, 0, 'YXZ'));
      catAnim(dt, true, 5); catRoot.visible = true;
      if (k >= 1) { if (!j.into) { C.x = to.x; C.z = to.z; C.y = to.y - STAND; C.yaw = heroYaw(); C.moving = false; } C.jump = null; }   // 내려서면 주인과 같은 쪽을 보고 선다
      return;
    }
    if (!S.onFoot && seat && (S.mode === 'ride' || (S.mode === 'hop_in' && S.hp !== 'walk'))) {
      // 고양이는 주인공과 여자친구 사이 가운데 자리에 앉는다 (사장님 2026-09-10, 예전엔 무릎 위)
      carToWorld(CATSEAT[0], seat[1] + CATSEAT[1], seat[2] + CATSEAT[2], tmpV);
      carE.set(PLAYER.pitch || 0, PLAYER.yaw, PLAYER.roll || 0, 'YXZ'); carQ.setFromEuler(carE);
      catRoot.position.copy(tmpV); catRoot.quaternion.copy(carQ); C.x = tmpV.x; C.z = tmpV.z; C.y = gnd(C.x, C.z); C.yaw = PLAYER.yaw; catAnim(dt, false, 0); return;
    }
    const hx = root.position.x, hz = root.position.z, fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw), rx = Math.cos(S.yaw), rz = -Math.sin(S.yaw);
    const tx = hx - fx * 0.45 + rx * 0.62, tz = hz - fz * 0.45 + rz * 0.62;   // 주인공 오른쪽 바로 뒤(사장님 2026-09-09 "더 가까이")
    const dx = tx - C.x, dz = tz - C.z, d = Math.hypot(dx, dz); let moving = false;
    const dh = Math.hypot(hx - C.x, hz - C.z);   // 주인공까지 거리
    if (d > 25) { C.x = tx; C.z = tz; }
    // 잔걸음은 안 뗀다 — 1.15m 는 벌어져야 종종걸음으로 따라붙는다. 조금씩 자리를 맞추면 옆으로 미끄러져
    // 걷는 그림과 어긋나 '백스텝'처럼 보인다(사장님 2026-09-10).
    // 이미 주인공 곁(1.2m 안)이면 설 자리가 차에 물려 있어도 더 쫓아가지 않는다.
    // 안 그러면 차를 빙 돌아 주인공을 등지고 걸어간다(사장님 2026-09-10 "반대로 걸어").
    else if (d > (C.moving ? 0.55 : 1.15) && dh > 1.0) {
      // 몸이 향할 쪽: 멀리서 쫓아올 땐 '가는 쪽', 가까이 붙으면 '주인과 같은 쪽'으로 섞는다.
      // 늘 가는 쪽만 보게 하면 옆자리로 파고드는 동안 주인과 딴 데를 보고 걷는다 (사장님 2026-09-10)
      const mv = Math.atan2(-dx, -dz);
      const k = Math.max(0, Math.min(1, (d - 1.1) / 1.4));         // 1.1m 이하면 0(주인 쪽), 2.5m 넘으면 1(가는 쪽)
      const hy = heroYaw();
      const vx = -Math.sin(mv) * k - Math.sin(hy) * (1 - k), vz = -Math.cos(mv) * k - Math.cos(hy) * (1 - k);
      const ty = (vx * vx + vz * vz) < 1e-6 ? mv : Math.atan2(-vx, -vz);
      if (!C.moving) C.yaw = ty;                                   // 섰다 다시 걸을 땐 먼저 그쪽을 보고 뗀다
      // 몸은 아주 빠르게 그쪽으로 돌리고(dt*20), 가는 건 목표를 향해 곧장 간다.
      // 몸이 향한 쪽으로만 가게 하면 호를 그리며 빙 돌아 '반대로 걷는' 것처럼 보인다 (사장님 2026-09-10)
      let da = ty - C.yaw; da = Math.atan2(Math.sin(da), Math.cos(da));
      C.yaw += da * Math.min(1, dt * 20);
      const sp = Math.min(7.5, Math.max(1.8, d * 2.6)), step = Math.min(d, sp * dt);
      C.x += dx / d * step; C.z += dz / d * step;
      moving = true; C.spd = sp;
    }
    // 멈춰 서면 주인공과 같은 쪽을 본다. 걷다 멈춘 방향 그대로 두면 주인을 등지고 서 있다
    // (사장님 2026-09-10 녹화 화면). 천천히 돌아야 자연스럽다
    if (!moving) { let da = heroYaw() - C.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); C.yaw += da * Math.min(1, dt * 2.6); }
    pushOutCar(C, 0.3); pushOutTraffic(C, 0.3);
    C.y += (foot(C.x, C.z, 0.15) - C.y) * Math.min(1, dt * 10);
    catRoot.position.set(C.x, C.y + STAND, C.z); catRoot.quaternion.setFromEuler(carE.set(0, C.yaw, 0, 'YXZ'));
    C.moving = moving;
    catAnim(dt, moving, moving ? C.spd : 0);
  }
  // 걷기 애니: 걷는 속도에 맞춰 돌리고, 서면 걷기를 멈춘다.
  // 멈춘 자세 그대로 두면 박제처럼 굳어 보여서(사장님 2026-09-10), 숨쉬기·꼬리 흔들기·두리번을 손으로 얹는다.
  // 고양이 GLB 에는 클립이 걷기 하나뿐이라 클립을 바꿔 끼울 수가 없다.
  function catAnim(dt, moving, spd) {
    if (!CAT.act || !CAT.g) return;
    if (moving) {
      CAT.act.paused = false; CAT.act.timeScale = Math.max(0.7, Math.min(2.6, spd / 2.2)); CAT.mixer.update(dt);
      CAT.idle = 0;
      CAT.g.rotation.set(0, CAT.flip, 0); CAT.g.scale.y = CAT.g.scale.x; CAT.g.position.y = 0;
      return;
    }
    if (!CAT.act.paused) { CAT.mixer.setTime(CAT.idleT); CAT.act.paused = true; }
    CAT.idle = (CAT.idle || 0) + dt;
    const t = CAT.idle;
    const br = Math.sin(t * 1.9);                                   // 숨 (배가 오르내림)
    CAT.g.scale.y = CAT.g.scale.x * (1 + br * 0.022);
    CAT.g.position.y = br * 0.008;
    CAT.g.rotation.z = Math.sin(t * 1.25) * 0.035;                  // 몸이 좌우로 살짝
    // 두리번: 가끔 한쪽을 오래 보다 반대로 돌린다
    CAT.g.rotation.y = CAT.flip + Math.sin(t * 0.33) * 0.12 + Math.sin(t * 0.11) * 0.06;   // 두리번은 ±10도까지만
    CAT.g.rotation.x = Math.sin(t * 0.9) * 0.012;
  }

  // 차 기준 좌표 → 세계 좌표
  function carToWorld(lx, ly, lz, out) {
    carE.set(PLAYER.pitch || 0, PLAYER.yaw, PLAYER.roll || 0, 'YXZ'); carQ.setFromEuler(carE);
    return out.set(lx, ly, lz).applyQuaternion(carQ).add(posV.set(PLAYER.x, PLAYER.y, PLAYER.z));
  }

  // ---------- 자세 ----------
  function tailSway(ph, amp) { R.tail[0].rotation.set(.8, Math.sin(ph) * amp * .4, 0); R.tail[1].rotation.set(.5 + Math.sin(ph * 1.1) * .15, Math.sin(ph + .8) * amp * .5, 0); R.tail[2].rotation.set(.35, Math.sin(ph + 1.6) * amp * .6, 0); R.tail[3].rotation.set(.25, Math.sin(ph + 2.4) * amp * .7, 0); }
  function ears(alert, twitch) { R.earL.rotation.set(alert ? -.35 : (twitch || 0), 0, .35); R.earR.rotation.set(alert ? -.35 : 0, 0, -.35 - (twitch || 0)); }
  // 운전: 엉덩이 붙이고 다리는 앞으로, 두 손은 운전대. 핸들 따라 팔이 오르내리고 몸이 기울고 고개를 돌린다
  function poseDrive(dt, steer, sp) {
    const t = S.t;
    R.body.rotation.set(-.08 + Math.sin(t * 2.2) * .015 * sp, 0, steer * .12); R.body.position.set(0, 0, 0);
    R.legL.rotation.set(-1.45, 0, .18); R.legR.rotation.set(-1.45, 0, -.18);
    R.armL.rotation.set(-1.25 + steer * .45, 0, .35); R.armR.rotation.set(-1.25 - steer * .45, 0, -.35);
    R.head.rotation.set(-.05, -steer * .5 + S.look * .3, -steer * .08);
    ears(sp > .3); tailSway(t * 3, .5);
  }
  // 걷기·달리기: 팔다리 엇갈려 흔들고 몸이 통통 튄다
  function poseWalk(dt, run) {
    const t = S.t, f = t * (run ? 15 : 10), a = run ? .95 : .7;
    R.body.rotation.set(run ? .18 : .06, Math.sin(f) * .05, 0); R.body.position.set(0, Math.abs(Math.sin(f)) * (run ? .045 : .03), 0);
    R.legL.rotation.set(Math.sin(f) * a, 0, .05); R.legR.rotation.set(-Math.sin(f) * a, 0, -.05);
    R.armL.rotation.set(-Math.sin(f) * a * .8, 0, .25); R.armR.rotation.set(Math.sin(f) * a * .8, 0, -.25);
    R.head.rotation.set(-.05 + Math.sin(f * 2) * .03, S.look * .5, 0); ears(run); tailSway(t * (run ? 7 : 5), .5);
  }
  // 서 있기: 숨 쉬고 두리번거리고 꼬리 살랑
  function poseIdle() {
    const t = S.t;
    R.body.rotation.set(Math.sin(t * 1.6) * .015, 0, 0); R.body.position.set(0, Math.sin(t * 1.6) * .006, 0);
    R.legL.rotation.set(0, 0, .05); R.legR.rotation.set(0, 0, -.05);
    R.armL.rotation.set(Math.sin(t * 1.2) * .05, 0, .3); R.armR.rotation.set(Math.sin(t * 1.2 + 1) * .05, 0, -.3);
    R.head.rotation.set(Math.sin(t * .9) * .05, S.look, Math.sin(t * .6) * .04);
    ears(false, Math.sin(t * 7) > .95 ? .3 : 0); tailSway(t * 2.5, .7);
  }
  // 점프·뛰어내리기·뛰어오르기: 팔 번쩍, 다리 오므리기
  function poseJump(k) {
    R.body.rotation.set(-.15 + k * .1, 0, 0); R.body.position.set(0, 0, 0);
    R.legL.rotation.set(-.7, 0, .1); R.legR.rotation.set(-.4, 0, -.1);
    R.armL.rotation.set(-2.4, 0, .5); R.armR.rotation.set(-2.4, 0, -.5);
    R.head.rotation.set(-.15, 0, 0); ears(true); tailSway(S.t * 4, .3);
  }

  // ── 복덕방 할아버지 ──
  // 급매를 놓치면 그 매물 앞에 서 있다가, 뒤늦게 도착한 주인공에게 웃으며 한마디 한다 (사장님 2026-09-10)
  const OLD_SAY = [
    '허허, 젊은 양반. 조금 늦었구먼.',
    '허허허, 기다리다 목 빠지는 줄 알았네. 근디 벌써 다른 사람이 왔다 갔어.',
    '아이고, 총각이 좀만 일찍 왔으면 좋았을 텐디.',
    '허허, 좋은 물건은 원래 주인이 빨리 나타나는 법이여.',
    '왔구먼! 근디 미안허네. 방금 계약했어.',
    '허허허, 뛰어왔구먼. 근디 이미 늦었어.',
    '아이고, 내가 전화하려고 했는디… 다른 양반이 먼저 돈을 내놨네.',
    '허허, 이 땅이 그렇게 탐났어? 자네보다 먼저 온 사람이 있더라고.',
    '쯧쯧, 급매라고 소문이 나니까 사람들이 아주 날아다니는구먼.',
    '허허허, 다음엔 조금 일찍 움직이게. 좋은 땅은 기다려주질 않아.',
  ];
  const OLDM = { g: null, root: null, mixer: null, act: null, said: false, t: 0, on: false, seen: [] };
  function brokerLoad(then) {
    if (OLDM.root) { then && then(); return; }
    OLDM.root = new THREE.Group(); OLDM.root.visible = false; scene.add(OLDM.root);
    GLB.load('assets/models/elder.glb?v=1', {}).then(function (g) {
      OLDM.mixer = g.userData.mixer;
      const clips = g.userData.clips || [];
      const idle = clips.find(function (c) { return /idle/i.test(c.name); }) || clips[0];
      if (OLDM.mixer && idle) { OLDM.act = OLDM.mixer.clipAction(idle); OLDM.act.play(); }
      OLDM.g = fitModel(g, 1.66, true, false); OLDM.root.add(OLDM.g);
      then && then();
    }).catch(function (e) { console.warn('복덕방 GLB 실패', e); });
  }
  // 매물 앞에 세운다 — 길 쪽을 보게
  function brokerAt(x, z) {
    brokerLoad(function () {
      if (!OLDM.root) return;
      const y = foot(x, z, 0.3);
      OLDM.root.position.set(x, y, z);
      let yaw = 0;
      if (window.ROADS) { const n = ROADS.nearest(x, z); if (n && n.e) yaw = Math.atan2(-(n.e.a.x - x), -(n.e.a.z - z)); }
      OLDM.root.quaternion.setFromEuler(carE.set(0, yaw, 0, 'YXZ'));
      OLDM.root.visible = true; OLDM.on = true; OLDM.said = false; OLDM.t = 0;
    });
  }
  function brokerTick(dt) {
    if (!OLDM.on || !OLDM.root || !OLDM.root.visible) return;
    if (OLDM.mixer) OLDM.mixer.update(dt);
    OLDM.t += dt;
    const hp = S.onFoot ? S : PLAYER;
    const d = Math.hypot(hp.x - OLDM.root.position.x, hp.z - OLDM.root.position.z);
    // 앞까지 갔을 때 말한다. 예전엔 16m 밖에서 지나가기만 해도 말이 끝나 버려,
    // 정작 도착하면 들을 것도 없이 사라졌다 (사장님 2026-09-10)
    if (!OLDM.said && d < 9) {
      let pool = OLD_SAY.filter(function (l) { return OLDM.seen.indexOf(l) < 0; });
      if (!pool.length) { OLDM.seen.length = 0; pool = OLD_SAY; }
      const line = pool[Math.floor(Math.random() * pool.length)];
      if (sayBox('복덕방', line, 5.2, true)) {          // 전화 중이면 못 한다 — 다음 프레임에 다시
        OLDM.said = true; OLDM.seen.push(line); OLDM.t = 0;
        setTimeout(function () { const n = (window.ESTATE && ESTATE.list) ? ESTATE.list.filter(function (q) { return q.rival; }).length : 9; gfSay(n <= 1 ? 'miss1' : 'miss'); }, 5600);   // 할아버지 말이 끝나면 여자친구가 받는다
      }
    }
    // 여자친구가 받는 말(5.6초 뒤 4.6초)까지 다 끝나고도 남게 16초. 아무도 안 오면 4분 뒤 자리를 뜬다
    if ((OLDM.said && OLDM.t > 16) || (!OLDM.said && OLDM.t > 240)) { OLDM.root.visible = false; OLDM.on = false; }
  }

  // ── 여자친구 대사 ──
  // 사장님이 준 20줄(2026-09-10). 총자산이 커질수록 태도가 바뀐다:
  // 처음엔 "서울 가자" → 땅값 오르는 걸 보고 흥미 → 끝에는 "여기서 계속 살고 싶어".
  // w: 이 대사가 나올 총자산 구간(만원). k: 언제 — idle(가끔) / buy(땅 살 때) / rise(값이 오를 때) / rent(월세)
  const EOK = 10000;   // 1억 = 10,000만
  const GF_SAY = [
    { k: 'idle', w: [0, 150 * EOK], s: '오빠, 제주도 진짜 재미없다. 우리 서울 가자.' },
    { k: 'buy',  w: [0, 150 * EOK], s: '여기 또 땅 보러 온 거야? 난 카페나 가고 싶은데.' },
    { k: 'idle', w: [0, 150 * EOK], s: '100억이나 있는데 왜 맨날 이런 데를 돌아다녀?' },
    { k: 'buy',  w: [0, 150 * EOK], s: '오빠, 이 땅 사면 돈 번다고? 난 하나도 모르겠어.' },
    { k: 'idle', w: [0, 150 * EOK], s: '서울 가면 이런 데 안 돌아다녀도 되잖아.' },
    { k: 'idle', w: [0, 150 * EOK], s: '오빠, 이번엔 제발 좋은 데 좀 가자. 맨날 땅, 땅, 땅이야.' },
    { k: 'rise', w: [0, 300 * EOK], s: '어? 이 땅 벌써 올랐어? 제주도 땅이 이렇게 빨리 오르나?' },
    { k: 'idle', w: [0, 300 * EOK], s: '그래도 난 제주도보다 서울이 좋아. 사람도 많고 할 것도 많잖아.' },
    { k: 'idle', w: [300 * EOK, 500 * EOK], s: '오빠, 우리 돈 300억 됐는데 아직도 제주도 돌아다니고 있어?' },
    { k: 'idle', w: [300 * EOK, 500 * EOK], s: '그럼 이제 서울 가서 건물 하나 사면 안 돼?' },
    { k: 'idle', w: [700 * EOK, 1e12], s: '미국은 어때? 오빠 돈이면 미국에도 집 살 수 있잖아.' },
    { k: 'rise', w: [150 * EOK, 700 * EOK], s: '잠깐, 오빠. 방금 산 땅 가격 또 올랐어?' },
    { k: 'rent', w: [150 * EOK, 500 * EOK], s: '나 제주도 별로라고 했는데… 생각보다 돈 벌기 좋은 곳이네?' },
    { k: 'idle', w: [500 * EOK, 700 * EOK], s: '500억이면 서울 가도 되겠다. 이제 제주도 졸업하자.' },
    { k: 'rent', w: [300 * EOK, 1e12], s: '근데 우리 산 땅들 다 합치면 엄청난 거 아니야?' },
    { k: 'idle', w: [500 * EOK, 1e12], s: '오빠, 이제 제주도 여기저기 우리가 산 땅만 찾아다니는 것 같아.' },
    { k: 'idle', w: [700 * EOK, 1e12], s: '700억이면… 미국 가서 살 수도 있겠다.' },
    { k: 'idle', w: [700 * EOK, 1e12], s: '근데 미국은 잠깐 갔다 오자. 제주도에 우리 땅이 이렇게 많은데.' },
    { k: 'idle', w: [1000 * EOK, 1e12], s: '오빠, 우리 진짜 1,000억 됐어? 나 이제 제주도 안 심심해.' },
    { k: 'idle', w: [1000 * EOK, 1e12], s: '이상하다. 처음엔 제주도 떠나자고 했는데… 이제는 여기서 계속 살고 싶어.' },
    // 급매를 놓쳐 탐라국개발이 가로챘을 때 (사장님 2026-09-10)
    // 처음 놓쳤을 때는 "또"·"매날" 이 안 맞는다 (사장님 2026-09-11)
    { k: 'miss1', w: [0, 1e12], s: '어? 방금 그거 우리가 사려던 거 아니야?' },
    { k: 'miss1', w: [0, 1e12], s: '저 사람 누구야? 우리보다 먼저 와 있었네.' },
    { k: 'miss1', w: [0, 1e12], s: '아깝다… 조금만 빨리 왔으면 됐는데.' },
    { k: 'miss1', w: [0, 1e12], s: '탐라국개발? 처음 듣는 이름인데 발이 빠르네.' },
    { k: 'miss', w: [0, 1e12], s: '아, 저 인간 또 가로챘어! 오빠가 조금만 빨랐으면 샀잖아!' },
    { k: 'miss', w: [0, 1e12], s: '헐, 방금 그 가격에 샀어? 저건 완전 도둑질인데?' },
    { k: 'miss', w: [0, 1e12], s: '아 진짜! 좋은 물건만 나오면 저 사람이 먼저 채가네.' },
    { k: 'miss', w: [0, 1e12], s: '오빠, 저 사람 우리 따라다니는 거 아니야? 어떻게 맨날 먼저 사?' },
    { k: 'miss', w: [0, 1e12], s: '됐어. 다음엔 우리가 먼저 사자. 나 이제 저 인간한테 지는 거 싫어.' },
    // 나이트클럽을 지었을 때 (사장님 2026-09-10)
    { k: 'club', w: [0, 1e12], s: '오빠, 우리가 산 땅에 나이트클럽을 지었는데… 이제 제주도 밤문화도 우리가 만드는 거야?' },
  ];
  const GF_SEEN = [];              // 최근에 한 말은 다시 안 한다
  let gfSayT = 0, gfIdleT = 60;
  // 대사 창 하나로 여친·복덕방이 같이 쓴다. 크기·자리는 유학 친구 전화와 같다 (사장님 2026-09-10)
  function sayBox(who, text, sec, old) {
    const box = document.getElementById('gfsay'), w = document.getElementById('gfWho'), m = document.getElementById('gfMsg');
    if (!box || !w || !m) return false;
    if (document.getElementById('call').classList.contains('show')) return false;   // 전화 중엔 가만히
    w.textContent = who; w.className = 'who' + (old ? ' old' : ''); m.textContent = text;
    box.classList.add('show'); gfSayT = sec;
    return true;
  }
  function gfSay(kind) {
    if (!GF.g) return false;
    const nw = (window.ESTATE && ESTATE.netWorth) ? ESTATE.netWorth() : 0;
    let pool = GF_SAY.filter(function (l) { return l.k === kind && nw >= l.w[0] && nw < l.w[1] && GF_SEEN.indexOf(l.s) < 0; });
    if (!pool.length) pool = GF_SAY.filter(function (l) { return l.k === kind && nw >= l.w[0] && nw < l.w[1]; });
    if (!pool.length) return false;
    const line = pool[Math.floor(Math.random() * pool.length)];
    if (!sayBox('여친', line.s, 4.6, false)) return false;
    GF_SEEN.push(line.s); if (GF_SEEN.length > 6) GF_SEEN.shift();
    return true;   // 말을 했다 — 한 번만 하는 대사는 이걸 보고 표시한다
  }
  function gfSayTick(dt) {
    const box = document.getElementById('gfsay'); if (!box) return;
    if (gfSayT > 0) { gfSayT -= dt; if (gfSayT <= 0) box.classList.remove('show'); return; }
    gfIdleT -= dt;
    if (gfIdleT <= 0) { gfIdleT = 90 + Math.random() * 80; gfSay('idle'); }
  }

  // ── 여자친구 (동행) ──
  // 차에서 내리면 왼쪽 뒤를 따라 걷는다. 차를 타면 안 보인다(앉는 동작이 아직 없다).
  // 고양이와 같은 규칙: 갈 때는 가는 쪽을, 곁에 서면 주인공이 보는 쪽을 본다 (사장님 2026-09-10)
  // flip: fitModel 이 붙여 준 기본 yaw(180도). 이 GLB 도 고양이처럼 앞이 +Z 라 뒤집어 붙는다.
  // 숨쉬기·두리번을 얹을 때 rotation 을 0 으로 밀면 이 180도가 지워져 뒤통수만 보인다(사장님 2026-09-10)
  // 믹사모 Sitting 클립(3.17초)은 앉은 뒤 0.1~2.6초에 팔을 크게 저으며 피하는 동작이 들어 있다.
  // 그 대목은 안 쓰고 가만히 앉은 자세(클립 끝)에서 멈춰 둔다 (사장님 2026-09-10)
  const T_SIT = 3.12;
  // 이 GLB 의 walk 은 믹사모 "걷기 시작(Start Walking)" 이라 처음↔끝 자세가 56도 어긋나 고리로 못 돈다.
  // 안에서 제대로 도는 한 걸음 주기(0.80~2.20초, 어긋남 14도)만 잘라 쓴다 (사장님 2026-09-10 "뚝뚝 끊겨")
  const W_CUT = [24, 67, 30];        // 시작 프레임, 끝 프레임, 초당 프레임
  const FADE = 0.22;                 // 걷기 <-> 서 있기 겹쳐 넘기는 시간(초)
  // 잘라 쓴 걷기 클립이 **실제로 그리는 속도**(m/s). 발이 땅에 붙어 뒤로 밀리는 빠르기를 잰 값.
  // 주인공 걷기는 1.99, 달리기는 5.54 — 여친 것은 여기서 잘라 쓴 한 걸음이라 훨씬 느리다.
  // 이걸 1.6 으로 잡고 timeScale 을 1.8 로 묶어 둔 탓에, 다리는 2.2m/s 를 그리는데 몸은 6.4m/s 로
  // 흘러가 **미끄러지듯 걷는 것처럼** 보였다 (사장님 2026-09-11 "여친 이상하게 걷는데")
  const W_MPS = 1.6;                 // 주인공 걷기 클립 기준(주인공이 쓰는 값과 같다). 여친도 이 클립을 빌려 쓴다
  const R_MPS = 5.88;                // 주인공 달리기 클립을 여친 뼈대에 옮겨 붙였을 때 실제로 그리는 속도
  const GF = { g: null, mixer: null, act: null, h: 1.66, flip: Math.PI, x: 0, z: 0, y: 0, yaw: 0, spd: 2, moving: false, idle: 0, on: false };
  // 걷기 클립에서 고리로 돌렸을 때 제일 덜 튀는 구간을 찾는다.
  // 뉴버그 트랙(믹사모는 한 프레임씩 굽혀 있다)을 프레임끼리 비교해, 한 걸음 주기(25~48프레임) 안에서 차이가 제일 작은 쌍을 고른다.
  function bestLoop(clip, fps) {
    if (!clip || !clip.tracks) return null;
    const qt = clip.tracks.filter(function (t) { return /\.quaternion$/.test(t.name); });
    if (!qt.length) return null;
    const n = Math.floor(clip.duration * fps);
    if (n < 30) return null;
    // 트랙마다 잡힌 수가 다를 수 있으니 그 트랙 자체 개수로 자리를 잡는다
    const diff = function (i, j) {
      let sum = 0, used = 0;
      for (const t of qt) {
        const v = t.values, k = Math.floor(v.length / 4);
        if (k < 10) continue;
        const ai = Math.round(i / n * (k - 1)) * 4, bi = Math.round(j / n * (k - 1)) * 4;
        const d = v[ai] * v[bi] + v[ai + 1] * v[bi + 1] + v[ai + 2] * v[bi + 2] + v[ai + 3] * v[bi + 3];
        sum += 1 - Math.abs(d); used++;   // 0 이면 똑같은 자세
      }
      return used ? sum / used : 1e9;
    };
    let best = null;
    for (let i = 0; i + 25 < n; i++) for (let len = 25; len <= 48 && i + len < n; len++) {
      const d = diff(i, i + len);
      if (!best || d < best.d) best = { a: i, b: i + len, d: d };
    }
    if (best) console.log('gf 걷기 고리', best.a + '~' + best.b, '어긋남', best.d.toFixed(4));
    return best;
  }
  let gfRoot = null;
  function gfLoad() {
    if (!scene) return;
    gfRoot = new THREE.Group(); gfRoot.visible = false; scene.add(gfRoot);
    GLB.load('assets/models/gf.glb?v=3', {}).then(function (g) {
      GF.mixer = g.userData.mixer;
      const clips = g.userData.clips || [];
      const walkRaw = clips.find(function (c) { return /walk/i.test(c.name); }) || clips[0];
      // 이 클립은 믹사모 '걷기 시작'이라 처음↔끝 자세가 어긋나 고리로 돌리면 뚝뚝 끊긴다.
      // 손으로 잡은 구간(24~67) 대신, **가장 잘 이어지는 구간을 찾아** 쓴다 (사장님 2026-09-11)
      const cut = bestLoop(walkRaw, W_CUT[2]) || { a: W_CUT[0], b: W_CUT[1] };
      const walk = (THREE.AnimationUtils && THREE.AnimationUtils.subclip)
        ? THREE.AnimationUtils.subclip(walkRaw, 'gfwalk', cut.a, cut.b, W_CUT[2]) : walkRaw;
      const sit = clips.find(function (c) { return /^sit/i.test(c.name); });
      const idle = clips.find(function (c) { return /^idle/i.test(c.name); });
      if (GF.mixer && walk) { GF.act = GF.mixer.clipAction(walk); GF.per = walk.duration; }
      if (GF.mixer && idle) GF.idleAct = GF.mixer.clipAction(idle);
      // 서 있기로 시작한다
      if (GF.idleAct) { GF.idleAct.play(); GF.anim = 'idle'; }
      else if (GF.act) { GF.act.play(); GF.mixer.setTime(0.9); GF.act.paused = true; GF.anim = 'walk'; }
      if (GF.mixer && sit) GF.sitAct = GF.mixer.clipAction(sit);
      GF.g = fitModel(g, GF.h, true, false); gfRoot.add(GF.g);
      // 엉덩이 뼈를 좌석에 맞추는 데 쓰는 잣대 — 재는 건 실제로 앉힌 뒤로 미룬다(gfUpdate).
      // 서 있는 자세로 미리 재면 엉덩이가 20cm 띄어 주인공보다 솟아오른다 (사장님 2026-09-10)
      GF.hips = g.getObjectByName('mixamorigHips') || g.getObjectByName('Hips');
      GF.x = S.x; GF.z = S.z; GF.yaw = S.yaw;
    }).catch(function (e) { console.warn('여자친구 GLB 실패', e); });
  }
  // 주인공 걷기·달리기 클립을 여친 뼈대로 옮겨 붙인다. 둘 다 믹사모 뼈라 46개가 이름까지 같아 그대로 물린다.
  //
  // 여친 제 걷기 클립은 "걷기 시작"에서 한 걸음만 잘라 쓴 거라 **보폭이 0.54m** 밖에 안 된다(주인공 0.80m).
  // 그 걸음으로 3m/s 를 따라가려니 배속을 아무리 올려도 발이 땅에서 1.1m/s 씩 미끄러졌다.
  // 배속만 만지는 걸로는 못 고친다 — 보폭이 모자라기 때문이다 (사장님 2026-09-11 "여친 계속 이상하게 걷는데").
  // 주인공 걸음을 그대로 빌려 쓰면 보폭·팔 흔들림까지 주인공과 똑같아진다.
  //
  // **엉덩이 위치 트랙만 단위가 다르다**(주인공 클립 cm · 여친 클립 m) — 그냥 붙이면 4m 공중에 뜬다.
  // 두 클립의 엉덩이 높이 평균끼리 견주어 배율을 잡으면 발바닥이 2cm 안에서 맞는다.
  function gfBorrow(name) {
    GF.lent = GF.lent || {};
    if (GF.lent[name]) return GF.lent[name];
    const src = HERO.acts && HERO.acts[name] && HERO.acts[name].getClip(), ref = GF.act && GF.act.getClip();
    if (!src || !ref || !GF.mixer || !GF.g) return null;        // 주인공 클립이 아직이면 다음 프레임에 다시
    const clip = src.clone();                                   // 원본을 건드리면 주인공 걸음이 깨진다
    const st = clip.tracks.find(t => /Hips\.position$/.test(t.name)), rt = ref.tracks.find(t => /Hips\.position$/.test(t.name));
    if (st && rt) {
      const mean = (v, o) => { let s = 0; const n = v.length / 3; for (let i = 0; i < n; i++) s += v[i * 3 + o]; return n ? s / n : 0; };
      const k = mean(rt.values, 1) / (mean(st.values, 1) || 1), v = st.values;
      const from = [mean(v, 0), mean(v, 1), mean(v, 2)], to = [mean(rt.values, 0), mean(rt.values, 1), mean(rt.values, 2)];
      for (let i = 0; i < v.length / 3; i++) for (let o = 0; o < 3; o++) v[i * 3 + o] = (v[i * 3 + o] - from[o]) * k + to[o];
    }
    return (GF.lent[name] = GF.mixer.clipAction(clip, GF.g));
  }
  // 걷기 애니 — 서 있기(idle) <-> 걷기(walk) <-> 달리기(run) 를 겹쳐 넘긴다. 속도에 맞춰 빠르기도 바꾼다.
  // 예전엔 서 있기 클립이 없어 걷기 한 프레임을 얼려 뒀고, 껐다 켰다 할 때마다 뚝뚝 끊겼다 (사장님 2026-09-10)
  function gfStep(dt, sp) {
    if (!GF.mixer) return;
    const walkA = gfBorrow('walk') || GF.act, runA = gfBorrow('run');
    if (walkA !== GF.act && GF.act && !GF.ownOff) { GF.act.stop(); GF.ownOff = true; }   // 빌린 걸음을 쓰기 시작하면 제 것은 한 번만 내린다
    let want = sp > (GF.anim === 'idle' || !GF.anim ? 0.35 : 0.12) ? 'walk' : 'idle';   // 바뀌는 선을 둘로 나눠 깜빡임을 없앤다
    if (runA && sp > (GF.anim === 'run' ? 3.2 : 3.8)) want = 'run';
    const pick = a => a === 'run' ? runA : a === 'walk' ? walkA : (GF.idleAct || walkA);
    const nx = pick(want);
    if (GF.anim !== want && nx) {
      const prev = pick(GF.anim);
      if (prev && prev !== nx) prev.fadeOut(FADE);
      nx.paused = false; nx.reset().fadeIn(FADE).play();
      GF.anim = want;
    }
    // 발이 미끄러지지 않게 **그 클립이 실제로 그리는 속도**로 나눈다
    if (walkA) walkA.timeScale = Math.max(0.85, Math.min(2.6, (sp || W_MPS) / W_MPS));
    if (runA) runA.timeScale = Math.max(0.7, Math.min(1.6, (sp || R_MPS) / R_MPS));
    GF.mixer.update(dt);
  }
  function gfUpdate(dt) {
    if (!GF.g || !gfRoot) return;
    if (!S.onFoot) {                                   // 차에 타면 조수석에 앉는다
      const seat = SEAT[PLAYER.veh];
      if (!seat || !GF.sitAct) { gfRoot.visible = false; GF.on = false; return; }
      gfRoot.visible = true; GF.on = false;
      if (GF.cur !== 'sit') { GF.cur = 'sit'; GF.mixer.stopAllAction(); GF.sitAct.reset().play(); GF.mixer.setTime(T_SIT); GF.sitAct.paused = true; GF.hipSit = null; GF.sitT = 0; }
      GF.g.rotation.set(0, GF.flip, 0); GF.g.scale.y = GF.g.scale.x; GF.g.position.y = 0;
      // 엉덩이 뼈를 좌석에 맞춘다 — 앉은 자세가 잡힌 뒤에 재야 맞는다
      if (!GF.hipSit && GF.hips) { gfRoot.position.set(0, 0, 0); gfRoot.quaternion.identity(); gfRoot.scale.setScalar(1); GF.hipSit = GF.hips.getWorldPosition(new THREE.Vector3()); }
      carToWorld(-seat[0], seat[1], seat[2], tmpV);     // 운전석 반대쪽
      const sc = seat[3] || 1;
      if (GF.hipSit) { hipV.copy(GF.hipSit).multiplyScalar(sc).applyQuaternion(carQ); gfRoot.position.copy(tmpV).sub(hipV); }
      else gfRoot.position.copy(tmpV);
      gfRoot.quaternion.copy(carQ);
      gfRoot.scale.setScalar(sc);
      // 박제처럼 굳지 않게 숨쉬기만 살짝 (고양이·서 있을 때와 같은 결)
      GF.sitT = (GF.sitT || 0) + dt; const brs = Math.sin(GF.sitT * 1.5);
      GF.g.scale.y = GF.g.scale.x * (1 + brs * 0.010); GF.g.rotation.x = brs * 0.012;
      return;
    }
    if (GF.cur === 'sit') { GF.cur = 'walk'; GF.mixer.stopAllAction(); GF.anim = null; gfRoot.scale.setScalar(1); gfStep(0, 0); }
    const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw), rx = Math.cos(S.yaw), rz = -Math.sin(S.yaw);
    // 좌표가 한 번 깨지면 영영 안 돌아온다 — 깨졌으면 다시 세운다 (사장님 2026-09-11 "여친 사라졌따")
    if (!isFinite(GF.x) || !isFinite(GF.z) || !isFinite(GF.y)) GF.on = false;
    if (!GF.on) {                                        // 내리는 순간 옆에 세운다
      GF.on = true; GF.x = S.x - fx * 0.5 - rx * 0.85; GF.z = S.z - fz * 0.5 - rz * 0.85;
      GF.yaw = heroYaw(); GF.moving = false; GF.y = foot(GF.x, GF.z, 0.25); GF.spd = 0;   // 세운 자리가 곧 목표 자리라 거리가 0 이다. 묵은 속도를 안 지우면 0 으로 나눈다
    }
    gfRoot.visible = true;
    const tx = S.x - fx * 0.5 - rx * 0.85, tz = S.z - fz * 0.5 - rz * 0.85;   // 주인공 왼쪽 뒤(고양이는 오른쪽)
    const dx = tx - GF.x, dz = tz - GF.z, d = Math.hypot(dx, dz);
    const dh = Math.hypot(S.x - GF.x, S.z - GF.z);
    let moving = false;
    if (d > 25) { GF.x = tx; GF.z = tz; }
    // 잔걸음은 안 뗀다 — 0.3m 씩 자리를 맞추려 들면 걷는 그림보다 훨씬 느리게 기어가 발이 미끄러진다.
    // 고양이는 처음부터 이 규칙(1.15m 벌어져야 떼고, 0.55m 안으로 붙으면 선다)이라 멀쩡했다 (사장님 2026-09-11)
    else if (d > (GF.moving ? 0.55 : 1.15) && dh > 1.0) {
      const mv = Math.atan2(-dx, -dz);
      const k = Math.max(0, Math.min(1, (d - 1.1) / 1.4)), hy = heroYaw();
      const vx = -Math.sin(mv) * k - Math.sin(hy) * (1 - k), vz = -Math.cos(mv) * k - Math.cos(hy) * (1 - k);
      const ty = (vx * vx + vz * vz) < 1e-6 ? mv : Math.atan2(-vx, -vz);
      if (!GF.moving) GF.yaw = ty;
      let da = ty - GF.yaw; da = Math.atan2(Math.sin(da), Math.cos(da));
      GF.yaw += da * Math.min(1, dt * 20);
      // 걷기 그림이 그릴 수 있는 만큼만 낸다 — 밑돌면 미끄러지고, 웃돌아도 미끄러진다
      const sp = Math.min(6.4, Math.max(W_MPS * 0.9, d * 2.6)), step = Math.min(d, sp * dt);
      GF.x += dx / d * step; GF.z += dz / d * step;
      moving = true; GF.spd = sp;
    }
    if (!moving) { let da2 = heroYaw() - GF.yaw; da2 = Math.atan2(Math.sin(da2), Math.cos(da2)); GF.yaw += da2 * Math.min(1, dt * 2.6); }
    GF.moving = moving;
    pushOutCar(GF, 0.45); pushOutTraffic(GF, 0.4);
    GF.y += (foot(GF.x, GF.z, 0.25) - GF.y) * Math.min(1, dt * 10);
    gfRoot.position.set(GF.x, GF.y, GF.z);
    gfRoot.quaternion.setFromEuler(carE.set(0, GF.yaw, 0, 'YXZ'));
    if (GF.act) {
      if (moving) {
        gfStep(dt, GF.spd || 2);
        GF.idle = 0; GF.g.rotation.set(0, GF.flip, 0); GF.g.scale.y = GF.g.scale.x; GF.g.position.y = 0;
      } else {
        gfStep(dt, 0);
        GF.idle += dt;
        GF.g.rotation.set(0, GF.flip, 0); GF.g.scale.y = GF.g.scale.x; GF.g.position.y = 0;
      }
    }
  }

  function update(dt, t) { if (!root) return; updateHero(dt, t); catUpdate(dt); gfUpdate(dt); gfSayTick(dt); brokerTick(dt); }
  function updateHero(dt, t) {
    S.t += dt; S.lookT -= dt; if (S.lookT <= 0) { S.lookT = 1.5 + Math.random() * 3; S.lookTgt = (Math.random() - .5) * 1.4; }
    S.look += ((S.lookTgt || 0) - S.look) * Math.min(1, dt * 3);
    const seat = SEAT[PLAYER.veh]; const ground = PLAYER.mode === 'ground';
    if (!seat) { root.visible = false; return; }           // 사람 상자가 있는 탈것·잠수함·패러글라이더는 고양이를 숨긴다(다음에)
    root.visible = true;
    const kmh = PLAYER.kmh || 0, steer = Math.max(-1, Math.min(1, PLAYER.steer || 0)), sp = Math.min(1, kmh / 60);
    const fx = -Math.sin(PLAYER.yaw), fz = -Math.cos(PLAYER.yaw), rx = Math.cos(PLAYER.yaw), rz = -Math.sin(PLAYER.yaw);
    root.scale.setScalar(seat[3]);
    const stand = STAND * seat[3];

    // ---- 상태 전이: 서면 내리고, 달리면 탄다 (걸어 다니는 중엔 자동으로 안 함)
    if (S.onFoot && Math.hypot(PLAYER.x - S.x, PLAYER.z - S.z) > 300) board();   // 리스폰·순간이동이면 그냥 태운다
    // 차를 세워도 저절로 내리지 않는다 — F(내리기)를 눌러야 내린다(사장님, 2026-09-08)
    S.parkT = 0;
    if (!S.onFoot && (S.mode === 'walk' || S.mode === 'sit') && (kmh >= 3 || !ground || Math.hypot(PLAYER.x - S.x, PLAYER.z - S.z) > 12)) { S.mode = 'hop_in'; S.hp = 'walk'; S.hpT = 0; }

    if (S.mode === 'ride' || S.mode === 'hop_in' || S.mode === 'hop_out') {
      carToWorld(seat[0], seat[1], seat[2], tmpV);          // 운전석(세계 좌표)
      carE.set(PLAYER.pitch || 0, PLAYER.yaw, PLAYER.roll || 0, 'YXZ'); carQ.setFromEuler(carE);
      if (S.mode === 'ride') {
        if (HERO.hip) rootForHip(tmpV, HERO.hip.sit, carQ, root.position); else root.position.copy(tmpV);
        root.quaternion.copy(carQ); poseDrive(dt, steer, sp); heroAnim(dt, 'sit', 1, 0);
        root.position.y += Math.sin(S.t * 9) * .004 * sp;    // 달리면 살짝 흔들린다
      } else {
        // 걸어가서 타기 / 내리기 — 믹사모 Entering Car / Exiting Car 클립을 그대로 튼다(사장님, 2026-09-08).
        // 클립 안에서 엉덩이가 움직이므로, 루트는 '클립 끝(타기)/시작(내리기) 엉덩이 = 좌석' 이 되게 두고, 걸어갈 목표는 '클립 시작 엉덩이 자리'
        const H0 = HERO.hip;
        if (!H0 || !HERO.acts.enter) {   // 믹사모 클립이 없으면 그냥 자리만 옮긴다
          if (S.mode === 'hop_in') S.mode = 'ride'; else { carToWorld(-1.35, 0, seat[2], doorV); S.mode = 'sit'; S.x = doorV.x; S.z = doorV.z; S.y = gnd(S.x, S.z); S.yaw = PLAYER.yaw; S.vyaw = S.yaw; }
          return;
        }
        // 오픈카답게 문을 안 열고 뛰어넘어 탄다/내린다(사장님 선택 2, 2026-09-08): 문 옆까지 걸어가 → 제자리 점프 클립(0.93초)을 틀면서 루트를 좌석까지 포물선으로 옮긴다
        if (S.mode === 'hop_in') {
          carToWorld(-1.55, 0, seat[2], doorV); doorV.y = gnd(doorV.x, doorV.z) + stand;   // 문 옆(차 왼쪽 1.55m)
          if (S.hp === 'walk') {
            const dx = doorV.x - S.x, dz = doorV.z - S.z, d = Math.hypot(dx, dz);
            if (d > 0.12) { const step = Math.min(d, 2.2 * dt); S.x += dx / d * step; S.z += dz / d * step; const ty = Math.atan2(-dx, -dz); let da = ty - S.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); S.yaw += da * Math.min(1, dt * 10); S.vyaw = S.yaw; }
            else { S.hp = 'vault'; S.hpT = 0; S.from = new THREE.Vector3(S.x, gnd(S.x, S.z) + stand, S.z); S.fromQ = root.quaternion.clone(); if (HERO.acts.jump) HERO.acts.jump.stop(); }
            S.y = gnd(S.x, S.z);
            root.position.set(S.x, S.y + stand, S.z); root.quaternion.setFromEuler(carE.set(0, S.yaw, 0, 'YXZ'));
            poseWalk(dt, false); heroAnim(dt, d > 0.12 ? 'walk' : 'idle', 1.4, 0);
          } else {
            S.hpT += dt; const k = Math.min(1, S.hpT / 0.95), e = k * k * (3 - 2 * k);
            rootForHip(tmpV, H0.sit, carQ, endV);
            root.position.lerpVectors(S.from, endV, e); root.position.y += Math.sin(k * Math.PI) * 0.45;   // 점프 클립의 뜀 + 문을 넘는 포물선
            root.quaternion.copy(S.fromQ || carQ).slerp(carQ, e);
            poseDrive(dt, 0, 0);
            const done = HERO.acts.jump ? heroOnce(dt, 'jump', 1.0) : true;
            if ((k >= 1 && done) || S.hpT > 2.5) S.mode = 'ride';
          }
        } else {   // hop_out: 좌석에서 문 옆으로 뛰어내린다
          carToWorld(-1.6, 0, seat[2], doorV); doorV.y = gnd(doorV.x, doorV.z) + stand;
          outQ.copy(carQ).multiply(Q_OUT);
          if (S.hp !== 'vault') { S.hp = 'vault'; S.hpT = 0; rootForHip(tmpV, H0.sit, carQ, endV); S.from = endV.clone(); S.fromQ = root.quaternion.clone(); if (HERO.acts.jump) HERO.acts.jump.stop(); }
          S.hpT += dt; const k = Math.min(1, S.hpT / 0.95), e = k * k * (3 - 2 * k);
          root.position.lerpVectors(S.from, doorV, e); root.position.y += Math.sin(k * Math.PI) * 0.45;
          root.quaternion.copy(S.fromQ || carQ).slerp(outQ, e);
          poseDrive(dt, 0, 0);
          const done = HERO.acts.jump ? heroOnce(dt, 'jump', 1.0) : true;
          if ((k >= 1 && done) || S.hpT > 2.5) { S.x = doorV.x; S.z = doorV.z; S.y = doorV.y - stand; S.yaw = PLAYER.yaw + Math.PI / 2; S.vyaw = S.yaw; S.mode = 'sit'; S.wanderT = 2 + Math.random() * 2; heroAnim(dt, 'idle', 1, 0); }
        }
      }
      return;
    }

    // ---- 차 밖: 조종(내려서 걷기) — ↑↓ 앞뒤, ←→ 돌기, Shift 달리기, 스페이스 점프
    if (S.onFoot) {
      const c = S.ctl || {};
      // 카메라 기준 조작: ↑ 카메라가 보는 쪽, ↓ 반대, ←→ 옆. 가려는 쪽으로 몸을 빠르게 돌리며 걷는다(고양이가 목표로 가는 것과 같은 식)
      const a = (c.throttle || 0) - (c.brake || 0), st = c.steer || 0; let want = 0;
      if (Math.abs(a) > 0.05 || Math.abs(st) > 0.05) {
        // 기준 방향은 키를 처음 누른 순간의 카메라 방향으로 고정 — 걷는 동안 카메라가 따라 돌아도 '앞'이 바뀌지 않아 빙글 돌지 않는다
        if (S.refYaw == null) S.refYaw = Math.atan2(-(S.x - camPos.x), -(S.z - camPos.z));
        const cy = S.refYaw;
        const fx = -Math.sin(cy), fz = -Math.cos(cy), rx = Math.cos(cy), rz = -Math.sin(cy);
        const mx = fx * a - rx * st, mz = fz * a - rz * st, L = Math.hypot(mx, mz) || 1;
        const ty = Math.atan2(-mx, -mz); let da = ty - S.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); S.yaw += da * Math.min(1, dt * 10);
        want = Math.min(1, L) * (c.run ? 6.2 : 3.0) * Math.max(0.2, Math.cos(da));   // 몸이 덜 돌았으면 천천히
      }
      else S.refYaw = null;   // 키를 떼면 다음엔 그때 카메라 기준으로
      S.spd += (want - S.spd) * Math.min(1, dt * 8);
      const fx2 = -Math.sin(S.yaw), fz2 = -Math.cos(S.yaw), nx = S.x + fx2 * S.spd * dt, nz = S.z + fz2 * S.spd * dt;
      // 돌담은 1.2~1.5m 라, 0.8m 넘게 떠 있으면 그 위를 지나간다 (사장님 2026-09-10 "돌담 뛰어넘게")
      const overWall = S.jy > 0.8;
      if (H(nx, nz) > 0.15 && !steep(nx, nz) && !(PLAYER.insideBox && PLAYER.insideBox(nx, nz, .3, overWall))) { S.x = nx; S.z = nz; } else S.spd *= .5;   // 바다·건물·절벽은 못 간다
      if (pushOutCar(S, 0.4)) S.spd *= .3;   // 차 몸체도 못 뚫는다
      if (pushOutTraffic(S, 0.4)) S.spd *= .3;   // 지나가는 차도
      if (window.NPC && NPC.solid && NPC.solid(S, 0.42, 0.3)) S.spd *= .85;   // 사람도 못 뚫는다. 사람이 먼저 비키므로(npc.js) 주인공은 조금만 밀린다 — 사이에 갇히지 않게(사장님 2026-09-10)
      if (c.jump && S.jy <= 0 && S.jumpV <= 0) S.jumpV = 5.4;   // 최고 1.5m — 돌담(1.2~1.5m)을 넘을 만큼
      if (S.jy > 0 || S.jumpV > 0) { S.jumpV -= 9.8 * dt; S.jy = Math.max(0, S.jy + S.jumpV * dt); if (S.jy === 0) S.jumpV = 0; }
      const mv = Math.abs(S.spd) > .3; S.mode = mv ? 'walk' : 'sit';
      // 멈춰 서면 1초 뒤 카메라 쪽으로 돌아선다(앞모습이 보이게). 움직이면 다시 가는 방향
      S.idleT = (!mv && S.jy <= 0 && !(c.steer)) ? (S.idleT || 0) + dt : 0;
      { const want = S.idleT > 1 ? Math.atan2(-(camPos.x - S.x), -(camPos.z - S.z)) : S.yaw; if (S.vyaw == null) S.vyaw = S.yaw; let da = want - S.vyaw; da = Math.atan2(Math.sin(da), Math.cos(da)); S.vyaw += da * Math.min(1, dt * (S.idleT > 1 ? 2.5 : 10)); }
      S.y += (foot(S.x, S.z, 0.3) - S.y) * Math.min(1, dt * 10);
      root.position.set(S.x, S.y + S.jy + stand, S.z); root.quaternion.setFromEuler(carE.set(0, S.vyaw, 0, 'YXZ'));
      if (S.jy > 0) poseJump(.5); else if (mv) poseWalk(dt, !!c.run && Math.abs(S.spd) > 4); else poseIdle();
      // 뛰는 동안은 '뛰어넘기' 클립(3.07초)을 빠르게 돌린다 — 체공이 1.1초라 예전처럼 idle 이면 그냥 떠오르기만 했다
      { const sp = Math.abs(S.spd), run = sp > 4;
        heroAnim(dt, S.jy > 0 && HERO.acts.vault ? 'vault' : S.jy > 0 ? 'idle' : mv ? (run ? 'run' : 'walk') : 'idle',
          S.jy > 0 ? 2.5 : run ? sp / 5.5 : sp / 1.6, 0); }
      return;
    }

    // ---- 차 밖: 어슬렁 / 서서 두리번
    S.wanderT -= dt;
    if (S.mode === 'sit' && S.wanderT <= 0) { const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 3; S.tgt = { x: PLAYER.x + Math.cos(a) * r, z: PLAYER.z + Math.sin(a) * r }; if (Math.hypot(S.tgt.x - PLAYER.x, S.tgt.z - PLAYER.z) > 1.4 && H(S.tgt.x, S.tgt.z) > 0.2 && !pushOutCar({ x: S.tgt.x, z: S.tgt.z }, 0.6)) S.mode = 'walk'; else S.wanderT = 1; }
    let moving = false;
    if (S.mode === 'walk') {
      const dx = S.tgt.x - S.x, dz = S.tgt.z - S.z, d = Math.hypot(dx, dz);
      if (d < .15) { S.mode = 'sit'; S.wanderT = 2.5 + Math.random() * 3.5; }
      else { const step = Math.min(d, 1.3 * dt); S.x += dx / d * step; S.z += dz / d * step; const ty = Math.atan2(-dx, -dz); let da = ty - S.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); S.yaw += da * Math.min(1, dt * 6); moving = true; }
    }
    if (pushOutCar(S, 0.4) && S.mode === 'walk') { S.mode = 'sit'; S.wanderT = 1.5; moving = false; }
    S.y += (foot(S.x, S.z, 0.3) - S.y) * Math.min(1, dt * 10);
    root.position.set(S.x, S.y + stand, S.z); root.quaternion.setFromEuler(carE.set(0, S.yaw, 0, 'YXZ'));
    if (moving) poseWalk(dt, false); else poseIdle();
    heroAnim(dt, moving ? 'walk' : 'idle', 0.85, 0);
  }

  // ---- 내리기·타기 (F 키, 명소 없을 때 E, 폰 단추)
  function canToggle() { const seat = SEAT[PLAYER.veh]; if (!seat || PLAYER.mode !== 'ground' || (window.ACT && ACT.cur)) return false; return S.onFoot || (PLAYER.kmh || 0) < 4; }
  function toggleFoot() {
    if (!canToggle()) return false;
    const seat = SEAT[PLAYER.veh], stand = STAND * seat[3];
    if (!S.onFoot) {
      S.onFoot = true; S.spd = 0; S.ctl = null;
      if (S.mode === 'ride' || S.mode === 'hop_in') { PLAYER.setDoor(1); S.mode = 'hop_out'; S.hp = 'exit'; S.hpT = 0; S.fromQ = root.quaternion.clone(); if (HERO.acts && HERO.acts.exit) HERO.acts.exit.stop(); carToWorld(-1.35, 0, seat[2], doorV); S.x = doorV.x; S.z = doorV.z; S.y = gnd(S.x, S.z); }
    } else {
      if (Math.hypot(PLAYER.x - S.x, PLAYER.z - S.z) > 6) return false;   // 차 옆에서만 탄다
      S.onFoot = false; if (S.mode !== 'ride' && S.mode !== 'hop_in') { S.mode = 'hop_in'; S.hp = 'walk'; S.hpT = 0; S.jy = 0; S.jumpV = 0; if (HERO.acts && HERO.acts.enter) HERO.acts.enter.stop(); }
    }
    camInit = false; return true;
  }
  function board() { S.onFoot = false; S.mode = 'ride'; S.jy = 0; S.jumpV = 0; S.spd = 0; camInit = false; }
  function control(c) { S.ctl = c; }
  function hero() { return S.onFoot ? { x: S.x, z: S.z, y: S.y, yaw: S.yaw, kmh: Math.round(Math.abs(S.spd) * 3.6) } : PLAYER; }
  // 고양이 따라가는 카메라 (차 카메라와 같은 방식, 더 낮고 가깝게)
  function camera(dt, cam, orbit) {
    const zm = orbit.zoom || 1, cy = orbit.yaw, dist = (3.8 + Math.abs(S.spd) * .15) * zm, hgt = 1.1 + (0.8 + orbit.pitch * 3) * zm;   // 걷기 카메라는 절대 각도(주인공이 돌아도 안 돈다) · 휠 줌: 가까이 가면 눈높이로
    camWant.set(S.x + Math.sin(cy) * dist, S.y + hgt, S.z + Math.cos(cy) * dist);
    const gy = Math.max(H(camWant.x, camWant.z), 0) + .5; if (camWant.y < gy) camWant.y = gy;
    if (!camInit) { camPos.copy(cam.position); camInit = true; }
    camPos.lerp(camWant, 1 - Math.exp(-7 * dt)); cam.position.copy(camPos);
    lookV.set(S.x, S.y + S.jy * .5 + .9, S.z); cam.lookAt(lookV);
    if (Math.abs(cam.fov - 60) > .05) { cam.fov = 60; cam.updateProjectionMatrix(); }
  }
  window.PET = { init, update, state: S, cat: CAT, catState: C, heroM: HERO, gfM: GF, toggleFoot, canToggle, board, control, hero, camera, get onFoot() { return S.onFoot; }, gfSay: gfSay, brokerAt: brokerAt, say: sayBox };
})();
