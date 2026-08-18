/* 오름 랩스 — 폰에서 PC용 게임을 조작하게 해주는 덧붙임
 *
 * 게임 코드를 다시 쓰지 않습니다. 화면 위에 조이스틱과 버튼을 얹고,
 * 그것을 게임이 이미 듣고 있는 키보드·마우스 사건으로 바꿔서 흘려보냅니다.
 * 그래서 PC에서는 이 파일이 아무 일도 하지 않습니다.
 *
 * 쓰는 법:
 *   OreumTouch.mount({
 *     stick:  { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD' },
 *     look:   true,                                  // 화면을 문질러도 시점이 돌아감
 *     lookScale: 1.4,
 *     lookStick: true,                               // 오른쪽에 시점 스틱을 세움
 *     lookStickSpeed: 11,                            // 미는 동안 한 프레임에 도는 양
 *     buttons:[ {label:'공격', mouse:0},
 *               {label:'앉기', key:'ControlLeft', hold:true} ]
 *   });
 */
(function () {
  // 기기 판별은 한 가지만 믿지 않습니다 — 브라우저마다 답하는 게 다릅니다
  var COARSE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
               navigator.maxTouchPoints > 0 ||
               'ontouchstart' in window ||
               (navigator.msMaxTouchPoints > 0);
  window.OREUM_TOUCH = COARSE;

  window.OreumTouch = { mount: COARSE ? mount : function () {} };
  if (!COARSE) return;

  // ── 게임에 사건 흘려보내기 ─────────────────────────────
  // document 에 띄우면 window 에 붙은 것까지 같이 받습니다.
  function key(code, down) {
    var e = new KeyboardEvent(down ? 'keydown' : 'keyup',
      { code: code, key: code, bubbles: true, cancelable: true });
    document.dispatchEvent(e);
  }
  function mouse(type, button) {
    var e = new MouseEvent(type,
      { button: button, buttons: type === 'mousedown' ? (button === 2 ? 2 : 1) : 0,
        bubbles: true, cancelable: true });
    document.dispatchEvent(e);
  }
  function look(dx, dy) {
    var e = new MouseEvent('mousemove', { bubbles: true, cancelable: true });
    // movementX 는 읽기 전용이라 만들어 놓고 값을 얹습니다
    try {
      Object.defineProperty(e, 'movementX', { value: dx });
      Object.defineProperty(e, 'movementY', { value: dy });
    } catch (err) { return; }
    document.dispatchEvent(e);
  }

  var CSS = [
    '.ot-layer{position:fixed;inset:0;z-index:9999;pointer-events:none;',
      'touch-action:none;-webkit-user-select:none;user-select:none;}',
    '.ot-look{position:absolute;left:50%;right:0;top:0;bottom:0;pointer-events:auto;}',
    '.ot-look.ot-look-full{left:0;}',
    '.ot-stick{position:absolute;left:14px;bottom:16px;width:116px;height:116px;',
      'border-radius:50%;background:rgba(255,255,255,.09);',
      'border:1px solid rgba(255,255,255,.22);pointer-events:auto;}',
    '.ot-knob{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;',
      'border-radius:50%;background:rgba(255,255,255,.34);',
      'border:1px solid rgba(255,255,255,.5);transition:background .1s;}',
    // 오른쪽 시점 스틱 — 왼쪽 것과 같은 모양, 자리만 반대
    '.ot-stick-r{left:auto;right:14px;}',
    '.ot-btns{position:absolute;right:14px;bottom:14px;display:flex;flex-wrap:wrap-reverse;',
      'justify-content:flex-end;gap:9px;max-width:52vw;pointer-events:none;}',
    // 시점 스틱이 있으면 버튼을 그 위로 올립니다
    '.ot-layer[data-rstick] .ot-btns{max-width:46vw;gap:7px;}',
    '.ot-layer[data-rstick] .ot-stick-r{bottom:150px;}',
    '@media (orientation:portrait){.ot-layer[data-lift][data-rstick] .ot-stick-r{',
      'bottom:calc(var(--ot-lift) + 118px);}}',
    '.ot-btn{pointer-events:auto;min-width:56px;padding:11px 10px;border-radius:12px;',
      'background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);',
      'color:#fff;font:600 13px/1 system-ui,sans-serif;text-align:center;',
      'text-shadow:0 1px 3px rgba(0,0,0,.6);}',
    '.ot-btn:active,.ot-btn.on{background:rgba(255,255,255,.42);}',
    // 글씨 대신 그림을 넣는 버튼 — 정사각형으로 크게
    '.ot-btn.ot-icon{min-width:0;width:62px;height:62px;border-radius:16px;',
      'display:flex;align-items:center;justify-content:center;padding:0;}',
    '.ot-btn.ot-icon svg{display:block;width:30px;height:30px;',
      'filter:drop-shadow(0 1px 3px rgba(0,0,0,.6));}',
    // 세로로 들면 게임 눈금이 화면 아래에 깔리므로 그만큼 띄웁니다
    '@media (orientation:portrait){.ot-layer[data-lift] .ot-stick,',
      '.ot-layer[data-lift] .ot-btns{bottom:var(--ot-lift);}}',
    '@media (orientation:portrait){.ot-layer[data-lift] .ot-stick-r{bottom:var(--ot-lift);}}',
    // 버튼은 오른쪽 맨 아래로 — 그쪽 아래에는 게임 눈금이 없습니다
    '@media (orientation:portrait){.ot-layer[data-lift][data-rstick] .ot-btns{bottom:14px;}}',
    '@media (min-width:900px) and (pointer:fine){.ot-layer{display:none}}'
  ].join('');

  function mount(opts) {
    opts = opts || {};
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);

    var layer = document.createElement('div');
    layer.className = 'ot-layer';
    if (opts.liftPortrait) {
      layer.setAttribute('data-lift', '');
      layer.style.setProperty('--ot-lift', opts.liftPortrait + 'px');
    }

    // ── 시점: 조이스틱·버튼이 없는 곳을 문지르면 돌아갑니다 ──
    if (opts.look) {
      var lookPad = document.createElement('div');
      lookPad.className = 'ot-look' + (opts.lookFull ? ' ot-look-full' : '');
      var lid = null, lx = 0, ly = 0;
      var scale = opts.lookScale || 1.4;
      var scaleY = opts.lookScaleY || scale;
      // 손가락 두 개 — 벌리고 오므리는 만큼 게임에 전달합니다
      var pinch = null;
      lookPad.addEventListener('touchstart', function (e) {
        if (opts.onPinch && e.touches.length === 2) {
          lid = null;
          pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY);
          e.preventDefault(); return;
        }
        if (lid !== null) return;
        var t = e.changedTouches[0];
        lid = t.identifier; lx = t.clientX; ly = t.clientY;
        if (opts.onFirstTouch) { opts.onFirstTouch(); opts.onFirstTouch = null; }
        // 화면의 한 점을 그대로 겨누는 게임에는 좌표를 넘겨줍니다
        if (opts.onAimAt) opts.onAimAt(t.clientX, t.clientY);
        e.preventDefault();
      }, { passive: false });
      lookPad.addEventListener('touchmove', function (e) {
        if (opts.onPinch && e.touches.length === 2 && pinch !== null) {
          var d2 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                              e.touches[0].clientY - e.touches[1].clientY);
          if (d2 > 0) { opts.onPinch(d2 / pinch); pinch = d2; }
          e.preventDefault(); return;
        }
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier !== lid) continue;
          if (opts.onAimAt) opts.onAimAt(t.clientX, t.clientY);
          else look((t.clientX - lx) * scale, (t.clientY - ly) * scaleY);
          lx = t.clientX; ly = t.clientY;
        }
        e.preventDefault();
      }, { passive: false });
      function endLook(e) {
        if (e.touches.length < 2) pinch = null;
        for (var i = 0; i < e.changedTouches.length; i++)
          if (e.changedTouches[i].identifier === lid) lid = null;
      }
      lookPad.addEventListener('touchend', endLook);
      lookPad.addEventListener('touchcancel', endLook);
      // 시점 문지르기용 자리를 그냥 톡 치면 공격이 되게
      if (opts.tapButton !== undefined) {
        lookPad.addEventListener('click', function () {
          mouse('mousedown', opts.tapButton); setTimeout(function () { mouse('mouseup', opts.tapButton); }, 40);
        });
      }
      layer.appendChild(lookPad);
    }

    // ── 이동 조이스틱 ──────────────────────────────────
    if (opts.stick) {
      var s = opts.stick;
      var pad = document.createElement('div');
      pad.className = 'ot-stick';
      var knob = document.createElement('div');
      knob.className = 'ot-knob';
      pad.appendChild(knob);

      var sid = null, cx = 0, cy = 0, held = {};
      function setKey(code, want) {
        if (!code) return;
        if (want && !held[code]) { held[code] = 1; key(code, true); }
        else if (!want && held[code]) { held[code] = 0; key(code, false); }
      }
      function apply(dx, dy) {
        var r = 40, d = Math.hypot(dx, dy);
        if (d > r) { dx = dx / d * r; dy = dy / d * r; }
        knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        var dead = 12;
        setKey(s.left,  dx < -dead);
        setKey(s.right, dx >  dead);
        setKey(s.up,    dy < -dead);
        setKey(s.down,  dy >  dead);
        // 끝까지 밀면 달립니다 — 버튼 하나를 줄이려고 스틱에 얹었습니다
        if (s.run) setKey(s.run, Math.hypot(dx, dy) > r * 0.82);
      }
      function release() {
        sid = null;
        knob.style.transform = '';
        for (var c in held) setKey(c, false);
      }
      pad.addEventListener('touchstart', function (e) {
        var t = e.changedTouches[0], b = pad.getBoundingClientRect();
        sid = t.identifier; cx = b.left + b.width / 2; cy = b.top + b.height / 2;
        if (opts.onFirstTouch) { opts.onFirstTouch(); opts.onFirstTouch = null; }
        apply(t.clientX - cx, t.clientY - cy);
        e.preventDefault(); e.stopPropagation();
      }, { passive: false });
      pad.addEventListener('touchmove', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier !== sid) continue;
          apply(t.clientX - cx, t.clientY - cy);
        }
        e.preventDefault(); e.stopPropagation();
      }, { passive: false });
      pad.addEventListener('touchend', release);
      pad.addEventListener('touchcancel', release);
      layer.appendChild(pad);
    }

    // ── 시점 스틱 — 오른쪽. 미는 동안 계속 조금씩 돌아갑니다 ──
    if (opts.lookStick) {
      layer.setAttribute('data-rstick', '');
      var rpad = document.createElement('div');
      rpad.className = 'ot-stick ot-stick-r';
      var rknob = document.createElement('div');
      rknob.className = 'ot-knob';
      rpad.appendChild(rknob);

      var rid = null, rcx = 0, rcy = 0, nx = 0, ny = 0, raf = null;
      var lspeed = opts.lookStickSpeed || 12;

      function spin() {
        if (rid === null) { raf = null; return; }
        if (nx || ny) look(nx * lspeed, ny * lspeed);
        raf = requestAnimationFrame(spin);
      }
      function rapply(dx, dy) {
        var r = 40, d = Math.hypot(dx, dy);
        if (d > r) { dx = dx / d * r; dy = dy / d * r; }
        rknob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        var dead = 8;
        nx = Math.abs(dx) > dead ? dx / r : 0;
        ny = Math.abs(dy) > dead ? dy / r : 0;
      }
      function rrelease() {
        rid = null; nx = ny = 0; rknob.style.transform = '';
        if (raf) { cancelAnimationFrame(raf); raf = null; }
      }
      rpad.addEventListener('touchstart', function (e) {
        var t = e.changedTouches[0], b = rpad.getBoundingClientRect();
        rid = t.identifier; rcx = b.left + b.width / 2; rcy = b.top + b.height / 2;
        if (opts.onFirstTouch) { opts.onFirstTouch(); opts.onFirstTouch = null; }
        rapply(t.clientX - rcx, t.clientY - rcy);
        if (!raf) raf = requestAnimationFrame(spin);
        e.preventDefault(); e.stopPropagation();
      }, { passive: false });
      rpad.addEventListener('touchmove', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier !== rid) continue;
          rapply(t.clientX - rcx, t.clientY - rcy);
        }
        e.preventDefault(); e.stopPropagation();
      }, { passive: false });
      rpad.addEventListener('touchend', rrelease);
      rpad.addEventListener('touchcancel', rrelease);
      layer.appendChild(rpad);
    }

    // ── 동작 버튼 ─────────────────────────────────────
    if (opts.buttons && opts.buttons.length) {
      var box = document.createElement('div');
      box.className = 'ot-btns';
      opts.buttons.forEach(function (b) {
        var el = document.createElement('div');
        el.className = 'ot-btn' + (b.icon ? ' ot-icon' : '');
        // 그림 버튼도 무슨 버튼인지 읽어줄 수 있게 이름은 남깁니다
        if (b.icon) { el.innerHTML = b.icon; el.setAttribute('aria-label', b.label); el.title = b.label; }
        else el.textContent = b.label;
        function down(e) {
          e.preventDefault(); e.stopPropagation();
          if (opts.onFirstTouch) { opts.onFirstTouch(); opts.onFirstTouch = null; }
          el.classList.add('on');
          if (b.key) key(b.key, true);
          if (b.mouse !== undefined) mouse('mousedown', b.mouse);
          // 게임이 화면 안쪽 요소에서만 마우스를 듣는 경우엔 직접 부릅니다
          if (b.run) b.run();
          if (!b.hold) up2();
        }
        function up2() {
          el.classList.remove('on');
          if (b.key) key(b.key, false);
          if (b.mouse !== undefined) mouse('mouseup', b.mouse);
        }
        el.addEventListener('touchstart', down, { passive: false });
        el.addEventListener('touchend', function (e) { e.preventDefault(); if (b.hold) up2(); }, { passive: false });
        el.addEventListener('touchcancel', function () { if (b.hold) up2(); });
        box.appendChild(el);
      });
      layer.appendChild(box);
    }

    document.body.appendChild(layer);
    return layer;
  }
})();
