// fighter.js — 주인공·상대가 함께 쓰는 싸움 몸: 걷기, 기술, 맞기, 쓰러짐, 일어나기
(function () {
  const all = [];   // 살아 있는 싸움꾼 전부
  const GRAV = 24, JUMP_V = 7.6;   // 최고 약 1.2m, 떠 있는 시간 약 0.63초
  const _v = new THREE.Vector3();

  function create(scene, o) {
    const ch = ANIM.make(scene, { map: o.map, scale: o.scale, model: o.model });
    const f = {
      ch, team: o.team, pos: new THREE.Vector3(o.x, 0, o.z), yaw: o.yaw || 0,
      vel: new THREE.Vector3(), push: new THREE.Vector3(),
      hp: o.hp, hpMax: o.hp, dmgMul: o.dmg || 1, scale: o.scale || 1,
      r: 0.42 * (o.scale || 1),
      state: 'free', t: 0, atk: null, atkName: null, hitDone: false,
      y: 0, vy: 0, air: false,
      inv: 0, stun: 0, poise: o.poise || 0, poiseMax: o.poise || 0,
      combo: null, comboT: 0, buffer: null,
      moveSpeed: 0, flash: 0, boss: !!o.boss, dead: false, gone: false,
      brk: 0, brkMax: o.brk || 0, brkT: 9, stunDur: 0,   // 브레이크 막대: 가득 차면 기절
      counterT: 0,                                        // 저스트 회피 뒤 반격 시간

      onHit: null, onKO: null, data: o.data || null,
    };
    ch.holder.position.copy(f.pos);
    ch.holder.rotation.y = f.yaw;
    ch.play(o.team === 'hero' ? 'idle' : 'fightidle', 0);
    all.push(f);
    return f;
  }

  function remove(f) {
    const i = all.indexOf(f); if (i >= 0) all.splice(i, 1);
    f.ch.dispose(); f.gone = true;
  }

  // 기술 시작
  function attack(f, name, def, target) {
    if (f.state !== 'free' && !(f.state === 'attack' && f.canChain)) return false;
    const info = f.ch.info[def.clip];
    f.state = 'attack'; f.t = 0; f.atk = def; f.atkName = name; f.hitDone = false; f.canChain = false; f.buffer = null;
    // 목표 쪽으로 몸을 돌린다 (가까운 상대를 자동으로 노린다)
    if (target) f.yaw = Math.atan2(target.pos.x - f.pos.x, target.pos.z - f.pos.z);
    // 클립: 맞는 순간 앞 pre 초만 보여 주고 wind 초 안에 맞춘다
    const pre = Math.min(info.hit, def.special ? 0.9 : 0.42);
    f.clipSpeed = pre / def.wind;
    f.ch.play(def.clip, 0.06, { force: true, once: true, at: info.hit - pre, speed: f.clipSpeed });
    // 앞으로 내딛기: 목표와의 거리를 보고 알맞게
    let lunge = def.lunge;
    if (target) {
      const d = Math.hypot(target.pos.x - f.pos.x, target.pos.z - f.pos.z) - target.r - f.r;
      lunge = U.clamp(d - def.range * 0.55, 0, def.special ? def.lunge : def.lunge * 1.8);
    }
    f.lungeV = lunge / Math.max(0.08, def.wind);
    if (f.team !== 'hero') f.flash = def.wind;
    if (def.heavy) AUD.sfx('warn');
    AUD.sfx(def.special || def.heavy ? 'whooshBig' : 'whoosh', f.team === 'hero' ? 1 : 0.6);
    return true;
  }

  // 맞기
  function hurt(f, src, def, dmg) {
    if (f.dead || f.inv > 0 || f.state === 'down' || f.state === 'getup' && f.t < 0.3) return false;
    if (f.state === 'dodge' && f.t < 0.3) return false;
    const stunned = f.state === 'stun';
    if (stunned) dmg = Math.round(dmg * 1.3);
    // 약 올리던 상대를 때리면 복수: 크게 휘청이고 브레이크가 두 배로 찬다
    const revenge = f.state === 'taunt' && src.team === 'hero';
    if (revenge) {
      dmg = Math.round(dmg * 1.5);
      def = Object.assign({}, def, { react: def.react === 'light' ? 'big' : def.react, brk: (def.brk || 1) * 2 });
      FX.praise('REVENGE');
    }
    f.hp -= dmg;
    const dx = f.pos.x - src.pos.x, dz = f.pos.z - src.pos.z, d = Math.hypot(dx, dz) || 1;
    const nx = dx / d, nz = dz / d;
    let react = def.react;
    // 기절 중: 주먹은 기절을 못 깬다, 발차기는 눕힌다
    if (stunned && f.hp > 0 && react !== 'down') {
      f.flash = Math.max(f.flash, 0.1);
      f.push.set(nx * def.push * 0.8, 0, nz * def.push * 0.8);
      f.ch.play(Math.random() < 0.5 ? 'hitlight' : 'hitbody', 0.04, { force: true, once: true, speed: 1.4 });
      if (f.onHit) f.onHit(f, src, def, dmg, false);
      return true;
    }
    if (stunned) f.poise = 0;
    // 브레이크 막대: 맞은 만큼 찬다. 가득 차면 기절
    if (f.brkMax && !stunned && f.hp > 0) {
      f.brk += dmg * (def.brk || 1) * (src.counterT > 0 ? 2 : 1) * (window.PL && src !== PL.f ? 0.5 : 1);   // 옆 사람 주먹은 반만
      f.brkT = 0;
      if (f.brk >= f.brkMax) {
        stun(f, nx, nz);
        if (f.onHit) f.onHit(f, src, def, dmg, false);
        return true;
      }
    }
    // 보스 버티기: 가벼운 주먹은 기술을 끊지 못한다
    if (f.poiseMax && react === 'light') {
      f.poise -= dmg;
      if (f.poise > 0) { f.flash = Math.max(f.flash, 0.08); f.push.set(nx * def.push * 0.25, 0, nz * def.push * 0.25); if (f.onHit) f.onHit(f, src, def, dmg, true); return true; }
      f.poise = f.poiseMax;
    }
    if (f.poiseMax && react === 'big' && f.poise > f.poiseMax * 0.5) { f.poise -= dmg * 1.5; react = 'light'; }
    // 보스는 발차기 한 방에 눕지 않는다 — 버티기를 깎아야 눕는다 (필살기는 예외)
    if (f.poiseMax && react === 'down' && !def.special && f.poise > 0) { f.poise -= dmg * 1.6; react = 'big'; }
    f.yaw = Math.atan2(-nx, -nz);
    if (f.hp <= 0) { f.hp = 0; ko(f, nx, nz, def.push); if (f.onHit) f.onHit(f, src, def, dmg, false); return true; }
    if (react === 'down') {
      f.state = 'down'; f.t = 0; f.atk = null;
      f.ch.play('fallback', 0.05, { force: true, once: true, speed: 1.35 });
      f.push.set(nx * def.push * 2.2, 0, nz * def.push * 2.2);
    } else {
      f.state = 'hit'; f.t = 0; f.atk = null;
      f.stun = react === 'big' ? 0.62 : 0.34;
      const clip = react === 'big' ? 'hitbig' : (Math.random() < 0.5 ? 'hitlight' : 'hitbody');
      f.ch.play(clip, 0.04, { force: true, once: true, speed: react === 'big' ? 1.25 : 1.6 });
      f.push.set(nx * def.push * 3, 0, nz * def.push * 3);
    }
    if (f.onHit) f.onHit(f, src, def, dmg, false);
    return true;
  }

  // 기절: 비틀거리며 머리 위에 별. 이 동안은 버티기가 없다
  function stun(f, nx, nz) {
    f.state = 'stun'; f.t = 0; f.atk = null; f.buffer = null;
    f.stunDur = 2.3; f.brk = f.brkMax; f.poise = 0;
    f.ch.play('hitbig', 0.05, { force: true, once: true, speed: 0.55 });
    f.push.set(nx * 2.5, 0, nz * 2.5);
    FX.stun(f, f.stunDur);
  }

  function ko(f, nx, nz, push) {
    f.dead = true; f.state = 'ko'; f.t = 0; f.atk = null;
    f.ch.play('knockout', 0.05, { force: true, once: true, speed: 1.25 });
    f.push.set(nx * push * 2.6, 0, nz * push * 2.6);
    // 상대는 마지막 한 방에 붕 떠서 날아간다
    if (f.team !== 'hero') {
      f.air = true; f.y = Math.max(f.y, 0.02); f.vy = 4 + push * 1.3; f.bounced = false;
      f.push.multiplyScalar(1.5);
    }
    if (f.onKO) f.onKO(f);
  }

  // 기술이 맞는 순간: 앞쪽 부채꼴 안의 상대를 찾는다
  function strike(f) {
    const def = f.atk, fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
    let n = 0;
    const counter = f.counterT > 0;
    for (const o of all) {
      if (o === f || o.team === f.team || o.dead) continue;
      if (o.y > 0.55 && !def.special && !def.hitsAir) continue;   // 뛰어오른 상대는 주먹이 밑으로 지나간다
      const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z;
      const d = Math.hypot(dx, dz) - o.r;
      if (d > def.range * f.scale) continue;
      const cos = (dx * fx + dz * fz) / (Math.hypot(dx, dz) || 1);
      if (Math.acos(U.clamp(cos, -1, 1)) > def.arc / 2) continue;
      let dmg = f.team === 'hero' ? def.dmg * (0.9 + Math.random() * 0.2) : def.dmg * f.dmgMul;
      // 반격: 두 배로 세고 한 단계 크게 맞는다
      let d2 = def;
      if (counter) { dmg *= 2; d2 = Object.assign({}, def, { react: def.react === 'light' ? 'big' : 'down', push: def.push * 1.5 }); }
      if (hurt(o, f, d2, Math.round(dmg))) {
        n++;
        FX.hit(o, f, d2);
        if (counter) FX.counter(o);
        if (!def.special && f.team !== 'hero') break;   // 상대 주먹은 하나만
      }
    }
    if (counter && n) f.counterT = 0;
    return n;
  }

  // 한 프레임
  function step(f, dt) {
    f.t += dt;
    if (f.inv > 0) f.inv -= dt;
    if (f.flash > 0) f.flash -= dt;
    if (f.counterT > 0) f.counterT -= dt;
    if (f.poiseMax && f.state === 'free') f.poise = Math.min(f.poiseMax, f.poise + dt * f.poiseMax * 0.35);
    // 브레이크 막대는 한동안 안 맞으면 천천히 준다
    if (f.brkMax && f.state !== 'stun') { f.brkT += dt; if (f.brkT > 1.8) f.brk = Math.max(0, f.brk - f.brkMax * 0.1 * dt); }

    switch (f.state) {
      case 'attack': {
        const def = f.atk;
        if (f.t < def.wind) {
          const k = f.lungeV * dt;
          PARK.move(f.pos, Math.sin(f.yaw) * k, Math.cos(f.yaw) * k, f.r);
        } else if (!f.hitDone) {
          f.hitDone = true;
          f.hits = strike(f);
          // 맞은 뒤엔 조금 빨리 원래 자세로
          f.ch.speed(def.special ? 0.9 : 1.15);
          if (def.special) { CAM.shake = 0.9; AUD.sfx('slam'); FX.ring(f.pos, 3.2); }
        }
        if (f.hitDone && def.next && f.t > def.wind + 0.02) f.canChain = true;
        if (f.t >= def.wind + def.rec) {
          const b = f.buffer;
          f.state = 'free'; f.atk = null; f.canChain = false; f.buffer = null;
          if (b && f.onBuffer) f.onBuffer(f, b);
        }
        break;
      }
      case 'hit':
        if (f.t >= f.stun) { f.state = 'free'; }
        break;
      case 'down': {
        const lie = f.ch.info.fallback.lie / 1.35;
        if (f.t > lie + 0.35) {
          f.state = 'getup'; f.t = 0;
          f.ch.play('getup', 0.12, { force: true, once: true, speed: 2.1, at: f.ch.info.getup.rise });
        }
        break;
      }
      case 'getup':
        if (f.t > (f.ch.info.getup.up - f.ch.info.getup.rise) / 2.1 + 0.05) { f.state = 'free'; f.inv = 0.35; if (f.poiseMax) f.poise = f.poiseMax; }
        break;
      case 'dodge':
        if (f.t < 0.3) { const k = dt * 16 * (1 - f.t / 0.3); PARK.move(f.pos, f.dodgeX * k, f.dodgeZ * k, f.r); }
        if (f.t > 0.42) f.state = 'free';
        break;
      case 'stun':
        f.yaw += Math.sin(f.t * 4.5) * dt * 1.4;   // 비틀비틀
        if (f.t > f.stunDur) { f.state = 'free'; f.brk = 0; f.poise = f.poiseMax; f.ch.play('fightidle', 0.2, { force: true }); }
        break;
      case 'ko': break;
      case 'taunt': if (f.t > 1.4) f.state = 'free'; break;
      case 'win': break;
    }

    // 점프: 위아래
    if (f.air) {
      f.vy -= GRAV * dt; f.y += f.vy * dt;
      if (f.y <= 0 && f.dead && !f.bounced && f.vy < -5) {
        // 쿵 — 한 번 튀어 오른다
        f.y = 0.01; f.vy = -f.vy * 0.32; f.bounced = true;
        AUD.sfx('slam'); FX.ring(f.pos, 1.6); CAM.shake = Math.max(CAM.shake, 0.4);
      } else if (f.y <= 0) {
        f.y = 0; f.vy = 0; f.air = false;
        AUD.sfx('step', 1); AUD.sfx('step', 1);
        if (f.state === 'free' && f.ch.cur === 'jump') f.ch.play(f.team === 'hero' ? 'idle' : 'fightidle', 0.12, { force: true });
      }
    }

    // 밀림
    if (f.push.lengthSq() > 1e-4) {
      PARK.move(f.pos, f.push.x * dt, f.push.z * dt, f.r);
      f.push.multiplyScalar(Math.exp(-7 * dt));
    }

    // 서로 겹치지 않게
    if (!f.dead) for (const o of all) {
      if (o === f || o.dead) continue;
      const dx = f.pos.x - o.pos.x, dz = f.pos.z - o.pos.z, rr = f.r + o.r;
      const d2 = dx * dx + dz * dz;
      if (d2 < rr * rr && d2 > 1e-6) {
        const d = Math.sqrt(d2), k = (rr - d) * 0.5;
        f.pos.x += dx / d * k; f.pos.z += dz / d * k;
      }
    }

    // 밀쳐지거나 구역 경계에 끌려 물에 들어갔으면 뭍으로 (갇히지 않게)
    if (f.team === 'hero') footsteps(f, dt);
    if (f.riding) return;   // 배 위: 자리·방향은 puzzle.js 가 준다
    if (!f.leaving) PARK.rescue(f.pos, f.r, dt);
    f.ch.holder.position.set(f.pos.x, (f.y || 0) + PARK.groundY(f.pos.x, f.pos.z), f.pos.z);
    const cur = f.ch.holder.rotation.y;
    f.ch.holder.rotation.y = U.angTo(cur, f.yaw, dt * (f.state === 'attack' ? 30 : 12));
    // 들어오는 기술은 번쩍 — 보고 피할 수 있게
    const e = f.ch.mat.emissive;
    if (f.flash > 0 && f.team !== 'hero') {
      const heavy = f.state === 'attack' && f.atk && f.atk.heavy;
      const k = f.state === 'attack' ? (heavy ? 0.55 + 0.35 * Math.sin(T.time * 60) : 0.35 + 0.25 * Math.sin(T.time * 40)) : 0.6;
      if (heavy) e.setRGB(k, k * 0.75, 0); else e.setRGB(k, k * 0.25, k * 0.1);
    }
    else if (f.flash > 0) e.setRGB(0.5, 0.5, 0.5);
    else if (f.counterT > 0) { const k = 0.3 + 0.2 * Math.sin(T.time * 30); e.setRGB(k * 0.6, k * 0.9, k * 1.3); }
    else if (f.rageT > 0) { f.rageT -= dt; e.setRGB(f.rageT * 1.2, 0, 0); }
    else if (e.r) e.setRGB(0, 0, 0);
  }

  // 걸음소리: 발뼈가 들렸다가 가장 낮은 높이로 내려오는 순간 = 발이 땅에 닿음
  function footsteps(f, dt) {
    const B = f.ch.bones; if (!B.LeftFoot || !B.RightFoot) return;
    const fs = f.fs || (f.fs = { low: [9, 9], up: [false, false] });
    const walking = f.state === 'free' && !f.air && !f.riding && f.moveSpeed > 0.5;
    [B.LeftFoot, B.RightFoot].forEach((b, i) => {
      b.getWorldPosition(_v);
      const y = _v.y - (f.y || 0);
      fs.low[i] = Math.min(fs.low[i] + dt * 0.05, y);
      if (y > fs.low[i] + 0.07 * f.scale) fs.up[i] = true;
      else if (fs.up[i] && y < fs.low[i] + 0.025 * f.scale) {
        fs.up[i] = false;
        if (!walking) return;
        const loud = (window.PL && f === PL.f ? 1 : 0.55) * (f.moveSpeed > 4.2 ? 1.25 : 1);
        AUD.sfx(PARK.onPath(f.pos.x, f.pos.z) ? 'footPath' : 'footGrass', loud);
      }
    });
  }

  // 이동 (자유 상태일 때만)
  function locomote(f, mx, mz, speed, dt, face) {
    if (f.state !== 'free') return;
    const m = Math.hypot(mx, mz);
    f.moveSpeed = U.damp(f.moveSpeed, m > 0.01 ? speed : 0, 12, dt);
    if (m > 0.01) {
      const nx = mx / m, nz = mz / m;
      PARK.move(f.pos, nx * f.moveSpeed * dt, nz * f.moveSpeed * dt, f.r);
      f.yaw = face != null ? face : Math.atan2(nx, nz);
    } else if (face != null) f.yaw = face;
  }

  function dodge(f, dx, dz) {
    if (f.state !== 'free' && !(f.state === 'attack' && f.hitDone)) return false;
    const d = Math.hypot(dx, dz);
    if (d < 0.01) { dx = -Math.sin(f.yaw); dz = -Math.cos(f.yaw); } else { dx /= d; dz /= d; }
    f.state = 'dodge'; f.t = 0; f.atk = null; f.dodgeX = dx; f.dodgeZ = dz;
    f.inv = 0.32;
    f.ch.play('dodge', 0.05, { force: true, once: true, speed: 1.9, at: 0.15 });
    AUD.sfx('dodge');
    return true;
  }

  function jump(f) {
    if (f.air || f.dead || (f.state !== 'free' && !(f.state === 'attack' && f.hitDone))) return false;
    if (f.state === 'attack') { f.state = 'free'; f.atk = null; }
    f.air = true; f.vy = JUMP_V; f.y = 0.01;
    const j = f.ch.info.jump;
    if (j) { const air = 2 * JUMP_V / GRAV; f.ch.play('jump', 0.06, { force: true, once: true, at: Math.max(0, j.off - 0.06), speed: (j.land - j.off) / air }); }
    AUD.sfx('whoosh', 0.7);
    return true;
  }

  window.FIGHT = { all, create, remove, attack, hurt, step, locomote, dodge, strike, jump, stun };
})();
