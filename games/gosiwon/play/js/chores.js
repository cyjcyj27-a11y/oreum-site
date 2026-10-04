/* 고시원 총무 — 일거리: 때 닦기, 화장실·주방 청소, 밥하기, 라면 채우기, 김치 */
(function () {
'use strict';
var T = THREE, W = GS.world, PI = Math.PI, CH = GS.chores = {}, G, scene, dyn;
var stains = [], inter = [], SN = 24;
CH.stains = stains; CH.inter = inter;
function mk(fn, mat) { var b = new GS.Batch(); fn(b); var m = b.mesh(mat || GS.M.pla); m.matrixAutoUpdate = true; return m; }
CH.mk = mk;

/* ---------- 알갱이 무리(거품, 반짝이, 물방울, 쌀알) ---------- */
function Pool(n, size, color, grav, add) {
  this.n = n; this.i = 0; this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.grav = grav || 0; this.floor = -99;
  for (var i = 0; i < n; i++) this.pos[i * 3 + 1] = -99;
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(this.pos, 3));
  var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  this.pts = new T.Points(g, new T.PointsMaterial({ size: size, map: new T.CanvasTexture(c), color: color, transparent: true, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending }));
  this.pts.frustumCulled = false; scene.add(this.pts);
}
Pool.prototype.emit = function (x, y, z, vx, vy, vz, life) {
  var i = this.i; this.i = (i + 1) % this.n; this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz; this.life[i] = life;
};
Pool.prototype.update = function (dt) {
  for (var i = 0; i < this.n; i++) {
    if (this.life[i] <= 0) continue; this.life[i] -= dt;
    if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -99; continue; }
    this.vel[i * 3 + 1] -= this.grav * dt; this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    if (this.pos[i * 3 + 1] < this.floor) { this.pos[i * 3 + 1] = this.floor; this.vel[i * 3 + 1] = 0; this.vel[i * 3] *= 0.5; this.vel[i * 3 + 2] *= 0.5; }
  }
  this.pts.geometry.attributes.position.needsUpdate = true;
};
var foam, spark, drops, grains;
function burst(pool, x, y, z, n, sp, up, life) { for (var i = 0; i < n; i++) pool.emit(x, y, z, (Math.random() - 0.5) * sp, up * (0.4 + Math.random()), (Math.random() - 0.5) * sp, life * (0.6 + Math.random() * 0.6)); }
CH.burst = function (kind, x, y, z, n, sp, up, life) { burst(kind === 'spark' ? spark : kind === 'drops' ? drops : foam, x, y, z, n, sp, up, life); };

/* ---------- 때: 작은 그림(24x24)의 투명도를 문지른 만큼 지운다 ---------- */
var KIND = { grime: [96, 78, 52], yellow: [176, 146, 44], mold: [40, 50, 38], pink: [186, 116, 104], lime: [236, 240, 236], soup: [190, 86, 34], dish: [150, 96, 50] };
function makeStain(o) {
  var r = GS.rng(o.seed || 1), data = new Uint8Array(SN * SN * 4), mask = new Float32Array(SN * SN), col = KIND[o.kind || 'grime'], lob = [], i, j, k, sum = 0;
  for (k = 0; k < 4; k++) lob.push([0.5 + (r() - 0.5) * 0.4, 0.5 + (r() - 0.5) * 0.4, 0.2 + r() * 0.16]);
  for (j = 0; j < SN; j++) for (i = 0; i < SN; i++) {
    var u = (i + 0.5) / SN, v = (j + 0.5) / SN, m = 0;
    for (k = 0; k < 4; k++) { var d = Math.sqrt((u - lob[k][0]) * (u - lob[k][0]) + (v - lob[k][1]) * (v - lob[k][1])) / lob[k][2]; m = Math.max(m, 1 - d * d); }
    var e = Math.min(u, v, 1 - u, 1 - v) * 7; m = Math.max(0, Math.min(1, m * 1.5)) * Math.min(1, e) * (0.72 + r() * 0.28); if (m < 0.08) m = 0;
    var id = j * SN + i, sh = 0.8 + r() * 0.3; mask[id] = m; sum += m;
    data[id * 4] = Math.min(255, col[0] * sh); data[id * 4 + 1] = Math.min(255, col[1] * sh); data[id * 4 + 2] = Math.min(255, col[2] * sh); data[id * 4 + 3] = m * (o.alpha || 235);
  }
  var tex = new T.DataTexture(data, SN, SN, T.RGBAFormat); tex.magFilter = tex.minFilter = T.LinearFilter; tex.colorSpace = T.SRGBColorSpace; tex.needsUpdate = true;
  var mesh = new T.Mesh(new T.PlaneGeometry(o.w, o.h), new T.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.position.set(o.x, o.y, o.z); mesh.rotation.order = 'YXZ';
  if (o.flat) { mesh.rotation.x = -PI / 2; mesh.rotation.y = o.rot || 0; } else mesh.rotation.y = o.ry || 0;
  dyn.add(mesh);
  var st = { mesh: mesh, mask: mask, data: data, tex: tex, sum: sum, sum0: sum, w: o.w, h: o.h, a: o.alpha || 235, tough: o.tough || 1, done: false, room: o.room, k: o.k || 0, onDone: o.onDone };
  mesh.userData.st = st; stains.push(st); return st;
}
function scrubStain(st, uv, amt) {                 // amt: 이번에 문지른 길이(m). 가만히 누르고만 있으면 안 지워진다
  var R = 0.105 * (G.items.brush ? 1.4 : 1), rate = Math.min(0.55, amt * 6.5) * (G.items.bleach ? 1.55 : 1) / st.tough, dt = 1;
  var cu = uv.x * SN, cv = uv.y * SN, ru = R / st.w * SN, rv = R / st.h * SN, i, j;
  var i0 = Math.max(0, Math.floor(cu - ru)), i1 = Math.min(SN - 1, Math.ceil(cu + ru)), j0 = Math.max(0, Math.floor(cv - rv)), j1 = Math.min(SN - 1, Math.ceil(cv + rv));
  for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) {
    var du = (i + 0.5 - cu) / ru, dv = (j + 0.5 - cv) / rv, d = du * du + dv * dv; if (d >= 1) continue;
    var id = j * SN + i, m = st.mask[id]; if (m <= 0) continue;
    var nm = Math.max(0, m - rate * dt * (1 - d * 0.5)); st.sum -= m - nm; st.mask[id] = nm; st.data[id * 4 + 3] = nm * st.a;
  }
  st.tex.needsUpdate = true;
  if (st.sum < st.sum0 * 0.07) finishStain(st);
}
function finishStain(st) {
  if (st.done) return; st.done = true; st.mesh.visible = false;
  var p = st.mesh.position; burst(spark, p.x, p.y + 0.03, p.z, 10, 0.5, 0.6, 0.5); GS.snd('ding');
  if (st.onDone) st.onDone(); if (st.room) roomCheck(st.room);
}
/* 닦기: 광선이 닿은 때를 문지른다. 닿았으면 그 때를 돌려준다 */
var rc = new T.Raycaster(), tmpList = [];
CH.scrub = function (ray, dt) {
  if (!G.gloves) return null; tmpList.length = 0;
  for (var i = 0; i < stains.length; i++) if (!stains[i].done) tmpList.push(stains[i].mesh);
  rc.ray.copy(ray); rc.far = 2.3; var h = rc.intersectObjects(tmpList, false)[0]; if (!h || blocked(ray.origin, h.point)) return null;
  var st = h.object.userData.st, pre = st.data[(Math.min(SN - 1, h.uv.y * SN | 0) * SN + Math.min(SN - 1, h.uv.x * SN | 0)) * 4 + 3];
  var mv = CH.lastSt === st && CH.scrubPt ? Math.min(0.25, h.point.distanceTo(CH.scrubPt)) : 0; CH.lastSt = st;
  if (!CH.plane) CH.plane = { p: h.point.clone(), n: new T.Vector3(0, 0, 1).applyQuaternion(h.object.quaternion) };
  CH.scrubV += (Math.min(1, mv / dt / 0.5) - CH.scrubV) * Math.min(1, dt * 12);
  if (mv > 0.0005) scrubStain(st, h.uv, mv);
  if (pre > 20 && mv > 0.002 && Math.random() < dt * 40) foam.emit(h.point.x + (Math.random() - 0.5) * 0.12, h.point.y + 0.01, h.point.z + (Math.random() - 0.5) * 0.12, 0, 0.02, 0, 0.5 + Math.random() * 0.6);
  CH.scrubPt = h.point.clone(); return st;
};
CH.scrubV = 0; CH.plane = null; CH.scrubEnd = function () { CH.lastSt = null; CH.scrubPt = null; CH.scrubV = 0; CH.plane = null; };
var _hp = new T.Vector3();
CH.planeHit = function (ray) {                    // 닦기 시작한 면 위에서 손이 미끄러질 자리
  var P = CH.plane; if (!P) return null; var d = ray.direction.dot(P.n); if (Math.abs(d) < 1e-4) return null;
  var t = _hp.copy(P.p).sub(ray.origin).dot(P.n) / d; if (t < 0 || t > 3) return null; return _hp.copy(ray.direction).multiplyScalar(t).add(ray.origin);
};
CH.stainAt = function (ray) {
  tmpList.length = 0; for (var i = 0; i < stains.length; i++) if (!stains[i].done) tmpList.push(stains[i].mesh);
  rc.ray.copy(ray); rc.far = 2.3; var h = rc.intersectObjects(tmpList, false)[0]; return h && !blocked(ray.origin, h.point) ? h : null;
};
/* 벽 너머 것은 못 건드린다(벽 선분만 본다, 가구는 안 본다) */
function blocked(a, b) {
  var k = Math.floor(a.y / GS.FH), L = W.cols[k], i, s; if (!L) return false;
  for (i = 0; i < L.length; i++) {
    s = L[i]; if (s.p) continue;
    var d1x = b.x - a.x, d1z = b.z - a.z, d2x = s.x2 - s.x1, d2z = s.z2 - s.z1, den = d1x * d2z - d1z * d2x; if (Math.abs(den) < 1e-9) continue;
    var t = ((s.x1 - a.x) * d2z - (s.z1 - a.z) * d2x) / den, u = ((s.x1 - a.x) * d1z - (s.z1 - a.z) * d1x) / den;
    if (t > 0.02 && t < 0.94 && u > 0 && u < 1) return true;
  }
  return false;
}
CH.blocked = blocked;

/* ---------- 건드릴 수 있는 것 ---------- */
var curRoom = null, hitMat = new T.MeshBasicMaterial({ visible: false }), hitGeo = new T.BoxGeometry(1, 1, 1);
function addInter(o) {
  if (o.day && curRoom) o.room = curRoom;
  var m = new T.Mesh(hitGeo, hitMat); m.position.set(o.x, o.y, o.z); m.scale.set(o.sx || 0.3, o.sy || 0.3, o.sz || o.sx || 0.3); m.updateMatrixWorld(); m.userData.it = o; o.hit = m;
  (o.day ? dyn : W.hits).add(m); inter.push(o); return o;
}
CH.addInter = addInter;
CH.focus = function (ray) {                       // 눈앞(또는 손가락 밑)에 있는 건드릴 것
  tmpList.length = 0; for (var i = 0; i < inter.length; i++) if (!inter[i].off && (!inter[i].can || inter[i].can())) tmpList.push(inter[i].hit);
  rc.ray.copy(ray); rc.far = 2.2; var h = rc.intersectObjects(tmpList, false)[0]; return h && !blocked(ray.origin, h.point) ? h.object.userData.it : null;
};
function killInter(o) { o.off = true; if (o.hit.parent) o.hit.parent.remove(o.hit); }

/* ---------- 화장실 하루치 ---------- */
function roomCheck(R) {
  var D = R.day; if (!D || D.clean) return; var left = 0;
  D.stains.forEach(function (s) { if (!s.done) left++; }); left += D.extra;
  D.left = left; GS.ui.tasks();
}
function setupToilet(R, task, day, neg) {
  curRoom = R;
  var r = GS.rng(day * 131 + R.k * 17 + (R.s > 0 ? 3 : 7)), D = R.day = { stains: [], extra: 0, clean: false, left: 0, task: task }, y0 = R.y0, sd = (r() * 1e6) | 0, i;
  function S(o) { o.room = R; o.k = R.k; o.seed = sd++; D.stains.push(makeStain(o)); }
  R.toilets.forEach(function (t, i) { S({ x: t.x, y: y0 + 0.452, z: t.z, w: 0.44, h: 0.52, flat: 1, rot: t.ry, kind: r() < 0.5 ? 'yellow' : 'grime', tough: 0.8 }); });
  if (r() < 0.65 || neg) S({ x: R.sink.x, y: R.sink.y + 0.012, z: R.sink.z, w: 0.5, h: 0.5, flat: 1, kind: 'pink', tough: 0.8 });
  if (r() < 0.45 || neg > 1) S({ x: R.sink.mx, y: R.sink.my, z: R.sink.mz, w: 0.56, h: 0.64, ry: R.sink.ry, kind: 'lime', alpha: 170, tough: 0.7 });
  var nf = Math.min(6, 2 + (day > 5 ? 1 : 0) + (day > 16 ? 1 : 0) + neg * 2), idx = [0, 1, 2, 3, 4, 5, 6].sort(function () { return r() - 0.5; });
  for (i = 0; i < nf; i++) { var f = R.floorSpots[idx[i]]; S({ x: f.x, y: y0 + 0.012, z: f.z, w: f.sz, h: f.sz, flat: 1, rot: r() * 6, kind: r() < 0.3 ? 'mold' : 'grime' }); }
  if (R.g === 'm') [7, 8].forEach(function (q) { if (r() < 0.7 || neg) { var f = R.floorSpots[q]; S({ x: f.x, y: y0 + 0.012, z: f.z, w: f.sz, h: f.sz, flat: 1, rot: r() * 6, kind: 'yellow' }); } });
  if (day > 3) R.wallSpots.forEach(function (q) { if (r() < 0.3 + neg * 0.3) S({ x: q.x, y: q.y, z: q.z, w: q.sz, h: q.sz, ry: q.ry, kind: 'mold' }); });
  /* 휴지통 */
  var trash = mk(function (b) { for (var i = 0; i < 6; i++) b.put(new T.IcosahedronGeometry(0.05 + r() * 0.03, 0), (r() - 0.5) * 0.14, 0.33 + r() * 0.1, (r() - 0.5) * 0.14, { ry: r() * 6, rx: r() * 6, col: [0.92, 0.92, 0.88] }); }, GS.M.mat);
  trash.position.set(R.bin.x, y0, R.bin.z); dyn.add(trash); D.extra++;
  addInter({ day: 1, x: R.bin.x, y: y0 + 0.25, z: R.bin.z, sx: 0.36, sy: 0.5, label: '휴지통', use: function () { trash.visible = false; GS.snd('trash'); GS.hands.jab(); killInter(this); D.extra--; roomCheck(R); } });
  /* 휴지 걸이 */
  R.tp.forEach(function (h) {
    var roll = mk(function (b) { b.put(new T.CylinderGeometry(0.055, 0.055, 0.1, 14), 0, 0, 0, { rx: PI / 2, col: [0.96, 0.96, 0.93] }); b.put(new T.CylinderGeometry(0.02, 0.02, 0.102, 8), 0, 0, 0, { rx: PI / 2, col: [0.6, 0.5, 0.36] }); }, GS.M.mat);
    roll.position.set(h.x + 0.06, h.y - 0.02, h.z); dyn.add(roll);
    if (r() < 0.5 + neg * 0.25) {
      roll.visible = false; D.extra++;
      addInter({ day: 1, x: h.x + 0.06, y: h.y, z: h.z, sx: 0.22, sy: 0.24, label: '휴지', use: function () { if (!(G.rolls > 0)) { GS.ui.nope('rolls'); return; } G.rolls--; GS.ui.hud(); roll.visible = true; GS.snd('tp'); GS.hands.jab(); killInter(this); D.extra--; roomCheck(R); } });
    }
  });
  /* 막힌 변기 */
  R.toilets.forEach(function (t) {
    var water = mk(function (b) { b.put(new T.CircleGeometry(0.115, 16), 0, 0, 0, { rx: -PI / 2, sy: 1.22, col: [1, 1, 1] }); }, new T.MeshLambertMaterial({ color: 0x5c7c84 }));
    water.position.set(t.x, y0 + 0.27, t.z); water.rotation.y = t.ry; dyn.add(water);
    if (day > 3 && r() < 0.16 + neg * 0.2) {
      water.material.color.set(0x6a5630); water.position.y = y0 + 0.385; D.extra++; var n = 4;
      addInter({ day: 1, x: t.x, y: y0 + 0.35, z: t.z, sx: 0.4, sy: 0.5, label: '변기', can: function () { return true; }, use: function () {
        n--; GS.hands.jab(); GS.snd('plunge'); burst(drops, t.x, y0 + 0.45, t.z, 6, 0.6, 1.2, 0.5);
        if (n <= 0) { GS.snd('flush'); water.material.color.set(0x5c7c84); water.position.y = y0 + 0.27; killInter(this); D.extra--; roomCheck(R); }
      } });
    }
  });
  /* 남자: 꽁초, 여자: 하수구 머리카락 */
  if (R.g === 'm') { var nb = (r() * 3.4) | 0; for (i = 0; i < nb; i++) (function () {
    var q = R.w(0.6 + r() * 2.2, 0.5 + r() * 2), butt = mk(function (b) { b.put(new T.CylinderGeometry(0.008, 0.008, 0.05, 6), 0, 0, 0, { rz: PI / 2, col: [0.95, 0.93, 0.88] }); b.put(new T.CylinderGeometry(0.0085, 0.0085, 0.018, 6), 0.03, 0, 0, { rz: PI / 2, col: [0.8, 0.55, 0.25] }); }, GS.M.mat);
    butt.position.set(q[0], y0 + 0.01, q[1]); butt.rotation.y = r() * 6; dyn.add(butt); D.extra++;
    addInter({ day: 1, x: q[0], y: y0 + 0.06, z: q[1], sx: 0.2, sy: 0.14, label: '꽁초', use: function () { butt.visible = false; GS.snd('pick'); GS.hands.jab(); killInter(this); D.extra--; roomCheck(R); } });
  })(); }
  else if (r() < 0.6 || (CH.hairN && CH.hairN(R))) {
    var hair = mk(function (b) { for (var i = 0; i < 7; i++) b.put(new T.TorusGeometry(0.03 + r() * 0.03, 0.004, 4, 10), (r() - 0.5) * 0.06, 0.008 + r() * 0.01, (r() - 0.5) * 0.06, { rx: PI / 2 + (r() - 0.5) * 0.5, ry: r() * 6, col: [0.08, 0.07, 0.06] }); }, GS.M.mat), hn = 3;
    hair.position.set(R.drain.x, y0, R.drain.z); dyn.add(hair); D.extra++; if (CH.hairN && CH.hairN(R)) { hn = CH.hairN(R); hair.scale.set(1.9, 1.4, 1.9); }   // 머리카락 민원 날: 세 배
    addInter({ day: 1, x: R.drain.x, y: y0 + 0.06, z: R.drain.z, sx: 0.26, sy: 0.16, label: '머리카락', use: function () { hn--; hair.scale.multiplyScalar(0.72); GS.snd('pick'); GS.hands.jab(); if (hn <= 0) { hair.visible = false; killInter(this); D.extra--; roomCheck(R); } } });
  }
  /* 대야: 다 닦고 나면 물을 끼얹는다 */
  addInter({ day: 1, x: R.bucket.x, y: y0 + 0.16, z: R.bucket.z, sx: 0.52, sy: 0.36, label: '대야', use: function () {
    if (D.left > 0) { GS.ui.nope('tasks'); return; }
    killInter(this); rinse(R);
  } });
  curRoom = null; roomCheck(R);
}CH.roomAt = function (x, y, z) {
  var k = Math.round(y / GS.FH), CW = 0.75; if (k < 0 || k >= GS.NF) return null;
  if (x > 12) { if (z > CW) return W.toilets[k].m; if (z < -CW) return W.toilets[k].w; }
  if (k === 0 && z > CW && x > 0.4 && x < 5.4) return W.kitchen; return null;
};
/* 움직임 예약 */
var anims = [];
function anim(dur, fn, end) { anims.push({ t: 0, d: dur, fn: fn, end: end }); }
CH.anim = anim;
function finishRoom(R) { var D = R.day; if (D.clean) return; D.clean = true; D.left = 0; GS.snd('clean'); GS.ui.praise('CLEAN'); GS.taskDone(D.task); }
function rinse(R) {
  var D = R.day, y = R.y0 + 0.02, sheet = new T.Mesh(new T.CircleGeometry(1, 28), new T.MeshPhongMaterial({ color: 0xa8ccd2, transparent: true, opacity: 0.5, depthWrite: false, shininess: 90, specular: 0xffffff }));
  sheet.rotation.x = -PI / 2; dyn.add(sheet); GS.hands.jab(); GS.snd('splash'); D.left = 0;
  var a = R.bucket, c = { x: R.center[0], z: R.center[1] }, d = R.drain;
  anim(1.7, function (t) {
    var u = t < 0.45 ? GS.ease(t / 0.45) : 1, v = t < 0.45 ? 0 : GS.ease((t - 0.45) / 0.55);
    sheet.position.set(GS.lerp(GS.lerp(a.x, c.x, u), d.x, v), y, GS.lerp(GS.lerp(a.z, c.z, u), d.z, v));
    var s = t < 0.45 ? 0.2 + u * 1.5 : 1.7 * (1 - v) + 0.04; sheet.scale.set(s, s, 1); sheet.material.opacity = 0.5 * (1 - v * 0.5);
    if (Math.random() < 0.6) drops.emit(sheet.position.x + (Math.random() - 0.5) * s * 1.6, y + 0.03, sheet.position.z + (Math.random() - 0.5) * s * 1.6, (Math.random() - 0.5), 0.8 + Math.random(), (Math.random() - 0.5), 0.4);
    if (t > 0.45 && Math.random() < 0.5) spark.emit(c.x + (Math.random() - 0.5) * 2.6, y + 0.05, c.z + (Math.random() - 0.5) * 2.2, 0, 0.25, 0, 0.6);
  }, function () { dyn.remove(sheet); sheet.geometry.dispose(); sheet.material.dispose(); GS.snd('drain'); finishRoom(R); });
}
/* ---------- 주방 하루치 ---------- */
var dishDirty, dishClean;
function setupKitchen(task, day, neg) {
  curRoom = W.kitchen;
  var K = W.kitchen, r = GS.rng(day * 71 + 5), D = K.day = { stains: [], extra: 0, clean: false, left: 0, task: task }, sd = (r() * 1e6) | 0, i;
  K.auto = true; K.y0 = 0;
  function S(o) { o.room = K; o.seed = sd++; D.stains.push(makeStain(o)); }
  S({ x: K.stove.x, y: K.stove.y + 0.012, z: K.stove.z + 0.02, w: 0.52, h: 0.36, flat: 1, kind: 'soup' });
  if (r() < 0.6 || neg) S({ x: 1.56, y: 0.862, z: 3.42, w: 0.36, h: 0.32, flat: 1, kind: r() < 0.5 ? 'soup' : 'grime' });
  var nf = Math.min(5, 2 + (day > 12 ? 1 : 0) + neg * 2), idx = [0, 1, 2, 3, 4].sort(function () { return r() - 0.5; });
  for (i = 0; i < nf; i++) { var f = K.floorSpots[idx[i]]; S({ x: f[0], y: 0.012, z: f[1], w: f[2], h: f[2], flat: 1, rot: r() * 6, kind: r() < 0.5 ? 'soup' : 'grime' }); }
  dishDirty.visible = true; dishClean.visible = false;
  S({ x: 2.92, y: 0.845, z: 3.41, w: 0.3, h: 0.4, flat: 1, kind: 'dish', tough: 1.5, onDone: function () { dishDirty.visible = false; dishClean.visible = true; GS.snd('dish'); burst(drops, 2.92, 0.86, 3.41, 10, 0.7, 1.2, 0.5); } });
  D.extra++;
  addInter({ day: 1, x: K.waste.x, y: 0.3, z: K.waste.z, sx: 0.4, sy: 0.6, label: '음식물', use: function () { GS.snd('trash'); GS.hands.jab(); killInter(this); D.extra--; roomCheck(K); } });
  curRoom = null; roomCheck(K);
}
/* roomCheck 뒤에: 주방은 다 닦으면 바로 끝 */
var _rc = roomCheck; roomCheck = function (R) { _rc(R); if (R.auto && R.day && !R.day.clean && R.day.left === 0) finishRoom(R); };

/* ---------- 늘 있는 물건들 ---------- */
var O = CH.obj = {};
function need() { if (!G.gloves) { GS.ui.nope('glove'); return false; } return true; }
function task(type) { for (var i = 0; i < G.tasks.length; i++) if (G.tasks[i].type === type) return G.tasks[i]; return null; }
CH.task = task;
CH.init = function (sc) {
  scene = sc; G = GS.G; dyn = new T.Group(); scene.add(dyn); CH.dyn = dyn;
  foam = new Pool(90, 0.05, 0xffffff, 0, false); spark = new Pool(60, 0.06, 0xfff2a8, -0.3, true); drops = new Pool(120, 0.035, 0xc8e4ee, 6, false); grains = new Pool(80, 0.014, 0xffffff, 6, false);
  var RED = [0.83, 0.08, 0.1], i;
  /* 못에 걸린 고무장갑 */
  var hk = W.tri.hook;
  O.gloves = new T.Group(); [-1, 1].forEach(function (sd) { var gl = GS.hands.makeGlove(sd); gl.rotation.set(PI / 2 + 0.1, PI, sd * 0.08); gl.position.set(sd * 0.075, -0.3, 0.02); O.gloves.add(gl); });
  O.gloves.position.set(hk.x, hk.y + 0.08, hk.z - 0.02); scene.add(O.gloves);
  addInter({ x: hk.x, y: hk.y - 0.1, z: hk.z - 0.04, sx: 0.36, sy: 0.5, sz: 0.16, label: '고무장갑', can: function () { return G.gloves ? !GS.left() && !G.carry : GS.left() > 0; }, use: function () {
    if (G.gloves) { G.gloves = false; O.gloves.visible = true; GS.hands.unwear(); GS.snd('glove'); GS.ui.praise('NICE'); GS.ui.tasks(); GS.save(); return; }   // 일 끝: 벗어서 문에 건다
    G.gloves = true; O.gloves.visible = false; GS.hands.wear(); GS.snd('glove'); GS.ui.tasks(); GS.save(); } });
  /* 책상 */
  addInter({ x: W.tri.desk.x, y: 0.75, z: W.tri.desk.z, sx: 0.6, sy: 0.5, sz: 1.0, label: '책상', use: function () { GS.sit(); } });
  /* 설거지 거리 */
  var bowl = function () { return new T.LatheGeometry([[0.001, 0], [0.04, 0], [0.085, 0.045], [0.08, 0.045], [0.04, 0.008], [0.001, 0.008]].map(function (a) { return new T.Vector2(a[0], a[1]); }), 14); };
  dishDirty = mk(function (b) { var r = GS.rng(3); for (i = 0; i < 6; i++) b.put(bowl(), (r() - 0.5) * 0.1, i * 0.028, (r() - 0.5) * 0.14, { rx: (r() - 0.5) * 0.5, rz: (r() - 0.5) * 0.5, col: [0.9, 0.86 - r() * 0.2, 0.74 - r() * 0.3] }); b.put(new T.CylinderGeometry(0.004, 0.004, 0.2, 5), -0.05, 0.16, -0.05, { rz: 0.9, col: [0.75, 0.75, 0.75] }); }, GS.M.cer);
  dishDirty.position.set(2.92, 0.625, 3.41); scene.add(dishDirty);
  dishClean = mk(function (b) { for (i = 0; i < 6; i++) b.put(bowl(), 0, i * 0.02, 0, { col: [0.97, 0.97, 0.95] }); }, GS.M.cer);
  dishClean.position.set(2.92, 0.625, 3.36); dishClean.visible = false; scene.add(dishClean);
  /* 냉장고 문 */
  O.fdoor = new T.Group(); O.fdoor.position.set(4.735, 0, 2.55);
  var fd = mk(function (b) { b.box(0, 0.875, -0.35, 0.05, 1.72, 0.69, { col: [0.9, 0.91, 0.89] }); b.box(-0.04, 1.05, -0.62, 0.03, 0.5, 0.03, { col: [0.6, 0.6, 0.6] }); b.box(-0.027, 1.2, -0.35, 0.003, 0.004, 0.69, { col: [0.5, 0.5, 0.5] }); }); O.fdoor.add(fd); scene.add(O.fdoor);
  addInter({ x: 4.7, y: 0.9, z: 2.2, sx: 0.14, sy: 1.7, sz: 0.7, label: '냉장고', can: function () { return G.carry === 'tub'; }, use: function () {
    G.carry = null; GS.hands.carry(null); GS.snd('fridge');
    anim(0.9, function (t) { O.fdoor.rotation.y = Math.sin(Math.min(1, t * 1.6) * PI * 0.5) * 1.3 * (t > 0.62 ? 1 - (t - 0.62) / 0.38 : 1); }, function () { O.fdoor.rotation.y = 0; GS.snd('fridge'); GS.ui.praise('NICE'); GS.taskDone(task('kimchi')); });
  } });
  /* 창고 선반 위 휴지: 누르면 6개를 챙긴다 */
  O.rolls = mk(function (b) { for (var i = 0; i < 6; i++) { b.put(new T.CylinderGeometry(0.055, 0.055, 0.1, 14), 0.7 + (i % 3) * 0.12, 0.05 + (i > 2 ? 0.1 : 0), -3.0, { col: [0.97, 0.97, 0.94] }); b.put(new T.CylinderGeometry(0.02, 0.02, 0.102, 8), 0.7 + (i % 3) * 0.12, 0.05 + (i > 2 ? 0.1 : 0), -3.0, { col: [0.62, 0.5, 0.36] }); } }, GS.M.mat);
  O.rolls.position.y = 1.565; scene.add(O.rolls);
  addInter({ x: 0.82, y: 1.7, z: -3.0, sx: 0.42, sy: 0.26, sz: 0.2, label: '휴지', can: function () { return (G.rolls || 0) < 6 && !G.carry; }, use: function () { if (!need()) return; G.rolls = 6; GS.snd('tp'); GS.hands.jab(); GS.ui.hud(); GS.save(); } });
  initRice(); initRamen(); initKimchi();
};
function disposeDyn() {
  var shared = []; Object.keys(GS.M).forEach(function (k) { shared.push(GS.M[k]); });
  while (dyn.children.length) { var m = dyn.children[0]; dyn.remove(m); if (m.geometry && m.geometry !== hitGeo) m.geometry.dispose(); if (m.material && m.material !== hitMat && shared.indexOf(m.material) < 0) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }
}
CH.setupDay = function () {
  G = GS.G; disposeDyn(); stains.length = 0; anims.length = 0;
  for (var i = inter.length - 1; i >= 0; i--) if (inter[i].day) inter.splice(i, 1);
  for (var k = 0; k < GS.NF; k++) { W.toilets[k].m.day = null; W.toilets[k].w.day = null; }
  W.kitchen.day = null; dishDirty.visible = false; dishClean.visible = true;
  G.tasks.forEach(function (t) {
    if (t.done) return; var ng = G.neglect[t.id] || 0;
    if (t.type === 'toilet') setupToilet(W.toilets[t.k][t.g], t, G.day, ng); else if (t.type === 'kitchen') setupKitchen(t, G.day, ng);
  });
  O.gloves.visible = !G.gloves; resetRice(); resetRamen(); resetKimchi();
};
CH.left = function (t) {                             // 그 일에 남은 것 수(목록에 보여 줌)
  var R = t.type === 'toilet' ? W.toilets[t.k][t.g] : t.type === 'kitchen' ? W.kitchen : null; return R && R.day && !R.day.clean ? R.day.left : 0;
};
CH.finishAll = function (t) {                        // 시험용: 그 일을 바로 끝낸다
  var R = t.type === 'toilet' ? W.toilets[t.k][t.g] : t.type === 'kitchen' ? W.kitchen : null;
  if (R && R.day) { R.day.stains.forEach(function (s) { s.done = true; s.mesh.visible = false; }); R.day.extra = 0; inter.forEach(function (o) { if (o.day) { } }); finishRoom(R); } else GS.taskDone(t);
};
/* ---------- 작업대 앞에 서서 하는 일(밥, 라면, 김치) ---------- */
var ST = CH.ST = {}, _pv = new T.Vector3(), _ph = new T.Vector3();
CH.cur = null;
CH.enter = function (id) { CH.cur = ST[id]; ST[id].id = id; ST[id].enter(); GS.stationIn(ST[id]); };
CH.leave = function () { var s = CH.cur; if (!s) return; CH.cur = null; if (s.exit) s.exit(); GS.stationOut(); };
function near(x, y, z, rad) { _pv.set(x, y, z).project(GS.cam); var dx = (_pv.x - GS.ptr.x) * GS.aspect, dy = _pv.y - GS.ptr.y; return dx * dx + dy * dy < rad * rad; }
function planeHit(y) { var r = GS.ptrRay; if (r.direction.y > -1e-4) return null; var t = (y - r.origin.y) / r.direction.y; return _ph.copy(r.direction).multiplyScalar(t).add(r.origin); }
function vec(a) { return a.map(function (p) { return new T.Vector2(p[0], p[1]); }); }
function grade(v, a, b) { var ok = v >= a && v <= b; GS.ui.praise(ok ? 'PERFECT' : 'GOOD'); GS.snd(ok ? 'perfect' : 'nice'); if (ok) GS.coin(1000); return ok; }

/* ----- 밥 ----- */
var RC = { step: -1 };
function initRice() {
  var c = RC.c = { x: 4.2, y: 0.85, z: 3.45 }, Wt = [0.94, 0.94, 0.91];
  var body = mk(function (b) {
    b.put(new T.CylinderGeometry(0.165, 0.16, 0.24, 20), 0, 0.12, 0, { col: Wt }); b.put(new T.CylinderGeometry(0.168, 0.168, 0.05, 20), 0, 0.045, 0, { col: [0.55, 0.56, 0.58] });
    b.put(new T.TorusGeometry(0.15, 0.014, 6, 22), 0, 0.24, 0, { rx: PI / 2, col: [0.3, 0.3, 0.32] }); b.put(new T.CircleGeometry(0.145, 20), 0, 0.2, 0, { rx: -PI / 2, col: [0.16, 0.16, 0.17] });
    b.box(0, 0.12, -0.16, 0.13, 0.08, 0.03, { col: [0.2, 0.2, 0.22] });
  }); body.position.set(c.x, c.y, c.z); scene.add(body);
  RC.led = new T.Mesh(new T.SphereGeometry(0.009, 8, 6), new T.MeshBasicMaterial({ color: 0x331111 })); RC.led.position.set(c.x + 0.03, c.y + 0.13, c.z - 0.177); scene.add(RC.led);
  RC.lid = new T.Group(); RC.lid.position.set(c.x, c.y + 0.245, c.z + 0.155);
  RC.lid.add(mk(function (b) { b.put(new T.SphereGeometry(0.168, 20, 8, 0, PI * 2, 0, PI / 2), 0, 0, -0.155, { sy: 0.42, col: Wt }); b.box(0, 0.075, -0.155, 0.07, 0.02, 0.04, { col: [0.3, 0.3, 0.32] }); b.put(new T.CircleGeometry(0.16, 20), 0, 0.001, -0.155, { rx: PI / 2, col: [0.7, 0.7, 0.7] }); })); scene.add(RC.lid);
  RC.pot = mk(function (b) { b.put(new T.LatheGeometry(vec([[0.001, 0], [0.124, 0], [0.13, 0.14], [0.14, 0.142], [0.14, 0.146], [0.128, 0.146], [0.12, 0.008], [0.001, 0.008]]), 22), 0, 0, 0, { col: [0.3, 0.31, 0.33] }); });
  scene.add(RC.pot);
  var rc = document.createElement('canvas'); rc.width = rc.height = 64; var g = rc.getContext('2d'), r = GS.rng(8); g.fillStyle = '#f4f2e8'; g.fillRect(0, 0, 64, 64);
  for (var i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.9)' : 'rgba(190,185,165,.5)'; g.fillRect(r() * 64, r() * 64, 2.5, 1.2); }
  var rt = new T.CanvasTexture(rc); rt.colorSpace = T.SRGBColorSpace;
  RC.rice = new T.Mesh(new T.CircleGeometry(0.122, 20), new T.MeshLambertMaterial({ map: rt })); RC.rice.rotation.x = -PI / 2; RC.pot.add(RC.rice);
  RC.water = new T.Mesh(new T.CircleGeometry(0.125, 20), new T.MeshPhongMaterial({ color: 0xf2f0e6, transparent: true, opacity: 0.8, shininess: 90, depthWrite: false })); RC.water.rotation.x = -PI / 2; RC.pot.add(RC.water);
  RC.ring = new T.Mesh(new T.TorusGeometry(0.1265, 0.0035, 6, 28), new T.MeshBasicMaterial({ color: 0x38c060 })); RC.ring.rotation.x = PI / 2; RC.pot.add(RC.ring);
  RC.swirl = new T.Mesh(new T.TorusGeometry(0.07, 0.005, 4, 18, 4.4), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 })); RC.swirl.rotation.x = PI / 2; RC.swirl.visible = false; RC.pot.add(RC.swirl);
  var bin = mk(function (b) {
    b.box(0, 0.13, 0, 0.21, 0.26, 0.21, { col: [0.88, 0.9, 0.94] }); b.box(0, 0.262, 0, 0.19, 0.006, 0.19, { col: [0.97, 0.96, 0.9] }); b.box(0, 0.1, -0.106, 0.14, 0.09, 0.004, { col: [0.3, 0.55, 0.35] });
  }); bin.position.set(3.78, 0.85, 3.5); scene.add(bin);
  RC.scoop = mk(function (b) { b.put(new T.CylinderGeometry(0.045, 0.036, 0.05, 12, 1, true), 0, 0.025, 0, { col: [0.86, 0.16, 0.14] }); b.put(new T.CircleGeometry(0.036, 12), 0, 0.002, 0, { rx: -PI / 2, col: [0.7, 0.1, 0.1] }); b.box(0.075, 0.04, 0, 0.08, 0.012, 0.022, { col: [0.86, 0.16, 0.14] }); });
  scene.add(RC.scoop);
  RC.stream = new T.Mesh(new T.CylinderGeometry(0.008, 0.011, 1, 6), new T.MeshBasicMaterial({ color: 0xd4eef6, transparent: true, opacity: 0.75 })); RC.stream.visible = false; scene.add(RC.stream);
  addInter({ x: c.x, y: c.y + 0.16, z: c.z - 0.05, sx: 0.42, sy: 0.42, sz: 0.5, label: '밥솥', can: function () { var t = task('rice'); return t && !t.done && !G.carry; }, use: function () { if (need()) CH.enter('rice'); } });
}
function potHome() { RC.pot.position.set(RC.c.x, RC.c.y + 0.1, RC.c.z); RC.pot.rotation.set(0, 0, 0); }
function potLevels() {
  RC.rice.visible = RC.r > 0.01; RC.rice.position.y = 0.012 + RC.r * 0.055; RC.water.visible = RC.w > 0.01; RC.water.position.y = 0.014 + RC.r * 0.055 + RC.w * 0.07;
  var c = RC.turb; RC.water.material.color.setRGB(GS.lerp(0.62, 0.95, c), GS.lerp(0.8, 0.94, c), GS.lerp(0.86, 0.9, c)); RC.water.material.opacity = GS.lerp(0.4, 0.85, c);
}
function resetRice() {
  var t = task('rice'); RC.step = -1; RC.r = 0; RC.w = 0; RC.turb = 1; RC.busy = false; RC.cooking = !!(t && t.done); RC.doneAt = G.riceAt || 0;
  potHome(); RC.lid.rotation.x = 0; RC.ring.visible = false; RC.swirl.visible = false; RC.stream.visible = false; RC.scoop.position.set(3.78, 1.115, 3.5); RC.scoop.rotation.set(0, 0, 0); potLevels();
  RC.led.material.color.set(RC.cooking ? (G.t >= RC.doneAt ? 0xffa030 : 0xff3020) : 0x331111);
}
ST.rice = {
  cam: [3.72, 1.46, 2.88], look: [3.72, 0.9, 3.48],
  enter: function () {
    RC.step = 0; RC.r = 0; RC.w = 0; RC.turb = 1; RC.rinse = 0; RC.stir = 0; RC.held = false; RC.src = false; RC.tapT = 0; RC.busy = true; GS.snd('lidc');
    anim(0.35, function (t) { RC.lid.rotation.x = GS.ease(t) * 1.35; }, function () {
      var a = RC.pot.position.clone(); GS.snd('pick');
      anim(0.4, function (t) { var e = GS.ease(t); RC.pot.position.set(GS.lerp(a.x, 3.28, e), GS.lerp(a.y, 0.632, e) + Math.sin(e * PI) * 0.3, GS.lerp(a.z, 3.41, e)); }, function () { RC.busy = false; RC.ring.visible = true; RC.ring.material.color.set(0x38c060); RC.ring.position.y = 0.012 + 0.67 * 0.055 + 0.004; });
    });
  },
  down: function () {
    if (RC.busy) return;
    if (RC.step === 0 && (near(3.78, 1.05, 3.5, 0.5) || near(3.28, 0.8, 3.41, 0.36))) { RC.src = true; RC.tapT = 0.55; }
    if (RC.step === 2 && (near(3.28, 1.05, 3.6, 0.45) || near(3.28, 0.8, 3.41, 0.36))) { RC.src = true; RC.tapT = 0.5; }
    if (RC.step === 3 && (near(RC.c.x, RC.c.y + 0.2, RC.c.z, 0.5) || near(3.28, 0.8, 3.41, 0.36))) {
      RC.busy = true; var a = RC.pot.position.clone(); GS.snd('pick');
      anim(0.45, function (t) { var e = GS.ease(t); RC.pot.position.set(GS.lerp(a.x, RC.c.x, e), GS.lerp(a.y, RC.c.y + 0.1, e) + Math.sin(e * PI) * 0.32, GS.lerp(a.z, RC.c.z, e)); }, function () {
        anim(0.3, function (t) { RC.lid.rotation.x = (1 - GS.ease(t)) * 1.35; }, function () { GS.snd('lidc'); RC.busy = false; RC.step = 4; });
      });
    } else if (RC.step === 4 && near(RC.c.x, RC.c.y + 0.15, RC.c.z, 0.5)) {
      RC.step = 5; RC.cooking = true; G.riceAt = RC.doneAt = G.t + 60; RC.led.material.color.set(0xff3020); GS.snd('beep'); GS.ui.praise('NICE'); GS.taskDone(task('rice'));
      setTimeout(function () { if (CH.cur === ST.rice) CH.leave(); }, 700);
    }
  },
  up: function () { RC.src = false; },
  update: function (dt) {
    var P = GS.ptr, sp = G.items.scoop ? 1.8 : 1, tn = performance.now() / 1000; RC.scoop.scale.setScalar(G.items.scoop ? 1.4 : 1);   // 큰 바가지를 사면 바가지도 크게
    RC.swirl.visible = RC.step === 1 && RC.w >= 0.8 && !RC.busy; if (RC.swirl.visible) { RC.swirl.position.y = RC.water.position.y + 0.003; RC.swirl.rotation.z = -tn * 5; }
    if (RC.step === 3 || RC.step === 4) RC.led.material.color.set(Math.sin(tn * 9) > 0 ? 0xff3020 : 0x331111);
    if (RC.busy) return;
    if (RC.step === 0 && !RC.held) RC.scoop.position.y = 1.115 + Math.abs(Math.sin(tn * 4)) * 0.03;
    if (RC.step === 2 && !RC.held && Math.random() < dt * 4) drops.emit(3.28, 1.09, 3.5, 0, -0.2, 0, 0.45);
    if (RC.step === 0) {
      RC.tapT = Math.max(0, (RC.tapT || 0) - dt); var on = (P.down && RC.src) || RC.tapT > 0;
      if (on) {
        RC.held = true; RC.r = Math.min(1, RC.r + 0.3 * sp * dt); var ph = (performance.now() / 260) % 1;
        RC.scoop.position.set(GS.lerp(3.78, 3.36, ph), 1.12 + Math.sin(ph * PI) * 0.12, GS.lerp(3.5, 3.42, ph)); RC.scoop.rotation.z = ph > 0.6 ? (ph - 0.6) * 4 : 0;
        for (var i = 0; i < 3; i++) grains.emit(3.3 + Math.random() * 0.05, 1.05, 3.4 + Math.random() * 0.05, (Math.random() - 0.5) * 0.2, -0.5, (Math.random() - 0.5) * 0.2, 0.3);
        GS.snd('rice');
      } else if (RC.held) {
        RC.held = false; RC.scoop.position.set(3.78, 1.115, 3.5); RC.scoop.rotation.z = 0;
        if (RC.r >= 0.57) { grade(RC.r, 0.57, 0.8); RC.step = 1; RC.ring.visible = false; }
      }
      if (RC.r >= 1 && RC.step === 0) { RC.held = false; grade(RC.r, 0.57, 0.8); RC.step = 1; RC.ring.visible = false; RC.scoop.position.set(3.78, 1.115, 3.5); RC.scoop.rotation.z = 0; }
    } else if (RC.step === 1) {
      if (RC.w < 0.8) { RC.w = Math.min(0.8, RC.w + dt * 0.9); stream(true); GS.snd('water'); } else stream(false);
      if (P.down && RC.w >= 0.8) {
        RC.stir += P.mv; RC.turb = Math.max(0.12, (RC.rinse ? 0.6 : 1) * (1 - RC.stir / 2.2)); if (P.mv > 0.004) GS.snd('stir');
        if (RC.stir >= 2.2) {
          RC.busy = true; RC.stir = 0; GS.snd('pour');
          anim(1.0, function (t) { RC.pot.rotation.z = Math.sin(t * PI) * 1.0; RC.w = 0.8 * (1 - GS.ease(Math.min(1, t * 1.6))); potLevels(); if (t < 0.7) drops.emit(3.14, 0.8, 3.41 + (Math.random() - 0.5) * 0.1, -0.3, -0.2, 0, 0.3); }, function () {
            RC.pot.rotation.z = 0; RC.busy = false; RC.rinse++; RC.turb = 0.6;
            if (RC.rinse >= 2) { RC.step = 2; RC.w = 0; RC.turb = 0; RC.ring.visible = true; RC.ring.material.color.set(0x3a9be0); RC.ring.position.y = 0.014 + RC.r * 0.055 + 0.6 * 0.07 + 0.004; }
          });
        }
      }
    } else if (RC.step === 2) {
      RC.tapT = Math.max(0, (RC.tapT || 0) - dt); var onf = (P.down && RC.src) || RC.tapT > 0;
      if (onf) { RC.held = true; RC.w = Math.min(1, RC.w + 0.36 * sp * dt); stream(true); GS.snd('water'); }
      else { stream(false); if (RC.held) { RC.held = false; if (RC.w >= 0.5) { grade(RC.w, 0.5, 0.7); RC.step = 3; RC.ring.visible = false; } } }
      if (RC.w >= 1 && RC.step === 2) { RC.held = false; stream(false); grade(RC.w, 0.5, 0.7); RC.step = 3; RC.ring.visible = false; }
    }
    potLevels();
  },
  exit: function () { stream(false); RC.swirl.visible = false; if (RC.step < 5) { RC.step = -1; RC.r = 0; RC.w = 0; potHome(); RC.lid.rotation.x = 0; RC.ring.visible = false; potLevels(); } }
};
function stream(on) {
  RC.stream.visible = on; if (!on) return; var top = 1.09, bot = RC.pot.position.y + 0.02 + RC.r * 0.055 + RC.w * 0.07;
  RC.stream.position.set(3.28, (top + bot) / 2, 3.5); RC.stream.scale.y = top - bot; if (Math.random() < 0.5) drops.emit(3.28, bot + 0.02, 3.5, (Math.random() - 0.5) * 0.5, 0.5, (Math.random() - 0.5) * 0.5, 0.2);
}
// ----- 라면 -----
var RN = { stage: -1 }, CB = [0.74, 0.58, 0.38];
function cardboard(b, w, h, d, open) { b.box(0, 0.01, 0, w, 0.02, d, { col: CB }); b.box(-w / 2 + 0.008, h / 2, 0, 0.016, h, d, { col: CB }); b.box(w / 2 - 0.008, h / 2, 0, 0.016, h, d, { col: CB }); b.box(0, h / 2, -d / 2 + 0.008, w, h, 0.016, { col: [0.7, 0.54, 0.35] }); b.box(0, h / 2, d / 2 - 0.008, w, h, 0.016, { col: [0.7, 0.54, 0.35] }); if (!open) b.box(0, h - 0.008, 0, w, 0.016, d, { col: [0.78, 0.62, 0.42] }); }
/* 라면 봉지 그림: 빨간 봉지, 흰 그릇에 꼬불면과 달걀, 파, 고추. 위 2/3 가 앞면, 아래 1/3 은 봉지 옆면 빨강 */
function packTex() {
  var c = document.createElement('canvas'); c.width = 512; c.height = 768; var g = c.getContext('2d'), i;
  g.fillStyle = '#b4160e'; g.fillRect(0, 0, 512, 768);
  var gr = g.createRadialGradient(256, 300, 20, 256, 256, 330); gr.addColorStop(0, '#f04a2c'); gr.addColorStop(1, '#b0120c'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#fff4e4'; g.fillRect(0, 0, 512, 62); g.fillStyle = '#b0120c'; g.font = "bold 34px 'Ria',sans-serif"; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('오름식품', 22, 32); g.textAlign = 'right'; g.fillStyle = '#1c7a3c'; g.fillText('매운맛', 490, 32);
  g.save(); g.translate(256, 330); g.scale(1, 0.56); g.fillStyle = '#f7f5ee'; g.beginPath(); g.arc(0, 0, 176, 0, 6.3); g.fill(); g.fillStyle = '#d8d4c8'; g.beginPath(); g.arc(0, 0, 176, 0, 6.3); g.arc(0, 0, 150, 0, 6.3, true); g.fill();
  g.fillStyle = '#e8902a'; g.beginPath(); g.arc(0, 8, 150, 0, 6.3); g.fill(); g.restore();
  g.strokeStyle = '#f5c842'; g.lineWidth = 9; g.lineCap = 'round';
  for (i = 0; i < 7; i++) { g.beginPath(); var y0 = 300 + i * 11, x0 = 130 + (i % 2) * 14; g.moveTo(x0, y0); for (var k = 0; k < 6; k++) g.quadraticCurveTo(x0 + k * 42 + 21, y0 + (k % 2 ? -16 : 16), x0 + k * 42 + 42, y0); g.stroke(); }
  g.fillStyle = '#fffdf2'; g.beginPath(); g.ellipse(300, 318, 46, 32, 0.2, 0, 6.3); g.fill(); g.fillStyle = '#f7b31a'; g.beginPath(); g.arc(300, 318, 20, 0, 6.3); g.fill();
  g.fillStyle = '#3d9a3a'; [[180, 300], [215, 345], [345, 352], [250, 362]].forEach(function (q) { g.beginPath(); g.ellipse(q[0], q[1], 9, 6, 0.6, 0, 6.3); g.fill(); });
  g.fillStyle = '#e3301a'; [[165, 340], [330, 300]].forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 8, 0, 6.3); g.fill(); g.fillStyle = '#f4d040'; g.beginPath(); g.arc(q[0], q[1], 3, 0, 6.3); g.fill(); g.fillStyle = '#e3301a'; });
  g.textAlign = 'center'; g.font = "126px 'Eulji','Ria',sans-serif"; g.lineWidth = 16; g.strokeStyle = '#5a0a06'; g.lineJoin = 'round'; g.strokeText('라면', 256, 178); g.fillStyle = '#fff'; g.fillText('라면', 256, 178);
  g.font = "bold 26px 'Ria',sans-serif"; g.fillStyle = '#fff4e4'; g.fillText('120g x 5', 256, 470);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (i = 0; i < 512; i += 24) g.fillRect(i, 512, 12, 256);
  var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t;
}
/* 다섯 봉지를 눕혀 쌓고 비닐로 싼 묶음 */
function bundle(seed) {
  var r = GS.rng(seed * 7 + 3), g = new T.Group(), b = new GS.Batch(), i, W2 = 0.09, D2 = 0.065, T2 = 0.015, RED = [0.72, 0.1, 0.07];
  for (i = 0; i < 5; i++) {
    var y = i * 0.031 + T2, dx = (r() - 0.5) * 0.008, dz = (r() - 0.5) * 0.008, a = (r() - 0.5) * 0.08, c = Math.cos(a), s = Math.sin(a), col = [1, 1, 1];
    var P = function (lx, ly, lz) { return [dx + lx * c + lz * s, y + ly, dz - lx * s + lz * c]; };
    b.quad(P(-W2, T2, D2), P(W2, T2, D2), P(W2, T2, -D2), P(-W2, T2, -D2), [0, 1, 0], [0, 0.34, 1, 1], col);
    b.quad(P(-W2, -T2, -D2), P(W2, -T2, -D2), P(W2, -T2, D2), P(-W2, -T2, D2), [0, -1, 0], [0, 0.34, 1, 1], col);
    b.quad(P(-W2, -T2, D2), P(W2, -T2, D2), P(W2, T2, D2), P(-W2, T2, D2), [0, 0, 1], [0.05, 0.05, 0.95, 0.28], RED);
    b.quad(P(W2, -T2, -D2), P(-W2, -T2, -D2), P(-W2, T2, -D2), P(W2, T2, -D2), [0, 0, -1], [0.05, 0.05, 0.95, 0.28], RED);
    b.quad(P(W2, -T2, D2), P(W2, -T2, -D2), P(W2, T2, -D2), P(W2, T2, D2), [1, 0, 0], [0.05, 0.05, 0.4, 0.28], RED);
    b.quad(P(-W2, -T2, -D2), P(-W2, -T2, D2), P(-W2, T2, D2), P(-W2, T2, -D2), [-1, 0, 0], [0.05, 0.05, 0.4, 0.28], RED);
    b.quad(P(W2, -0.002, D2 + 0.004), P(W2 + 0.012, -0.002, D2 + 0.004), P(W2 + 0.012, 0.002, -D2 - 0.004), P(W2, 0.002, -D2 - 0.004), [0, 1, 0], [0.05, 0.05, 0.1, 0.1], [0.9, 0.3, 0.25]);
    b.quad(P(-W2 - 0.012, -0.002, D2 + 0.004), P(-W2, -0.002, D2 + 0.004), P(-W2, 0.002, -D2 - 0.004), P(-W2 - 0.012, 0.002, -D2 - 0.004), [0, 1, 0], [0.05, 0.05, 0.1, 0.1], [0.9, 0.3, 0.25]);
  }
  var m = b.mesh(RN.mat); m.matrixAutoUpdate = true; g.add(m);
  var f = new T.Mesh(new T.BoxGeometry(0.212, 0.162, 0.148), RN.film); f.position.y = 0.081; g.add(f);
  return g;
}
function initRamen() {
  var K = W.kitchen.shelf, s, j, sb = W.store.box;
  RN.packs = []; RN.mat = new T.MeshLambertMaterial({ map: packTex(), vertexColors: true }); RN.film = new T.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, shininess: 120, specular: 0xffffff, depthWrite: false });
  for (s = 0; s < 3; s++) for (j = 0; j < 5; j++) {
    var p = bundle(s * 5 + j);
    p.userData.home = new T.Vector3(K.x + 0.02, K.ys[s] - 0.008, 2.1 + j * 0.2); p.position.copy(p.userData.home); p.rotation.y = PI / 2 + (j % 2 ? 0.03 : -0.03); scene.add(p); RN.packs.push(p);
  }
  RN.store = mk(function (b) { cardboard(b, 0.44, 0.27, 0.32); b.box(0, 0.271, 0, 0.06, 0.003, 0.32, { col: [0.82, 0.74, 0.5] }); b.box(0, 0.14, -0.161, 0.2, 0.12, 0.003, { col: [0.86, 0.12, 0.1] }); }, GS.M.mat);
  RN.store.position.set(sb.x, 0, sb.z); scene.add(RN.store);
  addInter({ x: sb.x, y: 0.16, z: sb.z, sx: 0.5, sy: 0.36, sz: 0.4, label: '라면 상자', can: function () { return RN.stage === 0 && !G.carry; }, use: function () { if (!need()) return; RN.stage = 1; RN.store.visible = false; G.carry = 'ramen'; GS.hands.carry('ramen'); GS.snd('pick'); } });
  addInter({ x: K.x + 0.22, y: 0.95, z: K.z, sx: 0.12, sy: 1.6, sz: 1.0, label: '선반', can: function () { return G.carry === 'ramen'; }, use: function () { G.carry = null; GS.hands.carry(null); CH.enter('ramen'); } });
  RN.box = new T.Group(); RN.box.position.set(1.06, 0, 2.5);
  RN.box.add(mk(function (b) { cardboard(b, 0.32, 0.27, 0.44, true); }, GS.M.mat));
  RN.fl = new T.Group(); RN.fl.position.set(-0.16, 0.27, 0); RN.fl.add(mk(function (b) { b.box(0.08, 0, 0, 0.16, 0.012, 0.44, { col: [0.78, 0.62, 0.42] }); }, GS.M.mat)); RN.box.add(RN.fl);
  RN.fr = new T.Group(); RN.fr.position.set(0.16, 0.27, 0); RN.fr.add(mk(function (b) { b.box(-0.08, 0, 0, 0.16, 0.012, 0.44, { col: [0.78, 0.62, 0.42] }); }, GS.M.mat)); RN.box.add(RN.fr);
  RN.tape = mk(function (b) { b.box(0, 0.278, 0, 0.06, 0.003, 0.44, { col: [0.82, 0.74, 0.5] }); }, GS.M.mat); RN.box.add(RN.tape);
  RN.inner = new T.Group(); [[-0.07, -0.13], [0.07, -0.13], [-0.07, 0.07], [0.07, 0.07]].forEach(function (q, i) { var bd = bundle(20 + i); bd.rotation.y = PI / 2 + (i % 2 ? 0.05 : -0.04); bd.position.set(q[0], -0.09, q[1] + 0.03); RN.inner.add(bd); }); RN.box.add(RN.inner);
  scene.add(RN.box);
}
function resetRamen() {
  var t = task('ramen'); RN.stage = t && !t.done ? 0 : -1; RN.store.visible = RN.stage === 0; RN.box.visible = false; RN.n = 0; RN.acc = 0;
  for (var i = 0; i < 15; i++) { RN.packs[i].visible = i < G.stock; RN.packs[i].position.copy(RN.packs[i].userData.home); }
}
ST.ramen = {
  cam: [2.0, 1.5, 2.5], look: [0.72, 0.72, 2.5],
  enter: function () { RN.stage = 2; RN.box.visible = true; RN.fl.rotation.z = 0; RN.fr.rotation.z = 0; RN.tape.visible = true; RN.inner.visible = false; RN.inner.position.y = 0.12; RN.n = 0; RN.acc = 0; RN.busy = false; GS.snd('box'); },
  down: function () {
    if (RN.stage === 2 && near(1.06, 0.2, 2.5, 0.6)) { RN.acc += 0.11; GS.snd('pick'); return; }
    if (RN.busy || RN.stage !== 3 || !near(1.06, 0.2, 2.5, 0.6)) return;
    if (G.stock >= 15) { finishRamen(); return; }
    var p = RN.packs[G.stock], h = p.userData.home; G.stock++; RN.n++; p.visible = true; RN.busy = true; GS.snd('pack'); RN.inner.position.y = 0.12 - RN.n * 0.035;
    anim(0.28, function (t) { var e = GS.ease(t); p.position.set(GS.lerp(1.06, h.x, e), GS.lerp(0.3, h.y, e) + Math.sin(e * PI) * 0.25, GS.lerp(2.5, h.z, e)); }, function () { RN.busy = false; if (RN.n >= 5 || G.stock >= 15) finishRamen(); });
  },
  up: function () { },
  update: function (dt) {
    if (RN.stage === 2) {
      if (GS.ptr.down && near(1.06, 0.2, 2.5, 0.6)) RN.acc += GS.ptr.mv;
      if (RN.acc > 0.3) { RN.stage = 3; RN.busy = true; RN.tape.visible = false; RN.inner.visible = true; GS.snd('tape'); anim(0.3, function (t) { var e = GS.ease(t); RN.fl.rotation.z = e * 2.2; RN.fr.rotation.z = -e * 2.2; }, function () { RN.busy = false; }); }
    }
  },
  exit: function () { if (RN.stage === 2 || RN.stage === 3) { if (RN.n > 0) { RN.stage = -1; RN.box.visible = false; GS.taskDone(task('ramen')); } else { RN.stage = 0; RN.box.visible = false; RN.store.visible = true; } } }
};
function finishRamen() { RN.stage = -1; RN.busy = true; GS.ui.praise('NICE'); GS.snd('nice'); GS.taskDone(task('ramen')); setTimeout(function () { RN.box.visible = false; if (CH.cur === ST.ramen) CH.leave(); }, 600); }
// ----- 김치 -----
var KM = { stage: -1 }, NSL = 14, CABL = 0.34, CX = 2.02, CZ = 3.4, STY = [0.95, 0.95, 0.93];
function styro(b, lid) { if (lid) { b.box(0, 0.02, 0, 0.42, 0.04, 0.32, { col: STY }); b.box(0, 0.042, 0, 0.42, 0.003, 0.06, { col: [0.82, 0.74, 0.5] }); return; } b.box(0, 0.015, 0, 0.4, 0.03, 0.3, { col: STY }); b.box(-0.185, 0.11, 0, 0.03, 0.22, 0.3, { col: STY }); b.box(0.185, 0.11, 0, 0.03, 0.22, 0.3, { col: STY }); b.box(0, 0.11, -0.135, 0.4, 0.22, 0.03, { col: [0.9, 0.9, 0.88] }); b.box(0, 0.11, 0.135, 0.4, 0.22, 0.03, { col: [0.9, 0.9, 0.88] }); }
function initKimchi() {
  KM.land = new T.Group(); KM.land.add(mk(function (b) { styro(b); }, GS.M.mat)); var ll = mk(function (b) { styro(b, 1); }, GS.M.mat); ll.position.y = 0.22; KM.land.add(ll);
  var lab = W.plane(GS.TEX.label('김치 10kg', { w: 256, h: 96, bg: '#f2f2ee', fg: '#b0222a', fs: 56 }), 0.22, 0.08, 0.1, 0.264, 0.09, PI / 2, { rx: -PI / 2 }); KM.land.add(lab);
  KM.land.position.set(0.82, 0, -2.25); KM.land.rotation.y = 0.15; scene.add(KM.land);                  // 창고 바닥
  addInter({ x: 0.82, y: 0.15, z: -2.25, sx: 0.5, sy: 0.34, sz: 0.42, label: '김치', can: function () { return KM.stage === 0 && !G.carry; }, use: function () { if (!need()) return; KM.stage = 1; KM.land.visible = false; G.carry = 'kimchi'; GS.hands.carry('kimchi'); GS.snd('pick'); } });
  addInter({ x: CX, y: 0.98, z: CZ - 0.05, sx: 0.6, sy: 0.3, sz: 0.5, label: '도마', can: function () { return G.carry === 'kimchi'; }, use: function () { G.carry = null; GS.hands.carry(null); CH.enter('kimchi'); } });
  KM.box = new T.Group(); KM.box.position.set(1.53, 0.85, 3.42); KM.box.add(mk(function (b) { styro(b); }, GS.M.mat));
  KM.lid = mk(function (b) { styro(b, 1); }, GS.M.mat); KM.box.add(KM.lid);
  /* 비닐 속 김치: 메이킹김치 담긴 배추김치 그림을 둥근 무더기에 입히고, 그 위에 얇은 비닐(10/4 "코드 그림이랑 섞여 있어") */
  KM.bag = new T.Group(); (function () {
    var KT0 = window.KIMCHI_TEX || {}, ft = KT0.fill ? new T.TextureLoader().load(KT0.fill) : null; if (ft) ft.colorSpace = T.SRGBColorSpace;
    var mound = new T.Mesh(new T.SphereGeometry(0.15, 20, 12, 0, PI * 2, 0, PI / 2), new T.MeshLambertMaterial({ map: ft, color: ft ? 0xffffff : 0xcc3318 })); mound.scale.set(1.15, 0.75, 0.85); mound.position.y = 0.08; KM.bag.add(mound);
    var film = new T.Mesh(new T.SphereGeometry(0.155, 20, 12, 0, PI * 2, 0, PI / 2), new T.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, shininess: 120, specular: 0xffffff, depthWrite: false })); film.scale.copy(mound.scale); film.position.y = 0.08; KM.bag.add(film);
  })(); KM.box.add(KM.bag);
  KM.knot = new T.Group(); (function () { var vm = new T.MeshPhongMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.6, shininess: 100, specular: 0xffffff }); var c = new T.Mesh(new T.ConeGeometry(0.05, 0.1, 10), vm); c.position.y = 0.2; KM.knot.add(c); var b = new T.Mesh(new T.SphereGeometry(0.03, 10, 8), vm); b.position.y = 0.24; KM.knot.add(b); })(); KM.box.add(KM.knot);   // 비닐 매듭(투명 비닐)
  scene.add(KM.box);
  KM.cab = new T.Group(); KM.cab.position.set(CX, 0.874, CZ); KM.slabs = []; var r = GS.rng(77), sl = CABL / NSL;
  /* 포기 그림: 메이킹김치 양념 배추 반쪽(assets/kimchi-tex.js, 10/4 사장님 "김치그림을 메이킹김치에서 갖다써")을 도마에 눕혀 열네 띠로 나눔.
     띠 셋을 2mm 씩 겹쳐 아래 둘은 어둡게 → 두께. 썰면 띠가 벌어지는 건 예전 그대로 */
  var KT = window.KIMCHI_TEX || {}, ktx = KT.cab ? new T.TextureLoader().load(KT.cab) : null, CABW = CABL * (KT.cabAR || 0.68);
  if (ktx) ktx.colorSpace = T.SRGBColorSpace;
  var kmats = [1, 0.62, 0.42].map(function (k) { return new T.MeshLambertMaterial({ map: ktx, color: new T.Color(k, k, k), transparent: true, alphaTest: 0.35, side: T.DoubleSide }); });
  for (var i = 0; i < NSL; i++) {
    var m = new T.Group(), u0 = i / NSL, u1 = (i + 1) / NSL;
    for (var L = 0; L < 3; L++) {
      var g = new T.PlaneGeometry(sl * 1.01, CABW), uv = g.attributes.uv;
      for (var q = 0; q < uv.count; q++) uv.setX(q, u0 + uv.getX(q) * (u1 - u0));
      var pm = new T.Mesh(g, kmats[L]); pm.rotation.x = -PI / 2; pm.position.y = -0.016 - L * 0.009; m.add(pm);
    }
    m.userData.x0 = -CABL / 2 + (i + 0.5) * sl; m.position.set(m.userData.x0, 0.045, 0); KM.cab.add(m); KM.slabs.push(m);
  }
  scene.add(KM.cab);
  KM.tub = new T.Group(); KM.tub.position.set(2.48, 0.85, 3.42); var TR = [0.8, 0.1, 0.1];
  KM.tub.add(mk(function (b) { b.box(0, 0.008, 0, 0.3, 0.016, 0.24, { col: TR }); b.box(-0.143, 0.09, 0, 0.014, 0.18, 0.24, { col: TR }); b.box(0.143, 0.09, 0, 0.014, 0.18, 0.24, { col: TR }); b.box(0, 0.09, -0.113, 0.3, 0.18, 0.014, { col: [0.72, 0.08, 0.08] }); b.box(0, 0.09, 0.113, 0.3, 0.18, 0.014, { col: [0.72, 0.08, 0.08] }); }));
  KM.fill = new T.Group();                                   // 김치통 속: 메이킹김치 담긴 배추김치 그림
  (function () { var ft = KT.fill ? new T.TextureLoader().load(KT.fill) : null; if (ft) ft.colorSpace = T.SRGBColorSpace; var fp = new T.Mesh(new T.PlaneGeometry(0.27, 0.21), new T.MeshLambertMaterial({ map: ft, color: ft ? 0xffffff : 0xd84418 })); fp.rotation.x = -PI / 2; KM.fill.add(fp); })();
  KM.tub.add(KM.fill);
  KM.tlid = mk(function (b) { b.box(0, 0, 0, 0.32, 0.02, 0.26, { col: [0.86, 0.14, 0.12] }); b.box(0, 0.014, 0, 0.1, 0.012, 0.04, { col: [0.95, 0.95, 0.9] }); }); KM.tub.add(KM.tlid);
  scene.add(KM.tub);
}
function resetKimchi() {
  var t = task('kimchi'); KM.stage = t && !t.done ? 0 : -1; KM.land.visible = KM.stage === 0; KM.box.visible = false; KM.cab.visible = false; KM.tub.visible = false; KM.busy = false;
}
function newCab() {
  KM.cuts = []; KM.cab.visible = true; KM.last = null; KM.busy = true; GS.snd('plop');
  KM.slabs.forEach(function (m) { m.visible = true; m.position.set(m.userData.x0, 0.045, 0); m.rotation.set(0, 0, 0); m.userData.tx = null; });
  anim(0.35, function (t) { var e = GS.ease(t); KM.cab.position.set(GS.lerp(1.53, CX, e), 0.874 + GS.lerp(0.2, 0, e) + Math.sin(e * PI) * 0.2, GS.lerp(3.42, CZ, e)); }, function () { KM.busy = false; });
}
function layCab() { KM.slabs.forEach(function (m, i) { var n = 0; KM.cuts.forEach(function (c) { if (c <= i) n++; }); m.userData.tx = m.userData.x0 + (n - KM.cuts.length / 2) * 0.014; }); }
ST.kimchi = {
  cam: [2.03, 1.62, 2.66], look: [2.03, 0.88, 3.42], tool: 'knife',
  enter: function () { KM.stage = 2; KM.box.visible = true; KM.lid.visible = true; KM.lid.position.set(0, 0.22, 0); KM.lid.rotation.set(0, 0, 0); KM.bag.visible = true; KM.knot.visible = true; KM.knot.scale.set(1, 1, 1); KM.tub.visible = true; KM.tlid.visible = false; KM.fill.visible = false; KM.cab.visible = false; KM.heads = 0; KM.acc = 0; KM.knots = 3; KM.busy = false; GS.snd('box'); },
  down: function () {
    if (KM.busy) return;
    if (KM.stage === 2 && near(1.53, 1.0, 3.42, 0.45)) { KM.acc += 0.11; GS.snd('pick'); }
    if (KM.stage === 3 && near(1.53, 1.0, 3.42, 0.45)) {
      KM.knots--; GS.snd('pick'); KM.knot.scale.set(1 + (3 - KM.knots) * 0.25, 1 - (3 - KM.knots) * 0.28, 1 + (3 - KM.knots) * 0.25);
      if (KM.knots <= 0) { KM.knot.visible = false; KM.stage = 4; newCab(); }
    } else if (KM.stage === 5 && near(2.48, 0.95, 3.42, 0.45)) {
      KM.busy = true; KM.tlid.visible = true;
      anim(0.25, function (t) { KM.tlid.position.set(0, GS.lerp(0.45, 0.19, GS.ease(t)), 0); }, function () {
        GS.snd('lid'); GS.ui.praise('NICE'); KM.stage = 6;
        setTimeout(function () { KM.tub.visible = false; KM.box.visible = false; G.carry = 'tub'; GS.hands.carry('tub'); if (CH.cur === ST.kimchi) CH.leave(); }, 450);
      });
    }
    KM.last = null;
  },
  up: function () { KM.last = null; },
  update: function (dt) {
    var P = GS.ptr, i;
    if (KM.stage === 2) {
      if (P.down && near(1.53, 1.0, 3.42, 0.45)) KM.acc += P.mv;
      if (KM.acc > 0.3) { KM.stage = 3; KM.busy = true; GS.snd('tape'); anim(0.4, function (t) { KM.lid.position.set(-t * 0.5, 0.22 + Math.sin(t * PI) * 0.3, t * 0.2); KM.lid.rotation.z = t * 2; }, function () { KM.lid.visible = false; KM.busy = false; }); }
    }
    if (KM.stage === 4 && !KM.busy) {
      KM.slabs.forEach(function (m) { if (m.userData.tx != null) m.position.x += (m.userData.tx - m.position.x) * Math.min(1, dt * 14); });
      if (P.down) {
        var h = planeHit(0.93);
        if (h) {
          if (KM.last && (KM.last.z - CZ) * (h.z - CZ) < 0) {
            var x = GS.lerp(KM.last.x, h.x, (CZ - KM.last.z) / (h.z - KM.last.z)) - CX, ci = Math.round((x + CABL / 2) / (CABL / NSL));
            if (Math.abs(x) < CABL / 2 + 0.02) {
              ci = GS.clamp(ci, 1, NSL - 1); var ok = true; for (i = 0; i < KM.cuts.length; i++) if (Math.abs(KM.cuts[i] - ci) < 2) ok = false;
              if (ok) { KM.cuts.push(ci); layCab(); GS.snd('chop'); GS.hands.jab(); burst(drops, CX + x, 0.95, CZ, 4, 0.5, 0.8, 0.25); if (KM.cuts.length >= (G.items.knife ? 3 : 4)) tubIt(); }
            }
          }
          KM.last = KM.last || new T.Vector3(); KM.last.copy(h);
        }
      } else KM.last = null;
    }
  },
  exit: function () { if (KM.stage >= 2 && KM.stage < 6) { KM.stage = 0; KM.box.visible = false; KM.cab.visible = false; KM.tub.visible = false; KM.land.visible = true; } }
};
function tubIt() {
  KM.busy = true; var a = KM.slabs.map(function (m) { return m.position.clone(); });
  setTimeout(function () {
    GS.snd('plop');
    anim(0.45, function (t) { var e = GS.ease(t); KM.slabs.forEach(function (m, i) { m.position.set(GS.lerp(a[i].x, 0.46 + (i % 5 - 2) * 0.03, e), a[i].y + Math.sin(e * PI) * 0.22 + e * 0.02, GS.lerp(0, 0.02, e)); m.rotation.y = e * (i % 3 - 1) * 1.2; }); }, function () {
      KM.cab.visible = false; KM.heads++; KM.fill.visible = true; KM.fill.position.y = 0.03 + KM.heads * 0.045; GS.ui.praise(KM.heads < 3 ? 'GOOD' : 'GREAT'); GS.snd('nice');
      if (KM.heads < 3) newCab(); else { KM.stage = 5; KM.busy = false; KM.bag.visible = false; }
    });
  }, 220);
}

CH.update = function (dt) {
  var i, a;
  for (i = anims.length - 1; i >= 0; i--) { a = anims[i]; a.t += dt; a.fn(Math.min(1, a.t / a.d)); if (a.t >= a.d) { anims.splice(i, 1); if (a.end) a.end(); } }
  var fy = Math.round(G.P.y / GS.FH) * GS.FH; drops.floor = fy + 0.01; grains.floor = 0.66;
  foam.update(dt); spark.update(dt); drops.update(dt); grains.update(dt);
  if (CH.cur) CH.cur.update(dt);
  if (RC.cooking && G.mode === 'day') {
    if (G.t < RC.doneAt) { if (G.P.y < 1 && Math.random() < dt * 5) foam.emit(RC.c.x + (Math.random() - 0.5) * 0.05, RC.c.y + 0.34, RC.c.z, 0, 0.25, 0, 1.2); }
    else if (!RC.kept) { RC.kept = true; RC.led.material.color.set(0xffa030); if (G.P.y < 1 && G.P.x < 7) GS.snd('click'); }
  }
};
CH.riceReset = function () { RC.kept = false; };
})();