// 움직임과 효과: 트윈, 말랑 출렁임(스프링), 알갱이·김·반짝이·고리, 화면 글(PERFECT·+코인).
(function () {
  const F = (window.FX = {});
  const TW = [];
  const E = (F.ease = {
    lin: (t) => t,
    out: (t) => 1 - (1 - t) * (1 - t),
    out3: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    in: (t) => t * t,
    back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
  });
  // F.tw(시간, (u)=>{}, 끝, 쉬움, 늦춤)
  F.tw = function (dur, upd, done, ease, delay) {
    const o = { t: -(delay || 0), dur: Math.max(0.001, dur), upd, done, ease: ease || E.out, dead: false };
    TW.push(o); return o;
  };
  // 물체를 a→b 로 포물선 점프
  F.hop = function (obj, to, dur, h, done, ease) {
    const from = obj.position.clone();
    return F.tw(dur, (u) => { obj.position.lerpVectors(from, to, u); obj.position.y += Math.sin(u * Math.PI) * (h == null ? 1 : h); }, () => { if (done) done(); }, ease || E.lin);
  };
  F.to = function (obj, to, dur, done, ease, delay) {
    const from = obj.position.clone();
    return F.tw(dur, (u) => obj.position.lerpVectors(from, to, u), done, ease, delay);
  };
  F.wait = (s, f) => F.tw(s, () => {}, f, E.lin);

  // ---------- 말랑 출렁임 ----------
  // 출렁임은 지금 크기 위에 곱해진다. 그사이 다른 움직임(크기 트윈)이 크기를 바꾸면 그 크기를 새 바탕으로 삼는다.
  const SQ = new Set();
  F.squash = function (obj, amt) {
    const s = obj.userData.sq || (obj.userData.sq = { x: 0, v: 0, raw: obj.scale.clone(), applied: null });
    if (!SQ.has(obj)) { s.raw.copy(obj.scale); s.applied = null; s.x = 0; s.v = 0; }
    s.v += amt * 14; SQ.add(obj);
  };
  function stepSquash(dt) {
    SQ.forEach((o) => {
      const s = o.userData.sq;
      if (!s.applied || !o.scale.equals(s.applied)) s.raw.copy(o.scale);
      s.v += (-s.x * 260 - s.v * 13) * dt; s.x += s.v * dt;
      const k = Math.max(-0.6, Math.min(0.6, s.x));
      if (Math.abs(s.x) < 0.001 && Math.abs(s.v) < 0.01) { o.scale.copy(s.raw); SQ.delete(o); return; }
      o.scale.set(s.raw.x * (1 + k * 0.6), s.raw.y * (1 - k), s.raw.z * (1 + k * 0.6));
      s.applied = (s.applied || new THREE.Vector3()).copy(o.scale);
    });
  }
  F.setBase = function (obj) { const s = obj.userData.sq; if (s) { s.raw.copy(obj.scale); s.applied = null; } };

  // ---------- 알갱이 ----------
  const P = [];
  const geos = {};
  function geo(k) {
    if (geos[k]) return geos[k];
    if (k === 'ball') geos[k] = new THREE.SphereGeometry(0.5, 10, 8);
    else if (k === 'cube') geos[k] = TOY.rbox(1, 1, 1, 0.25, 1);
    else if (k === 'star') {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.22 : 0.5, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      geos[k] = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 }); geos[k].center();
    } else if (k === 'heart') {
      const s = new THREE.Shape(); s.moveTo(0, -0.45); s.bezierCurveTo(-0.9, 0.1, -0.35, 0.75, 0, 0.3); s.bezierCurveTo(0.35, 0.75, 0.9, 0.1, 0, -0.45);
      geos[k] = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 }); geos[k].center();
    } else if (k === 'ring') geos[k] = new THREE.RingGeometry(0.42, 0.5, 40);
    else if (k === 'confetti') geos[k] = new THREE.PlaneGeometry(1, 0.6);
    return geos[k];
  }
  // o: {n, kind, color(s), size, speed, up, g, life, spread, spin, glow, puff}
  F.burst = function (pos, o) {
    o = o || {};
    const n = o.n || 12, cols = Array.isArray(o.color) ? o.color : [o.color || '#ffffff'];
    for (let i = 0; i < n; i++) {
      const c = cols[i % cols.length];
      const mat = o.glow ? TOY.basic(c) : TOY.mat(c, { rough: 0.5, emis: 0.25, side: o.kind === 'confetti' });
      const m = new THREE.Mesh(geo(o.kind || 'ball'), mat);
      const sz = (o.size || 0.12) * (0.7 + Math.random() * 0.6);
      m.scale.setScalar(sz);
      m.position.copy(pos);
      if (o.spread) m.position.add(new THREE.Vector3((Math.random() - 0.5) * o.spread, 0, (Math.random() - 0.5) * o.spread));
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      m.castShadow = !!o.shadow;
      RND.scene.add(m);
      const a = Math.random() * Math.PI * 2, sp = (o.speed || 3) * (0.5 + Math.random() * 0.7);
      const v = new THREE.Vector3(Math.cos(a) * sp, (o.up == null ? 3 : o.up) * (0.6 + Math.random() * 0.7), Math.sin(a) * sp);
      if (o.dir) v.add(o.dir);
      P.push({ m, v, t: 0, life: (o.life || 0.9) * (0.75 + Math.random() * 0.5), g: o.g == null ? 12 : o.g, s0: sz, spin: o.spin == null ? 6 : o.spin, puff: o.puff, drag: o.drag || 0, floor: o.floor });
    }
  };
  // 김·먼지: 하얀 공이 커지며 흐려짐
  F.puff = function (pos, o) {
    o = o || {};
    const n = o.n || 6;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo('ball'), new THREE.MeshStandardMaterial({ color: o.color || '#ffffff', roughness: 1, transparent: true, opacity: o.op || 0.85, depthWrite: false }));
      const sz = (o.size || 0.3) * (0.6 + Math.random() * 0.8);
      m.scale.setScalar(sz); m.position.copy(pos);
      m.position.x += (Math.random() - 0.5) * (o.spread || 0.4); m.position.z += (Math.random() - 0.5) * (o.spread || 0.4);
      RND.scene.add(m);
      const a = Math.random() * Math.PI * 2, sp = o.speed == null ? 1.2 : o.speed;
      P.push({ m, v: new THREE.Vector3(Math.cos(a) * sp, o.up == null ? 1.2 : o.up, Math.sin(a) * sp), t: 0, life: (o.life || 1.1) * (0.7 + Math.random() * 0.6), g: 0, s0: sz, grow: o.grow || 2.2, fade: true, spin: 0, drag: 2.5, op0: o.op || 0.85 });
    }
  };
  // 바닥에 퍼지는 고리
  F.ring = function (pos, o) {
    o = o || {};
    const m = new THREE.Mesh(geo('ring'), new THREE.MeshBasicMaterial({ color: o.color || '#ffffff', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.copy(pos); m.renderOrder = 3;
    RND.scene.add(m);
    P.push({ m, ring: true, t: 0, life: o.life || 0.5, s0: o.size || 0.5, s1: o.to || 2.4 });
  };

  function stepParts(dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt;
      const u = p.t / p.life;
      if (p.ring) {
        const s = p.s0 + (p.s1 - p.s0) * E.out(Math.min(1, u)); p.m.scale.setScalar(s); p.m.material.opacity = 0.9 * (1 - u);
      } else {
        if (p.drag) p.v.multiplyScalar(Math.max(0, 1 - p.drag * dt));
        p.v.y -= p.g * dt;
        p.m.position.addScaledVector(p.v, dt);
        if (p.floor != null && p.m.position.y < p.floor) { p.m.position.y = p.floor; p.v.y = Math.abs(p.v.y) * 0.35; p.v.x *= 0.6; p.v.z *= 0.6; }
        p.m.rotation.x += p.spin * dt; p.m.rotation.y += p.spin * 0.7 * dt;
        if (p.fade) { p.m.scale.setScalar(p.s0 * (1 + p.grow * u)); p.m.material.opacity = p.op0 * (1 - u); }
        else p.m.scale.setScalar(p.s0 * (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3));
      }
      if (u >= 1) { RND.scene.remove(p.m); if (p.fade || p.ring) p.m.material.dispose(); P.splice(i, 1); }
    }
  }

  // ---------- 화면 글 ----------
  const layer = document.getElementById('fxl');
  // 3D 자리 위에 글이 튀어 오른다(PERFECT, +1,200 등)
  F.text = function (pos, txt, cls, dy) {
    if (!layer) return;
    const s = RND.toScreen(pos);
    const el = document.createElement('div');
    el.className = 'pop ' + (cls || '');
    el.textContent = txt;
    el.style.left = s.x + 'px'; el.style.top = (s.y + (dy || 0)) + 'px';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1300);
    return el;
  };
  // 코인이 상단바 코인 칸으로 날아간다
  F.coins = function (pos, n, done) {
    const tgt = document.getElementById('sCoin');
    if (!layer || !tgt) { if (done) done(); return; }
    const s = RND.toScreen(pos), r = tgt.getBoundingClientRect();
    const k = Math.min(10, Math.max(3, n));
    for (let i = 0; i < k; i++) {
      const el = document.createElement('i'); el.className = 'fcoin'; layer.appendChild(el);
      const x0 = s.x + (Math.random() - 0.5) * 60, y0 = s.y + (Math.random() - 0.5) * 30;
      const x1 = r.left + 20, y1 = r.top + r.height / 2;
      const d = 0.55 + i * 0.05;
      F.tw(d, (u) => {
        const e = E.inOut(u);
        el.style.transform = `translate(${x0 + (x1 - x0) * e}px,${y0 + (y1 - y0) * e - Math.sin(u * Math.PI) * 120}px) scale(${1 - u * 0.4})`;
      }, () => { el.remove(); if (i === k - 1 && done) done(); if (window.SND) SND.coin(); }, E.lin, i * 0.04);
    }
  };

  F.step = function (dt) {
    for (let i = TW.length - 1; i >= 0; i--) {
      const o = TW[i];
      if (o.dead) { TW.splice(i, 1); continue; }
      o.t += dt;
      if (o.t < 0) continue;
      const u = Math.min(1, o.t / o.dur);
      o.upd(o.ease(u));
      if (u >= 1) { TW.splice(i, 1); if (o.done) o.done(); }
    }
    stepSquash(dt);
    stepParts(dt);
  };
  F.clear = function () { TW.length = 0; };
})();
