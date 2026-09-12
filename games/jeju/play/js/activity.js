// 액티비티 — 명소 표식, 가까이 가면 뜨는 행동 단추, 촬영·먹기·정상·탑승·여객선·코스·수집·잠수·비행·렌터카, 지도, 코인·스탬프 저장
(function () {
  const I = ISLAND, H = I.H, { inst } = GEO;
  const rng = NOISE.makeRng(31337); const R = () => rng();
  const A = { spots: SPOTS.list, done: new Set(), coins: 0, owned: ['open'], near: null, cur: null, markers: [], rings: [], items: [], ride: null, ferry: null, msgT: 0, task: null, scene: null, hold: {}, hintT: 0 };
  const PRICE = { open: 0, car: 1500, suv: 2500, ev: 3500, sport: 6000, camper: 4000 };
  const CARNAME = { car: '소형차', open: '오픈카', suv: 'SUV', ev: '전기차', sport: '스포츠카', camper: '캠핑카' };
  const ACTION = { photo: '촬영', food: '먹기', oreum: '촬영', ride: '탑승', ferry: '탑승', course: '출발', collect: '시작', dive: '입수', fly: '이륙', shop: '렌터카' };
  const REWARD = { photo: 100, food: 80, oreum: 200, ride: 150, ferry: 50 };

  // ── 명소 조건 (하늘·물때·아이템) : 막지 않고 안내한다. 조건이 맞으면 표식이 밝아진다 ──
  const SUNRISE = new Set(['seongsan', 'suwolbong', 'gwangchigi']);      // 아침에만 스탬프
  const SUNSET  = new Set(['sarabong', 'geumoreum']);                    // 저녁에만 스탬프
  const TIDE    = new Set(['haenyeo', 'haenyeo_sagye']);                 // 물때(썰물)에만 입수
  const FOOD_ITEM = { jagunae: 'fish', dongmun: 'orange', ollemarket: 'orange' }; // 잡은·딴 것을 내면 보너스
  const hourNow = () => (window.SKY ? SKY.hour : 12);
  const inHour = (a, b) => { const x = hourNow(); return x >= a && x < b; };
  function tideLow() { const p = hourNow() % 12.42; return p < 2.8 || p > 9.6; }
  function nextLow() { const x = Math.floor(hourNow()); for (let k = 0; k < 25; k++) { const h = (x + k) % 24, p = h % 12.42; if (p < 2.8 || p > 9.6) return ('0' + h).slice(-2) + ':00'; } return ''; }
  function cond(s) {
    if (SUNRISE.has(s.id)) return { ok: inHour(4.8, 9.6),  tag: '🌅', hint: '🌅 05–09' };
    if (SUNSET.has(s.id))  return { ok: inHour(17.3, 20.6), tag: '🌇', hint: '🌇 18–20' };
    if (TIDE.has(s.id))    return { ok: tideLow(),          tag: '🌊', hint: '🌊 ' + nextLow() };
    if (s.kind === 'oreum') return { ok: (window.SKY ? SKY.night : 0) < 0.42, tag: '☀️', hint: '☀️ 낮' };
    return null;
  }
  function locked(s) { const c = cond(s); return c && !c.ok && !A.done.has(s.id) ? c : null; }
  function foodBonus(s) { const it = FOOD_ITEM[s.id]; if (!it) return 0; const n = A.hold[it] || 0; if (n <= 0) return 0; A.hold[it] = 0; return Math.min(300, n * 40); }
  function hint(text) { const h = el('hint'); if (!h) return; h.textContent = text; h.classList.add('on'); A.hintT = 1.8; }
  const el = id => document.getElementById(id);

  // ── 저장 ──
  function load() { try { const j = JSON.parse(localStorage.getItem('jeju.prog') || '{}'); A.coins = j.coins || 0; A.done = new Set(j.done || []); A.owned = j.owned || ['open']; if (!A.owned.includes('open')) A.owned.unshift('open'); A.hold = j.hold || {}; A.calls = j.calls || {}; A.introDone = !!j.intro; if (j.car && A.owned.includes(j.car)) PLAYER.car = j.car; } catch (e) {} }
  function save() { try { localStorage.setItem('jeju.prog', JSON.stringify({ coins: A.coins, done: [...A.done], owned: A.owned, car: PLAYER.car, hold: A.hold, calls: A.calls, intro: !!A.introDone, est: window.ESTATE ? ESTATE.state() : undefined })); } catch (e) {} }

  // ── 표식 (이모지 스프라이트 + 바닥 고리) ──
  function emojiTex(icon, done) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.beginPath(); g.arc(64, 64, 56, 0, 6.29); g.fillStyle = done ? 'rgba(255,215,80,0.95)' : 'rgba(255,255,255,0.92)'; g.fill(); g.lineWidth = 6; g.strokeStyle = done ? '#b8860b' : '#2b3a4a'; g.stroke();
    g.font = '64px "Segoe UI Emoji", "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 64, 70);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function markerFor(s) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(s.icon, A.done.has(s.id)), transparent: true, depthWrite: false }));
    sp.scale.set(7, 7, 1); const y = spotY(s); sp.position.set(s.x, y + 9, s.z); sp.renderOrder = 5; A.scene.add(sp);
    const ring = new THREE.Mesh(new THREE.RingGeometry(9, 11, 32), new THREE.MeshBasicMaterial({ color: A.done.has(s.id) ? 0xffd24a : 0x4fd8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(s.x, y + 0.35, s.z); ring.renderOrder = 4; A.scene.add(ring);
    return { s, sp, ring, ph: R() * 6 };
  }
  function spotY(s) { if (s.kind === 'oreum' && s.summit) return H(s.x, s.z); if (s.kind === 'dive' || s.veh === 'kayak' || s.veh === 'boat' || s.veh === 'surf') return Math.max(0, H(s.x, s.z)); return Math.max(0, H(s.x, s.z)); }
  // 목적지 깃발은 명소 한가운데가 아니라 차가 닿는 길 끝에 세운다.
  // 박물관처럼 큰 건물은 가운데가 건물 속이라 화살표를 따라가도 영영 안 닿는다 (사장님 2026-09-11)
  function destPt(s) {
    if (!s) return s;
    if (s._dp) return s._dp;
    let x = s.x, z = s.z;
    if (s.roadEnd) { x = s.roadEnd.x; z = s.roadEnd.z; }                      // 길 끝이 있으면 거기
    if (window.PLAYER && PLAYER.insideBox && PLAYER.insideBox(x, z, 2)) {     // 그래도 건물 속이면 길 쪽으로 밀어낸다
      let ux = 0, uz = 1;
      const nr = (window.ROADS && ROADS.nearest) ? ROADS.nearest(x, z) : null;
      if (nr && nr.e) {
        const e = nr.e, ex = e.b.x - e.a.x, ez = e.b.z - e.a.z, L2 = ex * ex + ez * ez || 1;
        const tt = Math.max(0, Math.min(1, ((x - e.a.x) * ex + (z - e.a.z) * ez) / L2));
        const px = e.a.x + ex * tt, pz = e.a.z + ez * tt, L = Math.hypot(px - x, pz - z) || 1;
        ux = (px - x) / L; uz = (pz - z) / L;
      }
      for (let r = 4; r <= 140; r += 4) { const nx = x + ux * r, nz = z + uz * r; if (!PLAYER.insideBox(nx, nz, 2) && H(nx, nz) > 0.5) { x = nx; z = nz; break; } }
    }
    s._dp = { x: x, z: z }; return s._dp;
  }
  function refreshMarker(m) { m.sp.material.map.dispose(); m.sp.material.map = emojiTex(m.s.icon, A.done.has(m.s.id)); m.sp.material.needsUpdate = true; m.ring.material.color.set(A.done.has(m.s.id) ? 0xffd24a : 0x4fd8ff); }

  function init(scene) {
    A.scene = scene; load();
    // 바다 명소·오름 정상 자리 보정: 오름은 정상, 물 명소는 바다 쪽으로
    for (const s of A.spots) {
      if (s.kind === 'oreum' && !s.summit) { const o = I.OREUMS.find(o => o.id === s.id); if (o) { s.x = o.x; s.z = o.z; } }
      if (s.kind === 'oreum' && s.summit) { s.x = I.HC.x; s.z = I.HC.z; }
      if (s.kind === 'dive' || (s.kind === 'course' && (s.veh === 'kayak' || s.veh === 'boat' || s.veh === 'surf')) || (s.kind === 'collect' && s.veh === 'boat')) {
        // 육지 쪽 물가에 세운다 (차로 갈 수 있게)
        const sw = LANDMARKS.seaward(s.x, s.z); let k = 0; while (I.coastDist(s.x, s.z) < 8 && k++ < 40) { s.x -= sw.x * 4; s.z -= sw.z * 4; }
        while (I.coastDist(s.x, s.z) > 14 && k++ < 80) { s.x += sw.x * 3; s.z += sw.z * 3; }
      }
      if (s.river) { s.x = I.RIVER.a.x + 18; s.z = I.RIVER.a.z - 20; }
      if (s.kind === 'shop') A.markers.push(markerFor(s));   // 관광지 액티비티는 전부 뺐다(BUY JEJU, 2026-09-08) — 이름만 남고 표식은 렌터카뿐
    }
    hud();
  }

  // ── 매 프레임 ──
  const btn = () => el('act');
  const HP = () => (window.PET && PET.onFoot) ? PET.hero() : PLAYER;   // 주인공 자리: 걸어 다니면 고양이, 아니면 차
  function update(dt, t) {
    for (const m of A.markers) { m.sp.position.y = spotY(m.s) + 9 + Math.sin(t * 2 + m.ph) * 0.6; const lk = locked(m.s); const op = lk ? 0.4 : 1; m.sp.material.opacity = op; m.ring.material.opacity = lk ? 0.22 : 0.55; }
    if (A.hintT > 0) { A.hintT -= dt; if (A.hintT <= 0) { const h = el('hint'); if (h) h.classList.remove('on'); } }
    if (A.msgT > 0) { A.msgT -= dt; if (A.msgT <= 0) el('card').classList.remove('on'); }
    updateDest();
    navTick(dt);
    if (A.cur) return updateTask(dt, t);
    // 가까운 명소
    let best = null, bd = 1e9;
    const hp = HP();
    for (const s of A.spots) {
      if (s.kind !== 'shop') continue;   // 렌터카만 행동이 있다
      if (s.islet && !I.inIslet(hp.x, hp.z)) continue;
      const d = Math.hypot(s.x - hp.x, s.z - hp.z); const rr = s.kind === 'oreum' ? 24 : 16;
      if (d < rr && d < bd) { bd = d; best = s; }
    }
    A.near = best;
    const b = btn();
    if (best && PLAYER.kmh < 12 && PLAYER.mode === 'ground') { const lk = locked(best); b.textContent = (lk ? '🔒 ' : (A.done.has(best.id) && best.kind !== 'shop' && best.kind !== 'ferry' ? '✔ ' : best.icon + ' ')) + ACTION[best.kind] + ' · ' + best.name + (lk ? ' · ' + lk.tag : ''); b.classList.add('show'); }
    else b.classList.remove('show');
  }

  // ── 행동 ──
  function act() {
    if (A.cur) { return; }
    const s = A.near; if (!s || PLAYER.mode !== 'ground') return;
    AUDIO.init();
    if (window.PET && PET.onFoot && s.kind !== 'photo' && s.kind !== 'food' && s.kind !== 'oreum') PET.board();   // 탑승·코스·비행·잠수·상점은 차로 한다
    switch (s.kind) {
      case 'photo': case 'food': case 'oreum': { const c = locked(s); if (c) { hint(c.hint + ' · ' + s.name); AUDIO.ping(320); return; } return stampNow(s, s.kind === 'food' ? foodBonus(s) : 0); }
      case 'ride': return startRide(s);
      case 'ferry': return startFerry(s);
      case 'course': return startCourse(s);
      case 'collect': return startCollect(s);
      case 'dive': { const c = locked(s); if (c) { hint(c.hint + ' · ' + s.name); AUDIO.ping(320); return; } return startDive(s); }
      case 'fly': return startFly(s);
      case 'shop': return openShop();
    }
  }
  function stampNow(s, bonus) {
    const first = !A.done.has(s.id);
    el('flash').style.opacity = 1; setTimeout(() => { el('flash').style.opacity = 0; }, 90);
    AUDIO.shutter();
    const reward = first ? (REWARD[s.kind] || 100) + (bonus || 0) : Math.floor((REWARD[s.kind] || 100) * 0.2);
    give(s, reward, first);
  }
  function give(s, reward, first) {
    A.coins += reward; if (first) A.done.add(s.id);
    if (A.dest === s) { A.dest = null; updateBeacon(); }
    const m = A.markers.find(m => m.s === s); if (m) refreshMarker(m);
    el('cardIcon').textContent = s.icon; el('cardName').textContent = s.name; el('cardCoin').textContent = '+' + reward; el('cardStamp').style.display = first ? 'block' : 'none';
    el('card').classList.add('on'); A.msgT = 2.4; setTimeout(() => AUDIO.stamp(), 350);
    save(); hud();
  }
  function hud() { el('money').textContent = window.ESTATE ? ESTATE.fmt(A.coins) : A.coins; el('stamps').textContent = A.done.size + '/' + A.spots.length; if (window.ESTATE) ESTATE.hud(); }

  // ── 탑승 (카메라가 코스를 따라 돈다) ──
  function startRide(s) {
    PLAYER.frozen = true; el('act').classList.remove('show');
    const y0 = spotY(s); const path = [];
    if (s.ride === 'sub') { const sw = LANDMARKS.seaward(s.x, s.z); for (let k = 0; k <= 40; k++) { const t = k / 40; const d = 30 + t * 220; const yy = -3 - Math.sin(t * Math.PI) * 14; path.push([s.x + sw.x * d + Math.sin(t * 6) * 20, yy, s.z + sw.z * d + Math.cos(t * 6) * 20]); } }
    else if (s.ride === 'cave') { for (let k = 0; k <= 40; k++) { const t = k / 40; path.push([s.x + Math.sin(t * 4) * 6, y0 + 2 - t * 6, s.z - 10 + 14 - t * 90]); } }
    else if (s.ride === 'train' || s.ride === 'rail') { for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; const x = s.x + Math.cos(a) * 90, z = s.z + Math.sin(a) * 60; path.push([x, H(x, z) + 3, z]); } }
    else { for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; const x = s.x + Math.cos(a) * 45, z = s.z + Math.sin(a) * 45; path.push([x, H(x, z) + 2.2, z]); } }
    A.cur = { kind: 'ride', s, t: 0, dur: s.ride === 'cave' ? 12 : 16, path, dark: s.ride === 'cave', under: s.ride === 'sub' };
    el('task').textContent = s.icon + ' ' + s.name; el('task').classList.add('show');
  }
  function pathPos(path, u, out) { const n = path.length - 1; const f = Math.max(0, Math.min(n - 0.001, u * n)); const i = Math.floor(f), k = f - i; const a = path[i], b = path[i + 1]; out.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); return out; }
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  function rideCam(cam, dt) {
    const c = A.cur; if (!c || (c.kind !== 'ride' && c.kind !== 'ferry')) return false;
    if (c.kind === 'ferry') { const f = c.mesh; _v.set(f.x - Math.sin(f.yaw) * -22, 9, f.z - Math.cos(f.yaw) * -22); cam.position.lerp(_v, 1 - Math.exp(-4 * dt)); cam.lookAt(f.x, 3, f.z); return true; }
    const u = c.t / c.dur; pathPos(c.path, u, _v); pathPos(c.path, Math.min(1, u + 0.03), _w);
    cam.position.lerp(_v, 1 - Math.exp(-6 * dt)); cam.lookAt(_w); return true;
  }

  // ── 여객선 ──
  function startFerry(s) {
    const to = A.spots.find(x => x.id === s.to); if (!to) return;
    PLAYER.frozen = true; el('act').classList.remove('show');
    const mesh = VEH.staticMesh('ferry', 0xffffff); A.scene.add(mesh);
    const sw = LANDMARKS.seaward(s.x, s.z), sw2 = LANDMARKS.seaward(to.x, to.z);
    const from = { x: s.x + sw.x * 30, z: s.z + sw.z * 30 }, dest = { x: to.x + sw2.x * 30, z: to.z + sw2.z * 30 };
    const L = Math.hypot(dest.x - from.x, dest.z - from.z);
    A.cur = { kind: 'ferry', s, to, t: 0, dur: Math.max(8, L / 45), from, dest, mesh: { m: mesh, x: from.x, z: from.z, yaw: Math.atan2(-(dest.x - from.x), -(dest.z - from.z)) } };
    PLAYER.mesh.visible = false;
    el('task').textContent = '⛴ ' + to.name; el('task').classList.add('show');
    AUDIO.horn(true); setTimeout(() => AUDIO.horn(false), 700);
  }
  const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _P = new THREE.Vector3(), _S = new THREE.Vector3(1, 1, 1), YUP = new THREE.Vector3(0, 1, 0);
  function updateFerry(dt) {
    const c = A.cur; c.t += dt; const u = Math.min(1, c.t / c.dur); const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const f = c.mesh; f.x = c.from.x + (c.dest.x - c.from.x) * e; f.z = c.from.z + (c.dest.z - c.from.z) * e;
    _Q.setFromAxisAngle(YUP, f.yaw); _P.set(f.x, Math.sin(c.t * 1.3) * 0.15, f.z); _M.compose(_P, _Q, _S); f.m.setMatrixAt(0, _M); f.m.instanceMatrix.needsUpdate = true;
    if (u >= 1) {
      A.scene.remove(f.m); PLAYER.mesh.visible = true; PLAYER.frozen = false;
      const to = c.to; const sw2 = LANDMARKS.seaward(to.x, to.z);
      PLAYER.setVehicle(PLAYER.car, to.x - sw2.x * 8, to.z - sw2.z * 8, Math.atan2(sw2.x, sw2.z));
      PLAYER.safe = { x: PLAYER.x, z: PLAYER.z, yaw: PLAYER.yaw };
      endTask(); if (!A.done.has(c.s.id)) give(c.s, REWARD.ferry, true);
    }
  }

  // ── 코스 (탈것 바꿔 타고 고리 통과) ──
  function ringMesh(color) { const m = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.45, 8, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })); m.renderOrder = 6; A.scene.add(m); return m; }
  function loopPath(s, veh, n) {
    const water = veh === 'kayak' || veh === 'boat' || veh === 'surf' || veh === 'fishing';
    const pts = [];
    if (s.loop) { const isl = I.ISLETS.find(i => i.id === s.loop); for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2; pts.push([isl.x + Math.cos(a) * isl.rx * 0.62, isl.z + Math.sin(a) * isl.rz * 0.62]); } return pts; }
    if (s.river) { const a = I.RIVER.a, b = I.RIVER.b; for (let k = 0; k < n; k++) { const t = k / (n - 1); const up = t < 0.5 ? t * 2 : 2 - t * 2; pts.push([a.x + (b.x - a.x) * up + (t < 0.5 ? -3 : 3), a.z + (b.z - a.z) * up]); } return pts; }
    if (LANDMARKS.tracks[s.id]) { const tr = LANDMARKS.tracks[s.id]; for (let k = 0; k < n; k++) pts.push(tr[Math.floor(k / n * tr.length)]); return pts; }
    let cx = s.x, cz = s.z, rad = 70;
    if (water) { const sw = LANDMARKS.seaward(s.x, s.z); cx = s.x + sw.x * 95; cz = s.z + sw.z * 95; rad = 65; }
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2; let x = cx + Math.cos(a) * rad * 1.3, z = cz + Math.sin(a) * rad;
      // 물 코스는 뭍 위 고리를 바다로, 땅 코스는 바다 위 고리를 뭍으로 민다
      for (let q = 0; q < 20; q++) { const d = I.coastDist(x, z); if (water ? d < -8 : d > 8) break; const sw = LANDMARKS.seaward(x, z); x += sw.x * (water ? 6 : -6); z += sw.z * (water ? 6 : -6); }
      // 땅 코스 고리는 건물 안에 두지 않는다 — 바깥쪽으로 민다
      if (!water) for (let q = 0; q < 12 && PLAYER.insideBox(x, z, 5); q++) { const L = Math.hypot(x - cx, z - cz) || 1; x += (x - cx) / L * 6; z += (z - cz) / L * 6; }
      pts.push([x, z]);
    }
    return pts;
  }
  function startCourse(s) {
    const veh = s.veh; const pts = loopPath(s, veh, 10);
    const water = VEH.PARAMS[veh].water;
    A.rings = pts.map((p, i) => { const y = water ? 1.2 : H(p[0], p[1]) + 2.6; const m = ringMesh(i === 0 ? 0x4fff7a : 0x4fd8ff); m.position.set(p[0], y, p[1]); const nx = pts[(i + 1) % pts.length]; m.lookAt(nx[0], y, nx[1]); return { m, x: p[0], z: p[1], y }; });
    A.cur = { kind: 'course', s, t: 0, idx: 0, back: { x: PLAYER.x, z: PLAYER.z, yaw: PLAYER.yaw } };
    const p0 = pts[0], p1 = pts[1]; const yaw = Math.atan2(-(p1[0] - p0[0]), -(p1[1] - p0[1]));
    PLAYER.setVehicle(veh, p0[0] - (p1[0] - p0[0]) * 0.15, p0[1] - (p1[1] - p0[1]) * 0.15, yaw);
    el('task').textContent = s.icon + ' 1/' + pts.length + ' · ⏱ 0:00'; el('task').classList.add('show'); el('act').classList.remove('show');
    AUDIO.ping(660);
  }
  function updateCourse(dt) {
    const c = A.cur; c.t += dt;
    const r = A.rings[c.idx]; const d = Math.hypot(PLAYER.x - r.x, PLAYER.z - r.z);
    if (d < 5.2) {
      r.m.material.color.set(0xffd24a); r.m.material.opacity = 0.35; c.idx++; AUDIO.ping(880 + c.idx * 40);
      if (c.idx >= A.rings.length) { const bonus = Math.max(0, Math.round(500 - c.t * 5)); finishTask(c.s, 150 + bonus); return; }
      A.rings[c.idx].m.material.color.set(0x4fff7a);
    }
    el('task').textContent = c.s.icon + ' ' + (c.idx + 1) + '/' + A.rings.length + ' · ⏱ ' + clock(c.t);
  }
  function clock(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + (s < 10 ? '0' : '') + s; }

  // ── 수집 (감귤·물고기) / 잠수 (전복·소라) ──
  function itemMesh(kind) {
    let g, c;
    if (kind === 'orange') { g = new THREE.SphereGeometry(0.55, 8, 6); c = 0xff8a1e; }
    else if (kind === 'fish') { g = new THREE.SphereGeometry(0.6, 8, 6).scale(1, 0.6, 1.8); c = 0x6fc8ff; }
    else { g = new THREE.SphereGeometry(0.6, 8, 6).scale(1.2, 0.5, 1); c = 0xd8c8a0; }
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.5, roughness: 0.5 })); A.scene.add(m); return m;
  }
  function startCollect(s) { startGather(s, s.veh, s.item, false); }
  function startDive(s) { startGather(s, 'diver', s.deep ? 'fish' : 'shell', true); }
  function startGather(s, veh, item, under) {
    const water = VEH.PARAMS[veh].water || under; const items = [];
    let cx = s.x, cz = s.z; if (water) { const sw = LANDMARKS.seaward(s.x, s.z); cx = s.x + sw.x * 60; cz = s.z + sw.z * 60; }
    for (let k = 0; k < 24; k++) {
      let x, z, tries = 0;
      do { const a = R() * 6.28, d = 8 + R() * (water ? 70 : 42); x = cx + Math.cos(a) * d; z = cz + Math.sin(a) * d; } while (tries++ < 30 && (water ? I.coastDist(x, z) > -6 : (I.coastDist(x, z) < 6 || PLAYER.insideBox(x, z, 1))));
      const y = under ? Math.max(H(x, z) + 1.2, -12 + R() * 8) : water ? 0.3 : H(x, z) + 0.8 + R() * 1.4;
      const m = itemMesh(item); m.position.set(x, y, z); items.push({ m, x, y, z, got: false });
    }
    A.items = items;
    A.cur = { kind: 'gather', s, t: 0, dur: 60, n: 0, under, item, back: { x: PLAYER.x, z: PLAYER.z, yaw: PLAYER.yaw } };
    const sw = LANDMARKS.seaward(s.x, s.z);
    if (water) PLAYER.setVehicle(veh, s.x + sw.x * 16, s.z + sw.z * 16, Math.atan2(-sw.x, -sw.z)); else PLAYER.setVehicle(veh, s.x, s.z, PLAYER.yaw);
    el('task').textContent = s.icon + ' 0 · ⏱ 1:00'; el('task').classList.add('show'); el('act').classList.remove('show');
    AUDIO.ping(660);
  }
  function updateGather(dt, t) {
    const c = A.cur; c.t += dt;
    for (const it of A.items) {
      if (it.got) continue;
      it.m.rotation.y = t * 2; it.m.position.y = it.y + Math.sin(t * 3 + it.x) * 0.25;
      const d = Math.hypot(PLAYER.x - it.x, PLAYER.z - it.z), dy = Math.abs(PLAYER.y - it.y);
      if (d < 3.2 && (!c.under || dy < 3)) { it.got = true; A.scene.remove(it.m); c.n++; AUDIO.ping(700 + c.n * 30); }
    }
    const left = Math.max(0, c.dur - c.t);
    el('task').textContent = c.s.icon + ' ' + c.n + ' · ⏱ ' + clock(left);
    if (c.n >= A.items.length || left <= 0) finishTask(c.s, 60 + c.n * 20);
  }

  // ── 비행 (오름에서 뜬다, 공중 고리) ──
  function startFly(s) {
    const o = I.OREUMS.find(o => Math.hypot(o.x - s.x, o.z - s.z) < 200);
    const sx = o ? o.x : s.x, sz = o ? o.z : s.z; const top = H(sx, sz);
    const sw = LANDMARKS.seaward(sx, sz);
    const pts = []; for (let k = 0; k < 8; k++) { const t = (k + 1) / 8; const a = t * 2.4; const d = 60 + t * 320; const x = sx + sw.x * d + Math.cos(a) * 60 * t, z = sz + sw.z * d + Math.sin(a) * 60 * t; pts.push([x, Math.max(H(x, z), 0) + 12 + (1 - t) * (top - Math.max(H(x, z), 0)) * 0.8, z]); }
    A.rings = pts.map((p, i) => { const m = ringMesh(i === 0 ? 0x4fff7a : 0x4fd8ff); m.position.set(p[0], p[1], p[2]); const nx = pts[Math.min(pts.length - 1, i + 1)]; m.lookAt(nx[0], nx[1], nx[2]); return { m, x: p[0], y: p[1], z: p[2] }; });
    A.cur = { kind: 'fly', s, t: 0, idx: 0, back: { x: PLAYER.x, z: PLAYER.z, yaw: PLAYER.yaw } };
    PLAYER.setVehicle('glider', sx, sz, Math.atan2(-sw.x, -sw.z)); PLAYER.y = top + 4;
    el('task').textContent = s.icon + ' 0/' + pts.length; el('task').classList.add('show'); el('act').classList.remove('show'); AUDIO.ping(660);
  }
  function updateFly(dt) {
    const c = A.cur; c.t += dt;
    if (c.idx < A.rings.length) { const r = A.rings[c.idx]; const d = Math.hypot(PLAYER.x - r.x, PLAYER.z - r.z), dy = Math.abs(PLAYER.y - r.y); if (d < 6 && dy < 6) { r.m.material.color.set(0xffd24a); r.m.material.opacity = 0.35; c.idx++; AUDIO.ping(880 + c.idx * 40); if (c.idx < A.rings.length) A.rings[c.idx].m.material.color.set(0x4fff7a); } }
    el('task').textContent = c.s.icon + ' ' + c.idx + '/' + A.rings.length;
    if (PLAYER.landed || c.t > 240) finishTask(c.s, 100 + c.idx * 60);
  }

  function updateTask(dt, t) {
    const c = A.cur;
    if (c.kind === 'ride') { c.t += dt; if (c.t >= c.dur) { PLAYER.frozen = false; const s = c.s; endTask(); if (!A.done.has(s.id)) give(s, REWARD.ride, true); else give(s, 30, false); } return; }
    if (c.kind === 'ferry') return updateFerry(dt);
    if (c.kind === 'course') return updateCourse(dt);
    if (c.kind === 'gather') return updateGather(dt, t);
    if (c.kind === 'fly') return updateFly(dt);
  }
  function finishTask(s, reward) {
    const c = A.cur; const first = !A.done.has(s.id);
    if (c && c.kind === 'gather' && c.item && c.n > 0) { A.hold[c.item] = (A.hold[c.item] || 0) + c.n; }
    // 차로 돌아간다 (탈것 자리에 두고)
    PLAYER.setVehicle(PLAYER.car, c.back.x, c.back.z, c.back.yaw);
    endTask(); give(s, first ? reward : Math.floor(reward * 0.3), first); AUDIO.fanfare();
  }
  function endTask() {
    for (const r of A.rings) { A.scene.remove(r.m); r.m.geometry.dispose(); } A.rings = [];
    for (const it of A.items) if (!it.got) A.scene.remove(it.m); A.items = [];
    A.cur = null; el('task').classList.remove('show');
  }
  function abort() {
    const c = A.cur; if (!c) return;
    if (c.kind === 'ferry') { A.scene.remove(c.mesh.m); PLAYER.mesh.visible = true; }
    PLAYER.frozen = false;
    if (c.back) PLAYER.setVehicle(PLAYER.car, c.back.x, c.back.z, c.back.yaw); else if (PLAYER.veh !== PLAYER.car) PLAYER.setVehicle(PLAYER.car);
    endTask();
  }

  // ── 렌터카 ──
  function openShop() {
    const list = el('shopList'); list.innerHTML = '';
    for (const k of ['open', 'car', 'suv', 'ev', 'sport', 'camper']) {
      const owned = A.owned.includes(k), cur = PLAYER.car === k; const p = VEH.PARAMS[k];
      const card = document.createElement('div'); card.className = 'card' + (cur ? ' cur' : '');
      card.innerHTML = '<div class="thumb" style="background:#' + p.tint.toString(16).padStart(6, '0') + '"></div><div class="info"><b>' + CARNAME[k] + '</b><div class="bars"><span>속도 ' + bars(p.max / 70) + '</span><span>가속 ' + bars(p.accel / 17) + '</span></div></div><div class="act">' + (cur ? '<em>✔</em>' : owned ? '<button data-k="' + k + '">타기</button>' : '<button data-k="' + k + '" ' + (A.coins < PRICE[k] ? 'disabled' : '') + '>🪙 ' + PRICE[k] + '</button>') + '</div>';
      list.appendChild(card);
    }
    list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k; if (!A.owned.includes(k)) { if (A.coins < PRICE[k]) return; A.coins -= PRICE[k]; A.owned.push(k); AUDIO.stamp(); } PLAYER.car = k; PLAYER.setVehicle(k); save(); hud(); openShop(); }));
    el('shop').classList.add('show'); A.shopOpen = true;
  }
  function bars(v) { let s = ''; for (let i = 0; i < 5; i++) s += '<i class="' + (v * 5 > i + 0.5 ? 'on' : '') + '"></i>'; return '<u>' + s + '</u>'; }
  function closeShop() { el('shop').classList.remove('show'); A.shopOpen = false; }

  // ── 지도: 확대(휠·두 손가락)·끌기, 명소를 누르면 목적지 ──
  const view = { s: 1, x: 0, y: 0 };
  function mapXf() {
    const cv = el('mapc'), W = cv.width, Hh = cv.height, B = I.BOUNDS;
    const sc = Math.min(W / (B.x1 - B.x0), Hh / (B.z1 - B.z0));
    const ox = (W - (B.x1 - B.x0) * sc) / 2, oz = (Hh - (B.z1 - B.z0) * sc) / 2;
    return { X: x => (ox + (x - B.x0) * sc) * view.s + view.x, Z: z => (oz + (z - B.z0) * sc) * view.s + view.y, sc: sc * view.s };
  }
  function drawMap() {
    const cv = el('mapc'), g = cv.getContext('2d'), W = cv.width, Hh = cv.height;
    const { X, Z, sc } = mapXf();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#183a52'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = '#4a7a3a'; g.beginPath(); I.coast.forEach((p, i) => i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1]))); g.closePath(); g.fill();
    for (const s of I.ISLETS) { g.beginPath(); g.ellipse(X(s.x), Z(s.z), s.rx * sc, s.rz * sc, 0, 0, 6.29); g.fill(); }
    const gr = g.createRadialGradient(X(I.HC.x), Z(I.HC.z), 0, X(I.HC.x), Z(I.HC.z), 1400 * sc); gr.addColorStop(0, 'rgba(120,110,90,0.9)'); gr.addColorStop(0.5, 'rgba(60,90,50,0.6)'); gr.addColorStop(1, 'rgba(60,90,50,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(X(I.HC.x), Z(I.HC.z), 1750 * sc, 950 * sc, 0, 0, 6.29); g.fill();
    g.fillStyle = 'rgba(90,120,60,0.9)'; for (const o of I.OREUMS) { g.beginPath(); g.arc(X(o.x), Z(o.z), Math.max(2, o.r * sc * 0.8), 0, 6.29); g.fill(); }
    g.strokeStyle = '#f0e6c8';
    for (const pl of ROADS.polylines) { if (pl.type === 'access' && view.s < 2.5) continue; g.lineWidth = pl.type === 'access' ? Math.max(1, sc * 8) : Math.max(1.2, 3 * sc * 8); g.beginPath(); pl.pts.forEach((p, i) => i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1]))); if (pl.closed) g.closePath(); g.stroke(); }
    // 마을 네모 칠하기는 뺐다 — 지도에서 쓸데없이 커 보인다(사장님 2026-09-09). 마을은 이름과 길로 알아본다
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = Math.max(10, W / 60) * Math.min(2.2, Math.max(1, Math.sqrt(view.s)));
    const showNames = view.s >= 1.8;
    for (const s of A.spots) {
      if (s.kind !== 'shop' && !showNames && A.dest !== s) continue;
      const x = X(s.x), y = Z(s.z); if (x < -40 || y < -40 || x > W + 40 || y > Hh + 40) continue;
      if (A.dest === s) { g.fillStyle = 'rgba(255,60,40,0.35)'; g.beginPath(); g.arc(x, y, fs * 1.3, 0, 6.29); g.fill(); g.strokeStyle = '#ff3b2a'; g.lineWidth = 3; g.stroke(); }
      g.globalAlpha = 1; if (s.kind === 'shop') { g.font = fs + 'px "Segoe UI Emoji", sans-serif'; g.fillText(s.icon, x, y); } else { g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x, y, Math.max(1.5, fs * 0.12), 0, 6.29); g.fill(); }
      if (showNames || A.dest === s) { g.font = 'bold ' + Math.round(fs * 0.62) + 'px "Griun", "Malgun Gothic", sans-serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.75)'; const nm = L(s.name); g.strokeText(nm, x, y + fs * 0.95); g.fillStyle = A.done.has(s.id) ? '#ffd24a' : '#fff'; g.fillText(nm, x, y + fs * 0.95); }
      g.globalAlpha = 1;
    }
    if (NAV.pts && NAV.pts.length > 1) {                 // 네비 경로
      g.strokeStyle = 'rgba(40,190,255,0.95)'; g.lineWidth = Math.max(3, sc * 10); g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); NAV.pts.forEach((p, i) => i ? g.lineTo(X(p.x), Z(p.z)) : g.moveTo(X(p.x), Z(p.z))); g.stroke();
    }
    if (window.ESTATE) ESTATE.drawMap(g, X, Z, sc, fs);   // 매물·내 땅·건물
    const hp = HP(); g.save(); g.translate(X(hp.x), Z(hp.z)); g.rotate(-hp.yaw); g.fillStyle = '#ff3b2a'; g.beginPath(); g.moveTo(0, -fs * 0.9); g.lineTo(fs * 0.6, fs * 0.6); g.lineTo(0, fs * 0.25); g.lineTo(-fs * 0.6, fs * 0.6); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); g.restore();
    for (const t of ROADS.towns) if (t.big || view.s > 1.8) { g.font = 'bold ' + fs + 'px "Griun", sans-serif'; g.fillStyle = '#1d2a1c'; g.fillText(L(t.name), X(t.cx), Z(t.cz) + fs); }
    el('mapCount').textContent = (A.dest ? A.dest.icon + ' ' + A.dest.name + ' · ' : '') + (window.ESTATE ? '🏝 ' + ESTATE.ownedCount() + '/' + ESTATE.list.length + ' · 💰 ' + ESTATE.fmt(A.coins) : '');
  }
  function mapPoint(e) { const cv = el('mapc'), r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; }
  function clampView() { const cv = el('mapc'); if (view.s <= 1) { view.x = view.y = 0; return; } view.x = Math.min(0, Math.max(cv.width * (1 - view.s), view.x)); view.y = Math.min(0, Math.max(cv.height * (1 - view.s), view.y)); }
  function zoomAt(mx, my, f) { const ns = Math.max(1, Math.min(14, view.s * f)); f = ns / view.s; view.x = mx - (mx - view.x) * f; view.y = my - (my - view.y) * f; view.s = ns; clampView(); }
  // 지도에서 목적지로 찍힐 수 있는 건 매물뿐이다. 관광지는 찍어도 목적지가 안 된다
  // — 관광지 표를 찍으면 박물관 같은 큰 건물 한가운데가 목적지가 돼 영영 못 닿았다 (사장님 2026-09-11)
  function spotAt(mx, my) {
    if (!window.ESTATE) return null;
    const { X, Z } = mapXf();
    const fs = Math.max(10, el('mapc').width / 60) * Math.min(2.2, Math.max(1, Math.sqrt(view.s)));
    return ESTATE.parcelAt(mx, my, X, Z, fs * 1.4);
  }
  // 지도에서 찍으면 목적지, **같은 곳을 또 찍으면 끈다**(토글, 사장님 2026-09-11 "한번더누르면 취소가 되야지").
  // 한때 토글을 뺐던 건 급매 표시가 사라져서였는데, 끄는 건 이제 일부러 두 번 찍을 때만이다.
  function setDest(s) { A.dest = s || null; NAV.pts = null; NAV.road = null; NAV.t = 9; navRoute(); navBuild(); navAdvance(); updateBeacon(); drawMap(); if (A.dest) AUDIO.ping(990); }
  function clearDest() { A.dest = null; NAV.pts = null; navClear(); updateBeacon(); drawMap(); }
  function centerOnPlayer() { const cv = el('mapc'); const { X, Z } = mapXf(); view.x += cv.width / 2 - X(PLAYER.x); view.y += cv.height / 2 - Z(PLAYER.z); clampView(); }
  function initMapEvents() {
    const cv = el('mapc'); const ptrs = new Map(); let drag = null, pinch = null;
    cv.addEventListener('wheel', e => { e.preventDefault(); const p = mapPoint(e); zoomAt(p.x, p.y, e.deltaY < 0 ? 1.25 : 0.8); drawMap(); }, { passive: false });
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const p = mapPoint(e); ptrs.set(e.pointerId, p); if (ptrs.size === 1) drag = { x: p.x, y: p.y, moved: false, vx: view.x, vy: view.y }; else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, vx: view.x, vy: view.y }; drag = null; } });
    cv.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; const p = mapPoint(e); ptrs.set(e.pointerId, p);
      if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const f = Math.max(1, Math.min(14, pinch.s * d / pinch.d)) / pinch.s; view.s = pinch.s * f; view.x = pinch.cx - (pinch.cx - pinch.vx) * f; view.y = pinch.cy - (pinch.cy - pinch.vy) * f; clampView(); drawMap(); return; }
      if (drag) { const dx = p.x - drag.x, dy = p.y - drag.y; if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true; if (drag.moved) { view.x = drag.vx + dx; view.y = drag.vy + dy; clampView(); drawMap(); } } });
    const up = e => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (pinch && ptrs.size < 2) pinch = null; if (drag && !drag.moved) { const s = spotAt(p.x, p.y); if (s) { if (A.dest === s) clearDest(); else setDest(s); } }   /* 같은 곳을 또 찍으면 끈다 (사장님 2026-09-11) */ if (ptrs.size === 0) drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('dblclick', e => { e.preventDefault(); const p = mapPoint(e); if (!spotAt(p.x, p.y)) { zoomAt(p.x, p.y, 1.8); drawMap(); } });
    el('mapZoomIn').addEventListener('click', () => { zoomAt(cv.width / 2, cv.height / 2, 1.5); drawMap(); });
    el('mapZoomOut').addEventListener('click', () => { zoomAt(cv.width / 2, cv.height / 2, 1 / 1.5); drawMap(); });
    el('mapMe').addEventListener('click', () => { if (view.s < 3) view.s = 3; centerOnPlayer(); drawMap(); });
  }
  function toggleMap() { const m = el('map'); if (m.classList.contains('show')) { m.classList.remove('show'); A.mapOpen = false; } else { if (!A.mapInit) { initMapEvents(); A.mapInit = true; } drawMap(); m.classList.add('show'); A.mapOpen = true; } }

  // ── 네비: 길을 따라 깔리는 안내선 (사장님 2026-09-11 "네비를 진짜 네비처럼")
  // 화살표만 목적지를 가리키면 바다·절벽으로 몰고 간다. 길 마디를 따라 최단 경로를 찾아 바닥에 화살표 띄를 깔아 준다.
  const NAV = { road: null, pts: null, arc: null, mesh: null, t: 0, len: 0, from: null, rfrom: null, tail: 0 };
  let NAV_TEX = null;
  function navTex() {
    if (NAV_TEX) return NAV_TEX;
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
    g.clearRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(40,190,255,0.5)'; g.fillRect(4, 0, 56, 64);
    g.fillStyle = '#eaffff';
    for (const oy of [0, 32]) { g.beginPath(); g.moveTo(32, oy + 28); g.lineTo(56, oy + 6); g.lineTo(44, oy + 6); g.lineTo(32, oy + 16); g.lineTo(20, oy + 6); g.lineTo(8, oy + 6); g.closePath(); g.fill(); }   // 꼭지점이 가는 쪽(+v)을 보게 뒤집어 그린다
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return (NAV_TEX = t);
  }
  const navSurf = (x, z) => {
    const r = (window.ROADS && ROADS.surfaceAbs) ? ROADS.surfaceAbs(x, z) : null;
    const t = Math.max(0, H(x, z));
    return (r == null ? t : Math.max(t, r)) + 0.2;
  };
  function navDrop() { if (NAV.mesh) { A.scene.remove(NAV.mesh); NAV.mesh.geometry.dispose(); NAV.mesh = null; } }
  function navClear() { navDrop(); NAV.road = null; NAV.pts = null; NAV.arc = null; NAV.len = 0; NAV.from = null; NAV.rfrom = null; NAV.tail = 0; }
  // 길찾기는 한 번에 3ms 라 매 프레임 못 돈다 — 길은 가끔 찾아 두고(navRoute), 그리는 것만 매 프레임(navBuild).
  function navRoute() {
    const d = A.dest;
    if (!d || !window.ROADS || !ROADS.route || !A.scene) { NAV.road = null; return; }
    const hp = HP(), dp = destPt(d);
    let pts = ROADS.route(hp.x, hp.z, dp.x, dp.z);
    if (!pts) { NAV.road = null; return; }
    // 안내선은 길 위에만 깔린다. 매물이 길에서 멀면 그 끝마디까지만 —
    // 그냥 이으면 돌담·비탈을 가로지르는 선이 된다 (사장님 2026-09-11 "돌담을 어케 가로질러가냐")
    const n1 = ROADS.nearest(dp.x, dp.z);
    const tail = (n1.e && n1.d < 18) ? [{ x: dp.x, z: dp.z }] : [];
    NAV.tail = tail.length ? 0 : Math.hypot(dp.x - pts[pts.length - 1].x, dp.z - pts[pts.length - 1].z);   // 마지막은 길 밖이라 안 깔고 거리만 더한다
    pts = pts.concat(tail);
    const P = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = P[P.length - 1]; if (Math.hypot(pts[i].x - a.x, pts[i].z - a.z) > 3) P.push(pts[i]); }
    NAV.road = P.length > 1 ? P : null;
  }
  function navBuild() {
    const P = NAV.road;
    if (!P) { navDrop(); NAV.pts = null; NAV.len = 0; return; }
    const hp = HP();
    // 지나온 구간은 안 그린다. **마디 중에서** 제일 가까운 것을 골랐더니, 방금 지나친 갈림길이
    // 여전히 제일 가까워 뒤로 도는 꼬리가 남았다. 차를 **길 위에 내려 찍어** 그 앞쪽만 남긴다.
    // (사장님 2026-09-11 "지나온 길에 꼬리 붙는 것 여전한데")
    let bi = 1, bt = 0, bd = 1e18;
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1], b = P[i], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz;
      const t = L2 > 1e-6 ? Math.max(0, Math.min(1, ((hp.x - a.x) * dx + (hp.z - a.z) * dz) / L2)) : 0;
      const ex = a.x + dx * t - hp.x, ez = a.z + dz * t - hp.z, dd = ex * ex + ez * ez;
      if (dd < bd) { bd = dd; bi = i; bt = t; }
    }
    const a0 = P[bi - 1], b0 = P[bi], on = ROADS.nearest(hp.x, hp.z);
    const P2 = [(on.e && on.d < 18) ? { x: hp.x, z: hp.z }                                  // 길 위면 차부터 잇고
      : { x: a0.x + (b0.x - a0.x) * bt, z: a0.z + (b0.z - a0.z) * bt }];                    // 길 밖이면 길 위에서 시작
    for (let i = bi; i < P.length; i++) P2.push(P[i]);
    if (P2.length < 2) { navDrop(); NAV.pts = null; NAV.len = 0; return; }
    let len = 0; for (let i = 1; i < P2.length; i++) len += Math.hypot(P2[i].x - P2[i - 1].x, P2[i].z - P2[i - 1].z);
    const pos = [], uv = [], arc = [], W = 1.25;   // arc = 조각마다 띠 시작에서의 거리
    let run = 0;
    for (let i = 1; i < P2.length; i++) {
      const a = P2[i - 1], b = P2[i], L = Math.hypot(b.x - a.x, b.z - a.z);
      if (L < 0.5) continue;
      const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, rx = -uz, rz = ux;
      // 한국은 우측통행 — 길 한가운데가 아니라 오른쪽 차선에 깔다 (사장님 2026-09-11)
      const lane = 2.8, ox = rx * lane, oz = rz * lane;
      const seg = Math.max(1, Math.round(L / 4));
      for (let k = 0; k < seg; k++) {
        const t0 = k / seg, t1 = (k + 1) / seg;
        const x0 = a.x + (b.x - a.x) * t0 + ox, z0 = a.z + (b.z - a.z) * t0 + oz;
        const x1 = a.x + (b.x - a.x) * t1 + ox, z1 = a.z + (b.z - a.z) * t1 + oz;
        const y0 = navSurf(x0, z0), y1 = navSurf(x1, z1);
        const v0 = (run + L * t0) / 7, v1 = (run + L * t1) / 7;   // 7m 마다 화살표 둘
        arc.push(run + L * t0);
        pos.push(x0 - rx * W, y0, z0 - rz * W, x0 + rx * W, y0, z0 + rz * W, x1 + rx * W, y1, z1 + rz * W);
        pos.push(x0 - rx * W, y0, z0 - rz * W, x1 + rx * W, y1, z1 + rz * W, x1 - rx * W, y1, z1 - rz * W);
        uv.push(0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1);
      }
      run += L;
    }
    navDrop();
    NAV.pts = P2; NAV.len = len; NAV.arc = arc; NAV.from = { x: hp.x, z: hp.z };
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const m = new THREE.MeshBasicMaterial({ map: navTex(), transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    NAV.mesh = new THREE.Mesh(g, m); NAV.mesh.renderOrder = 4; NAV.mesh.frustumCulled = false;
    A.scene.add(NAV.mesh);
  }
  // 차가 어디까지 왔는지 띠 위에 내려 찍어, **지나온 조각은 안 그린다**.
  // 메시를 매 프레임 새로 만들면 정점 수천 개를 매번 올려야 해서, 그리는 범위만 앞으로 민다.
  // 0.5초마다 새로 깔기만 하면 130km/h 에서 18m 씩 꼬리가 남는다 (사장님 2026-09-11)
  function navAdvance() {
    const g = NAV.mesh && NAV.mesh.geometry, arc = NAV.arc;
    if (!g || !arc || !arc.length || !NAV.pts || NAV.pts.length < 2) return;
    const hp = HP();
    let at = 0, bd = 1e18, run = 0;
    for (let i = 1; i < NAV.pts.length; i++) {
      const a2 = NAV.pts[i - 1], b2 = NAV.pts[i], dx = b2.x - a2.x, dz = b2.z - a2.z, L2 = dx * dx + dz * dz, L = Math.sqrt(L2);
      const t = L2 > 1e-6 ? Math.max(0, Math.min(1, ((hp.x - a2.x) * dx + (hp.z - a2.z) * dz) / L2)) : 0;
      const ex = a2.x + dx * t - hp.x, ez = a2.z + dz * t - hp.z, dd = ex * ex + ez * ez;
      if (dd < bd) { bd = dd; at = run + L * t; }
      run += L;
    }
    let k = 0; while (k < arc.length && arc[k] < at) k++;
    g.setDrawRange(k * 6, Math.max(0, g.attributes.position.count - k * 6));
  }
  // 길을 벗어나거나 시간이 지나면 다시 깐다
  function navTick(dt) {
    if (!A.dest) { if (NAV.pts || NAV.mesh || NAV.road) navClear(); return; }
    NAV.t += dt;
    const hp = HP();
    const moved = NAV.rfrom ? Math.hypot(hp.x - NAV.rfrom.x, hp.z - NAV.rfrom.z) : 1e9;
    if (!NAV.road || NAV.t > 0.5 || moved > 60) { NAV.t = 0; NAV.rfrom = { x: hp.x, z: hp.z }; navRoute(); navBuild(); }
    navAdvance();
  }
  // 남은 길 길이와 다음으로 향할 지점(까지의 거리)
  function navAhead(hp, look) {
    if (!NAV.pts || NAV.pts.length < 2) return null;
    // 가장 가까운 마디부터 앞으로
    let si = 0, sd = 1e18;
    for (let i = 0; i < NAV.pts.length; i++) { const d = Math.hypot(NAV.pts[i].x - hp.x, NAV.pts[i].z - hp.z); if (d < sd) { sd = d; si = i; } }
    let acc = 0, tgt = NAV.pts[NAV.pts.length - 1], rest = 0;
    for (let i = si + 1; i < NAV.pts.length; i++) rest += Math.hypot(NAV.pts[i].x - NAV.pts[i - 1].x, NAV.pts[i].z - NAV.pts[i - 1].z);
    for (let i = si + 1; i < NAV.pts.length; i++) {
      acc += Math.hypot(NAV.pts[i].x - NAV.pts[i - 1].x, NAV.pts[i].z - NAV.pts[i - 1].z);
      if (acc > (look || 25)) { tgt = NAV.pts[i]; break; }
    }
    return { x: tgt.x, z: tgt.z, rest: rest + sd + (NAV.tail || 0) };
  }

  // ── 목적지: 큰 화살표 + 화면 위 방향·거리 ──
  // 예전에는 하늘까지 솟은 빨간 빛기둥이었다. 화면을 가로질러 가려서 아래를 가리키는 화살표로 바꿨다 (사장님 2026-09-10)
  let beacon = null;
  function updateBeacon() {
    if (!beacon) {
      const m = new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, fog: false });
      const head = new THREE.Mesh(new THREE.ConeGeometry(3.4, 6, 4), m); head.rotation.x = Math.PI; head.position.y = 3;
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7, 2.4), m); shaft.position.y = 9.5;
      beacon = new THREE.Group(); beacon.add(head); beacon.add(shaft);
      beacon.renderOrder = 7; head.renderOrder = 7; shaft.renderOrder = 7;
      A.scene.add(beacon);
    }
    if (A.dest) { const dp = destPt(A.dest); beacon.visible = true; beacon.position.set(dp.x, Math.max(0, H(dp.x, dp.z)) + 14, dp.z); } else beacon.visible = false;
    el('dest').classList.toggle('show', !!A.dest);
  }
  function updateDest() {
    const d = A.dest; if (!d) return;
    const hp = HP(), dp = destPt(d);
    const straight = Math.hypot(dp.x - hp.x, dp.z - hp.z);
    if (straight < 22) { clearDest(); AUDIO.ping(1180); return; }   // 닿으면 네비를 끄다   // 닿으면 네비를 끄다 (사장님 2026-09-11)
    const ah = navAhead(hp, 30);                                  // 길을 따라 다음으로 갈 지점
    const dx = (ah ? ah.x : dp.x) - hp.x, dz = (ah ? ah.z : dp.z) - hp.z;
    const dist = ah ? ah.rest : straight;                         // 거리도 길 따라 잰 값
    const bearing = Math.atan2(-dx, -dz);
    let rel = bearing - PLAYER.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel));
    el('destArrow').style.transform = 'rotate(' + (-rel * 180 / Math.PI) + 'deg)';
    el('destName').textContent = (d.icon || '🏷') + ' ' + d.name; el('destDist').textContent = dist >= 1000 ? (dist / 1000).toFixed(1) + 'km' : Math.round(dist) + 'm';
    // 화살표: 위아래로 까딱이며 천천히 돈다. 멀수록 크게 그려 어디서든 보이게 한다
    if (beacon && beacon.visible) {
      const t = performance.now() * 0.001;
      const k = Math.max(1, Math.min(9, straight / 90));
      beacon.scale.setScalar(k);
      beacon.position.y = spotY(d) + (14 + 2.2 * Math.sin(t * 2.2)) * k;
      beacon.rotation.y = t * 0.8;
    }
  }
  window.ACT = Object.assign(A, { init, update, act, abort, rideCam, openShop, closeShop, toggleMap, drawMap, hud, save, updateDest, setDest, clearDest });
})();
