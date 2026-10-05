// 새우잡이배 — 하루 흐름, 시계, 이동, 입력, 화면 글, 저장
(function () {
'use strict';
var T = THREE, D = SB.D, PI = Math.PI, $ = function (id) { return document.getElementById(id); };
var KEY = 'shrimpboat.save', DAYS = 30, EYE = 1.6, DAYH = 36, NIGHTH = 25, WALK = 2.6, RUN = 4.4;
var EN = SB.EN = /[?&]lang=en/.test(location.search); SB.L = function (ko, en) { return EN ? en : ko; }; var L = SB.L;
if (EN) { document.body.classList.add('en'); document.documentElement.lang = 'en'; document.title = 'Shrimp Boat'; }
var G = SB.G = { mode: 'title', day: 1, t: 4, tasks: [], inv: {}, parts: {}, taken: {}, dropped: {}, flags: {}, carry: null, holding: null, P: { x: 4.6, z: -1.3, yaw: PI / 2, pitch: 0, face: -PI / 2 }, idle: 0, view: 3 };
function third() { return G.mode === 'day' || G.mode === 'night'; }                 // 3인칭 하나로(사장님 10/3 "걍 3인칭으로 통일하자")
SB.third = third;
function makeTasks(d) {
  var a = [{ id: 'net', n: d >= 10 ? 3 : d >= 4 ? 2 : 1, done: 0 }, { id: 'deck', n: 1, done: 0 }];
  if (d >= 2) a.push({ id: 'ramen', n: 1, done: 0 });
  return a;
}
SB.taskOf = function (id) { for (var i = 0; i < G.tasks.length; i++) if (G.tasks[i].id === id) return G.tasks[i]; return null; };
SB.allDone = function () { return G.tasks.length && G.tasks.every(function (t) { return t.done >= t.n; }); };
function left() { var n = 0; G.tasks.forEach(function (t) { n += Math.max(0, t.n - t.done); }); return n; }
SB.taskProgress = function () { G.idle = 0; ui.tasks(); save(); if (G.mode === 'day' && SB.allDone() && !G.doneSaid) { G.doneSaid = true; SB.cap.say('done'); setTimeout(function () { if (G.mode === 'day') toNight(); }, 2600); } };
SB.islandNight = function () { return G.mode === 'night' && G.day % 5 === 0; };
function stormDay(d) { return d % 7 === 6; }

// ---------- 저장 ----------
function save() {
  if (G.mode !== 'day' && G.mode !== 'night') return;
  var s = { v: 1, mode: G.mode, day: G.day, t: G.t, inv: G.inv, parts: G.parts, taken: G.taken, dropped: G.dropped, flags: G.flags, mood: SB.cap.mood, tasks: G.tasks.map(function (t) { return t.done; }) };
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
}
function load() { try { var s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} }
SB.save = save;

// ---------- 화면 글 ----------
var ui = SB.ui = {};
function hh(t) { var m = Math.floor(t * 60) % 1440, h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
ui.hud = function () {
  $('vDay').textContent = 'DAY ' + G.day; $('vClock').textContent = hh(G.t);
  $('sClock').classList.toggle('late', G.mode === 'day' && G.t > 17);
  $('vTask').textContent = left(); $('vRaft').textContent = SB.night.count() + '/12';
};
ui.tasks = function () {
  var h = '';
  if (G.mode === 'day') G.tasks.forEach(function (t) {
    var nm = { net: L('그물', 'Nets'), deck: L('갑판 청소', 'Deck'), ramen: L('선장 라면', 'Ramen') }[t.id], dn = t.done >= t.n;
    h += '<div class="' + (dn ? 'done' : '') + '"><span>' + nm + '</span><b>' + (dn ? '&#10004;' : t.n > 1 ? t.done + '/' + t.n : '') + '</b></div>';
  });
  $('tasks').innerHTML = h; ui.hud();
};
ui.praise = function (w) { var p = $('praise'); p.textContent = w; p.classList.remove('on'); void p.offsetWidth; p.classList.add('on'); };
ui.toast = function (w, good) { var p = $('toast'); p.textContent = w; p.className = good ? 'good' : ''; void p.offsetWidth; p.classList.add('on'); };
ui.nope = function (kind) {
  SB.snd('nope'); var el = $('sTask');
  if (kind === 'deck' || kind === 'net') { document.body.classList.add('showtasks'); if (kind === 'deck' && SB.work.stainsLeft() > 0) SB.cap.say('deck'); }
  if (kind === 'raft') el = $('sRaft');
  if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
};
var bubbleOn = false, zzzV = -1;
ui.bubble = function (txt) { var b = $('bubble'); if (!txt) { b.hidden = true; bubbleOn = false; return; } b.textContent = txt; b.hidden = false; bubbleOn = true; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); };
ui.zzz = function (v) { zzzV = v; var z = $('zzz'); if (v < 0) { z.hidden = true; return; } z.hidden = false; z.textContent = v > 0.62 ? '?' : 'Z z z'; z.classList.toggle('warn', v > 0.62); };
ui.gauge = function (on, t, p) {
  var g = $('gauge'); g.hidden = !on; if (!on) return; g.classList.toggle('holding', !!SB.haul.hold);
  $('needle').style.transform = 'rotate(' + (-90 + SB.clamp(t, 0, 1.15) / 1.15 * 180) + 'deg)'; $('gprog').style.width = (p * 100).toFixed(1) + '%';
};
ui.shake = function () { var g = $('gauge'); g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake'); };
ui.flash = function () { var f = $('hitf'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); };
ui.fade = function (on) { $('fade').classList.toggle('on', on); ui.fading = on; };
ui.meter = function (v) { $('mfill').style.width = (Math.min(1, v) * 100) + '%'; $('meter').classList.toggle('hot', v > 0.6); };
ui.lit = function (on) { document.body.classList.toggle('lit', !!on); };
ui.paddle = function (on) { $('meter').hidden = !on; document.body.classList.toggle('rowing', on); };
SB.snd = function (n) { SND.play(n); };
SB.setMode = function (m) { G.mode = m; ui.zzz(-1); ui.bubble(null); document.body.className = document.body.className.replace(/\bm-\w+/g, '').trim() + ' m-' + m; document.body.classList.toggle('playing', m === 'day' || m === 'night' || m === 'escape'); ui.tasks(); };
function show(id, on) { $(id).hidden = !on; }

// ---------- 그리기 준비 ----------
var cv = $('gl'), renderer, scene, cam, S, paused = false, touchMode = false, locked = false;
var ptr = SB.ptr = { x: 0, y: 0, down: false }, rc = new T.Raycaster(), lray = new T.Ray(); SB.ptrLocal = new T.Ray();
function initGL() {
  renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.autoClear = false;
  var mob = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent); renderer.shadowMap.enabled = !mob; renderer.shadowMap.type = T.PCFSoftShadowMap;
  scene = new T.Scene();
  cam = SB.cam = new T.PerspectiveCamera(70, 1, 0.05, 900); cam.rotation.order = 'YXZ';
  SB.M = SB.makeMaterials();
  S = SB.sea = SEA.build(scene, mob);
  SB.boat.build(scene); SB.fx.init(SB.boat.group);
  SB.haul.init(); SB.sort.init(); SB.work.init(); SB.cap.init(SB.boat.group); SB.cap.initInter(); SB.night.init(); SB.boat.inMain(4.55, -0.45, 0.28); SB.escape.init(scene); SB.hero.init(SB.boat.group); SB.story.init(scene); SB.tut.init();
  gulls(); resize();
}
function resize() {
  var w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  renderer.setSize(w, h, false); cam.aspect = SB.aspect = w / h; cam.fov = w / h < 1.5 ? 76 : 70; cam.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
/* 갈매기: 배 둘레를 돈다(낮에만) */
var gl = [];
function gulls() {
  var wm = new T.MeshLambertMaterial({ color: 0xf2f2ee, emissive: 0x8a8f96, side: T.DoubleSide }), bm = new T.MeshLambertMaterial({ color: 0xfafaf6, emissive: 0x8a8f96 }), tm = new T.MeshLambertMaterial({ color: 0x3a3a3a, side: T.DoubleSide });
  for (var i = 0; i < 5; i++) {
    var g = new T.Group(), b = new T.Mesh(new T.SphereGeometry(0.12, 8, 6), bm); b.scale.set(1, 0.8, 2.4); g.add(b);
    [-1, 1].forEach(function (s) { var wg = new T.Group(), w = new T.Mesh(new T.PlaneGeometry(0.7, 0.22), wm); w.position.x = s * 0.35; w.rotation.x = -PI / 2; wg.add(w); var tip = new T.Mesh(new T.PlaneGeometry(0.2, 0.18), tm); tip.position.x = s * 0.62; tip.rotation.x = -PI / 2; wg.add(tip); g.add(wg); g.userData[s] = wg; });
    g.userData.r = 9 + Math.random() * 14; g.userData.h = 7 + Math.random() * 6; g.userData.a = Math.random() * 6.28; g.userData.s = (0.25 + Math.random() * 0.2) * (i % 2 ? 1 : -1); g.userData.f = Math.random() * 6;
    scene.add(g); gl.push(g);
  }
}
function gullUpdate(dt, night) {
  gl.forEach(function (g) {
    var u = g.userData; g.visible = !night && G.mode !== 'escape'; if (!g.visible) return;
    u.a += u.s * dt; u.f += dt * 7; var bp = SB.boat.group.position;
    g.position.set(bp.x + Math.cos(u.a) * u.r, u.h + Math.sin(u.a * 2.3) * 1.2, bp.z + Math.sin(u.a) * u.r); g.rotation.y = -u.a + (u.s > 0 ? 0 : PI);
    var fl = Math.sin(u.f) * 0.5; g.userData[-1].rotation.z = fl; g.userData[1].rotation.z = -fl;
    if (Math.random() < dt * 0.04) SB.snd('gull');
  });
}

// ---------- 작업대(그물 감기·고르기·라면) ----------
var st = SB.station = { cur: null, blend: 0 }, stQ = new T.Quaternion(), stP = new T.Vector3(), fpQ = new T.Quaternion(), fpP = new T.Vector3(), _m4 = new T.Matrix4(), _e = new T.Euler(0, 0, 0, 'YXZ');
st.enter = function (pose, h) {
  st.cur = { pose: pose, h: h || {} }; ptr.down = false; ptr.x = ptr.y = 0; st.sp = 0; stopScrub();
  if (pose.at) { G.P.x = pose.at[0]; G.P.z = pose.at[1]; G.P.face = pose.at[2]; }                     // 주인공을 작업 자리에 세운다
  stP.set(pose.cam[0], pose.cam[1], pose.cam[2]); _m4.lookAt(stP, new T.Vector3(pose.look[0], pose.look[1], pose.look[2]), new T.Vector3(0, 1, 0)); stQ.setFromRotationMatrix(_m4);
  document.body.classList.add('st'); unlockPtr(); SB.snd('tap');
};
st.leave = function () {
  if (!st.cur) return; var c = st.cur; st.cur = null; if (c.h.exit) c.h.exit(); SB.hero.R = SB.hero.L = null;
  document.body.classList.remove('st'); ptr.down = false; ptr.x = ptr.y = 0; if (!touchMode && (G.mode === 'day' || G.mode === 'night')) lockPtr();
};
SB.carry = function (k) { G.carry = k; SB.hero.hold(k); document.body.classList.toggle('carrying', !!k); };

// ---------- 하루 흐름 ----------
var titleT = 0, endPose = null;
function placePlayer() { G.P.x = 4.55; G.P.z = -0.45; G.P.yaw = PI / 2 - 0.7; G.P.pitch = -0.3; G.P.face = -PI / 2; }
function weather() { var sd = stormDay(G.day); S.sea = sd ? 2.1 : 1; S.storm = sd ? 1 : 0; SB.escape.showIsland(G.day % 5 === 0, G.mode === 'night'); }
function newGame() {
  G.day = 1; G.inv = {}; G.parts = {}; G.taken = {}; G.dropped = {}; G.flags = {}; SB.cap.mood = 0; SB.tut.reset();
  if (!G.warm2 && SB.hero.ready) { G.warm2 = true; warm(); }
  resetWorld(); show('title', false); show('end', false); unlockPtr(); SND.music(0);
  if (cam.parent) cam.parent.remove(cam); scene.add(cam);
  SB.story.play(function () { ui.fade(true); setTimeout(function () { startDay(true); }, 600); });
}
btn('skip', function () { SB.story.end(); });
function resetWorld() {
  if (st.cur) st.leave(); stopScrub(); cine = null; G.busy = false; SB.carry(null); G.holding = null; SB.fx.clearStains(); SB.fx.clear(); SB.sort.reset(); SB.haul.reset(); SB.work.resetRamen(); SB.boat.I.holdIce.visible = false; SB.boat.I.lid.rotation.z = 0;
  SB.escape.stop(); SB.hero.stand(); SB.hero.toBoat(); G.heroEnd = false; if (cam.parent !== SB.boat.group) { if (cam.parent) cam.parent.remove(cam); SB.boat.group.add(cam); }
}
function startDay(fresh, s) {
  resetWorld(); SB.setMode('day'); G.busy = false; G.doneSaid = false; G.idle = 0; G.late = false;
  G.t = fresh ? 4 : s.t; G.tasks = makeTasks(G.day); if (!fresh) G.tasks.forEach(function (t, i) { t.done = Math.min(t.n, s.tasks[i] || 0); });
  if (!fresh && SB.taskOf('net').done > 0) SB.work.spawnStains(Math.min(4, SB.taskOf('net').done * 2));
  placePlayer(); weather(); SB.night.setup(); SB.cap.place('helm'); ui.tasks(); save();
  show('title', false); show('end', false); show('pause', false); paused = false;
  morning('DAY ' + G.day, stormDay(G.day) ? L('폭풍', 'STORM') : G.day % 5 === 0 ? L('섬', 'ISLAND') : '');
  SND.music(1); if (fresh) setTimeout(function () { SB.snd('alarm'); SB.cap.say('morning'); }, 1300);
  if (!touchMode) lockPtr();
}
function morning(a, b) { $('mday').textContent = a; $('msub').textContent = b; var m = $('morn'); m.hidden = false; m.classList.remove('go'); void m.offsetWidth; m.classList.add('go'); ui.fade(true); setTimeout(function () { ui.fade(false); }, 350); setTimeout(function () { m.hidden = true; }, 2300); }
function toNight(t) {
  ui.fade(true);
  setTimeout(function () {
    resetWorld(); SB.setMode('night'); G.t = t || 21; placePlayer(); weather(); SB.cap.place('sleep'); SB.night.setup(); ui.tasks(); save();
    morning(hh(G.t), SB.islandNight() ? L('섬', 'ISLAND') : ''); if (!touchMode) lockPtr();
  }, 700);
}
SB.toBed = function (forced) {
  if (G.mode === 'day') { if (SB.allDone()) toNight(); return; }
  if (G.mode !== 'night') return;
  if (G.holding) { G.taken[G.holding] = false; G.holding = null; SB.night.vis(); }
  SB.setMode('sleep'); ui.fade(true); SB.snd(forced ? 'down' : 'tap');
  setTimeout(nextDay, 900);
};
function nextDay() { G.day++; if (G.day > DAYS) { ending(false); return; } startDay(true); }
function beaten() {                                     // 밤 8시가 넘도록 못 끝냄: 맞고 그날 밤은 없다
  G.late = true; SB.cap.say('late'); if (st.cur) st.leave();
  setTimeout(function () { SB.snd('hit'); ui.flash(); SB.setMode('sleep'); ui.fade(true); setTimeout(nextDay, 1300); }, 1200);
}
function ending(win) {
  resetWorld(); wipe(); SB.setMode('end'); SND.music(0); unlockPtr(); paused = false; show('title', false); show('pause', false);
  $('endW').textContent = win ? L('탈출 성공', 'ESCAPED') : L('1년 더', 'ONE MORE YEAR'); $('endW').className = win ? '' : 'fail'; show('end', true); ui.fade(false);
  if (win) {
    S.dayT = 0.015; S.sea = 0.8; S.storm = 0; SB.escape.showIsland(true, false); if (cam.parent) cam.parent.remove(cam); scene.add(cam);
    var b = SB.escape.beach, bp = SB.boat.group.position, dx = bp.x - b.x, dz = bp.z - b.z, dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
    var hx = b.x - dx * 2, hz = b.z - dz * 2; SB.hero.toWorld(scene, hx, 0.45, hz, Math.atan2(dx, dz)); G.heroEnd = true;            // 해변에 서서 떠나온 배를 본다
    endPose = { p: new T.Vector3(hx - dx * 3.2 - dz * 1.4, 2.1, hz - dz * 3.2 + dx * 1.4), l: new T.Vector3(hx + dx * 20, 1.2, hz + dz * 20) }; SB.cap.place('watch'); SB.snd('end');
  }
  else { endPose = null; G.t = 6.5; SB.cap.place('watch'); G.P.x = 0.35; G.P.z = -0.75; G.P.face = Math.atan2(-0.35, -0.7); G.heroEnd = true; SB.cap.say('laugh'); SB.snd('fail'); }
}
SB.ending = ending;
function toTitle() {
  resetWorld(); SB.setMode('title'); paused = false; unlockPtr(); if (cam.parent) cam.parent.remove(cam); scene.add(cam);
  show('title', true); show('end', false); show('pause', false); show('confirm', false); show('morn', false); ui.fade(false);
  var s = load(); show('bStart', !s); show('bCont', !!s); show('bNew', !!s); SND.music(0); S.sea = 1; S.storm = 0; SB.escape.showIsland(false); SB.cap.place('helm');
}
function cont() {
  var s = load(); if (!s) return newGame();
  G.day = s.day; G.inv = s.inv || {}; G.parts = s.parts || {}; G.taken = s.taken || {}; G.dropped = s.dropped || {}; G.flags = s.flags || {}; SB.cap.mood = s.mood || 0;
  Object.keys(G.taken).forEach(function (k) { if (!G.parts[k] && k !== 'compass') G.taken[k] = false; });
  if (s.mode === 'night') { startDay(false, { t: 4, tasks: [] }); toNight(s.t); } else startDay(false, s);
}
function pause(on) { if (G.mode !== 'day' && G.mode !== 'night' && G.mode !== 'escape') return; paused = on; show('pause', on); document.body.classList.toggle('paused', on); if (on) { unlockPtr(); keys = {}; if (ptr.down && st.cur && st.cur.h.up) st.cur.h.up(); ptr.down = false; SND.loop('winch', 0); } else if (!st.cur && !touchMode && G.mode !== 'escape') lockPtr(); }

// ---------- 입력 ----------
var keys = {}, press = null, unlockAt = 0, progExit = false, pad = { x: 0, y: 0, id: null, run: false }, actHeld = false;
function lockPtr() { if (touchMode || !cv.requestPointerLock) return; try { var p = cv.requestPointerLock(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
function unlockPtr() { if (document.pointerLockElement === cv) { progExit = true; document.exitPointerLock(); } }
document.addEventListener('pointerlockchange', function () {
  var was = locked; locked = document.pointerLockElement === cv; ptr.down = false; press = null;
  if (locked) { ptr.x = ptr.y = 0; progExit = false; return; }
  unlockAt = performance.now();
  if (was && !progExit && (G.mode === 'day' || G.mode === 'night') && !paused && !st.cur) pause(true);
  progExit = false;
});
function ndc(e) { ptr.x = e.clientX / window.innerWidth * 2 - 1; ptr.y = -(e.clientY / window.innerHeight * 2 - 1); }
function rayAt(x, y) { rc.setFromCamera({ x: x, y: y }, cam); return rc.ray; }
function walkMode() { return (G.mode === 'day' || G.mode === 'night') && !st.cur && !paused && !ui.fading && !G.busy; }
/* 3인칭 기본 조작: 몸 가까이(1.3m 안), 앞쪽에 있는 것 하나를 고른다. 때도 여기에 든다(E 길게 = 솔로 닦기) */
function use() { var it = pick(); if (!it) return false; G.idle = 0; if (it.stain) startScrub(it.stain); else it.use(); return true; }
function useAt() { return use(); }
function pick() {
  var best = null, bs = 1e9, fx = Math.sin(G.P.face), fz = Math.cos(G.P.face);
  function score(cx, cz, d) { var dx = cx - G.P.x, dz = cz - G.P.z, l = Math.hypot(dx, dz) || 1, dot = (dx * fx + dz * fz) / l; return d + (1 - dot) * 0.45; }
  SB.boat.inter.forEach(function (o) { if (o.off || (o.ok && !o.ok())) return; var d = boxDist(o.box); if (d > 1.3) return; var sc = score((o.box[0] + o.box[3]) / 2, (o.box[2] + o.box[5]) / 2, d); if (sc < bs) { bs = sc; best = o; } });
  if (G.mode === 'day' && !G.carry) SB.fx.stains.forEach(function (stn) { if (stn.done) return; var p = stn.mesh.position, d = Math.max(0, Math.hypot(p.x - G.P.x, p.z - G.P.z) - stn.w * 0.5); if (d > 1.0) return; var sc = score(p.x, p.z, d); if (sc < bs) { bs = sc; best = stainIt(stn); } });
  return best;
}
var stainObj = { id: 'stain', name: function () { return L('때 닦기', 'Scrub'); } };
function stainIt(stn) { stainObj.stain = stn; return stainObj; }
function boxDist(b) { var dx = Math.max(b[0] - G.P.x, 0, G.P.x - b[3]), dz = Math.max(b[2] - G.P.z, 0, G.P.z - b[5]); return Math.hypot(dx, dz); }
var arm3 = 3.0, lookT = 0;
function setView() {}
SB.setView = setView;
/* 때 닦기: E(폰은 오른쪽 단추, 마우스는 왼쪽 단추)를 누르고 있는 동안 긴 갑판 솔로 문지른다 */
var scrub = null, _sv = new T.Vector3(), _sh = new T.Vector3(), _sd = new T.Vector3();
function holding() { return !!(keys.KeyE || keys.KeyF || keys.Space || (locked && ptr.down) || actHeld); }
function startScrub(stn) { scrub = { st: stn, t: 0 }; SB.work.brush(true); }
function stopScrub() { if (!scrub) return; scrub = null; SB.work.brush(false); SB.hero.R = SB.hero.L = null; }
function scrubTick(dt) {
  var stn = scrub.st, p = stn.mesh.position, dx = p.x - G.P.x, dz = p.z - G.P.z, dl = Math.hypot(dx, dz);
  if (!holding() || stn.done || !walkMode() || dl > 1.9) { stopScrub(); return; }
  scrub.t += dt; var t = scrub.t, fx = dx / (dl || 1), fz = dz / (dl || 1);
  G.P.face += wrap(Math.atan2(fx, fz) - G.P.face) * Math.min(1, dt * 10);
  var u = 0.5 + 0.36 * Math.sin(t * 5.5), v = 0.5 + 0.34 * Math.sin(t * 1.3 + 0.7);                 // 솔이 앞뒤로 밀리며 옆으로 옮겨 간다
  _sv.set((u - 0.5) * stn.w, (v - 0.5) * stn.w, 0).applyMatrix4(stn.mesh.matrix); _sv.y = D;
  _sh.set(G.P.x + fx * 0.3, D + 0.98, G.P.z + fz * 0.3);                                           // 손 높이(가슴 앞)
  if (Math.hypot(_sv.x - G.P.x, _sv.z - G.P.z) < 0.55) { _sv.x = G.P.x + fx * 0.55; _sv.z = G.P.z + fz * 0.55; }
  SB.work.brushAt(_sv, _sh);
  _sd.copy(_sh).sub(_sv).normalize();
  SB.hero.R = { p: _sv.clone().addScaledVector(_sd, 0.82), palm: new T.Vector3(fz, -0.3, -fx).normalize(), g: 1 };
  SB.hero.L = { p: _sv.clone().addScaledVector(_sd, 1.12), palm: new T.Vector3(0, -1, 0), g: 1 };
  SB.work.scrub({ st: stn, uv: { x: u, y: v } }, dt * 0.8); if (Math.random() < dt * 9) SB.snd('scrub');
}
SB.scrubbing = function () { return !!scrub; };
function stroke(s) { if (G.mode === 'escape' && !paused) SB.escape.stroke(s); }
window.addEventListener('keydown', function (e) {
  var k = e.code; SND.unlock(); if (e.repeat && k !== 'Space') { keys[k] = true; return; } keys[k] = true;
  if (k === 'Tab') { e.preventDefault(); document.body.classList.toggle('showtasks'); }
  if (k === 'Escape' && performance.now() - unlockAt > 400) { if (st.cur) st.leave(); else pause(!paused); }
  if (k === 'KeyP') pause(!paused);
  if (k === 'KeyM') tog('bgm'); if (k === 'KeyK') tog('snd');
  if (G.mode === 'story') { if (k === 'Space' || k === 'Enter') { e.preventDefault(); SB.story.tap(); } if (k === 'Escape') SB.story.end(); return; }
  if (G.mode === 'escape') { if (k === 'KeyA' || k === 'ArrowLeft') stroke(-1); if (k === 'KeyD' || k === 'ArrowRight') stroke(1); return; }
  if (st.cur) { if (/^(Space|KeyE|KeyF)$/.test(k) && !e.repeat) { e.preventDefault(); ptr.down = true; if (st.cur.h.down) st.cur.h.down(); } if (/^(KeyW|KeyS|ArrowUp|ArrowDown)$/.test(k) && st.cur.pose.hands === 'pull') st.leave(); return; }
  if ((k === 'KeyE' || k === 'KeyF' || (k === 'Space' && !e.repeat)) && walkMode() && !scrub) { e.preventDefault(); use(); }
});
window.addEventListener('keyup', function (e) { keys[e.code] = false; if (/^(Space|KeyE|KeyF)$/.test(e.code) && st.cur) { ptr.down = false; if (st.cur.h.up) st.cur.h.up(); } });
window.addEventListener('blur', function () { keys = {}; ptr.down = false; if (st.cur && st.cur.h.up) st.cur.h.up(); });
cv.addEventListener('pointerdown', function (e) {
  SND.unlock(); if (paused) return;
  if (e.pointerType === 'touch' && !touchMode) { touchMode = true; document.body.classList.add('touch'); unlockPtr(); }
  if (G.mode === 'story') { SB.story.tap(); return; }
  if (G.mode === 'escape') { if (locked) { stroke(e.button === 2 ? 1 : -1); return; } if (e.pointerType === 'mouse' && !touchMode) { lockPtr(); return; } press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; return; }
  if (G.mode !== 'day' && G.mode !== 'night') return;
  if (st.cur) { if (ptr.down) return; ndc(e); ptr.down = true; ptr.id = e.pointerId; updRay(); if (st.cur.h.down) st.cur.h.down(); try { cv.setPointerCapture(e.pointerId); } catch (er) {} return; }
  if (locked) { ptr.down = true; ptr.x = ptr.y = 0; if (!scrub) use(); return; }
  if (e.pointerType === 'mouse' && !touchMode) { lockPtr(); return; }
  if (press) return;
  press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
});
cv.addEventListener('pointermove', function (e) {
  if (G.mode === 'escape') { if (locked) SB.escape.look(e.movementX * 0.0022, e.movementY * 0.0022); else if (press && e.pointerId === press.id) { SB.escape.look((e.clientX - press.x) * 0.005, (e.clientY - press.y) * 0.005); press.x = e.clientX; press.y = e.clientY; } return; }
  if (G.mode !== 'day' && G.mode !== 'night') return;
  if (st.cur) { if (!ptr.down || e.pointerId === ptr.id || locked) ndc(e); return; }
  if (locked) {
    G.P.yaw -= e.movementX * 0.0022; G.P.pitch = SB.clamp(G.P.pitch - e.movementY * 0.0022, -0.95, 0.35); lookT = performance.now(); return;
  }
  if (press && e.pointerId === press.id) {
    var dx = e.clientX - press.x, dy = e.clientY - press.y; press.moved += Math.abs(dx) + Math.abs(dy); press.x = e.clientX; press.y = e.clientY;
    var k = touchMode ? 0.0052 : 0.0034; G.P.yaw -= dx * k; G.P.pitch = SB.clamp(G.P.pitch - dy * k, -0.95, 0.35); lookT = performance.now();
  }
});
function ptrUp(e) {
  if (G.mode === 'escape') { press = null; return; }
  if (st.cur) { if (ptr.down && (e.pointerId === ptr.id || locked)) { ptr.down = false; if (st.cur.h.up) st.cur.h.up(); } return; }
  if (locked) { ptr.down = false; ptr.x = ptr.y = 0; return; }
  if (press && e.pointerId === press.id) {
    if (press.moved < 12 && performance.now() - press.t < 400 && walkMode()) use();
    press = null; ptr.down = false; ptr.x = ptr.y = 0;
  }
}
cv.addEventListener('pointerup', ptrUp); cv.addEventListener('pointercancel', ptrUp);
cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
/* 폰: 왼쪽 패드(켜짐/꺼짐 방향, 옆걸음, 끝까지 밀면 뛰기), 오른쪽 단추(가운데가 가리키는 것 쓰기) */
(function () {
  var el = $('pad'), kn = $('knob');
  function set(e) { var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2, dx = (e.clientX - cx) / R, dy = (e.clientY - cy) / R, l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } kn.style.transform = 'translate(' + dx * R * 0.6 + 'px,' + dy * R * 0.6 + 'px)'; pad.x = Math.abs(dx) > 0.22 ? Math.sign(dx) * Math.min(1, Math.abs(dx) * 1.3) : 0; pad.y = Math.abs(dy) > 0.22 ? Math.sign(dy) * Math.min(1, Math.abs(dy) * 1.3) : 0; pad.run = l > 0.78; }
  el.addEventListener('pointerdown', function (e) { e.preventDefault(); SND.unlock(); pad.id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (er) {} set(e); });
  el.addEventListener('pointermove', function (e) { if (e.pointerId === pad.id) set(e); });
  function end(e) { if (e.pointerId !== pad.id) return; pad.id = null; pad.x = pad.y = 0; pad.run = false; kn.style.transform = ''; }
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  var act = $('act');
  act.addEventListener('pointerdown', function (e) { e.preventDefault(); SND.unlock(); if (walkMode()) { actHeld = true; if (!scrub) use(); } });
  function aup() { actHeld = false; }
  act.addEventListener('pointerup', aup); act.addEventListener('pointercancel', aup);
})();
var prefs = { bgm: 1, snd: 1 };
try { prefs.bgm = localStorage.getItem('shrimpboat.bgm') === '0' ? 0 : 1; prefs.snd = localStorage.getItem('shrimpboat.snd') === '0' ? 0 : 1; } catch (e) {}
function tog(k) { prefs[k] = prefs[k] ? 0 : 1; try { localStorage.setItem('shrimpboat.' + k, prefs[k]); } catch (e) {} applyPrefs(); SB.snd('btn'); }
function applyPrefs() { SND.bgm(prefs.bgm); SND.snd(prefs.snd); $('tBgm').classList.toggle('off', !prefs.bgm); $('tSnd').classList.toggle('off', !prefs.snd); }
function btn(id, fn) { $(id).addEventListener('click', function (e) { e.stopPropagation(); SND.unlock(); SB.snd('btn'); fn(); }); }
btn('bStart', newGame); btn('bCont', cont); btn('bNew', function () { show('confirm', true); });
btn('bYes', function () { show('confirm', false); wipe(); newGame(); }); btn('bNo', function () { show('confirm', false); });
btn('bResume', function () { pause(false); }); btn('bTitle', function () { save(); toTitle(); }); btn('bEnd', toTitle);
btn('stx', function () { st.leave(); }); btn('tutX', function () { SB.tut.off(); }); btn('tPause', function () { pause(!paused); }); btn('tBgm', function () { tog('bgm'); }); btn('tSnd', function () { tog('snd'); });
$('sTask').addEventListener('click', function () { document.body.classList.toggle('showtasks'); });
btn('bLand', function () { if (window.OL) OL.go(); });
$('pL').addEventListener('pointerdown', function (e) { e.preventDefault(); SND.unlock(); stroke(-1); }); $('pR').addEventListener('pointerdown', function (e) { e.preventDefault(); SND.unlock(); stroke(1); });
document.addEventListener('visibilitychange', function () { SND.hide(document.hidden); if (document.hidden && (G.mode === 'day' || G.mode === 'night')) { save(); pause(true); } });

// ---------- 매 프레임 ----------
var stepAcc = 0, rescueT = 0.5, bob = 0, _hp = new T.Vector3(), _lp = new T.Vector3(), lastT = 0, focusIt = null, rainAcc = 0;
function updRay() { SB.boat.group.updateMatrixWorld(); SB.boat.toLocalRay(rayAt(ptr.x, ptr.y), SB.ptrLocal); }
function tick(dt) {
  if (dt > 0.1) dt = 0.1;
  var playing = (G.mode === 'day' || G.mode === 'night') && !paused, night = G.mode === 'night';
  /* 시계와 하늘 */
  if (playing && !ui.fading) {
    G.t += dt / (night ? NIGHTH : DAYH);
    if (G.mode === 'day' && G.t >= 20 && !SB.allDone() && !G.late) beaten();
    if (night && G.t >= 28 && !G.inBunk) { G.t = 28; SB.toBed(true); }
    G.idle += dt; if (G.mode === 'day' && G.idle > 55) { G.idle = 0; SB.cap.say('lazy'); }
    if (Math.floor(G.t * 60) !== Math.floor((G.t - dt / DAYH) * 60)) ui.hud();
  }
  if (G.mode === 'title') { titleT += dt; S.dayT = 0.012 + Math.sin(titleT * 0.05) * 0.004; }
  else if (G.mode !== 'end' || !endPose) S.dayT = ((((G.t % 24) - 6) / 24) + 1) % 1;
  if (!paused) { S.update(dt, cam.getWorldPosition(_hp)); SB.boat.update(dt, S); }
  if (!paused) { S.sun.target.position.copy(SB.boat.group.position); S.sun.position.add(SB.boat.group.position); S.sun.target.updateMatrixWorld(); }
  var dark = S.night, B = SB.boat, I = B.I;
  B.lampL.intensity = night || G.mode === 'story' ? 9 : G.mode === 'day' && S.sunEl < 0.12 ? 30 * SB.clamp((0.12 - S.sunEl) * 6, 0, 1) : G.mode === 'title' ? 18 : 0; S.lamp = B.lampL.intensity > 0 ? 2.2 : 0; I.lampGlow.material.color.setHex(B.lampL.intensity > 0 ? 0xffd9a0 : 0x4a4a48);
  I.topLight.material.color.setHex(dark > 0.3 ? 0xffffff : 0x777777); B.cabL.intensity = night ? 0.6 : dark > 0.2 ? 5 : 0;
  I.tube.material.color.setHex(night ? 0x333333 : dark > 0.2 ? 0xfff8e0 : 0xbdbdb5);
  S.U.uLampPos.value.copy(B.lampL.position); B.group.localToWorld(S.U.uLampPos.value);
  /* 움직이기 */
  var sp = 0, run = false;
  if (playing && walkMode() && !scrub) {
    var f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - pad.y, s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + pad.x, l = Math.hypot(f, s);
    if (l > 0.01) { if (l > 1) { f /= l; s /= l; } run = keys.ShiftLeft || keys.ShiftRight || pad.run; sp = (run ? RUN : WALK) * (G.carry === 'pallet' || G.carry === 'buoy' ? 0.7 : 1); var cy = Math.cos(G.P.yaw), sy = Math.sin(G.P.yaw);
      var vx = -f * sy + s * cy, vz = -f * cy - s * sy; B.walk(G.P, vx * sp * dt, vz * sp * dt, 0.28); stepAcc += sp * dt; if (stepAcc > (run ? 0.85 : 0.68)) { stepAcc = 0; SB.snd('step'); }
      var mh = Math.atan2(vx, vz); G.P.face += wrap(mh - G.P.face) * Math.min(1, dt * 11);                     // 몸은 가는 쪽으로
      if (third() && performance.now() - lookT > 900) G.P.yaw += Math.sin(wrap(mh - (G.P.yaw + PI))) * 1.0 * dt;   // 옆으로 갈수록 사진기가 등 뒤로(올가미 언니 기준)
    }
  }
  if (playing && walkMode() && !scrub) { rescueT -= dt; if (rescueT < 0) { rescueT = 0.5; if (B.rescue(G.P, 0.28)) SB.snd('step'); } }   // 갇혔으면 꺼내 준다
  SB.night.update(dt, sp, run);
  bob += dt * sp * 3.1;
  /* 사진기 */
  if (cam.parent === B.group) {
    _e.set(G.P.pitch, G.P.yaw, 0); fpQ.setFromEuler(_e);
    thirdCam();
    st.blend += ((st.cur || cine ? 1 : 0) - st.blend) * Math.min(1, dt * (cine ? 5 : 7));
    if (G.mode === 'end' && !endPose) { fpP.set(2.3, D + 1.75, -2.05); _m4.lookAt(fpP, _lp.set(0.05, D + 1.3, -1.0), new T.Vector3(0, 1, 0)); fpQ.setFromRotationMatrix(_m4); }
    if (cine) { stP.copy(cine.p); stQ.copy(cine.q); }
    cam.position.copy(fpP).lerp(stP, st.blend); cam.quaternion.copy(fpQ).slerp(stQ, st.blend);
    if (shakeT > 0) { shakeT -= dt; var sk = shakeT * 0.18; cam.position.x += (Math.random() - 0.5) * sk; cam.position.y += (Math.random() - 0.5) * sk; }
  } else if (G.mode === 'story') { SB.story.update(dt, cam); }
  else if (G.mode === 'title') { var a = titleT * 0.04; cam.position.set(Math.cos(a + 0.4) * 22, 5.5, Math.sin(a + 0.4) * 22 - 4); cam.lookAt(0, 2.2, 0); }
  else if (G.mode === 'end' && endPose) { cam.position.copy(endPose.p); cam.lookAt(endPose.l); }
  if (st.cur && st.cur.pose.hands === 'pull' && (keys.KeyE || keys.KeyF || keys.Space) && !ptr.down) { ptr.down = true; if (st.cur.h.down) st.cur.h.down(); }   // E 로 들어와 그대로 누르고 있으면 감긴다
  if (st.cur) { updRay(); if (st.cur.h.update) st.cur.h.update(dt); }
  /* 가리키는 것 */
  /* 때 닦기 */
  if (scrub) scrubTick(dt);
  /* 쓸 수 있는 것: 그 물건 위에 [E] 이름을 띄운다(3인칭 기본) */
  focusIt = walkMode() ? pick() : null;
  var fe = $('focus');
  if (focusIt) {
    var nm = focusIt.name(), pr = scrub ? SB.clamp((1 - scrub.st.sum / scrub.st.sum0) / 0.9, 0, 1) : -1, key = nm + (pr >= 0 ? '|p' : '');
    if (fe.dataset.n !== key) { fe.dataset.n = key; fe.innerHTML = '<kbd>' + (focusIt.stain ? 'E' + L(' 길게', ' HOLD') : 'E') + '</kbd>' + nm + (pr >= 0 ? '<i><b></b></i>' : ''); }
    if (pr >= 0) fe.querySelector('b').style.width = (pr * 100).toFixed(0) + '%';
    if (focusIt.stain) { var sp0 = focusIt.stain.mesh.position; _lp.set(sp0.x, D + 0.45, sp0.z); } else { var bx = focusIt.box; _lp.set((bx[0] + bx[3]) / 2, bx[4] + 0.22, (bx[2] + bx[5]) / 2); }
    B.group.localToWorld(_lp); _lp.project(cam);
    var onS = _lp.z < 1 && Math.abs(_lp.x) < 1.1 && Math.abs(_lp.y) < 1.1;
    fe.style.transform = 'translate(' + ((_lp.x + 1) / 2 * window.innerWidth).toFixed(0) + 'px,' + ((1 - _lp.y) / 2 * window.innerHeight).toFixed(0) + 'px) translate(-50%,-100%)';
    fe.hidden = !onS;
  } else fe.hidden = true;
  $('act').classList.toggle('dim', !focusIt);
  var heroVis = third() || G.mode === 'sleep' || G.mode === 'escape' || G.mode === 'story' || (G.mode === 'end' && G.heroEnd);
  SB.hero.update(dt, G.P.x, G.P.z, G.P.face, st.cur ? (st.sp || 0) : sp, heroVis); SB.tut.update(dt, cam);
  if (!paused) { SB.fx.update(dt); SB.haul.update(dt); SB.sort.update(dt); SB.work.update(dt); SB.cap.update(dt); SB.escape.update(dt); }
  gullUpdate(dt, dark > 0.5);
  if (S.storm && (playing || G.mode === 'escape')) { rainAcc += dt * 160; while (rainAcc > 1) { rainAcc--; SB.fx.emit('rain', G.P.x + (Math.random() - 0.5) * 10, D + 5, G.P.z + (Math.random() - 0.5) * 10, -0.5, -9, 0.3, 0.8); } }
  /* 소리 */
  SND.loop('waves', 0.55 + S.storm * 0.4); SND.loop('wind', 0.12 + S.storm * 0.6); SND.loop('rain', S.storm && G.mode !== 'title' ? 0.8 : 0); SND.loop('engine', G.mode === 'day' ? 0.35 : G.mode === 'title' ? 0.2 : 0);
  var dc = Math.hypot(G.P.x + 6.3, G.P.z + 1.0); SND.loop('snore', night && SB.cap.st === 'sleep' ? SB.clamp(1 - dc / 11, 0.08, 1) : 0);
  SND.music(G.mode === 'day' ? 1 : 0); if (G.mode === 'day') SND.bgmVol(SB.clamp(1.2 - Math.hypot(G.P.x + 5, G.P.z) / 16, 0.3, 1));
  /* 선장 머리 위 말풍선·코골이 */
  if (bubbleOn || zzzV >= 0) { SB.cap.headPos(_hp); _hp.project(cam); var vis = _hp.z < 1 && Math.abs(_hp.x) < 1.05 && _hp.y < 0.62 && _hp.y > -1, px = (_hp.x + 1) / 2 * window.innerWidth, py = (1 - _hp.y) / 2 * window.innerHeight;
    var bb = $('bubble'), zz = $('zzz'); bb.style.transform = zz.style.transform = 'translate(' + px.toFixed(0) + 'px,' + py.toFixed(0) + 'px)'; bb.classList.toggle('off', !vis); zz.classList.toggle('off', !vis);
    if (EN && bubbleOn) { var bh = bb.offsetWidth / 2 + 6, bx = Math.min(Math.max(px, bh), window.innerWidth - bh); bb.style.transform = 'translate(' + bx.toFixed(0) + 'px,' + Math.max(py, 70).toFixed(0) + 'px)'; }   // 영문판: 대사가 길어 화면 가장자리에서 말풍선이 잘리지 않게 안쪽으로(10/4 사장님 영문판 검수)
  }
  /* 그리기 */
  if (window.__noRender) { scene.updateMatrixWorld(); cam.updateMatrixWorld(); return; }
  renderer.clear(); renderer.render(scene, cam);
}
/* 연출 카메라: 정해진 자리에서 한 곳을 본다(선장한테 맞을 때). null 이면 원래대로 */
var cine = null; SB.cine = function (p, l) { if (!p) { cine = null; return; } var q = new T.Quaternion(), m = new T.Matrix4().lookAt(p, l, new T.Vector3(0, 1, 0)); q.setFromRotationMatrix(m); cine = { p: p.clone(), q: q }; };
var shakeT = 0; SB.camShake = function (t) { shakeT = Math.max(shakeT, t); };
function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
/* 3인칭 사진기: 머리 뒤 팔 3m, 벽·조타실 천장·갑판에 막히면 팔만 줄인다 */
var _t3 = new T.Vector3(), _f3 = new T.Vector3();
function thirdCam() {
  var cy = G.P.yaw, cp = G.P.pitch, B = SB.boat; _t3.set(G.P.x, D + 1.55, G.P.z); _f3.set(Math.sin(cy) * Math.cos(cp), -Math.sin(cp), Math.cos(cy) * Math.cos(cp));   // 사진기 쪽(뒤)
  var arm = 3.0, i;
  for (i = 0; i < B.solids.length; i++) { var o = B.solids[i]; if (!o.wall) continue; var t = B.slab(_t3, _f3, [o.x0 - 0.12, o.y0, o.z0 - 0.12, o.x1 + 0.12, o.y1 + 0.3, o.z1 + 0.12], arm); if (t >= 0 && t < arm) arm = t; }
  if (B.inCabin(G.P.x, G.P.z) && _f3.y > 0) arm = Math.min(arm, (D + 2.05 - _t3.y) / _f3.y);
  if (_f3.y < 0) arm = Math.min(arm, (D + 0.4 - _t3.y) / _f3.y);
  arm = Math.max(0.35, arm); arm3 += (arm - arm3) * (arm < arm3 ? 1 : 0.08);
  fpP.copy(_t3).addScaledVector(_f3, arm3);
}
function loop(ts) { requestAnimationFrame(loop); var t = ts / 1000, dt = lastT ? t - lastT : 1 / 60; lastT = t; tick(dt); }

// ---------- 시험 손잡이(미리보기 창은 rAF 가 안 돌아 손으로 돌린다) ----------
window.__sb = {
  G: G, SB: SB, tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) tick(dt || 1 / 30); return G.mode; },
  start: newGame, cont: cont, title: toTitle, night: function (t) { toNight(t); }, bed: function () { SB.toBed(); }, ending: ending,
  day: function (d, o) { G.day = d; o = o || {}; Object.keys(o).forEach(function (k) { G[k] = o[k]; }); startDay(true); ui.fade(false); $('morn').hidden = true; },
  tp: function (x, z, yaw, pitch) { G.P.x = x; G.P.z = z; if (yaw != null) G.P.yaw = yaw; if (pitch != null) G.P.pitch = pitch; },
  look: function (x, y, z) { var dx = x - G.P.x, dz = z - G.P.z, dy = y - (D + EYE); G.P.yaw = Math.atan2(-dx, -dz); G.P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); G.P.face = Math.atan2(dx, dz); },
  focus: function () { var it = pick(); return it ? it.id : null; }, use: function () { return use(); }, scrub: function () { return scrub; },
  ptr: function (x, y, down) { ptr.x = x; ptr.y = y; updRay(); if (down === true && st.cur) { ptr.down = true; if (st.cur.h.down) st.cur.h.down(); } if (down === false && st.cur) { ptr.down = false; if (st.cur.h.up) st.cur.h.up(); } },
  keys: keys, st: st, ui: ui, unfade: function () { ui.fade(false); $('morn').hidden = true; },
  info: function () { return JSON.stringify(renderer.info.render); },
  shot: function (name, w) { var c = cv; if (w) { var h = Math.round(w * c.height / c.width), o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(c, 0, 0, w, h); c = o; } return fetch('/save?name=' + name, { method: 'POST', body: c.toDataURL('image/png') }).then(function (r) { return r.text(); }); },
  renderer: function () { return renderer; }, scene: function () { return scene; }
};

// ---------- 시작 ----------
/* 처음 보는 재질·그림자 지도·손 화면을 로딩 때 한 번 그려 둔다(첫 판 멈칫 막기) */
function warm() {
  try {
    var tmp = [], hid = [];
    ['shrimp', 'fish', 'crab', 'star', 'squid', 'can', 'bottle', 'slipper', 'jelly', 'monk', 'compass', 'key'].forEach(function (k) { var m = SB.creatures.make(k); m.position.set(1.4, D + 0.9, 0.5); SB.boat.group.add(m); tmp.push(m); });
    var stn = SB.fx.makeStain({ x: 0, z: 0, w: 0.5, seed: 1 });
    SB.hero.preload(); SB.story.warm(true);
    var fc = [];
    [scene].forEach(function (sc) { sc.traverse(function (o) { if (!o.visible) { hid.push(o); o.visible = true; } if (o.frustumCulled) { fc.push(o); o.frustumCulled = false; } }); });
    var c2 = new T.PerspectiveCamera(70, 1, 0.05, 900); c2.position.set(4.6, D + EYE, -1.3); SB.boat.group.add(c2); c2.lookAt(0, D, 0); scene.updateMatrixWorld(true);
    renderer.compile(scene, c2); renderer.render(scene, c2); 
    hid.forEach(function (o) { o.visible = false; }); fc.forEach(function (o) { o.frustumCulled = true; }); SB.hero.hold(null); SB.story.warm(false);
    tmp.forEach(function (m) { SB.boat.group.remove(m); }); stn.mesh.visible = false; SB.fx.stains.splice(SB.fx.stains.indexOf(stn), 1);   // 때 셰이더를 붙잡아 두려고 숨겨서 남긴다 SB.boat.group.remove(c2);
  } catch (e) { console.warn('warm', e); }
}
function boot() {
  initGL(); applyPrefs(); toTitle();
  $('logo').textContent = L('새우잡이배', 'SHRIMP BOAT'); $('bLand').textContent = L('가로로 보기', 'ROTATE');
  warm();
  requestAnimationFrame(loop);
}
var fl = document.fonts && document.fonts.load ? Promise.race([document.fonts.load("40px 'Saemaul'"), new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
fl.then(boot, boot);
})();
