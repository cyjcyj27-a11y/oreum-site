// 입력: PC 키보드·마우스(포인터 잠금), 폰 패드·화면 끌기·단추. 게임은 IN 값만 읽는다.
(function () {
  const I = (window.IN = { mx: 0, mz: 0, my: 0, bite: false, look: [0, 0], touch: false, locked: false });
  const keys = {}; I.keys = keys;
  const isPlay = () => document.body.classList.contains('playing') && !document.body.classList.contains('paused');
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (!isPlay()) return;
    if (e.code === 'KeyE' || e.code === 'KeyQ') I.dashPress = true;
    if (e.code === 'KeyF') I.keyBite = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'KeyF') I.keyBite = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; I.mouseBite = false; I.keyBite = false; });
  const cv = () => document.getElementById('cv');
  // 잠금 요청은 약속(promise)으로 실패할 수 있어 조용히 받아 둠
  function cap(el, id) { try { el.setPointerCapture(id); } catch (e) {} }
  function reqLock(el) { try { const p = el.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  window.addEventListener('mousedown', (e) => {
    if (I.touch || !isPlay() || e.target !== cv()) return;
    if (!I.locked) reqLock(cv());
    if (e.button === 0) I.mouseBite = true;
  });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) I.mouseBite = false; });
  window.addEventListener('contextmenu', (e) => { if (isPlay()) e.preventDefault(); });
  document.addEventListener('pointerlockchange', () => { I.locked = document.pointerLockElement === cv(); });
  window.addEventListener('mousemove', (e) => {
    if (I.touch || !isPlay()) return;
    if (I.locked) { I.look[0] += e.movementX * 0.0024; I.look[1] += e.movementY * 0.0024; }
    else if (e.buttons & 2) { I.look[0] += e.movementX * 0.004; I.look[1] += e.movementY * 0.004; }
  });
  window.addEventListener('touchstart', () => { if (!I.touch) { I.touch = true; document.body.classList.add('touch'); } }, { passive: true });
  I.bindTouch = function () {
    const pad = document.getElementById('pad'), knob = document.getElementById('knob');
    let pid = null, cx = 0, cy = 0, R = 1;
    const setK = (dx, dy) => { knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pid = e.pointerId; cap(pad, pid); const r = pad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2; move(e); });
    const move = (e) => {
      if (e.pointerId !== pid) return;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), m = R * 0.62;
      if (d > m) { dx *= m / d; dy *= m / d; }
      setK(dx, dy);
      const nx = dx / m, ny = dy / m;
      if (Math.hypot(nx, ny) < 0.1) { I.pmx = 0; I.pmz = 0; return; }
      I.pmx = nx; I.pmz = ny;
    };
    pad.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== pid) return; pid = null; I.pmx = I.pmz = 0; setK(0, 0); };
    pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    // 시점: 패드·단추 밖 화면 끌기
    let lid = null, lx = 0, ly = 0;
    cv().addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || lid != null) return; lid = e.pointerId; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointermove', (e) => { if (e.pointerId !== lid) return; I.look[0] += (e.clientX - lx) * 0.0062; I.look[1] += (e.clientY - ly) * 0.0062; lx = e.clientX; ly = e.clientY; });
    const lend = (e) => { if (e.pointerId === lid) lid = null; };
    window.addEventListener('pointerup', lend); window.addEventListener('pointercancel', lend);
    const hold = (id, on, off, drag) => {
      const b = document.getElementById(id); let bid = null, bx = 0, by = 0;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); bid = e.pointerId; cap(b, bid); bx = e.clientX; by = e.clientY; b.classList.add('on'); on(); });
      b.addEventListener('pointermove', (e) => { if (e.pointerId !== bid || !drag) return; I.look[0] += (e.clientX - bx) * 0.0062; I.look[1] += (e.clientY - by) * 0.0062; bx = e.clientX; by = e.clientY; });
      const up = (e) => { if (e.pointerId !== bid) return; bid = null; b.classList.remove('on'); off(); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    };
    hold('bBite', () => (I.padBite = true), () => (I.padBite = false), true);
    hold('bUp', () => (I.padUp = true), () => (I.padUp = false));
    hold('bDown', () => (I.padDown = true), () => (I.padDown = false));
    hold('bDash', () => (I.dashPress = true), () => {});
  };
  I.read = function () {
    let x = 0, z = 0;
    if (keys.KeyA || keys.ArrowLeft) x -= 1; if (keys.KeyD || keys.ArrowRight) x += 1;
    if (keys.KeyW || keys.ArrowUp) z -= 1; if (keys.KeyS || keys.ArrowDown) z += 1;
    if (x || z) { const d = Math.hypot(x, z); I.mx = x / d; I.mz = z / d; } else { I.mx = I.pmx || 0; I.mz = I.pmz || 0; }
    I.my = (keys.Space || I.padUp ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight || keys.KeyC || I.padDown ? 1 : 0);
    I.bite = !!(I.mouseBite || I.keyBite || I.padBite);
    if (keys.KeyJ) I.look[0] -= 0.035; if (keys.KeyL) I.look[0] += 0.035; if (keys.KeyI) I.look[1] -= 0.025; if (keys.KeyK) I.look[1] += 0.025;
  };
  I.lock = function () { if (I.touch) return; const c = cv(); if (c && document.pointerLockElement !== c) reqLock(c); };
  I.takeDash = function () { const v = !!I.dashPress; I.dashPress = false; return v; };
  I.takeLook = function () { const v = [I.look[0], I.look[1]]; I.look[0] = I.look[1] = 0; return v; };
  I.clear = function () { I.mouseBite = I.keyBite = I.padBite = false; I.dashPress = false; I.look[0] = I.look[1] = 0; };
})();
