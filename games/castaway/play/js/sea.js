/* sea.js — 하늘 돔 + 게르스트너 파도 바다 + 하루 주기. 루루냥의 바다 색을 기본으로 한다 */
(function () {
  // 파도 (방향, 진폭, 파장, 속도, 가파름) — JS 와 GLSL 이 같은 값을 쓴다
  const WAVES = [
    { d: [1, 0.3], a: 0.22, l: 18, s: 1.0, q: 0.5 },
    { d: [-0.6, 1], a: 0.14, l: 11, s: 1.2, q: 0.5 },
    { d: [0.7, -0.7], a: 0.08, l: 6.5, s: 1.4, q: 0.6 },
    { d: [-0.2, -1], a: 0.05, l: 3.6, s: 1.7, q: 0.6 },
  ];
  WAVES.forEach(w => { const l = Math.hypot(w.d[0], w.d[1]); w.d[0] /= l; w.d[1] /= l; });

  const G = 9.8;
  // 한 자리의 수면 높이 (게르스트너는 옆으로도 밀리므로 두 번 되짚는다)
  function height(x, z, t, sea) {
    let px = x, pz = z;
    for (let it = 0; it < 2; it++) {
      let dx = 0, dz = 0;
      for (const w of WAVES) { const k = 2 * Math.PI / w.l, c = Math.sqrt(G / k), a = w.a * sea, f = k * (w.d[0] * px + w.d[1] * pz - c * w.s * t); const q = w.q / (k * a * WAVES.length); dx += q * a * w.d[0] * Math.cos(f); dz += q * a * w.d[1] * Math.cos(f); }
      px = x - dx; pz = z - dz;
    }
    let y = 0;
    for (const w of WAVES) { const k = 2 * Math.PI / w.l, c = Math.sqrt(G / k), a = w.a * sea, f = k * (w.d[0] * px + w.d[1] * pz - c * w.s * t); y += a * Math.sin(f); }
    return y;
  }

  const glslWaves = `
    const int NW = 4;
    uniform vec4 uWd[NW];   // dir.x, dir.z, amp, len
    uniform vec2 uWs[NW];   // speed, steep
    uniform float uTime, uSea;
    void gerstner(vec3 p0, out vec3 p, out vec3 n, out float crest) {
      p = p0; n = vec3(0.0, 1.0, 0.0); crest = 0.0;
      for (int i = 0; i < NW; i++) {
        vec2 d = uWd[i].xy; float a = uWd[i].z * uSea; float k = 6.28318 / uWd[i].w; float c = sqrt(9.8 / k);
        float f = k * (dot(d, p0.xz) - c * uWs[i].x * uTime); float q = uWs[i].y / (k * a * float(NW));
        float S = sin(f), C = cos(f);
        p.x += q * a * d.x * C; p.z += q * a * d.y * C; p.y += a * S;
        n.x -= d.x * k * a * C; n.z -= d.y * k * a * C; n.y -= q * k * a * S;
        crest += (S * 0.5 + 0.5) * a;
      }
    }`;

  const waterVert = glslWaves + `
    varying vec3 vPos; varying vec3 vNor; varying float vCrest;
    void main() {
      vec3 p0 = (modelMatrix * vec4(position, 1.0)).xyz;
      vec3 p, n; float cr; gerstner(p0, p, n, cr);
      vPos = p; vNor = n; vCrest = cr;
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
    }`;

  const waterFrag = `
    precision highp float;
    uniform vec3 uSunDir, uMoonDir, uSunCol, uDeep, uShallow, uZenith, uHorizon, uCam, uLampPos;
    uniform float uTime, uNight, uFogNear, uFogFar, uLamp;
    varying vec3 vPos; varying vec3 vNor; varying float vCrest;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    void main() {
      vec3 n = normalize(vNor);
      // 잔물결 — 작은 사인 결로 법선을 살짝 흔든다
      float r1 = sin(vPos.x * 2.7 + uTime * 1.9 + vPos.z * 1.3) + sin(vPos.x * 5.1 - uTime * 2.6) * 0.5;
      float r2 = sin(vPos.z * 3.3 - uTime * 1.5 + vPos.x * 0.9) + sin(vPos.z * 6.2 + uTime * 2.1) * 0.5;
      n = normalize(n + vec3(r1 * 0.035, 0.0, r2 * 0.035));
      vec3 V = normalize(uCam - vPos);
      float ndv = max(dot(n, V), 0.0);
      float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
      vec3 R = reflect(-V, n);
      vec3 skyCol = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.5));
      // 물빛 — 마루는 볕이 비쳐 옅은 청록, 골은 짙게
      float sub = clamp(vCrest * 1.6 + 0.15, 0.0, 1.0) * clamp(dot(n, uSunDir) * 0.5 + 0.6, 0.0, 1.0);
      vec3 waterCol = mix(uDeep, uShallow, sub);
      vec3 col = mix(waterCol, skyCol, fres);
      // 해 반짝임
      float sd = max(dot(R, uSunDir), 0.0);
      float sunUp = clamp(uSunDir.y * 4.0 + 0.2, 0.0, 1.0);
      float spec = pow(sd, 600.0) * 2.2 + pow(sd, 40.0) * 0.18;
      col += uSunCol * spec * sunUp;
      // 달빛 반짝임
      if (uNight > 0.0) { float md = max(dot(R, uMoonDir), 0.0); col += vec3(0.75, 0.82, 1.0) * (pow(md, 500.0) * 1.6 + pow(md, 30.0) * 0.12) * uNight; }
      // 거품 — 마루 꼭대기에만
      float fo = smoothstep(0.42, 0.62, vCrest) * noise(vPos.xz * 2.5 + uTime * 0.3) * noise(vPos.xz * 7.0 - uTime * 0.5);
      col = mix(col, vec3(0.92, 0.96, 0.98), fo * 1.2 * (1.0 - uNight * 0.7));
      // 등불 (밤)
      if (uLamp > 0.0) { float ld = length(vPos - uLampPos); col += vec3(1.0, 0.72, 0.35) * uLamp / (1.0 + ld * ld * 0.35) * (0.4 + 0.6 * fres); }
      // 수평선 안개
      float d = length(uCam - vPos);
      float fg = smoothstep(uFogNear, uFogFar, d);
      col = mix(col, uHorizon, fg);
      float alpha = mix(0.42, 1.0, fres); alpha = mix(alpha, 1.0, fg);
      gl_FragColor = vec4(col, alpha);
    }`;

  const skyVert = `varying vec3 vDir; void main() { vDir = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const skyFrag = `
    precision highp float;
    uniform vec3 uSunDir, uMoonDir, uSunCol, uZenith, uHorizon;
    uniform float uNight, uTime, uCloud;
    varying vec3 vDir;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.1 + 13.7; a *= 0.5; } return v; }
    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y, 0.0, 1.0);
      vec3 col = mix(uHorizon, uZenith, pow(h, 0.55));
      // 해
      float sd = dot(d, uSunDir);
      float disc = smoothstep(0.9990, 0.9996, sd);
      float glow = pow(max(sd, 0.0), 14.0) * 0.5 + pow(max(sd, 0.0), 3.0) * 0.12;
      float sunUp = smoothstep(-0.12, 0.05, uSunDir.y);
      col += uSunCol * (disc * 2.0 + glow) * sunUp;
      // 달·별
      float md = dot(d, uMoonDir);
      col += vec3(0.9, 0.93, 1.0) * smoothstep(0.9993, 0.9997, md) * 1.2 * uNight;
      col += vec3(0.6, 0.7, 0.9) * pow(max(md, 0.0), 40.0) * 0.12 * uNight;
      if (uNight > 0.01 && d.y > 0.02) {
        vec2 sp = d.xz / (d.y + 0.25) * 90.0;
        vec2 cell = floor(sp); float st = hash(cell);
        vec2 fp = fract(sp) - 0.5; float dist = length(fp - (vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.6);
        float star = smoothstep(0.08, 0.0, dist) * step(0.93, st) * (0.6 + 0.4 * sin(uTime * 3.0 + st * 60.0));
        col += vec3(star) * uNight * smoothstep(0.02, 0.2, d.y);
      }
      // 구름 — 지평선 쪽은 옅게
      if (d.y > 0.01) {
        vec2 cp = d.xz / (d.y + 0.18) * 1.6 + vec2(uTime * 0.012, uTime * 0.004);
        float c = fbm(cp);
        float cl = smoothstep(0.52 - uCloud * 0.12, 0.72, c);
        vec3 lit = mix(vec3(1.0), uSunCol, 0.35);
        vec3 cloudCol = mix(lit, uHorizon * 0.75, 0.45 + 0.35 * (1.0 - h));
        cloudCol = mix(cloudCol, vec3(0.16, 0.18, 0.26), uNight * 0.9);
        col = mix(col, cloudCol, cl * smoothstep(0.02, 0.18, d.y) * 0.9);
      }
      gl_FragColor = vec4(col, 1.0);
    }`;

  // 하루 주기 색 (해 높이 e = -1..1)
  const C = (h) => new THREE.Color(h);
  const PAL = {
    day: { zenith: C(0x2f7fd0), horizon: C(0xdcecf6), sun: C(0xfff4dc), deep: C(0x0b4a63), shallow: C(0x2f88a8) },
    dusk: { zenith: C(0x3a4a86), horizon: C(0xf5a55a), sun: C(0xffb060), deep: C(0x0c2e44), shallow: C(0x2a6f86) },
    night: { zenith: C(0x0e1830), horizon: C(0x28385a), sun: C(0x9aa8d0), deep: C(0x102a40), shallow: C(0x1e4c62) },
  };
  function lerpC(a, b, t, out) { out.r = a.r + (b.r - a.r) * t; out.g = a.g + (b.g - a.g) * t; out.b = a.b + (b.b - a.b) * t; return out; }
  function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function build(scene, isTouch) {
    const wd = WAVES.map(w => new THREE.Vector4(w.d[0], w.d[1], w.a, w.l)), ws = WAVES.map(w => new THREE.Vector2(w.s, w.q));
    const U = {
      uWd: { value: wd }, uWs: { value: ws }, uTime: { value: 0 }, uSea: { value: 1 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uMoonDir: { value: new THREE.Vector3(0, -1, 0) }, uSunCol: { value: new THREE.Color() },
      uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() }, uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
      uCam: { value: new THREE.Vector3() }, uNight: { value: 0 }, uFogNear: { value: 60 }, uFogFar: { value: 190 }, uCloud: { value: 0.5 },
      uLamp: { value: 0 }, uLampPos: { value: new THREE.Vector3(0, 0.6, 0) },
    };
    const seg = isTouch ? 150 : 220;
    const wgeo = new THREE.PlaneGeometry(420, 420, seg, seg); wgeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(wgeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: waterVert, fragmentShader: waterFrag, transparent: true, depthWrite: true }));
    water.renderOrder = 5; scene.add(water);
    // 물 밑바닥 — 짙은 물빛 판 (물고기 뒤가 하늘색으로 비치지 않게)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshBasicMaterial({ color: 0x04101c })); floor.rotation.x = -Math.PI / 2; floor.position.y = -9; scene.add(floor);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 40, 24), new THREE.ShaderMaterial({ uniforms: U, vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false }));
    sky.renderOrder = -10; scene.add(sky);

    const sun = new THREE.DirectionalLight(0xfff2d8, 2.0); sun.position.set(30, 40, 20); scene.add(sun); scene.add(sun.target);
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 20; sc.far = 110; sun.shadow.bias = -0.0015; sun.shadow.normalBias = 0.02;
    const hemi = new THREE.HemisphereLight(0xbcdcf5, 0x1d5d72, 1.0); scene.add(hemi);
    const tmp = new THREE.Color();

    const S = {
      U, water, sky, sun, hemi, floor, WAVES,
      dayT: 0.08,      // 0 해뜸 · .25 낮 · .5 해짐 · .75 한밤
      sea: 1, time: 0, night: 0, sunEl: 1,
      height(x, z) { return height(x, z, S.time, S.sea); },
      // 파도 기울기 (뗏목 기울임용)
      slope(x, z, r) { const h0 = S.height(x - r, z), h1 = S.height(x + r, z), h2 = S.height(x, z - r), h3 = S.height(x, z + r); return { dx: (h1 - h0) / (2 * r), dz: (h3 - h2) / (2 * r) }; },
      update(dt, camPos) {
        S.time += dt; U.uTime.value = S.time; U.uSea.value = S.sea; U.uCam.value.copy(camPos);
        const a = S.dayT * Math.PI * 2;
        const sd = new THREE.Vector3(Math.cos(a) * 0.85, Math.sin(a), -0.5).normalize();
        U.uSunDir.value.copy(sd); U.uMoonDir.value.set(-sd.x, -sd.y, sd.z).normalize();
        const e = sd.y; S.sunEl = e;
        const night = 1 - smooth(-0.32, -0.02, e), duskW = (1 - smooth(0.0, 0.32, e)) * (1 - night);
        S.night = night; U.uNight.value = night;
        const mixTo = (key, u) => { lerpC(PAL.day[key], PAL.dusk[key], duskW + night, tmp); lerpC(tmp, PAL.night[key], night, u); };
        mixTo('zenith', U.uZenith.value); mixTo('horizon', U.uHorizon.value); mixTo('sun', U.uSunCol.value); mixTo('deep', U.uDeep.value); mixTo('shallow', U.uShallow.value);
        sun.position.copy(sd).multiplyScalar(60); sun.color.copy(U.uSunCol.value);
        sun.intensity = (0.15 + 2.0 * smooth(-0.05, 0.35, e)) * (1 - night * 0.9) + 0.45 * night;
        if (night > 0.5) sun.position.copy(U.uMoonDir.value).multiplyScalar(60);   // 밤엔 달빛
        hemi.color.copy(U.uZenith.value).lerp(new THREE.Color(0xffffff), 0.35); hemi.groundColor.copy(U.uDeep.value); hemi.intensity = 0.6 + 0.55 * (1 - night);
        U.uLamp.value = night * 2.4;
        floor.material.color.copy(U.uDeep.value).multiplyScalar(0.55);
      },
    };
    return S;
  }
  window.SEA = { build, height };
})();
