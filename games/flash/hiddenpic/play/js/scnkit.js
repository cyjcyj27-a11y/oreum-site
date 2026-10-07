// 장면 짓기 도구: 선반장·탁자·바닥 무늬 — 놓을 자리(spot)를 함께 등록한다
(function () {
  const T = THREE;
  const { rbox, mesh, group, mat, tex, blob, shade, pick } = K;
  const Q = (window.Q = {});

  // 회전(0 또는 ±π/2) 한 지역 좌표 → 세계 좌표
  function toW(x, z, rot, lx, lz) {
    const c = Math.cos(rot), s = Math.sin(rot);
    return [x + lx * c + lz * s, z - lx * s + lz * c];
  }
  Q.toW = toW;

  // 선반장: 뒷판이 -z 쪽(rot=0 이면 뒷벽에 붙음, rot=π/2 이면 왼벽에 붙음)
  Q.shelf = function (ctx, x, z, o) {
    o = Object.assign({ w: 2.4, d: 0.8, h: 4, levels: 4, rot: 0, color: '#7a4a2c', max: 0.78, books: 0.4, top: true, back: true }, o);
    const g = group(x, 0, z, ctx.root);
    g.rotation.y = o.rot;
    const wd = mat(o.color, { roughness: 0.6 }), wdL = mat(shade(o.color, 0.12), { roughness: 0.6 });
    if (o.back) mesh(rbox(o.w, o.h, 0.1, 0.03), wd, 0, o.h / 2, -o.d / 2 + 0.05, g);
    [-1, 1].forEach((sd) => mesh(rbox(0.1, o.h, o.d, 0.03), wd, sd * (o.w / 2 - 0.05), o.h / 2, 0, g));
    const gap = (o.h - 0.1) / o.levels;
    const swap = Math.abs(Math.sin(o.rot)) > 0.5;
    for (let i = 0; i <= o.levels; i++) {
      const y = 0.06 + i * gap;
      mesh(rbox(o.w, 0.08, o.d, 0.02), wdL, 0, y, 0, g);
      if (i === o.levels && !o.top) break;
      const lim = i === o.levels ? o.max : Math.min(o.max, gap - 0.15);
      let x0 = -o.w / 2 + 0.1, x1 = o.w / 2 - 0.1;
      if (i < o.levels && o.books && ctx.r() < 0.75) {   // 한쪽에 책을 꽂는다
        const bw = (o.w - 0.2) * o.books;
        const left = ctx.r() < 0.5;
        P.books(g, left ? x0 + bw / 2 : x1 - bw / 2, y + 0.04, -0.04, bw, ctx.r, { h: Math.min(0.9, gap - 0.2), d: o.d * 0.72, colors: o.bookCols });
        if (left) x0 += bw + 0.05; else x1 -= bw + 0.05;
      }
      const [wx, wz] = toW(x, z, o.rot, (x0 + x1) / 2, 0);
      const sw = x1 - x0, sdp = o.d - 0.12;
      ctx.spot(wx, y + 0.04, wz, swap ? sdp : sw, swap ? sw : sdp, { max: lim, tag: 'shelf' });
    }
    blob(ctx.root, x, z, swap ? o.d * 1.4 : o.w * 1.2, swap ? o.w * 1.2 : o.d * 1.4, 0.35);
    return g;
  };

  // 탁자: 윗면 자리 + (낮지 않으면) 아래 바닥 자리
  Q.table = function (ctx, x, z, o) {
    o = Object.assign({ w: 2, d: 1.2, h: 1.3, color: '#9a6a45', round: false, rot: 0, max: 0.85, under: true, cloth: null }, o);
    const g = group(x, 0, z, ctx.root);
    g.rotation.y = o.rot;
    const wd = mat(o.color, { roughness: 0.55 });
    if (o.round) {
      mesh(K.cyl(o.w / 2, o.w / 2, 0.1, 32), wd, 0, o.h, 0, g);
      mesh(K.cyl(0.08, 0.1, o.h, 10), wd, 0, o.h / 2, 0, g);
      mesh(K.cyl(o.w * 0.3, o.w * 0.34, 0.06, 20), wd, 0, 0.03, 0, g);
    } else {
      mesh(rbox(o.w, 0.1, o.d, 0.03), wd, 0, o.h, 0, g);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(rbox(0.1, o.h, 0.1, 0.02), wd, a * (o.w / 2 - 0.1), o.h / 2, b * (o.d / 2 - 0.1), g));
    }
    if (o.cloth) {
      const ct = o.round ? K.cyl(o.w / 2 + 0.06, o.w / 2 + 0.12, 0.3, 32) : rbox(o.w + 0.1, 0.3, o.d + 0.1, 0.04);
      mesh(ct, mat(o.cloth, { roughness: 0.95 }), 0, o.h - 0.1, 0, g);
    }
    const swap = Math.abs(Math.sin(o.rot)) > 0.5;
    const tw = o.round ? o.w * 0.72 : o.w - 0.2, td = o.round ? o.w * 0.72 : o.d - 0.2;
    ctx.spot(x, o.h + 0.06 + (o.cloth ? 0.06 : 0), z, swap ? td : tw, swap ? tw : td, { max: o.max, tag: 'table' });
    if (o.under && o.h > 0.9) ctx.spot(x, 0.01, z, (swap ? td : tw) * 0.8, (swap ? tw : td) * 0.8, { max: Math.min(0.75, o.h - 0.2), tag: 'under' });
    blob(ctx.root, x, z, (swap ? o.d : o.w) * 1.3, (swap ? o.w : o.d) * 1.3, 0.35);
    return g;
  };

  // 바닥 타일
  Q.tiles = function (c1, c2, n, grout) {
    return tex(512, 512, (c, W, H) => {
      const s = W / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        c.fillStyle = (x + y) % 2 ? c1 : c2;
        c.fillRect(x * s, y * s, s, s);
        c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x * s + 3, y * s + 3, s * 0.5, 3);
      }
      c.strokeStyle = grout || 'rgba(60,40,30,0.3)'; c.lineWidth = 3;
      for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, H); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(W, i * s); c.stroke(); }
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    }, [2.5, 2.5]);
  };
  // 칠한 벽 + 얼룩
  Q.paint = function (base, r, o) {
    o = o || {};
    return tex(512, 512, (c, W, H) => {
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        const gr = c.createRadialGradient(r() * W, r() * H, 2, r() * W, r() * H, 40 + r() * 80);
        gr.addColorStop(0, `rgba(${o.dark ? '0,0,0' : '255,255,255'},0.05)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr; c.fillRect(0, 0, W, H);
      }
      if (o.stripe) { c.fillStyle = o.stripe; for (let x = 0; x < W; x += 64) c.fillRect(x, 0, 20, H); }
      if (o.brick) {
        c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 3;
        for (let y = 0; y < H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); for (let x = ((y / 32) % 2) * 32; x < W; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } }
      }
    }, [2, 1.2]);
  };
  // 걸린 깃발 줄(장식)
  Q.bunting = function (parent, x0, y, z0, x1, z1, cols, n) {
    const g = group(0, 0, 0, parent);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const sag = Math.sin(t * Math.PI) * 0.35;
      const f = mesh(K.cone(0.16, 0.36, 3), mat(cols[i % cols.length], { roughness: 0.8 }), x0 + (x1 - x0) * t, y - sag - 0.18, z0 + (z1 - z0) * t, g);
      f.rotation.x = Math.PI; f.scale.z = 0.15; f.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
      f.castShadow = false;
    }
    return g;
  };
})();
