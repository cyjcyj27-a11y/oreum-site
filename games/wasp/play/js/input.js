// 입력: PC 키보드·마우스(포인터 잠금), 폰 패드·화면 끌기·단추. 게임은 IN 값만 읽는다.
(function () {
  const I = (window.IN = { mx: 0, mz: 0, run: false, spray: false, net: false, act: false, look: [0, 0], touch: false, locked: false });
  const keys = {};
  I.keys = keys;
  const isPlay = () => document.body.classList.contains('playing') && !document.body.classList.contains('paused');
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (!isPlay()) return;
    if (e.code === 'KeyF') I.netPress = true;
    if (e.code === 'KeyE' || e.code === 'Space') I.act = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyE' || e.code === 'Space') I.act = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; I.spray = false; I.act = false; I.mouseSpray = false; });
  const cv = () => document.getElementById('cv');
  // 마우스: 누르면 잠금, 잠긴 동안 움직임 = 시점, 왼쪽 = 스프레이, 오른쪽 = 포충망
  window.addEventListener('mousedown', (e) => {
    if (I.touch || !isPlay() || e.target !== cv()) return;
    if (!I.locked) { try { cv().requestPointerLock(); } catch (er) {} }
    if (e.button === 0) I.mouseSpray = true;
    if (e.button === 2 && I.locked) I.netPress = true;
  });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) I.mouseSpray = false; });
  window.addEventListener('contextmenu', (e) => { if (isPlay()) e.preventDefault(); });
  document.addEventListener('pointerlockchange', () => { I.locked = document.pointerLockElement === cv(); if (!I.locked) I.mouseSpray = false; });
  window.addEventListener('mousemove', (e) => {
    if (I.touch || !isPlay()) return;
    if (I.locked) { I.look[0] += e.movementX * 0.0024; I.look[1] += e.movementY * 0.0024; }
    else if (e.buttons & 2) { I.look[0] += e.movementX * 0.004; I.look[1] += e.movementY * 0.004; } // 안 잠겼을 땐 오른쪽 끌기로만 시점(왼쪽은 스프레이)
  });
  // 폰
  window.addEventListener('touchstart', () => { if (!I.touch) { I.touch = true; document.body.classList.add('touch'); } }, { passive: true });
  I.bindTouch = function () {
    const pad = document.getElementById('pad'), knob = document.getElementById('knob');
    let pid = null, cx = 0, cy = 0, R = 1;
    const setK = (dx, dy) => { knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pid = e.pointerId; pad.setPointerCapture(pid); const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2; move(e); });
    const move = (e) => {
      if (e.pointerId !== pid) return;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), m = R * 0.62;
      if (d > m) { dx *= m / d; dy *= m / d; }
      setK(dx, dy);
      const nx = dx / m, ny = dy / m, dd = Math.hypot(nx, ny);
      if (dd < 0.12) { I.mx = 0; I.mz = 0; I.padRun = false; return; }
      I.mx = nx; I.mz = ny; I.padRun = dd > 0.92;
    };
    pad.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== pid) return; pid = null; I.mx = I.mz = 0; I.padRun = false; setK(0, 0); };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    // 시점: 패드·단추 밖 화면 끌기
    let lid = null, lx = 0, ly = 0;
    cv().addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; if (lid != null) return; lid = e.pointerId; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointermove', (e) => { if (e.pointerId !== lid) return; I.look[0] += (e.clientX - lx) * 0.0062; I.look[1] += (e.clientY - ly) * 0.0062; lx = e.clientX; ly = e.clientY; });
    const lend = (e) => { if (e.pointerId === lid) lid = null; };
    window.addEventListener('pointerup', lend); window.addEventListener('pointercancel', lend);
    // 단추(누르고 있는 동안). 스프레이 단추는 누른 채 끌면 시점도 돈다.
    const hold = (id, on, off, drag) => {
      const b = document.getElementById(id); let bid = null, bx = 0, by = 0;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); bid = e.pointerId; b.setPointerCapture(bid); bx = e.clientX; by = e.clientY; b.classList.add('on'); on(); });
      b.addEventListener('pointermove', (e) => { if (e.pointerId !== bid || !drag) return; I.look[0] += (e.clientX - bx) * 0.0062; I.look[1] += (e.clientY - by) * 0.0062; bx = e.clientX; by = e.clientY; });
      const up = (e) => { if (e.pointerId !== bid) return; bid = null; b.classList.remove('on'); off(); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    };
    hold('bSpray', () => (I.padSpray = true), () => (I.padSpray = false), true);
    hold('bNet', () => (I.netPress = true), () => {});
    hold('bAct', () => (I.padAct = true), () => (I.padAct = false));
  };
  I.read = function () {
    let x = 0, z = 0;
    if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1;
    if (keys.KeyW || keys.ArrowUp) z -= 1; if (keys.KeyS || keys.ArrowDown) z += 1;
    if (x || z) { const d = Math.hypot(x, z); I.mx = x / d; I.mz = z / d; I.kb = true; } else if (I.kb) { I.mx = I.mz = 0; I.kb = false; }
    I.run = !!(keys.ShiftLeft || keys.ShiftRight) || !!I.padRun;
    I.spray = !!(I.mouseSpray || I.padSpray);
    I.actHeld = !!(I.act || I.padAct);
    // 키보드 시점(마우스 없는 사람): Q·E 는 행동이라 J·L·I·K
    if (keys.KeyJ) I.look[0] -= 0.035; if (keys.KeyL) I.look[0] += 0.035; if (keys.KeyI) I.look[1] -= 0.025; if (keys.KeyK) I.look[1] += 0.025;
  };
  I.lock = function () { if (I.touch) return; try { const c = cv(); if (c && document.pointerLockElement !== c) c.requestPointerLock(); } catch (e) {} };
  I.takeNet = function () { const v = !!I.netPress; I.netPress = false; return v; };
  I.takeLook = function () { const v = [I.look[0], I.look[1]]; I.look[0] = I.look[1] = 0; return v; };
})();
