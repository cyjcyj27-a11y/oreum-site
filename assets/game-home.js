/* 오름게임즈 — 미니게임 왼쪽 위에 붙는 홈 링크.
 *
 * 알약 폭 약 93px, 왼쪽 위 구석에 바짝. (2026-08-24 로고를 빼고 글자도 줄였다 — 게임 제목을 가려서)
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
    var top  = (sc && sc.getAttribute('data-top'))  || '4';
    var left = (sc && sc.getAttribute('data-left')) || '4';
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
        'display:inline-flex;align-items:center;' +
        'padding:3px 8px;border-radius:999px;text-decoration:none;' +
        /* 밝은 배경에도, 어두운 배경에도 읽히도록 하얀 알약에 테두리를 둡니다 */
        'background:rgba(255,253,247,.92);border:1px solid rgba(120,84,44,.24);' +
        'box-shadow:0 2px 8px rgba(0,0,0,.16);' +
        'font:700 10px/1 -apple-system,BlinkMacSystemFont,"Pretendard",' +
        '"Apple SD Gothic Neo","Malgun Gothic",sans-serif;' +
        'color:#2e6b39;white-space:nowrap;' +
        '-webkit-tap-highlight-color:transparent;touch-action:manipulation;' +
      '}' +
      '#oreumHome:active{background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.18)}' +
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
    /* 글자는 언어와 상관없이 영문 브랜드로 고정한다 — 게임마다 달라 보이지 않게(2026-08-23 사용자) */
    a.innerHTML = '<span>OREUM GAMES</span>';
    document.body.appendChild(a);

    if (sc && sc.getAttribute('data-fullscreen') === '1') addFullscreen(ko);
    inAppFix(ko);
  }

  /* ── 앱 안 브라우저(카카오톡·인스타·페북·네이버·라인) ──
   * 이 브라우저들은 전체화면과 가로 고정 기능이 없다. 가로 전용 게임은 "가로로 돌려 주세요" 안내에서
   * 단추를 눌러도 아무 일이 안 생겨 시작을 못 한다(2026-09-03 카톡에서 확인).
   * 그래서 (1) 가로 안내의 단추를 "크롬으로 열기"로 바꾸고 (2) 위쪽에 얇은 안내 띠를 붙인다.
   * 시험: PC 에서 ?inapp=1 을 붙이면 같은 화면을 볼 수 있다. */
  function inAppFix(ko) {
    var ua = navigator.userAgent || '';
    var force = /[?&]inapp=1/.test(location.search);
    var kakao = /KAKAOTALK/i.test(ua);
    var inApp = kakao || /Instagram|FBAN|FBAV|FB_IAB|NAVER\(inapp|Line\/|DaumApps|everytimeApp|Whale.*inapp/i.test(ua);
    var noFs = !(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    var mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    if (!force && !(mobile && (inApp || noFs))) return;
    var android = /Android/i.test(ua) || force;
    var url = location.href;
    var open = kakao ? 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url)
             : android ? 'intent://' + location.host + location.pathname + location.search + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(url) + ';end'
             : 'x-safari-' + url;
    var label = android || kakao ? (ko ? '크롬으로 열기' : 'Open in Chrome') : (ko ? '사파리로 열기' : 'Open in Safari');
    function go(e) { if (e) { e.preventDefault(); e.stopPropagation(); } try { location.href = open; } catch (err) {} }

    // (1) 가로 안내 단추가 있는 게임(메이킹김치·야간자율학습·SAAB): 단추를 바꿔치기
    var rg = document.getElementById('rotGo');
    if (rg) {
      rg.textContent = label;
      rg.addEventListener('click', go, true);
      var h = document.getElementById('rotHint');
      if (h) h.textContent = ko ? '앱 안 브라우저에서는 전체화면이 안 됩니다. 크롬으로 열거나, 폰을 옆으로 돌려 주세요.' : 'In-app browsers cannot go fullscreen. Open in Chrome, or turn your phone sideways.';
    }
    // (2) 모든 게임: 위쪽 안내 띠
    var bar = document.createElement('div');
    bar.id = 'oreumInApp';
    bar.setAttribute('style', 'position:fixed;left:0;right:0;top:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 12px calc(8px + env(safe-area-inset-top));padding-top:calc(8px + env(safe-area-inset-top));background:rgba(20,26,20,.92);color:#fff;font:600 13px/1.3 -apple-system,"Malgun Gothic",sans-serif;pointer-events:auto');
    bar.innerHTML = '<span>' + (ko ? '앱 안에서는 가로 화면이 안 됩니다' : 'Landscape mode is unavailable in this in-app browser') + '</span>' +
      '<a href="' + open.replace(/"/g, '&quot;') + '" style="flex:none;background:#7fbf4d;color:#0f2a12;text-decoration:none;font-weight:800;padding:7px 12px;border-radius:999px">' + label + '</a>' +
      '<button type="button" aria-label="close" style="flex:none;background:none;border:0;color:#fff;font-size:18px;line-height:1;padding:0 4px">×</button>';
    bar.querySelector('a').addEventListener('click', go);
    bar.querySelector('button').addEventListener('click', function () { bar.remove(); });
    document.body.appendChild(bar);
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
