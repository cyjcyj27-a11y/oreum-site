// 효과: 만화 의성어 글자(DOM), 피 튀김·전기 불꽃·물 튐·스프레이 구름·번데기·알.
(function () {
  const F = (window.FX = {});
  const V3 = THREE.Vector3;
  let scene, parts = [], onoms = [], puffTex, dotTex;
  function tex(draw) { const cv = document.createElement('canvas'); cv.width = cv.height = 64; draw(cv.getContext('2d')); return new THREE.CanvasTexture(cv); }
  F.init = function (s) {
    scene = s;
    puffTex = tex((g) => { const gr = g.createRadialGradient(32, 32, 3, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    dotTex = tex((g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill(); g.strokeStyle = '#1c1426'; g.lineWidth = 7; g.stroke(); });
    // 미리 만든 판(돌려 씀)
    for (let i = 0; i < 70; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false })); sp.visible = false; scene.add(sp); parts.push({ s: sp, life: 0 }); }
    const host = document.getElementById('onoms');
    for (let i = 0; i < 8; i++) { const d = document.createElement('div'); d.className = 'onom'; d.hidden = true; host.appendChild(d); onoms.push({ el: d, life: 0, p: new V3() }); }
    // 번데기(쉼표 모양 검은 몸)
    const pg = new THREE.Group();
    const pb = TOON.mesh(new THREE.SphereGeometry(0.009, 12, 8), '#3a3036'); pb.scale.set(1, 0.9, 1.1); pg.add(pb);
    const pt = TOON.mesh(new THREE.CapsuleGeometry(0.0035, 0.012, 4, 8), '#4a3e44'); pt.position.set(0, -0.006, 0.012); pt.rotation.x = 1.2; pg.add(pt);
    pg.visible = false; scene.add(pg); F.pupaM = pg;
    // 알 뗏목(작은 검은 쌀알)
    F.eggM = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.0008, 0.0036, 3, 6), TOON.col('#2a2228'), 48);
    F.eggM.count = 0; F.eggM.frustumCulled = false; scene.add(F.eggM);
  };
  function emit(p, o) {
    const q = parts.find((x) => x.life <= 0); if (!q) return;
    q.s.visible = true; q.s.position.copy(p); q.life = q.max = o.life || 0.6; q.v = o.v ? o.v.clone() : new V3(); q.g = o.g || 0; q.s0 = o.size || 0.01; q.s1 = o.size1 === undefined ? q.s0 : o.size1;
    q.s.material.map = o.puff ? puffTex : dotTex; q.s.material.color.set(o.col || '#fff'); q.s.material.opacity = o.op || 1; q.op = o.op || 1; q.s.material.needsUpdate = true;
    q.s.scale.setScalar(q.s0);
  }
  F.splat = function (p, belly) {
    const n = 10 + Math.floor(belly * 14);
    for (let i = 0; i < n; i++) { const v = new V3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).multiplyScalar(0.5 + belly * 0.6); emit(p, { v, g: 2.5, life: 0.5 + Math.random() * 0.3, size: 0.006 + Math.random() * 0.008, size1: 0.003, col: Math.random() < 0.5 ? '#e3243f' : '#b0142a' }); }
  };
  F.spark = function (p) {
    for (let i = 0; i < 22; i++) { const v = new V3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).multiplyScalar(1.2); emit(p, { v, g: 0.5, life: 0.3 + Math.random() * 0.2, size: 0.012, size1: 0.001, col: Math.random() < 0.5 ? '#9fdcff' : '#ffffff', puff: true }); }
  };
  F.splash = function (p) { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; emit(p, { v: new V3(Math.cos(a) * 0.15, 0.3 + Math.random() * 0.2, Math.sin(a) * 0.15), g: 2, life: 0.45, size: 0.005, size1: 0.002, col: '#bfe0ff' }); } };
  F.trail = function (p) { for (let i = 0; i < 6; i++) emit(p, { v: new V3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1), life: 0.35, size: 0.012, size1: 0.002, col: '#ffffff', puff: true, op: 0.7 }); };
  F.spray = function (p) { for (let i = 0; i < 16; i++) emit(p, { v: new V3(Math.random() - 0.5, Math.random() * 0.3 - 0.1, Math.random() - 0.5).multiplyScalar(0.25), life: 3.0, size: 0.06, size1: 0.42, col: '#e2f5c8', puff: true, op: 0.55 }); };
  F.clap = function (p) { for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; emit(p, { v: new V3(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0), life: 0.22, size: 0.008, size1: 0.002, col: '#ffe680' }); } };
  F.dust = function (p) { for (let i = 0; i < 6; i++) emit(p, { v: new V3((Math.random() - 0.5) * 0.4, Math.random() * 0.3, (Math.random() - 0.5) * 0.4), life: 0.3, size: 0.01, size1: 0.003, col: '#ffffff' }); };
  F.pupa = function (on) { F.pupaOn = on; F.pupaM.visible = on; if (on) F.pupaM.position.set(WORLD.spawn.x, WORLD.basin.y + 0.004, WORLD.spawn.z); };
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion();
  F.eggs = function (n, b) {
    if (n === F.eggM.count) return;
    for (let i = F.eggM.count; i < n; i++) {
      const row = Math.floor(i / 8), col = i % 8;
      _q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
      _m.compose(new V3(b.x - 0.0068 + col * 0.0018 + (row % 2) * 0.0009, b.y + 0.0006, b.z + 0.026 + row * 0.0042), _q, new V3(1, 1, 1));
      F.eggM.setMatrixAt(i, _m);
    }
    F.eggM.count = n; F.eggM.instanceMatrix.needsUpdate = true;
  };
  // 만화 글자: 세계 자리에 붙어 커졌다 사라짐
  F.onom = function (txt, p, col, size) {
    let o = onoms.find((x) => x.life <= 0) || onoms[0];
    o.el.textContent = txt; o.el.style.color = col || '#fff'; o.el.hidden = false; o.life = o.max = 0.9; o.p.copy(p); o.size = size || 1; o.rot = (Math.random() - 0.5) * 16;
  };
  const _v = new V3();
  F.update = function (dt, rdt) {
    for (const q of parts) {
      if (q.life <= 0) continue;
      q.life -= dt; if (q.life <= 0) { q.s.visible = false; continue; }
      q.v.y -= q.g * dt; q.s.position.addScaledVector(q.v, dt); q.v.multiplyScalar(1 - Math.min(1, dt * 1.5));
      const k = 1 - q.life / q.max; q.s.scale.setScalar(q.s0 + (q.s1 - q.s0) * k); q.s.material.opacity = q.op * Math.min(1, q.life / (q.max * 0.4));
    }
    if (F.pupaOn) { F.pupaM.rotation.z = Math.sin(performance.now() / 90) * 0.25; F.pupaM.position.y = WORLD.basin.y + 0.004 + Math.abs(Math.sin(performance.now() / 160)) * 0.002; }
    const W = innerWidth, H = innerHeight;
    for (const o of onoms) {
      if (o.life <= 0) continue;
      o.life -= rdt; if (o.life <= 0) { o.el.hidden = true; continue; }
      _v.copy(o.p).project(RND.camera);
      if (_v.z > 1) { o.el.hidden = true; continue; }
      const k = 1 - o.life / o.max, sc = (k < 0.15 ? 0.4 + (k / 0.15) * 0.8 : 1.2 - Math.min(0.2, (k - 0.15))) * o.size;
      o.el.hidden = false;
      o.el.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * W) + 'px,' + ((-_v.y * 0.5 + 0.5) * H - k * 40) + 'px) translate(-50%,-50%) rotate(' + o.rot + 'deg) scale(' + sc + ')';
      o.el.style.opacity = Math.min(1, o.life / 0.25);
    }
  };
})();
