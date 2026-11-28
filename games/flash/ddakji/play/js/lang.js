/* 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어, ja·pt·ru 는 그 언어 */
(function () {
  var q = ''; try { q = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
  var en = q === 'en', zh = q === 'zh';
  if (en) document.documentElement.lang = 'en';
  var D = { '딱지치기': 'DDAKJI', '지도': 'MAP', '가방': 'BAG', '도감': 'BOOK', '처음으로': 'HOME', '시작': 'START', '이어하기': 'CONTINUE', '새로 시작': 'NEW GAME',
    '무게': 'Weight', '두께': 'Thick', '내 딱지': 'Mine', '내 차례': 'MY TURN', '골목': 'Alley', '놀이터': 'Playground', '운동장': 'Schoolyard', '문방구 앞': 'Stationery Shop', '딱지왕': 'DDAKJI KING' };
  // 중국어: 한국어 문장을 열쇠로 찾는다. 이름 속 U+200B 는 줄이 바뀔 자리
  var Z = { '딱지치기': '拍纸牌', '지도': '地图', '가방': '背包', '도감': '图鉴', '처음으로': '返回标题', '시작': '开始', '이어하기': '继续', '새로 시작': '重新开始',
    '무게': '重量', '두께': '厚度', '내 딱지': '我的纸牌', '내 차례': '我的回合', '골목': '小巷', '놀이터': '游乐场', '운동장': '操场', '문방구 앞': '文具店门口', '딱지왕': '纸牌王',
    '빨간 색종이': '红色彩纸', '노란 색종이': '黄色彩纸', '파란 색종이': '蓝色彩纸', '신문지': '旧报纸', '공책 표지': '笔记本​封面', '전단지': '传单', '달력': '日历', '시험지': '试卷',
    '갱지': '草纸', '우유팩': '牛奶盒', '만화 잡지': '漫画​杂志', '과자 상자': '零食盒', '교과서 표지': '课本​封面', '물방울 포장지': '波点​包装纸', '한지': '韩纸', '골판지': '瓦楞纸',
    '꽃무늬 벽지': '碎花​墙纸', '사진 잡지': '画报​杂志', '두꺼운 달력': '厚日历', '학습지': '练习册', '크레파스 상자': '蜡笔盒', '보드게임 상자': '桌游盒', '스티커 판': '贴纸板',
    '신문 광고면': '报纸​广告版', '별 포장지': '星星​包装纸', '체크 포장지': '格子​包装纸', '도화지': '图画纸', '은박지': '锡纸', '금박지': '金箔纸', '빨간 금테 딱지': '红色金边​纸牌',
    '공룡 딱지': '恐龙​纸牌', '로봇 딱지': '机器人​纸牌', '무지개 딱지': '彩虹​纸牌', '반짝이 딱지': '闪闪​纸牌', '먹지 딱지': '复写纸​纸牌', '황금딱지': '黄金​纸牌',
    '코찔찔이 민수': '鼻涕虫​民秀', '막내 지혜': '老幺​智慧', '안경 동현': '眼镜​东贤', '떡볶이 은지': '炒年糕​恩智', '쌍둥이 형': '双胞胎​哥哥', '골목대장 왕발': '巷子老大​大脚',
    '모래성 수아': '沙堡​秀雅', '철봉 준호': '单杠​俊浩', '미끄럼틀 하늘': '滑梯​小天', '개구쟁이 태풍': '淘气包​台风', '정글짐 소희': '攀爬架​素熙', '그네 대장': '秋千​大王',
    '반장 서윤': '班长​瑞允', '축구부 민재': '足球队​珉载', '줄넘기 다은': '跳绳​多恩', '피구왕 통키': '躲避球王​通奇', '전학생 레오': '转学生​利奥', '6학년 형': '六年级​大哥',
    '뽑기왕 지호': '抽奖王​智浩', '오락실 형': '游戏厅​大哥', '구슬왕 보람': '弹珠王​宝蓝', '딱지 수집가': '纸牌​收藏家', '중학생 형': '初中生​大哥', '문방구 아들': '文具店​少爷',
    '에잇!': '嘿！', '간다~': '来咯~', '헤헤 안 넘어가지롱': '嘿嘿翻不过来吧', '바보~': '笨蛋~', '아 내 딱지!': '啊我的纸牌！', '치사해!': '耍赖！',
    '나도 한다!': '我也来！', '얍!': '呀！', '메롱~': '略略略~', '그것도 못 해?': '这都不会？', '엄마한테 이를 거야!': '我要告诉妈妈！', '흐엥': '呜哇',
    '각도 계산 끝': '角度计算完毕', '정확히 여기': '就是这里', '역학적으로 불가능': '力学上不可能', '힘이 모자라': '力气不够', '계산이 틀렸다': '算错了', '오차 범위 밖': '超出误差范围',
    '각오해라': '做好觉悟吧', '이게 진짜 딱지다': '这才叫拍纸牌', '꼬맹이 주제에': '小屁孩还想赢', '어림없지': '门都没有', '제법인데?': '有两下子？', '이럴 리가': '怎么可能' };
  // 일본어·포르투갈어(브라질)·러시아어: 같은 한국어 문장을 열쇠로 찾는다
  var J = {
    '딱지치기': 'メンコ', '지도': 'マップ', '가방': 'カバン', '도감': '図鑑', '처음으로': 'タイトルへ', '시작': 'スタート', '이어하기': 'つづきから', '새로 시작': 'はじめから', '무게': '重さ', '두께': '厚さ', '내 딱지': 'マイメンコ',
    '내 차례': 'キミの番', '골목': '路地', '놀이터': '公園', '운동장': '校庭', '문방구 앞': '文房具屋の前', '딱지왕': 'メンコ王', '빨간 색종이': '赤い折り紙', '노란 색종이': '黄色い折り紙', '파란 색종이': '青い折り紙', '신문지': '新聞紙',
    '공책 표지': 'ノートの​表紙', '전단지': 'チラシ', '달력': 'カレンダー', '시험지': 'テスト用紙', '갱지': 'わら半紙', '우유팩': '牛乳パック', '만화 잡지': 'マンガ​雑誌', '과자 상자': 'お菓子の​箱', '교과서 표지': '教科書の​表紙',
    '물방울 포장지': '水玉の​包装紙', '한지': '韓紙', '골판지': 'ダンボール', '꽃무늬 벽지': '花柄の​壁紙', '사진 잡지': 'グラビア​雑誌', '두꺼운 달력': '分厚い​カレンダー', '학습지': 'ドリル', '크레파스 상자': 'クレヨンの​箱',
    '보드게임 상자': 'ボードゲームの​箱', '스티커 판': 'シール​台紙', '신문 광고면': '新聞の​広告面', '별 포장지': '星柄の​包装紙', '체크 포장지': 'チェックの​包装紙', '도화지': '画用紙', '은박지': '銀紙', '금박지': '金紙',
    '빨간 금테 딱지': '赤い金縁​メンコ', '공룡 딱지': '恐竜​メンコ', '로봇 딱지': 'ロボット​メンコ', '무지개 딱지': '虹色​メンコ', '반짝이 딱지': 'キラキラ​メンコ', '먹지 딱지': 'カーボン​メンコ', '황금딱지': '黄金​メンコ', '코찔찔이 민수': '鼻たれ​ミンス',
    '막내 지혜': '末っ子​ジヘ', '안경 동현': 'メガネの​ドンヒョン', '떡볶이 은지': 'トッポッキ​ウンジ', '쌍둥이 형': '双子の​兄ちゃん', '골목대장 왕발': '路地の大将​デカ足', '모래성 수아': '砂のお城の​スア', '철봉 준호': '鉄棒の​ジュノ',
    '미끄럼틀 하늘': 'すべり台の​ハヌル', '개구쟁이 태풍': 'いたずらっ子​テプン', '정글짐 소희': 'ジャングルジムの​ソヒ', '그네 대장': 'ブランコの​大将', '반장 서윤': '学級委員の​ソユン', '축구부 민재': 'サッカー部の​ミンジェ', '줄넘기 다은': 'なわとびの​ダウン',
    '피구왕 통키': 'ドッジボール王​トンキ', '전학생 레오': '転校生の​レオ', '6학년 형': '6年生の​兄ちゃん', '뽑기왕 지호': 'ガチャ王​ジホ', '오락실 형': 'ゲーセンの​兄ちゃん', '구슬왕 보람': 'ビー玉王​ボラム', '딱지 수집가': 'メンコ​コレクター',
    '중학생 형': '中学生の​兄ちゃん', '문방구 아들': '文房具屋の​息子', '에잇!': 'えいっ!', '간다~': 'いくよ~', '헤헤 안 넘어가지롱': 'へへ、ひっくり返らないよーだ', '바보~': 'バーカ~', '아 내 딱지!': 'あっ、ぼくのメンコ!', '치사해!': 'ずるい!',
    '나도 한다!': 'ぼくもやる!', '얍!': 'やっ!', '메롱~': 'べーっだ~', '그것도 못 해?': 'そんなこともできないの?', '엄마한테 이를 거야!': 'ママに言いつけてやる!', '흐엥': 'ふえーん', '각도 계산 끝': '角度計算、完了', '정확히 여기': 'ちょうどここ',
    '역학적으로 불가능': '力学的に不可能', '힘이 모자라': '力が足りない', '계산이 틀렸다': '計算ミスだ', '오차 범위 밖': '誤差の範囲外', '각오해라': '覚悟しろ', '이게 진짜 딱지다': 'これが本物のメンコだ', '꼬맹이 주제에': 'チビのくせに',
    '어림없지': '甘いな', '제법인데?': 'やるじゃん?', '이럴 리가': 'そんなバカな' };
  var P = {
    '딱지치기': 'DDAKJI', '지도': 'MAPA', '가방': 'MOCHILA', '도감': 'ÁLBUM', '처음으로': 'INÍCIO', '시작': 'COMEÇAR', '이어하기': 'CONTINUAR', '새로 시작': 'NOVO JOGO', '무게': 'Peso',
    '두께': 'Grossura', '내 딱지': 'Meus', '내 차례': 'SUA VEZ', '골목': 'Beco', '놀이터': 'Parquinho', '운동장': 'Pátio da escola', '문방구 앞': 'Papelaria', '딱지왕': 'REI DO DDAKJI',
    '빨간 색종이': 'Papel vermelho', '노란 색종이': 'Papel amarelo', '파란 색종이': 'Papel azul', '신문지': 'Jornal', '공책 표지': 'Capa de caderno', '전단지': 'Panfleto', '달력': 'Calendário',
    '시험지': 'Folha de prova', '갱지': 'Papel pardo', '우유팩': 'Caixa de leite', '만화 잡지': 'Gibi', '과자 상자': 'Caixa de biscoito', '교과서 표지': 'Capa de livro', '물방울 포장지': 'Papel de bolinhas',
    '한지': 'Papel hanji', '골판지': 'Papelão', '꽃무늬 벽지': 'Papel de parede florido', '사진 잡지': 'Revista de fotos', '두꺼운 달력': 'Calendário grosso', '학습지': 'Apostila',
    '크레파스 상자': 'Caixa de giz de cera', '보드게임 상자': 'Caixa de jogo', '스티커 판': 'Cartela de adesivos', '신문 광고면': 'Página de anúncios', '별 포장지': 'Papel de estrelas',
    '체크 포장지': 'Papel xadrez', '도화지': 'Papel de desenho', '은박지': 'Papel-alumínio', '금박지': 'Papel dourado', '빨간 금테 딱지': 'Ddakji vermelho com ouro', '공룡 딱지': 'Ddakji de dinossauro',
    '로봇 딱지': 'Ddakji de robô', '무지개 딱지': 'Ddakji arco-íris', '반짝이 딱지': 'Ddakji de glitter', '먹지 딱지': 'Ddakji de carbono', '황금딱지': 'Ddakji de ouro', '코찔찔이 민수': 'Minsu Ranhento',
    '막내 지혜': 'Jihye Caçula', '안경 동현': 'Donghyun de Óculos', '떡볶이 은지': 'Eunji Tteokbokki', '쌍둥이 형': 'Irmão Gêmeo', '골목대장 왕발': 'Pezão, Chefe do Beco', '모래성 수아': 'Sua do Castelo de Areia',
    '철봉 준호': 'Junho da Barra', '미끄럼틀 하늘': 'Haneul do Escorregador', '개구쟁이 태풍': 'Taepung Arteiro', '정글짐 소희': 'Sohee do Trepa-trepa', '그네 대장': 'Chefe do Balanço',
    '반장 서윤': 'Seoyun Representante', '축구부 민재': 'Minjae do Futebol', '줄넘기 다은': 'Daeun da Corda', '피구왕 통키': 'Tongki, Rei da Queimada', '전학생 레오': 'Leo, o Aluno Novo',
    '6학년 형': 'O Chefão do 6º Ano', '뽑기왕 지호': 'Jiho, Rei dos Prêmios', '오락실 형': 'O Cara do Fliperama', '구슬왕 보람': 'Boram, Rei das Bolinhas', '딱지 수집가': 'O Colecionador',
    '중학생 형': 'O Cara do 8º Ano', '문방구 아들': 'Filho da Papelaria', '에잇!': 'Toma!', '간다~': 'Lá vai~', '헤헤 안 넘어가지롱': 'Hehe, não virou!', '바보~': 'Bobinho~',
    '아 내 딱지!': 'Ah, meu ddakji!', '치사해!': 'Que injusto!', '나도 한다!': 'Minha vez!', '얍!': 'Iá!', '메롱~': 'Bléé~', '그것도 못 해?': 'Nem isso consegue?', '엄마한테 이를 거야!': 'Vou contar pra minha mãe!',
    '흐엥': 'Buááá', '각도 계산 끝': 'Ângulo calculado', '정확히 여기': 'Bem aqui', '역학적으로 불가능': 'Fisicamente impossível', '힘이 모자라': 'Faltou força', '계산이 틀렸다': 'Errei a conta',
    '오차 범위 밖': 'Fora da margem de erro', '각오해라': 'Se prepara', '이게 진짜 딱지다': 'Isso é ddakji de verdade', '꼬맹이 주제에': 'Pirralho atrevido', '어림없지': 'Nem pensar',
    '제법인데?': 'Nada mal, hein?', '이럴 리가': 'Não pode ser' };
  var R = {
    '딱지치기': 'ДДАКЧИ', '지도': 'КАРТА', '가방': 'СУМКА', '도감': 'АЛЬБОМ', '처음으로': 'В МЕНЮ', '시작': 'СТАРТ', '이어하기': 'ПРОДОЛЖИТЬ', '새로 시작': 'НОВАЯ ИГРА', '무게': 'Вес',
    '두께': 'Толщина', '내 딱지': 'Мои', '내 차례': 'ТВОЙ ХОД', '골목': 'Переулок', '놀이터': 'Площадка', '운동장': 'Школьный двор', '문방구 앞': 'У канцтоваров', '딱지왕': 'КОРОЛЬ ДДАКЧИ',
    '빨간 색종이': 'Красная бумага', '노란 색종이': 'Жёлтая бумага', '파란 색종이': 'Синяя бумага', '신문지': 'Газета', '공책 표지': 'Обложка тетради', '전단지': 'Листовка', '달력': 'Календарь',
    '시험지': 'Контрольная', '갱지': 'Серая бумага', '우유팩': 'Пакет молока', '만화 잡지': 'Журнал комиксов', '과자 상자': 'Коробка печенья', '교과서 표지': 'Обложка учебника',
    '물방울 포장지': 'Обёртка в горошек', '한지': 'Бумага ханджи', '골판지': 'Картон', '꽃무늬 벽지': 'Обои в цветочек', '사진 잡지': 'Фотожурнал', '두꺼운 달력': 'Толстый календарь',
    '학습지': 'Рабочая тетрадь', '크레파스 상자': 'Коробка мелков', '보드게임 상자': 'Коробка от настолки', '스티커 판': 'Лист наклеек', '신문 광고면': 'Рекламная полоса', '별 포장지': 'Обёртка со звёздами',
    '체크 포장지': 'Обёртка в клетку', '도화지': 'Ватман', '은박지': 'Фольга', '금박지': 'Золотая фольга', '빨간 금테 딱지': 'Красный ддакчи с золотом', '공룡 딱지': 'Ддакчи с динозавром',
    '로봇 딱지': 'Ддакчи с роботом', '무지개 딱지': 'Радужный ддакчи', '반짝이 딱지': 'Блестящий ддакчи', '먹지 딱지': 'Копирочный ддакчи', '황금딱지': 'Золотой ддакчи', '코찔찔이 민수': 'Сопливый Минсу',
    '막내 지혜': 'Малышка Джихе', '안경 동현': 'Очкарик Донхён', '떡볶이 은지': 'Ынджи-токпокки', '쌍둥이 형': 'Брат-близнец', '골목대장 왕발': 'Лапища, босс переулка', '모래성 수아': 'Суа с песочным замком',
    '철봉 준호': 'Джунхо с турника', '미끄럼틀 하늘': 'Ханыль с горки', '개구쟁이 태풍': 'Озорник Тхэпхун', '정글짐 소희': 'Сохи с лазалки', '그네 대장': 'Босс качелей', '반장 서윤': 'Староста Союн',
    '축구부 민재': 'Футболист Минджэ', '줄넘기 다은': 'Даын со скакалкой', '피구왕 통키': 'Король вышибал Тонки', '전학생 레오': 'Новенький Лео', '6학년 형': 'Шестиклассник',
    '뽑기왕 지호': 'Король призов Джихо', '오락실 형': 'Парень с автоматов', '구슬왕 보람': 'Король шариков Борам', '딱지 수집가': 'Коллекционер', '중학생 형': 'Восьмиклассник',
    '문방구 아들': 'Сынок из канцтоваров', '에잇!': 'Эх!', '간다~': 'Поехали~', '헤헤 안 넘어가지롱': 'Хе-хе, не перевернёшь!', '바보~': 'Дурачок~', '아 내 딱지!': 'А, мой ддакчи!',
    '치사해!': 'Нечестно!', '나도 한다!': 'Я тоже!', '얍!': 'Хоп!', '메롱~': 'Бе-бе-бе~', '그것도 못 해?': 'Даже так не можешь?', '엄마한테 이를 거야!': 'Я маме скажу!', '흐엥': 'Ы-ы-ы',
    '각도 계산 끝': 'Угол рассчитан', '정확히 여기': 'Точно сюда', '역학적으로 불가능': 'Физически невозможно', '힘이 모자라': 'Силы не хватило', '계산이 틀렸다': 'Ошибка в расчётах',
    '오차 범위 밖': 'Вне погрешности', '각오해라': 'Готовься', '이게 진짜 딱지다': 'Вот настоящий ддакчи', '꼬맹이 주제에': 'Куда тебе, мелкий', '어림없지': 'Не дождёшься', '제법인데?': 'А ты неплох?',
    '이럴 리가': 'Не может быть' };
  var X = q === 'ja' ? J : q === 'pt' ? P : q === 'ru' ? R : null;
  window.LANG = en ? 'en' : zh ? 'zh' : X ? q : 'ko';
  window.L = function (ko, enTxt) { if (zh) return Z[ko] != null ? Z[ko] : ko; if (X) return X[ko] != null ? X[ko] : enTxt != null ? enTxt : (D[ko] || ko); if (!en) return ko; return enTxt != null ? enTxt : (D[ko] || ko); };
  if (zh) {
    document.documentElement.lang = 'zh-CN';
    // 게임 글꼴(Osq·Elice)엔 한자가 없다: 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    var zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var st = document.createElement('style');
    st.textContent = "@font-face{font-family:'Osq';src:" + zb + ";unicode-range:" + ur + "}@font-face{font-family:'Elice';src:" + zf + ";unicode-range:" + ur + "}html[lang=zh-CN] *{word-break:normal!important}html[lang=zh-CN] .kid span,html[lang=zh-CN] .it span,html[lang=zh-CN] .card .n,html[lang=zh-CN] #oppN{word-break:keep-all!important}html[lang=zh-CN] .sheet h2,html[lang=zh-CN] .hd .btn{white-space:nowrap}@media (max-width:560px){html[lang=zh-CN] .hd .btn.sm{padding:8px 10px}}";
    document.head.appendChild(st);
  }
  if (X) {
    document.documentElement.lang = q === 'pt' ? 'pt-BR' : q;
    var st2 = document.createElement('style');
    if (q === 'ja') {
      // 게임 글꼴엔 가나·한자가 없다: 같은 이름에 일본어 기기 글꼴을 그 범위로만 덧붙인다
      var jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
      var jr = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
      st2.textContent = "@font-face{font-family:'Osq';src:" + jf + ";unicode-range:" + jr + "}@font-face{font-family:'Elice';src:" + jf + ";unicode-range:" + jr + "}html[lang=ja] *{word-break:normal!important}html[lang=ja] .kid span,html[lang=ja] .it span,html[lang=ja] .card .n,html[lang=ja] #oppN{word-break:keep-all!important}html[lang=ja] .sheet h2,html[lang=ja] .hd .btn{white-space:nowrap}@media (max-width:560px){html[lang=ja] .hd .btn.sm{padding:8px 10px}}";
    } else {
      // 게임 글꼴에 없는 악센트 라틴·키릴 글자는 기기 글꼴로 채운다
      var lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
      // Osq 는 굵은 제목 글꼴이라 굵은 기기 글꼴을 먼저 쓴다
      var lb = "local('Segoe UI Bold'),local('SegoeUI-Bold'),local('Roboto Bold'),local('Roboto-Bold'),local('Arial Bold'),local('Arial-BoldMT'),local('Helvetica Neue Bold'),local('HelveticaNeue-Bold')," + lf;
      var lr = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
      st2.textContent = "@font-face{font-family:'Osq';src:" + lb + ";unicode-range:" + lr + "}@font-face{font-family:'Elice';src:" + lf + ";unicode-range:" + lr + "}";
    }
    document.head.appendChild(st2);
  }
  if (en || zh || X) document.addEventListener('DOMContentLoaded', function () {
    var M = zh ? Z : X || D;
    document.title = zh ? '拍纸牌' : q === 'ja' ? 'メンコ' : q === 'ru' ? 'Ддакчи' : 'Ddakji';
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var t = n.nodeValue.trim(); if (M[t]) n.nodeValue = n.nodeValue.replace(t, M[t]); }
  });
})();
