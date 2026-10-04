/* 새우잡이배 — 프롤로그: 출항 전날 밤 항구. 아버지(올가미 언니의 동물보호법위반)가 술에 뻗은 아들을 친구 선장에게 맡긴다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, S = SB.story = { on: false }, harbor, father, fMixer, fActs = {}, fCur, i = -1, tLine = 0, done = null, shot = null, shotT = 0;
S.LINES = [
  { id: 'n1', who: 'n', shot: 0, ko: '재벌 회장님의 막내아들.', en: 'The youngest son of a chaebol chairman.' },
  { id: 'n2', who: 'n', shot: 0, ko: '미국 유학 3년, 공부 대신 아버지 카드로 파티만 했다.', en: 'Three years in America, partying on Dad\'s card instead of studying.' },
  { id: 'f1', who: 'f', shot: 1, ko: '학비 보내 줬더니 술이나 퍼마시고!', en: 'I paid your tuition and you drank it away!' },
  { id: 'f2', who: 'f', shot: 2, ko: '형님, 이놈 사람 좀 만들어 주쇼.', en: 'Brother, make a man out of him.' },
  { id: 'c1', who: 'c', shot: 2, ko: '회장 아들이라고 봐주는 거 없다. 바다가 다 고쳐 준다.', en: 'Chairman\'s son or not, no special treatment. The sea fixes everyone.' },
  { id: 'f3', who: 'f', shot: 3, ko: '1년 동안 육지 구경도 시키지 마쇼.', en: 'Keep him off land for a whole year.' },
  { id: 'c2', who: 'c', shot: 3, ko: '허허허! 그럼, 그럼.', en: 'Ha ha ha! You got it.' },
  { id: 'n3', who: 'n', shot: 4, ko: '그날 밤, 배는 먼바다로 떠났다.', en: 'That night, the boat left for the open sea.' }
];
/* 장면: 사진기 자리와 보는 곳(배 안 좌표) */
var SHOTS = [
  { a: [16, 7.5, -15], b: [11, 6.0, -11], look: [0, 2.0, -1.5], dur: 9 },
  { a: [1.0, D + 1.25, -0.35], b: [0.8, D + 1.1, -0.45], look: [-0.8, D + 0.55, -1.25], dur: 4 },
  { a: [0.3, D + 1.6, 1.5], b: [0.1, D + 1.6, 1.3], look: [-2.1, D + 1.45, -0.2], dur: 7 },
  { a: [-0.6, D + 1.7, 1.9], b: [-0.9, D + 1.75, 1.7], look: [-2.2, D + 1.5, -0.4], dur: 6 },
  { a: [20, 9, -30], b: [24, 10, -40], look: [0, 1.5, 0], dur: 5 }
];
var WHO = { f: ['아버지', 'FATHER'], c: ['선장', 'CAPTAIN'], n: ['', ''] };
function L2(c) { return new T.MeshLambertMaterial({ color: c }); }
S.init = function (scene) {
  var B = SB.boat; harbor = new T.Group(); harbor.rotation.y = B.heading; harbor.visible = false; scene.add(harbor);
  var wood = new T.MeshLambertMaterial({ map: SB.M.deck.map }), dark = L2(0x2a2a28), r = SB.rng(61), k;
  var pier = new T.Mesh(new T.BoxGeometry(34, 0.3, 3.4), wood); pier.position.set(0, 1.55, -4.8); harbor.add(pier);
  for (k = -16; k <= 16; k += 4) [-3.2, -6.4].forEach(function (z) { var p = new T.Mesh(new T.CylinderGeometry(0.16, 0.18, 3, 8), dark); p.position.set(k, 0.2, z); harbor.add(p); });
  var glow = SB.TEX.glow(), sp = function (c, s) { var o = new T.Sprite(new T.SpriteMaterial({ map: glow, color: c, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); o.scale.setScalar(s); return o; };
  for (k = -14; k <= 14; k += 7) {
    var post = new T.Mesh(new T.CylinderGeometry(0.05, 0.07, 4, 8), L2(0x55595c)); post.position.set(k, 3.7, -6.2); harbor.add(post);
    var arm = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.9), L2(0x55595c)); arm.position.set(k, 5.6, -5.8); harbor.add(arm);
    var lamp = sp(0xffc070, 2.4); lamp.position.set(k, 5.5, -5.4); harbor.add(lamp);
    var pool = new T.Mesh(new T.CircleGeometry(1.8, 20), new T.MeshBasicMaterial({ color: 0xffb060, map: glow, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending })); pool.rotation.x = -PI / 2; pool.position.set(k, 1.72, -5.3); harbor.add(pool);
  }
  var hill = new T.Mesh(new T.SphereGeometry(1, 20, 10, 0, PI * 2, 0, PI / 2), L2(0x0e1418)); hill.scale.set(160, 26, 30); hill.position.set(0, -2, -150); harbor.add(hill);
  for (k = 0; k < 60; k++) { var s = sp(r() < 0.6 ? 0xffc070 : 0xe8f0ff, 1.5 + r() * 2); s.position.set(-120 + r() * 240, 1 + r() * 12, -118 - r() * 10); harbor.add(s); }
  [[-22, -12], [24, -13], [40, -9]].forEach(function (q) { var h = new T.Mesh(new T.BoxGeometry(14, 2.4, 4.4), L2(0x1a2228)); h.position.set(q[0], 0.6, q[1]); harbor.add(h); var w = new T.Mesh(new T.BoxGeometry(3.4, 2, 2.6), L2(0x2a3238)); w.position.set(q[0] - 3, 2.8, q[1]); harbor.add(w); var lt = sp(0xfff0d0, 1.2); lt.position.set(q[0] + 2, 6, q[1]); harbor.add(lt); });
  /* 아버지가 타고 온 검은 고급 승용차(재벌 회장) */
  var car = new T.Group(), paint = new T.MeshPhongMaterial({ color: 0x0b0c0f, shininess: 140, specular: 0x9aa4b0 }), chrome = new T.MeshPhongMaterial({ color: 0xcfd4d8, shininess: 160 }), glass = new T.MeshPhongMaterial({ color: 0x101820, shininess: 160, specular: 0xffffff });
  var bd = new T.Mesh(new T.BoxGeometry(5.1, 0.62, 1.9), paint); bd.position.y = 0.55; car.add(bd);
  var cb = new T.Mesh(new T.BoxGeometry(2.7, 0.55, 1.72), glass); cb.position.set(-0.25, 1.12, 0); car.add(cb);
  var rf = new T.Mesh(new T.BoxGeometry(2.3, 0.06, 1.66), paint); rf.position.set(-0.3, 1.41, 0); car.add(rf);
  var gr = new T.Mesh(new T.BoxGeometry(0.04, 0.32, 0.9), chrome); gr.position.set(2.56, 0.6, 0); car.add(gr);
  [[1.65, 0.86], [1.65, -0.86], [-1.6, 0.86], [-1.6, -0.86]].forEach(function (q) { var w = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.26, 18), dark); w.rotation.x = PI / 2; w.position.set(q[0], 0.36, q[1]); car.add(w); var h = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.27, 14), chrome); h.rotation.x = PI / 2; h.position.copy(w.position); car.add(h); });
  [0.62, -0.62].forEach(function (z) { var hl = sp(0xfff4e0, 0.9); hl.position.set(2.6, 0.66, z); car.add(hl); var tl = sp(0xff2a1a, 0.5); tl.position.set(-2.58, 0.7, z); car.add(tl); });
  car.position.set(5.2, 1.7, -5.0); car.rotation.y = 0.04; harbor.add(car);
  father = new T.Group(); father.visible = false; B.group.add(father);
  SB.loadGlb('father', function (g) {
    var m = g.scene; m.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); SB.fixMat(m);
    fMixer = new T.AnimationMixer(m); g.animations.forEach(function (a) { fActs[a.name] = fMixer.clipAction(a); }); fPlay('idle'); fMixer.update(0);
    m.updateMatrixWorld(true); var bb = new T.Box3().setFromObject(m), k = 1.74 / Math.max(0.01, bb.max.y - bb.min.y);       // 올가미 언니 모델은 원래 크기가 제각각: 키 1.74m 로, 발은 갑판에
    m.scale.multiplyScalar(k); m.position.y = -bb.min.y * k; father.add(m);
  });
};
function fPlay(n) { var a = fActs[n]; if (!a || a === fCur) return; a.reset().play(); if (fCur) a.crossFadeFrom(fCur, 0.3, false); fCur = a; }
S.play = function (cb) {
  done = cb; S.on = true; i = -1; shot = null; SB.setMode('story'); harbor.visible = true; father.visible = true; father.position.set(-1.5, D, -0.65); father.rotation.y = Math.atan2(1.1, -0.9); fPlay('idle');
  SB.sea.sea = 0.3; SB.sea.storm = 0; SB.G.t = 23.2; SB.hero.lie(-0.35, -1.55, PI / 2 + 0.3); SB.cap.at(-2.65, 0.35, Math.atan2(1.15, -1.0));
  SB.escape.showIsland(false); document.getElementById('story').hidden = false; next();
};
function next() {
  i++; if (i >= S.LINES.length) return S.end();
  var l = S.LINES[i], w = WHO[l.who];
  document.getElementById('subWho').textContent = SB.EN ? w[1] : w[0]; document.getElementById('subTxt').textContent = SB.EN ? l.en : l.ko;
  document.getElementById('sub').className = 'who-' + l.who; SND.voice(SB.EN ? l.id + '_en' : l.id);
  if (!shot || shot.n !== l.shot) { shot = { n: l.shot, s: SHOTS[l.shot] }; shotT = 0; }
  if (l.id === 'f2' || l.id === 'f3') father.rotation.y = Math.atan2(-1.15, 1.0);
  tLine = 0; S.lineDur = Math.max(2.6, (SB.EN ? l.en : l.ko).length * (SB.EN ? 0.075 : 0.16) + 1.2);
}
S.tap = function () { if (S.on && tLine > 0.4) next(); };
S.end = function () {
  if (!S.on) return; S.on = false; harbor.visible = false; father.visible = false; SB.hero.stand(); document.getElementById('story').hidden = true;
  var cb = done; done = null; if (cb) cb();
};
var _p = new T.Vector3(), _l = new T.Vector3();
S.update = function (dt, cam) {
  if (fMixer && father.visible) fMixer.update(dt);
  if (!S.on || !shot) return;
  tLine += dt; shotT += dt; if (tLine > S.lineDur) next(); if (!S.on) return;
  var s = shot.s, k = SB.ease(Math.min(1, shotT / s.dur));
  _p.set(SB.lerp(s.a[0], s.b[0], k), SB.lerp(s.a[1], s.b[1], k), SB.lerp(s.a[2], s.b[2], k)); _l.set(s.look[0], s.look[1], s.look[2]);
  SB.boat.group.localToWorld(_p); SB.boat.group.localToWorld(_l); cam.position.copy(_p); cam.up.set(0, 1, 0); cam.lookAt(_l);
};
S.warm = function (on) { harbor.visible = on; father.visible = on; };
})();
