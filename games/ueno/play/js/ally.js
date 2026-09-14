// ally.js — 같이 싸우는 여자애: 평소엔 옆에서 따라 걷고, 구역에선 알아서 싸운다
(function () {
  const AL = { f: null, tgt: null, retgt: 0, cd: 0, queue: [], reviveT: 0, seen: new WeakSet() };

  // 동료 기술: 주인공 기술을 조금 느리고 약하게
  function def(name) {
    const b = DATA.HERO_ATK[name];
    return Object.assign({}, b, { wind: b.wind * 1.3, dmg: Math.round(b.dmg * 0.6), next: null });
  }

  function spawn(scene) {
    const s = PARK.start;
    AL.f = FIGHT.create(scene, { team: 'hero', model: 'girl', x: s.x + 1.4, z: s.z + 0.6, yaw: s.yaw, hp: 150, scale: 0.924 });   // 모델이 주인공보다 커서 줄였다가 사장님 요청으로 10% 키움(0.84→0.924)
    AL.f.r = 0.36;
    AL.f.onBuffer = (f, b) => next(b);
    AL.f.onKO = () => { AL.reviveT = 6; AL.queue.length = 0; };
  }

  function reset(x, z, yaw) {
    const f = AL.f;
    f.pos.set(x, 0, z); f.yaw = yaw; f.ch.holder.rotation.y = yaw;
    f.hp = f.hpMax; f.dead = false; f.state = 'free'; f.atk = null; f.push.set(0, 0, 0); f.inv = 1;
    f.ch.play('idle', 0, { force: true });
    AL.queue.length = 0; AL.tgt = null; AL.reviveT = 0;
  }

  // 주인공 바로 옆자리 (나란히). 걷는 중이면 그만큼 앞을 봐 둬서 뒤처지지 않게
  function slot(off) {
    const p = PL.f;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    const lead = 0;   // 따라가는 계산이 속도를 맞춰 줘서 앞질러 둘 필요가 없다
    const o = off || 0.85;
    return { x: p.pos.x + fx * lead + rx * o, z: p.pos.z + fz * lead + rz * o };
  }

  function placeNearHero() {
    for (const off of [0.9, -0.9, 1.6, -1.6]) {
      const s = slot(off);
      if (!PARK.blocked(s.x, s.z, 0.4)) { AL.f.pos.set(s.x, 0, s.z); AL.f.yaw = PL.f.yaw; return; }
    }
    AL.f.pos.set(PL.f.pos.x + 0.8, 0, PL.f.pos.z + 0.8);
  }

  function next(name) {
    const f = AL.f;
    if (!AL.tgt || AL.tgt.dead) return;
    FIGHT.attack(f, name, def(name), AL.tgt);
  }

  function nearestFoe() {
    // 기절한 상대가 있으면 그쪽부터 같이 때린다
    const st = ZONE.foes.find(o => o.state === 'stun' && !o.dead);
    if (st) return st;
    // 히로미는 에리를, 켄은 류지를 먼저 노린다 (체인지로 누가 옆에 있든)
    const rv = ZONE.rivals && ZONE.rivals[AL.f === T.hiromi ? 'eri' : 'ryuji'];
    if (rv && !rv.dead && !rv.gone) return rv;
    let best = null, bd = 1e9;
    for (const o of ZONE.foes) {
      if (o.dead) continue;
      const d = Math.hypot(o.pos.x - AL.f.pos.x, o.pos.z - AL.f.pos.z);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  function animMove(f) {
    if (f.state !== 'free' || f.air) return;
    const s = f.moveSpeed;
    if (s > 4.2) f.ch.play('run', 0.18, { speed: s / 5.6 });
    else if (s > 0.4) f.ch.play('walk', 0.18, { speed: Math.max(0.6, s / 2.0) });
    else f.ch.play(ZONE.active ? 'fightidle' : 'idle', 0.25);
  }

  function step(dt) {
    const f = AL.f; if (!f) return;
    // 쓰러지면 잠시 뒤 일어난다 (동료는 죽지 않는다)
    if (f.dead) {
      AL.reviveT -= dt;
      if (AL.reviveT <= 0) {
        f.dead = false; f.hp = Math.round(f.hpMax * 0.5);
        f.state = 'getup'; f.t = 0;
        f.ch.play('getup', 0.15, { force: true, once: true, speed: 2.1, at: f.ch.info.getup.rise });
      }
      FIGHT.step(f, dt);
      return;
    }
    if (PL.ride) { FIGHT.step(f, dt); return; }
    AL.cd -= dt; AL.retgt -= dt;
    const zn = ZONE.active;

    if (!zn) {
      AL.tgt = null;
      // 지금 서 있는 쪽(왼쪽/오른쪽)을 지킨다 — 나무에 막히면 반대쪽
      const p = PL.f, rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
      const sideNow = (f.pos.x - p.pos.x) * rx + (f.pos.z - p.pos.z) * rz;
      if (Math.abs(sideNow) > 0.3) AL.side = Math.sign(sideNow);
      AL.side = AL.side || 1;
      let s = slot(0.85 * AL.side);
      if (PARK.blocked(s.x, s.z, 0.35)) s = slot(-0.85 * AL.side);
      const dx = s.x - f.pos.x, dz = s.z - f.pos.z, d = Math.hypot(dx, dz);
      if (d > 35) { placeNearHero(); }
      else if (f.state === 'free') {
        const heroSp = p.moveSpeed;
        if (heroSp > 0.3) {
          // 주인공과 같은 방향·같은 속도로 가면서, 옆자리와 어긋난 만큼만 바로잡는다
          const vx = Math.sin(p.yaw) * heroSp + dx * 2.8, vz = Math.cos(p.yaw) * heroSp + dz * 2.8;
          FIGHT.locomote(f, vx, vz, Math.min(7.5, Math.hypot(vx, vz)), dt);
        } else if (d > 0.15) {
          FIGHT.locomote(f, dx, dz, U.clamp(d * 2.5, 0.8, 6.6), dt);
        } else {
          FIGHT.locomote(f, 0, 0, 0, dt, p.yaw);
        }
      }
      animMove(f);
      FIGHT.step(f, dt);
      return;
    }

    // ── 싸움 ──
    if (AL.retgt <= 0 || !AL.tgt || AL.tgt.dead || AL.tgt.gone) { AL.tgt = nearestFoe(); AL.retgt = 1.0; }
    else if (AL.tgt.state !== 'stun' && ZONE.foes.some(o => o.state === 'stun' && !o.dead)) { AL.tgt = nearestFoe(); AL.retgt = 1.0; }
    const t = AL.tgt;
    // 들어오는 주먹 피하기
    if (f.state === 'free' || (f.state === 'attack' && f.hitDone)) {
      for (const o of ZONE.foes) {
        if (o.dead || o.state !== 'attack' || AL.seen.has(o.atk)) continue;
        const dx = f.pos.x - o.pos.x, dz = f.pos.z - o.pos.z, d = Math.hypot(dx, dz);
        const far = o.atk.long ? 2.4 + o.lungeV * Math.max(0, o.atk.wind - o.t) : 2.4;
        if (d > far || o.t > o.atk.wind * 0.7) continue;
        const aim = Math.cos(Math.atan2(dx, dz) - o.yaw);
        if (aim < 0.8) continue;
        AL.seen.add(o.atk);
        if (Math.random() < (o.atk.heavy ? 0.7 : 0.4)) { if (f.state === 'attack') f.state = 'free'; FIGHT.dodge(f, -dz, dx); AL.queue.length = 0; }
        break;
      }
    }
    if (t && f.state === 'free') {
      const dx = t.pos.x - f.pos.x, dz = t.pos.z - f.pos.z, d = Math.hypot(dx, dz);
      const reach = 1.0 + t.r;
      if (d > reach) {
        const run = d > 4;
        FIGHT.locomote(f, dx, dz, run ? 5.4 : 2.6, dt);
      } else if (AL.cd <= 0 && t.state !== 'down' && t.state !== 'getup') {
        const pat = U.pick([['jab', 'cross', 'kick'], ['kick'], ['jab', 'kick'], ['jab', 'cross', 'hook']]);
        AL.cd = U.rand(1.0, 1.8);
        FIGHT.attack(f, pat[0], def(pat[0]), t);
        f.buffer = null;
        AL.queue = pat.slice(1);
      } else {
        FIGHT.locomote(f, 0, 0, 0, dt, Math.atan2(dx, dz));
      }
    } else if (!t && f.state === 'free') {
      // 상대가 없으면 주인공 곁으로
      const s = slot(0.9), dx = s.x - f.pos.x, dz = s.z - f.pos.z;
      FIGHT.locomote(f, dx, dz, Math.hypot(dx, dz) > 1 ? 3 : 0, dt);
    }
    // 이어치기: 앞 기술이 맞은 뒤 줄 세운 다음 기술
    if (f.state === 'attack' && f.hitDone && AL.queue.length && f.t > f.atk.wind + 0.08) {
      const n = AL.queue.shift();
      f.state = 'free';
      next(n);
    }
    // 구역 밖으로 못 나간다
    const ox = f.pos.x - zn.x, oz = f.pos.z - zn.z, od = Math.hypot(ox, oz);
    if (od > zn.r - 0.6) { f.pos.x = zn.x + ox / od * (zn.r - 0.6); f.pos.z = zn.z + oz / od * (zn.r - 0.6); }
    animMove(f);
    FIGHT.step(f, dt);
  }

  // 구역에 들어갈 때 멀리 있으면 옆으로 데려온다
  function enterZone(zn) {
    const f = AL.f;
    if (Math.hypot(f.pos.x - zn.x, f.pos.z - zn.z) > zn.r - 1) placeNearHero();
  }

  function cheer() {
    const f = AL.f;
    // 쓰러져 있었으면 조금만 채워 일으킨다 (다 채우지 않는다)
    if (f.dead) { f.dead = false; AL.reviveT = 0; f.hp = Math.max(f.hp, Math.round(f.hpMax * 0.35)); }
    f.state = 'win'; f.t = 0; AL.queue.length = 0;
    f.ch.play('victory', 0.2, { force: true, once: true });
    setTimeout(() => { if (f.state === 'win') f.state = 'free'; }, 2600);
  }

  Object.assign(AL, { spawn, reset, step, enterZone, cheer, placeNearHero });
  window.ALLY = AL;
})();
