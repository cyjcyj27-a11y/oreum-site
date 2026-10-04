/* 새우잡이배 — 그 밖의 일: 갑판 때 닦기와 바닷물 뿌리기, 선장 라면. 오늘 할 일 목록 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, W = SB.work = {}, grp, I;
var SPOTS = [[0.1, -0.55], [1.1, -0.6], [2.1, -0.6], [-0.5, 0.95], [0.3, 1.55], [1.4, 1.6], [3.0, 1.0], [-1.6, -0.9], [-1.7, 0.95], [2.6, -1.3], [0.7, -1.5], [3.3, -0.8], [-0.6, -1.3], [2.2, 1.95]];
var KINDS = ['slime', 'scale', 'gut', 'slime', 'ink', 'mud'];
W.init = function () {
  grp = SB.boat.group; I = SB.boat.I;
  SB.boat.addInter({ id: 'bucket', box: [0.72, D, -2.5, 1.08, D + 0.32, -2.1], name: function () { return SB.L('양동이', 'Bucket'); }, ok: function () { return SB.G.mode === 'day' && !SB.G.carry && !W.rinsing; }, use: W.rinse });
  cookInit(); brushInit();
};
/* 갑판 솔: 자루 1.4m, 솔 머리 0.34m. 닦는 동안 주인공 두 손이 자루를 쥔다 */
var brushG, _bv = new T.Vector3(), _bq = new T.Quaternion(), _up = new T.Vector3(0, 1, 0);
function brushInit() {
  brushG = new T.Group(); brushG.visible = false; grp.add(brushG);
  var wd = new T.MeshLambertMaterial({ color: 0xb08a58 }), hd = new T.MeshLambertMaterial({ color: 0x2f6fb5 }), br = new T.MeshLambertMaterial({ color: 0xe8d9a0 });
  var stick = new T.Mesh(new T.CylinderGeometry(0.016, 0.018, 1.4, 8), wd); stick.position.y = 0.72; brushG.add(stick);
  var head = new T.Mesh(new T.BoxGeometry(0.34, 0.045, 0.09), hd); head.position.y = 0.055; brushG.add(head);
  var bristle = new T.Mesh(new T.BoxGeometry(0.33, 0.04, 0.085), br); bristle.position.y = 0.017; brushG.add(bristle);
  brushG.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
}
W.brush = function (on) { brushG.visible = !!on; };
W.brushAt = function (head, hand) {                  // head: 솔이 닿은 갑판 자리, hand: 손 쪽(자루가 향할 곳)
  brushG.position.copy(head); _bv.copy(hand).sub(head).normalize();
  _bq.setFromUnitVectors(_up, _bv); brushG.quaternion.copy(_bq);
  if (Math.random() < 0.25) SB.fx.emit('foam', head.x + (Math.random() - 0.5) * 0.25, D + 0.02, head.z + (Math.random() - 0.5) * 0.25, 0, 0.15, 0, 0.7);
};
/* ---------- 때 ---------- */
W.spawnStains = function (n) {
  var used = SB.fx.stains.map(function (s) { return s.spot; }), free = [], i;
  for (i = 0; i < SPOTS.length; i++) if (used.indexOf(i) < 0) free.push(i);
  for (i = 0; i < n && free.length; i++) {
    var k = free.splice(Math.floor(Math.random() * free.length), 1)[0], sp = SPOTS[k];
    var st = SB.fx.makeStain({ x: sp[0] + (Math.random() - 0.5) * 0.2, z: sp[1] + (Math.random() - 0.5) * 0.2, w: 0.45 + Math.random() * 0.25, kind: KINDS[Math.floor(Math.random() * KINDS.length)], seed: Math.floor(Math.random() * 1e6), rot: Math.random() * 6, tough: SB.sea.storm ? 1.2 : 1 });
    st.spot = k;
  }
  SB.taskProgress();
};
var rc = new T.Raycaster();
W.stainAt = function (ray, far) {
  var ms = SB.fx.stains.filter(function (s) { return !s.done; }).map(function (s) { return s.mesh; }); if (!ms.length) return null;
  rc.ray.copy(ray); rc.far = far || 3.2; var h = rc.intersectObjects(ms, false)[0]; if (!h) return null;
  return { st: h.object.userData.st, uv: h.uv, p: h.point, n: new T.Vector3(0, 1, 0).applyQuaternion(SB.boat.group.quaternion) };
};
W.scrub = function (h, amt) {
  if (SB.fx.scrubStain(h.st, h.uv, amt, 1)) {
    SB.snd('ding'); var p = h.st.mesh.position; SB.fx.burst('spark', p.x, p.y + 0.05, p.z, 8, 0.6, 0.6, 0.5); var st = h.st;
    SB.fx.anim(0.4, function (t) { st.mesh.material.opacity = 1 - t; }, function () { SB.fx.killStain(st); SB.taskProgress(); });
  } else if (Math.random() < 0.5) { var q = h.st.mesh.position; SB.fx.emit('foam', q.x + (Math.random() - 0.5) * 0.3, q.y + 0.02, q.z + (Math.random() - 0.5) * 0.3, 0, 0.2, 0, 0.8); }
};
W.stainsLeft = function () { return SB.fx.stains.filter(function (s) { return !s.done; }).length; };
/* ---------- 바닷물 뿌리기: 양동이를 바다에 던져 길어 올려 갑판에 끼얹는다 ---------- */
W.rinse = function () {
  var t = SB.taskOf('deck'), net = SB.taskOf('net');
  if (!t || t.done >= 1) { SB.ui.nope(); return; }
  if (net.done < net.n || W.stainsLeft() > 0) { SB.ui.nope('deck'); return; }
  W.rinsing = true; var b = I.bucket, x0 = b.position.x, z0 = b.position.z; SB.snd('whoosh'); holdBucket(b);
  SB.fx.anim(0.6, function (k) { b.position.set(x0, D + Math.sin(k * PI) * 1.2 + k * -1.5, z0 - k * 1.0); b.rotation.x = -k * 2; }, function () {
    SB.fx.splash(x0, z0 - 1.1, false); SB.snd('splashS');
    setTimeout(function () {
      SB.snd('rope');
      SB.fx.anim(0.9, function (k) { b.position.set(x0, D - 1.5 + k * 1.9, z0 - 1.0 + k * 0.7); b.rotation.x = -2 + k * 2; }, function () {
        SB.snd('splash'); var i;
        for (i = 0; i < 70; i++) SB.fx.emit('drops', x0 + (Math.random() - 0.5) * 0.5, D + 0.6, z0 + 0.3, (Math.random() - 0.5) * 2.5, 1.2 + Math.random(), 2.5 + Math.random() * 2.5, 1.2);
        for (i = 0; i < 10; i++) SB.fx.emit('foam', x0 + (Math.random() - 0.5) * 2, D + 0.02, z0 + 0.5 + Math.random() * 3, 0, 0, 0.6, 0.7);
        b.position.set(x0, D, z0); b.rotation.x = 0; W.rinsing = false; holdBucket(null);
        t.done = 1; SB.ui.praise('CLEAN'); SB.snd('clean'); SB.taskProgress();
      });
    }, 500);
  });
};
function holdBucket(b) { if (!b) { SB.hero.R = SB.hero.L = null; } }   // 양동이를 던지고 끌어올리는 동안 두 손이 손잡이를 따라간다(W.update)
/* ---------- 선장 라면: 물 붓기 → 불 켜기 → 끓으면 면 넣기 → 알맞을 때 불 끄기 → 냄비를 선장에게 ---------- */
var R = W.ramen = { step: 0 }, pot, water, noodle, soup, packet, bub = [], CST = { cam: [-1.75, D + 2.15, -1.0], look: [-2.3, D + 0.8, -2.3], at: [-2.8, -1.65, PI - 0.35], hands: 'free' };   // 3인칭: 주인공 오른쪽 뒤에서 버너를 본다
function cookInit() {
  var bp = I.burner, top = bp.y;
  pot = new T.Group(); pot.position.set(bp.x, top + 0.005, bp.z); grp.add(pot);
  var al = new T.MeshPhongMaterial({ color: 0xd8b24c, shininess: 110, specular: 0xfff0c0, side: T.DoubleSide });
  var lp = [[0.001, 0], [0.105, 0], [0.11, 0.004], [0.115, 0.095], [0.122, 0.1], [0.118, 0.103], [0.11, 0.098], [0.105, 0.01]].map(function (a) { return new T.Vector2(a[0], a[1]); });
  var body = new T.Mesh(new T.LatheGeometry(lp, 28), al); body.castShadow = true; pot.add(body);
  [-1, 1].forEach(function (s) { var h = new T.Mesh(new T.TorusGeometry(0.025, 0.006, 6, 12, PI), al); h.position.set(s * 0.13, 0.08, 0); h.rotation.set(0, s > 0 ? 0 : PI, PI / 2); pot.add(h); });
  water = new T.Mesh(new T.CircleGeometry(0.106, 24), new T.MeshPhongMaterial({ color: 0x9cc4cc, shininess: 120, transparent: true, opacity: 0.8 })); water.rotation.x = -PI / 2; pot.add(water);
  soup = water.material;
  noodle = new T.Group(); pot.add(noodle);
  var nm = new T.MeshLambertMaterial({ color: 0xf2d27a }), r = SB.rng(4);
  noodle.add(new T.Mesh(new T.BoxGeometry(0.09, 0.025, 0.09), nm));
  for (var k = 0; k < 10; k++) { var t = new T.Mesh(new T.TorusGeometry(0.03 + r() * 0.02, 0.004, 4, 16), nm); t.position.set((r() - 0.5) * 0.08, 0, (r() - 0.5) * 0.08); t.rotation.set(PI / 2 + (r() - 0.5) * 0.6, 0, r() * 6); t.visible = false; noodle.add(t); }
  for (k = 0; k < 8; k++) { var bb = new T.Mesh(new T.SphereGeometry(0.008, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); bb.visible = false; pot.add(bb); bub.push(bb); }
  packet = SB.mk(function (b) { b.box(0, 0.007, 0, 0.13, 0.014, 0.16, { col: [0.82, 0.1, 0.08] }); b.box(0, 0.0145, 0.02, 0.08, 0.001, 0.05, { col: [0.98, 0.9, 0.3] }); b.box(0, 0.0145, -0.045, 0.1, 0.001, 0.025, { col: [0.1, 0.1, 0.1] }); }, SB.M.pla);
  packet.position.set(-2.28, top, -2.12); packet.rotation.y = 0.3; grp.add(packet);
  SB.boat.addInter({ id: 'galley', box: [-3.0, D + 0.8, -2.6, -1.8, D + 1.3, -2.0], name: function () { return SB.L('버너', 'Stove'); }, ok: function () { var t = SB.taskOf('ramen'); return SB.G.mode === 'day' && t && t.done < 1 && (R.step < 5 || R.step === 6) && !SB.G.carry; }, use: function () { if (R.step === 6) { R.step = 5; pot.visible = false; SB.carry('pot'); SB.snd('lift'); } else cookEnter(); } });
  W.resetRamen();
}
W.resetRamen = function () {
  R.step = 0; R.level = 0; R.boil = 0; R.cook = 0; R.pour = false; R.grade = null;
  pot.visible = true; water.visible = false; noodle.visible = false; noodle.children.forEach(function (c, i) { c.visible = i === 0; }); packet.visible = true; soup.color.set(0x9cc4cc);
  I.jug.rotation.set(0, 0, 0); I.jug.position.set(-2.05, I.burner.y - 0.11, -2.3);
};
var TG = {};
function cookEnter() { SB.station.enter(CST, { down: cdown, up: cup, update: cookHands, exit: function () { R.pour = false; } }); }
var touchAt = null, touchT = 0;
function cookHands(dt) {                              // 오른손은 방금 누른 것(물을 부을 땐 물통), 왼손은 조리대에
  var H = SB.hero, j = I.jug, bp = I.burner; touchT -= dt;
  var tgt = R.pour ? new T.Vector3(j.position.x, j.position.y + 0.3, j.position.z) : touchT > 0 && touchAt ? touchAt : new T.Vector3(-2.2, bp.y - 0.08, -2.05);
  H.R = { p: tgt, palm: new T.Vector3(0, -1, 0), g: R.pour ? 1 : 0.5 }; H.L = { p: new T.Vector3(-2.7, bp.y - 0.08, -2.0), palm: new T.Vector3(0, -1, 0), g: 0.3 };
}
function near(p) { var w = new T.Vector3(p[0], p[1], p[2]); grp.localToWorld(w); w.project(SB.cam); return Math.hypot((w.x - SB.ptr.x) * SB.aspect, w.y - SB.ptr.y); }
function cdown() {
  var bp = I.burner, top = bp.y - 0.11, dj = near([-2.05, top + 0.2, -2.3]), dk = near([-2.48, top + 0.06, -2.15]), dp = near([packet.position.x, top + 0.02, packet.position.z]);
  touchAt = null; touchT = 0.6;
  if (R.step === 0 && dj < 0.16) { R.pour = true; return; }
  if (dk < 0.12) {
    touchAt = new T.Vector3(-2.48, top + 0.06, -2.15);
    if (R.step === 1) { R.step = 2; R.boil = 0; SB.snd('ignite'); SND.loop('flame', 1); return; }
    if (R.step === 4) { R.step = 5; SND.loop('flame', 0); SND.loop('boil', 0); SB.snd('click'); grade(); return; }
  }
  if ((R.step === 2 || R.step === 3) && dp < 0.14) { touchAt = new T.Vector3(packet.position.x, top + 0.04, packet.position.z); R.step = 4; R.cook = 0; R.early = R.boil < 4; SB.snd('rip'); packet.visible = false; noodle.visible = true; noodle.position.y = 0.12; SB.fx.burst('spark', bp.x, bp.y + 0.12, bp.z, 6, 0.3, 0.3, 0.4); return; }
  SB.snd('tap');
}
function cup() { if (R.pour) { R.pour = false; if (R.level >= 0.35) { R.step = 1; SB.snd(R.level > 0.55 && R.level < 0.78 ? 'nice' : 'tap'); } } }
function grade() {
  var c = R.cook, g = (c >= 5 && c <= 8.5 && !R.early) ? 'PERFECT' : (c >= 3 && c <= 11) ? 'GOOD' : 'BAD';
  R.grade = g; if (g !== 'BAD') { SB.ui.praise(g); SB.snd(g === 'PERFECT' ? 'perfect' : 'nice'); } else SB.snd('down');
  setTimeout(function () { if (SB.station.cur) SB.station.leave(); if (!SB.G.carry) { pot.visible = false; SB.carry('pot'); } else R.step = 6; }, 700);
}
function cupdate(dt) {
  var bp = I.burner, j = I.jug, i;
  if (R.step === 0) {
    var tilt = R.pour ? 1.25 : 0; j.rotation.z += (tilt - j.rotation.z) * Math.min(1, dt * 8); j.position.x += ((R.pour ? -2.38 : -2.05) - j.position.x) * Math.min(1, dt * 8); j.position.y += ((R.pour ? bp.y + 0.04 : bp.y - 0.11) - j.position.y) * Math.min(1, dt * 8);
    if (R.pour && j.rotation.z > 0.9) { R.level = Math.min(1.1, R.level + dt * 0.3); water.visible = true; SND.loop('pour', 1); for (i = 0; i < 3; i++) SB.fx.emit('drops', bp.x + 0.06 + Math.random() * 0.02, bp.y + 0.2, bp.z, -0.2, -0.5, 0, 0.3); if (R.level > 1) { SB.fx.burst('drops', bp.x, bp.y + 0.1, bp.z, 3, 0.5, 0.5, 0.4); } }
    else SND.loop('pour', 0);
  } else { j.rotation.z *= 0.85; j.position.x += (-2.05 - j.position.x) * Math.min(1, dt * 8); j.position.y += (bp.y - 0.11 - j.position.y) * Math.min(1, dt * 8); SND.loop('pour', 0); }
  water.position.y = 0.012 + Math.min(1, R.level) * 0.075;
  if (R.step >= 2 && R.step <= 4) {
    R.boil += dt; for (i = 0; i < 3; i++) { var a = Math.random() * 6.28; SB.fx.emit('flame', bp.x + Math.cos(a) * 0.07, bp.y - 0.005, bp.z + Math.sin(a) * 0.07, Math.cos(a) * 0.05, 0.25, Math.sin(a) * 0.05, 0.12); }
    var bv = SB.smooth(2, 5, R.boil); SND.loop('boil', bv);
    bub.forEach(function (b) { if (Math.random() < bv * dt * 8) { b.visible = true; b.position.set((Math.random() - 0.5) * 0.15, water.position.y + 0.002, (Math.random() - 0.5) * 0.15); b.scale.setScalar(0.5 + Math.random()); } else if (Math.random() < dt * 6) b.visible = false; });
    if (bv > 0.5 && Math.random() < dt * 10) SB.fx.emit('steam', bp.x + (Math.random() - 0.5) * 0.1, bp.y + 0.15, bp.z + (Math.random() - 0.5) * 0.1, 0, 0.25, 0, 1.4);
    if (R.step === 3 && R.boil > 4) R.step = 3;
  } else bub.forEach(function (b) { b.visible = false; });
  if (R.step === 4) {
    R.cook += dt * (R.boil > 4 ? 1 : 0.5); noodle.position.y += (water.position.y - 0.005 - noodle.position.y) * Math.min(1, dt * 6);
    var loose = SB.smooth(1, 6, R.cook); noodle.children[0].scale.set(1 - loose * 0.6, 1, 1 - loose * 0.6); noodle.children.forEach(function (c, k) { if (k) { c.visible = loose > 0.2; c.scale.setScalar(0.6 + loose * 0.6 + Math.max(0, R.cook - 8) * 0.06); } });
    soup.color.setRGB(0.6 + 0.3 * SB.smooth(0, 2, R.cook), 0.76 - 0.4 * SB.smooth(0, 2, R.cook), 0.8 - 0.62 * SB.smooth(0, 2, R.cook));
  }
}
W.serve = function () { var t = SB.taskOf('ramen'); SB.carry(null); t.done = 1; SB.cap.eat(R.grade); SB.taskProgress(); SB.ui.praise(R.grade === 'PERFECT' ? 'PERFECT' : 'NICE'); };
W.update = function (dt) {
  if (W.rinsing) { var p = I.bucket.position; SB.hero.R = { p: new T.Vector3(p.x - 0.08, p.y + 0.36, p.z), palm: new T.Vector3(0, -1, 0), g: 1 }; SB.hero.L = { p: new T.Vector3(p.x + 0.08, p.y + 0.36, p.z), palm: new T.Vector3(0, -1, 0), g: 1 }; }
  if (SB.G.mode === 'day') { cupdate(dt); if (R.step === 4 && R.cook > 16) { R.step = 5; SND.loop('flame', 0); SND.loop('boil', 0); grade(); } } };
})();
