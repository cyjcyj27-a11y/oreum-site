// 야외 장면이 같이 쓰는 것: 섬 받침, 나무, 바위, 꽃
(function () {
  const T = THREE;
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const pm = P.pm;

  // 흙 층이 보이는 네모 섬
  P.island = function (ctx, o) {
    const g = group(0, 0, 0, ctx.root);
    const S = o.size || 10.4;
    const sideT = tex(256, 128, (c, W, H) => {
      const layers = o.layers || ['#7a5a3a', '#6a4a2e', '#5b3e27', '#4a3220'];
      layers.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, (i * H) / layers.length, W, H / layers.length + 1); });
      for (let i = 0; i < 90; i++) {
        c.fillStyle = i % 3 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)';
        c.beginPath(); c.ellipse((i * 53) % W, 16 + ((i * 29) % (H - 16)), 3 + (i % 4), 2 + (i % 3), 0, 0, 7); c.fill();
      }
      // 위 테두리 (잔디/모래 끝)
      c.fillStyle = o.lip || '#5aa04a';
      c.fillRect(0, 0, W, 12);
      for (let x = 0; x < W; x += 8) { c.beginPath(); c.moveTo(x, 12); c.lineTo(x + 4, 18 + ((x * 7) % 6)); c.lineTo(x + 8, 12); c.fill(); }
    }, [4, 1]);
    const sideM = new T.MeshStandardMaterial({ map: sideT, roughness: 1 });
    const topM = new T.MeshStandardMaterial({ map: o.topTex, roughness: 0.95 });
    const base = mesh(rbox(S, 1.6, S, 0.2, 2), [sideM], 0, -0.8, 0, g);
    base.geometry = base.geometry;
    base.material = sideM;
    const top = mesh(new T.PlaneGeometry(S - 0.1, S - 0.1), topM, 0, 0.005, 0, g);
    top.rotation.x = -Math.PI / 2;
    top.castShadow = false;
    // 밑이 뾰족하게 떠 있는 느낌
    const under = mesh(K.cone(S * 0.62, 2.6, 4), mat(o.under || '#4a3220', { roughness: 1 }), 0, -2.9, 0, g);
    under.rotation.y = Math.PI / 4;
    under.scale.y = -1;
    return g;
  };

  P.grassTex = function (base, r) {
    return tex(512, 512, (c, W, H) => {
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) {
        c.fillStyle = shade(base, (r() - 0.5) * 0.12);
        c.beginPath(); c.ellipse(r() * W, r() * H, 20 + r() * 40, 14 + r() * 26, r() * 3, 0, 7); c.fill();
      }
      c.strokeStyle = shade(base, -0.18); c.lineWidth = 2;
      for (let i = 0; i < 260; i++) {
        const x = r() * W, y = r() * H;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 7); c.moveTo(x + 3, y); c.lineTo(x + 4, y - 8); c.stroke();
      }
    }, [2, 2]);
  };

  // 뾰족 나무
  P.pine = function (parent, x, z, s, color, r) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    mesh(K.cyl(0.12, 0.16, 0.8, 8), mat('#6b4a32', { roughness: 0.9 }), 0, 0.4, 0, g);
    const m = pm(color || '#2d6a4f', { roughness: 0.8 });
    const m2 = mat(shade(color || '#2d6a4f', 0.12), { roughness: 0.8 });
    [[0.95, 1.1, 0.7], [0.75, 1.0, 1.35], [0.52, 0.9, 1.95]].forEach(([rad, h, y], i) => {
      const c = mesh(K.cone(rad, h, 9), i % 2 ? m2 : m, 0, y, 0, g);
      c.rotation.y = i * 0.4;
    });
    if (m2) m2.userData.paint = true;
    blob(parent, x, z, 1.8 * s, 1.8 * s, 0.35, null, g);
    return g;
  };

  // 동글 나무
  P.roundTree = function (parent, x, z, s, color, r) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    mesh(K.cyl(0.13, 0.18, 1.3, 8), mat('#7a5236', { roughness: 0.9 }), 0, 0.65, 0, g);
    const m = pm(color || '#52b788', { roughness: 0.85 });
    [[0, 1.75, 0, 0.7], [0.4, 1.5, 0.2, 0.5], [-0.35, 1.55, -0.1, 0.52], [0.05, 1.45, -0.4, 0.45], [0, 2.2, 0.05, 0.45]].forEach(([a, b, c2, rr]) => {
      mesh(K.ico(rr, 1), m, a, b, c2, g);
    });
    blob(parent, x, z, 2 * s, 2 * s, 0.35, null, g);
    return g;
  };

  P.rock = function (parent, x, z, s, color) {
    const g = group(x, 0, z, parent);
    const m = pm(color || '#9aa0a6', { roughness: 0.9, flatShading: true });
    const a = mesh(K.ico(0.5, 0), m, 0, 0.25 * s, 0, g);
    a.scale.set(s * 1.2, s * 0.7, s);
    a.rotation.y = x * 3;
    const b = mesh(K.ico(0.3, 0), m, 0.45 * s, 0.14 * s, 0.2 * s, g);
    b.scale.setScalar(s);
    blob(parent, x, z, 1.6 * s, 1.3 * s, 0.35, null, g);
    return g;
  };

  P.bush = function (parent, x, z, s, color, flower) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    const m = pm(color || '#40916c', { roughness: 0.9 });
    [[0, 0.35, 0, 0.45], [0.4, 0.28, 0.1, 0.35], [-0.38, 0.28, 0.05, 0.36], [0.05, 0.3, 0.35, 0.33]].forEach(([a, b, c, rr]) => mesh(K.ico(rr, 1), m, a, b, c, g));
    if (flower) {
      const fm = mat(flower, { roughness: 0.6 });
      [[0.1, 0.72, 0.2], [-0.3, 0.55, 0.3], [0.45, 0.55, 0.3], [0.2, 0.5, 0.55]].forEach(([a, b, c]) => mesh(K.sphere(0.08, 8, 6), fm, a, b, c, g));
      g.userData.flowers = fm;
    }
    blob(parent, x, z, 1.6 * s, 1.4 * s, 0.35, null, g);
    return g;
  };

  P.flower = function (parent, x, z, color, s) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s || 1);
    mesh(K.cyl(0.015, 0.015, 0.4, 5), mat('#40916c'), 0, 0.2, 0, g);
    const leaf = mesh(K.sphere(0.06, 8, 6), mat('#52b788'), 0.05, 0.12, 0, g);
    leaf.scale.set(1.4, 0.3, 0.7);
    const m = pm(color, { roughness: 0.6 });
    for (let k = 0; k < 5; k++) mesh(K.sphere(0.055, 8, 6), m, Math.cos(k * 1.256) * 0.06, 0.42, Math.sin(k * 1.256) * 0.06, g).scale.y = 0.5;
    mesh(K.sphere(0.035, 8, 6), mat('#ffd166'), 0, 0.44, 0, g);
    return g;
  };

  P.mushroom = function (parent, x, z, color, s) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s || 1);
    mesh(K.cyl(0.06, 0.08, 0.25, 8), mat('#fff3e0'), 0, 0.12, 0, g);
    const capM = pm(color || '#e63946', { roughness: 0.5 });
    const cap = mesh(K.sphere(0.17, 14, 8), capM, 0, 0.26, 0, g);
    cap.scale.y = 0.6;
    [[0.08, 0.34, 0.05], [-0.07, 0.32, 0.08], [0, 0.35, -0.08]].forEach(([a, b, c]) => mesh(K.sphere(0.025, 6, 4), mat('#ffffff'), a, b, c, g));
    return g;
  };
})();
