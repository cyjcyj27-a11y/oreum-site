// 무대: 렌더러·빛·카메라, 장면 짓기, 틀린 곳 고르기, 두 장 그리기
(function () {
  const T = THREE;
  const S = (window.S = {});
  const SCN = (window.SCN = window.SCN || {});

  let renderer, scene, cam, root, sun, hemi, envRT;
  let cands = [];
  let bgTop = '#f6e7d8', bgBot = '#e9c9b4';

  function init() {
    if (renderer) return;
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    scene = new T.Scene();
    cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    hemi = new T.HemisphereLight(0xfff4e6, 0x8a6a58, 0.5);
    scene.add(hemi);
    sun = new T.DirectionalLight(0xfff0dc, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 4;
    const sc = sun.shadow.camera;
    sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 60;
    scene.add(sun, sun.target);
    // 부드러운 환경광 (하늘 구를 구워서)
    const es = new T.Scene();
    const eg = new T.SphereGeometry(10, 32, 16);
    const col = [];
    const p = eg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 10;
      const c = new T.Color(0xfff3e4).lerp(new T.Color(0x6b5a55), Math.max(0, -y) * 0.9);
      if (y > 0.2) c.lerp(new T.Color(0xffffff), (y - 0.2) * 0.6);
      col.push(c.r, c.g, c.b);
    }
    eg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    es.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const panel = new T.Mesh(new T.PlaneGeometry(6, 4), new T.MeshBasicMaterial({ color: 0xffffff }));
    panel.position.set(6, 6, 4);
    panel.lookAt(0, 0, 0);
    es.add(panel);
    const pm = new T.PMREMGenerator(renderer);
    envRT = pm.fromScene(es, 0.02);
    scene.environment = envRT.texture;
    root = new T.Group();
    scene.add(root);
  }

  function disposeTree(o) {
    o.traverse((m) => {
      if (m.material) {
        const ms = Array.isArray(m.material) ? m.material : [m.material];
        ms.forEach((x) => {
          if (x.map && !x.map.userData.keep) x.map.dispose();
          x.dispose();
        });
      }
    });
  }

  // 장면 짓기
  S.build = function (name, seed, opt) {
    init();
    disposeTree(root);
    scene.remove(root);
    root = new T.Group();
    scene.add(root);
    // 지난 장면이 남긴 불빛 지우기
    scene.children.filter((c) => c.userData.sceneLight).forEach((c) => scene.remove(c));
    cands = [];
    const r = K.rng(seed);
    const ctx = {
      root: root,
      r: r,
      opt: opt || {},
      scene: scene,
      sun: sun,
      hemi: hemi,
      light(l) { l.userData.sceneLight = true; scene.add(l); return l; },
      bg(top, bot) { bgTop = top; bgBot = bot; },
      exposure(v) { renderer.toneMappingExposure = v; },
      env: 1,
      D(obj, o) { o = o || {}; o.obj = obj; obj.userData.cand = true; o.id = cands.length; cands.push(o); if (o.kinds && o.kinds[0] === 'show') obj.visible = false; return obj; },
    };
    sun.target.position.set(0, 0, 0);
    sun.intensity = 3.4;
    sun.color.set(0xfff0dc);
    hemi.intensity = 0.5;
    renderer.toneMappingExposure = 0.95;
    sun.position.set(10, 13, 5);
    const info = SCN[name](ctx);
    root.traverse((m) => {
      if (!m.isMesh) return;
      (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => {
        if (x.envMapIntensity == null) return;
        if (x.userData.env == null) x.userData.env = x.envMapIntensity === 1 ? 0.6 : x.envMapIntensity;
        x.envMapIntensity = x.userData.env * ctx.env;
      });
    });
    // 카메라: 방 단면을 비스듬히
    const view = (info && info.view) || {};
    const dir = new T.Vector3(view.dx || 1, view.dy || 0.95, view.dz || 1.05).normalize();
    const look = new T.Vector3(0, view.ly == null ? 1.6 : view.ly, 0);
    cam.position.copy(look).addScaledVector(dir, 50);
    cam.up.set(0, 1, 0);
    cam.lookAt(look);
    cam.updateMatrixWorld();
    S.fit = view.fit || 7.4;
    S.info = info;
    return info;
  };

  function setSize(w, h) {
    renderer.setSize(w, h, false);
    const a = w / h;
    const f = S.fit;
    cam.left = -f * a; cam.right = f * a; cam.top = f; cam.bottom = -f;
    cam.updateProjectionMatrix();
  }

  // 한 장 그려서 2D 캔버스에 옮긴다
  function draw(canvas) {
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    if (renderer.domElement.width !== w || renderer.domElement.height !== h) setSize(w, h);
    renderer.render(scene, cam);
    if (S.twice) renderer.render(scene, cam);   // 폰에서 한 박자 늦게 옮겨지는 경우 대비(2026-09-17)
    { const gl = renderer.getContext(); if (gl.finish) gl.finish(); }   // 다 그린 뒤에 옮긴다
    const g = canvas.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, bgTop);
    gr.addColorStop(1, bgBot);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.drawImage(renderer.domElement, 0, 0);
    const v = g.createRadialGradient(w / 2, h * 0.48, h * 0.35, w / 2, h / 2, h * 0.95);
    v.addColorStop(0, 'rgba(40,20,20,0)');
    v.addColorStop(1, 'rgba(40,20,20,0.28)');
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
  }
  S.draw = draw;

  // 다른 후보가 품고 있는 가지는 건너뛰고 돈다
  function own(o, fn) {
    fn(o);
    o.children.forEach((ch) => { if (!ch.userData.cand) own(ch, fn); });
  }

  // 틀린 곳 적용
  function paintMats(c) {
    if (c.paint) return [...new Set(c.paint.map((m) => m.material))];
    const set = new Set();
    own(c.obj, (m) => { if (m.isMesh && m.material && m.material.userData.paint) set.add(m.material); });
    if (set.size) return [...set];
    let best = null, bv = -1;
    own(c.obj, (m) => {
      if (!m.isMesh || !m.material || !m.material.color || m.material.userData.nopaint) return;
      m.geometry.computeBoundingBox();
      const s = m.geometry.boundingBox.getSize(new T.Vector3());
      const v = s.x * m.scale.x * s.y * m.scale.y + s.y * s.z + s.x * s.z;
      if (v > bv) { bv = v; best = m; }
    });
    return best ? [best.material] : [];
  }

  const VIVID = [0xe8453c, 0x2f7de1, 0x33b25a, 0xf5b82e, 0x9b59d0, 0xff7eb6, 0x1bb5b5];
  function apply(c, d) {
    const o = c.obj;
    switch (d.kind) {
      case 'hide': o.visible = false; break;
      case 'show': o.visible = true; break;
      case 'color': {
        d.saved = paintMats(c).map((m, mi) => {
          const old = m.color.clone();
          if (c.colors) {
            // 정해 둔 색 중 지금과 다른 것
            const list = c.colors.filter((h) => new T.Color(h).getHex() !== new T.Color().copy(old).getHex());
            const pickC = new T.Color(list[d.p % list.length]);
            if (mi) pickC.lerp(new T.Color(0xffffff), 0.12 * mi);
            m.color.copy(pickC);
            return { m: m, old: old };
          }
          const hsl = {};
          old.getHSL(hsl);
          if (hsl.s < 0.18 || hsl.l > 0.9 || hsl.l < 0.1) m.color.setHex(VIVID[d.p % VIVID.length]);
          else m.color.setHSL((hsl.h + d.h) % 1, Math.max(hsl.s, 0.5), Math.min(Math.max(hsl.l, 0.3), 0.7));
          const tex = m.map;
          return { m: m, old: old, map: tex };
        });
        break;
      }
      case 'mirror': o.scale.x *= -1; break;
      case 'turn': o.rotation.y += d.p; break;
      case 'grow': o.scale.multiplyScalar(d.p); break;
      case 'move': o.position.x += d.p[0]; o.position.z += d.p[1]; o.position.y += d.p[2] || 0; break;
      case 'alt': c.alt(true, d); break;
    }
  }
  function revert(c, d) {
    const o = c.obj;
    switch (d.kind) {
      case 'hide': o.visible = true; break;
      case 'show': o.visible = false; break;
      case 'color': d.saved.slice().reverse().forEach((s) => s.m.color.copy(s.old)); break;
      case 'mirror': o.scale.x *= -1; break;
      case 'turn': o.rotation.y -= d.p; break;
      case 'grow': o.scale.multiplyScalar(1 / d.p); break;
      case 'move': o.position.x -= d.p[0]; o.position.z -= d.p[1]; o.position.y -= d.p[2] || 0; break;
      case 'alt': c.alt(false, d); break;
    }
  }

  function makeDiff(c, lv, r, noColor) {
    let kinds = c.kinds || ['hide', 'color'];
    if (noColor) kinds = kinds.filter((k) => k !== 'color');
    if (!kinds.length) return null;
    if (lv < 2) {
      const easy = kinds.filter((k) => k !== 'turn' && k !== 'grow' && k !== 'move');
      if (easy.length) kinds = easy;
    }
    const kind = K.pick(r, kinds);
    const d = { kind: kind, c: c, p: Math.floor(r() * 7) };
    if (kind === 'color') d.h = lv < 3 ? 0.33 + r() * 0.34 : 0.18 + r() * 0.64;
    if (kind === 'turn') d.p = c.turn || Math.PI / 2;
    if (kind === 'grow') d.p = c.grow || (r() < 0.5 ? 1.4 : 0.65);
    if (kind === 'move') d.p = c.move;
    return d;
  }

  // 두 그림 픽셀을 비교해 바뀐 자리 상자
  function changed(a, b, w, h) {
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dd = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        if (dd > 36) {
          n++;
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    return { n: n, x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h };
  }

  // lv: 0 쉬움 → 5 어려움
  S.pick = function (count, lv, seed) {
    const r = K.rng(seed ^ 0x9e3779b9);
    const W = 320, H = 240;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d', { willReadFrequently: true });
    draw(cv);
    const base = g.getImageData(0, 0, W, H).data;
    const minN = [150, 110, 80, 60, 45, 35][Math.min(lv, 5)];
    const maxSide = 0.42;
    const order = cands.map((c, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const chosen = [];
    const groups = {};
    for (const idx of order) {
      if (chosen.length >= count) break;
      const c = cands[idx];
      if (c.minLv && lv < c.minLv) continue;
      if (c.group && groups[c.group]) continue;
      const colors = chosen.filter((o) => o.kind === 'color').length;
      const d = makeDiff(c, lv, r, colors >= Math.ceil(count * 0.4));
      if (!d) continue;
      apply(c, d);
      draw(cv);
      const img = g.getImageData(0, 0, W, H).data;
      revert(c, d);
      const b = changed(base, img, W, H);
      if (b.n < minN) continue;
      if (b.x1 - b.x0 > maxSide || b.y1 - b.y0 > maxSide * 1.2) continue;
      const pad = 0.02;
      const hit = chosen.some((o) => !(b.x1 + pad < o.box.x0 || o.box.x1 + pad < b.x0 || b.y1 + pad < o.box.y0 || o.box.y1 + pad < b.y0));
      if (hit) continue;
      d.box = b;
      chosen.push(d);
      if (c.group) groups[c.group] = 1;
    }
    return chosen;
  };

  // 최종 두 장
  S.paint = function (canvasA, canvasB, diffs) {
    draw(canvasA);
    diffs.forEach((d) => apply(d.c, d));
    draw(canvasB);
    diffs.slice().reverse().forEach((d) => revert(d.c, d));
  };

  // 이 기기에서 두 장이 틀린 곳마다 정말 다른지 — 바뀐 픽셀 수(그림 크기와 상관없이 320x240 기준으로 환산)
  S.visible = function (canvasA, canvasB, diffs) {
    const w = canvasA.width, h = canvasA.height;
    if (!w || !h) return diffs.map(() => 999);
    const A = canvasA.getContext('2d').getImageData(0, 0, w, h).data, B = canvasB.getContext('2d').getImageData(0, 0, w, h).data;
    const sc = (320 * 240) / (w * h);
    return diffs.map((d) => {
      const b = d.box; let n = 0;
      for (let y = Math.floor(b.y0 * h); y < Math.ceil(b.y1 * h); y++)
        for (let x = Math.floor(b.x0 * w); x < Math.ceil(b.x1 * w); x++) {
          const i = (y * w + x) * 4;
          if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 36) n++;
        }
      return Math.round(n * sc);
    });
  };

  S.candCount = () => cands.length;
  S.cands = () => cands;
  S.apply = apply;
  S.revert = revert;
})();
