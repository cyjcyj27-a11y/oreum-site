// 만화 셀셰이딩 바탕: 세 단계 명암 재질, 화면 기준 윤곽선, 정적 물건 합치기(Batch).
(function () {
  const T = (window.TOON = {});
  // 명암 세 단계(그늘·중간·밝음). Nearest 로 경계를 딱 끊는다.
  const g = new THREE.DataTexture(new Uint8Array([105, 105, 105, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  g.minFilter = g.magFilter = THREE.NearestFilter; g.generateMipmaps = false; g.needsUpdate = true;
  T.grad = g;
  T.mat = (o) => new THREE.MeshToonMaterial(Object.assign({ gradientMap: g }, o || {}));
  T.vmat = T.mat({ vertexColors: true });
  const cache = {};
  T.col = function (hex) { if (!cache[hex]) cache[hex] = T.mat({ color: hex }); return cache[hex]; };

  // 윤곽선: 뒷면만 그리고, 꼭짓점을 화면 기준 같은 두께만큼 바깥으로 민다.
  T.olU = { ow: { value: 0.0045 }, col: { value: new THREE.Color('#1c1426') } };
  T.ol = new THREE.ShaderMaterial({
    uniforms: T.olU, side: THREE.BackSide,
    vertexShader: 'attribute vec3 onrm; uniform float ow; void main(){ vec4 p = modelViewMatrix*vec4(position,1.0); vec3 n = normalize(normalMatrix*onrm); p.xyz += n*ow*max(-p.z,0.02); gl_Position = projectionMatrix*p; }',
    fragmentShader: 'uniform vec3 col; void main(){ gl_FragColor = vec4(col,1.0); }',
  });
  // 화면 높이에 맞춰 선 두께(약 2.2px)
  T.setLine = function (H, fov) { T.olU.ow.value = (2.3 * 2 * Math.tan((fov * Math.PI) / 360)) / Math.max(300, H); };

  // 모서리 있는 도형도 윤곽선이 갈라지지 않게: 같은 자리 꼭짓점의 법선을 평균낸 onrm
  T.onrm = function (geo) {
    const p = geo.attributes.position, n = geo.attributes.normal, map = new Map(), out = new Float32Array(p.count * 3);
    const key = (i) => Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
    for (let i = 0; i < p.count; i++) { const k = key(i); let a = map.get(k); if (!a) map.set(k, (a = [0, 0, 0])); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); }
    for (let i = 0; i < p.count; i++) { const a = map.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; out[i * 3] = a[0] / l; out[i * 3 + 1] = a[1] / l; out[i * 3 + 2] = a[2] / l; }
    geo.setAttribute('onrm', new THREE.BufferAttribute(out, 3));
    return geo;
  };
  // 메시 하나에 윤곽선 짝을 붙인다(같은 도형, 윤곽 재질)
  T.outline = function (mesh) {
    if (!mesh.geometry.attributes.onrm) T.onrm(mesh.geometry);
    const o = new THREE.Mesh(mesh.geometry, T.ol);
    o.castShadow = false; o.receiveShadow = false; o.frustumCulled = mesh.frustumCulled;
    mesh.add(o); mesh.userData.ol = o;
    return mesh;
  };
  // 도형 + 색 한 덩어리(윤곽선 포함)
  T.mesh = function (geo, color, ol, mat) {
    const m = new THREE.Mesh(geo, mat || T.col(color));
    m.castShadow = true; m.receiveShadow = true;
    if (ol !== false) T.outline(m);
    return m;
  };

  // ---------- 정적 물건 합치기 ----------
  const _m = new THREE.Matrix4(), _n = new THREE.Matrix3(), _v = new THREE.Vector3(), _c = new THREE.Color();
  T.Batch = function () { this.pos = []; this.nor = []; this.onr = []; this.col = []; };
  // geo 는 버려도 되는 도형. color 는 '#hex' 또는 (x,y,z,c)=>{} 로 색을 고르는 함수. jitter 는 밝기 흔들기
  T.Batch.prototype.add = function (geo, color, mat4, jitter) {
    let g2 = geo.index ? geo.toNonIndexed() : geo;
    if (!g2.attributes.onrm) T.onrm(g2);
    const P = g2.attributes.position, N = g2.attributes.normal, O = g2.attributes.onrm;
    _m.copy(mat4 || new THREE.Matrix4()); _n.getNormalMatrix(_m);
    const fn = typeof color === 'function' ? color : null;
    if (!fn) _c.set(color);
    const j = jitter || 0;
    for (let i = 0; i < P.count; i += 3) {
      // 면(삼각형)마다 같은 색 흔들기 → 손으로 칠한 얼룩
      const k = j ? 1 + (Math.random() - 0.5) * j : 1;
      const p0 = this.pos.length;
      for (let t = 0; t < 3; t++) {
        const q = i + t;
        _v.set(P.getX(q), P.getY(q), P.getZ(q)).applyMatrix4(_m); this.pos.push(_v.x, _v.y, _v.z);
        _v.set(N.getX(q), N.getY(q), N.getZ(q)).applyMatrix3(_n).normalize(); this.nor.push(_v.x, _v.y, _v.z);
        _v.set(O.getX(q), O.getY(q), O.getZ(q)).applyMatrix3(_n).normalize(); this.onr.push(_v.x, _v.y, _v.z);
      }
      // 색 함수는 면 가운데 자리·법선으로 한 번(무늬가 면 단위로 또렷하게)
      if (fn && fn.pv) {
        // 꼭짓점마다 색(둥근 몸의 줄무늬가 삼각형으로 깨지지 않게)
        for (let t = 0; t < 3; t++) { const a = this.pos, q = p0 + t * 3; fn(a[q], a[q + 1], a[q + 2], _c); this.col.push(_c.r * k, _c.g * k, _c.b * k); }
        continue;
      }
      if (fn) {
        const a = this.pos, cx = (a[p0] + a[p0 + 3] + a[p0 + 6]) / 3, cy = (a[p0 + 1] + a[p0 + 4] + a[p0 + 7]) / 3, cz = (a[p0 + 2] + a[p0 + 5] + a[p0 + 8]) / 3, nn = this.nor;
        fn(cx, cy, cz, _c, nn[p0], nn[p0 + 1], nn[p0 + 2]);
      }
      for (let t = 0; t < 3; t++) this.col.push(_c.r * k, _c.g * k, _c.b * k);
    }
    return this;
  };
  // 상자 하나(최솟점·최댓점)
  T.Batch.prototype.box = function (x0, y0, z0, x1, y1, z1, color, jitter, cell) {
    const sx = x1 - x0, sy = y1 - y0, sz = z1 - z0, cs = (s) => (cell ? Math.max(1, Math.round(s / cell)) : 1);
    const g = new THREE.BoxGeometry(sx, sy, sz, cs(sx), cs(sy), cs(sz));
    return this.add(g, color, new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), jitter);
  };
  T.Batch.prototype.build = function (opts) {
    opts = opts || {};
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    geo.setAttribute('onrm', new THREE.Float32BufferAttribute(this.onr, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    const m = new THREE.Mesh(geo, opts.mat || T.vmat);
    m.castShadow = !!opts.cast; m.receiveShadow = opts.receive !== false;
    if (opts.ol !== false) T.outline(m);
    return m;
  };
  T.M = function (x, y, z, rx, ry, rz, sx, sy, sz) {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy || sx || 1, sz || sx || 1));
    return m;
  };
})();
