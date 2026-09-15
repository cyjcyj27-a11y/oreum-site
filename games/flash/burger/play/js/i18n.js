// 한국어 / 영어. ?lang=en 으로 덧씌운다
(function () {
  // 받침 따라 조사 고르기
  function jong(w) { var c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? c % 28 : 0; }
  function ro(w) { var j = jong(w); return w + (j && j !== 8 ? '으로' : '로'); }
  function eun(w) { return w + (jong(w) ? '은' : '는'); }

  var KO = {
    title: '킹왕짱버거', start: '시작', cont: '이어하기', fresh: '새로 하기', freshSure: '정말 새로 하기', shop: '상점', book: '메뉴', next: '다음 날',
    sign: '버거', max: '완료', lock: '???', newMenu: '새 메뉴',
    dayN: function (n) { return n + '일차'; }, dayEnd: function (n) { return n + '일차 영업 끝'; },
    menus: ['햄버거', '치즈버거', '불고기버거', '베이컨버거', '더블치즈버거', '에그버거',
      '새우버거', '치킨버거', '할라피뇨버거', '아보카도버거', '한우버거', '타워버거'],
    ing: { cheese: '치즈', lettuce: '양상추', tomato: '토마토', onion: '양파', pickle: '피클', bacon: '베이컨',
      egg: '계란', jalapeno: '할라피뇨', avocado: '아보카도', ketchup: '케첩', mustard: '머스터드', mayo: '마요',
      bulgogi: '불고기소스', sriracha: '스리라차', beef: '패티', chicken: '치킨', shrimp: '새우' },
    done: { rare: '레어', medium: '미디엄', well: '웰던' },
    up: { grill: '그릴', heat: '화력', fryer: '튀김기', basket: '튀김 바구니', wait: '대기석', sign: '간판' },
    ranks: ['푸드트럭', '골목 버거집', '수제버거 가게', '버거 맛집', '버거 명가'],
    words: ['', '별로예요', '그럭저럭', '좋아요', '맛있어요!', '최고예요!'],
    // 주문표 짧은 줄
    tNo: function (k) { return KO.ing[k] + ' ✕'; },
    tAdd: function (k) { return KO.ing[k] + ' +'; },
    tSauce: function (k) { return '→ ' + KO.ing[k]; },
    tLots: function (k) { return KO.ing[k] + ' ×2'; },
    tPatty: '패티 +', tFries: '감자튀김', bunB: '아랫빵', bunT: '윗빵',
    noL: function (k) { return KO.ing[k] + ' 빼기'; }, addL: function (k) { return KO.ing[k]; }, swapL: function (k) { return ro(KO.ing[k]) + ' 변경'; }, lotsL: function (k) { return KO.ing[k] + ' 듬뿍'; },
    // 말풍선
    sDone: function (d) { return ro(KO.done[d]) + ' 주세요'; },
    sNo: function (k) { return eun(KO.ing[k]) + ' 빼 주세요'; },
    sAdd: function (k) { return KO.ing[k] + '도 넣어 주세요'; },
    sSauce: function (k) { return '소스는 ' + ro(KO.ing[k]) + ' 주세요'; },
    sLots: function (k) { return KO.ing[k] + ' 듬뿍이요'; },
    sPatty: '패티 하나 더요', sFries: '감자튀김도요',
    hello: ['안녕하세요!', '배고파요', '하나 주세요', '맛있게요!'],
    rotTitle: '가로 화면에서 하는 게임입니다', rotGo: '가로로 돌리기',
    rotHelp: '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요', rotSkip: '그래도 세로로 하기'
  };
  var EN = {
    title: 'KINGWANGZZANG', start: 'START', cont: 'CONTINUE', fresh: 'NEW GAME', freshSure: 'TAP AGAIN', shop: 'SHOP', book: 'MENU', next: 'NEXT',
    sign: 'BURGER', max: 'MAX', lock: '???', newMenu: 'NEW',
    dayN: function (n) { return 'DAY ' + n; }, dayEnd: function (n) { return 'DAY ' + n + ' CLEAR'; },
    menus: ['Hamburger', 'Cheeseburger', 'Bulgogi Burger', 'Bacon Burger', 'Double Cheese', 'Egg Burger',
      'Shrimp Burger', 'Chicken Burger', 'Jalapeno Burger', 'Avocado Burger', 'Hanwoo Burger', 'Tower Burger'],
    ing: { cheese: 'Cheese', lettuce: 'Lettuce', tomato: 'Tomato', onion: 'Onion', pickle: 'Pickles', bacon: 'Bacon',
      egg: 'Egg', jalapeno: 'Jalapeno', avocado: 'Avocado', ketchup: 'Ketchup', mustard: 'Mustard', mayo: 'Mayo',
      bulgogi: 'Bulgogi Sauce', sriracha: 'Sriracha', beef: 'Patty', chicken: 'Chicken', shrimp: 'Shrimp' },
    done: { rare: 'Rare', medium: 'Medium', well: 'Well-done' },
    up: { grill: 'Grill', heat: 'Heat', fryer: 'Fryer', basket: 'Fry Basket', wait: 'Seats', sign: 'Sign' },
    ranks: ['Food Truck', 'Corner Burger', 'Burger Shop', 'Burger Joint', 'Burger Legend'],
    words: ['', 'BAD', 'OK', 'GOOD', 'GREAT', 'PERFECT'],
    tNo: function (k) { return EN.ing[k] + ' ✕'; },
    tAdd: function (k) { return EN.ing[k] + ' +'; },
    tSauce: function (k) { return '→ ' + EN.ing[k]; },
    tLots: function (k) { return EN.ing[k] + ' ×2'; },
    tPatty: 'Patty +', tFries: 'Fries', bunB: 'Bottom Bun', bunT: 'Top Bun',
    noL: function (k) { return 'No ' + EN.ing[k]; }, addL: function (k) { return EN.ing[k]; }, swapL: function (k) { return EN.ing[k] + ' instead'; }, lotsL: function (k) { return 'Extra ' + EN.ing[k]; },
    sDone: function (d) { return EN.done[d] + ', please'; },
    sNo: function (k) { return 'No ' + EN.ing[k].toLowerCase() + ', please'; },
    sAdd: function (k) { return 'With ' + EN.ing[k].toLowerCase(); },
    sSauce: function (k) { return EN.ing[k] + ' instead'; },
    sLots: function (k) { return 'Lots of ' + EN.ing[k].toLowerCase(); },
    sPatty: 'Extra patty', sFries: 'Fries too',
    hello: ['Hi!', "I'm starving", 'One, please', 'Make it tasty!'],
    rotTitle: 'This game plays in landscape', rotGo: 'Turn to landscape',
    rotHelp: "If the button does nothing, turn off your phone's rotation lock and lay it sideways",
    rotSkip: 'Play in portrait anyway'
  };
  var q = new URLSearchParams(location.search).get('lang');
  var en = q === 'en';
  window.T = en ? EN : KO;
  window.T.en = en;
  if (en) {
    document.documentElement.lang = 'en';
    document.title = 'Kingwangzzang';
    var h = document.querySelector('#title h1'); if (h) { h.textContent = EN.title; h.setAttribute('data-txt', EN.title); h.classList.add('en'); }
  }
  document.querySelectorAll('[data-t]').forEach(function (el) {
    var k = el.getAttribute('data-t'); if (typeof window.T[k] === 'string') el.textContent = window.T[k];
  });
})();
