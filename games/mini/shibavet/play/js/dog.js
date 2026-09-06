/* dog.js — 시바견: 모델 + 눈치·도망·숨기·엄살 AI */
(function () {
  const W = window.WORLD, A = window.AUDIO, CELL = W.CELL;
  const orange = new THREE.MeshStandardMaterial({ color: 0xe0913f, roughness: .9 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf6ead6, roughness: .9 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: .5 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xe8788a, roughness: .8 });

  function buildModel() {
    const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
    const mk = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || body).add(m); return m; };
    // 몸통 (Z 방향으로 눕힘)
    const torso = mk(new THREE.CapsuleGeometry(.16, .34, 6, 12), orange, 0, .34, 0); torso.rotation.x = Math.PI / 2;
    const belly = mk(new THREE.CapsuleGeometry(.12, .3, 6, 12), cream, 0, .27, 0); belly.rotation.x = Math.PI / 2;
    // 머리
    const head = new THREE.Group(); head.position.set(0, .46, .24); body.add(head);
    mk(new THREE.SphereGeometry(.15, 14, 12), orange, 0, 0, 0, head);
    mk(new THREE.SphereGeometry(.11, 12, 10), cream, 0, -.05, .09, head);           // 볼
    const snout = mk(new THREE.CapsuleGeometry(.055, .06, 4, 8), cream, 0, -.04, .19, head); snout.rotation.x = Math.PI / 2;
    mk(new THREE.SphereGeometry(.03, 8, 8), black, 0, -.02, .245, head);               // 코
    mk(new THREE.SphereGeometry(.024, 8, 8), black, -.065, .04, .12, head); mk(new THREE.SphereGeometry(.024, 8, 8), black, .065, .04, .12, head);
    mk(new THREE.SphereGeometry(.018, 6, 6), cream, -.075, .085, .105, head); mk(new THREE.SphereGeometry(.018, 6, 6), cream, .075, .085, .105, head); // 눈썹점
    const earL = mk(new THREE.ConeGeometry(.05, .12, 4), orange, -.08, .15, -.02, head); const earR = mk(new THREE.ConeGeometry(.05, .12, 4), orange, .08, .15, -.02, head);
    earL.rotation.z = .25; earR.rotation.z = -.25;
    const tongue = mk(new THREE.BoxGeometry(.035, .01, .07), pink, 0, -.085, .2, head); tongue.visible = false;
    // 꼬리 (말려 올라감)
    const tail = new THREE.Group(); tail.position.set(0, .45, -.22); body.add(tail);
    const tm = mk(new THREE.TorusGeometry(.09, .045, 8, 14, Math.PI * 1.5), orange, 0, .05, 0, tail); tm.rotation.y = Math.PI / 2; tm.rotation.x = -.3;
    mk(new THREE.SphereGeometry(.05, 8, 8), cream, 0, .12, .03, tail);
    // 다리
    const legs = [];
    [[-.09, .16], [.09, .16], [-.09, -.15], [.09, -.15]].forEach(p => {
      const piv = new THREE.Group(); piv.position.set(p[0], .26, p[1]); body.add(piv);
      mk(new THREE.CylinderGeometry(.035, .03, .24, 8), orange, 0, -.12, 0, piv); mk(new THREE.SphereGeometry(.04, 8, 6), cream, 0, -.24, .01, piv); legs.push(piv);
    });
    // "!" 표식
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const c2 = cv.getContext('2d'); c2.font = 'bold 54px Arial'; c2.textAlign = 'center'; c2.textBaseline = 'middle'; c2.fillStyle = '#fff'; c2.strokeStyle = '#000'; c2.lineWidth = 6; c2.strokeText('!', 32, 34); c2.fillStyle = '#ffd43a'; c2.fillText('!', 32, 34);
    const st = new THREE.CanvasTexture(cv); st.colorSpace = THREE.SRGBColorSpace; const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: st, depthTest: false })); mark.scale.set(.35, .35, 1); mark.position.set(0, .95, 0); mark.visible = false; g.add(mark);
    return { g, body, head, earL, earR, tail, legs, tongue, mark };
  }

  function Dog(scene) {
    const m = buildModel(); this.m = m; scene.add(m.g);
    this.x = 12; this.z = 19; this.L = 0; this.yaw = Math.PI; this.state = 'idle'; this.stamina = 1; this.tired = 0;
    this.path = []; this.replan = 0; this.speed = 0; this.t = 0; this.alertT = 0; this.stateT = 0; this.hideBan = 0; this.hideNerve = 0; this.wanderT = 0;
    this.carried = false; this.struggle = 0; this.boost = 0; this.vocalT = 0; this.jukeCd = 0; this.stepT = 0; this.lastSeen = 0; this.lookAt = null;
    // 난이도 손잡이 — 스테이지가 준다. speed 도망 속도, boost 튈 때 속도, sense 눈치 반경 배수, stamina 달릴 수 있는 초, struggle 품에서 버둥거리는 속도 배수, juke 덮칠 때 튀기, hide 숨기, taunt 약 올리기
    this.D = { speed: 5.3, boost: 6.5, sense: 1, stamina: 11, struggle: 1, juke: true, hide: true, taunt: true, eatT: 2.5, offerT: 1.8, steal: .55 };
    // 아이템: lure 홀린 아이템, fed 간식 먹어 배부름(품에서 덜 버둥거림), mouth 입에 문 장난감, itemT 먹기·건네기 남은 초
    this.lure = null; this.fed = false; this.mouth = null; this.itemT = 0;
    this.startY = 0;
  }
  const P = Dog.prototype;
  P.pos3 = function () { return new THREE.Vector3(this.x, W.height(this.L, this.x, this.z), this.z); };
  P.reset = function () { this.x = 12; this.z = 19; this.L = 0; this.yaw = Math.PI; this.state = 'idle'; this.target = null; this.lure = null; this.fed = false; this.itemT = 0; this.dropMouth(); this.stamina = 1; this.tired = 0; this.path = []; this.carried = false; this.struggle = 0; this.boost = 0; this.hideBan = 0; this.m.g.visible = true; };

  // ---------- 물리: 벽·닫힌 문·가구를 못 지나간다 ----------
  // 개 몸 둘레 5점이 전부 지나갈 수 있는 칸이어야 그 자리에 설 수 있다. 길찾기는 칸 단위라, 걷는 도중에 문이 닫히면 이 검사가 막는다.
  P.blocked = function (L, x, z) {
    const r = .12;   // 칸이 0.5m 라 몸을 크게 잡으면 칸 가운데서 조금만 벗어나도 모서리에 걸린다
    if (!W.passable(L, W.cellOf(x), W.cellOf(z), true)) return true;
    return [[x + r, z], [x - r, z], [x, z + r], [x, z - r]].some(q => !W.passable(L, W.cellOf(q[0]), W.cellOf(q[1]), true));
  };
  // 이미 막힌 칸 안에 있으면(문이 몸 위로 닫혔다든지) 가장 가까운 빈 칸 가운데로 빼낸다
  P.unstick = function () {
    if (!this.blocked(this.L, this.x, this.z)) return false;
    const cx = W.cellOf(this.x), cz = W.cellOf(this.z); let best = null, bd = 1e9;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const x = (cx + dx + .5) * CELL, z = (cz + dz + .5) * CELL; if (this.blocked(this.L, x, z)) continue;
      const d = Math.hypot(x - this.x, z - this.z); if (d < bd) { bd = d; best = { x, z }; }
    }
    if (best) { this.x = best.x; this.z = best.z; this.path = []; this.replan = 0; return true; }
    return false;
  };

  // ---------- 아이템 ----------
  P.dropMouth = function () { if (this.mouth) { this.m.head.remove(this.mouth); this.mouth = null; } };
  P.takeMouth = function (cat) { this.dropMouth(); const g = window.ITEMS.mouthMesh(cat); g.position.set(0, -.09, .27); this.mouth = g; this.m.head.add(g); };
  // 특정 칸까지 길. 못 가면 false
  P.pathTo = function (L, cx, cz) {
    const N = W.N, dcx = W.cellOf(this.x), dcz = W.cellOf(this.z), me = this.L * N + W.idx(dcx, dcz), goal = L * N + W.idx(cx, cz);
    if (me === goal) { this.path = []; return true; }
    const distD = W.bfs(this.L, dcx, dcz, true); if (distD[goal] < 0) return false;
    const path = []; let cur = goal, guard = 0;
    while (cur !== me && guard++ < 300) {
      path.push(W.nodePos(cur)); const l = cur >= N ? 1 : 0, ci = cur - l * N, x = ci % W.GX, z = (ci - x) / W.GX, d = distD[cur];
      let nxt = -1; const cands = W.neighbors(l, x, z, true, []);
      for (const m of cands) { if (distD[m] >= 0 && distD[m] < d) { nxt = m; if (distD[m] === d - 1) break; } }
      if (nxt < 0) break; cur = nxt;
    }
    path.reverse(); this.path = path; return true;
  };
  // 어떤 자리에 가장 가까운, 갈 수 있는 칸으로
  P.pathNear = function (L, x, z) {
    const N = W.N, distD = W.bfs(this.L, W.cellOf(this.x), W.cellOf(this.z), true); let best = -1, bd = 1e9;
    for (let n = 0; n < N * 2; n++) { if (distD[n] < 0) continue; const l = n >= N ? 1 : 0; if (l !== L) continue; const ci = n - l * N, cx = ci % W.GX, cz = (ci - cx) / W.GX; const d = Math.hypot((cx + .5) * CELL - x, (cz + .5) * CELL - z); if (d < bd) { bd = d; best = n; } }
    if (best < 0) return false; const l = best >= N ? 1 : 0, ci = best - l * N; return this.pathTo(l, ci % W.GX, (ci - ci % W.GX) / W.GX);
  };
  // 놓인 아이템을 알아채면 홀린다. 주인이 코앞(2m 안)이면 안 속는다
  P.noticeItem = function (p) {
    if (this.lure || this.carried || this.state === 'hide' || this.state === 'eat' || this.state === 'offer') return;
    const it = window.ITEMS.nearest(this.L, this.x, this.z, 9); if (!it) return;
    if (p.dist < 2 && this.state === 'flee') return;
    if (!this.pathTo(it.L, W.cellOf(it.x), W.cellOf(it.z))) return;
    it.taken = true; this.lure = it; this.setState('goto'); this.replan = .5; A.alert();
  };
  P.finishLure = function (keepMouth) {
    if (this.lure) { window.ITEMS.remove(this.lure); this.lure = null; }
    if (!keepMouth) this.dropMouth();
  };

  // ---------- 지각 ----------
  P.perceive = function (pl, dt) {
    const dx = pl.x - this.x, dz = pl.z - this.z, dist = Math.hypot(dx, dz);
    const same = pl.L === this.L || W.inStair(pl.x, pl.z) || W.inStair(this.x, this.z);
    const los = same && W.lineOfSight(this.L, this.x, this.z, pl.x, pl.z);
    const ang = Math.atan2(dx, dz); let rel = ang - this.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); const front = Math.abs(rel) < 1.9;
    const mode = pl.mode; // 'run' | 'walk' | 'sneak' | 'still'
    let rA = mode === 'run' ? 13 : mode === 'walk' ? 8 : mode === 'sneak' ? 4.5 : 3;
    let rF = mode === 'run' ? 8 : mode === 'walk' ? 5 : mode === 'sneak' ? 2.3 : 1.8;
    rA *= this.D.sense; rF *= this.D.sense;
    if (!front) { rA *= .55; rF *= .6; }
    if (!los) { rA *= .35; rF *= .35; } // 벽 너머 발소리만
    if (pl.lunging) { rF = Math.max(rF, 3.2); }
    return { dist, los, same, front, seeA: dist < rA && (los || mode === 'run'), seeF: dist < rF, dx, dz, ang };
  };

  // ---------- 계획 ----------
  P.plan = function (pl, mode) {
    const N = W.N, pcx = W.cellOf(pl.x), pcz = W.cellOf(pl.z), dcx = W.cellOf(this.x), dcz = W.cellOf(this.z);
    const distP = W.bfs(pl.L, pcx, pcz, true);
    const near = (l, x, z) => { const d = distP[l * N + W.idx(x, z)]; return d >= 0 && d <= 4; };
    let distD = W.bfs(this.L, dcx, dcz, true, mode === 'dodge' ? null : near);
    const me = this.L * N + W.idx(dcx, dcz);
    let best = -1, bestS = -1e9, cnt = 0;
    for (let n = 0; n < N * 2; n++) {
      const dd = distD[n]; if (dd < 1 || dd > (mode === 'wander' ? 8 : 34)) continue;
      const l = n >= N ? 1 : 0, ci = n - l * N, cx = ci % W.GX, cz = (ci - cx) / W.GX;
      const t = W.cellType(l, cx, cz); const dp = distP[n] < 0 ? 60 : distP[n];
      if (t === W.T.HIDE && !this.D.hide) continue;   // 숨기 없는 스테이지는 숨는 칸으로 안 간다
      let s;
      if (mode === 'wander') s = Math.random() * 10 + (t === W.T.HIDE ? -5 : 0) + (l === 0 && !W.inHouse((cx + .5) * CELL, (cz + .5) * CELL) ? 2 : 0);
      else {
        s = dp * 1.0 - dd * .3 + Math.random() * 4; if (t === W.T.HIDE && this.hideBan <= 0 && dp > 8) s += 7; if (t === W.T.HIDE && this.hideBan > 0) s -= 20; if (l !== pl.L) s += 2;
        // 막다른 구석은 피한다 — 사방이 트인 칸일수록 좋다
        let open = 0; if (W.passable(l, cx + 1, cz, true)) open++; if (W.passable(l, cx - 1, cz, true)) open++; if (W.passable(l, cx, cz + 1, true)) open++; if (W.passable(l, cx, cz - 1, true)) open++;
        if (W.passable(l, cx + 2, cz, true)) open++; if (W.passable(l, cx - 2, cz, true)) open++; if (W.passable(l, cx, cz + 2, true)) open++; if (W.passable(l, cx, cz - 2, true)) open++;
        s += open * 1.2 - (open <= 3 ? 8 : 0);
      }
      if (s > bestS) { bestS = s; best = n; } cnt++;
    }
    if (best < 0) { if (mode !== 'dodge') return this.plan(pl, 'dodge'); this.path = []; return false; }
    // 경로 복원: best 에서 dd 가 줄어드는 이웃으로
    const path = []; let cur = best, guard = 0;
    while (cur !== me && guard++ < 200) {
      path.push(W.nodePos(cur)); const l = cur >= N ? 1 : 0, ci = cur - l * N, cx = ci % W.GX, cz = (ci - cx) / W.GX, d = distD[cur];
      let nxt = -1; const cands = W.neighbors(l, cx, cz, true, []);
      for (const m of cands) { if (distD[m] >= 0 && distD[m] < d) { nxt = m; if (distD[m] === d - 1) break; } }
      if (nxt < 0) break; cur = nxt;
    }
    path.reverse(); this.path = path; this.target = W.nodePos(best); return true;
  };

  P.setState = function (s) { if (this.state !== s) { this.state = s; this.stateT = 0; } };

  // ---------- 매 프레임 ----------
  P.update = function (dt, pl, game) {
    this.t += dt; this.stateT += dt; this.replan -= dt; this.hideBan -= dt; this.vocalT -= dt; if (this.boost > 0) this.boost -= dt;
    if (!W.inStair(this.x, this.z)) this.unstick();
    const m = this.m;
    if (this.carried) { this.updateCarried(dt, pl, game); return; }
    const p = this.perceive(pl, dt);
    const px = (this.x - pl.x) / 8;
    // 지친 상태
    if (this.tired > 0) { this.tired -= dt; if (this.tired <= 0) this.stamina = .55; }
    let maxSpeed = this.tired > 0 ? 1.6 : this.D.speed; if (this.boost > 0) maxSpeed = this.D.boost;
    // 눈치: 주인이 덮치려 들면 한 번 튄다 (지쳤을 땐 못 한다)
    this.noticeItem(p);
    if (this.D.juke && !this.lure && pl.lunging > .25 && p.dist < 2.6 && this.tired <= 0 && this.jukeCd <= 0) { this.jukeCd = 2.2; this.boost = Math.max(this.boost, .5); this.replan = 0; if (this.state !== 'flee') this.setState('flee'); }
    this.jukeCd = (this.jukeCd || 0) - dt;
    const st = this.state;
    // 상태 전이
    if (st === 'idle' || st === 'wander' || st === 'wary') {
      if (p.seeF) { this.setState('flee'); this.replan = 0; if (this.vocalT < 0) { A.alert(); A.bark(.7, px); this.vocalT = .8; } }
      else if (p.seeA) { this.setState('alert'); }
    } else if (st === 'alert') {
      if (p.seeF) { this.setState('flee'); this.replan = 0; if (this.vocalT < 0) { A.alert(); A.bark(.7, px); this.vocalT = .8; } }
      else if (!p.seeA && this.stateT > 1.5) this.setState('wary');
    } else if (st === 'flee') {
      // 지금 서 있는 칸이 숨는 칸일 때만 숨는다. 예전 목표만 보고 숨으면 잔디밭 한가운데서 엎드려 땅에 파묻힌다
      if (this.D.hide && this.path.length === 0 && this.hideBan <= 0 && W.cellType(this.L, W.cellOf(this.x), W.cellOf(this.z)) === W.T.HIDE) this.setState('hide');
      else if (!p.los && p.dist > 9 && this.stateT > 2) this.setState('wary');
      else if (this.D.taunt && p.los && p.dist > 10.5 && !pl.lunging && this.stateT > 1.5) this.setState('taunt');
    } else if (st === 'taunt') {
      if (p.dist < 8 || pl.lunging) { this.setState('flee'); this.replan = 0; }
      else if (this.stateT > 5) this.setState('wary');
    } else if (st === 'hide') {
      const nearP = p.dist < 2.4 && p.same !== false;
      this.hideNerve = nearP || pl.lunging ? this.hideNerve + dt * (pl.lunging ? 3 : 1) : Math.max(0, this.hideNerve - dt);
      if (nearP && this.vocalT < 0) { A.whine(.4, .6, px); this.vocalT = 1.4; }
      if (this.hideNerve > .8 || p.dist < 1.4) { this.hideBan = 7; this.hideNerve = 0; this.setState('flee'); this.replan = 0; A.bark(.9, px); }
    }
    // 상태별 행동
    const s2 = this.state;
    let want = 0;
    if (s2 === 'goto') {   // 아이템 쪽으로
      const it = this.lure; if (!it) { this.setState('wary'); }
      else {
        want = 3.6; const d = Math.hypot(it.x - this.x, it.z - this.z);
        if (this.replan <= 0 && this.path.length === 0 && d > .5) { if (!this.pathTo(it.L, W.cellOf(it.x), W.cellOf(it.z))) { it.taken = false; this.lure = null; this.setState('wary'); } this.replan = .5; }
        if (this.path.length === 0) {   // 마지막 한 걸음은 아이템 자리로 곧장
          if (d > .35) { const st = Math.min(d, this.speed * dt); this.x += (it.x - this.x) / d * st; this.z += (it.z - this.z) / d * st; const ta = Math.atan2(it.x - this.x, it.z - this.z); this.yaw += Math.atan2(Math.sin(ta - this.yaw), Math.cos(ta - this.yaw)) * Math.min(1, dt * 10); }
          else if (it.cat === 'treat') { this.setState('eat'); this.itemT = this.D.eatT; A.pat(); }
          else if (Math.random() < this.D.steal) { this.takeMouth('toy'); this.finishLure(true); this.boost = 2.5; this.hideBan = 4; this.setState('flee'); this.replan = 0; this.itemT = 6; A.bark(.9, px); }   // 장난감만 물고 도망
          else { this.takeMouth('toy'); window.ITEMS.remove(it); this.setState('return'); this.replan = 0; this.itemT = 99; }
        }
      }
    } else if (s2 === 'eat') {   // 먹는 중 — 주인을 신경 안 쓴다
      want = 0; this.path = []; this.itemT -= dt;
      if (this.itemT <= 0) {
        this.fed = true; this.finishLure(false);
        if (this.D.eatT < 2) { this.boost = 2; this.setState('flee'); this.replan = 0; A.bark(.8, px); }   // 먹기만 하고 달아난다
        else this.setState('wary');
      }
    } else if (s2 === 'return') {   // 장난감 물고 주인에게
      want = 3.2;
      if (this.replan <= 0) { if (!this.pathTo(pl.L, W.cellOf(pl.x), W.cellOf(pl.z))) this.pathNear(pl.L, pl.x, pl.z); this.replan = .5; }
      if (p.dist < 1.7 || (this.path.length === 0 && this.replan > .1 && p.dist < 3.5)) { this.path = []; this.setState('offer'); this.itemT = this.D.offerT; this.lure = null; }   // 못 닿는 자리면 갈 수 있는 가장 가까운 곳에서 건넨다
    } else if (s2 === 'offer') {   // 주인 앞에서 장난감을 건넨다 — 잡기 딱 좋은 때
      want = 0; this.path = []; this.itemT -= dt;
      if (this.itemT <= 0) { this.dropMouth(); this.setState('wary'); }
    } else if (s2 === 'flee') {
      if (this.replan <= 0 || this.path.length === 0) { this.plan(pl, 'flee'); this.replan = .45; }
      want = maxSpeed;
      if (this.tired <= 0) { this.stamina -= dt / this.D.stamina; if (this.stamina <= 0) { this.stamina = 0; this.tired = 3.5; A.pant(px); } }
    } else if (s2 === 'wander' || s2 === 'idle') {
      this.wanderT -= dt;
      if (s2 === 'idle' && this.wanderT <= 0) { if (Math.random() < .6) { this.setState('wander'); this.plan(pl, 'wander'); } this.wanderT = 2 + Math.random() * 3; }
      if (s2 === 'wander') { want = 1.6; if (this.path.length === 0) { this.setState('idle'); this.wanderT = 1.5 + Math.random() * 3; } }
      this.stamina = Math.min(1, this.stamina + dt / 5);
    } else if (s2 === 'alert' || s2 === 'taunt' || s2 === 'wary') {
      want = 0; this.stamina = Math.min(1, this.stamina + dt / 6); this.path = [];
      if (s2 === 'wary' && this.stateT > 2.5) this.setState('idle');
      if (s2 === 'taunt' && this.vocalT < 0) { A.bark(.9, px); this.vocalT = 1.1 + Math.random(); }
    } else if (s2 === 'hide') { want = 0; this.path = []; this.stamina = Math.min(1, this.stamina + dt / 4); }
    if (this.tired > 0 && this.vocalT < 0 && s2 !== 'hide') { A.pant(px); this.vocalT = .9; }
    if (this.mouth && this.state !== 'return' && this.state !== 'offer' && this.state !== 'goto') { this.itemT -= dt; if (this.itemT <= 0) this.dropMouth(); }
    // 이동
    this.speed += (want - this.speed) * Math.min(1, dt * 8);
    if (this.path.length && want > 0) {
      const wp = this.path[0]; const dx = wp.x - this.x, dz = wp.z - this.z, d = Math.hypot(dx, dz);
      const ta = Math.atan2(dx, dz); let da = ta - this.yaw; da = Math.atan2(Math.sin(da), Math.cos(da));
      this.yaw += da * Math.min(1, dt * 12);
      const turnPen = 1 - Math.min(.55, Math.abs(da) * .6);
      const step = this.speed * turnPen * dt;
      const nx = d <= step + .02 ? wp.x : this.x + dx / d * step, nz = d <= step + .02 ? wp.z : this.z + dz / d * step;
      const nL = d <= step + .02 ? wp.L : this.L;
      const free = (x, z) => W.inStair(x, z) || !this.blocked(W.layerAt(nL, x, z), x, z);
      if (free(nx, nz)) { if (d <= step + .02) { this.x = wp.x; this.z = wp.z; this.L = wp.L; this.path.shift(); } else { this.x = nx; this.z = nz; } }
      else if (free(nx, this.z)) { this.x = nx; }          // 모서리에 걸리면 벽을 따라 미끄러진다
      else if (free(this.x, nz)) { this.z = nz; }
      else { this.path = []; this.replan = 0; this.speed *= .3; }   // 정면이 벽·닫힌 문: 멈추고 다시 계획
      this.L = W.layerAt(this.L, this.x, this.z);
      this.stepT += step; if (this.stepT > .6) { this.stepT = 0; if (p.dist < 9) A.step(W.inHouse(this.x, this.z), false); }
    } else {
      // 서서 플레이어 쪽 보기
      if (s2 === 'alert' || s2 === 'taunt' || s2 === 'hide' || s2 === 'offer' || (s2 === 'wary' && p.los)) { let da = p.ang - this.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); this.yaw += da * Math.min(1, dt * 6); }
    }
    this.animate(dt, p, s2);
  };

  P.updateCarried = function (dt, pl, game) {
    // 주인 품 — 버둥거림
    const m = this.m; this.x = pl.x; this.z = pl.z; this.L = pl.L;
    const rate = (.07 + (this.tired > 0 ? .02 : .1 * this.stamina) + (pl.mode === 'run' ? .06 : 0)) * this.D.struggle * (this.fed ? .55 : 1);
    this.struggle = Math.min(1, this.struggle + rate * dt);
    if (this.vocalT < 0) { A.whine(.5 + Math.random() * .4, .8); this.vocalT = 1.1 + Math.random() * 1.2; }
    this.m.mark.visible = false;
    const wig = Math.sin(this.t * 14) * (.15 + this.struggle * .5);
    m.body.rotation.set(-.15 + Math.sin(this.t * 9) * .06, 0, wig * .4);
    m.body.position.set(0, 0, 0);
    m.legs.forEach((l, i) => l.rotation.x = Math.sin(this.t * 16 + i * 1.7) * (.3 + this.struggle * .7));
    m.tail.rotation.y = Math.sin(this.t * 6) * .4; m.head.rotation.y = Math.sin(this.t * 3) * .6; m.head.rotation.x = -.2;
    m.tongue.visible = this.struggle > .5;
    if (this.struggle >= 1) { game.dogEscaped(); }
  };

  P.animate = function (dt, p, st) {
    const m = this.m, moving = this.speed > .2, run = this.speed > 3;
    const f = this.t * (run ? 16 : 9);
    m.legs.forEach((l, i) => l.rotation.x = moving ? Math.sin(f + (i === 0 || i === 3 ? 0 : Math.PI)) * (run ? .9 : .5) : (st === 'hide' ? 1.3 : 0));
    m.body.position.y = st === 'hide' ? -.16 : (moving ? Math.abs(Math.sin(f)) * (run ? .05 : .02) : 0);
    m.body.rotation.x = run ? -.08 : 0; m.body.rotation.z = 0; m.body.rotation.y = 0;
    m.tail.rotation.y = st === 'taunt' || st === 'idle' || st === 'eat' || st === 'offer' || st === 'return' ? Math.sin(this.t * 9) * .5 : 0; m.tail.rotation.x = st === 'flee' ? .5 : 0;
    const alertEars = st === 'alert' || st === 'taunt' || st === 'flee';
    m.earL.rotation.x = m.earR.rotation.x = alertEars ? -.25 : (st === 'hide' ? .7 : 0);
    // 고개 — 플레이어 쪽 (눈치)
    if (alertEars || st === 'hide' || st === 'wary') { let rel = p.ang - this.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); m.head.rotation.y += (Math.max(-1.2, Math.min(1.2, rel)) - m.head.rotation.y) * Math.min(1, dt * 6); }
    else m.head.rotation.y += (Math.sin(this.t * .7) * .3 - m.head.rotation.y) * dt * 2;
    m.head.rotation.x = st === 'eat' ? .75 + Math.sin(this.t * 12) * .08 : st === 'idle' && !moving ? Math.sin(this.t * 1.3) * .2 + .2 : (st === 'hide' ? .25 : 0);
    m.tongue.visible = this.tired > 0;
    m.mark.visible = st === 'alert' || (st === 'flee' && this.stateT < 1.2);
    if (m.mark.visible) m.mark.position.y = .95 + Math.sin(this.t * 10) * .03;
    m.g.position.set(this.x, W.height(this.L, this.x, this.z), this.z); m.g.rotation.y = this.yaw;
  };

  window.Dog = Dog;
})();
