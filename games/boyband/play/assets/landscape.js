/* 오름게임즈 — 가로 보기 (2026-09-06)
 * "가로로 돌리기" 단추: 전체화면 → 가로 잠금을 시도하고, 폰이 말을 안 들으면(회전 잠금이 켜져 있거나 앱 안 브라우저)
 * 화면을 통째로 90도 돌려서 억지로 가로로 만든다. 게임 코드는 손대지 않는다 —
 * innerWidth/innerHeight, 터치·마우스 좌표, getBoundingClientRect 를 돌린 화면 기준으로 바꿔 주기 때문이다.
 *
 * 쓰는 법: <script src="/assets/landscape.js"></script> 를 게임 스크립트보다 먼저 넣고,
 *         가로로 돌리기 단추에서 OL.go() 를 부른다. 폰을 실제로 눕히면 저절로 풀린다. */
(function () {
  'use strict';
  var F = false;                                   // 강제 가로 켜짐
  var gW = Object.getOwnPropertyDescriptor(window, 'innerWidth'), gH = Object.getOwnPropertyDescriptor(window, 'innerHeight');
  var realW = function () { return gW && gW.get ? gW.get.call(window) : document.documentElement.clientWidth; };
  var realH = function () { return gH && gH.get ? gH.get.call(window) : document.documentElement.clientHeight; };
  try {
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: function () { return F ? realH() : realW(); } });
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: function () { return F ? realW() : realH(); } });
  } catch (e) { }
  // 좌표: 화면 (X, Y) → 돌린 문서 (x = Y, y = W - X)
  function patchXY(proto) {
    if (!proto) return;
    var cx = Object.getOwnPropertyDescriptor(proto, 'clientX'), cy = Object.getOwnPropertyDescriptor(proto, 'clientY');
    var px = Object.getOwnPropertyDescriptor(proto, 'pageX'), py = Object.getOwnPropertyDescriptor(proto, 'pageY');
    if (!cx || !cy) return;
    var RX = function (e) { return cx.get.call(e); }, RY = function (e) { return cy.get.call(e); };
    Object.defineProperty(proto, 'clientX', { configurable: true, get: function () { return F ? RY(this) : RX(this); } });
    Object.defineProperty(proto, 'clientY', { configurable: true, get: function () { return F ? realW() - RX(this) : RY(this); } });
    if (px && py) {
      Object.defineProperty(proto, 'pageX', { configurable: true, get: function () { return F ? RY(this) : px.get.call(this); } });
      Object.defineProperty(proto, 'pageY', { configurable: true, get: function () { return F ? realW() - RX(this) : py.get.call(this); } });
    }
    var mx = Object.getOwnPropertyDescriptor(proto, 'movementX'), my = Object.getOwnPropertyDescriptor(proto, 'movementY');
    if (mx && my) {
      Object.defineProperty(proto, 'movementX', { configurable: true, get: function () { return F ? my.get.call(this) : mx.get.call(this); } });
      Object.defineProperty(proto, 'movementY', { configurable: true, get: function () { return F ? -mx.get.call(this) : my.get.call(this); } });
    }
  }
  patchXY(window.MouseEvent && MouseEvent.prototype);
  patchXY(window.Touch && Touch.prototype);
  // 요소 자리: 돌린 화면의 네모 → 문서 기준 네모
  var gbcr = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    var r = gbcr.call(this); if (!F) return r;
    var W = realW(), x = r.top, y = W - r.right, w = r.height, h = r.width;
    return { x: x, y: y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: function () { return this; } };
  };
  var st = document.createElement('style');
  st.textContent = 'html.ol-land, html.ol-land body { overflow: hidden !important; } ' +
    'html.ol-land body { position: fixed !important; top: 0 !important; left: 0 !important; margin: 0 !important; width: 100vh !important; height: 100vw !important; transform-origin: 0 0 !important; transform: rotate(90deg) translateY(-100%) !important; } ' +
    'html.ol-land #rotate { display: none !important; }';
  document.head.appendChild(st);
  function set(on) {
    if (F === on) return; F = on;
    document.documentElement.classList.toggle('ol-land', on);
    document.body.classList.remove('portrait');
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 30);
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 400);
  }
  function portrait() { return realH() > realW() * 1.02; }
  var OL = {
    get forced() { return F; },
    force: function () { set(true); },
    release: function () { set(false); },
    // 단추에서 부른다: 전체화면 → 가로 잠금 → 그래도 세로면 강제 가로
    go: function () {
      var p = null;
      try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) p = document.documentElement.requestFullscreen(); } catch (e) { }
      var lock = function () { try { if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape'); } catch (e) { } return Promise.reject(); };
      var after = function () { setTimeout(function () { if (portrait()) set(true); }, 700); };
      (p && p.then ? p.then(lock, lock) : lock()).then(after, after);
    }
  };
  // 폰을 실제로 눕히면(진짜 가로) 강제 모드를 푼다
  addEventListener('resize', function () { if (F && !portrait()) set(false); });
  addEventListener('orientationchange', function () { setTimeout(function () { if (F && !portrait()) set(false); }, 300); });
  window.OL = OL;
})();
