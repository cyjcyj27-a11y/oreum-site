// 그림 도구: 둥근 상자, 재질, 캔버스 질감, 접지 그림자
(function () {
  const T = THREE;
  const K = (window.K = {});

  K.rng = function (seed) {
    let a = seed >>> 0 || 1;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  K.pick = (r, arr) => arr[Math.floor(r() * arr.length)];

  // 둥근 상자 (three 애드온 RoundedBoxGeometry 와 같은 셈)
  const geoCache = {};
  K.rbox = function (w, h, d, rad, seg) {
    seg = seg || 3;
    rad = Math.min(rad, w / 2, h / 2, d / 2);
    const key = [w, h, d, rad, seg].map((v) => +v.toFixed(3)).join(',');
    if (geoCache[key]) return geoCache[key];
    const s = seg * 2 + 1;
    const g = new T.BoxGeometry(1, 1, 1, s, s, s).toNonIndexed();
    const pos = g.attributes.position.array;
    const nor = g.attributes.normal.array;
    const box = new T.Vector3(w / 2 - rad, h / 2 - rad, d / 2 - rad);
    const p = new T.Vector3(), n = new T.Vector3();
    const half = 0.5 / s;
    for (let i = 0; i < pos.length; i += 3) {
      p.fromArray(pos, i);
      n.copy(p);
      n.x -= Math.sign(n.x) * half;
      n.y -= Math.sign(n.y) * half;
      n.z -= Math.sign(n.z) * half;
      n.normalize();
      pos[i] = box.x * Math.sign(p.x) + n.x * rad;
      pos[i + 1] = box.y * Math.sign(p.y) + n.y * rad;
      pos[i + 2] = box.z * Math.sign(p.z) + n.z * rad;
      nor[i] = n.x; nor[i + 1] = n.y; nor[i + 2] = n.z;
    }
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return (geoCache[key] = g);
  };

  function cached(key, make) {
    return geoCache[key] || (geoCache[key] = make());
  }
  K.sphere = (r, ws, hs) => cached('s' + r + ',' + (ws || 24), () => new T.SphereGeometry(r, ws || 24, hs || 16));
  K.cyl = (rt, rb, h, seg) => cached('c' + [rt, rb, h, seg || 24], () => new T.CylinderGeometry(rt, rb, h, seg || 24));
  K.cone = (r, h, seg) => cached('k' + [r, h, seg || 20], () => new T.ConeGeometry(r, h, seg || 20));
  K.torus = (r, t, a) => cached('t' + [r, t, a || 6.2832], () => new T.TorusGeometry(r, t, 12, 28, a || Math.PI * 2));
  K.box = (w, h, d) => cached('b' + [w, h, d], () => new T.BoxGeometry(w, h, d));
  K.ico = (r, d) => cached('i' + [r, d || 1], () => new T.IcosahedronGeometry(r, d || 1));
  K.capsule = (r, l) => cached('p' + [r, l], () => new T.CapsuleGeometry(r, l, 6, 16));
  K.lathe = (key, pts, seg) => cached('l' + key, () => new T.LatheGeometry(pts.map((q) => new T.Vector2(q[0], q[1])), seg || 32));

  // 재질: 매 물건마다 새로 만든다 (색 바꾸기 틀린그림이 옆 물건까지 번지지 않게)
  K.mat = function (color, o) {
    const m = new T.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.72, metalness: 0, envMapIntensity: 0.6 }, o || {}));
    return m;
  };
  K.glow = (color, intensity) =>
    new T.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity || 1, roughness: 1 });

  K.mesh = function (geo, mat, x, y, z, parent) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  };
  K.group = function (x, y, z, parent) {
    const g = new T.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(g);
    return g;
  };

  // 캔버스 질감
  K.tex = function (w, h, draw, repeat) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) {
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(repeat[0], repeat[1]);
    }
    return t;
  };

  // 색 섞기
  K.shade = function (hex, k) {
    const c = new T.Color(hex);
    if (k > 0) c.lerp(new T.Color(0xffffff), k);
    else c.multiplyScalar(1 + k);
    return '#' + c.getHexString();
  };

  // 나뭇결 바닥
  K.woodFloor = function (base, r) {
    return K.tex(512, 512, (g, w, h) => {
      const rows = 8;
      const ph = h / rows;
      for (let i = 0; i < rows; i++) {
        const off = (i % 2) * 128 + Math.floor(r() * 60);
        for (let x = -256; x < w + 256; x += 256) {
          const v = (r() - 0.5) * 0.16;
          g.fillStyle = K.shade(base, v);
          g.fillRect(x + off, i * ph, 256, ph);
          // 결
          g.strokeStyle = 'rgba(80,40,10,0.10)';
          g.lineWidth = 1.2;
          for (let k = 0; k < 5; k++) {
            const yy = i * ph + 6 + r() * (ph - 12);
            g.beginPath();
            g.moveTo(x + off, yy);
            g.bezierCurveTo(x + off + 80, yy + (r() - 0.5) * 8, x + off + 170, yy + (r() - 0.5) * 8, x + off + 256, yy);
            g.stroke();
          }
          g.fillStyle = 'rgba(60,30,10,0.35)';
          g.fillRect(x + off, i * ph, 2, ph);
        }
        g.fillStyle = 'rgba(60,30,10,0.35)';
        g.fillRect(0, i * ph, w, 2);
      }
    }, [2, 2]);
  };

  // 벽지: 옅은 무늬
  K.wallpaper = function (base, dot, kind) {
    return K.tex(256, 256, (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      g.fillStyle = dot;
      if (kind === 'stripe') {
        for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
      } else if (kind === 'star') {
        for (let y = 0; y < 4; y++)
          for (let x = 0; x < 4; x++) {
            const cx = x * 64 + (y % 2) * 32 + 16, cy = y * 64 + 16;
            star(g, cx, cy, 7, 3);
          }
      } else {
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++) {
            g.beginPath();
            g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 8, 3.2, 0, 7);
            g.fill();
          }
      }
    }, [5, 3]);
  };
  function star(g, cx, cy, R, r) {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r : R;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  }
  K.star = star;

  // 접지 그림자 (흐린 원판)
  let blobTex = null;
  K.blob = function (parent, x, z, sx, sz, op, y, follow) {
    if (!blobTex)
      blobTex = K.tex(128, 128, (g) => {
        const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
        gr.addColorStop(0, 'rgba(0,0,0,1)');
        gr.addColorStop(0.5, 'rgba(0,0,0,0.55)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
      });
    blobTex.userData.keep = true;
    const m = new T.Mesh(
      cached('blobplane', () => new T.PlaneGeometry(1, 1)),
      new T.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: op == null ? 0.35 : op, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.scale.set(sx, sz, 1);
    m.position.set(x, y == null ? 0.012 : y, z);
    m.renderOrder = 1;
    parent.add(m);
    // 물건을 숨기거나 옮기면 그림자도 같이
    if (follow) {
      parent.updateMatrixWorld(true);
      follow.updateMatrixWorld(true);
      follow.attach(m);
    }
    return m;
  };
})();
