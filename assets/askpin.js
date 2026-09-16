// ─────────────────────────────────────────────────────────────
// 숫자 4자리를 물어보는 작은 창.
//
// 브라우저 기본 prompt() 는 넣는 숫자가 화면에 그대로 보입니다(2026-09-16 사장님 "입력할때 암호화").
// 이 창은 ●●●● 로 가려서 받습니다. 옆 사람이 봐도 모릅니다.
//
//   askPin('글을 올릴 때 넣은 숫자 4자리를 입력하세요').then(function (pin) {
//     if (pin === null) return;      // 취소
//     ...
//   });
//
// 넣는 법: 쓰는 페이지 맨 아래에 <script src="/assets/askpin.js?v=1" defer></script>
// ─────────────────────────────────────────────────────────────
(function () {
  var EN = /^\/en\//.test(location.pathname);
  var T = EN ? { ok: 'OK', cancel: 'Cancel', ph: '4 digits' }
             : { ok: '확인', cancel: '취소', ph: '숫자 4자리' };
  var box = null, input = null, title = null, done = null;

  function build() {
    box = document.createElement('div');
    box.className = 'pinbox';
    box.innerHTML =
      '<div class="pin-card" role="dialog" aria-modal="true">' +
        '<p class="pin-title"></p>' +
        '<input class="pin-input" type="password" inputmode="numeric" autocomplete="off" ' +
               'maxlength="4" placeholder="' + T.ph + '">' +
        '<p class="pin-btns">' +
          '<button type="button" class="btn btn-primary pin-ok">' + T.ok + '</button>' +
          '<button type="button" class="btn btn-ghost pin-cancel">' + T.cancel + '</button>' +
        '</p>' +
      '</div>';
    document.body.appendChild(box);
    title = box.querySelector('.pin-title');
    input = box.querySelector('.pin-input');
    box.querySelector('.pin-ok').addEventListener('click', function () { close(input.value.trim()); });
    box.querySelector('.pin-cancel').addEventListener('click', function () { close(null); });
    box.addEventListener('click', function (e) { if (e.target === box) close(null); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); close(input.value.trim()); }
      if (e.key === 'Escape') close(null);
    });
  }

  function close(v) {
    if (!box) return;
    box.classList.remove('on');
    input.value = '';
    var f = done; done = null;
    if (f) f(v);
  }

  window.askPin = function (msg) {
    return new Promise(function (resolve) {
      if (!box) build();
      if (done) done(null);            // 앞서 열린 창이 있으면 취소로 닫는다
      done = resolve;
      title.textContent = msg || '';
      box.classList.add('on');
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 30);
    });
  };
})();
