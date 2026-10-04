/* 새우잡이배 — 주인공(바이제주의 재벌집 아들, jeju hero.glb). 3인칭일 때 보이고, 든 물건을 품에 안는다. 프롤로그엔 갑판에 뻗어 있다 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, H = SB.hero = { ready: false, face: PI / 2, pose: 'stand', R: null, L: null }, root, model, mixer, acts = {}, cur = null, held = {}, holdG, bone = {}, fing = { Right: [], Left: [] };
H.init = function (grp) {
  root = new T.Group(); root.visible = false; grp.add(root);
  holdG = new T.Group(); holdG.position.set(0, 1.0, 0.36); root.add(holdG);
  H.root = root; loadGlb('hero', function (g) {
    model = g.scene; model.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } }); SB.fixMat(model);
    root.add(model); rigInit(); mixer = new T.AnimationMixer(model);
    g.animations.forEach(function (a) { acts[a.name.toLowerCase()] = mixer.clipAction(a); });
    play('idle'); H.ready = true;
  });
};
/* GLB 읽기: http 면 파일로, 더블클릭(file://)이면 base64 사본으로 */
function loadGlb(name, done) {
  if (!window.GLTFLoaderClass) return;
  var L = new window.GLTFLoaderClass();
  if (location.protocol === 'file:') {
    var sc = document.createElement('script'); sc.src = 'assets/models/' + name + '.glb.js';
    sc.onload = function () { var b = atob(window.GLBJS[name + '.glb']), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); window.GLBJS[name + '.glb'] = null; L.parse(u.buffer, '', done, function (e) { console.warn(e); }); };
    document.head.appendChild(sc);
  } else L.load('assets/models/' + name + '.glb', done, null, function (e) { console.warn(e); });
}
SB.loadGlb = loadGlb;
/* Meshy·믹사모 GLB 재질은 쇠붙이 값이 섞여 있어 환경맵 없는 이 장면에선 새까맣다: 쇠 0, 거칠게, 바탕색 밝게 */
SB.fixMat = function (root) { root.traverse(function (o) { if (!o.isMesh) return; [].concat(o.material).forEach(function (m) { if (m.isMeshStandardMaterial) { m.metalness = 0; m.roughness = Math.max(0.75, m.roughness); if (m.map && m.color.r < 0.8) m.color.setRGB(1, 1, 1); m.needsUpdate = true; } }); }); };
function play(n, ts) {
  var a = acts[n] || acts.idle; if (!a) return;
  a.timeScale = ts == null ? 1 : ts; if (a === cur) return;
  a.reset().play(); if (cur) a.crossFadeFrom(cur, 0.22, false); cur = a;
}


/* ---------- 손 뻗기: 서 있는 동작 위에 두 마디 팔 IK. H.R / H.L = { p: 손바닥이 닿을 곳, palm: 손바닥이 볼 쪽, g: 0 펼침~1 쥠 } (부모 좌표: 배 또는 뗏목) ---------- */
function rigInit() {
  ['Right', 'Left'].forEach(function (sd) {
    ['Arm', 'ForeArm', 'Hand'].forEach(function (n) { bone[sd + n] = model.getObjectByName('mixamorig' + sd + n); });
    ['Index1', 'Middle1', 'Ring1'].forEach(function (n) { bone[sd + n] = model.getObjectByName('mixamorig' + sd + 'Hand' + n); });
  });
  /* 손가락 굽히는 축: 바인드 자세에서 끝마디가 손바닥 쪽으로 가는 축을 고른다 */
  var sk = null; model.traverse(function (o) { if (o.isSkinnedMesh && !sk) sk = o; }); if (!sk) return;
  var saved = sk.skeleton.bones.map(function (b) { return b.quaternion.clone(); }); sk.skeleton.pose(); model.updateMatrixWorld(true);
  ['Right', 'Left'].forEach(function (sd) {
    var hp = wp(bone[sd + 'Hand'], new T.Vector3()), n = palmN(sd, new T.Vector3());
    ['Index', 'Middle', 'Ring', 'Thumb'].forEach(function (f) {
      for (var i = 1; i <= 3; i++) {
        var b = model.getObjectByName('mixamorig' + sd + 'Hand' + f + i), tip = model.getObjectByName('mixamorig' + sd + 'Hand' + f + '4') || model.getObjectByName('mixamorig' + sd + 'Hand' + f + '3'); if (!b || !tip) continue;
        var q0 = b.quaternion.clone(), best = null, bv = -1e9, p = new T.Vector3(), base = wp(tip, new T.Vector3()).sub(hp).dot(n);
        [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]].forEach(function (a) { b.quaternion.copy(q0); b.rotateOnAxis(new T.Vector3(a[0], a[1], a[2]), 0.4); b.updateMatrixWorld(true); var v = wp(tip, p).sub(hp).dot(n) - base; if (v > bv) { bv = v; best = a; } });
        b.quaternion.copy(q0); b.updateMatrixWorld(true);
        fing[sd].push({ b: b, k: sk.skeleton.bones.indexOf(b), ax: new T.Vector3(best[0], best[1], best[2]), th: f === 'Thumb', i: i });
      }
    });
  });
  sk.skeleton.bones.forEach(function (b, i) { b.quaternion.copy(saved[i]); }); model.updateMatrixWorld(true);
  ['Right', 'Left'].forEach(function (sd) { fing[sd].forEach(function (f) { f.q0 = saved[f.k].clone(); }); });       // 쥘 때마다 이 자세에서 굽힌다(쌓이지 않게)
}
var _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3(), _t = new T.Vector3(), _e = new T.Vector3(), _p = new T.Vector3(), _n = new T.Vector3(), _f = new T.Vector3(), _u = new T.Vector3(), _v = new T.Vector3(), _q = new T.Quaternion(), _q2 = new T.Quaternion(), _wq = new T.Quaternion(), _pq = new T.Quaternion(), _pn = new T.Vector3(), _i = new T.Vector3(), _r = new T.Vector3(), _m = new T.Vector3();
function wp(b, o) { return b.getWorldPosition(o); }
function palmN(sd, o) {                              // 손바닥이 보는 쪽(세계). 바인드 T 자세에서 손바닥은 아래(-y)
  var h = wp(bone[sd + 'Hand'], _m.set(0, 0, 0)).clone(); wp(bone[sd + 'Index1'], _i).sub(h); wp(bone[sd + 'Ring1'], _r).sub(h);
  o.crossVectors(_i, _r).normalize(); if (H.pSign == null) H.pSign = {}; if (H.pSign[sd] == null) H.pSign[sd] = o.y < 0 ? 1 : -1; return o.multiplyScalar(H.pSign[sd]);
}
function turnTo(b, from, to) {
  _q.setFromUnitVectors(_u.copy(from).normalize(), _v.copy(to).normalize());
  b.getWorldQuaternion(_wq); _wq.premultiply(_q); b.parent.getWorldQuaternion(_pq); b.quaternion.copy(_pq.invert().multiply(_wq)); b.updateMatrixWorld(true);
}
function reach(sd, r) {
  var s = sd === 'Right' ? 1 : -1, sh = bone[sd + 'Arm'], el = bone[sd + 'ForeArm'], wr = bone[sd + 'Hand'], par = root.parent; if (!sh || !el || !wr || !par) return;
  var tgt = _t.copy(r.p); par.localToWorld(tgt); var palm = _pn.copy(r.palm || _n.set(0, -1, 0)).transformDirection(par.matrixWorld);
  wp(sh, _a); wp(el, _b); wp(wr, _c);
  /* 손목 자리: 손바닥 가운데가 닿을 곳에서 손바닥 반대쪽으로 조금, 손가락 반대쪽으로 손 반 길이 */
  var l1 = _a.distanceTo(_b), l2 = _b.distanceTo(_c), hl = 0.09 * l2 / 0.26;
  _f.copy(tgt).sub(_a); _f.addScaledVector(palm, -_f.dot(palm)); if (_f.lengthSq() < 1e-6) _f.set(0, 0, 1); _f.normalize();      // 손가락은 어깨에서 먼 쪽
  tgt.addScaledVector(_f, -hl).addScaledVector(palm, -0.03);
  var dd = SB.clamp(_a.distanceTo(tgt), 0.05, (l1 + l2) * 0.995), dir = _e.copy(tgt).sub(_a).normalize(), cosA = SB.clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1);
  _p.set(-s * 0.8, -1, -0.35).applyQuaternion(root.getWorldQuaternion(_q2)); _p.addScaledVector(dir, -_p.dot(dir)).normalize();        // 팔꿈치는 바깥 아래 뒤로
  var elb = _n.copy(_a).addScaledVector(dir, l1 * cosA).addScaledVector(_p, l1 * Math.sqrt(Math.max(0, 1 - cosA * cosA)));
  turnTo(sh, _u.copy(_b).sub(_a), _v.copy(elb).sub(_a)); wp(el, _b); wp(wr, _c);
  _v.copy(_a).addScaledVector(dir, dd); turnTo(el, _u.copy(_c).sub(_b), _v.sub(_b));
  /* 손: 손가락이 _f 쪽, 손바닥이 palm 쪽 */
  wp(wr, _b); wp(bone[sd + 'Middle1'], _c); turnTo(wr, _u.copy(_c).sub(_b), _f);
  var ax = _f, cn = palmN(sd, _i), dn = _r.copy(palm); cn.addScaledVector(ax, -cn.dot(ax)).normalize(); dn.addScaledVector(ax, -dn.dot(ax)).normalize();
  if (dn.lengthSq() > 1e-6) { _q2.setFromAxisAngle(ax, Math.atan2(_e.crossVectors(cn, dn).dot(ax), cn.dot(dn))); wr.getWorldQuaternion(_wq); _wq.premultiply(_q2); wr.parent.getWorldQuaternion(_pq); wr.quaternion.copy(_pq.invert().multiply(_wq)); wr.updateMatrixWorld(true); }
  var g = r.g == null ? 0.6 : r.g;
  fing[sd].forEach(function (f) { f.b.quaternion.copy(f.q0); f.b.rotateOnAxis(f.ax, f.th ? 0.2 + g * 0.45 : (0.1 + g * 1.0) * (f.i === 1 ? 0.9 : 1)); });
  model.updateMatrixWorld(true);
}
var HW = { basket: 0.25, pot: 0.15, buoy: 0.3, pallet: 0.36, rope: 0.19, oar: 0.22, vest: 0.21, jug: 0.14, compass: 0.07, key: 0.06 }, _cR = { p: new T.Vector3(), palm: new T.Vector3(), g: 0.9 }, _cL = { p: new T.Vector3(), palm: new T.Vector3(), g: 0.9 };
/* 다른 인물(선장)도 쓰는 두 마디 팔 IK: 어깨·팔꿈치·손목 뼈, 손목 목표(세계), 팔꿈치 쪽(세계 방향) */
SB.twoBone = function (sh, el, wr, tgtW, poleW) {
  var a = wp(sh, new T.Vector3()), b = wp(el, new T.Vector3()), c = wp(wr, new T.Vector3());
  var l1 = a.distanceTo(b), l2 = b.distanceTo(c), dd = SB.clamp(a.distanceTo(tgtW), 0.05, (l1 + l2) * 0.995), dir = tgtW.clone().sub(a).normalize(), cosA = SB.clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1);
  var pl = poleW.clone(); pl.addScaledVector(dir, -pl.dot(dir)).normalize();
  var elb = a.clone().addScaledVector(dir, l1 * cosA).addScaledVector(pl, l1 * Math.sqrt(Math.max(0, 1 - cosA * cosA)));
  turnTo(sh, b.clone().sub(a), elb.clone().sub(a)); wp(el, b); wp(wr, c);
  turnTo(el, c.clone().sub(b), a.clone().addScaledVector(dir, dd).sub(b));
};
function applyIK() {
  var R = H.R, Lh = H.L;
  if (!R && !Lh && heldK && HW[heldK]) {                 // 든 물건: 두 손이 양옆을 받친다
    var w = HW[heldK], hy = holdG.position.y, hz = holdG.position.z + (holdG.children.length ? 0 : 0); root.updateMatrix();
    _cR.p.set(-w, hy, hz).applyMatrix4(root.matrix); _cR.palm.set(1, 0, 0).transformDirection(root.matrix);
    _cL.p.set(w, hy, hz).applyMatrix4(root.matrix); _cL.palm.set(-1, 0, 0).transformDirection(root.matrix);
    R = _cR; Lh = _cL;
  }
  if (!R && !Lh) return; root.updateMatrixWorld(true); if (R) reach('Right', R); if (Lh) reach('Left', Lh);
}
H.hand = function (sd, o) { var b = bone[sd + 'Hand']; return b ? b.getWorldPosition(o) : o; };
/* 품에 안는 것: 이름마다 한 번 만든다 */
function holdMesh(k) {
  if (held[k]) return held[k];
  var g = new T.Group(), L2 = function (c) { return new T.MeshLambertMaterial({ color: c }); }, m;
  if (k === 'basket') { m = new T.Mesh(new T.CylinderGeometry(0.26, 0.21, 0.3, 20, 1, true), SB.M.basketB); m.position.y = 0.03; g.add(m); m = new T.Mesh(new T.CircleGeometry(0.21, 20), new T.MeshLambertMaterial({ color: 0x1f56a8 })); m.rotation.x = -PI / 2; m.position.y = -0.115; g.add(m); }   // 속은 sort.js 의 새우 더미를 옮겨 담는다
  else if (k === 'pot') { m = new T.Mesh(new T.CylinderGeometry(0.11, 0.1, 0.09, 18), new T.MeshPhongMaterial({ color: 0xd9b24a, shininess: 90 })); g.add(m); g.position.y = -0.05; }
  else if (k === 'buoy') { m = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.58, 14), L2(0xf2f2ee)); m.rotation.z = PI / 2; g.add(m); g.position.z = 0.08; }
  else if (k === 'pallet') { m = SB.mk(SB.boat.palGeo, SB.M.mat); m.rotation.x = PI / 2; m.position.set(0, 0.05, 0.12); m.scale.setScalar(0.9); g.add(m); }
  else if (k === 'rope') { for (var i = 0; i < 4; i++) { m = new T.Mesh(new T.TorusGeometry(0.17, 0.022, 6, 18), SB.M.ropeB); m.position.y = i * 0.03; m.rotation.x = PI / 2 - 0.4; g.add(m); } }
  else if (k === 'oar') { m = new T.Mesh(new T.CylinderGeometry(0.025, 0.028, 1.8, 8), L2(0x9e7448)); m.rotation.z = 1.2; g.add(m); m = new T.Mesh(new T.BoxGeometry(0.45, 0.02, 0.15), L2(0x9e7448)); m.position.set(0.85, -0.35, 0); m.rotation.z = 1.2 - PI / 2; g.add(m); }
  else if (k === 'vest') { m = new T.Mesh(new T.BoxGeometry(0.4, 0.5, 0.1), L2(0xfa6a10)); g.add(m); }
  else if (k === 'jug') { m = new T.Mesh(new T.BoxGeometry(0.26, 0.38, 0.2), L2(0xe2e2dc)); g.add(m); }
  else { m = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.03, 12), new T.MeshPhongMaterial({ color: 0xc09a40 })); m.rotation.x = 1.2; g.add(m); g.position.set(0.18, -0.15, -0.1); }
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; }); g.visible = false; holdG.add(g); held[k] = g; return g;
}
var heldK = null, knockT = 0, knockTw = 0, knockD = new T.Vector3();
H.knock = function (dx, dz, tw) { var l = Math.hypot(dx, dz) || 1; knockD.set(dx / l, 0, dz / l); knockTw = tw || 0; knockT = 0.7; };
H.heldMesh = function (k) { return holdMesh(k); };
H.hold = function (k) { heldK = k || null; Object.keys(held).forEach(function (n) { held[n].visible = false; }); if (k) holdMesh(k).visible = true; };
/* 매 프레임: x, z, 바라보는 쪽, 속도 */
H.update = function (dt, x, z, face, sp, vis) {
  if (mixer) mixer.update(dt);
  root.visible = !!vis && H.ready;
  if (H.world) { play('idle'); return; }
  if (H.pose === 'lie') { play('idle', 0.4); return; }
  if (H.pose === 'sit') { play('sit'); if (mixer) mixer.update(0); applyIK(); return; }
  root.position.set(x, D, z); root.rotation.set(0, face, 0);
  if (knockT > 0) {                                  // 맞았다: 뒤로 휘청, 고개가 돌아간다
    knockT = Math.max(0, knockT - dt); var k = Math.sin((1 - knockT / 0.7) * PI) * (knockT / 0.7 + 0.3);
    root.rotation.order = 'YXZ'; root.rotation.set(-0.35 * k, face + knockTw * k, 0); root.position.x += knockD.x * 0.18 * k; root.position.z += knockD.z * 0.18 * k;
  } else root.rotation.order = 'XYZ';
  if (sp < 0.15) play('idle'); else if (sp < 3.3) play('walk', SB.clamp(sp / 1.45, 0.6, 1.8)); else play('run', SB.clamp(sp / 4.6, 0.8, 1.4));
  applyIK();
};
H.lie = function (x, z, ang) { H.pose = 'lie'; root.position.set(x, D + 0.12, z); root.rotation.set(-PI / 2, 0, 0, 'YXZ'); root.rotation.y = ang; root.rotation.order = 'YXZ'; };
H.stand = function () { H.pose = 'stand'; root.rotation.order = 'XYZ'; };
H.toWorld = function (scene, x, y, z, face) { H.world = true; H.stand(); scene.add(root); root.position.set(x, y, z); root.rotation.set(0, face, 0); H.hold(null); };
H.toBoat = function () { if (!H.world && !H.onRaft) return; H.world = false; H.onRaft = false; H.stand(); SB.boat.group.add(root); };
H.toRaft = function (raft, seat) { H.onRaft = true; H.world = false; H.hold(null); raft.add(root); root.position.set(seat[0], seat[1], seat[2]); root.rotation.set(0, 0, 0); H.pose = 'sit'; };
H.preload = function () { ['basket', 'pot', 'buoy', 'pallet', 'rope', 'oar', 'vest', 'jug', 'compass', 'key'].forEach(holdMesh); };
})();
