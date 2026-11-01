// 놀이: 콩콩 뛰기, 볼주머니, 은신처, 고양이, 죽음·판 깨기·엔딩.
(function () {
  const GAME = (window.GAME = {});
  const T = THREE, M = MDL, W = WORLD, COLS = DATA.COLS;
  const KEY = 'hamster.save';
  const S = (GAME.S = { mode: 'title' });

  // ---------- 저장 ----------
  function load() {
    let o = null; try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    o = o || {};
    S.save = Object.assign({ stage: 0, bank: 0, owned: ['golden'], sel: 'golden', how: false, ends: 0, trip: { time: 0, deaths: 0, eaten: 0, banked: 0 } }, o);
    if (!S.save.owned.includes('golden')) S.save.owned.push('golden');
  }
  GAME.persist = function () { try { localStorage.setItem(KEY, JSON.stringify(S.save)); } catch (e) {} };
  GAME.breed = () => DATA.BREEDS.find((b) => b.id === S.save.sel) || DATA.BREEDS[0];

  // ---------- 햄스터 ----------
  let ham = null;
  const H = (GAME.H = { x: 0, row: 0, hop: false, t: 0, fx: 0, fr: 0, tx: 0, tr: 0, dur: 0.13, face: 0, q: null, ride: null, off: 0, dead: false, bumpT: 0, maxRow: 0 });
  GAME.makeHamster = function () {
    if (ham) W.scene.remove(ham);
    ham = M.hamster(GAME.breed()); W.scene.add(ham); GAME.ham = ham;
    M.setCheek(ham, (S.cheek || 0) / DATA.CHEEK);
    place();
  };
  function place() {
    ham.position.set(H.x, 0, -H.row);
    ham.rotation.y = H.face;
  }

  // ---------- 알갱이(가루·물방울·꽃잎) ----------
  const PN = 260;
  let parts, pdat = [];
  const _o = new T.Object3D(), _col = new T.Color();
  function initParts() {
    parts = new T.InstancedMesh(new T.SphereGeometry(1, 6, 5), new T.MeshBasicMaterial({ color: 0xffffff }), PN);
    parts.instanceMatrix.setUsage(T.DynamicDrawUsage); parts.frustumCulled = false;
    for (let i = 0; i < PN; i++) { pdat.push({ life: 0 }); parts.setColorAt(i, _col.setHex(0xffffff)); _o.scale.setScalar(0); _o.updateMatrix(); parts.setMatrixAt(i, _o.matrix); }
    W.scene.add(parts);
  }
  let pi = 0;
  function burst(x, y, z, n, col, sp, up, size, life, grav) {
    for (let k = 0; k < n; k++) {
      const idx = pi, p = pdat[pi]; pi = (pi + 1) % PN;
      const a = Math.random() * Math.PI * 2, s = sp * (0.4 + Math.random() * 0.8);
      Object.assign(p, { x, y, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: up * (0.5 + Math.random()), life: life * (0.7 + Math.random() * 0.6), max: life, size: size * (0.6 + Math.random() * 0.8), g: grav == null ? 9 : grav });
      parts.setColorAt(idx, _col.setHex(Array.isArray(col) ? col[Math.floor(Math.random() * col.length)] : col));
    }
    parts.instanceColor.needsUpdate = true;
  }
  GAME.burst = burst;
  function stepParts(dt) {
    for (let i = 0; i < PN; i++) {
      const p = pdat[i];
      if (p.life > 0) {
        p.life -= dt; p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.y < 0.02 && p.g > 0) { p.y = 0.02; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
        _o.position.set(p.x, p.y, p.z); _o.scale.setScalar(Math.max(0, p.size * Math.min(1, p.life / (p.max * 0.4))));
      } else _o.scale.setScalar(0);
      _o.updateMatrix(); parts.setMatrixAt(i, _o.matrix);
    }
    parts.instanceMatrix.needsUpdate = true;
  }

  // ---------- 고양이 앞발 ----------
  let paw = null, pawT = 0, pawX = 0, pawRow = 0;
  const PAW_S = 0.72;
  const CAT_RUN = 2.5; // 멀리 있는 고양이가 따라붙는 빠르기(줄/초)
  function initPaw() { paw = new T.Mesh(M.paw().merge(), M.vmat); paw.castShadow = true; paw.visible = false; W.scene.add(paw); }

  // ---------- 판 시작 ----------
  GAME.startStage = function (s, fresh) {
    if (fresh) { S.save.trip = { time: 0, deaths: 0, eaten: 0, banked: 0 }; }
    S.stage = s; S.cheek = 0; S.golds = 0;
    W.build(); W.clearRows();
    const r0 = s === 0 ? 0 : W.homeRow[s - 1];
    Object.assign(H, { x: 0, row: r0, hop: false, t: 0, face: 0, q: null, ride: null, dead: false, maxRow: r0 });
    S.scroll = r0 - 4.5; S.camRow = r0; S.camX = 0; S.catHold = 0.8; S.moved = false; S.warned = false;
    S.mode = 'play'; S.deadT = 0; S.endT = 0;
    GAME.makeHamster();
    paw.visible = false;
    W.setZone(DATA.stage(s).z, 0);
    UI.hud(); UI.banner('STAGE ' + (s + 1), DATA.name(DATA.stage(s).zone));
  };

  // ---------- 움직이기 ----------
  const DIRS = { up: [0, 1, 0], down: [0, -1, Math.PI], left: [-1, 0, Math.PI / 2], right: [1, 0, -Math.PI / 2] };
  GAME.move = function (d) {
    if (S.mode !== 'play' || H.dead) return;
    if (H.hop) { H.q = d; return; }
    const v = DIRS[d]; if (!v) return;
    H.face = v[2]; H.idle = 0;
    const cur = W.lane(H.row), tr = H.row + v[1];
    const dest = W.lane(tr);
    let tx = H.x + v[0];
    if (v[1] !== 0) { if (!dest || dest.type !== 'water') tx = Math.round(H.x); }
    else if (cur && cur.type !== 'water') tx = Math.round(H.x) + v[0];
    if (!dest || dest.type === 'cage' || (W.walkable(dest) && W.blocked(Math.round(tx), tr)) || Math.abs(tx) > COLS + 0.45) {
      H.bumpT = 0.18; SND.bump(); place(); return;
    }
    // 물 위에서 물 위로 뛸 땐 떠내려가는 만큼 같이 흘러간다
    H.drift = cur && cur.type === 'water' && dest.type === 'water' ? cur.dir * cur.speed : 0;
    H.hop = true; H.t = 0; H.fx = H.x; H.fr = H.row; H.tx = tx; H.tr = tr; H.ride = null;
    H.dur = 0.12 + S.cheek * 0.0055;
    S.moved = true;
    SND.hop(S.cheek / DATA.CHEEK);
  };

  function land() {
    H.hop = false; H.x = H.tx; H.row = H.tr;
    const ln = W.lane(H.row);
    if (H.row > H.maxRow) H.maxRow = H.row;
    if (ln.type === 'water') {
      const it = W.floater(H.x, H.row);
      if (!it) return die('splash');
      H.ride = it; H.off = it.len < 1.9 ? 0 : Math.max(-(it.len / 2 - 0.3), Math.min(it.len / 2 - 0.3, H.x - it.x));
      H.x = it.x + H.off;
      burst(H.x, -0.1, -H.row, 5, 0xffffff, 1.2, 1.5, 0.05, 0.4);
    }
    if (W.walkable(ln)) {
      const c = Math.round(H.x);
      if (ln.seeds.has(c)) eat(ln, c);
      burst(H.x, 0.05, -H.row, 3, 0xe8d8b8, 0.8, 1, 0.04, 0.3);
    }
    if (ln.type === 'home' && H.row === W.homeRow[S.stage]) return clearStage();
    if (ln.type === 'field' && H.row >= W.endRow) return ending();
    if (H.q) { const q = H.q; H.q = null; GAME.move(q); }
  }

  function eat(ln, c) {
    const k = ln.seeds.get(c), add = k === 'gold' ? 5 : 1;
    if (S.cheek >= DATA.CHEEK) { SND.full(); UI.float(H.x, 0.9, -H.row, 'FULL', 'full'); return; }
    S.cheek = Math.min(DATA.CHEEK, S.cheek + add);
    S.save.trip.eaten += add;
    W.removeSeed(H.row, c);
    if (k === 'gold') { SND.gold(); burst(c, 0.4, -H.row, 18, [0xffd23a, 0xfff2a0, 0xffffff], 2.2, 3, 0.06, 0.7); }
    else { SND.eat(S.cheek); burst(c, 0.3, -H.row, 7, [0x3a3634, 0xf2efe6], 1.4, 2.2, 0.035, 0.45); }
    UI.float(H.x, 0.95, -H.row, '+' + add, k === 'gold' ? 'gold' : '');
    M.setCheek(ham, S.cheek / DATA.CHEEK);
    S.cheekPop = 0.25;
    UI.hud();
  }

  function clearStage() {
    const n = S.cheek;
    S.save.bank += n; S.save.trip.banked += n;
    if (n > 0) { SND.bank(n); for (let i = 0; i < Math.min(n, 14); i++) setTimeout(() => burst(H.x, 0.5, -H.row, 2, [0x3a3634, 0xf2efe6], 2.5, 3.5, 0.05, 0.7), i * 40); }
    S.cheek = 0; M.setCheek(ham, 0);
    const s = S.stage;
    SND.clear();
    burst(H.x, 0.6, -H.row, 30, [0xff6a8a, 0xffd23a, 0x7fc8f8, 0x9be08a, 0xffffff], 3, 4.5, 0.06, 1.1);
    UI.banner('STAGE CLEAR', n > 0 ? '+' + n : '', true);
    if (s + 1 < DATA.STAGES) { S.stage = s + 1; S.save.stage = Math.max(S.save.stage, s + 1); }
    else { S.stage = DATA.STAGES; S.final = true; }
    GAME.persist();
    S.catHold = 1.8; S.scroll = H.row - 4.5;
    UI.hud();
  }

  // ---------- 죽음 ----------
  function die(kind, it) {
    if (H.dead) return;
    H.dead = true; S.mode = 'dead'; S.deadKind = kind; S.deadT = 0; H.hop = false; H.idle = 0; ham.userData.hop.rotation.x = 0;
    S.save.trip.deaths++; GAME.persist();
    const hp = ham.userData.hop;
    if (kind === 'squash') {
      SND.squash(); if (W.lane(H.row) && W.lane(H.row).zone && W.lane(H.row).zone.id === 'alley') SND.horn();
      hp.scale.set(hp.userData.s0 * 1.5, hp.userData.s0 * 0.14, hp.userData.s0 * 1.35);
      hp.position.y = 0;
      burst(H.x, 0.3, -H.row, 14, [0xffffff, 0xffe27a, GAME.breed().top], 2.6, 3, 0.05, 0.6);
    } else if (kind === 'splash' || kind === 'swept') {
      SND.splash();
      const ln = W.lane(H.row), wc = ln && ln.zone && ln.zone.id === 'kitchen' ? 0xc08a5a : 0x9ad8f0;
      burst(H.x, -0.1, -H.row, 24, [wc, 0xffffff], 2.2, 4.5, 0.06, 0.8);
    } else if (kind === 'cat') {
      SND.meow(); SND.swipe();
      pawX = H.x; pawRow = H.row; pawT = 0; paw.visible = true;
    }
    UI.hud();
  }
  GAME.die = die;

  // ---------- 엔딩 ----------
  function ending() {
    S.mode = 'ending'; S.endT = 0;
    S.cheek = DATA.CHEEK; M.setCheek(ham, 1);
    S.save.ends = (S.save.ends || 0) + 1; S.save.stage = 0; GAME.persist();
    SND.ending();
    UI.hud();
  }

  // ---------- 한 틀 ----------
  let last = 0;
  GAME.frame = function (now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (S.mode !== 'pause') W.update(dt, onTrain);
    if (S.mode === 'play') playStep(dt);
    else if (S.mode === 'dead') deadStep(dt);
    else if (S.mode === 'ending') endStep(dt);
    else if (S.mode === 'title') titleStep(dt);
    if (S.mode !== 'pause') stepParts(dt);
    // 카메라
    if (GAME.noRender) return;
    const lo = Math.floor(S.camRow) - 7, hi = Math.floor(S.camRow) + 24;
    W.window(lo, hi);
    W.setCam(S.camX, S.camRow);
    // 구역 바뀌는 곳에서 하늘 색을 천천히
    const s = W.stageOf(Math.round(S.camRow)), z = DATA.stage(Math.min(9, s)).z;
    const zEnd = W.homeRow[Math.min(9, z * 2 + 1)];
    const k = Math.max(0, Math.min(1, (S.camRow - (zEnd - 6)) / 8));
    W.setZone(z, z < 4 ? k : 0);
    W.render();
    UI.tick && UI.tick(dt);
  };

  function onTrain(ln, what) {
    if (Math.abs(ln.r - H.row) > 9) return;
    if (what === 'warn') SND.bell(); else SND.horn();
  }

  function playStep(dt) {
    S.save.trip.time += dt;
    if (H.hop) {
      H.t += dt / H.dur;
      const t = Math.min(1, H.t), e = t * (2 - t);
      if (H.drift) { H.fx += H.drift * dt; H.tx += H.drift * dt; }
      H.x = H.fx + (H.tx - H.fx) * e;
      const zr = H.fr + (H.tr - H.fr) * e;
      ham.position.set(H.x, Math.sin(Math.PI * t) * 0.38, -zr);
      const hp = ham.userData.hop, s0 = hp.userData.s0;
      hp.rotation.x = 0;
      hp.scale.set(s0 * (1 - Math.sin(Math.PI * t) * 0.08), s0 * (1 + Math.sin(Math.PI * t) * 0.16), s0 * (1 - Math.sin(Math.PI * t) * 0.06));
      ham.userData.shadow.scale.setScalar(1 - Math.sin(Math.PI * t) * 0.35);
      ham.rotation.y += (H.face - ham.rotation.y) * Math.min(1, dt * 30);
      const lr = t > 0.45 ? H.tr : H.fr;
      if (W.hit(H.x, lr)) return die('squash');
      if (H.t >= 1) { land(); if (H.dead) return; }
    } else {
      if (H.ride) {
        H.x = H.ride.x + H.off;
        if (Math.abs(H.x) > COLS + 0.9) return die('swept');
      }
      ham.position.set(H.x, (H.ride ? M.RIDE_Y[H.ride.kind] - 0.17 : 0) + (H.ride ? Math.sin(W.time * 2.2 + H.ride.x * 0.7) * 0.025 : 0), -H.row);
      // 잠깐 서 있으면 얼굴이 보이게 카메라 쪽을 돌아본다
      H.idle = (H.idle || 0) + dt;
      const look = H.idle > 0.9 ? -2.0 : H.face;
      ham.rotation.y += (look - ham.rotation.y) * Math.min(1, dt * (H.idle > 0.9 ? 7 : 30));
      if (H.bumpT > 0) ham.rotation.y = H.face + Math.sin(H.bumpT * 60) * 0.12;
      const hp = ham.userData.hop, s0 = hp.userData.s0, br = Math.sin(W.time * 5) * 0.025;
      const pop = S.cheekPop > 0 ? Math.sin(S.cheekPop / 0.25 * Math.PI) * 0.1 : 0;
      hp.scale.set(s0 * (1 + pop), s0 * (1 + br - pop * 0.5), s0 * (1 + pop * 0.5));
      hp.rotation.x += ((H.idle > 0.9 ? 0.24 : 0) - hp.rotation.x) * Math.min(1, dt * 6); // 돌아보며 고개 들기
      ham.userData.shadow.scale.setScalar(1);
      if (W.hit(H.x, H.row)) return die('squash');
    }
    if (H.bumpT > 0) H.bumpT -= dt;
    if (S.cheekPop > 0) S.cheekPop -= dt;
    // 고양이 선: 꾸물대면 뒤에서 다가온다
    const curRow = H.hop ? (H.t > 0.45 ? H.tr : H.fr) : H.row;
    if (S.catHold > 0) S.catHold -= dt;
    else { // 시작하고 가만히 있어도 고양이가 온다(예전엔 한 칸 움직여야 출발)
      const sp = DATA.stage(Math.min(9, S.stage)).cat;
      // 앞발이 안 보일 만큼 멀면(2.4칸 밖) 빨리 따라붙어 금방 앞발을 보이고, 보인 뒤로는 원래 빠르기(잡히기까지 시간은 그대로)
      S.scroll += (curRow - S.scroll > 2.4 ? Math.max(sp, CAT_RUN) : sp) * dt;
      if (S.scroll < curRow - 7) S.scroll = curRow - 7;
    }
    const gap = curRow - S.scroll;
    if (gap < 1.6 && !S.warned) { S.warned = true; SND.meow(); }
    if (gap > 2.6) S.warned = false;
    // 앞발 그림자(경고)
    // 바로 뒤에서 앞발이 낮게 떠서 다가온다(작고 낮게 두어 화면 아래를 가리지 않게)
    if (gap < 2.4 && !S.final) { const k = Math.min(1, Math.max(0, (2.4 - gap) / 1.4)); paw.visible = true; paw.scale.setScalar(PAW_S); paw.position.set(H.x, 1.35 + k * 0.2, -S.scroll + 0.15 + k * 0.1); paw.rotation.set(-0.4 - k * 0.2, 0, 0); }
    else paw.visible = false;
    if (curRow <= S.scroll && !S.final) return die('cat');
    // 카메라는 햄스터를 부드럽게 따라감
    const want = Math.max(curRow + (H.hop ? (H.tr - H.fr) * Math.min(1, H.t) * 0 : 0), S.scroll + 1.6); // 고양이가 가까워도 햄스터와 앞발이 화면 안에 보이게(3 → 1.6)
    S.camRow += (want - S.camRow) * Math.min(1, dt * 4.5);
    S.camX += (H.x - S.camX) * Math.min(1, dt * 3);
  }

  function deadStep(dt) {
    S.deadT += dt;
    const hp = ham.userData.hop;
    if (S.deadKind === 'splash' || S.deadKind === 'swept') {
      ham.position.y = Math.max(-0.9, ham.position.y - dt * 1.4);
      hp.rotation.z = Math.sin(S.deadT * 14) * 0.3;
      if (Math.random() < 0.3) burst(H.x, -0.15, -H.row, 1, 0xffffff, 0.3, 1.2, 0.04, 0.5, 2);
    } else if (S.deadKind === 'cat') {
      pawT += dt;
      const k = Math.min(1, pawT / 0.2), e = k * k, up = pawT > 0.7 ? (pawT - 0.7) : 0; // 내려쳐 덮고, 잠깐 뒤 땅을 쓸며 뒤로 끌고 간다
      paw.scale.setScalar(PAW_S);
      paw.position.set(pawX, 1.55 - e * 0.72 + up * 0.6, -pawRow + 1.1 - e * 0.95 + up * 4); // 발이 햄스터 위를 덮게
      paw.rotation.set(-0.6 + e * 0.65, 0, 0);
      if (pawT > 0.7) { ham.position.y = paw.position.y - 0.42; ham.position.z = paw.position.z - 0.35; ham.rotation.x = -0.6; }
      if (pawT > 0.22 && !S.pawHit) { S.pawHit = true; burst(pawX, 0.3, -pawRow, 12, [0xf2a24a, 0xffffff], 2.4, 2.6, 0.05, 0.5); }
    }
    if (S.deadT > 1.3 && !S.overShown) { S.overShown = true; UI.over(); }
  }

  function endStep(dt) {
    S.endT += dt;
    ham.rotation.y += (Math.PI - ham.rotation.y) * Math.min(1, dt * 3);
    const hp = ham.userData.hop, s0 = hp.userData.s0;
    const j = Math.abs(Math.sin(S.endT * 5));
    ham.position.y = j * 0.35;
    hp.scale.set(s0 * (1 + (1 - j) * 0.08), s0 * (1 + j * 0.1), s0);
    S.camRow += (H.row - 0.4 - S.camRow) * Math.min(1, dt * 1.5);
    W.zoom += (0.55 - W.zoom) * Math.min(1, dt * 1.2);
    S.camX += (H.x - S.camX) * Math.min(1, dt * 2);
    if (Math.random() < 0.35) burst(H.x + (Math.random() - 0.5) * 6, 3 + Math.random() * 2, -H.row - Math.random() * 4, 1, [0xffc81e, 0xffe27a, 0xff9ac0], 0.4, 0, 0.07, 3, 1.2);
    if (S.endT > 0.6 && !S.endA) { S.endA = true; burst(H.x, 0.8, -H.row, 50, [0xffc81e, 0xffe27a, 0xff6a8a, 0xffffff, 0x9be08a], 3.5, 5, 0.07, 1.5); }
    if (S.endT > 3.2 && !S.endShown) { S.endShown = true; UI.end(); }
  }

  function titleStep(dt) {
    const hp = ham.userData.hop, s0 = hp.userData.s0;
    const t = W.time;
    const j = Math.max(0, Math.sin(t * 2.2)) ** 6;
    ham.position.set(0, j * 0.18, -H.row);
    hp.scale.set(s0, s0 * (1 + Math.sin(t * 5) * 0.025 + j * 0.08), s0);
    ham.rotation.y = Math.PI + 0.55 + Math.sin(t * 0.7) * 0.35; // 카메라 쪽을 보고 두리번
    S.camRow += (H.row - 0.9 - S.camRow) * 0.05;
  }

  // ---------- 입력 ----------
  function keyDir(k) {
    k = k.toLowerCase();
    if (k === 'arrowup' || k === 'w' || k === ' ') return 'up';
    if (k === 'arrowdown' || k === 's') return 'down';
    if (k === 'arrowleft' || k === 'a') return 'left';
    if (k === 'arrowright' || k === 'd') return 'right';
    return null;
  }
  function bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !document.getElementById('over').hidden) { e.preventDefault(); return UI.enter(); } // GAME OVER 창에서 스페이스 = 다시 하기(RETRY)
      if (UI.sheetOpen()) { if (e.key === 'Enter') UI.enter(); if (e.key === 'Escape') UI.esc(); return; }
      if (e.key === 'm' || e.key === 'M') return UI.toggleBgm();
      if (e.key === 'k' || e.key === 'K') return UI.toggleSfx();
      const d = keyDir(e.key);
      if (d) { e.preventDefault(); if (!e.repeat || H.hop === false) GAME.move(d); }
    });
    const cv = document.getElementById('cv');
    let sx = 0, sy = 0, st = 0, id = null, done = false;
    cv.addEventListener('pointerdown', (e) => { id = e.pointerId; sx = e.clientX; sy = e.clientY; st = performance.now(); done = false; SND.unlock(); });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id || done || S.mode !== 'play') return;
      const dx = e.clientX - sx, dy = e.clientY - sy, th = Math.max(26, Math.min(innerWidth, innerHeight) * 0.05);
      if (Math.hypot(dx, dy) > th) { done = true; GAME.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); }
    });
    cv.addEventListener('pointerup', (e) => { if (e.pointerId !== id) return; id = null; if (!done && S.mode === 'play') GAME.move('up'); done = true; });
    cv.addEventListener('pointercancel', () => { id = null; });
  }

  GAME.toTitle = function () {
    S.mode = 'title'; S.final = false; W.zoom = 1;
    W.build(); W.clearRows();
    Object.assign(H, { x: 0, row: 0, hop: false, dead: false, ride: null, face: 0 });
    S.cheek = 0; S.camRow = -0.9; S.camX = 0;
    GAME.makeHamster(); ham.position.set(0, 0, 0);
    if (paw) paw.visible = false;
    W.setZone(0, 0);
  };
  GAME.reset = function () { W.zoom = 1; S.overShown = false; S.endShown = false; S.endA = false; S.pawHit = false; S.final = false; };

  GAME.init = function () {
    load();
    W.init(document.getElementById('cv'));
    initParts(); initPaw();
    // 햄스터 hop 묶음의 처음 크기 기억
    const mk = GAME.makeHamster;
    GAME.makeHamster = function () { mk(); ham.userData.hop.userData.s0 = ham.userData.base; };
    GAME.toTitle();
    bindInput();
    window.addEventListener('resize', () => W.resize());
    const loop = (t) => { GAME.frame(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  // 시험 손잡이
  let fakeT = 0;
  window.__hm = {
    S, H, W, GAME, get paw() { return paw; },
    tick(n, dt) { dt = dt || 1 / 60; if (!fakeT) fakeT = last || 1; for (let i = 0; i < n; i++) { fakeT += dt * 1000; GAME.frame(fakeT); } },
    async shot(name) { const d = W.renderer.domElement.toDataURL('image/png'); const r = await fetch('/save?name=' + name, { method: 'POST', body: d }); return r.text(); }
  };
})();
