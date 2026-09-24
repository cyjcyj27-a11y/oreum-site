// 코스 12개 — 닫힌 곡선 + 도로 메쉬 + 위치 찾기(s,t)
(function () {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // 시드 난수 (코스 모양을 늘 같게)
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // 코스: 이름 · 테마 · 바퀴 · 도로 반폭 · 모양(시드·마디수·반지름·굴곡·언덕)
  // 시드는 코너 최소 반지름 13m 이상이 나오는 것으로 골랐다(더 급하면 안쪽 인도·담장이 도로 위로 접힌다)
  const COURSES = [
    { name: '애월 해안도로', theme: 'aewol', laps: 3, hw: 6.4, seed: 11, n: 9, R: 118, wob: 0.20, hill: 0, cup: 0 },
    { name: '감귤밭 돌담길', theme: 'orchard', laps: 3, hw: 6.6, seed: 23, n: 10, R: 126, wob: 0.24, hill: 2, cup: 0 },
    { name: '협재 해변', theme: 'hyeopjae', laps: 3, hw: 6.2, seed: 37, n: 11, R: 134, wob: 0.28, hill: 5, cup: 0 },
    { name: '제주 시내', theme: 'jejucity', laps: 3, hw: 5.8, seed: 69, n: 12, R: 130, wob: 0.30, hill: 3, cup: 1 },
    { name: '녹차밭', theme: 'tea', laps: 3, hw: 6.2, seed: 53, n: 11, R: 140, wob: 0.30, hill: 6, cup: 1 },
    { name: '유채꽃 들판', theme: 'canola', laps: 3, hw: 5.6, seed: 95, n: 13, R: 128, wob: 0.34, hill: 0, cup: 1 },
    { name: '산굼부리 억새밭', theme: 'sangumburi', laps: 3, hw: 5.8, seed: 78, n: 12, R: 138, wob: 0.34, hill: 8, cup: 2 },
    { name: '풍차 해안', theme: 'windcoast', laps: 3, hw: 6.0, seed: 83, n: 12, R: 150, wob: 0.30, hill: 4, cup: 2 },
    { name: '용두암 바윗가', theme: 'yongduam', laps: 3, hw: 5.4, seed: 97, n: 14, R: 132, wob: 0.36, hill: 3, cup: 2 },
    { name: '성산일출봉', theme: 'seongsan', laps: 3, hw: 6.0, seed: 131, n: 12, R: 156, wob: 0.32, hill: 9, cup: 3 },
    { name: '한라산 숲길', theme: 'hallasan', laps: 3, hw: 6.2, seed: 113, n: 13, R: 150, wob: 0.34, hill: 5, cup: 3 },
    { name: '밤의 탑동', theme: 'tapdong', laps: 3, hw: 5.6, seed: 141, n: 15, R: 148, wob: 0.38, hill: 6, cup: 3 },
  ];

  // 닫힌 코스 점 만들기 (각도는 단조 증가 → 스스로 겹치지 않는다)
  function shape(c) {
    const r = rng(c.seed), pts = [];
    let a = 0;
    const steps = [];
    for (let i = 0; i < c.n; i++) steps.push(0.6 + r() * 1.0);
    const sum = steps.reduce((x, y) => x + y, 0);
    for (let i = 0; i < c.n; i++) {
      const rad = c.R * (1 - c.wob + r() * c.wob * 2);
      const y = c.hill ? Math.sin(a * 2.0 + c.seed) * c.hill * 0.5 + Math.sin(a * 3.0) * c.hill * 0.35 : 0;
      pts.push(V3(Math.cos(a) * rad, y, Math.sin(a) * rad));
      a += (steps[i] / sum) * Math.PI * 2;
    }
    return pts;
  }

  // 코스 하나를 샘플 배열로 (등간격 3m)
  function sampleCourse(idx) {
    const c = COURSES[idx];
    const curve = new THREE.CatmullRomCurve3(shape(c), true, 'catmullrom', 0.5);
    const len = curve.getLength();
    const N = Math.max(120, Math.round(len / 3));
    const pts = curve.getSpacedPoints(N); // N+1 개, 마지막 = 처음
    const S = [];
    let s = 0;
    for (let i = 0; i < N; i++) {
      const p = pts[i], nx = pts[(i + 1) % N];
      const tan = nx.clone().sub(p);
      const d = tan.length();
      tan.normalize();
      const side = V3(tan.z, 0, -tan.x).normalize();
      S.push({ p: p.clone(), tan, side, s, d, hw: c.hw });
      s += d;
    }
    // 코너 급한 곳은 살짝 넓게(안쪽 막히는 느낌 줄이기)
    for (let i = 0; i < N; i++) {
      const a = S[(i - 3 + N) % N].tan, b = S[(i + 3) % N].tan;
      const cur = Math.acos(Math.max(-1, Math.min(1, a.dot(b))));
      S[i].curv = cur;
      S[i].hw = c.hw + Math.min(1.6, cur * 2.2);
    }
    let minY = 0;
    S.forEach((q) => { if (q.p.y < minY) minY = q.p.y; });
    return { c, curve, S, N, total: s, groundY: minY - 1.15 };
  }

  // 인도 폭(도로 가장자리에서 평평한 구간)과, 그 밖에서 땅까지 내려가는 비탈 폭
  const SIDE = 3.9;
  function slopeW(T, roadY) { return Math.max(2.6, 1.5 * (roadY - T.groundY)); }
  // 위치(loc: locate 결과)의 바닥 높이 — 도로·인도는 도로 높이, 그 밖은 비탈을 따라 내려간다
  function groundY(T, loc) {
    const d = Math.abs(loc.t) - loc.hw;
    if (d <= SIDE) return loc.y;
    const W = slopeW(T, loc.y);
    if (d >= SIDE + W) return T.groundY + 0.03;
    const f = (d - SIDE) / W;
    return (loc.y - 0.04) * (1 - f) + (T.groundY + 0.03) * f;
  }

  // 아스팔트/흙 질감 (작은 캔버스 하나 만들어 반복)
  function noiseTex(base, spec, lines) {
    const S = 128, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.fillStyle = base;
    g.fillRect(0, 0, S, S);
    const im = g.getImageData(0, 0, S, S), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * spec;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(im, 0, 0);
    if (lines) {
      g.strokeStyle = 'rgba(0,0,0,.22)';
      g.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        const x = Math.random() * S, y = Math.random() * S;
        g.moveTo(x, y);
        g.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
        g.stroke();
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // 도로 + 갓길 + 흰 선 메쉬
  function roadMesh(T, theme) {
    const S = T.S, N = T.N;
    const pos = [], uv = [], idx = [];
    const shPos = [], shUv = [], shIdx = [];
    const lnPos = [], lnIdx = [];
    const dlPos = [], dlIdx = [];
    // 갓길 = 평평한 인도(SIDE) + 땅까지 내려가는 비탈. 인도 위에 소품이 서고 경계 담장이 3.4m 에 선다
    let u = 0;
    for (let i = 0; i <= N; i++) {
      const a = S[i % N];
      const l = a.p.clone().addScaledVector(a.side, -a.hw);
      const r = a.p.clone().addScaledVector(a.side, a.hw);
      const l1 = a.p.clone().addScaledVector(a.side, -a.hw - SIDE);
      const r1 = a.p.clone().addScaledVector(a.side, a.hw + SIDE);
      l1.y -= 0.04; r1.y -= 0.04;
      const W = slopeW(T, a.p.y);
      const l2 = a.p.clone().addScaledVector(a.side, -a.hw - SIDE - W);
      const r2 = a.p.clone().addScaledVector(a.side, a.hw + SIDE + W);
      l2.y = T.groundY + 0.03; r2.y = T.groundY + 0.03;
      pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
      uv.push(0, u, 1, u);
      shPos.push(l2.x, l2.y, l2.z, l1.x, l1.y, l1.z, l.x, l.y, l.z, r.x, r.y, r.z, r1.x, r1.y, r1.z, r2.x, r2.y, r2.z);
      shUv.push(0, u, 1, u, 0, u, 1, u, 0, u, 1, u);
      // 가장자리 흰 선
      const lo = a.p.clone().addScaledVector(a.side, -a.hw + 0.55), li = a.p.clone().addScaledVector(a.side, -a.hw + 0.9);
      const ro = a.p.clone().addScaledVector(a.side, a.hw - 0.55), ri = a.p.clone().addScaledVector(a.side, a.hw - 0.9);
      lnPos.push(lo.x, lo.y, lo.z, li.x, li.y, li.z, ri.x, ri.y, ri.z, ro.x, ro.y, ro.z);
      // 가운데 점선 (여섯 칸마다 한 칸)
      if (i % 6 < 3) {
        const ml = a.p.clone().addScaledVector(a.side, -0.16), mr = a.p.clone().addScaledVector(a.side, 0.16);
        dlPos.push(ml.x, ml.y, ml.z, mr.x, mr.y, mr.z);
        if (i % 6 < 2) { const b2 = dlPos.length / 3 - 2; dlIdx.push(b2, b2 + 2, b2 + 1, b2 + 1, b2 + 2, b2 + 3); }
      }
      u += a.d / 7;
      if (i < N) {
        const b = i * 2;
        idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
        const c6 = i * 6;
        for (const k of [0, 1, 3, 4]) { // 비탈·인도 (왼쪽 둘, 오른쪽 둘)
          const A = c6 + k, Bv = c6 + k + 1;
          shIdx.push(A, A + 6, Bv, Bv, A + 6, Bv + 6);
        }
        const c4 = i * 4;
        lnIdx.push(c4, c4 + 4, c4 + 1, c4 + 1, c4 + 4, c4 + 5);
        lnIdx.push(c4 + 2, c4 + 6, c4 + 3, c4 + 3, c4 + 6, c4 + 7);
      }
    }
    const mk = (p, i2, u2) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      if (u2) g.setAttribute('uv', new THREE.Float32BufferAttribute(u2, 2));
      g.setIndex(i2);
      g.computeVertexNormals();
      return g;
    };
    const roadTex = noiseTex(theme.road, theme.roadSpec, true);
    roadTex.repeat.set(1, 1);
    const road = new THREE.Mesh(mk(pos, idx, uv), new THREE.MeshLambertMaterial({ map: roadTex }));
    road.receiveShadow = true;
    const shTex = noiseTex(theme.shoulder, 26, false);
    const shoulder = new THREE.Mesh(mk(shPos, shIdx, shUv), new THREE.MeshLambertMaterial({ map: shTex }));
    shoulder.receiveShadow = true;
    const line = new THREE.Mesh(mk(lnPos, lnIdx), new THREE.MeshBasicMaterial({ color: theme.line, transparent: true, opacity: 0.75 }));
    line.material.polygonOffset = true;
    line.material.polygonOffsetFactor = -2;
    line.material.polygonOffsetUnits = -4;
    const dash = new THREE.Mesh(mk(dlPos, dlIdx), new THREE.MeshBasicMaterial({ color: theme.line, transparent: true, opacity: 0.55 }));
    dash.material.polygonOffset = true;
    dash.material.polygonOffsetFactor = -2;
    dash.material.polygonOffsetUnits = -4;
    return { road, shoulder, line, dash };
  }

  // 출발선 격자 (8대)
  function grid(T, n) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / 2), col = k % 2 ? 1 : -1;
      const s = T.total - 12 - row * 6.5;
      const a = at(T, s);
      const p = a.p.clone().addScaledVector(a.side, col * 2.6);
      out.push({ p, dir: a.tan.clone(), s });
    }
    return out;
  }

  function at(T, s) {
    let ss = ((s % T.total) + T.total) % T.total;
    let i = Math.floor(ss / T.total * T.N) % T.N;
    // 누적 거리로 보정
    while (T.S[i].s > ss && i > 0) i--;
    while (i + 1 < T.N && T.S[i + 1].s <= ss) i++;
    const a = T.S[i], b = T.S[(i + 1) % T.N];
    const f = a.d > 0 ? (ss - a.s) / a.d : 0;
    return {
      i,
      p: a.p.clone().lerp(b.p, f),
      tan: a.tan.clone().lerp(b.tan, f).normalize(),
      side: a.side.clone().lerp(b.side, f).normalize(),
      hw: a.hw + (b.hw - a.hw) * f,
    };
  }

  // 위치 → s,t (hint 주변만 본다)
  function locate(T, pos, hint) {
    const N = T.N;
    let best = -1, bd = 1e9;
    const lo = hint == null ? 0 : hint - 25, hi = hint == null ? N : hint + 25;
    for (let k = lo; k < hi; k++) {
      const i = ((k % N) + N) % N;
      const dx = pos.x - T.S[i].p.x, dz = pos.z - T.S[i].p.z;
      const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    const a = T.S[best];
    const dx = pos.x - a.p.x, dy = pos.y - a.p.y, dz = pos.z - a.p.z;
    const along = dx * a.tan.x + dz * a.tan.z;
    const t = dx * a.side.x + dz * a.side.z;
    return { i: best, s: a.s + along, t, hw: a.hw, y: a.p.y + a.tan.y * along, side: a.side, tan: a.tan, p: a.p };
  }

  window.TRACK = { COURSES, sampleCourse, roadMesh, grid, at, locate, noiseTex, rng, groundY, SIDE };
})();
