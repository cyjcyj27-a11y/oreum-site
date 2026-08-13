/* 이메일 주소 감추기 —
   주소를 HTML에 그대로 적어두면 광고 로봇이 긁어가 스팸이 옵니다.
   그래서 주소를 조각내 두었다가, 사람이 눌렀을 때만 합칩니다.

   data-go="gmail" 이면 새 창으로 지메일 쓰기 화면을 엽니다.
   (윈도우에 메일 프로그램이 없으면 mailto: 는 아무 반응이 없어서, 이쪽이 확실합니다) */
(function () {
  document.querySelectorAll('.js-mail').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var addr = el.getAttribute('data-u') + '@' + el.getAttribute('data-d');

      if (el.getAttribute('data-go') === 'gmail') {
        window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' +
                    encodeURIComponent(addr), '_blank', 'noopener');
        return;
      }

      // 그 밖에는 주소를 화면에 드러내고, 누르면 메일 앱이 열리는 링크로 바꿉니다
      var a = document.createElement('a');
      a.href = 'mailto:' + addr;
      a.textContent = addr;
      a.className = el.className.replace('js-mail', '').trim();
      el.replaceWith(a);
      if (el.getAttribute('data-open') === 'yes') a.click();
    });
  });
})();
