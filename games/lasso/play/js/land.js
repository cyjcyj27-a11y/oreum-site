// land.js — 땅·길·메사·선인장·덤불·바위·구름
(function () {
  const { S } = CORE; const { heightAt, addCol, rnd, rr, SITES, EDGE } = WORLD; const { M4, bake, merge, BIN } = WORLD._;
  const V3 = THREE.Vector3, PI = Math.PI;
  function tex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep !== false) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; }
  WORLD._.tex = tex;

  // ── 길: 마을에서 은신처로 ──
  const ROADS = [];
  function road(to, bend) {
    const a = Math.atan2(to.x, to.z), sx = Math.sin(a) * 60, sz = Math.cos(a) * 60, L = Math.hypot(to.x - sx, to.z - sz), n = Math.ceil(L / 5), pts = [];
    const px = Math.cos(a), pz = -Math.sin(a);
    for (let i = 0; i <= n; i++) { const t = i / n, o = Math.sin(t * PI) * bend + Math.sin(t * PI * 3) * bend * 0.25; pts.push({ x: sx + (to.x - sx) * t + px * o, z: sz + (to.z - sz) * t + pz * o }); }
    ROADS.push(pts);
  }
  Object.values(SITES).forEach((s, i) => road(s, (i % 2 ? 1 : -1) * 7));
  ROADS.push((() => { const p = []; for (let x = -70; x <= 70; x += 5) p.push({ x, z: 0 }); return p; })()); // 큰길
  function nearRoad(x, z, d) { for (const r of ROADS) for (let i = 0; i < r.length; i += 2) { const p = r[i]; if (Math.abs(p.x - x) < d && Math.abs(p.z - z) < d) return true; } return false; }
  function nearSite(x, z, pad) { if (Math.hypot(x, z) < 74 + pad) return true; for (const k in SITES) { const s = SITES[k]; if (Math.hypot(x - s.x, z - s.z) < (s.kind === 'fort' ? 32 : s.kind === 'ghost' || s.kind === 'ranch' ? 28 : 14) + pad) return true; } return false; }

  function buildGround() {
    const N = 200, SZ = 2000, g = new THREE.PlaneGeometry(SZ, SZ, N, N); g.rotateX(-PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    const A = new THREE.Color(0xd39a63), B = new THREE.Color(0xb9744a), C = new THREE.Color(0xe6bb86), T = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); p.setY(i, heightAt(x, z));
      const n1 = Math.sin(x * 0.021 + 2) * Math.cos(z * 0.017 + 1) * 0.5 + 0.5, n2 = Math.sin(x * 0.006 - z * 0.009) * 0.5 + 0.5;
      T.copy(A).lerp(B, n1 * 0.55).lerp(C, n2 * 0.4);
      if (Math.hypot(x, z) < 80) T.lerp(C, 0.5 * (1 - Math.hypot(x, z) / 80));
      const k = 0.94 + rnd() * 0.12; col[i * 3] = T.r * k; col[i * 3 + 1] = T.g * k; col[i * 3 + 2] = T.b * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const sand = tex(512, 512, (c, w) => {
      c.fillStyle = '#e6e0d6'; c.fillRect(0, 0, w, w);
      for (let i = 0; i < 9000; i++) { const v = 150 + Math.random() * 105 | 0; c.fillStyle = `rgba(${v},${v - 6},${v - 16},${0.10 + Math.random() * 0.2})`; c.fillRect(Math.random() * w, Math.random() * w, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); }
      for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * w, r = 2 + Math.random() * 5; const gr = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r); gr.addColorStop(0, 'rgba(250,244,232,.9)'); gr.addColorStop(1, 'rgba(120,100,84,.75)'); c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, r, r * 0.7, Math.random() * 3, 0, 7); c.fill(); c.fillStyle = 'rgba(70,50,40,.25)'; c.beginPath(); c.ellipse(x + r * 0.4, y + r * 0.5, r, r * 0.4, 0, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(110,84,64,.22)'; c.lineWidth = 1; for (let i = 0; i < 26; i++) { let x = Math.random() * w, y = Math.random() * w; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 34; y += (Math.random() - 0.5) * 34; c.lineTo(x, y); } c.stroke(); }
      c.strokeStyle = 'rgba(255,250,240,.16)'; c.lineWidth = 2; for (let y = 8; y < w; y += 22) { c.beginPath(); for (let x = 0; x <= w; x += 16) c.lineTo(x, y + Math.sin(x * 0.05 + y) * 3); c.stroke(); } // 바람결
    });
    sand.repeat.set(SZ / 9, SZ / 9);
    const gm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: sand, vertexColors: true, roughness: 1, metalness: 0, envMapIntensity: 0.25 }));
    gm.receiveShadow = true; S.add(gm); WORLD.ground = gm;

    // 길 리본
    const roadTex = tex(128, 128, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(236,208,168,0)'); gr.addColorStop(0.22, 'rgba(236,208,168,.8)'); gr.addColorStop(0.78, 'rgba(236,208,168,.8)'); gr.addColorStop(1, 'rgba(236,208,168,0)');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      [0.33, 0.67].forEach(u => { const g2 = c.createLinearGradient((u - 0.09) * w, 0, (u + 0.09) * w, 0); g2.addColorStop(0, 'rgba(150,104,70,0)'); g2.addColorStop(0.5, 'rgba(150,104,70,.5)'); g2.addColorStop(1, 'rgba(150,104,70,0)'); c.fillStyle = g2; c.fillRect((u - 0.09) * w, 0, 0.18 * w, h); });
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(120,84,56,${Math.random() * 0.2})`; c.fillRect(Math.random() * w * 0.6 + w * 0.2, Math.random() * h, 2, 2); }
    });
    const P = [], U = [], I = []; let vi = 0;
    ROADS.forEach(r => {
      const W = 2.5;
      for (let i = 0; i < r.length; i++) {
        const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, c = r[i];
        const lx = c.x + nx * W, lz = c.z + nz * W, qx = c.x - nx * W, qz = c.z - nz * W;
        P.push(lx, heightAt(lx, lz) + 0.1, lz, qx, heightAt(qx, qz) + 0.1, qz); U.push(0, i * 0.8, 1, i * 0.8);
        if (i) I.push(vi - 2, vi, vi - 1, vi - 1, vi, vi + 1); vi += 2;
      }
    });
    const roadGeo = new THREE.BufferGeometry(); roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); roadGeo.setIndex(I); roadGeo.computeVertexNormals();
    const roadMesh = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ map: roadTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
    roadMesh.receiveShadow = true; roadMesh.renderOrder = 1; S.add(roadMesh);
  }

  // ── 메사: 아래는 무너진 흙 비탈, 위는 켜켜이 쌓인 붉은 절벽 ──
  const STRATA = [0xc99468, 0xb8683e, 0xb3522e, 0xcf7444, 0xa94a2a, 0xd48a56, 0xb05030, 0xc26a3c, 0xc98052];
  const MESA_N = 34, MESA_RINGS = [[0, 1.5], [0.1, 1.24], [0.2, 1.05], [0.34, 1.0], [0.36, 1.035], [0.52, 0.99], [0.54, 1.02], [0.72, 0.97], [0.74, 0.995], [0.9, 0.94], [1, 0.9]];
  const mesaProf = (a, sd) => 1 + 0.15 * Math.sin(a * 3 + sd) + 0.09 * Math.sin(a * 7 + sd * 2.1) + 0.05 * Math.sin(a * 13 + sd * 0.7) + 0.03 * Math.sin(a * 23 + sd * 1.3);
  // 충돌 경계(10/3 사장님 "범인이 절벽으로 숨어들어간다"): 예전 타원(반지름 x1.16)은 울퉁불퉁한 절벽·넓은 흙 비탈(바닥 x1.5)보다 작아서 사람이 비탈·절벽 속으로 들어갔다.
  // 모양과 같은 울퉁불퉁 값으로, 비탈이 바닥에서 0.6m 넘게 솟는 자리를 각도 34칸마다 잰다. 메사는 땅보다 2.5m 내려 놓았다
  function mesaBlockTab(x, z, rx, rz, h, sd, base) {
    // 각도마다 바깥(바닥 고리)에서 안으로 걸어 들어오며, 메사 겉면이 그 자리 땅보다 0.6m 넘게 솟는 첫 자리를 경계로 삼는다(둘레 땅 높낮이까지 반영)
    const NA = MESA_N, t = [], R = MESA_RINGS;   // 모양과 같은 34 꼭짓점 각도에서만 잰다(그 사이는 모양도 직선이라 곡선 값을 쓰면 어긋난다)
    for (let k = 0; k < NA; k++) {
      const a = k / NA * PI * 2, pf = mesaProf(a, sd), ca = Math.cos(a), sa = Math.sin(a); let fb = R[3][1] * pf;
      for (let q = 0; q <= 48; q++) { const sN = R[0][1] * pf * (1 - q / 48 * 0.4); let y = -1e9;
        for (let r = 0; r < R.length - 1; r++) { const f0 = R[r][1] * pf, f1 = R[r + 1][1] * pf, lo = Math.min(f0, f1), hi = Math.max(f0, f1); if (sN >= lo && sN <= hi) { const u = hi === lo ? 0 : (sN - f0) / (f1 - f0); y = Math.max(y, base + (R[r][0] + (R[r + 1][0] - R[r][0]) * u) * h); } }
        if (sN < R[R.length - 1][1] * pf) y = base + h;
        if (y - heightAt(x + ca * rx * sN, z + sa * rz * sN) > 0.6) { fb = sN; break; } }
      t.push(fb); }
    return t;
  }
  function mesaGeo(rx, rz, h, sd) {
    const N = MESA_N, rings = MESA_RINGS;
    const prof = a => mesaProf(a, sd);
    const pt = (ring, k) => { const a = k / N * PI * 2, f = rings[ring][1] * prof(a) * (ring > 1 ? 1 + 0.02 * Math.sin(a * 31 + ring * 2) : 1); return [Math.cos(a) * rx * f, rings[ring][0] * h, Math.sin(a) * rz * f]; };
    const P = [], C = [], col = new THREE.Color();
    const face = (a, b, c, hex) => { P.push(...a, ...b, ...c); col.set(hex); const k = 0.93 + rnd() * 0.14; for (let i = 0; i < 3; i++) C.push(col.r * k, col.g * k, col.b * k); };
    for (let r = 0; r < rings.length - 1; r++) for (let k = 0; k < N; k++) {
      const a = pt(r, k), b = pt(r, k + 1), c = pt(r + 1, k), d = pt(r + 1, k + 1), hex = STRATA[r % STRATA.length];
      face(a, c, b, hex); face(b, c, d, hex);
    }
    const top = rings.length - 1; for (let k = 0; k < N; k++) face([0, h * 1.01, 0], pt(top, k + 1), pt(top, k), 0xcf8a5a);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.computeVertexNormals(); return g;
  }
  const MESAS = [[-250, -198, 62, 17, 34], [-246, -122, 54, 15, 28], [-120, -328, 48, 16, 30], [-160, -282, 16, 40, 26], [296, -158, 22, 36, 38], [130, -22, 26, 22, 30], [-48, -200, 22, 18, 24], [48, 176, 24, 28, 28],
    [-190, 40, 20, 20, 40], [230, -40, 17, 17, 46], [-20, 290, 40, 24, 26], [240, 210, 30, 22, 32], [-340, 90, 26, 34, 30], [62, -252, 30, 18, 28], [340, -30, 24, 40, 34], [-320, -140, 28, 24, 40], [-130, 262, 18, 18, 36]];
  // 메사 경계를 한 번 재 두고(buildMesas 도 이것을 쓴다), 메사 끝을 뚫고 지나가던 길(협곡·골짜기 길)을 경계 5m 밖으로 비켜 가게 한다(10/3 메사에 충돌을 제대로 넣으며)
  const MESA_TABS = MESAS.map((m, i) => { const [x, z, rx, rz, h] = m; return mesaBlockTab(x, z, rx, rz, h, i * 1.7 + 0.4, heightAt(x, z) - 2.5); });
  // 붙은 메사 사이 메우기(10/6 사장님 "은행강도가 도망갈 때 절벽을 뚫고 지나간다"): 골짜기(은신처 gulch) 양쪽 메사 [-120,-328]·[-160,-282] 는 경계가 겹쳐서
  // 두 비탈이 만나는 데에 말 한 마리 폭(4m)의 막다른 틈이 생겼다. 거기 들어간 말은 양쪽이 번갈아 밀어내다 한 프레임에 30m 를 튕겨 절벽 반대편으로 넘어갔고,
  // 밀어내기를 고쳐도 틈 맨 안쪽에서 벽 타기가 안쪽으로만 돌아 못 나왔다. 그래서 경계가 서로 3m 안으로 닿는 각도는 상대 메사에서 3m 떨어질 때까지(최대 6m) 경계를 늘려 틈을 메운다
  (function sealSeams() {
    const at = (i, a, f) => { const [x, z, rx, rz] = MESAS[i]; return [x + Math.cos(a) * rx * f, z + Math.sin(a) * rz * f]; };
    const near = (j, px, pz, pad) => { const [x, z, rx, rz] = MESAS[j], t = MESA_TABS[j], N = t.length, dx = px - x, dz = pz - z, a = Math.atan2(dz / rz, dx / rx), rn = Math.hypot(dx / rx, dz / rz);
      const u = ((a / (PI * 2)) % 1 + 1) % 1 * N, k = Math.floor(u), q = u - k, f = t[k % N] * (1 - q) + t[(k + 1) % N] * q, R = Math.hypot(Math.cos(a) * rx, Math.sin(a) * rz) || 1; return rn < f + pad / R; };
    let sealed = 0;
    for (let i = 0; i < MESAS.length; i++) for (let j = 0; j < MESAS.length; j++) { if (i === j) continue;
      const [xi, zi, rxi, rzi] = MESAS[i], [xj, zj, rxj, rzj] = MESAS[j]; if (Math.abs(xi - xj) > (rxi + rxj) * 1.5 || Math.abs(zi - zj) > (rzi + rzj) * 1.5) continue;
      const t = MESA_TABS[i], N = t.length; let n = 0;
      for (let k = 0; k < N; k++) { const a = k / N * PI * 2, R = Math.hypot(Math.cos(a) * rxi, Math.sin(a) * rzi) || 1; let f = t[k], m = 0;
        while (m < 6) { const [px, pz] = at(i, a, f); if (!near(j, px, pz, 3)) break; f += 0.5 / R; m += 0.5; }
        if (f !== t[k]) { t[k] = f; n++; } }
      if (n) sealed++; }
    WORLD.mesaSeams = sealed;   // 시험용: 메운 메사 수(골짜기 둘이면 2)
  })();
  (function fixRoads() {
    const push = (p, pad) => MESAS.forEach((m, i) => { const [x, z, rx, rz] = m, tab = MESA_TABS[i], N = tab.length, dx = p.x - x, dz = p.z - z, a = Math.atan2(dz / rz, dx / rx), rn = Math.hypot(dx / rx, dz / rz);
      const u = ((a / (PI * 2)) % 1 + 1) % 1 * N, k = Math.floor(u), t = u - k, f = tab[k % N] * (1 - t) + tab[(k + 1) % N] * t, ca = Math.cos(a), sa = Math.sin(a), fb = f + pad / (Math.hypot(ca * rx, sa * rz) || 1);
      if (rn < fb) { p.x = x + ca * rx * fb; p.z = z + sa * rz * fb; } });
    ROADS.forEach(r => { for (let it = 0; it < 8; it++) { r.forEach(p => push(p, 5)); for (let i = 1; i < r.length - 1; i++) { r[i].x = (r[i - 1].x + r[i].x * 2 + r[i + 1].x) / 4; r[i].z = (r[i - 1].z + r[i].z * 2 + r[i + 1].z) / 4; } } r.forEach(p => push(p, 4)); });
  })();
  function joinGeos(l) {
    const cat = k => { let n = 0; l.forEach(g => n += g.attributes[k].array.length); const o = new Float32Array(n); let at = 0; l.forEach(g => { o.set(g.attributes[k].array, at); at += g.attributes[k].array.length; }); return o; };
    const G = new THREE.BufferGeometry(); ['position', 'color', 'normal'].forEach(k => G.setAttribute(k, new THREE.BufferAttribute(cat(k), 3))); return G;
  }
  function buildMesas() {
    const near = [], far = [];
    MESAS.forEach((m, i) => { const [x, z, rx, rz, h] = m; const g = mesaGeo(rx, rz, h, i * 1.7 + 0.4); g.applyMatrix4(M4(x, heightAt(x, z) - 2.5, z)); near.push(g); const tab = MESA_TABS[i], mx = Math.max(...tab); addCol({ x, z, rx, rz, tab, bx: rx * mx, bz: rz * mx, tag: 'mesa' }); });
    // 배경 메사(충돌 없음)는 비탈 끝(1.5배)이 놀이 구역(EDGE) 안으로 안 들어오게 물린다(10/6: 북쪽 것이 반지름 376 부터 들어와 있어 지도 끝을 달리는 현상범이 6.7m 파묻혔다). rr 호출 순서는 그대로
    for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2 + rr(-0.08, 0.08), d0 = rr(480, 640), rx = rr(40, 95), rz = rr(36, 80), h = rr(34, 80), d = Math.max(d0, EDGE + 2 + Math.max(rx, rz) * 1.5); const g = mesaGeo(rx, rz, h, i * 2.3); g.applyMatrix4(M4(Math.sin(a) * d, -3, Math.cos(a) * d, rr(0, 3))); far.push(g); }
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, envMapIntensity: 0.2 });
    [near, far].forEach((l, i) => { const me = new THREE.Mesh(joinGeos(l), mat); me.castShadow = i === 0; me.receiveShadow = true; S.add(me); if (i === 0) WORLD.mesaMesh = me; });
  }

  // ── 선인장·덤불·바위(구역 넷으로 나눈 인스턴스) ──
  function scatter(n, maxR, test) { const out = [[], [], [], []]; let tries = 0, got = 0; while (got < n && tries++ < n * 30) { const a = rnd() * PI * 2, d = Math.sqrt(rnd()) * maxR, x = Math.sin(a) * d, z = Math.cos(a) * d; if (nearSite(x, z, 2) || nearRoad(x, z, 4.5) || !test(x, z)) continue; out[(x > 0 ? 1 : 0) + (z > 0 ? 2 : 0)].push({ x, z }); got++; } return out; }
  const _tp = new V3();
  const free = (x, z, r) => { if (Math.hypot(x, z) > EDGE - r) return true; _tp.set(x, 0, z); return !WORLD.collide(_tp, r); };
  function inst(geo, mat, quads, fn, shadow) {
    quads.forEach(list => { if (!list.length) return; const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((p, i) => im.setMatrixAt(i, fn(p))); im.castShadow = !!shadow; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); S.add(im); });
  }
  function buildPlants() {
    const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 3, 8);
    const cg = merge([
      bake(cap(0.27, 2.5), M4(0, 1.5, 0), 0x5d8a4c, 0.12),
      bake(cap(0.16, 0.5), M4(0.42, 1.35, 0, 0, 0, PI / 2), 0x57834a, 0.12), bake(cap(0.16, 0.85), M4(0.72, 1.85, 0), 0x639252, 0.12),
      bake(cap(0.15, 0.4), M4(-0.4, 0.95, 0, 0, 0, PI / 2), 0x57834a, 0.12), bake(cap(0.15, 0.6), M4(-0.66, 1.32, 0), 0x639252, 0.12)]);
    const plantMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, envMapIntensity: 0.3 });
    inst(cg, plantMat, scatter(170, EDGE + 60, (x, z) => free(x, z, 1.2)), p => { const s = rr(0.8, 1.6); if (Math.hypot(p.x, p.z) < EDGE) addCol({ x: p.x, z: p.z, rx: 0.42 * s, rz: 0.42 * s, tag: 'cactus' }); return M4(p.x, heightAt(p.x, p.z) - 0.05, p.z, rr(0, 6.3), 0, 0, s, s * rr(0.85, 1.25), s); }, true);
    const sg = merge([bake(new THREE.IcosahedronGeometry(0.55, 1), M4(0, 0.28, 0, 0, 0, 0, 1, 0.62, 1), 0x97995f, 0.3), bake(new THREE.IcosahedronGeometry(0.34, 0), M4(0.42, 0.2, 0.2, 1, 0, 0, 1, 0.7, 1), 0xa9a56a, 0.3), bake(new THREE.ConeGeometry(0.07, 0.9, 4), M4(-0.3, 0.4, -0.2, 0, 0.3, 0.2), 0xcdb277, 0.2), bake(new THREE.ConeGeometry(0.06, 0.8, 4), M4(-0.42, 0.36, 0.05, 0, -0.3, 0.4), 0xcdb277, 0.2)]);
    const flatMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0, envMapIntensity: 0.25 });
    inst(sg, flatMat, scatter(620, EDGE + 120, (x, z) => free(x, z, 0.5)), p => { const s = rr(0.6, 1.7); return M4(p.x, heightAt(p.x, p.z), p.z, rr(0, 6.3), 0, 0, s); }, false);
    const ig = new THREE.IcosahedronGeometry(1, 1).toNonIndexed(), ipos = ig.attributes.position; // 울퉁불퉁 바위
    const seen = {}; for (let i = 0; i < ipos.count; i++) { const k = ipos.getX(i).toFixed(2) + ipos.getY(i).toFixed(2) + ipos.getZ(i).toFixed(2); const f = seen[k] || (seen[k] = 0.72 + rnd() * 0.5); ipos.setXYZ(i, ipos.getX(i) * f, ipos.getY(i) * f * 0.75, ipos.getZ(i) * f); }
    ig.computeVertexNormals(); const rockGeo = bake(ig, null, 0xb06e4a, 0.22);
    inst(rockGeo, flatMat, scatter(150, EDGE + 80, (x, z) => free(x, z, 2.4)), p => { const s = rnd() < 0.25 ? rr(1.5, 3) : rr(0.4, 1.1); if (s > 1.3 && Math.hypot(p.x, p.z) < EDGE) addCol({ x: p.x, z: p.z, rx: s * 0.86, rz: s * 0.86, tag: 'rock' }); return M4(p.x, heightAt(p.x, p.z) - s * 0.12, p.z, rr(0, 6.3), rr(-0.2, 0.2), 0, s, s * rr(0.7, 1.2), s); }, true);
    // 말라 죽은 나무
    scatter(16, EDGE - 10, (x, z) => free(x, z, 2)).flat().forEach(p => {
      const y = heightAt(p.x, p.z), ry = rr(0, 6.3), h = rr(2.6, 4.2), put = (g, m) => BIN.plain.push(bake(g, M4(p.x, y, p.z, ry).multiply(m), 0x4a372b, 0.2));
      put(new THREE.CylinderGeometry(0.1, 0.24, h, 6), M4(0, h / 2, 0, 0, 0, 0.08));
      for (let i = 0; i < 4; i++) { const l = rr(0.9, 1.9), by = h * rr(0.5, 0.95), a = i * 1.7 + rr(0, 0.6), tl = rr(0.7, 1.15); put(new THREE.CylinderGeometry(0.03, 0.09, l, 5), M4(Math.sin(a) * Math.sin(tl) * l / 2, by + Math.cos(tl) * l / 2, Math.cos(a) * Math.sin(tl) * l / 2, a, tl, 0)); }
      addCol({ x: p.x, z: p.z, rx: 0.3, rz: 0.3, tag: 'tree' });
    });
  }
  function buildClouds() {
    const ct = tex(256, 128, (c, w, h) => { for (let i = 0; i < 16; i++) { const x = 40 + Math.random() * (w - 80), y = 50 + Math.random() * 40, r = 22 + Math.random() * 30; const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(255,236,214,.5)'); g.addColorStop(1, 'rgba(255,214,190,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 1.5, r * 0.7, 0, 0, 7); c.fill(); } }, false);
    const m = new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }), g = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 13; i++) { const a = i / 13 * PI * 2 + rr(0, 0.4), d = rr(800, 1150), me = new THREE.Mesh(g, m); me.position.set(Math.sin(a) * d, rr(150, 360), Math.cos(a) * d); me.scale.set(rr(380, 620), rr(110, 170), 1); me.lookAt(0, me.position.y * 0.6, 0); me.renderOrder = -5; S.add(me); }
  }
  WORLD.land = { buildGround, buildMesas, buildPlants, buildClouds, nearRoad, ROADS };
})();
