// otteok.com 대형 공장(4장부터): 작업대 왼쪽 큰 바닥판 위에 떡 라인이 하나씩 늘어난다. 사람 없이 기계만.
// 라인 하나 = 반죽 통 → 떡메 기계(쿵) → 칼 → 포장 기계 → 상자 쌓기. 설비를 사면 포장 로봇·고속 벨트·천장 레일·AI 검사대가 붙는다.
(function () {
  const F = (window.FACT = {});
  const V3 = THREE.Vector3, PI = Math.PI;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  const M = (c, o) => TOY.mat(c, o);
  const add = (g, m, x, y, z, p) => TOY.mesh(g, m, x, y, z, p);

  const X0 = -48.5, X1 = -17.5, Z0 = -3.3, Z1 = 3.6;
  F.CX = (X0 + X1) / 2;
  const LEN = 12.4, ROWS = [2.15, 0.7, -0.75, -2.2], BLOCK = [-40.6, -25.4];
  const slotPos = (i) => new V3(BLOCK[i < 4 ? 0 : 1], 0, ROWS[i % 4]);
  const N_ITEM = RND.LOW ? 5 : 7;
  let root = null, beltTex = null, lines = [], slots = [], up = {}, speed = 0.9;

  function build() {
    if (root) return;
    root = new THREE.Group(); RND.scene.add(root);
    // 바닥판(작업대 높이까지 올라온 큰 판) + 노란 안전선
    const floorT = TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#eceff6'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(160,170,200,.35)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
    }), [12, 3]);
    add(TOY.rbox(X1 - X0, 3.2, Z1 - Z0, 0.25), M('#ffffff', { map: floorT, rough: 0.6, gloss: 0.3 }), F.CX, -1.6, (Z0 + Z1) / 2, root);
    const stripe = TOY.tex(TOY.canvas(128, 16, (g, w, h) => { g.fillStyle = '#ffd95a'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a4f63'; for (let x = -16; x < w; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 0); g.lineTo(x + 28, 0); g.lineTo(x + 12, h); g.fill(); } }), [30, 1]);
    const st = add(new THREE.PlaneGeometry(X1 - X0 - 0.6, 0.22), new THREE.MeshBasicMaterial({ map: stripe }), F.CX, 0.004, Z1 - 0.3, root); st.rotation.x = -PI / 2; st.castShadow = false;
    // 뒷벽: 공장 판넬 + 긴 창 + 간판
    const wallT = TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#dfe6f2'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.55)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 3, h);
      g.fillStyle = 'rgba(150,165,200,.25)'; for (let x = 16; x < w; x += 32) g.fillRect(x, 0, 2, h);
    }), [10, 3]);
    const wall = add(new THREE.PlaneGeometry(X1 - X0 + 1, 14), M('#ffffff', { map: wallT, rough: 0.8 }), F.CX, 3.8, -3.48, root); wall.castShadow = false;
    const glass = M('#bfe3ff', { gloss: 0.9, rough: 0.15, emis: 0.25 });
    for (let i = 0; i < 6; i++) { const w = add(TOY.rbox(4.2, 1.5, 0.1, 0.12), glass, X0 + 3 + i * 5.1, 6.0, -3.4, root); w.castShadow = false; }
    const sg = add(TOY.rbox(9.5, 1.6, 0.25, 0.6), M('#ff8fb1', { gloss: 0.6 }), F.CX, 8.4, -3.35, root);
    const tx = add(new THREE.PlaneGeometry(9, 1.5), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('otteok.com FACTORY', { w: 1024, h: 170, size: 110, color: '#ffffff', stroke: '#d9547e', sw: 18 }) }), 0, 0, 0.14, sg);
    tx.castShadow = false;
    // 벨트 무늬(모든 라인이 같이 쓴다)
    beltTex = TOY.tex(TOY.canvas(128, 32, (g, w, h) => { g.fillStyle = '#8f9ab3'; g.fillRect(0, 0, w, h); g.fillStyle = '#aab4ca'; for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 6, h); }), [14, 1]);
    // 빈 자리 8칸
    for (let i = 0; i < 8; i++) {
      const p = slotPos(i);
      const m = add(TOY.rbox(LEN, 0.04, 1.0, 0.3), M('#d7dcea', { rough: 0.9 }), p.x, 0.02, p.z, root); m.castShadow = false;
      const plus = add(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('+', { size: 200, color: '#aab3cc' }), depthWrite: false }), p.x, 0.05, p.z, root);
      plus.rotation.x = -PI / 2; plus.castShadow = false;
      slots.push({ mat: m, plus });
    }
    F.sync(true);
  }

  // ---------- 라인 하나 ----------
  function makeLine(type, i) {
    const p = slotPos(i), dd = DATA.DDEOK[type];
    const g = new THREE.Group(); g.position.copy(p); root.add(g);
    const frameM = M('#c9cfe0', { gloss: 0.3, rough: 0.4 }), dark = M('#7d8496', { rough: 0.6 }), pink = M('#ff8fb1', { gloss: 0.6, rough: 0.3 }), white = M('#ffffff', { gloss: 0.5 });
    // 벨트
    add(TOY.rbox(LEN, 0.3, 0.8, 0.1), frameM, 0, 0.45, 0, g);
    const belt = add(TOY.rbox(LEN - 0.2, 0.08, 0.64, 0.03), M('#ffffff', { map: beltTex, rough: 0.7 }), 0, 0.63, 0, g); belt.castShadow = false;
    [-LEN / 2 + 0.5, 0, LEN / 2 - 0.5].forEach((x) => [-0.3, 0.3].forEach((z) => add(TOY.rbox(0.14, 0.45, 0.14, 0.05), dark, x, 0.15, z, g)));
    // 반죽 통
    // 반죽 통과 반죽은 나오는 떡 색으로(절편·가래떡은 흰 떡)
    const hc = new THREE.Color(dd.dough || dd.color).lerp(new THREE.Color('#ffffff'), 0.35).getStyle();
    add(TOY.rcyl(0.55, 0.9, 0.12), M(hc, { gloss: 0.5 }), -5.4, 1.75, 0, g);
    const cone = add(new THREE.ConeGeometry(0.55, 0.55, 24), M(hc, { gloss: 0.5 }), -5.4, 1.05, 0, g); cone.rotation.x = PI;
    add(TOY.rcyl(0.6, 0.12, 0.05), white, -5.4, 2.25, 0, g);
    [-0.4, 0.4].forEach((z) => add(TOY.rbox(0.12, 1.2, 0.12, 0.04), frameM, -5.4, 1.2, z * 1.25, g));
    // 떡메 기계
    [-0.45, 0.45].forEach((z) => add(TOY.rbox(0.18, 2.1, 0.18, 0.06), frameM, -2.6, 1.6, z, g));
    add(TOY.rbox(0.36, 0.3, 1.2, 0.1), frameM, -2.6, 2.6, 0, g);
    const press = add(TOY.rbox(0.75, 0.38, 0.62, 0.12), pink.clone(), -2.6, 1.6, 0, g);
    add(TOY.rcyl(0.07, 0.8, 0.03), dark, 0, 0.55, 0, press);
    // 칼
    [-0.4, 0.4].forEach((z) => add(TOY.rbox(0.12, 1.4, 0.12, 0.04), frameM, 0.2, 1.25, z, g));
    add(TOY.rbox(0.24, 0.2, 1.0, 0.06), frameM, 0.2, 1.95, 0, g);
    const blade = add(TOY.rbox(0.05, 0.42, 0.66, 0.02), M('#eef3ff', { gloss: 1, rough: 0.1 }), 0.2, 1.2, 0, g);
    // 포장 기계(떡이 들어갔다 상자로 나온다)
    const wrapM = M(['#ffd6e4', '#d9ecff', '#fff0c4', '#dff5e3', '#ebdcff'][i % 5], { gloss: 0.5 });
    add(TOY.rbox(1.5, 1.15, 1.0, 0.2), wrapM, 2.8, 1.2, 0, g);
    const mouth = add(new THREE.PlaneGeometry(0.75, 0.5), new THREE.MeshBasicMaterial({ color: '#4a3a52' }), 2.8, 0.92, 0.505, g); mouth.castShadow = false;
    const lamp = add(new THREE.SphereGeometry(0.12, 14, 10), M('#7ff0b0', { emis: 0.9 }).clone(), 2.8, 1.9, 0.3, g);
    // 상자 쌓는 판
    add(TOY.rbox(1.2, 0.16, 1.2, 0.06), M('#e9c49a', { rough: 0.8 }), LEN / 2 + 0.75, 0.08, 0, g);
    const stack = new THREE.Group(); stack.position.set(LEN / 2 + 0.75, 0.16, 0); g.add(stack);
    // 이름표
    const plate = add(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label(L(dd.ko, dd.en), { w: 512, h: 128, size: 80, color: '#4a2f43', bg: '#ffffff' }) }), -4.1, 0.45, 0.41, g);
    plate.castShadow = false;
    // 지나가는 떡: 반죽 → 떡 → 상자
    const items = [];
    for (let k = 0; k < N_ITEM; k++) {
      const it = new THREE.Group(); g.add(it);
      const dough = add(new THREE.SphereGeometry(0.22, 16, 12), TOY.ddeok(hc), 0, 0.2, 0, it); dough.scale.set(1.1, 0.75, 1.1);
      // 꿀떡은 초록 통에 맞춰 초록
      const pc = DDEOK.piece(type, type === 'kkuldduk' ? { color: dd.cols[1] } : {}); pc.scale.setScalar(0.85); it.add(pc);
      const bx = add(TOY.rbox(0.48, 0.38, 0.48, 0.08), wrapM, 0, 0.19, 0, it);
      add(TOY.rbox(0.5, 0.06, 0.12, 0.02), pink, 0, 0.19, 0, bx);
      items.push({ g: it, dough, pc, bx, u: k / N_ITEM });
    }
    // 포장 로봇 팔(설비)
    const robot = new THREE.Group(); robot.position.set(4.3, 0, 0.75); g.add(robot);
    add(TOY.rcyl(0.3, 0.35, 0.08), dark, 0, 0.18, 0, robot);
    const sh = new THREE.Group(); sh.position.y = 0.4; robot.add(sh);
    add(TOY.rbox(0.22, 0.9, 0.22, 0.08), M('#ffb35a', { gloss: 0.5 }), 0, 0.45, 0, sh);
    const el = new THREE.Group(); el.position.y = 0.9; sh.add(el);
    add(new THREE.SphereGeometry(0.16, 14, 10), dark, 0, 0, 0, el);
    add(TOY.rbox(0.18, 0.18, 0.8, 0.06), M('#ffb35a', { gloss: 0.5 }), 0, 0, -0.4, el);
    add(TOY.rbox(0.3, 0.08, 0.2, 0.03), dark, 0, -0.05, -0.85, el);
    // AI 검사대(설비)
    const ai = new THREE.Group(); ai.position.set(-1.2, 0, 0); g.add(ai);
    [-0.45, 0.45].forEach((z) => add(TOY.rbox(0.12, 1.3, 0.12, 0.04), M('#e8f6ff', { gloss: 0.8 }), 0, 1.2, z, ai));
    add(TOY.rbox(0.2, 0.18, 1.02, 0.06), M('#e8f6ff', { gloss: 0.8 }), 0, 1.85, 0, ai);
    const beam = add(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ color: '#58ffb0', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }), 0, 1.25, 0, ai);
    beam.rotation.y = PI / 2; beam.castShadow = false;
    // 고장 표시(빨간 동그라미 + 느낌표): 누르는 자리
    const warn = new THREE.Group(); warn.position.set(-2.6, 3.6, 0); g.add(warn); warn.visible = false;
    const wd = add(new THREE.CircleGeometry(0.62, 28), new THREE.MeshBasicMaterial({ color: '#ff4f6d', depthTest: false, transparent: true }), 0, 0, 0, warn);
    const wx = add(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, map: TOY.label('!', { size: 210, color: '#ffffff' }) }), 0, 0, 0.01, warn);
    wd.renderOrder = wx.renderOrder = 20; wd.castShadow = wx.castShadow = false;
    g.userData.pick = true;
    const L1 = { type, g, press, blade, lamp, stack, items, robot, sh, el, ai, beam, warn, boxes: 0, t: Math.random() * 3, bad: null };
    return L1;
  }

  // 지금 산 것에 맞춰 라인·설비를 놓는다
  // hold: 상점에서 막 사서 아직 보여 주지 않은 것({ lines: 남은 라인 수, robot: 1, … })은 빼고 맞춘다
  let hold = null;
  F.sync = function () {
    if (!root) return;
    const want = BIZ.lines(), n = want.length - (hold ? hold.lines : 0);
    while (lines.length < n) lines.push(makeLine(want[lines.length], lines.length));
    slots.forEach((s, i) => { const on = i < lines.length; s.mat.visible = !on; s.plus.visible = !on; });
    const has = (k) => G.gear(k) && !(hold && hold[k]);
    up = { robot: has('robot'), fast: has('fast'), hub: has('hub'), ai: has('ai'), humanoid: has('humanoid') };
    lines.forEach((l) => { l.robot.visible = up.robot; l.ai.visible = up.ai; });
    speed = up.fast ? 1.9 : 0.9;
    if (up.hub && !F.rail) F.rail = makeRail();
    if (F.rail) F.rail.visible = up.hub;
  };
  // 천장 레일: 상자가 매달려 뒤 창고로 간다
  function makeRail() {
    const g = new THREE.Group(); root.add(g);
    const dark = M('#7d8496', { rough: 0.6 });
    add(TOY.rbox(X1 - X0 - 1, 0.18, 0.24, 0.06), dark, F.CX, 4.6, -2.9, g);
    for (let x = X0 + 1.5; x < X1; x += 6) add(TOY.rbox(0.16, 4.6, 0.16, 0.05), dark, x, 2.3, -3.1, g);
    g.userData.box = [];
    for (let i = 0; i < 12; i++) {
      const h = new THREE.Group(); h.position.set(X0 + i * 2.6, 4.4, -2.9); g.add(h);
      add(TOY.rbox(0.05, 0.5, 0.05, 0.02), dark, 0, -0.2, 0, h);
      add(TOY.rbox(0.6, 0.48, 0.5, 0.08), M(['#f0d0a8', '#ffd6e4', '#d9ecff'][i % 3], { rough: 0.7 }), 0, -0.68, 0, h);
      g.userData.box.push(h);
    }
    // 작은 드론 둘
    g.userData.drones = [];
    for (let i = 0; i < 2; i++) {
      const d = new THREE.Group(); g.add(d);
      add(TOY.rbox(0.6, 0.16, 0.6, 0.08), M('#ffffff', { gloss: 0.6 }), 0, 0, 0, d);
      [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].forEach(([x, z]) => { const r = add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 14), M('#9fd2ff', { op: 0.6 }), x, 0.1, z, d); r.castShadow = false; });
      add(TOY.rbox(0.36, 0.3, 0.36, 0.06), M('#f0d0a8', { rough: 0.7 }), 0, -0.3, 0, d);
      g.userData.drones.push(d);
    }
    return g;
  }

  // ---------- 움직임 ----------
  let T = 0;
  F.step = function (dt) {
    if (!root || !lines.length) return;
    T += dt;
    beltTex.offset.x -= dt * speed * 0.09;
    const span = LEN - 0.8, x0 = -LEN / 2 + 0.4;
    lines.forEach((l, k) => {
      let near = 9, nearC = 9;
      if (l.bad) { stepBad(l, dt); return; }
      l.items.forEach((it) => {
        it.u = (it.u + dt * speed / span) % 1;
        const x = x0 + it.u * span;
        it.g.position.set(x, 0.67, 0);
        const stage = x < -2.6 ? 0 : x < 2.2 ? 1 : x < 3.4 ? 3 : 2;
        it.dough.visible = stage === 0; it.pc.visible = stage === 1; it.bx.visible = stage === 2;
        near = Math.min(near, Math.abs(x + 2.6)); nearC = Math.min(nearC, Math.abs(x - 0.2));
        if (it.last !== undefined && it.last > 5.2 && x < -4) { l.boxes++; addBox(l); if (F.onBox) F.onBox(l, k); }
        it.last = x;
      });
      l.press.position.y = 1.0 + Math.min(0.9, near * 1.2);
      l.blade.position.y = 1.0 + Math.min(0.45, nearC * 0.8);
      if (up.robot) { l.sh.rotation.y = Math.sin(T * 2.2 + l.t) * 0.9; l.el.rotation.x = -0.4 + Math.sin(T * 4.4 + l.t) * 0.35; }
      if (up.ai) l.beam.material.opacity = 0.18 + Math.abs(Math.sin(T * 5 + l.t)) * 0.3;
    });
    stepTruck(dt);
    stepBot(dt);
    // 폰을 돌리거나 창 크기가 바뀌면 시점을 다시 맞춘다
    if (F.auto && viewPortrait !== RND.portrait && G.station === F.station && !G.lock) F.autoView();
    if (F.rail && F.rail.visible) {
      F.rail.userData.box.forEach((h) => { h.position.x += dt * speed * 1.1; if (h.position.x > X1 - 0.5) h.position.x = X0 + 0.5; });
      F.rail.userData.drones.forEach((d, i) => { const a = T * 0.5 + i * PI; d.position.set(F.CX + Math.cos(a) * 11, 5.4 + Math.sin(T * 2 + i) * 0.2, 0.6 + Math.sin(a) * 2.2); d.rotation.y = -a; });
    }
  };
  function addBox(l) {
    const n = l.stack.children.length;
    if (n >= 6) { while (l.stack.children.length) l.stack.remove(l.stack.children[0]); return; }
    const b = add(TOY.rbox(0.5, 0.36, 0.5, 0.08), M('#f0d0a8', { rough: 0.7 }), (n % 2) * 0.52 - 0.26, 0.18 + Math.floor(n / 2) * 0.37, 0, l.stack);
    b.castShadow = false;
  }

  // ---------- 카메라 ----------
  let saved = null;
  function save() { const v = RND.view; saved = { x: v.tx, z: v.tz, h: v.th, y: v.ty }; }
  function back() { if (saved) RND.focus(saved.x, saved.z, saved.h, saved.y); saved = null; }
  const wholeH = () => (RND.portrait ? 21 : 16.5);
  // 상점에서 산 것을 차례로 보여 주고 돌아온다
  F.visit = function (list, done) {
    build();
    G.lock = true; save();
    hold = { lines: 0 };
    list.forEach((b) => { if (b.line) hold.lines++; else hold[b.up] = 1; });
    let i = 0;
    const next = () => {
      if (i >= list.length) {
        hold = null; F.sync();
        FX.wait(0.4, () => { G.lock = false; back(); FX.wait(0.7, () => done && done()); });
        return;
      }
      const b = list[i++];
      if (b.line) {
        hold.lines--; F.sync();
        const l = lines[lines.length - 1], p = l.g.position;
        RND.focus(p.x, p.z + 0.4, RND.portrait ? 9 : 8, 0.6);
        l.g.scale.setScalar(0.01);
        FX.wait(0.6, () => {
          S('box'); S('fanfare');
          FX.tw(0.55, (u) => l.g.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
          FX.burst(new V3(p.x, 1.2, p.z), { n: 24, kind: 'star', color: ['#fff3a0', '#ffd1e0', '#c9f0ff', '#ffffff'], size: 0.28, speed: 4, up: 3, glow: true });
          FX.ring(new V3(p.x, 0.1, p.z), { color: '#ffd1e0', size: 1.5, to: 7 });
          UI.banner(L(DATA.DDEOK[b.line].ko + ' 레일 가동', DATA.DDEOK[b.line].en + ' rail online'), '+' + UI.fmt(BIZ.lineRate(lines.length - 1) * BIZ.mul()) + L('/초', '/s'));
          FX.wait(1.9, next);
        });
      } else {
        RND.focus(F.CX, 0.3, wholeH(), 0.4);
        FX.wait(0.7, () => {
          delete hold[b.up]; F.sync(); S('fanfare');
          const u = DATA.FUP.find((x) => x.k === b.up);
          // 레일마다 차례로 착착
          const gap = 0.14;
          lines.forEach((l, k) => {
            const part = b.up === 'robot' ? l.robot : b.up === 'ai' ? l.ai : null;
            const at = l.g.position.clone().add(new V3(b.up === 'ai' ? -1.2 : b.up === 'robot' ? 4.3 : 0, 1.6, 0));
            if (part) { part.scale.setScalar(0.01); FX.tw(0.32, (v) => part.scale.setScalar(Math.max(0.01, v)), null, FX.ease.back, k * gap); }
            FX.wait(k * gap + 0.01, () => { S('box'); FX.burst(at, { n: 12, kind: 'star', color: ['#fff3a0', '#7ff0b0', '#ffffff'], size: 0.24, speed: 3.5, up: 2.5, glow: true }); });
          });
          if (b.up === 'hub' && F.rail) { F.rail.position.y = 7; FX.tw(0.7, (v) => { F.rail.position.y = 7 * (1 - v); }, () => S('thud'), FX.ease.out); }
          if (b.up === 'humanoid') { RND.focus(HOME.x, HOME.z - 0.6, RND.portrait ? 7 : 6, 1.2); FX.wait(0.05, () => { if (!bot) return; const q = bot.g; q.scale.setScalar(0.01); FX.tw(0.5, (v) => q.scale.setScalar(Math.max(0.01, v) * 1.15), null, FX.ease.back); FX.burst(HOME.clone().add(new V3(0, 1.5, 0)), { n: 28, kind: 'star', color: ['#fff3a0', '#ffd1e0', '#c9f0ff', '#ffffff'], size: 0.28, speed: 4.5, up: 3.5, glow: true }); S('pop'); }); }
          // 수입이 눈앞에서 오른다
          const after = BIZ.rate(true), before = after / (u.mul || 1);
          const f = (n) => '+' + UI.fmt(Math.round(n / 10) * 10);
          UI.banner(L(u.ko, u.en), u.mul > 1 ? f(before) + ' → ' + f(after) + L('/초', '/s') : L(u.d[0], u.d[1]));
          UI.bizPop();
          FX.wait(Math.max(2.1, lines.length * gap + 1.5), next);
        });
      }
    };
    next();
  };
  // 4장 첫날: 빈 공장을 한 번 보여 준다
  F.intro = function (done) {
    build(); G.lock = true; save();
    RND.focus(F.CX, 0.3, wholeH(), 0.4);
    UI.banner(L('otteok.com 공장', 'otteok.com FACTORY'), L('주식회사 오떡', 'Otteok Inc.'));
    S('fanfare');
    FX.wait(2.6, () => { G.lock = false; back(); FX.wait(0.8, () => done && done()); });
  };
  F.ensure = function () { if (BIZ.on()) { build(); F.sync(); } };

  // ---------- 자동 영업(4장부터): 손 대신 라인이 떡을 만들고, 가끔 기계가 걸리거나 과열된다 ----------
  // PC 는 공장 전체(왼쪽 출고 목록만큼 조금 멀리), 폰 세로는 블록 하나를 크게 보고 좌우로 끌어 옮긴다
  const PH = 14.5, PZ = -2.4, PX0 = BLOCK[0] + 0.3, PX1 = BLOCK[1] + 0.3;
  let viewPortrait = null;
  F.autoView = function () { build(); viewPortrait = RND.portrait; if (RND.portrait) RND.focus(PX0, PZ, PH, 0.4); else RND.focus(F.CX, 0.3, wholeH() * 1.3, 0.4); };
  // 폰 세로: 고장 난 라인 쪽 블록으로 화면을 옮긴다
  function lookAt(l) {
    if (!RND.portrait || !F.auto || G.lock) return;
    const bx = l.g.position.x < F.CX ? PX0 : PX1;
    if (Math.abs(RND.view.tx - bx) > 4) RND.focus(bx, PZ, PH, 0.4);
  }
  F.down = (k) => !!(lines[k] && lines[k].bad);
  F.badLines = () => lines.filter((l) => l.bad);
  // 라인 하나가 1초에 내보내는 상자 수
  F.boxRate = () => (speed * N_ITEM) / (LEN - 0.8);
  let badT = 9;
  const nextBad = () => (11 + Math.random() * 12) * (up.ai ? 1.6 : 1) * (up.robot ? 1.2 : 1) * (lines.length < 3 ? 1.5 : 1);
  F.autoReset = function () { badT = 7 + Math.random() * 5; lines.forEach((l) => { if (l.bad) fixDone(l, true); }); };
  // 영업 중에만(흐름에서 부름)
  F.autoStep = function (dt) {
    badT -= dt;
    if (badT > 0) return;
    badT = nextBad();
    const ok = lines.filter((l) => !l.bad);
    if (!ok.length) return;
    breakLine(ok[(Math.random() * ok.length) | 0], Math.random() < 0.5 ? 'jam' : 'heat');
  };
  function breakLine(l, kind) {
    l.bad = { kind, hits: 0, t: 0, need: 3 };
    l.lamp.material.color.set('#ff4f6d'); if (l.lamp.material.emissive) l.lamp.material.emissive.set('#ff4f6d');
    l.warn.visible = true; l.warn.scale.setScalar(0.01);
    FX.tw(0.35, (u) => l.warn.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
    const p = l.g.position;
    if (kind === 'jam') { S('thud'); FX.puff(new V3(p.x - 2.6, 1.2, p.z), { n: 8, color: '#fff3e6', size: 0.35, up: 1.4, speed: 1.6 }); }
    else S('steam');
    // 휴머노이드가 있으면 사람이 나설 일이 아니다
    if (!up.humanoid) { S('fail'); lookAt(l); }
    if (UI.bizHud) UI.bizHud();
  }
  function stepBad(l, dt) {
    const b = l.bad; b.t += dt;
    const p = l.g.position;
    l.warn.quaternion.copy(RND.cam.quaternion);
    l.warn.position.y = 3.6 + Math.abs(Math.sin(b.t * 5)) * 0.25;
    l.lamp.material.color.set(Math.sin(b.t * 12) > 0 ? '#ff4f6d' : '#7a1d2e');
    b.smoke = (b.smoke || 0) - dt;
    if (b.kind === 'heat') {
      l.press.position.y = 1.6 + Math.sin(b.t * 40) * 0.04;
      if (l.press.material.emissive) l.press.material.emissive.setRGB(0.55 + Math.sin(b.t * 6) * 0.2, 0.05, 0.02);
      if (b.smoke <= 0) { b.smoke = 0.18; FX.puff(new V3(p.x - 2.6, 2.4, p.z), { n: 2, color: '#8a8f9e', size: 0.32, up: 2.2, speed: 0.3, life: 1.2, op: 0.7 }); }
    } else {
      l.press.position.y = 1.02;
      l.blade.position.y = 1.0;
      if (b.smoke <= 0) { b.smoke = 0.5; FX.puff(new V3(p.x - 2.6, 0.9, p.z + 0.2), { n: 2, color: '#fff3e6', size: 0.22, up: 0.6, speed: 0.8, life: 0.7 }); }
    }
  }
  function fixDone(l, quiet) {
    const p = l.g.position;
    l.bad = null; l.warn.visible = false;
    l.lamp.material.color.set('#7ff0b0'); if (l.lamp.material.emissive) l.lamp.material.emissive.set('#7ff0b0');
    if (l.press.material.emissive) l.press.material.emissive.setRGB(0, 0, 0);
    if (quiet) return;
    S('ding', 5); S('coin');
    FX.burst(new V3(p.x - 2.6, 2.0, p.z), { n: 22, kind: 'star', color: ['#fff3a0', '#7ff0b0', '#ffffff'], size: 0.26, speed: 4, up: 3, glow: true });
    FX.ring(new V3(p.x - 2.6, 0.7, p.z), { color: '#7ff0b0', size: 1, to: 4 });
    if (UI.bizHud) UI.bizHud();
  }
  // 고장 난 라인을 누르면 쾅쾅 고친다(세 번)
  function hitLine(l) {
    const b = l.bad, p = l.g.position;
    b.hits++;
    FX.squash(l.press, 0.35);
    FX.burst(new V3(p.x - 2.6, 1.7, p.z + 0.3), { n: 10, kind: 'star', color: ['#ffe27a', '#ffffff', '#ffb35a'], size: 0.18, speed: 5, up: 2.5, glow: true });
    S('slap'); S('chop');
    FX.squash(l.warn, 0.4);
    if (b.hits >= b.need) fixDone(l);
  }
  F.fix = function (l) { if (l && l.bad) hitLine(l); };
  F.breakNow = (i, kind) => { const l = lines[i]; if (l && !l.bad) breakLine(l, kind); }; // 쇼츠 촬영용
  F.warnAt = (l) => l.warn.getWorldPosition(new V3());
  let drag = null;
  F.station = {
    down(p) {
      drag = null;
      const bad = lines.filter((l) => l.bad);
      let l = null;
      if (bad.length) {
        const hit = RND.pick(p.x, p.y, bad.map((x) => x.g));
        l = hit && bad.find((x) => x.g === hit.obj);
        // 느낌표 언저리를 눌러도 됨
        if (!l) { let best = 90; bad.forEach((x) => { const sp = RND.toScreen(F.warnAt(x)); const d = Math.hypot(sp.x - p.x, sp.y - p.y); if (d < best) { best = d; l = x; } }); }
      }
      if (l) { hitLine(l); return; }
      // 폰 세로: 빈 곳을 끌면 좌우로 옮겨 본다
      if (RND.portrait) { const g0 = RND.groundAt(p.x, p.y, 0.6); if (g0) drag = { x: g0.x, tx: RND.view.tx }; }
    },
    move(p) {
      if (!drag) return;
      const g1 = RND.groundAt(p.x, p.y, 0.6); if (!g1) return;
      const v = RND.view, nx = Math.max(PX0, Math.min(PX1, v.tx - (g1.x - drag.x)));
      v.tx = nx; v.x = nx;
    },
    up() { drag = null; },
  };

  // ---------- 출고 트럭(공장 앞 오른쪽): 상자가 차면 떠났다 돌아온다 ----------
  let truck = null, tState = 'wait', tT = 0, tLoad = 0;
  function makeTruck() {
    const g = new THREE.Group(); root.add(g);
    const cab = M('#ff8fb1', { gloss: 0.6, rough: 0.3 }), white = M('#ffffff', { gloss: 0.5 }), dark = M('#4a4f63', { rough: 0.7 });
    add(TOY.rbox(2.2, 1.3, 1.1, 0.14), white, -0.4, 0.95, 0, g);
    const lb = add(new THREE.PlaneGeometry(1.9, 0.5), new THREE.MeshBasicMaterial({ transparent: true, map: TOY.label('otteok.com', { w: 512, h: 128, size: 76, color: '#ff6f9c' }) }), -0.4, 1.0, 0.56, g); lb.castShadow = false;
    add(TOY.rbox(0.9, 0.95, 1.05, 0.16), cab, 1.15, 0.78, 0, g);
    const ws = add(TOY.rbox(0.06, 0.4, 0.86, 0.04), M('#bfe3ff', { gloss: 0.9, rough: 0.1 }), 1.6, 1.0, 0, g); ws.castShadow = false;
    [[-1.0, 0.5], [-1.0, -0.5], [1.15, 0.5], [1.15, -0.5]].forEach(([x, z]) => { const w = add(TOY.rcyl(0.24, 0.16, 0.05), dark, x, 0.26, z, g); w.rotation.x = PI / 2; });
    g.scale.setScalar(0.85);
    return g;
  }
  const TRUCK0 = new V3(F.CX, 0, 3.1); // 두 블록 사이 앞쪽
  function stepTruck(dt) {
    if (!F.auto) { if (truck) truck.visible = false; return; }
    if (!truck) { truck = makeTruck(); truck.position.copy(TRUCK0); }
    truck.visible = true;
    tT += dt;
    if (tState === 'go') { truck.position.x = TRUCK0.x + tT * tT * 9; if (tT > 1.6) { tState = 'back'; tT = 0; } }
    else if (tState === 'back') { const u = Math.min(1, tT / 1.1), e = 1 - (1 - u) * (1 - u); truck.position.x = TRUCK0.x - 14 * (1 - e); if (u >= 1) { tState = 'wait'; tT = 0; FX.squash(truck, 0.12); } }
  }
  // 상자 하나 실림(흐름에서 부름). 열두 상자마다 빵 하고 떠난다
  F.loadTruck = function () {
    if (!truck || tState !== 'wait') return;
    tLoad++;
    if (tLoad >= 12) { tLoad = 0; tState = 'go'; tT = 0; S('honk'); S('truck'); }
  };

  // ---------- 휴머노이드(기계 추가): 고장 난 기계로 달려가 렌치로 세 번 쳐서 고친다 ----------
  let bot = null;
  const AISLE = 3.02, HOME = new V3(F.CX - 3.6, 0, AISLE);
  function limb(p, x, y, w, h, m, m2) {
    const g = new THREE.Group(); g.position.set(x, y, 0); p.add(g);
    add(TOY.rbox(w, h * 0.5, w, w * 0.4), m, 0, -h * 0.25, 0, g);
    add(new THREE.SphereGeometry(w * 0.55, 12, 10), m2, 0, -h * 0.5, 0, g);
    add(TOY.rbox(w * 0.92, h * 0.5, w * 0.92, w * 0.4), m, 0, -h * 0.75, 0, g);
    return g;
  }
  function makeBot() {
    const g = new THREE.Group(); root.add(g);
    const shell = M('#fbfcff', { gloss: 0.7, rough: 0.25 }), joint = M('#59607a', { rough: 0.5, gloss: 0.3 }), pink = M('#ff8fb1', { gloss: 0.6, rough: 0.3 });
    const body = new THREE.Group(); g.add(body);
    // 다리
    const legL = limb(body, -0.2, 1.0, 0.25, 1.0, shell, joint), legR = limb(body, 0.2, 1.0, 0.25, 1.0, shell, joint);
    [legL, legR].forEach((l) => add(TOY.rbox(0.3, 0.14, 0.44, 0.06), joint, 0, -0.98, 0.07, l));
    // 몸통: 흰 껍데기 + 분홍 가슴판 + 초록 불빛
    add(TOY.rbox(0.42, 0.22, 0.3, 0.08), joint, 0, 1.08, 0, body);
    add(TOY.rbox(0.74, 0.74, 0.42, 0.17), shell, 0, 1.5, 0, body);
    add(TOY.rbox(0.42, 0.3, 0.05, 0.07), pink, 0, 1.56, 0.21, body);
    const lamp = add(new THREE.SphereGeometry(0.055, 12, 10), M('#7ff0b0', { emis: 0.9 }), 0, 1.56, 0.25, body); lamp.castShadow = false;
    add(TOY.rbox(0.74, 0.22, 0.42, 0.1), pink, 0, 1.16, 0, body).visible = false;
    // 머리: 검은 얼굴판 + 파란 눈 둘(뒤에서도 로봇으로 보이게 뒤통수에 분홍 띠)
    const head = new THREE.Group(); head.position.y = 2.14; body.add(head);
    add(TOY.rcyl(0.09, 0.16, 0.03), joint, 0, -0.2, 0, head);
    add(TOY.rbox(0.56, 0.42, 0.48, 0.17), shell, 0, 0.02, 0, head);
    const face = add(TOY.rbox(0.46, 0.25, 0.05, 0.08), M('#262a3a', { gloss: 0.9, rough: 0.1 }), 0, 0.03, 0.235, head); face.castShadow = false;
    [-0.11, 0.11].forEach((x) => { const e = add(new THREE.SphereGeometry(0.042, 10, 8), M('#67e4ff', { emis: 1 }), x, 0.04, 0.26, head); e.castShadow = false; });
    add(TOY.rbox(0.58, 0.07, 0.5, 0.03), pink, 0, 0.12, 0, head);
    add(TOY.rcyl(0.022, 0.2, 0.01), joint, 0, 0.32, 0, head);
    add(new THREE.SphereGeometry(0.05, 10, 8), pink, 0, 0.43, 0, head);
    // 팔(오른손에 렌치)
    [-1, 1].forEach((s) => add(new THREE.SphereGeometry(0.135, 12, 10), joint, s * 0.45, 1.78, 0, body));
    const armL = limb(body, -0.47, 1.76, 0.2, 0.86, shell, joint), armR = limb(body, 0.47, 1.76, 0.2, 0.86, shell, joint);
    const steel = M('#d9e2f2', { gloss: 1, rough: 0.15 });
    const wr = new THREE.Group(); wr.position.set(0, -0.9, 0.05); armR.add(wr);
    add(TOY.rbox(0.09, 0.08, 0.68, 0.03), M('#ffb35a', { gloss: 0.5 }), 0, 0, 0.22, wr);
    add(TOY.rbox(0.24, 0.1, 0.18, 0.03), steel, 0, 0, 0.62, wr);
    g.scale.setScalar(1.15);
    return { g, body, head, legL, legR, armL, armR, way: [], tgt: null, t: 0, hitT: 0, walk: 0 };
  }
  const TOP_Y = 2.72; // 떡메 기계 꼭대기
  function botGo(b, x, z) {
    const p = b.g.position;
    if (z < AISLE - 0.05) b.topZ = z;
    b.way = [];
    if (Math.abs(p.z - AISLE) > 0.05) b.way.push(new V3(p.x, 0, AISLE));
    if (Math.abs(p.x - x) > 0.05) b.way.push(new V3(x, 0, AISLE));
    if (Math.abs(z - AISLE) > 0.05) b.way.push(new V3(x, 0, z));
    if (!b.way.length) b.way.push(new V3(x, 0, z));
  }
  function stepBot(dt) {
    const on = F.auto && up.humanoid;
    if (!on) { if (bot) bot.g.visible = false; return; }
    if (!bot) { bot = makeBot(); bot.g.position.copy(HOME); }
    const b = bot, p = b.g.position;
    b.g.visible = true; b.t += dt;
    // 할 일 고르기
    if (b.tgt && !b.tgt.bad) { b.tgt = null; b.way = []; b.fixing = false; }
    if (!b.tgt) {
      const bad = lines.filter((l) => l.bad);
      if (bad.length) { b.tgt = bad[0]; botGo(b, b.tgt.g.position.x - 2.6, b.tgt.g.position.z); b.fixing = false; }
      else if (!b.way.length && p.distanceTo(HOME) > 0.1) botGo(b, HOME.x, HOME.z);
    }
    let walking = false;
    if (b.way.length) {
      walking = true;
      const w = b.way[0], dx = w.x - p.x, dz = w.z - p.z, d = Math.hypot(dx, dz), st = 8.5 * dt;
      if (d <= st) { p.x = w.x; p.z = w.z; b.way.shift(); }
      else { p.x += dx / d * st; p.z += dz / d * st; b.g.rotation.y = Math.atan2(dx, dz); }
      b.walk += dt * 15;
      // 앞줄에서 기계 꼭대기로 폴짝 뛰어오르고, 트럭은 뛰어넘는다
      let y = Math.abs(Math.sin(b.walk)) * 0.1;
      if (p.z < AISLE - 0.02 && b.topZ != null) { const q = Math.min(1, (AISLE - p.z) / (AISLE - b.topZ)); y = TOP_Y * q * q * (3 - 2 * q) + Math.sin(q * PI) * 1.1; }
      else if (tState === 'wait' && Math.abs(p.x - TRUCK0.x) < 2) y = Math.cos((p.x - TRUCK0.x) / 2 * PI / 2) * 1.75;
      p.y = y;
    } else { const gy = b.tgt ? TOP_Y : 0; p.y += (gy - p.y) * Math.min(1, dt * 14); }
    const sw = walking ? Math.sin(b.walk) * 0.75 : 0;
    b.legL.rotation.x = sw; b.legR.rotation.x = -sw;
    b.armL.rotation.x = -sw * 0.7;
    b.body.rotation.z = walking ? Math.sin(b.walk) * 0.04 : 0;
    // 도착: 기계를 보고 렌치로 친다
    if (b.tgt && !b.way.length) {
      b.g.rotation.y = 0; // 기계 위에서 이쪽을 보고 쾅쾅
      if (!b.fixing) { b.fixing = true; b.hitT = 0.32; S('box'); FX.squash(b.g, 0.2); b.tgt.warn.visible = false; }
      b.hitT -= dt;
      const u = Math.max(0, b.hitT / 0.38); // 1 치켜듦 → 0 때림
      b.armR.rotation.x = -0.6 - u * 2.1;
      b.body.rotation.x = 0.1 - u * 0.12;
      if (b.hitT <= 0) { F.fix(b.tgt); b.hitT = 0.38; }
    } else {
      b.armR.rotation.x = sw * 0.7; b.body.rotation.x = 0;
      if (!walking) { b.head.rotation.y = Math.sin(b.t * 0.8) * 0.35; b.g.rotation.y = 0; b.armL.rotation.x = Math.sin(b.t * 1.7) * 0.05; } else b.head.rotation.y = 0;
    }
  }
  // 공장은 뒷줄까지 또렷하게 본다
  F.autoOn = function (on) { F.auto = !!on; RND.band = on ? 0.42 : 0; if (on) build(); };
})();
