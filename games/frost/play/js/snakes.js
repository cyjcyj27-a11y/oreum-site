// snakes.js — 숲의 살무사 (사장님 2026-09-18 "숲에 뱀도 풀어서 물리면 죽게 하자")
//   벨라루스 숲에 흔한 살무사(가디우카): 회갈색 바탕에 등을 따라 검은 지그재그
//   · 숲(소나무·원시림·자작나무·늪 가장자리)에 10마리, 길·마을에서 떨어져 산다
//   · 3.5m 안에 오면 멈춰 고개를 들고 쉭쉭 · 혀 날름 (징조) → 1.2m 안에 머물거나 밟으면 문다 → GAME OVER
//   · 몸은 고리 36개짜리 관을 매 프레임 다시 굽혀 S 자로 기어간다 (가까운 뱀만)
(function () {
  const V3 = THREE.Vector3;
  const RINGS = 40, SIDES = 10, LEN = 1.05, RAD = 0.042;   // 게임에서 알아보게 실제(0.6m)보다 조금 크게
  const snakes = [];
  let mat = null, headGeo = null, headMat = null, eyeMat = null, tongueMat = null;

  // 살무사 무늬: u 는 몸 길이, v 는 몸 둘레(0.5 가 등)
  function skinTex() {
    const W = 512, H = 64, c = GEO.canvas(W, H), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#d8ccb0'); bg.addColorStop(0.28, '#9a8c6c'); bg.addColorStop(0.5, '#8c7e60'); bg.addColorStop(0.72, '#9a8c6c'); bg.addColorStop(1, '#d8ccb0');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // 비늘 결
    const r = U.mulberry(31);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,245,220' : '30,24,16'},${0.05 + r() * 0.08})`; g.fillRect(r() * W, r() * H, 2 + r() * 3, 1.5); }
    // 등 지그재그
    g.fillStyle = '#17120c'; g.strokeStyle = '#17120c'; g.lineWidth = 11; g.lineJoin = 'miter';
    g.beginPath();
    for (let x = 0; x <= W; x += 32) g.lineTo(x, H / 2 + ((x / 32) % 2 ? 11 : -11));
    g.stroke();
    // 옆구리 점
    for (let x = 16; x < W; x += 32) { g.beginPath(); g.arc(x, H / 2 + ((x / 32 | 0) % 2 ? -21 : 21), 3.5, 0, 7); g.fill(); }
    const t = GEO.tex(c); t.wrapS = THREE.RepeatWrapping;
    return t;
  }

  function makeBody() {
    const n = (RINGS + 1) * (SIDES + 1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const uv = new Float32Array(n * 2);
    for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SIDES; j++) { const k = i * (SIDES + 1) + j; uv[k * 2] = i / RINGS * 1.1; uv[k * 2 + 1] = j / SIDES; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const idx = [];
    for (let i = 0; i < RINGS; i++) for (let j = 0; j < SIDES; j++) {
      const a = i * (SIDES + 1) + j, b = a + SIDES + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);   // 바깥이 앞면 (거꾸로면 몸 안쪽 면이 보인다)
    }
    g.setIndex(idx);
    return g;
  }
  const radiusAt = s => { // s: 0 머리 쪽 ~ 1 꼬리 끝
    if (s < 0.06) return RAD * (0.75 + s / 0.06 * 0.25);
    if (s > 0.72) return RAD * Math.max(0.12, 1 - (s - 0.72) / 0.28 * 0.9);
    return RAD * (1 + Math.sin((s - 0.06) / 0.66 * Math.PI) * 0.18);
  };

  function spawnSpots() {
    const out = [], rnd = U.mulberry(606);
    const M = TER.Z.market;
    for (let k = 0; k < 8000 && out.length < 10; k++) {
      const x = (rnd() - 0.5) * TER.LIMIT * 1.9, z = (rnd() - 0.5) * TER.LIMIT * 1.9;
      const f = TER.forest(x, z);
      if (!f || !['pine', 'pushcha', 'birch', 'swamp', 'spruce'].includes(f.k)) continue;
      const h = TER.H(x, z);
      if (h < 0.35 || TER.roadD(x, z) < 5 || TER.boardD(x, z) < 4) continue;
      if (Math.hypot(x - M.x, z - M.z) < 45) continue;
      if (COL.inside(x, h + 0.2, z, 0.8)) continue;
      if (out.some(o => Math.hypot(o.x - x, o.z - z) < 26)) continue;
      out.push({ x, z });
    }
    return out;
  }

  function build(scene) {
    mat = new THREE.MeshStandardMaterial({ map: skinTex(), roughness: 0.78, metalness: 0 });
    // 살무사다운 세모 머리: 뒤(목 쪽)는 넓고 주둥이로 갈수록 좁다
    headGeo = new THREE.SphereGeometry(1, 14, 10);
    { const hp = headGeo.attributes.position; for (let i = 0; i < hp.count; i++) { const x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i); const w = 1.15 - (z + 1) * 0.3; hp.setXYZ(i, x * 0.05 * w, y * 0.026 * (1.05 - (z + 1) * 0.15), z * 0.07); } headGeo.computeVertexNormals(); }
    headGeo.translate(0, 0.004, 0.035);
    headMat = new THREE.MeshStandardMaterial({ color: 0x6f634c, roughness: 0.5 });
    eyeMat = new THREE.MeshStandardMaterial({ color: 0xa02010, roughness: 0.2, emissive: 0x200400 });
    tongueMat = new THREE.MeshBasicMaterial({ color: 0x9a1020 });
    for (const p of spawnSpots()) {
      const body = new THREE.Mesh(makeBody(), mat);
      body.castShadow = true; body.frustumCulled = false;
      const head = new THREE.Group();
      const hm = new THREE.Mesh(headGeo, headMat); hm.castShadow = true; head.add(hm);
      // 머리 위 검은 X 무늬
      const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.008).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x17120c }));
      const mk2 = mk.clone(); mk.position.set(0, 0.031, 0.03); mk.rotation.y = 0.7; mk2.position.copy(mk.position); mk2.rotation.y = -0.7; head.add(mk, mk2);
      for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 6, 4), eyeMat); e.position.set(sx * 0.033, 0.012, 0.05); e.scale.setScalar(1.4); head.add(e); }
      // 갈라진 혀
      const tongue = new THREE.Group();
      for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, 0.03).translate(0, 0, 0.015), tongueMat); t.rotation.y = sx * 0.25; t.position.z = 0.02; tongue.add(t); }
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, 0.03).translate(0, 0, 0.015), tongueMat); tongue.add(stem);
      tongue.position.set(0, -0.004, 0.1); tongue.scale.set(1.6, 1.6, 0); tongue.scale.z = 0; head.add(tongue);
      scene.add(body, head);
      snakes.push({ body, head, tongue, home: new V3(p.x, 0, p.z), pos: new V3(p.x, TER.H(p.x, p.z), p.z), yaw: Math.random() * 6.28, want: 0, speed: 0,
        ph: Math.random() * 6, state: 'rest', t: 1 + Math.random() * 4, lift: 0, near: 0, strike: 0, hiss: 0, cool: 0 });
    }
    for (const s of snakes) shape(s, 0);
  }

  const _p = new V3(), _q = new V3(), _n = new V3(), _up = new V3(0, 1, 0), _side = new V3(), _fw = new V3();
  // 몸 굽히기: 머리에서 뒤로 LEN 만큼, 옆으로 S 자 물결. lift 는 앞 3할을 들어 올림
  function shape(s, dt) {
    const g = s.body.geometry, P = g.attributes.position.array, N = g.attributes.normal.array;
    const fx = Math.sin(s.yaw), fz = Math.cos(s.yaw);
    const moving = s.speed > 0.02;
    const amp = moving ? 0.07 : 0.045;
    const pts = [];
    for (let i = 0; i <= RINGS; i++) {
      const u = i / RINGS, back = u * LEN;
      const wave = Math.sin(s.ph - u * 9.5) * amp * Math.min(1, u * 3 + 0.2);
      const x = s.pos.x - fx * back + fz * wave, z = s.pos.z - fz * back - fx * wave;
      let y = TER.H(x, z) + (s.flyY || 0) + radiusAt(u) * 0.8;   // 차여서 날아가는 높이
      if (u < 0.32) y += s.lift * Math.pow(1 - u / 0.32, 1.4) * 0.26;   // 고개 들기
      pts.push(new V3(x, y, z));
    }
    for (let i = 0; i <= RINGS; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(RINGS, i + 1)];
      _fw.subVectors(a, b).normalize();          // 머리 쪽
      _side.crossVectors(_up, _fw).normalize();
      _n.crossVectors(_fw, _side).normalize();   // 위
      const r = radiusAt(i / RINGS);
      for (let j = 0; j <= SIDES; j++) {
        const th = j / SIDES * Math.PI * 2 + Math.PI / 2;   // v=0.5 가 등(위) — j=절반일 때 cy=-1 → 법선이 위
        const cx = Math.cos(th), cy = Math.sin(th);
        const k = (i * (SIDES + 1) + j) * 3;
        const nx = _side.x * cx + _n.x * -cy, ny = _side.y * cx + _n.y * -cy, nz = _side.z * cx + _n.z * -cy;
        P[k] = pts[i].x + nx * r; P[k + 1] = pts[i].y + ny * r * 0.8; P[k + 2] = pts[i].z + nz * r;
        N[k] = nx; N[k + 1] = ny; N[k + 2] = nz;
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
    g.computeBoundingSphere();
    // 머리: 첫 고리 앞, 몸이 향하는 쪽
    _fw.subVectors(pts[0], pts[2]).normalize();
    s.head.position.copy(pts[0]).addScaledVector(_fw, 0.012);
    s.head.lookAt(_q.copy(s.head.position).add(_fw));
  }

  // 장화를 신었으면 곁의 뱀을 E 로 찬다 — 멀리 날아가 한동안 안 온다 (사장님 2026-09-20 "장화를 신고 뱀을 발로차면 뱀이 멀리날아가서 안전해지게")
  const KICK_HIT = 0.33, KICK_FWD = 0.42, KICK_SIDE = -0.29;
  let kickT = -1, kickS = null;
  function near() {
    if (!T.shop.boots || PL.swim || PL.ride || PL.climb || PL.act || T.mode !== 'play') return null;
    let best = null, bd = 1.35;
    for (const s of snakes) { if (s.fly || !s.body.visible) continue; const d = Math.hypot(s.pos.x - PL.pos.x, s.pos.z - PL.pos.z); if (d < bd) { bd = d; best = s; } }
    return best ? { kind: 'snakekick', s: best, label: 'E 🥾' } : null;
  }
  function act(n) {
    const s = n.s; if (!s || s.fly) return;
    const yaw = Math.atan2(s.pos.x - PL.pos.x, s.pos.z - PL.pos.z);
    PL.yaw = yaw;
    const has = !!PLAYER.CH.acts.kick;
    if (has) {   // 뱀이 오른발 앞에 오게 한 발 옮겨 선다
      const nx = s.pos.x - (Math.sin(yaw) * KICK_FWD + Math.cos(yaw) * KICK_SIDE);
      const nz = s.pos.z - (Math.cos(yaw) * KICK_FWD - Math.sin(yaw) * KICK_SIDE);
      if (!COL.inside(nx, PL.pos.y + 0.5, nz, 0.3)) { PL.pos.x = nx; PL.pos.z = nz; }
    }
    PLAYER.doAct(has ? 'kick' : 'pick', has ? 0.75 : 0.6, has ? { speed: 1.4, once: true } : { speed: 2.4, from: 0.5, once: true });
    kickT = has ? KICK_HIT : 0.2; kickS = s;
    s.cool = 2; s.state = 'rest'; s.t = 2;   // 차는 동안 물지 않는다
  }
  function kickTick(dt) {
    if (kickT < 0) return;
    kickT -= dt;
    if (kickT > 0) return;
    kickT = -1; const s = kickS; kickS = null; if (!s) return;
    const dx = s.pos.x - PL.pos.x, dz = s.pos.z - PL.pos.z, d = Math.hypot(dx, dz) || 1;
    s.fly = { t: 0, from: s.pos.clone(), dx: dx / d, dz: dz / d, dist: 9 + Math.random() * 3, dur: 1.1, spin: Math.random() * 6 };
    s.state = 'flee'; s.t = 6; s.cool = 12; s.near = 0;
    AUD.sfx('hiss', 1); AUD.sfx('kick'); FX.pop('🥾', PL.pos);
  }
  function update(dt) {
    if (!snakes.length || !window.PL) return;
    kickTick(dt);
    const px = PL.pos.x, pz = PL.pos.z;
    for (const s of snakes) {
      const d = Math.hypot(s.pos.x - px, s.pos.z - pz);
      const vis = d < 45;
      s.body.visible = s.head.visible = vis;
      if (!vis) continue;
      if (s.cool > 0) s.cool -= dt;
      // 차여서 날아가는 중: 포물선으로 멀리, 땅에 떨어지면 달아난다
      if (s.fly) {
        const f = s.fly; f.t += dt; const k = Math.min(1, f.t / f.dur);
        let nx = f.from.x + f.dx * f.dist * k, nz = f.from.z + f.dz * f.dist * k;
        if (TER.H(nx, nz) < 0.3) { nx = s.pos.x; nz = s.pos.z; }
        s.pos.x = nx; s.pos.z = nz; s.flyY = Math.sin(k * Math.PI) * 2.2;
        s.yaw += dt * 9; s.ph += dt * 30; s.lift = 0;
        if (k >= 1) { s.fly = null; s.flyY = 0; s.state = 'flee'; s.t = 5; s.want = Math.atan2(s.pos.x - px, s.pos.z - pz); AUD.sfx('land', 0.5); }
        else { shape(s, dt); continue; }
      }
      const alive = T.mode === 'play' && !T.paused && PL.state !== 'air' && !PL.swim && PL.knockT <= 0;
      // 징조 → 물기
      if (alive && d < 3.5 && s.state !== 'strike' && s.state !== 'flee' && s.cool <= 0) {
        if (s.state !== 'alert') { s.state = 'alert'; s.near = 0; if (s.hiss <= 0) { AUD.sfx('hiss'); s.hiss = 2.2; } }
        s.want = Math.atan2(px - s.pos.x, pz - s.pos.z);
        s.near = d < 1.2 ? s.near + dt : Math.max(0, s.near - dt);
        const run = Math.hypot(PL.vel.x, PL.vel.z) > 3.2;
        if ((s.near > 0.35 || d < 0.55 || (run && d < 1.0)) && s.cool <= 0) { s.state = 'strike'; s.strike = 0; AUD.sfx('hiss', 1); }
      } else if (s.state === 'alert' && d > 4.5) { s.state = 'rest'; s.t = 1 + Math.random() * 3; }
      if (s.hiss > 0) { s.hiss -= dt; if (s.state === 'alert' && s.hiss <= 0) { AUD.sfx('hiss', 0.6); s.hiss = 2.4; } }
      // 움직임
      let sp = 0;
      if (s.state === 'rest') { s.t -= dt; if (s.t <= 0) { s.state = 'crawl'; s.t = 3 + Math.random() * 5; const hd = Math.hypot(s.home.x - s.pos.x, s.home.z - s.pos.z); s.want = hd > 6 ? Math.atan2(s.home.x - s.pos.x, s.home.z - s.pos.z) : Math.random() * 6.28; } }
      else if (s.state === 'flee') { sp = 0.75; s.t -= dt; if (s.t <= 0) { s.state = 'rest'; s.t = 4; } }
      else if (s.state === 'crawl') { sp = 0.22; s.t -= dt; if (s.t <= 0) { s.state = 'rest'; s.t = 3 + Math.random() * 6; } }
      s.speed = U.damp(s.speed, sp, 4, dt);
      s.yaw += U.angDiff(s.yaw, s.want) * Math.min(1, dt * (s.state === 'alert' ? 5 : 1.5));
      if (s.speed > 0.01) {
        const nx = s.pos.x + Math.sin(s.yaw) * s.speed * dt, nz = s.pos.z + Math.cos(s.yaw) * s.speed * dt;
        if (TER.H(nx, nz) > 0.3 && TER.roadD(nx, nz) > 2.5 && !COL.inside(nx, TER.H(nx, nz) + 0.1, nz, 0.1)) { s.pos.x = nx; s.pos.z = nz; }
        else s.want += 1.5;
      }
      s.ph += dt * (s.speed * 28 + (s.state === 'alert' ? 1.5 : 0.4));
      // 고개 들기·혀
      const lift = s.state === 'alert' ? 1 : (s.state === 'strike' ? 1.2 : 0);
      s.lift = U.damp(s.lift, lift, 6, dt);
      const flick = s.state === 'alert' || s.state === 'strike' ? Math.max(0, Math.sin(T.time * 11 + s.ph)) : (Math.sin(T.time * 1.7 + s.ph) > 0.93 ? 1 : 0);
      s.tongue.scale.z = flick * 1.6;
      // 물기: 머리가 튀어나가 닿으면 끝
      if (s.state === 'strike') {
        s.strike += dt;
        const k = Math.min(1, s.strike / 0.14);
        const ox = s.pos.x, oz = s.pos.z;
        s.pos.x += Math.sin(s.yaw) * k * 0.35 * dt * 20 * (s.strike < 0.14 ? 1 : 0);
        s.pos.z += Math.cos(s.yaw) * k * 0.35 * dt * 20 * (s.strike < 0.14 ? 1 : 0);
        if (Math.hypot(s.pos.x - ox, s.pos.z - oz) > 0 && TER.H(s.pos.x, s.pos.z) < 0.3) { s.pos.x = ox; s.pos.z = oz; }
        if (s.strike >= 0.14 && !s.bit) {
          s.bit = true;
          if (Math.hypot(s.pos.x - px, s.pos.z - pz) < 1.6 && T.mode === 'play' && !PL.ride) {
            if (T.shop.boots) {
              // 장화를 신었으면 이빨이 고무에 막힌다 (사장님 2026-09-18) — 뱀은 달아난다
              AUD.sfx('tock', 1); AUD.sfx('hiss', 0.5);
              FX.pop('🥾', PL.pos);
              if (window.CAM) CAM.shake = Math.max(CAM.shake || 0, 0.12);
              s.fled = true;
            } else {
              AUD.sfx('bite');
              if (PL.canHit()) PL.knock(s.pos);
              if (window.GAME) GAME.die();
            }
          }
        }
        if (s.strike > 0.9) {
          if (s.fled) { s.fled = false; s.state = 'flee'; s.t = 3.5; s.want = Math.atan2(s.pos.x - px, s.pos.z - pz); s.cool = 8; }
          else { s.state = 'rest'; s.t = 2; s.cool = 3; }
          s.bit = false;
        }
      }
      shape(s, dt);
    }
  }

  window.SNAKES = { build, update, near, act, snakes };
})();
