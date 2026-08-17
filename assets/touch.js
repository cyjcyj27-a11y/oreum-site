/* 오름 랩스 — 폰에서 PC용 게임을 조작하게 해주는 덧붙임
 *
 * 게임 코드를 다시 쓰지 않습니다. 화면 위에 조이스틱과 버튼을 얹고,
 * 그것을 게임이 이미 듣고 있는 키보드·마우스 사건으로 바꿔서 흘려보냅니다.
 * 그래서 PC에서는 이 파일이 아무 일도 하지 않습니다.
 *
 * 쓰는 법:
 *   OreumTouch.mount({
 *     stick:  { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD' },
 *     look:   true,                                  // 오른쪽 절반을 문지르면 시점
 *     lookScale: 1.4,
 *     buttons:[ {label:'공격', mouse:0},
 *               {label:'앉기', key:'ControlLeft', hold:true} ]
 *   });
 */
(function () {
  var COARSE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
               navigator.maxTouchPoints > 0;
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
    '.ot-look{position:absolute;inset:0;pointer-events:auto;}',
    '.ot-stick{position:absolute;left:16px;bottom:16px;width:132px;height:132px;',
      'border-radius:50%;background:rgba(255,255,255,.09);',
      'border:1px solid rgba(255,255,255,.22);pointer-events:auto;}',
    '.ot-knob{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;',
      'border-radius:50%;background:rgba(255,255,255,.34);',
      'border:1px solid rgba(255,255,255,.5);transition:background .1s;}',
    '.ot-btns{position:absolute;right:14px;bottom:14px;display:flex;flex-wrap:wrap-reverse;',
      'justify-content:flex-end;gap:9px;max-width:52vw;pointer-events:none;}',
    '.ot-btn{pointer-events:auto;min-width:62px;padding:14px 12px;border-radius:14px;',
      'background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);',
      'color:#fff;font:600 13px/1 system-ui,sans-serif;text-align:center;',
      'text-shadow:0 1px 3px rgba(0,0,0,.6);}',
    '.ot-btn:active,.ot-btn.on{background:rgba(255,255,255,.42);}',
    // 세로로 들면 게임 눈금이 화면 아래에 깔리므로 그만큼 띄웁니다
    '@media (orientation:portrait){.ot-layer[data-lift] .ot-stick,',
      '.ot-layer[data-lift] .ot-btns{bottom:var(--ot-lift);}}',
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
      lookPad.className = 'ot-look';
      var lid = null, lx = 0, ly = 0, scale = opts.lookScale || 1.4;
      lookPad.addEventListener('touchstart', function (e) {
        if (lid !== null) return;
        var t = e.changedTouches[0];
        lid = t.identifier; lx = t.clientX; ly = t.clientY;
        if (opts.onFirstTouch) { opts.onFirstTouch(); opts.onFirstTouch = null; }
        // 화면의 한 점을 그대로 겨누는 게임에는 좌표를 넘겨줍니다
        if (opts.onAimAt) opts.onAimAt(t.clientX, t.clientY);
        e.preventDefault();
      }, { passive: false });
      lookPad.addEventListener('touchmove', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier !== lid) continue;
          if (opts.onAimAt) opts.onAimAt(t.clientX, t.clientY);
          else look((t.clientX - lx) * scale, (t.clientY - ly) * scale);
          lx = t.clientX; ly = t.clientY;
        }
        e.preventDefault();
      }, { passive: false });
      function endLook(e) {
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
        var r = 46, d = Math.hypot(dx, dy);
        if (d > r) { dx = dx / d * r; dy = dy / d * r; }
        knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        var dead = 12;
        setKey(s.left,  dx < -dead);
        setKey(s.right, dx >  dead);
        setKey(s.up,    dy < -dead);
        setKey(s.down,  dy >  dead);
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

    // ── 동작 버튼 ─────────────────────────────────────
    if (opts.buttons && opts.buttons.length) {
      var box = document.createElement('div');
      box.className = 'ot-btns';
      opts.buttons.forEach(function (b) {
        var el = document.createElement('div');
        el.className = 'ot-btn';
        el.textContent = b.label;
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
