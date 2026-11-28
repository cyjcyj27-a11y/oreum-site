// ?lang=en 이면 영어, ?lang=zh 이면 중국어, ?lang=ja·pt·ru 면 일본어·포르투갈어·러시아어로 화면 글자를 바꾼다 (사전 + MutationObserver). 캔버스 글자는 L() 로 감싼다
(function () {
  var EN = /[?&]lang=en\b/.test(location.search);
  var ZH = !EN && /[?&]lang=zh\b/.test(location.search);
  var XL = !EN && !ZH && ((location.search.match(/[?&]lang=(ja|pt|ru)\b/) || [])[1] || '');
  window.LANG = EN ? 'en' : ZH ? 'zh' : XL || 'ko';
  var D = {
    '방귀라이크': 'FARTLIKE', '방귀 서바이버': 'FARTLIKE', '라이크': 'LIKE', '서바이버': 'SURVIVOR', '방귀': 'FART',
    '이어하기': 'CONTINUE', '상점': 'SHOP', '도감': 'COLLECTION', '계속': 'RESUME', '홈': 'HOME', '새로고침': 'REROLL',
    '새로 시작할까요?': 'Start a new run?', '확인': 'OK', '취소': 'CANCEL', '도시락': 'LUNCHBOX',
    '음식': 'FOOD', '적': 'ENEMIES', '코인': 'Coins', '간식': 'Snack',
    '이동': 'MOVE', '일시정지': 'PAUSE',
    // 스테이지
    '학교 운동장': 'School Field', '지하철': 'Subway', '찜질방': 'Sauna', '놀이공원': 'Theme Park', '방향제 공장': 'Air Freshener Factory',
    // 음식
    '고구마': 'Sweet Potato', '양배추': 'Cabbage', '청국장': 'Stinky Bean Stew', '콜라': 'Cola', '우유': 'Milk', '불닭': 'Fire Noodles',
    '계란': 'Egg', '번데기': 'Silkworm Snack', '김치': 'Kimchi', '마늘': 'Garlic', '탄산수': 'Soda Water', '멘토스': 'Mint Candy', '시리얼': 'Cereal', '라이터': 'Lighter',
    '로켓 방귀': 'Rocket Fart', '불방귀': 'Fire Fart', '시리얼 폭탄': 'Cereal Bomb', '지옥 구름': 'Hell Cloud', '매운 오라': 'Spicy Aura', '연발 방귀': 'Rapid Fart',
    // 능력치 줄
    '가스 충전': 'Gas charge', '뿡 연사': 'Toot rate', '피해': 'damage', '구름 지속': 'Cloud time', '크기': 'size',
    '방귀 대시': 'Fart dash', '대시 거리': 'Dash range', '큰 방귀 피해': 'Big fart damage', '이동 속도': 'Move speed', '독 냄새': 'Poison smell',
    '최대 체력': 'Max HP', '회복': 'Regen', '밀쳐내기': 'Knockback', '범위': 'range', '마늘 오라': 'Garlic aura', '오라 피해': 'Aura damage',
    '모으기 속도': 'Charge speed', '연쇄 폭발': 'Chain pops', '줍기 범위': 'Pickup range', '뿡에 불씨': 'Toots ignite',
    '방귀 로켓 돌진': 'Fart rocket rush', '불꽃 고리': 'Fire ring', '불 뿡': 'fire toots', '시리얼 파편 12발': '12 cereal shards',
    '따라가는 독구름': 'Homing poison cloud', '오라 1.6배': 'Aura x1.6', '뿡 3연발 조준': '3 aimed toots',
    '체력': 'HP', '배짱': 'Guts', '힘': 'Power', '신발': 'Shoes', '자석': 'Magnet', '방어': 'Armor', '행운': 'Luck', '부활': 'Revive',
    '모든 피해': 'All damage', '코인': 'Coins', '받는 피해': 'Damage taken', '카드 새로고침': 'Card rerolls',
    '초': 's',
    // 적
    '모기': 'Mosquito', '비둘기': 'Pigeon', '강아지': 'Puppy', '잔소리 아줌마': 'Nagging Auntie', '방독면 청소부': 'Gas-Mask Janitor', '양머리 아저씨': 'Towel-Hat Uncle',
    '맥반석 계란': 'Sauna Egg', '풍선': 'Balloon', '물총 소년': 'Water Gun Kid', '곰돌이 인형탈': 'Bear Mascot', '방향제 로봇': 'Freshener Bot', '새끼 스컹크': 'Baby Skunk',
    '왕비둘기': 'King Pigeon', '방독면 반장': 'Gas-Mask Chief', '맥반석 왕계란': 'King Sauna Egg', '곰돌이 대장': 'Bear Boss', '스컹크 대왕': 'Skunk King',
    '뿌지직!': 'BRRRT!'
  };
  // 중국어: 한국어 원문을 열쇠로 찾는다
  var Z = {
    '방귀라이크': '放屁幸存者', '방귀 서바이버': '放屁幸存者', '방귀': '放屁',
    '이어하기': '继续游戏', '상점': '商店', '도감': '图鉴', '계속': '继续', '홈': '首页', '새로고침': '换一批',
    '새로 시작할까요?': '要重新开始吗？', '확인': '确定', '취소': '取消', '도시락': '便当',
    '음식': '食物', '적': '敌人', '코인': '金币', '간식': '零食',
    '이동': '移动', '일시정지': '暂停',
    '학교 운동장': '学校操场', '지하철': '地铁', '찜질방': '汗蒸房', '놀이공원': '游乐园', '방향제 공장': '芳香剂工厂',
    '고구마': '红薯', '양배추': '卷心菜', '청국장': '臭豆酱汤', '콜라': '可乐', '우유': '牛奶', '불닭': '火鸡面',
    '계란': '鸡蛋', '번데기': '蚕蛹', '김치': '泡菜', '마늘': '大蒜', '탄산수': '苏打水', '멘토스': '薄荷糖', '시리얼': '麦片', '라이터': '打火机',
    '로켓 방귀': '火箭屁', '불방귀': '火焰屁', '시리얼 폭탄': '麦片炸弹', '지옥 구름': '地狱毒云', '매운 오라': '辣味光环', '연발 방귀': '连发屁',
    '가스 충전': '蓄气', '뿡 연사': '噗噗连射', '피해': '伤害', '구름 지속': '毒云持续', '크기': '大小',
    '방귀 대시': '放屁冲刺', '대시 거리': '冲刺距离', '큰 방귀 피해': '大屁伤害', '이동 속도': '移速', '독 냄새': '毒臭',
    '최대 체력': '最大生命', '회복': '回血', '밀쳐내기': '击退', '범위': '范围', '마늘 오라': '大蒜光环', '오라 피해': '光环伤害',
    '모으기 속도': '蓄力速度', '연쇄 폭발': '连环爆炸', '줍기 범위': '拾取范围', '뿡에 불씨': '噗噗带火',
    '방귀 로켓 돌진': '放屁火箭冲撞', '불꽃 고리': '火焰环', '불 뿡': '火噗噗', '시리얼 파편 12발': '12发麦片碎片',
    '따라가는 독구름': '追踪毒云', '오라 1.6배': '光环1.6倍', '뿡 3연발 조준': '瞄准3连噗',
    '체력': '生命', '배짱': '胆量', '힘': '力量', '신발': '鞋子', '자석': '磁铁', '방어': '防御', '행운': '幸运', '부활': '复活',
    '모든 피해': '全部伤害', '받는 피해': '受到伤害', '카드 새로고침': '换牌次数',
    '/초': '/秒',
    '모기': '蚊子', '비둘기': '鸽子', '강아지': '小狗', '잔소리 아줌마': '唠叨大妈', '방독면 청소부': '防毒清洁工', '양머리 아저씨': '羊角巾大叔',
    '맥반석 계란': '麦饭石鸡蛋', '풍선': '气球', '물총 소년': '水枪少年', '곰돌이 인형탈': '小熊人偶', '방향제 로봇': '芳香剂机器人', '새끼 스컹크': '小臭鼬',
    '왕비둘기': '鸽子王', '방독면 반장': '防毒班长', '맥반석 왕계란': '麦饭石鸡蛋王', '곰돌이 대장': '小熊老大', '스컹크 대왕': '臭鼬大王',
    '뿌지직!': '噗呲呲!'
  };
  // 일본어: 한국어 원문을 열쇠로 찾는다
  var J = {
    '방귀라이크': 'おならライク', '방귀 서바이버': 'おならサバイバー', '방귀': 'おなら',
    '이어하기': 'つづきから', '상점': 'ショップ', '도감': '図鑑', '계속': 'つづける', '홈': 'ホーム', '새로고침': '引き直し',
    '새로 시작할까요?': '最初からやり直す？', '확인': 'OK', '취소': 'キャンセル', '도시락': 'お弁当',
    '음식': '食べ物', '적': '敵', '코인': 'コイン', '간식': 'おやつ',
    '이동': '移動', '일시정지': '一時停止',
    '학교 운동장': '学校の校庭', '지하철': '地下鉄', '찜질방': 'チムジルバン', '놀이공원': '遊園地', '방향제 공장': '芳香剤工場',
    '고구마': 'さつまいも', '양배추': 'キャベツ', '청국장': '納豆チゲ', '콜라': 'コーラ', '우유': '牛乳', '불닭': '激辛ブルダック',
    '계란': 'たまご', '번데기': 'さなぎ', '김치': 'キムチ', '마늘': 'にんにく', '탄산수': '炭酸水', '멘토스': 'ミントキャンディ', '시리얼': 'シリアル', '라이터': 'ライター',
    '로켓 방귀': 'ロケットおなら', '불방귀': '炎のおなら', '시리얼 폭탄': 'シリアル爆弾', '지옥 구름': '地獄の雲', '매운 오라': '激辛オーラ', '연발 방귀': '連発おなら',
    '가스 충전': 'ガスチャージ', '뿡 연사': 'プッ連射', '피해': 'ダメージ', '구름 지속': '雲の持続', '크기': 'サイズ',
    '방귀 대시': 'おならダッシュ', '대시 거리': 'ダッシュ距離', '큰 방귀 피해': '大おならダメージ', '이동 속도': '移動速度', '독 냄새': '毒のにおい',
    '최대 체력': '最大体力', '회복': '回復', '밀쳐내기': 'ノックバック', '범위': '範囲', '마늘 오라': 'にんにくオーラ', '오라 피해': 'オーラダメージ',
    '모으기 속도': 'ため速度', '연쇄 폭발': '連鎖爆発', '줍기 범위': '拾う範囲', '뿡에 불씨': 'プッに火種',
    '방귀 로켓 돌진': 'おならロケット突進', '불꽃 고리': '炎の輪', '불 뿡': '火のプッ', '시리얼 파편 12발': 'シリアル破片12発',
    '따라가는 독구름': '追いかける毒雲', '오라 1.6배': 'オーラ1.6倍', '뿡 3연발 조준': 'ねらってプッ3連発',
    '체력': '体力', '배짱': '度胸', '힘': 'パワー', '신발': 'くつ', '자석': '磁石', '방어': '防御', '행운': '幸運', '부활': '復活',
    '모든 피해': '全ダメージ', '받는 피해': '被ダメージ', '카드 새로고침': 'カード引き直し',
    '/초': '/秒',
    '모기': '蚊', '비둘기': 'ハト', '강아지': '子犬', '잔소리 아줌마': '小言おばさん', '방독면 청소부': 'ガスマスク清掃員', '양머리 아저씨': 'タオル帽おじさん',
    '맥반석 계란': 'サウナたまご', '풍선': '風船', '물총 소년': '水鉄砲少年', '곰돌이 인형탈': 'クマの着ぐるみ', '방향제 로봇': '芳香剤ロボ', '새끼 스컹크': '子スカンク',
    '왕비둘기': 'キングバト', '방독면 반장': 'ガスマスク班長', '맥반석 왕계란': 'キングサウナたまご', '곰돌이 대장': 'クマ親分', '스컹크 대왕': 'スカンク大王',
    '뿌지직!': 'ブリブリッ!'
  };
  // 브라질 포르투갈어
  var P = {
    '방귀라이크': 'FARTLIKE', '방귀 서바이버': 'FARTLIKE', '방귀': 'PUM',
    '이어하기': 'CONTINUAR', '상점': 'LOJA', '도감': 'COLEÇÃO', '계속': 'CONTINUAR', '홈': 'INÍCIO', '새로고침': 'TROCAR',
    '새로 시작할까요?': 'Começar de novo?', '확인': 'OK', '취소': 'CANCELAR', '도시락': 'MARMITA',
    '음식': 'COMIDAS', '적': 'INIMIGOS', '코인': 'Moedas', '간식': 'Lanche',
    '이동': 'MOVER', '일시정지': 'PAUSAR',
    '학교 운동장': 'Pátio da Escola', '지하철': 'Metrô', '찜질방': 'Sauna Coreana', '놀이공원': 'Parque de Diversões', '방향제 공장': 'Fábrica de Aromatizador',
    '고구마': 'Batata-doce', '양배추': 'Repolho', '청국장': 'Sopa de Soja Fedida', '콜라': 'Refri', '우유': 'Leite', '불닭': 'Miojo Apimentado',
    '계란': 'Ovo', '번데기': 'Bicho-da-seda', '김치': 'Kimchi', '마늘': 'Alho', '탄산수': 'Água com Gás', '멘토스': 'Bala de Menta', '시리얼': 'Cereal', '라이터': 'Isqueiro',
    '로켓 방귀': 'Pum Foguete', '불방귀': 'Pum de Fogo', '시리얼 폭탄': 'Bomba de Cereal', '지옥 구름': 'Nuvem do Inferno', '매운 오라': 'Aura Picante', '연발 방귀': 'Pum em Rajada',
    '가스 충전': 'Carga de gás', '뿡 연사': 'Ritmo de pum', '피해': 'dano', '구름 지속': 'Duração da nuvem', '크기': 'tamanho',
    '방귀 대시': 'Arrancada de pum', '대시 거리': 'Distância da arrancada', '큰 방귀 피해': 'Dano do pum grande', '이동 속도': 'Velocidade', '독 냄새': 'Cheiro tóxico',
    '최대 체력': 'Vida máx.', '회복': 'Cura', '밀쳐내기': 'Empurrão', '범위': 'alcance', '마늘 오라': 'Aura de alho', '오라 피해': 'Dano da aura',
    '모으기 속도': 'Vel. de carga', '연쇄 폭발': 'Explosões em cadeia', '줍기 범위': 'Alcance de coleta', '뿡에 불씨': 'Pum com faísca',
    '방귀 로켓 돌진': 'Investida de pum foguete', '불꽃 고리': 'Anel de fogo', '불 뿡': 'puns de fogo', '시리얼 파편 12발': '12 lascas de cereal',
    '따라가는 독구름': 'Nuvem tóxica teleguiada', '오라 1.6배': 'Aura x1,6', '뿡 3연발 조준': '3 puns mirados',
    '체력': 'Vida', '배짱': 'Coragem', '힘': 'Força', '신발': 'Tênis', '자석': 'Ímã', '방어': 'Defesa', '행운': 'Sorte', '부활': 'Reviver',
    '모든 피해': 'Todo dano', '받는 피해': 'Dano recebido', '카드 새로고침': 'Trocas de carta',
    '/초': '/s',
    '모기': 'Mosquito', '비둘기': 'Pombo', '강아지': 'Cachorrinho', '잔소리 아줌마': 'Tia Reclamona', '방독면 청소부': 'Faxineiro de Máscara', '양머리 아저씨': 'Tio da Toalha na Cabeça',
    '맥반석 계란': 'Ovo de Sauna', '풍선': 'Balão', '물총 소년': 'Menino da Pistola d\'Água', '곰돌이 인형탈': 'Mascote de Urso', '방향제 로봇': 'Robô Aromatizador', '새끼 스컹크': 'Gambazinho',
    '왕비둘기': 'Rei Pombo', '방독면 반장': 'Chefe de Máscara', '맥반석 왕계란': 'Rei Ovo de Sauna', '곰돌이 대장': 'Chefão Urso', '스컹크 대왕': 'Rei Gambá',
    '뿌지직!': 'PRRRRT!'
  };
  // 러시아어
  var R = {
    '방귀라이크': 'FARTLIKE', '방귀 서바이버': 'FARTLIKE', '방귀': 'ПУК',
    '이어하기': 'ПРОДОЛЖИТЬ', '상점': 'МАГАЗИН', '도감': 'КОЛЛЕКЦИЯ', '계속': 'ДАЛЬШЕ', '홈': 'МЕНЮ', '새로고침': 'СМЕНИТЬ',
    '새로 시작할까요?': 'Начать заново?', '확인': 'OK', '취소': 'ОТМЕНА', '도시락': 'ЛАНЧБОКС',
    '음식': 'ЕДА', '적': 'ВРАГИ', '코인': 'Монеты', '간식': 'Перекус',
    '이동': 'ДВИЖЕНИЕ', '일시정지': 'ПАУЗА',
    '학교 운동장': 'Школьный двор', '지하철': 'Метро', '찜질방': 'Корейская баня', '놀이공원': 'Парк аттракционов', '방향제 공장': 'Завод освежителей',
    '고구마': 'Батат', '양배추': 'Капуста', '청국장': 'Вонючий соевый суп', '콜라': 'Кола', '우유': 'Молоко', '불닭': 'Острая лапша',
    '계란': 'Яйцо', '번데기': 'Куколки шелкопряда', '김치': 'Кимчи', '마늘': 'Чеснок', '탄산수': 'Газировка', '멘토스': 'Мятные конфеты', '시리얼': 'Хлопья', '라이터': 'Зажигалка',
    '로켓 방귀': 'Пук-ракета', '불방귀': 'Огненный пук', '시리얼 폭탄': 'Бомба из хлопьев', '지옥 구름': 'Адское облако', '매운 오라': 'Острая аура', '연발 방귀': 'Пук-очередь',
    '가스 충전': 'Заряд газа', '뿡 연사': 'Темп пуков', '피해': 'урон', '구름 지속': 'Время облака', '크기': 'размер',
    '방귀 대시': 'Пук-рывок', '대시 거리': 'Дальность рывка', '큰 방귀 피해': 'Урон большого пука', '이동 속도': 'Скорость', '독 냄새': 'Ядовитый запах',
    '최대 체력': 'Макс. здоровье', '회복': 'Реген', '밀쳐내기': 'Отбрасывание', '범위': 'радиус', '마늘 오라': 'Чесночная аура', '오라 피해': 'Урон ауры',
    '모으기 속도': 'Скорость заряда', '연쇄 폭발': 'Цепные взрывы', '줍기 범위': 'Радиус сбора', '뿡에 불씨': 'Поджог пуков',
    '방귀 로켓 돌진': 'Таран пук-ракетой', '불꽃 고리': 'Огненное кольцо', '불 뿡': 'огненные пуки', '시리얼 파편 12발': '12 осколков хлопьев',
    '따라가는 독구름': 'Самонаводящееся облако', '오라 1.6배': 'Аура x1,6', '뿡 3연발 조준': '3 прицельных пука',
    '체력': 'Здоровье', '배짱': 'Смелость', '힘': 'Сила', '신발': 'Кроссовки', '자석': 'Магнит', '방어': 'Защита', '행운': 'Удача', '부활': 'Воскрешение',
    '모든 피해': 'Весь урон', '받는 피해': 'Получаемый урон', '카드 새로고침': 'Смена карт',
    '/초': '/с',
    '모기': 'Комар', '비둘기': 'Голубь', '강아지': 'Щенок', '잔소리 아줌마': 'Тётя-ворчунья', '방독면 청소부': 'Уборщик в противогазе', '양머리 아저씨': 'Дядя в полотенце',
    '맥반석 계란': 'Банное яйцо', '풍선': 'Шарик', '물총 소년': 'Пацан с водомётом', '곰돌이 인형탈': 'Ростовой мишка', '방향제 로봇': 'Робот-освежитель', '새끼 스컹크': 'Скунсёнок',
    '왕비둘기': 'Король голубей', '방독면 반장': 'Начальник в противогазе', '맥반석 왕계란': 'Король банных яиц', '곰돌이 대장': 'Босс-мишка', '스컹크 대왕': 'Король скунсов',
    '뿌지직!': 'ПРРРРТ!'
  };
  var XD = XL === 'ja' ? J : XL === 'pt' ? P : XL === 'ru' ? R : null;
  var esc = function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var mk = function (o) { return new RegExp(Object.keys(o).sort(function (a, b) { return b.length - a.length; }).map(esc).join('|'), 'g'); };
  var re = mk(ZH ? Z : XD || D);
  window.L = function (s) {
    if (s == null) return s;
    if (ZH) return String(s).replace(re, function (m) { return Z[m]; });
    if (XD) return String(s).replace(re, function (m) { return XD[m]; });
    if (!EN) return s;
    return String(s).replace(re, function (m) { return D[m]; }).replace(/\/초/g, '/s');
  };
  if (!EN && !ZH && !XD) return;
  document.documentElement.lang = ZH ? 'zh-CN' : XL === 'ja' ? 'ja' : XL === 'pt' ? 'pt-BR' : XL === 'ru' ? 'ru' : 'en';
  if (ZH) {
    // 게임 글꼴에 없는 한자는 시스템 중국어 글꼴로
    var zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var st = document.createElement('style');
    st.textContent = "@font-face{font-family:'Cute';src:" + zf + ';unicode-range:' + ur + ';font-weight:400 900}html[lang=zh-CN] *{word-break:normal!important}@media (orientation:portrait){html[lang=zh-CN] #logo .a{font-size:min(19vw,15vh)}html[lang=zh-CN] #logo .b{font-size:min(14.6vw,11.5vh)}}';
    document.head.appendChild(st);
  }
  if (XL === 'ja') {
    // 게임 글꼴에 없는 가나·한자는 시스템 일본어 글꼴로
    var jf = "local('Hiragino Sans'),local('Hiragino Kaku Gothic ProN'),local('Yu Gothic UI'),local('Yu Gothic'),local('Yu Gothic Medium'),local('YuGothic-Medium'),local('Yu Gothic Regular'),local('YuGothic-Regular'),local('Yu Gothic Bold'),local('YuGothic-Bold'),local('MS PGothic'),local('MS Gothic'),local('Meiryo'),local('Noto Sans JP'),local('Noto Sans CJK JP'),local('Source Han Sans JP')";
    var jr = 'U+2E80-2FFF,U+3000-30FF,U+31F0-31FF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var sj = document.createElement('style');
    sj.textContent = "@font-face{font-family:'Cute';src:" + jf + ';unicode-range:' + jr + ';font-weight:400 900}html[lang=ja] *{word-break:normal!important}@media (orientation:portrait){html[lang=ja] #logo .a{font-size:min(19vw,15vh)}html[lang=ja] #logo .b{font-size:min(14.6vw,11.5vh)}}@media (max-height:480px){html[lang=ja] #logo .a{font-size:21vh}html[lang=ja] #logo .b{font-size:16.5vh}}';
    document.head.appendChild(sj);
  } else if (XL) {
    // 게임 글꼴에 없는 악센트 라틴·키릴 글자는 시스템 글꼴로
    var sl = document.createElement('style');
    sl.textContent = "@font-face{font-family:'Cute';src:local('Segoe UI'),local('Roboto'),local('Arial'),local('Helvetica Neue'),local('Helvetica');unicode-range:U+00A0-024F,U+0400-04FF,U+1E00-1EFF,U+2010-2027;font-weight:400 900}";
    document.head.appendChild(sl);
  }
  var fix = function (n) {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { var v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (var i = 0; i < n.childNodes.length; i++) fix(n.childNodes[i]);
    }
  };
  var start = function () {
    document.title = ZH ? '放屁幸存者' : XL === 'ja' ? 'おならライク' : 'FARTLIKE';
    // 제목은 두 줄 겹 글자라 통째로 바꾼다
    var a = document.querySelector('#logo .a'), b = document.querySelector('#logo .b');
    var ta = ZH ? '放屁' : XL === 'ja' ? 'おなら' : 'FART', tb = ZH ? '幸存者' : XL === 'ja' ? 'ライク' : 'LIKE';
    if (a && b) { a.dataset.t = ta; a.firstChild.textContent = ta; b.dataset.t = tb; b.firstChild.textContent = tb; }
    fix(document.body);
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') fix(m.target);
        else m.addedNodes.forEach(fix);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
