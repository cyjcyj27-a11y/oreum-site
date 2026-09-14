// hud.js — 입력(키·마우스·손가락)과 화면 숫자
(function () {
  const $ = id => document.getElementById(id);
  const keys = {};
  let locked = false, touch = false, bossF = null;
  const IN = PLAYER.IN;

  function bind() {
    const cv = $('c');
    touch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (touch) document.body.classList.add('touch');

    addEventListener('keydown', e => {
      if (e.repeat) return;
      keys[e.code] = true;
      if (T.mode !== 'play') return;
      if (e.code === 'KeyJ') PLAYER.press('punch');
      if (e.code === 'KeyK') PLAYER.press('kick');
      if (e.code === 'KeyL' || e.code === 'KeyQ') PLAYER.press('special');
      // 점프·피하기는 뺐다 (9/14 사장님 "PC 에서도 빼라")
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'KeyE') GAME.act();
      if (GAME.vendOpen() && (e.code === 'Digit1' || e.code === 'Numpad1')) GAME.buy('milk');
      if (GAME.vendOpen() && (e.code === 'Digit2' || e.code === 'Numpad2')) GAME.buy('can');
      if (GAME.vendOpen() && (e.code === 'Digit3' || e.code === 'Numpad3')) GAME.buy('seed');
      if (GAME.vendOpen() && (e.code === 'Digit4' || e.code === 'Numpad4')) GAME.buy('bone');
      if (e.code === 'Tab' || e.code === 'KeyR') { e.preventDefault(); PLAYER.swap(); }
      if (e.code === 'KeyM') { T.bgm = !T.bgm; store(); paintTog(); }
      if (e.code === 'KeyN') { T.sfx = !T.sfx; store(); paintTog(); }
      if (e.code === 'Escape' || e.code === 'KeyP') GAME.pause();
    });
    addEventListener('keydown', e => { if (e.code === 'Tab' || e.code.startsWith('Arrow')) e.preventDefault(); });
    addEventListener('keyup', e => { keys[e.code] = false; });
    addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    // 마우스 시점(9/14 사장님): 화면을 한 번 누르면 마우스가 잠기고 움직이는 대로 시점이 돈다(3인칭 표준). Esc 로 풀림
    // 잠긴 채: 왼쪽 = 펀치, 오른쪽 = 킥. 안 잠겼을 때는 예전처럼 오른쪽 누른 채 끌기 = 시점
    let rDown = false, rMoved = 0;
    document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === cv; });
    cv.addEventListener('mousedown', e => {
      if (touch || T.mode !== 'play' || T.paused) return;
      if (!locked && e.button === 0 && cv.requestPointerLock) {
        try { const p = cv.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { }
        return;   // 잠그는 첫 클릭은 펀치로 쓰지 않는다
      }
      if (e.button === 0) PLAYER.press('punch');
      if (e.button === 2) { rDown = true; rMoved = 0; }
    });
    addEventListener('mouseup', e => {
      if (e.button !== 2 || !rDown) return;
      rDown = false;
      if (rMoved < 8 && T.mode === 'play' && !T.paused) PLAYER.press('kick');
    });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('mousemove', e => {
      if (locked) { if (T.mode === 'play' && !T.paused) CAMERA.look(e.movementX, e.movementY); return; }
      if (!rDown) return;
      rMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
      if (rMoved >= 8) CAMERA.look(e.movementX * 1.2, e.movementY * 1.2);
    });

    if (touch) padSetup();
    $('tPause').onclick = () => GAME.pause();
    $('tBgm').onclick = () => { T.bgm = !T.bgm; store(); paintTog(); };
    $('tSfx').onclick = () => { T.sfx = !T.sfx; store(); paintTog(); };
    $('act').onclick = () => GAME.act();
    // 가방: 누르면 가진 물건, 아무 데나 누르면 닫힘
    $('bagPill').addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); $('bagPanel').classList.toggle('show'); AUD.sfx('page'); });
    addEventListener('pointerdown', e => { if (!e.target.closest || !e.target.closest('#bagPill')) $('bagPanel').classList.remove('show'); });
    addEventListener('keydown', e => { if (e.code === 'KeyI' && T.mode === 'play') $('bagPanel').classList.toggle('show'); });
    $('vMilk').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); GAME.buy('milk'); });
    $('vCan').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); GAME.buy('can'); });
    $('vSeed').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); GAME.buy('seed'); });
    $('vBone').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); GAME.buy('bone'); });
    restore(); paintTog();
  }

  function store() { try { localStorage.setItem('ueno.bgm', T.bgm ? '1' : '0'); localStorage.setItem('ueno.snd', T.sfx ? '1' : '0'); } catch (e) { } }
  function restore() {
    try { const a = localStorage.getItem('ueno.bgm'), b = localStorage.getItem('ueno.snd'); if (a !== null) T.bgm = a === '1'; if (b !== null) T.sfx = b === '1'; } catch (e) { }
  }
  function paintTog() { $('tBgm').classList.toggle('off', !T.bgm); $('tSfx').classList.toggle('off', !T.sfx); }

  // ── 손가락: 왼쪽 패드 이동, 오른쪽 단추 ──
  let padId = null, padC = { x: 0, y: 0 }, lookId = null, lookP = { x: 0, y: 0 };
  function padSetup() {
    const pad = $('pad'), knob = $('knob'), R = 93;
    pad.addEventListener('pointerdown', e => {
      padId = e.pointerId; pad.setPointerCapture(e.pointerId);
      const r = pad.getBoundingClientRect(); padC.x = r.left + r.width / 2; padC.y = r.top + r.height / 2;
      move(e); e.preventDefault();
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === padId) move(e); });
    const up = e => { if (e.pointerId !== padId) return; padId = null; IN.f = 0; IN.r = 0; IN.run = false; knob.style.transform = ''; };
    pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
    function move(e) {
      let dx = e.clientX - padC.x, dy = e.clientY - padC.y;
      const d = Math.hypot(dx, dy), m = Math.min(1, d / R);
      if (d > 0.001) { dx /= d; dy /= d; }
      knob.style.transform = 'translate(' + (dx * m * 58) + 'px,' + (dy * m * 58) + 'px)';
      if (m < 0.12) { IN.f = 0; IN.r = 0; IN.run = false; return; }
      IN.r = dx * m; IN.f = -dy * m; IN.run = m > 0.78;
    }
    addEventListener('pointerdown', e => {
      if (e.pointerId === padId) return;
      if (e.target.closest && e.target.closest('#pad,.tbtn,.tog,button,#title,#over,#act,#bagPanel')) return;
      lookId = e.pointerId; lookP.x = e.clientX; lookP.y = e.clientY;
    });
    addEventListener('pointermove', e => {
      if (e.pointerId !== lookId) return;
      CAMERA.look((e.clientX - lookP.x) * 1.3, (e.clientY - lookP.y) * 1.3);
      lookP.x = e.clientX; lookP.y = e.clientY;
    });
    const lu = e => { if (e.pointerId === lookId) lookId = null; };
    addEventListener('pointerup', lu); addEventListener('pointercancel', lu);
    tap($('bPunch'), () => PLAYER.press('punch'));
    tap($('bKick'), () => PLAYER.press('kick'));
    // 점프·피하기 단추는 뺐다 (9/14 사장님 "쓸 일이 없다") — PC 스페이스·C 는 그대로
    tap($('bSwap'), () => PLAYER.swap());
    tap($('bSpecial'), () => PLAYER.press('special'));
  }
  function tap(el, fn) {
    el.addEventListener('pointerdown', e => { el.classList.add('on'); fn(); e.preventDefault(); e.stopPropagation(); });
    const up = () => el.classList.remove('on');
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  }

  function read() {
    if (touch || window.__manual) return;
    // 방향키 = 이동, WASD = 시점 돌리기 (사장님 지정)
    IN.f = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
    IN.r = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    IN.run = !!(keys.ShiftLeft || keys.ShiftRight);
    CAM.keyX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    CAM.keyY = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
  }

  let lastCoin = -1, lastTaken = -1, lastHp = -1, lastAlly = -1, lastCan = -1, lastSeed = -1, lastBone = -1;
  function paint(dt) {
    const f = PL.f; if (!f) return;
    const hp = Math.max(0, f.hp) / f.hpMax;
    if (hp !== lastHp) {
      const w = (hp * 100) + '%';
      $('sHp').style.width = w; $('sHpTrail').style.width = w;
      $('sHp').classList.toggle('low', hp < 0.3);
      $('sHpNum').textContent = Math.ceil(Math.max(0, f.hp));
      if (hp < lastHp) { const p = $('hpPill'); p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); }
      lastHp = hp;
    }
    $('hurt').classList.toggle('low', T.mode === 'play' && !f.dead && hp < 0.3);
    const al = ALLY.f, ah = al.dead ? 0 : al.hp / al.hpMax;
    if (ah !== lastAlly) { $('sAlly').style.width = $('sAllyTrail').style.width = (ah * 100) + '%'; lastAlly = ah; }
    // 필살 게이지·단추는 싸울 때만
    const fighting = !!ZONE.active;
    if (fighting !== document.body.classList.contains('fighting')) document.body.classList.toggle('fighting', fighting);
    const g = PL.gauge / PL.gaugeMax;
    $('sGauge').style.width = (g * 100) + '%'; $('sGauge').classList.toggle('full', g >= 1);
    $('spPill').classList.toggle('full', g >= 1);
    $('bSpecial').classList.toggle('ready', g >= 1);
    if (T.coins !== lastCoin) { $('sCoin').textContent = T.coins; lastCoin = T.coins; }
    if ((T.cans || 0) !== lastCan) { lastCan = T.cans || 0; $('sCan').textContent = lastCan; }
    if ((T.seeds || 0) !== lastSeed) { lastSeed = T.seeds || 0; $('sSeed').textContent = lastSeed; }
    if ((T.bones || 0) !== lastBone) { lastBone = T.bones || 0; $('sBone').textContent = lastBone; }
    // 🚩 장소 칸(먹은 장소 수·화살표·거리)은 뺐다 — 다음 갈 곳은 작은 지도가 보여 준다 (9/14 사장님)
    // 보스 막대
    if (bossF) for (const b of bossF) {
      b.bar.style.width = (Math.max(0, b.f.hp) / b.f.hpMax * 100) + '%';
      if (b.f.brkMax) {
        const k = b.f.state === 'stun' ? 1 - b.f.t / b.f.stunDur : b.f.brk / b.f.brkMax;
        b.brk.style.width = (U.clamp(k, 0, 1) * 100) + '%';
        b.bb.classList.toggle('full', b.f.state === 'stun');
      }
      const rage = !!b.f.rage;
      if (rage !== b.rage) { b.rage = rage; b.name.classList.toggle('rage', rage); b.name.textContent = b.label + (rage ? ' 🔥' : ''); }
    }
    // 콤보
    const cb = $('combo');
    if (PL.combo >= 2) { cb.textContent = PL.combo + ' HIT'; cb.classList.add('on'); } else cb.classList.remove('on');
    // 자판기 안내
    const act = $('act'), pa = PUZ.nearAct() || JOY.nearAct() || PETS.nearAct(), v = !pa && !PL.ride && GAME.nearVend();
    if ((pa || v) && T.mode === 'play' && !T.paused && !ZONE.active) {
      const label = (touch ? '' : 'E ') + (pa ? pa.icon : (GAME.vendOpen() ? '✕' : '🍓🥛 · 🥫'));
      if (act.textContent !== label) act.textContent = label;
      act.classList.add('show'); act.classList.toggle('dim', pa ? !!pa.dim : false);
    } else act.classList.remove('show');
  }

  // 상대 체력 막대: [{ name, f }] 여럿. null 이면 숨김
  function boss(list) {
    const box = $('boss');
    if (!list || !list.length) { bossF = null; box.classList.remove('show'); box.innerHTML = ''; return; }
    box.innerHTML = '';
    bossF = list.map(b => {
      const row = document.createElement('div'); row.className = 'brow';
      row.innerHTML = '<div class="bname"></div><div class="bar"><div class="bhp"></div></div><div class="bbar"><div class="bbrk"></div></div>';
      row.querySelector('.bname').textContent = b.name;
      box.appendChild(row);
      return { f: b.f, label: b.name, name: row.querySelector('.bname'), rage: false, bar: row.querySelector('.bhp'), bb: row.querySelector('.bbar'), brk: row.querySelector('.bbrk') };
    });
    box.classList.add('show');
  }
  // 체인지: 큰 체력 알약 = 지금 조작하는 사람, 작은 알약 = 옆 사람
  function swapped() {
    const me = PL.f === T.ken ? '켄' : '히로미';
    $('sName').textContent = me;
    $('allyIcon').textContent = ALLY.f === T.hiromi ? '🎀' : '👊';
    $('sAlly').style.background = ALLY.f === T.hiromi ? 'linear-gradient(#ffc0dc, #ff6fae)' : 'linear-gradient(#ffe89a, #f2b820)';
    lastHp = -1; lastAlly = -1;
    const p = $('hpPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
  }
  function bumpCoin() { const el = $('sCoin').parentNode; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function show(on) { $('topbar').classList.toggle('show', on); document.body.classList.toggle('playing', on); }

  window.HUD = { bind, read, paint, boss, bumpCoin, show, swapped, get touch() { return touch; }, get locked() { return locked; } };
})();
