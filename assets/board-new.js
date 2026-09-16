// ─────────────────────────────────────────────────────────────
// 커뮤니티에 새 글이 있으면 메뉴의 COMMUNITY 옆에 NEW 를 붙입니다.
//
// 기준: 맨 마지막 글이 24시간 안에 올라온 것일 때만 (사장님 2026-09-16 "24시간이내 새글한정")
//
// 넣는 법: 메뉴가 있는 페이지 맨 아래에
//   <script src="/assets/board-new.js?v=1" defer></script>
//
// 페이지를 열 때마다 게시판을 두드리지 않습니다 — 한 번 물어본 답을 브라우저에 10분 담아 둡니다.
// 게시판(/board/, /en/board/)에서는 이미 글이 보이므로 붙이지 않습니다.
// ─────────────────────────────────────────────────────────────
(function () {
  var URL_ = 'https://yefzzvtipsygqlvkaesx.supabase.co';
  var KEY = 'sb_publishable_qERx6ADFGxFDCjwc0O2cUg_b5EE6WPR';
  var CACHE = 'oreum_board_last';     // {at: 물어본 시각, iso: 마지막 글 시각}
  var SEEN = 'oreum_board_seen';      // 이 브라우저가 게시판을 마지막으로 본 시각
  var KEEP = 10 * 60 * 1000;          // 10분 동안은 다시 안 묻습니다
  var DAY = 24 * 60 * 60 * 1000;

  var onBoard = /^\/(en\/)?board\/?$/.test(location.pathname);

  /* 게시판에 들어오면 "봤다"고 적어 둔다 — 다음부터 그 글에는 NEW 를 안 붙인다
     (사장님 2026-09-16 "커뮤니티 가기 누르면 new표시가 없어지게"). 브라우저마다 따로 기억한다 */
  if (onBoard) {
    try { window.localStorage.setItem(SEEN, String(Date.now())); } catch (e) {}
    return;
  }

  var links = [].slice.call(document.querySelectorAll('.nav a[href$="/board/"]'));
  if (!links.length) return;

  function mark(iso) {
    if (!iso) return;
    var t = new Date(iso).getTime();
    if (Date.now() - t > DAY) return;
    var seen = 0;
    try { seen = +(window.localStorage.getItem(SEEN) || 0); } catch (e) {}
    if (seen && t <= seen) return;        // 그 글이 올라온 뒤로 이미 게시판에 다녀왔다
    links.forEach(function (a) {
      if (a.querySelector('.navnew')) return;
      var b = document.createElement('span');
      b.className = 'navnew';
      b.textContent = 'NEW';
      a.appendChild(b);
    });
  }

  var store = null;
  try { store = window.localStorage; } catch (e) {}
  if (store) {
    try {
      var c = JSON.parse(store.getItem(CACHE) || 'null');
      if (c && Date.now() - c.at < KEEP) { mark(c.iso); return; }
    } catch (e) {}
  }

  fetch(URL_ + '/rest/v1/posts?select=created_at&order=created_at.desc&limit=1',
        { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      var iso = rows && rows[0] && rows[0].created_at;
      if (store) { try { store.setItem(CACHE, JSON.stringify({ at: Date.now(), iso: iso || null })); } catch (e) {} }
      mark(iso);
    })
    .catch(function () {});
})();
