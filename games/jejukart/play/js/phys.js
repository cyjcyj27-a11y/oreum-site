// 부딪힘 — 소품 충돌체(격자)와 튕겨 날아가는 소품(라바콘·드럼통·화분·쓰레기봉투·상자·튜브)
(function () {
  const CELL = 14;
  const grid = new Map();
  let statics = [], dyns = [], bodies = [], meshes = {}, T = null, scene = null, stamp = 1;
  const V = new THREE.Vector3(), Q = new THREE.Quaternion(), M4 = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);

  // ---------- 등록 ----------
  function reset(track) {
    grid.clear();
    statics = []; dyns = []; bodies = [];
    T = track;
  }
  function cellsOf(c, minx, minz, maxx, maxz) {
    const x0 = Math.floor(minx / CELL), x1 = Math.floor(maxx / CELL);
    const z0 = Math.floor(minz / CELL), z1 = Math.floor(maxz / CELL);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const k = x + ',' + z;
      let a = grid.get(k);
      if (!a) { a = []; grid.set(k, a); }
      a.push(c);
    }
  }
  // 회전한 네모 (hx, hz 는 반폭). soft 가 있으면 막지 않고 느려지기만 한다(덤불·모래)
  function box(x, z, ry, hx, hz, opt) {
    const c = { t: 'box', x, z, ry, hx, hz, cos: Math.cos(ry), sin: Math.sin(ry), soft: (opt && opt.soft) || 0, kind: (opt && opt.kind) || 'wall', st: 0 };
    const r = Math.hypot(hx, hz);
    statics.push(c);
    cellsOf(c, x - r, z - r, x + r, z + r);
    return c;
  }
  function circle(x, z, r, opt) {
    const c = { t: 'circ', x, z, r, soft: (opt && opt.soft) || 0, kind: (opt && opt.kind) || 'post', st: 0 };
    statics.push(c);
    cellsOf(c, x - r, z - r, x + r, z + r);
    return c;
  }
  // 튕겨 날아가는 소품 (모양은 build 에서 한꺼번에 만든다)
  function dyn(kind, x, y, z, ry, tint) {
    dyns.push({ kind, x, y, z, ry: ry || 0, tint: tint == null ? 0xffffff : tint });
  }

  // ---------- 날아가는 소품 종류 ----------
  // r: 바닥 반지름(부딪힘), h: 서 있을 때 중심 높이, w: 누웠을 때 중심 높이, m: 무게
  const KIND = {
    cone: { r: 0.36, h: 0.46, w: 0.32, m: 0.55 },
    barrel: { r: 0.42, h: 0.5, w: 0.4, m: 2.4 },
    pot: { r: 0.34, h: 0.42, w: 0.3, m: 1.1 },
    bag: { r: 0.46, h: 0.34, w: 0.34, m: 0.5 },
    crate: { r: 0.55, h: 0.21, w: 0.4, m: 0.9 },
    tube: { r: 0.75, h: 0.25, w: 0.75, m: 0.35 },
    ball: { r: 0.4, h: 0.4, w: 0.4, m: 0.3 },
  };

  // 종류별 모양 (원점이 물체 가운데)
  function kindGeo(kind) {
    const G = SCENERY.G, M = SCENERY.M, sh = SCENERY.sh;
    const B = new SCENERY.Bag();
    const K = KIND[kind];
    if (kind === 'cone') {
      B.add(G.box, 0x2b2b30, M(0, -K.h + 0.06, 0, 0.68, 0.12, 0.68, 0));
      B.add(G.cone, 0xf05a22, M(0, -K.h + 0.12 + 0.42, 0, 0.6, 0.84, 0.6, 0));
      B.add(G.cyl, 0xf2f2ee, M(0, -K.h + 0.12 + 0.42, 0, 0.42, 0.12, 0.42, 0));
      B.add(G.cyl, 0xf2f2ee, M(0, -K.h + 0.12 + 0.62, 0, 0.3, 0.08, 0.3, 0));
    } else if (kind === 'barrel') {
      B.add(G.cyl, 0xffffff, M(0, 0, 0, 0.8, 1.0, 0.8, 0));
      B.add(G.cyl, 0xd8d8d8, M(0, 0.28, 0, 0.84, 0.08, 0.84, 0));
      B.add(G.cyl, 0xd8d8d8, M(0, -0.28, 0, 0.84, 0.08, 0.84, 0));
      B.add(G.cyl, 0xb8b8b8, M(0, 0.5, 0, 0.78, 0.04, 0.78, 0));
    } else if (kind === 'pot') {
      B.add(G.cyl, 0xb86a44, M(0, -K.h + 0.24, 0, 0.5, 0.48, 0.5, 0));
      B.add(G.cyl, 0xc97a52, M(0, -K.h + 0.46, 0, 0.56, 0.08, 0.56, 0));
      B.add(G.cyl, 0x5a3f2a, M(0, -K.h + 0.49, 0, 0.42, 0.04, 0.42, 0));
      B.add(G.sph, 0x3f8a3a, M(0, -K.h + 0.72, 0, 0.62, 0.52, 0.62, 0));
      B.add(G.sph, 0x4f9a44, M(0.16, -K.h + 0.82, -0.1, 0.36, 0.3, 0.36, 0));
      B.add(G.sph, 0xe8524a, M(-0.14, -K.h + 0.9, 0.12, 0.14, 0.14, 0.14, 0));
      B.add(G.sph, 0xf0c14a, M(0.2, -K.h + 0.66, 0.22, 0.12, 0.12, 0.12, 0));
    } else if (kind === 'bag') {
      B.add(G.sph, 0x2a2e36, M(0, -K.h + 0.34, 0, 0.92, 0.68, 0.92, 0));
      B.add(G.sph, 0x3a3f48, M(0.18, -K.h + 0.5, -0.1, 0.5, 0.38, 0.5, 0));
      B.add(G.sph, 0x1e2128, M(-0.02, -K.h + 0.7, 0.04, 0.22, 0.2, 0.22, 0));
    } else if (kind === 'crate') {
      B.add(G.box, 0xffffff, M(0, 0, 0, 1.1, 0.42, 0.8, 0));
      B.add(G.box, 0xd0d0d0, M(0, 0, 0, 1.14, 0.08, 0.84, 0));
      B.add(G.box, 0xd0d0d0, M(0, 0.17, 0, 1.14, 0.06, 0.84, 0));
      B.add(G.box, 0xd0d0d0, M(0, -0.17, 0, 1.14, 0.06, 0.84, 0));
      B.add(G.sph, 0xe8452f, M(-0.3, 0.26, 0, 0.26, 0.24, 0.26, 0));
      B.add(G.sph, 0xf0a72a, M(0.02, 0.27, 0.1, 0.26, 0.24, 0.26, 0));
      B.add(G.sph, 0xe8452f, M(0.32, 0.26, -0.06, 0.26, 0.24, 0.26, 0));
    } else if (kind === 'tube') {
      B.add(G.cyl, 0xffffff, M(0, 0, 0, 1.5, 0.5, 1.5, 0));
      B.add(G.cyl, 0x2a3a4a, M(0, 0.02, 0, 0.7, 0.54, 0.7, 0));
      B.add(G.cyl, 0xd8d8d8, M(0, 0.22, 0, 1.52, 0.06, 1.52, 0));
    } else if (kind === 'ball') {
      B.add(G.sph, 0xffffff, M(0, 0, 0, 0.8, 0.8, 0.8, 0));
      B.add(G.sph, 0x2a2a30, M(0, 0.32, 0, 0.3, 0.16, 0.3, 0));
      B.add(G.sph, 0x2a2a30, M(0.3, -0.12, 0.12, 0.3, 0.2, 0.3, 0));
    }
    return B.geometry();
  }

  // 소품 메쉬 만들기 (InstancedMesh, 종류마다 한 번 그린다)
  function build(sc, mat) {
    scene = sc;
    meshes = {};
    bodies = [];
    const byKind = {};
    dyns.forEach((d) => { (byKind[d.kind] = byKind[d.kind] || []).push(d); });
    for (const kind in byKind) {
      const list = byKind[kind], K = KIND[kind];
      const im = new THREE.InstancedMesh(kindGeo(kind), mat, list.length);
      im.castShadow = true;
      im.frustumCulled = false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      list.forEach((d, i) => {
        const b = {
          kind, K, i, im,
          p: new THREE.Vector3(d.x, d.y + K.h, d.z),
          v: new THREE.Vector3(),
          q: new THREE.Quaternion().setFromAxisAngle(UP, d.ry),
          w: new THREE.Vector3(),
          awake: false, hint: null, r: K.r, m: K.m, air: false, st: 0,
        };
        bodies.push(b);
        writeMatrix(b);
        im.setColorAt(i, new THREE.Color(d.tint));
        regrid(b);
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      scene.add(im);
      meshes[kind] = im;
    }
  }
  function writeMatrix(b) {
    M4.compose(b.p, b.q, V.set(1, 1, 1));
    b.im.setMatrixAt(b.i, M4);
  }
  // 움직인 소품을 격자에서 옮겨 적는다 (안 옮기면 옛 자리에 유령이 남는다)
  function regrid(b) {
    const cx = Math.floor(b.p.x / CELL), cz = Math.floor(b.p.z / CELL);
    if (b.cx === cx && b.cz === cz) return;
    if (b.cx != null) {
      for (let x = b.cx - 1; x <= b.cx + 1; x++) for (let z = b.cz - 1; z <= b.cz + 1; z++) {
        const a = grid.get(x + ',' + z);
        if (!a) continue;
        const i = a.indexOf(b);
        if (i >= 0) a.splice(i, 1);
      }
    }
    b.cx = cx; b.cz = cz;
    cellsOf(b, b.p.x - CELL, b.p.z - CELL, b.p.x + CELL, b.p.z + CELL);
  }

  // 바닥 높이: 도로 → 인도(평평) → 비탈 → 땅
  function groundAt(pos, hint) {
    if (!T) return 0;
    const l = TRACK.locate(T, pos, hint);
    return { y: TRACK.groundY(T, l), loc: l };
  }

  // ---------- 카트가 부딪히기 ----------
  // S: 카트 상태, r: 카트 반지름, cb: { onHit(S, strength, kind), onSoft(S, c), onKnock(S, body) }
  const near = [];
  function gather(x, z, r) {
    near.length = 0;
    stamp++;
    const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL);
    const z0 = Math.floor((z - r) / CELL), z1 = Math.floor((z + r) / CELL);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const a = grid.get(cx + ',' + cz);
      if (!a) continue;
      for (let i = 0; i < a.length; i++) { const c = a[i]; if (c.st !== stamp) { c.st = stamp; near.push(c); } }
    }
  }

  function resolve(S, r, dt, cb) {
    gather(S.pos.x, S.pos.z, r + 1.2);
    const dir = S.yaw + S.slip;
    const hx = Math.sin(dir), hz = Math.cos(dir);
    for (let i = 0; i < near.length; i++) {
      const c = near[i];
      let nx = 0, nz = 0, pen = 0;
      if (c.t === 'box') {
        const dx = S.pos.x - c.x, dz = S.pos.z - c.z;
        // 네모의 좌표계로
        const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
        const qx = Math.max(-c.hx, Math.min(c.hx, lx)), qz = Math.max(-c.hz, Math.min(c.hz, lz));
        let ex = lx - qx, ez = lz - qz;
        let d = Math.hypot(ex, ez);
        if (d > r) continue;
        if (d < 1e-4) { // 안에 들어와 버렸다 → 도로 쪽을 향한 면 중 가까운 면으로 밀어낸다 (가장 가까운 면이 바깥이면 담장 뒤로 튕겨 나간다)
          let tcx = 0, tcz = 0;
          if (S.loc) { const sg = S.loc.t >= 0 ? -1 : 1; tcx = S.loc.side.x * sg; tcz = S.loc.side.z * sg; }
          let best = null;
          for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const wx = fx * c.cos + fz * c.sin, wz = -fx * c.sin + fz * c.cos;
            const toRoad = wx * tcx + wz * tcz;
            const pn = fx ? (c.hx - fx * lx) : (c.hz - fz * lz);
            const score = (toRoad > -0.15 ? 0 : 100) + pn;
            if (!best || score < best.score) best = { score, fx, fz, pn };
          }
          ex = best.fx; ez = best.fz; pen = r + best.pn;
          d = 1;
        } else pen = r - d;
        const lnx = ex / d, lnz = ez / d;
        nx = lnx * c.cos + lnz * c.sin;   // 다시 세계 좌표로
        nz = -lnx * c.sin + lnz * c.cos;
      } else if (c.t === 'circ') {
        const dx = S.pos.x - c.x, dz = S.pos.z - c.z;
        const d = Math.hypot(dx, dz), rr = r + c.r;
        if (d >= rr) continue;
        pen = rr - d;
        if (d < 1e-4) { nx = 1; nz = 0; } else { nx = dx / d; nz = dz / d; }
      } else if (c.kind) { // 날아가는 소품(body)
        knock(S, c, hx, hz, cb);
        continue;
      } else continue;

      if (c.soft) { // 덤불·모래: 느려지기만
        S.vel *= Math.pow(0.5, dt * c.soft);
        if (cb && cb.onSoft) cb.onSoft(S, c);
        continue;
      }
      S.pos.x += nx * (pen + 0.01);
      S.pos.z += nz * (pen + 0.01);
      const into = -(hx * nx + hz * nz) * S.vel; // 벽으로 파고드는 속도(양수면 부딪힘)
      if (into > 0) {
        const facing = Math.abs(hx * nx + hz * nz); // 1 = 정면, 0 = 스침
        const along = Math.sqrt(Math.max(0, 1 - facing * facing));
        S.vel *= 0.3 + 0.66 * along;
        // 벽을 따라 흐르는 쪽으로 머리를 돌린다
        let tx = -nz, tz = nx;
        if (tx * hx + tz * hz < 0) { tx = -tx; tz = -tz; }
        let dy = Math.atan2(tx, tz) - S.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        // 스칠 때만 벽을 따라 돌린다. 정면으로 박았을 땐 머리를 그대로 둬야 후진으로 빠져나온다
        if (facing < 0.8) S.yaw += dy * Math.min(1, dt * (2 + along * 7));
        S.slip *= 0.4;
        S.drift = 0;
        if (cb && cb.onHit && into > 5) cb.onHit(S, into, c.kind, S.pos.x - nx * r, S.pos.z - nz * r);
      }
    }
  }

  // 카트가 소품을 쳐서 날린다
  function knock(S, b, hx, hz, cb) {
    const dx = b.p.x - S.pos.x, dz = b.p.z - S.pos.z;
    const d = Math.hypot(dx, dz), rr = b.r + 0.85;
    if (d >= rr || b.p.y - S.pos.y > 1.6) return;
    const nx = d > 1e-4 ? dx / d : hx, nz = d > 1e-4 ? dz / d : hz;
    const spd = Math.abs(S.vel);
    const kick = (2.5 + spd * 0.9) / Math.sqrt(b.m);
    b.v.x += nx * kick + hx * spd * 0.25;
    b.v.z += nz * kick + hz * spd * 0.25;
    b.v.y += 1.6 + Math.min(6, spd * 0.16 / Math.sqrt(b.m));
    b.w.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 12).multiplyScalar(kick * 0.35);
    b.awake = true;
    b.air = true;
    // 카트도 살짝 밀리고 느려진다 (무거울수록 더)
    const push = rr - d;
    S.pos.x -= nx * push * 0.5;
    S.pos.z -= nz * push * 0.5;
    S.vel *= 1 - Math.min(0.28, 0.06 * b.m);
    if (cb && cb.onKnock) cb.onKnock(S, b, spd);
  }

  // 소품 물리 한 프레임
  const AXIS = new THREE.Vector3();
  function step(dt) {
    let dirty = null;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b.awake) continue;
      b.v.y -= 22 * dt;
      b.p.x += b.v.x * dt; b.p.y += b.v.y * dt; b.p.z += b.v.z * dt;
      // 회전
      const wl = b.w.length();
      if (wl > 1e-4) {
        AXIS.copy(b.w).multiplyScalar(1 / wl);
        Q.setFromAxisAngle(AXIS, wl * dt);
        b.q.premultiply(Q);
      }
      // 바닥
      const g = groundAt(b.p, b.hint);
      b.hint = g.loc.i;
      V.copy(UP).applyQuaternion(b.q);
      const tilt = Math.abs(V.y); // 1 서 있음, 0 누움
      const hOff = b.K.h * tilt + b.K.w * (1 - tilt);
      const floor = g.y + hOff;
      if (b.p.y <= floor) {
        b.p.y = floor;
        if (b.v.y < -1.2) { b.v.y = -b.v.y * 0.32; b.v.x *= 0.72; b.v.z *= 0.72; b.w.multiplyScalar(0.7); }
        else { b.v.y = 0; b.v.x *= Math.pow(0.15, dt); b.v.z *= Math.pow(0.15, dt); b.w.multiplyScalar(Math.pow(0.05, dt)); }
        b.air = false;
        // 서 있는 것도 누운 것도 아닌 어정쩡한 각도면 넘어뜨린다
        if (b.v.lengthSq() < 0.05 && tilt > 0.2 && tilt < 0.85) {
          b.w.x += (Math.random() - 0.5) * 2; b.w.z += (Math.random() - 0.5) * 2;
        }
        if (b.v.lengthSq() < 0.02 && b.w.lengthSq() < 0.05 && (tilt >= 0.85 || tilt <= 0.2)) { b.awake = false; b.v.set(0, 0, 0); b.w.set(0, 0, 0); }
      } else b.air = true;
      regrid(b);
      writeMatrix(b);
      if (!dirty) dirty = new Set();
      dirty.add(b.im);
    }
    if (dirty) dirty.forEach((im) => { im.instanceMatrix.needsUpdate = true; });
  }

  function dispose() {
    for (const k in meshes) { const im = meshes[k]; if (im.parent) im.parent.remove(im); im.geometry.dispose(); }
    meshes = {};
    grid.clear();
    statics = []; dyns = []; bodies = [];
  }

  window.PHYS = { reset, box, circle, dyn, build, resolve, step, dispose, regrid, KIND, get statics() { return statics; }, get bodies() { return bodies; } };
})();
