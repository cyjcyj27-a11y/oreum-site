// 피어싱: 손님 머리 옆모습 + 귀(코드로 빚음) + 펜 점 + 바늘 + 장신구
// 귀 좌표(cm): ex 는 뒤통수 쪽 +, ey 는 위 +. 세계에서는 귀가 머리 오른쪽(+X)에 붙고 얼굴은 +Z, 카메라는 +X 쪽에서 봄
(function () {
  const E = (window.EAR = {});
  // 귀 윤곽(앞 위 붙은 곳 → 헬릭스 → 뒤 → 귓불 → 앞 아래 붙은 곳)
  const OUT = [[-0.15, 1.75], [0.45, 2.85], [1.35, 3.3], [2.3, 3.0], [2.95, 2.1], [3.05, 0.95], [2.8, -0.2], [2.35, -1.25], [1.95, -2.15], [1.6, -2.85], [1.0, -3.15], [0.35, -2.95], [-0.05, -2.35], [-0.2, -1.6]];
  const CEN = [1.0, 0.25];
  function catmull(pts, n) { const out = [], N = pts.length; for (let i = 0; i < N; i++) { const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } return out; }
  const RING = catmull(OUT, 10); // 140점
  const NR = RING.length, NS = 22;
  // 윤곽 위 자리 t(0~1)가 어느 부분인가: 헬릭스(위·뒤) / 귓불(아래) / 앞(머리에 붙음)
  const sm = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  // 부분마다 무게(경계는 부드럽게): 귓불 wl, 앞(머리에 붙은 쪽) wf
  const zone = (t) => { const a = t * OUT.length; const wl = sm(6.8, 8.0, a) * (1 - sm(12.0, 13.0, a)); const wf = Math.max(sm(12.4, 13.4, a), 1 - sm(0.0, 0.8, a)); return { helix: a > 0.3 && a < 7.6 ? 1 : 0, lobe: a > 7.4 && a < 12.6 ? 1 : 0, front: a >= 12.6 || a <= 0.3 ? 1 : 0, wl, wf, a }; };

  E.init = function (scene) {
    const g = (E.g = new THREE.Group()); scene.add(g); g.visible = false;
    E.skinMat = new THREE.MeshStandardMaterial({ color: '#e9b896', roughness: 0.55 });
    E.earMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide });
    // 머리(달걀꼴) — 귀 둘레만 보임
    const hg = new THREE.SphereGeometry(1, 64, 48); hg.scale(7.4, 10.2, 9.0);
    E.head = new THREE.Mesh(hg, E.skinMat); E.head.position.set(0, 1.0, 0.6); E.head.castShadow = E.head.receiveShadow = true; g.add(E.head);
    // 턱·목
    const ng = new THREE.CylinderGeometry(5.2, 5.8, 12, 40, 1, true); E.neck = new THREE.Mesh(ng, E.skinMat); E.neck.position.set(0, -11.2, -0.8); E.neck.receiveShadow = true; g.add(E.neck);
    const jaw = new THREE.SphereGeometry(1, 40, 30); jaw.scale(6.4, 5.5, 7.6); E.jaw = new THREE.Mesh(jaw, E.skinMat); E.jaw.position.set(0, -6.2, 3.9); E.jaw.receiveShadow = true; g.add(E.jaw);
    // 머리카락(뒤·위를 덮는 모자꼴 + 결 그림)
    E.hairC = RND.cv2(512, 512); E.hairT = RND.tex(E.hairC); E.hairT.wrapS = E.hairT.wrapT = THREE.RepeatWrapping; E.hairT.repeat.set(3, 1);
    E.hairMat = new THREE.MeshStandardMaterial({ map: E.hairT, roughness: 0.6, color: '#ffffff' });
    E.hair = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.5), E.hairMat); E.hair.scale.set(7.75, 10.55, 9.35); E.hair.position.set(0, 1.4, 0.2); E.hair.rotation.x = -0.62; E.hair.castShadow = true; g.add(E.hair);
    E.longHair = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 8.4, 16, 40, 1, true, Math.PI * 0.45, Math.PI * 1.1), E.hairMat); E.longHair.position.set(0, -6, -1.6); E.longHair.castShadow = true; g.add(E.longHair);
    // 어깨(검은 티)
    E.shirtMat = new THREE.MeshStandardMaterial({ color: '#1d1d22', roughness: 0.9 });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(9, 16, 10, 40), E.shirtMat); sh.position.set(0, -20, -0.8); sh.receiveShadow = true; g.add(sh);
    // 귀
    E.ear = new THREE.Group(); E.ear.position.set(7.75, -0.4, 0.2); g.add(E.ear);
    // 귀 로컬: x=뒤(세계 -Z), y=위, z=바깥(세계 +X). 귀 겉면은 바깥·살짝 앞을 봄
    E.ear.rotation.y = Math.PI / 2 - 0.42;
    E.earMesh = new THREE.Mesh(buildEarGeo(), E.earMat); E.earMesh.castShadow = E.earMesh.receiveShadow = true; E.ear.add(E.earMesh);
    E.rim = new THREE.Mesh(buildRimGeo(), E.earMat); E.rim.castShadow = true; E.ear.add(E.rim);
    // 트라거스(귓구멍 앞 작은 살)
    const tg = new THREE.SphereGeometry(1, 20, 14); tg.scale(0.3, 0.46, 0.2);
    colorGeo(tg, '#e9b896', 0.04);
    E.tragus = new THREE.Mesh(tg, E.earMat); E.tragus.position.set(-0.08, -0.2, -0.04); E.tragus.rotation.y = 0.5; E.ear.add(E.tragus);
    // 펜 점·바늘·장신구 자리
    E.dots = new THREE.Group(); E.ear.add(E.dots);
    E.jew = new THREE.Group(); E.ear.add(E.jew);
    const steel = new THREE.MeshStandardMaterial({ color: '#e6eaee', metalness: 0.95, roughness: 0.18 });
    E.steel = steel; E.gold = new THREE.MeshStandardMaterial({ color: '#e8b84a', metalness: 0.95, roughness: 0.22 });
    E.needle = new THREE.Group();
    const nd = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 12), steel); nd.position.y = 2.5; E.needle.add(nd);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 12), steel); tip.rotation.x = Math.PI; tip.position.y = -0.15; E.needle.add(tip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 12), new THREE.MeshStandardMaterial({ color: '#3a7ad8', roughness: 0.4 })); hub.position.y = 5.2; E.needle.add(hub);
    E.needle.visible = false; E.needle.traverse((o) => (o.castShadow = true)); E.ear.add(E.needle);
    E.marks = [];
  };
  function colorGeo(geo, base, dark) {
    const c = new THREE.Color(base); const n = geo.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r * (1 - dark); col[i * 3 + 1] = c.g * (1 - dark); col[i * 3 + 2] = c.b * (1 - dark); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  // 귀 판: 가운데(귓구멍 근처)에서 윤곽까지 고리 NS 개, 높이로 콘크 우묵·안쪽 둔덕·바깥 고랑
  function earH(s, z) {
    let h = -0.75 * Math.pow(Math.max(0, 1 - s / 0.5), 1.6); // 콘크 우묵(가운데는 모두 같게)
    const ridge = 0.42 * Math.exp(-Math.pow((s - 0.6) / 0.11, 2)) - 0.22 * Math.exp(-Math.pow((s - 0.83) / 0.07, 2)); // 안쪽 둔덕·바깥 고랑
    h += ridge * (1 - z.wf) * (1 - z.wl) + 0.18 * Math.pow(s, 6);
    // 귓불: 가운데에서 멀어지면 도톰하고 평평하게
    const lob = 0.12 + 0.05 * s;
    return h * (1 - z.wl * sm(0.3, 0.62, s)) + lob * z.wl * sm(0.3, 0.62, s);
  }
  E.earH = earH;
  function buildEarGeo() {
    const pos = [], col = [], idx = [];
    for (let r = 0; r <= NS; r++) {
      const s = r / NS;
      for (let k = 0; k < NR; k++) {
        const t = k / NR, p = RING[k], z = zone(t);
        // 귓불은 가운데가 아니라 귓불 안에서 부드럽게(고리 바깥쪽 절반만 윤곽 따라감)
        const ss = s;
        const x = CEN[0] + (p[0] - CEN[0]) * ss, y = CEN[1] + (p[1] - CEN[1]) * ss;
        const h = earH(s, z);
        pos.push(x, y, h);
        // 색: 깊은 곳 어둡게 붉게, 둔덕 밝게
        const d = Math.max(0, -h) * 0.7, l = Math.max(0, h) * 0.15;
        col.push(d, l, 0); // 나중에 피부색으로 바꿈
      }
    }
    for (let r = 0; r < NS; r++) for (let k = 0; k < NR; k++) { const a = r * NR + k, b = r * NR + ((k + 1) % NR), c = a + NR, d = b + NR; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.userData.shade = col.slice();
    return g;
  }
  // 헬릭스 말린 테: 윤곽을 따라가는 관(헬릭스 굵게, 귓불 둥글게, 앞쪽은 없음)
  function buildRimGeo() {
    const pos = [], col = [], idx = [], M = 12;
    const pts = []; for (let k = 0; k <= NR; k++) { const t = (k % NR) / NR, z = zone(t); if (z.front) continue; pts.push({ k, t, z }); }
    pts.forEach((q, i) => {
      const p = RING[q.k % NR], pn = RING[(q.k + 1) % NR], pp = RING[(q.k - 1 + NR) % NR];
      let tx = pn[0] - pp[0], ty = pn[1] - pp[1]; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
      const nx = ty, ny = -tx; // 바깥 방향
      const fade = Math.min(1, Math.min(i, pts.length - 1 - i) / 4);
      const R0 = (q.z.helix ? 0.26 : 0.2) * (0.35 + 0.65 * fade);
      const h0 = earH(1, q.z);
      for (let m = 0; m <= M; m++) {
        const a = (m / M) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        // 관 가운데는 윤곽 조금 안쪽, 앞으로 말림(헬릭스는 안쪽으로 감김)
        const cx = p[0] - nx * R0 * 0.55, cy = p[1] - ny * R0 * 0.55;
        pos.push(cx + nx * ca * R0, cy + ny * ca * R0, h0 + sa * R0 * (q.z.lobe ? 0.9 : 1.1));
        col.push(0, Math.max(0, sa) * 0.1, 0);
      }
    });
    for (let i = 0; i < pts.length - 1; i++) for (let m = 0; m < M; m++) { const a = i * (M + 1) + m, b = a + 1, c = a + M + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.userData.shade = col.slice();
    return g;
  }
  // 피부색 입히기(깊은 곳 어둡고 붉게)
  function paint(geo, skin) {
    const c = new THREE.Color(skin).offsetHSL(0.0, 0.05, -0.02), sh = geo.userData.shade, col = geo.attributes.color;
    for (let i = 0; i < col.count; i++) { const d = sh[i * 3], l = sh[i * 3 + 1]; col.setXYZ(i, c.r * (1 - d * 0.55) + l, c.g * (1 - d * 0.75) + l * 0.9, c.b * (1 - d * 0.75) + l * 0.8); }
    col.needsUpdate = true;
  }

  E.build = function (cu) {
    E.skinMat.color.set(cu.skin);
    paint(E.earMesh.geometry, cu.skin); paint(E.rim.geometry, cu.skin);
    const tc = new THREE.Color(cu.skin).offsetHSL(0, 0.04, -0.03), tcol = E.tragus.geometry.attributes.color; for (let i = 0; i < tcol.count; i++) tcol.setXYZ(i, tc.r, tc.g, tc.b); tcol.needsUpdate = true;
    // 머리카락 결
    const R = RND.rng(cu.seed + 5), g = E.hairC.getContext('2d'), base = new THREE.Color(cu.hair);
    g.fillStyle = cu.hair; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) { const x = R() * 512, y = R() * 512, l = 30 + R() * 80; const k = base.clone().offsetHSL(0, 0, (R() - 0.4) * 0.16); g.strokeStyle = '#' + k.getHexString(); g.globalAlpha = 0.5; g.lineWidth = 1 + R() * 1.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (R() - 0.5) * 10, y + l * 0.5, x + (R() - 0.5) * 16, y + l); g.stroke(); }
    g.globalAlpha = 1; E.hairT.needsUpdate = true;
    E.longHair.visible = !!cu.longHair;
    E.shirtMat.color.set(cu.sleeve);
    // 지난 장신구·점 치우기
    E.jew.clear(); E.dots.clear(); E.marks = [];
  };
  // 귀 그림 좌표 → 귀 겉면 위 점(로컬)과 바깥 방향(로컬): 앞에서 귀 쪽으로 광선을 쏴서 찾음
  const ray = new THREE.Raycaster();
  E.surfAt = function (ex, ey) {
    E.g.updateMatrixWorld(true);
    const o = E.ear.localToWorld(new THREE.Vector3(ex, ey, 3)), t = E.ear.localToWorld(new THREE.Vector3(ex, ey, -1));
    ray.set(o, t.sub(o).normalize());
    const h = ray.intersectObjects([E.rim, E.earMesh, E.tragus], false)[0];
    if (!h) return { p: new THREE.Vector3(ex, ey, 0.1), n: new THREE.Vector3(0, 0, 1) };
    const p = E.ear.worldToLocal(h.point.clone()), n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
    const ln = n.transformDirection(new THREE.Matrix4().copy(E.ear.matrixWorld).invert());
    return { p, n: ln.normalize() };
  };
  // 펜 점 찍기(보라 점)
  E.addMarks = function (list) {
    E.dots.clear(); E.marks = [];
    const dm = new THREE.MeshBasicMaterial({ color: '#4b2a9a' });
    list.forEach((id, i) => {
      const at = DATA.PIERCE[id].at, sf = E.surfAt(at[0], at[1]);
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.075, 14), dm);
      d.position.copy(sf.p).addScaledVector(sf.n, 0.012); d.lookAt(d.position.clone().add(sf.n)); E.dots.add(d);
      E.marks.push({ id, p: sf.p.clone(), n: sf.n.clone(), dot: d, done: false });
    });
  };
  // 화면 → 귀 위 점(로컬)
  const v2 = new THREE.Vector2();
  E.hit = function (px, py) {
    v2.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1); ray.setFromCamera(v2, RND.camera);
    const h = ray.intersectObjects([E.rim, E.earMesh, E.tragus], false)[0]; if (!h) return null;
    const p = E.ear.worldToLocal(h.point.clone()), n = h.face.normal.clone().transformDirection(h.object.matrixWorld).transformDirection(new THREE.Matrix4().copy(E.ear.matrixWorld).invert()).normalize();
    return { p, n, w: h.point };
  };
  // 바늘: p 에서 n 반대쪽(살 속)으로 k 만큼 들어감
  E.placeNeedle = function (p, n, k) {
    if (!p) { E.needle.visible = false; return; }
    E.needle.visible = true;
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.clone().normalize());
    E.needle.quaternion.copy(q); E.needle.position.copy(p).addScaledVector(n, -k * 0.45);
  };
  // 장신구 끼우기: stud(작은 공·보석) / hoop(고리)
  E.addJewel = function (m, gem, crook) {
    const g = new THREE.Group(); g.position.copy(m.p); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), m.n);
    if (crook) g.rotateX(0.5);
    if (gem === 'stud') {
      // 금테 + 반짝이는 큐빅
      const bez = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.08, 20), E.gold); bez.rotation.x = Math.PI / 2; bez.position.z = 0.05; bez.castShadow = true; g.add(bez);
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), new THREE.MeshStandardMaterial({ color: '#e8f6ff', metalness: 0.1, roughness: 0.02, emissive: '#3a6a8a', emissiveIntensity: 0.6, flatShading: true })); st.scale.set(1, 1, 0.6); st.position.z = 0.12; g.add(st);
    } else {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 10, 30), E.steel); r.rotation.y = Math.PI / 2; r.position.set(0, -0.26, 0); r.castShadow = true; g.add(r);
    }
    E.jew.add(g); m.dot.visible = false;
    return g;
  };
})();
