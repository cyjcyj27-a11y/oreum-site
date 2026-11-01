// 고르기 칸·설명 창의 햄스터 사진: Meshy 3D 햄스터를 작은 화면에서 한 번 찍어 품종마다 담아 둔다.
(function () {
  const P = (window.PORT = {}), T = THREE, SZ = 320;
  const done = {}, wait = {}, busy = {};
  let r = null, scene = null, cam = null;
  function setup() {
    r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1); r.setSize(SZ, SZ, false); r.setClearColor(0x000000, 0);
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.08; r.outputColorSpace = T.SRGBColorSpace;
    scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0xcfb89a, 1.35));
    const sun = new T.DirectionalLight(0xfff0d8, 1.7); sun.position.set(-1.2, 2.4, -2.4); scene.add(sun);
    cam = new T.PerspectiveCamera(26, 1, 0.1, 20); cam.position.set(0, 0.8, -2.6); cam.lookAt(0, 0.41, 0); // 앞(-z)에서 살짝 내려다봄
  }
  // 그린 칸만 남기게 잘라 낸다(발밑 기준으로 놓기 쉽게)
  function crop(src) {
    const g = src.getContext('2d'), d = g.getImageData(0, 0, SZ, SZ).data;
    let x0 = SZ, y0 = SZ, x1 = 0, y1 = 0;
    for (let y = 0; y < SZ; y++) for (let x = 0; x < SZ; x++) if (d[(y * SZ + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const c = document.createElement('canvas'); c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
    c.getContext('2d').drawImage(src, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
    return c;
  }
  // k: 'ham'(보통) 또는 'full'(볼 꽉 참). cb(사진 캔버스)
  P.get = function (k, b, cb) {
    const key = k + ':' + b.id;
    if (done[key]) { if (cb) cb(done[key]); return done[key]; }
    if (cb) (wait[key] = wait[key] || []).push(cb);
    if (busy[key] || !window.HMODEL || !MDL.hamsterShot) return null;
    busy[key] = true;
    if (!r) setup();
    MDL.hamsterShot(k, b, (o) => {
      o.rotation.y = 0.32; if (b.small) o.scale.setScalar(0.94);
      scene.add(o); r.render(scene, cam); scene.remove(o);
      o.material.map.dispose(); o.material.dispose();
      const tmp = document.createElement('canvas'); tmp.width = tmp.height = SZ; tmp.getContext('2d').drawImage(r.domElement, 0, 0);
      done[key] = crop(tmp);
      (wait[key] || []).forEach((f) => f(done[key])); delete wait[key];
    });
    return null;
  };
  // 2D 그림과 같은 자리·크기로 그린다(x,y = 몸 가운데, 발끝은 y+37s). 사진이 아직이면 false
  P.draw = function (g, x, y, s, b, cheek, sq) {
    cheek = cheek || 0; sq = sq || 0;
    const im = P.get(cheek >= 0.75 ? 'full' : 'ham', b); if (!im) return false;
    const h = 76 * s * (1 - sq), w = h * im.width / im.height * (1 + sq * 0.5) * (cheek < 0.75 ? 1 + cheek * 0.12 : 1);
    g.save(); g.fillStyle = 'rgba(74,42,20,.18)'; g.beginPath(); g.ellipse(x, y + 35 * s, 30 * s, 6 * s, 0, 0, 7); g.fill(); g.restore();
    g.drawImage(im, x - w / 2, y + 38 * s - h, w, h);
    return true;
  };
})();
