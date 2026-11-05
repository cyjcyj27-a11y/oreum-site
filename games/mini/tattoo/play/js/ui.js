// 화면: 상단바·주문서·창·잉크 컵·칭찬 글자·조작
(function () {
  const U = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const D = DATA;
  let G, S;
  const touch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;

  U.boot = function () {
    G = GAME; S = G.S;
    if (touch) document.body.classList.add('touch');
    if (window.EN) document.querySelectorAll('[data-en]').forEach((e) => (e.textContent = e.dataset.en));
    G.boot();
    const go = () => { RND.frontText(); drawLogo(); };
    (document.fonts ? Promise.all([document.fonts.load('60px Ttl'), document.fonts.load('20px Ui')]).then(go, go) : go());
    buildCaps(); togs(); wire(); input();
    addEventListener('resize', () => G.reframe && G.mode !== 'title' && G.reframe());
    U.show('title');
  };

  // ---------- 화면 바꾸기 ----------
  U.show = function (m) {
    const play = m === 'play';
    $('title').hidden = m !== 'title';
    $('hud').hidden = !(play || m === 'ending');
    $('tools').hidden = !play; $('keys').hidden = !play; $('ticket').hidden = !play;
    if (!play) $('caps').hidden = true;
    $('skip').hidden = m !== 'opening';
    document.body.classList.toggle('playing', play || m === 'opening' || m === 'ending');
    ['res', 'over', 'end', 'orderW'].forEach((id) => ($(id).hidden = true));
    if (m === 'title') {
      G.mode = 'title'; RND.scene = RND.front; RND.frontAt(0, 0); RND.F.tube.on = 0;
      const has = S.started && !S.done;
      $('bStart').hidden = has; $('bCont').hidden = !has; $('bNew').hidden = !has;
    }
    if (play) U.hud();
  };
  U.paused = () => !$('how').hidden || !$('shop').hidden || !$('dexW').hidden || !$('orderW').hidden;
  U.fade = (v) => ($('fade').style.opacity = v);

  // ---------- 제목(빨간 리본 위 글씨 + 양옆 제비 + 장미) ----------
  function drawLogo() {
    const c = $('logoC'), g = c.getContext('2d'), W = c.width, H = c.height;
    g.clearRect(0, 0, W, H);
    FLASH.draw(g, 'swallow', 20, 40, 300, { lw: 0.034 });
    g.save(); g.translate(W, 0); g.scale(-1, 1); FLASH.draw(g, 'swallow', 20, 40, 300, { lw: 0.034 }); g.restore();
    FLASH.draw(g, 'rose', W / 2 - 120, 10, 240, { lw: 0.034 });
    // 리본 띠
    const by = 300, bh = 170, bx0 = 90, bx1 = W - 90;
    g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = '#18171b';
    const tail = (x, d) => { g.beginPath(); g.moveTo(x, by + 40); g.lineTo(x + d * 110, by + 40); g.lineTo(x + d * 70, by + 40 + bh / 2); g.lineTo(x + d * 110, by + 40 + bh); g.lineTo(x, by + 40 + bh); g.closePath(); g.fillStyle = '#7e1c18'; g.fill(); g.stroke(); };
    tail(bx0 + 20, -1); tail(bx1 - 20, 1);
    g.beginPath(); g.moveTo(bx0, by); g.quadraticCurveTo(W / 2, by - 50, bx1, by); g.lineTo(bx1, by + bh); g.quadraticCurveTo(W / 2, by + bh - 50, bx0, by + bh); g.closePath();
    const gr = g.createLinearGradient(0, by - 40, 0, by + bh); gr.addColorStop(0, '#e04a3e'); gr.addColorStop(0.5, '#c8312b'); gr.addColorStop(1, '#a8261f'); g.fillStyle = gr; g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.beginPath(); g.moveTo(bx0 + 20, by + 18); g.quadraticCurveTo(W / 2, by - 30, bx1 - 20, by + 18); g.stroke();
    const tt = L('타투샵', 'TATTOO SHOP');
    let px = 150; g.font = px + 'px Ttl, serif'; while (g.measureText(tt).width > bx1 - bx0 - 120 && px > 40) { px -= 4; g.font = px + 'px Ttl, serif'; }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 16; g.strokeStyle = '#18171b'; g.strokeText(tt, W / 2, by + bh / 2 - 6); g.fillStyle = '#f3e5bf'; g.fillText(tt, W / 2, by + bh / 2 - 6);
    // 아래 작은 띠: TATTOO & PIERCING
    const sub = 'TATTOO & PIERCING';
    g.font = '44px Ttl, serif'; const sw = g.measureText(sub).width + 70, sx = W / 2 - sw / 2, sy = by + bh + 26;
    g.fillStyle = '#18171b'; g.fillRect(sx, sy, sw, 66); g.strokeStyle = '#f3e5bf'; g.lineWidth = 3; g.strokeRect(sx + 6, sy + 6, sw - 12, 54);
    g.fillStyle = '#f3e5bf'; g.fillText(sub, W / 2, sy + 35);
  }

  // ---------- 상단바 ----------
  U.hud = function () {
    const c = G.cust; if (!c) return;
    $('vCust').textContent = c.last ? L('마지막', 'FINAL') : c.i + 1 + '/' + D.COUNT;
    const co = S.coins.toLocaleString();
    if ($('vCoin').textContent !== co) { $('vCoin').textContent = co; flash('sCoin'); }
    $('vCream').textContent = S.items.cream; $('vCandy').textContent = S.items.candy;
    $('bCream').hidden = S.items.cream <= 0; $('bCandy').hidden = S.items.candy <= 0;
    U.prog();
  };
  function flash(id) { const e = $(id); e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); }
  let lastPat = -1;
  U.pat = function (f) {
    const v = Math.round(f * 200) / 200; if (v === lastPat) return; lastPat = v;
    $('iPat').style.transform = 'scaleX(' + Math.max(0, f) + ')';
    $('bPat').classList.toggle('mid', f < 0.5 && f >= 0.25); $('bPat').classList.toggle('low', f < 0.25);
  };
  let lastProg = '';
  U.prog = function () {
    const st = G.step && G.step(); let lb = '', v = '';
    if (st && st.k === 'tat' && st.P) {
      if (st.P.phase === 'color') { const R = st.P.regions, n = R.reduce((a, r) => a + r.n, 0), cv = R.reduce((a, r) => a + (r.done ? r.n : Math.min(r.n, r.cov)), 0); lb = L('색', 'COLOR'); v = Math.round((cv / Math.max(1, n)) * 100) + '%'; }
      else { lb = L('선', 'LINE'); v = Math.round(ARM.lineCov() * 100) + '%'; }
    } else if (st && st.k === 'pie') { lb = L('피어싱', 'PIERCE'); const m = EAR.marks; v = m.filter((q) => q.done).length + '/' + m.length; }
    const k = lb + v; if (k === lastProg) return; lastProg = k; $('lProg').textContent = lb; $('vProg').textContent = v; $('sProg').hidden = !lb;
  };
  U.breath = function (inh) { $('vBreath').textContent = inh ? L('들숨', 'IN') : L('날숨', 'OUT'); $('sBreath').className = 'stat ' + (inh ? 'inh' : 'exh'); };

  // ---------- 칭찬 글자 ----------
  U.praise = function (word, sub, cls, x, y) {
    const e = document.createElement('div'); e.className = 'pop ' + cls;
    e.style.left = Math.max(90, Math.min(innerWidth - 90, x)) + 'px'; e.style.top = Math.max(120, y - 40) + 'px';
    e.innerHTML = '<b></b>' + (sub ? '<i></i>' : ''); e.querySelector('b').textContent = word; if (sub) e.querySelector('i').textContent = sub;
    $('pops').appendChild(e); setTimeout(() => e.remove(), 1100);
  };
  U.ouch = function () {
    const o = $('ouch'); o.textContent = L('아야!', 'OUCH!');
    o.classList.remove('on'); void o.offsetWidth; o.classList.add('on');
    $('hurtV').style.opacity = 1; setTimeout(() => ($('hurtV').style.opacity = 0), 260);
    flash('sPat');
  };
  U.grip = function (x, y, f, danger) {
    const e = $('grip');
    if (x === null || x === undefined) { e.setAttribute('hidden', ''); return; }
    e.removeAttribute('hidden'); e.style.left = x + 'px'; e.style.top = y + 'px';
    $('gripF').setAttribute('stroke-dashoffset', 170 * (1 - Math.max(0, Math.min(1, f))));
    $('gripF').setAttribute('stroke', danger > 0.5 ? '#ff6a5a' : '#8ff0a0');
  };
  U.toast = function (t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 1600); };

  // ---------- 주문서 ----------
  U.order = function (c) {
    $('orderH').textContent = c.last ? L('마지막 손님', 'Final Customer') : L('손님 ', 'Customer ') + (c.i + 1);
    const L0 = $('orderL'); L0.innerHTML = '';
    c.tat.forEach((t) => {
      const e = document.createElement('div'); e.className = 'c';
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; const g = cv.getContext('2d');
      FLASH.paper(g, 300, 300, t.id.length); FLASH.draw(g, t.id, 30, 30, 240, t.col ? {} : { fill: false });
      e.appendChild(cv); const p = document.createElement('p'); p.innerHTML = '<b></b><span></span>';
      p.firstChild.textContent = L(FLASH.D[t.id].ko, FLASH.D[t.id].en); p.lastChild.textContent = t.w.toFixed(1) + 'cm · ' + (t.col ? L('색까지', 'with color') : L('선만', 'lines only'));
      e.appendChild(p); L0.appendChild(e);
    });
    if (c.pie.length) {
      const e = document.createElement('div'); e.className = 'c';
      const cv = document.createElement('canvas'); cv.width = cv.height = 300; earPic(cv.getContext('2d'), c.pie, 300);
      e.appendChild(cv); const p = document.createElement('p'); p.innerHTML = '<b></b><span></span>';
      p.firstChild.textContent = L('피어싱 ', 'Piercing ') + c.pie.length; p.lastChild.textContent = c.pie.map((k) => L(D.PIERCE[k].ko, D.PIERCE[k].en)).join(' · ');
      e.appendChild(p); L0.appendChild(e);
    }
    $('orderW').hidden = false; $('ticket').hidden = true; $('caps').hidden = true; $('tools').hidden = true;
  };
  // 귀 그림(도안 종이에 검은 선) + 피어싱 자리 빨간 점
  function earPic(g, list, W) {
    FLASH.paper(g, W, W, 9);
    const s = W / 8.2, ox = W * 0.32, oy = W * 0.5;
    const P = (x, y) => [ox + x * s, oy - y * s];
    const out = [[-0.15, 1.75], [0.45, 2.85], [1.35, 3.3], [2.3, 3.0], [2.95, 2.1], [3.05, 0.95], [2.8, -0.2], [2.35, -1.25], [1.95, -2.15], [1.6, -2.85], [1.0, -3.15], [0.35, -2.95], [-0.05, -2.35], [-0.2, -1.6]];
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); out.forEach((p, i) => { const q = P(p[0], p[1]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath();
    g.fillStyle = '#e8b596'; g.fill(); g.lineWidth = W * 0.022; g.strokeStyle = '#18171b'; g.stroke();
    g.lineWidth = W * 0.014; g.beginPath(); const a = P(0.5, 2.4), b = P(2.4, 2.5), cc = P(2.4, -0.6), d = P(1.2, -1.4); g.moveTo(a[0], a[1]); g.bezierCurveTo(b[0], b[1], cc[0], cc[1], d[0], d[1]); g.stroke();
    g.beginPath(); const e1 = P(1.4, 1.0); g.ellipse(e1[0], e1[1], s * 0.7, s * 0.9, 0.2, 0, 7); g.stroke();
    list.forEach((k) => { const at = D.PIERCE[k].at, q = P(at[0], at[1]); g.fillStyle = '#c8312b'; g.beginPath(); g.arc(q[0], q[1], W * 0.028, 0, 7); g.fill(); g.lineWidth = W * 0.01; g.stroke(); });
  }
  U.earPic = earPic;
  // 일하는 동안 왼쪽 위 도안 쪽지
  U.work = function (st) {
    $('orderW').hidden = true; $('ticket').hidden = false; $('tools').hidden = false;
    const g = $('tkC').getContext('2d');
    if (st.k === 'tat') {
      const col = st.P && st.P.phase === 'color';
      FLASH.paper(g, 240, 240, 4); FLASH.draw(g, st.job.id, 20, 20, 200, st.job.col ? {} : { fill: false });
      $('tkP').textContent = col ? L('색 칠하기', 'Color') : L('선 따기', 'Lines');
      $('caps').hidden = !col; document.body.classList.toggle('colorphase', !!col);
      if (col) markCaps(st.P);
      $('sBreath').hidden = true;
    } else {
      earPic(g, G.cust.pie, 240); $('tkP').textContent = L('피어싱', 'Piercing');
      $('caps').hidden = true; document.body.classList.remove('colorphase');
      $('sBreath').hidden = false; U.breath(true);
    }
    $('bWipe').hidden = st.k !== 'tat';
    lastProg = ''; U.prog();
  };
  // 완성 뒤: 쪽지·도구를 치우고 NEXT 하나만
  U.done = function (on) {
    $('doneW').hidden = !on; $('keys').hidden = on;
    if (on) { $('ticket').hidden = true; $('tools').hidden = true; $('caps').hidden = true; document.body.classList.remove('colorphase'); }
  };
  U.wipe = function (on) { $('bWipe').classList.toggle('on', on); document.body.classList.toggle('wiping', on); };
  // 잉크 컵
  function buildCaps() {
    const box = $('caps'); box.innerHTML = '';
    FLASH.COLKEYS.forEach((k, i) => { const b = document.createElement('button'); b.className = 'cap'; b.style.setProperty('--c', FLASH.COL[k]); b.dataset.k = k; b.setAttribute('aria-label', k); b.onclick = (e) => { e.stopPropagation(); pickInk(k); }; box.appendChild(b); });
  }
  function pickInk(k) { if (!G.step || !G.step() || !G.step().P || G.step().P.phase !== 'color') return; G.color = k; SND.ui(); markCaps(G.step().P); }
  function markCaps(P) {
    const need = new Set(P.regions.filter((r) => !r.done).map((r) => r.f));
    [...$('caps').children].forEach((b) => { b.classList.toggle('on', b.dataset.k === G.color); b.classList.toggle('need', need.has(b.dataset.k)); });
  }
  U.markCaps = () => { const st = G.step && G.step(); if (st && st.P && st.P.phase === 'color') markCaps(st.P); };

  // ---------- 창 ----------
  U.openHow = function () { $('how').hidden = false; $('howKeys').textContent = touch ? L('빈 곳 끌기: 기울이기 · 두 손가락: 확대', 'Drag empty space: tilt · Two fingers: zoom') : L('빈 곳 끌기·오른쪽 끌기: 기울이기 · 휠: 확대 · W 닦기 · 1~6 잉크', 'Drag empty space / right drag: tilt · Wheel: zoom · W: wipe · 1-6: ink'); HOW.start(); };
  function closeHow() { $('how').hidden = true; HOW.stop(); if (!S.how) { S.how = true; G.save(); } }
  U.result = function (o) {
    $('resL').innerHTML = '';
    const sg = (v) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toLocaleString();
    o.rows.forEach((r) => { const d = document.createElement('div'); if (r.neg) d.className = 'neg'; if (r.jack) d.className = 'jack'; d.innerHTML = '<span></span><b></b>'; d.children[0].textContent = L(r.ko, r.en); d.children[1].textContent = sg(r.v); $('resL').appendChild(d); });
    const d = document.createElement('div'); d.className = 'sum'; d.innerHTML = '<span></span><b></b>'; d.children[0].textContent = L('합계', 'Total'); d.children[1].textContent = sg(o.total); $('resL').appendChild(d);
    $('res').hidden = false; $('caps').hidden = true; U.hud();
  };
  U.over = function (back) { $('overBack').hidden = !back; if (back) $('overBack').textContent = L('쓴 코인 돌려받음 +', 'Coins refunded +') + back.toLocaleString(); $('over').hidden = false; };
  U.shop = function () { $('shop').hidden = false; drawShop(); };
  function drawShop() {
    $('shopCoin').textContent = L('코인 ', 'COIN ') + S.coins.toLocaleString();
    const L0 = $('shopL'); L0.innerHTML = '';
    D.SHOP.forEach((it) => {
      const e = document.createElement('div'); e.className = 'item';
      e.innerHTML = '<div class="nm"></div><div class="ds"></div><div class="lv"></div><div class="pips"></div>';
      e.querySelector('.nm').textContent = L(it.ko, it.en); e.querySelector('.ds').textContent = L(it.dko, it.den);
      const b = document.createElement('button'); b.className = 'btn sm';
      if (it.use) {
        e.querySelector('.lv').textContent = L('가진 것 ', 'Have ') + S.items[it.id];
        b.innerHTML = '<span></span>'; b.firstChild.textContent = it.cost.toLocaleString(); if (S.coins < it.cost) b.classList.add('poor');
        b.onclick = () => { if (S.coins < it.cost) { SND.bad(); return; } S.coins -= it.cost; S.items[it.id]++; G.save(); SND.coin(); drawShop(); U.hud(); };
      } else {
        const lv = S.gear[it.id], nx = it.lv[lv + 1];
        e.querySelector('.lv').textContent = L(it.lv[lv].ko, it.lv[lv].en) + (nx ? ' → ' + L(nx.ko, nx.en) : '');
        for (let i = 1; i < it.lv.length; i++) { const p = document.createElement('i'); if (i <= lv) p.className = 'on'; e.querySelector('.pips').appendChild(p); }
        if (nx) { b.innerHTML = '<span></span>'; b.firstChild.textContent = nx.cost.toLocaleString(); if (S.coins < nx.cost) b.classList.add('poor'); b.onclick = () => { if (S.coins < nx.cost) { SND.bad(); return; } S.coins -= nx.cost; S.gear[it.id]++; G.save(); SND.coin(); drawShop(); U.hud(); if (it.id === 'lamp') G.light(); }; }
        else { b.innerHTML = '<span>MAX</span>'; b.disabled = true; b.style.opacity = 0.6; }
      }
      e.appendChild(b); L0.appendChild(e);
    });
  }
  U.dex = function () {
    $('dexW').hidden = false; const L0 = $('dexL'); L0.innerHTML = '';
    const h1 = document.createElement('div'); h1.className = 'dexH'; h1.textContent = L('타투 도안', 'Tattoo Designs'); L0.appendChild(h1);
    const g1 = document.createElement('div'); g1.className = 'dex'; L0.appendChild(g1);
    FLASH.KEYS.forEach((k) => {
      const n = S.dex[k] || 0, e = document.createElement('div'); e.className = 'd' + (n ? '' : ' no');
      const c = document.createElement('canvas'); c.width = c.height = 200; const g = c.getContext('2d');
      const pol = n ? [...G.polas].reverse().find((p) => p.id === k) : null;
      if (pol) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0, 200, 200); im.src = pol.src; }
      else { FLASH.paper(g, 200, 200, k.length); FLASH.draw(g, k, 18, 18, 164); }
      e.appendChild(c); const b = document.createElement('b'); b.textContent = n ? L(FLASH.D[k].ko, FLASH.D[k].en) : '???'; e.appendChild(b);
      const s = document.createElement('div'); s.textContent = n ? '× ' + n : ''; e.appendChild(s); g1.appendChild(e);
    });
    const h2 = document.createElement('div'); h2.className = 'dexH'; h2.textContent = L('피어싱', 'Piercings'); L0.appendChild(h2);
    const g2 = document.createElement('div'); g2.className = 'dex'; L0.appendChild(g2);
    D.PIERCE_KEYS.forEach((k) => {
      const n = S.pdex[k] || 0, e = document.createElement('div'); e.className = 'd' + (n ? '' : ' no');
      const c = document.createElement('canvas'); c.width = c.height = 200; earPic(c.getContext('2d'), [k], 200);
      e.appendChild(c); const b = document.createElement('b'); b.textContent = n ? L(D.PIERCE[k].ko, D.PIERCE[k].en) : '???'; e.appendChild(b);
      const s = document.createElement('div'); s.textContent = n ? '× ' + n : ''; e.appendChild(s); g2.appendChild(e);
    });
  };
  U.endingCard = async function () { const url = await CARD.make(); $('endImg').src = url || ''; $('end').hidden = false; };

  // ---------- 단추 연결 ----------
  function togs() {
    const set = () => { $('tBgm').classList.toggle('off', !SND.bgmOn); $('tSfx').classList.toggle('off', !SND.sfxOn); };
    $('tBgm').onclick = () => { SND.ensure(); SND.setBgm(!SND.bgmOn); SND.startBgm(); set(); };
    $('tSfx').onclick = () => { SND.ensure(); SND.setSfx(!SND.sfxOn); set(); };
    $('tHow').onclick = () => { G.needleUp(); U.openHow(); };
    $('tShop').onclick = () => { SND.ensure(); SND.ui(); G.needleUp(); U.shop(); };
    $('tDex').onclick = () => { SND.ensure(); SND.ui(); G.needleUp(); U.dex(); };
    set();
  }
  function wire() {
    const click = (id, f) => ($(id).onclick = (e) => { e.stopPropagation(); SND.ensure(); SND.ui(); f(); });
    click('bStart', () => { G.reset(); G.opening(); });
    click('bCont', () => G.opening());
    click('bNew', () => { G.reset(); G.opening(); });
    click('bHowOk', closeHow);
    click('bGo', () => { $('orderW').hidden = true; G.beginWork(); });
    const swap = (f) => { U.fade(1); setTimeout(() => { f(); setTimeout(() => U.fade(0), 60); }, 380); };
    click('bNext', () => { $('res').hidden = true; swap(() => G.next()); });
    click('bDone', () => G.doneNext());
    click('bShopR', U.shop);
    click('xShop', () => ($('shop').hidden = true)); click('xDex', () => ($('dexW').hidden = true));
    click('bRetry', () => { $('over').hidden = true; swap(() => G.retry()); });
    click('bHomeO', () => { $('over').hidden = true; U.show('title'); });
    click('bWipe', () => G.setWipe(!G.wipeMode));
    click('bCream', () => G.use('cream')); click('bCandy', () => G.use('candy'));
    click('bSave', () => CARD.save());
    click('bShare', () => { const r = CARD.share(); if (r === 'copied') U.toast(L('주소를 복사했습니다', 'Link copied')); });
    click('bEndHome', () => { $('end').hidden = true; G._endShown = false; U.show('title'); });
    addEventListener('keydown', (e) => {
      if (!$('how').hidden && e.key === 'Enter') { closeHow(); return; }
      if (!$('orderW').hidden && e.key === 'Enter') { $('orderW').hidden = true; G.beginWork(); return; }
      if (e.key === 'Escape') { $('shop').hidden = true; $('dexW').hidden = true; }
      if (!$('doneW').hidden && (e.key === 'Enter' || e.key === ' ')) { G.doneNext(); return; }
      if ((G.mode !== 'tat' && G.mode !== 'pie') || U.paused()) return;
      const k = e.key.toLowerCase();
      if (k === 'w' && G.mode === 'tat') G.setWipe(!G.wipeMode);
      if (k === 'c') G.use('cream'); if (k === 'v') G.use('candy');
      if ('123456'.includes(k) && k.length === 1) pickInk(FLASH.COLKEYS[+k - 1]);
      if (k === 'arrowleft') G.orbit(-40, 0); if (k === 'arrowright') G.orbit(40, 0);
      if (k === 'arrowup') G.orbit(0, -30); if (k === 'arrowdown') G.orbit(0, 30);
      if (k === '=' || k === '+') G.zoom(0.88); if (k === '-') G.zoom(1.14);
    });
  }

  // ---------- 포인터 ----------
  function input() {
    const cv = $('cv'), pts = new Map(), tw = $('towel');
    let act = null, pinch = null;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      SND.ensure();
      if (G.mode === 'opening') { G.skipOpening(); return; }
      if (G.mode !== 'tat' && G.mode !== 'pie' && G.mode !== 'ending' && G.mode !== 'wait') return;
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { G.needleUp(); G.pierceUp(); const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; act = 'pinch'; return; }
      if (G.mode === 'ending' || G.mode === 'wait' || e.button === 2 || e.button === 1) { act = 'orbit'; return; }
      if (G.mode === 'tat') {
        if (G.wipeMode) { act = 'wipe'; G.wipeAt(e.clientX, e.clientY); return; }
        act = G.needleDown(e.clientX, e.clientY) ? 'needle' : 'orbit';
      } else act = G.pierceDown(e.clientX, e.clientY) ? 'pierce' : 'orbit';
    });
    cv.addEventListener('pointermove', (e) => {
      tw.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      if (e.pointerType === 'mouse') G.hover(e.clientX, e.clientY);
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (act === 'pinch' && pts.size >= 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        G.zoom(pinch.d / Math.max(1, d)); G.orbit(mx - pinch.mx, my - pinch.my); pinch = { d, mx, my }; return;
      }
      if (act === 'needle') G.needleMove(e.clientX, e.clientY);
      else if (act === 'pierce') G.pierceMove(e.clientX, e.clientY);
      else if (act === 'wipe') G.wipeAt(e.clientX, e.clientY);
      else if (act === 'orbit') G.orbit(dx, dy);
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (act === 'needle') G.needleUp();
      if (act === 'pierce') G.pierceUp();
      if (act === 'wipe') G.wipeEnd();
      if (pts.size === 0) act = null; else if (act === 'pinch') act = 'none';
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => G.hover(-999, -999));
    cv.addEventListener('wheel', (e) => { e.preventDefault(); G.zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
  }
})();
