/* omen.js — 물귀신의 징조. 모습은 안 보이고 흔적만 남긴다
 * 다가오는 발소리(물이면 물결 고리, 뭍이면 젖은 맨발 자국) · 떠내려오는 긴 머리카락 */
(function () {
  const W = window.WORLD;

  // 젖은 맨발 자국 — 발가락 다섯, 뒤꿈치, 물이 번진 가장자리
  function footTex() {
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 192;
    const c = cv.getContext('2d');
    const blob = (x, y, rx, ry, rot, a) => { c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(rx, ry); const g = c.createRadialGradient(0, 0, .15, 0, 0, 1); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.65, `rgba(255,255,255,${a * .8})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, 6.283); c.fill(); c.restore(); };
    // 번진 물기
    blob(48, 104, 40, 86, 0, .22);
    // 발바닥 — 앞볼·아치(안쪽이 비었다)·뒤꿈치
    blob(50, 78, 25, 26, -.08, .95);
    blob(58, 116, 15, 30, -.05, .8);
    blob(49, 156, 20, 23, 0, .95);
    // 발가락 — 엄지가 크고 새끼로 갈수록 작고 뒤로
    [[33, 40, 9, 11], [48, 34, 6, 7], [59, 36, 5.5, 6.5], [69, 41, 5, 6], [77, 49, 4.4, 5.2]].forEach(t => blob(t[0], t[1], t[2], t[3], 0, .95));
    // 물방울 몇 개
    for (let i = 0; i < 7; i++) blob(20 + Math.random() * 56, 20 + Math.random() * 160, 2 + Math.random() * 2.5, 2 + Math.random() * 2.5, 0, .7);
    return new THREE.CanvasTexture(cv);
  }
  // 물결 고리 — 안쪽이 밝고 바깥으로 풀린다
  function ringTex() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const c = cv.getContext('2d');
    for (const [r, w, a] of [[54, 7, .9], [40, 4, .45], [28, 3, .25]]) {
      const g = c.createRadialGradient(64, 64, r - w, 64, 64, r + w);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(64, 64, r + w, 0, 6.283); c.fill();
    }
    return new THREE.CanvasTexture(cv);
  }
  // 물에 퍼진 긴 머리카락 — 가운데 뭉치에서 물살 쪽으로 풀려 나간다
  function hairTex() {
    const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
    const c = cv.getContext('2d'); c.lineCap = 'round';
    const cx = S * .5, cy = S * .3;
    for (let i = 0; i < 520; i++) {
      const spread = (Math.random() - .5) * 1.9, len = S * (.35 + Math.random() * .42);
      const x0 = cx + (Math.random() - .5) * 40, y0 = cy + (Math.random() - .5) * 26;
      const w1 = (Math.random() - .5) * 90, w2 = (Math.random() - .5) * 120;
      const ex = x0 + Math.sin(spread) * len * .55, ey = y0 + Math.cos(spread * .6) * len;
      const shade = Math.random();
      c.strokeStyle = shade < .7 ? `rgba(10,9,11,${.45 + Math.random() * .5})` : `rgba(120,134,142,${.3 + Math.random() * .35})`;   // 몇 가닥은 젖어 번들거린다
      c.lineWidth = .6 + Math.random() * 1.6;
      c.beginPath(); c.moveTo(x0, y0);
      c.bezierCurveTo(x0 + w1, y0 + len * .33, ex + w2, y0 + len * .66, ex, ey);
      c.stroke();
    }
    // 뭉친 가운데 — 짙게
    const g = c.createRadialGradient(cx, cy, 4, cx, cy, 70); g.addColorStop(0, 'rgba(4,4,5,.95)'); g.addColorStop(1, 'rgba(4,4,5,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, 70, 46, 0, 0, 6.283); c.fill();
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  }

  const O = { steps: null, prints: [], rings: [], hair: null };
  O.build = function (scene) {
    const ft = footTex(), rt = ringTex();
    const pg = new THREE.PlaneGeometry(.17, .34); pg.rotateX(-Math.PI / 2);
    for (let i = 0; i < 18; i++) {
      // 젖은 자국은 땅보다 짙고, 등불을 받으면 번들거린다
      const m = new THREE.MeshPhongMaterial({ color: 0x0c0f10, specular: 0x55646a, shininess: 70, alphaMap: ft, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
      const s = new THREE.Mesh(pg, m); s.visible = false; s.renderOrder = 2; scene.add(s); O.prints.push({ s, t: -1 });
    }
    const rg = new THREE.PlaneGeometry(1, 1); rg.rotateX(-Math.PI / 2);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.MeshBasicMaterial({ color: 0xb8c8cc, alphaMap: rt, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Mesh(rg, m); s.visible = false; s.renderOrder = 4; scene.add(s); O.rings.push({ s, t: -1 });
    }
    // 떠내려오는 머리카락 — 가운데 엉킨 뭉치에서 가닥 띠가 사방으로 풀려 물 위에 퍼진다(평면 한 장은 "종이장 같다")
    const HR = window.HAIR, out = HR.begin(); let sd = 5501; const rn = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    for (let k = 0; k < 22; k++) {   // 엉킨 뭉치 — 가운데를 가로지르는 짧은 가닥들(고리만 두면 가운데가 뚫린다)
      const a0 = rn() * 6.283, L = .18 + rn() * .16, pts = [];
      for (let j = 0; j <= 6; j++) { const f = j / 6, a = a0 + Math.sin(f * 4 + k) * .9; pts.push(new THREE.Vector3(Math.sin(a0) * (f - .5) * L * 2 + Math.cos(a) * .03, .02 + k * .0015, Math.cos(a0) * (f - .5) * L * 2 + Math.sin(a) * .03)); }
      HR.card(out, pts, () => .07, null, rn() * 6);
    }
    for (let k = 0; k < 52; k++) {   // 풀려 나간 가닥 — 흘러가는 뒤쪽(+z)으로 길게 끌린다. 앞쪽으로는 짧게 몇 가닥
      const back = k % 5 !== 0, a0 = back ? (rn() - .5) * 2.4 : Math.PI + (rn() - .5) * 2.6, L = back ? 1.0 + rn() * 1.7 : .3 + rn() * .4, pts = [];
      for (let j = 0; j <= 9; j++) { const f = j / 9, a = a0 * (1 - f * .25) + Math.sin(f * 3.2 + k) * .16, rr = .06 + f * L; pts.push(new THREE.Vector3(Math.sin(a) * rr, .004 + (k % 5) * .003, Math.cos(a) * rr)); }
      HR.card(out, pts, HR.fan(.05, .08 + rn() * .06), null, rn() * 6);
    }
    const hm = HR.mat({ amp: .05, fade: true }); hm.opacity = 0; hm.specular.setHex(0x14181a);
    const h = new THREE.Mesh(HR.end(out), hm); h.visible = false; h.renderOrder = 4; scene.add(h);
    O.hair = { s: h, t: -1, x: 0, z: 0, rot: 0 };
  };

  // 누군가 보이지 않게 걸어온다 — from(x,z) 에서 대상 쪽으로. onStep(x,z,wet) 은 발 디딜 때마다
  O.walk = function (x, z, target, onStep, onStop) {
    O.steps = { x, z, target, onStep, onStop, next: 0, n: 0, side: 1 };
  };
  O.walking = () => !!O.steps;
  function stamp(x, z, yaw, side, t) {
    const land = W.groundH(x, z) > W.height(x, z, t) + .03;
    if (land) {
      const p = O.prints.find(p => p.t < 0) || O.prints.reduce((a, b) => a.t > b.t ? a : b);
      const ox = Math.cos(yaw) * .11 * side, oz = -Math.sin(yaw) * .11 * side;
      p.t = 0; p.s.visible = true; p.s.position.set(x + ox, W.groundH(x + ox, z + oz) + .025, z + oz);
      p.s.rotation.set(0, yaw, 0); p.s.scale.set(side, 1, 1);
    } else {
      const r = O.rings.find(r => r.t < 0) || O.rings[0];
      r.t = 0; r.s.visible = true; r.s.position.set(x, 0, z);
    }
    return land;
  }

  // 물 위에 긴 머리카락이 떠내려온다
  O.drift = function (x, z) { const h = O.hair; h.t = 0; h.x = x; h.z = z; h.rot = Math.random() * 6.283; h.s.visible = true; };
  O.hairNear = function (px, pz) { const h = O.hair; return h.t >= 0 ? Math.hypot(px - h.x, pz - h.z) : 99; };

  O.clear = function () {
    O.steps = null;
    for (const p of O.prints) { p.t = -1; p.s.visible = false; }
    for (const r of O.rings) { r.t = -1; r.s.visible = false; }
    O.hair.t = -1; O.hair.s.visible = false;
  };

  O.update = function (dt, t) {
    const st = O.steps;
    if (st) {
      st.next -= dt;
      if (st.next <= 0) {
        const tg = st.target(), dx = tg.x - st.x, dz = tg.z - st.z, d = Math.hypot(dx, dz);
        if (d < 2.4 || st.n > 12) { O.steps = null; if (st.onStop) st.onStop(); }
        else {
          const step = Math.min(1.25, d - 2.2), yaw = Math.atan2(dx, dz);
          st.x += dx / d * step; st.z += dz / d * step; st.side = -st.side; st.n++;
          const land = stamp(st.x, st.z, yaw, st.side, t);
          st.next = .62 - Math.min(.2, st.n * .02);   // 갈수록 발걸음이 빨라진다
          if (st.onStep) st.onStep(st.x, st.z, land);
        }
      }
    }
    for (const p of O.prints) {
      if (p.t < 0) continue; p.t += dt;
      p.s.material.opacity = Math.min(1, p.t * 3) * (p.t > 16 ? Math.max(0, 1 - (p.t - 16) / 5) : 1) * .92;
      if (p.t > 21) { p.t = -1; p.s.visible = false; }
    }
    for (const r of O.rings) {
      if (r.t < 0) continue; r.t += dt;
      const k = r.t / 1.5;
      r.s.position.y = W.height(r.s.position.x, r.s.position.z, t) + .03;
      r.s.scale.setScalar(.25 + k * 1.9); r.s.material.opacity = Math.max(0, 1 - k) * .55;
      if (k >= 1) { r.t = -1; r.s.visible = false; }
    }
    window.HAIR.tick(t);
    const h = O.hair;
    if (h.t >= 0) {
      h.t += dt;
      const f = W.flow(h.x, h.z);
      h.x += f.x * dt * .8; h.z += (Math.min(0, f.z) * .6 - .75) * dt;   // 물살이 없어도 아래로 흘러온다
      h.rot += dt * .12;
      h.s.position.set(h.x, W.height(h.x, h.z, t) + .05, h.z);   /* 물 셰이더 물결이 가닥을 자르지 않게 살짝 띄운다 */
      h.s.rotation.y = Math.sin(h.rot * 2) * .5;   // 뭉치는 아래(-z)로 흘러가고 가닥은 뒤(+z)로 끌린다
      const sc = 1 + Math.sin(t * .9) * .05; h.s.scale.set(sc, 1, 1 / sc);   // 물결에 풀렸다 모였다
      h.s.material.opacity = Math.min(1, h.t * .8) * (h.t > 13 ? Math.max(0, 1 - (h.t - 13) / 3) : 1);
      if (h.t > 16 || W.groundH(h.x, h.z) > W.height(h.x, h.z, t)) { h.t = -1; h.s.visible = false; }
    }
  };
  window.OMEN = O;
})();
