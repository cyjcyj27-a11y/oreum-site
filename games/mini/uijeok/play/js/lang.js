// 언어: 주소에 ?lang=en 일 때만 영어. 화면 글은 L(한, 영)
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  window.L = (ko, en) => (EN ? en : ko);
  if (!EN) return;
  document.documentElement.lang = 'en';
  const TX = {
    h1: '<b>Jump</b> while running to leap far. Run off an edge and you fall',
    h2: '<b>Jump</b> under a ledge to grab it. Press <b>up</b> to climb',
    h4: 'Arrows coming? <b>↓</b> to duck',
    keys: '<b>← →</b> run · <b>↑</b> jump/climb · <b>↓</b> duck/climb down<br><b>Z</b> slash · <b>↑</b> block in a fight',
    rot: 'Turn your phone sideways',
    h3: 'When a guard <b>raises his weapon, block with ↑</b>. Then <b>attack</b>',
  };
  const TT = { atk: 'SLASH', rot: 'LANDSCAPE' };
  document.addEventListener('DOMContentLoaded', () => {
    document.title = 'Moonlit Outlaw';
    document.querySelectorAll('[data-k]').forEach((e) => { const k = e.getAttribute('data-k'); if (TX[k]) e.innerHTML = TX[k]; });
    document.querySelectorAll('[data-t]').forEach((e) => { const k = e.getAttribute('data-t'); if (TT[k]) e.textContent = TT[k]; });
    const cs = document.querySelector('#cSave span'); if (cs) cs.textContent = 'SAVE';
    const sh = document.querySelector('#cShare span'); if (sh) sh.textContent = 'SHARE';
  });
})();