// sky.js — 하늘·해·달·별·안개·빛. 시각(T.clock)에 따라 낮·저녁·밤.
(function () {
  let sun, hemi, fill, dome, stars, pmrem, envRT, uni;
  const KEYS = [   // 시각, 하늘 위, 지평선, 안개, 해빛 색, 해빛 세기, 반구 세기, 노출
    [0, '#060a18', '#18203a', '#141a2e', '#9ab0e8', 0.5, 0.42, 1.0],
    [4.5, '#0a1024', '#1d2440', '#161c32', '#9ab0e8', 0.45, 0.42, 1.0],
    [5.6, '#3a4a7a', '#e8a07a', '#b09090', '#ffb07a', 0.9, 0.6, 1.0],
    [7.5, '#5c8fd0', '#cfe0ea', '#b9ccd6', '#fff0d6', 2.6, 1.0, 1.0],
    [12, '#4f86d0', '#d6e6ef', '#c2d4de', '#fffaf0', 3.1, 1.12, 1.0],
    [17.5, '#5a88c8', '#e6e0d0', '#cfd2cc', '#ffe6c0', 2.6, 1.0, 1.0],
    [20.2, '#3c4f86', '#f0a070', '#c89a88', '#ff9a5a', 1.2, 0.62, 1.0],
    [21.4, '#16204a', '#5a4468', '#302c48', '#9a8ac8', 0.45, 0.4, 1.0],
    [22.5, '#070b1c', '#18203a', '#141a2e', '#9ab0e8', 0.5, 0.42, 1.0],
    [24, '#060a18', '#18203a', '#141a2e', '#9ab0e8', 0.5, 0.42, 1.0],
  ].map(k => [k[0], new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3]), new THREE.Color(k[4]), k[5], k[6], k[7]]);

  const cur = { top: new THREE.Color(), hor: new THREE.Color(), fog: new THREE.Color(), sunC: new THREE.Color(), sunI: 1, hemiI: 1, night: 0 };

  function sample(h) {
    h = ((h % 24) + 24) % 24;
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
    const a = KEYS[i], b = KEYS[i + 1];
    const t = (h - a[0]) / (b[0] - a[0]);
    cur.top.copy(a[1]).lerp(b[1], t);
    cur.hor.copy(a[2]).lerp(b[2], t);
    cur.fog.copy(a[3]).lerp(b[3], t);
    cur.sunC.copy(a[4]).lerp(b[4], t);
    cur.sunI = U.lerp(a[5], b[5], t);
    cur.hemiI = U.lerp(a[6], b[6], t);
    cur.night = 1 - U.smoothstep(4.8, 6.4, h) + U.smoothstep(20.6, 22.2, h);
    cur.night = U.clamp(cur.night, 0, 1);
  }

  const sunDir = new THREE.Vector3();
  function sunAt(h) {
    // 해: 5시에 동쪽에서 떠서 21시에 서쪽으로. 밤엔 달이 같은 길을 반대로 돈다.
    const day = h >= 5 && h <= 21.3;
    const k = day ? (h - 5) / 16.3 : ((h + 24 - 21.3) % 24) / 7.7;
    const a = k * Math.PI;
    const el = Math.sin(a) * (day ? 0.95 : 0.8) + 0.05;
    sunDir.set(Math.cos(a) * 0.95, el, -0.35 - Math.sin(a) * 0.2).normalize();
    return day;
  }

  function build(scene, ren) {
    uni = {
      top: { value: new THREE.Color() }, hor: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() },
      night: { value: 0 }, isDay: { value: 1 }, time: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*p; gl_Position.z = gl_Position.w; }`,
      fragmentShader: `
        uniform vec3 top, hor, sunCol, sunDir; uniform float night, isDay, time; varying vec3 vDir;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
        float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
        void main(){
          vec3 d = normalize(vDir);
          float y = max(d.y, 0.0);
          vec3 c = mix(hor, top, pow(y, 0.55));
          float s = max(dot(d, sunDir), 0.0);
          if (isDay > 0.5) {
            c += sunCol * (pow(s, 900.0) * 18.0 + pow(s, 12.0) * 0.28 + pow(s, 3.0) * 0.08 * (1.0 - y));
          } else {
            c += vec3(0.95,0.97,1.0) * (smoothstep(0.9993, 0.9996, s) * 3.2 + pow(s, 60.0) * 0.12);
          }
          // 구름 (느리게 흐름)
          vec2 uv = d.xz / (d.y + 0.12) * 1.6 + vec2(time * 0.004, time * 0.0015);
          float cl = n3(vec3(uv, 1.0)) * 0.55 + n3(vec3(uv * 2.3, 2.0)) * 0.3 + n3(vec3(uv * 5.1, 3.0)) * 0.15;
          cl = smoothstep(0.52, 0.8, cl) * smoothstep(0.02, 0.25, d.y);
          vec3 cc = mix(vec3(1.0), sunCol, 0.35) * mix(1.05, 0.12, night);
          c = mix(c, cc, cl * 0.78);
          // 별
          if (night > 0.01) {
            vec3 q = floor(d * 380.0);
            float st = step(0.9975, hash(q)) * smoothstep(0.02, 0.3, d.y) * (1.0 - cl);
            c += vec3(st) * night * (0.6 + 0.4 * sin(time * 2.0 + hash(q) * 40.0));
          }
          // 지평선 아래는 안개색
          c = mix(c, hor, smoothstep(0.0, -0.08, d.y));
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    dome = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), mat);
    dome.frustumCulled = false;
    dome.renderOrder = -1;
    scene.add(dome);

    scene.fog = new THREE.Fog(0xc2d4de, 60, 520);

    hemi = new THREE.HemisphereLight(0xcfe3ff, 0x4d5a36, 0.8);
    scene.add(hemi);
    fill = new THREE.DirectionalLight(0xaec6ff, 0.25);
    fill.position.set(-50, 40, 60);
    scene.add(fill);
    sun = new THREE.DirectionalLight(0xfff0d6, 2.6);
    sun.castShadow = true;
    const S = sun.shadow;
    S.mapSize.set(2048, 2048);
    S.camera.left = -38; S.camera.right = 38; S.camera.top = 38; S.camera.bottom = -38;
    S.camera.near = 1; S.camera.far = 260;
    S.bias = -0.0004; S.normalBias = 0.04;
    scene.add(sun); scene.add(sun.target);

    pmrem = new THREE.PMREMGenerator(ren);
    bakeEnv(scene, ren, true);
  }

  // 하늘을 환경맵으로 굽는다 (시각이 크게 바뀔 때만)
  let lastEnvH = -99;
  const envScene = new THREE.Scene();
  function bakeEnv(scene, ren, force) {
    const h = T.clock;
    if (!force && Math.abs(U.angDiff(lastEnvH / 24 * U.TAU, h / 24 * U.TAU)) < 0.12) return;
    lastEnvH = h;
    apply(h);
    const d2 = dome.clone();
    d2.geometry = new THREE.SphereGeometry(50, 32, 16);
    envScene.clear(); envScene.add(d2);
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(envScene, 0, 0.1, 100);
    scene.environment = envRT.texture;
  }

  function apply(h) {
    sample(h);
    const day = sunAt(h);
    uni.top.value.copy(cur.top); uni.hor.value.copy(cur.hor);
    uni.sunDir.value.copy(sunDir); uni.sunCol.value.copy(cur.sunC);
    uni.night.value = cur.night; uni.isDay.value = day ? 1 : 0;
  }

  const _v = new THREE.Vector3();
  function update(dt, cam, focus) {
    const h = T.clock;
    apply(h);
    uni.time.value = T.time;
    dome.position.copy(cam.position);
    const scene = T.scene;
    scene.fog.color.copy(cur.fog);
    const nightFog = cur.night;
    scene.fog.near = U.lerp(55, 25, nightFog);
    scene.fog.far = U.lerp(360, 260, nightFog);   // 맵 60% 에 맞춤 (2026-09-17)
    hemi.intensity = cur.hemiI * (window.T.kupala >= 2 ? 1.25 : 1);
    hemi.color.copy(cur.top).lerp(new THREE.Color(1, 1, 1), 0.55);
    hemi.groundColor.set(0x4d5a36).multiplyScalar(U.lerp(1, 0.35, cur.night));
    sun.color.copy(cur.sunC);
    sun.intensity = cur.sunI;
    fill.intensity = U.lerp(0.28, 0.08, cur.night);
    // 그림자 상자는 주인공을 따라다닌다 (격자에 맞춰 떨림 막기)
    const f = focus || cam.position;
    const snap = 76 / 2048 * 2;
    _v.set(Math.round(f.x / snap) * snap, 0, Math.round(f.z / snap) * snap);
    sun.target.position.set(_v.x, TER.H(_v.x, _v.z), _v.z);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 120);
    T.renderer.toneMappingExposure = U.lerp(1.0, 1.25, cur.night);
    bakeEnv(scene, T.renderer, false);
  }

  window.SKY = { get dome() { return dome; }, build, update, sample, cur, get sun() { return sun; }, get sunDir() { return sunDir; } };
})();
