// ?lang=en 이면 화면 글자를 영어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
    '윷놀이': 'YUT NORI',
    '장원': 'CHAMPION',
    '던지기': 'THROW',
    '잡았다!': 'CAUGHT!',
    '났다!': 'OUT!',
    '한 번 더': 'ONE MORE',
    '빽도': 'BACK-DO',
    '도깨비': 'Dokkaebi',
    '도': 'DO',
    '개구리': 'Frog',
    '개': 'GAE',
    '걸': 'GEOL',
    '윷': 'YUT',
    '모 10번': 'MO x10',
    '모': 'MO',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '홈': 'HOME',
    '계속': 'CONTINUE',
    '병아리': 'Chick',
    '토끼': 'Rabbit',
    '고양이': 'Cat',
    '꿀꿀이': 'Piggy',
    '여우': 'Fox',
    '곰': 'Bear',
    '호랑이': 'Tiger',
    '할머니': 'Grandma',
    '할아버지': 'Grandpa',
    '용': 'Dragon',
    '강아지': 'Puppy',
    '소나무': 'Pine',
    '밤나무': 'Chestnut',
    '대나무': 'Bamboo',
    '자작나무': 'Birch',
    '먹감나무': 'Ebony',
    '옻칠': 'Lacquer',
    '자개': 'Pearl',
    '옥': 'Jade',
    '금박': 'Gold',
    '얼음': 'Ice',
    '무지개': 'Rainbow',
    '야광': 'Glow',
    '첫 승리': 'First win',
    '10승': '10 wins',
    '잡기 20번': 'Catch 20 pieces',
    '한 판에 4번 잡기': 'Catch 4 in one game',
    '빽도로 잡기': 'Catch with BACK-DO',
    '업어서 나기': 'Finish a stacked pair',
    '방 지름길로 나기': 'Finish via the center',
    'STAGE 6 클리어': 'Clear STAGE 6',
    'STAGE 12 클리어': 'Clear STAGE 12',
    '3 PLAYERS 한 판': 'Play 3 PLAYERS',
    '4 PLAYERS 한 판': 'Play 4 PLAYERS',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'YUT NORI';
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
