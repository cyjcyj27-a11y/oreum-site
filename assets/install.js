// 홈 화면에 앱으로 설치 — 푸터의 "앱 설치" 단추
// 크롬(안드로이드·PC)은 설치 창을 바로 띄우고, 아이폰 사파리는 설치 창이 없어서 한 줄로 알려준다.
// 이미 앱으로 열려 있으면 단추를 안 보인다.
(function () {
  var btn = document.querySelector('.js-install');
  if (!btn) return;
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (standalone) return;
  var en = (document.documentElement.lang || '').slice(0, 2) === 'en';
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; btn.hidden = false; });
  window.addEventListener('appinstalled', function () { btn.hidden = true; deferred = null; });
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) btn.hidden = false;
  btn.addEventListener('click', function () {
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
