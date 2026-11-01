// 그리기 바탕: 렌더러·장면·빛·하늘·카메라. 점광 없음, 그림자 빛 하나(해).
(function () {
  const R = (window.RND = {});
  R.init = function (canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    R.renderer = r;
    const s = (R.scene = new THREE.Scene());
    R.camera = new THREE.PerspectiveCamera(55, 1, 0.08, 260);
    // 하늘: 위 하늘색 → 지평선 크림 → 아래 연두(점토 무대 배경지)
    const skyG = new THREE.SphereGeometry(200, 32, 16);
    const skyM = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#8fc4e8') }, mid: { value: new THREE.Color('#fbe9c8') }, bot: { value: new THREE.Color('#cfe3a8') } },
      vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vp; void main(){ float h = normalize(vp).y; vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h*1.6,0.0,1.0),0.8)) : mix(mid, bot, clamp(-h*4.0,0.0,1.0)); gl_FragColor = vec4(c,1.0); }',
    });
    R.sky = new THREE.Mesh(skyG, skyM); R.sky.renderOrder = -1; s.add(R.sky);
    s.fog = new THREE.Fog('#f4e6c8', 45, 150);
    // 빛: 따뜻한 해 + 반구광(하늘/땅) + 반대편 약한 채움
    R.hemi = new THREE.HemisphereLight('#fff4e0', '#8a7a5a', 1.1); s.add(R.hemi);
    const sun = (R.sun = new THREE.DirectionalLight('#fff0d6', 2.4));
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 90;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
    s.add(sun); s.add(sun.target);
    R.sunDir = new THREE.Vector3(-0.55, 0.78, 0.35).normalize();
    const fill = new THREE.DirectionalLight('#cfe0ff', 0.45); fill.position.set(10, 6, -12); s.add(fill);
    R.resize();
    window.addEventListener('resize', R.resize);
    return R;
  };
  // 낮/노을
  R.setLight = function (dusk) {
    if (dusk) { R.sunDir.set(-0.8, 0.38, 0.45).normalize(); R.sun.color.set('#ffb070'); R.sun.intensity = 2.3; R.hemi.color.set('#ffd8b0'); R.hemi.groundColor.set('#6a5040'); R.hemi.intensity = 0.95; R.sky.material.uniforms.top.value.set('#6a7ab8'); R.sky.material.uniforms.mid.value.set('#ffb88a'); R.scene.fog.color.set('#f2b890'); }
    else { R.sunDir.set(-0.55, 0.78, 0.35).normalize(); R.sun.color.set('#fff0d6'); R.sun.intensity = 2.4; R.hemi.color.set('#fff4e0'); R.hemi.groundColor.set('#8a7a5a'); R.hemi.intensity = 1.1; R.sky.material.uniforms.top.value.set('#8fc4e8'); R.sky.material.uniforms.mid.value.set('#fbe9c8'); R.scene.fog.color.set('#f4e6c8'); }
  };
  R.resize = function () {
    const w = window.innerWidth, h = window.innerHeight;
    R.renderer.setSize(w, h, false);
    R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  };
  // 그림자 상자가 주인공을 따라가게
  R.follow = function (p) {
    R.sun.position.set(p.x + R.sunDir.x * 40, p.y + R.sunDir.y * 40, p.z + R.sunDir.z * 40);
    R.sun.target.position.set(p.x, p.y, p.z);
    R.sky.position.set(p.x, 0, p.z);
  };
  R.render = function () { R.renderer.render(R.scene, R.camera); };
  // 화면 그림을 tools/shots 로 보냄(검사용)
  R.shot = function (name) {
    R.render();
    const d = R.renderer.domElement.toDataURL('image/png');
    return fetch('/save?name=' + encodeURIComponent(name || 'shot.png'), { method: 'POST', body: d }).then((r) => r.text());
  };
})();
