// 화면 글: 상단바·주문서(송장)·리뷰 폰·하루 끝·상점·GAME OVER·장 끝·타이틀.
(function () {
  const U = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const D = DATA;
  // 돈: 1억(영문 10억)부터 억·조(B·T) 단위
  const fmt = (U.fmt = function (n) {
    n = Math.round(n);
    const a = Math.abs(n);
    if (!EN) { if (a >= 1e12) return (n / 1e12).toFixed(a >= 1e13 ? 1 : 2) + '조'; if (a >= 1e8) return (n / 1e8).toFixed(a >= 1e10 ? 0 : a >= 1e9 ? 1 : 2) + '억'; }
    else { if (a >= 1e12) return (n / 1e12).toFixed(2) + 'T'; if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'; }
    return n.toLocaleString('en-US');
  });
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };
  let busyN = 0;
  U.busy = () => busyN > 0;

  // ---------- 글자 바꾸기(영문) ----------
  const T = { lDay: ['DAY', 'DAY'], lClock: ['막차 18:00', 'LAST 18:00'], lOrd: ['주문', 'ORDERS'], oBoxL: ['상자', 'Box'], oWrapL: ['보자기', 'Wrap'], oIceL: ['아이스팩', 'Ice'], st0: ['만들기', 'MAKE'], st1: ['포장', 'PACK'], st2: ['택배', 'SHIP'],
    bCont: ['계속하기', 'CONTINUE'], bNew: ['새로 시작', 'NEW GAME'], deL1: ['오늘 매출', 'Sales today'], deL2: ['보낸 상자', 'Boxes sent'], deL3: ['평균 별점', 'Avg. stars'], deL4: ['이번 장 매출', 'Chapter sales'], bSave: ['저장', 'SAVE'], bShare: ['공유', 'SHARE'],
    bShop: ['상점', 'SHOP'], shT: ['상점', 'SHOP'], bShopX: ['닫기', 'CLOSE'], ovL: ['별 하나 리뷰', '1-star reviews'], ccL1: ['매출', 'Sales'], ccL2: ['가맹점', 'Stores'], lVal: ['기업가치', 'VALUE'], lRate: ['공장', 'FACTORY'], deL6: ['공장 수입', 'Factory'], deL7: ['로열티', 'Royalties'], wL1: ['기업가치', 'Value'], wL2: ['로열티/일', 'Royalty/day'], wL3: ['가맹점', 'Stores'], bWorldX: ['닫기', 'CLOSE'], keys: ['클릭 · 끌기 · 스페이스', 'Click · Drag · Space'] };
  Object.keys(T).forEach((k) => { const el = $(k); if (el) el.textContent = L(T[k][0], T[k][1]); });
    if (window.EN) { document.title = 'otteok.com'; const la = document.querySelector('#logo .a'); if (la) la.textContent = 'OTTEOK'; }

  // ---------- 떡 그림(주문서용, 코드로) ----------
  U.icon = function (type, s) {
    const c = document.createElement('canvas'); c.width = c.height = s * 2; c.style.width = c.style.height = s + 'px';
    const g = c.getContext('2d'); g.scale(2, 2);
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    if (type === 'injeolmi') {
      rr(s * 0.12, s * 0.3, s * 0.76, s * 0.46, s * 0.14); g.fillStyle = '#f4d98a'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#d2a64e'; g.stroke();
      g.fillStyle = '#d9ae58'; for (let i = 0; i < 14; i++) g.fillRect(s * (0.18 + Math.random() * 0.62), s * (0.36 + Math.random() * 0.34), 1.5, 1.5);
    } else if (type === 'songpyeon') {
      g.beginPath(); g.moveTo(s * 0.1, s * 0.66); g.quadraticCurveTo(s * 0.5, s * 0.06, s * 0.9, s * 0.66); g.closePath(); g.fillStyle = '#ffc6d8'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#e48aa8'; g.stroke();
      g.strokeStyle = 'rgba(228,138,168,.6)'; g.beginPath(); g.moveTo(s * 0.25, s * 0.5); g.quadraticCurveTo(s * 0.5, s * 0.18, s * 0.75, s * 0.5); g.stroke();
    } else if (type === 'kkuldduk') {
      [['#ffc6d8', 0.3, 0.55], ['#b9e3a3', 0.6, 0.55], ['#fffaf2', 0.45, 0.38]].forEach(([c, x, y]) => { g.beginPath(); g.arc(s * x, s * y, s * 0.17, 0, 7); g.fillStyle = c; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(0,0,0,.15)'; g.stroke(); });
    } else if (type === 'jeolpyeon') {
      rr(s * 0.14, s * 0.24, s * 0.72, s * 0.52, s * 0.1); g.fillStyle = '#cdb4ff'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#9a7be0'; g.stroke();
      g.beginPath(); g.arc(s * 0.5, s * 0.5, s * 0.15, 0, 7); g.strokeStyle = 'rgba(80,50,140,.45)'; g.stroke();
    } else if (type === 'garaetteok') {
      [0.26, 0.74].forEach((y) => { rr(s * 0.1, s * (y - 0.1), s * 0.8, s * 0.2, s * 0.1); g.fillStyle = '#fbf8f1'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#cfc6b4'; g.stroke(); });
    } else if (type === 'baekseolgi') {
      rr(s * 0.18, s * 0.22, s * 0.64, s * 0.56, s * 0.08); g.fillStyle = '#ffffff'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#d8d0c0'; g.stroke();
    } else if (type === 'ddalgi') {
      g.beginPath(); g.arc(s * 0.5, s * 0.58, s * 0.3, 0, 7); g.fillStyle = '#fffaf4'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#e2d6c8'; g.stroke();
      g.beginPath(); g.moveTo(s * 0.36, s * 0.36); g.quadraticCurveTo(s * 0.5, s * 0.06, s * 0.64, s * 0.36); g.closePath(); g.fillStyle = '#ff4f63'; g.fill();
    } else {
      const cols = D.DDEOK.mujigae.cols;
      for (let i = 0; i < 5; i++) { g.fillStyle = cols[4 - i]; rr(s * 0.16, s * (0.2 + i * 0.12), s * 0.68, s * 0.14, 3); g.fill(); }
      g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.12)'; rr(s * 0.16, s * 0.2, s * 0.68, s * 0.6, 4); g.stroke();
    }
    return c;
  };

  // ---------- 상단바 ----------
  U.hud = function (on) { $('hud').hidden = !on; document.body.classList.toggle('playing', !!on); };
  U.dayHud = function () {
    const s = G.save, d = G.flow.day;
    $('vDay').textContent = s.day;
    $('vCoin').textContent = fmt(s.coins);
    const auto = d && d.auto;
    $('lOrd').textContent = auto ? L('출고', 'SHIPPED') : L('주문', 'ORDERS');
    $('lClock').textContent = auto ? L('공장 24시', 'FACTORY 24H') : L('막차 18:00', 'LAST 18:00');
    $('vOrd').textContent = !d ? '-' : auto ? fmt(s.stats.orders) : Math.min(d.i, d.orders.length) + '/' + d.orders.length;
    U.bizHud();
  };
  // 4장부터: 기업가치·공장 1초 수입, 지도 단추
  U.bizHud = function () {
    const on = BIZ.on(), r = BIZ.rate();
    $('tShop').hidden = !on; // 1~3장 상점은 하루 끝에
    $('sDay').hidden = on; $('sVal').hidden = !on; $('sRate').hidden = !on || !r; $('tHow').hidden = on; /* 만들기·포장·택배 안내는 4장부터 없는 일 */ $('tMap').hidden = G.save.ch < 5;
    if (!on) return;
    $('vVal').textContent = fmt(BIZ.value());
    const nx = D.CH[G.save.ch];
    $('tShop').classList.toggle('glow', !!(nx && !G.stepOwned() && G.save.coins >= nx.cost && !(nx.ipo && BIZ.value() < nx.ipo) || (nx && nx.ipo && !G.stepOwned() && BIZ.value() >= D.FAC.peAt)));
    $('vRate').textContent = '+' + fmt(r) + L('/초', '/s');
  };
  let lastCoin = -1;
  U.coin = function () { const v = G.save.coins; if (v !== lastCoin) { $('vCoin').textContent = fmt(v); $('sCoin').classList.remove('flash'); void $('sCoin').offsetWidth; $('sCoin').classList.add('flash'); lastCoin = v; } };
  U.clock = function (k) {
    k = Math.min(1, k);
    // 공장은 0시부터 24시까지, 손으로 만들 땐 9시부터 막차 18시까지
    const auto = G.flow.day && G.flow.day.auto;
    const m = auto ? Math.floor(k * 24 * 60) : 9 * 60 + Math.floor(k * 9 * 60);
    $('vClock').textContent = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    $('sClock').classList.toggle('late', !auto && k > 0.85);
  };

  // ---------- 주문서 ----------
  U.order = function (o) {
    const el = $('order');
    if (!o) { el.classList.add('out'); RND.orderK = 0; return; }
    $('oNo').textContent = L('주문', 'ORDER') + ' #' + (G.save.stats.orders + 1);
    $('oDest').textContent = L(o.dest.ko, o.dest.en);
    const it = $('oItems'); it.innerHTML = '';
    o.items.forEach(([t, n]) => {
      const r = document.createElement('div'); r.className = 'orow';
      r.appendChild(U.icon(t, 30));
      const nm = document.createElement('span'); nm.textContent = L(D.DDEOK[t].ko, D.DDEOK[t].en); r.appendChild(nm);
      const b = document.createElement('b'); b.textContent = '×' + n; r.appendChild(b);
      it.appendChild(r);
    });
    const gr = $('oGrid'); gr.innerHTML = ''; gr.style.gridTemplateColumns = 'repeat(' + o.cols + ',20px)';
    o.slots.forEach((t) => { const i = document.createElement('i'); i.style.background = D.DDEOK[t].color; gr.appendChild(i); });
    $('oWrap').style.background = o.wrap.c;
    $('oWrapL').textContent = L('보자기 ', 'Wrap ') + L(o.wrap.ko, o.wrap.en);
    U.ice(0, o.dest.ice);
    el.classList.remove('out'); RND.orderK = 1;
  };
  U.ice = function (n, need) {
    const el = $('oIce'); el.innerHTML = '';
    for (let i = 0; i < Math.max(n, need); i++) { const x = document.createElement('i'); if (i < n) x.className = i < need ? 'on' : 'over'; el.appendChild(x); }
    $('oIceL').textContent = L('아이스팩 ', 'Ice ') + n + '/' + need;
  };
  // ---------- 4장부터 출고 목록: 상자가 나올 때마다 한 줄씩(위가 최신) ----------
  const iconURL = {};
  const iconOf = (t) => iconURL[t] || (iconURL[t] = U.icon(t, 22).toDataURL());
  let shipQ = [], shipT = 0;
  // 위 막대 기업가치·수입 칸이 번쩍
  U.bizPop = function () { U.bizHud(); ['sRate', 'sVal'].forEach((k) => { const e = $(k); e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); }); };
  U.shipLog = function (on) {
    const el = $('shipLog');
    if (!on) { el.classList.add('out'); RND.orderK = 0; return; }
    $('slT').textContent = L('출고', 'SHIPPED'); $('slN').textContent = ''; $('slList').innerHTML = ''; shipQ = [];
    el.classList.remove('out'); RND.orderK = 1;
  };
  U.shipAdd = function (o) { shipQ.push(o); };
  // 한꺼번에 많이 나오면 0.2초마다 묶어서 붙인다(흐름에서 부름)
  U.shipTick = function (dt) {
    shipT += dt;
    if (shipT < 0.2 || !shipQ.length) return;
    shipT = 0;
    const box = $('slList'), max = RND.portrait ? 4 : 6;
    shipQ.slice(-max).forEach((x) => {
      const r = document.createElement('div'); r.className = 'srow';
      const im = document.createElement('img'); im.src = iconOf(x.type); r.appendChild(im);
      const sp = document.createElement('span'); sp.textContent = '#' + x.no + ' ' + x.dest; r.appendChild(sp);
      const b = document.createElement('b'); b.textContent = '+' + fmt(Math.round(x.coins / 10) * 10); r.appendChild(b);
      box.insertBefore(r, box.firstChild);
    });
    while (box.children.length > max) box.removeChild(box.lastChild);
    $('slN').textContent = '#' + shipQ[shipQ.length - 1].no;
    shipQ = [];
  };
  U.stage = function (k) { for (let i = 0; i < 3; i++) $('st' + i).className = i < k ? 'ok' : i === k ? 'on' : ''; };

  // ---------- 큰 글씨 ----------
  U.banner = function (t, sub) {
    const b = $('banner'); b.innerHTML = ''; b.appendChild(document.createTextNode(t));
    if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  };

  // ---------- 리뷰 폰 ----------
  U.review = function (r, done) {
    busyN++;
    const ph = $('phone');
    $('pPhoto').style.backgroundImage = r.photo ? 'url(' + r.photo + ')' : '';
    const st = $('pStars').children;
    for (let i = 0; i < 5; i++) st[i].className = '';
    $('pText').textContent = '';
    $('pCoin').textContent = '';
    ph.classList.remove('out');
    S('notify');
    let i = 0;
    const star = () => {
      if (i < r.stars) { st[i].className = 'on'; S('star', i); i++; setTimeout(star, 180); return; }
      $('pText').textContent = r.text;
      $('pCoin').textContent = '+' + fmt(r.coins);
      const p = document.getElementById('pCoin').getBoundingClientRect();
      coinsFrom(p.left + p.width / 2, p.top + p.height / 2, () => U.coin());
      let closed = false;
      const close = () => { if (closed) return; closed = true; ph.classList.add('out'); busyN--; ph.removeEventListener('pointerdown', close); setTimeout(done, 350); };
      ph.addEventListener('pointerdown', close);
      setTimeout(close, 2600);
    };
    setTimeout(star, 450);
  };
  // 폰에서 상단바 코인 칸으로 코인이 날아감
  function coinsFrom(x0, y0, done) {
    const layer = $('fxl'), r = $('sCoin').getBoundingClientRect();
    const x1 = r.left + 22, y1 = r.top + r.height / 2;
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('i'); el.className = 'fcoin'; layer.appendChild(el);
      const ox = (Math.random() - 0.5) * 80, oy = (Math.random() - 0.5) * 30;
      FX.tw(0.6, (u) => { const e = FX.ease.inOut(u); el.style.transform = `translate(${x0 + ox + (x1 - x0 - ox) * e}px,${y0 + oy + (y1 - y0 - oy) * e - Math.sin(u * Math.PI) * 140}px)`; }, () => { el.remove(); S('coin'); if (i === 7 && done) done(); }, FX.ease.lin, i * 0.05);
    }
  }

  // ---------- 하루 끝 ----------
  U.dayEnd = function (o) {
    busyN++;
    $('deT').textContent = 'DAY ' + o.day + ' CLEAR';
    U.dayEndBtn();
    $('deSales').textContent = fmt(o.sales);
    $('deBoxes').textContent = o.boxes;
    $('deStars').textContent = o.avg.toFixed(1);
    $('deGoal').textContent = fmt(o.chSales);
    $('deFacR').hidden = !o.factory; $('deFac').textContent = '+' + fmt(o.factory || 0);
    $('deRoyR').hidden = !o.roy; $('deRoy').textContent = '+' + fmt(o.roy || 0);
    $('dayEnd').hidden = false;
  };
  // 다음 단계 살 돈이 모이면 상점 단추가 반짝
  U.dayEndBtn = function () {
    const nx = D.CH[G.save.ch], ok = nx && !G.stepOwned() && G.save.coins >= nx.cost && !(nx.ipo && BIZ.value() < nx.ipo);
    $('deStepR').hidden = true;
    $('bNext').textContent = 'NEXT';
    $('bShop').classList.toggle('glow', !!ok);
  };
  $('bNext').onclick = () => { S('click'); $('dayEnd').hidden = true; busyN--; G.afterDay(); };
  $('bShop').onclick = () => { S('click'); U.shop(); };

  // ---------- 상점 ----------
  // 상점 칸 하나: cls(step·wide 등), 이름, 설명, 값(null 이면 OWNED), 못 사는 까닭(lock 글), 살 때
  function item(box, o) {
    const d = document.createElement('div'); d.className = 'item' + (o.sec ? ' sec' : '') + (o.cls ? ' ' + o.cls : '') + (o.own ? ' own' : '');
    d.innerHTML = (o.tag ? '<span class="tag"></span>' : '') + '<b></b><small></small>';
    if (o.tag) d.querySelector('.tag').textContent = o.tag;
    d.querySelector('b').textContent = o.name;
    d.querySelector('small').textContent = o.desc || '';
    if (o.sec) { box.appendChild(d); return; }
    const can = !o.own && !o.lock && (o.price == null || G.save.coins >= o.price);
    const btn = document.createElement('button'); btn.className = 'btn ' + (o.pink ? '' : 'kr ') + 'buy' + (can ? '' : ' poor');
    if (o.own) btn.textContent = 'OWNED';
    else if (o.label) btn.textContent = o.label;
    else { btn.innerHTML = '<i class="coinI"></i>'; btn.appendChild(document.createTextNode(fmt(o.price))); }
    btn.onclick = () => {
      if (o.own) return;
      if (o.label) { o.buy(); return; }
      if (o.lock || G.save.coins < o.price) { S('fail'); return; }
      o.buy(); S('fanfare'); U.coin(); U.bizHud();
      // 다음 단계를 사면 상점을 닫고 바로 넘어간다
      if (G.stepOwned()) return U.shopClose();
      const nm = o.name; U.shop(); U.dayEndBtn();
      // 방금 산 칸이 톡 튀며 반짝
      const just = [...$('shItems').querySelectorAll('.item b')].find((x) => x.textContent === nm);
      if (just) just.parentElement.classList.add('just');
    };
    d.appendChild(btn); box.appendChild(d);
  }
  const built = []; // 상점에서 산 공장 물건(닫을 때 공장으로 가서 보여 줌)
  U.shop = function () {
    $('shCoin').textContent = fmt(G.save.coins);
    const box = $('shItems'); box.innerHTML = '';
    const ch = G.save.ch;
    // 맨 위: 다음 단계(오떡닷컴 오픈·가맹 1호점·…·나스닥 상장)
    const nx = D.CH[ch];
    if (nx) {
      const v = BIZ.value(), lock = nx.ipo && v < nx.ipo;
      item(box, { cls: 'step', pink: true, tag: L('다음 단계', 'NEXT STEP'), name: L(nx.ko, nx.en), own: G.stepOwned(), price: nx.cost, lock,
        desc: nx.ipo ? L('기업가치 ', 'Value ') + fmt(v) + ' / ' + fmt(nx.ipo) : nx.n === 2 ? L('택배 주문 사이트를 연다', 'Open the delivery website') : nx.n === 4 ? L('대형 공장을 짓는다', 'Build a big factory') : nx.n === 5 ? L('전국 가맹 지도가 열린다', 'Open the franchise map') : nx.n === 6 ? L('세계 지도가 열린다', 'Open the world map') : L('가맹점 ' + fmt(nx.shops) + '곳', fmt(nx.shops) + ' stores'),
        buy() { G.save.coins -= nx.cost; G.save.step = ch + 1; G.store(); } });
    }
    // 6장: 기업가치 5천억을 넘으면 사모펀드 칸이 뜬다(누르면 M&A 로 곧장 나스닥)
    if (nx && nx.ipo && !G.stepOwned() && BIZ.value() >= D.FAC.peAt) {
      const v = BIZ.value(), at = D.FAC.peAt;
      // 돈이 아니라 기업가치 5천억으로 하는 특별 딜
      item(box, { cls: 'deal', pink: true, tag: L('특별 딜', 'SPECIAL DEAL'), name: L('사모펀드', 'Private Equity'), desc: L('기업가치 ', 'Value ') + fmt(v) + ' / ' + fmt(at), label: fmt(at),
        buy() {
          S('fanfare');
          // 상점을 닫고 공장 위에서 M&A 완료 → 곧장 증권거래소
          $('shop').hidden = true; G.paused = false; UI.bizPop();
          U.banner(L('M&A 완료', 'M&A Complete'), L('기업가치 ', 'Value ') + fmt(BIZ.value()));
          // 기업가치가 눈앞에서 수직 상승
          const sub = $('banner').querySelector('small');
          FX.tw(1.5, (u) => { G.save.mna = D.FAC.peAdd * u; U.bizHud(); sub.textContent = L('기업가치 ', 'Value ') + fmt(BIZ.value()); }, () => { G.save.mna = D.FAC.peAdd; G.store(); UI.bizPop(); }, FX.ease.lin);
          const c = new THREE.Vector3(FACT.CX, 2.4, 0);
          [0, 0.35, 0.7, 1.05].forEach((t, i) => FX.wait(t, () => { FX.burst(c.clone().add(new THREE.Vector3((i - 1.5) * 3.2, 0, 0)), { n: 26, kind: 'heart', color: ['#ffd95a', '#ff7aa8', '#7ff0b0'], size: 0.26, speed: 4, up: 5, glow: true }); S('coin'); }));
          FX.wait(2.6, () => { G.save.step = G.save.ch + 1; G.store(); U.shopClose(); });
        } });
    }
    // 4장부터: 공장
    if (BIZ.on()) {
      // 레일 추가: 빈자리 8칸까지
      const t = BIZ.free()[0], k = BIZ.lines().length;
      item(box, { sec: 1, name: L('레일 추가', 'Add Rail'), desc: L('레일 ', 'Rails ') + k + '/' + BIZ.MAX + L('  1초 +', '  +') + fmt(BIZ.rate(true)) + L('', '/s') });
      if (t) item(box, { name: L(D.DDEOK[t].ko + ' 레일', D.DDEOK[t].en + ' Rail'), desc: L('1초 +', '+') + fmt(BIZ.lineRate(k) * BIZ.mul()) + L('', '/s'), price: BIZ.lineCost(),
        buy() { BIZ.buyLine(); built.push({ line: t }); } });
      else item(box, { name: L('레일 8칸 모두 가동', 'All 8 rails running'), own: true });
      // 기계 추가: 레일 전체에 붙는 설비
      item(box, { sec: 1, name: L('기계 추가', 'Add Machines') });
      D.FUP.forEach((u) => item(box, { name: L(u.ko, u.en), desc: L(u.d[0], u.d[1]), own: G.gear(u.k), price: u.price, lock: !BIZ.lines().length,
        buy() { G.save.coins -= u.price; G.save.gear[u.k] = true; G.store(); built.push({ up: u.k }); } }));
    }
    // 5장부터: 가맹 지도
    if (ch >= 5) {
      const left = D.CITY.filter((c) => c.ch <= ch && !BIZ.cities()[c.k]).length;
      item(box, { cls: 'wide', name: L(ch >= 6 ? '세계 가맹 지도' : '전국 가맹 지도', ch >= 6 ? 'World Franchise Map' : 'Franchise Map'), desc: L('로열티 하루 +', 'Royalty +') + fmt(BIZ.roy()) + L(' · 남은 도시 ', '/day · cities left ') + left, label: L('지도 열기', 'OPEN MAP'), pink: true,
        buy() { S('click'); WORLD.open(); } });
    }
    // 손으로 만들 때 쓰는 도구는 3장까지(공장은 24시간 기계가 돈다)
    const tools = ch < 4 ? D.SHOP.filter((it) => it.ch <= ch) : [];
    if (tools.length) item(box, { sec: 1, name: L('도구', 'Tools') });
    tools.forEach((it) => item(box, { name: L(it.ko, it.en), desc: L(it.d[0], it.d[1]), own: G.gear(it.k), price: it.price,
      buy() { G.save.coins -= it.price; G.save.gear[it.k] = true; G.store(); } }));
    $('shop').hidden = false;
  };
  // 위 막대 상점 단추: 영업 중에도 연다(여는 동안 시계는 멈춤)
  let shopPause = null;
  $('tShop').onclick = (e) => {
    e.stopPropagation();
    if (G.lock || !$('shop').hidden) return;
    S('click'); shopPause = { p: G.paused }; G.paused = true; G.lock = true; U.shop();
  };
  U.shopClose = function () {
    $('shop').hidden = true; U.dayEndBtn();
    if (shopPause) { G.paused = shopPause.p; G.lock = false; shopPause = null; }
    const adv = G.stepOwned();
    if (!built.length && !adv) return;
    const de = !$('dayEnd').hidden;
    if (de) $('dayEnd').hidden = true;
    const fin = () => { if (adv) { if (de) busyN--; G.advance(); } else if (de) $('dayEnd').hidden = false; };
    if (built.length) FACT.visit(built.splice(0), fin); else fin();
  };
  $('bShopX').onclick = () => { S('click'); U.shopClose(); };

  // ---------- GAME OVER ----------
  U.over = function (n) { busyN++; $('ovN').textContent = n; $('over').hidden = false; };
  $('bRetry').onclick = () => { S('click'); $('over').hidden = true; busyN--; G.retryDay(); };

  // ---------- 장 끝 ----------
  $('bCh').onclick = () => { S('click'); $('chClear').hidden = true; busyN--; G.nextChapter(); };


  // ---------- 새 떡 안내 ----------
  U.newDdeok = function (types, done) {
    busyN++; G.paused = true;
    const box = $('ndList'); box.innerHTML = '';
    types.forEach((t) => {
      const r = document.createElement('div'); r.className = 'nd';
      r.appendChild(U.icon(t, 64));
      const tx = document.createElement('div');
      const b = document.createElement('b'); b.textContent = L(D.DDEOK[t].ko, D.DDEOK[t].en); tx.appendChild(b);
      const p = document.createElement('p'); p.textContent = L(D.TIP[t][0], D.TIP[t][1]); tx.appendChild(p);
      r.appendChild(tx); box.appendChild(r);
      G.save.seen = G.save.seen || {}; G.save.seen[t] = 1;
    });
    G.store();
    S('notify');
    $('newOv').hidden = false;
    $('ndOk').onclick = () => { S('click'); $('newOv').hidden = true; busyN--; G.paused = false; done(); };
  };

  // ---------- 장 끝: 지도에 핀 ----------
  function drawMap(c, ch, n0, n1, k) {
    const cv = $('ccMapC'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#d9efff'; g.beginPath(); g.roundRect ? g.roundRect(0, 0, W, H, 18) : g.rect(0, 0, W, H); g.fill();
    const world = !!c.world;
    let pts;
    if (!world) {
      // 한반도(둥근 모양) + 제주
      g.fillStyle = '#c6ebb4';
      g.beginPath(); g.moveTo(W * 0.5, H * 0.08); g.bezierCurveTo(W * 0.66, H * 0.12, W * 0.7, H * 0.42, W * 0.64, H * 0.62); g.bezierCurveTo(W * 0.6, H * 0.84, W * 0.48, H * 0.88, W * 0.41, H * 0.84); g.bezierCurveTo(W * 0.34, H * 0.7, W * 0.33, H * 0.46, W * 0.38, H * 0.28); g.bezierCurveTo(W * 0.41, H * 0.16, W * 0.45, H * 0.09, W * 0.5, H * 0.08); g.fill();
      g.beginPath(); g.ellipse(W * 0.42, H * 0.94, W * 0.05, H * 0.025, 0, 0, 7); g.fill();
      pts = (i) => { const r1 = Math.sin(i * 12.9898) * 43758.5453, r2 = Math.sin(i * 78.233) * 12345.678; const u = r1 - Math.floor(r1), v = r2 - Math.floor(r2); return [W * (0.4 + u * 0.22), H * (0.2 + v * 0.62)]; };
    } else {
      g.fillStyle = '#c6ebb4';
      [[0.18, 0.35, 0.13, 0.12], [0.25, 0.68, 0.06, 0.14], [0.5, 0.32, 0.08, 0.1], [0.53, 0.62, 0.07, 0.15], [0.72, 0.36, 0.17, 0.13], [0.84, 0.75, 0.06, 0.05]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(W * x, H * y, W * a, H * b, 0.2, 0, 7); g.fill(); });
      const spots = [[0.18, 0.35, 0.13, 0.12], [0.5, 0.32, 0.08, 0.1], [0.72, 0.36, 0.17, 0.13], [0.53, 0.62, 0.07, 0.15], [0.25, 0.68, 0.06, 0.14], [0.84, 0.75, 0.06, 0.05]];
      pts = (i) => { const s = spots[i % spots.length]; const r1 = Math.sin(i * 12.9898) * 43758.5453, r2 = Math.sin(i * 78.233) * 12345.678; const u = r1 - Math.floor(r1) - 0.5, v = r2 - Math.floor(r2) - 0.5; return [W * (s[0] + u * s[2] * 1.4), H * (s[1] + v * s[3] * 1.4)]; };
    }
    const show = Math.min(60, Math.round(n0 + (Math.min(n1, 60) - n0) * k));
    for (let i = 0; i < show; i++) {
      const [x, y] = pts(i);
      const pop = i >= n0 ? Math.min(1, (k * Math.min(n1, 60) - i + 1)) : 1;
      if (pop <= 0) continue;
      const r = 7 * Math.min(1.25, pop * 1.25);
      g.fillStyle = '#ff5a7a'; g.beginPath(); g.arc(x, y - r * 0.6, r, 0, 7); g.fill();
      g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.3); g.lineTo(x, y + r * 0.8); g.lineTo(x + r * 0.6, y - r * 0.3); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - r * 0.6, r * 0.4, 0, 7); g.fill();
    }
  }
  U.chapterClear = function (c, sales) {
    busyN++;
    S('fanfare');
    $('ccT').textContent = L(c.ko, c.en) + ' CLEAR';
    $('ccSales').textContent = fmt(sales);
    const prev = DATA.CH[c.n - 2] ? DATA.CH[c.n - 2].shops : 0;
    // 4장부터는 실제로 낸 가맹점 수
    const nxt = c.n >= 4 ? Math.max(BIZ.stores(), c.n === 4 ? 48 : 0) : DATA.CH[c.n] ? DATA.CH[c.n].shops : c.shops;
    $('chClear').hidden = false;
    // 핀이 하나씩 쿵쿵 박히고 숫자가 오른다
    let k = 0, lastPin = -1;
    const n0 = Math.min(60, c.shops), n1 = Math.max(n0 + 1, Math.min(60, nxt));
    const from = c.n >= 5 ? G.save.shown || c.shops : c.shops, to = nxt;
    G.save.shown = to; G.store();
    const step = () => {
      if ($('chClear').hidden) return;
      k = Math.min(1, k + 0.012);
      drawMap(DATA.CH[c.n] || c, c.n, n0, n1, k);
      $('ccShops').textContent = fmt(Math.round(from + (to - from) * k));
      const pin = Math.floor(k * (n1 - n0));
      if (pin !== lastPin) { lastPin = pin; S('pop', 0.9 + (pin % 6) * 0.08); }
      if (k < 1) requestAnimationFrame(step); else S('ding', 6);
    };
    setTimeout(step, 500);
  };

  // ---------- 엔딩: 나스닥 종 ----------
  G.ending = function () {
    busyN++;
    G.station = null; UI.order(null); U.hud(false); $('keys').hidden = true;
    EXCH.open(() => U.card());
  };
  // ---------- 결과 카드 ----------
  const TITLES = [[4.6, '떡의 제왕', 'King of Ddeok'], [4.2, '떡 재벌', 'Ddeok Tycoon'], [3.6, '떡 CEO', 'Ddeok CEO'], [0, '운 좋은 떡장수', 'Lucky Ddeok Seller']];
  U.cardInfo = function () {
    const s = G.save, st = s.stats;
    const avg = st.orders ? st.stars / st.orders : 0;
    const t = TITLES.find((x) => avg >= x[0]);
    return { avg, title: L(t[1], t[2]), sales: s.total, boxes: st.boxes, five: st.five, perfect: st.perfect, shops: BIZ.stores(), value: BIZ.value(), nations: BIZ.countries(), lines: BIZ.lines().length };
  };
  U.drawCard = function (shot) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const g = c.getContext('2d'), info = U.cardInfo();
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    const bg = g.createLinearGradient(0, 0, 0, 1350); bg.addColorStop(0, '#ffe3ec'); bg.addColorStop(1, '#ffd2e1'); g.fillStyle = bg; g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(508, 0, 64, 1350);
    if (shot) { g.save(); rr(70, 210, 940, 560, 40); g.clip(); g.drawImage(shot, 0, 0, shot.width, shot.height, 70, 210, 940, 560); g.restore(); }
    g.lineWidth = 10; g.strokeStyle = '#fff'; rr(70, 210, 940, 560, 40); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = "120px 'Ttl',sans-serif"; g.lineWidth = 26; g.strokeStyle = '#d9547e'; g.strokeText(L('오떡닷컴', 'otteok.com'), 540, 110); g.fillStyle = '#fff'; g.fillText(L('오떡닷컴', 'otteok.com'), 540, 110);
    g.font = "64px 'Ttl',sans-serif"; g.lineWidth = 16; g.strokeText(L('나스닥 상장', 'NASDAQ IPO'), 540, 840); g.fillStyle = '#fff'; g.fillText(L('나스닥 상장', 'NASDAQ IPO'), 540, 840);
    g.fillStyle = '#fff'; rr(110, 900, 860, 300, 34); g.fill();
    const rows = [[L('기업가치', 'Company value'), fmt(info.value)], [L('총 출고', 'Boxes shipped'), fmt(info.boxes) + L('상자', '')], [L('세계 가맹점', 'Stores worldwide'), fmt(info.shops) + L('곳', '')], [L('진출 나라', 'Countries'), info.nations + L('개국', '')]];
    rows.forEach(([a, b], i) => { const x = i % 2 ? 760 : 320, y = 975 + Math.floor(i / 2) * 140; g.fillStyle = '#a07b90'; g.font = "36px 'Ui',sans-serif"; g.fillText(a, x, y); g.fillStyle = '#4a2f43'; g.font = "64px 'Ttl',sans-serif"; g.fillText(b, x, y + 62); });
    g.font = "58px 'Ttl',sans-serif"; g.lineWidth = 14; g.strokeStyle = '#d9547e'; g.strokeText(info.title, 540, 1255); g.fillStyle = '#fff'; g.fillText(info.title, 540, 1255);
    g.font = "32px 'Ui',sans-serif"; g.fillStyle = '#d9547e'; g.fillText('oreumgames.com', 540, 1318);
    return c;
  };
  U.card = function () {
    S('fanfare');
    let shot = null;
    try { RND.render(); shot = RND.renderer.domElement; const tmp = document.createElement('canvas'); tmp.width = 940; tmp.height = 560; const sw = shot.width, sh = shot.height, k = Math.min(sw / 940, sh / 560); tmp.getContext('2d').drawImage(shot, (sw - 940 * k) / 2, (sh - 560 * k) / 2, 940 * k, 560 * k, 0, 0, 940, 560); shot = tmp; } catch (e) { shot = null; }
    const cv = U.drawCard(shot);
    $('cardImg').src = cv.toDataURL('image/png');
    $('cardOv').hidden = false;
    G.save.done = true; G.store();
    $('bSave').onclick = () => { S('click'); const a = document.createElement('a'); a.href = cv.toDataURL('image/png'); a.download = 'otteok_result.png'; a.click(); };
    $('bShare').onclick = async () => {
      S('click');
      const info = U.cardInfo();
      const url = window.OT_SHARE_URL || location.href.split('?')[0].split('#')[0];
      const text = L('오떡닷컴 나스닥 상장! 기업가치 ' + fmt(info.value) + ' ' + info.title, 'otteok.com is on NASDAQ! Value ' + fmt(info.value) + ' ' + info.title);
      try { if (navigator.share) { await navigator.share({ title: L('오떡닷컴', 'otteok.com'), text, url }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(text + ' ' + url); } catch (e) {}
      U.banner(L('주소를 복사했습니다', 'Link copied'), '');
    };
    $('bEnd').onclick = () => { S('click'); location.reload(); };
  };

  // ---------- 타이틀 ----------
  function showTitle() {
    const s = G.save;
    const cont = s.started && !s.done;
    $('bCont').hidden = !cont; $('bNew').hidden = !cont; $('bStart').hidden = cont;
    $('keys').hidden = true;
    RND.decor(Math.min(DATA.CH.length, s.ch || 1)); RND.setSign(DATA.CH[Math.min(DATA.CH.length, s.ch || 1) - 1].sign);
    $('title').hidden = false;
    RND.focus(RND.ST.pack + 1, 0.3, 13.5, 1.2);
    RND.applyCam(true);
  }
  function go(fresh) {
    S('click'); if (window.SND) SND.unlock();
    if (fresh) { const h = G.save.how; localStorage.removeItem('otteok.save'); Object.keys(G.save).forEach((k) => delete G.save[k]); /* 앞 판의 매출·공장 돈·M&A 가 남지 않게 */ Object.assign(G.save, JSON.parse(JSON.stringify(G.freshSave()))); G.save.how = h; }
    G.save.started = true; G.store();
    $('title').hidden = true; $('keys').hidden = false;
    if (!G.save.how && window.HOW) HOW.open(() => G.startDay()); else G.startDay();
  }
  $('bStart').onclick = () => go(true);
  $('bCont').onclick = () => go(false);
  $('bNew').onclick = () => go(true);

  // ---------- 토글 ----------
  function tg(id, on, f) { const b = $(id); b.classList.toggle('off', !on); b.onclick = (e) => { e.stopPropagation(); on = !on; b.classList.toggle('off', !on); f(on); }; }
  $('tMap').onclick = (e) => { e.stopPropagation(); S('click'); WORLD.open(); };
  tg('tBgm', SND.bgm, (on) => SND.setBgm(on));
  tg('tSfx', SND.sfx, (on) => SND.setSfx(on));

  U.init = showTitle;
})();
