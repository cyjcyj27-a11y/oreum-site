// 규칙: 하루 장사, 손님, 반죽·굽기·누르기·가르기·씨앗·건네기, 손으로 하는 입력
(function () {
  const G = (window.GAME = {});
  const D = DATA, V3 = THREE.Vector3, PI = Math.PI;
  const KEY = 'hotteok.save';
  let R, P;

  // ---------- 저장 ----------
  function fresh() { return { day: 1, coins: 0, gear: { griddle: 0, fire: 0, press: 0, oil: 0, heater: 0, bulb: 0 }, stats: { made: 0, served: 0, perfect: 0, burnt: 0, burst: 0, angry: 0, earned: 0, tips: 0, best: 0 }, how: false, started: false, done: false }; }
  G.S = fresh();
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { G.S = Object.assign(fresh(), s); G.S.gear = Object.assign(fresh().gear, s.gear || {}); G.S.stats = Object.assign(fresh().stats, s.stats || {}); } } catch (e) {}
  G.save = function () { try { localStorage.setItem(KEY, JSON.stringify(G.S)); } catch (e) {} };
  G.reset = function () { const how = G.S.how; G.S = fresh(); G.S.how = how; G.save(); };
  G.gv = (id) => { const it = D.SHOP.find((x) => x.id === id); return it.lv[G.S.gear[id]]; };

  // ---------- 하루 상태 ----------
  G.mode = 'title';
  let T = null; // 오늘
  G.T = () => T;
  G.boot = function () {
    R = RND; P = R.POS;
    R.hooks.push(update);
    G.applyGear();
  };
  G.applyGear = function () {
    R.setSpots(G.gv('griddle'));
    R.setLocks(G.S.day);
  };

  function pickKind(day) {
    const w = D.weights(day); let tot = 0; for (const k in w) tot += w[k];
    let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'honey';
  }
  function makeOrders(day) {
    const d = D.DAY[day], list = [];
    for (let i = 0; i < d.n; i++) {
      const k = i === 0 && day === 1 ? 'honey' : D.NEW[day] && D.KIND[D.NEW[day]] && i === 0 ? D.NEW[day] : pickKind(day);
      let n = 1 + Math.floor(Math.random() * d.max); if (i === 0) n = 1;
      const crispy = k !== 'gonggal' && (Math.random() < d.crispy || (D.NEW[day] === 'crispy' && i === 0));
      const items = []; for (let j = 0; j < n; j++) items.push({ kind: k, crispy, done: false });
      list.push(items);
    }
    return list;
  }

  G.startDay = function () {
    clearAll();
    const d = D.DAY[G.S.day];
    T = { day: G.S.day, queue: makeOrders(G.S.day), cust: [null, null, null], spawnT: 1.2, angry: 0, earn: 0, tips: 0, sold: 0, perfect: 0, stars: [], streak: 0, honey: G.S.honeyKeep || 0, honeyT: 0, oil: 1, over: false, served: 0 };
    G.board = null; G.spots = new Array(6).fill(null); G.tray = null; G.held = null;
    G.applyGear(); R.redrawText(G.S.day);
    G.mode = 'play'; G.S.started = true; G.save();
    R.setSnow(0, true); // 눈은 그날 호떡 세 개를 판 뒤부터
    UI.show('play'); UI.dayBanner(G.S.day, D.NEW[G.S.day]);
    SND.startBgm();
  };
  function clearAll() {
    if (G.board) HOT.dispose(G.board); if (G.tray) HOT.dispose(G.tray); if (G.held) HOT.dispose(G.held.h);
    (G.spots || []).forEach((h) => h && HOT.dispose(h));
    G.board = G.tray = G.held = null; G.spots = new Array(6).fill(null);
    if (T) T.cust.forEach((c) => c && dropCust(c));
    flying.forEach((f) => f.obj.parent && f.obj.parent.remove(f.obj)); flying.length = 0;
    UI.clearBubbles();
  }

  // ---------- 손님 ----------
  function spawn() {
    // 그날 열린 자리만(한 명이면 가운데, 둘이면 양옆)
    const n = D.DAY[T.day].slots || 3, order = n === 1 ? [1] : n === 2 ? [0, 2] : [1, 0, 2];
    const free = order.find((k) => !T.cust[k]); if (free === undefined || !T.queue.length) return false;
    const model = PEOPLE.free(); if (!model) return false;
    model.busy = true;
    const items = T.queue.shift();
    const pat = D.DAY[T.day].pat * G.gv('heater') * (0.9 + items.length * 0.1);
    const side = R.SLOTS[free] <= 0 ? -1 : 1;
    const c = { slot: free, model, items, pat, patMax: pat, state: 'in', t: 0, x0: side * 2.2, x1: R.SLOTS[free], hop: 0, mood: 0 };
    model.root.visible = true; model.root.position.set(c.x0, -0.9, R.CUST_Z - 0.1); model.root.rotation.y = side < 0 ? PI / 2 : -PI / 2; model.play('walk'); model.setMood('idle');
    T.cust[free] = c;
    UI.bubble(c);
    return true;
  }
  function dropCust(c) { c.model.busy = false; c.model.root.visible = false; (c.cups || []).forEach((k) => k.parent && k.parent.remove(k)); UI.removeBubble(c); }
  function leave(c, happy) {
    c.state = 'out'; c.t = 0; c.happy = happy;
    const side = c.x1 <= 0 ? -1 : 1; c.x0 = c.x1; c.x2 = side * 2.4;
    c.model.root.rotation.y = side < 0 ? -PI / 2 : PI / 2; c.model.play('walk'); c.model.setMood(happy ? 'happy' : 'angry');
    UI.bubbleLeave(c, happy);
  }
  function updCust(dt) {
    T.cust.forEach((c, i) => {
      if (!c) return;
      c.model.mixer.update(dt);
      const r = c.model.root;
      if (c.state === 'in') {
        c.t += dt / 1.6; const k = Math.min(1, c.t), e = 1 - Math.pow(1 - k, 2);
        r.position.x = c.x0 + (c.x1 - c.x0) * e; r.position.z = R.CUST_Z - 0.1 + 0.1 * e;
        if (k >= 1) { c.state = 'wait'; r.rotation.y = 0; c.model.play('idle'); SND.bell(); }
        else if (k > 0.75) r.rotation.y *= 0.85;
      } else if (c.state === 'wait') {
        if (c.leaveT !== undefined) { c.leaveT -= dt; if (c.leaveT <= 0) { c.leaveT = undefined; leave(c, true); } }
        else if (T.honeyT <= 0) c.pat -= dt;
        if (c.hop > 0) { c.hop -= dt; r.position.y = -0.9 + Math.abs(Math.sin(c.hop * 14)) * 0.03; } else r.position.y = -0.9;
        if (c.shake > 0) { c.shake -= dt; r.rotation.y = Math.sin(c.shake * 40) * 0.12; } else r.rotation.y = 0;
        c.model.setMood(c.hop > 0 || c.leaveT !== undefined ? 'happy' : c.shake > 0 ? 'angry' : c.pat / c.patMax < 0.3 ? 'wait' : null);
        if (c.pat <= 0) {
          T.angry++; G.S.stats.angry++; T.streak = 0; SND.angry(); UI.angryMark(T.angry);
          leave(c, false);
          if (T.angry >= D.ANGRY_LIMIT) gameOver();
        }
      } else if (c.state === 'out') {
        c.t += dt / 1.8; const k = Math.min(1, c.t);
        r.position.x = c.x0 + (c.x2 - c.x0) * k * k; r.position.y = -0.9;
        if (k >= 1) { dropCust(c); T.cust[i] = null; T.spawnT = Math.min(T.spawnT, 1.5); }
      }
      UI.bubblePos(c);
    });
  }

  // ---------- 하루 흐름 ----------
  function updDay(dt) {
    if (T.over) return;
    T.time = (T.time || 0) + dt;
    T.spawnT -= dt;
    if (T.spawnT <= 0 && T.queue.length) { if (spawn()) T.spawnT = D.DAY[T.day].gap * (0.8 + Math.random() * 0.4); else T.spawnT = 0.5; }
    // 아무도 없으면 빨리 다음 손님
    if (T.queue.length && T.cust.every((c) => !c) && T.spawnT > 2.5) T.spawnT = 2.5;
    if (T.honeyT > 0) { T.honeyT -= dt; if (T.honeyT <= 0) UI.honey(T.honey, 0); }
    if (!T.queue.length && T.cust.every((c) => !c) && !T.over) dayClear();
  }
  function dayClear() {
    T.over = true; G.mode = 'result';
    const st = G.S.stats;
    G.S.coins += T.earn + T.tips; st.earned += T.earn + T.tips; st.tips += T.tips;
    G.S.honeyKeep = 0;
    const avg = T.stars.length ? T.stars.reduce((a, b) => a + b, 0) / T.stars.length : 0;
    const last = G.S.day >= D.DAYS;
    if (last) { G.S.done = true; }
    else G.S.day++;
    G.save();
    SND.sizzle(0); SND.clear();
    setTimeout(() => {
      if (last) G.ending(avg);
      else UI.result({ day: T.day, sold: T.sold, earn: T.earn, tips: T.tips, avg, perfect: T.perfect, angry: T.angry });
    }, 900);
  }
  function gameOver() {
    T.over = true; G.mode = 'over'; SND.sizzle(0); SND.fail();
    setTimeout(() => UI.over(), 700);
  }
  G.retry = function () { G.startDay(); };
  G.next = function () { G.startDay(); };

  // ---------- 호떡 판정 ----------
  // 만든 호떡이 어느 주문인가: 반죽 + 속 + 씨앗
  function kindOf(h) {
    const dough = h.dough || 'plain';
    if (!h.fill) return h.scoops ? 'bad' : dough === 'plain' ? 'gonggal' : 'bad';
    if (dough === 'green') return h.fill === 'sugar' && !h.scoops ? 'green' : 'bad';
    if (dough === 'black') return h.fill === 'sugar' && !h.scoops ? 'black' : 'bad';
    if (h.fill === 'sugar') return h.scoops >= 2 ? 'seed2' : h.scoops === 1 ? 'seed' : 'honey';
    if (h.scoops) return 'bad';
    return h.fill; // bean·cheese·japchae
  }
  function grade(h, it) {
    const C = D.COOK, Pr = D.PRESS, tol = G.gv('press');
    let s = 3, perfect = true; const why = [];
    const cw = it.crispy ? [C.crisp0, C.crisp1] : [C.good0, C.good1];
    [h.cookA, h.cookB].forEach((c) => {
      if (c > C.burnt + (it.crispy ? 0.12 : 0)) { s -= 1.5; perfect = false; why.push('burnt'); }
      else if (c < C.raw) { s -= 1.5; perfect = false; why.push('raw'); }
      else if (c < cw[0] || c > cw[1]) { s -= 0.5; perfect = false; }
    });
    if (it.kind === 'gonggal') { // 공갈: 누르지 않고 둥글게 부풀어야
      if (h.flat > Pr.gonggal) { s -= 1.5; perfect = false; why.push('flat'); }
      else if ((h.puff || 0) < 0.8) { s -= 0.5; perfect = false; }
    } else {
      if (h.flat < 0.55) { s -= 1; perfect = false; why.push('thick'); }
      else if (h.flat < Pr.good0 - tol) { s -= 0.5; perfect = false; }
      if (h.burst) { s -= 1; perfect = false; }
      const want = D.FILL[h.fill] ? D.FILL[h.fill].want : 2;
      if (h.spoons !== want) { s -= 0.5; perfect = false; }
    }
    if (h.dry > 4) { s -= 0.5; perfect = false; }
    const stars = Math.max(0, Math.min(3, Math.round(s)));
    return { stars, perfect: perfect && stars === 3, why };
  }
  G.kindOf = kindOf; G.grade = grade;

  // 건넴: 맞는 주문 칸을 찾아 채점
  function serve(h, c) {
    const k = kindOf(h);
    const it = c.items.find((x) => !x.done && x.kind === k);
    if (!it) { SND.no(); c.shake = 0.5; c.pat -= c.patMax * 0.08; UI.no(c); return false; }
    it.done = true;
    const g = grade(h, it);
    const price = D.KIND[it.kind].price;
    const pay = Math.round(price * [0.25, 0.55, 0.8, 1][g.stars] / 10) * 10;
    let tip = 0;
    if (g.perfect) { tip = Math.round(D.TIP * G.gv('bulb') * (T.honeyT > 0 ? 2 : 1)); T.perfect++; G.S.stats.perfect++; T.streak++; G.S.stats.best = Math.max(G.S.stats.best, T.streak); if (T.honeyT <= 0) { T.honey = Math.min(D.PERFECT_FOR_HONEY, T.honey + 1); UI.honey(T.honey, 0); } }
    else T.streak = 0;
    if (h.cookA > D.COOK.burnt || h.cookB > D.COOK.burnt) G.S.stats.burnt++;
    T.earn += pay; T.tips += tip; T.sold++;
    if (T.sold >= 3) R.setSnow(1); T.stars.push(g.stars); G.S.stats.served++;
    c.hop = 0.5;
    // 종이컵에 담겨 손님 손으로
    cupFly(h, c);
    const sp = UI.custScreen(c);
    if (g.perfect) { SND.perfect(); UI.praise('PERFECT', '+' + (pay + tip).toLocaleString(), 'perfect', sp[0], sp[1]); }
    else UI.praise(['…', 'OK', 'GOOD', 'GREAT'][g.stars], '+' + pay.toLocaleString(), g.stars <= 1 ? 'meh' : '', sp[0], sp[1]);
    SND.serve(); setTimeout(() => SND.coin(), 180);
    UI.bubble(c); UI.hud();
    if (c.items.every((x) => x.done)) c.leaveT = 0.65;
    return true;
  }

  // ---------- 날아가는 것(컵·버린 호떡) ----------
  const flying = [];
  function cupFly(h, c) {
    const cup = R.makeCup(); cup.scale.setScalar(1.15);
    // 호떡을 반으로 접어 컵에 꽂은 모양: 납작한 반원판
    const half = new THREE.Mesh(new THREE.CylinderGeometry(h.R * 0.95, h.R * 0.95, 0.012, 24, 1, false, 0, PI), new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...HOT.cookCol((h.cookA + h.cookB) / 2, h.dough).map((v) => v * v)), roughness: 0.4 }));
    half.rotation.set(PI / 2, 0, PI / 2); half.position.y = 0.1; cup.add(half);
    if (h.scoops) { const top = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 6, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: R.seedTex, roughness: 0.6 })); top.scale.y = 0.5; top.position.y = 0.1 + h.R * 0.9; cup.add(top); }
    const from = h.grp.getWorldPosition(new V3());
    cup.position.copy(from); R.scene.add(cup);
    HOT.dispose(h);
    // 손님 손 높이(배꼽 앞)로 날아가서 손님이 들고 감
    const hy = -0.9 + c.model.height * 0.56, to = new V3(c.x1 + 0.1, hy, R.CUST_Z + 0.24);
    flying.push({ obj: cup, from, to, t: 0, dur: 0.45, arc: 0.18, done: () => {
      R.scene.remove(cup); if (!c.model.root.visible) return;
      const old = c.cups || (c.cups = []); cup.position.set(0.1 + old.length * 0.03, c.model.height * 0.56, 0.24 - old.length * 0.02); c.model.root.add(cup); old.push(cup);
    } });
  }
  function toss(h) { // 버리는 통으로
    const from = h.grp.getWorldPosition(new V3()), to = new V3(P.bin.x, 0.06, P.bin.z);
    R.world.remove(h.grp); R.scene.add(h.grp); h.grp.position.copy(from);
    flying.push({ obj: h.grp, from, to, t: 0, dur: 0.35, arc: 0.1, spin: 6, done: () => { R.scene.remove(h.grp); HOT.dispose(h); SND.pop(); } });
  }
  function updFly(dt) {
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i]; f.t += dt / f.dur; const k = Math.min(1, f.t), e = k * (2 - k);
      f.obj.position.lerpVectors(f.from, f.to, e); f.obj.position.y += Math.sin(k * PI) * f.arc;
      if (f.spin) f.obj.rotation.x += f.spin * dt;
      if (k >= 1) { f.done && f.done(); flying.splice(i, 1); }
    }
  }

  // ---------- 매 프레임 ----------
  let simT = 0;
  function update(dt) {
    simT += dt;
    if (G.mode === 'ending') { updEnding(dt); return; }
    if (G.mode === 'title') { titleIdle(dt); return; }
    if (!T) return;
    const paused = UI.paused();
    if (paused) return;
    if (G.mode === 'play') { updDay(dt); }
    updCust(dt);
    updFly(dt);
    updHotteoks(dt);
    updTools(dt);
    UI.tickBubbles(T);
  }
  G.update = update;

  // 철판 위 호떡 익히기·거품·연기
  let emitAcc = 0;
  function updHotteoks(dt) {
    const fire = G.gv('fire');
    let onGrid = 0;
    emitAcc += dt;
    const oilK = T.oil;
    R.oilMat.opacity = 0.03 + 0.17 * oilK; R.ironMat.roughness = 0.62 - 0.36 * oilK;
    G.spots.forEach((h, i) => {
      if (!h || h === (G.held && G.held.h)) return;
      onGrid++;
      const flipping = h.flipT !== undefined;
      if (!flipping) {
        const rate = (1 / 10.5) * fire * (D.DAY[T.day].cook || 1) * (oilK < 0.15 ? 1.3 : 1) * (1.15 - 0.3 * Math.min(1, h.flat)); // 두꺼운 공일 땐 아랫면이 더 빨리 탐
        if (h.down) h.cookB += rate * dt; else h.cookA += rate * dt;
        // 반대 면도 속까지 열이 조금 올라옴
        if (h.down) h.cookA += rate * dt * 0.06; else h.cookB += rate * dt * 0.06;
        if (oilK < 0.15) h.dry = (h.dry || 0) + dt;
        T.oil = Math.max(0, T.oil - 0.0035 * dt * G.gv('oil'));
        // 처음엔 공이 조금 퍼짐(빈 공갈은 퍼지지 않고 부풂)
        if (h.fill && h.sag < 0.12) h.sag += dt * 0.02;
        if (!h.fill) { const p0 = h.puff || 0; h.puff = Math.max(p0, Math.min(1, (Math.min(h.cookA, h.cookB) - 0.25) / 0.5)); if (h.puff > 0.5 && p0 <= 0.5) { SND.pop(); } }
      }
      const down = h.down ? h.cookB : h.cookA;
      if (Math.random() < dt * 26 * (0.3 + oilK)) R.emit('bubble', h.grp.position.x, P.grid.y + 0.003, h.grp.position.z, 1);
      if (down > D.COOK.burnt && Math.random() < dt * 6) R.emit('smoke', h.grp.position.x, P.grid.y + 0.03, h.grp.position.z, 1);
      else if (Math.random() < dt * 2.5) R.emit('steam', h.grp.position.x, P.grid.y + (h.top || 0.03), h.grp.position.z, 1);
      if (h.burst && h.puddleR < 0.135) { h.puddleR += dt * 0.09; h.puddle.scale.set(h.puddleR * 1.12, h.puddleR * 0.92, 1); }
      if (h.burst && Math.random() < dt * 4) R.emit('smoke', h.puddle.position.x + (Math.random() - 0.5) * 0.08, P.grid.y + 0.01, h.puddle.position.z + (Math.random() - 0.5) * 0.08, 1);
      // 뒤집기 움직임
      if (flipping) {
        h.flipT += dt / 0.42; const k = Math.min(1, h.flipT);
        h.spin.rotation.x = -PI * k; h.grp.position.y = P.grid.y + Math.sin(k * PI) * 0.09;
        R.spat.visible = true; R.spat.position.set(h.grp.position.x, P.grid.y + 0.004 + Math.sin(k * PI) * 0.06, h.grp.position.z + 0.02); R.spat.rotation.x = -0.25 * Math.sin(k * PI);
        if (k >= 1) { h.flipT = undefined; h.spin.rotation.x = 0; h.down = 1 - h.down; h.grp.position.y = P.grid.y; R.spat.visible = false; SND.drop(); R.emit('oil', h.grp.position.x, P.grid.y + 0.01, h.grp.position.z, 8); h.flips = (h.flips || 0) + 1; }
      }
      HOT.shape(h);
      UI.cookRing(i, h);
    });
    for (let i = 0; i < 6; i++) if (!G.spots[i] || G.spots[i] === (G.held && G.held.h)) UI.cookRing(i, null);
    R.heat.intensity = 0.25 + onGrid * 0.12;
    SND.sizzle(onGrid * (0.4 + T.oil * 0.6));
    // 쟁반 위 호떡: 김, 씨앗
    if (G.tray && G.tray.cut > 0 && G.tray.cut < 1) { G.tray.cut = Math.min(1, G.tray.cut + dt / 0.38); HOT.shape(G.tray); }
    if (G.tray) { if (Math.random() < dt * 2) R.emit('steam', G.tray.grp.position.x, 0.05, G.tray.grp.position.z, 1); if (HOT.updSeeds(G.tray, dt)) {} }
    if (G.board && G.board.dirty) HOT.shape(G.board);
    if (G.held) HOT.updSeeds(G.held.h, dt);
    UI.hudOil(T.oil);
  }

  // 도구 움직임(누르개·숟가락·국자·가위·기름병)
  const anim = { press: null, spoon: 0, scoop: 0, oil: 0, scis: 0 };
  function updTools(dt) {
    // 누르개: 누르는 호떡 위로 내려왔다가 제자리로
    const pr = R.press;
    if (anim.press) {
      const h = anim.press; const tgt = new V3(h.grp.position.x, P.grid.y + (h.top || 0.02) + 0.004, h.grp.position.z);
      pr.position.lerp(tgt, Math.min(1, dt * 18));
      pr.rotation.z = Math.sin(simT * 30) * 0.01;
    } else { pr.position.lerp(R.pressHome, Math.min(1, dt * 10)); pr.rotation.z = 0; }
    // 숟가락: 통 → 반죽 위로 기울였다가 돌아감
    if (anim.spoon > 0) {
      anim.spoon -= dt / 0.55; const k = 1 - Math.max(0, anim.spoon), b = G.board;
      const a = anim.spoonFrom || R.spoonHome(), bpos = b ? new V3(b.grp.position.x, 0.08, b.grp.position.z) : a;
      const u = k < 0.5 ? k * 2 : (1 - k) * 2;
      R.spoon.position.lerpVectors(a, bpos, Math.sin(u * PI / 2)); R.spoon.position.y += Math.sin(u * PI) * 0.06;
      R.spoon.rotation.set(-0.9 + u * 0.6, 0.4, u * 1.6);
      if (k > 0.45 && k < 0.6 && b) R.emit('sugar', bpos.x, 0.06, bpos.z, 3);
    } else { R.spoon.position.copy(R.spoonHome()); R.spoon.rotation.set(-0.9, 0.4, 0); }
    if (anim.scoop > 0) {
      anim.scoop -= dt / 0.6; const k = 1 - Math.max(0, anim.scoop), b = G.tray;
      const a = new V3(P.seeds.x - 0.03, 0.1, P.seeds.z + 0.04), bpos = b ? new V3(b.grp.position.x, 0.12, b.grp.position.z) : a;
      const u = k < 0.5 ? k * 2 : (1 - k) * 2;
      R.scoop.position.lerpVectors(a, bpos, Math.sin(u * PI / 2)); R.scoop.position.y += Math.sin(u * PI) * 0.06;
      R.scoop.rotation.set(-0.9 + u * 0.5, -0.5, -u * 1.9);
      if (k >= 0.48 && !anim.scoopDone) { anim.scoopDone = true; const sh = anim.scoopH; if (sh && G.tray === sh) { HOT.addScoop(sh); HOT.shape(sh); SND.seeds(); } }
    } else { R.scoop.position.set(P.seeds.x - 0.03, 0.1, P.seeds.z + 0.04); R.scoop.rotation.set(-0.9, -0.5, 0); }
    // 기름병: 들어 철판 위에서 쭉
    if (anim.oil > 0) {
      anim.oil -= dt / 0.9; const k = 1 - Math.max(0, anim.oil), u = Math.sin(Math.min(1, k * 1.4) * PI);
      R.oilB.position.set(P.oil.x - u * 0.3, u * 0.14, P.oil.z - u * 0.08); R.oilB.rotation.z = u * 2.0;
      if (k > 0.25 && k < 0.75) for (let i = 0; i < 2; i++) R.emit('oil', P.grid.x + (Math.random() - 0.5) * 0.5, P.grid.y + 0.01, P.grid.z + (Math.random() - 0.5) * 0.3, 1);
    } else { R.oilB.position.set(P.oil.x, 0, P.oil.z); R.oilB.rotation.z = 0; }
    // 가위: 한 번 싹둑
    if (anim.scis > 0) {
      anim.scis -= dt / 0.45; const k = 1 - Math.max(0, anim.scis), h = G.tray;
      R.scis.visible = !!h; if (h) { R.scis.position.set(h.grp.position.x - 0.07 + k * 0.14, 0.04, h.grp.position.z + 0.03); R.scis.rotation.set(0, PI / 2, 0); const o = Math.abs(Math.sin(k * PI * 2)) * 0.35; R.scis.userData.a.rotation.y = o; R.scis.userData.b.rotation.y = -o; }
    } else R.scis.visible = false;
  }

  // ---------- 행동 ----------
  G.newDough = function (dough) {
    dough = dough || 'plain';
    if (G.mode !== 'play') return false;
    if (!D.openDough(dough, T.day)) { SND.no(); return false; }
    if (G.board) return false;
    const h = HOT.make(null, dough); h.stage = 'board';
    // 통 칸에서 판으로 떼어 옮겨 철퍽
    const c = R.cell('dough', dough);
    h.fromPos = new V3(c.x, 0.08, c.z); h.grp.position.copy(h.fromPos);
    G.board = h;
    const to = new V3(P.board.x, 0.009, P.board.z);
    flying.push({ obj: h.grp, from: h.fromPos, to, t: 0, dur: 0.28, arc: 0.08, done: () => { SND.plop(); R.emit('flour', to.x, 0.02, to.z, 10); } });
    HOT.shape(h); G.S.stats.made++;
    return true;
  };
  G.addFill = function (kind) {
    if (!D.openFill(kind, T.day)) { SND.no(); return false; }
    const h = G.board; if (!h || h.close > 0.05) { SND.no(); UI.flashBoard(); return false; }
    if (h.fill && h.fill !== kind) { SND.no(); return false; }
    if (h.spoons >= D.FILL[kind].burst) return false;
    if (!h.fill) { h.fill = kind; h.pile.material = R.fillMat[kind]; h.puddle.material.color.set(D.FILL[kind].puddle); }
    h.spoons++; h.dirty = true;
    const c = R.cell('fill', kind); anim.spoonFrom = new V3(c.x + 0.02, 0.09, c.z + 0.05);
    anim.spoon = 1; SND.spoon();
    return true;
  };
  // 반죽 문지르기(오므리기): 각도 변화만큼
  G.rub = function (amt) {
    const h = G.board; if (!h || h.close >= 1) return;
    h.close = Math.min(1, h.close + amt); h.dirty = true; SND.rub();
    if (Math.random() < 0.3) R.emit('flour', h.grp.position.x, 0.03, h.grp.position.z, 1);
    if (h.close >= 1) { SND.closed(); h.stage = 'board'; UI.praise(L('동글!', 'ROUND!'), '', 'small', ...R.toScreen(h.grp.position.clone().setY(0.08))); }
  };
  G.place = function (h, i) {
    G.spots[i] = h; h.stage = 'griddle'; h.from = null; h.sag = 0;
    h.grp.position.set(R.SPOTS[i].x, P.grid.y, R.SPOTS[i].z); h.grp.rotation.set(0, Math.random() * 6, 0);
    h.puddle.position.set(R.SPOTS[i].x, P.grid.y + 0.0018, R.SPOTS[i].z);
    T.oil = Math.max(0, T.oil - 0.07 * G.gv('oil'));
    SND.drop(); R.emit('oil', h.grp.position.x, P.grid.y + 0.01, h.grp.position.z, 10);
    HOT.shape(h);
  };
  G.flip = function (i) { const h = G.spots[i]; if (!h || h.flipT !== undefined) return; h.flipT = 0; SND.flip(); };
  G.pressStart = function (i) { const h = G.spots[i]; if (!h) return; anim.press = h; SND.press(); };
  G.pressHold = function (i, dt) {
    const h = G.spots[i]; if (!h || anim.press !== h) return;
    h.flat = Math.min(1.25, h.flat + dt * 0.62); h.pressed = 1;
    if (Math.random() < dt * 30) R.emit('oil', h.grp.position.x + (Math.random() - 0.5) * 0.16, P.grid.y + 0.005, h.grp.position.z + (Math.random() - 0.5) * 0.16, 1);
    const burstAt = D.PRESS.burst + G.gv('press');
    // 속이 있어야 터진다(빈 반죽은 그냥 얇아짐). 속을 너무 많이 넣었으면 덜 눌러도 터짐
    if (!h.burst && h.fill && (h.flat > burstAt || (h.spoons >= D.FILL[h.fill].burst && h.flat > 0.78))) burst(h);
  };
  G.pressEnd = function () { anim.press = null; };
  function burst(h) {
    h.burst = 1; G.S.stats.burst++; SND.burst();
    h.puddle.visible = true; h.puddleR = 0.05; h.puddle.scale.setScalar(0.05); h.puddle.position.x += 0.02; h.puddle.position.z += 0.015;
    const sp = R.toScreen(h.grp.position.clone().setY(0.06)); UI.praise(L('터짐!', 'BURST!'), '', 'bad', sp[0], sp[1]);
    for (let k = 0; k < 6; k++) R.emit('smoke', h.grp.position.x, P.grid.y + 0.02, h.grp.position.z, 1);
  }
  G.oil = function () { if (anim.oil > 0 || G.mode !== 'play') return; anim.oil = 1; SND.oil(); T.oil = Math.min(1, T.oil + 0.45); };
  G.cut = function () { const h = G.tray; if (!h || h.cut) return false; h.cut = 0.01; anim.scis = 1; SND.snip(); return true; };
  G.scoop = function () {
    const h = G.tray; if (anim.scoop > 0 || !R.seedsG.visible) return false;
    if (!h || !h.cut || h.fill === 'cheese' || h.scoops >= 3) { SND.no(); UI.flashTray(); return false; }
    anim.scoop = 1; anim.scoopH = h; anim.scoopDone = false;
    return true;
  };

  // 끌어서 옮기기
  G.pickUp = function (h, from, idx) {
    G.held = { h, from, idx };
    h.from = from === 'board' ? 'board' : 'cooked';
    h.grp.position.y = 0.12; SND.ui();
  };
  G.moveHeld = function (sx, sy) {
    const p = R.pick(sx, sy, 0.1); if (!p || !G.held) return;
    const h = G.held.h; h.grp.position.set(p.x, 0.11, p.z);
    const tgt = dropTarget(sx, sy, p);
    R.hiSpot(tgt && tgt.t === 'spot' ? tgt.i : -1);
    UI.hiCust(tgt && tgt.t === 'cust' ? tgt.c : null);
    G.held.tgt = tgt;
  };
  function dropTarget(sx, sy, p) {
    const h = G.held.h, from = G.held.from;
    // 손님: 화면에서 손님 몸 근처거나 조리대 너머
    if (from !== 'board') {
      for (const c of T.cust) if (c && c.state === 'wait') { const r = UI.custRect(c); if (sx > r.x0 && sx < r.x1 && sy > r.y0 && sy < r.y1) return { t: 'cust', c }; }
      if (p.z < P.front - 0.02) { let best = null, bd = 1e9; for (const c of T.cust) if (c && c.state === 'wait') { const d = Math.abs(c.x1 - p.x); if (d < bd) { bd = d; best = c; } } if (best) return { t: 'cust', c: best }; }
    }
    if (Math.hypot(p.x - P.bin.x, p.z - P.bin.z) < P.bin.r + 0.05 && from !== 'board') return { t: 'bin' };
    if (from === 'board' && Math.hypot(p.x - P.bin.x, p.z - P.bin.z) < P.bin.r + 0.05) return { t: 'bin' };
    if (Math.abs(p.x - P.tray.x) < P.tray.w / 2 + 0.03 && Math.abs(p.z - P.tray.z) < P.tray.d / 2 + 0.03 && from !== 'board' && (!G.tray || G.tray === h)) return { t: 'tray' };
    if (from === 'board' || from === 'spot') {
      let best = -1, bd = 0.17;
      for (let i = 0; i < G.gv('griddle'); i++) { if (G.spots[i] && G.spots[i] !== h) continue; const d = Math.hypot(p.x - R.SPOTS[i].x, p.z - R.SPOTS[i].z); if (d < bd) { bd = d; best = i; } }
      if (best >= 0) return { t: 'spot', i: best };
    }
    if (from === 'board' && Math.abs(p.x - P.board.x) < P.board.w / 2 + 0.03 && Math.abs(p.z - P.board.z) < P.board.d / 2 + 0.03) return { t: 'board' };
    return null;
  }
  G.dropHeld = function () {
    const H0 = G.held; if (!H0) return; G.held = null; R.hiSpot(-1); UI.hiCust(null);
    const h = H0.h, tgt = H0.tgt;
    const back = () => { // 제자리로
      if (H0.from === 'board') { h.grp.position.set(P.board.x, 0.009, P.board.z); h.from = null; }
      else if (H0.from === 'spot') { G.spots[H0.idx] = h; h.grp.position.set(R.SPOTS[H0.idx].x, P.grid.y, R.SPOTS[H0.idx].z); }
      else if (H0.from === 'tray') { G.tray = h; h.grp.position.set(P.tray.x, 0.009, P.tray.z); }
      HOT.shape(h);
    };
    // 들기 전 자리 비우기
    if (H0.from === 'board') G.board = null; else if (H0.from === 'spot') G.spots[H0.idx] = null; else if (H0.from === 'tray') G.tray = null;
    if (!tgt) { if (H0.from === 'board') G.board = h; back(); return; }
    if (tgt.t === 'bin') { toss(h); return; }
    if (tgt.t === 'board') { G.board = h; back(); return; }
    if (tgt.t === 'spot') {
      if (H0.from === 'board' && h.close < 1) { G.board = h; back(); SND.no(); UI.flashBoard(); return; }
      if (H0.from === 'board') h.stage = 'griddle';
      G.place(h, tgt.i); return;
    }
    if (tgt.t === 'tray') { G.tray = h; h.stage = 'tray'; h.from = null; h.grp.position.set(P.tray.x, 0.009, P.tray.z); HOT.shape(h); SND.plop(); return; }
    if (tgt.t === 'cust') {
      if (serve(h, tgt.c)) return;
      if (H0.from === 'spot') G.spots[H0.idx] = h; else G.tray = h; back(); return;
    }
  };

  G.useHoney = function () {
    if (!T || T.honey < D.PERFECT_FOR_HONEY || T.honeyT > 0) return;
    T.honey = 0; T.honeyT = 15; SND.honey(); UI.honey(0, 15);
    for (let i = 0; i < 30; i++) R.emit('spark', (Math.random() - 0.5) * 0.8, 0.3, -0.6, 1);
  };

  // ---------- 타이틀·엔딩 ----------
  let titleT = 0;
  function titleIdle(dt) {
    titleT += dt;
    // 타이틀 장면: 철판에 호떡 둘이 지글지글, 손님 한 명
    G.titleSet && G.titleSet.forEach((h) => { if (Math.random() < dt * 20) R.emit('bubble', h.grp.position.x, P.grid.y + 0.003, h.grp.position.z, 1); if (Math.random() < dt * 2) R.emit('steam', h.grp.position.x, P.grid.y + 0.02, h.grp.position.z, 1); });
    Object.values(PEOPLE.ready).forEach((p) => p.root.visible && p.mixer.update(dt));
    SND.sizzle(G.titleSet ? 0.5 : 0);
  }
  G.title = function () {
    G.mode = 'title'; R.setSnow(0, true); clearAll(); T = null;
    if (!G.titleSet) {
      G.titleSet = [];
      [[0, 0.95, 0.7, 1], [1, 1.0, 0.95, 0], [2, 0.45, 0.0, 0]].forEach(([i, a, b, d]) => { const h = HOT.make('sugar'); h.stage = 'griddle'; h.flat = i === 2 ? 0 : 1; h.cookA = a; h.cookB = b; h.down = d; h.spoons = 2; h.grp.position.set(R.SPOTS[i].x, P.grid.y, R.SPOTS[i].z); HOT.shape(h); G.titleSet.push(h); });
      const h = HOT.make('sugar'); h.stage = 'tray'; h.flat = 1; h.cookA = 0.95; h.cookB = 0.92; h.cut = 1; h.grp.position.set(P.tray.x, 0.009, P.tray.z); HOT.shape(h); HOT.addScoop(h); HOT.addScoop(h); h.seeds.forEach((s) => { s.delay = 0; s.y = s.ty; s.done = true; }); HOT.updSeeds(h, 0); G.titleSet.push(h);
    }
    G.titleSet.forEach((h) => (h.grp.visible = true));
    R.setSpots(G.gv('griddle'));
  };
  G.hideTitleSet = function () { if (G.titleSet) { G.titleSet.forEach((h) => HOT.dispose(h)); G.titleSet = null; } };
  G.titleCust = function () { // 타이틀에 손님 둘
    Object.values(PEOPLE.ready).forEach((p) => { if (!p.busy) p.root.visible = false; });
    const ids = ['halmae', 'boy'];
    ids.forEach((id, i) => { const p = PEOPLE.ready[id]; if (!p || p.busy) return; p.root.visible = true; p.root.position.set(R.SLOTS[i * 2] * 0.9, -0.9, R.CUST_Z); p.root.rotation.y = i ? -0.2 : 0.2; p.play('idle'); });
  };
  G.hideTitleCust = function () { Object.values(PEOPLE.ready).forEach((p) => { if (!p.busy) p.root.visible = false; }); };

  // 엔딩: 영화제 밤, 손님들이 줄지어 서고 불꽃
  let endT = 0;
  G.ending = function (avg) {
    G.mode = 'ending'; endT = 0; clearAll(); T = null;
    G.endAvg = avg;
    const ps = Object.values(PEOPLE.ready);
    ps.forEach((p, i) => { p.busy = true; p.root.visible = true; const row = i < 3 ? 0 : 1; const col = row ? i - 3 : i; p.root.position.set(row ? -0.75 + col * 0.5 : R.SLOTS[col], -0.9, R.CUST_Z - row * 0.55); p.root.rotation.y = 0; p.play('idle'); });
    // 조리대: 철판엔 노릇한 호떡, 앞엔 씨앗 넘치는 종이컵 줄
    G.endSet = [];
    for (let i = 0; i < 6; i++) { const h = HOT.make('sugar'); h.stage = 'griddle'; h.flat = 1; h.cookA = 0.95; h.cookB = 0.9 + i * 0.02; h.down = i % 2; h.spoons = 2; h.grp.position.set(R.SPOTS[i].x, P.grid.y, R.SPOTS[i].z); HOT.shape(h); G.endSet.push(h); }
    R.setSpots(6);
    for (let i = 0; i < 5; i++) { const cup = R.makeCup(); cup.position.set(-0.4 + i * 0.2, 0, P.front + 0.1); const top = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8, 0, PI * 2, 0, PI / 2), new THREE.MeshStandardMaterial({ map: R.seedTex, roughness: 0.6 })); top.scale.y = 0.55; top.position.y = 0.1; cup.add(top); R.world.add(cup); G.endSet.push({ cup }); }
    UI.show('ending'); SND.fanfare(); R.setSnow(1, true);
    setTimeout(() => UI.endingCard(), 3200);
  };
  function updEnding(dt) {
    endT += dt;
    Object.values(PEOPLE.ready).forEach((p) => { if (p.root.visible) { p.mixer.update(dt); p.root.position.y = -0.9 + Math.max(0, Math.sin(endT * 5 + p.root.position.x * 3)) * 0.04; } });
    if (Math.random() < dt * 2.2) { const x = (Math.random() - 0.5) * 2.4, y = 1.0 + Math.random() * 0.6; R.emit('spark', x, y, -2.5, 40); SND.pop(); }
    SND.sizzle(0);
  }
  G.endHome = function () { Object.values(PEOPLE.ready).forEach((p) => { p.busy = false; p.root.visible = false; }); (G.endSet || []).forEach((x) => (x.cup ? R.world.remove(x.cup) : HOT.dispose(x))); G.endSet = null; };

  // ---------- 시험 손잡이 ----------
  window.__ht = {
    G, get T() { return T; },
    tick(dt, n) { for (let i = 0; i < (n || 1); i++) RND.tick(dt || 1 / 30); },
    start() { G.hideTitleSet(); G.hideTitleCust(); G.startDay(); },
  };
})();
