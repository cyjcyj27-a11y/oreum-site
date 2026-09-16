/* uncle.js — 강가 천막에 사는 낚시꾼 아저씨(망망대해 아저씨 모델). 자기가 예수라고 믿는다.
 * 정신이 온전치 않아 여기저기 떠돌다 갑자기 코앞에 나타나 소리치고, 알 수 없는 말을 남기고 비틀비틀 사라진다.
 * 동작은 믹사모에서 받은 낚시·기도·소리치기·비틀걷기·이상한 손짓(assets/acts_u.glb)을 이 모델 뼈에 구워 쓴다(acts.js). */
(function () {
  const W = window.WORLD, EN = /[?&]lang=en/.test(location.search);
  const bank = (z, s, off) => W.cx(z) + s * (W.hw(z) + off);
  const CAMP_Z = W.CAMP_Z, CAMP_S = -1;
  const U = { root: null, holder: null, mixer: null, act: {}, cur: '', state: 'camp', t: 0, spot: -1, fire: null };
  U.CAMP = { x: bank(CAMP_Z, CAMP_S, 3.4), z: CAMP_Z };
  U.FISH = { x: bank(CAMP_Z + 2, CAMP_S, -.2), z: CAMP_Z + 2 };   // 물가 낚시 자리
  U.CROSS = { x: bank(CAMP_Z - 2.6, CAMP_S, 4.6), z: CAMP_Z - 2.6 };

  // 아저씨의 말 — 두 줄까지. 맵 자리(13곳) 하나에 한 줄씩, 올라갈수록 조여 온다
  const LINES = EN ? [   // 처음엔 제가 예수라는 헛소리, 갈수록 더 가까이 조여 온다
    ['Child, I am the one who walks on water.'],
    ['Two fish fed five thousand.', 'I remember it well.'],
    ["Shh… don't make a sound.", 'The water is listening.'],
    ['Save your salt.', 'You are the salt of the earth.'],
    ['A girl sings by the water every night.', 'Is she your sister?'],
    ['I died in this river three times.', 'Three times I walked back out.'],
    ['Last night I walked on the water.', 'Something grabbed my ankle from below.'],
    ['Shh…', 'someone is standing on the water.'],
    ['I cut open a fish today.', 'It was full of long hair.'],
    ["That girl's song…", 'your sister is singing it now.'],
    ["Don't believe in me.", 'I no longer know who stands on the water.'],
    ['I know every name this river has taken.', 'The next name is yours.'],
    ["Don't turn around.", 'That was not me behind you.'],
  ] : [
    ['얘야, 나는 물 위를 걷는 사람이다'],
    ['물고기 두 마리로', '오천 명을 먹였지'],
    ['쉿… 발소리 내지 마라', '물속에서 다 듣고 있다'],
    ['소금은 아껴 써라', '너는 세상의 소금이니까'],
    ['밤마다 물가에서 노래하는 여자애가 있더라', '네 동생이냐?'],
    ['나는 이 강에서 세 번 죽었다', '세 번 다 걸어 나왔지'],
    ['어젯밤엔 물 위를 걸었다', '발밑에서 누가 내 발목을 잡더구나'],
    ['쉿…', '저기 물 위에 누가 서 있잖니'],
    ['오늘 잡은 물고기 배를 갈랐더니', '긴 머리카락이 가득 들어 있더라'],
    ['그 여자애 노래를', '이젠 네 동생이 따라 부르더구나'],
    ['나를 믿지 마라', '이제 나도 누가 물 위에 서 있는지 모르겠다'],
    ['이 강이 데려간 사람들 이름을 나는 다 안다', '다음 이름은 네 것이다'],
    ['돌아보지 마라', '방금 네 뒤에 서 있던 건 내가 아니다'],
  ];

  // ── 모델 ──
  U.init = function (scene) {
    if (!window.GLTFLoaderClass) return;   // file:// 에서도 나온다 — 모델은 base64 사본으로 읽는다
    const holder = new THREE.Group(); holder.visible = false; scene.add(holder); U.holder = holder;
    Promise.all([
      W.glbLoad('assets/uncle.glb'),
      window.ACTS.loadOne('assets/acts_u.glb'),
    ]).then(([gl, src]) => {
      const root = gl.scene;
      root.traverse(o => { if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false; const m = o.material; if (m && m.emissiveMap && m.map && m.emissiveMap.image === m.map.image) { m.emissiveMap = null; m.emissive && m.emissive.setScalar(0); } } });
      const own = gl.animations.map(c => { const k = c.clone(); k.name = /walk/i.test(c.name) ? 'walk' : /run/i.test(c.name) ? 'run' : 'idle'; return k; });
      const baked = src ? window.ACTS.bake(root, own, [src]) : {};
      root.updateMatrixWorld(true);
      const h = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).y || 1;
      root.scale.multiplyScalar(1.74 / h);
      holder.add(root); U.root = root;
      U.mixer = new THREE.AnimationMixer(root);
      own.forEach(c => U.act[c.name] = U.mixer.clipAction(c));
      for (const n in baked) U.act[n] = U.mixer.clipAction(baked[n]);
      U.goCamp();
    }).catch(e => console.warn('아저씨 모델', e));
  };
  function play(name, speed) {
    const a = U.act[name] || U.act.idle; if (!a) return;
    if (U.cur !== name) { const p = U.act[U.cur]; a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.fadeIn(.25).play(); if (p && p !== a) p.fadeOut(.25); U.cur = name; }
    a.timeScale = speed || 1;
  }
  function placeAt(x, z, yaw) { if (!U.holder) return; U.holder.position.set(x, W.groundH(x, z), z); U.holder.rotation.y = yaw; }
  U.goCamp = function () {
    U.state = 'camp'; U.t = 0; U.pose = 'fishing';
    placeAt(U.FISH.x, U.FISH.z, Math.atan2(-CAMP_S, 0));   // 물을 보고 낚싯대를 드리운다
    if (U.holder) U.holder.visible = true; play('fishing');
  };
  U.reset = function () { if (U.root) U.goCamp(); };

  // ── 야영지 — 천막·모닥불·나무 십자가·물통 ──
  const MT = {
    tarp: null, wood: new THREE.MeshLambertMaterial({ color: 0x4a3828 }), drift: new THREE.MeshLambertMaterial({ color: 0x7d705e, flatShading: true }),
    stone: new THREE.MeshLambertMaterial({ color: 0x4a4d4d, flatShading: true }), ash: new THREE.MeshLambertMaterial({ color: 0x1c1a18 }),
    rope: new THREE.MeshLambertMaterial({ color: 0x9a8a66 }), tin: new THREE.MeshPhongMaterial({ color: 0x6d7275, shininess: 40 }), cloth: new THREE.MeshLambertMaterial({ color: 0xcfc8b8, side: THREE.DoubleSide }),
  };
  { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');   // 기워 입은 방수포 — 초록 바탕에 누런 천 조각, 빗물 얼룩
    c.fillStyle = '#3d4a36'; c.fillRect(0, 0, 256, 256);
    [[20, 40, 90, 70, '#6b5a3a'], [150, 120, 80, 60, '#5a4b35'], [60, 170, 70, 50, '#4a5a50']].forEach(([x, y, w, h, col]) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(20,15,10,.7)'; c.setLineDash([4, 4]); c.lineWidth = 2; c.strokeRect(x + 3, y + 3, w - 6, h - 6); });
    c.setLineDash([]); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * .12})`; c.fillRect(Math.random() * 256, Math.random() * 256, 3, 8 + Math.random() * 20); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; MT.tarp = new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide }); }
  const mesh = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); p.add(m); return m; };
  U.buildChunk = function (ci, z0, z1, g) {
    if (CAMP_Z < z0 || CAMP_Z >= z1) return;
    const u = g.userData, C = U.CAMP, gy = W.groundH(C.x, C.z), grp = new THREE.Group(); grp.position.set(C.x, gy, C.z); grp.rotation.y = Math.atan2(-CAMP_S, 0); g.add(grp);   // 입구가 물 쪽
    // 천막 — 장대 둘에 방수포를 걸친 삼각 천막
    const L = 2.6, Wd = 2.2, Ht = 1.5;
    { const sh = new THREE.Shape(); sh.moveTo(-Wd / 2, 0); sh.quadraticCurveTo(-Wd * .3, Ht * .45, 0, Ht); sh.quadraticCurveTo(Wd * .3, Ht * .45, Wd / 2, 0); sh.lineTo(Wd / 2 - .06, 0); sh.quadraticCurveTo(Wd * .28, Ht * .43, 0, Ht - .07); sh.quadraticCurveTo(-Wd * .28, Ht * .43, -Wd / 2 + .06, 0); sh.closePath();   // 축 늘어진 방수포 두께만 — 앞뒤는 뚫렸다
      const tg = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); tg.translate(0, 0, -L / 2); mesh(tg, MT.tarp, 0, 0, -.6, grp);
      const back = new THREE.Shape(); back.moveTo(-Wd / 2, 0); back.quadraticCurveTo(-Wd * .3, Ht * .45, 0, Ht); back.quadraticCurveTo(Wd * .3, Ht * .45, Wd / 2, 0); back.closePath(); mesh(new THREE.ShapeGeometry(back), MT.tarp, 0, 0, -.6 - L / 2, grp); }
    for (const z of [-.6 + L / 2, -.6 - L / 2]) mesh(new THREE.CylinderGeometry(.04, .05, Ht + .15, 5), MT.wood, 0, (Ht + .15) / 2, z, grp);
    mesh(new THREE.CylinderGeometry(.025, .025, L + .3, 5), MT.rope, 0, Ht, -.6, grp).rotation.x = Math.PI / 2;
    u.rocks.push({ x: C.x, z: C.z, r: 1.3 + 1.7 });
    // 모닥불 — 돌 고리, 타다 남은 장작, 불씨
    const fx = 0, fz = 1.9;
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const s = mesh(new THREE.DodecahedronGeometry(.16, 0), MT.stone, fx + Math.cos(a) * .45, .08, fz + Math.sin(a) * .45, grp); s.scale.y = .7; }
    mesh(new THREE.CircleGeometry(.4, 12), MT.ash, fx, .02, fz, grp).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) { const lg = mesh(new THREE.CylinderGeometry(.05, .06, .7, 6), MT.wood, fx, .12, fz, grp); lg.rotation.set(Math.PI / 2 - .35, i * .8, 0); }
    const ember = new THREE.Sprite(new THREE.SpriteMaterial({ map: W.glowTex(), color: 0xff7a30, transparent: true, opacity: .8, depthWrite: false })); ember.position.set(fx, .35, fz); ember.scale.set(.9, 1.1, 1); grp.add(ember);
    const li = new THREE.PointLight(0xff8a40, 2.2, 11, 1.7); li.position.set(fx, .7, fz); grp.add(li);
    U.fire = { ember, li };
    // 나무 십자가 — 떠내려온 나무 두 토막을 새끼줄로 묶고 흰 천을 걸었다
    { const cg = new THREE.Group(), K = U.CROSS; cg.position.set(K.x, W.groundH(K.x, K.z), K.z); cg.rotation.set(.06, .4, .03); g.add(cg);
      mesh(new THREE.CylinderGeometry(.06, .08, 2.3, 6), MT.drift, 0, 1.15, 0, cg);
      mesh(new THREE.CylinderGeometry(.05, .06, 1.2, 6), MT.drift, 0, 1.7, 0, cg).rotation.z = Math.PI / 2;
      mesh(new THREE.TorusGeometry(.08, .02, 4, 8), MT.rope, 0, 1.7, 0, cg);
      const cl = mesh(new THREE.PlaneGeometry(.9, .5, 3, 2), MT.cloth, 0, 1.45, .07, cg); cl.rotation.x = .08;
      u.rocks.push({ x: K.x, z: K.z, r: .12 + 1.7 }); }
    // 물통·기대 놓은 낚싯대 몇 개
    mesh(new THREE.CylinderGeometry(.2, .17, .36, 10, 1, true), MT.tin, 1.3, .18, 1.2, grp);
    for (let i = 0; i < 2; i++) { const r = mesh(new THREE.CylinderGeometry(.008, .016, 2.6, 5), MT.wood, -1.3 + i * .12, 1.1, .4, grp); r.rotation.set(.45, 0, .1 * i); }
  };
  { const prev = W.puzBusy; W.puzBusy = z => (prev ? prev(z) : false) || Math.abs(z - CAMP_Z) < 10; }

  // ── 매 틱 ──
  U.tick = function (c) {
    if (!U.root) return;
    const { P, G, dt } = c;
    U.t += dt;
    const dCamp = Math.hypot(P.x - U.CAMP.x, P.z - U.CAMP.z);
    if (U.state === 'camp') {
      if (U.t > 18) { U.t = 0;   /* 야영지 만남(대사·소금 +2)은 뺐다 — 2026-09-17 사장님 "야영지에서 만나는거 빼자" */ U.pose = U.pose === 'fishing' ? 'pray' : 'fishing';   // 낚시하다가 십자가 앞에 무릎 꿇는다
        if (U.pose === 'pray') { placeAt(U.CROSS.x - CAMP_S * .9, U.CROSS.z + .2, Math.atan2(U.CROSS.x - (U.CROSS.x - CAMP_S * .9), -.2)); play('pray'); }
        else { placeAt(U.FISH.x, U.FISH.z, Math.atan2(-CAMP_S, 0)); play('fishing'); } }
      // 야영지에서 멀어지면 — 앞길 자리에 먼저 가 서 있는다
      if (dCamp > 40) lurk(P);
    } else if (U.state === 'lurk') {
      const s = SPOTS[U.spot];
      if (dCamp < 40 || W.used.has('UNC' + U.spot)) { U.goCamp(); return; }
      if (P.z > s.z + 14) { W.used.add('UNC' + U.spot); lurk(P); return; }   // 멀찍이 비켜 지나갔다 — 다음 자리로
      const calm = G.ghost === 'away' && G.strike < 0 && !G.holy && !G.hidden && !(G.busy > 0);
      if (P.z > s.z - 3 && calm) scare(c);   // 그 자리에 닿으면 — 물길 어느 쪽으로 걷든 눈앞에
    } else if (U.state === 'scare') {
      const done = () => { U.holder.visible = false; U.state = 'gone'; };
      if (G.ghost !== 'away' || (G.strike >= 0 && U.t > 2.5)) { done(); return; }   // 물귀신이 오면 온데간데없다 — 오기 직전이면 얼굴은 보여 주고 사라진다
      if (U.t < 3.6) U.holder.rotation.y = Math.atan2(P.x - U.holder.position.x, P.z - U.holder.position.z);
      else {   // 알 수 없는 말을 남기고 비틀비틀 어둠 속으로
        if (U.cur !== 'drunk') { play('drunk', .9); U.away = Math.atan2(U.holder.position.x - P.x, U.holder.position.z - P.z) + (Math.random() - .5) * .8; }
        U.holder.rotation.y = U.away;
        const nx = U.holder.position.x + Math.sin(U.away) * dt * 1.0, nz = U.holder.position.z + Math.cos(U.away) * dt * 1.0;
        U.holder.position.set(nx, W.groundH(nx, nz), nz);
        if (U.t > 10 || Math.hypot(P.x - nx, P.z - nz) > 22) done();
      }
    } else if (U.state === 'gone') {   // 사라진 뒤 — 등 뒤에서 다음 자리로 옮겨 간다
      if (dCamp < 40) U.goCamp(); else lurk(P);
    }
  };
  // ── 맵 곳곳의 자리 — 물길을 따라 띄엄띄엄, 한 자리에 한 번씩 ──
  let SPOTS = null;
  function spots() {
    if (SPOTS) return SPOTS;
    SPOTS = []; let sd = 7719; const rn = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    // 퍼즐 자리·야영지·서낭당·석등 자리는 비킨다 — 서낭당 안에선 놀래키지 않아서, 맵을 줄인 뒤 첫 자리(118)가 첫 서낭당(112)에 묻혀 초반에 안 나왔다(2026-09-16)
    const busy = z => (W.puzBusy && W.puzBusy(z)) || Math.abs(z - CAMP_Z) < 45 || W.MARKS.some(m => m.cp && Math.abs(m.z - z) < 30) || (window.PROPS && PROPS.SITES.some(st => Math.abs(st.z - z) < 22));
    for (let z = 28; z < W.END - 60 * W.ZS; z += (72 + rn() * 34) * W.ZS) {
      let zz = z; for (let k = 0; k < 12 && busy(zz); k++) zz += 6;
      if (busy(zz) || (SPOTS.length && zz - SPOTS[SPOTS.length - 1].z < 40)) continue;   // 비키다 앞 자리와 붙으면 버린다
      SPOTS.push({ z: zz });
    }
    { const all = SPOTS, n = LINES.length; if (all.length > n) { SPOTS = []; for (let k = 0; k < n; k++) SPOTS.push(all[Math.round(k * (all.length - 1) / (n - 1))]); } }   // 대사 수(13)만큼 고르게 추린다(2026-09-16 사장님)
    return SPOTS;
  }
  function lurk(P) {
    const S = spots(); let i = S.findIndex((s, k) => !W.used.has('UNC' + k) && s.z > P.z + 20);
    if (i < 0) { U.holder.visible = false; U.state = 'gone'; return; }
    const s = S[i];
    if (U.state === 'lurk' && U.spot === i) return;
    U.state = 'lurk'; U.spot = i; U.t = 0;
    U.holder.visible = false;   // 숨어 있다 — 그 자리에 오면 눈앞에 불쑥
  }
  function scare(c) {
    const { P, G, A } = c;
    W.used.add('UNC' + U.spot);
    // 카메라가 보는 쪽 바로 앞 — 아이가 옆·뒤로 걷고 있어도 화면 안에 선다(2026-09-16 "자막만 나왔어").
    // 바위·벽에 걸려 밀려나는 자리는 버리고 좌우로 조금씩 비껴 본다
    const base = c.camYaw != null ? c.camYaw : P.yaw;
    let x = 0, z = 0, ok = false;
    for (const off of [0, .3, -.3, .6, -.6, .9, -.9]) {
      const a = base + off, cx = P.x + Math.sin(a) * 1.8, cz = P.z + Math.cos(a) * 1.8;
      const blocked = W.rocks.some(r => !r.pass && Math.hypot(cx - r.x, cz - r.z) < r.r - 1.7 + .45);
      if (!blocked && Math.abs(W.groundH(cx, cz) - P.y) < 1.2) { x = cx; z = cz; ok = true; break; }
    }
    if (!ok) { x = P.x + Math.sin(base) * 1.4; z = P.z + Math.cos(base) * 1.4; }
    U.state = 'scare'; U.t = 0;
    placeAt(x, z, Math.atan2(P.x - x, P.z - z)); U.holder.visible = true; play('yell', 1.25);
    (A.jump || A.jolt)(); G.shake = Math.max(G.shake || 0, 2.2); G.spike = Math.max(G.spike || 0, 1); P.speed = 0; G.busy = Math.max(G.busy || 0, 1.1);   // 흠칫 멈춘다
    G.blackT = .18;   // 등불이 꺼졌다 켜지면 코앞에 서 있다
    const S = spots(), line = LINES[S.length >= LINES.length ? U.spot : Math.round(U.spot * (LINES.length - 1) / Math.max(1, S.length - 1))];   // 자리가 대사보다 적으면 고르게 건너뛰어 마지막 대사는 꼭 나온다   // 자리마다 정해진 대사 — 이어하기·리트라이에도 처음 대사로 돌아가지 않는다(2026-09-16)
    setTimeout(() => { if (U.state === 'scare' && U.holder.visible) c.say(line); }, 450);   // 이미 사라졌으면 대사도 없다
    if (line === LINES[LINES.length - 1]) setTimeout(() => { A.whisper(); G.spike = Math.max(G.spike || 0, .5); }, 2600);   // '돌아보지 마라' — 등 뒤에서 속삭임
  }
  U.update = function (dt, t) {
    if (U.mixer) U.mixer.update(dt);
    if (U.fire) { const f = .8 + Math.sin(t * 11) * .1 + Math.sin(t * 17.3) * .08; U.fire.li.intensity = 2.2 * f; U.fire.ember.material.opacity = .65 + f * .25; }
  };
  window.UNCLE = U;
})();
