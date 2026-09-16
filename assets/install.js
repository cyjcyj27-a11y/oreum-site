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
    if (en) return { done: 'Added. Look on your desktop or home screen.' }[kind];
    return { done: '만들었어요. 바탕화면을 보세요' }[kind];
  }

  /* 크롬이 설치 창을 안 줄 때 — 어디를 눌러야 하는지 차례대로 보여준다.
     ⚠ 예전에는 "주소창 오른쪽 설치 아이콘"이라고만 알려 줬는데, 그 아이콘은 안 보일 때가 많아
        무엇을 눌러야 할지 알 수 없었다(2026-09-16 사장님). 메뉴를 따라가는 길로 바꾼다 */
  function steps() {
    if (ios) return en
      ? ['Tap the Share button at the bottom', 'Choose "Add to Home Screen"', 'Tap Add']
      : ['아래 공유 단추(↑)를 누르세요', '‘홈 화면에 추가’를 고르세요', '오른쪽 위 ‘추가’를 누르세요'];
    if (android || samsung) return en
      ? ['Tap the ⋮ menu at the top right', 'Choose "Add to Home screen"', 'Tap Install or Add']
      : ['오른쪽 위 ⋮ 메뉴를 누르세요', '‘홈 화면에 추가’를 고르세요', '‘설치’ 또는 ‘추가’를 누르세요'];
    if (edge) return en
      ? ['Click the ⋯ menu at the top right', 'Apps → Install this site as an app', 'Click Install']
      : ['오른쪽 위 ⋯ 메뉴를 누르세요', '‘앱’ → ‘이 사이트를 앱으로 설치’', '‘설치’를 누르세요'];
    if (firefox || safariMac) return en
      ? ['This browser cannot add a shortcut', 'Open oreumgames.com in Chrome or Edge', 'Press this button again there']
      : ['이 브라우저는 바로가기를 못 만들어요', '크롬이나 엣지에서 oreumgames.com 을 여세요', '거기서 이 단추를 다시 누르세요'];
    return en
      ? ['Click the ⋮ menu at the top right', 'Cast, save and share → Install page as app', 'Click Install']
      : ['오른쪽 위 ⋮ 메뉴를 누르세요', '‘캐스트, 저장 및 공유’ → ‘페이지를 앱으로 설치’', '‘설치’를 누르세요'];
  }

  /* 이 브라우저에 이미 깔려 있는가 — 크롬이 알려준다(관련 앱 확인).
     윈도우에서 "지웠는데도 설치가 안 된다"는 말의 대부분은 크롬에 아직 남아 있는 경우다 */
  var installed = false;
  if (navigator.getInstalledRelatedApps) {
    try {
      navigator.getInstalledRelatedApps().then(function (apps) {
        installed = !!(apps && apps.length);
      }).catch(function () {});
    } catch (e) {}
  }

  btn.addEventListener('click', function () {
    count('install_click', { method: deferred ? 'prompt' : installed ? 'already' : 'hint' });
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (installed) {
      return how(en ? 'Already added' : '이미 만들어져 있어요',
        en ? ['It is on your desktop or Start menu', 'To remove it: chrome://apps → right-click → Remove',
              'After removing, reload this page to add it again']
           : ['바탕화면과 시작 메뉴에 있습니다',
              '지우려면 주소창에 chrome://apps → 오름게임즈 오른쪽 클릭 → ‘Chrome에서 삭제’',
              '지운 뒤 이 페이지를 새로고침하면 다시 만들 수 있습니다'], '');
    }
    how(en ? 'How to add a shortcut' : '바로가기 만드는 법', steps(),
        en ? 'If you already added it, look on your desktop or home screen.'
           : '이미 만들었다면 바탕화면에 있습니다.');
  });

  /* 차례를 보여주는 작은 창 — 게시판의 숫자 입력 창과 같은 모양 */
  function how(title, list, note) {
    var old = document.getElementById('howBox'); if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'howBox';
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(20,20,15,.45);display:flex;' +
      'align-items:center;justify-content:center;padding:20px';
    var card = document.createElement('div');
    card.style.cssText = 'width:min(380px,100%);background:#fffdf7;border:1px solid #e6dfcd;border-radius:16px;' +
      'box-shadow:0 14px 34px rgba(60,55,35,.18);padding:22px;font-size:16px;line-height:1.7;color:#1b2a1f;' +
      'font-family:inherit;text-align:left';
    var li = list.map(function (s, i) {
      return '<li style="margin:0 0 8px;padding-left:28px;position:relative">' +
        '<b style="position:absolute;left:0;top:0;width:20px;height:20px;border-radius:50%;background:#1b2a1f;' +
        'color:#fff;font-size:12px;line-height:20px;text-align:center">' + (i + 1) + '</b>' + s + '</li>';
    }).join('');
    card.innerHTML = '<p style="margin:0 0 14px;font-weight:800;font-size:18px">' + title + '</p>' +
      '<ol style="margin:0;padding:0;list-style:none">' + li + '</ol>' +
      (note ? '<p style="margin:14px 0 0;font-size:14px;color:#7d8a76">' + note + '</p>' : '') +
      '<p style="margin:18px 0 0;text-align:right"><button type="button" id="howOk" ' +
      'style="font:inherit;font-weight:700;background:#1b2a1f;color:#fff;border:0;border-radius:999px;' +
      'padding:9px 20px;cursor:pointer">' + (en ? 'OK' : '확인') + '</button></p>';
    box.appendChild(card);
    document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box) box.remove(); });
    card.querySelector('#howOk').addEventListener('click', function () { box.remove(); });
  }

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
