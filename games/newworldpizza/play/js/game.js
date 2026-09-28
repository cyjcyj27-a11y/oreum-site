/* 뉴월드피자(NEW WORLD PIZZA) — 게임 본체 (방치형 피자집 경영)
   리무진에서 세계 명사가 내려 피자를 사 간다. 사 가는 건 순수하게 피자뿐.
   가게 앞에 Anonymous 가 몰려들면 리무진이 서지 않고 지나간다 — 탭해서 쫓는다. */
(function () {
  'use strict';
  const EN = (() => { try { return new URLSearchParams(location.search).get('lang') === 'en'; } catch (_) { return false; } })();
  if (EN) { document.documentElement.lang = 'en'; document.title = 'NEW WORLD PIZZA — Oreum Games'; document.querySelectorAll('[data-en]').forEach(e => { e.innerHTML = e.getAttribute('data-en'); }); }
  const T = (ko, en) => EN ? en : ko;
  const $ = id => document.getElementById(id);
  const { W, H, L } = ART;
  const c = $('c'), ctx = c.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  c.width = W * DPR; c.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bgc = document.createElement('canvas'); bgc.width = W * DPR; bgc.height = H * DPR; const bgx = bgc.getContext('2d'); bgx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => Math.floor(n).toLocaleString('en-US');

  // ── 손님(세계 명사 12명). 이름은 어디에도 띄우지 않는다(사장님 9/28). 트뤼도는 빼고 빌 게이츠, 찰스·메르켈 빼고 샘 올트먼·젠슨 황(9/28 사장님) ──
  const MENU = ['cheese', 'pepperoni', 'margherita', 'hawaiian', 'supreme', 'truffle'];
  const PRICE = { cheese: 12, pepperoni: 15, margherita: 19, hawaiian: 24, supreme: 30, truffle: 44, kimchi: 28 };
  const PNAME = { cheese: ['치즈', 'Cheese'], pepperoni: ['페퍼로니', 'Pepperoni'], margherita: ['마르게리타', 'Margherita'], hawaiian: ['하와이안', 'Hawaiian'], supreme: ['수프림', 'Supreme'], truffle: ['트러플', 'Truffle'], kimchi: ['김치', 'Kimchi'] };
  // 해금 순서 = 지금+앞으로 10년 영향력이 작은 사람부터(Claude 의견, 사장님 9/28 "게임순서도 해금순으로")
  const CELEBS = [
    { id: 'hillary', fav: 'cheese', fame: 0, h: .96 }, { id: 'gates', fav: 'cheese', fame: 0, h: 1.02 },
    { id: 'macron', fav: 'pepperoni', fame: 20, h: 1 }, { id: 'kim', fav: 'pepperoni', fame: 60, h: .95 },
    { id: 'bezos', fav: 'margherita', fame: 120, h: 1 }, { id: 'zuck', fav: 'margherita', fame: 200, h: .98 },
    { id: 'putin', fav: 'hawaiian', fame: 300, h: .93 }, { id: 'sam', fav: 'hawaiian', fame: 420, h: .97 },
    { id: 'jensen', fav: 'supreme', fame: 560, h: .98 }, { id: 'musk', fav: 'supreme', fame: 720, h: 1.02 },
    { id: 'trump', fav: 'truffle', fame: 900, h: 1.05 }, { id: 'xi', fav: 'truffle', fame: 1100, h: 1 },
  ];
  const BYID = {}; CELEBS.forEach(cb => BYID[cb.id] = cb);
  const ANON_H = [1, .97, 1.06, .86];
  // 손 높이(발바닥에서 키의 몇 %) — 정면은 그림에서 팔이 다리보다 넓어지는 줄을 재서 씀, 걷기는 팔을 흔들어 가운데 값
  const HANDS = { trump: .25, musk: .25, zuck: .28, putin: .27, macron: .30, hillary: .27, gates: .29, kim: .31, jensen: 0.3, xi: .27, sam: 0.3, bezos: .27 };
  const HAND_WALK = .36;
  const DH = 188;                                   // 사람 키(픽셀)

  // ── 그림 불러오기 ──
  const IMG = {};
  function img(n) { if (!IMG[n]) { const im = new Image(); im.src = 'img/ppl/' + n + '.webp?v=5'; IMG[n] = im; } return IMG[n]; }
  CELEBS.forEach(cb => ['front', 'w1', 'w2'].forEach(p => img(cb.id + '_' + p))); [1, 2, 3, 4].forEach(i => img('anon' + i + '_front'));

  const SHOP = [
    { id: 'oven', ko: '화덕', en: 'OVEN', sk: '화덕 +1', se: 'Oven +1', max: 3, cost: lv => [250, 700, 1800][lv] },
    { id: 'speed', ko: '장작', en: 'FIREWOOD', sk: '굽는 속도', se: 'Bake faster', max: 5, cost: lv => [150, 400, 900, 1800, 3500][lv] },
    { id: 'menu', ko: '메뉴', en: 'MENU', sk: null, se: null, max: 4, cost: lv => [300, 800, 1800, 3800][lv] },
    { id: 'kimchi', ko: '김치피자', en: 'KIMCHI PIZZA', sk: '새 피자: 김치', se: 'New: Kimchi', max: 1, cost: () => 1200 },   // 사장님 9/28 — 누구의 단골 피자도 아니고, 열면 모든 손님이 가끔 시킨다
    { id: 'reg', ko: '금고', en: 'CASH BOX', sk: '동전통 크게', se: 'Bigger cash box', max: 4, cost: lv => [200, 600, 1500, 3600][lv] },
    { id: 'sign', ko: '네온 간판', en: 'NEON SIGN', sk: '리무진 더 자주', se: 'More limos', max: 5, cost: lv => [220, 520, 1100, 2400, 5000][lv] },
    { id: 'decor', ko: '인테리어', en: 'DECOR', sk: '팁 +15%', se: 'Tips +15%', max: 5, cost: lv => [300, 900, 2400, 6000, 14000][lv] },
    { id: 'blind', ko: '블라인드', en: 'BLINDS', sk: 'Anonymous 덜 옴', se: 'Fewer Anonymous', max: 3, cost: lv => [400, 1300, 3200][lv] },
    { id: 'auto', ko: '자동 금고', en: 'AUTO CASH', sk: '자동 수금', se: 'Auto collect', max: 1, cost: () => 4500 },
  ];

  // ── 상태 ──
  let S = null, custs = [], limos = [], anons = [], parts = [], flying = [], confetti = [], ovens = [];
  let playing = false, lastT = 0, spawnT = 3, anonT = 20, saveT = 0, gT = 0, panelTab = null, orderer = null, g20 = null, hiddenAt = 0;
  const menuLv = () => S.up.menu || 0;
  const menuHas = k => MENU.indexOf(k) < 2 + menuLv();
  const ovenCount = () => 1 + (S.up.oven || 0);
  const regCap = () => [60, 140, 300, 640, 1300][S.up.reg || 0];
  const bakeT = () => Math.max(2.2, 7 * Math.pow(.84, S.up.speed || 0));
  const tipMult = () => 1 + .15 * (S.up.decor || 0);
  const avail = () => CELEBS.filter(cb => S.fame >= cb.fame && menuHas(cb.fav));
  const seenN = () => S.seen.length;

  function newState() { return { coins: 0, fame: 0, time: 0, day: 1, t: Date.now(), reg: 0, up: {}, seen: [], visits: {}, aff: {}, gifts: [], stats: { served: 0, coins: 0, lost: 0, shoo: 0 }, ended: false, v: 1 }; }
  function save() { if (!S) return; S.t = Date.now(); try { localStorage.setItem('newworldpizza.save', JSON.stringify(S)); } catch (_) { } }
  function load() { try { const j = JSON.parse(localStorage.getItem('newworldpizza.save')); if (j && j.up) return j; } catch (_) { } return null; }

  // ── 화면 크기 ──
  // 화면 맞춤 — 게임 중엔 위쪽 상태바 띠와 오른쪽 단추 칸을 비워 두고 그 안에 그림을 둔다(UI 가 그림을 가리지 않게, mobile-first-ui-layout)
  function fit() {
    const vw = innerWidth, vh = innerHeight, on = document.body.classList.contains('playing') && !document.body.classList.contains('ended');
    const topH = 0, side = 0;   /* 그림은 화면 가득(사장님 9/28 "원래화면에서 단추를 줄여봐") — 대신 상태바·단추를 작게 */
    const aw = vw - side * 2, ah = vh - topH, r = Math.min(aw / W, ah / H), cw = Math.round(W * r), ch = Math.round(H * r);
    c.style.position = 'absolute'; c.style.width = cw + 'px'; c.style.height = ch + 'px';
    c.style.left = Math.round((vw - cw) / 2) + 'px'; c.style.top = Math.round(topH + (ah - ch) / 2) + 'px';
    const gap = vh - (topH + (ah - ch) / 2 + ch); $('keys').style.visibility = on && gap >= 24 ? 'visible' : 'hidden';   /* 키 안내는 그림 아래 빈 띠가 있을 때만 */
  }
  addEventListener('resize', fit); fit();
  function toCanvas(e) { const b = c.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * W, y: (e.clientY - b.top) / b.height * H }; }

  // ── 알림·HUD ──
  let toastT = null;
  function toast(txt, cls, sub) { const t = $('toast'); t.className = cls || ''; t.innerHTML = txt + (sub ? '<small>' + sub + '</small>' : ''); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }
  function nextFame() { const n = CELEBS.find(cb => cb.fame > S.fame); return n ? n.fame : null; }
  function hud() {
    $('dayN').textContent = 'DAY ' + S.day; $('coinN').textContent = fmt(S.coins);
    const nf = nextFame(), pf = [0, ...CELEBS.map(cb => cb.fame)].filter(f => f <= S.fame).pop() || 0;
    $('fameN').textContent = fmt(S.fame); $('fameBar').style.width = (nf ? clamp((S.fame - pf) / (nf - pf), 0, 1) * 100 : 100) + '%';
    $('guestN').textContent = seenN() + '/12';
    $('btnShop').classList.toggle('on', SHOP.some(it => (S.up[it.id] || 0) < it.max && S.coins >= it.cost(S.up[it.id] || 0)));
    $('btnAlbum').classList.toggle('new', S.seen.some(id => !(S.albumSeen || []).includes(id)));
  }

  // ── 입자 ──
  function sparkle(x, y, n, cols) { for (let i = 0; i < n; i++) parts.push({ x: x + rnd(-24, 24), y: y + rnd(-24, 10), vx: rnd(-60, 60), vy: rnd(-120, -30), life: rnd(.5, 1), age: 0, kind: 'star', s: rnd(3, 7), col: pick(cols || ['#fff', '#ffe08a', '#ffb02e']) }); }
  function smoke(x, y) { parts.push({ x: x + rnd(-6, 6), y, vx: rnd(-6, 6), vy: rnd(-40, -25), life: rnd(1.4, 2), age: 0, kind: 'smoke', s: rnd(8, 14) }); }
  function popText(x, y, txt, col, s) { parts.push({ x, y, vx: 0, vy: -46, life: 1.1, age: 0, kind: 'txt', txt, col: col || '#ffd24a', s: s || 22 }); }
  function flash(x, y) { parts.push({ x, y, vx: 0, vy: 0, life: .25, age: 0, kind: 'flash', s: 60 }); }
  function flyCoins(x, y, n) { for (let i = 0; i < n; i++) flying.push({ sx: x + rnd(-20, 20), sy: y + rnd(-10, 10), t: -i * .04, dur: .7 }); }

  // ── 사람 그리기 ──
  function person(id, x, y, o) {  // o: {pose:'front'|'walk', ph, dir, box, scale, alpha, shade}
    const isAnon = id.startsWith('anon');
    const hk = isAnon ? ANON_H[+id.slice(4) - 1] : (BYID[id] ? BYID[id].h : 1);
    let im;
    if (o.pose === 'walk' && !isAnon) im = img(id + (Math.floor(o.ph * 2) % 2 ? '_w2' : '_w1'));
    else im = img(id + '_front');
    if (!im.complete || !im.naturalWidth) return;
    const dh = DH * hk * (o.scale || 1) * (o.pose === 'walk' && !isAnon ? .97 : 1), dw = im.naturalWidth * dh / im.naturalHeight;
    const bob = o.pose === 'walk' ? Math.abs(Math.sin(o.ph * Math.PI * 2)) * 4 : Math.sin(gT * 2 + x * .01) * 1.2;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ART.ell(ctx, x, y, dw * .42, 8); ctx.fill();
    ctx.translate(x, y - bob);
    if (o.dir < 0) ctx.scale(-1, 1);
    if (isAnon && o.pose === 'walk') ctx.rotate(Math.sin(o.ph * Math.PI * 2) * .05);
    ctx.drawImage(im, -dw / 2, -dh, dw, dh);
    ctx.restore();
    if (o.box) {                                   // 상자는 손 높이(사장님 9/28 "손위치로") — 인물마다 손 자리를 재서 씀
      const hd = o.pose === 'walk' ? HAND_WALK : (HANDS[id] || .3);
      ART.box(ctx, x + (o.pose === 'walk' ? dw * .2 * (o.dir || 1) : 0), y - dh * hd - bob, 1.05);
    }
  }
  function nameTag(x, y, txt) {
    ctx.save(); ctx.font = "15px 'Ria', sans-serif"; const w = ctx.measureText(txt).width + 18;
    ART.rr(ctx, x - w / 2, y - 12, w, 24, 12); ctx.fillStyle = 'rgba(20,20,26,.82)'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 1); ctx.restore();
  }
  function bubble(x, y, kind, prog, danger, coin) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = danger ? '#ff4a4a' : '#1b2a5a'; ctx.lineWidth = 3;
    ART.rr(ctx, -30, -60, 60, 52, 16); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(0, 2); ctx.lineTo(8, -10); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(0, 2); ctx.lineTo(8, -9); ctx.stroke();
    if (coin) {                                   // 금고가 차서 못 냄 = 가운데 큰 동전 + 빨간 금지 표시
      const cy = -34; ART.ell(ctx, 0, cy + 2, 13, 13); ctx.fillStyle = '#b8861c'; ctx.fill();
      ART.ell(ctx, 0, cy, 13, 13); ctx.fillStyle = ART.hg(ctx, -13, 13, [[0, '#ffe794'], [.5, '#ffd24a'], [1, '#d49a1e']]); ctx.fill(); ctx.strokeStyle = '#9a7010'; ctx.lineWidth = 1.5; ctx.stroke();
      ART.ell(ctx, 0, cy, 7, 7); ctx.strokeStyle = 'rgba(154,112,16,.6)'; ctx.stroke();
      ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 4; ART.ell(ctx, 0, cy, 19, 19); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13.4, cy - 13.4); ctx.lineTo(13.4, cy + 13.4); ctx.stroke();
    }
    else ART.pizza(ctx, 0, -34, 17, kind, gT * .3);
    if (prog != null) { ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -34, 24, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = danger ? '#ff4a4a' : '#3fb03f'; ctx.beginPath(); ctx.arc(0, -34, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - prog)); ctx.stroke(); }
    ctx.restore();
  }

  // ── 걷기 ──
  function walkTo(o, tx, ty, spd, dt) { const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy); if (d < 2) { o.x = tx; o.y = ty; return true; } const st = Math.min(d, spd * dt); o.x += dx / d * st; o.y += dy / d * st; o.ph = (o.ph + dt * spd / 90) % 1; if (Math.abs(dx) > 1) o.dir = dx > 0 ? 1 : -1; return false; }
  function go(o, pts, next) { o.path = pts.map(p => ({ x: p.x, y: p.y })); o.next = next; o.state = 'path'; }
  function stepPath(o, spd, dt) { if (!o.path.length) { o.state = o.next; return true; } const p = o.path[0]; if (walkTo(o, p.x, p.y, spd, dt)) { o.path.shift(); if (!o.path.length) { o.state = o.next; return true; } } return false; }
  const DOOR_IN = { x: L.DOORX - 30, y: L.WALK_Y }, DOOR_OUT = { x: L.DOORX + 40, y: 690 };

  // ── 리무진 ──
  function limoArrive(cb, pickup) {
    const lm = { x: W + 260, stop: L.CURB, state: 'in', cb, pickup, door: 0, t: 0, drive: false };
    if (!pickup && idleAnons() >= 3) lm.drive = true;          // Anonymous 가 셋 넘게 진 치고 있으면 안 선다
    limos.push(lm); SND.play('honk'); return lm;
  }
  function tickLimo(lm, dt) {
    lm.t += dt;
    if (lm.state === 'in') {
      if (lm.drive) { lm.x -= 520 * dt; if (lm.x < L.CURB + 40 && !lm.flashed) { lm.flashed = true; anons.forEach(a => { if (a.state === 'idle') { a.flashT = .3; flash(a.x + 14, a.y - 150); } }); SND.play('shutter'); S.stats.lost++; popText(L.CURB, 560, '...', '#fff', 30); } if (lm.x < L.STREET - 280) lm.dead = true; return; }
      lm.x = Math.max(lm.stop, lm.x - 420 * dt * clamp((lm.x - lm.stop) / 120 + .15, 0, 1)); if (lm.x - lm.stop < 1) { lm.state = 'stop'; lm.t = 0; }
    } else if (lm.state === 'stop') {
      lm.door = clamp(lm.t / .3, 0, 1);
      if (!lm.pickup && lm.t > .35 && !lm.dropped) { lm.dropped = true; const cu = makeCust(lm.cb, lm.x + 44, L.ROAD_Y - 18); custs.push(cu); go(cu, [{ x: lm.x + 20, y: 670 }, DOOR_OUT, DOOR_IN], 'enter'); }
      if (!lm.pickup && lm.t > 1.4) { lm.state = 'out'; lm.t = 0; }
      if (lm.pickup && lm.boarded) { lm.state = 'out'; lm.t = 0; }
    } else if (lm.state === 'out') { lm.door = clamp(1 - lm.t / .25, 0, 1); lm.x -= 380 * dt * clamp(lm.t, .2, 1.4); if (lm.x < L.STREET - 300) lm.dead = true; }
  }

  // ── 손님 ──
  function makeCust(cb, x, y) { return { cb, id: cb.id, x, y, ph: 0, dir: -1, state: 'path', path: [], kind: S.up.kimchi && Math.random() < .25 ? 'kimchi' : cb.fav, wait: 0, oven: -1, box: false }; }
  function queued() { return custs.filter(cu => cu.state === 'queue' || (cu.state === 'path' && cu.next === 'queue')); }
  function queueSlotOf(cu) { return custs.filter(o => o.qn != null && o.qn < cu.qn && o.inLine).length; }
  let qCounter = 0;
  function tickCust(cu, dt) {
    const spd = 150;
    if (cu.tapCd > 0) cu.tapCd -= dt; if (cu.hop > 0) cu.hop -= dt;
    switch (cu.state) {
      case 'path': stepPath(cu, spd, dt); break;
      case 'enter': {                                      // 문 안에 들어옴 → 줄 서기
        if (!S.seen.includes(cu.id)) { S.seen.push(cu.id); toast('NEW GUEST', 'gold'); SND.play('fanfare'); sparkle(cu.x, cu.y - 120, 24); }
        cu.inLine = true; cu.qn = qCounter++; cu.state = 'queue'; break;
      }
      case 'queue': {
        cu.wait += dt;
        const k = queueSlotOf(cu);
        if (k === 0 && !orderer) { orderer = cu; cu.inLine = false; go(cu, [L.ORDER], 'order'); cu.wait = 0; break; }
        const p = L.QUEUE[Math.min(k, L.QUEUE.length - 1)]; walkTo(cu, p.x + (k >= L.QUEUE.length ? (k - L.QUEUE.length + 1) * 40 : 0), p.y, spd, dt);
        if (cu.wait > 50) leaveSad(cu); break;
      }
      case 'order': {                                      // 계산대 앞: 빈 화덕이 생기면 주문이 들어간다
        cu.wait += dt; cu.dir = -1;
        const k = ovens.findIndex((o, i) => i < ovenCount() && !o.cust);
        if (k >= 0 && cu.wait > .6) { const o = ovens[k]; o.cust = cu; o.kind = cu.kind; o.prog = 0; o.done = false; cu.oven = k; orderer = null; SND.play('order'); const busy = custs.filter(q => q !== cu && q.oven === k && (q.state === 'pay' || q.state === 'wait')).length; go(cu, [{ x: L.OVENS[k] + 20 - busy * 58, y: L.WAIT_Y + busy * 6 }], 'wait'); cu.wait = 0; break; }   // 앞 손님이 금고가 차서 아직 서 있으면 옆으로 비켜 선다
        if (cu.wait > 40) { orderer = null; leaveSad(cu); } break;
      }
      case 'wait': cu.dir = -1; if (cu.ready) { cu.ready = false; cu.box = true; cu.state = 'pay'; cu.wait = 0; } break;   // 화덕 앞에서 기다림 — 다 구워지면(걸어오는 사이 구워졌어도) 받아 간다
      case 'pay': {
        cu.wait += dt;
        if (cu.val == null) { cu.val = Math.round(PRICE[cu.kind] * tipMult() * rnd(.95, 1.12)); cu.tip = tipOf(cu); }
        const val = cu.val, tip = cu.tip;
        if (S.reg + val <= regCap()) { S.reg += val; S.stats.served++; S.fame += 2; S.visits[cu.id] = (S.visits[cu.id] || 0) + 1; popText(cu.x, cu.y - 220, '+' + val, '#ffd24a');
          if (tip > 0) { S.coins += tip; S.stats.coins += tip; S.stats.tips = (S.stats.tips || 0) + tip; flyCoins(cu.x, cu.y - 200, clamp(Math.round(tip / 8), 4, 14)); const big = tip >= PRICE[cu.kind] * 2; popText(cu.x + 10, cu.y - 262, 'TIP +' + fmt(tip), big ? '#ff8ad8' : '#8ef06a', big ? 34 : 24); if (big) { sparkle(cu.x, cu.y - 200, 24, ['#ffe08a', '#ff8ad8', '#fff']); SND.play('bigtip'); } }
          SND.play('coin'); flyReg(cu.x, cu.y - 100); leaveHappy(cu); }
        else if (cu.wait > 12) { S.stats.lost++; leaveSad(cu); }
        break;
      }
      case 'curb': {                                       // 인도 끝에서 리무진 기다림
        if (!cu.limo) { cu.limo = limoArrive(cu.cb, true); }
        if (cu.limo.state === 'stop' && cu.limo.door > .9) { go(cu, [{ x: cu.limo.x + 44, y: L.ROAD_Y - 18 }], 'board'); }
        break;
      }
      case 'board': cu.alpha = (cu.alpha == null ? 1 : cu.alpha) - dt * 4; if (cu.alpha <= 0) { cu.dead = true; if (cu.limo) cu.limo.boarded = true; } break;
    }
  }
  const coinFly = [];
  function flyReg(x, y) { coinFly.push({ sx: x, sy: y, t: 0 }); }
  function leaveHappy(cu) { cu.box = true; cu.oven = -1; go(cu, [{ x: cu.x, y: L.WALK_Y }, DOOR_IN, DOOR_OUT, { x: L.CURB - 60, y: 668 }], 'curb'); }
  function leaveSad(cu) { cu.sad = true; cu.oven = -1; cu.inLine = false; cu.box = false; SND.play('leave'); go(cu, [{ x: cu.x, y: L.WALK_Y }, DOOR_IN, DOOR_OUT, { x: L.CURB - 60, y: 668 }], 'curb'); }

  // ── 팁 스킬: 손님을 탭할수록 오른다(모에모에큥처럼). 손님마다 따로 쌓여 다음에 와도 남는다 ──
  const affOf = id => Math.min(100, (S.aff && S.aff[id]) || 0);
  function tipOf(cu) { const a = affOf(cu.id); return Math.random() * 100 < a ? Math.round(PRICE[cu.kind] * tipMult() * rnd(4, 6)) : 0; }   // 팁 스킬 % = 팁이 나올 확률, 나오면 거액(사장님 9/28 "자주 오는 손님일수록 팁 나올 확률")
  function tapCust(cu) {
    cu.hop = .22; if (!S.aff) S.aff = {};
    if ((cu.tapCd || 0) > 0 || affOf(cu.id) >= 100) { sparkle(cu.x, cu.y - 150, 3, ['#fff', '#ffe08a']); SND.play('tap'); return; }
    cu.tapCd = .18; S.aff[cu.id] = affOf(cu.id) + 1; const a = S.aff[cu.id];
    sparkle(cu.x, cu.y - 170, 6, ['#ffe08a', '#ff8ad8', '#fff']); popText(cu.x, cu.y - DH * BYID[cu.id].h - 30, 'TIP ' + a + '%', a >= 100 ? '#ff8ad8' : '#ffe08a', 18); SND.play('cheer');
    if (a % 10 === 0) { popText(cu.x, cu.y - DH * BYID[cu.id].h - 60, a >= 100 ? 'MAX' : 'SKILL UP', '#fff', 26); sparkle(cu.x, cu.y - 120, 18, ['#ffd24a', '#ff8ad8', '#8ef06a']); SND.play('lvup'); }
  }

  // ── 화덕 ──
  function initOvens() { ovens = L.OVENS.map(() => ({ cust: null, kind: null, prog: 0, fire: 0, done: false })); }
  function tickOven(o, i, dt) {
    o.fire = Math.max(0, o.fire - dt * 2);
    if (!o.cust) return;
    if (o.cust.dead || o.cust.state === 'curb' || o.cust.state === 'path' && o.cust.next === 'curb') { o.cust = null; o.kind = null; return; }
    o.prog += dt / bakeT();
    if (Math.random() < dt * 3) smoke(L.OVENS[i], L.OVEN_Y - L.OVEN_H - 24);
    if (o.prog >= 1) {                                    // 다 구움 → 상자에 담아 손님에게
      const cu = o.cust; o.cust = null; o.kind = null; o.prog = 0; SND.play('ding'); sparkle(L.OVENS[i], L.OVEN_Y - 90, 10);
      cu.ready = true;
    }
  }
  function tapOven(i) { const o = ovens[i]; if (!o.cust) { SND.play('tap'); return; } o.prog = Math.min(1, o.prog + .12); o.fire = 1; SND.play('fire'); sparkle(L.OVENS[i], L.OVEN_Y - 80, 5, ['#ffe27a', '#ffb02e', '#ff6a2a']); }

  // ── Anonymous ──
  const idleAnons = () => anons.filter(a => a.state === 'idle' || a.state === 'in').length;
  function spawnAnon() {
    const free = L.ANON.findIndex((p, i) => !anons.some(a => a.slot === i && a.state !== 'run'));
    if (free < 0) return;
    const k = 1 + Math.floor(Math.random() * 4), p = L.ANON[free];
    anons.push({ id: 'anon' + k, slot: free, x: W + 60, y: p.y, tx: p.x, ph: 0, dir: -1, state: 'in', flashT: 0, t: rnd(0, 3) });
  }
  function tickAnon(a, dt) {
    a.flashT = Math.max(0, a.flashT - dt);
    if (a.state === 'in') { if (walkTo(a, a.tx, a.y, 110, dt)) { a.state = 'idle'; a.dir = -1; } }
    else if (a.state === 'idle') {
      a.t -= dt;
      if (a.t <= 0) { a.t = rnd(2.5, 6); const near = custs.find(cu => cu.x > L.STREET - 40 && Math.abs(cu.x - a.x) < 260); if (near) { a.flashT = .3; flash(a.x - 10, a.y - 150); SND.play('shutter'); a.dir = near.x < a.x ? -1 : 1; } }
    } else if (a.state === 'run') { a.x += 520 * dt; a.ph = (a.ph + dt * 6) % 1; if (a.x > W + 80) a.dead = true; }
  }
  function shoo(a) { a.state = 'run'; a.dir = 1; S.stats.shoo++; SND.play('shoo'); popText(a.x, a.y - 210, 'OUT!', '#ff8a5a', 24); sparkle(a.x, a.y - 100, 6, ['#fff', '#ddd']); }

  // ── 금고 ──
  function collect() {
    if (S.reg <= 0) { SND.play('tap'); return; }
    const v = S.reg; S.reg = 0; S.coins += v; S.stats.coins += v; flyCoins(L.REG.x - 70, L.REG.y - 20, clamp(Math.round(v / 10), 3, 14)); popText(L.REG.x - 40, L.REG.y - 110, '+' + fmt(v), '#ffd24a', 28); SND.play('coins');
  }
  function collectGift(g) {
    const v = Math.round(PRICE[MENU[Math.min(5, 1 + menuLv())]] * ovenCount() * 3 * tipMult());
    S.coins += v; S.stats.coins += v; S.gifts.splice(S.gifts.indexOf(g), 1); flyCoins(g.x, g.y, 10); popText(g.x, g.y - 60, '+' + fmt(v), '#ffe08a', 30); sparkle(g.x, g.y - 20, 16); SND.play('fanfare');
  }

  // ── 진행 ──
  function tick(dt) {
    gT += dt; S.time += dt;
    const day = Math.floor(S.time / 180) + 1; if (day !== S.day) { S.day = day; toast('DAY ' + day); }
    if (!g20 && seenN() < 12) {
      spawnT -= dt;
      if (spawnT <= 0) {
        spawnT = 8 / (1 + .28 * (S.up.sign || 0)) * rnd(.7, 1.3);
        const inShop = custs.filter(cu => !cu.box && !cu.sad).length + limos.filter(l => !l.pickup && l.state === 'in').length;
        if (inShop < ovenCount() + 3) {
          const here = new Set(custs.map(cu => cu.id).concat(limos.map(l => l.cb.id)));
          const av = avail().filter(cb => !here.has(cb.id)); const fresh = av.filter(cb => !S.seen.includes(cb.id));
          if (av.length) limoArrive(fresh.length && Math.random() < .7 ? pick(fresh) : pick(av), false);
        }
      }
      anonT -= dt;
      if (anonT <= 0) { anonT = 16 * (1 + .45 * (S.up.blind || 0)) * rnd(.7, 1.3); spawnAnon(); }
    }
    limos.forEach(lm => tickLimo(lm, dt)); limos = limos.filter(l => !l.dead);
    custs.forEach(cu => tickCust(cu, dt)); custs = custs.filter(cu => !cu.dead);
    ovens.forEach((o, i) => tickOven(o, i, dt));
    anons.forEach(a => tickAnon(a, dt)); anons = anons.filter(a => !a.dead);
    if (S.up.auto && S.reg > 0 && (S.autoT = (S.autoT || 0) + dt) > 4) { S.autoT = 0; collect(); }
    parts.forEach(p => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === 'star') p.vy += 160 * dt; }); parts = parts.filter(p => p.age < p.life);
    flying.forEach(f => f.t += dt); flying = flying.filter(f => f.t < f.dur);
    coinFly.forEach(f => f.t += dt); for (let i = coinFly.length - 1; i >= 0; i--) if (coinFly[i].t > .5) coinFly.splice(i, 1);
    confetti.forEach(p => { p.y += p.vy * dt; p.x += Math.sin(gT * 3 + p.ph) * 30 * dt; p.r += dt * 3; }); confetti = confetti.filter(p => p.y < H + 20);
    if (g20) tickG20(dt);
    else if (!S.ended && seenN() >= 12 && custs.length === 0 && limos.length === 0) { S.g20wait = (S.g20wait || 0) + dt; if (S.g20wait > 2) startG20(); }
    saveT += dt; if (saveT > 5) { saveT = 0; save(); }
    hud();
  }

  // ── G20 (마지막 단체 주문) → 엔딩 ──
  function startG20() {
    g20 = { taps: 0, need: 40, prog: 0, t: 0, done: false }; anons.forEach(a => { if (a.state !== 'run') a.state = 'run'; });
    toast('G20', 'gold', T('단체 주문', 'GROUP ORDER')); SND.play('fanfare');
    CELEBS.forEach((cb, i) => { const cu = makeCust(cb, W + 80 + i * 70, 690); cu.g20 = true; cu.gx = 110 + (i % 6) * 150 + (i >= 6 ? 75 : 0); cu.gy = i < 6 ? 650 : 712; go(cu, [DOOR_OUT, DOOR_IN, { x: cu.gx, y: cu.gy }], 'g20'); custs.push(cu); });
  }
  function tickG20(dt) {
    g20.t += dt; custs.forEach(cu => { if (cu.state === 'g20') cu.dir = cu.x < 640 ? 1 : -1; });
    if (!g20.done && g20.t > 3) { g20.prog += dt / 45; if (Math.random() < dt * 4) sparkle(400, 400, 2, ['#ffe27a', '#ffb02e']); if (g20.prog >= 1) g20Done(); }   /* 가만히 둬도 45초면 구워진다 — 탭하면 빨리 */
    if (g20.done) { g20.end += dt; if (g20.end > 1.2 && !$('ending').classList.contains('show')) ending(); }
  }
  function tapG20() {
    if (g20.done) return; g20.taps++; g20.prog += 1 / g20.need; g20.pop = .15; SND.play('fire'); ovens.forEach((o, i) => { if (i < ovenCount()) o.fire = 1; }); sparkle(400, 380, 8, ['#ffe27a', '#ffb02e', '#ff6a2a']);
    if (g20.prog >= 1) g20Done();
  }
  function g20Done() { if (g20.done) return; g20.done = true; g20.prog = 1; g20.end = 0; SND.play('ding'); sparkle(400, 420, 60); custs.forEach(cu => cu.box = true); fwOn = true; for (let i = 0; i < 6; i++) setTimeout(() => rocket(), i * 160); }
  function ending() {
    S.ended = true; save(); SND.play('ending'); try { if (window.OG) OG.over({ result: 'END', score: S.coins + S.reg }); } catch (_) { }
    $('endDay').textContent = S.day; $('endCoin').textContent = fmt(S.coins + S.reg); $('ending').classList.add('show'); document.body.classList.add('ended'); fit();
    for (let i = 0; i < 180; i++) confetti.push({ x: rnd(0, W), y: rnd(-700, -10), vy: rnd(60, 150), r: rnd(0, 6), ph: rnd(0, 6), col: pick(['#ffd24a', '#ff6a5a', '#7fd6ff', '#8ef06a', '#fff', '#b07aff']) });
  }

  // ── 폭죽(엔딩) — 꼬리 달고 올라가 여러 색으로 터지고 천천히 떨어진다 ──
  let fwOn = false, fwT = 0, rockets = [], sparks = [];
  const FW_COLS = [['#ffd24a', '#fff3b0'], ['#ff5a6a', '#ffc0c8'], ['#7fd6ff', '#e0f6ff'], ['#8ef06a', '#e6ffd8'], ['#c08aff', '#f0e0ff'], ['#ff9a3a', '#ffe0b8']];
  function rocket() { rockets.push({ x: rnd(140, 1140), y: H + 10, vy: -rnd(620, 760), ty: rnd(70, 300), col: pick(FW_COLS) }); SND.play('whistle'); }
  function explode(x, y, col) {
    const n = 70 + Math.floor(Math.random() * 30), sp = rnd(160, 260), ring = Math.random() < .35;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd(-.05, .05), v = ring ? sp : sp * rnd(.35, 1); sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(1.2, 2), age: 0, col: Math.random() < .7 ? col[0] : col[1], s: rnd(2.8, 4.4) }); }
    sparks.push({ x, y, vx: 0, vy: 0, life: .35, age: 0, flash: true, s: 120 }); SND.play('boom');
  }
  function fwTick(dt) {
    if (fwOn) { fwT -= dt; if (fwT <= 0) { fwT = rnd(.35, .8); rocket(); if (Math.random() < .3) setTimeout(rocket, 120); } }
    rockets.forEach(r => { r.y += r.vy * dt; r.vy += 220 * dt; if (Math.random() < .8) sparks.push({ x: r.x + rnd(-2, 2), y: r.y + 6, vx: rnd(-15, 15), vy: rnd(20, 60), life: .45, age: 0, col: '#fff3c0', s: 1.8 }); if (r.y <= r.ty || r.vy > -60) { r.dead = true; explode(r.x, r.y, r.col); } }); rockets = rockets.filter(r => !r.dead);
    sparks.forEach(p => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.25, dt); p.vy = p.vy * Math.pow(.25, dt) + 90 * dt; }); sparks = sparks.filter(p => p.age < p.life);
  }
  function fwDraw() {
    if (!rockets.length && !sparks.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    sparks.forEach(p => { const a = 1 - p.age / p.life; if (p.flash) { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.s); g.addColorStop(0, 'rgba(255,255,230,' + (.8 * a) + ')'); g.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); return; }
      ctx.globalAlpha = a * (p.age > p.life * .6 && Math.random() < .3 ? .3 : 1); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (.6 + .4 * a), 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1; rockets.forEach(r => { ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  // ── 그리기 ──
  function draw() {
    ctx.drawImage(bgc, 0, 0, W, H);
    ART.neon(ctx, gT, EN);
    // 화덕
    L.OVENS.forEach((ox, i) => { const o = ovens[i] || {}; ART.oven(ctx, ox, L.OVEN_Y, { lock: i >= ovenCount(), fire: o.fire, kind: o.kind, t: gT + i }); if (o.cust) drawOvenBar(ox, o.prog); });
    ART.counter(ctx);
    ART.register(ctx, S.reg, regCap(), gT, custs.some(cu => cu.state === 'pay' && cu.wait > .4));   // 빨간 테 = 금고가 차서 손님이 돈을 못 내고 서 있음
    S.gifts.forEach(g => { ctx.save(); ctx.translate(g.x, g.y); const b = Math.sin(gT * 4) * 2; ART.rr(ctx, -22, -18 + b, 44, 28, 4); ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.strokeStyle = '#a8801a'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-22, -18 + b); ctx.lineTo(0, -2 + b); ctx.lineTo(22, -18 + b); ctx.stroke(); ctx.fillStyle = '#d8382a'; ART.ell(ctx, 0, -2 + b, 5, 5); ctx.fill(); ctx.restore(); });
    if (g20) drawGiant();
    // 사람·리무진·Anonymous 를 y 순서로
    const items = [];
    custs.forEach(cu => items.push({ y: cu.y, f: () => {
      const walking = cu.state === 'path' || (cu.state === 'queue' && Math.abs(cu.x - (L.QUEUE[Math.min(queueSlotOf(cu), 2)] || L.QUEUE[0]).x) > 3);
      const hopY = cu.hop > 0 ? Math.sin((1 - cu.hop / .22) * Math.PI) * 14 : 0;
      person(cu.id, cu.x, cu.y - hopY, { pose: walking ? 'walk' : 'front', ph: cu.ph, dir: walking ? cu.dir : 1, box: cu.box, alpha: cu.alpha });
      if (cu.state === 'order') bubble(cu.x + 44, cu.y - DH * BYID[cu.id].h - 12, cu.kind, cu.wait / 40, cu.wait > 26);
      if (cu.state === 'pay' && cu.wait > .4) bubble(cu.x, cu.y - DH * BYID[cu.id].h - 12, cu.kind, null, true, true);
    } }));
    limos.forEach(lm => items.push({ y: L.ROAD_Y + 2, f: () => { ctx.save(); ctx.beginPath(); ctx.rect(L.DOORX + 12, 0, W, H); ctx.clip(); ART.limo(ctx, lm.x, L.ROAD_Y, .82, lm.door); ctx.restore(); } }));   // 가게 벽 뒤로 사라지게(안을 가로지르지 않게)
    anons.forEach(a => items.push({ y: a.y, f: () => { person(a.id, a.x, a.y, { pose: a.state === 'run' || a.state === 'in' ? 'walk' : 'front', ph: a.ph, dir: a.dir }); if (a.state !== 'run' && a.slot < 3) nameTag(a.x, a.y - DH * ANON_H[+a.id.slice(4) - 1] - 18, 'Anonymous');   /* 명찰은 앞줄 셋만(뒷줄은 겹쳐서) */ } }));
    if (g20 && g20.done) { const k = Math.min(1, (g20.nightT = (g20.nightT || 0) + 1 / 60) / 1.2); ctx.fillStyle = 'rgba(12,10,40,' + (.55 * k) + ')'; ctx.fillRect(0, 0, W, H); }   /* 엔딩 — 가게만 밤처럼 어둡게(사람은 밝게), 폭죽이 보이게 */
    items.sort((a, b) => a.y - b.y).forEach(it => it.f());
    // 입자
    parts.forEach(p => {
      const a = 1 - p.age / p.life; ctx.globalAlpha = a;
      if (p.kind === 'star') { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * .6, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 'smoke') { ctx.globalAlpha = a * .35; ctx.fillStyle = '#e8e2da'; ART.ell(ctx, p.x, p.y, p.s * (1 + p.age), p.s * (1 + p.age)); ctx.fill(); }
      else if (p.kind === 'flash') { const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.s); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); }
      else if (p.kind === 'txt') { ctx.font = p.s + "px 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#1b2a5a'; ctx.strokeText(p.txt, p.x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x, p.y); }
    });
    ctx.globalAlpha = 1;
    coinFly.forEach(f => { const k = f.t / .5, x = f.sx + (L.REG.x - 70 - f.sx) * k, y = f.sy + (L.REG.y - 20 - f.sy) * k - Math.sin(k * Math.PI) * 60; ART.coins(ctx, x, y, 1, gT); });
    flying.forEach(f => { if (f.t < 0) return; const k = f.t / f.dur, e = k * k * (3 - 2 * k); const x = f.sx + (250 - f.sx) * e, y = f.sy + (26 - f.sy) * e - Math.sin(k * Math.PI) * 90; ART.coins(ctx, x, y, 1, gT); });
    confetti.forEach(p => { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.fillRect(-5, -3, 10, 6); ctx.restore(); });
    fwDraw();
  }
  function drawOvenBar(ox, p) {
    const w = 96, x = ox - w / 2, y = L.OVEN_Y - 150;
    ART.rr(ctx, x - 3, y - 3, w + 6, 18, 9); ctx.fillStyle = '#1b2a5a'; ctx.fill();
    ART.rr(ctx, x, y, w, 12, 6); ctx.fillStyle = '#3a4a74'; ctx.fill();
    ART.rr(ctx, x, y, Math.max(12, w * p), 12, 6); ctx.fillStyle = ART.hg(ctx, x, x + w, [[0, '#ffe066'], [1, '#ff8416']]); ctx.fill();
  }
  function drawGiant() {
    const cx = 400, cy = 440, beat = g20.done ? 0 : .04 * Math.max(0, Math.sin(gT * 7)) + (g20.pop > 0 ? g20.pop * .5 : 0), r = (150 + 30 * g20.prog) * (1 + beat);
    if (g20.pop > 0) g20.pop -= 1 / 60;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .42); ART.pizza(ctx, 0, 0, r, 'supreme', 0); ctx.restore();
    if (!g20.done) { const w = 300; ART.rr(ctx, cx - w / 2 - 4, cy - 110, w + 8, 24, 12); ctx.fillStyle = '#1b2a5a'; ctx.fill(); ART.rr(ctx, cx - w / 2, cy - 106, Math.max(16, w * Math.min(1, g20.prog)), 16, 8); ctx.fillStyle = ART.hg(ctx, cx - w / 2, cx + w / 2, [[0, '#ffe066'], [1, '#ff8416']]); ctx.fill();
      const k = .5 + .5 * Math.sin(gT * 6); ctx.save(); ctx.translate(cx, cy - 150); ctx.scale(1 + k * .12, 1 + k * .12);   /* TAP — 탭하라는 표준 표시 */
      ctx.font = "900 56px 'TitleF', 'Ria', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = '#1b2a5a'; ctx.strokeText('TAP', 0, 0); ctx.fillStyle = k > .5 ? '#ffd24a' : '#fff'; ctx.fillText('TAP', 0, 0); ctx.restore(); }
  }

  // ── 입력 ──
  function tap(x, y) {
    if (!playing) return;
    if (g20) { if (!g20.done) tapG20(); return; }
    for (const g of S.gifts) if (Math.hypot(x - g.x, y - g.y) < 40) { collectGift(g); return; }
    if (Math.hypot(x - (L.REG.x - 40), y - (L.REG.y - 40)) < 80) { collect(); return; }
    { let best = null, bd = 1e9; for (const cu of custs) { if (cu.state === 'board' || cu.state === 'curb') continue; const h = DH * BYID[cu.id].h; if (Math.abs(x - cu.x) < 48 && y > cu.y - h - 10 && y < cu.y + 8) { const d = Math.abs(x - cu.x) + Math.abs(y - (cu.y - h / 2)) * .3; if (d < bd) { bd = d; best = cu; } } } if (best) { tapCust(best); return; } }
    for (const a of anons) if (a.state !== 'run' && Math.abs(x - a.x) < 50 && y > a.y - DH - 30 && y < a.y + 10) { shoo(a); return; }
    for (let i = 0; i < ovenCount(); i++) if (Math.abs(x - L.OVENS[i]) < L.OVEN_W / 2 + 6 && y > L.OVEN_Y - L.OVEN_H - 40 && y < L.OVEN_Y) { tapOven(i); return; }
    for (let i = ovenCount(); i < L.OVENS.length; i++) if (Math.abs(x - L.OVENS[i]) < L.OVEN_W / 2 && y > L.OVEN_Y - L.OVEN_H && y < L.OVEN_Y) { openPanel('shop'); return; }
    SND.play('tap');
  }
  c.addEventListener('pointerdown', e => { if (e.button && e.button !== 0) return; SND.init(); const p = toCanvas(e); tap(p.x, p.y); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePanel(); closeAsk(false); return; }
    if ($('ask').classList.contains('show') && e.key === 'Enter') { closeAsk(true); return; }
    if (!playing) return; const k = e.key.toLowerCase();
    if (k === 'b') openPanel('shop'); else if (k === 'a') openPanel('album'); else if (k === ' ') { e.preventDefault(); collect(); }
    else if (k === 'm') $('btnBgm').classList.toggle('off', !SND.toggleBgm()); else if (k === 'k') $('btnSfx').classList.toggle('off', !SND.toggleSfx());
  });
  $('btnBgm').onclick = () => { SND.init(); $('btnBgm').classList.toggle('off', !SND.toggleBgm()); };
  $('btnSfx').onclick = () => { SND.init(); $('btnSfx').classList.toggle('off', !SND.toggleSfx()); };
  $('btnBgm').classList.toggle('off', !SND.bgm); $('btnSfx').classList.toggle('off', !SND.sfx);
  $('btnShop').onclick = () => openPanel('shop'); $('btnAlbum').onclick = () => openPanel('album');
  $('btnClose').onclick = closePanel; $('tabs').querySelectorAll('button').forEach(b => b.onclick = () => openPanel(b.dataset.tab));

  // ── 확인 창(브라우저 confirm 대신) ──
  let askCb = null;
  function ask(title, txt, cb) { $('askT').textContent = title; $('askP').textContent = txt; askCb = cb; $('ask').classList.add('show'); }
  function closeAsk(ok) { if (!$('ask').classList.contains('show')) return; $('ask').classList.remove('show'); const f = askCb; askCb = null; if (ok && f) f(); }
  $('askOk').onclick = () => closeAsk(true); $('askNo').onclick = () => closeAsk(false); $('ask').onclick = e => { if (e.target === $('ask')) closeAsk(false); };

  // ── 창(상점·도감) ──
  function iconCanvas(id, lv) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const x = cv.getContext('2d');
    x.translate(64, 64);
    if (id === 'oven' || id === 'speed') { x.scale(.52, .52); ART.oven(x, 0, 118, { fire: id === 'speed' ? 1 : .35, t: 1, kind: id === 'oven' ? 'pepperoni' : null }); }
    else if (id === 'menu') { ART.pizza(x, 0, 0, 52, MENU[Math.min(5, 2 + lv)], 0); }
    else if (id === 'kimchi') { ART.pizza(x, 0, 0, 52, 'kimchi', 0); }
    else if (id === 'reg') { x.scale(1.9, 1.9); ART.coins(x, 0, 16, 8, 0); }
    else if (id === 'auto') { x.scale(1.5, 1.5); ART.coins(x, 0, 30, 4, 0); x.fillStyle = '#7fd6ff'; ART.rr(x, -26, -34, 52, 40, 10); x.fill(); x.strokeStyle = '#1b2a5a'; x.lineWidth = 4; x.stroke(); x.fillStyle = '#1b2a5a'; ART.ell(x, -11, -14, 5, 5); x.fill(); ART.ell(x, 11, -14, 5, 5); x.fill(); x.fillRect(-2, -44, 4, 10); ART.ell(x, 0, -46, 5, 5); x.fill(); }
    else if (id === 'sign') { x.fillStyle = '#3a1450'; ART.rr(x, -58, -52, 116, 104, 16); x.fill(); x.shadowColor = '#ffcf4a'; x.shadowBlur = 14; ART.logo(x, 0, -2, 40); }
    else if (id === 'decor') { x.fillStyle = '#4a2a16'; ART.rr(x, -46, -56, 92, 112, 10); x.fill(); x.fillStyle = '#fff8e0'; ART.rr(x, -38, -48, 76, 96, 6); x.fill(); ART.pizza(x, 0, 0, 30, 'truffle', 0); }
    else if (id === 'blind') { x.fillStyle = '#d8d0c0'; for (let i = 0; i < 6; i++) { ART.rr(x, -52, -56 + i * 19, 104, 14, 5); x.fill(); } x.fillStyle = '#8a8478'; x.fillRect(-2, -60, 4, 120); }
    return cv;
  }
  function openPanel(tab) {
    if (!S) return; panelTab = tab; $('panel').classList.add('show');
    $('tabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    renderPanel(); SND.play('pop');
  }
  function closePanel() { panelTab = null; $('panel').classList.remove('show'); }
  function renderPanel() {
    const B = $('pBody'); B.innerHTML = ''; $('pMoney').textContent = fmt(S.coins);
    if (panelTab === 'shop') {
      const g = document.createElement('div'); g.className = 'shop';
      SHOP.forEach(it => {
        const lv = S.up[it.id] || 0, max = lv >= it.max, cost = max ? 0 : it.cost(lv), can = !max && S.coins >= cost;
        const sub = it.id === 'menu' ? (max ? T('전부 열림', 'All open') : T('새 피자: ', 'New: ') + T(PNAME[MENU[2 + lv]][0], PNAME[MENU[2 + lv]][1])) : T(it.sk, it.se);
        const d = document.createElement('div'); d.className = 'item' + (max ? ' max' : can ? '' : ' no');
        d.innerHTML = '<div class="ic"></div><div class="n">' + T(it.ko, it.en) + '<small>' + sub + '</small><div class="lvrow"><span class="lv">' + (it.max > 1 ? 'LV ' + lv + '/' + it.max : (lv ? 'OK' : '')) + '</span><span class="p">' + (max ? 'MAX' : '<i class="cn"></i>' + fmt(cost)) + '</span></div></div>';   /* 가격은 LV 와 같은 맨 아래 줄 오른쪽(9/28 가격 잘림·겹침) */
        d.querySelector('.ic').appendChild(iconCanvas(it.id, lv));
        d.onclick = () => { if (max) return; if (S.coins < cost) { SND.play('no'); return; } S.coins -= cost; S.up[it.id] = lv + 1; SND.play('buy'); if (it.id === 'menu' || it.id === 'decor' || it.id === 'kimchi') rebuildBg(); if (it.id === 'oven') sparkle(L.OVENS[ovenCount() - 1], L.OVEN_Y - 100, 20); renderPanel(); hud(); save(); };
        g.appendChild(d);
      });
      B.appendChild(g);
    } else if (panelTab === 'album') {
      const g = document.createElement('div'); g.className = 'album';
      S.albumSeen = S.seen.slice();
      CELEBS.forEach(cb => {
        const seen = S.seen.includes(cb.id), d = document.createElement('div'); d.className = 'card' + (seen ? '' : ' none');
        const cv = document.createElement('canvas'); cv.width = 240; cv.height = 280; const x = cv.getContext('2d');
        const im = img(cb.id + '_front');
        const draw = () => { x.clearRect(0, 0, 240, 280); const h = 250, w = im.naturalWidth * h / im.naturalHeight; x.drawImage(im, 120 - w / 2, 272 - h, w, h); if (!seen) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#1b2a5a'; x.fillRect(0, 0, 240, 280); x.globalCompositeOperation = 'source-over'; } };
        if (im.complete) draw(); else im.onload = draw;
        d.appendChild(cv);
        const f = document.createElement('div'); f.className = 'fav';
        if (seen) { const pc = document.createElement('canvas'); pc.width = 64; pc.height = 64; ART.pizza(pc.getContext('2d'), 32, 32, 26, cb.fav, 0); f.appendChild(pc); f.insertAdjacentHTML('beforeend', '<b>' + (S.visits[cb.id] || 0) + '</b>'); const tb = document.createElement('div'); tb.className = 'tipbar'; tb.innerHTML = '<span>TIP</span><i><u style="width:' + affOf(cb.id) + '%"></u></i><em>' + affOf(cb.id) + '%</em>'; d.appendChild(f); d.appendChild(tb); g.appendChild(d); return; }
        else f.innerHTML = '<b>?</b>';
        d.appendChild(f); g.appendChild(d);
      });
      B.appendChild(g);
    }
    hud();
  }
  function rebuildBg() { bgx.clearRect(0, 0, W, H); ART.background(bgx, S, EN); }

  // ── 오프라인 보상: 시간 안 봄, 화덕마다 한 판 + 밀린 Anonymous + 15% 선물 ──
  function offline(sec) {
    if (sec < 20 * 60 || S.ended) return false;
    const kinds = MENU.filter(menuHas).concat(S.up.kimchi ? ['kimchi'] : []); let v = 0;
    for (let i = 0; i < ovenCount(); i++) v += Math.round(PRICE[pick(kinds)] * tipMult() * 2);
    S.reg = Math.min(regCap(), S.reg + v);
    for (let i = 0; i < 4; i++) { spawnAnon(); const a = anons[anons.length - 1]; if (a) { a.x = a.tx; a.state = 'idle'; } }
    if (Math.random() < .15 && S.gifts.length < 2) S.gifts.push({ x: 560, y: L.COUNTER.top - 2 });
    toast('WELCOME BACK', 'gold'); SND.play('honk'); return true;
  }

  // ── 시작·이어하기 ──
  function begin(state) {
    S = state; custs = []; limos = []; anons = []; parts = []; flying = []; orderer = null; g20 = null; initOvens();
    rebuildBg(); $('title').classList.add('hide'); document.body.classList.add('playing'); $('topbar').classList.add('show'); $('keys').classList.add('show'); fit();
    playing = true; spawnT = 1.5; anonT = 25; SND.init(); hud(); save();
    try { if (window.OG) OG.start(); } catch (_) { }   /* 사이트 지표: 한 판 시작 */
  }
  function newGame() { const old = load(); const go2 = () => { try { localStorage.removeItem('newworldpizza.save'); } catch (_) { } begin(newState()); }; if (old && !old.ended) ask('NEW GAME', T('저장된 가게를 지우고 새로 시작할까요?', 'Delete the saved shop and start over?'), go2); else go2(); }
  function contGame() { const st = load(); if (!st || st.ended) return newGame(); const away = (Date.now() - (st.t || Date.now())) / 1000; begin(st); offline(away); }
  $('btnNew').onclick = newGame; $('btnCont').onclick = contGame;
  $('endGo').onclick = () => { try { localStorage.removeItem('newworldpizza.save'); } catch (_) { } location.reload(); };
  document.addEventListener('visibilitychange', () => { if (!S) return; if (document.hidden) { save(); hiddenAt = Date.now(); } else if (hiddenAt) { offline((Date.now() - hiddenAt) / 1000); hiddenAt = 0; lastT = performance.now(); } });

  // ── 타이틀 장면(실제 가게) ──
  const demoS = newState(); demoS.up = { menu: 2, decor: 2, oven: 1 };
  const titleCast = [{ id: 'trump', x: 300, y: 690 }, { id: 'putin', x: 470, y: 700 }, { id: 'macron', x: 640, y: 694 }, { id: 'kim', x: 800, y: 704 }];
  function drawTitle(t) {
    gT = t;
    if (!S) { S = demoS; S.reg = 36; }
    ctx.drawImage(bgc, 0, 0, W, H); ART.neon(ctx, t, EN);
    L.OVENS.forEach((ox, i) => ART.oven(ctx, ox, L.OVEN_Y, { lock: i >= 2, fire: .5 + .5 * Math.sin(t * 2 + i), kind: i === 0 ? 'pepperoni' : null, t: t + i }));
    ART.counter(ctx); ART.register(ctx, 36, 60, t, false);
    ctx.save(); ctx.beginPath(); ctx.rect(L.DOORX + 12, 0, W, H); ctx.clip(); ART.limo(ctx, L.CURB, L.ROAD_Y, .82, 0); ctx.restore();
    titleCast.forEach((p, i) => person(p.id, p.x, p.y, { pose: 'front', box: i % 2 === 0 }));
    person('anon2', 1060, 620, { pose: 'front' }); nameTag(1060, 620 - DH * ANON_H[1] - 18, 'Anonymous');
    if (S === demoS) S = null;
  }

  // ── 루프 ──
  function frame(now) {
    const dt = Math.min(.05, (now - lastT) / 1000 || 0); lastT = now;
    if (playing) { const endOn = $('ending').classList.contains('show'); if (!panelTab && !$('ask').classList.contains('show') && !endOn) tick(dt); else { gT += dt; if (endOn) { confetti.forEach(p => { p.y += p.vy * dt; p.x += Math.sin(gT * 3 + p.ph) * 30 * dt; p.r += dt * 3; }); confetti = confetti.filter(p => p.y < H + 20); } } fwTick(dt); draw(); } else drawTitle(now / 1000);
    requestAnimationFrame(frame);
  }
  (function init() {
    ART.background(bgx, demoS, EN);
    const st = load();
    if (st && !st.ended) { $('btnCont').hidden = false; }
    const touch = matchMedia('(pointer: coarse)').matches; if (touch) document.body.classList.add('touch');
    const setPort = () => document.body.classList.toggle('portrait', innerHeight > innerWidth); setPort(); addEventListener('resize', setPort);
    $('rotGo').onclick = () => { if (window.OL && OL.go) OL.go(); };
    $('rotSkip').onclick = e => { e.preventDefault(); document.body.classList.remove('touch'); };
    if (document.fonts) { document.fonts.load("20px 'Ria'").then(() => { if (!S) ART.background(bgx, demoS, EN); else rebuildBg(); }).catch(() => { }); document.fonts.load("30px 'TitleF'").catch(() => { }); }
    requestAnimationFrame(t => { lastT = t; frame(t); });
  })();

  // 시험 손잡이
  window.__as = {
    get S() { return S; }, get custs() { return custs; }, get limos() { return limos; }, get anons() { return anons; }, get ovens() { return ovens; }, get g20() { return g20; }, fwTick, get fw() { return { on: fwOn, rockets: rockets.length, sparks: sparks.length }; },
    tick, draw, drawTitle, tap, person, ctx, nameTag, bgc, W, H, collect, newGame, contGame, begin, newState, offline, openPanel, closePanel, spawnAnon, startG20, SHOP, CELEBS,
    run(n, dt) { for (let i = 0; i < n; i++) tick(dt || 1 / 30); draw(); },
    buy(id) { const it = SHOP.find(s => s.id === id), lv = S.up[id] || 0; if (lv >= it.max || S.coins < it.cost(lv)) return false; S.coins -= it.cost(lv); S.up[id] = lv + 1; if (id === 'menu' || id === 'decor' || id === 'kimchi') rebuildBg(); return true; },
    shot(name) { return fetch('/save?name=' + name, { method: 'POST', body: c.toDataURL('image/png') }).then(r => r.text()); },
  };
})();
