// 3D 볼링장: 레인·거터·핀·공·야광 조명·레인 반사
(function () {
  const AL = (window.AL = {});
  const C = PH.C;
  let R, scene, cam, laneMat, mirrorRT, mcam, hemi, pinSpot;
  const themeMats = { a: [], b: [] };
  let theme = 0;
  AL.low = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

  // 볼링장 다섯 곳의 빛깔
  const THEMES = [
    { a: 0xff9a3c, b: 0x2ee6d6, amb: 0x5a3f55, sky: ['#1a1030', '#40204a'], art: 'city' },
    { a: 0xff3df2, b: 0x3dd8ff, amb: 0x3b2a6e, sky: ['#0b0620', '#2a0d4a'], art: 'cosmic' },
    { a: 0x3dffc5, b: 0x3d8bff, amb: 0x1f4466, sky: ['#04142a', '#0b3a55'], art: 'sea' },
    { a: 0xbfe8ff, b: 0x7aa8ff, amb: 0x3a4a70, sky: ['#0a1430', '#28406a'], art: 'snow' },
    { a: 0xffe14d, b: 0xb04dff, amb: 0x301a50, sky: ['#05020f', '#1c0833'], art: 'space' },
  ];
  AL.THEMES = THEMES;

  function rnd(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, srgb) {
    const t = new THREE.CanvasTexture(c);
    if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  // ---------- 나무 레인 결 ----------
  function woodCanvas(w, h, boards, seed, tone) {
    const c = cv(w, h), g = c.getContext('2d'), r = rnd(seed);
    const bw = w / boards;
    for (let i = 0; i < boards; i++) {
      const L = tone.l + (r() - 0.5) * 10, S = tone.s + (r() - 0.5) * 8, H = tone.h + (r() - 0.5) * 6;
      g.fillStyle = `hsl(${H},${S}%,${L}%)`;
      g.fillRect(i * bw, 0, bw + 1, h);
      // 세로 결
      for (let k = 0; k < 7; k++) {
        const x = i * bw + r() * bw;
        g.strokeStyle = `hsla(${H - 4},${S + 6}%,${L - 12 - r() * 10}%,${0.12 + r() * 0.18})`;
        g.lineWidth = 0.4 + r() * 0.9;
        g.beginPath();
        g.moveTo(x, 0);
        for (let y = 0; y <= h; y += h / 24) g.lineTo(x + Math.sin(y * 0.01 + k) * 0.6 * r(), y);
        g.stroke();
      }
      // 옹이·얼룩
      for (let k = 0; k < 6; k++) {
        g.fillStyle = `hsla(${H - 6},${S}%,${L - 14}%,${0.08 + r() * 0.1})`;
        const y = r() * h;
        g.fillRect(i * bw + 1, y, bw - 2, 6 + r() * 30);
      }
      // 판자 사이 줄눈
      g.fillStyle = 'rgba(40,20,10,.35)';
      g.fillRect(i * bw, 0, 0.8, h);
    }
    return c;
  }

  function makeLane() {
    const W = 256, H = 4096;
    const c = woodCanvas(W, H, 39, 7, { h: 34, s: 52, l: 64 });
    const g = c.getContext('2d');
    const zy = (z) => (1 - (-z) / (-C.DECK_END)) * H; // z(음수) → 캔버스 y
    // 가운데(파인) 구간은 조금 붉게
    const g1 = g.createLinearGradient(0, zy(-4.6), 0, zy(-16.5));
    g1.addColorStop(0, 'rgba(150,70,30,0)');
    g1.addColorStop(0.12, 'rgba(150,70,30,.16)');
    g1.addColorStop(0.88, 'rgba(150,70,30,.16)');
    g1.addColorStop(1, 'rgba(150,70,30,0)');
    g.fillStyle = g1;
    g.fillRect(0, zy(-4.6) - H, W, H);
    g.fillRect(0, zy(-16.5), W, zy(-4.6) - zy(-16.5));
    // 핀 자리 점
    g.fillStyle = 'rgba(90,50,25,.3)';
    for (const s of PH.SPOTS) {
      g.beginPath();
      g.ellipse((s.x / (2 * C.LANE_HW) + 0.5) * W, zy(s.z), 5, 3, 0, 0, 7);
      g.fill();
    }
    // 레인 끝 어둡게
    const g2 = g.createLinearGradient(0, 0, 0, zy(-18.9));
    g2.addColorStop(0, 'rgba(20,10,5,.5)');
    g2.addColorStop(1, 'rgba(20,10,5,0)');
    g.fillStyle = g2;
    g.fillRect(0, 0, W, zy(-18.9));
    const map = tex(c);
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;

    // 반짝이는 기름칠 거칠기 지도: 앞쪽 기름 구간은 매끈, 뒤는 약간 거침
    const rc = cv(8, 256), rg = rc.getContext('2d');
    const gr = rg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#6a6a6a');
    gr.addColorStop(0.3, '#555');
    gr.addColorStop(0.5, '#262626');
    gr.addColorStop(1, '#1a1a1a');
    rg.fillStyle = gr;
    rg.fillRect(0, 0, 8, 256);
    const rough = tex(rc, false);

    laneMat = new THREE.MeshStandardMaterial({ map, roughness: 1, roughnessMap: rough, metalness: 0, envMapIntensity: 0.5 });
    laneMat.userData.u = { tRefl: { value: null }, uRes: { value: new THREE.Vector2(1, 1) }, uStr: { value: 0.4 } };
    laneMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, laneMat.userData.u);
      sh.fragmentShader = 'uniform sampler2D tRefl; uniform vec2 uRes; uniform float uStr;\n' + sh.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        `{
          vec2 suv = gl_FragCoord.xy / uRes;
          suv.x = 1.0 - suv.x;
          float oil = smoothstep(0.62, 0.30, vMapUv.y);
          vec2 wob = vec2(sin(vMapUv.x * 240.0) * 0.0012, 0.0);
          vec3 rf = (texture2D(tRefl, suv + wob).rgb * 2.0 + texture2D(tRefl, suv + wob + vec2(0.0025, 0.004)).rgb
            + texture2D(tRefl, suv + wob - vec2(0.0025, 0.004)).rgb) * 0.25;
          vec3 V = normalize(cameraPosition - vWPos);
          float fr = 0.25 + 0.75 * pow(1.0 - max(V.y, 0.0), 3.0);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.55 + rf, uStr * fr * (0.55 + 0.45 * oil));
        }
        #include <tonemapping_fragment>`
      );
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
      sh.fragmentShader = 'varying vec3 vWPos;\n' + sh.fragmentShader;
    };
    laneMat.customProgramCacheKey = () => 'lane';
    return laneMat;
  }

  function neonMat(which, k) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    m.userData.k = k || 1;
    themeMats[which].push(m);
    return m;
  }
  function glowTex() {
    const c = cv(64, 64), g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.25, 'rgba(255,255,255,.45)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return tex(c);
  }
  let GLOW;
  function haloMat(which, op) {
    const m = new THREE.MeshBasicMaterial({ map: GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: op || 0.5, toneMapped: false });
    m.userData.k = 1;
    themeMats[which].push(m);
    return m;
  }

  // ---------- 핀 ----------
  const PROFILE = [
    [0, 0], [0.0258, 0], [0.030, 0.01], [0.040, 0.03], [0.052, 0.06], [0.0585, 0.09], [0.0605, 0.114],
    [0.0598, 0.14], [0.055, 0.17], [0.045, 0.2], [0.033, 0.23], [0.0232, 0.254], [0.0238, 0.275],
    [0.029, 0.3], [0.0322, 0.325], [0.0323, 0.343], [0.028, 0.36], [0.02, 0.372], [0.011, 0.378], [0.0005, 0.381],
  ];
  let pinGeo, pinMat, ballGeo;
  function makePin() {
    const curve = new THREE.CatmullRomCurve3(PROFILE.slice(1).map((p) => new THREE.Vector3(p[0], p[1], 0)));
    const pts = [new THREE.Vector2(0, 0)];
    curve.getPoints(60).forEach((v) => pts.push(new THREE.Vector2(v.x, v.y)));
    pinGeo = new THREE.LatheGeometry(pts, 28);
    const pos = pinGeo.attributes.position, uv = pinGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setY(i, pos.getY(i) / C.PIN_H);
    pinGeo.computeVertexNormals();
    const c = cv(128, 512), g = c.getContext('2d');
    const gy = (y) => (1 - y / C.PIN_H) * 512;
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#fbfaf6');
    gr.addColorStop(1, '#efe9df');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 512);
    // 목의 빨간 띠 두 줄
    g.fillStyle = '#d3202e';
    g.fillRect(0, gy(0.252), 128, gy(0.238) - gy(0.252));
    g.fillRect(0, gy(0.276), 128, gy(0.262) - gy(0.276));
    // 몸통의 작은 왕관 표
    g.fillStyle = '#c21a2a';
    for (const u of [0.25, 0.75]) {
      const x = u * 128, y = gy(0.2);
      g.beginPath();
      g.moveTo(x - 7, y + 5); g.lineTo(x - 7, y - 3); g.lineTo(x - 3.5, y + 1); g.lineTo(x, y - 6);
      g.lineTo(x + 3.5, y + 1); g.lineTo(x + 7, y - 3); g.lineTo(x + 7, y + 5);
      g.closePath(); g.fill();
    }
    // 바닥 긁힌 자국
    g.fillStyle = 'rgba(120,110,100,.35)';
    g.fillRect(0, gy(0.012), 128, 512 - gy(0.012));
    pinMat = new THREE.MeshPhysicalMaterial({ map: tex(c), roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.7 });
  }
  function pinMesh() {
    const m = new THREE.Mesh(pinGeo, pinMat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ---------- 공 무늬 ----------
  const BALLS = [
    { c: ['#1f5fd6', '#3f86ff', '#b9d4ff'], p: 'speck' },
    { c: ['#ff4f8b', '#ff9ec0', '#ffffff'], p: 'swirl' },
    { c: ['#29d6a6', '#e9fff8', '#0f8f74'], p: 'marble' },
    { c: ['#ff7a1a', '#ffd23f', '#b83c00'], p: 'swirl' },
    { c: ['#10144a', '#7a4dff', '#ffffff'], p: 'galaxy' },
    { c: ['#140606', '#ff3b0f', '#ffb000'], p: 'lava' },
    { c: ['#15151c', '#fff200', '#ffffff'], p: 'bolt' },
    { c: ['#063a6a', '#16b8d8', '#bff4ff'], p: 'wave' },
    { c: ['#1a0030', '#ff2bd6', '#22f0ff'], p: 'swirl' },
    { c: ['#8a5a00', '#ffd766', '#fff3c4'], p: 'gold' },
    { c: ['#ff0000', '#00ff00', '#0000ff'], p: 'rainbow' },
    { c: ['#000004', '#ff4fd8', '#6fe3ff'], p: 'galaxy2' },
  ];
  AL.BALLS = BALLS;
  const ballTexCache = {};
  function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function ballCanvas(i) {
    if (ballTexCache[i]) return ballTexCache[i];
    const W = 512, H = 256, c = cv(W, H), g = c.getContext('2d');
    const d = BALLS[i], [c0, c1, c2] = d.c.map(hex), r = rnd(100 + i * 17);
    const img = g.createImageData(W, H), a = img.data;
    const ph = [r() * 6, r() * 6, r() * 6, r() * 6];
    for (let y = 0; y < H; y++) {
      const v = y / H, lat = (v - 0.5) * Math.PI;
      for (let x = 0; x < W; x++) {
        const u = x / W, lon = u * Math.PI * 2;
        // 구 위의 점으로 옮겨 이음매 없는 무늬
        const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
        let t = 0, m = 0, cc;
        const n1 = Math.sin(px * 3.1 + ph[0] + Math.sin(py * 4.3 + ph[1]) * 1.6 + Math.sin(pz * 5.2 + ph[2]) * 1.2);
        const n2 = Math.sin(pz * 7.3 + ph[3] + Math.sin(px * 6.1) * 2.2 + Math.cos(py * 5.5) * 1.4);
        switch (d.p) {
          case 'speck': t = 0.5 + 0.5 * n1 * 0.4; m = 0; break;
          case 'swirl': t = 0.5 + 0.5 * Math.sin((n1 + n2 * 0.6) * 3.2); m = Math.pow(Math.max(0, n2), 12); break;
          case 'marble': t = Math.pow(Math.abs(Math.sin((px * 2 + n1 * 1.8 + n2 * 0.7) * 3.0)), 0.35); m = Math.pow(1 - t, 6); break;
          case 'galaxy': case 'galaxy2': t = Math.pow(Math.max(0, n1 * 0.6 + n2 * 0.5), 1.8); m = 0; break;
          case 'lava': t = Math.pow(1 - Math.abs(n1 * 0.7 + n2 * 0.3), 9); m = Math.pow(t, 3); break;
          case 'bolt': t = Math.pow(1 - Math.abs(Math.sin((py * 2.5 + Math.abs(((px * 3 + pz * 2 + 10) % 1) - 0.5) * 1.4) * 3.0)), 4); t = t > 0.55 ? 1 : t * 0.35; m = t > 0.9 ? 0.25 : 0; break;
          case 'wave': t = 0.5 + 0.5 * Math.sin(py * 14 + n1 * 2.5); m = Math.pow(t, 14) * 0.8; break;
          case 'gold': t = 0.5 + 0.5 * n1 * n2; m = Math.pow(Math.max(0, n2), 8); break;
          case 'rainbow': t = 0; break;
        }
        let R0, G0, B0;
        if (d.p === 'rainbow') {
          const hh = ((n1 + n2) * 0.25 + py * 0.3 + 1) % 1;
          const k = (n) => Math.max(0, Math.min(1, Math.abs(((hh * 6 + n) % 6) - 3) - 1));
          R0 = 255 * k(0); G0 = 255 * k(4); B0 = 255 * k(2);
          const w = Math.pow(Math.max(0, Math.sin((n1 - n2) * 5)), 10);
          R0 += (255 - R0) * w; G0 += (255 - G0) * w; B0 += (255 - B0) * w;
        } else {
          R0 = c0[0] + (c1[0] - c0[0]) * t; G0 = c0[1] + (c1[1] - c0[1]) * t; B0 = c0[2] + (c1[2] - c0[2]) * t;
          R0 += (c2[0] - R0) * m; G0 += (c2[1] - G0) * m; B0 += (c2[2] - B0) * m;
        }
        const o = (y * W + x) * 4;
        a[o] = R0; a[o + 1] = G0; a[o + 2] = B0; a[o + 3] = 255;
      }
    }
    // 반짝이 점
    const stars = d.p.startsWith('galaxy') ? 420 : d.p === 'speck' ? 900 : 0;
    for (let k = 0; k < stars; k++) {
      const x = (r() * W) | 0, y = (H * (0.5 + Math.asin(r() * 2 - 1) / Math.PI)) | 0, o = (y * W + x) * 4;
      const s = d.p === 'speck' ? 0.5 : 1;
      a[o] = a[o] + (c2[0] - a[o]) * s; a[o + 1] = a[o + 1] + (c2[1] - a[o + 1]) * s; a[o + 2] = a[o + 2] + (c2[2] - a[o + 2]) * s;
    }
    g.putImageData(img, 0, 0);
    // 손가락 구멍 셋
    const hole = (u, v, rr) => {
      const x = u * W, y = v * H;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr * 1.4);
      gr.addColorStop(0, '#050505');
      gr.addColorStop(0.62, '#0c0c0c');
      gr.addColorStop(0.72, 'rgba(255,255,255,.35)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(x, y, rr * 1.4, rr * 1.4 * 0.9, 0, 0, 7); g.fill();
    };
    hole(0.245, 0.2, 6.5); hole(0.29, 0.2, 6.5); hole(0.267, 0.32, 7.5);
    ballTexCache[i] = c;
    return c;
  }
  AL.ballCanvas = ballCanvas;

  // 상점용 동그란 공 그림 (2D 로 구를 떠서 빛을 입힌다)
  AL.ballThumb = function (i, size) {
    const src = ballCanvas(i), sg = src.getContext('2d').getImageData(0, 0, 512, 256).data;
    const c = cv(size, size), g = c.getContext('2d'), img = g.createImageData(size, size), a = img.data;
    const Lx = -0.45, Ly = 0.6, Lz = 0.66;
    const gold = BALLS[i].p === 'gold';
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2 - 1, ny = 1 - (y / size) * 2, rr = nx * nx + ny * ny;
      if (rr > 1) continue;
      const nz = Math.sqrt(1 - rr);
      // 살짝 돌려 구멍이 보이게
      const rx = nx * 0.8 + nz * 0.6, rz = -nx * 0.6 + nz * 0.8;
      const ry = ny * 0.85 + rz * 0.52, rz2 = -ny * 0.52 + rz * 0.85;
      const lon = Math.atan2(rz2, rx), lat = Math.asin(Math.max(-1, Math.min(1, ry)));
      const u = ((lon / (Math.PI * 2)) + 1.13) % 1, v = 0.5 - lat / Math.PI;
      const o2 = ((Math.max(0, Math.min(255, (v * 256) | 0))) * 512 + ((u * 512) | 0)) * 4;
      const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
      const hv = Math.max(0, (nx * Lx + ny * Ly + (nz + 1) * Lz) / Math.hypot(Lx, Ly, Lz + 1));
      const spec = Math.pow(hv, 60) * 1.2 + Math.pow(1 - nz, 3) * 0.25;
      const sh = gold ? 0.5 + 0.8 * dif : 0.32 + 0.78 * dif;
      const o = (y * size + x) * 4;
      const edge = Math.min(1, (1 - Math.sqrt(rr)) * size * 0.5);
      a[o] = Math.min(255, sg[o2] * sh + 255 * spec);
      a[o + 1] = Math.min(255, sg[o2 + 1] * sh + 255 * spec);
      a[o + 2] = Math.min(255, sg[o2 + 2] * sh + 255 * spec);
      a[o + 3] = 255 * edge;
    }
    g.putImageData(img, 0, 0);
    return c;
  };

  let ballMesh, ballMat, ballShadow, sweep, pinMeshes = [], pinShadows = [];
  function makeBall() {
    ballGeo = new THREE.SphereGeometry(C.R_B, 48, 32);
    ballMat = new THREE.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.0 });
    ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
  }
  AL.setBall = function (i) {
    ballMat.map && ballMat.map.dispose();
    ballMat.map = tex(ballCanvas(i));
    const gold = BALLS[i].p === 'gold';
    ballMat.metalness = gold ? 0.85 : 0;
    ballMat.roughness = gold ? 0.2 : 0.3;
    ballMat.emissive = new THREE.Color(BALLS[i].p === 'swirl' && i === 8 ? 0x301030 : 0x000000);
    ballMat.needsUpdate = true;
  };

  function blob(size, op) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false, opacity: op }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 1;
    return m;
  }
  let SHADOW;
  function shadowTex() {
    const c = cv(64, 64), g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,.85)');
    gr.addColorStop(0.5, 'rgba(0,0,0,.4)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return tex(c);
  }

  // ---------- 가림막 그림(볼링장마다) ----------
  let maskTex, maskCanvas;
  function drawMask(th) {
    const W = 2048, H = 320, c = maskCanvas || (maskCanvas = cv(W, H)), g = c.getContext('2d');
    const r = rnd(33 + th);
    const T = THEMES[th];
    const col = (n) => '#' + n.toString(16).padStart(6, '0');
    const A = col(T.a), B = col(T.b);
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, T.sky[0]);
    bg.addColorStop(1, T.sky[1]);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    const neon = (color, w, fn) => {
      g.save();
      g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
      g.shadowColor = color; g.shadowBlur = 18;
      g.lineWidth = w; g.beginPath(); fn(); g.stroke();
      g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = w * 0.35; g.beginPath(); fn(); g.stroke();
      g.restore();
    };
    if (T.art === 'city') {
      for (let i = 0; i < 40; i++) {
        const x = r() * W, w = 30 + r() * 70, h = 60 + r() * 160;
        g.fillStyle = 'rgba(10,6,20,.9)';
        g.fillRect(x, H - h, w, h);
        g.fillStyle = r() < 0.5 ? 'rgba(255,190,90,.75)' : 'rgba(120,240,230,.6)';
        for (let yy = H - h + 10; yy < H - 10; yy += 16) for (let xx = x + 6; xx < x + w - 8; xx += 14) if (r() < 0.45) g.fillRect(xx, yy, 6, 8);
      }
      neon(A, 7, () => { g.arc(W * 0.5, H * 0.55, 80, Math.PI, 0); });
    } else if (T.art === 'cosmic') {
      for (let i = 0; i < 14; i++) {
        const x = r() * W, y = 40 + r() * (H - 80), s = 20 + r() * 40;
        neon(r() < 0.5 ? A : B, 6, () => { for (let k = 0; k < 5; k++) { const a = k * 2.513 - 1.57; g.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); g.lineTo(x + Math.cos(a + 1.256) * s * 0.45, y + Math.sin(a + 1.256) * s * 0.45); } g.closePath(); });
      }
      neon(B, 6, () => { for (let x = 0; x <= W; x += 20) g.lineTo(x, H * 0.82 + Math.sin(x * 0.01) * 18); });
    } else if (T.art === 'sea') {
      for (let j = 0; j < 3; j++) neon(j % 2 ? A : B, 6, () => { for (let x = 0; x <= W; x += 16) g.lineTo(x, H * (0.45 + j * 0.16) + Math.sin(x * 0.012 + j * 2) * 20); });
      for (let i = 0; i < 10; i++) {
        const x = r() * W, y = 60 + r() * 120;
        neon(A, 5, () => { g.ellipse(x, y, 34, 16, 0, 0, 6.3); g.moveTo(x - 34, y); g.lineTo(x - 56, y - 16); g.lineTo(x - 56, y + 16); g.closePath(); });
      }
    } else if (T.art === 'snow') {
      for (let i = 0; i < 22; i++) {
        const x = r() * W, y = 30 + r() * (H - 60), s = 14 + r() * 26;
        neon(r() < 0.6 ? A : B, 4, () => { for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } });
      }
      neon(B, 6, () => { g.moveTo(0, H * 0.9); for (let x = 0; x <= W; x += 120) { g.lineTo(x + 60, H * 0.5 + r() * 40); g.lineTo(x + 120, H * 0.9); } });
    } else {
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${r()})`; g.fillRect(r() * W, r() * H, 2, 2); }
      for (let i = 0; i < 6; i++) {
        const x = 150 + r() * (W - 300), y = 80 + r() * 160, s = 30 + r() * 40;
        neon(r() < 0.5 ? A : B, 6, () => { g.arc(x, y, s, 0, 6.3); });
        neon(A, 4, () => { g.ellipse(x, y, s * 1.8, s * 0.4, -0.3, 0, 6.3); });
      }
    }
    // 레인 번호판 자리
    for (let k = -3; k <= 3; k++) {
      const x = W / 2 + (k * 1.75) / 12 * W;
      g.fillStyle = 'rgba(0,0,0,.55)';
      g.fillRect(x - 38, 8, 76, 54);
      g.fillStyle = k === 0 ? '#fff' : 'rgba(255,255,255,.6)';
      g.font = 'bold 40px sans-serif';
      g.textAlign = 'center';
      g.fillText(String(7 + k), x, 50);
    }
    if (maskTex) maskTex.needsUpdate = true;
    return c;
  }

  // ---------- 볼링장 짓기 ----------
  function laneAt(x, main) {
    const grp = new THREE.Group();
    grp.position.x = x;
    const len = -C.DECK_END;
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(C.LANE_HW * 2, len), main ? laneMat : sideLaneMat);
    lane.rotation.x = -Math.PI / 2;
    lane.position.z = -len / 2;
    lane.receiveShadow = true;
    grp.add(lane);
    if (main) AL.laneMesh = lane;
    // 거터 (반원 홈)
    for (const s of [-1, 1]) {
      const gw = (C.GUT_HW - C.LANE_HW) / 2;
      const gut = new THREE.Mesh(new THREE.CylinderGeometry(gw, gw, len + 0.95, 18, 1, true, -Math.PI / 2, Math.PI), gutMat);
      gut.rotation.x = Math.PI / 2;
      gut.scale.set(1, 1, 0.075 / gw);
      gut.position.set(s * (C.LANE_HW + gw), 0, -(len + 0.95) / 2);
      grp.add(gut);
      // 거터 가장자리 빛줄
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, len), neonMat('b', 0.7));
      edge.position.set(s * (C.GUT_HW + 0.006), 0.006, -len / 2);
      grp.add(edge);
      // 칸막이 (캡)
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, len + 4.5), capMat);
      cap.position.set(s * (C.GUT_HW + 0.105), 0.045 - 0.02, -(len + 4.5) / 2 + 4.5 / 2 - 2.2);
      cap.receiveShadow = true;
      grp.add(cap);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, len + 2.0), neonMat('a'));
      strip.position.set(s * (C.GUT_HW + 0.105), 0.029, -len / 2 + 1.0);
      grp.add(strip);
      // 킥백
      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.75, 2.8), kickMat);
      kb.position.set(s * 0.83, 0.3, -18.75);
      grp.add(kb);
      const kbs = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.03, 2.8), neonMat('a'));
      kbs.position.set(s * 0.799, 0.55, -18.75);
      grp.add(kbs);
    }
    // 화살표 7개 (야광)
    for (let k = -3; k <= 3; k++) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.22); shape.lineTo(0.022, 0); shape.lineTo(-0.022, 0); shape.closePath();
      const ar = new THREE.Mesh(new THREE.ShapeGeometry(shape), neonMat('a', 0.85));
      ar.rotation.x = -Math.PI / 2;
      ar.position.set(k * 5 * (C.LANE_HW * 2 / 39), 0.002, -4.6 + Math.abs(k) * 0.3048 * 0.5);
      grp.add(ar);
    }
    // 점 (2.1m)
    for (const k of [-14, -11, -8, -5, -3, 3, 5, 8, 11, 14]) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.009, 10), neonMat('b', 0.8));
      d.rotation.x = -Math.PI / 2;
      d.position.set(k * (C.LANE_HW * 2 / 39), 0.002, -2.13);
      grp.add(d);
    }
    // 핏 바닥·뒤 커튼
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.2), pitMat);
    pit.rotation.x = -Math.PI / 2;
    pit.position.set(0, -0.55, -19.7);
    grp.add(pit);
    const pitFront = new THREE.Mesh(new THREE.PlaneGeometry(1.066, 0.55), pitMat);
    pitFront.position.set(0, -0.275, C.DECK_END);
    grp.add(pitFront);
    const cur = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.4), curtainMat);
    cur.position.set(0, 0.15, C.BACK_Z);
    grp.add(cur);
    // 핀 받침 위 조명
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.25), new THREE.MeshBasicMaterial({ color: 0xfff6e0, toneMapped: false }));
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(0, 0.98, -17.75);
    grp.add(lamp);
    // 공 거치 (접근로 뒤쪽)
    scene.add(grp);
    return grp;
  }

  let sideLaneMat, gutMat, capMat, kickMat, pitMat, curtainMat;
  const deco = [];
  function build() {
    GLOW = glowTex();
    SHADOW = shadowTex();
    makeLane();
    sideLaneMat = new THREE.MeshStandardMaterial({ map: laneMat.map, roughness: 0.35, metalness: 0, envMapIntensity: 0.9 });
    gutMat = new THREE.MeshStandardMaterial({ color: 0x1b1d26, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });
    capMat = new THREE.MeshStandardMaterial({ color: 0x15131c, roughness: 0.5, metalness: 0.2 });
    kickMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.7 });
    pitMat = new THREE.MeshBasicMaterial({ color: 0x030305 });
    const cc = cv(64, 64), cg = cc.getContext('2d');
    cg.fillStyle = '#07060a'; cg.fillRect(0, 0, 64, 64);
    for (let x = 0; x < 64; x += 4) { cg.fillStyle = x % 8 ? '#0c0a12' : '#050408'; cg.fillRect(x, 0, 2, 64); }
    const ct = tex(cc); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(6, 3);
    curtainMat = new THREE.MeshBasicMaterial({ map: ct });

    makePin();
    makeBall();
    for (let k = -3; k <= 3; k++) {
      laneAt(k * 1.75, k === 0);
      if (k === 0) continue;
      // 옆 레인 핀(가만히 서 있음)
      for (const s of PH.SPOTS) {
        const m = pinMesh();
        m.castShadow = false;
        m.position.set(k * 1.75 + s.x, 0, s.z);
        m.rotation.y = Math.random() * 6;
        scene.add(m);
        const b = blob(0.18, 0.3); b.position.set(k * 1.75 + s.x, 0.003, s.z); scene.add(b);
      }
    }
    // 접근로 바닥
    const appC = woodCanvas(1024, 512, 90, 3, { h: 30, s: 45, l: 58 });
    const ag = appC.getContext('2d');
    // 접근로 점
    ag.fillStyle = 'rgba(60,30,15,.35)';
    for (const zz of [0.3, 0.7]) for (let k = -8; k <= 8; k += 2) {
      for (let L = -3; L <= 3; L++) { ag.beginPath(); ag.arc(512 + (L * 1.75 + k * 0.054) / 12.5 * 1024, zz * 512, 1.6, 0, 7); ag.fill(); }
    }
    const appT = tex(appC);
    const appMat = new THREE.MeshStandardMaterial({ map: appT, roughness: 0.45, envMapIntensity: 0.6 });
    const app = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 5), appMat);
    app.rotation.x = -Math.PI / 2;
    app.position.set(0, -0.0005, 2.5);
    app.receiveShadow = true;
    scene.add(app);
    // 파울 라인
    const foul = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.004, 0.025), neonMat('a'));
    foul.position.set(0, 0.001, 0);
    scene.add(foul);
    // 접근로 뒤 앉는 곳 턱
    const step = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.18, 0.4), capMat);
    step.position.set(0, -0.09 + 0.18, 5.2);
    scene.add(step);

    // 가림막
    maskTex = tex(drawMask(0));
    const mask = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.875), new THREE.MeshBasicMaterial({ map: maskTex, toneMapped: false }));
    mask.position.set(0, 1.0 + 0.9375, -17.55);
    scene.add(mask);
    const maskEdge = new THREE.Mesh(new THREE.BoxGeometry(12, 0.03, 0.03), neonMat('a'));
    maskEdge.position.set(0, 1.0, -17.53);
    scene.add(maskEdge);
    const maskEdge2 = maskEdge.clone(); maskEdge2.position.y = 2.875; scene.add(maskEdge2);
    // 가림막 뒤 어두운 기계
    const mach = new THREE.Mesh(new THREE.BoxGeometry(12, 1.9, 2.6), new THREE.MeshBasicMaterial({ color: 0x050409 }));
    mach.position.set(0, 1.95, -18.9);
    scene.add(mach);
    // 천장
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 26), new THREE.MeshStandardMaterial({ color: 0x0c0a14, roughness: 0.9 }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 3.3, -8);
    scene.add(ceil);
    for (let k = -3; k <= 4; k++) {
      const x = (k - 0.5) * 1.75;
      const tube = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 15.5), neonMat(k % 2 ? 'a' : 'b', 0.45));
      tube.position.set(x, 3.25, -7.5);
      scene.add(tube);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 15.8), haloMat(k % 2 ? 'a' : 'b', 0.12));
      halo.rotation.x = Math.PI / 2;
      halo.position.set(x, 3.24, -7.5);
      scene.add(halo);
    }
    // 가로 빛 고리
    for (let i = 0; i < 5; i++) {
      const z = -1.5 - i * 3.2;
      const ring = new THREE.Mesh(new THREE.BoxGeometry(14, 0.04, 0.04), neonMat(i % 2 ? 'b' : 'a', 0.4));
      ring.position.set(0, 3.2, z);
      scene.add(ring);
    }
    // 옆벽
    for (const s of [-1, 1]) {
      const wc = cv(1024, 128), wg = wc.getContext('2d');
      wg.fillStyle = '#0a0812'; wg.fillRect(0, 0, 1024, 128);
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 3.4), new THREE.MeshStandardMaterial({ map: tex(wc), roughness: 0.9 }));
      wall.rotation.y = -s * Math.PI / 2;
      wall.position.set(s * 6.3, 1.7, -8);
      scene.add(wall);
      for (let j = 0; j < 3; j++) {
        const pts = [];
        for (let z = 5; z >= -20; z -= 0.4) pts.push(new THREE.Vector3(s * 6.28, 1.0 + j * 0.55 + Math.sin(z * 0.9 + j) * 0.12, z));
        const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.018, 5), neonMat(j % 2 ? 'a' : 'b'));
        scene.add(tube);
      }
    }
    // 머리 위 점수 화면
    for (let k = -3; k <= 3; k++) {
      const scr = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.62, 0.06), capMat);
      scr.position.set(k * 1.75 + 0.875, 2.55, 1.4);
      scr.rotation.x = 0.25;
      scene.add(scr);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.54), neonMat('b', 0.25));
      face.position.set(k * 1.75 + 0.875, 2.55 - 0.0077, 1.4 + 0.031);
      face.rotation.x = 0.25;
      scene.add(face);
    }
    // 공 반환대 (레인 사이, 접근로)
    const retMat = new THREE.MeshStandardMaterial({ color: 0x23202e, roughness: 0.3, metalness: 0.4 });
    for (const x of [-0.875, 0.875 + 1.75, -0.875 - 1.75]) {
      const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.5, 20, 1, false, 0, Math.PI), retMat);
      hood.rotation.set(Math.PI / 2, 0, 0);
      hood.position.set(x, 0.3, 3.1);
      scene.add(hood);
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 1.3), retMat);
      rack.position.set(x, 0.3, 3.95);
      scene.add(rack);
      const rs = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.01, 1.3), neonMat('a'));
      rs.position.set(x, 0.605, 3.95);
      scene.add(rs);
      for (let i = 0; i < 3; i++) {
        const bm = new THREE.MeshPhysicalMaterial({ map: tex(ballCanvas((i * 5 + Math.round(x * 3) + 12) % 12)), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
        const b = new THREE.Mesh(ballGeo || new THREE.SphereGeometry(C.R_B, 32, 20), bm);
        b.position.set(x, 0.61 + C.R_B, 3.55 + i * 0.26);
        b.rotation.set(Math.random() * 6, Math.random() * 6, 0);
        scene.add(b);
      }
    }

    ballShadow = blob(0.42, 0.75);
    scene.add(ballShadow);
    for (let i = 0; i < 10; i++) {
      const m = pinMesh();
      scene.add(m);
      pinMeshes.push(m);
      const b = blob(0.2, 0.35);
      scene.add(b);
      pinShadows.push(b);
    }
    // 스위프(핀 치우는 막대)
    sweep = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 0.05), new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.4, metalness: 0.5 }));
    sweep.add(bar);
    const sc = cv(256, 32), sg = sc.getContext('2d');
    for (let x = -32; x < 256; x += 32) { sg.fillStyle = '#ffcc00'; sg.beginPath(); sg.moveTo(x, 32); sg.lineTo(x + 16, 32); sg.lineTo(x + 32, 0); sg.lineTo(x + 16, 0); sg.fill(); }
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.06), new THREE.MeshBasicMaterial({ map: tex(sc), transparent: true }));
    stripe.position.z = 0.027;
    sweep.add(stripe);
    sweep.position.set(0, 1.3, -17.95);
    scene.add(sweep);

    // 빛
    hemi = new THREE.HemisphereLight(0x8070c0, 0x2a1a20, 0.9);
    scene.add(hemi);
    const amb = new THREE.AmbientLight(0xffffff, 0.12);
    scene.add(amb);
    pinSpot = new THREE.SpotLight(0xfff4e6, 70, 7, 1.05, 1, 1.2);
    pinSpot.position.set(0, 1.5, -17.45);
    pinSpot.target.position.set(0, 0, -18.9);
    pinSpot.castShadow = true;
    pinSpot.shadow.mapSize.set(1024, 1024);
    pinSpot.shadow.bias = -0.0004;
    pinSpot.shadow.camera.near = 0.3;
    pinSpot.shadow.camera.far = 6;
    scene.add(pinSpot, pinSpot.target);
    for (const k of [-3, -2, -1, 1, 2, 3]) {
      const sp = new THREE.SpotLight(0xfff4e6, 45, 7, 1.05, 1, 1.2);
      sp.position.set(k * 1.75, 1.5, -17.45);
      sp.target.position.set(k * 1.75, 0, -18.9);
      scene.add(sp, sp.target);
    }
    // 레인 따라 은은한 빛
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xffffff, 5, 7, 1.5);
      pl.position.set(0, 2.6, -1 - i * 4.5);
      scene.add(pl);
      deco.push(pl);
    }
    const keyL = new THREE.DirectionalLight(0xffe8d0, 0.5);
    keyL.position.set(-2, 5, 6);
    scene.add(keyL);
  }

  function envMap() {
    const es = new THREE.Scene();
    const c = cv(256, 128), g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, '#1a1030');
    gr.addColorStop(0.5, '#3a2a55');
    gr.addColorStop(0.55, '#6a4a30');
    gr.addColorStop(1, '#1a1010');
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#ff5af0' : '#5ae8ff'; g.fillRect(i * 16, 18, 10, 3); }
    g.fillStyle = '#fff6e0';
    g.fillRect(100, 40, 56, 10);
    const t = tex(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    es.background = t;
    const pm = new THREE.PMREMGenerator(R);
    const rt = pm.fromScene(es, 0.02);
    return rt.texture;
  }

  AL.init = function (canvas) {
    R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, AL.low ? 1.5 : 2));
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.toneMappingExposure = 1.0;
    R.shadowMap.enabled = true;
    R.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0d0818, 16, 40);
    scene.background = new THREE.Color(0x0d0818);
    cam = new THREE.PerspectiveCamera(40, 1, 0.05, 80);
    mcam = new THREE.PerspectiveCamera(40, 1, 0.05, 80);
    build();
    scene.environment = envMap();
    mirrorRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
    laneMat.userData.u.tRefl.value = mirrorRT.texture;
    AL.scene = scene;
    AL.cam = cam;
    AL.R = R;
    AL.setTheme(0);
    AL.resize();
  };

  AL.setTheme = function (i) {
    theme = i;
    const T = THEMES[i % THEMES.length];
    const ca = new THREE.Color(T.a), cb = new THREE.Color(T.b);
    for (const m of themeMats.a) m.color.copy(ca).multiplyScalar(m.userData.k * 1.6);
    for (const m of themeMats.b) m.color.copy(cb).multiplyScalar(m.userData.k * 1.6);
    hemi.color.set(T.amb).lerp(new THREE.Color(0xffffff), 0.35);
    deco.forEach((pl, k) => pl.color.copy(k % 2 ? ca : cb).lerp(new THREE.Color(0xffffff), 0.5));
    scene.fog.color.set(T.sky[0]);
    scene.background.set(T.sky[0]);
    drawMask(i % THEMES.length);
    maskTex.needsUpdate = true;
  };

  let W = 1, H = 1;
  AL.resize = function () {
    W = window.innerWidth; H = window.innerHeight;
    R.setSize(W, H, false);
    cam.aspect = W / H;
    // 세로 화면이면 옆이 잘리지 않게 시야를 넓힌다
    const asp = W / H;
    // 넓은 화면은 가로 시야를 고정해 핀이 작아지지 않게
    cam.fov = asp < 0.75 ? 41 : asp < 1.1 ? 42 : asp < 1.4 ? 38 : Math.max(24, (2 * Math.atan(Math.tan((27 * Math.PI) / 180) / asp) * 180) / Math.PI);
    cam.updateProjectionMatrix();
    const pr = R.getPixelRatio();
    const q = AL.low ? 0.4 : 0.5;
    mirrorRT.setSize(Math.max(4, (W * pr * q) | 0), Math.max(4, (H * pr * q) | 0));
    laneMat.userData.u.uRes.value.set(W * pr, H * pr);
  };

  // ---------- 매 프레임: 물리 상태 → 그림 ----------
  const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), vUp = new THREE.Vector3(0, 1, 0), vAx = new THREE.Vector3();
  const U = [0, 1, 0];
  AL.sync = function (dt) {
    const S = PH.S, b = S.ball;
    if (b) {
      ballMesh.visible = true;
      ballMesh.position.set(b.x, b.y, b.z);
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 0.01 && dt > 0) {
        vAx.set(-b.vz, 0, b.vx).normalize();
        q1.setFromAxisAngle(vAx, (sp * dt) / C.R_B);
        ballMesh.quaternion.premultiply(q1);
        if (b.hook) {
          vAx.set(b.vx, 0, b.vz).normalize();
          q1.setFromAxisAngle(vAx, b.hook * dt * 6);
          ballMesh.quaternion.premultiply(q1);
        }
      }
      const fy = PH.floorY(b.x, b.z);
      ballShadow.visible = b.y - fy < 0.4;
      ballShadow.position.set(b.x + 0.03, fy + 0.002, b.z + 0.02);
      ballShadow.material.opacity = 0.75 * Math.max(0, 1 - (b.y - C.R_B - fy) * 3);
    }
    for (let i = 0; i < 10; i++) {
      const p = S.pins[i], m = pinMeshes[i], sh = pinShadows[i];
      if (!p || !p.alive || p.gone) { m.visible = false; sh.visible = false; continue; }
      m.visible = true;
      PH.pinAxis(p, U);
      vAx.set(U[0], U[1], U[2]);
      q1.setFromUnitVectors(vUp, vAx);
      q2.setFromAxisAngle(vUp, p.yaw);
      m.quaternion.copy(q1).multiply(q2);
      let bx, by, bz;
      if (p.st === 0) { bx = p.x; by = 0; bz = p.z; }
      else { bx = p.cx - U[0] * C.PIN_C; by = p.cy - U[1] * C.PIN_C; bz = p.cz - U[2] * C.PIN_C; }
      m.position.set(bx, by + (p.lift || 0), bz);
      const cx = p.st === 0 ? p.x + U[0] * 0.15 : p.cx, cz = p.st === 0 ? p.z + U[2] * 0.15 : p.cz;
      const fy = PH.floorY(cx, cz);
      const hy = (p.st === 0 ? 0 : p.cy - 0.06) - fy + (p.lift || 0);
      sh.visible = hy < 0.5;
      sh.position.set(cx, fy + 0.003, cz);
      const lying = p.st === 0 ? Math.min(1, Math.hypot(p.tx, p.tz)) : 1;
      sh.scale.set(1 + lying * 0.4, 1 + lying * 0.4, 1);
      sh.material.opacity = (0.3 + lying * 0.3) * Math.max(0, 1 - hy * 2);
    }
  };

  AL.setSweep = function (y) { sweep.position.y = y; };
  AL.ballVisible = function (v) { ballMesh.visible = v; ballShadow.visible = v; };

  // ---------- 카메라 ----------
  const camPos = new THREE.Vector3(0, 1.1, 2.8), camLook = new THREE.Vector3(0, 0.3, -18);
  const tPos = new THREE.Vector3(), tLook = new THREE.Vector3();
  AL.camTo = function (pos, look, snap) {
    tPos.set(pos[0], pos[1], pos[2]);
    tLook.set(look[0], look[1], look[2]);
    if (snap) { camPos.copy(tPos); camLook.copy(tLook); }
  };
  AL.camStep = function (dt, k) {
    const a = 1 - Math.exp(-dt * (k || 5));
    camPos.lerp(tPos, a);
    camLook.lerp(tLook, a);
  };
  let shake = 0;
  AL.shake = function (v) { shake = Math.max(shake, v); };

  AL.render = function (dt) {
    cam.position.copy(camPos);
    if (shake > 0.0005) {
      cam.position.x += (Math.random() - 0.5) * shake;
      cam.position.y += (Math.random() - 0.5) * shake;
      shake *= Math.exp(-dt * 9);
    }
    cam.lookAt(camLook);
    cam.updateMatrixWorld();
    // 레인 반사
    mcam.copy(cam);
    mcam.position.set(cam.position.x, -cam.position.y, cam.position.z);
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = -dir.y;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    up.y = -up.y;
    mcam.up.copy(up);
    mcam.lookAt(mcam.position.clone().add(dir));
    mcam.updateMatrixWorld();
    mcam.projectionMatrix.copy(cam.projectionMatrix);
    mcam.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
    AL.laneMesh.visible = false;
    const sh = R.shadowMap.autoUpdate;
    R.shadowMap.autoUpdate = false;
    R.setRenderTarget(mirrorRT);
    R.render(scene, mcam);
    R.setRenderTarget(null);
    R.shadowMap.autoUpdate = sh;
    AL.laneMesh.visible = true;
    R.render(scene, cam);
  };

  // 화면 좌표 → 레인 위 x (공 자리 잡기용)
  AL.project = function (x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(cam);
    return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
  };
})();
