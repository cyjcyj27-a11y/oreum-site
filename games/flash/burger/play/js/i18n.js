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
  var JA = {
    title: '最強バーガー', start: 'はじめる', cont: 'つづきから', fresh: 'さいしょから', freshSure: '本当にさいしょから', shop: 'ショップ', book: 'メニュー', next: '次の日',
    sign: 'バーガー', max: '完了', lock: '???', newMenu: '新メニュー',
    dayN: function (n) { return n + '日目'; }, dayEnd: function (n) { return n + '日目 営業終了'; },
    menus: ['ハンバーガー', 'チーズバーガー', 'プルコギバーガー', 'ベーコンバーガー', 'ダブルチーズバーガー', 'エッグバーガー',
      'えびバーガー', 'チキンバーガー', 'ハラペーニョバーガー', 'アボカドバーガー', '韓牛バーガー', 'タワーバーガー'],
    ing: { cheese: 'チーズ', lettuce: 'レタス', tomato: 'トマト', onion: 'オニオン', pickle: 'ピクルス', bacon: 'ベーコン',
      egg: 'たまご', jalapeno: 'ハラペーニョ', avocado: 'アボカド', ketchup: 'ケチャップ', mustard: 'マスタード', mayo: 'マヨ',
      bulgogi: 'プルコギソース', sriracha: 'シラチャー', beef: 'パティ', chicken: 'チキン', shrimp: 'えび' },
    done: { rare: 'レア', medium: 'ミディアム', well: 'ウェルダン' },
    up: { grill: 'グリル', heat: '火力', fryer: 'フライヤー', basket: 'フライバスケット', wait: '待合席', sign: '看板' },
    ranks: ['キッチンカー', '路地裏バーガー', '手作りバーガー店', 'バーガーの名店', 'バーガーの名門'],
    words: ['', 'イマイチ', 'まあまあ', 'いいね', 'おいしい！', '最高！'],
    tNo: function (k) { return JA.ing[k] + ' ✕'; },
    tAdd: function (k) { return JA.ing[k] + ' +'; },
    tSauce: function (k) { return '→ ' + JA.ing[k]; },
    tLots: function (k) { return JA.ing[k] + ' ×2'; },
    tPatty: 'パティ +', tFries: 'ポテト', bunB: '下バンズ', bunT: '上バンズ',
    noL: function (k) { return JA.ing[k] + '抜き'; }, addL: function (k) { return JA.ing[k]; }, swapL: function (k) { return JA.ing[k] + 'に変更'; }, lotsL: function (k) { return JA.ing[k] + '多め'; },
    sDone: function (d) { return JA.done[d] + 'でお願い'; },
    sNo: function (k) { return JA.ing[k] + '抜きでお願い'; },
    sAdd: function (k) { return JA.ing[k] + 'も入れてね'; },
    sSauce: function (k) { return 'ソースは' + JA.ing[k] + 'で'; },
    sLots: function (k) { return JA.ing[k] + 'たっぷりで'; },
    sPatty: 'パティ追加で', sFries: 'ポテトもね',
    hello: ['こんにちは！', 'おなかすいた', 'ひとつください', 'おいしくね！'],
    rotTitle: '横画面で遊ぶゲームです', rotGo: '横向きにする',
    rotHelp: 'ボタンが効かないときは、画面の回転ロックを解除して横向きにしてください', rotSkip: 'このまま縦で遊ぶ'
  };
  // 문장 가운데에 넣을 때 첫 글자를 소문자로
  function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  var PT = {
    title: 'BURGER SUPREMO', start: 'COMEÇAR', cont: 'CONTINUAR', fresh: 'NOVO JOGO', freshSure: 'TOQUE DE NOVO', shop: 'LOJA', book: 'CARDÁPIO', next: 'PRÓXIMO',
    sign: 'BURGER', max: 'MÁX', lock: '???', newMenu: 'NOVO',
    dayN: function (n) { return 'DIA ' + n; }, dayEnd: function (n) { return 'FIM DO DIA ' + n; },
    menus: ['Hambúrguer', 'Cheeseburger', 'Burger de Bulgogi', 'Burger de Bacon', 'Duplo Cheese', 'Burger de Ovo',
      'Burger de Camarão', 'Burger de Frango', 'Burger Jalapeño', 'Burger de Abacate', 'Burger Hanwoo', 'Burger Torre'],
    ing: { cheese: 'Queijo', lettuce: 'Alface', tomato: 'Tomate', onion: 'Cebola', pickle: 'Picles', bacon: 'Bacon',
      egg: 'Ovo', jalapeno: 'Jalapeño', avocado: 'Abacate', ketchup: 'Ketchup', mustard: 'Mostarda', mayo: 'Maionese',
      bulgogi: 'Molho bulgogi', sriracha: 'Sriracha', beef: 'Carne', chicken: 'Frango', shrimp: 'Camarão' },
    done: { rare: 'Malpassado', medium: 'Ao ponto', well: 'Bem passado' },
    up: { grill: 'Chapa', heat: 'Fogo', fryer: 'Fritadeira', basket: 'Cesto de Fritura', wait: 'Assentos', sign: 'Letreiro' },
    ranks: ['Food Truck', 'Lanchonete de Esquina', 'Hamburgueria Artesanal', 'Hamburgueria Top', 'Lenda do Burger'],
    words: ['', 'RUIM', 'OK', 'BOM', 'ÓTIMO', 'PERFEITO'],
    tNo: function (k) { return PT.ing[k] + ' ✕'; },
    tAdd: function (k) { return PT.ing[k] + ' +'; },
    tSauce: function (k) { return '→ ' + PT.ing[k]; },
    tLots: function (k) { return PT.ing[k] + ' ×2'; },
    tPatty: 'Carne +', tFries: 'Fritas', bunB: 'Pão de Baixo', bunT: 'Pão de Cima',
    noL: function (k) { return 'Sem ' + lc(PT.ing[k]); }, addL: function (k) { return PT.ing[k]; }, swapL: function (k) { return 'Troca: ' + lc(PT.ing[k]); }, lotsL: function (k) { return PT.ing[k] + ' extra'; },
    sDone: function (d) { return PT.done[d] + ', por favor'; },
    sNo: function (k) { return 'Sem ' + lc(PT.ing[k]) + ', por favor'; },
    sAdd: function (k) { return 'Com ' + lc(PT.ing[k]) + ' também'; },
    sSauce: function (k) { return 'Quero com ' + lc(PT.ing[k]) + ', por favor'; },
    sLots: function (k) { return 'Bastante ' + lc(PT.ing[k]) + '!'; },
    sPatty: 'Mais uma carne', sFries: 'Com fritas também',
    hello: ['Oi!', 'Tô morrendo de fome', 'Um, por favor', 'Capricha, hein!'],
    rotTitle: 'Este jogo é na horizontal', rotGo: 'Virar na horizontal',
    rotHelp: 'Se o botão não funcionar, desative o bloqueio de rotação e deite o celular',
    rotSkip: 'Jogar na vertical mesmo assim'
  };
  // 러시아어 격 변화: G = 생격(без, много), I = 조격(с)
  var RU_G = { cheese: 'сыра', lettuce: 'салата', tomato: 'помидора', onion: 'лука', pickle: 'огурчиков', bacon: 'бекона',
    egg: 'яйца', jalapeno: 'халапеньо', avocado: 'авокадо', ketchup: 'кетчупа', mustard: 'горчицы', mayo: 'майонеза',
    bulgogi: 'соуса пулькоги', sriracha: 'шрирачи', beef: 'котлеты', chicken: 'курицы', shrimp: 'креветок' };
  var RU_I = { cheese: 'сыром', lettuce: 'салатом', tomato: 'помидором', onion: 'луком', pickle: 'огурчиками', bacon: 'беконом',
    egg: 'яйцом', jalapeno: 'халапеньо', avocado: 'авокадо', ketchup: 'кетчупом', mustard: 'горчицей', mayo: 'майонезом',
    bulgogi: 'соусом пулькоги', sriracha: 'шрирачей', beef: 'котлетой', chicken: 'курицей', shrimp: 'креветками' };
  var RU_DS = { rare: 'С кровью', medium: 'Средней прожарки', well: 'Хорошо прожаренную' };
  var RU = {
    title: 'ЧУМОВОЙ БУРГЕР', start: 'СТАРТ', cont: 'ПРОДОЛЖИТЬ', fresh: 'НОВАЯ ИГРА', freshSure: 'НАЖМИ ЕЩЁ', shop: 'МАГАЗИН', book: 'МЕНЮ', next: 'ДАЛЬШЕ',
    sign: 'БУРГЕР', max: 'МАКС', lock: '???', newMenu: 'НОВОЕ',
    dayN: function (n) { return 'ДЕНЬ ' + n; }, dayEnd: function (n) { return 'КОНЕЦ ДНЯ ' + n; },
    menus: ['Гамбургер', 'Чизбургер', 'Бургер пулькоги', 'Бургер с беконом', 'Двойной чиз', 'Бургер с яйцом',
      'Бургер с креветками', 'Чикенбургер', 'Бургер халапеньо', 'Бургер с авокадо', 'Бургер ханву', 'Бургер-башня'],
    ing: { cheese: 'Сыр', lettuce: 'Салат', tomato: 'Помидор', onion: 'Лук', pickle: 'Огурчики', bacon: 'Бекон',
      egg: 'Яйцо', jalapeno: 'Халапеньо', avocado: 'Авокадо', ketchup: 'Кетчуп', mustard: 'Горчица', mayo: 'Майонез',
      bulgogi: 'Соус пулькоги', sriracha: 'Шрирача', beef: 'Котлета', chicken: 'Курица', shrimp: 'Креветки' },
    done: { rare: 'С кровью', medium: 'Средняя', well: 'Прожаренная' },
    up: { grill: 'Гриль', heat: 'Жар', fryer: 'Фритюр', basket: 'Корзина фри', wait: 'Места', sign: 'Вывеска' },
    ranks: ['Фудтрак', 'Бургерная за углом', 'Крафтовая бургерная', 'Топовая бургерная', 'Легенда бургеров'],
    words: ['', 'ПЛОХО', 'НОРМ', 'ХОРОШО', 'ОТЛИЧНО', 'ИДЕАЛЬНО'],
    tNo: function (k) { return RU.ing[k] + ' ✕'; },
    tAdd: function (k) { return RU.ing[k] + ' +'; },
    tSauce: function (k) { return '→ ' + RU.ing[k]; },
    tLots: function (k) { return RU.ing[k] + ' ×2'; },
    tPatty: 'Котлета +', tFries: 'Фри', bunB: 'Низ булки', bunT: 'Верх булки',
    noL: function (k) { return 'Без ' + RU_G[k]; }, addL: function (k) { return RU.ing[k]; }, swapL: function (k) { return 'Замена: ' + lc(RU.ing[k]); }, lotsL: function (k) { return 'Много ' + RU_G[k]; },
    sDone: function (d) { return RU_DS[d] + ', пожалуйста'; },
    sNo: function (k) { return 'Без ' + RU_G[k] + ', пожалуйста'; },
    sAdd: function (k) { return 'И с ' + RU_I[k] + ', пожалуйста'; },
    sSauce: function (k) { return 'Лучше с ' + RU_I[k]; },
    sLots: function (k) { return 'Побольше ' + RU_G[k] + '!'; },
    sPatty: 'Ещё котлетку', sFries: 'И картошку фри',
    hello: ['Привет!', 'Умираю с голоду', 'Один, пожалуйста', 'Сделай повкуснее!'],
    rotTitle: 'Эта игра для горизонтального экрана', rotGo: 'Повернуть экран',
    rotHelp: 'Если кнопка не работает, отключи блокировку поворота и положи телефон боком',
    rotSkip: 'Всё равно играть вертикально'
  };
  // 엔딩 간판 글자 수 (글자마다 하나씩 솟는 시간에 쓴다)
  JA.titleN = Array.from(JA.title).length; PT.titleN = Array.from(PT.title).length; RU.titleN = Array.from(RU.title).length;
  var q = new URLSearchParams(location.search).get('lang');
  var en = q === 'en', zh = q === 'zh', ja = q === 'ja', pt = q === 'pt', ru = q === 'ru';
  window.T = en ? EN : zh ? ZH : ja ? JA : pt ? PT : ru ? RU : KO;
  window.T.en = en;
  if (ja || pt || ru) {
    var L3 = ja ? JA : pt ? PT : RU;
    document.documentElement.lang = ja ? 'ja' : pt ? 'pt-BR' : 'ru';
    document.title = ja ? '最強バーガー' : pt ? 'Burger Supremo' : 'Чумовой бургер';
    // 게임 글꼴에 없는 글자(가나·한자, 악센트 라틴·키릴)를 기기 글꼴로 같은 이름에 덧붙인다
    var jf = ja ? "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')"
      : "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    var ur3 = ja ? 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF'
      : 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    var css3 = ['YeonSung', 'Gaegu', 'Ria'].map(function (fm) { return "@font-face{font-family:'" + fm + "';src:" + jf + ';unicode-range:' + ur3 + '}'; }).join('');
    if (ja) css3 += 'html[lang=ja] *{word-break:normal!important}#title h1.ja{font-size:min(14vw,30vh)}';
    var st3 = document.createElement('style'); st3.textContent = css3; document.head.appendChild(st3);
    var h3 = document.querySelector('#title h1'); if (h3) { h3.textContent = L3.title; h3.setAttribute('data-txt', L3.title); h3.classList.add(ja ? 'ja' : 'en'); }
    var tips3 = ja ? { tPause: '一時停止', tMus: '音楽', tSnd: '効果音' } : pt ? { tPause: 'Pausar', tMus: 'Música', tSnd: 'Efeitos' } : { tPause: 'Пауза', tMus: 'Музыка', tSnd: 'Звуки' };
    for (var id3 in tips3) { var b3 = document.getElementById(id3); if (b3) b3.title = tips3[id3]; }
  }
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
