// 화면: 상단바·창·접시·칭찬 글자·조작
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
    const go = () => { RND.frontText(); };
    (document.fonts ? Promise.all([document.fonts.load('900 60px Ttl'), document.fonts.load('60px Sign')]).then(go, go) : go());
    togs(); wire(); input();
    checkRotate(); addEventListener('resize', checkRotate); addEventListener('orientationchange', () => setTimeout(checkRotate, 200));
    U.show('title');
  };

  // ---------- 화면 바꾸기 ----------
  U.show = function (m) {
    const play = m === 'play';
    $('title').hidden = m !== 'title';
    $('hud').hidden = !(play || m === 'ending');
    $('tools').hidden = !play; $('keys').hidden = !play; $('dish').hidden = !(play || m === 'ending');
    $('skip').hidden = m !== 'opening';
    document.body.classList.toggle('playing', play || m === 'opening' || m === 'ending');
    document.body.classList.toggle('retro', m === 'title' || m === 'opening');
    ['res', 'over', 'end'].forEach((id) => ($(id).hidden = true));
    if (m === 'title') {
      G.mode = 'title'; RND.scene = RND.front; RND.frontAt(0, 0);
      const has = S.started && !S.done;
      $('bStart').hidden = has; $('bCont').hidden = !has; $('bNew').hidden = !has;
    }
    if (play) { G.combMode = false; setComb(false); U.hud(); }
  };
  U.paused = () => !$('how').hidden || !$('shop').hidden || !$('dexW').hidden || !$('rotate').hidden;
  // 폰은 세로 화면만: 가로로 들면 안내를 덮고 멈춤(놓친 집기도 풀어 줌)
  function checkRotate() { const land = touch && innerWidth > innerHeight && innerHeight < 560; if (land && $('rotate').hidden) G.release && G.release(); $('rotate').hidden = !land; }
  U.fade = (v) => ($('fade').style.opacity = v);

  // ---------- 상단바 ----------
  U.hud = function () {
    const c = G.cust; if (!c) return;
    $('vCust').textContent = c.last ? L('마지막', 'FINAL') : c.i + 1 + '/' + D.COUNT;
    const w = HEAD.whiteCount();
    if ($('vWh').textContent !== String(w)) { $('vWh').textContent = w; flash('sWh'); }
    const co = S.coins.toLocaleString();
    if ($('vCoin').textContent !== co) { $('vCoin').textContent = co; flash('sCoin'); }
    ['tea', 'rub'].forEach((k) => { const n = S.items[k], K = k[0].toUpperCase() + k.slice(1); $('v' + K).textContent = n; $('b' + K).hidden = n <= 0; });
  };
  function flash(id) { const e = $(id); e.classList.remove('flash'); void e.offsetWidth; e.classList.add('flash'); }
  let lastPat = -1;
  U.pat = function (f) {
    const v = Math.round(f * 200) / 200; if (v === lastPat) return; lastPat = v;
    $('iPat').style.transform = 'scaleX(' + Math.max(0, f) + ')';
    $('bPat').classList.toggle('mid', f < 0.5 && f >= 0.25); $('bPat').classList.toggle('low', f < 0.25);
  };

  // ---------- 칭찬 글자 ----------
  U.praise = function (word, sub, cls, x, y) {
    const e = document.createElement('div'); e.className = 'pop ' + cls;
    e.style.left = Math.max(90, Math.min(innerWidth - 90, x)) + 'px'; e.style.top = Math.max(110, y - 30) + 'px';
    e.innerHTML = '<b></b>' + (sub ? '<i></i>' : ''); e.querySelector('b').textContent = word; if (sub) e.querySelector('i').textContent = sub;
    $('pops').appendChild(e); setTimeout(() => e.remove(), 1100);
  };
  U.ouch = function () {
    const o = $('ouch'); o.textContent = L('아야!', 'OUCH!');
    o.classList.remove('on'); void o.offsetWidth; o.classList.add('on');
    $('hurtV').style.opacity = 1; setTimeout(() => ($('hurtV').style.opacity = 0), 260);
    flash('sPat');
  };
  // 손끝 당김 고리: 차오를수록 뿌리가 빠지기 직전, 너무 세게 당기면 빨개짐
  U.grip = function (x, y, f, danger) {
    const e = $('grip');
    if (x === null || x === undefined) { e.setAttribute('hidden', ''); return; }
    e.removeAttribute('hidden'); e.style.left = x + 'px'; e.style.top = y + 'px';
    $('gripF').setAttribute('stroke-dashoffset', 151 * (1 - Math.max(0, Math.min(1, f))));
    const d = Math.max(0, Math.min(1, danger || 0));
    $('gripF').setAttribute('stroke', d > 0.7 ? '#ff5a4a' : d > 0.45 ? '#ffd24a' : '#8ff08a');
    e.classList.toggle('hot', d > 0.7);
  };
  U.toast = function (t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 1600); };

  // ---------- 접시: 뽑은 머리카락이 쌓임 ----------
  const dish = $('dish'), dg = dish.getContext('2d');
  let pile = [];
  U.dishReset = function () { pile = []; drawDish(); };
  U.dishPoint = function () { const r = dish.getBoundingClientRect(); return dish.hidden ? [80, innerHeight - 60] : [r.left + r.width * 0.5, r.top + r.height * 0.45]; };
  U.dishAdd = function (f) {
    const n = pile.length;
    const col = f.broken ? '#9aa0a6' : f.white ? (f.type === 'gold' ? '#ffc930' : '#f2f0ea') : '#1b1714';
    const a = Math.random() * Math.PI, len = 60 + Math.random() * 90;
    pile.push({ x: 200 + (Math.random() - 0.5) * 190, y: 128 + (Math.random() - 0.5) * 36 - Math.min(18, n * 0.25), a, len, col, curl: f.type === 'curly' ? 1 : 0, root: f.white && !f.broken, half: f.half, t: 0 });
    if (pile.length > 160) pile.shift();
    drawDish(); animDish();
  };
  let dAnim = 0;
  function animDish() { if (dAnim) return; const st = performance.now(); const f = () => { const k = (performance.now() - st) / 400; pile.forEach((p) => (p.t = Math.min(1, p.t + 0.08))); drawDish(); if (k < 1) dAnim = requestAnimationFrame(f); else dAnim = 0; }; dAnim = requestAnimationFrame(f); }
  function drawDish() {
    const g = dg; g.clearRect(0, 0, 400, 240);
    // 하얀 사기 접시(타원) + 파란 테
    g.save(); g.translate(200, 140);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(6, 14, 190, 78, 0, 0, 7); g.fill();
    const gr = g.createLinearGradient(0, -80, 0, 80); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9dde2');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 190, 78, 0, 0, 7); g.fill();
    g.strokeStyle = '#3a6ab8'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, 0, 176, 70, 0, 0, 7); g.stroke();
    g.fillStyle = '#eceff2'; g.beginPath(); g.ellipse(0, 4, 128, 46, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 4, 128, 46, 0, 0, 7); g.stroke();
    g.restore();
    pile.forEach((p) => {
      const drop = (1 - p.t) * -40;
      g.save(); g.translate(p.x, p.y + drop); g.rotate(p.a);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3.4; hairPath(g, p, 1.5); g.stroke();
      g.strokeStyle = p.col; g.lineWidth = 2.2; hairPath(g, p, 0); g.stroke();
      if (p.half) { g.strokeStyle = '#1b1714'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(p.len * 0.1, 0); g.quadraticCurveTo(p.len * 0.3, -10, p.len * 0.5, 0); g.stroke(); }
      if (p.root) { g.fillStyle = '#fff6ea'; g.strokeStyle = 'rgba(120,80,60,.6)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(-p.len * 0.5, 0, 5, 3.5, 0, 0, 7); g.fill(); g.stroke(); }
      g.restore();
    });
  }
  function hairPath(g, p, o) {
    g.beginPath(); const L = p.len;
    g.moveTo(-L * 0.5, o);
    if (p.curl) { for (let i = 1; i <= 20; i++) { const t = i / 20; g.lineTo(-L * 0.5 + L * t, o + Math.sin(t * 18) * 6); } }
    else g.bezierCurveTo(-L * 0.15, o - 16, L * 0.15, o + 14, L * 0.5, o - 4);
  }

  // ---------- 창 ----------
  U.openHow = function (first) { $('how').hidden = false; $('howKeys').textContent = touch ? L('빈 곳 끌기: 머리 돌리기 · 두 손가락: 확대', 'Drag empty space: turn · Two fingers: zoom') : L('빈 곳 끌기·오른쪽 끌기: 머리 돌리기 · 휠: 확대 · C 참빗', 'Drag empty space / right drag: turn · Wheel: zoom · C: comb'); HOW.start(); };
  function closeHow() { $('how').hidden = true; HOW.stop(); if (!S.how) { S.how = true; G.save(); } }
  U.result = function (o) {
    $('resL').innerHTML = '';
    // 정산표: 흰머리 +100, 황금 +1000, 검은 머리 -100, 팁(1천~10만), 합계
    const sg = (v) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toLocaleString();
    const rows = [[L('흰머리 ', 'White ') + o.white + ' × 100', o.white * 100]];
    if (o.gold) rows.push([L('황금 머리카락 ', 'Golden ') + o.gold + ' × 1000', o.gold * 1000]);
    rows.push([L('검은 머리 ', 'Black ') + o.black + ' × -100', -o.black * 100, 'neg']);
    rows.push([L('팁', 'Tip'), o.tip, o.tip >= 50000 ? 'jack' : '']);
    rows.push([L('합계', 'Total'), o.total, 'sum']);
    rows.forEach(([a, b, cls]) => { const d = document.createElement('div'); if (cls) d.className = cls; d.innerHTML = '<span></span><b></b>'; d.children[0].textContent = a; d.children[1].textContent = sg(b); $('resL').appendChild(d); });
    $('res').hidden = false; U.hud();
  };
  U.over = function (back) { $('overBack').hidden = !back; if (back) $('overBack').textContent = L('쓴 코인 돌려받음 +', 'Coins refunded +') + back.toLocaleString(); $('over').hidden = false; };
  U.shop = function () {
    $('shop').hidden = false; drawShop();
  };
  function drawShop() {
    $('shopCoin').textContent = L('코인 ', 'COIN ') + S.coins.toLocaleString();
    const L0 = $('shopL'); L0.innerHTML = '';
    D.SHOP.forEach((it) => {
      if (it.use) { // 쓰는 것: 가진 개수 + 하나 사기
        const e = document.createElement('div'); e.className = 'item';
        e.innerHTML = '<div class="nm"></div><div class="ds"></div><div class="lv"></div><div class="pips"></div>';
        e.querySelector('.nm').textContent = L(it.ko, it.en);
        e.querySelector('.ds').textContent = L(it.dko, it.den);
        e.querySelector('.lv').textContent = L('가진 것 ', 'Have ') + S.items[it.id];
        const b = document.createElement('button'); b.className = 'btn sm';
        b.innerHTML = '<span></span>'; b.firstChild.textContent = it.cost.toLocaleString(); if (S.coins < it.cost) b.classList.add('poor');
        b.onclick = () => { if (S.coins < it.cost) { SND.fail(); return; } S.coins -= it.cost; S.items[it.id]++; G.save(); SND.coin(); drawShop(); U.hud(); };
        e.appendChild(b); L0.appendChild(e); return;
      }
      const lv = S.gear[it.id], nx = it.lv[lv + 1];
      const e = document.createElement('div'); e.className = 'item';
      e.innerHTML = '<div class="nm"></div><div class="ds"></div><div class="lv"></div><div class="pips"></div>';
      e.querySelector('.nm').textContent = L(it.ko, it.en);
      e.querySelector('.ds').textContent = L(it.dko, it.den);
      e.querySelector('.lv').textContent = L(it.lv[lv].ko, it.lv[lv].en) + (nx ? ' → ' + L(nx.ko, nx.en) : '');
      for (let i = 1; i < it.lv.length; i++) { const p = document.createElement('i'); if (i <= lv) p.className = 'on'; e.querySelector('.pips').appendChild(p); }
      const b = document.createElement('button'); b.className = 'btn sm';
      if (nx) { b.innerHTML = '<span></span>'; b.firstChild.textContent = nx.cost.toLocaleString(); if (S.coins < nx.cost) b.classList.add('poor'); b.onclick = () => { if (S.coins < nx.cost) { SND.fail(); return; } S.coins -= nx.cost; S.gear[it.id]++; G.save(); SND.coin(); drawShop(); U.hud(); if (it.id === 'lamp' && G.mode === 'play') G.light(); }; }
      else { b.innerHTML = '<span>MAX</span>'; b.disabled = true; b.style.opacity = 0.6; }
      e.appendChild(b); L0.appendChild(e);
    });
  }
  U.dex = function () {
    $('dexW').hidden = false; const L0 = $('dexL'); L0.innerHTML = '';
    D.TYPE_KEYS.forEach((k) => {
      const t = D.TYPES[k], n = S.dex[k] || 0;
      const e = document.createElement('div'); e.className = 'd' + (n ? '' : ' no');
      const c = document.createElement('canvas'); c.width = c.height = 160; dexPic(c.getContext('2d'), k);
      e.appendChild(c); const b = document.createElement('b'); b.textContent = n ? L(t.ko, t.en) : '???'; e.appendChild(b);
      const s = document.createElement('div'); s.textContent = n ? '× ' + n : ''; e.appendChild(s);
      L0.appendChild(e);
    });
  };
  function dexPic(g, k) {
    const gr = g.createRadialGradient(80, 140, 10, 80, 140, 140); gr.addColorStop(0, '#f0c2a6'); gr.addColorStop(1, '#c98a6c'); g.fillStyle = gr; g.fillRect(0, 0, 160, 160);
    for (let i = 0; i < 18; i++) { g.strokeStyle = '#1b1714'; g.lineWidth = 2; g.beginPath(); const x = 10 + i * 8; g.moveTo(x, 160); g.quadraticCurveTo(x + 18, 110, x + 40 + (i % 3) * 6, 96); g.stroke(); }
    const col = { gold: '#ffc930', silver: '#dfe3e8' }[k] || '#f4f2ec';
    const w = k === 'thick' ? 6 : 3.5;
    const line = (x0, ox) => {
      g.lineCap = 'round';
      const path = () => { g.beginPath(); g.moveTo(x0, 150); if (k === 'curly') { for (let i = 1; i <= 30; i++) { const t = i / 30; g.lineTo(x0 + Math.sin(t * 16) * 10 + ox * t, 150 - t * 120); } } else if (k === 'sprout') { g.lineTo(x0 + 4, 112); } else { const L = k === 'silver' ? 140 : 110; g.quadraticCurveTo(x0 - 10 + ox, 150 - L * 0.6, x0 + 20 + ox, 150 - L); } };
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = w + 3; path(); g.stroke();
      g.strokeStyle = col; g.lineWidth = w; path(); g.stroke();
      if (k === 'half') { g.strokeStyle = '#1b1714'; g.lineWidth = w; g.beginPath(); g.moveTo(x0 + 2 + ox * 0.5, 96); g.quadraticCurveTo(x0 + 8 + ox, 60, x0 + 20 + ox, 40); g.stroke(); }
      g.fillStyle = '#fff6ea'; g.beginPath(); g.ellipse(x0, 150, w + 2, w, 0, 0, 7); g.fill();
    };
    if (k === 'twin') { line(70, -14); line(86, 14); } else line(78, 0);
    if (k === 'gold') { g.fillStyle = 'rgba(255,235,150,.9)'; [[110, 40], [58, 70], [100, 92]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 3, y); g.lineTo(x, y + 9); g.lineTo(x - 3, y); g.fill(); g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x, y + 3); g.lineTo(x + 9, y); g.lineTo(x, y - 3); g.fill(); }); }
  }
  U.endingCard = async function () {
    const url = await CARD.make();
    $('endImg').src = url || '';
    $('end').hidden = false;
  };

  // ---------- 단추 연결 ----------
  function togs() {
    const set = () => { $('tBgm').classList.toggle('off', !SND.bgmOn); $('tSfx').classList.toggle('off', !SND.sfxOn); };
    $('tBgm').onclick = () => { SND.ensure(); SND.setBgm(!SND.bgmOn); SND.startBgm(); set(); };
    $('tSfx').onclick = () => { SND.ensure(); SND.setSfx(!SND.sfxOn); set(); };
    $('tHow').onclick = () => U.openHow(false);
    $('tShop').onclick = () => { SND.ensure(); SND.ui(); G.release(); U.shop(); };
    $('tDex').onclick = () => { SND.ensure(); SND.ui(); G.release(); U.dex(); };
    set();
  }
  function setComb(on) { G.combMode = on; $('bComb').classList.toggle('on', on); document.body.classList.toggle('combing', on); }
  function wire() {
    const click = (id, f) => ($(id).onclick = (e) => { e.stopPropagation(); SND.ensure(); SND.ui(); f(); });
    click('bStart', () => { G.reset(); G.opening(); });
    click('bCont', () => G.opening());
    click('bNew', () => { G.reset(); G.opening(); });
    click('bHowOk', closeHow);
    // 손님 바꿀 때 하얗게 덮고(새 머리 만드는 동안) 걷어 냄
    const swap = (f) => { U.fade(1); setTimeout(() => { f(); setTimeout(() => U.fade(0), 60); }, 380); };
    click('bNext', () => { $('res').hidden = true; swap(() => G.next()); });
    click('bShopR', U.shop);
    click('xShop', () => ($('shop').hidden = true)); click('xDex', () => ($('dexW').hidden = true));
    click('bRetry', () => { $('over').hidden = true; swap(() => G.retry()); });
    click('bHomeO', () => { $('over').hidden = true; U.show('title'); });
    click('bComb', () => setComb(!G.combMode));
    click('bRub', () => G.use('rub')); click('bTea', () => G.use('tea'));
    click('bSave', () => CARD.save());
    click('bShare', () => { const r = CARD.share(); if (r === 'copied') U.toast(L('주소를 복사했습니다', 'Link copied')); });
    click('bEndHome', () => { $('end').hidden = true; G._endShown = false; U.show('title'); });
    addEventListener('keydown', (e) => {
      if (G.mode !== 'play' || U.paused()) { if (e.key === 'Escape') { $('shop').hidden = true; $('dexW').hidden = true; } if (e.key === 'Enter' && !$('how').hidden) closeHow(); return; }
      const k = e.key.toLowerCase();
      if (k === 'c') setComb(!G.combMode);
      if (k === 'r') G.use('rub'); if (k === 't') G.use('tea');
      if (k === 'arrowleft') G.orbit(-40, 0); if (k === 'arrowright') G.orbit(40, 0);
      if (k === 'arrowup') G.orbit(0, -30); if (k === 'arrowdown') G.orbit(0, 30);
      if (k === '=' || k === '+') G.zoom(0.88); if (k === '-') G.zoom(1.14);
    });
  }

  // ---------- 포인터 ----------
  function input() {
    const cv = $('cv');
    const pts = new Map();
    let act = null, pinch = null;
    const cc = $('combCur');
    let combX = -999, combY = -999, combA = Math.PI / 2;
    // 참빗은 빗살이 움직이는 쪽을 보게(몸통은 움직임과 직각), 폭 = 빗질 폭
    const placeComb = () => { const w = G.gv('combR') * 2, h = w * 0.5; cc.style.width = w + 'px'; cc.style.height = h + 'px'; cc.style.transform = 'translate(' + (combX - w / 2) + 'px,' + (combY - h / 2) + 'px) rotate(' + (combA + Math.PI / 2) + 'rad)'; };
    U.combAngle = (a) => { combA = a; placeComb(); };
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      SND.ensure();
      if (G.mode === 'opening') { G.skipOpening(); return; }
      if (G.mode !== 'play' && G.mode !== 'ending') return;
      cv.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) { G.release(); G.combEnd(); const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; act = 'pinch'; return; }
      if (G.mode === 'ending') { act = 'orbit'; return; }
      if (e.button === 2 || e.button === 1) { act = 'orbit'; return; }
      if (G.combMode) { act = 'comb'; G.combStart(e.clientX, e.clientY); return; }
      act = G.tryGrab(e.clientX, e.clientY) ? 'grab' : 'orbit';
    });
    cv.addEventListener('pointermove', (e) => {
      combX = e.clientX; combY = e.clientY; placeComb();
      const p = pts.get(e.pointerId); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (act === 'pinch' && pts.size >= 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        G.zoom(pinch.d / Math.max(1, d)); G.orbit(mx - pinch.mx, my - pinch.my); pinch = { d, mx, my }; return;
      }
      if (act === 'grab') G.moveGrab(e.clientX, e.clientY);
      else if (act === 'comb') G.combMove(e.clientX, e.clientY);
      else if (act === 'orbit') G.orbit(dx, dy);
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (act === 'grab') G.release();
      if (act === 'comb') G.combEnd();
      if (pts.size === 0) act = null; else if (act === 'pinch') act = 'none';
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); G.zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
  }
})();
