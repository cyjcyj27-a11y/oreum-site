// 한국어 / 영어. ?lang=en 으로 덧씌운다 (핑거킥과 같은 방식)
(function () {
  var KO = {
    title: '붕어빵', shop: '상점', dex: '도감', start: 'START',
    dough: '반죽', paste: '소', sold: '판매',
    tBread: '붕어빵', tOdeng: '오뎅',
    buyFish: '어묵 사기', u_pot: '대야', u_broth: '육수', u_word: '입소문', u_ftub: '어묵 통',
    u_hole: '틀 구멍', u_fire: '불 세기', u_auto: '자동 반죽', u_tong: '자동 집게',
    u_dtub: '반죽 통', u_ptub: '소 통', u_reg: '단골',
    buyDough: '반죽 사기', buyPaste: '소 사기', max: 'MAX',
    ranks: ['포장마차', '푸드트럭', '가게'],
    flavors: ['팥', '슈크림', '초코', '고구마', '치즈', '피자', '민트초코', '금붕어빵'],
    goal: '다음 단계', maxRank: 'MAX',
    lock: '???'
  };
  var EN = {
    title: 'BUNGEOPPANG', shop: 'SHOP', dex: 'DEX', start: 'START',
    dough: 'Batter', paste: 'Filling', sold: 'Sold',
    tBread: 'Fish Bread', tOdeng: 'Fish Cake',
    buyFish: 'Buy Fish Cake', u_pot: 'Basin', u_broth: 'Broth', u_word: 'Word of Mouth', u_ftub: 'Fish Cake Tub',
    u_hole: 'Molds', u_fire: 'Heat', u_auto: 'Auto Pour', u_tong: 'Auto Tongs',
    u_dtub: 'Batter Tub', u_ptub: 'Filling Tub', u_reg: 'Regulars',
    buyDough: 'Buy Batter', buyPaste: 'Buy Filling', max: 'MAX',
    ranks: ['Street Tent', 'Food Truck', 'Shop'],
    flavors: ['Red Bean', 'Custard', 'Chocolate', 'Sweet Potato', 'Cheese', 'Pizza', 'Mint Choco', 'Golden'],
    goal: 'Next Tier', maxRank: 'MAX',
    lock: '???'
  };
  var q = new URLSearchParams(location.search).get('lang');
  var en = q ? q === 'en' : !/^ko/i.test(navigator.language || '');
  window.T = en ? EN : KO;
  window.T.en = en;
  if (en) {
    document.documentElement.lang = 'en';
    document.title = 'Bungeoppang';
    var h = document.querySelector('#title h1'); if (h) h.textContent = EN.title;
  }
  document.querySelectorAll('[data-t]').forEach(function (el) {
    var k = el.getAttribute('data-t'); if (window.T[k]) el.textContent = window.T[k];
  });
})();
