// player.js — 주인공 조작: 이동·연속 주먹·발차기·피하기·필살기
(function () {
  const IN = { f: 0, r: 0, run: false, punch: false, kick: false, dodge: false, special: false, act: false };
  const PL = { f: null, gauge: 0, gaugeMax: 100, combo: 0, comboT: 0, lastHitT: 0 };
  const WALK = 3.3, RUN = 6.2;

  function spawn(scene) {
    const s = PARK.start;
    PL.f = FIGHT.create(scene, { team: 'hero', x: s.x, z: s.z, yaw: s.yaw, hp: 160 });
    PL.f.onBuffer = (f, b) => doAttack(b);
    PL.f.onHit = (f, src, def, dmg) => { CAM.shake = Math.max(CAM.shake, def.react === 'down' ? 0.7 : 0.35); FX.hurtFlash(); FX.num(f, -dmg, def.react !== 'light'); PL.combo = 0; };
    PL.f.onKO = me => {
      // 짝꿍이 서 있으면 그쪽으로 넘어가 계속 싸운다. 둘 다 쓰러지면 GAME OVER
      if (ALLY.f && !ALLY.f.dead) {
        T.slow = 0.35; T.slowT = 0.6;
        setTimeout(() => { if (PL.f !== me) return; if (ALLY.f.dead) GAME.lose(); else swap(true); }, 900);
      } else GAME.lose();
    };
  }

  // ── 체인지: 켄 ↔ 히로미 조작을 바꾼다 (조작 안 하는 쪽은 옆에서 알아서 싸운다) ──
  let swapCd = 0, tagCd = 0;
  function swap(force) {
    const a = PL.f, b = ALLY.f;
    if (!a || !b) return false;
    if (!force && (b.dead || a.dead || swapCd > 0 || T.mode !== 'play' || PL.ride)) { if (!force) AUD.sfx('deny'); return false; }
    // 연속기 도중(3타 이상)이나 상대가 기절했을 때 바꾸면 들어오는 쪽이 날아 차며 들어온다
    const fightOn = ZONE.active && ZONE.phase === 'fight';
    const tag = !force && fightOn && tagCd <= 0 && (PL.combo >= 3 || ZONE.foes.some(o => o.state === 'stun'))
      && (b.state === 'free' || b.state === 'attack');
    const keepCombo = PL.combo;
    // 맞았을 때·쓰러졌을 때 하는 일도 함께 바꿔 단다
    const ka = { onHit: a.onHit, onKO: a.onKO, onBuffer: a.onBuffer }, kb = { onHit: b.onHit, onKO: b.onKO, onBuffer: b.onBuffer };
    Object.assign(a, kb); Object.assign(b, ka);
    PL.f = b; ALLY.f = a;
    b.buffer = null; b.canChain = false;
    ALLY.queue.length = 0; ALLY.tgt = null;
    if (a.dead) ALLY.reviveT = 6;          // 쓰러져서 넘어간 쪽은 잠시 뒤 일어난다
    PL.combo = 0; swapCd = 0.6;
    b.inv = Math.max(b.inv, 0.5);
    FX.ring(b.pos, 1.4); AUD.sfx('praise');
    HUD.swapped();
    if (tag) {
      b.state = 'free'; b.atk = null;
      const tg = target(9);
      if (tg && FIGHT.attack(b, 'tag', DATA.HERO_ATK.tag, tg)) {
        PL.combo = keepCombo; PL.comboT = 1.4;
        tagCd = 3.5;
        T.slow = 0.4; T.slowT = 0.25;
        FX.praise('TAG');
      }
    }
    return true;
  }

  function reset(x, z, yaw) {
    const f = PL.f;
    f.pos.set(x, 0, z); f.yaw = yaw; f.ch.holder.rotation.y = yaw;
    f.hp = f.hpMax; f.dead = false; f.state = 'free'; f.atk = null; f.push.set(0, 0, 0); f.inv = 1;
    f.ch.play('idle', 0, { force: true });
    PL.combo = 0;
    if (window.CAMERA) CAMERA.snap();
  }

  // 가까운 상대 — 누를 때 자동으로 그쪽을 본다
  function target(maxD) {
    const f = PL.f; let best = null, bs = 1e9;
    const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
    // 입력 방향이 있으면 그쪽을 더 쳐 준다
    let ix = fx, iz = fz;
    const mv = moveVec(), m = Math.hypot(mv.x, mv.z);
    if (m > 0.1) { ix = mv.x / m; iz = mv.z / m; }
    for (const o of FIGHT.all) {
      if (o.team === 'hero' || o.dead) continue;
      const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, d = Math.hypot(dx, dz);
      if (d > (maxD || 4.2)) continue;
      const dot = (dx * ix + dz * iz) / (d || 1);
      const score = d - dot * 1.6 + (o.state === 'down' || o.state === 'getup' ? 3 : 0) - (o.state === 'stun' ? 1.2 : 0);
      if (score < bs) { bs = score; best = o; }
    }
    return best;
  }

  function doAttack(name) {
    const f = PL.f;
    const def = DATA.HERO_ATK[name];
    const tg = target(def.special ? 6.5 : 4.2);
    if (FIGHT.attack(f, name, def, tg)) {
      if (def.special) { PL.gauge = 0; T.slow = 0.35; T.slowT = 0.5; FX.banner('필살', 0.8); }
      return true;
    }
    return false;
  }

  // 저스트 회피: 상대 기술이 맞기 직전(0.3초 안)에 피하면 느린 화면 + 다음 한 방이 반격
  function justCheck(f, byJump) {
    for (const o of FIGHT.all) {
      if (o.team === 'hero' || o.dead || o.state !== 'attack' || o.hitDone || !o.atk) continue;
      if (byJump && o.atk.hitsAir) continue;   // 날아 차기는 뛰어도 맞는다
      const left = o.atk.wind - o.t;
      if (left < 0 || left > 0.3) continue;
      const dx = f.pos.x - o.pos.x, dz = f.pos.z - o.pos.z, d = Math.hypot(dx, dz);
      if (d - f.r > o.atk.range * o.scale + 1.0 + (o.atk.long ? Math.max(0, o.lungeV * left) : 0)) continue;
      if (Math.cos(Math.atan2(dx, dz) - o.yaw) < 0.5) continue;
      // 헛친 상대는 조금 더 오래 빈틈을 보인다
      o.atk = Object.assign({}, o.atk, { rec: o.atk.rec + 0.35 });
      f.counterT = 1.3;
      f.inv = Math.max(f.inv, 0.45);
      PL.gauge = Math.min(PL.gaugeMax, PL.gauge + 15);
      T.slow = 0.25; T.slowT = 0.45;
      FX.just(f);
      return true;
    }
    return false;
  }

  function press(kind) {
    const f = PL.f;
    if (f.dead || T.mode !== 'play' || PL.ride) return;
    // 떠 있을 때 주먹·발 = 공중 킥
    if ((kind === 'punch' || kind === 'kick') && f.air && f.state === 'free') {
      if (FIGHT.attack(f, 'airkick', DATA.HERO_ATK.airkick, target(4.5))) f.vy = Math.max(f.vy, 1.5);
      return;
    }
    if (kind === 'punch') {
      if (f.state === 'attack') {
        const nx = f.atk.next || (f.hitDone ? 'jab' : null);
        if (!nx) return;
        if (f.canChain) { f.state = 'free'; doAttack(nx); } else f.buffer = nx;
        return;
      }
      if (f.state === 'free') doAttack('jab');
    } else if (kind === 'kick') {
      if (f.state === 'attack') { if (f.canChain) { f.state = 'free'; doAttack('kick'); } else f.buffer = 'kick'; return; }
      if (f.state === 'free') doAttack('kick');
    } else if (kind === 'special') {
      if (PL.gauge < PL.gaugeMax) { AUD.sfx('deny'); return; }
      if (f.state === 'attack' && f.hitDone) f.state = 'free';
      if (f.state === 'free') doAttack('dropkick');
    } else if (kind === 'jump') {
      // 싸움 밖이면 여자애도 한 박자 늦게 따라 뛴다
      if (FIGHT.jump(f)) {
        if (ZONE.active) justCheck(f, true);
        else if (window.ALLY) setTimeout(() => FIGHT.jump(ALLY.f), 140);
      }
    } else if (kind === 'dodge') {
      const v = moveVec();
      if (f.state === 'attack' && f.hitDone) f.state = 'free';
      if (FIGHT.dodge(f, v.x, v.z)) justCheck(f);
    }
  }

  function moveVec() {
    const y = CAM.yaw + Math.PI;
    const fx = Math.sin(y), fz = Math.cos(y), rx = -Math.cos(y), rz = Math.sin(y);
    return { x: fx * IN.f + rx * IN.r, z: fz * IN.f + rz * IN.r };
  }

  function step(dt) {
    const f = PL.f;
    if (!f) return;
    if (PL.ride) { FIGHT.step(f, dt); return; }   // 오리배: puzzle.js 가 자리를 잡는다
    const v = moveVec();
    const m = Math.min(1, Math.hypot(v.x, v.z));
    const fighting = ZONE.active != null;
    const spd = IN.run ? RUN : WALK;
    FIGHT.locomote(f, v.x, v.z, spd * m, dt);
    if (f.state === 'free' && !f.air) {
      const s = f.moveSpeed;
      if (s > 4.2) f.ch.play('run', 0.18, { speed: s / 5.6 });
      else if (s > 0.4) f.ch.play('walk', 0.18, { speed: Math.max(0.6, s / 2.2) });
      else f.ch.play(fighting ? 'fightidle' : 'idle', 0.25);
    }
    FIGHT.step(f, dt);
    if (PL.comboT > 0) { PL.comboT -= dt; if (PL.comboT <= 0) PL.combo = 0; }
    if (swapCd > 0) swapCd -= dt;
    if (tagCd > 0) tagCd -= dt;
  }

  // 때렸을 때 (상대 쪽 onHit 에서 부른다)
  function landed(def, dmg) {
    PL.combo++; PL.comboT = 1.4;
    if (!def.special) {
      const was = PL.gauge;
      PL.gauge = Math.min(PL.gaugeMax, PL.gauge + def.gauge);
      if (was < PL.gaugeMax && PL.gauge >= PL.gaugeMax) AUD.sfx('clear');   // 꽉 찬 순간 딩
    }
    if (PL.combo === 5) FX.praise('NICE');
    else if (PL.combo === 10) FX.praise('GREAT');
    else if (PL.combo === 20) FX.praise('PERFECT');
  }

  window.PL = PL;
  window.PLAYER = { IN, spawn, reset, step, press, landed, target, moveVec, swap };
})();
