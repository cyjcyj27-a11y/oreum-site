/* 새우잡이배 — 밤: 뗏목 재료 모으기. 한 번에 하나씩 들고 이물 방수포에 놓는다. 발소리가 쌓이면 선장이 깬다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, N = SB.night = { noise: 0 }, grp, I, deckBuoys = [], chest, chestLid, ropeIn = [], cabDoor, vestIn, oarW;
N.PARTS = ['pallet0', 'pallet1', 'buoy0', 'buoy1', 'buoy2', 'buoy3', 'rope0', 'rope1', 'oar', 'vest', 'jug', 'compass'];
var KIND = { pallet0: 'pallet', pallet1: 'pallet', buoy0: 'buoy', buoy1: 'buoy', buoy2: 'buoy', buoy3: 'buoy', rope0: 'rope', rope1: 'rope', oar: 'oar', vest: 'vest', jug: 'jug', compass: 'compass' };
var HEAVY = { pallet: 1, buoy: 0.6, oar: 0.6, jug: 0.5, rope: 0.3, vest: 0.2, compass: 0 };
N.BUOYDAYS = [2, 4, 6, 8];
N.count = function () { var G = SB.G, n = 0; N.PARTS.forEach(function (p) { if (G.parts[p]) n++; }); return n; };
N.init = function () {
  grp = SB.boat.group; I = SB.boat.I;
  for (var k = 0; k < 4; k++) { var b = SB.mk(function (bb) { bb.put(new T.CylinderGeometry(0.2, 0.2, 0.58, 14), 0, 0, 0, { rz: PI / 2, col: [0.95, 0.95, 0.93] }); bb.put(new T.CylinderGeometry(0.205, 0.205, 0.04, 14), 0, 0, 0, { rz: PI / 2, col: [0.85, 0.3, 0.12] }); bb.tube([0.29, 0, 0], [0.5, -0.18, 0.1], 0.01, { col: [0.2, 0.4, 0.8] }); }, new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true })); b.position.set(2.75 - k * 0.15, D + 0.2, 2.2 - k * 0.05); b.rotation.y = 0.3 + k * 0.4; b.visible = false; b.castShadow = true; grp.add(b); deckBuoys.push(b); }
  chest = SB.mk(function (b) { b.box(0, 0.25, 0, 0.5, 0.5, 1.2, { col: [0.22, 0.42, 0.32] }); b.box(0.255, 0.33, 0, 0.012, 0.08, 0.06, { col: [0.6, 0.6, 0.6] }); }, SB.M.machine); chest.position.set(-8.6, D, -0.5); grp.add(chest);
  chestLid = new T.Group(); chestLid.position.set(-8.85, D + 0.5, -0.5); grp.add(chestLid);
  chestLid.add(SB.mk(function (b) { b.box(0.25, 0.02, 0, 0.52, 0.04, 1.22, { col: [0.24, 0.45, 0.34] }); }, SB.M.machine));
  N.lock = SB.mk(function (b) { b.box(0, 0, 0, 0.05, 0.06, 0.025, { col: [0.75, 0.6, 0.2] }); b.put(new T.TorusGeometry(0.018, 0.005, 5, 10, PI), 0, 0.03, 0, { col: [0.7, 0.7, 0.7] }); }, SB.M.steel); N.lock.position.set(-8.33, D + 0.42, -0.5); grp.add(N.lock);
  [0, 1].forEach(function (k) { var r = SB.mk(function (b) { for (var j = 0; j < 4; j++) b.put(new T.TorusGeometry(0.16, 0.022, 6, 18), 0, j * 0.035, 0, { rx: PI / 2 }); }, SB.M.ropeB); r.position.set(-8.6, D + 0.2, -0.8 + k * 0.6); grp.add(r); ropeIn.push(r); });
  SB.boat.solid(-8.86, -8.34, -1.11, 0.11, D, D + 0.55);
  cabDoor = new T.Group(); cabDoor.position.set(-6.83, D + 0.85, 0.7); grp.add(cabDoor);
  cabDoor.add(SB.mk(function (b) { b.box(0.012, 0, 0.37, 0.02, 1.62, 0.72, { col: [0.6, 0.63, 0.63] }); b.box(0.03, 0.1, 0.66, 0.02, 0.12, 0.03, { col: [0.3, 0.3, 0.3] }); }, SB.M.steel));
  vestIn = SB.mk(function (b) { b.box(0, 0, 0, 0.12, 0.55, 0.42, { col: [0.98, 0.45, 0.08] }); b.box(0.065, 0.05, 0, 0.004, 0.04, 0.32, { col: [0.85, 0.85, 0.82] }); }, SB.M.mat); vestIn.position.set(-7.05, D + 1.05, 1.07); grp.add(vestIn);
  oarW = SB.mk(function (b) { b.put(new T.CylinderGeometry(0.025, 0.028, 1.8, 8), 0, 0, 0, { rz: PI / 2, col: [0.62, 0.45, 0.28] }); b.box(1.05, 0, 0, 0.5, 0.16, 0.02, { col: [0.62, 0.45, 0.28] }); }, SB.M.mat); oarW.position.set(-5.85, D + 1.5, 1.39); grp.add(oarW);
  var A = SB.boat.addInter, night = function () { return SB.G.mode === 'night'; }, free = function () { return !SB.G.carry; };
  A({ id: 'pallets', box: [-3.12, D, 1.7, -2.08, D + 0.45, 2.54], name: function () { return SB.L('나무판', 'Pallet'); }, ok: function () { return !SB.G.taken.pallet1 && free(); }, use: function () { take(SB.G.taken.pallet0 ? 'pallet1' : 'pallet0'); } });
  deckBuoys.forEach(function (b, k) { A({ id: 'buoy' + k, box: [b.position.x - 0.35, D, b.position.z - 0.3, b.position.x + 0.35, D + 0.45, b.position.z + 0.3], name: function () { return SB.L('부표', 'Float'); }, ok: function () { return b.visible && free(); }, use: function () { take('buoy' + k); } }); });
  A({ id: 'chest', box: [-8.88, D, -1.12, -8.32, D + 0.6, 0.12], name: function () { return SB.L('상자', 'Chest'); }, ok: function () { return free() && !(SB.G.taken.rope0 && SB.G.taken.rope1); }, use: chestUse });
  A({ id: 'oar', box: [-6.8, D + 1.35, 1.25, -4.5, D + 1.65, 1.48], name: function () { return SB.L('노', 'Oar'); }, ok: function () { return oarW.visible && free(); }, use: function () { take('oar'); } });
  A({ id: 'vest', box: [-6.9, D + 0.1, 0.68, -6.75, D + 1.65, 1.45], name: function () { return SB.L('사물함', 'Locker'); }, ok: function () { return vestIn.visible && free(); }, use: function () { if (!night()) return touch(); SB.snd('locker'); SB.fx.anim(0.3, function (t) { cabDoor.rotation.y = -t * 1.8; }); N.add(0.25); take('vest'); } });
  A({ id: 'jug', box: [-2.32, D, -2.45, -1.98, D + 0.4, -2.12], name: function () { return SB.L('물통', 'Water Jug'); }, ok: function () { return I.spareJug.visible && free(); }, use: function () { take('jug'); } });
  A({ id: 'raft', box: [6.45, D, -0.9, 8.15, D + 0.7, 1.15], name: function () { return SB.L('방수포', 'Tarp'); }, ok: function () { return SB.G.mode === 'night'; }, use: raftUse });
  A({ id: 'bunk', box: [5.12, D, -1.72, 5.2, D + 1.2, -0.88], name: function () { return SB.L('선실', 'Cabin'); }, ok: function () { return SB.G.mode === 'night' || (SB.G.mode === 'day' && SB.allDone()); }, use: function () { SB.toBed(); } });
};
function touch() { SB.cap.say('touch'); SB.ui.nope(); return false; }
function take(id) {
  if (SB.G.mode !== 'night') return touch();
  var G = SB.G, k = KIND[id]; G.taken[id] = true; G.holding = id; SB.carry(k); SB.snd('lift'); N.add(HEAVY[k] * 0.15 + 0.03); N.vis();
}
function chestUse() {
  var G = SB.G; if (G.mode !== 'night') return touch();
  if (!G.inv.key) { SB.snd('rattle'); N.add(0.2); SB.ui.nope(); return; }
  if (!G.flags.chest) { G.flags.chest = true; SB.snd('unlock'); N.lock.visible = false; SB.fx.anim(0.4, function (t) { chestLid.rotation.z = t * 1.7; }); SB.save(); return; }
  take(G.taken.rope0 ? 'rope1' : 'rope0');
}
function raftUse() {
  var G = SB.G;
  if (G.holding) { var id = G.holding; G.parts[id] = true; G.holding = null; SB.carry(null); SB.snd('thud'); SB.ui.praise(N.count() + '/12'); N.vis(); SB.save(); SB.ui.hud(); return; }
  if (G.inv.compass && !G.parts.compass) { G.parts.compass = true; G.taken.compass = true; G.inv.compass = false; SB.snd('thud'); SB.ui.praise(N.count() + '/12'); N.vis(); SB.save(); SB.ui.hud(); return; }
  if (N.count() >= 12 && SB.islandNight()) { SB.escape.start(); return; }
  SB.snd('tarp'); SB.ui.nope('raft');
}
/* 보이는 것 맞추기: 쌓인 나무판, 갑판 부표, 상자 속 밧줄, 노, 조끼, 물통, 뗏목 */
N.vis = function () {
  var G = SB.G, P = SB.boat.raftP;
  I.pallets[2].visible = !G.taken.pallet0; I.pallets[1].visible = !G.taken.pallet1;
  deckBuoys.forEach(function (b, k) { b.visible = !!G.dropped[k] && !G.taken['buoy' + k]; b.position.y = D + 0.2; });
  ropeIn.forEach(function (r, k) { r.visible = !G.taken['rope' + k]; });
  N.lock.visible = !G.flags.chest; chestLid.rotation.z = G.flags.chest ? 1.7 : 0;
  oarW.visible = !G.taken.oar; vestIn.visible = !G.taken.vest; cabDoor.rotation.y = G.taken.vest ? -1.8 : 0;
  I.spareJug.visible = G.day >= 7 && !G.taken.jug;
  N.PARTS.forEach(function (p) { P[p].visible = !!G.parts[p]; });
  SB.boat.setTarp(N.count());
};
/* 낮 그물에서 부표가 떨어진다(2, 4, 6, 8일차 그물, 놓친 것은 다음 그물에서) */
N.dropBuoy = function () {
  var G = SB.G, k = -1, j; for (j = 0; j < N.BUOYDAYS.length; j++) if (N.BUOYDAYS[j] <= G.day && !G.dropped[j]) { k = j; break; }   /* 10/8: 그날 그물을 못 올려 놓친 부표는 다음 그물에서 하나씩 */
  if (k < 0) return;
  G.dropped[k] = true; var b = deckBuoys[k], y0 = D + 2.8;
  b.visible = true; SB.fx.anim(0.6, function (t) { b.position.y = y0 + (D + 0.2 - y0) * t * t; }, function () { SB.snd('thud'); SB.fx.burst('drops', b.position.x, D + 0.1, b.position.z, 12, 1.2, 1, 0.5); });
  SB.save();
};
/* 소리: 걷기·뛰기·무거운 것·조타실 안 */
N.add = function (v) { N.noise += v; };
N.update = function (dt, sp, run) {
  var G = SB.G; if (G.mode !== 'night') return;
  var inCab = SB.boat.inCabin(G.P.x, G.P.z), k = (run ? 4 : 1) * (1 + (G.holding ? HEAVY[KIND[G.holding]] * 1.5 : 0)) * (inCab ? 3 : 1);
  N.noise += dt * sp / 3 * 0.03 * k; N.noise = Math.max(0, N.noise - dt * 0.05);
  var lim = 1 + SB.cap.mood * 0.12;
  if (SB.cap.st === 'sleep') { SB.ui.zzz(N.noise / lim); if (N.noise >= lim) { N.noise = 0; SB.cap.wake(); SB.ui.zzz(-1); } }
  else SB.ui.zzz(-1);
};
N.seen = function () {
  var G = SB.G; if (N.busted) return; N.busted = true;
  var near = Math.hypot(G.P.x - SB.boat.raftAt.x, G.P.z - SB.boat.raftAt.z) < 1.8;
  if (G.holding || near) {
    SB.cap.say('caught'); SB.snd('hit'); SB.ui.flash();
    if (G.holding) { G.taken[G.holding] = false; G.holding = null; SB.carry(null); N.vis(); }
  } else SB.cap.say('go_sleep');
  setTimeout(function () { N.busted = false; SB.toBed(true); }, 1400);
};
N.calm = function () { N.noise = 0; };
N.setup = function () { N.noise = 0; N.busted = false; N.vis(); };
N.kindOf = function (id) { return KIND[id]; };
})();
