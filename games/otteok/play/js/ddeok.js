// 떡 조각 만들기: 인절미·송편·무지개떡. 조각마다 {type, q(솜씨 0~1), mesh}.
(function () {
  const K = (window.DDEOK = {});
  const PI = Math.PI;

  // 하얀 찹쌀 겉(잔 쌀알 점)
  function riceTex() { return TOY.dustTex('#fbf7ef', ['#ffffff', '#efe6d6', '#f4ecdf'], 1400); }
  function kongTex() { return TOY.dustTex('#f4dc92', ['#e6c271', '#faeab8', '#dfb866', '#fdf0c8'], 5200); }

  // ---------- 인절미 ----------
  // 속(흰 떡) + 겉(콩고물 껍질, 묻은 만큼 보임)
  K.injeolmi = function (w) {
    w = w || 0.5;
    const g = new THREE.Group();
    const core = TOY.mesh(TOY.rbox(w, 0.34, 0.52, 0.12, 3), TOY.ddeok('#ffffff', { map: riceTex() }), 0, 0.17, 0, g);
    const coatM = TOY.mat('#ffffff', { rough: 0.95, map: kongTex(), op: 0 });
    coatM.depthWrite = false;
    const coat = TOY.mesh(TOY.rbox(w + 0.04, 0.38, 0.56, 0.14, 3), coatM, 0, 0.17, 0, g);
    coat.castShadow = false;
    g.userData = { type: 'injeolmi', coat, core, w, setCoat(k) { coat.material.opacity = k; coat.material.depthWrite = k > 0.95; coat.visible = k > 0.01; } };
    g.userData.setCoat(0);
    return g;
  };
  // 인절미는 조각마다 재질을 따로(묻는 정도가 다름)
  K.injeolmiOwn = function (w) {
    const g = K.injeolmi(w);
    g.userData.coat.material = g.userData.coat.material.clone();
    g.userData.setCoat(0);
    return g;
  };

  // ---------- 송편 ----------
  // 공에서 반달로 빚어지는 모양(같은 꼭짓점 수라 사이를 섞을 수 있다)
  let ballPos = null, songPos = null;
  function bases() {
    if (ballPos) return;
    const b = new THREE.SphereGeometry(0.5, 40, 24);
    ballPos = b.attributes.position.array.slice();
    songPos = TOY.songpyeonGeo().attributes.position.array.slice();
  }
  K.songpyeon = function (color) {
    bases();
    const geo = new THREE.SphereGeometry(0.5, 40, 24);
    const m = new THREE.Mesh(geo, TOY.ddeok(color, { emis: 0.1 }));
    m.castShadow = true; m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m);
    m.scale.setScalar(0.62); m.position.y = 0.31;
    const ud = (g.userData = { type: 'songpyeon', mesh: m, color, k: 0 });
    // k: 0 공 → 1 반달, 1 넘으면 너무 눌러서 납작하게 터짐
    ud.shape = function (k) {
      ud.k = k;
      const p = geo.attributes.position.array, kk = Math.min(1, k), over = Math.max(0, k - 1);
      for (let i = 0; i < p.length; i += 3) {
        let x = ballPos[i] + (songPos[i] - ballPos[i]) * kk;
        let y = ballPos[i + 1] + (songPos[i + 1] - ballPos[i + 1]) * kk;
        let z = ballPos[i + 2] + (songPos[i + 2] - ballPos[i + 2]) * kk;
        if (over > 0) { y *= 1 - over * 0.7; x *= 1 + over * 0.35; z *= 1 + over * 0.35; }
        p[i] = x; p[i + 1] = y; p[i + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      m.position.y = kk < 1 ? 0.31 * (1 - kk) + 0.0 * kk : 0;
    };
    ud.shape(0);
    return g;
  };
  // 다 빚은 송편(포장용, 공유 모양)
  K.songpyeonDone = function (color) {
    const m = new THREE.Mesh(TOY.songpyeonGeo(), TOY.ddeok(color, { emis: 0.1 }));
    m.castShadow = true; m.receiveShadow = true; m.scale.setScalar(0.62);
    const g = new THREE.Group(); g.add(m);
    g.userData = { type: 'songpyeon', mesh: m, color };
    return g;
  };

  // ---------- 무지개떡 ----------
  K.mujigaeLayer = function (color, w, d) {
    return TOY.mesh(TOY.rbox(w, 0.13, d, 0.05, 2), TOY.ddeok(color, { emis: 0.08, rough: 0.8 }), 0, 0, 0);
  };
  // 조각: 다섯 겹(겹마다 어긋난 만큼 살짝 비뚤)
  K.mujigae = function (offs) {
    const g = new THREE.Group();
    const cols = DATA.DDEOK.mujigae.cols;
    for (let i = 0; i < 5; i++) {
      const l = K.mujigaeLayer(cols[i], 0.5, 0.5);
      l.position.set((offs ? offs[i] : 0) * 0.25, 0.065 + i * 0.13, 0);
      g.add(l);
    }
    // 위에 하얀 쌀가루 한 겹
    const top = TOY.mesh(TOY.rbox(0.48, 0.03, 0.48, 0.02, 1), TOY.ddeok('#ffffff', { emis: 0.1 }), (offs ? offs[4] : 0) * 0.25, 0.66, 0, g);
    top.castShadow = false;
    g.userData = { type: 'mujigae' };
    return g;
  };

  // 포장·리뷰용: 다 된 조각 하나(종류·색)
  K.piece = function (type, opt) {
    opt = opt || {};
    if (type === 'injeolmi') { const g = K.injeolmi(0.5); g.userData.setCoat(1); return g; }
    if (type === 'songpyeon') return K.songpyeonDone(opt.color || DATA.DDEOK.songpyeon.cols[1]);
    return K.mujigae(opt.offs);
  };
})();

// ---------- 2장부터 나오는 떡 ----------
(function () {
  const K = window.DDEOK;
  // 꿀떡: 작은 동그란 떡(분홍·쑥·흰), 속에 꿀
  K.kkuldduk = function (color) {
    const g = new THREE.Group();
    const m = TOY.mesh(new THREE.SphereGeometry(0.2, 24, 16), TOY.ddeok(color, { emis: 0.12, rough: 0.45 }), 0, 0.18, 0, g);
    m.scale.set(1, 0.9, 1);
    // 반짝 참기름 광
    m.material = TOY.mat(color, { rough: 0.3, gloss: 0.6, emis: 0.12, sheen: 0.4 });
    g.userData = { type: 'kkuldduk', color };
    return g;
  };
  // 절편: 납작한 네모에 떡살 꽃무늬
  const jTex = {};
  K.jeolTex = function (color) {
    if (jTex[color]) return jTex[color];
    return (jTex[color] = TOY.tex(TOY.canvas(128, 128, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 5;
      g.beginPath(); g.arc(64, 64, 38, 0, 7); g.stroke();
      for (let a = 0; a < 8; a++) { g.beginPath(); g.ellipse(64 + Math.cos(a * 0.785) * 20, 64 + Math.sin(a * 0.785) * 20, 10, 5, a * 0.785, 0, 7); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.arc(64, 64, 7, 0, 7); g.fill();
    })));
  };
  K.jeolpyeon = function (color, stamped) {
    const g = new THREE.Group();
    const base = TOY.ddeok(color, { emis: 0.1 });
    const m = TOY.mesh(TOY.rbox(0.52, 0.13, 0.5, 0.05, 2), base, 0, 0.065, 0, g);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.42), TOY.mat('#ffffff', { map: K.jeolTex(color), rough: 0.7, emis: 0.1, op: stamped ? 1 : 0 }));
    top.rotation.x = -Math.PI / 2; top.position.y = 0.132; g.add(top);
    g.userData = { type: 'jeolpyeon', color, top };
    return g;
  };
  // 가래떡: 하얀 기둥
  K.garaetteok = function (len) {
    const g = new THREE.Group();
    const m = TOY.mesh(TOY.rcyl(0.11, len || 0.55, 0.05, 20), TOY.ddeok('#fbf8f1', { emis: 0.12, rough: 0.5 }), 0, 0.11, 0, g);
    m.rotation.z = Math.PI / 2;
    g.userData = { type: 'garaetteok', mesh: m, len: len || 0.55 };
    return g;
  };
  // 백설기: 하얀 네모 시루떡(김 오른 결)
  let bTex = null;
  K.baekseolgi = function () {
    if (!bTex) bTex = TOY.dustTex('#fffdf6', ['#ffffff', '#f3eee2', '#f7f2e8'], 3000);
    const g = new THREE.Group();
    TOY.mesh(TOY.rbox(0.5, 0.42, 0.5, 0.06, 2), TOY.ddeok('#ffffff', { map: bTex, emis: 0.12, rough: 0.85 }), 0, 0.21, 0, g);
    g.userData = { type: 'baekseolgi' };
    return g;
  };
  // 딸기찹쌀떡: 하얀 찹쌀 속에 딸기 끝이 빼꼼
  let berryM = null, leafM = null;
  K.berry = function () {
    if (!berryM) {
      berryM = TOY.mat('#ff4f63', { rough: 0.35, gloss: 0.7, map: TOY.dustTex('#ff4f63', ['#ffe08a', '#ffd06a'], 220) });
      leafM = TOY.mat('#5cc06c', { rough: 0.5 });
    }
    const g = new THREE.Group();
    const b = TOY.mesh(new THREE.SphereGeometry(0.15, 20, 14), berryM, 0, 0.17, 0, g); b.scale.set(1, 1.3, 1);
    const l = TOY.mesh(new THREE.ConeGeometry(0.09, 0.05, 7), leafM, 0, 0.36, 0, g); l.rotation.x = Math.PI;
    return g;
  };
  K.ddalgi = function (wrapK) {
    const g = new THREE.Group();
    const be = K.berry(); be.position.y = 0.05; g.add(be);
    const dm = TOY.ddeok('#fffaf4', { emis: 0.14, rough: 0.55 });
    const d = TOY.mesh(new THREE.SphereGeometry(0.27, 26, 18, 0, Math.PI * 2, Math.PI * 0.2, Math.PI * 0.8), dm, 0, 0.27, 0, g);
    g.userData = { type: 'ddalgi', dough: d, berry: be, setWrap(k) { d.scale.set(1, Math.max(0.15, k), 1); d.position.y = 0.27 * Math.max(0.15, k) * 0.98; be.position.y = 0.05 + (1 - k) * -0.02; } };
    g.userData.setWrap(wrapK == null ? 1 : wrapK);
    return g;
  };

  const base = K.piece;
  K.piece = function (type, opt) {
    opt = opt || {};
    if (type === 'kkuldduk') return K.kkuldduk(opt.color || '#ffc6d8');
    if (type === 'jeolpyeon') return K.jeolpyeon(opt.color || DATA.DDEOK.jeolpyeon.cols[0], true);
    if (type === 'garaetteok') return K.garaetteok(0.55);
    if (type === 'baekseolgi') return K.baekseolgi();
    if (type === 'ddalgi') return K.ddalgi(1);
    return base(type, opt);
  };
})();
