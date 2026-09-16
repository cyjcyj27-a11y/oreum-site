// 바탕화면(홈 화면)에 바로가기 만들기 — 푸터 단추
//
// 단추는 늘 보인다(2026-09-16 사장님 "항상 보이게 하고 안내 뜨게 해줘").
//   · 크롬이 설치 신호를 보내 주면  → 설치 창을 바로 띄운다
//   · 신호가 없으면(이미 설치했거나, 파이어폭스·사파리처럼 설치를 지원 안 하면)
//                                → 그 브라우저에서 어떻게 하는지 한 줄로 알려준다
// 앱 창으로 열려 있으면 단추를 감춘다(이미 바로가기로 들어온 사람이다).
//
// ⚠ 크롬은 '이미 설치된 사이트'에는 beforeinstallprompt 를 다시 보내지 않는다.
//    그래서 예전에는 한 번 설치한 사람에게 단추가 영영 안 보였다.
(function () {
  var btn = document.querySelector('.js-install');
  if (!btn) return;

  // 집계: GA 이벤트 + Abacus 카운터. 설치(app_install)는 크롬만 알려주고, 앱으로 연 것(app_open)은 아이폰까지 잡힌다.
  function count(name, extra) {
    try { if (window.gtag) gtag('event', name, extra || {}); } catch (e) {}
    try { if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.protocol !== 'file:') fetch('https://abacus.jasoncameron.dev/hit/oreumgames/' + name).catch(function () {}); } catch (e) {}
  }

  var en = (document.documentElement.lang || '').slice(0, 2) === 'en';

  /* 바로가기로 연 창에서는 같은 자리에서 "지우는 법"을 알려준다 —
     언제든 만들었다 지웠다 할 수 있게(사장님 2026-09-16 "언제든지 깔았다 지웠다할수있께 만들어") */
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) {
    try { var k = 'oreum_app_open_' + new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); if (!localStorage.getItem(k)) { localStorage.setItem(k, '1'); count('app_open'); } } catch (e) { count('app_open'); }
    setLabel(en ? 'Remove this shortcut' : '바로가기 지우기');
    btn.hidden = false;
    btn.addEventListener('click', function () {
      count('uninstall_hint');
      var touch = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      if (en) return toast(touch ? 'Press and hold the icon on your home screen → Remove'
                                 : 'Top right ⋮ menu → Uninstall Oreum Games');
      toast(touch ? '홈 화면 아이콘을 길게 누르고 삭제를 고르세요'
                  : '창 오른쪽 위 ⋮ 메뉴 → ‘오름게임즈 제거’');
    });
    return;
  }

  /* 단추 글자만 바꾼다 — 앞의 로고 그림은 그대로 둔다 */
  function setLabel(text) {
    for (var i = btn.childNodes.length - 1; i >= 0; i--) {
      var n = btn.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = text; return; }
    }
    btn.appendChild(document.createTextNode(text));
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  var deferred = null;
  btn.hidden = false;                                   // 늘 보인다
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; btn.hidden = false; });
  window.addEventListener('appinstalled', function () { deferred = null; count('app_install'); toast(msg('done')); });

  var ua = navigator.userAgent;
  var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var android = /android/i.test(ua);
  var samsung = /samsungbrowser/i.test(ua);
  var firefox = /firefox|fxios/i.test(ua);
  var edge = /edg\//i.test(ua);
  var chrome = /chrome|crios/i.test(ua) && !edge;
  var safariMac = !ios && /safari/i.test(ua) && !/chrome|chromium|edg\//i.test(ua);

  function msg(kind) {
    if (en) {
      return {
        ios:     'Share → Add to Home Screen',
        android: 'Browser menu → Add to Home screen',
        desktop: 'Click the install icon at the right of the address bar',
        none:    'This browser cannot add a shortcut. Try Chrome or Edge.',
        done:    'Added. Look on your desktop or home screen.'
      }[kind];
    }
    return {
      ios:     '공유 → 홈 화면에 추가',
      android: '브라우저 메뉴 → 홈 화면에 추가',
      desktop: '주소창 오른쪽 설치 아이콘을 누르세요. 이미 만들었다면 바탕화면에 있습니다',
      none:    '이 브라우저는 바로가기를 만들 수 없어요. 크롬·엣지에서 열어 주세요',
      done:    '만들었어요. 바탕화면을 보세요'
    }[kind];
  }

  btn.addEventListener('click', function () {
    count('install_click', { method: deferred ? 'prompt' : 'hint' });
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (ios) return toast(msg('ios'));
    if (android || samsung) return toast(msg('android'));
    if (chrome || edge) return toast(msg('desktop'));
    if (firefox || safariMac) return toast(msg('none'));
    toast(msg('desktop'));
  });

  function toast(text) {
    var old = document.getElementById('installToast'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'installToast'; d.textContent = text;
    d.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1f2a22;color:#fff;' +
      'padding:12px 20px;border-radius:18px;font-size:16px;line-height:1.6;box-shadow:0 6px 24px rgba(0,0,0,.3);' +
      'z-index:9999;max-width:min(420px, calc(100vw - 32px));text-align:center;word-break:keep-all';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 4500);
  }
})();
