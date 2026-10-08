/* 새우잡이배 — 새우 고르기: 선별대 위의 것을 집어 왼쪽 바구니로(새우), 앞쪽 바다로(잡것) 던진다. 눌렀다 떼면 주머니로(열쇠·나침반), 아귀는 입을 벌린다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, S = SB.sort = { items: [], good: 0, mist: 0 }, CR = SB.creatures, tb, grp, basket, pile, held = null, hist = [], _v = new T.Vector3(), _w = new T.Vector3();
var ST = { cam: [1.6, D + 2.3, -0.95], look: [1.4, D + 0.72, 0.55], at: [1.45, -0.5, 0], hands: 'free' };   // 3인칭: 주인공 등 뒤 위에서 선별대를 본다
S.init = function () {
  grp = SB.boat.group; tb = SB.boat.table;
  var ba = SB.boat.basketAt; basket = new T.Group(); basket.position.set(ba.x, ba.y, ba.z); grp.add(basket);
  var bm = new T.Mesh(new T.CylinderGeometry(0.26, 0.21, 0.3, 20, 1, true), SB.M.basketB); bm.position.y = 0.15; bm.castShadow = true; basket.add(bm);
  var bb = new T.Mesh(new T.CircleGeometry(0.21, 20), new T.MeshLambertMaterial({ color: 0x1f56a8 })); bb.rotation.x = -PI / 2; bb.position.y = 0.01; basket.add(bb);
  pile = new T.Group(); basket.add(pile);                                                   // 바구니 속 새우: 들어간 새우를 그 모양 그대로 쌓는다
  SB.boat.addInter({ id: 'table', box: [tb.x0, tb.y - 0.1, tb.z0, tb.x1, tb.y + 0.3, tb.z1], name: function () { return SB.L('선별대', 'Sorting Table'); }, ok: function () { return SB.haul.phase === 'sort'; }, use: S.enter });
  SB.boat.addInter({ id: 'basket', box: [ba.x - 0.28, ba.y, ba.z - 0.28, ba.x + 0.28, ba.y + 0.32, ba.z + 0.28], name: function () { return SB.L('새우 바구니', 'Shrimp Basket'); }, ok: function () { return SB.haul.phase === 'full' && !SB.G.carry; }, use: function () { basket.visible = false; SB.carry('basket'); SB.hero.heldMesh('basket').add(pile); pile.position.y = -0.12; SB.snd('lift'); } });
  SB.boat.addInter({ id: 'hold', box: [-1.3, D, -0.6, -0.1, D + 0.35, 0.6], name: function () { return SB.L('어창', 'Fish Hold'); }, ok: function () { return SB.G.carry === 'basket'; }, use: S.toHold });
};
function setFill() { if (S.good === 0) { while (pile.children.length) pile.remove(pile.children[0]); } }
function toPile(it) {                                // 바닥부터 한 켜에 9마리쯤, 둘레 안쪽에 아무렇게나 눕힌다
  var n = pile.children.length, a = Math.random() * PI * 2, r = 0.12 * Math.sqrt(Math.random()), lay = Math.floor(n / 8);
  grp.remove(it.m); var m = CR.make(it.k); m.position.set(Math.cos(a) * r, 0.025 + lay * 0.022 + Math.random() * 0.01, Math.sin(a) * r); m.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * PI * 2, (Math.random() - 0.5) * 0.5); m.scale.setScalar(1); m.visible = true; pile.add(m);
  if (pile.children.length > 70) pile.remove(pile.children[0]);
}
S.reset = function () { S.items.forEach(function (it) { grp.remove(it.m); }); S.items = []; S.good = 0; S.mist = 0; S.total = 0; basket.add(pile); pile.position.y = 0; basket.visible = true; setFill(); };
S.spill = function (x, y, z, q) {                    // q: 그물 성한 정도(0~1). 찢기면 덜 담긴다
  S.reset();
  var G = SB.G, ns = Math.round((22 + G.day * 1.1 + Math.random() * 8) * q), nb = 5 + Math.floor(G.day / 3) + Math.floor(Math.random() * 3), list = [], i;
  for (i = 0; i < ns; i++) list.push('shrimp');
  for (i = 0; i < nb; i++) list.push(CR.KINDS[Math.floor(Math.random() * CR.KINDS.length)]);
  /* 10/8 사장님 "3일동안 뗏목재료가 안나옴": 열쇠·나침반은 한 번 놓치면 다시 안 나와 밧줄 둘·나침반을 영영 못 얻었다 → 손에 넣을 때까지 매일 나온다 */
  if (G.day >= 3 && !G.inv.key && !G.flags.chest) list.push('monk');
  if (G.day >= 12 && !G.inv.compass && !G.parts.compass) list.push('compass');
  S.total = ns;
  list.forEach(function (k, j) {
    var m = CR.make(k); grp.add(m);
    var it = { k: k, m: m, p: new T.Vector3(x + (Math.random() - 0.5) * 0.3, y + Math.random() * 0.3, z + (Math.random() - 0.5) * 0.3), v: new T.Vector3((Math.random() - 0.5) * 3.2, -0.5 - Math.random(), (Math.random() - 0.5) * 1.8), ry: Math.random() * 6.28, st: 'table', hop: 1 + Math.random() * 3, wob: 0, delay: j * 0.012 };
    m.position.copy(it.p); m.visible = false; S.items.push(it);
  });
  if (list.indexOf('compass') >= 0) G.flags.compassSeen = true;
};
S.enter = function () {
  if (SB.haul.phase !== 'sort') return; hx = 1.45;
  SB.station.enter(ST, { down: down, up: up, update: update, exit: function () { if (held) { held.st = 'table'; held = null; } } });
};
function sx(p) { _w.copy(p); grp.localToWorld(_w); _w.project(SB.cam); return _w; }
function down() {                                  // 손끝(가리킨 자리) 가까운 것 하나. 손가락 크기만큼 넉넉하게
  if (held) { held.st = 'table'; held = null; }
  var best = null, bd = 1e9, i;
  for (i = 0; i < S.items.length; i++) { var it = S.items[i]; if (it.st !== 'table') continue; var s = sx(it.p), r = Math.max(0.05, CR.size[it.k] * 0.55), d = Math.hypot((s.x - SB.ptr.x) * SB.aspect, s.y - SB.ptr.y) - r * 0.4; if (d < 0.14 && d < bd) { bd = d; best = it; } }
  if (!best) return;
  held = best; held.st = 'held'; held.t0 = performance.now(); held.moved = 0; held.off = null; hist = [{ t: performance.now(), x: SB.ptr.x, y: SB.ptr.y }];
}
function up() {
  if (!held) return;
  var it = held; held = null; var now = performance.now(), a = hist[0], i;
  for (i = hist.length - 1; i >= 0; i--) if (now - hist[i].t > 130) { a = hist[i]; break; }
  var dt = Math.max(0.03, (now - a.t) / 1000), vx = (SB.ptr.x - a.x) * SB.aspect / dt, vy = (SB.ptr.y - a.y) / dt;
  var bs = sx(_v.set(SB.boat.basketAt.x, SB.boat.basketAt.y + 0.2, SB.boat.basketAt.z)), bx = bs.x, by = bs.y, overB = Math.hypot((SB.ptr.x - bx) * SB.aspect, SB.ptr.y - by) < 0.16;
  if (it.moved < 0.045 && now - it.t0 < 600) return click(it);
  var r = SB.ptrLocal, ba = SB.boat.basketAt, ov = null;                                   // 놓은 자리(배 안 좌표): 바구니 둘레 위거나 선별대 밖 바구니 쪽이면 바구니, 선별대 너머면 바다
  if (r && Math.abs(r.direction.y) > 1e-4) { var t1 = (ba.y + 0.3 - r.origin.y) / r.direction.y; if (t1 > 0) ov = { x: r.origin.x + r.direction.x * t1, z: r.origin.z + r.direction.z * t1 }; }
  if (ov && (Math.hypot(ov.x - ba.x, ov.z - ba.z) < 0.42 || (ov.x > tb.x1 + 0.05 && ov.z < tb.z1))) return fly(it, 'basket');
  if (ov && ov.z > tb.z1 + 0.05) return fly(it, 'sea');
  var s0 = hist[0], ux = (bx - s0.x) * SB.aspect, uy = by - s0.y, ul = Math.hypot(ux, uy) || 1, sp = Math.hypot(vx, vy);   // 집은 자리에서 바구니 쪽으로 던졌나
  var toB = overB || (sp > 1.1 && (vx * ux + vy * uy) / (sp * ul) > 0.6);
  if (toB) return fly(it, 'basket');
  if (vy > 1.1 && vy > Math.abs(vx) * 0.6) return fly(it, 'sea');
  it.st = 'table'; it.v.set(0, 0, 0);
}
function click(it) {
  var G = SB.G;
  if (it.k === 'monk' && !it.open) { it.open = true; SB.snd('chomp'); SB.fx.burst('spark', it.p.x, it.p.y + 0.08, it.p.z, 8, 0.5, 0.6, 0.5); var k = add('key', it.p.x + 0.12, it.p.y + 0.15, it.p.z); k.v.set(0.6, 1.2, -0.3); G.flags.monk = true; it.st = 'table'; return; }
  if (it.k === 'key') { it.st = 'gone'; grp.remove(it.m); G.inv.key = true; SB.snd('pocket'); SB.ui.toast(SB.L('열쇠', 'Key'), true); SB.save(); return check(); }
  if (it.k === 'compass') { it.st = 'gone'; grp.remove(it.m); G.inv.compass = true; SB.snd('pocket'); SB.ui.toast(SB.L('나침반', 'Compass'), true); SB.save(); return check(); }
  it.st = 'table'; it.v.set((Math.random() - 0.5) * 0.4, 0.9, (Math.random() - 0.5) * 0.4); SB.snd('flop');
}
function add(k, x, y, z) { var m = CR.make(k); grp.add(m); var it = { k: k, m: m, p: new T.Vector3(x, y, z), v: new T.Vector3(), ry: 0, st: 'table', hop: 9, wob: 0, delay: 0 }; S.items.push(it); return it; }
function fly(it, dest) {
  if (dest === 'sea' && it.k === 'monk' && !it.open && !SB.G.inv.key) return click(it);                    // 버리려 하면 입이 벌어지며 열쇠가 튀어나온다
  if (dest === 'sea' && (it.k === 'key' || it.k === 'compass')) { it.st = 'table'; it.v.set(0, 1, -0.5); SB.snd('nope'); return; }
  var to = dest === 'basket' ? new T.Vector3(SB.boat.basketAt.x + (Math.random() - 0.5) * 0.12, SB.boat.basketAt.y + 0.12, SB.boat.basketAt.z + (Math.random() - 0.5) * 0.12) : new T.Vector3(it.p.x + (Math.random() - 0.5) * 0.8, -0.1, 3.5 + Math.random() * 1.2);
  it.st = 'fly'; it.fly = { a: it.p.clone(), b: to, t: 0, d: dest === 'basket' ? 0.32 : 0.62, h: dest === 'basket' ? 0.35 : 1.0, dest: dest }; if (!(dest === 'basket' && it.k === 'shrimp')) SB.snd('whoosh');   // 새우를 바구니로는 소리 없이, 들어갈 때 뿅만
}
function land(it) {
  var dest = it.fly.dest, G = SB.G;
  if (dest === 'basket') {
    if (it.k === 'shrimp') { it.st = 'gone'; toPile(it); S.good++; G.dayGood = (G.dayGood || 0) + 1; setFill(); SB.snd('pyong'); SB.fx.burst('drops', it.p.x, it.p.y, it.p.z, 4, 0.6, 1, 0.4); if (S.good % 10 === 0) SB.ui.praise('NICE'); }
    else { it.st = 'table'; it.p.copy(it.fly.b); it.v.set(-1.2, 1.6, 0.1); S.mist++; SB.snd('nope'); SB.cap.say('junk'); }
  } else {
    it.st = 'gone'; grp.remove(it.m); SB.fx.splash(it.p.x, it.p.z, false); SB.snd('splashS');
    if (it.k === 'shrimp') { S.mist++; SB.cap.say('waste'); }
  }
  check();
}
function check() {
  for (var i = 0; i < S.items.length; i++) if (S.items[i].st !== 'gone') return;
  SB.haul.phase = 'full'; S.items = []; SB.station.leave(); SB.ui.praise(S.mist === 0 ? 'PERFECT' : 'GREAT'); SB.snd(S.mist === 0 ? 'perfect' : 'great');
  SB.work.spawnStains(2 + Math.floor(Math.random() * 2)); SB.ui.tasks();
}
S.toHold = function () {
  var I = SB.boat.I; SB.carry(null); SB.snd('hatch');
  SB.fx.anim(0.35, function (t) { I.lid.rotation.z = t * 1.9; }, function () {
    SB.snd('pour'); SB.fx.burst('drops', -0.7, D + 0.3, 0, 20, 0.8, 1.2, 0.6); I.holdIce.visible = true;
    setTimeout(function () { SB.fx.anim(0.4, function (t) { I.lid.rotation.z = 1.9 * (1 - t); }, function () { SB.snd('clang'); }); }, 500);
  });
  basket.add(pile); pile.position.y = 0; basket.visible = true; S.good = 0; setFill();
  var t = SB.taskOf('net'); t.done++; SB.ui.praise(t.done >= t.n ? 'CLEAR' : 'NICE'); SB.taskProgress();
  SB.haul.lower();
};
var hov = new T.Vector3(), hx = 1.45;
function update(dt) {
  /* 주인공: 가리킨 쪽으로 선별대를 따라 옆걸음, 오른손은 가리킨 자리(쥔 것), 왼손은 선별대 모서리 */
  var r0 = SB.ptrLocal; if (r0 && Math.abs(r0.direction.y) > 1e-4) { var t0 = (tb.y + 0.03 - r0.origin.y) / r0.direction.y; if (t0 > 0) hov.set(r0.origin.x + r0.direction.x * t0, tb.y + 0.03, r0.origin.z + r0.direction.z * t0); }
  var want = SB.clamp(held ? held.p.x : hov.x, tb.x0 + 0.35, tb.x1 - 0.25), nx = hx + SB.clamp(want - hx, -dt * 1.6, dt * 1.6); SB.station.sp = Math.abs(nx - hx) / Math.max(dt, 1e-4); hx = nx; SB.G.P.x = hx;
  var hp = held ? held.p : hov;
  SB.hero.R = { p: new T.Vector3(hp.x, Math.max(hp.y, tb.y + 0.03) + 0.02, hp.z), palm: new T.Vector3(0, -1, 0), g: held ? 1 : SB.ptr.down ? 0.7 : 0.25 };
  SB.hero.L = { p: new T.Vector3(hx + 0.28, tb.y + 0.02, tb.z0 + 0.1), palm: new T.Vector3(0, -1, 0), g: 0.2 };
  if (held) {
    var r = SB.ptrLocal; if (r && Math.abs(r.direction.y) > 1e-4) { var tt = (tb.y + 0.16 - r.origin.y) / r.direction.y; if (tt > 0) { var nx = r.origin.x + r.direction.x * tt, nz = r.origin.z + r.direction.z * tt;
      if (!held.off) held.off = { x: held.p.x - nx, z: held.p.z - nz };                       // 집은 자리에서 튀지 않게: 처음 어긋남을 천천히 줄인다
      held.off.x *= 0.85; held.off.z *= 0.85; held.p.set(nx + held.off.x, SB.lerp(held.p.y, tb.y + 0.16, 0.3), nz + held.off.z); } }
    var h0 = hist[0]; held.moved = Math.max(held.moved, Math.hypot((SB.ptr.x - h0.x) * SB.aspect, SB.ptr.y - h0.y));          // 화면 위 손가락 이동
    hist.push({ t: performance.now(), x: SB.ptr.x, y: SB.ptr.y }); if (hist.length > 30) hist.shift();
  }
}
S.update = function (dt) {
  for (var i = 0; i < S.items.length; i++) {
    var it = S.items[i], m = it.m;
    if (it.delay > 0) { it.delay -= dt; continue; } m.visible = it.st !== 'gone';
    if (it.st === 'table') {
      it.v.y -= 9.8 * dt; it.p.addScaledVector(it.v, dt);
      var floor = tb.y + 0.004;
      if (it.p.x < tb.x0 + 0.05) { it.p.x = tb.x0 + 0.05; it.v.x *= -0.4; } if (it.p.x > tb.x1 - 0.05) { it.p.x = tb.x1 - 0.05; it.v.x *= -0.4; }
      if (it.p.z < tb.z0 + 0.05) { it.p.z = tb.z0 + 0.05; it.v.z *= -0.4; } if (it.p.z > tb.z1 - 0.05) { it.p.z = tb.z1 - 0.05; it.v.z *= -0.4; }
      if (it.p.y < floor) { if (it.v.y < -1.2 && it.k !== 'shrimp') SB.snd('slap'); it.p.y = floor; it.v.y = Math.abs(it.v.y) > 0.6 ? -it.v.y * 0.25 : 0; it.v.x *= 0.82; it.v.z *= 0.82; }
      it.wob *= 0.9;
      var live = it.k === 'shrimp' || it.k === 'fish' || it.k === 'crab' || it.k === 'squid' || it.k === 'monk';
      if (live) { it.hop -= dt; if (it.hop < 0) { it.hop = 1.2 + Math.random() * (it.k === 'shrimp' ? 2.5 : 5); if (it.p.y <= floor + 0.001) { it.v.set((Math.random() - 0.5) * 0.7, it.k === 'shrimp' ? 1.3 : 0.8, (Math.random() - 0.5) * 0.7); it.wob = 1; it.ry += (Math.random() - 0.5) * 2; } } }
      m.position.copy(it.p); m.rotation.set(0, it.ry, Math.sin(SB.boat.motion.t * 30 + i) * 0.4 * it.wob);
      if (it.k === 'monk' && it.open) m.scale.set(1, 1.4, 1);
    } else if (it.st === 'held') { m.position.copy(it.p); m.rotation.set(Math.sin(performance.now() / 60) * 0.3, it.ry, 0.4); }
    else if (it.st === 'fly') {
      var f = it.fly; f.t += dt / f.d; var t = Math.min(1, f.t);
      it.p.lerpVectors(f.a, f.b, t); it.p.y += Math.sin(t * PI) * f.h; m.position.copy(it.p); m.rotation.set(t * 8, it.ry, t * 5);
      if (t >= 1) land(it);
    }
  }
};
S.station = ST;
})();
