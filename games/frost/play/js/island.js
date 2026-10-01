// island.js — 호수 섬 드리바 공주 석상과 들판의 얼음할아버지 (사장님 2026-09-18 "호수섬에서는 할게 없던데",
//   "드리바 공주 석상을 하나 배치해서 석상을 돌리면 열쇠가 나오면 어떨까")
//   · 석상은 E 로 45°씩 돌린다(돌 가는 소리). 공주가 미르 성을 바라보면 받침돌 서랍이 열리고 횃불이 솟는다
//     (처음엔 열쇠였다 — 사장님 같은 날 "열쇠가 아니라 토치가 나오게, 얼음을 녹이는거지 불로")
//   · 횃불을 들고 들판의 얼음 덩어리에 대면 얼음이 김을 내며 녹고, 갇혀 있던 얼음할아버지(데드 마로즈)가 풀려나 소원 선물을 준다
//   · T.isl = { rot: 몇 칸 돌렸나, key: 0 아직 · 1 서랍에 횃불 · 2 횃불 가짐 · 3 할아버지 풀어 줌 }
(function () {
  const V3 = THREE.Vector3, L = U.L;
  const STEP = Math.PI / 4, PRIZE = 300, MELT = 3.2;
  const THANK_SECS = 7, FERN_SECS = 6;   // 풀려난 할아버지의 두 대사를 띄워 두는 시간
  let scene = null, S = null, F = null;
  let turn = null, drawerT = -1, meltT = -9, plant = null, thankT = -1, flakeT = 0;
  const shards = [], flakes = [];
  const NAME = { ko: '얼음할아버지', en: 'Grandfather Frost' };
  const THANK = ['고맙구나, 꼬마야! 한여름에 깜빡 잠들었다가 얼음에 갇혀 버렸지. 네 불 덕분에 풀려났구나. 소원을 하나 들어주마.', 'Thank you, little one! I dozed off in midsummer and froze solid. Your fire set me free. I\'ll grant you one wish.'];
  const DONE = ['쿠팔라의 밤엔 나도 숲에서 고사리꽃을 찾는단다. 네가 먼저 찾으면 알려 주렴!', 'On Kupala Night I look for the fern flower too. If you find it first, tell me!'];

  const st = () => T.isl || (T.isl = { rot: 0, key: 0 });
  // 두 점 a→b 를 잇는 원기둥 (팔·지팡이)
  const _up = new V3(0, 1, 0);
  function seg(a, b, r0, r1, n) {
    const A = new V3(...a), B = new V3(...b), d = B.clone().sub(A), len = d.length();
    const g = new THREE.CylinderGeometry(r1, r0, len, n || 8);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(_up, d.normalize()));
    g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    return g;
  }

  // ── 횃불: 나무 자루 + 기름 먹인 천 뭉치 + 흔들리는 불꽃(+빛) ──
  const flameTex = (() => { let t = null; return () => {
    if (t) return t;
    const c = GEO.canvas(64, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 92, 2, 32, 80, 60);
    gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.25, 'rgba(255,210,90,.95)'); gr.addColorStop(0.55, 'rgba(255,120,30,.7)'); gr.addColorStop(1, 'rgba(200,40,0,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(58, 50, 60, 100, 32, 124); g.bezierCurveTo(4, 100, 6, 50, 32, 4); g.fill();
    return (t = GEO.tex(c)); }; })();
  function torchMesh(lit) {
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.9 });
    const rag = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 1 });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.55, 7).translate(0, 0.0, 0), wood));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.12, 8).translate(0, 0.3, 0), rag));
    for (const y of [0.25, 0.35]) g.add(new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.008, 4, 10).rotateX(Math.PI / 2).translate(0, y, 0), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.6, roughness: 0.4 })));
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    fl.scale.set(0.2, 0.36, 1); fl.position.y = 0.5; g.add(fl);
    const fl2 = fl.clone(); fl2.material = fl.material.clone(); fl2.scale.set(0.13, 0.24, 1); fl2.position.y = 0.46; g.add(fl2);
    g.userData.flames = [fl, fl2];
    if (lit) { const L2 = new THREE.PointLight(0xffa040, 0, 7, 1.6); L2.position.y = 0.55; g.add(L2); g.userData.light = L2; }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  function flicker(tg, k) {
    const f = tg.userData.flames, t = T.time;
    f[0].scale.set(0.2 * (1 + Math.sin(t * 23) * 0.08), 0.36 * (1 + Math.sin(t * 17 + 1) * 0.12) * k, 1);
    f[1].scale.set(0.13, 0.24 * (1 + Math.sin(t * 29) * 0.15) * k, 1);
    f[0].material.rotation = Math.sin(t * 7) * 0.08;
    if (tg.userData.light) tg.userData.light.intensity = (1.4 + Math.sin(t * 19) * 0.3 + Math.sin(t * 7) * 0.2) * k * (0.5 + SKY.cur.night);
  }

  // ── 석상: 받침돌 + 돌아가는 공주 (드레스·허리·팔·땋은 머리·관) ──
  function statue() {
    const g = new THREE.Group();
    const rnd = U.mulberry(515);
    const stone = (geo, c) => GEO.tint(geo, c || 0x9e9a90, 0.12, rnd);
    const moss = 0x6a7a4a;
    const base = GEO.merge([
      stone(GEO.box(1.3, 0.25, 1.3, 0, 0.125, 0), 0x8a867c),
      stone(GEO.box(0.95, 0.75, 0.95, 0, 0.62, 0)),
      stone(GEO.box(1.1, 0.12, 1.1, 0, 1.05, 0), 0xa8a498),
      stone(GEO.box(1.32, 0.05, 1.32, 0, 0.26, 0), moss),
    ]);
    GEO.shadeY(base, 0.6, 1.05);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    const bm = new THREE.Mesh(base, mat); bm.castShadow = bm.receiveShadow = true; g.add(bm);
    // 서랍 (받침돌 앞면, 열쇠가 든 돌 서랍)
    const drawer = new THREE.Group(); drawer.position.set(0, 0.62, 0.47);
    const dm = new THREE.Mesh(GEO.merge([stone(GEO.box(0.42, 0.22, 0.4, 0, 0, -0.2), 0x8e8a80), stone(GEO.box(0.46, 0.26, 0.03, 0, 0, 0.005), 0xb0aca0)]), mat);
    drawer.add(dm); g.add(drawer);
    // 서랍 앞 문양: 성 모양 돋을새김
    const mark = new THREE.Mesh(GEO.merge([
      stone(GEO.box(0.2, 0.08, 0.02, 0, -0.03, 0.03), 0x7a766c), stone(GEO.box(0.05, 0.08, 0.02, -0.075, 0.05, 0.03), 0x7a766c),
      stone(GEO.box(0.05, 0.08, 0.02, 0.075, 0.05, 0.03), 0x7a766c), stone(GEO.box(0.05, 0.12, 0.02, 0, 0.07, 0.03), 0x7a766c)]), mat);
    drawer.add(mark);
    // 횃불 (서랍에서 솟는다)
    const key = torchMesh(false);
    key.visible = false; key.position.set(0, 0.62, 0.55);
    g.add(key);
    // 돌아가는 공주
    const rot = new THREE.Group(); rot.position.y = 1.11; g.add(rot);
    // 치마: 아래로 퍼지는 주름 (세로 골을 판다)
    const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new THREE.Vector2(0.4 - t * 0.26 + (1 - t) * (1 - t) * 0.06, t * 1.02)); }
    const gown = new THREE.LatheGeometry(pts, 32);
    { const p = gown.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), a2 = Math.atan2(z, x), k = 1 + Math.sin(a2 * 9) * 0.05 * (1 - y); p.setX(i, x * k); p.setZ(i, z * k); } gown.computeVertexNormals(); }
    const HAIR = 0x8e8a80, LIGHT = 0xb4b0a4;
    const parts = [
      stone(gown),
      stone(new THREE.CylinderGeometry(0.12, 0.15, 0.34, 16).translate(0, 1.18, 0)),                  // 몸통
      stone(new THREE.SphereGeometry(0.13, 14, 8).scale(1.35, 0.5, 0.85).translate(0, 1.35, 0)),       // 어깨
      stone(new THREE.TorusGeometry(0.15, 0.025, 6, 20).rotateX(Math.PI / 2).translate(0, 1.03, 0), LIGHT), // 허리띠
      stone(new THREE.CylinderGeometry(0.04, 0.045, 0.1, 10).translate(0, 1.44, 0)),                  // 목
      stone(new THREE.SphereGeometry(0.095, 16, 12).scale(0.92, 1.1, 0.95).translate(0, 1.55, 0.01)),  // 얼굴
      stone(new THREE.SphereGeometry(0.03, 8, 6).translate(0, 1.54, 0.1)),                             // 코끝
      stone(new THREE.SphereGeometry(0.1, 14, 10, 0, 6.3, 0, 1.9).translate(0, 1.57, -0.015), HAIR),  // 머리칼
      stone(new THREE.SphereGeometry(0.06, 10, 8).translate(0, 1.56, -0.1), HAIR),                    // 쪽
      stone(seg([0, 1.52, -0.12], [0.02, 1.05, -0.2], 0.04, 0.018, 8), HAIR),                          // 땋은 머리
      // 코코시니크: 머리 뒤로 선 반달 관 + 구슬
      stone(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 24).rotateX(Math.PI / 2).translate(0, 1.6, -0.06), LIGHT),
      // 오른팔: 어깨 → 팔꿈치 → 앞으로 뻗은 손끝 (바라보는 쪽을 가리킨다)
      stone(seg([0.17, 1.36, 0], [0.2, 1.36, 0.25], 0.045, 0.04)),
      stone(seg([0.2, 1.36, 0.25], [0.2, 1.4, 0.5], 0.04, 0.03)),
      stone(new THREE.SphereGeometry(0.035, 8, 6).scale(0.8, 0.6, 1.4).translate(0.2, 1.41, 0.55)),
      stone(seg([0.2, 1.41, 0.57], [0.2, 1.42, 0.64], 0.012, 0.008, 5)),                               // 가리키는 손가락
      // 왼팔: 가슴에 댄 손
      stone(seg([-0.17, 1.36, 0], [-0.22, 1.14, 0.06], 0.045, 0.04)),
      stone(seg([-0.22, 1.14, 0.06], [-0.05, 1.22, 0.15], 0.04, 0.032)),
      stone(new THREE.SphereGeometry(0.035, 8, 6).translate(-0.03, 1.23, 0.16)),
      // 소매 끝 주름 장식
      stone(new THREE.TorusGeometry(0.04, 0.012, 5, 10).rotateX(0.1).translate(0.2, 1.4, 0.49), LIGHT),
    ];
    for (let i = 0; i < 7; i++) { const a2 = -1.1 + i * 0.37; parts.push(stone(new THREE.SphereGeometry(0.016, 6, 4).translate(Math.sin(a2) * 0.14, 1.6 + Math.cos(a2) * 0.14, -0.04), 0xc8c4b8)); }
    const body = GEO.merge(parts);
    GEO.shadeY(body, 0.55, 1.1);
    const pm = new THREE.Mesh(body, mat); pm.castShadow = true; pm.receiveShadow = true; rot.add(pm);
    return { g, rot, drawer, key };
  }

  // ── 얼음할아버지: 파란 긴 외투·흰 털 가장자리·긴 흰 수염·털모자·별 지팡이 ──
  function grandpa() {
    const g = new THREE.Group();
    const rnd = U.mulberry(1225);
    const t = (geo, c, j) => GEO.tint(geo, c, j == null ? 0.06 : j, rnd);
    const BLUE = 0x2c5ca8, FUR = 0xf4f4f0, SKIN = 0xf0c8a8;
    const pts = []; for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(new THREE.Vector2(0.4 - k * 0.2 + (1 - k) * (1 - k) * 0.04, k * 1.28)); }
    const robe = new THREE.LatheGeometry(pts, 28);
    const SNOW = 0xdfe8f8, RED = 0xc8343a;
    const parts = [
      t(robe, BLUE),
      t(new THREE.TorusGeometry(0.42, 0.06, 8, 28).rotateX(Math.PI / 2).translate(0, 0.05, 0), FUR, 0.1),     // 밑단 털
      t(seg([0, 0.08, 0.41], [0, 1.2, 0.22], 0.06, 0.045, 8).scale(1, 1, 0.5), FUR, 0.1),                     // 앞섶 털
      t(new THREE.TorusGeometry(0.25, 0.035, 6, 20).rotateX(Math.PI / 2).translate(0, 0.86, 0), SNOW),        // 허리띠
      t(new THREE.SphereGeometry(0.2, 14, 10).scale(1.3, 0.62, 0.95).translate(0, 1.3, 0), BLUE),             // 어깨
      t(new THREE.SphereGeometry(0.12, 16, 12).scale(0.95, 1.05, 0.95).translate(0, 1.52, 0.02), SKIN, 0.03), // 얼굴
      t(new THREE.SphereGeometry(0.032, 10, 8).translate(0, 1.51, 0.135), 0xe8907a, 0.02),                    // 코
      t(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 0.7, 0.5).translate(-0.07, 1.49, 0.1), 0xf0a0a0, 0.02),  // 볼
      t(new THREE.SphereGeometry(0.03, 8, 6).scale(1, 0.7, 0.5).translate(0.07, 1.49, 0.1), 0xf0a0a0, 0.02),
      t(new THREE.SphereGeometry(0.1, 10, 6).scale(1.6, 0.45, 0.55).translate(0, 1.45, 0.12), FUR, 0.08),     // 콧수염
      t(new THREE.BoxGeometry(0.075, 0.022, 0.03).rotateZ(0.2).translate(-0.05, 1.575, 0.115), FUR),          // 눈썹
      t(new THREE.BoxGeometry(0.075, 0.022, 0.03).rotateZ(-0.2).translate(0.05, 1.575, 0.115), FUR),
      t(new THREE.CylinderGeometry(0.125, 0.14, 0.2, 18).translate(0, 1.7, -0.01), BLUE),                     // 모자
      t(new THREE.SphereGeometry(0.125, 16, 8, 0, 6.3, 0, 1.5).translate(0, 1.8, -0.01), BLUE),
      t(new THREE.TorusGeometry(0.145, 0.05, 8, 22).rotateX(Math.PI / 2).translate(0, 1.62, -0.01), FUR, 0.1), // 모자 털
      // 팔: 어깨에서 아래로, 손은 앞에 — 오른손은 지팡이, 왼손은 옆구리
      t(seg([-0.24, 1.3, 0], [-0.3, 1.02, 0.05], 0.085, 0.075), BLUE),
      t(seg([-0.3, 1.02, 0.05], [-0.28, 0.82, 0.14], 0.075, 0.085), BLUE),
      t(new THREE.TorusGeometry(0.075, 0.03, 6, 12).rotateX(1.2).translate(-0.28, 0.8, 0.15), FUR, 0.1),
      t(new THREE.SphereGeometry(0.065, 10, 8).scale(0.9, 1.1, 1).translate(-0.27, 0.74, 0.17), RED),
      t(seg([0.24, 1.3, 0], [0.33, 1.08, 0.08], 0.085, 0.075), BLUE),
      t(seg([0.33, 1.08, 0.08], [0.38, 0.98, 0.26], 0.075, 0.085), BLUE),
      t(new THREE.TorusGeometry(0.075, 0.03, 6, 12).rotateX(1.4).translate(0.385, 0.975, 0.27), FUR, 0.1),
      t(new THREE.SphereGeometry(0.07, 10, 8).translate(0.39, 0.96, 0.31), RED),
      // 지팡이: 은빛, 손을 지나 땅에 닿는다
      t(seg([0.39, 0.02, 0.33], [0.39, 1.95, 0.31], 0.022, 0.02, 8), 0xd8dce8, 0.03),
      // 외투 눈꽃 무늬
      ...[0, 1, 2, 3, 4, 5].map(i => { const a2 = i / 6 * 6.28 + 0.3, y = 0.25 + (i % 2) * 0.12, r = 0.37 - y * 0.16; return t(new THREE.OctahedronGeometry(0.035, 0).scale(1, 1, 0.3).translate(Math.cos(a2) * r, y, Math.sin(a2) * r), SNOW, 0); }),
    ];
    // 긴 흰 수염: 턱에서 배까지 넓게 퍼지다 끝이 모인다
    const bp = []; for (let i = 0; i <= 10; i++) { const k = i / 10; bp.push(new THREE.Vector2(0.02 + Math.sin(Math.PI * Math.pow(k, 0.7)) * 0.15, -k * 0.62)); }
    bp.reverse();   // 아래→위 순서여야 겉면이 밖을 본다
    parts.push(t(new THREE.LatheGeometry(bp, 16).scale(1, 1, 0.6).rotateX(-0.22).translate(0, 1.47, 0.2), FUR, 0.1));
    const eye = new THREE.SphereGeometry(0.017, 8, 6);
    parts.push(t(eye.clone().translate(-0.045, 1.54, 0.115), 0x1a2a4a, 0), t(eye.translate(0.045, 1.54, 0.115), 0x1a2a4a, 0));
    const body = GEO.merge(parts);
    GEO.shadeY(body, 0.7, 1.05);
    const m = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }));
    m.castShadow = true; g.add(m);
    const starMat = () => new THREE.MeshStandardMaterial({ color: 0xbfe8ff, emissive: 0x3a7ab0, emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.2 });
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), starMat());
    star.position.set(0.39, 2.03, 0.31); g.add(star);
    const out = { g, star };
    // 블렌더로 다듬은 할아버지 (tools/frost_blender.py → assets/models/frost.glb, 사장님 2026-09-20)
    //   몸·지팡이·별 세 조각을 코드 인형 자리에 갈아 끼운다. 못 불러오면 코드 인형 그대로
    if (window.PLAYER && PLAYER.loadGLB) {
      PLAYER.loadGLB('assets/models/frost.glb?v=1').then(gl => {
        const N = {};
        gl.scene.traverse(o => { if (o.isMesh) N[o.name] = o; });
        if (!N.body || !N.staff || !N.star) return;
        g.remove(m); g.remove(star);
        m.geometry.dispose(); m.material.dispose(); star.geometry.dispose(); star.material.dispose();
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
        for (const k of ['body', 'staff']) {
          const me = new THREE.Mesh(N[k].geometry, mat);
          me.position.copy(N[k].position); me.castShadow = true; g.add(me);
        }
        const st = new THREE.Mesh(N.star.geometry, starMat());
        st.position.copy(N.star.position); g.add(st);
        out.star = st;
      }).catch(e => console.warn('frost.glb', e.message));
    }
    return out;
  }
  // 얼음 덩어리 + 쇠사슬 + 금빛 자물쇠 + 둘레 서리
  function frozen() {
    const root = new THREE.Group();
    const man = grandpa(); root.add(man.g);
    const ice = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.35, 1.2, 3, 5, 3), new THREE.MeshStandardMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0.5, roughness: 0.08, metalness: 0.1, depthWrite: false }));
    { const p = ice.geometry.attributes.position, r = U.mulberry(77); for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (1 + (r() - 0.5) * 0.12), p.getY(i), p.getZ(i) * (1 + (r() - 0.5) * 0.12)); ice.geometry.computeVertexNormals(); }
    ice.position.y = 1.15; ice.renderOrder = 3; root.add(ice);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.45, 2.35, 1.2)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    edge.position.y = 1.15; root.add(edge);
    // 고드름
    const icM = new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.8, roughness: 0.1 });
    const icicles = new THREE.Group();
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28, c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25 + (i % 3) * 0.12, 5), icM); c.position.set(Math.cos(a) * 0.72, 2.25, Math.sin(a) * 0.6); c.rotation.x = Math.PI; icicles.add(c); }
    root.add(icicles);
    // 둘레 서리 (한여름 풀밭에 하얀 원)
    const fc = GEO.canvas(128, 128), fg = fc.getContext('2d');
    const gr = fg.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(250,252,255,.95)'); gr.addColorStop(0.6, 'rgba(230,242,255,.7)'); gr.addColorStop(1, 'rgba(230,242,255,0)');
    fg.fillStyle = gr; fg.fillRect(0, 0, 128, 128);
    const frost = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48, 0, Math.PI * 2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: GEO.tex(fc), transparent: true, depthWrite: false, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
    frost.renderOrder = 1; root.add(frost);
    root.traverse(o => { if (o.isMesh && o !== ice && o !== frost) o.castShadow = true; });
    return { root, man, ice, edge, icicles, frost };
  }

  function build(sc) {
    scene = sc;
    const Z = TER.Z;
    const sx = Z.island.x - 1, sz = Z.island.z - 3.2;
    S = statue();
    S.x = sx; S.z = sz; S.y = TER.H(sx, sz) - 0.05;
    S.g.position.set(sx, S.y, sz);
    // 서랍은 섬 가운데 쪽을 본다
    S.g.rotation.y = Math.atan2(Z.island.x - sx, Z.island.z - sz);
    scene.add(S.g);
    COL.circle(sx, sz, 0.72, S.y - 1, S.y + 3);
    // 정답: 공주가 미르 성을 바라보는 칸. 처음엔 정반대를 본다
    const want = Math.atan2(Z.castle.x - sx, Z.castle.z - sz) - S.g.rotation.y;
    S.target = ((Math.round(want / STEP) % 8) + 8) % 8;
    // 얼음할아버지: 섬이 아니라 다리 건너 반대편 물가의 뭍 — 얼음과 눈에 파묻혀 있다
    //   (사장님 2026-09-21 "할아버지는 호수섬에 있는게 아니라 호수섬에서 횃불을 얻으면 반대편에 길이 생겨서 걸어나가서 만나는거야")
    //   전엔 석상 등 뒤 섬 가장자리(2026-09-19), 그 전엔 들판(Z.frost). 횃불을 얻으면 다리와 함께 드러난다
    bridgeBuild();
    F = frozen();
    if (br) {
      const cx = br.dir.cx, cz = br.dir.cz;
      let r = 2.6;   // 다리 끝에서 뭍으로 몇 걸음 — 땅이 낮거나 나무·집에 막히면 더 간다
      for (let t = 2.6; t < 9; t += 0.25) { const x = br.land.x + cx * t, z = br.land.z + cz * t; if (TER.H(x, z) > 0.45 && !COL.inside(x, TER.H(x, z) + 0.8, z, 1.2)) { r = t; break; } }
      F.x = br.land.x + cx * r; F.z = br.land.z + cz * r; F.dx = cx; F.dz = cz; F.dist = r;
      F.from = { x: br.land.x, z: br.land.z };
    } else {
      F.x = sx + 5; F.z = sz; F.dx = 1; F.dz = 0; F.dist = 5; F.from = { x: sx, z: sz };
    }
    F.y = TER.H(F.x, F.z);
    F.root.position.set(F.x, F.y - 0.02, F.z);
    F.root.rotation.y = Math.atan2(F.from.x - F.x, F.from.z - F.z);   // 다리(오는 길) 쪽을 본다
    snowPath();
    scene.add(F.root);
    // 서리 원판을 땅 굴곡에 맞춘다 (평평한 판은 비탈에서 풀에 묻혀 모가 난다)
    { F.root.updateMatrixWorld(true); const p = F.frost.geometry.attributes.position, v = new V3();
      for (let i = 0; i < p.count; i++) { v.set(p.getX(i), 0, p.getZ(i)).applyMatrix4(F.root.matrixWorld); p.setY(i, TER.H(v.x, v.z) - F.y + 0.07); }
      p.needsUpdate = true; F.frost.geometry.computeVertexNormals(); }
    F.col = COL.circle(F.x, F.z, 0.9, F.y - 1, F.y + 2.5);
    apply();
  }

  // ── 호수섬 다리 (사장님 2026-09-19 "멧돼지 4마리 잡고 물고기 도감 다 채우면 호수섬으로 가는 다리가 생겨나서 걸어 들어갈 수 있게")
  //   그 전엔 섬 둘레가 막혀 헤엄쳐 올라갈 수 없다. 조건이 차면 물가에서 섬 쪽으로 널판이 하나씩 솟아 다리가 된다
  const KILLS = 4, BR_Y = 0.5, BR_W = 1.7;
  let br = null;
  function bridgeBuild() {
    const I = TER.Z.island;
    // 섬 땅 반지름 → 둘레를 막는 원
    let rIsl = 4;
    for (let a = 0; a < 6.28; a += 0.2) for (let r = 2; r < 30; r += 0.25) { if (TER.H(I.x + Math.cos(a) * r, I.z + Math.sin(a) * r) < -0.25) { rIsl = Math.max(rIsl, r); break; } }
    const block = COL.circle(I.x, I.z, rIsl + 0.8, -8, 40, 'isl');
    // 다리 방향: 마을에서 섬으로 오는 방향의 반대편(±55°) 물가 중 가장 가까운 곳 (나무·집에 막히지 않은 곳)
    //   (사장님 2026-09-21 "반대편에 길이 생겨서 걸어나가서") — 반대편에 뭍이 없으면 아무 곳이나 가장 가까운 곳
    const V = TER.Z.village || { x: 0, z: 24 }, tgt = Math.atan2(I.z - V.z, I.x - V.x);
    const adiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    let best = null, any = null;
    for (let a = 0; a < 6.28; a += 0.04) {
      const cx = Math.cos(a), cz = Math.sin(a);
      let e = null;
      for (let r = 2; r < 140; r += 0.25) {
        const x = I.x + cx * r, z = I.z + cz * r, h = TER.H(x, z);
        if (e == null) { if (h < -0.1) e = r; continue; }
        if (h > 0.4) {
          const ex = I.x + cx * (r + 1.5), ez = I.z + cz * (r + 1.5);
          if (!COL.inside(ex, TER.H(ex, ez) + 0.8, ez, 1.0)) {
            const c = { a, cx, cz, e, s: r };
            if (!any || r - e < any.s - any.e) any = c;
            if (adiff(a, tgt) < 0.96 && (!best || r - e < best.s - best.e)) best = c;
          }
          break;
        }
      }
    }
    if (!best) best = any;
    if (!best) return;
    const r0 = best.e - 1.8, r1 = best.s + 1.4, len = r1 - r0, mid = (r0 + r1) / 2;
    const bx = I.x + best.cx * mid, bz = I.z + best.cz * mid;
    const g = new THREE.Group(); g.position.set(bx, 0, bz); g.rotation.y = -best.a;   // 로컬 +x 가 섬→뭍
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: 0x5a3e26, roughness: 0.95 });
    const planks = [], n = Math.ceil(len / 0.32);
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, BR_W * (0.94 + Math.random() * 0.06)), i % 3 ? wood : dark);
      const x = -len / 2 + (i + 0.5) * len / n;
      p.position.set(x, BR_Y - 0.03, (Math.random() - 0.5) * 0.04); p.rotation.y = (Math.random() - 0.5) * 0.04;
      p.castShadow = true; p.receiveShadow = true; g.add(p);
      planks.push({ m: p, x, far: 1 - (i + 0.5) / n });   // far: 뭍에서 섬 쪽으로 갈수록 크다 (뭍부터 솟는다)
    }
    for (let x = -len / 2 + 0.6; x < len / 2; x += 2.2) for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.2, 6).translate(0, BR_Y + 0.35 - 1.6, 0), dark);
      post.position.set(x, 0, s * (BR_W / 2 + 0.05)); post.castShadow = true; g.add(post);
      planks.push({ m: post, x, far: 1 - (x + len / 2) / len, post: true });
    }
    for (const s of [-1, 1]) {   // 난간 줄
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), dark); rail.position.set(0, BR_Y + 0.62, s * (BR_W / 2 + 0.05)); g.add(rail);
      planks.push({ m: rail, x: 0, far: 0, rail: true });
    }
    for (const q of planks) q.y0 = q.m.position.y;
    g.visible = false; scene.add(g);
    // 발판(위에 올라선다)과 난간(옆으로 못 떨어지게) — 다리가 생기기 전엔 꺼 둔다
    const deck = COL.box(bx, bz, len / 2, BR_W / 2, best.a, BR_Y - 0.6, BR_Y, 'bridge'); deck.top = true;
    const rails = [-1, 1].map(s => COL.box(bx - best.cz * s * (BR_W / 2 + 0.1), bz + best.cx * s * (BR_W / 2 + 0.1), len / 2 - 1.2, 0.06, best.a, BR_Y, BR_Y + 0.9, 'bridge'));
    br = { g, planks, block, rIsl: block.r, deck, rails, t: -1, len, dir: { cx: best.cx, cz: best.cz }, land: { x: I.x + best.cx * r1, z: I.z + best.cz * r1 } };   // land: 다리 끝 뭍
    setBridge(!!st().bridge, true);
  }
  function setBridge(on, now) {
    if (!br) return;
    br.block.r = (on || st().open) ? 0 : br.rIsl;   // 섬 둘레는 1만 코인(open)부터 풀린다 — 헤엄쳐 들어간다
    br.deck.hw = on ? br.len / 2 : 0; br.deck.hd = on ? BR_W / 2 : 0;
    for (const r of br.rails) r.hw = on ? br.len / 2 - 1.2 : 0;
    br.g.visible = on;
    if (on && now) { for (const q of br.planks) q.m.position.y = q.y0; br.t = -1; }
  }
  // 순서 (사장님 2026-09-20 "횃불얻기전엔 수영해서 들어가고 횃불얻은다음에 길이 열려서 걸어나오는거야" → A):
  //   1만 코인(사장님 2026-09-19) → 섬 둘레가 풀려 헤엄쳐 들어간다(T.isl.open) → 석상 서랍의 횃불(key 2) → 반대편으로 다리가 솟고 그 끝 뭍에 얼음할아버지(T.isl.bridge, 2026-09-21)
  const OPEN_COINS = 10000;
  function bridgeReady() { return T.coins >= OPEN_COINS; }
  function bridgeTick(dt) {
    if (!br) return;
    const s = st();
    if (!s.open && T.mode === 'play' && bridgeReady()) {
      s.open = 1; U.save();
      br.block.r = 0;
      AUD.sfx('new'); HUD.praise('🏝 ' + L('호수 섬에 갈 수 있다', 'You can reach the island now'));
    }
    if (!s.bridge && T.mode === 'play' && s.key >= 2) {
      s.bridge = 1; U.save();
      setBridge(true, false);
      br.t = 0;
      for (const q of br.planks) q.m.position.y = q.y0 - 2.2;
      reveal(true, false);   // 다리 끝 뭍의 디딤돌·얼음할아버지도 같이 솟는다
      AUD.sfx('new'); HUD.praise('🌉 ' + L('호숫길이 열렸다', 'The lake path is open'));
    }
    if (br.t >= 0) {   // 뭍부터 섬 쪽으로 널판이 물 위로 솟는다 (4초)
      br.t += dt;
      for (const q of br.planks) {
        const k = U.clamp((br.t - q.far * 3.0) / 0.6, 0, 1), e = 1 - Math.pow(1 - k, 3);
        q.m.position.y = q.y0 - 2.2 * (1 - e);
        if (!q.post && !q.rail && k > 0 && !q.done) { q.done = true; if (Math.random() < 0.5) AUD.sfx('splash', 0.35); }
      }
      if (window.CAM) CAM.shake = Math.max(CAM.shake || 0, 0.03);
      if (br.t > 4.2) br.t = -1;
    }
  }

  // ── 석상 뒤 눈길: 납작한 디딤돌이 석상에서 할아버지까지 차례로 솟는다 + 얼음 둘레 눈더미 ──
  let path = null;
  function snowPath() {
    const g = new THREE.Group(), stones = [];
    const stoneM = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.9, flatShading: true });
    const snowM = new THREE.MeshStandardMaterial({ color: 0xf2f6fc, roughness: 0.95 });
    const r = U.mulberry(31);
    const n = Math.max(3, Math.round((F.dist - 1.0) / 0.62));
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, d = 0.3 + k * (F.dist - 1.3), side = (i % 2 ? 1 : -1) * 0.18;
      const x = F.from.x + F.dx * d - F.dz * side, z = F.from.z + F.dz * d + F.dx * side, y = TER.H(x, z);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.28 + r() * 0.06, 0.32, 0.12, 7), stoneM);
      st.position.set(x, y + 0.02, z); st.rotation.y = r() * 6; st.scale.set(1, 1, 0.8 + r() * 0.3); st.receiveShadow = true; st.castShadow = true;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 4, 0, 6.3, 0, 1.2), snowM);
      cap.position.y = 0.04; cap.scale.set(1, 0.28, 0.85); st.add(cap);
      g.add(st); stones.push({ m: st, y0: st.position.y, k });
    }
    // 얼음 둘레와 위에 쌓인 눈
    const drifts = new THREE.Group();
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * 6.28 + r(), rr = 0.75 + r() * 0.35;
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.34 + r() * 0.2, 10, 6, 0, 6.3, 0, 1.6), snowM);
      m.position.set(Math.cos(a) * rr, -0.05, Math.sin(a) * rr * 0.85); m.scale.set(1, 0.55 + r() * 0.3, 1); m.castShadow = true; drifts.add(m);
    }
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 6, 0, 6.3, 0, 1.3), snowM);
    top.position.y = 2.3; top.scale.set(1.25, 0.35, 1.05); drifts.add(top);
    F.root.add(drifts); F.drifts = drifts;
    g.visible = false; scene.add(g);
    path = { g, stones, t: -1 };
  }
  // 드러나기: now 면 바로, 아니면 디딤돌이 다리 쪽부터 솟는다(2.4초). 횃불을 얻어 다리가 생길 때 함께(key 2)
  function reveal(on, now) {
    if (!path || !F) return;
    path.g.visible = on; F.root.visible = on;
    if (F.col) F.col.r = on ? (st().key >= 3 ? 0.4 : 0.9) : 0;
    if (on && !now) { path.t = 0; for (const q of path.stones) q.m.position.y = q.y0 - 0.5; F.root.position.y = F.y - 2.6; }
    else { path.t = -1; for (const q of path.stones) q.m.position.y = q.y0; F.root.position.y = F.y - 0.02; }
  }
  function pathTick(dt) {
    if (!path || path.t < 0) return;
    path.t += dt;
    for (const q of path.stones) { const u = U.clamp((path.t - q.k * 1.6) / 0.5, 0, 1); q.m.position.y = q.y0 - 0.5 * (1 - u * u * (3 - 2 * u)); }
    const u = U.clamp((path.t - 1.4) / 1.4, 0, 1), e = 1 - Math.pow(1 - u, 3);   // 할아버지(얼음·눈)가 땅에서 솟는다
    F.root.position.y = F.y - 0.02 - 2.6 * (1 - e);
    if (Math.random() < dt * 20) steam(F.x + (Math.random() - 0.5) * 1.6, F.y + 0.2, F.z + (Math.random() - 0.5) * 1.6);
    if (window.CAM) CAM.shake = Math.max(CAM.shake || 0, 0.05);
    if (path.t > 3.0) { path.t = -1; F.root.position.y = F.y - 0.02; }
  }

  // 저장된 상태를 모양에 옮긴다
  function apply() {
    if (!S) return;
    const s = st();
    if (s.rot == null) s.rot = 0;
    if (br) setBridge(!!s.bridge, true);
    reveal(s.key >= 2, true);
    S.rot.rotation.y = ((S.target + 4 + s.rot) % 8) * STEP;
    const open = s.key >= 1;
    S.drawer.position.z = open ? 0.72 : 0.47;
    S.key.visible = s.key === 1;
    if (F) {
      const free = s.key >= 3;
      F.ice.visible = F.edge.visible = F.icicles.visible = !free;
      if (!free) { F.ice.scale.set(1, 1, 1); F.ice.position.y = 1.15; F.ice.material.opacity = 0.5; }
      F.frost.material.opacity = free ? 0.35 : 1;
      if (free && F.col) { F.col.r = 0.4; }
      if (F.drifts) F.drifts.children[F.drifts.children.length - 1].visible = !free;   // 녹으면 위에 쌓인 눈도 없다
    }
  }
  const facing = () => ((S.target + 4 + st().rot) % 8) === S.target;

  function near() {
    if (!S) return null;
    const s = st();
    if (F && s.key < 3 && meltT <= -9 && Math.hypot(F.x - PL.pos.x, F.z - PL.pos.z) < 2.2)
      return s.key === 2 && TOOLS.held('torch') ? { kind: 'isl', a: 'open', label: 'E 🔥' } : { kind: 'full', label: '🧊' };
    if (turn || drawerT >= 0) return null;
    const d = Math.hypot(S.x - PL.pos.x, S.z - PL.pos.z);
    if (d > 1.9 || PL.pos.y < S.y - 0.5) return null;
    if (s.key === 1) return { kind: 'isl', a: 'key', label: 'E 🔥' };
    if (s.key === 0) return { kind: 'isl', a: 'turn', label: 'E ↻' };
    return null;
  }

  function act(n) {
    const s = st();
    if (n.a === 'turn') {
      // 받침돌에 두 손을 대고 민다 (믹사모 Pushing) — 손이 닿게 한 걸음 붙는다
      { const dx = PL.pos.x - S.x, dz = PL.pos.z - S.z, dd = Math.hypot(dx, dz) || 1; PL.pos.x = S.x + dx / dd * 1.05; PL.pos.z = S.z + dz / dd * 1.05; }
      PL.yaw = Math.atan2(S.x - PL.pos.x, S.z - PL.pos.z);
      PLAYER.doAct(PLAYER.CH.acts.push ? 'push' : 'pick', 1.0, { speed: 1.1 });
      turn = { t: 0, from: S.rot.rotation.y };
      s.rot = (s.rot + 1) % 8;
      AUD.sfx('grind');
    } else if (n.a === 'key') {
      PL.yaw = Math.atan2(S.x - PL.pos.x, S.z - PL.pos.z);
      PLAYER.doAct('pick', 1.1, { speed: 2.2, from: 0.6 });
      setTimeout(() => { s.key = 2; S.key.visible = false; TOOLS.take('torch'); AUD.sfx('puff'); FX.pop('🔥', PL.pos); U.save(); }, 500);
    } else if (n.a === 'open') {
      // 횃불을 얼음 바로 앞 땅에 꽂는다 → 불이 커지며 얼음이 김을 뿜고 녹아 내려앉는다 → 할아버지가 풀려난다
      PL.yaw = Math.atan2(F.x - PL.pos.x, F.z - PL.pos.z);
      PLAYER.doAct('pick', 1.2, { speed: 2.2, from: 0.6 });
      const dx = PL.pos.x - F.x, dz = PL.pos.z - F.z, d = Math.hypot(dx, dz) || 1;
      const px = F.x + dx / d * 0.95, pz = F.z + dz / d * 0.95;
      plant = new V3(px, TER.H(px, pz) + 0.22, pz);
      meltT = -0.6;   // 손이 땅에 닿을 때까지
    }
  }

  function update(dt) {
    if (!S) return;
    bridgeTick(dt);
    pathTick(dt);
    const s = st();
    if (turn) {
      turn.t += dt;
      const k = Math.min(1, turn.t / 0.9), e = k * k * (3 - 2 * k);
      S.rot.rotation.y = turn.from + STEP * e;
      if (window.CAM && k < 1) CAM.shake = Math.max(CAM.shake || 0, 0.04);
      if (k >= 1) {
        turn = null; apply();
        if (facing() && s.key === 0) { drawerT = 0; AUD.sfx('grind'); U.save(); }
        else U.save();
      }
    }
    if (drawerT >= 0) {
      drawerT += dt;
      const k = Math.min(1, drawerT / 1.2);
      S.drawer.position.z = 0.47 + 0.25 * k;
      if (drawerT > 1.2) {
        S.key.visible = true;
        const u = Math.min(1, (drawerT - 1.2) / 0.6);
        S.key.position.y = 0.62 + u * 0.1;
        if (u >= 1) { drawerT = -1; s.key = 1; AUD.sfx('new'); U.save(); AUD.sfx('grind'); }
      }
    }
    if (S.key.visible) { flicker(S.key, 1); if (drawerT < 0) S.key.position.y = 0.72 + Math.sin(T.time * 2) * 0.02; }
    handTick();
    if (F && meltT > -9) {
      const was = meltT;
      meltT += dt;
      if (was < 0 && meltT >= 0) { AUD.sfx('puff'); AUD.sfx('hiss', 1); }
      const k = Math.max(0, Math.min(1, meltT / MELT));
      // 얼음이 위에서부터 녹아 내려앉는다
      F.ice.scale.set(1 - k * 0.25, Math.max(0.02, 1 - k), 1 - k * 0.25);
      F.ice.position.y = 1.15 * F.ice.scale.y;
      F.ice.material.opacity = 0.5 * (1 - k * 0.6);
      F.edge.visible = k < 0.15; F.icicles.visible = k < 0.35;
      if (meltT > 0.2 && Math.random() < dt * 18) steam(F.x + (Math.random() - 0.5) * 1.2, F.y + 2.3 * F.ice.scale.y, F.z + (Math.random() - 0.5) * 1.0);
      if (meltT > 0 && Math.random() < dt * 4) AUD.sfx('hiss', 0.4);
      if (meltT > 0.3 && Math.random() < dt * 10 && window.FEEL) FEEL.drip(new V3(F.x + (Math.random() - 0.5) * 1.3, F.y + 2.2 * F.ice.scale.y, F.z + (Math.random() - 0.5) * 1.1));
      F.frost.material.opacity = 1 - k * 0.5;
      if (meltT >= MELT && F.ice.visible) { F.ice.visible = false; AUD.sfx('splash'); if (window.FEEL) FEEL.splash(new V3(F.x, F.y + 0.1, F.z), 14); }
      if (meltT > MELT + 0.6) {
        meltT = -9; plant = null; s.key = 3; if (T.tool === 'torch') T.tool = null; apply();   // 횃불은 다 탔다
        AUD.sfx('puff');   // 다 녹이고 횃불은 타서 꺼진다
        // 선물 대신 소원 — 할아버지가 인사하고 나면 엔딩 (사장님 2026-09-19 "주인공 소원은 고사리꽃이 아니라 얼음할아버지가 이뤄주는 거로")
        AUD.sfx('new');
        // 고맙다는 말 7초 → 고사리꽃 이야기 6초를 다 읽힌 뒤에 엔딩으로 (사장님 2026-10-01 "고사리꽃 대사 하는게 휙 지나갔으니까 고쳐주고")
        //   전엔 5초 만에 대화창이 닫히고, 고사리꽃 대사는 엔딩으로 넘어가기 직전 0.7초만 스쳤다
        thankT = THANK_SECS + FERN_SECS;
        // 대사 둘을 듣는 13초 동안 주인공은 할아버지를 보고 서 있는다
        PL.lockT = THANK_SECS + FERN_SECS; PL.vel.x = PL.vel.z = 0;
        PL.yaw = Math.atan2(F.x - PL.pos.x, F.z - PL.pos.z);
        U.save();
        if (window.AUD && AUD.endMusic) AUD.endMusic(true);   // 엔딩 음악은 얼음이 다 녹은 때부터 (같은 날 "따뜻한 음악을 깔아줘 엔딩에")
        setTimeout(() => { if (window.GAME && GAME.frostEnd) GAME.frostEnd(F); }, (THANK_SECS + FERN_SECS - 1.5) * 1000);
      }
    }
    if (thankT > 0) thankT -= dt;
    // 풀려난 할아버지: 숨 쉬듯 들썩이고 지팡이 결정이 반짝, 둘레에 눈송이
    if (F && s.key >= 3) {
      F.man.g.position.y = Math.sin(T.time * 1.6) * 0.015;
      F.man.star.rotation.y += dt * 1.5;
      F.man.star.material.emissiveIntensity = 0.8 + Math.sin(T.time * 4) * 0.4;
      flakeT -= dt;
      if (flakeT <= 0 && Math.hypot(F.x - PL.pos.x, F.z - PL.pos.z) < 40) {
        flakeT = 0.12;
        const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.03, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        f.position.set(F.x + (Math.random() - 0.5) * 3, F.y + 2.6, F.z + (Math.random() - 0.5) * 3);
        f.userData.v = new V3((Math.random() - 0.5) * 0.3, -0.5 - Math.random() * 0.3, (Math.random() - 0.5) * 0.3);
        scene.add(f); flakes.push(f);
      }
    }
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i]; f.position.addScaledVector(f.userData.v, dt); f.rotation.y += dt * 3;
      if (f.position.y < F.y + 0.05) { scene.remove(f); f.geometry.dispose(); f.material.dispose(); flakes.splice(i, 1); }
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const p = shards[i];
      if (p.userData.steam) { p.position.addScaledVector(p.userData.v, dt); p.scale.multiplyScalar(1 + dt * 1.2); p.userData.life -= dt; p.material.opacity = 0.45 * Math.max(0, p.userData.life / 1.4); if (p.userData.life <= 0) { scene.remove(p); p.material.dispose(); shards.splice(i, 1); } continue; }
      p.userData.v.y -= 9.8 * dt; p.position.addScaledVector(p.userData.v, dt);
      p.rotation.x += dt * 6; p.rotation.z += dt * 4;
      const g = TER.H(p.position.x, p.position.z);
      if (p.position.y < g + 0.03) { p.position.y = g + 0.03; p.userData.v.set(0, 0, 0); p.userData.life -= dt * 2; }
      p.userData.life -= dt * 0.35;
      p.material.opacity = Math.max(0, Math.min(1, p.userData.life));
      if (p.userData.life <= 0) { scene.remove(p); p.geometry.dispose(); p.material.dispose(); shards.splice(i, 1); }
    }
  }
  // 김 한 줄기
  let steamTex = null;
  function steam(x, y, z) {
    if (!steamTex) { const c = GEO.canvas(64, 64), g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); steamTex = GEO.tex(c); }
    const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0.45, depthWrite: false }));
    p.scale.setScalar(0.35);
    p.position.set(x, y, z); p.userData.v = new V3((Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.5, (Math.random() - 0.5) * 0.3); p.userData.life = 1.4; p.userData.steam = true;
    scene.add(p); shards.push(p);
  }
  // 조각이 튀어 떨어진다
  function burst(at, color, n, size) {
    for (let i = 0; i < n; i++) {
      const p = new THREE.Mesh(new THREE.TetrahedronGeometry(size * (0.5 + Math.random()), 0), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 1, roughness: 0.2, metalness: color === 0xcfeaff ? 0.1 : 0.6 }));
      p.position.copy(at); p.position.x += (Math.random() - 0.5) * 1.2; p.position.y += (Math.random() - 0.5) * 1.6; p.position.z += (Math.random() - 0.5) * 1.0;
      p.userData.v = new V3((Math.random() - 0.5) * 5, 1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 5);
      p.userData.life = 1.6 + Math.random();
      scene.add(p); shards.push(p);
    }
  }

  // 들고 다니는 횃불 — 오른손에 세워 든다. 물통을 들었으면 등에 꽂고, 헤엄칠 땐 물에 안 닿게 숨긴다
  let hand = null;
  const _hp = new V3();
  function handTick() {
    const s = st();
    if (!hand) { hand = torchMesh(true); hand.visible = false; scene.add(hand); }
    const on = s.key === 2 && T.mode !== 'title' && (plant ? meltT < MELT + 0.4 : TOOLS.held('torch') && !PL.swim && PL.ch && PL.ch.holder.visible);
    hand.visible = on;
    if (!on) { if (hand.userData.light) hand.userData.light.intensity = 0; return; }
    const B = PLAYER.CH.bones;
    if (plant && meltT >= 0) {
      // 얼음 앞 땅에 꽂힌 채 타오른다 (얼음 쪽으로 살짝 기울여)
      hand.position.copy(plant); hand.rotation.set(-0.25, Math.atan2(F.x - plant.x, F.z - plant.z), 0, 'YXZ');
      flicker(hand, 1.5 * (1 - Math.max(0, meltT - MELT) / 0.4));
      return;
    } else if ((T.items.water || 0) > 0 || PL.climb) {
      B.Spine2.getWorldPosition(_hp);
      hand.position.set(_hp.x - Math.sin(PL.yaw) * 0.2 + Math.cos(PL.yaw) * 0.1, _hp.y - 0.25, _hp.z - Math.cos(PL.yaw) * 0.2 - Math.sin(PL.yaw) * 0.1);
      hand.rotation.set(-0.35, PL.yaw, 0.25, 'YXZ');
    } else {
      B.RightHand.getWorldPosition(_hp);
      hand.position.set(_hp.x, _hp.y - 0.12, _hp.z); hand.rotation.set(0.15, PL.yaw, 0, 'YXZ');
    }
    flicker(hand, 1);
  }

  // 할아버지 곁 대화 (quests.js 가 대화창에 띄운다)
  function talk() {
    if (!F || st().key < 3 || T.mode !== 'play') return null;
    if (Math.hypot(F.x - PL.pos.x, F.z - PL.pos.z) > (thankT > 0 ? 9 : 3.5)) return null;
    // 엔딩 대사 둘은 정해진 시간 동안 닫히지 않는다(hold) — 평소의 '5초 뒤 닫기'에 걸리지 않게
    return { r: { p: 'frost', P: NAME }, line: thankT > FERN_SECS ? THANK : DONE, hold: thankT > 0 };
  }

  // 열쇠를 가졌으면 얼음할아버지 쪽으로 안내 (items.js guide)
  function goal() {
    const s = st();
    if (F && s.key === 2) return { x: F.x, z: F.z };
    if (S && (s.open || s.bridge) && s.key < 2) return { x: S.x, z: S.z };   // 섬에 갈 수 있으면 석상으로 (헤엄쳐서)
    return null;
  }

  window.ISLAND = { build, apply, near, act, update, goal, talk, NAME, THANK, DONE, bridgeReady, torchMesh, flicker, get S() { return S; }, get F() { return F; }, get br() { return br; } };
})();
