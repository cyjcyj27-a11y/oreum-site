// sites.js — 마을 배치와 은신처 배치, 전체 짓기 순서
(function () {
  const { S, loadGLB, fitStatic } = CORE; const { heightAt, addCol, rnd, rr, SITES, TOWN } = WORLD; const { M4, bake, BIN, Kit, tex } = WORLD._;
  const T = WORLD._.town, PI = Math.PI;
  const GLB = {};
  async function glb(name, size, by) { // GLB 한 덩어리를 크기 맞춰 구운 도형으로
    const g = await loadGLB('assets/models/' + name + '.glb'), f = fitStatic(g, size, by); f.proto.updateMatrixWorld(true);
    let mesh = null; f.proto.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
    GLB[name] = { geo: mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), mat: mesh.material, size: f.size };
  }
  function put(name, x, z, ry, col) { const G = GLB[name], m = new THREE.Mesh(G.geo, G.mat); m.position.set(x, heightAt(x, z), z); m.rotation.y = ry || 0; m.castShadow = m.receiveShadow = true; S.add(m); if (col) addCol({ x, z, rx: col, rz: col, tag: name }); return m; }
  const INST = {};
  function inst(name, x, z, ry, s, col) { (INST[name] || (INST[name] = [])).push(M4(x, heightAt(x, z), z, ry || 0, 0, 0, s || 1)); if (col) addCol({ x, z, rx: col, rz: col, tag: name }); }
  function flushInst() { for (const n in INST) { const G = GLB[n], l = INST[n], im = new THREE.InstancedMesh(G.geo, G.mat, l.length); l.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = im.receiveShadow = true; im.frustumCulled = false; S.add(im); } }
  function fenceRun(k, x0, z0, x1, z1, gap) { // 울타리 줄 + 얇은 벽
    const L = Math.hypot(x1 - x0, z1 - z0), W = GLB.fence.size.x > GLB.fence.size.z ? GLB.fence.size.x : GLB.fence.size.z, n = Math.max(1, Math.round(L / W)), a = Math.atan2(x1 - x0, z1 - z0) + (GLB.fence.size.x > GLB.fence.size.z ? PI / 2 : 0);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; if (gap && Math.abs(t - 0.5) < gap) continue; const p = k.world(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t); inst('fence', p.x, p.z, a + k.ry, L / n / W); }
    if (!gap) k.wall(Math.min(x0, x1) - 0.12, Math.max(x0, x1) + 0.12, Math.min(z0, z1) - 0.12, Math.max(z0, z1) + 0.12, 'fence');
  }

  function buildTown() {
    const P = PI;
    // 감옥(돌집, 쇠창살)
    const j = new Kit(-41.5, -13, 0);
    j.box(8, 4.2, 7, 0x9c9084, 0, 0, 0, { bin: 'plain', j: 0.14 }); j.box(8.5, 0.3, 7.5, 0x6f665e, 0, 4.2, 0, { bin: 'plain' });
    for (let r = 0; r < 6; r++) j.box(8.06, 0.05, 7.06, 0x7d736a, 0, 0.6 + r * 0.62, 0, { bin: 'plain', j: 0 });
    j.box(1.5, 2.4, 0.2, 0x15100c, 0, 0, 3.5, { bin: 'plain', j: 0 }); for (let i = 0; i < 6; i++) j.cyl(0.035, 0.035, 2.4, 0x2a2826, -0.62 + i * 0.25, 0, 3.64, { seg: 5, j: 0 });
    j.box(1.6, 0.1, 0.12, 0x2a2826, 0, 1.2, 3.64, { bin: 'plain', j: 0 });
    j.box(1.5, 1.0, 0.2, 0x15100c, 2.75, 1.3, 3.5, { bin: 'plain', j: 0 }); for (let i = 0; i < 6; i++) j.cyl(0.03, 0.03, 1.0, 0x2a2826, 2.15 + i * 0.24, 1.3, 3.62, { seg: 5, j: 0 });
    T.sign(j, 'JAIL', 4.6, 1.25, 0, 3.12, 3.58, { bg: '#2a2622', fg: '#e8dcc0' });   // 문 바로 위 가운데에 크게(10/3 노란 고리 대신 건물로 알아보게) j.wall(-4, 4, -3.5, 3.5);
    T.store({ x: -30, z: -14, ry: 0, w: 11, d: 9, h: 4.6, col: 0xb98a5e, sign: 'SHERIFF' });
    T.store({ x: -13.5, z: -14.5, ry: 0, w: 14, d: 10, h: 6.6, two: true, swing: true, col: 0xa9604a, trim: 0xe6d6b4, sign: 'SALOON', signBg: '#f0dfb4', signFg: '#7a1f14' });
    T.store({ x: 3.5, z: -14, ry: 0, w: 10, d: 9, h: 5, col: 0xd8cdb0, trim: 0x3f5a48, sign: 'BANK', signBg: '#2f4a3a', signFg: '#f0e2b8' });
    T.store({ x: 19.5, z: -14.5, ry: 0, w: 13, d: 10, h: 6.6, two: true, col: 0x7d989c, trim: 0xe6d6b4, sign: 'HOTEL' });
    T.store({ x: -26, z: 14, ry: P, w: 12, d: 9, h: 4.6, col: 0xc9a26a, trim: 0x7a3b2a, sign: 'GENERAL STORE', signBg: '#7a2a1c', signFg: '#f4e4bc' });
    T.store({ x: -10, z: 14, ry: P, w: 8, d: 8, h: 4.2, col: 0x8c8478, trim: 0x3a302a, sign: 'UNDERTAKER', signBg: '#1e1a18', signFg: '#d8ccb0' });
    T.store({ x: 36, z: 14, ry: P, w: 10, d: 9, h: 4.4, col: 0x94623c, trim: 0x3a302a, sign: 'BLACKSMITH' });
    const barn = put('barn', 13, 20, P); addCol({ x0: 13 - GLB.barn.size.x / 2, x1: 13 + GLB.barn.size.x / 2, z0: 20 - GLB.barn.size.z / 2, z1: 20 + GLB.barn.size.z / 2, tag: 'barn' });
    put('watertower', 44, -20, 0.4, 2.4); put('windmill', -58, 20, 0.8, 2.2);
    const k = new Kit(0, 0, 0, 0);
    // 건물 사이 좁은 틈은 앞뒤를 울타리로 막는다(10/5 포럼 플레이어 "은행 옆 건물 틈에 말이 끼어 아래 방향키로만 빠져나왔다"). 북쪽 줄은 마루(porch) 앞선(z -6.9)과 뒷벽선, 남쪽 잡화점·장의사 사이는 마차가 앞에 있어 벽 사이(z 10.6)와 뒷벽선
    [[-37.6, -35.4, -9.3, -16.6], [-24.3, -20.7, -6.9, -18.6], [-6.3, -1.7, -6.9, -18.6], [8.7, 12.8, -6.9, -18.6]].forEach(([a, b, zf, zb]) => { fenceRun(k, a, zf, b, zf); fenceRun(k, a, zb, b, zb); });
    fenceRun(k, -20.1, 10.6, -13.9, 10.6); fenceRun(k, -20.1, 18.3, -13.9, 18.3);
    // 현상수배 게시판: 멀리서도 보이게 크게(4.6×2.9m) + 지붕 아래 WANTED 판(10/3 노란 고리 대신 생김새로)
    k.box(0.24, 4.3, 0.24, 0x5b4332, -32.55, 0, -6.2); k.box(0.24, 4.3, 0.24, 0x5b4332, -27.45, 0, -6.2); k.box(5.0, 3.1, 0.12, 0xa9824f, -30, 0.55, -6.2); k.box(5.6, 0.14, 0.9, 0x574434, -30, 4.32, -6.2, { rx: 0.2 });
    T.sign(k, 'WANTED', 3.6, 0.72, -30, 3.85, -6.07, { bg: '#7a2a1c', fg: '#f4e4bc' }); T.sign(k, 'WANTED', 3.6, 0.72, -30, 3.85, -6.33, { bg: '#7a2a1c', fg: '#f4e4bc', ry: Math.PI });
    const bc = document.createElement('canvas'); bc.width = 990; bc.height = 570; const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 8;
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.65), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.95, transparent: true })); bm.position.set(-30, 2.08, -6.13); S.add(bm);
    const bm2 = new THREE.Mesh(bm.geometry, bm.material); bm2.position.set(-30, 2.08, -6.27); bm2.rotation.y = Math.PI; S.add(bm2); // 뒤쪽(보안관 사무소 마루)에서 봐도 전단이 붙어 있다
    WORLD.board = { canvas: bc, tex: bt, mesh: bm }; addCol({ x0: -32.7, x1: -27.3, z0: -6.35, z1: -6.05, tag: 'board' });
    // 마구간: 헛간(13,20 · 앞면 z 13) 앞 울타리 안에 파는 말 셋(game.js stable). 울타리 앞(TOWN.store 13,5.4)에 서면 상점(10/3 "상점앞으로 가서 말을 사야되는구나 알수있게")
    fenceRun(k, 7.2, 7.4, 18.8, 7.4); fenceRun(k, 7.2, 7.4, 7.2, 13); fenceRun(k, 18.8, 7.4, 18.8, 13);
    k.box(2.2, 0.55, 0.7, 0x7a5a3c, 13, 0, 7.95); k.box(1.96, 0.04, 0.5, 0x5f8fa8, 13, 0.47, 7.95, { bin: 'plain', j: 0 });   // 맨 앞 말 앞의 물통
    inst('hay', 8.4, 12.1, 0.3); inst('hay', 9.5, 12.3, 1.2); inst('hay', 8.9, 12.2, 0.7, 1, 0); inst('hay', 17.6, 8.6, 2.1);
    // 말 매는 기둥·물통·통·상자·마차·우물
    [[-13.5, -6.2], [19.5, -6.2], [-26, 6.2]].forEach(([x, z]) => { k.box(0.16, 1.1, 0.16, 0x5b4332, x - 1.5, 0, z); k.box(0.16, 1.1, 0.16, 0x5b4332, x + 1.5, 0, z); k.box(3.3, 0.12, 0.12, 0x6b5240, x, 0.95, z); addCol({ x0: x - 1.6, x1: x + 1.6, z0: z - 0.12, z1: z + 0.12, tag: 'rail' }); });
    k.box(2.2, 0.55, 0.7, 0x7a5a3c, -7.5, 0, -6.4); k.box(1.96, 0.04, 0.5, 0x5f8fa8, -7.5, 0.47, -6.4, { bin: 'plain', j: 0 }); addCol({ x0: -8.6, x1: -6.4, z0: -6.8, z1: -6.0, tag: 'trough' });
    T.barrel(k, -19.2, 8.4); T.barrel(k, -18.4, 8.9); T.barrel(k, -5.2, -8.6); T.barrel(k, 9.6, -8.4); T.barrel(k, 30.2, 8.5);
    T.crate(k, -32.6, 8.5, 0.9); T.crate(k, -33.3, 8.2, 0.7, 0.9); T.crate(k, 12, -8.6, 0.8); T.crate(k, 41.5, 8.6, 0.9);
    T.wagon(k, -15.5, 6.6, 0.25, true);
    k.cyl(1.1, 1.15, 0.8, 0x9c9084, 52, 0, 0, { seg: 12, j: 0.2 }); k.cyl(0.92, 0.92, 0.82, 0x1c2a30, 52, 0, 0, { seg: 12, j: 0 }); k.box(0.14, 2.3, 0.14, 0x5b4332, 51, 0, 0); k.box(0.14, 2.3, 0.14, 0x5b4332, 53, 0, 0); k.box(2.8, 0.1, 1.5, 0x6b5240, 52, 2.3, 0, { rx: 0.25 }); addCol({ x: 52, z: 0, rx: 1.25, rz: 1.25, tag: 'well' });
    // 관(장의사 앞) · 모루(대장간 앞)
    k.box(0.7, 2.0, 0.3, 0x4a372b, -6.6, 0.1, 8.6, { rx: -0.2 }); k.box(0.5, 0.5, 0.9, 0x2a2826, 31, 0.5, 8.4, { bin: 'plain', j: 0 }); k.box(0.3, 0.5, 0.3, 0x5b4332, 31, 0, 8.4);
    WORLD.townMesh = T.flush('town');
  }

  const SB = {
    camp(k, s) { T.campfire(k, 0, 0); T.tent(k, -3.4, -2.8, 0.9); T.tent(k, 3.2, -3.2, -0.8, 0xcfb98c); T.crate(k, -2.2, 2.6); T.barrel(k, 3.4, 1.8); k.put('plain', new THREE.CylinderGeometry(0.2, 0.22, 1.8, 7), 0x6b4a32, 0.4, 0.2, 2.2, { rz: PI / 2, ry: 0.3 }); k.put('plain', new THREE.CylinderGeometry(0.16, 0.16, 1.5, 7), 0x9a3a2a, -1.6, 0.16, -1.2, { rz: PI / 2, ry: 1.2, j: 0.05 }); },
    hay(k, s) { [[0, 0, 0], [1.5, 0.3, 0.4], [0.7, 1.4, 1.2], [-3, 2, 0.8], [4.2, -2, 2], [-4, -3, 0.1], [-2.6, -3.4, 1.5]].forEach(([x, z, r]) => { const p = k.world(x, z); inst('hay', p.x, p.z, r, 1, 0.75); });
      k.box(2.6, 1.7, 2.0, 0xb98a5e, 5.5, 0, 3.5); k.box(3.0, 0.12, 2.5, 0x7a3b2a, 5.5, 1.7, 3.5, { rx: 0.18 }); k.box(0.5, 0.6, 0.06, 0x1c1612, 5.5, 0.1, 4.52, { bin: 'plain', j: 0 }); k.wall(4.2, 6.8, 2.5, 4.5); fenceRun(k, -6, -6, 6, -6); },
    wreck(k, s) { T.wagon(k, 0, 0, 0.5, false, 0.32); T.barrel(k, 2.6, 1.4); T.barrel(k, -2.8, 2.2, 0.9); T.crate(k, 3.2, -1.8); T.crate(k, -1.8, -2.8, 0.7); T.campfire(k, 4.5, 4); k.put('plain', new THREE.TorusGeometry(0.58, 0.07, 6, 14), 0x4a372b, -3.4, 0.1, -0.6, { rx: PI / 2 }); },
    wagon(k, s) { T.wagon(k, -2.6, -2.2, 0.4, true); T.campfire(k, 2.6, 1.6); T.barrel(k, 0.2, -3.6); k.box(1.2, 0.08, 1.2, 0x8a623c, 0.2, 0.95, -3.6); T.crate(k, 1.5, -3.4, 0.5); T.crate(k, -1.1, -3.9, 0.5); T.tent(k, 5.6, -2.6, -1.2); },
    ranch(k, s) { const a = k.world(0, -11), b = k.world(-15, 5), c = k.world(-12, -9);
      put('farmhouse', a.x, a.z, k.ry); addCol({ x0: a.x - 5.2, x1: a.x + 5.2, z0: a.z - 5.2, z1: a.z + 5.2, tag: 'house' }); put('windmill', b.x, b.z, k.ry + 0.6, 2); put('silo', c.x, c.z, 0, 2.4);
      // 울타리 친 마당은 옆으로 비켜 둔다(마을에서 오는 길을 막지 않게)
      fenceRun(k, 15, -4, 29, -4, 0.14); fenceRun(k, 15, 8, 29, 8); fenceRun(k, 15, -4, 15, 8); fenceRun(k, 29, -4, 29, 8);
      [[18, -1], [18.8, 0.3], [26, 5], [27.2, 4.2], [22, 6.4]].forEach(([x, z], i) => { const p = k.world(x, z); inst('hay', p.x, p.z, i, 1, 0.75); }); k.box(2.2, 0.55, 0.7, 0x7a5a3c, 22, 0, -2); },
    mine(k, s) { const m = new Kit(270.5, -152, -PI / 2);
      m.box(0.34, 2.8, 0.34, 0x5b4332, -1.25, 0, 0); m.box(0.34, 2.8, 0.34, 0x5b4332, 1.25, 0, 0); m.box(3.2, 0.34, 0.4, 0x5b4332, 0, 2.7, 0); m.box(2.4, 2.75, 3, 0x0d0907, 0, 0, -1.6, { bin: 'plain', j: 0 });
      m.box(0.2, 2.2, 0.2, 0x6b5240, -1.7, 0, 0.1, { rz: 0.3 }); m.box(0.2, 2.2, 0.2, 0x6b5240, 1.7, 0, 0.1, { rz: -0.3 });
      T.rails(m, 0, -1, 0, 24); m.box(1.2, 0.75, 1.7, 0x4f4a46, 0, 0.42, 9, { bin: 'plain' }); m.box(1.0, 0.3, 1.5, 0x7a5a2a, 0, 1.05, 9, { bin: 'plain', j: 0.3 });
      [[-0.55, 8.4], [0.55, 8.4], [-0.55, 9.6], [0.55, 9.6]].forEach(([x, z]) => m.put('plain', new THREE.TorusGeometry(0.2, 0.06, 5, 10), 0x2a2826, x, 0.28, z, { ry: PI / 2 }));
      const cp = m.world(0, 9); addCol({ x: cp.x, z: cp.z, rx: 1, rz: 1, tag: 'cart' });
      m.box(0.14, 2.4, 0.14, 0x5b4332, 2.6, 0, 3); m.box(0.26, 0.34, 0.26, 0xffc66e, 2.6, 2.0, 3.2, { bin: 'glow', j: 0 });
      T.barrel(m, -3, 5); T.barrel(m, -3.8, 5.6); T.crate(m, 3.4, 7); T.crate(m, 4.2, 6.2, 0.7); T.campfire(m, -5, 14); T.tent(m, -8, 11, 1.6); },
    ghost(k, s) { const G = 0x8c857c, TR = 0x5e5850, L = (x, z) => k.world(x, z);
      let p = L(-9, -8); T.store({ x: p.x, z: p.z, ry: k.ry + PI / 2, w: 9, d: 8, h: 4.4, col: G, trim: TR, glow: false, sign: 'SALOON', signBg: '#8f8778', signFg: '#4a443c' });
      p = L(-9, 5); T.store({ x: p.x, z: p.z, ry: k.ry + PI / 2, w: 10, d: 8, h: 6.2, two: true, col: 0x96897a, trim: TR, glow: false, sign: 'HOTEL', signBg: '#8f8778', signFg: '#4a443c' });
      p = L(9, -6); T.store({ x: p.x, z: p.z, ry: k.ry - PI / 2, w: 9, d: 8, h: 4.2, col: 0x847a70, trim: TR, glow: false });
      k.box(6, 6.5, 9, 0x9a9488, 10, 0, 8); k.box(2.2, 3.4, 2.2, 0x9a9488, 10, 6.5, 5.2); k.put('plain', new THREE.ConeGeometry(1.9, 2.6, 4), 0x4f4a46, 10, 11.2, 5.2, { ry: PI / 4 }); k.box(0.14, 1.3, 0.14, 0x3a302a, 10, 12.4, 5.2); k.box(0.7, 0.14, 0.14, 0x3a302a, 10, 13.2, 5.2); k.box(1.3, 2.4, 0.14, 0x1c1612, 7, 0, 8, { ry: PI / 2, bin: 'plain', j: 0 }); k.wall(7, 13, 3.5, 12.5);
      T.wagon(k, 0, 10, 1.2, false, 0.3); T.barrel(k, -3.4, -2); T.crate(k, 3.6, 0.5); },
    tower(k, s) { const a = k.world(0, -5); put('watertower', a.x, a.z, 0.2, 2.4); const p = k.world(-9, 0); T.store({ x: p.x, z: p.z, ry: k.ry + PI / 2, w: 7, d: 6, h: 3.8, col: 0xb07c50, sign: 'DEPOT' });
      T.rails(k, -34, 7, 34, 7); k.box(9, 0.5, 3, 0x8d6e50, 0, 0, 4); T.crate(k, 2.6, 4, 0.8, 0.5); T.barrel(k, 6.5, 1); T.barrel(k, 5.6, 0.2); T.campfire(k, 5, -3); },
    grave(k, s) { for (let i = 0; i < 15; i++) { const x = -7 + (i % 5) * 3.4 + rr(-0.4, 0.4), z = -5 + Math.floor(i / 5) * 4.4 + rr(-0.4, 0.4), t = rr(-0.12, 0.12); k.box(0.13, 1.25, 0.13, 0x6b5a4a, x, 0, z, { rz: t }); k.box(0.7, 0.13, 0.13, 0x6b5a4a, x, 0.78, z, { rz: t }); k.put('plain', new THREE.IcosahedronGeometry(0.75, 1), 0xa9744e, x, 0.02, z + 1.1, { sx: 0.7, sy: 0.26, sz: 1.3, j: 0.15 }); }
      k.box(0.2, 2.6, 0.2, 0x3a302a, -2.2, 0, 9.5); k.box(0.2, 2.6, 0.2, 0x3a302a, 2.2, 0, 9.5); k.box(4.9, 0.5, 0.12, 0x3a302a, 0, 2.3, 9.5); T.campfire(k, 9.5, 3); T.tent(k, 11.5, -1.5, -1.4, 0x8a8478); },
    fort(k, s) { const hx = 18, hz = 15, log = (x, z, tall) => { const h = (tall ? 4.6 : 3.5) + rr(-0.15, 0.15); k.cyl(0.24, 0.27, h, 0x7a5638, x, 0, z, { seg: 6, j: 0.2 }); k.put('plain', new THREE.ConeGeometry(0.24, 0.5, 6), 0x8d6844, x, h + 0.25, z); };
      for (let x = -hx; x <= hx; x += 0.52) { log(x, -hz); if (Math.abs(x) > 2.7) log(x, hz); } for (let z = -hz + 0.52; z < hz; z += 0.52) { log(-hx, z); log(hx, z); }
      log(-2.9, hz, true); log(2.9, hz, true); k.box(6.4, 0.3, 0.3, 0x5b4332, 0, 4.3, hz);
      k.wall(-hx - 0.3, hx + 0.3, -hz - 0.3, -hz + 0.3); k.wall(-hx - 0.3, -hx + 0.3, -hz, hz); k.wall(hx - 0.3, hx + 0.3, -hz, hz); k.wall(-hx - 0.3, -2.9, hz - 0.3, hz + 0.3); k.wall(2.9, hx + 0.3, hz - 0.3, hz + 0.3);
      [[-hx + 2, -hz + 2], [hx - 2, -hz + 2], [-hx + 2, hz - 2], [hx - 2, hz - 2]].forEach(([x, z]) => { [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([a, b]) => k.box(0.2, 4.6, 0.2, 0x5b4332, x + a, 0, z + b)); k.box(3.2, 0.2, 3.2, 0x8d6e50, x, 4.4, z); k.put('plain', new THREE.ConeGeometry(2.6, 1.5, 4), 0x574434, x, 6.9, z, { ry: PI / 4 }); [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([a, b]) => k.box(0.12, 1.7, 0.12, 0x5b4332, x + a, 4.5, z + b)); const p = k.world(x, z); addCol({ x: p.x, z: p.z, rx: 1.5, rz: 1.5, tag: 'tower' }); });
      T.campfire(k, 0, 0, true); T.tent(k, -9, -7, 0.9, 0x6e665e); T.tent(k, 9, -7, -0.9, 0x6e665e); T.tent(k, 0, -10.5, 0, 0x3a3430); T.crate(k, -6, 4); T.crate(k, -6.8, 4.8, 0.7); T.barrel(k, 7, 5); T.barrel(k, 7.9, 5.4); T.barrel(k, 12, -2);
      k.cyl(0.08, 0.1, 8, 0x5b4332, 5, 0, -11, { seg: 6 }); k.box(1.9, 1.2, 0.04, 0x16120f, 5.95, 6.7, -11, { bin: 'plain', j: 0 }); }
  };
  const RY = { ghost: PI / 2, ranch: -PI / 2, tower: PI, hay: -PI / 2, fort: 0 };
  function buildSites() { for (const n in SITES) { const s = SITES[n], k = new Kit(s.x, s.z, RY[n] !== undefined ? RY[n] : Math.atan2(-s.x, -s.z)); s.ry = k.ry; SB[s.kind](k, s); } }

  WORLD.build = async function (prog) {
    const step = async (p, fn) => { await fn(); prog(p); await new Promise(r => setTimeout(r, 0)); };
    await Promise.all([glb('barn', 14, 'w'), glb('farmhouse', 12, 'w'), glb('windmill', 11, 'h'), glb('watertower', 11, 'h'), glb('silo', 9, 'h'), glb('fence', 2.6, 'w'), glb('hay', 1.25, 'w')]); prog(0.3);
    await step(0.4, () => WORLD.land.buildGround());
    await step(0.5, () => WORLD.land.buildMesas());
    await step(0.6, buildTown);
    await step(0.7, buildSites);
    await step(0.8, () => WORLD.land.buildPlants());
    await step(0.85, () => { flushInst(); T.flush('sites'); WORLD.land.buildClouds(); });
  };
})();
