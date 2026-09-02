// 홈 화면에 앱으로 설치 — 푸터의 "앱 설치" 단추
// 크롬(안드로이드·PC)은 설치 창을 바로 띄우고, 아이폰 사파리는 설치 창이 없어서 한 줄로 알려준다.
// 이미 앱으로 열려 있으면 단추를 안 보인다.
(function () {
  var btn = document.querySelector('.js-install');
  if (!btn) return;
  // 집계: GA 이벤트 + Abacus 카운터. 설치(app_install)는 크롬만 알려주고, 앱으로 연 것(app_open)은 아이폰까지 잡힌다.
  function count(name, extra) {
    try { if (window.gtag) gtag('event', name, extra || {}); } catch (e) {}
    try { if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.protocol !== 'file:') fetch('https://abacus.jasoncameron.dev/hit/oreumgames/' + name).catch(function () {}); } catch (e) {}
  }
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) {
    try { var k = 'oreum_app_open_' + new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); if (!localStorage.getItem(k)) { localStorage.setItem(k, '1'); count('app_open'); } } catch (e) { count('app_open'); }
    return;
  }
  var en = (document.documentElement.lang || '').slice(0, 2) === 'en';
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; btn.hidden = false; });
  window.addEventListener('appinstalled', function () { btn.hidden = true; deferred = null; count('app_install'); });
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) btn.hidden = false;
  btn.addEventListener('click', function () {
    count('install_click', { method: deferred ? 'prompt' : 'ios_hint' });
    if (deferred) { deferred.prompt(); deferred = null; return; }
    toast(en ? 'Share \u2192 Add to Home Screen' : '\uacf5\uc720 \u2192 \ud648 \ud654\uba74\uc5d0 \ucd94\uac00');
  });
  function toast(text) {
    var old = document.getElementById('installToast'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'installToast'; d.textContent = text;
    d.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1f2a22;color:#fff;padding:12px 20px;border-radius:999px;font-size:16px;box-shadow:0 6px 24px rgba(0,0,0,.3);z-index:9999;white-space:nowrap';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 3500);
  }
})();
