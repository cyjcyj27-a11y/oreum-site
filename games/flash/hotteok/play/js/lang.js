// 언어: 주소에 ?lang=en 일 때만 영어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  window.L = (ko, en) => (EN ? en : ko);
  if (EN) { document.documentElement.lang = 'en'; document.title = 'HOTTEOK MAKER'; }
})();
