/* 코인빨래방 — 방치형. 세탁기는 알아서 돌고 동전이 쌓인다. 탭해서 수금·수리·청소·쫓기, 설비를 사서 자동화하고, 빚 3,000 을 갚으면 2호점. 떠나 있던 동안의 수입은 돌아올 때 받는다. */
(function () {
  'use strict';
  const W = 640, H = 360;
  const $ = id => document.getElementById(id);
  const canvas = $('c'), ctx = canvas.getContext('2d'); canvas.width = W * 2; canvas.height = H * 2; ctx.scale(2, 2); ctx.imageSmoothingEnabled = false;
  const EN = (() => { try { return new URLSearchParams(location.search).get('lang') === 'en'; } catch (_) { return false; } })();
  if (EN) { document.documentElement.lang = 'en'; document.title = 'Coin Laundry 24 — Oreum Games'; document.querySelectorAll('[data-en]').forEach(e => { e.innerHTML = e.getAttribute('data-en'); }); }
  const T = (ko, en) => EN ? en : ko;
  const isTouch = ('ontouchstart' in window) && matchMedia('(pointer: coarse)').matches;
  if (isTouch) document.body.classList.add('touch');
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ── 그림 ──
  const CUST_ALL = ['cust1', 'cust2', 'cust3', 'cust4', 'cust5', 'cust6', 'cust7', 'cust8'];
  const NAMES = ['washer', 'exch', 'table', 'basket', 'bench', 'vending', 'plant', 'pile', 'folded', 'coin', 'coinbag', 'toolbox', 'wall', 'owner', 'drunk', 'drunkz', 'kicker', 'thief', 'blanket', 'sleeper', 'cctv', 'neon', 'folder', 'puddle', 'clerk_face'].concat(CUST_ALL);
  const IMG = {}; let loaded = 0;
  const IMGV = '?v=2';   // 그림을 고치면 이 번호를 올린다 (브라우저가 옛 그림을 물고 있다)
  NAMES.forEach(n => { const im = new Image(); im.onload = () => { im.ok = true; loaded++; }; im.onerror = () => { loaded++; }; im.src = 'img/' + n + '.png' + IMGV; IMG[n] = im; });
  const ok = n => IMG[n] && IMG[n].ok;
  const ANIMS = ['idle', 'walk', 'fix', 'fold', 'sleep'], FRAMES = {}, FPS = 6;
  const PEOPLE = ['owner', 'drunk', 'kicker', 'thief', 'blanket'].concat(CUST_ALL);
  PEOPLE.forEach(n => { FRAMES[n] = {}; ANIMS.forEach(a => {
    const list = []; FRAMES[n][a] = list;
    const probe = k => { const im = new Image(); im.onload = () => { im.ok = true; list.push(im); if (k < 30) probe(k + 1); }; im.onerror = () => { }; im.src = 'img/' + n + '/' + a + '_' + String(k).padStart(2, '0') + '.png' + IMGV; };
    probe(1);
  }); });
  function frameOf(name, anim, clock) {
    const F = FRAMES[name]; if (!F) return null;
    const list = F[anim] && F[anim].length ? F[anim] : F.idle;
    if (!list || !list.length) return null;
    return list[Math.floor(clock * FPS) % list.length];
  }

  // ── 가게 안 자리 ──
  const WASH_Y = 134;
  const FLOOR = { x1: 22, y1: WASH_Y + 6, x2: 618, y2: 348 };
  const EXCH = { x: 46, y: 236 }, VEND = { x: 540, y: 240 };
  const TABLE = { x: 330, y: 300, w: 150 }, BENCH = { x: 128, y: 306, w: 112 }, BENCH2 = { x: 500, y: 306, w: 112 };
  const TABLES = [{ x: 172, y: 262 }, { x: 488, y: 262 }];   // 접는 탁자를 더 놓는 자리 (벽 선반 대신, 사장님 2026-09-10)
  const DOOR = { x: 640, y: 288 }, LANE = 205, TOP = TABLE.y - 40;
  let NW = 3, SEATS = [92, 128, 164];
  // 세탁기 줄을 좁히고 왼쪽으로 당겨, 오른쪽 벽 앞을 자판기·화분 자리로 비운다 (사장님 2026-09-11)
  const WX = i => 296 + (i - (NW - 1) / 2) * (NW <= 6 ? 80 : 64);
  function layout() { NW = 3 + S.up.wash; SEATS = [92, 128, 164]; if (S.up.bench) SEATS = SEATS.concat([464, 500, 536]); }

  // ── 저장 ──
  const REG_NAMES = { cust1: ['지수', 'Jisu'], cust2: ['순자', 'Sunja'], cust3: ['민준', 'Minjun'], cust4: ['서연', 'Seoyeon'], cust5: ['하늘', 'Haneul'], cust6: ['도윤', 'Doyun'], cust7: ['은지', 'Eunji'], cust8: ['태호', 'Taeho'], blanket: ['미영', 'Miyoung'], clerk: ['준호', 'Junho'] };
  const DEBT0 = 3000;
  function fresh() { return { day: 1, clock: 18.0, money: 0, debt: DEBT0, up: { wash: 0, motor: 0, soap: 0, box: 0, tough: 0, cart: 0, tools: 0, mop: 0, shoes: 0, vend: 0, bench: 0, rack: 0, cctv: 0, neon: 0, plant: 0, fold: 0, alarm: 0, branch: 0 }, reg: {}, rep: 3, ended: false, earned: 0, served: 0, weather: 'clear', rate: 0, t: 0 }; }
  let S = fresh();
  function load() { try { const s = JSON.parse(localStorage.getItem('coinwash.save') || 'null'); if (s && s.up) { S = Object.assign(fresh(), s); S.up = Object.assign(fresh().up, s.up); return true; } } catch (_) { } return false; }
  function save() { S.t = Date.now(); try { localStorage.setItem('coinwash.save', JSON.stringify(S)); } catch (_) { } }
  const regOf = k => S.reg[k] || (S.reg[k] = { p: 0, n: 0, gift: 0 });
  const heartsOf = k => Math.min(5, Math.floor(regOf(k).p / 3));

  // ── 상점 ──
  const SHOP = [
    { id: 'wash', ic: '🫧', img: 'washer', ko: '세탁기 +1', en: 'Washer +1', price: [300, 450, 650, 900, 1300] },
    { id: 'motor', ic: '⚡', ko: '고속 모터', en: 'Fast motor', price: [250, 500, 900] },
    { id: 'soap', ic: '🧴', ko: '고급 세제', en: 'Premium soap', price: [400, 800] },
    { id: 'box', ic: '🪙', ko: '큰 동전통', en: 'Big coin box', price: [250, 500] },
    { id: 'tough', ic: '🔧', ko: '튼튼한 세탁기', en: 'Sturdy washers', price: [350, 700] },
    { id: 'cart', ic: '🛒', img: 'coinbag', ko: '동전 카트', en: 'Coin cart', price: [350] },
    { id: 'tools', ic: '🧰', img: 'toolbox', ko: '공구함', en: 'Toolbox', price: [600] },
    { id: 'mop', ic: '🧹', ko: '대걸레', en: 'Mop', price: [300] },
    { id: 'shoes', ic: '👟', ko: '운동화', en: 'Sneakers', price: [200, 400] },
    { id: 'vend', ic: '🥤', img: 'vending', ko: '자판기', en: 'Vending machine', price: [400] },
    { id: 'bench', ic: '🪑', img: 'bench', ko: '벤치 +1', en: 'Bench +1', price: [200] },
    { id: 'rack', ic: '🧺', img: 'table', ko: '빨래 탁자 +1', en: 'Laundry table +1', price: [350, 700] },   // 벤치(앉는 자리)와 헷갈리지 않게 이름·아이콘을 빨래 쪽으로
    { id: 'cctv', ic: '📷', img: 'cctv', ko: 'CCTV', en: 'CCTV', price: [500] },
    { id: 'neon', ic: '💡', img: 'neon', ko: '네온 간판', en: 'Neon sign', price: [450, 900] },
    { id: 'plant', ic: '🪴', img: 'plant', ko: '화분', en: 'Plant', price: [120, 180, 240] },
    { id: 'fold', ic: '🤖', img: 'folder', ko: '빨래 개는 기계', en: 'Folding machine', price: [1200] },
    { id: 'alarm', ic: '🗞️', ko: '야간 전단지', en: 'Night flyers', price: [800, 2000] },   // 새벽 손님이 더 온다
    { id: 'branch', ic: '🏪', ko: '', en: '', price: [6000, 15000, 40000] },
  ];
  const PILE_CAP = () => 3 + 3 * S.up.rack,   // 개어 놓을 자리: 접는 탁자 3 + 진열대 한 칸마다 3 (사장님 2026-09-10 "옷을 놓을 데가 없어")
    CAP = () => 12 + 12 * S.up.box, PAY = () => 4 + S.up.soap, DRINK = 2,   /* 자판기 음료 한 잔 */ WASH_T = () => 16 * [1, .8, .65, .55][S.up.motor], FIX_N = 3, MOP_N = 2;
  // 없는 동안 — 밤 손님이 드문드문 와서 스스로 돌리고 간다. 동전통·금고가 차면 거기서 멈춘다(초당 수입과 무관)
  // 없는 동안 — 빨래를 넣어 놓고 간 손님이 있어서 세탁기마다 딱 한 판씩 돌아간다.
  // 시간은 보지 않는다. 세탁기를 많이 살수록만 늘어난다 (사장님 2026-09-10)
  const NIGHT_ONE = () => NW * PAY(), AWAY_MIN = 20 * 60;
  const SPEED = () => 70 + 35 * S.up.shoes;

  // ── 시간 ──
  const G = { place: 'title', mode: 'shop', today: 0, servedN: 0, angryN: 0, rep0: 3, spawnT: 3, jerkT: 12, anim: 0, shown: 0, secT: 0, secEarn: 0, branchT: 10, saveT: 0, back: null };
  const isDawn = () => S.clock >= 2 && S.clock < 5;
  const season = () => Math.floor((S.day - 1) / 7) % 4;
  const SEASON_IC = ['🌸', '☀️', '🍂', '❄️'];
  const dayIn = () => (S.day - 1) % 7 + 1;
  function advance(dt) {   // 한 시간 = 15초, 하루 = 6분
    const before = S.clock; S.clock += dt / 15;
    if (S.clock >= 24) S.clock -= 24;
    if ((before < 6 && S.clock >= 6) || (before > S.clock && S.clock >= 6)) dayEnd();
  }
  function hourMul() { const h = S.clock, night = 1 + .3 * S.up.alarm;   // 야간 전단지 — 늦은 밤·새벽에 손님이 더 온다
    return h < 2 ? .9 / night : h < 5 ? 1.5 / night : h < 6 ? 1.2 / night : h < 10 ? 2.4 : h < 17 ? 1.8 : h < 22 ? 1.1 : .9 / night; }

  // ── 가게 상태 ──
  const P = { x: 320, y: 236, face: 1, path: [], bob: 0, clock: 0, moving: false, task: null, hold: 0, idleT: 3, user: false, pat: 0, wipe: 0 };
  let washers = [], custs = [], piles = [], floats = [], smoke = [], drops = [], puddles = [], fcoins = [], flys = [], cash = [];
  const mkWasher = i => ({ i, x: WX(i), state: 'idle', t: 0, total: 1, coins: 0, owner: null, cloth: null, blink: rnd(0, 6), rot: 0, hits: 0, doneT: 0 });
  function resetShop() {
    layout();
    washers = []; for (let i = 0; i < NW; i++) washers.push(mkWasher(i));
    custs = []; piles = []; floats = []; smoke = []; drops = []; puddles = []; fcoins = []; flys = []; cash = []; G.spawnT = 2.5; G.jerkT = 12;
    P.x = 320; P.y = 236; P.path = []; P.task = null; P.user = false; P.pat = 0; P.wipe = 0; P.idleT = 1.5;
  }
  function rollWeather() { S.weather = season() === 3 ? (Math.random() < .35 ? 'snow' : 'clear') : (Math.random() < .3 ? 'rain' : 'clear'); }

  // ── HUD ──
  const toastEl = $('toast'); let toastT = null;
  function toast(s, red, ms) { toastEl.textContent = s; toastEl.classList.toggle('red', !!red); toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms || 1100); }
  function hud() {
    $('dayN').textContent = SEASON_IC[season()] + ' ' + dayIn() + (S.weather === 'rain' ? ' 🌧' : S.weather === 'snow' ? ' ☃' : '');
    const d = S.money - G.shown; G.shown = Math.abs(d) < 1 ? S.money : G.shown + d * .18;
    $('coinN').textContent = Math.round(G.shown); $('debtN').textContent = S.debt; $('debt').classList.toggle('free', S.debt <= 0);
    const h = Math.floor(S.clock), m = Math.floor((S.clock % 1) * 60); $('clockN').textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); $('clock').classList.toggle('dawn', isDawn());
  }
  function float(x, y, s, col) { floats.push({ x, y, s, col: col || '#ffd24a', t: 1.2 }); }
  function sparkleAt(x, y) { smoke.push({ x, y, r: rnd(1, 2.4), t: rnd(.3, .6), vy: rnd(-24, -8), col: '255,255,255' }); }
  function earn(n, x, y, pre) { S.money += n; S.earned += n; G.today += n; G.secEarn += n; if (x !== undefined) float(x, y, (pre || '+') + n); }
  function repAdd(d) { S.rep = clamp(S.rep + d * (d > 0 ? 1 + .15 * S.up.plant : 1), 1, 5); }
  function coinTarget() {
    try { const r = $('coinN').getBoundingClientRect(), c = canvas.getBoundingClientRect(); return { x: (r.left + r.width / 2 - c.left) / c.width * W, y: (r.top + r.height / 2 - c.top) / c.height * H }; } catch (_) { return { x: 320, y: 10 }; }
  }
  function flyCoins(x, y, n) {   // 동전이 튀어 올라 상단바 지갑으로 날아간다
    const tg = coinTarget(), k = Math.min(n, 12);
    for (let i = 0; i < k; i++) flys.push({ x, y, vx: rnd(-90, 90), vy: rnd(-170, -70), t: -i * .03, tx: tg.x, ty: tg.y });
  }

  // ── 손님 ──
  const custImgs = () => CUST_ALL.filter(ok);
  function spawnCust() {
    const used = custs.filter(c => !c.gone).map(c => c.img);
    const free = custImgs().filter(i => !used.includes(i));
    const heavy = (season() === 3 ? Math.random() < .3 : S.day >= 3 && Math.random() < .12) && !used.includes('blanket') && ok('blanket');
    if (!heavy && !free.length) return;
    const img = heavy ? 'blanket' : pick(free); const r = regOf(img); r.n++;
    const c = { kind: 'cust', img, x: DOOR.x + 30, y: DOOR.y, tx: 0, ty: 0, path: [], state: 'findW', patience: 1, drain: 0, timer: 0, washer: null, seat: -1, face: -1, bob: 0, gone: false, heavy, mode: pick(['sit', 'sit', 'sit', 'out', 'out', 'sleep']), cloth: pick(['#e0607a', '#4a8ee0', '#6ac26a', '#f0b040', '#b070d0']), zzz: 0, vendT: rnd(5, 10), h: heartsOf(img) };
    if (c.h >= 3 && c.mode === 'sleep') c.mode = 'sit';
    custs.push(c); SND.play('door');
    if (c.h >= 5 && !r.gift) { r.gift = 1; earn(40, c.x - 40, c.y - 70); toast('💝', false, 1200); SND.play('nice'); }
  }
  function spawnJerk() {
    let w = S.day < 3 ? ['drunk'] : S.day < 5 ? ['drunk', 'drunk', 'kicker'] : ['drunk', 'kicker', 'kicker', 'thief', 'thief'];
    if (S.up.cctv) w = w.filter(k => k !== 'thief');
    const usedJ = custs.filter(c => !c.gone).map(c => c.kind);
    const wf = w.filter(k => !usedJ.includes(k)); if (!wf.length) return;
    const kind = pick(wf);
    const c = { kind, img: kind, x: DOOR.x + 30, y: DOOR.y, tx: 0, ty: 0, path: [], state: 'enter', timer: 0, hits: 0, face: -1, bob: 0, gone: false, target: null, seat: -1, loot: null, life: 75, speed: kind === 'thief' ? 105 : kind === 'kicker' ? 80 : 40 };
    custs.push(c); SND.play('door');
    if (kind === 'drunk') { goTo(c, rnd(200, 500), rnd(180, 250)); c.state = 'wander'; }
    else if (kind === 'kicker') { c.state = 'pickW'; }
    else { c.state = 'pickLoot'; }
  }
  function goTo(c, tx, ty) {
    c.tx = tx; c.ty = ty; const p = [];
    const midBand = y => y > 150 && y < 250;
    if (!(midBand(c.y) && midBand(ty))) { if (Math.abs(c.y - LANE) > 4) p.push([c.x, LANE]); if (Math.abs(tx - c.x) > 4) p.push([tx, LANE]); }
    p.push([tx, ty]); c.path = p;
  }
  // 가구 발자리 — 사람이 뚫고 지나가지 못한다 (앉을 벤치·물건 놓을 탁자는 목적지일 때만 들어간다)
  function furn() {
    const a = [{ x: BENCH.x, y: BENCH.y - 2, w: 104, h: 22 }, { x: TABLE.x, y: TABLE.y - 4, w: 140, h: 30 }];
    if (S.up.bench) a.push({ x: BENCH2.x, y: BENCH2.y - 2, w: 104, h: 22 });
    for (const t of TABLES.slice(0, S.up.rack)) a.push({ x: t.x, y: t.y - 4, w: 112, h: 28 });
    if (S.up.vend) a.push({ x: VEND.x, y: VEND.y + 6, w: 46, h: 20 });
    a.push({ x: EXCH.x, y: EXCH.y + 8, w: 54, h: 22 });
    return a;
  }
  const inRect = (x, y, r) => Math.abs(x - r.x) < r.w / 2 && Math.abs(y - r.y) < r.h / 2;
  function blockedAt(x, y, goal) {
    for (const r of furn()) { if (goal && inRect(goal[0], goal[1], r)) continue; if (inRect(x, y, r)) return true; }
    return false;
  }
  function walk(c, dt, speed) {
    if (!c.path.length) return true;
    const [tx, ty] = c.path[0]; const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy), s = (speed || 70) * dt;
    if (d <= s) { c.x = tx; c.y = ty; c.path.shift(); c.stuck = 0; return !c.path.length; }
    const goal = c.path[c.path.length - 1];
    let nx = c.x + dx / d * s, ny = c.y + dy / d * s;
    if (blockedAt(nx, ny, goal) && !blockedAt(c.x, c.y, goal)) {   // 가구를 만나면 모서리를 따라 돈다
      const mx = Math.abs(nx - c.x) > .01 && !blockedAt(nx, c.y, goal), my = Math.abs(ny - c.y) > .01 && !blockedAt(c.x, ny, goal);
      if (mx) ny = c.y;
      else if (my) nx = c.x;
      else {   // 정면으로 막혔다 — 가까운 모서리 쪽으로 비켜 돈다
        const r = furn().find(q => !(goal && inRect(goal[0], goal[1], q)) && inRect(nx, ny, q));
        let side = -1;
        if (r) { const L = c.x - (r.x - r.w / 2 - 12), R = (r.x + r.w / 2 + 12) - c.x; side = L < R ? -1 : 1; }
        let ax = c.x + side * s;
        if (blockedAt(ax, c.y, goal) || ax < FLOOR.x1 + 8 || ax > FLOOR.x2 - 8) ax = c.x - side * s;
        if (blockedAt(ax, c.y, goal) || ax < FLOOR.x1 + 8 || ax > FLOOR.x2 - 8) ax = c.x;
        nx = ax; ny = c.y;
      }
      c.stuck = (c.stuck || 0) + dt;
      if (c.stuck > 1.1) { c.stuck = 0; if (c.path.length > 1) c.path.shift(); else { c.x = tx; c.y = ty; c.path.shift(); return true; } }   // 오래 막히면 다음 지점으로
    } else c.stuck = 0;
    c.x = nx; c.y = ny; if (Math.abs(dx) > 1) c.face = dx < 0 ? -1 : 1; c.bob += dt * 12; return false;
  }
  const seatY = i => (i < 3 ? BENCH.y : BENCH2.y) - 6;
  const freeSeat = () => SEATS.findIndex((_, i) => !custs.some(c => c.seat === i));
  const dirty = w => puddles.some(p => p.w === w);
  const freeWasher = () => washers.find(w => w.state === 'idle' && w.coins < CAP() && !w.owner && !dirty(w));
  const tableSpot = () => TABLE.x + rnd(-50, 50);
  function angryLeave(c) {
    c.state = 'leave'; c.angry = true; c.seat = -1; goTo(c, DOOR.x + 30, DOOR.y); G.angryN++; repAdd(-.15); regOf(c.img).p = Math.max(0, regOf(c.img).p - 2);
    SND.play('angry'); toast('😡', true, 900); float(c.x, c.y - 70, '💔', '#ff6a7a');
  }
  function quietLeave(c) { c.state = 'leave'; c.seat = -1; goTo(c, DOOR.x + 30, DOOR.y); float(c.x, c.y - 70, '💨', '#fff'); }
  function happyLeave(c, tip, good) {
    c.state = 'leave'; goTo(c, DOOR.x + 30, DOOR.y); if (c.seat >= 0) c.seat = -1;
    const before = heartsOf(c.img); regOf(c.img).p += good; S.served++; G.servedN++; repAdd(good >= 2 ? .06 : .02);
    if (tip) { earn(tip, c.x, c.y - 70); flyCoins(c.x, c.y - 40, tip); SND.play('coin'); }
    if (heartsOf(c.img) > before) { float(c.x, c.y - 84, '♥', '#ff6a7a'); SND.play('nice'); }
  }
  function pileOf(c) { return piles.find(p => p.owner === c); }
  const busyOwn = c => c.washer && c.washer.owner === c && (c.washer.state === 'done' || c.washer.state === 'fold');
  const orphan = w => !w.owner || w.owner.gone;

  function updCust(c, dt) {
    const drainMul = custs.some(o => o.kind === 'drunk' && !o.gone) ? 1.6 : 1;
    c.drain = 0;
    switch (c.state) {
      case 'findW': {
        const w = freeWasher();
        if (w) { c.washer = w; w.owner = c; c.state = 'toW'; goTo(c, w.x, WASH_Y + 12); }
        else { c.drain = .04; c.state = 'waitW'; goTo(c, 210 + (custs.indexOf(c) % 4) * 22, 232); }
        break; }
      case 'waitW': walk(c, dt); { const w = freeWasher(); if (w) { c.washer = w; w.owner = c; c.state = 'toW'; goTo(c, w.x, WASH_Y + 12); } else c.drain = .03; } break;
      case 'toW': if (walk(c, dt)) { c.state = 'load'; c.timer = .9; } break;
      case 'load':
        c.timer -= dt;
        if (c.timer <= 0) {
          const w = c.washer; w.state = 'wash'; w.total = WASH_T() * (c.heavy ? 1.7 : 1); w.t = w.total; w.coins += PAY(); w.cloth = c.cloth; w.hits = 0;
          const pb = (c.heavy ? .6 : Math.min(.3, .06 + .01 * S.day)) * (1 - .35 * S.up.tough); w.breakAt = Math.random() < pb ? rnd(.25, .8) : -1;
          SND.play('coins'); float(w.x, WASH_Y - 80, '+' + PAY()); c.patience = 1;
          if (S.up.vend && Math.random() < .8) { c.state = 'toVend'; goTo(c, VEND.x - 30, VEND.y + 8); }
          else afterLoad(c);
        }
        break;
      case 'toVend': if (walk(c, dt)) { earn(DRINK, c.x, c.y - 70); SND.play('coin'); afterLoad(c); } break;
      // 기다리다가 한 잔 더 뽑고 자리로 돌아온다
      case 'toVendSit': if (walk(c, dt)) { earn(DRINK, c.x, c.y - 70); SND.play('coin'); c.vendT = rnd(14, 24); c.state = 'toSeat'; goTo(c, SEATS[c.seat], seatY(c.seat)); } break;
      case 'goOut': if (walk(c, dt)) { c.state = 'away'; c.timer = rnd(12, 30); c.x = DOOR.x + 40; } break;
      case 'away':
        if (c.washer.state !== 'wash' && c.washer.state !== 'broken') { c.timer -= dt; if (c.timer <= 0) { c.state = 'return'; SND.play('door'); returnFor(c); } }
        break;
      case 'toSeat': if (walk(c, dt)) { c.state = c.mode === 'sleep' ? 'sleep' : 'sit'; c.timer = 0; } /* falls through */
      case 'sit': case 'sleep':
        if (c.washer.state === 'broken') c.drain = .03;
        if (c.state === 'sit') {
          if (S.up.vend && c.seat >= 0 && c.washer.state === 'wash') { c.vendT -= dt; if (c.vendT <= 0) { c.state = 'toVendSit'; goTo(c, VEND.x - 30, VEND.y + 8); break; } }
          if (c.washer.state === 'done' && c.washer.owner === c) { c.timer = (c.timer || rnd(3, 7)); c.timer -= dt; if (c.timer <= 0) { c.state = 'toUnload'; goTo(c, c.washer.x, WASH_Y + 12); } }
          else if (c.washer.owner !== c) { const p = pileOf(c); if (p) { c.state = 'toTable'; c.seat = -1; goTo(c, tableSpot(), TABLE.y + 16); } }
        } else {
          c.zzz += dt; const p = pileOf(c); if (p && p.folded) { c.state = 'toTable'; c.seat = -1; goTo(c, tableSpot(), TABLE.y + 16); }
          else if (c.zzz > 40 && c.washer.state === 'done' && c.washer.owner === c) { c.state = 'toUnload'; c.seat = -1; goTo(c, c.washer.x, WASH_Y + 12); }
        }
        break;
      case 'toUnload': if (walk(c, dt)) { if (c.washer.owner === c && c.washer.state === 'done') { c.state = 'unload'; c.timer = .7; } else { c.state = 'toTable'; goTo(c, tableSpot(), TABLE.y + 16); } } break;
      case 'unload': c.timer -= dt; if (c.timer <= 0) { const w = c.washer; w.state = 'idle'; w.owner = null; w.cloth = null; SND.play('grab'); happyLeave(c, 0, 1); float(c.x, c.y - 70, '👍', '#fff'); } break;
      case 'return': if (walk(c, dt)) { const w = c.washer; if (w.owner === c && w.state === 'done') { c.state = 'unload'; c.timer = .7; } else if (w.owner === c) { c.state = 'waitOwn'; } else { c.state = 'toTable'; goTo(c, tableSpot(), TABLE.y + 16); } } break;
      case 'waitOwn': c.drain = .03; if (c.washer.state === 'done' && c.washer.owner === c) { c.state = 'unload'; c.timer = .7; } else if (c.washer.owner !== c) { c.state = 'toTable'; goTo(c, tableSpot(), TABLE.y + 16); } break;
      case 'toTable': if (walk(c, dt)) c.state = 'atTable'; break;
      case 'atTable': {
        const p = pileOf(c);
        if (p && p.folded) { piles.splice(piles.indexOf(p), 1); SND.play('grab'); happyLeave(c, 2 + c.h, 2); float(c.x, c.y - 90, 'NICE', '#ffd24a'); }
        else if (!p && !busyOwn(c)) c.drain = .08;
        else c.drain = .05;
        break; }
      case 'leave': if (walk(c, dt, c.angry ? 95 : 70)) { c.gone = true; if (c.washer && c.washer.owner === c && c.washer.state === 'idle') c.washer.owner = null; piles = piles.filter(p => p.owner !== c); } break;
    }
    if (c.drain) { c.patience -= c.drain * drainMul * (c.h >= 3 ? .7 : 1) * dt; if (c.patience <= 0) { c.patience = 0; if (c.washer && c.washer.owner === c && c.washer.state === 'idle') c.washer.owner = null; if (c.state === 'waitW' && washers.every(w => w.coins >= CAP() || w.state === 'broken' || dirty(w))) quietLeave(c); else angryLeave(c); } }
  }
  function afterLoad(c) {
    if (c.mode === 'out') { c.state = 'goOut'; goTo(c, DOOR.x + 30, DOOR.y); }
    else { const s = freeSeat(); if (s >= 0) { c.seat = s; goTo(c, SEATS[s], seatY(s)); } else goTo(c, rnd(230, 300), rnd(220, 245)); c.state = 'toSeat'; }
  }
  function returnFor(c) { c.x = DOOR.x + 30; c.y = DOOR.y; const w = c.washer; if (w.owner === c) goTo(c, w.x, WASH_Y + 12); else goTo(c, tableSpot(), TABLE.y + 16); }

  function spill(x, y, n) {
    const k = Math.min(n, 14); for (let i = 0; i < k; i++) { const v = Math.floor(n / k) + (i < n % k ? 1 : 0); fcoins.push({ x, y, vx: rnd(-90, 90), vy: rnd(-40, 60), t: 0, val: v }); }
    SND.play('coins');
  }
  function shoo(c) {
    c.hits = (c.hits || 0) + 1; SND.play('shoo'); c.x += (c.face || 1) * -4;
    const need = c.kind === 'drunk' ? 3 : 1;
    if (c.hits >= need) {
      if (c.kind === 'thief' && c.loot) { if (c.loot.coins) spill(c.x, c.y, c.loot.coins); else if (piles.length < PILE_CAP()) piles.push(Object.assign({ owner: c.loot.owner, cloth: c.loot.cloth, folded: true }, freeSlot())); c.loot = null; }
      c.state = 'leave'; c.seat = -1; c.img = c.kind; goTo(c, DOOR.x + 30, DOOR.y); float(c.x, c.y - 70, '💨', '#fff'); SND.play('nice'); repAdd(.03);
    } else float(c.x, c.y - 70, '💢', '#ff8a6a');
  }
  function updJerk(c, dt) {
    c.life -= dt;
    if (c.life <= 0 && c.state !== 'leave' && c.state !== 'run') { c.state = 'leave'; c.seat = -1; c.img = c.kind; goTo(c, DOOR.x + 30, DOOR.y); }
    switch (c.kind) {
      case 'drunk':
        c.timer -= dt;
        if (c.timer <= 0) { c.timer = rnd(3, 5); SND.play('hic'); float(c.x, c.y - 70, '🍶', '#fff'); }
        if (c.state === 'wander') { if (walk(c, dt, c.speed)) { const s = freeSeat(); if (s >= 0) { c.seat = s; goTo(c, SEATS[s], seatY(s)); c.state = 'toSeat'; } else { goTo(c, rnd(220, 420), rnd(190, 250)); c.state = 'toFloor'; } } }
        else if (c.state === 'toSeat' || c.state === 'toFloor') { if (walk(c, dt, c.speed)) { c.state = 'sleep'; c.vomT = 14; c.img = c.seat < 0 ? 'sleeper' : (ok('drunkz') ? 'drunkz' : 'drunk'); } }
        else if (c.state === 'sleep') { c.vomT -= dt; if (c.vomT <= 0) { const ws = washers.filter(w => !dirty(w)); if (ws.length) { c.vomTarget = pick(ws); c.state = 'toVom'; c.img = 'drunk'; c.seatKeep = c.seat; goTo(c, c.vomTarget.x, WASH_Y + 14); } else c.vomT = 20; } }
        else if (c.state === 'toVom') { if (walk(c, dt, c.speed)) { puddles.push({ w: c.vomTarget, x: c.vomTarget.x, y: WASH_Y + 16, hits: 0 }); float(c.x, c.y - 70, '🤢', '#9fe07a'); SND.play('angry'); c.state = 'back'; goTo(c, c.seatKeep >= 0 ? SEATS[c.seatKeep] : rnd(220, 420), c.seatKeep >= 0 ? seatY(c.seatKeep) : rnd(190, 250)); } }
        else if (c.state === 'back') { if (walk(c, dt, c.speed)) { c.state = 'sleep'; c.vomT = 30; c.img = c.seat < 0 ? 'sleeper' : (ok('drunkz') ? 'drunkz' : 'drunk'); } }
        else if (c.state === 'leave') { if (walk(c, dt, 90)) c.gone = true; }
        break;
      case 'kicker':
        if (c.state === 'pickW') { const ws = washers.filter(w => w.state !== 'broken'); if (ws.length <= 1) { c.state = 'leave'; goTo(c, DOOR.x + 30, DOOR.y); break; } c.target = pick(ws); goTo(c, c.target.x, WASH_Y + 12); c.state = 'toW'; }
        else if (c.state === 'toW') { if (walk(c, dt, c.speed)) { c.state = 'kick'; c.timer = .6; } }
        else if (c.state === 'kick') { c.timer -= dt; if (c.timer <= 0) { breakW(c.target); SND.play('kick'); SND.play('laugh'); float(c.x, c.y - 70, '😈', '#fff'); c.kicks = (c.kicks || 0) + 1; c.state = 'gloat'; c.timer = 4; } }
        else if (c.state === 'gloat') { c.timer -= dt; if (c.timer <= 0) { if (c.kicks >= 3) { c.state = 'leave'; goTo(c, DOOR.x + 30, DOOR.y); } else c.state = 'pickW'; } }
        else if (c.state === 'leave') { if (walk(c, dt, 110)) c.gone = true; }
        break;
      case 'thief':
        if (c.state === 'pickLoot') {
          const fp = piles.slice(); const dw = washers.filter(w => w.state === 'done'); const cw = washers.filter(w => w.coins >= 8 && w.state !== 'broken');
          if (fp.length) { c.target = { pile: pick(fp) }; goTo(c, c.target.pile.x, TABLE.y + 16); c.state = 'toLoot'; }
          else if (dw.length) { c.target = { washer: pick(dw) }; goTo(c, c.target.washer.x, WASH_Y + 12); c.state = 'toLoot'; }
          else if (cw.length) { c.target = { box: pick(cw) }; goTo(c, c.target.box.x, WASH_Y + 12); c.state = 'toLoot'; }
          else { c.state = 'lurk'; c.timer = 5; goTo(c, rnd(380, 520), rnd(200, 250)); }
        }
        else if (c.state === 'lurk') { walk(c, dt, c.speed); c.timer -= dt; if (c.timer <= 0) { if (piles.length || washers.some(w => w.state === 'done' || w.coins >= 8)) c.state = 'pickLoot'; else { c.state = 'leave'; goTo(c, DOOR.x + 30, DOOR.y); } } }
        else if (c.state === 'toLoot') {
          if (walk(c, dt, c.speed)) {
            const tg = c.target; let okk = false;
            if (tg.pile && piles.includes(tg.pile)) { piles.splice(piles.indexOf(tg.pile), 1); c.loot = tg.pile; okk = true; }
            else if (tg.washer && tg.washer.state === 'done') { c.loot = { owner: tg.washer.owner, cloth: tg.washer.cloth }; tg.washer.state = 'idle'; tg.washer.owner = null; tg.washer.cloth = null; okk = true; }
            else if (tg.box && tg.box.coins > 0) { c.loot = { coins: tg.box.coins }; tg.box.coins = 0; okk = true; float(tg.box.x, WASH_Y - 80, '🪙', '#ff7a5a'); }
            if (okk) { SND.play('grab'); float(c.x, c.y - 70, '🤫', '#fff'); c.state = 'run'; goTo(c, DOOR.x + 30, DOOR.y); } else c.state = 'pickLoot';
          }
        }
        else if (c.state === 'run') { if (walk(c, dt, 120)) { c.gone = true; if (c.loot && c.loot.coins) { float(600, 250, '−🪙' + c.loot.coins, '#ff7a5a'); } else { repAdd(-.2); G.angryN++; } toast('😱', true, 900); SND.play('angry'); } }
        else if (c.state === 'leave') { if (walk(c, dt, 120)) c.gone = true; }
        break;
    }
  }
  function breakW(w) { if (w.state === 'broken') return; w.prev = w.state === 'wash' ? 'wash' : w.state; w.state = 'broken'; w.hits = 0; SND.play('spark'); for (let i = 0; i < 6; i++) smoke.push({ x: w.x + rnd(-14, 14), y: WASH_Y - 60, r: rnd(3, 6), t: rnd(.6, 1.4), vy: rnd(-18, -30) }); }
  function fixW(w) { w.state = w.prev === 'wash' ? 'wash' : (w.owner && w.cloth ? 'done' : 'idle'); w.hits = 0; SND.play('fixed'); float(w.x, WASH_Y - 80, '✓', '#7fe08a'); }
  function startFold(w) {
    if (piles.length >= PILE_CAP()) { float(TABLE.x, TOP - 30, 'FULL', '#ff7a5a'); return false; }
    w.state = 'fold'; w.t = 1.2; w.total = 1.2; SND.play('grab'); return true;
  }
  function collect(w) {
    const n = w.coins; if (n <= 0) return; w.coins = 0; earn(n); flyCoins(w.x, WASH_Y - 44, n); float(w.x, WASH_Y - 80, '+' + n); SND.play('coins');
  }
  function mopDone(p) { const i = puddles.indexOf(p); if (i >= 0) puddles.splice(i, 1); SND.play('fold'); float(p.x, p.y - 30, '✨', '#fff'); }
  const tablesOn = () => [TABLE].concat(TABLES.slice(0, S.up.rack));
  function pileSlots() {
    const out = [];
    for (const t of tablesOn()) for (const dx of [-44, 0, 44]) out.push({ x: t.x + dx, y: t.y - 40, sy: t.y - 1.5 });
    return out;
  }
  function freeSlot() { return pileSlots().find(s => !piles.some(p => p.x === s.x && p.y === s.y)) || { x: TABLE.x, y: TOP, sy: TABLE.y - 1.5 }; }
  function updWasher(w, dt) {
    w.blink += dt;
    if (w.state === 'wash') {
      w.t -= dt; w.rot += dt * 5;
      if (w.breakAt > 0 && 1 - w.t / w.total > w.breakAt) { w.breakAt = -1; breakW(w); return; }
      if (w.t <= 0) { w.t = 0; w.state = 'done'; w.doneT = 0; SND.play('beep'); }
    } else if (w.state === 'done') { w.doneT += dt; if (orphan(w)) { w.state = 'idle'; w.owner = null; w.cloth = null; } else if (S.up.fold && w.doneT > 4 && piles.length < PILE_CAP()) startFold(w); }
    else if (w.state === 'fold') { w.t -= dt; if (w.t <= 0) { if (!orphan(w)) piles.push(Object.assign({ owner: w.owner, cloth: w.cloth, folded: true }, freeSlot())); w.state = 'idle'; w.owner = null; w.cloth = null; SND.play('fold'); float(TABLE.x, TOP - 30, '✓', '#7fe08a'); } }
    else if (w.state === 'broken') { if (Math.random() < dt * 1.5) smoke.push({ x: w.x + rnd(-12, 12), y: WASH_Y - 66, r: rnd(2, 5), t: rnd(.8, 1.6), vy: rnd(-14, -26) }); }
  }

  // ── 가게 진행 ──
  function simShop(dt) {
    G.spawnT -= dt;
    const inside = custs.filter(c => !c.gone && c.kind === 'cust' && c.state !== 'away').length;
    if (G.spawnT <= 0) {
      const mul = (1.45 - S.rep * .15) * (1 - .12 * S.up.neon) * (S.weather === 'rain' ? .75 : 1) * hourMul();
      G.spawnT = Math.max(3.5, 9 - S.day * .2) * mul * rnd(.7, 1.3);
      if (inside < NW + 3) spawnCust();
    }
    if (isDawn()) { G.jerkT -= dt; if (G.jerkT <= 0) { G.jerkT = Math.max(10, 26 - S.day * 1.2) * rnd(.8, 1.2); if (custs.filter(c => !c.gone && c.kind !== 'cust').length < 2) spawnJerk(); } }
    for (const w of washers) updWasher(w, dt);
    for (const c of custs) { if (c.gone) continue; if (c.kind === 'cust') updCust(c, dt); else updJerk(c, dt); }
    custs = custs.filter(c => !c.gone);
    if (S.up.branch) { G.branchT -= dt; if (G.branchT <= 0) { G.branchT = 10; const n = S.up.branch * Math.round(NW * PAY() * .4); earn(n, DOOR.x - 60, DOOR.y - 70, '🏪 +'); SND.play('coin'); } }
    for (const s of smoke) { s.t -= dt; s.y += s.vy * dt; s.r += dt * 4; } smoke = smoke.filter(s => s.t > 0);
    for (const k of fcoins) { k.t += dt; if (k.t < .6) { k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= .9; k.vy *= .9; k.x = clamp(k.x, FLOOR.x1, FLOOR.x2); k.y = clamp(k.y, FLOOR.y1, FLOOR.y2); } else if (k.t > 1.1) { earn(k.val); flys.push({ x: k.x, y: k.y, vx: 0, vy: -60, t: 0, tx: coinTarget().x, ty: coinTarget().y }); k.got = true; } }
    fcoins = fcoins.filter(k => !k.got);
    for (const f of flys) { f.t += dt; if (f.t < 0) continue; if (f.t < .35) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 520 * dt; } else { if (f.sx === undefined) { f.sx = f.x; f.sy = f.y; } const k = Math.min(1, (f.t - .35) / .45), e = k * k; f.x = f.sx + (f.tx - f.sx) * e; f.y = f.sy + (f.ty - f.sy) * e; } }
    flys = flys.filter(f => f.t < .8);
    if (S.weather !== 'clear') { if (drops.length < 40 && Math.random() < .5) drops.push({ x: rnd(0, W), y: -4, v: S.weather === 'rain' ? rnd(120, 180) : rnd(18, 30), d: rnd(0, 6) }); for (const d of drops) { d.y += d.v * dt; d.d += dt; } drops = drops.filter(d => d.y < 70); }
  }
  function dayEnd() {   // 06:00 — 하루가 넘어간다
    const perfect = G.angryN === 0; const bonus = perfect ? 10 + S.day : 4;
    S.day++; earn(bonus, 320, 112); flyCoins(320, 100, bonus); if (perfect) float(320, 96, 'PERFECT', '#7fe08a');
    SND.play('clear'); toast(SEASON_IC[season()] + ' DAY ' + S.day, false, 1600);
    rollWeather(); G.today = 0; G.servedN = 0; G.angryN = 0; G.rep0 = S.rep; save();
  }

  const TASK_IC = { fix: '🔧', mop: '🧹', coins: '🪙', cash: '🪙', fold: '👕' };
  // ── 주인 — 가게를 돌아다니며 스스로 일한다. 설비를 사면 같은 일을 더 빨리 한다 ──
  const nearest = list => { let b = null, bd = 1e9; for (const o of list) { const d = Math.hypot(o.x - P.x, (o.y || WASH_Y) - P.y); if (d < bd) { bd = d; b = o; } } return b; };
  // 일 고르기 — 설비가 없어도 다 한다(느리게). 공구함·대걸레·카트를 사면 빨라지고 미리미리 챙긴다
  function pickOwnerTask(byHand) {
    const up = k => S.up[k] > 0;
    const coinAt = n => { const w = nearest(washers.filter(w => w.coins >= n && w.state !== 'broken')); return w ? { kind: 'coins', o: w, x: w.x, y: WASH_Y + 12, dur: .3 } : null; };
    let t = null;
    // 1. 고장 — 공구함이 있으면 빨리 고친다
    { const w = nearest(washers.filter(w => w.state === 'broken')); if (w) t = { kind: 'fix', o: w, x: w.x, y: WASH_Y + 12, dur: (up('tools') ? 2.2 : 3.4) - .4 * S.up.tough }; }
    // 2. 동전통이 꽉 찬 세탁기 — 비워야 손님이 다시 쓴다
    if (!t) t = coinAt(byHand ? 1 : CAP());
    // 3. 물웅덩이 — 대걸레가 있으면 빨리 닦는다
    if (!t && puddles.length) { const p = nearest(puddles); t = { kind: 'mop', o: p, x: p.x, y: p.y, dur: up('mop') ? 1.4 : 2.2 }; }
    // 4. 다 된 빨래를 개어 놓는다 (개는 기계를 사면 기계가 하고 아저씨는 딴 일을 한다)
    if (!t && (byHand || !up('fold'))) { const w = nearest(washers.filter(w => w.state === 'done' && !orphan(w) && (byHand || w.doneT > 3))); if (w && piles.length < PILE_CAP()) t = { kind: 'fold', o: w, x: w.x, y: WASH_Y + 12, dur: up('fold') ? .4 : 1.3 }; }   // doneT 3초 — 손님이나 사장님이 먼저 가져갈 틈을 둔다
    // 5. 카트가 있으면 꽉 차기 전에 미리 수금하고 흘린 동전도 줍는다
    if (!t && up('cart')) t = coinAt(Math.min(CAP(), 8));
    if (!t && cash.length && (byHand || up('cart'))) { const k = nearest(cash); t = { kind: 'cash', o: k, x: k.x, y: k.y, dur: .35 }; }
    return t;
  }
  // 일이 없을 때 도는 자리 — 세탁기 줄, 빨래 탁자, 환전기, 자판기, 문 앞
  function patrolSpots() {
    const a = [{ x: EXCH.x + 40, y: 246 }, { x: WX(0), y: WASH_Y + 16 }, { x: TABLE.x - 60, y: TABLE.y - 36 }, { x: WX(Math.floor(NW / 2)), y: WASH_Y + 16 }, { x: TABLE.x + 60, y: TABLE.y - 36 }, { x: WX(NW - 1), y: WASH_Y + 16 }, { x: DOOR.x - 68, y: 262 }];
    if (S.up.vend) a.push({ x: VEND.x - 40, y: 246 });
    return a;
  }
  function nextPatrol() {
    const a = patrolSpots();
    P.pat = (P.pat + 1 + (Math.random() < .3 ? 1 : 0)) % a.length;
    const s = a[P.pat];
    goTo(P, clamp(s.x + rnd(-10, 10), FLOOR.x1 + 16, FLOOR.x2 - 16), s.y);
    P.wipe = s.y < 200 ? 1.4 : 0;   // 세탁기 앞에 서면 유리를 한 번 닦는다
  }
  // 아저씨를 탭하면 일하러 간다
  function orderOwner() {
    const t = pickOwnerTask(true);
    P.user = false;
    if (!t) { P.task = null; SND.play('click'); float(P.x, P.y - 76, '💤', '#cfd6dd'); return; }
    P.task = t; P.hold = 0; P.wipe = 0; goTo(P, t.x, t.y);
    SND.play('grab'); float(P.x, P.y - 76, TASK_IC[t.kind] || '💪');
  }
  function updOwner(dt) {
    P.clock += dt;
    if (!P.task && !P.user) { const t = pickOwnerTask(false); if (t) { P.task = t; P.hold = 0; P.wipe = 0; goTo(P, t.x, t.y); } }
    if (P.task) {
      const t = P.task;
      if ((t.kind === 'fix' && t.o.state !== 'broken') || (t.kind === 'mop' && !puddles.includes(t.o)) || (t.kind === 'coins' && t.o.coins <= 0) || (t.kind === 'cash' && !cash.includes(t.o)) || (t.kind === 'fold' && t.o.state !== 'done')) { P.task = null; P.path = []; P.moving = false; return; }
      if (P.path.length) { walk(P, dt, SPEED()); P.moving = true; }
      else {
        P.moving = false; P.face = 1; P.hold += dt;
        if (t.kind === 'fix' && Math.floor(P.hold * 2) !== Math.floor((P.hold - dt) * 2)) SND.play('fix');
        if (P.hold >= t.dur) { if (t.kind === 'fix') fixW(t.o); else if (t.kind === 'mop') mopDone(t.o); else if (t.kind === 'cash') grabCash(t.o); else if (t.kind === 'fold') { collect(t.o); startFold(t.o); } else collect(t.o); P.task = null; P.hold = 0; }
      }
    } else if (P.path.length) { walk(P, dt, SPEED()); P.moving = true; if (!P.path.length) { P.user = false; P.idleT = P.wipe ? P.wipe + rnd(.5, 1.2) : rnd(1.2, 3); } }
    else {
      P.moving = false; P.idleT -= dt;
      if (P.wipe > 0) { P.wipe -= dt; if (Math.random() < dt * 6) sparkleAt(P.x + rnd(-14, 14), WASH_Y - rnd(16, 46)); if (P.wipe <= 0) SND.play('fold'); }
      if (P.idleT <= 0) { P.idleT = rnd(1.2, 3); nextPatrol(); }
    }
  }

  // ── 탭 ──
  function tap(x, y) {
    if (G.place !== 'shop') return;
    for (const c of custs) if (!c.gone && c.kind !== 'cust' && c.state !== 'leave' && c.state !== 'run' || (c.kind === 'thief' && !c.gone && c.state === 'run')) { const cy = c.seat >= 0 ? seatY(c.seat) + 6 : c.y; if (Math.abs(x - c.x) < 24 && y > cy - 72 && y < cy + 10) { shoo(c); return; } }
    for (const k of cash) if (Math.hypot(x - k.x, (y - k.y) * 1.4) < 28) { grabCash(k); return; }
    for (const p of puddles) if (Math.hypot(x - p.x, (y - p.y) * 1.6) < 26) { p.hits++; SND.play('grab'); float(p.x, p.y - 30, '🧹', '#fff'); if (p.hits >= MOP_N) mopDone(p); return; }
    for (const w of washers) if (Math.abs(x - w.x) < 24 && y > WASH_Y - 64 && y < WASH_Y + 12) {
      collect(w);
      if (w.state === 'broken') { w.hits++; SND.play('fix'); smoke.push({ x: w.x + rnd(-10, 10), y: WASH_Y - 60, r: 3, t: .5, vy: -30 }); float(w.x + rnd(-14, 14), WASH_Y - 60, '🔧', '#fff'); if (w.hits >= FIX_N) fixW(w); }
      else if (w.state === 'done') startFold(w);
      return;
    }
    if (Math.abs(x - P.x) < 24 && y > P.y - 72 && y < P.y + 12) { orderOwner(); return; }
    if (x > FLOOR.x1 && x < FLOOR.x2 && y > FLOOR.y1 && y < FLOOR.y2) { P.task = null; P.user = true; P.wipe = 0; goTo(P, x, y); }
  }
  canvas.addEventListener('pointerdown', e => { if (G.place !== 'shop') return; e.preventDefault(); const r = canvas.getBoundingClientRect(); tap((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H); });

  // ── 점원 준호 (상점 창) ──
  function clerkLines() {
    const h = S.clock, hh = heartsOf('clerk'), L = [];
    const add = (ko, en) => L.push(T(ko, en));
    if (S.debt <= 0) add('사장님, 빚 다 갚으셨다면서요! 축하드려요!', 'You paid it all off? Congrats!');
    else if (S.debt < 800) add('빚 거의 다 갚으셨네요. 조금만 더!', 'Almost debt free. Hang in there!');
    if (h >= 2 && h < 5) add('이 시간엔 취객 조심하세요…', 'Watch out for drunks at this hour…');
    else if (h >= 22 || h < 2) add('밤에도 오셨네요. 저도 야간이에요.', 'Late night, huh? Me too.');
    else if (h >= 6 && h < 10) add('아침이네요. 밤새 고생하셨어요.', 'Morning. Rough night?');
    else if (h >= 10 && h < 18) add('낮에 오시는 건 드물죠? 한가해요.', 'Daytime visit? It is quiet now.');
    else add('저녁이라 슬슬 바쁘시겠어요.', 'Evening rush coming, right?');
    if (S.weather === 'rain') add('비 오면 빨래방 손님 늘죠?', 'Rain brings laundry, I hear.');
    if (S.weather === 'snow') add('눈 오는 날엔 이불 손님 많대요.', 'Snow days mean blanket customers.');
    if (season() === 0) add('벚꽃 피니까 좋네요.', 'Cherry blossoms are nice.');
    if (season() === 1) add('덥죠? 음료 시원해요.', 'Hot, huh? Drinks are cold.');
    if (season() === 2) add('낙엽 쓸기 귀찮아요.', 'Sweeping leaves is a chore.');
    if (season() === 3) add('춥죠. 감기 조심하세요.', 'Cold out. Do not catch a cold.');
    add('신상 컵라면 들어왔어요.', 'New cup noodles came in.'); add('점장님이 또 잔소리해요.', 'The manager is nagging again.'); add('저도 코인빨래방 자주 가요.', 'I use the laundromat too.'); add('졸려요… 커피 한 잔 해야겠어요.', 'So sleepy… need a coffee.');
    if (hh >= 3) add('사장님은 단골이니까 싸게 드려요.', 'Regulars get a discount from me.');
    if (hh >= 5) add('사장님 오시면 하루가 좋아요.', 'Your visits make my day.');
    return L;
  }
  let clerkLine = '';
  function clerkTalk(first) {
    const r = regOf('clerk'); const before = heartsOf('clerk');
    if (r.gday !== S.day) { r.gday = S.day; r.n++; r.p += 1; SND.play('nice'); } else if (!first) SND.play('coin');
    const L = clerkLines(); clerkLine = first ? L[0] : pick(L);
    if (heartsOf('clerk') > before) SND.play('nice');
    if (heartsOf('clerk') >= 5 && !r.gift) { r.gift = 1; S.money += 40; S.earned += 40; toast('💝', false, 1200); }
  }
  const discount = () => heartsOf('clerk') >= 3 ? .9 : 1;

  // ── 입력 ──
  addEventListener('keydown', e => {
    if (e.repeat) return; const k = e.key.toLowerCase();
    if (k === 'm') { $('btnBgm').classList.toggle('off', !SND.toggleBgm()); return; }
    if (k === 'k') { $('btnSfx').classList.toggle('off', !SND.toggleSfx()); return; }
    if (G.place === 'title') { if (k === ' ' || k === 'enter') ($('btnCont').hidden ? newGame() : contGame()); return; }
    if (k === 'b' || k === 'escape') { if (G.place === 'shop') openPanel('shop'); else if (G.place === 'panel' && G.mode === 'shop') closePanel(); }
  });
  $('btnShop').addEventListener('click', () => { if (G.place === 'shop') openPanel('shop'); });
  $('btnBgm').addEventListener('click', () => $('btnBgm').classList.toggle('off', !SND.toggleBgm()));
  $('btnSfx').addEventListener('click', () => $('btnSfx').classList.toggle('off', !SND.toggleSfx()));
  $('btnBgm').classList.toggle('off', !SND.bgm); $('btnSfx').classList.toggle('off', !SND.sfx);
  $('rotGo').addEventListener('click', () => { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', e => { e.preventDefault(); document.body.classList.remove('portrait'); skipRot = true; });
  let skipRot = false;

  function update(dt) {
    G.anim += dt;
    if (G.place !== 'shop') { if (G.place === 'panel') hud(); return; }
    advance(dt); if (G.place !== 'shop') return;
    simShop(dt); updOwner(dt);
    for (const f of floats) { f.t -= dt; f.y -= 22 * dt; } floats = floats.filter(f => f.t > 0);
    G.secT += dt; if (G.secT >= 1) { G.secT -= 1; S.rate += (G.secEarn - S.rate) * .04; G.secEarn = 0; }
    G.saveT += dt; if (G.saveT >= 5) { G.saveT = 0; save(); }
    $('btnShop').classList.toggle('on', SHOP.some(it => canBuy(it)));
    hud();
  }

  // ── 창: 상점·단골·돌아왔을 때 ──
  let tab = 'shop';
  const branchName = () => T((S.up.branch + 2) + '호점', 'Branch ' + (S.up.branch + 2));
  const priceOf = it => Math.round(it.price[S.up[it.id]] * discount() / 10) * 10;
  const showItem = it => it.id !== 'branch' || S.debt <= 0;
  const canBuy = it => showItem(it) && S.up[it.id] < it.price.length && S.money >= priceOf(it);
  function openPanel(mode) {
    G.mode = mode; G.place = 'panel'; tab = 'shop';
    document.body.classList.add('morning'); document.body.classList.remove('playing');
    const tabs = $('tabs'); tabs.hidden = mode === 'back';
    $('mHead').textContent = mode === 'back' ? 'WELCOME BACK' : 'DAY ' + S.day + ' ' + SEASON_IC[season()] + '  ⭐ ' + S.rep.toFixed(1);
    $('btnNext').textContent = mode === 'back' ? T('받기', 'COLLECT') : T('닫기', 'CLOSE');
    if (mode === 'shop') clerkTalk(true);
    renderPanel(); $('morning').classList.add('show'); save();
  }
  function closePanel() {
    $('morning').classList.remove('show'); document.body.classList.remove('morning'); document.body.classList.add('playing'); G.place = 'shop'; hud();
    if (G.mode === 'back' && G.back) { dropBack(G.back); G.back = null; }
  }
  // 밤새 번 돈은 동전통에 먼저 차고, 넘친 건 바닥에 흩어진다 — 주워야 내 돈이 된다
  function dropBack(b) {
    for (const w of washers) w.coins = Math.min(CAP() - 3, w.coins + PAY());   // 세탁기마다 한 판치
    let extra = b.bonus ? b.bonus.coin : 0;
    if (b.bonus && b.bonus.rep) repAdd(b.bonus.rep);
    if (extra > 0) { const unit = Math.max(5, Math.round(extra / 3)); let left = extra, guard = 0;
      while (left > 0 && guard++ < 6) { const v = Math.min(left, unit); left -= v; cash.push({ x: rnd(FLOOR.x1 + 40, FLOOR.x2 - 40), y: rnd(FLOOR.y1 + 30, FLOOR.y2 - 20), val: v, t: rnd(0, 6) }); } }
    for (let i = 0; i < b.mess.puddle; i++) { const ws = washers.filter(w => !dirty(w)); if (ws.length) { const w = pick(ws); puddles.push({ w, x: w.x, y: WASH_Y + 16, hits: 0 }); } }
    if (b.mess.broken) { const ws = washers.filter(w => w.state !== 'broken'); if (ws.length > 1) breakW(pick(ws)); }
    SND.play('coins'); if (b.bonus) SND.play('nice');
    save();
  }
  function grabCash(k) { const i = cash.indexOf(k); if (i < 0) return; cash.splice(i, 1); earn(k.val); flyCoins(k.x, k.y - 10, k.val); float(k.x, k.y - 34, '+' + k.val); SND.play('coins'); }
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderPanel(); }));
  const fmtAway = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + 'h ' + m + 'm' : m + 'm'; };
  function renderPanel() {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('mMoney').textContent = S.money; $('mDebt').textContent = S.debt;
    const payAll = Math.min(S.money, S.debt); $('payN').textContent = '−' + payAll; $('btnPay').disabled = payAll <= 0; $('btnPay').hidden = S.debt <= 0;
    const body = $('mBody'); body.innerHTML = '';
    if (G.mode === 'back') {
      const b = G.back;
      let h = '<div class="sum"><div class="card"><div class="k">⏱</div><div class="v">' + fmtAway(b.away) + '</div></div>'
        + '<div class="card"><div class="k">🫧</div><div class="v">' + b.cust + '</div></div>'
        + '<div class="card"><div class="k">🪙</div><div class="v up">+' + b.n + '</div></div></div>';
      if (b.bonus) h += '<div class="clerk"><div class="say">' + b.bonus.ic + ' ' + T(b.bonus.ko, b.bonus.en) + ' <b>+' + b.bonus.coin + '</b></div></div>';
      const m = [];
      if (b.mess.puddle) m.push('🧹 ' + b.mess.puddle);
      if (b.mess.broken) m.push('🔧 ' + b.mess.broken);
      if (m.length) h += '<div class="clerk"><div class="say">' + m.join('   ') + '</div></div>';
      body.innerHTML = h;
      return;
    }
    if (tab === 'shop') {
      const head = document.createElement('div'); head.className = 'clerk';
      head.innerHTML = (ok('clerk_face') ? '<img src="img/clerk_face.png" alt="">' : '') + '<div class="say">' + clerkLine + '</div><div class="hs">' + '♥'.repeat(heartsOf('clerk')) + '♡'.repeat(5 - heartsOf('clerk')) + '</div>';
      head.querySelector('img') && head.querySelector('img').addEventListener('click', () => { clerkTalk(false); renderPanel(); });
      body.appendChild(head);
      const wrap = document.createElement('div'); wrap.className = 'shop';
      for (const it of SHOP) {
        if (!showItem(it)) continue;
        const lv = S.up[it.id], max = lv >= it.price.length, price = max ? 0 : priceOf(it), can = canBuy(it);
        const d = document.createElement('div'); d.className = 'item' + (max ? ' max' : can ? '' : ' no');
        const name = it.id === 'branch' ? (max ? T('4호점', 'Branch 4') : branchName()) : T(it.ko, it.en);
        const icon = it.img && ok(it.img) ? '<div class="ic pic"><img src="img/' + it.img + '.png' + IMGV + '" alt=""></div>' : '<div class="ic">' + it.ic + '</div>';
        d.innerHTML = icon + '<div class="n">' + name + '<small>' + (it.price.length > 1 && it.id !== 'branch' ? 'Lv ' + lv + ' / ' + it.price.length : (max ? '✓' : '')) + '</small></div><div class="p">' + (max ? 'MAX' : '🪙 ' + price) + '</div>';
        if (can) d.addEventListener('click', () => { S.money -= price; S.up[it.id]++; SND.play('coins'); SND.play('nice'); applyUpgrade(it.id); save(); renderPanel(); toast(it.id === 'branch' ? '🏪' : 'NICE', false, 900); });
        wrap.appendChild(d);
      }
      body.appendChild(wrap);
    } else {
      const wrap = document.createElement('div'); wrap.className = 'reg';
      for (const k of CUST_ALL.concat(['blanket', 'clerk'])) {
        const img = k === 'clerk' ? 'clerk_face' : k; if (!ok(img)) continue; const r = S.reg[k], h = r ? heartsOf(k) : 0, met = r && r.n > 0;
        const d = document.createElement('div'); d.className = 'card' + (met ? '' : ' none');
        d.innerHTML = '<img src="img/' + img + '.png' + IMGV + '" alt=""><div class="nm">' + (met ? T(REG_NAMES[k][0], REG_NAMES[k][1]) : '???') + '</div><div class="hs">' + '♥'.repeat(h) + '♡'.repeat(5 - h) + '</div><div class="cnt">' + (met ? '× ' + r.n : '') + '</div>';
        wrap.appendChild(d);
      }
      body.appendChild(wrap);
    }
  }
  function applyUpgrade(id) {   // 산 것은 바로 가게에 놓인다
    layout();
    if (id === 'wash') { washers.push(mkWasher(washers.length)); washers.forEach((w, k) => { w.x = WX(k); }); for (const p of puddles) p.x = p.w.x; }
  }
  $('btnPay').addEventListener('click', () => { const p2 = Math.min(S.money, S.debt); if (p2 <= 0) return; S.money -= p2; S.debt -= p2; SND.play('coins'); save(); if (S.debt <= 0 && !S.ended) ending(); else renderPanel(); });
  $('btnNext').addEventListener('click', () => { if (G.place !== 'panel') return; closePanel(); });
  function ending() { S.ended = true; save(); $('endDay').textContent = S.day; $('endCoin').textContent = S.earned; $('ending').classList.add('show'); SND.play('clear'); setTimeout(() => SND.play('nice'), 600); }
  $('endGo').addEventListener('click', () => { $('ending').classList.remove('show'); if (G.place === 'panel') renderPanel(); });

  // ── 떠나 있던 동안 ──
  function offline(sec) {
    if (sec < AWAY_MIN) return { n: 0, cust: 0 };
    return { n: NIGHT_ONE(), cust: NW };
  }
  const BONUS = [
    { ic: '💵', ko: '세탁기 안에 지폐가 있었다', en: 'A bill was left in a washer', k: 3 },
    { ic: '💝', ko: '단골이 선물을 두고 갔다', en: 'A regular left a gift', k: 1.5, rep: .3 },
    { ic: '😴', ko: '밤새 자고 간 손님이 팁을 두고 갔다', en: 'Someone slept over and left a tip', k: 2 },
    { ic: '💍', ko: '빨래에서 반지가 나왔다', en: 'A ring turned up in the laundry', k: 1, rep: .5 },
  ];
  function checkBack(away) {
    if (G.place !== 'shop' || away < 60) return;
    const o = offline(away); if (o.n <= 0) return;
    o.away = away;
    o.bonus = Math.random() < .15 ? Object.assign({}, pick(BONUS)) : null;
    if (o.bonus) o.bonus.coin = Math.max(8, Math.round(o.n * o.bonus.k));
    o.mess = { puddle: away > 1800 ? 1 + (Math.random() < .5 ? 1 : 0) : 0, broken: (away > 7200 && Math.random() < .6) ? 1 : 0 };
    G.back = o; openPanel('back');
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (G.place === 'shop') save(); }
    else if (S.t && G.place === 'shop') checkBack((Date.now() - S.t) / 1000);
  });

  // ── 시작 ──
  function begin(away) {
    SND.init(); $('title').classList.add('hide'); resetShop(); if (!away) rollWeather(); G.today = 0; G.servedN = 0; G.angryN = 0; G.rep0 = S.rep; G.shown = S.money;
    G.place = 'shop'; document.body.classList.add('playing'); $('topbar').classList.add('show'); $('keys').classList.add('show');
    toast(SEASON_IC[season()] + ' DAY ' + S.day, false, 1400); SND.play('bell'); hud();
    if (away) checkBack(away); save();
  }
  function newGame() { if (!$('btnCont').hidden && !newGame.armed) { newGame.armed = true; $('btnNew').querySelector('span').textContent = T('지우고 새로', 'ERASE & START'); return; } S = fresh(); begin(0); }
  function contGame() { load(); const away = S.t ? (Date.now() - S.t) / 1000 : 0; begin(away); }
  $('btnNew').addEventListener('click', newGame); $('btnCont').addEventListener('click', contGame);
  if (load()) { $('btnCont').hidden = false; $('contInfo').textContent = 'DAY ' + S.day + ' · 🪙 ' + S.money + ' · 💸 ' + S.debt; }
  layout(); resetShop();

  // ── 그리기 ──
  function spr(name, x, y, face, bob, alpha, anim, clock) {
    const fr = anim ? frameOf(name, anim, clock || 0) : null; const im = fr || IMG[name]; ctx.save(); if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (fr) bob = 0;
    if (!im || !im.ok) { ctx.fillStyle = '#c0c8d0'; ctx.fillRect(x - 12, y - 48, 24, 48); ctx.restore(); return { w: 24, h: 48 }; }
    const w = im.width / 2, h = im.height / 2, b = bob ? Math.abs(Math.sin(bob)) * 2 : 0;
    ctx.translate(Math.round(x), Math.round(y - b)); if (face < 0) ctx.scale(-1, 1);
    ctx.drawImage(im, -Math.round(w / 2), -h, w, h); ctx.restore(); return { w, h };
  }
  function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x, y + 1, r, r * .35, 0, 0, Math.PI * 2); ctx.fill(); }
  function bar(x, y, w, v, col) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5); ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, Math.max(0, w * v), 3); }
  function icon(s, x, y, size) { ctx.font = (size || 11) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); }
  function txt(s, x, y, col, size, font) { ctx.font = 'bold ' + (size || 10) + 'px ' + (font || "'Ria', 'Griun', sans-serif"); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(s, x, y); ctx.fillStyle = col || '#fff'; ctx.fillText(s, x, y); }
  function ring(x, y, rx, ry, col) { ctx.save(); ctx.globalAlpha = .45 + Math.sin(G.anim * 6) * .3; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  function drawOwner() {
    shadow(P.x, P.y, 13);
    const busy = P.task && !P.path.length;
    const pa = busy ? (P.task.kind === 'fix' ? 'fix' : 'fold') : (P.moving ? 'walk' : 'idle');
    spr('owner', P.x, P.y, P.face, P.bob, undefined, pa, P.clock);
    if (S.up.cart && ok('coinbag')) ctx.drawImage(IMG.coinbag, Math.round(P.x - P.face * 18 - 7), Math.round(P.y - 22), 15, 15);
    if (S.up.tools && ok('toolbox')) ctx.drawImage(IMG.toolbox, Math.round(P.x + P.face * 14 - 6), Math.round(P.y - 16), 12, 15);
    if (P.task) icon(TASK_IC[P.task.kind] || '💪', P.x, P.y - 90, 13);   // 무슨 일을 하러 가는지 머리 위에
    if (busy && P.task.dur > .5) bar(P.x, P.y - 78, 34, P.hold / P.task.dur, P.task.kind === 'fix' ? '#ffb040' : '#7fe08a');
  }
  const skyAt = () => { const h = S.clock; if (h >= 7 && h < 18) return 0; if (h >= 20 || h < 5) return 1; if (h < 7) return 1 - (h - 5) / 2; return (h - 18) / 2; };

  function drawRoom() {
    ctx.fillStyle = '#b9c9d2'; ctx.fillRect(0, 78, W, H - 78);
    ctx.fillStyle = '#c8d6de'; for (let y = 78; y < H; y += 32) for (let x = ((y - 78) / 32 & 1) * 32; x < W; x += 64) ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; for (let y = 78; y < H; y += 32) ctx.fillRect(0, y, W, 1); for (let x = 0; x < W; x += 32) ctx.fillRect(x, 78, 1, H - 78);
    const wl = IMG.wall; if (wl && wl.ok) ctx.drawImage(wl, 0, 0, W, 78); else { ctx.fillStyle = '#9fd0c4'; ctx.fillRect(0, 0, W, 78); }
    const day = 1 - skyAt(); if (day > 0) { ctx.fillStyle = 'rgba(200,230,255,' + (.35 * day) + ')'; ctx.fillRect(0, 0, W, 76); }
    if (S.weather !== 'clear') { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 76); ctx.clip(); for (const d of drops) { if (S.weather === 'rain') { ctx.strokeStyle = 'rgba(190,220,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 1, d.y + 7); ctx.stroke(); } else { ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(d.x + Math.sin(d.d * 2) * 3, d.y, 2, 2); } } ctx.restore(); }
    if (S.up.neon) { if (ok('neon')) spr('neon', 320, 68, 1); else { const gl = .55 + Math.sin(G.anim * 3) * .15; ctx.fillStyle = 'rgba(255,106,213,' + gl + ')'; ctx.font = "bold 16px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('COIN LAUNDRY 24', 320, 40); } }
    if (S.up.cctv) { if (ok('cctv')) spr('cctv', 596, 66, 1); else { ctx.fillStyle = '#333'; ctx.fillRect(590, 44, 16, 8); } }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 76, W, 4);
    ctx.fillStyle = '#5a4634'; ctx.fillRect(W - 8, DOOR.y - 60, 8, 72); ctx.fillStyle = '#ffd24a'; ctx.fillRect(W - 6, DOOR.y - 20, 3, 6);
    ctx.fillStyle = 'rgba(120,60,40,.35)'; ctx.fillRect(W - 54, DOOR.y - 14, 46, 26);
  }
  function drawWasher(w) {
    if (w.state === 'broken') ring(w.x, WASH_Y + 4, 22, 8, '#ff6a4a'); else if (w.state === 'done') ring(w.x, WASH_Y + 4, 22, 8, '#7fe08a'); else if (w.coins >= CAP()) ring(w.x, WASH_Y + 4, 22, 8, '#ffd24a');
    const s = spr('washer', w.x, WASH_Y, 1); const top = WASH_Y - s.h, cx = w.x - s.w * .05, cy = top + s.h * .56, r = s.h * .2;
    if (w.state === 'wash' || (w.state === 'broken' && w.prev === 'wash') || w.state === 'done' || w.state === 'fold') {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = w.state === 'wash' ? 'rgba(60,120,200,.35)' : 'rgba(40,60,90,.25)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = w.cloth || '#e0607a';
      for (let k = 0; k < 3; k++) { const a = w.rot + k * 2.1, rr = r * .55; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .8 + (w.state === 'wash' ? 0 : r * .3), r * .32, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    if (w.state === 'wash') bar(w.x, top - 8, 30, 1 - w.t / w.total, '#7ac0ff');
    if (w.state === 'fold') { bar(w.x, top - 8, 30, 1 - w.t / w.total, '#7fe08a'); spr('folded', w.x, WASH_Y + 4, 1); }
    if (w.state === 'done') { if (Math.sin(w.blink * 6) > 0) { ctx.fillStyle = '#5ee07a'; ctx.fillRect(w.x + s.w * .3, top + 5, 4, 4); } icon('👕', w.x, top - 10 - Math.abs(Math.sin(w.blink * 4)) * 3, 13); }
    if (w.state === 'broken') { ctx.fillStyle = 'rgba(255,60,40,.55)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); if (Math.random() < .12) icon('⚡', cx + rnd(-10, 10), cy + rnd(-10, 10), 14); ctx.fillStyle = '#ff5a3a'; ctx.fillRect(w.x - 6, top + 5, 12, 4); if (w.hits) bar(w.x, top - 8, 30, w.hits / FIX_N, '#ffb040'); }
    if (w.coins >= CAP()) { icon('🪙', w.x - 2, top - 12 - Math.abs(Math.sin(w.blink * 5)) * 3, 12); txt('!', w.x + 10, top - 12, '#ff5a3a', 12); }
    else if (w.coins > 0) { ctx.fillStyle = '#ffd24a'; for (let k = 0; k < Math.ceil(w.coins / 4); k++) ctx.fillRect(w.x - s.w / 2 + 3 + k * 5, top + s.h - 9, 4, 3); }
  }
  const seated = c => c.seat >= 0 && !c.path.length && (c.state === 'sit' || c.state === 'sleep');
  function drawCust(c) {
    const asleep = c.state === 'sleep';
    if (c.kind !== 'cust' && c.state !== 'leave') ring(c.x, (seated(c) ? seatY(c.seat) + 6 : c.y) + 2, 18, 7, '#ff6a4a');
    if (seated(c)) { const by = c.seat < 3 ? BENCH.y : BENCH2.y; shadow(c.x, by + 3, 12); spr(c.img, c.x, by + 3, c.face, 0, undefined, asleep ? 'sleep' : 'idle', G.anim + c.x * .01); }
    else {
      shadow(c.x, c.y, 12);
      if (c.kind === 'drunk' && c.img === 'sleeper') spr('sleeper', c.x, c.y + 2, c.face);
      else spr(c.img, c.x, c.y, c.face, (c.path.length ? c.bob : 0) + (c.kind === 'drunk' ? Math.sin(G.anim * 3) * .6 : 0), undefined, asleep ? 'sleep' : c.path.length ? 'walk' : 'idle', G.anim + c.x * .01);
    }
    const top = seated(c) ? (c.seat < 3 ? BENCH.y : BENCH2.y) - 63 : c.y - 66;
    if (c.drain > 0 && c.kind === 'cust') bar(c.x, top - 4, 24, c.patience, c.patience > .5 ? '#7fe08a' : c.patience > .25 ? '#ffd24a' : '#ff5a3a');
    let ic = null;
    if (c.kind === 'cust') { if (c.state === 'waitW') ic = '⏳'; else if (asleep) ic = '💤'; else if (c.state === 'atTable' || c.state === 'waitOwn') ic = '👕'; else if (c.angry) ic = '😡'; else if (c.heavy && c.state === 'toW') ic = '🛏️'; }
    else if (c.kind === 'drunk') { if (asleep) ic = '💤'; } else if (c.kind === 'kicker' && c.state === 'gloat') ic = '😈'; else if (c.kind === 'thief' && c.state === 'run') ic = '👕';
    if (ic) icon(ic, c.x, top - 10 + (asleep ? Math.sin(G.anim * 2) * 2 : 0), 12);
    if (c.kind === 'cust' && c.h >= 3 && !ic && !c.path.length) icon('♥', c.x, top - 8, 9);
    if (c.kind === 'thief' && c.loot && !c.loot.coins) spr('folded', c.x + 6, c.y - 30, 1, 0);
    if (c.kind === 'drunk' && c.hits) bar(c.x, top - 12, 24, c.hits / 3, '#ffd24a');
  }
  function drawPile(p) { spr('folded', p.x, p.y || TOP, 1, 0); }
  function tintRoom() {
    const h = S.clock; let a = 0, col = '20,30,80';
    if (h >= 22 || h < 2) a = .16; else if (h < 4) { a = .22; col = '40,20,80'; } else if (h < 5) { a = .16; col = '60,30,80'; } else if (h < 6) { a = .12; col = '200,110,60'; } else if (h >= 18 && h < 22) { a = .08 * (h - 18) / 4 + .04; col = '255,150,60'; }
    if (season() === 3) a += .04;
    if (a) { ctx.fillStyle = 'rgba(' + col + ',' + a + ')'; ctx.fillRect(0, 0, W, H); }
  }
  const PLANTS = [[594, 240], [218, 338], [596, 332]];   // 첫 화분은 자판기 옆(오른쪽 벽 앞)
  function drawShop() {
    drawRoom();
    for (const w of washers) drawWasher(w);
    shadow(EXCH.x, EXCH.y, 18); spr('exch', EXCH.x, EXCH.y, 1);
    if (S.up.vend) { shadow(VEND.x, VEND.y, 20); spr('vending', VEND.x, VEND.y, 1); }
    for (let i = 0; i < S.up.plant; i++) spr('plant', PLANTS[i][0], PLANTS[i][1], 1);
    spr('basket', 40, 300, 1);
    const ents = [];
    ents.push({ y: BENCH.y - 2, f: () => { shadow(BENCH.x, BENCH.y, 50); spr('bench', BENCH.x, BENCH.y, 1); } });
    if (S.up.bench) ents.push({ y: BENCH2.y - 2, f: () => { shadow(BENCH2.x, BENCH2.y, 50); spr('bench', BENCH2.x, BENCH2.y, 1); } });
    ents.push({ y: TABLE.y - 2, f: () => { shadow(TABLE.x, TABLE.y, 100); spr('table', TABLE.x, TABLE.y, 1); if (S.up.fold) spr('folder', TABLE.x + 90, TABLE.y, 1); } });
    for (const t of TABLES.slice(0, S.up.rack)) ents.push({ y: t.y - 2, f: () => { shadow(t.x, t.y, 100); spr('table', t.x, t.y, 1); } });
    for (const p of piles) ents.push({ y: p.sy || TABLE.y - 1.5, f: () => drawPile(p) });
    for (const p of puddles) ents.push({ y: p.y - 30, f: () => { ring(p.x, p.y + 4, 20, 8, '#9fe07a'); if (ok('puddle')) spr('puddle', p.x, p.y + 6, 1); else { ctx.fillStyle = 'rgba(120,180,60,.7)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 16, 7, 0, 0, Math.PI * 2); ctx.fill(); } if (p.hits) bar(p.x, p.y - 30, 24, p.hits / MOP_N, '#7fe08a'); } });
    for (const k of cash) ents.push({ y: k.y - 1, f: () => {
      const b = Math.sin(G.anim * 2 + k.t) * 1.5;
      ring(k.x, k.y + 4, 16, 7, '#ffd24a');
      if (ok('coinbag')) spr('coinbag', k.x, k.y + b, 1);
      else { ctx.fillStyle = '#ffd24a'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(k.x + (i - 1) * 5, k.y - 3 + b - (i % 2) * 3, 5, 0, Math.PI * 2); ctx.fill(); } }
      txt('+' + k.val, k.x, k.y - 24, '#ffd24a', 10);
    } });
    for (const k of fcoins) ents.push({ y: k.y - 20, f: () => { const b = k.t < .6 ? Math.abs(Math.sin(k.t * 12)) * 10 : 0; if (ok('coin')) ctx.drawImage(IMG.coin, Math.round(k.x - 5), Math.round(k.y - 5 - b), 10, 10); else { ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(k.x, k.y - b, 4, 0, Math.PI * 2); ctx.fill(); } } });
    for (const c of custs) if (!c.gone && c.state !== 'away') ents.push({ y: seated(c) ? (c.seat < 3 ? BENCH.y : BENCH2.y) + 1 : c.y, f: () => drawCust(c) });
    ents.push({ y: P.y, f: drawOwner });
    ents.sort((a, b) => a.y - b.y); for (const e of ents) e.f();
    for (const s of smoke) { ctx.fillStyle = 'rgba(' + (s.col || '90,90,100') + ',' + (s.t * (s.col ? 1.4 : .5)) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
    tintRoom();
    for (const f of flys) { if (f.t < 0) continue; if (ok('coin')) ctx.drawImage(IMG.coin, Math.round(f.x - 6), Math.round(f.y - 6), 12, 12); else { ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill(); } }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H); drawShop();
    for (const f of floats) txt(f.s, f.x, f.y, f.col, 12);
  }

  // ── 루프 ──
  function fit() { const s = Math.min(innerWidth / W, innerHeight / H); canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px'; document.body.classList.toggle('portrait', !skipRot && innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land')); }
  addEventListener('resize', fit); fit();
  let last = performance.now();
  function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  window.__cw = { tick(n) { for (let i = 0; i < (n || 1); i++) update(1 / 60); draw(); }, G, P, get S() { return S; }, get washers() { return washers; }, get custs() { return custs; }, get piles() { return piles; }, get puddles() { return puddles; }, get cash() { return cash; }, get flys() { return flys; }, tap, newGame, contGame, spawnCust, spawnJerk, openPanel, closePanel, dayEnd, renderPanel, checkBack, offline, layout, dropBack, loaded: () => loaded };
})();
