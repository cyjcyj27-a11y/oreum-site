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
    lock: '???',
    rotTitle: '가로 화면에서 하는 게임입니다', rotGo: '가로로 돌리기',
    rotHelp: '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요', rotSkip: '그래도 세로로 하기'
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
    lock: '???',
    rotTitle: 'This game plays in landscape', rotGo: 'Turn to landscape',
    rotHelp: "If the button does nothing, turn off your phone's rotation lock and lay it sideways",
    rotSkip: 'Play in portrait anyway'
  };
  var ZH = {
    title: '鲷鱼烧', shop: '商店', dex: '图鉴', start: 'START',
    dough: '面糊', paste: '馅料', sold: '售出',
    tBread: '鲷鱼烧', tOdeng: '关东煮',
    buyFish: '买鱼糕', u_pot: '大锅', u_broth: '高汤', u_word: '口碑', u_ftub: '鱼糕桶',
    u_hole: '模具格', u_fire: '火力', u_auto: '自动倒面糊', u_tong: '自动夹子',
    u_dtub: '面糊桶', u_ptub: '馅料桶', u_reg: '回头客',
    buyDough: '买面糊', buyPaste: '买馅料', max: 'MAX',
    ranks: ['路边摊', '美食车', '小店'],
    flavors: ['红豆', '奶油', '巧克力', '红薯', '芝士', '披萨', '薄荷巧克力', '金鲷鱼烧'],
    goal: '下一阶段', maxRank: 'MAX',
    lock: '???',
    units: ['万亿', '亿', '万'],
    rotTitle: '这个游戏要横屏玩', rotGo: '切换横屏',
    rotHelp: '按钮没反应的话，请关掉旋转锁定再把手机横过来', rotSkip: '还是竖屏玩'
  };
  var q = new URLSearchParams(location.search).get('lang');
  var en = q === 'en';   // 언어는 주소로만 정한다(?lang=en 일 때만 영어, 없으면 한국어) — 기억하거나 폰 언어를 따르면 한국어 페이지에서 들어와도 영어로 뜬다(2026-09-29)
  var zh = q === 'zh';
  window.T = en ? EN : zh ? ZH : KO;
  window.T.en = en;
  if (zh) {
    document.documentElement.lang = 'zh-CN';
    document.title = ZH.title;
    // 게임 글꼴엔 한자가 없어 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    var zf = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold'),local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var css = ['Kirang', 'Ria'].map(function (fm) { return "@font-face{font-family:'" + fm + "';src:" + zf + ';unicode-range:' + ur + '}'; }).join('');
    var st = document.createElement('style'); st.textContent = css + 'html[lang=zh-CN] *{word-break:normal!important}'; document.head.appendChild(st);
    var hz = document.querySelector('#title h1'); if (hz) hz.textContent = ZH.title;
    var tips = { tMus: '音乐', tSnd: '音效' };
    for (var id in tips) { var b = document.getElementById(id); if (b) b.title = tips[id]; }
  }
  if (en) {
    document.documentElement.lang = 'en';
    document.title = 'Bungeoppang';
    var h = document.querySelector('#title h1'); if (h) h.textContent = EN.title;
  }
  document.querySelectorAll('[data-t]').forEach(function (el) {
    var k = el.getAttribute('data-t'); if (window.T[k]) el.textContent = window.T[k];
  });
})();
