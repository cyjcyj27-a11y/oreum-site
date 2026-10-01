// play.js — 사내아이 놀이 넷 + 알레샤의 호감 (사장님 2026-09-18 "1.2.3.4 다하면 여자애가 한 번씩 호감 표시", "동작을 제대로 넣어")
//   1 모닥불 뛰어넘기: 쿠팔라 들판 옆 작은 불(저녁 6시~새벽 5시). 달려서 뛰면 믹사모 도약(leap)으로 넘는다. 걸어 들어가면 뜨거워 튕겨 나온다
//   2 밤 숲 고사리꽃: 쿠팔라의 밤(T.kupala 2)에 숲에서 빛나는 눈·늑대 울음·바람 (징조만, 해치지 않는다). 고사리꽃을 피우면 끝
//   3 작살 낚시: fishing.js — 6종 다 잡으면 끝
//   4 미르 성 꼭대기: 안뜰 사다리 → 성벽 위 → 문탑 사다리 → 전망대. 사다리는 믹사모 Climbing Ladder / Climbing To Top
//   하나씩 해낼 때마다 알레샤가 한 번 호감을 보인다: 다가가면 하트 + 대사 + 동작(키스 날리기·부끄러움·박수)
(function () {
  const V3 = THREE.Vector3;
  const L = U.L;
  let scene = null;

  // ── 1 작은 모닥불 ──
  let fire = null;
  function buildFire() {
    const B = TER.Z.bonfire;
    const x = B.x + 8, z = B.z - 3, y = TER.H(x, z);
    fire = { x, z, y, g: new THREE.Group(), flames: [], t: 0, cool: 0 };
    fire.g.position.set(x, y, z);
    const stone = new THREE.MeshStandardMaterial({ color: 0x7a746a, roughness: 0.95, flatShading: true });
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), stone); m.position.set(Math.cos(a) * 0.62, 0.06, Math.sin(a) * 0.62); m.rotation.set(a, a * 2, 0); m.castShadow = true; fire.g.add(m); }
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 });
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 5), wood); m.rotation.set(0.9, i / 5 * 6.28, 0); m.position.y = 0.18; fire.g.add(m); }
    const ember = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
    ember.position.y = 0.03; fire.g.add(ember); fire.ember = ember;
    const ft = WORLD.fireTex();
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      s.userData.ph = Math.random() * 6; s.userData.o = new V3((Math.random() - 0.5) * 0.35, 0, (Math.random() - 0.5) * 0.35);
      fire.g.add(s); fire.flames.push(s);
    }
    fire.light = new THREE.PointLight(0xff8a30, 0, 12, 1.8); fire.light.position.y = 0.8; fire.g.add(fire.light);
    scene.add(fire.g);
  }
  function fireLit() { return T.clock >= 18 || T.clock < 5 || T.kupala >= 2; }
  let wasAir = false, overFire = false;
  function fireTick(dt) {
    if (!fire) return;
    const lit = fireLit();
    const d = Math.hypot(PL.pos.x - fire.x, PL.pos.z - fire.z);
    const near = d < 40;
    fire.g.visible = d < 120;
    fire.light.visible = lit && near;
    fire.light.intensity = lit ? 3.2 + Math.sin(T.time * 13) * 0.6 : 0;
    fire.ember.material.color.setHex(lit ? 0xff6a20 : 0x3a2a20);
    for (const s of fire.flames) {
      s.visible = lit;
      if (!lit) continue;
      const k = (T.time * 1.6 + s.userData.ph) % 1;
      s.position.set(s.userData.o.x, 0.25 + k * 0.9, s.userData.o.z);
      s.scale.setScalar(0.85 * (1 - k * 0.65));
      s.material.opacity = 0.9 * (1 - k);
    }
    if (!lit || T.mode !== 'play') { wasAir = PL.state === 'air'; return; }
    if (fire.cool > 0) fire.cool -= dt;
    // 공중에서 불 위를 지나가면 성공
    const hgt = PL.pos.y - fire.y;
    if (PL.state === 'air' && d < 0.75 && hgt > 0.35) overFire = true;
    if (overFire && PL.state !== 'air') overFire = false;   // 뛰어넘기 놀이는 뺐다 (사장님 2026-09-19 "모닥불 뛰어넘기도 빼고")
    // 걸어서 들어가면 뜨겁다 — 튕겨 나온다
    if (PL.state === 'ground' && d < 0.7 && fire.cool <= 0 && PL.knockT <= 0) {
      fire.cool = 1.5;
      PL.vel.set((PL.pos.x - fire.x) / (d || 1) * 4, 3.5, (PL.pos.z - fire.z) / (d || 1) * 4);
      PL.state = 'air'; PL.airT = 0; PL.knockT = 0.5;
      AUD.sfx('grunt'); if (window.CAM) CAM.shake = 0.3;
    }
  }
  function sparks() {
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: WORLD.fireTex(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
      s.scale.setScalar(0.12); s.position.set(fire.x, fire.y + 0.4, fire.z);
      scene.add(s);
      const v = new V3((Math.random() - 0.5) * 3, 2 + Math.random() * 3, (Math.random() - 0.5) * 3);
      let t = 0;
      const tick = () => { t += 1 / 60; v.y -= 6 / 60; s.position.addScaledVector(v, 1 / 60); s.material.opacity = 1 - t / 1.2; if (t < 1.2) sparkQ.push(tick); else scene.remove(s); };
      sparkQ.push(tick);
    }
  }
  let sparkQ = [];

  // ── 4 사다리 ──
  //   { x, z, y0, y1, yaw(사다리를 보는 방향), exit: [x, y, z] }
  const LADDERS = [];
  function buildCastle() {
    const C = TER.Z.castle, y = 16.2, S = 19, gx = C.x, gz = C.z - S;
    const wallTop = y + 8.5;
    const plank = new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 0.9 });
    const ladder = (x, z, y0, y1, yaw) => {
      const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = yaw;
      const h = y1 - y0;
      for (const sx of [-0.28, 0.28]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.07, h + 0.9, 0.07).translate(sx, (h + 0.9) / 2, 0), plank); r.castShadow = true; g.add(r); }
      for (let k = 0.3; k < h + 0.6; k += 0.34) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.56, 5).rotateZ(Math.PI / 2).translate(0, k, 0), dark); g.add(r); }
      scene.add(g);
    };
    // 성벽 위를 걸을 수 있게 (성벽 부딪힘 상자에 윗면)
    for (const o of COL.all) if (o.t === 1 && Math.abs(o.y1 - (y + 8.5)) < 0.01 && Math.hypot(o.x - C.x, o.z - C.z) < S * 1.4) o.top = true;
    // 사다리 1: 안뜰에서 북쪽 성벽 안쪽 면으로
    const l1 = { x: gx + 7, z: gz + 1.25, y0: y, y1: wallTop, yaw: Math.PI, exit: [gx + 7, wallTop, gz] };
    ladder(l1.x, l1.z - 0.12, l1.y0, l1.y1, 0);
    // 전망대: 문탑 동쪽 면, 지붕 처마 아래
    const deck = y + 17.5, dx = gx + 4.6;
    const dg = new THREE.Group(); dg.position.set(dx, deck, gz);
    dg.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 3.0).translate(0, -0.07, 0), plank));
    for (const [px, pz] of [[1.05, -1.45], [1.05, 1.45], [1.05, 0], [0, -1.45], [0, 1.45]]) dg.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08).translate(px, 0.5, pz), dark));
    dg.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 3.0).translate(1.05, 1.0, 0), dark));
    for (const sz of [-1.45, 1.45]) dg.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.06).translate(0, 1.0, sz), dark));
    for (let k = -1.2; k < 1.3; k += 0.5) dg.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.05).translate(1.1, -0.2, k), dark));   // 받침
    // 깃발
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5).translate(0.9, 1.2, -1.2), dark); dg.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55).translate(0.45, 0, 0), new THREE.MeshStandardMaterial({ color: 0xc8302a, side: THREE.DoubleSide, roughness: 0.8 }));
    flag.position.set(0.9, 2.1, -1.2); dg.add(flag); PLAY.flag = flag;
    dg.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(dg);
    const deckBox = COL.box(dx, gz, 1.1, 1.5, 0, deck - 0.3, deck); deckBox.top = true;
    // 난간
    COL.box(dx + 1.05, gz, 0.05, 1.5, 0, deck, deck + 1.0);
    COL.box(dx, gz - 1.45, 1.1, 0.05, 0, deck, deck + 1.0);
    COL.box(dx, gz + 1.45, 1.1, 0.05, 0, deck, deck + 1.0);
    // 사다리 2: 성벽 위에서 전망대로 (전망대 바닥 구멍으로 올라선다)
    const l2 = { x: gx + 3.85, z: gz + 0.6, y0: wallTop, y1: deck, yaw: -Math.PI / 2, exit: [dx + 0.3, deck, gz], top: true };
    ladder(l2.x - 0.12, l2.z, l2.y0, l2.y1, Math.PI / 2);
    LADDERS.push(l1, l2);
    PLAY.deck = { x: dx, y: deck, z: gz };
  }
  // 망루 사다리 — 올라가면 전망대에서 멧돼지를 쏜다 (사장님 2026-09-20)
  function buildTower() {
    const t = WORLD.TOWER;
    if (!t) return;
    LADDERS.push({ x: t.lx, z: t.lz, y0: t.y, y1: t.deck, yaw: t.ry, exit: [t.exit[0], t.deck, t.exit[1]] });
  }
  function ladderNear() {
    if (PL.climb || PL.state !== 'ground' || PL.swim) return null;
    for (const l of LADDERS) {
      const d = Math.hypot(PL.pos.x - l.x, PL.pos.z - l.z);
      if (d < 1.1 && Math.abs(PL.pos.y - l.y0) < 0.8) return (T.items.water || 0) > 0 ? { kind: 'full', label: '🪣 ✕' } : { kind: 'ladder', l, up: true, label: 'E 🪜' };   // 물통을 들고는 못 오른다
      const e = l.exit;
      if (Math.hypot(PL.pos.x - e[0], PL.pos.z - e[2]) < 1.3 && Math.abs(PL.pos.y - e[1]) < 0.6) return { kind: 'ladder', l, up: false, label: 'E 🪜' };
    }
    return null;
  }
  // 사다리에 붙는 자리: 가로대에서 몸 두께만큼 떨어져 (사장님 2026-09-18 "누가 사다리를 이렇게 타" — 등을 대고 있었다)
  let LAD_OFF = 0.3;
  const ladX = l => l.x - Math.sin(l.yaw) * LAD_OFF, ladZ = l => l.z - Math.cos(l.yaw) * LAD_OFF;
  function ladderAct(n) {
    const l = n.l;
    PL.climb = { l, y: n.up ? l.y0 + 0.05 : l.y1 - 1.8, top: -1 };
    PL.vel.set(0, 0, 0);
    PL.pos.set(ladX(l), PL.climb.y, ladZ(l));
    PL.yaw = l.yaw;
    PLAYER.play('ladder', 0.2, { restart: true });
    AUD.sfx('tock', 0.5);
  }
  // hero.js 가 부른다: 사다리에 매달린 동안
  function climbStep(dt) {
    const c = PL.climb, l = c.l, IN = PLAYER.IN, CH = PLAYER.CH;
    if (c.top >= 0) {   // 꼭대기로 올라서는 중 (Climbing To Top)
      c.top += dt;
      const k = Math.min(1, c.top / 1.9);
      PL.pos.set(U.lerp(ladX(l), l.exit[0], k * k), U.lerp(l.y1 - 1.7, l.exit[1], Math.min(1, k * 1.4)), U.lerp(ladZ(l), l.exit[2], k * k));
      if (c.top >= 1.9) {
        PL.climb = null; PL.state = 'ground'; PL.pos.set(l.exit[0], l.exit[1], l.exit[2]);
        PLAYER.play('idle', 0);   // 섞으면 올라선 엉덩이 높이가 잠깐 두 배로 튄다
        if (l.top && !T.did.castle) { T.did.castle = true; U.save(); AUD.sfx('new'); FX.pop('🏰', PL.pos); LIKE.done('castle'); }
      }
    } else {
      const v = (IN.f || 0) * 1.15;
      c.y += v * dt;
      const a = CH.acts.ladder;
      if (a) a.setEffectiveTimeScale(Math.abs(v) > 0.05 ? Math.sign(v) * 1.3 : 0.0001);
      if (Math.abs(v) > 0.05 && Math.random() < dt * 2.5) AUD.sfx('tock', 0.3);
      if (c.y < l.y0) c.y = l.y0;
      if (c.y <= l.y0 && v < 0) { PL.climb = null; PL.pos.y = l.y0; PL.pos.x -= Math.sin(l.yaw) * 0.4; PL.pos.z -= Math.cos(l.yaw) * 0.4; PLAYER.play('idle', 0.3); return; }
      if (v > 0 && c.y >= l.y1 - 1.7) {   // 위로 오를 때만 (내려가려고 잡자마자 도로 올라서던 것, 사장님 2026-09-18 "내려가는게 안되네")
      c.y = l.y1 - 1.7; c.top = 0; PLAYER.play('ladtop', 0.2, { restart: true, once: true, speed: 2.1 }); }
      PL.pos.set(ladX(l), c.y, ladZ(l));
      if (IN.jumpEdge) { IN.jumpEdge = false; }
    }
    CH.holder.position.copy(PL.pos);
    // 올라서는 동작(Climbing To Top)은 엉덩이를 스스로 2m 들어 올린다 → 그림은 사다리 높이에 두고 동작이 올리게 한다
    //   (사장님 2026-09-18 "사다리 꼭대기에서 하늘로 날아가버림" — 위치도 올리고 동작도 올려 두 배로 떴다)
    if (PL.climb && PL.climb.top >= 0) CH.holder.position.y = U.lerp(l.y1 - 1.7, l.y1 - 2.0, Math.min(1, PL.climb.top / 1.9));
    // 믹사모 사다리 동작은 몸이 뒤로 돌아 있다 → 그림만 반 바퀴 돌려 사다리를 마주 보게
    CH.holder.rotation.y = PL.yaw + (c.top >= 0 && CH.cur === 'ladtop' ? PLAY.topFlip : PLAY.ladFlip);
  }

  // ── 2 쿠팔라 밤 숲의 징조 ──
  const eyes = [];
  let howlT = 6;
  function buildEyes() {
    const c = GEO.canvas(32, 16), g = c.getContext('2d');
    for (const x of [8, 24]) { const gr = g.createRadialGradient(x, 8, 0, x, 8, 7); gr.addColorStop(0, 'rgba(255,240,160,1)'); gr.addColorStop(0.4, 'rgba(255,180,60,.8)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(x - 8, 0, 16, 16); }
    const tex = GEO.tex(c);
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      s.scale.set(0.34, 0.17, 1); s.visible = false; scene.add(s);
      eyes.push({ s, t: 0, on: false });
    }
  }
  function omenTick(dt) {
    const night = T.kupala === 2;
    if (!night) { for (const e of eyes) e.s.visible = false; return; }
    const f = TER.forest(PL.pos.x, PL.pos.z);
    const inWood = f && f.k !== 'meadow';
    for (const e of eyes) {
      e.t -= dt;
      if (e.on) {
        const d = e.s.position.distanceTo(PL.pos);
        const blink = Math.sin(T.time * 0.9 + e.t) > 0.96;
        e.s.visible = !blink;
        if (d < 7 || e.t <= 0) { e.on = false; e.s.visible = false; e.t = 3 + Math.random() * 6; }   // 다가가면 사라진다
      } else if (e.t <= 0 && inWood) {
        const a = PL.yaw + (Math.random() - 0.5) * 2.4, r = 12 + Math.random() * 14;
        const x = PL.pos.x + Math.sin(a) * r, z = PL.pos.z + Math.cos(a) * r;
        if (TER.H(x, z) < 0.3) { e.t = 1; continue; }
        e.s.position.set(x, TER.H(x, z) + 0.5 + Math.random() * 0.6, z);
        e.on = true; e.t = 4 + Math.random() * 5;
      }
    }
    howlT -= dt;
    if (howlT <= 0 && inWood) { howlT = 14 + Math.random() * 16; AUD.sfx('howl'); }
  }

  // ── 알레샤의 호감 ──
  const LINES = {
    fire: [['불을 넘는 거 봤어! …용감하네.', 'I saw you jump the fire! …That was brave.'], 'kiss'],
    fern: [['정말 고사리꽃을 찾았구나. 소원… 빌었어?', 'You really found the fern flower. Did you… make a wish?'], 'shy'],
    fish: [['호수 물고기를 다 잡았다며? 대단해!', 'You caught every fish in the lake? Amazing!'], 'clap'],
    castle: [['성 꼭대기에서 손 흔든 거 너지? 다 보였어.', 'Was that you waving from the castle top? I saw you.'], 'shy'],
    bison: [['들소를 길들였다고? 다음엔 나도 태워 줘!', 'You tamed a bison? Take me for a ride next time!'], 'clap'],
  };
  const LIKE = {
    done(k) { T.did[k] = true; U.save(); },
    // quests.js 가 알레샤 곁에서 부른다: 보여 줄 호감이 있으면 대사·동작·하트
    pending() { for (const k of ['fern', 'fish', 'bison']) if (T.did[k] && !T.liked[k]) return k; return null; },   // fire·castle 은 뺀 놀이 (9/19) — 옛 저장 표시로 말하지 않게
    show(r) {
      const k = LIKE.pending(); if (!k) return false;
      T.liked[k] = true; U.save();
      const [line, act] = LINES[k];
      QUESTS.say(r.p, L(line[0], line[1]), 5);
      const b = r.body;
      if (b && b.acts && b.acts[act]) {
        const a = b.acts[act];
        a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = false; a.play();
        if (b.cur) a.crossFadeFrom(b.cur, 0.3, false);
        const back = b.cur; b.cur = a;
        const dur = a.getClip().duration * 1000;
        setTimeout(() => { if (b.cur === a && back) { back.reset(); back.play(); back.crossFadeFrom(a, 0.5, false); b.cur = back; } }, Math.min(dur, 6000));
      }
      hearts(r);
      AUD.sfx('like');
      return true;
    },
  };
  // 머리 위로 하트가 몽글몽글
  function hearts(r) {
    const c = GEO.canvas(64, 64), g = c.getContext('2d');
    g.fillStyle = '#ff5a7a'; g.font = '52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('❤', 32, 36);
    const tex = GEO.tex(c);
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
      s.scale.setScalar(0.26); s.position.set(r.x + (Math.random() - 0.5) * 0.4, r.floor + r.P.h + 0.1, r.z + (Math.random() - 0.5) * 0.4);
      scene.add(s);
      let t = -i * 0.25;
      const tick = () => { t += 1 / 60; if (t > 0) { s.position.y += 0.012; s.position.x += Math.sin(t * 4 + i) * 0.004; s.material.opacity = Math.max(0, 1 - t / 2.2); } if (t < 2.2) sparkQ.push(tick); else scene.remove(s); };
      sparkQ.push(tick);
    }
  }

  function build(sc) {
    scene = sc;
    buildFire();
    // 미르성은 먼 배경으로만 — 사다리·전망대를 빼고 성 언덕에 못 들어가게 둘레를 막는다
    //   (사장님 2026-09-19 "사다리 타는 게 의미가 없으니까 그냥 먼 배경으로만 두고 접근 못 하게")
    { const C = TER.Z.castle; COL.circle(C.x, C.z, 34, -50, 300, 'castle'); }
    buildTower();
    buildEyes();
  }
  function update(dt) {
    if (!scene) return;
    fireTick(dt);
    omenTick(dt);
    if (PLAY.flag) PLAY.flag.rotation.y = Math.sin(T.time * 2.2) * 0.25;
    const q = sparkQ; sparkQ = [];
    for (const f of q) f();
  }
  // 멧돼지 꼬치구이는 뺐다 — 멧돼지는 표도르에게 팔기만 (사장님 2026-09-27). 옛 저장에 남은 꼬치구이 그림만 둔다(팔기 창)
  let skewerImg = null;
  function skewerIcon() {
    if (skewerImg) return skewerImg;
    const c = GEO.canvas(128, 128), g = c.getContext('2d');
    g.translate(64, 64); g.rotate(-0.6);
    g.strokeStyle = '#4a4a4c'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-56, 0); g.lineTo(56, 0); g.stroke();
    for (let i = 0; i < 4; i++) {
      const x = -33 + i * 22, gr = g.createRadialGradient(x - 4, -5, 2, x, 0, 13);
      gr.addColorStop(0, '#b0683a'); gr.addColorStop(1, '#4e260e');
      g.fillStyle = gr; g.beginPath(); g.roundRect(x - 10, -11, 20, 22, 6); g.fill();
      g.fillStyle = 'rgba(30,14,4,.55)'; g.fillRect(x - 8, -3, 16, 2);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const x = 44 + i * 16; g.beginPath(); g.moveTo(x, 40); g.bezierCurveTo(x - 6, 30, x + 6, 22, x, 10); g.stroke(); }
    return (skewerImg = c.toDataURL());
  }

  function near() { return ladderNear(); }
  function act(n) { if (n.kind === 'ladder') ladderAct(n); }

  const PLAY = { ladFlip: Math.PI, topFlip: Math.PI, set ladOff(v) { LAD_OFF = v; }, build, update, near, act, climbStep, hearts, skewerIcon, LADDERS, get fire() { return fire; } };
  window.PLAY = PLAY;
  window.LIKE = LIKE;
})();
