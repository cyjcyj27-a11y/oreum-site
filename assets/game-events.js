// ─────────────────────────────────────────────────────────────
// 게임 실행 페이지 공통 집계 — 페이지뷰·세션(Abacus) + 게임 시작/종료/재시작(GA4)
//
// 넣는 법: 실행 페이지(play/index.html) 맨 아래, visit.js 다음에
//   <script src="/assets/game-events.js?v=1" defer></script>
// 옵션(script 태그 속성):
//   data-abacus="0"  이 페이지가 이미 자체적으로 페이지뷰·세션을 세면(루루냥) 그 둘만 끕니다 (판 수는 셉니다)
//   data-auto="0"    단추 글자·게임오버 창을 보고 자동으로 짐작하는 기능을 끕니다
//
// 게임 코드에서 직접 부르면 가장 정확합니다 (없으면 아래 자동 감지가 대신 짐작):
//   OG.start()                         한 판 시작 (재시작도 이걸 부르면 됩니다 — 알아서 game_restart 도 보냄)
//   OG.over({ result: 'WIN', score: 3 })  한 판 끝
//
// GA4 이벤트: game_start · game_restart · game_over  (매개변수 game, round, duration_sec, result, score, auto)
//   "한 사람이 몇 판" = game_start 수 ÷ 사용자 수. GA4 → 탐색 → 자유 형식에서 이벤트 수/활성 사용자로 봅니다.
//   매개변수를 표에 쓰려면 GA4 관리 → 맞춤 정의 → 이벤트 매개변수 game, round, result 를 등록합니다.
// Abacus 키: pageviews · game_session · pv_game_<게임> · game_open(하루 1회) · game_rounds · rounds_<게임> · game_overs
//            game_minutes · min_<게임> (화면을 보고 있는 1분마다 1) · play_1m/3m/10m/30m/1h/2h (그 시간을 넘긴 접속 수)
// ─────────────────────────────────────────────────────────────
(function () {
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';
  var mm = location.pathname.match(/\/games\/(?:mini\/)?([^\/]+)/);
  var game = mm ? mm[1] : location.pathname.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '_') || 'home';
  var me = document.currentScript || {}; var ds = me.dataset || {};
  var useAbacus = ds.abacus !== '0', useAuto = ds.auto !== '0';
  var base = 'https://abacus.jasoncameron.dev/hit/oreumgames/';
  function hit(k) { if (local) return; try { fetch(base + k, { mode: 'cors' }).catch(function () {}); } catch (e) {} }
  function ga(name, p) { try { if (window.gtag && !local) window.gtag('event', name, p); } catch (e) {} }
  function ymd() { return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); }
  function onceToday(flag, key) {
    try { if (localStorage.getItem(flag) === ymd()) return; localStorage.setItem(flag, ymd()); } catch (e) { return; }
    hit(key);
  }

  // ── 페이지뷰·세션: 열 때마다 (새로고침·재접속 포함) ──
  hit('pv_game_' + game);   // 게임별 접속 (지표 페이지 '게임별' 표의 분모)
  if (useAbacus) { hit('pageviews'); hit('game_session'); onceToday('g_open', 'game_open'); }   // game_open: 오늘 게임을 연 브라우저 (루루냥과 같은 표시)

  // ── 판 단위 ──
  var S = { state: 'idle', round: 0, t0: 0, last: 0, manual: false };
  function start(extra, auto) {
    var now = Date.now();
    if (S.state === 'play' && now - S.last < 1500) return;   // 겹쳐 눌린 것
    var again = S.round > 0; S.round++; S.state = 'play'; S.t0 = now; S.last = now;
    var p = { game: game, round: S.round, auto: auto ? 1 : 0 }; if (extra) for (var k in extra) p[k] = extra[k];
    ga('game_start', p); if (again) ga('game_restart', p);
    hit('game_rounds'); hit('rounds_' + game);
  }
  function over(extra, auto) {
    if (S.state !== 'play') return;
    S.state = 'over';
    var p = { game: game, round: S.round, duration_sec: Math.round((Date.now() - S.t0) / 1000), auto: auto ? 1 : 0 }; if (extra) for (var k in extra) p[k] = extra[k];
    ga('game_over', p); hit('game_overs');
  }
  window.OG = {
    start: function (e) { S.manual = true; start(e, false); },
    restart: function (e) { S.manual = true; start(e, false); },
    over: function (e) { S.manual = true; over(e, false); },
    state: S, game: game,
  };

  // ── 체류 시간: 탭이 보이는 동안만 잰다. 1분마다 게임별 분(min_<게임>)과 전체 분(game_minutes)을 세고,
  //    1분·3분·10분·30분·1시간·2시간을 넘는 순간 그 칸을 한 번 센다 (접속 단위라 접속 수로 나누면 비율).
  //    닫힐 때 한꺼번에 보내지 않고 넘는 순간마다 보내므로, 탭을 그냥 닫아도 그때까지 잰 건 남는다.
  var eng = 0, engAt = document.visibilityState === 'visible' ? Date.now() : 0, mins = 0, bi = 0;
  var BUCKETS = [[60, 'play_1m'], [180, 'play_3m'], [600, 'play_10m'], [1800, 'play_30m'], [3600, 'play_1h'], [7200, 'play_2h']];
  function engaged() { return eng + (engAt ? (Date.now() - engAt) / 1000 : 0); }
  function tickDwell() {
    var sec = engaged();
    while (mins < Math.floor(sec / 60)) { mins++; hit('game_minutes'); hit('min_' + game); ga('play_minute', { game: game, minute: mins }); }
    while (bi < BUCKETS.length && sec >= BUCKETS[bi][0]) { if (useAbacus || bi >= 3) hit(BUCKETS[bi][1]); bi++; }   // 루루냥은 1·3·10분을 자체로 세니 30분부터만
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { if (!engAt) engAt = Date.now(); }
    else if (engAt) { eng += (Date.now() - engAt) / 1000; engAt = 0; }
    tickDwell();
  });
  setInterval(tickDwell, 5000);

  // ── 자동 감지: 게임 코드가 OG 를 안 부르는 페이지용 ──
  // 단추 글자가 START/시작/RETRY/다시하기/한 번 더 이면 한 판 시작으로,
  // id·class 에 over/result/end/clear 가 들어간 창이 새로 보이면(그 안에 GAME OVER·CLEAR·점수 같은 글자가 있을 때) 한 판 끝으로 짐작합니다.
  if (!useAuto) return;
  var RE_START = /^(start|play|go|start work|시작|게임 ?시작|시작하기|플레이|출발|작업 ?시작( ?클릭)?|들어가기|입장|도전|도전하기)$/i;
  var RE_RETRY = /^(retry|replay|again|restart|one more|continue|next|다시 ?하기|다시|재시작|한 ?번 ?더|다시 ?시작|다시 ?도전|재도전|계속|이어 ?하기|처음부터|다음 ?(판|스테이지)?)$/i;
  document.addEventListener('click', function (e) {
    if (S.manual) return;
    // 누른 곳에서 위로 다섯 단계까지 올라가며 글자를 본다 (span 안의 글자, 아이콘만 있는 안쪽 요소 등)
    var el = e.target;
    for (var i = 0; i < 5 && el && el.nodeType === 1 && el !== document.body; i++, el = el.parentElement) {
      var t = (el.textContent || '').replace(/[^\w가-힣 ]/g, ' ').replace(/\s+/g, ' ').trim();
      if (t.length > 14) break; if (!t) continue;
      if (RE_START.test(t) || RE_RETRY.test(t)) { start(null, true); return; }
    }
  }, true);
  // 시작 단추가 없는 게임(바로 시작되는 퍼즐 등): 첫 조작(키·터치)을 한 판 시작으로 본다
  function firstTouch() { if (S.round === 0 && !S.manual) start(null, true); }
  document.addEventListener('keydown', firstTouch, true); document.addEventListener('pointerdown', firstTouch, true);
  var RE_ID = /(over|result|ending|death|dead|clear|finish|win|lose|end)/i;
  var RE_TXT = /(game ?over|게임 ?오버|full ?time|clear|클리어|result|결과|score|점수|win|lose|draw|성공|실패|끝)/i;
  var cands = null, timer = 0;
  function visible(el) { if (!el.isConnected) return false; var cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && el.offsetWidth > 0 && el.offsetHeight > 0; }
  function collect() {
    cands = [];
    var all = document.querySelectorAll('[id],[class]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i], idc = (el.id || '') + ' ' + (typeof el.className === 'string' ? el.className : '');
      if (!RE_ID.test(idc) || !el.children.length) continue;
      if (!RE_TXT.test(el.textContent || '')) continue;
      if (el.__ogVis === undefined) el.__ogVis = visible(el);   // 이미 아는 창은 예전 상태를 지킨다 (점수 글자가 바뀔 때마다 다시 모으므로)
      cands.push(el);
    }
  }
  function scan() {
    timer = 0;
    if (!cands) collect();
    for (var i = 0; i < cands.length; i++) { var el = cands[i], v = visible(el); if (v && !el.__ogVis && !S.manual && S.state === 'play') over(null, true); el.__ogVis = v; }
  }
  function schedule() { if (!timer) timer = setTimeout(scan, 120); }
  function boot() {
    collect();
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) if (list[i].type === 'childList') { cands = null; break; }
      schedule();
    }).observe(document.body, { attributes: true, attributeFilter: ['class', 'style', 'hidden'], childList: true, subtree: true });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
