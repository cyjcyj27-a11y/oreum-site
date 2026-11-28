// 언어: 주소에 ?lang=en 일 때만 영어, ?lang=zh 일 때만 중국어.
(function () {
  const EN = (window.EN = /[?&]lang=en\b/.test(location.search));
  const Q = new URLSearchParams(location.search).get('lang');
  const ZH = (window.ZH = !EN && Q === 'zh');
  const LG = (window.LG = EN ? 'en' : ['zh', 'ja', 'pt', 'ru'].includes(Q) ? Q : 'ko');
  if (LG === 'ko' || LG === 'en') {
    window.L = (ko, en) => (EN ? en : ko);
    if (EN) { document.documentElement.lang = 'en'; document.title = 'HOTTEOK MAKER'; }
    return;
  }
  // 중국어: 한국어 원문을 열쇠로 찾고, 숫자가 섞인 문장은 틀로 바꾼다. 못 찾으면 영어.
  const Z = {
    '호떡만들기 게임': '糖饼摊', '호떡': '糖饼',
    '코인': '金币', '코인 ': '金币 ', '손님': '客人', '화남': '生气', '기름': '油', '꿀타임': '蜂蜜时间',
    '누르기: 통·도구 · 끌기: 옮기기 · 누르개 끌어다 꾹: 누르기 · 동그랗게: 오므리기 · O 기름 · Space 꿀타임':
      '点击：料盒·工具 · 拖动：移动 · 把压板拖上去按住：压扁 · 画圈：收口 · O 加油 · Space 蜂蜜时间',
    '이어하기': '继续游戏', '처음부터': '从头开始',
    '반죽을 판으로 옮기고 설탕 두 숟갈, 동그랗게 문질러 오므려요': '把面团拖到案板上，放两勺糖，画圈揉一揉收口',
    '철판에 올리고 고리가 초록이 되면 톡 눌러 뒤집어요': '放上铁板，圆圈变绿时轻点一下翻面',
    '누르개를 잡아 호떡 위에서 꾹, 초록에서 떼요. 너무 오래 누르면 터져요': '拿起压板在糖饼上按住，变绿就松手。按太久会爆开',
    '쟁반에서 쓱 갈라 씨앗을 넣고 손님에게 끌어다 줘요': '在托盘上划开，放进瓜子，再拖给客人',
    '망친 호떡은 왼쪽 통에 끌어다 버려요': '做坏的糖饼拖到左边的桶里扔掉',
    '상점': '商店', '처음 화면': '返回标题', '처음으로': '返回标题', '저장': '保存', '공유': '分享',
    '폰을 세로로 돌려 주세요': '请把手机竖过来',
    '마지막 날': '最后一天', '영화제 밤': '电影节之夜', '바삭하게': '酥脆款', '흥!': '哼!', '동글!': '圆啦!', '터짐!': '爆了!',
    '판 호떡': '卖出糖饼', '개': '个', '판 돈': '营业额', '팁': '小费', '주소를 복사했습니다': '链接已复制',
    '식용유': '食用油', '차림표': '菜单', '부산 명물': '釜山名吃', '해바라기씨': '葵花籽',
    '남포동 호떡 명인': '南浦洞糖饼大师', '부산 명물 호떡집': '釜山名店糖饼摊', '줄 서는 호떡집': '排长队的糖饼摊', '동네 호떡 아저씨': '街坊糖饼大叔',
    '번 코인': '赚到金币', '탄 호떡': '烤焦糖饼', '너는 몇 개 구울 수 있을까?': '你能烤出多少个？',
    '찹쌀': '糯米', '녹차': '绿茶', '흑미': '黑米', '흑설탕': '红糖', '팥': '红豆', '콘치즈': '玉米芝士', '잡채': '杂菜',
    '꿀호떡': '蜂蜜糖饼', '씨앗호떡': '瓜子糖饼', '씨앗 듬뿍': '瓜子加量', '단팥호떡': '红豆糖饼', '녹차호떡': '绿茶糖饼',
    '콘치즈호떡': '玉米芝士糖饼', '야채호떡': '杂菜糖饼', '흑미호떡': '黑米糖饼', '공갈호떡': '空心糖饼',
    '철판 넓히기': '加宽铁板', '호떡 굽는 칸': '烤糖饼的格子', '칸': '格',
    '화력': '火力', '빨리 익음': '熟得更快', '누르개': '压板', '알맞게 누르기 쉬움': '更容易压得刚好',
    '큰 기름병': '大油瓶', '기름이 덜 줄어듦': '油用得更慢', '난로': '暖炉', '손님이 오래 기다림': '客人等得更久',
    '간판 전구': '招牌灯泡', '팁이 늚': '小费变多',
  };
  const PAT = [
    [/^(\d+)일차$/, '第$1天'],
    [/^호떡만들기 게임 14일 장사 끝! 호떡 (\d+)개, PERFECT (\d+)% · (.*)$/, '糖饼摊 14天营业结束！卖出糖饼 $1个，PERFECT $2% · $3'],
  ];
  // 일본어·포르투갈어(브라질)·러시아어: 중국어와 같은 열쇠
  const JA = {
    '호떡만들기 게임': 'ホットク屋さん', '호떡': 'ホットク',
    '코인': 'コイン', '코인 ': 'コイン ', '손님': 'お客', '화남': '怒り', '기름': '油', '꿀타임': 'ハニータイム',
    '누르기: 통·도구 · 끌기: 옮기기 · 누르개 끌어다 꾹: 누르기 · 동그랗게: 오므리기 · O 기름 · Space 꿀타임':
      'タップ：容器・道具 · ドラッグ：移動 · 押し板をドラッグして長押し：押す · 円を描く：包む · O 油 · Space ハニータイム',
    '이어하기': '続きから', '처음부터': '最初から',
    '반죽을 판으로 옮기고 설탕 두 숟갈, 동그랗게 문질러 오므려요': '生地を台に移して砂糖を2さじ、くるくるこすって包もう',
    '철판에 올리고 고리가 초록이 되면 톡 눌러 뒤집어요': '鉄板にのせて、輪が緑になったらタップで裏返そう',
    '누르개를 잡아 호떡 위에서 꾹, 초록에서 떼요. 너무 오래 누르면 터져요': '押し板をつかんでホットクの上でぎゅっ、緑で離そう。押しすぎると破裂するよ',
    '쟁반에서 쓱 갈라 씨앗을 넣고 손님에게 끌어다 줘요': 'トレーでサッと切って種を入れ、お客さんにドラッグして渡そう',
    '망친 호떡은 왼쪽 통에 끌어다 버려요': '失敗したホットクは左のゴミ箱へドラッグして捨てよう',
    '상점': 'ショップ', '처음 화면': 'タイトルへ', '처음으로': 'タイトルへ', '저장': '保存', '공유': 'シェア',
    '폰을 세로로 돌려 주세요': 'スマホを縦にしてください',
    '마지막 날': '最終日', '영화제 밤': '映画祭の夜', '바삭하게': 'カリカリ', '흥!': 'フン!', '동글!': 'まんまる!', '터짐!': '破裂!',
    '판 호떡': '売ったホットク', '개': '個', '판 돈': '売上', '팁': 'チップ', '주소를 복사했습니다': 'リンクをコピーしました',
    '식용유': '食用油', '차림표': 'メニュー', '부산 명물': '釜山名物', '해바라기씨': 'ひまわり種',
    '남포동 호떡 명인': '南浦洞ホットク名人', '부산 명물 호떡집': '釜山名物のホットク屋', '줄 서는 호떡집': '行列のできるホットク屋', '동네 호떡 아저씨': '近所のホットクおじさん',
    '번 코인': '稼いだコイン', '탄 호떡': '焦げたホットク', '너는 몇 개 구울 수 있을까?': 'キミは何個焼けるかな?',
    '찹쌀': 'もち米', '녹차': '抹茶', '흑미': '黒米', '흑설탕': '黒糖', '팥': 'あんこ', '콘치즈': 'コーンチーズ', '잡채': 'チャプチェ',
    '꿀호떡': 'はちみつ', '씨앗호떡': '種入り', '씨앗 듬뿍': '種たっぷり', '단팥호떡': 'あんこ', '녹차호떡': '抹茶',
    '콘치즈호떡': 'コーンチーズ', '야채호떡': '野菜', '흑미호떡': '黒米', '공갈호떡': 'からっぽ',
    '철판 넓히기': '鉄板を広げる', '호떡 굽는 칸': 'ホットクを焼く枠', '칸': '枠',
    '화력': '火力', '빨리 익음': '早く焼ける', '누르개': '押し板', '알맞게 누르기 쉬움': 'ちょうどよく押しやすい',
    '큰 기름병': '大きな油ボトル', '기름이 덜 줄어듦': '油が減りにくい', '난로': 'ストーブ', '손님이 오래 기다림': 'お客が長く待ってくれる',
    '간판 전구': '看板の電球', '팁이 늚': 'チップが増える',
  };
  const PT = {
    '호떡만들기 게임': 'Hotteok na Chapa', '호떡': 'HOTTEOK',
    '코인': 'Moedas', '코인 ': 'Moedas ', '손님': 'Clientes', '화남': 'Bravos', '기름': 'Óleo', '꿀타임': 'Mel',
    '누르기: 통·도구 · 끌기: 옮기기 · 누르개 끌어다 꾹: 누르기 · 동그랗게: 오므리기 · O 기름 · Space 꿀타임':
      'Clique: potes·ferramentas · Arraste: mover · Arraste a prensa e segure: prensar · Círculos: fechar · O: óleo · Space: hora do mel',
    '이어하기': 'Continuar', '처음부터': 'Novo jogo',
    '반죽을 판으로 옮기고 설탕 두 숟갈, 동그랗게 문질러 오므려요': 'Leve a massa para a tábua, ponha 2 colheres de açúcar e esfregue em círculos para fechar',
    '철판에 올리고 고리가 초록이 되면 톡 눌러 뒤집어요': 'Coloque na chapa e toque para virar quando o anel ficar verde',
    '누르개를 잡아 호떡 위에서 꾹, 초록에서 떼요. 너무 오래 누르면 터져요': 'Pegue a prensa, segure sobre o hotteok e solte no verde. Se apertar demais, ele estoura',
    '쟁반에서 쓱 갈라 씨앗을 넣고 손님에게 끌어다 줘요': 'Corte na bandeja com um deslize, ponha as sementes e arraste até o cliente',
    '망친 호떡은 왼쪽 통에 끌어다 버려요': 'Hotteok estragado? Arraste para a lixeira à esquerda',
    '상점': 'Loja', '처음 화면': 'Início', '처음으로': 'Início', '저장': 'Salvar', '공유': 'Compartilhar',
    '폰을 세로로 돌려 주세요': 'Vire o celular na vertical',
    '마지막 날': 'Último dia', '영화제 밤': 'Noite do festival de cinema', '바삭하게': 'Extra crocante', '흥!': 'Hunf!', '동글!': 'Redondo!', '터짐!': 'Estourou!',
    '판 호떡': 'Vendidos', '개': '', '판 돈': 'Vendas', '팁': 'Gorjetas', '주소를 복사했습니다': 'Link copiado',
    '식용유': 'ÓLEO', '차림표': 'CARDÁPIO', '부산 명물': 'Famoso de Busan', '해바라기씨': 'SEMENTES',
    '남포동 호떡 명인': 'Mestre do Hotteok de Nampo', '부산 명물 호떡집': 'Barraca famosa de Busan', '줄 서는 호떡집': 'Barraca com fila', '동네 호떡 아저씨': 'Tio do hotteok do bairro',
    '번 코인': 'Moedas ganhas', '탄 호떡': 'Queimados', '너는 몇 개 구울 수 있을까?': 'Quantos você consegue fazer?',
    '찹쌀': 'Arroz', '녹차': 'Chá verde', '흑미': 'Arroz preto', '흑설탕': 'Açúcar mascavo', '팥': 'Feijão vermelho', '콘치즈': 'Milho e queijo', '잡채': 'Japchae',
    '꿀호떡': 'Mel', '씨앗호떡': 'Sementes', '씨앗 듬뿍': 'Mais sementes', '단팥호떡': 'Feijão doce', '녹차호떡': 'Chá verde',
    '콘치즈호떡': 'Milho e queijo', '야채호떡': 'Legumes', '흑미호떡': 'Arroz preto', '공갈호떡': 'Bolha',
    '철판 넓히기': 'Chapa maior', '호떡 굽는 칸': 'Vagas na chapa', '칸': ' vagas',
    '화력': 'Fogo', '빨리 익음': 'Assa mais rápido', '누르개': 'Prensa', '알맞게 누르기 쉬움': 'Mais fácil prensar no ponto',
    '큰 기름병': 'Garrafa grande de óleo', '기름이 덜 줄어듦': 'O óleo dura mais', '난로': 'Aquecedor', '손님이 오래 기다림': 'Clientes esperam mais',
    '간판 전구': 'Lâmpadas do letreiro', '팁이 늚': 'Mais gorjetas',
  };
  const RU = {
    '호떡만들기 게임': 'Хотток-мастер', '호떡': 'ХОТТОК',
    '코인': 'Монеты', '코인 ': 'Монеты: ', '손님': 'Гости', '화남': 'Злые', '기름': 'Масло', '꿀타임': 'Мёд',
    '누르기: 통·도구 · 끌기: 옮기기 · 누르개 끌어다 꾹: 누르기 · 동그랗게: 오므리기 · O 기름 · Space 꿀타임':
      'Клик: банки·инструменты · Тяни: двигать · Тяни пресс и держи: прижать · Круги: защипнуть · O: масло · Space: медовое время',
    '이어하기': 'Продолжить', '처음부터': 'Новая игра',
    '반죽을 판으로 옮기고 설탕 두 숟갈, 동그랗게 문질러 오므려요': 'Перенеси тесто на доску, положи 2 ложки сахара и потри по кругу, чтобы защипнуть',
    '철판에 올리고 고리가 초록이 되면 톡 눌러 뒤집어요': 'Положи на плиту и коснись, чтобы перевернуть, когда кольцо станет зелёным',
    '누르개를 잡아 호떡 위에서 꾹, 초록에서 떼요. 너무 오래 누르면 터져요': 'Возьми пресс, прижми хотток и отпусти на зелёном. Передержишь — лопнет',
    '쟁반에서 쓱 갈라 씨앗을 넣고 손님에게 끌어다 줘요': 'Разрежь на подносе взмахом, добавь семечки и перетащи гостю',
    '망친 호떡은 왼쪽 통에 끌어다 버려요': 'Испорченный хотток перетащи в ведро слева',
    '상점': 'Магазин', '처음 화면': 'В меню', '처음으로': 'В меню', '저장': 'Сохранить', '공유': 'Поделиться',
    '폰을 세로로 돌려 주세요': 'Поверни телефон вертикально',
    '마지막 날': 'Финал', '영화제 밤': 'Ночь кинофестиваля', '바삭하게': 'Хрустящий', '흥!': 'Хм!', '동글!': 'Кругло!', '터짐!': 'Лопнул!',
    '판 호떡': 'Продано', '개': '', '판 돈': 'Выручка', '팁': 'Чаевые', '주소를 복사했습니다': 'Ссылка скопирована',
    '식용유': 'МАСЛО', '차림표': 'МЕНЮ', '부산 명물': 'Хит Пусана', '해바라기씨': 'СЕМЕЧКИ',
    '남포동 호떡 명인': 'Мастер хоттоков Нампходона', '부산 명물 호떡집': 'Знаменитая лавка Пусана', '줄 서는 호떡집': 'Лавка с очередью', '동네 호떡 아저씨': 'Дядька с хоттоками',
    '번 코인': 'Заработано', '탄 호떡': 'Сгорело', '너는 몇 개 구울 수 있을까?': 'А сколько испечёшь ты?',
    '찹쌀': 'Рис', '녹차': 'Зелёный чай', '흑미': 'Чёрный рис', '흑설탕': 'Сахар', '팥': 'Красная фасоль', '콘치즈': 'Кукуруза с сыром', '잡채': 'Чапчхэ',
    '꿀호떡': 'Медовый', '씨앗호떡': 'С семечками', '씨앗 듬뿍': 'Много семечек', '단팥호떡': 'С фасолью', '녹차호떡': 'Зелёный чай',
    '콘치즈호떡': 'Кукуруза-сыр', '야채호떡': 'Овощной', '흑미호떡': 'Чёрный рис', '공갈호떡': 'Пустышка',
    '철판 넓히기': 'Большая плита', '호떡 굽는 칸': 'Мест на плите', '칸': ' шт.',
    '화력': 'Огонь', '빨리 익음': 'Жарит быстрее', '누르개': 'Пресс', '알맞게 누르기 쉬움': 'Легче прижать как надо',
    '큰 기름병': 'Большая бутыль масла', '기름이 덜 줄어듦': 'Масло тратится медленнее', '난로': 'Обогреватель', '손님이 오래 기다림': 'Гости ждут дольше',
    '간판 전구': 'Лампочки вывески', '팁이 늚': 'Больше чаевых',
  };
  // 러시아어 수 붙임: 1 / 2~4 / 5~
  const ruN = (n, a, b, c) => { n = Math.abs(n) % 100; const d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d >= 2 && d <= 4 ? b : c; };
  const PATS = {
    zh: PAT,
    ja: [[/^(\d+)일차$/, '$1日目'], [/^호떡만들기 게임 14일 장사 끝! 호떡 (\d+)개, PERFECT (\d+)% · (.*)$/, 'ホットク屋さん 14日間の営業終了！ホットク $1個、PERFECT $2% · $3']],
    pt: [[/^(\d+)일차$/, 'Dia $1'], [/^호떡만들기 게임 14일 장사 끝! 호떡 (\d+)개, PERFECT (\d+)% · (.*)$/, 'Hotteok na Chapa: 14 dias de barraca! $1 hotteoks, PERFECT $2% · $3']],
    ru: [[/^(\d+)일차$/, 'День $1'], [/^호떡만들기 게임 14일 장사 끝! 호떡 (\d+)개, PERFECT (\d+)% · (.*)$/, (m, a, b, c) => 'Хотток-мастер: 14 дней позади! ' + a + ' ' + ruN(+a, 'хотток', 'хоттока', 'хоттоков') + ', PERFECT ' + b + '% · ' + c]],
  };
  const DICT = { zh: Z, ja: JA, pt: PT, ru: RU }[LG], PL = PATS[LG];
  const L = (window.L = (ko, en) => {
    if (DICT[ko] !== undefined) return DICT[ko];
    for (const p of PL) if (p[0].test(ko)) return ko.replace(p[0], p[1]);
    return en;
  });
  window.SIGNS_ZH = ['汤饭', '药店', '歌厅', '茶房', '生鱼片', '酒店', 'BIFF', '烤排骨', '南浦洞', '小吃', '剧场'];
  if (LG === 'ja') window.SIGNS_LG = ['クッパ', '薬局', 'カラオケ', '喫茶', '刺身', 'ホテル', 'BIFF', 'カルビ', '南浦洞', '軽食', '劇場'];
  // 포르투갈어·러시아어 간판은 가로로만 쓴다
  if (LG === 'pt') { window.SIGNS_LG = ['SOPA', 'FARMÁCIA', 'KARAOKÊ', 'CAFÉ', 'PEIXE', 'HOTEL', 'BIFF', 'BBQ', 'NAMPO', 'LANCHES', 'CINEMA']; window.SIGNS_LAT = true; }
  if (LG === 'ru') { window.SIGNS_LG = ['СУП', 'АПТЕКА', 'КАРАОКЕ', 'КАФЕ', 'РЫБА', 'ОТЕЛЬ', 'BIFF', 'ГРИЛЬ', 'НАМПО', 'ЗАКУСКИ', 'КИНО']; window.SIGNS_LAT = true; }
  document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', pt: 'pt-BR', ru: 'ru' }[LG];
  document.title = { zh: '糖饼摊', ja: JA['호떡만들기 게임'], pt: PT['호떡만들기 게임'], ru: RU['호떡만들기 게임'] }[LG];
  const st = document.createElement('style');
  if (LG === 'zh') {
    // 게임 글꼴(Ttl·Ui)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    const zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const zb = "local('PingFang SC Semibold'),local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('Microsoft YaHei UI Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('Source Han Sans SC Bold')," + zf;
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    st.textContent = `@font-face{font-family:'Ttl';src:${zb};unicode-range:${ur}}@font-face{font-family:'Ui';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
  } else if (LG === 'ja') {
    // 게임 글꼴엔 가나·한자가 없다 → 같은 이름에 일본어 기기 글꼴을 덧붙인다
    const jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    const ur = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    st.textContent = `@font-face{font-family:'Ttl';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${jf};unicode-range:${ur}}html[lang=ja] *{word-break:normal!important}`;
  } else {
    // 악센트 라틴 글자·키릴 글자는 기기 글꼴로 채운다
    const lf = "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    st.textContent = `@font-face{font-family:'Ttl';src:${lf};unicode-range:${ur}}@font-face{font-family:'Ui';src:${lf};unicode-range:${ur}}`;
  }
  document.head.appendChild(st);
  // 화면의 고정 글자(data-en 이 붙은 것과 첫 날 표시)를 중국어로
  document.querySelectorAll('[data-en]').forEach((e) => { e.textContent = L(e.textContent.trim(), e.dataset.en); });
  const vd = document.getElementById('vDay'); if (vd) vd.textContent = L(vd.textContent.trim(), vd.textContent);
})();
