// 메인 루프 — 세계 조립, 입력, 카메라, HUD, 제목 화면, 물속·비행 화면 효과
(function () {
  const LOAD = window.__LOAD || { set: function () {} };
  const canvas = document.getElementById('c');
  const IS_TOUCH = 'ontouchstart' in window;
  const QS = new URLSearchParams(location.search);   // 시험용: ?post=0 &shadow=2048 &dpr=1 &msaa=0 &reset=1
  // ?reset=1 — 저장된 진행(돈·땅·자리)을 지우고 처음부터. 시험용
  // ?intro=1 — 해안도로 자동 주행 연출. 홍보 영상 찍을 때만 쓴다(게임에서는 안 나온다)
  // ?shot=1  — 촬영용: 화면 글자·단추를 감추고, 그림판을 지우지 않아 한 장씩 뽑을 수 있게 한다
  const SHOT = QS.get('shot') === '1';
  if (SHOT) document.body.classList.add('shot');
  if (QS.get('reset')) { try { localStorage.removeItem('jeju.prog'); localStorage.removeItem('jeju.pos'); } catch (e) {} }
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: SHOT });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, +(QS.get('dpr') || 1.25)));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.3, 14000);
  POST.init(renderer, IS_TOUCH, QS.has('msaa') ? +QS.get('msaa') : null, QS.get('post') === '0');
  function resize() { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); POST.resize(); }
  window.addEventListener('resize', resize); resize();

  TEX.init(); SKY.init(scene, IS_TOUCH, QS.get('shadow') ? +QS.get('shadow') : 0); SKY.update(0); SKY.initEnv(renderer, scene);
  camera.position.set(0, 300, -1500); camera.lookAt(0, 100, 0);
  POST.render(scene, camera, 0.016);

  const input = { keys: {}, padF: 0, padS: 0, brake: false, horn: false, touch: false };
  const orbit = { yaw: 0, pitch: 0, idle: 0, zoom: 1 };   // zoom: 휠·두 손가락으로 당기고 미는 배율(0.35~2.5)
  let started = false, last = 0, titleT = 0, ready = false;
  const KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1, Space: 1, KeyH: 1, ShiftLeft: 1, ShiftRight: 1 };
  const $ = id => document.getElementById(id);
  const clockEl = $('time'), title = $('title'), topbar = $('topbar'), keys = $('keys'), speedEl = $('speed'), btnSfx = $('btnSfx');
  let spawn = null;

  // 세계를 한 번에 조립하면 그 몇 초 동안 화면이 멈춰 LOADING 숫자가 안 움직인다.
  // 한 덩어리씩 만들고 그때마다 브라우저에 화면 한 장을 내준다 (사장님 2026-09-12)
  const nextFrame = () => new Promise(res => { let done = false; const go = () => { if (done) return; done = true; res(); };
    requestAnimationFrame(() => setTimeout(go, 0)); setTimeout(go, 80); });
  const step = p => { LOAD.set(p); return nextFrame(); };
  TEX.load().then(async function boot() {
    await step(0.62);
    ISLAND.init(scene); await step(0.70);
    ROADS.init(scene); await step(0.76);
    CITY.init(scene); await step(0.82);
    LANDMARKS.init(scene); await step(0.90);
    CITY.finishProps(scene); await step(0.93);
    // 출발: 공항 렌터카 앞 도로.
    // 공항 자리를 그대로 집으면 터미널(90×26m) 안이라 차가 건물 속에서 깨어난다.
    // 렌터카 줄(landmarks.js 의 x+60, z+26)에 가장 가까운 도로 마디를 쓴다.
    // **교통차보다 먼저** 정한다 — 그래야 그 자리를 비워 둘 수 있다 (사장님 2026-09-11)
    const ap = SPOTS.list.find(s => s.id === 'airport');
    const nd = ROADS.nearest(ap.x + 60, ap.z + 26).e.a;
    const e = nd.out[0]; spawn = { x: nd.x, z: nd.z, yaw: e ? Math.atan2(-e.dir.x, -e.dir.z) : 0, node: nd };
    TRAFFIC.init(scene, spawn); await step(0.95);
    PLAYER.init(scene, spawn); ACT.init(scene); await step(0.97);
    ESTATE.init(scene); await step(0.99);
    NPC.init(scene); PEOPLE.init(scene, renderer); PET.init(scene);
    LOAD.set(1);
    ready = true; document.body.classList.add('ready');
    // 막 지우고 들어온 판(?reset=1)에서는 이어하기를 숨긴다 — 지웠는데 이어하기가 보이면 헷갈린다
    if (!QS.get('reset') && (loadPos() || hasSave())) $('goCont').hidden = false;
    // ?reset=1 로 다시 들어오면 제목 화면을 띄운다. 여기서 바로 시작해 버리면 '시작'을 누른 손짓이 없어
    // 브라우저가 인트로 영상을 막는다(소리 있는 영상은 손짓이 있어야 틀린다). 사장님 2026-09-10
    // 촬영(?intro=1)·시험(?novideo=1)일 때만 제목 화면을 건너뛰고 바로 시작한다
    if (QS.get('reset') && (QS.get('intro') === '1' || QS.get('novideo') === '1')) start(false);
  });

  // ── 이어하기: 차가 길 위에 있을 때 자리·방향·시각을 2초마다 localStorage 에 적고, 이어하기로 시작하면 그 자리에 다시 선다 ──
  const POS_KEY = 'jeju.pos'; let posT = 0;
  function hasSave() { try { return !!localStorage.getItem('jeju.prog'); } catch (e) { return false; } }
  function loadPos() { try { const j = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); return j && isFinite(j.x) && isFinite(j.z) ? j : null; } catch (e) { return null; } }
  function savePos() {
    if (!started || PLAYER.mode !== 'ground' || (window.PET && PET.onFoot) || ISLAND.H(PLAYER.x, PLAYER.z) < 0.4) return;
    try { localStorage.setItem(POS_KEY, JSON.stringify({ x: +PLAYER.x.toFixed(1), z: +PLAYER.z.toFixed(1), yaw: +PLAYER.yaw.toFixed(3), hour: +SKY.hour.toFixed(2), t: Date.now() })); } catch (e) {}
  }
  function start(resume) {
    if (started || !ready) return;
    const pos = resume ? loadPos() : null;
    if (pos) { PLAYER.setVehicle(PLAYER.car, pos.x, pos.z, pos.yaw); PLAYER.safe = { x: pos.x, z: pos.z, yaw: pos.yaw }; if (isFinite(pos.hour)) SKY.hour = pos.hour; if (window.PET && PET.board) PET.board(); orbit.yaw = 0; orbit.pitch = 0; }
    started = true; AUDIO.init();
    title.classList.add('hide'); topbar.classList.add('show'); keys.classList.add('show'); speedEl.classList.add('show');
    // 오프닝을 뺐다 (사장님 2026-09-11 "오프닝을 빼자"). 게임은 공항 앞에 선 채로 바로 시작하고,
    // 유학 친구 전화가 그 자리에서 걸려 온다 — 대사는 CALL 의 기본값.
    // 찍을 때만 쓰는 연출은 주소로 켠다: ?intro=1 자동 주행, ?video=1 인트로 영상(assets/intro.mp4)
    if (!ACT.introDone) {
      if (!pos && QS.get('intro') === '1' && introStart()) return;
      if (!pos && QS.get('video') === '1' && playIntroVideo()) return;
      setTimeout(callStart, 700);
    }
  }
  // ── 시작 인트로 영상 (assets/intro.mp4) ──
  // 게임 안에서 달리는 연출 대신 미리 찍어 둔 9초 영상을 튼다. 아무 데나 누르면 건너뛴다.
  // 영상이 안 열리는 브라우저면 그냥 넘어가고 친구 전화만 걸린다.
  let introVideo = false;   // 인트로 영상이 도는 동안엔 라디오를 끈다(영상 음악과 겹쳐 두 곡이 같이 났다, 사장님 2026-09-10)
  function playIntroVideo() {
    const box = $('introv'), v = $('introvv');
    if (!box || !v || !v.canPlayType || !v.canPlayType('video/mp4')) return false;
    let gone = false, back = null;
    try { if (AUDIO.master) { back = AUDIO.master.gain.value; AUDIO.master.gain.value = 0; } } catch (e) {}
    const endIt = () => {
      if (gone) return; gone = true;
      box.classList.remove('on'); introVideo = false;
      try { v.pause(); } catch (e) {}
      try { if (AUDIO.master && back !== null) AUDIO.master.gain.value = back; } catch (e) {}
      ACT.introDone = true; ACT.save();
      window.removeEventListener('keydown', endIt, true);
    };
    box.classList.add('on'); introVideo = true;
    try { v.currentTime = 0; } catch (e) {}
    const pr = v.play();
    if (pr && pr.catch) pr.catch(() => { endIt(); setTimeout(callStart, 400); });
    v.addEventListener('ended', endIt);
    // 건너뛰기는 조금 뒤에 받는다. 바로 달면 '시작'을 누른 그 손짓이 영상까지 닫아버린다
    setTimeout(() => { box.addEventListener('pointerdown', endIt); window.addEventListener('keydown', endIt, true); }, 600);
    return true;
  }

  // ── 인트로: 해안도로(일주도로)를 달리는 장면으로 시작하고, 달리는 중에 친구 전화가 걸려온다(사장님 2026-09-09) ──
  // 아무 키·탭이나 누르면 바로 전화로 건너뛴다. 통화가 끝나면 그 속도 그대로 조종을 넘겨받는다
  const INTRO = { on: false, t: 0, e: null, s: 0, called: false, off: 0 };
  const seaSide = e => { const d = ISLAND.coastDist((e.a.x + e.b.x) / 2, (e.a.z + e.b.z) / 2); return d > 10 && d < 130; };   // 바다가 보이는 길
  function ringNext(e) {
    const outs = e.b.out.filter(o => o.b !== e.a); if (!outs.length) return null;
    const score = o => (o.dir.x * e.dir.x + o.dir.z * e.dir.z) + (seaSide(o) ? 0.7 : 0);   // 곧게 이어지고 바다를 낀 길로
    return outs.sort((p, q) => score(q) - score(p))[0];
  }
  function introStart() {
    // 출발은 공항 앞 '해안도로'. 제주에 막 내려 렌터카를 몰고 나가는 참이다.
    // 시내 큰길은 가로수 가지가 도로 위로 크게 뻗어 있어 차가 잎을 뚫고 지나간다(2026-09-10).
    // 바다를 낀 공항 북쪽 길은 가로수가 없어 깨끗하다.
    let e = null;
    const ap = SPOTS.list.find(s => s.id === 'airport');
    const nd = ap ? ROADS.nearest(ap.x, ap.z - 35).e.a : (spawn && spawn.node);
    if (nd && nd.out && nd.out.length) {
      // 동쪽(제주시내 쪽)으로, 바다를 낀 긴 길로 나간다
      e = nd.out.slice().sort((p, q) => (q.dir.x - p.dir.x) || (seaSide(q) - seaSide(p)) || (q.len - p.len))[0];
    }
    if (!e) {   // 공항 길을 못 찾으면 옛 방식으로 — 바다를 낀 아무 길
      const cand = ROADS.edges.filter(x => x.len > 15 && !x.a.town && seaSide(x) && ringNext(x) && seaSide(ringNext(x)));
      if (!cand.length) return false;
      e = cand[Math.floor(Math.random() * cand.length)];
    }
    INTRO.on = true; INTRO.t = 0; INTRO.e = e; INTRO.s = 0; INTRO.called = false; INTRO.off = (e.w || 8) / 4;
    PLAYER.setVehicle(PLAYER.car, e.a.x, e.a.z, Math.atan2(-e.dir.x, -e.dir.z));
    PLAYER.long = 12; PLAYER.safe = { x: e.a.x, z: e.a.z, yaw: PLAYER.yaw };
    if (window.PET && PET.board) PET.board();
    orbit.yaw = 1.2; orbit.pitch = 0.24; orbit.zoom = 1.25;   // 옆에서 잡았다가 천천히 뒤로 붙는다
    return true;
  }
  function introSkip() { if (INTRO.on && !INTRO.called) { INTRO.called = true; callStart(); } }
  // 인트로 주행은 물리로 달리지 않고 길 위를 그대로 따라간다 — 막히거나 처박히는 일이 없게
  const INTRO_SPD = 11;   // m/s ≈ 40km/h — 9초 안에 용연구름다리(도로에 걸친 기둥)까지 가지 않을 만큼
  function introAt(e, s, off) { if (off === undefined) off = e.w / 4; return { e, s, x: e.a.x + e.dir.x * s + e.right.x * off, z: e.a.z + e.dir.z * s + e.right.z * off }; }
  // 촬영 주행은 물리를 안 쓰므로 길가에 세워둔 차·기둥을 그냥 뚫고 지나간다.
  // 앞을 내다보고 걸리는 게 있으면 차선 안에서 좌우로 살짝 비켜 간다(사장님 "차가 그대로 통과하네", 2026-09-10)
  let introNear = null, introNearT = 0;
  function introClear(x, z, pad) {
    if (!introNear) return true;
    for (const c of introNear.c) if ((x - c.x) * (x - c.x) + (z - c.z) * (z - c.z) < (c.r + pad) * (c.r + pad)) return false;
    for (const b of introNear.b) if (x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return false;
    return true;
  }
  function introRefreshNear(x, z) {
    const O = CITY.obst, R2 = 90 * 90;
    introNear = {
      c: O.circles.filter(c => (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z) < R2),
      b: O.boxes.filter(b => (b.x0 - x) < 90 && (x - b.x1) < 90 && (b.z0 - z) < 90 && (z - b.z1) < 90)
    };
  }
  function introTick(dt) {
    INTRO.t += dt;
    let e = INTRO.e, s = INTRO.s + INTRO_SPD * dt, guard = 0;
    while (s > e.len && guard++ < 8) { const n = ringNext(e); if (!n) { s = e.len; break; } s -= e.len; e = n; }
    INTRO.e = e; INTRO.s = s;
    introNearT -= dt; if (introNearT <= 0) { introNearT = 0.5; introRefreshNear(PLAYER.x, PLAYER.z); }
    // 18m 앞에서 어느 쪽이 비었는지 보고 그쪽으로 부드럽게 옮겨 간다
    { // 4·10·18·26m 앞을 모두 본다. 맨 앞만 보면 지나가는 도중의 건물을 못 보고 그 안으로 들어간다
      const ahead = [];
      for (const dS of [4, 10, 18, 26]) {
        let ae = e, as = s + dS, guard = 0;
        while (as > ae.len && guard++ < 8) { const nx = ringNext(ae); if (!nx) { as = ae.len; break; } as -= ae.len; ae = nx; }
        ahead.push({ e: ae, s: as });
      }
      const w = ahead[2].e.w || 8; let best = null;
      for (const o of [INTRO.off, w / 4, 0, -w / 4, w / 2.6, -w / 2.6]) {
        let ok = true;
        for (const a of ahead) { const p = introAt(a.e, a.s, o); if (!introClear(p.x, p.z, 2.8)) { ok = false; break; } }
        if (ok) { best = o; break; }
      }
      if (best === null) best = w / 4;
      INTRO.off += (best - INTRO.off) * Math.min(1, dt * 2.6);
    }
    const now = introAt(e, s, INTRO.off);
    let le = e, ls = s + 12; guard = 0;                                   // 조금 앞의 점을 보고 차 방향을 맞춘다
    while (ls > le.len && guard++ < 8) { const n = ringNext(le); if (!n) { ls = le.len; break; } ls -= le.len; le = n; }
    const nx = introAt(le, ls, INTRO.off);
    const want = Math.atan2(-(nx.x - now.x), -(nx.z - now.z));
    let da = want - PLAYER.yaw; da = Math.atan2(Math.sin(da), Math.cos(da));
    PLAYER.x = now.x; PLAYER.z = now.z; PLAYER.yaw += da * Math.min(1, dt * 6);
    PLAYER.long = INTRO_SPD; PLAYER.lat = 0; PLAYER.steer = Math.max(-0.5, Math.min(0.5, da * 1.5)); PLAYER.kmh = Math.round(INTRO_SPD * 3.6);
    PLAYER.bob += dt * 8; PLAYER.place();
    orbit.yaw += (0 - orbit.yaw) * Math.min(1, dt * 0.4);
    if (!INTRO.called && INTRO.t > 3) introSkip();   // 3초쯤 친구 전화(사장님 2026-09-10)
    if (INTRO.called && !CALL.open) { INTRO.on = false; PLAYER.long = INTRO_SPD * 0.6; PLAYER.safe = { x: PLAYER.x, z: PLAYER.z, yaw: PLAYER.yaw }; }
  }
  // ── 시작 전화: 해외에서 같이 유학하던 친구(사장님 대사, 2026-09-08). 한 번만. 아무 키·탭으로 다음 줄 ──
  const CALL = { open: false, who: '📞 유학 친구', lines: ['뭐? 제주도??', '그 촌구석에서 뭐 하냐 ㅋㅋㅋㅋㅋㅋ', '제주도에서 사업을 한다고 ㅋㅋㅋㅋ', '잘해봐라 ㅋㅋㅋ'], i: 0, q: [] };
  // 업적 전화: 1,000억을 모으면 아버지가 인정하는 전화, 끊자마자 유학 친구가 이어서 건다(사장님 2026-09-09)
  const CALLS = {
    // 중간 이정표 — 총자산이 오를 때마다 한 통씩. 1,000억(엔딩)까지 사이가 비면 지루하다 (사장님 2026-09-10)
    m150: [{ who: '📞 유학 친구', lines: ['야 너 진짜 샀냐?', '제주도 땅을?', '사진 좀 보내봐'] }],
    m300: [{ who: '👔 아버지', lines: ['제주도에서 니 이름이 들리더라', '아직은 두고 본다'] }],
    m600: [{ who: '🏢 탐라국개발', lines: ['이 바닥 좁습니다', '적당히 하시죠', '곧 뵙겠습니다'] }],
    rich: [
      { who: '👔 아버지', lines: ['...잘 지내냐', '제주도가 요즘 시끄럽더라. 니 이름이 계속 나와', '내가 준 100억, 열 배로 만들었다며', '인정한다. 니가 해냈다', '이번 추석엔 집에 와라. 아버지가 술 한잔 사마'] },
      { who: '📞 유학 친구', lines: ['형님, 저희 제주도 갑니다', '방 하나만 빼주십쇼 ㅋㅋㅋ', '진짜 존경합니다', '형님'] },
    ],
  };
  function callQueue(list, done) { CALL.q = list.slice(1); CALL.done = done || null; callStart(list[0].who, list[0].lines); }
  function checkCalls() {
    if (!started || CALL.open || ACT.shopOpen || ACT.mapOpen || ESTATE.open || ESTATE.assetsOpen) return;
    const nw = ESTATE.netWorth();
    for (const [k, need] of [['m150', 1500000], ['m300', 3000000], ['m600', 6000000]]) {
      if (!ACT.calls[k] && nw >= need) { ACT.calls[k] = 1; ACT.save(); callQueue(CALLS[k]); return; }
    }
    // 엔딩은 부동산만 1,000억 — 현금을 쌓아 둔 것으로는 안 된다 (사장님 2026-09-11)
    const ev = ESTATE.estateWorth ? ESTATE.estateWorth() : nw;
    if (!ACT.calls.rich && ev >= 10000000) { ACT.calls.rich = 1; ACT.save(); callQueue(CALLS.rich, showEnding); }   // 총자산 1,000억 = 엔딩(현금 + 부동산 현재가)
  }
  function callStart(who, lines) { if (who) { CALL.who = who; CALL.lines = lines; } CALL.i = 0; CALL.open = true; $('callWho').textContent = CALL.who; $('callMsg').textContent = CALL.lines[0]; $('call').classList.add('show'); AUDIO.ring(1); }   // 따르릉 한 번 (사장님 2026-09-12)
  function callNext() {
    CALL.i++;
    if (CALL.i >= CALL.lines.length) {
      if (CALL.q.length) { const n = CALL.q.shift(); AUDIO.ping(300); setTimeout(() => callStart(n.who, n.lines), 900); return; }   // 다음 전화가 이어서 온다
      CALL.open = false; $('call').classList.remove('show'); ACT.introDone = true; ACT.save(); AUDIO.ping(300);
      if (CALL.done) { const f = CALL.done; CALL.done = null; setTimeout(f, 700); }
      return;
    }
    $('callMsg').textContent = CALL.lines[CALL.i]; AUDIO.ping(760);
  }
  $('call').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); callNext(); });
  // 엔딩: 1,000억을 모으면 아버지·친구 전화가 끝난 뒤에 뜬다. '계속하기' 를 누르면 그대로 이어서 논다(제주 100% 는 따로)
  function showEnding() {
    const own = ESTATE.list.filter(p => p.own), b = own.filter(p => p.b).length;
    $('endStat').innerHTML = '땅 ' + own.length + ' / ' + ESTATE.list.length + ' · 건물 ' + b + '채<br>하루 수입 ' + ESTATE.fmt(ESTATE.dayIncome()) + ' · 자산 ' + ESTATE.fmt(ACT.coins);
    $('ending').classList.add('show'); AUDIO.fanfare();
  }
  $('endGo').addEventListener('click', () => { $('ending').classList.remove('show'); AUDIO.ping(760); });
  function syncTog() { btnSfx.classList.toggle('off', !AUDIO.on); const b = $('btnBgm'); if (b) b.classList.toggle('off', !AUDIO.radioOn); }
  function toast(txt, sec) { const h = $('hint'); if (!h) return; h.textContent = txt; h.classList.add('on'); ACT.hintT = sec || 1.6; }
  AUDIO.onTrack = r => toast('♪ ' + r.title, 3.2);   // 사장님이 만든 곡 — 시작할 때 제목
  // 내리기·타기: 걷기 카메라는 절대 각도, 차 카메라는 차 기준 각도라 바뀔 때 보던 방향이 튀지 않게 옮겨 준다
  function foot() { const before = orbit.yaw; if (!PET.toggleFoot()) return false; orbit.yaw = PET.onFoot ? PLAYER.yaw + before : before - PLAYER.yaw; return true; }
  syncTog();

  // ── 입력 ──
  window.addEventListener('contextmenu', e => e.preventDefault());
  // 휠로 카메라 당기기·밀기 (지도·창이 열려 있을 땐 그쪽 휠)
  window.addEventListener('wheel', e => { if (ACT.mapOpen || ACT.shopOpen || ESTATE.open || ESTATE.assetsOpen || (e.target.closest && e.target.closest('.modal'))) return; e.preventDefault(); orbit.zoom = Math.max(0.35, Math.min(2.5, orbit.zoom * (e.deltaY > 0 ? 1.12 : 0.89))); orbit.idle = 0; }, { passive: false });
  // 두 손가락 벌리기·오므리기
  const pinch = { d: 0, on: false };
  window.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch.on = true; pinch.d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); } }, { passive: true });
  window.addEventListener('touchmove', e => { if (!pinch.on || e.touches.length !== 2 || ACT.mapOpen) return; const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch.d > 0) orbit.zoom = Math.max(0.35, Math.min(2.5, orbit.zoom * pinch.d / d)); pinch.d = d; orbit.idle = 0; }, { passive: true });
  window.addEventListener('touchend', e => { if (e.touches.length < 2) pinch.on = false; }, { passive: true });
  window.addEventListener('keydown', e => {
    if (CALL.open) { e.preventDefault(); if (!e.repeat) callNext(); return; }
    if (ACT.shopOpen || ACT.mapOpen || ESTATE.open || ESTATE.assetsOpen) { if (e.code === 'Escape' || e.code === 'KeyT' || e.code === 'KeyG') { ACT.closeShop(); ESTATE.close(); ESTATE.closeAssets(); if (ACT.mapOpen) ACT.toggleMap(); } return; }
    if (KEYS[e.code]) { e.preventDefault(); input.keys[e.code] = true; if (!started) start(!!loadPos()); }
    if (INTRO.on && !INTRO.called) { introSkip(); return; }
    if (e.repeat) return;
    if ((e.code === 'KeyE' || e.code === 'Enter') && started) { if (!ACT.near && !ACT.cur && ESTATE.near && !ESTATE.near.b) ESTATE.act(); else if (!ACT.near && !ACT.cur && PET.canToggle()) foot(); else ACT.act(); }
    if (e.code === 'KeyF' && started) foot();
    if (e.code === 'KeyT' && started) ACT.toggleMap();
    if (e.code === 'KeyR' && started) { if (ACT.cur) ACT.abort(); else PLAYER.respawn(); }
    if (e.code === 'KeyK') { AUDIO.init(); AUDIO.toggle(); syncTog(); }
    if (e.code === 'KeyM') { AUDIO.init(); AUDIO.radioToggle(); syncTog(); }
    if (e.code === 'KeyN') { AUDIO.init(); const r = AUDIO.radioNext(); toast('♪ ' + r.title, 3.2); }
  });
  window.addEventListener('keyup', e => { if (KEYS[e.code]) input.keys[e.code] = false; });
  window.addEventListener('blur', () => { input.keys = {}; });
  let look = null;
  window.addEventListener('pointerdown', e => {
    if (e.target.closest && (e.target.closest('button') || e.target.closest('#shop') || e.target.closest('#map') || e.target.closest('#build'))) return;
    if (ACT.shopOpen || ACT.mapOpen || ESTATE.open || ESTATE.assetsOpen || CALL.open) return;
    look = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  });
  window.addEventListener('pointermove', e => {
    if (!look || look.id !== e.pointerId) return;
    const dx = e.clientX - look.x, dy = e.clientY - look.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) look.moved = true;
    orbit.yaw -= dx * 0.006; orbit.pitch = Math.max(-0.35, Math.min(0.9, orbit.pitch + dy * 0.004)); orbit.idle = 0;
    look.x = e.clientX; look.y = e.clientY; if (!started) titleT = 1e9;
  });
  const endLook = e => { if (look && look.id === e.pointerId) { if (!look.moved) { if (!started) start(!!loadPos()); else introSkip(); } look = null; } };
  window.addEventListener('pointerup', endLook); window.addEventListener('pointercancel', endLook);
  if ('ontouchstart' in window) { document.body.classList.add('touch'); input.touch = true; }
  // 폰은 가로로 눕혀야 한다 — 세로면 안내를 덮는다 (사장님 2026-09-11 "모바일은 가로보기")
  let rotSkipped = false;
  function syncRot() { const w = innerWidth, h = innerHeight; if (w < 10 || h < 10) return; document.body.classList.toggle('portrait', !!input.touch && !rotSkipped && h > w * 1.02); }
  { const g1 = $('rotGo'), g2 = $('rotSkip');
    if (g1) g1.addEventListener('click', () => { if (window.OL) OL.go(); });
    if (g2) g2.addEventListener('click', e => { e.preventDefault(); rotSkipped = true; syncRot(); });
    addEventListener('resize', syncRot); addEventListener('orientationchange', () => setTimeout(syncRot, 260)); syncRot(); }
  // 폰 이동: 왼쪽 아래 둥근 조이스틱. 손가락 벡터를 그대로 가속·조향으로 (사장님 2026-09-12)
  { const pad = $('pad'), knob = $('knob'); let padId = null;
    const padMove = e => {
      const r = pad.getBoundingClientRect(), R = r.width / 2, max = R - knob.offsetWidth / 2;
      const mx = e.clientX - (r.left + R), my = e.clientY - (r.top + R), d = Math.hypot(mx, my), sc = d > max ? max / d : 1;
      const kx = mx * sc, ky = my * sc;
      knob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
      let nx = kx / max, ny = ky / max; if (Math.hypot(nx, ny) < 0.12) nx = ny = 0;
      input.padF = -ny; input.padS = -nx;   // 위로 밀면 앞으로, 왼쪽으로 밀면 왼쪽
    };
    const padEnd = e => { if (padId !== e.pointerId) return; padId = null; pad.classList.remove('on'); knob.style.transform = ''; input.padF = 0; input.padS = 0; };
    pad.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); if (padId !== null) return; padId = e.pointerId;
      try { pad.setPointerCapture(padId); } catch (err) {} pad.classList.add('on'); padMove(e); if (!started) start(!!loadPos()); });
    pad.addEventListener('pointermove', e => { if (padId !== e.pointerId) return; e.stopPropagation(); padMove(e); });
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd); pad.addEventListener('lostpointercapture', padEnd); }
  for (const [id, key, val] of [['brake', 'brake', true], ['horn', 'horn', true]]) {
    const el = $(id); if (!el) continue;
    const off = () => { if (key === 'brake' || key === 'horn') input[key] = false; else if (input[key] === val) input[key] = 0; };
    el.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); input[key] = val; if (!started) start(!!loadPos()); });
    el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  }
  $('goCont').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); start(true); });
  let newAsk = 0;
  $('goNew').addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    const el = $('goNew');
    if (QS.get('reset') || (!hasSave() && !loadPos())) { start(false); return; }   // 저장이 없거나 이미 지우고 들어왔으면 그냥 시작
    if (newAsk) { try { localStorage.removeItem('jeju.prog'); localStorage.removeItem('jeju.pos'); } catch (err) {} location.href = location.pathname + '?reset=1' + (QS.get('lang') ? '&lang=' + QS.get('lang') : ''); return; }   // 말을 잃지 않는다 — 영문판에서 처음부터 누르면 한국어로 떨어졌다(2026-09-12)
    newAsk = 1; el.textContent = '처음부터?';                            // 한 번 더 누르면 진행을 지우고 새로 시작
    setTimeout(() => { if (newAsk) { newAsk = 0; el.textContent = '시작'; } }, 4000);
  });
  window.addEventListener('pagehide', () => { savePos(); ACT.save(); }); document.addEventListener('visibilitychange', () => { if (document.hidden) savePos(); });
  btnSfx.addEventListener('click', () => { AUDIO.init(); AUDIO.toggle(); syncTog(); });
  $('btnBgm').addEventListener('click', () => { AUDIO.init(); AUDIO.radioToggle(); syncTog(); });
  $('btnNext').addEventListener('click', () => { AUDIO.init(); const r = AUDIO.radioNext(); toast('♪ ' + r.title, 3.2); });
  $('act').addEventListener('click', () => { if (!ACT.near && !ACT.cur && ESTATE.near && !ESTATE.near.b) ESTATE.act(); else ACT.act(); });
  $('act2').addEventListener('click', () => ESTATE.sellNear());   // 내 땅 앞에서 바로 팔기
  $('buildClose').addEventListener('click', () => ESTATE.close());
  $('btnMap').addEventListener('click', () => { if (started) ACT.toggleMap(); });
  $('statMoney').addEventListener('click', () => { if (started) ESTATE.openAssets(); });   // 💰 를 누르면 자산 창
  $('assetClose').addEventListener('click', () => ESTATE.closeAssets());
  $('mapClose').addEventListener('click', () => ACT.toggleMap());
  // 지도 밖을 눌러도 닫힌다 — 닫기 단추를 못 찾아 갇히는 일이 없게 (사장님 2026-09-12)
  window.addEventListener('pointerdown', e => { if (!ACT.mapOpen || !e.target.closest) return; if (e.target.closest('#map') || e.target.closest('#topbar')) return; ACT.toggleMap(); }, true);   // 상단바는 빼둔다 — 지도 단추가 여기서 닫고 click 에서 다시 여는 일이 없게
  $('shopClose').addEventListener('click', () => ACT.closeShop());
  $('foot').addEventListener('click', () => foot());
  // 리스폰 단추는 뺐다 (사장님 2026-09-12). 키보드 R 은 그대로 — 차가 끼거나 뒤집혔을 때 길 위로 돌려 놓는다
  document.addEventListener('visibilitychange', () => AUDIO.pause(document.hidden));

  function readInput() {
    const k = input.keys;
    const f = (k.ArrowUp || k.KeyW ? 1 : 0) + Math.max(0, input.padF);
    const b = (k.ArrowDown || k.KeyS ? 1 : 0) + Math.max(0, -input.padF);
    const s = (k.ArrowLeft || k.KeyA ? 1 : 0) - (k.ArrowRight || k.KeyD ? 1 : 0) + input.padS;
    const dive = PLAYER.mode === 'dive';
    return { throttle: Math.min(1, f), brake: Math.min(1, b), steer: Math.max(-1, Math.min(1, s)), hb: !dive && !!(k.Space || input.brake), horn: !dive && !!(k.KeyH || input.horn),
      up: dive && !!(k.Space || input.horn), dn: dive && !!(k.ShiftLeft || k.ShiftRight || input.brake) };
  }
  // 폰 단추 이름: 물속에선 위로/아래로
  let lastMode = '';
  function syncButtons() {
    const m = PET.onFoot ? 'foot' : PLAYER.mode; if (m === lastMode) return; lastMode = m;
    $('horn').textContent = m === 'dive' ? '위로' : m === 'foot' ? '달리기' : '경적'; $('brake').textContent = m === 'dive' ? '아래로' : m === 'foot' ? '점프' : '브레이크';
    keys.innerHTML = m === 'dive' ? '↑↓←→ 헤엄 · 스페이스 위로 · Shift 아래로<br>R 돌아가기' : m === 'fly' ? '←→ 방향 · ↑ 숙이기 · ↓ 당기기<br>R 돌아가기' : m === 'water' ? '↑↓←→ 조종 · R 돌아가기' : m === 'foot' ? '↑↓←→ 걷기 · Shift 달리기 · 스페이스 점프 · E 행동 · F 타기<br>T 지도 · R 리스폰' : '↑↓←→ 운전 · 스페이스 핸드브레이크 · E 행동 · F 내리기<br>T 지도 · H 경적 · R 리스폰 · K 효과음 · M 음악';
    document.body.classList.toggle('under', m === 'dive');
  }

  const camFwd = new THREE.Vector3();
  function titleCam(dt) {
    titleT += dt;
    const cx = PLAYER.x, cz = PLAYER.z; const a = titleT < 1e8 ? titleT * 0.08 : 0;
    camera.position.set(cx + Math.cos(a) * 30, PLAYER.y + 10 + Math.sin(titleT * 0.3) * 1.5, cz + Math.sin(a) * 30);
    camera.lookAt(cx, PLAYER.y + 1, cz);
  }
  let elapsed = 0, lastClock = '', lastKmh = -1, lastSink = 0;
  // 동적 해상도: 프레임이 느리면 그리는 해상도를 0.6배까지 낮추고, 여유 있으면 다시 올린다 (콘솔 게임 방식)
  let adT = 0, adN = 0, adSum = 0;
  function adapt(dt) {
    if (!started || !POST.on || QS.get('fixed')) return;
    adT += dt; adN++; adSum += dt; if (adT < 1.5) return;
    const avg = adSum / adN; adT = 0; adN = 0; adSum = 0;
    if (avg > 0.022 && POST.scale > 0.6) POST.setScale(POST.scale - 0.1); else if (avg < 0.014 && POST.scale < 1) POST.setScale(POST.scale + 0.05);
  }
  const EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];   // 영문판 날짜
  const FOG_SEA = new THREE.Color(0.01, 0.07, 0.12);
  function frame(ts) {
    let dt = last ? (ts - last) / 1000 : 0.016; last = ts; if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;   // 시각이 거꾸로 오면(시험용 tick 과 rAF 가 섞일 때) 0 으로
    elapsed += dt;
    SKY.update(dt); SKY.envTick(dt);
    if (ready) {
      const paused = ACT.shopOpen || ACT.mapOpen || ESTATE.open || ESTATE.assetsOpen || CALL.open || $('ending').classList.contains('show');
      const raw = started && !paused ? readInput() : { throttle: 0, brake: 0, steer: 0, hb: true, horn: false, up: false, dn: false };
      const onFoot = PET.onFoot; if (onFoot) { const k = input.keys; PET.control({ throttle: raw.throttle, brake: raw.brake, steer: raw.steer, run: !!(k.ShiftLeft || k.ShiftRight || input.horn), jump: !!(k.Space || input.brake) }); }
      const inp = onFoot ? { throttle: 0, brake: 0, steer: 0, hb: true, horn: false, up: false, dn: false } : raw;
      if (INTRO.on) introTick(dt);
      else if (!paused) { PLAYER.update(dt, inp); ACT.update(dt, elapsed); ESTATE.update(dt, elapsed); }
      posT += dt; if (posT > 2) { posT = 0; savePos(); }
      checkCalls();
      TRAFFIC.update(paused ? 0 : dt, PLAYER, camera.position); NPC.update(paused ? 0 : dt, elapsed, PLAYER, camera.position); PEOPLE.update(paused ? 0 : dt, elapsed, camera.position); PET.update(paused ? 0 : dt, elapsed);
      if (started) {
        orbit.idle += dt;
        // 돌린 카메라는 그대로 둔다. 달릴 때(8km/h 넘게)만 2초 뒤 천천히 뒤로 돌아간다(사장님 "카메라가 자꾸 뒤로 돌아간다", 2026-09-08)
        // 카메라: 서 있을 땐 돌려 놓은 그대로(내 맘대로). 달리거나 걸으면 천천히 뒤로 따라붙는다(옆모습만 비추지 않게) — 사장님, 2026-09-08
        { const moving = PET.onFoot ? (PET.state.spd > 0.6 && raw.throttle > 0.1 && raw.steer === 0) : (PLAYER.kmh > 6 && raw.throttle > 0.1);   // 걸을 땐 ↑로 멀어질 때만 뒤따른다(↓로 다가오면 정면 그대로)
          if (moving && !look) { const k = 1 - Math.exp(-1.6 * dt); if (PET.onFoot) { let da = PET.state.yaw - orbit.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); orbit.yaw += da * k; } else orbit.yaw *= 1 - k; orbit.pitch *= 1 - k * 0.5; } }
        if (!ACT.rideCam(camera, dt)) { if (onFoot) PET.camera(dt, camera, orbit); else PLAYER.camera(dt, camera, orbit); }
        { const fb = $('foot'); if (fb) { const can = PET.canToggle(); fb.classList.toggle('show', can); fb.textContent = onFoot ? '타기' : '내리기'; } }
        syncButtons();
        AUDIO.radio(!introVideo && !PET.onFoot && !(ACT.cur && ACT.cur.under));   // 차에 타고 있을 때만 음악. 인트로 영상 중에는 안 튼다
        if (PLAYER.mode === 'ground' || PLAYER.mode === 'water') AUDIO.engine(PLAYER.kmh, INTRO.on ? 0.55 : inp.throttle, PLAYER.params.quiet || PLAYER.veh === 'horse' || PLAYER.veh === 'bicycle' || PLAYER.veh === 'kayak' || PLAYER.veh === 'surf' ? 0.15 : 1); else AUDIO.engine(0, 0, 0);
        AUDIO.skid(PLAYER.mode === 'ground' && PLAYER.kmh > 12 ? Math.max(0, PLAYER.slip - 2.5) / 6 + (inp.hb && PLAYER.kmh > 25 ? 0.5 : 0) : 0);
        AUDIO.horn(inp.horn);
        if (PLAYER.crash > 2.5) AUDIO.crash(PLAYER.crash, PLAYER.crashKind);
        if (PLAYER.sink > 0 && lastSink === 0) AUDIO.splash(); lastSink = PLAYER.sink;
      } else titleCam(dt);
      camera.getWorldDirection(camFwd);
      SKY.follow(camera.position, camFwd);
      // 물속·동굴 화면
      const under = PLAYER.mode === 'dive' || (ACT.cur && ACT.cur.under && camera.position.y < 0);
      const dark = ACT.cur && ACT.cur.dark;
      if (under) { scene.fog.color.copy(FOG_SEA); scene.fog.density = 0.02; } else if (dark) { scene.fog.color.setRGB(0.02, 0.02, 0.03); scene.fog.density = 0.03; }
      POST.under += ((under ? 1 : 0) - POST.under) * Math.min(1, 6 * dt);
      ISLAND.update(dt, elapsed, SKY); CITY.update(dt, elapsed, SKY, camera.position); LANDMARKS.update(dt, elapsed, SKY); CAR.setNight(SKY.night);
      adapt(dt);
      { const kh = PET.onFoot ? PET.hero().kmh : PLAYER.kmh; if (kh !== lastKmh) { lastKmh = kh; speedEl.firstChild.textContent = kh; } }
    }
    const en = window.LANG && LANG.en;
    const c = (ESTATE.monthNo ? (en ? EN_MON[(ESTATE.monthNo() - 1) % 12] + ' ' + ESTATE.monthDay() + ' · ' : ESTATE.monthNo() + '월 ' + ESTATE.monthDay() + '일 ')
                              : (en ? 'Day ' + (ESTATE.day || 1) + ' · ' : (ESTATE.day || 1) + '일 ')) + SKY.clock(); if (c !== lastClock) { lastClock = c; clockEl.textContent = c; }   // 며칠째인지 함께 — 시세는 하루가 지날 때 오른다
    POST.render(scene, camera, dt);
  }
  function loop(ts) { frame(ts); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  window.__jj = { input, orbit, intro: INTRO, tick(n, dt) { for (let i = 0; i < (n || 1); i++) { last = last || 1000; frame(last + (dt || 16.7)); } }, start, setHour(h) { SKY.hour = h; }, started: () => started, renderer, scene, camera, post: POST, goto(id) { const s = SPOTS.list.find(x => x.id === id); if (!s) return; const nd = s.roadEnd; PLAYER.setVehicle(PLAYER.car, nd ? nd.x : s.x, nd ? nd.z : s.z, Math.atan2(-(s.x - (nd ? nd.x : s.x + 1)), -(s.z - (nd ? nd.z : s.z)))); } };
})();
