// 그림: Three.js 로 어두운 당구장, 펜던트 등 아래 당구대, 반짝이는 공, 큐, 겨눔선.
// 물리 좌표(x, y) → 3D (x, 높이, z=y). 펠트 윗면이 높이 0.
(function () {
  const T = THREE, P = PHY, R = P.R, HL = P.HL, HW = P.HW;
  const G = (window.RND = {});
  const MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 600;
  G.MOBILE = MOBILE;
  const RAIL_W = 0.14, CUSH = 0.055, RAIL_H = 0.046, CUSH_H = 0.04;

  let renderer, scene, camera, table, ballMesh = [], shadowMesh = [], cue, guide, lamps = [];
  G.cloth = 0; G.ballSet = 0; G.cueSkin = 0;

  function canvasTex(w, h, draw, srgb) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  // ── 천 색(카드로 바뀜)
  G.CLOTHS = [
    { name: '토너먼트 그린', c: '#17683d', d: '#0f4a2b' },
    { name: '로열 블루', c: '#1d5fa8', d: '#123f78' },
    { name: '버건디', c: '#8a2232', d: '#5e1622' },
    { name: '퍼플', c: '#5b3590', d: '#3c2264' },
    { name: '틸', c: '#167b80', d: '#0d5559' },
    { name: '슬레이트', c: '#4a5868', d: '#323c48' },
    { name: '골드 카멜', c: '#a87b34', d: '#7a5622' },
  ];
  function feltTex(i) {
    const cl = G.CLOTHS[i] || G.CLOTHS[0];
    return canvasTex(1024, 512, (g, w, h) => {
      g.fillStyle = cl.c; g.fillRect(0, 0, w, h);
      // 가운데 등 밑이 살짝 밝고 가장자리 어둡게(천의 결 + 쓸린 자국)
      const rg = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.62);
      rg.addColorStop(0, 'rgba(255,255,255,0.05)'); rg.addColorStop(1, 'rgba(0,0,0,0.16)');
      g.fillStyle = rg; g.fillRect(0, 0, w, h);
      seed = 11;
      for (let k = 0; k < 26000; k++) {
        const x = rnd() * w, y = rnd() * h, a = rnd() * 0.07;
        g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.3})`;
        g.fillRect(x, y, 1 + rnd() * 2, 1);
      }
      // 브레이크 자리 쓸림(머리 쪽에서 랙 쪽으로 옅은 줄)
      g.strokeStyle = 'rgba(255,255,255,0.025)'; g.lineWidth = 18;
      g.beginPath(); g.moveTo(w * 0.25, h / 2); g.lineTo(w * 0.75, h / 2); g.stroke();
      // 풋 스폿·헤드 스폿 점
      g.fillStyle = 'rgba(255,255,255,0.35)';
      [w * 0.25, w * 0.75].forEach((x) => { g.beginPath(); g.arc(x, h / 2, 3, 0, 7); g.fill(); });
      g.strokeStyle = 'rgba(255,255,255,0.045)'; g.lineWidth = 1.5; // 헤드 스트링
      g.beginPath(); g.moveTo(w * 0.25, h * 0.03); g.lineTo(w * 0.25, h * 0.97); g.stroke();
    });
  }
  function woodTex(base, dark, w, h, rings) {
    return canvasTex(w || 1024, h || 256, (g, W, H) => {
      g.fillStyle = base; g.fillRect(0, 0, W, H);
      seed = 23;
      for (let k = 0; k < (rings || 70); k++) {
        const y = rnd() * H, amp = 2 + rnd() * 7, f = 0.004 + rnd() * 0.01, ph = rnd() * 6;
        g.strokeStyle = `rgba(${dark},${0.06 + rnd() * 0.16})`; g.lineWidth = 0.6 + rnd() * 2.4;
        g.beginPath();
        for (let x = 0; x <= W; x += 8) { const yy = y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph) * amp * 0.3; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
      }
      for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.06})`; g.fillRect(rnd() * W, rnd() * H, 6 + rnd() * 20, 1); }
    });
  }

  // 공 무늬: 가로 2:1 지도. 솔리드는 통째 색, 스트라이프는 흰 바탕에 가운데 띠, 양쪽에 번호 원
  G.BALLC = ['#f4f1e8', '#f2b705', '#1446a8', '#d2261d', '#5a2a86', '#ef6a10', '#137a3a', '#7a1f1a', '#16151a'];
  G.BALLSETS = [
    { name: '클래식', map: null },
    { name: '파스텔', map: ['#fbf8f0', '#f7d56a', '#7fa7e6', '#f08f86', '#b493dd', '#f6ae72', '#7fcf9a', '#c9877b', '#3a3840'] },
    { name: '네온', map: ['#f6f6ff', '#e8ff2a', '#2a7bff', '#ff2a5a', '#b02aff', '#ff8a1a', '#1aff8a', '#ff4a8a', '#101018'] },
    { name: '빈티지', map: ['#efe3c8', '#d9a62e', '#2f4f7a', '#a83a2a', '#5e3f6e', '#c76a2a', '#3f6e45', '#6e3a2a', '#24201c'] },
  ];
  function ballColor(id) {
    const set = G.BALLSETS[G.ballSet] || G.BALLSETS[0];
    const C = set.map || G.BALLC;
    if (id === 0) return C[0];
    if (id === 8) return C[8];
    return C[((id - 1) % 8) + 1] || C[1];
  }
  function ballTex(id) {
    return canvasTex(512, 256, (g, w, h) => {
      const col = ballColor(id), white = ballColor(0);
      const stripe = id >= 9;
      g.fillStyle = stripe || id === 0 ? white : col; g.fillRect(0, 0, w, h);
      if (stripe) { g.fillStyle = col; g.fillRect(0, h * 0.27, w, h * 0.46); }
      if (id === 0) {                                  // 흰 공: 빨간 점 하나(측정용 점처럼)
        g.fillStyle = '#c8202a';
        [[0.25, 0.5], [0.75, 0.5], [0.5, 0.22], [0, 0.5]].forEach(([u, v]) => { g.beginPath(); g.arc(u * w, v * h, 7, 0, 7); g.fill(); });
        return;
      }
      for (const u of [0.25, 0.75]) {
        g.fillStyle = white; g.beginPath(); g.arc(u * w, h / 2, 31, 0, 7); g.fill();
        g.fillStyle = '#111'; g.font = `700 ${id >= 10 ? 34 : 40}px Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(String(id), u * w, h / 2 + 2);
        if (id === 6 || id === 9) { g.fillRect(u * w - 9, h / 2 + 20, 18, 3); }
      }
    });
  }

  // ── 당구대 모양 도우미: 가운데에서 본 별 모양 경계(사각형 + 포켓 원)
  const CORNER_C = () => P.POCKETS.filter((p) => p.k === 'c');
  function pocketCircles(m) {
    m = m || 1;
    const out = [];
    for (const sx of [1, -1]) for (const sy of [1, -1]) out.push({ x: sx * (HL + 0.03), y: sy * (HW + 0.03), r: 0.075 * m });
    for (const sy of [1, -1]) out.push({ x: 0, y: sy * (HW + 0.056), r: 0.066 * m });
    return out;
  }
  G.pocketCircles = pocketCircles;
  function starPath(a, b, circles, far, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2, dx = Math.cos(th), dy = Math.sin(th);
      let t = Math.min(Math.abs(dx) > 1e-9 ? a / Math.abs(dx) : 1e9, Math.abs(dy) > 1e-9 ? b / Math.abs(dy) : 1e9);
      for (const c of circles) {
        const dc = dx * c.x + dy * c.y, disc = dc * dc - (c.x * c.x + c.y * c.y) + c.r * c.r;
        if (disc < 0) continue;
        const near = dc - Math.sqrt(disc), farT = dc + Math.sqrt(disc);
        if (far) { if (near <= t + 1e-6) t = Math.max(t, farT); }
        else if (near > 0 && near < t) t = near;
      }
      pts.push(new T.Vector2(dx * t, -dy * t));            // 모양의 y = -물리 y (눕힐 때 맞춤)
    }
    return pts;
  }
  function flatExtrude(shape, depth, bevel) {
    const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 3, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);                                 // 모양 (x, -y) → (x, 높이, y)
    return g;
  }

  function buildTable() {
    const grp = new T.Group();
    const mouth = G.mouth || 1;
    const circles = pocketCircles(mouth);
    // 펠트: 쿠션 뒤까지, 포켓 자리는 뚫림
    G.feltMat = new T.MeshStandardMaterial({ map: feltTex(G.cloth), roughness: 0.96, metalness: 0, envMapIntensity: 0.25 });
    const feltShape = new T.Shape(starPath(HL + CUSH + 0.004, HW + CUSH + 0.004, circles, false, 720));
    const felt = new T.Mesh(new T.ShapeGeometry(feltShape), G.feltMat);
    felt.geometry.rotateX(-Math.PI / 2);
    // 펠트 무늬 좌표: 놀이면을 0..1 로
    const uv = felt.geometry.attributes.uv, pos = felt.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + HL) / (2 * HL), 1 - (pos.getZ(i) + HW) / (2 * HW));
    felt.receiveShadow = true;
    grp.add(felt);
    // 쿠션(고무 + 천): 물리 쿠션 코와 같은 선
    const c = 0.088 * mouth, s = 0.064 * mouth, cb = CUSH;
    G.cushMat = new T.MeshStandardMaterial({ color: new T.Color(G.CLOTHS[G.cloth].c).multiplyScalar(0.85), roughness: 0.92, envMapIntensity: 0.25 });
    const polys = [];
    for (const sy of [1, -1]) {
      polys.push([[-HL + c, sy * HW], [-s, sy * HW], [-s + 0.011, sy * (HW + cb)], [-HL + c - cb, sy * (HW + cb)]]);
      polys.push([[s, sy * HW], [HL - c, sy * HW], [HL - c + cb, sy * (HW + cb)], [s - 0.011, sy * (HW + cb)]]);
    }
    for (const sx of [1, -1]) polys.push([[sx * HL, -HW + c], [sx * HL, HW - c], [sx * (HL + cb), HW - c + cb], [sx * (HL + cb), -HW + c - cb]]);
    polys.forEach((p) => {
      const sh = new T.Shape(p.map(([x, y]) => new T.Vector2(x, -y)));
      const m = new T.Mesh(flatExtrude(sh, CUSH_H - 0.004, 0.004), G.cushMat);
      m.castShadow = !MOBILE; m.receiveShadow = true;
      grp.add(m);
    });
    // 나무 레일(포켓 자리 파임)
    const OX = HL + CUSH + RAIL_W, OY = HW + CUSH + RAIL_W, rr = 0.07;
    const outer = new T.Shape();
    outer.moveTo(-OX + rr, -OY); outer.lineTo(OX - rr, -OY); outer.quadraticCurveTo(OX, -OY, OX, -OY + rr);
    outer.lineTo(OX, OY - rr); outer.quadraticCurveTo(OX, OY, OX - rr, OY); outer.lineTo(-OX + rr, OY);
    outer.quadraticCurveTo(-OX, OY, -OX, OY - rr); outer.lineTo(-OX, -OY + rr); outer.quadraticCurveTo(-OX, -OY, -OX + rr, -OY);
    outer.holes.push(new T.Path(starPath(HL + CUSH, HW + CUSH, circles, true, 720).reverse()));
    const wt = woodTex('#4a1a0c', '20,4,0', 1024, 512, 110);
    wt.wrapS = wt.wrapT = T.RepeatWrapping; wt.repeat.set(0.9, 1.8);
    G.railMat = new T.MeshPhysicalMaterial({ map: wt, roughness: 0.45, clearcoat: 0.55, clearcoatRoughness: 0.2, color: 0xffffff, envMapIntensity: 0.4 });
    const rail = new T.Mesh(flatExtrude(outer, RAIL_H - 0.006, 0.006), G.railMat);
    rail.castShadow = !MOBILE; rail.receiveShadow = true;
    grp.add(rail);
    // 몸통·다리
    const bodyMat = new T.MeshStandardMaterial({ map: wt, color: 0x9a7060, roughness: 0.55 });
    const apron = new T.Mesh(new T.BoxGeometry(OX * 2 - 0.02, 0.2, OY * 2 - 0.02), bodyMat);
    apron.position.y = -0.26; grp.add(apron);
    // 레일 아래 옆판(포켓 구멍과 안 겹치게 바깥 가장자리만)
    const sk = 0.085;
    for (const sy of [1, -1]) { const b = new T.Mesh(new T.BoxGeometry(OX * 2, 0.17, sk), bodyMat); b.position.set(0, -0.085, sy * (OY - sk / 2)); grp.add(b); }
    for (const sx of [1, -1]) { const b = new T.Mesh(new T.BoxGeometry(sk, 0.17, OY * 2), bodyMat); b.position.set(sx * (OX - sk / 2), -0.085, 0); grp.add(b); }
    for (const sx of [1, -1]) for (const sy of [1, -1]) {
      const leg = new T.Mesh(new T.CylinderGeometry(0.075, 0.06, 0.6, 16), bodyMat);
      leg.position.set(sx * (OX - 0.16), -0.5, sy * (OY - 0.14)); grp.add(leg);
    }
    // 포켓: 검은 구멍 + 가죽 테 + 크롬 덮개
    const holeMat = new T.MeshStandardMaterial({ color: 0x050403, roughness: 1 });
    const linerMat = new T.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.7 });
    const chromeMat = new T.MeshPhysicalMaterial({ color: 0xa07a38, metalness: 0.9, roughness: 0.38, clearcoat: 0.3, envMapIntensity: 0.6 });
    circles.forEach((cc, i) => {
      const cyl = new T.Mesh(new T.CylinderGeometry(cc.r, cc.r * 0.82, 0.14, 32, 1, true), linerMat);
      cyl.material.side = T.DoubleSide;
      cyl.position.set(cc.x, -0.07, cc.y); grp.add(cyl);
      const bot = new T.Mesh(new T.CircleGeometry(cc.r * 0.86, 32), holeMat);
      bot.rotation.x = -Math.PI / 2; bot.position.set(cc.x, -0.03, cc.y); grp.add(bot);
      // 덮개: 레일 윗면에서 구멍을 감싸는 반달 금속
      const out = Math.atan2(-cc.y, cc.x);                   // 바깥쪽 방향(눕힌 각)
      const corner = i < 4;
      const span = corner ? Math.PI * 1.05 : Math.PI * 0.95;
      const ring = new T.Mesh(new T.RingGeometry(cc.r + 0.002, cc.r + (corner ? 0.03 : 0.024), 40, 1, out - span / 2, span), chromeMat);
      ring.rotation.x = -Math.PI / 2; ring.position.set(cc.x, RAIL_H + 0.001, cc.y); grp.add(ring);
    });
    // 다이아몬드(자개)
    const pearl = new T.MeshPhysicalMaterial({ color: 0xf4efe6, roughness: 0.25, iridescence: 1, iridescenceIOR: 1.6, clearcoat: 1 });
    const dg = new T.CircleGeometry(0.011, 4); dg.rotateX(-Math.PI / 2);
    const dpos = [];
    for (const i of [1, 2, 3, 5, 6, 7]) for (const sy of [1, -1]) dpos.push([-HL + (2 * HL * i) / 8, sy * (HW + CUSH + RAIL_W * 0.5)]);
    for (const i of [1, 2, 3]) for (const sx of [1, -1]) dpos.push([sx * (HL + CUSH + RAIL_W * 0.5), -HW + (2 * HW * i) / 4]);
    dpos.forEach(([x, y]) => { const d = new T.Mesh(dg, pearl); d.position.set(x, RAIL_H + 0.0012, y); d.scale.set(0.75, 1, 1.3); grp.add(d); });
    return grp;
  }

  // ── 방·빛
  function buildRoom() {
    const grp = new T.Group();
    const ft = woodTex('#3a2a20', '10,5,2', 1024, 1024, 160);
    ft.wrapS = ft.wrapT = T.RepeatWrapping; ft.repeat.set(4, 4);
    const floor = new T.Mesh(new T.PlaneGeometry(14, 14), new T.MeshStandardMaterial({ map: ft, color: 0x8a7a70, roughness: 0.7 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.8; floor.receiveShadow = true;
    grp.add(floor);
    // 펜던트 등 두 개(초록 갓). 경기 화면에서는 카메라 앞을 가리니 숨긴다.
    const shadeMat = new T.MeshPhysicalMaterial({ color: 0x0e5a34, roughness: 0.3, clearcoat: 1, side: T.DoubleSide });
    const innerMat = new T.MeshBasicMaterial({ color: 0xfff1d0, side: T.BackSide });
    for (const x of [-0.62, 0.62]) {
      const g = new T.Group();
      const shade = new T.Mesh(new T.CylinderGeometry(0.07, 0.27, 0.17, 40, 1, true), shadeMat);
      const inner = new T.Mesh(new T.CylinderGeometry(0.068, 0.266, 0.168, 40, 1, true), innerMat);
      const cap = new T.Mesh(new T.CylinderGeometry(0.03, 0.07, 0.04, 20), new T.MeshStandardMaterial({ color: 0xb08a40, metalness: 1, roughness: 0.3 }));
      cap.position.y = 0.1;
      const bulb = new T.Mesh(new T.SphereGeometry(0.045, 20, 14), new T.MeshBasicMaterial({ color: 0xfff6e0 }));
      bulb.position.y = -0.03;
      const rod = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, 1.6, 8), new T.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 }));
      rod.position.y = 0.9;
      g.add(shade, inner, cap, bulb, rod);
      g.position.set(x, 1.0, 0);
      grp.add(g); lamps.push(g);
    }
    return grp;
  }
  function buildLights() {
    scene.add(new T.HemisphereLight(0x8a7a6a, 0x1a1008, 0.12));
    G.spots = [];
    for (const x of [-0.62, 0.62]) {
      const sp = new T.SpotLight(0xffe2b8, 9, 4, 0.82, 0.75, 1.6);
      sp.position.set(x, 1.0, 0);
      sp.target.position.set(x * 0.85, 0, 0);
      if (!MOBILE) {
        sp.castShadow = true;
        sp.shadow.mapSize.set(1024, 1024); sp.shadow.bias = -0.0004; sp.shadow.radius = 4;
        sp.shadow.camera.near = 0.4; sp.shadow.camera.far = 2.5;
      }
      scene.add(sp, sp.target); G.spots.push(sp);
    }
  }
  function buildEnv() {
    // 공·레일에 비칠 방: 어두운 상자 + 위의 따뜻한 등 두 개 + 옅은 창
    const es = new T.Scene();
    es.background = new T.Color(0x16100c);
    const box = new T.Mesh(new T.BoxGeometry(8, 4, 8), new T.MeshBasicMaterial({ color: 0x1c140f, side: T.BackSide }));
    box.position.y = 1.5; es.add(box);
    for (const x of [-0.62, 0.62]) {
      const l = new T.Mesh(new T.CircleGeometry(0.28, 32), new T.MeshBasicMaterial({ color: new T.Color(6, 5, 3.8) }));
      l.rotation.x = Math.PI / 2; l.position.set(x, 1.0, 0); es.add(l);
    }
    const win = new T.Mesh(new T.PlaneGeometry(2.4, 0.9), new T.MeshBasicMaterial({ color: new T.Color(0.12, 0.14, 0.2) }));
    win.position.set(0, 1.4, -3.9); es.add(win);
    const neon = new T.Mesh(new T.PlaneGeometry(1.2, 0.25), new T.MeshBasicMaterial({ color: new T.Color(1.6, 0.3, 0.5) }));
    neon.position.set(3.9, 1.6, 0); neon.rotation.y = -Math.PI / 2; es.add(neon);
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(es, 0.03).texture;
  }

  // ── 공
  const blobTex = canvasTex(64, 64, (g, w) => {
    const rg = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    rg.addColorStop(0, 'rgba(0,0,0,0.75)'); rg.addColorStop(0.5, 'rgba(0,0,0,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, w);
  }, false);
  function buildBalls() {
    const geo = new T.SphereGeometry(R, 40, 28);
    const sg = new T.PlaneGeometry(R * 2.9, R * 2.9); sg.rotateX(-Math.PI / 2);
    for (let i = 0; i < 16; i++) {
      const m = new T.Mesh(geo, new T.MeshPhysicalMaterial({ map: ballTex(i), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1 }));
      m.castShadow = !MOBILE;
      m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
      scene.add(m); ballMesh.push(m);
      const s = new T.Mesh(sg, new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: MOBILE ? 0.8 : 0.5 }));
      scene.add(s); shadowMesh.push(s);
    }
  }
  G.retexBalls = function () { for (let i = 0; i < 16; i++) { const m = ballMesh[i].material; m.map.dispose(); m.map = ballTex(i); m.needsUpdate = true; } };
  G.setCloth = function (i) {
    if (G.feltMat && G.cloth === i) return;
    G.cloth = i;
    if (!G.feltMat) return;
    G.feltMat.map.dispose(); G.feltMat.map = feltTex(i); G.feltMat.needsUpdate = true; if (renderer) renderer.initTexture(G.feltMat.map);
    G.cushMat.color.set(new T.Color(G.CLOTHS[i].c).multiplyScalar(0.92));
  };
  G.rebuildTable = function () { if (table && G.builtMouth === (G.mouth || 1)) return; if (table) { scene.remove(table); } G.builtMouth = G.mouth || 1; table = buildTable(); scene.add(table); G.warm(); };

  // ── 큐(끝 가죽·흰 페룰·메이플·쇠 고리·앞쪽 나무·감개·뒤끝)
  G.CUES = [
    { name: '하우스 큐', fore: '#6a3a1e', wrap: '#1a1a1a', butt: '#3a1c0e', ring: '#c8c0b0' },
    { name: '흑단 큐', fore: '#151012', wrap: '#5a1414', butt: '#0c0a0a', ring: '#d8b45a' },
    { name: '은빛 큐', fore: '#8a8c96', wrap: '#22242a', butt: '#5a5e68', ring: '#f0f0f6' },
    { name: '레드 큐', fore: '#9a1a1e', wrap: '#141414', butt: '#5e0c10', ring: '#e8d8a0' },
    { name: '바다 큐', fore: '#145a7a', wrap: '#e8e4d8', butt: '#0c3446', ring: '#c8e4f0' },
    { name: '황금 큐', fore: '#c89a2a', wrap: '#3a2408', butt: '#8a6410', ring: '#fff0b0', gold: true },
  ];
  function buildCue() {
    const k = G.CUES[G.cueSkin] || G.CUES[0];
    const grp = new T.Group();
    const mat = (c, o) => new T.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.15 }, o || {}));
    const mapleTex = woodTex('#e8cf9e', '120,80,30', 64, 512, 30);
    const segs = [
      [0.0058, 0.006, 0, 0.012, mat(0x2a5aa8, { roughness: 0.9, clearcoat: 0 })],      // 초크 묻은 가죽 끝
      [0.0062, 0.0064, 0.012, 0.035, mat(0xf4f0e6)],                                    // 페룰
      [0.0064, 0.0106, 0.035, 0.74, mat(0xffffff, { map: mapleTex })],                  // 메이플
      [0.0112, 0.0112, 0.74, 0.76, mat(k.ring, { metalness: 0.9, roughness: 0.2 })],   // 이음 고리
      [0.0114, 0.0132, 0.76, 1.08, mat(k.fore, k.gold ? { metalness: 0.85, roughness: 0.22 } : null)],
      [0.0133, 0.0138, 1.08, 1.32, mat(k.wrap, { roughness: 0.75, clearcoat: 0.1 })],  // 감개
      [0.0139, 0.0146, 1.32, 1.465, mat(k.butt, k.gold ? { metalness: 0.85, roughness: 0.22 } : null)],
      [0.0146, 0.012, 1.465, 1.475, mat(0x111111, { roughness: 0.8 })],
    ];
    segs.forEach(([r0, r1, y0, y1, m]) => {
      const g = new T.CylinderGeometry(r1, r0, y1 - y0, 20, 1);
      g.translate(0, (y0 + y1) / 2, 0);
      const mesh = new T.Mesh(g, m); mesh.castShadow = !MOBILE; grp.add(mesh);
    });
    // 앞쪽 나무의 흰 V 끼움(포인트) 넷
    for (let i = 0; i < 4; i++) {
      const g = new T.ConeGeometry(0.0042, 0.16, 3, 1);
      const p = new T.Mesh(g, mat(0xf2ead8));
      const a = (i / 4) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.0112, 0.86, Math.sin(a) * 0.0112);   // 큐 몸통 겉면을 따라 눕힘, 뾰족한 끝은 큐 끝 쪽
      p.rotation.set(0, -a, Math.PI); p.scale.set(0.35, 1, 1);
      grp.add(p);
    }
    return grp;
  }
  G.setCue = function (i) { if (cue && G.cueSkin === i) return; G.cueSkin = i; const v = cue && cue.visible; if (cue) scene.remove(cue); cue = buildCue(); cue.visible = !!v; scene.add(cue); G.warm(); };
  G.cuePose = function (x, y, a, pull, show) {
    if (!cue) return;
    cue.visible = !!show;
    if (!show) return;
    const el = 0.09;
    const dir = new T.Vector3(-Math.cos(a) * Math.cos(el), Math.sin(el), -Math.sin(a) * Math.cos(el));
    cue.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
    const d = R + 0.008 + pull;
    cue.position.set(x + dir.x * d, R + dir.y * d, y + dir.z * d);
  };

  // ── 겨눔선(가는 띠) + 유령 공 테
  function strip(color, op) {
    const g = new T.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); g.translate(0.5, 0, 0);
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }));
    m.renderOrder = 5; scene.add(m); m.visible = false; return m;
  }
  function buildGuide() {
    guide = {
      l1: strip(0xffffff, 0.8), l2: strip(0xfff3b0, 0.85), l3: strip(0xbfe6ff, 0.6), l4: strip(0xffffff, 0.45),
      ring: new T.Mesh(new T.RingGeometry(R * 0.86, R, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false })),
      place: new T.Mesh(new T.RingGeometry(R * 1.25, R * 1.5, 40), new T.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.9, depthWrite: false })),
      bad: new T.Mesh(new T.RingGeometry(R * 0.86, R, 40), new T.MeshBasicMaterial({ color: 0xff5040, transparent: true, opacity: 0.9, depthWrite: false })),
    };
    for (const k of ['ring', 'place', 'bad']) { guide[k].rotation.x = -Math.PI / 2; guide[k].renderOrder = 6; guide[k].visible = false; scene.add(guide[k]); }
  }
  function setStrip(m, x1, y1, x2, y2, w, h) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1e-4) { m.visible = false; return; }
    m.visible = true;
    m.position.set(x1, h || R * 0.15, y1);
    m.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
    m.scale.set(len, 1, w);
  }
  G.guideOff = function () { if (!guide) return; for (const k in guide) guide[k].visible = false; };
  // hit = PHY.trace 결과, len = 맞은 공·흰 공 갈 길 길이(카드로 늘어남)
  G.guide = function (c, a, hit, o) {
    G.guideOff();
    if (!hit) return;
    const w = 0.0042;
    setStrip(guide.l1, c.x, c.y, hit.x, hit.y, w);
    if (hit.type === 'ball') {
      guide.ring.visible = true; guide.ring.position.set(hit.x, R * 0.2, hit.y);
      if (o.bad) { guide.bad.visible = true; guide.bad.position.set(hit.x, R * 0.21, hit.y); }
      const ob = o.balls[hit.id];
      const L2 = o.objLen * (0.35 + 0.65 * Math.max(0, hit.cut));
      setStrip(guide.l2, ob.x, ob.y, ob.x + hit.ox * L2, ob.y + hit.oy * L2, w * 1.1);
      const L3 = o.cueLen * hit.cs;
      setStrip(guide.l3, hit.x, hit.y, hit.x + hit.cx * L3, hit.y + hit.cy * L3, w * 0.9);
    } else if (o.bank) {
      setStrip(guide.l4, hit.x, hit.y, hit.x + hit.rx * o.bank, hit.y + hit.ry * o.bank, w * 0.9);
      guide.ring.visible = true; guide.ring.position.set(hit.x, R * 0.2, hit.y);
    } else if (hit.type === 'rail') { guide.ring.visible = true; guide.ring.position.set(hit.x, R * 0.2, hit.y); }
  };
  G.placeRing = function (x, y, on, ok) {
    if (!guide) return;
    guide.place.visible = !!on;
    if (on) { guide.place.position.set(x, 0.002, y); guide.place.material.color.set(ok ? 0xfff3b0 : 0xff5040); }
  };

  // ── 카메라: 경기 = 위에서 살짝 비스듬히(폰 세로면 대를 세로로), 타이틀 = 둘레를 천천히 돎
  G.mode = 'title';
  G.margin = { t: 50, b: 10, l: 10, r: 10 };
  let W = 1, H = 1, shakeA = 0, titleT = 0, portrait = false;
  const tgt = new T.Vector3();
  function fitPlay() {
    camera.clearViewOffset();
    portrait = H > W * 1.05;
    const tilt = 0.16;
    const off = portrait ? new T.Vector3(-Math.sin(tilt), Math.cos(tilt), 0) : new T.Vector3(0, Math.cos(tilt), Math.sin(tilt));
    camera.up.set(portrait ? 1 : 0, 0, portrait ? 0 : -1);
    const OX = HL + CUSH + RAIL_W * 0.5, OY = HW + CUSH + RAIL_W * 0.5;   // 나무 테 바깥 반은 조작 칸 밑으로 들어가도 됨(공을 크게)
    const pts = [];
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const h of [RAIL_H, 0]) pts.push(new T.Vector3(sx * OX, h, sy * OY));
    const m = G.margin, bw = (W - m.l - m.r) / W * 2, bh = (H - m.t - m.b) / H * 2;
    let lo = 0.5, hi = 30, ext = null;
    const measure = (d) => {
      camera.position.copy(off).multiplyScalar(d); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      pts.forEach((p) => { const q = p.clone().project(camera); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
      return { x0, x1, y0, y1 };
    };
    for (let i = 0; i < 40; i++) {
      const d = (lo + hi) / 2, e = measure(d);
      if (e.x1 - e.x0 <= bw && e.y1 - e.y0 <= bh) { hi = d; ext = e; } else lo = d;
    }
    ext = measure(hi);
    const cx = (ext.x0 + ext.x1) / 2, cy = (ext.y0 + ext.y1) / 2;
    const bx = -1 + (m.l / W) * 2 + bw / 2, by = 1 - (m.t / H) * 2 - bh / 2;
    camera.setViewOffset(W, H, -(bx - cx) * W / 2, (by - cy) * H / 2, W, H);
    camera.updateProjectionMatrix();
    G.camDist = hi;
  }
  // 처음 그리는 재질·그림을 미리 준비(경기 중 멈칫 막기): 숨긴 것도 잠깐 켜서 셰이더를 만들어 둔다
  G.warm = function () {
    if (!renderer) return;
    const hid = [];
    scene.traverse((o) => { if (!o.visible) { hid.push(o); o.visible = true; } });
    scene.traverse((o) => { const m = o.material; if (m && m.map) renderer.initTexture(m.map); });
    try { renderer.compile(scene, camera); } catch (e) {}
    hid.forEach((o) => (o.visible = false));
  };
  G.isPortrait = () => portrait;
  G.resize = function () {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    if (G.mode === 'play') fitPlay();
  };
  G.setMode = function (m) {
    G.mode = m;
    lamps.forEach((l) => (l.visible = m !== 'play'));
    if (m === 'play') fitPlay(); else { camera.clearViewOffset(); camera.up.set(0, 1, 0); camera.updateProjectionMatrix(); }
  };
  G.shake = (a) => { shakeA = Math.max(shakeA, a); };

  G.init = function (canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = !MOBILE; renderer.shadowMap.type = T.PCFSoftShadowMap;
    scene = new T.Scene();
    scene.background = new T.Color(0x0a0807);
    scene.fog = new T.Fog(0x0a0807, 4, 11);
    camera = new T.PerspectiveCamera(30, 1, 0.05, 30);
    buildEnv(); buildLights();
    scene.add(buildRoom());
    table = buildTable(); scene.add(table); G.builtMouth = G.mouth || 1;
    buildBalls(); buildGuide();
    cue = buildCue(); cue.visible = false; scene.add(cue);
    G.scene = scene; G.camera = camera; G.renderer = renderer;
    G.resize();
    G.warm();
    renderer.render(scene, camera);   // 첫 장을 로딩 때 그려 도형을 올려 둔다
  };

  // ── 공 자리 맞추기 + 굴러가는 회전 + 포켓에 빠지는 모습
  const last = [], drops = {};
  const Q = new T.Quaternion(), AX = new T.Vector3();
  G.drop = function (id, pk, x, y) {
    const p = P.POCKETS[pk];
    drops[id] = { t: 0, x0: x, y0: y, px: p.x * 1.0, py: p.y * 1.0 };
  };
  G.clearDrops = function () { for (const k in drops) delete drops[k]; };
  G.sync = function (balls, dt) {
    for (let i = 0; i < 16; i++) {
      const b = balls[i], m = ballMesh[i], s = shadowMesh[i];
      const d = drops[i];
      if (d) {
        d.t += dt;
        const k = Math.min(1, d.t / 0.32), e = k * k;
        const x = d.x0 + (d.px - d.x0) * Math.min(1, k * 1.6), y = d.y0 + (d.py - d.y0) * Math.min(1, k * 1.6);
        m.position.set(x, R - e * 0.09, y);
        m.visible = k < 1; s.visible = false;
        if (k >= 1) delete drops[i];
        continue;
      }
      m.visible = b.on; s.visible = b.on;
      if (!b.on) { last[i] = null; continue; }
      const L = last[i];
      if (L) {
        const dx = b.x - L.x, dy = b.y - L.y, dist = Math.hypot(dx, dy);
        if (dist > 1e-6 && dist < 0.5) { AX.set(dy, 0, -dx).normalize(); Q.setFromAxisAngle(AX, dist / R); m.quaternion.premultiply(Q); }
        L.x = b.x; L.y = b.y;
      } else last[i] = { x: b.x, y: b.y };
      m.position.set(b.x, R, b.y);
      s.position.set(b.x + 0.006, 0.0012, b.y + 0.004);
    }
  };
  G.hideBall = (i, v) => { ballMesh[i].visible = !v; shadowMesh[i].visible = !v; };

  G.frame = function (dt) {
    if (G.mode === 'title') {
      titleT += dt * 0.06;
      const a = titleT + 0.6;
      camera.position.set(Math.cos(a) * 2.9, 1.45, Math.sin(a) * 2.2);
      camera.lookAt(0, -0.05, 0);
    } else if (shakeA > 0.0002) {
      fitPlay();
      camera.position.x += (Math.random() - 0.5) * shakeA; camera.position.z += (Math.random() - 0.5) * shakeA;
      shakeA *= Math.exp(-dt * 9);
      if (shakeA <= 0.0002) fitPlay();
    }
    renderer.render(scene, camera);
  };

  // 화면 좌표 → 대 위 물리 좌표
  const rc = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0, 1, 0), -R), hitV = new T.Vector3();
  G.pick = function (cx, cy) {
    const r = renderer.domElement.getBoundingClientRect();
    rc.setFromCamera({ x: ((cx - r.left) / r.width) * 2 - 1, y: -((cy - r.top) / r.height) * 2 + 1 }, camera);
    if (!rc.ray.intersectPlane(plane, hitV)) return null;
    return { x: hitV.x, y: hitV.z };
  };
  G.toScreen = function (x, y, h) {
    const v = new T.Vector3(x, h || R, y).project(camera);
    return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
  };
  // 화면에서 1m 가 몇 px 인지(손가락 끌기 감도)
  G.pxPerM = function () { const a = G.toScreen(0, 0), b = G.toScreen(1, 0); return Math.hypot(b.x - a.x, b.y - a.y); };
})();
