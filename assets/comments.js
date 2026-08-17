/* 오름 랩스 — 미니게임 소감 한마디
 *
 * 페이지 안의 [data-comments="게임폴더이름"] 을 전부 찾아 각각 댓글창을 만듭니다.
 * 저장소는 홈페이지 게시판과 같은 Supabase를 씁니다 (표만 labs_comments 로 따로).
 * 규칙상 댓글창은 미니게임에만 답니다. 게임이 아닌 실험에는 data-comments 를 넣지 않습니다.
 */
(function () {
  // 공개되어도 안전한 값입니다. 실제 권한은 서버 쪽 규칙(RLS)이 지킵니다.
  var SUPABASE_URL = 'https://yefzzvtipsygqlvkaesx.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qERx6ADFGxFDCjwc0O2cUg_b5EE6WPR';

  var MAX = 200;        // 소감 글자수
  var SHOW = 20;        // 한 번에 보여줄 소감 수

  // 영문판(/en/)에서도 같은 표를 쓰되 말만 바꿉니다
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var T = EN ? {
    lead:   'Tell me how it played — I read every one, and it shapes what I fix next.',
    ph:     'How did it play? (up to ' + MAX + ' characters)',
    nick:   'Name (optional)',
    pw:     '4 digits',
    send:   'Post',
    loading:'Loading…',
    empty:  'No notes yet. Be the first.',
    failed: 'Could not load the notes.',
    anon:   'Anonymous',
    del:    'delete',
    askPw:  'Enter the 4 digits you used when posting',
    noDel:  'Could not delete',
    badPw:  'Those digits do not match',
    needBody:'Write a line first',
    tooLong: MAX + ' characters at most',
    badDigits:'Use 4 digits (or leave it blank)',
    offline:'Cannot post right now. Try again in a moment.',
    posting:'Posting…',
    thanks: 'Posted. Thank you!',
    failPost:'Could not post. Try again in a moment.',
    ago:    ['just now', 'm ago', 'h ago']
  } : {
    lead:   '소감 한마디 남겨주시면 게임에 반영하겠습니다.',
    ph:     '플레이해본 소감 한마디 (' + MAX + '자까지)',
    nick:   '이름 (안 써도 됩니다)',
    pw:     '숫자 4자리',
    send:   '남기기',
    loading:'불러오는 중…',
    empty:  '아직 소감이 없습니다. 첫 한마디를 남겨주세요.',
    failed: '소감을 불러오지 못했습니다.',
    anon:   '이름 없음',
    del:    '지우기',
    askPw:  '소감을 남길 때 넣은 숫자 4자리를 입력하세요',
    noDel:  '지우지 못했습니다',
    badPw:  '숫자가 맞지 않습니다',
    needBody:'한마디를 적어주세요',
    tooLong: MAX + '자까지만 쓸 수 있습니다',
    badDigits:'숫자 4자리로 넣어주세요 (비워둬도 됩니다)',
    offline:'지금은 남길 수 없습니다. 잠시 뒤 다시 해주세요.',
    posting:'올리는 중…',
    thanks: '남겼습니다. 고맙습니다!',
    failPost:'올리지 못했습니다. 잠시 뒤 다시 해주세요.',
    ago:    ['방금', '분 전', '시간 전']
  };

  var db = null;
  if (window.supabase) db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var hosts = document.querySelectorAll('[data-comments]');
  for (var i = 0; i < hosts.length; i++) mount(hosts[i]);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 주소처럼 보이는 부분은 눌리지 않는 회색 글씨로 (게시판과 같은 규칙)
  var URLISH = /((?:https?:\/\/|www\.)[^\s]+|[\w.-]+\.(?:com|net|org|kr|io|me|co|gg|xyz|shop|store|link|site)(?:\/[^\s]*)?)/gi;
  function bodyHtml(text) {
    return esc(text)
      .replace(URLISH, '<span class="deadlink" title="여기서는 주소가 눌리지 않습니다">$1</span>')
      .replace(/\n/g, '<br>');
  }

  function when(iso) {
    var t = new Date(iso), m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return T.ago[0];
    if (m < 60) return m + T.ago[1];
    if (m < 1440) return Math.floor(m / 60) + T.ago[2];
    return EN ? (t.getMonth() + 1) + '/' + t.getDate()
              : (t.getMonth() + 1) + '월 ' + t.getDate() + '일';
  }

  function mount(host) {
    var slug = host.getAttribute('data-comments');
    var busy = false;

    host.innerHTML =
      '<p class="talk-lead">' + T.lead + '</p>' +
      '<div class="talk-list"><p class="talk-empty">' + T.loading + '</p></div>' +
      '<form class="talk-form">' +
        '<textarea class="talk-body" rows="2" maxlength="' + MAX + '" ' +
          'placeholder="' + T.ph + '"></textarea>' +
        '<div class="talk-row">' +
          '<input class="talk-nick" type="text" maxlength="12" placeholder="' + T.nick + '">' +
          '<input class="talk-pw" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" ' +
            'placeholder="' + T.pw + '">' +
          '<span class="talk-count">0/' + MAX + '</span>' +
          '<button class="btn btn-primary talk-send" type="submit">' + T.send + '</button>' +
        '</div>' +
        '<p class="talk-msg" role="status"></p>' +
      '</form>';

    var list  = host.querySelector('.talk-list');
    var form  = host.querySelector('.talk-form');
    var body  = host.querySelector('.talk-body');
    var nick  = host.querySelector('.talk-nick');
    var pw    = host.querySelector('.talk-pw');
    var count = host.querySelector('.talk-count');
    var send  = host.querySelector('.talk-send');
    var msg   = host.querySelector('.talk-msg');

    body.addEventListener('input', function () {
      count.textContent = this.value.length + '/' + MAX;
    });

    function say(text, bad) {
      msg.textContent = text || '';
      msg.className = 'talk-msg' + (bad ? ' bad' : '');
    }

    // 접혀 있어도 몇 명이 남겼는지는 보이게 — 아무도 안 열어보면 아무도 안 씁니다
    var summary = host.parentNode && host.parentNode.tagName === 'DETAILS'
      ? host.parentNode.querySelector('summary') : null;
    var summaryBase = summary ? summary.textContent : '';

    function render(rows) {
      if (summary) summary.textContent = summaryBase + (rows.length ? ' (' + rows.length + ')' : '');
      if (!rows.length) {
        list.innerHTML = '<p class="talk-empty">' + T.empty + '</p>';
        return;
      }
      list.innerHTML = '';
      rows.forEach(function (c) {
        var el = document.createElement('article');
        el.className = 'talk-item';
        el.innerHTML =
          '<div class="talk-meta"><b>' + (c.nick ? esc(c.nick) : T.anon) + '</b>' +
          '<span class="talk-ago">' + when(c.created_at) + '</span></div>' +
          '<p class="talk-text">' + bodyHtml(c.body) + '</p>';
        if (c.has_pw) {
          var del = document.createElement('button');
          del.type = 'button';
          del.className = 'talk-del';
          del.textContent = T.del;
          del.addEventListener('click', function () { remove(c.id, el); });
          el.querySelector('.talk-meta').appendChild(del);
        }
        list.appendChild(el);
      });
    }

    function load() {
      if (!db) {
        list.innerHTML = '<p class="talk-empty">' + T.failed + '</p>';
        return;
      }
      db.from('labs_comments')
        .select('id,created_at,nick,body,has_pw')
        .eq('slug', slug)
        .order('created_at', { ascending: false })
        .limit(SHOW)
        .then(function (r) {
          if (r.error) throw r.error;
          render(r.data || []);
        })
        .catch(function (err) {
          list.innerHTML = '<p class="talk-empty">' + T.failed + '</p>';
          console.error(err);
        });
    }

    function remove(id, el) {
      var key = prompt(T.askPw);
      if (key === null) return;
      db.rpc('delete_labs_comment', { p_id: id, p_pw: String(key).trim() })
        .then(function (r) {
          if (r.error) { alert(T.noDel); return; }
          if (r.data === true) el.remove();
          else alert(T.badPw);
        });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;

      var text = body.value.trim();
      var key = pw.value.trim();
      if (!text) { say(T.needBody, true); return; }
      if (text.length > MAX) { say(T.tooLong, true); return; }
      // 숫자 4자리는 안 넣어도 됩니다. 넣으면 나중에 본인이 지울 수 있습니다.
      if (key && !/^\d{4}$/.test(key)) { say(T.badDigits, true); return; }
      if (!db) { say(T.offline, true); return; }

      busy = true; send.disabled = true; say(T.posting);
      db.rpc('create_labs_comment', {
        p_slug: slug,
        p_nick: nick.value.trim() || null,
        p_body: text,
        p_pw: key || null
      })
        .then(function (r) {
          if (r.error) throw r.error;
          body.value = ''; pw.value = ''; count.textContent = '0/' + MAX;
          say(T.thanks);
          load();
        })
        .catch(function (err) {
          say(T.failPost, true);
          console.error(err);
        })
        .then(function () { busy = false; send.disabled = false; });
    });

    load();
  }
})();
