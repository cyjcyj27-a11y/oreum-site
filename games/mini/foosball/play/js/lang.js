// ?lang=en 이면 화면 글자를 영어로, ?lang=zh 이면 중국어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  const Q = new URLSearchParams(location.search).get('lang');
  const ZH = !EN && Q === 'zh';
  const JA = !EN && Q === 'ja', PT = !EN && Q === 'pt', RU = !EN && Q === 'ru';
  window.LANG = EN ? 'en' : ZH ? 'zh' : JA ? 'ja' : PT ? 'pt' : RU ? 'ru' : 'ko';
  const D = {
    '테이블축구게임': 'FOOSBALL',
    '테이블 축구': 'FOOSBALL',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '입기': 'WEAR',
    '사용 중': 'WEARING',
    '홈': 'HOME',
    '나': 'YOU',
    '계속': 'CONTINUE',
    '이동': 'MOVE',
    '킥': 'KICK',
    '클릭': 'CLICK',
    '속도': 'SPEED',
    '파랑': 'Blue', '빨강': 'Red', '초록': 'Green', '노랑': 'Yellow', '주황': 'Orange', '하늘': 'Sky',
    '보라': 'Purple', '분홍': 'Pink', '흑표범': 'Panther', '백호': 'White Tiger', '황금': 'Gold', '은하': 'Galaxy',
    '일본': 'Japan', '멕시코': 'Mexico', '미국': 'USA', '네덜란드': 'Netherlands', '포르투갈': 'Portugal',
    '크로아티아': 'Croatia', '이탈리아': 'Italy', '스페인': 'Spain', '독일': 'Germany', '프랑스': 'France',
    '아르헨티나': 'Argentina', '브라질': 'Brazil',
    '첫 골': 'First Goal', '첫 승리': 'First Win', '연속 3골': '3 Goals in a Row', '수비수 골': 'Defender Goal',
    '5초 골': '5-Second Goal', '벽 맞고 골': 'Bank Shot Goal', '무실점 승리': 'Clean Sheet', '골키퍼 골': 'Keeper Goal',
    '역전승': 'Comeback Win', '5연승': '5 Wins in a Row', '100골': '100 Goals',
    '가로 화면에서 하는 게임입니다': 'This game is played in landscape',
    '가로로 돌리기': 'Rotate to landscape',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': 'If the button does not work, unlock screen rotation and turn your phone sideways',
    '그래도 세로로 하기': 'Play in portrait anyway',
  };
  // 중국어 사전: 한국어 문장을 열쇠로 찾는다
  const Z = {
    '테이블축구게임': '桌上足球',
    '테이블 축구': '桌上足球',
    '상점': '商店',
    '미션': '任务',
    '입기': '穿上',
    '사용 중': '穿着中',
    '홈': '主页',
    '나': '我',
    '계속': '继续',
    '이동': '移动',
    '킥': '踢球',
    '클릭': '点击',
    '속도': '速度',
    '파랑': '蓝色', '빨강': '红色', '초록': '绿色', '노랑': '黄色', '주황': '橙色', '하늘': '天蓝',
    '보라': '紫色', '분홍': '粉色', '흑표범': '黑豹', '백호': '白虎', '황금': '黄金', '은하': '银河',
    '일본': '日本', '멕시코': '墨西哥', '미국': '美国', '네덜란드': '荷兰', '포르투갈': '葡萄牙',
    '크로아티아': '克罗地亚', '이탈리아': '意大利', '스페인': '西班牙', '독일': '德国', '프랑스': '法国',
    '아르헨티나': '阿根廷', '브라질': '巴西',
    '첫 골': '首个进球', '첫 승리': '首场胜利', '연속 3골': '连进3球', '수비수 골': '后卫进球',
    '5초 골': '5秒进球', '벽 맞고 골': '撞墙进球', '무실점 승리': '零失球胜利', '골키퍼 골': '门将进球',
    '역전승': '逆转胜', '5연승': '5连胜', '100골': '进100球',
    '가로 화면에서 하는 게임입니다': '这款游戏要横屏玩',
    '가로로 돌리기': '切换横屏',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': '按钮没反应的话，请关掉手机的旋转锁定，再把手机横过来',
    '그래도 세로로 하기': '还是竖屏玩',
  };
  // 일본어 사전
  const J = {
    '테이블축구게임': 'テーブルサッカー',
    '테이블 축구': 'テーブルサッカー',
    '상점': 'ショップ',
    '미션': 'ミッション',
    '입기': '着る',
    '사용 중': '着用中',
    '홈': 'ホーム',
    '나': 'あなた',
    '계속': 'つづける',
    '이동': '移動',
    '킥': 'キック',
    '클릭': 'クリック',
    '속도': 'スピード',
    '파랑': 'ブルー', '빨강': 'レッド', '초록': 'グリーン', '노랑': 'イエロー', '주황': 'オレンジ', '하늘': 'スカイ',
    '보라': 'パープル', '분홍': 'ピンク', '흑표범': 'クロヒョウ', '백호': 'ビャッコ', '황금': 'ゴールド', '은하': '銀河',
    '일본': '日本', '멕시코': 'メキシコ', '미국': 'アメリカ', '네덜란드': 'オランダ', '포르투갈': 'ポルトガル',
    '크로아티아': 'クロアチア', '이탈리아': 'イタリア', '스페인': 'スペイン', '독일': 'ドイツ', '프랑스': 'フランス',
    '아르헨티나': 'アルゼンチン', '브라질': 'ブラジル',
    '첫 골': '初ゴール', '첫 승리': '初勝利', '연속 3골': '3連続ゴール', '수비수 골': 'DFゴール',
    '5초 골': '5秒ゴール', '벽 맞고 골': '壁当てゴール', '무실점 승리': '完封勝利', '골키퍼 골': 'GKゴール',
    '역전승': '逆転勝利', '5연승': '5連勝', '100골': '100ゴール',
    '가로 화면에서 하는 게임입니다': 'このゲームは横画面で遊びます',
    '가로로 돌리기': '横向きにする',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': 'ボタンが効かないときは、画面の回転ロックを解除してスマホを横にしてください',
    '그래도 세로로 하기': 'このまま縦で遊ぶ',
  };
  // 포르투갈어(브라질) 사전
  const P = {
    '테이블축구게임': 'PEBOLIM',
    '테이블 축구': 'PEBOLIM',
    '상점': 'LOJA',
    '미션': 'MISSÕES',
    '입기': 'VESTIR',
    '사용 중': 'USANDO',
    '홈': 'INÍCIO',
    '나': 'VOCÊ',
    '계속': 'CONTINUAR',
    '이동': 'MOVER',
    '킥': 'CHUTE',
    '클릭': 'CLIQUE',
    '속도': 'VELOC.',
    '파랑': 'Azul', '빨강': 'Vermelho', '초록': 'Verde', '노랑': 'Amarelo', '주황': 'Laranja', '하늘': 'Celeste',
    '보라': 'Roxo', '분홍': 'Rosa', '흑표범': 'Pantera', '백호': 'Tigre Branco', '황금': 'Ouro', '은하': 'Galáxia',
    '일본': 'Japão', '멕시코': 'México', '미국': 'EUA', '네덜란드': 'Holanda', '포르투갈': 'Portugal',
    '크로아티아': 'Croácia', '이탈리아': 'Itália', '스페인': 'Espanha', '독일': 'Alemanha', '프랑스': 'França',
    '아르헨티나': 'Argentina', '브라질': 'Brasil',
    '첫 골': 'Primeiro Gol', '첫 승리': 'Primeira Vitória', '연속 3골': '3 Gols Seguidos', '수비수 골': 'Gol do Zagueiro',
    '5초 골': 'Gol em 5 Segundos', '벽 맞고 골': 'Gol de Tabela', '무실점 승리': 'Vitória sem Sofrer Gol', '골키퍼 골': 'Gol do Goleiro',
    '역전승': 'Virada', '5연승': '5 Vitórias Seguidas', '100골': '100 Gols',
    '가로 화면에서 하는 게임입니다': 'Este jogo é jogado na horizontal',
    '가로로 돌리기': 'Virar na horizontal',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': 'Se o botão não funcionar, desative o bloqueio de rotação e vire o celular de lado',
    '그래도 세로로 하기': 'Jogar na vertical mesmo assim',
  };
  // 러시아어 사전
  const R = {
    '테이블축구게임': 'НАСТОЛЬНЫЙ ФУТБОЛ',
    '테이블 축구': 'НАСТОЛЬНЫЙ ФУТБОЛ',
    '상점': 'МАГАЗИН',
    '미션': 'ЗАДАНИЯ',
    '입기': 'НАДЕТЬ',
    '사용 중': 'НАДЕТО',
    '홈': 'МЕНЮ',
    '나': 'ТЫ',
    '계속': 'ДАЛЕЕ',
    '이동': 'ДВИЖЕНИЕ',
    '킥': 'УДАР',
    '클릭': 'КЛИК',
    '속도': 'СКОР.',
    '파랑': 'Синие', '빨강': 'Красные', '초록': 'Зелёные', '노랑': 'Жёлтые', '주황': 'Оранжевые', '하늘': 'Голубые',
    '보라': 'Фиолетовые', '분홍': 'Розовые', '흑표범': 'Пантеры', '백호': 'Белый тигр', '황금': 'Золото', '은하': 'Галактика',
    '일본': 'Япония', '멕시코': 'Мексика', '미국': 'США', '네덜란드': 'Нидерланды', '포르투갈': 'Португалия',
    '크로아티아': 'Хорватия', '이탈리아': 'Италия', '스페인': 'Испания', '독일': 'Германия', '프랑스': 'Франция',
    '아르헨티나': 'Аргентина', '브라질': 'Бразилия',
    '첫 골': 'Первый гол', '첫 승리': 'Первая победа', '연속 3골': '3 гола подряд', '수비수 골': 'Гол защитника',
    '5초 골': 'Гол за 5 секунд', '벽 맞고 골': 'Гол от борта', '무실점 승리': 'Сухая победа', '골키퍼 골': 'Гол вратаря',
    '역전승': 'Камбэк', '5연승': '5 побед подряд', '100골': '100 голов',
    '가로 화면에서 하는 게임입니다': 'В эту игру играют в горизонтальном режиме',
    '가로로 돌리기': 'Повернуть горизонтально',
    '단추가 안 먹으면 폰의 화면 회전 잠금을 풀고 눕혀 주세요': 'Если кнопка не работает, отключите блокировку поворота и положите телефон набок',
    '그래도 세로로 하기': 'Всё равно играть вертикально',
  };
  const T = EN ? D : ZH ? Z : JA ? J : PT ? P : RU ? R : null;
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!T || s == null) return s;
    return String(s).replace(re, (m) => (T[m] != null ? T[m] : m));
  };
  if (!T) return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'FOOSBALL';
  } else if (JA) {
    document.documentElement.lang = 'ja';
    document.title = 'テーブルサッカー';
    // 게임 글꼴엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Stylish';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}html[lang=ja] #logo{font-size:clamp(46px,10vw,116px)}html[lang=ja] .st em{width:50px;white-space:nowrap}`;
    document.head.appendChild(st);
  } else if (PT || RU) {
    document.documentElement.lang = PT ? 'pt-BR' : 'ru';
    document.title = PT ? 'PEBOLIM' : 'НАСТОЛЬНЫЙ ФУТБОЛ';
    // 게임 글꼴에 없는 악센트 라틴·키릴 글자를 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Stylish';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${lf};unicode-range:${ur}}html[lang=ru] #logo{white-space:normal}@media (max-height:520px){html[lang=ru] #logo{font-size:clamp(36px,7.5vw,90px)}}html[lang=pt-BR] .st em{width:50px;font-size:10px;white-space:nowrap}`;
    document.head.appendChild(st);
  } else {
    document.documentElement.lang = 'zh-CN';
    document.title = '桌上足球';
    // 게임 글꼴(Stylish·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'Stylish';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zb};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  const fix = (n) => {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { const v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (const c of n.childNodes) fix(c);
    }
  };
  const start = () => {
    fix(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();
