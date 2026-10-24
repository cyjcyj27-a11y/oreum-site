// 그리기 바탕: 렌더러·장면·빛·노을 하늘·카메라. 점광 없음, 그림자 빛 하나.
(function () {
  const R = (window.RND = {});
  R.q = 1; // 품질 단계(1 보통, 0 낮춤)
  R.init = function (canvas) {
    const lowQ = (() => { try { return localStorage.getItem('mogiz.lowq') === '1'; } catch (e) { return false; } })();
    R.q = lowQ ? 0 : 1;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, R.q ? 1.25 : 1));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; r.shadowMap.autoUpdate = false; R.shN = 0;
    R.renderer = r;
    const s = (R.scene = new THREE.Scene());
    R.camera = new THREE.PerspectiveCamera(62, 1, 0.006, 70);
    // 노을 하늘: 위 짙은 남보라 → 가운데 분홍 → 지평선 주황, 별 몇 개
    const skyG = new THREE.SphereGeometry(55, 32, 16);
    const skyM = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#2b2a63') }, mid: { value: new THREE.Color('#b65f8f') }, hor: { value: new THREE.Color('#ffae6b') }, bot: { value: new THREE.Color('#3a3047') } },
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: [
        'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 bot; varying vec3 vp;',
        'float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
        'void main(){ vec3 d = normalize(vp); float h = d.y; vec3 c;',
        ' if(h > 0.0){ float a = smoothstep(0.0,0.18,h); float b = smoothstep(0.12,0.62,h); c = mix(hor, mid, a); c = mix(c, top, b);',
        '  // 만화 하늘: 색 띠를 세 칸으로 끊는다',
        '  c = mix(c, floor(c*7.0+0.5)/7.0, 0.55);',
        '  vec2 g = floor(vec2(atan(d.z,d.x)*170.0, h*170.0)); float s = step(0.996, h21(g)) * smoothstep(0.3,0.7,h); c += vec3(s);',
        ' } else { c = mix(hor*0.6, bot, clamp(-h*5.0,0.0,1.0)); }',
        ' gl_FragColor = vec4(c,1.0); }',
      ].join('\n'),
    });
    R.sky = new THREE.Mesh(skyG, skyM); R.sky.renderOrder = -1; s.add(R.sky);
    // 달
    const moon = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ color: '#fff4cf', fog: false }));
    moon.position.set(-18, 22, 40); moon.lookAt(0, 0, 0); s.add(moon); R.moon = moon;
    s.fog = new THREE.Fog('#8a5a7a', 14, 50);
    // 빛: 따뜻한 위쪽 해(집 안 형광등 겸) + 반구광(보라 하늘 / 갈색 땅) + 반대편 약한 푸른 채움
    R.hemi = new THREE.HemisphereLight('#ffe9d2', '#6a4a52', 1.25); s.add(R.hemi);
    const sun = (R.sun = new THREE.DirectionalLight('#fff1dc', 1.9));
    sun.castShadow = true;
    const sm = R.q ? 2048 : 1024; sun.shadow.mapSize.set(sm, sm);
    const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 0.5; sc.far = 40;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.012;
    R.sunDir = new THREE.Vector3(0.35, 1, 0.45).normalize();
    sun.position.copy(R.sunDir).multiplyScalar(18); sun.target.position.set(0, 0, -3);
    s.add(sun); s.add(sun.target);
    const fill = new THREE.DirectionalLight('#9fb4ff', 0.35); fill.position.set(-6, 4, 8); s.add(fill);
    R.resize();
    window.addEventListener('resize', R.resize);
    return R;
  };
  R.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.renderer.setSize(w, h, false);
    R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
    TOON.setLine(h, R.camera.fov);
  };
  // 그림자 상자가 따라오게(집 안은 고정, 마당은 모기 근처)
  R.follow = function (p) {
    const cx = THREE.MathUtils.clamp(p.x, -4, 4), cz = THREE.MathUtils.clamp(p.z, -5, 3);
    R.sun.position.set(cx + R.sunDir.x * 18, R.sunDir.y * 18, cz + R.sunDir.z * 18);
    R.sun.target.position.set(cx, 0, cz);
    R.sky.position.set(p.x, 0, p.z);
  };
  // 그림자는 세 장면에 한 번만 다시 그림(집은 가만히 있고 사람 팔만 조금 움직임)
  R.render = function () { if (R.shN++ % 3 === 0) R.renderer.shadowMap.needsUpdate = true; R.renderer.render(R.scene, R.camera); };
  // 폰·저사양: 처음 3초 프레임을 재서 느리면 한 단계 낮춤(기억)
  let acc = 0, cnt = 0;
  R.measure = function (rdt) {
    if (R.q === 0 || cnt > 200) return;
    acc += rdt; cnt++;
    if (cnt === 180 && acc / cnt > 0.026) R.lower();
  };
  R.lower = function () {
    R.q = 0; R.renderer.setPixelRatio(1); R.resize();
    R.sun.shadow.mapSize.set(1024, 1024); if (R.sun.shadow.map) { R.sun.shadow.map.dispose(); R.sun.shadow.map = null; }
    try { localStorage.setItem('mogiz.lowq', '1'); } catch (e) {}
  };
  // 화면 그림을 tools/shots 로(검사용)
  R.shot = function (name) {
    R.render();
    const d = R.renderer.domElement.toDataURL('image/png');
    return fetch('/save?name=' + encodeURIComponent(name || 'shot.png'), { method: 'POST', body: d }).then((r) => r.text());
  };
})();
