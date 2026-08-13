/* 이메일 주소 감추기 —
   주소를 HTML에 그대로 적어두면 광고 로봇이 긁어가 스팸이 옵니다.
   그래서 주소를 조각내 두었다가, 사람이 눌렀을 때만 합쳐서 보여줍니다. */
(function () {
  function join(el) {
    return el.getAttribute('data-u') + '@' + el.getAttribute('data-d');
  }
  document.querySelectorAll('.js-mail').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var addr = join(el);
      var a = document.createElement('a');
      a.href = 'mailto:' + addr;
      a.textContent = el.getAttribute('data-label') === 'short'
        ? (el.getAttribute('data-text') || addr) : addr;
      a.className = el.className.replace('js-mail', '').trim();
      el.replaceWith(a);
      // 처음 누른 김에 메일 앱까지 열어줍니다
      if (el.getAttribute('data-open') === 'yes') a.click();
    });
  });
})();
