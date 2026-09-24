// ?lang=en 이면 화면 글자를 영어로 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
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
    '↑↑ 부스터를 18초마다 쓸 수 있어요 (다른 선수는 30초)': '↑↑ boost every 18 seconds (others: 30)',
    '아이템에 맞아도 금방 털고 일어나요 (도는 시간·느려지는 시간 절반)': 'Shakes off hits fast (half spin & slow time)',
    '최고 속도가 6% 더 빨라요': 'Top speed +6%',
    '무한 모드': 'ENDLESS',
    '조향': 'STEER', '가속': 'GAS', '브레이크': 'BRAKE', '드리프트': 'DRIFT', '아이템': 'ITEM',
    '1컵': 'CUP 1',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'JEJU KART RACING';
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
  if (document.body) start();
  else addEventListener('DOMContentLoaded', start);
})();
