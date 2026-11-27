// ?lang=en 이면 영어, ?lang=zh 이면 중국어로 화면 글자를 바꾼다 (사전 + MutationObserver). 캔버스 글자는 L() 로 감싼다
(function () {
  var EN = /[?&]lang=en\b/.test(location.search);
  var ZH = !EN && /[?&]lang=zh\b/.test(location.search);
  window.LANG = EN ? 'en' : ZH ? 'zh' : 'ko';
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
  var esc = function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var mk = function (o) { return new RegExp(Object.keys(o).sort(function (a, b) { return b.length - a.length; }).map(esc).join('|'), 'g'); };
  var re = mk(ZH ? Z : D);
  window.L = function (s) {
    if (s == null) return s;
    if (ZH) return String(s).replace(re, function (m) { return Z[m]; });
    if (!EN) return s;
    return String(s).replace(re, function (m) { return D[m]; }).replace(/\/초/g, '/s');
  };
  if (!EN && !ZH) return;
  document.documentElement.lang = ZH ? 'zh-CN' : 'en';
  if (ZH) {
    // 게임 글꼴에 없는 한자는 시스템 중국어 글꼴로
    var zf = "local('PingFang SC'),local('PingFangSC-Regular'),local('Microsoft YaHei'),local('Microsoft YaHei UI'),local('Noto Sans SC'),local('Noto Sans CJK SC'),local('Source Han Sans SC')";
    var ur = 'U+2E80-2FFF,U+3000-303F,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FF00-FFEF';
    var st = document.createElement('style');
    st.textContent = "@font-face{font-family:'Cute';src:" + zf + ';unicode-range:' + ur + ';font-weight:400 900}html[lang=zh-CN] *{word-break:normal!important}@media (orientation:portrait){html[lang=zh-CN] #logo .a{font-size:min(19vw,15vh)}html[lang=zh-CN] #logo .b{font-size:min(14.6vw,11.5vh)}}';
    document.head.appendChild(st);
  }
  var fix = function (n) {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { var v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (var i = 0; i < n.childNodes.length; i++) fix(n.childNodes[i]);
    }
  };
  var start = function () {
    document.title = ZH ? '放屁幸存者' : 'FARTLIKE';
    // 제목은 두 줄 겹 글자라 통째로 바꾼다
    var a = document.querySelector('#logo .a'), b = document.querySelector('#logo .b');
    var ta = ZH ? '放屁' : 'FART', tb = ZH ? '幸存者' : 'LIKE';
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
