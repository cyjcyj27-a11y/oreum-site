// 포켓볼 진행: 타이틀 → STAGE(상대 12명) → 경기(8볼, 선승) → 이기면 다음 상대 → … → 12번째를 이기면 엔딩.
// 카드·도감은 10/15 사장님 "카드주는거 없애고 걍 win만 하게하자 판수 오를수록 상대가 실력있어지는거로 충분" 으로 뺐다.
(function () {
  const P = PHY, RU = RULES, RD = RND, AU = window.AU, R = P.R;
  const $ = (id) => document.getElementById(id);
  const SK = 'pocketball.save';
  const OPP = [
    { n: '동네 형', race: 1 }, { n: '알바생 지수', race: 1 }, { n: '동아리 회장', race: 1 },
    { n: '퇴근한 김 과장', race: 2 }, { n: 'PC방 사장님', race: 2 }, { n: '단골 할아버지', race: 2 },
    { n: '체대생 민호', race: 2 }, { n: '야간 동호회장', race: 2 }, { n: '구청장배 우승자', race: 3 },
    { n: '프로 지망생', race: 3 }, { n: '은퇴한 프로', race: 3 }, { n: '당구장 사장님', race: 3 },
  ];
  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {}
    s = s || {};
    return Object.assign({ stage: 0, loop: 0, how: 0 }, s);
  }
  const S = load();
  const save = () => { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) {} };

  const G = {
    mode: 'title', balls: P.newBalls(), st: { turn: 0, group: [null, null], brk: true },
    phase: 'idle', aim: 0, power: 0, sv: 0, ss: 0, inHand: false, headOnly: true,
    wins: [0, 0], race: 1, opp: 0, players: [{ n: '나' }, { n: '상대', ai: true, lvl: 0 }],
    fx: null, ev: null, before: null, beforeSt: null, breaker: 0, streak: 0,
    strike: 0, pull: 0, aiAnim: null,
  };
  window.__G = G; window.__S = S;
  P.rack(G.balls);

  // 조작·겨눔선 배율(카드를 뺀 뒤로 늘 0)
  const FX0 = { guide: 0, obj: 0, cueL: 0, touch: 0, fine: 0, spin: 0, calm: 0, bank: 0, brk: 0 };
  G.fx = FX0;
  function applyFx() {}
  const MAXV = () => P.MAXV;
  // 힘 막대 → 빠르기. touch 카드는 곡선을 더 눕혀 약한 샷을 섬세하게
  const speedOf = (p, brk) => 0.3 + (MAXV() * (brk ? P.BRK * (1 + G.fx.brk) : 1) - 0.3) * Math.pow(p, 1.3 + G.fx.touch);
  const guideLen = () => 1.05 * (1 + G.fx.guide);

  // ── 상단바
  function rackHtml(g, who) {
    if (!g) return '';
    return RU.of(g).map((i) => {
      const c = RD.BALLC[((i - 1) % 8) + 1];
      const on = G.balls[i].on;
      const bg = i >= 9 ? `linear-gradient(180deg,#f2eee4 0 28%,${c} 28% 72%,#f2eee4 72%)` : c;
      return `<i class="${on ? '' : 'gone'}" style="background:${bg}"></i>`;
    }).join('') + (RU.left(G.balls, g) === 0 ? `<i style="background:#16151a"></i>` : '');
  }
  function hud() {
    for (let k = 0; k < 2; k++) {
      $('nm' + k).textContent = G.players[k].n;
      $('w' + k).textContent = G.wins[k];
      $('rk' + k).innerHTML = rackHtml(G.st.group[k], k);
      $('pl' + k).classList.toggle('on', G.st.turn === k && G.phase !== 'over');
    }
    $('race').textContent = G.mode === 'career' ? `선승 ${G.race}` : '';
    document.body.classList.toggle('lesson', G.mode === 'lesson');
  }
  // ── 큰 글자·튀는 글자
  let msgT = 0;
  function msg(t, cls) {
    const m = $('msg'); m.className = ''; void m.offsetWidth; m.textContent = t; m.className = 'show' + (cls ? ' ' + cls : '');
    clearTimeout(msgT); msgT = setTimeout(() => (m.className = ''), 1300);
  }
  function pop(t, x, y, col) {
    const p = RD.toScreen(x, y, 0.05), e = document.createElement('div');
    e.className = 'pop'; e.textContent = t; e.style.left = p.x + 'px'; e.style.top = p.y + 'px'; if (col) e.style.color = col;
    document.body.appendChild(e); setTimeout(() => e.remove(), 1000);
  }
  function show(id, on) {
    $(id).hidden = !on;
    document.body.classList.toggle('modal', [...document.querySelectorAll('.scr')].some((e) => !e.hidden));
  }

  // ── 프레임·차례
  function startFrame(breaker) {
    RD.clearDrops();
    P.rack(G.balls, Math.random);
    G.st = { turn: breaker, group: [null, null], brk: true };
    G.inHand = true; G.headOnly = true; G.breaker = breaker;
    G.streak = 0;
    G.sv = 0; G.ss = 0; spinDots();
    G.aim = 0;
    beginTurn(true);
  }
  function legalNow() { return RU.legal(G.balls, G.st); }
  // 자동 겨눔은 레슨에서만(10/15 사장님 "각도를 자동으로 맞춰주니까 넘 잘들어가서 … 게임성이 떨어지는게 아쉽네" → 레슨/플레이 나눔)
  function defaultAim() {
    const c = G.balls[0], ids = legalNow();
    if (G.mode !== 'lesson') { if (G.st.brk) G.aim = 0; return; }   // 플레이: 브레이크는 대 쪽으로만, 그 뒤엔 큐를 마지막 자리 그대로
    if (G.st.brk) { G.aim = Math.atan2(-c.y, P.HL / 2 - c.x); return; }
    const cs = AI.candidates(G.balls, ids);
    if (cs.length) { G.aim = cs[0].a; return; }
    let bd = 9;
    ids.forEach((i) => { const b = G.balls[i], d = Math.hypot(b.x - c.x, b.y - c.y); if (d < bd) { bd = d; G.aim = Math.atan2(b.y - c.y, b.x - c.x); } });
  }
  function beginTurn(first) {
    const pl = G.players[G.st.turn];
    G.power = 0; setPowerUi(0);
    if (G.inHand) { const c = G.balls[0]; c.on = true; if (!P.canPlace(G.balls, c.x, c.y, G.headOnly)) { const f = P.freeSpot(G.balls, G.headOnly ? -P.HL / 2 : -P.HL / 2, 0, 0); c.x = f.x; c.y = f.y; } }
    hud();
    if (pl.ai) {
      G.phase = 'ai';
      ctlDim(true);
      setTimeout(aiTurn, 300);
    } else {
      G.phase = 'aim';
      ctlDim(false);
      defaultAim();
      if (G.inHand && !G.st.brk) msg('BALL IN HAND', 'gold');
      else if (!first && G.mode === 'vs') msg(pl.n, '');
    }
  }
  function ctlDim(on) { document.querySelectorAll('.ctl').forEach((e) => e.classList.toggle('dim', on)); }

  // ── 치기
  function shoot(a, v, sv, ss) {
    if (G.phase === 'roll' || G.phase === 'strike') return;
    G.before = P.clone(G.balls);
    G.beforeSt = { turn: G.st.turn, group: G.st.group.slice(), brk: G.st.brk, inHand: G.inHand, headOnly: G.headOnly };
    G.shot = { a, v, sv, ss };
    G.phase = 'strike'; G.strike = 0; G.inHand = false;
    RD.placeRing(0, 0, false);
    RD.guideOff();
  }
  function release() {
    const s = G.shot;
    P.shoot(G.balls, s.a, s.v, s.sv, s.ss);
    G.ev = P.newEv(true); G.seenPk = 0; G.phase = 'roll'; G.rollT = 0;
    AU.play('cue', Math.min(1, s.v / 6));
    if (G.st.brk && s.v > 4) AU.play('brk');
    if (G.st.brk) RD.shake(0.006 * Math.min(1, s.v / 6));
  }
  function rolling(dt) {
    G.rollT += dt;
    const fast = G.rollT > 6 ? 2.5 : 1;                       // 너무 오래 구르면 빨리
    const n = Math.max(1, Math.round((dt * fast) / P.DT));
    let moving = false;
    for (let k = 0; k < n; k++) moving = P.step(G.balls, G.ev) || moving;
    // 소리
    const sn = G.ev.sounds;
    for (const e of sn) { if (e.type === 'ball') AU.hit('ball', e.v); else if (e.type === 'rail') AU.hit('rail', e.v * 0.8); }
    sn.length = 0;
    // 포켓에 들어감
    while (G.seenPk < G.ev.pocketed.length) {
      const p = G.ev.pocketed[G.seenPk++];
      RD.drop(p.id, p.p, p.x, p.y);
      AU.play('pocket');
      const pk = P.POCKETS[p.p];
      if (p.id > 0) pop(String(p.id), pk.x, pk.y, p.id === 8 ? '#fff' : RD.BALLC[((p.id - 1) % 8) + 1]);
    }
    if (!moving) endShot();
  }

  function endShot() {
    G.phase = 'judge';
    if (G.mode === 'lesson') return lessonShot();
    const me = G.st.turn, human = !G.players[me].ai;
    const r = RU.judge(G.before, G.st, G.ev);
    const wasBrk = G.st.brk;
    G.st.brk = false;
    if (r.respot8) { const f = P.freeSpot(G.balls, P.HL / 2, 0, 8); const b = G.balls[8]; b.on = true; b.x = f.x; b.y = f.y; b.vx = b.vy = 0; RD.hideBall(8, false); }
    if (r.win) return frameEnd(me);
    if (r.lose) { msg(r.scratch ? 'SCRATCH' : 'FOUL', 'red'); AU.play('foul'); return setTimeout(() => frameEnd(1 - me), 900); }
    if (r.assign) {
      G.st.group[me] = r.assign; G.st.group[1 - me] = r.assign === 'S' ? 'T' : 'S';
    }
    afterJudge(r, wasBrk);
  }
  // 레슨: 혼자 아무 공이나 넣기. 흰 공이 빠지면 아무 데나 다시 놓고, 다 넣으면 새로 놓는다
  function lessonShot() {
    G.st.brk = false;
    const pk = G.ev.pocketed.map((p) => p.id), objs = pk.filter((i) => i !== 0);
    G.wins[0] += objs.length;
    if (pk.includes(0)) {
      msg('SCRATCH', 'red'); AU.play('foul');
      const c = G.balls[0], f = P.freeSpot(G.balls, -P.HL / 2, 0, 0); c.on = true; c.vx = c.vy = 0; c.x = f.x; c.y = f.y; RD.hideBall(0, false);
      G.inHand = true; G.headOnly = false; G.streak = 0;
    } else if (objs.length) {
      G.streak += objs.length;
      msg(objs.length >= 3 ? 'PERFECT' : objs.length === 2 ? 'GREAT' : 'NICE', objs.length >= 2 ? 'gold' : '');
      AU.play(objs.length >= 2 ? 'great' : 'pot', G.streak);
    } else G.streak = 0;
    let left = 0; for (let i = 1; i < 16; i++) if (G.balls[i].on) left++;
    if (!left) { setTimeout(() => { msg('CLEAR', 'gold'); AU.play('win'); }, 500); return setTimeout(() => startFrame(0), 2200); }
    setTimeout(() => beginTurn(), 600);
  }
  function startLesson() {
    G.mode = 'lesson'; G.race = 99; G.wins = [0, 0];
    G.players = [{ n: '레슨' }, { n: '' }];
    applyFx();
    enterPlay();
    startFrame(0);
  }
  function afterJudge(r, wasBrk) {
    const me = G.st.turn, human = !G.players[me].ai;
    if (r.foul) {
      msg(r.scratch ? 'SCRATCH' : 'FOUL', 'red'); AU.play('foul');
      if (r.scratch) { const c = G.balls[0]; c.on = true; c.vx = c.vy = 0; RD.hideBall(0, false); }
      G.st.turn = 1 - me; G.inHand = true; G.headOnly = false; G.streak = 0;
      if (r.scratch) { const f = P.freeSpot(G.balls, -P.HL / 2, 0, 0); G.balls[0].x = f.x; G.balls[0].y = f.y; }
      return setTimeout(() => beginTurn(), 900);
    }
    if (r.cont) {
      G.streak += r.own;
      const n = r.own;
      if (r.assign) msg(r.assign === 'S' ? 'SOLIDS' : 'STRIPES', 'gold');
      else if (wasBrk) msg('BREAK!', 'gold');
      else msg(n >= 3 ? 'PERFECT' : n === 2 ? 'GREAT' : 'NICE', n >= 2 ? 'gold' : '');
      AU.play(n >= 2 ? 'great' : 'pot', G.streak);
      return setTimeout(() => beginTurn(), 650);
    }
    // 놓침
    G.streak = 0;
    G.st.turn = 1 - me;
    AU.play('turn');
    setTimeout(() => beginTurn(), 450);
  }
  function frameEnd(w) {
    G.phase = 'over';
    G.wins[w]++;
    hud();
    const meWon = w === 0;
    if (G.mode === 'vs') { msg(G.players[w].n + ' WIN', 'gold'); AU.play('win'); }
    else { msg(meWon ? 'WIN' : 'LOSE', meWon ? 'gold' : 'red'); AU.play(meWon ? 'win' : 'lose'); }
    setTimeout(() => {
      if (G.mode === 'vs') {
        showRes(G.players[w].n + ' WIN', '', `${G.wins[0]} : ${G.wins[1]}`, [['NEXT', () => { show('res', false); startFrame(1 - G.breaker); }, 'btn'], ['홈', toTitle, 'btn wood']]);
        return;
      }
      if (G.wins[w] >= G.race) return matchEnd(meWon);
      startFrame(1 - G.breaker);
    }, 1700);
  }
  function matchEnd(won) {
    const o = OPP[G.opp];
    if (won) {
      AU.play('win');
      const fresh = G.opp >= S.stage;            // 처음 이긴 상대면 다음 상대가 열림
      showRes('VICTORY', o.n, `${G.wins[0]} : ${G.wins[1]}`, [['NEXT', () => {
        show('res', false);
        if (!fresh) return openMap();
        S.stage = Math.max(S.stage, G.opp + 1); save();
        if (S.stage >= 12) openEnd(); else openMap();
      }, 'btn']]);
    } else {
      showRes('DEFEAT', o.n, `${G.wins[0]} : ${G.wins[1]}`, [['RETRY', () => { show('res', false); startMatch(G.opp); }, 'btn'], ['STAGE', () => { show('res', false); openMap(); }, 'btn wood']], false, true);
    }
  }
  function showRes(big, sub, score, btns, small, lose) {
    $('resBig').textContent = big; $('resBig').className = lose ? 'lose' : '';
    $('resSub').textContent = sub || ''; $('resScore').textContent = score || '';
    const bx = $('resBtns'); bx.innerHTML = '';
    btns.forEach(([t, f, cls]) => { const b = document.createElement('button'); b.className = cls; b.textContent = t; b.onclick = () => { AU.play('click'); f(); }; bx.appendChild(b); });
    show('res', true);
  }

  // ── 컴퓨터 차례: 생각(0.3초 뒤) → 흰 공 놓기 → 큐를 천천히 돌려 겨눔 → 당겼다 침. 합쳐서 1~1.5초 남짓
  function aiTurn() {
    if (G.phase !== 'ai') return;
    const pl = G.players[G.st.turn];
    const t0 = performance.now();
    if (G.inHand) {
      const sp = AI.place(G.balls, G.st, pl.lvl, G.headOnly);
      const c = G.balls[0]; c.x = sp.x; c.y = sp.y; c.on = true;
    }
    const plan = AI.plan(G.balls, G.st, pl.lvl, 1 + G.fx.calm);
    const think = performance.now() - t0;
    let a0 = G.aim, d = plan.a - a0;
    while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    const wait = Math.max(0, 300 + Math.random() * 300 - think);
    G.aiAnim = { t: 0, a0, d, plan, wait: wait / 1000, turn: 0.42, pull: 0.34 };
    G.phase = 'aiAim';
  }
  function aiAnimStep(dt) {
    const A = G.aiAnim;
    A.t += dt;
    const k = Math.min(1, A.t / (A.wait + A.turn));
    const e = 1 - Math.pow(1 - k, 3);
    G.aim = A.a0 + A.d * e;
    const pk = Math.max(0, Math.min(1, (A.t - A.wait - A.turn) / A.pull));
    G.power = Math.min(1, A.plan.v / MAXV()) * pk;
    if (A.t >= A.wait + A.turn + A.pull + 0.15) { G.aim = A.plan.a; shoot(A.plan.a, A.plan.v, A.plan.sv || 0, A.plan.ss || 0); }
  }

  // ── 경기 시작
  function startMatch(i) {
    G.mode = 'career'; G.opp = i; G.race = OPP[i].race; G.wins = [0, 0];
    G.players = [{ n: '나' }, { n: OPP[i].n, ai: true, lvl: i }];
    applyFx();
    enterPlay();
    startFrame(0);
  }
  function startVs() {
    G.mode = 'vs'; G.race = 99; G.wins = [0, 0];
    G.players = [{ n: 'P1' }, { n: 'P2' }];
    applyFx();
    enterPlay();
    startFrame(0);
  }
  function enterPlay() {
    ['map', 'res', 'end'].forEach((k) => show(k, false));
    document.body.classList.add('playing');
    layout();
    RD.setMode('play');
  }
  function toTitle() {
    ['map', 'res', 'end', 'how'].forEach((k) => show(k, false));
    document.body.classList.remove('playing');
    G.mode = 'title'; G.phase = 'idle';
    RD.guideOff(); RD.cuePose(0, 0, 0, 0, false); RD.placeRing(0, 0, false);
    RD.clearDrops(); P.rack(G.balls);
    RD.setMode('title');
  }

  // ── STAGE(상대 고르기)
  function openMap() {
    show('map', true);
    const g = $('mapGrid'); g.innerHTML = '';
    $('mapN').textContent = `${Math.min(S.stage, 12)} / 12` + (S.loop ? `  ·  ${S.loop + 1}회차` : '');
    OPP.forEach((o, i) => {
      const b = document.createElement('button');
      const st = i < S.stage ? 'done' : i === S.stage ? 'cur' : 'lock';
      b.className = 'opp ' + st;
      b.innerHTML = `<span class="no">${i + 1}</span><span class="nm">${o.n}</span><span class="ra">선승 ${o.race}</span>`;
      if (st !== 'lock') b.onclick = () => { AU.play('click'); show('map', false); startMatch(i); };
      g.appendChild(b);
    });
  }

  // ── 엔딩: 마지막 상대까지 이김
  function openEnd() {
    RD.setMode('title');
    $('endTxt').innerHTML = `당구장 사장님이 큐를 내려놓았다<br>오늘부터 이 동네 1등은 나다`;
    show('end', true);
    AU.play('champ');
  }
  $('endOk').onclick = () => { AU.play('click'); S.loop++; S.stage = 0; save(); toTitle(); };

  // ── 조작
  const cv = $('cv');
  let drag = null;
  const myTurn = () => G.phase === 'aim' && !G.players[G.st.turn].ai;
  cv.addEventListener('pointerdown', (e) => {
    AU.unlock();
    if (!myTurn()) return;
    const p = RD.pick(e.clientX, e.clientY); if (!p) return;
    const c = G.balls[0];
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    if (G.inHand && Math.hypot(p.x - c.x, p.y - c.y) < R * 3.4) drag = { type: 'place', ox: c.x - p.x, oy: c.y - p.y };
    else { drag = { type: 'aim' }; aimAt(p); }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag || !myTurn()) return;
    const p = RD.pick(e.clientX, e.clientY); if (!p) return;
    if (drag.type === 'place') {
      const x = p.x + drag.ox, y = p.y + drag.oy;
      const lim = G.headOnly ? -P.HL / 2 : P.HL - R;
      const nx = Math.max(-P.HL + R, Math.min(lim, x)), ny = Math.max(-P.HW + R, Math.min(P.HW - R, y));
      if (P.canPlace(G.balls, nx, ny, G.headOnly)) { G.balls[0].x = nx; G.balls[0].y = ny; }
    } else aimAt(p);
  });
  const endDrag = () => { drag = null; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('wheel', (e) => { if (myTurn()) { G.aim += Math.sign(e.deltaY) * 0.0035 * (1 - G.fx.fine * 0.6); e.preventDefault(); } }, { passive: false });
  function aimAt(p) { const c = G.balls[0]; if (Math.hypot(p.x - c.x, p.y - c.y) > R * 0.8) G.aim = Math.atan2(p.y - c.y, p.x - c.x); }

  // 미세 바퀴
  const fine = $('fine');
  let fd = null, fpos = 0;
  fine.addEventListener('pointerdown', (e) => { AU.unlock(); try { fine.setPointerCapture(e.pointerId); } catch (er) {} fd = { x: e.clientX, y: e.clientY }; });
  fine.addEventListener('pointermove', (e) => {
    if (!fd || !myTurn()) return;
    const port = document.body.classList.contains('port');
    const d = port ? e.clientX - fd.x : e.clientY - fd.y;
    fd = { x: e.clientX, y: e.clientY };
    G.aim += d * 0.0007 * (1 - G.fx.fine * 0.6) * (port ? -1 : 1);
    fpos += d; fine.style.backgroundPosition = port ? `0 0, ${fpos}px 0` : `0 0, 0 ${fpos}px`;
  });
  fine.addEventListener('pointerup', () => (fd = null)); fine.addEventListener('pointercancel', () => (fd = null));

  // 힘 막대: 당기면 힘, 놓으면 침
  const pw = $('power');
  let pd = null;
  function setPowerUi(p) {
    const port = document.body.classList.contains('port');
    const f = $('pfill'), cu = $('pcue');
    if (port) { f.style.width = `calc(${p * 100}% - ${p * 12}px)`; f.style.height = ''; cu.style.transform = `translateX(${-p * 70}%)`; }
    else { f.style.height = `calc(${p * 100}% - ${p * 12}px)`; f.style.width = ''; cu.style.transform = `translateY(${p * 70}%)`; }
    $('pnum').textContent = p > 0.005 ? Math.round(p * 100) : '';
  }
  pw.addEventListener('pointerdown', (e) => { AU.unlock(); if (!myTurn()) return; try { pw.setPointerCapture(e.pointerId); } catch (er) {} pd = { x: e.clientX, y: e.clientY }; });
  pw.addEventListener('pointermove', (e) => {
    if (!pd || !myTurn()) return;
    const port = document.body.classList.contains('port'), r = pw.getBoundingClientRect();
    const p = port ? Math.abs(e.clientX - pd.x) / (r.width * 0.85) : Math.abs(e.clientY - pd.y) / (r.height * 0.85);   // 어느 쪽으로 당겨도 힘(10/15 세로 폰에서 큐 뒤쪽=왼쪽으로 당기면 0 이라 안 쳐졌음)
    G.power = Math.max(0, Math.min(1, p)); setPowerUi(G.power);
  });
  function powerRelease() {
    if (!pd) return; pd = null;
    if (myTurn() && G.power > 0.02) fire(); else { G.power = 0; setPowerUi(0); }
  }
  pw.addEventListener('pointerup', powerRelease); pw.addEventListener('pointercancel', () => { pd = null; G.power = 0; setPowerUi(0); });
  function fire() {
    S.shots = (S.shots || 0) + 1; save();
    const v = speedOf(G.power, G.st.brk);
    const k = 0.78 * (1 + G.fx.spin);
    shoot(G.aim, v, G.sv * k, G.ss * k);
  }

  // 회전 공
  function spinDots() {
    const set = (el, sz) => { el.style.left = 50 + G.ss * 50 * sz + '%'; el.style.top = 50 - G.sv * 50 * sz + '%'; };
    set($('sdot'), 0.8); set($('sdotB'), 0.8);
  }
  $('spin').onclick = () => { AU.unlock(); if (!myTurn()) return; AU.play('click'); show('spinPop', true); };
  const big = $('spinBig');
  let sd = false;
  function spinAt(e) {
    const r = big.getBoundingClientRect();
    let x = ((e.clientX - r.left) / r.width - 0.5) * 2 / 0.8, y = -((e.clientY - r.top) / r.height - 0.5) * 2 / 0.8;
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    G.ss = Math.abs(x) < 0.08 ? 0 : x; G.sv = Math.abs(y) < 0.08 ? 0 : y; spinDots();
  }
  big.addEventListener('pointerdown', (e) => { e.stopPropagation(); try { big.setPointerCapture(e.pointerId); } catch (er) {} sd = true; spinAt(e); });
  big.addEventListener('pointermove', (e) => { if (sd) spinAt(e); });
  big.addEventListener('pointerup', (e) => { e.stopPropagation(); sd = false; setTimeout(() => show('spinPop', false), 160); });
  $('spinPop').addEventListener('pointerdown', (e) => { if (e.target === $('spinPop')) show('spinPop', false); });
  big.addEventListener('dblclick', () => { G.sv = G.ss = 0; spinDots(); });

  // 키보드: ←→ 겨눔(Shift 크게), 스페이스 꾹 = 힘 모으기, 떼면 침
  let spaceT = null;
  addEventListener('keydown', (e) => {
    if (!myTurn()) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowUp') { G.aim -= (e.shiftKey ? 0.02 : 0.0025) * (1 - G.fx.fine * 0.6); e.preventDefault(); }
    if (k === 'ArrowRight' || k === 'ArrowDown') { G.aim += (e.shiftKey ? 0.02 : 0.0025) * (1 - G.fx.fine * 0.6); e.preventDefault(); }
    if (k === ' ' && spaceT == null) { spaceT = performance.now(); e.preventDefault(); }
  });
  addEventListener('keyup', (e) => {
    if (e.key === ' ' && spaceT != null) { spaceT = null; if (myTurn() && G.power > 0.02) fire(); else { G.power = 0; setPowerUi(0); } }
  });

  // ── 화면 배치: 당구대는 조작 칸을 뺀 자리에 꽉 차게
  function layout() {
    const port = innerHeight > innerWidth * 1.05;
    document.body.classList.toggle('port', port);
    setPowerUi(G.power);
    const hb = $('hud').getBoundingClientRect().bottom;
    const m = { t: Math.max(44, hb + 2), b: 8, l: 8, r: 8 };
    if (port) {
      let top = innerHeight;
      ['fine', 'powerW', 'spin'].forEach((k) => (top = Math.min(top, $(k).getBoundingClientRect().top)));
      m.b = innerHeight - top + 10; m.l = m.r = 6;
    } else {
      m.l = $('fine').getBoundingClientRect().right + 8;
      m.r = innerWidth - Math.min($('powerW').getBoundingClientRect().left, $('spin').getBoundingClientRect().left) + 8;
    }
    RD.margin = m;
    RD.resize();
  }
  addEventListener('resize', () => { layout(); });

  // ── 그리기 고리
  let lt = performance.now(), ringT = 0;
  function tick(t) {
    const dt = Math.min(0.05, Math.max(0, (t - lt) / 1000)); lt = t;
    if (G.phase === 'roll') rolling(dt);
    else if (G.phase === 'aiAim') aiAnimStep(dt);
    else if (G.phase === 'strike') { G.strike += dt; if (G.strike >= 0.1) release(); }
    $('powerW').classList.toggle('hint', myTurn() && G.phase === 'aim' && G.power < 0.01 && (S.shots || 0) < 5);
    // 흰 공을 옮길 수 있을 때(상대 파울, 브레이크 전): 흰 공 둘레 화살표 + 끌어서 옮겨요
    const hand = $('hand'), showHand = myTurn() && G.phase === 'aim' && G.inHand && G.power < 0.01 && document.body.classList.contains('playing');
    hand.hidden = !showHand;
    if (showHand) {
      const c0 = G.balls[0], p = RD.toScreen(c0.x, c0.y), rpx = Math.max(10, (RD.pxPerM() * R) + 8);
      hand.style.left = p.x + 'px'; hand.style.top = p.y + 'px'; hand.style.setProperty('--r', rpx + 'px');
      hand.classList.toggle('up', p.y > innerHeight * 0.66);
    }
    if (spaceT != null && myTurn()) { G.power = Math.min(1, (performance.now() - spaceT) / 1100); setPowerUi(G.power); }
    RD.sync(G.balls, dt);
    const c = G.balls[0];
    if (G.mode !== 'title' && document.body.classList.contains('playing')) {
      const aiming = G.phase === 'aim' || G.phase === 'aiAim' || G.phase === 'strike';
      let pull = G.power * 0.22;
      if (G.phase === 'strike') { const k = Math.min(1, G.strike / 0.1); pull = (G.shot ? Math.min(1, G.shot.v / MAXV()) * 0.22 : 0) * (1 - k * k) - 0.012 * k; }
      RD.cuePose(c.x, c.y, G.aim, pull, aiming && c.on);
      if (G.phase === 'aim' && myTurn() && G.mode !== 'lesson') { RD.guideOff(); RD.placeRing(c.x, c.y, G.inHand, true); }
      else if (G.phase === 'aim' && myTurn()) {
        let hit = P.trace(G.balls, G.aim);
        const L = guideLen();
        if (hit && hit.t > L) hit = { type: 'none', t: L, x: c.x + Math.cos(G.aim) * L, y: c.y + Math.sin(G.aim) * L };
        const bad = hit && hit.type === 'ball' && !G.st.brk && !legalNow().includes(hit.id);
        RD.guide(c, G.aim, hit, { balls: G.balls, objLen: 0.42 * (1 + G.fx.obj), cueLen: 0.26 * (1 + G.fx.cueL), bank: G.fx.bank, bad });
        ringT += dt;
        RD.placeRing(c.x, c.y, G.inHand, true);
      } else if (G.phase !== 'strike') { RD.guideOff(); RD.placeRing(0, 0, false); }
    }
    RD.frame(dt);
    if (!$('how').hidden) howDraw(t / 1000);
  }
  function loop(t) { tick(t); requestAnimationFrame(loop); }

  // ── HOW TO PLAY: 실제 게임 화면을 작게 그려서, 손가락이 무엇을 만지는지 되풀이해 보여 준다
  //    (10/15 사장님 "내가 이 설명만 보고도 오른쪽 당구큣대를 쳐야되는건지 몰랐어" → 토이크레인처럼 실제 화면 모양으로 다시 그림)
  //    폰 세로면 세로 화면(아래 조작 줄)으로 그린다
  function hball(g, x, y, r, col, stripe) {
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    g.fillStyle = stripe ? '#f4f1e8' : col; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    if (stripe) { g.fillStyle = col; g.fillRect(x - r, y - r * 0.45, 2 * r, r * 0.9); }
    const sh = g.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r * 1.05);
    sh.addColorStop(0, 'rgba(255,255,255,.55)'); sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.4)');
    g.fillStyle = sh; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function howLayout(W, H, port) {
    if (!port) {
      const S = { x: 8, y: 8, w: W - 16, h: H - 16 };
      return { S, port, table: { x: S.x + 46, y: S.y + 16, w: S.w - 96, h: S.h - 28 },
        wheel: { x: S.x + 10, y: S.y + S.h * 0.22, w: 24, h: S.h * 0.56 },
        bar: { x: S.x + S.w - 38, y: S.y + S.h * 0.12, w: 28, h: S.h * 0.58 },
        spin: { x: S.x + S.w - 24, y: S.y + S.h - 22, r: 14 } };
    }
    const S = { x: W / 2 - 80, y: 6, w: 160, h: H - 12 };
    return { S, port, table: { x: S.x + 10, y: S.y + 10, w: S.w - 20, h: S.h - 72 },
      wheel: { x: S.x + 36, y: S.y + S.h - 50, w: 40, h: 22 },
      bar: { x: S.x + 84, y: S.y + S.h - 54, w: 68, h: 30 },
      spin: { x: S.x + 18, y: S.y + S.h - 38, r: 12 } };
  }
  // 당구대 위 좌표(0..1) → 캔버스. 세로 화면이면 대를 세운다
  function tpt(L, u, v) { const t = L.table; return L.port ? { x: t.x + (1 - v) * t.w, y: t.y + (1 - u) * t.h } : { x: t.x + u * t.w, y: t.y + v * t.h }; }
  function hScreen(g, L, hi) {
    const S = L.S, t = L.table;
    g.fillStyle = '#0d0a08'; rr(g, S.x, S.y, S.w, S.h, 10); g.fill();
    g.strokeStyle = '#3a2a1e'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#4a1a0c'; rr(g, t.x - 7, t.y - 7, t.w + 14, t.h + 14, 8); g.fill();
    g.fillStyle = '#17683d'; g.fillRect(t.x, t.y, t.w, t.h);
    g.fillStyle = '#050403';
    const P = L.port ? [[0, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [1, 1]] : [[0, 0], [0.5, 0], [1, 0], [0, 1], [0.5, 1], [1, 1]];
    P.forEach(([a, b]) => { g.beginPath(); g.arc(t.x + a * t.w, t.y + b * t.h, 6, 0, 7); g.fill(); });
    const w = L.wheel; g.fillStyle = '#1a120c'; rr(g, w.x, w.y, w.w, w.h, 8); g.fill();
    g.fillStyle = '#3a2a1e';
    if (L.port) for (let x = w.x + 4; x < w.x + w.w - 2; x += 5) g.fillRect(x, w.y + 3, 2, w.h - 6);
    else for (let y = w.y + 4; y < w.y + w.h - 2; y += 5) g.fillRect(w.x + 3, y, w.w - 6, 2);
    if (hi === 'wheel') { g.strokeStyle = '#f2c75a'; g.lineWidth = 3; rr(g, w.x - 3, w.y - 3, w.w + 6, w.h + 6, 10); g.stroke(); }
    const s = L.spin; hball(g, s.x, s.y, s.r, '#f4f1e8'); g.fillStyle = '#d8202a'; g.beginPath(); g.arc(s.x, s.y, 3, 0, 7); g.fill();
    if (hi === 'spin') { g.strokeStyle = '#f2c75a'; g.lineWidth = 3; g.beginPath(); g.arc(s.x, s.y, s.r + 4, 0, 7); g.stroke(); }
  }
  // 오른쪽(세로면 아래 오른쪽) 큐 막대. p = 당긴 정도 0..1
  function hBar(g, L, p, hi) {
    const b = L.bar;
    g.fillStyle = '#0a0604'; rr(g, b.x, b.y, b.w, b.h, 7); g.fill();
    g.strokeStyle = hi ? '#f2c75a' : '#7a4a28'; g.lineWidth = hi ? 3 : 2; g.stroke();
    const gr = L.port ? g.createLinearGradient(b.x + b.w, 0, b.x, 0) : g.createLinearGradient(0, b.y, 0, b.y + b.h);
    gr.addColorStop(0, '#5ad06a'); gr.addColorStop(0.55, '#f2c75a'); gr.addColorStop(1, '#e8502a');
    g.fillStyle = gr;
    if (L.port) g.fillRect(b.x + b.w - 4 - (b.w - 8) * p, b.y + 4, (b.w - 8) * p, b.h - 8);
    else g.fillRect(b.x + 4, b.y + 4, b.w - 8, (b.h - 8) * p);
    g.save(); g.beginPath(); g.rect(b.x + 2, b.y + 2, b.w - 4, b.h - 4); g.clip();
    if (L.port) {
      const len = b.w - 8, x0 = b.x + 4 - p * len * 0.7, cy = b.y + b.h / 2;
      g.fillStyle = '#1a1a1a'; g.fillRect(x0, cy - 3, len * 0.35, 6); g.fillStyle = '#e9cf9c'; g.fillRect(x0 + len * 0.35, cy - 3, len * 0.58, 6); g.fillStyle = '#2f6fd0'; g.fillRect(x0 + len * 0.93, cy - 3, len * 0.07, 6);
    } else {
      const len = b.h - 8, y0 = b.y + 4 + p * len * 0.7, cx = b.x + b.w / 2;
      g.fillStyle = '#2f6fd0'; g.fillRect(cx - 3, y0, 6, len * 0.06); g.fillStyle = '#e9cf9c'; g.fillRect(cx - 3, y0 + len * 0.06, 6, len * 0.58); g.fillStyle = '#5a2a14'; g.fillRect(cx - 3, y0 + len * 0.64, 6, len * 0.36);
    }
    g.restore();
  }
  function finger(g, x, y, press) {
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 6;
    g.fillStyle = press ? 'rgba(255,236,170,.9)' : 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(x, y, press ? 11 : 13, 0, 7); g.fill();
    g.restore(); g.strokeStyle = '#1a0a04'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, press ? 11 : 13, 0, 7); g.stroke();
  }
  function hCue(g, L, cb, ang, pull) {     // 당구대 위 큐: 흰 공 뒤에서 ang 방향(캔버스 각)으로
    const d0 = 12 + pull, len = 150;
    const x1 = cb.x - Math.cos(ang) * d0, y1 = cb.y - Math.sin(ang) * d0, x2 = x1 - Math.cos(ang) * len, y2 = y1 - Math.sin(ang) * len;
    g.save(); g.beginPath(); g.rect(L.S.x, L.S.y, L.S.w, L.S.h); g.clip();
    g.lineCap = 'round'; g.strokeStyle = '#e9cf9c'; g.lineWidth = 4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = '#5a2a14'; g.lineWidth = 5; g.beginPath(); g.moveTo(x1 - Math.cos(ang) * len * 0.62, y1 - Math.sin(ang) * len * 0.62); g.lineTo(x2, y2); g.stroke();
    g.fillStyle = '#2f6fd0'; g.beginPath(); g.arc(x1, y1, 2.4, 0, 7); g.fill(); g.restore();
  }
  function rack(g, L, u0) {
    const cols = ['#f2b705', '#1446a8', '#d2261d', '#5a2a86', '#ef6a10', '#137a3a', '#7a1f1a', '#16151a', '#f2b705', '#1446a8'];
    let k = 0;
    for (let r = 0; r < 4; r++) for (let j = 0; j <= r; j++) { const p = tpt(L, u0 + r * 0.035, 0.5 + (j - r / 2) * 0.06); hball(g, p.x, p.y, 6, cols[k % cols.length], k % 3 === 1); k++; }
  }
  function howDraw(t) {
    const port = document.body.classList.contains('port') || innerHeight > innerWidth * 1.05;
    document.querySelectorAll('#how canvas').forEach((c, i) => {
      try {
        const g = c.getContext('2d'), W = c.width, H = c.height, L = howLayout(W, H, port);
        g.clearRect(0, 0, W, H);
        if (i === 0) {           // 1. 당구대를 끌어 큐 방향 정하기 → 바퀴로 조금씩
          const ph = (t % 4) / 4;
          hScreen(g, L, ph > 0.55 ? 'wheel' : null); hBar(g, L, 0, false);
          rack(g, L, 0.72);
          const cb = tpt(L, 0.28, 0.5);
          const k = ph < 0.55 ? Math.sin(Math.min(1, ph / 0.5) * Math.PI) : 0;
          const tgt = tpt(L, 0.7, 0.18 + k * 0.6);
          let ang = Math.atan2(tgt.y - cb.y, tgt.x - cb.x);
          if (ph > 0.55) ang += Math.sin(((ph - 0.55) / 0.45) * Math.PI * 2) * 0.05;
          hCue(g, L, cb, ang, 0); hball(g, cb.x, cb.y, 6.5, '#f4f1e8');
          if (ph < 0.55) finger(g, tgt.x, tgt.y, true);
          else { const w = L.wheel, q = Math.sin(((ph - 0.55) / 0.45) * Math.PI * 2) * 0.3 + 0.5; finger(g, L.port ? w.x + w.w * q : w.x + w.w / 2, L.port ? w.y + w.h / 2 : w.y + w.h * q, true); }
        } else if (i === 1) {    // 2. 옆에 세운 큐 막대를 당겼다 놓으면 친다
          const ph = (t % 3) / 3, pull = ph < 0.6 ? ph / 0.6 : 0, shot = ph >= 0.62;
          hScreen(g, L, null); hBar(g, L, pull, true);
          rack(g, L, 0.72);
          const c0 = tpt(L, 0.28, 0.5), apex = tpt(L, 0.72, 0.5), ang = Math.atan2(apex.y - c0.y, apex.x - c0.x);
          const go = shot ? Math.min(1, (ph - 0.62) / 0.2) : 0;
          const cb = { x: c0.x + (apex.x - c0.x - Math.cos(ang) * 12) * go, y: c0.y + (apex.y - c0.y - Math.sin(ang) * 12) * go };
          if (!shot) hCue(g, L, c0, ang, pull * 26);
          hball(g, cb.x, cb.y, 6.5, '#f4f1e8');
          const b = L.bar;
          if (ph < 0.6) finger(g, L.port ? b.x + b.w - 10 - (b.w - 24) * pull : b.x + b.w / 2, L.port ? b.y + b.h / 2 : b.y + 10 + (b.h - 24) * pull, true);
          else if (ph < 0.75) finger(g, L.port ? b.x + 14 : b.x + b.w / 2 + 16, L.port ? b.y - 14 : b.y + b.h - 10, false);
        } else {                 // 3. 내 공을 다 넣고 8번
          const ph = (t % 3) / 3;
          hScreen(g, L, null); hBar(g, L, 0, false);
          const p8 = tpt(L, 0.6, 0.6), pk = tpt(L, 1, 1);
          const k = Math.min(1, ph / 0.45), x8 = p8.x + (pk.x - p8.x) * k, y8 = p8.y + (pk.y - p8.y) * k;
          hball(g, x8, y8, 7, '#16151a');
          if (k < 1) { g.fillStyle = '#fff'; g.font = '900 8px Arial'; g.textAlign = 'center'; g.fillText('8', x8, y8 + 3); }
          const cb = tpt(L, 0.35, 0.4); hball(g, cb.x, cb.y, 6.5, '#f4f1e8');
          const st = tpt(L, 0.45, 0.8); hball(g, st.x, st.y, 6.5, '#1446a8', true);
          if (ph > 0.5) { const c = tpt(L, 0.5, 0.5); g.fillStyle = '#f2c75a'; g.strokeStyle = '#0b2a18'; g.lineWidth = 5; g.font = "400 38px 'Ttl', Arial"; g.textAlign = 'center'; g.strokeText('WIN', c.x, c.y + 12); g.fillText('WIN', c.x, c.y + 12); }
        }
      } catch (e) {}
    });
  }
  function openHow(after) {
    show('how', true);
    $('howOk').onclick = () => { AU.play('click'); show('how', false); S.how = 2; save(); if (after) after(); };
  }

  // ── 단추
  $('startBtn').onclick = () => { AU.unlock(); AU.play('click'); if ((S.how || 0) < 2) openHow(openMap); else openMap(); };
  $('lessonBtn').onclick = () => { AU.unlock(); AU.play('click'); if ((S.how || 0) < 2) openHow(startLesson); else startLesson(); };
  $('vsBtn').onclick = () => { AU.unlock(); AU.play('click'); if ((S.how || 0) < 2) openHow(startVs); else startVs(); };
  $('mapHome').onclick = () => { AU.play('click'); toTitle(); };
  $('howBtn').onclick = () => { AU.play('click'); openHow(); };
  const togs = () => { $('bgmBtn').classList.toggle('off', !AU.bgm); $('sndBtn').classList.toggle('off', !AU.snd); };
  $('bgmBtn').onclick = () => { AU.unlock(); AU.setBgm(!AU.bgm); togs(); };
  $('sndBtn').onclick = () => { AU.unlock(); AU.setSnd(!AU.snd); AU.play('click'); togs(); };
  togs();
  addEventListener('pointerdown', () => AU.unlock(), { once: true });

  // ── 시작
  RD.init(cv);
  RD.setMode('title');
  layout();
  requestAnimationFrame(loop);

  // 시험 손잡이
  window.__T = { G, S, OPP, aiTurn, beginTurn, startMatch, startVs, startLesson, openEnd, openMap, toTitle, shoot, fire, frameEnd, layout,
    step: (n) => { for (let i = 0; i < n; i++) tick(lt + 16.7); } };
})();
