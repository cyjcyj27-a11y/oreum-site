// 손님 머리통: 두피(늘어나는 살) + 머리카락 한 올 한 올(띠로 그림) + 집기·빗질
// 단위 cm. 머리통 가운데가 원점, 얼굴은 +z, 위는 +y.
(function () {
  const H = (window.HEAD = {});
  const A = new THREE.Vector3(7.4, 9.0, 9.6); // 타원 반지름
  const SEG = 9; // 가닥 하나 = 10점
  const NP = SEG + 1;
  H.A = A;

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const V = () => new THREE.Vector3();
  function surf(u, out) { const r = 1 / Math.sqrt((u.x * u.x) / (A.x * A.x) + (u.y * u.y) / (A.y * A.y) + (u.z * u.z) / (A.z * A.z)); return out.copy(u).multiplyScalar(r); }
  function nrm(p, out) { return out.set(p.x / (A.x * A.x), p.y / (A.y * A.y), p.z / (A.z * A.z)).normalize(); }
  H.surf = surf; H.nrm = nrm;

  // ---------- 장면 조각 ----------
  // 머리통은 목 위 받침점(pivot)에 매달려 끄덕이고 돈다
  H.pivot = new THREE.Group(); H.pivot.position.set(0, -7.2, -1.2);
  H.g = new THREE.Group(); H.g.position.set(0, 7.2, 1.2); H.pivot.add(H.g);
  H.tent = { p: { value: new THREE.Vector3() }, d: { value: new THREE.Vector3(0, 1, 0) }, h: { value: 0 } };

  let skinCv, skinTex, headMesh, earL, earR, hairMesh, dynMesh, hairMat;
  H.init = function (scene) {
    scene.add(H.pivot);
    // 두피·얼굴: 늘어나는 살(onBeforeCompile 로 당긴 곳만 솟음)
    const g = new THREE.SphereGeometry(1, 176, 132);
    const pa = g.attributes.position, u = V(), p = V();
    for (let i = 0; i < pa.count; i++) {
      u.fromBufferAttribute(pa, i); surf(u, p);
      // 코·이마뼈·눈두덩(정면 아래쪽, 위에서 보면 살짝만 보임)
      const bump = (cx, cy, cz, r, a) => { const d = u.distanceTo(new THREE.Vector3(cx, cy, cz).normalize()); return a * Math.exp(-(d * d) / (r * r)); };
      let k = bump(0, -0.16, 1, 0.13, 1.5) + bump(0, -0.3, 1, 0.1, 0.9) + bump(0.32, 0.12, 0.95, 0.16, 0.35) + bump(-0.32, 0.12, 0.95, 0.16, 0.35) - bump(0.3, 0.02, 0.95, 0.09, 0.3) - bump(-0.3, 0.02, 0.95, 0.09, 0.3);
      // 뒤통수 볼록, 관자놀이 살짝 들어감
      k += bump(0, 0.15, -1, 0.5, 0.35) - bump(1, 0.25, 0.2, 0.25, 0.25) - bump(-1, 0.25, 0.2, 0.25, 0.25);
      nrm(p, u); p.addScaledVector(u, k);
      pa.setXYZ(i, p.x, p.y, p.z);
    }
    g.computeVertexNormals();
    skinCv = document.createElement('canvas'); skinCv.width = 2048; skinCv.height = 1024;
    skinTex = new THREE.CanvasTexture(skinCv); skinTex.colorSpace = THREE.SRGBColorSpace; skinTex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: skinTex, roughness: 0.62, metalness: 0 });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTP = H.tent.p; sh.uniforms.uTD = H.tent.d; sh.uniforms.uTH = H.tent.h;
      sh.vertexShader = 'uniform vec3 uTP; uniform vec3 uTD; uniform float uTH;\n' + sh.vertexShader.replace('#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nfloat tnd = distance(position, uTP); objectNormal = normalize(objectNormal + (position - uTP) * (uTH * 2.7) * exp(-tnd*tnd/1.1));').replace('#include <begin_vertex>',
        '#include <begin_vertex>\nfloat tdd = distance(position, uTP); transformed += uTD * uTH * 1.5 * exp(-tdd*tdd/1.1);');
    };
    headMesh = new THREE.Mesh(g, mat); headMesh.castShadow = true; headMesh.receiveShadow = true; H.g.add(headMesh);
    H.headMesh = headMesh;
    // 귀
    const eg = new THREE.SphereGeometry(1, 28, 20); const ea = eg.attributes.position;
    for (let i = 0; i < ea.count; i++) { const x = ea.getX(i), y = ea.getY(i), z = ea.getZ(i); ea.setXYZ(i, x * 0.55 + (y > 0.3 ? 0.25 * (y - 0.3) : 0), y * 2.7, z * 1.55 - Math.abs(y) * 0.25); }
    eg.computeVertexNormals();
    H.earMat = new THREE.MeshStandardMaterial({ color: '#e2a888', roughness: 0.6 });
    earL = new THREE.Mesh(eg, H.earMat); earL.position.set(-7.1, -1.6, 0.6); earL.rotation.set(0, -0.35, 0.08); earL.castShadow = true;
    earR = new THREE.Mesh(eg, H.earMat); earR.position.set(7.1, -1.6, 0.6); earR.rotation.set(0, 0.35, -0.08); earR.castShadow = true;
    H.g.add(earL, earR);

    // 머리카락 재질: 화면 폭 띠 + 머리카락 반짝임(결 방향 빛)
    hairMat = H.hairMat = new THREE.ShaderMaterial({
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) }, uPx: { value: 1.6 }, uCm: { value: 0.04 }, uSway: { value: new THREE.Vector3() },
        uTP: H.tent.p, uTD: H.tent.d, uTH: H.tent.h, uExpo: { value: 1 }, uTime: { value: 0 }, uLight: { value: new THREE.Vector3(0.3, 0.8, 0.5).normalize() },
      },
      vertexShader: `
        attribute vec3 aTan; attribute vec3 aNrm; attribute vec3 aRoot; attribute float aS; attribute float aSide; attribute vec3 aCol; attribute float aAlive; attribute float aWid;
        uniform vec2 uRes; uniform float uPx; uniform float uCm; uniform vec3 uSway; uniform vec3 uTP; uniform vec3 uTD; uniform float uTH;
        varying vec3 vT; varying vec3 vN; varying float vS; varying vec3 vCol; varying vec3 vV;
        void main(){
          vec3 p = position + uSway * aS * aS;
          float td = distance(aRoot, uTP); p += uTD * uTH * 1.5 * exp(-td*td/1.1) * (1.0 - 0.3*aS);
          vec4 wp = modelMatrix * vec4(p,1.0);
          vec4 mv = viewMatrix * wp;
          vec4 c = projectionMatrix * mv;
          vec4 c2 = projectionMatrix * viewMatrix * (modelMatrix * vec4(p + aTan*0.2, 1.0));
          vec2 a = c.xy / c.w, b = c2.xy / c2.w;
          vec2 sd = (b - a) * uRes; float sl = length(sd); sd = sl > 1e-5 ? sd / sl : vec2(1.0,0.0);
          vec2 perp = vec2(-sd.y, sd.x);
          float pxPerCm = uRes.y * projectionMatrix[1][1] / max(0.001, -mv.z) * 0.5;
          float w = max(uPx, uCm * pxPerCm) * aWid * (1.0 - 0.55*aS);
          c.xy += perp * aSide * w / uRes * c.w;
          if (aAlive < 0.5) c = vec4(2.0, 2.0, 2.0, 1.0);
          gl_Position = c;
          vT = normalize((viewMatrix * modelMatrix * vec4(aTan,0.0)).xyz);
          vN = normalize((viewMatrix * modelMatrix * vec4(aNrm,0.0)).xyz);
          vV = normalize(-mv.xyz);
          vS = aS; vCol = aCol;
        }`,
      fragmentShader: `
        uniform float uExpo; uniform float uTime; uniform vec3 uLight;
        varying vec3 vT; varying vec3 vN; varying float vS; varying vec3 vCol; varying vec3 vV;
        void main(){
          vec3 L = normalize((viewMatrix * vec4(uLight,0.0)).xyz);
          vec3 T = normalize(vT);
          float lum = dot(vCol, vec3(0.3,0.59,0.11));
          float dif = mix(0.5, 0.72, lum) + mix(0.5, 0.28, lum) * max(dot(vN, L), 0.0);
          vec3 Hh = normalize(L + vV);
          float th = dot(T, Hh); float sn = sqrt(max(0.0, 1.0 - th*th));
          float spec = pow(sn, 70.0) * (0.22 + 0.35*lum) + pow(sn, 12.0) * (0.06 + 0.1*lum);
          float ao = mix(mix(0.5, 0.8, lum), 1.0, smoothstep(0.0, 0.28, vS));
          vec3 col = vCol * dif * ao * (1.0 + 0.18*lum) + spec * mix(vec3(1.0,0.95,0.88), vCol, 0.3);
          // 황금 머리카락: 결을 따라 빛이 흐르며 반짝임
          float gold = smoothstep(0.25, 0.45, vCol.r - vCol.b);
          col += gold * (0.18 + 0.32 * pow(0.5 + 0.5 * sin(uTime * 5.0 - vS * 9.0), 3.0)) * vec3(1.0, 0.86, 0.42);
          gl_FragColor = vec4(col * uExpo, 1.0);
        }`,
      side: THREE.DoubleSide,
    });
    // 집은 가닥(최대 4가닥, 가닥마다 13점)
    const DN = 4, DP = 13;
    const dg = new THREE.BufferGeometry();
    const n = DN * DP * 2;
    ['position', 'aTan', 'aNrm', 'aRoot', 'aCol'].forEach((k) => dg.setAttribute(k, new THREE.BufferAttribute(new Float32Array(n * 3), 3)));
    ['aS', 'aSide', 'aAlive', 'aWid'].forEach((k) => dg.setAttribute(k, new THREE.BufferAttribute(new Float32Array(n), 1)));
    const idx = [];
    for (let s = 0; s < DN; s++) for (let k = 0; k < DP - 1; k++) { const o = (s * DP + k) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    dg.setIndex(idx);
    for (let i = 0; i < n; i++) { dg.attributes.aSide.array[i] = i % 2 ? 1 : -1; }
    const dm = hairMat.clone(); dm.uniforms = hairMat.uniforms; dm.depthTest = false; dm.depthWrite = false;
    dynMesh = new THREE.Mesh(dg, dm); dynMesh.frustumCulled = false; dynMesh.renderOrder = 10; H.g.add(dynMesh);
    H.DN = DN; H.DP = DP;
  };

  // ---------- 손님 하나 만들기 ----------
  H.S = []; // 가닥들
  H.build = function (cust) {
    const R = rng(cust.seed);
    const S = (H.S = []);
    const u = V(), p = V(), n = V();
    const N = 10500, ga = Math.PI * (3 - Math.sqrt(5));
    const crown = new THREE.Vector3(0.02, 0.8, -0.6).normalize();
    const hairAt = (u) => {
      const az = Math.abs(Math.atan2(u.x, u.z)); // 0 앞, π 뒤
      let yT = az < Math.PI / 2 ? 0.43 + (-0.08 - 0.43) * sst(0, Math.PI / 2, az) : -0.08 + (-0.55 + 0.08) * sst(Math.PI / 2, Math.PI, az);
      // 이마 양옆 벗겨짐
      yT += cust.temple * Math.exp(-Math.pow((az - 0.62) / 0.28, 2)) * 3.0;
      if (u.y < yT) return 0;
      if (Math.abs(u.x) > 0.8 && u.y < 0.16 && u.z > -0.4) return 0; // 귀
      let k = sst(yT, yT + 0.1, u.y);
      if (cust.bald > 0) { const c = u.dot(crown); const r = Math.cos(cust.bald * 1.3); k *= 1 - sst(r - 0.04, r + 0.06, c) * 0.92; }
      return k;
    };
    const W = new THREE.Vector3(0.08, 0.72, -0.69).normalize();
    const flow = (u, n, out) => {
      const d = V().subVectors(u, W);
      out.copy(d).addScaledVector(n, -d.dot(n));
      if (out.lengthSq() < 1e-6) out.set(1, 0, 0);
      out.normalize();
      const tw = V().crossVectors(n, out); out.addScaledVector(tw, 1.3 * Math.exp(-d.length() * 2.4)).normalize();
      // 결 흐트러짐: 이웃끼리 비슷하게 휘는 낮은 물결 + 가닥마다 조금
      const wv = Math.sin(u.x * 7.1 + u.y * 3.3) * Math.cos(u.z * 6.3 - u.x * 2.1) * 0.55 + (R() - 0.5) * 0.35;
      out.applyAxisAngle(n, wv).normalize();
      // 머리 모양별 결: 2:8 가르마는 가르마에서 한쪽으로, 올백은 전부 뒤로, 장발은 아래로
      const tg = (x, y, z) => { const v = new THREE.Vector3(x, y, z); v.addScaledVector(n, -v.dot(n)); return v.lengthSq() > 1e-6 ? v.normalize() : null; };
      if (cust.flow === 'side' && u.y > -0.1) { const sd = u.x > 0.3 ? 1 : -1; const v = tg(sd, -0.25, -0.15); if (v) out.lerp(v, sst(-0.1, 0.3, u.y) * 0.9).normalize(); return out; }
      if (cust.flow === 'back') { const v = tg(0, -0.3, -1); if (v) out.lerp(v, 0.85).normalize(); return out; }
      if (cust.flow === 'down') { const v = tg(u.x * 0.6, -1, u.z * 0.6); if (v) out.lerp(v, sst(0.95, 0.6, u.y) * 0.85).normalize(); return out; }
      if (cust.style !== 'buzz' && u.z > 0.05 && u.y > 0.2) {
        const side = u.x > 0.28 ? 1 : -1;
        const lat = new THREE.Vector3(side, -0.15, 0.35); lat.addScaledVector(n, -lat.dot(n)).normalize();
        const b = sst(0.05, 0.55, u.z) * sst(0.2, 0.5, u.y);
        out.lerp(lat, b).normalize();
      }
      return out;
    };
    const tone = new THREE.Color(cust.tone);
    const mk = (u0, o) => {
      surf(u0, p); nrm(p, n);
      const F = flow(u0, n, V());
      const st = Object.assign({
        u: u0.clone(), root: p.clone().addScaledVector(n, 0.02), n: n.clone(), F, F0: F.clone(),
        L: cust.len[0] + R() * (cust.len[1] - cust.len[0]), layer: 0, curl: cust.curl * (0.6 + R() * 0.7), ph: R() * 6.28,
        white: false, type: null, hidden: false, covered: false, alive: true, wid: 0.9 + R() * 0.25, pair: -1,
        c0: tone.clone().offsetHSL((R() - 0.5) * 0.02, (R() - 0.5) * 0.1, (R() - 0.5) * 0.05), c1: null, bend: (R() - 0.5) * 1.1,
        standK: cust.stand * (0.8 + R() * 0.4), helix: cust.helix * (0.7 + R() * 0.6), grav: cust.grav,
      }, o || {});
      st.layer = 0.05 + R() * Math.min(0.85, st.L * 0.17);
      st.pts = new Float32Array(NP * 3); st.tan = new Float32Array(NP * 3);
      S.push(st);
      return st;
    };
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      u.set(Math.cos(th) * r, y, Math.sin(th) * r);
      u.x += (R() - 0.5) * 0.03; u.y += (R() - 0.5) * 0.03; u.z += (R() - 0.5) * 0.03; u.normalize();
      const k = hairAt(u);
      if (k <= 0 || R() > k) continue;
      mk(u.clone());
    }
    // 흰머리 고르기: 보이는 곳(정수리·옆·뒤) 골고루
    // 처음 손님들은 정수리·뒤통수 위쪽에만(찾기 쉽게), 갈수록 옆·뒤 아래까지
    const yMin = cust.i < 3 ? 0.45 : cust.i < 8 ? 0.15 : -1;
    // 카메라로 볼 수 없는 뒷목 아래쪽(아래를 향한 곳)에는 두지 않음 — 못 찾고 못 뽑는 흰머리가 생김(10/22)
    const pool = S.filter((s) => s.u.y > Math.max(yMin, -0.08)); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const ty = cust.types; let pi = 0;
    const white = { normal: '#ece9e2', half: '#ece9e2', curly: '#efece6', thick: '#f4f2ec', silver: '#dfe3e8', twin: '#ece9e2', gold: '#ffc930', sprout: '#f2efe8' };
    const setWhite = (st, t) => {
      st.white = true; st.type = t;
      st.c0 = new THREE.Color(white[t]).offsetHSL(0, 0, (R() - 0.5) * 0.04);
      if (t === 'half') { st.c1 = st.c0.clone(); st.c0 = tone.clone(); } // 뿌리 흰색 → 끝 검정 (c1 = 뿌리색)
      if (t === 'curly') st.curl = Math.max(st.curl, 0.6);
      if (t === 'thick') st.wid = 1.75;
      if (t === 'silver') st.L = Math.max(st.L * 1.5, 6);
      st.wid = Math.max(st.wid, 1.35);
      // 흰머리는 뻣뻣해서 검은 머리 위로 들뜨고 제멋대로 휜다
      st.layer = 0.3 + R() * Math.min(0.6, st.L * 0.15);
      st.wiry = 0.35 + R() * 0.45; st.bend = (R() - 0.5) * 1.8;
      if (t === 'gold') { st.wid = 1.9; st.layer = 0.6; st.wiry = 0.9; }
    };
    for (let i = 0; i < cust.whites && pi < pool.length; i++) {
      let t = 'normal';
      if (ty.length > 1 && R() < 0.55) t = ty[1 + Math.floor(R() * (ty.length - 1))];
      if (t === 'gold') t = 'normal';
      const st = pool[pi++]; setWhite(st, t);
      if (t === 'twin') { const tw = mk(st.u.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.004)).normalize()); setWhite(tw, 'twin'); tw.L = st.L * (0.9 + R() * 0.2); tw.F.applyAxisAngle(st.n, 0.25); tw.pair = S.indexOf(st); st.pair = S.length - 1; }
    }
    for (let i = 0; i < cust.gold && pi < pool.length; i++) setWhite(pool[pi++], 'gold');
    // 숨은 새싹 흰머리: 긴 머리 밑, 짧게
    for (let i = 0; i < cust.hidden && pi < pool.length; i++) {
      const base = pool[pi++];
      const st = mk(base.u.clone().add(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(0.02)).normalize(), { hidden: true, covered: true });
      setWhite(st, 'sprout'); st.L = 0.9 + R() * 0.5; st.layer = 0.03; st.wid = 2.0; st.wiry = 0; st.bend = (R() - 0.5) * 0.6;
    }
    S.forEach(H.shape);
    H.makeGeo();
    H.paintSkin(cust);
    H.whitesLeft = S.filter((s) => s.white && s.alive).length - S.filter((s) => s.type === 'twin' && s.pair > S.indexOf(s)).length * 0;
  };

  // 가닥 모양: 뿌리에서 결 방향으로 두피를 따라 눕고, 층만큼 떠 있다
  const _q = V(), _b = V(), _nq = V(), _t = V(), _d = V();
  H.shape = function (st) {
    const P = st.pts, n0 = st.n, F = st.F, L = st.L;
    const side = _t.crossVectors(n0, F);
    const stand = st.type === 'sprout' || L < 1.9;
    for (let k = 0; k < NP; k++) {
      const s = k / SEG, l = s * L * (stand ? 0.5 : 1);
      // 휘는 가닥: 일정한 곡률로 결 방향이 돌아감
      const th = st.bend * s, bk = Math.abs(st.bend) > 1e-3 ? 1 / st.bend : 0;
      const fa = bk ? Math.sin(th) * bk / s || 1 : 1, sa = bk ? (1 - Math.cos(th)) * bk / s || 0 : 0;
      const sk = stand ? 0 : st.standK || 0; // 서는 머리는 두피를 덜 따라감
      _q.copy(st.root).addScaledVector(F, l * fa * (1 - sk * 0.6)).addScaledVector(side, l * sa);
      _d.copy(_q).normalize(); surf(_d, _b); nrm(_b, _nq);
      let lift = st.layer * sst(0, 0.3, s) + 0.03;
      // 숨은 새싹은 검은 머리 밑에 눌려 낮게, 참빗으로 빗어 드러나면 쏙 일어섬
      if (stand) lift = Math.max(lift, l * (st.hidden && st.covered ? 0.55 : 0.85));
      if (sk) lift = Math.max(lift, l * sk);
      if (st.wiry && !stand) lift += st.wiry * Math.sin(Math.min(1, s * 1.4) * Math.PI) * 0.6;
      _b.addScaledVector(_nq, lift);
      if (st.curl > 0) {
        const a = s * 10 + st.ph, c = st.curl * 0.42 * Math.min(1, s * 3);
        _b.addScaledVector(side, Math.sin(a) * c).addScaledVector(F, Math.cos(a) * c * 0.5).addScaledVector(_nq, (Math.cos(a) * 0.5 + 0.5) * c * 0.6);
      }
      // 뽀글이 파마: 결을 따라 동그란 고리를 그리며 감김
      if (st.helix && !stand) { const a = s * Math.PI * 2 * 1.3 + st.ph, rr = st.helix * Math.min(1, s * 3); _b.addScaledVector(side, Math.cos(a) * rr).addScaledVector(_nq, (Math.sin(a) * 0.8 + 0.5) * rr); }
      if (L > 4.5 && !stand) { _b.y -= 0.06 * (st.grav || 1) * L * s * s; }
      // 두피 밑으로 안 들어가게
      _d.copy(_b).normalize(); surf(_d, _q);
      const minR = _q.length() + 0.03 + st.layer * 0.3 * sst(0, 0.3, s);
      if (_b.length() < minR) _b.setLength(minR);
      P[k * 3] = _b.x; P[k * 3 + 1] = _b.y; P[k * 3 + 2] = _b.z;
    }
    for (let k = 0; k < NP; k++) {
      const a = Math.max(0, k - 1), b = Math.min(SEG, k + 1);
      _d.set(P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]).normalize();
      st.tan[k * 3] = _d.x; st.tan[k * 3 + 1] = _d.y; st.tan[k * 3 + 2] = _d.z;
    }
  };

  let geo = null;
  H.makeGeo = function () {
    const S = H.S, nv = S.length * NP * 2;
    if (geo) { hairMesh.geometry = null; geo.dispose(); }
    geo = new THREE.BufferGeometry();
    const A3 = (k) => geo.setAttribute(k, new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    const A1 = (k) => geo.setAttribute(k, new THREE.BufferAttribute(new Float32Array(nv), 1));
    ['position', 'aTan', 'aNrm', 'aRoot', 'aCol'].forEach(A3); ['aS', 'aSide', 'aAlive', 'aWid'].forEach(A1);
    const idx = new Uint32Array(S.length * SEG * 6); let ii = 0;
    S.forEach((st, si) => {
      st.vi = si * NP * 2;
      for (let k = 0; k < SEG; k++) { const o = st.vi + k * 2; idx[ii++] = o; idx[ii++] = o + 1; idx[ii++] = o + 2; idx[ii++] = o + 1; idx[ii++] = o + 3; idx[ii++] = o + 2; }
      H.write(st, true);
    });
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    if (!hairMesh) { hairMesh = new THREE.Mesh(geo, hairMat); hairMesh.frustumCulled = false; H.g.add(hairMesh); }
    else hairMesh.geometry = geo;
    H.hairMesh = hairMesh;
  };
  // 가닥 하나를 그림 버퍼에 쓰기
  H.write = function (st, all) {
    // 빗질 때 수천 번 불리므로 배열을 새로 만들지 않고 칸에 바로 씀
    const at = geo.attributes, o = st.vi, P = at.position.array, T = at.aTan.array, C = at.aCol.array, AL = at.aAlive.array;
    const alive = st.alive && !st.held ? 1 : 0; // 숨은 새싹도 늘 그림(검은 머리 사이로 끝이 비침)
    for (let k = 0; k < NP; k++) {
      const s = k / SEG;
      let r = st.c0.r, g = st.c0.g, b = st.c0.b;
      if (st.c1) { const m = sst(0.25, 0.6, s); r = st.c1.r + (st.c0.r - st.c1.r) * m; g = st.c1.g + (st.c0.g - st.c1.g) * m; b = st.c1.b + (st.c0.b - st.c1.b) * m; }
      for (let sd = 0; sd < 2; sd++) {
        const v = o + k * 2 + sd, v3 = v * 3;
        P[v3] = st.pts[k * 3]; P[v3 + 1] = st.pts[k * 3 + 1]; P[v3 + 2] = st.pts[k * 3 + 2];
        T[v3] = st.tan[k * 3]; T[v3 + 1] = st.tan[k * 3 + 1]; T[v3 + 2] = st.tan[k * 3 + 2];
        if (all) {
          at.aNrm.array[v3] = st.n.x; at.aNrm.array[v3 + 1] = st.n.y; at.aNrm.array[v3 + 2] = st.n.z;
          at.aRoot.array[v3] = st.root.x; at.aRoot.array[v3 + 1] = st.root.y; at.aRoot.array[v3 + 2] = st.root.z;
          at.aS.array[v] = s; at.aSide.array[v] = sd ? 1 : -1; at.aWid.array[v] = st.wid;
        }
        C[v3] = r; C[v3 + 1] = g; C[v3 + 2] = b;
        AL[v] = alive;
      }
    }
    if (!all) H.dirty = true;
  };
  H.flush = function () {
    if (!H.dirty || !geo) return;
    ['position', 'aTan', 'aCol', 'aAlive'].forEach((k) => (geo.attributes[k].needsUpdate = true));
    H.dirty = false;
  };

  // ---------- 두피 그림(얼굴·모공) ----------
  function d2c(u) {
    const th = Math.acos(Math.max(-1, Math.min(1, u.y)));
    let ph = Math.atan2(u.z, -u.x); if (ph < 0) ph += Math.PI * 2;
    return [(ph / (Math.PI * 2)) * 2048, (th / Math.PI) * 1024];
  }
  H.paintSkin = function (cust) {
    const g = skinCv.getContext('2d'), R = rng(cust.seed + 5);
    const skin = ['#e6b296', '#dfa98a', '#e9bba0', '#d9a283', '#e3ae90'][cust.i % 5];
    g.fillStyle = skin; g.fillRect(0, 0, 2048, 1024);
    // 피부 결: 얼룩·잔점
    for (let i = 0; i < 2600; i++) { g.fillStyle = R() < 0.5 ? 'rgba(160,80,60,.05)' : 'rgba(255,240,230,.05)'; const r = 3 + R() * 26; g.beginPath(); g.arc(R() * 2048, R() * 1024, r, 0, 7); g.fill(); }
    for (let i = 0; i < 9000; i++) { g.fillStyle = 'rgba(120,60,40,.08)'; g.fillRect(R() * 2048, R() * 1024, 1.5, 1.5); }
    // 머리 있는 곳은 두피 위에 머리카락 결을 한 겹 깐다(가닥 그대로 눕힌 그림자)
    const hc = new THREE.Color(cust.tone), hs = `rgba(${(hc.r * 255) | 0},${(hc.g * 255) | 0},${(hc.b * 255) | 0},`;
    const q = V();
    H.S.forEach((st) => {
      if (st.hidden) return;
      g.strokeStyle = st.white ? 'rgba(200,195,185,.35)' : hs + '.55)'; g.lineWidth = 3.2; g.lineCap = 'round';
      g.beginPath(); let px = null;
      for (let k = 0; k < NP; k += 2) {
        q.set(st.pts[k * 3], st.pts[k * 3 + 1], st.pts[k * 3 + 2]).normalize();
        const [x, y] = d2c(q);
        if (px !== null && Math.abs(x - px) > 600) break;
        px === null ? g.moveTo(x, y) : g.lineTo(x, y); px = x;
      }
      g.stroke();
    });
    H.S.forEach((st) => {
      const [x, y] = d2c(st.u); const c = st.white ? 'rgba(150,120,110,.5)' : 'rgba(40,28,24,.55)';
      g.fillStyle = c; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill();
    });
    // 눈썹·감은 눈·볼 홍조
    const line = (pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); pts.forEach((q, i) => { const [x, y] = d2c(new THREE.Vector3(q[0], q[1], q[2]).normalize()); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
    for (const sx of [-1, 1]) {
      // 눈썹: 짧은 털을 결대로 비스듬히, 머리 쪽 짙고 꼬리 쪽 옅게
      for (let k = 0; k < 90; k++) { const t = R(), y0 = 0.165 + Math.sin(t * 2.6) * 0.04 + (R() - 0.5) * 0.025 * (1 - t * 0.6); const x0 = sx * (0.14 + t * 0.34); line([[x0, y0, 1], [x0 + sx * (0.03 + t * 0.02), y0 + 0.012 - t * 0.008, 1]], 2.2, `rgba(40,30,25,${(0.55 - t * 0.3).toFixed(2)})`); }
      line([[sx * 0.18, 0.04, 1], [sx * 0.28, 0.02, 1], [sx * 0.38, 0.04, 1]], 4, 'rgba(90,50,40,.8)');
      const [cx, cy] = d2c(new THREE.Vector3(sx * 0.45, -0.18, 0.9).normalize());
      const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 60); rg.addColorStop(0, 'rgba(230,110,100,.28)'); rg.addColorStop(1, 'rgba(230,110,100,0)'); g.fillStyle = rg; g.fillRect(cx - 60, cy - 60, 120, 120);
    }
    // 목덜미 그늘
    const ng = g.createLinearGradient(0, 860, 0, 1024); ng.addColorStop(0, 'rgba(120,60,40,0)'); ng.addColorStop(1, 'rgba(120,60,40,.35)'); g.fillStyle = ng; g.fillRect(0, 860, 2048, 164);
    skinTex.needsUpdate = true;
    H.earMat.color.set(skin).offsetHSL(0, 0.04, -0.04);
  };

  // ---------- 집기: 화면 점에서 가장 가까운 가닥 ----------
  const M = new THREE.Matrix4(), _w = V(), _c = V();
  // 화면 좌표 계산. near = {x, y, r} 를 주면 뿌리가 그 안(가닥 길이만큼 여유)인 가닥만 끝까지 계산
  H.project = function (cam, w, h, near) {
    M.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).multiply(H.g.matrixWorld);
    _c.copy(cam.position); H.g.worldToLocal(_c); H.camLocal = _c.clone();
    const e = M.elements;
    const pxcm = h * cam.projectionMatrix.elements[5] * 0.5 / Math.max(1, _c.length() - 8);
    const S = H.S;
    for (let i = 0; i < S.length; i++) {
      const st = S[i];
      if (!st.scr) st.scr = new Float32Array(NP * 3);
      st.front = st.n.dot(_w.subVectors(_c, st.root).normalize());
      st.far = false;
      if (st.front < -0.05 || !st.alive) { st.far = true; continue; }
      if (near) {
        const x = st.root.x, y = st.root.y, z = st.root.z, cw = e[3] * x + e[7] * y + e[11] * z + e[15];
        const sx = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw * 0.5 + 0.5) * w, sy = (-(e[1] * x + e[5] * y + e[9] * z + e[13]) / cw * 0.5 + 0.5) * h;
        const lim = near.r + st.L * pxcm * 1.3;
        if (Math.abs(sx - near.x) > lim || Math.abs(sy - near.y) > lim) { st.far = true; continue; }
      }
      for (let k = 0; k < NP; k++) {
        const x = st.pts[k * 3], y = st.pts[k * 3 + 1], z = st.pts[k * 3 + 2];
        const cw = e[3] * x + e[7] * y + e[11] * z + e[15];
        st.scr[k * 3] = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / cw * 0.5 + 0.5) * w;
        st.scr[k * 3 + 1] = (-(e[1] * x + e[5] * y + e[9] * z + e[13]) / cw * 0.5 + 0.5) * h;
        st.scr[k * 3 + 2] = cw;
      }
    }
  };
  function segD(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l > 0 ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); const ex = ax + dx * t - px, ey = ay + dy * t - py; return [Math.sqrt(ex * ex + ey * ey), t]; }
  // 돌려줌: [{st, sg, d, z}] 가까운 순
  H.near = function (px, py, R) {
    const out = [];
    H.S.forEach((st) => {
      if (!st.alive || st.held || st.far || st.front < -0.05) return;
      let bd = 1e9, bs = 0, bz = 0;
      for (let k = 0; k < SEG; k++) {
        const [d, t] = segD(px, py, st.scr[k * 3], st.scr[k * 3 + 1], st.scr[k * 3 + 3], st.scr[k * 3 + 4]);
        if (d < bd) { bd = d; bs = (k + t) / SEG; bz = st.scr[k * 3 + 2] + (st.scr[k * 3 + 5] - st.scr[k * 3 + 2]) * t; }
      }
      if (bd <= R) out.push({ st, sg: bs, d: bd, z: bz });
    });
    out.sort((a, b) => a.d + a.z * 0.6 - (b.d + b.z * 0.6));
    return out;
  };

  // ---------- 참빗질: 지나간 자리의 결을 빗은 방향으로 곧게 펴서 가지런히 눕힌다 ----------
  // (dx, dy) = 빗이 움직이는 화면 방향(부드럽게 다듬은 것)
  const _qi = new THREE.Quaternion();
  H.comb = function (ax, ay, bx, by, dx, dy, R, right, up) {
    const dl = Math.hypot(dx, dy); if (dl < 1e-3 || Math.hypot(bx - ax, by - ay) < 0.5) return 0;
    const ux = dx / dl, uy = dy / dl;
    H.g.getWorldQuaternion(_qi).invert();
    const dir = V().copy(right).multiplyScalar(ux).addScaledVector(up, -uy).applyQuaternion(_qi);
    let n = 0, rev = 0;
    const w3 = V();
    H.S.forEach((st) => {
      if (!st.alive || st.held || st.far || st.front < 0) return;
      // 빗살에 걸리는 가닥: 뿌리든 몸통이든 어디 한 곳이라도 빗 밑을 지나가면
      let d = 1e9;
      for (let k = 0; k < NP; k++) { const q = segD(st.scr[k * 3], st.scr[k * 3 + 1], ax, ay, bx, by)[0]; if (q < d) d = q; }
      if (d > R) return;
      if (st.hidden && st.covered) { st.covered = false; rev++; H.shape(st); H.write(st); return; }
      if (st.type === 'sprout') return;
      w3.copy(dir).addScaledVector(st.n, -dir.dot(st.n));
      if (w3.lengthSq() < 1e-6) return;
      w3.normalize();
      // 참빗은 빗살이 촘촘해 걸린 가닥을 거의 다 같은 결로 맞춘다(가장자리도 반쯤 돌다 마는 가닥이 없게)
      const f = 1 - d / R, k = 0.85 + 0.15 * f;
      st.F.lerp(w3, k).addScaledVector(st.n, -st.F.dot(st.n)).normalize();
      // 참빗: 굽은 결은 펴고, 들뜬 검은 머리는 납작하게. 흰머리는 뻣뻣해서 다시 일어선다
      st.bend *= 1 - 0.9 * k; st.curl *= 1 - 0.5 * k;
      if (!st.white) st.layer = Math.max(0.04, st.layer * (1 - 0.6 * k));
      st.combed = true;
      H.shape(st); H.write(st); n++;
    });
    if (n) H.combDirty = true;
    return { n, rev };
  };
  // 빗질을 마치면 두피에 깔린 결 그림도 새 결로 다시 그림
  H.repaint = function (cust) { if (!H.combDirty) return; H.combDirty = false; H.paintSkin(cust); };
  // ---------- 집은 가닥 그리기 ----------
  // list: [{pts:[Vector3 x13], col:[Color 뿌리, 끝], wid}]
  H.setDyn = function (list) {
    const at = dynMesh.geometry.attributes, DP = H.DP;
    for (let s = 0; s < H.DN; s++) {
      const it = list[s];
      for (let k = 0; k < DP; k++) {
        const p = it ? it.pts[k] : null;
        const a = it ? it.pts[Math.max(0, k - 1)] : null, b = it ? it.pts[Math.min(DP - 1, k + 1)] : null;
        if (it) _d.subVectors(b, a).normalize();
        for (let sd = 0; sd < 2; sd++) {
          const v = (s * DP + k) * 2 + sd;
          at.aAlive.array[v] = it ? 1 : 0;
          if (!it) continue;
          const t = k / (DP - 1), m = it.half ? sst(0.25, 0.6, t) : t;
          at.position.array.set([p.x, p.y, p.z], v * 3);
          at.aTan.array.set([_d.x, _d.y, _d.z], v * 3);
          at.aNrm.array.set([it.n.x, it.n.y, it.n.z], v * 3);
          at.aRoot.array.set([99, 99, 99], v * 3);
          at.aS.array[v] = t * 0.6; at.aWid.array[v] = it.wid;
          const c0 = it.col[0], c1 = it.col[1];
          at.aCol.array.set([c0.r + (c1.r - c0.r) * m, c0.g + (c1.g - c0.g) * m, c0.b + (c1.b - c0.b) * m], v * 3);
        }
      }
    }
    for (const k in at) at[k].needsUpdate = true;
  };

  H.whiteCount = function () { let n = 0; H.S.forEach((s) => { if (s.white && s.alive && !(s.type === 'twin' && s.pair >= 0 && H.S.indexOf(s) > s.pair)) n++; }); return n; };
  H.NP = NP; H.SEG = SEG;
})();
