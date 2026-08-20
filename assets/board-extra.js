/* 게시판 덧붙임 — 사진 크게 보기 + 글마다 댓글(200자)
 *
 * 한글판(/board/)과 영문판(/en/board/)이 같이 씁니다.
 * 게시판 본문(board/index.html)에서 두 가지만 넘겨받습니다.
 *   window.OREUM_DB        : Supabase 연결
 *   BoardExtra.attach(el,id): 글 하나를 그릴 때마다 불러줍니다
 *
 * 댓글 표(post_comments)가 아직 없어도 게시판은 멀쩡히 돌아갑니다.
 * 그럴 땐 댓글 칸에 "준비 중" 한 줄만 조용히 뜹니다. (설치법: board-comments-setup.md)
 */
(function () {
  'use strict';

  var MAX = 200;        // 댓글 글자수
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;

  var T = EN ? {
    open:    'Comments',
    ph:      'Leave a comment (up to ' + MAX + ' characters)',
    nick:    'Name (optional)',
    pw:      '4 digits',
    send:    'Post',
    sending: 'Posting…',
    loading: 'Loading…',
    empty:   'No comments yet. Be the first.',
    notReady:'Comments are not set up yet.',
    failed:  'Could not load the comments.',
    anon:    'Anonymous',
    del:     'delete',
    askPw:   'Enter the 4 digits you used when posting',
    noDel:   'Could not delete',
    badPw:   'Those digits do not match',
    needBody:'Write a line first',
    tooLong: MAX + ' characters at most',
    badDigits:'Enter 4 digits — you will need them to delete this comment',
    failPost:'Could not post. Try again in a moment.',
    close:   'Close',
    justNow: 'just now', mAgo: 'm ago', hAgo: 'h ago'
  } : {
    open:    '댓글',
    ph:      '댓글을 남겨주세요 (' + MAX + '자까지)',
    nick:    '이름 (안 써도 돼요)',
    pw:      '숫자 4자리',
    send:    '올리기',
    sending: '올리는 중…',
    loading: '불러오는 중…',
    empty:   '아직 댓글이 없어요. 첫 댓글을 남겨보세요.',
    notReady:'댓글은 아직 준비 중이에요.',
    failed:  '댓글을 불러오지 못했어요.',
    anon:    '루루',
    del:     '지우기',
    askPw:   '댓글을 올릴 때 넣은 숫자 4자리를 입력하세요',
    noDel:   '지우지 못했어요',
    badPw:   '숫자가 맞지 않아요',
    needBody:'댓글을 적어주세요',
    tooLong: MAX + '자까지만 쓸 수 있어요',
    badDigits:'지울 때 쓸 숫자 4자리를 넣어주세요',
    failPost:'올리지 못했어요. 잠시 뒤 다시 시도해 주세요.',
    close:   '닫기',
    justNow: '방금', mAgo: '분 전', hAgo: '시간 전'
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function when(iso) {
    var t = new Date(iso), m = (Date.now() - t.getTime()) / 60000;
    if (m < 1) return T.justNow;
    if (m < 60) return Math.floor(m) + T.mAgo;
    if (m < 1440) return Math.floor(m / 60) + T.hAgo;
    return EN ? (t.getMonth() + 1) + '/' + t.getDate()
              : (t.getMonth() + 1) + '월 ' + t.getDate() + '일';
  }

  /* ══════════ 사진 크게 보기 ══════════
     목록의 사진은 잘려서 보입니다(object-fit: cover).
     눌러서 원본 전체를 보게 합니다. */
  var box = null;

  function lightbox(src) {
    if (!box) {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = '<img alt=""><button type="button" class="lb-close" aria-label="' +
                      esc(T.close) + '">✕</button>';
      box.addEventListener('click', function (e) {
        // 사진 자체를 눌렀을 때는 닫지 않습니다 (확대해서 보는 중일 수 있으니)
        if (e.target === box || e.target.className === 'lb-close') close();
      });
      document.body.appendChild(box);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && box.classList.contains('on')) close();
      });
    }
    box.querySelector('img').src = src;
    box.classList.add('on');
    document.body.style.overflow = 'hidden';       // 뒤 배경이 같이 스크롤되지 않게
  }

  function close() {
    if (!box) return;
    box.classList.remove('on');
    box.querySelector('img').src = '';
    document.body.style.overflow = '';
  }

  /* ══════════ 댓글 ══════════ */
  function db() { return window.OREUM_DB || null; }

  // 글마다 만들어둔 "개수 표시 함수"를 모아둔다 — prime() 이 한 번에 채워넣기 위해
  var counters = {};

  function commentRow(c, onGone) {
    var el = document.createElement('div');
    el.className = 'cmt';
    el.innerHTML =
      '<div class="cmt-top"><b>' + esc(c.nick || T.anon) + '</b>' +
      '<span class="cmt-ago">' + when(c.created_at) + '</span>' +
      (c.has_pw ? '<button type="button" class="cmt-del">' + esc(T.del) + '</button>' : '') +
      '</div><p class="cmt-body">' + esc(c.body) + '</p>';
    var d = el.querySelector('.cmt-del');
    if (d) d.addEventListener('click', function () {
      var pw = prompt(T.askPw);
      if (pw === null) return;
      db().rpc('delete_post_comment', { p_id: c.id, p_pw: String(pw).trim() })
        .then(function (r) {
          if (r.error) { alert(T.noDel); return; }
          if (r.data === true) { el.remove(); onGone(); }
          else alert(T.badPw);
        });
    });
    return el;
  }

  function attach(article, postId) {
    var shot = article.querySelector('.shot');
    if (shot) {
      shot.classList.add('zoomable');
      shot.addEventListener('click', function () { lightbox(shot.src); });
    }

    var wrap = document.createElement('div');
    wrap.className = 'cmts';
    wrap.innerHTML =
      '<button type="button" class="cmt-toggle">' + esc(T.open) + ' <i>·</i></button>' +
      '<div class="cmt-panel" hidden>' +
        '<div class="cmt-list"><p class="cmt-note">' + esc(T.loading) + '</p></div>' +
        '<form class="cmt-form">' +
          '<textarea rows="2" maxlength="' + MAX + '" placeholder="' + esc(T.ph) + '"></textarea>' +
          '<div class="cmt-line">' +
            '<input class="cmt-nick" type="text" maxlength="12" placeholder="' + esc(T.nick) + '">' +
            '<input class="cmt-pw" type="password" inputmode="numeric" maxlength="4" placeholder="' + esc(T.pw) + '">' +
            '<button type="submit" class="btn btn-primary cmt-send">' + esc(T.send) + '</button>' +
          '</div>' +
          '<p class="cmt-msg"></p>' +
        '</form>' +
      '</div>';
    article.appendChild(wrap);

    var toggle = wrap.querySelector('.cmt-toggle');
    var panel  = wrap.querySelector('.cmt-panel');
    var list   = wrap.querySelector('.cmt-list');
    var form   = wrap.querySelector('.cmt-form');
    var msg    = wrap.querySelector('.cmt-msg');
    var count  = toggle.querySelector('i');
    var loaded = false, n = 0;

    function setCount(v) {
      n = v;
      count.textContent = v > 0 ? v : '·';
      toggle.classList.toggle('has', v > 0);
    }
    counters[postId] = setCount;

    function note(text) { list.innerHTML = '<p class="cmt-note">' + esc(text) + '</p>'; }

    function load() {
      if (!db()) { note(T.notReady); return; }
      db().from('post_comments')
        .select('id,created_at,nick,body,has_pw')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100)
        .then(function (r) {
          if (r.error) { note(T.notReady); return; }   // 표가 아직 없을 때도 여기로 옵니다
          list.innerHTML = '';
          if (!r.data.length) { note(T.empty); setCount(0); return; }
          r.data.forEach(function (c) {
            list.appendChild(commentRow(c, function () { setCount(Math.max(0, n - 1)); }));
          });
          setCount(r.data.length);
        });
    }

    toggle.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      toggle.classList.toggle('open', open);
      if (open && !loaded) { loaded = true; load(); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ta = form.querySelector('textarea');
      var body = ta.value.trim();
      var nick = form.querySelector('.cmt-nick').value.trim();
      var pw   = form.querySelector('.cmt-pw').value.trim();
      msg.textContent = ''; msg.className = 'cmt-msg';

      function bad(t) { msg.textContent = t; msg.className = 'cmt-msg bad'; }
      if (!body) return bad(T.needBody);
      if (body.length > MAX) return bad(T.tooLong);
      if (!/^[0-9]{4}$/.test(pw)) return bad(T.badDigits);
      if (!db()) return bad(T.notReady);

      var send = form.querySelector('.cmt-send');
      send.disabled = true; msg.textContent = T.sending;

      db().rpc('create_post_comment', {
        p_post: postId, p_nick: nick || null, p_body: body, p_pw: pw
      }).then(function (r) {
        send.disabled = false;
        if (r.error) { bad(T.failPost); return; }
        msg.textContent = '';
        ta.value = ''; form.querySelector('.cmt-pw').value = '';
        var fresh = { id: r.data, created_at: new Date().toISOString(),
                      nick: nick, body: body, has_pw: true };
        if (list.querySelector('.cmt-note')) list.innerHTML = '';
        list.appendChild(commentRow(fresh, function () { setCount(Math.max(0, n - 1)); }));
        setCount(n + 1);
      });
    });
  }

  /* 목록에 뜬 글들의 댓글 수를 한 번의 조회로 미리 채운다.
     이게 없으면 댓글창을 눌러서 열기 전까지 개수가 '·' 로만 남아,
     댓글 1개 있는 글과 없는 글이 똑같아 보인다. */
  function prime(ids) {
    if (!db() || !ids || !ids.length) return;
    db().from('post_comments')
      .select('post_id')
      .in('post_id', ids)
      .limit(2000)
      .then(function (r) {
        if (r.error || !r.data) return;      // 표가 아직 없으면 조용히 넘어간다
        var tally = {};
        r.data.forEach(function (c) { tally[c.post_id] = (tally[c.post_id] || 0) + 1; });
        ids.forEach(function (id) {
          var f = counters[id];
          if (f) f(tally[id] || 0);
        });
      });
  }

  window.BoardExtra = { attach: attach, prime: prime };

  // 게시판 본체는 이 파일보다 먼저 글을 그릴 수 있다. 그때 못 붙인 것을
  // 뒤늦게라도 붙일 수 있게, 준비가 끝났다고 알린다.
  try { window.dispatchEvent(new Event('boardextra')); } catch (e) {}
})();
