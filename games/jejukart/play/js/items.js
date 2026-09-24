// 아이템 상자와 4종 아이템 (한라봉·조랑말·옥돔·돌하르방)
(function () {
  // 과녁은 모두 같다: 바로 앞 카트, 1등이면 바로 뒤 카트 (game.js aimTarget, 사람에겐 빨간 조준 표시)
  const KIND = [
    { id: 'hallabong', icon: '🍊', name: '한라봉' },   // 과녁에게 포물선으로 던진다
    { id: 'pony', icon: '🐴', name: '조랑말' },        // 과녁 앞 길가에서 튀어나와 들이받는다
    { id: 'okdom', icon: '🐟', name: '옥돔' },         // 과녁 코앞에 날아가 앉아 물을 뿜는다. 웅덩이·옥돔을 밟으면 미끄러진다
    { id: 'harubang', icon: '🗿', name: '돌하르방' },  // 과녁 머리 위로 떨어진다
  ];

  // 순위에 따라 다른 것이 나온다 (앞설수록 약한 것)
  function roll(place, total) {
    const f = (place - 1) / Math.max(1, total - 1); // 0 = 1등
    const w = [
      1.3 + f * 0.2,              // hallabong
      0.4 + f * 0.9,              // pony
      1.6 - f * 1.0,              // okdom
      f > 0.4 ? f * 1.4 : 0.05,   // harubang
    ];
    let s = w.reduce((a, b) => a + b, 0), r = Math.random() * s;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return 0;
  }

  // ---------- 아이템 모양 ----------
  // assets/items/<id>.glb 가 있으면 그걸 쓰고(바닥 = y0, 가운데 정렬, 앞 = +z), 없으면 도형으로 임시 모양.
  // 크기는 GLB 가 어떻게 오든 키(또는 길이)로 맞춘다
  // GLB 는 Blender(items bake.py)에서 앞(한라봉은 날아가는 쪽)을 +z 로 맞춰 구웠다
  const FIT = { hallabong: { h: 0.95 }, pony: { l: 3.89 }, okdom: { l: 1.6 }, harubang: { h: 2.6 } };
  const ICON = {};   // 아이템 칸 그림 (모델을 렌더해 뜬 dataURL). 없으면 이모지
  const MODELS = {}, dressed = [];
  const L = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0 });
  function shape(id) {
    const g = new THREE.Group();
    const add = (geo, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); m.castShadow = true; g.add(m); return m; };
    const sph = new THREE.SphereGeometry(0.5, 14, 10), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
    if (id === 'hallabong') {
      add(sph, L(0xf08a1c, 0x3a1a00), 0, 0.4, 0, 0.9, 0.8, 0.9);
      add(sph, L(0xf08a1c, 0x3a1a00), 0, 0.82, 0, 0.36, 0.3, 0.36);      // 볼록 꼭지
      add(box, L(0x3f8a2a), 0.1, 0.98, 0, 0.26, 0.03, 0.12);             // 잎
    } else if (id === 'okdom') {
      add(sph, L(0xe8605a), 0, 0.14, 0, 1.2, 0.26, 0.42);
      add(sph, L(0xf4c0a0), 0, 0.1, 0.04, 1.0, 0.16, 0.34);
      add(box, L(0xd8504a), -0.72, 0.14, 0, 0.3, 0.06, 0.4);             // 꼬리
      add(sph, L(0x202020), 0.46, 0.2, 0.14, 0.08, 0.08, 0.05);          // 눈
    } else if (id === 'pony') {
      const c = L(0x8a5a36), d = L(0x4a2e1c);
      add(box, c, 0, 1.05, 0, 0.55, 0.55, 1.2);                          // 몸
      for (const x of [-0.18, 0.18]) for (const z of [-0.45, 0.45]) add(box, c, x, 0.4, z, 0.16, 0.8, 0.16);
      add(box, c, 0, 1.45, 0.62, 0.3, 0.6, 0.3);                         // 목
      add(box, c, 0, 1.7, 0.85, 0.3, 0.3, 0.55);                         // 머리
      add(box, d, 0, 1.6, 0.45, 0.08, 0.6, 0.3);                         // 갈기
      add(box, d, 0, 1.0, -0.66, 0.12, 0.5, 0.12);                       // 꼬리
    } else if (id === 'harubang') {
      const st = L(0x6a6862);
      add(cyl, st, 0, 0.8, 0, 1.0, 1.6, 0.9);                            // 몸
      add(sph, st, 0, 1.85, 0, 0.95, 1.05, 0.9);                         // 얼굴
      add(cyl, st, 0, 2.45, 0, 0.8, 0.4, 0.8);                           // 벙거지
      for (const x of [-0.2, 0.2]) add(sph, L(0x3a3934), x, 1.95, 0.4, 0.2, 0.2, 0.1);   // 왕방울 눈
      add(sph, st, 0, 1.75, 0.45, 0.22, 0.3, 0.2);                        // 코
    }
    return g;
  }
  function fit(o, id) {
    const w = new THREE.Group();
    w.add(o);
    const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3());
    const f = FIT[id], k = f.h ? f.h / sz.y : f.l / Math.max(sz.x, sz.z);
    o.scale.setScalar(k);
    o.position.set(-(b.min.x + b.max.x) / 2 * k, -b.min.y * k, -(b.min.z + b.max.z) / 2 * k);
    return w;
  }
  // holder 에 모양을 입힌다. GLB 가 나중에 오면 바꿔 끼운다
  function dress(holder, id) {
    holder.userData.itemId = id;
    holder.clear();
    holder.add(MODELS[id] ? MODELS[id].clone() : shape(id));
    if (!MODELS[id]) dressed.push(holder);
    return holder;
  }
  // 아이템 칸 그림: 작은 렌더러로 비스듬히 한 장
  let iconR = null;
  function iconOf(model) {
    try {
      if (!iconR) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = 128;
        iconR = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
        iconR.setPixelRatio(1);
        iconR.setSize(128, 128, false);
        iconR.outputColorSpace = THREE.SRGBColorSpace;
      }
      const sc = new THREE.Scene();
      sc.add(new THREE.HemisphereLight(0xffffff, 0x5a5f6a, 1.6));
      const dl = new THREE.DirectionalLight(0xffffff, 1.4);
      dl.position.set(3, 5, 6);
      sc.add(dl);
      const m = model.clone();
      m.rotation.y = 0.55;
      sc.add(m);
      const b = new THREE.Box3().setFromObject(m), c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() / 2;
      const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      cam.position.set(c.x, c.y + r * 0.35, c.z + r / Math.tan(15 * Math.PI / 180) * 0.8);
      cam.lookAt(c);
      iconR.setClearColor(0x000000, 0);
      iconR.render(sc, cam);
      return iconR.domElement.toDataURL('image/png');
    } catch (e) { return null; }
  }
  function loadModels() {
    if (!window.GLTFLoaderClass || !window.KART || !KART.glbBuf) return;
    KIND.forEach(({ id }) => {
      KART.glbBuf('assets/items/' + id + '.glb')
        .then((buf) => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej)))
        .then((gltf) => {
          gltf.scene.traverse((c) => {
            if (!c.isMesh) return;
            const map = c.material.map;
            if (map) { map.anisotropy = 16; map.colorSpace = THREE.SRGBColorSpace; }
            c.material = new THREE.MeshLambertMaterial({ map, color: map ? 0xffffff : c.material.color, emissive: map ? 0xffffff : 0x000000, emissiveMap: map || null, emissiveIntensity: 0.35 });   // 아이템도 밝게
            c.castShadow = true;
            c.userData.keep = true;
          });
          MODELS[id] = fit(gltf.scene, id);
          ICON[id] = iconOf(MODELS[id]);
          for (let i = dressed.length - 1; i >= 0; i--) {
            const h = dressed[i];
            if (h.userData.itemId !== id) continue;
            dressed.splice(i, 1);
            if (h.parent) dress(h, id);
          }
        })
        .catch(() => {});   // 아직 모델이 없으면 도형 그대로
    });
  }

  function qTex() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d');
    c.fillStyle = '#ffd634';
    c.fillRect(0, 0, 64, 64);
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.fillRect(0, 0, 64, 10);
    c.fillStyle = 'rgba(0,0,0,.14)';
    c.fillRect(0, 54, 64, 10);
    c.fillStyle = '#7a4a00';
    c.font = 'bold 44px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('?', 32, 35);
    return new THREE.CanvasTexture(cv);
  }
  let TEX = null;
  function boxMesh() {
    if (!TEX) TEX = qTex();
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshLambertMaterial({ map: TEX, emissive: 0x4a3200 }));
    const e = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.62, 1.62),
      new THREE.MeshBasicMaterial({ color: 0xfff0a0, wireframe: true, transparent: true, opacity: 0.4 }));
    g.add(m, e);
    return g;
  }

  // 코스를 따라 상자를 놓는다
  function init(scene, T, count) {
    const boxes = [];
    const proto = boxMesh();
    // 한 줄에 4개(카트 수만큼) — 앞 카트들이 다 먹어 뒤에 빈 줄만 남던 것
    const n = count || Math.max(5, Math.round(T.total / 130));
    for (let k = 0; k < n; k++) {
      const s = (k + 0.5) / n * T.total;
      const a = TRACK.at(T, s);
      for (let c = -1.5; c <= 1.5; c++) {
        const g = proto.clone();
        const p = a.p.clone().addScaledVector(a.side, c * a.hw * 0.42);   // 도로 높이 (띄우는 건 game.js 에서 한 번만)
        g.position.copy(p);
        scene.add(g);
        boxes.push({ g, p, cd: 0 });
      }
    }
    return boxes;
  }

  window.ITEMS = { KIND, roll, init, boxMesh, dress, FIT, ICON };
  if (window.KART && KART.afterDrivers) KART.afterDrivers(loadModels); else loadModels();   // 동물 모델이 먼저
})();
