// 바탕화면(홈 화면)에 바로가기 만들기 — 푸터 단추
//
// 규칙 하나: **한 번 눌러서 끝나는 사람에게만 보여준다.**
//   · 크롬이 설치 창을 넘겨주면      → 단추를 보이고, 누르면 그 창이 바로 뜬다
//   · 아이폰(사파리)                → 설치 창이 없는 대신 "공유 → 홈 화면에 추가" 한 줄만
//   · 그 밖에(이미 깔림·파이어폭스 등) → 단추를 아예 감춘다
//
// ⚠ 2026-09-16: 한때 단추를 늘 보이게 하고 메뉴 찾아가는 3단계 안내를 띄웠다.
//    사장님: "이렇게 복잡하게 누가 설치하겠냐". 맞는 말이라 도로 걷어냈다.
//    단추가 안 보이던 진짜 원인은 매니페스트에 192px 아이콘이 없어서 크롬이
//    이 사이트를 설치 대상으로 안 봤던 것. 그건 고쳤다.
//
// 윈도우 크롬은 사용자가 한 번 지운 앱을 한동안 다시 권하지 않는다(모바일은 바로 다시 권함).
// 그 사람에겐 단추가 안 보이는데, 그게 맞다 — 이미 한 번 거절한 사람이다.
(function () {
  var btn = document.querySelector('.js-install');
  if (!btn) return;

  // 집계: GA 이벤트 + Abacus 카운터. 설치(app_install)는 크롬만 알려주고, 앱으로 연 것(app_open)은 아이폰까지 잡힌다.
  function count(name, extra) {
    try { if (window.gtag) gtag('event', name, extra || {}); } catch (e) {}
    try { if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.protocol !== 'file:') fetch('https://abacus.jasoncameron.dev/hit/oreumgames/' + name).catch(function () {}); } catch (e) {}
  }

  var en = (document.documentElement.lang || '').slice(0, 2) === 'en';

  // 바로가기로 연 창 — 단추를 감추고, 오늘 한 번만 센다
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) {
    try { var k = 'oreum_app_open_' + new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); if (!localStorage.getItem(k)) { localStorage.setItem(k, '1'); count('app_open'); } } catch (e) { count('app_open'); }
    return;
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  var ua = navigator.userAgent;
  var ios = /iphone|ipad|ipod/i.test(ua) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var touch = ios || /android/i.test(ua);
  var mac = /macintosh|mac os x/i.test(ua);
  var deferred = null;

  /* 단추 글자만 바꾼다 — 앞의 로고 그림은 그대로 둔다 */
  function setLabel(text) {
    for (var i = btn.childNodes.length - 1; i >= 0; i--) {
      var n = btn.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) { n.nodeValue = text; return; }
    }
    btn.appendChild(document.createTextNode(text));
  }
  var LBL_SHORTCUT = en ? 'Add a shortcut' : '바탕화면에 바로가기 만들기';
  var LBL_BOOKMARK = en ? 'Bookmark this site' : '즐겨찾기에 추가';

  // 크롬이 "설치할 수 있다"고 알려주면 바로가기 단추로
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; setLabel(LBL_SHORTCUT); btn.hidden = false;
  });
  window.addEventListener('appinstalled', function () {
    deferred = null; btn.hidden = true; count('app_install');
  });

  /* PC에서 설치 창을 못 받을 때(이미 만들었다 지웠거나, 파이어폭스 같은 브라우저)는
     즐겨찾기로 바꾼다 — Ctrl+D 한 번이면 끝난다(사장님 2026-09-16 "윈도우에선 즐겨찾기에 추가로 하면 어때?").
     ⚠ 즐겨찾기는 코드로 추가할 수 없다. 어느 브라우저도 허락하지 않는다 — 누를 키만 알려준다 */
  if (ios) { btn.hidden = false; }
  else if (!touch) { setLabel(LBL_BOOKMARK); btn.hidden = false; }

  btn.addEventListener('click', function () {
    count('install_click', { method: deferred ? 'prompt' : ios ? 'ios_hint' : 'bookmark' });
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (ios) return toast(en ? 'Share → Add to Home Screen' : '공유 → 홈 화면에 추가');
    toast(mac ? (en ? 'Press ⌘ + D' : '⌘ + D 를 누르세요')
              : (en ? 'Press Ctrl + D' : 'Ctrl + D 를 누르세요'));
  });

  function toast(text) {
    var old = document.getElementById('installToast'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'installToast'; d.textContent = text;
    d.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1f2a22;color:#fff;' +
      'padding:12px 20px;border-radius:18px;font-size:16px;line-height:1.6;box-shadow:0 6px 24px rgba(0,0,0,.3);' +
      'z-index:9999;max-width:min(420px, calc(100vw - 32px));text-align:center;word-break:keep-all';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 4000);
  }
})();
