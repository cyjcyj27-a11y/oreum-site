// 카트 4종 · 동물 운전자 8명 · 아케이드 주행 물리 (부딪힘은 PHYS)
(function () {
  const G = SCENERY.G, M = SCENERY.M, sh = SCENERY.sh;
  const mix = (a, b, f) => new THREE.Color(a).lerp(new THREE.Color(b), f).getHex();

  // 카트 4종 (Meshy GLB, 2026-09-24 사장님 "4대만 하자"): 이름 · 색(GLB 못 읽을 때 도형용) · 스탯(최고속도/가속/접지) · 값
  const KARTS = [
    { name: '파랑 씽씽', glb: 'kart1', body: 0x2f7fd8, acc: 1.00, top: 1.00, grip: 1.00, style: 0, coin: 0 },
    { name: '분홍 토끼', glb: 'kart2', body: 0xf06a9a, acc: 1.10, top: 0.96, grip: 1.04, style: 2, coin: 1100 },
    { name: '초록 거북', glb: 'kart3', body: 0x3fa05a, acc: 1.08, top: 1.04, grip: 1.02, style: 3, coin: 2500 },
    { name: '노랑 부릉', glb: 'kart4', body: 0xf2c332, acc: 1.10, top: 1.14, grip: 1.06, style: 5, coin: 4800 },
  ];

  // 운전자 = 동물 넷: 냥이(고양이)·토리(토끼)·판이(판다)·여리(여우) — 이름은 사장님이 지음(2026-09-24). 경주는 앞 넷만 쓴다. 아래 색·머리 값은 GLB 를 못 읽을 때 쓰는 옛 도형 운전자용
  // 아이 8명: 머리색 · 옷색 · 모자색 · 피부 · 머리 모양(style) · 쓴 것(gear)
  // 동물마다 스킬 하나 (2026-09-24 사장님 "각자의 스킬 넣은 설명문으로 캐릭터 고르게해"). CPU 도 같은 스킬을 쓴다
  const SKILLS = {
    kitty: { name: '드리프트 달인', desc: '드리프트 부스트가 1.5배 빨리 모여요' },
    bunny: { name: '번개 뒷발', desc: '↑↑ 부스터를 18초마다 쓸 수 있어요 (다른 선수는 30초)' },
    panda: { name: '튼튼한 몸', desc: '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)' },
    fox: { name: '꼬리 바람', desc: '최고 속도가 6% 더 빨라요' },
  };
  const DRIVERS = [
    { name: '냥이', glb: 'kitty', hair: 0x2a1c16, cloth: 0xe8523a, hat: 0xf2f2ee, skin: 0xf2cba6, style: 'short', gear: 'helmet' },
    { name: '토리', glb: 'bunny', hair: 0x35241a, cloth: 0x2f7fd8, hat: 0xf5d23a, skin: 0xf6d3b0, style: 'pony', gear: 'cap' },
    { name: '판이', glb: 'panda', hair: 0x1e1712, cloth: 0x3fa05a, hat: 0x2c2f38, skin: 0xe8bd94, style: 'spiky', gear: 'helmet' },
    { name: '여리', glb: 'fox', hair: 0x4a3324, cloth: 0xf06a9a, hat: 0xf06a9a, skin: 0xf7d9bb, style: 'bob', gear: 'band' },
    { name: '냥이', glb: 'kitty', hair: 0x241a14, cloth: 0xf2c332, hat: 0x2f7fd8, skin: 0xefc79f, style: 'short', gear: 'beanie' },
    { name: '토리', glb: 'bunny', hair: 0x3a2418, cloth: 0x8a5ad8, hat: 0xeceae2, skin: 0xf6d6b6, style: 'bun', gear: 'helmet' },
    { name: '판이', glb: 'panda', hair: 0x2a1c16, cloth: 0x27b6b0, hat: 0xf07a22, skin: 0xe9c098, style: 'bob', gear: 'cap' },
    { name: '여리', glb: 'fox', hair: 0xd8c8a8, cloth: 0xffffff, hat: 0xf5a0c0, skin: 0xf0e0c8, style: 'cat', gear: 'cat', cat: true },
  ];

  // 번호판 (앞 코와 양옆 포드)
  function plateTex(n, body) {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 96;
    const c = cv.getContext('2d');
    c.fillStyle = '#f6f4ee';
    c.fillRect(0, 0, 128, 96);
    c.fillStyle = '#' + new THREE.Color(body).getHexString();
    c.fillRect(0, 0, 128, 12);
    c.fillStyle = '#1c1c22';
    c.font = 'bold 66px Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(n), 64, 56);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function plates(tex) {
    // 세 장의 판을 한 지오메트리로 (그리기 명령 하나)
    const pos = [], uv = [], idx = [], nor = [];
    const quad = (cx, cy, cz, w, h, ry, rx) => {
      const b = pos.length / 3;
      const m = M(cx, cy, cz, 1, 1, 1, ry, rx);
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      const n = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const v = new THREE.Vector3();
      [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].forEach(([x, y], i) => {
        v.set(x, y, 0).applyMatrix4(m);
        pos.push(v.x, v.y, v.z);
        uv.push(i === 0 || i === 3 ? 0 : 1, i < 2 ? 0 : 1);
        nor.push(n.x, n.y, n.z);
      });
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    quad(0, 0.66, 1.12, 0.42, 0.3, 0, -0.85);          // 앞 코 위
    quad(0.75, 0.54, -0.1, 0.36, 0.26, Math.PI / 2, 0);  // 오른 포드
    quad(-0.75, 0.54, -0.1, 0.36, 0.26, -Math.PI / 2, 0); // 왼 포드
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: tex }));
  }

  // ---------- 동물 운전자 GLB ----------
  // Blender 로 앉힌 자세(원점 = 엉덩이 관절, 앞 = +z). 다 오기 전엔 자리(seat)만 두고, 오면 모든 카트에 앉힌다.
  // file:// 로 열면 fetch 가 막혀 assets/drivers/<이름>.glb.js 사본을 읽는다 (python tools/pack_glbjs.py)
  const DRV_FIT = { scale: 0.74, x: 0, y: 0.7, z: -0.36 };
  const MODELS = {}, seats = [];
  let drvWaiting = 0;
  function glbBuf(url) {
    if (location.protocol !== 'file:') return fetch(url).then((r) => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); });
    return new Promise((res, rej) => {
      const key = url.split('/').pop();
      const sc = document.createElement('script');
      sc.src = url + '.js';
      sc.onload = () => {
        const b64 = window.GLBJS && window.GLBJS[key];
        if (!b64) return rej(new Error(key + ' 사본 없음'));
        const b = atob(b64), u = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        window.GLBJS[key] = null;
        res(u.buffer);
      };
      sc.onerror = () => rej(new Error(key + '.js 못 읽음'));
      document.head.appendChild(sc);
    });
  }
  function seatFill(seat) {
    const m = MODELS[seat.userData.glb];
    if (!m || seat.children.length) return;
    seat.add(m.clone());
    if (seat.userData.old) seat.userData.old.visible = false;   // 옛 도형 운전자가 있었으면 감춘다
  }
  function loadDrivers() {
    if (!window.GLTFLoaderClass) return;
    const want = [...new Set(DRIVERS.map((d) => d.glb).filter(Boolean))];
    drvWaiting = want.length;
    want.forEach((n) => {
      glbBuf('assets/drivers/' + n + '.glb')
        .then((buf) => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej)))
        .then((gltf) => {
          const o = gltf.scene;
          o.traverse((c) => {
            if (!c.isMesh) return;
            const map = c.material.map;
            if (map) { map.anisotropy = 16; map.colorSpace = THREE.SRGBColorSpace; }
            // 해를 등진 뒷모습도 어둡지 않게: 제 색으로 조금 빛난다 (2026-09-24 "캐릭터를 비추는 조명이 어두운거같애")
            c.material = new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.38 });
            c.castShadow = true;
            c.userData.keep = true;   // 여러 카트가 같이 쓰는 모양 — 카트를 지울 때 dispose 하지 않는다
          });
          const w = new THREE.Group();
          w.add(o);
          w.scale.setScalar(DRV_FIT.scale);
          w.position.set(DRV_FIT.x, DRV_FIT.y, DRV_FIT.z);
          MODELS[n] = w;
        })
        .catch((e) => console.warn('운전자 GLB', n, e))
        .finally(() => {
          for (let i = seats.length - 1; i >= 0; i--) {
            if (!seats[i].parent) { seats.splice(i, 1); continue; }   // 치운 카트는 명단에서 뺀다
            seatFill(seats[i]);
          }
          if (--drvWaiting === 0 && KART.onDrivers) KART.onDrivers();
        });
    });
  }

  // ---------- 카트 GLB ----------
  // Blender 에서 바퀴 넷을 떼어 낸 모델(body + wheel_FL/FR/BL/BR). 길이를 KART_LEN 에 맞추고 바퀴 바닥을 y=0 에 둔다.
  // 다 오기 전엔 도형 카트로 달리다가 오면 그 자리에서 바꿔 끼운다(dressKart)
  const KART_LEN = 2.9;
  const KMODELS = {}, kartsWaiting = [];
  let kartsPending = 0;
  function loadKarts() {
    if (!window.GLTFLoaderClass) return;
    const want = KARTS.map((k) => k.glb).filter(Boolean);
    kartsPending = want.length;
    want.forEach((n) => {
      glbBuf('assets/karts/' + n + '.glb')
        .then((buf) => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej)))
        .then((gltf) => {
          const root = gltf.scene;
          root.updateMatrixWorld(true);
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const k = KART_LEN / size.z;
          const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
          const toKart = (v) => new THREE.Vector3((v.x - cx) * k, (v.y - box.min.y) * k, (v.z - cz) * k);
          const parts = { body: [], wheels: [] };
          root.traverse((c) => {
            if (!c.isMesh) return;
            const map = c.material.map;
            if (map) { map.anisotropy = 16; map.colorSpace = THREE.SRGBColorSpace; }
            const mat = new THREE.MeshLambertMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });   // 카트도 밝게 (그늘 쪽이 칙칙하지 않게)
            const m = new THREE.Mesh(c.geometry, mat);
            m.castShadow = true;
            m.userData.keep = true;
            const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
            c.matrixWorld.decompose(p, q, sc);
            m.quaternion.copy(q);
            m.scale.copy(sc).multiplyScalar(k);
            let node = c;
            while (node && !/^wheel/.test(node.name)) node = node.parent;
            if (node) {
              parts.wheels.push({ mesh: m, at: toKart(p) });   // 바퀴 가운데 = 메쉬 원점
            } else {
              m.position.copy(toKart(p));
              parts.body.push(m);
            }
          });
          // 바퀴 순서는 도형 카트와 같게: 앞오른·앞왼·뒤오른·뒤왼 (앞 = +z, 오른 = +x)
          parts.wheels.sort((a, b) => (b.at.z > 0) - (a.at.z > 0) || b.at.x - a.at.x);
          KMODELS[n] = parts;
        })
        .catch((e) => console.warn('카트 GLB', n, e))
        .finally(() => {
          kartsPending--;
          for (let i = kartsWaiting.length - 1; i >= 0; i--) {
            const g = kartsWaiting[i];
            if (KMODELS[g.userData.kart.glb] || !kartsPending) { kartsWaiting.splice(i, 1); dressKart(g); }
          }
          if (!kartsPending && KART.onKarts) KART.onKarts();
        });
    });
  }
  // 도형 카트 → GLB 카트. 도형 운전자는 카트 몸통과 한 덩어리라 그땐 바꾸지 않는다
  function dressKart(g) {
    const P = KMODELS[g.userData.kart.glb];
    if (!P || !g.userData.seat) return false;
    g.userData.proc.forEach((o) => g.remove(o));
    P.body.forEach((m) => g.add(m.clone()));
    g.userData.wheels = P.wheels.map((wd) => {
      const w = new THREE.Group();
      w.position.copy(wd.at);
      w.userData.y0 = wd.at.y;
      w.add(wd.mesh.clone());
      g.add(w);
      return w;
    });
    const f = g.userData.kart.seat || {};   // 카트마다 따로 맞출 땐 KARTS 에 seat: {y, z}
    g.userData.seat.position.set(0, f.y != null ? f.y : -0.32, f.z != null ? f.z : 0.05);   // 도형 카트 좌석보다 낮다
    return true;
  }

  // 카트 한 대 만들기 (Group). num: 번호(1~8)
  function make(kartIdx, driverIdx, num) {
    const K = KARTS[kartIdx % KARTS.length], D = DRIVERS[driverIdx % DRIVERS.length];
    const g = new THREE.Group();
    const bag = new SCENERY.Bag(), glow = new SCENERY.Bag();
    const body = K.body, bodyD = sh(body, 0.72), bodyL = sh(body, 1.14);
    const steel = 0x3a3f48, steelL = 0x9aa0a8, rubber = 0x1e2024;
    const B = (geo, col, x, y, z, sx, sy, sz, ry, rx, rz) => bag.add(geo, col, M(x, y, z, sx, sy, sz, ry, rx, rz));
    const E = (geo, col, x, y, z, sx, sy, sz, ry, rx, rz) => glow.add(geo, col, M(x, y, z, sx, sy, sz, ry, rx, rz));

    // ---- 차대 ----
    B(G.box, 0x2a2d33, 0, 0.3, 0, 1.06, 0.08, 2.05);                 // 바닥 판
    for (const s of [-1, 1]) B(G.box, steel, s * 0.62, 0.33, 0, 0.08, 0.1, 2.25); // 옆 레일
    B(G.cyl, steel, 0, 0.32, 1.58, 0.1, 1.2, 0.1, 0, 0, Math.PI / 2);   // 앞 범퍼 바
    B(G.cyl, steel, 0, 0.34, -1.2, 0.1, 1.3, 0.1, 0, 0, Math.PI / 2);   // 뒤 범퍼 바
    for (const s of [-1, 1]) { B(G.box, steel, s * 0.5, 0.32, 1.45, 0.06, 0.06, 0.3); B(G.box, steel, s * 0.55, 0.34, -1.08, 0.06, 0.06, 0.3); }

    // ---- 몸통 ----
    B(G.box, body, 0, 0.52, -0.1, 1.0, 0.36, 1.5);                    // 통
    B(G.box, bodyL, 0, 0.71, -0.1, 0.88, 0.06, 1.36);                 // 윗면 밝은 띠
    B(G.box, bodyD, 0, 0.36, -0.1, 1.04, 0.06, 1.54);                 // 아랫단 어두운 띠
    B(G.cone, body, 0, 0.5, 1.22, 1.0, 0.86, 0.38, 0, Math.PI / 2);   // 앞코
    B(G.cone, bodyL, 0, 0.6, 1.2, 0.6, 0.8, 0.14, 0, Math.PI / 2);    // 앞코 하이라이트
    for (const s of [-1, 1]) {                                        // 옆 포드
      B(G.box, sh(body, 0.92), s * 0.62, 0.5, -0.15, 0.24, 0.28, 1.15);
      B(G.box, bodyL, s * 0.62, 0.65, -0.15, 0.2, 0.04, 1.05);
      B(G.box, 0x1c1f24, s * 0.62, 0.42, 0.42, 0.26, 0.1, 0.16);      // 포드 앞 흡기구
    }
    B(G.box, sh(body, 0.85), 0, 0.8, 0.52, 0.72, 0.22, 0.24);         // 계기판 덮개
    B(G.box, 0x1c1f24, 0, 0.86, 0.42, 0.5, 0.08, 0.08);               // 계기
    // 엔진
    B(G.box, steel, 0, 0.62, -0.96, 0.62, 0.36, 0.42);
    B(G.box, 0x50565e, 0, 0.82, -0.96, 0.5, 0.06, 0.34);
    for (const s of [-1, 1]) {
      B(G.cyl, 0x50565e, s * 0.16, 0.86, -0.96, 0.12, 0.12, 0.12);
      B(G.cyl, steelL, s * 0.3, 0.56, -1.28, 0.13, 0.5, 0.13, 0, Math.PI / 2 - 0.22); // 배기관
      B(G.cyl, 0x111214, s * 0.3, 0.52, -1.52, 0.09, 0.06, 0.09, 0, Math.PI / 2 - 0.22);
    }
    // 좌석
    B(G.box, 0x2e3138, 0, 0.7, -0.4, 0.58, 0.12, 0.5);
    B(G.box, 0x24272d, 0, 1.0, -0.68, 0.6, 0.66, 0.14, 0, -0.14);
    for (const s of [-1, 1]) B(G.box, 0x2e3138, s * 0.3, 0.9, -0.6, 0.08, 0.4, 0.3, 0, -0.14);
    B(G.box, 0x1c1f24, 0, 1.28, -0.72, 0.32, 0.16, 0.12, 0, -0.14);   // 머리받침
    // 롤바
    for (const s of [-1, 1]) B(G.cyl, bodyD, s * 0.32, 1.05, -0.8, 0.07, 0.72, 0.07);
    B(G.box, bodyD, 0, 1.42, -0.8, 0.72, 0.07, 0.07);
    // 핸들 (기둥 + 테 + 살)
    B(G.box, steel, 0, 0.82, 0.38, 0.06, 0.06, 0.34, 0, 0.9);
    B(G.tor, 0x1c1f24, 0, 0.94, 0.28, 0.4, 0.4, 0.4, 0, -0.5);
    B(G.sph, 0x2a2d33, 0, 0.94, 0.28, 0.12, 0.12, 0.08, 0, -0.5);
    for (const a of [0, 2.1, -2.1]) B(G.box, 0x2a2d33, 0, 0.94, 0.28, 0.04, 0.34, 0.03, 0, -0.5, a);
    // 등·후미등
    for (const s of [-1, 1]) {
      E(G.box, 0xfff2c8, s * 0.3, 0.5, 1.5, 0.16, 0.1, 0.06);
      E(G.box, 0xff4a3a, s * 0.36, 0.6, -1.19, 0.18, 0.08, 0.05);
    }
    // 모양 변형
    if (K.style >= 1) { // 뒷날개
      for (const s of [-1, 1]) B(G.box, bodyD, s * 0.44, 0.98, -1.05, 0.06, 0.4, 0.26);
      B(G.box, sh(body, 0.9), 0, 1.2, -1.08, 1.2, 0.06, 0.36, 0, -0.18);
      for (const s of [-1, 1]) B(G.box, bodyL, s * 0.62, 1.2, -1.08, 0.04, 0.22, 0.4);
    }
    if (K.style >= 2) { // 앞날개
      B(G.box, sh(body, 0.9), 0, 0.3, 1.6, 1.3, 0.05, 0.3);
      for (const s of [-1, 1]) B(G.box, bodyL, s * 0.66, 0.36, 1.6, 0.04, 0.16, 0.34);
    }
    if (K.style >= 3) for (const s of [-1, 1]) { B(G.box, 0xf6f4ee, s * 0.12, 0.745, -0.1, 0.1, 0.012, 1.34); B(G.box, 0xf6f4ee, s * 0.08, 0.68, 1.15, 0.06, 0.012, 0.6, 0, 0.2); }
    if (K.style >= 4) E(G.box, 0x7de8ff, 0, 0.25, -0.1, 0.84, 0.04, 1.5);
    if (K.style >= 5) { // 깃발 + 왕관 문장
      B(G.cyl, steelL, 0.34, 1.75, -0.8, 0.03, 0.7, 0.03);
      B(G.box, 0xffe14a, 0.5, 2.0, -0.8, 0.32, 0.22, 0.02);
      E(G.box, 0xffe14a, 0, 0.72, 0.95, 0.22, 0.08, 0.06);
    }

    // ---- 운전자 ---- (GLB 동물을 못 읽었을 때만 도형으로)
    const useGlb = D.glb && (MODELS[D.glb] || drvWaiting > 0);
    if (!useGlb) {
      const skin = D.skin, skinD = sh(skin, 0.86), cloth = D.cloth, clothD = sh(cloth, 0.8), pants = mix(cloth, 0x2a2f44, 0.75);
      const hy = 0.78;                                                   // 엉덩이 높이
      for (const s of [-1, 1]) {                                        // 다리
        B(G.box, pants, s * 0.15, hy + 0.04, -0.12, 0.2, 0.17, 0.56, 0, 0.12);
        B(G.box, pants, s * 0.15, hy - 0.16, 0.2, 0.16, 0.36, 0.14, 0, 0.55);
        B(G.box, 0x2a2d33, s * 0.15, hy - 0.34, 0.42, 0.18, 0.1, 0.3, 0, 0.1);  // 신발
        B(G.box, 0xf2f2ee, s * 0.15, hy - 0.3, 0.55, 0.19, 0.06, 0.06);
      }
      B(G.box, cloth, 0, hy + 0.3, -0.4, 0.5, 0.5, 0.32);                // 몸통
      B(G.box, sh(cloth, 1.08), 0, hy + 0.36, -0.22, 0.46, 0.3, 0.06);    // 가슴 밝은 면
      B(G.box, 0x2a2d33, 0, hy + 0.08, -0.4, 0.52, 0.07, 0.34);           // 허리띠
      B(G.box, clothD, 0, hy + 0.52, -0.4, 0.34, 0.08, 0.3);              // 깃
      for (const s of [-1, 1]) {
        B(G.sph, cloth, s * 0.3, hy + 0.5, -0.4, 0.22, 0.2, 0.22);        // 어깨
        B(G.box, cloth, s * 0.32, hy + 0.4, -0.16, 0.15, 0.15, 0.44, 0, -0.5);   // 윗팔
        B(G.box, clothD, s * 0.28, hy + 0.24, 0.12, 0.13, 0.13, 0.36, 0, -0.25); // 아랫팔
        B(G.sphLo, skin, s * 0.21, hy + 0.17, 0.3, 0.15, 0.15, 0.15);     // 손 (핸들 테 위)
      }
      B(G.cyl, skin, 0, hy + 0.58, -0.4, 0.15, 0.14, 0.15);               // 목
      const HY = hy + 0.84, HZ = -0.38;                                   // 머리 중심
      B(G.sph, skin, 0, HY, HZ, 0.5, 0.52, 0.48);                         // 머리
      if (!D.cat) for (const s of [-1, 1]) B(G.sphLo, skinD, s * 0.25, HY - 0.02, HZ, 0.1, 0.12, 0.08);   // 귀
      // 얼굴 (앞 = +z)
      for (const s of [-1, 1]) {
        B(G.sphLo, 0xffffff, s * 0.1, HY + 0.02, HZ + 0.245, 0.14, 0.16, 0.07);
        B(G.sphLo, 0x23201c, s * 0.1, HY + 0.02, HZ + 0.27, 0.075, 0.095, 0.05);
        B(G.sphLo, 0xffffff, s * 0.1 - 0.02, HY + 0.05, HZ + 0.295, 0.028, 0.028, 0.02);
        B(G.box, D.hair, s * 0.1, HY + 0.13, HZ + 0.25, 0.12, 0.028, 0.03, 0, 0, s * 0.15);   // 눈썹
        B(G.sphLo, mix(skin, 0xf07a8a, 0.4), s * 0.16, HY - 0.06, HZ + 0.215, 0.1, 0.06, 0.05); // 볼
      }
      if (D.cat) B(G.sphLo, 0xf08aa8, 0, HY - 0.03, HZ + 0.26, 0.06, 0.045, 0.04);
      else B(G.sphLo, skinD, 0, HY - 0.04, HZ + 0.26, 0.06, 0.06, 0.05);                       // 코
      B(G.box, 0x8a3a3a, 0, HY - 0.12, HZ + 0.245, 0.1, 0.026, 0.02);                          // 입
      for (const s of [-1, 1]) B(G.box, 0x8a3a3a, s * 0.06, HY - 0.105, HZ + 0.245, 0.03, 0.02, 0.02); // 입꼬리
      if (D.cat) for (const s of [-1, 1]) for (const k of [-0.03, 0.02]) B(G.box, 0xf2f2ee, s * 0.22, HY - 0.05 + k, HZ + 0.2, 0.24, 0.012, 0.012, 0, 0, s * 0.12);
      // 머리카락
      const hair = D.hair, hairL = sh(hair, 1.25);
      if (D.style !== 'cat') {
        B(G.sph, hair, 0, HY + 0.12, HZ - 0.1, 0.52, 0.36, 0.48);        // 뒤통수·정수리 (앞은 얼굴을 안 가리게)
        B(G.sph, hairL, -0.12, HY + 0.26, HZ - 0.06, 0.2, 0.06, 0.24);  // 하이라이트
        for (let i = -1; i <= 1; i++) B(G.box, hair, i * 0.13, HY + 0.22, HZ + 0.17, 0.13, 0.1, 0.1, 0, 0.35, i * 0.1); // 앞머리
      }
      if (D.style === 'bob') for (const s of [-1, 1]) B(G.box, hair, s * 0.25, HY - 0.02, HZ - 0.1, 0.1, 0.4, 0.3);
      if (D.style === 'pony') { B(G.sph, hair, 0, HY + 0.08, HZ - 0.28, 0.18, 0.18, 0.18); B(G.box, hair, 0, HY - 0.16, HZ - 0.33, 0.12, 0.42, 0.12, 0, 0.25); }
      if (D.style === 'spiky') for (let i = 0; i < 4; i++) B(G.cone, hair, (i - 1.5) * 0.11, HY + 0.34, HZ - 0.02 + (i % 2) * 0.08, 0.12, 0.22, 0.12, 0, (i - 1.5) * -0.15, (i - 1.5) * 0.2);
      if (D.style === 'bun') B(G.sph, hair, 0, HY + 0.36, HZ - 0.12, 0.24, 0.22, 0.24);
      // 쓴 것
      const hat = D.hat, hatD = sh(hat, 0.8);
      if (D.gear === 'helmet') {
        B(G.sph, hat, 0, HY + 0.08, HZ - 0.14, 0.6, 0.58, 0.58);
        B(G.box, 0x1c1f24, 0, HY + 0.2, HZ + 0.13, 0.46, 0.08, 0.12);     // 이마 띠
        B(G.box, hatD, 0, HY + 0.34, HZ - 0.1, 0.12, 0.03, 0.5);         // 줄무늬
        B(G.box, sh(body, 1.0), 0, HY + 0.14, HZ - 0.4, 0.2, 0.14, 0.03); // 뒤 문장
      } else if (D.gear === 'cap') {
        B(G.sph, hat, 0, HY + 0.2, HZ - 0.08, 0.54, 0.3, 0.5);
        B(G.box, hatD, 0, HY + 0.2, HZ + 0.3, 0.44, 0.04, 0.3, 0, 0.15);
        B(G.sphLo, hatD, 0, HY + 0.34, HZ - 0.04, 0.08, 0.06, 0.08);
      } else if (D.gear === 'beanie') {
        B(G.sph, hat, 0, HY + 0.2, HZ - 0.08, 0.56, 0.42, 0.5);
        B(G.box, sh(hat, 1.12), 0, HY + 0.1, HZ - 0.08, 0.58, 0.1, 0.5);
        B(G.sphLo, 0xf6f4ee, 0, HY + 0.42, HZ - 0.06, 0.16, 0.16, 0.16);
      } else if (D.gear === 'band') {
        B(G.tor, hat, 0, HY + 0.16, HZ - 0.06, 0.56, 0.56, 0.56, 0, Math.PI / 2);
        B(G.box, hat, 0, HY + 0.2, HZ + 0.19, 0.14, 0.1, 0.06);
      } else if (D.gear === 'cat') {
        for (const s of [-1, 1]) {
          B(G.cone, skin, s * 0.17, HY + 0.32, HZ - 0.02, 0.2, 0.28, 0.16, 0, 0, s * -0.2);
          B(G.cone, 0xf08aa8, s * 0.17, HY + 0.3, HZ + 0.02, 0.1, 0.16, 0.08, 0, 0, s * -0.2);
        }
        B(G.box, hat, 0, HY - 0.3, HZ, 0.34, 0.08, 0.3); // 리본 목걸이
      }
    }

    const solid = bag.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }));
    solid.castShadow = true;
    g.add(solid);
    const proc = [solid];   // GLB 카트가 오면 떼어 낼 도형 부품
    const gm = glow.mesh(new THREE.MeshBasicMaterial({ vertexColors: true }));
    if (gm) { g.add(gm); proc.push(gm); }
    if (num) { const pl = plates(plateTex(num, body)); g.add(pl); proc.push(pl); }

    // ---- 바퀴 4개 (낱개, 굴리고 꺾는다) ----
    const rimCol = K.style >= 4 ? 0xe8c14a : K.style >= 2 ? 0x2a2d33 : 0xc9ced4;
    const wheels = [];
    const wpos = [[0.66, 0.34, 0.78], [-0.66, 0.34, 0.78], [0.72, 0.39, -0.8], [-0.72, 0.39, -0.8]];
    wpos.forEach((p, i) => {
      const s = i < 2 ? 1 : 1.15;
      const wb = new SCENERY.Bag();
      const Wd = (geo, col, sx, sy, sz) => wb.add(geo, col, M(0, 0, 0, sx, sy, sz, 0, 0, Math.PI / 2));
      Wd(G.cyl, rubber, 0.68 * s, 0.3, 0.68 * s);
      Wd(G.cyl, 0x141518, 0.69 * s, 0.05, 0.69 * s);            // 가운데 홈
      Wd(G.cyl, 0x2c3036, 0.66 * s, 0.32, 0.66 * s);            // 옆면 살짝 밝게
      Wd(G.cyl, rimCol, 0.38 * s, 0.34, 0.38 * s);
      Wd(G.cyl, sh(rimCol, 0.7), 0.3 * s, 0.35, 0.3 * s);
      for (let k = 0; k < 5; k++) wb.add(G.box, sh(rimCol, 1.15), M(0, 0, 0, 0.36, 0.32 * s, 0.05, 0, k * Math.PI * 2 / 5, 0));
      wb.add(G.sphLo, sh(rimCol, 0.9), M(0, 0, 0, 0.36, 0.12 * s, 0.12 * s, 0));
      const w = new THREE.Group();
      const mesh = wb.mesh(new THREE.MeshLambertMaterial({ vertexColors: true }));
      mesh.castShadow = true;
      w.add(mesh);
      w.position.set(p[0], p[1], p[2]);
      w.userData.y0 = p[1];
      g.add(w);
      wheels.push(w);
      proc.push(w);
    });

    // 그림자 판 (바닥에 붙는 흐린 타원)
    const shCv = document.createElement('canvas');
    shCv.width = shCv.height = 64;
    const sg = shCv.getContext('2d');
    const rg = sg.createRadialGradient(32, 32, 4, 32, 32, 30);
    rg.addColorStop(0, 'rgba(0,0,0,.55)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = rg;
    sg.fillRect(0, 0, 64, 64);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.1),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(shCv), transparent: true, depthWrite: false,
        opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8,
      }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.07;
    g.add(shadow);

    let seat = null;
    if (useGlb) {
      seat = new THREE.Group();
      seat.userData.glb = D.glb;
      g.add(seat);
      seatFill(seat);
      if (!seat.children.length) seats.push(seat);
    }

    g.rotation.order = 'YXZ';
    g.userData = { wheels, shadow, kart: K, driver: D, proc, seat };
    if (K.glb && !dressKart(g) && seat && kartsPending > 0) kartsWaiting.push(g);
    return g;
  }

  // ---------- 물리 ----------
  function State(opt) {
    this.pos = new THREE.Vector3();
    this.yaw = 0;          // 바라보는 방향
    this.vel = 0;          // 앞으로 가는 속도 m/s
    this.slip = 0;         // 미끄러짐 각 (드리프트)
    this.vy = 0;           // 위아래
    this.air = false;
    this.drift = 0;        // 드리프트 유지 시간
    this.driftDir = 0;
    this.boost = 0;        // 남은 부스트 시간
    this.spin = 0;         // 빙글(피격)
    this.hydro = 0;        // 물에 미끄러짐(옥돔): 몸은 돌고 가던 쪽으로 계속 미끄러진다
    this.hydroDir = 0;
    this.squash = 0;       // 납작(피격)
    this.slow = 0;         // 느려짐(피격)
    this.pitch = 0;        // 앞뒤 기울기 (가속·제동)
    this.bob = 0; this.bobV = 0; // 서스펜션 출렁임
    this.lap = 0;
    this.prog = 0;         // 총 진행 거리
    this.hint = 0;
    this.item = -1;
    this.itemCd = 0;
    this.shield = 0;
    this.place = 1;
    this.finished = false;
    this.time = 0;
    this.lapTimes = [];
    Object.assign(this, opt || {});
  }

  const TOP = 23.5;   // 기본 최고 속도 m/s
  const ACC = 13.5;   // 가속
  const REV = -9;     // 후진 속도
  const R = 0.82;     // 카트 반지름(부딪힘)

  // 한 프레임 굴리기. c: {thr, steer, drift}, K: 카트 스탯, T: 트랙, world: 되먹임 콜백
  function step(S, c, K, T, dt, world) {
    if (S.finished) c = { thr: 0.6, steer: 0, drift: false };
    const stat = K || { acc: 1, top: 1, grip: 1 };
    const loc = TRACK.locate(T, S.pos, S.hint);
    S.hint = loc.i;
    const off = Math.abs(loc.t) - loc.hw;
    const onRoad = off < 0.2;

    // 진행 거리 (뒤로 가면 줄어든다)
    let ds = loc.s - (S.lastS == null ? loc.s : S.lastS);
    if (ds > T.total * 0.5) ds -= T.total;
    if (ds < -T.total * 0.5) ds += T.total;
    S.prog += ds;
    S.lastS = loc.s;

    // 속도
    const v0 = S.vel;
    const boosting = S.boost > 0;
    const fox = S.skill === 'fox' ? 1.06 : 1;   // 여리: 꼬리 바람
    let top = TOP * stat.top * fox * (onRoad ? 1 : 0.62) * (S.slow > 0 ? 0.55 : 1);
    if (boosting) top = TOP * stat.top * fox * 1.62;
    let acc = ACC * stat.acc * (onRoad ? 1 : 0.7);
    if (boosting) acc = 40;
    if (S.spin > 0 || S.hydro > 0) c = { thr: 0, steer: 0, drift: false };

    if (c.thr > 0.05) S.vel += acc * c.thr * dt;
    else if (c.thr < -0.05) S.vel += (S.vel > 0 ? -26 : -15) * dt * -c.thr;   // 제동은 세게, 후진도 시원하게
    else S.vel -= (S.vel > 0 ? 7 : -7) * dt;
    if (S.vel > top) S.vel += (top - S.vel) * Math.min(1, dt * 3.2);
    if (S.vel < REV) S.vel = REV;
    if (!onRoad) S.vel -= 4.2 * dt * (S.vel > 0 ? 1 : -1);
    if (S.hydro > 0) S.vel = Math.max(0, v0 - 4 * dt);   // 물 위라 거의 안 느려진다
    if (Math.abs(S.vel) < 0.04) S.vel = 0;

    // 조향 (빠를수록 덜 꺾인다)
    const spd = Math.abs(S.vel);
    const sFactor = Math.min(1, 0.45 + spd / 26) * (spd < 0.4 ? 0 : 1);
    let turn = c.steer * 2.35 * sFactor * stat.grip * (S.vel < 0 ? -1 : 1);

    // 드리프트
    if (!S.air) {
      if (c.drift && spd > 8 && Math.abs(c.steer) > 0.25) {
        if (S.drift === 0) { S.driftDir = Math.sign(c.steer); S.drift = 0.0001; if (world && world.onDriftStart) world.onDriftStart(S); }
        if (Math.sign(c.steer) === S.driftDir || Math.abs(c.steer) < 0.3) S.drift += dt;
        turn = (S.driftDir * 1.25 + c.steer * 1.5) * sFactor * stat.grip;
        S.slip += (S.driftDir * 0.42 - S.slip) * Math.min(1, dt * 5);
      } else if (S.drift > 0) {
        const dm = S.skill === 'kitty' ? 1 / 1.5 : 1;   // 냥이: 드리프트 달인
        const lvl = S.drift > 2.4 * dm ? 3 : S.drift > 1.4 * dm ? 2 : S.drift > 0.65 * dm ? 1 : 0;
        if (lvl) {
          S.boost = Math.max(S.boost, [0, 0.55, 0.95, 1.5][lvl]);
          if (world && world.onMiniBoost) world.onMiniBoost(S, lvl);
        }
        S.drift = 0;
        S.driftDir = 0;
      }
    }
    if (S.drift === 0) S.slip += (0 - S.slip) * Math.min(1, dt * 6);

    if (S.spin > 0) { turn = 11; S.spin -= dt; }
    if (S.hydro > 0) { turn = 8.5; S.hydro -= dt; S.slip = 0; }
    S.yaw += turn * dt;

    // 이동 (물에 미끄러지는 동안은 맞은 순간 가던 쪽으로, 살짝 비틀비틀)
    const dir = S.hydro > 0 ? S.hydroDir + Math.sin(S.hydro * 7) * 0.08 : S.yaw + S.slip;
    const mv = S.vel * dt;
    S.pos.x += Math.sin(dir) * mv;
    S.pos.z += Math.cos(dir) * mv;

    // 소품·담장에 부딪히기
    if (window.PHYS) PHYS.resolve(S, R, dt, world);

    // 높이 (도로·인도는 도로 높이, 밖은 비탈. 언덕 넘으면 살짝 뜬다)
    const loc2 = TRACK.locate(T, S.pos, S.hint);
    const groundY = TRACK.groundY(T, loc2);
    if (S.air) {
      S.vy -= 24 * dt;
      S.pos.y += S.vy * dt;
      if (S.pos.y <= groundY) {
        S.pos.y = groundY; S.air = false;
        S.bobV = Math.max(-2.4, S.vy * 0.18);      // 착지 출렁
        S.vy = 0;
        if (world && world.onLand) world.onLand(S);
      }
    } else {
      const dy = groundY - S.pos.y;
      if (dy < -0.35 && spd > 9) { S.air = true; S.vy = Math.max(0, spd * 0.11); }
      else S.pos.y += dy * Math.min(1, dt * 12);
    }

    // 맨 바깥 안전 벽 (경계 담장 너머로 튀어나갔을 때만)
    const off2 = Math.abs(loc2.t) - loc2.hw;
    const LIM = TRACK.SIDE - 1.2; // 담장 안쪽 면(3.23) 앞. 넘어가 있으면 무조건 끌어들인다
    if (off2 > LIM) {
      const push = off2 - LIM, sgn = Math.sign(loc2.t);
      S.pos.x -= loc2.side.x * sgn * push;
      S.pos.z -= loc2.side.z * sgn * push;
      S.vel *= 0.9;
    }

    // 몸 기울기: 가속하면 코가 들리고 제동하면 숙인다, 서스펜션은 스프링
    const accel = (S.vel - v0) / Math.max(dt, 1e-3);
    const wantPitch = S.air ? -Math.min(0.28, Math.max(-0.1, S.vy * 0.03)) : Math.max(-0.1, Math.min(0.08, -accel * 0.006));
    S.pitch += (wantPitch - S.pitch) * Math.min(1, dt * 6);
    S.bobV += (-S.bob * 70 - S.bobV * 9) * dt;
    S.bob += S.bobV * dt;

    // 상태 줄이기
    if (S.boost > 0) S.boost -= dt;
    if (S.slow > 0) S.slow -= dt;
    if (S.shield > 0) S.shield -= dt;
    if (S.squash > 0) S.squash -= dt;
    if (S.itemCd > 0) S.itemCd -= dt;
    S.onRoad = onRoad;
    S.loc = loc2;
    S.groundY = groundY;
    return loc2;
  }

  // 카트끼리 부딪힘 (밀어내고, 속도를 나눠 갖고, 살짝 튕긴다)
  function bump(a, b) {
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 2.0 || d < 0.001) return false;
    const nx = dx / d, nz = dz / d, push = (2.0 - d) * 0.5;
    a.pos.x -= nx * push; a.pos.z -= nz * push;
    b.pos.x += nx * push; b.pos.z += nz * push;
    const va = a.vel, vb = b.vel;
    a.vel = va * 0.92 + (vb - va) * 0.1;
    b.vel = vb * 0.92 + (va - vb) * 0.1;
    // 옆에서 맞으면 머리가 조금 돌아간다
    const side = Math.cos(a.yaw) * nx - Math.sin(a.yaw) * nz;
    a.yaw -= side * 0.03; b.yaw += side * 0.03;
    a.bobV -= 0.5; b.bobV -= 0.5;
    return true;
  }

  // 모양 반영 (바퀴 굴림·조향·기울기·납작·출렁)
  function pose(g, S, c, dt) {
    g.position.copy(S.pos);
    g.position.y += S.bob * 0.35;
    g.rotation.y = S.yaw + S.slip * 0.75;
    g.rotation.x = S.pitch;
    g.rotation.z = -S.slip * 0.5 - (c ? c.steer : 0) * 0.035 * Math.min(1, Math.abs(S.vel) / 15);
    const w = g.userData.wheels;
    const roll = S.vel * dt * 2.6;
    for (let i = 0; i < 4; i++) {
      w[i].rotation.x -= roll;
      if (i < 2) w[i].rotation.y = (c ? c.steer : 0) * 0.5;
      w[i].position.y = w[i].userData.y0 - S.bob * 0.35;   // 바퀴는 땅에 남고 몸만 출렁인다
    }
    const sq = S.squash > 0 ? 1 - Math.min(0.55, S.squash) : 1;
    g.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
    const sd = g.userData.shadow;
    const drop = S.groundY != null ? Math.max(0, S.pos.y - S.groundY) : 0;
    sd.position.y = 0.07 - drop - S.bob * 0.35;
    const k2 = 1 / (1 + drop * 0.22);
    sd.scale.set(k2, k2, 1);
    sd.material.opacity = 0.75 * k2;
    sd.rotation.x = -Math.PI / 2 - S.pitch;
  }

  const KART = window.KART = { KARTS, DRIVERS, make, State, step, bump, pose, TOP, R, DRV_FIT, glbBuf, dressKart, SKILLS,
    // 동물만 따로 (캐릭터 보기 창): 엉덩이 관절이 원점, 크기는 카트에 앉힐 때와 같다
    driverModel: (n) => { const m = MODELS[n]; if (!m) return null; const c = m.clone(); c.position.set(0, 0, 0); return c; }, onDrivers: null, onKarts: null };
  loadDrivers();
  loadKarts();
})();
