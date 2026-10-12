/* 3D 장면 — 늦은 오후 바닥 한 뙈기, 딱지, 먼지, 흔들림 */
(function () {
  var T = THREE, P = window.DDKPaper;
  var H = 0.07;           // 딱지 두께
  var R = {}, renderer, scene, camera, sun, hemi, ground, decor, envTex, texCache = {};
  var shakeA = 0, camBase = new T.Vector3(), lookAt = new T.Vector3(0, 0, 0.35);
  var low = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  function init(canvas) {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !low, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.5 : 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene(); scene.background = new T.Color('#3b3128');
    camera = new T.PerspectiveCamera(36, 1, 0.1, 80);
    hemi = new T.HemisphereLight('#dfeaff', '#8a6a48', 1.5); scene.add(hemi);
    sun = new T.DirectionalLight('#ffd9a8', 3.4); sun.position.set(-4.5, 8.5, -3.2);
    sun.castShadow = true; sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048);
    var sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 25;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
    scene.add(sun); scene.add(sun.target);
    var fill = new T.DirectionalLight('#9fb8ff', 0.35); fill.position.set(5, 4, 6); scene.add(fill);
    // 환경맵: 하늘 그라데이션을 구워 금박·은박이 비추게
    var es = new T.Scene(), sg = new T.SphereGeometry(10, 32, 16);
    var sm = new T.ShaderMaterial({ side: T.BackSide, uniforms: {}, vertexShader: 'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec3 p;void main(){float h=p.y;vec3 c=mix(vec3(.45,.36,.28),vec3(1.,.82,.6),smoothstep(-.2,.15,h));c=mix(c,vec3(.55,.7,.95),smoothstep(.15,.8,h));c+=vec3(1.,.8,.5)*pow(max(dot(p,normalize(vec3(-.7,.45,-.5))),0.),24.)*3.;gl_FragColor=vec4(c,1.);}' });
    es.add(new T.Mesh(sg, sm));
    var pm = new T.PMREMGenerator(renderer); envTex = pm.fromScene(es, 0.02).texture; scene.environment = envTex;
    // 바닥
    var gg = new T.PlaneGeometry(40, 40); gg.rotateX(-Math.PI / 2);
    ground = new T.Mesh(gg, new T.MeshStandardMaterial({ color: '#fff', roughness: 0.95, envMapIntensity: 0.3 }));
    ground.receiveShadow = true; scene.add(ground);
    decor = new T.Group(); scene.add(decor);
    Object.keys(window.DDK_TEX).forEach(tex);   // 바닥 사진을 미리 읽어 둔다(처음 그릴 때 까만 바닥 방지)
    initDust();
    resize();
  }
  function tex(key) {
    if (texCache[key]) return texCache[key];
    var d = window.DDK_TEX[key], ld = new T.TextureLoader();
    var up = function (t) { if (renderer) renderer.initTexture(t); };   // 다 읽히면 바로 GPU 에 올려 둔다(처음 그 동네에 갈 때 멈춤 방지)
    var c = ld.load(d.c, up), n = ld.load(d.n, up);
    c.colorSpace = T.SRGBColorSpace; [c, n].forEach(function (t) { t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; });
    return (texCache[key] = { c: c, n: n });
  }
  function resize() {
    var w = innerWidth || 1, h = innerHeight || 1; lastW = w; lastH = h; renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 판(가로 8 × 세로 5.6)이 화면에 다 들어오게 거리를 잡는다. 위에서 거의 내려다봐서 높이 든 딱지는 커지기만 한다
    var tanH = Math.tan(camera.fov * Math.PI / 360);
    var port = camera.aspect < 1, needW = port ? 5.6 : 8.4, needH = port ? 7.2 : 5.6, cz = window.__DK_CAM;
    if (cz) { needW = cz.w || needW; needH = cz.h || needH; lookAt.z = cz.z != null ? cz.z : lookAt.z; }
    var dist = Math.max(needH / (2 * tanH), needW / (2 * tanH * camera.aspect));
    camBase.set(0, dist * 0.93, dist * 0.37 + (lookAt.z - 0.35));
    camera.position.copy(camBase); camera.lookAt(lookAt); camera.updateProjectionMatrix();
  }
  function srand(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function decalMat(cv, op) {
    var t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
    return new T.MeshStandardMaterial({ map: t, transparent: true, opacity: op == null ? 1 : op, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }
  function decal(cv, w, h, x, z, rot, op) {
    var g = new T.PlaneGeometry(w, h); g.rotateX(-Math.PI / 2);
    var m = new T.Mesh(g, decalMat(cv, op)); m.position.set(x, 0.002, z); m.rotation.y = rot || 0; m.receiveShadow = true; m.renderOrder = 1; decor.add(m); return m;
  }
  function chalk(c, pts, w, R) { // 분필 선: 여러 번 겹친 거친 줄
    for (var k = 0; k < 3; k++) { c.lineWidth = w * (0.6 + R() * 0.5); c.globalAlpha = 0.25 + R() * 0.25; c.beginPath();
      pts.forEach(function (p, i) { var x = p[0] + (R() - .5) * 3, y = p[1] + (R() - .5) * 3; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); }
    c.globalAlpha = 1;
  }
  function hopscotch(R) { // 사방치기 칸
    var cv = document.createElement('canvas'); cv.width = 512; cv.height = 1024; var c = cv.getContext('2d');
    c.strokeStyle = '#fbfbf4'; c.lineCap = 'round'; c.font = '700 54px sans-serif'; c.fillStyle = 'rgba(250,250,240,.55)'; c.textAlign = 'center';
    var box = function (x, y, w, h, n) { chalk(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], 7, R); c.fillText(n, x + w / 2, y + h / 2 + 18); };
    box(176, 860, 160, 140, '1'); box(176, 720, 160, 140, '2'); box(96, 580, 160, 140, '3'); box(256, 580, 160, 140, '4'); box(176, 440, 160, 140, '5'); box(96, 300, 160, 140, '6'); box(256, 300, 160, 140, '7');
    chalk(c, [[160, 300], [180, 170], [256, 120], [332, 170], [352, 300]], 7, R); c.fillText('8', 256, 230);
    return cv;
  }
  function doodle(R, kind) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 512; var c = cv.getContext('2d'); c.strokeStyle = kind === 'pink' ? '#f6b8c8' : '#fbfbf4'; c.lineCap = 'round';
    var pts = []; for (var i = 0; i <= 24; i++) pts.push([256 + Math.cos(i / 24 * 6.283) * 110, 256 + Math.sin(i / 24 * 6.283) * 110]); chalk(c, pts, 8, R);
    for (i = 0; i < 10; i++) { var a = i / 10 * 6.283; chalk(c, [[256 + Math.cos(a) * 140, 256 + Math.sin(a) * 140], [256 + Math.cos(a) * 200, 256 + Math.sin(a) * 200]], 8, R); }
    chalk(c, [[210, 230], [212, 240]], 12, R); chalk(c, [[300, 230], [302, 240]], 12, R); chalk(c, [[205, 290], [256, 320], [307, 290]], 8, R);
    return cv;
  }
  function line(R, w) { var cv = document.createElement('canvas'); cv.width = 64; cv.height = 1024; var c = cv.getContext('2d'); c.strokeStyle = '#f4f2ea'; for (var y = 0; y < 1024; y += 4) { c.globalAlpha = .5 + R() * .4; c.lineWidth = 34 + R() * 10; c.beginPath(); c.moveTo(32 + (R() - .5) * 4, y); c.lineTo(32 + (R() - .5) * 4, y + 6); c.stroke(); } return cv; }
  function feet(R) { var cv = document.createElement('canvas'); cv.width = cv.height = 512; var c = cv.getContext('2d');
    for (var i = 0; i < 9; i++) { var x = 60 + i * 50, y = 256 + Math.sin(i * 1.3) * 80 + (i % 2 ? 30 : -30); c.save(); c.translate(x, y); c.rotate(.2); var g = c.createRadialGradient(0, 0, 4, 0, 0, 30); g.addColorStop(0, 'rgba(60,40,20,.38)'); g.addColorStop(1, 'rgba(60,40,20,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 16, 30, 0, 0, 6.28); c.fill(); c.restore(); }
    return cv; }
  function kidShadow() { // 쭈그려 앉은 아이 그림자(낮은 해라 길게)
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; var c = cv.getContext('2d');
    c.filter = 'blur(10px)'; c.fillStyle = 'rgba(20,12,6,.55)';
    c.beginPath(); c.ellipse(128, 120, 46, 50, 0, 0, 6.28); c.fill();
    c.beginPath(); c.ellipse(128, 260, 80, 120, 0, 0, 6.28); c.fill();
    c.beginPath(); c.ellipse(80, 400, 34, 70, .1, 0, 6.28); c.fill(); c.beginPath(); c.ellipse(176, 400, 34, 70, -.1, 0, 6.28); c.fill();
    return cv;
  }
  var stoneGeo, stoneMats, capGeo, capMat, capTop, marbleGeo, leafMat;
  function props(R, kind) {
    if (!stoneGeo) {
      stoneGeo = new T.DodecahedronGeometry(0.1, 1);
      var p = stoneGeo.attributes.position; for (var i = 0; i < p.count; i++) { var k = 0.8 + Math.sin(i * 12.9898) * 0.2; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.6, p.getZ(i) * k); } stoneGeo.computeVertexNormals();
      stoneMats = ['#8a847a', '#a39c90', '#6f6a62', '#b8ad98'].map(function (c) { return new T.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true }); });
      capGeo = new T.CylinderGeometry(0.15, 0.16, 0.06, 20, 1, true);
      capMat = new T.MeshStandardMaterial({ color: '#b8bcc4', metalness: 0.8, roughness: 0.35 });
      capTop = new T.MeshStandardMaterial({ color: '#c82a2a', metalness: 0.5, roughness: 0.4 });
      marbleGeo = new T.SphereGeometry(0.1, 20, 14);
      var lc = document.createElement('canvas'); lc.width = lc.height = 128; var c = lc.getContext('2d');
      c.fillStyle = '#b8742a'; c.beginPath(); c.moveTo(64, 6); c.quadraticCurveTo(122, 50, 64, 122); c.quadraticCurveTo(6, 50, 64, 6); c.fill();
      c.strokeStyle = '#7a4a18'; c.lineWidth = 3; c.beginPath(); c.moveTo(64, 10); c.lineTo(64, 120); c.stroke();
      leafMat = decalMat(lc);
    }
    function spot() { for (var n = 0; n < 40; n++) { var x = (R() - .5) * 13, z = (R() - .5) * 9; if (Math.abs(x) > 3.6 || Math.abs(z) > 2.6) return [x, z]; } return [6, 4]; }
    var i, s, m;
    for (i = 0; i < 18; i++) { s = spot(); m = new T.Mesh(stoneGeo, stoneMats[i % 4]); var sc = 0.5 + R() * 1.1; m.scale.set(sc, sc, sc); m.position.set(s[0], 0.03 * sc, s[1]); m.rotation.y = R() * 6; m.castShadow = true; m.receiveShadow = true; decor.add(m); }
    var caps = kind === 'shop' ? 4 : 1;
    for (i = 0; i < caps; i++) { s = spot(); var g = new T.Group(); var a = new T.Mesh(capGeo, capMat); var b = new T.Mesh(new T.CircleGeometry(0.15, 20), capTop); b.rotation.x = -Math.PI / 2; b.position.y = 0.03; g.add(a, b); g.position.set(s[0], 0.03, s[1]); g.traverse(function (o) { o.castShadow = true; }); decor.add(g); }
    var marbles = kind === 'park' || kind === 'school' ? 3 : 1;
    for (i = 0; i < marbles; i++) { s = spot(); m = new T.Mesh(marbleGeo, new T.MeshStandardMaterial({ color: ['#3a8ae8', '#e84a6a', '#4fc07a'][i % 3], roughness: 0.08, metalness: 0.1, envMapIntensity: 1.4, transparent: true, opacity: 0.88 })); m.position.set(s[0], 0.1, s[1]); m.castShadow = true; decor.add(m); }
    var leaves = kind === 'park' || kind === 'school' ? 12 : 6;
    for (i = 0; i < leaves; i++) { s = spot(); var lg = new T.PlaneGeometry(0.3, 0.3); lg.rotateX(-Math.PI / 2); m = new T.Mesh(lg, leafMat); m.position.set(s[0], 0.004 + i * 0.0003, s[1]); m.rotation.y = R() * 6; decor.add(m); }
  }
  function setPlace(pl) {
    while (decor.children.length) { var o = decor.children.pop(); if (o.geometry && o.geometry !== stoneGeo && o.geometry !== capGeo && o.geometry !== marbleGeo) o.geometry.dispose(); }
    var t = tex(pl.tex), rep = 40 / pl.rep;
    [t.c, t.n].forEach(function (x) { x.repeat.set(rep, rep); });
    ground.material.map = t.c; ground.material.normalMap = t.n; ground.material.normalScale.set(1.1, 1.1); ground.material.needsUpdate = true;
    sun.color.set(pl.sun);
    var R = srand(pl.id.length * 977 + 13);
    if (pl.id === 'alley') { decal(hopscotch(R), 2.6, 5.2, -5.2, -0.6, 0.25, 0.85); decal(doodle(R), 1.6, 1.6, 4.9, 2.6, 0.4, 0.7); }
    if (pl.id === 'park') { decal(feet(R), 4, 4, 4.6, 1.8, 0.8, 1); decal(feet(R), 4, 4, -4.8, -2.6, 2.2, 1); }
    if (pl.id === 'school') { decal(line(R), 0.22, 20, -4.4, 0, 0.05, 0.9); decal(line(R), 0.22, 20, 0, -3.3, 1.571, 0.9); }
    if (pl.id === 'shop') { decal(doodle(R, 'pink'), 1.4, 1.4, -5, 2.4, 0.3, 0.65); }
    props(R, pl.id);
    renderer.compile(scene, camera);   // 새 동네 소품 셰이더를 판 시작 전에 준비
  }
  // 딱지 모형: 위 = 앞면(바람개비), 아래 = 뒷면
  var boxGeo = null, matCache = {};
  function mats(t) {
    if (matCache[t.id]) return matCache[t.id];
    var p = P.get(t), metal = t.pat === 'foil' || t.pat === 'king', gl = t.pat === 'gloss' || t.pat === 'glitter';
    function m(cv) { var x = new T.CanvasTexture(cv); x.colorSpace = T.SRGBColorSpace; x.anisotropy = 8;
      return new T.MeshStandardMaterial({ map: x, roughness: metal ? 0.32 : gl ? 0.45 : 0.82, metalness: metal ? 0.75 : 0, envMapIntensity: metal ? 1.2 : 0.5 }); }
    var side = new T.MeshStandardMaterial({ color: p.side, roughness: 0.85 });
    var top = m(p.front), bot = m(p.back);
    return (matCache[t.id] = [side, side, top, bot, side, side]);
  }
  function makeDdakji(t) {
    if (!boxGeo) boxGeo = new T.BoxGeometry(1, H, 1, 1, 1, 1);
    var mesh = new T.Mesh(boxGeo, mats(t)); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.type = t;
    scene.add(mesh); return mesh;
  }
  // 판 시작 때 이번 판에 나올 딱지 그림을 미리 만들고 GPU 에 올려 둔다(플레이 중 첫 등장 끊김 막기)
  function prewarm(list) { list.forEach(function (t) { mats(t).forEach(function (m) { if (m.map) renderer.initTexture(m.map); }); }); }
  function remove(o) { scene.remove(o); }
  // 조준 표시: 떨어질 자리 네모(점선 느낌의 흰 테)
  var aim = null;
  function aimMark() {
    if (aim) return aim;
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var c = cv.getContext('2d');
    c.strokeStyle = '#fff'; c.lineWidth = 10; c.setLineDash([26, 16]); c.strokeRect(8, 8, 240, 240);
    var g = new T.PlaneGeometry(1.04, 1.04); g.rotateX(-Math.PI / 2);
    aim = new T.Mesh(g, new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, opacity: 0.8, depthWrite: false }));
    aim.renderOrder = 2; aim.visible = false; scene.add(aim); return aim;
  }
  // 먼지
  var dust = [], dustMat;
  function initDust() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 64; var c = cv.getContext('2d');
    var g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,245,225,.9)'); g.addColorStop(1, 'rgba(255,245,225,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
    dustMat = new T.SpriteMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false });
    for (var i = 0; i < 40; i++) { var s = new T.Sprite(dustMat.clone()); s.visible = false; scene.add(s); dust.push({ s: s, life: 0 }); }
  }
  function puff(x, z, power, tint) {
    var n = 8 + Math.round(power * 14);
    for (var i = 0, k = 0; i < dust.length && k < n; i++) { var d = dust[i]; if (d.life > 0) continue; k++;
      var a = Math.random() * 6.283, sp = 1.2 + Math.random() * 2.4 * (0.5 + power);
      d.life = d.max = 0.45 + Math.random() * 0.5; d.vx = Math.cos(a) * sp; d.vz = Math.sin(a) * sp; d.vy = 0.3 + Math.random() * 0.8;
      d.s.position.set(x + Math.cos(a) * 0.5, 0.06, z + Math.sin(a) * 0.5); d.s.visible = true; d.size = 0.25 + Math.random() * 0.35;
      d.s.material.color.set(tint || '#e9dcc4'); }
  }
  function shake(a) { shakeA = Math.max(shakeA, a); }
  var ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0), v2 = new T.Vector2(), hit = new T.Vector3();
  function groundAt(cx, cy) {
    v2.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(v2, camera);
    return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null;
  }
  function toScreen(x, y, z) { var v = new T.Vector3(x, y, z).project(camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }
  var lastW = 0, lastH = 0;
  function render(dt) {
    if (innerWidth !== lastW || innerHeight !== lastH) resize();
    for (var i = 0; i < dust.length; i++) { var d = dust[i]; if (d.life <= 0) continue; d.life -= dt;
      if (d.life <= 0) { d.s.visible = false; continue; }
      var k = d.life / d.max; d.s.position.x += d.vx * dt; d.s.position.z += d.vz * dt; d.s.position.y += d.vy * dt; d.vx *= 0.92; d.vz *= 0.92;
      var sz = d.size * (1.8 - k); d.s.scale.set(sz, sz, sz); d.s.material.opacity = k * 0.75; }
    if (shakeA > 0.001) { camera.position.set(camBase.x + (Math.random() - .5) * shakeA, camBase.y + (Math.random() - .5) * shakeA, camBase.z + (Math.random() - .5) * shakeA); shakeA *= Math.pow(0.02, dt); }
    else camera.position.copy(camBase);
    renderer.render(scene, camera);
  }
  window.DDKScene = { init: init, resize: resize, setPlace: setPlace, makeDdakji: makeDdakji, prewarm: prewarm, remove: remove, aimMark: aimMark, puff: puff, shake: shake, groundAt: groundAt, toScreen: toScreen, render: render, H: H,
    get camera() { return camera; }, get renderer() { return renderer; }, get scene() { return scene; } };
})();
