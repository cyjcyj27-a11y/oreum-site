// 그리기 바탕: 렌더러, 가게 안(머리 클로즈업 무대), 가게 앞(개업 오프닝)
(function () {
  const R = (window.RND = {});
  const cv2 = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  R.init = function (canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    R.renderer = r;
    R.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 600);
    buildSalon(); buildFront();
    R.scene = R.salon;
    R.resize(); window.addEventListener('resize', R.resize);
    return R;
  };
  R.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.renderer.setSize(w, h, false);
    R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
    if (window.HEAD && HEAD.hairMat) HEAD.hairMat.uniforms.uRes.value.set(w * R.renderer.getPixelRatio(), h * R.renderer.getPixelRatio());
  };
  R.render = function () { R.renderer.render(R.scene, R.camera); };
  R.shot = function (name) {
    R.render();
    const d = R.renderer.domElement.toDataURL('image/png');
    return fetch('/save?name=' + encodeURIComponent(name || 'shot.png'), { method: 'POST', body: d }).then((x) => x.text());
  };

  // ================= 가게 안: 손님 머리 =================
  function buildSalon() {
    const s = (R.salon = new THREE.Scene());
    // 뒤 배경: 흐릿한 가게 안(거울 조명 망울·선반·나무 벽)
    const c = cv2(1024, 512), g = c.getContext('2d'), Rr = rng(7);
    const bg = g.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, '#5b4334'); bg.addColorStop(0.45, '#8a6a52'); bg.addColorStop(0.62, '#a98a6c'); bg.addColorStop(1, '#3a2a20');
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,25,15,.18)'; g.fillRect(i * 26 + Rr() * 6, 0, 3, 512); } // 나무 벽 줄
    g.filter = 'blur(18px)';
    for (let i = 0; i < 6; i++) { const x = 80 + i * 170; g.fillStyle = 'rgba(240,235,225,.35)'; g.fillRect(x, 150, 110, 150); g.fillStyle = 'rgba(255,230,180,.8)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + 15 + k * 27, 140, 9, 0, 7); g.fill(); } }
    for (let i = 0; i < 70; i++) { g.fillStyle = ['rgba(200,80,70,.5)', 'rgba(80,140,190,.5)', 'rgba(240,220,170,.5)', 'rgba(90,160,110,.45)'][i % 4]; g.fillRect(Rr() * 1024, 330 + Rr() * 40, 10 + Rr() * 18, 22 + Rr() * 20); }
    g.filter = 'none';
    const bgT = tex(c);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: bgT, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false }));
    s.add(sky); R.salonSky = sky;
    // 빛: 천장 형광등(위) + 거울 쪽 따뜻한 채움 + 반구광
    R.hemi = new THREE.HemisphereLight('#fff6e8', '#6a4a38', 1.05); s.add(R.hemi);
    const key = (R.key = new THREE.DirectionalLight('#fff7ea', 2.2));
    key.position.set(-14, 40, 18); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 5; sc.far = 120;
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.05; key.shadow.radius = 5;
    s.add(key); s.add(key.target);
    const fill = new THREE.DirectionalLight('#ffd9b0', 0.55); fill.position.set(20, 6, 26); s.add(fill);
    const rim = new THREE.DirectionalLight('#cfe0ff', 0.4); rim.position.set(6, 10, -30); s.add(rim);
    // 목
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(4.3, 5.0, 12, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#d9a283', roughness: 0.65 }));
    neck.position.set(0, -12.5, -1.4); neck.castShadow = neck.receiveShadow = true; s.add(neck); R.neck = neck;
    // 이발 가운(흰 바탕에 가는 하늘 줄, 주름)
    const cc = cv2(512, 256), cg = cc.getContext('2d');
    cg.fillStyle = '#f2f0ea'; cg.fillRect(0, 0, 512, 256);
    for (let x = 0; x < 512; x += 16) { cg.fillStyle = 'rgba(90,140,190,.35)'; cg.fillRect(x, 0, 3, 256); }
    for (let i = 0; i < 900; i++) { cg.fillStyle = 'rgba(0,0,0,.03)'; cg.fillRect(Math.random() * 512, Math.random() * 256, 2, 2); }
    const capeT = tex(cc); capeT.wrapS = capeT.wrapT = THREE.RepeatWrapping; capeT.repeat.set(4, 1);
    const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new THREE.Vector2(4.6 + t * t * 38 + t * 10, -14.5 - t * 34 + Math.sin(t * 3) * 1.5)); }
    const lg = new THREE.LatheGeometry(pts, 96); const la = lg.attributes.position;
    for (let i = 0; i < la.count; i++) { const x = la.getX(i), z = la.getZ(i), y = la.getY(i); const a = Math.atan2(z, x), r = Math.hypot(x, z); const f = 1 + Math.sin(a * 14 + y * 0.2) * 0.035 * Math.min(1, (r - 4.6) / 12); la.setX(i, x * f); la.setZ(i, z * f); }
    lg.computeVertexNormals();
    const cape = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ map: capeT, roughness: 0.85, side: THREE.DoubleSide }));
    cape.position.set(0, 0, -1.4); cape.receiveShadow = true; s.add(cape);
    // 목 둘레 수건
    const tw = new THREE.Mesh(new THREE.TorusGeometry(5.1, 1.1, 14, 48), new THREE.MeshStandardMaterial({ color: '#f6f3ec', roughness: 0.95 }));
    tw.rotation.x = Math.PI / 2; tw.position.set(0, -14.6, -1.4); tw.castShadow = true; tw.receiveShadow = true; s.add(tw);
    R.salonLight = function (expo) { R.renderer.toneMappingExposure = expo; key.intensity = 2.2 * expo; };
  }

  // ================= 가게 앞: 개업 =================
  function buildFront() {
    const s = (R.front = new THREE.Scene());
    const F = (R.F = {});
    // 하늘
    const sk = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#7fb2e0') }, mid: { value: new THREE.Color('#ffe7c6') } },
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; varying vec3 vp; void main(){ float h = normalize(vp).y; vec3 c = mix(mid, top, pow(clamp(h*1.8,0.0,1.0),0.7)); gl_FragColor = vec4(c,1.0); }',
    }));
    s.add(sk);
    s.fog = new THREE.Fog('#f6e2c6', 90, 320);
    s.add(new THREE.HemisphereLight('#fff2dc', '#8a7460', 1.0));
    const sun = (F.sun = new THREE.DirectionalLight('#ffe6c0', 2.3)); sun.position.set(-18, 26, 22); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 18; sc.bottom = -6; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.04;
    s.add(sun);
    const fl = new THREE.DirectionalLight('#c8dcff', 0.35); fl.position.set(15, 8, 10); s.add(fl);
    const Rr = rng(31);
    // 낡은 보도: 시멘트 판, 금·얼룩·껌 자국
    const pc = cv2(512, 512), pg = pc.getContext('2d');
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const v = 150 + Rr() * 22; pg.fillStyle = `rgb(${v + 12},${v + 6},${v - 6})`; pg.fillRect(x * 128 + 2, y * 128 + 2, 124, 124); }
    pg.fillStyle = 'rgba(70,60,50,.35)'; for (let i = 0; i <= 4; i++) { pg.fillRect(0, i * 128 - 1.5, 512, 3); pg.fillRect(i * 128 - 1.5, 0, 3, 512); }
    for (let i = 0; i < 5000; i++) { pg.fillStyle = Rr() < 0.5 ? 'rgba(60,50,40,.12)' : 'rgba(255,250,235,.1)'; pg.fillRect(Rr() * 512, Rr() * 512, 2, 2); }
    for (let i = 0; i < 26; i++) { const x = Rr() * 512, y = Rr() * 512, r = 8 + Rr() * 40; const sg = pg.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, 'rgba(50,40,30,.22)'); sg.addColorStop(1, 'rgba(50,40,30,0)'); pg.fillStyle = sg; pg.fillRect(x - r, y - r, r * 2, r * 2); }
    pg.strokeStyle = 'rgba(30,24,18,.5)'; pg.lineWidth = 1.2; for (let i = 0; i < 9; i++) { let x = Rr() * 512, y = Rr() * 512; pg.beginPath(); pg.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (Rr() - 0.5) * 30; y += 6 + Rr() * 14; pg.lineTo(x, y); } pg.stroke(); }
    for (let i = 0; i < 18; i++) { pg.fillStyle = 'rgba(70,64,58,.55)'; pg.beginPath(); pg.ellipse(Rr() * 512, Rr() * 512, 3 + Rr() * 3, 2 + Rr() * 2, Rr() * 3, 0, 7); pg.fill(); }
    const pT = tex(pc); pT.wrapS = pT.wrapT = THREE.RepeatWrapping; pT.repeat.set(15, 12.5);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 100), new THREE.MeshStandardMaterial({ map: pT, roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2; ground.position.z = 42; ground.receiveShadow = true; s.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshStandardMaterial({ color: '#4a4846', roughness: 0.95 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, -0.15, 122); s.add(road);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(80, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: '#c9c4bc' })); curb.position.set(0, 0, 91.8); s.add(curb);
    // 건물: 2층 붉은 벽돌 + 1층 가게
    // 오래된 붉은 벽돌: 짙은 줄눈, 탄 벽돌 섞임, 빗물 자국·백화
    const bc = cv2(512, 512), bg = bc.getContext('2d');
    bg.fillStyle = '#5e4c40'; bg.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 32; y++) for (let x = -1; x < 9; x++) {
      const v = Rr(), burnt = Rr() < 0.12;
      bg.fillStyle = burnt ? `rgb(${92 + v * 25},${48 + v * 12},${40 + v * 10})` : `rgb(${132 + v * 34},${62 + v * 20},${48 + v * 16})`;
      bg.fillRect(x * 64 + (y % 2) * 32 + 2, y * 16 + 2, 60, 12);
      for (let k = 0; k < 10; k++) { bg.fillStyle = Rr() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,220,190,.08)'; bg.fillRect(x * 64 + (y % 2) * 32 + 2 + Rr() * 58, y * 16 + 2 + Rr() * 10, 2 + Rr() * 4, 1.5); }
    }
    for (let i = 0; i < 22; i++) { const x = Rr() * 512, w = 6 + Rr() * 18, l = 60 + Rr() * 300, y0 = Rr() * 200; const gr = bg.createLinearGradient(0, y0, 0, y0 + l); gr.addColorStop(0, 'rgba(25,18,14,.28)'); gr.addColorStop(1, 'rgba(25,18,14,0)'); bg.fillStyle = gr; bg.fillRect(x, y0, w, l); }
    for (let i = 0; i < 10; i++) { const x = Rr() * 512, y = 380 + Rr() * 132, r = 14 + Rr() * 30; const wg2 = bg.createRadialGradient(x, y, 0, x, y, r); wg2.addColorStop(0, 'rgba(235,228,212,.22)'); wg2.addColorStop(1, 'rgba(235,228,212,0)'); bg.fillStyle = wg2; bg.fillRect(x - r, y - r, r * 2, r * 2); }
    const bT = tex(bc); bT.wrapS = bT.wrapT = THREE.RepeatWrapping; bT.repeat.set(4, 2);
    const brick = new THREE.MeshStandardMaterial({ map: bT, roughness: 0.95 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(22, 27, 1), brick); wall.position.set(0, 17.5, -0.5); wall.castShadow = wall.receiveShadow = true; s.add(wall);
    // 1층 양옆 기둥: 옛날 이발소 하늘색 잔 타일(줄눈 때, 아래쪽 흙때)
    const tc = cv2(256, 256), tg = tc.getContext('2d');
    tg.fillStyle = '#8f9c98'; tg.fillRect(0, 0, 256, 256);
    const tcol = ['#a9d2d0', '#c7e3df', '#e9efe8', '#8cbcc0', '#b8d9d4', '#d9e8e2'];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { tg.fillStyle = tcol[Math.floor(Rr() * tcol.length)]; tg.fillRect(x * 16 + 1.5, y * 16 + 1.5, 13, 13); tg.fillStyle = 'rgba(255,255,255,.35)'; tg.fillRect(x * 16 + 2.5, y * 16 + 2.5, 6, 2); }
    for (let i = 0; i < 30; i++) { tg.fillStyle = 'rgba(70,60,50,.25)'; tg.fillRect(Math.floor(Rr() * 16) * 16 + 1.5, Math.floor(Rr() * 16) * 16 + 1.5, 13, 13); }
    const tgr = tg.createLinearGradient(0, 150, 0, 256); tgr.addColorStop(0, 'rgba(60,45,30,0)'); tgr.addColorStop(1, 'rgba(60,45,30,.4)'); tg.fillStyle = tgr; tg.fillRect(0, 150, 256, 106);
    const tT = tex(tc); tT.wrapS = tT.wrapT = THREE.RepeatWrapping; tT.repeat.set(1.4, 1);
    const tileM = new THREE.MeshStandardMaterial({ map: tT, roughness: 0.35, metalness: 0.05 });
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4, 1), tileM); sideL.position.set(-8.25, 2, -0.5); sideL.receiveShadow = true; s.add(sideL);
    // 기둥 위 띠: 짙은 남색 페인트 몰딩
    const mold = new THREE.Mesh(new THREE.BoxGeometry(22.2, 0.35, 1.15), new THREE.MeshStandardMaterial({ color: '#2c3f5e', roughness: 0.8 })); mold.position.set(0, 4.1, -0.45); s.add(mold);
    const sideR = sideL.clone(); sideR.position.x = 8.25; s.add(sideR);
    // 2층 창문
    const wmat = new THREE.MeshStandardMaterial({ color: '#9fc0d8', roughness: 0.15, metalness: 0.3 });
    const fmat = new THREE.MeshStandardMaterial({ color: '#efe8dc', roughness: 0.6 });
    for (const wy of [9.2, 13.6, 18.0, 22.4, 26.8]) for (const x of [-6, 0, 6]) { const f = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.6, 0.3), fmat); f.position.set(x, wy, 0.05); s.add(f); const gl = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.1), wmat); gl.position.set(x, wy, 0.22); s.add(gl); const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.1, 0.1), fmat); bar.position.set(x, wy, 0.25); s.add(bar); }
    // 가게 안(유리 너머): 따뜻한 불빛, 이발 의자·거울
    const ic = cv2(1024, 384), ig = ic.getContext('2d');
    // 벽: 위 크림 → 아래 나무 판벽
    const igr = ig.createLinearGradient(0, 0, 0, 384); igr.addColorStop(0, '#fff3dc'); igr.addColorStop(0.62, '#f0d8b4'); igr.addColorStop(0.63, '#9a6a44'); igr.addColorStop(1, '#6a4428'); ig.fillStyle = igr; ig.fillRect(0, 0, 1024, 384);
    for (let x = 0; x < 1024; x += 22) { ig.fillStyle = 'rgba(40,20,10,.25)'; ig.fillRect(x, 240, 2, 144); }
    // 바닥: 흑백 바둑판(멀어지는 원근)
    for (let r = 0; r < 4; r++) { const y0 = 330 + r * 14, hh = 14; for (let c = -2; c < 40; c++) { if ((r + c) % 2) continue; ig.fillStyle = 'rgba(30,30,30,.55)'; const w0 = 34 + r * 6; ig.fillRect(c * w0 - r * 9, y0, w0, hh); } }
    for (const x of [180, 512, 844]) {
      // 거울: 크롬 테 + 위 전구 줄 + 사선 반사
      const mg = ig.createLinearGradient(x - 90, 50, x + 90, 200); mg.addColorStop(0, '#dfe9ee'); mg.addColorStop(1, '#a9bec9'); ig.fillStyle = mg; ig.fillRect(x - 90, 50, 180, 150);
      ig.strokeStyle = '#cfd6dc'; ig.lineWidth = 10; ig.strokeRect(x - 90, 50, 180, 150); ig.strokeStyle = '#7c858e'; ig.lineWidth = 2; ig.strokeRect(x - 95, 45, 190, 160);
      ig.fillStyle = 'rgba(255,255,255,.55)'; ig.beginPath(); ig.moveTo(x - 70, 56); ig.lineTo(x - 36, 56); ig.lineTo(x - 82, 190); ig.lineTo(x - 84, 130); ig.fill();
      for (let k = 0; k < 5; k++) { const bx = x - 72 + k * 36; const rg = ig.createRadialGradient(bx, 36, 0, bx, 36, 18); rg.addColorStop(0, 'rgba(255,250,220,1)'); rg.addColorStop(1, 'rgba(255,220,150,0)'); ig.fillStyle = rg; ig.fillRect(bx - 18, 18, 36, 36); }
      // 이발 의자: 빨간 가죽 등받이·좌석 + 크롬 기둥, 왼쪽 빛·오른쪽 그늘
      const cg = ig.createLinearGradient(x - 55, 0, x + 55, 0); cg.addColorStop(0, '#c4473e'); cg.addColorStop(0.6, '#9a2c28'); cg.addColorStop(1, '#6a1a18');
      ig.fillStyle = cg; ig.beginPath(); ig.roundRect ? ig.roundRect(x - 46, 150, 92, 78, 16) : ig.rect(x - 46, 150, 92, 78); ig.fill();
      ig.beginPath(); ig.roundRect ? ig.roundRect(x - 62, 222, 124, 34, 10) : ig.rect(x - 62, 222, 124, 34); ig.fill();
      ig.fillStyle = 'rgba(255,255,255,.25)'; ig.fillRect(x - 38, 158, 10, 60);
      const pg2 = ig.createLinearGradient(x - 9, 0, x + 9, 0); pg2.addColorStop(0, '#f2f4f6'); pg2.addColorStop(1, '#7c858e'); ig.fillStyle = pg2; ig.fillRect(x - 9, 256, 18, 66);
      ig.fillStyle = '#8d949c'; ig.beginPath(); ig.ellipse(x, 326, 52, 9, 0, 0, 7); ig.fill();
      ig.fillStyle = 'rgba(0,0,0,.25)'; ig.beginPath(); ig.ellipse(x + 8, 334, 60, 8, 0, 0, 7); ig.fill();
    }
    // 따뜻한 빛 번짐
    const wg = ig.createRadialGradient(512, 60, 20, 512, 60, 520); wg.addColorStop(0, 'rgba(255,230,170,.35)'); wg.addColorStop(1, 'rgba(255,230,170,0)'); ig.fillStyle = wg; ig.fillRect(0, 0, 1024, 384);
    const inT = tex(ic);
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(11, 4), new THREE.MeshBasicMaterial({ map: inT, toneMapped: false }));
    inside.position.set(0, 2, -0.9); s.add(inside);
    F.insideMat = inside.material;
    // 유리문 틀
    const alu = new THREE.MeshStandardMaterial({ color: '#c8cdd2', metalness: 0.7, roughness: 0.35 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(11, 4), new THREE.MeshStandardMaterial({ color: '#cfe6f0', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.5 }));
    glass.position.set(0, 2, -0.45); s.add(glass);
    for (const x of [-5.5, -1.6, 1.6, 5.5]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4, 0.2), alu); m.position.set(x, 2, -0.4); s.add(m); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.18, 0.2), alu); top.position.set(0, 3.95, -0.4); s.add(top);
    const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), alu); hnd.position.set(1.3, 1.9, -0.25); s.add(hnd);
    const hnd2 = hnd.clone(); hnd2.position.x = -1.3; s.add(hnd2);
    // 문 위 종
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d8b04a', metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }));
    bell.position.set(0, 3.7, -0.2); s.add(bell); F.bell = bell;
    // 셔터: 골진 철판, 위 셔터통으로 말려 올라감
    // 셔터: 바랜 회색 골진 철판에 녹 번짐·긁힘·아래 흙때
    const shc = cv2(1024, 512), shg = shc.getContext('2d');
    for (let y = 0; y < 512; y += 16) { const gr = shg.createLinearGradient(0, y, 0, y + 16); gr.addColorStop(0, '#c9c8c2'); gr.addColorStop(0.45, '#9c9c96'); gr.addColorStop(0.55, '#7f807b'); gr.addColorStop(1, '#b5b4ad'); shg.fillStyle = gr; shg.fillRect(0, y, 1024, 16); }
    // 녹: 골 접힌 줄을 따라 가로로 번진 갈색 얼룩(핏방울처럼 둥근 점 금지), 흘러내림은 몇 줄만 옅게
    for (let i = 0; i < 26; i++) {
      const y = Math.floor(Rr() * 32) * 16 + 9, x = Rr() * 1024, w = 40 + Rr() * 180;
      const rg2 = shg.createLinearGradient(x, 0, x + w, 0); rg2.addColorStop(0, 'rgba(120,78,40,0)'); rg2.addColorStop(0.5, 'rgba(120,78,40,.32)'); rg2.addColorStop(1, 'rgba(120,78,40,0)');
      shg.fillStyle = rg2; shg.fillRect(x, y - 2, w, 5 + Rr() * 4);
    }
    for (let i = 0; i < 9; i++) { const x = Rr() * 1024, y = Rr() * 300, l = 60 + Rr() * 180, w = 6 + Rr() * 14; const dr = shg.createLinearGradient(0, y, 0, y + l); dr.addColorStop(0, 'rgba(110,74,40,.22)'); dr.addColorStop(1, 'rgba(110,74,40,0)'); shg.fillStyle = dr; shg.fillRect(x - w / 2, y, w, l); }
    for (let i = 0; i < 1800; i++) { shg.fillStyle = Rr() < 0.5 ? 'rgba(60,50,40,.1)' : 'rgba(240,236,224,.1)'; shg.fillRect(Rr() * 1024, Rr() * 512, 2, 1.5); }
    shg.strokeStyle = 'rgba(235,232,222,.25)'; shg.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = Rr() * 1024, y = Rr() * 512; shg.beginPath(); shg.moveTo(x, y); shg.lineTo(x + (Rr() - 0.5) * 60, y + (Rr() - 0.5) * 8); shg.stroke(); }
    const sgr = shg.createLinearGradient(0, 380, 0, 512); sgr.addColorStop(0, 'rgba(70,52,34,0)'); sgr.addColorStop(1, 'rgba(70,52,34,.5)'); shg.fillStyle = sgr; shg.fillRect(0, 380, 1024, 132);
    const shT = tex(shc); shT.wrapS = shT.wrapT = THREE.RepeatWrapping; shT.repeat.set(1, 1);
    const shMat = new THREE.MeshStandardMaterial({ map: shT, metalness: 0.35, roughness: 0.7 });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(11, 4), shMat); sh.position.set(0, 2, 0.12); sh.castShadow = true; s.add(sh); F.shutter = sh; F.shT = shT;
    const shBot = new THREE.Mesh(new THREE.BoxGeometry(11, 0.12, 0.16), alu); s.add(shBot); F.shBot = shBot;
    const box = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.55, 0.55), new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.6, roughness: 0.4 }));
    box.position.set(0, 4.25, 0.2); box.castShadow = true; s.add(box);
    // 간판: 흰 아크릴 상자에 빨간 글씨 (불 켜지면 빛남)
    const sgc = cv2(2048, 320); F.signC = sgc;
    const sgT = (F.signT = tex(sgc));
    const signMat = (F.signMat = new THREE.MeshStandardMaterial({ map: sgT, emissiveMap: sgT, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: 0.3 }));
    const side = new THREE.MeshStandardMaterial({ color: '#8e8f8a', roughness: 0.6, metalness: 0.3 }); // 간판 틀: 회색 쇠
    const sign = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 0.6), [side, side, side, side, signMat, side]);
    sign.position.set(0, 5.6, 0.5); sign.castShadow = true; s.add(sign);
    // 간판 위 거위목 간판등 셋: 초록 법랑 갓(안은 흰색), 불 켜지면 전구가 노랗게
    F.bulbs = [];
    const shadeM = new THREE.MeshStandardMaterial({ color: '#2f5a3e', roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide });
    const neckM = new THREE.MeshStandardMaterial({ color: '#3a3a36', roughness: 0.6, metalness: 0.4 });
    for (const lx of [-4.6, 0, 4.6]) {
      // 벽에서 비스듬히 올라와 갓을 받치는 쇠 팔 + 벽 받침
      const a0 = new THREE.Vector3(lx, 6.75, 0.02), a1 = new THREE.Vector3(lx, 7.42, 0.72), al = a0.distanceTo(a1);
      const armM = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, al, 8), neckM); armM.position.copy(a0).add(a1).multiplyScalar(0.5);
      armM.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a1.clone().sub(a0).normalize()); s.add(armM);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.06), neckM); plate.position.set(lx, 6.75, 0.03); s.add(plate);
      const sh3 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.36, 20, 1, true), shadeM); sh3.position.set(lx, 7.25, 0.8); sh3.rotation.x = 0.55; sh3.castShadow = true; s.add(sh3);
      const bm = new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: new THREE.Color('#ffcc66'), emissiveIntensity: 0 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), bm); bulb.position.set(lx, 7.12, 0.88); s.add(bulb); F.bulbs.push(bm);
    }
    // 이발소 사인볼(돌아가는 빨강·파랑·흰 줄)
    const pcv = cv2(256, 512), pgx = pcv.getContext('2d');
    pgx.fillStyle = '#eee3c8'; pgx.fillRect(0, 0, 256, 512); // 누렇게 바랜 흰 바탕
    pgx.save(); pgx.transform(1, -0.6, 0, 1, 0, 0);
    for (let y = -400; y < 1100; y += 128) { pgx.fillStyle = '#b8352c'; pgx.fillRect(0, y, 256, 40); pgx.fillStyle = '#2f4f86'; pgx.fillRect(0, y + 64, 256, 40); }
    pgx.restore();
    const poleT = (F.poleT = tex(pcv)); poleT.wrapS = poleT.wrapT = THREE.RepeatWrapping; poleT.repeat.set(1, 2);
    const poleM = (F.poleM = new THREE.MeshStandardMaterial({ map: poleT, emissiveMap: poleT, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0, roughness: 0.2 }));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.8, 32), poleM); pole.position.set(6.9, 2.3, 0.7); s.add(pole);
    const pglass = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.8, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.18, roughness: 0.05 })); pglass.position.copy(pole.position); s.add(pglass);
    for (const dy of [-1.0, 1.0]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 12, 0, Math.PI * 2, dy > 0 ? 0 : Math.PI / 2, Math.PI / 2), alu); cap.position.set(6.9, 2.3 + dy * 0.92, 0.7); s.add(cap); }
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.8), alu); arm.position.set(6.9, 2.3, 0.25); s.add(arm);
    // 개업 축하 화환 둘(사장님이 보내 준 사진 오른쪽처럼): 키 큰 타원 기둥에 빨강·주황·노랑·분홍 꽃을 빽빽이,
    // 분홍 백합 몇 송이, 양옆 뒤로 초록 부채 잎 셋씩, 맨 위 분홍 리본 매듭, 위에서 양옆으로 비스듬히 늘어진 분홍 리본(검은 글씨)
    F.wreaths = [];
    const flowerG = new THREE.SphereGeometry(0.1, 8, 6); flowerG.scale(1, 1, 0.6);
    const flowerM = new THREE.MeshStandardMaterial({ roughness: 0.7 });
    // 백합: 꽃잎 여섯 장 별
    const lily = new THREE.Shape(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + Math.PI / 2, r = k % 2 ? 0.07 : 0.24; k ? lily.lineTo(Math.cos(a) * r, Math.sin(a) * r) : lily.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const lilyG = new THREE.ShapeGeometry(lily); const lilyM = new THREE.MeshStandardMaterial({ color: '#ff8fbc', roughness: 0.6, side: THREE.DoubleSide });
    const lilyC = new THREE.MeshStandardMaterial({ color: '#c8285a', roughness: 0.6 });
    // 부채 잎: 반원에 방사 주름
    const fc = cv2(256, 256), fx = fc.getContext('2d'); fx.fillStyle = '#2f5a34'; fx.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2; fx.strokeStyle = k % 2 ? 'rgba(160,210,150,.55)' : 'rgba(10,40,15,.6)'; fx.lineWidth = 2.5; fx.beginPath(); fx.moveTo(128, 128); fx.lineTo(128 + Math.cos(a) * 130, 128 + Math.sin(a) * 130); fx.stroke(); }
    const fanM = new THREE.MeshStandardMaterial({ map: tex(fc), roughness: 0.7, side: THREE.DoubleSide });
    const bowM = new THREE.MeshStandardMaterial({ color: '#ff8fbc', roughness: 0.45 });
    [[-4.6, 3.4], [4.6, 3.4]].forEach(([x, z], wi) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -x * 0.04;
      const legM = new THREE.MeshStandardMaterial({ color: '#c49a5a', roughness: 0.7 });
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; const l = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.9, 6), legM); l.position.set(Math.cos(a) * 0.3, 1.9, Math.sin(a) * 0.3 - 0.2); l.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); l.castShadow = true; g.add(l); }
      // 부채 잎: 양옆 셋씩, 바깥으로 펼쳐짐
      for (const sx of [-1, 1]) for (const fy of [3.75, 2.75, 1.75]) {
        const fan = new THREE.Mesh(new THREE.CircleGeometry(0.75, 28, sx > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI), fanM);
        fan.position.set(sx * 0.6, fy, -0.12); fan.rotation.y = -sx * 0.25; g.add(fan);
      }
      // 꽃 기둥: 타원 안을 빽빽이, 가운데가 불룩
      const CY = 2.75, RX = 0.74, RY = 1.6;
      const cols = wi === 0 ? ['#e8344e', '#ff7a2e', '#ffc42e', '#ff5f93', '#c91f3a', '#ffa23a', '#ff8fb3'] : ['#ffc42e', '#ff7a2e', '#e8344e', '#ff5f93', '#ffa23a', '#c91f3a', '#ffe27a'];
      const pts = [];
      for (let yy = -RY; yy <= RY; yy += 0.13) for (let xx = -RX; xx <= RX; xx += 0.13) {
        const px = xx + (Rr() - 0.5) * 0.06, py = yy + (Rr() - 0.5) * 0.06, e = (px / RX) ** 2 + (py / RY) ** 2; if (e > 1) continue;
        pts.push([px, CY + py, 0.1 + 0.28 * Math.sqrt(1 - e), cols[Math.floor(Rr() * cols.length)], 0.8 + Rr() * 0.6]);
      }
      const im = new THREE.InstancedMesh(flowerG, flowerM, pts.length); const mx = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), cc = new THREE.Color();
      pts.forEach((p, i) => { pv.set(p[0], p[1], p[2]); sv.setScalar(p[4]); mx.compose(pv, q, sv); im.setMatrixAt(i, mx); im.setColorAt(i, cc.set(p[3])); });
      im.castShadow = true; g.add(im);
      // 분홍 백합 몇 송이(가운데 줄기 따라)
      for (let k = 0; k < 7; k++) { const ly = CY + 1.25 - k * 0.42 + (Rr() - 0.5) * 0.1, lx = (Rr() - 0.5) * 0.6; const e = (lx / RX) ** 2 + ((ly - CY) / RY) ** 2; const lz = 0.12 + 0.3 * Math.sqrt(Math.max(0, 1 - e));
        const lm2 = new THREE.Mesh(lilyG, lilyM); lm2.position.set(lx, ly, lz + 0.04); lm2.rotation.z = Rr() * 3; lm2.scale.setScalar(0.9 + Rr() * 0.4); g.add(lm2);
        const lc2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), lilyC); lc2.position.set(lx, ly, lz + 0.06); g.add(lc2); }
      // 맨 위 분홍 리본 매듭
      for (const sx of [-1, 1]) { const loop = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.06, 6, 16), bowM); loop.scale.set(1.4, 0.8, 0.6); loop.position.set(sx * 0.22, 4.38, 0.25); loop.rotation.z = sx * 0.3; g.add(loop); }
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bowM); knot.position.set(0, 4.36, 0.28); g.add(knot);      // 리본: 매듭에서 양옆으로 비스듬히 길게(분홍 천에 검은 글씨)
      const rib = (txt, rx, rot) => {
        const c = cv2(96, 960), x = c.getContext('2d');
        x.fillStyle = '#f8c6d6'; x.fillRect(0, 0, 96, 960);
        x.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < 960; k += 6) x.fillRect(0, k, 96, 1); // 천 결
        x.fillStyle = '#1d1a1c'; x.textAlign = 'center'; x.textBaseline = 'middle';
        const ch = [...txt]; const step = 760 / ch.length, sz = Math.min(70, step * 0.9);
        x.font = `900 ${sz}px Ttl, 'Malgun Gothic', serif`; ch.forEach((t, i) => x.fillText(t, 48, 120 + step * (i + 0.5)));
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 3.5), new THREE.MeshStandardMaterial({ map: tex(c), side: THREE.DoubleSide, roughness: 0.85 }));
        m.geometry.translate(0, -1.75, 0); m.position.set(rx, 4.3, 0.5); m.rotation.z = rot; m.castShadow = true; g.add(m); return c;
      };
      F.wreaths.push({ g, rib });
      s.add(g);
    });
    // 문 앞 깔판
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.2), new THREE.MeshStandardMaterial({ color: '#8a2a2a', roughness: 1 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.01, 1.2); mat.receiveShadow = true; s.add(mat);
    // 옆 가게(흐릿하게 이어지는 거리)
    for (const x of [-20, 20]) { const bh = 26 + Rr() * 6; const b = new THREE.Mesh(new THREE.BoxGeometry(17, bh, 6), new THREE.MeshStandardMaterial({ color: x < 0 ? '#c9b89a' : '#a8b8c0', roughness: 0.9 })); b.position.set(x, bh / 2, -2); b.receiveShadow = true; s.add(b); const sh2 = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.6), shMat); sh2.position.set(x, 1.9, 1.05); s.add(sh2); }
  }
  // 글꼴이 들어온 뒤 간판·리본 글씨
  R.frontText = function () {
    // 옛날 이발소 간판(사장님이 보내 준 미화이발관 간판처럼): 희끄무레한 판 + 회색 쇠 테,
    // 각진 고딕(도현체) 글씨를 그림자 없이 두 색으로 — 흰머리·방 남색, 뽑기 빨강. 칠 바램·벗겨짐·녹물·먼지
    const F = R.F, c = F.signC, g = c.getContext('2d'), Rr = rng(77), W = 2048, Hh = 320;
    const base = g.createLinearGradient(0, 0, 0, Hh); base.addColorStop(0, '#e4e2da'); base.addColorStop(0.5, '#eceae3'); base.addColorStop(1, '#d6d3c8'); g.fillStyle = base; g.fillRect(0, 0, W, Hh);
    const ed = g.createRadialGradient(W / 2, Hh / 2, Hh * 0.6, W / 2, Hh / 2, W * 0.55); ed.addColorStop(0, 'rgba(110,100,80,0)'); ed.addColorStop(1, 'rgba(110,100,80,.3)'); g.fillStyle = ed; g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 6000; i++) { g.fillStyle = Rr() < 0.6 ? 'rgba(90,85,70,.12)' : 'rgba(255,255,250,.3)'; g.fillRect(Rr() * W, Rr() * Hh, 1.5 + Rr() * 2, 1.5); }
    // 회색 쇠 테 + 안쪽 밝은 줄, 왼쪽 끝 색 띠(사진처럼)
    g.strokeStyle = '#8e8f8a'; g.lineWidth = 16; g.strokeRect(8, 8, W - 16, Hh - 16);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.strokeRect(20, 20, W - 40, Hh - 40);
    [['#c9a23a', 34], ['#3a8a6a', 42], ['#b8352c', 50]].forEach(([cl, x0]) => { g.fillStyle = cl; g.fillRect(x0, 28, 5, Hh - 56); });
    // 글씨: 조각마다 색을 바꿔 한 줄로
    const parts = window.EN ? [['WHITE HAIR ', '#2c4a7e'], ['SHOP', '#b8352c']] : [['흰머리', '#2c4a7e'], ['뽑기', '#b8352c'], ['방', '#2c4a7e']];
    const lc = cv2(W, Hh), lg = lc.getContext('2d');
    let px = 250, gap = 0; const fnt = () => `${px}px Sign, Ttl, sans-serif`;
    lg.font = fnt(); const full = () => parts.reduce((s, p) => s + lg.measureText(p[0]).width, 0);
    while (full() > 1500 && px > 60) { px -= 6; lg.font = fnt(); }
    gap = window.EN ? 0 : px * 0.12; // 사진처럼 글자 사이를 넉넉히
    const chars = []; parts.forEach(([s, cl]) => [...s].forEach((ch) => chars.push([ch, cl])));
    const totalW = chars.reduce((s, [ch]) => s + lg.measureText(ch).width, 0) + gap * (chars.length - 1);
    let cx = W / 2 - totalW / 2; lg.textBaseline = 'middle'; lg.textAlign = 'left';
    chars.forEach(([ch, cl]) => { lg.fillStyle = cl; lg.fillText(ch, cx, 168); cx += lg.measureText(ch).width + gap; });
    lg.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 1400; i++) { lg.fillStyle = Rr() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.1)'; lg.fillRect(Rr() * W, Rr() * Hh, 2 + Rr() * 6, 1.5); } // 칠 바램
    lg.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 220; i++) { lg.beginPath(); const x = Rr() * W, y = 50 + Rr() * 230, r = 1 + Rr() * (Rr() < 0.1 ? 8 : 3); lg.ellipse(x, y, r * (1 + Rr()), r, Rr() * 3, 0, 7); lg.fill(); } // 칠 벗겨짐
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(lc, 0, 0);
    // 나사못 + 녹물(옅게)
    for (const [bx, by] of [[30, 30], [W - 30, 30], [30, Hh - 30], [W - 30, Hh - 30]]) {
      const rl = 30 + Rr() * 80, dr = g.createLinearGradient(0, by, 0, by + rl); dr.addColorStop(0, 'rgba(130,80,40,.35)'); dr.addColorStop(1, 'rgba(130,80,40,0)'); g.fillStyle = dr; g.fillRect(bx - 3, by, 6, rl);
      g.fillStyle = '#6d6a62'; g.beginPath(); g.arc(bx, by, 7, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(bx - 2, by - 2, 2.5, 0, 7); g.fill();
    }
    for (let i = 0; i < 10; i++) { const x = 60 + Rr() * (W - 120), l = 30 + Rr() * 90, w = 3 + Rr() * 8; const dr = g.createLinearGradient(0, 24, 0, 24 + l); dr.addColorStop(0, 'rgba(110,90,60,.22)'); dr.addColorStop(1, 'rgba(110,90,60,0)'); g.fillStyle = dr; g.fillRect(x, 24, w, l); }
    const dust = g.createLinearGradient(0, Hh * 0.65, 0, Hh); dust.addColorStop(0, 'rgba(70,60,45,0)'); dust.addColorStop(1, 'rgba(70,60,45,.32)'); g.fillStyle = dust; g.fillRect(0, Hh * 0.65, W, Hh * 0.35);    F.signT.needsUpdate = true;
    F.wreaths.forEach((w, i) => {
      w.rib(i ? L('번창하세요', 'BEST WISHES') : L('흰머리뽑기방', 'WHITE HAIR'), -0.34, -0.15);
      w.rib(i ? L('흰머리뽑기방', 'WHITE HAIR') : L('축 개업', 'GRAND OPEN'), 0.34, 0.15);
    });
  };
  // 오프닝 진행(t 초)
  R.frontAt = function (t, dt) {
    const F = R.F;
    const up = Math.min(1, Math.max(0, (t - 0.7) / 2.0));
    const e = up < 1 ? up * up * (3 - 2 * up) : 1;
    F.shutter.scale.y = Math.max(0.001, 1 - e); F.shutter.position.y = 4 - 2 * (1 - e) * 1; F.shutter.position.y = 4 - (4 * (1 - e)) / 2;
    F.shT.repeat.set(1, Math.max(0.001, 1 - e)); F.shT.offset.y = e;
    F.shBot.position.set(0, 4 - 4 * (1 - e) + 0.06, 0.15);
    // 간판 불: 형광등처럼 깜빡이다 켜짐
    let on = 0; if (t > 2.9) { const k = t - 2.9; on = k < 0.5 ? (Math.sin(k * 60) > 0.2 ? 1 : 0.1) : 1; }
    F.signMat.emissiveIntensity = on * 0.4; F.poleM.emissiveIntensity = on * 0.45; F.bulbs.forEach((b) => (b.emissiveIntensity = on * 2.2));
    if (on) F.poleT.offset.y -= dt * 0.5;
    F.bell.rotation.z = t > 3.8 ? Math.sin((t - 3.8) * 22) * Math.exp(-(t - 3.8) * 3) * 0.6 : 0;
    // 카메라: 길 건너에서 문으로 다가감
    const c = R.camera, k = Math.min(1, Math.max(0, (t - 3.6) / 1.6)), kk = k * k, d = R.frontDist();
    c.position.set(Math.sin(t * 0.3) * 0.6 * (1 - kk), 3.0 + (d - 16) * 0.05 * (1 - kk) - kk * 1.0, d - kk * (d - 3.5));
    c.lookAt(0, 3.5 + (d - 16) * 0.02 * (1 - kk) - kk * 1.5, 0);
  };
  // 화면 폭에 맞춰 가게 앞이 다 들어오는 거리
  R.frontDist = function () { const a = R.camera.aspect; return Math.max(16, 8.2 / (Math.tan((19 * Math.PI) / 180) * a)); };
  R.frontIdle = function (t) {
    const c = R.camera, d = R.frontDist(); c.position.set(Math.sin(t * 0.25) * 0.8, 3.0 + (d - 16) * 0.05, d); c.lookAt(0, 3.5 + (d - 16) * 0.02, 0);
  };
})();
