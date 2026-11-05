// 택배 자리: 선물 꾸러미를 골판지 상자에 → 아이스팩 → 뽁뽁이 → 날개 접기 → 테이프 쭉 → 송장 철썩 → 트럭 출발.
(function () {
  const SH = (window.SHIP = {});
  const PI = Math.PI, V3 = THREE.Vector3;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  let X0 = 0, scene = null;
  const P = {};
  SH.active = false;

  function kraft() {
    return TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#f0d0a8'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(200,150,100,.10)' : 'rgba(255,245,230,.14)'; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    }), [1, 1]);
  }
  let KM = null;
  const km = () => KM || (KM = TOY.mat('#ffffff', { map: kraft(), rough: 0.8 }));

  SH.build = function () {
    X0 = RND.ST.ship; scene = RND.scene;
    // 아이스팩 통(하늘색 아이스박스, 위에 아이스팩이 비죽)
    const co = (P.cooler = new THREE.Group()); co.position.set(X0 - 3.3, 0, 1.3); scene.add(co);
    TOY.mesh(TOY.rbox(1.5, 0.75, 1.0, 0.16), TOY.mat('#bfe6ff', { gloss: 0.6, rough: 0.3 }), 0, 0.375, 0, co);
    TOY.mesh(TOY.rbox(1.56, 0.12, 1.06, 0.06), TOY.mat('#ffffff', { gloss: 0.6, rough: 0.3 }), 0, 0.78, 0, co);
    for (let i = 0; i < 3; i++) { const p = icePack(); p.position.set(-0.4 + i * 0.4, 0.82, 0); p.rotation.z = (i - 1) * 0.25; p.rotation.x = -0.5; co.add(p); }
    co.userData.pick = 'cooler';
    // 뽁뽁이 두루마리
    const br = (P.roll = new THREE.Group()); br.position.set(X0 - 3.3, 0, -1.45); scene.add(br);
    const rl = TOY.mesh(TOY.rcyl(0.42, 1.3, 0.1), TOY.mat('#e8f6ff', { op: 0.85, rough: 0.2, gloss: 1, map: bubbleTex() }), 0, 0.42, 0, br);
    rl.rotation.z = PI / 2;
    TOY.mesh(TOY.rcyl(0.14, 1.34, 0.04), TOY.mat('#e9c49a', { rough: 0.8 }), 0, 0.42, 0, br).rotation.z = PI / 2;
    br.userData.pick = 'roll';
    // 테이프 커터(장식, 상점에서 사면 분홍)
    const td = (P.tdisp = new THREE.Group()); td.position.set(X0 + 2.6, 0, 1.25); scene.add(td);
    TOY.mesh(TOY.rbox(0.9, 0.45, 0.5, 0.14), TOY.mat('#ffb3cb', { gloss: 0.6, rough: 0.3 }), 0, 0.22, 0, td);
    const tr = TOY.mesh(TOY.rcyl(0.3, 0.32, 0.08), TOY.mat('#f3d2a2', { op: 0.9, rough: 0.3, gloss: 0.8 }), 0, 0.55, 0, td);
    tr.rotation.x = PI / 2;
    td.visible = false;
  };
  function icePack() {
    const g = new THREE.Group();
    TOY.mesh(TOY.rbox(0.5, 0.12, 0.36, 0.06), TOY.mat('#7cc8ff', { op: 0.92, gloss: 1, rough: 0.15 }), 0, 0, 0, g);
    TOY.mesh(TOY.rbox(0.36, 0.13, 0.08, 0.03), TOY.mat('#ffffff', { op: 0.8 }), 0, 0, 0.06, g);
    return g;
  }
  function bubbleTex() {
    return TOY.tex(TOY.canvas(128, 128, (g, w, h) => {
      g.fillStyle = '#eaf6ff'; g.fillRect(0, 0, w, h);
      for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); g.fillStyle = 'rgba(160,200,230,.5)'; g.beginPath(); g.arc(x + 1.5, y + 1.5, 6, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x - 1, y - 1, 5, 0, 7); g.fill(); }
    }), [3, 2]);
  }

  let st = null;
  // job: {bundle(상자 묶음), W, D, H, need(아이스팩), dest}
  SH.start = function (job, done) {
    SH.active = true;
    // 상자 높이는 꾸러미(보자기 매듭 포함) 실제 높이에 맞춘다. 고정 높이면 매듭이 날개 위로 삐져나온다
    const bb = new THREE.Box3().setFromObject(job.bundle);
    job.H = bb.max.y - bb.min.y;
    const bw = job.W + 0.75, bd = job.D + 0.75, bh = Math.max(1.15, job.H + 0.09 + 0.15);
    const box = new THREE.Group(); box.position.set(X0 + 1.2, 0, -0.1); scene.add(box);
    const M = km();
    TOY.mesh(TOY.rbox(bw, 0.08, bd, 0.03), M, 0, 0.04, 0, box);
    TOY.mesh(TOY.rbox(bw, bh, 0.06, 0.02), M, 0, bh / 2, bd / 2, box);
    TOY.mesh(TOY.rbox(bw, bh, 0.06, 0.02), M, 0, bh / 2, -bd / 2, box);
    TOY.mesh(TOY.rbox(0.06, bh, bd, 0.02), M, bw / 2, bh / 2, 0, box);
    TOY.mesh(TOY.rbox(0.06, bh, bd, 0.02), M, -bw / 2, bh / 2, 0, box);
    // 날개 넷(열린 채로 바깥으로 젖혀짐)
    const flaps = [];
    [[0, 1, bw, bd / 2], [0, -1, bw, bd / 2], [1, 0, bd, bw / 2], [-1, 0, bd, bw / 2]].forEach(([sx, sz, len, reach], k) => {
      const pv = new THREE.Group(); pv.position.set(sx * bw / 2, bh, sz * bd / 2); pv.rotation.y = Math.atan2(sx, sz); box.add(pv);
      const hinge = new THREE.Group(); pv.add(hinge);
      TOY.mesh(TOY.rbox(len - 0.02, 0.05, reach - 0.02, 0.02), M, 0, 0, -(reach - 0.02) / 2, hinge);
      hinge.rotation.x = -PI * 0.62; // 바깥으로 젖힘
      flaps.push({ hinge, k, long: sz !== 0 });
    });
    box.scale.setScalar(0.01);
    FX.tw(0.4, (u) => box.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
    S('box');
    st = { job, box, bw, bd, bh, flaps, state: 'in', ice: 0, iceObjs: [], done, tape: 0, tapeMesh: null };
    // 꾸러미는 상자 왼쪽에서 기다림
    G.point(job.bundle, job.H + 0.2);
    if (G.gear('tape')) P.tdisp.visible = true;
  };

  function bundleIn() {
    st.state = 'moving'; G.point(null);
    const b = st.job.bundle;
    const to = st.box.position.clone(); to.y = 0.09;
    FX.hop(b, to, 0.45, 1.4, () => {
      st.box.attach(b);
      FX.squash(st.box, 0.15); S('box');
      FX.puff(new V3(to.x, 0.2, to.z), { n: 5, size: 0.2, up: 0.4, speed: 2, spread: 1.2, life: 0.5, op: 0.5 });
      st.state = 'ice'; G.point(P.cooler, 0.9);
    });
  }
  function addIce() {
    // 아이스박스는 두 개씩이지만 주문서 수를 넘기지는 않는다(남은 게 하나면 하나만)
    const n = G.gear('icebox') ? Math.max(1, Math.min(2, st.job.need - st.ice)) : 1;
    for (let j = 0; j < n; j++) {
      const i = st.ice++;
      const p = icePack();
      const from = P.cooler.position.clone().add(new V3(0, 0.9, 0));
      p.position.copy(from); scene.add(p);
      // 상자 안 가장자리에 하나씩
      const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]];
      const c = corners[i % corners.length], lay = Math.floor(i / corners.length);
      const to = st.box.position.clone().add(new V3(c[0] * (st.bw / 2 - 0.3), 0.15 + lay * 0.14, c[1] * (st.bd / 2 - 0.22)));
      const r1 = (Math.random() - 0.5) * 0.5;
      FX.hop(p, to, 0.4, 1.3, () => { FX.squash(p, 0.3); S('plop'); st.box.attach(p); }, FX.ease.lin, j * 0.12);
      FX.tw(0.4, (u) => { p.rotation.y = r1 * u; p.rotation.x = u * PI * 2; }, () => { p.rotation.x = 0; }, FX.ease.out, j * 0.12);
      st.iceObjs.push(p);
    }
    S('whoosh');
    FX.squash(P.cooler, 0.15);
    const need = st.job.need;
    G.onIce && G.onIce(st.ice, need);
    if (st.ice >= need) G.point(P.roll, 0.9);
  }
  function addBubble() {
    st.state = 'bubbling'; G.point(null);
    const b = st.job;
    const m = TOY.mat('#eaf6ff', { op: 0.7, rough: 0.15, gloss: 1, map: bubbleTex() });
    const fill = new THREE.Group(); st.box.add(fill);
    const w = st.bw - 0.12, d = st.bd - 0.12, h = Math.min(st.bh - 0.05, b.H + 0.15);
    // 꾸러미 둘레를 두툼한 뽁뽁이 네 덩이가 감싼다
    const parts = [[0, (d + b.D + 0.3) / 4, w, (d - b.D - 0.3) / 2], [0, -(d + b.D + 0.3) / 4, w, (d - b.D - 0.3) / 2], [(w + b.W + 0.3) / 4, 0, (w - b.W - 0.3) / 2, b.D + 0.3], [-(w + b.W + 0.3) / 4, 0, (w - b.W - 0.3) / 2, b.D + 0.3]];
    parts.forEach(([x, z, pw, pd], i) => {
      const mm = TOY.mesh(TOY.rbox(Math.max(0.1, pw), h * 0.85, Math.max(0.1, pd), 0.08), m, x, h * 0.45, z, fill);
      mm.castShadow = false;
      mm.scale.setScalar(0.01);
      FX.tw(0.25, (u) => mm.scale.setScalar(Math.max(0.01, u)), () => { S('bubble'); FX.squash(mm, 0.3); }, FX.ease.back, i * 0.1);
    });
    // 두루마리가 돌며 풀림
    const rl = P.roll.children[0];
    FX.tw(0.6, (u) => { rl.rotation.x = u * PI * 4; }, null, FX.ease.out);
    FX.squash(P.roll, 0.2);
    FX.wait(0.7, () => { st.state = 'flaps'; G.point(st.box, st.bh + 0.2); });
  }
  function closeFlaps() {
    st.state = 'closing'; G.point(null);
    // 짧은 날개 먼저, 긴 날개 나중
    const order = st.flaps.slice().sort((a, b) => (a.long ? 1 : 0) - (b.long ? 1 : 0));
    order.forEach((f, i) => {
      const r0 = f.hinge.rotation.x, r1 = f.long ? -0.02 : 0.0;
      FX.tw(0.18, (u) => { f.hinge.rotation.x = r0 + (r1 - r0) * u; }, () => { S('fold', 0.8 + i * 0.12); FX.squash(st.box, 0.06); if (i === 3) { f.hinge.position.y = 0.03; startTape(); } }, FX.ease.back, i * 0.16);
      if (f.long) f.hinge.position.y = 0.025;
    });
  }
  function startTape() {
    st.state = 'tape';
    const tm = TOY.mat('#e7c48e', { op: 0.82, gloss: 1, rough: 0.2 });
    const t = (st.tapeMesh = TOY.mesh(TOY.rbox(1, 0.025, 0.32, 0.01), tm, 0, st.bh + 0.07, 0, st.box));
    t.castShadow = false; t.scale.x = 0.001; t.visible = false;
    st.tape = 0;
    G.point(new V3(st.box.position.x - st.bw / 2, st.bh + 0.1, st.box.position.z), 0.2);
  }
  function setTape(k) {
    st.tape = Math.max(st.tape, Math.min(1, k));
    const L = st.bw + 0.12;
    const t = st.tapeMesh; t.visible = st.tape > 0.01;
    t.scale.x = Math.max(0.001, L * st.tape);
    t.position.x = -L / 2 + (L * st.tape) / 2;
  }
  function tapeDone() {
    st.state = 'label'; G.point(null);
    setTape(1); SND.tapeEnd(); S('chop');
    // 양 끝을 옆면으로 꾹
    FX.squash(st.box, 0.12);
    FX.wait(0.25, label);
  }
  function label() {
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.62), new THREE.MeshStandardMaterial({ map: labelTex(st.job.dest), roughness: 0.6 }));
    lb.position.set(st.bw * 0.12, st.bh * 0.52, st.bd / 2 + 0.035);
    st.box.add(lb);
    lb.scale.setScalar(2.2); lb.rotation.z = -0.4;
    S('slap');
    FX.tw(0.14, (u) => { lb.scale.setScalar(2.2 - 1.2 * u); lb.rotation.z = -0.4 + 0.45 * u; }, () => {
      FX.squash(st.box, 0.15); RND.shake(0.05);
      FX.wait(0.35, toTruck);
    }, FX.ease.in);
  }
  function labelTex(dest) {
    return TOY.tex(TOY.canvas(320, 208, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ff7aa8'; g.fillRect(0, 0, w, 44);
      g.fillStyle = '#ffffff'; g.font = "30px 'Ttl','Ui',sans-serif"; g.textBaseline = 'middle'; g.fillText('otteok.com', 14, 24);
      g.fillStyle = '#3a2a3a'; g.font = "44px 'Ttl','Ui',sans-serif"; g.fillText(dest, 16, 88);
      for (let x = 16; x < w - 16; x += 4) { const ww = Math.random() < 0.4 ? 3 : 1.5; g.fillRect(x, 132, ww, 56); }
    }));
  }
  function toTruck() {
    st.state = 'go';
    const box = st.box, tk = cur();
    const back = new V3(tk.position.x - 1.9, 0.0, tk.position.z);
    const mid = new V3((box.position.x + back.x) / 2, 0, (box.position.z + back.z) / 2);
    S('whoosh');
    FX.hop(box, mid, 0.35, 1.0, () => {
      FX.squash(box, 0.25); S('box');
      FX.hop(box, new V3(back.x + 0.6, 1.1, back.z), 0.35, 1.0, () => {
        // 짐칸으로 쏙
        FX.tw(0.2, (u) => { box.scale.setScalar(Math.max(0.01, 1 - u)); box.position.x = back.x + 0.6 + u * 0.8; }, () => {
          scene.remove(box);
          FX.squash(tk.userData.body, 0.15); S('honk');
          FX.wait(0.35, drive);
        }, FX.ease.in);
      });
    });
  }
  function drive() {
    const tk = cur(), x0 = tk.position.x, isAir = tk === RND.plane;
    S('truck');
    let puffT = 0;
    away = true;
    FX.tw(isAir ? 1.8 : 1.4, (u) => {
      tk.position.x = x0 + u * u * (isAir ? 18 : 14);
      if (isAir) { const lift = Math.max(0, u - 0.35) / 0.65; tk.position.y = lift * lift * 7; tk.rotation.z = Math.min(0.35, lift * 0.6); }
      tk.userData.wheels.forEach((w) => { w.rotation.y -= 0.35; });
      tk.userData.body.rotation.z = isAir ? 0 : Math.min(0.06, u * 0.3) * (1 - u);
      puffT += 1;
      if (puffT % 4 === 0) FX.puff(new V3(tk.position.x - 1.9, tk.position.y + 0.4, tk.position.z + 0.4), { n: 1, size: 0.18, up: 0.4, speed: 0.6, life: 0.6, op: 0.7, color: '#f4f0f6' });
    }, () => {
      const res = { ice: st.ice, need: st.job.need, tape: 1 };
      SH.active = false;
      const done = st.done; st = null;
      done(res);
    }, FX.ease.lin);
  }
  // 트럭이 다시 돌아와 자리에 섬
  let away = false, air = false;
  const cur = () => (air ? RND.plane : RND.truck);
  SH.away = () => away;
  // 이번 주문이 해외면 비행기, 아니면 트럭을 길에 둔다
  SH.vehicle = function (a) {
    if (a === air) return;
    air = a;
    const on = cur(), off = a ? RND.truck : RND.plane;
    off.visible = false; on.visible = true;
    if (!away) { on.position.set(RND.ST.truck, 0, 0.6); on.rotation.z = 0; on.scale.setScalar(0.01); FX.tw(0.4, (u) => on.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back); }
  };
  SH.truckBack = function () {
    const tk = cur(), x1 = RND.ST.truck;
    away = false;
    tk.visible = true;
    tk.position.set(x1 + 9, 0, 0.6); tk.rotation.z = 0;
    FX.tw(0.9, (u) => { tk.position.x = x1 + 9 * (1 - u); tk.userData.wheels.forEach((w) => { w.rotation.y += 0.25; }); }, () => FX.squash(tk.userData.body, 0.1), FX.ease.out3);
  };

  let tapeDown = false, tapeLastX = 0, tapeLastT = 0;
  SH.down = function (p) {
    if (!st) return;
    if (st.state === 'in') bundleIn();
    else if (st.state === 'ice') {
      const hit = RND.pick(p.x, p.y, [P.cooler, P.roll]);
      if (hit && hit.obj === P.roll) { if (st.ice > 0) addBubble(); else addIce(); }
      else addIce();
    } else if (st.state === 'flaps') closeFlaps();
    else if (st.state === 'tape') {
      // 자리를 먼저 바꾼다. 0.25초 안에 또 누르면 출발이 두 번 돌아, 두 번째 도착에서 오류가 났다(예전엔 게임이 통째로 멈춤)
      if (G.gear('tape')) { st.state = 'taping'; G.point(null); SND.tapeStart(); SND.tapeMove(6, 1); FX.tw(0.25, (u) => setTape(u), tapeDone); return; }
      tapeDown = true; SND.tapeStart(); tapeLastX = p.x; tapeLastT = performance.now();
      SH.move(p);
    }
  };
  SH.move = function (p) {
    if (!st || st.state !== 'tape' || !tapeDown) return;
    const g = RND.groundAt(p.x, p.y, st.bh);
    if (!g) return;
    const lx = g.x - st.box.position.x;
    const k = (lx + st.bw / 2) / st.bw;
    const now = performance.now(), sp = Math.abs(p.x - tapeLastX) / Math.max(1, now - tapeLastT) * 16;
    tapeLastX = p.x; tapeLastT = now;
    const prev = st.tape;
    setTape(k);
    SND.tapeMove(st.tape > prev ? Math.max(1.5, sp) : 0, st.tape);
    if (st.tape >= 0.94) { tapeDown = false; tapeDone(); }
  };
  SH.up = function () {
    if (tapeDown) { tapeDown = false; SND.tapeEnd(); }
  };
  SH.step = function () {};
  SH.state = () => (st ? st.state : null);
  SH.box = () => (st ? st.box : null);
})();
