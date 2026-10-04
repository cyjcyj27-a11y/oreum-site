/* 새우잡이배 — 선장 영감(모자는 10/4 사장님 "모자빼라"로 뺌). 낮엔 조타실(키 앞)과 선별대 옆을 오가며 잔소리, 밤엔 침상에서 코를 골다 시끄러우면 깨서 손전등을 들고 갑판을 돈다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, C = SB.cap = { st: 'helm', mood: 0, ready: false }, grp, root, model, mixer, acts = {}, cur = null, light, beam, hat, path = [], pi = 0, speed = 1.2, face = 0, yaw = 0, sayT = 0, lastSay = {}, napT = 0;
var N = { A: [-5.9, -0.2], B: [-4.6, 0.55], C: [-3.5, 0.92], E: [-2.55, 0.9], H: [-4.3, -1.0], W1: [0.0, -1.45], P1: [0.3, -1.8], P2: [3.0, -1.6], P3: [4.6, -0.4], P4: [6.15, -0.35], P5: [4.8, 0.6], P6: [1.6, 1.8], P7: [-1.0, 1.7] };
var LINES = {
  morning: ['일어나! 해 뜨기 전에 그물 올려야지!', 'Up! Haul the nets before sunrise!'], haul: ['그렇지!', 'That\'s it!'], tear: ['그물 찢어진다, 이놈아!', 'You\'re tearing my net!'],
  junk: ['잡것 넣지 마!', 'No junk in there!'], waste: ['새우를 왜 버려!', 'Why are you tossing shrimp?!'], lazy: ['빨리빨리 안 해?', 'Faster! Faster!'], rest: ['오늘 그물은 끝났다.', 'No more nets today.'],
  eat_good: ['음, 라면은 잘 끓이네.', 'Hm. Good ramen.'], eat_bad: ['퉤! 이걸 라면이라고!', 'Bleh! You call this ramen?!'], done: ['됐다, 들어가 자라.', 'Done. Go to bed.'],
  who: ['누구야!', 'Who\'s there?!'], caught: ['이놈 봐라? 어디서 도망을!', 'Trying to run, huh?!'], back: ['쥐새끼였나.', 'Must\'ve been a rat.'], go_sleep: ['뭐 해? 들어가 자!', 'What are you doing? Bed!'],
  rip: ['그물을 찢어?! 이 망할 놈이!', 'You tore my net?! You useless brat!'], rip2: ['다시 내려! 처음부터 감아!', 'Drop it again! Haul it from the top!'],
  touch: ['그거 건드리지 마!', 'Hands off that!'], late: ['아직도 안 끝났어?!', 'Still not done?!'], laugh: ['허허허!', 'Ha ha ha!'], deck: ['갑판도 닦아!', 'Scrub the deck too!']
};
C.LINES = LINES;
C.init = function (boatGroup) {
  grp = boatGroup; root = new T.Group(); grp.add(root);
  light = new T.SpotLight(0xfff2d0, 0, 14, 0.36, 0.45, 1.2); light.position.set(0.25, 1.25, 0.25); root.add(light); light.target.position.set(0.25, 0.4, 5); root.add(light.target);
  var gc = SB.cvs(4, 128), gx = gc.getContext('2d'), gg = gx.createLinearGradient(0, 0, 0, 128); gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(0.5, 'rgba(255,255,255,.35)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); gx.fillStyle = gg; gx.fillRect(0, 0, 4, 128);
  var bm = new T.MeshBasicMaterial({ color: 0xfff2c0, map: new T.CanvasTexture(gc), transparent: true, opacity: 0.0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
  var cg = new T.ConeGeometry(0.85, 6, 20, 1, true); cg.translate(0, -3.5, 0); cg.rotateX(-PI / 2 + 0.12); beam = new T.Mesh(cg, bm); beam.position.copy(light.position); root.add(beam);
  load();
};
function load() {
  if (!window.GLTFLoaderClass) return;
  var L = new window.GLTFLoaderClass(), done = function (g) {
    model = g.scene; model.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (o.material) o.material.side = T.FrontSide; } if (o.isBone && /(^|:)head$/i.test(o.name)) C.head = o; });
    root.add(model); mixer = new T.AnimationMixer(model);
    g.animations.forEach(function (a) { acts[a.name.toLowerCase()] = mixer.clipAction(a); });
    play('idle'); C.ready = true; C.place(C.st);
  };
  if (location.protocol === 'file:' ) {
    var sc = document.createElement('script'); sc.src = 'assets/models/captain.glb.js';
    sc.onload = function () { var b = atob(window.GLBJS['captain.glb']), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); L.parse(u.buffer, '', done, function (e) { console.warn(e); }); };
    document.head.appendChild(sc);
  } else L.load('assets/models/captain.glb', done, null, function (e) { console.warn(e); });
}
function play(n) {
  var a = acts[n] || acts[n === 'run' ? 'walk' : 'idle']; if (!a || a === cur) return;
  a.reset().play(); if (cur) a.crossFadeFrom(cur, 0.25, false); cur = a;
}
C.pos = function () { return root.position; };
C.place = function (st) {                              // 바로 그 자리에 둔다
  C.st = st; path = []; pun = null; root.rotation.set(0, 0, 0); root.position.y = D; if (hat) hat.visible = true;
  if (st === 'helm') { root.position.set(N.H[0], D, N.H[1]); yaw = PI / 2; }
  else if (st === 'watch') { root.position.set(N.W1[0], D, N.W1[1]); yaw = 0; }
  else if (st === 'sleep') { root.position.set(-6.35, D + 0.5, -1.05); root.rotation.set(0, PI / 2, 0); yaw = -PI / 2; }
  else if (st === 'gone') { root.position.set(0, -50, 0); }
  if (st === 'sleep') { root.rotation.order = 'YXZ'; root.rotation.y = -PI / 2; root.rotation.x = -PI / 2; }
  else root.rotation.y = yaw;
  light.intensity = 0; beam.material.opacity = 0; play('idle');
};
C.at = function (x, z, ya) { C.st = 'stage'; path = []; root.rotation.set(0, ya, 0); root.position.set(x, D, z); yaw = ya; light.intensity = 0; beam.material.opacity = 0; play('idle'); };
C.goTo = function (names, st, spd) { path = names.map(function (n) { return N[n]; }); pi = 0; C.st = st; speed = spd || 1.2; root.rotation.x = 0; root.position.y = D; play('walk'); };
C.say = function (k) {
  var now = performance.now(); if (lastSay[k] && now - lastSay[k] < 6000) return; lastSay[k] = now;
  var l = LINES[k]; if (!l) return; SB.ui.bubble(SB.EN ? l[1] : l[0]); SND.voice(SB.EN ? k + '_en' : k); sayT = 2.6;
};
/* 그물을 찢었다: 선장이 뛰어와 따귀 두 대(사장님 10/4 "그물 찢어지면 선장이 난리쳐야 되는데, 선장한테 맞는 거로 하자") */
var pun = null, arm = null, _ht = new T.Vector3(), _po = new T.Vector3();
C.punish = function (done) {
  if (!C.ready) { if (done) done(); return; }
  var G = SB.G, fx = Math.sin(G.P.face), fz = Math.cos(G.P.face), tx = G.P.x - fx * 0.15 + fz * 0.72, tz = G.P.z - fz * 0.15 - fx * 0.72;   // 주인공 왼쪽 옆
  var way = [];
  if (root.position.x < -1) way.push(N.B, N.C, N.E, N.W1);
  if (tx > 2.4 && root.position.x < 2.6) way.push([3.0, -1.0]);
  way.push([tx, tz]);
  path = way; pi = 0; C.st = 'punish'; speed = 3.4; play('run'); root.rotation.x = 0; root.position.y = D;
  C.say('rip'); SB.snd('horn');
  pun = { t: 0, ph: 'run', done: done, hits: 0 };
};
function slapArm(k, side) {                          // k 0 들어 올림 ~ 1 휘두름 끝. 오른손이 주인공 뺨을 지나간다
  if (!arm) { arm = { sh: model.getObjectByName('RightArm'), el: model.getObjectByName('RightForeArm'), wr: model.getObjectByName('RightHand') }; }
  if (!arm.sh || !arm.el || !arm.wr) return;
  var G = SB.G; root.updateMatrixWorld(true);
  var hx = G.P.x, hz = G.P.z, rx = Math.cos(yaw), rz = -Math.sin(yaw);             // 선장의 오른쪽(세계 xz)
  var fxx = Math.sin(yaw), fzz = Math.cos(yaw), e = k * k * (3 - 2 * k), sw = SB.lerp(0.62, -0.32, e), fw = SB.lerp(-0.05, 0.5, e) + 0.2 * Math.sin(e * PI);   // 옆뒤로 높이 들었다가 앞을 가로질러 휘두른다
  _ht.set(root.position.x + fxx * fw - rx * sw, D + 1.78 - 0.3 * e, root.position.z + fzz * fw - rz * sw); grp.localToWorld(_ht);
  _po.set(-rx, -0.6, -rz).transformDirection(grp.matrixWorld);
  SB.twoBone(arm.sh, arm.el, arm.wr, _ht, _po);
}
function cineOn() {                                 // 두 사람을 옆에서: 가운데를 보고, 갑판 안쪽에서
  var G = SB.G, mx = (G.P.x + root.position.x) / 2, mz = (G.P.z + root.position.z) / 2, dx = G.P.x - root.position.x, dz = G.P.z - root.position.z, l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l;
  if (Math.abs(mz + pz * 2) > Math.abs(mz - pz * 2)) { px = -px; pz = -pz; }
  SB.cine(new T.Vector3(mx + px * 2.1 - dx / l * 0.3, D + 1.65, mz + pz * 2.1 - dz / l * 0.3), new T.Vector3(mx, D + 1.35, mz));
}
function punUpdate(dt) {
  var G = SB.G; pun.t += dt;
  if (pun.ph === 'run') { if (!path.length) { pun.ph = 'face'; pun.t = 0; play('idle'); cineOn(); } return; }
  var dx = G.P.x - root.position.x, dz = G.P.z - root.position.z, w = Math.atan2(dx, dz); yaw += Math.atan2(Math.sin(w - yaw), Math.cos(w - yaw)) * Math.min(1, dt * 10); root.rotation.y = yaw;
  if (pun.ph === 'face') { G.P.face += Math.atan2(Math.sin(Math.atan2(-dx, -dz) - G.P.face), Math.cos(Math.atan2(-dx, -dz) - G.P.face)) * Math.min(1, dt * 8); if (pun.t > 0.35) { pun.ph = 'slap'; pun.t = 0; } return; }
  if (pun.ph === 'slap') {
    var k = pun.t < 0.35 ? 0 : SB.clamp((pun.t - 0.35) / 0.12, 0, 1); slapArm(k);
    if (k >= 0.55 && !pun.hit) { pun.hit = true; pun.hits++; SB.snd('slap'); SB.snd('hit'); SB.ui.flash(); SB.camShake(0.35); SB.hero.knock(dx, dz, pun.hits === 1 ? -0.55 : 0.55); }
    if (pun.t > 0.85) { pun.hit = false; pun.t = 0; if (pun.hits >= 2) { pun.ph = 'yell'; C.say('rip2'); } }
    return;
  }
  if (pun.ph === 'yell' && pun.t > 1.4) {
    var cb = pun.done; pun = null; SB.cine(null); path = root.position.x > 2.4 ? [[3.0, -1.0], N.W1] : [N.W1]; pi = 0; C.st = 'watch'; speed = 1.2; play('walk'); if (cb) cb();   // 선별대를 돌아 제자리로
  }
}
C.eat = function (g) { C.say(g === 'BAD' ? 'eat_bad' : 'eat_good'); C.mood += g === 'PERFECT' ? 1 : g === 'GOOD' ? 0.5 : -0.5; };
var serve;
C.initInter = function () {
  serve = SB.boat.addInter({ id: 'captain', box: [0, 0, 0, 0, 0, 0], name: function () { return SB.L('선장', 'Captain'); }, ok: function () { return SB.G.mode === 'day' && SB.G.carry === 'pot'; }, use: function () { SB.work.serve(); } });
};
C.wake = function () {                                  // 밤: 깨서 손전등 순찰
  if (C.st !== 'sleep') return;
  C.say('who'); SB.snd('creak');
  root.rotation.set(0, 0, 0); root.position.set(N.A[0], D, N.A[1]);
  C.goTo(['A', 'B', 'C', 'E', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'E', 'C', 'B', 'A'], 'patrol', 1.05);
  light.intensity = 26; beam.material.opacity = 0.16;
};
var _a = new T.Vector3(), _d = new T.Vector3(), _hp = new T.Vector3();
function sees(px, pz) {                                 // 손전등 빛 안에 있고 벽에 안 가리나
  var dx = px - root.position.x, dz = pz - root.position.z, dist = Math.hypot(dx, dz);
  if (dist < 1.1) return dist;
  if (dist > 9.5) return -1;
  var ang = Math.atan2(dx, dz), da = Math.atan2(Math.sin(ang - yaw), Math.cos(ang - yaw)); if (Math.abs(da) > 0.45) return -1;
  _a.set(root.position.x, D + 1.45, root.position.z); _d.set(dx / dist, 0, dz / dist);
  for (var i = 0; i < SB.boat.solids.length; i++) { var s = SB.boat.solids[i]; if (!s.wall) continue; var t = SB.boat.slab(_a, _d, [s.x0, s.y0, s.z0, s.x1, s.y1, s.z1], dist); if (t >= 0 && t < dist - 0.2) return -1; }
  return dist;
}
var _hw = new T.Vector3();
C.update = function (dt) {
  if (mixer) mixer.update(dt);
  if (hat && C.head && hat.parent === root) { root.updateMatrixWorld(true); C.head.getWorldPosition(_hw); root.worldToLocal(_hw); hat.position.set(_hw.x, _hw.y + 0.165, _hw.z - 0.012); hat.rotation.set(-0.06, 0, 0); }
  if (sayT > 0) { sayT -= dt; if (sayT <= 0) SB.ui.bubble(null); }
  if (serve) { var p = root.position; serve.box[0] = p.x - 0.4; serve.box[1] = D; serve.box[2] = p.z - 0.4; serve.box[3] = p.x + 0.4; serve.box[4] = D + 1.9; serve.box[5] = p.z + 0.4; }
  var G = SB.G;
  if (pun && C.st === 'punish' && pun.ph !== 'run') { punUpdate(dt); return; }
  if (pun && pun.ph === 'run' && !path.length) { punUpdate(dt); return; }
  if (path.length) {                                    // 길 따라 걷기
    var tg = path[pi], dx = tg[0] - root.position.x, dz = tg[1] - root.position.z, d = Math.hypot(dx, dz), step = speed * dt;
    var want = Math.atan2(dx, dz), dy = Math.atan2(Math.sin(want - yaw), Math.cos(want - yaw)); yaw += dy * Math.min(1, dt * 7); root.rotation.y = yaw;
    if (d <= step) { root.position.x = tg[0]; root.position.z = tg[1]; pi++; if (pi >= path.length) { path = []; arrive(); } }
    else { root.position.x += dx / d * step; root.position.z += dz / d * step; }
    if (C.st === 'patrol' && Math.random() < dt * 2.5) SB.snd('stepC');
  } else if (C.st === 'watch' && G.mode === 'day') {
    var pdx = G.P.x - root.position.x, pdz = G.P.z - root.position.z, w2 = Math.atan2(pdx, pdz); yaw += Math.atan2(Math.sin(w2 - yaw), Math.cos(w2 - yaw)) * Math.min(1, dt * 3); root.rotation.y = yaw;
  }
  if (C.st === 'patrol') {
    light.intensity = 26 * (0.9 + Math.random() * 0.1); beam.material.opacity = 0.14 + Math.random() * 0.03;
    var sd = sees(G.P.x, G.P.z); if (sd >= 0 && G.mode === 'night' && !G.inBunk) SB.night.seen();
  }
  if (G.mode === 'day' && !path.length && C.ready && !pun) {
    var ph = SB.haul.phase, want2 = (ph === 'haul' || ph === 'swing' || ph === 'ready' || ph === 'sort') ? 'watch' : 'helm';
    if (G.carry === 'pot') want2 = C.st === 'watch' ? 'watch' : 'helm';
    if (want2 !== C.st) { if (want2 === 'watch') C.goTo(['H', 'B', 'C', 'E', 'W1'], 'watch'); else C.goTo(['W1', 'E', 'C', 'B', 'H'], 'helm'); }
  }
};
function arrive() {
  play('idle');
  if (C.st === 'patrol') { if (SB.G.mode === 'night') { C.place('sleep'); C.say('back'); SB.night.calm(); } else C.place('helm'); }
  if (C.st === 'helm') yaw = PI / 2, root.rotation.y = yaw;
  if (pun && pun.ph === 'run') punUpdate(0);
}
C.headPos = function (out) { if (C.head) C.head.getWorldPosition(out); else { out.copy(root.position); out.y += 1.75; grp.localToWorld(out); } out.y += 0.35; return out; };
C.patrolling = function () { return C.st === 'patrol'; };
})();
