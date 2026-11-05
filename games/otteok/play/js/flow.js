// 하루·주문 흐름: 주문 만들기 → 만들기 → 포장 → 택배 → 리뷰 → 다음 주문 / 하루 끝 / 장 끝 / 엔딩.
(function () {
  const V3 = THREE.Vector3;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  const D = DATA;
  const sv = () => G.save;
  const CH = () => D.CH[Math.min(D.CH.length, sv().ch) - 1];

  // ---------- 주문 만들기 ----------
  let rs = 1;
  const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
  const pick = (a) => a[(rnd() * a.length) | 0];
  function grid(n) { return n <= 4 ? [2, 2] : n <= 6 ? [3, 2] : [4, 2]; }
  const GOLD = { k: 'gold', ko: '금빛', en: 'Gold', c: '#ffe39a', d: '#e8b84a' };
  // 장·날·번호에 따라 주문 하나(같은 날을 다시 하면 같은 주문)
  function makeOrder(ch, day, i, big) {
    rs = ch * 1000 + day * 37 + i * 7 + 3 + (big ? 500 : 0);
    const c = D.CH[ch - 1], types = D.typesUpTo(ch);
    // 1장 처음은 하나씩 배우게, 새 장 첫 주문은 새 떡
    const fixed = { '1-1-0': [['injeolmi', 4]], '1-1-1': [['songpyeon', 4]], '1-2-0': [['mujigae', 4]] };
    let items = fixed[ch + '-' + day + '-' + i];
    if (!items && ch > 1 && day === 1 && c.add[i]) items = [[c.add[i], 4]]; // 새 떡마다 하나씩 배우게
    if (!items) {
      const n = ch === 1 && day <= 2 ? pick([4, 6]) : big ? pick([6, 8, 8]) : pick(ch <= 2 ? [4, 6, 6, 8] : [6, 6, 8, 8]);
      if ((ch > 1 || day >= 3) && rnd() < (big ? 0.8 : 0.5)) {
        const a = pick(types); let b = pick(types); while (b === a) b = pick(types);
        items = [[a, n / 2], [b, n / 2]];
      } else items = [[pick(types), n]];
    }
    const n = items.reduce((s, x) => s + x[1], 0);
    const [cols, rows] = grid(n);
    const slots = [];
    if (items.length === 1) for (let k = 0; k < n; k++) slots.push(items[0][0]);
    else for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) slots.push(items[(r + q) % 2][0]);
    const wrap = big ? GOLD : pick(D.WRAP);
    const boxCols = ['#ffd6e4', '#d9ecff', '#fff0c4', '#dff5e3', '#ebdcff'];
    let dest;
    if (ch === 1 && day === 1) dest = pick(D.DEST.slice(0, 2));
    else if (c.world && rnd() < 0.65) dest = pick(D.DEST_WORLD);
    else dest = pick(D.DEST);
    dest = Object.assign({}, dest);
    if (dest.air && G.gear('jet')) dest.ice = Math.max(1, dest.ice - 1);
    return { items, n, cols, rows, slots, wrap, boxColor: big ? '#fff3c4' : pick(boxCols), dest, big: !!big };
  }

  G._order = makeOrder; // 값 재기·시험용

  // ---------- 하루 ----------
  const F = (G.flow = { day: null });
  G.dayLen = function (n) { return n * 85 * (G.gear('clock') ? 1.2 : 1); };
  // 그날 주문 수: 장에 적힌 날을 넘기면 마지막 날과 같게
  const dayOrders = () => { const o = CH().orders; return o[Math.min(sv().day, o.length) - 1]; };
  // 다음 단계를 샀다: 곧장 장 끝 화면으로, 나스닥이면 곧장 증권거래소로
  G.advance = function () {
    F.day = null; F.order = null; G.station = null;
    UI.order(null); UI.shipLog(false); FACT.autoReset();
    const nx = D.CH[sv().ch];
    if (nx && nx.last) {
      sv().ch = nx.n; sv().day = 1; G.store();
      RND.setSign(nx.sign); RND.decor(nx.n);
      return G.ending();
    }
    UI.hud(true); UI.dayHud();
    UI.chapterClear(CH(), sv().chSales || 0);
  };
  G.startDay = function () {
    const c = CH();
    if (c.last) return G.ending();
    if (G.stepOwned()) return G.advance(); // 이어하기: 사 놓고 나간 판
    if (sv().ch >= 4) return startAuto();
    UI.shipLog(false); FACT.autoOn(false);
    const n = dayOrders();
    const orders = [];
    for (let i = 0; i < n; i++) orders.push(makeOrder(sv().ch, sv().day, i, false));
    F.day = { orders, i: 0, t: 0, len: G.dayLen(n), sales: 0, stars: [], ones: 0, over: false };
    UI.hud(true); UI.dayHud();
    RND.setSign(c.sign); RND.decor(sv().ch);
    UI.banner('DAY ' + sv().day, L(c.ko, c.en)); S('notify');
    G.paused = false;
    FACT.ensure();
    FX.wait(1.7, nextOrder);
  };
  function nextOrder() {
    const d = F.day;
    if (!d) return;
    if (d.i >= d.orders.length) return endDay();
    const o = (F.order = d.orders[d.i]);
    F.stage = 0;
    UI.order(o); UI.stage(0); UI.dayHud();
    S('notify');
    SHIP.vehicle(!!o.dest.air);
    if (SHIP.away()) SHIP.truckBack();
    RND.focus(RND.ST.make, 0.2, 7.2);
    MAKE.showTray();
    G.station = MAKE;
    // 처음 보는 떡이면 짧은 안내 카드 뒤에 시작
    const fresh = o.items.map((x) => x[0]).filter((t) => !(sv().seen || {})[t]);
    const go = () => MAKE.start(o.items.map(([type, n]) => ({ type, n })), made);
    if (fresh.length) UI.newDdeok(fresh, go); else go();
  }
  function made() {
    F.stage = 1; UI.stage(1);
    G.station = null;
    const tray = MAKE.takeTray();
    RND.focus(RND.ST.pack, 0.2, 7.2);
    const to = new V3(RND.ST.pack - 2.75, 0, 1.0);
    const mid = tray.position.clone().lerp(to, 0.5);
    S('whoosh');
    FX.hop(tray, mid, 0.4, 1.2, () => { FX.squash(tray, 0.2); S('box');
      FX.hop(tray, to, 0.4, 1.0, () => {
        FX.squash(tray, 0.2); S('box');
        G.station = PACK;
        const o = F.order;
        PACK.start({ slots: o.slots, cols: o.cols, rows: o.rows, boxColor: o.boxColor, wrap: o.wrap, tray, big: o.big }, packed);
      });
    });
  }
  function packed(res) {
    F.stage = 2; UI.stage(2);
    G.station = null;
    F.pack = res;
    F.photo = snapPhoto(res.box);
    const box = res.box;
    RND.focus(RND.ST.ship + (RND.portrait ? -0.1 : 0.4), 0.2, 7.6);
    // 택배 상자 왼쪽에 꾸러미 크기만큼 비켜서 기다림
    const to = new V3(RND.ST.ship + 1.2 - (res.W + 0.75) / 2 - (res.W + 0.45) / 2 - 0.25, 0, -0.15);
    const a = box.position.clone(), m1 = a.clone().lerp(to, 0.33), m2 = a.clone().lerp(to, 0.66);
    const hop = (p, next) => FX.hop(box, p, 0.32, 0.9, () => { FX.squash(box, 0.18); S('box'); next(); });
    hop(m1, () => hop(m2, () => hop(to, () => {
      G.station = SHIP;
      const o = F.order;
      SHIP.start({ bundle: box, W: res.W, D: res.D, H: res.H, need: o.dest.ice, dest: L(o.dest.ko, o.dest.en), air: !!o.dest.air }, shipped);
    })));
  }
  function snapPhoto(box) {
    try {
      RND.render();
      const c = RND.renderer.domElement;
      const p = RND.toScreen(box.localToWorld(new V3(0, 0.4, 0)));
      const k = c.width / innerWidth, w = 360 * k, h = 270 * k;
      const o = document.createElement('canvas'); o.width = 360; o.height = 270;
      o.getContext('2d').drawImage(c, p.x * k - w / 2, p.y * k - h / 2, w, h, 0, 0, 360, 270);
      return o.toDataURL('image/jpeg', 0.8);
    } catch (e) { return null; }
  }
  function shipped(sres) {
    G.station = null;
    const o = F.order, d = F.day, pk = F.pack;
    const warm = sres.ice < sres.need;
    const iceK = warm ? 0 : sres.ice === sres.need ? 1 : 0.8;
    // 별점은 만들기 솜씨(q: PERFECT 1·GOOD 0.65·MISS 0.3 평균)로 정하고, 자리를 틀리게 담으면 깎는다.
    // 예전엔 포장·아이스팩 점수가 늘 꽉 차서 만들기를 망쳐도 별 넷이 나왔다
    const s = Math.max(0, Math.min(1, (pk.q * 0.7 + pk.pretty * 0.3) * iceK));
    let stars = pk.q >= 0.93 ? 5 : pk.q >= 0.75 ? 4 : pk.q >= 0.55 ? 3 : pk.q >= 0.38 ? 2 : 1;
    if (pk.pretty < 1) stars--;
    if (pk.pretty < 0.5) stars--;
    stars = warm ? 1 : Math.max(1, stars);
    // 회사가 클수록 한 상자 값이 오른다(장마다, 그리고 가맹점이 늘수록 손으로 만든 상자가 귀해짐)
    const chMul = (1 + (sv().ch - 1) * 0.55) * (1 + (BIZ.stores() - 1) / 60);
    const base = (o.items.reduce((a, [t, n]) => a + D.DDEOK[t].price * n, 0) + 2000) * chMul * (o.big ? 1.5 : 1);
    const tip = stars === 5 ? base * 0.25 * (G.gear('ribbon') ? 2 : 1) : 0;
    let coins = Math.round((base * (0.45 + 0.55 * s) + tip) / 100) * 100;
    if (warm) coins = Math.round(base * 0.2 / 100) * 100;
    const pool = D.REVIEW[stars];
    const ri = warm ? -1 : (Math.random() * pool.length) | 0;
    const rv = warm ? D.REVIEW_WARM : pool[ri];
    d.sales += coins; d.stars.push(stars); if (stars === 1) d.ones++;
    const st = sv().stats; st.orders++; st.boxes++; st.stars += stars; st.pieces += o.n; if (stars === 5) st.five++;
    o.items.forEach(([t]) => { sv().dex[t] = (sv().dex[t] || 0) + 1; });
    sv().rv = sv().rv || {}; sv().rv[warm ? 'w' : stars + '-' + ri] = 1;
    sv().coins += coins; sv().total += coins; sv().chSales = (sv().chSales || 0) + coins;
    G.store();
    UI.order(null);
    UI.review({ photo: F.photo, stars, text: L(rv[0], rv[1]), coins }, () => {
      d.i++;
      if (d.over && d.i < d.orders.length) { d.ones += d.orders.length - d.i; d.i = d.orders.length; }
      UI.dayHud();
      if (d.ones >= 3) return gameOver();
      FX.wait(0.3, nextOrder);
    });
  }
  function endDay() {
    const d = F.day; F.day = null; G.station = null;
    S('fanfare');
    const avg = d.stars.length ? d.stars.reduce((a, b) => a + b, 0) / d.stars.length : 0;
    sv().day++;
    const roy = BIZ.payRoyalty();
    G.store();
    UI.dayEnd({ day: sv().day - 1, sales: d.sales, factory: d.factory || 0, roy, boxes: d.stars.length, avg, chSales: sv().chSales || 0 });
  }

  // ---------- 4장부터: 자동 영업(공장 레일이 떡을 만들고 상자를 내보낸다. 손은 고장 난 기계를 고친다) ----------
  let shipNo = 0;
  function startAuto() {
    const c = CH();
    FACT.ensure(); FACT.autoOn(true); FACT.autoReset();
    // 공장을 지으면 첫 레일 하나는 같이 세워진다(눈앞에서 쾅)
    let first = null;
    if (!BIZ.lines().length) { first = D.typesUpTo(sv().ch)[0]; BIZ.lines().push(first); G.store(); }
    const n = dayOrders();
    F.day = { orders: [], auto: true, i: 0, t: 0, len: n * 85, sales: 0, stars: [], ones: 0, over: false, factory: 0 };
    F.order = null; G.station = null; shipNo = sv().stats.orders;
    UI.order(null); UI.shipLog(true); UI.hud(true); UI.dayHud();
    RND.setSign(c.sign); RND.decor(sv().ch);
    G.paused = false;
    const go = () => { G.station = FACT.station; FACT.autoView(); };
    const built = () => (first ? FACT.visit([{ line: first }], go) : go());
    if (!sv().facSeen) { sv().facSeen = 1; G.store(); FX.wait(0.3, () => FACT.intro(built)); return; }
    // 장 이름은 그 장에 처음 들어올 때 한 번만(새로고침·이어하기엔 안 뜸)
    if (sv().day === 1 && sv().banCh !== sv().ch) { sv().banCh = sv().ch; G.store(); UI.banner(L(c.ko, c.en), ''); S('notify'); }
    const mk = 'map' + sv().ch;
    if (sv().ch >= 5 && sv().ch <= 6 && !sv()[mk]) { sv()[mk] = 1; G.store(); FX.wait(1.6, () => WORLD.open()); }
    built();
  }
  // 레일에서 상자 하나가 나옴
  FACT.onBox = function (l, k) {
    const d = F.day;
    if (!d || !d.auto || d.over) return;
    // 한 상자마다 쌓는다(고장 난 레일이 있으면 별 네 개)
    const st = sv().stats, st5 = !FACT.badLines().length;
    st.orders++; st.boxes++; st.stars += st5 ? 5 : 4; if (st5) st.five++;
    shipNo = st.orders;
    // 해외는 가맹점을 낸 도시로만 나간다
    const abroad = D.CITY.filter((x) => x.ch >= 6 && BIZ.cities()[x.k]);
    const dest = abroad.length && Math.random() < 0.65 ? pick(abroad) : pick(D.DEST);
    UI.shipAdd({ no: shipNo, type: l.type, dest: L(dest.ko, dest.en), coins: BIZ.lineRate(k) * BIZ.mul() / FACT.boxRate() });
    FACT.loadTruck();
    UI.dayHud();
  };
  G.autoRunning = () => !!(F.day && F.day.auto);
  function stepAuto(d, dt) {
    d.t += dt;
    BIZ.step(dt);
    FACT.autoStep(dt);
    UI.shipTick(dt);
    UI.clock(d.t / d.len);
    if (d.t >= d.len) nextAutoDay(d);
  }
  // 방치가 끊기지 않게 하루 끝 표 없이 날이 넘어간다(로열티만 들어오고 위에 작게 알림)
  function nextAutoDay(d) {
    const earned = d.factory || 0, c = CH();
    const roy = BIZ.payRoyalty();
    sv().day++; G.store();
    d.t = 0; d.factory = 0; d.len = dayOrders() * 85;
    UI.coin(); UI.dayHud();
    UI.banner('+' + UI.fmt(earned + roy), ''); S('coin');
  }
  // 하루 끝 NEXT
  G.afterDay = function () { G.startDay(); };
  G.nextChapter = function () {
    sv().ch = Math.min(D.CH.length, sv().ch + 1); sv().day = 1; sv().chSales = 0; G.store();
    G.startDay();
  };
  function gameOver() {
    const d = F.day; F.day = null; G.station = null;
    S('fail');
    UI.over(d.ones);
  }
  G.retryDay = function () { G.startDay(); };
  // 막차 시간: 지금 만드는 주문은 마저 보내고, 남은 주문은 별 하나
  G.flowStep = function (dt) {
    const d = F.day;
    if (!d || G.paused || d.over || UI.busy()) return;
    if (d.auto) return stepAuto(d, dt);
    d.t += dt;
    BIZ.step(dt);
    UI.clock(d.t / d.len);
    if (d.t >= d.len) {
      d.over = true;
      UI.banner(L('막차 시간', 'LAST TRUCK'), L('남은 주문 취소', 'Orders cancelled'));
      S('fail');
    }
  };
  G.onIce = function (n, need) { UI.ice(n, need); };
})();
