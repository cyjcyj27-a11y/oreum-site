/* 새우잡이배 — 그물 올리기: 양망기 손잡이를 누르고 있으면 감긴다. 파도 따라 장력이 오르내리고, 빨간 칸에서 감으면 그물이 찢긴다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, H = SB.haul = { phase: 'idle', prog: 0, tension: 0.3, dmg: 0, wave: 0, hold: false };
var I, bag, inner, knot, ropeA, ropeB, tip = new T.Vector3(), piv, OUT = new T.Vector3(-1.2, 2.6, 3.05).normalize(), IN = new T.Vector3(-2.1, 3.0, 0.3).normalize(), boomK = 0, tmpD = new T.Vector3(), drumTop = new T.Vector3();
var ST = { cam: [5.9, D + 2.0, 0.2], look: [3.2, D + 0.6, 2.6], at: [4.1, 0.95, 0], hands: 'pull' };   // 3인칭: 주인공 오른쪽 뒤에서 손잡이와 바다 쪽 그물을 본다
H.init = function () {
  var grp = SB.boat.group; I = SB.boat.I; piv = I.boomPivot;
  bag = new T.Group(); grp.add(bag);
  bag.add(SB.mk(function (b) { b.put(new T.SphereGeometry(0.42, 16, 12), 0, -0.55, 0, { sy: 1.35, col: [0.3, 0.62, 0.38] }); b.put(new T.ConeGeometry(0.42, 0.5, 16, 1, true), 0, 0.02, 0, { col: [0.3, 0.62, 0.38] }); }, SB.M.net));
  inner = SB.mk(function (b) { var r = SB.rng(3), k; b.put(new T.SphereGeometry(0.33, 12, 10), 0, -0.6, 0, { sy: 1.25, col: [0.6, 0.48, 0.45] }); for (k = 0; k < 70; k++) { var a = r() * 6.28, h = -0.6 + (r() - 0.5) * 0.8, rr = 0.36 * Math.sqrt(Math.max(0.05, 1 - Math.pow((h + 0.6) / 0.5, 2))); b.put(new T.SphereGeometry(1, 6, 4), Math.cos(a) * rr, h, Math.sin(a) * rr, { sx: 0.05, sy: 0.016, sz: 0.016, ry: r() * 6, rz: r() - 0.5, col: k % 9 ? [0.8, 0.64, 0.6] : [0.78, 0.82, 0.86] }); } }, SB.M.pla);
  bag.add(inner);
  knot = SB.mk(function (b) { b.put(new T.TorusGeometry(0.06, 0.025, 6, 12), 0, 0, 0, { rx: PI / 2 }); b.put(new T.CylinderGeometry(0.02, 0.02, 0.18, 6), 0, -0.1, 0, {}); }, SB.M.rope); knot.position.y = -1.1; bag.add(knot);
  ropeA = SB.fx.rope(0.012); ropeB = SB.fx.rope(0.014); H.bagPos = bag.position;
  drumTop.set(SB.boat.winchAt.drum.x, SB.boat.winchAt.drum.y + 0.19, SB.boat.winchAt.drum.z);
  /* 손잡이: 그물 올리기 */
  SB.boat.addInter({ id: 'winch', box: [3.9, D + 0.7, 1.15, 4.35, D + 1.4, 1.6], name: function () { return SB.L('양망기', 'Net Winch'); }, ok: function () { return SB.G.mode === 'day'; }, use: H.use });
  /* 그물 끝 매듭: 선별대 위에 걸렸을 때 */
  SB.boat.addInter({ id: 'bag', box: [0.95, D + 1.1, 0.05, 1.95, D + 2.5, 0.95], name: function () { return SB.L('그물', 'Net'); }, ok: function () { return H.phase === 'ready'; }, use: H.dump });
  H.reset();
};
H.reset = function () { H.phase = 'idle'; H.prog = 0; H.dmg = 0; boomK = 0; bag.visible = false; ropeB.visible = false; place(0); };
function place(dt) {
  tmpD.copy(OUT).lerp(IN, SB.ease(boomK)).normalize(); I.boom.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tmpD);
  tip.copy(piv).addScaledVector(tmpD, I.boomLen - 0.05);
  SB.fx.setRope(ropeA, drumTop, tip);
  var sway = Math.sin(SB.boat.motion.t * 1.3) * 0.08 * (1 + SB.sea.storm), y;
  if (H.phase === 'idle' || H.phase === 'haul' || H.phase === 'torn') y = SB.lerp(-2.6, tip.y - 0.75, H.prog);
  else y = tip.y - 0.75;
  bag.position.set(tip.x + sway * (H.phase === 'haul' ? 1 : 0.4), y, tip.z + sway * 0.6);
  bag.rotation.z = sway * 0.6;
  var top = tmpD.set(bag.position.x, bag.position.y + 0.05, bag.position.z); SB.fx.setRope(ropeB, top, tip); ropeB.visible = true;
}
H.need = function () { var t = SB.taskOf('net'); return t && t.done < t.n; };
H.use = function () {
  if (SB.G.carry) { SB.ui.nope(); return; }
  if (H.phase === 'ready') { SB.ui.nope(); return; }
  if (H.phase === 'sort' || H.phase === 'full' || H.phase === 'torn') { SB.ui.nope('net'); return; }
  if (!H.need()) { SB.cap.say('rest'); return; }
  if (H.phase === 'idle') { H.phase = 'haul'; H.prog = 0; H.dmg = 0; H.strain = 0; H.tension = 0.3; bag.visible = true; inner.visible = true; inner.scale.setScalar(1); SB.snd('lever'); }
  SB.station.enter(ST, { down: function () { H.hold = true; }, up: function () { H.hold = false; }, exit: function () { H.hold = false; SB.ui.gauge(false); SND.loop('winch', 0); }, update: haulUpdate });
  SB.ui.gauge(true, H.tension, H.prog);
};
var _kn = new T.Vector3();
function haulUpdate(dt) {
  _kn.set(0, 0.32, 0).applyEuler(I.lever.rotation).add(I.lever.position);                    // 두 손으로 손잡이를 쥐고 당긴다
  SB.hero.R = { p: _kn.clone().add(new T.Vector3(-0.02, 0.0, 0)), palm: new T.Vector3(0, -1, 0.3).normalize(), g: 1 };
  SB.hero.L = { p: _kn.clone().add(new T.Vector3(0.02, -0.09, 0)), palm: new T.Vector3(0, -0.6, 1).normalize(), g: 1 };
  if (H.phase !== 'haul') return;
  var storm = SB.sea.storm, sp = 1.25 + storm * 0.7;
  H.wave += dt * sp;
  var base = 0.38 + 0.24 * Math.sin(H.wave) + 0.12 * Math.sin(H.wave * 2.37 + 1.3) + storm * 0.1 * Math.sin(H.wave * 5.1);
  var target = base + (H.hold ? 0.34 : -0.08);
  H.tension += (target - H.tension) * Math.min(1, dt * 6);
  I.lever.rotation.x += ((H.hold ? -0.6 : 0) - I.lever.rotation.x) * Math.min(1, dt * 12);
  if (H.hold) {
    H.prog = Math.min(1, H.prog + dt * 0.058); I.drum.rotation.x -= dt * 7; I.drumRope.rotation.x -= dt * 7;
    if (H.tension > 0.82) {                          // 빨간 칸에서 감으면 그물이 터져 나간다: 흔들림·삐걱·새우가 빠져 떨어짐, 1.2초쯤 버티면 찢어진다
      H.dmg = Math.min(1, H.dmg + dt * 0.5); H.strain = (H.strain || 0) + dt; H.tearT = 0.25; if (Math.random() < dt * 10) SB.snd('creak'); if (Math.random() < dt * 4) SB.fx.burst('drops', bag.position.x, bag.position.y + 0.3, bag.position.z, 6, 1.2, 1.5, 0.6); SB.ui.shake();
      if (Math.random() < dt * 9) spillOne();
      if (H.strain >= 1.2) { rip(); return; }
    }
  }
  if (!(H.hold && H.tension > 0.82)) H.strain = Math.max(0, (H.strain || 0) - dt * 1.5);   // 빨간 칸을 벗어나면 버팀이 풀린다(계속 눌러 버틸 때만 찢어진다)
  SND.loop('winch', H.hold ? (H.tension > 0.82 ? 1.25 : 1) : 0);
  H.tearT = Math.max(0, (H.tearT || 0) - dt); var jit = H.tearT > 0 ? 0.12 : 0; bag.rotation.x = (Math.random() - 0.5) * jit; inner.scale.setScalar(1 - H.dmg * 0.45);
  if (bag.position.y > 0 && Math.random() < dt * 30) SB.fx.emit('drops', bag.position.x + (Math.random() - 0.5) * 0.5, bag.position.y - 0.6 - Math.random() * 0.6, bag.position.z + (Math.random() - 0.5) * 0.5, 0, -0.5, 0, 0.8);
  if (H.prog > 0.4 && !H.surf) { H.surf = true; SB.snd('surf'); SB.fx.splash(bag.position.x, bag.position.z, true); }
  SB.ui.gauge(true, H.tension, H.prog);
  if (H.prog >= 1) {
    H.phase = 'swing'; H.hold = false; H.surf = false; SB.snd('clunk'); SB.station.leave(); SB.ui.praise('NICE');
    if (H.dmg > 0.4) SB.cap.say('tear'); else SB.cap.say('haul');
    SB.night.dropBuoy();
    SB.fx.anim(1.8, function (t) { boomK = t; }, function () { H.phase = 'ready'; SB.snd('creak'); });
  }
}
/* 빨간 칸에서 새우가 하나씩 빠져 바다로 떨어진다 */
function spillOne() {
  var m = SB.creatures.make(Math.random() < 0.8 ? 'shrimp' : SB.creatures.KINDS[Math.floor(Math.random() * SB.creatures.KINDS.length)]), grp = SB.boat.group, p0 = bag.position.clone(); p0.y -= 0.7 + Math.random() * 0.3; p0.x += (Math.random() - 0.5) * 0.4; p0.z += (Math.random() - 0.5) * 0.4;
  var vx = (Math.random() - 0.5) * 1.2, vz = (Math.random() - 0.5) * 1.2, spin = Math.random() * 8; m.position.copy(p0); grp.add(m);
  SB.fx.anim(0.9, function (t) { var tt = t * 0.9; m.position.set(p0.x + vx * tt, p0.y + 1.2 * tt - 4.9 * tt * tt, p0.z + vz * tt); m.rotation.set(spin * t, spin * t * 0.7, 0); }, function () { grp.remove(m); if (m.position.y < 0.2) SB.fx.splash(m.position.x, m.position.z, false); });
}
/* 그물이 찢어졌다: 잡은 것이 다 쏟아지고 그물은 다시 바다로. 처음부터 다시 감아야 한다 */
function rip() {
  H.hold = false; H.phase = 'torn'; SND.loop('winch', 0); SB.snd('rip'); SB.snd('splash'); SB.ui.flash(); SB.ui.shake(); SB.station.leave();
  for (var k = 0; k < 14; k++) setTimeout(spillOne, k * 40);
  SB.fx.burst('drops', bag.position.x, bag.position.y - 0.5, bag.position.z, 30, 2, 2, 0.8); SB.fx.splash(bag.position.x, bag.position.z, true);
  inner.visible = false; SB.cap.mood = Math.max(-3, (SB.cap.mood || 0) - 1);
  SB.G.busy = true; setTimeout(function () { SB.cap.punish(function () { SB.G.busy = false; }); }, 500); setTimeout(function () { SB.G.busy = false; }, 9000);   // 선장이 뛰어와 때린다. 그동안 못 움직인다
  var p0 = H.prog;
  SB.fx.anim(1.6, function (t) { H.prog = p0 * (1 - t); }, function () { H.phase = 'idle'; H.prog = 0; H.dmg = 0; H.surf = false; inner.visible = true; inner.scale.setScalar(1); bag.visible = H.need(); });
  H.strain = 0;
}
H.dump = function () {                             // 매듭을 당기면 잡은 것이 선별대에 쏟아진다
  if (H.phase !== 'ready') return;
  H.phase = 'sort'; SB.snd('dump');
  SB.fx.anim(0.7, function (t) { inner.scale.setScalar(1 - t * 0.9); inner.position.y = -t * 0.5; knot.rotation.z = t * 2; }, function () { inner.visible = false; knot.rotation.z = 0; inner.position.y = 0; });
  SB.sort.spill(bag.position.x, bag.position.y - 0.9, bag.position.z, 1 - H.dmg * 0.55);
  setTimeout(function () { if (SB.G.mode === 'day' && !SB.station.cur) SB.sort.enter(); }, 450);
};
/* 정리가 끝나면 붐을 내보내고 다음 그물을 바다에 넣는다 */
H.lower = function () {
  SB.fx.anim(1.6, function (t) { boomK = 1 - t; }, function () { H.phase = 'idle'; H.prog = 0; bag.visible = H.need(); });
};
H.update = function (dt) { place(dt); };
H.station = ST;
})();
