/* 고시원 총무 — 퇴실 청소 득템 + 도감(10/4 사장님 "퇴실청소하다가 생필품 득템하는거 추가해줘 샴푸 화장품 휴지 과자 동전꽉찬저금통 이불 베개 인형 자전거등등 도감으로").
   205호가 30일 동안 8번 나가고(events.js MOVE), 나갈 때마다 쓰레기 셋 + 버리고 간 물건 셋. 도감에 없는 것부터 나온다.
   물건은 코드로 만든 3D(1단위 = 1m, 바닥 가운데가 원점, 앞이 +z). 도감 그림은 같은 모델을 게임 화면에 한 번 그려 떠 온다.
   도감은 새 게임을 해도 남는다(localStorage gosiwon_dex). */
GS.loot = (function () {
'use strict';
var T = THREE, PI = Math.PI;
var EN = /[?&]lang=en/.test(location.search), L = function (ko, en) { return EN ? en : ko; };
var $ = function (id) { return document.getElementById(id); };
/* 놓는 자리: bed 침대 위, desk 책상 위, floor 바닥, wall 벽에 기대기(긴 것). rare 희귀템(사장님 10/4 "자전거 전기포트를 희귀템으로"): 19일 퇴실부터, 일반 물건 다음에 나온다. every 수험서는 제일 흔한 것(10/4 "수험서는 젤 흔한 템임"): 방마다 하나, 합격 +1%는 처음만 */
var LIST = [
  { id: 'shampoo', ko: '샴푸', en: 'Shampoo', at: 'desk' },
  { id: 'cosme', ko: '화장품', en: 'Cosmetics', at: 'desk' },
  { id: 'tissue', ko: '휴지', en: 'Toilet Paper', at: 'floor', fx: L('휴지 +6', 'TP +6') },
  { id: 'snack', ko: '과자', en: 'Snacks', at: 'desk' },
  { id: 'piggy', ko: '저금통', en: 'Piggy Bank', at: 'desk', fx: '+20,000' },
  { id: 'blanket', ko: '이불', en: 'Blanket', at: 'bed' },
  { id: 'pillow', ko: '베개', en: 'Pillow', at: 'bed' },
  { id: 'teddy', ko: '인형', en: 'Teddy Bear', at: 'bed' },
  { id: 'bike', ko: '자전거', en: 'Bicycle', at: 'wall', wide: 1, rare: 1 },
  { id: 'cupramen', ko: '컵라면', en: 'Cup Noodles', at: 'floor' },
  { id: 'kettle', ko: '전기포트', en: 'Kettle', at: 'desk', rare: 1 },
  { id: 'umbrella', ko: '우산', en: 'Umbrella', at: 'wall' },
  { id: 'fan', ko: '선풍기', en: 'Fan', at: 'wall' },
  { id: 'book', ko: '수험서', en: 'Exam Books', at: 'desk', fx: L('합격 +1%', 'Pass +1%'), every: 1 },
  { id: 'guitar', ko: '기타', en: 'Guitar', at: 'wall' },
  { id: 'dumbbell', ko: '아령', en: 'Dumbbells', at: 'floor' }
];
var BY = {}; LIST.forEach(function (o) { BY[o.id] = o; BY[o.ko] = o; });
function name(id) { var o = BY[id]; return o ? (EN ? o.en : o.ko) : id; }

/* ---------- 도감(새 게임에도 남는다) ---------- */
var KEY = 'gosiwon_dex', dex = {};
try { dex = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { dex = {}; }
function saveDex() { try { localStorage.setItem(KEY, JSON.stringify(dex)); } catch (e) {} }
function count() { var n = 0; LIST.forEach(function (o) { if (dex[o.id]) n++; }); return n; }

/* ---------- 모델 ---------- */
function lam(c, o) { return new T.MeshLambertMaterial(Object.assign({ color: c }, o || {})); }
function pho(c, sh, o) { return new T.MeshPhongMaterial(Object.assign({ color: c, shininess: sh == null ? 60 : sh }, o || {})); }
function add(g, geo, m, x, y, z, rx, ry, rz) { var o = new T.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); g.add(o); return o; }
function cyl(rt, rb, h, s, open) { return new T.CylinderGeometry(rt, rb, h, s || 18, 1, !!open); }
function boxG(x, y, z) { return new T.BoxGeometry(x, y, z); }
function sph(r, w, h) { return new T.SphereGeometry(r, w || 18, h || 12); }
function lathe(pts, seg) { return new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), seg || 22); }
function tex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function label(text, bg, fg, w, h, fs, font) {
  return tex(w || 256, h || 128, function (g, W, H) {
    g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = (font || 'bold ') + (fs || 48) + "px 'Ria',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
    String(text).split('\n').forEach(function (l, i, a) { var tw = g.measureText(l).width, sc = Math.min(1, (W - 16) / tw); g.save(); g.translate(W / 2, H / 2 + (i - (a.length - 1) / 2) * (fs || 48) * 1.1); g.scale(sc, 1); g.fillText(l, 0, 0); g.restore(); });
  });
}
function puff(w, h, d, k) {                           // 가장자리로 갈수록 얇아지는 상자(베개·이불)
  var geo = new T.BoxGeometry(w, h, d, 10, 2, 8), p = geo.attributes.position;
  for (var i = 0; i < p.count; i++) { var x = p.getX(i) / (w / 2), z = p.getZ(i) / (d / 2), f = (1 - Math.pow(Math.abs(x), 4)) * (1 - Math.pow(Math.abs(z), 4)); p.setY(i, p.getY(i) * (1 - k + k * Math.max(0.15, f))); }
  geo.computeVertexNormals(); return geo;
}
function tube(g, m, a, b, r) {                       // a→b 막대(자전거 뼈대)
  var va = new T.Vector3(a[0], a[1], a[2] || 0), vb = new T.Vector3(b[0], b[1], b[2] || 0), d = vb.clone().sub(va), o = new T.Mesh(cyl(r, r, d.length(), 10), m);
  o.position.copy(va).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(o); return o;
}
var MK = {
  shampoo: function (g) {
    add(g, lathe([[0, 0], [0.034, 0], [0.039, 0.012], [0.039, 0.15], [0.031, 0.175], [0.015, 0.187], [0.015, 0.2], [0, 0.2]]), pho(0x2a9d8f, 90));
    add(g, cyl(0.0395, 0.0395, 0.075, 22, true), lam(0xffffff, { map: label(L('샴푸', 'SHAMPOO'), '#f4faf7', '#1d6b62', 256, 96, 44) }), 0, 0.085, 0);
    add(g, cyl(0.016, 0.016, 0.026), pho(0xf2f2ee, 60), 0, 0.213, 0); add(g, cyl(0.007, 0.007, 0.03), pho(0xf2f2ee), 0, 0.235, 0);
    add(g, boxG(0.024, 0.014, 0.06), pho(0xf2f2ee), 0, 0.252, 0.016);
  },
  cosme: function (g) {
    add(g, boxG(0.05, 0.13, 0.036), pho(0xf3b6c8, 100), -0.045, 0.065, 0); add(g, cyl(0.013, 0.013, 0.03), pho(0xd4af37, 120), -0.045, 0.145, 0);
    add(g, boxG(0.051, 0.05, 0.002), lam(0xffffff, { map: label('TONER', '#fff6f8', '#b34766', 128, 128, 34) }), -0.045, 0.07, 0.019);
    add(g, cyl(0.034, 0.034, 0.04), pho(0xfdfdfb, 80), 0.04, 0.02, 0.03); add(g, cyl(0.036, 0.036, 0.016), pho(0xd4af37, 120), 0.04, 0.048, 0.03);
    add(g, cyl(0.011, 0.011, 0.06), pho(0x151515, 90), 0.045, 0.03, -0.035); add(g, cyl(0.008, 0.009, 0.022), pho(0xb3132b, 90), 0.045, 0.071, -0.035);
    add(g, cyl(0.034, 0.034, 0.012), pho(0xe0a090, 110), -0.01, 0.006, 0.065);
  },
  tissue: function (g) {
    var w = lam(0xfbfbf8), core = lam(0xb48a5a);
    for (var i = 0; i < 6; i++) { var x = (i % 3 - 1) * 0.106, z = (i < 3 ? -1 : 1) * 0.054; add(g, cyl(0.052, 0.052, 0.1, 22), w, x, 0.05, z); add(g, cyl(0.018, 0.018, 0.102, 12), core, x, 0.05, z); }
    add(g, boxG(0.33, 0.106, 0.222), pho(0xffffff, 120, { transparent: true, opacity: 0.18, depthWrite: false }), 0, 0.053, 0);
    add(g, boxG(0.16, 0.06, 0.002), lam(0xffffff, { map: label(L('휴지 30m', 'TISSUE'), '#e84d7a', '#ffffff', 256, 96, 46) }), 0, 0.055, 0.112);
  },
  snack: function (g) {
    var geo = new T.BoxGeometry(0.17, 0.23, 0.05, 6, 8, 2), p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) { var x = p.getX(i) / 0.085, y = p.getY(i) / 0.115; p.setZ(i, p.getZ(i) * Math.max(0.08, (1 - y * y * y * y) * (1 - 0.45 * x * x * x * x))); }
    geo.computeVertexNormals();
    var t = tex(256, 340, function (c, W, H) {
      var gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffcf3a'); gr.addColorStop(1, '#f07b16'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.fillStyle = '#d6261e'; c.fillRect(0, H * 0.34, W, H * 0.28); c.fillStyle = '#fff'; c.font = "bold 70px 'Ria',sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(L('과자', 'SNACK'), W / 2, H * 0.48); c.fillStyle = '#7a3a00'; for (var k = 0; k < 5; k++) { c.beginPath(); c.ellipse(60 + k * 34, H * 0.8 + (k % 2) * 14, 16, 10, 0.4, 0, 7); c.fill(); }
    });
    add(g, geo, pho(0xffffff, 110, { map: t }), 0, 0.026, 0, -PI / 2 + 0.06, 0, 0.25);
  },
  piggy: function (g) {
    var pk = pho(0xf4a6b8, 50), dk = lam(0x2a1a1a);
    var b = add(g, sph(0.085, 24, 16), pk, 0, 0.1, 0); b.scale.set(1.25, 1, 1);
    add(g, cyl(0.032, 0.034, 0.03), pk, 0.112, 0.1, 0, 0, 0, PI / 2); add(g, sph(0.006), dk, 0.128, 0.104, 0.011); add(g, sph(0.006), dk, 0.128, 0.104, -0.011);
    add(g, sph(0.008), dk, 0.085, 0.135, 0.035); add(g, sph(0.008), dk, 0.085, 0.135, -0.035);
    add(g, new T.ConeGeometry(0.024, 0.04, 10), pk, 0.05, 0.185, 0.04, 0.3, 0, -0.3); add(g, new T.ConeGeometry(0.024, 0.04, 10), pk, 0.05, 0.185, -0.04, -0.3, 0, -0.3);
    [[0.06, 0.04], [0.06, -0.04], [-0.06, 0.04], [-0.06, -0.04]].forEach(function (q) { add(g, cyl(0.018, 0.02, 0.045), pk, q[0], 0.022, q[1]); });
    add(g, boxG(0.045, 0.004, 0.009), dk, -0.01, 0.185, 0);
    var gold = pho(0xd9b44a, 120); add(g, cyl(0.017, 0.017, 0.004), gold, -0.01, 0.198, 0, PI / 2, 0, 0); add(g, cyl(0.017, 0.017, 0.004), gold, -0.07, 0.003, 0.08); add(g, cyl(0.017, 0.017, 0.004), gold, -0.055, 0.007, 0.095, 0.2);
    add(g, new T.TorusGeometry(0.014, 0.004, 6, 12, PI * 1.5), pk, -0.108, 0.115, 0, 0, PI / 2, 0);
  },
  blanket: function (g) {                             // 큰 체크무늬 이불을 세 겹 접어 쌓은 것
    var t = tex(256, 256, function (c) {
      c.fillStyle = '#e9a79b'; c.fillRect(0, 0, 256, 256); c.fillStyle = 'rgba(255,246,228,.55)'; c.fillRect(0, 96, 256, 64); c.fillRect(96, 0, 64, 256);
      c.fillStyle = 'rgba(160,60,60,.35)'; c.fillRect(0, 120, 256, 16); c.fillRect(120, 0, 16, 256);
    });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1.4, 1);
    for (var i = 0; i < 3; i++) { var m = add(g, puff(0.46, 0.05, 0.32, 0.5), lam(0xffffff, { map: t }), (i - 1) * 0.01, 0.025 + i * 0.047, (i % 2) * 0.012); m.scale.set(1 - i * 0.02, 1, 1); }
  },
  pillow: function (g) {                              // 통통한 베개 + 줄무늬 베갯잇
    var t = tex(128, 128, function (c) { c.fillStyle = '#dce8f7'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#b9cdea'; for (var i = 0; i < 8; i++) c.fillRect(i * 16, 0, 6, 128); });
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 1);
    add(g, puff(0.5, 0.13, 0.32, 1), lam(0xffffff, { map: t }), 0, 0.065, 0);
  },
  teddy: function (g) {
    var br = lam(0xa8743f), lt = lam(0xe2c393), bk = pho(0x111111, 120);
    var b = add(g, sph(0.065), br, 0, 0.07, 0); b.scale.set(1, 1.12, 0.9);
    add(g, sph(0.056), br, 0, 0.165, 0.005); add(g, sph(0.022), br, 0.042, 0.208, 0); add(g, sph(0.022), br, -0.042, 0.208, 0);
    add(g, sph(0.011), lt, 0.042, 0.208, 0.012); add(g, sph(0.011), lt, -0.042, 0.208, 0.012);
    var mz = add(g, sph(0.026), lt, 0, 0.152, 0.046); mz.scale.set(1, 0.8, 0.7); add(g, sph(0.009), bk, 0, 0.16, 0.064);
    add(g, sph(0.0075), bk, 0.021, 0.181, 0.05); add(g, sph(0.0075), bk, -0.021, 0.181, 0.05);
    var a1 = add(g, sph(0.022), br, 0.06, 0.09, 0.02); a1.scale.set(0.8, 1.4, 0.8); a1.rotation.z = 0.5; var a2 = add(g, sph(0.022), br, -0.06, 0.09, 0.02); a2.scale.set(0.8, 1.4, 0.8); a2.rotation.z = -0.5;
    var l1 = add(g, sph(0.026), br, 0.035, 0.022, 0.05); l1.scale.set(0.9, 0.8, 1.4); var l2 = add(g, sph(0.026), br, -0.035, 0.022, 0.05); l2.scale.set(0.9, 0.8, 1.4);
    add(g, new T.TorusGeometry(0.04, 0.008, 6, 20), lam(0xd8262a), 0, 0.12, 0.004, PI / 2);
  },
  bike: function (g) {
    var fr = pho(0xc0392b, 90), bk = pho(0x1c1c1c, 30), si = pho(0xc8ccd0, 120);
    [-0.47, 0.47].forEach(function (x) {
      add(g, new T.TorusGeometry(0.3, 0.017, 8, 40), bk, x, 0.31, 0); add(g, new T.TorusGeometry(0.285, 0.006, 6, 40), si, x, 0.31, 0);
      add(g, cyl(0.02, 0.02, 0.07), si, x, 0.31, 0, PI / 2);
      for (var k = 0; k < 8; k++) { var a = k * PI / 8; tube(g, si, [x - Math.cos(a) * 0.28, 0.31 - Math.sin(a) * 0.28, 0], [x + Math.cos(a) * 0.28, 0.31 + Math.sin(a) * 0.28, 0], 0.0022); }
    });
    var BB = [-0.05, 0.29, 0], ST = [-0.17, 0.74, 0], HT = [0.32, 0.76, 0], HB = [0.36, 0.6, 0];
    tube(g, fr, BB, ST, 0.017); tube(g, fr, ST, HT, 0.015); tube(g, fr, BB, HB, 0.019); tube(g, fr, HT, HB, 0.02);
    tube(g, fr, [-0.47, 0.31, 0.035], [-0.05, 0.29, 0.02], 0.009); tube(g, fr, [-0.47, 0.31, -0.035], [-0.05, 0.29, -0.02], 0.009);
    tube(g, fr, [-0.47, 0.31, 0.035], [-0.17, 0.74, 0.01], 0.008); tube(g, fr, [-0.47, 0.31, -0.035], [-0.17, 0.74, -0.01], 0.008);
    tube(g, si, [0.36, 0.6, 0.03], [0.47, 0.31, 0.035], 0.009); tube(g, si, [0.36, 0.6, -0.03], [0.47, 0.31, -0.035], 0.009);
    tube(g, si, ST, [-0.2, 0.86, 0], 0.011); add(g, boxG(0.2, 0.04, 0.085), bk, -0.2, 0.885, 0);
    tube(g, si, HT, [0.3, 0.9, 0], 0.011); tube(g, si, [0.3, 0.9, -0.26], [0.3, 0.9, 0.26], 0.011);
    add(g, cyl(0.016, 0.016, 0.1), bk, 0.3, 0.9, 0.23, PI / 2); add(g, cyl(0.016, 0.016, 0.1), bk, 0.3, 0.9, -0.23, PI / 2);
    add(g, cyl(0.085, 0.085, 0.008, 24), si, -0.05, 0.29, 0.05, PI / 2); tube(g, si, [-0.05, 0.29, 0.06], [-0.05, 0.16, 0.06], 0.008); add(g, boxG(0.08, 0.02, 0.05), bk, -0.05, 0.16, 0.09);
  },
  cupramen: function (g) {
    var cb = lam(0xc49a6c); add(g, boxG(0.38, 0.26, 0.28), cb, 0, 0.13, 0); add(g, boxG(0.06, 0.262, 0.282), lam(0xd9c08a), 0, 0.13, 0);
    add(g, boxG(0.3, 0.17, 0.002), lam(0xffffff, { map: label(L('컵라면\n12개입', 'CUP NOODLES\n12 PACK'), '#c62828', '#ffffff', 256, 150, 46) }), 0, 0.13, 0.141);
  },
  kettle: function (g) {
    var wh = pho(0xf7f7f4, 90), dk = pho(0x2b2b2b, 40);
    add(g, cyl(0.09, 0.09, 0.022), dk, 0, 0.011, 0); add(g, lathe([[0, 0], [0.074, 0], [0.08, 0.02], [0.077, 0.16], [0.058, 0.19], [0, 0.19]], 26), wh, 0, 0.022, 0);
    add(g, cyl(0.05, 0.056, 0.014), pho(0xd0d0cc, 80), 0, 0.218, 0); add(g, sph(0.013), dk, 0, 0.228, 0);
    add(g, boxG(0.018, 0.15, 0.03), dk, -0.115, 0.115, 0); add(g, boxG(0.05, 0.018, 0.03), dk, -0.093, 0.19, 0); add(g, boxG(0.05, 0.018, 0.03), dk, -0.093, 0.045, 0);
    add(g, cyl(0.011, 0.026, 0.085, 12), wh, 0.092, 0.16, 0, 0, 0, -1.0); add(g, boxG(0.012, 0.022, 0.016), pho(0xd8262a, 80), -0.12, 0.06, 0.016);
  },
  umbrella: function (g) {
    var u = new T.Group(); g.add(u); u.rotation.x = -0.13; u.position.z = 0.06;   // 등 뒤 벽에 기댄다
    add(u, cyl(0.005, 0.003, 0.06, 8), pho(0xb0b0b0, 100), 0, 0.03, 0);
    add(u, lathe([[0.004, 0.05], [0.012, 0.08], [0.046, 0.5], [0.032, 0.62], [0.012, 0.67], [0, 0.67]], 8), lam(0x23345e), 0, 0, 0);
    add(u, boxG(0.03, 0.022, 0.095), lam(0x1a2848), 0, 0.42, 0);
    add(u, cyl(0.007, 0.007, 0.14, 8), pho(0xc8c8c8, 100), 0, 0.74, 0);
    add(u, new T.TorusGeometry(0.035, 0.011, 8, 18, PI), pho(0x5a3a1e, 60), 0.035, 0.81, 0, 0, 0, 0);
  },
  fan: function (g) {
    var wh = pho(0xf3f4f1, 70), bl = pho(0x8fc8e8, 90, { transparent: true, opacity: 0.85 }), wire = pho(0xdcdcdc, 80);
    add(g, cyl(0.11, 0.13, 0.03, 26), wh, 0, 0.015, 0); add(g, cyl(0.015, 0.015, 0.46), wh, 0, 0.25, 0);
    var hd = new T.Group(); hd.position.set(0, 0.55, 0); g.add(hd); hd.rotation.x = -0.08;
    var mo = add(hd, sph(0.05), wh, 0, 0, -0.04); mo.scale.set(1, 1, 1.3);
    add(hd, new T.TorusGeometry(0.15, 0.006, 6, 40), wire, 0, 0, 0.045); add(hd, new T.TorusGeometry(0.15, 0.006, 6, 40), wire, 0, 0, -0.005);
    for (var k = 0; k < 12; k++) { var a = k * PI / 6; tube(hd, wire, [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.045], [Math.cos(a) * 0.15, Math.sin(a) * 0.15, -0.005], 0.003); tube(hd, wire, [0, 0, 0.052], [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.045], 0.0018); }
    add(hd, cyl(0.03, 0.03, 0.016), pho(0x3c8cc0, 80), 0, 0, 0.056, PI / 2);
    for (var j = 0; j < 3; j++) { var b = add(hd, sph(1, 16, 8), bl, 0, 0, 0.02); b.scale.set(0.055, 0.12, 0.01); b.position.set(Math.cos(j * 2.09 + 0.5) * 0.07, Math.sin(j * 2.09 + 0.5) * 0.07, 0.02); b.rotation.z = j * 2.09 + 0.5 - PI / 2; }
  },
  book: function (g) {
    function bk(t, col, y, ry) {
      var cv = label(t, col, '#ffffff', 256, 340, 92), side = lam(0xf1ead6), cm = lam(0xffffff, { map: cv }), cc = lam(col);
      var m = new T.Mesh(boxG(0.19, 0.036, 0.26), [side, cc, cm, cc, side, side]); m.position.y = y; m.rotation.y = ry + PI; g.add(m);
    }
    bk(L('기출\n문제집', 'PAST\nEXAMS'), '#1f5aa6', 0.018, 0.08); bk(L('핵심\n요약', 'KEY\nNOTES'), '#b8322a', 0.055, -0.18);
  },
  guitar: function (g) {
    var wd = pho(0xc8853a, 70), dk = pho(0x4a2a12, 50), u = new T.Group(); g.add(u); u.rotation.x = -0.1; u.position.z = 0.06;
    add(u, cyl(0.19, 0.19, 0.09, 32), wd, 0, 0.21, 0, PI / 2); add(u, cyl(0.145, 0.145, 0.09, 32), wd, 0, 0.46, 0, PI / 2);
    add(u, cyl(0.045, 0.045, 0.002, 24), lam(0x140c06), 0, 0.37, 0.046, PI / 2); add(u, boxG(0.11, 0.02, 0.012), dk, 0, 0.17, 0.05);
    add(u, boxG(0.05, 0.5, 0.025), dk, 0, 0.83, 0.02); add(u, boxG(0.07, 0.15, 0.02), dk, 0, 1.15, 0.02);
    for (var s = 0; s < 6; s++) add(u, boxG(0.0015, 0.93, 0.0015), pho(0xe8e8e8, 120), (s - 2.5) * 0.007, 0.64, 0.054);
  },
  dumbbell: function (g) {
    var ir = pho(0x2a2a2c, 70), hd = pho(0x9a9ea4, 110);
    [-0.065, 0.065].forEach(function (z) {
      add(g, cyl(0.012, 0.012, 0.13), hd, 0, 0.042, z, 0, 0, PI / 2);
      add(g, cyl(0.042, 0.042, 0.03, 8), ir, -0.065, 0.042, z, 0, 0, PI / 2); add(g, cyl(0.042, 0.042, 0.03, 8), ir, 0.065, 0.042, z, 0, 0, PI / 2);
    });
  }
};
function mk(id) { var g = new T.Group(); MK[id](g); return g; }

/* ---------- 도감 그림: 같은 모델을 게임 캔버스 구석에 한 번 그려 떠 온다 ---------- */
var icons = {}, sils = {}, isc, icam, BG = 0xefebda;
function iconOf(id, sil) {
  var cache = sil ? sils : icons; if (cache[id]) return cache[id];
  var R = GS.renderer, cv = R && R.domElement; if (!R) return '';
  if (!isc) {
    isc = new T.Scene(); isc.add(new T.HemisphereLight(0xffffff, 0x8a8578, 1.6)); var dl = new T.DirectionalLight(0xffffff, 1.6); dl.position.set(1.5, 2.5, 3); isc.add(dl);
    icam = new T.PerspectiveCamera(30, 1, 0.01, 20);
  }
  var g = mk(id); isc.add(g);
  var bb = new T.Box3().setFromObject(g), c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3()), r = Math.max(sz.x, sz.y, sz.z) * 0.62;
  var dir = new T.Vector3(0.55, 0.42, 1).normalize(); icam.position.copy(c).addScaledVector(dir, r / Math.tan(15 * PI / 180)); icam.lookAt(c); icam.updateProjectionMatrix();
  var pr = R.getPixelRatio(), S = 160, px = Math.round(S * pr), old = new T.Vector4(); R.getViewport(old);
  var oc = new T.Color(); R.getClearColor(oc); var oa = R.getClearAlpha(), ost = R.getScissorTest();
  isc.overrideMaterial = sil ? new T.MeshBasicMaterial({ color: 0x3a3830 }) : null;
  R.setRenderTarget(null); R.setViewport(0, 0, S, S); R.setScissor(0, 0, S, S); R.setScissorTest(true); R.setClearColor(BG, 1); R.clear(); R.render(isc, icam);
  var c2 = document.createElement('canvas'); c2.width = c2.height = 192; c2.getContext('2d').drawImage(cv, 0, cv.height - px, px, px, 0, 0, 192, 192);
  R.setScissorTest(ost); R.setViewport(old); R.setClearColor(oc, oa); isc.remove(g); isc.overrideMaterial = null;
  g.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); });
  return cache[id] = c2.toDataURL('image/png');
}

/* ---------- 주웠다: 도감에 넣고 카드 띄우기 ---------- */
var cardQ = [], cardOn = false;
function got(id) {
  var o = BY[id], isNew = !dex[id], G = GS.G; dex[id] = (dex[id] || 0) + 1; saveDex();
  if (id === 'tissue') { G.rolls = Math.min(12, (G.rolls || 0) + 6); GS.ui.hud(); }
  if (id === 'piggy') setTimeout(function () { GS.coin(20000); }, 600);
  if (id === 'book' && isNew) { G.pass = Math.min(100, G.pass + 1); GS.ui.hud(); }
  if (!isNew && (!o.fx || o.every)) setTimeout(function () { GS.coin(2000); }, 600);       // 이미 있는 건 중고로 판다
  card(id, isNew); GS.snd(isNew ? (o.rare ? 'perfect' : 'great') : 'pick');
  if (isNew && count() === LIST.length && !dex._done) { dex._done = 1; saveDex(); setTimeout(function () { GS.ui.praise('COMPLETE'); GS.snd('perfect'); GS.coin(30000); }, 2600); }
  return isNew;
}
function card(id, isNew) { cardQ.push([id, isNew]); if (!cardOn) nextCard(); }
function nextCard() {
  var q = cardQ.shift(), el = $('loot'); if (!q) { cardOn = false; return; } cardOn = true;
  var o = BY[q[0]]; $('lootImg').src = iconOf(q[0]); $('lootName').textContent = name(q[0]);
  $('lootTag').textContent = q[1] ? (o.rare ? 'RARE' : 'NEW') : (o.fx && !o.every ? '' : L('중고 +2,000', 'SOLD +2,000')); $('lootTag').className = q[1] ? (o.rare ? 'rare' : 'new') : 'old';
  el.classList.toggle('rare', !!(q[1] && o.rare));
  $('lootFx').textContent = o.every && !q[1] ? '' : o.fx || ''; $('lootN').textContent = count() + ' / ' + LIST.length;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  setTimeout(nextCard, 2300);
}
/* ---------- 도감 창 ---------- */
function openDex(on) {
  var el = $('dex'); if (!on) { el.hidden = true; return; }
  var h = ''; LIST.forEach(function (o) {
    var k = !!dex[o.id]; h += '<div class="dx' + (k ? '' : ' no') + (o.rare ? ' rare' : '') + '"><img src="' + iconOf(o.id, !k) + '" alt=""><span>' + (k ? name(o.id) : '???') + '</span>' + (k && o.fx ? '<i>' + o.fx + '</i>' : '') + '</div>';
  });
  $('dexGrid').innerHTML = h; $('dexN').textContent = count() + ' / ' + LIST.length; el.hidden = false;
  [].forEach.call($('dexGrid').querySelectorAll('span'), function (sp) { var f = parseFloat(getComputedStyle(sp).fontSize); while (sp.scrollWidth > sp.parentNode.clientWidth - 4 && f > 8) { f -= 0.5; sp.style.fontSize = f + 'px'; } });   // 긴 영어 이름은 글자만 줄인다
}

return {
  LIST: LIST, BY: BY, mk: mk, got: got, name: name, open: openDex, icon: iconOf, have: function (id) { return !!dex[id]; }, count: count,
  en: function (ko) { var o = BY[ko]; return o ? o.en : null; },
  /* 이번 퇴실에 남길 물건: 도감에 없는 것 먼저, 날짜로 정해서 다시 불러도 같다. 자리 모자랄 때를 위해 넉넉히 돌려준다 */
  choose: function (day, taken) {
    var seed = day * 9301 + 49297, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    function shuf(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    var seen = function (o) { return taken.indexOf(o.id) >= 0; };   // 도감에 없고 이번 판에 안 나온 것 → 도감에 있지만 안 나온 것 → 이미 나온 것(16종이 다 나오면 겹친다)
    var ok = LIST.filter(function (o) { return !o.rare || day >= 19; }), com = function (o) { return !o.rare; }, rar = function (o) { return o.rare; };
    var fresh = ok.filter(function (o) { return !dex[o.id] && !seen(o); }), mid = ok.filter(function (o) { return dex[o.id] && !seen(o); });
    var ev = LIST.filter(function (o) { return o.every; }); com = function (o) { return !o.rare && !o.every; };
    return ev.concat(shuf(fresh.filter(com)), shuf(fresh.filter(rar)), shuf(mid), shuf(ok.filter(seen))).map(function (o) { return o.id; }).filter(function (id, i, a) { return a.indexOf(id) === i; });
  },
  _dex: function () { return dex; }, _reset: function () { dex = {}; saveDex(); icons = {}; sils = {}; }
};
})();
