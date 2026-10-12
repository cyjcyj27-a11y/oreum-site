/* 언어: 주소에 ?lang=en 일 때만 영어 */
(function () {
  var en = false; try { en = new URLSearchParams(location.search).get('lang') === 'en'; } catch (e) {}
  if (en) document.documentElement.lang = 'en';
  var D = { '딱지치기': 'DDAKJI', '지도': 'MAP', '가방': 'BAG', '도감': 'BOOK', '처음으로': 'HOME', '시작': 'START', '이어하기': 'CONTINUE', '새로 시작': 'NEW GAME',
    '무게': 'Weight', '두께': 'Thick', '내 딱지': 'Mine', '내 차례': 'MY TURN', '골목': 'Alley', '놀이터': 'Playground', '운동장': 'Schoolyard', '문방구 앞': 'Stationery Shop', '딱지왕': 'DDAKJI KING' };
  window.LANG = en ? 'en' : 'ko';
  window.L = function (ko, enTxt) { if (!en) return ko; return enTxt != null ? enTxt : (D[ko] || ko); };
  if (en) document.addEventListener('DOMContentLoaded', function () {
    document.title = 'Ddakji';
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var t = n.nodeValue.trim(); if (D[t]) n.nodeValue = n.nodeValue.replace(t, D[t]); }
  });
})();
