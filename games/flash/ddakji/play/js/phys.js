/* 물리 — Rapier 로 딱지를 떨어뜨리고, 바닥을 친 순간 옆 딱지 밑으로 바람(힘)을 넣는다 */
(function () {
  var RP = window.RAPIER, W = null, groundCol = null, Q = null;
  var H = 0.07, DENS = 14, G = 42;
  var P = {
    ready: false,
    init: function () { return RP.init().then(function () { P.reset(0.8); P.ready = true; }); },
    reset: function (fr) {
      if (W) W.free();
      W = new RP.World({ x: 0, y: -G, z: 0 }); W.timestep = 1 / 120;
      Q = new RP.EventQueue(true);
      groundCol = W.createCollider(RP.ColliderDesc.cuboid(30, 0.5, 30).setTranslation(0, -0.5, 0).setFriction(fr).setRestitution(0.08));
    },
    spawn: function (x, z, flipped, yaw) {
      var q = quat(flipped ? Math.PI : 0, yaw || 0);
      var b = W.createRigidBody(RP.RigidBodyDesc.dynamic().setTranslation(x, H / 2 + 0.001, z).setRotation(q).setLinearDamping(0.25).setAngularDamping(0.6).setCcdEnabled(true));
      var c = W.createCollider(RP.ColliderDesc.cuboid(0.5, H / 2, 0.5).setDensity(DENS).setFriction(0.7).setRestitution(0.05)
        .setActiveEvents(RP.ActiveEvents.COLLISION_EVENTS).setCollisionGroups(0x0004FFFF), b);
      return { b: b, c: c };
    },
    kill: function (o) { if (o && o.b) W.removeRigidBody(o.b); },
    // 들어 올린 딱지(손에 든 것): 운동학적으로 위치만 따라간다
    hold: function (o, x, y, z, tiltX, tiltZ, yaw) {
      o.b.setBodyType(RP.RigidBodyType.KinematicPositionBased, true);
      o.b.setNextKinematicTranslation({ x: x, y: y, z: z });
      o.b.setNextKinematicRotation(quatXZ(tiltX, tiltZ, yaw));
    },
    drop: function (o, vy) {
      o.b.setBodyType(RP.RigidBodyType.Dynamic, true);
      o.b.setLinvel({ x: 0, y: -vy, z: 0 }, true); o.b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },
    place: function (o, x, z, flipped, yaw) {
      o.b.setBodyType(RP.RigidBodyType.Dynamic, true);
      o.b.setTranslation({ x: x, y: H / 2 + 0.001, z: z }, true); o.b.setRotation(quat(flipped ? Math.PI : 0, yaw || 0), true);
      o.b.setLinvel({ x: 0, y: 0, z: 0 }, true); o.b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    },
    step: function (onHit) {
      W.step(Q);
      Q.drainCollisionEvents(function (h1, h2, started) { if (started && onHit) onHit(h1, h2); });
    },
    up: function (o) { var r = o.b.rotation(); // 몸 위쪽(y) 벡터의 y 성분
      return 1 - 2 * (r.x * r.x + r.z * r.z); },
    sleeping: function (o) { var v = o.b.linvel(), w = o.b.angvel(); return v.x * v.x + v.y * v.y + v.z * v.z < 0.004 && w.x * w.x + w.y * w.y + w.z * w.z < 0.01; },
    yaw: function (o) { var r = o.b.rotation(); return Math.atan2(2 * (r.w * r.y + r.x * r.z), 1 - 2 * (r.y * r.y + r.x * r.x)); },
    impulseAt: function (o, ix, iy, iz, px, py, pz) { o.b.applyImpulseAtPoint({ x: ix, y: iy, z: iz }, { x: px, y: py, z: pz }, true); },
    mass: function (o) { return o.b.mass(); },
    // 잘 맞힌 순간: 던진 딱지가 상대 딱지를 누르지 않게 둘 사이 충돌을 끈다
    ghost: function (thr) { thr.c.setCollisionGroups(0x0002FFFB); },
    get world() { return W; }, H: H, G: G
  };
  function quat(rx, ry) { // y 축 돌린 뒤 x 축 뒤집기
    var cy = Math.cos(ry / 2), sy = Math.sin(ry / 2), cx = Math.cos(rx / 2), sx = Math.sin(rx / 2);
    return { w: cy * cx, x: cy * sx, y: sy * cx, z: -sy * sx };
  }
  function quatXZ(ax, az, ry) {
    var e = new THREE.Euler(ax, ry || 0, az, 'YXZ'), q = new THREE.Quaternion().setFromEuler(e);
    return { w: q.w, x: q.x, y: q.y, z: q.z };
  }
  window.DDKPhys = P;
})();
