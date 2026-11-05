// 그리기 바탕: 렌더러, 작업실(팔걸이·쟁반·잉크 컵), 가게 앞(밤거리 개업 오프닝)
(function () {
  const R = (window.RND = {});
  const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  R.cv2 = cv2; R.tex = tex;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  R.rng = rng;

  R.init = function (canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    R.renderer = r;
    R.camera = new THREE.PerspectiveCamera(34, 1, 0.5, 900);
    buildStudio(); buildFront();
    R.scene = R.studio;
    R.resize(); window.addEventListener('resize', R.resize);
    return R;
  };
  R.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.renderer.setSize(w, h, false);
    R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  };
  R.render = function () { R.renderer.render(R.scene, R.camera); };
  R.shot = function (name) {
    R.render();
    const d = R.renderer.domElement.toDataURL('image/png');
    return fetch('/save?name=' + encodeURIComponent(name || 'shot.png'), { method: 'POST', body: d }).then((x) => x.text());
  };

  // ================= 작업실 =================
  function buildStudio() {
    const s = (R.studio = new THREE.Scene());
    s.background = new THREE.Color('#2a2220');
    const Rr = rng(11);
    // 빛: 위 왼쪽 작업등(그림자) + 반구광 + 오른쪽 차가운 채움
    R.hemi = new THREE.HemisphereLight('#fff3e2', '#4a3a34', 0.95); s.add(R.hemi);
    const key = (R.key = new THREE.DirectionalLight('#fff6ea', 2.3));
    key.position.set(-10, 40, 14); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 5; sc.far = 90;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
    s.add(key); s.add(key.target);
    const fill = new THREE.DirectionalLight('#d9e6ff', 0.45); fill.position.set(14, 10, -20); s.add(fill);
    R.salonLight = function (expo) { R.renderer.toneMappingExposure = expo; key.intensity = 2.3 * expo; };

    // 바닥 탁자: 검은 가죽 팔걸이 아래 짙은 나무 작업대
    const wc = cv2(1024, 1024), wg = wc.getContext('2d');
    wg.fillStyle = '#3b2a20'; wg.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 64; i++) { const y = i * 16 + Rr() * 4; wg.fillStyle = `rgba(${20 + Rr() * 30},${12 + Rr() * 16},${8 + Rr() * 10},.5)`; wg.fillRect(0, y, 1024, 2 + Rr() * 3); }
    for (let i = 0; i < 900; i++) { wg.strokeStyle = Rr() < 0.5 ? 'rgba(15,8,4,.18)' : 'rgba(120,80,50,.12)'; wg.lineWidth = 1; wg.beginPath(); const y = Rr() * 1024, x = Rr() * 1024; wg.moveTo(x, y); wg.bezierCurveTo(x + 60, y + (Rr() - 0.5) * 6, x + 120, y + (Rr() - 0.5) * 6, x + 200, y + (Rr() - 0.5) * 4); wg.stroke(); }
    const wT = tex(wc); wT.wrapS = wT.wrapT = THREE.RepeatWrapping; wT.repeat.set(2, 2);
    const table = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: wT, roughness: 0.62 }));
    table.rotation.x = -Math.PI / 2; table.position.y = -8.5; table.receiveShadow = true; s.add(table);

    // 팔걸이: 검은 가죽 쿠션(둥근 모서리, 바늘땀) — 위에 일회용 랩
    const lc = cv2(512, 512), lgx = lc.getContext('2d');
    lgx.fillStyle = '#1b1a1c'; lgx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { lgx.fillStyle = Rr() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.25)'; lgx.beginPath(); lgx.arc(Rr() * 512, Rr() * 512, 0.6 + Rr() * 1.4, 0, 7); lgx.fill(); }
    const lT = tex(lc); lT.wrapS = lT.wrapT = THREE.RepeatWrapping; lT.repeat.set(4, 2);
    const leather = (R.leather = new THREE.MeshStandardMaterial({ map: lT, roughness: 0.42, color: '#ffffff' }));
    const rg = new THREE.BoxGeometry(48, 5, 13, 24, 4, 8); const ra = rg.attributes.position;
    for (let i = 0; i < ra.count; i++) { const x = ra.getX(i), y = ra.getY(i), z = ra.getZ(i); const ex = Math.max(0, Math.abs(z) - 4.5) / 2, ey = y > 0 ? 1 : 0; ra.setY(i, y - ey * ex * ex * 1.2 + (y > 0 ? -0.15 * Math.cos(x * 0.5) * 0 : 0)); }
    rg.computeVertexNormals();
    R.rest = new THREE.Group(); s.add(R.rest);
    const rest = new THREE.Mesh(rg, leather); rest.position.set(1, -5.9, 0); rest.castShadow = rest.receiveShadow = true; R.rest.add(rest);
    // 바늘땀 줄
    const stitchM = new THREE.MeshStandardMaterial({ color: '#5a5650', roughness: 0.8 });
    for (const z of [-5.6, 5.6]) for (let x = -23; x < 24; x += 0.9) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.08), stitchM); st.position.set(1 + x, -3.47, z * (1 - 0.0)); st.position.y = -3.4 - Math.max(0, Math.abs(z) - 4.5) ** 2 * 0.3 / 4; R.rest.add(st); }
    // 랩(팔 밑 반투명 비닐)
    const wrap = new THREE.Mesh(new THREE.PlaneGeometry(46, 12.4), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, roughness: 0.08, metalness: 0.1, depthWrite: false }));
    wrap.rotation.x = -Math.PI / 2; wrap.position.set(1, -3.36, 0); R.rest.add(wrap);
    // 쇠 다리
    const steel = new THREE.MeshStandardMaterial({ color: '#b8bec4', metalness: 0.85, roughness: 0.3 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4, 16), steel); pole.position.set(1, -10, 0); R.rest.add(pole);

    // 쟁반(오른쪽): 스테인리스 쟁반 + 잉크 컵 + 휴지 + 분무기 + 바셀린
    const tray = new THREE.Group(); tray.position.set(2, -7.9, -17); tray.rotation.y = 0.08; s.add(tray); R.tray = tray;
    const tb = new THREE.Mesh(new THREE.BoxGeometry(28, 0.5, 12), steel); tb.castShadow = tb.receiveShadow = true; tray.add(tb);
    for (const [w, d, x, z] of [[28, 0.4, 0, 6], [28, 0.4, 0, -6], [0.4, 12, 14, 0], [0.4, 12, -14, 0]]) { const lip = new THREE.Mesh(new THREE.BoxGeometry(w, 1.0, d), steel); lip.position.set(x, 0.5, z); tray.add(lip); }
    R.caps = {};
    FLASH.COLKEYS.forEach((k, i) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.75, 1.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.4, side: THREE.DoubleSide }));
      cup.position.set(-11 + i * 2.3, 0.9, -2.6); cup.castShadow = true; tray.add(cup);
      const ink = new THREE.Mesh(new THREE.CircleGeometry(0.86, 20), new THREE.MeshStandardMaterial({ color: FLASH.COL[k], roughness: 0.15 }));
      ink.rotation.x = -Math.PI / 2; ink.position.set(-11 + i * 2.3, 1.3, -2.6); tray.add(ink); R.caps[k] = cup;
    });
    // 휴지 뭉치
    const pt = new THREE.Mesh(new THREE.BoxGeometry(6, 1.6, 5, 6, 2, 6), new THREE.MeshStandardMaterial({ color: '#f6f4ee', roughness: 0.95 }));
    { const pa = pt.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, pa.getY(i) + (Rr() - 0.5) * 0.35); pt.geometry.computeVertexNormals(); }
    pt.position.set(5, 1.0, 1.5); pt.rotation.y = 0.3; pt.castShadow = true; tray.add(pt);
    // 그린솝 분무기
    const btl = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 6.5, 24), new THREE.MeshStandardMaterial({ color: '#4caf6a', transparent: true, opacity: 0.8, roughness: 0.15 }));
    btl.position.set(10.5, 3.4, -1.5); btl.castShadow = true; tray.add(btl);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 2.4), new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.5 })); cap.position.set(10.5, 7.5, -1.2); tray.add(cap);
    // 바셀린 통
    const vas = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.6, 24), new THREE.MeshStandardMaterial({ color: '#3a6ab8', roughness: 0.4 })); vas.position.set(-10, 0.9, 3); tray.add(vas);
    // 왼쪽 위: 작업등 갓(밝은 원)
    const lampM = new THREE.MeshBasicMaterial({ color: '#fff7e6', toneMapped: false });
    const lamp = new THREE.Mesh(new THREE.TorusGeometry(9, 0.9, 12, 48), lampM); lamp.position.set(-14, 42, 18); lamp.lookAt(0, 0, 0); s.add(lamp); R.ring = lamp; lamp.visible = false;
  }

  // ================= 가게 앞: 밤거리 개업 =================
  function buildFront() {
    const s = (R.front = new THREE.Scene());
    const F = (R.F = {});
    const Rr = rng(31);
    // 밤하늘
    const sk = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#0b1024') }, mid: { value: new THREE.Color('#3a2a48') } },
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; varying vec3 vp; void main(){ float h = normalize(vp).y; vec3 c = mix(mid, top, pow(clamp(h*1.6,0.0,1.0),0.6)); gl_FragColor = vec4(c,1.0); }',
    }));
    s.add(sk);
    s.fog = new THREE.Fog('#2a2238', 60, 260);
    s.add(new THREE.HemisphereLight('#6a6aa0', '#2a2020', 0.55));
    // 가로등(왼쪽 위 주황)
    const sun = (F.lamp = new THREE.DirectionalLight('#ffc98a', 1.25)); sun.position.set(-20, 22, 24); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 18; sc.bottom = -6; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
    s.add(sun);
    // 가게 불빛(유리 안에서 나오는 빛, 셔터가 열리면 켜짐)
    const shopL = (F.shopL = new THREE.PointLight('#ff9a6a', 0, 30, 1.6)); shopL.position.set(0, 2.5, 3); s.add(shopL);
    const neonL = (F.neonL = new THREE.PointLight('#ff3a4a', 0, 26, 1.6)); neonL.position.set(0, 6.4, 3); s.add(neonL);
    // 젖은 보도(어두운 판, 반질)
    const pc = cv2(512, 512), pg = pc.getContext('2d');
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 58 + Rr() * 14; pg.fillStyle = `rgb(${v},${v - 2},${v + 4})`; pg.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); }
    pg.fillStyle = 'rgba(20,18,22,.6)'; for (let i = 0; i <= 4; i++) { pg.fillRect(0, i * 128 - 1.5, 512, 3); pg.fillRect(i * 128 - 1.5, 0, 3, 512); }
    for (let i = 0; i < 4000; i++) { pg.fillStyle = Rr() < 0.5 ? 'rgba(0,0,0,.15)' : 'rgba(200,200,220,.06)'; pg.fillRect(Rr() * 512, Rr() * 512, 2, 2); }
    const pT = tex(pc); pT.wrapS = pT.wrapT = THREE.RepeatWrapping; pT.repeat.set(15, 12.5);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 100), new THREE.MeshStandardMaterial({ map: pT, roughness: 0.35, metalness: 0.15 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = 42; ground.receiveShadow = true; s.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshStandardMaterial({ color: '#1e1d22', roughness: 0.4, metalness: 0.2 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, -0.15, 122); s.add(road);
    // 건물: 검게 칠한 벽돌
    const bc = cv2(512, 512), bg = bc.getContext('2d');
    bg.fillStyle = '#1a1716'; bg.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 32; y++) for (let x = -1; x < 9; x++) { const v = Rr(); bg.fillStyle = `rgb(${38 + v * 16},${33 + v * 12},${32 + v * 12})`; bg.fillRect(x * 64 + (y % 2) * 32 + 2, y * 16 + 2, 60, 12); }
    for (let i = 0; i < 3000; i++) { bg.fillStyle = Rr() < 0.5 ? 'rgba(0,0,0,.2)' : 'rgba(255,255,255,.04)'; bg.fillRect(Rr() * 512, Rr() * 512, 2 + Rr() * 3, 1.5); }
    const bT = tex(bc); bT.wrapS = bT.wrapT = THREE.RepeatWrapping; bT.repeat.set(4, 2);
    const brickM = new THREE.MeshStandardMaterial({ map: bT, roughness: 0.9 });
    // 2층 벽은 창 위(6m)부터, 창 양옆은 벽돌 기둥(창 윗부분이 가려지지 않게)
    const wall = new THREE.Mesh(new THREE.BoxGeometry(24, 26, 1), brickM); wall.position.set(0, 19, -0.5); wall.castShadow = wall.receiveShadow = true; s.add(wall);
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(5.2, 6, 1), brickM); p.position.set(sx * 9.4, 3, -0.5); p.receiveShadow = true; s.add(p); }
    // 2층 창(어두운 방 몇 개만 불)
    const wmat = new THREE.MeshStandardMaterial({ color: '#141824', roughness: 0.2, metalness: 0.4 });
    const wlit = new THREE.MeshBasicMaterial({ color: '#5a3c22' });
    for (const wy of [10.5, 15, 19.5, 24]) for (const x of [-7, 0, 7]) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), wmat); Rr(); gl.position.set(x, wy, 0.05); s.add(gl); }
    // ---- 가게 앞(10/24 사장님 사진: 붉은 네온 테 큰 유리창 + 유리에 그린 호랑이·청록 TATTOO + 붉은 조명 속 도안 액자·깃발 줄) ----
    const WX = 13, WY0 = 0.95, WY1 = 5.75, WH = WY1 - WY0, WC = (WY0 + WY1) / 2;
    // 안쪽 뒷벽: 붉은 조명, 벽 가득 도안 액자(세 줄), 천장 전구
    const ic = cv2(1280, 520), ig = ic.getContext('2d');
    const igr = ig.createLinearGradient(0, 0, 0, 520); igr.addColorStop(0, '#2a0a0a'); igr.addColorStop(0.18, '#8a1c18'); igr.addColorStop(0.65, '#b02a20'); igr.addColorStop(1, '#3a0c0a'); ig.fillStyle = igr; ig.fillRect(0, 0, 1280, 520);
    const fk = FLASH.KEYS;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) {
      const w = 74 + ((r * 5 + c * 3) % 3) * 10, h = w * 1.2, x = 18 + c * 105 + (r % 2) * 18 + Rr() * 8, y = 70 + r * 135 + Rr() * 10;
      ig.fillStyle = 'rgba(0,0,0,.45)'; ig.fillRect(x + 5, y + 6, w + 6, h + 6);
      ig.fillStyle = ['#1a1210', '#6a3a1a', '#c9a24a'][(r + c) % 3]; ig.fillRect(x - 3, y - 3, w + 6, h + 6);
      ig.fillStyle = '#efd9a8'; ig.fillRect(x, y, w, h);
      FLASH.draw(ig, fk[(r * 12 + c) % fk.length], x + w * 0.1, y + (h - w * 0.8) / 2, w * 0.8, { dots: false, lw: 0.05 });
      ig.fillStyle = 'rgba(200,30,20,.28)'; ig.fillRect(x, y, w, h); // 붉은 빛이 덮음
    }
    // 천장 전구 줄 + 천장 선풍기 실루엣
    for (let i = 0; i < 26; i++) { const x = 30 + i * 48, y = 26 + Math.sin(i * 0.7) * 6; const rg = ig.createRadialGradient(x, y, 0, x, y, 18); rg.addColorStop(0, 'rgba(255,240,190,1)'); rg.addColorStop(1, 'rgba(255,200,120,0)'); ig.fillStyle = rg; ig.fillRect(x - 18, y - 18, 36, 36); }
    ig.fillStyle = 'rgba(20,6,6,.9)'; ig.fillRect(630, 0, 8, 40); ig.beginPath(); ig.ellipse(634, 44, 130, 9, 0.05, 0, 7); ig.fill();
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(15, 6.1), new THREE.MeshBasicMaterial({ map: tex(ic), toneMapped: false }));
    inside.position.set(0, WC + 0.2, -2.8); s.add(inside); F.insideMat = inside.material;
    // 옆벽(안쪽 깊이)
    const sideC = cv2(256, 256), sg2 = sideC.getContext('2d'); const sgr = sg2.createLinearGradient(0, 0, 256, 0); sgr.addColorStop(0, '#5a1210'); sgr.addColorStop(1, '#2a0808'); sg2.fillStyle = sgr; sg2.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6; i++) { sg2.fillStyle = '#e8cfa0'; sg2.fillRect(20 + (i % 3) * 78, 40 + Math.floor(i / 3) * 100, 54, 66); sg2.fillStyle = 'rgba(190,30,20,.45)'; sg2.fillRect(20 + (i % 3) * 78, 40 + Math.floor(i / 3) * 100, 54, 66); }
    const sideM = new THREE.MeshBasicMaterial({ map: tex(sideC), toneMapped: false });
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 5.4), sideM); w.position.set(sx * 6.45, WC, -1.6); w.rotation.y = -sx * Math.PI / 2; s.add(w); }
    // 깃발 줄(오색 삼각 깃발이 천장에 늘어짐)
    const fc = cv2(1280, 220), fg = fc.getContext('2d'), fcol = ['#2a6ad8', '#f4f0e6', '#d8263a', '#2e9a4c', '#f2c230'];
    for (let row = 0; row < 2; row++) {
      fg.strokeStyle = '#2a1a14'; fg.lineWidth = 3; fg.beginPath(); const y0 = 30 + row * 70;
      for (let x = 0; x <= 1280; x += 20) { const y = y0 + Math.sin((x / 1280) * Math.PI * 2 + row) * 18; x ? fg.lineTo(x, y) : fg.moveTo(x, y); }
      fg.stroke();
      for (let x = 10 + row * 22; x < 1280; x += 46) { const y = y0 + Math.sin((x / 1280) * Math.PI * 2 + row) * 18; fg.fillStyle = fcol[Math.floor(x / 46 + row) % 5]; fg.beginPath(); fg.moveTo(x - 17, y); fg.lineTo(x + 17, y); fg.lineTo(x + 3, y + 44); fg.lineTo(x - 15, y + 40); fg.closePath(); fg.fill(); fg.fillStyle = 'rgba(160,20,10,.35)'; fg.fill(); }
    }
    const flags = new THREE.Mesh(new THREE.PlaneGeometry(13, 2.2), new THREE.MeshBasicMaterial({ map: tex(fc), transparent: true, toneMapped: false, depthWrite: false }));
    flags.position.set(0, WY1 - 1.0, -1.5); s.add(flags);
    // 창가에 세운 도안 판 둘(흰 종이에 도안 여럿)
    const easel = (cx, rot, keys) => {
      const c = cv2(300, 400), g = c.getContext('2d'); g.fillStyle = '#f6f0e2'; g.fillRect(0, 0, 300, 400); g.strokeStyle = '#2a1a14'; g.lineWidth = 8; g.strokeRect(4, 4, 292, 392);
      keys.forEach((k, i) => FLASH.draw(g, k, 18 + (i % 2) * 138, 20 + Math.floor(i / 2) * 124, 124, { dots: false, lw: 0.045 }));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.3), new THREE.MeshBasicMaterial({ map: tex(c), toneMapped: false, color: '#ffd8d0' }));
      m.position.set(cx, WY0 + 1.1, -1.15); m.rotation.set(-0.18, rot, rot * 0.3); s.add(m);
    };
    easel(-3.6, 0.25, ['skull', 'rose', 'dagger', 'swallow', 'heart', 'star']); easel(3.9, -0.2, ['tiger', 'moth', 'snake', 'cherry', 'anchor', 'burnheart']);
    // 유리에 그린 글씨·그림(글꼴이 들어온 뒤 frontText 에서 그림)
    F.glassC = cv2(1300, 480);
    const glassArt = new THREE.Mesh(new THREE.PlaneGeometry(WX, WH), new THREE.MeshBasicMaterial({ map: (F.glassT = tex(F.glassC)), transparent: true, toneMapped: false, depthWrite: false }));
    glassArt.position.set(0, WC, -0.24); glassArt.renderOrder = 5; s.add(glassArt); // 창틀·도안 판보다 앞(10/24 "글씨가 가려졌어 앞으로")
    // 검은 가게 틀 + 유리
    const blk = new THREE.MeshStandardMaterial({ color: '#0d0d10', roughness: 0.35, metalness: 0.2 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(WX, WH), new THREE.MeshStandardMaterial({ color: '#9ab0c8', transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0.6 }));
    glass.position.set(0, WC, -0.42); s.add(glass);
    for (const x of [-6.6, 6.6]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, WH + 0.2, 0.3), blk); m.position.set(x, WC, -0.35); s.add(m); }
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.16, WH, 0.2), blk); mid.position.set(0.1, WC, -0.38); s.add(mid);
    const top = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.3, 0.4), blk); top.position.set(0, WY1 + 0.12, -0.3); s.add(top);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(24, 1.1, 0.8), blk); fr.position.set(0, 0.4, -0.3); s.add(fr);
    // 창 테두리 붉은 네온(심은 희게, 바깥은 붉게 번짐)
    const rp = new THREE.CurvePath(), m0 = 0.22, c0 = [[-WX / 2 + m0, WY0 + m0], [WX / 2 - m0, WY0 + m0], [WX / 2 - m0, WY1 - m0], [-WX / 2 + m0, WY1 - m0], [-WX / 2 + m0, WY0 + m0]];
    for (let i = 0; i < 4; i++) rp.add(new THREE.LineCurve3(new THREE.Vector3(c0[i][0], c0[i][1], -0.55), new THREE.Vector3(c0[i + 1][0], c0[i + 1][1], -0.55)));
    const core = new THREE.Mesh(new THREE.TubeGeometry(rp, 200, 0.05, 8, false), new THREE.MeshBasicMaterial({ color: '#ffe2e2', toneMapped: false, transparent: true }));
    s.add(core); F.frameCore = core.material;
    const halo = new THREE.Mesh(new THREE.TubeGeometry(rp, 200, 0.2, 8, false), new THREE.MeshBasicMaterial({ color: '#ff1a2a', toneMapped: false, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.add(halo); F.frameHalo = halo.material;
    const redL = (F.redL = new THREE.PointLight('#ff2a2a', 0, 22, 1.4)); redL.position.set(0, 3, 2.2); s.add(redL);
    // 옆 가게용 셔터 재질(가게 본 셔터는 10/24 "셔터올리는건 빼줘"로 없음)
    const shc = cv2(512, 256), shg = shc.getContext('2d');
    for (let y = 0; y < 256; y += 12) { const gr = shg.createLinearGradient(0, y, 0, y + 12); gr.addColorStop(0, '#4a4a50'); gr.addColorStop(0.5, '#26262a'); gr.addColorStop(1, '#3d3d42'); shg.fillStyle = gr; shg.fillRect(0, y, 512, 12); }
    const sh = { material: new THREE.MeshStandardMaterial({ map: tex(shc), metalness: 0.4, roughness: 0.55 }) };
    // 네온 간판: 검은 판 위 붉은 네온 글씨 + 하늘색 네온 제비 둘
    F.neonC = cv2(2048, 512);
    const nT = (F.neonT = tex(F.neonC));
    const board = new THREE.Mesh(new THREE.BoxGeometry(15, 3.6, 0.4), blk); board.position.set(0, 7.6, 0.2); board.castShadow = true; s.add(board);
    const neon = new THREE.Mesh(new THREE.PlaneGeometry(15, 3.75), new THREE.MeshBasicMaterial({ map: nT, transparent: true, toneMapped: false, depthWrite: false }));
    neon.position.set(0, 7.6, 0.45); s.add(neon); F.neonMat = neon.material;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(22, 7), new THREE.MeshBasicMaterial({ map: nT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
    glow.position.set(0, 7.6, 0.5); s.add(glow); F.glowMat = glow.material;
    // OPEN 네온(창 오른쪽 위)
    const oc = cv2(256, 128), og = oc.getContext('2d');
    og.font = '900 78px sans-serif'; og.textAlign = 'center'; og.textBaseline = 'middle'; og.shadowColor = '#3af0ff'; og.shadowBlur = 18; og.strokeStyle = '#bff8ff'; og.lineWidth = 6; og.strokeText('OPEN', 128, 66); og.strokeText('OPEN', 128, 66);
    const open = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: tex(oc), transparent: true, toneMapped: false, depthWrite: false, opacity: 0 }));
    open.position.set(9.4, 3.3, 0.04); s.add(open); F.openMat = open.material;
    // 개업 풍선 아치는 뺐음(10/24 사장님 "풍선빼줘")
    // 바람 인형(왼쪽): 마디 이어 붙인 긴 몸, 흐느적
    const tube = (F.tube = { segs: [], arms: [] });
    const tm = new THREE.MeshStandardMaterial({ color: '#e8283a', roughness: 0.55 });
    const tg = new THREE.Group(); tg.position.set(-10.4, 0, 3.4); s.add(tg); tube.g = tg;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.9, 20), new THREE.MeshStandardMaterial({ color: '#2a2a30', roughness: 0.5 })); base.position.y = 0.45; tg.add(base);
    let parent = tg, y0 = 0.9;
    for (let k = 0; k < 9; k++) {
      const seg = new THREE.Group(); seg.position.y = k ? 1.05 : y0; parent.add(seg);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62 - k * 0.012, 0.64 - k * 0.012, 1.1, 18), tm); body.position.y = 0.55; body.castShadow = true; seg.add(body);
      tube.segs.push(seg); parent = seg;
      if (k === 6) for (const sx of [-1, 1]) { const ar = new THREE.Group(); ar.position.set(sx * 0.55, 0.6, 0); seg.add(ar); const am = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.4, 12), tm); am.position.y = 1.2; ar.add(am); ar.rotation.z = -sx * 1.2; tube.arms.push({ g: ar, sx }); }
    }
    // 얼굴: 흰 눈 + 검은 눈동자 + 웃는 입(마지막 마디 앞)
    const face = new THREE.Group(); face.position.set(0, 0.55, 0.6); parent.add(face);
    const wm = new THREE.MeshBasicMaterial({ color: '#ffffff' }), km = new THREE.MeshBasicMaterial({ color: '#111' });
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(0.17, 14), wm); e.position.set(sx * 0.2, 0.15, 0.02); face.add(e); const p = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), km); p.position.set(sx * 0.2 + 0.03, 0.13, 0.03); face.add(p); }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 6, 14, Math.PI), km); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.08, 0.02); face.add(mouth);
    tube.on = 0;
    // 문 앞 깔판
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.2), new THREE.MeshStandardMaterial({ color: '#141416', roughness: 1 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.01, 1.2); mat.receiveShadow = true; s.add(mat);
    // 옆 가게들(어두운 셔터)
    for (const x of [-21, 21]) { const bh = 26 + Rr() * 6; const b = new THREE.Mesh(new THREE.BoxGeometry(17, bh, 6), new THREE.MeshStandardMaterial({ color: x < 0 ? '#2c2a30' : '#24282e', roughness: 0.9 })); b.position.set(x, bh / 2, -2.5); b.receiveShadow = true; s.add(b); const sh2 = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.6), sh.material); sh2.position.set(x, 1.9, 0.55); s.add(sh2); }
    // 가로등 기둥
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 14, 10), new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.6, roughness: 0.4 })); lp.position.set(-14, 7, 9); s.add(lp);
    const lh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 10), new THREE.MeshBasicMaterial({ color: '#ffd9a0' })); lh.position.set(-14, 14.2, 9); s.add(lh);
  }
  // 글꼴이 들어온 뒤 네온 간판 글씨
  R.frontText = function () {
    const F = R.F, c = F.neonC, g = c.getContext('2d'), W = 2048, H = 512;
    g.clearRect(0, 0, W, H);
    const word = L('타투샵', 'TATTOO');
    const tube = (draw, col, glow) => { for (const [blur, a, lw] of [[40, 0.55, 26], [16, 0.9, 16], [0, 1, 7]]) { g.save(); g.shadowColor = glow; g.shadowBlur = blur; g.globalAlpha = a; g.strokeStyle = lw === 7 ? '#fff4f4' : col; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; draw(); g.restore(); } };
    let px = 300; g.font = `${px}px Ttl, serif`; while (g.measureText(word).width > 1250 && px > 80) { px -= 10; g.font = `${px}px Ttl, serif`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    tube(() => g.strokeText(word, W / 2, H / 2 + 10), '#ff3a4a', '#ff2030');
    // 양옆 제비 네온(하늘색)
    const bird = (cx, sx) => () => { g.beginPath(); const p = FLASH.get('swallow')._p; p.forEach((sh) => sh.subs.forEach((sp) => { sp.pts.forEach((q, k) => { const x = cx + (q[0] - 50) * 2.2 * sx, y = H / 2 + (q[1] - 50) * 2.2; k ? g.lineTo(x, y) : g.moveTo(x, y); }); if (sp.closed) g.closePath(); })); g.stroke(); };
    tube(bird(220, -1), '#3ad0ff', '#20a8ff'); tube(bird(W - 220, 1), '#3ad0ff', '#20a8ff');
    F.neonT.needsUpdate = true;
    // 유리 그림(사장님 사진처럼): 위에 활짝 편 올드스쿨 날개(10/24 "간판은 호랑이 말고 날개로"), 그 아래 걸쳐서 검은 그림자 진 청록 TATTOO, 금색 & PIERCING
    const gc = F.glassC, gg = gc.getContext('2d'), GW = gc.width, GH = gc.height;
    gg.clearRect(0, 0, GW, GH);
    // 날개: 뿌리는 가운데, 윗선은 바깥 위로 휘고, 깃털은 아래 바깥으로 늘어짐. 뒷줄 긴 깃(노랑) → 가운데 줄(주황) → 앞 덮깃(크림, 점 그늘)
    const wing = (dir) => {
      const rx = GW / 2 + dir * 14, ry = 236;
      const edge = (t) => [rx - dir * 460 * t, ry - 165 * Math.sin(t * Math.PI * 0.62) - 15 * t];
      const rows = [{ n: 12, col: '#f0bf2e', len: [95, 215], w: 58 }, { n: 10, col: '#e0702a', len: [72, 140], w: 54 }, { n: 9, col: '#f6ead0', len: [48, 82], w: 50 }];
      rows.forEach((r, k) => {
        for (let i = r.n - 1; i >= 0; i--) {
          const t = (i + 0.7) / (r.n + 0.2) * (1 - k * 0.18), [bx, by] = edge(t);
          const ang = Math.PI / 2 + dir * (0.25 + t * 0.85), L = r.len[0] + (r.len[1] - r.len[0]) * t, W = r.w * (1 - t * 0.25);
          const ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
          const tx = bx + ux * L, ty2 = by + uy * L;
          gg.beginPath(); gg.moveTo(bx + px * W / 2, by + py * W / 2);
          gg.quadraticCurveTo(bx + px * W * 0.62 + ux * L * 0.6, by + py * W * 0.62 + uy * L * 0.6, tx + px * W * 0.08, ty2 + py * W * 0.08);
          gg.quadraticCurveTo(tx + ux * 10, ty2 + uy * 10, tx - px * W * 0.08, ty2 - py * W * 0.08);
          gg.quadraticCurveTo(bx - px * W * 0.62 + ux * L * 0.6, by - py * W * 0.62 + uy * L * 0.6, bx - px * W / 2, by - py * W / 2);
          gg.closePath(); gg.fillStyle = r.col; gg.fill(); gg.lineWidth = 6; gg.strokeStyle = '#141216'; gg.lineJoin = 'round'; gg.stroke();
          // 깃대(긴 깃만) + 그늘 점
          if (k < 2) { gg.lineWidth = 3; gg.beginPath(); gg.moveTo(bx + ux * 8, by + uy * 8); gg.lineTo(bx + ux * L * 0.78, by + uy * L * 0.78); gg.stroke(); }
          gg.fillStyle = 'rgba(20,18,22,.55)'; for (let q = 0; q < 10; q++) { const f = 0.45 + Math.random() * 0.5, side = (Math.random() - 0.5) * W * 0.5; gg.beginPath(); gg.arc(bx + ux * L * f + px * side, by + uy * L * f + py * side, 1.8, 0, 7); gg.fill(); }
        }
      });
      // 윗선(날개 뼈대): 굵은 크림 띠 + 검은 테
      gg.beginPath(); for (let i = 0; i <= 30; i++) { const [x, y] = edge(i / 30); i ? gg.lineTo(x, y) : gg.moveTo(x, y); }
      gg.lineCap = 'round'; gg.lineWidth = 26; gg.strokeStyle = '#141216'; gg.stroke(); gg.lineWidth = 15; gg.strokeStyle = '#f6ead0'; gg.stroke();
      gg.lineWidth = 4; gg.strokeStyle = 'rgba(255,255,255,.7)'; gg.beginPath(); for (let i = 2; i <= 18; i++) { const [x, y] = edge(i / 30); i > 2 ? gg.lineTo(x, y - 3) : gg.moveTo(x, y - 3); } gg.stroke();
    };
    wing(1); wing(-1);
    // TATTOO: 검은 덩어리 그림자(오른쪽 아래로 여러 겹) → 검은 테 → 청록 → 위쪽 밝은 띠
    const gw = 'TATTOO'; let tp = 190; gg.font = tp + 'px Ttl, serif'; while (gg.measureText(gw).width > 1060 && tp > 60) { tp -= 6; gg.font = tp + 'px Ttl, serif'; }
    gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.lineJoin = 'round';
    const ty = 352;
    for (let i = 18; i > 0; i -= 2) { gg.fillStyle = '#0c0b0e'; gg.fillText(gw, GW / 2 + i, ty + i); gg.lineWidth = 16; gg.strokeStyle = '#0c0b0e'; gg.strokeText(gw, GW / 2 + i, ty + i); }
    gg.lineWidth = 16; gg.strokeStyle = '#0c0b0e'; gg.strokeText(gw, GW / 2, ty);
    const tg = gg.createLinearGradient(0, ty - tp / 2, 0, ty + tp / 2); tg.addColorStop(0, '#5fe0d2'); tg.addColorStop(0.5, '#1fa89c'); tg.addColorStop(1, '#127a72'); gg.fillStyle = tg; gg.fillText(gw, GW / 2, ty);
    gg.save(); gg.beginPath(); gg.rect(0, ty - tp / 2, GW, tp * 0.22); gg.clip(); gg.fillStyle = 'rgba(220,255,250,.45)'; gg.fillText(gw, GW / 2, ty); gg.restore();
    // 금색 & PIERCING
    gg.font = '58px Ttl, serif'; gg.textAlign = 'center'; gg.lineWidth = 8; gg.strokeStyle = '#2a1806'; gg.strokeText('& PIERCING', GW / 2, 452); gg.fillStyle = '#f0c24a'; gg.fillText('& PIERCING', GW / 2, 452);
    F.glassT.needsUpdate = true;
  };
  // 오프닝 진행(t 초)
  R.frontAt = function (t, dt) {
    const F = R.F;
    // 셔터는 처음부터 올라가 있음(사장님 10/24 "셔터올리는건 빼줘"): 가게 불은 켜져 있고 네온부터 켜짐
    F.shopL.intensity = 30;
    // 네온: 지직 깜빡이다 켜짐
    let on = 0; if (t > 2.9) { const k = t - 2.9; on = k < 0.6 ? (Math.sin(k * 55) > 0.1 ? 1 : 0.08) : 1; }
    F.neonMat.opacity = 0.18 + on * 0.82; F.glowMat.opacity = 0; F.neonL.intensity = on * 60; F.openMat.opacity = t > 3.5 ? 1 : 0;
    // 창 테두리 네온은 처음부터 켜져 있고 살짝 일렁임
    const fl = 0.9 + Math.sin(t * 13) * 0.05 + Math.sin(t * 31) * 0.03; F.frameCore.opacity = fl; F.frameHalo.opacity = 0.38 * fl; F.redL.intensity = 26 * fl;
    // 바람 인형: 3.5초부터 부풀어 흐느적
    const tb = F.tube; tb.on = Math.min(1, Math.max(0, (t - 3.3) / 0.6));
    R.tubeDance(t, tb.on);
    // 카메라: 길 건너에서 문으로
    const c = R.camera, k = Math.min(1, Math.max(0, (t - 4.2) / 1.4)), kk = k * k, d = R.frontDist();
    c.position.set(Math.sin(t * 0.3) * 0.6 * (1 - kk), 3.6 + (d - 18) * 0.05 * (1 - kk) - kk * 1.2, d - kk * (d - 3.8));
    c.lookAt(0, 4.2 + (d - 18) * 0.02 * (1 - kk) - kk * 1.8, 0);
  };
  R.tubeDance = function (t, on) {
    const tb = R.F.tube;
    tb.segs.forEach((sg, k) => { const w = Math.sin(t * 4.2 - k * 0.7) * 0.22 + Math.sin(t * 7.3 - k * 1.3) * 0.08; sg.rotation.z = on * w + (1 - on) * (k ? 0.5 : 0.1); sg.rotation.x = on * Math.sin(t * 3.1 - k * 0.5) * 0.08; sg.scale.set(1, on * 0.92 + 0.08, 1); });
    tb.arms.forEach((a) => (a.g.rotation.z = -a.sx * (0.6 + on * (0.5 + Math.sin(t * 6 + a.sx) * 0.7))));
  };
  // 화면 폭에 맞춰 가게 앞이 다 들어오는 거리
  R.frontDist = function () { const a = R.camera.aspect; return Math.max(19, 11.5 / (Math.tan((17 * Math.PI) / 180) * a)); };
  R.frontIdle = function (t) {
    const c = R.camera, d = R.frontDist(); c.position.set(Math.sin(t * 0.25) * 0.8, 3.6 + (d - 18) * 0.05, d); c.lookAt(0, 4.2 + (d - 18) * 0.02, 0);
    R.tubeDance(t, R.F.tube.on);
  };
})();
