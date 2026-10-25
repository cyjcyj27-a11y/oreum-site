// 탑 쌓기 규칙: 오가는 점토 블록을 눌러 떨어뜨림 → 겹친 만큼 남고 나머지는 잘려 떨어진다.
// 판(STAGE)마다 정한 층을 다 쌓으면 받침 판이 쿵 올라오고 폭이 처음대로. 10판째 위에서 달이 깨어나면 엔딩.
(function () {
  const G = (window.GAME = {});
  const D = window.DATA;
  const KEY = 'cookiestack.save';
  const S = (G.S = {
    mode: 'title', // title · play · clear · over · end
    si: 0, k: 0, // 판, 이 판에서 쌓은 층
    top: null, // 맨 위 블록 {x,z,w,d,y(윗면)}
    mov: null, // 움직이는 블록 {mesh,axis,dir,pos,w,d,y,t}
    combo: 0, t: 0,
    blocks: [], // 쌓인 블록 전부 {mesh,x,z,w,d,y0,y1,si}
    pieces: [], // 잘린 조각 {mesh,vx,vy,vz,ax,av,w,d,h,landed,si}
    fx: [],
    lookY: 0, lookTarget: 0, camX: 0, camZ: 0, spin: 0,
    stats: { perfect: 0, best: 0, retry: 0, floors: 0, time: 0 },
    save: { stage: 0, how: 0, stats: null, done: 0 },
  });
  // 저장: 설명 창 봤음 + 모드마다 따로 판·기록
  let ALL = { how: 0, mode: 'easy', modes: {} };
  function slot(m) { return ALL.modes[m] || (ALL.modes[m] = { stage: 0, stats: null, done: 0 }); }
  function load() {
    try {
      const j = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (j && j.modes) ALL = Object.assign(ALL, j);
      else if (j) { ALL.how = j.how || 0; ALL.modes.easy = { stage: j.stage || 0, stats: j.stats || null, done: j.done || 0 }; } // 모드 생기기 전 기록은 EASY 로
    } catch (e) {}
    G.setMode(ALL.mode || 'easy');
  }
  function store() { S.save.stats = S.stats; ALL.how = S.save.how || ALL.how; ALL.mode = D.mode; try { localStorage.setItem(KEY, JSON.stringify(ALL)); } catch (e) {} }
  G.setMode = function (m) {
    D.mode = D.MODES[m] ? m : 'easy';
    S.save = slot(D.mode); S.save.how = ALL.how;
    S.stats = { perfect: 0, best: 0, retry: 0, floors: 0, time: 0 };
    if (S.save.stats) Object.assign(S.stats, S.save.stats);
  };
  G.slot = (m) => slot(m);
  G.newGame = function (m) { const s = slot(m); s.stage = 0; s.stats = null; store(); };
  G.store = store;

  // ---------- 블록 ----------
  function matFor(si, k) {
    const c = '#' + D.color(si, k).getHexString(), gl = D.STAGES[si].glow;
    return CLAY.mat(c, { rough: 0.42, ns: 0.6, emis: c, ei: gl });
  }
  // 쿠키 한 층: 반죽은 층마다 버터·코코아 번갈아, 아이싱은 판의 형광색
  function makeBlock(w, d, mat, seed, dough, shared) {
    const m = COOKIE.make(w, d, mat, dough, seed, shared);
    RND.scene.add(m);
    return m;
  }
  function plateMesh(si) {
    const m = COOKIE.cream(D.W0 + 0.7, D.PH, 300 + si);
    RND.scene.add(m);
    return m;
  }
  // 지난 판들은 반듯한 탑으로 다시 세운다(이어하기)
  function rebuildTo(si) {
    clearAll();
    for (let i = 0; i < si; i++) {
      const st = D.STAGES[i];
      for (let k = 0; k < st.n; k++) {
        const m = makeBlock(D.W0, D.W0, matFor(i, k), 0, k % 2, true);
        const y0 = st.y0 + k * D.BH; m.position.set(0, y0 + D.BH / 2, 0);
        S.blocks.push({ mesh: m, x: 0, z: 0, w: D.W0, d: D.W0, y0, y1: y0 + D.BH, si: i, shared: true });
      }
      const p = plateMesh(i); p.position.set(0, st.y1 + D.PH / 2, 0);
      S.blocks.push({ mesh: p, x: 0, z: 0, w: D.W0 + 0.7, d: D.W0 + 0.7, y0: st.y1, y1: st.y1 + D.PH, si: i, plate: true });
    }
  }
  function disposeMesh(m) { RND.scene.remove(m); if (m.userData.sharedGeo) return; m.geometry.dispose(); m.children.forEach((c) => c.geometry && c.geometry.dispose()); }
  function clearAll() {
    S.blocks.forEach((b) => disposeMesh(b.mesh)); S.blocks = [];
    S.pieces.forEach((p) => disposeMesh(p.mesh)); S.pieces = [];
    if (S.mov) { disposeMesh(S.mov.mesh); S.mov = null; }
  }
  // 이 판을 처음부터(쌓은 층·조각을 걷어 낸다)
  function resetStage(si) {
    S.blocks = S.blocks.filter((b) => { if (b.si === si && !b.plate) { disposeMesh(b.mesh); return false; } return true; });
    S.pieces = S.pieces.filter((p) => { if (p.si === si) { disposeMesh(p.mesh); return false; } return true; });
    if (S.mov) { disposeMesh(S.mov.mesh); S.mov = null; }
    S.si = si; S.k = 0; S.combo = 0;
    const st = D.STAGES[si];
    const below = S.blocks.filter((b) => b.plate && b.si === si - 1)[0];
    const cx = below ? below.x : 0, cz = below ? below.z : 0;
    S.top = { x: cx, z: cz, w: D.W0, d: D.W0, y: st.y0 };
    S.lookTarget = st.y0;
  }
  function spawn() {
    const st = D.STAGES[S.si], axis = (S.k + S.si) % 2 === 0 ? 'x' : 'z';
    const mesh = makeBlock(S.top.w, S.top.d, matFor(S.si, S.k), S.si * 100 + S.k, S.k % 2);
    const m = (S.mov = { mesh, axis, dir: 1, off: -D.RANGE, w: S.top.w, d: S.top.d, y: S.top.y, v: D.speed(S.si, S.k), wait: 0 });
    placeMov();
    mesh.scale.set(0.2, 0.2, 0.2); m.pop = 0;
  }
  function placeMov() {
    const m = S.mov, t = S.top;
    m.mesh.position.set(t.x + (m.axis === 'x' ? m.off : 0), m.y + D.BH / 2, t.z + (m.axis === 'z' ? m.off : 0));
  }

  // ---------- 누르기 ----------
  G.drop = function () {
    if (S.mode !== 'play' || !S.mov || S.mov.pop < 1) return;
    const m = S.mov, t = S.top, ax = m.axis;
    const size = ax === 'x' ? m.w : m.d;
    let delta = m.off;
    const st = D.STAGES[S.si];
    if (Math.abs(delta) >= size) { miss(); return; }
    let perfect = false;
    if (Math.abs(delta) < D.perfectTol(m.v)) { delta = 0; perfect = true; }
    const keep = size - Math.abs(delta);
    const cx = (ax === 'x' ? t.x + delta / 2 : t.x), cz = (ax === 'z' ? t.z + delta / 2 : t.z);
    let w = ax === 'x' ? keep : m.w, d = ax === 'z' ? keep : m.d;
    disposeMesh(m.mesh); S.mov = null;
    if (perfect) {
      S.combo++; S.stats.perfect++; S.stats.best = Math.max(S.stats.best, S.combo);
      // PERFECT 마다 조금, 세 번 넘게 이어지면 더 넓어진다(처음 폭까지)
      const gr = D.M().g1 + (S.combo >= 3 ? D.M().g3 : 0);
      if (ax === 'x') w = Math.min(D.W0, w + gr); else d = Math.min(D.W0, d + gr);
    } else S.combo = 0;
    const mat = matFor(S.si, S.k);
    const mesh = makeBlock(w, d, mat, S.si * 100 + S.k + 50, S.k % 2);
    const y0 = t.y; mesh.position.set(cx, y0 + D.BH / 2, cz);
    const b = { mesh, x: cx, z: cz, w, d, y0, y1: y0 + D.BH, si: S.si, sq: 0 };
    S.blocks.push(b);
    squash(b, perfect ? 1 : 0.7);
    // 잘린 조각
    if (!perfect) {
      const cut = Math.abs(delta), sg = Math.sign(delta);
      const px = ax === 'x' ? t.x + delta / 2 + sg * (keep / 2 + cut / 2) : t.x;
      const pz = ax === 'z' ? t.z + delta / 2 + sg * (keep / 2 + cut / 2) : t.z;
      piece(ax === 'x' ? cut : m.w, ax === 'z' ? cut : m.d, mat, px, y0 + D.BH / 2, pz, ax, sg, S.k % 2);
      FX.crumbs(px - (ax === 'x' ? sg * cut / 2 : 0), y0 + D.BH * 0.6, pz - (ax === 'z' ? sg * cut / 2 : 0), S.k % 2, ax, Math.min(1, cut / 1.2));
      SND.cut(cut / size);
    }
    S.top = { x: cx, z: cz, w, d, y: y0 + D.BH };
    S.k++; S.stats.floors++;
    UI.floor(S.k, st.n);
    if (perfect) { FX.perfect(b, S.combo); SND.perfect(S.combo); UI.perfect(S.combo); }
    else SND.drop(keep / size);
    S.lookTarget = S.top.y;
    if (S.k >= st.n) { stageClear(); return; }
    spawn();
  };
  function miss() {
    const m = S.mov; S.mov = null;
    const p = { mesh: m.mesh, vx: (m.axis === 'x' ? Math.sign(m.off) : 0) * 1.5, vy: 0, vz: (m.axis === 'z' ? Math.sign(m.off) : 0) * 1.5, ax: m.axis, sg: Math.sign(m.off) || 1, av: 2.2, ang: 0, w: m.w, d: m.d, h: D.BH, si: S.si, landed: false };
    S.pieces.push(p);
    S.combo = 0;
    SND.miss();
    S.mode = 'over';
    setTimeout(() => { UI.over(S.k, D.STAGES[S.si].n); SND.over(); }, 900);
  }
  function piece(w, d, mat, x, y, z, ax, sg, dough) {
    const mesh = makeBlock(w, d, mat, (Math.random() * 1000) | 0, dough);
    mesh.position.set(x, y, z);
    S.pieces.push({ mesh, vx: ax === 'x' ? sg * 1.1 : 0, vy: 0.6, vz: ax === 'z' ? sg * 1.1 : 0, ax, sg, av: 2.6 + Math.random(), ang: 0, w, d, h: D.BH, si: S.si, landed: false });
    // 조각이 너무 많으면 오래된 것부터 치운다(맨 아래 땅 위)
    if (S.pieces.length > 120) { const o = S.pieces.shift(); disposeMesh(o.mesh); }
  }
  // 점토라 눌리면 납작해졌다가 돌아온다. 아래 블록도 조금씩 늦게 출렁.
  function squash(b, k) {
    b.sq = 1; b.sqk = k;
    const n = S.blocks.length;
    for (let i = 2; i <= 5; i++) { const o = S.blocks[n - i]; if (!o || o.plate) break; o.sq = Math.max(o.sq || 0, 1 + i * 0.12); o.sqk = k * (0.5 - i * 0.08); }
  }
  function stageClear() {
    S.mode = 'clear';
    const st = D.STAGES[S.si], last = S.top;
    const p = plateMesh(S.si);
    const px = last.x * 0.5, pz = last.z * 0.5;
    p.position.set(px, st.y1 + D.PH / 2 + 6, pz);
    const pb = { mesh: p, x: px, z: pz, w: D.W0 + 0.7, d: D.W0 + 0.7, y0: st.y1, y1: st.y1 + D.PH, si: S.si, plate: true, fall: 6, sq: 0 };
    S.blocks.push(pb);
    S.plateFall = pb;
    SND.clear();
    UI.stageClear(S.si);
    S.lookTarget = st.y1 + D.PH;
    const last9 = S.si === D.STAGES.length - 1;
    if (!last9) { S.save.stage = Math.max(S.save.stage, S.si + 1); }
    else { S.save.done = 1; S.save.stage = 0; }
    store();
    setTimeout(() => {
      if (last9) { ending(); return; }
      resetStage(S.si + 1);
      S.mode = 'play'; UI.stageStart(S.si); spawn();
    }, 2100);
  }
  function ending() {
    S.mode = 'end'; S.endT = 0;
    SND.end();
    UI.hideHud();
    setTimeout(() => UI.ending(), 4200);
  }

  // ---------- 시작·다시 ----------
  G.start = function (fromStage) {
    S.stats = { perfect: 0, best: 0, retry: 0, floors: 0, time: 0 };
    if (fromStage > 0 && S.save.stats) Object.assign(S.stats, S.save.stats);
    rebuildTo(fromStage);
    resetStage(fromStage);
    S.mode = 'play'; S.spin = 0; S.lookY = Math.max(0, S.top.y - 3);
    if (RND.moon) RND.moon.awake = 0;
    UI.stageStart(S.si);
    spawn();
  };
  G.retry = function () {
    S.stats.retry++; store();
    resetStage(S.si);
    S.mode = 'play'; UI.stageStart(S.si); spawn();
  };
  G.toTitle = function () {
    S.mode = 'title';
    rebuildTo(S.save.stage);
    resetStage(S.save.stage);
    S.lookY = S.lookTarget = S.top.y;
  };

  // ---------- 매 프레임 ----------
  function step(dt) {
    S.t += dt;
    if (S.mode === 'play') S.stats.time += dt;
    const m = S.mov;
    if (m) {
      // 뿅 하고 부풀며 나타난다
      m.pop = Math.min(1, m.pop + dt * 4);
      const x1 = m.pop - 1; m.mesh.scale.setScalar(Math.max(0.05, 1 + 2.70158 * x1 * x1 * x1 + 1.70158 * x1 * x1));
      if (S.mode === 'play' && m.pop >= 0.6 && !UI.paused) {
        m.off += m.dir * m.v * dt;
        if (m.off > D.RANGE) { m.off = D.RANGE; m.dir = -1; }
        if (m.off < -D.RANGE) { m.off = -D.RANGE; m.dir = 1; }
      }
      // 오가는 블록은 살짝 출렁(말랑한 점토)
      const wob = Math.sin(S.t * 9) * 0.02;
      if (m.pop >= 1) m.mesh.scale.set(1 + wob, 1 - wob, 1 + wob);
      placeMov();
    }
    // 눌림 출렁
    for (let i = S.blocks.length - 1, n = 0; i >= 0 && n < 8; i--, n++) {
      const b = S.blocks[i];
      if (b.fall > 0) {
        b.vy = (b.vy || 0) - 40 * dt; b.fall += b.vy * dt;
        if (b.fall <= 0) { b.fall = 0; b.sq = 1; b.sqk = 1.1; FX.slam(b); SND.slam(); }
        b.mesh.position.y = b.y0 + (b.plate ? D.PH : D.BH) / 2 + Math.max(0, b.fall);
      }
      if (b.sq > 0) {
        b.sq = Math.max(0, b.sq - dt * 2.6);
        const ph = b.sq > 1 ? 0 : (1 - b.sq) * Math.PI * 3, amp = (b.sq > 1 ? 0 : b.sq) * 0.24 * (b.sqk || 1);
        const s = Math.cos(ph) * amp;
        b.mesh.scale.set(1 + s * 0.45, 1 - s, 1 + s * 0.45);
        const hh = b.plate ? D.PH : D.BH;
        if (!(b.fall > 0)) b.mesh.position.y = b.y0 + hh / 2 - (s * hh) / 2;
      }
    }
    // 조각: 떨어져 바닥이나 아래 턱에 붙는다
    for (const p of S.pieces) {
      if (p.landed) { if (p.sq > 0) { p.sq = Math.max(0, p.sq - dt * 3); const s = Math.sin(p.sq * Math.PI) * 0.18; p.mesh.scale.set(p.sx * (1 + s), p.sy * (1 - s), p.sz * (1 + s)); } continue; }
      p.vy -= 24 * dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      p.ang = Math.min(1.4, p.ang + p.av * dt);
      if (p.ax === 'x') p.mesh.rotation.z = -p.sg * p.ang; else p.mesh.rotation.x = p.sg * p.ang;
      const bot = p.mesh.position.y - D.BH / 2;
      const floor = landY(p);
      if (bot <= floor) {
        p.landed = true; p.mesh.position.y = floor + D.BH * 0.32;
        p.ang *= 0.25; if (p.ax === 'x') p.mesh.rotation.z = -p.sg * p.ang; else p.mesh.rotation.x = p.sg * p.ang;
        p.sx = 1.12; p.sy = 0.62; p.sz = 1.12; p.sq = 1; p.mesh.scale.set(p.sx, p.sy, p.sz);
        if (Math.abs(p.mesh.position.y - S.lookY) < 14) SND.land();
      }
    }
    FX.step(dt);
    // 카메라: 맨 위를 따라 부드럽게
    if (S.mode === 'end') {
      S.endT += dt;
      S.spin = Math.sin(S.endT * 0.35) * 0.55;
      S.fwT = (S.fwT || 0) - dt; if (S.fwT <= 0) { S.fwT = 0.45; FX.firework(D.TOP + 4 + Math.random() * 6); SND.pop(); }
      if (RND.moon) RND.moon.awake = Math.min(1, S.endT / 1.2);
      S.lookY += (D.TOP + 2.5 - S.lookY) * Math.min(1, dt * 1.5);
      RND.setCam(S.lookY, 1.25 + Math.min(0.5, S.endT * 0.08), S.spin);
    } else {
      const ly = S.mode === 'title' ? S.lookTarget : S.lookTarget;
      S.lookY += (ly - S.lookY) * Math.min(1, dt * 3.2);
      if (S.mode === 'title') S.spin = Math.sin(S.t * 0.15) * 0.45; else S.spin += (0 - S.spin) * Math.min(1, dt * 2);
      RND.setCam(S.lookY, 1, S.spin);
    }
    RND.skyAt(S.lookY);
    RND.tickWorld(S.t);
  }
  // 조각 아래에서 제일 높은 바닥(블록 윗면이나 땅)
  function landY(p) {
    const x = p.mesh.position.x, z = p.mesh.position.z, hw = p.w / 2 * 0.8, hd = p.d / 2 * 0.8;
    let best = 0.0;
    const y = p.mesh.position.y - D.BH / 2 + 0.05;
    for (let i = S.blocks.length - 1; i >= 0; i--) {
      const b = S.blocks[i];
      if (b.y1 > y || b.y1 <= best) continue;
      if (Math.abs(x - b.x) < hw + b.w / 2 && Math.abs(z - b.z) < hd + b.d / 2) { best = b.y1; }
    }
    for (const o of S.pieces) {
      if (!o.landed || o === p) continue;
      const top = o.mesh.position.y + D.BH * 0.3;
      if (top > y || top <= best) continue;
      if (Math.abs(x - o.mesh.position.x) < (p.w + o.w) * 0.35 && Math.abs(z - o.mesh.position.z) < (p.d + o.d) * 0.35) best = top;
    }
    return best;
  }
  let last = 0, frozen = false;
  function loop(ts) {
    if (frozen) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
    step(dt); RND.render(); if (!document.hidden) RND.watch(dt);
  }
  G.init = function () {
    load();
    RND.init(document.getElementById('cv'));
    G.toTitle();
    S.lookY = S.top.y;
    RND.setCam(S.lookY, 1, 0); RND.skyAt(S.lookY);
    requestAnimationFrame(loop);
  };
  // 시험용 손잡이
  window.__cs = { S, G, step, freeze() { frozen = true; }, tick(n, dt) { for (let i = 0; i < (n || 1); i++) step(dt || 1 / 60); RND.render(); } };
})();
