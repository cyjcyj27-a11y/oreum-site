// 벌 무리: 날기·먹이 오가기·덤비기·쏘기·떨어지기·땅에 쌓이기, 그리고 벌집(기세·안에 남은 벌·숨김).
(function () {
  const B = (window.BEES = {});
  const MAX = 300;
  const list = [], nests = [];
  let P = null, scene = null;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  B.list = list; B.nests = nests;

  B.init = function (sc) {
    scene = sc; P = ACT.waspParts(MAX);
    Object.values(P).forEach((m) => sc.add(m));
    // 부품마다 몸 기준 자리(앞 = +z)
    const L = (x, y, z, rx, ry, rz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(1, 1, 1));
    B.local = { abd: L(0, 0, -0.1, 0.35), tho: L(0, 0, 0), head: L(0, 0.005, 0.055), eyeL: L(-0.022, 0.012, 0.07), eyeR: L(0.022, 0.012, 0.07) };
    B.wingUp = [L(-0.04, 0.035, 0, 0, 0, 0.75), L(0.04, 0.035, 0, 0, 0, -0.75)];
    B.wingDn = [L(-0.04, 0.03, 0, 0, 0, -0.25), L(0.04, 0.03, 0, 0, 0, 0.25)];
    B.wingRest = [L(-0.03, 0.03, -0.03, 0, 0.5, 0.05), L(0.03, 0.03, -0.03, 0, -0.5, -0.05)];
  };
  B.reset = function () {
    list.length = 0;
    nests.forEach((n) => { if (n.group.parent) n.group.parent.remove(n.group); if (n.hole && n.hole.parent) n.hole.parent.remove(n.hole); });
    nests.length = 0;
    Object.values(P).forEach((m) => { m.count = 0; });
  };

  // ---------- 벌집 ----------
  B.addNest = function (spec, spot, world) {
    const sp = DATA.SP[spec.sp], size = spec.size;
    const kind = spot.kind === 'ground' || sp.nest === 'ground' ? 'ground' : sp.nest;
    let k = kind;
    if (spec.sp === 'jangsu' && spot.kind !== 'ground') k = 'ball';
    const g = ACT.nest(k === 'queen' ? 'queen' : k, k === 'comb' ? size * 1.6 : size);
    g.position.copy(spot.p);
    if (spot.ry) g.rotation.y = spot.ry;
    scene.add(g);
    const n = { spec, sp, spot, kind: k, size, group: g, vigor: 1, reserve: spec.n, alarm: 0, emitT: Math.random(), hidden: spec.hidden, found: !spec.hidden, removed: false, shake: 0, id: nests.length, bagT: 0 };
    // 가운데·드나드는 구멍
    if (k === 'ball' || k === 'queen') { n.c = spot.p.clone().add(new THREE.Vector3(0, -0.4 * size, 0)); n.door = spot.p.clone().add(new THREE.Vector3(0, -0.82 * size, 0)); }
    else if (k === 'comb') { n.c = spot.p.clone().add(new THREE.Vector3(0, -0.2, 0)); n.door = spot.p.clone().add(new THREE.Vector3(0, -0.3, 0)); }
    else if (k === 'ground') { n.c = spot.p.clone().add(new THREE.Vector3(0, 0.1, 0)); n.door = spot.p.clone().add(new THREE.Vector3(0.05, 0.15, 0.2)); }
    else { n.c = spot.p.clone().add(new THREE.Vector3(0, -0.3, 0)); n.door = n.c.clone(); }
    if (spot.hole) n.door = spot.hole.clone();
    if (n.hidden) {
      g.visible = false;
      // 숨은 집: 구멍만 보인다(처마 틈·땅 구멍·나무 구멍)
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.1 * Math.max(1, size * 0.8), 14), CLAY.mat('#120a05', { rough: 0.95 }));
      hole.position.copy(n.door);
      if (spot.holeN) hole.lookAt(tmp.copy(n.door).add(spot.holeN)); else if (k === 'ground' || spot.kind === 'ground') { hole.rotation.x = -Math.PI / 2; hole.position.y = 0.06; } else hole.rotation.x = Math.PI / 2;
      scene.add(hole); n.hole = hole;
    }
    nests.push(n);
    // 처음부터 바깥에 몇 마리
    const out = spec.sp === 'honey' ? 0 : Math.min(spec.n, Math.ceil(spec.n * (n.hidden ? 0.25 : 0.35)));
    for (let i = 0; i < out; i++) { spawn(n, n.hidden ? 'forage' : 'idle', true); n.reserve--; }
    if (spec.sp === 'honey') for (let i = 0; i < 26; i++) spawn(n, 'idle', true);
    return n;
  };

  function spawn(n, state, scatter) {
    if (list.length >= MAX) { const k = list.findIndex((x) => x.dead); if (k < 0) return null; list.splice(k, 1); }
    const sk = state === 'queen' ? 'queen' : n.spec.sp === 'queen' ? 'jangsu' : n.spec.sp;
    const sp = DATA.SP[sk];
    if (state === 'queen') state = 'attack';
    const a = {
      n, sp, sk, p: (scatter ? n.c.clone().add(tmp.set((Math.random() - 0.5) * 1.6, (Math.random() - 0.3) * 0.8, (Math.random() - 0.5) * 1.6)) : n.door.clone()),
      v: new THREE.Vector3(), hp: 1, state, t: Math.random() * 10, cd: 0, ang: Math.random() * 6.28, r: 0.5 + Math.random() * 0.9 * n.size, h: (Math.random() - 0.4) * 0.6,
      yaw: 0, pitch: 0, roll: 0, spin: 0, fp: null, fpT: 0, alive: true, dead: false, phase: Math.random() * 6.28, twitch: 0, s: sp.size * 1.15 * (0.92 + Math.random() * 0.16),
    };
    if (state === 'forage') pickFood(a);
    list.push(a);
    return a;
  }
  function pickFood(a) {
    const F = B.food;
    if (F && F.length) { const f = F[(Math.random() * F.length) | 0]; a.fp = f.clone().add(tmp.set((Math.random() - 0.5) * 1.2, Math.random() * 0.5, (Math.random() - 0.5) * 1.2)); }
    else { const ang = Math.random() * 6.28, d = 6 + Math.random() * 6; a.fp = a.n.c.clone().add(tmp.set(Math.cos(ang) * d, 0, Math.sin(ang) * d)); a.fp.y = 0.6 + Math.random(); }
    a.fpT = 0; a.leg = 0;
  }

  // ---------- 한 틀 ----------
  // ctx: hero(Vector3 발), chest, spray {on, o, d, range, cos, power}, onSting(dmg, a), onKill(a), onHoneyKill(a), bounds
  B.update = function (dt, ctx) {
    const hero = ctx.chest;
    // 벌집
    nests.forEach((n) => {
      if (n.removed) return;
      const dist = tmp.copy(hero).sub(n.c).length();
      if (n.sp.rage > 0 && dist < n.sp.rage * (0.8 + n.size * 0.25) * (1.15 + 0.25 * (B.hard || 0))) n.alarm = Math.min(1, n.alarm + dt * 0.7); else n.alarm = Math.max(0, n.alarm - dt * 0.08);
      // 숨은 집: 가까이 가면 발견
      if (!n.found && Math.hypot(hero.x - n.door.x, hero.z - n.door.z) < 2.8) { n.found = true; n.group.visible = true; n.popT = 0; if (ctx.onFound) ctx.onFound(n); n.alarm = 1; }
      if (n.popT != null && n.popT < 1) { n.popT = Math.min(1, n.popT + dt * 3); const s = 1 + Math.sin(n.popT * Math.PI) * 0.25; n.group.scale.setScalar(Math.max(0.01, n.popT) * s); }
      // 여왕: 기세가 절반 아래면 한 번 튀어나옴
      if (n.spec.sp === 'queen' && !n.queenOut && n.vigor < 0.5) { n.queenOut = true; const q = spawn(n, 'queen'); if (q) { q.s = DATA.SP.queen.size * 1.15; n.queen = q; if (ctx.onQueen) ctx.onQueen(q); } }
      // 벌 내보내기
      n.emitT -= dt;
      if (n.reserve > 0 && n.emitT <= 0 && n.sp.rage > 0) {
        const angry = n.alarm > 0.5;
        n.emitT = angry ? (0.6 - 0.2 * (B.hard || 0)) / (1 + (1 - n.vigor) * 1.2) : (n.hidden && !n.found ? 1.6 : 3.5);
        const flying = list.reduce((c, a) => c + (a.alive && a.n === n ? 1 : 0), 0);
        if (flying < (angry ? 8 + n.size * 4 : 8)) { spawn(n, angry ? 'attack' : (n.hidden && !n.found ? 'forage' : (Math.random() < 0.4 ? 'forage' : 'idle'))); n.reserve--; }
      }
      // 흔들림
      if (n.shake > 0) { n.shake = Math.max(0, n.shake - dt * 2); n.group.rotation.z = Math.sin(performance.now() * 0.05) * 0.08 * n.shake; n.group.rotation.x = Math.cos(performance.now() * 0.043) * 0.06 * n.shake; }
    });
    // 스프레이가 벌집에 닿나
    const S = ctx.spray;
    for (let i = 0; i < mist.length; i++) if (mist[i].life > 0) { mist[i].life -= dt; mist[i].r += dt * 0.4; }
    if (S.on) addMist(S, dt);
    if (S.on) nests.forEach((n) => {
      if (n.removed || !n.found) return;
      if (inCone(n.c, S, 0.3 * n.size)) {
        const k = (n.spec.sp === 'queen' ? 0.09 : 0.28 / n.size) * (0.55 - 0.25 * (B.hard || 0)); // 난이도: 뒤 출동일수록 벌집이 오래 버팀
        n.vigor = Math.max(0, n.vigor - dt * S.power * k);
        n.alarm = 1; n.shake = 1;
        if (!n.burst && n.spec.sp !== 'honey') { // 처음 맞으면 벌이 한꺼번에 사방으로 튀어나옴
          n.burst = true;
          const m = Math.min(n.reserve, 4 + Math.round((B.hard || 0) * 6));
          for (let j = 0; j < m; j++) { const b = spawn(n, 'attack'); if (!b) break; const an = Math.random() * 6.28; b.p.copy(n.c).add(tmp.set(Math.cos(an) * 1.6, 0.3 + Math.random() * 0.6, Math.sin(an) * 1.6)); n.reserve--; }
        }
        if (n.spec.sp === 'honey' && ctx.onHoneyHit) ctx.onHoneyHit(n);
      }
    });
    // 벌
    B.time = (B.time || 0) + dt;
    B.allGone = nests.length > 0 && nests.every((n) => n.removed || n.spec.sp === 'honey');
    B._divers = 0; for (let i = 0; i < list.length; i++) if (list[i].alive && list[i].sub === 'dive') B._divers++;
    let cnt = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const a = list[i];
      a.t += dt; a.cd -= dt;
      if (a.dead) { stepDead(a, dt); continue; }
      if (!a.alive) { list.splice(i, 1); continue; }
      const sp = a.sp, n = a.n;
      // 스프레이 맞음
      // 스프레이: 원뿔 안이면 세게, 남아 있는 안개 속이면 조금
      let hitK = 0;
      if (S.on && inCone(a.p, S, 0.18)) hitK = 1;
      else if (inMist(a.p)) hitK = 0.55;
      if (hitK > 0) {
        a.hp -= dt * hitK * S.power / Math.max(0.05, sp.hp * (1.6 + 1.2 * (B.hard || 0))); // 난이도: 뒤 출동일수록 조금 더 버팀
        if (a.state !== 'attack' && sp.rage > 0) { a.state = 'attack'; a.provoked = true; if (!n.removed) n.alarm = 1; }
        if (a.hp <= 0) { kill(a, ctx); continue; }
        a.wob = 0.9; // 비틀거리며 느려짐
      }
      a.wob = Math.max(0, (a.wob || 0) - dt);
      // 상태
      let tx, ty, tz, spd = sp.spd;
      if (n.removed && a.state !== 'attack') a.state = 'lost';
      if (a.state === 'lost' && B.allGone && Math.random() < dt * 0.05) { a.alive = false; continue; } // 하나둘 떠나감
      if (a.state === 'idle') {
        a.ang += dt * (0.8 + (a.phase % 1)) * (a.phase > 3 ? 1 : -1);
        tx = n.c.x + Math.cos(a.ang) * a.r; tz = n.c.z + Math.sin(a.ang) * a.r; ty = n.c.y + a.h + Math.sin(a.t * 1.7 + a.phase) * 0.2;
        spd *= 0.55;
        if (n.alarm > 0.5 && sp.rage > 0) a.state = 'attack';
        else if (sp.rage > 0 && Math.random() < dt * 0.04) { a.state = 'forage'; pickFood(a); }
        if (sp.rage === 0) { tx = n.c.x + Math.cos(a.ang) * 0.3; tz = n.c.z + Math.sin(a.ang) * 0.3; ty = n.c.y + Math.sin(a.t * 3 + a.phase) * 0.25; spd = 0.8; }
      } else if (a.state === 'forage') {
        // 먹이 자리까지 갔다가 잠깐 머물고 구멍으로 돌아감(숨은 집 추적의 단서)
        if (a.leg === 0) { tx = a.fp.x; ty = a.fp.y; tz = a.fp.z; if (tmp.set(tx, ty, tz).distanceTo(a.p) < 0.4) { a.leg = 1; a.fpT = 1 + Math.random() * 1.5; } }
        else if (a.leg === 1) { a.fpT -= dt; tx = a.fp.x + Math.sin(a.t * 3) * 0.25; ty = a.fp.y + Math.sin(a.t * 5) * 0.1; tz = a.fp.z + Math.cos(a.t * 3) * 0.25; spd *= 0.4; if (a.fpT <= 0) a.leg = 2; }
        else { tx = n.door.x; ty = n.door.y; tz = n.door.z; if (tmp.set(tx, ty, tz).distanceTo(a.p) < 0.25) { a.alive = false; n.reserve++; continue; } }
        spd *= 0.75;
        if (n.alarm > 0.6 && n.found) a.state = 'attack';
        if (tmp.copy(hero).sub(a.p).length() < 1.2 && sp.rage > 2.5) a.state = 'attack';
      } else if (a.state === 'attack') {
        // 앞에서 맴돌다(hover) → 달려듦(dive) → 쏘거나 빗나가면 다시 물러남
        const o = a.phase;
        const hk = 0.7 - 0.25 * (B.hard || 0); // 난이도: 맴도는 시간 줄임
        if (!a.sub) { a.sub = 'hover'; a.subT = (1.2 + Math.random() * 2.4) * hk; }
        a.subT -= dt;
        const dh = tmp.copy(hero).sub(a.p).length();
        if (a.sub === 'hover') {
          const rr = 1.3 + (o % 1) * 0.7, w = 0.9 + (o % 0.5);
          tx = hero.x + Math.cos(a.t * w + o) * rr; ty = hero.y + 0.35 + Math.sin(a.t * 2.1 + o) * 0.45; tz = hero.z + Math.sin(a.t * w + o) * rr;
          spd *= 0.85;
          if (a.subT <= 0 && a.cd <= 0 && B._divers < (B.maxDive || 2) && B.time - (B._lastDive || -9) > (B.diveGap || 0.9)) { a.sub = 'dive'; a.subT = 1.0; B._divers++; B._lastDive = B.time; a.dv = (a.dv || new THREE.Vector3()).copy(hero); }
        } else {
          // 출발할 때 대원이 있던 자리로(조금만 따라감) → 움직이면 피함
          a.dv.lerp(hero, dt * (1.6 + 0.8 * (B.hard || 0)));
          tx = a.dv.x; ty = a.dv.y + 0.1; tz = a.dv.z; spd *= 1.6 + 0.3 * (B.hard || 0);
          if (tmp2.set(tx - a.p.x, ty - a.p.y, tz - a.p.z).length() < 0.25 && dh > 0.6) a.subT = 0;
          if (dh < 0.5) {
            ctx.onSting(sp.dmg, a);
            a.cd = 0.8; a.sub = 'hover'; a.subT = (2.2 + Math.random() * 2.6) * hk;
            a.v.copy(a.p).sub(hero).normalize().multiplyScalar(4); // 쏘고 튕겨 나감
          } else if (a.subT <= 0) { a.sub = 'hover'; a.subT = (0.8 + Math.random() * 1.4) * hk; }
        }
        if (dh > 14) { a.state = n.removed ? 'lost' : 'idle'; a.sub = null; }
        if (B.allGone && !a.provoked) { a.state = 'lost'; a.sub = null; }
      } else { // lost: 집 자리를 맴돎
        tx = n.c.x + Math.cos(a.t + a.phase) * 0.8; tz = n.c.z + Math.sin(a.t + a.phase) * 0.8; ty = n.c.y + Math.sin(a.t * 2) * 0.3; spd *= 0.5;
        if (a.provoked && sp.rage > 0) a.state = 'attack';
      }
      if (a.wob > 0) { spd *= 0.35; tx += Math.sin(a.t * 23) * 0.4; ty -= 0.25; tz += Math.cos(a.t * 19) * 0.4; if (a.sub === 'dive') { a.sub = 'hover'; a.subT = 0.8; } }
      // 조향
      tmp.set(tx - a.p.x, ty - a.p.y, tz - a.p.z);
      const d = tmp.length();
      if (d > 0.001) tmp.multiplyScalar(Math.min(spd, d * 3) / d);
      a.v.lerp(tmp, Math.min(1, dt * 3.2));
      // 붕붕 흔들림
      a.v.x += Math.sin(a.t * 13 + a.phase) * dt * 2.2; a.v.y += Math.cos(a.t * 11 + a.phase) * dt * 2.2;
      a.p.addScaledVector(a.v, dt);
      if (a.p.y < 0.25) { a.p.y = 0.25; a.v.y = Math.abs(a.v.y); }
      // 몸 방향: 가는 쪽, 기울기
      const sp2 = Math.hypot(a.v.x, a.v.z);
      if (sp2 > 0.05) { const want = Math.atan2(a.v.x, a.v.z); let dy = want - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * Math.min(1, dt * 8); a.roll = Math.max(-0.6, Math.min(0.6, -dy * 1.2)); }
      a.pitch = Math.max(-0.5, Math.min(0.5, -a.v.y * 0.25)) + 0.15;
      cnt++;
    }
    B.flying = cnt;
    draw();
  };
  const mist = []; let mistT = 0;
  function addMist(S, dt) {
    mistT -= dt; if (mistT > 0) return; mistT = 0.08;
    for (let d = 0.6; d <= S.range; d += 0.6) {
      const m = mist.length < 60 ? (mist[mist.length] = { p: new THREE.Vector3(), r: 0, life: 0 }) : mist.reduce((x, y) => (x.life < y.life ? x : y));
      m.p.copy(S.o).addScaledVector(S.d, d); m.r = Math.max(0.35, d * S.spread * 1.6); m.life = 0.6;
    }
  }
  function inMist(p) { for (let i = 0; i < mist.length; i++) { const m = mist[i]; if (m.life > 0 && p.distanceToSquared(m.p) < m.r * m.r) return true; } return false; }
  B.clearMist = () => { mist.forEach((m) => (m.life = 0)); };
  function inCone(p, S, rad) {
    tmp2.copy(p).sub(S.o);
    const along = tmp2.dot(S.d);
    if (along < 0 || along > S.range) return false;
    const perp = tmp2.addScaledVector(S.d, -along).length();
    return perp < Math.max(0.3, along * S.spread * 1.4) + rad;
  }
  function kill(a, ctx) {
    a.dead = true; a.alive = false; a.dt = 0;
    a.v.set((Math.random() - 0.5) * 1.5, 0.8 + Math.random(), (Math.random() - 0.5) * 1.5);
    a.spin = (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 6);
    a.onGround = false;
    if (a.sk === 'honey') { if (ctx.onHoneyKill) ctx.onHoneyKill(a); } else ctx.onKill(a);
  }
  B.netCatch = function (o, dir, R, cosA) { // 포충망: 앞쪽 부채꼴 안의 나는 벌
    const got = [];
    list.forEach((a) => {
      if (!a.alive || a.dead || a.sk === 'queen') return;
      tmp.copy(a.p).sub(o); const d = tmp.length();
      if (d > R || d < 0.05) return;
      if (tmp.divideScalar(d).dot(dir) < cosA) return;
      a.alive = false; got.push(a);
    });
    return got;
  };
  function stepDead(a, dt) {
    a.dt += dt;
    if (!a.onGround) {
      a.v.y -= 9.8 * dt;
      a.p.addScaledVector(a.v, dt);
      a.yaw += a.spin * dt; a.roll += a.spin * 0.7 * dt;
      const gy = B.groundY ? B.groundY(a.p.x, a.p.z) : 0;
      if (a.p.y <= gy + 0.04) {
        a.p.y = gy + 0.04;
        if (Math.abs(a.v.y) > 1.2) { a.v.y = -a.v.y * 0.35; a.v.x *= 0.5; a.v.z *= 0.5; a.spin *= 0.5; } // 통 튐
        else { a.onGround = true; a.v.set(0, 0, 0); a.roll = Math.PI * (Math.random() < 0.6 ? 1 : 0.5); a.twitch = 2 + Math.random() * 3; }
      }
    } else if (a.twitch > 0) { a.twitch -= dt; a.yaw += Math.sin(a.dt * 30) * dt * 2; }
  }

  // ---------- 그리기 ----------
  const M = new THREE.Matrix4(), MB = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), SC = new THREE.Vector3(), col = new THREE.Color();
  function draw() {
    let k = 0;
    const now = performance.now() * 0.001;
    for (let i = 0; i < list.length && k < MAX; i++) {
      const a = list[i];
      if (!a.alive && !a.dead) continue;
      E.set(a.pitch, a.yaw, a.roll); Q.setFromEuler(E); SC.setScalar(a.s);
      MB.compose(a.p, Q, SC);
      P.abd.setMatrixAt(k, M.multiplyMatrices(MB, B.local.abd));
      P.tho.setMatrixAt(k, M.multiplyMatrices(MB, B.local.tho));
      P.head.setMatrixAt(k, M.multiplyMatrices(MB, B.local.head));
      P.eyeL.setMatrixAt(k, M.multiplyMatrices(MB, B.local.eyeL));
      P.eyeR.setMatrixAt(k, M.multiplyMatrices(MB, B.local.eyeR));
      let w;
      if (a.dead && a.onGround) w = B.wingRest; else w = Math.sin(now * 90 + a.phase) > 0 ? B.wingUp : B.wingDn;
      P.wingL.setMatrixAt(k, M.multiplyMatrices(MB, w[0]));
      P.wingR.setMatrixAt(k, M.multiplyMatrices(MB, w[1]));
      if (a.ck !== a.sk + (a.dead ? 1 : 0)) {
        a.ck = a.sk + (a.dead ? 1 : 0);
      }
      const sp = a.sp, dim = a.dead ? 0.6 : 0.45 + 0.55 * Math.max(0, a.hp);
      P.abd.setColorAt(k, col.set(sp.col).multiplyScalar(dim)); P.tho.setColorAt(k, col.set(sp.tho).multiplyScalar(dim)); P.head.setColorAt(k, col.set(sp.head).multiplyScalar(dim));
      k++;
    }
    for (const key in P) { P[key].count = k; P[key].instanceMatrix.needsUpdate = true; if (P[key].instanceColor) P[key].instanceColor.needsUpdate = true; }
  }

  // ---------- 셈 ----------
  B.hostileLeft = function () { // 나는 벌 + 아직 안 뗀 집 안 벌(꿀벌 빼고)
    let c = 0;
    list.forEach((a) => { if (a.alive && a.sk !== 'honey') c++; });
    nests.forEach((n) => { if (!n.removed && n.spec.sp !== 'honey') c += Math.max(0, n.reserve); });
    return c;
  };
  B.removeNest = function (n) {
    n.removed = true; n.reserve = 0;
    // 집에 붙어 있던 벌은 같이 봉투로
    list.forEach((a) => { if (a.alive && a.n === n && a.state !== 'attack' && a.p.distanceTo(n.c) < 1.6 * n.size) a.alive = false; });
    if (n.spec.sp === 'honey') list.forEach((a) => { if (a.alive && a.n === n) a.alive = false; });
  };
  B.flyAway = function () { list.forEach((a) => { if (a.alive && a.sk !== 'honey') { a.state = 'lost'; a.v.set((Math.random() - 0.5) * 4, 3, (Math.random() - 0.5) * 4); a.alive = false; } }); };
  // 조준점 아래 벌이 있나(색만 바꿈)
  B.aimHit = function (o, d, range) {
    let best = null;
    list.forEach((a) => { if (!a.alive) return; tmp.copy(a.p).sub(o); const al = tmp.dot(d); if (al < 0 || al > range) return; const pr = tmp.addScaledVector(d, -al).length(); if (pr < 0.18 + al * 0.03) best = a; });
    if (best) return best;
    nests.forEach((n) => { if (n.removed || !n.found) return; tmp.copy(n.c).sub(o); const al = tmp.dot(d); if (al < 0 || al > range) return; if (tmp.addScaledVector(d, -al).length() < 0.35 * n.size) best = n; });
    return best;
  };
})();
