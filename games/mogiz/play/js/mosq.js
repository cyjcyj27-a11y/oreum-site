// 주인공 모기: 모양(흰 줄무늬 다리·투명 날개·빨갛게 부푸는 배)과 날기 물리.
(function () {
  const M = (window.MOSQ = {});
  const V = THREE.Vector3;
  M.pos = new V(); M.vel = new V(); M.yaw = 0; M.pitch = 0; M.roll = 0; M.R = 0.012;
  M.belly = 0; // 0~1 배 찬 정도

  M.build = function (scene) {
    const root = (M.root = new THREE.Group());
    const body = (M.body = new THREE.Group()); root.add(body);
    const S = 1.7; body.scale.setScalar(S);
    const dark = '#2e2836', white = '#f4f1e8';
    // 가슴(굽은 등, 흰 비늘 줄 둘)
    const th = TOON.mesh(new THREE.SphereGeometry(0.0028, 14, 10), dark); th.scale.set(0.85, 1.0, 1.12); body.add(th);
    [-1, 1].forEach((s) => { const sp = TOON.mesh(new THREE.SphereGeometry(0.0006, 8, 6), white, false); sp.position.set(s * 0.0008, 0.0026, -0.0004); sp.scale.set(0.6, 0.4, 3.2); body.add(sp); });
    // 머리 + 큰 겹눈(만화처럼 크게, 흰 반짝)
    const hd = TOON.mesh(new THREE.SphereGeometry(0.0017, 12, 8), dark); hd.position.set(0, 0.0003, -0.0036); body.add(hd);
    const hlM = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    [-1, 1].forEach((s) => { const e = TOON.mesh(new THREE.SphereGeometry(0.00135, 12, 8), '#b8233f'); e.position.set(s * 0.0011, 0.0006, -0.0041); body.add(e);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.0004, 6, 4), hlM); hl.position.set(s * 0.0014, 0.0013, -0.0049); body.add(hl); });
    // 침(앞 아래로 긴 바늘) + 짧은 수염
    const pr = TOON.mesh(new THREE.CylinderGeometry(0.0002, 0.00034, 0.011, 6), '#1e1a24');
    pr.position.set(0, -0.0021, -0.0084); pr.rotation.x = -Math.PI / 2 - 0.5; body.add(pr); M.prob = pr;
    [-1, 1].forEach((s) => { const pp = TOON.mesh(new THREE.CylinderGeometry(0.00018, 0.00022, 0.0035, 5), dark, false); pp.position.set(s * 0.0005, -0.0012, -0.0056); pp.rotation.set(-Math.PI / 2 - 0.4, 0, 0); body.add(pp); });
    // 더듬이(깃털: 줄기 + 잔털 몇 줄)
    [-1, 1].forEach((s) => { const a = TOON.mesh(new THREE.CylinderGeometry(0.00012, 0.0002, 0.0048, 5), '#4a4252', false); a.position.set(s * 0.0006, 0.0018, -0.0058); a.rotation.set(-0.85, 0, -s * 0.45); body.add(a);
      for (let k = 0; k < 3; k++) { const f = TOON.mesh(new THREE.CylinderGeometry(0.00007, 0.00007, 0.0016, 3), '#6a6272', false); f.position.set(0, -0.001 + k * 0.0012, 0); f.rotation.z = Math.PI / 2; a.add(f); } });
    // 배(가늘고 긴 배, 꼬리는 살짝 들림): 흰 띠 넷. 피를 먹으면 빨갛게 동그랗게
    const ab = (M.ab = new THREE.Group()); ab.position.set(0, -0.0003, 0.0024); ab.rotation.x = 0.12; body.add(ab);
    M.abMat = TOON.mat({ color: '#3a3444' });
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.0016, 14, 10), M.abMat); abd.position.z = 0.0062; abd.scale.set(1, 0.92, 4.0); abd.castShadow = true; TOON.outline(abd); ab.add(abd); M.abd = abd;
    M.rings = [];
    [0.0026, 0.0044, 0.0062, 0.008].forEach((z, i) => { const rr = 0.0016 * Math.sqrt(Math.max(0.05, 1 - Math.pow((z - 0.0062) / 0.0064, 2))); const r = new THREE.Mesh(new THREE.TorusGeometry(rr * 0.98, 0.00028, 5, 16), TOON.col(white)); r.position.z = z; ab.add(r); M.rings.push(r); });
    // 다리 여섯: 넓적다리·종아리·발목 세 마디, 흰 띠. 뒷다리는 들어 올림(흰줄숲모기)
    const lb = new TOON.Batch();
    const LEGS = [
      [[0.0011, -0.0016, -0.0012], [0.55, 0.25, -0.8], [0.35, -0.75, -0.55], [0.15, -0.95, -0.25]],
      [[0.0013, -0.0017, 0.0002], [1, 0.3, 0.05], [0.45, -0.88, 0.15], [0.25, -0.95, 0.2]],
      [[0.0011, -0.0016, 0.0013], [0.65, 0.25, 0.7], [0.2, 0.45, 0.88], [0.08, 0.7, 0.72]],
    ];
    const LL = [0.0062, 0.0072, 0.0082];
    LEGS.forEach((L) => [-1, 1].forEach((s) => {
      let p = new V(s * L[0][0], L[0][1], L[0][2]);
      for (let j = 0; j < 3; j++) {
        const d = new V(s * L[j + 1][0], L[j + 1][1], L[j + 1][2]).normalize(), n = j === 2 ? 4 : 3, step = LL[j] / n;
        for (let k = 0; k < n; k++) {
          const a = p.clone(), b2 = p.clone().addScaledVector(d, step), g = new THREE.CylinderGeometry(0.00017 - j * 0.00003, 0.0002 - j * 0.00003, step * 1.02, 5);
          const mid = a.clone().add(b2).multiplyScalar(0.5), q = new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), d);
          lb.add(g, (k === n - 1 && j < 2) || (j === 2 && k % 2) ? white : dark, new THREE.Matrix4().compose(mid, q, new V(1, 1, 1)));
          p = b2;
        }
        // 마디 관절 점
        lb.add(new THREE.SphereGeometry(0.00026, 5, 4), dark, new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
      }
    }));
    const legM = lb.build({ cast: true, ol: false }); body.add(legM); M.legs = legM;
    // 앉을 때 숫자: 침 끝 자리(몸 좌표), 숙이는 각, 다리 아래 끝
    const pd = new V(0, 1, 0).applyEuler(pr.rotation), tip = pr.position.clone().addScaledVector(pd, 0.0055);
    M.tipL = tip; M.tilt = -0.34; M.S = S;
    const ty = tip.y * Math.cos(M.tilt) - tip.z * Math.sin(M.tilt), tz = tip.y * Math.sin(M.tilt) + tip.z * Math.cos(M.tilt);
    M.perchH = -ty * S; M.perchZ = -tz * S;
    legM.geometry.computeBoundingBox(); M.legMin = -legM.geometry.boundingBox.min.y;
    // 빨려 올라가는 피 방울(침 → 머리 → 배)
    M.prMat = pr.material = TOON.mat({ color: '#1e1a24' });
    const fm = new THREE.MeshBasicMaterial({ color: '#ff2a44' });
    M.flowPath = [tip.clone(), pr.position.clone().addScaledVector(pd, -0.004), new V(0, 0.0002, -0.0032), new V(0, 0, 0.001), new V(0, -0.0004, 0.006)];
    M.flow = [];
    for (let i = 0; i < 7; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.0008, 6, 4), fm); d.visible = false; d.userData.k = i / 7; body.add(d); M.flow.push(d); }
    // 날개 둘: 등 위로 뒤를 향해 누운 가는 잎, 날 때는 파르르(흐린 두 장)
    const wm = new THREE.MeshBasicMaterial({ color: '#dff0ff', transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false });
    const wl = new THREE.MeshBasicMaterial({ color: '#2a3550', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
    M.wings = [-1, 1].map((s) => {
      const piv = new THREE.Group(); piv.position.set(s * 0.0011, 0.0024, -0.0002); body.add(piv);
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.0047, 18), wm); w.scale.set(0.26, 1, 1); w.rotation.x = -Math.PI / 2; w.position.set(0, 0, 0.0046); piv.add(w);
      const vein = new THREE.Mesh(new THREE.PlaneGeometry(0.0002, 0.009), wl); vein.rotation.x = -Math.PI / 2; vein.position.set(0, 0.00005, 0.0046); piv.add(vein);
      const edge = new THREE.Mesh(new THREE.RingGeometry(0.00445, 0.0047, 18), wl); edge.scale.set(0.26, 1, 1); edge.rotation.x = -Math.PI / 2; edge.position.copy(w.position); piv.add(edge);
      piv.userData.s = s; return piv;
    });
    // 바닥 그림자 점
    const sh = (M.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.012, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })));
    scene.add(sh); scene.add(root);
    return root;
  };

  // 배 크기·색(0 빈 배 회색 → 1 빨갛게 빵빵)
  const cE = new THREE.Color('#4a4252'), cF = new THREE.Color('#e3243f'), cT = new THREE.Color();
  M.setBelly = function (f, pulse) {
    M.belly = f; const k = 1 + f * 1.35 + (pulse || 0);
    M.ab.scale.set(k, k, 1 + f * 0.22);
    cT.copy(cE).lerp(cF, Math.min(1, f * 1.4)); M.abMat.color.copy(cT);
    M.rings.forEach((r) => { r.visible = f < 0.55; });
  };

  // 날기: want = 원하는 속도(월드), maxs 최고 속도. 부딪힘은 WORLD.push 로.
  M.step = function (dt, want, accel) {
    const a = Math.min(1, dt * (accel || 7));
    M.vel.x += (want.x - M.vel.x) * a; M.vel.y += (want.y - M.vel.y) * a; M.vel.z += (want.z - M.vel.z) * a;
    M.pos.addScaledVector(M.vel, dt);
    return WORLD.push(M.pos, M.R, M.vel);
  };

  // 모양 맞추기(날갯짓·기울기·그림자)
  let flapT = 0;
  M.pose = function (dt, t, mode) {
    const sp = M.vel.length();
    flapT += dt;
    const flap = mode === 'attach' ? 0.15 : mode === 'dead' ? 0 : 1;
    M.wings.forEach((w) => { const s = w.userData.s; w.rotation.z = s * (0.15 + (0.5 + 0.5 * Math.sin(flapT * 95 + s)) * 0.9 * flap); w.rotation.y = s * (0.18 + flap * 0.55); });
    // 나는 쪽으로 머리, 속도만큼 숙이고 꺾는 쪽으로 기울기
    M.root.position.copy(M.pos);
    if (mode !== 'attach' && mode !== 'dead') {
      const hv = Math.hypot(M.vel.x, M.vel.z);
      if (hv > 0.05) { const ty = Math.atan2(-M.vel.x, -M.vel.z); let d = ty - M.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); M.yaw += d * Math.min(1, dt * 9); M.roll += (THREE.MathUtils.clamp(d * 1.2, -0.6, 0.6) - M.roll) * Math.min(1, dt * 6); }
      else M.roll *= 1 - Math.min(1, dt * 4);
      M.pitch += (THREE.MathUtils.clamp(M.vel.y * 0.5 - hv * 0.18, -0.6, 0.6) - M.pitch) * Math.min(1, dt * 6);
      M.body.position.y = Math.sin(t * 5.3) * 0.0012; // 둥실
    }
    if (mode === 'attach' && M.attQ) {
      M.body.quaternion.copy(M.attQ); M.body.position.set(0, 0, 0);
      const ly = Math.min(1, (M.perchH * 0.92) / (M.legMin * M.S)); M.legs.scale.set(1.35, ly, 1.25);
    } else { M.body.rotation.set(M.pitch, M.yaw, M.roll, 'YXZ'); M.legs.scale.set(1, 1, 1); M.attQ = null; }
    // 그림자 점
    const fy = WORLD.floorY(M.pos), hgt = M.pos.y - fy;
    M.shadow.visible = hgt < 1.6 && mode !== 'dead';
    M.shadow.position.set(M.pos.x, fy + 0.003, M.pos.z);
    const s = 1 + hgt * 1.4; M.shadow.scale.set(s, 1, s); M.shadow.material.opacity = 0.42 / (1 + hgt * 2.2);
    return sp;
  };
  // 살 위에 서기: pt 에 침 끝, n 살 바깥 법선, t 머리가 향할 살 결 방향, ins 0~1 침이 들어간 정도
  const _x = new V(), _z = new V(), _m4 = new THREE.Matrix4(), _qt = new THREE.Quaternion();
  M.perch = function (pt, n, t, ins) {
    _z.copy(t).multiplyScalar(-1); _x.crossVectors(n, _z).normalize(); _z.crossVectors(_x, n).normalize();
    _m4.makeBasis(_x, n, _z);
    M.attQ = (M.attQ || new THREE.Quaternion()).setFromRotationMatrix(_m4).multiply(_qt.setFromAxisAngle(_x.set(1, 0, 0), M.tilt));
    // 몸 가운데 = 침 끝에서 뒤로 perchZ, 위로 perchH (꽂히면 2mm 내려감)
    M.pos.copy(pt).addScaledVector(t, -M.perchZ).addScaledVector(n, M.perchH - 0.0022 * (ins || 0));
    M.yaw = Math.atan2(-t.x, -t.z); M.pitch = 0; M.roll = 0;
  };
  // 피가 침을 타고 올라감(k 0~1 길 위 자리)
  const _pp = new V();
  M.suckFx = function (on, t, dt) {
    const P = M.flowPath;
    M.flow.forEach((d) => {
      d.visible = on;
      if (!on) return;
      d.userData.k = (d.userData.k + dt * 1.6) % 1;
      const f = d.userData.k * (P.length - 1), i = Math.floor(f), u = f - i;
      d.position.copy(P[i]).lerp(P[i + 1], u);
      const sc = 0.7 + Math.sin(d.userData.k * Math.PI) * 0.6; d.scale.setScalar(sc);
    });
    M.prMat.color.set(on ? (Math.sin(t * 14) > 0 ? '#7a1424' : '#4a0e18') : '#1e1a24');
  };
  // 붙었을 때: 침을 살 쪽(n 반대)으로
  M.face = function (n) {
    // 몸이 n 방향에서 살을 내려다보게: 앞(-z)이 -n 쪽으로 기울어짐
    const yaw = Math.atan2(n.x, n.z) + (Math.abs(n.y) > 0.8 ? M.yaw : 0);
    if (Math.abs(n.y) <= 0.8) M.yaw = yaw;
    M.pitch = n.y > 0.8 ? 0 : n.y < -0.8 ? -0.5 : 0.12; M.roll = 0;
  };
})();
