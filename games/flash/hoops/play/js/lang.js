// 언어: 주소에 ?lang=en 일 때만 영어. 화면 글은 L(한, 영), 처음 HTML 글은 아래 표로 바꿔 끼움.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  window.L = (ko, en) => (EN ? en : ko);
  if (!EN) return;
  document.documentElement.lang = 'en';
  const TX = {
    h1: 'Flick the ball <b>up</b> to shoot',
    h2: '<b>Longer</b> flick goes farther, <b>angled</b> flick goes sideways',
    h3: 'Beat the <b>GOAL</b> in 40 seconds to CLEAR. Last 10 seconds = 3 points',
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Arcade Hoops';
    document.querySelectorAll('[data-k]').forEach((e) => { const k = e.getAttribute('data-k'); if (TX[k]) e.innerHTML = TX[k]; });
    const lt = document.getElementById('logoT'); if (lt) lt.textContent = 'ARCADE HOOPS';
    const sm = document.querySelector('#logo small'); if (sm) sm.textContent = 'BASKETBALL';
    const cs = document.querySelector('#cSave span'); if (cs) cs.textContent = 'SAVE';
    const sh = document.querySelector('#cShare span'); if (sh) sh.textContent = 'SHARE';
  });
})();
