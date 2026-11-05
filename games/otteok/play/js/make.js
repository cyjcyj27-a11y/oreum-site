// 만들기 자리: 떡판·떡메·칼·콩고물 쟁반·시루·다 된 떡 쟁반.
// 떡마다 손맛 동작: 메치기(인절미) · 빚기(송편) · 쌓기(무지개떡).
(function () {
  const MK = (window.MAKE = {});
  const PI = Math.PI, V3 = THREE.Vector3;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  let X0 = 0, scene = null;
  const P = {}; // 고정 물건

  // ---------- 물건 ----------
  MK.build = function () {
    X0 = RND.ST.make; scene = RND.scene;
    MK._ = { P, X0, scene, toTray, judge };
    const M = TOY.mat;
    // 떡판: 두꺼운 나무 판
    P.board = TOY.mesh(TOY.rbox(3.4, 0.24, 2.3, 0.12), M('#ffffff', { rough: 0.6, map: boardTex() }), X0 - 0.2, 0.12, -0.15, scene);
    P.bTop = 0.24;
    // 떡메: 머리(둥근 통) + 자루
    const mal = (P.mallet = new THREE.Group());
    const head = TOY.mesh(TOY.rcyl(0.36, 1.0, 0.12), M('#ffffff', { rough: 0.5, gloss: 0.3, map: endGrain() }), 0, 0, 0, mal);
    head.rotation.x = PI / 2;
    TOY.mesh(TOY.rcyl(0.38, 0.08, 0.03), M('#ff9ec0', { gloss: 0.5 }), 0, 0, 0.42, mal).rotation.x = PI / 2;
    TOY.mesh(TOY.rcyl(0.38, 0.08, 0.03), M('#ff9ec0', { gloss: 0.5 }), 0, 0, -0.42, mal).rotation.x = PI / 2;
    const handle = TOY.mesh(TOY.rcyl(0.09, 2.0, 0.08), M('#f3cfa6', { gloss: 0.2 }), 0.95, 0.3, 0, mal);
    handle.rotation.z = -PI / 2 + 0.3;
    mal.userData.rest = new V3(X0 + 1.2, 1.9, -0.1);
    mal.position.copy(mal.userData.rest); mal.rotation.z = 0.5;
    scene.add(mal);
    // 칼
    const kn = (P.knife = new THREE.Group());
    TOY.mesh(TOY.rbox(0.06, 0.62, 1.15, 0.03), M('#eef3f8', { rough: 0.2, gloss: 1 }), 0, 0, 0, kn);
    TOY.mesh(TOY.rbox(0.16, 0.2, 0.7, 0.08), M('#ff9ec0', { gloss: 0.5 }), 0, 0.22, 0.85, kn);
    kn.visible = false; scene.add(kn);
    // 콩고물 쟁반
    const kt = (P.kong = new THREE.Group()); kt.position.set(X0 - 2.65, 0, 1.0); scene.add(kt);
    TOY.mesh(TOY.rbox(1.9, 0.22, 1.3, 0.1), M('#bfe3ff', { gloss: 0.5 }), 0, 0.11, 0, kt);
    const pw = TOY.mesh(TOY.rbox(1.68, 0.06, 1.08, 0.03), M('#ffffff', { rough: 1, map: TOY.dustTex('#f0d27e', ['#e3bb62', '#f7e2a0', '#ddb35a'], 5000) }), 0, 0.22, 0, kt);
    pw.castShadow = false;
    kt.userData.pick = 'kong';
    // 시루(무지개떡): 네모 나무 틀
    const sr = (P.siru = new THREE.Group()); sr.position.set(X0 - 0.2, P.bTop, -0.15); scene.add(sr);
    const wm = M('#f6d2a8', { rough: 0.55, gloss: 0.2 });
    [[0, 0.63], [0, -0.63]].forEach(([x, z]) => TOY.mesh(TOY.rbox(1.42, 0.5, 0.14, 0.05), wm, x, 0.25, z, sr));
    [[0.63, 0], [-0.63, 0]].forEach(([x, z]) => TOY.mesh(TOY.rbox(0.14, 0.5, 1.12, 0.05), wm, x, 0.25, z, sr));
    sr.visible = false;
    P.lid = TOY.mesh(TOY.rbox(1.5, 0.16, 1.5, 0.07), M('#ffd0de', { gloss: 0.4 }), 0, 0, 0, scene);
    TOY.mesh(new THREE.SphereGeometry(0.13, 14, 10), M('#ff9ec0', { gloss: 0.5 }), 0, 0.14, 0, P.lid);
    P.lid.visible = false;
    // 다 된 떡 쟁반
    newTray();
    // 고리(메치기 박자·빚기 눌림)
    const rg = new THREE.RingGeometry(0.93, 1, 64);
    P.ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
    P.ring.rotation.x = -PI / 2; P.ring.renderOrder = 4; P.ring.visible = false; scene.add(P.ring);
    P.target = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 64), new THREE.MeshBasicMaterial({ color: '#ff7aa8', transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    P.target.rotation.x = -PI / 2; P.target.renderOrder = 4; P.target.visible = false; scene.add(P.target);
    // 빚기 눌림 막대(호 모양)
    P.gauge = new THREE.Group(); P.gauge.visible = false; scene.add(P.gauge);
  };
  function boardTex() {
    return TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#fff0de'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(210,150,100,.22)'; g.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const y = (i / 18) * h + Math.random() * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 8, w * 0.7, y - 8, w, y); g.stroke(); }
    }));
  }
  function endGrain() {
    return TOY.tex(TOY.canvas(128, 128, (g, w, h) => {
      g.fillStyle = '#f8dcbc'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(190,130,80,.35)'; g.lineWidth = 2;
      for (let r = 8; r < 64; r += 8) { g.beginPath(); g.arc(64, 64, r, 0, 7); g.stroke(); }
    }));
  }
  function newTray() {
    const t = (P.tray = new THREE.Group());
    t.position.set(X0 + 2.55, 0, 1.05); scene.add(t);
    TOY.mesh(TOY.rbox(1.8, 0.14, 1.35, 0.08), TOY.mat('#ffffff', { gloss: 0.6, rough: 0.3 }), 0, 0.07, 0, t);
    TOY.mesh(TOY.rbox(1.62, 0.04, 1.17, 0.04), TOY.mat('#ffeaf1', { rough: 0.8 }), 0, 0.15, 0, t).castShadow = false;
    t.userData.items = [];
    return t;
  }
  // 쟁반 위 n 번째 자리
  function traySlot(i) { const c = i % 4, r = Math.floor(i / 4); return new V3(-0.6 + c * 0.4, 0.17, -0.34 + r * 0.42 + (r > 1 ? 0 : 0)); }
  function toTray(piece, done) {
    const t = P.tray, i = t.userData.items.length;
    t.userData.items.push(piece);
    const wp = new V3(); piece.getWorldPosition(wp);
    t.add(piece); t.worldToLocal(wp); piece.position.copy(wp);
    const to = traySlot(i);
    const ty = piece.userData.type, sc = { injeolmi: 0.62, songpyeon: 0.56, mujigae: 0.72, kkuldduk: 0.8, jeolpyeon: 0.62, garaetteok: 0.62, baekseolgi: 0.62, ddalgi: 0.62 }[ty] || 0.65;
    // 가래떡은 긴 떡이라 쟁반에서 끝끼리 붙어 한 줄로 보인다: 세로로 눕혀 칸마다 띄운다.
    // 굵기는 조각마다 같아야 하니 통째로 줄이지 않고 길이만 줄인다(바깥 크기 sc 는 모두 같음).
    if (ty === 'garaetteok') {
      const m = piece.userData.mesh, l0 = m.scale.y, l1 = Math.min(1, 0.34 / sc / (piece.userData.len || 0.55));
      FX.tw(0.45, (u) => { piece.rotation.y = (Math.PI / 2) * u; m.scale.y = l0 + (l1 - l0) * u; });
    }
    const s0 = piece.scale.x;
    FX.hop(piece, to, 0.45, 0.9, () => { FX.squash(piece, 0.25); S('pop', 0.6 + i * 0.05); if (done) done(); });
    FX.tw(0.45, (u) => piece.scale.setScalar(s0 + (sc - s0) * u));
  }
  MK.takeTray = function () { const t = P.tray; newTray(); P.tray.visible = false; return t; };
  MK.showTray = function () { P.tray.visible = true; P.tray.scale.setScalar(0.01); FX.tw(0.4, (u) => P.tray.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back); };

  // ---------- 진행 ----------
  let task = null, queue = [], onDone = null, result = [];
  MK.active = false;
  // jobs: [{type, n, cols?}]  → 끝나면 done(조각들)
  MK.start = function (jobs, done) {
    queue = jobs.slice(); onDone = done; result = []; MK.active = true;
    next();
  };
  function next() {
    if (!queue.length) { MK.active = false; task = null; G.point(null); const r = result; FX.wait(0.5, () => onDone && onDone(r)); return; }
    const j = queue.shift();
    const mk = DATA.DDEOK[j.type].make;
    const fn = { pound, pinch, layer }[mk] || MK.extra[mk];
    task = fn(j, (pieces) => { result.push.apply(result, pieces); next(); });
  }
  MK.info = () => (task && task.info ? task.info() : null);
  MK.down = (p) => task && task.down && task.down(p);
  MK.move = (p) => task && task.move && task.move(p);
  MK.up = (p) => task && task.up && task.up(p);
  MK.step = function (dt) {
    if (task && task.step) task.step(dt);
    // 쉬는 떡메는 살짝 둥실
    const m = P.mallet; if (m && m.userData.idle !== false && !m.userData.busy) { m.position.y = m.userData.rest.y + Math.sin(performance.now() / 500) * 0.06; }
  };
  function judge(pos, k) {
    const cls = k >= 0.95 ? 'pf' : k >= 0.6 ? 'gd' : 'bd';
    const txt = k >= 0.95 ? 'PERFECT' : k >= 0.6 ? 'GOOD' : 'MISS';
    FX.text(pos, txt, cls, -40);
    if (k >= 0.95) { S('ding', G.combo()); G.addCombo(); } else G.resetCombo();
    return k;
  }

  // ======================================================
  // 메치기 → 썰기 → 고물 (인절미)
  // ======================================================
  function lumpyBall() {
    const g = new THREE.SphereGeometry(0.62, 36, 24);
    g.userData.base = g.attributes.position.array.slice();
    return g;
  }
  function setLumpy(geo, rough, flat) {
    const b = geo.userData.base, p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = b[i], y = b[i + 1], z = b[i + 2];
      const n = Math.sin(x * 9.1 + z * 4.3) * Math.cos(y * 8.7 - x * 3.1) + Math.sin(z * 11.3 + y * 5.9) * 0.6;
      const k = 1 + n * 0.09 * rough;
      let yy = y * k;
      if (yy < -0.2) yy = -0.2 + (yy + 0.2) * 0.3; // 바닥 평평
      p[i] = x * k * (1 + flat * 0.25); p[i + 1] = yy * (1 - flat * 0.3); p[i + 2] = z * k * (1 + flat * 0.25);
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  }
  function pound(job, done) {
    const big = G.gear('mallet');
    const N = job.n;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    // 찹쌀 덩이
    const geo = lumpyBall();
    const dough = TOY.mesh(geo, TOY.ddeok('#ffffff', { map: TOY.dustTex('#fbf7ef', ['#ffffff', '#ede3d1', '#f3eadb'], 1600), rough: 0.75 }), c.x, c.y + 0.2, c.z, scene);
    setLumpy(geo, 1, 0);
    dough.scale.setScalar(0.01);
    FX.tw(0.45, (u) => dough.scale.setScalar(Math.max(0.01, u)), () => FX.setBase(dough), FX.ease.back);
    S('plop');
    let hits = 0, score = 0, ringT = 0, phase = 'pound', rough = 1, flat = 0, busy = false;
    const HITS = 6, R0 = 1.9, R1 = 0.35, TGT = 0.8;
    P.ring.visible = true; P.target.visible = true;
    P.ring.position.set(c.x, c.y + 0.02, c.z); P.target.position.copy(P.ring.position);
    P.target.scale.setScalar(TGT);
    const win = big ? 0.2 : 0.13;
    G.point(P.mallet, 1.0);
    let period = 1.05;
    // 썰기
    let slab = null, cuts = [], knifeX = 0, guides = [];
    // 고물
    let pieces = [], coat = 0;

    function slam() {
      if (busy) return;
      busy = true;
      const r = R0 + (R1 - R0) * ringT;
      const d = Math.abs(r - TGT);
      const k = d < win ? 1 : d < win * 2.6 ? 0.65 : 0.25;
      const m = P.mallet; m.userData.busy = true;
      const from = m.position.clone(), r0 = m.rotation.z;
      const hitP = new V3(c.x + 0.05, c.y + 0.45 + 0.36 - flat * 0.15, c.z);
      FX.tw(0.09, (u) => { m.position.lerpVectors(from, hitP, u); m.rotation.z = r0 + (0.05 - r0) * u; }, () => {
        // 쿵!
        hits++; score += k;
        rough = Math.max(0, rough - (k >= 1 ? 0.22 : k > 0.5 ? 0.15 : 0.06));
        flat = Math.min(1, hits / HITS);
        setLumpy(geo, rough, flat);
        FX.squash(dough, 0.5); FX.squash(P.board, 0.06);
        RND.shake(0.08 + k * 0.08);
        FX.burst(new V3(c.x, c.y + 0.3, c.z), { n: 10 + k * 8, kind: 'ball', color: ['#ffffff', '#fbf3e4'], size: 0.07, speed: 2.6, up: 3, floor: P.bTop });
        FX.ring(new V3(c.x, c.y + 0.03, c.z), { color: k >= 1 ? '#ffd1e0' : '#ffffff', size: 0.6, to: 2.2 });
        if (k >= 1) FX.burst(new V3(c.x, c.y + 0.9, c.z), { n: 6, kind: 'star', color: ['#fff3a0', '#ffc1d8', '#bfe8ff'], size: 0.22, speed: 2.2, up: 2.5, glow: true });
        S('thud', k); S('squish');
        judge(new V3(c.x, c.y + 1.2, c.z), k);
        FX.tw(0.3, (u) => { m.position.lerpVectors(hitP, m.userData.rest, u); m.rotation.z = 0.05 + (0.5 - 0.05) * u; }, () => {
          m.userData.busy = false; busy = false;
          if (hits >= HITS) toSlab();
        }, FX.ease.out);
        ringT = 0; period = Math.max(0.8, period - 0.04);
      }, FX.ease.in);
    }
    function toSlab() {
      phase = 'stretch'; P.ring.visible = false; P.target.visible = false; G.point(null);
      // 쭈욱 늘어나며 길쭉한 떡이 됨
      S('stretch');
      const s0 = dough.scale.clone();
      FX.tw(0.5, (u) => dough.scale.set(s0.x * (1 + u * 1.6), s0.y * (1 - u * 0.55), s0.z * (1 - u * 0.2)), () => {
        scene.remove(dough);
        slab = TOY.mesh(TOY.rbox(2.6, 0.32, 0.6, 0.12), TOY.ddeok('#ffffff', { map: TOY.dustTex('#fbf7ef', ['#ffffff', '#ede3d1'], 1600) }), c.x, c.y + 0.16, c.z, scene);
        FX.squash(slab, 0.3);
        phase = 'cut';
        knifeX = c.x;
        P.knife.visible = true; P.knife.position.set(c.x, c.y + 1.2, c.z); P.knife.rotation.set(0, 0, 0);
        G.point(P.knife, 0.9);
        if (G.gear('knife')) for (let i = 1; i < N; i++) {
          const gl = TOY.mesh(TOY.rbox(0.03, 0.02, 0.7, 0.01), TOY.basic('#ff8fb1', 0.8), c.x - 1.3 + (2.6 * i) / N, c.y + 0.33, c.z, scene);
          gl.castShadow = false; guides.push(gl);
        }
      }, FX.ease.out);
    }
    function chop(x) {
      if (busy) return;
      x = Math.max(c.x - 1.15, Math.min(c.x + 1.15, x));
      if (cuts.some((q) => Math.abs(q - x) < 0.16)) return;
      busy = true;
      const kn = P.knife, from = kn.position.clone();
      kn.position.x = x;
      FX.tw(0.07, (u) => { kn.position.y = from.y + (c.y + 0.32 - from.y) * u; }, () => {
        cuts.push(x); S('chop'); FX.squash(slab, 0.15);
        FX.burst(new V3(x, c.y + 0.35, c.z + 0.2), { n: 6, color: ['#ffffff'], size: 0.05, speed: 1.6, up: 2.2, floor: P.bTop });
        const cut = TOY.mesh(TOY.rbox(0.025, 0.33, 0.62, 0.01), TOY.basic('#e8dccb'), x, c.y + 0.165, c.z, scene);
        cut.castShadow = false; guides.push(cut);
        FX.tw(0.2, (u) => { kn.position.y = c.y + 0.32 + (1.2 - 0.32) * u; }, () => { busy = false; if (cuts.length >= N - 1) split(); }, FX.ease.out);
      }, FX.ease.in);
    }
    function split() {
      phase = 'split'; G.point(null);
      P.knife.visible = false;
      guides.forEach((g) => scene.remove(g)); guides = [];
      const xs = [c.x - 1.3].concat(cuts.slice().sort((a, b) => a - b), [c.x + 1.3]);
      const ws = []; for (let i = 0; i < N; i++) ws.push(xs[i + 1] - xs[i]);
      const mean = 2.6 / N, sd = Math.sqrt(ws.reduce((a, w) => a + (w - mean) * (w - mean), 0) / N);
      const even = Math.max(0, 1 - (sd / mean) * 2.2);
      scene.remove(slab);
      for (let i = 0; i < N; i++) {
        const w = Math.max(0.18, ws[i] - 0.04);
        const pc = DDEOK.injeolmiOwn(w);
        pc.position.set((xs[i] + xs[i + 1]) / 2, c.y, c.z);
        scene.add(pc); pieces.push(pc);
        const to = pc.position.clone(); to.x = c.x + (i - (N - 1) / 2) * (2.6 / N + 0.12);
        FX.to(pc, to, 0.3, null, FX.ease.back);
      }
      judge(new V3(c.x, c.y + 1.0, c.z), even >= 0.85 ? 1 : even >= 0.55 ? 0.65 : 0.3);
      score += (even >= 0.85 ? 1 : even >= 0.55 ? 0.65 : 0.3) * 2;
      FX.wait(0.55, toKong);
    }
    function toKong() {
      phase = 'kongmove';
      const kt = P.kong.position;
      pieces.forEach((pc, i) => {
        const to = new V3(kt.x - 0.6 + (i % 4) * 0.4, 0.25, kt.z - 0.25 + Math.floor(i / 4) * 0.5);
        FX.hop(pc, to, 0.45, 1.0, () => { FX.squash(pc, 0.3); S('pop', 0.8 + i * 0.05); }, FX.ease.lin);
      });
      FX.wait(0.6, () => { phase = 'coat'; G.point(P.kong, 0.8); });
    }
    function shake() {
      if (busy) return;
      busy = true;
      const add = G.gear('sieve') ? 0.4 : 0.2;
      coat = Math.min(1, coat + add);
      FX.squash(P.kong, 0.2); S('powder');
      const kt = P.kong.position;
      FX.puff(new V3(kt.x, 0.4, kt.z), { n: 10, color: '#f7e4a8', size: 0.16, up: 1.5, spread: 1.4, life: 0.7, op: 0.5, grow: 3 });
      pieces.forEach((pc) => {
        const y0 = pc.position.y, r0 = pc.rotation.y, dr = (Math.random() - 0.5) * 0.8;
        FX.tw(0.32, (u) => { pc.position.y = y0 + Math.sin(u * PI) * 0.35; pc.rotation.y = r0 + dr * u; }, null, FX.ease.lin);
        pc.userData.setCoat(coat);
      });
      FX.wait(0.2, () => { busy = false; });
      if (coat >= 1) {
        phase = 'done'; G.point(null);
        FX.burst(new V3(kt.x, 0.6, kt.z), { n: 10, kind: 'star', color: ['#fff3a0', '#ffd1e0'], size: 0.2, speed: 2, up: 2.5, glow: true });
        const q = Math.min(1, score / (HITS + 2));
        FX.wait(0.45, () => {
          let left = pieces.length;
          pieces.forEach((pc, i) => FX.wait(i * 0.08, () => { pc.userData.q = q; toTray(pc, () => { if (--left === 0) done(pieces); }); }));
        });
      }
    }
    return {
      step(dt) {
        if (phase === 'pound' && !busy) {
          ringT += dt / period;
          if (ringT > 1) ringT = 0;
          const r = R0 + (R1 - R0) * ringT;
          P.ring.scale.setScalar(r);
          const near = Math.abs(r - TGT) < win;
          P.ring.material.color.set(near ? '#7ff0b0' : '#ffffff');
        }
      },
      down(p) {
        if (phase === 'pound') slam();
        else if (phase === 'cut') { const g = RND.groundAt(p.x, p.y, c.y + 0.3); if (g) { knifeX = g.x; chop(g.x); } }
        else if (phase === 'coat') shake();
      },
      info() { const r = R0 + (R1 - R0) * ringT; return { kind: 'pound', phase, busy, green: Math.abs(r - TGT) < win * 0.7, c, cuts: cuts.length, N }; },
      move(p) {
        if (phase === 'cut' && !busy) { const g = RND.groundAt(p.x, p.y, c.y + 0.3); if (g) P.knife.position.x = Math.max(c.x - 1.15, Math.min(c.x + 1.15, g.x)); }
      },
    };
  }

  // ======================================================
  // 빚기 (송편)
  // ======================================================
  function pinch(job, done) {
    const N = job.n, cols = DATA.DDEOK.songpyeon.cols;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    let i = 0, ball = null, holding = false, k = 0, state = 'wait', out = [], arc = null;
    const Z0 = 0.86, Z1 = 1.02, OVER = 1.1;
    // 눌림 고리(호)
    function gaugeGeo(t0, t1, r0, r1) { return new THREE.RingGeometry(r0, r1, 48, 1, PI / 2 - t1 * PI * 2 / 1.15, (t1 - t0) * PI * 2 / 1.15); }
    const zone = new THREE.Mesh(gaugeGeo(Z0, Z1, 0.95, 1.12), new THREE.MeshBasicMaterial({ color: '#7ff0b0', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    const back = new THREE.Mesh(gaugeGeo(0, OVER, 0.98, 1.09), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
    arc = new THREE.Mesh(gaugeGeo(0, 0.01, 0.98, 1.09), new THREE.MeshBasicMaterial({ color: '#ff7aa8', transparent: true, opacity: 1, depthWrite: false, side: THREE.DoubleSide }));
    [back, zone, arc].forEach((m, j) => { m.rotation.x = -PI / 2; m.renderOrder = 4 + j; P.gauge.add(m); });
    P.gauge.position.set(c.x, c.y + 0.03, c.z); P.gauge.visible = true;

    function spawn() {
      ball = DDEOK.songpyeon(cols[i % cols.length]);
      ball.position.copy(c); ball.scale.setScalar(0.01); scene.add(ball);
      k = 0; state = 'wait';
      S('plop');
      FX.tw(0.35, (u) => ball.scale.setScalar(Math.max(0.01, u * 1.5)), () => { FX.setBase(ball); }, FX.ease.back);
      G.point(ball, 0.9);
      setArc(0);
    }
    function setArc(t) { arc.geometry.dispose(); arc.geometry = gaugeGeo(0, Math.max(0.01, Math.min(OVER, t)), 0.98, 1.09); arc.material.color.set(t >= Z0 && t <= Z1 ? '#3fd88a' : t > Z1 ? '#ff5a5a' : '#ff7aa8'); }
    function finish() {
      holding = false; state = 'done'; G.point(null);
      let q;
      if (k >= Z0 && k <= Z1) { q = 1; ball.userData.shape(1); FX.burst(new V3(c.x, c.y + 0.6, c.z), { n: 7, kind: 'star', color: ['#fff3a0', '#ffd1e0', '#bfe8ff'], size: 0.2, speed: 2, up: 2.4, glow: true }); S('pop', 1.2); }
      else if (k > Z1) { q = 0.25; burst(); }
      else { q = 0.6; S('pop', 0.9); }
      judge(new V3(c.x, c.y + 1.0, c.z), q);
      FX.squash(ball, 0.35);
      ball.userData.q = q;
      const b = ball; ball = null;
      out.push(b);
      FX.wait(0.25, () => toTray(b, () => {}));
      i++;
      FX.wait(0.55, () => { if (i < N) spawn(); else { P.gauge.visible = false; while (P.gauge.children.length) P.gauge.remove(P.gauge.children[0]); FX.wait(0.35, () => done(out)); } });
    }
    function burst() {
      // 너무 눌러서 소(깨)가 삐져나옴
      S('burst');
      FX.burst(new V3(c.x, c.y + 0.25, c.z), { n: 16, color: ['#3a2a20', '#c99a3e', '#5a4030'], size: 0.06, speed: 2.5, up: 2.5, floor: P.bTop });
      RND.shake(0.08);
    }
    spawn();
    return {
      step(dt) {
        if (state === 'wait' && holding && ball) {
          k += dt * (0.62 + i * 0.03);
          ball.userData.shape(k);
          setArc(k);
          if (Math.random() < dt * 8) S('squeeze', k);
          if (k >= OVER) finish();
        }
      },
      info() { return { kind: 'pinch', state, k, c, zone: k >= Z0 + 0.03 && k <= Z1 - 0.03 }; },
      down() { if (state === 'wait' && ball) { holding = true; S('squish'); } },
      up() { if (holding && state === 'wait') { if (k < 0.25) { holding = false; return; } finish(); } },
    };
  }

  // ======================================================
  // 쌓기 → 찌기 → 썰기 (무지개떡)
  // ======================================================
  function layer(job, done) {
    const N = job.n, cols = DATA.DDEOK.mujigae.cols;
    const c = new V3(X0 - 0.2, P.bTop, -0.15);
    const sr = P.siru; sr.visible = true; sr.scale.setScalar(0.01);
    FX.tw(0.35, (u) => sr.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
    let li = 0, moving = null, t = 0, state = 'move', offs = [], qs = [], layers = [];
    const AMP = 1.15;
    function spawn() {
      moving = DDEOK.mujigaeLayer(cols[li], 1.1, 1.1);
      moving.position.set(c.x, c.y + 1.6, c.z); scene.add(moving);
      t = Math.random() * 2; state = 'move';
      G.point(moving, 0.7);
    }
    function drop() {
      state = 'drop'; G.point(null);
      const off = moving.position.x - c.x;
      const d = Math.abs(off);
      const q = d < 0.08 ? 1 : d < 0.22 ? 0.65 : 0.3;
      const fx = q >= 1 ? 0 : Math.max(-0.35, Math.min(0.35, off));
      const m = moving; moving = null;
      const to = new V3(c.x + fx, c.y + 0.12 + li * 0.13, c.z);
      FX.to(m, to, 0.18, () => {
        FX.squash(m, 0.3); S('plop'); S('thud', 0.4);
        FX.puff(new V3(c.x, to.y + 0.1, c.z), { n: 4, color: '#ffffff', size: 0.2, up: 0.6, spread: 1.1, life: 0.5, op: 0.6 });
        judge(new V3(c.x, c.y + 1.4, c.z), q);
        if (q >= 1) FX.burst(new V3(c.x, to.y + 0.2, c.z), { n: 6, kind: 'star', color: ['#fff3a0', cols[li]], size: 0.18, speed: 2, up: 2, glow: true });
        offs.push(fx / 0.35); qs.push(q); layers.push(m);
        li++;
        if (li < 5) FX.wait(0.25, spawn); else FX.wait(0.35, steam);
      }, FX.ease.in);
    }
    function steam() {
      state = 'steam';
      const lid = P.lid; lid.visible = true; lid.position.set(c.x, c.y + 2.2, c.z);
      FX.to(lid, new V3(c.x, c.y + 0.58, c.z), 0.25, () => {
        FX.squash(lid, 0.3); S('lid');
        let n = 0;
        const iv = () => { if (n++ < 9) { FX.puff(new V3(c.x + (Math.random() - 0.5) * 0.8, c.y + 0.8, c.z + (Math.random() - 0.5) * 0.8), { n: 3, size: 0.28, up: 1.6, life: 1.0, op: 0.8 }); S('steam'); FX.wait(0.18, iv); } else open(); };
        iv();
      }, FX.ease.in);
    }
    function open() {
      const lid = P.lid;
      FX.to(lid, new V3(c.x + 1.2, c.y + 1.8, c.z - 0.6), 0.35, () => { lid.visible = false; }, FX.ease.out);
      // 칼이 격자로 썬다
      const kn = P.knife; kn.visible = true;
      const cols2 = Math.min(4, N), rows = Math.ceil(N / cols2);
      let cut = 0;
      const lines = [];
      for (let a = 1; a < cols2; a++) lines.push(['x', -0.55 + (1.1 * a) / cols2]);
      for (let b = 1; b < rows; b++) lines.push(['z', -0.55 + (1.1 * b) / rows]);
      const doCut = () => {
        if (cut >= lines.length) { kn.visible = false; kn.rotation.y = 0; return makePieces(cols2, rows); }
        const [ax, v] = lines[cut++];
        kn.rotation.y = ax === 'x' ? 0 : PI / 2;
        kn.position.set(c.x + (ax === 'x' ? v : 0), c.y + 1.4, c.z + (ax === 'z' ? v : 0));
        FX.tw(0.08, (u) => { kn.position.y = c.y + 1.4 - (1.4 - 0.75) * u; }, () => { S('chop'); layers.forEach((l) => FX.squash(l, 0.08)); FX.tw(0.12, (u) => { kn.position.y = c.y + 0.75 + 0.65 * u; }, doCut); }, FX.ease.in);
      };
      FX.wait(0.3, doCut);
    }
    function makePieces(cx, rows) {
      layers.forEach((l) => scene.remove(l));
      const q = qs.reduce((a, b) => a + b, 0) / qs.length;
      const out = [];
      for (let n = 0; n < N; n++) {
        const pc = DDEOK.mujigae(offs);
        const a = n % cx, b = Math.floor(n / cx);
        pc.position.set(c.x - 0.55 + (a + 0.5) * (1.1 / cx), c.y + 0.0, c.z - 0.55 + (b + 0.5) * (1.1 / rows));
        pc.scale.setScalar(Math.min(1, 1.9 / Math.max(cx, rows)) * 0.9);
        pc.userData.q = q;
        scene.add(pc); out.push(pc);
      }
      FX.tw(0.3, (u) => sr.scale.setScalar(Math.max(0.01, 1 - u)), () => { sr.visible = false; });
      let left = N;
      out.forEach((pc, i) => FX.wait(0.25 + i * 0.08, () => toTray(pc, () => { if (--left === 0) done(out); })));
    }
    spawn();
    return {
      step(dt) {
        if (state === 'move' && moving) {
          t += dt * (1.7 + li * 0.32);
          moving.position.x = c.x + Math.sin(t) * AMP;
        }
      },
      info() { return { kind: 'layer', state, off: moving ? moving.position.x - c.x : 9, c }; },
      down() { if (state === 'move' && moving) drop(); },
    };
  }
})();
