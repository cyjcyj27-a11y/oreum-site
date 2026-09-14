// fx.js — 손맛: 타격 불꽃·멈춤·흔들림·숫자·코인·글자
(function () {
  let scene, layer;
  const sprites = [], nums = [], coins = [];
  const TEX = {};
  const _v = new THREE.Vector3();

  function canvasTex(size, draw) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    draw(cv.getContext('2d'), size);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function init(sc) {
    scene = sc;
    layer = document.getElementById('fxl');
    TEX.star = canvasTex(128, (g, s) => {
      g.translate(s / 2, s / 2); g.fillStyle = '#fff6c0';
      g.beginPath();
      for (let i = 0; i < 16; i++) { const r = i % 2 ? 18 : 60, a = i / 16 * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill();
    });
    TEX.ring = canvasTex(128, (g, s) => { g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 8, 0, 7); g.stroke(); });
    TEX.puff = canvasTex(64, (g, s) => { const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
    TEX.coin = canvasTex(64, (g, s) => {
      g.fillStyle = '#b8860b'; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill();
      g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(32, 32, 23, 0, 7); g.fill();
      g.fillStyle = '#fff2a0'; g.beginPath(); g.arc(25, 24, 7, 0, 7); g.fill();
    });
    TEX.dizzy = canvasTex(64, (g, s) => {
      g.translate(32, 32); g.fillStyle = '#ffe14a';
      g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 11 : 27, a = i / 10 * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill();
    });
  }

  function sprite(tex, pos, o) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, color: o.color || 0xffffff, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, rotation: o.rot || 0 });
    const s = new THREE.Sprite(m);
    s.position.copy(pos); s.scale.setScalar(o.s0 || 0.5);
    scene.add(s);
    sprites.push({ s, t: 0, life: o.life || 0.25, s0: o.s0 || 0.5, s1: o.s1 || 1.2, vel: o.vel || null, fade: o.fade !== false, spin: o.spin || 0, grav: o.grav || 0 });
    return s;
  }

  // 맞았다
  function hit(target, src, def) {
    const B = target.ch.bones;
    const hy = def.clip === 'kick' || def.clip === 'dropkick' ? 1.15 : 1.45;
    _v.set(target.pos.x, hy * target.scale, target.pos.z);
    // 공격자 쪽으로 조금 당겨 표면에 찍는다
    const dx = src.pos.x - target.pos.x, dz = src.pos.z - target.pos.z, d = Math.hypot(dx, dz) || 1;
    _v.x += dx / d * 0.3; _v.z += dz / d * 0.3;
    const heavy = def.react !== 'light';
    const heroHit = src.team === 'hero';
    sprite(TEX.star, _v, { s0: heavy ? 0.9 : 0.55, s1: heavy ? 2.1 : 1.3, life: heavy ? 0.2 : 0.14, add: true, rot: Math.random() * 3, color: heroHit ? 0xfff0b0 : 0xff8a7a });
    for (let i = 0; i < (heavy ? 9 : 5); i++) {
      const vel = new THREE.Vector3(U.rand(-4, 4), U.rand(1, 5), U.rand(-4, 4));
      sprite(TEX.puff, _v, { s0: 0.18, s1: 0.02, life: 0.3, vel, add: true, color: 0xffe9a0, grav: 12 });
    }
    T.stopT = Math.max(T.stopT, heavy ? 0.09 : 0.05);
    CAM.shake = Math.max(CAM.shake, heavy ? 0.45 : 0.18);
    AUD.sfx(heavy ? 'hitBig' : 'hit', heroHit ? 1 : 0.8);
    if (def.react === 'down' || target.dead) sprite(TEX.ring, new THREE.Vector3(target.pos.x, 0.15, target.pos.z), { s0: 0.5, s1: 3.2, life: 0.35, add: true });
    if (target.dead) {
      // 머리 위 별 뱅뱅
      for (let i = 0; i < 3; i++) {
        const s = sprite(TEX.dizzy, new THREE.Vector3(target.pos.x, 0.6, target.pos.z), { s0: 0.3, s1: 0.3, life: 2.0, fade: false });
        s.userData.orbit = { f: target, a: i * 2.09 };
      }
    }
  }

  // 기절: 머리 위 별이 dur 초 동안 돈다
  function stun(f, dur) {
    for (let i = 0; i < 4; i++) {
      const s = sprite(TEX.dizzy, new THREE.Vector3(f.pos.x, 1.8, f.pos.z), { s0: 0.34, s1: 0.34, life: dur, fade: false });
      s.userData.orbit = { f, a: i * 1.57, until: 'stun' };
    }
    sprite(TEX.star, new THREE.Vector3(f.pos.x, 1.5 * f.scale, f.pos.z), { s0: 1.2, s1: 3.4, life: 0.3, add: true, color: 0xffe14a });
    T.stopT = Math.max(T.stopT, 0.14);
    CAM.shake = Math.max(CAM.shake, 0.6);
    AUD.sfx('break');
    praise('BREAK');
    JOY.note('brk'); JOY.onBreak(f);
  }

  // 반격이 맞았다: 푸른 별 크게
  function counter(o) {
    const p = new THREE.Vector3(o.pos.x, 1.4 * o.scale, o.pos.z);
    sprite(TEX.star, p, { s0: 1.4, s1: 3.6, life: 0.26, add: true, color: 0x9fdcff });
    sprite(TEX.ring, p, { s0: 0.6, s1: 3.0, life: 0.3, add: true, color: 0x9fdcff });
    T.stopT = Math.max(T.stopT, 0.13);
    CAM.shake = Math.max(CAM.shake, 0.7);
    AUD.sfx('slam');
    praise('COUNTER');
    JOY.note('counter');
  }

  // 저스트 회피: 주인공 둘레에 푸른 고리
  function just(f) {
    sprite(TEX.ring, new THREE.Vector3(f.pos.x, 0.9, f.pos.z), { s0: 0.4, s1: 3.2, life: 0.4, add: true, color: 0x9fdcff });
    sprite(TEX.ring, new THREE.Vector3(f.pos.x, 0.15, f.pos.z), { s0: 0.8, s1: 4.0, life: 0.5, add: true, color: 0x6fbfff });
    AUD.sfx('just');
    const h = document.getElementById('hurt');
    h.classList.add('just'); setTimeout(() => h.classList.remove('just'), 160);
  }

  function ring(pos, r) {
    sprite(TEX.ring, new THREE.Vector3(pos.x, 0.2, pos.z), { s0: 0.8, s1: r * 2.4, life: 0.45, add: true, color: 0xffd080 });
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * U.TAU;
      sprite(TEX.puff, new THREE.Vector3(pos.x, 0.3, pos.z), { s0: 0.9, s1: 1.8, life: 0.55, vel: new THREE.Vector3(Math.cos(a) * 7, 0.6, Math.sin(a) * 7), color: 0xd8ccb0 });
    }
  }

  function poof(pos) {
    for (let i = 0; i < 10; i++) {
      sprite(TEX.puff, new THREE.Vector3(pos.x + U.rand(-0.5, 0.5), U.rand(0.2, 0.9), pos.z + U.rand(-0.5, 0.5)), { s0: 0.8, s1: 2.0, life: 0.6, vel: new THREE.Vector3(U.rand(-1, 1), U.rand(0.5, 2), U.rand(-1, 1)), color: 0xe8e2d0 });
    }
    AUD.sfx('poof');
  }

  // 코인이 튀어나와 주인공에게 빨려 온다
  function coinsBurst(pos, n, val) {
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.coin, transparent: true, depthWrite: false }));
      s.scale.setScalar(0.42); s.position.set(pos.x, 1.0, pos.z); scene.add(s);
      coins.push({ s, vel: new THREE.Vector3(U.rand(-3, 3), U.rand(4, 7), U.rand(-3, 3)), t: 0, val });
    }
  }

  // 머리 위 숫자
  function num(f, dmg, big) {
    const el = document.createElement('div');
    const heal = typeof dmg === 'string' && dmg[0] === '+';
    el.className = 'num' + (big ? ' big' : '') + (heal ? ' heal' : f.team === 'hero' ? ' me' : '');
    el.textContent = dmg;
    if (typeof dmg === 'string' && dmg.includes('[')) el.innerHTML = ICON.fill(el.innerHTML);   // [can]+1 → 캔 그림
    layer.appendChild(el);
    nums.push({ el, f, t: 0, x: U.rand(-0.3, 0.3) });
  }

  let bannerT = 0;
  function banner(text, dur) {
    const b = document.getElementById('banner');
    b.textContent = text; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    bannerT = dur || 1.2;
  }
  let praiseT = 0;
  function praise(text) {
    const p = document.getElementById('praise');
    p.textContent = text; p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
    praiseT = 1.0;
    AUD.sfx('praise');
  }
  function hurtFlash() {
    const h = document.getElementById('hurt');
    h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 90);
  }

  function update(dt, cam) {
    for (let i = sprites.length - 1; i >= 0; i--) {
      const p = sprites[i]; p.t += dt;
      const k = p.t / p.life;
      if (k >= 1) { scene.remove(p.s); p.s.material.dispose(); sprites.splice(i, 1); continue; }
      p.s.scale.setScalar(U.lerp(p.s0, p.s1, Math.min(1, k * 1.6)));
      if (p.fade) p.s.material.opacity = 1 - k * k;
      if (p.vel) { p.vel.y -= p.grav * dt; p.s.position.addScaledVector(p.vel, dt); p.vel.multiplyScalar(Math.exp(-3 * dt)); }
      const ob = p.s.userData.orbit;
      if (ob) {
        const f = ob.f; const hb = f.ch.bones.Head; hb.getWorldPosition(_v);
        ob.a += dt * 5;
        p.s.position.set(_v.x + Math.cos(ob.a) * 0.32, _v.y + 0.25, _v.z + Math.sin(ob.a) * 0.32);
        if (f.gone || (ob.until && f.state !== ob.until && p.t > 0.1)) p.t = p.life;
      }
    }
    // 코인
    const hero = PL.f;
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]; c.t += dt;
      if (c.t < 0.55) {
        c.vel.y -= 16 * dt; c.s.position.addScaledVector(c.vel, dt);
        if (c.s.position.y < 0.25) { c.s.position.y = 0.25; c.vel.y *= -0.45; c.vel.x *= 0.7; c.vel.z *= 0.7; }
      } else {
        _v.set(hero.pos.x, 1.0, hero.pos.z).sub(c.s.position);
        const d = _v.length();
        c.s.position.addScaledVector(_v.normalize(), Math.min(d, dt * (8 + c.t * 20)));
        if (d < 0.35) {
          T.coins += c.val; scene.remove(c.s); c.s.material.dispose(); coins.splice(i, 1);
          AUD.sfx('coin'); HUD.bumpCoin();
        }
      }
    }
    // 숫자
    const W = innerWidth, H = innerHeight;
    for (let i = nums.length - 1; i >= 0; i--) {
      const n = nums[i]; n.t += dt;
      if (n.t > 0.8 || n.f.gone) { n.el.remove(); nums.splice(i, 1); continue; }
      _v.set(n.f.pos.x + n.x, 2.0 * n.f.scale + n.t * 0.9, n.f.pos.z).project(cam);
      if (_v.z > 1) { n.el.style.opacity = 0; continue; }
      n.el.style.transform = 'translate(' + ((_v.x * 0.5 + 0.5) * W) + 'px,' + ((-_v.y * 0.5 + 0.5) * H) + 'px) translate(-50%,-50%) scale(' + (n.t < 0.1 ? 1.6 - n.t * 6 : 1) + ')';
      n.el.style.opacity = n.t > 0.55 ? (0.8 - n.t) / 0.25 : 1;
    }
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0) document.getElementById('banner').classList.remove('on'); }
    if (praiseT > 0) { praiseT -= dt; if (praiseT <= 0) document.getElementById('praise').classList.remove('on'); }
  }

  function clearAll() {
    for (const p of sprites) scene.remove(p.s); sprites.length = 0;
    for (const c of coins) { scene.remove(c.s); T.coins += c.val; } coins.length = 0;
    for (const n of nums) n.el.remove(); nums.length = 0;
  }

  window.FX = { init, hit, ring, poof, coins: coinsBurst, num, banner, praise, hurtFlash, update, clearAll, stun, counter, just };
})();
