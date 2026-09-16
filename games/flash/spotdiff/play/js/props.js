// 여러 장면이 같이 쓰는 소품
(function () {
  const T = THREE;
  const P = (window.P = {});
  const { rbox, mesh, group, mat, tex, blob, shade } = K;

  // 칠 바꾸기 대상 재질
  const pm = (P.pm = function (c, o) {
    const m = mat(c, o);
    m.userData.paint = true;
    return m;
  });

  // 방 단면: 바닥판 + 뒷벽 + 왼벽
  P.room = function (ctx, o) {
    const g = group(0, 0, 0, ctx.root);
    const S = o.size || 10, H = o.height || 6;
    const floorM = new T.MeshStandardMaterial({ map: o.floorTex, roughness: 0.55, metalness: 0 });
    const side = mat(o.slab || '#8a5a3c', { roughness: 0.8 });
    mesh(rbox(S + 0.6, 0.6, S + 0.6, 0.12), side, 0, -0.3, 0, g);
    const top = mesh(new T.PlaneGeometry(S, S), floorM, 0, 0.002, 0, g);
    top.rotation.x = -Math.PI / 2;
    top.castShadow = false;
    // 바닥 테두리
    const trim = mat(shade(o.slab || '#8a5a3c', 0.15));
    mesh(rbox(S + 0.6, 0.12, 0.3, 0.05), trim, 0, 0.0, S / 2 + 0.15, g);
    mesh(rbox(0.3, 0.12, S + 0.6, 0.05), trim, S / 2 + 0.15, 0.0, 0, g);
    const wallM = new T.MeshStandardMaterial({ map: o.wallTex, roughness: 0.9 });
    const wallM2 = new T.MeshStandardMaterial({ map: o.wallTex2 || o.wallTex, roughness: 0.9 });
    const edge = mat(o.wallEdge || '#f3ece4', { roughness: 0.8 });
    const bw = mesh(K.box(S + 0.3, H, 0.3), [edge, edge, edge, edge, wallM, edge], -0.15, H / 2, -S / 2 - 0.15, g);
    const lw = mesh(K.box(0.3, H, S), [wallM2, edge, edge, edge, edge, edge], -S / 2 - 0.15, H / 2, 0, g);
    bw.castShadow = lw.castShadow = true;
    // 아랫벽 판넬
    if (o.wainscot) {
      const wh = o.wainscotH || 1.9;
      const panelT = tex(256, 128, (c, W, Hh) => {
        c.fillStyle = o.wainscot; c.fillRect(0, 0, W, Hh);
        for (let x = 0; x < W; x += 64) {
          c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(x + 8, 14, 48, 3); c.fillRect(x + 8, 14, 3, Hh - 28);
          c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x + 8, Hh - 17, 48, 3); c.fillRect(x + 53, 14, 3, Hh - 28);
        }
      }, [S / 2.2, 1]);
      const pmB = new T.MeshStandardMaterial({ map: panelT, roughness: 0.6 });
      const pmL = new T.MeshStandardMaterial({ map: panelT, roughness: 0.6 });
      mesh(K.box(S, wh, 0.05), pmB, 0, wh / 2, -S / 2 + 0.025, g).castShadow = false;
      const lp = mesh(K.box(S, wh, 0.05), pmL, -S / 2 + 0.025, wh / 2, 0, g);
      lp.rotation.y = Math.PI / 2;
      lp.castShadow = false;
      const rail = mat(o.baseboard || '#fbf7f2', { roughness: 0.5 });
      mesh(rbox(S, 0.1, 0.12, 0.03), rail, 0, wh, -S / 2 + 0.06, g);
      mesh(rbox(0.12, 0.1, S, 0.03), rail, -S / 2 + 0.06, wh, 0, g);
    }
    // 걸레받이
    const base = mat(o.baseboard || '#fbf7f2', { roughness: 0.5 });
    mesh(rbox(S, 0.32, 0.08, 0.03), base, 0, 0.16, -S / 2 + 0.04, g);
    mesh(rbox(0.08, 0.32, S, 0.03), base, -S / 2 + 0.04, 0.16, 0, g);
    // 벽 위 몰딩
    mesh(rbox(S + 0.36, 0.14, 0.4, 0.05), edge, -0.15, H + 0.07, -S / 2 - 0.15, g);
    mesh(rbox(0.4, 0.14, S, 0.05), edge, -S / 2 - 0.15, H + 0.07, 0, g);
    return g;
  };

  // 창문 (뒷벽 z 면에 붙는다)
  P.window = function (parent, x, y, z, w, h, o) {
    o = o || {};
    const g = group(x, y, z, parent);
    const sky = tex(256, 256, (c, W, Hh) => {
      const gr = c.createLinearGradient(0, 0, 0, Hh);
      gr.addColorStop(0, o.skyTop || '#7fc4f2');
      gr.addColorStop(1, o.skyBot || '#d9f0ff');
      c.fillStyle = gr;
      c.fillRect(0, 0, W, Hh);
      if (o.stars) {
        c.fillStyle = '#fff';
        for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, (i * 53) % (Hh * 0.7), 2, 2);
        c.beginPath(); c.arc(W * 0.72, Hh * 0.25, 18, 0, 7); c.fillStyle = '#fff6c8'; c.fill();
      } else {
        c.fillStyle = 'rgba(255,255,255,0.95)';
        [[60, 70, 1], [180, 120, 0.8], [110, 190, 0.6]].forEach(([cx, cy, s]) => {
          for (let k = 0; k < 5; k++) {
            c.beginPath();
            c.arc(cx + (k - 2) * 14 * s, cy - (k % 2) * 8 * s, (14 + (k % 3) * 5) * s, 0, 7);
            c.fill();
          }
        });
        // 먼 언덕
        c.fillStyle = o.hill || '#8fd07a';
        c.beginPath();
        c.moveTo(0, Hh);
        c.bezierCurveTo(W * 0.3, Hh * 0.7, W * 0.6, Hh * 0.95, W, Hh * 0.78);
        c.lineTo(W, Hh);
        c.fill();
      }
    });
    const glass = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: sky, toneMapped: false }));
    glass.position.z = 0.01;
    g.add(glass);
    const fm = pm(o.frame || '#ffffff', { roughness: 0.4 });
    const t = 0.16;
    mesh(rbox(w + t * 2, t, 0.22, 0.05), fm, 0, h / 2 + t / 2, 0.08, g);
    mesh(rbox(w + t * 2, t, 0.22, 0.05), fm, 0, -h / 2 - t / 2, 0.08, g);
    mesh(rbox(t, h, 0.22, 0.05), fm, -w / 2 - t / 2, 0, 0.08, g);
    mesh(rbox(t, h, 0.22, 0.05), fm, w / 2 + t / 2, 0, 0.08, g);
    mesh(rbox(0.08, h, 0.12, 0.03), fm, 0, 0, 0.06, g);
    mesh(rbox(w, 0.08, 0.12, 0.03), fm, 0, 0, 0.06, g);
    // 창턱
    mesh(rbox(w + 0.6, 0.12, 0.5, 0.04), fm, 0, -h / 2 - t - 0.04, 0.22, g);
    return g;
  };

  // 주름 커튼
  P.curtain = function (parent, x, y, z, w, h, color) {
    const g = group(x, y, z, parent);
    const m = pm(color, { roughness: 0.95 });
    const n = Math.max(3, Math.round(w / 0.18));
    for (let i = 0; i < n; i++) {
      const c = mesh(K.capsule(0.11, h - 0.22), m, -w / 2 + (i + 0.5) * (w / n), -h / 2, (i % 2) * 0.06, g);
      c.scale.z = 0.7;
    }
    // 묶는 끈
    mesh(K.torus(w * 0.42, 0.04), mat('#f4e3c0'), 0, -h * 0.62, 0.05, g).scale.set(1, 0.25, 1);
    return g;
  };

  // 액자
  P.frame = function (parent, x, y, z, w, h, draw, o) {
    o = o || {};
    const g = group(x, y, z, parent);
    if (o.onLeft) g.rotation.y = Math.PI / 2;
    mesh(rbox(w, h, 0.1, 0.03), pm(o.color || '#6b4a32', { roughness: 0.5 }), 0, 0, 0.05, g);
    const pic = tex(256, Math.round((256 * h) / w), draw);
    const p = new T.Mesh(new T.PlaneGeometry(w - 0.2, h - 0.2), new T.MeshStandardMaterial({ map: pic, roughness: 0.8 }));
    p.position.z = 0.105;
    p.material.userData.nopaint = true;
    g.add(p);
    return g;
  };

  // 그림들
  P.pics = {
    mountain(c, W, H) {
      c.fillStyle = '#ffe3b8'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ff8a5c'; c.beginPath(); c.arc(W * 0.7, H * 0.3, W * 0.12, 0, 7); c.fill();
      c.fillStyle = '#5d8f7a'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.35, H * 0.35); c.lineTo(W * 0.7, H); c.fill();
      c.fillStyle = '#3f6e62'; c.beginPath(); c.moveTo(W * 0.3, H); c.lineTo(W * 0.72, H * 0.5); c.lineTo(W * 1.1, H); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(W * 0.35, H * 0.35); c.lineTo(W * 0.28, H * 0.48); c.lineTo(W * 0.42, H * 0.48); c.fill();
    },
    whale(c, W, H) {
      c.fillStyle = '#cfe9f7'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#4a86c5';
      c.beginPath(); c.ellipse(W * 0.48, H * 0.58, W * 0.3, H * 0.18, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(W * 0.74, H * 0.55); c.lineTo(W * 0.92, H * 0.38); c.lineTo(W * 0.9, H * 0.7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(W * 0.32, H * 0.54, W * 0.03, 0, 7); c.fill();
      c.fillStyle = '#233'; c.beginPath(); c.arc(W * 0.32, H * 0.54, W * 0.015, 0, 7); c.fill();
      c.strokeStyle = '#4a86c5'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(W * 0.42, H * 0.38); c.quadraticCurveTo(W * 0.38, H * 0.2, W * 0.3, H * 0.18); c.stroke();
      c.beginPath(); c.moveTo(W * 0.42, H * 0.38); c.quadraticCurveTo(W * 0.46, H * 0.2, W * 0.54, H * 0.18); c.stroke();
      c.fillStyle = '#9bc7e6'; c.fillRect(0, H * 0.85, W, H * 0.15);
    },
    rainbow(c, W, H) {
      c.fillStyle = '#fff8ee'; c.fillRect(0, 0, W, H);
      ['#ff6b6b', '#ffb84d', '#ffe066', '#6fd08c', '#5aa9e6', '#9b7be0'].forEach((col, i) => {
        c.strokeStyle = col; c.lineWidth = W * 0.05;
        c.beginPath(); c.arc(W / 2, H * 0.85, W * (0.4 - i * 0.05), Math.PI, 0); c.stroke();
      });
      c.fillStyle = '#fff'; c.beginPath(); c.arc(W * 0.12, H * 0.84, W * 0.08, 0, 7); c.arc(W * 0.2, H * 0.84, W * 0.07, 0, 7); c.fill();
    },
    cat(c, W, H) {
      c.fillStyle = '#ffd6dc'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#f2a65a';
      c.beginPath(); c.arc(W / 2, H * 0.58, W * 0.28, 0, 7); c.fill();
      c.beginPath(); c.moveTo(W * 0.26, H * 0.45); c.lineTo(W * 0.3, H * 0.18); c.lineTo(W * 0.46, H * 0.34); c.fill();
      c.beginPath(); c.moveTo(W * 0.74, H * 0.45); c.lineTo(W * 0.7, H * 0.18); c.lineTo(W * 0.54, H * 0.34); c.fill();
      c.fillStyle = '#333';
      c.beginPath(); c.arc(W * 0.4, H * 0.55, W * 0.03, 0, 7); c.arc(W * 0.6, H * 0.55, W * 0.03, 0, 7); c.fill();
      c.fillStyle = '#e46b7b'; c.beginPath(); c.arc(W / 2, H * 0.64, W * 0.02, 0, 7); c.fill();
    },
    plant(c, W, H) {
      c.fillStyle = '#eef4e6'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#4c8a55'; c.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        c.beginPath(); c.moveTo(W / 2, H * 0.9);
        c.quadraticCurveTo(W * (0.2 + i * 0.1), H * 0.5, W * (0.15 + i * 0.12), H * (0.2 + (i % 2) * 0.1)); c.stroke();
      }
      c.fillStyle = '#c96b4a'; c.fillRect(W * 0.38, H * 0.8, W * 0.24, H * 0.16);
    },
    abstract(c, W, H) {
      c.fillStyle = '#f7efe3'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#e07a5f'; c.beginPath(); c.arc(W * 0.35, H * 0.4, W * 0.2, 0, 7); c.fill();
      c.fillStyle = '#3d405b'; c.fillRect(W * 0.45, H * 0.45, W * 0.35, H * 0.35);
      c.fillStyle = '#f2cc8f'; c.beginPath(); c.moveTo(W * 0.1, H * 0.9); c.lineTo(W * 0.5, H * 0.9); c.lineTo(W * 0.3, H * 0.6); c.fill();
    },
  };

  // 책 한 줄
  P.books = function (parent, x, y, z, width, r, o) {
    o = o || {};
    const g = group(x, y, z, parent);
    const cols = o.colors || ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c', '#8e6cc9', '#e97ab1', '#3b6ea5', '#f4d35e'];
    let cx = -width / 2;
    const list = [];
    while (cx < width / 2 - 0.12) {
      const bw = 0.1 + r() * 0.12;
      const bh = (o.h || 0.8) * (0.72 + r() * 0.28);
      const bd = (o.d || 0.55) * (0.85 + r() * 0.15);
      const b = mesh(rbox(bw, bh, bd, 0.02, 1), pm(K.pick(r, cols), { roughness: 0.6 }), cx + bw / 2, bh / 2, 0, g);
      // 책등 띠
      const band = mesh(K.box(bw * 1.02, 0.04, 0.02), mat('#f5ecd0', { roughness: 0.5 }), 0, bh * 0.28, bd / 2, b);
      band.material.userData.nopaint = true;
      list.push(b);
      cx += bw + 0.012;
    }
    g.userData.books = list;
    return g;
  };

  // 화분
  P.plant = function (parent, x, z, s, r, o) {
    o = o || {};
    const g = group(x, o.y || 0, z, parent);
    g.scale.setScalar(s);
    const pot = mesh(K.lathe('pot', [[0, 0], [0.34, 0], [0.4, 0.05], [0.46, 0.62], [0.52, 0.66], [0.52, 0.74], [0, 0.74]]), pm(o.pot || '#d9774c', { roughness: 0.8 }), 0, 0, 0, g);
    mesh(K.cyl(0.46, 0.46, 0.04, 20), mat('#4a3122', { roughness: 1 }), 0, 0.7, 0, g);
    const leaf = mat(o.leaf || '#4f9a58', { roughness: 0.6 });
    const leaf2 = mat(shade(o.leaf || '#4f9a58', -0.2), { roughness: 0.6 });
    const n = o.leaves || 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.4;
      const len = 0.9 + r() * 0.6;
      const stem = group(0, 0.72, 0, g);
      stem.rotation.y = a;
      stem.rotation.z = 0.35 + r() * 0.55;
      const lf = mesh(K.sphere(0.5, 16, 12), i % 2 ? leaf : leaf2, 0, len * 0.55, 0, stem);
      lf.scale.set(0.34, len * 0.55, 0.1);
    }
    if (!o.noBlob) blob(parent, x, z, 1.3 * s, 1.3 * s, 0.35, null, g);
    return g;
  };

  // 공
  P.ball = function (parent, x, z, rad, c1, c2) {
    const g = group(x, rad, z, parent);
    const t = tex(128, 64, (c, W, H) => {
      c.fillStyle = c1; c.fillRect(0, 0, W, H);
      c.fillStyle = c2;
      for (let i = 0; i < 4; i++) c.fillRect((i * W) / 4, 0, W / 8, H);
      c.fillStyle = '#fff'; c.fillRect(0, H * 0.45, W, H * 0.1);
    });
    const m = new T.MeshStandardMaterial({ map: t, roughness: 0.35 });
    m.userData.paint = true;
    const b = mesh(K.sphere(rad, 32, 20), m, 0, 0, 0, g);
    b.rotation.set(0.4, 0.6, 0.3);
    blob(parent, x, z, rad * 2.4, rad * 2.4, 0.45, null, g);
    return g;
  };

  // 곰인형
  P.teddy = function (parent, x, z, s, color, rotY) {
    const g = group(x, 0, z, parent);
    g.scale.setScalar(s);
    g.rotation.y = rotY || 0;
    const fur = pm(color || '#c98a52', { roughness: 0.95 });
    const light = mat(shade(color || '#c98a52', 0.35), { roughness: 0.95 });
    const dark = mat('#2b1d16', { roughness: 0.3 });
    mesh(K.sphere(0.5), fur, 0, 0.55, 0, g).scale.set(1, 1.05, 0.9);
    mesh(K.sphere(0.3), light, 0, 0.5, 0.3, g).scale.set(1, 1.1, 0.5);
    const head = group(0, 1.25, 0.02, g);
    mesh(K.sphere(0.4), fur, 0, 0, 0, head);
    mesh(K.sphere(0.15), light, 0, -0.08, 0.34, head).scale.set(1.2, 0.9, 0.8);
    mesh(K.sphere(0.055), dark, 0, -0.02, 0.46, head);
    mesh(K.sphere(0.045), dark, -0.15, 0.1, 0.34, head);
    mesh(K.sphere(0.045), dark, 0.15, 0.1, 0.34, head);
    [-1, 1].forEach((sd) => {
      mesh(K.sphere(0.15), fur, sd * 0.3, 0.3, -0.02, head).scale.set(1, 1, 0.6);
      mesh(K.sphere(0.08), light, sd * 0.3, 0.3, 0.05, head).scale.set(1, 1, 0.4);
      const arm = mesh(K.capsule(0.13, 0.35), fur, sd * 0.5, 0.75, 0.12, g);
      arm.rotation.z = sd * 0.9; arm.rotation.x = -0.4;
      const leg = mesh(K.capsule(0.16, 0.3), fur, sd * 0.28, 0.2, 0.3, g);
      leg.rotation.x = Math.PI / 2 - 0.2;
      mesh(K.sphere(0.12), light, sd * 0.28, 0.2, 0.52, g).scale.set(1, 1, 0.3);
    });
    // 리본
    const bow = pm('#e0506a', { roughness: 0.5 });
    const bg = group(0, 0.95, 0.3, g);
    mesh(K.sphere(0.1), bow, -0.12, 0, 0, bg).scale.set(1.3, 0.8, 0.5);
    mesh(K.sphere(0.1), bow, 0.12, 0, 0, bg).scale.set(1.3, 0.8, 0.5);
    mesh(K.sphere(0.06), bow, 0, 0, 0.02, bg);
    g.userData.bow = bg;
    blob(parent, x, z, 1.4 * s, 1.4 * s, 0.4, null, g);
    return g;
  };

  // 고양이 (웅크려 자는)
  P.cat = function (parent, x, z, s, color, rotY, o) {
    o = o || {};
    const g = group(x, o.y || 0, z, parent);
    g.scale.setScalar(s);
    g.rotation.y = rotY || 0;
    const fur = pm(color || '#f0a24e', { roughness: 0.95 });
    const belly = mat('#fff4e6', { roughness: 0.95 });
    const dark = mat('#2e2320', { roughness: 0.5 });
    const pink = mat('#f28b9b', { roughness: 0.6 });
    const stripe = mat(shade(color || '#f0a24e', -0.35), { roughness: 0.95 });
    // 몸: 앞뒤로 긴 콩 모양
    const body = mesh(K.sphere(0.5), fur, 0, 0.3, 0, g);
    body.scale.set(1.2, 0.62, 0.85);
    mesh(K.sphere(0.36), fur, -0.32, 0.3, 0.02, g).scale.set(1, 0.75, 1);
    // 등 줄무늬 (위쪽만)
    if (o.stripes !== false) {
      for (let i = -1; i <= 1; i++) {
        const sp = mesh(K.torus(0.44, 0.03, Math.PI * 0.55), stripe, i * 0.24, 0.26, 0, g);
        sp.rotation.set(0, Math.PI / 2, Math.PI * 0.225);
        sp.scale.set(0.95, 0.72, 1);
      }
    }
    // 꼬리: 몸 앞쪽으로 감싼다
    const tail = mesh(K.torus(0.5, 0.08, Math.PI * 0.9), fur, 0.02, 0.12, 0.05, g);
    tail.rotation.x = Math.PI / 2;
    tail.rotation.z = Math.PI * 0.05;
    mesh(K.sphere(0.085), stripe, 0.49, 0.12, 0.2, g);
    // 머리: 크게, 앞발 위에 얹어
    const head = group(0.5, 0.36, 0.22, g);
    head.rotation.y = -0.35;
    head.rotation.z = -0.15;
    mesh(K.sphere(0.32), fur, 0, 0, 0, head).scale.set(0.95, 0.85, 1.05);
    mesh(K.sphere(0.13), belly, 0.2, -0.1, 0.0, head).scale.set(0.8, 0.7, 1.3);
    [-1, 1].forEach((sd) => {
      const ear = mesh(K.cone(0.13, 0.24, 4), fur, -0.02, 0.28, sd * 0.17, head);
      ear.rotation.set(sd * 0.3, Math.PI / 4, 0);
      const ei = mesh(K.cone(0.07, 0.14, 4), pink, 0.03, 0.26, sd * 0.17, head);
      ei.rotation.set(sd * 0.3, Math.PI / 4, 0);
      // 감은 눈: 아래로 휜 선
      const eye = mesh(K.torus(0.055, 0.014, Math.PI), dark, 0.29, 0.04, sd * 0.12, head);
      eye.rotation.set(0, Math.PI / 2, Math.PI);
      // 수염
      [-0.03, 0.02].forEach((dy) => {
        const w = mesh(K.cyl(0.004, 0.004, 0.22, 4), dark, 0.3, -0.08 + dy, sd * 0.2, head);
        w.rotation.x = sd * (1.35 + dy * 4);
      });
    });
    mesh(K.sphere(0.035), pink, 0.33, -0.05, 0, head);
    mesh(K.sphere(0.06), belly, 0.26, -0.12, 0.05, head);
    // 앞발
    mesh(K.sphere(0.1), belly, 0.62, 0.08, 0.36, g).scale.set(1.4, 0.7, 1);
    mesh(K.sphere(0.1), belly, 0.55, 0.08, 0.5, g).scale.set(1.4, 0.7, 1);
    g.userData.head = head;
    blob(parent, x, z, 1.9 * s, 1.5 * s, 0.4, (o.y || 0) + 0.012, g);
    return g;
  };

  // 머그잔
  P.mug = function (parent, x, y, z, color, rotY) {
    const g = group(x, y, z, parent);
    g.rotation.y = rotY || 0;
    const m = pm(color, { roughness: 0.3 });
    mesh(K.cyl(0.13, 0.12, 0.28, 20), m, 0, 0.14, 0, g);
    mesh(K.cyl(0.11, 0.11, 0.02, 16), mat('#6b3e22', { roughness: 0.2 }), 0, 0.26, 0, g);
    const h = mesh(K.torus(0.08, 0.022, Math.PI * 1.1), m, 0.14, 0.14, 0, g);
    h.rotation.z = -Math.PI / 2 - 0.15;
    return g;
  };

  // 블록 쌓기
  P.blocks = function (parent, x, z, r, cols) {
    const g = group(x, 0, z, parent);
    const items = [];
    const sz = 0.38;
    [[0, 0, 0], [sz + 0.02, 0, 0.05], [sz / 2, sz, 0.02]].forEach((p, i) => {
      const t = tex(64, 64, (c, W, H) => {
        c.fillStyle = cols[i]; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('ABC'[i], W / 2, H / 2 + 2);
      });
      const m = new T.MeshStandardMaterial({ map: t, roughness: 0.5 });
      m.userData.paint = true;
      const b = mesh(rbox(sz, sz, sz, 0.04, 2), m, p[0], p[1] + sz / 2, p[2], g);
      b.rotation.y = (r() - 0.5) * 0.4;
      items.push(b);
    });
    blob(parent, x + 0.2, z, 1.3, 0.9, 0.35, null, g);
    g.userData.items = items;
    return g;
  };

  // 장난감 자동차
  P.car = function (parent, x, z, color, rotY) {
    const g = group(x, 0, z, parent);
    g.rotation.y = rotY || 0;
    const m = pm(color, { roughness: 0.3, metalness: 0.1 });
    mesh(rbox(0.9, 0.26, 0.48, 0.1), m, 0, 0.24, 0, g);
    mesh(rbox(0.46, 0.24, 0.42, 0.1), m, -0.05, 0.46, 0, g);
    const glass = mat('#bfe3f5', { roughness: 0.1, metalness: 0.2 });
    glass.userData.nopaint = true;
    mesh(rbox(0.48, 0.16, 0.36, 0.05), glass, -0.05, 0.47, 0, g);
    const tire = mat('#2a2a2a', { roughness: 0.9 });
    [[-0.28, 0.24], [0.28, 0.24], [-0.28, -0.24], [0.28, -0.24]].forEach(([a, b]) => {
      const w = mesh(K.cyl(0.12, 0.12, 0.1, 16), tire, a, 0.12, b, g);
      w.rotation.x = Math.PI / 2;
    });
    blob(parent, x, z, 1.2, 0.8, 0.4, null, g);
    return g;
  };

  // 벽시계 (뒷벽)
  P.clock = function (parent, x, y, z, color, onLeft) {
    const g = group(x, y, z, parent);
    if (onLeft) g.rotation.y = Math.PI / 2;
    const rim = mesh(K.cyl(0.45, 0.45, 0.12, 32), pm(color, { roughness: 0.4 }), 0, 0, 0.06, g);
    rim.rotation.x = Math.PI / 2;
    const face = mesh(K.cyl(0.38, 0.38, 0.13, 32), mat('#fffaf0', { roughness: 0.6 }), 0, 0, 0.07, g);
    face.rotation.x = Math.PI / 2;
    face.material.userData.nopaint = true;
    const dark = mat('#333', { roughness: 0.5 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mesh(K.box(0.03, i % 3 ? 0.04 : 0.08, 0.01), dark, Math.sin(a) * 0.31, Math.cos(a) * 0.31, 0.14, g).rotation.z = -a;
    }
    const hh = group(0, 0, 0.15, g);
    mesh(K.box(0.035, 0.2, 0.01), dark, 0, 0.1, 0, hh);
    const mh = group(0, 0, 0.16, g);
    mesh(K.box(0.025, 0.3, 0.01), dark, 0, 0.15, 0, mh);
    hh.rotation.z = -Math.PI * 0.6;
    mh.rotation.z = 0.2;
    g.userData.hour = hh;
    g.userData.min = mh;
    return g;
  };
})();
