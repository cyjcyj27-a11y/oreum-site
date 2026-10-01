// ride.js — 들소 길들여 타기 (사장님 2026-09-18 "사진찍기 없애고 들소길들여타기 좋다")
//   · 호밀밭에서 E 로 호밀 한 줌(🌾 최대 6). 호밀을 가진 채 걸어가면 들소가 안 달아나고 다가온다 (뛰면 달아남)
//   · 들소 머리 앞에서 E 🌾: 호밀을 땅에 놓아 주면 들소가 먹는다. 세 번 먹이면 친구 → 도감 🦬 (T.got['b'+i])
//   · 친구가 된 어른 들소는 E 🦬 로 올라탄다. 처음엔 날뛴다 — ← → 로 균형을 잡아 8초 버티면 길들임 (T.tame[i])
//     떨어지면 옆으로 굴러떨어질 뿐 죽지 않는다. 길들인 들소는 WASD 로 몰고 Shift 로 달린다. E 로 내린다
//   · 타고 있으면 멧돼지·뱀이 못 건드린다
//   · 황새 둥지는 사진 대신 가까이 가면 찾은 것으로 (items.js) — 둥지·들소 도감 그림도 여기서 그린다
(function () {
  const V3 = THREE.Vector3, L = U.L;
  const FEEDS = 3, RODEO = 8, WALK = 3.2, GALLOP = 10.5;
  const R = { b: null, rodeo: -1, lean: 0, lv: 0, push: 0, pushT: 0, buck: 0, seat: [0, 1.95, -0.4], spread: 0.85, knee: 0.4, hipUp: 0.35, down: 0.35 };   // 주인공을 1.80m 로 줄인 뒤 엉덩이·다리가 등에 파묻혀 다시 맞춤 (사장님 2026-09-27)
  const _a = new V3(), _b = new V3(), _hip = new V3();
  let scene = null, sheafGeo = null, sheafMat = null, handSheaf = null;
  const meals = [];      // 땅에 놓인 호밀 (들소가 먹는 중)
  let rodeoEl = null, markEl = null;

  // ── 호밀 한 줌: 줄기 다발 + 이삭 + 묶은 끈 ──
  function makeSheafGeo() {
    const parts = [], rnd = U.mulberry(31);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * 6.28, r = rnd() * 0.035, lean = 0.12 * rnd();
      const st = new THREE.CylinderGeometry(0.004, 0.005, 0.5, 4);
      st.translate(0, 0.25, 0);
      st.rotateZ(Math.cos(a) * lean); st.rotateX(Math.sin(a) * lean);
      st.translate(Math.cos(a) * r, 0, Math.sin(a) * r);
      parts.push(GEO.tint(st, 0xc8a850, 0.2, rnd));
      const ear = new THREE.SphereGeometry(1, 5, 4);
      ear.scale(0.011, 0.055, 0.011);
      ear.translate(0, 0.52, 0);
      ear.rotateZ(Math.cos(a) * lean * 1.4); ear.rotateX(Math.sin(a) * lean * 1.4);
      ear.translate(Math.cos(a) * r * 1.3, 0, Math.sin(a) * r * 1.3);
      parts.push(GEO.tint(ear, 0xe0bc60, 0.25, rnd));
    }
    const band = new THREE.TorusGeometry(0.042, 0.009, 4, 10); band.rotateX(Math.PI / 2); band.translate(0, 0.2, 0);
    parts.push(GEO.tint(band, 0x7a5a30));
    const g = GEO.merge(parts);
    GEO.shadeY(g, 0.7, 1.1);
    return g;
  }

  function build(sc) {
    scene = sc;
    sheafGeo = makeSheafGeo();
    sheafMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    handSheaf = new THREE.Mesh(sheafGeo, sheafMat);
    handSheaf.visible = false;
    scene.add(handSheaf);
    // 로데오 균형 막대 — 글 없이 ◀ ▶ 와 움직이는 표시만
    const st = document.createElement('style');
    st.textContent = '#rodeo{position:fixed;left:50%;bottom:24%;transform:translateX(-50%);width:min(520px,80vw);height:34px;display:none;align-items:center;gap:12px;z-index:30;pointer-events:none;font:700 30px sans-serif;color:#fff;text-shadow:0 2px 4px #000}' +
      '#rodeo.show{display:flex}#rodeo .bar{position:relative;flex:1;height:22px;border-radius:12px;border:3px solid #fff;background:linear-gradient(90deg,#e0452a,#f0b030 22%,#5ac85a 40%,#5ac85a 60%,#f0b030 78%,#e0452a);box-shadow:0 2px 8px rgba(0,0,0,.5)}' +
      '#rodeo .mk{position:absolute;top:-9px;width:10px;height:34px;margin-left:-5px;border-radius:5px;background:#fff;border:2px solid #2a2010;left:50%}' +
      '#rodeo .tm{position:absolute;left:0;bottom:-12px;height:5px;border-radius:3px;background:#ffe9a0}';
    document.head.appendChild(st);
    rodeoEl = document.createElement('div');
    rodeoEl.id = 'rodeo';
    rodeoEl.innerHTML = '<span>◀</span><div class="bar"><div class="mk"></div><div class="tm"></div></div><span>▶</span>';
    document.body.appendChild(rodeoEl);
    markEl = rodeoEl.querySelector('.mk');
  }

  const friend = b => !!T.got['b' + b.id];
  const tamed = b => !!(T.tame && T.tame[b.id]);
  function headAt(b, out) { return out.set(b.pos.x + Math.sin(b.yaw) * 1.55 * b.s, 0, b.pos.z + Math.cos(b.yaw) * 1.55 * b.s); }

  // ── 가까이 있는 할 일 (items.js 가 부른다) ──
  function near() {
    if (PL.ride) return { kind: 'ride', label: 'E ⬇' };
    const px = PL.pos.x, pz = PL.pos.z, rye = T.items.rye || 0;
    let best = null, bd = 1e9;
    for (const b of ANIMALS.bisons) {
      if (b.fear > 0 || b.rider) continue;
      headAt(b, _a);
      const dh = Math.hypot(_a.x - px, _a.z - pz), dc = Math.hypot(b.pos.x - px, b.pos.z - pz);
      if (friend(b) && !b.calf && dc < 2.3 * b.s && dc < bd) { bd = dc; best = { kind: 'mount', b, label: 'E 🦬' }; continue; }
      if (!friend(b) && dh < 2.3 && dh < bd) { bd = dh; best = rye > 0 ? { kind: 'feed', b, label: 'E 🌾' } : { kind: 'full', label: '🌾 0' }; }
    }
    if (best) return best;
    const f = TER.inField(px, pz);
    if (f && f.f.k === 'rye' && !PL.swim) {
      const G = QUESTS.GOODS.rye;
      return rye >= G.max ? { kind: 'full', label: G.icon + ' ' + rye + '/' + G.max } : { kind: 'rye', label: 'E 🌾' };
    }
    return null;
  }

  function act(n) {
    if (n.kind === 'rye') return cutRye();
    if (n.kind === 'feed') return feed(n.b);
    if (n.kind === 'mount') return mount(n.b);
    if (n.kind === 'ride') return dismount();
  }

  // 오른손에 호밀을 쥐여 준다 (secs 동안)
  let handT = 0;
  function holdSheaf(secs) { handT = secs; handSheaf.visible = true; handSheaf.scale.setScalar(1); }

  function cutRye() {
    PLAYER.doAct('pick', 1.2, { speed: 2.2, from: 0.6 });
    setTimeout(() => {
      if (T.mode !== 'play') return;
      holdSheaf(0.55);
      T.items.rye = Math.min(QUESTS.GOODS.rye.max, (T.items.rye || 0) + 1);
      AUD.sfx('rustle'); AUD.sfx('pick');
      FX.pop('🌾', PL.pos);
      U.save();
    }, 520);
  }

  function feed(b) {
    headAt(b, _a);
    // 머리에 너무 붙어 있으면 한 걸음 물러선다 (허리 숙일 때 머리가 부딪혔다)
    { const dx = PL.pos.x - _a.x, dz = PL.pos.z - _a.z, dd = Math.hypot(dx, dz) || 1; if (dd < 1.25) { PL.pos.x = _a.x + dx / dd * 1.25; PL.pos.z = _a.z + dz / dd * 1.25; } }
    PL.yaw = Math.atan2(_a.x - PL.pos.x, _a.z - PL.pos.z);
    b.want = Math.atan2(PL.pos.x - b.pos.x, PL.pos.z - b.pos.z);
    b.eat = 3.9;
    PLAYER.doAct('pick', 1.25, { speed: 2.2, from: 0.6 });
    holdSheaf(0.62);
    T.items.rye = (T.items.rye || 0) - 1;
    // 손이 땅에 닿는 때 호밀을 머리 앞에 내려놓는다
    setTimeout(() => {
      const m = new THREE.Mesh(sheafGeo, sheafMat);
      // 들소가 고개를 숙이면 입이 닿는 자리 (머리 앞 1.9m·s), 사람 앞 손 닿는 곳과의 가운데
      const mx = b.pos.x + Math.sin(b.yaw) * 1.95 * b.s, mz = b.pos.z + Math.cos(b.yaw) * 1.95 * b.s;
      const hx = PL.pos.x + Math.sin(PL.yaw) * 0.7, hz = PL.pos.z + Math.cos(PL.yaw) * 0.7;
      const x = (mx * 2 + hx) / 3, z = (mz * 2 + hz) / 3;
      m.position.set(x, WORLD.groundAt(x, z), z);
      m.rotation.set(Math.PI / 2 - 0.12, PL.yaw + 1.2, 0, 'YXZ');
      m.position.y += 0.03;
      scene.add(m);
      meals.push({ m, b, t: 0 });
      AUD.sfx('rustle');
    }, 620);
  }
  function mealsStep(dt) {
    for (let i = meals.length - 1; i >= 0; i--) {
      const e = meals[i], b = e.b;
      e.t += dt;
      // 들소가 머리를 숙여 한 입씩
      if (e.t > 0.6) {
        const k = Math.max(0, 1 - (e.t - 0.6) / 2.4);
        e.m.scale.set(1, Math.max(0.05, k), 1);
        if (((e.t * 6) | 0) !== (((e.t - dt) * 6) | 0) && ((e.t * 6) | 0) % 5 === 0) AUD.sfx('munch');
      }
      if (e.t >= 3.0) {
        scene.remove(e.m);
        meals.splice(i, 1);
        T.bison = T.bison || {};
        const n = T.bison[b.id] = Math.min(FEEDS, (T.bison[b.id] || 0) + 1);
        FX.pop('❤'.repeat(n), b.pos);
        AUD.sfx('moo', 0.7);
        if (n >= FEEDS && !friend(b)) {
          T.got['b' + b.id] = true;
          AUD.sfx('new');
          HUD.card(bisonIcon(b.id), L('들소', 'Bison') + ' ' + (b.id + 1), 'b');
          ITEMS.checkAll();
        }
        U.save();
      }
    }
  }

  // ── 타기 ──
  function mount(b) {
    PL.ride = b; b.rider = true; b.fear = 0; b.eat = 0;
    PL.act = null; PL.afterAct = null; PL.vel.set(0, 0, 0); PL.running = false;
    R.lean = 0; R.lv = 0; R.push = 0; R.pushT = 0.6; R.buck = 0;
    R.rodeo = tamed(b) ? -1 : 0;
    // 옆에서 뛰어올라 등에 앉는다 (0.55초) — 앉은 뒤에 날뛰기·몰기 (2026-09-18 "동작을 말이 되게")
    R.hop = { t: 0, from: PLAYER.CH.holder.position.clone(), sat: false };
    PLAYER.play('jump', 0.08, { restart: true, once: true, speed: 1.3 });
    AUD.sfx('jump');
    CAM.far = 6.2;
  }
  function off() {
    const b = PL.ride;
    if (!b) return;
    b.rider = false; b.pitch = 0; b.roll = 0; b.speed = 0;
    PL.ride = null; R.reach = null;
    if (PL.aim) HUNT.aim(false);
    R.rodeo = -1; R.hop = null; rodeoEl.classList.remove('show');
    CAM.far = 0;
    const h = PLAYER.CH.holder;
    h.rotation.x = 0; h.rotation.z = 0;
  }
  const REACH = 1.2, bent = [];
  const LOW = ['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot'];
  R.sitPose = {};
  function reach(s) {
    const b = PL.ride; if (!b) return;
    const rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
    R.reach = { t: 0, side: (s.x - b.pos.x) * rx + (s.z - b.pos.z) * rz >= 0 ? 1 : -1 };
  }
  function dismount() {
    const b = PL.ride;
    if (!b) return;
    // 오른쪽 옆으로 내린다 (막혀 있으면 왼쪽)
    let x = 0, z = 0;
    for (const sd of [1, -1]) {
      x = b.pos.x + Math.cos(b.yaw) * 1.9 * b.s * sd; z = b.pos.z - Math.sin(b.yaw) * 1.9 * b.s * sd;
      if (TER.H(x, z) > 0.2) break;
    }
    // 등에서 옆으로 뛰어내린다 — 공중에 띄워 두면 hero.js 가 떨어져 착지시킨다
    const from = PLAYER.CH.holder.position.clone();
    off();
    PL.pos.copy(from);
    const dx = x - from.x, dz = z - from.z, dd = Math.hypot(dx, dz) || 1;
    PL.vel.set(dx / dd * 2.4, 2.2, dz / dd * 2.4);
    PL.state = 'air'; PL.airT = 0; PL.leap = false;
    PLAYER.play('jump', 0.1, { restart: true, once: true, speed: 1.2 });
    U.save();
  }
  function thrown(sd) {
    const b = PL.ride;
    off();
    _a.set(Math.cos(b.yaw) * sd, 0, -Math.sin(b.yaw) * sd);
    PL.pos.set(b.pos.x + _a.x * 1.2, PL.pos.y, b.pos.z + _a.z * 1.2);
    PL.vel.set(_a.x * 4.5, 3.5, _a.z * 4.5);
    PL.state = 'air'; PL.airT = 0; PL.knockT = 1.3;
    PLAYER.play('fall', 0.1, { restart: true });
    CAM.shake = 0.7;
    AUD.sfx('moo'); AUD.sfx('grunt');
    b.fear = 2.5; b.want = b.yaw + (Math.random() < 0.5 ? 1.2 : -1.2);
  }

  // hero.js step 대신 (타고 있을 때)
  function step(dt, camYaw) {
    const b = PL.ride, IN = PLAYER.IN;
    IN.jumpEdge = false; PL.running = false; PL.swim = false; PL.wade = 0; PL.state = 'ground';
    if (R.hop) { b.speed = U.damp(b.speed, 0, 6, dt); return; }   // 올라타는 중
    if (R.rodeo >= 0) {
      // 날뛰기: 몸이 한쪽으로 밀리고, 반대쪽 키로 버틴다. 오래 버틸수록 세진다
      R.rodeo += dt;
      R.pushT -= dt;
      const lvl = Math.min(1, R.rodeo / RODEO);
      if (R.pushT <= 0) { R.pushT = 0.55 + Math.random() * 0.7; R.push = (Math.random() < 0.5 ? -1 : 1) * (1.0 + Math.random() * 0.8 + lvl * 0.7); AUD.sfx('hoof', 1); }
      R.lv += (R.push + R.lean * 1.8 + IN.r * 3.0) * dt;   // 표시가 오른쪽으로 가면 ◀ 로 되돌린다
      R.lv *= Math.exp(-3.2 * dt);   // 값은 봇 모의로 고름: 손 놓으면 3~4초에 떨어지고, 0.3초 늦게 반응해도 열에 아홉은 버틴다
      R.lean += R.lv * dt;
      R.buck += dt * (7 + lvl * 3);
      b.pitch = Math.sin(R.buck) * (0.16 + lvl * 0.1);
      b.roll = R.lean * 0.18;
      b.yaw += Math.sin(R.buck * 0.37) * dt * 1.6;
      b.speed = 0.6;
      markEl.style.left = (50 + U.clamp(R.lean, -1, 1) * 50) + '%';
      rodeoEl.querySelector('.tm').style.width = (lvl * 100) + '%';
      if (Math.abs(R.lean) > 1) { thrown(Math.sign(R.lean)); return; }
      if (R.rodeo >= RODEO) {
        T.tame = T.tame || {}; T.tame[b.id] = true;
        R.rodeo = -1; rodeoEl.classList.remove('show');
        b.pitch = 0; b.roll = 0;
        AUD.sfx('new'); AUD.sfx('moo');
        HUD.praise('🦬 ✓');
        if (!T.did.bison) LIKE.done('bison');   // 알레샤 호감
        U.save();
      }
      return;
    }
    // 겨누는 중: 들소가 멈춰 서서 겨누는 쪽으로 몸을 돌린다. 움직이려 하면 겨누기를 푼다 (hunt.js)
    if (PL.aim) {
      if (Math.hypot(IN.f, IN.r) > 0.3 && !PL.aimHold) { HUNT.aim(false); return; }
      b.speed = U.damp(b.speed, 0, 6, dt);
      b.yaw += U.angDiff(b.yaw, camYaw + Math.PI) * Math.min(1, dt * 5);
      R.buck += dt * b.speed * 1.1; b.pitch = 0; b.roll = U.damp(b.roll || 0, 0, 4, dt);
      return;
    }
    // 줍는 중: 들소가 멈춰 선다
    if (R.reach) { R.reach.t += dt; b.speed = U.damp(b.speed, 0, 8, dt); if (R.reach.t >= REACH) R.reach = null; return; }
    // 몰기: 카메라 기준 방향으로 머리를 돌리며 나아간다
    let f = IN.f, r = IN.r;
    const len = Math.hypot(f, r); if (len > 1) { f /= len; r /= len; }
    const mag = Math.min(1, len);
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    const mx = fx * f + rx * r, mz = fz * f + rz * r;
    const want = mag > 0.05 ? (IN.run ? GALLOP : WALK) * mag : 0;
    if (mag > 0.05) { const d = U.angDiff(b.yaw, Math.atan2(mx, mz)); b.yaw += U.clamp(d, -2.6 * dt, 2.6 * dt) * (b.speed > 6 ? 0.8 : 1); }
    b.speed = U.damp(b.speed, want, want > b.speed ? 1.6 : 3.5, dt);
    const nx = b.pos.x + Math.sin(b.yaw) * b.speed * dt, nz = b.pos.z + Math.cos(b.yaw) * b.speed * dt;
    if (TER.H(nx, nz) > 0.35) { b.pos.x = nx; b.pos.z = nz; } else b.speed *= Math.exp(-8 * dt);
    const p = { x: b.pos.x, y: b.pos.y, z: b.pos.z };
    COL.push(p, 0.95 * b.s, 2.2);
    const Lm = TER.LIMIT;
    b.pos.x = U.clamp(p.x, -Lm, Lm); b.pos.z = U.clamp(p.z, -Lm, Lm);
    b.pos.y = TER.H(b.pos.x, b.pos.z);
    // 달릴 땐 몸이 앞뒤로 출렁
    R.buck += dt * b.speed * 1.1;
    b.pitch = Math.sin(R.buck) * Math.min(0.07, b.speed * 0.008);
    b.roll = U.damp(b.roll || 0, 0, 4, dt);
    if (b.speed > 5 && ((R.buck / Math.PI) | 0) !== (((R.buck - dt * b.speed * 1.1) / Math.PI) | 0)) AUD.sfx('hoof', 0.6);
  }

  // ANIMALS.update 뒤: 들소 등 위에 주인공을 얹는다
  function after(dt) {
    if (handT > 0) {
      handT -= dt;
      const hb = PLAYER.CH.bones.RightHand;
      if (hb) { hb.getWorldPosition(_a); handSheaf.position.copy(_a); handSheaf.position.y -= 0.18; handSheaf.rotation.set(0.3, PL.yaw, 0); }
      if (handT <= 0) handSheaf.visible = false;
    }
    mealsStep(dt);
    const b = PL.ride;
    if (!b) return;
    const h = PLAYER.CH.holder, CH = PLAYER.CH;
    b.root.updateMatrixWorld(true);
    // 어깨 혹 뒤 낮은 등 윗면 (들소 모양 좌표)
    _a.fromArray(R.seat);
    b.root.localToWorld(_a);
    h.rotation.order = 'YXZ';
    h.rotation.y = b.yaw;
    h.rotation.x = -(b.pitch || 0) * 0.8;
    h.rotation.z = -(b.roll || 0) - R.lean * 0.35;
    // 줍기: 그쪽 옆구리로 몸을 숙이고 손을 뻗는다
    //   앉기 동작은 끝난 채 멈춰 있어 뼈 값을 다시 안 써 준다 → 더한 만큼 다음 프레임에 되돌린다(안 그러면 쌓여서 뒤로 눕는다)
    for (const [bn, base, val, ax] of bent) if (bn.rotation[ax] === val) bn.rotation[ax] = base;
    bent.length = 0;
    const bend = (bn, d, ax) => { if (!bn) return; const base = bn.rotation[ax]; bn.rotation[ax] += d; bent.push([bn, base, bn.rotation[ax], ax]); };
    if (R.reach) {
      const k = R.reach.t / REACH, e = Math.sin(Math.min(1, k * 1.25) * Math.PI);
      const sd = -R.reach.side * e;   // side 1 = 들소 기준 오른쪽 벡터(cos, -sin) 쪽 = 주인공 왼손 쪽. 부호는 뒤·옆에서 찍어 맞춤(2026-09-19)
      h.rotation.z += sd * 0.42;
      for (const n of ['Spine', 'Spine1', 'Spine2']) bend(CH.bones[n], sd * 0.22, 'z');
      bend(CH.bones[R.reach.side > 0 ? 'LeftArm' : 'RightArm'], sd * 0.9, 'z');   // 팔을 버섯 쪽 아래로
    }
    h.position.copy(_a);
    const hop = R.hop;
    // 다리를 벌려 등에 걸친다 (뛰어오르는 동안은 안 벌린다)
    if (CH.bones.LeftUpLeg && (!hop || hop.sat)) {
      // 더한 만큼 다음 프레임에 되돌린다(bend) — 앉기 동작이 멈춰 있으면 뼈 값이 새로 안 써져 쌓이고, 다리가 미친 듯이 돌았다 (사장님 2026-09-29)
      bend(CH.bones.LeftUpLeg, R.spread, 'z'); bend(CH.bones.RightUpLeg, -R.spread, 'z');
      if (R.down) { bend(CH.bones.LeftUpLeg, R.down, 'x'); bend(CH.bones.RightUpLeg, R.down, 'x'); }   // 허벅지를 옆구리 따라 아래로
      if (R.knee) { bend(CH.bones.LeftLeg, R.knee, 'x'); bend(CH.bones.RightLeg, R.knee, 'x'); }
    }
    // 겨눌 땐 장총 드는 동작(서서 겨누기)을 윗몸에만 — 엉덩이·다리는 앉은 자세를 그대로 둔다
    if (PL.aim) { for (const n of LOW) if (R.sitPose[n] && CH.bones[n]) CH.bones[n].quaternion.copy(R.sitPose[n]); }
    else if (!hop) { for (const n of LOW) if (CH.bones[n]) (R.sitPose[n] = R.sitPose[n] || new THREE.Quaternion()).copy(CH.bones[n].quaternion); }
    // 엉덩이 뼈가 등 윗면에 오게 맞춘다
    h.updateMatrixWorld(true);
    if (CH.bones.Hips) {
      CH.bones.Hips.getWorldPosition(_hip);
      h.position.x += _a.x - _hip.x; h.position.z += _a.z - _hip.z; h.position.y += _a.y + R.hipUp - _hip.y;
    }
    // 올라타는 중: 옆에서 포물선을 그리며 등으로
    if (hop) {
      hop.t += dt;
      const k = Math.min(1, hop.t / 0.55), e = k * k * (3 - 2 * k);
      _b.copy(h.position);
      h.position.lerpVectors(hop.from, _b, e); h.position.y += Math.sin(k * Math.PI) * 0.7;
      if (k > 0.55 && !hop.sat) { hop.sat = true; PLAYER.play('sit', 0.15, { restart: true, once: true, from: 1.2 }); }
      if (k >= 1) {
        R.hop = null; AUD.sfx('land'); AUD.sfx('moo');
        if (R.rodeo >= 0) { rodeoEl.classList.add('show'); CAM.shake = 0.3; }
      }
    }
    PL.pos.copy(h.position);
    PL.yaw = b.yaw;
  }

  // ── 도감 그림 ──
  let nestImg = null;
  const bisonImgs = {};
  function nestIcon() {
    if (nestImg) return nestImg;
    const c = GEO.canvas(128, 128), g = c.getContext('2d');
    // 둥지: 나뭇가지를 엮은 넓은 사발
    const gr = g.createLinearGradient(0, 70, 0, 112);
    gr.addColorStop(0, '#8a6a40'); gr.addColorStop(1, '#3a2a18');
    g.fillStyle = gr; g.beginPath(); g.ellipse(64, 92, 54, 20, 0, 0, 7); g.fill();
    g.lineCap = 'round';
    const rnd = U.mulberry(7);
    for (let i = 0; i < 60; i++) {
      const a = rnd() * 6.28, r = 40 + rnd() * 16, x = 64 + Math.cos(a) * r, y = 90 + Math.sin(a) * r * 0.36;
      g.strokeStyle = ['#b08a58', '#7a5a34', '#5a4026', '#caa270'][i % 4]; g.lineWidth = 1.5 + rnd() * 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 34, y + (rnd() - 0.5) * 10); g.stroke();
    }
    // 황새: 흰 몸, 검은 날개 끝, 붉은 부리와 다리
    g.fillStyle = '#c83a24'; g.fillRect(58, 70, 3, 14); g.fillRect(66, 70, 3, 14);
    const body = g.createRadialGradient(56, 52, 4, 62, 60, 30);
    body.addColorStop(0, '#ffffff'); body.addColorStop(1, '#c8ccd0');
    g.fillStyle = body; g.beginPath(); g.ellipse(62, 60, 26, 14, -0.25, 0, 7); g.fill();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.moveTo(44, 56); g.quadraticCurveTo(70, 50, 88, 70); g.quadraticCurveTo(66, 70, 44, 62); g.fill();
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 7; g.beginPath(); g.moveTo(44, 54); g.quadraticCurveTo(36, 36, 42, 22); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(43, 20, 7, 0, 7); g.fill();
    g.fillStyle = '#d8402a'; g.beginPath(); g.moveTo(37, 18); g.lineTo(14, 26); g.lineTo(37, 23); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(41, 18, 1.8, 0, 7); g.fill();
    return (nestImg = c.toDataURL());
  }
  function bisonIcon(id) {
    if (bisonImgs[id]) return bisonImgs[id];
    const b = ANIMALS.bisons[id], calf = b && b.calf;
    const c = GEO.canvas(128, 128), g = c.getContext('2d');
    g.translate(64, 100); if (calf) g.scale(0.72, 0.72); g.translate(-64, -100);
    // 땅 그림자
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(66, 110, 48, 6, 0, 0, 7); g.fill();
    // 다리 (뒤쪽 두 개는 어둡게)
    for (const [x, c] of [[40, '#1a120c'], [90, '#1a120c'], [32, '#2a1d12'], [82, '#2a1d12']]) {
      g.fillStyle = c; g.beginPath(); g.roundRect(x, 76, 10, 34, 4); g.fill();
      g.fillStyle = '#0e0a06'; g.fillRect(x - 1, 105, 12, 5);
    }
    // 몸: 높은 어깨 혹 → 낮아지는 등 → 엉덩이
    const gr = g.createLinearGradient(0, 24, 0, 92);
    gr.addColorStop(0, '#9a7248'); gr.addColorStop(0.45, '#5e4430'); gr.addColorStop(1, '#2a1e14');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(26, 64); g.quadraticCurveTo(28, 22, 58, 24); g.quadraticCurveTo(82, 30, 104, 46);
    g.quadraticCurveTo(116, 58, 108, 86); g.lineTo(34, 88); g.quadraticCurveTo(24, 80, 26, 64); g.fill();
    // 어깨 혹 위 밝은 털 (빛을 받는 쪽)
    const mg = g.createRadialGradient(46, 34, 2, 46, 44, 26);
    mg.addColorStop(0, 'rgba(200,160,110,.85)'); mg.addColorStop(1, 'rgba(160,120,78,0)');
    g.fillStyle = mg; g.beginPath(); g.ellipse(46, 44, 24, 24, 0, 0, 7); g.fill();
    // 털결
    g.strokeStyle = 'rgba(255,230,190,.09)'; g.lineWidth = 1.2;
    const rnd = U.mulberry(id + 3);
    for (let i = 0; i < 60; i++) { const x = 34 + rnd() * 70, y = 30 + rnd() * 52; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 4); g.stroke(); }
    // 꼬리
    g.strokeStyle = '#2e2118'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(108, 52); g.quadraticCurveTo(118, 66, 114, 82); g.stroke();
    g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(114, 84, 3, 6, 0, 0, 7); g.fill();
    // 머리: 낮게 숙인 큰 머리, 앞머리 털, 턱수염
    const hg = g.createRadialGradient(20, 64, 2, 22, 72, 20);
    hg.addColorStop(0, '#5a4230'); hg.addColorStop(1, '#22170e');
    g.fillStyle = hg; g.beginPath(); g.ellipse(22, 74, 15, 18, 0.25, 0, 7); g.fill();
    g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(26, 60, 12, 8, 0.2, 0, 7); g.fill();   // 이마 털
    g.fillStyle = '#1a120c'; g.beginPath(); g.moveTo(14, 86); g.quadraticCurveTo(18, 104, 26, 96); g.lineTo(30, 84); g.fill();   // 수염
    g.fillStyle = '#120c08'; g.beginPath(); g.ellipse(12, 84, 6, 5, 0, 0, 7); g.fill();   // 코
    // 뿔: 머리 옆에서 위·앞으로 휘어 오른다
    g.strokeStyle = '#e8e0d0'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(24, 60); g.quadraticCurveTo(34, 56, 32, 46); g.stroke();
    g.strokeStyle = '#2a2420'; g.lineWidth = 3; g.beginPath(); g.moveTo(32.5, 49); g.lineTo(32, 46); g.stroke();
    // 눈
    g.fillStyle = '#0a0a0a'; g.beginPath(); g.arc(17, 70, 2.6, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(16.2, 69.2, 0.9, 0, 7); g.fill();
    return (bisonImgs[id] = c.toDataURL());
  }

  function update(dt) {
    // 죽거나 다시 시작하면 내린다
    if (PL.ride && T.mode !== 'play' && T.mode !== 'over') off();
  }

  window.RIDE = { build, near, act, step, after, update, off, mount, reach, nestIcon, bisonIcon, FEEDS, R, get on() { return !!PL.ride; }, get busy() { return !!R.reach; }, get calm() { return !R.hop && R.rodeo < 0; } };
})();
