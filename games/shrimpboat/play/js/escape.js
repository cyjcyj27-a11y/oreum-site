/* 새우잡이배 — 섬과 탈출. 5일마다 섬 가까이 닻을 내린다. 뗏목을 띄우면 좌우 번갈아 노를 저어 해변까지. 탐조등에 오래 걸리면 배가 쫓아온다 */
(function () {
'use strict';
var T = THREE, PI = Math.PI, E = SB.escape = { on: false, ly: 0, lp: -0.08 }, sbeam, scene, island, raft, oar, beach = new T.Vector3(), start = new T.Vector3(), rp = new T.Vector3(), heading = 0, vel = 0, last = 0, meter = 0, chase = false, sweep = 0, boatHome = new T.Vector3(), lhBeam, lhT = 0, bw = new T.Vector3(), lw = new T.Vector3();
var IX = 175, IZ = -95;                                // 섬 자리(세계 좌표)
E.init = function (sc) {
  scene = sc; island = new T.Group(); island.position.set(IX, 0, IZ); island.rotation.y = Math.atan2(IX, IZ); scene.add(island);   // 섬의 -z 쪽(해변)이 배를 본다
  var dark = new T.MeshLambertMaterial({ color: 0x2c3a30, flatShading: true }), rock = new T.MeshLambertMaterial({ color: 0x45433d, flatShading: true }), sand = new T.MeshLambertMaterial({ color: 0xc2b08a });
  var r = SB.rng(51), i;
  [[0, 0, 60, 26, 40], [-45, 15, 42, 18, 30], [40, -10, 38, 15, 28], [-80, 30, 30, 10, 22], [75, 5, 26, 9, 20]].forEach(function (h) { var m = new T.Mesh(new T.SphereGeometry(1, 20, 12, 0, PI * 2, 0, PI / 2), dark); var g = m.geometry, p = g.attributes.position; for (var k = 0; k < p.count; k++) p.setY(k, p.getY(k) * (0.85 + r() * 0.3)); g.computeVertexNormals(); m.scale.set(h[2], h[3], h[4]); m.position.set(h[0], -1, h[1]); island.add(m); });
  for (i = 0; i < 9; i++) { var c = new T.Mesh(new T.DodecahedronGeometry(3 + r() * 4, 0), rock); c.position.set(-60 + r() * 120, 0, -40 - r() * 5); island.add(c); }
  var bs = new T.Mesh(new T.PlaneGeometry(70, 14), sand); bs.rotation.x = -PI / 2; bs.position.set(0, 0.25, -47); bs.rotation.z = 0; island.add(bs); var bk = new T.Mesh(new T.BoxGeometry(80, 3, 10), sand); bk.position.set(0, -0.9, -44); island.add(bk);
  island.updateMatrixWorld(true); beach.set(0, 0, -52); island.localToWorld(beach); beach.y = 0;
  var lh = new T.Group(); lh.position.set(44, 7, -44); island.add(lh); var lr = new T.Mesh(new T.DodecahedronGeometry(7, 0), rock); lr.position.set(44, 0, -44); lr.scale.y = 0.9; island.add(lr);
  lh.add(new T.Mesh(new T.CylinderGeometry(1.6, 2.2, 14, 14), new T.MeshLambertMaterial({ color: 0xe8e8e2 })));
  var top = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 2.2, 14), new T.MeshLambertMaterial({ color: 0xc23a2a })); top.position.y = 8.6; lh.add(top);
  var lamp = new T.Mesh(new T.SphereGeometry(1.4, 12, 8), new T.MeshBasicMaterial({ color: 0xfff2c0 })); lamp.position.y = 10.3; lh.add(lamp);
  var lg = new T.Sprite(new T.SpriteMaterial({ map: SB.TEX.glow(), color: 0xfff0c0, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); lg.scale.setScalar(16); lg.position.y = 10.3; lh.add(lg);
  var bg = new T.ConeGeometry(9, 120, 16, 1, true); bg.translate(0, -60, 0); bg.rotateZ(PI / 2);
  lhBeam = new T.Mesh(bg, new T.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.08, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); lhBeam.position.y = 10.3; lh.add(lhBeam);
  var glow = SB.TEX.glow();
  for (i = 0; i < 16; i++) { var s = new T.Sprite(new T.SpriteMaterial({ map: glow, color: i % 3 ? 0xffc070 : 0xfff4d8, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); s.position.set(-28 + r() * 50, 1.5 + r() * 4, -41.5 - r() * 2.5); s.scale.setScalar(4 + r() * 3); island.add(s); }
  E.lamps = island.children.filter(function (o) { return o.isSprite; });
  island.visible = false;
  raft = new T.Group(); scene.add(raft); raft.visible = false;
  var P = SB.boat.raftP;
  ['pallet0', 'pallet1', 'buoy0', 'buoy1', 'buoy2', 'buoy3', 'rope0', 'rope1', 'jug', 'vest'].forEach(function (k) { var m = P[k].clone(); m.visible = true; m.position.x -= SB.boat.raftAt.x; m.position.z -= SB.boat.raftAt.z; m.position.y -= SB.D + 0.1; raft.add(m); });
  var gc = SB.cvs(4, 128), gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 0, 0, 128); gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 4, 128);
  var cg = new T.ConeGeometry(4.5, 70, 20, 1, true); cg.translate(0, -35, 0); cg.rotateZ(PI / 2);
  sbeam = new T.Mesh(cg, new T.MeshBasicMaterial({ color: 0xfff4d0, map: new T.CanvasTexture(gc), transparent: true, opacity: 0.22, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); sbeam.visible = false; SB.boat.I.search.add(sbeam);
};
E.showIsland = function (on, night) { island.visible = on; E.lamps.forEach(function (s) { s.visible = !!night; }); lhBeam.visible = !!night; };
E.start = function () {
  E.on = true; SB.setMode('escape'); SB.carry(null); SB.ui.fade(true); SND.loop('engine', 0); SB.cap.place('gone'); SB.snd('splash');
  boatHome.copy(SB.boat.group.position);
  setTimeout(function () { reset(); SB.ui.fade(false); SB.ui.paddle(true); }, 1100);
};
function reset() {
  var g = SB.boat.group; g.position.x = boatHome.x; g.position.z = boatHome.z; g.updateMatrixWorld(true);
  var p = new T.Vector3(14, 0, 1.5).applyMatrix4(g.matrixWorld); start.set(p.x, 0, p.z); rp.copy(start);
  heading = Math.atan2(beach.x - rp.x, beach.z - rp.z); vel = 0; meter = 0; chase = false; last = 0; sweep = Math.random() * 6;
  raft.visible = true; if (SB.cam.parent) SB.cam.parent.remove(SB.cam); raft.add(SB.cam); E.ly = 0; E.lp = -0.1; camAt();
  if (!rowOar) oarInit(); rowOar.visible = true; SB.hero.toRaft(raft, E.SEAT); rowT = 1;
  SB.boat.searchL.intensity = 70; sbeam.visible = true; SB.ui.meter(0);
}
E.stroke = function (side) {                            // side: -1 왼쪽, 1 오른쪽
  if (!E.on || SB.ui.fading) return;
  var good = side !== last; last = side; vel = Math.min(3.4, vel + (good ? 0.95 : 0.35)); heading += side * (good ? 0.012 : 0.05);
  SB.snd('paddle'); rowT = 0; rowSide = side; var wp = new T.Vector3(side * 0.9, -1, -0.8); SB.cam.localToWorld(wp); E.splash = wp;
};
E.update = function (dt) {
  lhT += dt; if (lhBeam) lhBeam.rotation.y = lhT * 0.8;
  if (!E.on || !raft.visible) return;
  var aim = Math.atan2(beach.x - rp.x, beach.z - rp.z), dh = Math.atan2(Math.sin(aim - heading), Math.cos(aim - heading)); heading += dh * dt * 0.25;
  vel *= Math.pow(0.55, dt); rp.x += Math.sin(heading) * vel * dt; rp.z += Math.cos(heading) * vel * dt;
  var h = SB.sea.height(rp.x, rp.z); raft.position.set(rp.x, h + 0.05, rp.z); raft.rotation.set(Math.sin(SB.sea.time * 1.3) * 0.06, heading, Math.sin(SB.sea.time * 1.1) * 0.08);
  camAt(); row(dt);
  /* 탐조등: 배 지붕에서 바다를 훑는다. 걸리면 눈금이 찬다 */
  var g = SB.boat.group, sp = SB.boat.I.search; sp.getWorldPosition(bw);
  var toR = Math.atan2(rp.x - bw.x, rp.z - bw.z), dist = Math.hypot(rp.x - bw.x, rp.z - bw.z);
  sweep += dt * (chase ? 0 : 0.45);
  var aimL = chase ? toR : toR + Math.sin(sweep) * 1.1 + Math.sin(sweep * 0.37) * 0.4;
  lw.set(bw.x + Math.sin(aimL) * 40, -2.5, bw.z + Math.cos(aimL) * 40); sp.worldToLocal(lw); SB.boat.searchL.target.position.copy(lw); sbeam.rotation.set(0, Math.atan2(-lw.z, lw.x), Math.atan2(lw.y, Math.hypot(lw.x, lw.z)));
  var lit = Math.abs(Math.atan2(Math.sin(aimL - toR), Math.cos(aimL - toR))) < 0.1 && dist < 170;
  SB.ui.lit(lit);
  if (!chase) { meter = Math.max(0, meter + dt * (lit ? (vel > 0.4 ? 0.9 : 0.35) : -0.25)); SB.ui.meter(meter); if (meter >= 1) { chase = true; SB.cap.say('caught'); SB.snd('horn'); SND.loop('engine', 1.2); } }
  if (chase) {
    var dx = rp.x - g.position.x, dz = rp.z - g.position.z, dd = Math.hypot(dx, dz) || 1;
    g.position.x += dx / dd * 3.2 * dt; g.position.z += dz / dd * 3.2 * dt;
    if (dist < 9) { E.caught(); return; }
  }
  if (Math.hypot(rp.x - beach.x, rp.z - beach.z) < 7) E.win();
};
E.caught = function () {
  chase = false; E.on = false; SB.snd('hit'); SB.ui.flash(); SB.ui.fade(true); SND.loop('engine', 0);
  setTimeout(function () { E.on = true; reset(); SB.ui.fade(false); }, 1300);
};
E.win = function () {
  E.on = false; SB.ui.paddle(false); SB.ui.lit(false); SND.loop('engine', 0); SB.boat.searchL.intensity = 0; SB.snd('surf');
  SB.ui.fade(true); setTimeout(function () { E.stop(); SB.ending(true); }, 1300);
};
E.stop = function () { E.on = false; raft.visible = false; if (SB.cam.parent === raft) raft.remove(SB.cam); if (rowOar) rowOar.visible = false; SB.hero.R = SB.hero.L = null; if (SB.hero.onRaft) SB.hero.toBoat(); SB.boat.searchL.intensity = 0; if (sbeam) sbeam.visible = false; SB.boat.group.position.x = boatHome.x; SB.boat.group.position.z = boatHome.z; SB.ui.paddle(false); SB.ui.lit(false); };
E.look = function (dx, dy) { E.ly = SB.clamp(E.ly - dx, -2.6, 2.6); E.lp = SB.clamp(E.lp - dy, -0.8, 0.6); };
/* 3인칭: 뗏목 뒤 위에서 본다(끌어서 둘러보기). 주인공은 뗏목에 앉아 긴 노 하나를 두 손으로 좌우 번갈아 젓는다 */
E.SEAT = [0, 0.02, -0.15];
function camAt() { var c = SB.cam, d = 3.0; c.position.set(-Math.sin(E.ly) * d, 1.75, -Math.cos(E.ly) * d); c.rotation.set(E.lp - 0.24, PI + E.ly, 0, 'YXZ'); }
var rowOar = null, rowT = 1, rowSide = 1, _o = new T.Vector3(), _d = new T.Vector3(), _up = new T.Vector3(0, 1, 0);
function oarInit() {
  rowOar = new T.Group(); var wm = new T.MeshLambertMaterial({ color: 0x9e7448 });
  var sh = new T.Mesh(new T.CylinderGeometry(0.024, 0.027, 1.9, 8), wm); sh.position.y = -0.95; rowOar.add(sh);
  var bl = new T.Mesh(new T.BoxGeometry(0.16, 0.5, 0.025), wm); bl.position.y = -1.95; rowOar.add(bl);
  rowOar.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); raft.add(rowOar);
}
function row(dt) {
  if (rowT < 1) rowT = Math.min(1, rowT + dt * 2.4);
  var k = Math.sin(rowT * PI), sd = rowSide, top = _o.set(-sd * 0.22, 0.95 - k * 0.08, E.SEAT[2] + 0.38 - rowT * 0.15);   // 노 윗끝(가슴 앞, 날 반대쪽)
  _d.set(sd * 0.82, -0.62 - k * 0.22, 0.55 - rowT * 1.1).normalize();                                                   // 날은 옆 물속으로, 앞에서 뒤로 민다
  rowOar.position.copy(top); rowOar.quaternion.setFromUnitVectors(_up, _d.clone().negate());
  var H = SB.hero;
  H.R = { p: top.clone().addScaledVector(_d, sd > 0 ? 0.42 : 0.08), palm: new T.Vector3(0, -1, 0), g: 1 };
  H.L = { p: top.clone().addScaledVector(_d, sd > 0 ? 0.08 : 0.42), palm: new T.Vector3(0, -1, 0), g: 1 };
}
E.beach = beach; E.raftPos = rp;
})();
