// ?lang=en 이면 화면 글자를 영어로 (사전 + MutationObserver). 캔버스 글자는 L() 로 감싼다
(function () {
  var EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
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
  var keys = Object.keys(D).sort(function (a, b) { return b.length - a.length; });
  var re = new RegExp(keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, function (m) { return D[m]; }).replace(/\/초/g, '/s');
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
  var fix = function (n) {
    if (n.nodeType === 3) {
      if (/[가-힣]/.test(n.nodeValue)) { var v = window.L(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    } else if (n.nodeType === 1) {
      for (var i = 0; i < n.childNodes.length; i++) fix(n.childNodes[i]);
    }
  };
  var start = function () {
    document.title = 'FARTLIKE';
    // 제목은 두 줄 겹 글자라 통째로 바꾼다
    var a = document.querySelector('#logo .a'), b = document.querySelector('#logo .b');
    if (a && b) { a.dataset.t = 'FART'; a.firstChild.textContent = 'FART'; b.dataset.t = 'LIKE'; b.firstChild.textContent = 'LIKE'; }
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
