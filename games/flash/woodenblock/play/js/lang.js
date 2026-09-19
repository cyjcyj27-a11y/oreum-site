// ?lang=en 이면 화면 글자를 영어로 바꾼다 (사전 + MutationObserver)
(function () {
  const EN = /[?&]lang=en\b/.test(location.search);
  window.LANG = EN ? 'en' : 'ko';
  const D = {
    '나무블럭쌓기': 'WOODEN BLOCK',
    '나무블럭': 'WOODEN',
    '쌓기': 'BLOCK',
    '와르르!': 'CRASH!',
    '이어하기': 'CONTINUE',
    '상점': 'SHOP',
    '미션': 'MISSIONS',
    '장착': 'EQUIP',
    '사용 중': 'EQUIPPED',
    '홈': 'HOME',
    '계속': 'CONTINUE',
    '원목': 'Pine',
    '자작나무': 'Birch',
    '벚나무': 'Cherry',
    '호두나무': 'Walnut',
    '대나무': 'Bamboo',
    '파스텔': 'Pastel',
    '초콜릿': 'Chocolate',
    '대리석': 'Marble',
    '무지개': 'Rainbow',
    '얼음': 'Ice',
    '야광': 'Glow',
    '황금': 'Gold',
    '블록 10개 빼기': 'Pull 10 blocks',
    '블록 50개 빼기': 'Pull 50 blocks',
    '블록 200개 빼기': 'Pull 200 blocks',
    '한 판에 8개 빼기': 'Pull 8 in one game',
    '탑 22층': 'Tower 22 levels',
    '탑 26층': 'Tower 26 levels',
    '맨 아래 2층에서 빼기': 'Pull from the bottom 2 levels',
    'STAGE 5 클리어': 'Clear STAGE 5',
    'STAGE 15 클리어': 'Clear STAGE 15',
    'STAGE 30 클리어': 'Clear STAGE 30',
    '2 PLAYERS 한 판': 'Play 2 PLAYERS',
    '블록 4종 모으기': 'Collect 4 block sets',
  };
  const keys = Object.keys(D).sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  window.L = function (s) {
    if (!EN || s == null) return s;
    return String(s).replace(re, (m) => D[m]);
  };
  if (!EN) return;
  document.documentElement.lang = 'en';
  document.title = 'WOODEN BLOCK';
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
