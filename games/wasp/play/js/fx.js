// 효과: 스프레이 안개(점), 흙먼지, 봉투 끈. 미리 만든 통에서 다시 쓴다(새 객체 안 만듦).
(function () {
  const F = (window.FX = {});
  const MAXP = 420;
  let pts, pos, alpha, size, vel, life, max, n = 0, kind;
  F.init = function (scene) {
    const g = new THREE.BufferGeometry();
    pos = new Float32Array(MAXP * 3); alpha = new Float32Array(MAXP); size = new Float32Array(MAXP); vel = new Float32Array(MAXP * 3); life = new Float32Array(MAXP); max = new Float32Array(MAXP); kind = new Uint8Array(MAXP);
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aS', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aK', new THREE.BufferAttribute(kind, 1).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uH: { value: 600 } },
      vertexShader: 'attribute float aA; attribute float aS; attribute float aK; varying float vA; varying float vK; uniform float uH; void main(){ vA=aA; vK=aK; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = aS*uH/(-mv.z); }',
      fragmentShader: 'varying float vA; varying float vK; void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if(d>0.5) discard; float s = smoothstep(0.5,0.1,d); vec3 col = vK<0.5 ? vec3(0.96,0.98,1.0) : (vK<1.5 ? vec3(0.62,0.5,0.36) : vec3(1.0,0.85,0.3)); gl_FragColor = vec4(col, s*vA); }',
    });
    pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5;
    scene.add(pts);
    F.mat = m;
  };
  F.resize = function (h) { if (F.mat) F.mat.uniforms.uH.value = h * 0.9; };
  function add(x, y, z, vx, vy, vz, l, s, k) {
    let i = n; if (n < MAXP) n++; else { i = (Math.random() * MAXP) | 0; }
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz; life[i] = l; max[i] = l; size[i] = s; kind[i] = k; alpha[i] = 0;
  }
  // 스프레이: 노즐에서 겨눈 쪽으로 퍼지는 안개
  F.spray = function (o, d, range, spread, dt) {
    const k = Math.ceil(dt * 160);
    for (let i = 0; i < k; i++) {
      const sp = range * (2.2 + Math.random() * 0.6);
      const jx = (Math.random() - 0.5) * 2 * spread, jy = (Math.random() - 0.5) * 2 * spread, jz = (Math.random() - 0.5) * 2 * spread;
      add(o.x, o.y, o.z, (d.x + jx) * sp, (d.y + jy) * sp, (d.z + jz) * sp, 0.42 + Math.random() * 0.12, 0.05, 0);
    }
  };
  F.dust = function (p, count, k) { for (let i = 0; i < count; i++) { const a = Math.random() * 6.28, s = 0.6 + Math.random() * 1.6; add(p.x, p.y + 0.05, p.z, Math.cos(a) * s, 0.4 + Math.random() * 1.2, Math.sin(a) * s, 0.5 + Math.random() * 0.4, 0.12 + Math.random() * 0.1, k == null ? 1 : k); } };
  F.update = function (dt) {
    for (let i = 0; i < n; i++) {
      if (life[i] <= 0) { alpha[i] = 0; continue; }
      life[i] -= dt;
      const t = 1 - life[i] / max[i];
      const drag = kind[i] === 0 ? 3.2 : 2.2;
      vel[i * 3] *= 1 - drag * dt; vel[i * 3 + 1] *= 1 - drag * dt; vel[i * 3 + 2] *= 1 - drag * dt;
      if (kind[i] === 1) vel[i * 3 + 1] -= 2.5 * dt;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (kind[i] === 0) { size[i] = 0.06 + t * 0.85; alpha[i] = Math.min(1, t * 5) * (1 - t * t) * 0.8; }
      else { size[i] = 0.14 + t * 0.25; alpha[i] = (1 - t) * 0.7; }
    }
    const g = pts.geometry; g.attributes.position.needsUpdate = true; g.attributes.aA.needsUpdate = true; g.attributes.aS.needsUpdate = true; g.attributes.aK.needsUpdate = true;
    g.setDrawRange(0, n);
  };
  F.clear = function () { for (let i = 0; i < n; i++) life[i] = 0; n = 0; };
})();
