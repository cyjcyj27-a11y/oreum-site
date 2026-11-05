// 진행: 입력을 지금 자리로 넘기고, 주문 하나(만들기→포장→택배→리뷰)와 하루·장을 굴린다.
(function () {
  const G = (window.G = {});
  const V3 = THREE.Vector3;
  const S = function (n) { try { return window.SND && SND[n] && SND[n].apply(null, [].slice.call(arguments, 1)); } catch (e) { return null; } };

  // ---------- 저장 ----------
  const KEY = 'otteok.save';
  G.save = load();
  G.freshSave = () => fresh();
  function fresh() { return { ch: 1, day: 1, coins: 0, total: 0, gear: {}, stats: { orders: 0, boxes: 0, stars: 0, perfect: 0, five: 0, pieces: 0 }, dex: {}, how: false, started: false, done: false, step: 1, ex: 0, lines: [], cities: {} }; }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.ch) { const o = Object.assign(fresh(), s); o.step = Math.max(o.step || 1, o.ch); return o; } } catch (e) {} return fresh(); }
  G.store = function () { try { localStorage.setItem(KEY, JSON.stringify(G.save)); } catch (e) {} };
  G.gear = (k) => !!G.save.gear[k];
  // 다음 장(가맹 1호점 등)을 상점에서 샀나
  G.stepOwned = () => G.save.step > G.save.ch;

  // ---------- 연속 PERFECT ----------
  let combo = 0;
  G.combo = () => combo;
  G.addCombo = () => { combo++; G.save.stats.perfect++; };
  G.resetCombo = () => { combo = 0; };

  // ---------- 가리킴 화살표(누를 물건 위에서 통통) ----------
  let arrow = null, arrowT = null, arrowH = 1;
  function makeArrow() {
    const g = new THREE.Group();
    const m = TOY.mat('#ff6f9c', { gloss: 0.6, rough: 0.3, emis: 0.25 });
    const cone = TOY.mesh(new THREE.ConeGeometry(0.22, 0.42, 20), m, 0, 0, 0, g); cone.rotation.x = Math.PI; cone.castShadow = false;
    const ball = TOY.mesh(new THREE.SphereGeometry(0.13, 16, 12), m, 0, 0.36, 0, g); ball.castShadow = false;
    g.visible = false; RND.scene.add(g);
    return g;
  }
  G.point = function (obj, h) {
    if (!arrow) arrow = makeArrow();
    arrowT = obj; arrowH = h == null ? 1 : h;
    arrow.visible = !!obj;
  };
  G._arrowT = () => (arrow && arrow.visible ? arrowT : null);
  function stepArrow() {
    if (!arrow || !arrowT) return;
    const p = arrowT.isVector3 ? arrowT.clone() : arrowT.getWorldPosition(new V3());
    arrow.position.set(p.x, p.y + arrowH + 0.35 + Math.abs(Math.sin(performance.now() / 260)) * 0.25, p.z);
    arrow.rotation.y += 0.04;
  }

  // ---------- 입력 ----------
  G.station = null; // 지금 손이 닿는 자리(MAKE/PACK/SHIP)
  G.lock = false;
  const cv = document.getElementById('cv');
  function pt(e) { return { x: e.clientX, y: e.clientY, id: e.pointerId }; }
  cv.addEventListener('pointerdown', (e) => { if (window.SND) SND.unlock(); if (G.lock || !G.station) return; try { cv.setPointerCapture(e.pointerId); } catch (_) {} G.station.down && G.station.down(pt(e)); });
  cv.addEventListener('pointermove', (e) => { if (G.lock || !G.station) return; G.station.move && G.station.move(pt(e)); });
  const up = (e) => { if (G.lock || !G.station) return; G.station.up && G.station.up(pt(e)); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  addEventListener('keydown', (e) => {
    if (e.code === 'Space' && G.station && !G.lock) { e.preventDefault(); const c = { x: innerWidth / 2, y: innerHeight / 2 }; if (!e.repeat) G.station.down && G.station.down(c); }
  });
  addEventListener('keyup', (e) => { if (e.code === 'Space' && G.station && !G.lock) { const c = { x: innerWidth / 2, y: innerHeight / 2 }; G.station.up && G.station.up(c); } });

  // ---------- 고리 ----------
  G.paused = false;
  let last = performance.now();
  G.tick = function (dt) {
    FX.step(dt);
    if (window.MAKE) MAKE.step(dt);
    if (window.PACK) PACK.step(dt);
    if (window.SHIP) SHIP.step(dt);
    if (G.flowStep) G.flowStep(dt);
    stepArrow();
    if (window.FACT) FACT.step(dt);
    if (window.EXCH) EXCH.step(dt);
    RND.stepDecor(dt);
    RND.stepCam(dt);
  };
  G.manual = false; // 시험: 고리를 멈추고 __ot.tick 으로
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    // 한 번 던져도 그림 고리는 살아 있게(안 그러면 화면이 통째로 멈춘다)
    try { if (!G.manual) { if (!G.paused) G.tick(dt); RND.render(); } } catch (e) { report(e); }
    requestAnimationFrame(loop);
  }
  // 개발 중(파일·로컬)에만: 오류가 나거나 주문 사이에서 멈추면 왼쪽 아래에 상태를 띄워 사진으로 받는다. 사이트에서는 안 뜬다.
  const LOCAL = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  function state() {
    const f = G.flow || {}, d = f.day;
    return ['ch' + G.save.ch, 'd' + G.save.day, 'i' + (d ? d.i + '/' + d.orders.length : '-'), 'paused ' + G.paused, 'lock ' + G.lock, 'station ' + (G.station === window.MAKE ? 'make' : G.station === window.PACK ? 'pack' : G.station === window.SHIP ? 'ship' : G.station ? 'etc' : 'none'), 'busy ' + (window.UI && UI.busy()), 'hidden ' + document.hidden].join(' | ');
  }
  function report(e) {
    if (!LOCAL) return;
    let el = document.getElementById('dbgBox');
    if (!el) { el = document.createElement('pre'); el.id = 'dbgBox'; el.style.cssText = 'position:fixed;left:6px;bottom:44px;z-index:99;max-width:70vw;max-height:40vh;overflow:hidden;background:#fff;color:#c00;font:12px/1.35 monospace;padding:6px 8px;border:2px solid #c00;white-space:pre-wrap;pointer-events:none'; document.body.appendChild(el); }
    if (!el.dataset.err || e) { el.textContent = (e ? String(e && e.stack || e).slice(0, 500) + '\n' : '주문 사이에서 멈춤\n') + state(); if (e) el.dataset.err = 1; }
  }
  if (LOCAL) {
    addEventListener('error', (e) => report(e.error || e.message));
    addEventListener('unhandledrejection', (e) => report(e.reason));
    // 주문이 안 뜬 채 8초: 하루 중인데 작업대도 창도 없음
    let idle = 0;
    setInterval(() => {
      const d = G.flow && G.flow.day, ov = [...document.querySelectorAll('.ov')].some((x) => !x.hidden), ph = document.getElementById('phone');
      idle = d && !G.manual && !G.station && !ov && !document.hidden && G.save.ch < 4 && !(ph && !ph.classList.contains('out')) ? idle + 1 : 0;
      if (idle >= 8) report(null);
    }, 1000);
  }

  // 창을 내리거나 다른 탭을 봐도 공장은 돈다. 숨기면 그림 고리가 서므로 일꾼 시계로 시간만 진행한다.
  // 1~3장 손 영업은 시계가 흐르면 손해라 공장(4장~)만, 컴퓨터가 잠들었던 시간은 치지 않는다.
  let hideLast = 0;
  function bgTick() {
    const now = performance.now();
    if (!document.hidden || G.manual) { hideLast = now; return; }
    const el = Math.min(65, (now - (hideLast || now)) / 1000); hideLast = now;
    if (G.paused || !(G.autoRunning && G.autoRunning())) return;
    for (let left = el; left > 0; left -= 0.05) G.tick(Math.min(0.05, left));
  }
  function startBgClock() {
    try {
      const url = URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},200)'], { type: 'text/javascript' }));
      new Worker(url).onmessage = bgTick;
    } catch (e) { setInterval(bgTick, 1000); }
  }

  G.boot = function () {
    MAKE.build();
    if (window.PACK) PACK.build();
    if (window.SHIP) SHIP.build();
    RND.focus(RND.ST.make, 0.2, 7.2);
    RND.applyCam(true);
    if (window.UI) UI.init();
    requestAnimationFrame(loop);
    startBgClock();
  };
})();
