/* 새우잡이배 — 효과: 알갱이 무리(물방울·거품·반짝이·비늘), 갑판 때(문지른 만큼 지워짐), 짧은 움직임, 줄 */
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, FX = SB.fx = {}, grp;
function Pool(n, size, color, grav, add) {
  this.n = n; this.i = 0; this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.grav = grav || 0; this.floor = D + 0.01;
  for (var i = 0; i < n; i++) this.pos[i * 3 + 1] = -99;
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(this.pos, 3));
  var c = document.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  this.pts = new T.Points(g, new T.PointsMaterial({ size: size, map: new T.CanvasTexture(c), color: color, transparent: true, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending }));
  this.pts.frustumCulled = false; grp.add(this.pts);
}
Pool.prototype.emit = function (x, y, z, vx, vy, vz, life) { var i = this.i; this.i = (i + 1) % this.n; this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz; this.life[i] = life; };
Pool.prototype.update = function (dt) {
  for (var i = 0; i < this.n; i++) {
    if (this.life[i] <= 0) continue; this.life[i] -= dt;
    if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -99; continue; }
    this.vel[i * 3 + 1] -= this.grav * dt; this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
    var fl = Math.abs(this.pos[i * 3 + 2]) < SB.boat.innerZ(this.pos[i * 3]) ? this.floor : -0.2;
    if (this.pos[i * 3 + 1] < fl) { this.pos[i * 3 + 1] = fl; this.vel[i * 3 + 1] = 0; this.vel[i * 3] *= 0.4; this.vel[i * 3 + 2] *= 0.4; }
  }
  this.pts.geometry.attributes.position.needsUpdate = true;
};
var pools = {};
FX.burst = function (kind, x, y, z, n, sp, up, life) { var p = pools[kind]; for (var i = 0; i < n; i++) p.emit(x, y, z, (Math.random() - 0.5) * sp, up * (0.4 + Math.random()), (Math.random() - 0.5) * sp, life * (0.6 + Math.random() * 0.6)); };
FX.emit = function (kind, x, y, z, vx, vy, vz, life) { pools[kind].emit(x, y, z, vx, vy, vz, life); };
FX.splash = function (x, z, big) { var y = 0.05; FX.burst('drops', x, y, z, big ? 40 : 18, big ? 2.4 : 1.4, big ? 4 : 2.6, 0.9); FX.burst('foam', x, y + 0.05, z, big ? 14 : 6, 1.2, 0.6, 1.2); };

/* ---------- 때: 작은 그림(24x24)의 투명도를 문지른 만큼 지운다 ---------- */
var SN = 24, stains = FX.stains = [];
var KIND = { slime: [150, 140, 110], scale: [200, 205, 200], gut: [120, 50, 40], ink: [30, 28, 35], mud: [90, 78, 60] };
FX.makeStain = function (o) {
  var r = SB.rng(o.seed || 1), data = new Uint8Array(SN * SN * 4), mask = new Float32Array(SN * SN), col = KIND[o.kind || 'slime'], lob = [], i, j, k, sum = 0;
  for (k = 0; k < 5; k++) lob.push([0.5 + (r() - 0.5) * 0.45, 0.5 + (r() - 0.5) * 0.45, 0.16 + r() * 0.16]);
  for (j = 0; j < SN; j++) for (i = 0; i < SN; i++) {
    var u = (i + 0.5) / SN, v = (j + 0.5) / SN, m = 0;
    for (k = 0; k < lob.length; k++) { var d = Math.sqrt((u - lob[k][0]) * (u - lob[k][0]) + (v - lob[k][1]) * (v - lob[k][1])) / lob[k][2]; m = Math.max(m, 1 - d * d); }
    var e = Math.min(u, v, 1 - u, 1 - v) * 7; m = Math.max(0, Math.min(1, m * 1.5)) * Math.min(1, e) * (0.7 + r() * 0.3); if (m < 0.08) m = 0;
    var id = j * SN + i, sh = 0.8 + r() * 0.35; mask[id] = m; sum += m;
    data[id * 4] = Math.min(255, col[0] * sh); data[id * 4 + 1] = Math.min(255, col[1] * sh); data[id * 4 + 2] = Math.min(255, col[2] * sh); data[id * 4 + 3] = m * 230;
  }
  var tex = new T.DataTexture(data, SN, SN, T.RGBAFormat); tex.magFilter = tex.minFilter = T.LinearFilter; tex.colorSpace = T.SRGBColorSpace; tex.needsUpdate = true;
  var mesh = new T.Mesh(new T.PlaneGeometry(o.w, o.w), new T.MeshPhongMaterial({ map: tex, transparent: true, depthWrite: false, shininess: 90, specular: 0x666655, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.position.set(o.x, D + 0.004, o.z); mesh.rotation.set(-PI / 2, 0, o.rot || 0); grp.add(mesh);
  var st = { mesh: mesh, mask: mask, data: data, tex: tex, sum: sum, sum0: sum, w: o.w, tough: o.tough || 1, done: false };
  mesh.userData.st = st; stains.push(st); return st;
};
FX.scrubStain = function (st, uv, amt, power) {    // amt: 이번에 문지른 길이(m)
  var Rr = 0.16, rate = Math.min(0.55, amt * 6.5) * (power || 1) / st.tough, i, j;
  var cu = uv.x * SN, cv = uv.y * SN, ru = Rr / st.w * SN, i0 = Math.max(0, Math.floor(cu - ru)), i1 = Math.min(SN - 1, Math.ceil(cu + ru)), j0 = Math.max(0, Math.floor(cv - ru)), j1 = Math.min(SN - 1, Math.ceil(cv + ru));
  for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) {
    var id = j * SN + i, d = Math.hypot((i + 0.5 - cu) / ru, (j + 0.5 - cv) / ru); if (d > 1 || st.mask[id] <= 0) continue;
    var dm = Math.min(st.mask[id], rate * (1 - d * 0.6)); st.mask[id] -= dm; st.sum -= dm; st.data[id * 4 + 3] = st.mask[id] * 230;
  }
  st.tex.needsUpdate = true;
  if (st.sum < st.sum0 * 0.1 && !st.done) { st.done = true; return true; }
  return false;
};
FX.killStain = function (st) { st.done = true; grp.remove(st.mesh); st.mesh.geometry.dispose(); st.mesh.material.dispose(); st.tex.dispose(); var k = stains.indexOf(st); if (k >= 0) stains.splice(k, 1); };
FX.clearStains = function () { stains.slice().forEach(FX.killStain); };

/* ---------- 짧은 움직임 ---------- */
var anims = [];
FX.anim = function (dur, fn, end) { anims.push({ t: 0, d: dur, fn: fn, end: end }); };
/* 두 점 사이 원통 하나(밧줄): 길이 1짜리를 늘여 쓴다 */
var _a = new T.Vector3(), _up = new T.Vector3(0, 1, 0), _dir = new T.Vector3();
FX.rope = function (r, mat) { var g = new T.CylinderGeometry(r, r, 1, 6, 1, true); g.translate(0, 0.5, 0); var m = new T.Mesh(g, mat || SB.M.rope); m.castShadow = true; grp.add(m); return m; };
FX.setRope = function (m, a, b) { _dir.copy(b).sub(a); var l = _dir.length(); if (l < 1e-4) { m.visible = false; return; } m.visible = true; m.position.copy(a); m.quaternion.setFromUnitVectors(_up, _dir.multiplyScalar(1 / l)); m.scale.set(1, l, 1); };

FX.init = function (boatGroup) {
  grp = boatGroup;
  pools.drops = new Pool(260, 0.05, 0xcfe6f0, 9.8); pools.foam = new Pool(140, 0.09, 0xffffff, 1.5); pools.spark = new Pool(60, 0.08, 0xfff4b0, 0, true);
  pools.scale = new Pool(80, 0.025, 0xe8f0f0, 6); pools.flame = new Pool(60, 0.035, 0x4a8cff, -0.6, true); pools.steam = new Pool(60, 0.12, 0xffffff, -0.3); pools.rain = new Pool(500, 0.035, 0xb8c8d0, 14);
  pools.rain.pts.material.opacity = 0.5; pools.steam.pts.material.opacity = 0.35; pools.flame.floor = -9; pools.steam.floor = -9;
};
FX.clear = function () { Object.keys(pools).forEach(function (k) { var p = pools[k]; for (var i = 0; i < p.n; i++) { p.life[i] = 0; p.pos[i * 3 + 1] = -99; } p.pts.geometry.attributes.position.needsUpdate = true; }); };
FX.update = function (dt) {
  Object.keys(pools).forEach(function (k) { pools[k].update(dt); });
  for (var i = anims.length - 1; i >= 0; i--) { var a = anims[i]; a.t += dt; var t = Math.min(1, a.t / a.d); a.fn(t); if (t >= 1) { anims.splice(i, 1); if (a.end) a.end(); } }
};
})();
