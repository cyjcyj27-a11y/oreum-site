// ─────────────────────────────────────────────────────────────
// 앱스(도구) 체류 시간 — 탭이 보이는 동안만 1분마다 셉니다.
//
// 넣는 법: 도구 페이지 맨 아래, 페이지뷰 세는 곳 다음에
//   <script src="/assets/app-time.js?v=1" data-app="pdfmerge" defer></script>
//
// Abacus 칸: app_minutes(도구 전체) · appmin_<이름>(도구별) · appstay_1m / _3m / _10m (그 시간을 넘긴 접속 수)
// 게임의 game-events.js 와 같은 방식이지만, 판 수·게임 이벤트 없이 시간만 셉니다.
// 넘는 순간마다 보내므로 탭을 그냥 닫아도 그때까지 잰 건 남습니다.
// ─────────────────────────────────────────────────────────────
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';
  var me = document.currentScript || {}, ds = me.dataset || {};
  var app = ds.app || location.pathname.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '_') || 'app';
  var base = 'https://abacus.jasoncameron.dev/hit/oreumgames/';
  function hit(k) { if (local) return; try { fetch(base + k, { mode: 'cors' }).catch(function () {}); } catch (e) {} }
  function ga(name, p) { try { if (window.gtag && !local) window.gtag('event', name, p); } catch (e) {} }

  var eng = 0, engAt = document.visibilityState === 'visible' ? Date.now() : 0, mins = 0, bi = 0;
  var BUCKETS = [[60, 'appstay_1m'], [180, 'appstay_3m'], [600, 'appstay_10m']];
  function engaged() { return eng + (engAt ? (Date.now() - engAt) / 1000 : 0); }
  function tick() {
    var sec = engaged();
    while (mins < Math.floor(sec / 60)) {
      mins++;
      hit('app_minutes'); hit('appmin_' + app);
      ga('app_minute', { app: app, minute: mins });
    }
    while (bi < BUCKETS.length && sec >= BUCKETS[bi][0]) { hit(BUCKETS[bi][1]); bi++; }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { if (!engAt) engAt = Date.now(); }
    else if (engAt) { eng += (Date.now() - engAt) / 1000; engAt = 0; }
    tick();
  });
  setInterval(tick, 5000);
})();
