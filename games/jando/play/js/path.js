// 잔도 — 판자 칸의 자리(나선), 쇠기둥·판자·난간 그림(인스턴스), 걷는 바닥 질의
(function () {
  const T = TERRAIN;
  const DEP = 1.15, THK = 0.1, RAIL_H = 1.05, BOLT_H = 1.75;
  const S = { segs: [], built: 0, work: null, inst: {}, scene: null, markTex: null, clips: new Set([-1]), lastP: -1 };

  // ── 칸 자리 계산 ─────────────────────────────────
  function rawInner(i) {
    const th0 = T.TH0 + i * T.DTH, th1 = th0 + T.DTH, y = T.Y0 + i * T.RISE;
    let m = 0;
    for (let a = 0; a <= 6; a++) { const th = th0 - 0.02 + (th1 - th0 + 0.04) * a / 6; for (let yy = y - 0.25; yy <= y + 2.05; yy += 0.23) m = Math.max(m, T.surfaceRadius(th, yy)); }
    return m + 0.03;
  }
  function layout() {
    const raw = []; for (let i = 0; i < T.NSEG; i++) raw.push(rawInner(i));
    for (let i = 0; i < T.NSEG; i++) {
      const a = raw[Math.max(0, i - 1)], b = raw[Math.min(T.NSEG - 1, i + 1)];
      const rIn = Math.max(raw[i], (a + b) / 2);
      const th0 = T.TH0 + i * T.DTH, thc = th0 + T.DTH / 2, y = T.Y0 + i * T.RISE;
      const rc = rIn + DEP / 2, L = 2 * rc * Math.sin(T.DTH / 2) + 0.03;
      const C = new THREE.Vector3(Math.cos(thc) * rc, y - THK / 2, Math.sin(thc) * rc);
      const tan = new THREE.Vector3(-Math.sin(thc), 0, Math.cos(thc)), rad = new THREE.Vector3(Math.cos(thc), 0, Math.sin(thc));
      const beams = [0.16, 0.84].map(f => {
        const u = (f - 0.5) * L;
        const out = C.clone().addScaledVector(tan, u); out.y = y - THK - 0.045;
        const th = Math.atan2(out.z, out.x);
        const hole = T.surfacePoint(th, out.y, 0);
        const n = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
        const tip = out.clone().addScaledVector(rad, DEP / 2 + 0.06);    // 바깥 끝 (판자 바깥보다 살짝)
        return { u, th, hole, n, tip, len: hole.distanceTo(tip) + 0.38 };
      });
      S.segs.push({ i, th0, thc, y, rIn, rc, L, C, tan, rad, beams });
    }
  }
  function seg(i) { return S.segs[i]; }

  // ── 그림 ──────────────────────────────────────────
  function woodTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
    const rng = NOISE.makeRng(5150);
    const boards = 4, bh = c.height / boards;
    for (let b = 0; b < boards; b++) {
      const base = [[150, 106, 66], [138, 96, 58], [160, 116, 72], [128, 90, 56]][b];
      g.fillStyle = 'rgb(' + base + ')'; g.fillRect(0, b * bh, c.width, bh);
      for (let k = 0; k < 46; k++) {   // 나뭇결
        const yy = b * bh + rng() * bh, a = 0.05 + rng() * 0.12, w = 0.6 + rng() * 1.6;
        g.strokeStyle = 'rgba(60,34,16,' + a + ')'; g.lineWidth = w; g.beginPath(); g.moveTo(0, yy);
        for (let x = 0; x <= c.width; x += 32) g.lineTo(x, yy + Math.sin(x * 0.013 + k) * 2.2 + (rng() - 0.5) * 1.2);
        g.stroke();
      }
      for (let k = 0; k < 2; k++) { const x = rng() * c.width, y = b * bh + bh * (0.3 + rng() * 0.4); g.fillStyle = 'rgba(70,40,20,.55)'; g.beginPath(); g.ellipse(x, y, 7 + rng() * 6, 3 + rng() * 2, 0, 0, Math.PI * 2); g.fill(); }   // 옹이
      g.fillStyle = 'rgba(30,18,10,.85)'; g.fillRect(0, b * bh, c.width, 2.5);                                  // 판자 틈
      g.fillStyle = 'rgba(255,230,190,.10)'; g.fillRect(0, b * bh + 3, c.width, 3);
      for (const x of [26, c.width - 26]) { g.fillStyle = '#3a3a3c'; g.beginPath(); g.arc(x, b * bh + bh / 2, 4.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - 1.2, b * bh + bh / 2 - 1.2, 1.6, 0, 7); g.fill(); }   // 못
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function markTex() {   // 분필 X + 동그라미
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,250,.95)'; g.lineCap = 'round';
    g.lineWidth = 9; g.beginPath(); g.moveTo(30, 34); g.lineTo(98, 96); g.moveTo(96, 30); g.lineTo(32, 98); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 52, 0.3, 5.9); g.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function holeTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(10,8,6,1)'); gr.addColorStop(0.42, 'rgba(20,14,10,1)'); gr.addColorStop(0.55, 'rgba(120,100,80,.8)'); gr.addColorStop(1, 'rgba(200,180,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function inst(geo, mat, n, shadow) {
    const m = new THREE.InstancedMesh(geo, mat, n); m.count = 0; m.castShadow = !!shadow; m.receiveShadow = true;
    m.frustumCulled = false; S.scene.add(m); return m;
  }
  function init(scene) {
    S.scene = scene; layout();
    const n = T.NSEG + 2;
    const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.82 }); S.wood = wood; S.steel = null;
    const steel = new THREE.MeshStandardMaterial({ color: 0x55585e, roughness: 0.45, metalness: 0.75 });
    const red = new THREE.MeshStandardMaterial({ color: 0xa8281e, roughness: 0.6, metalness: 0.2 }); S.steel = steel; S.red = red;
    S.inst.bolt = inst(new THREE.TorusGeometry(0.045, 0.012, 6, 12), steel, n + 2, false);
    S.inst.clip = inst(new THREE.TorusGeometry(0.06, 0.016, 6, 14), new THREE.MeshStandardMaterial({ color: 0xc8261c, roughness: 0.4, metalness: 0.5 }), n + 2, false);   // 건 고리(확보): 빨간 카라비너
    S.inst.cable = inst(new THREE.CylinderGeometry(0.008, 0.008, 1, 4), new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.5, metalness: 0.6 }), (n + 2) * 4, false);
    S.inst.plank = inst(new THREE.BoxGeometry(1, THK, 1), wood, n, true);
    S.inst.beam = inst(new THREE.BoxGeometry(0.075, 0.075, 1), steel, n * 2, true);
    S.inst.post = inst(new THREE.CylinderGeometry(0.03, 0.035, RAIL_H, 8), red, n, true);
    S.inst.rail = inst(new THREE.CylinderGeometry(0.022, 0.022, 1, 6), red, n * 2, false);
    S.inst.hole = inst(new THREE.CircleGeometry(0.07, 14), new THREE.MeshBasicMaterial({ map: holeTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), n * 2, false);
    S.markTex = markTex();
    S.marks = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: S.markTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.visible = false; scene.add(m); return m; });
    // 시작 말뚝 (첫 안전줄 고리)
    S.bolt0 = T.surfacePoint(T.TH0 - 0.32, T.SHELF.yt + BOLT_H, 0.05);   // 시작 바위 고리 (첫 안전줄)
    S.stakeTop = S.bolt0;
    newWork();
    refresh();
  }

  // 지금 짓는 칸의 작업 상태
  function newWork() { S.work = S.built < T.NSEG ? { i: S.built, drill: [0, 0], drive: [0, 0], bend: [0, 0], jit: [0, 0] } : null; }

  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler(), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
  function setI(mesh, k, pos, quat, scl) { _m.compose(pos, quat, scl); mesh.setMatrixAt(k, _m); }
  function plankQuat(s, out) { return out.setFromEuler(_e.set(0, -s.thc, 0)).multiply(new THREE.Quaternion().setFromAxisAngle(_Y, 0)); }
  function beamPlace(s, k, drive, bend) {
    const b = s.beams[k];
    // 기둥 축: 구멍 → 바깥 끝. drive 0 이면 반만 박힌 채 바깥으로 0.3 더 나와 있다
    const dir = b.n.clone(); const out = 0.3 * (1 - drive);
    const inner = b.hole.clone().addScaledVector(dir, -0.38 + out);
    const tip = inner.clone().addScaledVector(dir, b.len);
    tip.y -= bend * 0.35;   // 휘면 끝이 처진다
    const mid = inner.clone().add(tip).multiplyScalar(0.5), d = tip.clone().sub(inner);
    _q.setFromUnitVectors(_Z, d.clone().normalize());
    return { mid, q: _q.clone(), len: d.length(), top: tip.y + 0.0375 };
  }
  function refresh() {
    const I = S.inst; let nb = 0, nh = 0, nr = 0;
    for (let i = 0; i < S.built; i++) {
      const s = seg(i), q = s.q || (s.q = new THREE.Quaternion().setFromAxisAngle(_Y, -s.thc + Math.PI / 2));
      const tilt = s.tilt || 0;
      const qq = q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt));
      // BoxGeometry(1,THK,1): x = 길이(접선), z = 깊이(바깥)
      _s.set(s.L, 1, DEP); setI(I.plank, i, s.C, plankQuatFix(s, qq), _s);
      for (let k = 0; k < 2; k++) { const bp = beamPlace(s, k, 1, (s.bend || [0, 0])[k]); _s.set(1, 1, bp.len); setI(I.beam, nb++, bp.mid, bp.q, _s); const h = s.beams[k]; _q.setFromUnitVectors(_Z, h.n); setI(I.hole, nh++, h.hole.clone().addScaledVector(h.n, 0.01), _q, _s.set(1, 1, 1)); }
      // 난간 기둥 (칸 끝 바깥 모서리)
      const pp = postPos(i); _s.set(1, 1, 1); _p.copy(pp); _p.y -= RAIL_H / 2; setI(I.post, i, _p, _q.identity(), _s);
      if (i > 0 && i < S.built - 0 && hasRail(i)) {   // 앞 기둥 → 이 기둥 난간 두 줄
        const a = postPos(i - 1), b = pp;
        for (const dy of [0, -0.45]) { const A = a.clone(), B = b.clone(); A.y += dy - 0.02; B.y += dy - 0.02; const mid = A.clone().add(B).multiplyScalar(0.5), d = B.clone().sub(A); _q.setFromUnitVectors(_Y, d.clone().normalize()); _s.set(1, d.length(), 1); setI(I.rail, nr++, mid, _q, _s); }
      }
    }
    // 바위 고리 + 고리를 잇는 안전 케이블
    let nbo = 0, nc = 0;
    for (let i = -1; i < S.built; i++) {
      const b = boltPos(i), th = Math.atan2(b.z, b.x); _q.setFromUnitVectors(_Z, _p.set(Math.cos(th), 0, Math.sin(th))); setI(I.bolt, nbo++, b, _q, _s.set(1, 1, 1));
      if (i >= 0) {   // 케이블은 네 토막으로 바위 겉을 따라간다
        const a = boltPos(i - 1); let prev = a.clone();
        for (let k = 1; k <= 4; k++) { const q = a.clone().lerp(b, k / 4); q.y -= Math.sin(k / 4 * Math.PI) * 0.04; if (k < 4) { const th2 = Math.atan2(q.z, q.x), R = T.surfaceRadius(th2, q.y) + 0.05, dq = Math.hypot(q.x, q.z); if (dq < R) { q.x *= R / dq; q.z *= R / dq; } }
          const mid = prev.clone().add(q).multiplyScalar(0.5), d = q.clone().sub(prev); _q.setFromUnitVectors(_Y, d.clone().normalize()); _s.set(1, d.length(), 1); setI(I.cable, nc++, mid, _q, _s); prev = q; }
      }
    }
    I.bolt.count = nbo; I.cable.count = nc;
    let ncl = 0;
    for (const j of S.clips) { if (j >= S.built) continue; const b = boltPos(j), th = Math.atan2(b.z, b.x); _q.setFromUnitVectors(_Z, _p.set(-Math.sin(th), 0, Math.cos(th))); _p.copy(b); _p.y -= 0.07; setI(I.clip, ncl++, _p, _q, _s.set(1.35, 2, 1.35)); }
    I.clip.count = ncl;
    I.plank.count = S.built; I.post.count = S.built; I.rail.count = nr;
    // 짓는 중인 칸: 박힌 기둥·구멍
    const w = S.work;
    if (w) {
      const s = seg(w.i);
      for (let k = 0; k < 2; k++) {
        const h = s.beams[k];
        const vo = visOff(h);
        if (w.drill[k] >= 1) { _q.setFromUnitVectors(_Z, h.n); setI(I.hole, nh++, h.hole.clone().addScaledVector(h.n, 0.01 + vo), _q, _s.set(1, 1, 1)); const bp = beamPlace(s, k, w.drive[k], w.bend[k]); _s.set(1, 1, bp.len); setI(I.beam, nb++, bp.mid, bp.q, _s); }
        const mk = S.marks[k]; mk.visible = w.drill[k] < 1;
        if (mk.visible) { mk.position.copy(h.hole).addScaledVector(h.n, 0.02 + vo); mk.quaternion.setFromUnitVectors(_Z, h.n); const sc = 1 - w.drill[k] * 0.6; mk.scale.set(sc, sc, 1); }
      }
    } else S.marks.forEach(m => m.visible = false);
    I.beam.count = nb; I.hole.count = nh;
    for (const k in I) I[k].instanceMatrix.needsUpdate = true;
  }
  // 절벽 그림(삼각형 면)은 오목한 곳에서 계산 면보다 최대 14cm 앞으로 나온다 → 분필 X·구멍이 그림 속에 묻혀 안 보였다(사장님 10/7 "드릴질할곳이 없어", 320개 중 77개).
  // 구멍 가운데와 X 네 귀(±0.15)에서 그림 면까지 광선으로 재서 가장 앞선 만큼 띄운다. 한 번 재면 기억
  const _rc = new THREE.Raycaster(), _ro = new THREE.Vector3(), _rd = new THREE.Vector3(), _ru = new THREE.Vector3(), _rs = new THREE.Vector3();
  function visOff(h) {
    if (h.vo !== undefined) return h.vo;
    const pm = window.WORLD && WORLD.S.pillar; if (!pm) return 0;
    pm.updateMatrixWorld(); _rd.copy(h.n).negate(); _rs.set(-h.n.z, 0, h.n.x); let m = 0;
    for (const [a, b] of [[0, 0], [0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) {
      _ro.copy(h.hole).addScaledVector(_rs, a).add(_ru.set(0, b, 0)).addScaledVector(h.n, 1.5); _rc.set(_ro, _rd); _rc.far = 3;
      const hit = _rc.intersectObject(pm, false)[0]; if (hit) m = Math.max(m, 1.5 - hit.distance);
    }
    return (h.vo = Math.min(0.3, m));
  }
  function plankQuatFix(s, qq) { return qq; }
  function postPos(i) { const s = seg(i); return s.C.clone().addScaledVector(s.tan, s.L / 2 - 0.05).addScaledVector(s.rad, DEP / 2 - 0.05).setY(s.y + RAIL_H); }
  function boltPos(i) { if (i < 0) return S.bolt0; const s = seg(i); if (!s.bolt) s.bolt = T.surfacePoint(s.th0 + T.DTH * 1.12, s.y + BOLT_H, 0.06); return s.bolt; }
  function hasRail(i) { return i > 0 && i < S.built - 1; }   // 맨 끝 칸은 아직 난간 없음 (다음 칸을 이어야 단다)

  // ── 바닥·충돌 질의 ─────────────────────────────────
  const _d = new THREE.Vector3();
  function local(s, x, z) { _d.set(x - s.C.x, 0, z - s.C.z); return { u: _d.dot(s.tan), v: _d.dot(s.rad) }; }
  function range(y) { const a = Math.max(0, Math.floor((y - 1.2 - T.Y0) / T.RISE)), b = Math.min(S.built - 1, Math.ceil((y + 0.7 - T.Y0) / T.RISE)); return [a, b]; }
  // 발 높이 yFeet 에서 디딜 수 있는 판자 윗면 (계단 0.5 까지) — 없으면 -Infinity
  function groundAt(x, z, yFeet, margin) {
    const [a, b] = range(yFeet); let g = -Infinity, which = -1;
    const mg = margin === undefined ? 0.12 : margin;
    for (let i = a; i <= b; i++) {
      const s = seg(i), l = local(s, x, z);
      if (Math.abs(l.u) < s.L / 2 + mg && l.v > -DEP / 2 - 0.3 && l.v < DEP / 2 + mg) {
        const top = s.y + (s.tilt || 0) * l.v * 0.0;
        if (top <= yFeet + 0.5 && top > g) { g = top; which = i; }
      }
    }
    return { y: g, i: which };
  }
  // 걷는 몸을 난간 안으로 (난간 있는 칸만)
  function railClamp(p) {
    const [a, b] = range(p.y);
    for (let i = a; i <= b; i++) {
      if (!hasRail(i)) continue;
      const s = seg(i), l = local(s, p.x, p.z);
      if (Math.abs(l.u) < s.L / 2 && Math.abs(p.y - s.y) < 0.6 && l.v > DEP / 2 - 0.26 && l.v < DEP / 2 + 0.5) { const k = (DEP / 2 - 0.26) - l.v; p.x += s.rad.x * k; p.z += s.rad.z * k; return true; }
    }
    return false;
  }
  // 물리 점을 판자 밖으로 (위로만 밀거나 아래에서 받친다)
  function pushOut(p, pad) {
    const [a, b] = range(p.y);
    for (let i = a; i <= b; i++) {
      const s = seg(i), l = local(s, p.x, p.z);
      if (Math.abs(l.u) > s.L / 2 + pad || l.v < -DEP / 2 - pad || l.v > DEP / 2 + pad) continue;
      const top = s.y + pad, bot = s.y - THK - pad;
      if (p.y < top && p.y > bot) {
        if (p.y > (top + bot) / 2) { const push = top - p.y; p.y = top; return { push, nx: 0, ny: 1, nz: 0 }; }
        const push = p.y - bot; p.y = bot; return { push, nx: 0, ny: -1, nz: 0 };
      }
    }
    return null;
  }
  // 안전줄 고리: 몸에서 가까운 기둥 (줄이 난간 줄을 따라 미끄러진다)
  const _c = new THREE.Vector3(), _ab = new THREE.Vector3();
  // 케이블 위 자리는 P 로 센다: 고리 j 가 P=j (시작 고리 -1), 그 사이는 소수. S.lastP 에 고른 자리를 남긴다
  // maxP 를 주면 그 자리 너머(위쪽)로는 못 간다 — 걸어 둔 고리(확보)보다 위로는 줄이 버티지 못한다(사장님 10/9 A안)
  function nearestAnchor(p, out, maxP) {
    // 수평 거리로 고른다: 고리가 몸 바로 위 케이블로 미끄러진다 (끝 고리 너머로는 못 간다)
    out = out || new THREE.Vector3();
    const cap = maxP === undefined ? S.built - 1 : maxP, c0 = boltPos(Math.max(-1, Math.floor(cap)));
    out.copy(c0); let bd = Math.hypot(p.x - c0.x, p.z - c0.z); S.lastP = Math.floor(cap);
    const a = Math.max(0, Math.floor((p.y - 5 - T.Y0) / T.RISE)), b = Math.min(S.built - 1, Math.ceil((p.y + 3 - T.Y0) / T.RISE));
    for (let i = a; i <= b; i++) {
      if (i - 1 >= cap) break;
      const A = boltPos(i - 1), Bq = boltPos(i); _ab.subVectors(Bq, A); const L2 = _ab.x * _ab.x + _ab.z * _ab.z;
      const k = Math.max(0, Math.min(Math.min(1, cap - (i - 1)), ((p.x - A.x) * _ab.x + (p.z - A.z) * _ab.z) / L2)); _c.copy(A).addScaledVector(_ab, k);
      const d = Math.hypot(p.x - _c.x, p.z - _c.z); if (d < bd) { bd = d; out.copy(_c); S.lastP = i - 1 + k; }
    }
    return out;
  }
  function anchorAt(P, out) { out = out || new THREE.Vector3(); const i = Math.max(-1, Math.min(S.built - 1, Math.floor(P))), k = P - i; if (i >= S.built - 1 || k <= 0) return out.copy(boltPos(i)); return out.copy(boltPos(i)).lerp(boltPos(i + 1), k); }
  function cableLen(P) { const i = Math.max(-1, Math.min(S.built - 2, Math.floor(P))); return Math.max(0.3, boltPos(i).distanceTo(boltPos(i + 1))); }
  function endAnchor() { return boltPos(S.built - 1).clone(); }
  function lay(tilt, bend) { const s = seg(S.built); s.tilt = tilt || 0; s.bend = bend || [0, 0]; S.built++; newWork(); refresh(); }
  function setBuilt(n, data) { S.built = Math.min(n, T.NSEG); for (let i = 0; i < S.built; i++) { const d = data && data[i]; seg(i).tilt = d ? d[0] : 0; seg(i).bend = d ? [d[1], d[2]] : [0, 0]; } newWork(); refresh(); }
  window.PATH = { S, DEP, THK, RAIL_H, BOLT_H, boltPos, visOff, init, seg, refresh, groundAt, railClamp, pushOut, nearestAnchor, anchorAt, cableLen, endAnchor, postPos, hasRail, lay, setBuilt, beamPlace, local };
})();
