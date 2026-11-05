// 2장부터 나오는 떡의 만들기 동작: 꿀 넣기(꿀떡) · 떡살 찍기(절편) · 뽑기(가래떡) · 체치기(백설기) · 딸기 감싸기(딸기찹쌀떡).
// make.js 의 자리·도구(MAKE._)를 함께 쓴다.
(function () {
  const PI = Math.PI, V3 = THREE.Vector3;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  const MX = (MAKE.extra = {});
  const I = () => MAKE._; // { P, X0, scene, toTray, judge }

  // ======================================================
  // 꿀 넣기 (꿀떡): 컨베이어 위 반죽 컵이 꿀 통 아래 올 때 클릭
  // ======================================================
  MX.fill = function (job, done) {
    const { P, X0, scene, toTray, judge } = I();
    const N = job.n, cols = DATA.DDEOK.kkuldduk.cols;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    const g = new THREE.Group(); scene.add(g);
    const beltTex = TOY.tex(TOY.canvas(128, 32, (q, w, h) => { q.fillStyle = '#c4cee0'; q.fillRect(0, 0, w, h); q.fillStyle = '#dde4f0'; for (let x = 0; x < w; x += 32) q.fillRect(x, 0, 14, h); }), [6, 1]);
    TOY.mesh(TOY.rbox(3.2, 0.08, 0.7, 0.04), TOY.mat('#ffffff', { map: beltTex, rough: 0.6 }), c.x, c.y + 0.04, c.z, g);
    const jar = new THREE.Group(); jar.position.set(c.x, c.y + 1.7, c.z); g.add(jar);
    TOY.mesh(TOY.rcyl(0.32, 0.5, 0.12), TOY.mat('#ffd45a', { op: 0.85, gloss: 1, rough: 0.15 }), 0, 0.15, 0, jar);
    TOY.mesh(TOY.rcyl(0.34, 0.12, 0.05), TOY.mat('#ff9ec0', { gloss: 0.5 }), 0, 0.45, 0, jar);
    const nz = TOY.mesh(new THREE.ConeGeometry(0.1, 0.25, 14), TOY.mat('#ffc23a', { gloss: 0.8 }), 0, -0.2, 0, jar); nz.rotation.x = PI;
    const mark = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 32), new THREE.MeshBasicMaterial({ color: '#ffb627', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    mark.rotation.x = -PI / 2; mark.position.set(c.x, c.y + 0.09, c.z); mark.renderOrder = 4; g.add(mark);
    const cupG = new THREE.SphereGeometry(0.2, 22, 12, 0, PI * 2, PI / 2, PI / 2);
    const cups = [];
    const SP = 0.62, LOOP = Math.max(N, 5) * SP + 0.6;
    for (let i = 0; i < N; i++) {
      const col = cols[i % cols.length];
      const cup = TOY.mesh(cupG, TOY.mat(col, { rough: 0.45, side: true, emis: 0.1 }), 0, c.y + 0.28, c.z, g);
      cups.push({ m: cup, off: i * SP, filled: false, col });
    }
    let t = 0, speed = 0.9, drops = [], filledN = 0, perf = 0, miss = 0, finished = false, cool = 0;
    G.point(jar, 0.6);
    const cupX = (k) => c.x + (((k.off + t * speed) % LOOP) - LOOP / 2);
    function drop() {
      if (cool > 0 || finished) return;
      cool = 0.22;
      const d = TOY.mesh(new THREE.SphereGeometry(0.09, 12, 10), TOY.mat('#ffc23a', { gloss: 1, rough: 0.1, emis: 0.2 }), c.x, c.y + 1.4, c.z, g);
      d.scale.set(1, 1.3, 1);
      drops.push({ m: d, v: 0 });
      S('plop'); FX.squash(jar, 0.15);
    }
    function land(d) {
      let best = null, bd = 9;
      cups.forEach((k) => { if (k.filled) return; const dx = Math.abs(cupX(k) - c.x); if (dx < bd) { bd = dx; best = k; } });
      g.remove(d.m);
      if (best && bd < 0.22 * (G.gear('nozzle') ? 1.4 : 1)) {
        const q = bd < 0.08 * (G.gear('nozzle') ? 1.6 : 1) ? 1 : 0.65;
        best.filled = true; filledN++; if (q >= 1) perf++;
        const ball = DDEOK.kkuldduk(best.col);
        ball.position.set(cupX(best), c.y + 0.1, c.z); g.add(ball);
        best.ball = ball; best.m.visible = false;
        ball.scale.setScalar(0.4);
        FX.tw(0.25, (u) => ball.scale.setScalar(0.4 + 0.6 * u), () => { FX.setBase(ball); FX.squash(ball, 0.3); }, FX.ease.back);
        FX.burst(new V3(cupX(best), c.y + 0.5, c.z), { n: 6, color: ['#ffd45a', '#fff3a0'], size: 0.06, speed: 1.4, up: 2, glow: true });
        judge(new V3(c.x, c.y + 1.1, c.z), q); S('pop', 1.1);
        if (filledN >= N) finish();
      } else {
        miss++;
        const pud = TOY.mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshStandardMaterial({ color: '#ffc23a', transparent: true, opacity: 0.85, roughness: 0.2 }), c.x, c.y + 0.09, c.z, g);
        pud.rotation.x = -PI / 2; pud.castShadow = false;
        FX.tw(1.2, (u) => { pud.material.opacity = 0.85 * (1 - u); }, () => g.remove(pud));
        judge(new V3(c.x, c.y + 1.1, c.z), 0.2); S('squish');
      }
    }
    function finish() {
      finished = true; G.point(null);
      const q = Math.max(0.3, (perf + (filledN - perf) * 0.65) / N - miss * 0.06);
      FX.wait(0.5, () => {
        const out = [];
        cups.forEach((k) => { const b = k.ball; const wp = b.getWorldPosition(new V3()); scene.add(b); b.position.copy(wp); b.userData.q = q; out.push(b); });
        FX.tw(0.3, (u) => g.scale.setScalar(Math.max(0.01, 1 - u)), () => scene.remove(g));
        let left = out.length;
        out.forEach((b, i) => FX.wait(i * 0.07, () => toTray(b, () => { if (--left === 0) done(out); })));
      });
    }
    return {
      step(dt) {
        if (finished) return;
        t += dt; cool -= dt;
        beltTex.offset.x -= dt * speed * 0.3;
        cups.forEach((k) => { const x = cupX(k); if (k.filled) { if (k.ball) k.ball.position.x = x; } else k.m.position.x = x; });
        for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.v += 14 * dt; d.m.position.y -= d.v * dt; if (d.m.position.y <= c.y + 0.32) { drops.splice(i, 1); land(d); } }
        speed = 0.9 + filledN * 0.06;
      },
      // 꿀이 떨어지는 데 약 0.33초: 그만큼 앞서 누르면 맞음
      info() { let bd = 9; cups.forEach((k) => { if (!k.filled) { let x = cupX(k) + speed * 0.33; if (x > c.x + LOOP / 2) x -= LOOP; bd = Math.min(bd, Math.abs(x - c.x)); } }); return { kind: 'fill', c, near: bd < 0.05 && cool <= 0, finished }; },
      down() { drop(); },
    };
  };

  // ======================================================
  // 떡살 찍기 (절편): 오가는 떡 띠의 칸이 떡살 아래 올 때 클릭
  // ======================================================
  MX.stamp = function (job, done) {
    const { P, X0, scene, toTray, judge } = I();
    const N = job.n, col = DATA.DDEOK.jeolpyeon.cols[(Math.random() * 2) | 0];
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    const g = new THREE.Group(); scene.add(g);
    const SEG = 0.56, L = SEG * N;
    const strip = new THREE.Group(); g.add(strip); strip.position.set(c.x, c.y, c.z);
    TOY.mesh(TOY.rbox(L, 0.13, 0.52, 0.05), TOY.ddeok(col, { emis: 0.1 }), 0, 0.065, 0, strip);
    const segs = [];
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + SEG * (i + 0.5);
      if (i > 0) { const ln = TOY.mesh(TOY.rbox(0.02, 0.01, 0.5, 0.005), TOY.basic('#e8a5bd', 0.7), x - SEG / 2, 0.135, 0, strip); ln.castShadow = false; }
      const top = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.42), new THREE.MeshStandardMaterial({ map: DDEOK.jeolTex(col), roughness: 0.7, transparent: true, opacity: 0 }));
      top.rotation.x = -PI / 2; top.position.set(x, 0.137, 0); strip.add(top);
      segs.push({ x, top, done: false });
    }
    const st = new THREE.Group(); st.position.set(c.x, c.y + 1.1, c.z); g.add(st);
    TOY.mesh(TOY.rbox(0.5, 0.18, 0.5, 0.06), TOY.mat('#e9bf8e', { rough: 0.5, gloss: 0.2 }), 0, 0, 0, st);
    TOY.mesh(TOY.rcyl(0.09, 0.6, 0.04), TOY.mat('#f3cfa6'), 0, 0.38, 0, st);
    TOY.mesh(new THREE.SphereGeometry(0.13, 14, 10), TOY.mat('#ff9ec0', { gloss: 0.5 }), 0, 0.7, 0, st);
    const mark = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.33, 4, 1, PI / 4), new THREE.MeshBasicMaterial({ color: '#ff7aa8', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    mark.rotation.x = -PI / 2; mark.position.set(c.x, c.y + 0.15, c.z); mark.renderOrder = 4; g.add(mark);
    let t = 0, busy = false, doneN = 0, qs = [], finished = false;
    G.point(st, 0.8);
    const stripX = () => Math.sin(t * (1.0 + doneN * 0.07)) * (L / 2 + 0.1);
    function hit() {
      if (busy || finished) return;
      busy = true;
      FX.tw(0.07, (u) => { st.position.y = c.y + 1.1 - (1.1 - 0.23) * u; }, () => {
        S('thud', 0.7); RND.shake(0.05); FX.squash(strip, 0.12);
        const sx = strip.position.x - c.x;
        let best = null, bd = 9;
        segs.forEach((sg) => { if (sg.done) return; const d = Math.abs(sg.x + sx); if (d < bd) { bd = d; best = sg; } });
        if (best && bd < 0.2) {
          const q = bd < 0.06 * (G.gear('press') ? 1.7 : 1) ? 1 : 0.65;
          best.done = true; doneN++; qs.push(q);
          best.top.material.opacity = 1;
          FX.burst(new V3(c.x, c.y + 0.4, c.z), { n: 6, kind: 'star', color: ['#fff3a0', '#ffd1e0'], size: 0.14, speed: 1.6, up: 2, glow: true });
          judge(new V3(c.x, c.y + 1.3, c.z), q);
        } else { judge(new V3(c.x, c.y + 1.3, c.z), 0.2); qs.push(0); }
        FX.tw(0.2, (u) => { st.position.y = c.y + 0.23 + (1.1 - 0.23) * u; }, () => { busy = false; if (doneN >= N) cutUp(); }, FX.ease.out);
      }, FX.ease.in);
    }
    function cutUp() {
      finished = true; G.point(null);
      const x0 = strip.position.x;
      FX.tw(0.3, (u) => { strip.position.x = x0 + (c.x - x0) * u; }, () => {
        const q = Math.max(0.3, qs.reduce((a, b) => a + b, 0) / qs.length);
        g.remove(st); g.remove(mark);
        const kn = P.knife; kn.visible = true; kn.rotation.set(0, 0, 0);
        let k = 1;
        const chopNext = () => {
          if (k >= N) {
            kn.visible = false;
            const out = [];
            segs.forEach((sg) => { const pc = DDEOK.jeolpyeon(col, true); pc.position.set(c.x + sg.x, c.y, c.z); pc.userData.q = q; scene.add(pc); out.push(pc); });
            scene.remove(g);
            let left = N; out.forEach((pc, i) => FX.wait(0.15 + i * 0.07, () => toTray(pc, () => { if (--left === 0) done(out); })));
            return;
          }
          const x = c.x - L / 2 + SEG * k; k++;
          kn.position.set(x, c.y + 0.9, c.z);
          FX.tw(0.06, (u) => { kn.position.y = c.y + 0.9 - 0.62 * u; }, () => { S('chop'); FX.tw(0.1, (u) => { kn.position.y = c.y + 0.28 + 0.62 * u; }, chopNext); }, FX.ease.in);
        };
        chopNext();
      });
    }
    return {
      step(dt) { if (!finished) { t += dt; strip.position.x = c.x + stripX(); } },
      info() { const sx = strip.position.x - c.x; let bd = 9; segs.forEach((sg) => { if (!sg.done) bd = Math.min(bd, Math.abs(sg.x + sx)); }); return { kind: 'stamp', c, near: bd < 0.035 && !busy, finished }; },
      down() { hit(); },
    };
  };

  // ======================================================
  // 뽑기 (가래떡): 기계에서 나오는 기둥이 분홍 표시에 닿을 때 자르기
  // ======================================================
  MX.extrude = function (job, done) {
    const { P, X0, scene, toTray, judge } = I();
    const N = job.n;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    const g = new THREE.Group(); scene.add(g);
    const mx = new THREE.Group(); mx.position.set(c.x - 1.5, c.y, c.z); g.add(mx);
    TOY.mesh(TOY.rbox(0.8, 1.0, 0.8, 0.2), TOY.mat('#c8e6ff', { gloss: 0.6, rough: 0.3 }), 0, 0.5, 0, mx);
    TOY.mesh(TOY.rbox(0.84, 0.16, 0.84, 0.08), TOY.mat('#ffffff', { gloss: 0.6 }), 0, 1.05, 0, mx);
    const noz = TOY.mesh(TOY.rcyl(0.17, 0.2, 0.05), TOY.mat('#ff9ec0', { gloss: 0.5 }), 0.45, 0.25, 0, mx); noz.rotation.z = PI / 2;
    TOY.mesh(new THREE.SphereGeometry(0.09, 12, 10), TOY.mat('#ff5a7a', { emis: 0.5 }), -0.2, 0.75, 0.41, mx);
    const LEN = 0.7, TIP0 = c.x - 1.05, target = TIP0 + LEN + 0.05;
    const mark = TOY.mesh(TOY.rbox(0.05, 0.02, 0.62, 0.01), TOY.basic('#ff7aa8', 0.95), target, c.y + 0.03, c.z, g); mark.castShadow = false;
    let rod = null, len = 0, k = 0, speed = 0.85, qs = [], out = [], finished = false, busy = false;
    function newRod() {
      rod = TOY.mesh(TOY.rcyl(0.11, 1, 0.05, 20), TOY.ddeok('#fbf8f1', { emis: 0.12, rough: 0.5 }), TIP0, c.y + 0.25, c.z, g);
      rod.rotation.z = PI / 2; len = 0.01; setLen(); FX.squash(mx, 0.12);
    }
    function setLen() { rod.scale.y = Math.max(0.01, len); rod.position.x = TIP0 + len / 2; }
    function cut() {
      if (busy || finished || !rod) return;
      busy = true;
      const tip = TIP0 + len, d = Math.abs(tip - target);
      const rw = G.gear('ruler') ? 1.7 : 1;
      const q = d < 0.06 * rw ? 1 : d < 0.18 * rw ? 0.65 : 0.3;
      const kn = P.knife; kn.visible = true; kn.rotation.set(0, 0, 0); kn.position.set(TIP0 + 0.02, c.y + 1.0, c.z);
      FX.tw(0.06, (u) => { kn.position.y = c.y + 1.0 - 0.62 * u; }, () => {
        S('chop'); judge(new V3(target, c.y + 1.0, c.z), q); qs.push(q);
        const pc = DDEOK.garaetteok(Math.max(0.3, len));
        pc.position.set(TIP0 + len / 2, c.y + 0.14, c.z); scene.add(pc); out.push(pc);
        g.remove(rod); rod = null;
        FX.to(pc, new V3(pc.position.x + 0.2, c.y, c.z + 0.6), 0.25, () => FX.squash(pc, 0.3), FX.ease.out);
        if (q >= 1) FX.burst(new V3(target, c.y + 0.4, c.z), { n: 5, kind: 'star', color: ['#fff3a0', '#ffffff'], size: 0.14, speed: 1.5, up: 2, glow: true });
        FX.tw(0.12, (u) => { kn.position.y = c.y + 0.38 + 0.62 * u; }, () => {
          kn.visible = false; busy = false; k++;
          if (k >= N) finish(); else { speed += 0.07; FX.wait(0.2, newRod); }
        });
      }, FX.ease.in);
    }
    function finish() {
      finished = true; G.point(null);
      const q = qs.reduce((a, b) => a + b, 0) / N;
      FX.tw(0.3, (u) => g.scale.setScalar(Math.max(0.01, 1 - u)), () => scene.remove(g));
      let left = out.length; out.forEach((pc, i) => { pc.userData.q = q; FX.wait(0.2 + i * 0.07, () => toTray(pc, () => { if (--left === 0) done(out); })); });
    }
    newRod(); S('steam');
    G.point(mark, 0.4);
    return {
      step(dt) {
        if (finished || !rod || busy) return;
        len += dt * speed; setLen();
        if (Math.random() < dt * 6) FX.puff(new V3(TIP0, c.y + 0.4, c.z), { n: 1, size: 0.12, up: 0.8, life: 0.6, op: 0.6 });
        if (TIP0 + len > target + 0.55) cut();
      },
      info() { return { kind: 'extrude', c, near: !!rod && !busy && Math.abs(TIP0 + len + speed * 0.06 - target) < 0.03, finished }; },
      down() { cut(); },
    };
  };

  // ======================================================
  // 체치기 (백설기): 꾹 누르면 쌀가루가 쌓임, 초록 칸에서 떼기(세 겹) → 찌기 → 썰기
  // ======================================================
  MX.sift = function (job, done) {
    const { P, X0, scene, toTray, judge } = I();
    const N = job.n;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    const sr = P.siru; sr.visible = true; sr.scale.setScalar(0.01);
    FX.tw(0.35, (u) => sr.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
    const sv = new THREE.Group(); sv.position.set(c.x, c.y + 1.4, c.z); scene.add(sv);
    TOY.mesh(TOY.rcyl(0.62, 0.22, 0.06), TOY.mat('#e9bf8e', { rough: 0.5 }), 0, 0, 0, sv);
    const net = TOY.mesh(new THREE.CircleGeometry(0.56, 32), TOY.mat('#fffaf0', { rough: 1, side: true }), 0, -0.08, 0, sv); net.rotation.x = PI / 2;
    const cake = TOY.mesh(TOY.rbox(1.1, 1, 1.1, 0.05, 2), TOY.ddeok('#ffffff', { map: TOY.dustTex('#fffdf6', ['#ffffff', '#f3eee2'], 3000), rough: 0.9 }), c.x, c.y + 0.1, c.z, scene);
    cake.scale.y = 0.01;
    let layerI = 0, level = 0, holding = false, state = 'wait', qs = [], wob = 0;
    const PER = 0.14;
    // 높이 막대(오른쪽): 초록 칸 = 이번 겹 목표
    const bar = new THREE.Group(); bar.position.set(c.x + 0.95, c.y, c.z + 0.25); scene.add(bar);
    const H = 0.9, SC = H / (PER * 3 + 0.08);
    TOY.mesh(TOY.rbox(0.18, H, 0.18, 0.07), TOY.mat('#ffffff', { gloss: 0.4 }), 0, H / 2, 0, bar);
    const zone = TOY.mesh(TOY.rbox(0.21, 0.06 * SC, 0.21, 0.04), TOY.mat('#7ff0b0', { emis: 0.3 }), 0, 0, 0, bar);
    const fillB = TOY.mesh(TOY.rbox(0.14, 1, 0.14, 0.03), TOY.mat('#ff7aa8', { emis: 0.2 }), 0, 0, 0, bar);
    function setBar() { fillB.scale.y = Math.max(0.01, level * SC); fillB.position.y = fillB.scale.y / 2; zone.position.y = (layerI + 1) * PER * SC; }
    const zoneOk = () => Math.abs(level - (layerI + 1) * PER) < 0.02;
    setBar();
    G.point(sv, 0.4);
    function release() {
      holding = false;
      const tgt = (layerI + 1) * PER, d = Math.abs(level - tgt);
      const sw = G.gear('scale') ? 1.7 : 1;
      const q = d < 0.025 * sw ? 1 : d < 0.06 * sw ? 0.65 : 0.3;
      qs.push(q); judge(new V3(c.x, c.y + 1.9, c.z), q);
      level = q >= 1 ? tgt : tgt + (level - tgt) * 0.5;
      cake.scale.y = level; cake.position.y = c.y + 0.08 + level / 2;
      FX.squash(sv, 0.2);
      layerI++;
      if (layerI >= 3) { state = 'steam'; G.point(null); scene.remove(sv); scene.remove(bar); FX.wait(0.3, steam); }
      else setBar();
    }
    function steam() {
      const lid = P.lid; lid.visible = true; lid.position.set(c.x, c.y + 2.2, c.z);
      FX.to(lid, new V3(c.x, c.y + 0.58, c.z), 0.25, () => {
        FX.squash(lid, 0.3); S('lid');
        let n = 0;
        const iv = () => { if (n++ < 8) { FX.puff(new V3(c.x + (Math.random() - 0.5) * 0.8, c.y + 0.8, c.z + (Math.random() - 0.5) * 0.8), { n: 3, size: 0.28, up: 1.6, life: 1.0, op: 0.8 }); S('steam'); FX.wait(0.18, iv); } else open(); };
        iv();
      }, FX.ease.in);
    }
    function open() {
      FX.to(P.lid, new V3(c.x + 1.2, c.y + 1.8, c.z - 0.6), 0.35, () => { P.lid.visible = false; }, FX.ease.out);
      const q = qs.reduce((a, b) => a + b, 0) / qs.length;
      const cx = Math.min(4, N), rows = Math.ceil(N / cx);
      const kn = P.knife; kn.visible = true;
      const lines = [];
      for (let a = 1; a < cx; a++) lines.push(['x', -0.55 + (1.1 * a) / cx]);
      for (let b = 1; b < rows; b++) lines.push(['z', -0.55 + (1.1 * b) / rows]);
      let ci = 0;
      const doCut = () => {
        if (ci >= lines.length) {
          kn.visible = false; kn.rotation.y = 0;
          scene.remove(cake);
          const out = [];
          for (let n = 0; n < N; n++) { const pc = DDEOK.baekseolgi(); const a = n % cx, b = Math.floor(n / cx); pc.position.set(c.x - 0.55 + (a + 0.5) * (1.1 / cx), c.y, c.z - 0.55 + (b + 0.5) * (1.1 / rows)); pc.scale.setScalar(Math.min(1, 1.9 / Math.max(cx, rows)) * 0.9); pc.userData.q = q; scene.add(pc); out.push(pc); }
          FX.tw(0.3, (u) => sr.scale.setScalar(Math.max(0.01, 1 - u)), () => { sr.visible = false; });
          let left = N; out.forEach((pc, i) => FX.wait(0.25 + i * 0.08, () => toTray(pc, () => { if (--left === 0) done(out); })));
          return;
        }
        const [ax, v] = lines[ci++];
        kn.rotation.y = ax === 'x' ? 0 : PI / 2;
        kn.position.set(c.x + (ax === 'x' ? v : 0), c.y + 1.4, c.z + (ax === 'z' ? v : 0));
        FX.tw(0.08, (u) => { kn.position.y = c.y + 1.4 - 0.75 * u; }, () => { S('chop'); FX.squash(cake, 0.08); FX.tw(0.12, (u) => { kn.position.y = c.y + 0.65 + 0.75 * u; }, doCut); }, FX.ease.in);
      };
      FX.wait(0.3, doCut);
    }
    return {
      step(dt) {
        if (state !== 'wait') return;
        wob += dt;
        sv.position.x = c.x + Math.sin(wob * 3) * 0.08; sv.rotation.z = Math.sin(wob * 6) * (holding ? 0.06 : 0.02);
        if (holding) {
          level += dt * 0.15;
          cake.scale.y = Math.max(0.01, level); cake.position.y = c.y + 0.08 + level / 2;
          if (Math.random() < dt * 30) FX.burst(new V3(c.x + (Math.random() - 0.5) * 0.9, c.y + 1.25, c.z + (Math.random() - 0.5) * 0.9), { n: 1, color: ['#ffffff'], size: 0.04, speed: 0.1, up: -0.5, g: 6, life: 0.5 });
          if (Math.random() < dt * 6) S('powder');
          setBar();
          if (level > (layerI + 1) * PER + 0.08) release();
        }
      },
      info() { return { kind: 'sift', c, state, zone: zoneOk() }; },
      down() { if (state === 'wait') { holding = true; S('powder'); } },
      up() { if (holding && state === 'wait') release(); },
    };
  };

  // ======================================================
  // 딸기 감싸기 (딸기찹쌀떡): 오가는 딸기를 반죽 위에 떨어뜨리고, 꾹 눌러 감싸 초록에서 떼기
  // ======================================================
  MX.berry = function (job, done) {
    const { P, X0, scene, toTray, judge } = I();
    const N = job.n;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    let i = 0, st = 'move', t = 0, bm = null, disc = null, k = 0, holding = false, out = [], qDrop = 1, piece = null;
    const Z0 = 0.86, Z1 = 1.02;
    function spawn() {
      disc = TOY.mesh(new THREE.SphereGeometry(0.4, 24, 12, 0, PI * 2, PI * 0.42, PI * 0.58), TOY.ddeok('#fffaf4', { emis: 0.14 }), c.x, c.y + 0.12, c.z, scene);
      disc.scale.set(1, 0.3, 1);
      bm = DDEOK.berry(); bm.position.set(c.x, c.y + 1.5, c.z); scene.add(bm);
      st = 'move'; t = Math.random() * 3; k = 0;
      G.point(bm, 0.6);
    }
    function drop() {
      st = 'drop'; G.point(null);
      const off = bm.position.x - c.x, d = Math.abs(off);
      qDrop = d < 0.07 ? 1 : d < 0.2 ? 0.65 : 0.3;
      const fx = qDrop >= 1 ? 0 : Math.max(-0.2, Math.min(0.2, off));
      FX.to(bm, new V3(c.x + fx, c.y + 0.05, c.z), 0.2, () => {
        S('plop'); judge(new V3(c.x, c.y + 1.2, c.z), qDrop);
        scene.remove(bm); scene.remove(disc);
        piece = DDEOK.ddalgi(0.15); piece.position.set(c.x + fx * 0.5, c.y, c.z); scene.add(piece);
        FX.squash(piece, 0.3);
        st = 'wrap'; G.point(piece, 0.7);
      }, FX.ease.in);
    }
    function finishOne() {
      holding = false; st = 'done'; G.point(null);
      let q;
      if (k >= Z0 && k <= Z1) { q = 1; piece.userData.setWrap(1); S('pop', 1.2); FX.burst(new V3(c.x, c.y + 0.7, c.z), { n: 6, kind: 'heart', color: ['#ff8fb1', '#ffffff'], size: 0.15, speed: 1.6, up: 2, glow: true }); }
      else if (k > Z1) { q = 0.3; S('burst'); FX.burst(new V3(c.x, c.y + 0.4, c.z), { n: 10, color: ['#ff4f63', '#ffffff'], size: 0.05, speed: 2, up: 2.5, floor: P.bTop }); piece.userData.setWrap(1); }
      else { q = 0.6; piece.userData.setWrap(Math.max(0.6, k)); }
      judge(new V3(c.x, c.y + 1.2, c.z), q);
      piece.userData.q = (q + qDrop) / 2;
      const p = piece; piece = null; out.push(p);
      FX.squash(p, 0.3);
      FX.wait(0.25, () => toTray(p, () => {}));
      i++;
      FX.wait(0.55, () => { if (i < N) spawn(); else FX.wait(0.35, () => done(out)); });
    }
    spawn();
    return {
      step(dt) {
        if (st === 'move') { t += dt * (1.8 + i * 0.22); bm.position.x = c.x + Math.sin(t) * 1.1; bm.rotation.y += dt * 2; }
        else if (st === 'wrap' && holding) { k += dt * 0.7; piece.userData.setWrap(Math.min(1.08, 0.15 + k * 0.85)); if (Math.random() < dt * 8) S('squeeze', k); if (k >= 1.12) finishOne(); }
      },
      info() { return { kind: 'berry', c, st, off: bm && st === 'move' ? bm.position.x - c.x : 9, zone: k >= Z0 + 0.03 && k <= Z1 - 0.03 }; },
      down() { if (st === 'move') drop(); else if (st === 'wrap') { holding = true; S('squish'); } },
      up() { if (st === 'wrap' && holding) { if (k < 0.2) { holding = false; return; } finishOne(); } },
    };
  };
})();
