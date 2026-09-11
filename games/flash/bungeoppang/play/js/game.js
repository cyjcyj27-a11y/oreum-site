// 붕어빵 장사 — 방치형. 그림은 전부 코드, 소리는 코드 + assets/*.mp3 몇 개
(function () {
  var KEY = 'bungeoppang.prog';
  var cv = document.getElementById('cv'), g = cv.getContext('2d');
  var F = ART.FLAVORS;

  // ---------- 설비 ----------
  var HOLE_N = [4, 6, 8, 10, 12, 15, 18, 21, 24];
  var POT_N  = [6, 8, 10, 13, 16, 20, 24, 28, 32];
  var UP = {
    hole: { max: 8, cost: function (l) { return Math.round(40 * Math.pow(4.6, l)); } },
    fire: { max: 8, cost: function (l) { return Math.round(30 * Math.pow(4.2, l)); } },
    auto: { max: 8, cost: function (l) { return Math.round(150 * Math.pow(4.4, l)); } },
    tong: { max: 8, cost: function (l) { return Math.round(260 * Math.pow(4.4, l)); } },
    dtub: { max: 9, cost: function (l) { return Math.round(25 * Math.pow(3.8, l)); } },
    ptub: { max: 9, cost: function (l) { return Math.round(25 * Math.pow(3.8, l)); } },
    reg:  { max: 9, cost: function (l) { return Math.round(500 * Math.pow(5.2, l)); } },
    pot:  { max: 8, cost: function (l) { return Math.round(60 * Math.pow(4.5, l)); } },
    broth:{ max: 9, cost: function (l) { return Math.round(120 * Math.pow(4.8, l)); } },
    word: { max: 9, cost: function (l) { return Math.round(90 * Math.pow(4.6, l)); } },
    ftub: { max: 9, cost: function (l) { return Math.round(30 * Math.pow(3.8, l)); } }
  };
  var FL_COST = [0, 60, 800, 10000, 130000, 1.6e6, 1.9e7, 2.2e8];
  // 승급 관문 — 누적 매출(코인). 지금 화면에 보이는 포장마차가 1단계(기본)다
  var RANK_AT = [0, 2000, 10000];

  function cookTime() { return Math.max(1.1, 6 * Math.pow(0.82, S.fire)); }
  function tubCap(l) { return Math.round(24 * Math.pow(1.55, l)); }
  function price() { return Math.round(F[S.flavor].price * (1 + S.reg * 0.35)); }
  function stockCost(n) { return Math.max(1, Math.round(n * F[S.flavor].price * 0.10)); }
  function odengPrice() { return Math.max(1, Math.round(price() * 0.6 * (1 + S.broth * 0.4))); }
  function fishCost(n) { return Math.max(1, Math.round(n * odengPrice() * 0.2)); }
  function guestGap() { return 5.2 * Math.pow(0.82, S.word); }
  function pourRate() { return S.auto ? 2.6 * Math.pow(0.76, S.auto - 1) : 0; }
  function tongRate() { return S.tong ? 3.0 * Math.pow(0.76, S.tong - 1) : 0; }

  // ---------- 실제 크기 (cm) ----------
  // 좌판 위 물건을 전부 이 자로 잰다 — 붕어빵과 오뎅이 실물 비율 그대로 나란히 놓인다
  var BREAD_L = 13;                                      // 붕어빵 길이
  var MOLD_W = 15, MOLD_D = 8.8, GRIM = 3.0;             // 틀 한 칸 간격 · 판 테두리
  var PAN_W = 46, PAN_D = 34;                            // 오뎅 통
  var TILL_W = 24, TILL_D = 17, TILL_H = 11;             // 돈통 (투명 상자 — 깊이·높이)
  var GAP_CM = 4.5;                                      // 물건 사이
  var SQ = 0.78;                                         // 비스듬히 내려다본 만큼 깊이가 눌린다

  // ---------- 상태 ----------
  var S, slots = [], cats = [], lumps = [], snow = [], snowN = [], acc = { pour: 0, tong: 0 };
  var sticks = 0, guests = [], guestAt = 3;              // 냄비에 꽂힌 오뎅 수 · 손님
  var W = 0, H = 0, gd = { x: 0, y: 0, w: 0, h: 0, cw: 0, ch: 0, cols: 2, cm: 6 };
  var pn = { x: 0, y: 0, w: 0, h: 0 };                   // 오뎅 통
  var tl = { x: 0, y: 0, w: 0, h: 0 };                   // 돈통
  var till = 0, flies = [];                              // 돈통에 쌓인 돈 · 날아가는 동전
  var running = false, tPrev = 0, tNow = 0, dtNow = 0, saveAt = 0, rankShown = -1, demo = false;

  function fresh() {
    return { coin: 0, total: 0, rank: 0, flavor: 0, dex: [1, 0, 0, 0, 0, 0, 0, 0],
      hole: 0, fire: 0, auto: 0, tong: 0, dtub: 0, ptub: 0, reg: 0,
      pot: 0, broth: 0, word: 0, ftub: 0, fish: 12, stick: 0, till: 0,
      dough: 24, paste: 24, seen: Date.now() };
  }
  function load() {
    S = fresh();
    try {
      var r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && typeof r === 'object') for (var k in S) if (typeof r[k] === typeof S[k]) S[k] = r[k];
      if (!Array.isArray(S.dex) || S.dex.length !== 8) S.dex = [1, 0, 0, 0, 0, 0, 0, 0];
      S.rank = Math.max(0, Math.min(RANK_AT.length - 1, S.rank));   // 단계가 줄어든 옛 저장 맞추기
      S.fish = Math.min(S.fish, tubCap(S.ftub));
      S.dough = Math.min(S.dough, tubCap(S.dtub));
      S.paste = Math.min(S.paste, tubCap(S.ptub));
      return !!r;
    } catch (e) { return false; }
  }
  function save() {
    S.seen = Date.now(); S.stick = sticks; S.till = till;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  function rebuildSlots() {
    var n = HOLE_N[S.hole], old = slots;
    slots = [];
    for (var i = 0; i < n; i++) slots.push(old[i] || { st: 'empty', p: 0, fi: S.flavor, pop: 0, gold: false });
  }

  // ---------- 그릴 자리 ----------
  function layout() {
    var dpr = Math.min(2.5, window.devicePixelRatio || 1);
    var de = document.documentElement;
    W = window.innerWidth || de.clientWidth || 360;      // 숨은 창·iframe 에서 0 이 오는 것 막기
    H = window.innerHeight || de.clientHeight || 640;
    W = Math.max(240, W); H = Math.max(320, H);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var want = Math.max(220, Math.min(520, Math.round(W * H / 2100)));
    if (snow.length !== want) snow = ART.snowInit(want, W, H);
    var wantN = Math.max(8, Math.min(22, Math.round(W * H / 44000)));
    if (snowN.length !== wantN) snowN = ART.snowNearInit(wantN, W, H);

    // 붕어빵 13cm, 틀 한 칸 15cm, 오뎅 통 46x34cm, 돈통 24cm —
    // 전부 같은 cm 자로 재서 한 좌판에 나란히 놓는다 (실제 크기 비교)
    var n = HOLE_N[S.hole];
    var dockH = 92;
    var tentH = Math.round(Math.max(52, Math.min(112, H * 0.105)));
    var frontY = H - dockH - 4;                          // 좌판 앞턱 — 단추 바로 위
    var streetMin = Math.max(H * 0.20, 96);              // 밖이 보이는 만큼은 남긴다
    var availW = Math.min(W * 0.98, 1400);
    var availH = Math.max(H * 0.16, frontY - tentH - streetMin);

    // 가로로 넓으면 판과 통을 나란히, 세로로 긴 폰이면 통을 판 뒤에 놓는다
    var stack = W < H * 0.95;
    // 실제 붕어빵 틀은 두세 줄까지만 깊다 — 그보다 깊어지면 판이 아니라 상자가 된다
    var best = null;
    for (var r1 = 1; r1 <= 3; r1++) {
      var c = Math.ceil(n / r1), r0 = Math.ceil(n / c);
      var gwc = c * MOLD_W + GRIM * 2, gdc = r0 * MOLD_D + GRIM * 2;
      var totW = stack ? Math.max(gwc, PAN_W + GAP_CM + TILL_W)
        : gwc + GAP_CM + PAN_W + GAP_CM * 0.8 + TILL_W;
      var totD = stack ? gdc + GAP_CM + PAN_D : Math.max(gdc, PAN_D);
      var cm0 = Math.min(availW / totW, availH / (totD * SQ));
      if (!best || cm0 > best.cm) best = { cm: cm0, cols: c, rows: r0, gwc: gwc, gdc: gdc };
    }
    var cm = Math.max(1.4, best.cm);
    gd.cm = cm; gd.cols = best.cols; gd.rows = best.rows;
    gd.cw = MOLD_W * cm; gd.ch = MOLD_D * SQ * cm; gd.rim = GRIM * SQ * cm;
    gd.w = best.gwc * cm; gd.h = best.gdc * SQ * cm;
    gd.br = BREAD_L * 0.5 * cm;                          // 붕어빵 반 길이

    var gapPx = GAP_CM * cm;
    pn.w = PAN_W * cm; pn.h = PAN_D * SQ * cm;
    tl.w = TILL_W * cm;                                  // 돈통은 서 있는 상자다 —
    tl.h = (TILL_D * SQ + TILL_H) * cm;                  // 눌린 입구 + 앞벽 높이
    gd.y = frontY - gd.h;                                // 붕어빵 판은 늘 앞턱에 붙는다
    if (stack) {
      gd.x = (W - gd.w) / 2;
      var backW = pn.w + gapPx + tl.w, backY = gd.y - gapPx * SQ;
      pn.x = (W - backW) / 2; pn.y = backY - pn.h;
      tl.x = pn.x + pn.w + gapPx; tl.y = backY - tl.h;
      gd.counter = W / 2;
    } else {
      var total = gd.w + gapPx + pn.w + gapPx * 0.8 + tl.w;
      gd.x = (W - total) / 2;
      pn.x = gd.x + gd.w + gapPx; pn.y = frontY - pn.h;
      tl.x = pn.x + pn.w + gapPx * 0.8; tl.y = frontY - tl.h;
      gd.counter = gd.x + total / 2;                     // 좌판 한가운데
    }

    gd.tent = tentH;
    gd.top = Math.min(gd.y, pn.y) - Math.max(6, cm * 1.5);   // 좌판이 시작하는 선
    gd.horizon = tentH + (gd.top - tentH) * 0.66;        // 눈길이 시작하는 선
  }
  function lumpPos(o) {
    return { x: gd.x + gd.w * (0.1 + o.u * 0.8), y: gd.y + gd.h * (0.1 + o.v * 0.8) };
  }
  function slotPos(i) {
    var n = HOLE_N[S.hole], c = i % gd.cols, r = (i / gd.cols) | 0;
    var inRow = Math.min(gd.cols, n - r * gd.cols);      // 덜 찬 마지막 줄은 가운데로
    var v = gd.rows > 1 ? r / (gd.rows - 1) : 1;         // 0 뒤줄 ~ 1 앞줄
    var k = 0.90 + v * 0.12;                             // 앞줄이 조금 크게 — 비스듬히 본 만큼
    return { x: gd.x + gd.w / 2 + (c - (inRow - 1) / 2) * gd.cw * k,
      y: gd.y + gd.rim + gd.ch * (r + 0.5), k: k };
  }

  // ---------- 숫자 ----------
  function unit(v, d, s) { var x = v / d; return (x >= 100 ? Math.round(x) : +x.toFixed(1)) + s; }
  function fmt(v) {
    v = Math.floor(v);
    if (T.en) {
      if (v >= 1e12) return unit(v, 1e12, 'T');
      if (v >= 1e9) return unit(v, 1e9, 'B');
      if (v >= 1e6) return unit(v, 1e6, 'M');
      if (v >= 1e5) return unit(v, 1e3, 'K');
    } else {
      if (v >= 1e12) return unit(v, 1e12, '조');
      if (v >= 1e8) return unit(v, 1e8, '억');
      if (v >= 1e4) return unit(v, 1e4, '만');
    }
    return v.toLocaleString('en-US');
  }

  // ---------- 떠오르는 글 ----------
  var pops = document.getElementById('pops');
  function pop(x, y, txt, big) {
    var e = document.createElement('div');
    e.className = 'pop' + (big ? ' big' : ''); e.textContent = txt;
    e.style.left = x + 'px'; e.style.top = y + 'px';
    pops.appendChild(e); setTimeout(function () { e.remove(); }, 1100);
  }

  // ---------- 상단바 ----------
  var elCoin = document.getElementById('coin'), elD = document.getElementById('dnum'),
      elP = document.getElementById('pnum'),
      barD = document.querySelector('#dbar>span'), barP = document.querySelector('#pbar>span'),
      shopDot = document.getElementById('shopDot'), elSCoin = document.getElementById('sCoin');
  var hudAt = 0;
  function hud() {
    elCoin.textContent = fmt(S.coin);
    elSCoin.textContent = fmt(S.coin);
    var dc = tubCap(S.dtub), pc = tubCap(S.ptub);
    elD.textContent = Math.floor(S.dough); elP.textContent = Math.floor(S.paste);
    barD.style.width = Math.min(100, S.dough / dc * 100) + '%';
    barP.style.width = Math.min(100, S.paste / pc * 100) + '%';
    shopDot.hidden = !canBuyAnything();
  }
  function canBuyAnything() {
    for (var k in UP) if (S[k] < UP[k].max && S.coin >= UP[k].cost(S[k])) return true;
    for (var i = 0; i < 8; i++) if (!S.dex[i] && S.coin >= FL_COST[i]) return true;
    return false;
  }

  // ---------- 굽기 ----------
  function pour(i) {
    var s = slots[i];
    if (s.st !== 'empty') return false;
    if (S.dough < 1 || S.paste < 1) return false;
    S.dough -= 1; S.paste -= 1;
    s.st = 'cook'; s.p = 0; s.fi = S.flavor; s.gold = Math.random() < 0.015;
    return true;
  }
  function take(i, byHand) {
    var s = slots[i];
    if (s.st !== 'ready') return false;
    var v = price() * (s.gold ? 20 : 1);
    S.coin += v; S.total += v; s.st = 'empty'; s.p = 0; s.pop = 1;
    if (byHand) {
      var q = slotPos(i);
      pop(q.x, q.y, '+' + fmt(v), s.gold);
    }
    SND.play(s.gold ? 'big' : 'sell');                   // 자동 집게로 거둬도 동전 소리는 난다
    s.gold = false;
    return true;
  }

  // ---------- 오뎅 ----------
  function potN() { return POT_N[S.pot]; }
  function tillMax() { return odengPrice() * Math.max(8, potN() * 1.5); }
  function fillPot() {                                   // 냄비를 탭하면 되는 만큼 꽂는다
    var room = potN() - sticks, n = Math.min(room, Math.floor(S.fish));
    if (n <= 0) return 0;
    sticks += n; S.fish -= n; return n;
  }

  // ---------- 손님 ----------
  // 사람 170cm, 좌판 80cm — 현실 비례로 그리면 화면에 다 안 들어온다.
  // 그래서 키는 크게 두되 좌판 뒤로 내려 세워 상반신만 보이게 한다
  function guestH() {
    var street = Math.max(40, gd.top - gd.tent);
    return Math.max(90, Math.min(300, street * 1.35));
  }
  function guestY() { return gd.top + guestH() * 0.34; }             // 좌판이 아랫도리를 가린다
  function guestSpots() {
    var q = guests.filter(function (o) { return o.st !== 'leave'; });
    var h0 = guestH(), sp = h0 * 0.50;
    var mid = h0 * 0.32;                                             // 가운데는 비운다 — 밖이 보이게
    var lo = gd.x + h0 * 0.20, hi = tl.x + tl.w - h0 * 0.20;
    for (var k = 0; k < q.length; k++) {
      var side = (k % 2) ? 1 : -1, idx = (k / 2) | 0;
      var tx = gd.counter + side * (mid + idx * sp);
      q[k].tx = hi > lo ? Math.max(lo, Math.min(hi, tx)) : gd.counter;
    }
  }
  function guestTick(dt) {
    guestAt -= dt;
    if (guestAt <= 0) {
      guestAt = guestGap() * (0.65 + Math.random() * 0.7);
      if (guests.length < 7) {
        var dir = Math.random() < 0.5 ? 1 : -1;          // 1 = 왼쪽에서 옴
        var h1 = guestH();
        guests.push({ x: dir > 0 ? -h1 * 0.6 : W + h1 * 0.6, dir: dir, st: 'walk', t: 0, ph: 0,
          i: (Math.random() * 997) | 0, h: h1, tx: gd.counter });
      }
    }
    guestSpots();
    for (var f = flies.length - 1; f >= 0; f--) {         // 손님이 던진 돈이 돈통으로
      var fo = flies[f]; fo.t += dt;
      if (fo.t >= fo.dur) {
        till += fo.v; flies.splice(f, 1); SND.play('sell');
      }
    }
    var sp2 = Math.max(guestH() * 1.3, W * 0.20);        // 걷는 빠르기
    for (var b = guests.length - 1; b >= 0; b--) {
      var o = guests[b]; o.t += dt; o.h = guestH();
      if (o.st === 'walk') {
        var d = o.tx - o.x, dir = d > 0 ? 1 : -1;
        o.x += dir * Math.min(Math.abs(d), sp2 * dt);
        o.ph += dt * 9; o.dir = dir;
        if (Math.abs(d) < 3) { o.st = 'buy'; o.t = 0; o.ph = 0; }
      } else if (o.st === 'buy') {
        if (o.t > 0.85) {
          if (sticks > 0 && !o.got) {                    // 오뎅 하나 사고 돈통에 돈을 넣는다
            sticks -= 1; o.got = true;
            var v = odengPrice();
            flies.push({ x: o.x, y: guestY() - o.h * 0.58, x0: o.x, y0: guestY() - o.h * 0.58,
              t: 0, dur: 0.55, v: v });
            // 여기선 소리를 내지 않는다 — 손님이 사 갈 때마다 울면 시끄럽다.
            // 동전이 돈통에 떨어질 때 'sell' 이 난다
          } else if (o.got ? o.t > 1.7 : o.t > 2.4) { o.st = 'leave'; o.t = 0; o.dir = -o.dir; }
        }
      } else {
        o.x += o.dir * sp2 * dt; o.ph += dt * 9;
        if (o.x < -70 || o.x > W + 70) guests.splice(b, 1);
      }
    }
  }

  // ---------- 길냥이 ----------
  // 젖소무늬 길냥이가 화면 왼쪽 아래에서 쑥 올라와 야옹 울고,
  // 앞발을 뻗어 붕어빵을 톡 친 다음 물고 도로 내려간다. 화면을 가로지르지 않는다
  function readyIdx() {
    var a = []; for (var i = 0; i < slots.length; i++) if (slots[i].st === 'ready') a.push(i);
    return a;
  }
  function catH() { return 25 * gd.cm; }                 // 어깨 높이 25cm
  var PAW_X = 0.76, PAW_Y = 1.16;                        // 뻗은 앞발 끝 (art.js A.cat 과 맞춰 둔다)
  var catAt = 15;
  function catTick(dt) {
    catAt -= dt;
    if (catAt <= 0) {
      catAt = 14 + Math.random() * 16;
      var r = readyIdx();
      if (r.length && !cats.length) {
        var h0 = catH();
        var want = Math.max(h0 * 0.60, W * 0.12) + h0 * PAW_X;   // 발이 닿는 자리
        var i = r[0], bd = -1e9, k;                              // 앞줄 · 발 닿는 데 가까운 것
        for (k = 0; k < r.length; k++) {
          var row = (r[k] / gd.cols) | 0;
          var sc0 = row * 1e6 - Math.abs(slotPos(r[k]).x - want);
          if (sc0 > bd) { bd = sc0; i = r[k]; }
        }
        cats.push({ i: i, face: 1, x: 0, y: H + h0 * 1.5,
          st: 'rise', t: 0, ph: 0, sit: 1, paw: 0, meow: 0, hold: -1 });
      }
    }
    for (var b = cats.length - 1; b >= 0; b--) {
      var o = cats[b]; o.t += dt;
      var p = slotPos(o.i), h = catH();
      o.tx = Math.max(h * 0.60, p.x - h * PAW_X);        // 앞발 끝이 붕어빵에 닿는 자리
      o.ty = p.y + h * PAW_Y;                            // 몸은 화면 아래로 반쯤 내려가 있다
      o.x = o.tx;
      if (o.st === 'rise') {                             // 아래에서 쑥 올라온다
        o.y += (o.ty - o.y) * Math.min(1, dt * 7);
        if (Math.abs(o.ty - o.y) < 3) { o.y = o.ty; o.st = 'call'; o.t = 0; SND.play('meow'); }
      } else if (o.st === 'call') {                      // 야옹
        o.y = o.ty;
        o.meow = o.t < 0.55 ? Math.sin(o.t / 0.55 * Math.PI) : 0;
        if (slots[o.i].st !== 'ready') { o.st = 'go'; o.t = 0; }
        else if (o.t > 1.05) { o.st = 'tap'; o.t = 0; }
      } else if (o.st === 'tap') {                       // 앞발로 톡
        o.y = o.ty; o.meow = 0;
        o.paw = Math.sin(Math.min(1, o.t / 0.50) * Math.PI);
        if (slots[o.i].st !== 'ready') { o.st = 'go'; o.t = 0; o.paw = 0; }
        else if (o.t > 0.50) {
          o.hold = slots[o.i].fi;                        // 물고 간다
          slots[o.i].st = 'empty'; slots[o.i].p = 0; slots[o.i].gold = false;
          o.st = 'go'; o.t = 0; o.paw = 0;
          SND.play('meow'); pop(p.x, p.y - gd.ch * 0.5, '!', false);
        }
      } else {                                           // 도로 내려간다
        o.y += Math.max(H * 0.55, h * 3.4) * dt;
        if (o.y > H + h * 1.7) cats.splice(b, 1);
      }
    }
  }

  // ---------- 오프라인 ----------
  function offline(gapSec) {
    // 시간을 보지 않는다 — 설비 개수만큼 한 판치 (규칙: idle-offline-design)
    var n = 0;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      s.st = 'ready'; s.p = 1; s.fi = S.flavor; s.gold = false; n++;
    }
    if (n && Math.random() < 0.15) slots[(Math.random() * n) | 0].gold = true;   // 15% 로 특별한 것
    lumps = [];
    till += sticks * odengPrice(); sticks = 0;           // 오뎅은 다 팔려 돈통에 쌓였다
    var k = 2 + ((Math.random() * 3) | 0);               // 밀린 일 — 쌓인 눈
    for (var j = 0; j < k; j++)
      lumps.push({ kind: 'snow', u: Math.random(), v: Math.random(), r: 0.5 + Math.random() * 0.5 });
    return n;
  }

  // ---------- 한 걸음 ----------
  function step(dt) {
    var ct = cookTime();
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      // 다 익어도 소리를 내지 않는다 — 틀이 스물넷이면 띵 소리가 끊이지 않는다 (사장님 요청)
      if (s.st === 'cook') { s.p += dt / ct; if (s.p >= 1) { s.p = 1; s.st = 'ready'; } }
      if (s.pop > 0) s.pop = Math.max(0, s.pop - dt * 3.4);
    }
    if (S.auto) {
      acc.pour += dt;
      var pr = pourRate();
      while (acc.pour >= pr) {
        acc.pour -= pr;
        var done = false;
        for (var a = 0; a < slots.length; a++) if (pour(a)) { done = true; break; }
        if (!done) { acc.pour = 0; break; }
      }
    }
    if (S.tong) {
      acc.tong += dt;
      var tr = tongRate();
      while (acc.tong >= tr) {
        acc.tong -= tr;
        var got = false;
        for (var b2 = 0; b2 < slots.length; b2++) if (take(b2, false)) { got = true; break; }
        if (!got) { acc.tong = 0; break; }
      }
    }
    catTick(dt); guestTick(dt);

    var want = 0;                                            // 승급
    for (var r = RANK_AT.length - 1; r >= 0; r--) if (S.total >= RANK_AT[r]) { want = r; break; }
    if (want > S.rank) { S.rank = want; showRank(want); }

    if (tNow - saveAt > 5) { saveAt = tNow; save(); }
    if (tNow - hudAt > 0.12) { hudAt = tNow; hud(); }
  }

  // ---------- 그리기 ----------
  // 오뎅 통 + 돈통. 판 뒤에 놓였을 때는 판보다 먼저 그려야 앞뒤가 맞는다
  function panTill() {
    ART.pan(g, pn.x, pn.y, pn.w, pn.h, demo ? potN() : sticks, potN(), tNow);
    if (!demo && sticks === 0) {                          // 통 비었음 — 글이 아니라 빨간 알림
      var nr = pn.h * 0.32;
      g.save();
      g.globalAlpha = 0.6 + Math.sin(tNow * 5) * 0.25;
      g.fillStyle = '#ff5b47';
      g.beginPath(); g.arc(pn.x + pn.w / 2, pn.y + pn.h * 0.5, nr, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = '700 ' + Math.round(nr * 1.3) + 'px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('!', pn.x + pn.w / 2, pn.y + pn.h * 0.5 + 1);
      g.restore();
    }
    ART.till(g, tl.x, tl.y, tl.w, tl.h, demo ? 0.5 : till / tillMax(), tNow);
  }
  // 돈통에 든 돈 — 판에 가리지 않게 맨 나중에 따로 그린다
  function tillLabel(above) {
    if (demo || till <= 0) return;
    var lbl = '🪙 ' + fmt(till);
    var fs = Math.round(Math.max(12, Math.min(26, tl.w * 0.22)));
    g.font = '600 ' + fs + 'px system-ui,sans-serif';
    var tw = g.measureText(lbl).width + fs * 1.0, th = fs * 1.5;
    var lx = Math.max(4, Math.min(W - tw - 4, tl.x + tl.w / 2 - tw / 2));   // 화면 밖으로 안 나가게
    var ly = above ? tl.y - th - Math.max(3, tl.h * 0.04)
      : tl.y + tl.h + Math.max(3, tl.h * 0.03);
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.beginPath(); g.roundRect(lx, ly, tw, th, th * 0.5); g.fill();
    g.fillStyle = '#ffe08a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(lbl, lx + tw / 2, ly + th * 0.54);
  }

  function draw() {
    var panBack = pn.y + pn.h < gd.y + gd.h - 1;          // 통이 판보다 뒤에 놓였나
    var horizon = gd.horizon;
    ART.night(g, W, H, horizon);

    // 손님 — 좌판 건너편에 서서 오뎅을 사 간다
    if (demo) {
      var ch2 = guestH();
      var md = ch2 * 0.32;                                            // 가운데는 비운다
      [-1, 1, -2].forEach(function (u, c) {
        var sx = gd.counter + (u < 0 ? -1 : 1) * (md + (Math.abs(u) - 1) * ch2 * 0.50);
        ART.customer(g, sx, guestY(), ch2, c * 3 + 1, tNow, 0, 0);
      });
    } else {
      var gy = guestY();
      for (var gi = 0; gi < guests.length; gi++) {
        var o = guests[gi], face = o.st === 'buy' ? 0 : (o.dir > 0 ? 1 : -1);
        ART.customer(g, o.x, gy, o.h, o.i, tNow, o.st === 'buy' ? 0 : o.ph, face);
        if (o.got && o.st === 'leave') {                  // 사 간 오뎅을 들고 간다
          // 손에 쥐는 건 나무 꼬치 끝이고 어묵은 위로 온다 — 거꾸로 들면 안 된다
          var hr = o.h * 0.15;
          g.save();
          g.translate(o.x + face * o.h * 0.28, gy - o.h * 0.44);
          if (face < 0) g.scale(-1, 1);
          g.rotate(1.92);                                 // 꼬치는 아래로, 어묵은 위·앞으로
          ART.odeng(g, -1.30 * hr, 0, hr, 0);
          g.restore();
        }
      }
    }

    ART.counter(g, W, H, gd.top, S.rank);                // 안에서 밖을 보는 눈 — 발 앞에 좌판
    if (panBack) panTill();                              // 통이 판 뒤에 있으면 먼저 그린다

    var glow = 0;
    for (var i0 = 0; i0 < slots.length; i0++) if (slots[i0].st === 'cook') glow += 1;
    ART.griddle(g, gd.x, gd.y, gd.w, gd.h, Math.min(1, glow / Math.max(1, slots.length * 0.5)));

    for (var i = 0; i < slots.length; i++) {
      var s = slots[i], p = slotPos(i), rr = gd.br * p.k;
      var st = demo ? 'ready' : s.st;                   // 타이틀에서는 판이 차 있는 것으로 보인다
      g.save(); g.translate(p.x, p.y);
      ART.mold(g, 0, 0, rr);
      if (st !== 'empty') {
        var k = st === 'ready' ? 1 : s.p * 0.96;
        var lift = st === 'ready' ? Math.sin(tNow * 2.4 + i) * 1.2 : 0;
        ART.bread(g, 0, lift, rr * (1 + s.pop * 0.16), demo ? (i % 3 === 1 ? 1 : 0) : s.fi, k, 0);
      }
      g.restore();

      if (st === 'cook') {                                // 굽는 진행 — 판 밑 얇은 막대
        var bw = gd.cw * 0.62;
        g.fillStyle = 'rgba(0,0,0,.35)';
        g.beginPath(); g.roundRect(p.x - bw / 2, p.y + rr * 0.62, bw, 4, 2); g.fill();
        g.fillStyle = '#ff9c3c';
        g.beginPath(); g.roundRect(p.x - bw / 2, p.y + rr * 0.62, bw * s.p, 4, 2); g.fill();
      }
      if (st === 'ready' && i % 3 === 0) {                 // 모락모락 (세 칸에 하나만)
        g.save(); g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.lineCap = 'round';
        var sh = Math.min(rr, gd.ch * 0.5);               // 김이 냄비까지 넘어가지 않게
        for (var w2 = 0; w2 < 3; w2++) {
          var off = ((tNow * 0.62 + i * 0.37 + w2 * 0.33) % 1);
          var sx = p.x + (w2 - 1) * rr * 0.42, sy = p.y - rr * 0.42 - off * sh * 1.4;
          g.globalAlpha = 0.20 * Math.sin(off * Math.PI);
          g.beginPath();
          g.moveTo(sx, sy);
          g.quadraticCurveTo(sx + sh * 0.12, sy - sh * 0.2, sx, sy - sh * 0.4);
          g.quadraticCurveTo(sx - sh * 0.12, sy - sh * 0.6, sx, sy - sh * 0.78);
          g.stroke();
        }
        g.restore();
      }
      if (s.gold && st === 'ready') {
        g.save(); g.globalCompositeOperation = 'lighter';
        var rg = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 2);
        rg.addColorStop(0, 'rgba(255,220,110,.45)'); rg.addColorStop(1, 'rgba(255,220,110,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(p.x, p.y, rr * 2, 0, 7); g.fill(); g.restore();
      }
    }

    if (!panBack) panTill();                              // 나란히 놓였으면 판 다음에

    for (var fi2 = 0; fi2 < flies.length; fi2++) {        // 손님이 던진 동전
      var fo2 = flies[fi2], u2 = fo2.t / fo2.dur;
      var fx = fo2.x0 + (tl.x + tl.w / 2 - fo2.x0) * u2;
      var fy = fo2.y0 + (tl.y + tl.h * 0.3 - fo2.y0) * u2 - Math.sin(u2 * Math.PI) * tl.h * 0.9;
      var fr = Math.max(4, tl.h * 0.13);
      g.fillStyle = '#ffd45e';
      g.beginPath(); g.ellipse(fx, fy, fr, fr * Math.abs(Math.cos(fo2.t * 12)) * 0.8 + fr * 0.2, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(150,100,10,.6)'; g.lineWidth = 1.2; g.stroke();
    }

    for (var l = 0; l < lumps.length; l++) {              // 밀린 일 — 쌓인 눈 · 놓고 간 돈
      var o = lumps[l], q2 = lumpPos(o), lr = gd.cw * 0.17 * o.r;
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.beginPath(); g.ellipse(q2.x, q2.y + lr * 0.7, lr * 1.1, lr * 0.32, 0, 0, 7); g.fill();
      if (o.kind === 'coin') {
        for (var cc = 0; cc < 3; cc++) {
          g.fillStyle = cc === 2 ? '#ffd45e' : '#e0a92c';
          g.beginPath(); g.ellipse(q2.x, q2.y + lr * (0.34 - cc * 0.30), lr * 0.62, lr * 0.24, 0, 0, 7); g.fill();
        }
        g.strokeStyle = 'rgba(140,90,10,.55)'; g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(q2.x, q2.y - lr * 0.26, lr * 0.34, lr * 0.13, 0, 0, 7); g.stroke();
      } else {
        g.fillStyle = '#eef3fb';
        g.beginPath(); g.arc(q2.x - lr * 0.42, q2.y, lr * 0.62, 0, 7);
        g.arc(q2.x + lr * 0.42, q2.y + lr * 0.1, lr * 0.55, 0, 7);
        g.arc(q2.x, q2.y - lr * 0.34, lr * 0.66, 0, 7); g.fill();
      }
    }

    tillLabel(panBack);                                   // 통이 뒤에 있으면 글은 상자 위에

    for (var b = 0; b < cats.length; b++)                 // 길냥이
      ART.cat(g, cats[b].x, cats[b].y, catH(), tNow, cats[b]);

    if (S.dough < 1 || S.paste < 1) {                     // 재료 없음 — 글이 아니라 빨간 알림
      g.save();
      g.globalAlpha = 0.6 + Math.sin(tNow * 5) * 0.25;
      g.fillStyle = '#ff5b47';
      var ix = gd.x + 24, iy = gd.y + 22;
      g.beginPath(); g.arc(ix, iy, 15, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = '700 21px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('!', ix, iy + 1);
      g.restore();
    }

    var sdt = Math.min(0.05, dtNow);
    var gust = Math.sin(tNow * 0.23) * 0.6 + Math.sin(tNow * 0.07 + 1.3) * 0.4;   // 느리게 부는 바람
    g.save();                                             // 멀리 내리는 눈은 천막 밖에만
    g.beginPath(); g.rect(0, 0, W, gd.top); g.clip();
    ART.snowDraw(g, snow, sdt, W, H, gust);
    g.restore();

    ART.tent(g, W, H, S.rank, gd.tent, tNow);             // 머리 위 천막 자락과 양옆 기둥
    // 코앞으로 지나가는 큰 송이 — 천막 밖(자락 아래 ~ 좌판 위)에만 내린다
    ART.snowNearDraw(g, snowN, sdt, W, H, gust, gd.tent, gd.top);
  }

  // ---------- 고리 ----------
  function frame(ms) {
    if (!running) return;
    var t = ms / 1000;
    if (!tPrev) tPrev = t;
    var dt = Math.min(0.1, t - tPrev);
    tPrev = t; tNow = t; dtNow = dt;                     // 눈처럼 draw 에서만 쓰는 것도 이 dt 를 본다
    step(dt); draw();
    requestAnimationFrame(frame);
  }

  // ---------- 손 ----------
  function hit(x, y) {
    for (var b = cats.length - 1; b >= 0; b--) {          // 길냥이 먼저 — 쫓으면 빈손으로 간다
      var o = cats[b], hh = catH();
      if (o.st !== 'go' && x > o.x - hh * 0.9 && x < o.x + hh * 1.1 &&
          y > o.y - hh * 1.35 && y < o.y + hh * 0.15) {
        o.st = 'go'; o.t = 0; o.paw = 0; o.meow = 0;
        SND.play('meow'); return;
      }
    }
    for (var l = lumps.length - 1; l >= 0; l--) {         // 쌓인 눈 치우기 · 놓고 간 돈 줍기
      var q = lumps[l], lp = lumpPos(q);
      if (Math.hypot(x - lp.x, y - lp.y) < gd.cw * 0.28) {
        lumps.splice(l, 1);
        var v = q.kind === 'coin' ? (q.val || odengPrice()) : price() * 3;
        S.coin += v; S.total += v;
        pop(lp.x, lp.y, '+' + fmt(v), false);
        SND.play(q.kind === 'coin' ? 'sell' : 'sweep'); hud(); return;
      }
    }
    if (till > 0 && x >= tl.x - 8 && x <= tl.x + tl.w + 8 &&
        y >= tl.y - tl.h * 0.5 && y <= tl.y + tl.h + 8) {
      S.coin += till; S.total += till;                    // 돈통을 누르면 걷는다
      pop(tl.x + tl.w / 2, tl.y - 4, '+' + fmt(till), till >= odengPrice() * 10);
      SND.play(till >= odengPrice() * 10 ? 'big' : 'sell');
      till = 0; hud(); return;
    }
    if (x >= pn.x - 6 && x <= pn.x + pn.w + 6 &&
        y >= pn.y - pn.h * 0.55 && y <= pn.y + pn.h + pn.h * 0.35) {
      var room = potN() - sticks;                         // 통을 누르면 어묵을 꽂는다
      if (room > 0) {
        var got = fillPot();
        if (got) { pop(pn.x + pn.w / 2, pn.y - pn.h * 0.35, '🍢 ' + got, false); SND.play('fill'); }
        else { SND.play('no'); openShop('odeng'); }      // 어묵이 떨어졌다
      }
      hud(); return;
    }
    var best = -1, bd = 1e9;
    for (var i = 0; i < slots.length; i++) {
      var p = slotPos(i), d = Math.hypot((x - p.x) / 1.5, y - p.y);
      if (d < bd) { bd = d; best = i; }
    }
    if (best < 0 || bd > gd.ch * 0.85) return;
    var s = slots[best];
    if (s.st === 'ready') take(best, true);
    else if (s.st === 'empty') {
      if (pour(best)) { SND.play('pour'); }
      else { SND.play('no'); openShop(); }
    }
    hud();
  }
  cv.addEventListener('pointerdown', function (e) {
    if (!running) return;
    SND.unlock(); hit(e.clientX, e.clientY);
  });

  // ---------- 상점 ----------
  var sheet = document.getElementById('sheet'), sBody = document.getElementById('sBody'),
      sTitle = document.getElementById('sTitle');
  var mode = '', shopTab = 'bread';
  function openShop(tab) {
    mode = 'shop'; if (tab) shopTab = tab;
    sTitle.textContent = T.shop; sheet.classList.add('on'); hud(); renderShop();
  }
  function openDex() { mode = 'dex'; sTitle.textContent = T.dex; sheet.classList.add('on'); hud(); renderDex(); }
  function closeSheet() { sheet.classList.remove('on'); mode = ''; }

  function rowEl(icon, name, sub, costTxt, ok, maxed, fn) {
    var d = document.createElement('div'); d.className = 'row';
    d.innerHTML = '<div class="ic">' + icon + '</div><div class="tx"><div class="nm"></div>' +
      '<div class="lv"></div></div>';
    d.querySelector('.nm').textContent = name;
    d.querySelector('.lv').textContent = sub;
    var b = document.createElement('button');
    b.className = 'buy' + (maxed ? ' mx' : '');
    b.textContent = maxed ? T.max : ('🪙 ' + costTxt);
    b.disabled = maxed || !ok;
    b.onclick = function () { fn(); SND.play('buy'); hud(); if (mode === 'shop') renderShop(); else renderDex(); };
    d.appendChild(b);
    return d;
  }

  function tabs() {
    var bar = document.createElement('div'); bar.className = 'tabs';
    [['bread', '🐟', T.tBread], ['odeng', '🍢', T.tOdeng]].forEach(function (t2) {
      var b = document.createElement('button');
      b.className = 'tab' + (shopTab === t2[0] ? ' on' : '');
      b.textContent = t2[1] + ' ' + t2[2];
      b.onclick = function () { shopTab = t2[0]; SND.play('buy'); renderShop(); };
      bar.appendChild(b);
    });
    sBody.appendChild(bar);
  }

  // 상점 맨 위 — 다음 단계와 거기까지 남은 누적 매출
  function rankGoal() {
    var d = document.createElement('div');
    d.className = 'row goal';
    var nxt = S.rank + 1, done = nxt >= RANK_AT.length;
    var from = RANK_AT[S.rank] || 0, to = done ? 0 : RANK_AT[nxt];
    var p = done ? 1 : Math.max(0, Math.min(1, (S.total - from) / Math.max(1, to - from)));
    d.innerHTML = '<div class="ic">🏪</div><div class="tx">' +
      '<div class="gl"></div><div class="nm"></div>' +
      '<div class="gbar"><span></span></div></div><div class="gnum"></div>';
    d.querySelector('.gl').textContent = T.goal;
    d.querySelector('.nm').textContent = done ? T.ranks[S.rank] : T.ranks[nxt];
    d.querySelector('.gbar > span').style.width = (p * 100).toFixed(1) + '%';
    d.querySelector('.gnum').textContent = done ? T.maxRank : (fmt(S.total) + ' / ' + fmt(to));
    sBody.appendChild(d);
  }

  function renderShop() {
    sBody.innerHTML = '';
    rankGoal();
    tabs();
    if (shopTab === 'odeng') return renderOdeng();
    var dc = tubCap(S.dtub), pc = tubCap(S.ptub);
    var dn = dc - Math.floor(S.dough), pn = pc - Math.floor(S.paste);
    var dcost = stockCost(dn), pcost = stockCost(pn);
    sBody.appendChild(rowEl('🥣', T.buyDough, Math.floor(S.dough) + ' / ' + dc,
      fmt(dcost), S.coin >= dcost && dn > 0, dn <= 0, function () {
        S.coin -= dcost; S.dough = dc;
      }));
    sBody.appendChild(rowEl('🫘', T.buyPaste, Math.floor(S.paste) + ' / ' + pc,
      fmt(pcost), S.coin >= pcost && pn > 0, pn <= 0, function () {
        S.coin -= pcost; S.paste = pc;
      }));

    var list = [
      ['hole', '🕳️', T.u_hole, function () { return HOLE_N[S.hole] + (S.hole < UP.hole.max ? ' → ' + HOLE_N[S.hole + 1] : ''); }],
      ['fire', '🔥', T.u_fire, function () { return cookTime().toFixed(1) + 's' + (S.fire < UP.fire.max ? ' → ' + Math.max(1.1, 6 * Math.pow(0.82, S.fire + 1)).toFixed(1) + 's' : ''); }],
      ['auto', '🥄', T.u_auto, function () { return S.auto ? 'Lv.' + S.auto : '—'; }],
      ['tong', '🥢', T.u_tong, function () { return S.tong ? 'Lv.' + S.tong : '—'; }],
      ['dtub', '🪣', T.u_dtub, function () { return tubCap(S.dtub) + (S.dtub < UP.dtub.max ? ' → ' + tubCap(S.dtub + 1) : ''); }],
      ['ptub', '🫙', T.u_ptub, function () { return tubCap(S.ptub) + (S.ptub < UP.ptub.max ? ' → ' + tubCap(S.ptub + 1) : ''); }],
      ['reg', '👥', T.u_reg, function () { return '×' + (1 + S.reg * 0.35).toFixed(2); }]
    ];
    list.forEach(function (it) {
      var k = it[0], u = UP[k], lv = S[k], maxed = lv >= u.max, c = u.cost(lv);
      sBody.appendChild(rowEl(it[1], it[2], it[3](), fmt(c), S.coin >= c, maxed, function () {
        S.coin -= c; S[k] += 1;
        if (k === 'hole') { rebuildSlots(); layout(); }
      }));
    });
  }

  function renderOdeng() {
    var fc = tubCap(S.ftub), fn = fc - Math.floor(S.fish), cost = fishCost(fn);
    sBody.appendChild(rowEl('🍥', T.buyFish, Math.floor(S.fish) + ' / ' + fc,
      fmt(cost), S.coin >= cost && fn > 0, fn <= 0, function () {
        S.coin -= cost; S.fish = fc;
      }));
    var list = [
      ['pot', '🥘', T.u_pot, function () { return potN() + (S.pot < UP.pot.max ? ' → ' + POT_N[S.pot + 1] : ''); }],
      ['broth', '🥄', T.u_broth, function () { return '🪙 ' + fmt(odengPrice()); }],
      ['word', '📣', T.u_word, function () { return guestGap().toFixed(1) + 's' + (S.word < UP.word.max ? ' → ' + (5.2 * Math.pow(0.82, S.word + 1)).toFixed(1) + 's' : ''); }],
      ['ftub', '🧊', T.u_ftub, function () { return tubCap(S.ftub) + (S.ftub < UP.ftub.max ? ' → ' + tubCap(S.ftub + 1) : ''); }]
    ];
    list.forEach(function (it) {
      var k = it[0], u = UP[k], lv = S[k], maxed = lv >= u.max, c = u.cost(lv);
      sBody.appendChild(rowEl(it[1], it[2], it[3](), fmt(c), S.coin >= c, maxed, function () {
        S.coin -= c; S[k] += 1;
        if (k === 'pot') layout();
      }));
    });
  }

  function renderDex() {
    sBody.innerHTML = '';
    var wrap = document.createElement('div'); wrap.className = 'dexg';
    for (var i = 0; i < 8; i++) (function (i) {
      var got = !!S.dex[i], d = document.createElement('div');
      d.className = 'dex' + (got ? '' : ' lock') + (S.flavor === i ? ' cur' : '');
      var c = document.createElement('canvas'); c.width = c.height = 104;
      ART.icon(c, i, !got);
      d.appendChild(c);
      var nm = document.createElement('div'); nm.className = 'nm';
      nm.textContent = got ? T.flavors[i] : T.lock; d.appendChild(nm);
      var pr = document.createElement('div'); pr.className = 'pr';
      pr.textContent = got ? ('🪙 ' + fmt(F[i].price)) : ('🔓 ' + fmt(FL_COST[i])); d.appendChild(pr);
      d.onclick = function () {
        if (got) { S.flavor = i; SND.play('buy'); }
        else if (S.coin >= FL_COST[i]) { S.coin -= FL_COST[i]; S.dex[i] = 1; S.flavor = i; SND.play('big'); }
        else { SND.play('no'); return; }
        renderDex(); hud();
      };
      wrap.appendChild(d);
    })(i);
    sBody.appendChild(wrap);
  }

  // ---------- 승급 ----------
  var rankBox = document.getElementById('rank'), rankCv = document.getElementById('rankCv'),
      rankName = document.getElementById('rankName');
  function showRank(r) {
    if (r === rankShown) return; rankShown = r;
    var rg = rankCv.getContext('2d');
    rg.clearRect(0, 0, rankCv.width, rankCv.height);
    ART.night(rg, rankCv.width, rankCv.height, rankCv.height * 0.74);
    ART.stall(rg, r, rankCv.width / 2, rankCv.height * 0.92, 150, 0);
    for (var ci = 0; ci < 3; ci++)
      ART.customer(rg, rankCv.width / 2 + (ci - 1) * 96, rankCv.height * 0.97, 96, ci + r, 0);
    rankName.textContent = T.ranks[r];
    rankBox.classList.add('on'); SND.play('rank');
  }
  rankBox.addEventListener('pointerdown', function () { rankBox.classList.remove('on'); });

  // ---------- 단추 ----------
  document.getElementById('bShop').onclick = function () { SND.unlock(); openShop(); };
  document.getElementById('bDex').onclick = function () { SND.unlock(); openDex(); };
  document.getElementById('bClose').onclick = closeSheet;
  sheet.addEventListener('pointerdown', function (e) { if (e.target === sheet) closeSheet(); });
  var tSnd = document.getElementById('tSnd');
  function syncSnd() { tSnd.classList.toggle('off', !SND.on); }
  tSnd.onclick = function () { SND.toggle(); syncSnd(); };
  syncSnd();

  // ---------- 가로로 돌리기 ----------
  // 폰은 눕혀서 한다. 좌판과 오뎅 통이 나란히 놓여야 실제 크기 비례가 산다
  if (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    document.body.classList.add('touch');
  function orient() {
    document.body.classList.toggle('portrait',
      innerHeight > innerWidth && !document.documentElement.classList.contains('ol-land'));
  }
  document.getElementById('rotGo').addEventListener('click', function () { if (window.OL) OL.go(); });
  document.getElementById('rotSkip').addEventListener('click', function (e) {
    e.preventDefault(); document.body.classList.remove('portrait');
  });
  orient();

  window.addEventListener('resize', function () { layout(); draw(); orient(); });   // 크기가 바뀌면 캔버스가 지워진다 — 바로 다시 그린다
  window.addEventListener('orientationchange', function () { setTimeout(function () { layout(); draw(); orient(); }, 150); });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });

  // ---------- 시작 ----------
  var titleEl = document.getElementById('title');
  function begin() {
    SND.unlock();
    SND.bgm(true);                                       // 징글벨 — 한 바퀴 돌고 쉬었다 또 돈다
    demo = false;
    titleEl.classList.add('off');
    running = true; tPrev = 0;
    requestAnimationFrame(frame);
  }
  document.getElementById('start').onclick = begin;

  var had = load();
  rebuildSlots(); layout(); hud();
  sticks = Math.min(potN(), S.stick || 0);
  till = Math.max(0, S.till || 0);
  if (!had) sticks = fillPot();                          // 처음 온 사람은 냄비가 차 있는 채로 시작
  demo = true;
  if (had) {
    var gap = (Date.now() - (S.seen || Date.now())) / 1000;
    if (gap > 60) {
      var n = offline(gap);
      setTimeout(function () {
        pop(W / 2, gd.y - 10, '🐟 ' + n, true);
      }, 500);
    }
  }
  draw();

  // 미리보기 창은 rAF 가 안 도니 손으로 돌릴 손잡이를 둔다
  window.__bp = {
    S: function () { return S; }, slots: function () { return slots; },
    pos: slotPos, gd: function () { return gd; }, lumps: function () { return lumps; },
    cats: function () { return cats; }, guests: function () { return guests; },
    pot: function () { return { pan: pn, till: tl, n: potN(), have: sticks, money: till }; },
    tick: function (n, dt) { dt = dt || 1 / 60; dtNow = dt; for (var i = 0; i < (n || 1); i++) { tNow += dt; step(dt); } draw(); },
    start: begin, reset: function () { localStorage.removeItem(KEY); location.reload(); }
  };
})();
