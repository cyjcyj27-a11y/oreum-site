/* player.js — 주인: 모델·이동·충돌·잡기 */
(function () {
  const W = window.WORLD, A = window.AUDIO, CELL = W.CELL;
  const shirt = new THREE.MeshStandardMaterial({ color: 0x3f8fd8, roughness: .9 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x3a3d52, roughness: .9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: .8 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: .9 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: .7 });

  function buildModel() {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const mk = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || body).add(m); return m; };
    mk(new THREE.CapsuleGeometry(.2, .42, 6, 12), shirt, 0, 1.1, 0);
    const head = new THREE.Group(); head.position.set(0, 1.58, 0); body.add(head);
    mk(new THREE.SphereGeometry(.15, 14, 12), skin, 0, 0, 0, head); const hm = mk(new THREE.SphereGeometry(.155, 14, 12, 0, Math.PI * 2, 0, Math.PI * .55), hair, 0, .015, -.01, head);
    mk(new THREE.SphereGeometry(.02, 6, 6), hair, -.055, .02, .13, head); mk(new THREE.SphereGeometry(.02, 6, 6), hair, .055, .02, .13, head);
    const arms = [], legs = [];
    [-1, 1].forEach(s => {
      const ap = new THREE.Group(); ap.position.set(s * .26, 1.3, 0); body.add(ap); mk(new THREE.CapsuleGeometry(.055, .4, 4, 8), shirt, 0, -.22, 0, ap); mk(new THREE.SphereGeometry(.06, 8, 8), skin, 0, -.47, 0, ap); arms.push(ap);
      const lp = new THREE.Group(); lp.position.set(s * .1, .82, 0); body.add(lp); mk(new THREE.CapsuleGeometry(.075, .5, 4, 8), pants, 0, -.32, 0, lp); mk(new THREE.BoxGeometry(.15, .08, .25), shoe, 0, -.62, .04, lp); legs.push(lp);
    });
    return { g, body, head, arms, legs };
  }

  function Player(scene) {
    const m = buildModel(); this.m = m; scene.add(m.g);
    this.x = 16; this.z = 20.5; this.L = 0; this.yaw = Math.PI; this.mode = 'still'; this.speed = 0; this.t = 0;
    this.lunging = 0; this.lungeCd = 0; this.vx = 0; this.vz = 0; this.stepAcc = 0; this.carry = false; this.patT = 0; this.stuckT = 0;
  }
  const P = Player.prototype;
  P.reset = function () { this.x = 16; this.z = 20.5; this.L = 0; this.yaw = Math.PI; this.mode = 'still'; this.speed = 0; this.lunging = 0; this.carry = false; };
  P.pos3 = function () { return new THREE.Vector3(this.x, W.height(this.L, this.x, this.z), this.z); };

  // 몸 둘레 8점 중 막힌 칸에 든 점의 수
  P.blockedCount = function (L, x, z) {
    const r = .24, pts = [[x + r, z], [x - r, z], [x, z + r], [x, z - r], [x + r * .7, z + r * .7], [x - r * .7, z + r * .7], [x + r * .7, z - r * .7], [x - r * .7, z - r * .7]];
    let n = 0; for (const p of pts) if (!W.passable(L, W.cellOf(p[0]), W.cellOf(p[1]), false)) n++;
    if (!W.passable(L, W.cellOf(x), W.cellOf(z), false)) n += 4;
    return n;
  };
  P.canStand = function (L, x, z, fromY) {
    if (Math.abs(W.height(L, x, z) - fromY) > .5) return false; // 턱·난간 너머로 못 넘어간다
    return this.blockedCount(L, x, z) === 0;
  };
  // 이미 벽에 물려 있으면(문이 닫혔다든지) 덜 물리는 쪽으로는 움직이게 해 준다
  P.canMove = function (L, x, z, fromY) {
    if (Math.abs(W.height(L, x, z) - fromY) > .5) return false;
    const c = this.blockedCount(L, x, z); if (c === 0) return true;
    const c0 = this.blockedCount(L, this.x, this.z); return c0 > 0 && c <= c0;
  };
  P.move = function (dt, ix, iz, camYaw, run, sneak) {
    const len = Math.hypot(ix, iz);
    let want = 0;
    if (len > 0) { want = run ? 4.7 : sneak ? 1.35 : 2.9; if (this.carry) want = run ? 3.6 : sneak ? 1.2 : 2.6; }
    if (this.lunging > 0) want = 6.5;
    this.mode = len === 0 && this.lunging <= 0 ? 'still' : run ? 'run' : sneak ? 'sneak' : 'walk';
    this.speed += (want - this.speed) * Math.min(1, dt * (want > this.speed ? 10 : 14));
    let dx = 0, dz = 0;
    if (this.lunging > 0) { dx = Math.sin(this.yaw); dz = Math.cos(this.yaw); }
    else if (len > 0) { const nx = ix / len, nz = iz / len; dx = -nx * Math.cos(camYaw) + nz * Math.sin(camYaw); dz = nx * Math.sin(camYaw) + nz * Math.cos(camYaw); }
    const step = this.speed * dt, y0 = W.height(this.L, this.x, this.z);
    if (step > 0 && (dx || dz)) {
      const nx = this.x + dx * step, nz = this.z + dz * step;
      const ox = this.x, oz = this.z;
      if (this.canMove(this.L, nx, nz, y0)) { this.x = nx; this.z = nz; }
      else if (this.canMove(this.L, nx, this.z, y0)) { this.x = nx; }
      else if (this.canMove(this.L, this.x, nz, y0)) { this.z = nz; }
      else this.speed *= .5;
      this.L = W.layerAt(this.L, this.x, this.z);
      // 그래도 1.5초 넘게 꼼짝 못 하면 가장 가까운 빈 칸 가운데로 옮겨 준다
      if (Math.hypot(this.x - ox, this.z - oz) < .002) { this.stuckT += dt; if (this.stuckT > 1.5) { this.stuckT = 0; this.unstick(); } } else this.stuckT = 0;
      this.stepAcc += this.speed * dt; const sl = this.mode === 'run' ? .9 : .7; if (this.stepAcc > sl && this.mode !== 'sneak') { this.stepAcc = 0; A.step(W.inHouse(this.x, this.z), this.mode === 'run'); }
    }
    if (this.lunging > 0) this.lunging -= dt; if (this.lungeCd > 0) this.lungeCd -= dt;
  };
  P.unstick = function () {
    const y0 = W.height(this.L, this.x, this.z), cx0 = W.cellOf(this.x), cz0 = W.cellOf(this.z); let best = null, bd = 1e9;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const cx = cx0 + dx, cz = cz0 + dz, x = (cx + .5) * W.CELL, z = (cz + .5) * W.CELL;
      if (!W.passable(this.L, cx, cz, false) || Math.abs(W.height(this.L, x, z) - y0) > .6 || this.blockedCount(this.L, x, z) > 0) continue;
      const d = Math.hypot(x - this.x, z - this.z); if (d < bd) { bd = d; best = [x, z]; }
    }
    if (best) { this.x = best[0]; this.z = best[1]; this.L = W.layerAt(this.L, this.x, this.z); }
  };
  P.lunge = function () { if (this.lungeCd > 0 || this.carry) return false; this.lunging = .32; this.lungeCd = .9; A.grab(); return true; };

  P.animate = function (dt, dog) {
    this.t += dt; const m = this.m, sp = this.speed, moving = sp > .2, f = this.t * (sp > 3.5 ? 13 : sp > 2 ? 9 : 6);
    const amp = moving ? Math.min(1, sp / 4) * .8 : 0;
    m.legs[0].rotation.x = Math.sin(f) * amp; m.legs[1].rotation.x = -Math.sin(f) * amp;
    if (this.carry) { m.arms[0].rotation.x = m.arms[1].rotation.x = -1.35; m.arms[0].rotation.z = .35; m.arms[1].rotation.z = -.35; if (this.patT > 0) { this.patT -= dt; m.arms[1].rotation.x = -1.7 + Math.sin(this.patT * 30) * .2; } }
    else if (this.lunging > 0) { m.arms[0].rotation.x = m.arms[1].rotation.x = -1.4; m.arms[0].rotation.z = m.arms[1].rotation.z = 0; }
    else { m.arms[0].rotation.x = -Math.sin(f) * amp * .8; m.arms[1].rotation.x = Math.sin(f) * amp * .8; m.arms[0].rotation.z = m.arms[1].rotation.z = 0; }
    m.body.rotation.x = this.lunging > 0 ? .5 : (this.mode === 'sneak' ? .35 : (sp > 3.5 ? .15 : 0));
    m.body.position.y = this.mode === 'sneak' ? -.25 : (moving ? Math.abs(Math.sin(f)) * .03 : 0);
    m.g.position.set(this.x, W.height(this.L, this.x, this.z), this.z); m.g.rotation.y = this.yaw;
    if (this.carry && dog && this.m.g.visible) { dog.m.g.position.copy(m.g.position); dog.m.g.position.y += .95 + m.body.position.y; dog.m.g.position.x += Math.sin(this.yaw) * .42; dog.m.g.position.z += Math.cos(this.yaw) * .42; dog.m.g.rotation.y = this.yaw + Math.PI / 2; }
  };
  window.Player = Player;
})();
