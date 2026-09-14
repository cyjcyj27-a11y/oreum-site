// anim.js — 인물 GLB(주인공·동료) 불러오기, 패거리 옷색 칠하기, 인물 만들기, 동작 박자 재기
(function () {
  const A = { ready: false, models: {}, variants: {} };
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const WANT = ['Hips', 'Spine', 'Spine2', 'Neck', 'Head', 'LeftHand', 'RightHand', 'LeftFoot', 'RightFoot', 'LeftToeBase', 'RightToeBase', 'LeftUpLeg', 'LeftLeg'];

  function mapBones(root) {
    const want = {}, map = {};
    WANT.forEach(w => want[norm('mixamorig' + w)] = w);
    root.traverse(o => { const k = want[norm(o.name)]; if (k && !map[k]) map[k] = o; });
    return map;
  }

  // 다리 길이(엉덩이→허벅지→무릎→발) ÷ 엉덩이 부모 배율 = 엉덩이 트랙 단위의 서 있는 높이
  function legLen(root) {
    const bm = mapBones(root);
    if (!bm.Hips || !bm.LeftUpLeg || !bm.LeftLeg || !bm.LeftFoot) return 1;
    root.updateWorldMatrix(true, true);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), ch = [bm.Hips, bm.LeftUpLeg, bm.LeftLeg, bm.LeftFoot];
    let s = 0;
    for (let i = 0; i < 3; i++) { ch[i].getWorldPosition(a); ch[i + 1].getWorldPosition(b); s += a.distanceTo(b); }
    const ps = bm.Hips.parent ? Math.abs(bm.Hips.parent.getWorldScale(new THREE.Vector3()).y) : 1;
    return (s / (ps || 1)) || 1;
  }

  async function loadOne(name, url, onProg) {
    const L = new window.GLTFLoaderClass();
    const g = await L.loadAsync(url, e => { if (e.total && onProg) onProg(e.loaded / e.total); });
    const M = { src: g.scene, clips: {}, info: {}, baseMap: null };
    M.src.traverse(o => {
      if (o.isSkinnedMesh) {
        o.castShadow = true; o.receiveShadow = false; o.frustumCulled = false;
        const m = o.material; m.color.setScalar(1); m.metalness = 0; m.roughness = 0.82;
        if (m.map) { m.map.anisotropy = 4; M.baseMap = m.map; }
      }
    });
    for (const c of g.animations) {
      // 엉덩이 앞뒤·옆 이동을 지운다 — 몸은 코드가 옮긴다
      for (const tr of c.tracks) {
        if (/Hips\.position$/.test(tr.name)) {
          const v = tr.values;
          for (let i = 0; i < v.length; i += 3) { v[i] = 0; v[i + 2] = 0; }
        }
      }
      M.clips[c.name] = c;
    }
    A.models[name] = M;
    return M;
  }

  async function load(onProg) {
    const list = [['hero', 0.3], ['girl', 0.3], ['rgirl', 0.2], ['rboy', 0.2]];
    let base = 0;
    for (const [name, w] of list) {
      const b = base;
      await loadOne(name, 'assets/models/' + name + '.glb?v=' + window.__V, p => onProg && onProg(b + p * w));
      base += w;
    }
    // 추가 동작: 뼈대만 든 GLB 에서 모델마다 엉덩이 높이를 다리 길이 비율로 맞춰 붙인다
    //   extra.glb = 점프, dance.glb = 엔딩 춤(에리 뼈대), dance_h.glb = 같은 춤(히로미 뼈대) — 춤은 엉덩이 좌우 흔들림을 살린다
    for (const file of ['extra', 'dance', 'dance_h']) {
      try {
        const ex = await new window.GLTFLoaderClass().loadAsync('assets/models/' + file + '.glb?v=' + window.__V);
        const exLeg = legLen(ex.scene);
        for (const name in A.models) {
          const M = A.models[name];
          const have = new Set(); M.src.traverse(o => have.add(o.name));
          const k = legLen(M.src) / exLeg;
          for (const c0 of ex.animations) {
            const c = c0.clone();
            c.tracks = c.tracks.filter(t => have.has(t.name.split('.')[0]));
            const sway = /^dance/.test(c.name);
            for (const tr of c.tracks) if (/Hips\.position$/.test(tr.name)) {
              const v = tr.values, x0 = v[0], z0 = v[2];
              for (let i = 0; i < v.length; i += 3) { v[i] = sway ? (v[i] - x0) * k : 0; v[i + 1] *= k; v[i + 2] = sway ? (v[i + 2] - z0) * k : 0; }
            }
            M.clips[c.name] = c;
          }
        }
      } catch (e) { console.warn(file + '.glb', e); }
    }
    A.baseMap = A.models.hero.baseMap;
    A.ready = true;
    return A;
  }

  // ── 옷·머리 색 바꾸기 (모델 텍스처를 캔버스에서 다시 칠한다) ──
  //   검고 빛깔 없는 곳 = 옷(maxSat 아래만), 금발 빛깔 = 머리(hair 가 있을 때만)
  function recolor(key, coat, hair, model, maxSat) {
    if (A.variants[key]) return A.variants[key];
    const baseMap = A.models[model || 'hero'].baseMap;
    const satCap = maxSat == null ? 0.55 : maxSat;
    const img = baseMap.image;
    const S = 1024;
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0, S, S);
    const d = g.getImageData(0, 0, S, S), p = d.data;
    const light = coat[0] + coat[1] + coat[2] > 500;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], gg = p[i + 1], b = p[i + 2];
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      const v = mx / 255, s = mx ? (mx - mn) / mx : 0;
      if (v < 0.34 && s < satCap) {
        // 검은 학생복
        const k = v / 0.34;
        const f = light ? 0.58 + 0.42 * k : 0.28 + 0.72 * k;
        p[i] = coat[0] * f; p[i + 1] = coat[1] * f; p[i + 2] = coat[2] * f;
      } else if (hair && s > 0.44 && v > 0.3) {
        let h = 0;
        if (mx === r) h = ((gg - b) / (mx - mn)) * 60; else if (mx === gg) h = (2 + (b - r) / (mx - mn)) * 60; else h = (4 + (r - gg) / (mx - mn)) * 60;
        if (h < 0) h += 360;
        if (h > 18 && h < 52) {
          const k = Math.min(1.15, v / 0.8);
          p[i] = Math.min(255, hair[0] * k); p[i + 1] = Math.min(255, hair[1] * k); p[i + 2] = Math.min(255, hair[2] * k);
        }
      }
    }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.flipY = baseMap.flipY; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    A.variants[key] = t;
    return t;
  }

  // ── 인물 하나 ──
  function make(scene, opt) {
    opt = opt || {};
    const M = A.models[opt.model || 'hero'];
    const root = window.SkeletonClone(M.src);
    const holder = new THREE.Group();
    holder.add(root);
    root.scale.setScalar(opt.scale || 1);
    scene.add(holder);
    let mesh = null;
    root.traverse(o => { if (o.isSkinnedMesh) mesh = o; });
    const mat = mesh.material.clone();
    if (opt.map) mat.map = opt.map;
    mat.emissive = new THREE.Color(0, 0, 0);
    mesh.material = mat;
    mesh.castShadow = true;

    const mixer = new THREE.AnimationMixer(root);
    const acts = {};
    for (const k in M.clips) acts[k] = mixer.clipAction(M.clips[k]);
    const bones = mapBones(root);

    const ch = {
      holder, root, mesh, mat, mixer, acts, bones, cur: null, info: M.info, model: opt.model || 'hero',
      play(name, fade, o) {
        o = o || {};
        const a = acts[name]; if (!a) return null;
        if (this.cur === name && !o.force) { if (o.speed) a.setEffectiveTimeScale(o.speed); return a; }
        const f = fade == null ? 0.15 : fade;
        const prev = acts[this.cur];
        if (prev && prev !== a) prev.fadeOut(f);
        a.reset(); a.enabled = true; a.setEffectiveWeight(1);
        a.setEffectiveTimeScale(o.speed || 1);
        a.setLoop(o.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
        a.clampWhenFinished = !!o.once;
        if (f > 0) a.fadeIn(f);
        a.play();
        if (o.at) a.time = o.at;
        this.cur = name;
        return a;
      },
      speed(v) { const a = acts[this.cur]; if (a) a.setEffectiveTimeScale(v); },
      update(dt) { mixer.update(dt); },
      dispose() { scene.remove(holder); mixer.stopAllAction(); mat.dispose(); },
    };
    return ch;
  }

  // ── 동작 박자 재기: 주먹·발이 가장 멀리 나간 순간, 쓰러지고 일어서는 순간 ──
  function measure(scene, model) {
    const M = A.models[model];
    const ch = make(scene, { model });
    const h = ch.holder, B = ch.bones;
    const v = new THREE.Vector3();
    const sample = (name, n, fn) => {
      const c = M.clips[name]; if (!c) return;
      ch.mixer.stopAllAction();
      const a = ch.acts[name]; a.reset(); a.setEffectiveWeight(1); a.play();
      for (let i = 0; i <= n; i++) {
        const t = c.duration * i / n;
        a.time = t; ch.mixer.update(0);
        h.updateMatrixWorld(true);
        fn(t, i);
      }
      a.stop();
    };
    let hipStand = 1;
    sample('idle', 4, () => { B.Hips.getWorldPosition(v); hipStand = v.y; });
    M.info.hipStand = hipStand;
    for (const k of ['jab', 'cross', 'hook', 'kick', 'dropkick']) {
      let best = -1e9, bt = 0, by = 1;
      sample(k, 90, t => {
        for (const e of ['LeftHand', 'RightHand', 'LeftFoot', 'RightFoot']) {
          B[e].getWorldPosition(v);
          if (v.z > best) { best = v.z; bt = t; by = v.y; }
        }
      });
      M.info[k] = { hit: bt, reach: best, y: by, dur: M.clips[k].duration };
    }
    for (const k of ['fallback', 'knockout']) {
      let lie = M.clips[k].duration;
      sample(k, 90, t => { B.Hips.getWorldPosition(v); if (v.y < hipStand * 0.35 && t < lie) lie = t; });
      M.info[k] = { lie, dur: M.clips[k].duration };
    }
    {
      // 누워 있는 앞부분은 건너뛴다: 엉덩이가 들리기 시작하는 순간부터, 거의 선 순간까지
      let rise = 0, up = M.clips.getup.duration, lowY = 1e9;
      const ys = [];
      sample('getup', 120, t => { B.Hips.getWorldPosition(v); ys.push([t, v.y]); lowY = Math.min(lowY, v.y); });
      for (const [t, y] of ys) if (y < lowY + hipStand * 0.04) rise = t;
      for (const [t, y] of ys) if (t > rise && y > hipStand * 0.84) { up = t; break; }
      M.info.getup = { rise: Math.max(0, rise - 0.2), up, dur: M.clips.getup.duration };
    }
    if (M.clips.jump) {
      // 발이 땅을 떠나는 순간과 다시 닿는 순간
      const ys = [];
      sample('jump', 120, t => {
        B.LeftToeBase.getWorldPosition(v); let y = v.y;
        B.RightToeBase.getWorldPosition(v); y = Math.min(y, v.y);
        ys.push([t, y]);
      });
      const g0 = ys[0][1];
      let off = 0, land = M.clips.jump.duration;
      for (const [t, y] of ys) if (y > g0 + 0.08) { off = t; break; }
      for (const [t, y] of ys) if (t > off + 0.15 && y < g0 + 0.05) { land = t; break; }
      M.info.jump = { off, land, dur: M.clips.jump.duration };
    }
    ch.dispose();
    return M.info;
  }

  A.load = load; A.make = make; A.recolor = recolor; A.measure = measure; A.mapBones = mapBones;
  window.ANIM = A;
})();
