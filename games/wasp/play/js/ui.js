// 화면 글·창: 타이틀, 출동판, 지령서, HUD, 알림, 결과, GAME OVER, 상점, 도감, 설명, 일시정지, 엔딩.
(function () {
  const U = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const S = () => GAME.S;
  const MON = (m) => L(m + '월', ['', '', '', '', '', '', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'][m]);
  const show = (id, v) => { $(id).hidden = !v; };
  const allOv = ['board', 'brief', 'how', 'res', 'over', 'shop', 'dex', 'pause', 'end'];
  function only(id) { allOv.forEach((k) => show(k, k === id)); }
  U.only = only;
  U.paused = false;

  U.init = function () {
    // 글 바꿔 끼우기(영어)
    document.querySelectorAll('[data-en]').forEach((e) => { if (window.EN) e.innerHTML = e.getAttribute('data-en'); });
    $('bStart').onclick = () => { AU.unlock(); AU.play('click'); $('title').hidden = true; openBoard(); };
    $('bShop').onclick = () => { AU.play('click'); openShop(); };
    $('bDex').onclick = () => { AU.play('click'); openDex(); };
    $('dexX').onclick = () => { AU.play('click'); openBoard(); };
    $('shopX').onclick = () => { AU.play('click'); if (GAME.mode() === 'play') { IN.lock(); U.resume(); } else openBoard(); };
    // 출동 중 상점: 멈추고 열고, 닫으면 그 자리에서 이어 함
    $('bShopH').onclick = () => { AU.play('click'); U.pause(true); GAME.syncGear(true); U._shopPlay = true; openShop(); };
    $('briefX').onclick = () => { AU.play('click'); openBoard(); };
    $('bGo').onclick = () => { AU.play('click'); IN.lock(); go(); };
    $('howOk').onclick = () => { AU.play('click'); IN.lock(); show('how', false); if (U._howThen) { const f = U._howThen; U._howThen = null; f(); } else if (GAME.mode() === 'play') U.resume(); };
    $('bHow').onclick = () => { AU.play('click'); U.pause(true); openHow(null); };
    $('bPause').onclick = () => { AU.play('click'); U.pause(true); only('pause'); };
    $('pResume').onclick = () => { AU.play('click'); IN.lock(); U.resume(); };
    $('pBoard').onclick = () => { AU.play('click'); U.resume(true); GAME.setMode('board'); U.hudShow(false); GAME.setupWorld(Math.min(S().next, 19), true); openBoard(); };
    $('pRetry').onclick = () => { AU.play('click'); U.resume(true); GAME.retry(); };
    $('rNext').onclick = () => { AU.play('click'); if (U._last) { openEnd(); return; } GAME.setMode('board'); openBoard(); };
    $('rRetry').onclick = () => { AU.play('click'); only(null); GAME.retry(); };
    $('oRetry').onclick = () => { AU.play('click'); only(null); GAME.retry(); };
    $('oBoard').onclick = () => { AU.play('click'); GAME.setMode('board'); openBoard(); };
    $('endOk').onclick = () => { AU.play('click'); GAME.setMode('board'); openBoard(); };
    $('cSave').onclick = () => CARD.save();
    $('cShare').onclick = () => { CARD.share(); toast(L('주소를 복사했습니다', 'Link copied')); };
    const tg = (id, get, set) => { const b = $(id); const upd = () => b.classList.toggle('off', !get()); b.onclick = () => { AU.unlock(); set(!get()); upd(); }; upd(); };
    tg('bBgm', () => AU.bgm, (v) => AU.setBgm(v));
    tg('bSnd', () => AU.snd, (v) => AU.setSnd(v));
    window.addEventListener('blur', () => { if (GAME.mode() === 'play' && !U.paused) { U.pause(true); only('pause'); } });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && GAME.mode() === 'play') { if (U.paused) U.resume(); else { U.pause(true); only('pause'); } }
      if (e.code === 'KeyM') { AU.setBgm(!AU.bgm); $('bBgm').classList.toggle('off', !AU.bgm); }
      if (e.code === 'KeyK') {}
    });
    $('keys').innerHTML = L('WASD 이동 · Shift 달리기 · 마우스 시점<br>왼쪽 누름 스프레이 · F 포충망 · E 봉투·캔 · Esc 멈춤', 'WASD move · Shift run · Mouse look<br>Left click SPRAY · F net · E bag/can · Esc pause');
    U.hudShow(false);
    // 세로 폰
    const rot = () => { const portrait = innerHeight > innerWidth && Math.min(innerWidth, innerHeight) < 600; $('rotate').style.display = portrait ? 'flex' : 'none'; };
    window.addEventListener('resize', rot); rot();
    $('rotBtn').onclick = () => { if (window.OL && OL.go) OL.go(); else { const el = document.documentElement; try { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (e) {} try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} } };
    if (S().next > 0) $('bStart').querySelector('span').textContent = L('이어하기', 'CONTINUE');
  };
  U.pause = function (v) { U.paused = v; document.body.classList.toggle('paused', v); try { document.exitPointerLock(); } catch (e) {} AU.loops(0, 0, false); };
  U.resume = function (silent) { if (U._shopPlay) { U._shopPlay = false; GAME.syncGear(); } U.paused = false; document.body.classList.remove('paused'); only(null); };

  // ---------- 출동판 ----------
  function openBoard() {
    GAME.setMode('board'); only('board');
    $('bCoins').textContent = S().coins;
    const grid = $('tickets'); grid.innerHTML = '';
    DATA.MS.forEach((m, i) => {
      const b = document.createElement('button');
      const done = i < S().next, next = i === S().next, lock = i > S().next;
      b.className = 'tix' + (done ? ' done' : '') + (next ? ' next' : '') + (lock ? ' lock' : '');
      b.innerHTML = '<span class="no">' + (i + 1) + '</span><span class="lc">' + (lock ? '' : L(DATA.LOC[m.loc][0], DATA.LOC[m.loc][1])) + '</span>' + (done ? '<span class="stamp">' + L('완료', 'DONE') + '</span>' : '') + (lock ? '<i></i>' : '');
      if (!lock) b.onclick = () => { AU.play('click'); openBrief(i); };
      grid.appendChild(b);
    });
    // 달 머리
    const mh = $('months'); mh.innerHTML = '';
    [6, 7, 8, 9, 10].forEach((m) => { const d = document.createElement('div'); d.textContent = MON(m); mh.appendChild(d); });
  }
  U.openBoard = openBoard;
  let briefI = 0;
  function openBrief(i) {
    briefI = i; only('brief');
    const m = DATA.MS[i];
    $('brNo').textContent = L('출동 ', 'CALL ') + (i + 1) + ' · ' + MON(m.m);
    $('brLoc').textContent = L(DATA.LOC[m.loc][0], DATA.LOC[m.loc][1]);
    $('brSay').textContent = '“' + L(m.ko, m.en) + '”';
    const cnt = {};
    m.nests.forEach((n) => { cnt[n.sp] = (cnt[n.sp] || 0) + 1; });
    $('brBees').innerHTML = Object.keys(cnt).map((k) => '<span class="chip" style="--c:' + DATA.SP[k].col + '">' + L(DATA.SP[k].ko, DATA.SP[k].en) + (k === 'honey' ? '' : ' ×' + cnt[k]) + '</span>').join('');
    $('brPay').textContent = m.pay;
    const best = S().best[i]; $('brBest').textContent = best ? 'BEST ' + fmtT(best) : '';
    // 장면도 그 출동지로
    GAME.setupWorld(i, true);
  }
  function go() {
    const start = () => { only(null); GAME.startMission(briefI); };
    if (!S().how) { S().how = true; GAME.save(); openHow(start); } else start();
  }
  const fmtT = (t) => { t = Math.round(t); return ((t / 60) | 0) + ':' + String(t % 60).padStart(2, '0'); };

  // ---------- 설명 ----------
  function openHow(then) {
    U._howThen = then; show('how', true);
    const touch = document.body.classList.contains('touch');
    $('h1').innerHTML = touch ? L('<b>SPRAY</b> 단추를 누르고 있으면 겨눈 곳에 뿌려요. <b>NET</b> 으로 휘둘러 잡아요', 'Hold <b>SPRAY</b> to spray where you aim. Swing the <b>NET</b> to catch') : L('<b>왼쪽 클릭</b>을 누르고 있으면 겨눈 곳에 뿌려요. <b>F</b> 는 포충망', 'Hold <b>left click</b> to spray where you aim. <b>F</b> swings the net');
    $('h2').innerHTML = touch ? L('벌집에 뿌려 <b>기세</b>를 줄이고, 가까이서 <b>E</b> 단추를 누르고 있으면 봉투로 떼어 내요', 'Spray the nest to weaken it, then hold <b>E</b> nearby to bag it') : L('벌집에 뿌려 <b>기세</b>를 줄이고, 가까이서 <b>E</b> 를 누르고 있으면 봉투로 떼어 내요', 'Spray the nest to weaken it, then hold <b>E</b> nearby to bag it');
    $('h3').innerHTML = L('집이 안 보이면 <b>날아가는 벌</b>을 따라가요. 캔은 <b>차</b>나 <b>파란 상자</b>에서 갈고, 꿀벌은 쏘지 말고 벌통에!', 'No nest in sight? <b>Follow the wasps</b>. Swap cans at the <b>truck</b> or <b>blue box</b>. Never spray honeybees!');
    HOW.start();
  }
  U.openHow = openHow;

  // ---------- HUD ----------
  U.hudShow = function (v) { $('hud').hidden = !v; $('xh').hidden = !v; $('ctl').hidden = !v; $('keys').hidden = !v; if (!v) { $('prompt').hidden = true; $('tag').hidden = true; } };
  const bar = (id, k) => { $(id).style.transform = 'scaleX(' + Math.max(0, Math.min(1, k)) + ')'; };
  U.hud = function (P, B, hit, act, g) {
    const mi = GAME.mi();
    $('hMis').textContent = (mi + 1) + '/20';
    $('hCoin').textContent = S().coins;
    bar('bSuit', P.suit / P.suitMax); $('sSuit').classList.toggle('low', P.suit / P.suitMax < 0.3);
    $('hCans').textContent = '×' + S().cans;
    bar('bCan', P.can / P.canMax); $('sCan').classList.toggle('low', P.can < P.canMax * 0.2);
    $('sSwell').hidden = P.swell <= 0; bar('bSwell', P.swell / 100);
    const nl = B.nests.filter((n) => !n.removed && n.spec.sp !== 'honey').length, nt = B.nests.filter((n) => n.spec.sp !== 'honey').length;
    $('hNest').textContent = (nt - nl) + '/' + nt;
    $('hBee').textContent = B.hostileLeft();
    const hb = B.nests.filter((n) => n.spec.sp === 'honey');
    $('sHoney').hidden = !hb.length; if (hb.length) $('hHoney').textContent = hb.filter((n) => n.removed).length + '/' + hb.length;
    // 조준점
    const xh = $('xh');
    xh.className = hit ? (hit.sp && hit.alive !== undefined ? 'bee' : 'nest') : '';
    if (hit && hit.vigor !== undefined && hit.spec.sp !== 'honey') { $('vig').hidden = false; $('vigB').style.transform = 'scaleX(' + hit.vigor + ')'; $('vig').classList.toggle('ok', hit.vigor <= 0.3); }
    else $('vig').hidden = true;
    // 붓기: 화면 가장자리
    $('swellV').style.opacity = Math.max(0, (P.swell - 20) / 100);
    // 행동 단추 글자
    if (act) { $('ring').hidden = false; $('ringF').style.strokeDashoffset = String(126 * (1 - Math.min(1, act.t / act.dur))); } else $('ring').hidden = true;
  };
  U.prompt = function (best, P, g) {
    const el = $('prompt'), ba = $('bAct');
    if (!best) { el.hidden = true; ba.classList.add('dim'); ba.querySelector('span').textContent = 'E'; return; }
    el.hidden = false; ba.classList.remove('dim');
    let t = '', k = '';
    if (best.kind === 'can') { t = L('새 캔', 'NEW CAN') + ' (' + S().cans + ')'; k = L('캔', 'CAN'); el.classList.toggle('no', P.can >= P.canMax || (S().cans <= 0 && S().coins >= GAME.CAN_COST)); }
    else if (best.kind === 'bag') { t = L('벌집 떼기', 'BAG NEST'); k = L('봉투', 'BAG'); el.classList.toggle('no', best.n.vigor > 0.3 || !!(best.n.queen && best.n.queen.alive)); }
    else { t = L('벌통에 담기', 'BOX BEES'); k = L('벌통', 'BOX'); el.classList.remove('no'); }
    el.innerHTML = '<b>E</b>' + t;
    ba.querySelector('span').textContent = k;
  };
  // 꿀벌 덩어리 위에 뜨는 안내: 멀리서도 어떻게 담는지 보이게
  const tagV = new THREE.Vector3();
  U.tag = function (p) {
    const el = $('tag');
    if (!p) { el.hidden = true; return; }
    tagV.copy(p).project(RND.camera);
    if (tagV.z > 1 || Math.abs(tagV.x) > 1.1 || Math.abs(tagV.y) > 1.1) { el.hidden = true; return; }
    const touch = document.body.classList.contains('touch');
    const html = touch ? L('꿀벌은 뿌리지 말고 밑에서 <b>E</b> 단추 꾹', 'No spray! Hold <b>E</b> under the bees') : L('꿀벌은 뿌리지 말고 밑에서 <b>E</b> 꾹', 'No spray! Hold <b>E</b> under the bees');
    if (el._h !== html) { el.innerHTML = html; el._h = html; }
    el.hidden = false;
    el.style.transform = 'translate(' + Math.round((tagV.x * 0.5 + 0.5) * innerWidth) + 'px,' + Math.round((-tagV.y * 0.5 + 0.5) * innerHeight) + 'px) translate(-50%,-100%)';
  };
  U.flashBar = function (k) { const el = k === 'can' ? $('sCan') : $('vig'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
  let hurtT = null;
  U.hurt = function (a) { const h = $('hurt'); h.style.transition = 'none'; h.style.opacity = a; void h.offsetWidth; h.style.transition = 'opacity .5s'; h.style.opacity = 0; };
  U.pop = function (txt, cls) { const box = $('pops'), d = document.createElement('div'); d.className = 'pop ' + (cls || ''); d.textContent = txt; const last = box.lastElementChild; if (last) { d.style.top = Math.round(last.getBoundingClientRect().bottom + (cls === 'big' ? 60 : 34)) + 'px'; } box.appendChild(d); setTimeout(() => d.remove(), 1100); };
  function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); }
  U.toast = toast;
  U.newDex = function (k) { const sp = DATA.SP[k]; if (!sp) return; setTimeout(() => toast(L('도감 ', 'NEW ') + L(sp.ko, sp.en)), 300); };

  // ---------- 결과 ----------
  U.result = function (r) {
    only('res'); U._last = r.last;
    const rows = [[L('출동 보수', 'Pay'), r.base], [L('무사고', 'No stings'), r.noSting], [L('빠른 처리', 'Fast'), r.fast], [L('꿀벌 감점', 'Honeybee'), -r.honeyPen]];
    $('resRows').innerHTML = rows.filter((x) => x[1]).map((x) => '<div><span>' + x[0] + '</span><b>' + (x[1] > 0 ? '+' : '') + x[1] + '</b></div>').join('');
    $('resTot').textContent = '+' + r.total;
    $('resInfo').textContent = fmtT(r.t) + ' · ' + L('잡은 벌 ', 'Wasps ') + (r.kills + r.nets) + ' · ' + L('쏘임 ', 'Stings ') + r.stings;
    $('giftI').style.setProperty('--c', r.gift[2]);
    $('giftN').textContent = L(r.gift[0], r.gift[1]);
    $('giftNew').hidden = !r.newGift;
    $('rNext').querySelector('span').textContent = r.last ? 'THE END' : 'NEXT';
    AU.play('coin');
  };
  U.over = function () { only('over'); };
  U.noCan = function () { openBoard(); openShop(); toast(L('캔이 없어요 · 캔을 사고 출동해요', 'No spray cans. Buy some first')); };

  // ---------- 상점 ----------
  function openShop() {
    only('shop');
    const box = $('shopList'); box.innerHTML = '';
    $('sCoins').textContent = S().coins;
    // 소모품: 캔 사기 · 방호복 고치기
    const g = GAME.gear(), hp = S().suitHp == null ? g.suit : Math.min(g.suit, S().suitHp), fix = Math.ceil((g.suit - hp) * GAME.SUIT_FIX);
    const use = (nm, sub, label, poor, fn) => {
      const d = document.createElement('div'); d.className = 'item use';
      d.innerHTML = '<div class="nm">' + nm + '</div><div class="sub">' + sub + '</div>';
      const b = document.createElement('button'); b.className = 'btn sm' + (label === 'OK' ? ' suit' : '') + (poor ? ' poor' : '');
      b.innerHTML = '<span>' + label + '</span>';
      b.onclick = fn; d.appendChild(b); box.appendChild(d);
    };
    use(L('스프레이 캔', 'Spray Can'), L('가진 캔 ', 'Have ') + S().cans, GAME.CAN_COST, S().coins < GAME.CAN_COST, () => {
      if (S().coins < GAME.CAN_COST) { AU.play('nope'); return; }
      S().coins -= GAME.CAN_COST; S().cans++; GAME.save(); AU.play('coin'); openShop();
    });
    use(L('방호복 수선', 'Suit Repair'), '<i class="hp"><i style="width:' + Math.round(hp / g.suit * 100) + '%"></i></i>', fix > 0 ? fix : 'OK', fix > 0 && S().coins < fix, () => {
      if (fix <= 0) return;
      if (S().coins < fix) { AU.play('nope'); return; }
      S().coins -= fix; S().suitHp = g.suit; GAME.save(); AU.play('coin'); openShop();
    });
    DATA.SHOP.forEach((it) => {
      const lv = S().gear[it.id] || 0, max = lv >= it.max, cost = max ? 0 : it.cost[lv];
      const d = document.createElement('div'); d.className = 'item';
      d.innerHTML = '<div class="nm">' + L(it.ko, it.en) + '</div><div class="pips">' + Array.from({ length: it.max }, (_, k) => '<i class="' + (k < lv ? 'on' : '') + '"></i>').join('') + '</div>';
      const b = document.createElement('button'); b.className = 'btn sm' + (max ? ' suit' : '');
      b.innerHTML = '<span>' + (max ? 'MAX' : cost) + '</span>';
      if (!max && S().coins < cost) b.classList.add('poor');
      b.onclick = () => {
        if (max) return;
        if (S().coins < cost) { AU.play('nope'); return; }
        S().coins -= cost; S().gear[it.id] = (S().gear[it.id] || 0) + 1; GAME.save(); AU.play('coin'); openShop();
      };
      d.appendChild(b); box.appendChild(d);
    });
  }
  // ---------- 도감 ----------
  function openDex() {
    only('dex');
    const box = $('dexList'); box.innerHTML = '';
    let have = 0;
    Object.keys(DATA.SP).forEach((k) => {
      const sp = DATA.SP[k], n = S().dex[k] || 0; if (n) have++;
      const d = document.createElement('div'); d.className = 'card' + (n ? '' : ' unk');
      d.innerHTML = '<canvas width="120" height="90"></canvas><div class="nm">' + (n ? L(sp.ko, sp.en) : '???') + '</div><div class="ct">' + (n ? '×' + n : '') + '</div>';
      box.appendChild(d);
      HOW.drawBee(d.querySelector('canvas'), sp, !n);
    });
    $('dexPct').textContent = have + '/' + Object.keys(DATA.SP).length;
    const gb = $('giftList'); gb.innerHTML = '';
    let gh = 0;
    DATA.GIFT.forEach((g, i) => { const has = !!S().gifts[i]; if (has) gh++; const d = document.createElement('div'); d.className = 'gift' + (has ? '' : ' unk'); d.style.setProperty('--c', g[2]); d.innerHTML = '<i></i><span>' + (has ? L(g[0], g[1]) : '?') + '</span>'; gb.appendChild(d); });
    $('giftPct').textContent = gh + '/20';
  }
  // ---------- 엔딩 ----------
  async function openEnd() {
    only('end'); S().done = true; GAME.save();
    $('cardImg').src = '';
    const url = await CARD.make();
    if (url) $('cardImg').src = url;
  }
  U.openEnd = openEnd;
})();
