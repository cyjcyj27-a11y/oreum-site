// 근처 사람 — Meshy 로 뽑고 Meshy 애니메이트로 리깅한 GLB(assets/models/<id>.glb, 클립 idle/walk/run). pack_npc.py 로 묶는다.
// npc.js 는 사람의 자리·걸음·넘어짐만 계산하고(코드 인형은 화면에 안 그린다) 그리기는 전부 여기서:
//   카메라 NEAR 미터 안 = 리깅 GLB(최대 POOL_N 명, 종류별 고르게, 옷 색 변주)
//   그 밖            = GLB 를 찍어 둔 그림판(빌보드, 종류·옷색마다 한 장, 인스턴스)
// 모델은 종류별 한 번씩만 불러 SkeletonUtils.clone 으로 복제 → 기하·텍스처 공유. 파일이 없는 종류는 건너뛴다.
(function () {
  const P = { pool: [], ready: false, near: 45, every: 0.3, acc: 0, kinds: [], boards: null };
  const POOL_N = 28;                 // 동시에 보이는 리깅 사람 수(7종 × 4)
  const MODELS = [                   // id = assets/models/<id>.glb, h = 키(미터)
    { id: 'man', h: 1.75 }, { id: 'woman', h: 1.65 },
    { id: 'suit', h: 1.78 },         // 정장 남자
    { id: 'jeans', h: 1.66 },        // 회색 상의·청바지 여자
    { id: 'boy', h: 1.25 },          // 남자아이
    { id: 'elder', h: 1.68 },        // 파란 점퍼 할아버지
    { id: 'haenyeo', h: 1.60 },      // 머릿수건 여자
  ];
  // 옷 색 변주: 텍스처에서 피부색(주황~붉은 기·중간 채도·밝음)만 남기고 나머지 색상을 돌린다. 파일은 안 늘고 켤 때 캔버스로 만든다.
  // [색상 회전(도), 채도 배수, 밝기 배수, 최소 채도] — 최소 채도가 있으면 흰옷·회색옷처럼 채도가 없는 부분도 그 색으로 물들인다(흰 셔츠는 색을 돌려도 흰색이라)
  const TINTS = [null, [0, 1, 1, 0.3], [30, 1, 1, 0.3], [60, 0.9, 1, 0.3], [120, 1, 0.9, 0.3], [180, 1, 1, 0.3], [210, 1, 1, 0.3], [270, 1, 1, 0.3], [330, 1, 1, 0.3], [0, 0.15, 1.7, 0]];   // 열 가지 전부 흰옷·검은옷도 물들이는 색(빨·주·노·초·청록·파·보·분홍) + 밝은 회색 → 어느 모델이든 열 벌이 다 다르게 보인다
  const BOARD_W = 256, BOARD_H = 512;    // 그림판 해상도(가로·세로) — 종류 7 × 옷색 10 = 70장이라 작게
  const UP = new THREE.Vector3(0, 1, 0);
  // 비탈에서 한쪽 발이 땅에 묻히지 않게: 발 주변 네 곳 중 가장 높은 땅에 맞추고 3cm 띄운다(사장님 2026-09-09)
  // 발 디딜 높이 — 땅높이만 보면 인도·광장처럼 한 단 올라온 포장 위에서 그 두께만큼 묻힌다
  // (사장님 2026-09-10 "할머니가 땅에서 솟아남"). 깔린 길·인도 높이와 비교해 높은 쪽을 쓴다.
  const groundAt = (x, z) => {
    const t = Math.max(ISLAND.H(x - 0.3, z), ISLAND.H(x + 0.3, z), ISLAND.H(x, z - 0.3), ISLAND.H(x, z + 0.3));
    const r = window.ROADS && ROADS.surfaceAbs ? ROADS.surfaceAbs(x, z) : null;
    return (r == null ? t : Math.max(t, r)) + 0.03;
  };

  function tintTexture(src, t) {
    const img = src.image, W = img.width, H = img.height;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, W, H), px = d.data, rot = t[0] / 360, sm = t[1], vm = t[2], minS = t[3] || 0;
    for (let i = 0; i < px.length; i += 4) {
      const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dl = mx - mn, v = mx, sat = mx ? dl / mx : 0;
      let h = 0; if (dl) { h = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; h /= 6; if (h < 0) h += 1; }
      if ((h < 0.13 || h > 0.95) && sat > 0.12 && sat < 0.75 && v > 0.3) continue;   // 피부
      const lowS = minS > 0 && (sat < minS || v < 0.35);   // 검은·짙은 옷(남자 체크셔츠)도 색상을 돌려선 티가 안 나 중간 밝기 색으로 물들인다   // 흰·회색·검은 옷(채도 없음): 색상은 회전값 그대로, 채도를 최소치까지 올려 물들인다. 검은 옷은 중간 밝기로 올린다(머리칼도 같이 물들지만 염색으로 보인다)
      const h2 = lowS ? rot : (h + rot) % 1, s2 = lowS ? minS : Math.min(1, sat * sm), v2 = lowS && v < 0.35 ? 0.45 : Math.min(1, v * vm);
      const k = h2 * 6, c = v2 * s2, x = c * (1 - Math.abs(k % 2 - 1)), m = v2 - c;
      let R, G, B; if (k < 1) [R, G, B] = [c, x, 0]; else if (k < 2) [R, G, B] = [x, c, 0]; else if (k < 3) [R, G, B] = [0, c, x]; else if (k < 4) [R, G, B] = [0, x, c]; else if (k < 5) [R, G, B] = [x, 0, c]; else [R, G, B] = [c, 0, x];
      px[i] = (R + m) * 255; px[i + 1] = (G + m) * 255; px[i + 2] = (B + m) * 255;
    }
    ctx.putImageData(d, 0, 0);
    const tex = new THREE.CanvasTexture(cv); tex.flipY = src.flipY; tex.colorSpace = src.colorSpace; tex.wrapS = src.wrapS; tex.wrapT = src.wrapT; tex.generateMipmaps = src.generateMipmaps; tex.minFilter = src.minFilter;
    return tex;
  }

  function prep(root, h) {
    // 발이 y=0, 키를 h 미터로. Meshy→GLB 는 보통 이미 미터 단위지만 한 번 재서 맞춘다
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root, true), size = new THREE.Vector3(); box.getSize(size);
    const s = h / (size.y || h); root.scale.setScalar(s);
    root.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(root, true);
    root.position.y = -b2.min.y;
    root.traverse(o => { if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.frustumCulled = false; const m = o.material; if (m) { m.roughness = 0.85; m.metalness = 0; } } });
    return root;
  }
  function makeClone(base, who) {
    const c = window.SkeletonClone(base);
    const holder = new THREE.Group(); holder.add(c); holder.visible = false;
    const mats = []; c.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && o.material) { o.material = o.material.clone(); mats.push(o.material); } });
    const mixer = new THREE.AnimationMixer(c);
    const acts = {}; for (const clip of base.animations) acts[clip.name] = mixer.clipAction(clip);
    if (acts.idle) acts.idle.play();
    if (acts.walk) { acts.walk.play(); acts.walk.setEffectiveWeight(0); }
    mixer.update(Math.random() * 2);   // 걸음이 다 같은 박자로 안 맞게
    const me = { who, holder, mixer, acts, a: null, tint: -1 };
    me.setTint = (kind, idx) => {   // 옷 색 바꾸기: 그 종류의 변주 목록에서 골라 map(+emissiveMap) 만 바꾼다
      const list = kind.tints || []; const tex = list[idx % Math.max(1, list.length)] || list[0]; if (!tex || me.tint === idx) return; me.tint = idx;
      for (const m of mats) { m.map = tex; if (m.emissiveMap) m.emissiveMap = tex; m.needsUpdate = true; }
    };
    return me;
  }

  // 종류마다 변주 텍스처 목록(한 프레임에 하나씩, 켜자마자 끊기지 않게). 다 되면 update 가 그림판을 찍는다.
  function buildTints(kind) {
    let src = null; kind.root.traverse(o => { if (!src && (o.isMesh || o.isSkinnedMesh) && o.material && o.material.map) src = o.material.map; });
    kind.tints = [src]; if (!src || !src.image || !src.image.width) return;
    let i = 1; const step = () => { if (i >= TINTS.length) return; kind.tints.push(tintTexture(src, TINTS[i++])); setTimeout(step, 0); }; setTimeout(step, 0);
  }

  // 그림판: 종류·옷색마다 GLB 를 정면 살짝 옆에서 찍은 투명 그림 한 장 → 인스턴스 평면(발이 y=0)
  function buildBoards() {
    if (!P.renderer || !window.NPC || !NPC.list) return false;
    for (const k of P.kinds) if (!k.tints || k.tints.length < TINTS.length) return false;
    const r = P.renderer, sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(2, 5, 4); sc.add(d);
    const oldTarget = r.getRenderTarget(), oldTone = r.toneMapping, oldClear = r.getClearAlpha(), oldCol = new THREE.Color(); r.getClearColor(oldCol);
    r.toneMapping = THREE.NoToneMapping;
    const N = NPC.list.length; P.boards = [];
    for (const k of P.kinds) {
      const h = MODELS.find(m => m.id === k.id).h, w = h * 0.7;
      // 위아래 틀은 카메라 자리(y = h/2)에서 재는 값이다. 예전엔 1.02h / -0.02h 를 줘서 발이 아니라 허리부터(0.48h) 위만 찍혔고,
      // 그 그림을 키 h 짜리 판에 붙이니 멀리 있는 사람이 다 반토막만 땅에 묻힌 꼴이 됐다 (사장님 2026-09-11)
      const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h * 0.52, -h * 0.5, 0.1, 50); cam.position.set(1.2, h * 0.5, 6); cam.lookAt(0, h * 0.5, 0);
      const root = k.root; sc.add(root);
      const mats = []; root.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && o.material) mats.push(o.material); });
      const orig = mats.map(m => [m.map, m.emissiveMap]);
      k.boards = [];
      for (let t = 0; t < k.tints.length; t++) {
        const tex = k.tints[t]; for (const m of mats) { m.map = tex; if (m.emissiveMap) m.emissiveMap = tex; m.needsUpdate = true; }
        const rt = new THREE.WebGLRenderTarget(BOARD_W, BOARD_H, { colorSpace: THREE.SRGBColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
        r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(sc, cam); (P.rts = P.rts || []).push(rt);
        const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
        const mat = new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: 0xd8d8d8 });
        const im = new THREE.InstancedMesh(g, mat, N); im.count = 0; im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false;
        P.scene.add(im); k.boards.push(im); P.boards.push(im);
      }
      mats.forEach((m, i) => { m.map = orig[i][0]; m.emissiveMap = orig[i][1]; m.needsUpdate = true; });
      sc.remove(root);
    }
    r.setRenderTarget(oldTarget); r.toneMapping = oldTone; r.setClearColor(oldCol, oldClear);
    return true;
  }

  function init(scene, renderer) {
    P.scene = scene; P.renderer = renderer || (window.__jj && __jj.renderer) || null;
    Promise.allSettled(MODELS.map(m => GLB.load('assets/models/' + m.id + '.glb?v=1'))).then(rs => {
      rs.forEach((r, i) => {
        if (r.status !== 'fulfilled') { console.warn('people.glb 없음:', MODELS[i].id); return; }
        const root = r.value; prep(root, MODELS[i].h);
        root.animations = root.userData.clips; root.userData = {};   // glb.js 가 넣은 mixer 등은 순환 참조라 SkeletonUtils.clone 이 못 복제한다
        const kind = { id: MODELS[i].id, root, tints: [] }; P.kinds.push(kind); buildTints(kind);
      });
      if (!P.kinds.length) return;
      for (let i = 0; i < POOL_N; i++) { const k = P.kinds[i % P.kinds.length]; const c = makeClone(k.root, k.id); scene.add(c.holder); P.pool.push(c); }
      P.ready = true;
    });
  }

  // 사람마다 종류·옷색을 한 번 정해 둔다 → GLB 와 그림판이 같은 모습.
  // 무작위로 정하면 한 장소에 같은 사람이 몰린다(한 장소의 사람들은 npc.js 목록에서 연달아 있다) → 목록 순서대로 7종을 돌려 가며 배정해 어디서나 고르게 섞는다.
  function decideAll(list) {
    // 같은 장소에 같은 사람(종류+옷색) 둘이 안 나오게: 목록 순서대로 정하되, 45m 안에 이미 있는 조합은 피한다(사장님 2026-09-09)
    const K = P.kinds.length, T = TINTS.length, NEAR = 45;
    const cell = 50, grid = new Map(); const key = (x, z) => Math.floor(x / cell) + ',' + Math.floor(z / cell);
    list.forEach((a, i) => {
      const used = new Set();
      const cx = Math.floor(a.x / cell), cz = Math.floor(a.z / cell);
      for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gz = cz - 1; gz <= cz + 1; gz++) { const b = grid.get(gx + ',' + gz); if (b) for (const o of b) if (Math.hypot(o.x - a.x, o.z - a.z) < NEAR) used.add(o.model + '#' + o.tint); }
      let pick = null;
      for (let n = 0; n < K * T && !pick; n++) {   // 종류는 3칸씩, 옷색은 7칸씩 건너뛰며 순환 → 처음 것부터 안 겹치는 조합
        const m = P.kinds[(i * 3 + n) % K].id, t = ((i * 7) + Math.floor(n / K) * 7) % T;
        if (!used.has(m + '#' + t)) pick = [m, t];
      }
      if (!pick) pick = [P.kinds[(i * 3) % K].id, (i * 7) % T];   // 45m 안에 70명 넘게 몰리면 어쩔 수 없이 겹친다
      a.model = pick[0]; a.tint = pick[1];
      const k = key(a.x, a.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(a);
    });
    P.decided = true;
  }
  function decide(a) {   // 나중에 추가된 사람용 예비
    const K = P.kinds.length;
    if (!a.model || !P.kinds.some(k => k.id === a.model)) a.model = P.kinds[Math.floor((a.phase % 1) * K) % K].id;
    if (a.tint == null) a.tint = 0;
  }
  // 배정: 카메라 가까운 사람부터 GLB
  function assign(list, camPos) {
    const cand = [];
    for (let i = 0; i < list.length; i++) { const a = list[i]; if (a.hidden) continue; const d = Math.hypot(a.x - camPos.x, a.z - camPos.z); if (d < P.near) cand.push({ a, d }); }
    cand.sort((u, v) => u.d - v.d);
    const want = new Set(cand.slice(0, POOL_N).map(c => c.a));
    for (const c of P.pool) if (c.a && !want.has(c.a)) { c.a.glb = null; c.a = null; c.holder.visible = false; }
    for (const { a } of cand.slice(0, POOL_N)) {
      if (a.glb) continue;
      decide(a);
      const free = P.pool.find(c => !c.a && c.who === a.model);   // 같은 종류 슬롯만(다른 모델로 바꿔 세우면 멀리서 본 모습과 달라진다)
      if (!free) continue;
      free.setTint(P.kinds.find(k => k.id === free.who), a.tint);
      free.a = a; a.glb = free; free.holder.visible = true;
    }
  }

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
  function update(dt, t, camPos) {
    if (!P.ready || !window.NPC || !NPC.list) return;
    if (window.NPC.mesh && NPC.mesh.visible) NPC.mesh.visible = false;   // 코드 인형은 안 그린다
    if (!P.decided) decideAll(NPC.list);
    if (!P.boards) buildBoards();
    P.acc += dt; if (P.acc >= P.every) { P.acc = 0; assign(NPC.list, camPos); }
    for (const c of P.pool) {
      const a = c.a; if (!a) continue;
      const h = c.holder; h.position.set(a.x, groundAt(a.x, a.z), a.z); h.rotation.set(0, a.yaw + Math.PI, 0); h.scale.setScalar(a.sc || 1);
      if (a.fall > 0) {   // 차에 치임: 인형의 넘어지기 대신 통째로 눕힌다(2.6→2.2 넘어짐, 0.6→0 일어남)
        const k = a.fall > 2.2 ? (2.6 - a.fall) / 0.4 : a.fall > 0.6 ? 1 : a.fall / 0.6;
        h.rotation.x = -Math.PI / 2 * Math.max(0, Math.min(1, k)); h.position.y += 0.15 * k;
        if (c.acts.walk) c.acts.walk.setEffectiveWeight(0); if (c.acts.idle) c.acts.idle.setEffectiveWeight(1);
        continue;
      }
      const w = a.amp || 0;   // 0 서 있음 → 1 걷는 중 (npc.js 가 정한다)
      if (c.acts.walk) { c.acts.walk.setEffectiveWeight(w); c.acts.walk.setEffectiveTimeScale(0.9 + (a.speed - 1.1) * 0.6); }
      if (c.acts.idle) c.acts.idle.setEffectiveWeight(1 - w);
      c.mixer.update(dt);
    }
    // 그림판: GLB 가 아닌 모든 사람. 카메라 쪽으로 돌려 세운다(수평만)
    if (P.boards) {
      for (const im of P.boards) im.count = 0;
      const list = NPC.list;
      for (let i = 0; i < list.length; i++) {
        const a = list[i]; if (a.hidden || a.glb) continue;
        decide(a);
        const k = P.kinds.find(k => k.id === a.model); const im = k.boards[a.tint % k.boards.length];
        const yaw = Math.atan2(camPos.x - a.x, camPos.z - a.z);
        Q.setFromAxisAngle(UP, yaw); V.set(a.x, groundAt(a.x, a.z), a.z); const s = a.sc || 1; Sc.set(s, a.fall > 0 ? s * 0.25 : s, s);
        M.compose(V, Q, Sc); im.setMatrixAt(im.count++, M);
      }
      for (const im of P.boards) im.instanceMatrix.needsUpdate = true;
    }
  }
  window.PEOPLE = Object.assign(P, { init, update });
})();
