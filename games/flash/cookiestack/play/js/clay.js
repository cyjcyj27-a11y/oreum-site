// 점토 재질과 모양.
// 재질: 코드로 그린 지문·손자국 법선 그림 한 장을 모든 점토가 나눠 쓴다. 색마다 재질 하나(캐시).
// 모양: 구·캡슐·둥근 상자를 저주파 울퉁불퉁하게 밀어 손으로 빚은 느낌. 고정 물체는 Batch 로 재질마다 한 덩어리.
(function () {
  const C = (window.CLAY = {});
  let seed = 12345;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  C.srand = (s) => { seed = s | 0 || 1; };
  C.rnd = rnd;

  // ---------- 지문 법선 그림 ----------
  function makeNormalTex() {
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const g = cv.getContext('2d');
    g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, N, N);
    const wrap = (fn) => { for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) { g.save(); g.translate(ox, oy); fn(); g.restore(); } };
    C.srand(777);
    // 큰 손바닥 눌림(부드러운 높낮이)
    for (let i = 0; i < 26; i++) {
      const x = rnd() * N, y = rnd() * N, r = 30 + rnd() * 90, up = rnd() < 0.5;
      wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); const c = up ? '255,255,255' : '0,0,0'; gr.addColorStop(0, 'rgba(' + c + ',.16)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
    }
    // 지문: 겹친 타원 고리
    for (let i = 0; i < 9; i++) {
      const x = rnd() * N, y = rnd() * N, rx = 22 + rnd() * 16, ry = rx * (1.25 + rnd() * 0.3), rot = rnd() * Math.PI;
      wrap(() => {
        g.save(); g.translate(x, y); g.rotate(rot);
        for (let k = 1; k < 12; k++) { g.beginPath(); g.ellipse(0, 0, rx * k / 11, ry * k / 11, 0, rnd() * 0.6, Math.PI * 2 - rnd() * 0.6); g.strokeStyle = 'rgba(0,0,0,' + (0.13 + rnd() * 0.06) + ')'; g.lineWidth = 1.4; g.stroke(); }
        g.restore();
      });
    }
    // 도구 긁힘·잔 알갱이
    for (let i = 0; i < 60; i++) {
      const x = rnd() * N, y = rnd() * N, a = rnd() * 6.28, l = 6 + rnd() * 26;
      wrap(() => { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1 + rnd(); g.stroke(); });
    }
    for (let i = 0; i < 1800; i++) { const x = rnd() * N, y = rnd() * N; g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)'; g.fillRect(x, y, 1.5, 1.5); }
    // 높이 → 법선
    const src = g.getImageData(0, 0, N, N).data, out = g.createImageData(N, N), o = out.data;
    const h = (x, y) => src[(((y + N) % N) * N + ((x + N) % N)) * 4] / 255;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = (h(x - 1, y) - h(x + 1, y)) * 2.2, dy = (h(x, y - 1) - h(x, y + 1)) * 2.2, l = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4; o[i] = (dx / l * 0.5 + 0.5) * 255; o[i + 1] = (dy / l * 0.5 + 0.5) * 255; o[i + 2] = (1 / l * 0.5 + 0.5) * 255; o[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.repeat.set(2, 2);
    return t;
  }
  let NT = null;
  const mats = {};
  // 점토 재질: color, 광택(rough), 지문 세기(ns)
  C.mat = function (color, o) {
    o = o || {};
    const key = color + '|' + (o.rough || 0.5) + '|' + (o.ns == null ? 0.55 : o.ns) + '|' + (o.emis || '') + '|' + (o.ei || '') + '|' + (o.side || '') + '|' + (o.flat || '') + '|' + (o.op || '') + '|' + (o.vc || '');
    if (mats[key]) return mats[key];
    if (!NT) NT = makeNormalTex();
    const ns = o.ns == null ? 0 : o.ns;
    const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: o.rough || 0.5, metalness: 0, normalMap: ns === 0 ? null : NT, normalScale: new THREE.Vector2(ns, ns) });
    if (o.emis) { m.emissive = new THREE.Color(o.emis); m.emissiveIntensity = o.ei || 1; }
    if (o.side) m.side = THREE.DoubleSide;
    if (o.flat) m.flatShading = true;
    if (o.vc) m.vertexColors = true;
    if (o.op) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
    C.patch(m, o.fs || 1, o.fa == null ? 1 : o.fa);
    mats[key] = m;
    return m;
  };
  // 점토 표면: 물체 좌표의 3D 잡음으로 손자국 눌림 + 지문 고리를 셰이더에서 법선으로 만든다(UV 상관없음).
  // fs = 무늬 크기 배율(작은 인형은 크게), fa = 세기
  const GLSL = `
varying vec3 vCP;
uniform float uClayS; uniform float uClayA;
float cH(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7)))*43758.5453); }
float cN(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(cH(i),cH(i+vec3(1,0,0)),f.x),mix(cH(i+vec3(0,1,0)),cH(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(cH(i+vec3(0,0,1)),cH(i+vec3(1,0,1)),f.x),mix(cH(i+vec3(0,1,1)),cH(i+vec3(1,1,1)),f.x),f.y),f.z); }
float clayHeight(vec3 p){
  float h = cN(p*1.1)*0.22 + cN(p*2.7)*0.1 + cN(p*8.0)*0.015;
  // 지문: 칸마다 하나씩, 반쯤만 찍힘
  vec3 q = p*1.6; vec3 ci = floor(q); vec3 cf = fract(q);
  float pr = cH(ci+7.3);
  if(pr > 0.45){ vec3 c = vec3(0.3+0.4*cH(ci+1.1), 0.3+0.4*cH(ci+2.2), 0.3+0.4*cH(ci+3.3));
    vec3 d = cf - c; float r = length(d*vec3(1.0,1.25,1.0));
    float ph = r*95.0 + cN(q*4.0)*3.0; float fw = fwidth(ph);
    h += sin(ph)*0.045*smoothstep(0.3,0.06,r)*smoothstep(1.2,0.35,fw); }
  return h;
}
vec3 clayPerturb(vec3 sp, vec3 sn, vec2 dH, float fd){
  vec3 sx = dFdx(sp), sy = dFdy(sp); vec3 r1 = cross(sy, sn), r2 = cross(sn, sx);
  float det = dot(sx, r1) * fd; vec3 gr = sign(det) * (dH.x*r1 + dH.y*r2);
  return normalize(abs(det)*sn - gr);
}`;
  C.patch = function (m, fs, fa) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uClayS = { value: 2.2 * fs }; sh.uniforms.uClayA = { value: 0.022 * fa };
      sh.vertexShader = 'varying vec3 vCP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvCP = position;');
      sh.fragmentShader = GLSL + '\n' + sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      { float hc = clayHeight(vCP*uClayS); float fadeD = clamp(1.0 - length(vViewPosition)/90.0, 0.0, 1.0);
        vec2 dH = vec2(dFdx(hc), dFdy(hc)) * uClayA * 22.0 * fadeD;
        normal = clayPerturb(-vViewPosition, normal, dH, faceDirection); }`);
    };
    m.customProgramCacheKey = () => 'clay';
    return m;
  };
  C.normalTex = () => { if (!NT) NT = makeNormalTex(); return NT; };

  // ---------- 울퉁불퉁 ----------
  function hash(x, y, z) { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); }
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
    const s = (t) => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf);
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
      l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w) * 2 - 1;
  }
  C.noise = vnoise;
  // 가운데에서 바깥으로 밀어 울퉁불퉁하게(이음매가 벌어지지 않게 방향은 위치로 정함)
  C.lump = function (geo, amp, freq, sd) {
    const p = geo.attributes.position, v = new THREE.Vector3(), d = new THREE.Vector3(), so = (sd || 0) * 13.7;
    geo.computeBoundingBox(); const c = new THREE.Vector3(); geo.boundingBox.getCenter(c);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      d.copy(v).sub(c); const len = d.length() || 1;
      const n = vnoise(v.x * freq + so, v.y * freq + so * 0.7, v.z * freq - so) + 0.5 * vnoise(v.x * freq * 2.3 - so, v.y * freq * 2.3, v.z * freq * 2.3 + so);
      v.addScaledVector(d.divideScalar(len), n * amp);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  };
  // ---------- 모양 ----------
  C.ball = (r, seg, amp, sd) => C.lump(new THREE.SphereGeometry(r, seg || 18, Math.max(8, ((seg || 18) * 0.7) | 0)), amp == null ? r * 0.06 : amp, 2.2 / Math.max(r, 0.05), sd);
  C.capsule = (r, len, amp, sd) => C.lump(new THREE.CapsuleGeometry(r, len, 6, 14), amp == null ? r * 0.07 : amp, 2 / Math.max(r, 0.05), sd);
  // 둥근 상자: 안쪽 상자에서 반지름 r 만큼 부풀림
  C.rbox = function (w, h, d, r, amp, sd) {
    r = Math.min(r, w / 2, h / 2, d / 2);
    const st = C.step || 0.25, sx = Math.max(2, Math.ceil(w / st)), sy = Math.max(2, Math.ceil(h / st)), sz = Math.max(2, Math.ceil(d / st));
    const g = new THREE.BoxGeometry(w, h, d, Math.min(sx, 20), Math.min(sy, 20), Math.min(sz, 20));
    const p = g.attributes.position, v = new THREE.Vector3(), q = new THREE.Vector3(), dd = new THREE.Vector3();
    const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      q.set(Math.max(-ix, Math.min(ix, v.x)), Math.max(-iy, Math.min(iy, v.y)), Math.max(-iz, Math.min(iz, v.z)));
      dd.copy(v).sub(q); const l = dd.length();
      if (l > 1e-6) v.copy(q).addScaledVector(dd.divideScalar(l), r);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    // 상자 면이 갈라지지 않게 같은 자리 꼭짓점의 법선을 합친다
    g.deleteAttribute('normal');
    const m = mergeNear(g);
    return C.lump(m, amp == null ? Math.min(w, h, d) * 0.025 : amp, 1.6 / Math.max(0.2, Math.min(w, h, d)), sd);
  };
  // 같은 자리 꼭짓점 합치기(BufferGeometryUtils.mergeVertices 대신)
  function mergeNear(g) {
    const p = g.attributes.position, uv = g.attributes.uv, idx = g.index ? g.index.array : null;
    const map = new Map(), P = [], U = [], remap = new Array(p.count);
    for (let i = 0; i < p.count; i++) {
      const k = Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4);
      let j = map.get(k);
      if (j == null) { j = P.length / 3; map.set(k, j); P.push(p.getX(i), p.getY(i), p.getZ(i)); U.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0); }
      remap[i] = j;
    }
    const I = [];
    if (idx) for (let i = 0; i < idx.length; i++) I.push(remap[idx[i]]); else for (let i = 0; i < p.count; i++) I.push(remap[i]);
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    out.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    out.setIndex(I);
    out.computeVertexNormals();
    return out;
  }
  C.mergeNear = mergeNear;
  // 둥근 원기둥(양끝 둥글림)
  C.rcyl = function (rt, rb, h, rr, seg, amp, sd) {
    rr = Math.min(rr, h / 2, Math.min(rt, rb));
    const pts = [], n = 5;
    pts.push(new THREE.Vector2(0, -h / 2));
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(rb - rr + Math.cos(a) * rr, -h / 2 + rr + Math.sin(a) * rr)); }
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new THREE.Vector2(rt - rr + Math.cos(a) * rr, h / 2 - rr + Math.sin(a) * rr)); }
    pts.push(new THREE.Vector2(0, h / 2));
    const g = mergeNear(new THREE.LatheGeometry(pts, seg || 20));
    return C.lump(g, amp == null ? Math.max(rt, rb) * 0.05 : amp, 1.8 / Math.max(0.1, Math.max(rt, rb)), sd);
  };

  // ---------- 고정 물체 묶기 ----------
  // 같은 재질끼리 한 덩어리로 합쳐 그리기 명령을 줄인다.
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
  C.Batch = function () { this.items = new Map(); };
  C.Batch.prototype.add = function (geo, mat, pos, rot, scl) {
    const m = new THREE.Matrix4();
    _e.set(rot ? rot[0] : 0, rot ? rot[1] : 0, rot ? rot[2] : 0); _q.setFromEuler(_e);
    _v.set(pos[0], pos[1], pos[2]); _s.set(scl ? scl[0] : 1, scl ? scl[1] : 1, scl ? scl[2] : 1);
    m.compose(_v, _q, _s);
    return this.addM(geo, mat, m);
  };
  C.Batch.prototype.addM = function (geo, mat, m) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(m);
    if (!this.items.has(mat)) this.items.set(mat, []);
    this.items.get(mat).push(g);
    return this;
  };
  C.Batch.prototype.build = function (parent, cast, recv) {
    const out = [];
    this.items.forEach((list, mat) => {
      let n = 0; list.forEach((g) => (n += g.attributes.position.count));
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2);
      let o = 0;
      list.forEach((g) => { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); U.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(P, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(N, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      bg.computeBoundingSphere();
      const mesh = new THREE.Mesh(bg, mat); mesh.castShadow = cast !== false; mesh.receiveShadow = recv !== false; mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      parent.add(mesh); out.push(mesh);
    });
    this.items.clear();
    return out;
  };
})();
