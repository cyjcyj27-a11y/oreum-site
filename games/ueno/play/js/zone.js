// zone.js — 구역 싸움: 구역마다 류지·에리와 2대2로 다시 붙는다. 싸우기 전·후 대화
(function () {
  const Z = { active: null, foes: [], phase: null, endT: 0, rivals: {}, bossF: null };
  let scene;

  function init(sc) { scene = sc; paintFlags(); STORY.onCue = (cue, sp) => { if (cue === 'dance') startDance(sp); }; }
  function prepMaps() { }

  // 몇 번째 판인가 = 먹은 구역 개수 (마지막 분수 광장은 5번째)
  // 이야기가 장소마다 달라서 장소는 차례로 열린다: 사쿠라길 → 연못 → 도쇼궁 → 동물원 정문 → 분수 광장
  function chapterOf(zn) { return DATA.ZONES.indexOf(zn); }

  function available(zn) {
    if (T.taken[zn.id]) return false;
    const i = DATA.ZONES.indexOf(zn);
    if (!DATA.ZONES.slice(0, i).every(z => T.taken[z.id])) return false;
    // 장소 앞 퍼즐을 풀어야 열린다
    const pz = window.PUZ && PUZ.forGate(i);
    if (pz && !PUZ.solved(pz.id)) return false;
    // 마지막 장소는 공원 착한 일을 전부 끝내야 열린다 (고양이·스탬프·부적·쓰레기·강아지·비둘기, 9/14 사장님 "전부다 클리어해야 열리는거로")
    if (zn.final && !allDone()) return false;
    return true;
  }

  // 판마다 세진다 (체력은 사장님 요청으로 두 배 — 오래 싸우게)
  const RIVAL = {
    ryuji: { model: 'rboy', scale: 1.02, hp: [220, 280, 340, 400, 520], dmg: [12, 15, 17, 20, 24], poise: [40, 48, 56, 64, 80], brk: [130, 160, 190, 220, 270], prefer: 'hero' },
    eri:   { model: 'rgirl', scale: 0.88, hp: [180, 230, 280, 330, 420], dmg: [10, 12, 15, 17, 20], poise: [28, 34, 40, 46, 58], brk: [105, 130, 160, 190, 230], prefer: 'ally' },
  };

  function spawnRival(zn, key, ch, x, z) {
    const R = RIVAL[key];
    const f = FIGHT.create(scene, { team: 'foe', model: R.model, x, z, hp: R.hp[ch], dmg: R.dmg[ch], scale: R.scale, poise: R.poise[ch], brk: R.brk[ch], boss: true });
    f.key = key;
    f.ai = { mode: 'hover', t: 0, think: U.rand(0.2, 0.8), ring: U.rand(2.4, 3.6), side: key === 'eri' ? 1 : -1, cd: U.rand(0.8, 1.6), aggro: 1.0 + ch * 0.1, queue: [], plan: null, heat: 0 };
    f.onHit = (me, src, def, dmg) => {
      if (src === PL.f) PLAYER.landed(def, dmg);
      // 휘청였을 때만 공격이 늦춰진다 (버티고 맞은 주먹은 안 늦춘다)
      if (me.state === 'hit' || me.state === 'down') { me.ai.cd = Math.max(me.ai.cd, 0.3); me.ai.queue.length = 0; }
      me.ai.heat += 1; me.ai.heatBy = src;
      FX.num(me, dmg, def.react !== 'light' || me.state === 'stun');
      // 체력이 40% 아래로 떨어지면 화가 난다: 더 자주, 더 빨리
      if (!me.rage && !me.dead && me.hp < me.hpMax * 0.4) {
        me.rage = true; me.rageT = 0.8; me.ai.aggro *= 1.35;
        AUD.sfx('rage');
      }
    };
    f.onKO = me => onKO(me, zn);
    Z.foes.push(f); Z.rivals[key] = f;
    return f;
  }

  function onKO(f, zn) {
    AUD.sfx('ko');
    FX.coins(f.pos, 3, 5);   // 🪙15 × 2명 = 싸움 한 번 🪙30
    const alive = Z.foes.filter(o => !o.dead).length;
    if (alive === 0) { T.slow = 0.22; T.slowT = 1.4; FX.banner('K.O.', 1.4); }
    else { T.stopT = 0.1; }
    HUD.boss(bossBars());
  }

  function bossBars() { return Z.foes.filter(o => !o.dead).map(o => ({ name: STORY.NAME[o.key], f: o })); }
  function speakers() { return { ken: T.ken, hiromi: T.hiromi, ryuji: Z.rivals.ryuji, eri: Z.rivals.eri }; }

  // ── 구역 들어가기: 둘이 앞에 서 있고, 대화 → 싸움 ──
  function enter(zn) {
    const ch = chapterOf(zn);
    Z.active = zn; Z.ch = ch; Z.phase = 'pre'; Z.endT = 0; Z.rivals = {};
    PARK.zm[zn.id].wall.material.opacity = 0.12;
    FX.banner(zn.name, 1.6);
    ALLY.enterZone(zn);
    AUD.sfx('bell');
    // 주인공이 들어온 쪽의 반대편, 구역 가운데 너머에 선다
    const hx = PL.f.pos.x - zn.x, hz = PL.f.pos.z - zn.z, hd = Math.hypot(hx, hz) || 1;
    const fx = -hx / hd, fz = -hz / hd;                          // 주인공 → 가운데 방향
    let cx = PL.f.pos.x + fx * 5.5, cz = PL.f.pos.z + fz * 5.5;
    for (let k = 0; k < 8 && PARK.blocked(cx, cz, 0.8); k++) { cx = (cx + zn.x) / 2; cz = (cz + zn.z) / 2; }
    const sx = -fz, sz = fx;                                     // 옆
    const ry = spawnRival(zn, 'ryuji', ch, cx - sx * 1.0, cz - sz * 1.0);
    const er = spawnRival(zn, 'eri', ch, cx + sx * 1.0, cz + sz * 1.0);
    const faceHero = Math.atan2(PL.f.pos.x - cx, PL.f.pos.z - cz);
    ry.yaw = er.yaw = faceHero; ry.ch.holder.rotation.y = er.ch.holder.rotation.y = faceHero;
    PL.f.yaw = Math.atan2(fx, fz); ALLY.f.yaw = PL.f.yaw;
    PL.f.moveSpeed = 0; PL.f.ch.play('fightidle', 0.2, { force: true });
    ALLY.f.ch.play('fightidle', 0.2, { force: true });
    T.seen = T.seen || {};
    const key = 'pre' + ch;
    if (!T.seen[key]) {
      T.seen[key] = true;
      setTimeout(() => STORY.play(STORY.LINES.pre[ch], speakers(), startFight), 900);
      T.mode = 'talk'; T.prevMode = 'play';   // 대화 시작 전에도 못 움직이게
    } else startFight();
  }

  function startFight() {
    if (!Z.active) return;
    Z.phase = 'fight';
    JOY.begin(Z.active);
    FX.banner('FIGHT', 1.0);
    AUD.fight(true);
    HUD.boss(bossBars());
  }

  function clear(zn) {
    T.taken[zn.id] = true;
    Z.active = null; Z.phase = null;
    PARK.zm[zn.id].wall.material.opacity = 0;
    paintFlags();
    // 체력은 채워 주지 않는다 — 깎인 채로 다음 곳까지 가고, 자판기·딸기우유로 채운다
    AUD.fight(false); AUD.sfx('clear');
    PL.f.state = 'win'; PL.f.t = 0; PL.f.ch.play('victory', 0.2, { force: true, once: true });
    ALLY.cheer();
    setTimeout(() => { if (PL.f.state === 'win') PL.f.state = 'free'; }, 2600);
    U.save();
    if (zn.final) setTimeout(() => GAME.win(), 4400);   // 등급 도장을 보고 나서
    JOY.finish(zn);
    if (!zn.final) FX.banner('CLEAR', 2.0);
  }

  function paintFlags() {
    for (const zn of DATA.ZONES) {
      const m = PARK.zm && PARK.zm[zn.id]; if (!m) continue;
      const got = !!T.taken[zn.id];
      m.flagM.color.set(got ? 0xf2c230 : zn.band);
      m.ring.material.color.set(got ? 0xf2c230 : zn.band);
      m.ring.material.opacity = got ? 0.25 : (available(zn) ? 0.6 : 0.22);
      if (m.lock) m.lock.visible = !got && !available(zn);
    }
    if (PARK.openTape) PARK.openTape(!!(window.PUZ && PUZ.solved('fount')));
  }

  // ── 상대 머리: 류지는 켄, 에리는 히로미를 먼저 노린다 ──
  function think(f, dt, zn) {
    const ai = f.ai;
    ai.t += dt; ai.cd -= dt; ai.think -= dt;
    const want = RIVAL[f.key].prefer === 'ally' ? T.hiromi : T.ken;
    const other = want === T.ken ? T.hiromi : T.ken;
    let hero = !want.dead ? want : other;
    // 짝이 기절하거나 누우면 조작 중인 사람에게 달려들어 떼어 낸다
    const buddy = Z.foes.find(o => o !== f && !o.dead);
    const rescue = buddy && (buddy.state === 'stun' || buddy.state === 'down') && !PL.f.dead;
    if (rescue) { hero = PL.f; if (!ai.rescue) { ai.rescue = true; ai.cd = Math.min(ai.cd, 0.35); ai.plan = null; } }
    else ai.rescue = false;
    const dx = hero.pos.x - f.pos.x, dz = hero.pos.z - f.pos.z, d = Math.hypot(dx, dz);
    const reach = 1.2 * f.scale + hero.r;
    // 몰매: 짧은 사이에 여러 대 맞으면 뒤로 빠져나와 곧장 되받아친다 (마구 누르기만으론 못 이기게)
    ai.heat = Math.max(0, ai.heat - dt * 1.2);
    const heatMax = Math.max(3, 5.5 - Z.ch * 0.5 - (f.rage ? 1 : 0));
    if (ai.heat >= heatMax && (f.state === 'free' || (f.state === 'hit' && f.t > 0.12))) {
      const src = ai.heatBy || hero;
      const ax = f.pos.x - src.pos.x, az = f.pos.z - src.pos.z;
      f.state = 'free';
      FIGHT.dodge(f, ax + (Math.random() - 0.5), az + (Math.random() - 0.5));
      f.inv = 0.4;
      ai.heat = 0; ai.cd = 0.3; ai.queue.length = 0;
      const lp = DATA.FOE_PAT[f.key].find(p => DATA.FOE_ATK[p[0][0]].long && p[1] <= Z.ch);
      ai.plan = lp && Math.random() < 0.5 ? [lp[0][0]] : ['hook'];
      return;
    }
    // 주먹 읽기: 들어오는 기술을 가끔 옆으로 피하고 바로 받아친다
    if (f.state === 'free' && ai.readT <= 0) {
      for (const h of [T.ken, T.hiromi]) {
        if (h.dead || h.state !== 'attack' || h.hitDone || !h.atk || h.atk === ai.readAtk) continue;
        const hx = f.pos.x - h.pos.x, hz = f.pos.z - h.pos.z, hd = Math.hypot(hx, hz);
        if (hd > h.atk.range + 1.2 || Math.cos(Math.atan2(hx, hz) - h.yaw) < 0.6) continue;
        ai.readAtk = h.atk; ai.readT = 0.6;
        if (Math.random() < 0.06 + Z.ch * 0.05 + (f.rage ? 0.1 : 0)) {
          const side = Math.random() < 0.5 ? 1 : -1;
          FIGHT.dodge(f, -hz / hd * side, hx / hd * side);
          ai.cd = 0.15; ai.plan = ['jab', 'hook']; ai.queue.length = 0;
          return;
        }
        break;
      }
    }
    ai.readT = (ai.readT || 0) - dt;
    // 켄·히로미를 눕히면 그 자리에서 약 올린다 (때리면 복수)
    if (f.state === 'attack' && f.hitDone && f.hits && !ai.gloat && [T.ken, T.hiromi].some(h => (h.state === 'down' || h.dead) && Math.hypot(h.pos.x - f.pos.x, h.pos.z - f.pos.z) < 3.5)) {
      ai.gloat = true;
      if (Math.random() < 0.65) { ai.queue.length = 0; ai.tauntNext = true; }
    }
    if (f.state !== 'attack') ai.gloat = false;
    if (f.state === 'free' && ai.tauntNext) { ai.tauntNext = false; taunt(f); return; }
    // 연속기: 앞 기술이 끝나면 줄 선 다음 기술. 맞혔으면 잠깐 틈을 줘서 피할 수 있게
    if (f.state === 'attack' && f.hitDone && ai.queue.length) {
      const gap = f.hits ? 0.5 : 0.14;
      if (f.t > f.atk.wind + gap) {
        if (hero.dead || d > reach + 1.4) { ai.queue.length = 0; return; }
        f.state = 'free';
        foeAttack(f, ai.queue.shift(), hero, 0.8);
      }
      return;
    }
    if (f.state !== 'free') return;
    const face = Math.atan2(dx, dz);
    if (hero.dead) { FIGHT.locomote(f, 0, 0, 0, dt, face); f.ch.play('taunt', 0.2); return; }

    if (ai.cd <= 0) {
      // 무엇을 할지 한 번 정한다
      if (!ai.plan) {
        const pool = DATA.FOE_PAT[f.key].filter(p => p[1] <= Z.ch).map(p => p[0]);
        ai.plan = U.pick(pool).slice();
        if (f.rage && ai.plan.length < 4 && !DATA.FOE_ATK[ai.plan[0]].long) ai.plan.unshift('jab');
      }
      const long = DATA.FOE_ATK[ai.plan[0]].long;
      if (long && d < 3.0) {
        // 너무 가까우면 뒤로 물러나 거리를 벌린다
        FIGHT.locomote(f, -dx, -dz, 3.2, dt, face);
        f.ch.play('walk', 0.15, { speed: 1.2 });
        ai.backT = (ai.backT || 0) + dt;
        if (ai.backT > 1.2) { ai.plan = ['jab', 'hook']; ai.backT = 0; }
      } else if (long ? d > 6.5 : d > reach) {
        const run = d > 4.5;
        FIGHT.locomote(f, dx, dz, run ? 5.0 : 3.0, dt);
        f.ch.play(run ? 'run' : 'walk', 0.15, { speed: run ? 0.9 : 1.2 });
      } else {
        const plan = ai.plan; ai.plan = null; ai.backT = 0;
        foeAttack(f, plan[0], hero, 1);
        ai.queue = plan.slice(1);
        ai.cd = U.rand(0.7, 1.4) / ai.aggro + plan.length * 0.2;
      }
      return;
    }
    // 틈을 노리며 둘레를 돈다
    if (ai.think <= 0) {
      ai.think = U.rand(0.8, 1.8);
      ai.ring = U.rand(2.2, 3.6);
      if (Math.random() < 0.3) ai.side = -ai.side;
      if (Math.random() < 0.1 && d < 6) { taunt(f); return; }
    }
    let mx = 0, mz = 0;
    if (d > ai.ring + 0.6) { mx = dx; mz = dz; } else if (d < ai.ring - 0.6) { mx = -dx; mz = -dz; }
    const tx = -dz / (d || 1) * ai.side, tz = dx / (d || 1) * ai.side;
    mx = mx / (d || 1) + tx * 0.8; mz = mz / (d || 1) + tz * 0.8;
    const ox = f.pos.x - zn.x, oz = f.pos.z - zn.z, od = Math.hypot(ox, oz);
    if (od > zn.r - 1.5) { mx -= ox / od * 1.5; mz -= oz / od * 1.5; }
    if (Math.hypot(mx, mz) > 0.25) FIGHT.locomote(f, mx, mz, d >= 7 ? 2.4 : 0.9, dt, d >= 7 ? null : face);
    else FIGHT.locomote(f, 0, 0, 0, dt, face);
    f.ch.play(d >= 7 ? 'walk' : 'fightidle', 0.25);
  }

  // 상대 기술 하나: 장이 오를수록, 화가 날수록 빨라진다. k = 연속기 뒤쪽은 조금 더 빠르게
  function foeAttack(f, name, hero, k) {
    const base = DATA.FOE_ATK[name];
    const sp = (0.86 - Z.ch * 0.035) * (f.rage ? 0.9 : 1) * (base.long ? 1 : k);
    const def = Object.assign({}, base, { wind: base.wind * sp });
    return FIGHT.attack(f, name, def, hero);
  }

  function taunt(f) {
    f.state = 'taunt'; f.t = 0;
    f.ch.play('taunt', 0.15, { force: true, once: true });
    AUD.sfx('nyah');
  }

  // ── 매 프레임 ──
  function update(dt) {
    const hero = PL.f;
    if (!Z.active && Z.foes.length) {
      // 떠나는 두 사람
      for (const f of Z.foes.slice()) {
        FIGHT.step(f, dt);
        if (f.leaving) {
          const ox = f.pos.x - f.leaving.x, oz = f.pos.z - f.leaving.z, od = Math.hypot(ox, oz) || 1;
          FIGHT.locomote(f, ox / od, oz / od, 5.5, dt); f.ch.play('run', 0.15);
          if (f.t > 1.6) { FX.poof(f.pos); FIGHT.remove(f); Z.foes.splice(Z.foes.indexOf(f), 1); }
        }
      }
    }
    if (!Z.active) {
      if (T.mode !== 'play' || hero.dead) return;
      // 막힌 띠에 닿으면 먼저 갈 곳 이름을 띄운다
      Z.lockT = (Z.lockT || 0) - dt;
      if (PARK.tape && Z.lockT <= 0 && Math.abs(Math.hypot(hero.pos.x - PARK.tape.x, hero.pos.z - PARK.tape.z) - PARK.tape.r) < 1.3) {
        const nt = nextTarget(); if (nt) { FX.banner('🔒 ' + nt.zn.name + ' ➤', 1.4); AUD.sfx('deny'); }
        Z.lockT = 3;
      }
      if (PL.ride) return;   // 오리배 위에서는 싸움이 안 붙는다
      // 분수 광장에 들어왔는데 남은 일이 있으면 무엇이 몇 개 남았는지 띄운다
      const fin = DATA.ZONES.find(z => z.final);
      if (!T.taken[fin.id] && !allDone() && Z.lockT <= 0 && Math.hypot(hero.pos.x - fin.x, hero.pos.z - fin.z) < fin.r - 1.2
        && DATA.ZONES.every(z => z.final || T.taken[z.id])) {
        FX.banner('🔒 ' + missions().filter(m => m.n < m.all).map(m => m.icon + ' ' + m.n + '/' + m.all).join('  '), 2.2); AUD.sfx('deny');
        Z.lockT = 4;
      }
      for (const zn of DATA.ZONES) {
        if (!available(zn)) continue;
        if (Math.hypot(hero.pos.x - zn.x, hero.pos.z - zn.z) < zn.r - 1.2) { enter(zn); break; }
      }
      return;
    }
    const zn = Z.active;
    const ox = hero.pos.x - zn.x, oz = hero.pos.z - zn.z, od = Math.hypot(ox, oz);
    if (od > zn.r - 0.6) { hero.pos.x = zn.x + ox / od * (zn.r - 0.6); hero.pos.z = zn.z + oz / od * (zn.r - 0.6); }

    if (Z.phase === 'fight') {
      for (const f of Z.foes) { if (!f.dead) think(f, dt, zn); FIGHT.step(f, dt); }
      if (Z.foes.every(o => o.dead) && !hero.dead) {
        Z.endT += dt;
        if (Z.endT > 1.8) afterFight(zn);
      }
    } else {
      for (const f of Z.foes) FIGHT.step(f, dt);
    }
  }

  // 둘 다 눕히면: 일어나서 한마디 → 떠난다 → 구역 먹기
  function afterFight(zn) {
    Z.phase = 'post';
    AUD.fight(false);
    HUD.boss(null);
    for (const f of Z.foes) {
      f.dead = false; f.hp = 1; f.inv = 999; f.state = 'getup'; f.t = 0; f.push.set(0, 0, 0); f.air = false; f.y = 0; f.vy = 0;
      f.ch.play('getup', 0.15, { force: true, once: true, speed: 2.1, at: f.ch.info.getup.rise });
    }
    const ch = Z.ch;
    setTimeout(() => {
      if (!Z.active) return;
      for (const f of Z.foes) f.yaw = Math.atan2(PL.f.pos.x - f.pos.x, PL.f.pos.z - f.pos.z);
      PL.f.yaw = Math.atan2(Z.foes[0].pos.x - PL.f.pos.x, Z.foes[0].pos.z - PL.f.pos.z);
      STORY.play(STORY.LINES.post[ch], speakers(), () => {
        for (const f of [T.ken, T.hiromi]) if (f.state === 'dance' || f.state === 'watch') f.state = 'free';
        for (const f of Z.foes) { f.leaving = { x: PL.f.pos.x, z: PL.f.pos.z }; f.t = 0; f.state = 'free'; }
        clear(zn);
      });
    }, 1300);
  }

  // 엔딩 춤 (9/14): 대본의 춤 줄이 나오면 히로미가 분수 앞에서 추고, 에리가 한 박자 늦게 옆에서 따라 춘다. 켄·류지는 구경
  function startDance(sp) {
    const h = sp.hiromi, e = sp.eri, k = sp.ken, r = sp.ryuji;
    if (!h || !e || !e.ch.acts.dance) return;
    const hClip = h.ch.acts.dance_h ? 'dance_h' : 'dance';   // 히로미는 제 뼈대로 받은 춤
    const fin = DATA.ZONES.find(z => z.final);
    let dx = k.pos.x - fin.x, dz = k.pos.z - fin.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const cx = fin.x + dx * 10.5, cz = fin.z + dz * 10.5, sx = -dz, sz = dx;
    const face = Math.atan2(dx, dz);   // 켄·류지 쪽을 보고 춘다
    [[h, -0.9], [e, 0.9]].forEach(([f, o]) => {
      f.pos.set(cx + sx * o, 0, cz + sz * o); f.yaw = face; f.ch.holder.rotation.y = face;
      f.state = 'dance'; f.t = 0; f.atk = null; f.push.set(0, 0, 0);
    });
    h.ch.play(hClip, 0.3, { force: true });
    e.ch.play('idle', 0.2, { force: true });
    setTimeout(() => { if (e.state === 'dance') e.ch.play('dance', 0.35, { force: true }); }, 900);
    // 켄·류지는 춤추는 둘 앞에 나란히 서서 본다
    [[k, -1.6], [r, 1.6]].forEach(([f, o]) => {
      if (!f) return;
      f.pos.set(cx + dx * 3.6 + sx * o, 0, cz + dz * 3.6 + sz * o);
      f.yaw = face + Math.PI; f.ch.holder.rotation.y = f.yaw;
      f.state = 'watch'; f.t = 0; f.ch.play('idle', 0.3, { force: true });
    });
    CAM.talk = { center: { x: cx, z: cz }, yaw: face };
    CAM.focus = null;
    AUD.fight(true);   // 신나는 곡으로
  }

  // 지고 나서 다시: 구역을 비우고 바깥에 세운다 (다시 들어가면 대화 없이 바로 싸움)
  function retreat() {
    const zn = Z.active;
    JOY.abort();
    for (const f of Z.foes) FIGHT.remove(f);
    Z.foes.length = 0; Z.rivals = {}; HUD.boss(null); Z.phase = null;
    if (zn) {
      PARK.zm[zn.id].wall.material.opacity = 0;
      const hx = PL.f.pos.x - zn.x, hz = PL.f.pos.z - zn.z, hd = Math.hypot(hx, hz) || 1;
      let x = zn.x + hx / hd * (zn.r + 3), z = zn.z + hz / hd * (zn.r + 3);
      for (let k = 0; k < 16 && PARK.blocked(x, z, 0.6); k++) { const a = Math.atan2(hz, hx) + k * 0.4; x = zn.x + Math.cos(a) * (zn.r + 3); z = zn.z + Math.sin(a) * (zn.r + 3); }
      PLAYER.reset(x, z, Math.atan2(zn.x - x, zn.z - z) + Math.PI);
      ALLY.reset(x, z, PL.f.yaw); ALLY.placeNearHero();
    }
    Z.active = null;
    AUD.fight(false);
  }

  // 공원 착한 일 목록: 아이콘, 한 개수, 전체 (자리는 알려 주지 않는다)
  function missions() {
    const J = window.JOY, P = window.PETS; if (!J) return [];
    const got = (arr, done) => arr.filter(done).length;
    const list = [
      { icon: '🐱', n: J.count(), all: J.cats.length },
      { icon: '🔖', n: got(J.stamps, s => s.got), all: J.stamps.length },
      { icon: '🧧', n: got(J.charms, c => c.got), all: J.charms.length },
      { icon: '🗑', n: got(J.trash, t => t.got), all: J.trash.length },
    ];
    if (P && P.pups.length) {
      list.push({ icon: '🐶', n: P.countDogs(), all: P.pups.length });
      list.push({ icon: '🕊', n: P.countPigeons(), all: P.flocks.length });
    }
    return list;
  }
  const allDone = () => !!T.testFin || missions().every(m => m.n >= m.all);
  // 착한 일 하나를 끝낼 때마다: 지도 자물쇠를 다시 칠하고, 이걸로 마지막 장소가 열렸으면 이름을 한 번 띄운다
  function missionDone() {
    paintFlags();
    const fin = DATA.ZONES.find(z => z.final);
    if (Z.finOpen || T.taken[fin.id] || !available(fin)) return;
    Z.finOpen = true;
    setTimeout(() => { FX.banner(fin.name, 1.8); AUD.sfx('bell'); }, 3200);
  }

  // 다음 갈 곳: 아직 안 먹은 첫 장소. 그 앞 퍼즐이 남았으면 퍼즐 자리
  function nextTarget() {
    const g = DATA.ZONES.findIndex(z => !T.taken[z.id]);
    if (g < 0) return null;
    const spot = window.PUZ && PUZ.spotFor(g);
    if (spot) return { zn: spot, d: Math.hypot(spot.x - PL.f.pos.x, spot.z - PL.f.pos.z), puz: spot.puz };
    // 착한 일(고양이·강아지·줍기…)의 자리는 가리키지 않는다 — 너무 힌트라서 (9/14 사장님). 화살표는 분수 광장까지만, 남은 개수는 광장에서 🔒 로 보여 준다
    const t = DATA.ZONES[g];
    return { zn: t, d: Math.hypot(t.x - PL.f.pos.x, t.z - PL.f.pos.z) };
  }

  Object.assign(Z, { prepMaps, init, update, retreat, nextTarget, paintFlags, available, enter, chapterOf, missions, missionDone });
  window.ZONE = Z;
})();
