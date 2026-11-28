// 5억년 버튼 — 숫자·글 데이터 (file:// 에서도 읽히게 평범한 script)
(function () {
  'use strict';
  const LANG = (function () {
    try {
      const q = new URLSearchParams(location.search).get('lang');
      // 언어는 주소로만 정한다(?lang=en 일 때만 영어). 기억해 두면 한국어 페이지에서 들어와도 영어로 뜬다(9/29 사장님 폰)
      try { localStorage.removeItem('button5.lang'); } catch (e) {}
      return ['en', 'zh', 'ja', 'pt', 'ru'].includes(q) ? q : 'ko';
    } catch (e) { return 'ko'; }
  })();
  // 중국어판: 한국어 원문을 열쇠로 찾는다
  const ZH = {
    '긁기': '刮', '세기': '数数', '파기': '挖', '쌓기': '堆', '걷기': '走', '혼잣말': '自言自语', '조각': '雕刻',
    '선': '线', '수': '数', '돌': '石', '층': '层', '낱말': '词', '조각상': '雕像',
    '치킨': '炸鸡', '강아지': '小狗', '원룸': '单间', '중고차': '二手车', '드라이브': '兜风', '해외여행': '出国旅行', '바다': '大海',
    '오피스텔': '公寓', '명품 시계': '名表', '초침': '秒针', '아파트': '高层住宅', '스포츠카': '跑车', '질주': '飙车',
    '펜트하우스': '顶层豪宅', '빌딩': '大楼', '무인도': '无人岛',
    '여기 누가 또 왔구나.': '又有人来了啊。',
    '나도 백만 원 때문에 눌렀다. 너도 그랬겠지.': '我也是为了一百万才按的。你也一样吧。',
    '돌아가면 다 잊는다. 그래서 바닥에 새긴다.': '回去就全忘了。所以刻在地上。',
    '처음 천만 년은 울었다. 다음 천만 년은 웃었다.': '头一千万年在哭。后一千万年在笑。',
    '바닥은 긁으면 파인다. 아주 천천히.': '地面刮了会凹下去。非常慢。',
    '숫자를 끝까지 세 보려 했다. 끝은 없었다.': '我想把数一直数到头。没有头。',
    '네가 쌓은 탑을 봤다. 잘 쌓았더라.': '看到你堆的塔了。堆得不错。',
    '버튼 값은 누를수록 오른다. 그쪽은 우리가 계속 누르길 바란다.': '按钮的价钱越按越高。那边希望我们一直按下去。',
    '바깥 우주는 백삼십팔억 년 되었다고 들었다.': '听说外面的宇宙有一百三十八亿年了。',
    '여기 쌓인 시간이 그보다 길어지면 무슨 일이 생길까.': '这里攒下的时间比那还长的话，会发生什么？',
    '나는 스물일곱 번 눌렀다. 한 번이 모자랐다.': '我按了二十七次。差了一次。',
    '마지막은 네가 눌러 줘. 여기서 기다릴게.': '最后一次你帮我按吧。我在这里等。',
    '138억': '138亿', '흔적': '痕迹', '이어하기': '继续', '처음부터 할까요?': '要从头开始吗？', '그리기': '画画',
    '1~7 행동 · D 그리기 · Q~Y 기억 · Tab 강화': '1~7 行动 · D 画画 · Q~Y 回忆 · Tab 强化',
    '벽화': '壁画', '그림 ': '画 ', '벽화 ': '壁画 ', '상점': '商店', '구매': '购买', '원': ''
  };
  // 일본어·포르투갈어·러시아어판: 한국어 원문을 열쇠로 찾는다('원문|영문' 열쇠가 있으면 그쪽 먼저)
  const JA = {
    '긁기': '引っかく', '세기': '数える', '파기': '掘る', '쌓기': '積む', '걷기': '歩く', '혼잣말': '独り言', '조각': '彫刻',
    '선': '線', '수': '数', '돌': '石', '층': '階', '낱말': '言葉', '조각상': '彫像',
    '치킨': 'チキン', '강아지': '子犬', '원룸': 'ワンルーム', '중고차': '中古車', '드라이브': 'ドライブ', '해외여행': '海外旅行', '바다': '海',
    '오피스텔': '1LDK', '명품 시계': '高級腕時計', '초침': '秒針', '아파트': 'マンション', '스포츠카': 'スポーツカー', '질주': '疾走',
    '펜트하우스': 'ペントハウス', '빌딩': 'ビル', '무인도': '無人島',
    '여기 누가 또 왔구나.': 'また誰か来たんだな。',
    '나도 백만 원 때문에 눌렀다. 너도 그랬겠지.': '俺も百万ウォンのために押した。お前もそうだろう。',
    '돌아가면 다 잊는다. 그래서 바닥에 새긴다.': '戻れば全部忘れる。だから床に刻む。',
    '처음 천만 년은 울었다. 다음 천만 년은 웃었다.': '最初の一千万年は泣いた。次の一千万年は笑った。',
    '바닥은 긁으면 파인다. 아주 천천히.': '床は引っかけば削れる。ものすごくゆっくり。',
    '숫자를 끝까지 세 보려 했다. 끝은 없었다.': '数を最後まで数えようとした。終わりはなかった。',
    '네가 쌓은 탑을 봤다. 잘 쌓았더라.': 'お前が積んだ塔を見た。うまく積んだな。',
    '버튼 값은 누를수록 오른다. 그쪽은 우리가 계속 누르길 바란다.': 'ボタンの値段は押すたびに上がる。向こうは俺たちに押し続けてほしいんだ。',
    '바깥 우주는 백삼십팔억 년 되었다고 들었다.': '外の宇宙は百三十八億年たったと聞いた。',
    '여기 쌓인 시간이 그보다 길어지면 무슨 일이 생길까.': 'ここに積もった時間がそれより長くなったら、何が起きるんだろう。',
    '나는 스물일곱 번 눌렀다. 한 번이 모자랐다.': '俺は二十七回押した。一回足りなかった。',
    '마지막은 네가 눌러 줘. 여기서 기다릴게.': '最後はお前が押してくれ。ここで待ってる。',
    '138억': '138億', '흔적': '痕跡', '이어하기': 'つづきから', '처음부터 할까요?': 'はじめからやり直しますか？', '그리기': '描く',
    '1~7 행동 · D 그리기 · Q~Y 기억 · Tab 강화': '1~7 行動 · D 描く · Q~Y 記憶 · Tab 強化',
    '벽화': '壁画', '그림 ': '絵 ', '벽화 ': '壁画 ', '상점': 'ショップ', '구매': '買う', '원': ''
  };
  const PT = {
    '긁기': 'Riscar', '세기': 'Contar', '파기': 'Cavar', '쌓기': 'Empilhar', '걷기': 'Andar', '혼잣말': 'Murmurar', '조각': 'Esculpir',
    '선': 'linhas', '수': 'contagem', '돌': 'pedras', '층': 'andares', '낱말': 'palavras', '조각상': 'estátuas',
    '치킨': 'Frango frito', '강아지': 'Cachorrinho', '원룸': 'Kitnet', '중고차': 'Carro usado', '드라이브': 'Passeio', '해외여행': 'Viagem ao exterior', '바다': 'Mar',
    '오피스텔': 'Flat', '명품 시계': 'Relógio de luxo', '초침': 'Tique-taque', '아파트': 'Apartamento', '스포츠카': 'Carro esportivo', '질주': 'Velocidade',
    '펜트하우스': 'Cobertura', '빌딩': 'Prédio', '무인도': 'Ilha particular',
    '여기 누가 또 왔구나.': 'Então chegou mais alguém.',
    '나도 백만 원 때문에 눌렀다. 너도 그랬겠지.': 'Eu também apertei por um milhão de wons. Você também, né?',
    '돌아가면 다 잊는다. 그래서 바닥에 새긴다.': 'Quando você volta, esquece tudo. Por isso eu gravo no chão.',
    '처음 천만 년은 울었다. 다음 천만 년은 웃었다.': 'Nos primeiros dez milhões de anos, eu chorei. Nos dez milhões seguintes, eu ri.',
    '바닥은 긁으면 파인다. 아주 천천히.': 'O chão cede se você riscar. Bem devagar.',
    '숫자를 끝까지 세 보려 했다. 끝은 없었다.': 'Tentei contar até o fim. Não tinha fim.',
    '네가 쌓은 탑을 봤다. 잘 쌓았더라.': 'Vi as torres que você empilhou. Ficaram boas.',
    '버튼 값은 누를수록 오른다. 그쪽은 우리가 계속 누르길 바란다.': 'O preço do botão sobe a cada vez. Eles querem que a gente continue apertando.',
    '바깥 우주는 백삼십팔억 년 되었다고 들었다.': 'Ouvi dizer que o universo lá fora tem 13,8 bilhões de anos.',
    '여기 쌓인 시간이 그보다 길어지면 무슨 일이 생길까.': 'O que acontece quando o tempo acumulado aqui passar disso?',
    '나는 스물일곱 번 눌렀다. 한 번이 모자랐다.': 'Eu apertei vinte e sete vezes. Faltou uma.',
    '마지막은 네가 눌러 줘. 여기서 기다릴게.': 'Aperta a última por mim. Vou esperar aqui.',
    '138억': '13,8 bi', '흔적': 'MARCAS', '흔적|TRACE': 'MARCA', '이어하기': 'CONTINUAR', '처음부터 할까요?': 'Começar do zero?', '그리기': 'Desenhar',
    '1~7 행동 · D 그리기 · Q~Y 기억 · Tab 강화': '1-7 ação · D desenhar · Q-Y memória · Tab melhorar',
    '벽화': 'M', '그림 ': '', '벽화 ': 'MURAL ', '상점': 'LOJA', '구매': 'COMPRAR', '원': ''
  };
  const RU = {
    '긁기': 'Царапать', '세기': 'Считать', '파기': 'Копать', '쌓기': 'Класть', '걷기': 'Ходить', '혼잣말': 'Бормотать', '조각': 'Резьба',
    '선': 'линии', '수': 'счёт', '돌': 'камни', '층': 'этажи', '낱말': 'слова', '조각상': 'статуи',
    '치킨': 'Курица', '강아지': 'Щенок', '원룸': 'Комната', '중고차': 'Б/у авто', '드라이브': 'Поездка', '해외여행': 'Тур за рубеж', '바다': 'Море',
    '오피스텔': 'Студия', '명품 시계': 'Люкс-часы', '초침': 'Тик-так', '아파트': 'Квартира', '스포츠카': 'Спорткар', '질주': 'Скорость',
    '펜트하우스': 'Пентхаус', '빌딩': 'Здание', '무인도': 'Свой остров',
    '여기 누가 또 왔구나.': 'Значит, ещё кто-то пришёл.',
    '나도 백만 원 때문에 눌렀다. 너도 그랬겠지.': 'Я тоже нажал ради миллиона вон. Ты, наверное, тоже.',
    '돌아가면 다 잊는다. 그래서 바닥에 새긴다.': 'Вернёшься — всё забудешь. Поэтому я вырезаю на полу.',
    '처음 천만 년은 울었다. 다음 천만 년은 웃었다.': 'Первые десять миллионов лет я плакал. Следующие десять миллионов смеялся.',
    '바닥은 긁으면 파인다. 아주 천천히.': 'Пол поддаётся, если царапать. Очень медленно.',
    '숫자를 끝까지 세 보려 했다. 끝은 없었다.': 'Я пытался досчитать до конца. Конца не было.',
    '네가 쌓은 탑을 봤다. 잘 쌓았더라.': 'Видел твои башни. Хорошо сложил.',
    '버튼 값은 누를수록 오른다. 그쪽은 우리가 계속 누르길 바란다.': 'Цена кнопки растёт с каждым нажатием. Им нужно, чтобы мы жали дальше.',
    '바깥 우주는 백삼십팔억 년 되었다고 들었다.': 'Слышал, что вселенной снаружи 13,8 миллиарда лет.',
    '여기 쌓인 시간이 그보다 길어지면 무슨 일이 생길까.': 'Что будет, когда накопленное здесь время станет больше?',
    '나는 스물일곱 번 눌렀다. 한 번이 모자랐다.': 'Я нажал двадцать семь раз. Одного не хватило.',
    '마지막은 네가 눌러 줘. 여기서 기다릴게.': 'Последнее нажми за меня. Я подожду здесь.',
    '138억': '13,8 млрд', '흔적': 'НАДПИСИ', '흔적|TRACE': 'НАДПИСЬ', '이어하기': 'ПРОДОЛЖИТЬ', '처음부터 할까요?': 'Начать заново?', '그리기': 'Рисовать',
    '1~7 행동 · D 그리기 · Q~Y 기억 · Tab 강화': '1-7 действия · D рисовать · Q-Y память · Tab прокачка',
    '벽화': 'Ф', '그림 ': '', '벽화 ': 'ФРЕСКА ', '상점': 'МАГАЗИН', '구매': 'КУПИТЬ', '원': ''
  };
  const DI = { ja: JA, pt: PT, ru: RU }[LANG];
  const T = (ko, en) => (LANG === 'en' ? en : LANG === 'zh' && ko in ZH ? ZH[ko]
    : DI ? ((ko + '|' + en) in DI ? DI[ko + '|' + en] : ko in DI ? DI[ko] : en) : ko);

  const YEARS_PER_TRIP = 5e8;          // 한 번 누를 때마다 5억 년
  const UNIVERSE = 1.38e10;            // 우주의 나이 138억 년

  // 버튼이 내미는 돈 — 누를수록 커진다(28번째가 500억)
  const OFFERS = [1e6, 2e6, 3e6, 5e6, 7e6, 1e7, 1.5e7, 2e7, 3e7, 5e7, 7e7, 1e8, 1.5e8, 2e8,
    3e8, 5e8, 7e8, 1e9, 1.5e9, 2e9, 3e9, 5e9, 7e9, 1e10, 1.5e10, 2e10, 3e10, 5e10];
  function offer(n) { // n = 이번이 몇 번째 누름(0부터)
    if (n < OFFERS.length) return OFFERS[n];
    return Math.round(OFFERS[OFFERS.length - 1] * Math.pow(1.5, n - OFFERS.length + 1) / 1e9) * 1e9;
  }

  // 5억 년 안에서 하는 일. res = 쌓이는 것, cost = 쓰는 것. 시간은 몰입(focus)으로 흐른다
  const ACTS = [
    { id: 'scratch', key: '1', name: T('긁기', 'SCRATCH'), res: 'line', gain: 1,
      up: { res: 'line', base: 15 }, unlock: s => true },
    { id: 'count', key: '2', name: T('세기', 'COUNT'), res: 'num', gain: 1,
      up: { res: 'num', base: 20 }, unlock: s => s.ever.line >= 15 },
    { id: 'dig', key: '3', name: T('파기', 'DIG'), res: 'stone', gain: 0.34,
      up: { res: 'stone', base: 4 }, unlock: s => s.ever.line >= 50 },
    { id: 'stack', key: '4', name: T('쌓기', 'STACK'), res: 'tower', gain: 1, cost: { res: 'stone', n: 1 },
      up: { res: 'stone', base: 6 }, unlock: s => s.ever.stone >= 3 },
    { id: 'walk', key: '5', name: T('걷기', 'WALK'), res: 'km', gain: 1,
      up: { res: 'num', base: 40 }, unlock: s => s.presses >= 1 },
    { id: 'talk', key: '6', name: T('혼잣말', 'MUTTER'), res: 'word', gain: 1,
      up: { res: 'line', base: 40 }, unlock: s => s.found >= 1 },
    { id: 'carve', key: '7', name: T('조각', 'CARVE'), res: 'statue', gain: 0.2, cost: { res: 'stone', n: 1 },
      up: { res: 'stone', base: 10 }, unlock: s => s.ever.tower >= 12 }
  ];
  const RES_NAME = {
    line: T('선', 'lines'), num: T('수', 'count'), stone: T('돌', 'stones'), tower: T('층', 'floors'),
    km: 'km', word: T('낱말', 'words'), statue: T('조각상', 'statues')
  };
  const MAX_LV = 12;
  function upCost(act, lv) { return Math.ceil(act.up.base * Math.pow(1.75, lv - 1)); }
  function lvGain(lv) { return 1 + 0.25 * (lv - 1); }
  function lvAuto(lv) { return lv >= 2 ? 0.2 * (lv - 1) : 0; }   // 1초에 저절로 몇 번

  // 질림: 같은 일만 하면 덜 쌓이고 몰입도 덜 된다
  const BORE_UP = 0.07, BORE_DOWN = 0.1, BORE_CUT = 0.75;
  // 몰입: 1 이면 5억 년이 TRIP_SEC 초. 손 놓으면 F_MIN 까지 떨어져 시간이 거의 안 간다
  const TRIP_SEC = 120, F_TAP = 0.09, F_AUTO = 0.03, F_DECAY = 0.3, F_MIN = 0.04;

  // 상점 — 산 물건은 방에 놓이고, 기억(mem)은 5억 년 안에서 떠올릴 수 있다
  const SHOP = [
    { id: 'chicken', name: T('치킨', 'FRIED CHICKEN'), price: 2e4, mem: T('치킨', 'WINGS') },
    { id: 'dog', name: T('강아지', 'PUPPY'), price: 8e5, mem: T('강아지', 'PUPPY') },
    { id: 'oneroom', name: T('원룸', 'STUDIO'), price: 2.5e6, house: 1 },
    { id: 'car', name: T('중고차', 'USED CAR'), price: 8e6, mem: T('드라이브', 'DRIVE') },
    { id: 'trip', name: T('해외여행', 'TRIP ABROAD'), price: 2e7, mem: T('바다', 'SEA') },
    { id: 'officetel', name: T('오피스텔', 'CITY FLAT'), price: 6e7, house: 2 },
    { id: 'watch', name: T('명품 시계', 'LUXURY WATCH'), price: 1.2e8, mem: T('초침', 'TICK') },
    { id: 'apt', name: T('아파트', 'APARTMENT'), price: 9e8, house: 3 },
    { id: 'sports', name: T('스포츠카', 'SPORTS CAR'), price: 2e9, mem: T('질주', 'SPEED') },
    { id: 'penthouse', name: T('펜트하우스', 'PENTHOUSE'), price: 8e9, house: 4 },
    { id: 'building', name: T('빌딩', 'TOWER BLOCK'), price: 3e10, house: 5 },
    { id: 'island', name: T('무인도', 'PRIVATE ISLAND'), price: 4e10, house: 6 }
  ];
  const MEM_COOL = 40;
  function houseMult(tier) { return 1 + 0.2 * tier; }

  // 먼저 온 사람이 바닥에 새겨 둔 글 12개. km = 그만큼 걸어야 보인다, words = 그만큼 말을 익혀야 읽힌다
  const MSGS = [
    { km: 5, words: 10, text: T('여기 누가 또 왔구나.', 'So someone else came.') },
    { km: 400, words: 450, text: T('나도 백만 원 때문에 눌렀다. 너도 그랬겠지.', 'I pressed it for the money too. So did you, I guess.') },
    { km: 1300, words: 1400, text: T('돌아가면 다 잊는다. 그래서 바닥에 새긴다.', 'You forget it all when you go back. So I carve it into the floor.') },
    { km: 2600, words: 2800, text: T('처음 천만 년은 울었다. 다음 천만 년은 웃었다.', 'I cried for the first ten million years. Then I laughed for ten million more.') },
    { km: 4300, words: 4600, text: T('바닥은 긁으면 파인다. 아주 천천히.', 'The floor gives if you scratch it. Very slowly.') },
    { km: 6300, words: 6800, text: T('숫자를 끝까지 세 보려 했다. 끝은 없었다.', 'I tried to count to the end. There was no end.') },
    { km: 8800, words: 9500, text: T('네가 쌓은 탑을 봤다. 잘 쌓았더라.', 'I saw the towers you built. Nicely done.') },
    { km: 11500, words: 12500, text: T('버튼 값은 누를수록 오른다. 그쪽은 우리가 계속 누르길 바란다.', 'The price goes up every press. They want us to keep pressing.') },
    { km: 14500, words: 15800, text: T('바깥 우주는 백삼십팔억 년 되었다고 들었다.', 'I heard the universe out there is 13.8 billion years old.') },
    { km: 18000, words: 19500, text: T('여기 쌓인 시간이 그보다 길어지면 무슨 일이 생길까.', 'What happens when the time piled up here gets longer than that?') },
    { km: 22000, words: 23500, text: T('나는 스물일곱 번 눌렀다. 한 번이 모자랐다.', 'I pressed it twenty-seven times. One short.') },
    { km: 27000, words: 28500, text: T('마지막은 네가 눌러 줘. 여기서 기다릴게.', 'Press the last one for me. I will wait here.') }
  ];

  function won(n) { // ₩ 표기 — 억·만 단위로 짧게
    if (LANG === 'en') {
      if (n >= 1e9) return '₩' + trim(n / 1e9) + 'B';
      if (n >= 1e6) return '₩' + trim(n / 1e6) + 'M';
      return '₩' + Math.floor(n).toLocaleString('en-US');
    }
    if (LANG === 'zh') {
      if (n >= 1e8) {
        const yi = Math.floor(n / 1e8), wan = Math.floor((n % 1e8) / 1e4);
        return yi.toLocaleString('zh-CN') + '亿' + (wan ? wan.toLocaleString('zh-CN') + '万' : '') + '韩元';
      }
      if (n >= 1e4) return Math.floor(n / 1e4).toLocaleString('zh-CN') + '万韩元';
      return Math.floor(n).toLocaleString('zh-CN') + '韩元';
    }
    if (LANG === 'ja') {
      if (n >= 1e8) {
        const ok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4);
        return ok.toLocaleString('ja-JP') + '億' + (man ? man.toLocaleString('ja-JP') + '万' : '') + 'ウォン';
      }
      if (n >= 1e4) return Math.floor(n / 1e4).toLocaleString('ja-JP') + '万ウォン';
      return Math.floor(n).toLocaleString('ja-JP') + 'ウォン';
    }
    if (LANG === 'pt' || LANG === 'ru') {
      const pt = LANG === 'pt';
      if (n >= 1e9) return '₩' + dec(n / 1e9) + (pt ? ' bi' : ' млрд');
      if (n >= 1e6) return '₩' + dec(n / 1e6) + (pt ? ' mi' : ' млн');
      return '₩' + num(n);
    }
    if (n >= 1e8) {
      const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4);
      return eok.toLocaleString('ko-KR') + '억' + (man ? ' ' + man.toLocaleString('ko-KR') + '만' : '') + '원';
    }
    if (n >= 1e4) return Math.floor(n / 1e4).toLocaleString('ko-KR') + '만원';
    return Math.floor(n).toLocaleString('ko-KR') + '원';
  }
  function trim(x) { return (Math.round(x * 10) / 10).toString(); }
  function dec(x) { return trim(x).replace('.', ','); }   // 소수점을 쉼표로
  const LOC = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', pt: 'pt-BR', ru: 'ru-RU' }[LANG] || 'ko-KR';
  function ruYears(n) { // 러시아어 복수형: 1 год, 2 года, 5 лет
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? 'год' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'года' : 'лет';
  }
  function yearsShort(y) { // 누적 표기: 32억 년
    if (LANG === 'en') return trim(y / 1e9) + 'B';
    if (LANG === 'pt') return dec(y / 1e9) + ' bi';
    if (LANG === 'ru') return dec(y / 1e9) + ' млрд';
    const e = y / 1e8;
    return (e >= 100 ? Math.floor(e) : trim(e)) + (LANG === 'zh' ? '亿年' : LANG === 'ja' ? '億年' : '억 년');
  }
  function yearsFull(y) {
    if (LANG === 'pt') return num(y) + ' anos';
    if (LANG === 'ru') return num(y) + ' ' + ruYears(Math.floor(y));
    return Math.floor(y).toLocaleString(LANG === 'en' ? 'en-US' : LANG === 'zh' ? 'zh-CN' : LANG === 'ja' ? 'ja-JP' : 'ko-KR') + (LANG === 'en' ? ' yrs' : LANG === 'zh' || LANG === 'ja' ? '年' : '년');
  }
  function num(n) { return Math.floor(n).toLocaleString(LOC); }

  window.B5D = { LANG, T, YEARS_PER_TRIP, UNIVERSE, offer, ACTS, RES_NAME, MAX_LV, upCost, lvGain, lvAuto,
    BORE_UP, BORE_DOWN, BORE_CUT, TRIP_SEC, F_TAP, F_AUTO, F_DECAY, F_MIN, SHOP, MEM_COOL, houseMult, MSGS, won, yearsShort, yearsFull, num };
})();
