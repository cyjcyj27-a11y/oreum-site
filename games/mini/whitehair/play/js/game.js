// 게임 진행: 오프닝 → 손님 → 집고 당기기 → 결과 → 상점 → 다음 손님 … → 엔딩
(function () {
  const G = (window.GAME = {});
  const D = DATA, H = HEAD;
  const KEY = 'whitehair.save';
  const def = () => ({ cust: 0, coins: 0, gear: { tweez: 0, comb: 0, lamp: 0, loupe: 0, chair: 0, tea: 0, rub: 0 }, dex: {}, stats: { plucked: 0, perfect: 0, snaps: 0, blacks: 0, earned: 0, ouch: 0, fails: 0 }, how: false, done: false, started: false });
  let S;
  try { S = Object.assign(def(), JSON.parse(localStorage.getItem(KEY) || '{}')); S.gear = Object.assign(def().gear, S.gear); S.stats = Object.assign(def().stats, S.stats); } catch (e) { S = def(); }
  G.S = S;
  G.save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  G.reset = () => { const how = S.how; Object.keys(S).forEach((k) => delete S[k]); Object.assign(S, def()); S.how = how; G.save(); };
  const gv0 = (k) => D.GEAR[k][S.gear[{ grabR: 'tweez', dblR: 'tweez', snapK: 'tweez', combR: 'comb', expo: 'lamp', zoomMin: 'loupe', move: 'chair', patMax: 'tea', rub: 'rub' }[k]]];
  // 참빗은 실제 크기(cm)로: 지금 확대 정도에서 1cm 가 몇 픽셀인지 곱함(확대하면 참빗도 커짐)
  const pxPerCm = () => { const c = RND.camera; return innerHeight * c.projectionMatrix.elements[5] * 0.5 / Math.max(4, c.position.distanceTo(target) - 8); };
  const gv = (k) => (k === 'combR' ? Math.max(40, Math.min(420, gv0(k) * pxPerCm())) : gv0(k));
  G.gv = gv;

  G.mode = 'title';
  let cust = null, pat = 100, patMax = 100, combo = 0, rubLeft = 0, clearT = -1;
  const tally = { white: 0, gold: 0, black: 0, nice: 0, snap: 0 }; // 이번 손님 정산할 가닥 수 + 팁 따질 실수
  G.combMode = false;
  const cam = { az: 2.5, pol: 0.72, dist: 38, taz: 2.5, tpol: 0.72, tdist: 38 };
  const target = new THREE.Vector3(0, 1.8, 0);
  // 머리 움직임
  const hm = { pitch: 0, yaw: 0, roll: 0, vp: 0, vy: 0, vr: 0, tp: 0, ty: 0, tr: 0, ev: 3, evT: 0, kind: '' };
  const sway = new THREE.Vector3(), lastQ = new THREE.Quaternion();

  // ---------- 손님 ----------
  G.startCustomer = function (i) {
    cust = G.cust = D.customer(i);
    H.build(cust);
    patMax = gv('patMax'); pat = patMax; combo = 0; rubLeft = gv('rub'); clearT = -1; tally.white = tally.gold = tally.black = tally.nice = tally.snap = 0;
    cam.az = cam.taz = 2.5 + (i % 3) * 0.3; cam.pol = cam.tpol = 0.72; cam.dist = cam.tdist = 38;
    Object.assign(hm, { pitch: 0, yaw: 0, roll: 0, vp: 0, vy: 0, vr: 0, tp: 0, ty: 0, tr: 0, ev: 4, evT: 0, kind: '' });
    H.tent.h.value = 0; drop();
    RND.scene = RND.salon; RND.salonLight(gv('expo')); RND.neck.material.color.copy(H.earMat.color);
    H.hairMat.uniforms.uExpo.value = 0.92 + (gv('expo') - 1) * 0.7;
    G.mode = 'play'; S.started = true; G.save();
    // 첫 집기 멈칫 막기: 화면 좌표 칸을 미리 만들고 한 번 찾아 둠
    updCam(1); prep(); H.near(innerWidth / 2, innerHeight / 2, 10);
    // 첫 빗질 멈칫 막기: 가닥 고쳐 쓰는 코드를 미리 데움(모양은 그대로)
    for (let i = 0; i < 300 && i < H.S.length; i++) { H.shape(H.S[i]); H.write(H.S[i]); }
    H.comb(0, 0, 1, 0, 1, 0, 0.0001, new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
    UI.dishReset(); UI.hud(); UI.show('play');
  };

  // ---------- 집기 ----------
  let grab = null;
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(), v2 = new THREE.Vector2();
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  function ndc(x, y) { return v2.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); }
  function curveAt(st, s, out) { const f = s * H.SEG, k = Math.min(H.SEG - 1, Math.floor(f)), t = f - k, P = st.pts; return out.set(P[k * 3] + (P[k * 3 + 3] - P[k * 3]) * t, P[k * 3 + 1] + (P[k * 3 + 4] - P[k * 3 + 1]) * t, P[k * 3 + 2] + (P[k * 3 + 5] - P[k * 3 + 2]) * t); }
  function arcLen(st, s) { let l = 0; const n = Math.ceil(s * H.SEG * 2); let prev = curveAt(st, 0, new THREE.Vector3()); for (let i = 1; i <= n; i++) { const q = curveAt(st, (s * i) / n, new THREE.Vector3()); l += q.distanceTo(prev); prev = q; } return l; }
  function prep(near) { RND.camera.updateMatrixWorld(); H.pivot.updateMatrixWorld(true); H.project(RND.camera, innerWidth, innerHeight, near); }
  G.tryGrab = function (x, y) {
    if (G.mode !== 'play' || clearT >= 0) return false;
    const R = gv('grabR');
    prep({ x, y, r: R });
    let list = H.near(x, y, R);
    if (!list.length) return false;
    let best = list[0];
    // 손끝에 걸린 흰머리는 조금 너그럽게
    const w = list.find((c) => c.st.white && c.d < R * 0.6 && c.d < best.d + 2.5);
    if (w) best = w;
    const sel = [best];
    const dbl = gv('dblR');
    // 옆 머리는 집은 가닥 위에 겹쳐 누운 것만 같이 딸려 온다(족집게가 좋을수록 덜)
    for (const c of list) { if (c === best || sel.length >= 3) continue; if (c.d < dbl && c.z < best.z - 0.05 && !c.st.white) sel.push(c); }
    // 쌍둥이는 같이
    sel.slice().forEach((c) => { if (c.st.pair >= 0) { const p = H.S[c.st.pair]; if (p && p.alive && !sel.find((q) => q.st === p)) sel.push({ st: p, sg: c.sg, d: 0, z: c.z }); } });
    grab = { items: sel.map((c) => ({ st: c.st, sg: Math.max(0.06, c.sg), tail: null })), t0: performance.now() / 1000, ext: 0, lastExt: 0, v: 0, pullT: 0, maxV: 0, pain: 0 };
    grab.items.forEach((it) => { it.st.held = true; H.write(it.st); it.L0 = arcLen(it.st, it.sg); });
    const m = grab.items[0];
    m.g0 = curveAt(m.st, m.sg, new THREE.Vector3());
    grab.g0w = H.g.localToWorld(m.g0.clone());
    grab.sx = grab.cx = x; grab.sy = grab.cy = y;
    RND.camera.getWorldDirection(_a);
    plane.setFromNormalAndCoplanarPoint(_a, grab.g0w);
    grab.Pw = grab.g0w.clone();
    grab.root = m.st.root.clone();
    G.tw.visible = S.gear.tweez > 0; if (S.gear.tweez > 0) G.buildTweez(S.gear.tweez);
    SND.ui();
    return true;
  };
  G.moveGrab = function (x, y) {
    if (!grab) return;
    grab.cx = x; grab.cy = y;
    ray.setFromCamera(ndc(x, y), RND.camera);
    if (!ray.ray.intersectPlane(plane, _b)) return;
    // 끈 만큼 화면 쪽으로 끌려 나오고, 두피에서도 그만큼 들림(어느 쪽으로 끌어도 머리에서 멀어짐)
    const dd = _b.distanceTo(grab.g0w);
    _c.copy(grab.items[0].st.n).transformDirection(H.g.matrixWorld);
    grab.Pw.copy(_b).addScaledVector(_c, dd * 0.75);
  };
  function drop() {
    if (!grab) return;
    grab.items.forEach((it) => { it.st.held = false; H.write(it.st); });
    grab = null; H.setDyn([]); G.tw.visible = false; SND.strain(0); UI.grip(null);
  }
  G.release = function () { if (grab) { drop(); } };

  function pluck() {
    const items = grab.items; const g = grab;
    const dur = g.pullT;
    let whites = 0, blacks = 0, coin = 0, gold = false;
    const fly = [];
    items.forEach((it) => {
      const st = it.st; st.alive = false; st.held = false; H.write(st);
      fly.push({ pts: it.drawn.map((p) => p.clone()), col: it.col, wid: st.wid, n: st.n, half: !!st.c1, white: st.white, type: st.type, broken: false });
      if (st.white) { whites++; S.dex[st.type] = (S.dex[st.type] || 0) + 1; if (st.type === 'gold') gold = true; }
      else blacks++;
    });
    // 쌍둥이 둘은 한 가닥으로 셈
    if (items.filter((i) => i.st.type === 'twin').length > 1) whites--;
    // 판 끝 정산(사장님 10/22): 흰머리 +100, 황금 머리카락 +1000, 검은 머리 -100 — 코인은 판이 끝날 때 한꺼번에
    if (gold) { tally.gold++; tally.white += whites - 1; coin = 1000 + (whites - 1) * 100; } else { tally.white += whites; coin = whites * 100; }
    tally.black += blacks;
    const perfect = blacks === 0 && g.maxV < 0.55 && dur <= 1.4;
    S.stats.plucked += whites;
    if (whites) {
      combo = perfect ? combo + 1 : 0; if (!perfect) tally.nice++;
      if (perfect) { S.stats.perfect += whites; if (cust.heal) pat = Math.min(patMax, pat + cust.heal); }
      UI.praise(gold ? 'GOLD!' : perfect ? (combo > 1 ? 'PERFECT x' + combo : 'PERFECT') : 'NICE', '+' + (coin - blacks * 100), gold ? 'gold' : perfect ? 'perfect' : 'nice', g.sx, g.sy);
      SND.pluck(perfect); setTimeout(() => (gold ? SND.gold() : SND.coin()), 90);
    }
    if (blacks) {
      combo = 0; S.stats.blacks += blacks; S.stats.ouch++;
      hurt(mistake(10, 100) * blacks, true);
      if (!whites) { SND.pluck(false); UI.praise('', '-' + blacks * 100, 'minus', g.sx, g.sy); }
    }
    drop();
    G.flyAdd(fly);
    UI.hud();
    if (H.whiteCount() === 0) clearT = 0.9;
    G.save();
  }
  function snap() {
    const it = grab.items[0], st = it.st;
    S.stats.snaps++; combo = 0; tally.snap++;
    const keep = Math.max(0.25, it.L0 * 0.9);
    const piece = it.drawn.slice(Math.round(it.sg * 12)).map((p) => p.clone());
    while (piece.length < 13) piece.unshift(piece[0].clone());
    G.flyAdd([{ pts: piece, col: [it.col[1], it.col[1]], wid: st.wid, n: st.n, white: false, broken: true }]);
    st.L = keep; st.layer = Math.min(st.layer, 0.25); H.shape(st);
    SND.snap(); hurt(mistake(3, 40), false);
    UI.praise('SNAP', '', 'snap', grab.sx, grab.sy);
    drop();
  }
  // 실수 한 번에 깎이는 인내심: 첫 손님 a → 마지막 손님 b(사장님 10/22 "초반은 인내심 높은데 판올라갈수록 실수한번에 바로 나가는거로")
  // 검은 머리 10→100(마지막 쪽은 한 가닥에 바로 나감), 끊김 3→40, 오래 당겨 움찔 6→50
  function mistake(a, b) { const t = Math.pow(cust.i / (D.COUNT - 2), 1.3); return Math.round(a + (b - a) * Math.min(1, t)); }
  function hurt(n, big) {
    pat = Math.max(0, pat - n);
    hm.vp -= big ? 1.6 : 0.6; hm.vy += (Math.random() - 0.5) * (big ? 1.4 : 0.5); hm.vr += (Math.random() - 0.5) * 0.8;
    if (big) { SND.ouch(n > 12); UI.ouch(); }
    UI.hud();
  }
  G.rub = function () {
    if (G.mode !== 'play' || rubLeft <= 0) return;
    rubLeft--; pat = Math.min(patMax, pat + 35); hm.tp = 0.05; SND.coin(); UI.praise(L('시원하다', 'Ahh'), '', 'nice', innerWidth / 2, innerHeight * 0.4); UI.hud();
  };

  // 날아가 접시로
  const flying = [];
  G.flyAdd = function (list) { list.forEach((f) => flying.push({ f, t: 0 })); };
  function updFly(dt) {
    if (!flying.length) return;
    const dish = UI.dishPoint();
    ray.setFromCamera(ndc(dish[0], dish[1]), RND.camera);
    const tw = ray.ray.at(10, new THREE.Vector3()); H.g.worldToLocal(tw);
    const out = [];
    for (let i = flying.length - 1; i >= 0; i--) {
      const F = flying[i]; F.t += dt;
      const k = Math.min(1, F.t / 0.42), e = k * k * (3 - 2 * k);
      if (!F.base) F.base = F.f.pts.map((p) => p.clone());
      const c0 = F.base[0];
      const pts = F.base.map((p) => _a.copy(p).sub(c0).multiplyScalar(1 - e * 0.85).add(c0.clone().lerp(tw, e)).clone());
      pts.forEach((p, j) => { p.y += Math.sin(e * Math.PI) * 2.5; });
      if (k >= 1) { flying.splice(i, 1); UI.dishAdd(F.f); continue; }
      if (out.length < H.DN) out.push({ pts, col: F.f.col, wid: F.f.wid, n: F.f.n, half: F.f.half });
    }
    if (!grab) H.setDyn(out);
    G.flyDyn = out;
  }

  // ---------- 매 프레임 ----------
  const gL = new THREE.Vector3();
  function updGrab(dt) {
    if (!grab) { H.tent.h.value *= Math.exp(-dt * 14); if (!flying.length) H.setDyn([]); return; }
    const P = H.g.worldToLocal(grab.Pw.clone());
    const m = grab.items[0];
    const dist = P.distanceTo(m.st.root), slack = m.L0 * 0.92;
    const ext = Math.max(0, dist - slack);
    const nd = _a.subVectors(P, m.st.root).normalize();
    // 두피가 당기는 쪽으로 솟음
    const rootS = 1.0 * D.TYPES[m.st.type || 'normal'].root * (m.st.white ? 1 : 1.1);
    const h = Math.min(ext * 0.6, 0.65);
    H.tent.p.value.copy(m.st.root); H.tent.d.value.copy(nd).lerp(m.st.n, 0.4).normalize(); H.tent.h.value = h;
    const rv = (ext - grab.lastExt) / Math.max(dt, 1e-3); grab.lastExt = ext;
    grab.v += (rv - grab.v) * Math.min(1, dt * 14);
    if (ext > 0.02) grab.pullT += dt;
    SND.strain(Math.min(1, ext / rootS));
    if (ext > 0.05) { pat -= ext * dt * 9; grab.pain += dt * ext; }
    // 오래 버티면 손님이 움찔해서 놓침
    if (grab.pain > 0.55 * rootS * rootS) { hurt(mistake(6, 50), true); drop(); return; }
    // 그리기: 뿌리~집은 곳은 팽팽해지고, 끝은 늘어짐
    H.g.worldToLocal(gL.set(0, -1, 0).add(H.g.getWorldPosition(new THREE.Vector3()))).normalize();
    const draw = [];
    grab.items.forEach((it, ii) => {
      const st = it.st, n1 = Math.max(2, Math.round(it.sg * 12)), rootT = st.root.clone().addScaledVector(H.tent.d.value, ii === 0 ? h * 1.5 : h * 0.8);
      const g0 = curveAt(st, it.sg, new THREE.Vector3());
      const Pi = ii === 0 ? P : P.clone().add(_b.subVectors(g0, m.g0).multiplyScalar(0.5));
      const sl = it.L0 * 0.92, b = Math.pow(Math.min(1, Pi.distanceTo(st.root) / Math.max(0.01, sl)), 3);
      const pts = [];
      for (let i = 0; i <= n1; i++) {
        const t = i / n1;
        const o = curveAt(st, t * it.sg, new THREE.Vector3()).add(_b.subVectors(Pi, g0).multiplyScalar(t));
        if (i === 0) o.copy(rootT);
        const s = new THREE.Vector3().lerpVectors(rootT, Pi, t);
        pts.push(o.lerp(s, b));
      }
      // 끝: 늘어지는 사슬
      const nt = 12 - n1;
      if (!it.tail || it.tail.length !== nt + 1) {
        it.tail = []; it.prev = [];
        for (let i = 0; i <= nt; i++) { const q = curveAt(st, it.sg + (1 - it.sg) * (i / Math.max(1, nt)), new THREE.Vector3()).add(_b.subVectors(Pi, g0)); it.tail.push(q); it.prev.push(q.clone()); }
        it.seg = (st.L * (1 - it.sg)) / Math.max(1, nt);
      }
      it.tail[0].copy(Pi); it.prev[0].copy(Pi);
      for (let i = 1; i <= nt; i++) { const q = it.tail[i], pv = it.prev[i]; const vx = (q.x - pv.x) * 0.9, vy = (q.y - pv.y) * 0.9, vz = (q.z - pv.z) * 0.9; pv.copy(q); q.x += vx + gL.x * 30 * dt * dt; q.y += vy + gL.y * 30 * dt * dt; q.z += vz + gL.z * 30 * dt * dt; }
      for (let r = 0; r < 4; r++) for (let i = 1; i <= nt; i++) { const a = it.tail[i - 1], q = it.tail[i]; _c.subVectors(q, a); const l = _c.length() || 1e-4; q.copy(a).addScaledVector(_c, it.seg / l); }
      for (let i = 1; i <= nt; i++) pts.push(it.tail[i]);
      while (pts.length < 13) pts.push(pts[pts.length - 1].clone());
      const c0 = st.c1 || st.c0;
      it.col = [c0, st.c0]; it.drawn = pts;
      draw.push({ pts, col: it.col, wid: st.wid, n: st.n, half: !!st.c1 });
    });
    H.setDyn(draw.concat(G.flyDyn || []).slice(0, H.DN));
    // 족집게
    if (G.tw.visible) { G.tw.position.copy(grab.Pw); G.tw.lookAt(RND.camera.position); G.tw.rotateZ(-0.75); G.tw.rotateX(-1.0); }
    // 끊김 둘: ① 끝 쪽을 잡으면 뿌리가 빠지기 전에 머리카락이 먼저 끊김(뿌리 가까이 잡아야 뽑힘)
    //          ② 너무 빨리 확 당김
    const breakAt = rootS * (1.6 - 1.4 * m.sg) * gv('snapK');
    const vSnap = 11 * gv('snapK') * (1.2 - 0.5 * m.sg);
    const danger = Math.max(grab.v / vSnap, breakAt < rootS ? ext / breakAt : 0);
    UI.grip(grab.cx, grab.cy, ext / rootS, danger);
    if (ext > 0.02) grab.maxV = Math.max(grab.maxV, grab.v / vSnap);
    if (ext > 0.12 && grab.v > vSnap) { snap(); return; }
    if (breakAt < rootS && ext >= breakAt) { snap(); return; }
    if (ext >= rootS) pluck();
  }
  function updHead(dt) {
    const m = cust.move * gv('move');
    hm.evT += dt;
    // 꾸벅꾸벅 + 가끔 고개 돌리기
    if (hm.evT > hm.ev) {
      hm.evT = 0; hm.ev = (3 + Math.random() * 6) / Math.max(0.15, m);
      const r = Math.random();
      if (r < 0.45) { hm.kind = 'nod'; hm.tp = 0.16 + Math.random() * 0.12; setTimeout(() => { hm.tp = 0; hm.vp -= 0.9 * m; }, 1400 + Math.random() * 900); }
      else if (r < 0.8) { hm.ty = (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.25); setTimeout(() => (hm.ty = 0), 1600 + Math.random() * 1500); }
      else { hm.tr = (Math.random() - 0.5) * 0.25; setTimeout(() => (hm.tr = 0), 2000); }
    }
    const t = performance.now() / 1000;
    const br = Math.sin(t * 1.4) * 0.008 * (0.5 + m);
    const k = 18, c = 6.5;
    hm.vp += ((hm.tp + br - hm.pitch) * k - hm.vp * c) * dt; hm.pitch += hm.vp * dt;
    hm.vy += ((hm.ty - hm.yaw) * k * 0.6 - hm.vy * c) * dt; hm.yaw += hm.vy * dt;
    hm.vr += ((hm.tr - hm.roll) * k - hm.vr * c) * dt; hm.roll += hm.vr * dt;
    H.pivot.rotation.set(hm.pitch, hm.yaw, hm.roll, 'YXZ');
    // 머리가 움직이면 머리카락 끝이 늦게 따라옴
    H.pivot.updateMatrixWorld(true);
    const q = H.g.getWorldQuaternion(new THREE.Quaternion());
    const dq = lastQ.clone().invert().multiply(q); lastQ.copy(q);
    const ang = new THREE.Vector3(dq.x, dq.y, dq.z).multiplyScalar(2 / Math.max(dt, 1e-3));
    sway.multiplyScalar(Math.exp(-dt * 5)).addScaledVector(ang, -dt * 2.5);
    H.hairMat.uniforms.uSway.value.set(sway.y * 3 - sway.z, -sway.x * 3, sway.x * 2);
    // 크게 움찔하면 집은 손이 미끄러짐
    if (grab && Math.abs(hm.vp) + Math.abs(hm.vy) > 2.0) { drop(); }
  }
  function updCam(dt) {
    const k = Math.min(1, dt * 10);
    cam.tpol = Math.min(cam.tpol, polMax(cam.taz));
    cam.dist += (cam.tdist - cam.dist) * k; cam.az += (cam.taz - cam.az) * k; cam.pol += (cam.tpol - cam.pol) * k;
    // 세로 화면이면 좌우가 좁으니 그만큼 물러남
    const c = RND.camera, s = Math.sin(cam.pol), dd = cam.dist * Math.max(1, 1 / (c.aspect * 1.25));
    c.position.set(target.x + Math.sin(cam.az) * s * dd, target.y + Math.cos(cam.pol) * dd, target.z + Math.cos(cam.az) * s * dd);
    c.lookAt(target);
    RND.key.position.set(c.position.x * 0.4 - 14, 40, c.position.z * 0.4 + 10);
  }
  // 얼굴 쪽으로는 이마까지만(앞에서는 낮게 못 내려감)
  const polMax = (az) => 0.62 + 0.5 * (1 - Math.cos(az)) / 2;
  G.orbit = function (dx, dy) { cam.taz -= dx * 0.008; cam.tpol = Math.max(0.1, Math.min(polMax(cam.taz), cam.tpol - dy * 0.006)); };
  G.setCam = function (az, pol, dist) { cam.az = cam.taz = az; cam.pol = cam.tpol = pol; cam.dist = cam.tdist = dist; };
  // 머리통 안 방향 u 를 바라보게(시험용)
  G.lookAt = function (u, dist) { const az = Math.atan2(u.x, u.z), pol = Math.acos(Math.max(-1, Math.min(1, u.y))); G.setCam(az, Math.max(0.1, Math.min(1.12, pol)), dist || 20); };
  G.zoom = function (f) { cam.tdist = Math.max(gv('zoomMin'), Math.min(50, cam.tdist * f)); };

  // 참빗질: 손이 떨려도 결이 흔들리지 않게 빗 방향을 부드럽게 다듬어 씀
  let combLast = null, combDir = null;
  G.combStart = function (x, y) { if (G.mode !== 'play') return; prep({ x, y, r: gv('combR') + 60 }); combLast = [x, y]; combDir = null; };
  G.combMove = function (x, y) {
    if (!combLast) return;
    const mx = x - combLast[0], my = y - combLast[1], ml = Math.hypot(mx, my);
    if (ml < 5) return;
    if (!combDir) combDir = [mx / ml, my / ml];
    else { combDir[0] += (mx / ml - combDir[0]) * 0.3; combDir[1] += (my / ml - combDir[1]) * 0.3; }
    UI.combAngle(Math.atan2(combDir[1], combDir[0]));
    const c = RND.camera; c.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(c.matrixWorld, 1);
    const r = H.comb(combLast[0], combLast[1], x, y, combDir[0], combDir[1], gv('combR'), right, up);
    if (r && (r.n || r.rev)) { SND.comb(); if (r.rev) { SND.reveal(); UI.hud(); } }
    combLast = [x, y]; prep({ x, y, r: gv('combR') + 60 });
  };
  G.combEnd = function () { if (combLast && cust) H.repaint(cust); combLast = null; combDir = null; };

  // ---------- 오프닝 ----------
  let opT = 0, opCues = {};
  G.opening = function () {
    G.mode = 'opening'; opT = 0; opCues = {}; RND.scene = RND.front; UI.show('opening');
    SND.ensure(); SND.startBgm();
  };
  function updOpening(dt) {
    opT += dt; RND.frontAt(opT, dt);
    if (opT > 0.7 && !opCues.s) { opCues.s = 1; SND.shutter(2.0); }
    if (opT > 2.9 && !opCues.l) { opCues.l = 1; SND.light(); }
    if (opT > 3.8 && !opCues.b) { opCues.b = 1; SND.bell(); }
    if (opT > 4.6 && !opCues.f) { opCues.f = 1; UI.fade(1); }
    if (opT > 5.25) G.afterOpening();
  }
  G.skipOpening = function () { if (G.mode === 'opening' && opT < 4.6) { opT = 4.6; opCues = { s: 1, l: 1, b: 1 }; } };
  G.afterOpening = function () {
    if (G.mode !== 'opening') return;
    G.mode = 'wait'; UI.fade(0);
    if (S.done) { S.cust = 0; S.done = false; }
    G.startCustomer(Math.min(S.cust, D.COUNT - 1));
    if (!S.how) { UI.openHow(true); }
  };

  // ---------- 결과 ----------
  function finishCustomer() {
    // 판 끝 정산: 흰머리 +100 · 황금 +1000 · 검은 머리 -100 + 팁(사장님 10/22 "팁이 천원 이천원 삼천원 5천원 만원 오만원 십만원")
    // 팁은 얼마나 깔끔하게 뽑았나로(인내심은 바닥나면 어차피 게임오버라 안 씀 — 사장님 10/22)
    // 검은 머리·끊김 합 3번 넘음 1천 · 1~3번 2천 · 0번이면 PERFECT 비율 50% 아래 3천 · 80% 아래 5천 · 100% 아래 1만 · 전부 PERFECT 5만, 그중 다섯 번에 한 번 10만
    const miss = tally.black + tally.snap, picks = tally.white + tally.gold, pr = picks ? (picks - tally.nice) / picks : 0;
    const tip = miss > 3 ? 1000 : miss > 0 ? 2000 : pr < 0.5 ? 3000 : pr < 0.8 ? 5000 : pr < 1 ? 10000 : Math.random() < 0.2 ? 100000 : 50000;
    const total = tip + tally.white * 100 + tally.gold * 1000 - tally.black * 100;
    S.coins = Math.max(0, S.coins + total); S.stats.earned += total;
    const last = cust.last;
    S.cust = Math.min(D.COUNT - 1, cust.i + 1);
    if (last) { S.done = true; G.save(); G.ending(); return; }
    G.save();
    G.mode = 'result'; SND.clear();
    UI.result({ n: cust.i + 1, tip, white: tally.white, gold: tally.gold, black: tally.black, total });
    if (tip >= 50000) setTimeout(() => SND.gold(), 300);
  }
  function fail() {
    G.mode = 'over'; drop(); S.stats.fails++; G.save(); SND.fail(); UI.over();
  }
  G.next = function () { G.startCustomer(S.cust); };
  G.retry = function () { G.startCustomer(cust.i); };

  // ---------- 엔딩: 흰머리 하나 없이 새까맣게 ----------
  let endT = 0;
  G.ending = function () {
    G.mode = 'ending'; endT = 0; drop();
    SND.fanfare();
    UI.show('ending');
  };
  function updEnding(dt) {
    endT += dt;
    cam.taz += dt * 0.35; cam.tpol = 0.85; cam.tdist = 30;
    const k = Math.min(1, endT / 2.5);
    H.hairMat.uniforms.uExpo.value = 0.92 + Math.sin(Math.min(1, endT / 1.2) * Math.PI) * 0.6;
    if (endT > 1.2 && !G._endShown) { G._endShown = true; UI.endingCard(); }
  }

  // ---------- 고리 ----------
  let last = performance.now();
  G.tick = function (dt) {
    if (G.mode === 'title') { RND.frontIdle(performance.now() / 1000); }
    else if (G.mode === 'opening') updOpening(dt);
    else if (G.mode === 'play' || G.mode === 'result' || G.mode === 'over' || G.mode === 'ending' || G.mode === 'wait') {
      if (G.mode === 'play' && !UI.paused()) {
        updHead(dt); updGrab(dt);
        pat -= cust.drain * dt;
        if (clearT >= 0) { clearT -= dt; if (clearT < 0) { clearT = -1; finishCustomer(); } }
        else if (pat <= 0) { pat = 0; fail(); }
        UI.pat(pat / patMax);
      } else if (G.mode === 'ending') { updHead(dt); updEnding(dt); }
      H.hairMat.uniforms.uTime.value += dt;
      updFly(dt); updCam(dt);
      H.flush();
    }
    RND.render();
  };
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    G.tick(dt);
    requestAnimationFrame(loop);
  }
  G.info = () => ({ pat, patMax, combo, rubLeft, whites: H.whiteCount(), hidden: H.S.filter((s) => s.hidden && s.covered && s.alive).length, cust: cust && cust.i });
  G.patience = () => pat / patMax;
  G.tally = () => tally;
  G._fill = () => { pat = patMax; }; // 시험용
  G.rubLeft = () => rubLeft;

  // 족집게 세 가지(사장님 10/22 다이소 족집게 사진들 "족집게종류 모양 다르게"). 원점 = 집는 끝, 뒤로 갈수록 +y.
  // 반쪽 다리 바깥선(끝→뒤) + 안쪽선(뒤→끝), 색은 끝에서부터 길이로 칠함
  const TWEEZ = {
    // 쇠 족집게: 은색 일자형, 끝이 넓게 비스듬히 잘림
    1: { out: [[0.0, 0.0], [0.15, 0.1], [0.17, 0.7], [0.22, 2.4], [0.25, 4.8], [0.22, 6.4], [0.12, 6.9], [0.0, 7.0]], inn: [[0.02, 6.7], [0.07, 4.6], [0.07, 2.2], [0.04, 0.6], [0.0, 0.08]],
         col: () => [0.89, 0.91, 0.93], metal: 0.35, glow: '#2a2d31' },
    // 뾰족 족집게: 검은 코팅 곡선형 몸통 + 은색 뾰족한 끝
    2: { out: [[0.0, 0.0], [0.04, 0.35], [0.11, 1.2], [0.2, 2.2], [0.27, 3.2], [0.21, 4.3], [0.27, 5.4], [0.2, 6.3], [0.08, 6.55], [0.0, 6.6]], inn: [[0.02, 6.35], [0.07, 4.5], [0.06, 2.6], [0.02, 0.8], [0.0, 0.0]],
         col: (y) => (y < 1.25 ? [0.86, 0.88, 0.9] : [0.03, 0.03, 0.035]), metal: 0.1, glow: '#000000' },
    // 장인 족집게: 길고 가는 거울 은색 + 가운데 파란 고무 손잡이, 바늘 같은 끝
    3: { out: [[0.0, 0.0], [0.025, 0.45], [0.08, 1.5], [0.17, 3.0], [0.2, 5.0], [0.17, 6.8], [0.08, 7.5], [0.0, 7.6]], inn: [[0.02, 7.4], [0.06, 5.0], [0.05, 3.0], [0.012, 1.0], [0.0, 0.0]],
         col: () => [0.94, 0.96, 0.98], metal: 0.45, glow: '#1a1c20' },
  };
  let twLv = 0;
  G.buildTweez = function (lv) {
    if (lv === twLv) return; twLv = lv;
    const tw = G.tw, T = TWEEZ[lv];
    while (tw.children.length) { const c = tw.children.pop(); c.geometry.dispose(); }
    const sh = new THREE.Shape(); T.out.concat(T.inn).forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 1 });
    const pa = g.attributes.position, cols = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) cols.set(T.col(pa.getY(i)), i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    // 끝(원점)이 집은 곳, 몸통은 +z(화면 쪽)로 — 놓을 때 비스듬히 눕혀 위로 뻗어 보이게
    g.rotateX(Math.PI / 2); g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: T.metal, roughness: 0.28, emissive: T.glow });
    for (const s of [-1, 1]) { const b = new THREE.Mesh(g, m); b.scale.x = s; tw.add(b); }
    // 장인 족집게: 다리 바깥에 도드라진 파란 고무 패드(사진의 파란 손잡이)
    if (lv === 3) {
      const pm = new THREE.MeshStandardMaterial({ color: '#1f5fe0', roughness: 0.75, emissive: '#0a1f55' });
      const pg = new THREE.CapsuleGeometry(0.075, 2.0, 4, 10); pg.rotateX(Math.PI / 2);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(pg, pm); p.position.set(s * 0.2, -0.03, 3.75); p.scale.set(1, 0.9, 1); tw.add(p); }
    }
  };

  G.boot = function () {
    RND.init(document.getElementById('cv'));
    H.init(RND.salon);
    RND.resize();
    G.tw = new THREE.Group(); G.tw.visible = false; RND.salon.add(G.tw); G.buildTweez(Math.max(1, S.gear.tweez));
    lastQ.copy(H.g.getWorldQuaternion(new THREE.Quaternion()));
    requestAnimationFrame(loop);
  };
  window.__wh = { G, H, D, RND, tick: (n) => { for (let i = 0; i < (n || 1); i++) G.tick(1 / 60); } };
})();
