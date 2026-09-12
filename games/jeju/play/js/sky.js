// 하늘 — 돔 셰이더(선형 HDR), 해 원반·햇무리·달, 안개, 구름, 별, 하루 시계. 색은 전부 선형 공간 (후처리에서 톤매핑)
(function () {
  const N = NOISE.makeNoise(777);
  const rng = NOISE.makeRng(9911);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const S = {
    hour: 9.5, dayLen: 480,            // 하루 = 8분
    sunDir: new THREE.Vector3(0, 1, 0), sunColor: new THREE.Color(), fogColor: new THREE.Color(), fogDensity: 0.00042,
    skyTop: new THREE.Color(), skyHor: new THREE.Color(),
    night: 0, sun: null, hemi: null, moon: null, sky: null, fog: null, stars: null, clouds: [], puffTex: null,
  };

  function makeSky() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, hazeCol: { value: new THREE.Color() },
        sunDir: { value: new THREE.Vector3(0.5, 0.5, 0.5) }, sunColor: { value: new THREE.Color() }, moonDir: { value: new THREE.Vector3(0, 1, 0) }, haze: { value: 0.35 }, night: { value: 0 },
      },
      vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position,1.0)).xyz - cameraPosition; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top, horizon, hazeCol, sunDir, sunColor, moonDir; uniform float haze, night; varying vec3 vW;
        void main(){ vec3 d = normalize(vW); float h = d.y;
          vec3 c = mix(horizon, top, pow(smoothstep(-0.02, 0.62, h), 0.7));
          c = mix(c, hazeCol, haze * smoothstep(0.32, -0.04, h));
          float s = max(0.0, dot(d, sunDir));
          float disc = smoothstep(0.9993, 0.9997, s) * 40.0;
          c += sunColor * (disc + pow(s, 160.0) * 0.9 + pow(s, 10.0) * 0.14 + pow(s, 2.0) * 0.05) * (1.0 - night * 0.8);
          float m = max(0.0, dot(d, moonDir));
          c += vec3(0.85, 0.88, 1.0) * (smoothstep(0.9995, 0.9998, m) * 2.5 + pow(m, 300.0) * 0.08) * night;
          c *= 1.0 - 0.45 * smoothstep(0.0, -0.25, h);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(7000, 48, 24), mat);
    m.renderOrder = -10; m.frustumCulled = false;
    return m;
  }

  function puffTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const dx = (x - 128) / 128, dy = (y - 128) / 128;
      const r = Math.sqrt(dx * dx + dy * dy);
      const n = 0.5 + 0.5 * N.fbm3(x * 0.03, y * 0.03, 1.7, 4, 2.2, 0.55);
      const a = smooth(1.0, 0.25, r) * smooth(0.28, 0.75, n + (1 - r) * 0.35);
      const shade = 1 - 0.32 * smooth(-0.3, 0.9, dy) - 0.12 * (1 - n);   // 아래쪽·속은 어둡게
      const i = (y * 256 + x) * 4;
      img.data[i] = 255 * shade; img.data[i + 1] = 252 * shade; img.data[i + 2] = 250 * shade; img.data[i + 3] = Math.min(255, a * 255);
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function makeStars() {
    const n = 1400, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2, e = Math.asin(rng() * 0.98 + 0.02), r = 6500;
      p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({ color: 0xffffff, size: 12, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const pts = new THREE.Points(g, m); pts.renderOrder = -9; pts.frustumCulled = false;
    return pts;
  }

  function init(scene, touch, shadowSize) {
    S.sky = makeSky(); scene.add(S.sky);
    S.fog = new THREE.FogExp2(0xc8d4de, S.fogDensity); scene.fog = S.fog;
    S.hemi = new THREE.HemisphereLight(0xbfd6f2, 0x4f5a45, 0.6); scene.add(S.hemi);
    S.sun = new THREE.DirectionalLight(0xffe6c4, 3.0);
    S.sun.castShadow = true;
    const ss = shadowSize || 2048; S.sun.shadow.mapSize.set(ss, ss);
    const sc = S.sun.shadow.camera; sc.left = sc.bottom = -80; sc.right = sc.top = 80; sc.near = 1; sc.far = 600;
    S.sun.shadow.bias = -0.0006; S.sun.shadow.normalBias = 0.2;
    scene.add(S.sun); scene.add(S.sun.target);
    S.stars = makeStars(); scene.add(S.stars);

    // 구름: 높은 뭉게구름 + 한라산 허리의 구름띠
    S.puffTex = puffTexture();
    function puff(x, y, z, sc, op, band) {
      const sm = new THREE.SpriteMaterial({ map: S.puffTex, transparent: true, opacity: op, depthWrite: false, color: 0xffffff });
      const s = new THREE.Sprite(sm); s.position.set(x, y, z); s.scale.set(sc * (1.6 + rng() * 0.8), sc * 0.75, 1); s.renderOrder = 3;
      scene.add(s); S.clouds.push({ s, vx: 1.2 + rng() * 1.6, baseY: y, ph: rng() * 6, op, band });
    }
    for (let i = 0; i < 70; i++) puff(-2200 + rng() * 4400, 640 + rng() * 380, -1800 + rng() * 4200, 180 + rng() * 280, 0.6 + rng() * 0.35, false);
    for (let i = 0; i < 60; i++) { const a = rng() * Math.PI * 2, d = 1400 + rng() * 1500; puff(200 + Math.cos(a) * d, 520 + rng() * 140, 4400 + Math.sin(a) * d * 0.8, 260 + rng() * 300, 0.7 + rng() * 0.3, true); }
  }

  const cTop = new THREE.Color(), cHor = new THREE.Color(), cHaze = new THREE.Color(), tmp = new THREE.Color();
  // 선형 색
  const DAY_TOP = new THREE.Color(0.075, 0.20, 0.58), DAY_HOR = new THREE.Color(0.50, 0.62, 0.80), DAY_HAZE = new THREE.Color(0.68, 0.72, 0.80);
  const DUSK_TOP = new THREE.Color(0.05, 0.07, 0.20), DUSK_HOR = new THREE.Color(0.95, 0.40, 0.16), DUSK_HAZE = new THREE.Color(1.0, 0.55, 0.28);
  const NIGHT_TOP = new THREE.Color(0.0025, 0.004, 0.012), NIGHT_HOR = new THREE.Color(0.012, 0.016, 0.032), NIGHT_HAZE = new THREE.Color(0.02, 0.024, 0.04);
  const moonDir = new THREE.Vector3();

  function update(dt) {
    S.hour = (S.hour + dt * 24 / S.dayLen) % 24;
    const t = S.hour;
    // 해: 06시 동쪽 지평선 → 12시 남중 → 18시 서쪽. 동쪽 = +x
    const ang = (t - 6) / 12 * Math.PI;
    const el = Math.sin(ang), az = Math.cos(ang);
    S.sunDir.set(az * 0.9, el, -0.45).normalize();
    if (el < 0) S.sunDir.y = Math.max(S.sunDir.y, -0.15);
    const day = smooth(-0.08, 0.22, el);          // 낮 정도
    const dusk = (1 - smooth(0.05, 0.35, Math.abs(el))) * smooth(-0.25, -0.02, el);   // 노을
    S.night = 1 - day;
    cTop.copy(NIGHT_TOP).lerp(DAY_TOP, day); cHor.copy(NIGHT_HOR).lerp(DAY_HOR, day); cHaze.copy(NIGHT_HAZE).lerp(DAY_HAZE, day);
    cTop.lerp(DUSK_TOP, dusk * 0.7); cHor.lerp(DUSK_HOR, dusk * 0.85); cHaze.lerp(DUSK_HAZE, dusk * 0.9);
    const warm = 1 - smooth(0.02, 0.35, el);    // 낮게 뜬 해는 붉다
    S.sunColor.setRGB(1.0, 0.93 - 0.45 * warm, 0.82 - 0.6 * warm);
    S.skyTop.copy(cTop); S.skyHor.copy(cHor);
    moonDir.set(-az * 0.7, Math.max(0.35, -el), 0.4).normalize();
    const u = S.sky.material.uniforms;
    u.top.value.copy(cTop); u.horizon.value.copy(cHor); u.hazeCol.value.copy(cHaze); u.sunDir.value.copy(S.sunDir); u.sunColor.value.copy(S.sunColor); u.moonDir.value.copy(moonDir); u.night.value = S.night;
    u.haze.value = 0.45 + 0.1 * S.night;
    // 안개는 지평선 색
    S.fogColor.copy(cHor).lerp(cHaze, 0.5).lerp(cTop, 0.12 + 0.25 * S.night);
    S.fog.color.copy(S.fogColor); S.fog.density = S.fogDensity;
    // 빛
    S.sun.intensity = 3.2 * smooth(-0.02, 0.3, el);
    S.sun.color.copy(S.sunColor);
    S.hemi.intensity = 0.55 + 0.41 * day;   // 밤 바닥이 너무 어둡지 않게(사장님 "깜깜해서 아무것도 안 보임", 2026-09-08)
    S.hemi.color.copy(cTop).lerp(cHor, 0.55).lerp(tmp.setRGB(1, 1, 1), 0.2 * day);
    S.hemi.groundColor.setRGB(0.16 * day + 0.03, 0.15 * day + 0.03, 0.12 * day + 0.04);
    S.stars.material.opacity = Math.pow(S.night, 2) * 0.9;
    // 달빛: 밤엔 해가 지평선 아래에서 푸른 빛으로 (그림자는 계속)
    if (el < 0) { S.sun.intensity = 0.9 * smooth(0, -0.1, el); S.sun.color.setRGB(0.5, 0.62, 0.95); S.sunDir.copy(moonDir); }
    // 구름
    for (const c of S.clouds) {
      c.s.position.x += c.vx * dt; if (c.s.position.x > 2400) c.s.position.x = -2400;
      c.s.material.color.setRGB(0.05 + 0.95 * day, 0.055 + 0.945 * day, 0.08 + 0.92 * day);
      if (dusk > 0.3) c.s.material.color.lerp(DUSK_HAZE, (dusk - 0.3) * 0.7);
      c.s.material.opacity = c.op * (0.5 + 0.5 * day);
    }
  }
  // 해 위치를 카메라에 붙인다 (그림자 상자가 카메라를 따라간다)
  const _p = new THREE.Vector3();
  function follow(camPos, fwd) {
    _p.copy(camPos).addScaledVector(fwd, 45);
    S.sun.target.position.copy(_p);
    S.sun.position.copy(_p).addScaledVector(S.sunDir, 300);
  }
  // 하늘을 환경맵으로 구워 차·유리·물에 비친다 (몇 초마다 새로)
  let pmrem = null, envScene = null, envT = 99, envTex = null, rendererRef = null, sceneRef = null;
  function initEnv(renderer, scene) { rendererRef = renderer; sceneRef = scene; pmrem = new THREE.PMREMGenerator(renderer); envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), S.sky.material)); envTick(99); }
  function envTick(dt) {
    if (!pmrem) return; envT += dt; if (envT < 10) return; envT = 0;
    const t = pmrem.fromScene(envScene, 0.05); if (envTex) envTex.dispose(); envTex = t.texture; sceneRef.environment = envTex;
  }
  // 시간만 보여 준다 — 분은 게임 시간이 빨라 정신없이 올라간다(사장님 2026-09-09)
  function clock() { const h = Math.floor(S.hour) % 24, k = h % 12;
    if (window.LANG && LANG.en) return (k === 0 ? 12 : k) + (h < 12 ? ' AM' : ' PM');
    return (h < 12 ? '오전 ' : '오후 ') + (k === 0 ? 12 : k) + '시'; }

  window.SKY = Object.assign(S, { init, update, follow, clock, initEnv, envTick });
})();
