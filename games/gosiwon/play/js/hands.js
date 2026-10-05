// 고시원 총무 — 화면 앞의 손(빨간 고무장갑). 본 장면 위에 따로 그린다
GS.hands = (function () {
'use strict';
var T = THREE, PI = Math.PI, scene = new T.Scene(), cam = new T.PerspectiveCamera(44, 1, 0.02, 5);
var offT = 0, R, L, Rw, armW, armR, ringR, sponge, spongeW, wscene, knife, boxes = {}, has = false, carry = null, tool = null, wearT = 1, jabT = 1, clock = 0, asp = 1;
var sleeveMat = new T.MeshLambertMaterial({ color: 0x7d8597, side: T.DoubleSide });   // 회색 츄리닝 소매
var mat = new T.MeshPhongMaterial({ color: 0xcc1017, shininess: 40, specular: 0xe08c8c, side: T.DoubleSide });
function M(g, x, y, z, rx, ry, rz, sx, sy, sz, m) { var o = new T.Mesh(g, m || mat); o.position.set(x, y, z); o.rotation.set(rx || 0, ry || 0, rz || 0); o.scale.set(sx || 1, sy || 1, sz || 1); return o; }
function finger(x, z, len, r, spread, curl) {               // 세 마디, 마디마다 공을 끼워 이음새가 안 보이게
  var root = new T.Group(), cur = root, i; root.position.set(x, -0.002, z); root.rotation.y = spread; root.rotation.x = curl[0];
  for (i = 0; i < 3; i++) {
    var L = len * [0.42, 0.33, 0.27][i], rr = r * [1, 0.92, 0.84][i];
    cur.add(M(new T.CapsuleGeometry(rr, L, 4, 12), 0, 0, -L / 2, PI / 2));
    var nx = new T.Group(); nx.position.set(0, 0, -L); nx.rotation.x = curl[i + 1] || 0; cur.add(nx); cur = nx;
  }
  return root;
}
function glove(side) {                               // 손목이 원점, 손가락은 -z 쪽. side 1 오른손, -1 왼손
  var g = new T.Group(), i;
  g.add(M(new T.CylinderGeometry(0.05, 0.036, 0.27, 24, 1, true), 0, -0.004, 0.17, PI / 2, 0, 0, 1, 1, 0.85));   // 소매: 팔꿈치 쪽이 넓다
  g.add(M(new T.TorusGeometry(0.05, 0.0075, 8, 24), 0, -0.004, 0.305, 0, 0, 0, 1, 0.85, 1));                    // 말린 테
  var prof = [[0.001, 0.045], [0.03, 0.045], [0.033, 0.015], [0.039, -0.02], [0.043, -0.055], [0.041, -0.08], [0.03, -0.097], [0.001, -0.1]].map(function (q) { return new T.Vector2(q[0], q[1]); });
  g.add(M(new T.LatheGeometry(prof, 28), 0, -0.004, 0, PI / 2, 0, 0, 1.5, 1, 0.5));                               // 손바닥: 손목에서 넓어지며 납작
  var fx = [-0.034, -0.0115, 0.0115, 0.034], fl = [0.072, 0.082, 0.078, 0.062];
  for (i = 0; i < 4; i++) g.add(finger(fx[i], -0.088, fl[i], 0.0118, -(i - 1.5) * 0.06, [-0.12, -0.3, -0.35, -0.25]));
  var th = finger(-0.052 * side, -0.03, 0.062, 0.013, 0.8 * side, [-0.15, -0.25, -0.3]); th.position.y = -0.006; g.add(th);
  return g;
}
function init(mainScene) {
  wscene = mainScene; picInit();
  scene.add(new T.HemisphereLight(0xf4fff0, 0x4a4438, 1.5)); var d = new T.DirectionalLight(0xffffff, 1.5); d.position.set(-0.4, 1, 0.7); scene.add(d);
  R = glove(1); L = glove(-1); scene.add(R); scene.add(L);
  sponge = new T.Group(); sponge.add(M(new T.BoxGeometry(0.105, 0.03, 0.07), 0, 0, 0, 0, 0, 0, 1, 1, 1, new T.MeshLambertMaterial({ color: 0xf0d040 })));
  sponge.add(M(new T.BoxGeometry(0.106, 0.01, 0.071), 0, -0.02, 0, 0, 0, 0, 1, 1, 1, new T.MeshLambertMaterial({ color: 0x3f8f4a }))); sponge.position.set(0, -0.045, -0.105); R.add(sponge);
  knife = new T.Group(); knife.add(M(new T.BoxGeometry(0.022, 0.028, 0.11), 0, 0, 0, 0, 0, 0, 1, 1, 1, new T.MeshLambertMaterial({ color: 0x2a2a2a })));
  knife.add(M(new T.BoxGeometry(0.004, 0.055, 0.16), 0, -0.014, -0.135, 0, 0, 0, 1, 1, 1, new T.MeshPhongMaterial({ color: 0xd8dde0, shininess: 100 }))); knife.position.set(0, -0.03, -0.1); R.add(knife);
  var L2 = function (c) { return new T.MeshLambertMaterial({ color: c }); };
  boxes.ramen = new T.Group(); boxes.ramen.add(M(new T.BoxGeometry(0.4, 0.24, 0.3), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xb98f5c))); boxes.ramen.add(M(new T.BoxGeometry(0.2, 0.11, 0.302), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xd6241c))); boxes.ramen.add(M(new T.BoxGeometry(0.06, 0.242, 0.302), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xcfb880)));
  boxes.kimchi = new T.Group(); boxes.kimchi.add(M(new T.BoxGeometry(0.42, 0.26, 0.3), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xf0f0ec))); boxes.kimchi.add(M(new T.BoxGeometry(0.43, 0.02, 0.31), 0, 0.085, 0, 0, 0, 0, 1, 1, 1, L2(0xd8d8d2))); boxes.kimchi.add(M(new T.BoxGeometry(0.06, 0.262, 0.302), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xcfb880)));
  boxes.tub = new T.Group(); boxes.tub.add(M(new T.BoxGeometry(0.34, 0.2, 0.26), 0, 0, 0, 0, 0, 0, 1, 1, 1, new T.MeshPhongMaterial({ color: 0xc81818, shininess: 40 }))); boxes.tub.add(M(new T.BoxGeometry(0.36, 0.025, 0.28), 0, 0.11, 0, 0, 0, 0, 1, 1, 1, L2(0xe02a22)));
  Rw = glove(1); Rw.remove(Rw.children[0]); Rw.remove(Rw.children[0]);   // 소매 토막은 빼고 손만, 팔은 아래에서 따로 잇는다
  spongeW = new T.Group(); spongeW.add(M(new T.BoxGeometry(0.105, 0.03, 0.07), 0, 0, 0, 0, 0, 0, 1, 1, 1, new T.MeshLambertMaterial({ color: 0xf0d040 }))); spongeW.add(M(new T.BoxGeometry(0.106, 0.01, 0.071), 0, -0.02, 0, 0, 0, 0, 1, 1, 1, new T.MeshLambertMaterial({ color: 0x3f8f4a }))); spongeW.position.set(0, -0.045, -0.105); Rw.add(spongeW); Rw.visible = false; wscene.add(Rw);
  var ag = new T.CylinderGeometry(0.047, 0.06, 1, 16, 1, true); ag.translate(0, 0.5, 0);
  armW = new T.Mesh(ag, sleeveMat); armW.frustumCulled = false; armW.visible = false; wscene.add(armW);
  var rg = new T.CylinderGeometry(0.041, 0.051, 1, 18, 1, true); rg.translate(0, 0.5, 0);
  armR = new T.Mesh(rg, mat); armR.frustumCulled = false; armR.visible = false; wscene.add(armR);
  ringR = M(new T.TorusGeometry(0.051, 0.007, 8, 20), 0, 0, 0); ringR.visible = false; wscene.add(ringR);
  [R, L].forEach(function (h) { h.add(M(new T.CylinderGeometry(0.052, 0.064, 0.6, 16, 1, true), 0, -0.004, 0.59, PI / 2, 0, 0, 1, 1, 0.85, sleeveMat)); });
  boxes.tube = new T.Group(); boxes.tube.add(M(new T.BoxGeometry(0.45, 0.09, 0.09), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xdfe6ef))); boxes.tube.add(M(new T.BoxGeometry(0.2, 0.092, 0.092), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0x2f62b8)));   // 형광등 상자
  boxes.parcel = new T.Group(); boxes.parcel.add(M(new T.BoxGeometry(0.3, 0.22, 0.26), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xb98f5c))); boxes.parcel.add(M(new T.BoxGeometry(0.06, 0.222, 0.262), 0, 0, 0, 0, 0, 0, 1, 1, 1, L2(0xcfb880)));   // 택배
  Object.keys(boxes).forEach(function (k) { boxes[k].position.set(0, -0.3, -0.56); boxes[k].rotation.x = 0.25; boxes[k].visible = false; scene.add(boxes[k]); });
  R.visible = L.visible = false; R.position.set(0.2, -0.8, -0.4); L.position.set(-0.2, -0.8, -0.4);
}
/* 그림 손(사장님이 준 빨간 고무장갑 + 파란 추리닝 그림 세 장, 10/3. tools/hand_pics.py 가 만들고 아래 값을 찍는다)
   한 팔 그림은 화면 밖 어깨(원래 그림 아래 모서리)를 축으로 돌리고 손끝이 목표에 오게 어깨를 옮긴다. 소매 꼬리가 화면 밖까지 잇는다.
   걸을 때·닦을 때 = 수세미 낀 집는 손, 작업대 = 빈 집는 손, 칼질 = 식칼 손, 상자 = 두 손 받치기(3D 상자를 두 손 사이에 맞춘다) */
var PICS = {"pinch": {"w": 849, "h": 757, "fw": 1760, "fh": 1819, "tipS": [0.0972, 0.1387], "tipP": [0.159, 0.1308], "tail": [1611.3, 1684.1, 353, -40.62]}, "knife": {"w": 862, "h": 825, "fw": 1878, "fh": 1787, "tip": [0.1096, 0.2376], "tipS": [0.1791, 0.2924], "tail": [1725.1, 1658.8, 314, -46.54]}, "carry": {"w": 918, "h": 664, "fw": 2318, "fh": 1164, "ox": 700, "box": [0.4995, 0.1898, 0.31]}};
var pics = {}, picPt = null, picLast = null, scrubScr = null, carryBox = null;
function picInit() {
  /* 손 하나 = 감싸는 상자(자리·회전) 안에 [소매 꼬리 + 그림]. 왼손은 안쪽을 좌우로 뒤집는다 */
  var layer = document.createElement('div');                                             // 화면 밖으로 넘치는 손·소매를 잘라 내는 틀(넘치면 폰 브라우저가 화면을 키운다)
  layer.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;overflow:hidden;z-index:14;pointer-events:none'; document.body.appendChild(layer);
  [['S', 'hand-sponge', 'pinch', 0], ['W', 'hand-steel', 'pinch', 0], ['P', 'hand-pinch', 'pinch', 0], ['KS', 'hand-paring', 'knife', 0], ['L', 'hand-pinch', 'pinch', 1], ['K', 'hand-knife', 'knife', 0], ['C', 'hand-carry', 'carry', 0]].forEach(function (a) {
    var sp = PICS[a[2]], box = document.createElement('div'), inn = document.createElement('div'), im = document.createElement('img');
    box.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;display:none;will-change:transform';
    inn.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%' + (a[3] ? ';transform:scaleX(-1)' : '');
    if (sp.tail) {
      var tail = document.createElement('div'), tu = 'assets/tail-' + a[2] + '.png?v=1'; new Image().src = tu;          // 숨긴 상자의 배경 그림은 미리 안 받으므로 먼저 받아 둔다
      tail.style.cssText = 'position:absolute;height:400%;background:url(' + tu + ') 0 0/100% auto repeat-y;transform-origin:50% 0;transform:rotate(' + sp.tail[3] + 'deg)';
      tail.style.left = ((sp.tail[0] - sp.tail[2] / 2) / sp.fw * 100) + '%'; tail.style.top = (sp.tail[1] / sp.fh * 100) + '%'; tail.style.width = (sp.tail[2] / sp.fw * 100) + '%';
      inn.appendChild(tail);
    }
    im.src = 'assets/' + a[1] + '.webp?v=2'; im.alt = ''; im.draggable = false; im.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;user-select:none';
    inn.appendChild(im); box.appendChild(inn); layer.appendChild(box); pics[a[0]] = box; box.sp = sp;
    if (a[0] === 'C') {                                                                  // 두 손 그림은 왼팔·오른팔 반쪽씩 따로 두고 사이를 벌린다(10/5 "양손 사이를 벌려서")
      box.style.overflow = 'hidden'; inn.style.width = '200%';
      var box2 = box.cloneNode(true); box2.firstChild.style.left = '-100%'; layer.appendChild(box2); pics.C2 = box2; box2.sp = sp;
    }
  });
}
function picPlace(el, tip, tx, ty, left, wob) {          // tip: 그림 안 손끝 자리(0~1), tx·ty: 화면 목표, left: 왼손(뒤집은 그림, 어깨는 왼쪽 아래)
  var P = el.sp, vw = innerWidth, vh = innerHeight, w = Math.min(vh * 0.6, vw * 0.4) * HAND_K * P.w / 849, h = w * P.h / P.w, s0 = w / P.w;
  var rx = left ? vw * 0.38 : vw * 0.62, ry = vh * 0.66;                                   // 쉬는 자리
  var px = (left ? -0.05 * w : vw + 0.05 * w) + (tx - rx) * 0.5, py = vh + 0.08 * w + (ty - ry) * 0.5;   // 어깨: 화면 밖, 손이 가는 쪽으로 조금 따라간다
  var fx = left ? 1 - tip[0] : tip[0], ax = left ? fx * w : (fx - 1) * w, ay = (tip[1] - 1) * h;
  var bx = tx - px, by = ty - py, sc = Math.min(1.08, Math.max(0.75, 1 - 0.4 * (ry - ty) / vh));   // 위로(멀리) 뻗을수록 작게
  var ang = Math.atan2(by, bx) - Math.atan2(ay, ax), lo = left ? -0.45 : -0.5, hi = left ? 0.5 : 0.45;
  ang = Math.min(hi, Math.max(lo, (ang + PI * 3) % (PI * 2) - PI));                        // 팔이 너무 서거나 눕지 않게: 화면 가장자리로 가도 손이 화면 안쪽을 향한다
  var ca = Math.cos(ang), sa = Math.sin(ang);
  px = tx - (ax * ca - ay * sa) * sc; py = ty - (ax * sa + ay * ca) * sc; ang += wob || 0;   // 어깨를 옮겨 손끝을 목표에 맞춘다
  var ox = left ? P.fw - P.w : P.w, L = px - ox * s0, T = py - h;                        // 어깨 자리 = 원래 그림 아래 모서리(소매를 이어 붙여 그림이 커졌다)
  el.style.width = (P.fw * s0).toFixed(1) + 'px'; el.style.height = (P.fh * s0).toFixed(1) + 'px';
  el.style.transformOrigin = (ox / P.fw * 100).toFixed(3) + '% ' + (P.h / P.fh * 100).toFixed(3) + '%';
  el.style.transform = 'translate(' + L.toFixed(1) + 'px,' + T.toFixed(1) + 'px) rotate(' + ang.toFixed(4) + 'rad) scale(' + sc.toFixed(4) + ')';
  el.style.display = 'block';
}
var HAND_K = 0.8, CARRY_K = 0.6, CARRY_W = 0.75, CARRY_T = 0.63, CARRY_GAP = 0.24;   // 손 크기 배수(10/5 댓글 "손이 너무..." → 1.1에서 줄임), 두 손 높이·너비 한도, 두 손 윗자리, 두 손 사이 벌림(w 비율)
function carryPlace(el, bob) {                           // 두 손 받치기: 화면 아래 가운데, 왼팔·오른팔 반쪽을 gap 만큼 벌려 놓는다. 걸으면 출렁. 상자 자리(화면)를 돌려준다
  var P = el.sp, vw = innerWidth, vh = innerHeight, h = Math.min(vh * CARRY_K, vw * CARRY_W * P.h / P.w), s0 = h / P.h, w = P.w * s0, gap = CARRY_GAP * w;
  var FW = P.fw * s0, FH = P.fh * s0, L = (vw - w) / 2 - P.ox * s0, T = vh * CARRY_T + bob, el2 = pics.C2;
  el.style.width = el2.style.width = (FW / 2).toFixed(1) + 'px'; el.style.height = el2.style.height = FH.toFixed(1) + 'px';
  el.style.transform = 'translate(' + (L - gap / 2).toFixed(1) + 'px,' + T.toFixed(1) + 'px)'; el.style.display = 'block';
  el2.style.transform = 'translate(' + (L + FW / 2 + gap / 2).toFixed(1) + 'px,' + T.toFixed(1) + 'px)'; el2.style.display = 'block';
  return [(vw - w) / 2 + P.box[0] * w, T + P.box[1] * h, P.box[2] * w + gap];
}
function picHide(k) { if (pics[k] && pics[k].style.display !== 'none') pics[k].style.display = 'none'; }
var BOXW = { ramen: 0.4, kimchi: 0.42, tub: 0.34, tube: 0.45, parcel: 0.3 };
var tp = new T.Vector3(), tr = new T.Vector3(), lp = new T.Vector3(), lr = new T.Vector3();
function approach(o, p, r, k) { o.position.lerp(p, k); o.rotation.x += (r.x - o.rotation.x) * k; o.rotation.y += (r.y - o.rotation.y) * k; o.rotation.z += (r.z - o.rotation.z) * k; }
function update(dt, s) {                              // s: move(0~1), scrub, station, px, py(화면 -1~1)
  clock += dt; if (offT > 0) { offT -= dt * 1.6; wearT = Math.max(0, offT); if (offT <= 0) { has = false; wearT = 1; } } else if (wearT < 1) wearT = Math.min(1, wearT + dt * 1.6); if (jabT < 1) jabT = Math.min(1, jabT + dt * 4.5);
  var th = Math.tan(cam.fov * PI / 360), k = Math.min(1, dt * 16), bob = Math.sin(clock * 9) * 0.008 * s.move, jab = Math.sin(jabT * PI) * 0.1;
  var showPic = has && s.day;
  R.visible = L.visible = false;                                                         // 3D 장갑 손은 이제 안 쓴다(그림 손)
  sponge.visible = !carry && tool !== 'knife' && !s.station; knife.visible = tool === 'knife' && !carry;
  Object.keys(boxes).forEach(function (n) { boxes[n].visible = carry === n; });
  if (carry) { tp.set(0.2, -0.22 + bob, -0.45); tr.set(0.1, 0.9, 0.5); lp.set(-0.2, -0.22 + bob, -0.45); lr.set(0.1, -0.9, -0.5); boxes[carry].position.y = -0.3 + bob; }
  else if (s.station) {
    var d = 0.66, x = s.px * th * asp * d, y = s.py * th * d;
    if (tool === 'knife') { tp.set(x + 0.03, y - 0.27 - jab * 0.25, -d + 0.2); tr.set(0.95 - jab * 3.2, 0.1, 0); }
    else { tp.set(x + 0.012, y - 0.06 + jab * 0.3, -d + 0.07 - jab); tr.set(1.0, 0.12, 0); }
    lp.set(-0.3, -0.7, -0.4); lr.set(0, 0, 0); k = Math.min(1, dt * 30);
  } else if (s.scrub) { tp.set(s.px * th * asp * 0.4 + 0.04 + Math.sin(clock * 15) * 0.075, s.py * th * 0.4 - 0.2 + Math.cos(clock * 30) * 0.018, -0.4); tr.set(0.95, 0.1, Math.sin(clock * 15) * 0.12); lp.set(-0.3, -0.7, -0.4); lr.set(0, 0, 0); }
  else { tp.set(0.2, -0.205 + bob - (1 - GS.ease(wearT)) * 0.5, -0.38 - jab); tr.set(0.42 + jab * 3, 0.32, -0.12); lp.set(-0.2, -0.235 - bob - (1 - GS.ease(wearT)) * 0.5 + (wearT < 1 ? 0 : -0.5), -0.38); lr.set(0.42, -0.32, 0.12); }
  approach(R, tp, tr, k); approach(L, lp, lr, k);
  /* 그림 손 */
  var it = (GS.G && GS.G.items) || {}, vw = innerWidth, vh = innerHeight, down = (1 - GS.ease(wearT)) * vh * 0.7, kk = Math.min(1, dt * 18), tgt, key = it.brush ? 'W' : 'S', tip = PICS.pinch.tipS, wob = 0, all = ['S', 'W', 'P', 'L', 'K', 'KS', 'C', 'C2'];   // 상점: 철수세미를 사면 손에 철수세미, 식칼을 사기 전엔 과도
  if (!showPic) { all.forEach(picHide); picPt = null; return; }
  if (carry) {                                                                           // 상자: 두 손 사이에 3D 상자를 맞춘다
    var bp = carryPlace(pics.C, bob * vh * 2.2 + down), bx3 = boxes[carry], D = 0.56, hh = D * Math.tan(cam.fov * PI / 360);
    bx3.position.set((bp[0] / vw * 2 - 1) * hh * asp, (1 - bp[1] / vh * 2) * hh - 0.02, -D); bx3.scale.setScalar(bp[2] / vw * 2 * hh * asp / BOXW[carry]);
    all.forEach(function (k) { if (k !== 'C' && k !== 'C2') picHide(k); }); picPt = null; return;
  }
  picHide('C'); picHide('C2');
  if (scrubScr) { tgt = [scrubScr[0] + Math.sin(clock * 15) * vh * 0.012, scrubScr[1] + Math.cos(clock * 30) * vh * 0.006]; wob = Math.sin(clock * 15) * 0.03; kk = Math.min(1, dt * 26); }
  else if (s.station && tool === 'knife') { key = it.knife ? 'K' : 'KS'; tip = it.knife ? PICS.knife.tip : PICS.knife.tipS; tgt = [(s.px + 1) / 2 * vw, (1 - s.py) / 2 * vh + jab * vh * 0.5]; wob = -jab * 2.5; kk = Math.min(1, dt * 30); }   // 썰 때 칼이 내려찍힌다
  else if (s.station) { key = 'P'; tip = PICS.pinch.tipP; tgt = [(s.px + 1) / 2 * vw, (1 - s.py) / 2 * vh - jab * vh * 0.4]; kk = Math.min(1, dt * 30); }
  else tgt = [vw * 0.62 - jab * vw * 0.6, vh * 0.66 + bob * vh * 2.2 + down - jab * vh * 0.5];
  if (!picPt || picLast !== key) picPt = tgt.slice(); else { picPt[0] += (tgt[0] - picPt[0]) * kk; picPt[1] += (tgt[1] - picPt[1]) * kk; }
  picLast = key; picPlace(pics[key], tip, picPt[0], picPt[1], false, wob); ['S', 'W', 'P', 'K', 'KS'].forEach(function (k) { if (k !== key) picHide(k); });
  if (wearT < 1 && offT <= 0) picPlace(pics.L, PICS.pinch.tipP, vw * 0.38, vh * 0.66 - bob * vh * 2.2 + down, true, 0); else picHide('L');   // 장갑 낄 때 왼손도 같이 올라온다
}
function render(renderer) { renderer.clearDepth(); renderer.render(scene, cam); }
var wx = new T.Vector3(), wy = new T.Vector3(), wz = new T.Vector3(), wm = new T.Matrix4(), wq = new T.Quaternion(), wp = new T.Vector3(), wo = new T.Vector3();
/* 때 위를 실제로 문지르는 손: 닿은 자리(p)와 면의 방향(n)으로 본 장면 안에 놓는다 */
/* 집게손: 엄지와 검지로 집고 나머지는 말아 쥔 오른손. 검지 끝 자리를 userData.tip 에 둔다 */
function curl(root, a) { root.rotation.x = a[0]; var cur = root; for (var i = 0; i < 3; i++) { cur = cur.children[1]; if (!cur) break; cur.rotation.x = a[i + 1] || 0; } }
var skinMat = new T.MeshPhongMaterial({ color: 0xe6b192, shininess: 14, specular: 0x2c1c14, emissive: 0x2a1006, side: T.DoubleSide });   // 맨손
var nailMat = new T.MeshPhongMaterial({ color: 0xf2cfc5, shininess: 70, specular: 0x666060 });
/* 맨손 손가락: 마디마다 원기둥 + 이음 공(이음새가 안 보이게), 끝마디에 손톱. 다음 마디 묶음은 늘 children[1] */
function bfinger(x, y, z, lens, r, spread) {
  var root = new T.Group(), cur = root, i; root.position.set(x, y, z); root.rotation.y = spread;
  for (i = 0; i < 3; i++) {
    var L = lens[i], r0 = r * [1, 0.9, 0.82][i], r1 = r * [0.92, 0.84, 0.74][i], nx = new T.Group();
    cur.add(M(new T.CylinderGeometry(r0, r1, L, 16, 1, true), 0, 0, -L / 2, PI / 2, 0, 0, 1, 1, 0.86, skinMat));
    nx.position.set(0, 0, -L); cur.add(nx);
    cur.add(M(new T.SphereGeometry(r0, 16, 12), 0, 0, 0, 0, 0, 0, 1, 0.86, 1, skinMat));
    if (i === 2) { cur.add(M(new T.SphereGeometry(r1, 16, 12), 0, 0, -L, 0, 0, 0, 1, 0.86, 1.15, skinMat)); cur.add(M(new T.SphereGeometry(r1 * 0.92, 14, 10), 0, r1 * 0.62, -L * 0.72, -0.08, 0, 0, 0.95, 0.32, 1.45, nailMat)); }
    cur = nx;
  }
  return root;
}
/* 맨손 오른손(side 1). 자식 순서는 장갑과 같다: [0] 팔뚝 [1] 손목 [2] 손바닥 [3~6] 검지~새끼 [7] 엄지, 그 뒤 살집 */
function bareHand(side) {
  var g = new T.Group(), i;
  g.add(M(new T.CylinderGeometry(0.034, 0.025, 0.3, 20, 1, true), 0, -0.002, 0.16, PI / 2, 0, 0, 1.25, 1, 1, skinMat));
  g.add(M(new T.SphereGeometry(0.025, 18, 12), 0, -0.002, 0.008, 0, 0, 0, 1.24, 0.82, 1.2, skinMat));
  g.add(M(new T.SphereGeometry(1, 28, 18), 0, 0, -0.047, 0, 0, 0, 0.043, 0.0145, 0.056, skinMat));
  var fx = [-0.029, -0.0095, 0.0105, 0.0285], fz = [-0.094, -0.097, -0.094, -0.086], fr = [0.0094, 0.0097, 0.0091, 0.008];
  var fl = [[0.04, 0.025, 0.021], [0.044, 0.028, 0.022], [0.041, 0.027, 0.021], [0.032, 0.019, 0.018]];
  for (i = 0; i < 4; i++) g.add(bfinger(fx[i] * side, 0.002, fz[i], fl[i], fr[i], -(i - 1.5) * 0.05 * side));
  var th = bfinger(-0.036 * side, -0.006, -0.032, [0.04, 0.03, 0.025], 0.0118, 0.7 * side); th.rotation.x = -0.25; g.add(th);
  for (i = 0; i < 4; i++) g.add(M(new T.SphereGeometry(fr[i] * 1.12, 14, 10), fx[i] * side, 0.003, fz[i] + 0.004, 0, 0, 0, 1, 0.9, 1, skinMat));   // 손가락 뿌리 마디
  g.add(M(new T.SphereGeometry(1, 18, 12), -0.024 * side, -0.006, -0.042, 0, 0, 0, 0.024, 0.015, 0.034, skinMat));   // 엄지 두덩
  g.add(M(new T.SphereGeometry(1, 18, 12), 0.029 * side, -0.004, -0.052, 0, 0, 0, 0.017, 0.013, 0.04, skinMat));      // 새끼 두덩
  return g;
}
/* 맨손 손가락을 매끈한 관 하나로: 마디 자리(뼈대)를 지나는 곡선에 끝으로 갈수록 가늘어지는 관을 씌우고, 마디 공과 토막은 숨긴다 */
function smoothFingers(g, f) {
  g.updateMatrixWorld(true);
  var R = [0.0094, 0.0097, 0.0091, 0.008, 0.0118], w = new T.Vector3();
  f.forEach(function (root, n) {
    var pts = [], cur = root, objs = [];
    while (cur) { objs.push(cur); cur = cur.children[1] && cur.children[1].isGroup ? cur.children[1] : null; }
    objs.forEach(function (o) { pts.push(g.worldToLocal(o.getWorldPosition(new T.Vector3()))); });
    var d = pts[1].clone().sub(pts[0]).normalize(); pts.unshift(pts[0].clone().addScaledVector(d, -0.01));   // 손바닥 속에서 시작
    var last = pts.length - 1, dEnd = pts[last].clone().sub(pts[last - 1]).normalize(); pts[last].addScaledVector(dEnd, -0.002);
    var curve = new T.CatmullRomCurve3(pts, false, 'centripetal'), TS = 40, RS = 14, r0 = R[n];
    var geo = new T.TubeGeometry(curve, TS, r0, RS, false), pos = geo.attributes.position, i, j;
    for (i = 0; i <= TS; i++) {
      var t = i / TS, c = curve.getPointAt(t), k = t < 0.15 ? 1.05 : 1 - 0.3 * (t - 0.15) / 0.85;      // 뿌리는 조금 굵게, 끝으로 30% 가늘게
      for (j = 0; j <= RS; j++) { var id = i * (RS + 1) + j; w.fromBufferAttribute(pos, id).sub(c).multiplyScalar(k).add(c); pos.setXYZ(id, w.x, w.y, w.z); }
    }
    geo.computeVertexNormals(); g.add(new T.Mesh(geo, skinMat));
    var tipC = new T.Mesh(new T.SphereGeometry(r0 * 0.7, 16, 12), skinMat); tipC.position.copy(curve.getPointAt(1)); g.add(tipC);   // 손끝 둥글게
    var baseC = new T.Mesh(new T.SphereGeometry(r0 * 1.05, 16, 12), skinMat); baseC.position.copy(curve.getPointAt(0)); baseC.scale.set(1, 0.85, 1); g.add(baseC);   // 뿌리 마디: 관 끝을 막는 둥근 살
    root.traverse(function (o) { if (o.isMesh && (o.material !== nailMat || (n >= 1 && n <= 3))) o.visible = false; });   // 말아 쥔 세 손가락은 손톱이 점처럼 보여서 뺀다
  });
  for (var q = 8; q <= 11; q++) g.children[q].visible = false;          // 손가락 뿌리 혹은 뺀다
}
function makePinch(bare) {
  var g = bare ? bareHand(1) : glove(1), f = g.children.slice(3, 8), tip = new T.Object3D();          // f: 검지 중지 약지 새끼 엄지
  /* 책장 넘기는 손 사진(구글 이미지) 기준: 엄지는 거의 펴서 종이 위를 누르고, 검지는 가운데 마디를 90도쯤 굽혀 아래에서 받친다.
     나머지 셋은 검지 밑으로 붙여 느슨한 주먹, 새끼 쪽으로 갈수록 조금 더 말리고 끝마디는 가운데 마디의 절반쯤 */
  curl(f[1], [-0.85, -1.35, -0.62]); curl(f[2], [-0.95, -1.42, -0.66]); curl(f[3], [-1.02, -1.48, -0.68]);
  f[1].rotation.y = 0.04; f[2].rotation.y = 0.0; f[3].rotation.y = -0.05;
  if (bare) {                                                                            // 맨손: 손목 바로 위부터 남색 츄리닝 소매
    var shirt = new T.MeshLambertMaterial({ color: 0x27304a, side: T.DoubleSide });
    g.add(M(new T.CylinderGeometry(0.05, 0.053, 0.66, 22, 1, true), 0, 0.004, 0.29, PI / 2, 0, 0, 1.12, 1, 0.72, shirt));      // 손등 중간까지 덮는 큰 소매
    g.add(M(new T.TorusGeometry(0.053, 0.008, 8, 24), 0, 0.004, -0.04, 0, 0, 0, 1.12, 0.72, 1, new T.MeshLambertMaterial({ color: 0x343e5c })));
    g.add(M(new T.BoxGeometry(0.004, 0.012, 0.64), 0.06, 0.012, 0.29, 0, 0, 0, 1, 1, 1, new T.MeshLambertMaterial({ color: 0xe8e8e8 })));   // 소매 흰 줄
  } else g.add(M(new T.CylinderGeometry(0.052, 0.064, 0.6, 16, 1, true), 0, -0.004, 0.59, PI / 2, 0, 0, 1, 1, 0.85, sleeveMat));
  var e = f[0]; while (e.children[1]) e = e.children[1]; tip.position.set(0, -0.006, 0.006); e.add(tip);                 // 손가락 끝 살(지문 쪽)
  var t2 = new T.Object3D(), e2 = f[4]; while (e2.children[1]) e2 = e2.children[1]; t2.position.set(0, -0.007, 0.007); e2.add(t2);
  /* 엄지 끝이 검지 끝에 닿는 각도를 찾는다 */
  var a = new T.Vector3(), b = new T.Vector3(), best = 1e9, bp = null, i, j, k, m, n;
  var p, q;
  for (i = 0; i <= 6; i++) for (n = 0; n <= 8; n++) for (j = 0; j <= 5; j++) for (k = 0; k <= 5; k++) for (m = 0; m <= 2; m++) for (p = 0; p <= 3; p++) {
    var ry = i * 0.13, rz = -0.8 + n * 0.2, c0 = -0.1 - j * 0.14, im = -0.25 - k * 0.12, tc = -0.08 - m * 0.12, ip = -0.8 - p * 0.18;
    f[4].rotation.set(c0, ry, rz); curl(f[4], [c0, tc, tc * 0.6]); curl(f[0], [im, ip, ip * 0.5]);
    g.updateMatrixWorld(true); tip.getWorldPosition(a); t2.getWorldPosition(b); var dd = a.distanceTo(b) - tc * 0.004; if (dd < best) { best = dd; bp = [ry, rz, c0, im, tc, ip]; }
  }
  f[4].rotation.set(bp[2], bp[0], bp[1]); curl(f[4], [bp[2], bp[4], bp[4] * 0.6]); curl(f[0], [bp[3], bp[5], bp[5] * 0.5]); f[0].rotation.y = 0.04;
  if (bare) smoothFingers(g, f);
  g.updateMatrixWorld(true); tip.getWorldPosition(a); t2.getWorldPosition(b); g.userData.tip = g.worldToLocal(a.add(b).multiplyScalar(0.5)); g.userData.gap = best;
  return g;
}
var sh = new T.Vector3(), cuff = new T.Vector3(), elb = new T.Vector3(), YUP = new T.Vector3(0, 1, 0), dq = new T.Quaternion();
function tube(m, a, b) { wo.copy(b).sub(a); var l = wo.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(YUP, wo.divideScalar(l)); m.scale.set(1, l, 1); m.visible = true; }
function world(p, n, cam, dt) {
  Rw.visible = armW.visible = armR.visible = ringR.visible = false;
  if (!p) { scrubScr = null; return; }
  wp.copy(p).project(cam); scrubScr = [(wp.x + 1) / 2 * innerWidth, (1 - wp.y) / 2 * innerHeight]; return;      // 그림 손이 이 자리를 문지른다
  sh.set(0.42, -0.34, 0.1).applyMatrix4(cam.matrixWorld);                                          // 오른쪽 어깨: 화면 밖 오른쪽 아래
  wy.copy(n);                                                                                      // 손바닥은 면에 납작하게
  wz.copy(sh).sub(p); wz.addScaledVector(wy, -wz.dot(wy)); if (wz.lengthSq() < 1e-6) wz.set(0, 0, 1); wz.normalize();   // 손목은 면 위에서 어깨 쪽, 손가락은 그 반대로
  wx.crossVectors(wy, wz).normalize(); wm.makeBasis(wx, wy, wz); wq.setFromRotationMatrix(wm);
  wo.set(0, -0.045, -0.105).applyQuaternion(wq); wp.copy(p).addScaledVector(n, 0.016).sub(wo);          // 수세미가 면에 닿게
  if (!Rw.visible) { Rw.visible = true; Rw.position.copy(wp); Rw.quaternion.copy(wq); }
  Rw.position.lerp(wp, Math.min(1, dt * 22)); Rw.quaternion.slerp(wq, Math.min(1, dt * 14)); Rw.updateMatrixWorld();
  /* 손목에서 꺾여 어깨까지: 팔꿈치까지는 고무장갑, 그 위는 소매 */
  cuff.set(0, -0.004, 0.035).applyMatrix4(Rw.matrixWorld); elb.copy(sh).sub(cuff); var L = elb.length(); elb.multiplyScalar(Math.min(0.3, L * 0.45) / L).add(cuff);
  tube(armR, cuff, elb); tube(armW, elb, sh);
  ringR.position.copy(elb); dq.setFromUnitVectors(new T.Vector3(0, 0, 1), wo.copy(sh).sub(elb).normalize()); ringR.quaternion.copy(dq); ringR.visible = true;
}
return {
  init: init, world: world, makeGlove: glove, makePinch: makePinch, update: update, render: render,
  resize: function (a) { asp = a; cam.aspect = a; cam.updateProjectionMatrix(); },
  reset: function (h) { offT = 0; has = h; carry = null; tool = null; wearT = 1; },
  unwear: function () { offT = 1; carry = null; },
  wear: function () { offT = 0; has = true; wearT = 0; R.position.set(0.2, -0.8, -0.4); L.position.set(-0.2, -0.8, -0.4); },
  jab: function () { jabT = 0; }, carry: function (c) { carry = c; }, tool: function (t) { tool = t; }, scene: scene
};
})();