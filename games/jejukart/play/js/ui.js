// 게임 흐름 — 타이틀·그랑프리·조작·HUD·상점·미션·엔딩
(function () {
  const $ = (s) => document.querySelector(s);
  const E = {
    cv: $('#cv'), place: $('#place'), lap: $('#lap'), time: $('#time'),
    map: $('#map'), slot: $('#slot'), word: $('#word'), toasts: $('#toasts'), count: $('#count'),
    title: $('#title'), result: $('#result'), rTitle: $('#rTitle'), rList: $('#rList'),
    courses: $('#courses'), grid: $('#grid'), cupRow: $('#cupRow'),
    missions: $('#missions'), misList: $('#misList'), misCount: $('#misCount'), ending: $('#ending'),
    pause: $('#pauseCover'), rotate: $('#rotate'), loading: $('#loading'), pad: $('#pad'), knob: $('#knob'),
    tCup: $('#tCup'), topbar2: $('#topbar2'), place2: $('#place2'), lap2: $('#lap2'), slot2: $('#slot2'),
  };
  const mapCtx = E.map.getContext('2d');

  // ---------- 저장 ----------
  const DEF = { coins: 0, kart: 0, own: [0], cup: 0, race: 0, pts: null, best: {}, mis: [], done: [], laps: 0, items: 0, mini3: 0, splash: 0, clean: 0, ending: 0, inf: 0, infWin: 0, drv: 0 };
  let SV = load();
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('alleykart.save') || '{}');
      const sv = Object.assign({}, DEF, s, { own: s.own || [0], mis: s.mis || [], done: s.done || [], best: s.best || {} });
      // 카트 12종 → 4종 (2026-09-24): 옛 카트 번호를 값이 비슷한 새 카트로 옮긴다
      if (!s.k4) {
        const to4 = (i) => (i >= 10 ? 3 : i >= 7 ? 2 : i >= 4 ? 1 : 0);
        sv.own = [...new Set(sv.own.map(to4))].sort();
        sv.kart = to4(sv.kart);
        sv.k4 = 1;
      }
      if (!s.m9) { sv.mis = sv.mis.filter((i) => i < 8 || i > 10).map((i) => (i > 10 ? i - 3 : i)); sv.m9 = 1; }   // 카트 미션 셋을 뺀 번호로
      if (sv.gp == null) sv.gp = Math.min(4, sv.cup);   // 이어하기 자리(지금 달리는 컵). 4 = 엔딩 뒤 무한 모드
      return sv;
    } catch (e) { return Object.assign({}, DEF); }
  }
  function save() { try { localStorage.setItem('alleykart.save', JSON.stringify(SV)); } catch (e) {} }

  // ---------- 미션 12 ----------
  const MIS = [
    { n: '1등 하기', r: 200, f: () => SV.done.length > 0 },
    { n: '코스 5개 1등', r: 400, f: () => SV.done.length >= 5 },
    { n: '코스 12개 모두 1등', r: 1500, f: () => SV.done.length >= 12 },
    { n: '드리프트 3단 30번', r: 400, f: () => SV.mini3 >= 30 },
    { n: '한라봉 명중 30번', r: 400, f: () => SV.splash >= 30 },
    { n: '아이템 150개', r: 400, f: () => SV.items >= 150 },
    { n: '100바퀴 달리기', r: 600, f: () => SV.laps >= 100 },
    { n: '한 번도 안 맞고 1등', r: 600, f: () => SV.clean > 0 },
    { n: '4컵 모두 우승', r: 2500, f: () => SV.cup >= 4 },
  ];
  const CUPNAME = ['감귤컵', '돌담컵', '오름컵', '한라산컵'];
  const PTS = [10, 8, 6, 5, 4, 3, 2, 1];

  function checkMis() {
    MIS.forEach((m, i) => {
      if (SV.mis.indexOf(i) < 0 && m.f()) {
        SV.mis.push(i);
        toast('🏅 ' + m.n);   // 코인 없음 (2026-09-24 "코인도 빼")
        AUD.sfx('coin');
      }
    });
    save();
    hud();
  }

  // ---------- 화면 ----------
  let mode = 'title';   // title / race / result
  let raceMode = 'gp';  // gp / single / duo
  let courseIdx = 0, laps = 3, countdown = 0, raceTime = 0, finishedAt = 0, standings = [];
  let hitCount = 0, lastPlace = 1;
  const touch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
  if (touch) document.body.classList.add('touch');

  function show(el, on) { el.hidden = !on; }
  function toast(t) {
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = t;
    E.toasts.appendChild(d);
    setTimeout(() => d.remove(), 1900);
  }
  function word(t) {
    E.word.textContent = t;
    E.word.classList.remove('show');
    void E.word.offsetWidth;
    E.word.classList.add('show');
  }
  const fmt = (s) => {
    const m = Math.floor(s / 60), ss = s - m * 60;
    return m + ':' + (ss < 10 ? '0' : '') + ss.toFixed(1);
  };

  // ---------- 입력 ----------
  const key = {};
  // 급출발: 전진 키를 0.3초 안에 두 번 톡톡 (1P ↑ 또는 W, 2P 모드에선 1P W · 2P ↑)
  const dashReq = { 1: false, 2: false }, lastUp = { 1: 0, 2: 0 };
  addEventListener('keydown', (e) => {
    if (!e.repeat && (e.code === 'ArrowUp' || e.code === 'KeyW')) {
      const pad = raceMode === 'duo' ? (e.code === 'KeyW' ? 1 : 2) : 1;
      const now = performance.now();
      if (now - lastUp[pad] < 400) { dashReq[pad] = true; lastUp[pad] = 0; } else lastUp[pad] = now;
    }
    key[e.code] = true;
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.code === 'Escape' && mode === 'race') togglePause();
  });
  addEventListener('keyup', (e) => { key[e.code] = false; });
  addEventListener('blur', () => { for (const k in key) key[k] = false; });

  const padV = { x: 0, y: 0, on: false };
  let padId = null;
  E.pad.addEventListener('pointerdown', (e) => { padId = e.pointerId; E.pad.setPointerCapture(e.pointerId); padMove(e); });
  E.pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) padMove(e); });
  const padEnd = (e) => { if (e.pointerId === padId) { padId = null; padV.x = padV.y = 0; padV.on = false; E.knob.style.transform = ''; } };
  E.pad.addEventListener('pointerup', padEnd);
  E.pad.addEventListener('pointercancel', padEnd);
  function padMove(e) {
    const r = E.pad.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    padV.x = Math.abs(dx) < 0.08 ? 0 : dx;
    padV.y = Math.abs(dy) < 0.08 ? 0 : dy;
    padV.on = true;
    E.knob.style.transform = 'translate(' + dx * 52 + 'px,' + dy * 52 + 'px)';
  }
  const btn = { drift: false, item: false, brake: false };
  function hold(el, k) {
    const on = (v) => (e) => { btn[k] = v; el.classList.toggle('hit', v); if (e.cancelable) e.preventDefault(); };
    el.addEventListener('pointerdown', on(true));
    el.addEventListener('pointerup', on(false));
    el.addEventListener('pointerleave', on(false));
    el.addEventListener('pointercancel', on(false));
  }
  hold($('#bDrift'), 'drift');
  hold($('#bGas'), 'brake');
  hold($('#bItem'), 'item');   // 누르고 있으면 조준, 떼면 발사

  // 화면 기준 조향(오른쪽 = 화면 오른쪽)을 물리 기준으로 바꾼다.
  // 카메라가 +z 를 보고 있어 화면 오른쪽은 월드 -x 다 — 부호를 뒤집지 않으면 좌우가 반대로 움직인다.
  // (AI 는 목표 방향과 yaw 의 차이로 만들어져 이미 물리 기준이라 이 변환을 쓰지 않는다)
  const SCR = (v) => -v;

  function readInput(k) {
    // 시험용 자동 주행 (__ak.auto = true)
    if (window.__akAuto) {
      if (!k.brain) k.brain = AI.brain(1);
      const c = AI.drive(k.S, k.brain, RACE.track, 1 / 60);
      return { thr: c.thr, steer: c.steer, drift: c.drift, use: Math.random() < 0.03 };
    }
    const p2 = k.pad === 2;
    if (!p2 && touch && raceMode !== 'duo') {
      const aim = btn.item, use = !!k.aimHeld && !aim;
      k.aimHeld = aim;
      // 조준 중엔 패드를 좌우로 밀 때마다 과녁도 옆 상대로 바뀐다
      const side = padV.x > 0.5 ? 1 : padV.x < -0.5 ? -1 : 0;
      const aimDir = aim && side !== (k.aimSide || 0) ? side : 0;   // 조준 중 패드를 밀면 운전도 하고 과녁도 바뀐다
      k.aimSide = side;
      return { thr: btn.brake ? -1 : 1, steer: SCR(padV.x), drift: btn.drift, aim, use, aimDir };
    }
    const K = p2
      ? { up: 'ArrowUp', dn: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight', d: 'ShiftRight', i: 'Enter' }
      : (raceMode === 'duo'
        ? { up: 'KeyW', dn: 'KeyS', l: 'KeyA', r: 'KeyD', d: 'ShiftLeft', i: 'Space' }
        : { up: 'ArrowUp', dn: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight', d: 'ShiftLeft', i: 'Space' });
    let steer = (key[K.r] ? 1 : 0) - (key[K.l] ? 1 : 0);
    let thr = (key[K.up] ? 1 : 0) - (key[K.dn] ? 1 : 0);
    if (!p2 && raceMode !== 'duo') {
      if (key.KeyD) steer = 1;
      if (key.KeyA) steer = -1;
      if (key.KeyW) thr = 1;
      if (key.KeyS) thr = -1;
    }
    // 아이템: 누르고 있으면 자동 조준(과녁 머리 위 빨간 표시), 떼는 순간 발사 (2026-09-24 사장님)
    // 키는 Space (2P 는 Enter). Ctrl 은 WASD 와 같이 누르면 Ctrl+W 로 탭이 닫혀서 뺐다
    const aim = !!key[K.i];
    const use = !!k.aimHeld && !aim;
    k.aimHeld = aim;
    const side = steer;
    // 조준 중 좌우 키: 운전도 하고, 누를 때마다 과녁도 화면 왼쪽·오른쪽 상대로 바뀐다 (2026-09-24 "과녁과 전환이 같이 되는게 맞지")
    const aimDir = aim && side !== 0 && side !== (k.aimSide || 0) ? side : 0;
    k.aimSide = side;
    // 카운트다운 중이나 GO 직후(0.8초 안)에 톡톡 → 출발 급발진(더 세다). 카운트다운 중 누른 것도 GO 순간에 나간다
    const pad = p2 ? 2 : 1, dash = dashReq[pad] ? (raceTime < 0.8 ? 2 : 1) : 0;
    dashReq[pad] = false;
    return { thr, steer: SCR(steer), drift: !!key[K.d], aim, use, aimDir, dash };
  }

  // ---------- 레이스 ----------
  function startRace(idx, m) {
    raceMode = m || 'single';
    courseIdx = idx;
    laps = TRACK.COURSES[idx].laps;
    show(E.loading, true);
    E.loading.textContent = 'LOADING…';
    setTimeout(() => {
      RACE.split = raceMode === 'duo';
      RACE.loadCourse(idx);
      const list = [];
      // 경주는 4대 (2026-09-24 사장님 "경주도 4대로"): 동물 넷이 한 번씩, 카트 넷도 한 번씩
      const NK = KART.KARTS.length;
      // 운전자: 1P 는 고른 동물(SV.drv), 나머지는 남은 동물
      const me = (SV.drv || 0) % 4, rest = [0, 1, 2, 3].filter((d) => d !== me);
      if (raceMode === 'duo') {
        list.push({ kart: me, driver: me, human: true, pad: 1 });   // 카트는 캐릭터 것 (상점 없음)
        list.push({ kart: rest[0], driver: rest[0], human: true, pad: 2 });
        // 2P 는 둘만 달린다 (CPU 없음, 2026-09-24 사장님 "2P모드는 둘만하게")
      } else {
        list.push({ kart: me, driver: me, human: true, pad: 1 });
        // 무한 모드: 이길수록 CPU 가 조금씩 세진다 (최대 +0.15)
        const hard = raceMode === 'inf' ? 1.03 + Math.min(0.15, (SV.infWin || 0) * 0.006) : 0.9 + idx * 0.012;
        for (let i = 1; i < 4; i++) list.push({ kart: rest[i - 1], driver: rest[i - 1], skill: hard + (i - 2) * 0.015 });
      }
      RACE.setupRacers(list);
      RACE.follow(RACE.camera, RACE.players[0], 0.016, true);
      if (RACE.players[1]) RACE.follow(RACE.cam2, RACE.players[1], 0.016, true);
      if (RACE.warm) RACE.warm();
      mode = 'race';
      countdown = 3.9;
      raceTime = 0;
      finishedAt = 0;
      hitCount = 0;
      lastPlace = 8;
      standings = [];
      document.body.classList.add('playing');
      show(E.title, false);
      show(E.result, false);
      show(E.loading, false);
      AUD.init();
      AUD.resume();
      if (AUD.S.bgm) AUD.bgmStart();
      hud();
      drawMap();
    }, 30);
  }

  function endRace() {
    mode = 'result';
    AUD.engineOff();
    document.body.classList.remove('playing');
    const me = RACE.players[0].S;
    // 아직 달리는 카트는 남은 거리로 들어올 시간을 어림해 표에 넣는다
    RACE.karts.forEach((k) => {
      const S = k.S;
      if (S.finished) return;
      const left = Math.max(0, RACE.track.total * laps - S.prog);
      S.finishTime = S.time + left / Math.max(9, Math.abs(S.vel));
      S.finished = true;
      S.finishProg = 2e6 - S.finishTime;
    });
    const order = RACE.karts.slice().sort((a, b) => a.S.finishTime - b.S.finishTime);
    order.forEach((k, i) => { k.S.place = i + 1; });
    const place = me.place;
    standings = order;
    SV.laps += me.lap;
    if (place === 1) {
      if (SV.done.indexOf(courseIdx) < 0) SV.done.push(courseIdx);
      if (hitCount === 0) SV.clean = 1;
    }
    // 최고 랩
    const best = Math.min.apply(null, me.lapTimes.length ? me.lapTimes : [999]);
    if (best < 900 && (!SV.best[courseIdx] || best < SV.best[courseIdx])) {
      SV.best[courseIdx] = best;
      toast('BEST ' + fmt(best));
    }
    if (raceMode === 'inf') { SV.inf = (SV.inf || 0) + 1; if (place === 1) SV.infWin = (SV.infWin || 0) + 1; }
    // 그랑프리 점수
    let cupDone = false, cupWin = false;
    // 그랑프리는 1등을 해야 다음 코스로 (2026-09-24 사장님). 못 하면 점수도 안 쌓고 같은 코스 다시
    if (raceMode === 'gp' && place === 1) {
      if (!SV.pts) SV.pts = RACE.karts.map(() => 0);
      order.forEach((k, i) => { SV.pts[k.idx] += PTS[i]; });
      SV.race++;
      if (SV.race >= 3) {
        cupDone = true;
        const rank = SV.pts.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
        cupWin = rank[0].i === 0;
        if (cupWin) {
          if (SV.cup < 4) SV.cup = Math.max(SV.cup, Math.floor(courseIdx / 3) + 1);
          SV.gp = Math.max(SV.gp, Math.floor(courseIdx / 3) + 1);
        }
        SV.race = 0;
        SV.pts = null;
      }
    }
    save();
    checkMis();
    AUD.sfx(place <= 2 ? 'win' : 'lose');

    E.rTitle.textContent = place === 1 ? 'WIN' : place + 'ND'.replace('ND', place === 2 ? 'ND' : place === 3 ? 'RD' : 'TH');
    if (place === 1) E.rTitle.textContent = 'WIN';
    E.rList.innerHTML = '';
    order.forEach((k, i) => {
      const d = document.createElement('div');
      d.className = 'rrow' + (k.human ? ' me' : '');
      d.innerHTML = '<span class="pl">' + (i + 1) + '</span><span class="nm2">' + k.name + '</span>' +
        '<span class="tm">' + (k.S.finishTime ? fmt(k.S.finishTime) : '-') + '</span>' +
        (raceMode === 'gp' ? '<span class="pt">+' + PTS[i] + '</span>' : '');
      E.rList.appendChild(d);
    });
    $('#rNext').hidden = raceMode === 'gp' && place !== 1;
    show(E.result, true);
    hud();
    if (cupDone) {
      setTimeout(() => {
        if (cupWin) {
          const cup = Math.floor(courseIdx / 3);
          word(CUPNAME[cup] + ' 우승');
          if (cup >= 3) { SV.ending = 1; save(); showEnding(); }
        }
      }, 700);
    }
  }

  function showEnding() {
    show(E.result, false);
    const c = $('#confetti');
    c.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.background = ['#ffe14a', '#ff6a3a', '#4ab8f0', '#7de85a', '#ff4fd8'][i % 5];
      s.style.animationDelay = (Math.random() * 3) + 's';
      c.appendChild(s);
    }
    show(E.ending, true);
    AUD.sfx('win');
  }

  // ---------- HUD ----------
  function hud() {
    const cup = Math.min(3, SV.gp);
    if ($('#bCont')) titleBtns();
    E.tCup.textContent = endless() ? '무한 모드 ' + ((SV.inf || 0) + 1) : CUPNAME[cup] + (SV.race ? ' ' + (SV.race + 1) + '/3' : '');
  }

  // 조준 중: 과녁 이름·등수·거리를 띄우고, 과녁이 화면 밖이면 가장자리에 그쪽을 가리키는 화살표
  const aimV = new THREE.Vector3();
  function aimHud(p) {
    const tag = $('#aimTag'), edge = $('#aimEdge');
    const tg = p.ctl.aim && p.S.item >= 0 ? p.aimSel : null;
    tag.hidden = !tg;
    if (!tg) { edge.hidden = true; return; }
    const d = Math.max(0, Math.round(tg.S.prog - p.S.prog));
    tag.textContent = '🎯 ' + tg.name + ' · ' + tg.S.place + '등 · ' + d + 'm';
    const cam = RACE.camera;
    aimV.set(tg.S.pos.x, tg.S.pos.y + 1.2, tg.S.pos.z).project(cam);
    let x = aimV.x, y = aimV.y;
    const behind = aimV.z > 1;
    if (behind) { x = -x; y = -y; }
    const on = !behind && Math.abs(x) < 0.95 && Math.abs(y) < 0.95;
    tag.classList.toggle('see', on);   // 화면에 보이면 쏠 때
    edge.hidden = on;
    if (on) return;
    const m = Math.max(Math.abs(x), Math.abs(y), 1e-3), k = 0.86 / m;   // 가장자리로 밀어 붙인다
    const ex = x * k, ey = y * k;
    edge.style.left = ((ex + 1) / 2 * innerWidth) + 'px';
    edge.style.top = ((1 - ey) / 2 * innerHeight) + 'px';
    edge.style.transform = 'translate(-50%,-50%) rotate(' + Math.atan2(-ey, ex) + 'rad)';
  }

  let slotShown = -1, rolling = 0;
  // 아이템 칸: 모델 그림이 있으면 그림, 없으면 이모지
  function slotFace(el, i) {
    if (i < 0) { el.textContent = ''; return; }
    const K = ITEMS.KIND[i], src = ITEMS.ICON[K.id];
    if (src) el.innerHTML = '<img alt="' + K.name + '" src="' + src + '">';
    else el.textContent = K.icon;
  }
  const ORD = (n) => (n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH');
  function hudRace() {
    const p = RACE.players[0];
    if (!p) return;
    const S = p.S;
    E.place.innerHTML = S.place + '<small>' + ORD(S.place) + '/' + RACE.karts.length + '</small>';   // 1ST/4 · 2ND/4 · 3RD/4 · 4TH/4
    E.lap.innerHTML = Math.max(1, Math.min(laps, S.lap)) + '<small>/' + laps + '</small>';
    E.time.textContent = fmt(raceTime);
    aimHud(p);
    // 부스터 게이지 (5초에 한 번)
    const cd = S.dashCd || 0, bg = document.getElementById('boostG');
    if (bg) { bg.classList.toggle('on', cd <= 0); bg.firstChild.style.width = Math.round((1 - cd / (S.dashMax || 30)) * 100) + '%'; }
    // 부스트 칸 길이 = 윗줄 칸(등수·LAP·시간)을 합친 길이 (2026-09-24 사장님)
    if (bg) {
      const st = [...document.querySelectorAll('#topbar .stat.game')].filter((e) => e.offsetParent);
      if (st.length) {
        const l = st[0].getBoundingClientRect().left, r = st[st.length - 1].getBoundingClientRect().right;
        const w = Math.round(r - l) + 'px', x = Math.round(l) + 'px';
        if (bg.style.width !== w) bg.style.width = w;
        if (bg.style.left !== x) bg.style.left = x;
      }
    }
    if (rolling > 0) {
      rolling -= 1 / 60;
      E.slot.classList.add('on', 'roll');
      E.slot.classList.add('roll');
      slotFace(E.slot, (Math.random() * ITEMS.KIND.length) | 0);
      if (rolling <= 0) { slotShown = -2; E.slot.classList.remove('roll'); }
    } else if (S.item !== slotShown) {
      slotShown = S.item;
      slotFace(E.slot, S.item);
      E.slot.classList.toggle('on', S.item >= 0);
    }
    if (S.place < lastPlace && raceTime > 1) { AUD.sfx('pass'); }
    lastPlace = S.place;
    const p2 = RACE.players[1];
    if (p2) {
      E.topbar2.hidden = false;
      E.place2.innerHTML = p2.S.place + '<small>' + ORD(p2.S.place) + '/' + RACE.karts.length + '</small>';
      E.lap2.innerHTML = Math.max(1, Math.min(laps, p2.S.lap)) + '<small>/' + laps + '</small>';
      if (p2.S.item >= 0) slotFace(E.slot2, p2.S.item); else E.slot2.textContent = '-';
    } else E.topbar2.hidden = true;
  }

  // 미니맵
  let mapPts = null;
  function drawMap() {
    const T = RACE.track;
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    T.S.forEach((s) => {
      minX = Math.min(minX, s.p.x); maxX = Math.max(maxX, s.p.x);
      minZ = Math.min(minZ, s.p.z); maxZ = Math.max(maxZ, s.p.z);
    });
    const pad = 16, W = E.map.width, H = E.map.height;
    const sc = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxZ - minZ));
    mapPts = { minX, minZ, maxX, maxZ, sc, ox: (W - (maxX - minX) * sc) / 2, oy: (H - (maxZ - minZ) * sc) / 2 };
  }
  function mapXY(p) {
    return [mapPts.ox + (p.x - mapPts.minX) * mapPts.sc, mapPts.oy + (p.z - mapPts.minZ) * mapPts.sc];
  }
  function updateMap() {
    if (!mapPts) return;
    const g = mapCtx, T = RACE.track;
    g.clearRect(0, 0, E.map.width, E.map.height);
    g.lineWidth = 13;
    g.lineJoin = g.lineCap = 'round';
    g.strokeStyle = 'rgba(255,255,255,.22)';
    g.beginPath();
    T.S.forEach((s, i) => {
      const [x, y] = mapXY(s.p);
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.closePath();
    g.stroke();
    const [fx2, fy2] = mapXY(T.S[0].p);
    g.fillStyle = '#fff';
    g.fillRect(fx2 - 5, fy2 - 5, 10, 10);
    // 나는 가는 방향 화살표(흰 몸 + 빨간 테), 다른 선수는 카트 색 동그라미 (2026-09-24 사장님 "나만 화살표 나머지는 동그라미")
    const order = RACE.karts.slice().sort((a, b) => a.human - b.human);   // 내 화살표를 맨 위에
    order.forEach((k) => {
      const [x, y] = mapXY(k.S.pos);
      if (!k.human) {
        g.beginPath();
        g.arc(x, y, 6.5, 0, 7);
        g.fillStyle = '#' + new THREE.Color(k.stat.body).getHexString();
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = '#1a1408';
        g.stroke();
        return;
      }
      const a = Math.atan2(Math.cos(k.S.yaw), Math.sin(k.S.yaw)), L = 13;   // 지도는 x → 오른쪽, z → 아래
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.beginPath();
      g.moveTo(L, 0);
      g.lineTo(-L * 0.75, L * 0.68);
      g.lineTo(-L * 0.35, 0);
      g.lineTo(-L * 0.75, -L * 0.68);
      g.closePath();
      g.fillStyle = '#ffffff';
      g.lineWidth = 3.5;
      g.strokeStyle = '#e8412f';
      g.stroke();
      g.fill();
      g.restore();
    });
  }

  // ---------- 코스·상점·미션 시트 ----------


  function openCourses() {
    E.cupRow.innerHTML = '';
    CUPNAME.forEach((n, i) => {
      const b = document.createElement('button');
      b.className = 'cupb' + (i <= SV.cup ? '' : ' lock');
      b.textContent = n;
      b.onclick = () => { if (i <= SV.cup) { fillCourses(i); [...E.cupRow.children].forEach((c, j) => c.classList.toggle('on', j === i)); AUD.sfx('ui'); } };
      E.cupRow.appendChild(b);
    });
    const c0 = Math.min(3, SV.cup);
    E.cupRow.children[c0].classList.add('on');
    fillCourses(c0);
    show(E.courses, true);
  }
  function fillCourses(cup) {
    E.grid.innerHTML = '';
    TRACK.COURSES.forEach((c, i) => {
      if (c.cup !== cup) return;
      const lock = c.cup > SV.cup;
      const d = document.createElement('div');
      d.className = 'card' + (lock ? ' lock' : '');
      const th = SCENERY.THEMES[c.theme];
      const sky = '#' + new THREE.Color(th.sky[0]).getHexString();
      const gr = '#' + new THREE.Color(th.ground).getHexString();
      const rd = th.road;
      // 카드 그림 = 그 코스를 실제로 달리는 화면 캡처 (assets/courses/c<번호>.jpg, 2026-09-24 사장님 "코스도 실제화면 캡쳐해서 넣어")
      d.innerHTML = '<div class="thumb"><img alt="" src="assets/courses/c' + i + '.jpg"></div>' +
        '<div class="nm">' + c.name + '</div>' +
        '<div class="sub"><span>' + c.laps + ' LAP</span><em>' + (SV.best[i] ? fmt(SV.best[i]) : '-') + '</em></div>' +
        (SV.done.indexOf(i) >= 0 ? '<div class="sub"><span>🏆 1등</span></div>' : '');
      if (!lock) d.onclick = () => { show(E.courses, false); startRace(i, 'single'); };
      E.grid.appendChild(d);
    });
  }



  function openMis() {
    E.misList.innerHTML = '';
    MIS.forEach((m, i) => {
      const ok = SV.mis.indexOf(i) >= 0;
      const d = document.createElement('div');
      d.className = 'mis' + (ok ? ' ok' : '');
      d.innerHTML = '<span class="ck">' + (ok ? '✔' : '') + '</span><span class="mn">' + m.n + '</span>';
      E.misList.appendChild(d);
    });
    E.misCount.textContent = SV.mis.length + ' / ' + MIS.length;
    show(E.missions, true);
  }

  // ---------- 무한 모드 ----------
  // 엔딩(4컵 우승) 뒤 START 는 무한 모드: 매 판 다른 제주 코스를 골라 끝없이 달린다 (2026-09-24 사장님 "엔딩후 무한모드로 하자")
  function endless() { return SV.gp >= 4; }
  function nextInf() {
    let i;
    do { i = (Math.random() * TRACK.COURSES.length) | 0; } while (i === courseIdx && TRACK.COURSES.length > 1);
    return i;
  }

  // ---------- 단추 ----------
  // ---------- 캐릭터 고르기 (START → 동물 4마리 미리보기 + 스킬 설명 → START) ----------
  let pickR = null, pickScene = null, pickCam = null, pickKarts = [], pickCv = [], pickRaf = 0, pickSel = 0;
  function pickDraw(t) {
    if (!pickR) return;
    pickKarts.forEach((g, i) => {
      g.rotation.y = 0.35 + Math.sin(t * 0.0012 + i * 1.3) * 0.75;   // 얼굴이 보이게 좌우로만 흔든다
      pickScene.add(g);
      pickR.render(pickScene, pickCam);
      pickScene.remove(g);
      const c = pickCv[i], x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(pickR.domElement, 0, 0, c.width, c.height);
    });
  }
  function pickLoop(t) { if (E.pick.hidden) { pickRaf = 0; return; } pickDraw(t); pickRaf = requestAnimationFrame(pickLoop); }
  function openPick() {
    E.pick = E.pick || $('#pick');
    const grid = $('#pickGrid');
    grid.innerHTML = '';
    pickSel = (SV.drv || 0) % 4;
    if (!pickR) {
      const cv = document.createElement('canvas');
      cv.width = 360; cv.height = 300;
      try { pickR = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { pickR = null; }
      if (pickR) {
        pickR.setPixelRatio(1);
        pickR.setSize(360, 300, false);
        pickR.outputColorSpace = THREE.SRGBColorSpace;
        pickR.toneMapping = THREE.ACESFilmicToneMapping;
        pickR.toneMappingExposure = 1.2;
        pickScene = new THREE.Scene();
        pickScene.add(new THREE.HemisphereLight(0xdfe8f5, 0x3a3f4a, 1.4));
        const dl = new THREE.DirectionalLight(0xfff4e2, 1.7);
        dl.position.set(4, 6, 5);
        pickScene.add(dl);
        pickCam = new THREE.PerspectiveCamera(30, 360 / 300, 0.1, 60);
        pickCam.position.set(0, 2.3, 4.6);   // 동물이 크게 보이게 카트 윗부분을 당겨 찍는다
        pickCam.lookAt(0, 1.15, 0);
      }
    }
    pickKarts.forEach((g) => g.traverse((c) => { if (c.geometry && !c.userData.keep) c.geometry.dispose(); }));
    pickKarts = []; pickCv = [];
    for (let i = 0; i < 4; i++) {
      const D = KART.DRIVERS[i], SK = KART.SKILLS[D.glb];
      const g = KART.make(i, i);   // 캐릭터는 자기 카트에
      g.userData.shadow.visible = false;
      pickKarts.push(g);
      const d = document.createElement('div');
      d.className = 'card' + (i === pickSel ? ' on' : '');
      const cv = document.createElement('canvas');
      cv.width = 360; cv.height = 300;
      pickCv.push(cv);
      d.appendChild(cv);
      d.insertAdjacentHTML('beforeend', '<div class="nm">' + D.name + '</div><div class="sk">' + SK.name + '</div><div class="ds">' + SK.desc + '</div>');
      d.onclick = () => {
        pickSel = i;
        [...grid.children].forEach((c, j) => c.classList.toggle('on', j === i));
        AUD.sfx('ui');
        openView(i);   // 고르면 그 동물만 큰 창에 띄워 돌려 본다
      };
      grid.appendChild(d);
    }
    show(E.pick, true);
    pickDraw(performance.now());
    if (!pickRaf) pickRaf = requestAnimationFrame(pickLoop);
  }
  function pickStart() {
    SV.drv = pickSel;
    save();
    show(E.pick, false);
    AUD.sfx('ui');
    if (endless()) startRace(nextInf(), 'inf'); else startRace(Math.min(11, SV.gp * 3 + SV.race), 'gp');
  }
  $('#pickGo').onclick = pickStart;

  // ---------- 캐릭터 보기 창 (끌어서 돌리기·휠로 당기기, 가만두면 천천히 돈다) ----------
  const PV = { r: null, scene: null, cam: null, obj: null, yaw: 0.4, pitch: 0.12, dist: 4.2, drag: null, idle: 0, raf: 0 };
  function openView(i) {
    const D = KART.DRIVERS[i], SK = KART.SKILLS[D.glb];
    $('#pvName').textContent = D.name;
    $('#pvSkill').textContent = SK.name;
    $('#pvDesc').textContent = SK.desc;
    const cv = $('#pvCv');
    show($('#pickView'), true);
    if (!PV.r) {
      try { PV.r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return; }
      PV.r.outputColorSpace = THREE.SRGBColorSpace;
      PV.r.toneMapping = THREE.ACESFilmicToneMapping;
      PV.r.toneMappingExposure = 1.2;
      PV.r.shadowMap.enabled = true;
      PV.scene = new THREE.Scene();
      PV.scene.add(new THREE.HemisphereLight(0xe6eef8, 0x40444e, 1.3));
      const key = new THREE.DirectionalLight(0xfff2dc, 2.0);
      key.position.set(3, 6, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      PV.scene.add(key);
      const rim = new THREE.DirectionalLight(0x9cc8ff, 1.1);
      rim.position.set(-4, 3, -5);
      PV.scene.add(rim);
      // 받침: 현무암 둥근 단 (카트가 올라가는 크기)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.5, 48), new THREE.MeshLambertMaterial({ color: 0x46464c }));
      base.position.y = -0.25;
      base.receiveShadow = true;
      PV.scene.add(base);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.04, 48), new THREE.MeshLambertMaterial({ color: 0xffe14a }));
      top.position.y = 0.01;
      top.receiveShadow = true;
      PV.scene.add(top);
      PV.cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      // 끌어서 돌리기
      cv.addEventListener('pointerdown', (e) => { PV.drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); PV.idle = 0; });
      cv.addEventListener('pointermove', (e) => {
        if (!PV.drag) return;
        PV.yaw -= (e.clientX - PV.drag.x) * 0.012;
        PV.pitch = Math.max(-0.2, Math.min(1.1, PV.pitch + (e.clientY - PV.drag.y) * 0.008));
        PV.drag = { x: e.clientX, y: e.clientY };
      });
      const up = () => { PV.drag = null; PV.idle = 0; };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', (e) => { e.preventDefault(); PV.dist = Math.max(3.6, Math.min(11, PV.dist + e.deltaY * 0.006)); }, { passive: false });
    }
    if (PV.obj) {   // 앞에 보던 카트 치우기 (같이 쓰는 GLB 모양은 두고 도형만)
      PV.scene.remove(PV.obj);
      PV.obj.traverse((c) => { if (c.geometry && !c.userData.keep) c.geometry.dispose(); });
    }
    PV.obj = KART.make(i, i);   // 자기 카트에 탄 모습
    PV.obj.userData.shadow.visible = false;
    PV.obj.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    PV.scene.add(PV.obj);
    PV.yaw = 0.6; PV.pitch = 0.22; PV.dist = 7.2; PV.idle = 0;
    viewDraw(performance.now());
    if (!PV.raf) PV.raf = requestAnimationFrame(viewLoop);
  }
  let pvLast = 0;
  function viewDraw(t) {
    const cv = $('#pvCv'), w = cv.clientWidth, h = cv.clientHeight;
    if (!PV.r || !w) return;
    const dt = Math.min(0.05, (t - (pvLast || t)) / 1000);
    pvLast = t;
    if (!PV.drag) { PV.idle += dt; if (PV.idle > 2) PV.yaw += dt * 0.5; }   // 손 떼고 2초 지나면 천천히 돈다
    PV.r.setPixelRatio(Math.min(devicePixelRatio, 2));
    PV.r.setSize(w, h, false);
    PV.cam.aspect = w / h;
    PV.cam.updateProjectionMatrix();
    const cy = 0.9;
    PV.cam.position.set(Math.sin(PV.yaw) * Math.cos(PV.pitch) * PV.dist, cy + Math.sin(PV.pitch) * PV.dist, Math.cos(PV.yaw) * Math.cos(PV.pitch) * PV.dist);
    PV.cam.lookAt(0, cy, 0);
    PV.r.render(PV.scene, PV.cam);
  }
  function viewLoop(t) {
    if ($('#pickView').hidden) { PV.raf = 0; return; }
    viewDraw(t);
    PV.raf = requestAnimationFrame(viewLoop);
  }
  const closeView = () => { show($('#pickView'), false); AUD.sfx('ui'); };
  $('#pvClose').onclick = closeView;
  $('#pickView').onclick = (e) => { if (e.target.id === 'pickView') closeView(); };
  $('#pvGo').onclick = () => { show($('#pickView'), false); pickStart(); };
  window.__pv = { openView, PV, viewDraw };   // 시험용
  addEventListener('keydown', (e) => {   // 고르기 화면: ← → 로 고르고 Enter·Space 로 출발
    if (!E.pick || E.pick.hidden) return;
    if (!$('#pickView').hidden) {
      if (e.code === 'Escape') closeView();
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); show($('#pickView'), false); pickStart(); }
      else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { PV.yaw += e.code === 'ArrowRight' ? -0.3 : 0.3; PV.idle = 0; }
      return;
    }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
      pickSel = (pickSel + (e.code === 'ArrowRight' ? 1 : 3)) % 4;
      [...$('#pickGrid').children].forEach((c, j) => c.classList.toggle('on', j === pickSel));
      AUD.sfx('ui');
    } else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); pickStart(); }
  });
  // 이어하기 / 새로하기 (다른 게임과 같은 틀 — 알까기처럼 이어하기가 크게, 새로하기는 작게 아래)
  // 이어하기: 캐릭터를 고르고 멈춘 컵·경주부터. 새로하기: 전부 지우고 캐릭터부터 다시 (한 번 더 묻는다)
  function hasProgress() { return SV.gp > 0 || SV.race > 0; }
  function titleBtns() {
    const on = hasProgress();
    $('#bCont').hidden = !on;
    $('#bStart').firstChild.textContent = on ? '새로하기 ' : 'START ';
    $('#bStart').classList.toggle('sub', on);
  }
  $('#bCont').onclick = () => { AUD.sfx('ui'); openPick(); };   // 이어하기도 캐릭터는 고른다 (고르기 화면의 START 가 멈춘 컵·경주부터 이어 달린다)
  $('#bStart').onclick = () => {
    AUD.sfx('ui');
    // 새로하기 = 전부 처음부터 (코인·카트·컵·미션·기록 모두 지움, 2026-09-24 사장님 "새로 시작할 때 전부 지우길"). 소리 설정은 그대로
    if (hasProgress()) {
      askBox('처음부터 다시 할까요?', '코인·카트·미션·기록이 모두 지워져요', () => {
        SV = Object.assign({}, DEF, { own: [0], mis: [], done: [], best: {}, gp: 0, k4: 1 });
        save();
        hud();
        openPick();
      });
      return;
    }
    openPick();
  };

  // 게임 모양 확인 창 (브라우저 기본 confirm 대신, 2026-09-24 "이런 팝업도 이쁘게"). Enter = 확인, Esc = 취소
  let askYes = null;
  function askBox(title, msg, yes) {
    $('#askTitle').textContent = title;
    $('#askMsg').textContent = msg;
    askYes = yes;
    show($('#ask'), true);
  }
  function askClose(ok) {
    show($('#ask'), false);
    AUD.sfx('ui');
    const f = askYes;
    askYes = null;
    if (ok && f) f();
  }
  $('#askYes').onclick = () => askClose(true);
  $('#askNo').onclick = () => askClose(false);
  $('#ask').onclick = (e) => { if (e.target.id === 'ask') askClose(false); };
  addEventListener('keydown', (e) => {
    if ($('#ask').hidden) return;
    if (e.code === 'Escape') askClose(false);
    else if (e.code === 'Enter') { e.preventDefault(); askClose(true); }
  });
  $('#bCourse').onclick = () => { AUD.sfx('ui'); openCourses(); };
  $('#bDuo').onclick = () => { AUD.sfx('ui'); startRace(Math.min(11, SV.cup * 3), 'duo'); };
  $('#bMis').onclick = () => { AUD.sfx('ui'); openMis(); };
  // 시트의 ✕ 만 (캐릭터 보기 창 ✕ 는 따로 — 여기서 덮어써 닫기가 안 되던 것, 2026-09-24)
  document.querySelectorAll('.sheet .close').forEach((b) => { b.onclick = () => { b.closest('.sheet').hidden = true; AUD.sfx('ui'); }; });
  $('#rNext').onclick = () => {
    AUD.sfx('ui');
    if (raceMode === 'inf') startRace(nextInf(), 'inf');
    else if (raceMode === 'gp') startRace(endless() ? nextInf() : Math.min(11, SV.gp * 3 + SV.race), endless() ? 'inf' : 'gp');
    else startRace(Math.min(11, courseIdx + 1), raceMode);
  };
  $('#rRetry').onclick = () => { AUD.sfx('ui'); startRace(courseIdx, raceMode); };
  $('#rHome').onclick = () => { AUD.sfx('ui'); goTitle(); };
  $('#endOk').onclick = () => { show(E.ending, false); goTitle(); };
  $('#pHome').onclick = () => { paused = false; show(E.pause, false); goTitle(); };
  E.pause.onclick = (e) => { if (e.target === E.pause) togglePause(); };
  $('#tPause').onclick = () => togglePause();
  $('#tBgm').onclick = (e) => {
    AUD.init();
    AUD.setBgm(!AUD.S.bgm);
    e.currentTarget.classList.toggle('off', !AUD.S.bgm);
    if (!AUD.S.bgm) AUD.bgmStop();
  };
  $('#tSnd').onclick = (e) => { AUD.init(); AUD.setSnd(!AUD.S.snd); e.currentTarget.classList.toggle('off', !AUD.S.snd); };
  $('#tBgm').classList.toggle('off', !AUD.S.bgm);
  $('#tSnd').classList.toggle('off', !AUD.S.snd);
  $('#rotBtn').onclick = () => { if (window.OL && OL.go) OL.go(); };

  let paused = false;
  function togglePause() {
    if (mode !== 'race') return;
    paused = !paused;
    show(E.pause, paused);
    AUD.quiet(paused);
  }

  function goTitle() {
    mode = 'title';
    AUD.engineOff();
    document.body.classList.remove('playing');
    show(E.result, false);
    show(E.title, true);
    hud();
    // 타이틀 배경: 코스 한 바퀴 구경
    RACE.split = false;
    if (!RACE.track) demoCourse();
  }
  function demoCourse() {
    RACE.loadCourse(Math.floor(Math.random() * 12));
    const list = [];
    for (let i = 0; i < 4; i++) list.push({ kart: i, driver: i, skill: 0.96 });
    RACE.setupRacers(list);
    drawMap();
  }

  // ---------- 물리 되먹임 ----------
  RACE.cb = {
    onMiniBoost: (S, lvl) => {
      const p = RACE.players[0];
      if (p && p.S === S) {
        AUD.sfx(lvl >= 3 ? 'boost' : 'mini');
        if (lvl >= 3) { SV.mini3++; word('BOOST'); }
      }
    },
    onWall: (S) => { const p = RACE.players[0]; if (p && p.S === S) AUD.sfx('wall'); },
    // 담장·건물·차에 박음: 불꽃 튀고 소리
    onHit: (S, strength, kind, hx, hz) => {
      const p = RACE.players[0];
      const nearMe = p && p.S.pos.distanceToSquared(S.pos) < 2500;
      if (p && p.S === S) { AUD.sfx('wall'); if (strength > 12) hitCount++; }
      else if (nearMe && Math.random() < 0.5) AUD.sfx('bump');
      const n = Math.min(14, 4 + strength * 0.6);
      for (let i = 0; i < n; i++) RACE.spawn(hx, S.pos.y + 0.35 + Math.random() * 0.4, hz,
        (Math.random() - 0.5) * 7, 1 + Math.random() * 4, (Math.random() - 0.5) * 7,
        1, 0.85 + Math.random() * 0.15, 0.45, 0.55, 0.28 + Math.random() * 0.2);
    },
    // 라바콘·드럼통·화분 따위를 쳐서 날림
    onKnock: (S, b, spd) => {
      const p = RACE.players[0];
      if (p && p.S.pos.distanceToSquared(b.p) < 3600) AUD.sfx(b.m > 1.5 ? 'wall' : 'bump');
      const col = b.kind === 'pot' ? [0.45, 0.7, 0.3] : b.kind === 'bag' ? [0.35, 0.36, 0.4] : b.kind === 'crate' ? [0.8, 0.7, 0.5] : [0.75, 0.7, 0.62];
      for (let i = 0; i < 8; i++) RACE.spawn(b.p.x, b.p.y + 0.3, b.p.z,
        (Math.random() - 0.5) * 5, 1 + Math.random() * 3, (Math.random() - 0.5) * 5, col[0], col[1], col[2], 0.9, 0.5);
    },
    // 덤불·모래·갈대: 잎·모래가 튄다
    onSoft: (S, c) => {
      if (Math.random() > 0.35) return;
      const g = c.kind === 'sand' ? [0.85, 0.78, 0.55] : [0.35, 0.62, 0.28];
      RACE.spawn(S.pos.x + (Math.random() - 0.5) * 1.2, S.pos.y + 0.3, S.pos.z + (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 3, g[0], g[1], g[2], 0.7, 0.5);
    },
    onItem: (k) => { SV.items++; if (k && k.human) rolling = 0.55; },
    onSplash: (owner) => { if (RACE.players[0] && owner === RACE.players[0].idx) SV.splash++; },
    onHurt: () => { hitCount++; },
  };

  // ---------- 루프 ----------
  let acc = 0, last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dtReal = Math.min(0.1, (now - last) / 1000);
    last = now;
    tick(dtReal);
  }
  function tick(dtReal) {
    if (mode === 'race' && !paused) {
      // GO 가 뜨는 순간(남은 0.9초) 바로 출발한다. 예전엔 GO 가 뜨고도 0.9초 멈춰 있어 GO 에 맞춘 ↑↑ 급발진이 늦었다 (2026-09-24)
      if (countdown > 0.9) {
        const before = Math.ceil(countdown - 0.9);
        countdown -= dtReal;
        const after = Math.ceil(countdown - 0.9);
        if (after !== before) {
          if (after > 0) { E.count.hidden = false; E.count.textContent = after; AUD.sfx('beep'); }
          else if (after === 0) { E.count.textContent = 'GO'; AUD.sfx('go'); }
        }
        if (countdown <= 0) { E.count.hidden = true; }
        // 출발 전에는 멈춰 있다
        RACE.karts.forEach((k) => KART.pose(k.g, k.S, k.ctl, dtReal));
        hudRace();
        updateMap();
      } else {
        if (countdown > 0) { countdown -= dtReal; if (countdown <= 0) E.count.hidden = true; }   // GO 글자는 달리는 동안 잠깐 더 보인다
        raceTime += dtReal;
        // 한 번에 크게 뛰면 담장을 뚫는다 → 1/60초를 넘지 않게 여러 번 굴린다
        const nSub = Math.min(6, Math.max(1, Math.ceil(dtReal / (1 / 60))));
        let order = null;
        for (let si = 0; si < nSub; si++) order = RACE.stepRace(dtReal / nSub, readInput);
        // 바퀴·완주
        RACE.karts.forEach((k) => {
          const S = k.S;
          if (S.finished) return;
          const lap = Math.floor(S.prog / RACE.track.total) + (S.prog >= 0 ? 1 : 0);
          if (lap > S.lap) {
            const t = S.time - (S.lapTimes.reduce((a, b) => a + b, 0));
            if (S.lap >= 1) S.lapTimes.push(t);
            S.lap = lap;
            if (k.human && lap <= laps && lap > 1) { AUD.sfx('lap'); word('LAP ' + Math.min(laps, lap)); }
          }
          if (S.prog >= RACE.track.total * laps) {
            S.finished = true;
            S.finishProg = 2e6 - S.time;   // 들어온 카트는 시간으로만 줄 세운다
            S.finishTime = S.time;
            if (k.human) {
              word(S.place === 1 ? 'WIN' : S.place + '등');
              if (!finishedAt) finishedAt = raceTime;
            }
          }
        });
        hudRace();
        updateMap();
        const p1 = RACE.players[0];
        RACE.follow(RACE.camera, p1, dtReal);
        if (RACE.players[1]) RACE.follow(RACE.cam2, RACE.players[1], dtReal);
        // 엔진 소리
        const S = p1.S;
        AUD.engine(Math.min(1, Math.abs(S.vel) / 26 + (S.boost > 0 ? 0.25 : 0)), Math.abs(S.vel) / 26, S.drift > 0, S.air);
        if (finishedAt && raceTime > finishedAt + 2.2) endRace();
        if (!finishedAt && RACE.karts.every((k) => k.S.finished || !k.human)) {
          // 사람이 못 끝냈는데 CPU 가 다 끝난 경우는 그대로 진행
        }
      }
    } else if (mode === 'title' && RACE.track) {
      // 타이틀: 카트는 출발선에 세워 두고 코스 풍경만 (2026-09-24 사장님 — 예전엔 CPU 가 혼자 달렸다)
      const k = RACE.karts[0];
      RACE.karts.forEach((kk) => KART.pose(kk.g, kk.S, kk.ctl, dtReal));
      RACE.follow(RACE.camera, k, dtReal);
    }
    if (RACE.renderer) RACE.render();
  }

  // ---------- 시작 ----------
  function boot() {
    // 상점 배경·코스 사진을 미리 받아 둔다 (처음 열 때 한 박자 늦게 뜨던 것)
    ['assets/ui/mis-bg.jpg', 'assets/ui/course-bg.jpg', 'assets/ui/pick-bg.jpg'].concat(TRACK.COURSES.map((c, i) => 'assets/courses/c' + i + '.jpg')).forEach((u) => { new Image().src = u; });
    RACE.initGL(E.cv);
    RACE.quality = (matchMedia('(pointer:coarse)').matches ? 0 : 1);
    demoCourse();
    // 동물 운전자 GLB 가 늦게 오면 상점 그림을 다시 뜬다
    KART.onDrivers = KART.onKarts = () => { if (!$('#pick').hidden) openPick(); };   // 모델이 늦게 오면 고르기 화면을 다시 그린다
    hud();
    show(E.loading, false);
    show(E.title, true);
    requestAnimationFrame(frame);
    // 폰 세로면 가로 안내
    const checkRot = () => {
      const port = innerHeight > innerWidth * 1.05;
      show(E.rotate, touch && port);
    };
    addEventListener('resize', checkRot);
    checkRot();
  }
  addEventListener('pointerdown', () => { AUD.init(); AUD.resume(); if (AUD.S.bgm) AUD.bgmStart(); }, { once: true });

  // 시험 손잡이 (미리보기 창은 rAF 가 안 돈다)
  window.__ak = {
    tick: (n) => { for (let i = 0; i < (n || 1); i++) tick(1 / 60); },
    start: startRace, goTitle, get SV() { return SV; }, save, RACE, key, mode: () => mode, dashReq: () => dashReq, raceTime: () => raceTime,
    // 좌우 검사: 오른쪽 조향이 화면 오른쪽으로 가는지 (양수면 맞다)
    checkSteer: (dir) => {
      const k = RACE.players[0];
      if (!k) return null;
      const cam = RACE.camera;
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0).setY(0).normalize();
      const p0 = k.S.pos.clone();
      const saved = window.__akAuto;
      window.__akAuto = false;
      const key2 = dir > 0 ? 'ArrowRight' : 'ArrowLeft';
      key.ArrowUp = true;
      key[key2] = true;
      for (let i = 0; i < 45; i++) tick(1 / 60);
      key[key2] = false;
      key.ArrowUp = false;
      window.__akAuto = saved;
      const d = k.S.pos.clone().sub(p0).setY(0);
      return +d.dot(right).toFixed(2);
    },
    set auto(v) { window.__akAuto = v; },
    get auto() { return !!window.__akAuto; },
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else addEventListener('DOMContentLoaded', boot);
})();
