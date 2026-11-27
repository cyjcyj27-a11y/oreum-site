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
  var ZH = {
    title: '王中王汉堡', start: '开始', cont: '继续', fresh: '重新开始', freshSure: '确定重新开始', shop: '商店', book: '菜单', next: '下一天',
    sign: '汉堡', max: '满级', lock: '???', newMenu: '新菜单',
    dayN: function (n) { return '第' + n + '天'; }, dayEnd: function (n) { return '第' + n + '天 营业结束'; },
    menus: ['汉堡', '芝士汉堡', '烤肉汉堡', '培根汉堡', '双层芝士汉堡', '鸡蛋汉堡',
      '鲜虾汉堡', '鸡排汉堡', '墨西哥辣椒汉堡', '牛油果汉堡', '韩牛汉堡', '巨塔汉堡'],
    ing: { cheese: '芝士', lettuce: '生菜', tomato: '番茄', onion: '洋葱', pickle: '酸黄瓜', bacon: '培根',
      egg: '鸡蛋', jalapeno: '墨西哥辣椒', avocado: '牛油果', ketchup: '番茄酱', mustard: '芥末酱', mayo: '蛋黄酱',
      bulgogi: '烤肉酱', sriracha: '是拉差酱', beef: '肉饼', chicken: '鸡排', shrimp: '虾排' },
    done: { rare: '三分熟', medium: '五分熟', well: '全熟' },
    up: { grill: '烤盘', heat: '火力', fryer: '炸锅', basket: '炸篮', wait: '等候座', sign: '招牌' },
    ranks: ['美食车', '巷口汉堡店', '手作汉堡店', '汉堡名店', '汉堡世家'],
    words: ['', '不太行', '还行吧', '不错', '好吃！', '绝了！'],
    tNo: function (k) { return ZH.ing[k] + ' ✕'; },
    tAdd: function (k) { return ZH.ing[k] + ' +'; },
    tSauce: function (k) { return '→ ' + ZH.ing[k]; },
    tLots: function (k) { return ZH.ing[k] + ' ×2'; },
    tPatty: '肉饼 +', tFries: '薯条', bunB: '底层面包', bunT: '顶层面包',
    noL: function (k) { return '不要' + ZH.ing[k]; }, addL: function (k) { return ZH.ing[k]; }, swapL: function (k) { return '换成' + ZH.ing[k]; }, lotsL: function (k) { return '多加' + ZH.ing[k]; },
    sDone: function (d) { return '要' + ZH.done[d] + '的'; },
    sNo: function (k) { return '不要放' + ZH.ing[k]; },
    sAdd: function (k) { return ZH.ing[k] + '也加上'; },
    sSauce: function (k) { return '酱换成' + ZH.ing[k]; },
    sLots: function (k) { return ZH.ing[k] + '多放点'; },
    sPatty: '再加块肉饼', sFries: '还要薯条',
    hello: ['你好！', '饿死了', '来一个', '要好吃哦！'],
    rotTitle: '这个游戏要横屏玩', rotGo: '切换横屏',
    rotHelp: '按钮没反应的话，请关掉旋转锁定再把手机横过来', rotSkip: '还是竖屏玩'
  };
  var q = new URLSearchParams(location.search).get('lang');
  var en = q === 'en', zh = q === 'zh';
  window.T = en ? EN : zh ? ZH : KO;
  window.T.en = en;
  if (zh) {
    document.documentElement.lang = 'zh-CN';
    document.title = ZH.title;
    // 게임 글꼴엔 한자가 없어 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    var zf = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold'),local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var css = ['YeonSung', 'Gaegu', 'Ria'].map(function (fm) { return "@font-face{font-family:'" + fm + "';src:" + zf + ';unicode-range:' + ur + '}'; }).join('');
    var st = document.createElement('style'); st.textContent = css + 'html[lang=zh-CN] *{word-break:normal!important}#title h1.zh{font-size:min(14vw,30vh)}'; document.head.appendChild(st);
    var hz = document.querySelector('#title h1'); if (hz) { hz.textContent = ZH.title; hz.setAttribute('data-txt', ZH.title); hz.classList.add('zh'); }
    var tips = { tPause: '暂停', tMus: '音乐', tSnd: '音效' };
    for (var id in tips) { var b = document.getElementById(id); if (b) b.title = tips[id]; }
  }
  if (en) {
    document.documentElement.lang = 'en';
    document.title = 'Kingwangzzang';
    var h = document.querySelector('#title h1'); if (h) { h.textContent = EN.title; h.setAttribute('data-txt', EN.title); h.classList.add('en'); }
  }
  document.querySelectorAll('[data-t]').forEach(function (el) {
    var k = el.getAttribute('data-t'); if (typeof window.T[k] === 'string') el.textContent = window.T[k];
  });
})();
