/* world.js — 밤 계곡 물길: 굽이치며 이어지는 강을 거슬러 오른다 (청크 생성, 판 없음) */
(function () {
  const W = {};
  const MOON = [-.28, .17, .95];
  const WAVES = [ // 방향x, 방향z, 진폭, 파장, 속도
    [1, .25, .04, 7, 1.1], [-.5, 1, .03, 4.6, 1.4], [.7, -.6, .02, 2.6, 1.9], [-.3, -1, .012, 1.6, 2.4],   // 얕은 강이라 물결도 낮다
  ];
  WAVES.forEach(w => { const l = Math.hypot(w[0], w[1]); w[0] /= l; w[1] /= l; });
  W.height = function (x, z, t) { let y = 0; for (const w of WAVES) { const k = 6.283 / w[3]; y += w[2] * Math.sin(k * (w[0] * x + w[1] * z) - w[4] * t); } return y; };

  // 결정적 잡음 — 같은 자리는 늘 같은 지형
  function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
  function noise(x, z) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return (hash(ix, iz) * (1 - u) + hash(ix + 1, iz) * u) * (1 - v) + (hash(ix, iz + 1) * (1 - u) + hash(ix + 1, iz + 1) * u) * v; }
  function fbm(x, z) { return noise(x, z) * .5 + noise(x * 2.1, z * 2.1) * .25 + noise(x * 4.3, z * 4.3) * .125 + noise(x * 8.7, z * 8.7) * .0625; }
  W.noise = noise; W.fbm = fbm;
  let seedRnd = 1;
  function rnd() { seedRnd = (seedRnd * 16807) % 2147483647; return (seedRnd - 1) / 2147483646; }

  // ── 물길 ──
  const CH = 120;                    // 청크 길이
  W.ZS = .7;                         // 맵 길이 배율 — 위치 숫자는 전부 옛 1800m 기준으로 적고 이 배율을 곱한다(2026-09-16 사장님 "맵이 너무 길어 70%")
  W.CH = CH; W.END = Math.round(1800 * W.ZS);   // 발원지
  W.CAMP_Z = Math.round(352 * W.ZS);            // 낚시꾼 아저씨 야영지 — 돌탑·아저씨 자리가 같이 본다
  W.cx = z0 => { const z = z0 / W.ZS; return (Math.sin(z * .0115) * 24 + Math.sin(z * .0295 + 1.7) * 10 + Math.sin(z * .0061 + .6) * 16) * W.ZS; };   // 물길 굽이도 같은 배율로 줄인다 — 급류·수문·퍼즐 자리 사이 관계가 옛 맵과 같다
  W.HWK = .8;   // 강폭 배율 — 급류·물살 기준도 이 배율을 따른다
  W.hw = function (z) {
    const zs = z / W.ZS;
    let w = (19 + Math.sin(zs * .021) * 5.2 + Math.sin(zs * .0073 + 2.2) * 4.2 + Math.sin(zs * .047 + .9) * 1.6) * W.HWK;   // 강폭 80%(2026-09-16 사장님)
    if (z > W.END + 8) w -= (z - W.END - 8) * .6;      // 발원지 위로는 물길이 닫힌다
    if (z < -6) w -= (-6 - z) * .5;
    return Math.max(2.5, w);
  };
  function rawH(x, z) {
    const c = W.cx(z), hw = W.hw(z), a = Math.abs(x - c), d = a - hw, u = Math.min(1, a / hw);
    const n = fbm(x * .06, z * .06);
    if (d < 0) {   // 물속 — 가운데는 아이 가슴께(0.9m), 물가로 갈수록 얕아진다. 바닥 굴곡은 물가 쪽만
      return n * 1.6 * u * u - .1 - .63 * (1 - u * u);   // 가운데 0.73m — 키 1.25m 아이 가슴께까지 찬다
    }
    const e = Math.max(0, d - 6.5);   // 물가 6.5m 는 걸어 다닐 둔치, 그 밖은 비탈
    return n * (3 + e * .3) - .3 + d * .12 + e * .95 + Math.pow(e, 1.35) * .18;
  }
  // 집터 — 마당 높이(1.0)로 평평하게 고른다. 안 고르면 강바닥(-0.7)과 비탈(2.4)이 마당을 뚫고 나와
  // 시작하자마자 아이가 땅에 허리까지 묻혀 보였다(2026-09-16). 둘레 5m 에 걸쳐 원래 땅으로 돌아간다
  // 높이는 돌 기단 윗면(1.0)보다 7cm 낮게 — 같은 높이면 두 면이 번갈아 그려져 바닥이 번쩍인다(z-fighting, 2026-09-16)
  const YARD_X = W.cx(-42), YARD_Z = -41, YARD_Y = .93;
  // 물레방아 수로 — 바퀴 둘레를 물길 깊이로 파서 바퀴가 물에 잠겨 돈다(2026-09-16 사장님 "땅에서 도네")
  let MILL = null;   // { x, z, t } — 방앗간 가운데, 물 쪽 방향(t)
  function millDig(x, z, h) {
    if (!MILL) return h;
    const sx = (x - MILL.x) * MILL.t, dz = Math.abs(z - MILL.z);
    const o = Math.max(1.9 - sx, sx - 7, dz - 3.1);   // 바퀴 자리(방앗간 벽 옆 ~ 물 쪽 7m) 밖으로 얼마나 나왔나
    if (o >= 1.4) return h;
    const k = o <= 0 ? 1 : 1 - o / 1.4, sm = k * k * (3 - 2 * k);
    return Math.min(h, h + (-.95 - h) * sm);
  }
  W.terrainH = function (x, z) {
    const h = millDig(x, z, rawH(x, z));
    const o = Math.max(Math.abs(x - YARD_X) - 6.6, Math.abs(z - YARD_Z) - 6.8);   // 마당 네모 밖으로 얼마나 나왔나
    if (o >= 5) return h;
    if (o <= 0) return YARD_Y;
    const k = 1 - o / 5, s = k * k * (3 - 2 * k);
    return h + (YARD_Y - h) * s;
  };
  W.isShallow = function (x, z) { return W.terrainH(x, z) > -1.6; };
  // 급류 — 물길이 좁아지는 여울일수록, 가운데일수록 세다. 아래(-z)로 흐른다. 반환 { x, z, s }
  const _flow = { x: 0, z: 0, s: 0 };
  W.flow = function (x, z) {
    const hw = W.hw(z), u = Math.min(1, Math.abs(x - W.cx(z)) / hw);
    if (u >= 1) { _flow.x = _flow.z = _flow.s = 0; return _flow; }
    const k = Math.max(0, Math.min(1, (21 * W.HWK - hw) / (8 * W.HWK)));
    const s = (.35 + 2.0 * k * k) * (1 - u * u) * (W.calmAt ? W.calmAt(z) : 1);   // 수문을 닫으면 잦아든다
    const sl = (W.cx(z + 1) - W.cx(z - 1)) / 2, l = Math.hypot(sl, 1);   // 물길 굽이를 따라 흐른다
    _flow.x = -sl / l * s; _flow.z = -1 / l * s; _flow.s = s; return _flow;
  };

  // ── 하늘·물 셰이더 ──
  const skyVert = `varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0); }`;
  const skyFrag = `varying vec3 vW; uniform vec3 uTop, uHor, uMoon; void main(){ vec3 d = normalize(vW); float t = clamp(d.y*1.6+0.05, 0.0, 1.0); vec3 c = mix(uHor, uTop, pow(t, 0.55)); float m = max(dot(d, normalize(uMoon)), 0.0); c += vec3(0.55,0.62,0.7)*pow(m, 60.0)*0.3 + vec3(0.25,0.3,0.38)*pow(m, 6.0)*0.18; gl_FragColor = vec4(c, 1.0); }`;
  const waterVert = `
    uniform float uTime; varying vec3 vW; varying vec3 vN;
    void main(){
      vec3 p = (modelMatrix*vec4(position,1.0)).xyz; float y = 0.0; vec2 dn = vec2(0.0);
      ${WAVES.map(w => `{ float k = ${(6.283 / w[3]).toFixed(4)}; float f = k*(${w[0].toFixed(3)}*p.x + ${w[1].toFixed(3)}*p.z) - ${w[4].toFixed(2)}*uTime; y += ${w[2]}*sin(f); dn += vec2(${w[0].toFixed(3)}, ${w[1].toFixed(3)})*k*${w[2]}*cos(f); }`).join('\n')}
      p.y += y; vW = p; vN = normalize(vec3(-dn.x, 1.0, -dn.y));
      gl_Position = projectionMatrix*viewMatrix*vec4(p,1.0);
    }`;
  const waterFrag = `
    precision highp float;
    uniform vec3 uCam, uMoon, uDeep, uShallow, uSkyTop, uSkyHor, uFogCol, uLampP, uLampC; uniform float uTime, uFogD, uUnder, uLamp;
    varying vec3 vW; varying vec3 vN;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec3 n = normalize(vN);
      float r1 = sin(vW.x*3.1 + uTime*2.1 + vW.z*1.7) + sin(vW.x*6.3 - uTime*2.9)*0.5;
      float r2 = sin(vW.z*3.7 - uTime*1.7 + vW.x*1.1) + sin(vW.z*7.1 + uTime*2.3)*0.5;
      n = normalize(n + vec3(r1*0.03, 0.0, r2*0.03));
      vec3 V = normalize(uCam - vW); float ndv = max(dot(n, V), 0.0);
      float fres = 0.04 + 0.96*pow(1.0 - ndv, 5.0);
      vec3 R = reflect(-V, n);
      vec3 sky = mix(uSkyHor, uSkyTop, pow(clamp(R.y, 0.0, 1.0), 0.5));
      float dark = noise(vW.xz*0.08 + uTime*0.02);
      vec3 water = mix(uDeep, uShallow, dark*0.35);
      vec3 col = mix(water, sky, fres*0.8);
      float md = max(dot(R, normalize(uMoon)), 0.0);
      float glint = pow(md, 260.0)*0.5 + pow(md, 30.0)*0.22 + pow(md, 5.0)*0.05;
      float shimmer = 0.45 + 0.55*noise(vW.xz*2.1 + vec2(uTime*0.7, -uTime*0.5)) + 0.35*noise(vW.xz*5.3 - vec2(uTime*1.3, uTime*0.9));
      col += vec3(0.72,0.8,0.92)*glint*shimmer;
      if (uLamp > 0.01) {   // 들고 있는 등불이 물 위에 어른거린다
        float ld = length(vW.xz - uLampP.xz);
        col += uLampC * uLamp * exp(-ld*ld*0.030) * (0.35 + 0.45*shimmer);
      }
      float dist = length(uCam - vW); float fog = 1.0 - exp(-dist*dist*uFogD*uFogD);
      col = mix(col, uFogCol, clamp(fog, 0.0, 1.0));
      float a = 0.9;
      if (!gl_FrontFacing || uUnder > 0.5) { col = mix(uDeep*0.6, vec3(0.05,0.14,0.13), pow(1.0-ndv, 2.0)); col += vec3(0.08,0.16,0.14)*pow(md, 8.0); a = 0.85; }
      gl_FragColor = vec4(col, a);
    }`;

  // ── 물감 ──
  const treeGeo = (() => { const g = new THREE.ConeGeometry(1, 1, 6); g.translate(0, .5, 0); return g; })();
  const treeMat = new THREE.MeshLambertMaterial({ color: 0x172b1e });
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x47514f, flatShading: true });
  const groundMat = new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 0, specular: 0x000000 });
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x4b3a28 });
  const tileMat = new THREE.MeshLambertMaterial({ color: 0x333a40 });
  const clothMat = new THREE.MeshLambertMaterial({ color: 0x6e2622, side: THREE.DoubleSide });
  const deadMat = new THREE.MeshLambertMaterial({ color: 0x272620 });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xcfe0e4, transparent: true, opacity: .5, depthWrite: false, side: THREE.DoubleSide });
  const skinMat = new THREE.MeshLambertMaterial({ color: 0xe8c4a4 });

  // ── 명소 ──
  W.MARKS = [
    { z: Math.round(160 * W.ZS), t: 'seonang', cp: 1, ko: '서낭당', en: 'SHRINE' },
    { z: Math.round(300 * W.ZS), t: 'bridge', ko: '무너진 다리', en: 'BROKEN BRIDGE', item: { k: 'shoe', ko: '신발 한 짝', en: 'A SHOE' } },
    { z: Math.round(450 * W.ZS), t: 'village', ko: '잠긴 마을', en: 'SUNKEN VILLAGE', item: { k: 'bag', ko: '가방', en: 'A BAG' } },
    { z: Math.round(620 * W.ZS), t: 'seonang', cp: 1, ko: '서낭당', en: 'SHRINE' },
    { z: Math.round(780 * W.ZS), t: 'mill', ko: '물레방아', en: 'WATERMILL', item: { k: 'tie', ko: '머리끈', en: 'A HAIR TIE' } },
    { z: Math.round(940 * W.ZS), t: 'boat', ko: '뒤집힌 배', en: 'CAPSIZED BOAT', item: { k: 'torch', ko: '손전등', en: 'A FLASHLIGHT' } },
    { z: Math.round(1100 * W.ZS), t: 'seonang', cp: 1, ko: '서낭당', en: 'SHRINE' },
    { z: Math.round(1270 * W.ZS), t: 'deadwood', ko: '잠긴 숲', en: 'DROWNED FOREST' },
    { z: Math.round(1430 * W.ZS), t: 'falls', ko: '폭포', en: 'THE FALLS', item: { k: 'coat', ko: '비옷', en: 'A RAINCOAT' } },
    { z: Math.round(1590 * W.ZS), t: 'seonang', cp: 1, ko: '서낭당', en: 'SHRINE' },
    { z: Math.round(1800 * W.ZS), t: 'spring', ko: '발원지', en: 'THE SOURCE' },
  ];
  W.MARKS.forEach((m, i) => {
    m.i = i; const c = W.cx(m.z), hw = W.hw(m.z), side = i % 2 ? 1 : -1;
    if (m.t === 'seonang' || m.t === 'mill') { m.x = c + side * (hw + 1.1); m.r = 20; }
    else { m.x = c; m.r = 17; }
    if (m.item) {   // 명소 구조물(다리 조각·지붕·배·폭포 바위)에 가리지 않게 아래쪽(오는 쪽)에 둔다
      const off = { bridge: -9, village: -16, mill: 6, boat: -9, falls: -8 }[m.t] || 0;
      m.item.i = i; m.item.z = m.z + off; m.item.x = W.cx(m.item.z) + side * W.hw(m.item.z) * .42;
    }
  });
  { const mm = W.MARKS.find(m => m.t === 'mill'); MILL = { x: mm.x, z: mm.z, t: mm.x > W.cx(mm.z) ? -1 : 1 }; }
  W.HOME = { x: W.cx(-42), z: -35.6, y: 1.0 };   // 집 마당 — 출발점 (LAND.home 과 같은 자리)
  W.found = new Set(); W.taken = new Set(); W.lampTaken = new Set();
  W.TRACE_N = W.MARKS.filter(m => m.item).length;   // 동생이 흘리고 간 흔적 — 다 찾아야 발원지에서 동생을 만난다

  // ── 부적 ──
  // 물길 양옆 장대에 붙어 있다. 한 판에 이 가운데 여덟이 고른다.
  W.CHARM_N = 8;
  W.CHARM_SPOTS = [
    { z: Math.round(88 * W.ZS), s: -1 }, { z: Math.round(212 * W.ZS), s: 1 }, { z: Math.round(268 * W.ZS), s: -1 }, { z: Math.round(356 * W.ZS), s: 1 },
    { z: Math.round(402 * W.ZS), s: -1 }, { z: Math.round(508 * W.ZS), s: 1 }, { z: Math.round(564 * W.ZS), s: -1 }, { z: Math.round(676 * W.ZS), s: 1 },
    { z: Math.round(724 * W.ZS), s: -1 }, { z: Math.round(836 * W.ZS), s: 1 }, { z: Math.round(892 * W.ZS), s: -1 }, { z: Math.round(1004 * W.ZS), s: 1 },
    { z: Math.round(1052 * W.ZS), s: -1 }, { z: Math.round(1164 * W.ZS), s: 1 }, { z: Math.round(1216 * W.ZS), s: -1 }, { z: Math.round(1328 * W.ZS), s: 1 },
    { z: Math.round(1372 * W.ZS), s: -1 }, { z: Math.round(1484 * W.ZS), s: 1 }, { z: Math.round(1536 * W.ZS), s: -1 }, { z: Math.round(1652 * W.ZS), s: 1 },
    { z: Math.round(1708 * W.ZS), s: -1 },
  ];
  W.CHARM_SPOTS.forEach((c, i) => {
    c.i = i;
    const cx = W.cx(c.z), hw = W.hw(c.z);
    c.x = cx + c.s * (hw + 2.6 + (i % 3) * 1.1);
    c.y = W.terrainH(c.x, c.z);
  });
  W.charms = new Set(); W.charmTaken = new Set();
  // 한 판의 부적 자리 — 씨앗값으로 고르고, 여덟은 물길을 따라 고르게 흩어진다
  W.pickCharms = function (seed) {
    const all = W.CHARM_SPOTS, per = all.length / W.CHARM_N;
    let r = (seed || 1) >>> 0 || 1;
    const rn = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; };
    const out = new Set();
    for (let k = 0; k < W.CHARM_N; k++) {
      const lo = Math.floor(k * per), hi = Math.min(all.length - 1, Math.floor((k + 1) * per) - 1);
      out.add(all[lo + Math.floor(rn() * (hi - lo + 1))].i);
    }
    return out;
  };

  let _charmTex = null;
  function charmTex() {
    if (_charmTex) return _charmTex;
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 208; const c = cv.getContext('2d');
    c.fillStyle = '#e3cf96'; c.fillRect(0, 0, 128, 208);
    const gr = c.createLinearGradient(0, 0, 0, 208); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(90,70,30,.22)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 208);
    c.strokeStyle = '#9e2118'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = 9; c.beginPath(); c.moveTo(64, 20); c.lineTo(64, 188); c.stroke();          // 가운데 긴 획
    c.lineWidth = 7;
    [46, 84, 122, 160].forEach((y, i) => { const w = 30 - (i % 2) * 9; c.beginPath(); c.moveTo(64 - w, y); c.lineTo(64 + w, y); c.stroke(); });
    c.lineWidth = 6; c.beginPath(); c.arc(64, 32, 17, 0, 6.283); c.stroke();                   // 머리 동그라미
    c.beginPath(); c.moveTo(40, 176); c.lineTo(64, 196); c.lineTo(88, 176); c.stroke();        // 아래 뾰족한 끝
    _charmTex = new THREE.CanvasTexture(cv); return _charmTex;
  }
  W.charmTex = charmTex;
  W.makeCharm = function (spot) {
    const g = new THREE.Group(); g.position.set(spot.x, spot.y, spot.z);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .11, 3.1, 6), woodMat); post.position.y = 1.45; g.add(post);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 5), woodMat); arm.position.set(0, 2.75, 0); arm.rotation.z = Math.PI / 2; g.add(arm);
    const tx = charmTex();
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(.8, 1.3), new THREE.MeshLambertMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: .32, side: THREE.DoubleSide, transparent: true }));
    paper.position.set(0, 2.05, .17); g.add(paper);   // 장대 앞으로 띄운다
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xffd89a, transparent: true, opacity: .5, depthWrite: false })); glow.scale.set(3.8, 3.8, 1); glow.position.y = 2.2; g.add(glow);
    const li = new THREE.PointLight(0xffc878, 1.5, 13, 1.8); g.add(li);
    g.userData = { charm: spot, paper, glow, light: li };
    g.rotation.y = Math.PI;   // 물길을 거슬러 오르는 쪽에서 앞면이 보인다
    return g;
  };

  // ── 장면 ──
  W.build = function (scene) {
    const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTop: { value: new THREE.Color(0x101c30) }, uHor: { value: new THREE.Color(0x3a5062) }, uMoon: { value: new THREE.Vector3(...MOON) } } }));
    scene.add(sky); W.sky = sky;
    { const n = 1400, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const th = Math.random() * 6.283, ph = Math.acos(Math.random() * .9 + .08); pos[i * 3] = 850 * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = 850 * Math.cos(ph); pos[i * 3 + 2] = 850 * Math.sin(ph) * Math.sin(th); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const st = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8e2, size: 2.2, sizeAttenuation: false, fog: false, transparent: true, opacity: .8 })); scene.add(st); W.stars = st; }
    { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'); const gr = c.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(240,244,250,1)'); gr.addColorStop(.35, 'rgba(225,232,240,.95)'); gr.addColorStop(.42, 'rgba(180,200,215,.25)'); gr.addColorStop(1, 'rgba(120,150,170,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); const tex = new THREE.CanvasTexture(cv); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, fog: false, transparent: true, depthWrite: false })); sp.scale.set(120, 120, 1); scene.add(sp); W.moon = sp; }
    const hemi = new THREE.HemisphereLight(0x4c6b84, 0x1a2a24, 1.45); scene.add(hemi);
    const moonL = new THREE.DirectionalLight(0xc4dcf2, 1.7); moonL.position.set(MOON[0] * 100, MOON[1] * 100, MOON[2] * 100); scene.add(moonL);
    const amb = new THREE.AmbientLight(0x33495a, 1.55); scene.add(amb);
    W.lights = { hemi, moonL, amb };
    scene.fog = new THREE.FogExp2(0x162834, .0104);
    W.fogAir = { col: new THREE.Color(0x162834), d: .0104 }; W.fogWater = { col: new THREE.Color(0x072220), d: .13 };

    const wg = new THREE.PlaneGeometry(300, 300, 150, 150); wg.rotateX(-Math.PI / 2);
    W.waterMat = new THREE.ShaderMaterial({ vertexShader: waterVert, fragmentShader: waterFrag, transparent: true, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uMoon: { value: new THREE.Vector3(...MOON) }, uDeep: { value: new THREE.Color(0x0d2428) }, uShallow: { value: new THREE.Color(0x1b4841) }, uSkyTop: { value: new THREE.Color(0x101c30) }, uSkyHor: { value: new THREE.Color(0x3a5062) }, uFogCol: { value: new THREE.Color(0x162834) }, uFogD: { value: .0104 }, uUnder: { value: 0 }, uLamp: { value: 0 }, uLampP: { value: new THREE.Vector3() }, uLampC: { value: new THREE.Color(0xffb87a) } } });
    const water = new THREE.Mesh(wg, W.waterMat); water.renderOrder = 2; scene.add(water); W.water = water;
    { const n = 600, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 30; pos[i * 3 + 1] = -Math.random() * 8; pos[i * 3 + 2] = (Math.random() - .5) * 30; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8fb8a8, size: .06, transparent: true, opacity: .5 })); p.visible = false; scene.add(p); W.motes = p; }
    W.root = new THREE.Group(); scene.add(W.root);
    W.scene = scene;
  };

  // ── GLB 읽기 — http 면 그대로 받고, file:// 이면 옆에 둔 base64 사본(<이름>.glb.js)을 스크립트로 읽는다 ──
  // file:// 은 fetch 가 막혀서, 이게 없으면 index.html 을 더블클릭해 열었을 때 귀신·아저씨가 아예 안 나온다(2026-09-16)
  const _glb = {};
  W.FILE = location.protocol === 'file:' || /[?&]filetest/.test(location.search);   // filetest: http 에서 file:// 길을 시험한다
  W.glbBuf = function (url) {
    if (_glb[url]) return _glb[url];
    if (!W.FILE) return (_glb[url] = fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.arrayBuffer(); }));
    return (_glb[url] = new Promise((res, rej) => {
      const key = url.split('?')[0].split('/').pop();   // ?v= 는 캐시 깨기용 — 사본 이름엔 없다
      const sc = document.createElement('script'); sc.src = url.split('?')[0] + '.js';   // ?v= 를 떼고 붙여야 사본이 읽힌다 — 붙인 채로 두니 귀신 모델이 file:// 에서 안 떴다(2026-09-16)
      sc.onload = () => {
        const s = window.GLBJS && window.GLBJS[key]; if (!s) return rej(new Error(key + ' 사본 없음'));
        const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        window.GLBJS[key] = null; res(u.buffer);
      };
      sc.onerror = () => rej(new Error(key + '.js 못 읽음')); document.head.appendChild(sc);
    }));
  };
  W.glbLoad = url => W.glbBuf(url).then(buf => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf.slice(0), '', res, rej)));

  // ── 청크 ──
  W.chunks = new Map(); W.rocks = []; W.lamps = []; W.items = []; W.marks = []; W.spin = []; W.sways = []; W.decks = []; W.charmObjs = [];
  // 올라설 수 있는 발판 (지형이 아닌 구조물 위)
  // d.hx·d.hz 가 있으면 네모 판(선착장), d.cone 이 있으면 가운데가 높은 지붕(가장자리로 갈수록 cone 만큼 낮아진다)
  W.deckAt = function (x, z) {
    let y = null;
    for (const d of W.decks) {
      let h = null;
      if (d.hx) { if (Math.abs(x - d.x) < d.hx && Math.abs(z - d.z) < d.hz) h = d.y; }
      else { const r = Math.hypot(x - d.x, z - d.z); if (r < d.r) h = d.cone ? d.y - (r / d.r) * d.cone : d.y; }
      if (h !== null && (y === null || h > y)) y = h;
    }
    return y;
  };
  W.groundH = function (x, z) { const d = W.deckAt(x, z), t = W.terrainH(x, z); return d !== null && d > t ? d : t; };

  function buildChunk(ci) {
    seedRnd = 1000 + (ci + 64) * 7919;
    const g = new THREE.Group(); g.userData = { rocks: [], lamps: [], items: [], marks: [], spin: [], sways: [], decks: [], charms: [] };
    const z0 = ci * CH, z1 = z0 + CH, zc = z0 + CH / 2, xc = W.cx(zc);
    // 지형
    const gg = new THREE.PlaneGeometry(340, CH, 96, 52); gg.rotateX(-Math.PI / 2); gg.translate(xc, 0, zc);
    const pa = gg.attributes.position, cols = new Float32Array(pa.count * 3), c1 = new THREE.Color();
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), z = pa.getZ(i), h = W.terrainH(x, z); pa.setY(i, h);
      const steep = Math.abs(W.terrainH(x + 1.5, z) - W.terrainH(x - 1.5, z)) * .34;
      if (h < -.4) c1.setHex(0x182b24); else if (h < .7) c1.setHex(0x6b6458); else if (steep > 1.1) c1.setHex(0x535e67); else c1.setHex(0x38463b);
      c1.offsetHSL(0, 0, (noise(x * .3, z * .3) - .5) * .06);
      cols[i * 3] = c1.r; cols[i * 3 + 1] = c1.g; cols[i * 3 + 2] = c1.b;
    }
    gg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); gg.computeVertexNormals();
    g.add(new THREE.Mesh(gg, groundMat));
    // 나무
    { const n = 520, im = new THREE.InstancedMesh(treeGeo, treeMat, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), ax = new THREE.Vector3(0, 1, 0); let k = 0;
      for (let t = 0; t < n * 5 && k < n; t++) { const x = xc + (rnd() - .5) * 300, z = z0 + rnd() * CH, h = W.terrainH(x, z); if (h < 1.1 || h > 55) continue;
        if (Math.abs(x - W.cx(z)) - W.hw(z) < 9) continue;   // 걸어 다니는 둔치는 비워 둔다
        const sc = 2.4 + rnd() * 3.2; p.set(x, h - .3, z); s.set(sc * .45, sc, sc * .45); q.setFromAxisAngle(ax, rnd() * 6.28); m.compose(p, q, s); im.setMatrixAt(k++, m); }
      im.count = k; g.add(im); }
    // 바위섬 — 붙잡히지 않는 자리
    for (let i = 0; i < 4; i++) {
      const z = z0 + (i + .2 + rnd() * .6) * (CH / 4), hw = W.hw(z), x = W.cx(z) + (rnd() - .5) * hw * 1.5;
      if (z < 6) continue;                                                 // 집 마당·선착장이 있는 출발 구간은 비워 둔다 — 마당 한가운데 바위가 박혀 있었다
      if (W.terrainH(x, z) > -.14) continue;
      if (W.MARKS.some(m => Math.hypot(x - m.x, z - m.z) < 9)) continue;   // 명소 건물 속에 박히지 않게 (물레방아 안에 바위가 있었다)
      const r = 1.5 + rnd() * 1.5; g.userData.rocks.push({ x, z, r: r + 2.2 });
      const rg = new THREE.Group(); rg.position.set(x, 0, z);
      for (let j = 0; j < 4; j++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r * (.55 + rnd() * .5), 1), rockMat); m.position.set((rnd() - .5) * r * 1.2, -r * .5 + rnd() * r * .3, (rnd() - .5) * r * 1.2); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); rg.add(m); }
      g.add(rg);
    }
    // 떠 있는 등불 — 기름
    for (let i = 0; i < 2; i++) {
      const id = ci * 10 + i; if (W.lampTaken.has(id)) continue;
      const z = z0 + (i + .35 + rnd() * .3) * (CH / 2), hw = W.hw(z), x = W.cx(z) + (rnd() - .5) * hw * 1.1;
      if (z < 25) continue;                          // 출발점 앞에는 안 둔다 — 시작하자마자 주우면 가득 찬 기름이 넘쳐 버려진다
      if (W.terrainH(x, z) > -.16) continue;
      const l = W.makeLamp(x, z, false); l.userData.id = id; g.userData.lamps.push(l); g.add(l);
    }
    // 명소
    for (const m of W.MARKS) if (m.z >= z0 && m.z < z1) {
      const built = LAND[m.t](m, g); g.userData.marks.push(m);
      if (m.t !== 'seonang') {   // 달빛이 걸린 듯 형체가 드러난다
        const ml = new THREE.PointLight(0x9ec2e6, 3.2, 30, 1.5); ml.position.set(m.x, Math.max(1.5, W.terrainH(m.x, m.z)) + 3.5, m.z); g.add(ml);
      }
      if (built && built.spin) g.userData.spin.push(built.spin);
      if (m.item) itemRock(m.item, g);
      if (m.item && !W.taken.has(m.i)) { const it = makeItem(m.item); g.add(it); g.userData.items.push(it); }
    }
    if (ci === -1) { LAND.startDock(g); LAND.home(g); }
    g.userData.props = [];
    if (window.PROPS) window.PROPS.build(ci, z0, z1, g);   // 캠핑 흔적·유품·석등·수문
    if (window.PUZ) window.PUZ.build(ci, z0, z1, g);       // 퍼즐 — 부적은 전부 여기서 나온다
    if (window.UNCLE) window.UNCLE.buildChunk(ci, z0, z1, g);   // 낚시꾼 아저씨 야영지
    W.root.add(g); return g;
  }
  function disposeChunk(g) { g.traverse(o => { if (o.geometry && !o.userData.keep) o.geometry.dispose(); }); W.root.remove(g); }
  function reindex() {
    W.rocks.length = 0; W.lamps.length = 0; W.items.length = 0; W.marks.length = 0; W.spin.length = 0; W.sways.length = 0; W.decks.length = 0; W.charmObjs.length = 0; if (W.props) W.props.length = 0;
    for (const g of W.chunks.values()) { const u = g.userData; if (W.props && u.props) W.props.push(...u.props);W.rocks.push(...u.rocks); W.lamps.push(...u.lamps); W.items.push(...u.items); W.marks.push(...u.marks); W.spin.push(...u.spin); W.sways.push(...(u.sways || [])); W.decks.push(...u.decks); W.charmObjs.push(...u.charms); }
  }
  W.ensure = function (pz) {
    const c0 = Math.floor(pz / CH) - 1, c1 = c0 + 4; let ch = false;
    for (const i of [...W.chunks.keys()]) if (i < c0 || i > c1) { disposeChunk(W.chunks.get(i)); W.chunks.delete(i); ch = true; }
    for (let i = c0; i <= c1; i++) if (!W.chunks.has(i)) { W.chunks.set(i, buildChunk(i)); ch = true; }
    if (ch) reindex();
  };
  W.reset = function () { for (const i of [...W.chunks.keys()]) disposeChunk(W.chunks.get(i)); W.chunks.clear(); W.kid = null; reindex(); };

  // ── 등불·흔적 ──
  W.makeLamp = function (x, z, fixed) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const paper = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, .5, 10, 1, true), new THREE.MeshLambertMaterial({ color: 0xffb060, emissive: 0xff8c30, emissiveIntensity: 1.2, side: THREE.DoubleSide, transparent: true, opacity: .9 })); paper.position.y = fixed ? 0 : .28; g.add(paper);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .06, 10), woodMat); base.position.y = fixed ? -.28 : .02; g.add(base);
    const cap = base.clone(); cap.position.y = fixed ? .28 : .55; g.add(cap);
    const light = new THREE.PointLight(0xffa050, fixed ? 2.0 : 1.1, fixed ? 26 : 13, 1.8); light.position.y = fixed ? 0 : .3; g.add(light);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xffa050, transparent: true, opacity: .55, depthWrite: false })); glow.scale.set(2.4, 2.4, 1); glow.position.y = fixed ? 0 : .3; g.add(glow);
    g.userData = { lamp: true, taken: false, fixed, light, paper, glow };
    return g;
  };
  // 동생의 흔적 — 물 위로 머리를 내민 바위에 걸려 있다
  const TM = {
    white: new THREE.MeshLambertMaterial({ color: 0xe8e6de }), blue: new THREE.MeshLambertMaterial({ color: 0x3a6fc0 }), red: new THREE.MeshLambertMaterial({ color: 0xc0302c }),
    redDk: new THREE.MeshLambertMaterial({ color: 0x7a1c1a }), yellow: new THREE.MeshLambertMaterial({ color: 0xe0b52a, side: THREE.DoubleSide, flatShading: true }),
    black: new THREE.MeshLambertMaterial({ color: 0x1c1c1c }), lens: new THREE.MeshBasicMaterial({ color: 0xfff2c8 }),
    beam: null,
  };
  { const cv = document.createElement('canvas'); cv.width = 4; cv.height = 128; const c = cv.getContext('2d'); const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,240,200,.9)'); gr.addColorStop(.35, 'rgba(255,230,180,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 4, 128);   // 손전등 불빛 — 렌즈에서 멀수록 옅어진다
    TM.beam = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), color: 0xffffff, transparent: true, opacity: .28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); }
  function makeItem(it) {
    let beamRef = null;
    const g = new THREE.Group(), bed = Math.max(W.terrainH(it.x, it.z), -.16); g.position.set(it.x, 0, it.z);   // 흔적은 물 위로 머리를 내민 바위에 걸려 있다
    const top = bed + .08 + .62 * .52 * .8, o = new THREE.Group(); o.position.y = top; o.rotation.y = it.i * 1.7; o.scale.setScalar(1.6); g.add(o);
    const M = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); o.add(m); return m; };
    if (it.k === 'shoe') {   // 아이 운동화 한 짝 — 옆으로 누웠다
      const s = new THREE.Group(); s.rotation.z = 1.2; s.position.y = .05; o.add(s);
      const a = new THREE.Mesh(new THREE.BoxGeometry(.1, .02, .24), TM.white); a.position.y = -.035; s.add(a);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(.045, .14, 4, 8), TM.blue); b.rotation.x = Math.PI / 2; b.scale.x = 1.1; s.add(b);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.04, .045, .05, 10), TM.blue); c.position.set(0, .03, -.07); s.add(c);
      for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.07, .006, .008), TM.white); l.position.set(0, .045, .01 + i * .03); s.add(l); }
    } else if (it.k === 'bag') {   // 빨간 책가방
      const s = new THREE.Group(); s.rotation.set(-1.25, 0, .2); s.position.y = .08; o.add(s);
      const a = new THREE.Mesh(new THREE.BoxGeometry(.26, .3, .11), TM.red); s.add(a);
      const b = new THREE.Mesh(new THREE.BoxGeometry(.2, .12, .05), TM.redDk); b.position.set(0, -.07, .07); s.add(b);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .11, 12, 1, false, 0, Math.PI), TM.red); lid.rotation.z = Math.PI / 2; lid.rotation.y = Math.PI / 2; lid.position.y = .15; s.add(lid);
      for (const x of [-.07, .07]) { const st = new THREE.Mesh(new THREE.TorusGeometry(.12, .012, 4, 10, Math.PI), TM.black); st.position.set(x, 0, -.07); st.rotation.set(0, Math.PI / 2, 0); s.add(st); }
    } else if (it.k === 'tie') {   // 방울 달린 머리끈
      o.scale.setScalar(2.6);
      const a = M(new THREE.TorusGeometry(.06, .02, 8, 20), TM.red, 0, .025, 0); a.rotation.x = Math.PI / 2;
      for (const x of [-.03, .03]) M(new THREE.SphereGeometry(.028, 10, 8), new THREE.MeshPhongMaterial({ color: 0xff5a8a, shininess: 90 }), .075 + x * .3, .04, x);
    } else if (it.k === 'torch') {   // 아직 켜져 있는 노란 손전등 — 불빛이 물 위를 비춘다
      const s = new THREE.Group(); s.rotation.set(0, 0, Math.PI / 2 - .12); s.position.y = .04; o.add(s);
      const a = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, .2, 10), TM.yellow); s.add(a);
      const h = new THREE.Mesh(new THREE.CylinderGeometry(.045, .03, .06, 12), TM.black); h.position.y = .13; s.add(h);
      const l = new THREE.Mesh(new THREE.CircleGeometry(.04, 12), TM.lens); l.position.y = .161; l.rotation.x = -Math.PI / 2; s.add(l);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(.75, 3.4, 20, 1, true), TM.beam); beam.position.y = 1.86; beam.rotation.x = Math.PI; beam.visible = false; s.add(beam); beamRef = beam;   // 등불을 꺼야 보인다(puzzles.js)
    } else if (it.k === 'coat') {   // 바위에 걸친 아이 노란 비옷
      const geo = new THREE.PlaneGeometry(.55, .7, 8, 8); geo.rotateX(-Math.PI / 2); const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i); pa.setY(i, -(x * x) * 1.4 - Math.max(0, z) * .25 + Math.sin(x * 14 + z * 9) * .012); }
      geo.computeVertexNormals(); M(geo, TM.yellow, 0, .06, 0);
      const hood = M(new THREE.SphereGeometry(.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), TM.yellow, 0, .05, -.33); hood.scale.set(1, .6, 1.2);
      for (let i = 0; i < 3; i++) M(new THREE.CylinderGeometry(.012, .012, .01, 8), TM.white, 0, .07, -.2 + i * .12);
    }
    g.userData = { item: it, beam: beamRef };   // 빛나지 않는다 — 찾아내야 한다
    return g;
  }
  function itemRock(it, chunk) {   // 흔적을 주워 가도 바위는 남는다
    const bed = Math.max(W.terrainH(it.x, it.z), -.16);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.62, 0), rockMat); rock.scale.set(1.25, .52, 1.05); rock.position.set(it.x, bed + .08, it.z); rock.rotation.y = it.i; chunk.add(rock);
    chunk.userData.rocks.push({ x: it.x, z: it.z, r: .72 + 1.7 });
  }
  let _glow = null;
  W.glowTex = function () { if (_glow) return _glow; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'); const gr = c.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); _glow = new THREE.CanvasTexture(cv); return _glow; };

  // ── 명소 짓기 ──
  const LAND = {
    startDock(g) {
      const z = -4, x = W.cx(z), d = new THREE.Group(); d.position.set(x, 0, z);
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7, .35, 4), woodMat); deck.position.y = .3; d.add(deck);
      for (let i = -1; i <= 1; i += 2) for (let j = -1; j <= 1; j += 2) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, 1.6, 6), woodMat); b.position.set(i * 2.7, -.4, j * 1.5); d.add(b); }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 3.2, 6), woodMat); pole.position.set(2.6, 1.9, 0); d.add(pole);
      const l = W.makeLamp(2.6, 0, true); l.position.y = 3.3; d.add(l);
      g.add(d);
      g.userData.decks.push({ x, z, hx: 3.5, hz: 2, y: .475 });   // 널빤지 윗면에 선다
      g.userData.rocks.push({ x: x + 2.6, z, r: .15 + 1.7 });      // 등불 장대
    },
    // 남매가 살던 강가 작은 집 — 물길이 닫히는 골짜기 끝, 출발점. 뒤로는 못 간다
    home(g) {
      const Z = -42, X = W.cx(Z), TOP = 1.0, grp = new THREE.Group(); grp.position.set(X, 0, Z); g.add(grp);
      const M = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); (p || grp).add(m); return m; };
      const cv = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
      // ── 낡은 집 질감 — 전부 캔버스로 그린다(씨앗 고정이라 매번 같은 얼룩) ──
      let sd = 90417; const rn = () => (sd = sd * 16807 % 2147483647) / 2147483647;
      const crack = (c, x, y, len, ang, w) => { c.beginPath(); c.moveTo(x, y); for (let k = 0; k < len; k++) { ang += (rn() - .5) * .9; x += Math.cos(ang) * 4; y += Math.sin(ang) * 4; c.lineTo(x, y); if (rn() < .08) crack(c, x, y, len * .4 | 0, ang + (rn() - .5) * 1.6, w * .6); } c.lineWidth = w; c.stroke(); };
      // 흙벽 — 누렇게 바랜 회칠, 빗물이 흘러내린 줄, 떨어져 나가 흙과 짚이 드러난 자리, 밑동의 곰팡이·이끼, 금
      const plasterTex = cv(512, 256, (c, w, h) => {
        c.fillStyle = '#958a73'; c.fillRect(0, 0, w, h);
        { const gg = c.createLinearGradient(0, 0, 0, h); gg.addColorStop(0, 'rgba(30,24,16,.45)'); gg.addColorStop(.35, 'rgba(30,24,16,0)'); c.fillStyle = gg; c.fillRect(0, 0, w, h); }   // 처마 밑 그을음
        for (let i = 0; i < 2600; i++) { c.fillStyle = 'rgba(' + (70 + rn() * 50 | 0) + ',' + (60 + rn() * 40 | 0) + ',' + (40 + rn() * 30 | 0) + ',' + (rn() * .1) + ')'; c.fillRect(rn() * w, rn() * h, 2 + rn() * 9, 2 + rn() * 9); }
        for (let i = 0; i < 70; i++) { const x = rn() * w, len = h * (.2 + rn() * .8), g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, 'rgba(45,36,22,.5)'); g.addColorStop(1, 'rgba(45,36,22,0)'); c.fillStyle = g; c.fillRect(x, 0, 2 + rn() * 7, len); }   // 처마에서 흘러내린 빗물 자국
        for (let i = 0; i < 7; i++) {   // 회칠이 떨어져 나간 자리 — 흙과 짚
          const x = rn() * w, y = h * (.25 + rn() * .65), rx = 18 + rn() * 38, ry = 10 + rn() * 22;
          c.save(); c.beginPath(); for (let a = 0; a < 6.283; a += .4) { const r = 1 - rn() * .35; c.lineTo(x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r); } c.closePath();
          c.fillStyle = '#6e5634'; c.fill(); c.clip();
          for (let k = 0; k < 40; k++) { c.strokeStyle = 'rgba(' + (170 + rn() * 50 | 0) + ',' + (140 + rn() * 40 | 0) + ',80,.55)'; c.lineWidth = 1; c.beginPath(); const sx = x + (rn() - .5) * rx * 2, sy = y + (rn() - .5) * ry * 2, a = rn() * 3; c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * 10, sy + Math.sin(a) * 10); c.stroke(); }
          c.restore(); c.strokeStyle = 'rgba(40,30,18,.6)'; c.lineWidth = 2; c.stroke();
        }
        c.strokeStyle = 'rgba(38,30,20,.7)'; for (let i = 0; i < 9; i++) crack(c, rn() * w, rn() * h * .6, 12 + rn() * 20 | 0, 1.2 + (rn() - .5), 1.4);
        const b = c.createLinearGradient(0, h * .6, 0, h); b.addColorStop(0, 'rgba(40,60,35,0)'); b.addColorStop(1, 'rgba(40,62,34,.7)'); c.fillStyle = b; c.fillRect(0, 0, w, h);   // 밑동 이끼
        for (let i = 0; i < 260; i++) { c.fillStyle = 'rgba(' + (30 + rn() * 30 | 0) + ',' + (50 + rn() * 30 | 0) + ',' + (25 + rn() * 20 | 0) + ',' + (rn() * .45) + ')'; c.beginPath(); c.arc(rn() * w, h - rn() * rn() * h * .45, 1 + rn() * 5, 0, 6.283); c.fill(); }
      });
      const plaster = new THREE.MeshLambertMaterial({ map: plasterTex, color: 0xa39a8a });   // 불빛에 하얗게 뜨지 않게 한 톤 죽인다
      // 기둥·보 — 비바람에 회색으로 바랜 나무결, 갈라진 틈, 옹이
      const woodTex = cv(128, 512, (c, w, h) => {
        c.fillStyle = '#4b3c2e'; c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 2) { c.fillStyle = 'rgba(' + (120 + rn() * 50 | 0) + ',' + (110 + rn() * 40 | 0) + ',' + (95 + rn() * 30 | 0) + ',' + (.08 + rn() * .14) + ')'; c.fillRect(x + (rn() - .5) * 2, 0, 1 + rn() * 2, h); }
        for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(15,10,6,.75)'; c.fillRect(rn() * w, rn() * h, 1.5 + rn() * 2, 40 + rn() * 160); }
        for (let i = 0; i < 5; i++) { c.strokeStyle = 'rgba(30,20,12,.55)'; c.lineWidth = 2; c.beginPath(); c.ellipse(rn() * w, rn() * h, 6 + rn() * 8, 12 + rn() * 18, 0, 0, 6.283); c.stroke(); }
        const g2 = c.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(0,0,0,.35)'); g2.addColorStop(.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.35)'); c.fillStyle = g2; c.fillRect(0, 0, w, h);
      });
      const timber = new THREE.MeshLambertMaterial({ map: woodTex, color: 0xcfc6b8 });
      // 돌 기단 — 이끼 낀 막돌, 줄눈에 흙
      const stoneTex = cv(256, 256, (c, w, h) => {
        c.fillStyle = '#2d2c28'; c.fillRect(0, 0, w, h);
        for (let y = 0; y < h; ) { const rh = 18 + rn() * 30; for (let x = -rn() * 30; x < w; ) { const rw = 22 + rn() * 60, l = 48 + rn() * 42 | 0, tint = rn() * 12 | 0;
            c.fillStyle = 'rgb(' + (l + tint) + ',' + (l + tint - 3) + ',' + (l - 8) + ')'; c.beginPath();
            c.moveTo(x + 3 + rn() * 4, y + 2 + rn() * 3); c.lineTo(x + rw - 3 - rn() * 4, y + 2 + rn() * 4); c.lineTo(x + rw - 2 - rn() * 5, y + rh - 3 - rn() * 3); c.lineTo(x + 2 + rn() * 5, y + rh - 2 - rn() * 4); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + 6, y + 4, rw - 14, 2); x += rw; } y += rh; }
        for (let i = 0; i < 26; i++) { const x = rn() * w, y = rn() * h, r = 8 + rn() * 26, g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, 'rgba(58,82,40,.7)'); g.addColorStop(1, 'rgba(58,82,40,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }   // 이끼
      });
      stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping; stoneTex.repeat.set(4, 1.2);
      const stoneM = new THREE.MeshLambertMaterial({ map: stoneTex, flatShading: true });
      // 창호지 — 누렇게 절고 군데군데 찢어져 구멍, 덧댄 종이 조각, 부러져 처진 문살
      const paperTex = cv(128, 256, (c, w, h) => {
        c.fillStyle = '#d8c28a'; c.fillRect(0, 0, w, h);
        const gr = c.createRadialGradient(w / 2, h * .45, 10, w / 2, h * .45, h * .6); gr.addColorStop(0, 'rgba(255,196,110,.5)'); gr.addColorStop(1, 'rgba(100,70,25,.35)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(120,85,35,' + (.12 + rn() * .2) + ')'; c.beginPath(); c.ellipse(rn() * w, rn() * h, 6 + rn() * 16, 5 + rn() * 12, rn() * 3, 0, 6.283); c.fill(); }   // 물 얼룩
        for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(240,228,190,.85)'; c.fillRect(rn() * (w - 30), rn() * (h - 30), 18 + rn() * 14, 16 + rn() * 14); }   // 덧댄 종이
        c.strokeStyle = '#2a1e14'; c.lineWidth = 5; c.strokeRect(3, 3, w - 6, h - 6); c.lineWidth = 3;
        for (let x = 1; x < 4; x++) { c.beginPath(); c.moveTo(x * w / 4, 0); c.lineTo(x * w / 4, h); c.stroke(); }
        for (let y = 1; y < 8; y++) { c.beginPath(); c.moveTo(0, y * h / 8); if (y === 5) c.lineTo(w * .55, y * h / 8 + 6); else c.lineTo(w, y * h / 8); c.stroke(); }
        for (const [cx, cy] of [[1, 2], [2, 5], [2, 6], [0, 4]]) {   // 문살 한 칸이 찢겨 속이 캄캄하고, 가장자리 종이가 너덜너덜 늘어졌다
          const x0 = cx * w / 4 + 3, y0 = cy * h / 8 + 3, cw = w / 4 - 6, ch = h / 8 - 6;
          c.fillStyle = '#0d0906'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + cw, y0 + ch * .05); c.lineTo(x0 + cw, y0 + ch); c.lineTo(x0 + cw * .2, y0 + ch); c.lineTo(x0, y0 + ch * .6); c.closePath(); c.fill();
          c.fillStyle = 'rgba(215,196,140,.95)'; c.beginPath(); c.moveTo(x0 + cw * .15, y0); c.lineTo(x0 + cw * .45, y0 + ch * .05); c.lineTo(x0 + cw * .3, y0 + ch * .55); c.closePath(); c.fill();   // 늘어진 조각
        }
      });
      const paperM = new THREE.MeshLambertMaterial({ map: paperTex, emissive: 0xffa850, emissiveMap: paperTex, emissiveIntensity: .6 });
      // 기와 — 이끼가 앉고, 몇 장은 빠져 흙이 드러났다
      const tileTex = cv(512, 512, (c, w, h) => {
        c.fillStyle = '#26292c'; c.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 48) { const gr = c.createLinearGradient(x, 0, x + 48, 0); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(.45, 'rgba(130,138,144,.35)'); gr.addColorStop(1, 'rgba(0,0,0,.75)'); c.fillStyle = gr; c.fillRect(x, 0, 48, h); }
        for (let y = 0; y < h; y += 64) { c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(0, y, w, 7); c.fillStyle = 'rgba(160,165,170,.18)'; c.fillRect(0, y + 7, w, 3); }
        for (let i = 0; i < 6; i++) { const x = (rn() * 10 | 0) * 48, y = (rn() * 8 | 0) * 64; c.fillStyle = '#3c2e22'; c.fillRect(x + 4, y + 8, 40, 56); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x + 4, y + 8, 40, 10); }
        for (let i = 0; i < 14; i++) { const x = rn() * w, y = rn() * h, r = 20 + rn() * 50, g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(62,86,44,.8)'); g.addColorStop(.6, 'rgba(52,72,38,.45)'); g.addColorStop(1, 'rgba(52,72,38,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * .6, 0, 0, 6.283); c.fill(); }   // 뭉쳐 앉은 이끼
      });
      tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(.9, .7);
      const tileM = new THREE.MeshLambertMaterial({ map: tileTex, side: THREE.DoubleSide });
      // 마당 흙바닥 — 비에 젖어 다져진 갈색 흙. 물웅덩이, 자갈, 시든 풀, 물가 쪽으로 끌려간 자국
      const dirtTex = cv(512, 512, (c, w, h) => {
        c.fillStyle = '#634630'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 5200; i++) { const l = rn(); c.fillStyle = 'rgba(' + (50 + l * 45 | 0) + ',' + (36 + l * 30 | 0) + ',' + (22 + l * 18 | 0) + ',' + (.1 + rn() * .25) + ')'; c.fillRect(rn() * w, rn() * h, 1 + rn() * 4, 1 + rn() * 4); }
        for (let i = 0; i < 22; i++) { const x = rn() * w, y = rn() * h, r = 30 + rn() * 70, g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(40,26,14,.4)'); g.addColorStop(1, 'rgba(40,26,14,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }   // 젖어 검어진 자리
        for (let i = 0; i < 6; i++) { const x = rn() * w, y = rn() * h, rx = 14 + rn() * 34, ry = rx * (.4 + rn() * .3);   // 물웅덩이
          c.fillStyle = 'rgba(14,16,16,.85)'; c.beginPath(); c.ellipse(x, y, rx, ry, rn() * 3, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(80,90,92,.25)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x - rx * .15, y - ry * .2, rx * .6, ry * .35, 0, 3.4, 5.2); c.stroke(); }
        for (let i = 0; i < 420; i++) { const x = rn() * w, y = rn() * h, r = .8 + rn() * 2.4, l = 70 + rn() * 50 | 0; c.fillStyle = 'rgba(10,8,6,.6)'; c.beginPath(); c.arc(x + .8, y + .8, r, 0, 6.283); c.fill(); c.fillStyle = 'rgb(' + l + ',' + (l * .9 | 0) + ',' + (l * .78 | 0) + ')'; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill(); }   // 자갈
        for (let i = 0; i < 90; i++) { const x = rn() * w, y = rn() * h; c.strokeStyle = 'rgba(' + (70 + rn() * 30 | 0) + ',' + (62 + rn() * 20 | 0) + ',30,.55)'; c.lineWidth = 1; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rn() - .5) * 10, y - 3 - rn() * 8); c.stroke(); } }   // 시든 풀
        for (const sx of [.47, .53]) { c.strokeStyle = 'rgba(18,12,7,.55)'; c.lineWidth = 3; c.beginPath(); let x = w * sx; c.moveTo(x, h * .45); for (let y = h * .45; y < h; y += 8) { x += (rn() - .5) * 3; c.lineTo(x, y); } c.stroke(); }   // 발뒤꿈치가 끌려간 두 줄 — 물가 쪽으로
      });
      dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping; dirtTex.repeat.set(1.6, 1.6);
      const dirtM = new THREE.MeshLambertMaterial({ map: dirtTex, color: 0xcfc2b2, emissive: 0x140d07 });   // 밤에도 갈색이 읽히게 살짝 스스로 밝힌다
      const baseM = new THREE.MeshLambertMaterial({ color: 0x2a221a });   // 옆면 — 흙 둔덕
      // 마당 — 윗면만 흙, 옆은 어두운 흙 둔덕
      M(new THREE.BoxGeometry(11, 1.3, 11), [baseM, baseM, dirtM, baseM, baseM, baseM], 0, TOP - .65, 1.2);
      const edgeM = new THREE.MeshLambertMaterial({ color: 0x302b25, flatShading: true });   // 무늬 없는 거무스름한 막돌
      for (let i = 0; i < 14; i++) { const r = .32 + (i % 3) * .08; const s = M(new THREE.DodecahedronGeometry(r, 0), edgeM, -5.3 + i * .82, TOP - .15, 6.75); s.scale.y = .55; s.rotation.y = i; }   // 마당 앞 돌 테두리
      g.userData.decks.push({ x: X, z: Z + 1.2, hx: 5.5, hz: 5.5, y: TOP });
      // 몸채
      const WD = 6.2, DP = 3.6, HT = 2.2, fz = -.8;
      M(new THREE.BoxGeometry(WD, HT, DP), plaster, 0, TOP + HT / 2, fz - DP / 2 + DP / 2 - 1.8 + 1.8);
      for (const x of [-WD / 2, -1.05, 1.05, WD / 2]) for (const z of [fz + DP / 2, fz - DP / 2]) M(new THREE.BoxGeometry(.2, HT + .1, .2), timber, x, TOP + HT / 2, z);   // 기둥
      for (const z of [fz + DP / 2 + .02, fz - DP / 2 - .02]) { M(new THREE.BoxGeometry(WD + .3, .18, .22), timber, 0, TOP + HT, z); M(new THREE.BoxGeometry(WD + .1, .14, .22), timber, 0, TOP + .2, z); }   // 도리·하방
      for (const x of [-.52, .52]) M(new THREE.PlaneGeometry(1.0, 1.75), paperM, x, TOP + 1.12, fz + DP / 2 + .03);   // 두 짝 문
      for (const x of [-2.1, 2.1]) M(new THREE.PlaneGeometry(.8, .7), paperM, x, TOP + 1.35, fz + DP / 2 + .03);        // 봉창
      // 툇마루
      { const pt = cv(512, 128, (c, w, h) => { c.fillStyle = '#1a120c'; c.fillRect(0, 0, w, h); for (let k = 0; k < 6; k++) { const y = k * h / 6 + 2, l = 85 + rn() * 30 | 0; c.fillStyle = 'rgb(' + l + ',' + (l * .78 | 0) + ',' + (l * .58 | 0) + ')'; c.fillRect(0, y, w, h / 6 - 4); for (let q = 0; q < 60; q++) { c.fillStyle = 'rgba(20,14,8,' + (rn() * .3) + ')'; c.fillRect(rn() * w, y + rn() * (h / 6 - 4), 20 + rn() * 60, 1); } if (rn() < .4) { c.fillStyle = '#0c0805'; c.fillRect(rn() * w, y, 30 + rn() * 50, h / 6 - 4); } } });   // 삭아 빠진 널빤지
        M(new THREE.BoxGeometry(WD + .4, .12, 1.0), new THREE.MeshLambertMaterial({ map: pt }), 0, TOP + .45, fz + DP / 2 + .55).rotation.z = .012;
        g.userData.decks.push({ x: X, z: Z + fz + DP / 2 + .55, hx: (WD + .4) / 2, hz: .5, y: TOP + .51 }); }   // 마루 널빤지 윗면 — 마당에서 한 단 올라선다
      for (const x of [-3.1, 0, 3.1]) M(new THREE.BoxGeometry(.14, .45, .14), timber, x, TOP + .22, fz + DP / 2 + 1.0);
      // 지붕 — 박공, 처마가 길고 끝이 살짝 들렸다
      const sh = new THREE.Shape(); const ov = 1.25, half = DP / 2 + ov, rise = 1.75;
      sh.moveTo(-half, -.05); sh.quadraticCurveTo(-half * .55, .18, 0, rise); sh.quadraticCurveTo(half * .55, .18, half, -.05); sh.lineTo(half, .14); sh.quadraticCurveTo(half * .55, .36, 0, rise + .2); sh.quadraticCurveTo(-half * .55, .36, -half, .14); sh.closePath();
      const rg = new THREE.ExtrudeGeometry(sh, { depth: WD + 1.6, bevelEnabled: false }); rg.translate(0, 0, -(WD + 1.6) / 2); rg.rotateY(Math.PI / 2);
      M(rg, tileM, 0, TOP + HT + .05, fz);
      M(new THREE.BoxGeometry(WD + 1.8, .24, .34), new THREE.MeshLambertMaterial({ color: 0x1e2124 }), 0, TOP + HT + rise + .2, fz);   // 용마루
      // 마당 — 장독 둘, 빨랫줄에 걸린 작은 원피스
      // 장독 — 윤기 없이 먼지·물때가 앉았고, 작은 독은 쓰러져 있다
      const jarTex = cv(256, 128, (c, w, h) => {
        c.fillStyle = '#2e2119'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) { c.fillStyle = 'rgba(' + (90 + rn() * 40 | 0) + ',' + (80 + rn() * 30 | 0) + ',' + (60 + rn() * 20 | 0) + ',' + (rn() * .18) + ')'; c.fillRect(rn() * w, rn() * h, 1 + rn() * 5, 1 + rn() * 3); }
        for (let i = 0; i < 40; i++) { const x = rn() * w, len = h * (.2 + rn() * .6); c.fillStyle = 'rgba(12,9,6,.35)'; c.fillRect(x, h - len, 1 + rn() * 3, len); }   // 흘러내린 물때
        const b = c.createLinearGradient(0, h * .6, 0, h); b.addColorStop(0, 'rgba(34,46,28,0)'); b.addColorStop(1, 'rgba(34,46,28,.7)'); c.fillStyle = b; c.fillRect(0, 0, w, h);   // 밑동 이끼
        c.strokeStyle = 'rgba(8,6,4,.9)'; c.lineWidth = 1.6; crack(c, w * .3, h * .15, 18, 1.4, 1.6);   // 금
      });
      const jarM = new THREE.MeshLambertMaterial({ map: jarTex, color: 0x9a8a78 });
      const jg = new THREE.LatheGeometry([[0, 0], [.2, .01], [.3, .1], [.37, .3], [.38, .44], [.33, .58], [.22, .68], [.2, .72]].map(p => new THREE.Vector2(p[0], p[1])), 14);
      { const j = M(jg, jarM, -4.2, TOP, 3.2); g.userData.rocks.push({ x: X - 4.2, z: Z + 3.2, r: .38 + 1.7 }); }
      { const j = M(jg, jarM, -3.2, TOP + .27, 4.3); j.scale.setScalar(.8); j.rotation.set(0, .6, 1.45); g.userData.rocks.push({ x: X - 3.4, z: Z + 4.3, r: .35 + 1.7 }); }   // 쓰러진 독
      { const lid = M(new THREE.CylinderGeometry(.24, .26, .04, 12, 1, false, 0, 4.2), jarM, -2.6, TOP + .03, 5.0); lid.rotation.set(.1, 1.1, 0); }   // 깨진 뚜껑
      for (const x of [2.6, 5.0]) M(new THREE.CylinderGeometry(.05, .06, 2.1, 6), timber, x, TOP + 1.05, 3.6);
      M(new THREE.CylinderGeometry(.008, .008, 2.4, 3), timber, 3.8, TOP + 1.95, 3.6).rotation.z = Math.PI / 2;
      // 동생 원피스 — 비에 젖은 채 걸려 있다.
      // 납작한 판때기로 두면 종이 오린 것처럼 보인다. 앞뒤로 부푼 껍데기에 세로 주름을 잡고 밑단을 물결지게 한다.
      { const NU = 34, NV = 22, DH = .72, pos = [], uvs = [], idx = [];
        for (let j = 0; j <= NV; j++) {
          const v = j / NV;                                                        // 0 어깨 · 1 밑단
          const w = v < .3 ? .126 - v * .12 : .09 + Math.pow((v - .3) / .7, 1.5) * .205;    // 어깨 → 허리로 잘록 → 치마로 퍼짐
          const dep = w * (.52 + v * .24);                                         // 앞뒤 두께 — 안이 비어 부푼다
          for (let i = 0; i <= NU; i++) {
            const u = i / NU, a = u * Math.PI * 2;
            const deep = Math.min(1, Math.max(0, (v - .1) / .35));                 // 주름은 가슴 아래부터 깊어진다
            const fold = 1 + Math.cos(a * 6 + v * 1.1) * .16 * deep + Math.cos(a * 13 + 1.1) * .055 * deep + Math.cos(a * 3 - .7) * .07 * deep;
            const hem = v > .8 ? Math.sin(a * 4 + .6) * .03 * ((v - .8) / .2) : 0;   // 밑단이 느슨하게 물결친다
            const sh = v < .2 ? (1 - v / .2) * .034 * (Math.abs(Math.cos(a)) - .52) : 0;   // 집게에 물린 어깨는 솟고 목둘레는 처진다
            pos.push(Math.cos(a) * w * fold, -v * DH + hem + sh, Math.sin(a) * dep * fold); uvs.push(u, 1 - v);
          }
        }
        for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
        const dg = new THREE.BufferGeometry();
        dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        dg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        dg.setIndex(idx); dg.computeVertexNormals();
        // 무명천 — 올이 비치고, 밑자락은 물을 먹어 어둡고 얼룩졌다
        const clothTex = cv(128, 256, (c, w, h) => {
          c.fillStyle = '#ded4bd'; c.fillRect(0, 0, w, h);
          for (let y = 0; y < h; y += 2) { c.fillStyle = 'rgba(150,146,134,.16)'; c.fillRect(0, y, w, 1); }
          for (let x = 0; x < w; x += 2) { c.fillStyle = 'rgba(150,146,134,.12)'; c.fillRect(x, 0, 1, h); }   // 올
          for (let i = 0; i < 300; i++) { c.fillStyle = 'rgba(' + (120 + rn() * 60 | 0) + ',' + (118 + rn() * 55 | 0) + ',' + (105 + rn() * 50 | 0) + ',' + (rn() * .12) + ')'; c.fillRect(rn() * w, rn() * h, 1 + rn() * 3, 1 + rn() * 3); }
          { const gg = c.createLinearGradient(0, h * .45, 0, h); gg.addColorStop(0, 'rgba(92,96,96,0)'); gg.addColorStop(1, 'rgba(78,84,88,.52)'); c.fillStyle = gg; c.fillRect(0, 0, w, h); }   // 물 먹은 자락
          for (let i = 0; i < 9; i++) { const x = rn() * w, y = h * (.5 + rn() * .5), r = 6 + rn() * 16;
            const gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(70,78,82,.38)'); gr.addColorStop(1, 'rgba(70,78,82,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }   // 젖은 얼룩
          for (let x = 0; x < w; x++) {   // 세로 주름 — 골은 그늘, 마루는 옅은 빛. 모양 요철만으로는 밤에 안 보인다
            const u = x / w, k = -Math.cos(u * 6.283 * 6), k2 = -Math.cos(u * 6.283 * 3 - .7);
            const dark = Math.max(0, k) * .52 + Math.max(0, k2) * .24, lit = Math.max(0, -k) * .2;
            if (dark > .01) { const gg = c.createLinearGradient(0, h * .06, 0, h * .42); gg.addColorStop(0, 'rgba(44,48,50,0)'); gg.addColorStop(1, 'rgba(44,48,50,' + dark.toFixed(3) + ')'); c.fillStyle = gg; c.fillRect(x, h * .06, 1, h); }
            if (lit > .01) { const gg = c.createLinearGradient(0, h * .06, 0, h * .42); gg.addColorStop(0, 'rgba(255,250,235,0)'); gg.addColorStop(1, 'rgba(255,250,235,' + lit.toFixed(3) + ')'); c.fillStyle = gg; c.fillRect(x, h * .06, 1, h); }
          }
          // 쥐어짜 널어 생긴 가로 구김 — 자잘하게 여러 줄
          for (let i = 0; i < 26; i++) {
            const y = h * (.14 + rn() * .8), len = w * (.25 + rn() * .6), x0 = rn() * w, al = .06 + rn() * .1;
            c.strokeStyle = 'rgba(58,62,62,' + al.toFixed(3) + ')'; c.lineWidth = 1 + rn() * 1.6;
            c.beginPath(); c.moveTo(x0, y); c.bezierCurveTo(x0 + len * .3, y - 2 - rn() * 3, x0 + len * .7, y + 2 + rn() * 3, x0 + len, y); c.stroke();
            c.strokeStyle = 'rgba(255,252,240,' + (al * .55).toFixed(3) + ')';
            c.beginPath(); c.moveTo(x0, y - 1.6); c.bezierCurveTo(x0 + len * .3, y - 3.6 - rn() * 3, x0 + len * .7, y + .4 + rn() * 3, x0 + len, y - 1.6); c.stroke();
          }
          c.fillStyle = 'rgba(56,60,60,.3)'; c.fillRect(0, h * .3, w, 2); c.fillStyle = 'rgba(255,250,238,.16)'; c.fillRect(0, h * .3 + 2, w, 1);   // 허리 이음선
          c.fillStyle = 'rgba(60,64,66,.45)'; c.fillRect(0, h - 5, w, 3);                                   // 밑단 시접
          { const gg = c.createLinearGradient(0, 0, 0, h * .18); gg.addColorStop(0, 'rgba(255,255,255,.22)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(0, 0, w, h * .18); }   // 어깨는 덜 젖었다
        });
        const clothM = new THREE.MeshLambertMaterial({ map: clothTex, color: 0x998f7c, side: THREE.DoubleSide });   // 밤빛에 하얗게 뜨지 않게 한 톤 죽인다
        const dress = new THREE.Group(); dress.position.set(3.7, TOP + 1.93, 3.6); dress.rotation.set(.05, .12, 0); grp.add(dress);
        dress.add(new THREE.Mesh(dg, clothM));
        for (const sx of [-1, 1]) {   // 반소매 둘 — 어깨에 붙어 비스듬히 내려온다. 끝은 막지 않아 통이 비어 보인다
          const sl = new THREE.Mesh(new THREE.CylinderGeometry(.052, .038, .125, 10, 1, true), clothM);
          sl.position.set(sx * .105, -.035, 0); sl.rotation.z = sx * .72; sl.rotation.x = .05; dress.add(sl);
          const cuff = new THREE.Mesh(new THREE.TorusGeometry(.038, .006, 4, 10), clothM);
          cuff.position.set(sx * .147, -.088, 0); cuff.rotation.set(Math.PI / 2, 0, sx * .72); dress.add(cuff);   // 소맷부리 시접
        }
        { const yoke = new THREE.Mesh(new THREE.TorusGeometry(.046, .009, 5, 14), clothM); yoke.position.y = .004; yoke.rotation.x = Math.PI / 2; dress.add(yoke); }   // 목둘레
        g.userData.sways.push({ o: dress, p: 1.7 });
        M(new THREE.BoxGeometry(.05, .06, .03), timber, 3.58, TOP + 1.95, 3.6); M(new THREE.BoxGeometry(.05, .06, .03), timber, 3.82, TOP + 1.95, 3.6); }   // 빨래집게 둘
      // 마당 옆 감나무 — 집 윤곽을 산비탈에서 떼어 준다
      { const tx = -5.6, tz = -1.6, trunkM = new THREE.MeshLambertMaterial({ color: 0x2c2118 }), leafM = new THREE.MeshLambertMaterial({ color: 0x1f2a1e, flatShading: true });
        const tr = M(new THREE.CylinderGeometry(.14, .26, 3.4, 7), trunkM, tx, TOP + 1.6, tz); tr.rotation.z = .08;
        for (const [a, l, y] of [[.9, 1.4, 2.6], [-1.1, 1.2, 2.9], [2.4, 1.0, 3.2]]) { const b = M(new THREE.CylinderGeometry(.05, .1, l, 5), trunkM, tx + Math.cos(a) * .45, TOP + y, tz + Math.sin(a) * .45); b.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); }
        [[0, 3.9, 0, 1.3], [.9, 3.4, .4, 1.0], [-.8, 3.5, -.3, 1.05], [.2, 4.5, -.5, .85]].forEach(([x, y, z, r]) => M(new THREE.DodecahedronGeometry(r, 1), leafM, tx + x, TOP + y, tz + z));
        for (let i = 0; i < 4; i++) { const a = i * 2.4; const p = M(new THREE.SphereGeometry(.06, 6, 5), new THREE.MeshLambertMaterial({ color: 0x3e1f12 }), tx + Math.cos(a) * 1.05, TOP + 3.3 + (i % 3) * .45, tz + Math.sin(a) * .9); p.scale.y = .8; }   // 까맣게 말라붙은 감 몇 알
        g.userData.rocks.push({ x: X + tx, z: Z + tz, r: .3 + 1.7 }); }
      // 안에서 새는 불빛 — 멀리서도 집이 보인다
      const li = new THREE.PointLight(0xffb070, 3.2, 12, 1.6); li.position.set(0, TOP + 1.3, fz + DP / 2 + 1.6); grp.add(li);
      // 부딪힘 — 몸채와 기단 둘레
      for (let x = -WD / 2 - .1; x <= WD / 2 + .11; x += .6) for (const z of [fz + DP / 2, fz - DP / 2]) g.userData.rocks.push({ x: X + x, z: Z + z, r: .45 + 1.7, cam: 1 });   // 앞뒤 벽
      for (let z = -DP / 2; z <= DP / 2 + .01; z += .6) for (const x of [-WD / 2 - .1, WD / 2 + .1]) g.userData.rocks.push({ x: X + x, z: Z + fz + z, r: .45 + 1.7, cam: 1 });   // 옆벽 — 여기가 뚫려 있어서 집 안에 파묻혔다
      for (let x = -5.5; x <= 5.5; x += 1.1) g.userData.rocks.push({ x: X + x, z: Z - 4.5, r: .6 + 1.7 });   // 뒤로는 못 간다
      // 처마 — 사람은 마루 밑으로 들어가지만 카메라는 지붕에 파묻히면 안 된다 (pass: 사람은 지나간다)
      { const ex = (WD + 1.6) / 2 + .1, ez = DP / 2 + ov + .1;
        for (let x = -ex; x <= ex + .01; x += .6) for (const z of [fz + ez, fz - ez]) g.userData.rocks.push({ x: X + x, z: Z + z, r: .45 + 1.7, cam: 1, pass: 1 });
        for (let z = -ez; z <= ez + .01; z += .6) for (const x of [-ex, ex]) g.userData.rocks.push({ x: X + x, z: Z + fz + z, r: .45 + 1.7, cam: 1, pass: 1 }); }
      // 마당에서 물가로 내려가는 디딤돌
      for (let i = 0; i < 6; i++) { const z = Z + 7.4 + i * 1.3, x = W.cx(z) + (i % 2 ? .35 : -.35); const s = M(new THREE.CylinderGeometry(.42, .5, .22, 8), edgeM, x - X, Math.max(W.terrainH(x, z), -.12) + .06, z - Z); s.rotation.y = i; }
      W.HOME = { x: X, z: Z + 6.4, y: TOP };
      return {};
    },
    seonang(m, g) {
      const grp = new THREE.Group(); grp.position.set(m.x, W.terrainH(m.x, m.z) - .5, m.z); g.add(grp);
      for (let i = 0; i < 3; i++) {   // 돌탑 셋
        const t = new THREE.Group(); t.position.set((i - 1) * 2.4, 0, (i % 2) * 1.6 - .6); const n = 5 + i;
        for (let j = 0; j < n; j++) { const r = .5 - j * .055; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat); s.position.y = j * .38 + .2; s.rotation.set(j, j * 2.1, j * .7); s.scale.y = .62; t.add(s); }
        grp.add(t);
        g.userData.rocks.push({ x: m.x + t.position.x, z: m.z + t.position.z, r: .45 + 1.7 });   // 돌탑은 뚫고 지나가지 못한다
      }
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.22, .34, 5.4, 7), woodMat); trunk.position.set(-.4, 2.6, -2.2); grp.add(trunk);
      g.userData.rocks.push({ x: m.x - .4, z: m.z - 2.2, r: .34 + 1.7 });
      for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(.3, 1.5), clothMat); c.position.set(-.4 + Math.cos(i) * 1.5, 3.4 - (i % 3) * .35, -2.2 + Math.sin(i) * 1.3); grp.add(c); }
      const l = W.makeLamp(0, 0, true); l.position.set(1.1, 2.4, -1.6); grp.add(l);
      const beam = new THREE.PointLight(0xffb070, 1.4, 34, 1.7); beam.position.set(0, 3, 0); grp.add(beam);
      return {};
    },
    bridge(m, g) {
      const grp = new THREE.Group(); grp.position.set(0, 0, m.z); g.add(grp);
      const c = W.cx(m.z), hw = W.hw(m.z);
      for (const s of [-1, 1]) {   // 다리 기둥 — 네모 기둥을 원 둘로 막는다
        const p = new THREE.Mesh(new THREE.BoxGeometry(3.4, 9, 4.4), rockMat); p.position.set(c + s * (hw * .62), -2.4, 0); p.rotation.z = s * .04; grp.add(p);
        for (const dz of [-1.1, 1.1]) g.userData.rocks.push({ x: c + s * (hw * .62), z: m.z + dz, r: 1.75 + 1.7, cam: 1 });
      }
      const mid = new THREE.Mesh(new THREE.BoxGeometry(hw * .5, .6, 3.6), rockMat); mid.position.set(c - hw * .1, 1.9, 0); mid.rotation.z = .16; grp.add(mid);   // 머리 위에 걸린 상판 — 아래로 걸어 지나간다
      const brk = new THREE.Mesh(new THREE.BoxGeometry(hw * .3, .6, 3.6), rockMat); brk.position.set(c + hw * .55, -.6, .4); brk.rotation.set(.2, .1, -.5); grp.add(brk);
      g.userData.rocks.push({ x: c + hw * .55, z: m.z + .4, r: Math.min(2.6, hw * .15) + 1.7 });   // 물에 처박힌 조각
      for (let i = 0; i < 5; i++) { const zz = (i % 2 ? 2.4 : -2.2), xx = c + (i - 2) * 2.6; const d = new THREE.Mesh(new THREE.DodecahedronGeometry(.7 + (i % 3) * .3, 0), rockMat); d.position.set(xx, -.5 - (i % 2) * .4, zz); grp.add(d); g.userData.rocks.push({ x: xx, z: m.z + zz, r: 2.6 }); }
      return {};
    },
    village(m, g) {
      const grp = new THREE.Group(); g.add(grp);
      const c = W.cx(m.z), hw = W.hw(m.z);
      for (let i = 0; i < 5; i++) {
        const x = c + (i - 2) * (hw * .38) + ((i * 7) % 3 - 1) * 1.4, z = m.z + ((i * 5) % 4 - 1.5) * 7;
        const h = new THREE.Group(); h.position.set(x, -.55 - (i % 3) * .25, z); h.rotation.y = i * .7;
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.1, 1.7, 4), tileMat); roof.position.y = .85; h.add(roof);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 4), woodMat); wall.position.y = -.6; h.add(wall);
        h.rotation.z = ((i % 3) - 1) * .07; grp.add(h);
        g.userData.decks.push({ x, z, r: 2.6, y: h.position.y + 1.7 * .5 + .85, cone: 1.45 });   // 잠긴 지붕 — 비탈을 따라 올라선다
      }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 8, 6), woodMat); pole.position.set(c + hw * .5, 2.2, m.z - 9); pole.rotation.z = .22; grp.add(pole);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 16, 4), deadMat); wire.position.set(c + hw * .5, 5.4, m.z - 1); wire.rotation.set(Math.PI / 2, 0, .1); grp.add(wire);
      return {};
    },
    mill(m, g) {
      const grp = new THREE.Group(); grp.position.set(m.x, W.terrainH(m.x, m.z) - .6, m.z); g.add(grp);
      const hut = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.2, 4.2), woodMat); hut.position.y = 1.6; grp.add(hut);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 1.8, 4), tileMat); roof.position.y = 4.1; roof.rotation.y = .78; grp.add(roof);
      const toward = m.x > W.cx(m.z) ? -1 : 1;
      const wheel = new THREE.Group(); wheel.position.set(toward * 2.9, .6, 0); wheel.rotation.y = Math.PI / 2; grp.add(wheel);
      wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.5, .16, 6, 20), woodMat));
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const s = new THREE.Mesh(new THREE.BoxGeometry(.16, 5, .1), woodMat); s.rotation.z = a; wheel.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(.9, .1, 1.6), woodMat); b.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0); b.rotation.z = a; wheel.add(b); }
      const l = W.makeLamp(0, 0, true); l.position.set(-toward * 2.4, 2.6, 1.9); grp.add(l);
      g.userData.rocks.push({ x: m.x, z: m.z - 1, r: 2.4 + 1.7, cam: 1 }, { x: m.x, z: m.z + 1, r: 2.4 + 1.7, cam: 1 });   // 방앗간 벽
      for (const dz of [-1.8, 0, 1.8]) g.userData.rocks.push({ x: m.x + toward * 2.9, z: m.z + dz, r: .55 + 1.7 });   // 물레바퀴
      return { spin: wheel };
    },
    boat(m, g) {
      const c = W.cx(m.z), grp = new THREE.Group(); grp.position.set(c + 1.5, 0, m.z); g.add(grp);
      const hull = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 4.6, 6, 12), woodMat); hull.rotation.set(Math.PI / 2, 0, .3); hull.position.y = .35; hull.scale.set(1, 1, .55); grp.add(hull);
      const keel = new THREE.Mesh(new THREE.BoxGeometry(.22, .3, 5.4), woodMat); keel.position.y = 1.2; keel.rotation.y = .3; grp.add(keel);
      const oar = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 3.4, 5), woodMat); oar.position.set(-3.2, .1, 1.4); oar.rotation.set(0, .6, Math.PI / 2 - .1); grp.add(oar);
      for (const dz of [-2.6, 0, 2.6]) g.userData.rocks.push({ x: c + 1.5 + dz * .3, z: m.z + dz, r: 1.45 + 1.7 });   // 뒤집힌 배 — 선체를 뚫고 지나가지 못한다 (길쭉해서 원 셋)
      return {};
    },
    deadwood(m, g) {
      const grp = new THREE.Group(); g.add(grp);
      for (let i = 0; i < 26; i++) {
        const z = m.z + (i * 13 % 40) - 20, hw = W.hw(z), x = W.cx(z) + ((i * 7) % 11 - 5) / 5 * hw * .9;
        const hgt = 3 + (i % 5) * 1.6;
        const t = new THREE.Mesh(new THREE.CylinderGeometry(.1, .28, hgt, 5), deadMat); t.position.set(x, hgt / 2 - 1.2, z); t.rotation.set(((i % 5) - 2) * .07, i, ((i % 3) - 1) * .09); grp.add(t);
        for (let b = 0; b < 2; b++) { const br = new THREE.Mesh(new THREE.CylinderGeometry(.04, .1, 1.6, 4), deadMat); br.position.set(x + (b ? .6 : -.6), hgt * .75 - 1.2, z); br.rotation.z = (b ? -1 : 1) * 1.1; grp.add(br); }
        g.userData.rocks.push({ x, z, r: .3 + 1.7 });   // 죽은 나무마다 줄기에 부딪힌다
      }
      return {};
    },
    falls(m, g) {
      const c = W.cx(m.z), hw = W.hw(m.z), grp = new THREE.Group(); grp.position.set(0, 0, m.z); g.add(grp);
      const gap = c + hw * .42;    // 옆으로 넘어가는 얕은 길
      for (let i = -6; i <= 6; i++) {
        const x = c + i * (hw / 6.5); if (Math.abs(x - gap) < 5.4) continue;
        const r = 1.9 + ((i + 6) % 3) * .5, zz = (i % 2 ? .8 : -.6);
        const s = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat); s.position.set(x, .3 + ((i + 6) % 2) * .4, zz); s.rotation.set(i, i * 2, i * .5); grp.add(s);
        g.userData.rocks.push({ x, z: m.z + zz, r: r + 1.6 });
      }
      for (let i = 0; i < 7; i++) {   // 떨어지는 물
        const x = c + (i - 3) * (hw / 4.2); if (Math.abs(x - gap) < 5.2) continue;
        const p = new THREE.Mesh(new THREE.PlaneGeometry(hw / 5, 3.2), foamMat); p.position.set(x, .9, 1.8); grp.add(p);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xbfd4d8, transparent: true, opacity: .3, depthWrite: false })); gl.scale.set(5, 3, 1); gl.position.set(x, .2, 2.9); grp.add(gl);
      }
      return {};
    },
    spring(m, g) {
      const c = W.cx(m.z), grp = new THREE.Group(); grp.position.set(c, 0, m.z); g.add(grp);
      const cave = new THREE.Mesh(new THREE.SphereGeometry(7, 14, 10, 0, Math.PI * 2, 0, Math.PI * .55), rockMat); cave.position.set(0, 1.2, 9); cave.scale.set(1, .85, .7); grp.add(cave);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, r = 7.5, size = 1.6 + (i % 3) * .6; const s = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), rockMat); s.position.set(Math.cos(a) * r, .2, Math.sin(a) * r * .8 + 2); s.rotation.set(i, i * 2, i); grp.add(s);
        g.userData.rocks.push({ x: c + s.position.x, z: m.z + s.position.z, r: size * .9 + 1.7 }); }
      for (const [dx, rr] of [[-4, 3], [0, 4.4], [4, 3]]) g.userData.rocks.push({ x: c + dx, z: m.z + 9, r: rr + 1.7 });   // 동굴 바위
      // 동생 — 물가 바위에 앉아 있다
      const kid = new THREE.Group(); kid.position.set(1.1, .35, 2.6); kid.rotation.y = -.4; grp.add(kid);
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(.26, .5, 5, 10), new THREE.MeshLambertMaterial({ color: 0xd8dde0 })); body.position.y = .45; kid.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.24, 14, 12), skinMat); head.position.y = 1.02; kid.add(head);
      const hair = new THREE.Mesh(new THREE.SphereGeometry(.25, 14, 12, 0, 6.283, 0, Math.PI * .55), new THREE.MeshLambertMaterial({ color: 0x140f0a })); hair.position.y = 1.05; kid.add(hair);
      // 등불 없이 온다(2026-09-16 사장님) — 보일 만큼만 서늘한 푸른빛. 따뜻한 등불빛은 머리를 갈색으로 보이게 했다
      const halo = new THREE.PointLight(0x7fa6d0, 1.6, 22, 1.6); halo.position.set(0, 1.5, .4); kid.add(halo);
      kid.userData.code = [body, head, hair];   // 실사 모델이 들어오면 감춘다
      W.kid = kid;
      return {};
    },
  };

  // ── 물음 ──
  W.deepness = function (x, z) {
    return Math.max(0, Math.min(1, (W.flow(x, z).s - .6) / 2));   // 얕은 강이라 깊이 대신 물살 세기
  };
  W.safeAt = function (x, z) { return W.deepness(x, z) <= 0; };

  // 날이 밝는다 — 진엔딩. k 0 밤 · 1 새벽
  const NIGHT = { top: new THREE.Color(0x101c30), hor: new THREE.Color(0x3a5062), fog: new THREE.Color(0x162834), hemiS: new THREE.Color(0x4c6b84), hemiG: new THREE.Color(0x1a2a24), amb: new THREE.Color(0x33495a) };
  const DAWN = { top: new THREE.Color(0x587aa6), hor: new THREE.Color(0xe6b08a), fog: new THREE.Color(0x9aa2a8), hemiS: new THREE.Color(0xc8d6e6), hemiG: new THREE.Color(0x4a5a48), amb: new THREE.Color(0x8a8a90) };
  const _c = new THREE.Color();
  W.dawn = 0;
  W.setDawn = function (k) {
    k = Math.max(0, Math.min(1, k)); W.dawn = k;
    const sky = W.sky.material.uniforms, wu = W.waterMat.uniforms, L = W.lights;
    sky.uTop.value.copy(NIGHT.top).lerp(DAWN.top, k); sky.uHor.value.copy(NIGHT.hor).lerp(DAWN.hor, k);
    wu.uSkyTop.value.copy(sky.uTop.value); wu.uSkyHor.value.copy(sky.uHor.value);
    W.fogAir.col.copy(NIGHT.fog).lerp(DAWN.fog, k); W.fogAir.d = .0104 - k * .004;
    L.hemi.color.copy(NIGHT.hemiS).lerp(DAWN.hemiS, k); L.hemi.groundColor.copy(NIGHT.hemiG).lerp(DAWN.hemiG, k); L.hemi.intensity = 1.45 + k * .6;
    L.amb.color.copy(NIGHT.amb).lerp(DAWN.amb, k); L.moonL.color.copy(_c.setHex(0xc4dcf2)).lerp(_c.setHex(0xffd2a8), k);
    W.stars.material.opacity = .8 * (1 - k); W.moon.material.opacity = 1 - k * .85;
  };

  W.update = function (t, cam, under, lampP, lampK) {
    const u = W.waterMat.uniforms; u.uTime.value = t; u.uCam.value.copy(cam.position); u.uUnder.value = under ? 1 : 0;
    u.uLamp.value = lampK || 0; if (lampP) u.uLampP.value.copy(lampP);
    const f = under ? W.fogWater : W.fogAir; W.scene.fog.color.copy(f.col); W.scene.fog.density = f.d; u.uFogCol.value.copy(f.col); u.uFogD.value = f.d;
    W.sky.visible = W.stars.visible = W.moon.visible = !under;
    W.sky.position.copy(cam.position); W.stars.position.copy(cam.position);
    W.moon.position.set(cam.position.x + MOON[0] * 800, cam.position.y + MOON[1] * 800, cam.position.z + MOON[2] * 800);
    W.water.position.z = Math.round(cam.position.z / 20) * 20; W.water.position.x = Math.round(cam.position.x / 20) * 20;
    W.motes.visible = under; if (under) { W.motes.position.set(cam.position.x, 0, cam.position.z); W.motes.rotation.y = t * .03; }
    for (const l of W.lamps) if (!l.userData.taken) {
      l.position.y = W.height(l.position.x, l.position.z, t) - .02; l.rotation.z = Math.sin(t * 1.3 + l.position.x) * .08;
      l.userData.light.intensity = 1.0 + Math.sin(t * 9 + l.position.z) * .15;
      l.userData.light.visible = Math.hypot(l.position.x - cam.position.x, l.position.z - cam.position.z) < 28;   // 먼 등불은 빛을 끈다 (폰에서 무겁다)
    }
    for (const s of W.spin) s.rotation.z = -t * .35;
    for (const s of W.sways) { s.o.rotation.z = Math.sin(t * .8 + s.p) * .05; s.o.rotation.x = .05 + Math.sin(t * .53 + s.p * 1.7) * .04; }   // 빨랫줄에 걸린 옷이 밤바람에 흔들린다
  };
  window.WORLD = W;
})();
