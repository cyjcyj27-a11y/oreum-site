/* hair.js — 젖은 긴 머리카락. 가닥 수십 개를 그린 얇은 띠(머리카락 카드)를 곡선을 따라 휘어 겹친다.
 * 관(Tube)·평면 한 장으로 그렸더니 "머리카락 같지 않다, 종이장 같다"(2026-09-16 사장님).
 * 띠 끝으로 갈수록 물결에 하늘거린다(정점 셰이더). 한 무더기는 도형 하나로 합쳐 그리기 한 번. */
(function () {
  const H = {};
  let _tex = null;
  // 가닥 그림 — 가로는 띠 폭, 세로는 뿌리(위)→끝(아래). 가닥마다 길이가 달라 끝이 갈라진다
  H.tex = function () {
    if (_tex) return _tex;
    const Wd = 128, Ht = 1024, cv = document.createElement('canvas'); cv.width = Wd; cv.height = Ht;
    const c = cv.getContext('2d'); c.lineCap = 'round';
    let sd = 9127; const rn = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) {   // 가닥 사이가 비어야 한 올 한 올로 보인다
      const x0 = 8 + rn() * (Wd - 16), len = Ht * (.5 + rn() * .5), st = rn() * .06, wv = 3 + rn() * 9, fr = 1 + rn() * 2.5, ph = rn() * 6.28, a = .55 + rn() * .45;
      c.lineWidth = 1.1 + rn() * 1.6;
      const segs = 40;
      for (let s = 0; s < segs; s++) {   // 조각마다 투명도를 줄여 끝이 가늘게 사라진다
        const f0 = s / segs, f1 = (s + 1) / segs;
        const X = f => x0 + Math.sin(f * fr * 6.28 + ph) * wv * (0.3 + f) + (f * f) * (rn() - .5) * 2;
        c.strokeStyle = 'rgba(255,255,255,' + (a * Math.min(1, (1 - f0) * 1.8) * Math.min(1, f0 * 14 + rn() * .3)).toFixed(3) + ')';
        c.beginPath(); c.moveTo(X(f0), f0 * len); c.lineTo(X(f1), f1 * len); c.stroke();
      }
    }
    _tex = new THREE.CanvasTexture(cv); _tex.wrapS = THREE.ClampToEdgeWrapping; _tex.anisotropy = 4;
    return _tex;
  };

  // 공용 물결 시간
  const U = { uTime: { value: 0 } };
  H.tick = t => { U.uTime.value = t; };

  // 재질 — 짙은 흑갈색, 젖어 번들거림. amp 는 끝이 흔들리는 폭(m)
  H.mat = function (opt) {
    opt = opt || {};
    const m = new THREE.MeshPhongMaterial({
      color: opt.color || 0x080706, specular: 0x181c1e, shininess: 30, alphaMap: H.tex(), side: THREE.DoubleSide,
      transparent: !!opt.fade, alphaTest: opt.fade ? .04 : .5, depthWrite: !opt.fade, opacity: 1,
    });
    if (!opt.fade) m.alphaToCoverage = true;   // 다중표본으로 가닥 가장자리를 부드럽게
    const amp = opt.amp == null ? .04 : opt.amp;
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = 'uniform float uTime;\nattribute float along;\nattribute float hph;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\n  float w = along * along;\n  transformed.x += sin(uTime * 1.3 + along * 7.0 + hph) * ' + amp.toFixed(3) + ' * w;\n  transformed.z += cos(uTime * 1.05 + along * 5.5 + hph * 1.7) * ' + amp.toFixed(3) + ' * w;\n  transformed.y += sin(uTime * 1.7 + along * 9.0 + hph) * ' + (amp * .25).toFixed(3) + ' * w;');
    };
    m.customProgramCacheKey = () => 'hair' + amp.toFixed(3) + (opt.fade ? 'f' : '');
    return m;
  };

  // 띠 하나 — pts: 뿌리→끝 점들, width(f): 폭, nrm(f,p): 띠가 눕는 면의 법선(없으면 위쪽)
  const _t = new THREE.Vector3(), _s = new THREE.Vector3(), _n = new THREE.Vector3();
  H.card = function (out, pts, width, nrm, ph) {
    const curve = new THREE.CatmullRomCurve3(pts), N = 24, u0 = Math.random() * .0;   // 가닥 그림은 띠마다 같아도 곡선이 달라 티가 안 난다
    const base = out.pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const f = i / N, p = curve.getPoint(f); curve.getTangent(f, _t);
      if (nrm) nrm(f, p, _n); else _n.set(0, 1, 0);
      _s.crossVectors(_t, _n); if (_s.lengthSq() < 1e-6) _s.set(1, 0, 0); _s.normalize();
      const w = width(f) / 2;
      out.pos.push(p.x - _s.x * w, p.y - _s.y * w, p.z - _s.z * w, p.x + _s.x * w, p.y + _s.y * w, p.z + _s.z * w);
      out.uv.push(0 + u0, 1 - f, 1 + u0, 1 - f);
      out.al.push(f, f); out.ph.push(ph, ph);
      if (i < N) { const a = base + i * 2; out.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
  };
  H.begin = () => ({ pos: [], uv: [], al: [], ph: [], idx: [] });
  H.end = function (out) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
    g.setAttribute('along', new THREE.Float32BufferAttribute(out.al, 1));
    g.setAttribute('hph', new THREE.Float32BufferAttribute(out.ph, 1));
    g.setIndex(out.idx); g.computeVertexNormals();
    return g;
  };
  // 폭 모양 — 뿌리는 좁게 모였다가 가운데서 퍼지고 끝은 그림의 가닥이 알아서 갈라진다
  H.fan = (w0, w1) => f => w0 + (w1 - w0) * Math.sin(Math.min(1, f * 1.4) * Math.PI / 2);

  window.HAIR = H;
})();
