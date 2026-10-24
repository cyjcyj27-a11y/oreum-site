// 화면: 상단바·말풍선·익힘 고리·창·손 입력
(function () {
  const U = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const D = DATA, PI = Math.PI;
  let G, S;
  const touch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
  U.touch = touch;

  U.boot = function () {
    G = GAME; S = G.S;
    if (touch) document.body.classList.add('touch');
    if (window.EN) document.querySelectorAll('[data-en]').forEach((e) => (e.textContent = e.dataset.en));
    G.boot();
    const go = () => { RND.boot(); G.title(); U.show('title'); PEOPLE.loadAll().then(() => { if (G.mode === 'title') G.titleCust(); }); };
    (document.fonts ? Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('60px Ui')]).then(go, go) : go());
    togs(); wire(); input(); rings();
    checkRotate(); addEventListener('resize', checkRotate); addEventListener('orientationchange', () => setTimeout(checkRotate, 200));
  };

  // ---------- 화면 바꾸기 ----------
  U.show = function (m) {
    S = G.S;
    const play = m === 'play';
    $('title').hidden = m !== 'title';
    $('hud').hidden = !play;
    $('keys').hidden = !play || touch;
    document.body.classList.toggle('playing', play || m === 'ending');
    ['res', 'over', 'end', 'shop'].forEach((id) => ($(id).hidden = true));
    if (m === 'title') {
      const has = S.started && !S.done;
      $('bStart').hidden = has; $('bCont').hidden = !has; $('bNew').hidden = !has;
      $('honeyB').hidden = true;
    }
    if (play) { U.hud(); U.angryMark(0); U.honey(G.T().honey, 0); }
  };
  U.paused = () => !$('how').hidden || !$('shop').hidden || !$('rotate').hidden || !$('dayB').hidden && dayHold;
  function checkRotate() { const land = touch && innerWidth > innerHeight && innerHeight < 560; if (land && $('rotate').hidden && G.held) G.dropHeld(); $('rotate').hidden = !land; }

  // ---------- 상단바 ----------
  U.hud = function () {
    const T = G.T(); if (!T) return;
    $('vDay').textContent = T.day >= D.DAYS ? L('마지막 날', 'FINAL') : L(T.day + '일차', 'DAY ' + T.day);
    const co = (S.coins + T.earn + T.tips).toLocaleString();
    if ($('vCoin').textContent !== co) { $('vCoin').textContent = co; flash('sCoin'); }
    $('vLeft').textContent = T.queue.length + T.cust.filter((c) => c && c.state !== 'out').length;
  };
  function flash(id) { const e = $(id); e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); }
  let lastOil = -1;
  U.hudOil = function (f) {
    const v = Math.round(f * 100); if (v === lastOil) return; lastOil = v;
    $('iOil').style.transform = 'scaleX(' + Math.max(0, f) + ')';
    $('bOil').classList.toggle('low', f < 0.2);
    $('oilHint').classList.toggle('on', f < 0.2);
  };
  U.angryMark = function (n) { [...$('vAngry').children].forEach((e, i) => e.classList.toggle('on', i < n)); if (n) flash('sAngry'); };
  U.honey = function (n, t) {
    const full = n >= D.PERFECT_FOR_HONEY;
    $('iHoney').style.transform = 'scaleY(' + n / D.PERFECT_FOR_HONEY + ')';
    $('honeyB').hidden = !(full || t > 0) || G.mode !== 'play';
    $('honeyB').classList.toggle('ready', full && !(t > 0));
    $('honeyB').classList.toggle('run', t > 0);
    document.body.classList.toggle('honeyT', t > 0);
  };

  // ---------- 날 시작 띠 ----------
  let dayHold = false;
  U.dayBanner = function (day, nw) {
    const b = $('dayB'); b.hidden = false; dayHold = true;
    $('dayN').textContent = day >= D.DAYS ? L('마지막 날', 'FINAL DAY') : L(day + '일차', 'DAY ' + day);
    const sub = $('daySub'); sub.innerHTML = '';
    if (day >= D.DAYS) sub.textContent = L('영화제 밤', 'Film Festival Night');
    else if (nw) {
      const c = document.createElement('canvas'); c.width = c.height = 120; drawIcon(c.getContext('2d'), nw === 'crispy' ? { kind: 'honey', crispy: true } : { kind: nw }, 60, 60, 1.25);
      const t = document.createElement('span'); t.textContent = 'NEW  ' + (nw === 'crispy' ? L('바삭하게', 'Extra Crispy') : L(D.KIND[nw].ko, D.KIND[nw].en));
      sub.append(c, t);
    }
    b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
    setTimeout(() => { dayHold = false; }, 1200);
    setTimeout(() => { b.hidden = true; }, 2300);
    if (!S.how) setTimeout(() => U.openHow(), 900);
  };

  // ---------- 손님 말풍선 ----------
  const bubbles = new Map();
  U.clearBubbles = () => { bubbles.forEach((b) => b.el.remove()); bubbles.clear(); };
  U.bubble = function (c) {
    let b = bubbles.get(c);
    if (!b) { const el = document.createElement('div'); el.className = 'bub'; el.innerHTML = '<div class="its"></div><div class="pat"><i></i></div>'; $('bubs').appendChild(el); b = { el, c }; bubbles.set(c, b); }
    const its = b.el.querySelector('.its'); its.innerHTML = '';
    // 같은 주문끼리 묶어 ×n
    const groups = [];
    c.items.forEach((it) => { const g = groups.find((x) => x.kind === it.kind && x.crispy === it.crispy); if (g) { g.n++; if (it.done) g.d++; } else groups.push({ kind: it.kind, crispy: it.crispy, n: 1, d: it.done ? 1 : 0 }); });
    groups.forEach((g) => {
      const w = document.createElement('div'); w.className = 'it' + (g.d >= g.n ? ' done' : '');
      const cv = document.createElement('canvas'); cv.width = cv.height = 96; drawIcon(cv.getContext('2d'), g, 48, 48, 1);
      w.appendChild(cv);
      if (g.n > 1) { const n = document.createElement('b'); n.textContent = '×' + (g.n - g.d); w.appendChild(n); }
      its.appendChild(w);
    });
  };
  U.removeBubble = (c) => { const b = bubbles.get(c); if (b) { b.el.remove(); bubbles.delete(c); } };
  U.bubbleLeave = function (c, happy) {
    const b = bubbles.get(c); if (!b) return;
    b.el.classList.add(happy ? 'happy' : 'mad');
    b.el.querySelector('.its').innerHTML = happy ? '<span class="heart"></span>' : '<span class="madk">' + L('흥!', 'HMPH!') + '</span>';
    setTimeout(() => U.removeBubble(c), 1100);
  };
  U.no = function (c) { const b = bubbles.get(c); if (!b) return; b.el.classList.remove('nope'); void b.el.offsetWidth; b.el.classList.add('nope'); };
  U.custScreen = function (c) { return RND.toScreen(new THREE.Vector3(c.x1, -0.9 + c.model.height * 0.8, RND.CUST_Z)); };
  U.custRect = function (c) {
    const top = RND.toScreen(new THREE.Vector3(c.x1, -0.9 + c.model.height + 0.05, RND.CUST_Z)), bot = RND.toScreen(new THREE.Vector3(c.x1, 0, RND.CUST_Z + 0.2));
    const side = RND.toScreen(new THREE.Vector3(c.x1 + 0.22, 0, RND.CUST_Z)); const hw = Math.abs(side[0] - bot[0]);
    return { x0: top[0] - hw, x1: top[0] + hw, y0: top[1], y1: bot[1] };
  };
  U.bubblePos = function (c) {
    const b = bubbles.get(c); if (!b) return;
    const r = c.model.root.position;
    const wide = innerWidth > innerHeight * 1.1;
    b.el.classList.toggle('side', wide);
    if (wide) { // 가로 화면: 머리 오른쪽 옆
      const p = RND.toScreen(new THREE.Vector3(r.x + 0.13, r.y + c.model.height - 0.12, r.z));
      b.el.style.transform = 'translate(' + Math.round(p[0]) + 'px,' + Math.round(p[1]) + 'px) translate(0,-50%)';
    } else {
      const p = RND.toScreen(new THREE.Vector3(r.x, r.y + c.model.height + 0.1, r.z));
      const top = $('hud').hidden ? 8 : Math.max($('hud').getBoundingClientRect().bottom, $('g2').getBoundingClientRect().bottom) + 6;
      b.el.style.transform = 'translate(' + Math.round(p[0]) + 'px,' + Math.round(Math.max(top + b.el.offsetHeight, p[1])) + 'px) translate(-50%,-100%)';
    }
    const f = Math.max(0, c.pat / c.patMax);
    const i = b.el.querySelector('.pat i'); i.style.transform = 'scaleX(' + f + ')';
    b.el.classList.toggle('low', f < 0.3 && c.state === 'wait');
  };
  U.tickBubbles = function () {};
  U.hiCust = function (c) { bubbles.forEach((b) => b.el.classList.toggle('hi', b.c === c)); };

  // 주문 그림: 호떡(노릇한 원) + 씨앗 더미 / 치즈 / 바삭(갈색 테 + 김)
  // 주문 그림: 반죽 색 호떡 + 한 입 베어 문 자리로 속을 보여 줌 / 씨앗 더미 / 공갈은 둥근 부푼 빵 / 바삭은 불꽃
  const ICOL = { plain: ['#f2c27a', '#d79446', '#a8601e', '#8a4a14'], green: ['#c9cf78', '#a3a64a', '#6f7226', '#4e5218'], black: ['#9a6a78', '#6e4252', '#4a2632', '#2e1820'] };
  function drawIcon(g, it, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s);
    const K = DATA.KIND[it.kind] || DATA.KIND.honey, crisp = it.crispy, k = it.kind;
    const c = ICOL[K.dough] || ICOL.plain;
    const puff = k === 'gonggal';
    g.fillStyle = 'rgba(60,30,10,.25)'; g.beginPath(); g.ellipse(2, 26, 36, 9, 0, 0, 7); g.fill();
    const gr = g.createRadialGradient(-8, puff ? -10 : -6, 4, 0, 4, 40);
    gr.addColorStop(0, crisp ? '#d48a3c' : c[0]); gr.addColorStop(0.7, crisp ? '#a2551e' : c[1]); gr.addColorStop(1, crisp ? '#6a3010' : c[2]);
    g.fillStyle = gr; g.beginPath();
    const bite = !puff && K.fill && K.fill !== 'sugar' || k === 'honey' || k === 'green' || k === 'black';
    if (puff) g.ellipse(0, 2, 34, 30, 0, 0, 7);
    else g.ellipse(0, 8, 38, 26, 0, 0, 7);
    g.fill(); g.strokeStyle = crisp ? '#4a200a' : c[3]; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(150,80,20,.3)'; [[-14, 2, 8], [10, 12, 9], [16, -2, 5]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.6, 0, 0, 7); g.fill(); });
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(-12, puff ? -14 : -4, 12, 4, -0.2, 0, 7); g.fill();
    // 한 입 베어 문 자리 + 속
    if (bite && K.fill && !(k === 'seed' || k === 'seed2')) {
      const fc = { sugar: ['#5a2a0c', '#8a4a18'], bean: ['#4a1418', '#7a2a30'], cheese: ['#ffe58a', '#f2b81a'], japchae: ['#a07a40', '#3c7a2a'] }[K.fill];
      g.save(); g.beginPath(); g.ellipse(26, 2, 15, 13, 0, 0, 7); g.clip();
      g.fillStyle = fc[0]; g.fillRect(8, -14, 36, 32);
      if (K.fill === 'cheese') { g.fillStyle = fc[1]; [[18, -2], [24, 6], [30, -4], [22, 12]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }); }
      else if (K.fill === 'japchae') { g.strokeStyle = '#d8b880'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(12, -8 + i * 5); g.quadraticCurveTo(22, -12 + i * 5, 34, -6 + i * 5); g.stroke(); } g.fillStyle = fc[1]; g.fillRect(20, 0, 6, 3); g.fillStyle = '#e8762a'; g.fillRect(26, -6, 5, 3); }
      else { g.fillStyle = fc[1]; g.beginPath(); g.ellipse(22, 0, 6, 3, 0.3, 0, 7); g.fill(); }
      g.restore();
      g.strokeStyle = c[3]; g.lineWidth = 2.5; g.beginPath(); g.ellipse(26, 2, 15, 13, 0, Math.PI * 0.55, Math.PI * 1.45); g.stroke();
    }
    if (k === 'seed' || k === 'seed2') {
      g.fillStyle = '#3a1806'; g.beginPath(); g.ellipse(0, 6, 24, k === 'seed2' ? 7 : 5, 0, 0, 7); g.fill();
      const n = k === 'seed2' ? 26 : 13, hh = k === 'seed2' ? 26 : 16;
      for (let i = 0; i < n; i++) { const u = (i / n - 0.5) * 1.8, x = u * 22 + Math.sin(i * 7) * 3, y = 4 - (1 - u * u) * hh * (0.4 + (i % 3) * 0.25); g.save(); g.translate(x, y); g.rotate(i * 1.3); g.fillStyle = ['#d8cba5', '#5f7e38', '#c99358'][i % 3]; g.beginPath(); g.ellipse(0, 0, 5.5, 2.8, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 1; g.stroke(); g.restore(); }
    }
    if (puff) { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 2, 24, Math.PI * 1.15, Math.PI * 1.5); g.stroke(); }
    if (crisp) { g.strokeStyle = '#e8502a'; g.lineWidth = 4; g.lineCap = 'round'; [[-22, -22], [0, -28], [22, -22]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y + 12); g.quadraticCurveTo(x - 7, y + 4, x, y - 2); g.quadraticCurveTo(x + 7, y + 4, x, y + 12); g.stroke(); }); }
    g.restore();
  }
  U.drawIcon = drawIcon;

  // ---------- 익힘 고리(철판 칸마다) ----------
  const ringEls = [];
  function rings() {
    for (let i = 0; i < 6; i++) { const e = document.createElement('div'); e.className = 'ring'; e.innerHTML = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" class="bg"/><circle cx="20" cy="20" r="15" class="fg" stroke-dasharray="94.25" stroke-dashoffset="94.25" transform="rotate(-90 20 20)"/><circle cx="20" cy="20" r="6.5" class="dot"/></svg>'; e.hidden = true; $('rings').appendChild(e); ringEls.push(e); }
  }
  U.cookRing = function (i, h) {
    const e = ringEls[i]; if (!e) return;
    if (!h || G.mode !== 'play') { if (!e.hidden) e.hidden = true; return; }
    e.hidden = false;
    const P = RND.POS, p = RND.toScreen(new THREE.Vector3(RND.SPOTS[i].x + 0.075, P.grid.y + 0.02, RND.SPOTS[i].z + 0.075));
    e.style.transform = 'translate(' + Math.round(p[0]) + 'px,' + Math.round(p[1]) + 'px) translate(-50%,-50%)';
    const pressing = h.pressShow;
    let f, col;
    if (pressing) { f = Math.min(1, h.flat / 1.06); col = h.flat > D.PRESS.good1 + 0.02 ? '#e2412a' : h.flat >= D.PRESS.good0 - G.gv('press') ? '#4fc24a' : '#4aa8e8'; }
    else { const c = h.down ? h.cookB : h.cookA; f = Math.min(1, c / D.COOK.burnt); col = c > D.COOK.burnt ? '#2a1a12' : c > D.COOK.good1 ? '#e2412a' : c >= D.COOK.good0 ? '#4fc24a' : c > D.COOK.raw ? '#f2c33a' : '#f6efe0'; }
    const fg = e.children[0].children[1]; fg.setAttribute('stroke-dashoffset', (94.25 * (1 - f)).toFixed(1)); fg.setAttribute('stroke', col);
    // 가운데 점 = 아랫면 색
    const c3 = HOT.cookCol(h.down ? h.cookB : h.cookA); e.children[0].children[2].setAttribute('fill', 'rgb(' + c3.map((v) => Math.round(v * 255)).join(',') + ')');
    e.classList.toggle('good', !pressing && col === '#4fc24a');
    e.classList.toggle('hot', !pressing && (col === '#e2412a' || col === '#2a1a12'));
  };

  // ---------- 칭찬 글자 ----------
  U.praise = function (word, sub, cls, x, y) {
    const e = document.createElement('div'); e.className = 'pop ' + (cls || '');
    e.style.left = Math.max(80, Math.min(innerWidth - 80, x)) + 'px'; e.style.top = Math.max(110, y) + 'px';
    e.innerHTML = '<b></b>' + (sub ? '<i></i>' : ''); e.querySelector('b').textContent = word; if (sub) e.querySelector('i').textContent = sub;
    $('pops').appendChild(e); setTimeout(() => e.remove(), 1200);
  };
  U.toast = function (t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 1600); };
  U.flashTray = () => { const p = RND.toScreen(new THREE.Vector3(RND.POS.tray.x, 0.02, RND.POS.tray.z)); spot(p); };
  U.flashBoard = () => { const p = RND.toScreen(new THREE.Vector3(RND.POS.board.x, 0.02, RND.POS.board.z)); spot(p); };
  function spot(p) { const e = document.createElement('div'); e.className = 'nopeSpot'; e.style.left = p[0] + 'px'; e.style.top = p[1] + 'px'; $('pops').appendChild(e); setTimeout(() => e.remove(), 700); }

  // ---------- 창 ----------
  U.openHow = function () { $('how').hidden = false; HOW.start(); if (G.held) G.dropHeld(); };
  function closeHow() { $('how').hidden = true; HOW.stop(); if (!S.how) { S.how = true; G.save(); } }
  U.result = function (o) {
    S = G.S;
    $('resDay').textContent = L(o.day + '일차', 'DAY ' + o.day) + ' CLEAR';
    const rows = [[L('판 호떡', 'Sold'), o.sold + L('개', '')], [L('판 돈', 'Sales'), '+' + o.earn.toLocaleString()], [L('팁', 'Tips'), '+' + o.tips.toLocaleString()], ['PERFECT', String(o.perfect)]];
    $('resL').innerHTML = ''; rows.forEach(([a, b]) => { const d = document.createElement('div'); d.innerHTML = '<span></span><b></b>'; d.children[0].textContent = a; d.children[1].textContent = b; $('resL').appendChild(d); });
    const st = $('resStars'); st.innerHTML = ''; const n = Math.round(o.avg); for (let i = 0; i < 3; i++) { const s = document.createElement('i'); if (i < n) s.className = 'on'; st.appendChild(s); }
    $('resCoin').textContent = L('코인 ', 'COIN ') + S.coins.toLocaleString();
    $('res').hidden = false; $('hud').hidden = true; RND.setSpots(G.gv('griddle'));
  };
  U.over = function () { $('over').hidden = false; $('hud').hidden = true; };
  U.shop = function () { $('shop').hidden = false; drawShop(); };
  function drawShop() {
    S = G.S;
    $('shopCoin').textContent = L('코인 ', 'COIN ') + S.coins.toLocaleString();
    const L0 = $('shopL'); L0.innerHTML = '';
    D.SHOP.forEach((it) => {
      const lv = S.gear[it.id], nx = lv + 1 < it.lv.length ? lv + 1 : -1;
      const e = document.createElement('div'); e.className = 'item';
      e.innerHTML = '<div class="nm"></div><div class="ds"></div><div class="lv"></div><div class="pips"></div>';
      e.querySelector('.nm').textContent = L(it.ko, it.en);
      e.querySelector('.ds').textContent = L(it.dko, it.den);
      e.querySelector('.lv').textContent = it.fmt(it.lv[lv]) + (nx > 0 ? ' → ' + it.fmt(it.lv[nx]) : '');
      for (let i = 1; i < it.lv.length; i++) { const p = document.createElement('i'); if (i <= lv) p.className = 'on'; e.querySelector('.pips').appendChild(p); }
      const b = document.createElement('button'); b.className = 'btn cup sm';
      if (nx > 0) { const cost = it.cost[nx]; b.innerHTML = '<span></span>'; b.firstChild.textContent = cost.toLocaleString(); if (S.coins < cost) b.classList.add('poor'); b.onclick = () => { if (S.coins < cost) { SND.no(); return; } S.coins -= cost; S.gear[it.id]++; G.save(); SND.coin(); drawShop(); G.applyGear(); }; }
      else { b.innerHTML = '<span>MAX</span>'; b.disabled = true; b.style.opacity = 0.6; }
      e.appendChild(b); L0.appendChild(e);
    });
  }
  U.endingCard = async function () {
    const url = await CARD.make();
    $('endImg').src = url || '';
    $('end').hidden = false;
  };

  // ---------- 단추 ----------
  function togs() {
    const set = () => { $('tBgm').classList.toggle('off', !SND.bgmOn); $('tSfx').classList.toggle('off', !SND.sfxOn); };
    $('tBgm').onclick = () => { SND.ensure(); SND.setBgm(!SND.bgmOn); SND.startBgm(); set(); };
    $('tSfx').onclick = () => { SND.ensure(); SND.setSfx(!SND.sfxOn); set(); };
    $('tHow').onclick = () => { SND.ensure(); SND.ui(); U.openHow(); };
    set();
  }
  function wire() {
    const click = (id, f) => ($(id).onclick = (e) => { e.stopPropagation(); SND.ensure(); SND.ui(); f(); });
    const go = () => { G.hideTitleSet(); G.hideTitleCust(); swap(() => G.startDay()); };
    click('bStart', () => { G.reset(); go(); });
    click('bCont', go);
    click('bNew', () => { G.reset(); go(); });
    click('bHowOk', closeHow);
    click('bNext', () => { $('res').hidden = true; swap(() => G.next()); });
    click('bShopR', U.shop);
    click('xShop', () => { $('shop').hidden = true; });
    click('bRetry', () => { $('over').hidden = true; swap(() => G.retry()); });
    click('bHomeO', () => { $('over').hidden = true; G.title(); G.titleCust(); U.show('title'); });
    click('bSave', () => CARD.save());
    click('bShare', () => { const r = CARD.share(); if (r === 'copied') U.toast(L('주소를 복사했습니다', 'Link copied')); });
    click('bEndHome', () => { $('end').hidden = true; G.endHome(); G.title(); G.titleCust(); U.show('title'); });
    click('honeyB', () => G.useHoney());
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { $('shop').hidden = true; if (!$('how').hidden) closeHow(); }
      if (e.key === 'Enter' && !$('how').hidden) closeHow();
      if (G.mode !== 'play' || U.paused()) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'h') { e.preventDefault(); G.useHoney(); }
      if (k === 'o') G.oil();
    });
  }
  function swap(f) { $('fade').style.opacity = 1; setTimeout(() => { f(); setTimeout(() => ($('fade').style.opacity = 0), 60); }, 380); }

  // ---------- 손 입력 ----------
  function input() {
    const cv = $('cv'); const R = RND, P = R.POS;
    let act = null;
    const inRect = (p, o, pad) => Math.abs(p.x - o.x) < o.w / 2 + (pad || 0) && Math.abs(p.z - o.z) < o.d / 2 + (pad || 0);
    const near = (p, o, r) => Math.hypot(p.x - o.x, p.z - o.z) < r;
    const hitObj = (sx, sy, obj) => R.ray(sx, sy).intersectObject(obj, true).length > 0;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      SND.ensure();
      if (G.mode !== 'play' || U.paused() || act) return;
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      const sx = e.clientX, sy = e.clientY;
      const p0 = R.pick(sx, sy, 0.01), pg = R.pick(sx, sy, P.grid.y + 0.01);
      const now = performance.now();
      // 철판 위 호떡
      for (let i = 0; i < 6; i++) { const h = G.spots[i]; if (h && pg && near(pg, R.SPOTS[i], (h.R || 0.07) + 0.03)) { act = { t: 'grid', i, h, sx, sy, t0: now, moved: false, id: e.pointerId }; return; } }
      // 쟁반 위 호떡
      if (G.tray && p0 && inRect(p0, P.tray, 0.02)) { act = { t: 'tray', sx, sy, minX: p0.x, maxX: p0.x, id: e.pointerId }; return; }
      // 빚는 판
      if (G.board && p0 && inRect(p0, P.board, 0.03)) {
        const h = G.board;
        if (h.close >= 1) { act = { t: 'ball', sx, sy, id: e.pointerId }; return; }
        const c = R.toScreen(h.grp.position); act = { t: 'rub', cx: c[0], cy: c[1], a: Math.atan2(sy - c[1], sx - c[0]), id: e.pointerId }; return;
      }
      // 통·도구(실제 모양에 맞춰 집기)
      if (hitObj(sx, sy, R.oilB) || (p0 && near(p0, P.oil, 0.06))) { G.oil(); act = { t: 'none', id: e.pointerId }; return; }
      // 칸 나뉜 통: 반죽 칸·속 칸
      const pc = R.pick(sx, sy, 0.05);
      const cellHit = (pan, keys) => keys.find((k) => { const c = R.cell(pan, k); return pc && Math.abs(pc.x - c.x) < c.w / 2 + 0.006 && Math.abs(pc.z - c.z) < c.d / 2 + 0.02; });
      const dk = cellHit('dough', P.doughPan.keys); if (dk) { if (!G.newDough(dk) && D.openDough(dk, G.T().day)) U.flashBoard(); act = { t: 'none', id: e.pointerId }; return; }
      const fk = cellHit('fill', P.fillPan.keys); if (fk) { G.addFill(fk); act = { t: 'none', id: e.pointerId }; return; }
      if (R.seedsG.visible && hitObj(sx, sy, R.seedsG) || R.seedsG.visible && hitObj(sx, sy, R.scoop) || (p0 && near(p0, P.seeds, P.seeds.r + 0.02))) { G.scoop(); act = { t: 'none', id: e.pointerId }; return; }
      act = { t: 'none', id: e.pointerId };
    });
    cv.addEventListener('pointermove', (e) => {
      if (!act || e.pointerId !== act.id) return;
      const sx = e.clientX, sy = e.clientY;
      if (act.t === 'grid') {
        if (!act.pressing && Math.hypot(sx - act.sx, sy - act.sy) > 14) { act.moved = true; if (G.spots[act.i] === act.h && act.h.flipT === undefined) { G.pickUp(act.h, 'spot', act.i); act.t = 'held'; G.moveHeld(sx, sy); } }
      } else if (act.t === 'tray') {
        const p = R.pick(sx, sy, 0.01); if (!p) return;
        if (!inRect(p, P.tray, 0.015)) { G.pickUp(G.tray, 'tray'); act.t = 'held'; G.moveHeld(sx, sy); return; }
        act.minX = Math.min(act.minX, p.x); act.maxX = Math.max(act.maxX, p.x);
        if (!G.tray.cut && act.maxX - act.minX > (G.tray.R || 0.09) * 1.1) G.cut();
      } else if (act.t === 'ball') {
        if (Math.hypot(sx - act.sx, sy - act.sy) > 8) { G.pickUp(G.board, 'board'); act.t = 'held'; G.moveHeld(sx, sy); }
      } else if (act.t === 'rub') {
        const a = Math.atan2(sy - act.cy, sx - act.cx); let d = a - act.a; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; act.a = a;
        if (Math.hypot(sx - act.cx, sy - act.cy) > 6) G.rub(Math.abs(d) / (2 * PI * 1.25));
        if (G.board && G.board.close >= 1) act.t = 'none';
      } else if (act.t === 'held') G.moveHeld(sx, sy);
    });
    const up = (e) => {
      if (!act || e.pointerId !== act.id) return;
      if (act.t === 'grid') { if (act.pressing) { G.pressEnd(); act.h.pressShow = false; } else if (!act.moved) G.flip(act.i); }
      if (act.t === 'held') G.dropHeld();
      act = null;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    // 꾹 누르고 있기 = 누르개
    RND.hooks.push((dt) => {
      if (!act || act.t !== 'grid' || act.moved || G.mode !== 'play' || U.paused()) return;
      act.hold = (act.hold || 0) + dt;
      if (!act.pressing && act.hold > 0.22 && act.h.flipT === undefined) { act.pressing = true; act.h.pressShow = true; G.pressStart(act.i); }
      if (act.pressing) G.pressHold(act.i, dt);
    });
    U.cancelAct = () => { if (act && act.t === 'held') G.dropHeld(); if (act && act.pressing) G.pressEnd(); act = null; };
  }
})();
