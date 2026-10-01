// feel.js — 손맛 (사장님 2026-09-17 "게임은 상호작용을 하려고 하는 거지 넓은 맵을 하염없이 걸으려는 게 아니야.
//   물리적으로 물을 긷고 꽃을 꺾고 버섯을 따는 재미가 있어야지")
//   · 버섯: 쪼그려 손을 대면 흔들리다 "뽁" 뽑혀 흙이 튀고, 왼손 바구니로 날아 들어가 쌓인다
//   · 꽃: 줄기가 휘다 "톡" 꺾여 꽃잎이 날리고, 오른손 꽃다발에 한 송이씩 는다
//   · 물: 두레박이 내려가 첨벙 → 차서 올라와 물 떨어지는 통이 오른손에 들린다 (장대는 world.js)
//   바구니·꽃다발·통은 뼈에 붙이지 않고 매 프레임 손 위치를 따라간다 (뼈 방향을 몰라도 늘 똑바로 선다)
(function () {
  const V3 = THREE.Vector3;
  const _a = new V3(), _b = new V3();
  let scene = null;

  // ── 바구니 ──
  function weaveTex() {
    const c = GEO.canvas(128, 64), g = c.getContext('2d');
    g.fillStyle = '#9a7442'; g.fillRect(0, 0, 128, 64);
    for (let y = 0; y < 64; y += 8) for (let x = 0; x < 128; x += 16) {
      const o = ((y / 8) % 2) * 8;
      const gr = g.createLinearGradient(x + o, 0, x + o + 16, 0);
      gr.addColorStop(0, '#6e4e28'); gr.addColorStop(0.5, '#c79a5c'); gr.addColorStop(1, '#6e4e28');
      g.fillStyle = gr; g.fillRect(x + o, y + 1, 15, 6);
    }
    g.fillStyle = 'rgba(40,24,10,.5)';
    for (let x = 0; x < 128; x += 8) g.fillRect(x, 0, 1.5, 64);
    const t = GEO.tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1);
    return t;
  }
  const M = {};
  function mats() {
    const wt = weaveTex();
    M.wicker = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.95, side: THREE.DoubleSide });
    M.rim = new THREE.MeshStandardMaterial({ color: 0x7a5630, roughness: 0.9 });
    M.stem = new THREE.MeshStandardMaterial({ color: 0x4f7a34, roughness: 0.9 });
    M.bucket = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.85 });
    M.band = new THREE.MeshStandardMaterial({ color: 0x4a4a48, roughness: 0.6, metalness: 0.3 });
    M.water = new THREE.MeshStandardMaterial({ color: 0x3f6f86, roughness: 0.15, transparent: true, opacity: 0.85 });
    M.dirt = new THREE.MeshStandardMaterial({ color: 0x4a3622, roughness: 1 });
    M.drop = new THREE.MeshBasicMaterial({ color: 0xbfe0ee, transparent: true, opacity: 0.8 });
    M.honey = new THREE.MeshStandardMaterial({ color: 0xe8a020, roughness: 0.2, emissive: 0x3a2000 });
    M.berry = new THREE.MeshStandardMaterial({ color: 0x2a3a8a, roughness: 0.35 });
    M.chip = new THREE.MeshStandardMaterial({ color: 0xd8b888, roughness: 0.9 });
    M.wood = new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9 });
    M.woodIn = new THREE.MeshStandardMaterial({ color: 0xe0c49a, roughness: 0.85, side: THREE.DoubleSide });
    M.iron = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.4, metalness: 0.6 });
    // 연기: 가장자리가 흐린 둥근 그림
    const sc = GEO.canvas(64, 64), sg = sc.getContext('2d');
    const gr = sg.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(235,235,228,0.9)'); gr.addColorStop(0.5, 'rgba(225,225,218,0.45)'); gr.addColorStop(1, 'rgba(220,220,210,0)');
    sg.fillStyle = gr; sg.fillRect(0, 0, 64, 64);
    M.smoke = new THREE.SpriteMaterial({ map: GEO.tex(sc), transparent: true, opacity: 0.5, depthWrite: false });
    // 벌: 노랑·검정 줄무늬 작은 점
    const bc = GEO.canvas(16, 16), bg = bc.getContext('2d');
    bg.fillStyle = '#f0c020'; bg.beginPath(); bg.arc(8, 8, 6, 0, 6.3); bg.fill();
    bg.fillStyle = '#1a1408'; bg.fillRect(5, 2, 2, 12); bg.fillRect(9, 2, 2, 12);
    M.bee = new THREE.SpriteMaterial({ map: GEO.tex(bc), transparent: true });
  }
  const shadowed = o => { o.traverse(m => { if (m.isMesh) m.castShadow = true; }); return o; };

  let basket = null, pile = null, bouquet = null, pail = null, pailWater = null;
  function build(sc) {
    scene = sc;
    mats();
    // 바구니: 원점 = 손잡이 꼭대기(손에 쥔 곳)
    basket = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.15, 16, 1, true).translate(0, -0.3, 0), M.wicker);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16).rotateX(-Math.PI / 2).translate(0, -0.375, 0), M.rim);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 5, 20).rotateX(Math.PI / 2).translate(0, -0.225, 0), M.rim);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.012, 5, 16, Math.PI).translate(0, -0.225, 0), M.rim);
    basket.add(body, bottom, rim, handle);
    pile = new THREE.Group(); pile.position.y = -0.36; basket.add(pile);
    scene.add(shadowed(basket));
    // 꽃다발: 원점 = 쥔 손
    bouquet = new THREE.Group();
    scene.add(bouquet);
    // 물통: 원점 = 손잡이
    pail = new THREE.Group();
    pail.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.26, 12).translate(0, -0.26, 0), M.bucket));
    for (const hy of [-0.34, -0.18]) pail.add(new THREE.Mesh(new THREE.CylinderGeometry(0.148 - (hy + 0.26) * 0.12, 0.148 - (hy + 0.26) * 0.12, 0.025, 12).translate(0, hy, 0), M.band));
    pail.add(new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.01, 4, 12, Math.PI).translate(0, -0.13, 0), M.band));
    pailWater = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12).rotateX(-Math.PI / 2).translate(0, -0.15, 0), M.water);
    pail.add(pailWater);
    pail.visible = false;
    scene.add(shadowed(pail));
  }

  // 종류별 모양은 땅에 난 것(ITEMS 의 여러 개 그리기)에서 그대로 빌린다
  function geoOf(t, sp) {
    const s = ITEMS.spots.find(o => o.t === t && o.sp === sp);
    return s ? { geo: s.mesh.geometry, mat: s.mesh.material } : null;
  }

  // 바구니 안 버섯 더미 — 바구니 목록이 바뀌면 다시 쌓는다
  let pileKey = '';
  function refreshPile() {
    const list = T.basket.slice(-14);
    const key = list.join(',');
    if (key === pileKey) return;
    pileKey = key;
    while (pile.children.length) pile.remove(pile.children[0]);
    const r = U.mulberry(5);
    list.forEach((id, i) => {
      const g = geoOf('m', id); if (!g) return;
      const m = new THREE.Mesh(g.geo, g.mat);
      const a = i * 2.4, rr = i === 0 ? 0 : 0.035 + (i % 3) * 0.03;
      m.position.set(Math.cos(a) * rr, 0.01 + Math.floor(i / 5) * 0.035, Math.sin(a) * rr);
      m.rotation.set((r() - 0.5) * 0.9, r() * 6.3, (r() - 0.5) * 0.9);
      m.scale.setScalar(id === 11 ? 0.35 : 0.62);
      m.castShadow = true;
      pile.add(m);
    });
  }
  // 꽃다발 — 들고 있는 꽃 수만큼
  let bqKey = '';
  function refreshBouquet() {
    const stems = [];
    for (const k in T.fbag) for (let i = 0; i < (T.fbag[k] || 0); i++) stems.push(+k);
    const list = stems.slice(0, 11);
    const key = list.join(',');
    if (key === bqKey) return;
    bqKey = key;
    while (bouquet.children.length) bouquet.remove(bouquet.children[0]);
    list.forEach((id, i) => {
      const g = geoOf('f', id); if (!g) return;
      const fl = ITEMS.FLOWERS[id];
      const m = new THREE.Mesh(g.geo, g.mat);
      const a = i * 2.3, lean = i === 0 ? 0 : 0.14 + (i % 3) * 0.06;
      const k = fl.h > 0.05 ? 0.55 / Math.max(0.35, fl.h) * 0.75 : 0.35;   // 키가 제각각인 꽃을 비슷한 길이로, 물에 뜨는 수련 잎은 작게
      m.scale.setScalar(k);
      m.position.set(0, fl.h > 0.05 ? -0.18 : 0.12, 0);
      m.rotation.set(Math.cos(a) * lean, a, Math.sin(a) * lean);
      m.castShadow = true;
      bouquet.add(m);
    });
    // 쥔 손 아래로 줄기 묶음
    if (list.length) {
      const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0xc0302a, roughness: 0.8 }));
      tie.position.y = -0.02; bouquet.add(tie);
    }
  }

  // ── 튀는 것들 (흙·꽃잎·물방울) ──
  const bits = [];
  const bitGeo = { cube: new THREE.BoxGeometry(0.025, 0.025, 0.025), petal: new THREE.PlaneGeometry(0.035, 0.022), drop: new THREE.SphereGeometry(0.014, 5, 4),
    berry: new THREE.SphereGeometry(0.024, 7, 5), chip: new THREE.BoxGeometry(0.05, 0.012, 0.025) };
  const petalMats = {};
  function spray(pos, n, kind, color, up) {
    for (let i = 0; i < n; i++) {
      let mat = M.dirt, geo = bitGeo.cube;
      if (kind === 'petal') { geo = bitGeo.petal; mat = petalMats[color] || (petalMats[color] = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.8 })); }
      if (kind === 'drop') { geo = bitGeo.drop; mat = M.drop; }
      if (kind === 'honey') { geo = bitGeo.drop; mat = M.honey; }
      if (kind === 'berry') { geo = bitGeo.berry; mat = M.berry; }
      if (kind === 'chip') { geo = bitGeo.chip; mat = M.chip; }
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      const a = Math.random() * 6.28, sp = (kind === 'petal' ? 0.6 : 1.2) * (0.5 + Math.random());
      scene.add(m);
      const b = { m, v: new V3(Math.cos(a) * sp, (up || 2.2) * (0.6 + Math.random() * 0.6), Math.sin(a) * sp), life: kind === 'petal' ? 1.6 : (kind === 'chip' ? 2.5 : 0.9), kind, spin: (Math.random() - 0.5) * 12 };
      if (kind === 'berry') { b.v.multiplyScalar(0.6); b.life = 1.25; b.home = true; }
      bits.push(b);
    }
  }
  function splash(pos, n) { spray(pos, n, 'drop', 0, 2.6); }
  function drip(pos) { spray(pos, 1, 'drop', 0, 0.1); }

  // ── 따는 동작 ──
  const acts = [];   // 진행 중인 뽑기
  // s: 땅에 난 것 (ITEMS spots), onPop: 뽑히는 순간 할 일(기록 올리기)
  function pluck(s, onPop) {
    const g = { geo: s.mesh.geometry, mat: s.mesh.material };
    const fl = s.t === 'f' ? ITEMS.FLOWERS[s.sp] : null;
    const a = { s, onPop, t: 0, mesh: null, kind: s.t, fl, from: new V3(s.x, s.y, s.z), popped: false, swim: PL.swim };
    // 손이 닿도록 한 걸음 다가간다 (0.55m 앞)
    if (!PL.swim && !PL.ride) {
      const dx = s.x - PL.pos.x, dz = s.z - PL.pos.z, d = Math.hypot(dx, dz);
      a.stepFrom = PL.pos.clone();
      a.stepTo = d > 0.6 ? new V3(s.x - dx / d * 0.55, PL.pos.y, s.z - dz / d * 0.55) : null;
    }
    a.g = g;
    acts.push(a);
  }
  const T_TOUCH = 0.45, T_POP = 0.72, T_LAND = 1.08;
  function actTick(a, dt) {
    a.t += dt;
    const t = a.t, s = a.s;
    if (a.stepTo && t < 0.3) {
      const k = Math.min(1, t / 0.3);
      const nx = U.lerp(a.stepFrom.x, a.stepTo.x, k), nz = U.lerp(a.stepFrom.z, a.stepTo.z, k);
      if (!COL.inside(nx, PL.pos.y + 0.5, nz, 0.3)) { PL.pos.x = nx; PL.pos.z = nz; }
    }
    const touch = a.swim ? 0.05 : T_TOUCH, pop = a.swim ? 0.2 : T_POP;
    // 손이 닿으면 땅에 난 것을 떼어 내 움직이는 사본으로 바꾼다
    if (!a.mesh && t >= touch) {
      s.on = false; ITEMS.setInst(s);
      a.mesh = new THREE.Mesh(a.g.geo, a.g.mat);
      a.mesh.position.copy(a.from);
      a.mesh.rotation.y = s.ry;
      a.mesh.castShadow = true;
      scene.add(a.mesh);
    }
    if (!a.mesh) return true;
    const m = a.mesh;
    if (!a.popped) {
      // 버섯은 좌우로 비틀며 조금씩 올라오고, 꽃은 줄기가 손 쪽으로 휜다
      const k = (t - touch) / Math.max(0.01, pop - touch);
      if (a.kind === 'f') { m.rotation.x = -0.5 * k; m.rotation.z = Math.sin(k * 20) * 0.05; }
      else if (a.kind === 'e') { m.rotation.z = Math.sin(k * 34) * 0.12; m.rotation.x = Math.cos(k * 29) * 0.08; if (!a.rustled) { a.rustled = true; AUD.sfx('rustle'); } }
      else { m.rotation.z = Math.sin(k * 26) * 0.22 * k; m.position.y = a.from.y + k * k * 0.05; m.scale.set(1 - 0.06 * Math.sin(k * 26), 1 + 0.08 * k, 1 - 0.06 * Math.sin(k * 26)); }
      if (t >= pop) {
        a.popped = true;
        m.scale.set(1, 1, 1);
        const top = a.from.clone(); top.y += 0.08;
        if (a.kind === 'e') {
          AUD.sfx('pluck');
          spray(a.from.clone().setY(a.from.y + 0.45), 6, 'berry', 0, 1.6);
        } else if (a.kind === 'f') {
          AUD.sfx('snap');
          if (a.fl) spray(top.setY(a.from.y + Math.max(0.1, a.fl.h)), 7, 'petal', a.fl.pc, 1.2);
        } else {
          AUD.sfx('pluck');
          spray(a.from.clone().setY(a.from.y + 0.02), 9, 'dirt', 0, 2.0);
        }
        a.onPop();
        a.flyFrom = m.position.clone();
      }
      return true;
    }
    // 블루베리 덤불은 날아가지 않고 제자리에서 흔들리다 가라앉는다 (열매만 바구니로)
    if (a.kind === 'e') {
      const k = Math.min(1, (t - pop) / 0.9);
      m.rotation.z = Math.sin(t * 30) * 0.1 * (1 - k);
      m.position.y = a.from.y - k * k * 0.9;
      if (k >= 1) { scene.remove(m); return false; }
      return true;
    }
    // 뽑힌 뒤: 손으로 → 바구니(버섯) / 꽃다발(꽃)
    const k = Math.min(1, (t - pop) / (T_LAND - T_POP));
    const dest = held() ? basketMouth() : bouquetPos();   // 바구니가 있으면 꽃도 바구니로
    m.position.lerpVectors(a.flyFrom, dest, k);
    m.position.y += Math.sin(k * Math.PI) * 0.35;
    m.rotation.x += dt * 6; m.rotation.z += dt * 4;
    m.scale.setScalar(U.lerp(1, 0.6, k));
    if (k >= 1) { scene.remove(m); return false; }
    return true;
  }
  function basketMouth() { basket.getWorldPosition(_a); _a.y -= 0.22; return _a.clone(); }
  function bouquetPos() { bouquet.getWorldPosition(_b); _b.y += 0.1; return _b.clone(); }

  // ── 바구니 줍기·내려놓기 (사장님 2026-09-17 "바구니를 들고 시작하는 게 아니라 특정 위치에 놓고 주워야지, 내려놓기도") ──
  //   T.bag = { held, x, z } — 처음엔 할머니네 현관 옆에 놓여 있다. 안에 든 버섯(T.basket)은 내려놓아도 그대로
  let bagAnim = null;   // { mode: 'pick'|'drop', t, ground }
  function homeSpot() {
    const h = WORLD.HOME.h;
    const [x, z] = h.L(-h.w * 0.15 + 1.4, -h.d / 2 - 1.1);
    return { x, z };
  }
  // 바구니는 늘 가지고 다닌다 — 손에 들거나 가방에 (사장님 2026-10-01 "바구니도 항시 소지하고 있게"). 땅에는 안 놓는다
  function bagReset() { T.bag = { held: true, x: null, z: null }; }
  function held() { return !!(T.bag && T.bag.held); }
  function bagGround() { return new V3(T.bag.x, TER.H(T.bag.x, T.bag.z) + 0.385, T.bag.z); }
  function bagNear() {
    if (held() || bagAnim || !T.bag || T.bag.x == null) return null;
    const d = Math.hypot(T.bag.x - PL.pos.x, T.bag.z - PL.pos.z);
    return d < 1.5 && Math.abs(TER.H(T.bag.x, T.bag.z) - PL.pos.y) < 1.2 ? { kind: 'bag', label: 'E 🧺' } : null;
  }
  // 오른손으로 집어 → 들어 올린 뒤 → 왼손으로 옮겨 쥔다 (오른손은 버섯 따기·던지기에 비워 둔다)
  //   내려놓을 땐 반대로 왼손 → 오른손 → 앞 땅. 'pick' 동작(속도 2.2, 0.6초부터)에서 오른손이 가장 낮은 때 0.7초·몸 앞 0.54m (게임 안에서 재었다)
  const BAG_GRAB = 0.68, BAG_UP = 1.1, BAG_SWAP = 0.32, BAG_FWD = 0.54;
  function pickBag() {
    if (held() || bagAnim) return;
    if (T.tool && !TOOLS.putDown(T.tool, true)) return;   // 한 번에 도구 하나 — 들고 있던 걸 내려놓고
    const dx = T.bag.x - PL.pos.x, dz = T.bag.z - PL.pos.z, d = Math.hypot(dx, dz) || 1;
    PL.yaw = Math.atan2(dx, dz);
    const nx = T.bag.x - dx / d * BAG_FWD, nz = T.bag.z - dz / d * BAG_FWD;
    if (!COL.inside(nx, PL.pos.y + 0.5, nz, 0.3)) { PL.pos.x = nx; PL.pos.z = nz; }
    PLAYER.doAct('pick', BAG_UP + 0.15, { speed: 2.2, from: 0.6 });
    bagAnim = { mode: 'pick', t: 0, ground: bagGround() };
  }
  // 내려놓기 = 가방에 넣기 (이름은 옛 그대로 — tools.js 가 부른다)
  function dropBag() {
    if (!held() || bagAnim) return false;
    T.bag = { held: false, stow: true, x: null, z: null };
    AUD.sfx('page', 0.7); U.save();
    return true;
  }
  // 가방에서 꺼내 든다 — 들고 있던 도구는 가방으로
  function takeBag() {
    if (held()) return true;
    if (bagAnim) return false;
    if (T.tool) TOOLS.putDown(T.tool, true);
    T.bag = { held: true, x: null, z: null };
    U.save();
    return true;
  }
  const _from = new V3();
  function bagTick(dt, L, R) {
    const A = bagAnim, t = (A.t += dt);
    const lerpTo = (a, b, k, arc) => { basket.position.lerpVectors(a, b, k); basket.position.y += Math.sin(k * Math.PI) * (arc || 0); };
    if (A.mode === 'pick') {
      if (t < BAG_GRAB) basket.position.copy(A.ground);
      else if (t < BAG_GRAB + 0.08) lerpTo(A.ground, R, (t - BAG_GRAB) / 0.08);
      else if (t < BAG_UP) basket.position.copy(R);
      else if (t < BAG_UP + BAG_SWAP) lerpTo(R, L, (t - BAG_UP) / BAG_SWAP, 0.08);   // 오른손 → 왼손
      else { T.bag = { held: true, x: null, z: null }; U.save(); bagAnim = null; basket.position.copy(L); }
      if (t >= BAG_GRAB && t - dt < BAG_GRAB) AUD.sfx('pick');
    } else {
      if (t < BAG_SWAP) lerpTo(L, R, t / BAG_SWAP, 0.08);   // 왼손 → 오른손
      else if (t < BAG_GRAB) basket.position.copy(R);
      else if (t < BAG_GRAB + 0.1) lerpTo(R, A.ground, (t - BAG_GRAB) / 0.1);
      else { basket.position.copy(A.ground); AUD.sfx('land'); bagAnim = null; }
    }
  }

  // ── 물 긷기 ──
  let fillT = -1, fillFrom = null, pailDown = null, pourT = -1, pourSplash = false;
  function pour() {
    if (pourT >= 0 || !(T.items.water > 0)) return;
    PLAYER.doAct('pick', 1.2, { speed: 1.6, from: 0.3 });
    pourT = 0; pourSplash = false; AUD.sfx('pour');
  }
  const _c = new V3();
  // 두레박에서 통으로: 우물 두레박 위치에서 손으로 옮겨 오는 모습
  function takePail(fromPos) { fillFrom = fromPos.clone(); fillT = 0; }

  // ── 장작 패기 (도끼로 통나무 토막을 반으로) ──
  //   o: 그루터기(STUMPS, y=윗면) 또는 장작더미(LOGS) — 그루터기면 그 위에, 더미면 발 앞 땅에 토막을 세운다
  let chopJob = null, axe = null;
  function makeAxe() {
    axe = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.62, 6).translate(0, 0.25, 0), M.wood);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.15).translate(0, 0.52, 0.06), M.iron);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.11, 0.03).translate(0, 0.52, 0.145), M.iron);
    axe.add(handle, head, edge);
    shadowed(axe);
    axe.visible = false;
    scene.add(axe);
  }
  function halfLog(side) {
    const g = new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10, 1, false, side ? 0 : Math.PI, Math.PI);
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(g, [M.wood, M.woodIn, M.woodIn]));
    const cut = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.3), M.woodIn);
    cut.rotation.y = side ? 0 : Math.PI;
    grp.add(cut);
    return shadowed(grp);
  }
  // 'chop' 동작(속도 1.25)에서 도끼날이 토막 높이를 지나는 때와 그때 날의 자리(몸 기준 앞·옆) — 게임 안에서 재었다
  const CHOP_HIT = 0.683, CHOP_FWD = 0.99, CHOP_SIDE = 0.36;
  const offX = yaw => Math.sin(yaw) * CHOP_FWD + Math.cos(yaw) * CHOP_SIDE;
  const offZ = yaw => Math.cos(yaw) * CHOP_FWD - Math.sin(yaw) * CHOP_SIDE;
  let blockMesh = null;
  // 그루터기마다 장작 토막 하나를 미리 올려 둔다 — 패면 1개, 그 그루터기는 한동안 빈다
  //   (사장님 2026-09-19 "그루터기에서 장작은 한번에 1개만 얻을 수 있게, 장작을 미리 놔두고")
  const STUMP_BACK = 300;   // 다시 토막이 놓이기까지(초). 사람이 가까이 있으면 멀어질 때까지 미룬다
  function stumpLog(o) {
    const log = new THREE.Group();
    log.add(halfLog(0), halfLog(1));
    log.position.set(o.x, o.y - 0.03 + 0.15, o.z);
    log.rotation.y = Math.random() * 6.28;
    scene.add(log); o.log = log;
  }
  let stumpT = 0;
  function stumpTick(dt) {
    stumpT -= dt; if (stumpT > 0) return; stumpT = 0.5;
    for (const o of WORLD.STUMPS) {
      const d = Math.hypot(o.x - PL.pos.x, o.z - PL.pos.z);
      if (!o.log) {
        if ((o.cool || 0) > T.time) continue;
        if (o.used && d < 25) { o.cool = T.time + 5; continue; }   // 보는 앞에서 생기지 않게
        stumpLog(o);
      }
      o.log.visible = d < 70;
    }
  }
  function chop(o, onDone) {
    if (!axe) makeAxe();
    const has = !!PLAYER.CH.acts.chop;
    const stump = WORLD.STUMPS.includes(o);
    let bx, bz, by, yaw;
    if (stump) {
      // 그루터기가 받침: 도끼날이 그 위를 지나도록 선다
      bx = o.x; bz = o.z; by = o.y - 0.03;
      yaw = Math.atan2(bx - PL.pos.x, bz - PL.pos.z);
      const nx = bx - offX(yaw), nz = bz - offZ(yaw);
      if (has && !COL.inside(nx, PL.pos.y + 0.5, nz, 0.3)) { PL.pos.x = nx; PL.pos.z = nz; }
      else yaw = Math.atan2(bx - PL.pos.x, bz - PL.pos.z);
    } else {
      // 장작더미: 발 앞에 받침 토막을 하나 놓는다
      yaw = PL.yaw;
      bx = PL.pos.x + offX(yaw); bz = PL.pos.z + offZ(yaw);
      const gy = WORLD.groundAt(bx, bz, PL.pos.y + 0.3);
      if (!blockMesh) {
        blockMesh = new THREE.Group();
        blockMesh.add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.45, 10).translate(0, 0.225, 0), M.wood));
        blockMesh.add(new THREE.Mesh(new THREE.CircleGeometry(0.26, 10).rotateX(-Math.PI / 2).translate(0, 0.451, 0), M.woodIn));
        shadowed(blockMesh); scene.add(blockMesh);
      }
      blockMesh.position.set(bx, gy - 0.02, bz); blockMesh.visible = true;
      by = gy + 0.43;
    }
    PL.yaw = yaw;
    let log = null, preset = false;
    if (stump) o.used = true;
    if (stump && o.log) { log = o.log; o.log = null; log.visible = true; preset = true; }   // 미리 놓인 토막을 팬다
    else {
      log = new THREE.Group();
      log.add(halfLog(0), halfLog(1));
      log.position.set(bx, by + 1.0, bz);
      log.rotation.y = yaw;
      scene.add(log);
    }
    axeStuck = null; axe.visible = true;
    PLAYER.doAct(has ? 'chop' : 'pick', has ? 1.9 : 1.7, has ? { speed: 1.25, once: true } : { speed: 1.2, from: 0.2 });
    chopJob = { t: 0, log, by, bx, bz, hit: has ? CHOP_HIT : 0.75, onDone, parts: null, block: !stump, preset };
  }
  function chopTick(dt) {
    const j = chopJob; if (!j) return;
    j.t += dt;
    if (!axeStuck) axe.visible = PL.ch.holder.visible;
    // 토막이 떨어져 선다 (그루터기에 미리 놓인 토막은 이미 서 있다)
    if (!j.parts && !j.preset) {
      const k = Math.min(1, j.t / 0.3);
      j.log.position.y = j.by + 0.15 + (1 - k * k) * 0.85;
      if (k >= 1 && !j.landed) { j.landed = true; AUD.sfx('land'); }
    }
    if (!j.parts && j.t >= j.hit) {
      // 쩍! 반으로 갈라져 양쪽으로 튄다
      AUD.sfx('chop');
      if (window.CAM) CAM.shake = Math.max(CAM.shake || 0, 0.18);
      spray(new V3(j.bx, j.by + 0.3, j.bz), 10, 'chip', 0, 2.4);
      const side = new V3(Math.cos(PL.yaw), 0, -Math.sin(PL.yaw));
      const kids = j.log.children.slice();
      j.log.updateMatrixWorld(true);
      j.parts = kids.map((h, i) => {
        const wp = new V3(), wq = new THREE.Quaternion();
        h.getWorldPosition(wp); h.getWorldQuaternion(wq);
        j.log.remove(h); scene.add(h); h.position.copy(wp); h.quaternion.copy(wq);
        const sgn = i ? 1 : -1;
        return { m: h, v: new V3(side.x * sgn * 1.6, 2.0, side.z * sgn * 1.6), ax: new V3(-Math.sin(PL.yaw), 0, -Math.cos(PL.yaw)), w: sgn * 7, rest: false };
      });
      scene.remove(j.log);
    }
    if (j.parts) {
      const since = j.t - j.hit;
      for (const q of j.parts) {
        if (since < 0.9) {
          if (q.rest) continue;
          q.v.y -= 9.8 * dt;
          q.m.position.addScaledVector(q.v, dt);
          q.m.rotateOnWorldAxis(q.ax, q.w * dt);
          const g = WORLD.groundAt(q.m.position.x, q.m.position.z, q.m.position.y + 0.3) + 0.08;
          if (q.m.position.y < g) {
            q.m.position.y = g;
            if (q.v.y < -1.5) { q.v.y *= -0.3; q.v.x *= 0.5; q.v.z *= 0.5; q.w *= 0.4; AUD.sfx('tock', 0.6); }
            else { q.rest = true; q.v.set(0, 0, 0); }
          }
        } else {
          // 허리 숙여 오른손으로 줍고(0.68초) → 들어 올려 → 등에 멘 장작 묶음으로
          const u = since - 0.9;
          if (!q.from) q.from = q.m.position.clone();
          if (u < BAG_GRAB - 0.18) continue;
          if (u < BAG_GRAB) q.m.position.lerpVectors(q.from, hand.R, (u - (BAG_GRAB - 0.18)) / 0.18);
          else if (u < BAG_UP) q.m.position.copy(hand.R);
          else {
            if (!q.up) q.up = q.m.position.clone();
            const k = Math.min(1, (u - BAG_UP) / 0.3);
            q.m.position.lerpVectors(q.up, backPos(), k); q.m.position.y += Math.sin(k * Math.PI) * 0.25;
          }
        }
      }
      if (since >= 0.9 && !j.picking) {
        j.picking = true;
        stickAxe(j);
        PLAYER.doAct('pick', BAG_UP + 0.2, { speed: 2.2, from: 0.6 });
      }
      if (j.picking && since - 0.9 >= BAG_UP && !j.grabbed) { j.grabbed = true; AUD.sfx('tock', 0.7); }
      if (since >= 0.9 + BAG_UP + 0.3) {
        for (const q of j.parts) scene.remove(q.m);
        if (j.block && blockMesh) blockMesh.visible = false;
        chopJob = null;
        j.onDone();
      }
    }
  }
  // 자루는 손가락 방향(손 뼈 +Y)으로 뻗고, 날은 손등 반대(-X) — 도끼질 동작에서 재어 맞췄다(내려칠 때 앞·아래)
  const AXE_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
  const _gy = new V3();
  // 다 패면 도끼는 받침 윗면에 꽂아 두고 간다 (멀어지면 치운다)
  let axeStuck = null;
  function stickAxe(j) {
    axeStuck = { x: j.bx, z: j.bz };
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI - 0.5, PL.yaw, 0, 'YXZ'));
    const head = new V3(0, 0.52, 0.1).applyQuaternion(q);
    axe.quaternion.copy(q);
    axe.position.set(j.bx - head.x, j.by + 0.04 - head.y, j.bz - head.z);
    AUD.sfx('tock', 0.8);
  }
  function axeFollow() {
    if (!axe || !axe.visible) return;
    if (axeStuck) {
      if (!chopJob && Math.hypot(PL.pos.x - axeStuck.x, PL.pos.z - axeStuck.z) > 4) { axe.visible = false; axeStuck = null; }
      return;
    }
    const b = PLAYER.CH.bones.RightHand;
    b.getWorldPosition(axe.position);
    b.getWorldQuaternion(axe.quaternion);
    _gy.set(0, 1, 0).applyQuaternion(axe.quaternion);
    axe.position.addScaledVector(_gy, 0.07);   // 손바닥 가운데로
    axe.quaternion.multiply(AXE_Q);
  }

  // ── 등에 멘 장작 묶음 — 가진 장작 수만큼 쌓인다 ──
  let backLoad = null, backKey = -1;
  const _bk = new V3();
  function backPos() {
    const sp = PLAYER.CH.bones.Spine2;
    sp.getWorldPosition(_bk);
    _bk.x -= Math.sin(PL.yaw) * 0.22; _bk.z -= Math.cos(PL.yaw) * 0.22; _bk.y -= 0.08;
    return _bk;
  }
  function backTick(vis) {
    const n = Math.min(4, T.items.wood || 0);
    if (!backLoad) {
      backLoad = new THREE.Group();
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 4, 14), M.rim);
      strap.rotation.y = Math.PI / 2; strap.position.y = -0.02; backLoad.add(strap);
      backLoad.userData.logs = [];
      // 둥근 장작을 가로로 두 줄씩 (껍질 + 밝은 나이테 마구리)
      const logGeo = new THREE.CylinderGeometry(0.06, 0.065, 0.4, 9).rotateZ(Math.PI / 2);
      for (let i = 0; i < 4; i++) {
        const g = new THREE.Mesh(logGeo, [M.wood, M.woodIn, M.woodIn]);
        g.position.set(((i * 7) % 3 - 1) * 0.02, -0.08 + ((i / 2) | 0) * 0.12, (i % 2 ? -0.065 : 0.065) * 0.9);
        g.rotation.x = i * 1.3;
        backLoad.add(g); backLoad.userData.logs.push(g);
      }
      shadowed(backLoad);
      scene.add(backLoad);
    }
    if (n !== backKey) { backKey = n; backLoad.userData.logs.forEach((g, i) => { g.visible = i < n; }); }
    backLoad.visible = vis && n > 0 && !PL.swim;
    if (!backLoad.visible) return;
    backLoad.position.copy(backPos());
    backLoad.rotation.set(0, PL.yaw, 0);
  }

  // ── 꿀 뜨기 (연기 뿜고 → 벌이 날아오르고 → 벌집 판을 들어 올린다) ──
  let honeyJob = null;
  function combMat() {
    if (M.comb) return M.comb;
    const c = GEO.canvas(64, 64), g = c.getContext('2d');
    g.fillStyle = '#c98a1a'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#8a5a10'; g.lineWidth = 1.5;
    for (let y = 0; y < 10; y++) for (let x = 0; x < 9; x++) {
      const cx = x * 7.5 + (y % 2) * 3.75, cy = y * 6.5;
      g.beginPath();
      for (let k = 0; k < 6; k++) { const aa = k / 6 * 6.28 + 0.52; const px = cx + Math.cos(aa) * 3.8, py = cy + Math.sin(aa) * 3.8; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.closePath(); g.stroke();
    }
    M.comb = new THREE.MeshStandardMaterial({ map: GEO.tex(c), roughness: 0.25, emissive: 0x201000 });
    return M.comb;
  }
  function honey(o, onDone) {
    PL.yaw = Math.atan2(o.x - PL.pos.x, o.z - PL.pos.z);
    PLAYER.doAct('pick', 2.4, { speed: 0.9, from: 0.3 });
    const top = new V3(o.x, o.y + 1.05, o.z);
    const bees = [];
    for (let i = 0; i < 22; i++) {
      const m = new THREE.Sprite(M.bee); m.scale.setScalar(0.045);
      m.position.copy(top); m.visible = false; scene.add(m);
      bees.push({ m, a: Math.random() * 6.28, r: 0.3 + Math.random() * 0.6, h: Math.random() * 0.8, sp: 3 + Math.random() * 4 });
    }
    const cm = combMat();
    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.03), [M.wood, M.wood, M.wood, M.wood, cm, cm]);
    comb.position.set(o.x, o.y + 0.88, o.z); comb.rotation.y = PL.yaw; comb.visible = false;
    shadowed(comb); scene.add(comb);
    // 벌집 판은 벌통 몸통에서 주인공 쪽으로 서랍처럼 빠져나온다
    const dx = PL.pos.x - o.x, dz = PL.pos.z - o.z, d = Math.hypot(dx, dz) || 1;
    honeyJob = { t: 0, o, top, puffs: [], bees, comb, onDone, buzz: false, in: new V3(o.x, o.y + 0.88, o.z), lift: new V3(o.x + dx / d * 0.55, o.y + 1.0, o.z + dz / d * 0.55) };
  }
  function honeyTick(dt) {
    const j = honeyJob; if (!j) return;
    j.t += dt;
    // 연기 세 번
    if (j.puffs.length < 3 && j.t > j.puffs.length * 0.28) {
      const m = new THREE.Sprite(M.smoke.clone());
      m.position.set((PL.pos.x + j.o.x) / 2, j.o.y + 0.9, (PL.pos.z + j.o.z) / 2);
      scene.add(m); j.puffs.push({ m, t: 0 });
      AUD.sfx('puff');
    }
    for (const p of j.puffs) {
      p.t += dt;
      p.m.scale.setScalar(0.3 + p.t * 0.8);
      p.m.position.y += dt * 0.5;
      p.m.position.x += (j.o.x - p.m.position.x) * dt * 1.5; p.m.position.z += (j.o.z - p.m.position.z) * dt * 1.5;
      p.m.material.opacity = Math.max(0, 0.55 * (1 - p.t / 1.8));
    }
    // 벌이 붕 날아오른다
    if (j.t > 0.5) {
      if (!j.buzz) { j.buzz = true; AUD.sfx('bees'); }
      const rise = Math.min(1, (j.t - 0.5) / 0.6);
      for (const b of j.bees) {
        b.m.visible = true;
        b.a += b.sp * dt;
        b.m.position.set(j.o.x + Math.cos(b.a) * b.r * (0.4 + rise), j.top.y + b.h * rise + Math.sin(b.a * 3) * 0.08, j.o.z + Math.sin(b.a) * b.r * (0.4 + rise));
        b.m.rotation.y = -b.a;
      }
    }
    // 벌집 판을 들어 올려 손으로
    if (j.t > 0.9) {
      j.comb.visible = PL.ch.holder.visible || j.t < 1.4;
      const k = Math.min(1, (j.t - 0.9) / 0.5);
      j.comb.position.lerpVectors(j.in, j.lift, k * k * (3 - 2 * k));
      if (j.t > 1.4) {
        const k2 = Math.min(1, (j.t - 1.4) / 0.45);
        j.comb.position.lerpVectors(j.lift, hand.R, k2);
        j.comb.scale.setScalar(1 - k2 * 0.6);
      }
      if (Math.random() < dt * 8) { j.comb.getWorldPosition(_a); _a.y -= 0.15; spray(_a, 1, 'honey', 0, 0.05); }
    }
    if (j.t > 2.4) {
      for (const p of j.puffs) scene.remove(p.m);
      for (const b of j.bees) scene.remove(b.m);
      scene.remove(j.comb);
      honeyJob = null;
      j.onDone();
    }
  }

  // ── 매 프레임 ──
  const hand = { L: new V3(), R: new V3() };
  function update(dt) {
    if (!scene || !PLAYER.CH.bones.LeftHand) return;
    stumpTick(dt);
    const vis = PL.ch && PL.ch.holder.visible && T.mode !== 'title';
    PLAYER.CH.bones.LeftHand.getWorldPosition(hand.L);
    PLAYER.CH.bones.RightHand.getWorldPosition(hand.R);
    const yaw = PL.yaw;
    // 바구니: 들고 있으면 왼손에 걸고 흔들림은 손을 따라, 아니면 놓아둔 자리에
    if (!T.bag) bagReset();
    const handPos = _b.copy(hand.L); handPos.y += 0.06;
    if (bagAnim) {
      _from.copy(hand.R); _from.y += 0.06;
      bagTick(dt, handPos, _from);
      basket.rotation.set(0, bagAnim ? yaw : (held() ? yaw : 0.6), 0);
      basket.visible = vis || T.mode === 'title';
    } else if (held()) {
      basket.visible = vis && !PL.swim;
      // 사다리를 탈 땐 두 손이 다 필요하다 — 바구니는 등에 멘다
      if (PL.climb) { basket.position.copy(backPos()); basket.position.x += Math.sin(yaw) * 0.13; basket.position.z += Math.cos(yaw) * 0.13; basket.position.y -= 0.05; basket.rotation.set(0, yaw + Math.PI / 2, 0); }
      else { basket.position.copy(handPos); basket.rotation.set(0, yaw, 0); }
    } else if (T.bag.x != null) {   // 옛 저장: 땅에 놓인 바구니 (tools.migrate 가 가방으로 옮긴다)
      basket.visible = true;
      basket.position.copy(bagGround());
      basket.rotation.set(0, 0.6, 0);
    } else basket.visible = false;   // 가방 안
    // 물통: 들고 있으면 오른손, 꽃다발은 그때 바구니에 꽂는다
    const water = (T.items.water || 0) > 0;
    const carryPail = TOOLS.held('pail');   // 물통은 손에 든 도구 (tools.js) — 빈 채로도 든다
    pail.visible = vis && carryPail && !PL.swim;
    pailWater.visible = water;
    const _hr = _c.copy(hand.R); _hr.y += 0.06;
    if (fillT >= 0) {
      fillT += dt;
      const k = Math.min(1, fillT / 0.45);
      pail.position.lerpVectors(fillFrom, _hr, k); pail.position.y += Math.sin(k * Math.PI) * 0.3;
      if (k >= 1) fillT = -1;
    } else if (water && pourT < 0 && (PL.act || pailDown)) {
      // 버섯 따기·도끼질 같은 일을 할 땐 오른손을 비운다: 오른발 옆에 내려놓고, 끝나면 다시 든다
      if (PL.act && !pailDown) {
        const rx = -Math.cos(yaw), rz = Math.sin(yaw);
        const gx = PL.pos.x + rx * 0.38 + Math.sin(yaw) * 0.05, gz = PL.pos.z + rz * 0.38 + Math.cos(yaw) * 0.05;
        pailDown = { t: 0, from: pail.position.clone(), at: new V3(gx, WORLD.groundAt(gx, gz, PL.pos.y + 0.3) + 0.39, gz), yaw, back: -1 };
      }
      const P = pailDown;
      P.t += dt;
      if (PL.act && P.back < 0) {
        const k = Math.min(1, P.t / 0.25);
        pail.position.lerpVectors(P.from, P.at, k);
        if (k >= 1 && !P.landed) { P.landed = true; AUD.sfx('land', 0.5); }
      } else {
        if (P.back < 0) P.back = 0;
        P.back += dt;
        const k = Math.min(1, P.back / 0.25);
        pail.position.lerpVectors(P.at, _hr, k);
        if (k >= 1) pailDown = null;
      }
    } else {
      pail.position.copy(_hr);
    }
    pail.rotation.set(pailDown ? 0 : Math.sin(T.time * 3) * 0.04, pailDown ? pailDown.yaw : yaw, 0);
    // 물 쏟기: 앞으로 기울여 쏟고 빈 통은 내려놓는다 (사장님 2026-09-18 "물을 길었는데 놓을 데가 없어")
    if (pourT >= 0) {
      pourT += dt;
      const k = Math.min(1, pourT / 0.35);
      pail.rotation.x = k * 1.9;
      if (pourT > 0.25 && pourT < 1.0) {
        pail.getWorldPosition(_a); _a.x += Math.sin(yaw) * 0.18; _a.z += Math.cos(yaw) * 0.18; _a.y -= 0.12;
        for (let i = 0; i < 3; i++) spray(_a, 1, 'drop', 0, 0.3);
        if (!pourSplash && pourT > 0.45) { pourSplash = true; AUD.sfx('splash'); const g = _a.clone(); g.y = WORLD.groundAt(g.x, g.z, PL.pos.y + 0.3) + 0.05; splash(g, 10); }
      }
      if (pourT > 1.15) { pourT = -1; T.items.water = 0; U.save(); }
    }
    pailWater.visible = water || fillT >= 0;
    if (pail.visible && Math.hypot(PL.vel.x, PL.vel.z) > 0.5 && Math.random() < dt * 3) { pail.getWorldPosition(_a); _a.y -= 0.35; drip(_a); }
    // 꽃다발: 오른손 (물통을 들면 바구니 옆에 꽂아 둔다)
    refreshPile(); refreshBouquet();
    bouquet.visible = vis && !PL.swim && bouquet.children.length > 0;
    // 바구니를 들었으면 꽃다발은 바구니에 꽂는다 (사장님 2026-09-17 "바구니가 있는데 굳이 손에 들고다닐 필요가 없자나")
    if (held() && !bagAnim) {
      bouquet.position.copy(basket.position); bouquet.position.y -= 0.2;
      bouquet.position.x += Math.cos(yaw) * 0.05; bouquet.position.z -= Math.sin(yaw) * 0.05;
      bouquet.rotation.set(0.15, yaw, -0.35);
      bouquet.scale.setScalar(0.75);
    } else if (carryPail) { bouquet.scale.setScalar(1); bouquet.position.copy(hand.L); bouquet.position.y -= 0.1; bouquet.position.x += Math.sin(yaw + 1.5) * 0.08; bouquet.position.z += Math.cos(yaw + 1.5) * 0.08; bouquet.rotation.set(0.35, yaw, 0.2); }
    else { bouquet.scale.setScalar(1); bouquet.position.copy(hand.R); bouquet.rotation.set(0.25 + Math.sin(T.time * 2) * 0.03, yaw, 0); }
    // 뽑기
    for (let i = acts.length - 1; i >= 0; i--) if (!actTick(acts[i], dt)) acts.splice(i, 1);
    chopTick(dt); axeFollow(); honeyTick(dt); backTick(vis);
    // 튀는 것
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.life -= dt;
      if (b.kind === 'petal') { b.v.y -= 2.2 * dt; b.v.multiplyScalar(1 - dt * 2.2); b.m.rotation.x += b.spin * dt; b.m.rotation.y += b.spin * 0.7 * dt; }
      else b.v.y -= 9.8 * dt;
      if (b.home && b.life < 0.45) {   // 블루베리: 땅에서 통통 튀다가 바구니로 쏙
        b.m.position.lerp(held() ? basketMouth() : bouquetPos(), Math.min(1, dt * 12));
        if (b.life <= 0) { scene.remove(b.m); bits.splice(i, 1); }
        continue;
      }
      b.m.position.addScaledVector(b.v, dt);
      const gy = b.kind === 'drop' || b.kind === 'honey' ? -99 : WORLD.groundAt(b.m.position.x, b.m.position.z, b.m.position.y + 0.2);
      if (b.m.position.y < gy) {
        b.m.position.y = gy;
        if ((b.kind === 'berry' || b.kind === 'chip') && b.v.y < -0.8) { b.v.y *= -0.45; b.v.x *= 0.7; b.v.z *= 0.7; }
        else { b.v.set(0, 0, 0); b.spin = 0; }
      }
      if (b.kind === 'chip' || b.kind === 'berry') { b.m.rotation.x += b.spin * dt; b.m.rotation.z += b.spin * 0.6 * dt; }
      if (b.kind === 'chip' && b.life < 0.5) b.m.scale.setScalar(Math.max(0.01, b.life * 2));
      if (b.life <= 0) { scene.remove(b.m); bits.splice(i, 1); }
    }
  }

  // 땅에 놓인 물통 (tools.js) — 손 물통과 같은 모양
  function pailMesh() { const g = pail.clone(); g.children.forEach(c => { if (c.geometry === pailWater.geometry) c.visible = false; }); g.visible = true; return g; }
  window.FEEL = { pour, get pouring() { return pourT >= 0; }, build, update, pluck, takePail, chop, honey, get axe() { return axe; }, splash, drip, bagNear, pickBag, dropBag, takeBag, bagReset, held, homeSpot, pailMesh,
    bagPos: () => (held() || !T.bag ? null : { x: T.bag.x, z: T.bag.z }), get busy() { return acts.length > 0; } };
})();
