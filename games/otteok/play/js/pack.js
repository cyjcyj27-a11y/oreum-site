// 포장 자리: 쟁반의 떡을 선물 상자 칸에 넣고(칸 바닥 색대로 놓으면 예쁨) → 뚜껑 → 보자기 네 귀 접기 → 매듭 → 스티커.
(function () {
  const PK = (window.PACK = {});
  const PI = Math.PI, V3 = THREE.Vector3;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  let X0 = 0, scene = null;
  const CELL = 0.62, BH = 0.46, WALL = 0.07;
  PK.build = function () { X0 = RND.ST.pack; scene = RND.scene; };
  PK.active = false;

  let st = null; // 지금 판의 상태
  // job: {slots:[type..], cols, rows, boxColor, wrap:{c,d}, tray(쟁반 묶음)}
  PK.start = function (job, done) {
    PK.active = true;
    const cols = job.cols, rows = job.rows, W = cols * CELL, D = rows * CELL;
    const box = new THREE.Group(); box.position.set(X0 + 0.5, 0, -0.1); scene.add(box);
    const bc = job.boxColor || '#ffd6e4';
    const wm = TOY.mat(bc, { gloss: 0.4, rough: 0.4 });
    // 바닥·벽
    TOY.mesh(TOY.rbox(W + WALL * 2, 0.08, D + WALL * 2, 0.04), wm, 0, 0.04, 0, box);
    TOY.mesh(TOY.rbox(W + WALL * 2, BH, WALL, 0.03), wm, 0, BH / 2, D / 2 + WALL / 2, box);
    TOY.mesh(TOY.rbox(W + WALL * 2, BH, WALL, 0.03), wm, 0, BH / 2, -D / 2 - WALL / 2, box);
    TOY.mesh(TOY.rbox(WALL, BH, D, 0.03), wm, W / 2 + WALL / 2, BH / 2, 0, box);
    TOY.mesh(TOY.rbox(WALL, BH, D, 0.03), wm, -W / 2 - WALL / 2, BH / 2, 0, box);
    // 칸막이(흰 종이)
    const dm = TOY.mat('#ffffff', { rough: 0.6 });
    for (let c = 1; c < cols; c++) TOY.mesh(TOY.rbox(0.03, BH * 0.7, D, 0.01), dm, -W / 2 + c * CELL, BH * 0.35 + 0.06, 0, box);
    for (let r = 1; r < rows; r++) TOY.mesh(TOY.rbox(W, BH * 0.7, 0.03, 0.01), dm, 0, BH * 0.35 + 0.06, -D / 2 + r * CELL, box);
    // 칸 바닥: 놓을 떡의 색 동그라미(옅게)
    const slots = [];
    job.slots.forEach((ty, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const p = new V3(-W / 2 + (c + 0.5) * CELL, 0.08, -D / 2 + (r + 0.5) * CELL);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.2, 28), TOY.basic(DATA.DDEOK[ty].color, 0.55));
      dot.rotation.x = -PI / 2; dot.position.copy(p); dot.position.y = 0.085; dot.renderOrder = 2; box.add(dot);
      slots.push({ p, ty, item: null, dot });
    });
    box.scale.setScalar(0.01);
    FX.tw(0.4, (u) => box.scale.setScalar(Math.max(0.01, u)), () => { box.scale.setScalar(1); }, FX.ease.back);
    S('box');
    // 쟁반을 포장 자리 왼쪽 앞에 둔다
    const tray = job.tray;
    st = { job, box, W, D, cols, rows, slots, tray, state: 'place', grab: null, down: null, done, items: tray.userData.items.slice(), placed: 0, match: 0 };
    G.point(st.items[0], 0.6);
  };

  function pickItem(p) {
    const list = st.items.filter((it) => !it.userData.placed);
    for (const it of list) it.traverse((o) => { if (o.isMesh) o.userData.pickRoot = it; });
    const ray = RND.pick(p.x, p.y, list.map((it) => { it.userData.pick = 'item'; return it; }));
    return ray ? ray.obj : null;
  }
  function slotWorld(s) { return st.box.localToWorld(s.p.clone()); }
  function nearestSlot(wp, maxD) {
    let best = null, bd = maxD || 0.55;
    st.slots.forEach((s) => { if (s.item) return; const w = slotWorld(s); const d = Math.hypot(w.x - wp.x, w.z - wp.z); if (d < bd) { bd = d; best = s; } });
    return best;
  }
  function autoSlot(it) {
    const ty = it.userData.type;
    return st.slots.find((s) => !s.item && s.ty === ty) || st.slots.find((s) => !s.item);
  }
  function place(it, s) {
    s.item = it; it.userData.placed = true;
    const wp = it.getWorldPosition(new V3());
    st.box.add(it); st.box.worldToLocal(wp); it.position.copy(wp);
    const to = s.p.clone(); to.y = 0.09;
    const ty = it.userData.type;
    const want = { injeolmi: 0.88, songpyeon: 0.72, mujigae: 0.95, kkuldduk: 1.05, jeolpyeon: 0.95, garaetteok: 0.92, baekseolgi: 0.9, ddalgi: 0.95 }[ty] || 0.9;
    // 칸(안쪽 약 0.52) 안에 꼭 들어가게: 지금 크기에서 가로·세로 중 긴 쪽을 재서 줄인다
    const bb = new THREE.Box3().setFromObject(it), sz = bb.getSize(new V3()), k0 = it.scale.x || 1;
    const fit = 0.52 / Math.max(0.01, Math.max(sz.x, sz.z) / k0);
    const sc = Math.min(want, fit);
    const s0 = it.scale.x, r0 = it.rotation.y;
    FX.hop(it, to, 0.32, 0.5, () => {
      FX.squash(it, 0.3); FX.squash(st.box, 0.05);
      const ok = s.ty === ty;
      S('pop', ok ? 1.25 : 0.85);
      if (ok) { st.match++; FX.burst(slotWorld(s).add(new V3(0, 0.4, 0)), { n: 4, kind: 'heart', color: ['#ff8fb1', '#ffc1d8'], size: 0.16, speed: 1.2, up: 2, glow: true }); }
      s.dot.visible = false;
      st.placed++;
      if (st.placed >= st.slots.length) allIn();
      else G.point(st.items.find((x) => !x.userData.placed), 0.6);
    });
    FX.tw(0.32, (u) => { it.scale.setScalar(s0 + (sc - s0) * u); it.rotation.y = r0 * (1 - u); });
  }
  function allIn() {
    st.state = 'lid';
    const prettyK = st.match / st.slots.length;
    FX.text(st.box.localToWorld(new V3(0, 1.2, 0)), prettyK >= 1 ? 'PRETTY!' : prettyK >= 0.6 ? 'GOOD' : 'MESSY', prettyK >= 1 ? 'pf' : prettyK >= 0.6 ? 'gd' : 'bd', -30);
    if (prettyK >= 1) { S('ding', G.combo()); G.addCombo(); } else G.resetCombo();
    // 쟁반은 떠난다
    const tr = st.tray;
    FX.tw(0.3, (u) => tr.scale.setScalar(Math.max(0.01, 1 - u)), () => scene.remove(tr), FX.ease.in);
    // 뚜껑 준비(위에 둥실)
    const lid = (st.lid = new THREE.Group());
    const lc = TOY.mat(st.job.boxColor || '#ffd6e4', { gloss: 0.5, rough: 0.35 });
    TOY.mesh(TOY.rbox(st.W + WALL * 2 + 0.06, 0.16, st.D + WALL * 2 + 0.06, 0.06), lc, 0, 0, 0, lid);
    const rb = TOY.mat('#ffffff', { gloss: 0.5, rough: 0.4 });
    TOY.mesh(TOY.rbox(0.14, 0.18, st.D + WALL * 2 + 0.08, 0.04), rb, 0, 0.005, 0, lid);
    TOY.mesh(TOY.rbox(st.W + WALL * 2 + 0.08, 0.18, 0.14, 0.04), rb, 0, 0.005, 0, lid);
    lid.position.set(0, 2.2, 0); lid.visible = false; st.box.add(lid);
    FX.wait(0.35, () => { lid.visible = true; lid.scale.setScalar(0.01); FX.tw(0.3, (u) => lid.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back); G.point(lid, 0.3); });
  }
  function closeLid() {
    st.state = 'lidding'; G.point(null);
    const lid = st.lid;
    FX.to(lid, new V3(0, BH + 0.08, 0), 0.22, () => {
      FX.squash(st.box, 0.18); S('lid'); RND.shake(0.05);
      FX.puff(st.box.localToWorld(new V3(0, 0.2, 0)), { n: 6, size: 0.2, up: 0.3, speed: 2.2, spread: 1.4, life: 0.5, op: 0.6 });
      FX.wait(0.25, makeWrap);
    }, FX.ease.in);
  }

  // ---------- 보자기 ----------
  function makeWrap() {
    const w = st.job.wrap;
    const cm = TOY.mat(w.c, { rough: 0.85, sheen: 0.8, map: clothTex(w.c, w.d) });
    const W = st.W + WALL * 2 + 0.1, D = st.D + WALL * 2 + 0.1, H = BH + 0.2;
    const flaps = [];
    // 바닥 천(상자 아래 깔림)
    const base = TOY.mesh(TOY.rbox(W + 0.02, 0.03, D + 0.02, 0.012), cm, 0, -0.005, 0, st.box);
    base.scale.setScalar(0.01);
    FX.tw(0.25, (u) => base.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back);
    // 네 귀: 옆판(높이 H) + 위 세모(남은 반)
    [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([sx, sz], k) => {
      const along = sx ? D : W, half = sx ? W / 2 : D / 2;
      const pv = new THREE.Group();
      pv.position.set(sx * (W / 2), 0, sz * (D / 2));
      pv.rotation.y = Math.atan2(sx, sz); // 바깥쪽을 +z 로
      st.box.add(pv);
      const hinge = new THREE.Group(); pv.add(hinge);
      const side = TOY.mesh(TOY.rbox(along, 0.03, H, 0.012), cm, 0, 0, H / 2, hinge);
      const topPv = new THREE.Group(); topPv.position.set(0, 0, H); hinge.add(topPv);
      const tri = TOY.mesh(triGeo(along, half), cm, 0, 0, 0, topPv);
      tri.castShadow = true;
      flaps.push({ pv, hinge, topPv, k, done: false, pickMesh: side });
      side.userData.flap = flaps[flaps.length - 1]; tri.userData.flap = flaps[flaps.length - 1];
      hinge.scale.setScalar(0.01);
      FX.tw(0.3, (u) => hinge.scale.setScalar(Math.max(0.01, u)), null, FX.ease.back, 0.05 * k);
    });
    st.flaps = flaps; st.state = 'wrap'; st.folded = 0;
    S('whoosh');
    G.point(flaps[0].topPv, 0.2);
  }
  function triGeo(base, h) {
    const s = new THREE.Shape();
    const r = 0.12;
    s.moveTo(-base / 2, 0); s.lineTo(base / 2, 0); s.lineTo(r, h - r); s.quadraticCurveTo(0, h + r * 0.2, -r, h - r); s.lineTo(-base / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
    g.rotateX(PI / 2); // 바닥에 눕힘: y→z
    return g;
  }
  const clothCache = {};
  function clothTex(c, d) {
    if (clothCache[c]) return clothCache[c];
    const t = TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#f6eef2'; g.fillRect(0, 0, w, h);
      // 흰 꽃 무늬 + 천 결
      g.fillStyle = 'rgba(255,255,255,.0)';
      for (let y = 32; y < h; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < w + 32; x += 64) {
        g.fillStyle = '#ffffff'; for (let a = 0; a < 5; a++) { g.beginPath(); g.arc(x + Math.cos(a * 1.256) * 8, y + Math.sin(a * 1.256) * 8, 6.5, 0, 7); g.fill(); }
        g.fillStyle = '#fff1a8'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill();
      }
      g.globalAlpha = 0.03; g.fillStyle = '#000';
      for (let i = 0; i < h; i += 4) g.fillRect(0, i, w, 1);
    }), [1.5, 1.5]);
    // 바탕색은 재질 색으로 칠하고 무늬는 흰 바탕에 그렸으니 곱하기로 섞인다
    return (clothCache[c] = t);
  }
  function fold(f) {
    if (f.done) return;
    f.done = true; st.folded++;
    S('fold', 0.9 + st.folded * 0.1);
    FX.tw(0.22, (u) => { f.hinge.rotation.x = -PI / 2 * u; }, () => {
      FX.tw(0.2, (u) => { f.topPv.rotation.x = -PI / 2 * u; }, () => {
        FX.squash(st.box, 0.1);
        // 빨리 연달아 접으면 앞 귀의 끝 콜백에서도 folded 가 4라 매듭이 두 번 묶였다(스티커가 하나 남아 떠 있음)
        if (st.folded >= 4) { if (st.state === 'wrap') knot(); }
        else G.point(st.flaps.find((x) => !x.done).topPv, 0.2);
      }, FX.ease.back);
    }, FX.ease.out);
    G.point(null);
  }
  function knot() {
    st.state = 'knotting';
    const w = st.job.wrap, cm = TOY.mat(w.c, { rough: 0.85, sheen: 0.8, map: clothTex(w.c, w.d) });
    const W = st.W + WALL * 2 + 0.26, D = st.D + WALL * 2 + 0.26, H0 = BH + 0.34;
    // 접은 귀들이 천 보따리 하나로 부푼다(둥근 베개 모양). 속 상자·뚜껑은 천 속으로
    st.box.children.forEach((c) => { c.visible = false; });
    const pil = TOY.mesh(TOY.rbox(W, H0, D, Math.min(0.24, H0 / 2 - 0.01), 4), cm, 0, H0 / 2, 0, st.box);
    pil.scale.set(1.08, 0.9, 1.08);
    FX.tw(0.3, (u) => pil.scale.set(1.08 - 0.08 * u, 0.9 + 0.1 * u, 1.08 - 0.08 * u), () => { FX.setBase(pil); }, FX.ease.back);
    // 대각선 접힘 줄(천 주름)
    const fm = TOY.mat(w.d, { rough: 0.9, op: 0.55 });
    [[1, 1], [1, -1]].forEach(([a, b]) => { const ln = TOY.mesh(TOY.rbox(Math.hypot(W, D) * 0.46, 0.012, 0.035, 0.006, 1), fm, 0, H0 + 0.002, 0, st.box); ln.rotation.y = Math.atan2(b * D, a * W); ln.castShadow = false; });
    const H = H0;
    const kn = (st.knot = new THREE.Group()); kn.position.set(0, H, 0); st.box.add(kn);
    const kS = Math.min(1.25, 0.75 + (st.W + st.D) * 0.14);
    kn.userData.s = kS;
    const ball = TOY.mesh(new THREE.SphereGeometry(0.2, 22, 16), cm, 0, 0.12, 0, kn); ball.scale.set(1.1, 0.85, 1);
    [-1, 1].forEach((s) => {
      // 귀: 위로 솟은 둥근 고리 모양
      const ear = TOY.mesh(new THREE.SphereGeometry(0.3, 22, 16), cm, s * 0.34, 0.34, 0, kn);
      ear.scale.set(1.0, 0.62, 0.5); ear.rotation.z = -s * 0.75;
      const hole = TOY.mesh(new THREE.SphereGeometry(0.12, 14, 10), TOY.mat(w.d, { rough: 0.95, op: 0.6 }), s * 0.4, 0.4, 0.13, kn);
      hole.scale.set(1.0, 0.6, 0.25); hole.rotation.z = -s * 0.75;
      // 꼬리: 앞뒤로 늘어진 끝
      const tail = TOY.mesh(new THREE.SphereGeometry(0.18, 16, 12), cm, s * 0.1, 0.05, s * 0.26, kn);
      tail.scale.set(0.6, 0.3, 1.25); tail.rotation.x = s * 0.5;
    });
    kn.scale.setScalar(0.01);
    FX.tw(0.45, (u) => kn.scale.setScalar(Math.max(0.01, u * kS)), () => { FX.setBase(kn); FX.squash(kn, 0.35); }, FX.ease.back);
    kn.scale.setScalar(0.01);
    S('knot');
    FX.tw(0.45, (u) => kn.scale.setScalar(Math.max(0.01, u)), () => { FX.setBase(kn); FX.squash(kn, 0.35); }, FX.ease.back);
    FX.squash(st.box, 0.2);
    const top = st.box.localToWorld(new V3(0, H + 0.3, 0));
    FX.burst(top, { n: 14, kind: 'star', color: ['#fff3a0', '#ffd1e0', '#c9f0ff', '#ffffff'], size: 0.2, speed: 2.6, up: 3, glow: true });
    FX.ring(st.box.localToWorld(new V3(0, 0.05, 0)), { color: '#ffd1e0', size: 0.8, to: 3 });
    FX.wait(0.55, () => { st.state = 'sticker'; showSticker(); });
  }
  // 마지막 할 일이 보이게: 봉인 스티커가 꾸러미 앞 위에 둥둥 떠서 기다린다(누르면 앞면에 착 붙음)
  function showSticker() {
    const D = st.D + WALL * 2 + 0.1;
    const hv = (st.hover = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ map: stickerTex(), roughness: 0.4, side: THREE.DoubleSide })));
    // 꾸러미 오른쪽 옆 허공, 카메라 쪽으로 눕혀서 크게
    const y0 = BH + 0.7, x0 = st.W / 2 + WALL + 0.75;
    hv.position.set(x0, y0, 0.25); hv.rotation.x = -1.05; st.box.add(hv);
    hv.scale.setScalar(0.01);
    FX.tw(0.3, (u) => hv.scale.setScalar(Math.max(0.01, u * 2.2)), null, FX.ease.back);
    S('pop', 1.1);
    const bob = () => { if (st && st.hover === hv) FX.tw(0.8, (u) => { hv.position.y = y0 + Math.sin(u * PI) * 0.15; hv.rotation.z = Math.sin(u * PI * 2) * 0.15; hv.scale.setScalar(2.2 + Math.sin(u * PI) * 0.18); }, bob, FX.ease.lin); };
    bob();
    G.point(hv, 0.35);
  }
  function sticker() {
    st.state = 'stickering'; G.point(null);
    // 보자기 윗면 앞 오른쪽 귀퉁이(가운데는 매듭). 천은 폭 st.W/D + WALL*2 + 0.26, 높이 BH + 0.34
    const W = st.W + WALL * 2 + 0.26, D = st.D + WALL * 2 + 0.26;
    const hv = st.hover; st.hover = null;
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ map: stickerTex(), roughness: 0.4 }));
    s.position.set(W / 2 - 0.45, BH + 0.34 + 0.012, D / 2 - 0.45);
    s.rotation.x = -PI / 2;
    if (hv) {
      // 떠 있던 스티커가 윗면으로 날아가 붙는다
      FX.to(hv, s.position.clone().add(new V3(0, 0.15, 0)), 0.16, () => { st.box.remove(hv); slap(); }, FX.ease.in);
      FX.tw(0.16, (u) => { hv.rotation.x = -1.05 + (1.05 - PI / 2) * u; hv.scale.setScalar(2.2 - 1.2 * u); }, null, FX.ease.in);
    } else slap();
    function slap() {
    st.box.add(s);
    s.scale.setScalar(2.4); s.rotation.z = 0.3;
    S('slap');
    FX.tw(0.16, (u) => { s.scale.setScalar(2.4 - 1.4 * u); s.rotation.z = 0.3 * (1 - u) - 0.1 * u; }, () => {
      FX.squash(st.box, 0.12);
      FX.burst(st.box.localToWorld(s.position.clone()), { n: 6, kind: 'star', color: ['#ff8fb1', '#fff3a0'], size: 0.14, speed: 1.6, up: 1.5, glow: true });
      FX.wait(0.35, finish);
    }, FX.ease.in);
    }
  }
  let stTex = null;
  function stickerTex() {
    if (stTex) return stTex;
    stTex = TOY.tex(TOY.canvas(256, 256, (g, w, h) => {
      g.fillStyle = '#ff7aa8'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.setLineDash([12, 10]); g.beginPath(); g.arc(128, 128, 104, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffffff'; g.font = "92px 'Ttl','Ui',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L('오떡', 'OT'), 128, 136);
    }));
    return stTex;
  }
  function finish() {
    st.state = 'done'; PK.active = false;
    const items = st.slots.map((s) => s.item);
    const q = items.reduce((a, it) => a + (it.userData.q == null ? 0.7 : it.userData.q), 0) / items.length;
    const res = { box: st.box, pretty: st.match / st.slots.length, q, H: BH + 0.5, W: st.W, D: st.D };
    const done = st.done; st = null;
    done(res);
  }

  PK.down = function (p) {
    if (!st) return;
    if (st.state === 'place') {
      const it = pickItem(p);
      if (!it) return;
      st.grab = it; st.down = { x: p.x, y: p.y, moved: false };
      const wp = it.getWorldPosition(new V3());
      scene.attach(it);
      it.userData.from = wp.clone();
      FX.squash(it, -0.25); S('pop', 1.1);
    } else if (st.state === 'lid') closeLid();
    else if (st.state === 'wrap') {
      // 누른 귀를 접고, 빈 데를 누르면 다음 귀
      const ray = RND.pick(p.x, p.y, st.flaps.map((f) => { f.hinge.userData.pick = 'flap'; f.hinge.userData.f = f; return f.hinge; }));
      const f = ray && ray.obj.userData.f && !ray.obj.userData.f.done ? ray.obj.userData.f : st.flaps.find((x) => !x.done);
      if (f) fold(f);
    } else if (st.state === 'sticker') sticker();
  };
  PK.move = function (p) {
    if (!st || !st.grab) return;
    if (Math.hypot(p.x - st.down.x, p.y - st.down.y) > 10) st.down.moved = true;
    if (!st.down.moved) return;
    const g = RND.groundAt(p.x, p.y, 0.7);
    if (g) { st.grab.position.lerp(new V3(g.x, 0.7, g.z), 0.6); }
    // 가까운 칸을 살짝 밝힘
    const s = nearestSlot(st.grab.position, 0.55);
    st.slots.forEach((x) => { if (!x.item) x.dot.material = TOY.basic(DATA.DDEOK[x.ty].color, x === s ? 0.95 : 0.55); });
  };
  PK.up = function (p) {
    if (!st || !st.grab) return;
    const it = st.grab; st.grab = null;
    let s = null;
    if (!st.down.moved) s = autoSlot(it);
    else s = nearestSlot(it.position, 0.6);
    st.slots.forEach((x) => { if (!x.item) x.dot.material = TOY.basic(DATA.DDEOK[x.ty].color, 0.55); });
    if (s) place(it, s);
    else {
      // 제자리로
      const tr = st.tray, to = it.userData.from;
      FX.hop(it, to, 0.3, 0.4, () => { tr.attach(it); FX.squash(it, 0.2); });
    }
  };
  PK.step = function () {};
  PK.state = () => (st ? st.state : null);
  PK.box = () => (st ? st.box : null);
})();
