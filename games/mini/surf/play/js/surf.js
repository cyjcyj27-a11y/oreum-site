/* 서프런 게임(영문 SURF RUN, 옛 임시 제목 파도타기) 3D — 헬라(올가미 언니)가 실제 바다에서 서핑하는 세 줄 러너 (Three.js r159, 2026-10-03 새로 만듦)
 * 그림: 실사풍. 늦은 오후 해(앞 오른쪽 낮게), ACES 톤, 하늘 셰이더 + 환경맵, 거스트너 파도 바다(프레넬 반사·햇빛 윤슬·물마루 거품·햇빛 비침),
 *       왼쪽 큰 청록 파도 벽(마루 거품·물보라), 오른쪽 섬 해안(지형·야자수·등대), 그림자 한 개
 * 단위 m. 앞이 -z. 레일 x = -2.4, 0, 2.4
 * 조작: ←→ 레일, ↑/스페이스/W 점프, ↓/S 덕다이브. 폰은 스와이프
 * 손잡이: window.__sf */
(function () {
'use strict';
var EN = /[?&]lang=en\b/.test(location.search);
if (EN) { document.documentElement.lang = 'en'; document.body.classList.add('en'); }
function L(a) { return a[EN ? 1 : 0]; }
function $(id) { return document.getElementById(id); }
var V3 = THREE.Vector3, PI = Math.PI;
var LANE = 2.4;
var TX = { title: ['서프런 게임', 'SURF RUN'], best: ['BEST ', 'BEST '], nice: ['NICE', 'NICE'], close: ['CLOSE', 'CLOSE'], mission: ['MISSION', 'MISSION'] };
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* ====================================================================== 상태 */
var G = {
  mode: 'load', t: 0, z: 0, dist: 0, speed: 0, lane: 1, x: 0, xv: 0, jy: 0, jv: 0, air: false, duck: 0, danger: 0, coins: 0, mult: 1,
  objs: [], fxs: [], nextZ: 40, dead: false, deadT: 0, magnet: 0, dolphin: 0, shield: 0, bot: false, shake: 0, landT: 0, hitT: 0,
  best: 0, total: 0, mis: [], R: {}, camK: 0
};
/* 상점(10/4 사장님 "둘다 넣어"): 금화로 보드·헬라 옷 색·시작 아이템. 최고 기록은 점수(거리 × 배수 + 금화) */
var SH = { board: 'white', outfit: 'o_white', own: { white: 1, o_white: 1 }, stock: { shield: 0, magnet: 0 } };
try { G.best = +localStorage.getItem('surf3.bestS') || 0; G.total = +localStorage.getItem('surf3.coins') || 0; G.mult = +localStorage.getItem('surf3.mult') || 1; var shv = JSON.parse(localStorage.getItem('surf3.shop') || 'null'); if (shv) { for (var k in shv) SH[k] = shv[k]; } if (String(SH.outfit).indexOf('o_') !== 0) SH.outfit = 'o_white'; } catch (e) {}
function save() { try { localStorage.setItem('surf3.bestS', G.best); localStorage.setItem('surf3.shop', JSON.stringify(SH)); localStorage.setItem('surf3.coins', G.total); localStorage.setItem('surf3.mult', G.mult); localStorage.setItem('surf3.mis', JSON.stringify(G.mis.map(function (m) { return m.id; }))); } catch (e) {} }

/* ====================================================================== 렌더러·빛 */
var cv = $('cv');
var R = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
R.outputColorSpace = THREE.SRGBColorSpace;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.95;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
var S = new THREE.Scene();
var cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1600);
var W = 540, H = 960, WIDE = false, U = 0.5, PR = 1;
var QUAL = 2; try { var qv = localStorage.getItem('surf3.q'); if (qv !== null) QUAL = +qv; } catch (e) {}
var qT = 0, qN = 0;
function qualApply() { R.shadowMap.enabled = QUAL >= 1; resize(); }
function qualWatch(dt) { if (G.mode !== 'play' || QUAL === 0 || dt <= 0) return; qT += dt; qN++; if (qN === 180) { var avg = qT / qN; qT = 0; qN = 0; if (avg > 0.026) { QUAL--; try { localStorage.setItem('surf3.q', QUAL); } catch (e) {} qualApply(); } } }
/* 해: 앞 오른쪽 낮게(물 위 윤슬 길이 화면 가운데로 온다) */
var SUN_DIR = new V3(0.42, 0.3, -1).normalize();
var SUN_COL = new THREE.Color(1.0, 0.82, 0.62);
var sun = new THREE.DirectionalLight(0xffe2bf, 3.0);
sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
var SC = sun.shadow.camera; SC.left = -9; SC.right = 9; SC.top = 9; SC.bottom = -9; SC.near = 1; SC.far = 80; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
S.add(sun); S.add(sun.target);
var hemi = new THREE.HemisphereLight(0xbfdcff, 0x1b5e6e, 1.1); S.add(hemi);
var fill = new THREE.DirectionalLight(0x9fc8ff, 0.6); fill.position.set(-0.6, 0.5, 1); S.add(fill);

/* ====================================================================== 하늘(바다 셰이더도 같은 함수로 하늘을 비춘다) */
var U_SKY = { uSun: { value: SUN_DIR }, uZen: { value: new THREE.Color(0.012, 0.07, 0.36) }, uMid: { value: new THREE.Color(0.2, 0.42, 0.85) }, uHor: { value: new THREE.Color(0.78, 0.66, 0.56) }, uSunCol: { value: SUN_COL }, uT: { value: 0 } };
var SKYFN = [
  'uniform vec3 uSun, uZen, uMid, uHor, uSunCol;',
  'vec3 skyCol(vec3 d){',
  '  float y = max(d.y, 0.0);',
  '  vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.16, y)); c = mix(c, uZen, smoothstep(0.12, 0.75, y));',
  '  c = mix(c, uHor * 0.92, smoothstep(0.0, -0.08, d.y));',
  '  float s = max(dot(d, uSun), 0.0);',
  '  c += uSunCol * (pow(s, 14.0) * 0.3 * (1.0 - smoothstep(0.0, 0.5, y)) + pow(s, 64.0) * 0.7);',
  '  return c; }'].join('\n');
var NOISE = [
  'float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
  'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
  '  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }',
  'float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += vn(p) * a; p = p * 2.03 + 17.1; a *= 0.5; } return s * 1.14; }'].join('\n');
var sky = new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), new THREE.ShaderMaterial({
  uniforms: U_SKY, side: THREE.BackSide, depthWrite: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
  fragmentShader: [SKYFN, NOISE, 'uniform float uT; varying vec3 vD;',
    'void main(){ vec3 d = normalize(vD); vec3 c = skyCol(d);',
    /* 해 원반 */
    '  float s = dot(d, uSun); c += uSunCol * 10.0 * smoothstep(0.99955, 0.99975, s);',
    /* 뭉게구름: 지평선 근처에 납작하게, 해 쪽은 테두리가 빛난다 */
    '  if (d.y > 0.0 && d.y < 0.42) { vec2 q = d.xz / (d.y + 0.12) * 1.6; q.x += uT * 0.004;',
    '    float n = fbm(q * 0.9) * 0.65 + fbm(q * 2.7 + 3.0) * 0.35;',
    '    float m = smoothstep(0.6, 0.82, n) * smoothstep(0.0, 0.05, d.y) * (1.0 - smoothstep(0.18, 0.4, d.y));',
    '    vec3 cc = mix(vec3(1.0, 0.9, 0.82), vec3(0.62, 0.62, 0.72), smoothstep(0.6, 0.95, n));',
    '    cc += uSunCol * pow(max(s, 0.0), 12.0) * 0.8;',
    '    c = mix(c, cc, m * 0.9); }',
    '  gl_FragColor = vec4(c, 1.0);',
    '  #include <tonemapping_fragment>',
    '  #include <colorspace_fragment>',
    '}'].join('\n')
}));
sky.frustumCulled = false; sky.renderOrder = -10; S.add(sky);
/* 환경맵: 하늘만 있는 장면을 구워 물체·금화·보드가 하늘을 비추게 */
var envRT = null;
function bakeEnv() {
  var es = new THREE.Scene(), m = sky.clone(); m.material = sky.material.clone(); m.material.uniforms = U_SKY; es.add(m);
  m.scale.setScalar(0.03); var pm = new THREE.PMREMGenerator(R); if (envRT) envRT.dispose(); envRT = pm.fromScene(es, 0.02); S.environment = envRT.texture; pm.dispose();
}

/* ====================================================================== 바다: 거스트너 파도 넷 + 잔물결 법선 + 프레넬 하늘 반사 + 윤슬 + 물마루 거품 + 햇빛 비침 */
/* 파도: [방향 x, 방향 z, 파장, 높이] — 레일 근처는 낮게(보드가 물에 묻히지 않게), 먼 바다는 크게 */
var WAVES = [[0.25, 1, 46, 0.42], [-0.45, 1, 27, 0.26], [0.7, 0.8, 14, 0.13], [-0.2, 1, 7.5, 0.06]];
WAVES.forEach(function (w) { var l = Math.hypot(w[0], w[1]); w[0] /= l; w[1] /= l; w.push(2 * PI / w[2], Math.sqrt(9.8 * 2 * PI / w[2])); });
function ampK(x) { return 0.45 + 0.55 * clamp((Math.abs(x) - 4) / 14, 0, 1); }
/* 자바스크립트 쪽 물 높이(물체·주인공이 물결 따라 오르내림). 가로 밀림은 무시 */
function seaH(x, z, t) { var h = 0, k = ampK(x); for (var i = 0; i < WAVES.length; i++) { var w = WAVES[i]; h += w[3] * Math.sin(w[4] * (w[0] * x + w[1] * z) - w[5] * t); } return h * k; }
var U_SEA = {
  uT: { value: 0 }, uSun: U_SKY.uSun, uZen: U_SKY.uZen, uMid: U_SKY.uMid, uHor: U_SKY.uHor, uSunCol: U_SKY.uSunCol,
  uDeep: { value: new THREE.Color(0.008, 0.07, 0.13) }, uShal: { value: new THREE.Color(0.03, 0.3, 0.34) }, uPZ: { value: 0 }, uFar: { value: 900 },
  uW: { value: WAVES.map(function (w) { return new THREE.Vector4(w[0], w[1], w[4], w[3]); }) }, uSp: { value: WAVES.map(function (w) { return w[5]; }) }
};
var SEA_VS = [
  'uniform float uT; uniform vec4 uW[4]; uniform float uSp[4];',
  'varying vec3 vW; varying vec3 vN; varying float vH;',
  'void main(){',
  '  vec4 w = modelMatrix * vec4(position, 1.0); vec2 p = w.xz;',
  '  float k = 0.45 + 0.55 * clamp((abs(p.x) - 4.0) / 14.0, 0.0, 1.0);',
  '  vec3 d = vec3(0.0); vec3 n = vec3(0.0, 1.0, 0.0); float hh = 0.0;',
  '  for (int i = 0; i < 4; i++){ vec2 dir = uW[i].xy; float kk = uW[i].z, a = uW[i].w * k, f = kk * dot(dir, p) - uSp[i] * uT;',
  '    float q = 0.55 / (kk * a * 4.0 + 0.001); q = min(q, 0.9);',
  '    d.x += q * a * dir.x * cos(f); d.z += q * a * dir.y * cos(f); d.y += a * sin(f); hh += uW[i].w * sin(f);',
  '    n.x -= dir.x * kk * a * cos(f); n.z -= dir.y * kk * a * cos(f); n.y -= q * kk * a * sin(f); }',
  '  w.xyz += d; vW = w.xyz; vN = normalize(n); vH = hh;',
  '  gl_Position = projectionMatrix * viewMatrix * w; }'].join('\n');
var SEA_FS = [SKYFN, NOISE,
  'uniform float uT, uPZ, uFar; uniform vec3 uDeep, uShal;',
  'varying vec3 vW; varying vec3 vN; varying float vH;',
  'vec2 grad(vec2 p){ float e = 0.08; float a = vn(p); return vec2(vn(p + vec2(e, 0.0)) - a, vn(p + vec2(0.0, e)) - a) / e; }',
  'void main(){',
  '  vec3 V = normalize(cameraPosition - vW); float dist = length(vW - cameraPosition);',
  /* 잔물결: 두 겹의 흐르는 노이즈 기울기로 법선을 흔든다(멀수록 약하게) */
  '  float near = 1.0 - smoothstep(30.0, 260.0, dist);',
  '  vec2 g = grad(vW.xz * 0.55 + vec2(uT * 0.25, uT * 0.45)) * 0.55; if (near > 0.0) g += grad(vW.xz * 1.6 - vec2(uT * 0.5, uT * 0.2)) * 0.25 * near;',
  '  vec3 N = normalize(vN + vec3(-g.x, 0.0, -g.y) * (0.35 * near + 0.06));',
  '  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);',
  '  vec3 Rv = reflect(-V, N); Rv.y = abs(Rv.y);',
  '  vec3 refl = skyCol(Rv);',
  /* 물 몸통: 깊은 남청 → 물마루와 해 반대쪽(햇빛이 비쳐 드는 곳)은 청록 */
  '  float crest = clamp(vH * 0.9 + 0.35, 0.0, 1.0);',
  '  float sss = pow(max(dot(V, -uSun) * 0.5 + 0.5, 0.0), 3.0) * crest;',
  '  vec3 body = mix(uDeep, uShal, crest * 0.35 + sss * 0.45);',
  '  vec3 col = mix(body, refl, fres * 0.9);',
  /* 햇빛 윤슬: 날카로운 반짝 + 넓은 번짐 */
  '  float sp = max(dot(Rv, uSun), 0.0);',
  '  col += uSunCol * (pow(sp, 900.0) * 30.0 * near + pow(sp, 60.0) * 0.5);',
  /* 물마루 거품: 높은 곳에 노이즈로 찢긴 흰 물 */
  '  float fn = vn(vW.xz * 0.7 + vec2(0.0, uT * 0.3)) * 0.65 + vn(vW.xz * 1.9 - uT * 0.2) * 0.35;',
  '  float foam = smoothstep(0.8, 1.05, vH * 0.6 + fn * 0.55) * (0.6 + 0.4 * near);',
  '  col = mix(col, vec3(0.92, 0.95, 0.96), foam * 0.55);',
  /* 지평선은 하늘색으로 녹아든다 */
  '  float fog = smoothstep(uFar * 0.25, uFar, dist);',
  '  if (fog > 0.0) col = mix(col, skyCol(normalize(vec3(vW.x - cameraPosition.x, 0.0, vW.z - cameraPosition.z))) , fog);',
  '  gl_FragColor = vec4(col, 1.0);',
  '  #include <tonemapping_fragment>',
  '  #include <colorspace_fragment>',
  '}'].join('\n');
var SEA_W = 360, SEA_L = 900, SEA_STEP = 4;
var seaGeo = new THREE.PlaneGeometry(SEA_W, SEA_L, SEA_W / SEA_STEP, SEA_L / SEA_STEP).rotateX(-PI / 2);
var sea = new THREE.Mesh(seaGeo, new THREE.ShaderMaterial({ uniforms: U_SEA, vertexShader: SEA_VS, fragmentShader: SEA_FS }));
sea.frustumCulled = false; sea.receiveShadow = false; S.add(sea);
/* 그림자 받는 판: 주인공 둘레만(물 셰이더는 그림자를 안 받으므로) */
var shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(22, 30, 22, 30).rotateX(-PI / 2), new THREE.ShadowMaterial({ opacity: 0.32, color: 0x001820, depthWrite: false }));
shadowCatcher.receiveShadow = true; S.add(shadowCatcher);

/* ====================================================================== 왼쪽 큰 파도: 단면을 z 로 길게 늘인 벽. 마루가 레일 쪽으로 말린다 */
var PROF = [[-3.9, -0.6], [-4.4, 0.05], [-5.0, 0.7], [-5.7, 1.6], [-6.3, 2.7], [-6.8, 3.9], [-7.0, 4.9], [-6.85, 5.7], [-6.35, 6.3], [-5.6, 6.55], [-4.85, 6.35], [-4.25, 5.8], [-3.95, 5.1], [-3.9, 4.5]];
var WAVE_FROM = 140, WAVE_LEN = 760;
PROF = (function () { var out = [], n = PROF.length; for (var i = 0; i < n - 1; i++) { var p0 = PROF[Math.max(0, i - 1)], p1 = PROF[i], p2 = PROF[i + 1], p3 = PROF[Math.min(n - 1, i + 2)];
  for (var k = 0; k < 4; k++) { var t = k / 4, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(function (j) { return 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3); })); } }
  out.push(PROF[n - 1]); return out; })();
var waveGeo = (function () {
  var NZ = 260, NP = PROF.length, pos = [], uv = [], idx = [], len = 0, acc = [0];
  for (var i = 1; i < NP; i++) { len += Math.hypot(PROF[i][0] - PROF[i - 1][0], PROF[i][1] - PROF[i - 1][1]); acc.push(len); }
  for (var j = 0; j <= NZ; j++) { var z = WAVE_FROM - WAVE_LEN * j / NZ; for (var k = 0; k < NP; k++) { pos.push(PROF[k][0], PROF[k][1], z); uv.push(acc[k] / len, z); } }
  for (var j2 = 0; j2 < NZ; j2++) for (var k2 = 0; k2 < NP - 1; k2++) { var a = j2 * NP + k2, b = a + 1, c = a + NP, d = c + 1; idx.push(a, c, b, b, c, d); }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
})();
var U_WAVE = { uT: U_SEA.uT, uSun: U_SKY.uSun, uZen: U_SKY.uZen, uMid: U_SKY.uMid, uHor: U_SKY.uHor, uSunCol: U_SKY.uSunCol, uDeep: U_SEA.uDeep, uShal: U_SEA.uShal, uFar: U_SEA.uFar };
var LIPFN = 'float lipS(float z, float t){ return sin(z * 0.06 + t * 1.1) * 0.5 + sin(z * 0.17 - t * 0.7) * 0.3; }\n';
var waveMat = new THREE.ShaderMaterial({
  uniforms: U_WAVE, side: THREE.DoubleSide,
  vertexShader: ['uniform float uT; varying vec2 vU; varying vec3 vW; varying vec3 vNn;', LIPFN, NOISE,
    'void main(){ vec4 w = modelMatrix * vec4(position, 1.0);',
    '  float lip = smoothstep(0.55, 1.0, uv.x), s = lipS(w.z, uT);',
    /* 마루 거품 덩어리: 울퉁불퉁하게 부풀어 굴러간다 */
    '  float bump = fbm(vec2(w.z * 0.45 + uT * 0.6, uv.x * 6.0 - uT * 0.9)) - 0.45;',
    '  w.x += bump * 0.9 * smoothstep(0.5, 0.65, uv.x); w.y += bump * 0.6 * smoothstep(0.5, 0.65, uv.x);',
    '  w.x += s * lip * 0.7; w.y += s * lip * 0.3 + sin(w.z * 0.035 + uT * 0.5) * 0.45 * smoothstep(0.15, 0.6, uv.x);',
    '  vNn = normal; vU = uv; vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }'].join('\n'),
  fragmentShader: [SKYFN, NOISE, 'uniform float uT, uFar; uniform vec3 uDeep, uShal; varying vec2 vU; varying vec3 vW; varying vec3 vNn;',
    'void main(){',
    '  float u = vU.x; vec3 V = normalize(cameraPosition - vW); float dist = length(vW - cameraPosition);',
    '  vec3 Nf = normalize(cross(dFdx(vW), dFdy(vW))); vec3 N = normalize(vNn); if (dot(Nf, V) < 0.0) Nf = -Nf; if (dot(N, Nf) < 0.0) N = -N; N = normalize(mix(N, Nf, smoothstep(0.55, 0.65, u)));',
    /* 결: 마루와 나란한 물결무늬가 위로 올라간다 */
    '  float sn = fbm(vec2(vW.z * 0.09, u * 16.0 - uT * 1.4));',
    '  N = normalize(N + vec3(0.0, (sn - 0.5) * 0.35, 0.0));',
    '  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);',
    '  vec3 Rv = reflect(-V, N); Rv.y = abs(Rv.y);',
    /* 아래는 짙은 바다, 위로 갈수록 얇아져 햇빛이 비치는 청록 */
    '  float th = smoothstep(0.12, 0.62, u);',
    '  float sss = pow(max(dot(V, -uSun) * 0.5 + 0.5, 0.0), 2.0);',
    '  vec3 body = mix(uDeep * 1.1, uShal * (1.15 + sss * 1.3), th);',
    '  vec3 col = mix(body, skyCol(Rv), fres * 0.35);',
    '  col += uSunCol * pow(max(dot(Rv, uSun), 0.0), 600.0) * 1.2;',
    /* 얼굴의 흰 줄무늬 거품 */
    '  float streak = smoothstep(0.6, 0.85, sn) * smoothstep(0.08, 0.2, u) * (1.0 - smoothstep(0.5, 0.62, u));',
    '  col = mix(col, vec3(0.8, 0.92, 0.95), streak * 0.4);',
    /* 마루 거품(찢긴 가장자리)과 발치 흰 물 */
    '  float fn = fbm(vec2(vW.z * 0.35 + uT * 0.4, u * 5.0 - uT * 0.8));',
    '  float lipF = smoothstep(0.57, 0.63, u + (fn - 0.5) * 0.18);',
    '  float baseF = 1.0 - smoothstep(0.03, 0.11, u + (fn - 0.5) * 0.08);',
    '  float fd = vn(vec2(vW.z * 1.3 + uT * 0.5, u * 22.0 - uT * 1.5)) * 0.5 + fn * 0.5;',
    '  float lit = 0.5 + 0.5 * max(dot(N, uSun), 0.0);',
    '  vec3 foamC = mix(vec3(0.42, 0.56, 0.62), vec3(0.97, 0.98, 0.98), smoothstep(0.25, 0.75, fd * 0.7 + lit * 0.5)) + uSunCol * 0.1 * lit;',
    '  col = mix(col, foamC, max(lipF, baseF));',
    '  float fog = smoothstep(uFar * 0.25, uFar, dist);',
    '  if (fog > 0.0) col = mix(col, skyCol(normalize(vec3(vW.x - cameraPosition.x, 0.02, vW.z - cameraPosition.z))), fog);',
    '  gl_FragColor = vec4(col, 1.0);',
    '  #include <tonemapping_fragment>',
    '  #include <colorspace_fragment>',
    '}'].join('\n')
});
var wave = new THREE.Mesh(waveGeo, waveMat); wave.frustumCulled = false; S.add(wave);
function lipS(z, t) { return Math.sin(z * 0.06 + t * 1.1) * 0.5 + Math.sin(z * 0.17 - t * 0.7) * 0.3; }

/* 물보라 점: 부드러운 흰 동그라미. 파도 마루에서 뒤로 날리는 것 + 발치에서 튀는 것은 셰이더가 시간으로 움직인다 */
var softTex = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
var U_PT = { uMap: { value: softTex }, uScale: { value: 600 }, uT: U_SEA.uT, uSunCol: U_SKY.uSunCol };
function lipSpray() {
  var N = 1400, P = new Float32Array(N * 3), A = new Float32Array(N * 2);
  for (var i = 0; i < N; i++) { var top = i < N * 0.6; P[i * 3] = top ? -5.6 + rnd(-0.6, 0.8) : -4.2 + rnd(-0.3, 0.4); P[i * 3 + 1] = top ? 6.3 : 0.1; P[i * 3 + 2] = WAVE_FROM - 20 - Math.random() * (WAVE_LEN - 140); A[i * 2] = Math.random(); A[i * 2 + 1] = top ? 1 : 0; }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('seed', new THREE.BufferAttribute(A, 2));
  var m = new THREE.ShaderMaterial({ uniforms: U_PT, transparent: true, depthWrite: false,
    vertexShader: ['uniform float uT, uScale; attribute vec2 seed; varying float vA;', LIPFN,
      'void main(){ vec3 p = position; float ph = fract(uT * (0.35 + seed.x * 0.3) + seed.x * 7.0);',
      '  vec4 w = modelMatrix * vec4(p, 1.0); float s = lipS(w.z, uT);',
      '  if (seed.y > 0.5) { w.x += s * 0.7 - ph * 2.2; w.y += s * 0.3 + sin(w.z * 0.035 + uT * 0.5) * 0.45 + ph * 2.6 - ph * ph * 2.0; }',
      '  else { w.x += ph * 1.4; w.y += ph * 1.2 - ph * ph * 1.4; }',
      '  vA = (1.0 - ph) * min(1.0, ph * 6.0);',
      '  vec4 mv = viewMatrix * w; gl_PointSize = (0.5 + seed.x * 0.9) * (1.0 + ph) * uScale / -mv.z; gl_Position = projectionMatrix * mv; }'].join('\n'),
    fragmentShader: 'uniform sampler2D uMap; uniform vec3 uSunCol; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) + uSunCol * 0.1, c.a * vA * 0.75); }' });
  var pts = new THREE.Points(g, m); pts.frustumCulled = false; S.add(pts); return pts;
}
var waveSpray = lipSpray();
/* 10/4 사장님 "왼쪽 파도모양이 너무 인위적이야 없애줘" → 큰 파도 벽과 그 물보라를 끈다(코드는 남김) */
wave.visible = false; waveSpray.visible = false;

/* ====================================================================== 오른쪽 섬 해안: 미리 만든 지형 조각 셋을 앞으로 돌려 쓴다(플레이 중에 새로 짓지 않음) */
S.fog = new THREE.Fog(0xc9c4c4, 220, 1100);
function vnJS(x, y) { var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  function hh(a, b) { return hash(a * 57.1 + b * 113.7); }
  return (hh(ix, iy) * (1 - fx) + hh(ix + 1, iy) * fx) * (1 - fy) + (hh(ix, iy + 1) * (1 - fx) + hh(ix + 1, iy + 1) * fx) * fy; }
function fbmJS(x, y) { var a = 0.5, s = 0; for (var i = 0; i < 5; i++) { s += vnJS(x, y) * a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.3; a *= 0.5; } return s; }
var CH_L = 320, CH_N = 3;
var landMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, envMapIntensity: 0.4 });
var palmMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.4 });
var whiteMat = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.7 }), roofMat = new THREE.MeshStandardMaterial({ color: 0xc0583a, roughness: 0.8 }), redMat = new THREE.MeshStandardMaterial({ color: 0xd8382a, roughness: 0.55 });
function colAttr(g, c) { var n = g.attributes.position.count, a = new Float32Array(n * 3); for (var i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function mergeGeos(list) {
  var n = 0; list.forEach(function (g) { n += g.attributes.position.count; });
  var P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), o = 0;
  list.forEach(function (g) { P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; });
  var m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(N, 3)); m.setAttribute('color', new THREE.BufferAttribute(C, 3)); return m;
}
/* 야자수 한 그루: 휘어진 줄기 마디 + 잎 9장(가운데가 처진 띠). 모양은 seed 로 다르게 */
function palmGeo(seed, x, y, z, hgt) {
  var parts = [], lean = (hash(seed) - 0.3) * 0.5, dirA = hash(seed + 1) * PI * 2, segs = 7, top = new V3();
  var bark = new THREE.Color(0.36, 0.27, 0.18), leafA = new THREE.Color(0.12, 0.32, 0.1), leafB = new THREE.Color(0.25, 0.45, 0.12);
  for (var i = 0; i < segs; i++) {
    var t0 = i / segs, t1 = (i + 1) / segs, bend = function (t) { return lean * t * t * hgt; };
    var p0 = new V3(x + Math.cos(dirA) * bend(t0), y + t0 * hgt, z + Math.sin(dirA) * bend(t0)), p1 = new V3(x + Math.cos(dirA) * bend(t1), y + t1 * hgt, z + Math.sin(dirA) * bend(t1));
    var len = p0.distanceTo(p1), g = new THREE.CylinderGeometry(0.17 - t1 * 0.06, 0.2 - t0 * 0.06, len * 1.04, 7, 1).toNonIndexed();
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), p1.clone().sub(p0).normalize())); g.translate((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2);
    parts.push(colAttr(g, bark.clone().multiplyScalar(0.85 + (i % 2) * 0.2))); top.copy(p1);
  }
  for (var f = 0; f < 9; f++) {
    var a = f / 9 * PI * 2 + hash(seed + f) * 0.4, len2 = 3.2 + hash(seed + f * 3) * 1.2, droop = 0.9 + hash(seed + f * 5) * 0.6;
    var lp = [], lc = [], M = 8;
    for (var k = 0; k <= M; k++) { var u = k / M, r = u * len2, yy = Math.sin(u * PI * 0.55) * 0.9 - u * u * droop * 2.0, w = Math.sin(u * PI) * 0.55 + 0.05;
      var cx = Math.cos(a), cz = Math.sin(a), px = -cz, pz = cx;
      lp.push([top.x + cx * r + px * w, top.y + yy, top.z + cz * r + pz * w], [top.x + cx * r, top.y + yy + 0.12, top.z + cz * r], [top.x + cx * r - px * w, top.y + yy, top.z + cz * r - pz * w]); }
    var pos = [];
    for (var k2 = 0; k2 < M; k2++) { var A0 = lp[k2 * 3], A1 = lp[k2 * 3 + 1], A2 = lp[k2 * 3 + 2], B0 = lp[k2 * 3 + 3], B1 = lp[k2 * 3 + 4], B2 = lp[k2 * 3 + 5];
      pos.push.apply(pos, A0.concat(B0, A1, A1, B0, B1, A1, B1, A2, A2, B1, B2)); }
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.computeVertexNormals();
    parts.push(colAttr(lg, f % 2 ? leafA : leafB));
  }
  return parts;
}
function landChunk(seed) {
  var g = new THREE.Group(), WX = 300, NX = 60, NZ = 64, X0 = 58;
  var geo = new THREE.PlaneGeometry(WX, CH_L, NX, NZ).rotateX(-PI / 2), P = geo.attributes.position, col = new Float32Array(P.count * 3);
  var sand = new THREE.Color(0.86, 0.76, 0.58), wet = new THREE.Color(0.6, 0.52, 0.4), grass = new THREE.Color(0.22, 0.42, 0.16), dark = new THREE.Color(0.12, 0.27, 0.12), rock = new THREE.Color(0.42, 0.38, 0.34), c = new THREE.Color();
  var shore = [];
  for (var i = 0; i < P.count; i++) {
    var lx = P.getX(i) + WX / 2, z = P.getZ(i), wz = z + seed * 997;
    var sx = 18 + fbmJS(wz * 0.012, seed) * 40;                 /* 바닷가 선이 들쭉날쭉 */
    var e = lx - sx, h = e < 0 ? -3 + e * 0.1 : Math.min(e * 0.12, 2.5) + Math.max(0, e - 18) * (0.35 + fbmJS(lx * 0.012, wz * 0.012) * 0.9) * fbmJS(lx * 0.02 + 5, wz * 0.02);
    if (e > 22) h += Math.pow(fbmJS(lx * 0.008 + seed, wz * 0.008), 2) * 90;
    var edge = clamp((CH_L / 2 - Math.abs(z)) / 40, 0, 1); if (h > 2.5) h = 2.5 + (h - 2.5) * edge;   /* 조각 끝은 낮춰 이음매를 숨긴다 */
    sx = sx * edge + 30 * (1 - edge); e = lx - sx; if (e < 0) h = -3 + e * 0.1;
    P.setY(i, h);
    if (h < 0.25) c.copy(wet); else if (h < 2.8) c.copy(sand); else c.copy(grass).lerp(dark, fbmJS(lx * 0.05, wz * 0.05));
    if (h > 40) c.lerp(rock, clamp((h - 40) / 30, 0, 0.7));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    if (Math.abs(e - 9) < 3 && i % 3 === 0) shore.push([P.getX(i) + X0 + WX / 2, h, z]);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  var NN = geo.attributes.normal; for (var i2 = 0; i2 < P.count; i2++) { var ny = NN.getY(i2); if (ny < 0.75 && P.getY(i2) > -1) { c.setRGB(col[i2 * 3], col[i2 * 3 + 1], col[i2 * 3 + 2]).lerp(rock, clamp((0.75 - ny) * 3, 0, 1)); col[i2 * 3] = c.r; col[i2 * 3 + 1] = c.g; col[i2 * 3 + 2] = c.b; } }   /* 가파른 곳은 바위색 */
  var land = new THREE.Mesh(geo, landMat); land.position.x = X0 + WX / 2; land.receiveShadow = false; g.add(land);
  /* 야자수: 바닷가 모래 위에 띄엄띄엄 */
  var parts = [], n = 0;
  for (var s2 = 0; s2 < shore.length && n < 26; s2++) { if (hash(seed * 31 + s2) > 0.55) continue; var sp = shore[s2]; parts = parts.concat(palmGeo(seed * 100 + s2, sp[0], sp[1], sp[2], 7 + hash(s2 + seed) * 5)); n++; }
  if (parts.length) { var pm = new THREE.Mesh(mergeGeos(parts), palmMat); g.add(pm); }
  /* 바닷가 하얀 집 몇 채 */
  for (var hI = 0; hI < 4; hI++) { var sp2 = shore[Math.floor(hash(seed * 7 + hI) * shore.length)]; if (!sp2) continue;
    var hx = sp2[0] + 14 + hash(hI + seed) * 10, hz = sp2[2] + 6, hw = 5 + hash(hI * 3) * 4;
    var b = new THREE.Mesh(new THREE.BoxGeometry(hw, 3.4, hw * 0.8), whiteMat); b.position.set(hx, 2.5 + 1.7, hz); g.add(b);
    var r = new THREE.Mesh(new THREE.ConeGeometry(hw * 0.75, 1.8, 4), roofMat); r.rotation.y = PI / 4; r.position.set(hx, 2.5 + 3.4 + 0.9, hz); g.add(r); }
  /* 등대: 첫 조각에만 */
  if (seed === 1) { var sp3 = shore[Math.floor(shore.length * 0.4)];
    if (sp3) { var lh = new THREE.Group(); lh.position.set(sp3[0] + 4, sp3[1], sp3[2]); g.add(lh);
      for (var k = 0; k < 5; k++) { var ring = new THREE.Mesh(new THREE.CylinderGeometry(1.6 - k * 0.12, 1.75 - k * 0.12, 3.2, 16), k % 2 ? redMat : whiteMat); ring.position.y = 1.6 + k * 3.2; lh.add(ring); }
      var lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffd780, emissiveIntensity: 1.2 })); lamp.position.y = 17; lh.add(lamp);
      var cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.4, 12), redMat); cap.position.y = 18.5; lh.add(cap); } }
  S.add(g); return g;
}
var CHUNKS = [];
for (var ci = 0; ci < CH_N; ci++) CHUNKS.push(landChunk(ci + 1));
/* 먼 산: 카메라를 따라다니는 배경(가까워지지 않는다) */
var farG = new THREE.Group(); S.add(farG);
(function () {
  var m = new THREE.MeshStandardMaterial({ color: 0x7894a0, roughness: 1 });
  [[220, -40, 900, 120, 3], [-300, -260, 700, 70, 11]].forEach(function (a) {
    var g = new THREE.PlaneGeometry(a[2], 1, 90, 1), P = g.attributes.position;
    for (var k = 0; k < P.count; k++) { var x = P.getX(k), top = P.getY(k) > 0; if (top) { var hgt = a[3] * (0.25 + Math.pow(fbmJS(x * 0.006 + a[4], a[4]), 1.6) * 1.6) * (1 - Math.pow(Math.abs(x) / (a[2] / 2), 3)); P.setY(k, Math.max(4, hgt)); } else P.setY(k, -5); }
    g.computeVertexNormals(); var o = new THREE.Mesh(g, m); o.position.set(a[0], 0, a[1]); farG.add(o); });
})();

/* ====================================================================== 올가미 언니(bounty 의 hero.glb, 실사 재질 그대로) */
var HERO = null;
var BN = { sp0: /^Spine$/i, neck: /^neck$/i, head: /^Head$/i, hf: /^headfront$/i, la: /^LeftArm$/i, lfa: /^LeftForeArm$/i, lh: /^LeftHand$/i, ra: /^RightArm$/i, rfa: /^RightForeArm$/i, rh: /^RightHand$/i,
  lul: /^LeftUpLeg$/i, ll: /^LeftLeg$/i, lf: /^LeftFoot$/i, lt: /^LeftToeBase$/i, rul: /^RightUpLeg$/i, rl: /^RightLeg$/i, rf: /^RightFoot$/i, rt: /^RightToeBase$/i };
function smoothNormals(g) {
  if (g.userData.smooth || !g.attributes.position) return; g.userData.smooth = 1;
  var P = g.attributes.position, n = P.count, ix = g.index, acc = new Float32Array(n * 3), rep = new Int32Array(n), key = new Map();
  for (var i = 0; i < n; i++) { var k = Math.round(P.getX(i) * 2e4) + ',' + Math.round(P.getY(i) * 2e4) + ',' + Math.round(P.getZ(i) * 2e4); var r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; }
  var tn = ix ? ix.count : n, a = new V3(), b = new V3(), c = new V3();
  for (var t = 0; t < tn; t += 3) { var i0 = ix ? ix.getX(t) : t, i1 = ix ? ix.getX(t + 1) : t + 1, i2 = ix ? ix.getX(t + 2) : t + 2;
    a.fromBufferAttribute(P, i0); b.fromBufferAttribute(P, i1).sub(a); c.fromBufferAttribute(P, i2).sub(a); b.cross(c);
    var r0 = rep[i0] * 3, r1 = rep[i1] * 3, r2 = rep[i2] * 3; acc[r0] += b.x; acc[r0 + 1] += b.y; acc[r0 + 2] += b.z; acc[r1] += b.x; acc[r1 + 1] += b.y; acc[r1 + 2] += b.z; acc[r2] += b.x; acc[r2 + 1] += b.y; acc[r2 + 2] += b.z; }
  var N = new Float32Array(n * 3);
  for (var j = 0; j < n; j++) { var q = rep[j] * 3, l = Math.hypot(acc[q], acc[q + 1], acc[q + 2]) || 1; N[j * 3] = acc[q] / l; N[j * 3 + 1] = acc[q + 1] / l; N[j * 3 + 2] = acc[q + 2] / l; }
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
}
var _va = new V3(), _vb = new V3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _t = new V3();
function aimBone(bone, child, d) {
  if (!bone || !child) return;
  bone.getWorldPosition(_va); child.getWorldPosition(_vb);
  _qa.setFromUnitVectors(_vb.sub(_va).normalize(), d);
  bone.getWorldQuaternion(_qb); bone.parent.getWorldQuaternion(_qc);
  bone.quaternion.copy(_qc.invert().multiply(_qa.multiply(_qb))); bone.updateMatrixWorld(true);
}
/* 서핑보드: 위에서 본 물방울 윤곽을 두께 있게 뽑고 위아래를 둥글게. 흰 레진 + 산호색 레일 줄 + 가운데 나무 줄 + 지느러미 셋 */
function makeBoard() {
  var sh = new THREE.Shape(), Lb = 1.08, Wb = 0.27;
  sh.moveTo(0, -Lb); sh.bezierCurveTo(Wb * 0.85, -Lb * 0.92, Wb, -Lb * 0.35, Wb * 0.98, 0); sh.bezierCurveTo(Wb, Lb * 0.5, Wb * 0.6, Lb * 0.94, 0.06, Lb);
  sh.lineTo(-0.06, Lb); sh.bezierCurveTo(-Wb * 0.6, Lb * 0.94, -Wb, Lb * 0.5, -Wb * 0.98, 0); sh.bezierCurveTo(-Wb, -Lb * 0.35, -Wb * 0.85, -Lb * 0.92, 0, -Lb);
  var geo = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.022, bevelSize: 0.025, bevelSegments: 4, curveSegments: 28 });
  geo.rotateX(PI / 2); geo.translate(0, 0.08, 0);   /* 뾰족한 코가 앞(-z) */
  /* 코를 살짝 들어 올린다(로커) */
  var P = geo.attributes.position; for (var i = 0; i < P.count; i++) { var z = P.getZ(i); if (z < -0.5) P.setY(i, P.getY(i) + Math.pow((-z - 0.5) / 0.6, 2) * 0.11); if (z > 0.8) P.setY(i, P.getY(i) + Math.pow((z - 0.8) / 0.3, 2) * 0.03); }
  geo.computeVertexNormals();
  var g = new THREE.Group(), deck = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xfbf7ef, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08 }));
  deck.castShadow = true; g.add(deck); g.userData.deck = deck;
  var str = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.004, 2.05), new THREE.MeshStandardMaterial({ color: 0xa4743c, roughness: 0.5 })); str.position.y = 0.103; g.add(str);
  var stM = new THREE.MeshStandardMaterial({ color: 0xff5a3c, roughness: 0.4 }); g.userData.stripe = stM;
  [-1, 1].forEach(function (s) { var st = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.004, 1.5), stM); st.position.set(s * 0.17, 0.101, 0.05); g.add(st); });
  var finM = new THREE.MeshStandardMaterial({ color: 0x1b2a33, roughness: 0.4 });
  [[0, 0.9, 0.14], [-0.14, 0.72, 0.1], [0.14, 0.72, 0.1]].forEach(function (f) { var fin = new THREE.Mesh(new THREE.BoxGeometry(0.012, f[2], 0.12), finM); fin.position.set(f[0], -0.02 - f[2] / 2, f[1]); g.add(fin); });
  return g;
}
var U_OUTFIT = { value: new THREE.Color(1, 1, 1) };
function makeSurfer(gltf, height) {
  var body = gltf.scene, bones = {};
  body.traverse(function (o) {
    if (o.isMesh) { smoothNormals(o.geometry); o.frustumCulled = false; o.castShadow = true; var m = o.material; m.roughness = 0.62; m.metalness = 0; m.envMapIntensity = 0.7; if (m.map) m.map.anisotropy = 8;
      m.onBeforeCompile = function (sh) { sh.uniforms.uOutfit = U_OUTFIT; sh.fragmentShader = 'uniform vec3 uOutfit;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n{ vec3 cc = diffuseColor.rgb; float mx = max(cc.r, max(cc.g, cc.b)), mn = min(cc.r, min(cc.g, cc.b)); float wh = smoothstep(0.35, 0.6, mx) * (1.0 - smoothstep(0.06, 0.16, mx - mn)); diffuseColor.rgb = mix(cc, cc * uOutfit, wh); }'); };
      m.customProgramCacheKey = function () { return 'outfit'; }; }
    if (o.isBone) { for (var k in BN) if (BN[k].test(o.name)) bones[k] = o; }
  });
  body.updateMatrixWorld(true);
  var bb = new THREE.Box3().setFromObject(body), sc = height / (bb.max.y - bb.min.y);
  var root = new THREE.Group(), tilt = new THREE.Group(), turn = new THREE.Group(), lift = new THREE.Group();
  body.scale.multiplyScalar(sc); body.position.y = -bb.min.y * sc;
  lift.add(body); turn.add(lift); turn.rotation.y = PI / 2; tilt.add(turn); root.add(tilt); S.add(root);
  var board = makeBoard(); tilt.add(board);
  var mixer = new THREE.AnimationMixer(body);
  gltf.animations.forEach(function (a) { if (a.name === 'idle') { var ac = mixer.clipAction(a); ac.play(); ac.timeScale = 0; ac.time = 0.3; } });
  return { root: root, tilt: tilt, turn: turn, lift: lift, body: body, bones: bones, mixer: mixer, board: board, p: { c: 0.45, air: 0, duck: 0, cheer: 0 } };
}
/* 서핑 자세: 몸은 오른쪽(+x)을 보고 왼발이 앞(-z). idle 첫 자세 위에 매 프레임 뼈를 겨눈다
 * p.c 웅크림, p.air 공중 무릎 당기기, p.duck 쪼그려 보드 옆 잡기, p.cheer 두 팔 번쩍 */
var _F = new V3(), _C = new V3(), _D = new V3(), _U = new V3(0, 1, 0);
function dir(f, d, c) { return _t.set(0, 0, 0).addScaledVector(_F, f).addScaledVector(_D, d).addScaledVector(_C, c).normalize(); }
function surfPose(h, t) {
  var b = h.bones, p = h.p, c = p.c, a = p.air, dk = p.duck, ch = p.cheer;
  h.lift.position.y = 0; h.mixer.update(0); h.root.updateMatrixWorld(true);
  h.tilt.getWorldQuaternion(_qa); _F.set(0, 0, -1).applyQuaternion(_qa); _C.set(1, 0, 0).applyQuaternion(_qa); _D.set(0, -1, 0).applyQuaternion(_qa);
  var ck = c + a * 0.35;
  function bl(f1, d1, c1, f2, d2, c2) { return dir(f1 + (f2 - f1) * dk, d1 + (d2 - d1) * dk, c1 + (c2 - c1) * dk); }
  aimBone(b.sp0, b.neck, bl(0.04, -1, 0.16 + ck * 0.36, 0.1, -0.25, 1));
  var spread = 0.42 - a * 0.12;
  aimBone(b.lul, b.ll, bl(spread + ck * 0.1, 1 - a * 0.35, 0.2 + ck * 0.75 + a * 0.6, 0.3, 0.35, 1));
  aimBone(b.ll, b.lf, bl(0.12, 1, -0.1 - ck * 0.45 - a * 0.4, 0.05, 1, -0.75));
  aimBone(b.rul, b.rl, bl(-spread - ck * 0.1, 1 - a * 0.35, 0.2 + ck * 0.75 + a * 0.6, -0.3, 0.35, 1));
  aimBone(b.rl, b.rf, bl(-0.12, 1, -0.1 - ck * 0.45 - a * 0.4, -0.05, 1, -0.75));
  aimBone(b.lf, b.lt, dir(0.25, 0.3, 1)); aimBone(b.rf, b.rt, dir(-0.25, 0.3, 1));
  var sw = Math.sin(t * 2.1) * 0.08;
  if (ch > 0.05) {
    aimBone(b.la, b.lfa, dir(0.3, 0.3 - 1.3 * ch, 0.15)); aimBone(b.lfa, b.lh, dir(0.2, -1, 0.1));
    aimBone(b.ra, b.rfa, dir(-0.3, 0.3 - 1.3 * ch, 0.15)); aimBone(b.rfa, b.rh, dir(-0.2, -1, 0.1));
  } else {
    aimBone(b.la, b.lfa, bl(0.95, 0.35 - a * 0.6 + sw, 0.25, 0.35, 1, 0.2)); aimBone(b.lfa, b.lh, bl(0.9, 0.15 - a * 0.4, 0.4, 0.2, 1, -0.1));
    aimBone(b.ra, b.rfa, bl(-0.85, 0.5 - a * 0.7 - sw, 0.15, -0.35, 1, 0.2)); aimBone(b.rfa, b.rh, bl(-0.6, 0.6 - a * 0.5, 0.35, -0.2, 1, -0.1));
  }
  aimBone(b.head, b.hf, dir(1, 0.22 - dk * 0.3, 0.3 + dk * 0.4));
  var y0 = h.tilt.getWorldPosition(_vb).y;
  b.lf.getWorldPosition(_va); var fy = _va.y; b.rf.getWorldPosition(_va); fy = Math.min(fy, _va.y);
  h.lift.position.y = (y0 + 0.16) - fy;
}

/* ====================================================================== 장애물(실제 크기, 재질 공유) */
function std(c, r, m, o) { var x = new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.6 : r, metalness: m || 0 }); if (o) for (var k in o) { if (x[k] && x[k].isColor) x[k].set(o[k]); else x[k] = o[k]; } return x; }
var MT = {
  red: std(0xd8322a, 0.45), white: std(0xf4f1ea, 0.5), yel: std(0xf2b62c, 0.45), dark: std(0x23292e, 0.5), steel: std(0xb8bec4, 0.3, 0.8),
  bark: std(0x6a4a30, 0.95), barkL: std(0xb8946a, 0.9), rock: std(0x3b3f42, 0.85), rockW: std(0x26292b, 0.35), wood: std(0x7b5a3c, 0.8), woodD: std(0x4c3624, 0.9),
  rope: std(0xd9c9a3, 0.9), hull: std(0xf6f6f2, 0.3), hullB: std(0x1f4f8a, 0.35), sail: std(0xfbfaf4, 0.8, 0, { side: THREE.DoubleSide }), ski: std(0xff5a1f, 0.3), seat: std(0x1c1c1e, 0.6),
  foam: std(0xf2f6f7, 0.95), gull: std(0xf3f2ee, 0.7), gullG: std(0x8d949b, 0.7), beak: std(0xe8a52a, 0.5), net: std(0x2e3a3a, 0.9, 0, { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }),
  shark: std(0x56656f, 0.45), sharkB: std(0xdfe3e4, 0.5), dol: std(0x6f8aa0, 0.35), dolB: std(0xdde4e8, 0.4),
  gold: std(0xffc44a, 0.22, 1), magR: std(0xd62b26, 0.35, 0.2), magS: std(0xd0d4d8, 0.25, 0.9), glow: std(0x7fe8ff, 0.2, 0, { emissive: 0x3fc8ff, emissiveIntensity: 0.8 })
};
function mesh(g, m, par, x, y, z) { var o = new THREE.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; if (par) par.add(o); return o; }
/* 바위 덩어리: 다면체를 노이즈로 울퉁불퉁하게 */
function rockGeo(r, seed) { var g = new THREE.IcosahedronGeometry(r, 2), P = g.attributes.position; for (var i = 0; i < P.count; i++) { var x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = 0.75 + vnJS(x * 1.7 + seed, z * 1.7 + y) * 0.5; P.setXYZ(i, x * n, y * n * 1.25, z * n); } g.computeVertexNormals(); return g; }
var netTex = (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var x = c.getContext('2d'); x.strokeStyle = '#fff'; x.lineWidth = 5; for (var i = 0; i <= 128; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
MT.net.alphaMap = netTex; MT.net.alphaMap.repeat.set(10, 4);
var SHAPE = {
  /* 부표(점프): 빨강·흰 띠 원통 + 원뿔 + 깃대 */
  buoy: function () { var g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.7, 20), MT.red, g, 0, 0.2); mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 20), MT.white, g, 0, 0.44);
    mesh(new THREE.ConeGeometry(0.4, 0.7, 20), MT.red, g, 0, 0.88); mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), MT.steel, g, 0, 1.55);
    mesh(new THREE.SphereGeometry(0.07, 10, 8), MT.yel, g, 0, 1.97); return g; },
  /* 떠 있는 통나무(점프, 두 줄) */
  log: function () { var g = new THREE.Group(), len = 2 * LANE + 0.6;
    var l = mesh(new THREE.CylinderGeometry(0.32, 0.36, len, 14), MT.bark, g, 0, 0.12); l.rotation.z = PI / 2;
    [-1, 1].forEach(function (s) { var e = mesh(new THREE.CircleGeometry(0.33, 14), MT.barkL, g, s * (len / 2 + 0.005), 0.12, 0); e.rotation.y = s * PI / 2; });
    var br = mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.9, 6), MT.bark, g, len * 0.22, 0.45, 0.1); br.rotation.z = -0.8; return g; },
  /* 부표 줄(점프, 세 줄 전부): 밧줄에 꿴 빨강·흰 공 */
  rope: function () { var g = new THREE.Group(), len = 3 * LANE + 2;
    var r = mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6), MT.rope, g, 0, 0.3); r.rotation.z = PI / 2;
    for (var i = 0; i < 15; i++) mesh(new THREE.SphereGeometry(0.2, 14, 10), i % 2 ? MT.white : MT.red, g, -len / 2 + (i + 0.5) * len / 15, 0.3); return g; },
  /* 갈매기 떼(덕다이브): 머리 높이로 낮게 나는 세 마리 */
  gulls: function () { var g = new THREE.Group(), birds = [];
    for (var i = 0; i < 3; i++) { var b = new THREE.Group(); b.position.set((i - 1) * 0.8, 1.55 + (i % 2) * 0.25, i * 0.6); g.add(b);
      var bd = mesh(new THREE.SphereGeometry(0.16, 12, 8), MT.gull, b); bd.scale.set(1, 0.9, 2.2);
      mesh(new THREE.SphereGeometry(0.1, 10, 8), MT.gull, b, 0, 0.08, -0.32); var bk = mesh(new THREE.ConeGeometry(0.035, 0.14, 6), MT.beak, b, 0, 0.06, -0.45); bk.rotation.x = -PI / 2;
      var wl = new THREE.Group(), wr = new THREE.Group(); b.add(wl); b.add(wr);
      mesh(new THREE.BoxGeometry(0.62, 0.025, 0.22).translate(-0.31, 0, 0), MT.gull, wl); mesh(new THREE.BoxGeometry(0.34, 0.02, 0.16).translate(-0.78, 0, 0.03), MT.gullG, wl);
      mesh(new THREE.BoxGeometry(0.62, 0.025, 0.22).translate(0.31, 0, 0), MT.gull, wr); mesh(new THREE.BoxGeometry(0.34, 0.02, 0.16).translate(0.78, 0, 0.03), MT.gullG, wr);
      birds.push({ b: b, wl: wl, wr: wr }); }
    g.userData.birds = birds; return g; },
  /* 그물(덕다이브, 두 줄): 기둥 둘 사이 머리 높이 그물 */
  net: function () { var g = new THREE.Group(), len = 2 * LANE + 1;
    [-1, 1].forEach(function (s) { mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 8), MT.wood, g, s * len / 2, 0.9); });
    var n = mesh(new THREE.PlaneGeometry(len, 1.1), MT.net, g, 0, 1.55); n.castShadow = false;
    var top = mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 6), MT.rope, g, 0, 2.1); top.rotation.z = PI / 2;
    for (var i = 0; i < 8; i++) mesh(new THREE.SphereGeometry(0.08, 8, 6), MT.yel, g, -len / 2 + (i + 0.5) * len / 8, 2.1); return g; },
  /* 나무 잔교(덕다이브, 세 줄 전부): 물 위 1.6m 판자 다리 */
  pier: function () { var g = new THREE.Group(), w = 3 * LANE + 4;
    for (var i = 0; i < 9; i++) { var pl = mesh(new THREE.BoxGeometry(w, 0.1, 0.3), i % 3 ? MT.wood : MT.woodD, g, 0, 1.75, -1.2 + i * 0.31); pl.rotation.x = (hash(i) - 0.5) * 0.02; }
    [-1, 1].forEach(function (s) { mesh(new THREE.BoxGeometry(0.25, 0.3, 3), MT.woodD, g, s * (w / 2 - 0.3), 1.6, 0); [-1.3, 1.3].forEach(function (z) { mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.4, 8), MT.woodD, g, s * (w / 2 - 0.3), 0.2, z); }); });
    var rail = mesh(new THREE.BoxGeometry(w, 0.08, 0.08), MT.woodD, g, 0, 2.6, -1.3); [-w / 2 + 1, -w / 4, 0, w / 4, w / 2 - 1].forEach(function (x) { mesh(new THREE.BoxGeometry(0.08, 0.85, 0.08), MT.woodD, g, x, 2.2, -1.3); }); return g; },
  /* 부서지는 흰 물 둔덕(덕다이브, 두 줄): 거품 덩어리 */
  white: function () { var g = new THREE.Group(), len = 2 * LANE + 1, blobs = [];
    for (var i = 0; i < 16; i++) { var r = 0.45 + hash(i * 3) * 0.35, b = mesh(new THREE.IcosahedronGeometry(r, 1), MT.foam, g, -len / 2 + (i + 0.5) * len / 16, 1.2 + hash(i) * 0.6, hash(i + 5) * 0.6); b.scale.set(1.2, 0.85, 1); blobs.push(b); }
    for (var j = 0; j < 10; j++) { var b2 = mesh(new THREE.IcosahedronGeometry(0.5, 1), MT.foam, g, -len / 2 + (j + 0.5) * len / 10, 0.25, 0.6); b2.scale.set(1.4, 0.6, 1.2); blobs.push(b2); }
    g.userData.blobs = blobs; return g; },
  /* 바위(피하기): 젖은 바위 셋 + 둘레 거품 */
  rock: function () { var g = new THREE.Group(), s = Math.random() * 9;
    mesh(rockGeo(0.95, s), MT.rock, g, 0, 0.55); mesh(rockGeo(0.55, s + 3), MT.rockW, g, 0.7, 0.15, 0.3); mesh(rockGeo(0.45, s + 6), MT.rock, g, -0.75, 0.05, 0.2);
    var ring = mesh(new THREE.TorusGeometry(1.15, 0.16, 8, 26), MT.foam, g, 0, 0.02); ring.rotation.x = PI / 2; ring.castShadow = false; return g; },
  /* 돛단배(피하기, 두 줄) */
  sail: function () { var g = new THREE.Group();
    var hs = new THREE.Shape(); hs.moveTo(-2.4, 0.9); hs.lineTo(2.6, 0.9); hs.quadraticCurveTo(2.2, 0.1, 1.0, -0.15); hs.lineTo(-1.9, -0.15); hs.quadraticCurveTo(-2.4, 0.3, -2.4, 0.9);
    var hg = new THREE.ExtrudeGeometry(hs, { depth: 1.9, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 }); hg.translate(0, 0, -0.95); hg.rotateY(PI / 2);
    mesh(hg, MT.hull, g); mesh(new THREE.BoxGeometry(2.0, 0.1, 4.6), MT.wood, g, 0, 0.92); mesh(new THREE.BoxGeometry(2.05, 0.18, 4.9), MT.hullB, g, 0, 0.3);
    mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 8), MT.steel, g, 0, 4.4, -0.4);
    var s1 = new THREE.BufferGeometry(); s1.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.4, -0.3, 0, 7.6, -0.4, 0, 1.4, 2.5], 3)); s1.computeVertexNormals(); mesh(s1, MT.sail, g);
    var s2 = new THREE.BufferGeometry(); s2.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.3, -0.6, 0, 7.0, -0.45, 0, 1.3, -2.6], 3)); s2.computeVertexNormals(); mesh(s2, MT.sail, g);
    var boom = mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 6), MT.steel, g, 0, 1.4, 1.0); boom.rotation.x = PI / 2; return g; },
  /* 마주 오는 수상스키(피하기) */
  jet: function () { var g = new THREE.Group();
    var hs = new THREE.Shape(); hs.moveTo(-0.55, 0); hs.lineTo(0.55, 0); hs.lineTo(0.5, 0.45); hs.lineTo(-0.5, 0.45); hs.lineTo(-0.55, 0);
    var hg = new THREE.ExtrudeGeometry(hs, { depth: 2.6, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 3 }); hg.translate(0, 0, -1.3);
    var P = hg.attributes.position; for (var i = 0; i < P.count; i++) { var z = P.getZ(i); if (z > 0.6) { var k = (z - 0.6) / 0.9; P.setX(i, P.getX(i) * (1 - k * 0.7)); P.setY(i, P.getY(i) + k * 0.2); } } hg.computeVertexNormals();
    mesh(hg, MT.ski, g); mesh(new THREE.BoxGeometry(0.5, 0.25, 1.1), MT.seat, g, 0, 0.6, -0.35);
    var bar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), MT.dark, g, 0, 1.0, 0.45); bar.rotation.z = PI / 2;
    var ws = mesh(new THREE.BoxGeometry(0.7, 0.35, 0.05), std(0x9ad0e6, 0.1, 0, { transparent: true, opacity: 0.55 }), g, 0, 0.8, 0.75); ws.rotation.x = -0.6;
    /* 탄 사람: 구명조끼 입은 덩어리 */
    var pz = new THREE.Group(); pz.position.set(0, 0.7, -0.15); g.add(pz);
    mesh(new THREE.CapsuleGeometry(0.2, 0.45, 4, 10), MT.yel, pz, 0, 0.5); mesh(new THREE.SphereGeometry(0.14, 12, 10), std(0x8d5a3b, 0.6), pz, 0, 1.0, 0.02); mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, PI * 2, 0, PI * 0.5), MT.dark, pz, 0, 1.03);
    [-1, 1].forEach(function (s) { var a = mesh(new THREE.CapsuleGeometry(0.06, 0.4, 4, 6), std(0x8d5a3b, 0.6), pz, s * 0.25, 0.55, 0.3); a.rotation.x = -1.2; });
    g.rotation.y = PI; return g; },
  /* 돌고래(힘), 자석(힘), 빛나는 보드(방패) */
  dolphin: function () { var g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    var bd = mesh(new THREE.SphereGeometry(0.34, 18, 12), MT.dol, b); bd.scale.set(0.85, 0.85, 2.7);
    var bl = mesh(new THREE.SphereGeometry(0.3, 14, 10), MT.dolB, b, 0, -0.08); bl.scale.set(0.72, 0.6, 2.3);
    var sn = mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.38, 10), MT.dol, b, 0, -0.04, -1.0); sn.rotation.x = -PI / 2;
    var df = mesh(new THREE.ConeGeometry(0.18, 0.45, 8), MT.dol, b, 0, 0.38, 0.05); df.rotation.x = 0.5; df.scale.z = 0.35;
    var tf = mesh(new THREE.BoxGeometry(0.78, 0.04, 0.26), MT.dol, b, 0, 0, 0.95);
    [-1, 1].forEach(function (s) { mesh(new THREE.SphereGeometry(0.035, 8, 6), MT.dark, b, s * 0.2, 0.08, -0.62); });
    g.userData.b = b; return g; },
  magnet: function () { var g = new THREE.Group(), b = new THREE.Group(); g.add(b); b.position.y = 1.1;
    var t = mesh(new THREE.TorusGeometry(0.36, 0.13, 12, 24, PI), MT.magR, b); t.rotation.z = PI;
    [-1, 1].forEach(function (s) { mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.25, 14), MT.magR, b, s * 0.36, 0.12); mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.16, 14), MT.magS, b, s * 0.36, 0.32); });
    g.userData.b = b; return g; },
  shield: function () { var g = new THREE.Group(), b = makeBoard(); b.userData.deck.material = MT.glow; b.rotation.x = -PI / 2.4; b.scale.setScalar(0.75); var w = new THREE.Group(); w.add(b); w.position.y = 1.1; g.add(w); g.userData.b = w; return g; }
};
var POOLN = { buoy: 10, log: 4, rope: 3, gulls: 5, net: 4, pier: 3, white: 4, rock: 12, sail: 3, jet: 4, dolphin: 3, magnet: 3, shield: 3 };
var OM = {};
for (var k0 in POOLN) { OM[k0] = []; for (var i0 = 0; i0 < POOLN[k0]; i0++) { var m0 = SHAPE[k0](); m0.visible = false; m0.userData.free = true; S.add(m0); OM[k0].push(m0); } }
function take(k) { var a = OM[k]; for (var i = 0; i < a.length; i++) if (a[i].userData.free) { a[i].userData.free = false; a[i].visible = true; return a[i]; } var m = SHAPE[k](); S.add(m); m.userData.free = false; a.push(m); __grow++; return m; }
function give(m) { if (!m) return; m.visible = false; m.userData.free = true; m.rotation.set(0, 0, 0); }
var __grow = 0;

/* ====================================================================== 금화(InstancedMesh 하나, 하늘을 비추는 금속) */
var COIN_N = 120;
var coinGeo = (function () { var g = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 28); g.rotateX(PI / 2); return g; })();
var coins = new THREE.InstancedMesh(coinGeo, MT.gold, COIN_N); coins.castShadow = true; coins.frustumCulled = false; coins.count = 0; S.add(coins);
var _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V3(1, 1, 1), _p = new V3(), _e = new THREE.Euler();

/* ====================================================================== 레인 표시 부표(10/4 사장님 "레인은 부표를 띄워서 표시하자")
 * 바깥 가장자리(±3.6) 두 줄에만 3.5m 간격으로 작은 부표를 띄운다. 주황 몸통(10/4 사장님 "오렌지색으로") + 흰 띠 + 빨간 꼭지, 한 덩어리 꼭짓점 색, InstancedMesh 하나 */
var LB_X = [-3.6, 3.6];   /* 10/4 사장님 "부표는 가장자리에 두줄만"(전에는 -3.6, -1.2, 1.2, 3.6 네 줄) */
var LB_SP = 3.5, LB_N = 36, LB_COUNT = LB_X.length * LB_N;
var laneBuoyGeo = (function () {
  function part(g, col, y) { g = g.toNonIndexed(); g.translate(0, y, 0); return colAttr(g, new THREE.Color(col)); }
  return mergeGeos([part(new THREE.CylinderGeometry(0.15, 0.19, 0.32, 10), 0xff7a1a, 0.06), part(new THREE.CylinderGeometry(0.155, 0.155, 0.07, 10, 1, true), 0xf6f3ea, 0.25),
    part(new THREE.SphereGeometry(0.13, 10, 4, 0, PI * 2, 0, PI / 2), 0xff7a1a, 0.285), part(new THREE.SphereGeometry(0.045, 6, 4), 0xe0372b, 0.43)]);
})();
var laneBuoys = new THREE.InstancedMesh(laneBuoyGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0 }), LB_COUNT);
laneBuoys.castShadow = true; laneBuoys.frustumCulled = false; S.add(laneBuoys);
function drawLaneBuoys(pz, t) {
  var k0 = Math.floor((pz + 12) / LB_SP), n = 0;
  for (var i = 0; i < LB_N; i++) { var z = (k0 - i) * LB_SP;
    for (var j = 0; j < LB_X.length; j++) { var x = LB_X[j], sd = (k0 - i) * 7 + j * 13;
      _p.set(x, seaH(x, z, t) - 0.05, z); _e.set(Math.sin(t * 1.9 + sd) * 0.12, sd, Math.cos(t * 1.6 + sd) * 0.12); _q.setFromEuler(_e); _s.setScalar(1);
      _m4.compose(_p, _q, _s); laneBuoys.setMatrixAt(n++, _m4); } }
  laneBuoys.count = n; laneBuoys.instanceMatrix.needsUpdate = true;
}

/* ====================================================================== 상어: 한 번 부딪히면 뒤에서 쫓아온다(지느러미 + 물밑 그림자) */
var shark = (function () { var g = new THREE.Group(), b = new THREE.Group(); g.add(b);
  var body = mesh(new THREE.SphereGeometry(0.6, 18, 12), MT.shark, b, 0, -0.55); body.scale.set(0.9, 0.75, 3.4);
  var belly = mesh(new THREE.SphereGeometry(0.55, 16, 10), MT.sharkB, b, 0, -0.75); belly.scale.set(0.8, 0.5, 3.0);
  var fs = new THREE.Shape(); fs.moveTo(-0.5, 0); fs.quadraticCurveTo(-0.2, 0.5, 0.3, 1.05); fs.quadraticCurveTo(0.25, 0.5, 0.55, 0); fs.lineTo(-0.5, 0);
  var fg = new THREE.ExtrudeGeometry(fs, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); fg.translate(0, 0, -0.035); fg.rotateY(PI / 2);
  mesh(fg, MT.shark, b, 0, -0.1, 0.2);
  var tail = mesh(new THREE.ConeGeometry(0.4, 0.9, 4), MT.shark, b, 0, -0.45, 2.2); tail.rotation.x = PI / 2; tail.scale.set(0.2, 1, 1.6);
  g.visible = false; S.add(g); g.userData.b = b; return g; })();

/* ====================================================================== 물보라 알갱이(점 하나로 다 그린다) */
var PART_N = 700, parts = [], partPos = new Float32Array(PART_N * 3), partSz = new Float32Array(PART_N), partA = new Float32Array(PART_N), partHead = 0;
for (var pq = 0; pq < PART_N; pq++) parts.push({ life: 0 });
var partGeo = new THREE.BufferGeometry(); partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3)); partGeo.setAttribute('sz', new THREE.BufferAttribute(partSz, 1)); partGeo.setAttribute('al', new THREE.BufferAttribute(partA, 1));
var partMesh = new THREE.Points(partGeo, new THREE.ShaderMaterial({ uniforms: U_PT, transparent: true, depthWrite: false,
  vertexShader: 'attribute float sz; attribute float al; uniform float uScale; varying float vA; void main(){ vA = al; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = sz * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform sampler2D uMap; uniform vec3 uSunCol; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vec3(0.96, 0.98, 1.0) + uSunCol * 0.08, c.a * vA); }' }));
partMesh.frustumCulled = false; S.add(partMesh);
/* kind 0 보드 옆 물보라, 1 점프 착지, 2 덕다이브, 3 부딪힘·쓰러짐, 4 금화 반짝(작음) */
function spray(n, kind, x, y, z) {
  for (var i = 0; i < n; i++) { var q = parts[partHead]; partHead = (partHead + 1) % PART_N;
    q.x = x + rnd(-0.4, 0.4); q.y = y + rnd(0, 0.2); q.z = z + rnd(-0.6, 0.6);
    var up = kind === 3 ? rnd(3, 8) : kind === 1 ? rnd(2, 5) : kind === 2 ? rnd(1.5, 4) : rnd(1.2, 3.5);
    q.vx = rnd(-1, 1) * (kind === 3 ? 4 : 2.6); q.vy = up; q.vz = rnd(0.5, 4) * (kind === 3 ? 1.5 : 1);
    q.r = rnd(0.12, 0.35) * (kind === 3 ? 1.8 : kind === 1 ? 1.3 : 1); q.life = q.max = rnd(0.4, 0.9) * (kind === 3 ? 1.4 : 1); }
}

/* ====================================================================== 배치: 장애물 종류(kind: low 점프 / high 덕다이브 / tall 피하기, w 레일 수, dp 앞뒤 반 길이) */
var OT = {
  buoy: { kind: 'low', w: 1, dp: 0.6 }, log: { kind: 'low', w: 2, dp: 0.5 }, rope: { kind: 'low', w: 3, dp: 0.4 },
  gulls: { kind: 'high', w: 1, dp: 0.9 }, net: { kind: 'high', w: 2, dp: 0.4 }, pier: { kind: 'high', w: 3, dp: 1.5 }, white: { kind: 'high', w: 2, dp: 0.9 },
  rock: { kind: 'tall', w: 1, dp: 1.0 }, sail: { kind: 'tall', w: 2, dp: 2.5 }, jet: { kind: 'tall', w: 1, dp: 1.4, vz: 9 }
};
function lx(l) { return (l - 1) * LANE; }
function addObj(type, lane, d) {
  var o = OT[type], x = o.w === 1 ? lx(lane) : o.w === 2 ? lx(lane) + LANE / 2 : 0;
  var ob = { type: type, kind: o.kind, w: o.w, dp: o.dp, vz: o.vz || 0, x: x, wz: -G.z - d, hit: false, passed: false, ph: Math.random() * 6.28, m: take(type) };
  G.objs.push(ob); return ob;
}
function addPower(p, lane, d) { G.objs.push({ type: 'power', p: p, x: lx(lane), wz: -G.z - d, ph: 0, m: take(p) }); }
function addCoin(x, y, d) { G.objs.push({ type: 'coin', x: x, y: y, wz: -G.z - d, got: false, ph: Math.random() * 6.28 }); }
function coinRow(lane, d, n) { for (var i = 0; i < n; i++) addCoin(lx(lane), 0.9, d + i * 2.4); }
function coinArc(lane, d, n) { for (var i = 0; i < n; i++) { var u = i / (n - 1); addCoin(lx(lane), 0.9 + Math.sin(u * PI) * 1.6, d + (u - 0.5) * 10); } }
function L3() { return Math.floor(rnd(0, 3)); }
function tier() { return G.dist < 300 ? 0 : G.dist < 800 ? 1 : G.dist < 1600 ? 2 : 3; }
var PAT = [
  { t: 0, len: 6, f: function (d) { var l = L3(); addObj('buoy', l, d); coinRow((l + 1) % 3, d - 4, 5); } },
  { t: 0, len: 14, f: function (d) { coinRow(L3(), d, 7); } },
  { t: 0, len: 10, f: function (d) { var l = L3(); addObj('buoy', l, d); addObj('buoy', (l + 1) % 3, d); coinArc(l, d, 6); } },
  { t: 0, len: 10, f: function (d) { var l = Math.floor(rnd(0, 2)); addObj('log', l, d); coinArc(l, d, 6); } },
  { t: 1, len: 8, f: function (d) { var l = L3(); addObj('gulls', l, d); coinRow(l, d - 3, 4); } },
  { t: 1, len: 10, f: function (d) { var l = Math.floor(rnd(0, 2)); addObj('net', l, d); coinRow(l === 0 ? 2 : 0, d - 5, 5); } },
  { t: 1, len: 18, f: function (d) { var l = L3(); addObj('jet', l, d + 30); coinRow((l + 2) % 3, d, 6); } },
  { t: 1, len: 34, f: function (d) { var l = L3(); for (var i = 0; i < 4; i++) { addObj('buoy', (l + i) % 3, d + i * 9); coinRow((l + i + 1) % 3, d + i * 9 - 3, 3); } } },
  { t: 1, len: 10, f: function (d) { addObj('rope', 1, d); coinArc(L3(), d, 6); } },
  { t: 2, len: 8, f: function (d) { var l = L3(); addObj('rock', l, d); addObj('rock', (l + 1) % 3, d); coinRow((l + 2) % 3, d - 4, 5); } },
  { t: 2, len: 10, f: function (d) { addObj('pier', 1, d); coinRow(L3(), d - 3, 4); } },
  { t: 2, len: 22, f: function (d) { var l = L3(); addObj('rock', l, d); addObj('gulls', (l + 1) % 3, d + 9); addObj('buoy', (l + 2) % 3, d + 17); } },
  { t: 2, len: 20, f: function (d) { var l = Math.floor(rnd(0, 2)); addObj('sail', l, d); coinRow(l === 0 ? 2 : 0, d - 6, 7); } },
  { t: 2, len: 12, f: function (d) { var l = Math.floor(rnd(0, 2)); addObj('white', l, d); addObj('rock', l === 0 ? 2 : 0, d); coinRow(l, d - 5, 4); } },
  { t: 3, len: 28, f: function (d) { var l = L3(); addObj('rock', l, d); addObj('white', l === 0 ? 1 : 0, d + 10); addObj('rock', (l + 1) % 3, d + 20); addObj('rock', (l + 2) % 3, d + 20); } },
  { t: 3, len: 24, f: function (d) { var l = L3(); addObj('jet', l, d + 34); addObj('jet', (l + 1) % 3, d + 60); coinArc((l + 2) % 3, d, 6); } },
  { t: 0, len: 6, f: function (d) { addPower(pick(['dolphin', 'magnet', 'shield']), L3(), d); } }
];
function gen() {
  var T = tier();
  while (G.nextZ < G.z + 150) {
    var cands = PAT.filter(function (p) { return p.t <= T; }), p = pick(cands);
    if (p === PAT[PAT.length - 1] && Math.random() < 0.65) p = cands[Math.floor(Math.random() * (cands.length - 1))];
    p.f(G.nextZ - G.z);
    G.nextZ += p.len + 22 - T * 3 + rnd(0, 8);
  }
}

/* ====================================================================== 조작 */
function doLeft() { if (G.lane > 0) { G.lane--; SFX.swoosh(); spray(10, 0, G.x, 0.1, -G.z); } }
function doRight() { if (G.lane < 2) { G.lane++; SFX.swoosh(); spray(10, 0, G.x, 0.1, -G.z); } }
function doJump() { if (!G.air && G.duck <= 0) { G.air = true; G.jv = 10; G.jy = 0.001; SFX.jump(); G.R.jumps = (G.R.jumps || 0) + 1; spray(18, 1, G.x, 0.1, -G.z); } else if (G.air && G.jv < 2) G.jv = -16; }
function doDuck() { if (G.air) { G.jv = -16; } else if (G.duck <= 0) { G.duck = 0.8; SFX.duck(); G.R.ducks = (G.R.ducks || 0) + 1; spray(26, 2, G.x, 0.1, -G.z); } }
function input(k) { if (G.mode !== 'play' || G.dead) return; if (k === 'L') doLeft(); else if (k === 'R') doRight(); else if (k === 'U') doJump(); else if (k === 'D') doDuck(); }
var overAt = 0;
window.addEventListener('keydown', function (e) {
  var k = e.key, m = { ArrowLeft: 'L', a: 'L', A: 'L', ArrowRight: 'R', d: 'R', D: 'R', ArrowUp: 'U', w: 'U', W: 'U', ' ': 'U', ArrowDown: 'D', s: 'D', S: 'D' };
  if (m[k]) { e.preventDefault(); if (G.mode === 'play' && !e.repeat) input(m[k]); }
  if (k === 'Escape' || k === 'p' || k === 'P') { if (G.mode === 'play') pause(); else if (G.mode === 'pause') resume(); }
  if (k === ' ' && G.mode === 'over' && !e.repeat && performance.now() - overAt > 400) { e.preventDefault(); SFX.click(); startRun(); }
});
var swp = null;
cv.addEventListener('pointerdown', function (e) { swp = { x: e.clientX, y: e.clientY, id: e.pointerId, done: false }; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
cv.addEventListener('pointermove', function (e) {
  if (!swp || swp.done || e.pointerId !== swp.id) return;
  var dx = e.clientX - swp.x, dy = e.clientY - swp.y, th = Math.max(22, Math.min(W, H) * 0.045);
  if (Math.abs(dx) > th || Math.abs(dy) > th) { swp.done = true; input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); }
});
cv.addEventListener('pointerup', function () { swp = null; });
cv.addEventListener('pointercancel', function () { swp = null; });

/* ====================================================================== 미션: 셋씩, 끝내면 배수 +1(영구) */
var MIS_ORDER = { c50: 1, m500: 1, j10: 2, d8: 2, cl5: 3, o5: 3, c150: 4, m1200: 4, dol1: 5, mg1: 5, sd1: 5, j25: 6, d20: 6, c300: 7, m2500: 7, cl15: 7, o15: 7, dol2: 8, m4000: 9 };
var MIS = [
  { id: 'c50', k: 'coins', n: 50, t: ['코인 50', 'Coins 50'] }, { id: 'c150', k: 'coins', n: 150, t: ['코인 150', 'Coins 150'] }, { id: 'c300', k: 'coins', n: 300, t: ['코인 300', 'Coins 300'] },
  { id: 'j10', k: 'jumps', n: 10, t: ['점프 10', 'Jumps 10'] }, { id: 'j25', k: 'jumps', n: 25, t: ['점프 25', 'Jumps 25'] },
  { id: 'd8', k: 'ducks', n: 8, t: ['덕다이브 8', 'Duck dives 8'] }, { id: 'd20', k: 'ducks', n: 20, t: ['덕다이브 20', 'Duck dives 20'] },
  { id: 'm500', k: 'dist', n: 500, t: ['500m', '500m'] }, { id: 'm1200', k: 'dist', n: 1200, t: ['1200m', '1200m'] }, { id: 'm2500', k: 'dist', n: 2500, t: ['2500m', '2500m'] }, { id: 'm4000', k: 'dist', n: 4000, t: ['4000m', '4000m'] },
  { id: 'cl5', k: 'close', n: 5, t: ['CLOSE 5', 'Close calls 5'] }, { id: 'cl15', k: 'close', n: 15, t: ['CLOSE 15', 'Close calls 15'] },
  { id: 'o5', k: 'over', n: 5, t: ['장애물 넘기 5', 'Jump over 5'] }, { id: 'o15', k: 'over', n: 15, t: ['장애물 넘기 15', 'Jump over 15'] },
  { id: 'dol1', k: 'dolphin', n: 1, t: ['돌고래 1', 'Dolphin 1'] }, { id: 'dol2', k: 'dolphin', n: 2, t: ['돌고래 2', 'Dolphin 2'] },
  { id: 'mg1', k: 'magnet', n: 1, t: ['자석 1', 'Magnet 1'] }, { id: 'sd1', k: 'shield', n: 1, t: ['보드 1', 'Shield 1'] }
];
function misLoad() { var ids = null; try { ids = JSON.parse(localStorage.getItem('surf3.mis') || 'null'); } catch (e) {} G.mis = []; if (ids) ids.forEach(function (id) { var m = MIS.filter(function (q) { return q.id === id; })[0]; if (m) G.mis.push(m); }); while (G.mis.length < 3) misDraw(); }
function misDraw() {
  var used = G.mis.map(function (m) { return m.id; }), done = []; try { done = JSON.parse(localStorage.getItem('surf3.misdone') || '[]'); } catch (e) {}
  var keys = G.mis.map(function (m) { return m.k; });
  var c = MIS.filter(function (m) { return used.indexOf(m.id) < 0 && done.indexOf(m.id) < 0 && keys.indexOf(m.k) < 0; });
  if (c.length < 3) c = MIS.filter(function (m) { return used.indexOf(m.id) < 0 && done.indexOf(m.id) < 0; });
  if (!c.length) c = MIS.filter(function (m) { return used.indexOf(m.id) < 0; });
  c.sort(function (a, b) { return (MIS_ORDER[a.id] || 9) - (MIS_ORDER[b.id] || 9); });
  G.mis.push(c[Math.floor(Math.random() * Math.min(3, c.length))]);
}
function misCheck() { for (var i = 0; i < G.mis.length; i++) { var m = G.mis[i]; if ((G.R[m.k] || 0) >= m.n) { G.mis.splice(i, 1); i--; G.mult++; try { var d = JSON.parse(localStorage.getItem('surf3.misdone') || '[]'); d.push(m.id); localStorage.setItem('surf3.misdone', JSON.stringify(d)); } catch (e) {} misDraw(); save(); SFX.mission(); fx(L(TX.mission) + ' x' + G.mult, 'm'); } } }
function misHTML(el) { el.innerHTML = G.mis.map(function (m) { var v = Math.min(m.n, Math.floor(G.R[m.k] || 0)); return '<div class="' + (v >= m.n ? 'done' : '') + '"><span>' + L(m.t) + '</span><b>' + v + '/' + m.n + '</b></div>'; }).join(''); }

/* ====================================================================== 봇(타이틀 시연·시험) */
function ahead(o) { return -G.z - o.wz; }
function inLane(o, x) { return Math.abs(o.x - x) < (o.w * LANE) / 2 - 0.3; }
function laneFree(l, near, far) { var x = lx(l); for (var i = 0; i < G.objs.length; i++) { var o = G.objs[i]; if (!o.kind || o.hit) continue; var d = ahead(o); if (d > near && d < far && inLane(o, x)) return false; } return true; }
function botThink() {
  var mine = null, dz = 999, x = lx(G.lane);
  for (var i = 0; i < G.objs.length; i++) { var o = G.objs[i]; if (!o.kind || o.hit) continue; var d = ahead(o) - o.dp; if (d < -0.5 || d > 30) continue; if (inLane(o, x) && d < dz) { dz = d; mine = o; } }
  var react = G.speed * 0.42;
  if (!mine) { if (Math.random() < 0.03) { for (var j = 0; j < G.objs.length; j++) { var c = G.objs[j]; if (c.type !== 'coin' || c.got) continue; var dc = ahead(c); if (dc > 4 && dc < 18 && Math.abs(c.x - x) > 1 && Math.abs(c.x - x) < 3) { var tl = c.x > x ? G.lane + 1 : G.lane - 1; if (laneFree(tl, -2, 25)) { if (tl < G.lane) doLeft(); else doRight(); } break; } } } return; }
  if (dz > react + 6) return;
  if (mine.kind === 'low' && !G.air) { if (dz < react) doJump(); return; }
  if (mine.kind === 'high' && G.duck <= 0) { if (dz < react * 0.6) doDuck(); return; }
  if (mine.kind === 'tall') {
    var opts = []; if (G.lane > 0 && laneFree(G.lane - 1, -3, 28)) opts.push(G.lane - 1); if (G.lane < 2 && laneFree(G.lane + 1, -3, 28)) opts.push(G.lane + 1);
    if (!opts.length) { if (G.lane > 0 && laneFree(G.lane - 1, -2, 10)) opts.push(G.lane - 1); if (G.lane < 2 && laneFree(G.lane + 1, -2, 10)) opts.push(G.lane + 1); }
    if (opts.length) { var l = pick(opts); if (l < G.lane) doLeft(); else doRight(); }
  }
}

/* ====================================================================== 한 틱 */
function targetSpeed() { return Math.min(34, 17 + G.dist / 60) * (G.dolphin > 0 ? 1.3 : 1); }
function step(dt) {
  G.t += dt;
  var demo = G.mode === 'title' || G.mode === 'shop';
  G.camK += (((demo || G.mode === 'load') ? 0 : 1) - G.camK) * Math.min(1, dt * 1.6);
  if (demo && !G.bot) G.bot = true;
  if (G.mode !== 'play' && !demo) return;
  if (G.bot && !G.dead) botThink();
  var ts = G.dead ? 0 : targetSpeed() * (G.danger > 0 ? 0.85 : 1) * (G.mode !== 'play' ? 0.8 : 1);
  G.speed += (ts - G.speed) * Math.min(1, dt * (G.dead ? 2 : 1.1));
  var dz = G.speed * dt; G.z += dz; G.dist = G.z; G.R.dist = G.dist;
  var tx = lx(G.lane), ox = G.x; G.x += (tx - G.x) * Math.min(1, dt * 12); G.xv = (G.x - ox) / Math.max(dt, 1e-4);
  if (G.air) { G.jv -= 28 * dt; G.jy += G.jv * dt; if (G.jy <= 0) { G.jy = 0; G.air = false; G.jv = 0; SFX.land(); spray(24, 1, G.x, 0.1, -G.z); G.shake = 0.22; G.landT = 0.3; } }
  if (G.landT > 0) G.landT -= dt;
  if (G.duck > 0) G.duck = Math.max(0, G.duck - dt);
  if (G.danger > 0) G.danger = Math.max(0, G.danger - dt);
  if (G.dolphin > 0) G.dolphin -= dt; if (G.magnet > 0) G.magnet -= dt; if (G.shake > 0) G.shake -= dt; if (G.hitT > 0) G.hitT -= dt;
  gen();
  var pz = -G.z, px = G.x;
  for (var i = G.objs.length - 1; i >= 0; i--) {
    var o = G.objs[i];
    if (o.vz && !o.hit) o.wz += o.vz * dt;
    var d = pz - o.wz;   /* 앞으로 남은 거리(+ 가 앞) */
    if (d < -12) { give(o.m); G.objs.splice(i, 1); continue; }
    if (o.type === 'coin') {
      if (o.got) { o.gotT += dt; continue; }
      if ((G.magnet > 0 || G.dolphin > 0) && d < 22 && d > -1) { o.x += (px - o.x) * Math.min(1, dt * 8); o.y += (G.jy + 0.9 - o.y) * Math.min(1, dt * 8); o.wz += (pz - o.wz) * Math.min(1, dt * 3); }
      if (Math.abs(d) < 0.8 && Math.abs(o.x - px) < 0.9 && Math.abs(o.y - (G.jy + 0.9)) < 1.0) { o.got = true; o.gotT = 0; G.coins++; G.R.coins = (G.R.coins || 0) + 1; if (G.mode === 'play') { SFX.shell(G.coins); popCoin(); } spray(3, 4, o.x, o.y, o.wz); }
      continue;
    }
    if (o.type === 'power') {
      if (Math.abs(d) < 1 && Math.abs(o.x - px) < 1.2) {
        give(o.m); G.objs.splice(i, 1); if (G.mode !== 'play') continue; SFX.power();
        if (o.p === 'dolphin') { G.dolphin = 7; G.R.dolphin = (G.R.dolphin || 0) + 1; SFX.dolphin(); fx('DOLPHIN', 'b'); }
        else if (o.p === 'magnet') { G.magnet = 10; G.R.magnet = (G.R.magnet || 0) + 1; fx('MAGNET', 'b'); }
        else { G.shield = 1; G.R.shield = (G.R.shield || 0) + 1; fx('SHIELD', 'b'); }
      }
      continue;
    }
    if (o.type === 'gulls' && !o.cried && d < 40) { o.cried = true; if (G.mode === 'play') SFX.gull(); }
    if (o.hit) { o.hitT += dt; continue; }
    if (o.passed) continue;
    var over = inLane(o, px);
    if (Math.abs(d) < o.dp + 0.4) {
      if (over) {
        var pass = (o.kind === 'low' && G.jy > 0.7) || (o.kind === 'high' && G.duck > 0);
        if (pass) { if (d < -o.dp) { o.passed = true; if (o.kind === 'low') { G.R.over = (G.R.over || 0) + 1; fx(L(TX.nice), 'w'); } } }
        else if (G.dolphin > 0) { o.hit = true; o.hitT = 0; spray(30, 3, o.x, 0.6, o.wz); SFX.hit(); G.shake = 0.3; }
        else if (G.mode !== 'play') { o.hit = true; o.hitT = 0; }
        else hitObj(o);
      }
    } else if (d < -o.dp - 0.4) {
      o.passed = true;
      if (!over && o.kind === 'tall' && Math.abs(o.x - px) < (o.w * LANE) / 2 + 1.2) { G.R.close = (G.R.close || 0) + 1; fx(L(TX.close), 'y'); SFX.close(); }
    }
  }
  for (var f = G.fxs.length - 1; f >= 0; f--) { G.fxs[f].life -= dt; if (G.fxs[f].life <= 0) { G.fxs[f].el.remove(); G.fxs.splice(f, 1); } }
  if (G.mode === 'play') { if (!G.dead) misCheck(); hud(); }
  if (G.dead) { G.deadT += dt; if (G.deadT > 1.8 && G.mode === 'play') gameOver(); }
}
function hitObj(o) {
  var big = o.kind === 'tall';
  if (G.shield > 0 && !G.dead) { G.shield = 0; o.hit = true; o.hitT = 0; SFX.hit(); G.shake = 0.35; spray(30, 3, o.x, 0.6, o.wz); fx('SHIELD', 'b'); return; }
  if (big || G.danger > 0) { wipeout(o); return; }
  o.hit = true; o.hitT = 0; G.danger = 3.5; G.hitT = 0.5; SFX.hit(); SFX.danger(); G.shake = 0.45; spray(26, 3, G.x, 0.4, -G.z);
}
function wipeout(o) { if (G.dead) return; G.dead = true; G.deadT = 0; if (o) { o.hit = true; o.hitT = 0; } SFX.wipeout(); G.shake = 0.9; spray(70, 3, G.x, 0.4, -G.z); G.air = false; G.duck = 0; }

/* ====================================================================== HUD, 떠오르는 글자 */
var hudCache = {};
function score() { return Math.floor(G.dist * G.mult) + G.coins; }
function hud() {
  var d = score(); if (hudCache.d !== d) { hudCache.d = d; $('distV').textContent = d; }
  if (hudCache.c !== G.coins) { hudCache.c = G.coins; $('coinV').textContent = G.coins; }
  if (hudCache.m !== G.mult) { hudCache.m = G.mult; $('multV').textContent = 'x' + G.mult; }
}
function popCoin() { var p = $('coinP'); p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop'); }
function fx(text, kind) {
  if (G.mode !== 'play') return;
  var el = document.createElement('div'); el.className = 'fx fx-' + kind; el.textContent = text; el.style.left = (50 + rnd(-6, 6)) + '%';
  $('fxl').appendChild(el); G.fxs.push({ life: 1.1, el: el });
}


/* ====================================================================== 상점: 보드 색 · 헬라 옷 색 · 시작 아이템 */
var SHOP = {
  board: [
    { id: 'white', n: ['화이트', 'WHITE'], p: 0, deck: 0xfbf7ef, st: 0xff5a3c },
    { id: 'coral', n: ['코랄', 'CORAL'], p: 300, deck: 0xff6a4d, st: 0xfbf7ef },
    { id: 'mint', n: ['민트', 'MINT'], p: 500, deck: 0x7fe0c8, st: 0x0b3a45 },
    { id: 'navy', n: ['네이비', 'NAVY'], p: 800, deck: 0x1d3f7a, st: 0xffc21f },
    { id: 'black', n: ['블랙', 'BLACK'], p: 1200, deck: 0x1b1d22, st: 0xff3b6b },
    { id: 'gold', n: ['골드', 'GOLD'], p: 2500, deck: 0xf2c14e, st: 0x8a5a14, metal: 1 }
  ],
  outfit: [
    { id: 'o_white', n: ['화이트', 'WHITE'], p: 0, c: 0xffffff },
    { id: 'o_pink', n: ['핑크', 'PINK'], p: 400, c: 0xff7fb0 },
    { id: 'o_red', n: ['레드', 'RED'], p: 600, c: 0xe8352c },
    { id: 'o_sky', n: ['스카이', 'SKY'], p: 800, c: 0x6fc4ff },
    { id: 'o_yellow', n: ['옐로', 'YELLOW'], p: 1000, c: 0xffd84a },
    { id: 'o_black', n: ['블랙', 'BLACK'], p: 1500, c: 0x2a2a30 }
  ],
  item: [
    { id: 'shield', n: ['시작 보드', 'START SHIELD'], p: 150 },
    { id: 'magnet', n: ['시작 자석', 'START MAGNET'], p: 200 }
  ]
};
var shopTab = 'board';
function shopFind(id) { var all = SHOP.board.concat(SHOP.outfit); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }
function applyLook() {
  if (!HERO) return;
  var b = SHOP.board.filter(function (x) { return x.id === SH.board; })[0] || SHOP.board[0], o = SHOP.outfit.filter(function (x) { return x.id === SH.outfit; })[0] || SHOP.outfit[0], dm = HERO.board.userData.deck.material;
  dm.color.setHex(b.deck); dm.metalness = b.metal ? 0.5 : 0; dm.roughness = b.metal ? 0.3 : 0.25; HERO.board.userData.stripe.color.setHex(b.st);
  U_OUTFIT.value.setHex(o.c);
}
function hex(c) { return '#' + ('00000' + c.toString(16)).slice(-6); }
function shopHTML() {
  $('shopCoin').textContent = G.total;
  ['board', 'outfit', 'item'].forEach(function (t) { $('tab_' + t).classList.toggle('on', shopTab === t); });
  var list = SHOP[shopTab], h = '';
  list.forEach(function (it) {
    var own = shopTab === 'item' ? false : !!SH.own[it.id], on = (shopTab === 'board' && SH.board === it.id) || (shopTab === 'outfit' && SH.outfit === it.id);
    var pic = shopTab === 'board' ? '<i class="pb" style="background-color:' + hex(it.deck) + ';--st:' + hex(it.st) + '"></i>'
      : shopTab === 'outfit' ? '<i class="po" style="background:' + hex(it.c) + '"></i>'
      : '<i class="pi pi-' + it.id + '"></i>';
    var foot = on ? '<b class="tag on">ON</b>' : own ? '<b class="tag">EQUIP</b>'
      : '<b class="tag price' + (G.total < it.p ? ' no' : '') + '"><span class="coin"></span>' + it.p + '</b>';
    var cnt = shopTab === 'item' ? '<em>x' + (SH.stock[it.id] || 0) + '</em>' : '';
    h += '<button class="item' + (on ? ' on' : '') + '" data-id="' + it.id + '">' + pic + cnt + '<span class="nm">' + L(it.n) + '</span>' + foot + '</button>';
  });
  $('shopList').innerHTML = h;
}
function shopTap(id) {
  var it = null; ['board', 'outfit', 'item'].forEach(function (t) { SHOP[t].forEach(function (x) { if (x.id === id) it = x; }); });
  if (!it) return;
  if (shopTab === 'item') {
    if (G.total < it.p) { SFX.hit(); return; }
    G.total -= it.p; SH.stock[id] = (SH.stock[id] || 0) + 1; SFX.power();
  } else {
    if (!SH.own[id]) { if (G.total < it.p) { SFX.hit(); return; } G.total -= it.p; SH.own[id] = 1; SFX.mission(); } else SFX.click();
    if (shopTab === 'board') SH.board = id; else SH.outfit = id;
    applyLook();
  }
  save(); shopHTML();
}
function openShop() { SFX.unlock(); shopTab = 'board'; setMode('shop'); shopHTML(); }

/* ====================================================================== 그리기 */
var camPos = new V3(), camLook = new V3(), _tp = new V3(), _tl = new V3(), _cp = new V3(), _cl = new V3();
var catcherP = shadowCatcher.geometry.attributes.position, catcherX = [], catcherZ = [];
for (var cq = 0; cq < catcherP.count; cq++) { catcherX.push(catcherP.getX(cq)); catcherZ.push(catcherP.getZ(cq)); }
function draw(dt) {
  dt = dt || 0;
  var t = G.t, pz = -G.z, px = G.x;
  U_SEA.uT.value = t; U_SKY.uT.value = t;
  sea.position.set(0, 0, Math.round((pz - SEA_L / 2 + 160) / SEA_STEP) * SEA_STEP);
  wave.position.z = waveSpray.position.z = Math.round(pz / 2) * 2;
  /* 땅 조각: 플레이어 뒤로 지나간 조각을 맨 앞으로 */
  var base = Math.floor(G.z / CH_L) - 1;
  for (var c = 0; c < CHUNKS.length; c++) { var slot = base + (((c - base) % CH_N) + CH_N) % CH_N; CHUNKS[c].position.z = -(slot * CH_L + CH_L / 2); }
  /* 주인공: 물결 따라 오르내리고 레일 옮길 때 몸을 기울인다 */
  var wy = seaH(px, pz, t);
  if (HERO) {
    var p = HERO.p, e = Math.min(1, dt * 10), duckK = G.duck > 0 ? Math.sin((1 - G.duck / 0.8) * PI) : 0;
    p.c += ((G.landT > 0 ? 0.95 : 0.48 + Math.sin(t * 2.4) * 0.05) - p.c) * e;
    p.air += ((G.air ? 1 : 0) - p.air) * e;
    p.duck += (duckK - p.duck) * Math.min(1, dt * 14);
    p.cheer += ((G.mode !== 'play' && Math.sin(t * 0.5) > 0.85 ? 1 : 0) - p.cheer) * Math.min(1, dt * 4);
    var roll = clamp(-G.xv * 0.035, -0.45, 0.45), pitch = G.air ? clamp(G.jv * 0.02, -0.25, 0.25) : (seaH(px, pz - 1, t) - seaH(px, pz + 1, t)) * 0.4, y = wy + G.jy - p.duck * 0.55, yaw = 0;
    if (G.air) yaw = Math.sin(clamp((10 - G.jv) / 20, 0, 1) * PI) * 0.35;
    if (G.hitT > 0) roll += Math.sin(G.hitT * 40) * 0.12;
    if (G.dead) { var dk = Math.min(1, G.deadT * 2); roll = dk * 1.6; y = wy - dk * 0.9; pitch = dk * 0.6; }
    HERO.root.position.set(px, y, pz); HERO.tilt.rotation.set(pitch, yaw, roll);
    surfPose(HERO, t);
    HERO.board.userData.deck.material.emissive.setHex(G.shield > 0 ? 0x3fc8ff : 0x000000); HERO.board.userData.deck.material.emissiveIntensity = G.shield > 0 ? 0.6 + Math.sin(t * 8) * 0.25 : 0;
  }
  /* 장애물·금화 */
  var cc = 0;
  for (var j = 0; j < G.objs.length; j++) {
    var o = G.objs[j], d = pz - o.wz;
    if (o.type === 'coin') {
      if (o.got && o.gotT > 0.2) continue;
      if (cc >= COIN_N || d > 160) continue;
      var gy = o.got ? o.gotT * 6 : 0;
      _p.set(o.x, o.y + seaH(o.x, o.wz, t) * 0.5 + gy, o.wz); _e.set(0, t * 3.2 + o.ph, 0); _q.setFromEuler(_e); _s.setScalar(o.got ? Math.max(0.01, 1 - o.gotT * 4) : 1);
      _m4.compose(_p, _q, _s); coins.setMatrixAt(cc++, _m4); continue;
    }
    var m = o.m; if (!m) continue;
    var sy = seaH(o.x, o.wz, t), bob = sy;
    m.position.set(o.x, bob, o.wz); m.rotation.set(0, 0, 0);
    if (o.type === 'power') {
      if (o.p === 'dolphin') { var ph = (t * 1.5 + o.ph) % (PI * 2); m.userData.b.rotation.set(Math.cos(ph) * 0.9, 0, 0); m.userData.b.position.y = -0.2 + Math.max(0, Math.sin(ph)) * 1.6; }
      else m.userData.b.rotation.y = t * 2.5;
      continue;
    }
    if (o.type === 'buoy') { m.rotation.z = Math.sin(t * 1.7 + o.ph) * 0.14; m.rotation.x = Math.cos(t * 1.3 + o.ph) * 0.1; }
    if (o.type === 'log' || o.type === 'rope') m.rotation.x = Math.sin(t * 1.4 + o.ph) * 0.06;
    if (o.type === 'gulls') { m.position.y = 0; m.userData.birds.forEach(function (bd, q) { var fl = Math.sin(t * 12 + q * 1.7 + o.ph) * 0.65; bd.wl.rotation.z = -fl; bd.wr.rotation.z = fl; bd.b.position.y = 1.55 + (q % 2) * 0.25 + Math.sin(t * 2 + q) * 0.1; }); }
    if (o.type === 'net' || o.type === 'pier') m.position.y = 0;
    if (o.type === 'white') { m.position.y = sy * 0.5; m.userData.blobs.forEach(function (b2, q) { b2.scale.y = 0.75 + Math.sin(t * 4 + q * 1.3) * 0.12; }); if (Math.random() < 0.3) spray(1, 2, o.x + rnd(-2, 2), 1.6, o.wz); }
    if (o.type === 'sail') { m.rotation.z = Math.sin(t * 0.9 + o.ph) * 0.05; }
    if (o.type === 'jet') { m.rotation.y = PI; m.rotation.x = -0.06 + Math.sin(t * 6) * 0.02; if (!o.hit && Math.random() < 0.6) spray(1, 0, o.x + rnd(-0.4, 0.4), 0.2, o.wz - 1.4); }
    if (o.type === 'rock') m.position.y = 0;
    if (o.hit) { var hk = Math.min(1, o.hitT * 2); if (o.type === 'buoy' || o.type === 'gulls') { m.position.y += Math.sin(hk * PI) * 1.8; m.rotation.x += hk * 2; } else if (o.type === 'jet') { m.rotation.z = hk * 1.4; } else if (o.type === 'white') { m.position.y -= hk * 1.5; } }
  }
  coins.count = cc; coins.instanceMatrix.needsUpdate = true;
  drawLaneBuoys(pz, t);
  /* 보드 꼬리·레일 물보라 */
  if ((G.mode === 'play' || G.mode === 'title' || G.mode === 'shop') && !G.air && !G.dead && HERO) {
    var n = G.duck > 0 ? 0 : 2 + (Math.abs(G.xv) > 2 ? 3 : 0);
    for (var w2 = 0; w2 < n; w2++) { var q3 = parts[partHead]; partHead = (partHead + 1) % PART_N; var sd = (w2 % 2) ? 1 : -1;
      q3.x = px + sd * rnd(0.2, 0.32) - G.xv * 0.02; q3.y = wy + 0.05; q3.z = pz + rnd(0.2, 1.0); q3.vx = sd * rnd(0.8, 2.2) - G.xv * 0.3; q3.vy = rnd(1.2, 2.8); q3.vz = rnd(1.5, 4); q3.r = rnd(0.07, 0.15); q3.life = q3.max = rnd(0.35, 0.6); }
  }
  var pc = 0;
  for (var q4 = 0; q4 < PART_N; q4++) { var r = parts[q4]; if (r.life <= 0) continue; r.life -= dt; r.x += r.vx * dt; r.y += r.vy * dt; r.vy -= 11 * dt; r.z += r.vz * dt; if (r.y < -0.2) r.life = 0;
    partPos[pc * 3] = r.x; partPos[pc * 3 + 1] = r.y; partPos[pc * 3 + 2] = r.z; partSz[pc] = r.r * (1.4 - r.life / r.max * 0.5); partA[pc] = Math.min(1, r.life / r.max * 2.2) * 0.85; pc++; }
  partGeo.setDrawRange(0, pc); partGeo.attributes.position.needsUpdate = true; partGeo.attributes.sz.needsUpdate = true; partGeo.attributes.al.needsUpdate = true;
  /* 상어: 위험한 동안 뒤에서 따라붙고, 쓰러지면 덮친다 */
  var dg = G.dead ? 1 : G.danger / 3.5;
  shark.visible = dg > 0.01;
  if (shark.visible) { var back = G.dead ? 2.2 - Math.min(1, G.deadT) * 2.2 : 2.6 + (1 - dg) * 5; shark.position.set(px + Math.sin(t * 2.2) * 0.6, seaH(px, pz + back, t) + (G.dead ? Math.sin(Math.min(1, G.deadT * 1.5) * PI) * 1.2 : 0), pz + back);
    shark.userData.b.rotation.y = Math.sin(t * 5) * 0.12; if (Math.random() < 0.5) spray(1, 0, shark.position.x, 0.2, shark.position.z - 0.5); }
  /* 그림자 받는 판을 물결에 맞춘다 */
  shadowCatcher.position.set(px, 0.03, pz - 4);
  for (var sc2 = 0; sc2 < catcherP.count; sc2++) catcherP.setY(sc2, seaH(px + catcherX[sc2], pz - 4 + catcherZ[sc2], t));
  catcherP.needsUpdate = true;
  /* 해 그림자 상자는 주인공을 따라간다 */
  sun.position.set(px + SUN_DIR.x * 40, SUN_DIR.y * 40 + 10, pz + SUN_DIR.z * 40); sun.target.position.set(px, 0, pz - 3); sun.target.updateMatrixWorld();
  /* 카메라: 뒤 위에서. 타이틀은 앞 오른쪽에서 얼굴을 본다 */
  var kk = G.camK, sh = G.shake > 0 ? G.shake : 0, fovK = clamp((G.speed - 17) / 17, 0, 1);
  var back2 = WIDE ? 6.0 : 6.6, up = WIDE ? 2.9 : 3.6;
  _tp.set(px * 0.6, up + G.jy * 0.35 + wy * 0.5, pz + back2); _tl.set(px * 0.5, 1.1 + G.jy * 0.3, pz - 12);
  _cp.set(px + 3.6 + Math.sin(t * 0.15) * 0.6, 1.5 + wy, pz - 3.4); _cl.set(px + 0.1, 1.05 + wy + G.jy * 0.6, pz + 0.4);
  if (WIDE) _cp.set(px + 4.4, 1.6 + wy, pz - 2.8);
  if (G.mode === 'shop') { if (WIDE) { _cl.x -= 1.5; _cl.z -= 1.5; _cl.y -= 0.2; } else { _cp.multiplyScalar(1).add(_va.set(0.9, 0.9, -0.6)); _cl.y -= 1.35; } }   /* 상점 판이 가리지 않게 헬라를 위(세로)·왼쪽(가로)으로 */
  camPos.copy(_cp).lerp(_tp, kk); camLook.copy(_cl).lerp(_tl, kk);
  if (sh > 0) { camPos.x += (Math.random() * 2 - 1) * sh * 0.25; camPos.y += (Math.random() * 2 - 1) * sh * 0.2; }
  cam.position.copy(camPos); cam.lookAt(camLook); cam.rotateZ(clamp(-G.xv * 0.006, -0.06, 0.06) * kk);
  var fov = (WIDE ? 52 : 64) + fovK * 6 * kk + (G.dolphin > 0 ? 4 : 0); if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix(); }
  sky.position.copy(cam.position);
  farG.position.set(cam.position.x * 0.95, 0, cam.position.z - 700);
  $('uw').style.opacity = ((HERO ? HERO.p.duck : 0) * 0.85).toFixed(3);
  $('dolv').style.opacity = G.dolphin > 0 && !G.dead ? (0.6 + Math.sin(t * 6) * 0.2).toFixed(3) : '0';
  R.render(S, cam);
}

/* ====================================================================== 화면 크기 */
function resize() {
  var w = innerWidth, h = innerHeight; W = w; H = h; WIDE = w / h > 1.2;
  PR = Math.min(devicePixelRatio || 1, QUAL >= 2 ? 1.5 : 1);
  R.setPixelRatio(PR); R.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cam.aspect = w / h; cam.fov = WIDE ? 52 : 64; cam.updateProjectionMatrix();
  U_PT.uScale.value = h * PR / (2 * Math.tan(cam.fov * PI / 360));
  document.documentElement.classList.toggle('wide', WIDE);
  U = WIDE ? h / 1080 : w / 1080;
  var rs = document.documentElement.style; rs.setProperty('--u', U + 'px');
}

/* ====================================================================== 흐름 */
function clearObjs() { G.objs.forEach(function (o) { give(o.m); }); G.objs = []; }
function resetRun(demo) {
  clearObjs(); G.fxs.forEach(function (f) { f.el.remove(); }); G.fxs = [];
  G.z = 0; G.dist = 0; G.nextZ = 40; G.lane = 1; G.x = 0; G.xv = 0; G.jy = 0; G.jv = 0; G.air = false; G.duck = 0; G.danger = 0; G.hitT = 0;
  G.dead = false; G.deadT = 0; G.coins = 0; G.dolphin = 0; G.magnet = 0; G.shield = 0; G.speed = demo ? 14 : 0; G.R = {}; G.bot = !!demo; G.shake = 0; G.landT = 0;
  for (var i = 0; i < PART_N; i++) parts[i].life = 0;
  hudCache = {}; hud();
}
function setMode(m) { G.mode = m; document.body.className = (EN ? 'en ' : '') + 'm-' + m; $('title').hidden = m !== 'title'; $('shop').hidden = m !== 'shop'; $('pause').hidden = m !== 'pause'; $('over').hidden = m !== 'over'; $('loading').hidden = m !== 'load'; }
function toTitle() { resetRun(true); setMode('title'); $('best').textContent = TX.best[0] + Math.floor(G.best); }
function startRun() { SFX.unlock(); resetRun(false); misLoad(); setMode('play');
  /* 산 시작 아이템은 한 판에 하나씩 저절로 쓴다 */
  if (SH.stock.shield > 0) { SH.stock.shield--; G.shield = 1; fx('SHIELD', 'b'); }
  if (SH.stock.magnet > 0) { SH.stock.magnet--; G.magnet = 10; setTimeout(function () { fx('MAGNET', 'b'); }, 350); }
  save(); }
function pause() { if (G.mode !== 'play' || G.dead) return; setMode('pause'); misHTML($('misP')); }
function resume() { if (G.mode !== 'pause') return; setMode('play'); }
function gameOver() {
  setMode('over'); overAt = performance.now(); G.total += G.coins; var sc = score(), nb = sc > G.best; if (nb) G.best = sc; save();
  $('oScore').textContent = sc; $('oDist').textContent = Math.floor(G.dist) + 'm'; $('oMult').textContent = 'x' + G.mult; $('oCoin').textContent = G.coins; $('oBest').textContent = TX.best[0] + Math.floor(G.best); $('newbest').hidden = !nb; misHTML($('misO'));
}
$('startB').onclick = function () { SFX.click(); startRun(); };
$('shopB').onclick = function () { SFX.click(); openShop(); };
$('shopX').onclick = function () { SFX.click(); setMode('title'); $('best').textContent = TX.best[0] + Math.floor(G.best); };
['board', 'outfit', 'item'].forEach(function (t) { $('tab_' + t).onclick = function () { SFX.click(); shopTab = t; shopHTML(); }; });
$('shopList').onclick = function (e) { var b = e.target.closest('.item'); if (b) shopTap(b.getAttribute('data-id')); };
$('retryB').onclick = function () { SFX.click(); startRun(); };
$('homeB').onclick = function () { SFX.click(); toTitle(); };
$('homeB2').onclick = function () { SFX.click(); toTitle(); };
$('pauseB').onclick = function () { SFX.click(); pause(); };
$('resumeB').onclick = function () { SFX.click(); resume(); };
function togInit(id, key, setter) { var b = $(id); b.classList.toggle('off', !SFX.state[key]); b.onclick = function () { var on = !SFX.state[key]; setter(on); b.classList.toggle('off', !on); if (on) SFX.click(); }; }
togInit('bgmB', 'bgm', SFX.setBgm); togInit('sfxB', 'snd', SFX.setSnd);
document.addEventListener('visibilitychange', function () { if (document.hidden && G.mode === 'play') pause(); });
window.addEventListener('pointerdown', function () { SFX.unlock(); }, { once: true });
document.title = L(TX.title); $('logo').textContent = L(TX.title);
if (EN) { $('tab_board').firstChild.textContent = 'BOARD'; $('tab_outfit').firstChild.textContent = 'OUTFIT'; $('tab_item').firstChild.textContent = 'ITEM'; }
window.addEventListener('resize', resize);
resize();

/* ====================================================================== 모델 불러오기(http 면 받기, file:// 면 옆의 .glb.js 사본) */
function loadGLB(url) {
  var parse = function (buf) { return new Promise(function (res, rej) { new window.GLTFLoaderClass().parse(buf, '', res, rej); }); };
  if (location.protocol === 'file:') {
    return new Promise(function (res, rej) {
      var name = url.split('/').pop();
      var done = function () { var b64 = window.GLBJS && window.GLBJS[name]; if (!b64) return rej(new Error('no glbjs')); var bin = atob(b64), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); window.GLBJS[name] = null; parse(u8.buffer).then(res, rej); };
      var s = document.createElement('script'); s.src = url + '.js'; s.onload = done; s.onerror = function () { rej(new Error('load')); }; document.head.appendChild(s);
    });
  }
  return new Promise(function (res, rej) {
    var x = new XMLHttpRequest(); x.open('GET', url); x.responseType = 'arraybuffer';
    x.onprogress = function (e) { if (e.total) $('loadBar').style.width = Math.round(e.loaded / e.total * 100) + '%'; };
    x.onload = function () { if (x.status === 200 || x.status === 0) parse(x.response).then(res, rej); else rej(new Error(x.status)); };
    x.onerror = function () { rej(new Error('xhr')); }; x.send();
  });
}
setMode('load');
bakeEnv();
loadGLB('assets/models/hero.glb').then(function (gltf) {
  HERO = makeSurfer(gltf, 1.68); applyLook();
  /* 처음 나오는 모양·재질을 한 번 그려 둔다(화면 밖이어도 올라가게 잘라내기를 잠깐 끈다) */
  var all = []; for (var k in OM) OM[k].forEach(function (m) { all.push(m); });
  all.forEach(function (m) { m.visible = true; m.position.set(0, 0, -15); });
  shark.visible = true;
  var culled = []; S.traverse(function (o) { if ((o.isMesh || o.isPoints || o.isSprite) && o.frustumCulled) { culled.push(o); o.frustumCulled = false; } });
  draw(0); coins.count = 3; partGeo.setDrawRange(0, 3); R.compile(S, cam); R.render(S, cam); coins.count = 0;
  culled.forEach(function (o) { o.frustumCulled = true; });
  all.forEach(function (m) { m.visible = false; }); shark.visible = false;
  toTitle();
}).catch(function (e) { console.error(e); });

var lastTs = 0;
function frame(ts) {
  var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0; lastTs = ts;
  if (!document.hidden && !(window.__sf && window.__sf.frozen)) { step(dt); draw(dt); qualWatch(dt); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__sf = {
  G: G, cam: cam, S: S, R: R, hero: function () { return HERO; }, grow: function () { return __grow; },
  tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) { step(dt || 1 / 60); draw(dt || 1 / 60); } },
  start: startRun, title: toTitle, key: input, add: addObj, coin: addCoin, power: addPower, clear: clearObjs, resize: resize, draw: draw,
  shot: function (name) { R.render(S, cam); return fetch('/save?name=' + name, { method: 'POST', body: cv.toDataURL('image/png') }).then(function (r) { return r.text(); }); }
};
})();
