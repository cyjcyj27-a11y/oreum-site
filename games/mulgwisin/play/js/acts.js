/* acts.js — 믹사모 동작(줍기·밀기·웅크리기·넘어지기·일어나기)을 주인공 모델 뼈에 옮겨 굽는다
 * 주인공(boy.glb)은 뼈 이름은 같지만 쉬는 자세의 뼈 방향이 믹사모와 전혀 달라서 트랙을 그대로 붙이면 몸이 꼬인다.
 * 그래서 프레임마다 "원본 뼈가 쉬는 자세에서 월드로 얼마나 돌았나"를 재서 주인공의 쉬는 자세에 같은 만큼 돌려 준다.
 * 엉덩이 이동은 다리 길이 비율로 줄이고, 두 모델이 보는 방향이 다르면 그만큼 돌려서 옮긴다. */
(function () {
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^mixamorig/, '');
  const SRC = ['assets/acts_a.glb', 'assets/acts_b.glb', 'assets/acts_d.glb'];   // d: 소금 던지기(믹사모 Throw)
  const AC = { srcs: [] };
  let loading = null;
  AC.load = function () {
    if (loading) return loading;
    loading = Promise.all(SRC.map(url => new Promise(res => {
      if (!window.GLTFLoaderClass) return res(null);
      window.WORLD.glbLoad(url).then(g => { g.url = url; res(g); }, () => res(null));   // file:// 에서도 읽힌다
    }))).then(gs => { AC.srcs = gs.filter(Boolean); return AC; });
    return loading;
  };

  const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
  function relTRS(root, o) {   // 루트 기준 위치·회전
    _m.copy(root.matrixWorld).invert().multiply(o.matrixWorld);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(); _m.decompose(p, q, _s); return { p, q };
  }
  function byName(root) { const m = {}; root.traverse(o => { const k = norm(o.name); if (k && !m[k]) m[k] = o; }); return m; }
  function legLen(root, M) {
    const ch = ['hips', 'leftupleg', 'leftleg', 'leftfoot'].map(k => M[k]); if (ch.some(x => !x)) return 1;
    let s = 0; for (let i = 0; i < 3; i++) s += relTRS(root, ch[i]).p.distanceTo(relTRS(root, ch[i + 1]).p); return s || 1;
  }
  function facingYaw(root, M) {   // 오른쪽 넓적다리 - 왼쪽 넓적다리 방향으로 몸이 보는 쪽을 잰다
    if (!M.leftupleg || !M.rightupleg) return 0;
    const r = relTRS(root, M.rightupleg).p.sub(relTRS(root, M.leftupleg).p); return Math.atan2(r.x, r.z);
  }

  // dst = 쉬는 자세 그대로인 주인공 모델(방금 불러온 것). 돌려주는 값: { 이름: AnimationClip } — 트랙 이름은 뼈 이름이라 같은 모델 어디에나 물린다
  // 기준 자세는 '쉬는 자세'가 아니라 서 있는 첫 프레임이다 — 믹사모 파일의 쉬는 자세(노드 기본값)는 믿을 수 없다
  const REF = { 'assets/acts_a.glb': 'pickup', 'assets/acts_b.glb': 'idle', 'assets/acts_d.glb': 'throw', 'assets/acts_u.glb': 'yell' };
  // 따로 한 파일만 — 아저씨 동작처럼 주인공에게는 안 붙이는 것
  AC.loadOne = url => new Promise(res => { if (!window.GLTFLoaderClass) return res(null); window.WORLD.glbLoad(url).then(g => { g.url = url; res(g); }, () => res(null)); });
  AC.bake = function (dst, dstClips, only) {
    const out = {};
    const dIdle = (dstClips || []).find(c => c.name === 'idle');
    const mixD = dIdle ? new THREE.AnimationMixer(dst) : null;
    if (mixD) { mixD.clipAction(dIdle).play(); mixD.setTime(0); }
    dst.updateMatrixWorld(true);
    const dM = byName(dst), dBones = []; dst.traverse(o => { if (o.isBone) dBones.push(o); });
    const dRest = new Map(), dRestLocal = new Map();
    dBones.forEach(b => { dRest.set(b, relTRS(dst, b)); dRestLocal.set(b, b.quaternion.clone()); });
    const parentRestQ = b => relTRS(dst, b.parent).q;
    const dHips = dM.hips; if (!dHips) return out;
    const hipParentInv = new THREE.Matrix4().copy(dst.matrixWorld).invert().multiply(dHips.parent.matrixWorld).invert();
    const dLeg = legLen(dst, dM), dYaw = facingYaw(dst, dM), dGround = dRest.get(dHips).p.y - dLeg;   // 서 있는 엉덩이 높이 - 다리 길이 = 발바닥
    if (mixD) mixD.stopAllAction();

    for (const g of (only || AC.srcs)) {
      const sRoot = g.scene, mixer = new THREE.AnimationMixer(sRoot);
      const ref = g.animations.find(c => c.name === REF[g.url]) || g.animations[0];
      const ra = mixer.clipAction(ref); ra.play(); mixer.setTime(0); sRoot.updateMatrixWorld(true);
      const sM = byName(sRoot), sRest = {};
      for (const k in sM) sRest[k] = relTRS(sRoot, sM[k]);
      ra.stop();
      const sLeg = legLen(sRoot, sM), k = dLeg / sLeg, h0 = new THREE.Vector3();
      const yaw = dYaw - facingYaw(sRoot, sM), R = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), Ri = R.clone().invert();
      for (const clip of g.animations) {
        if (clip.name === 'idle') continue;
        const act = mixer.clipAction(clip); act.reset().play();
        const fps = 30, n = Math.max(2, Math.round(clip.duration * fps) + 1), times = new Float32Array(n);
        const quats = dBones.map(() => new Float32Array(n * 4)), hipP = new Float32Array(n * 3);
        const wq = new Map();
        for (let f = 0; f < n; f++) {
          const t = Math.min(clip.duration, f / fps); times[f] = t;
          mixer.setTime(t); sRoot.updateMatrixWorld(true);
          wq.clear();
          dBones.forEach((b, i) => {
            const key = norm(b.name), s = sM[key];
            let qw;
            if (s && sRest[key]) {   // 원본이 쉬는 자세에서 돈 만큼(보는 방향 차이를 맞춰) 주인공 쉬는 자세에 곱한다
              const delta = relTRS(sRoot, s).q.multiply(sRest[key].q.clone().invert());
              qw = R.clone().multiply(delta).multiply(Ri).multiply(dRest.get(b).q);
            } else {
              const pq = wq.get(b.parent) || parentRestQ(b);
              qw = pq.clone().multiply(dRestLocal.get(b));
            }
            wq.set(b, qw);
            const pw = wq.get(b.parent) || parentRestQ(b);
            pw.clone().invert().multiply(qw).toArray(quats[i], f * 4);
          });
          if (sM.hips) {   // 믹사모 파일의 엉덩이 제자리 값은 믿을 수 없다 — 높이는 다리 길이 비율로, 옆 이동은 첫 프레임에서 움직인 만큼
            const hp = relTRS(sRoot, sM.hips).p;
            if (f === 0) h0.copy(hp);
            const d = new THREE.Vector3(hp.x - h0.x, 0, hp.z - h0.z).multiplyScalar(k).applyQuaternion(R);
            const r = dRest.get(dHips).p;
            _v.set(r.x + d.x, dGround + (hp.y / sLeg) * dLeg, r.z + d.z).applyMatrix4(hipParentInv).toArray(hipP, f * 3);
          }
        }
        act.stop();
        const tracks = [];
        dBones.forEach((b, i) => { if (sM[norm(b.name)]) tracks.push(new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', times, quats[i])); });
        tracks.push(new THREE.VectorKeyframeTrack(dHips.name + '.position', times, hipP));
        out[clip.name] = new THREE.AnimationClip(clip.name, clip.duration, tracks);
      }
      mixer.stopAllAction();
    }
    return out;
  };
  window.ACTS = AC;
})();
