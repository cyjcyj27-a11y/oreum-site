/* ghost.js — 물귀신: 멀리 물속에 선 형체, 덮칠 때 솟아오르는 몸, 수면 위로 올라오는 창백한 손
 * 몸은 사장님이 구워 온 3D 모델(assets/ghost.glb, 믹사모 리깅)이다. 사진 판은 2026-09-16 에 걷어냈다.
 * 나타날 때마다 동작이 달라진다 — 한 바퀴 다 쓰기 전엔 같은 동작이 두 번 나오지 않는다(섞은 주머니). */
(function () {
  const W = window.WORLD;
  const pale = new THREE.MeshLambertMaterial({ color: 0xb8c6c2, emissive: 0x647872 });

  function makeHand(scale) {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.BoxGeometry(.11, .05, .13), pale); g.add(palm);
    for (let i = 0; i < 5; i++) {
      const f = new THREE.Group(); const len = i === 0 ? .08 : .1 + Math.sin(i) * .02;
      f.position.set(-.045 + i * .0225, 0, i === 0 ? .01 : .065); if (i === 0) f.position.x = -.07;
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(.011, len, 3, 5), pale); m.position.set(0, 0, len / 2); m.rotation.x = Math.PI / 2; f.add(m);
      f.rotation.x = -.5 - Math.random() * .8; if (i === 0) f.rotation.y = .8;
      g.add(f); f.userData.base = f.rotation.x;
    }
    // 팔뚝 — 아래로 길게 물속으로
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.035, .05, 1.6, 7), pale); arm.position.y = -.82; g.add(arm); g.userData.arm = arm;
    g.scale.setScalar(scale || 1); g.rotation.x = -Math.PI / 2 * .35; // 손바닥이 위를 향해 벌어짐
    return g;
  }

  // ── 물귀신 본체 — 리깅된 3D 모델 ──
  // 나타나는 동작 — 좀비팩(2026-09-16 사장님 "엎드려 총 잡은 자세 빼고 좀비팩 써").
  // 파일에 든 클립: turn·jerk·drag(덮칠 때)·scream·zidle·zwalk·zrun·attack(코앞에 솟을 때)·zcrawl·bite. 옛 crawl(Prone)·rush·contort 는 뺐다
  const SHOW = ['scream', 'zcrawl', 'zwalk', 'zidle', 'turn', 'jerk'];
  const MODEL_H = 1.9;                 // 구워 온 모델 키
  const IMG = { face: .10 };           // 얼굴 중심이 위에서 10%
  const uTime = { value: 0 };
  let _buf = null, _bag = [];

  function ghostBuf() { return _buf || (_buf = W.glbBuf('assets/ghost.glb?v=2')); }   // file:// 에서도 읽힌다
  let _last = '';
  function nextClip() {   // 섞은 주머니 — 다섯을 다 쓸 때까지 같은 게 안 나온다
    if (!_bag.length) {
      _bag = SHOW.slice();
      for (let i = _bag.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; const t = _bag[i]; _bag[i] = _bag[j]; _bag[j] = t; }
      if (_bag[_bag.length - 1] === _last) { const t = _bag[0]; _bag[0] = _bag[_bag.length - 1]; _bag[_bag.length - 1] = t; }   // 주머니가 바뀌는 자리에서도 겹치지 않게
    }
    return (_last = _bag.pop());
  }

  // 찢어짐·번쩍임·풀려남 — 사진 판에 쓰던 셰이더를 모델에 그대로 옮겼다.
  // 판이 아니라 몸이라 세로 자리를 uv 대신 모델 좌표(발끝 0 · 머리끝 1)로 잰다.
  function spectreMat(src, fx) {
    const m = new THREE.MeshLambertMaterial({ map: src.map || null, color: 0x9aa6a6, skinning: true });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = uTime; sh.uniforms.uHit = fx.hit; sh.uniforms.uBurn = fx.burn; sh.uniforms.uWarm = fx.warm;
      sh.uniforms.uH = { value: MODEL_H };
      sh.vertexShader = 'uniform float uTime, uHit, uH;\nvarying float vGY;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vGY = clamp(transformed.y / uH, 0.0, 1.0);   // 0 발끝 · 1 머리끝
        float k = 1.0 - vGY;
        float hem = smoothstep(.55, 1.0, k);
        transformed.x += sin(uTime * 1.1 + position.y * 1.6) * .045 * hem + sin(uTime * .5) * .014 * k;
        transformed.z += sin(uTime * 1.5 + position.y * 2.4 + position.x * 3.0) * .055 * hem;
        // 맞았을 때 — 몸이 가로 띠로 찢어지듯 어긋난다
        float band = floor(position.y * 7.0 + floor(uTime * 24.0));
        transformed.x += (fract(sin(band * 91.7) * 4375.5) - .5) * .45 * uHit;`);
      // 물에 젖은 자락은 어둡게, 윗몸은 창백하게. 맞으면 하얗게 번쩍이고 조각조각 타 없어진다
      sh.fragmentShader = 'uniform float uTime, uHit, uBurn, uWarm;\nvarying float vGY;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.rgb *= mix(.62, 1.08, smoothstep(0.0, .45, vGY));
        float fl = step(.55, fract(sin(floor(vGY * 34.0 + uTime * 22.0) * 43.1) * 999.0));   // 가로 띠가 깜빡이며 푸르게 뒤틀린다
        diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(.55), vec3(.35, 1.25, 1.45), fl), uHit * .85);
        // 풀려남(진엔딩) — 창백함이 가시고 따뜻한 빛을 띤다
        float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, .82, .58) * (.35 + lum * 1.1), uWarm * .8);
        if (uBurn > 0.0) {
          float n = fract(sin(dot(floor(vec2(vGY * 104.0, vGY * 37.0 + gl_FragCoord.x * .35)), vec2(12.9898, 78.233))) * 43758.5453);
          float tear = n - uBurn * 1.15 + vGY * .15;            // 소금 — 아무 데서나 찢어진다
          float rise = (1.0 - vGY) * .9 + n * .3 - uBurn * 1.25;  // 풀려남 — 발끝부터 빛 알갱이로 올라간다
          float edge = uWarm > .01 ? rise : tear;
          if (edge < 0.0) discard;
          diffuseColor.rgb = mix(diffuseColor.rgb, uWarm > .01 ? vec3(1.3, 1.05, .6) : vec3(.75, .95, 1.05), smoothstep(.06, 0.0, edge) * .7);
        }`);
    };
    return m;
  }

  // 빈 껍데기를 먼저 내주고, 모델이 오면 안에 채운다 (놀이는 바로 시작되고 모델은 좀 늦게 온다)
  function makeSpectre(H) {
    const g = new THREE.Group();
    const fx = { hit: { value: 0 }, burn: { value: 0 }, warm: { value: 0 }, t: -1, mode: '' };
    const inner = new THREE.Group(); inner.scale.setScalar(H / MODEL_H); g.add(inner);
    g.userData = { inner, H, fx, mixer: null, act: {}, cur: '', ready: false };
    if (window.GLTFLoaderClass) ghostBuf().then(buf => new Promise((res, rej) => new window.GLTFLoaderClass().parse(buf.slice(0), '', res, rej))).then(gl => {
      const root = gl.scene;
      root.traverse(o => {
        if (!(o.isMesh || o.isSkinnedMesh)) return;
        o.frustumCulled = false; o.renderOrder = 1;
        const src = [].concat(o.material)[0];
        if (src && src.map) { src.map.anisotropy = 4; }
        o.material = spectreMat(src || {}, fx);
      });
      // 구워 온 모델은 원점이 허리께라 그대로 두면 땅에 반쯤 묻힌다 — 발바닥을 원점으로 내리고 키를 맞춘다.
      // 부모에 붙이기 전에 잰다 — 붙인 뒤 재면 부모 배율까지 섞여 H 가 지워지고 늘 같은 키가 된다(2026-09-16)
      { root.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(root), h = Math.max(.01, bb.max.y - bb.min.y);
        root.position.y -= bb.min.y; inner.scale.setScalar(H / h); }
      inner.add(root);
      const mx = new THREE.AnimationMixer(root);
      (gl.animations || []).forEach(c => {
        c.tracks = c.tracks.filter(t => !/hips\.position$/i.test(t.name.replace(/[:_]/g, '')));   // 제자리에서 움직인다 — 클립이 몸을 끌고 가지 않게
        g.userData.act[c.name] = mx.clipAction(c);
      });
      g.userData.mixer = mx; g.userData.root = root; g.userData.ready = true;
      play(g, g.userData.want || 'turn');
    }).catch(e => console.warn('물귀신 모델', e));
    return g;
  }
  function play(g, name, speed) {
    const u = g.userData; u.want = name;
    if (!u.ready || u.cur === name) { if (u.act[name]) u.act[name].timeScale = speed || 1; return; }
    const a = u.act[name]; if (!a) return;
    const old = u.act[u.cur];
    a.reset(); a.timeScale = speed || 1; a.setLoop(THREE.LoopRepeat, Infinity); a.enabled = true; a.setEffectiveWeight(1); a.play();
    if (old && old !== a) old.crossFadeTo(a, .28, false);
    u.cur = name;
  }
  function fxReset(g) { const f = g.userData.fx; f.t = -1; f.mode = ''; f.hit.value = 0; f.burn.value = 0; f.warm.value = 0; }
  function fxTick(g, dt) {   // 번쩍 → 찢어짐 → 조각조각 사라짐, 1.1초
    const f = g.userData.fx; if (f.t < 0) return false;
    f.t += dt;
    if (f.mode === 'release') {   // 따뜻해지고(1.2초) → 발끝부터 빛으로 흩어지며 떠오른다(2.6초)
      f.warm.value = Math.min(1, f.t / 1.2); f.hit.value = 0;
      f.burn.value = Math.max(0, Math.min(1, (f.t - 1.4) / 2.6));
      g.position.y += dt * Math.max(0, f.t - 1.4) * .12;
      if (f.t > 4.1) { g.visible = false; fxReset(g); return true; }
      return false;
    }
    f.hit.value = f.t < .5 ? 1 - f.t * 1.4 : Math.max(0, .3 - (f.t - .5));
    f.burn.value = Math.max(0, Math.min(1, (f.t - .18) / .9));
    if (f.t > 1.15) { g.visible = false; fxReset(g); return true; }
    return false;
  }

  function Ghost(scene) {
    this.scene = scene;
    this.hands = new THREE.Group(); scene.add(this.hands); this.hands.visible = false;
    this.hl = [];
    for (let i = 0; i < 3; i++) { const h = makeHand(1.15 + Math.random() * .2); this.hands.add(h); this.hl.push(h); }
    this.body = makeSpectre(1.62 * 1.3); scene.add(this.body); this.body.visible = false;   // 어른 여자 키 — 2.05m 는 소년(1.25m) 옆에서 거인이었다
    // 물 위에 선 형체는 사람보다 한 뼘 크다
    this.far = makeSpectre(1.8 * 1.3); scene.add(this.far); this.far.visible = false; this.farT = 0; this.farY = 0;   // 2026-09-16 사장님 "귀신 30% 키우자" (줄 중간 // 주석이 scene.add 를 먹어 먼 귀신이 안 보였다)
    this.farH = 1.8 * 1.3;
  }
  const P = Ghost.prototype;
  // 손 셋 — 중심 (cx,cz) 둘레, k 0→1 로 올라온다
  P.showHands = function (cx, cz, k, t) {
    this.hands.visible = true;
    this.hl.forEach((h, i) => {
      const a = i * 2.1 + .4 + Math.sin(t * .7 + i) * .1, r = .95 + i * .12;
      const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
      h.position.set(x, W.height(x, z, t) - 1.1 + k * 1.35 + Math.sin(t * 6 + i) * .02, z);
      h.rotation.y = a + Math.PI;
      h.children.forEach((f, j) => { if (f.userData.base != null) f.rotation.x = f.userData.base + Math.sin(t * 8 + j * 1.3 + i) * .25 - k * .3; });
    });
  };
  P.hideHands = function () { this.hands.visible = false; };
  // 머리채 잡기 — 모델에 달린 진짜 손을 쓴다. 끌고 가는 동작(drag)의 손 뼈가 아이 머리에 오도록 몸을 통째로 옮긴다.
  // (2026-09-16 이전에는 손을 따로 만들어 붙였다. 리깅된 몸이 생겼으니 가짜 손은 버렸다)
  const _hand = new THREE.Vector3(), _sh = new THREE.Vector3();
  P.gripAt = function (hx, hy, hz, gx, gy, gz, t) {
    const b = this.body, u = b.userData;
    if (!u.ready || !b.visible) return;
    if (!u.handBone && u.root) u.root.traverse(o => { if (!u.handBone && o.isBone && /righthand$/i.test(o.name.replace(/[:_]/g, ''))) u.handBone = o; });
    const hb = u.handBone; if (!hb) return;
    let d = Math.atan2(hx - b.position.x, hz - b.position.z) - b.rotation.y;   // 아이 쪽을 본다
    d = Math.atan2(Math.sin(d), Math.cos(d)); b.rotation.y += d * Math.min(1, (t && this._gt ? (t - this._gt) : .016) * 8);
    this._gt = t;
    b.updateMatrixWorld(true);
    hb.getWorldPosition(_hand);
    _sh.set(hx - _hand.x, hy - _hand.y, hz - _hand.z);
    // 손이 머리채에 닿는 만큼 몸을 올리고 내린다.
    // 다만 아래로는 조금만 — 많이 내리면 물속에 잠겨 귀신이 안 보인다(2026-09-16 사장님 "귀신이 안 나옴")
    { // 수면 아래로는 60cm 까지만 — 더 내리면 머리만 빼꼼해 안 보인다. 물속으로 끌고 들어갈 땐(bodyAt 이 이미 내림) 그대로 따라간다
      const floorY = Math.min(b.position.y, W.height(b.position.x, b.position.z, t || 0) - 1.05);   // 30% 키운 뒤(09-16) 60→105cm — 물 위로 보이는 몸 높이는 전과 같다
      this.handFloorY = _hand.y + (floorY - b.position.y);   // 귀신이 바닥에 선 채일 때 손 높이 — 소년 머리를 여기까지 끌어올린다
      if (b.position.y + _sh.y < floorY) _sh.y = floorY - b.position.y; }
    if (_sh.y > 2.2) _sh.y = 2.2;
    b.position.add(_sh); b.updateMatrixWorld(true);
  };
  P.hideGrip = function () { this._gt = 0; };   // 가짜 손이 없으니 지울 것도 없다
  // 붙잡을 때 — 쓰러진 아이 바로 뒤(카메라 반대쪽)에 선다. faceY 는 얼굴 높이
  P.showBody = function (px, pz, faceY, t, cam) {
    const b = this.body, H = b.userData.H;
    if (!b.visible) { fxReset(b); play(b, 'drag'); }
    b.visible = true;
    let dx = px - cam.x, dz = pz - cam.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    b.position.set(px + dx * .75 + dz * .25, faceY - H * (1 - IMG.face), pz + dz * .75 - dx * .25);
  };
  P.hideBody = function () { this.body.visible = false; };
  // 발(원점)을 (x, footY, z) 에 — 아이 머리채를 잡고 물 가운데 쪽에 선다
  P.bodyAt = function (x, footY, z, t, anim) {
    const b = this.body;
    if (!b.visible) fxReset(b);
    play(b, anim || 'drag');   // 덮칠 땐 끌고 가는 동작, 엔딩에선 좀비팩 동작(끌기 동작을 제자리에서 돌리니 춤추는 것 같았다 — 2026-09-16)
    b.visible = true; b.position.set(x, footY, z);
  };
  // 소금을 맞았다 — 비명과 함께 찢어지며 사라진다
  P.banishFar = function () { if (this.far.visible) { this.far.userData.fx.t = 0; this.farHold = true; } };
  P.banishBody = function () { if (this.body.visible) this.body.userData.fx.t = 0; };
  P.releaseBody = function () { if (this.body.visible) { const f = this.body.userData.fx; f.t = 0; f.mode = 'release'; } };   // 진엔딩 — 여동생이었던 물귀신이 빛으로 풀려난다
  P.bodyBurning = function () { return this.body.userData.fx.t >= 0; };
  // 유품을 다 돌려받았다 — 원한이 풀려 빛으로 올라간다
  P.releaseFar = function () { if (this.far.visible) { const f = this.far.userData.fx; f.t = 0; f.mode = 'release'; this.farHold = true; } };
  P.farGone = function () { return !this.far.visible; };
  // 멀리 선 형체 — baseY 는 발 높이(물에선 수면 아래로 잠긴다). 나타날 때마다 동작이 바뀐다
  P.showFar = function (x, z, px, pz, hold, baseY) {
    fxReset(this.far); this.far.visible = true;
    play(this.far, nextClip(), .8 + Math.random() * .35);
    this.far.rotation.y = Math.atan2((px || x) - x, (pz || z) - z);   // 이쪽을 보고 선다
    this.farY = baseY != null ? baseY : -.5;
    this.far.position.set(x, this.farY, z); this.farT = 0; this.farHold = !!hold;
  };
  P.moveFar = function (x, z, px, pz, baseY) {
    if (!this.far.visible) return;
    this.far.position.x = x; this.far.position.z = z; if (baseY != null) this.farY = baseY;
    if (px != null) { let d = Math.atan2(px - x, pz - z) - this.far.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); this.far.rotation.y += d * .08; }
  };
  P.playFar = function (name, speed) { play(this.far, name, speed); };   // 코앞에 솟을 때 등 — 정해진 동작
  P.sinkFar = function () { this.farHold = false; this.farT = 3.2; };
  P.hideFar = function () { this.far.visible = false; this.farHold = false; };
  P.update = function (dt, t) {
    uTime.value = t;
    for (const g of [this.body, this.far]) if (g.visible && g.userData.mixer) g.userData.mixer.update(dt);
    if (this.body.visible) fxTick(this.body, dt);
    if (this.far.visible && this.far.userData.fx.t >= 0) { if (this.far.userData.fx.mode !== 'release') this.far.position.y = this.farY; fxTick(this.far, dt); }
    else if (this.far.visible) {
      this.farT += dt;
      const dn = this.farHold ? 0 : Math.max(0, this.farT - 3.2) * 1.2;   // 놓치면 스르르 물속으로 가라앉는다
      this.far.position.y = this.farY + Math.sin(t * .8) * .03 - dn;
      if (!this.farHold && this.farT > 5.8) this.far.visible = false;
    }
  };
  window.Ghost = Ghost;
})();
