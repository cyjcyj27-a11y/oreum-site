// game.js — 조립과 한 판
(function () {
  const $ = id => document.getElementById(id);
  let cam, ren, scene, clock, loseT = -1, startT = 0;

  async function boot() {
    scene = new THREE.Scene(); T.scene = scene;
    cam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1200); T.camera = cam;
    ren = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
    ren.setPixelRatio(Math.min(devicePixelRatio, 2)); ren.setSize(innerWidth, innerHeight);
    ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
    ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 1.15;
    ren.outputColorSpace = THREE.SRGBColorSpace;
    T.renderer = ren;
    addEventListener('resize', onResize); onResize();

    await new Promise(r => setTimeout(r, 0));
    PARK.build(scene);
    window.__LOAD.set(0.45);
    await ANIM.load(p => window.__LOAD.set(0.45 + p * 0.4));
    for (const m of ['hero', 'girl', 'rgirl', 'rboy']) ANIM.measure(scene, m);
    // 패거리 옷을 미리 칠해 둔다 (싸움 중에 끊기지 않게)
    ZONE.prepMaps();
    window.__LOAD.set(0.92);
    FX.init(scene);
    PLAYER.spawn(scene);
    ALLY.spawn(scene);
    T.ken = PL.f; T.hiromi = ALLY.f;
    HUD.bind();
    onResize();   // 손가락 기기 표시(body.touch)가 붙은 뒤 한 번 더 — 세로로 열면 처음부터 전체화면 안내가 뜨게
    const s = U.loadSave();
    T.puz = {}; T.cans = 0; T.seeds = 0; T.bones = 0;
    if (s) { T.coins = s.coins || 0; T.taken = s.taken || {}; T.seen = s.seen || {}; T.puz = s.puz || {}; T.cans = s.cans || 0; T.seeds = s.seeds || 0; T.bones = s.bones || 0; }
    STORY.bind();
    // 음악(코드로 만든 산책 곡): 브라우저는 사람이 한 번 누른 뒤에야 소리를 낸다 — 타이틀에서 아무 데나 누르면 시작
    const kick = () => { AUD.music(); removeEventListener('pointerdown', kick); removeEventListener('keydown', kick); };
    addEventListener('pointerdown', kick); addEventListener('keydown', kick);
    ZONE.init(scene);
    MAP.init(scene);
    PUZ.init(scene);
    JOY.init(scene);
    PETS.init(scene);
    ZONE.paintFlags();
    // 저장이 있으면 [이어하기] + [처음부터 다시하기], 없으면 [시작]
    const KEYS = ['ueno.prog', 'ueno.catsFed', 'ueno.cats', 'ueno.stamps', 'ueno.charms', 'ueno.best', 'ueno.cans', 'ueno.trash', 'ueno.dogs', 'ueno.dogsFollow', 'ueno.pigeons'];
    const hasSave = (() => { try { return KEYS.some(k => localStorage.getItem(k) != null); } catch (e) { return false; } })();
    if (hasSave) {
      $('btnStart').style.display = 'none';
      $('btnCont').style.display = ''; $('btnCont').classList.remove('cont');
      $('btnReset').style.display = '';
    }
    // 처음부터 다시하기: 진행·고양이·스탬프·부적·등급 기록까지 전부 지우고 새로 불러온다 (한 번 더 눌러야 지운다)
    let sureT = 0;
    $('btnReset').onclick = () => {
      const b = $('btnReset');
      if (!b.classList.contains('sure')) {
        b.classList.add('sure'); b.textContent = '정말 처음부터?'; AUD.sfx('deny');
        clearTimeout(sureT); sureT = setTimeout(() => { b.classList.remove('sure'); b.textContent = '처음부터 다시하기'; }, 3000);
        return;
      }
      try { KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) { }
      location.reload();
    };
    // 시험 주소 ?test=fin : 앞 네 곳·퍼즐·착한 일을 다 한 것으로 치고 분수 광장 앞에서 시작 (저장은 건드리지 않는다)
    if (new URLSearchParams(location.search).get('test') === 'fin') {
      const SP = Storage.prototype, set = SP.setItem;
      SP.setItem = function (k, v) { if (/^ueno\.(snd|bgm)$/.test(k)) set.call(this, k, v); };   // 소리 설정만 저장
      SP.removeItem = function () { };
      const go = () => {
        T.testFin = true; T.coins = 300;
        T.taken = {}; DATA.ZONES.filter(z => !z.final).forEach(z => { T.taken[z.id] = true; });
        T.seen = { pre0: 1, pre1: 1, pre2: 1, pre3: 1 };
        T.puz = { duck: 1, lamp: 1, panda: 1, fount: 1 };
        PUZ.refresh(); ZONE.paintFlags();
        const fin = DATA.ZONES.find(z => z.final);
        PLAYER.reset(fin.x, fin.z + fin.r + 5, Math.PI); ALLY.reset(fin.x + 1.4, fin.z + fin.r + 5.6, Math.PI);
        start(false);
      };
      $('btnStart').onclick = go; $('btnCont').onclick = go;
      $('btnStart').style.display = ''; $('btnCont').style.display = 'none'; $('btnReset').style.display = 'none';
    } else
    $('btnStart').onclick = () => { U.wipe(); T.coins = 0; T.taken = {}; T.seen = {}; T.puz = {}; T.cans = 0; T.seeds = 0; T.bones = 0; PUZ.refresh(); ZONE.paintFlags(); start(true); };
    // 이어하기: 인트로를 봤거나 뭐라도 모았으면 인트로를 다시 틀지 않는다 (9/14 사장님 "이어하기했는데 인트로 또나옴")
    $('btnCont').onclick = () => {
      const sn = T.seen || {};
      let others = false; try { others = KEYS.some(k => k !== 'ueno.prog' && localStorage.getItem(k) != null); } catch (e) { }   // 고양이·스탬프 같은 모음 기록
      const played = sn.intro || sn.pre0 || Object.keys(T.taken).length || T.coins > 0 || T.cans || T.seeds || T.bones || others;
      start(!played);
    };
    $('btnRetry').onclick = retry;
    // 엔딩 화면 [처음부터 다시하기]: 타이틀의 것과 같다 — 한 번 더 눌러야 진행·고양이·스탬프·부적·강아지·비둘기 기록을 전부 지우고 새로 시작
    let againT = 0;
    $('btnAgain').onclick = () => {
      const b = $('btnAgain');
      if (!b.classList.contains('sure')) {
        b.classList.add('sure'); b.textContent = '정말 처음부터?'; AUD.sfx('deny');
        clearTimeout(againT); againT = setTimeout(() => { b.classList.remove('sure'); b.textContent = '처음부터 다시하기'; }, 3000);
        return;
      }
      try { KEYS.forEach(k => localStorage.removeItem(k)); } catch (e) { }
      location.href = location.pathname + (window.LANG && LANG.en ? '?lang=en' : '');   // ?test=fin 같은 시험 주소도 떼고 새로 (영문판은 lang 만 달고 간다)
    };

    // 타이틀: 입구에서 주인공이 이쪽을 보고 서 있다
    const st = PARK.start;
    PLAYER.reset(st.x, st.z, 0);
    ALLY.reset(st.x + 1.25, st.z - 0.35, -0.25);
    CAM.yaw = 0; CAM.pitch = 0.12;
    window.__LOAD.set(1);
    setTimeout(() => $('load').classList.add('gone'), 200);
    setTimeout(() => { $('load').style.display = 'none'; }, 1200);
    T.mode = 'title';
    $('title').classList.add('show');
    clock = new THREE.Clock();
    loop();
  }

  function start(fresh) {
    if (window.OG) OG.start({ taken: Object.keys(T.taken || {}).length });   // 사이트 지표(game-events.js)
    if (fresh && PL.f !== T.ken) PLAYER.swap(true);
    $('title').classList.remove('show');
    AUD.init(); AUD.resume(); AUD.music();
    T.mode = 'play'; T.paused = false;
    startT = performance.now();
    const st = PARK.start;
    PL.f.yaw = st.yaw; ALLY.f.yaw = st.yaw; CAM.yaw = 0; CAM.pitch = 0.3;
    HUD.show(true);
    // 새로 시작하면 입구에서 둘이 마주 보고 한마디
    if (fresh) {
      ALLY.f.pos.set(PL.f.pos.x + 1.3, 0, PL.f.pos.z - 0.9);
      PL.f.yaw = Math.atan2(1.3, -0.9); ALLY.f.yaw = PL.f.yaw + Math.PI;
      STORY.play(STORY.LINES.intro, { ken: T.ken, hiromi: T.hiromi }, () => { PL.f.yaw = st.yaw; });
      T.seen = T.seen || {}; T.seen.intro = 1; U.save();   // 한 번 봤으면 이어하기에서 다시 안 튼다
    }
  }

  function pause() {
    if (T.mode !== 'play') return;
    T.paused = !T.paused;
    $('tPause').textContent = T.paused ? '▶' : '❚❚';
    if (T.paused && document.pointerLockElement) document.exitPointerLock();
  }

  // 주인공이 쓰러짐: 느린 화면으로 쓰러지는 모습을 보여 주고 K.O. → GAME OVER
  function lose() { if (window.OG) OG.over({ result: 'KO', score: T.coins }); loseT = 2.6; AUD.sfx('lose'); T.slow = 0.3; T.slowT = 1.2; FX.banner('K.O.', 2.2); JOY.overBars(); HUD.boss(null); }
  function retry() {
    if (window.OG) OG.start({ retry: 1 });
    $('over').classList.remove('show');
    FX.clearAll();
    ZONE.retreat();
    T.mode = 'play'; T.paused = false;
  }
  function win() {
    if (window.OG) OG.over({ result: 'ENDING', score: T.coins });
    T.mode = 'clear';
    const secs = ((performance.now() - startT) / 1000) | 0;
    $('clRow').innerHTML = '🪙 ' + T.coins + ' &nbsp; ⏱ ' + ((secs / 60) | 0) + ':' + String(secs % 60).padStart(2, '0');
    $('clRanks').innerHTML = JOY.summary();
    $('clear').classList.add('show');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // 자판기
  function nearVend() {
    const f = PL.f; if (!f) return null;
    for (const v of PARK.C.vend) if (Math.hypot(v.x - f.pos.x, v.z - f.pos.z) < 1.9) return v;
    return null;
  }
  // 자판기: E 로 고르기 창을 열고 딸기우유(둘 다 ❤+80, 🪙30) · 고양이 캔 · 비둘기 모이 · 강아지 간식(각 🪙10)
  const VEND = { milk: 30, can: 10, seed: 10, bone: 10 };
  const ITEM = { can: ['cans', '[can]'], seed: ['seeds', '🌾'], bone: ['bones', '🦴'] };
  function act() {
    if (vendOpen()) { closeVend(); return; }
    if (PUZ.act() || JOY.act() || PETS.act()) return;
    const v = nearVend(), f = PL.f;
    if (!v || ZONE.active || f.state !== 'free' || PL.ride) return;
    f.yaw = v.a + Math.PI;
    openVend();
  }
  const vendOpen = () => $('vendMenu').classList.contains('show');
  function openVend() { if (document.pointerLockElement) document.exitPointerLock(); $('vendMenu').classList.add('show'); paintVend(); AUD.sfx('page'); }
  function closeVend() { $('vendMenu').classList.remove('show'); }
  function milkUseless() { const f = PL.f, al = ALLY.f; return f.hp >= f.hpMax && (al.dead || al.hp >= al.hpMax); }
  function paintVend() {
    $('vMilk').classList.toggle('dim', T.coins < VEND.milk || milkUseless());
    $('vCan').classList.toggle('dim', T.coins < VEND.can);
    $('vSeed').classList.toggle('dim', T.coins < VEND.seed);
    $('vBone').classList.toggle('dim', T.coins < VEND.bone);
    // 가진 개수 (칸 오른쪽 위 빨간 동그라미)
    for (const [id, key] of [['vCan', 'cans'], ['vSeed', 'seeds'], ['vBone', 'bones']]) {
      const u = $(id).querySelector('u'), n = String(T[key] || 0);
      if (u.textContent !== n) { u.textContent = n; u.classList.remove('bump'); void u.offsetWidth; u.classList.add('bump'); }
    }
  }
  function buy(kind) {
    const f = PL.f, al = ALLY.f;
    if (!vendOpen()) return;
    if (kind === 'milk') {
      if (T.coins < VEND.milk || milkUseless()) { AUD.sfx('deny'); return; }
      // 둘이 한 병씩
      T.coins -= VEND.milk; f.hp = Math.min(f.hpMax, f.hp + 80);
      if (!al.dead && al.hp < al.hpMax) { al.hp = Math.min(al.hpMax, al.hp + 80); FX.num(al, '+80', true); }
      AUD.sfx('vend'); setTimeout(() => AUD.sfx('drink'), 700);
      FX.num(f, '+80', true);
    } else if (ITEM[kind]) {
      const [key, icon] = ITEM[kind];
      if (T.coins < VEND[kind]) { AUD.sfx('deny'); return; }
      T.coins -= VEND[kind]; T[key] = (T[key] || 0) + 1;
      AUD.sfx('vend'); FX.num(f, icon + '+1', true);
    }
    U.save(); paintVend();
  }
  function vendUpdate() {
    if (!vendOpen()) return;
    // 자판기에서 멀어지거나 싸움·대화가 시작되면 닫는다
    if (T.mode !== 'play' || ZONE.active || !nearVend()) closeVend(); else paintVend();
  }

  function onResize() {
    if (!cam) return;
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    ren.setSize(innerWidth, innerHeight);
    const port = innerHeight > innerWidth * 1.08;
    $('rotate').style.display = (document.body.classList.contains('touch') && port) ? 'flex' : 'none';
  }

  function frame(dt) {
    // 느린 화면·타격 멈춤
    let gdt = dt;
    if (T.stopT > 0) { T.stopT -= dt; gdt = dt * 0.05; }
    else if (T.slowT > 0) { T.slowT -= dt; gdt = dt * T.slow; }
    T.dt = gdt; T.time += gdt;

    if (T.mode === 'play' && !T.paused) {
      HUD.read();
      PLAYER.step(gdt);
      ALLY.step(gdt);
      ZONE.update(gdt);
      PUZ.update(gdt);
      JOY.update(gdt);
      PETS.update(gdt);
      vendUpdate();
      if (loseT > 0) { loseT -= dt; if (loseT <= 0) { $('over').classList.add('show'); T.mode = 'over'; if (document.pointerLockElement) document.exitPointerLock(); } }
    } else if (T.mode === 'title') {
      T.titleA = (T.titleA || 0) + dt * 0.12;
      CAM.yaw = Math.sin(T.titleA) * 0.35; CAM.pitch = 0.1;
      PL.f.ch.play('idle', 0.2);
      PL.f.ch.holder.rotation.y = 0;
      ALLY.f.ch.play('idle', 0.2); ALLY.f.ch.holder.rotation.y = -0.25;
    } else if (T.mode === 'talk') {
      for (const f of [PL.f, ALLY.f].concat(ZONE.foes)) {
        FIGHT.step(f, gdt);
        if (f.state === 'free' && !f.leaving) f.ch.play(f.team === 'foe' || ZONE.active ? 'fightidle' : 'idle', 0.25);
      }
      STORY.update(dt);
    } else if (T.mode === 'over' || T.mode === 'clear') {
      for (const f of ZONE.foes) FIGHT.step(f, gdt);
      FIGHT.step(PL.f, gdt); FIGHT.step(ALLY.f, gdt);
    }
    if (!T.paused || T.mode !== 'play') {
      PL.f.ch.update(gdt); ALLY.f.ch.update(gdt);
      for (const f of ZONE.foes) f.ch.update(gdt);
      FX.update(gdt, cam);
    }
    CAMERA.update(dt, cam);
    PARK.update(gdt, cam, PL.f.pos);
    AUD.update(dt);
    HUD.paint(dt);
    MAP.update(dt);
  }

  function loop() {
    requestAnimationFrame(loop);
    let dt = clock.getDelta(); if (dt > 0.1) dt = 0.1;
    frame(dt);
    ren.render(scene, cam);
  }

  window.GAME = { boot, start, pause, lose, win, act, nearVend, buy, vendOpen, get scene() { return scene; } };

  // ── 시험 손잡이 (미리보기 창은 rAF 가 안 돈다 — 손으로 프레임을 돌린다) ──
  window.__ue = {
    tick(n, dt) { dt = dt || 1 / 60; for (let i = 0; i < (n || 1); i++) frame(dt); ren.render(scene, cam); return this.st(); },
    st() {
      const f = PL.f;
      return { mode: T.mode, p: [+f.pos.x.toFixed(2), +f.pos.z.toFixed(2)], s: f.state, clip: f.ch.cur, hp: f.hp, g: PL.gauge, coins: T.coins,
        al: { p: [+ALLY.f.pos.x.toFixed(1), +ALLY.f.pos.z.toFixed(1)], s: ALLY.f.state, hp: ALLY.f.hp, c: ALLY.f.ch.cur }, zone: ZONE.active && ZONE.active.id, wave: ZONE.wave, foes: ZONE.foes.map(o => ({ p: [+o.pos.x.toFixed(1), +o.pos.z.toFixed(1)], s: o.state, hp: o.hp, c: o.ch.cur, boss: o.boss })) };
    },
    tp(x, z, yaw) { PLAYER.reset(x, z, yaw || 0); ALLY.placeNearHero(); return this.st(); },
    hold(o) { window.__manual = true; Object.assign(PLAYER.IN, o); },
    press(k) { PLAYER.press(k); },
    cam(yaw, pitch) { CAM.yaw = yaw; if (pitch != null) CAM.pitch = pitch; CAM.auto = 99; },
    render() { ren.render(scene, cam); },
    shot(name, q) { ren.render(scene, cam); return fetch('http://127.0.0.1:8835/' + name, { method: 'POST', body: $('c').toDataURL('image/jpeg', q || 0.82) }).then(r => r.status); },
  };
})();
