// hero.js — 주인공(믹사모 리깅) 불러오기·동작·걷기/달리기/점프/헤엄/넘어짐
(function () {
  const V3 = THREE.Vector3;
  const IN = { f: 0, r: 0, run: false, jumpEdge: false, upHeld: false, actEdge: false, bagEdge: false };

  // GLB 읽기 — http 면 fetch, file:// 면 옆의 .glb.js 사본
  function loadGLB(url, onProg) {
    const clean = url.split('?')[0];
    const parse = buf => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf, '', res, rej));
    if (location.protocol === 'file:' || /[?&]filetest=1/.test(location.search)) {
      return new Promise((res, rej) => {
        const name = clean.split('/').pop();
        const done = () => {
          const b64 = window.GLBJS && window.GLBJS[name];
          if (!b64) return rej(new Error('no glbjs ' + name));
          const bin = atob(b64), u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          window.GLBJS[name] = null;
          parse(u8.buffer).then(res, rej);
        };
        if (window.GLBJS && window.GLBJS[name]) return done();
        const s = document.createElement('script');
        s.src = clean + '.js';
        s.onload = done; s.onerror = () => rej(new Error('load ' + s.src));
        document.head.appendChild(s);
      });
    }
    return fetch(url).then(r => {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      const total = +r.headers.get('content-length') || 0;
      if (!onProg || !r.body || !total) return r.arrayBuffer();
      const rd = r.body.getReader(), parts = []; let got = 0;
      const pump = () => rd.read().then(({ done, value }) => {
        if (done) { const u = new Uint8Array(got); let o = 0; for (const p of parts) { u.set(p, o); o += p.length; } return u.buffer; }
        parts.push(value); got += value.length; onProg(got / total); return pump();
      });
      return pump();
    }).then(parse);
  }

  // 인물 모델 정리: 그림자, 밉맵, 흰 바탕색
  function tidy(root) {
    root.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      o.frustumCulled = false;
      const ms = [].concat(o.material);
      for (const m of ms) {
        if (m.map) { m.map.anisotropy = 8; m.map.generateMipmaps = true; m.map.minFilter = THREE.LinearMipmapLinearFilter; m.map.needsUpdate = true; }
        // 밀랍인형처럼 보이던 것(사장님 2026-09-17): 하늘빛 반사(env 1.0)가 온몸을 고르게 밝혀 명암이 사라졌다.
        //   반사를 줄여 해가 모양을 만들게 하고, 바탕색을 살짝 낮춰 피부가 하얗게 뜨지 않게 한다
        if (m.color) m.color.set(0xebe3dd);
        m.metalness = 0; m.roughness = 0.95; m.envMapIntensity = 0.5;
      }
    });
  }

  // 발바닥 속도를 재서 걸음과 미끄러짐을 맞춘다
  function strideSpeed(root, mixer, clip, foot) {
    const act = mixer.clipAction(clip);
    act.reset().play(); act.setEffectiveWeight(1);
    const N = 60, zs = [];
    const w = new V3();
    for (let i = 0; i <= N; i++) {
      mixer.setTime(clip.duration * i / N);
      root.updateMatrixWorld(true);
      foot.getWorldPosition(w);
      zs.push([w.z, w.y]);
    }
    act.stop();
    // 발이 땅에 붙은 구간(가장 낮은 40%)에서 뒤로 미는 속도
    const ys = zs.map(v => v[1]).sort((a, b) => a - b);
    const lim = ys[Math.floor(ys.length * 0.4)];
    const sp = [];
    for (let i = 1; i < zs.length; i++) if (zs[i][1] <= lim && zs[i - 1][1] <= lim) sp.push(-(zs[i][0] - zs[i - 1][0]) / (clip.duration / N));
    sp.sort((a, b) => a - b);
    return sp.length ? Math.abs(sp[Math.floor(sp.length / 2)]) : 1;
  }

  const PL = {
    pos: new V3(), vel: new V3(), yaw: 0, state: 'ground', ch: null,
    running: false, safe: false, swim: false, wade: 0,
    act: null, actT: 0, knockT: 0, lockT: 0, airT: 0,
  };

  const CH = { holder: null, mixer: null, acts: {}, cur: '', bones: {}, scale: 1, clipSpeed: { walk: 1.4, run: 4.5 } };

  async function load(onProg) {
    const gl = await loadGLB('assets/models/hero.glb?v=2', onProg);
    const model = gl.scene;
    tidy(model);
    const holder = new THREE.Group();
    const inner = new THREE.Group();
    holder.add(inner); inner.add(model);
    CH.holder = holder; CH.inner = inner; CH.model = model;
    model.traverse(o => { if (o.isBone) CH.bones[o.name.replace('mixamorig', '')] = o; });
    const mixer = new THREE.AnimationMixer(model);
    CH.mixer = mixer;
    const clips = {};
    for (const c of gl.animations) {
      // 엉덩이 위치 트랙은 위아래만 남긴다 (제자리 동작이 아닌 것도 앞으로 새지 않게)
      for (const tr of c.tracks) {
        if (/Hips\.position$/.test(tr.name)) {
          const v = tr.values;
          const x0 = v[0], z0 = v[2];
          for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
        }
      }
      clips[c.name] = c;
    }
    // 나중에 받은 동작(도끼질·공 차기) — 뼈+동작만 든 작은 GLB (tools/convert_acts.html)
    //   다른 캐릭터로 받은 동작이라 엉덩이 높이만 주인공 서 있는 높이에 맞춘다
    try {
      const ex = await loadGLB('assets/models/hero_acts.glb?v=5');
      const hipIdle = clips.idle && clips.idle.tracks.find(t => /Hips\.position$/.test(t.name));
      for (const c of ex.animations) {
        const tr = c.tracks.find(t => /Hips\.position$/.test(t.name));
        if (tr && hipIdle) {
          const v = tr.values, h = hipIdle.values, k = h[1] / v[1];
          for (let i = 0; i < v.length; i += 3) { v[i] = h[0]; v[i + 1] *= k; v[i + 2] = h[2]; }
        }
        clips[c.name] = c;
      }
    } catch (e) { console.warn('hero_acts', e); }
    // 물속 찌르기: 다리·엉덩이는 헤엄(swimu), 상체·팔은 작살 찌르기(stab)를 한 동작으로 합친다
    if (clips.stab && clips.swimu) {
      const upper = /(Spine|Neck|Head|Shoulder|Arm|Hand)/;
      const tr = clips.swimu.tracks.filter(t => !upper.test(t.name)).map(t => t.clone())
        .concat(clips.stab.tracks.filter(t => upper.test(t.name) && !/Hips/.test(t.name)).map(t => t.clone()));
      clips.swimstab = new THREE.AnimationClip('swimstab', -1, tr);
    }
    CH.clips = clips;
    for (const k in clips) {
      const a = mixer.clipAction(clips[k]);
      CH.acts[k] = a;
    }
    // 크기 재기: 서 있는 첫 프레임에서 머리끝과 발끝
    const idle = CH.acts.idle; idle.play(); mixer.setTime(0);
    model.updateMatrixWorld(true);
    // 몸 겉면(정점)으로 잰다 — 이 모형엔 머리꼭대기 뼈가 없어 머리 뿌리 뼈(Head)를 1.74m 에 맞췄더니
    //   실제 키가 2.2m 거인이 됐다 (사장님 2026-09-27 "1로 하고"). 머리카락까지 1.80m
    const w = new V3();
    let yTop = -1e9, yFoot = 1e9;
    model.traverse(o => {
      if (!o.isSkinnedMesh) return;
      const pos = o.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 3) { o.getVertexPosition(i, w); o.localToWorld(w); if (w.y > yTop) yTop = w.y; if (w.y < yFoot) yFoot = w.y; }
    });
    if (!(yTop > yFoot)) {   // 혹시 못 재면 옛 방식
      (CH.bones.HeadTop_End || CH.bones.Head).getWorldPosition(w); yTop = w.y; yFoot = 1e9;
      for (const b of ['LeftToe_End', 'RightToe_End', 'LeftFoot', 'RightFoot']) if (CH.bones[b]) { CH.bones[b].getWorldPosition(w); yFoot = Math.min(yFoot, w.y); }
    }
    const hgt = yTop - yFoot;
    CH.scale = 1.80 / hgt;
    inner.scale.setScalar(CH.scale);
    inner.position.y = -yFoot * CH.scale + 0.01;
    idle.stop();
    // 걸음 빠르기
    try {
      const foot = CH.bones.LeftFoot;
      for (const k of ['walk', 'run']) CH.clipSpeed[k] = strideSpeed(model, mixer, clips[k], foot) * CH.scale;
    } catch (e) { }
    mixer.setTime(0);
    play('idle', 0);
    return CH;
  }

  function play(name, fade, opt) {
    opt = opt || {};
    const a = CH.acts[name];
    if (!a) return;
    if (CH.cur === name && !opt.restart) return;
    const prev = CH.acts[CH.cur];
    a.reset();
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.setEffectiveTimeScale(opt.speed || 1);
    a.setLoop(opt.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = !!opt.once;
    if (opt.from) a.time = opt.from;
    if (prev && prev !== a) { a.crossFadeFrom(prev, fade == null ? 0.2 : fade, false); }
    a.play();
    CH.cur = name;
  }

  function spawn(scene) {
    scene.add(CH.holder);
    PL.ch = CH;
  }

  function reset(p) {
    if (window.RIDE) RIDE.off();
    if (PL.aim && window.HUNT) HUNT.aim(false);
    PL.pos.set(p.x, WORLD.groundAt(p.x, p.z), p.z);
    PL.yaw = p.yaw || 0;
    PL.vel.set(0, 0, 0);
    PL.state = 'ground'; PL.act = null; PL.afterAct = null; PL.knockT = 0; PL.lockT = 0;
    CH.holder.position.copy(PL.pos);
    CH.holder.rotation.y = PL.yaw;
    play('idle', 0, { restart: true });
  }

  // 행동(줍기·앉기 등) — 그동안 못 움직인다
  function doAct(name, secs, opt) {
    PL.act = name; PL.actT = secs; PL.afterAct = null;   // 새 동작은 앞 동작의 뒤처리를 지운다
    PL.vel.x = PL.vel.z = 0;
    play(name, 0.25, Object.assign({ restart: true }, opt || {}));
  }

  PL.canHit = () => PL.state === 'ground' && PL.knockT <= 0 && !PL.swim && PL.lockT <= 0 && !PL.ride;
  PL.knock = (from) => {
    const dx = PL.pos.x - from.x, dz = PL.pos.z - from.z, d = Math.hypot(dx, dz) || 1;
    PL.vel.set(dx / d * 5.5, 5.2, dz / d * 5.5);
    PL.state = 'air'; PL.knockT = 1.6; PL.act = null; PL.afterAct = null;
    play('fall', 0.1, { restart: true });
    if (window.CAM) CAM.shake = 0.7;
    if (window.ITEMS) ITEMS.spill();
  };

  const WALK = 2.2, RUN = 5.4, RUN_FAST = 6.8, SWIM = 1.7, GRAV = 20, JUMPV = Math.sqrt(2 * 20 * 1.2);
  const _p = { x: 0, y: 0, z: 0 };

  function step(dt, camYaw) {
    const p = PL.pos;
    if (PL.climb) { if (PL.act) PL.act = null; PLAY.climbStep(dt); return; }   // 사다리 (play.js)
    if (PL.ride) { PL.act = null; RIDE.step(dt, camYaw); return; }   // 들소 타기 (ride.js)
    if (PL.aim && !PL.act) { HUNT.step(dt, camYaw); return; }   // 장총 겨누기 (hunt.js)
    if (PL.lockT > 0) PL.lockT -= dt;
    // 행동 중
    if (PL.act) {
      PL.actT -= dt;
      if (PL.actT <= 0) { PL.act = null; if (PL.afterAct) { const f = PL.afterAct; PL.afterAct = null; f(); } }
      else { settle(dt); return; }
    }
    let f = IN.f, r = IN.r;
    if (PL.knockT > 0) { PL.knockT -= dt; f = r = 0; }
    if (PL.lockT > 0) f = r = 0;
    const len = Math.hypot(f, r);
    if (len > 1) { f /= len; r /= len; }
    const mag = Math.min(1, len);
    // 카메라 기준 방향
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    let mx = fx * f + rx * r, mz = fz * f + rz * r;

    // 물 깊이
    const ground = WORLD.groundAt(p.x, p.z, p.y);
    const depth = -ground;   // 물 높이 0
    const onBoard = TER.boardD(p.x, p.z) < 1.0 && ground > 0.3;
    PL.swim = depth > 1.25 && !onBoard;
    PL.wade = (!PL.swim && depth > 0.12 && PL.state === 'ground' && !onBoard) ? depth : 0;
    // 잠수 (사장님 2026-09-18 "수영해서 물고기 잡기하자 작살로") — 헤엄치다 스페이스
    if (PL.air == null) PL.air = 1;
    if (!PL.dive && PL.swim && IN.jumpEdge && PL.knockT <= 0) {
      IN.jumpEdge = false;
      PL.dive = true; p.y = Math.min(p.y, -1.7); PL.vel.y = -1.2;
      PL.diveHold = true;   // 잠수하려고 누른 스페이스는 한 번 뗄 때까지 '떠오르기'로 치지 않는다
      if (window.AUD) AUD.sfx('splash');
      play('swimu', 0.3, { restart: true });
    }
    if (PL.dive) { diveStep(dt, camYaw, f, r, mag); return; }
    if (PL.air < 1) PL.air = Math.min(1, PL.air + dt / 3);

    // 달리기와 힘
    const wantRun = IN.run && mag > 0.1 && !PL.swim;
    PL.running = wantRun;

    let speed = PL.swim ? SWIM * (IN.run ? 1.35 : 1) : (PL.running ? (T.shop.shoes ? RUN_FAST : RUN) : WALK);
    if (PL.wade) speed *= T.shop.boots ? 0.9 : 0.5;
    if (PL.running && T.items.boar > 0) speed *= 0.7;   // 멧돼지를 메면 무겁다 (2026-09-20)
    speed *= mag;
    const tvx = mag > 0.05 ? mx / Math.hypot(mx, mz) * speed : 0;
    const tvz = mag > 0.05 ? mz / Math.hypot(mx, mz) * speed : 0;

    if (PL.state === 'ground' || PL.swim) {
      const acc = PL.knockT > 0 ? 2 : 9;
      PL.vel.x = U.damp(PL.vel.x, tvx, acc, dt);
      PL.vel.z = U.damp(PL.vel.z, tvz, acc, dt);
    } else {
      // 공중 조종은 약하게
      PL.vel.x += (tvx - PL.vel.x) * Math.min(1, dt * 1.2);
      PL.vel.z += (tvz - PL.vel.z) * Math.min(1, dt * 1.2);
    }
    if (mag > 0.05 && PL.knockT <= 0) {
      const want = Math.atan2(tvx, tvz);
      PL.yaw += U.angDiff(PL.yaw, want) * Math.min(1, dt * 11);
    }

    // 땅 점프는 뺐다 — 뛸 일이 없다(턱은 걸어서 오른다). 스페이스는 물에서 잠수·떠오르기만 (사장님 2026-10-01)
    IN.jumpEdge = false;

    // 움직이기
    p.x += PL.vel.x * dt; p.z += PL.vel.z * dt;
    if (PL.state === 'air') { PL.vel.y -= GRAV * dt; p.y += PL.vel.y * dt; PL.airT += dt; }
    _p.x = p.x; _p.y = p.y; _p.z = p.z;
    COL.push(_p, 0.32, 1.6);
    ANIMALS.pushPlayer(_p);
    p.x = _p.x; p.z = _p.z;
    const L = TER.LIMIT;
    p.x = U.clamp(p.x, -L, L); p.z = U.clamp(p.z, -L, L);

    const g2 = WORLD.groundAt(p.x, p.z, p.y);
    if (PL.swim) {
      const wy = -1.3;
      p.y = U.damp(p.y, Math.max(wy, g2), 6, dt);
      PL.vel.y = 0; PL.state = 'ground';
    } else if (PL.state === 'air') {
      if (p.y <= g2 && PL.vel.y <= 0) {
        p.y = g2; PL.state = 'ground';
        const hard = PL.vel.y < -9;
        PL.vel.y = 0;
        if (window.CAM) CAM.land(hard ? 1 : 0.4);
        if (window.AUD) AUD.sfx(PL.wade ? 'splash' : 'land');
        if (PL.knockT > 0) { doAct('kneel', 0.9, { from: 1.2 }); }
      }
    } else {
      // 걸어서 내려갈 때 턱이 높으면 떨어진다
      if (g2 < p.y - 0.6) { PL.state = 'air'; PL.vel.y = 0; PL.airT = 0; }
      else p.y = U.damp(p.y, g2, 18, dt);
      if (p.y < g2) p.y = g2;
    }
    anim(dt, Math.hypot(PL.vel.x, PL.vel.z));
    CH.holder.position.copy(p);
    CH.holder.rotation.y = PL.yaw;
  }

  // 물속: 카메라가 보는 쪽(위아래 포함)으로 헤엄, 스페이스로 솟구침, 숨이 다하면 저절로 떠오른다
  const DIVE = 1.9;
  const SWIM_UP = 9.0, WATER_SINK = 3.4;   // 루루냥 해녀 물질 값 그대로
  function diveStep(dt, camYaw, f, r, mag) {
    const p = PL.pos;
    // 잠수법은 루루냥 해녀 물질 그대로 (사장님 2026-09-27): 스페이스를 누르고 있으면 떠오르고, 떼면 천천히 가라앉는다.
    //   앞뒤좌우는 카메라가 보는 쪽 수평으로만 — 아래를 보고 앞으로 가야 내려가던 방식은 뺐다
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
    const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    PL.air = Math.max(0, PL.air - dt / 25);
    const out = PL.air <= 0;
    const s = (IN.run ? 2.6 : DIVE) * (out ? 0.3 : 1);
    const tx = (fx * f + rx * r) * s, tz = (fz * f + rz * r) * s;
    IN.jumpEdge = false;
    if (!IN.upHeld) PL.diveHold = false;
    const up = IN.upHeld && !PL.diveHold;
    if (up) PL.vel.y += SWIM_UP * dt;          // 누르고 있는 동안 계속 떠오름
    PL.vel.y -= WATER_SINK * dt;               // 놓으면 천천히 가라앉음
    PL.vel.y = U.clamp(PL.vel.y, -2.6, 4.2);
    if (out) PL.vel.y = Math.max(PL.vel.y, 2.2);   // 숨이 다하면 저절로 떠오른다
    PL.vel.x = U.damp(PL.vel.x, tx, 3, dt); PL.vel.z = U.damp(PL.vel.z, tz, 3, dt);
    p.x += PL.vel.x * dt; p.y += PL.vel.y * dt; p.z += PL.vel.z * dt;
    _p.x = p.x; _p.y = p.y; _p.z = p.z; COL.push(_p, 0.32, 1.6); p.x = _p.x; p.z = _p.z;
    const L = TER.LIMIT; p.x = U.clamp(p.x, -L, L); p.z = U.clamp(p.z, -L, L);
    const g = TER.H(p.x, p.z);
    if (p.y < g + 0.3) { p.y = g + 0.3; if (PL.vel.y < 0) PL.vel.y = 0; }
    // 떠오름(머리가 수면 위로) · 걸어 나갈 만큼 얕은 곳 — 얕은 물에선 바닥까지만 내려가고 잠수는 이어진다
    if (p.y > -0.9 || g > -1.15) {
      PL.dive = false; PL.vel.y = 0;
      if (p.y > -1.25) p.y = -1.3;
      if (window.AUD) AUD.sfx('splash');
      return;
    }
    const hs = Math.hypot(PL.vel.x, PL.vel.z), vs = Math.hypot(hs, PL.vel.y);
    if (PL.stabT > 0) { }   // 찌르는 동안은 몸 방향을 그대로 둔다 — 몸이 향한 쪽으로 찌른다 (2026-09-27 "작살을 쓰면 몸이 자동으로 뒤로돈다")
    else if (hs > 0.2) PL.yaw += U.angDiff(PL.yaw, Math.atan2(PL.vel.x, PL.vel.z)) * Math.min(1, dt * 6);
    else if (f > 0.1) PL.yaw += U.angDiff(PL.yaw, Math.atan2(fx, fz)) * Math.min(1, dt * 6);
    if (PL.stabT > 0) PL.stabT -= dt;
    else if (vs > 0.35) { play('swimu', 0.3); CH.acts.swimu.setEffectiveTimeScale(U.clamp(vs / 1.6, 0.5, 1.6)); }
    else { play('swimu', 0.4); CH.acts.swimu.setEffectiveTimeScale(0.35); }
    // 몸을 헤엄치는 쪽으로 기울인다
    const want = PL.stabT > 0 ? (window.CAM ? CAM.pitch : 0) * 0.8 : (vs > 0.35 ? Math.atan2(-PL.vel.y, hs) : 0);   // 찌를 땐 보는 쪽으로 몸을 맞춘다
    CH.holder.rotation.order = 'YXZ';
    CH.holder.rotation.x = U.damp(CH.holder.rotation.x, U.clamp(want, -1.1, 1.6), PL.stabT > 0 ? 12 : 4, dt);
    CH.holder.position.copy(p);
    CH.holder.rotation.y = PL.yaw;
  }

  function settle(dt) {
    const p = PL.pos;
    const g = WORLD.groundAt(p.x, p.z, p.y);
    if (!PL.swim) p.y = U.damp(p.y, g, 12, dt);
    CH.holder.position.copy(p);
    CH.holder.rotation.y = PL.yaw;
  }

  function anim(dt, sp) {
    if (PL.act) return;
    if (PL.swim) {
      if (sp > 0.4) play('swim', 0.3, { speed: U.clamp(sp / 1.7, 0.6, 1.5) }); else play('tread', 0.35);
      // 헤엄 동작은 누운 자세 → 몸을 물에 맞춘다
      return;
    }
    if (PL.state === 'air') {
      if (PL.knockT > 0) return;
      if (PL.leap && CH.cur === 'leap' && PL.airT < 0.9) return;
      if (CH.cur !== 'jump' || PL.airT > 0.55) { if (PL.airT > 0.15 || CH.cur !== 'jump') play('fall', 0.25); }
      return;
    }
    const heavy = T.items.boar > 0;   // 멧돼지를 메고 있으면 메고 걷는 동작 (2026-09-20, 믹사모 carryidle·carrywalk)
    if (sp < 0.25) { play(heavy && CH.acts.carryidle ? 'carryidle' : 'idle', 0.25); return; }
    const run = sp > 3.4;
    const name = heavy && CH.acts.carrywalk ? 'carrywalk' : (run ? 'run' : 'walk');
    play(name, 0.2);
    const a = CH.acts[name];
    a.setEffectiveTimeScale(U.clamp(sp / (CH.clipSpeed[name] || CH.clipSpeed.walk), 0.5, 2.2));
  }

  function update(dt) {
    if (CH.mixer) CH.mixer.update(dt);
    // 헤엄칠 때 몸을 물속으로 낮추고, 누워 헤엄치는 동작은 수면에 맞춘다
    const swimNow = CH.cur === 'swim';
    if (!PL.dive && CH.holder && CH.holder.rotation.x) CH.holder.rotation.x = U.damp(CH.holder.rotation.x, 0, 8, dt);
    CH.inner.position.y = U.damp(CH.inner.position.y, (CH.baseY == null ? (CH.baseY = CH.inner.position.y) : CH.baseY) + (swimNow ? 0.35 : 0), 5, dt);
  }

  window.PL = PL;
  window.PLAYER = { IN, load, spawn, reset, step, update, play, doAct, loadGLB, tidy, CH };
})();
