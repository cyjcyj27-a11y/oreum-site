// 수제버거 — 손님마다 다른 주문(익힘·빼기·추가·소스)대로 굽고 쌓아서 판다
(function () {
  var KEY = 'burger.prog';
  var cv = document.getElementById('cv'), g = cv.getContext('2d');
  var VW = 1600, VH = 820;
  var BUB = 5;                                          // 손님 말풍선이 떠 있는 시간(초)
  var PI = Math.PI;

  // ---------- 재료·메뉴 ----------
  var TOPS = ['cheese', 'lettuce', 'tomato', 'onion', 'pickle', 'bacon', 'egg', 'jalapeno', 'avocado'];
  var SAUCES = ['ketchup', 'mustard', 'mayo', 'bulgogi', 'sriracha'];
  var PATTY = { beef: 1, chicken: 1, shrimp: 1 };
  var MENUS = [
    { day: 1, price: 30, L: ['beef', 'ketchup', 'pickle', 'onion'] },
    { day: 2, price: 38, L: ['beef', 'cheese', 'ketchup', 'pickle'] },
    { day: 3, price: 45, L: ['beef', 'bulgogi', 'lettuce', 'mayo'] },
    { day: 4, price: 55, L: ['beef', 'cheese', 'bacon', 'lettuce', 'tomato', 'mayo'] },
    { day: 5, price: 65, L: ['beef', 'cheese', 'beef', 'cheese', 'ketchup', 'pickle', 'onion'] },
    { day: 6, price: 60, L: ['beef', 'egg', 'cheese', 'lettuce', 'mayo'] },
    { day: 7, price: 70, fry: 1, L: ['shrimp', 'lettuce', 'tomato', 'mayo'] },
    { day: 8, price: 70, fry: 1, L: ['chicken', 'pickle', 'lettuce', 'mayo'] },
    { day: 9, price: 75, L: ['beef', 'cheese', 'jalapeno', 'onion', 'sriracha'] },
    { day: 11, price: 85, L: ['beef', 'avocado', 'tomato', 'lettuce', 'mayo'] },
    { day: 13, price: 110, L: ['beef', 'cheese', 'bacon', 'egg', 'onion', 'bulgogi'] },
    { day: 15, price: 200, L: ['beef', 'cheese', 'beef', 'cheese', 'beef', 'cheese', 'bacon', 'egg', 'lettuce', 'tomato', 'onion', 'pickle', 'ketchup', 'mayo'] }
  ];
  var ZONE = { rare: [0.5, 0.8], medium: [0.8, 1.08], well: [1.08, 1.36], fry: [0.8, 1.25] };
  var UP = [
    { id: 'grill', ic: '🔥', cost: [200, 600, 1500, 3800] },
    { id: 'heat', ic: '♨️', cost: [250, 750, 1900, 4500, 10000] },
    { id: 'fryer', ic: '🍟', cost: [900] },
    { id: 'basket', ic: '🧺', cost: [1800], req: 'fryer' },
    { id: 'wait', ic: '🪑', cost: [300, 900, 2200, 5500, 12000] },
    { id: 'sign', ic: '🪧', cost: [500, 1500, 3800, 9000, 20000] }
  ];
  var RANK_AT = [0, 3000, 12000, 40000, 120000];

  // ---------- 자리 (가상 좌표 1600×820) ----------
  var LAY = {
    tick: { x: 262, y: 92, w: 290, h: 210, gap: 12 },
    raw: ['beef', 'chicken', 'shrimp', 'potato'].map(function (k, i) { return { k: k, x: 18, y: 320 + i * 120, w: 180, d: 92, lip: 16 }; }),
    fryer: { x: 215, y: 330, w: 260, d: 270, front: 190 },
    baskets: [{ x: 288, y: 470, w: 96, d: 200 }, { x: 402, y: 470, w: 96, d: 200 }],
    warmer: { x: 222, y: 615, w: 246, d: 80, lip: 14 },
    grill: { x: 490, y: 340, w: 400, d: 280, front: 80 },
    slots: [0, 1, 2, 3, 4, 5].map(function (i) { return { x: 557 + (i % 3) * 133, y: 410 + Math.floor(i / 3) * 120 }; }),
    trash: { x: 814, y: 708, w: 64, h: 86 },
    buns: { x: 935, y: 324, w: 320, d: 104 },
    boards: [{ x: 1003, y: 716, rx: 98, ry: 42 }, { x: 1190, y: 716, rx: 98, ry: 42 }],
    R: 80,
    // 손님 둘 — 왼쪽 카드는 왼쪽 도마, 오른쪽 카드는 오른쪽 도마. 레시피를 펼쳐 보인다
    cards: [{ x: 18, y: 92, w: 1380, h: 100 }, { x: 18, y: 198, w: 1380, h: 100 }],
    queue: { x: 1408, y: 92, w: 182, h: 100, gap: 6 },     // 기다리는 손님 — 작게 두 줄
    pans: TOPS.map(function (k, i) { return { k: k, x: 1292 + (i % 3) * 101, y: 330 + Math.floor(i / 3) * 92, w: 94, d: 72, lip: 12 }; }),
    bottles: SAUCES.map(function (k, i) { return { k: k, x: 1320 + i * 63, y: 792, h: 128 }; })
  };

  // ---------- 상태 ----------
  var S, R;
  function fresh() {
    return { coin: 0, total: 0, day: 1, rank: 0, best: MENUS.map(function () { return 0; }), seen: [],
      up: { grill: 0, heat: 0, fryer: 0, basket: 0, wait: 0, sign: 0 }, played: 0, ending: 0 };
  }
  function load() {
    S = fresh();
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && typeof r === 'object') {
        for (var k in S) if (typeof r[k] === typeof S[k]) S[k] = r[k];
        for (k in fresh().up) if (typeof S.up[k] !== 'number') S.up[k] = 0;
        if (!Array.isArray(S.best) || S.best.length !== MENUS.length) S.best = MENUS.map(function () { return 0; });
        if (!Array.isArray(S.seen)) S.seen = [];
        return true;
      }
    } catch (e) {}
    return false;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  function newRun() {
    R = {
      phase: 'title', t: 0, clock: 0,
      slots: LAY.slots.map(function () { return { st: 'empty' }; }),
      baskets: [{ st: 'empty', lift: 1 }, { st: 'empty', lift: 1 }],
      warm: [], boards: [{ stack: [], carton: null, o: null }, { stack: [], carton: null, o: null }], act: 0,
      orders: [], sel: 0, servings: [],
      fx: [], pops: [], flyers: [], squirt: null,
      spawned: 0, lastSpawn: -99, dayN: 0,
      stat: { coins: 0, stars: [] },
      banner: 0, newCards: [], paused: false, shake: {}
    };
  }

  // ---------- 계산 ----------
  function avail(mi) { var m = MENUS[mi]; return m.day <= S.day && (!m.fry || S.up.fryer); }
  function unlockedSet() {
    var u = { beef: 1 };
    MENUS.forEach(function (m, i) { if (avail(i)) m.L.forEach(function (k) { u[k] = 1; }); });
    if (S.day >= 5) u.mustard = 1;
    if (S.up.fryer) u.potato = 1;
    return u;
  }
  function heatMul() { return 1 + 0.2 * S.up.heat; }
  function slotN() { return 2 + S.up.grill; }
  function basketN() { return S.up.fryer ? 1 + S.up.basket : 0; }
  function dayCustomers() { return Math.min(16, 2 + S.day); }
  function concurrent() { return S.day <= 1 ? 1 : S.day <= 4 ? 2 : S.day <= 9 ? 3 : 4; }
  function rankOf(total) { var r = 0; for (var i = 0; i < RANK_AT.length; i++) if (total >= RANK_AT[i]) r = i; return r; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }

  // ---------- 주문 ----------
  function makeOrder() {
    var list = [], w = [];
    MENUS.forEach(function (m, i) { if (avail(i)) { list.push(i); w.push(m.day >= S.day - 1 ? 2.2 : 1); } });
    var first = S.day === 1 && R.spawned === 0;
    var mi = 0;
    if (!first) {
      var sum = w.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * sum;
      for (var i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) { mi = list[i]; break; } }
    }
    var m = MENUS[mi], u = unlockedSet();
    var need = m.L.map(function (k) { return { k: k, n: 1 }; });
    var hasBeef = m.L.indexOf('beef') >= 0;
    var done = hasBeef ? (first ? 'medium' : pick(['rare', 'medium', 'medium', 'well'])) : null;
    var mods = [];
    var nMods = first ? 0 : S.day <= 1 ? (Math.random() < 0.4 ? 1 : 0) : S.day <= 3 ? (Math.random() < 0.7 ? 1 : 0)
      : S.day <= 7 ? 1 + (Math.random() < 0.4 ? 1 : 0) : 1 + rnd(3);
    var types = ['no', 'add', 'sauce', 'lots', 'patty'];
    for (var tries = 0; mods.length < nMods && tries < 20; tries++) {
      var t = pick(types);
      if (mods.some(function (md) { return md.t === t; })) continue;
      if (t === 'no') {
        var c = need.filter(function (e) { return TOPS.indexOf(e.k) >= 0 && !mods.some(function (md) { return md.k === e.k; }); });
        if (!c.length) continue;
        var e = pick(c), at0 = need.indexOf(e); need.splice(at0, 1); mods.push({ t: 'no', k: e.k, at: at0 });
      } else if (t === 'add') {
        var have = {}; need.forEach(function (e) { have[e.k] = 1; });
        var c2 = TOPS.filter(function (k) { return u[k] && !have[k] && !mods.some(function (md) { return md.k === k; }); });
        if (!c2.length) continue;
        var k2 = pick(c2), at = 1;
        for (var j = 0; j < need.length; j++) if (PATTY[need[j].k]) at = j + 1;
        need.splice(at, 0, { k: k2, n: 1, add: 1 }); mods.push({ t: 'add', k: k2 });
      } else if (t === 'sauce') {
        var ss = need.filter(function (e) { return SAUCES.indexOf(e.k) >= 0; });
        var have2 = {}; need.forEach(function (e) { have2[e.k] = 1; });
        var alt = SAUCES.filter(function (k) { return u[k] && !have2[k]; });
        if (!ss.length || !alt.length || mods.some(function (md) { return md.t === 'lots'; })) continue;
        var k3 = pick(alt); ss[0].k = k3; ss[0].swap = 1; mods.push({ t: 'sauce', k: k3 });
      } else if (t === 'lots') {
        var ss2 = need.filter(function (e) { return SAUCES.indexOf(e.k) >= 0; });
        if (!ss2.length || mods.some(function (md) { return md.t === 'sauce'; })) continue;
        var e2 = pick(ss2); e2.n = 2; mods.push({ t: 'lots', k: e2.k });
      } else if (t === 'patty') {
        if (!hasBeef || S.day < 4 || need.filter(function (e) { return e.k === 'beef'; }).length >= 3) continue;
        var bi = need.map(function (e) { return e.k; }).indexOf('beef');
        need.splice(bi + 1, 0, { k: 'beef', n: 1, add: 1 }); mods.push({ t: 'patty' });
      }
    }
    var fries = !!S.up.fryer && !first && Math.random() < 0.4;
    var lines = [], speech = [];
    if (done && (done !== 'medium' || Math.random() < 0.5)) speech.push(T.sDone(done));
    mods.forEach(function (md) {
      if (md.t === 'no') { lines.push({ s: T.tNo(md.k), c: '#d23b2c' }); speech.push(T.sNo(md.k)); }
      if (md.t === 'add') { lines.push({ s: T.tAdd(md.k), c: '#2f8f3a' }); speech.push(T.sAdd(md.k)); }
      if (md.t === 'sauce') { lines.push({ s: T.tSauce(md.k), c: '#c9701a' }); speech.push(T.sSauce(md.k)); }
      if (md.t === 'lots') { lines.push({ s: T.tLots(md.k), c: '#c9701a' }); speech.push(T.sLots(md.k)); }
      if (md.t === 'patty') { lines.push({ s: T.tPatty, c: '#2f8f3a' }); speech.push(T.sPatty); }
    });
    if (fries) { lines.push({ s: T.tFries, c: '#b8861a' }); speech.push(T.sFries); }
    if (!speech.length) speech.push(pick(T.hello));
    var adds = mods.filter(function (md) { return md.t === 'add'; }).length;
    var price = (m.price + adds * 5 + (mods.some(function (md) { return md.t === 'patty'; }) ? 12 : 0) + (fries ? 20 : 0)) * (1 + 0.12 * S.up.sign);
    var pat = (60 + 7 * need.length + (fries ? 12 : 0)) * (1 + 0.15 * S.up.wait) * Math.max(0.7, 1 - 0.015 * (S.day - 1));
    return {
      mi: mi, need: need, done: done, fries: fries, mods: mods, lines: lines, speech: speech,
      price: Math.round(price), pat: pat, pt: pat, st: 'wait', enter: 0, x: null, bubble: 3.6, res: null, resT: 0,
      cu: { skin: rnd(4), hair: rnd(7), style: rnd(6), shirt: rnd(8), glasses: Math.random() < 0.25, kid: Math.random() < 0.15, seed: Math.random() * 99 }
    };
  }

  function zoneScore(v, z) {
    if (v >= z[0] && v <= z[1]) return 1;
    var d = v < z[0] ? z[0] - v : v - z[1];
    return Math.max(0, 1 - d / 0.2);
  }
  function judge(o, layers, carton) {
    var Rq = {}, B = {};
    o.need.forEach(function (e) { Rq[e.k] = (Rq[e.k] || 0) + (SAUCES.indexOf(e.k) >= 0 ? e.n : 1); });
    var patties = [];
    layers.forEach(function (L) {
      if (L.k === 'bun_b' || L.k === 'bun_t') return;
      B[L.k] = (B[L.k] || 0) + (SAUCES.indexOf(L.k) >= 0 ? Math.min(2, L.n || 1) : 1);
      if (PATTY[L.k]) patties.push(L);
    });
    var keys = {}, k, match = 0, miss = 0, extra = 0;
    for (k in Rq) keys[k] = 1; for (k in B) keys[k] = 1;
    for (k in keys) {
      var r = Rq[k] || 0, b = B[k] || 0, wx = SAUCES.indexOf(k) >= 0 ? 0.5 : 1;
      match += Math.min(r, b); miss += Math.max(0, r - b); extra += Math.max(0, b - r) * wx;
    }
    var content = match / Math.max(1, match + miss + extra);
    var dn = 0;
    patties.forEach(function (L) {
      var z = L.k === 'beef' ? ZONE[o.done || 'medium'] : ZONE.fry;
      var z0 = zoneScore(L.s[0], z), z1 = zoneScore(L.s[1], z);
      dn += Math.min(z0, z1) * 0.6 + (z0 + z1) * 0.2;   // 한쪽이 날것이면 크게 깎인다
    });
    dn = patties.length ? dn / patties.length : 0;
    var score;
    if (o.fries) score = content * 0.55 + dn * 0.35 + (carton ? zoneScore(carton.q, ZONE.fry) : 0) * 0.1;
    else score = content * 0.6 + dn * 0.4;
    // 손님이 콕 집어 말한 것을 어기면 따로 깎는다
    (o.mods || []).forEach(function (md) {
      var bad = md.t === 'no' ? (B[md.k] || 0) > 0 : md.t === 'add' || md.t === 'sauce' ? !(B[md.k] > 0)
        : md.t === 'lots' ? (B[md.k] || 0) < 2 : md.t === 'patty' ? (B.beef || 0) < (Rq.beef || 0) : false;
      if (bad) score -= 0.15;
    });
    score = Math.max(0, score);
    score *= 0.88 + 0.12 * Math.min(1, (o.pt / o.pat) * 2.5);
    var stars = score >= 0.93 ? 5 : score >= 0.8 ? 4 : score >= 0.62 ? 3 : score >= 0.42 ? 2 : 1;
    return { score: score, stars: stars };
  }

  // ---------- 화면 맞추기 ----------
  var W = 0, H = 0, sc = 1, ox = 0, oy = 0, dpr = 1;
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var de = document.documentElement;
    W = Math.max(240, window.innerWidth || de.clientWidth || 800);
    H = Math.max(200, window.innerHeight || de.clientHeight || 450);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    sc = Math.min(W / VW, H / VH);
    ox = (W - VW * sc) / 2; oy = H - VH * sc;
  }

  // ---------- 조리 동작 ----------
  function shake(key) { R.shake[key] = 0.3; SND.play('no'); }
  // 도마가 둘 — 누른 도마(R.act)에 재료가 올라간다
  function BD() { return R.boards[R.act]; }
  function BL(i) { return LAY.boards[i == null ? R.act : i]; }
  function stackTopY(i) {
    var bd = R.boards[i], y = LAY.boards[i].y - 6;
    bd.stack.forEach(function (L) { y -= ART.layerTh(L.k, LAY.R); });
    return y;
  }
  function pushLayer(L, fx, fy) {
    var st = BD().stack;
    if (st.length >= 22 || (st.length && st[st.length - 1].k === 'bun_t')) { shake('board' + R.act); return false; }
    if (!st.length && L.k !== 'bun_b') st.push({ k: 'bun_b', fly: 0, fx: LAY.buns.x + 60, fy: LAY.buns.y + 30 });
    L.fly = 0; L.fx = fx; L.fy = fy;
    st.push(L);
    return true;
  }
  function tapRaw(k) {
    var u = unlockedSet(), b = LAY.raw.filter(function (r) { return r.k === k; })[0];
    if (!u[k] && !(k === 'potato' && S.up.fryer)) return;
    if (k === 'beef') {
      for (var i = 0; i < slotN(); i++) if (R.slots[i].st === 'empty') {
        R.slots[i] = { st: 'cook', type: 'beef', a: 0, b: 0, flipped: false, flipT: 1, seed: 1 + rnd(50), inT: 0 };
        R.flyers.push({ kind: 'raw', fx: b.x + 90, fy: b.y + 46, tx: LAY.slots[i].x, ty: LAY.slots[i].y, p: 0, dur: 0.25 });
        SND.play('sear');
        return;
      }
      shake('raw' + k);
    } else {
      for (var j = 0; j < basketN(); j++) if (R.baskets[j].st === 'empty') {
        R.baskets[j] = { st: 'cook', item: k === 'potato' ? 'fries' : k, c: 0, lift: 1 };
        SND.play('dunk');
        return;
      }
      shake('raw' + k);
    }
  }
  function tapSlot(i) {
    var s = R.slots[i];
    if (s.st !== 'cook' || s.flipT < 1) return;
    if (!s.flipped) { s.flipped = true; s.flipT = 0; SND.play('flip'); return; }
    var P = LAY.slots[i];
    if (s.a > 1.5 || s.b > 1.5) {
      R.flyers.push({ kind: 'trash', type: s.type, c: Math.max(s.a, s.b), fx: P.x, fy: P.y, tx: LAY.trash.x + 32, ty: LAY.trash.y, p: 0, dur: 0.4 });
      R.slots[i] = { st: 'empty' }; SND.play('trash'); return;
    }
    if (pushLayer({ k: s.type, s: [s.a, s.b] }, P.x, P.y)) { R.slots[i] = { st: 'empty' }; }
  }
  function tapBasket(i) {
    var b = R.baskets[i];
    if (b.st !== 'cook') return;
    b.st = 'up'; b.upT = 0; SND.play('lift');
  }
  function finishBasket(i) {
    var b = R.baskets[i], P = LAY.baskets[i];
    if (b.c > 1.5) {
      R.flyers.push({ kind: 'trash', type: b.item === 'fries' ? 'fries' : b.item, c: b.c, fx: P.x, fy: P.y - 40, tx: LAY.trash.x + 32, ty: LAY.trash.y, p: 0, dur: 0.45 });
      SND.play('trash');
    } else if (b.item === 'fries') {
      for (var k = 0; k < 3 && R.warm.length < 9; k++) R.warm.push(b.c);
      SND.play('soft');
    } else {
      pushLayer({ k: b.item, s: [b.c, b.c] }, P.x, P.y - 40);
    }
    R.baskets[i] = { st: 'empty', lift: 1 };
  }
  function tapTop(k) {
    var u = unlockedSet(); if (!u[k]) return;
    var p = LAY.pans.filter(function (q) { return q.k === k; })[0];
    if (pushLayer({ k: k, melt: 0 }, p.x + p.w / 2, p.y + p.d / 2)) SND.play('soft');
  }
  function tapSauce(k) {
    var u = unlockedSet(); if (!u[k] || R.squirt) return;
    var st = BD().stack, top = st[st.length - 1];
    if (top && top.k === k && (top.n || 1) < 3 && top.fly == null) { top.n = (top.n || 1) + 1; top.draw = 0; R.squirt = { k: k, L: top, b: R.act }; SND.play('squirt'); return; }
    if (st.length >= 22 || (top && top.k === 'bun_t')) { shake('board' + R.act); return; }
    var L = { k: k, n: 1, draw: 0 };
    if (!st.length) st.push({ k: 'bun_b', fly: 0, fx: LAY.buns.x + 60, fy: LAY.buns.y + 30 });
    st.push(L);
    R.squirt = { k: k, L: L, b: R.act };
    SND.play('squirt');
  }
  function tapBuns() {
    var st = BD().stack;
    if (!st.length) { pushLayer({ k: 'bun_b' }, LAY.buns.x + 90, LAY.buns.y + 30); SND.play('bun'); return; }
    var top = st[st.length - 1];
    if (st.length < 2 || top.k === 'bun_t' || (R.squirt && R.squirt.b === R.act)) { shake('buns'); return; }
    if (!selOrder()) { shake('buns'); return; }
    pushLayer({ k: 'bun_t' }, LAY.buns.x + 160, LAY.buns.y + 30);
    SND.play('bun');
  }
  function tapWarmer() {
    if (!R.warm.length || BD().carton) { if (!R.warm.length) shake('warmer'); return; }
    BD().carton = { q: R.warm.shift(), pop: 0 };
    SND.play('soft');
  }
  function tapTrash() {
    var bd = BD(), bl = BL();
    if (!bd.stack.length && !bd.carton) return;
    bd.stack.forEach(function (L, i) {
      R.flyers.push({ kind: 'layer', L: { k: L.k, s: L.s, n: L.n, melt: 1 }, fx: bl.x, fy: L._y || bl.y - i * 20, tx: LAY.trash.x + 32, ty: LAY.trash.y + 10, p: -i * 0.04, dur: 0.35 });
    });
    if (R.squirt && R.squirt.b === R.act) R.squirt = null;
    bd.stack = []; bd.carton = null;
    SND.play('trash');
  }
  function selOrder() {
    var o = R.boards[R.act].o;
    return o && o.st === 'wait' ? o : null;
  }
  // 윗빵을 덮으면 그 도마 카드의 손님에게 나간다
  function serve(bi) {
    var bd = R.boards[bi], o = bd.o;
    if (!o || o.st !== 'wait') return;
    var c = o.fries && bd.carton ? bd.carton : null, res = judge(o, bd.stack, c);
    R.servings.push({ layers: bd.stack, carton: c, p: 0, o: o, res: res, bi: bi, bx: LAY.boards[bi].x, by: LAY.boards[bi].y });
    o.st = 'eat';
    bd.stack = [];
    if (c) bd.carton = null;
    SND.play('ding');
  }
  function settle(sv) {
    var o = sv.o, res = sv.res, stars = res.stars;
    var pay = Math.round(o.price * (0.25 + 0.15 * stars)), tip = stars === 5 ? Math.round(o.price * 0.2) : 0;
    S.coin += pay + tip; S.total += pay + tip;
    R.stat.coins += pay + tip; R.stat.stars.push(stars);
    if (stars > S.best[o.mi]) S.best[o.mi] = stars;
    o.st = 'done'; o.resT = 2.0; o.res = { stars: stars, pay: pay + tip };
    var C = LAY.cards[o.slot || 0], tx = C.x + C.w - 220;
    R.pops.push({ x: tx, y: C.y + 40, s: T.words[stars], c: stars >= 4 ? '#ffd23f' : stars === 3 ? '#fff' : '#ff8a7a', t: 0, big: stars === 5 });
    R.pops.push({ x: tx + 150, y: C.y + 60, s: '+' + (pay + tip), c: '#ffe08a', t: -0.35, coin: 1 });
    SND.play(stars >= 4 ? 'great' : stars === 3 ? 'coin' : 'bad');
    if (stars >= 3) setTimeout(function () { SND.play('coin'); }, 380);
    if (o.mi === MENUS.length - 1 && stars === 5) R.pops.push({ x: VW / 2, y: 300, s: '★ ' + T.menus[MENUS.length - 1] + ' ★', c: '#ffd23f', t: -0.6, big: 2 });
    save(); hud();
  }

  // ---------- 하루 ----------
  function beginDay() {
    R.phase = 'intro'; R.banner = 0; R.spawned = 0; R.lastSpawn = -99; R.dayN = dayCustomers();
    R.stat = { coins: 0, stars: [] }; R.orders = []; R.boards.forEach(function (bd) { bd.o = null; }); R.sel = 0; R.clock = 0;
    R.newCards = [];
    MENUS.forEach(function (m, i) { if (avail(i) && S.seen.indexOf(i) < 0) { R.newCards.push(i); S.seen.push(i); } });
    save(); hud();
    if (window.OG) OG.start({ day: S.day });              // 사이트 지표(game-events.js) — 하루 = 한 판
  }
  function endDay() {
    R.phase = 'end';
    S.day++; S.played++;
    var old = S.rank; S.rank = Math.max(S.rank, rankOf(S.total));
    save();
    var st = R.stat.stars, avg = st.length ? st.reduce(function (a, b) { return a + b; }, 0) / st.length : 0;
    UI.showEnd(S.day - 1, avg, R.stat.coins, S.rank > old ? S.rank : -1);
    if (window.OG) OG.over({ result: 'DAY CLEAR', score: R.stat.coins, day: S.day - 1 });
    SND.play('clear');
  }


  // ---------- 갱신 ----------
  function update(dt) {
    R.t += dt;
    for (var k in R.shake) { R.shake[k] -= dt; if (R.shake[k] <= 0) delete R.shake[k]; }
    if (R.paused || UI.open()) { SND.level(0, 0); return; }
    if (R.phase === 'ending') {                           // 엔딩: 간판이 올라가고 불꽃
      R.endT += dt;
      var done = 2.6 + (T.en ? 13 : 5) * 0.32;
      if (R.endT > done && !R.endLit) { R.endLit = 1; SND.play('rise'); }
      if (R.endLit && Math.random() < dt * 1.6) SND.play('pop');
      if (R.endT > done + 2.2) $('endingGo').hidden = false;
      SND.level(0, 0);
      return;
    }
    if (R.phase === 'title') {                            // 타이틀: 굽는 척 김만 난다
      R.fx = R.fx.filter(function (p) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 16; return p.life < p.max; });
      if (Math.random() < dt * 5) { var q = LAY.slots[rnd(2)]; R.fx.push({ x: q.x + (Math.random() - 0.5) * 70, y: q.y - 6, vx: (Math.random() - 0.5) * 14, vy: -40, r: 14, life: 0, max: 1.6 }); }
      return;
    }
    var hm = heatMul(), i, grillN = 0, fryN = 0, burnt = false;

    // 그릴
    for (i = 0; i < R.slots.length; i++) {
      var s = R.slots[i]; if (s.st !== 'cook') continue;
      grillN++;
      if (s.flipT < 1) s.flipT = Math.min(1, s.flipT + dt / 0.38);
      var rate = 0.12 * hm * dt;
      if (!s.flipped) s.a += rate; else if (s.flipT > 0.5) s.b += rate;
      var dn = s.flipped ? s.b : s.a;
      if (dn > 1.36) burnt = true;
      var P = LAY.slots[i];
      if (Math.random() < dt * (dn > 1.3 ? 9 : 3.5)) R.fx.push({ x: P.x + (Math.random() - 0.5) * 80, y: P.y - 6, vx: (Math.random() - 0.5) * 14, vy: -40 - Math.random() * 30, r: 14 + Math.random() * 12, life: 0, max: 1.4 + Math.random(), dark: dn > 1.36 });
    }
    // 튀김기
    for (i = 0; i < 2; i++) {
      var b = R.baskets[i];
      if (b.st === 'cook') { fryN++; b.lift = Math.max(0, b.lift - dt / 0.25); if (b.lift === 0) b.c += 0.11 * hm * dt; }
      else if (b.st === 'up') { b.lift = Math.min(1, b.lift + dt / 0.25); b.upT += dt; if (b.upT > 0.55) finishBasket(i); }
    }
    SND.level(grillN, fryN, burnt);

    // 쌓기 애니메이션
    R.boards.forEach(function (bd, bi) {
      var st = bd.stack, done = false;
      st.forEach(function (L, j) {
        if (L.fly != null) { L.fly += dt / 0.24; if (L.fly >= 1) { L.fly = null; L.land = 0; if (PATTY[L.k]) SND.play('drop'); } }
        else if (L.land != null) { L.land += dt / 0.2; if (L.land >= 1) { L.land = null; if (L.k === 'bun_t' && j === st.length - 1) done = true; } }
        if (L.k === 'cheese' && j > 0 && PATTY[st[j - 1].k] && L.melt < 1) L.melt = Math.min(1, L.melt + dt / 1.6);
      });
      if (done) serve(bi);
      if (bd.carton && bd.carton.pop < 1) bd.carton.pop = Math.min(1, bd.carton.pop + dt / 0.25);
    });
    if (R.squirt) { R.squirt.L.draw = Math.min(1, R.squirt.L.draw + dt / 0.45); if (R.squirt.L.draw >= 1) R.squirt = null; }

    // 날아가는 것
    R.flyers = R.flyers.filter(function (f) { f.p += dt / f.dur; return f.p < 1; });
    R.fx = R.fx.filter(function (p) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 16; return p.life < p.max; });
    R.pops = R.pops.filter(function (p) { p.t += dt; return p.t < 1.5; });

    // 내기
    R.servings = R.servings.filter(function (sv) {
      sv.p += dt / 0.55;
      if (sv.p >= 1) { settle(sv); return false; }
      return true;
    });

    if (R.phase === 'intro') {
      R.banner += dt;
      if (R.banner > 1.5 + R.newCards.length * 2.1) { R.phase = 'play'; R.clock = 0; }
    }
    if (R.phase === 'play') {
      R.clock += dt;
      var active = R.orders.filter(function (o) { return o.st === 'wait' || o.st === 'eat'; }).length;
      var gap = Math.max(5, 14 - S.day * 0.5);
      if (R.spawned < R.dayN && R.orders.length < concurrent() && (active === 0 && R.clock - R.lastSpawn > 1.2 || R.clock - R.lastSpawn > gap)) {
        R.orders.push(makeOrder()); R.spawned++; R.lastSpawn = R.clock; SND.play('door'); hud();
      }
    }
    // 빈 도마에 줄 선 손님을 앉힌다
    R.boards.forEach(function (bd, bi) {
      if (bd.o && R.orders.indexOf(bd.o) < 0) bd.o = null;
      if (bd.o) return;
      for (var q = 0; q < R.orders.length; q++) {
        var oo = R.orders[q];
        if (oo.st === 'wait' && oo.slot == null) { bd.o = oo; oo.slot = bi; oo.bubble = bubLen(oo); oo.enter = 0; break; }
      }
    });
    var cur = R.boards[R.act].o, other = R.boards[1 - R.act].o;   // 지금 도마가 비면 손님 있는 도마로
    if ((!cur || cur.st !== 'wait') && other && other.st === 'wait' && !R.boards[R.act].stack.length) R.act = 1 - R.act;
    // 주문표
    for (i = R.orders.length - 1; i >= 0; i--) {
      var o = R.orders[i];
      o.enter = Math.min(1, o.enter + dt / 0.35);
      if (o.bubble > 0) o.bubble -= dt;
      if (o.st === 'wait') {
        o.pt -= o.slot != null ? dt : dt * 0.4;          // 줄 선 손님은 천천히 지친다
        if (o.pt <= 0) {
          o.st = 'gone'; o.resT = 1.6; o.res = { stars: 0, pay: 0 }; R.stat.stars.push(0); SND.play('bad');
        }
      } else if (o.st === 'done' || o.st === 'gone') {
        o.resT -= dt;
        if (o.resT <= 0) { R.orders.splice(i, 1); hud(); }
      }
    }
    if (R.phase === 'play' && R.spawned >= R.dayN && !R.orders.length && !R.servings.length) endDay();
  }

  // ---------- 그리기 ----------
  function ease(p) { return p < 0 ? 0 : p > 1 ? 1 : 1 - Math.pow(1 - p, 3); }
  function shk(key) { var v = R.shake[key]; return v ? Math.sin(v * 60) * 6 * v / 0.3 : 0; }

  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#2b2622'; g.fillRect(0, 0, W, H);
    g.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
    var t = R.t, x0 = -ox / sc - 2, y0 = -oy / sc - 2, ww = W / sc + 4;
    if (R.phase === 'ending') { ART.ending(g, x0, y0, ww, H / sc + 4, R.endT, t, R.endCust, T.en ? 'KINGWANGZZANG' : '킹왕짱버거', 'Gaegu'); return; }
    var u = unlockedSet();

    ART.wall(g, x0, y0, ww, 300 - y0, S.rank, t);
    drawTickets(t);
    ART.counter(g, x0, 300, ww, 500);
    ART.counterFront(g, x0, 800, ww, VH - 800 + 40);

    // 날재료
    LAY.raw.forEach(function (b) {
      var on = b.k === 'beef' || (b.k === 'potato' ? S.up.fryer : u[b.k]);
      g.save(); g.translate(shk('raw' + b.k), 0);
      ART.rawTray(g, b, b.k, !!on, 3);
      g.restore();
    });
    // 튀김기
    ART.fryer(g, LAY.fryer, t, R.baskets, !!S.up.fryer);
    if (S.up.fryer) {
      for (var i = 0; i < basketN(); i++) {
        var bk = R.baskets[i], BP = LAY.baskets[i];
        ART.basket(g, BP.x, BP.y, BP.w, BP.d, bk.st === 'empty' ? 1 : bk.lift, bk.st === 'empty' ? null : bk.item, bk.c || 0, t, bk.st === 'cook' && bk.lift < 0.5);
      }
      g.save(); g.translate(shk('warmer'), 0); ART.warmer(g, LAY.warmer, R.warm, t); g.restore();
    }
    // 그릴
    ART.grill(g, LAY.grill, t, true);
    for (i = 0; i < slotN(); i++) {
      var sl = R.slots[i], P = LAY.slots[i];
      if (sl.st !== 'cook') {
        g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 2; ART.ell(g, P.x, P.y + 14, 58, 30); g.stroke();
        continue;
      }
      var up = sl.flipped ? sl.a : sl.b, dn = sl.flipped ? sl.b : sl.a;
      if (sl.flipT < 1) {                                  // 뒤집는 중
        var ft = sl.flipT, lift = Math.sin(ft * PI) * 46, sy = Math.abs(Math.cos(ft * PI));
        var showUp = ft < 0.5 ? sl.b : sl.a, showDn = ft < 0.5 ? sl.a : sl.b;
        if (ft >= 0.5) { showUp = sl.a; showDn = sl.b; } else { showUp = sl.b; showDn = sl.a; }
        ART.shadow(g, P.x, P.y + 18, 60 * (1 - lift / 120), 26, 0.4);
        g.save(); g.translate(P.x, P.y - lift); g.scale(1, Math.max(0.08, sy)); g.translate(-P.x, -P.y);
        ART.grillPatty(g, P.x, P.y, 56, sl.type, ft < 0.5 ? showUp : sl.a, showDn, sl.seed, 0, t);
        g.restore();
      } else {
        ART.grillPatty(g, P.x, P.y, 56, sl.type, up, dn, sl.seed, 1, t);
      }
    }
    g.save();
    ART.trash(g, LAY.trash, R.flyers.some(function (f) { return f.kind !== 'raw' && f.p > 0.4; }));
    g.restore();
    g.save(); g.translate(shk('buns'), 0); ART.bunBasket(g, LAY.buns, 4); g.restore();

    // 도마·버거
    R.boards.forEach(function (bd, bi) {
      var bl = LAY.boards[bi];
      g.save(); g.translate(shk('board' + bi), 0);
      if (bi === R.act && R.phase !== 'title') {
        g.strokeStyle = 'rgba(255,190,40,' + (0.8 + 0.2 * Math.sin(t * 4)) + ')'; g.lineWidth = 8;
        ART.ell(g, bl.x, bl.y + 10, bl.rx + 16, bl.ry + 14); g.stroke();
      }
      ART.board(g, bl.x, bl.y, bl.rx, bl.ry);
      if (R.phase !== 'title') numTag(bl.x - bl.rx * 0.62, bl.y + bl.ry + 24, bi, bi === R.act);
      ART.stack(g, bd.stack, bl.x, bl.y - 6, LAY.R, t);
      if (bd.carton) {
        var cp = ease(bd.carton.pop) * 0.7;
        g.save(); g.translate(bl.x + bl.rx * 0.72, bl.y + 58); g.scale(cp, cp); ART.carton(g, 0, 0, 1, bd.carton.q); g.restore();
      }
      g.restore();
    });
    // 토핑·소스
    LAY.pans.forEach(function (p) { ART.pan(g, p, p.k, !!u[p.k]); });
    LAY.bottles.forEach(function (b) {
      if (!u[b.k]) { g.fillStyle = 'rgba(0,0,0,.08)'; ART.ell(g, b.x, b.y - 4, 26, 9); g.fill(); return; }
      if (R.squirt && R.squirt.k === b.k) return;
      ART.bottle(g, b.x, b.y, b.h, b.k, true, 0);
    });

    // 연기
    R.fx.forEach(function (p) {
      var a = Math.sin(Math.min(1, p.life / p.max) * PI) * (p.dark ? 0.35 : 0.16);
      ART.smoke(g, p.x, p.y, p.r, a, p.dark);
    });
    // 익힘 막대
    for (i = 0; i < slotN(); i++) {
      var s2 = R.slots[i]; if (s2.st !== 'cook' || s2.flipT < 1 || R.phase === 'title') continue;
      ART.gauge(g, LAY.slots[i].x, LAY.slots[i].y - 64, 104, s2.flipped ? s2.b : s2.a, 'beef', s2.flipped ? s2.a : null);
    }
    for (i = 0; i < basketN(); i++) {
      var b2 = R.baskets[i]; if (b2.st !== 'cook') continue;
      ART.gauge(g, LAY.baskets[i].x, LAY.baskets[i].y - 128, 92, b2.c, 'fry', null);
    }
    // 소스 짜는 병
    if (R.squirt) {
      var L = R.squirt.L, yTop = (L._y || stackTopY(R.squirt.b)) - 4, bx = LAY.boards[R.squirt.b].x + (L.draw * 2 - 1) * LAY.R * 0.78;
      g.save(); g.translate(bx, yTop - 150); g.rotate(PI + 0.25);
      g.translate(0, -128);
      ART.bottle(g, 0, 128, 128, R.squirt.k, true, 0.6);
      g.restore();
      g.strokeStyle = ART.SAUCE[R.squirt.k].c; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx - 4, yTop - 30); g.lineTo(bx, yTop); g.stroke();
    }
    // 날아가는 층
    R.boards.forEach(function (bd, bi) { bd.stack.forEach(function (L2) {
      if (L2.fly == null) return;
      var p = ease(L2.fly), tx = LAY.boards[bi].x, ty = L2._y;
      var xx = L2.fx + (tx - L2.fx) * p, yy = L2.fy + (ty - L2.fy) * p - Math.sin(p * PI) * 90;
      g.save(); g.translate(xx, yy); var s3 = 0.7 + 0.3 * p; g.scale(s3, s3);
      ART.layer(g, L2, 0, 0, LAY.R, t, null);
      g.restore();
    }); });
    R.flyers.forEach(function (f) {
      var p = ease(f.p); if (f.p < 0) return;
      var xx = f.fx + (f.tx - f.fx) * p, yy = f.fy + (f.ty - f.fy) * p - Math.sin(p * PI) * 70;
      g.save(); g.translate(xx, yy);
      if (f.kind === 'raw') ART.grillPatty(g, 0, 0, 44 + 12 * p, 'beef', 0, 0, 3, 0, t);
      else if (f.kind === 'trash') { var s4 = 1 - p * 0.6; g.scale(s4, s4); if (f.type === 'fries') ART.carton(g, 0, 20, 0.8, f.c); else ART.grillPatty(g, 0, 0, 50, f.type, f.c, f.c, 5, 0, t); }
      else { var s5 = 1 - p * 0.7; g.scale(s5, s5); ART.layer(g, f.L, 0, 0, LAY.R, t, null); }
      g.restore();
    });
    // 내가는 버거
    R.servings.forEach(function (sv) {
      var p2 = ease(sv.p);
      var txx = LAY.cards[sv.bi].x + 82, tyy = LAY.cards[sv.bi].y + 80;
      var sxx = sv.bx + (txx - sv.bx) * p2, syy = (sv.by - 6) + (tyy - sv.by) * p2 - Math.sin(p2 * PI) * 120;
      var s6 = 1 - p2 * 0.6;
      g.save(); g.translate(sxx, syy); g.scale(s6, s6);
      ART.stack(g, sv.layers, 0, 0, LAY.R, t);
      if (sv.carton) ART.carton(g, 100, 50, 0.72, sv.carton.q);
      g.restore();
    });
    drawHint(t);
    drawBubbles(t);
    drawPops();
    drawBanner(t);
  }

  function recipeList(o) {
    var list = o.need.map(function (e) { return { k: e.k, n: e.n, add: e.add, swap: e.swap }; });
    o.mods.forEach(function (md) { if (md.t === 'no') list.splice(Math.min(md.at || 0, list.length), 0, { k: md.k, no: 1 }); });
    list.unshift({ k: 'bun_b' }); list.push({ k: 'bun_t' });
    if (o.fries) list.push({ k: 'fries', add: 1 });
    return list;
  }
  function moodOf(o) {
    return o.st === 'done' ? (o.res.stars >= 4 ? 'happy' : o.res.stars === 3 ? 'idle' : 'angry')
      : o.st === 'gone' ? 'angry' : o.st === 'eat' ? 'idle' : o.pt / o.pat < 0.22 ? 'angry' : o.pt / o.pat < 0.5 ? 'wait' : 'idle';
  }
  function avatar(o, ax, ay, ar, t) {
    g.save(); g.beginPath(); g.arc(ax, ay, ar, 0, PI * 2); g.clip();
    var ag = g.createLinearGradient(0, ay - ar, 0, ay + ar); ag.addColorStop(0, '#cfe6f2'); ag.addColorStop(1, '#9cc4d8');
    g.fillStyle = ag; g.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
    ART.face(g, ax, ay - ar * 0.08, ar * 0.66, o.cu, moodOf(o), t);
    g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(2.5, ar * 0.09); g.beginPath(); g.arc(ax, ay, ar, 0, PI * 2); g.stroke();
  }
  function paper(x, y, w, h, r) {
    ART.shadow(g, x + w / 2 + 8, y + h + 4, w * 0.52, 12, 0.22);
    var pg = g.createLinearGradient(0, y, 0, y + h);
    pg.addColorStop(0, '#fffdf6'); pg.addColorStop(1, '#f1ead9');
    ART.rrect(g, x, y, w, h, r); g.fillStyle = pg; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1.5; g.stroke();
  }
  function numTag(x, y, bi, on) {
    g.fillStyle = on ? '#ffb21e' : '#6b5a48'; g.beginPath(); g.arc(x, y, 17, 0, PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#fff'; g.font = '400 22px "Ria",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(bi + 1), x, y + 1);
  }
  function drawTickets(t) {
    var Q = LAY.queue;
    R.boards.forEach(function (bd, bi) {
      var o = bd.o, C = LAY.cards[bi];
      if (!o && R.phase === 'title') return;
      if (!o) {                                            // 빈 자리 — 흐린 틀만
        g.fillStyle = 'rgba(255,255,255,.18)'; ART.rrect(g, C.x, C.y, C.w, C.h, 10); g.fill();
        numTag(C.x + 24, C.y + C.h / 2, bi, false);
        return;
      }
      var fade = o.st === 'done' || o.st === 'gone' ? Math.min(1, o.resT / 0.5) : 1;
      g.save(); g.globalAlpha = fade * ease(o.enter);
      g.translate(-(1 - ease(o.enter)) * 60, 0);
      orderCard(o, C.x, C.y, C.w, C.h, t, bi);
      g.restore();
    });
    // 기다리는 손님 — 작게 두 줄
    var line = R.orders.filter(function (q) { return q.slot == null; });
    for (var j = 0; j < Math.min(line.length, 2); j++) {
      var q = line[j], qy = Q.y + j * (Q.h + Q.gap);
      g.save(); g.globalAlpha = ease(q.enter);
      paper(Q.x, qy, Q.w, Q.h, 10);
      avatar(q, Q.x + 36, qy + 38, 27, t);
      g.textAlign = 'left'; g.textBaseline = 'middle';
      fitText(T.menus[q.mi], Q.x + 70, qy + 38, Q.w - 78, 20, '#3a2a1c');
      var f = Math.max(0, q.pt / q.pat);
      g.fillStyle = 'rgba(0,0,0,.12)'; ART.rrect(g, Q.x + 10, qy + Q.h - 18, Q.w - 20, 8, 4); g.fill();
      g.fillStyle = f > 0.5 ? '#5dbb4a' : f > 0.22 ? '#f0b12c' : '#e2412c';
      ART.rrect(g, Q.x + 10, qy + Q.h - 18, (Q.w - 20) * f, 8, 4); g.fill();
      if (j === 1 && line.length > 2) {
        g.fillStyle = '#6b5a48'; g.font = '400 18px "Ria",sans-serif'; g.textAlign = 'right';
        g.fillText('+' + (line.length - 2), Q.x + Q.w - 10, qy + 16);
      }
      g.restore();
    }
  }
  function check(cx, cy, r, ok) {
    g.fillStyle = ok ? '#2f9a3e' : '#e2362a'; g.beginPath(); g.arc(cx, cy, r, 0, PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = r * 0.28; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    if (ok) { g.moveTo(cx - r * 0.45, cy + r * 0.02); g.lineTo(cx - r * 0.1, cy + r * 0.38); g.lineTo(cx + r * 0.5, cy - r * 0.35); }
    else { g.moveTo(cx - r * 0.38, cy - r * 0.38); g.lineTo(cx + r * 0.38, cy + r * 0.38); g.moveTo(cx + r * 0.38, cy - r * 0.38); g.lineTo(cx - r * 0.38, cy + r * 0.38); }
    g.stroke();
  }
  // 주문 한 줄: [번호·손님·메뉴·익힘] | 아랫빵 → … → 윗빵 (→ 감자튀김) | 손님 말
  function orderCard(o, x, y, w, h, t, bi) {
    paper(x, y, w, h, 10);
    if (bi === R.act && o.st === 'wait') { g.strokeStyle = '#ffb21e'; g.lineWidth = 6; ART.rrect(g, x, y, w, h, 10); g.stroke(); }
    numTag(x + 24, y + h / 2, bi, bi === R.act);
    avatar(o, x + 82, y + h / 2, 38, t);
    g.textAlign = 'left'; g.textBaseline = 'middle';
    fitText(T.menus[o.mi], x + 130, y + 30, 186, 26, '#3a2a1c');
    if (o.done) {
      g.font = '400 19px "Ria",sans-serif';
      var dtx = T.done[o.done], bw = g.measureText(dtx).width + 22;
      ART.rrect(g, x + 130, y + 47, bw, 26, 13); g.fillStyle = ART.DONE_COL[o.done]; g.fill();
      g.fillStyle = '#fff'; g.fillText(dtx, x + 141, y + 61);
    }
    if (o.st === 'wait') {
      var f = Math.max(0, o.pt / o.pat);
      g.fillStyle = 'rgba(0,0,0,.12)'; ART.rrect(g, x + 130, y + h - 18, 176, 9, 4); g.fill();
      g.fillStyle = f > 0.5 ? '#5dbb4a' : f > 0.22 ? '#f0b12c' : '#e2412c';
      ART.rrect(g, x + 130, y + h - 18, 176 * f, 9, 4); g.fill();
    }
    g.fillStyle = 'rgba(90,70,40,.15)'; g.fillRect(x + 322, y + 10, 2, h - 20);

    // 레시피 — 아랫빵부터 윗빵까지 한 줄로
    var list = recipeList(o), n = list.length;
    var built = {}, bd = R.boards[bi];
    if (o.st === 'wait') {
      bd.stack.forEach(function (L) { built[L.k] = (built[L.k] || 0) + (SAUCES.indexOf(L.k) >= 0 ? (L.n || 1) : 1); });
      if (bd.carton) built.fries = 1;
    }
    var ax = x + 332, aw = w - 344;
    var cell = Math.min(100, (aw - (n <= 12 ? 250 : 0)) / n), isz = Math.min(52, cell - 14), sx = ax;   // 끝에 손님 말 자리를 남긴다
    var used = {};
    list.forEach(function (it, j) {
      var cx = sx + cell * j + cell / 2, cy = y + 38, ly = y + h - 16;
      if (j > 0) {
        g.fillStyle = 'rgba(90,70,40,.3)'; var mx = cx - cell / 2;
        g.beginPath(); g.moveTo(mx - 4, cy - 7); g.lineTo(mx + 4, cy); g.lineTo(mx - 4, cy + 7); g.closePath(); g.fill();
      }
      ART.icon(g, it.k, cx, cy, isz, it.k === 'beef' && o.done ? ART.DONE_COL[o.done] : null);
      var label = it.k === 'bun_b' ? T.bunB : it.k === 'bun_t' ? T.bunT : it.k === 'fries' ? T.tFries
        : it.no ? T.noL(it.k) : it.n > 1 ? T.lotsL(it.k) : it.add ? T.addL(it.k) : it.swap ? T.swapL(it.k) : T.ing[it.k];
      var lc = it.no ? '#d23b2c' : it.add ? '#2f8f3a' : it.n > 1 || it.swap ? '#c9701a' : '#3a2a1c';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      fitText(label, cx, ly, cell - 4, 19, lc);
      var cr = Math.max(9, isz * 0.22);
      if (it.no) {
        g.strokeStyle = '#e2362a'; g.lineWidth = 5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(cx - isz * 0.4, cy - isz * 0.4); g.lineTo(cx + isz * 0.4, cy + isz * 0.4);
        g.moveTo(cx + isz * 0.4, cy - isz * 0.4); g.lineTo(cx - isz * 0.4, cy + isz * 0.4); g.stroke();
        if (built[it.k]) check(cx + isz * 0.42, cy + isz * 0.36, cr, false);
        return;
      }
      var want = SAUCES.indexOf(it.k) >= 0 ? (it.n || 1) : 1;
      used[it.k] = (used[it.k] || 0) + want;
      if ((built[it.k] || 0) >= used[it.k]) check(cx + isz * 0.42, cy + isz * 0.36, cr, true);
    });
    o._free = { x: sx + cell * n + 8, y: y, h: h, r: x + w - 10 };   // 손님 말이 들어갈 빈칸
    if (o.res && o.st === 'done') {
      g.fillStyle = 'rgba(255,253,246,.82)'; g.fillRect(x + 326, y + 4, w - 334, h - 8);
      for (var k = 0; k < 5; k++) ART.star(g, x + 330 + aw / 2 + (k - 2) * 66, y + h / 2, 27, k < o.res.stars);
    }
  }
  function fitText(s, x, y, maxW, size, col, weight) {
    g.font = (weight || '400') + ' ' + size + 'px "Ria",sans-serif';
    var w = g.measureText(s).width;
    if (w > maxW) { size = Math.floor(size * maxW / w); g.font = (weight || '400') + ' ' + size + 'px "Ria",sans-serif'; }
    g.fillStyle = col; g.fillText(s, x, y);
  }
  // 손님 말은 그 줄의 레시피 오른쪽 빈칸에 — 한 마디씩 차례로 (레시피를 가리지 않게)
  var SAY = 1.7;                                          // 한 마디가 떠 있는 시간
  function bubLen(o) { return Math.max(3, o.speech.length * SAY); }
  function drawBubbles(t) {
    R.boards.forEach(function (bd, bi) {
      var o = bd.o, fr = o && o._free;
      if (!o || !fr || o.bubble <= 0 || o.st !== 'wait') return;
      var total = bubLen(o), el = total - o.bubble;
      var idx = Math.min(o.speech.length - 1, Math.floor(el / SAY)), part = el - idx * SAY;
      var a = Math.min(1, o.bubble / 0.3, part / 0.15);
      var sp = o.speech[idx];
      var avail = Math.max(200, fr.r - fr.x), inside = fr.r - fr.x >= 200, fs, lines;
      g.save(); g.globalAlpha = Math.max(0, a);
      g.textAlign = 'left'; g.textBaseline = 'middle';
      for (fs = 24; fs >= 15; fs--) {                      // 빈칸에 들어갈 때까지 글자를 줄인다 (두 줄까지)
        g.font = '400 ' + fs + 'px "Ria",sans-serif';
        if (g.measureText(sp).width <= avail - 30) { lines = [sp]; break; }
        var cutAt = sp.lastIndexOf(' ', Math.floor(sp.length / 2) + 2);
        if (cutAt > 0) {
          var l2 = [sp.slice(0, cutAt), sp.slice(cutAt + 1)];
          if (Math.max(g.measureText(l2[0]).width, g.measureText(l2[1]).width) <= avail - 30) { lines = l2; break; }
        }
      }
      if (!lines) lines = [sp];
      var bw = Math.max.apply(null, lines.map(function (s2) { return g.measureText(s2).width; })) + 28;
      var bh = lines.length * (fs + 7) + 14;
      var x = inside ? fr.x + 10 : fr.r - bw, y = inside ? fr.y + (fr.h - bh) / 2 : fr.y - bh - 12;
      ART.shadow(g, x + bw / 2, y + bh + 4, bw * 0.5, 6, 0.25);
      ART.rrect(g, x, y, bw, bh, 12); g.fillStyle = '#fff'; g.fill();
      g.beginPath();
      if (inside) { g.moveTo(x + 1, y + bh / 2 - 8); g.lineTo(x - 12, y + bh / 2); g.lineTo(x + 1, y + bh / 2 + 8); }
      else { g.moveTo(x + 30, y + bh - 1); g.lineTo(x + 42, y + bh + 12); g.lineTo(x + 54, y + bh - 1); }
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1.5; ART.rrect(g, x, y, bw, bh, 12); g.stroke();
      lines.forEach(function (s2, k) { g.fillStyle = '#2d2219'; g.fillText(s2, x + 14, y + 7 + (fs + 7) * (k + 0.5)); });
      g.restore();
    });
  }
  function drawPops() {
    R.pops.forEach(function (p) {
      if (p.t < 0) return;
      var a = p.t < 0.15 ? p.t / 0.15 : Math.max(0, 1 - (p.t - 0.9) / 0.6);
      var sz = p.big === 2 ? 90 : p.big ? 64 : p.coin ? 40 : 50, sc2 = p.t < 0.15 ? 0.6 + p.t / 0.15 * 0.5 : 1.1 - Math.min(0.1, (p.t - 0.15));
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y - p.t * 50); g.scale(sc2, sc2);
      g.font = '400 ' + sz + 'px "YeonSung","Ria",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = sz * 0.16; g.strokeStyle = 'rgba(40,20,5,.85)'; g.lineJoin = 'round';
      var s = p.coin ? '🪙 ' + p.s : p.s;
      g.strokeText(s, 0, 0); g.fillStyle = p.c; g.fillText(s, 0, 0);
      g.restore();
    });
  }
  function drawBanner(t) {
    if (R.phase !== 'intro') return;
    var b = R.banner;
    if (b < 1.5) {
      var a = b < 0.25 ? b / 0.25 : b > 1.2 ? (1.5 - b) / 0.3 : 1;
      g.save(); g.globalAlpha = Math.max(0, a);
      g.fillStyle = 'rgba(20,12,6,.45)'; g.fillRect(-2000, 360, 6000, 170);
      g.font = '400 120px "YeonSung","Ria",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 14; g.strokeStyle = '#5a2a10'; g.lineJoin = 'round';
      var s = T.dayN(S.day), sc2 = 1 + Math.max(0, 0.25 - b) * 1.2;
      g.translate(VW / 2, 448); g.scale(sc2, sc2);
      g.strokeText(s, 0, 0); g.fillStyle = '#ffd98a'; g.fillText(s, 0, 0);
      g.restore();
      return;
    }
    var ci = Math.floor((b - 1.5) / 2.1), cb = (b - 1.5) - ci * 2.1, mi = R.newCards[ci];
    if (mi == null) return;
    var a2 = cb < 0.25 ? cb / 0.25 : cb > 1.8 ? (2.1 - cb) / 0.3 : 1;
    g.save(); g.globalAlpha = Math.max(0, a2);
    g.fillStyle = 'rgba(20,12,6,.55)'; g.fillRect(-2000, -2000, 6000, 6000);
    var cx = VW / 2, cy = 470, pop = 0.8 + 0.2 * ease(cb / 0.3);
    g.translate(cx, cy); g.scale(pop, pop);
    // 빛줄기
    g.save(); g.rotate(t * 0.4);
    for (var k = 0; k < 12; k++) { g.rotate(PI / 6); g.fillStyle = 'rgba(255,220,120,.10)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-40, -420); g.lineTo(40, -420); g.fill(); }
    g.restore();
    var layers = [{ k: 'bun_b' }].concat(MENUS[mi].L.map(function (k) { return { k: k, s: [0.95, 0.95], melt: 1 }; }), [{ k: 'bun_t', lift: 0.3 }]);
    var Rr = MENUS[mi].L.length > 8 ? 80 : 110;
    ART.board(g, 0, 90, Rr * 1.3, Rr * 0.55);
    ART.stack(g, layers, 0, 84, Rr, t);
    g.font = '400 58px "YeonSung","Ria",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = '#5a2a10'; g.lineJoin = 'round';
    g.strokeText(T.newMenu, 0, -300); g.fillStyle = '#ff7a4a'; g.fillText(T.newMenu, 0, -300);
    g.font = '400 64px "Ria",sans-serif';
    g.strokeText(T.menus[mi], 0, 190); g.fillStyle = '#fff3d6'; g.fillText(T.menus[mi], 0, 190);
    g.restore();
  }
  // 첫날만 — 다음에 누를 곳이 살짝 빛난다
  function drawHint(t) {
    if (S.day !== 1 || S.played > 0 || R.phase !== 'play') return;
    var o = selOrder(); if (!o || R.servings.length) return;
    var target = null;
    var cooking = R.slots.filter(function (s) { return s.st === 'cook'; });
    var beefIn = BD().stack.some(function (L) { return L.k === 'beef'; });
    if (!beefIn && !cooking.length) { var rb = LAY.raw[0]; target = { x: rb.x + rb.w / 2, y: rb.y + rb.d / 2, r: 80 }; }
    else if (cooking.length) {
      for (var i = 0; i < slotN(); i++) {
        var s = R.slots[i]; if (s.st !== 'cook' || s.flipT < 1) continue;
        var z = ZONE[o.done || 'medium'], v = s.flipped ? s.b : s.a;
        if (v >= z[0] + 0.05) { target = { x: LAY.slots[i].x, y: LAY.slots[i].y + 10, r: 76 }; break; }
      }
    } else {
      var have = {}; BD().stack.forEach(function (L) { have[L.k] = (have[L.k] || 0) + 1; });
      var miss = o.need.filter(function (e) { return !have[e.k]; })[0];
      if (miss) {
        var pn = LAY.pans.filter(function (p) { return p.k === miss.k; })[0], bt = LAY.bottles.filter(function (p) { return p.k === miss.k; })[0];
        if (pn) target = { x: pn.x + pn.w / 2, y: pn.y + pn.d / 2, r: 66 };
        if (bt) target = { x: bt.x, y: bt.y - 70, r: 62 };
      } else target = { x: LAY.buns.x + LAY.buns.w / 2, y: LAY.buns.y + 50, r: 110 };
    }
    if (!target) return;
    var a = 0.35 + 0.3 * Math.sin(t * 5);
    g.save(); g.strokeStyle = 'rgba(255,214,90,' + a + ')'; g.lineWidth = 7;
    g.beginPath(); g.ellipse(target.x, target.y, target.r * (1 + 0.05 * Math.sin(t * 5)), target.r * 0.62, 0, 0, PI * 2); g.stroke();
    g.restore();
  }

  // ---------- 입력 ----------
  function inBox(x, y, b, pad) { pad = pad || 0; return x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + (b.d || b.h) + (b.lip || 0) + pad; }
  function tap(x, y) {
    if (R.phase !== 'play' && R.phase !== 'intro') return;
    if (R.paused) return;
    SND.unlock();
    var i;
    // 주문표
    if (y < 300) {
      for (i = 0; i < LAY.cards.length; i++) {
        var C = LAY.cards[i], co = R.boards[i].o;
        if (x >= C.x && x <= C.x + C.w && y >= C.y - 16) {
          R.act = i; if (co && co.st === 'wait') co.bubble = bubLen(co); SND.play('click'); return;
        }
      }
      return;
    }
    for (i = 0; i < slotN(); i++) {
      var P = LAY.slots[i];
      if (R.slots[i].st === 'cook' && Math.pow((x - P.x) / 70, 2) + Math.pow((y - P.y - 10) / 52, 2) <= 1) { tapSlot(i); return; }
    }
    for (i = 0; i < basketN(); i++) {
      var B = LAY.baskets[i];
      if (Math.abs(x - B.x) < 60 && y > B.y - 120 && y < B.y + 180 && R.baskets[i].st === 'cook') { tapBasket(i); return; }
    }
    if (S.up.fryer && inBox(x, y, LAY.warmer)) { tapWarmer(); return; }
    for (i = 0; i < LAY.raw.length; i++) if (inBox(x, y, LAY.raw[i], 4)) { tapRaw(LAY.raw[i].k); return; }
    if (inBox(x, y, LAY.trash, 10)) { tapTrash(); return; }
    for (i = 0; i < LAY.bottles.length; i++) {
      var bt = LAY.bottles[i];
      if (Math.abs(x - bt.x) < 38 && y > bt.y - bt.h - 10 && y < bt.y + 10) { tapSauce(bt.k); return; }
    }
    for (i = 0; i < LAY.pans.length; i++) if (inBox(x, y, LAY.pans[i], 5)) { tapTop(LAY.pans[i].k); return; }
    for (i = 0; i < LAY.boards.length; i++) {
      var bl = LAY.boards[i];
      if (Math.abs(x - bl.x) <= bl.rx + 8 && y >= Math.max(LAY.buns.y + LAY.buns.d + 8, stackTopY(i) - 30) && y <= bl.y + 70) {
        if (R.act !== i) { R.act = i; SND.play('click'); }
        return;
      }
    }
    if (inBox(x, y, LAY.buns, 6)) { tapBuns(); return; }
  }
  cv.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    tap((e.clientX - ox) / sc, (e.clientY - oy) / sc);
  });

  // ---------- 화면 글·패널 ----------
  var $ = function (id) { return document.getElementById(id); };
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  var shownCoin = 0;
  function hud() {
    $('day').textContent = T.dayN(S.day);
    $('cust').textContent = Math.max(0, R.spawned - R.orders.filter(function (o) { return o.st === 'wait' || o.st === 'eat'; }).length) + '/' + (R.dayN || dayCustomers());
    $('shopDot').hidden = !UP.some(function (u2) { var l = S.up[u2.id]; return l < u2.cost.length && (!u2.req || S.up[u2.req]) && S.coin >= u2.cost[l]; });
  }
  function hudTick() {
    if (shownCoin !== S.coin) {
      var d = S.coin - shownCoin;
      shownCoin += Math.abs(d) < 2 ? d : d * 0.18;
      if (Math.abs(S.coin - shownCoin) < 1) shownCoin = S.coin;
      $('coin').textContent = fmt(shownCoin);
    }
  }

  var UI = {
    sheet: null,
    open: function () { return !!UI.sheet || R.phase === 'end'; },
    showShop: function () {
      UI.sheet = 'shop'; $('sTitle').textContent = T.shop; renderShop(); $('sheet').classList.add('on');
    },
    showBook: function () {
      UI.sheet = 'book'; $('sTitle').textContent = T.book; renderBook(); $('sheet').classList.add('on');
    },
    close: function () { UI.sheet = null; $('sheet').classList.remove('on'); hud(); },
    showEnd: function (day, avg, coins, rankUp) {
      $('endTitle').textContent = T.dayEnd(day);
      var st = ''; for (var i = 1; i <= 5; i++) st += '<span' + (avg >= i - 0.25 ? '' : ' class="dim"') + '>★</span>';
      $('endStars').innerHTML = st;
      $('endCoin').textContent = '+' + fmt(coins);
      $('endRank').hidden = rankUp < 0;
      if (rankUp >= 0) $('endRank').textContent = T.ranks[rankUp];
      $('end').classList.add('on');
      if (rankUp >= 0) setTimeout(function () { SND.play('rise'); }, 700);
      hud();
    }
  };
  function renderShop() {
    $('sCoin').textContent = fmt(S.coin);
    var h = '';
    var nxt = S.rank + 1 < RANK_AT.length ? S.rank + 1 : -1;
    if (nxt > 0) {
      var f = Math.min(1, S.total / RANK_AT[nxt]);
      h += '<div class="row goal"><div class="ic">🏪</div><div class="tx"><div class="nm">' + T.ranks[nxt] + '</div>' +
        '<div class="gbar"><span style="width:' + (f * 100).toFixed(1) + '%"></span></div></div><div class="gnum">' + fmt(S.total) + ' / ' + fmt(RANK_AT[nxt]) + '</div></div>';
    }
    UP.forEach(function (u2) {
      if (u2.req && !S.up[u2.req]) return;
      var l = S.up[u2.id], mx = l >= u2.cost.length, cost = mx ? 0 : u2.cost[l];
      var lv = u2.cost.length > 1 ? l + ' / ' + u2.cost.length : '';
      h += '<div class="row"><div class="ic">' + u2.ic + '</div><div class="tx"><div class="nm">' + T.up[u2.id] + '</div><div class="lv">' + lv + '</div></div>' +
        (mx ? '<button class="buy mx" disabled>' + T.max + '</button>'
          : '<button class="buy" data-up="' + u2.id + '"' + (S.coin < cost ? ' disabled' : '') + '>🪙 ' + fmt(cost) + '</button>') + '</div>';
    });
    $('sBody').innerHTML = h;
    $('sBody').querySelectorAll('[data-up]').forEach(function (b) {
      b.onclick = function () {
        var u2 = UP.filter(function (q) { return q.id === b.getAttribute('data-up'); })[0], l = S.up[u2.id];
        if (l >= u2.cost.length || S.coin < u2.cost[l]) return;
        S.coin -= u2.cost[l]; S.up[u2.id]++; save(); SND.play('buy'); renderShop(); hud();
      };
    });
  }
  function renderBook() {
    $('sCoin').textContent = fmt(S.coin);
    var h = '<div class="dexg">';
    MENUS.forEach(function (m, i) {
      var open = avail(i) || S.best[i] > 0;
      var st = ''; for (var k = 1; k <= 5; k++) st += '<span' + (S.best[i] >= k ? '' : ' class="dim"') + '>★</span>';
      h += '<div class="dex' + (open ? '' : ' lock') + (S.best[i] === 5 ? ' gold' : '') + '"><canvas width="170" height="215" data-mi="' + i + '"></canvas>' +
        '<div class="nm">' + (open ? T.menus[i] : T.lock) + '</div>' +
        '<div class="pr">' + (open ? '🪙 ' + m.price : T.dayN(m.day)) + '</div>' +
        (open ? '<div class="st">' + st + '</div>' : '') + '</div>';
    });
    $('sBody').innerHTML = h + '</div>';
    $('sBody').querySelectorAll('canvas[data-mi]').forEach(function (c) {
      var i = +c.getAttribute('data-mi'), gg = c.getContext('2d'), m = MENUS[i];
      var layers = [{ k: 'bun_b' }].concat(m.L.map(function (k) { return { k: k, s: [0.95, 0.95], melt: 1 }; }), [{ k: 'bun_t', lift: 0.35 }]);
      var Rr = m.L.length > 8 ? 30 : 42;
      ART.shadow(gg, 85, 128, 60, 12, 0.45);
      ART.stack(gg, layers, 85, 124, Rr, 1);
      var open2 = avail(i) || S.best[i] > 0;
      if (!open2) { gg.globalCompositeOperation = 'source-atop'; gg.fillStyle = '#1b1f28'; gg.fillRect(0, 0, 170, 215); gg.globalCompositeOperation = 'source-over'; return; }
      // 레시피 그림 — 아래층부터
      var per = m.L.length <= 6 ? m.L.length : 7, st2 = 168 / Math.max(per, 4), isz = Math.min(38, st2 - 3);
      m.L.forEach(function (k, j) {
        var row = Math.floor(j / per), inRow = Math.min(per, m.L.length - row * per);
        var cx = 85 + (j % per - (inRow - 1) / 2) * st2, cy = 158 + row * 32;
        gg.fillStyle = 'rgba(255,255,255,.85)'; gg.beginPath(); gg.arc(cx, cy + 1, isz * 0.52, 0, Math.PI * 2); gg.fill();
        ART.icon(gg, k, cx, cy, isz, null);
      });
    });
  }

  $('bShop').onclick = function () { SND.play('click'); UI.showShop(); };
  $('bBook').onclick = function () { SND.play('click'); UI.showBook(); };
  $('bClose').onclick = function () { UI.close(); };
  $('endShop').onclick = function () { UI.showShop(); };
  // 엔딩 — 메뉴 12가지 전부 별 다섯 + 가게가 버거 명가. 엔딩 뒤엔 이어하지 않는다(새로 하기만)
  function endingReady() { return S.best.every(function (b) { return b >= 5; }) && S.rank >= RANK_AT.length - 1; }
  function startEnding() {
    S.ending = 1; save();
    R.phase = 'ending'; R.endT = 0; R.endLit = 0;
    R.endCust = []; for (var i = 0; i < 12; i++) R.endCust.push({ skin: rnd(4), hair: rnd(7), style: rnd(6), shirt: rnd(8), glasses: Math.random() < 0.25, kid: Math.random() < 0.15, seed: Math.random() * 99 });
    document.body.classList.remove('playing');
    try { document.fonts.load('118px Gaegu', T.en ? 'KINGWANGZZANG' : '킹왕짱버거'); } catch (e) {}
    if (window.OG) OG.over({ result: 'ENDING', score: S.total, day: S.day - 1 });
    SND.play('clear');
  }
  $('endNext').onclick = function () { $('end').classList.remove('on'); UI.close(); if (!S.ending && endingReady()) startEnding(); else beginDay(); };
  $('endingGo').onclick = function () {
    $('endingGo').hidden = true;
    try { localStorage.removeItem(KEY); } catch (e) {}
    S = fresh(); save(); shownCoin = 0; $('coin').textContent = '0';
    start();
  };
  $('tPause').onclick = function () { R.paused = !R.paused; $('tPause').classList.toggle('off', R.paused); $('pauseCover').hidden = !R.paused; };
  $('pauseCover').onclick = function () { $('tPause').onclick(); };
  $('tSnd').onclick = function () { $('tSnd').classList.toggle('off', !SND.toggle()); };
  $('tMus').onclick = function () { $('tMus').classList.toggle('off', !SND.toggleMusic()); };

  function start() {
    SND.unlock();
    if (S.ending) { try { localStorage.removeItem(KEY); } catch (e) {} S = fresh(); save(); shownCoin = 0; $('coin').textContent = '0'; }
    $('title').classList.add('off');
    R.boards = [{ stack: [], carton: null, o: null }, { stack: [], carton: null, o: null }]; R.act = 0; R.slots = LAY.slots.map(function () { return { st: 'empty' }; });
    document.body.classList.add('playing');
    SND.bgm(true);
    beginDay();
  }
  $('start').onclick = start;
  // 새로 하기 — 한 번 더 눌러야 지운다
  var resetArm = 0;
  $('reset').onclick = function () {
    if (!resetArm) {
      resetArm = setTimeout(function () { resetArm = 0; $('reset').classList.remove('arm'); $('reset').textContent = T.fresh; }, 3000);
      $('reset').classList.add('arm'); $('reset').textContent = T.freshSure; SND.play('click');
      return;
    }
    clearTimeout(resetArm); resetArm = 0;
    try { localStorage.removeItem(KEY); } catch (e) {}
    S = fresh(); save(); shownCoin = 0; $('coin').textContent = '0';
    start();
  };

  // ---------- 루프 ----------
  var last = 0;
  function frame(ts) {
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    update(dt); draw(); hudTick();
    requestAnimationFrame(frame);
  }
  // 폰은 눕혀서 한다
  if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('touch');
  var skipRot = false;
  function orient() {
    document.body.classList.toggle('portrait', !skipRot && innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
  }
  $('rotGo').addEventListener('click', function () { if (window.OL) OL.go(); });
  $('rotSkip').addEventListener('click', function (e) { e.preventDefault(); skipRot = true; orient(); });
  orient();
  window.addEventListener('resize', function () { layout(); draw(); orient(); });
  window.addEventListener('orientationchange', function () { setTimeout(function () { layout(); draw(); orient(); }, 150); });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });

  load(); newRun(); layout();
  shownCoin = S.coin; $('coin').textContent = fmt(S.coin);
  if (S.ending) $('start').textContent = T.fresh;           // 엔딩을 본 저장은 이어하지 않고 새로 시작
  else if (S.played > 0 || S.coin > 0) { $('start').textContent = T.cont; $('reset').hidden = false; }
  $('tSnd').classList.toggle('off', !SND.on());
  $('tMus').classList.toggle('off', !SND.musicOn());
  R.dayN = dayCustomers(); hud();
  // 타이틀 뒤에는 다 만든 버거가 도마에 올라 있다
  R.boards[0].stack = ['bun_b', 'beef', 'cheese', 'bacon', 'lettuce', 'tomato', 'onion', 'ketchup', 'bun_t'].map(function (k) { return { k: k, s: [0.95, 1.0], melt: 1 }; });
  R.boards[1].stack = ['bun_b', 'beef', 'cheese', 'beef', 'cheese', 'pickle', 'mustard', 'bun_t'].map(function (k) { return { k: k, s: [0.95, 1.0], melt: 1 }; });
  R.slots[0] = { st: 'cook', type: 'beef', a: 0.9, b: 0.2, flipped: true, flipT: 1, seed: 7 };
  R.slots[1] = { st: 'cook', type: 'beef', a: 0.45, b: 0, flipped: false, flipT: 1, seed: 12 };
  requestAnimationFrame(frame);

  // 시험 손잡이
  window.__bg = {
    S: function () { return S; }, R: function () { return R; }, LAY: LAY, MENUS: MENUS,
    start: start, tap: tap, judge: judge, makeOrder: makeOrder,
    tick: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); draw(); hudTick(); },
    step: function (n, dt) { for (var i = 0; i < (n || 1); i++) update(dt || 1 / 60); },
    draw: draw, layout: layout, save: save,
    reset: function () { S = fresh(); newRun(); save(); },
    setDay: function (d) { S.day = d; }, give: function (c) { S.coin += c; S.total += c; hud(); },
    ui: UI,
    ending: function () { S.best = S.best.map(function () { return 5; }); S.rank = RANK_AT.length - 1; startEnding(); }
  };
})();
