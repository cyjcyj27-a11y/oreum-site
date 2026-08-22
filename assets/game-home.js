/* 오름게임즈 — 미니게임 왼쪽 위에 붙는 홈 링크.
 *
 * 쓰는 법: 게임 페이지 <head> 나 <body> 끝에 아래 한 줄을 넣습니다.
 *   <script src="/assets/game-home.js" defer></script>
 *
 * 게임마다 왼쪽 위에 이미 단추가 있으면 자리를 밀 수 있습니다.
 *   <script src="/assets/game-home.js" data-top="52" data-left="14" defer></script>
 *
 * 글이 위에서부터 흐르는 게임은 data-push 로 본문을 통째로 내릴 수 있습니다.
 *   <script src="/assets/game-home.js" data-push="40" defer></script>
 *
 * 왼쪽 아래에 '전체화면 보기' 단추를 붙이려면 data-fullscreen="1" 을 넣습니다.
 *   <script src="/assets/game-home.js" data-fullscreen="1" defer></script>
 *   (전체화면을 못 쓰는 브라우저 — 아이폰 사파리 등 — 에서는 아예 안 나옵니다.
 *    단추가 판을 가리지 않게, 게임 쪽에서 아래를 40px 쯤 비워 두세요)
 *
 * 루루냥(play.oreumgames.com)의 #gameHomeLink 와 같은 자리·같은 구실입니다.
 * 새 탭으로 열어서, 하던 게임이 날아가지 않게 합니다.
 */
(function () {
  'use strict';

  function init() {
    if (document.getElementById('oreumHome')) return;      // 두 번 붙지 않게

    var sc = document.querySelector('script[src*="game-home"]');
    var top  = (sc && sc.getAttribute('data-top'))  || '8';
    var left = (sc && sc.getAttribute('data-left')) || '10';
    var push = sc && sc.getAttribute('data-push');   // 본문을 그만큼 아래로 밀어 줍니다

    // 말은 문서 언어를 따르되, 주소에 ?lang= 이 있으면 그쪽이 우선입니다
    var ko = (document.documentElement.lang || 'ko').toLowerCase().indexOf('en') !== 0;
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en') ko = false;
      else if (q === 'ko') ko = true;
    } catch (e) {}

    var css = document.createElement('style');
    css.textContent =
      '#oreumHome{' +
        'position:fixed;z-index:2147483000;' +
        'top:calc(' + top + 'px + env(safe-area-inset-top));' +
        'left:calc(' + left + 'px + env(safe-area-inset-left));' +
        'display:inline-flex;align-items:center;gap:5px;' +
        'padding:5px 11px 5px 9px;border-radius:999px;text-decoration:none;' +
        /* 밝은 배경에도, 어두운 배경에도 읽히도록 하얀 알약에 테두리를 둡니다 */
        'background:rgba(255,253,247,.92);border:1px solid rgba(120,84,44,.24);' +
        'box-shadow:0 2px 8px rgba(0,0,0,.16);' +
        'font:700 11.5px/1 -apple-system,BlinkMacSystemFont,"Pretendard",' +
        '"Apple SD Gothic Neo","Malgun Gothic",sans-serif;' +
        'color:#2e6b39;white-space:nowrap;' +
        '-webkit-tap-highlight-color:transparent;touch-action:manipulation;' +
      '}' +
      '#oreumHome svg{width:17px;height:8px;display:block;fill:#4e8f4a}' +
      '#oreumHome:active{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18)}' +
      /* 화면이 아주 좁으면 글자는 빼고 오름 표시만 남깁니다 */
      '@media (max-width:340px){#oreumHome span{display:none}#oreumHome{padding:6px 8px}}' +
      /* 왼쪽 아래 전체화면 단추 — 홈 배지와 같은 옷을 입힙니다 */
      '#oreumFs{' +
        'position:fixed;z-index:2147483000;' +
        'bottom:calc(10px + env(safe-area-inset-bottom));' +
        'left:calc(' + left + 'px + env(safe-area-inset-left));' +
        'display:inline-flex;align-items:center;gap:5px;' +
        'padding:5px 11px 5px 9px;border-radius:999px;border:1px solid rgba(120,84,44,.24);' +
        'background:rgba(255,253,247,.92);box-shadow:0 2px 8px rgba(0,0,0,.16);' +
        'font:700 11.5px/1 -apple-system,BlinkMacSystemFont,"Pretendard",' +
        '"Apple SD Gothic Neo","Malgun Gothic",sans-serif;' +
        'color:#2e6b39;white-space:nowrap;cursor:pointer;opacity:.72;' +
        'transition:opacity .15s;' +
        '-webkit-tap-highlight-color:transparent;touch-action:manipulation;' +
      '}' +
      '#oreumFs:hover,#oreumFs:focus-visible{opacity:1}' +
      '#oreumFs svg{width:13px;height:13px;display:block;fill:none;' +
        'stroke:#4e8f4a;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
      '#oreumFs:active{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18)}';
    document.head.appendChild(css);

    // 글이 위에서부터 흐르는 게임은 배지에 가리지 않게 본문을 내립니다
    if (push) {
      var cur = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
      document.body.style.paddingTop = Math.max(cur, parseFloat(push)) + 'px';
    }

    var a = document.createElement('a');
    a.id = 'oreumHome';
    a.href = ko ? '/' : '/en/';
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', ko ? '오름게임즈 홈페이지' : 'Oreum Games home');
    a.innerHTML =
      '<svg viewBox="14 68 154 74" aria-hidden="true">' +
        '<mask id="oreumHomeCut">' +
          '<rect x="0" y="0" width="220" height="200" fill="#fff"/>' +
          '<ellipse cx="96" cy="77" rx="13" ry="4" fill="#000"/>' +
          '<path d="M32,117 C66,104 112,101 150,108" fill="none" stroke="#000"' +
                ' stroke-width="4.5" stroke-linecap="round"/>' +
        '</mask>' +
        '<g mask="url(#oreumHomeCut)">' +
          '<path d="M32,126 C44,112 62,86 76,78 L116,78 C130,86 144,110 150,126 Z"/>' +
          '<path d="M20,121 C62,110 124,108 160,116 C126,131 58,134 20,121 Z"/>' +
        '</g>' +
      '</svg>' +
      /* 글자는 언어와 상관없이 영문 브랜드로 고정한다 — 게임마다 달라 보이지 않게(2026-08-23 사용자) */
      '<span>OREUM GAMES</span>';
    document.body.appendChild(a);

    if (sc && sc.getAttribute('data-fullscreen') === '1') addFullscreen(ko);
  }

  /* ── 전체화면 보기 ──
   * 아이폰 사파리는 영상 말고는 전체화면을 못 합니다. 그럴 땐 단추를 아예 안 만듭니다.
   * (있는데 눌러도 아무 일이 없는 것이 제일 나쁩니다) */
  function addFullscreen(ko) {
    var root = document.documentElement;
    var ask  = root.requestFullscreen || root.webkitRequestFullscreen;
    var quit = document.exitFullscreen || document.webkitExitFullscreen;
    var can  = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (!ask || !quit || !can) return;

    var IN  = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"/></svg>';
    var OUT = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6"/></svg>';

    var b = document.createElement('button');
    b.id = 'oreumFs';
    b.type = 'button';
    document.body.appendChild(b);

    function on(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function paint(){
      var t = on() ? (ko ? '전체화면 끄기' : 'Exit full screen')
                   : (ko ? '전체화면'      : 'Full screen');
      b.innerHTML = (on() ? OUT : IN) + '<span>' + t + '</span>';
      b.setAttribute('aria-label', t);
    }
    paint();

    b.addEventListener('click', function () {
      try {
        var p = on() ? quit.call(document) : ask.call(root);
        if (p && p.catch) p.catch(function () {});   // 막히면 조용히 넘어갑니다
      } catch (e) {}
    });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, paint);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
