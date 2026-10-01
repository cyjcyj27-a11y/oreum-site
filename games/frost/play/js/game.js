// game.js — 조립·한 판·쿠팔라의 밤·엔딩
(function () {
  const $ = id => document.getElementById(id);
  const L = U.L;
  let cam, ren, scene, lamp = null;
  const START = { x: 4, z: 28, yaw: 0.1 };
  const TITLE = { x: 2.7, z: 14 };   // 타이틀 장면은 장터 앞 그대로
  const MOBILE = matchMedia('(hover: none)').matches || /Android|iPhone|iPad/i.test(navigator.userAgent);
  const Q = MOBILE ? 0.6 : 1;

  async function boot() {
    const LD = window.__LOAD;
    scene = new THREE.Scene(); T.scene = scene;
    cam = new THREE.PerspectiveCamera(60, innerWidth / Math.max(1, innerHeight), 0.1, 640); T.camera = cam;
    ren = new THREE.WebGLRenderer({ canvas: $('c'), antialias: !MOBILE, powerPreference: 'high-performance' });
    ren.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.25 : 1.25));
    ren.setSize(innerWidth, innerHeight);
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = 1.0;
    ren.outputColorSpace = THREE.SRGBColorSpace;
    T.renderer = ren;
    addEventListener('resize', onResize);
    const tick = () => new Promise(r => setTimeout(r, 0));

    SKY.build(scene, ren); LD.set(0.08); await tick();
    TER.build(scene); LD.set(0.2); await tick();
    FLORA.build(scene, Q); LD.set(0.34); await tick();
    WORLD.build(scene); LD.set(0.4); await tick();
    // 시작·리스폰은 할머니네 현관 앞, 집을 보고 선다 (사장님 2026-09-17 "할머니집 앞에서 시작해야 제일 먼저 가 볼 듯")
    {
      const h = WORLD.HOME.h;
      if (h) {
        const [sx, sz] = h.L(-h.w * 0.15, -h.d / 2 - 5.5);
        START.x = sx; START.z = sz;
        START.yaw = Math.atan2(h.door[0] - sx, h.door[1] - sz);
      }
    }
    FLORA.buildGround(scene, Q); LD.set(0.44); await tick();
    ANIMALS.build(scene); LD.set(0.46); await tick();
    await PLAYER.load(p => LD.set(0.46 + p * 0.34));
    PLAYER.spawn(scene);
    LD.set(0.82);
    ITEMS.build(scene); LD.set(0.88); await tick();
    await QUESTS.build(scene);
    FEEL.build(scene);
    PHYS.build(scene);
    SNAKES.build(scene);
    FISHING.build(scene);
    PLAY.build(scene);
    RIDE.build(scene);
    COOK.build(scene);
    ISLAND.build(scene);
    HUNT.build(scene);
    TOOLS.build(scene);
    PLACES.build(scene);
    LD.set(0.96);
    HUD.bind();
    if (MOBILE) SKY.sun.shadow.mapSize.set(1024, 1024);

    lamp = new THREE.PointLight(0xffc880, 0, 16, 1.4);
    scene.add(lamp);

    const s = U.loadSave();
    if (s && (s.coins || Object.keys(s.got || {}).length || (s.basket && s.basket.length))) {
      $('btnCont').style.display = '';
      $('btnCont').onclick = () => { applySave(s); start(true); };
    }
    $('btnStart').onclick = () => { U.wipe(); fresh(); start(false); };
    $('btnRetry').onclick = retry;
    $('btnGo').onclick = () => { AUD.endMusic(false); $('over').classList.remove('show'); T.mode = 'play'; T.paused = false; T.clockFreeze = false; CAM.far = 0; PL.lockT = 0; HUD.show(true); kupalaScene(false); };   // 계속 놀기: 마을 사람들은 집으로, 시계는 다시 (2026-09-20)

    fresh();
    titlePose();
    // 첫 화면을 그려 둔 뒤 로딩을 걷는다
    ren.render(scene, cam);
    LD.set(1);
    setTimeout(() => $('load').classList.add('gone'), 200);
    setTimeout(() => { $('load').style.display = 'none'; }, 1200);
    T.mode = 'title';
    $('title').classList.add('show');
    // 도감 그림은 타이틀이 뜬 뒤 한 장씩. 다 구우면 아직 안 보이는 것들(물결·다리·얼음할아버지·고사리꽃…)의 셰이더를 미리 만들어 둔다
    //   — 안 하면 처음 헤엄칠 때처럼 처음 보는 재질에서 0.3초씩 멈췄다 (2026-10-01)
    { const t = setInterval(() => { if (!ITEMS.iconsStep()) { clearInterval(t); try { ren.compile(scene, cam); } catch (e) { console.warn('compile', e); } } }, 50); }
    AUD.init();
    clock = new THREE.Clock();
    loop();
  }

  function fresh() {
    T.coins = 0; T.basket = []; T.got = {}; T.bison = {}; T.tame = {}; T.dishes = []; T.cooked = {}; T.isl = { rot: 0, key: 0 }; T.hunted = 0; T.kills = 0; T.shop = {}; T.sold = 0; T.playT = 0; if (window.ISLAND) ISLAND.apply();
    T.fbag = {}; T.items = {}; T.quests = {}; T.love = 0; T.loved = {}; T.mik = {}; T.places = {}; T.met = false; FEEL.bagReset();
    T.clock = 7.2; T.ended = false; T.kupala = 0; T.clockFreeze = false;
    ITEMS.reset(); ITEMS.applyShop();
    T.tool = null; T.rest = {}; T.stow = {}; if (window.TOOLS) TOOLS.migrate();
    PLAYER.reset(START);
    CAM.yaw = START.yaw + Math.PI; CAM.pitch = 0.2;
    kupalaScene(false);
  }

  function applySave(s) {
    fresh();
    T.coins = s.coins || 0; T.basket = s.basket || [];
    // 시험용: 내 컴퓨터(파일로 열기·localhost)에서만 주소 끝 ?coins=9700 으로 코인을 맞춘다. 한 번 쓰면 주소에서 지운다 (사장님 2026-10-01)
    { const m = /[?&]coins=(\d+)/.exec(location.search);
      if (m && (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) {
        T.coins = +m[1]; s.coins = T.coins; setTimeout(() => U.save(), 1500);
        try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])coins=\d+&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) { }
      } } T.got = s.got || {}; T.shop = s.shop || {};
    T.bison = s.bison || {}; T.tame = s.tame || {}; T.sold = s.sold || 0; T.playT = s.t || 0;
    T.fbag = s.fbag || {}; T.items = s.items || {}; T.quests = s.q9 || {};
    delete T.items.meat;   // 고기 한 덩이(2026-09-19)는 멧돼지 통째(2026-09-20)로 바뀜   // 부탁 목록이 바뀌어(2026-09-18) 옛 q5 는 버림
    if (!s.q9 && s.q8) { const M = { 0: 0, 1: 1, 2: 2, 3: 3, 7: 4, 8: 5 }; for (const k in s.q8) if (M[k] != null) T.quests[M[k]] = s.q8[k]; }   // 2026-09-19 얀카 부탁(4·5·6) 뺌
    else if (!s.q9 && s.q7) { const M = { 0: 0, 1: 1, 2: 2, 3: 3, 8: 4, 10: 5 }; for (const k in s.q7) if (M[k] != null) T.quests[M[k]] = s.q7[k]; }   // 옛 판: 둥지·얀카 부탁 뺌
    else if (!s.q9 && s.q6) for (const k in s.q6) { const i = +k; if (i < 4) T.quests[i] = s.q6[k]; else if (i > 4) T.quests[i - 1] = s.q6[k]; }   // 2026-09-19 할머니 부탁(4번) 뺌 — 뒤 번호를 당긴다
    T.dishes = s.dishes || []; T.cooked = s.cooked || {};
    T.isl = s.isl || { rot: 0, key: 0 };
    // 안전장치(2026-09-21 사장님 "돈없는데 호수섬 들어옴"): 코인 1만을 넘긴 적이 없는데 섬이 열려 있거나 횃불·다리·할아버지가 진행돼 있으면
    //   봇 시험이나 옛 판에서 온 상태다 → 섬 이야기만 처음으로 되돌린다(코인·물건·도감은 그대로). 열린 뒤엔 상점에 써도 9천 밑으론 안 내려간다
    if ((T.isl.open || T.isl.bridge || T.isl.key > 0) && (s.coins || 0) < 9000) { T.isl = { rot: 0, key: 0 }; s.ended = false; if (s.tool === 'torch') s.tool = null; }
    T.hunted = s.hunted || 0; T.kills = s.kills != null ? s.kills : T.hunted; ISLAND.apply();
    T.fish = s.fish || {}; T.did = s.did || {}; T.liked = s.liked || {};
    T.love = s.love || 0; T.loved = s.loved || {}; T.mik = s.mik || {}; T.places = s.places || {}; T.met = s.met != null ? !!s.met : true;
    T.bag = s.bag || { held: true, x: null, z: null };   // 옛 저장은 들고 있던 것으로   // 옛 14집 기록(quests)은 버린다
    T.clock = s.clock != null ? s.clock : 7.2;
    T.kupala = s.kupala || 0; T.ended = !!s.ended;
    T.tool = s.tool || null; T.rest = s.rest || {}; T.stow = s.stow || {}; if (window.TOOLS) TOOLS.migrate();
    ITEMS.applyShop();
    if (s.pos && s.map === 3) { PLAYER.reset({ x: s.pos[0], z: s.pos[2], yaw: s.pos[3] }); CAM.yaw = s.pos[3] + Math.PI; }
    if (T.kupala === 2) { T.clock = 21.9; T.clockFreeze = true; kupalaScene(true); }
    if (T.kupala >= 3) { ITEMS.fern.visible = true; ITEMS.fern.userData.open = 1; WORLD.lightFire(true); }
  }

  function titlePose() {
    // 타이틀: 장터 앞, 교회를 등지고 선 주인공을 비스듬히
    PLAYER.reset(TITLE);
    PL.yaw = 2.6;
    PL.ch.holder.rotation.y = PL.yaw;
    CAM.yaw = 2.6 + 0.5; CAM.pitch = 0.08;
    CAM.target.set(PL.pos.x, PL.pos.y + 1.4, PL.pos.z);
  }

  // 프롤로그 (사장님 2026-09-18 — 민스크 외곽에서 술·폭력을 피해 할머니네로 온 아이. 소원은 끝에서 드러낸다)
  const STORY = {
    ko: ['민스크 외곽, 낡은 아파트.\n밤마다 술 냄새와 고함이 났다.', '여름 방학 첫날, 나는 가방 하나만 들고\n새벽 버스를 탔다.', '할머니는 아무것도 묻지 않고\n나를 꼭 안아 주셨다.', '호수 너머 얼음 속에 잠든 할아버지가\n소원을 하나 들어준대.', '내 소원은 이미 정해져 있다.'],
    en: ['An old apartment on the edge of Minsk.\nEvery night: the smell of vodka and shouting.', 'On the first day of summer break I took\nthe dawn bus with just one bag.', 'Grandma asked nothing.\nShe just held me tight.', 'They say an old man asleep in the ice\nbeyond the lake grants one wish.', 'I already know what I will wish for.'],
  };
  // 마지막 엔딩 문장 (사장님 2026-09-18) — 고사리꽃이 핀 뒤 CLEAR 앞에 띄운다
  // 고사리꽃 앞에서 소원을 드러낸다 (사장님 2026-09-19 "소원은 고사리꽃 앞에서 끝에 드러내줘") → 마지막 문장
  // 2026-09-19 소원은 얼음할아버지가 들어준다 — 마지막은 할아버지의 말 (사장님 "엔딩 할아버지 말 [부모는 자격이 있어서 되는 게 아니다]")
  const ENDING = {
    ko: ['꽃 앞에서 얼음할아버지의 말이 떠올랐다.\n"소원을 하나 들어주마."', '나는 눈을 감았다.\n처음부터 정해 둔 소원이 있었다.', '엄마 아빠가…\n사라지게 해 주세요.', '할아버지는 한참 나를 내려다보았다.', '"부모 같지 않은 부모는\n전 세계 어디에나 있다."', '"부모는 자격이 있어서 되는 게 아니다."'],
    en: ['Before the flower, Grandfather Frost\'s words came back to me.\n"I will grant you one wish."', 'I closed my eyes.\nI had known my wish from the start.', 'Please make Mom and Dad…\ndisappear.', 'The old man looked down at me for a long time.', '"Parents who are nothing like parents\nare everywhere in the world."', '"No one becomes a parent because they are qualified."'],
  };
  function intro(after, book) {
    book = book || STORY;
    const lines = T.lang === 'ru' ? book.ko.map((k, i) => U.L(k, book.en[i])) : book[T.lang];
    let i = 0;
    const el = $('intro'), tx = $('introTxt');
    const done = () => { el.classList.remove('show'); el.onclick = null; removeEventListener('keydown', key); after(); };
    const step = () => {
      if (i >= lines.length) return done();
      tx.textContent = lines[i++];
      tx.classList.remove('in'); void tx.offsetWidth; tx.classList.add('in');
      AUD.sfx('page');
    };
    const key = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); step(); } if (e.code === 'Escape') done(); };
    addEventListener('keydown', key);
    $('skip').onclick = e => { e.stopPropagation(); done(); };
    el.classList.add('show');
    el.onclick = step;
    step();
  }

  function start(skipStory) {
    $('title').classList.remove('show');
    AUD.init(); AUD.resume();
    if (!skipStory) { intro(() => start(true)); return; }
    PL.yaw = START.yaw;
    if (T.mode === 'title') { CAM.yaw = PL.yaw + Math.PI; CAM.pitch = 0.22; }
    T.mode = 'play'; T.paused = false;
    HUD.show(true);
    // 시작할 때 마우스를 잠그지 않는다 (사장님 2026-10-01 "게임시작할때 마우스가 화면에 붙어있지않게") — 시점은 끌거나 WASD 로
    if (window.gtag) try { gtag('event', 'game_start', { game: 'fernflower' }); } catch (e) { }
  }

  function pause() {
    if (T.mode !== 'play' || HUD.panel) return;
    T.paused = !T.paused;
    $('tPause').textContent = T.paused ? '▶' : '❚❚';
    $('pauseOv').classList.toggle('show', T.paused);
    if (T.paused && document.pointerLockElement) document.exitPointerLock();
  }

  // 멧돼지에 받히면 죽는다 (사장님 2026-09-18 "멧돼지한테 받히면 죽는걸로 하자") — 넘어지는 걸 보여 준 뒤 GAME OVER → RETRY 는 할머니네 앞
  let dying = false;
  function die() {
    if (dying || T.mode !== 'play') return;
    dying = true;
    if (window.gtag) try { gtag('event', 'game_over', { game: 'fernflower', result: 'boar' }); } catch (e) { }
    setTimeout(() => {
      T.mode = 'dead'; T.paused = true;
      if (document.pointerLockElement) document.exitPointerLock();
      $('dead').classList.add('show');
    }, 1400);
  }
  function retry() {
    if (T.mode !== 'dead') return;
    $('dead').classList.remove('show');
    fadeTo(() => {
      PLAYER.reset(START); CAM.yaw = START.yaw + Math.PI;
      T.mode = 'play'; T.paused = false; dying = false;
      $('pauseOv').classList.remove('show'); $('tPause').textContent = '❚❚';
      U.save();
    });
  }
  addEventListener('keydown', e => { if (T.mode === 'dead' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) { e.preventDefault(); retry(); } });

  function respawn() {
    if (T.mode !== 'play' || T.paused) return;
    fadeTo(() => { PLAYER.reset(START); CAM.yaw = START.yaw + Math.PI; });
  }

  let fadeBusy = false;
  function fadeTo(mid) {
    if (fadeBusy) return;
    fadeBusy = true;
    const f = $('fade');
    f.classList.add('on');
    setTimeout(() => { mid(); setTimeout(() => { f.classList.remove('on'); fadeBusy = false; }, 250); }, 700);
  }

  // ── 쿠팔라의 밤 ──
  function kupalaScene(on) {
    WORLD.lightFire(on);
    QUESTS.gather(on);
    ANIMALS.showTrail(on);
    ITEMS.fern.visible = on || T.kupala >= 3;
  }
  function kupalaNight() {
    PLAYER.doAct('idle', 0.8);
    fadeTo(() => {
      T.clock = 21.9; T.clockFreeze = true;
      T.kupala = 2;
      kupalaScene(true);
      U.save();
      setTimeout(() => FX.praise(L('쿠팔라의 밤', 'KUPALA NIGHT')), 400);
    });
  }
  function fernBloom() {
    const f = ITEMS.fern;
    PL.yaw = Math.atan2(f.position.x - PL.pos.x, f.position.z - PL.pos.z);
    PLAYER.doAct('kneel', 1.6, { from: 0.3 });
    f.userData.opening = true;
    AUD.sfx('bloom');
    T.kupala = 3;   // 고사리꽃은 엔딩도 축하도 아니다 — 꽃만 핀다 (사장님 2026-09-19 "고사리꽃 축하는 아예 빼버리고")
    U.save();
  }
  // 얼음할아버지가 풀려나 소원을 들어준다 → 엔딩 (island.js)
  function frostEnd(F) {
    if (ending || T.ended) return;
    if (F) PL.yaw = Math.atan2(F.x - PL.pos.x, F.z - PL.pos.z);
    PL.lockT = 12;
    T.ended = true; U.save();
    CAM.far = 5.5;
    endT = 0;
    ending = 'frost';
  }

  // ── 엔딩 스토리 장면: 쿠팔라의 밤 (사장님 2026-09-20 "얼음할아버지 얘기듣고 쿠팔라의 밤 축제 고사리꽃 엔딩은 스토리 장면으로", "엔딩을 9번으로 스토리영상으로") ──
  //   할아버지가 소원을 들어주겠다고 한 뒤: 밤이 되고 마을 사람들이 모닥불을 돈다 → 알레샤 → 반딧불 길 → 고사리꽃이 핀다 → 소원 글
  const SHOTS = [
    { dur: 8, cap: ['그날 밤, 쿠팔라의 밤이 왔다.\n마을 사람들이 모닥불 둘레를 돌았다.', 'That night was Kupala Night.\nThe whole village circled the bonfire.'] },
    { dur: 6, cap: null },   // 알레샤 (사랑 이야기가 있으면 그 말)
    { dur: 7, cap: ['반딧불이 원시림으로 길을 알려 주었다.', 'The fireflies showed the way into the old forest.'] },
    { dur: 8, cap: ['고사리꽃이 피었다.', 'The fern flower bloomed.'] },
  ];
  let story = null;
  const _sp = new THREE.Vector3(), _st = new THREE.Vector3();
  function kupalaStory() {
    fadeTo(() => {
      T.clock = 21.9; T.clockFreeze = true; T.kupala = 2; kupalaScene(true);
      const B = TER.Z.bonfire;
      PLAYER.reset({ x: B.x + 6.2, z: B.z + 0.5, yaw: Math.atan2(B.x - (B.x + 6.2), B.z - (B.z + 0.5)) });
      PL.lockT = 999; PL.act = null;
      story = { i: 0, t: 0, done: false };
      ending = 'story'; endT = 0;
      HUD.show(false);
      $('cap').classList.add('show');
      const skip = e => { if (e && e.type === 'keydown' && !(e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) return; storyEnd(); };
      story.skip = skip; addEventListener('keydown', skip); $('cap').addEventListener('click', skip);
    });
  }
  function storyEnd() {
    if (!story || story.done) return;
    story.done = true; removeEventListener('keydown', story.skip); $('cap').removeEventListener('click', story.skip);
    window.__eye = null; ending = false;
    $('cap').classList.remove('show');
    T.kupala = 3; if (ITEMS.fern) { ITEMS.fern.userData.opening = true; ITEMS.fern.visible = true; }
    T.mode = 'over'; if (document.pointerLockElement) document.exitPointerLock();
    U.save();
    intro(showOver, ENDING);
  }
  function storyStep(dt) {
    const S = story; if (!S || S.done) return;
    const sh = SHOTS[S.i]; S.t += dt;
    const B = TER.Z.bonfire, Fz = TER.Z.fern, k = Math.min(1, S.t / sh.dur);
    const cap = $('capTxt');
    if (S.i === 0) {   // 모닥불 둘레를 도는 사람들, 카메라가 천천히 돈다
      const a = 2.2 + S.t * 0.18;
      _sp.set(B.x + Math.cos(a) * 11, TER.H(B.x, B.z) + 4.2, B.z + Math.sin(a) * 11); _st.set(B.x, TER.H(B.x, B.z) + 1.6, B.z);
      if (S.t < 0.05) cap.textContent = L(sh.cap[0], sh.cap[1]);
    } else if (S.i === 1) {   // 알레샤 곁으로
      const g = QUESTS.res.find(r => r.P.id === 'girl');
      if (g) { const p = g.holder.position; const a = Math.atan2(p.x - B.x, p.z - B.z);
        _sp.set(p.x + Math.sin(a) * 2.6, p.y + 1.55, p.z + Math.cos(a) * 2.6); _st.set(p.x, p.y + 1.35, p.z); }
      if (S.t < 0.05) { cap.textContent = T.love >= 2 ? L('알레샤가 내 손을 잡았다.\n"봐, 안 놓쳤지?"', 'Alesya took my hand.\n"See? I didn\'t let go."') : L('알레샤가 나를 보고 웃었다.', 'Alesya looked at me and smiled.'); if (T.love >= 2 && g && window.PLAY) PLAY.hearts({ x: g.holder.position.x, z: g.holder.position.z, h: { floor: g.holder.position.y }, P: g.P }); }
    } else if (S.i === 2) {   // 모닥불에서 고사리꽃 쪽으로 반딧불 길을 따라 미끄러진다
      const e = k * k * (3 - 2 * k);
      const x = B.x + (Fz.x - B.x) * e, z = B.z + (Fz.z - B.z) * e;
      const x2 = B.x + (Fz.x - B.x) * Math.min(1, e + 0.08), z2 = B.z + (Fz.z - B.z) * Math.min(1, e + 0.08);
      _sp.set(x, TER.H(x, z) + 2.4, z); _st.set(x2, TER.H(x2, z2) + 1.2, z2);
      if (S.t < 0.05) cap.textContent = L(sh.cap[0], sh.cap[1]);
    } else {   // 고사리꽃이 핀다
      if (S.t < 0.05) { cap.textContent = L(sh.cap[0], sh.cap[1]); if (ITEMS.fern) { ITEMS.fern.visible = true; ITEMS.fern.userData.opening = true; } AUD.sfx('bloom'); }
      const a = 0.6 + S.t * 0.12;
      _sp.set(Fz.x + Math.sin(a) * 2.6, TER.H(Fz.x, Fz.z) + 1.5, Fz.z + Math.cos(a) * 2.6); _st.set(Fz.x, TER.H(Fz.x, Fz.z) + 0.9, Fz.z);
    }
    window.__eye = { p: _sp.toArray(), t: _st.toArray(), hide: false };
    if (S.t >= sh.dur) { S.i++; S.t = 0; if (S.i >= SHOTS.length) storyEnd(); }
  }
  let ending = false, endT = 0;
  function endingStep(dt) {
    if (ending === 'story') { storyStep(dt); return; }
    endT += dt;
    CAM.yaw += dt * 0.25;
    CAM.pitch = U.damp(CAM.pitch, 0.25, 2, dt);
    if (ending === 'frost') {   // 할아버지 곁에서 천천히 돌다가 소원 장면
      if (endT > 1.5) { ending = false; kupalaStory(); }   // 대사 둘(13초)은 island.js 가 다 띄운 뒤 부른다 — 여기선 숨만 고른다   // 할아버지 말을 듣고 → 쿠팔라의 밤 스토리 장면
      return;
    }
    if (endT > 3.3 && endT - dt <= 3.3) PLAYER.doAct('victory', 4.2);
    if (endT > 7.5 && endT - dt <= 7.5) PLAYER.doAct('dance', 5);
    if (ending === 'fern' && endT > 10) {   // 고사리꽃은 축하만 하고 계속 논다
      ending = false; PL.lockT = 0; CAM.far = 0; PL.act = null;
      FX.praise(L('고사리꽃', 'FERN FLOWER'));
      return;
    }
    if (endT > 10) {
      ending = false;
      T.mode = 'over';
      if (document.pointerLockElement) document.exitPointerLock();
      intro(showOver, ENDING);
    }
  }
  function showOver() {
    {
      const c = ITEMS.counts();
      const secs = T.playT | 0, hh = (secs / 3600) | 0, mm = ((secs % 3600) / 60) | 0;
      $('ovRow').innerHTML = '🍄 ' + c.m + ' &nbsp; 🦬 ' + c.b + ' &nbsp; 🐟 ' + c.k;   // 부탁(🏠)은 뺐다 (2026-09-20)
      $('ovRow2').innerHTML = '🪙 ' + T.coins + ' &nbsp; ⏱ ' + (hh ? hh + ':' : '') + String(mm).padStart(hh ? 2 : 1, '0') + ':' + String(secs % 60).padStart(2, '0');
      $('over').classList.add('show');
      if (document.pointerLockElement) document.exitPointerLock();
      if (window.gtag) try { gtag('event', 'game_over', { game: 'fernflower', result: 'clear' }); } catch (e) { }
    }
  }

  function setLamp(on) { T.lampOn = on; }

  function onResize() {
    cam.aspect = innerWidth / Math.max(1, innerHeight);
    cam.updateProjectionMatrix();
    ren.setSize(innerWidth, innerHeight);
    const port = innerHeight > innerWidth * 1.08;
    $('rotate').style.display = (HUD.touch && port) ? 'flex' : 'none';
  }

  let clock, saveT = 0, stepT = 0, tTitle = 0;
  function frame(dt) {
    T.dt = dt; T.time += dt;
    if (T.mode === 'play' && !T.paused) {
      T.playT += dt;
      if (!T.clockFreeze) { T.clock += dt / 30; if (T.clock >= 24) T.clock -= 24; }
      HUD.read();
      if (ending) { PLAYER.step(dt, CAM.yaw); endingStep(dt); }
      else {
        PLAYER.step(dt, CAM.yaw);
        if (PLAYER.IN.actEdge) { PLAYER.IN.actEdge = false; if (PL.aim) { } else if (PL.dive) FISHING.thrust(); else if (!PL.act) ITEMS.act(); }   // 발사는 클릭·쏘기 단추 (2026-09-20)
      }
      ITEMS.update(dt, cam);
      footsteps(dt);
      saveT += dt;
      if (saveT > 10) { saveT = 0; U.save(); }
    } else {
      PLAYER.IN.actEdge = false; PLAYER.IN.jumpEdge = false; PLAYER.IN.bagEdge = false;
      if (T.mode === 'title') {
        tTitle += dt;
        CAM.yaw = 2.6 + 0.5 + Math.sin(tTitle * 0.08) * 0.25;
        CAM.pitch = 0.08 + Math.sin(tTitle * 0.05) * 0.04;
        T.clock = 7.6;
      }
      if (T.mode === 'over') { CAM.yaw += dt * 0.12; ITEMS.update(dt, cam); }
    }
    PLAYER.update(dt);
    ANIMALS.update(dt, PL);
    RIDE.after(dt);
    RIDE.update(dt);
    COOK.update(dt);
    ISLAND.update(dt);
    HUNT.update(dt);
    CAMERA.update(dt, cam);
    QUESTS.update(dt, cam);
    FEEL.update(dt);
    PHYS.update(dt);
    TOOLS.update(dt);
    SNAKES.update(dt);
    FISHING.update(dt);
    PLAY.update(dt);
    PLACES.update(dt);
    if (window.__eye) { cam.position.fromArray(window.__eye.p); cam.lookAt(new THREE.Vector3().fromArray(window.__eye.t)); PL.ch.holder.visible = !window.__eye.hide; }
    SKY.update(dt, cam, PL.pos);
    FISHING.after(cam);
    TER.update(dt);
    FLORA.update(cam);
    WORLD.update(dt, SKY.cur.night);
    // 등불
    if (lamp) {
      lamp.intensity = SKY.cur.night * 26;   // 상점 등불을 빼면서 늘 켠다 (2026-09-19)
      lamp.visible = lamp.intensity > 0.05;
      lamp.position.set(PL.pos.x, PL.pos.y + 1.9, PL.pos.z);
    }
    FX.update(dt);
    AUD.update(dt);
    HUD.paint(dt);
  }
  // 느리면 해상도를 낮추고, 여유가 생기면 되돌린다
  let slowAvg = 1 / 60, prScale = 1, prT = 0;
  function adapt(dt) {
    slowAvg = slowAvg * 0.95 + dt * 0.05;
    prT += dt;
    if (prT < 2) return;
    const base = Math.min(devicePixelRatio, 1.25);
    let next = prScale;
    if (slowAvg > 1 / 40 && prScale > 0.55) next = Math.max(0.55, prScale - 0.15);
    else if (slowAvg < 1 / 57 && prScale < 1) next = Math.min(1, prScale + 0.1);
    if (next !== prScale) { prScale = next; prT = 0; ren.setPixelRatio(base * prScale); ren.setSize(innerWidth, innerHeight); }
  }
  function loop() {
    requestAnimationFrame(loop);
    let dt = clock.getDelta();
    if (dt > 0.1) dt = 0.1;
    if (T.mode === 'play' || T.mode === 'title') adapt(dt);
    frame(dt);
    ren.render(scene, cam);
  }

  function footsteps(dt) {
    if (PL.state !== 'ground' || PL.act) { stepT = 0.2; return; }
    const s = Math.hypot(PL.vel.x, PL.vel.z);
    if (s < 0.6) return;
    stepT -= dt * s;
    if (stepT <= 0) { stepT = PL.swim ? 2.4 : 1.5; AUD.sfx(PL.swim ? 'swim' : 'step', U.clamp(s / 6, 0.35, 1)); }
  }

  window.GAME = { die, boot, start, pause, respawn, fadeTo, kupalaNight, fernBloom, frostEnd, lamp: setLamp, get scene() { return scene; } };

  // ── 시험 손잡이 ──
  window.__ff = {
    tick(n, dt) { dt = dt || 1 / 60; for (let i = 0; i < (n || 1); i++) frame(dt); ren.render(scene, cam); return this.st(); },
    st() {
      return { mode: T.mode, p: PL.pos.toArray().map(v => +v.toFixed(2)), yaw: +PL.yaw.toFixed(2), s: PL.state, clip: PL.ch && PL.ch.cur,
        swim: PL.swim, wade: +PL.wade.toFixed(2), near: ITEMS.near && ITEMS.near.label, basket: T.basket.length,
        coins: T.coins, got: ITEMS.counts(), clock: +T.clock.toFixed(2), kupala: T.kupala };
    },
    hold(o) { window.__hold = !!o; if (o) Object.assign(PLAYER.IN, o); },
    tap(k) { if (k === 'jump') PLAYER.IN.jumpEdge = true; if (k === 'act') PLAYER.IN.actEdge = true; },
    tp(x, z, yaw) { PLAYER.reset({ x, z, yaw: yaw || 0 }); CAM.yaw = (yaw || 0) + Math.PI; CAM.target.set(PL.pos.x, PL.pos.y + 1.4, PL.pos.z); return this.st(); },
    cam(yaw, pitch) { CAM.yaw = yaw; if (pitch != null) CAM.pitch = pitch; },
    clock(h) { T.clock = h; },
    start() { start(true); },
    all(n) { for (const t of 'mfnb') for (let i = 0; i < (n || 12); i++) T.got[t + i] = true; },
    shot() { ren.render(scene, cam); return ren.domElement.toDataURL('image/jpeg', 0.85); },
    size(w, h) { ren.setPixelRatio(1); ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); },
    info() { return ren.info.render; },
    eye(p, t, hide) { window.__eye = p ? { p, t, hide } : null; },
  };
})();
