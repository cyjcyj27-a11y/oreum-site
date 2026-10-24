// 화면: 타이틀·상단바·게이지·살 고리·환생 카드·도감·일시정지·HOW TO PLAY·엔딩.
(function () {
  const U = (window.UI = {});
  const $ = (id) => document.getElementById(id);
  const V3 = THREE.Vector3;
  const click = (el, f) => el.addEventListener('click', (e) => { AU.init(); AU.sfx('btn'); f(e); });

  function setTexts() {
    $('lifeL').textContent = L('모기', 'MOSQ'); $('gBloodL').textContent = L('피', 'BLOOD'); $('gItchL').textContent = L('간지러움', 'ITCH'); $('gBellyL').textContent = L('배', 'BELLY'); $('gToxL').textContent = L('독', 'POISON');
    $('h1').textContent = L('날아가서 빨간 고리가 뜨면 침을 꽂으세요', 'Fly close. When the red ring shows, stab');
    $('h2').textContent = L('누르고 있으면 피를 빨아요. 간지러움이 차면 손이 올라와요', 'Hold to drink. When itch fills, a hand rises');
    $('h3').textContent = L('놓고 도망! 맞으면 풀숲에서 더 센 모기로 환생', 'Let go and flee! Get hit and you are reborn stronger');
    $('keys').innerHTML = L('WASD 이동 · 마우스 시점 · 스페이스 위 · Shift 아래<br>왼쪽 클릭(누르고 있기) 침 · E 대시 · Tab 도감 · Esc 일시정지', 'WASD move · Mouse look · Space up · Shift down<br>Hold left click: stab · E dash · Tab dex · Esc pause');
    $('cardsH').textContent = L('진화', 'EVOLVE'); $('dexH').textContent = L('도감', 'DEX'); $('tDexL').textContent = L('도감', 'DEX');
    $('pGoL').textContent = L('계속', 'RESUME'); $('pHomeL').textContent = L('처음 화면', 'TITLE');
    $('eSaveL').textContent = L('저장', 'SAVE'); $('eShareL').textContent = L('공유', 'SHARE'); $('eHomeL').textContent = L('처음으로', 'TITLE');
    $('rotT').textContent = L('폰을 가로로 돌려 주세요', 'Please rotate your phone'); $('rotB').textContent = L('가로로 보기', 'LANDSCAPE');
    $('bBite').textContent = L('침', 'STAB'); $('bDash').textContent = L('휙', 'DASH');
    $('logo').querySelector('.b').textContent = L('모기즈', '');
    document.title = L('MOGIZ 모기즈', 'MOGIZ');
  }

  U.init = function () {
    setTexts();
    const d = $('drops'); DATA.ORDER.forEach(() => d.appendChild(document.createElement('i')));
    document.querySelectorAll('.tMus').forEach((b) => click(b, () => { AU.set('bgm', !AU.on.bgm); syncSnd(); }));
    document.querySelectorAll('.tSfx').forEach((b) => click(b, () => { AU.set('sfx', !AU.on.sfx); syncSnd(); }));
    syncSnd();
    click($('tHow'), () => { pause(true, true); U.openHow(() => pause(false)); });
    click($('tPause'), () => pause(true));
    click($('pGo'), () => pause(false));
    click($('pHome'), () => { pause(false); document.body.classList.remove('playing'); GAME.mode = 'title'; GAME.alive = false; GAME.att = null; AU.buzz(0, 0); AU.suck(false); U.title(); });
    click($('dexX'), () => { $('dex').hidden = true; if (U.dexInGame) { U.dexInGame = false; pause(false); } });
    click($('tDex'), () => { pause(true, true); U.dexInGame = true; U.openDex(); });
    click($('eSave'), () => CARD.save());
    click($('eShare'), () => CARD.share());
    click($('eHome'), () => { $('end').hidden = true; GAME.afterEnding(); });
    $('rotBtn').onclick = () => { if (window.OL && OL.go) OL.go(); else { const el = document.documentElement; try { (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (e) {} try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} } };
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') { if (document.body.classList.contains('playing')) pause(!document.body.classList.contains('paused')); }
      if (e.code === 'Enter' && !$('how').hidden) $('howOk').click();
      if (e.code === 'Escape' && !$('dex').hidden) $('dexX').click();
      if (e.code === 'Tab' && document.body.classList.contains('playing')) { e.preventDefault(); if ($('dex').hidden) $('tDex').click(); else $('dexX').click(); }
    });
    // Esc 로 마우스 잠금이 풀리면 일시정지(브라우저가 Esc 키를 먹음)
    document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && !IN.touch && GAME.mode === 'play' && document.body.classList.contains('playing') && !document.body.classList.contains('paused')) pause(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && document.body.classList.contains('playing')) pause(true); });
    IN.bindTouch();
    U.title();
  };
  function syncSnd() { document.querySelectorAll('.tMus').forEach((b) => b.classList.toggle('off', !AU.on.bgm)); document.querySelectorAll('.tSfx').forEach((b) => b.classList.toggle('off', !AU.on.sfx)); }
  function pause(on, silent) {
    document.body.classList.toggle('paused', on);
    $('pause').hidden = !on || !!silent;
    AU.mute(on);
    if (on) { try { document.exitPointerLock(); } catch (e) {} IN.clear(); } else IN.lock();
  }

  // ---------- 타이틀 ----------
  U.title = function () {
    $('title').hidden = false; $('hud').hidden = true; $('gauges').hidden = true; $('keys').hidden = true; $('ret').hidden = true;
    const b = $('tBtns'); b.innerHTML = '';
    const mk = (txt, cls, f) => { const e = document.createElement('button'); e.className = 'btn ' + (cls || ''); e.innerHTML = '<span>' + txt + '</span>'; click(e, f); b.appendChild(e); };
    if (GAME.hasSave()) {
      mk(L('이어하기', 'CONTINUE'), '', () => go());
      mk(L('새로 시작', 'NEW GAME'), 'net', () => { GAME.newGame(); go(); });
    } else mk('START', '', () => { if (GAME.S.ended) GAME.newGame(); go(); });
    U.fadeIn();
  };
  function go() {
    $('title').hidden = true;
    const start = () => { U.fadeOut(() => { GAME.startLife(); U.fadeIn(); }); };
    if (!GAME.S.how) U.openHow(() => { GAME.S.how = 1; GAME.save(); start(); }); else start();
  }
  U.onLife = function () {
    $('hud').hidden = false; $('keys').hidden = false;
    $('lifeN').textContent = L(GAME.S.life + '호', '#' + GAME.S.life);
    $('bDash').hidden = !(GAME.st.dash > 0);
    if (GAME.st.dash > 0) $('keys').innerHTML = $('keys').innerHTML.replace(L('침 · E 대시', 'stab · E dash'), L('침 · E 대시', 'stab · E dash'));
  };

  // ---------- 매 프레임 ----------
  const _v = new V3(), _t = new V3();
  U.frame = function () {
    const G = GAME;
    if (G.mode !== 'play' && G.mode !== 'hatch') { $('ret').hidden = true; $('gauges').hidden = true; return; }
    // 대상 표시
    const tg = G.target();
    if (tg) { tg.headWorld(_t); $('tgtN').textContent = L(tg.D.ko, tg.D.en); } else { _t.copy(WORLD.basin); $('tgtN').textContent = L('풀숲', 'Grass'); }
    const dx = _t.x - MOSQ.pos.x, dz = _t.z - MOSQ.pos.z, dist = Math.hypot(dx, dz, _t.y - MOSQ.pos.y);
    const cy = G.cam.yaw, ang = Math.atan2(dx * Math.cos(cy) - dz * Math.sin(cy), -dx * Math.sin(cy) - dz * Math.cos(cy));
    $('arrow').style.transform = 'rotate(' + ang + 'rad)';
    $('tgtD').textContent = dist < 1 ? Math.round(dist * 100) + 'cm' : dist.toFixed(1) + 'm';
    const ds = $('drops').children;
    for (let i = 0; i < ds.length; i++) { const c = PEOPLE.by[DATA.ORDER[i]]; ds[i].classList.toggle('on', c.done); ds[i].classList.toggle('cur', c === tg); }
    // 살 고리
    const r = G.reticle && !G.att && !G.landing ? G.reticle : null;
    if (r) { _v.copy(r.pt).project(RND.camera); $('ret').hidden = _v.z > 1; $('ret').style.left = ((_v.x * 0.5 + 0.5) * innerWidth) + 'px'; $('ret').style.top = ((-_v.y * 0.5 + 0.5) * innerHeight) + 'px'; }
    else $('ret').hidden = true;
    // 게이지
    const a = G.att, showB = !!a, showBelly = MOSQ.belly > 0.02, showT = G.toxin > 0.02;
    $('gauges').hidden = !(showB || showBelly || showT);
    $('ggBlood').hidden = !a; $('ggItch').hidden = !a; $('ggBelly').hidden = !showBelly; $('ggTox').hidden = !showT;
    if (a) { $('gBlood').firstChild.style.width = (Math.min(1, a.c.blood / a.c.D.need) * 100) + '%'; $('gItch').firstChild.style.width = (Math.min(1, a.c.itch) * 100) + '%'; }
    $('gBelly').firstChild.style.width = (MOSQ.belly * 100) + '%';
    $('gTox').firstChild.style.width = (Math.min(1, G.toxin) * 100) + '%';
  };

  // ---------- 알림·연출 ----------
  let toastT = 0;
  U.toast = function (txt) { const t = $('toast'); t.textContent = txt; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => (t.style.opacity = 0), 1500); };
  U.flash = function (col) { const f = $('flash'); f.style.transition = 'none'; f.style.background = col; f.style.opacity = 0.75; requestAnimationFrame(() => { f.style.transition = 'opacity .35s'; f.style.opacity = 0; }); };
  U.done = function (c) {
    const s = $('stamp'); s.textContent = L(c.D.ko + ' 완료', c.D.en + ' DONE'); s.classList.add('on');
    setTimeout(() => s.classList.remove('on'), 1300);
  };
  U.fadeOut = function (cb) { const f = $('fade'); f.style.opacity = 1; setTimeout(cb, 520); };
  U.fadeIn = function () { $('fade').style.opacity = 0; };

  // ---------- HOW TO PLAY ----------
  U.openHow = function (cb) {
    $('how').hidden = false; HOW.start();
    $('howOk').onclick = () => { AU.init(); AU.sfx('btn'); $('how').hidden = true; HOW.stop(); cb && cb(); };
  };

  // ---------- 진화 카드 ----------
  U.openCards = function () {
    $('hud').hidden = true; $('gauges').hidden = true; $('keys').hidden = true;
    U.fadeIn();
    const row = $('cardRow'); row.innerHTML = '';
    const deal = GAME.dealCards();
    $('cardsH').textContent = L(GAME.S.life + '번째 모기로 진화', 'EVOLVE: MOSQUITO #' + GAME.S.life);
    const sw = Math.round((1 - DATA.swell(GAME.S.life)) * 100);
    $('cardsSub').textContent = L('물린 자리 부기 -' + sw + '%', 'Bite swelling -' + sw + '%');
    $('cards').hidden = false;
    let picked = false;
    deal.forEach((cd, i) => {
      const b = document.createElement('button'); b.className = 'spec' + (cd.g ? ' g' : '');
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; HOW.cardArt(cv, cd);
      b.appendChild(cv);
      const t = document.createElement('b'); t.textContent = L(cd.ko, cd.en); b.appendChild(t);
      const p = document.createElement('p'); p.textContent = L(cd.dk, cd.de); b.appendChild(p);
      if (!GAME.S.dex[cd.id]) { const n = document.createElement('span'); n.className = 'new'; n.textContent = 'NEW'; b.appendChild(n); }
      b.onclick = () => { if (picked) return; picked = true; AU.sfx('btn'); $('cards').hidden = true; GAME.pickCard(cd.id); };
      row.appendChild(b);
      setTimeout(() => { b.classList.add('show'); AU.sfx(cd.g ? 'gold' : 'card'); }, 300 + i * 260);
    });
  };
  // ---------- 도감 ----------
  U.openDex = function () {
    const L2 = $('dexList'); L2.innerHTML = '';
    let n = 0;
    DATA.CARDS.forEach((cd) => {
      const seen = !!GAME.S.dex[cd.id]; if (seen) n++;
      const d = document.createElement('div'); d.className = 'dx' + (cd.g ? ' g' : '') + (seen ? '' : ' no');
      const cv = document.createElement('canvas'); cv.width = cv.height = 96; HOW.cardArt(cv, cd, !seen); d.appendChild(cv);
      const t = document.createElement('div'); t.textContent = seen ? L(cd.ko, cd.en) : '?'; d.appendChild(t);
      if (seen) { d.title = L(cd.dk, cd.de); const sm = document.createElement('small'); sm.textContent = L(cd.dk, cd.de); d.appendChild(sm); }
      L2.appendChild(d);
    });
    $('dexN').textContent = n + ' / ' + DATA.CARDS.length;
    $('dex').hidden = false;
  };
  // ---------- 엔딩 글(한 줄씩) ----------
  U.endSeq = function (deaths, births) {
    const box = $('endSeq'); box.innerHTML = ''; box.hidden = false;
    const lines = deaths > 0
      ? [L(deaths + '번 죽고', 'Died ' + deaths + ' times'), L(births + '번 다시 태어나서', 'Born ' + births + ' times'), L('드디어 알을 낳는 데 성공했습니다.', 'and finally laid the eggs.')]
      : [L('한 번도 죽지 않고', 'Never died once'), L('드디어 알을 낳는 데 성공했습니다.', 'and finally laid the eggs.')];
    lines.forEach((t, i) => { const p = document.createElement('p'); p.textContent = t; box.appendChild(p); setTimeout(() => p.classList.add('on'), 600 + i * 2000); });
    const e = document.createElement('p'); e.className = 'big'; e.textContent = L('엔딩', 'THE END'); box.appendChild(e);
    setTimeout(() => e.classList.add('on'), 600 + lines.length * 2000 + 600);
    requestAnimationFrame(() => box.classList.add('on'));
  };
  U.endSeqOff = function () { $('endSeq').classList.remove('on'); setTimeout(() => ($('endSeq').hidden = true), 600); };
  // ---------- 엔딩 ----------
  U.ending = async function () {
    $('hud').hidden = true; $('gauges').hidden = true; $('keys').hidden = true; $('ret').hidden = true;
    const url = await CARD.make();
    $('cardImg').src = url || '';
    const S = GAME.S;
    $('endTxt').textContent = L('할아버지 피까지 무사히 마시고 풀숲으로 돌아와 알을 낳았다. 내년 여름에도 윙~', 'Drank all the way to Grandpa, came home to the grass and laid eggs. See you next summer. Bzzz~');
    $('end').hidden = false;
  };

  // 그림·글꼴을 다 기다리지 않고 글 읽기가 끝나면 바로 준비(load 보다 빠름)
  const boot = () => { GAME.init(); U.init(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
