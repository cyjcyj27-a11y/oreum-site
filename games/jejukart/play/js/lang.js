// ?lang=en 이면 화면 글자를 영어로 (사전 + MutationObserver)
(function () {
  const Q = new URLSearchParams(location.search).get('lang');
  const LG = ['en', 'zh', 'ja', 'pt', 'ru'].includes(Q) ? Q : 'ko';
  const EN = LG === 'en', ZHL = LG === 'zh';
  window.LANG = LG;
  // 중국어: 한국어 원문을 열쇠로
  const ZH = {
    '제주카트레이싱': '济州卡丁车',
    '제주': '济州',
    '카트레이싱': '卡丁车',
    '카트': '卡丁车',
    '코스': '赛道',
    '상점': '商店',
    '미션': '任务',
    '장착': '装备',
    '사용 중': '使用中',
    '홈': '首页',
    '나': '我',
    '냥이': '喵喵', '토리': '兔兔', '판이': '团团', '여리': '狐狐',
    '애월 해안도로': '涯月海岸公路',
    '감귤밭 돌담길': '橘园石墙路',
    '협재 해변': '挟才海滩',
    '제주 시내': '济州市区',
    '녹차밭': '绿茶园',
    '유채꽃 들판': '油菜花田',
    '산굼부리 억새밭': '山君不离芒草地',
    '풍차 해안': '风车海岸',
    '용두암 바윗가': '龙头岩礁石',
    '성산일출봉': '城山日出峰',
    '한라산 숲길': '汉拿山林道',
    '밤의 탑동': '夜晚塔洞',
    '감귤컵': '柑橘杯', '돌담컵': '石墙杯', '오름컵': '火山丘杯', '한라산컵': '汉拿山杯',
    '파랑 씽씽': '蓝色嗖嗖', '분홍 토끼': '粉红兔', '초록 거북': '绿乌龟', '노랑 부릉': '黄色轰轰',
    '속도': '速度', '접지': '抓地',
    ' 우승': '夺冠', '우승': '夺冠',
    '등': '名',
    '1등 하기': '拿下第1名',
    '코스 5개 1등': '5条赛道拿第1',
    '코스 12개 모두 1등': '12条赛道全拿第1',
    '드리프트 3단 30번': '3段漂移30次',
    '한라봉 명중 30번': '丑橘命中30次',
    '아이템 150개': '拿到150个道具',
    '100바퀴 달리기': '跑满100圈',
    '한 번도 안 맞고 1등': '零中弹拿第1',
    '카트 2대 모으기': '收集2辆卡丁车',
    '카트 3대 모으기': '收集3辆卡丁车',
    '카트 4대 모두': '集齐4辆卡丁车',
    '4컵 모두 우승': '4个杯赛全夺冠',
    '계속': '继续',
    '가로로 돌려 주세요': '请把手机横过来',
    '전체화면보기': '全屏',
    '누르면 조준(← → 과녁 바꾸기), 떼면 발사': '按住瞄准(← → 换目标)，松开发射',
    '급출발': '冲刺',
    '이어하기': '继续游戏', '새로하기': '重新开始',
    '처음부터 다시 할까요?': '要从头开始吗？', '미션·기록이 모두 지워져요': '任务和记录都会被清除', '확인': '确定', '취소': '取消',
    '캐릭터': '角色',
    '드리프트 달인': '漂移达人', '번개 뒷발': '闪电后腿', '튼튼한 몸': '铁打身板', '꼬리 바람': '顺风尾巴',
    '드리프트 부스트가 1.5배 빨리 모여요': '漂移加速蓄得快1.5倍',
    '↑↑ 부스터를 6초마다 쓸 수 있어요 (다른 선수는 10초)': '每6秒就能用一次 ↑↑ 加速（其他选手10秒）',
    '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)': '被道具打中也能马上恢复（打转和减速时间减半）',
    '최고 속도가 6% 더 빨라요': '最高速度快6%',
    '무한 모드': '无限模式',
    '조향': '转向', '가속': '加速', '브레이크': '刹车', '드리프트': '漂移', '아이템': '道具',
    '1컵': '第1杯',
  };
  // 일본어·포르투갈어(브라질)·러시아어: 한국어 원문을 열쇠로
  const JA = {
    '제주카트레이싱': '済州カートレース',
    '제주': '済州',
    '카트레이싱': 'カートレース',
    '카트': 'カート',
    '코스': 'コース',
    '상점': 'ショップ',
    '미션': 'ミッション',
    '장착': '装備',
    '사용 중': '使用中',
    '홈': 'ホーム',
    '나': 'あなた',
    '냥이': 'ニャンイ', '토리': 'トリ', '판이': 'パニ', '여리': 'ヨリ',
    '애월 해안도로': '涯月海岸道路',
    '감귤밭 돌담길': 'ミカン畑の石垣道',
    '협재 해변': '挟才ビーチ',
    '제주 시내': '済州市内',
    '녹차밭': '緑茶畑',
    '유채꽃 들판': '菜の花畑',
    '산굼부리 억새밭': 'サングムブリのススキ原',
    '풍차 해안': '風車の海岸',
    '용두암 바윗가': '龍頭岩の岩場',
    '성산일출봉': '城山日出峰',
    '한라산 숲길': '漢拏山の森の道',
    '밤의 탑동': '夜のタプドン',
    '감귤컵': 'ミカンカップ', '돌담컵': '石垣カップ', '오름컵': 'オルムカップ', '한라산컵': '漢拏山カップ',
    '파랑 씽씽': 'あおビュンビュン', '분홍 토끼': 'ピンクうさぎ', '초록 거북': 'みどりガメ', '노랑 부릉': 'きいろブルルン',
    '속도': 'スピード', '접지': 'グリップ',
    ' 우승': '優勝', '우승': '優勝',
    '등': '位',
    '1등 하기': '1位をとる',
    '코스 5개 1등': '5コースで1位',
    '코스 12개 모두 1등': '全12コースで1位',
    '드리프트 3단 30번': '3段ドリフト30回',
    '한라봉 명중 30번': 'デコポン命中30回',
    '아이템 150개': 'アイテム150個',
    '100바퀴 달리기': '100周走る',
    '한 번도 안 맞고 1등': 'ノーダメージで1位',
    '카트 2대 모으기': 'カートを2台集める',
    '카트 3대 모으기': 'カートを3台集める',
    '카트 4대 모두': 'カート4台コンプ',
    '4컵 모두 우승': '4カップ全制覇',
    '계속': 'つづける',
    '가로로 돌려 주세요': 'スマホを横にしてください',
    '전체화면보기': '全画面',
    '누르면 조준(← → 과녁 바꾸기), 떼면 발사': '押して狙う(← → 的を切替)、離して発射',
    '급출발': 'ダッシュ',
    '이어하기': 'つづきから', '새로하기': 'はじめから',
    '처음부터 다시 할까요?': '最初からやり直しますか？', '미션·기록이 모두 지워져요': 'ミッションと記録がすべて消えます', '확인': 'OK', '취소': 'キャンセル',
    '캐릭터': 'キャラクター',
    '드리프트 달인': 'ドリフト名人', '번개 뒷발': 'イナズマ脚', '튼튼한 몸': 'タフボディ', '꼬리 바람': '追い風しっぽ',
    '드리프트 부스트가 1.5배 빨리 모여요': 'ドリフトブーストが1.5倍速くたまる',
    '↑↑ 부스터를 6초마다 쓸 수 있어요 (다른 선수는 10초)': '↑↑ ブースターを6秒ごとに使える（他の選手は10秒）',
    '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)': 'アイテムに当たってもすぐ立ち直る（スピン・減速の時間が半分）',
    '최고 속도가 6% 더 빨라요': '最高速度が6%アップ',
    '무한 모드': 'エンドレス',
    '조향': 'ハンドル', '가속': 'アクセル', '브레이크': 'ブレーキ', '드리프트': 'ドリフト', '아이템': 'アイテム',
    '1컵': 'カップ1',
  };
  const PT = {
    '제주카트레이싱': 'CORRIDA DE KART JEJU',
    '제주': 'JEJU',
    '카트레이싱': 'CORRIDA DE KART',
    '카트': 'KART',
    '코스': 'PISTAS',
    '상점': 'LOJA',
    '미션': 'MISSÕES',
    '장착': 'EQUIPAR',
    '사용 중': 'EQUIPADO',
    '홈': 'INÍCIO',
    '나': 'VOCÊ',
    '냥이': 'Nyangi', '토리': 'Tori', '판이': 'Pani', '여리': 'Yeori',
    '애월 해안도로': 'Estrada Costeira de Aewol',
    '감귤밭 돌담길': 'Muros dos Tangerinais',
    '협재 해변': 'Praia de Hyeopjae',
    '제주 시내': 'Centro de Jeju',
    '녹차밭': 'Plantação de Chá Verde',
    '유채꽃 들판': 'Campos de Canola',
    '산굼부리 억새밭': 'Capim-prata de Sangumburi',
    '풍차 해안': 'Costa dos Moinhos',
    '용두암 바윗가': 'Rochas de Yongduam',
    '성산일출봉': 'Seongsan Ilchulbong',
    '한라산 숲길': 'Floresta do Hallasan',
    '밤의 탑동': 'Tapdong à Noite',
    '감귤컵': 'Copa Tangerina', '돌담컵': 'Copa Muro de Pedra', '오름컵': 'Copa Oreum', '한라산컵': 'Copa Hallasan',
    '파랑 씽씽': 'Azul Veloz', '분홍 토끼': 'Coelho Rosa', '초록 거북': 'Tartaruga Verde', '노랑 부릉': 'Amarelo Vrum',
    '속도': 'VELOCIDADE', '접지': 'ADERÊNCIA',
    ' 우승': ': CAMPEÃO!', '우승': 'CAMPEÃO',
    '등': 'º',
    '1등 하기': 'Termine em 1º',
    '코스 5개 1등': 'Vença 5 pistas',
    '코스 12개 모두 1등': 'Vença as 12 pistas',
    '드리프트 3단 30번': '30 drifts nível 3',
    '한라봉 명중 30번': 'Acerte 30 hallabongs',
    '아이템 150개': 'Pegue 150 itens',
    '100바퀴 달리기': 'Corra 100 voltas',
    '한 번도 안 맞고 1등': 'Vença sem ser atingido',
    '카트 2대 모으기': 'Tenha 2 karts',
    '카트 3대 모으기': 'Tenha 3 karts',
    '카트 4대 모두': 'Tenha os 4 karts',
    '4컵 모두 우승': 'Vença as 4 copas',
    '계속': 'CONTINUAR',
    '가로로 돌려 주세요': 'Vire o celular de lado',
    '전체화면보기': 'TELA CHEIA',
    '누르면 조준(← → 과녁 바꾸기), 떼면 발사': 'segure para MIRAR (← → trocar alvo), solte para ATIRAR',
    '급출발': 'ARRANCADA',
    '이어하기': 'CONTINUAR', '새로하기': 'NOVO JOGO',
    '처음부터 다시 할까요?': 'Começar do zero?', '미션·기록이 모두 지워져요': 'Todas as missões e recordes serão apagados.', '확인': 'OK', '취소': 'CANCELAR',
    '캐릭터': 'PILOTOS',
    '드리프트 달인': 'Mestre do Drift', '번개 뒷발': 'Pulo Relâmpago', '튼튼한 몸': 'Casca Grossa', '꼬리 바람': 'Vento de Cauda',
    '드리프트 부스트가 1.5배 빨리 모여요': 'O boost de drift carrega 1,5x mais rápido',
    '↑↑ 부스터를 6초마다 쓸 수 있어요 (다른 선수는 10초)': 'Boost ↑↑ a cada 6 segundos (outros: 10)',
    '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)': 'Se recupera rápido dos golpes (metade do tempo girando e lento)',
    '최고 속도가 6% 더 빨라요': 'Velocidade máxima +6%',
    '무한 모드': 'INFINITO',
    '조향': 'VIRAR', '가속': 'ACELERAR', '브레이크': 'FREIO', '드리프트': 'DRIFT', '아이템': 'ITEM',
    '1컵': 'COPA 1',
  };
  const RU = {
    '제주카트레이싱': 'ЧЕДЖУ КАРТИНГ',
    '제주': 'ЧЕДЖУ',
    '카트레이싱': 'КАРТИНГ',
    '카트': 'КАРТ',
    '코스': 'ТРАССЫ',
    '상점': 'МАГАЗИН',
    '미션': 'ЗАДАНИЯ',
    '장착': 'ВЫБРАТЬ',
    '사용 중': 'ВЫБРАН',
    '홈': 'МЕНЮ',
    '나': 'ТЫ',
    '냥이': 'Ньянги', '토리': 'Тори', '판이': 'Пани', '여리': 'Ёри',
    '애월 해안도로': 'Прибрежная дорога Эволь',
    '감귤밭 돌담길': 'Мандариновые сады',
    '협재 해변': 'Пляж Хёпчэ',
    '제주 시내': 'Центр Чеджу',
    '녹차밭': 'Чайные поля',
    '유채꽃 들판': 'Поля рапса',
    '산굼부리 억새밭': 'Мискантус Сангумбури',
    '풍차 해안': 'Берег ветряков',
    '용두암 바윗가': 'Скалы Йондуам',
    '성산일출봉': 'Сонсан Ильчхульбон',
    '한라산 숲길': 'Лес Халласана',
    '밤의 탑동': 'Ночной Тапдон',
    '감귤컵': 'Кубок Мандарина', '돌담컵': 'Кубок Каменной стены', '오름컵': 'Кубок Орым', '한라산컵': 'Кубок Халласана',
    '파랑 씽씽': 'Синий Вжух', '분홍 토끼': 'Розовый Кролик', '초록 거북': 'Зелёная Черепаха', '노랑 부릉': 'Жёлтый Вррум',
    '속도': 'СКОРОСТЬ', '접지': 'СЦЕПЛЕНИЕ',
    ' 우승': ': ПОБЕДА!', '우승': 'ПОБЕДА',
    '등': '-е место',
    '1등 하기': 'Займи 1-е место',
    '코스 5개 1등': 'Выиграй 5 трасс',
    '코스 12개 모두 1등': 'Выиграй все 12 трасс',
    '드리프트 3단 30번': '30 дрифтов 3-го уровня',
    '한라봉 명중 30번': '30 попаданий халлабоном',
    '아이템 150개': 'Собери 150 предметов',
    '100바퀴 달리기': 'Проедь 100 кругов',
    '한 번도 안 맞고 1등': 'Победи без попаданий',
    '카트 2대 모으기': 'Собери 2 карта',
    '카트 3대 모으기': 'Собери 3 карта',
    '카트 4대 모두': 'Собери все 4 карта',
    '4컵 모두 우승': 'Выиграй все 4 кубка',
    '계속': 'ДАЛЕЕ',
    '가로로 돌려 주세요': 'Поверни телефон горизонтально',
    '전체화면보기': 'ПОЛНЫЙ ЭКРАН',
    '누르면 조준(← → 과녁 바꾸기), 떼면 발사': 'держи — ПРИЦЕЛ (← → сменить цель), отпусти — ОГОНЬ',
    '급출발': 'РЫВОК',
    '이어하기': 'ПРОДОЛЖИТЬ', '새로하기': 'НОВАЯ ИГРА',
    '처음부터 다시 할까요?': 'Начать заново?', '미션·기록이 모두 지워져요': 'Все задания и рекорды будут удалены.', '확인': 'OK', '취소': 'ОТМЕНА',
    '캐릭터': 'ГОНЩИКИ',
    '드리프트 달인': 'Мастер дрифта', '번개 뒷발': 'Прыжок-молния', '튼튼한 몸': 'Крепкое тело', '꼬리 바람': 'Попутный ветер',
    '드리프트 부스트가 1.5배 빨리 모여요': 'Буст от дрифта копится в 1,5 раза быстрее',
    '↑↑ 부스터를 6초마다 쓸 수 있어요 (다른 선수는 10초)': 'Буст ↑↑ каждые 6 секунд (у других — 10)',
    '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)': 'Быстро приходит в себя после попаданий (вращение и замедление вдвое короче)',
    '최고 속도가 6% 더 빨라요': 'Максимальная скорость +6%',
    '무한 모드': 'БЕСКОНЕЧНЫЙ',
    '조향': 'РУЛЬ', '가속': 'ГАЗ', '브레이크': 'ТОРМОЗ', '드리프트': 'ДРИФТ', '아이템': 'ПРЕДМЕТ',
    '1컵': 'КУБОК 1',
  };
  const NL = { ja: JA, pt: PT, ru: RU }[LG];
  if (NL) {
    document.documentElement.lang = LG === 'pt' ? 'pt-BR' : LG;
    document.title = { ja: '済州カートレース', pt: 'Corrida de Kart Jeju', ru: 'Чеджу Картинг' }[LG];
    // 게임 글꼴(JejuT·Ria)에 없는 글자는 같은 이름에 기기 글꼴을 그 글자 범위로만 덧붙인다
    const jf = LG === 'ja'
      ? "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')"
      : "local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica')";
    const ur = LG === 'ja' ? 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF' : 'U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'JejuT';src:${jf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${jf};unicode-range:${ur}}` + (LG === 'ja' ? 'html[lang=ja] *{word-break:normal!important}' : '');
    document.head.appendChild(st);
  }
  if (ZHL) {
    document.documentElement.lang = 'zh-CN';
    document.title = '济州卡丁车';
    // 게임 글꼴(JejuT·Ria)엔 한자가 없다 → 같은 이름에 중국어 기기 글꼴을 한자 범위로만 덧붙인다
    // 게임 글꼴이 굵은 글꼴이라 한자도 굵은 면을 먼저 찾는다
    const zf = "local('PingFangSC-Semibold'),local('Microsoft YaHei Bold'),local('MicrosoftYaHei-Bold'),local('Noto Sans SC Bold'),local('NotoSansSC-Bold'),local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    const ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    const st = document.createElement('style');
    st.textContent = `@font-face{font-family:'JejuT';src:${zf};unicode-range:${ur}}@font-face{font-family:'Ria';src:${zf};unicode-range:${ur}}html[lang=zh-CN] *{word-break:normal!important}`;
    document.head.appendChild(st);
  }
  const D = ZHL ? ZH : NL || {
    '제주카트레이싱': 'JEJU KART RACING',
    '제주': 'JEJU',
    '카트레이싱': 'KART RACING',
    '카트': 'KART',
    '코스': 'COURSES',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '홈': 'HOME',
    '나': 'YOU',
    '냥이': 'Nyangi', '토리': 'Tori', '판이': 'Pani', '여리': 'Yeori',
    '애월 해안도로': 'Aewol Coast Road',
    '감귤밭 돌담길': 'Tangerine Stone Walls',
    '협재 해변': 'Hyeopjae Beach',
    '제주 시내': 'Jeju City',
    '녹차밭': 'Green Tea Fields',
    '유채꽃 들판': 'Canola Fields',
    '산굼부리 억새밭': 'Sangumburi Silver Grass',
    '풍차 해안': 'Windmill Coast',
    '용두암 바윗가': 'Yongduam Rocks',
    '성산일출봉': 'Seongsan Ilchulbong',
    '한라산 숲길': 'Hallasan Forest',
    '밤의 탑동': 'Tapdong at Night',
    '감귤컵': 'Tangerine Cup', '돌담컵': 'Stone Wall Cup', '오름컵': 'Oreum Cup', '한라산컵': 'Hallasan Cup',
    '동네 카트': 'Rookie', '파랑 씽씽': 'Blue Dash', '노랑 부릉': 'Yellow Buzz', '초록 거북': 'Green Turtle',
    '분홍 토끼': 'Pink Rabbit', '검정 상어': 'Black Shark', '하양 번개': 'White Bolt', '보라 유령': 'Purple Ghost',
    '주황 불꽃': 'Orange Flame', '은빛 로켓': 'Silver Rocket', '황금 왕관': 'Golden Crown', '무지개': 'Rainbow',
    '속도': 'TOP', '가속': 'ACC', '접지': 'GRIP',
    '우승': 'WIN',
    '등': '',
    '1등 하기': 'Take 1st place',
    '코스 5개 1등': 'Win 5 courses',
    '코스 12개 모두 1등': 'Win all 12 courses',
    '드리프트 3단 30번': '30 max drift boosts',
    '한라봉 명중 30번': '30 hallabong hits',
    '아이템 150개': '150 items',
    '100바퀴 달리기': 'Drive 100 laps',
    '한 번도 안 맞고 1등': 'Win without a hit',
    '카트 2대 모으기': 'Own 2 karts',
    '카트 3대 모으기': 'Own 3 karts',
    '카트 4대 모두': 'Own all 4 karts',
    '4컵 모두 우승': 'Win all 4 cups',
    '계속': 'CONTINUE',
    '가로로 돌려 주세요': 'Rotate your phone',
    '전체화면보기': 'FULLSCREEN',
    '누르면 조준(← → 과녁 바꾸기), 떼면 발사': 'hold to AIM (← → switch target), release to FIRE',
    '급출발': 'DASH',
    '이어하기': 'CONTINUE', '새로하기': 'NEW GAME',
    '처음부터 다시 할까요?': 'Start over?', '미션·기록이 모두 지워져요': 'All missions and records will be erased.', '확인': 'OK', '취소': 'CANCEL',
    '캐릭터': 'RACERS',
    '드리프트 달인': 'Drift Master', '번개 뒷발': 'Lightning Hops', '튼튼한 몸': 'Tough Body', '꼬리 바람': 'Tail Wind',
    '드리프트 부스트가 1.5배 빨리 모여요': 'Drift boosts charge 1.5x faster',
    '↑↑ 부스터를 6초마다 쓸 수 있어요 (다른 선수는 10초)': '↑↑ boost every 6 seconds (others: 10)',
    '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)': 'Shakes off hits fast (half spin & slow time)',
    '최고 속도가 6% 더 빨라요': 'Top speed +6%',
    '무한 모드': 'ENDLESS',
    '조향': 'STEER', '가속': 'GAS', '브레이크': 'BRAKE', '드리프트': 'DRIFT', '아이템': 'ITEM',
    '1컵': 'CUP 1',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  // 중국어는 '숫자+등'(등수)을 '第N名'으로 — 사전 낱말 뒤에 둔다
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + (ZHL || NL ? '|\\d+등' : ''), 'g');
  window.L = function (s) {
    if (LG === 'ko' || s == null) return s;
    return String(s).replace(re, (m) => (D[m] !== undefined ? D[m] : NL ? m.slice(0, -1) + D['등'] : '第' + m.slice(0, -1) + '名'));
  };
  if (LG === 'ko') return;
  if (EN) {
    document.documentElement.lang = 'en';
    document.title = 'JEJU KART RACING';
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
    document.querySelectorAll('[data-t]').forEach((el) => { el.dataset.t = window.L(el.dataset.t); });   // 제목 글자 테두리 겹(::before/::after)도 영어로
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'characterData') fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  // 영어가 한글보다 길어 단추 밖으로 넘치면 글씨를 줄여 맞춘다 (2026-09-25 사장님 "영문판 글씨점검").
  // 칸을 넓히는 게 먼저고, 이건 화면 크기마다 남는 것을 잡는 안전망이다
  const fitAll = () => {
    document.querySelectorAll('.btn,.tog.txt,.tbtn,.cupb,.close').forEach((el) => {
      el.style.fontSize = '';
      if (!el.offsetParent) return;
      const cs = getComputedStyle(el);
      const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (parseFloat(cs.webkitTextStrokeWidth) || 0);
      const rg = document.createRange();
      rg.selectNodeContents(el);
      const tw = rg.getBoundingClientRect().width;
      if (avail > 0 && tw > avail + 0.5) el.style.fontSize = (parseFloat(cs.fontSize) * avail / tw * 0.97).toFixed(1) + 'px';
    });
  };
  let fitReq = 0;
  const fitSoon = () => { if (document.body.classList.contains('playing')) return;   // 달리는 중엔 시계 글자가 매 프레임 바뀐다 — 재지 않는다
    if (!fitReq) fitReq = requestAnimationFrame(() => { fitReq = 0; fitAll(); }); };
  const start2 = () => {
    fitSoon();
    addEventListener('resize', fitSoon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitSoon);
    new MutationObserver(fitSoon).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  };
  if (document.body) { start(); start2(); }
  else addEventListener('DOMContentLoaded', () => { start(); start2(); });
})();
